import { WalletBackend, Daemon } from 'kryptokrona-wallet-backend-js';
import { WalletConfig } from 'config/wallet-config';
import { saveWallet, loadWallet } from '../../services/bare/sqlite';

export class ActiveWallet {
  constructor() {
    this.active = undefined;
    this.started = false;
    this.nodeUrl = undefined;
    this.nodePort = undefined;
    this.address = undefined;
    this.started = false;
  }

  async init(node) {
    this.setDaemon(node);
    if (!(await this.load())) return false;
    this.started = true;
    return true;
  }

  async create(node) {
    this.setDaemon(node);
    this.active = await WalletBackend.createWallet(this.daemon, WalletConfig);
    this.address = this.addresses()[0];
    this.started = true;
    await this.save();
  }

  async save() {
    if (!this.started) return;
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
    await this.save();
    return true;
  }

  addresses() {
    return this.active.getAddresses();
  }

  setDaemon(node) {
    this.daemon = new Daemon(node.url, node.port);
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
}

export const Wallet = new ActiveWallet();
