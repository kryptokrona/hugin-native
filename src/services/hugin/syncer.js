import {
  cnFastHash,
  generateKeyDerivation,
  setStoreContacts,
} from '@/services';
import {
  saveMessage,
  addContact,
  getContacts,
  messageExists,
  saveFileInfo,
} from '../bare/sqlite';
import { setLatestMessages, updateMessage } from '../bare/contacts';
import { extraDataToMessage } from 'hugin-crypto';
import { sleep } from '@/utils';
import { trimExtra } from '@/services/utils';
import { Nodes, Beam } from 'lib/native';
import { Wallet } from '@/services';

class Syncer {
  constructor() {
    this.node = {};
    this.incoming_pm_que = [];
    this.lastChecked = 0;
    this.incoming_messages = [];
    this.keys = {};
    this.known_keys = [];
    this.sync_interval = null;
    this.startup_sync_runs = 0;
    this.max_startup_sync_runs = 10;
    this.sync_stopped = false;
  }

  async init(node, known, keys) {
    this.node = node;
    this.lastChecked = 0;
    this.keys = keys;
    this.known_keys = known;
    this.startup_sync_runs = 0;
    this.sync_stopped = false;
    await this.start();
  }

    reset() {
    this.node = {};
    this.incoming_pm_que = [];
    this.lastChecked = 0;
    this.incoming_messages = [];
    this.keys = {};
    this.known_keys = [];
    this.startup_sync_runs = 0;
    this.sync_stopped = false;
    if (this.sync_interval) {
      clearInterval(this.sync_interval);
      this.sync_interval = null;
    }
  }

  async start() {
    if (this.sync_interval) {
      clearInterval(this.sync_interval);
      this.sync_interval = null;
    }
    this.sync_interval = setInterval(async () => {
      await this.sync();
    }, 3000);
  }

  stop_sync() {
    if (this.sync_stopped) return;
    this.sync_stopped = true;
    if (this.sync_interval) {
      clearInterval(this.sync_interval);
      this.sync_interval = null;
    }
    console.log('[syncer.js] Startup message sync finished, relying on node push updates.');
  }

  set_node(node) {
    this.node = node;
  }

  async fetch() {
    const incoming = this.incoming_messages.length > 0 ? true : false;
    //If we already have pending incoming unchecked messages, return
    //So we do not update the latest checked timestmap and miss any messages.
    console.log('[syncer.js] Fetching messages, do we have incoming?', incoming)
    if (incoming) return false;
    //Latest version, fetch more messages with last checked timestamp
    const lastChecked = this.lastChecked;

    const {resp, background} = await Nodes.sync({
      request: true,
      type: 'some',
      timestamp: lastChecked,
    }); 

    console.log('[syncer.js] Fetched messages:', resp)
    if (resp.length === 0) {
      console.log('[syncer.js] No messages fetched.')
      return false;
    }
    this.lastChecked = Date.now();

    return {resp, background};
  }

  restart_sync() {
    console.log("[syncer.js] Restarting sync..")
    this.sync_stopped = false;
    this.startup_sync_runs = 0;
    this.lastChecked = 0;
    this.start();
  }

  async sync() {
    if (this.sync_stopped) return;
    if (this.startup_sync_runs >= this.max_startup_sync_runs) {
      this.stop_sync();
      return;
    }
    console.log("[syncer.js] Trying to sync messages from node.")
    this.startup_sync_runs += 1;
    const incoming = this.incoming_messages.length > 0 ? true : false;
    //First start, set known pool txs
    const fetched = await this.fetch();
    console.log("[syncer.js] Fetched msgs:", fetched)
    if (!fetched && !incoming) {
      if (this.startup_sync_runs >= this.max_startup_sync_runs) this.stop_sync();
      return;
    }
    const {resp = [], background} = fetched || {};
    const transactions = resp;
    const large_batch = transactions.length > 299 ? true : false;

    if (large_batch || (large_batch && incoming)) {
      //Add to que
      console.log('[syncer.js] Adding que:', transactions.length);
      this.incoming_messages = transactions;
      //   Hugin.send('incoming-que', true);
    }

    if (this.incoming_pm_que.length) {
      this.clear_pm_que();
    }

    if (incoming || large_batch) {
      console.log('[syncer.js] Checking incoming messages:', this.incoming_messages.length);
      await this.decrypt(this.update_que(), true);
      // if (incoming_group_que.length) {
      //     await clear_group_que()
      // }
      return;
    }

    // if (transactions.length < 5) Hugin.send('incoming-que', false);
    console.log('[syncer.js] Incoming transactions', transactions.length);
    this.decrypt(transactions, false, background);
    if (this.startup_sync_runs >= this.max_startup_sync_runs) this.stop_sync();
  }

