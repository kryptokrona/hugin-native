const EventEmitter = require('bare-events');

const RPC = require('bare-rpc');
const b4a = require('b4a');

//bare-rpc commands between the worklet and React Native (src/lib/rpc.js): requests go out as
//command 1, answers and events as command 2.
const REQUEST = 1;
const MESSAGE = 2;

class Bridge extends EventEmitter {
  constructor(IPC) {
    super();
    this.pendingRequests = new Map();
    this.id = 0;
    this.rpc = new RPC(IPC, (req, error) => {
      const data = this.parse(b4a.toString(req.data));
      //An answer to one of our requests comes as command 2 with the request's id; a request
      //from React Native (command 1) is never taken for one, whatever its id.
      if (req.command !== REQUEST && data && this.pendingRequests.has(data.id)) {
        const { resolve } = this.pendingRequests.get(data.id);
        this.pendingRequests.delete(data.id);
        resolve(data.data);
      } else {
        this.emit('data', data);
      }
    });
  }

  //Resolves with React Native's answer; with `timeoutMs` > 0, with undefined when none came
  //by then.
  request(data, { timeoutMs = 0 } = {}) {
    return new Promise((resolve) => {
      const id = this.id++;
      data.id = id;
      let timer = null;
      this.pendingRequests.set(id, {
        resolve: (value) => {
          if (timer) clearTimeout(timer);
          resolve(value);
        },
      });
      if (timeoutMs > 0) {
        timer = setTimeout(() => {
          if (!this.pendingRequests.has(id)) return;
          this.pendingRequests.delete(id);
          resolve(undefined);
        }, timeoutMs);
      }
      const resp = this.rpc.request(REQUEST);
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
    const resp = this.rpc.request(MESSAGE);
    resp.send(JSON.stringify(send));
  }

  log(comment, data) {
    this.send('log', { comment, data });
  }
}

module.exports = { Bridge, REQUEST, MESSAGE };
