// All PM + push crypto for the Bare side. One place that owns the cipher.
//
// RN never imports crypto code; it ships plaintext + intent here via RPC, we
// build the wire shape, and we either ship to node or hand the cipher back.
//
// On receive (node-poll or beam or push wakeup), the wire bytes come in here,
// we decrypt with the user's view key, and a plaintext object is what leaves
// this module. Both sides of the wire are deterministic — sender and receiver
// compute the same hugin-crypto `messageHash` from the cipher bytes.

const sodium = require('sodium-native');
const hc = require('hugin-crypto');
const { Hugin } = require('./account');

// Fixed curve25519 public key owned by hugin-push-node. Mobile and desktop both
// encrypt push registrations / room push payloads to this key; the push server
// decrypts with the matching secret.
const PUSH_SERVER_PUBKEY_HEX =
  '6e18d19b3c94f7c2c4da5dc6f17305f8ab6da33f8beb18e63a0f048d2a21c345';

const FIXED_NONCE_LEN = 24;

// Pad a timestamp to a 24-byte nonce. Matches the desktop scheme exactly so
// boxes encrypted on either client are decryptable by the other.
function nonceFromTimestamp(tmstmp) {
  const hex = String(tmstmp);
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16));
  }
  while (bytes.length < FIXED_NONCE_LEN) bytes.push(0);
  return Buffer.from(bytes.slice(0, FIXED_NONCE_LEN));
}

function toHexUtf8(str) {
  return Buffer.from(str, 'utf-8').toString('hex');
}

// --------------------------------------------------------------------------
// Private messages (PMs) — every PM is a signed, ephemeral friend-request box.
// Fresh ephemeral key per message means: a fresh view tag each time
// (unlinkable on-chain), the receiver only needs its own view key to open,
// and the sender's xkr signature inside binds the message to the claimed
// `from` address.
// --------------------------------------------------------------------------

/** Encrypt a PM to `toAddress`. Returns the wire hex (encodeExtra format). */
async function encrypt_pm({ message, toAddress, name }) {
  const fromAddress = Hugin.address;
  // Spend key cached in Hugin.keys at init_bare — no Bare→RN round-trip
  // per send. (Was `await Hugin.request({type: 'get-priv-key'})` before.)
  const fromSpendKey = Hugin.keys?.privateSpendKey;
  if (!fromSpendKey) {
    throw new Error('Bare keys not initialized — call init_bare with keys first');
  }
  const wire = await hc.createFriendRequest({
    message,
    sender: { address: fromAddress, privateSpendKey: fromSpendKey },
    toAddress,
    name: name ?? Hugin.name,
  });
  const wireHex = hc.encodeExtra(wire);
  const hash = hc.messageHash(wireHex);
  return { wireHex, hash };
}

/**
 * Decrypt a PM from on-the-wire bytes. Both node-pool sync hits and
 * beam-delivered messages funnel through here.
 *
 * Returns { plaintext: { from, msg, name, t, verified }, hash } or false.
 */
async function decrypt_pm(wireHex, opts = {}) {
  const wire = hc.decodeExtra(wireHex);
  if (!wire || !wire.vt || !wire.txKey) return false;
  const privateViewKey = opts.privateViewKey || Hugin.keys?.privateViewKey;
  if (!privateViewKey) return false;
  const opened = await hc.openFriendRequest(wire, { privateViewKey });
  if (!opened) return false;
  return {
    plaintext: opened,
    hash: hc.messageHash(wireHex),
  };
}

// --------------------------------------------------------------------------
// Push registration: encrypt a small JSON to the push server's public key.
//   - device-push: { deviceId, viewTag }
//   - call-push:   { deviceId, viewTag, type: 'call' }
//   - room-push:   { deviceId, viewTag } (viewTag derived from the room key)
// All three share the same envelope: { box, t } in hex-of-JSON form.
// --------------------------------------------------------------------------

