import * as NaclSealed from 'tweetnacl-sealed-box';

import { Address, CryptoNote } from 'kryptokrona-utils';
import { Beam, get_sealed_box, Nodes } from '../../lib/native';
import { Daemon, WalletBackend } from 'kryptokrona-wallet-backend-js';
import {
  cnFastHash,
  generateDeterministicSubwalletKeys,
  generateKeyDerivation,
  generateKeys,
  makePostRequest,
  processBlockOutputs,
} from '../NativeTest';
import { hexToUint, parse, toHex } from '../utils';
import {
  joinAndSaveRoom,
  saveRoomMessageAndUpdate,
  setRoomMessages,
} from '../bare';
import { keychain, nonceFromTimestamp, randomKey } from '../bare/crypto';
import {
  loadWallet,
  saveRoomToDatabase,
  saveWallet,
} from '../../services/bare/sqlite';
import {
  setBalance,
  setStoreAddress,
  setStoreCurrentRoom,
  setSyncStatus,
  setTransactions,
  useUserStore,
  useGlobalStore
} from '@/services';

import Clipboard from '@react-native-clipboard/clipboard';
import { MessageSync } from '../hugin/syncer';
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { WalletConfig } from 'config/wallet-config';
import naclUtil from 'tweetnacl-util';
import { privateKeys } from './privates';
import { t } from 'i18next';
import tweetnacl from 'tweetnacl';
import { getDeviceId } from '../../services/pushnotifications';
import * as Keychain from 'react-native-keychain';
import { fetchWithTimeout } from '@/utils';

const xkrUtils = new CryptoNote();
export class ActiveWallet {
  constructor() {
    this.active = undefined;
    this.loaded = false;
    this.address = undefined;
    this.nodeUrl = undefined;
    this.nodePort = undefined;
    this.started = false;
    this.deadNodeEmitted = false;
    this.messageKeys = undefined;
  }

  async init(node) {
    console.log('Init wallet!');
    this.setDaemon(node);
    if (!(await this.load())) return false;
    this.loaded = true;
    return true;
  }

  async reset() {
    if (this.started && this.active) {
      try {
        await this.active.stop();
      } catch (e) {
        console.warn('Error stopping wallet during reset:', e);
      }
    }

    this.active = undefined;
    this.loaded = false;
    this.address = undefined;
    this.nodeUrl = undefined;
    this.nodePort = undefined;
    this.started = false;
    this.deadNodeEmitted = true;
    this.messageKeys = undefined;
    this.daemon = undefined;

    console.log('Wallet has been reset.');
  }

  async joinBetaRoom(nickname) {
    return;
  }

  async create(node, nickname) {
    this.setDaemon(node);
    try {
      console.log(
        'Creating wallet with online wallet backend:',
        WalletBackend != undefined,
      );
      this.active = await WalletBackend.createWallet(this.daemon, WalletConfig);
    } catch (err) {
      console.log('Creating wallet failed!', err);
    }
    this.address = this.addresses()[0];
    console.log('Created wallet with address:', this.address);
    this.loaded = true;
    await this.joinBetaRoom(nickname);
    // await this.start();
    await this.save();
  }

  async save() {
    if (!this.loaded) return;
    try {
      console.log('Saving wallet!');
      console.log('--------------->');
      const walletJSON = this.active.toJSONString();
      console.log(
        'Saving wallet with size:',
        JSON.stringify(walletJSON).length,
      );
      await saveWallet(walletJSON);
    } catch (err) {
      console.log(err);
    }
  }

  async load() {
    console.log('Loading wallet...');
    console.log('--------------->');
    const [walletData, walletDbError] = await loadWallet();
    if (walletDbError) {
      console.log('Wallet loading error');
      return false;
    }

    const wallet = parse(walletData);
    if (!wallet) return false;

    console.log('Wallet parsed...');
    const [loadedWallet, walletError] = await WalletBackend.loadWalletFromJSON(
      this.daemon,
      wallet,
      WalletConfig,
    );

    if (walletError) {
      console.log('Error: ', walletError);
      return false;
    }
    console.log('Starting...');

    this.active = loadedWallet;
    this.address = this.addresses()[0];

    console.log('Loaded wallet:');
    console.log('--------------->');
    console.log('Wallet address:', this.address);

    await this.start();

    return true;
  }

