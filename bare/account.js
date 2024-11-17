const ce = require('compact-encoding');
class Account {
  constructor() {
    this.name = '';
    this.address = '';
    this.avatar = '';
    this.rooms = [];
    this.downloadDir = '';
    this.sender = null;
    this.req = null;
    this.keys = {};
    this.bannedList = [];
    this.blockList = [];
  }

  init(data, sender, req) {
    this.name = data.name;
    this.address = data.address;
    this.avatar = data.avatar;
    this.sender = sender;
    this.req = req;
    this.downloadDir = data.downloadDir;
    this.keys = data.keys;
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
    console.log('Send rpc data from bare');
    const send = data;
    send.type = type;
    this.sender.write(JSON.stringify(send));
  }

  async request(data) {
    const r = await this.req.request(JSON.stringify(data));
    console.log('got req', r);
    const parse = JSON.parse(r);
    return parse;
  }
}

let Hugin = new Account();

module.exports = { Hugin };
