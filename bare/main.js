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
  share_file_info,
} = require('./swarm');
const { Hugin } = require('./account');

const rpc = new RPC(HelloBare.sendMessage);
HelloBare.onMessage = rpc.recv.bind(rpc);
console.log('Bare main init');

const reqest = rpc.register(2, {
  request: ce.string,
  response: ce.string,
});

//Send

const stream = rpc.register(1, {
  request: ce.string,
  response: ce.string,
});
const sender = stream.createRequestStream();

//Recv

rpc.register(0, {
  request: ce.string,
  response: ce.string,
  onrequest: async (data) => {
    console.log('Got request data', data);
    const p = JSON.parse(data);
    switch (p.type) {
      case 'init_bare':
        initBareMain(p.user, p.documentDirectoryPath);
        break;
      case 'update_bare_user':
        updateBareUser(p.user);
        break;
      case 'new_swarm':
        await newSwarm(p.hashkey, p.key, p.admin);
        break;
      case 'end_swarm':
        endSwarm(p.key);
        break;
      case 'send_room_msg':
        return sendRoomMessage(p.message, p.key, p.reply);
      case 'send_history':
        send_message_history(p.history, p.room, p.address);
        break;
      case 'group_random_key':
        return getRandomGroupKey();
      case 'begin_send_file':
        sendFileInfo(p.json_file_data);
        break;
      case 'request_download':
        request_download(p.file);
        break;
      default:
        console.log('Unknown RPC type:', p.type);
    }
    return 'success';
  },
});

// Function implementations
const initBareMain = async (user, documentDirectoryPath) => {
  // TODO Do something with documentDirectoryPath
  Hugin.init(user, sender, reqest);
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
  if (!swarm) return { type: 'Error' };
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
