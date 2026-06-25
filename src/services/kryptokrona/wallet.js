import { Address, CryptoNote } from 'kryptokrona-utils';
import {
  Beam,
  Nodes,
  pm_send,
  derive_box_keypair,
} from '../../lib/native';
import * as Keychain from 'react-native-keychain';
import { Daemon, WalletBackend } from 'kryptokrona-wallet-backend-js';
import {
  cnFastHash,
  generateDeterministicSubwalletKeys,
  generateKeyDerivation,
  generateKeys,
  makePostRequest,
  processBlockOutputs,
} from '../NativeTest';
import { parse, toHex } from '../utils';
import {
  joinAndSaveRoom,
  saveRoomMessageAndUpdate,
  setRoomMessages,
} from '../bare';
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
import { privateKeys } from './privates';
import { t } from 'i18next';
import { getDeviceId } from '../../services/pushnotifications';
import { fetchWithTimeout, sleep } from '@/utils';

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
    // Sort: unconfirmed transactions first, then by timestamp (newest first)
    const sortedTransactions = transactions.sort((a, b) => {
      // Unconfirmed transactions (timestamp = 0) come first
      if (a.timestamp === 0 && b.timestamp !== 0) return -1;
      if (a.timestamp !== 0 && b.timestamp === 0) return 1;
      // Both unconfirmed or both confirmed: sort by timestamp descending
      return b.timestamp - a.timestamp;
    });
    setTransactions(sortedTransactions);
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

    // Persist the device-push keypair (X25519, derived from the spend key)
    // in the OS Keychain. pushnotifications.ts reads this on a cold push to
    // hand both halves to Bare's dm_push_decrypt RPC. The bytes are
    // byte-equivalent to the previous tweetnacl derivation, so push pubkeys
    // we already registered with the server still match.
    try {
      const { sk, pk } = await derive_box_keypair(this.spendKey());
      await Keychain.setGenericPassword('encryption', sk + pk, {
        accessible: Keychain.ACCESSIBLE.ALWAYS,
      });
      console.log('🔐 Device-push keypair stored.');
    } catch (err) {
      console.error('❌ Failed to store encryption key:', err);
    }

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

  async send_message(message, receiver, beam = false, call = false, messageHash = '') {
    if (message.length === 0) {
      console.log('Error: No message to send');
      return { error: 'message', success: false, hash: '' };
    }

    // xkr address only (99 chars). Tolerate a legacy 163-char string by
    // taking the address part — the trailing nacl message-key is gone.
    const address = typeof receiver === 'string' ? receiver.substring(0, 99) : '';
    if (address.length !== 99) {
      console.log('Error: Address too long/short');
      return { error: 'address', success: false, hash: '' };
    }

    if (!beam) {
      try {
        await this.waitForCondition(
          () => useGlobalStore.getState().huginNode.connected,
          10000,
        );
      } catch (err) {
        console.log('Error: Hugin node not connected in time');
        return { success: false, error: 'not_connected', hash: '' };
      }
    }

    const viewtag = await this.generate_view_tag(address, call);
    const name = useUserStore.getState().user.name;

    // Bare owns the cipher: it builds the wire, computes the deterministic
    // hash, and ships via beam or node in a single RPC. RN no longer touches
    // tweetnacl / sodium / kryptokrona key derivation on the send path.
    let attempt = 0;
    let result;
    while (attempt < (beam ? 1 : 5)) {
      result = await pm_send({
        message,
        toAddress: address,
        name,
        beam,
        call,
        viewtag,
      });
      if (result?.success) break;
      attempt += 1;
      if (!beam && attempt < 5) await sleep(3000);
    }

    if (!result?.success) {
      const reason = result?.error;
      if (typeof reason === 'string' && reason.length <= 40) {
        console.log('Error sending message', reason);
      }
      return { success: false, error: reason || 'send_failed', hash: '' };
    }

    return { success: true, error: 'success', hash: result.hash };
  }

  async start_call(roomKey, receiver) {
    if (roomKey.length === 0) {
      console.log('Error: No call key to send');
      return { error: 'message', success: false, hash: '' };
    }

    // xkr address only — tolerate a legacy 163-char string.
    const address = typeof receiver === 'string' ? receiver.substring(0, 99) : '';
    if (address.length !== 99) {
      console.log('Error: Address too long/short');
      return { error: 'address', success: false, hash: '' };
    }

    try {
      await this.waitForCondition(
        () => useGlobalStore.getState().huginNode.connected,
        10000,
      );
    } catch (err) {
      console.log('Error: Hugin node not connected in time');
      return { success: false, error: 'not_connected', hash: '' };
    }

    const viewtag = await this.generate_view_tag(address, true);
    const name = useUserStore.getState().user.name;
    // The call payload IS the message body — Bare wraps it in the same
    // ephemeral friend-request envelope as a normal PM, plus a `call: roomKey`
    // hint inside. Receiver decrypts via the same pm_decrypt path.
    let attempt = 0;
    let result;
    while (attempt < 5) {
      result = await pm_send({
        message: JSON.stringify({ call: roomKey }),
        toAddress: address,
        name,
        beam: false,
        call: true,
        viewtag,
      });
      if (result?.success) break;
      attempt += 1;
      if (attempt < 5) await sleep(3000);
    }

    if (!result?.success) {
      console.log('Error sending call', result?.error);
      return { success: false, error: result?.error || 'call_failed', hash: '' };
    }
    return { success: true, error: 'success', hash: result.hash };
  }

  /**
   * Returns the descriptor RN ships to Bare's push_register_all RPC. RN only
   * computes the (cheap, native-module) view tags; Bare builds + ships every
   * sealedbox in a single round-trip.
   */
  async build_push_registration_descriptor(options = {}) {
    const includeDevicePush = options.includeDevicePush !== false;
    const includeCallPush = options.includeCallPush !== false;
    const roomKeys = Array.isArray(options.roomKeys)
      ? [...new Set(options.roomKeys.filter((k) => typeof k === 'string' && k.length > 0))]
      : [];

    if (!includeDevicePush && !includeCallPush && roomKeys.length === 0) {
      return null;
    }

    const deviceViewTag = includeDevicePush ? await this.generate_view_tag() : null;
    const callViewTag = includeCallPush
      ? await this.generate_view_tag(undefined, true)
      : null;
    const rooms = [];
    for (const roomKey of roomKeys) {
      rooms.push({
        roomKey,
        viewTag: await this.generate_room_view_tag(roomKey),
      });
    }
    return {
      deviceId: getDeviceId(),
      includeDevicePush,
      includeCallPush,
      deviceViewTag,
      callViewTag,
      rooms,
    };
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
    const hashInput = toHex(String(pubKey) + String(weeklyTimestamp));
    const hash = await cnFastHash(hashInput);
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
