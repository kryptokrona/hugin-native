class Account {
  constructor() {
    this.name = '';
    this.address = '';
    this.avatar = '';
    this.rooms = [];
    this.downloadDir = '';
    this.rpc = null;
    this.req = null;
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
    this.name = data.name;
    this.address = data.address;
    this.avatar = data.avatar;
    this.rpc = rpc;
    this.downloadDir = data.downloadDir;
    this.keys = data.keys;
    this.store = data.store ?? data.downloadDir;
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

  blocked(address) {
    return this.blockList.some((a) => a.address === address);
  }

  send(type, data) {
    this.rpc.send(type, data);
  }

  async request(data) {
    return await this.rpc.request(data);
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

module.exports = { Hugin };
