require('./runtime');
const { group_key } = require('./utils');
// const { hyperBee } = require('./hypercore');
const RPC = require('tiny-buffer-rpc');
const ce = require('compact-encoding');
const { Swarm, share_file_with_message } = require('./swarm');
const { Hugin } = require('./account');

const rpc = new RPC(HelloBare.sendMessage);
HelloBare.onMessage = rpc.recv.bind(rpc);
console.log('Bare main init');

rpc.register(0, {
  request: ce.string,
  response: ce.string,
  onrequest: (data) => {
    console.log('Got request data', data);
    const parsedData = JSON.parse(data);
    switch (parsedData.type) {
      case 'init_bare':
        initBareMain(parsedData.user, parsedData.documentDirectoryPath);
      case 'update_bare_user':
        updateBareUser(parsedData.user);
        break;
      case 'new_swarm':
        newSwarm(parsedData.key);
        break;
      case 'end_swarm':
        endSwarm(parsedData.topic);
        break;
      case 'send_room_msg':
        sendRoomMessage(parsedData.message, parsedData.topic);
        break;
      case 'group_random_key':
        return getRandomGroupKey();
      case 'begin_send_file':
        beginStreamFile(parsedData.json_file_data);
        break;
      default:
        console.log('Unknown RPC type:', parsedData.type);
    }
    return 'success';
  },
});

// Function implementations
const initBareMain = async (user) => {
  Hugin.init(user);
};

const updateBareUser = (user) => {
  Hugin.update(user);
};

const newSwarm = async (key) => {
  const swarm = new Swarm(rpc);
  await swarm.channel();
  if (!swarm) return;
  const topic = await swarm.start(key);
  Hugin.rooms.push({ swarm, topic });
  return topic;
};

const endSwarm = async (topic) => {
  const swarm = getRoom(topic);
  if (!swarm) return;
  await swarm.end(topic);
};

const sendRoomMessage = (message, topic) => {
  const swarm = getRoom(topic);
  if (!swarm) return;
  swarm.send_message(message, topic);
};

const getRoom = (topic) => {
  return Hugin.rooms.find((a) => a.topic === topic);
};

const getRandomGroupKey = () => {
  return group_key();
};

const beginStreamFile = (json_file_data) => {
  const file_data = JSON.parse(json_file_data);
  console.log('Begin streaming file', file_data);
  share_file_with_message(file_data);
};

// Tell app we're ready
HelloBare.onReady();

// Keep the event loop alive
setInterval(() => {}, 2000);
