require('./runtime');

// Tell app we're ready
HelloBare.onReady();
const { group_key } = require('./utils');
// const { hyperBee } = require('./hypercore');
const RPC = require('tiny-buffer-rpc');
const ce = require('compact-encoding');
const {
  send_message,
  send_message_history,
  create_swarm,
  end_swarm,
  ipc,
  share_file_info,
} = require('./swarm');
const { Hugin } = require('./account');

const rpc = new RPC(HelloBare.sendMessage);
HelloBare.onMessage = rpc.recv.bind(rpc);
console.log('Bare main init');

rpc.register(0, {
  request: ce.string,
  response: ce.string,
  onrequest: async (data) => {
    console.log('Got request data', data);
    const parsed = JSON.parse(data);
    switch (parsed.type) {
      case 'init_bare':
        initBareMain(parsed.user, parsed.documentDirectoryPath);
      case 'update_bare_user':
        updateBareUser(parsed.user);
        break;
      case 'new_swarm':
        await newSwarm(parsed.hashkey, parsed.key, parsed.admin);
        break;
      case 'end_swarm':
        endSwarm(parsed.key);
        break;
      case 'send_room_msg':
        return sendRoomMessage(parsed.message, parsed.key, parsed.reply);
      case 'send_history':
        send_message_history(parsed.history, parsed.room, parsed.address);
        break;
      case 'group_random_key':
        return getRandomGroupKey();
      case 'begin_send_file':
        sendFileInfo(parsed.json_file_data);
        break;
      default:
        console.log('Unknown RPC type:', parsed.type);
    }
    return 'success';
  },
});

// Function implementations
const initBareMain = async (user) => {
  const sender = new ipc();
  sender.new(rpc);
  Hugin.init(user);
};

const updateBareUser = (user) => {
  Hugin.update(user);
};

const newSwarm = async (hashkey, key, admin) => {
  const topic = await create_swarm(hashkey, key);
  Hugin.rooms.push({ key, topic, admin });
};

const endSwarm = async (key) => {
  const swarm = getRoom(key);
  if (!swarm) return;
  await end_swarm(swarm.topic);
};

const sendRoomMessage = (message, key, reply) => {
  const swarm = getRoom(key);
  if (!swarm) return;
  return send_message(message, swarm.topic, reply, key);
};

const getRoom = (key) => {
  return Hugin.rooms.find((a) => a.key === key);
};

const getRandomGroupKey = () => {
  return group_key();
};

const sendFileInfo = (json_file_data) => {
  const file_data = JSON.parse(json_file_data);
  const room = getRoom(file_data.key);
  if (!room) {
    console.log('');
    return;
  }
  console.log('Begin streaming file', file_data);
  share_file_info(file_data, room.topic);
};

// Keep the event loop alive
setInterval(() => {}, 2000);
