const EventEmitter = require('bare-events');

const RPC = require('bare-rpc');
const b4a = require('b4a');
class Bridge extends EventEmitter {
  constructor(IPC) {
    super();
    this.pendingRequests = new Map();
    this.id = 0;
    this.rpc = new RPC(IPC, (req, error) => {
      const data = this.parse(b4a.toString(req.data));
      if (this.pendingRequests.has(data.id)) {
        const { resolve, reject } = this.pendingRequests.get(data.id);
        resolve(data.data);
        this.pendingRequests.delete(data.id);
      } else {
        this.emit('data', data);
      }
    });
  }

  request(data) {
    return new Promise((resolve, reject) => {
      data.id = this.id++;
      this.pendingRequests.set(data.id, { resolve, reject });
      const resp = this.rpc.request('request');
      resp.send(JSON.stringify(data));
    });
  }

  parse(data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      return false;
    }
  }

  send(type, send) {
    send.type = type;
    const resp = this.rpc.request('send');
    resp.send(JSON.stringify(send));
  }

  log(comment, data) {
    this.send('log', { comment, data });
  }
}

module.exports = { Bridge };
