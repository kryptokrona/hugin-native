// RN-side poll + decrypt loop. Crypto runs in Hermes via the noble-based
// hugin-crypto package (ML-KEM-512 + double-encrypt). Bare just ferries
// network bytes; it doesn't see plaintext.
//
// Two entry points hit `check_for_pm`:
//   1. The periodic node poll below (this file's `tick`).
//   2. The bridge's `beam-message` event handler (rpc.js), which forwards
//      raw cipher hex it received over a p2p beam.

import {
  saveMessage,
  addContact,
  getContacts,
  messageExists,
  saveFileInfo,
} from '../bare/sqlite';
import { setLatestMessages, updateMessage } from '../bare/contacts';
import {
  openFriendRequest,
  decodeExtra,
  messageHash,
  hexToUint,
} from 'hugin-crypto';
import { sleep } from '@/utils';
import { Nodes, Beam } from 'lib/native';
import {
  identitySecretKeyBytes,
  getContactCrypto,
  onReceivedPeerKemPub,
  onReceivedKemCapsule,
} from './identity';

const SYNC_INTERVAL_MS = 3000;
const MAX_STARTUP_RUNS = 10;
const MAX_BATCH = 299;

class Syncer {
  constructor() {
    this.node = {};
    this.keys = {}; // { privateSpendKey, privateViewKey }
    this.lastChecked = 0;
    this.startup_runs = 0;
    this.sync_stopped = false;
    this.sync_interval = null;
    this.incoming = [];
  }

  async init(node, keys) {
    this.node = node;
    this.keys = keys;
    this.lastChecked = 0;
    this.startup_runs = 0;
    this.sync_stopped = false;
    this.incoming = [];
    this.start();
  }

  set_node(node) {
    this.node = node;
  }

  start() {
    if (this.sync_interval) clearInterval(this.sync_interval);
    this.sync_interval = setInterval(() => this.tick(), SYNC_INTERVAL_MS);
  }

  stop() {
    if (this.sync_stopped) return;
    this.sync_stopped = true;
    if (this.sync_interval) {
      clearInterval(this.sync_interval);
      this.sync_interval = null;
    }
  }

  restart() {
    this.sync_stopped = false;
    this.startup_runs = 0;
    this.lastChecked = 0;
    this.start();
  }

  async fetch() {
    if (this.incoming.length > 0) return false;
    const { resp, background } = await Nodes.sync({
      request: true,
      type: 'some',
      timestamp: this.lastChecked,
    });
    if (!resp || resp.length === 0) return false;
    this.lastChecked = Date.now();
    return { resp, background };
  }

  async tick() {
    if (this.sync_stopped) return;
    if (this.startup_runs >= MAX_STARTUP_RUNS) {
      this.stop();
      return;
    }
    this.startup_runs += 1;

    const had_backlog = this.incoming.length > 0;
    const fetched = await this.fetch();
    if (!fetched && !had_backlog) return;
    const { resp = [], background } = fetched || {};
    const txs = resp;

    if (txs.length > MAX_BATCH) {
      this.incoming = txs;
      await this.decrypt_batch(this.take(MAX_BATCH), background);
      return;
    }
    await this.decrypt_batch(txs, background);
  }

  take(n) {
    const out = this.incoming.slice(0, n);
    this.incoming = this.incoming.slice(out.length);
    return out;
  }

  async decrypt_batch(list, background) {
    for (const tx of list) {
      try {
        // hugin-crypto's encodeExtra emits bare hex(JSON) — no prefix. No
        // point reconstructing a fake '99'+hash tx-extra prefix just to have
        // trimExtra() strip it back off. Passing the cipher through raw also
        // makes the fallback messageHash(extraOrWire) in check_for_pm match
        // whatever the sender actually hashed (also over the raw cipher).
        await this.check_for_pm(tx.cipher, tx.hash, background);
      } catch (e) {
        // Never let one bad message kill the loop.
      }
    }
  }

  /**
   * Decrypt one wire payload + persist. Shared between the poll path and
   * the beam-message bridge handler.
   */
  async check_for_pm(extraOrWire, hashHint, background) {
    if (typeof extraOrWire !== 'string') return false;
    const wire = decodeExtra(extraOrWire);
    if (!wire) {
      console.log('[pm] decodeExtra rejected wire — falling through');
      return false;
    }

    const identitySecret = await identitySecretKeyBytes();
    const messageKeyResolver = async (from) => {
      const c = await getContactCrypto(from);
      return c.messageKey || null;
    };

    const opened = await openFriendRequest(
      wire,
      {
        privateViewKey: this.keys.privateViewKey,
        getMessageKey: messageKeyResolver,
      },
      identitySecret,
    );
    if (!opened) {
      // Almost always "not for us" (view-tag miss): every online client sees
      // every wire message and drops the ones that don't match. Logged so a
      // truly stuck decrypt (bad key, sig mismatch) doesn't just vanish.
      console.log('[pm] openFriendRequest returned false (view-tag miss or decrypt failure)');
      return false;
    }

    // First contact: save them as a contact + open the direct beam BEFORE we
    // persist any handshake state. A friend request is the first message we
    // ever see from `opened.from`, so without this bootstrap the KEM state
    // handlers below would UPDATE a non-existent row (their internal
    // INSERT OR IGNORE seed makes that survive, but this keeps the row shape
    // clean with the real name + latestmessage from the start).
    const known = (await getContacts()).some((c) => c.address === opened.from);
    if (!known) {
      const added = await addContact(opened.name || 'Anon', opened.from, '');
      if (added) Beam.new(opened.from);
    }

    // Persist any handshake progress BEFORE saving the message, so a later
    // outgoing send picks up the new state (pending kem_ct, fresh messageKey).
    if (opened.handshake?.peerKemPub) {
      // Peer's initial — encapsulate, save shared secret + pending ct.
      await onReceivedPeerKemPub(opened.from, opened.handshake.peerKemPub);
    } else if (opened.handshake?.sharedSecret) {
      // Peer's first reply — they shipped us a kem capsule, hugin-crypto
      // decapsulated for us. Persist the derived secret as their messageKey.
      await onReceivedKemCapsule(opened.from, opened.handshake.sharedSecret);
    }

    // Symmetric to the outgoing "[ml-kem] Message to <addr> is quantum-encrypted"
    // log. `opened.type === 'message'` is set by hugin-crypto only when the
    // outer wire carried a nested `box` that we then inner-decrypted with the
    // ML-KEM-derived key. Plaintext friend-requests return 'friend-request'.
    if (opened.type === 'message') {
      console.log(`[ml-kem] Message from ${opened.from} was quantum-decrypted (ML-KEM shared secret).`);
    } else {
      console.log(`[pm] Decrypted plaintext friend-request from ${opened.from}.`);
    }

    const hash = hashHint || messageHash(extraOrWire);
    if (await messageExists(hash)) return true;

    const saved = await saveMessage(
      opened.from,
      opened.msg,
      '',
      opened.t,
      hash,
      false,
      undefined,
    );
    if (saved) updateMessage(saved, !!background);
    setLatestMessages();
    return true;
  }

  async save_file_message(message) {
    const sent = message.conversation ? true : false;
    const saved = await saveMessage(
      sent ? message.conversation : message.address,
      message.message,
      '',
      message.timestamp,
      message.hash,
      sent,
      sent ? message.address : undefined,
    );
    await saveFileInfo(message.file);
    if (saved) {
      saved.file = message.file;
      updateMessage(saved);
    }
    setLatestMessages();
    return true;
  }
}

export const MessageSync = new Syncer();