  async import(height, seed, node, nickname) {
    this.setDaemon(node);
    const [wallet, error] = await WalletBackend.importWalletFromSeed(
      this.daemon,
      parseInt(height),
      seed.toLowerCase(),
      WalletConfig,
    );

    if (error) {
      console.log('Error importing wallet:', error);
      return false;
    }
    this.active = wallet;
    this.address = this.addresses()[0];
    this.loaded = true;
    await this.save();
    await this.start();
    await this.joinBetaRoom(nickname);
    return true;
  }

  addresses() {
    return this.active.getAddresses();
  }

  async getAndSetBalance() {
    let [unlockedBalance, lockedBalance] = await this.active.getBalance();
    setBalance([unlockedBalance, lockedBalance]);
    const transactions = await this.active.getTransactions();
    const filteredTransactions = transactions.filter(
      (transaction) => transaction.totalAmount() >= 10000,
    );
    setTransactions(filteredTransactions);
  }

  setDaemon(node) {
    this.daemon = new Daemon(node.url, node.port);
    this.daemon.makePostRequest = makePostRequest;
    this.nodeUrl = node.url;
    this.nodePort = node.port;
  }

  spendKey() {
    return this.active.getPrimaryAddressPrivateKeys()[0];
  }

  privateKeys() {
    return this.active.getPrimaryAddressPrivateKeys();
  }

  getIOSkey() {
    // All iOS users gets free Hugin+ accounts because
    // Apple does not allow third party payments yet.

    //Get a random pre paid private key pair from a list

    if (Platform.OS !== 'ios') {
      return;
    }
    const key = privateKeys[Math.floor(Math.random() * privateKeys.length)];
    return key;
  }

  async messageKeyPair() {
    if (this.messageKeys) return this.messageKeys;
    const priv = Platform.OS === 'android' ? this.spendKey() : this.getIOSkey();
    const keys = await generateDeterministicSubwalletKeys(priv, 1);
    const address = await Address.fromSeed(keys.private_key);
    const pub = address.m_keys.m_spendKeys.m_publicKey;
    const signKey = address.m_keys.m_spendKeys.m_privateKey;
    return [signKey, pub];
  }

  async sign(message, standard) {
    const keys = standard ? this.privateKeys() : await this.messageKeyPair();
    return await xkrUtils.signMessage(message, keys[0]);
  }

  async verify(message, address, signature) {
    try {
      const sekrAddr = await Address.fromAddress(address);
      const verify = await xkrUtils.verifyMessageSignature(
        message,
        sekrAddr.spend.publicKey,
        signature,
      );
      return verify;
    } catch (e) {
      return false;
    }
  }

  async start() {
    console.log('Start this wallet ->', this.address);
    setStoreAddress(this.address);
    this.active.setBlockOutputProcessFunc(processBlockOutputs);
    this.active.enableAutoOptimization(false);
    this.active.scanPoolTransactions(false);

    setTimeout(() => {
      this.deadNodeEmitted = false;
    }, 10000);

    this.active.on('deadnode', async () => {
      if (!this.deadNodeEmitted) {
        this.deadNodeEmitted = true;
        let response;
        try {
          response = await fetchWithTimeout(`https://${this.nodeUrl}:${this.nodePort}/info`, {});
        } catch (e) {
         try {
          response = await fetchWithTimeout(`http://${this.nodeUrl}:${this.nodePort}/info`, {});
        } catch (e) {
        } 
        }
        if (response?.ok == true) {
          return;
        }
        Toast.show({
          text1: 'Your node has gone offline',
          type: 'success',
        });
      }
    });

    await this.active.start();
    await this.create_message_wallet();
    this.messageKeys = await this.messageKeyPair();
    this.optimize_message_inputs();
    this.getAndSetBalance();
    this.getAndSetSyncStatus();
    this.started = true;
    console.log('Wallet started');

    setInterval(() => this.save(), 30000);
    //Incoming transaction event
    this.active.on('incomingtx', async (transaction) => {
      console.log('Incoming tx!', transaction);
      this.optimize_message_inputs();
      this.getAndSetBalance();
    });

    this.active.on('createdtx', async (tx) => {
      console.log('***** outgoing *****', tx);
      this.getAndSetBalance();
      await this.save();
    });

    //Wallet heightchange event with funtion that saves wallet only if we are synced
    this.active.on(
      'heightchange',
      async (walletBlockCount, localDaemonBlockCount, networkBlockCount) => {
        this.deadNodeEmitted = false;
        let synced = networkBlockCount - walletBlockCount <= 2;
        if (walletBlockCount % 100 === 0) {
          this.getAndSetSyncStatus();
          console.log('walletBlockCount', walletBlockCount);
          console.log('networkBlockCount', networkBlockCount);
        }

        if (walletBlockCount === 0) {
          await this.active.reset(networkBlockCount - 100);
        }

        if (networkBlockCount === 0) return;
        if (synced) {
          console.log('**********');
          console.log('**Synced**');
          console.log('**********');
          this.getAndSetBalance();
          this.getAndSetSyncStatus();
          //Send synced event to frontend
          //   this.emit('sync', 'Synced');
        }
      },
    );
    try {
        const key = Buffer.from(keychain.getKeyPair().secretKey).toString('hex');
        const pubKey = Buffer.from(keychain.getKeyPair().publicKey).toString('hex');
        await Keychain.setGenericPassword('encryption', key+pubKey, {
          accessible: Keychain.ACCESSIBLE.ALWAYS,
        });
        console.log('🔐 Key saved securely.');
    } catch (err) {
      console.error('❌ Failed to store encryption key:', err);
    }
  }

