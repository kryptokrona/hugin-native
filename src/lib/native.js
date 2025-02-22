import { RPC } from './rpc';
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
