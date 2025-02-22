import { RPC } from './rpc';
import {
  getRoomMessages,
  roomMessageExists,
  getRoomReplyMessage,
  getLatestRoomHashes,
} from '@/services/bare/sqlite';
import { Wallet } from 'services/kryptokrona/wallet';
import { Worklet } from 'react-native-bare-kit';
import bundle from '../../app.bundle';

const worklet = new Worklet();
const { IPC } = worklet;
const rpc = new RPC(IPC);
IPC.setEncoding('utf8');

export const start_bare = async () => {
  await worklet.start('/app.bundle', bundle);
  //Testing stuff here
  rpc.send('React Native started');
};

rpc.on('data', async (data) => {
  const request = JSON.parse(data);
  const response = await onrequest(request);
  if (!response) return;
  rpc.send(JSON.stringify({ id: request.id, data: response }));
});

const onrequest = async (request) => {
  switch (request.type) {
    case 'get-room-history':
      const messages = await getRoomMessages(request.key, 0, true);
      return messages;
    case 'get-latest-room-hashes':
      const hashes = await getLatestRoomHashes(request.key);
      return hashes;
    case 'room-message-exists':
      const exists = await roomMessageExists(request.hash);
      return exists;
    case 'get-room-message':
      const message = await getRoomReplyMessage(request.hash, true);
      return message[0];
    case 'get-priv-key':
      //Temporary until we sign all messages with xkr address
      const key = Wallet.spendKey();
      return key;
    case 'sign-message':
      const sig = await Wallet.sign(request.message);
      return sig;
    case 'verify-signature':
      const verify = await Wallet.verify(
        request.data.message,
        request.data.address,
        request.data.signature,
      );
      return verify;
  }

  return false;
};

// Exported functions to client
export const bare = async (user) => {
  const data = JSON.stringify({
    type: 'init_bare',
    user,
  });
  return rpc.send(data);
};

export const update_bare_user = async (user) => {
  const data = JSON.stringify({ type: 'update_bare_user', user });
  return rpc.send(data);
};

export const swarm = async (hashkey, key, admin) => {
  const data = JSON.stringify({ type: 'new_swarm', key, hashkey, admin });
  rpc.send(data);
};

export const end_swarm = (key) => {
  const data = JSON.stringify({ type: 'end_swarm', key });
  return rpc.send(data);
};

export const send_swarm_msg = async (key, message, reply, tip) => {
  const data = JSON.stringify({
    type: 'send_room_msg',
    key,
    message,
    reply,
    tip,
  });
  return await rpc.request(data);
};

export const group_random_key = async () => {
  const data = JSON.stringify({ type: 'group_random_key' });
  return await rpc.request(data);
};

export const begin_send_file = (json_file_data) => {
  const data = JSON.stringify({ type: 'begin_send_file', json_file_data });
  return rpc.send(data);
};

export const keep_alive = () => {
  const data = JSON.stringify({ type: 'keep_alive' });
  rpc.send(data);
};

export const send_idle_status = (status) => {
  const data = JSON.stringify({ type: 'idle_status', mode: status });
  rpc.send(data);
};

export const close_all_connections = () => {
  const data = JSON.stringify({ type: 'close_connections' });
  rpc.send(data);
};
