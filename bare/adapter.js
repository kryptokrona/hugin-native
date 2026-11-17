// Glue between the Bare worklet's RPCs and the pure modules of hugin-network (keys, sanitize, wire,
// push): room invites, the swarm-key hash React Native asks for, and push payloads. Nothing in
// this file touches the network, the file system or bare-rpc, so it can be tested with `bare` or
// Node (bare/test). Rooms, DMs, the feed, files and the hugin-node connection go through
// bare/host.js.

const keys = require('hugin-network/keys');
const sanitize = require('hugin-network/sanitize');
const wire = require('hugin-network/wire');
const push = require('hugin-network/push');

// ---------------------------------------------------------------------------------------------
// keys

/**
 * `group_random_key` RPC: `[invite, adminSeed]`. The invite's admin key is derived from the hex
 * seed (as hugin-desktop does), the key hugin-network signs `joined.signature` with when we join
 * with that seed, so the admin flag of a room created here verifies on every peer.
 */
function create_room_invite() {
  const { invite, adminSeed } = keys.createRoomInvite();
  return [invite, adminSeed];
}

/** `sha512_hex` RPC: SHA-512 over the hex bytes, as comma-separated bytes. */
function sha512_csv(hexString) {
  return keys.swarmKeyToCsv(keys.swarmKey(hexString));
}

// ---------------------------------------------------------------------------------------------
// push payloads

/**
 * Room push for the push node (hugin-network/push `sealRoomPush`): the room message (the fields a
 * room message has) in a secretbox keyed by the room key, with a random nonce in front of the
 * box, sealed to the push server. `timestamp` is the envelope's `t`.
 */
function room_push_wire({ roomKey, payload, timestamp, viewTag, serverPublicKey }) {
  const ts = typeof timestamp === 'string' && /^[0-9]+$/.test(timestamp) ? Number(timestamp) : timestamp;
  return push.sealRoomPush({
    invite: roomKey,
    payload: push.roomPushPayload(payload),
    timestamp: ts,
    viewTag,
    serverPublicKey,
  });
}

/** Push registration (`{ deviceId, viewTag[, type] }` sealed to the push server). */
function registration_wire({ deviceId, viewTag, type, serverPublicKey }) {
  return push.sealRegistration({ deviceId, viewTag, type, serverPublicKey });
}

/**
 * Opens a room push (hugin-network/push `openRoomPush`: the box is hex(nonce || secretbox), the
 * nonce is read from the box) with the first room key that fits; adds `roomKey` and
 * `roomName`. `timestamp` is accepted for the RPC's shape and not used.
 */
function open_room_push({ cipherHex, roomKeys }) {
  return push.openRoomPush({ cipherHex, roomKeys });
}

// Same limit as hugin-network's Room option `maxClockSkewMs`.
const ROOM_PUSH_MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

/**
 * Opens a room push and checks the room message in it as a live room message is checked on the
 * swarm: hugin-network's room message validator (64 hex hash), the room it names is the room whose
 * key opened it, the timestamp is not too far ahead, the hash is the one derived from the
 * fields (`wire.isRoomMessageHash`), and `verify(wire.roomMessageSigningPayload(m), address,
 * signature)` resolves to exactly `true`. Returns the validated message with `roomKey` and
 * `roomName`, or false; its fields are as they were signed (React Native stores them as they are,
 * `signature` included). Never throws.
 */
async function open_verified_room_push({ cipherHex, roomKeys }, verify, now = Date.now()) {
  let opened;
  try {
    opened = push.openRoomPush({ cipherHex, roomKeys });
  } catch {
    return false;
  }
  if (!opened || typeof opened !== 'object') return false;
  const { roomKey, roomName } = opened;
  const checked = sanitize.roomMessage(opened, { hexHash: true });
  if (!checked.ok) return false;
  const m = checked.value;
  if (typeof roomKey !== 'string' || m.room !== roomKey) return false;
  if (m.timestamp > now + ROOM_PUSH_MAX_CLOCK_SKEW_MS) return false;
  let payload;
  try {
    payload = wire.roomMessageSigningPayload(m);
  } catch {
    return false;
  }
  if (!wire.isRoomMessageHash(m)) return false;
  if (typeof verify !== 'function') return false;
  let verified = false;
  try {
    verified = (await verify(payload, m.address, m.signature)) === true;
  } catch {
    verified = false;
  }
  if (!verified) return false;
  return { ...m, roomKey, roomName };
}

module.exports = {
  create_room_invite,
  sha512_csv,
  room_push_wire,
  registration_wire,
  open_room_push,
  open_verified_room_push,
};
