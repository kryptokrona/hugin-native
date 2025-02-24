const EventEmitter = require('bare-events');

class RPC extends EventEmitter {
  constructor(ipc) {
    super();
    this.ipc = ipc;
    this.pendingRequests = new Map();
    this.id = 0;
    this.ipc.on('data', (response) => {
      let data = this.parse(response.toString());
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
    data.id = this.id++;
    this.ipc.write(JSON.stringify(data));
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(data.id, { resolve, reject });
    });
  }

  parse(data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      return false;
    }
  }

  send(type, data) {
    const send = data;
    send.type = type;
    this.ipc.write(JSON.stringify(send));
  }

  log(data) {
    return;
  }

}

module.exports = { RPC };
