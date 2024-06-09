require('./runtime');
const { group_key } = require('./utils');
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
    return new_swarm(key);
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

rpc.register(4, {
  request: ce.string,
  response: ce.string,
  onrequest: (data, topic) => {
    send_room_message(data, topic);
    return 'sendroommsg';
  },
});

rpc.register(5, {
  request: ce.string,
  response: ce.string,
  onrequest: () => {
    return get_random_group_key();
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
  return topic;
};

const end_swarm = async (topic) => {
  const swarm = get_room(topic);
  if (!swarm) return;
  await swarm.end(topic);
};

const send_room_message = (message, topic) => {
  const swarm = get_room(topic);
  if (!swarm) return;
  swarm.send_message(message, topic);
};

const get_room = (topic) => {
  return Hugin.rooms.find((a) => a.topic === topic);
};

const get_random_group_key = () => {
  return group_key();
};

//BEAM

// tell app we're ready
HelloBare.onReady();

// keep the event loop alive
setInterval(() => {}, 2000);
