require('./runtime');

const { create_room_invite } = require('./utils');
const {
  send_message,
  create_swarm,
  end_swarm,
  share_file_info,
  close_all_connections,
  idle,
  send_voice_channel_status,
  send_sdp,
  send_dm_message,
  send_dm_file,
  send_feed_message,
  Nodes
} = require('./swarm');
const { Hugin } = require('./account');
const { Bridge } = require('./rpc');
const { new_beam, send_beam_message } = require('./beam');
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
    case 'new_beam':
      await new_beam(p.key, p.huginAddress, p.send);
      break;
    case 'beam_message':
      send_dm_message(p.address, p.message);
      break;
    case 'new_swarm':
      await newSwarm(p.hashkey, p.key, p.admin, p.beam, p.chat);
      break;
    case 'end_swarm':
      return await endSwarm(p.key);
    case 'send_room_msg':
      const message = sendRoomMessage(p.message, p.key, p.reply, p.tip);
      return message;
    case 'send_feed_msg':
      const feed_message = await send_feed_message(p.message, p.reply, p.tip);
      return feed_message;
    case 'send_node_msg':
      const sent = await Nodes.message(p.payload, p.hash);
      return {sent};
    case 'sync_from_node':
      const resp = await Nodes.sync(p.request)
      return {resp}
    case 'connect_to_node':
      Nodes.connect(p.address, p.pub)
      return
    case 'group_random_key':
      const keys = create_room_invite();
      return { keys };
    case 'begin_send_file':
      sendFileInfo(p.json_file_data);
      break;
    case 'send_dm_file':
      send_dm_file(p.address, p.file);
      break;
    case 'request_download':
      request_download(p.file);
      break;
    case 'keep_alive':
      break;
    case 'idle_status':
      Hugin.sleep(p.mode, p.background);
      idle(p.background, p.force);
      break;
    case 'close_connections':
      close_all_connections();
      break;
    case 'voice_status':
      send_voice_channel_status(p.status.voice, p.status, p.update);
      break;
    case 'send_sdp':
      send_sdp(p.data);
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

const newSwarm = async (hashkey, key, admin, beam, chat) => {
  if (Hugin.rooms.some((a) => a.key === key)) return;
  const topic = await create_swarm(hashkey, key, beam, chat);
  Hugin.rooms.push({ key, topic, admin });
};

const endSwarm = async (key) => {
  const swarm = getRoom(key);
  if (!swarm) return;
  const rooms = Hugin.rooms.filter((a) => a.key !== key);
  Hugin.rooms = rooms;
  end_swarm(swarm.topic);
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
