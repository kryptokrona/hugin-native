import { WalletBackend, Daemon } from 'kryptokrona-wallet-backend-js';
import { WalletConfig } from 'config/wallet-config';
import { saveWallet, loadWallet } from '../../services/bare/sqlite';
import {
  processBlockOutputs,
  makePostRequest,
  generateDeterministicSubwalletKeys,
} from '../NativeTest';
import { parse } from '../utils';
import { Address, CryptoNote } from 'kryptokrona-utils';
import {
  setBalance,
  setStoreAddress,
  setTransactions,
  setSyncStatus,
} from '@/services';
import Toast from 'react-native-toast-message';
const xkrUtils = new CryptoNote();
export class ActiveWallet {
  constructor() {
    this.active = undefined;
    this.loaded = false;
    this.address = undefined;
    this.nodeUrl = undefined;
    this.nodePort = undefined;
    this.started = false;
  }

  async init(node) {
    this.setDaemon(node);
    if (!(await this.load())) return false;
    this.loaded = true;
    return true;
  }

  async create(node) {
    this.setDaemon(node);
    this.active = await WalletBackend.createWallet(this.daemon, WalletConfig);
    this.address = this.addresses()[0];
    this.loaded = true;
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

  async import(height, seed, node) {
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
    return true;
  }

  addresses() {
    return this.active.getAddresses();
  }

  async getAndSetBalance() {
    let [unlockedBalance, lockedBalance] = await this.active.getBalance();
    setBalance([unlockedBalance, lockedBalance]);
    const transactions = await this.active.getTransactions();
    setTransactions(transactions);
  }

  setDaemon(node) {
    this.daemon = new Daemon(node.url, node.port);
    this.daemon.makePostRequest = makePostRequest;
    this.nodeUrl = node.url;
    this.nodePort = node.port;
  }

  spendKey() {
    return Wallet.active.getPrimaryAddressPrivateKeys()[0];
  }

  privateKeys() {
    return Wallet.active.getPrimaryAddressPrivateKeys();
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
    //Disable wallet optimization
    await this.active.enableAutoOptimization(false);
    console.log('Wallet enable auto opt');
    //Disable scanning for transactions in pool
    await this.active.scanPoolTransactions(false);

    await this.active.start();
    console.log('Wallet started');
    await this.message_wallet();
    console.log('Scan pool txs no');
    this.optimize_message_inputs();
    this.started = true;
    this.getAndSetBalance();
    this.getAndSetSyncStatus();
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
    });

    //Wallet heightchange event with funtion that saves wallet only if we are synced
    this.active.on(
      'heightchange',
      async (walletBlockCount, localDaemonBlockCount, networkBlockCount) => {
        let synced = networkBlockCount - walletBlockCount <= 2;
        if (walletBlockCount % 100 === 0) {
          this.getAndSetSyncStatus();
          console.log('walletBlockCount', walletBlockCount);
          console.log('networkBlockCount', networkBlockCount);
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
      };
      console.log('Success:', sent);
      Toast.show({
        type: 'success',
        text1: 'Transaction sent ✅',
      });
      //   this.emit('sentTx', sent);
      //Notify
      return result;
    } else {
      console.log(`Failed to send transaction: ${result.error.toString()}`);
      let error = {
        message: 'Failed to send',
        name: 'Transaction error',
        hash: Date.now(),
      };
      Toast.show({
        type: 'error',
        text1: 'Failed to send transaction',
      });
      return result;
      //Notify
      //   this.emit('failedTx');
    }
  }

  node(node) {
    const nodeUrl = node.split(':')[0];
    const nodePort = parseInt(node.split(':')[1]);
    const picked = { url: nodeUrl, port: nodePort };
    this.setDaemon(picked);
    this.active.swapNode(this.daemon);
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

  async message_wallet() {
    if (this.active.subWallets.getAddresses().length < 2) {
      const subWalletKeys = await generateDeterministicSubwalletKeys(this.spendKey(), 1);
      const [address, error] = await this.active.importSubWallet(subWalletKeys.private_key);
    }
  }


async optimize_message_inputs(force = false) {

  let [mainWallet, messageSubWallet] = this.active.getAddresses();

  const [walletHeight, localHeight, networkHeight] =
    await Wallet.active.getSyncStatus();

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


  

}

export const Wallet = new ActiveWallet();
