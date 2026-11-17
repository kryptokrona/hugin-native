// State of the worklet's user, set by React Native (`init_bare`, `update_bare_user`,
// `idle_status`) and read by bare/host.js: identity, paths, the files we have, bans and blocks,
// and the bridge to React Native.
class Account {
  constructor() {
    this.name = '';
    this.address = '';
    this.avatar = '';
    this.downloadDir = '';
    this.rpc = null;
    this.keys = {};
    this.bannedList = [];
    this.blockList = [];
    this.sleeping = false;
    this.store = '';
    this.syncImages = true; /// TODO** Add switch to enable/disable
    this.files = [];
    this.background = false;
  }

  init(data, rpc) {
    console.log('[account.js] Init bare user');
    this.name = data.name;
    this.address = data.address;
    this.avatar = data.avatar;
    this.rpc = rpc;
    this.downloadDir = data.downloadDir;
    this.keys = data.keys;
    this.store = data.store;
    this.files = data.files ?? [];
  }

  update(data) {
    this.name = data.name;
    this.address = data.address;
    this.avatar = data.avatar;
  }

  ban(address, topic) {
    if (this.banned(address, topic)) return;
    const ban = { address, topic };
    this.bannedList.push(ban);
    this.send('ban-user', ban);
  }

  banned(address, topic) {
    return this.bannedList.some(
      (a) => a.address === address && a.topic === topic,
    );
  }

  block(address) {
    if (this.blocked(address)) return;
    this.blockList.push(address);
  }

  //Entries are addresses (or `{ address }` objects).
  blocked(address) {
    return this.blockList.some(
      (a) => a === address || (a && typeof a === 'object' && a.address === address),
    );
  }

  send(type, data) {
    if (!this.rpc) return;
    this.rpc.send(type, data);
  }

  //Resolves with React Native's answer, or undefined after `timeoutMs` (0: waits for it).
  async request(data, timeoutMs = 0) {
    if (!this.rpc) return undefined;
    return await this.rpc.request(data, { timeoutMs });
  }

  sleep(mode, bg) {
    this.sleeping = mode;
    this.background = bg;
  }

  idle() {
    return this.sleeping;
  }
}

let Hugin = new Account();

module.exports = { Hugin, Account };
