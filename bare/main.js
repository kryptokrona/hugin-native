// Entry of the Bare worklet: routes React Native's bare-rpc requests (src/lib/native.js) into
// bare/host.js (hugin-network: rooms, DMs, feed, files, room calls, hugin-node) and the pure helpers
// (bare/adapter.js, bare/utils.js). Every request type and answer shape React Native sends and
// reads is kept; requests React Native sends without waiting for an answer get none.
//
// All PM encrypt/decrypt (and the syncer) live in RN so they can use the noble-based
// hugin-crypto (ML-KEM + double-encrypt) directly without RPC round-trips during the
// protocol's handshake.

const sodium = require('sodium-native');
const b4a = require('b4a');
const { encrypt_sealed_box, decrypt_sealed_box } = require('./utils');
const adapter = require('./adapter');
const { XkrDaemonRequester } = require('hugin-network/xkr-daemon');

function logError(what, err) {
  console.log(what, (err && err.message) || err);
}

/**
 * The request handler: `onrequest(p)` resolves with the answer (`undefined`: none is sent).
 * @param {object} deps
 * @param {import('./host').Host} deps.host
 * @param {object} deps.hugin  bare/account.js
 * @param {object} deps.rpc  bare/rpc.js Bridge (given to Hugin.init)
 */
