import * as NaclSealed from 'tweetnacl-sealed-box';

import { Address, CryptoNote } from 'kryptokrona-utils';
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
} from '@/services';

import { MessageSync } from '../hugin/syncer';
import Toast from 'react-native-toast-message';
import { WalletConfig } from 'config/wallet-config';
import naclUtil from 'tweetnacl-util';
import tweetnacl from 'tweetnacl';
import { Beam } from '../../lib/native';

const xkrUtils = new CryptoNote();
export class ActiveWallet {
  constructor() {
    this.active = undefined;
    this.loaded = false;
    this.address = undefined;
    this.nodeUrl = undefined;
    this.nodePort = undefined;
    this.started = false;
    this.deadNodeEmitted = true;
  }

  async init(node) {
    console.log('Init wallet!');
    this.setDaemon(node);
    if (!(await this.load())) return false;
    this.loaded = true;
    return true;
  }

  async joinBetaRoom(nickname) {
    const key =
      '8828094c877f097854c5122013b5bb0e804dbe904fa15aece310f62ba93dc76c55bb8d1f705afa6f45aa044fb4b95277a7f529a9e55782d0c9de6f0a6fb367cc';
    await saveRoomToDatabase('Hugin Beta Testers', key, undefined);
    await saveRoomMessageAndUpdate(
      this.address,
      'Joined room',
      key,
      '',
      Date.now(),
      nickname,
      randomKey(),
      true,
    );
    setRoomMessages(key, 0);
    setStoreCurrentRoom(key);
  }

  async create(node, nickname) {
    this.setDaemon(node);
    this.active = await WalletBackend.createWallet(this.daemon, WalletConfig);
    this.address = this.addresses()[0];
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
      await saveWallet(this.active.toJSONString());
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

    console.log('Loaded wallet:', this.active);
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

  async sign(message) {
    return await xkrUtils.signMessage(message, this.spendKey());
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
    console.log('Start this wallet ->', this.active);
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
        Toast.show({
          text1: 'Your node has gone offline',
          type: 'success',
        });
      }
    });

    await this.active.start();
    await this.create_message_wallet();
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
    if (this.active.subWallets.getAddresses().length < 2) {
      const subWalletKeys = await generateDeterministicSubwalletKeys(
        this.spendKey(),
        1,
      );
      const [address, error] = await this.active.importSubWallet(
        subWalletKeys.private_key,
      );
    }
    console.log(
      'this.active.subWallets.getAddresses()',
      this.active.subWallets.getAddresses(),
    );
  }

  async optimize_message_inputs(force = false) {
    let [mainWallet, messageSubWallet] = this.addresses();

    const [walletHeight, localHeight, networkHeight] =
      await this.active.getSyncStatus();

    let inputs = await this.active.subWallets.getSpendableTransactionInputs(
      [messageSubWallet],
      networkHeight,
    );

    if (inputs.length > 25 && !force) {
      optimized = true;
      return;
    }

    let payments = [];
    let i = 0;
    /* User payment */
    while (i <= 49) {
      payments.push([messageSubWallet, 1000]);
      i += 1;
    }

    let result = await this.active.sendTransactionAdvanced(
      payments, // destinations,
      3, // mixin
      { fixedFee: 1000, isFixedFee: true }, // fee
      undefined, //paymentID
      [mainWallet], // subWalletsToTakeFrom
      undefined, // changeAddress
      true, // relayToNetwork
      false, // sneedAll
      undefined,
    );

    if (result.success) {
      // reset_optimize(); TODO** set timer? or wait for optimize tx to return?

      let optimizeMessage = {
        message: 'Your wallet is creating message inputs, please wait',
        name: 'Optimizing',
        hash: parseInt(Date.now()),
        key: mainWallet,
        optimized: true,
      };

      // Hugin.send('sent_tx', sent);
      console.log('Optimize completed: ', optimizeMessage);
      return true;
    } else {
      optimized = false;

      let error = {
        message: 'Optimize failed',
        name: 'Optimizing wallet failed',
        hash: parseInt(Date.now()),
        key: mainWallet,
      };
      console.log('Error:', error);
      return false;
    }
  }

  async send_message(message, receiver, beam = false) {
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
    let balance = await this.check_balance();
    if (!balance && !beam) {
      console.log('Error: No balance to send with');
      return { error: 'balance', success: false, hash: '' };
    }

    let payload_hex;
    const seal = has_history ? false : true;

    payload_hex = await this.encrypt_hugin_message(
      message,
      messageKey,
      seal,
      address,
    );

    if (beam) {
      const hash = randomKey();
      const send = hash + '99' + payload_hex;
      Beam.message(address, send);
      return { hash, success: true, error: 'success' };
    }
    //Choose subwallet with message inputs
    let messageSubWallet = this.addresses()[1];
    let result = await this.active.sendTransactionAdvanced(
      [[messageSubWallet, 1000]], // destinations,
      3, // mixin
      { fixedFee: 1000, isFixedFee: true }, // fee
      undefined, //paymentID
      [messageSubWallet], // subWalletsToTakeFrom
      undefined, // changeAddresss
      true, // relayToNetwork
      false, // sneedAll
      Buffer.from(payload_hex, 'hex'),
    );
    if (result.success) {
      //save_message(sentMsg);
      this.optimize_message_inputs();
      optimized = true;
    } else {
      let error = {
        message: `Failed to send, please wait a couple of minutes.`,
        name: 'Error',
        hash: Date.now(),
      };
      optimized = false;
      this.optimize_message_inputs(true);
      console.log(
        `Error: Failed to send transaction: ${result.error.toString()}`,
      );
      console.log('Error: ', error);
      return { hash: '', success: false, error: 'failed' };
    }

    return { hash: result.transactionHash, success: true, error: 'success' };
    //TODO save message
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
      let signature = await this.sign(message, xkr_private_key);
      let payload_json = {
        from: my_address,
        k: Buffer.from(keychain.getKeyPair().publicKey).toString('hex'),
        msg: message,
        s: signature,
      };
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

  async check_history(messageKey) {
    //Check history
    if (MessageSync.known_keys.indexOf(messageKey) > -1) {
      return true;
    } else {
      MessageSync.known_keys.push(messageKey);
      return false;
    }
  }

  async check_balance() {
    try {
      let [munlockedBalance, mlockedBalance] = await this.active.getBalance();

      if (munlockedBalance < 11) {
        console.log('Error: Not enough unlocked funds.');
        return false;
      }
    } catch (err) {
      console.log('Error:', err);
      return false;
    }
    return true;
  }

  async key_derivation_hash(chat) {
    const [privateSpendKey, privateViewKey] = this.privateKeys();
    const recvAddr = await Address.fromAddress(chat);
    const recvPubKey = recvAddr.m_keys.m_viewKeys.m_publicKey;
    const derivation = await generateKeyDerivation(recvPubKey, privateViewKey);
    return await cnFastHash(derivation);
  }
}

export const Wallet = new ActiveWallet();