function encrypt_push_registration({ deviceId, viewTag, type }) {
  const payload = type ? { deviceId, viewTag, type } : { deviceId, viewTag };
  return seal_to_push_server(payload, Date.now());
}

function seal_to_push_server(payloadObj, timestamp) {
  const payloadBytes = Buffer.from(JSON.stringify(payloadObj), 'utf-8');
  const pub = Buffer.from(PUSH_SERVER_PUBKEY_HEX, 'hex');
  const sealed = Buffer.alloc(payloadBytes.length + sodium.crypto_box_SEALBYTES);
  sodium.crypto_box_seal(sealed, payloadBytes, pub);
  const envelope = { box: sealed.toString('hex'), t: timestamp };
  return toHexUtf8(JSON.stringify(envelope));
}

// --------------------------------------------------------------------------
// Room push payload: two-layer envelope.
//   inner: secretbox keyed by the room key   (only room members can open)
//   outer: sealedbox to the push server      (server routes by viewTag)
// --------------------------------------------------------------------------

function encrypt_room_push({ roomKey, payload, timestamp, viewTag }) {
  // Inner secretbox
  const innerKey = Buffer.from(roomKey, 'hex');
  if (innerKey.length !== sodium.crypto_secretbox_KEYBYTES) {
    throw new Error('room key must be 32 bytes (64 hex chars)');
  }
  const innerNonce = nonceFromTimestamp(timestamp);
  const innerPlain = Buffer.from(JSON.stringify(payload), 'utf-8');
  const innerBox = Buffer.alloc(innerPlain.length + sodium.crypto_secretbox_MACBYTES);
  sodium.crypto_secretbox_easy(innerBox, innerPlain, innerNonce, innerKey);
  const innerEnvelope = { box: innerBox.toString('hex'), viewTag };
  // Outer sealedbox to the push server
  return seal_to_push_server(innerEnvelope, timestamp);
}

// --------------------------------------------------------------------------
// Push decryption (called when the app is woken by notifee and init runs Bare).
//
//   dm_push: decrypt the device's sealedbox using the wallet-derived keypair.
//   room_push: try each known room key against the inner secretbox.
// --------------------------------------------------------------------------

function decrypt_dm_push({ cipherHex, skHex, pkHex }) {
  const sk = Buffer.from(skHex, 'hex');
  const pk = Buffer.from(pkHex, 'hex');
  const cipher = Buffer.from(cipherHex, 'hex');
  if (cipher.length <= sodium.crypto_box_SEALBYTES) return false;
  const plain = Buffer.alloc(cipher.length - sodium.crypto_box_SEALBYTES);
  const ok = sodium.crypto_box_seal_open(plain, cipher, pk, sk);
  if (!ok) return false;
  try {
    return JSON.parse(plain.toString('utf-8'));
  } catch (e) {
    return false;
  }
}

function decrypt_room_push({ cipherHex, timestamp, roomKeys }) {
  const cipher = Buffer.from(cipherHex, 'hex');
  const nonce = nonceFromTimestamp(timestamp);
  if (cipher.length <= sodium.crypto_secretbox_MACBYTES) return false;
  for (const room of roomKeys) {
    const key = Buffer.from(room.key.substring(0, 64), 'hex');
    if (key.length !== sodium.crypto_secretbox_KEYBYTES) continue;
    const plain = Buffer.alloc(cipher.length - sodium.crypto_secretbox_MACBYTES);
    const ok = sodium.crypto_secretbox_open_easy(plain, cipher, nonce, key);
    if (!ok) continue;
    try {
      const parsed = JSON.parse(plain.toString('utf-8'));
      parsed.roomKey = room.key;
      parsed.roomName = room.name;
      return parsed;
    } catch (_) {
      continue;
    }
  }
  return false;
}

module.exports = {
  PUSH_SERVER_PUBKEY_HEX,
  nonceFromTimestamp,
  encrypt_pm,
  decrypt_pm,
  encrypt_push_registration,
  encrypt_room_push,
  decrypt_dm_push,
  decrypt_room_push,
};
