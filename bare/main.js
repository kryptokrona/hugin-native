require('./runtime');
const RPC = require('tiny-buffer-rpc');
const ce = require('compact-encoding');
const { Swarm } = require('./swarm');
const { Hugin } = require('./account');

const rpc = new RPC(HelloBare.sendMessage);
HelloBare.onMessage = rpc.recv.bind(rpc);
console.log('Bare main init');

rpc.register(0, {
  request: ce.string,
  response: ce.string,
  onrequest: (data) => {
    init_bare_main(data);
    return 'init';
  },
});

rpc.register(1, {
  request: ce.string,
  response: ce.string,
  onrequest: async (key) => {
    new_swarm(key);
    return 'swarm';
  },
});

rpc.register(3, {
  request: ce.string,
  response: ce.string,
  onrequest: async (key) => {
    end_swarm(key);
    return 'endswarm';
  },
});

async function init_bare_main(data) {
  console.log('Bare main started. maybe some account data from front end ');
}

//SWARM

const new_swarm = async (key) => {
  const swarm = new Swarm(rpc);
  swarm.channel();
  if (!swarm) return;
  const topic = await swarm.start(key);
  Hugin.rooms.push({ swarm, topic });
};

const end_swarm = async (topic) => {
  const swarm = Hugin.rooms.find((a) => a.topic === topic);
  if (!swarm) return;
  await swarm.end(swarm.topic);
};

//BEAM

// tell app we're ready
HelloBare.onReady();

// keep the event loop alive
setInterval(() => {}, 2000);
