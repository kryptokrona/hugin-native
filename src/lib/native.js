import { Bridge } from './rpc';
import { Worklet } from 'react-native-bare-kit';
import bundle from '../../app.bundle';
import { naclHash } from '../services/bare/crypto';
import { getLatestMessages, getRooms } from '../services/bare/sqlite';
import { sleep } from '@/utils';
import { Wallet } from '../services/kryptokrona';
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

  async message(hash, key, message, reply, tip) {
    const data = {
      type: 'send_room_msg',
      hash,
      key,
      message,
      reply,
      tip,
    };

    console.log("Sending message to node", data)
    const sent_message = await rpc.request(data);

    const sent_node = await this.send_room_message_push(sent_message);


    return {sent_message, sent_node};
  }

  async send_room_message_push(message) {
    // Single Bare round-trip: it encrypts (room-key secretbox → sealedbox to
    // push server) AND ships to the node. Previously this was two trips
    // (room_push_encrypt then send_node_msg). RN just computes the view tag
    // up front (uses the RN-side native module, fast + sync).
    try {
      const roomKey = message.room.substring(0, 64);
      const viewTag = await Wallet.generate_room_view_tag(message.room);
      const { sent } = await rpc.request({
        type: 'room_push_send',
        roomKey,
        payload: message,
        timestamp: message.timestamp,
        viewTag,
        hash: message.hash,
      });
      if (sent?.success !== true) {
        const reason = typeof sent?.reason === 'string' ? sent.reason : 'push_registration_failed';
        console.log('❌ Push registration failed:', reason);
      }
      return sent || { success: false };
    } catch (e) {
      console.log('❌ Error sending push:', e);
      return { success: false };
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

  download(file) {
    const data = { type: 'group_download', file };
    rpc.send(data);
  }

  saveToDownloads(hash, fileName, topic) {
    const data = { type: 'save_to_downloads', hash, fileName, topic };
    rpc.send(data);
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

 async message(payload, hash, viewtag, kind = 'dm') {
  const data = { type: 'send_node_msg', payload, hash, viewtag, kind };
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

export const sync_push_registrations = (room_keys = []) => {
  return rpc.sync_push_registrations(room_keys);
};

// --------------------------------------------------------------------------
// PUSH-ONLY Bare RPCs. PM crypto lives in RN now (noble + ML-KEM).
// These wrappers stay because the push pipeline is hugin-push-node-bound and
// we don't want to renegotiate that envelope yet.
// --------------------------------------------------------------------------

/**
 * Build + ship every push registration (device + call + N rooms) in a single
 * Bare round-trip.
 */
export const push_register_all = async ({
  deviceId,
  includeDevicePush,
  includeCallPush,
  deviceViewTag,
  callViewTag,
  rooms,
}) => {
  return await rpc.request({
    type: 'push_register_all',
    deviceId,
    includeDevicePush,
    includeCallPush,
    deviceViewTag,
    callViewTag,
    rooms,
  });
};

export const room_push_decrypt = async ({ cipherHex, timestamp, roomKeys }) => {
  return await rpc.request({
    type: 'room_push_decrypt',
    cipherHex,
    timestamp,
    roomKeys,
  });
};

/** Generate the user's account-identity Ed25519 keypair (was tweetnacl). */
export const create_account_keypair = async () => {
  return await rpc.request({ type: 'create_account_keypair' });
};

/** SHA-512 in the comma-bytes shape the swarm topic derivation expects. */
export const sha512_hex = async (hex) => {
  const { bytes } = await rpc.request({ type: 'sha512_hex', hex });
  return bytes;
};