// Tests of bare/adapter.js: room invites, the swarm-key hash and push payloads (hugin-network's pure
// modules). Run with `bare bare/test/all.js` (or `npx brittle bare/test/*.test.js` on Node).

const test = require('brittle');
const b4a = require('b4a');
const sodium = require('sodium-native');
const keys = require('hugin-network/keys');
const push = require('hugin-network/push');
const wire = require('hugin-network/wire');
const adapter = require('../adapter.js');

const hex = (bytes) => b4a.toString(b4a.from(bytes), 'hex');

const ADDRESS = 'SEKReYU57DLLvUjNzmjVhaK7jqc8SdZZ3cyKJS5f4gWXK4NQQYChzKUUwzCGhgqUPkWQypeR94rqpgMPjXWG9ijnZKNw2LWXnZU';
const INVITE = 'a0'.repeat(32) + 'b1'.repeat(32);
const HASH = 'c3'.repeat(32);
const SIG = 'ab'.repeat(64);
const PAST = 1731500000000;

const dhtKeyPair = () => keys.newPeerKeys('test').keyPair;

/** A room message with the hash derived from its fields (unless `fields.hash` is given). */
function roomMessage(fields = {}) {
  const m = {
    hash: '',
    room: INVITE,
    address: ADDRESS,
    message: 'hi',
    name: 'Ann',
    reply: '',
    signature: SIG,
    timestamp: PAST,
    tip: false,
    ...fields,
  };
  if (!fields.hash) m.hash = wire.roomMessageHash(m);
  return m;
}

// ---------------------------------------------------------------------------------------------
// keys

test('create_room_invite: the admin signature made with the seed verifies against the invite', (t) => {
  const [invite, seed] = adapter.create_room_invite();
  t.ok(/^[0-9a-f]{128}$/.test(invite), 'invite is 128 hex characters');
  t.ok(/^[0-9a-f]{64}$/.test(seed), 'seed is 64 hex characters');
  t.ok(keys.isRoomInvite(invite));

  const dht = dhtKeyPair();
  const other = dhtKeyPair();
  const sig = hex(keys.signAdmin(seed, dht.publicKey));
  t.ok(/^[0-9a-f]{128}$/.test(sig), 'signature is 128 hex characters');
  t.ok(keys.verifyAdmin(dht.publicKey, sig, invite), 'verifies for the signed key');
  t.absent(keys.verifyAdmin(other.publicKey, sig, invite), 'not for another key');
  t.ok(b4a.equals(keys.adminKeyPair(seed).publicKey, keys.adminPublicKeyFromInvite(invite)), 'the invite carries the seed\'s key');
});

test('sha512_csv: the hashkey React Native sends is SHA-512 of the invite bytes', (t) => {
  const csv = adapter.sha512_csv(INVITE);
  t.is(csv.split(',').length, 64);
  t.is(hex(keys.swarmKeyFromCsv(csv)), hex(keys.roomSwarmKey(INVITE)));
});

// ---------------------------------------------------------------------------------------------
// push payloads

test('room push: sealed to the push server, opened with the room key', (t) => {
  const pk = b4a.alloc(32);
  const sk = b4a.alloc(32);
  sodium.crypto_box_keypair(pk, sk);

  // What React Native passes: the message returned by send_room_msg (with the RPC's id/type).
  const message = roomMessage();
  const payload = { ...message, id: 7, type: 'send_room_msg' };
  for (const timestamp of [PAST, String(PAST)]) {
    const wireHex = adapter.room_push_wire({
      roomKey: INVITE.substring(0, 64),
      payload,
      timestamp,
      viewTag: 'abcde',
      serverPublicKey: pk,
    });
    const envelope = push.openPushEnvelope(wireHex, { publicKey: pk, secretKey: sk });
    t.ok(envelope, 'outer box opens');
    t.is(envelope.t, PAST);
    t.is(envelope.payload.viewTag, 'abcde');

    const opened = adapter.open_room_push({
      cipherHex: envelope.payload.box,
      timestamp: PAST,
      roomKeys: [
        { key: 'ff'.repeat(64), name: 'Other' },
        { key: INVITE, name: 'Room' },
      ],
    });
    t.is(opened.message, 'hi');
    t.is(opened.hash, message.hash);
    t.is(opened.roomKey, INVITE);
    t.is(opened.roomName, 'Room');
    t.absent('id' in opened, 'only room message fields');
    t.absent('type' in opened, 'only room message fields');
  }

  t.is(adapter.open_room_push({ cipherHex: 'zz', timestamp: PAST, roomKeys: [{ key: INVITE }] }), false);

  // Two boxes of the same payload differ (random nonce), and each opens without the timestamp.
  const a = adapter.room_push_wire({ roomKey: INVITE.substring(0, 64), payload, timestamp: PAST, viewTag: 'abcde', serverPublicKey: pk });
  const b = adapter.room_push_wire({ roomKey: INVITE.substring(0, 64), payload, timestamp: PAST, viewTag: 'abcde', serverPublicKey: pk });
  const boxA = push.openPushEnvelope(a, { publicKey: pk, secretKey: sk }).payload.box;
  const boxB = push.openPushEnvelope(b, { publicKey: pk, secretKey: sk }).payload.box;
  t.not(boxA, boxB);
  t.is(boxA.length, boxB.length);
  t.is(adapter.open_room_push({ cipherHex: boxA, roomKeys: [{ key: INVITE, name: 'Room' }] }).hash, message.hash);
  t.is(adapter.open_room_push({ cipherHex: boxB, roomKeys: [{ key: INVITE, name: 'Room' }] }).hash, message.hash);
});

