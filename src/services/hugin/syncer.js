// Thin subscriber. The actual poll/decrypt loop now lives in Bare
// (bare/syncer.js); Bare emits `new-message` events with plaintext via the
// RPC bridge. This file just exposes the handler the bridge calls, plus a
// few small helpers other RN code still pokes at (file message save,
// set_node compatibility wrapper).

import {
  saveMessage,
  addContact,
  getContacts,
  messageExists,
  saveFileInfo,
} from '../bare/sqlite';
import { setLatestMessages, updateMessage } from '../bare/contacts';
import { Beam } from 'lib/native';

class Syncer {
  constructor() {
    this.node = {};
  }

  // Kept for back-compat with callers that still poke at the syncer:
  //   - wallet.js node() updates the node info
  // The actual Nodes connection lives in Bare and is set via init_bare;
  // RN doesn't need to re-init the loop.
  set_node(node) {
    this.node = node;
  }

  // The bridge (src/lib/rpc.js) calls this when Bare emits `new-message`.
  // Plaintext is already decrypted by hugin-crypto in Bare.
  async on_new_message({ from, msg, name, t, hash, background }) {
    try {
      if (await messageExists(hash)) return;

      const contacts = await getContacts();
      const known = contacts.some((c) => c.address === from);
      if (!known) {
        const added = await addContact(name || 'Anon', from, '');
        if (added) {
          // Open the p2p beam to this contact so future messages can travel
          // direct without going through the node.
          Beam.new(from);
        }
      }

      const saved = await saveMessage(from, msg, '', t, hash, false, undefined);
      if (saved) updateMessage(saved, background);
      setLatestMessages();
    } catch (e) {
      console.log('[syncer] on_new_message error:', e);
    }
  }

  // Beam-delivered messages (incoming) used to need RN-side decrypt;
  // Bare now decrypts via decrypt_pm before emitting beam-message events,
  // so this path is also just a save. Kept as a method so the bridge file
  // can call MessageSync.check_for_pm(...) without an interface change.
  async check_for_pm(plaintext, hash, background) {
    // For backwards-compat: if Bare ever still hands us a raw cipher string
    // (e.g. during the transition), forward it to the new event handler with
    // the same shape. The new bridge wires Bare's beam-message directly into
    // on_new_message, but we keep this here so legacy call sites don't crash.
    if (typeof plaintext === 'string') return;
    return this.on_new_message({ ...plaintext, hash, background });
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