  async send(tx) {
    console.log('transactions', tx);
    console.log(`✅ SENDING ${tx.amount} TO ${tx.to}`);
    let result = await this.active.sendTransactionAdvanced(
      [[tx.to, tx.amount]], // destinations,
      3, // mixin
      { fixedFee: 1000, isFixedFee: true }, // fee
      undefined, //paymentID
      undefined, // subWalletsToTakeFrom
      undefined, // changeAddress
      true, // relayToNetwork
      false, // sneedAll
      undefined,
    );
    if (result.success) {
      let amount = tx.amount / 100000;
      let sent = {
        message: `You sent ${amount} XKR`,
        name: 'Transaction sent',
        hash: parseInt(Date.now()),
        key: tx.to,
        success: true,
      };

      return result;
    } else {
      console.log(`Failed to send transaction: ${result.error.toString()}`);
      return result;
    }
  }

  node(node) {
    const nodeUrl = node.split(':')[0];
    const nodePort = parseInt(node.split(':')[1]);
    const picked = { url: nodeUrl, port: nodePort };
    this.setDaemon(picked);
    this.active.swapNode(this.daemon);
    this.nodeUrl = nodeUrl;
    this.nodePort = nodePort;
    MessageSync.set_node(picked);
  }

  getAndSetSyncStatus() {
    const [walletBlockCount, localDaemonBlockCount, networkBlockCount] =
      this.active.getSyncStatus();
    setSyncStatus([walletBlockCount, localDaemonBlockCount, networkBlockCount]);
  }

  async toggle() {
    if (!this.started) {
      await this.active.start();
    } else {
      this.active.stop();
    }
    this.started = !this.started;

    return this.started;
  }

  async create_message_wallet() {
    return;
  }

  async optimize_message_inputs(force = false) {
    return;
  }