test('room push: only a valid, signed room message of the opening room is returned', async (t) => {
  const pk = b4a.alloc(32);
  const sk = b4a.alloc(32);
  sodium.crypto_box_keypair(pk, sk);
  const OTHER_INVITE = 'd4'.repeat(64);
  const roomKeys = [{ key: INVITE, name: 'Room' }];

  const signed = (fields = {}) => roomMessage(fields);
  const box = (payload) => {
    const wireHex = adapter.room_push_wire({
      roomKey: INVITE.substring(0, 64),
      payload,
      timestamp: payload.timestamp,
      viewTag: 'abcde',
      serverPublicKey: pk,
    });
    return push.openPushEnvelope(wireHex, { publicKey: pk, secretKey: sk }).payload.box;
  };
  const open = (payload, verify, now = PAST) =>
    adapter.open_verified_room_push({ cipherHex: box(payload), timestamp: payload.timestamp, roomKeys }, verify, now);

  const good = signed();
  const calls = [];
  const verifyOk = async (message, address, signature) => {
    calls.push([message, address, signature]);
    return true;
  };
  const opened = await open(good, verifyOk);
  t.ok(opened, 'valid message is returned');
  t.is(opened.hash, good.hash);
  t.is(opened.roomKey, INVITE);
  t.is(opened.roomName, 'Room');
  t.is(opened.timestamp, PAST);
  t.alike(calls, [[wire.roomMessageSigningPayload(good), ADDRESS, SIG]], 'verify gets the signing payload');

  t.is(await open(good, async () => false), false, 'signature that does not verify');
  t.is(await open(good, async () => { throw new Error('x'); }), false, 'verify that throws');
  t.is(await open(good, async () => 1), false, 'verify must give exactly true');
  t.is(await open(good, undefined), false, 'no verify function');
  t.is(await open({ ...good, signature: 'sig' }, verifyOk), false, 'malformed signature');
  t.is(await open({ ...good, hash: HASH }, verifyOk), false, 'hash not derived from the fields');
  t.is(await open({ ...good, message: 'changed' }, verifyOk), false, 'changed field');
  t.is(await open(signed({ room: OTHER_INVITE }), verifyOk), false, 'room other than the opening room');
  const future = signed({ timestamp: PAST + 10 * 60 * 1000 });
  t.is(await open(future, verifyOk), false, 'timestamp too far ahead');

  // React Native stores the fields as they were signed (and serves them back as history)
  const marked = signed({ message: '<b>hi</b> &amp; \u{1F44B}', name: '<i>Ann</i>' });
  const asSigned = await open(marked, verifyOk);
  t.is(asSigned.message, marked.message, 'text as signed');
  t.is(asSigned.name, marked.name, 'name as signed');
  t.is(asSigned.signature, SIG, 'signature returned');
  t.ok(wire.isRoomMessageHash(asSigned), 'still hashes to its hash');
  t.is(
    await adapter.open_verified_room_push({ cipherHex: 'zz', timestamp: PAST, roomKeys }, verifyOk),
    false,
    'not a box',
  );
});

test('push registration: sealed { deviceId, viewTag[, type] }', (t) => {
  const pk = b4a.alloc(32);
  const sk = b4a.alloc(32);
  sodium.crypto_box_keypair(pk, sk);

  const call = push.openPushEnvelope(
    adapter.registration_wire({ deviceId: 'device', viewTag: 'abc', type: 'call', serverPublicKey: pk }),
    { publicKey: pk, secretKey: sk },
  );
  t.alike(call.payload, { deviceId: 'device', viewTag: 'abc', type: 'call' });
  t.is(typeof call.t, 'number');

  const device = push.openPushEnvelope(
    adapter.registration_wire({ deviceId: 'device', viewTag: 'abc', type: undefined, serverPublicKey: pk }),
    { publicKey: pk, secretKey: sk },
  );
  t.alike(device.payload, { deviceId: 'device', viewTag: 'abc' });
});
