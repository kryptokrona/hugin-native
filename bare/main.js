require('./runtime');

// // Tell app we're ready
// Bare.onReady();
const { group_key } = require('./utils');
const {
  send_message,
  create_swarm,
  end_swarm,
  share_file_info,
  close_all_connections,
} = require('./swarm');
const { Hugin } = require('./account');
const { RPC } = require('./rpc');
const { IPC } = BareKit;

const rpc = new RPC(IPC);

rpc.on('data', (data) => check(data));

async function check(data) {
  //return data to React Native
  const send = await onrequest(data);
  if (send === undefined) return;
  rpc.send();
}
const onrequest = async (p) => {
  console.log('Got request data', p);
  switch (p.type) {
    case 'init_bare':
      initBareMain(p.user);
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
      const message = sendRoomMessage(p.message, p.key, p.reply, p.tip);
      return { data: message, type: p.type };
    case 'group_random_key':
      const key = getRandomGroupKey();
      return { data: key, type: p.type };
    case 'begin_send_file':
      sendFileInfo(p.json_file_data);
      break;
    case 'request_download':
      request_download(p.file);
      break;
    case 'keep_alive':
      break;
    case 'idle_status':
      Hugin.sleep(p.mode);
      break;
    case 'close_connections':
      close_all_connections();
      break;
    default:
      console.log('Unknown RPC type:', p.type);
  }
  return 'success';
};

//TODO*****************
const requester = {
  request() {
    console.log('Request data from REACT **');
  },
};

// Function implementations
const initBareMain = async (user) => {
  //userdata, sender ipc, unknown request rpc** todo
  Hugin.init(user, IPC, requester);
};

const updateBareUser = (user) => {
  Hugin.update(user);
};

const newSwarm = async (hashkey, key, admin) => {
  //DISABLED THIS UNTIL ALL REQUEST/SEND FUNCS ARE READY
  if (hashkey) return;
  if (Hugin.rooms.some((a) => a.key === key)) return;
  const topic = await create_swarm(hashkey, key);
  Hugin.rooms.push({ key, topic, admin });
};

const endSwarm = async (key) => {
  const swarm = getRoom(key);
  if (!swarm) return;
  const rooms = Hugin.rooms.filter((a) => a.key !== key);
  Hugin.rooms = rooms;
  await end_swarm(swarm.topic);
};

const sendRoomMessage = (message, key, reply, tip) => {
  const swarm = getRoom(key);
  if (!swarm) return { type: 'Error' };
  return send_message(message, swarm.topic, reply, key, tip);
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
