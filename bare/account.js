const ce = require('compact-encoding');
class Account {
  constructor() {
    //Random test data
    this.name = 'anon';
    this.address = null;
    this.avatar = '';
    this.rooms = [];
    this.downloadDir = '';
    this.sender = null;
    this.req = null;
  }

  init(data, sender, req) {
    this.name = data.name;
    this.address = data.address;
    this.avatar = data.avatar;
    this.sender = sender;
    this.req = req;
    this.downloadDir = data.downloadDir;
  }

  update(data) {
    this.name = data.name;
    this.address = data.address;
    this.avatar = data.avatar;
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
