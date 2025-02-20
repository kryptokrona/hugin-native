import ce from 'compact-encoding';
import { rpc_message } from './rpc';
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
// // RPC FROM FRONT END
export const startBare = () => {
  worklet.start('../../app.bundle', bundle);
  IPC.setEncoding('utf8');
  IPC.write('Hello from React Native!');
};

//If tiny-buffer does not work with worklet IPC
IPC.on('data', async (data) => {
  console.log('Data, data from bare', data);
  //JSON PARSE here ?
  if (data.request === true) {
    //We got a request from bare, answer with some data.
    const answer = await onrequest(data.message);
    //Not sure if we can change this request/response
    const send = { data: answer, type: 'response' };
    IPC.write(JSON.stringify(send));
  } else {
    rpc_message(data);
  }
});

const onrequest = async (data) => {
  const request = JSON.parse(data);
  switch (request.type) {
    case 'get-room-history':
      const messages = await getRoomMessages(request.key, 0, true);
      return JSON.stringify(messages);
    case 'get-latest-room-hashes':
      const hashes = await getLatestRoomHashes(request.key);
      return JSON.stringify(hashes);
    case 'room-message-exists':
      const exists = await roomMessageExists(request.hash);
      return JSON.stringify(exists);
    case 'get-room-message':
      const message = await getRoomReplyMessage(request.hash, true);
      return JSON.stringify(message[0]);
    case 'get-priv-key':
      //Temporary until we sign all messages with xkr address
      const key = Wallet.spendKey();
      return JSON.stringify(key);
    case 'sign-message':
      const sig = await Wallet.sign(request.message);
      return JSON.stringify(sig);
    case 'verify-signature':
      const verify = await Wallet.verify(
        request.data.message,
        request.data.address,
        request.data.signature,
      );
      return JSON.stringify(verify);
  }
};

// Exported functions to client
export const bare = async (user) => {
  const data = JSON.stringify({
    type: 'init_bare',
    user,
  });
  return await mainRPC.write(data);
};

export const update_bare_user = async (user) => {
  const data = JSON.stringify({ type: 'update_bare_user', user });
  return mainRPC.write(data);
};

export const swarm = async (hashkey, key, admin) => {
  const data = JSON.stringify({ type: 'new_swarm', key, hashkey, admin });
  mainRPC.write(data);
};

export const end_swarm = (key) => {
  const data = JSON.stringify({ type: 'end_swarm', key });
  return mainRPC.write(data);
};

export const send_swarm_msg = async (key, message, reply, tip) => {
  const data = JSON.stringify({
    type: 'send_room_msg',
    key,
    message,
    reply,
    tip,
  });
  return await mainRPC.write(data);
};

export const group_random_key = async () => {
  const data = JSON.stringify({ type: 'group_random_key' });
  return await mainRPC.write(data);
};

export const begin_send_file = (json_file_data) => {
  const data = JSON.stringify({ type: 'begin_send_file', json_file_data });
  return mainRPC.write(data);
};

export const keep_alive = () => {
  const data = JSON.stringify({ type: 'keep_alive' });
  mainRPC.write(data);
};

export const send_idle_status = (status) => {
  const data = JSON.stringify({ type: 'idle_status', mode: status });
  mainRPC.write(data);
};

export const close_all_connections = () => {
  const data = JSON.stringify({ type: 'close_connections' });
  mainRPC.write(data);
};