  withTimeout(promise, timeoutMs) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), timeoutMs)
      ),
    ]);
  }

  waitForCondition(conditionFn, timeout = 10000, interval = 100) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    const check = () => {
      if (conditionFn()) return resolve(true);
      if (Date.now() - start >= timeout) return reject(new Error('Timeout waiting for condition'));
      setTimeout(check, interval);
    };

    check();
  });
}

  async send_message(message, receiver, beam = false, call = false) {
    //Assert address length
    if (receiver.length !== 163) {
      console.log('Error: Address too long/short');
      return { error: 'address', success: false, hash: '' };
    }
    if (message.length === 0) {
      console.log('Error: No message to send');
      return { error: 'message', success: false, hash: '' };
    }

    //Split address and check history
    let address = receiver.substring(0, 99);
    let messageKey = receiver.substring(99, 163);
    let has_history = await this.check_history(messageKey, address);

    let payload_hex;
    const seal = has_history && beam ? false : true;

    payload_hex = await this.encrypt_hugin_message(
      message,
      messageKey,
      seal,
      address,
    );

    const hash = randomKey();

    if (beam) {
      const send = hash + '99' + payload_hex;
      Beam.message(address, send);
    } else {
      try {
        await this.waitForCondition(() => useGlobalStore.getState().huginNode.connected, 10000);
      } catch (err) {
        console.log('Error: Hugin node not connected in time', error);
        return { success: false, error: 'not_connected', hash: '' };
      }
     try {
      const sent = await this.withTimeout(Nodes.message(payload_hex, hash, await this.generate_view_tag(address, call)), 10000);
      console.log('Sent!', sent);
      if (!sent?.success) {
        if (typeof sent.reason !== 'string') return;
        if (sent.reason.length > 40) return;
        console.log('Error sending message', sent.reason);
        return { success: false, error: sent.reason, hash: '' };
      }
    } catch (error) {
      console.log('Error sending message:', error.message);
      return { success: false, error: error.message, hash: '' };
    }
    }

    return { success: true, error: 'success', hash };
  }

  async start_call(roomKey, receiver) {

    //Assert address length
    if (receiver.length !== 163) {
      console.log('Error: Address too long/short');
      return { error: 'address', success: false, hash: '' };
    }
    if (roomKey.length === 0) {
      console.log('Error: No message to send');
      return { error: 'message', success: false, hash: '' };
    }

    //Split address
    let address = receiver.substring(0, 99);
    let messageKey = receiver.substring(99, 163);

    let my_address = this.address;
    
    let payload_json = {
      from: my_address,
      name: useUserStore.getState().user.name,
      call: roomKey
    }

    console.log('Payload to send:', payload_json);

    const sealed_box = await get_sealed_box({data: JSON.stringify(payload_json), messageKey});

    console.log('sealed_box', sealed_box);

    let payload_box = { box: sealed_box };
    // Convert json to hex
    let payload_hex = toHex(JSON.stringify(payload_box))

    const hash = randomKey();

    try {
        await this.waitForCondition(() => useGlobalStore.getState().huginNode.connected, 10000);
      } catch (err) {
        console.log('Error: Hugin node not connected in time', error);
        return { success: false, error: 'not_connected', hash: '' };
      }
     try {
      const sent = await this.withTimeout(Nodes.message(payload_hex, hash, await this.generate_view_tag(address, true)), 10000);
      console.log('Sent!', sent);
      if (!sent?.success) {
        if (typeof sent.reason !== 'string') return;
        if (sent.reason.length > 40) return;
        console.log('Error sending message', sent.reason);
        return { success: false, error: sent.reason, hash: '' };
      }
    } catch (error) {
      console.log('Error sending message:', error.message);
      return { success: false, error: error.message, hash: '' };
    }

  }

  async encrypt_hugin_message(message, messageKey, sealed = false, toAddr) {
    let timestamp = Date.now();
    let my_address = this.address;
    const addr = await Address.fromAddress(toAddr);
    const [privateSpendKey, privateViewKey] = this.privateKeys();
    let xkr_private_key = privateSpendKey;
    let box;

    //Create the view tag using a one time private key and the receiver view key
    const keys = await generateKeys();
    const toKey = addr.m_keys.m_viewKeys.m_publicKey;
    const outDerivation = await generateKeyDerivation(toKey, keys.private_key);
    const hashDerivation = await cnFastHash(outDerivation);
    const viewTag = hashDerivation.substring(0, 2);

    if (sealed) {
      let signature = await this.sign(message, true);
      let payload_json = {
        from: my_address,
        k: Buffer.from(keychain.getKeyPair().publicKey).toString('hex'),
        msg: message,
        s: signature,
        name: useUserStore.getState().user.name
      };
      console.log(payload_json);
      let payload_json_decoded = naclUtil.decodeUTF8(
        JSON.stringify(payload_json),
      );
      box = new NaclSealed.sealedbox(
        payload_json_decoded,
        nonceFromTimestamp(timestamp),
        hexToUint(messageKey),
      );
    } else if (!sealed) {
      console.log('Has history, not using sealedbox');
      let payload_json = { from: my_address, msg: message };
      let payload_json_decoded = naclUtil.decodeUTF8(
        JSON.stringify(payload_json),
      );

      box = tweetnacl.box(
        payload_json_decoded,
        nonceFromTimestamp(timestamp),
        hexToUint(messageKey),
        keychain.getKeyPair().secretKey,
      );
    }
    //Box object
    let payload_box = {
      box: Buffer.from(box).toString('hex'),
      t: timestamp,
      txKey: keys.public_key,
      vt: viewTag,
    };
    // Convert json to hex
    let payload_hex = toHex(JSON.stringify(payload_box));
    return payload_hex;
  }

  async encrypt_push_registration() {

    let timestamp = Date.now();
    let box;

    //Create the view tag using a one time private key and the receiver view key
    const keys = await generateKeys();

    let payload_json = {
      deviceId: getDeviceId(),
      viewTag: await Wallet.generate_view_tag()
    };
    let payload_json_decoded = naclUtil.decodeUTF8(
      JSON.stringify(payload_json),
    );

    box = new NaclSealed.sealedbox(
      payload_json_decoded,
      nonceFromTimestamp(timestamp),
      hexToUint('6e49ab1a59019b2c22eb27efc5664be419c9d3d58016319cd0915e0494de4071'),
    );

    //Box object
    let payload_box = {
      box: Buffer.from(box).toString('hex'),
      t: timestamp
    };
    // Convert json to hex
    let payload_hex = toHex(JSON.stringify(payload_box));
    return payload_hex;
  }

  async encrypt_call_push_registration() {

    let timestamp = Date.now();
    let box;

    //Create the view tag using a one time private key and the receiver view key
    const keys = await generateKeys();

    try {
    let payload_json = {
      deviceId: useGlobalStore.getState().deviceToken,
      viewTag: await Wallet.generate_view_tag(undefined, true),
      type: 'call'
    };
    let payload_json_decoded = naclUtil.decodeUTF8(
      JSON.stringify(payload_json),
    );

    box = new NaclSealed.sealedbox(
      payload_json_decoded,
      nonceFromTimestamp(timestamp),
      hexToUint('6e49ab1a59019b2c22eb27efc5664be419c9d3d58016319cd0915e0494de4071'),
    );

    //Box object
    let payload_box = {
      box: Buffer.from(box).toString('hex'),
      t: timestamp
    };
    // Convert json to hex
    let payload_hex = toHex(JSON.stringify(payload_box));
    return payload_hex;
    } catch (e) {
      console.error('Error making callkit shit:', e)
    }
  }

  async encrypt_room_push_registration(room) {

    let timestamp = Date.now();
    let box;

    //Create the view tag using a one time private key and the receiver view key
    const keys = await generateKeys();

    let payload_json = {
      deviceId: getDeviceId(),
      viewTag: await this.generate_room_view_tag(room)
    };
    let payload_json_decoded = naclUtil.decodeUTF8(
      JSON.stringify(payload_json),
    );

    box = new NaclSealed.sealedbox(
      payload_json_decoded,
      nonceFromTimestamp(timestamp),
      hexToUint('6e49ab1a59019b2c22eb27efc5664be419c9d3d58016319cd0915e0494de4071'),
    );

    //Box object
    let payload_box = {
      box: Buffer.from(box).toString('hex'),
      t: timestamp
    };
    // Convert json to hex
    let payload_hex = toHex(JSON.stringify(payload_box));
    return payload_hex;
  }

  async check_history(messageKey) {
    //Check history
    if (MessageSync.known_keys.indexOf(messageKey) > -1) {
      return true;
    } else {
      MessageSync.known_keys.push(messageKey);
      return false;
    }
  }

  async key_derivation_hash(chat) {
    const [privateSpendKey, privateViewKey] = this.privateKeys();
    const recvAddr = await Address.fromAddress(chat);
    const recvPubKey = recvAddr.m_keys.m_viewKeys.m_publicKey;
    const derivation = await generateKeyDerivation(recvPubKey, privateViewKey);
    return await cnFastHash(derivation);
  }

  async generate_view_tag(address = this.active.getAddresses()[0], long = false) {
    const myAddr = await Address.fromAddress(address);
    const pubKey = myAddr.m_keys.m_viewKeys.m_publicKey;
    const weeklyTimestamp = Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7));
    const hash = await cnFastHash(pubKey + weeklyTimestamp);
    return long ? hash : hash.substring(0,3);
  }

  async generate_room_view_tag(room) {
    const hash = await cnFastHash(room);
    return hash.substring(0,5);
  }

  async copyMnemonic() {
    if (this.active) {
      const mnemonic = await this.active.getMnemonicSeed();
      if (mnemonic[0]) {
        Clipboard.setString(mnemonic[0]);
        Toast.show({
          type: 'success',
          text1: t('mnemonicCopied'),
        });
      } else {
        Toast.show({
          type: 'error',
          text1: t('noMnemonicError'),
        });
      }
    } else {
      Toast.show({
        type: 'error',
        text1: t('walletOfflineError'),
      });
    }
  }
}

export const Wallet = new ActiveWallet();
