require('./runtime');

const { create_room_invite, encrypt_sealed_box, decrypt_sealed_box } = require('./utils');
const {
  send_message,
  create_swarm,
  end_swarm,
  share_file_info,
  close_all_connections,
  idle,
  send_voice_channel_status,
  send_typing_status,
  send_sdp,
  send_dm_message,
  send_dm_file,
  send_feed_message,
  download_file,
  Nodes
} = require('./swarm');
const { Hugin } = require('./account');
const { Bridge } = require('./rpc');
const { new_beam, send_beam_message } = require('./beam');
const messages = require('./messages');
const syncer = require('./syncer');
const { IPC } = BareKit;

const rpc = new Bridge(IPC);
rpc.on('data', (data) => response(data));

const onrequest = async (p) => {
  switch (p.type) {
    case 'log':
      break;
    case 'get_sealed_box':
      console.log('🎁 Returning sealed box from backend')
      const box = encrypt_sealed_box(p.data.messageKey, p.data.data);
      return { box };
    case 'decrypt_sealed_box':
      console.log('🎁 Decrypting sealed box from backend')
      const plaintext = decrypt_sealed_box(p.data);
      return { plaintext };
    case 'push_registration':
      const pushRegistered = await Nodes.register(p.data);
      return { sent: pushRegistered };
    case 'pm_encrypt': {
      // RN composes a PM; Bare encrypts it with hugin-crypto and hands the
      // wire hex back so RN can pick whether to relay (node) or beam (p2p).
      // RN may also call `pm_send` instead to ship in one step.
      const { wireHex, hash } = await messages.encrypt_pm({
        message: p.message,
        toAddress: p.toAddress,
        name: p.name,
      });
      return { wireHex, hash };
    }
    case 'pm_decrypt': {
      // Used by push notifications (cold app wake): pass the wire bytes, get
      // back plaintext + the deterministic content-addressed hash.
      const result = await messages.decrypt_pm(p.wireHex);
      if (!result) return { failed: true };
      return result;
    }
    case 'push_encrypt': {
      // Wallet/syncer used to do this with tweetnacl-sealed-box on the RN
      // side. Now: ship the small descriptor here, get the wire hex back.
      const wireHex = messages.encrypt_push_registration({
        deviceId: p.deviceId,
        viewTag: p.viewTag,
        type: p.kind === 'call' ? 'call' : undefined,
      });
      return { wireHex };
    }
    case 'room_push_encrypt': {
      const wireHex = messages.encrypt_room_push({
        roomKey: p.roomKey,
        payload: p.payload,
        timestamp: p.timestamp,
        viewTag: p.viewTag,
      });
      return { wireHex };
    }
    case 'room_push_send': {
      // One RPC instead of two: previously RN called room_push_encrypt
      // (Bare→RN→Bare), then send_node_msg (Bare→RN→Bare again). Now we
      // encrypt and ship to the node inside a single Bare round-trip.
      const wireHex = messages.encrypt_room_push({
        roomKey: p.roomKey,
        payload: p.payload,
        timestamp: p.timestamp,
        viewTag: p.viewTag,
      });
      const sent = await Nodes.message(wireHex, p.hash, p.viewTag, 'room');
      return { sent: sent || { success: false } };
    }
    case 'push_register_all': {
      // Consolidates what used to be N+1 round-trips for N rooms:
      //   N × push_encrypt   (one per device/call/room registration)
      // + 1 × push_registration (ship the batch to the node)
      // into a single trip. RN passes the device id, the flags, the
      // pre-computed view tags, and the list of rooms — Bare builds every
      // sealedbox and ships the JSON batch.
      const registrations = [];
      if (p.includeDevicePush) {
        registrations.push(
          messages.encrypt_push_registration({
            deviceId: p.deviceId,
            viewTag: p.deviceViewTag,
          }),
        );
      }
      if (p.includeCallPush) {
        registrations.push(
          messages.encrypt_push_registration({
            deviceId: p.deviceId,
            viewTag: p.callViewTag,
            type: 'call',
          }),
        );
      }
      for (const room of p.rooms || []) {
        registrations.push(
          messages.encrypt_push_registration({
            deviceId: p.deviceId,
            viewTag: room.viewTag,
          }),
        );
      }
      if (registrations.length === 0) {
        return { sent: { success: true, skipped: true } };
      }
      const sent = await Nodes.register(JSON.stringify(registrations));
      return { sent };
    }
    case 'dm_push_decrypt': {
      // Push wakeup path: RN hands in the device sealedbox + the keypair it
      // pulled from Keychain; we open with sodium and return the plaintext.
      const plain = messages.decrypt_dm_push({
        cipherHex: p.cipherHex,
        skHex: p.skHex,
        pkHex: p.pkHex,
      });
      if (!plain) return { failed: true };
      return { plaintext: plain };
    }
    case 'room_push_decrypt': {
      const plain = messages.decrypt_room_push({
        cipherHex: p.cipherHex,
        timestamp: p.timestamp,
        roomKeys: p.roomKeys || [],
      });
      if (!plain) return { failed: true };
      return { plaintext: plain };
    }
    case 'init_bare':
      // p.user.keys carries privateSpendKey + privateViewKey so Bare can
      // sign and PM-encrypt without Bare→RN→Bare round-trips per message.
      initBareMain(p.user);
      break;
    case 'set_bare_keys':
      // Top-up call for keys computed asynchronously (e.g. the deterministic
      // subwallet sign keypair). Merges into Hugin.keys.
      Hugin.setKeys(p.keys);
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
      const message = sendRoomMessage(p.hash, p.message, p.key, p.reply, p.tip);
      return message;
    case 'send_feed_msg':
      const feed_message = await send_feed_message(p.message, p.reply, p.tip);
      return feed_message;
    case 'send_node_msg':
      const sent = await Nodes.message(p.payload, p.hash, p.viewtag, p.kind);
      return {sent};
    case 'pm_send': {
      // RN ships plaintext + intent (beam vs node), Bare encrypts and ships.
      // One RPC, no round-trip back to RN before the network call.
      const { wireHex, hash } = await messages.encrypt_pm({
        message: p.message,
        toAddress: p.toAddress,
        name: p.name,
      });
      if (p.beam) {
        send_dm_message(p.toAddress, wireHex);
        return { success: true, hash };
      }
      const result = await Nodes.message(
        wireHex,
        hash,
        p.viewtag,
        p.call ? 'call' : 'dm',
      );
      return { success: result?.success === true, hash, error: result?.reason };
    }
    case 'sync_from_node':
      const resp = await Nodes.sync(p.request)
      return {resp, background: Hugin.background}
    case 'connect_to_node':
      Nodes.connect(p.address, p.pub)
      return
    case 'group_random_key':
      const keys = create_room_invite();
      return { keys };
    case 'create_account_keypair': {
      // Account identity Ed25519 keypair (used to identify the user inside
      // swarms). Was tweetnacl.sign.keyPair() on the RN side; now sodium.
      const sodium = require('sodium-native');
      const publicKey = Buffer.alloc(sodium.crypto_sign_PUBLICKEYBYTES);
      const secretKey = Buffer.alloc(sodium.crypto_sign_SECRETKEYBYTES);
      sodium.crypto_sign_keypair(publicKey, secretKey);
      return {
        publicKey: publicKey.toString('hex'),
        secretKey: secretKey.toString('hex'),
      };
    }
    case 'derive_box_keypair': {
      // X25519 (curve25519) keypair derived from the user's spend key.
      // Byte-equivalent to the old tweetnacl.box.keyPair.fromSecretKey path:
      // both libraries call crypto_scalarmult_base on the raw 32-byte secret
      // without extra clamping, so previously-registered push pubkeys stay
      // valid across the migration.
      const sodium = require('sodium-native');
      const sk = Buffer.from(p.secretKeyHex, 'hex');
      const pk = Buffer.alloc(sodium.crypto_scalarmult_BYTES);
      sodium.crypto_scalarmult_base(pk, sk);
      return { sk: sk.toString('hex'), pk: pk.toString('hex') };
    }
    case 'sha512_hex': {
      // Replaces tweetnacl.hash. SHA-512 is SHA-512 — sodium's
      // crypto_hash_sha512 produces the exact same 64 bytes tweetnacl did,
      // so existing swarm-topic derivations resolve to the same peers.
      // Returns comma-separated bytes to match the old return shape.
      const sodium = require('sodium-native');
      const out = Buffer.alloc(sodium.crypto_hash_sha512_BYTES);
      sodium.crypto_hash_sha512(out, Buffer.from(p.hex, 'hex'));
      return { bytes: Array.from(out).join(',') };
    }
    case 'begin_send_file':
      sendFileInfo(p.json_file_data);
      break;
    case 'send_dm_file':
      send_dm_file(p.address, p.file);
      break;
    case 'request_download':
      request_download(p.file);
      break;
    case 'group_download':
      download_file(p.file);
      break;
    case 'save_to_downloads':
      const saveResult = await Storage.save_to_downloads(p.hash, p.fileName, p.topic);
      if (saveResult.success) {
        Hugin.send('file-saved-to-downloads', { hash: p.hash, filePath: saveResult.filePath, fileName: p.fileName });
      }
      return saveResult;

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
    case 'typing':
      send_typing_status(p.typing, p.key);
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
  try {
    const send = await onrequest(request);
    if (send === undefined) return;
    send.id = request.id;
    rpc.send(request.type, send);
  } catch (e) {
    try {
      console.error('Bare worklet request failed:', request?.type, e?.stack ?? e);
      if (request?.id !== undefined) {
        rpc.send(request.type, {
          id: request.id,
          error: (e && typeof e === 'object' && 'message' in e) ? e.message : String(e),
        });
      }
    } catch (_) {
      // Never throw from the worklet request handler.
    }
  }
}

// Function implementations
const initBareMain = async (user) => {
  Hugin.init(user, rpc);
  // Bare owns the message-sync loop now. It polls Nodes, decrypts PMs with
  // hugin-crypto, and emits `new-message` events to RN with plaintext.
  syncer.init(Nodes);
};

const updateBareUser = (user) => {
  Hugin.update(user);
};

const newSwarm = async (hashkey, key, admin, beam, chat) => {
  if (Hugin.rooms.some((a) => a.key === key)) return;
  Hugin.rooms.push({ key, topic: null, admin });
  try {
    const topic = await create_swarm(hashkey, key, beam, chat);
    const entry = Hugin.rooms.find((a) => a.key === key);
    if (entry) entry.topic = topic ?? null;
  } catch (e) {
    Hugin.rooms = Hugin.rooms.filter((a) => a.key !== key);
    return;
  }
};

const endSwarm = async (key) => {
  const swarm = getRoom(key);
  if (!swarm) return;
  const rooms = Hugin.rooms.filter((a) => a.key !== key);
  Hugin.rooms = rooms;
  end_swarm(swarm.topic);
};

const sendRoomMessage = (hash, message, key, reply, tip) => {
  const swarm = getRoom(key);
  if (!swarm) return { type: 'Error' };
  return send_message(hash, message, swarm.topic, reply, key, tip);
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
