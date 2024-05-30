require('./runtime');

// tell app we're ready
HelloBare.onReady();

const RPC = require('tiny-buffer-rpc');
const ce = require('compact-encoding');
// const { create_swarm } = require('./swarm');

const rpc = new RPC(HelloBare.sendMessage);
HelloBare.onMessage = rpc.recv.bind(rpc);

rpc.register(0, {
  request: ce.string,
  response: ce.string,
  onrequest: (key) => {
    // create_swarm(key);
    return key;
  },
});

// keep the event loop alive
setInterval(() => {}, 2000);
