require('./runtime');
const { group_key } = require('./utils');
// const { hyperBee } = require('./hypercore');
const RPC = require('tiny-buffer-rpc');
const ce = require('compact-encoding');
const {
  Swarm,
  share_file_with_message,
  send_message,
  send_message_history,
} = require('./swarm');
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
        return newSwarm(parsedData.key);
      case 'end_swarm':
        endSwarm(parsedData.key);
        break;
      case 'send_room_msg':
        return sendRoomMessage(
          parsedData.message,
          parsedData.key,
          parsedData.reply,
          parsedData.invite,
        );

      case 'send_history':
        send_message_history(
          parsedData.history,
          parsedData.room,
          parsedData.address,
        );
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
  console.log('Started new swarm with hashed key:', key);
  Hugin.rooms.push({ key, topic });
  return topic;
};

const endSwarm = async (key) => {
  const swarm = getRoom(key);
  if (!swarm) return;
  await swarm.end(swarm.topic);
};

const sendRoomMessage = (message, key, reply, invite) => {
  const swarm = getRoom(key);
  if (!swarm) return;
  return send_message(message, swarm.topic, reply, invite);
};

const getRoom = (key) => {
  return Hugin.rooms.find((a) => a.key === key);
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
