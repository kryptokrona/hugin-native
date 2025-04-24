import { Bridge } from './rpc';
import { Worklet } from 'react-native-bare-kit';
import bundle from '../../app.bundle';
import { naclHash } from '../services/bare';
import { getLatestMessages, getRooms } from '../services/bare/sqlite';
import { sleep } from '@/utils';
import { Wallet } from '../services/kryptokrona';
const worklet = new Worklet();
const { IPC } = worklet;

const rpc = new Bridge(IPC);
////////////////////////////////////////////////////////////////
export class Swarm {
  constructor() {}

  async start() {
    worklet.start('/app.bundle', bundle);
    console.log("Bundler started..............................")
  }

  resume() {
    worklet.resume();
  }

  pause() {
    worklet.suspend();
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

  async feed_message(message, reply, tip) {
    const data = {
      type: 'send_feed_msg',
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
    const data = {
      type: 'new_swarm',
      key,
      hashkey,
      admin,
      beam: false,
      chat: false,
    };
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

  idle(mode, background = false) {
    const data = { type: 'idle_status', mode, background };
    rpc.send(data);
  }

  voice(status, update) {
    const data = { type: 'voice_status', status, update };
    rpc.send(data);
  }

  sdp(data) {
    const data_to_send = { type: 'send_sdp', data };
    rpc.send(data_to_send);
  }
}

////////////////////////////////////////////////////////////////

class Beams {
  constructor() {}

  connect(hashkey, key, address) {
    const data = {
      type: 'new_swarm',
      key,
      hashkey,
      admin: false,
      beam: true,
      chat: address,
    };
    rpc.send(data);
  }

  async join() {
    const contacts = await getLatestMessages();
    for (const c of contacts) {
      await this.new(c.address);
    }
  }

  message(address, message) {
    const data = { type: 'beam_message', address, message };
    rpc.send(data);
  }

  async new(address) {
    const hash = await Wallet.key_derivation_hash(address);
    this.connect(naclHash(hash), hash, address);
  }

  async file(address, file) {
    const data = { type: 'send_dm_file', address, file };
    rpc.send(data);
  }

}

class NodeConnection {
  constructor() {
    this.address = null
  }

 async message(payload, hash) {
  const data = { type: 'send_node_msg', payload, hash };
  const {sent} = await rpc.request(data);
  return sent
 }

 connect(address, pub) {
  const data = { type: 'connect_to_node', address, pub };
  rpc.send(data);
 }

 async sync(request) {
  const data = { type: 'sync_from_node', request };
  const {resp} = await rpc.request(data);
  return resp
 }
 
}

////////////////////////////////////////////////////////////////

export const Nodes = new NodeConnection();

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
