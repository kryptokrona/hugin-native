import {
  cnFastHash,
  generateKeyDerivation,
  setStoreContacts,
} from '@/services';
import { saveMessage, addContact, getContacts } from '../bare/sqlite';
import { setLatestMessages, updateMessage } from '../bare/contacts';
import { extraDataToMessage } from 'hugin-crypto';
import { sleep } from '@/utils';
import { trimExtra } from '@/services/utils';
class Syncer {
  constructor() {
    this.node = {};
    this.incoming_pm_que = [];
    this.lastChecked = 0;
    this.incoming_messages = [];
    this.keys = {};
    this.known_keys = [];
  }

  async init(node, known, keys) {
    this.node = node;
    this.lastChecked = Math.floor(Date.now() / 1000) - 60 * 60 * 24;
    this.keys = keys;
    this.known_keys = known;
    await this.start();
  }

  async start() {
    while (true) {
      await sleep(3000);
      await this.sync();
    }
  }

  async get_pool() {
    const lastChecked = this.lastChecked;
    this.lastChecked = Math.floor(Date.now() / 1000);
    const payload = {
      method: 'POST',
      body: JSON.stringify({ timestampBegin: lastChecked }),
    };
    const protocol = 'https://';
    const input = this.node.url + ':' + this.node.port.toString() + '/get_pool';
    try {
      const resp = await fetch(protocol + input, payload);
      return await resp.json();
    } catch (e) {
      //Try http
      try {
        const protocol = 'http://';
        const resp = await fetch(protocol + input, payload);
        return await resp.json();
      } catch (e) {
        //Node error
        return false;
      }
    }
  }

  async fetch() {
    const incoming = this.incoming_messages.length > 0 ? true : false;
    let json;
    try {
      //If we already have pending incoming unchecked messages, return
      //So we do not update the latest checked timestmap and miss any messages.
      if (incoming) return false;
      //Latest version, fetch more messages with last checked timestamp
      json = await this.get_pool();
      if (!json) {
        console.log('Error syncing json from get_pool:');
        return false;
      }
      const transactions = this.trim(json);
      //Try clearing known pool txs from checked
      if (transactions.length === 0) {
        console.log('No incoming messages...');
        return false;
      }

      return transactions;
    } catch (e) {
      //   Hugin.send('sync', 'Error');
      console.log('Sync error', e);
      return false;
    }
  }

  async sync() {
    console.log('Background syncing...');
    const incoming = this.incoming_messages.length > 0 ? true : false;
    //First start, set known pool txs
    const transactions = await this.fetch();
    if (!transactions && !incoming) return;
    const large_batch = transactions.length > 299 ? true : false;

    if (large_batch || (large_batch && incoming)) {
      //Add to que
      console.log('Adding que:', transactions.length);
      this.incoming_messages = transactions;
      //   Hugin.send('incoming-que', true);
    }

    if (this.incoming_pm_que.length) {
      this.clear_pm_que();
    }

    if (incoming || large_batch) {
      console.log('Checking incoming messages:', this.incoming_messages.length);
      await this.decrypt(this.update_que(), true);
      // if (incoming_group_que.length) {
      //     await clear_group_que()
      // }
      return;
    }

    // if (transactions.length < 5) Hugin.send('incoming-que', false);
    console.log('Incoming transactions', transactions.length);
    this.decrypt(transactions, false);
  }

  async decrypt(transactions, que = false) {
    console.log('Checking nr of txs:', transactions.length);
    for (const transaction of transactions) {
      try {
        const thisExtra = transaction.transactionPrefixInfo.extra;
        const thisHash = transaction.transactionPrefixInfotxHash;
        if (!this.validate(thisExtra, thisHash)) continue;
        if (thisExtra !== undefined && thisExtra.length > 200) {
          //Check for viewtag

          if (await this.check_for_viewtag(thisExtra)) {
            await this.check_for_pm(thisExtra, thisHash, que);
            continue;
          }
          //Check for private message //TODO remove this when viewtags are active
          // if (await this.check_for_pm(thisExtra, que)) continue;
          //Check for group message
          //   if (await check_for_group_message(thisExtra, thisHash, que)) continue;
        }
      } catch (err) {
        console.log('Error decrypting...');
        console.log(err);
      }
    }
  }

  async check_for_pm(thisExtra, thisHash, que = false) {
    const [privateSpendKey, privateViewKey] = this.keys;
    const keys = { privateSpendKey, privateViewKey };
    let message = await extraDataToMessage(thisExtra, this.known_keys, keys);
    if (!message) return false;
    console.log('FOUND A MESSAGE WOOHP ------->');
    console.log('', message);
    if (message.type === 'sealedbox' || 'box') {
      message.sent = false;
      if (que) {
        this.incoming_pm_que.push(message);
        return true;
      }

      const added = await addContact(message.from, message.from, message.k);
      const saved = await saveMessage(
        message.from,
        message.msg,
        message.r,
        message.t,
        thisHash,
        false,
        undefined,
      );
      if (saved) {
        updateMessage(saved);
      }
      if (added) {
        this.known_keys.push(added.messagekey);
        setStoreContacts([...(await getContacts()), added]);
      }
      setLatestMessages();
      return true;
    }
  }

  async check_for_viewtag(extra) {
    try {
      const rawExtra = trimExtra(extra);
      const parsed_box = JSON.parse(rawExtra);
      if (parsed_box.vt) {
        const [privateSpendKey, privateViewKey] = this.keys;
        const derivation = await generateKeyDerivation(
          parsed_box.txKey,
          privateViewKey,
        );
        const hashDerivation = await cnFastHash(derivation);
        const possibleTag = hashDerivation.substring(0, 2);
        const view_tag = parsed_box.vt;
        if (possibleTag === view_tag) {
          console.log('**** FOUND VIEWTAG ****');
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
}

export const MessageSync = new Syncer();
