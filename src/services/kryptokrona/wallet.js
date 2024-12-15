import { WalletBackend, Daemon } from 'kryptokrona-wallet-backend-js';
import { WalletConfig } from 'config/wallet-config';
import { saveWallet, loadWallet } from '../../services/bare/sqlite';
import { processBlockOutputs, makePostRequest } from '../NativeTest';
export class ActiveWallet {
  constructor() {
    this.active = undefined;
    this.loaded = false;
    this.address = undefined;
    this.nodeUrl = undefined;
    this.nodePort = undefined;
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
    await this.start();
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

    const wallet = this.parse(walletData);
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
    await this.start();

    console.log('Loaded wallet:', this.active);
    console.log('--------------->');
    console.log('Wallet address:', this.address);
    return true;
  }

  async import(height, seed, node) {
    this.setDaemon(node);
    const [wallet, error] = WalletBackend.importWalletFromSeed(
      this.daemon,
      height,
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

  balance() {
    return this.active.getBalance();
  }

  setDaemon(node) {
    this.daemon = new Daemon(node.url, node.port);
    this.daemon.makePostRequest = makePostRequest;
    this.nodeUrl = node.url;
    this.nodePort = node.port;
  }

  parse(json) {
    try {
      return JSON.parse(json);
    } catch (e) {
      return false;
    }
  }

  async start() {
    console.log('Start this wallet ->', this.active);
    this.active.setBlockOutputProcessFunc(processBlockOutputs);
    await this.active.start();
    console.log('Wallet started');
    //Disable wallet optimization
    await this.active.enableAutoOptimization(false);
    console.log('Wallet enable auto opt');
    //Disable scanning for transactions in pool
    await this.active.scanPoolTransactions(false);
    console.log('Scan pool txs no');
    //Incoming transaction event
    this.active.on('incomingtx', (transaction) => {
      console.log('Incoming tx!', transaction);
      this.save();
    });

    this.active.on('createdtx', async (tx) => {
      console.log('***** outgoing *****', tx);
      this.save();
    });

    //Wallet heightchange event with funtion that saves wallet only if we are synced
    this.active.on(
      'heightchange',
      async (walletBlockCount, localDaemonBlockCount, networkBlockCount) => {
        let synced = networkBlockCount - walletBlockCount <= 2;
        if (networkBlockCount % 50 === 0) {
          console.log('walletBlockCount', walletBlockCount);
          console.log('networkBlockCount', networkBlockCount);
        }

        if (networkBlockCount === 0) return;
        if (synced) {
          console.log('**********');
          console.log('**Synced**');
          console.log('**Balance:', await this.balance());
          console.log('**********');
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
      //   this.emit('sentTx', sent);
      //Notify
    } else {
      console.log(`Failed to send transaction: ${result.error.toString()}`);
      let error = {
        message: 'Failed to send',
        name: 'Transaction error',
        hash: Date.now(),
      };
      //Notify
      //   this.emit('failedTx');
    }
  }
}

export const Wallet = new ActiveWallet();