function createRouter({ host, hugin, rpc }) {
  // The wallet's daemon over Hyperswarm (hugin-network/xkr-daemon): one requester per target
  // (the public wallets topic, or a private node's invite), made on the first request.
  let daemon = null;
  const daemonRequest = async (p) => {
    const target = p.invite || 'public';
    try {
      if (!daemon || daemon.target !== target) {
        if (daemon) daemon.requester.close().catch(() => {});
        daemon = null;
        daemon = {
          target,
          requester: new XkrDaemonRequester({ network: 'mainnet', invite: p.invite || undefined, client: 'hugin-native' }),
        };
      }
      return { answer: await daemon.requester.request(p.method, p.path, p.body) };
    } catch (err) {
      return { error: (err && err.message) || String(err) };
    }
  };

  const pushRegisterAll = async (p) => {
    // One trip for N rooms: the device, call and room registrations are sealed here and sent
    // to the node as one JSON batch.
    const registrations = [];
    if (p.includeDevicePush) {
      registrations.push(adapter.registration_wire({ deviceId: p.deviceId, viewTag: p.deviceViewTag }));
    }
    if (p.includeCallPush) {
      registrations.push(adapter.registration_wire({ deviceId: p.deviceId, viewTag: p.callViewTag, type: 'call' }));
    }
    for (const room of p.rooms || []) {
      registrations.push(adapter.registration_wire({ deviceId: p.deviceId, viewTag: room.viewTag }));
    }
    if (registrations.length === 0) {
      return { sent: { success: true, skipped: true } };
    }
    return { sent: await host.register(JSON.stringify(registrations)) };
  };

  return async function onrequest(p) {
    switch (p.type) {
      case 'log':
        return;

      // sealed boxes, keys
      case 'get_sealed_box':
        return { box: encrypt_sealed_box(p.data.messageKey, p.data.data) };
      case 'decrypt_sealed_box':
        return { plaintext: decrypt_sealed_box(p.data) };
      case 'group_random_key':
        // [invite, admin seed]; the invite's admin key is derived from the hex seed.
        return { keys: adapter.create_room_invite() };
      case 'create_account_keypair': {
        // Account identity Ed25519 keypair (used to identify the user inside swarms).
        const publicKey = b4a.alloc(sodium.crypto_sign_PUBLICKEYBYTES);
        const secretKey = b4a.alloc(sodium.crypto_sign_SECRETKEYBYTES);
        sodium.crypto_sign_keypair(publicKey, secretKey);
        return {
          publicKey: b4a.toString(publicKey, 'hex'),
          secretKey: b4a.toString(secretKey, 'hex'),
        };
      }
      case 'xkr_daemon_request':
        // { method: 'get'|'post', path, body, invite? } -> { answer: { status, body } } or { error }
        return await daemonRequest(p);
      case 'sha512_hex':
        // SHA-512 over the hex bytes (hugin-network/keys `swarmKey`), as comma-separated bytes.
        return { bytes: adapter.sha512_csv(p.hex) };

      // push payloads and hugin-node
      case 'push_registration':
        return { sent: await host.register(p.data) };
      case 'push_encrypt':
        return {
          wireHex: adapter.registration_wire({
            deviceId: p.deviceId,
            viewTag: p.viewTag,
            type: p.kind === 'call' ? 'call' : undefined,
          }),
        };
      case 'room_push_encrypt':
        return {
          wireHex: adapter.room_push_wire({
            roomKey: p.roomKey,
            payload: p.payload,
            timestamp: p.timestamp,
            viewTag: p.viewTag,
          }),
        };
      case 'room_push_send': {
        // Sealed and posted to the node in one trip.
        const wireHex = adapter.room_push_wire({
          roomKey: p.roomKey,
          payload: p.payload,
          timestamp: p.timestamp,
          viewTag: p.viewTag,
        });
        const sent = await host.post({ cipher: wireHex, hash: p.hash, viewtag: p.viewTag, kind: 'room' });
        return { sent: sent || { success: false } };
      }
      case 'push_register_all':
        return pushRegisterAll(p);
      case 'room_push_decrypt': {
        // hugin-network/push opens the box (the nonce is in front of the secretbox) and the room
        // message in it is checked like a live one, signature included.
        const plain = await adapter.open_verified_room_push(
          { cipherHex: p.cipherHex, roomKeys: p.roomKeys || [] },
          host.hooks.verify,
        );
        if (!plain) return { failed: true };
        return { plaintext: plain };
      }
      case 'send_node_msg':
        return { sent: await host.post({ cipher: p.payload, hash: p.hash, viewtag: p.viewtag, kind: p.kind }) };
      case 'sync_from_node':
        return { resp: await host.syncNode(p.request), background: hugin.background };
      case 'connect_to_node':
        host.connectNode(p.address, p.pub).catch((err) => logError('Node connection failed:', err));
        return;

      // identity and lifecycle
      case 'init_bare':
        hugin.init(p.user, rpc);
        host.start();
        return;
      case 'update_bare_user':
        hugin.update(p.user);
        return;
      case 'keep_alive':
        return;
      case 'idle_status':
        hugin.sleep(p.mode, p.background);
        await host.idle({ mode: p.mode, background: p.background, force: p.force });
        return;
      case 'close_connections':
        await host.closeConnections();
        return;

      // rooms and DMs
      case 'new_swarm':
        // `hashkey` (SHA-512 of the key) is derived again by hugin-network from the key itself.
        if (p.beam) await host.joinDm({ key: p.key, chat: p.chat });
        else await host.joinRoom({ key: p.key, admin: p.admin });
        return;
      case 'end_swarm':
        await host.leave(p.key);
        return;
      case 'send_room_msg':
        return host.sendRoomMessage({ key: p.key, message: p.message, reply: p.reply, tip: p.tip });
      case 'send_feed_msg':
        return host.sendFeedMessage({ message: p.message, reply: p.reply, tip: p.tip });
      case 'beam_message':
        host.sendDm(p.address, p.message);
        return;
      case 'beam_dm':
        // As beam_message, answered with the number of the contact's peers written to (0: the
        // contact is not connected and nothing was sent).
        return { sent: Number(host.sendDm(p.address, p.message)) || 0 };
      case 'typing':
        host.typing(p.key, p.typing);
        return;

      // files
      case 'begin_send_file':
        await host.shareFile(JSON.parse(p.json_file_data));
        return;
      case 'send_dm_file':
        await host.shareFile(p.file, { dm: true, conversation: p.address });
        return;
      case 'group_download':
        host.download(p.file).catch((err) => logError('Download failed:', err));
        return;
      case 'save_to_downloads':
        return host.saveToDownloads(p.hash, p.fileName, p.topic);

      // room calls
      case 'voice_status':
        await host.setVoiceStatus(p.status, p.update);
        return;
      case 'send_sdp':
        host.sendSdp(p.data);
        return;

      default:
        return;
    }
  };
}

/** Answers one request; a failing handler answers `{ id, error }` when the request has an id. */
async function respond(rpc, onrequest, request) {
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
          error: e && typeof e === 'object' && 'message' in e ? e.message : String(e),
        });
      }
    } catch (_) {
      // Never throw from the worklet request handler.
    }
  }
}

/** Starts the worklet on react-native-bare-kit's IPC. */
function main(IPC) {
  require('./runtime').installProcessHandlers();
  const { Bridge } = require('./rpc');
  const { Hugin } = require('./account');
  const { Host } = require('./host');
  const rpc = new Bridge(IPC);
  const host = new Host({ hugin: Hugin });
  const onrequest = createRouter({ host, hugin: Hugin, rpc });
  rpc.on('data', (data) => {
    if (!data || typeof data !== 'object') return;
    respond(rpc, onrequest, data);
  });
  return { rpc, host, onrequest };
}

if (typeof BareKit !== 'undefined' && BareKit && BareKit.IPC) main(BareKit.IPC);

module.exports = { createRouter, respond, main };
