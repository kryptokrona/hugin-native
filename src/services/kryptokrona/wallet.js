import { Address, CryptoNote } from 'kryptokrona-utils';
import { Beam, Nodes, xkr_daemon_request } from '../../lib/native';
import { isSwarmNode, parseNode, swarmRequester } from './daemon-node';
import { startDm, stopDm } from '../hugin/dm';
import { Daemon, WalletBackend } from 'kryptokrona-wallet-backend-js';
import {
  cnFastHash,
  generateDeterministicSubwalletKeys,
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
import Toast from 'react-native-toast-message';
import { WalletConfig } from 'config/wallet-config';
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
    stopDm();

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
    this.dm();
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

  /**
   * The DM crypto of this wallet (hugin-network/dm DmCrypto, src/services/hugin/dm.js), shared with
   * the syncer and the push handler; made again when the wallet's address changes.
   */
  dm() {
    return startDm(this, { name: () => useUserStore.getState()?.user?.name || '' });
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
    if (isSwarmNode(node.url)) {
      this.daemon = Daemon.withRequester(swarmRequester(node.url, xkr_daemon_request));
    } else {
      this.daemon = new Daemon(node.url, node.port);
      this.daemon.makePostRequest = makePostRequest;
    }
    this.nodeUrl = node.url;
    this.nodePort = node.port;
  }

  spendKey() {
    return this.active.getPrimaryAddressPrivateKeys()[0];
  }

  privateKeys() {
    return this.active.getPrimaryAddressPrivateKeys();
  }

  async messageKeyPair() {
    if (this.messageKeys) return this.messageKeys;
    const priv = this.spendKey();
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
    this.dm();
    await this.create_message_wallet();
    this.messageKeys = await this.messageKeyPair();
    this.optimize_message_inputs();
    this.getAndSetBalance();
    this.getAndSetSyncStatus();
    this.started = true;
    console.log('Wallet started');

    setInterval(() => this.save(), 30000);

    // DM pushes carry the sender's DM payload as posted to the hugin-node (the push server
    // routes it by view tag); pushnotifications.ts opens it with this wallet's DmCrypto.

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
    const picked = parseNode(node);
    const nodeUrl = picked.url;
    const nodePort = picked.port;
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

  /**
   * Sends a DM: over the contact's DM swarm when `beam` is set, else as a hugin-node post (with
   * retries). When the DM swarm write reaches none of the contact's peers, a payload that fits a
   * node post is posted instead. A payload longer than a node post takes (`fitsNode` false: a
   * long text, most often with the handshake fields) goes over the DM swarm only: while the
   * contact is not connected it is not sent, and the answer is `{ success: false, error:
   * 'contact_offline', hash: '' }` (the message screen keeps it as not delivered, to be sent
   * again when the contact is connected). Returns `{ success, error, hash }`; `hash` is the
   * message id the receiver stores.
   */
  async send_message(message, receiver, beam = false, call = false, _ignored = '') {
    if (typeof message !== 'string' || message.length === 0) {
      return { error: 'message', success: false, hash: '' };
    }

    // xkr address only (99 chars). Tolerate a legacy 163-char string.
    const address = typeof receiver === 'string' ? receiver.substring(0, 99) : '';
    if (address.length !== 99) {
      return { error: 'address', success: false, hash: '' };
    }

    let out;
    try {
      out = await this.encrypt_hugin_message(message, address, { call });
    } catch (err) {
      console.log('DM not encrypted:', err?.code || err?.message);
      return { success: false, error: 'encrypt_failed', hash: '' };
    }

    if (beam || !out.fitsNode) {
      // Written to a connected peer of the contact: the DM swarm gives no further
      // acknowledgement.
      const written = await Beam.send(address, out.payload);
      if (written > 0) {
        return { success: true, error: 'success', hash: out.hash };
      }
      if (!out.fitsNode) {
        return { success: false, error: 'contact_offline', hash: '' };
      }
    }

    try {
      await this.waitForCondition(
        () => useGlobalStore.getState().huginNode.connected,
        10000,
      );
    } catch (err) {
      return { success: false, error: 'not_connected', hash: '' };
    }

    // Node path: retry with backoff.
    let attempt = 0;
    let sent;
    while (attempt < 5) {
      sent = await Nodes.message(out.payload, out.hash, out.viewTag, out.kind);
      if (sent?.success === true) break;
      attempt += 1;
      if (attempt < 5) await sleep(3000);
    }
    if (sent?.success !== true) {
      const reason = sent?.reason;
      if (typeof reason === 'string' && reason.length <= 40) {
        console.log('Error sending message', reason);
      }
      return { success: false, error: reason || 'send_failed', hash: '' };
    }
    return { success: true, error: 'success', hash: out.hash };
  }

  /**
   * The DM payload of `message` for `toAddress` (hugin-network/dm `encrypt`): without a key for the
   * contact it carries our ML-KEM public key, with our capsule not yet used by the contact it
   * carries the capsule, otherwise only the box under the shared key. The contact's state is not
   * changed by sending. Resolves `{ payload, hash, timestamp, viewTag, kind, handshake, to,
   * fitsNode }`; `viewTag` is the push view tag (all 64 characters for a call).
   */
  async encrypt_hugin_message(message, toAddress, { call = false } = {}) {
    return this.dm().encrypt(toAddress, message, { call: call === true });
  }

  async start_call(roomKey, receiver) {
    if (!roomKey || roomKey.length === 0) {
      return { error: 'message', success: false, hash: '' };
    }
    // The call payload IS the message body wrapped in JSON; it travels
    // through the same encrypt_hugin_message path as a normal PM, so the
    // receiver decrypts it identically and notices `call: roomKey` after
    // JSON.parse on the plaintext.
    return await this.send_message(
      JSON.stringify({ call: roomKey }),
      receiver,
      false,
      true,
    );
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

  /**
   * The DM swarm key with `chat` (an address): cn_fast_hash of the key derivation of the
   * contact's view public key and our private view key, the same value on both sides.
   */
  async key_derivation_hash(chat) {
    return this.dm().derivationHash(chat);
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
