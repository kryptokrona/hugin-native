// Node-poll + decrypt loop, owned by Bare.
//
// Before: this lived in RN (src/services/hugin/syncer.js) and called
// hugin-crypto.extraDataToMessage on the RN side. That meant the RN bundle
// needed crypto and the wire format ping-ponged across the RPC bridge.
//
// Now: Bare polls Nodes.sync(), decrypts each tx via messages.decrypt_pm,
// and emits a `new-message` event to RN with the plaintext. RN side becomes
// a thin subscriber — no crypto on the renderer.

const { Hugin } = require('./account');
const { decrypt_pm } = require('./messages');
const hc = require('hugin-crypto');

const SYNC_INTERVAL_MS = 3000;
const MAX_STARTUP_RUNS = 10;
const MAX_BATCH = 299;

class Syncer {
  constructor() {
    this.Nodes = null;
    this.lastChecked = 0;
    this.startup_runs = 0;
    this.sync_stopped = false;
    this.sync_interval = null;
    this.incoming = [];
  }

  init(Nodes) {
    this.Nodes = Nodes;
    this.lastChecked = 0;
    this.startup_runs = 0;
    this.sync_stopped = false;
    this.incoming = [];
    this.start();
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
    // If we still have unprocessed messages from the last batch, don't poll
    // again — that would advance lastChecked past stuff we haven't handled.
    if (this.incoming.length > 0) return false;
    if (!this.Nodes) return false;

    const { resp, background } = await this.Nodes.sync({
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

    if (txs.length > MAX_BATCH || (txs.length > MAX_BATCH && had_backlog)) {
      this.incoming = txs;
      await this.decrypt_batch(this.take(MAX_BATCH), true, background);
      return;
    }

    await this.decrypt_batch(txs, false, background);
  }

  take(n) {
    const out = this.incoming.slice(0, n);
    this.incoming = this.incoming.slice(out.length);
    return out;
  }

  async decrypt_batch(list, queued, background) {
    for (const tx of list) {
      try {
        await this.decrypt_one(tx, background);
      } catch (e) {
        // Never let one bad message kill the loop.
      }
    }
  }

  async decrypt_one(tx, background) {
    const wireHex = '99' + tx.hash + tx.cipher;
    if (typeof wireHex !== 'string' || wireHex.length < 200) return;

    // Fast view-tag check: skip txs we can't possibly own. messages.decrypt_pm
    // also performs the full open; the tag check just lets us bail cheaply.
    if (!(await this.matches_view_tag(wireHex))) return;

    const result = await decrypt_pm(wireHex);
    if (!result) return;

    const { plaintext, hash } = result;
    Hugin.send('new-message', {
      from: plaintext.from,
      msg: plaintext.msg,
      name: plaintext.name,
      t: plaintext.t,
      hash: tx.hash || hash,
      txHash: tx.hash,
      background: !!background,
    });
  }

  async matches_view_tag(wireHex) {
    try {
      const wire = hc.decodeExtra(wireHex);
      if (!wire || !wire.vt || !wire.txKey) return false;
      // Re-derive on this side: gKD(txKey, myViewPriv) → cn_fast_hash → first 2.
      // We delegate to hugin-crypto's derivation primitives via openFriendRequest
      // returning false on view-tag miss — but doing a cheap pre-check here
      // avoids the full ECDH cost on most txs. Hugin-crypto already short-
      // circuits internally; for now we just let decrypt_pm do the work.
      return true;
    } catch (_) {
      return false;
    }
  }
}

module.exports = new Syncer();
