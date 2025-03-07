import { Bridge } from './rpc';
import { Worklet } from 'react-native-bare-kit';
import bundle from '../../app.bundle';
import { naclHash } from '../services/bare';
import { getRooms } from '../services/bare/sqlite';
import { sleep } from '@/utils';
import { Wallet } from '../services/kryptokrona';
const worklet = new Worklet();
const { IPC } = worklet;

const rpc = new Bridge(IPC);

////////////////////////////////////////////////////////////////
export class Swarm {
  constructor() {}

  async start() {
    await worklet.start('/app.bundle', bundle);
  }

  async message(key, message, reply, tip) {
    const data = {
      type: 'send_room_msg',
      key,
      message,
      reply,
      tip,
    };
    return await rpc.request(data);
  }

  async join() {
    const rooms = await getRooms();
    for (const r of rooms) {
      this.new(naclHash(r.key), r.key, r?.seed);
      await sleep(100);
    }
  }

  async restart() {
    this.close();
    await sleep(1000);
    await this.join();
  }

  async close() {
    const rooms = await getRooms();
    for (const k of rooms) {
      this.leave(k.key);
    }
  }

  init(user) {
    const data = {
      type: 'init_bare',
      user,
    };
    rpc.send(data);
  }

  new(hashkey, key, admin) {
    const data = { type: 'new_swarm', key, hashkey, admin };
    rpc.send(data);
  }

  file(json_file_data) {
    const data = { type: 'begin_send_file', json_file_data };
    return rpc.send(data);
  }

  leave(key) {
    const data = { type: 'end_swarm', key };
    return rpc.send(data);
  }

  update(user) {
    const data = { type: 'update_bare_user', user };
    return rpc.send(data);
  }

  idle(status) {
    const data = { type: 'idle_status', mode: status };
    rpc.send(data);
  }
}

////////////////////////////////////////////////////////////////

class Beams {
  constructor() {}

  connect(key, huginAddress, send) {
    const data = { type: 'new_beam', key, huginAddress, send };
    rpc.send(data);
  }

  async join() {
    const contacts = await getLatestMessages();
    for (const c of contacts) {
      const hash = await Wallet.key_derivation_hash(c.chat);
      this.connect(hash, c.address + c.messagekey, false);
    }
  }
}

////////////////////////////////////////////////////////////////

export const Rooms = new Swarm();

export const Beam = new Beams();

export const group_random_key = async () => {
  const data = { type: 'group_random_key' };
  const { keys } = await rpc.request(data);
  return keys;
};

export const keep_alive = () => {
  const data = { type: 'keep_alive' };
  rpc.send(data);
};

export const close_all_connections = () => {
  const data = { type: 'close_connections' };
  rpc.send(data);
};
