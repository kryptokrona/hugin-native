const ce = require('compact-encoding');
class Account {
  constructor() {
    //Random test data
    this.name = 'nils';
    this.address =
      'SEKReTXy5NuZNf9259RRXDR3PsM5r1iKe2sgkDV5QU743f4FspoVAnY4TfRPLBMpCA1HQgZVnmZafQTraoYsS9K41iePDjPZbme';
    this.avatar = '';
    this.rooms = [];
    this.downloadDir = '';
    this.sender = null;
    this.req = null;
    this.keys = {};
    this.bannedList = [];
    this.block_list = [];
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

  blocked(address) {
    return Hugin.block_list.some((a) => a.address === address);
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
