import { RPC } from './rpc';
import { Worklet } from 'react-native-bare-kit';
import bundle from '../../app.bundle';
import { naclHash } from '../services/bare';
import { getRooms } from '../services/bare/sqlite';
import { sleep } from '@/utils';

const worklet = new Worklet();
const { IPC } = worklet;
const rpc = new RPC(IPC);
IPC.setEncoding('utf8');

export class Bare {
  constructor() {}

  async start() {
    await worklet.start('/app.bundle', bundle);
  }

  resume() {
    worklet.resume();
  }

  async join() {
    const rooms = await getRooms();
    for (const r of rooms) {
      await swarm(naclHash(r.key), r.key, r?.seed);
      await sleep(50);
    }
  }

  async close() {
    const rooms = await getRooms();
    for (const r of rooms) {
      end_swarm(r.key);
    }
  }
}

export const P2P = new Bare();

// Exported functions to client
export const bare = async (user) => {
  const data = {
    type: 'init_bare',
    user,
  };
  return rpc.send(data);
};

export const update_bare_user = async (user) => {
  const data = { type: 'update_bare_user', user };
  return rpc.send(data);
};

export const swarm = async (hashkey, key, admin) => {
  const data = { type: 'new_swarm', key, hashkey, admin };
  rpc.send(data);
};

export const end_swarm = (key) => {
  const data = { type: 'end_swarm', key };
  return rpc.send(data);
};

export const send_swarm_msg = async (key, message, reply, tip) => {
  const data = {
    type: 'send_room_msg',
    key,
    message,
    reply,
    tip,
  };
  const resp = await rpc.request(data);
  return resp;
};

export const group_random_key = async () => {
  const data = { type: 'group_random_key' };
  return await rpc.request(data);
};

export const begin_send_file = (json_file_data) => {
  const data = { type: 'begin_send_file', json_file_data };
  return rpc.send(data);
};

export const keep_alive = () => {
  const data = { type: 'keep_alive' };
  rpc.send(data);
};

export const send_idle_status = (status) => {
  const data = { type: 'idle_status', mode: status };
  rpc.send(data);
};

export const close_all_connections = () => {
  const data = { type: 'close_connections' };
  rpc.send(data);
};
