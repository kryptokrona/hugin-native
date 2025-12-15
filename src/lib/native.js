import { Bridge } from './rpc';
import { Worklet } from 'react-native-bare-kit';
import bundle from '../../app.bundle';
import { keychain, naclHash, nonceFromTimestamp } from '../services/bare';
import { getLatestMessages, getRooms } from '../services/bare/sqlite';
import { sleep } from '@/utils';
import { Wallet } from '../services/kryptokrona';
import { fromHex, hexToUint, toHex } from '../services/utils';
import * as NaclSealed from 'tweetnacl-sealed-box';
import tweetnacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
import { cnFastHash } from '../services/NativeTest';
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


  async typing(typing, key) {
      const data = { type: 'typing', key, typing };
      console.log('Sending typing data:', data)
      rpc.send(data);
  }

  async message(key, message, reply, tip) {
    const data = {
      type: 'send_room_msg',
      key,
      message,
      reply,
      tip,
    };

    const sent_message = await rpc.request(data);

    this.send_room_message_push(sent_message);

    return sent_message;
  }

  async send_room_message_push(message) {

    try {
    const roomKey = message.g.substring(0,64);
    const secretKey = keychain.getNaclKeys(roomKey).secretKey;

    let payload_message = {
      message: message.m, 
      reply: message.r, 
      tip: message.tip || '', 
      hash: message.hash,
      name: message.n,
      address: message.k
    };

    let payload_message_decoded = naclUtil.decodeUTF8(
      JSON.stringify(payload_message),
    );

    const timestamp = message.t;
    const nonce = nonceFromTimestamp(timestamp);

    let secretbox = tweetnacl.secretbox(
      payload_message_decoded,
      nonce,
      secretKey
    );

    let payload_json = {
      box: Buffer.from(secretbox).toString('hex'),
      viewTag: await Wallet.generate_room_view_tag(message.g)
    };

    console.log('🔑 Secretbox encrypted..', payload_json);

    let payload_json_decoded = naclUtil.decodeUTF8(
      JSON.stringify(payload_json),
    );

    console.log('🔑 Encrypting sealed box..');

    let box = new NaclSealed.sealedbox(
      payload_json_decoded,
      nonceFromTimestamp(timestamp),
      hexToUint('6e49ab1a59019b2c22eb27efc5664be419c9d3d58016319cd0915e0494de4071'),
    );

    console.log('🔑 Sealedbox encrypted..');

    //Box object
    let payload_box = {
      box: Buffer.from(box).toString('hex'),
      t: timestamp
    };
    // Convert json to hex
    let payload_hex = toHex(JSON.stringify(payload_box));
    rpc.send({type: 'push_registration', data: payload_hex});


    } catch (e) {
      console.log('❌ Error sending push:', e)
    }
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
    console.log('Closing all connections..');
    const rooms = await getRooms();
    for (const k of rooms) {
      this.leave(k.key);
    }
    worklet.terminate();
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

  idle(mode, background = false, force = false) {
    const data = { type: 'idle_status', mode, background, force };
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

 async message(payload, hash, viewtag) {
  const data = { type: 'send_node_msg', payload, hash, viewtag };
  const {sent} = await rpc.request(data);
  return sent
 }

 connect(address, pub) {
  const data = { type: 'connect_to_node', address, pub };
  rpc.send(data);
 }

 async sync(request) {
  const data = { type: 'sync_from_node', request };
  return await rpc.request(data);
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

export const get_sealed_box = async (data) => {
  const send = { type: 'get_sealed_box', data };
  const { box } = await rpc.request(send);
  return box
};

export const decrypt_sealed_box = async (data) => {
  console.log('🔓 Decrypting box:', data);
  const send = { type: 'decrypt_sealed_box', data };
  const { plaintext } = await rpc.request(send);
  return plaintext
};