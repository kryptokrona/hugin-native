// Push-only crypto wrappers, kept in Bare so the push pipeline can stay
// hugin-push-node-compatible without round-tripping into RN.
//
// All PM encrypt/decrypt + the syncer moved back to RN — those use the
// noble-based hugin-crypto (ML-KEM-512 + double-encrypt). Push payloads
// don't need PQ today (they're delivered by the push server, which lives
// outside the device's threat model).
//
// What's here:
//   - `encrypt_push_registration`  (device / call / room registration sealedbox)
//   - `encrypt_room_push`          (two-layer: room secretbox -> push-server sealedbox)
//   - `decrypt_dm_push`            (open the device's per-user sealedbox)
//   - `decrypt_room_push`          (try each known room key against the inner)
//
// The fixed push-server public key is shared with hugin-desktop + hugin-push-node;
// rotating it requires a coordinated server + client update.

const sodium = require('sodium-native');

const PUSH_SERVER_PUBKEY_HEX =
  '6e18d19b3c94f7c2c4da5dc6f17305f8ab6da33f8beb18e63a0f048d2a21c345';

const FIXED_NONCE_LEN = 24;

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
  const innerKey = Buffer.from(roomKey, 'hex');
  if (innerKey.length !== sodium.crypto_secretbox_KEYBYTES) {
    throw new Error('room key must be 32 bytes (64 hex chars)');
  }
  const innerNonce = nonceFromTimestamp(timestamp);
  const innerPlain = Buffer.from(JSON.stringify(payload), 'utf-8');
  const innerBox = Buffer.alloc(innerPlain.length + sodium.crypto_secretbox_MACBYTES);
  sodium.crypto_secretbox_easy(innerBox, innerPlain, innerNonce, innerKey);
  const innerEnvelope = { box: innerBox.toString('hex'), viewTag };
  return seal_to_push_server(innerEnvelope, timestamp);
}

// --------------------------------------------------------------------------
// Push decryption — room only.
//
// DM pushes are NOT sealed by the push server. The server just routes the
// sender's hugin-crypto v0.2 wire bytes to subscribers based on viewTag,
// so RN decrypts them directly via hugin-crypto (noble + ML-KEM). No
// Bare round-trip needed.
//
// Rooms still seal-then-route through the push server today (the server
// peels the outer sealedbox to learn viewTag, then forwards the inner
// secretbox). Eventually that could move to "ship viewTag alongside the
// inner box" so the server stops decrypting too — out of scope for now.
// --------------------------------------------------------------------------

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
  encrypt_push_registration,
  encrypt_room_push,
  decrypt_room_push,
};
