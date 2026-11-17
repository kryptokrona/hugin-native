// React Native side of DM receiving. The DM payloads (hugin-network/dm) are opened here, in
// Hermes, by the wallet's DmCrypto (./dm.js); the Bare worklet only carries the bytes.
//
// Two entry points:
//   1. The periodic node poll below (`tick`): node pool entries `{ hash, cipher, timestamp }`
//      go through `decrypt_batch` (DmCrypto.openPool: each pool hash is opened once).
//   2. The bridge's `beam-message` event (src/lib/rpc.js): a payload from a DM swarm goes
//      through `check_for_pm`; with the swarm's contact address as `from`, a payload written by
//      another address is refused.
// An opened message adds its sender as a contact (and opens the DM swarm) when it is a new one,
// and is saved. The contact's handshake state is saved by DmCrypto before the message is
// returned.

import {
  saveMessage,
  addContact,
  getContacts,
  messageExists,
  saveFileInfo,
} from '../bare/sqlite';
import { setLatestMessages, updateMessage } from '../bare/contacts';
import { Nodes, Beam } from 'lib/native';
import { dmCrypto, DM_STATUS } from './dm';

const SYNC_INTERVAL_MS = 3000;
const MAX_STARTUP_RUNS = 10;
// Pool entries opened per decrypt_batch call; a sync answer is opened in slices of this size.
const MAX_BATCH = 299;
// hugin-node answers a sync with at most this many entries: the newest ones after `timestamp`,
// oldest first (hugin-node MAX_SYNC_MESSAGES, hugin-network MAX_NODE_SYNC_MESSAGES).
export const NODE_SYNC_LIMIT = 500;
// The next sync asks from this long before the newest entry of an answer (and never after the
// local clock), so that a post that reaches the pool after a later one is still in an answer.
// Entries seen before are skipped by DmCrypto.openPool.
export const SYNC_OVERLAP_MS = 30000;

/**
 * The `timestamp` of the next sync after an answer `entries` to a sync from `since`: the newest
 * entry timestamp (at most `now`) less SYNC_OVERLAP_MS, and never earlier than `since`.
 */
export function nextSyncTimestamp(entries, since, now) {
  let newest = 0;
  for (const entry of entries) {
    const t = Number(entry?.timestamp);
    if (Number.isFinite(t) && t > newest) newest = t;
  }
  if (newest === 0) return since;
  return Math.max(since, Math.min(newest, now) - SYNC_OVERLAP_MS);
}

/** `entries` in consecutive slices of at most `size`, in order. */
export function slices(entries, size = MAX_BATCH) {
  const out = [];
  for (let i = 0; i < entries.length; i += size) out.push(entries.slice(i, i + size));
  return out;
}

class Syncer {
  constructor() {
    this.node = {};
    this.keys = {}; // { privateSpendKey, privateViewKey } (DMs are opened with the wallet's keys, ./dm.js)
    this.lastChecked = 0;
    this.startup_runs = 0;
    this.sync_stopped = false;
    this.sync_interval = null;
    this.busy = false;
  }

  async init(node, keys) {
    this.node = node;
    this.keys = keys;
    this.lastChecked = 0;
    this.startup_runs = 0;
    this.sync_stopped = false;
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

  /**
   * One sync request from `lastChecked`. Resolves `{ resp, background }` with the answer's
   * entries, or false for an empty answer. `lastChecked` moves to nextSyncTimestamp of the
   * answer, so that the next request asks for the entries after it.
   */
  async fetch() {
    const answer = await Nodes.sync({
      request: true,
      type: 'some',
      timestamp: this.lastChecked,
    });
    const resp = Array.isArray(answer?.resp) ? answer.resp : [];
    if (resp.length === 0) return false;
    this.lastChecked = nextSyncTimestamp(resp, this.lastChecked, Date.now());
    return { resp, background: answer.background };
  }

  /**
   * One poll: every entry of the answer is opened, in slices of MAX_BATCH. The next poll asks
   * for the entries after the answer's newest ones (nextSyncTimestamp); hugin-node answers with
   * the newest NODE_SYNC_LIMIT entries after `timestamp` and has no request for older ones. A
   * poll that is still running when the interval fires again is not overlapped.
   */
  async tick() {
    if (this.sync_stopped || this.busy) return;
    if (this.startup_runs >= MAX_STARTUP_RUNS) {
      this.stop();
      return;
    }
    this.startup_runs += 1;
    this.busy = true;
    try {
      const fetched = await this.fetch();
      if (!fetched) return;
      for (const slice of slices(fetched.resp, MAX_BATCH)) {
        await this.decrypt_batch(slice, fetched.background);
      }
    } catch (e) {
      console.log('[pm] node sync failed:', e?.message);
    } finally {
      this.busy = false;
    }
  }

  /** Opens node pool entries and saves the DMs among them (oldest first). */
  async decrypt_batch(list, background) {
    const dm = dmCrypto();
    if (!dm || !Array.isArray(list) || list.length === 0) return;
    let opened;
    try {
      opened = await dm.openPool(list);
    } catch (e) {
      console.log('[pm] pool batch not opened:', e?.message);
      return;
    }
    if (opened.errors > 0) {
      console.log(`[pm] ${opened.errors} pool entries not opened yet (tried again later)`);
    }
    for (const message of opened.messages) {
      try {
        await this.save_dm(message, background);
      } catch (e) {
        // One message that cannot be saved does not stop the batch.
      }
    }
  }

  /**
   * Opens one DM payload and saves it. `hash`: the node pool hash, when it came from the node
   * (default: the payload's message hash); `from`: the DM swarm's contact address, when it came
   * from a DM swarm. Returns true when a message was opened.
   */
  async check_for_pm(payload, hash, background, from) {
    if (typeof payload !== 'string') return false;
    const dm = dmCrypto();
    if (!dm) return false;
    const r = await dm.open(payload, { hash, from });
    if (r.status !== DM_STATUS.OK) {
      // not-dm and not-for-us are expected (payloads for other users); refused and error are
      // logged with their reason, which never contains message text.
      if (r.status === DM_STATUS.REFUSED || r.status === DM_STATUS.ERROR) {
        console.log(`[pm] DM ${r.status}: ${r.reason}`);
      }
      return false;
    }
    await this.save_dm(r.message, background);
    return true;
  }

  /** Adds the sender as a contact when new (and opens the DM swarm), then saves the message. */
  async save_dm(message, background) {
    const known = (await getContacts()).some((c) => c.address === message.from);
    if (!known) {
      const added = await addContact(message.name || 'Anon', message.from, '');
      if (added) Beam.new(message.from);
    }

    // Stored under the message id (the payload's messageHash, the pool hash for a pool entry):
    // the same message from the node, a push or the DM swarm is saved once.
    if (await messageExists(message.hash)) return true;

    const saved = await saveMessage(
      message.from,
      message.message,
      '',
      message.timestamp,
      message.hash,
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