  async decrypt(list, que = false, background) {
    console.log('[syncer.js] Checking nr of txs:', list.length);
    for (const message of list) {
      console.log('[syncer.js] Checking message:', message);
      try {
        const thisHash = message.hash;
        const thisExtra = '99' + thisHash + message.cipher;

        if (!this.validate(thisExtra, thisHash)) {
          console.log('[syncer.js] Message is not valid.')
          continue;
        };
        if (thisExtra !== undefined && thisExtra.length > 200) {
          //Check for viewtag

          console.log('[syncer.js] Checking message for viewtag..')

          if (await this.check_for_viewtag(thisExtra)) {
            console.log('[syncer.js] Found a message with relevant view tag.')
            if (await messageExists(thisHash)) {
              console.log('[syncer.js] Message already exists.')
              continue;
            };
            console.log('[syncer.js] Starting checking message for pm..')
            await this.check_for_pm(thisExtra, thisHash, background);
            continue;
          }
        }
      } catch (err) {
        console.log('[syncer.js] Error decrypting...');
        console.log(err);
      }
    }
  }

  async check_for_pm(thisExtra, thisHash, background) {
    try {
    console.log('[syncer.js] Checking message for pm started..')
    console.log('[syncer.js] Keys:', this.keys)
    const [privateSpendKey, privateViewKey] = this.keys;
    console.log('[syncer.js] Keys:', privateSpendKey, privateViewKey)
    const keys = { privateSpendKey, privateViewKey };
    console.log('[syncer.js] Keys:', keys, 'Message:', thisExtra)
    let message = await extraDataToMessage(thisExtra, this.known_keys, keys);
    console.log('[syncer.js] Message to check', message)
    if (!message) return false;
    console.log('[syncer.js] FOUND A MESSAGE WOOHP ------->');
    const [text, addr, key, timestamp] = this.sanitize_pm(message);
    console.log('[syncer.js] Got message?', text);
    if (!text) return;
    if (message.type === 'sealedbox' || 'box') {
      if (!this.known_keys.some((a) => a === key)) {
        const added = await addContact(message?.name || 'Anon' , addr, key);
        console.log('[syncer.js] Added contact:', added);
        if (added) {
          this.known_keys.push(added.messagekey);
          const key = await Wallet.key_derivation_hash(addr);
          console.log('[syncer.js] Connecting to new contact:', key, addr);
          Beam.new(addr);
        }
      }
      const saved = await saveMessage(
        addr,
        text,
        '', //Todo reply
        timestamp,
        thisHash,
        false,
        undefined,
      );
      if (saved) {
        updateMessage(saved, background);
      }
      setLatestMessages();
      return true;
    }
    return;
    } catch (e) {
      console.log('[syncer.js] Error checking message for pm:', e);
      return false;
    }
  }

  async save_file_message(message) {
    const sent = message.conversation ? true : false;

    const saved = await saveMessage(
      sent ? message.conversation : message.address,
      message.message,
      '', //Todo reply
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

  async check_for_viewtag(extra) {
    try {
      const rawExtra = trimExtra(extra);
      const parsed_box = JSON.parse(rawExtra);
      if (parsed_box.vt) {
        console.log('[syncer.js] Found a message with view tag:', parsed_box.vt)
        const [privateSpendKey, privateViewKey] = this.keys;
        const derivation = await generateKeyDerivation(
          parsed_box.txKey,
          privateViewKey,
        );
        const hashDerivation = await cnFastHash(derivation);
        const possibleTag = hashDerivation.substring(0, 2);
        const view_tag = parsed_box.vt;
        if (possibleTag === view_tag) {
          console.log('[syncer.js] **** FOUND VIEWTAG ****');
          return true;
        }
      }
    } catch (err) {}
    return false;
  }

  validate(thisExtra, thisHash, fa) {
    if (typeof thisExtra !== 'string') return false;
    if (typeof thisHash !== 'string') return false;
    return true;
  }

  trim(json) {
    json = JSON.stringify(json)
      .replaceAll('.txPrefix', '')
      .replaceAll(
        'transactionPrefixInfo.txHash',
        'transactionPrefixInfotxHash',
      );

    json = JSON.parse(json);

    return json.addedTxs;
  }

  update_que() {
    const decrypt = this.incoming_messages.slice(0, 299);
    const update = this.incoming_messages.slice(decrypt.length);
    this.incoming_messages = update;
    return decrypt;
  }

  clear_pm_que() {
    const sorted = this.incoming_pm_que.sort((a, b) => a.t - b.t);
    for (const message of sorted) {
      // save_message(message)
      ///TODO ** SAVE here
    }
    this.incoming_pm_que = [];
  }

  sanitize_pm(msg) {
    let addr = msg.from;
    let timestamp = msg.t;
    let key = msg.k;
    let message = msg.msg;
    if (message?.length > 777 || msg.msg === undefined) return [false];
    if (addr?.length > 99 || addr === undefined) return [false];
    if (timestamp?.length > 25) return [false];
    if (key?.length > 64) return [false];

    return [message, addr, key, timestamp];
  }
}

export const MessageSync = new Syncer();
