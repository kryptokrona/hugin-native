require('./runtime');

const { create_room_invite } = require('./utils');
const {
  send_message,
  create_swarm,
  end_swarm,
  share_file_info,
  close_all_connections,
} = require('./swarm');
const { Hugin } = require('./account');
const { Bridge } = require('./rpc');
const { IPC } = BareKit;

const rpc = new Bridge(IPC);
rpc.on('data', (data) => response(data));

const onrequest = async (p) => {
  switch (p.type) {
    case 'log':
      break;
    case 'init_bare':
      initBareMain(p.user);
      break;
    case 'update_bare_user':
      updateBareUser(p.user);
      break;
    case 'new_swarm':
      await newSwarm(p.hashkey, p.key, p.admin);
      break;
    case 'end_swarm':
      return await endSwarm(p.keys);
    case 'send_room_msg':
      const message = sendRoomMessage(p.message, p.key, p.reply, p.tip);
      return message;
    case 'group_random_key':
      const keys = create_room_invite();
      return { keys };
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
      break;
  }
  return;
};

async function response(request) {
  //return data to React Native
  const send = await onrequest(request);
  if (send === undefined) return;
  send.id = request.id;
  rpc.send(request.type, send);
}

// Function implementations
const initBareMain = async (user) => {
  Hugin.init(user, rpc);
};

const updateBareUser = (user) => {
  Hugin.update(user);
};

const newSwarm = async (hashkey, key, admin) => {
  if (Hugin.rooms.some((a) => a.key === key)) return;
  const topic = await create_swarm(hashkey, key);
  Hugin.rooms.push({ key, topic, admin });
};

const endSwarm = async (keys) => {
  for (const key of keys) {
    const swarm = getRoom(key);
    if (!swarm) return;
    const rooms = Hugin.rooms.filter((a) => a.key !== key);
    Hugin.rooms = rooms;
    end_swarm(swarm.topic);
  }
};

const sendRoomMessage = (message, key, reply, tip) => {
  const swarm = getRoom(key);
  if (!swarm) return { type: 'Error' };
  return send_message(message, swarm.topic, reply, key, tip);
};

const getRoom = (key) => {
  return Hugin.rooms.find((a) => a.key === key);
};

const sendFileInfo = (json_file_data) => {
  const file_data = JSON.parse(json_file_data);
  const room = getRoom(file_data.key);
  if (!room) {
    return;
  }

  share_file_info(file_data, room.topic);
};
