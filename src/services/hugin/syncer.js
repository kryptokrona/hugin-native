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
        const wireHex = '99' + tx.hash + tx.cipher;
        await this.check_for_pm(wireHex, tx.hash, background);
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
    if (!wire) return false;

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
    if (!opened) return false;

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

    // First contact: save them as a contact + open the direct beam.
    const known = (await getContacts()).some((c) => c.address === opened.from);
    if (!known) {
      const added = await addContact(opened.name || 'Anon', opened.from, '');
      if (added) Beam.new(opened.from);
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
