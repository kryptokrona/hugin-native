// bare/main.js: every RPC React Native sends (src/lib/native.js) reaches hugin-network through
// bare/host.js with the arguments it needs, and answers keep the shapes React Native reads.

const test = require('brittle');
const b4a = require('b4a');
const sodium = require('sodium-native');
const keys = require('hugin-network/keys');
const push = require('hugin-network/push');
const wire = require('hugin-network/wire');
const { createRouter, respond } = require('../main.js');
const { Host } = require('../host.js');
const adapter = require('../adapter.js');
const {
  fakeRn,
  account,
  FakeP2P,
  ADDRESS,
  CONTACT,
  INVITE,
  SEED,
  DERIVATION,
  TOPIC,
  DM_TOPIC,
  SIG,
  HASH,
  DRIVE_KEY,
  PAST,
} = require('./helpers.js');

const USER = {
  name: 'Native',
  address: ADDRESS,
  avatar: '',
  downloadDir: '/tmp/downloads',
  keys: {},
  store: '/tmp/store',
  files: [],
};

/** A router over a Host with a HuginP2P stand-in, initialised as React Native does. */
async function setup(answers = {}) {
  const rn = fakeRn(answers);
  const hugin = account(rn);
  const host = new Host({ hugin, P2P: FakeP2P });
  const route = createRouter({ host, hugin, rpc: rn });
  t0(await route({ type: 'init_bare', user: USER }));
  return { rn, hugin, host, route, p2p: host.p2p };
}

function t0(v) {
  if (v !== undefined) throw new Error('init_bare answers nothing');
}

test('init_bare: Hugin gets the user, the host starts', async (t) => {
  const { hugin, host, p2p } = await setup();
  t.is(hugin.address, ADDRESS);
  t.is(hugin.store, '/tmp/store');
  t.ok(host.started);
  t.ok(p2p instanceof FakeP2P);
});

test('before init_bare: room and node requests do nothing', async (t) => {
  const rn = fakeRn();
  const hugin = account(rn);
  const host = new Host({ hugin, P2P: FakeP2P });
  const route = createRouter({ host, hugin, rpc: rn });
  t.is(await route({ type: 'new_swarm', key: INVITE, hashkey: 'x', admin: SEED, beam: false, chat: false }), undefined);
  t.alike(await route({ type: 'send_room_msg', key: INVITE, message: 'hi', reply: '', tip: false }), { type: 'Error' });
  t.alike(await route({ type: 'sync_from_node', request: { timestamp: 0 } }), { resp: [], background: false });
  t.alike((await route({ type: 'send_node_msg', payload: 'ab', hash: HASH, viewtag: 'a', kind: 'dm' })).sent.success, false);
  t.is(await route({ type: 'idle_status', mode: true, background: true, force: true }), undefined);
  t.absent(host.started);
});

test('new_swarm (room): joins with the invite and the admin seed; no answer', async (t) => {
  const { route, p2p, rn } = await setup();
  t.is(await route({ type: 'new_swarm', key: INVITE, hashkey: adapter.sha512_csv(INVITE), admin: SEED, beam: false, chat: false }), undefined);
  t.alike(p2p.called('rooms.join'), [[{ invite: INVITE, adminSeed: SEED }]]);
  t.alike(rn.sent('new-swarm'), [{ connected: true, key: INVITE, admin: true, chat: false, beam: false }]);

  await route({ type: 'new_swarm', key: '11'.repeat(64), hashkey: 'x', admin: null, beam: false, chat: false });
  t.is(p2p.called('rooms.join')[1][0].adminSeed, undefined, 'no seed');
});

test('new_swarm (DM): joins the contact with the derivation hash; events keyed by that hash', async (t) => {
  const { route, p2p, rn, host } = await setup();
  await route({ type: 'new_swarm', key: DERIVATION, hashkey: adapter.sha512_csv(DERIVATION), admin: false, beam: true, chat: CONTACT });
  t.alike(p2p.called('rooms.joinDm'), [[{ address: CONTACT, derivationHash: DERIVATION }]]);
  t.alike(rn.sent('new-swarm'), [{ connected: true, key: DERIVATION, admin: false, chat: CONTACT, beam: true }]);
  t.is(host.rnKey(CONTACT), DERIVATION);
  t.is(host.libKey(DERIVATION), CONTACT);
});

test('end_swarm: leaves by the library key; no answer', async (t) => {
  const { route, p2p, rn, host } = await setup();
  await route({ type: 'new_swarm', key: DERIVATION, hashkey: 'x', admin: false, beam: true, chat: CONTACT });
  await route({ type: 'new_swarm', key: INVITE, hashkey: 'x', admin: undefined, beam: false, chat: false });
  t.is(await route({ type: 'end_swarm', key: DERIVATION }), undefined);
  t.is(await route({ type: 'end_swarm', key: INVITE }), undefined);
  t.alike(p2p.called('rooms.leave'), [[CONTACT], [INVITE]]);
  t.alike(rn.sent('end-swarm'), [{ topic: DM_TOPIC }, { topic: TOPIC }]);
  t.is(host.libKey(DERIVATION), DERIVATION, 'forgotten');
});

test('send_room_msg: signed by hugin-network, own text normalised, the answer is the message as sent', async (t) => {
  const { route, p2p } = await setup();
  await route({ type: 'new_swarm', key: INVITE, hashkey: 'x', admin: undefined, beam: false, chat: false });
  const tip = { amount: 5, receiver: CONTACT };
  const sent = await route({ type: 'send_room_msg', hash: 'ff'.repeat(32), key: INVITE, message: '<b>hi</b> &amp; \u{1F44B}', reply: HASH, tip });
  t.alike(p2p.called('rooms.send'), [[INVITE, { message: 'hi & \u{1F44B}', reply: HASH, tip }]], 'the hash React Native passed is not used');
  t.is(sent.signature, SIG);
  t.is(sent.hash, HASH);
  t.is(sent.room, INVITE);

  await route({ type: 'send_room_msg', hash: 'x', key: INVITE, message: 'x', reply: null, tip: false });
  t.alike(p2p.called('rooms.send')[1][1], { message: 'x', reply: '', tip: false });
});

test('send_room_msg: not in the room -> { type: "Error" }; a message that cannot be signed comes back unsigned', async (t) => {
  const { route, p2p } = await setup();
  t.alike(await route({ type: 'send_room_msg', key: INVITE, message: 'hi', reply: '', tip: false }), { type: 'Error' });

  await route({ type: 'new_swarm', key: INVITE, hashkey: 'x', admin: undefined, beam: false, chat: false });
  const err = new Error('room message not signed');
  err.code = 'HUGIN_ROOMS_SIGN';
  p2p.fail.send = err;
  const unsigned = await route({ type: 'send_room_msg', key: INVITE, message: 'hi', reply: '', tip: false });
  t.is(unsigned.signature, '');
  t.is(unsigned.room, INVITE);
  t.is(unsigned.address, ADDRESS);
  t.is(unsigned.message, 'hi');
  t.ok(wire.isRoomMessageHash(unsigned), 'hash derived from the fields');

  const gone = new Error('not in this room');
  gone.code = 'HUGIN_ROOMS_UNKNOWN';
  p2p.fail.send = gone;
  t.alike(await route({ type: 'send_room_msg', key: INVITE, message: 'hi', reply: '', tip: false }), { type: 'Error' });
});

test('send_feed_msg: through p2p.feed, own text normalised', async (t) => {
  const { route, p2p } = await setup();
  const sent = await route({ type: 'send_feed_msg', message: '<i>post</i>', reply: '', tip: false });
  t.alike(p2p.called('feed.send'), [[{ message: 'post', reply: '', tip: false }]]);
  t.is(sent.signature, SIG);
  t.is(sent.nickname, 'Native');

  p2p.results['feed.send'] = new Error('too long');
  const unsent = await route({ type: 'send_feed_msg', message: 'x', reply: undefined, tip: false });
  t.is(unsent.type, 'feed');
  t.is(unsent.signature, '');
  t.is(unsent.address, ADDRESS);
});

test('beam_message, typing: to the DM / room; no answer', async (t) => {
  const { route, p2p } = await setup();
  await route({ type: 'new_swarm', key: DERIVATION, hashkey: 'x', admin: false, beam: true, chat: CONTACT });
  t.is(await route({ type: 'beam_message', address: CONTACT, message: 'cafe' }), undefined);
  t.alike(p2p.called('rooms.sendDm'), [[CONTACT, 'cafe']]);
  t.is(await route({ type: 'typing', key: INVITE, typing: true }), undefined);
  await route({ type: 'typing', key: DERIVATION, typing: 'yes' });
  t.alike(p2p.called('rooms.typing'), [
    [INVITE, true],
    [CONTACT, false],
  ]);
});

test('beam_dm: to the DM, answered with the peers written to', async (t) => {
  const { route, p2p } = await setup();
  t.alike(await route({ type: 'beam_dm', address: CONTACT, message: 'cafe' }), { sent: 0 }, 'no DM swarm: nothing sent');
  await route({ type: 'new_swarm', key: DERIVATION, hashkey: 'x', admin: false, beam: true, chat: CONTACT });
  t.alike(await route({ type: 'beam_dm', address: CONTACT, message: 'beef' }), { sent: 1 });
  t.alike(p2p.called('rooms.sendDm'), [
    [CONTACT, 'cafe'],
    [CONTACT, 'beef'],
  ]);
});

test('beam_dm before init_bare: nothing sent', async (t) => {
  const rn = fakeRn();
  const hugin = account(rn);
  const host = new Host({ hugin, P2P: FakeP2P });
  const route = createRouter({ host, hugin, rpc: rn });
  t.alike(await route({ type: 'beam_dm', address: CONTACT, message: 'cafe' }), { sent: 0 });
});

test('voice_status, send_sdp: to p2p.voice; no answer', async (t) => {
  const { route, p2p } = await setup();
  const status = { key: INVITE, voice: true, video: false, audioMute: true, videoMute: false, screenshare: false };
  t.is(await route({ type: 'voice_status', status, update: false }), undefined);
  await route({ type: 'voice_status', status: { ...status, voice: false }, update: true });
  t.alike(p2p.called('voice.setStatus'), [
    [INVITE, { voice: true, video: false, audioMute: true, videoMute: false, screenshare: false }, { update: false }],
    [INVITE, { voice: false, video: false, audioMute: true, videoMute: false, screenshare: false }, { update: true }],
  ]);
  const sdp = { type: 'answer', key: INVITE, topic: TOPIC, address: CONTACT, data: { sdp: 'x' } };
  t.is(await route({ type: 'send_sdp', data: sdp }), undefined);
  t.alike(p2p.called('voice.sendSdp'), [[{ topic: TOPIC, key: INVITE, address: CONTACT, data: { sdp: 'x' }, type: 'answer', retry: undefined }]]);
});

test('idle_status: force suspends, background idles, foreground resumes', async (t) => {
  const { route, p2p, hugin } = await setup();
  await route({ type: 'idle_status', mode: true, background: true, force: true });
  await route({ type: 'idle_status', mode: true, background: true, force: false });
  await route({ type: 'idle_status', mode: false, background: true, force: false });
  await route({ type: 'idle_status', mode: true, background: false, force: false });
  t.alike(p2p.called('idle'), [[{ force: true }], [{ background: true }], [{ background: false }]]);
  t.is(hugin.sleeping, true);
  t.is(hugin.background, false);
});

test('close_connections: room connections closed, swarms resumed', async (t) => {
  const { route, p2p } = await setup();
  await route({ type: 'close_connections' });
  t.alike(
    p2p.calls.filter((c) => c[0].startsWith('rooms.')).map((c) => c[0]),
    ['rooms.suspend', 'rooms.resume'],
  );
  p2p.rooms.suspended = true;
  await route({ type: 'close_connections' });
  t.is(p2p.called('rooms.suspend').length, 1, 'not while suspended');
});

test('hugin-node: connect, sync, post, push registrations', async (t) => {
  const { route, p2p } = await setup();
  t.is(await route({ type: 'connect_to_node', address: '', pub: true }), undefined);
  await route({ type: 'connect_to_node', address: 'SEKRe' + 'n'.repeat(94) + DRIVE_KEY, pub: false });
  await route({ type: 'connect_to_node', address: '', pub: false });
  await new Promise((resolve) => setTimeout(resolve, 0));
  t.alike(p2p.called('node.connect'), [[{ publicNode: true }], [{ address: 'SEKRe' + 'n'.repeat(94) + DRIVE_KEY }]], 'no address: nothing');

  const synced = await route({ type: 'sync_from_node', request: { request: true, type: 'some', timestamp: PAST } });
  t.alike(synced, { resp: [{ hash: HASH, cipher: 'ab', timestamp: PAST }], background: false });
  t.alike(p2p.called('node.sync'), [[{ since: PAST }]]);
  await route({ type: 'sync_from_node', request: {} });
  t.alike(p2p.called('node.sync')[1], [{ since: 0 }], 'never without a timestamp');

  t.alike(await route({ type: 'send_node_msg', payload: 'abcd', hash: HASH, viewtag: 'a1', kind: 'call' }), { sent: { success: true, id: PAST } });
  t.alike(p2p.called('node.post'), [[{ cipher: 'abcd', hash: HASH, viewtag: 'a1', kind: 'call' }]]);
  const refused = new Error('cipher');
  refused.name = 'PacketError';
  p2p.results['node.post'] = refused;
  t.alike(await route({ type: 'send_node_msg', payload: 'zz', hash: HASH, viewtag: 'a1', kind: 'dm' }), { sent: { success: false, reason: 'invalid_packet' } });

  t.alike(await route({ type: 'push_registration', data: '[]' }), { sent: { success: true, id: PAST } });
  t.alike(p2p.called('node.register'), [['[]']]);
});

test('push_register_all: one sealed batch; nothing to register: skipped', async (t) => {
  const { route, p2p } = await setup();
  const res = await route({
    type: 'push_register_all',
    deviceId: 'dev',
    includeDevicePush: true,
    includeCallPush: true,
    deviceViewTag: 'aa',
    callViewTag: 'bb',
    rooms: [{ viewTag: 'cc' }, { viewTag: 'dd' }],
  });
  t.alike(res, { sent: { success: true, id: PAST } });
  const batch = JSON.parse(p2p.called('node.register')[0][0]);
  t.is(batch.length, 4);
  t.ok(batch.every((w) => typeof w === 'string' && /^[0-9a-f]+$/.test(w)), 'sealed boxes (hex)');

  t.alike(await route({ type: 'push_register_all', deviceId: 'dev', includeDevicePush: false, includeCallPush: false, rooms: [] }), {
    sent: { success: true, skipped: true },
  });
  t.is(p2p.called('node.register').length, 1);
});

test('room_push_send: sealed and posted as kind room', async (t) => {
  const { route, p2p } = await setup();
  const message = { hash: HASH, room: INVITE, address: ADDRESS, message: 'hi', name: 'N', reply: '', signature: SIG, timestamp: PAST, tip: false };
  const res = await route({ type: 'room_push_send', roomKey: INVITE.slice(0, 64), payload: message, timestamp: PAST, viewTag: 'ab', hash: HASH });
  t.alike(res, { sent: { success: true, id: PAST } });
  const [post] = p2p.called('node.post')[0];
  t.is(post.kind, 'room');
  t.is(post.hash, HASH);
  t.is(post.viewtag, 'ab');
  t.ok(/^[0-9a-f]+$/.test(post.cipher));
});

test('room_push_decrypt: verified through verify-signature in React Native', async (t) => {
  const { route, rn } = await setup({ 'verify-signature': true });
  const m = { hash: '', room: INVITE, address: ADDRESS, message: 'hi', name: 'N', reply: '', signature: SIG, timestamp: PAST, tip: false };
  m.hash = wire.roomMessageHash(m);
  const pk = b4a.alloc(32);
  const sk = b4a.alloc(32);
  sodium.crypto_box_keypair(pk, sk);
  const sealed = adapter.room_push_wire({ roomKey: INVITE.slice(0, 64), payload: m, timestamp: PAST, viewTag: 'ab', serverPublicKey: pk });
  const box = push.openPushEnvelope(sealed, { publicKey: pk, secretKey: sk }).payload.box;
  const res = await route({ type: 'room_push_decrypt', cipherHex: box, timestamp: PAST, roomKeys: [{ key: INVITE, name: 'Room' }] });
  t.is(res.plaintext.hash, m.hash);
  t.is(res.plaintext.signature, SIG);
  t.is(res.plaintext.roomName, 'Room');
  t.is(rn.requests.filter((r) => r.type === 'verify-signature').length, 1);
  t.alike(await route({ type: 'room_push_decrypt', cipherHex: 'zz', roomKeys: [] }), { failed: true });
});

test('begin_send_file / send_dm_file: shared through the room, shown as our own message', async (t) => {
  const { route, p2p, rn } = await setup();
  await route({ type: 'new_swarm', key: INVITE, hashkey: 'x', admin: undefined, beam: false, chat: false });
  await route({ type: 'new_swarm', key: DERIVATION, hashkey: 'x', admin: false, beam: true, chat: CONTACT });
  rn.clear();

  const file = { key: INVITE, fileName: 'pic.jpg', path: '/tmp/pic.jpg', size: 1234, time: PAST, message: '' };
  t.is(await route({ type: 'begin_send_file', json_file_data: JSON.stringify(file) }), undefined);
  t.alike(p2p.called('rooms.shareFile'), [[INVITE, '/tmp/pic.jpg', { fileName: 'pic.jpg', time: PAST }]]);
  const [own] = rn.sent('swarm-message');
  t.alike(own.message, {
    address: ADDRESS,
    name: 'Native',
    message: 'pic.jpg',
    hash: HASH,
    timestamp: PAST,
    room: INVITE,
    reply: '',
    sent: true,
    history: false,
    file: { path: '/tmp/pic.jpg', fileName: 'pic.jpg', timestamp: PAST, hash: HASH, sent: true, image: true, type: 'image' },
  });

  await route({ type: 'send_dm_file', address: CONTACT, file: { fileName: 'doc.pdf', path: '/tmp/doc.pdf', size: 9, time: PAST } });
  t.alike(p2p.called('rooms.shareFile')[1], [CONTACT, '/tmp/doc.pdf', { fileName: 'doc.pdf', time: PAST }]);
  const [dm] = rn.sent('dm-file');
  t.is(dm.message.conversation, CONTACT);
  t.is(dm.message.room, DERIVATION);
  t.is(dm.message.file.image, false);

  p2p.fail.share = new Error('file name is not allowed');
  rn.clear();
  await route({ type: 'begin_send_file', json_file_data: JSON.stringify(file) });
  t.is(rn.events.length, 0, 'nothing shown when it was not shared');
});

test('group_download / save_to_downloads', async (t) => {
  const { route, p2p, rn } = await setup();
  const remote = { fileName: 'a.png', address: CONTACT, size: 10, topic: TOPIC, key: INVITE, chat: CONTACT, hash: HASH, name: 'Ann', time: PAST, driveKey: DRIVE_KEY };
  t.is(await route({ type: 'group_download', file: remote }), undefined);
  await new Promise((resolve) => setTimeout(resolve, 0));
  t.alike(p2p.called('files.download'), [[TOPIC, remote]]);

  const saved = await route({ type: 'save_to_downloads', hash: HASH, fileName: 'a.png', topic: TOPIC });
  t.alike(saved, { success: true, filePath: '/tmp/downloads/a.png' });
  t.alike(p2p.called('files.saveToDownloads'), [[HASH, 'a.png', TOPIC]]);
  t.alike(rn.sent('file-saved-to-downloads'), [{ hash: HASH, filePath: '/tmp/downloads/a.png', fileName: 'a.png' }]);
});

test('keys and sealed boxes', async (t) => {
  const { route } = await setup();
  const { keys: pair } = await route({ type: 'group_random_key' });
  t.ok(keys.isRoomInvite(pair[0]));
  t.ok(/^[0-9a-f]{64}$/.test(pair[1]));
  t.is((await route({ type: 'sha512_hex', hex: INVITE })).bytes, keys.swarmKeyToCsv(keys.roomSwarmKey(INVITE)));
  const identity = await route({ type: 'create_account_keypair' });
  t.ok(/^[0-9a-f]{64}$/.test(identity.publicKey));
  t.ok(/^[0-9a-f]{128}$/.test(identity.secretKey));

  const pk = b4a.alloc(32);
  const sk = b4a.alloc(32);
  sodium.crypto_box_keypair(pk, sk);
  const { box } = await route({ type: 'get_sealed_box', data: { messageKey: b4a.toString(pk, 'hex'), data: 'secret' } });
  const { plaintext } = await route({ type: 'decrypt_sealed_box', data: { skHex: b4a.toString(sk, 'hex'), pkHex: b4a.toString(pk, 'hex'), cipherHex: box } });
  t.is(plaintext, 'secret');
});

test('update_bare_user, keep_alive, log, unknown types: no answer', async (t) => {
  const { route, hugin } = await setup();
  t.is(await route({ type: 'update_bare_user', user: { name: 'Renamed', address: ADDRESS, avatar: '' } }), undefined);
  t.is(hugin.name, 'Renamed');
  t.is(await route({ type: 'keep_alive' }), undefined);
  t.is(await route({ type: 'log' }), undefined);
  t.is(await route({ type: 'new_beam' }), undefined);
});

test('respond: the answer carries the request id and type; failures answer { id, error }', async (t) => {
  const sent = [];
  const rpc = { send: (type, data) => sent.push({ type, data: { ...data } }) };
  await respond(rpc, async () => ({ keys: ['a', 'b'] }), { type: 'group_random_key', id: 4 });
  t.alike(sent[0], { type: 'group_random_key', data: { keys: ['a', 'b'], id: 4 } });
  await respond(rpc, async () => undefined, { type: 'typing', id: 5 });
  t.is(sent.length, 1, 'nothing for no answer');
  await respond(rpc, async () => {
    throw new Error('boom');
  }, { type: 'send_room_msg', id: 6 });
  t.alike(sent[1], { type: 'send_room_msg', data: { id: 6, error: 'boom' } });
  await respond(rpc, async () => {
    throw new Error('boom');
  }, { type: 'typing' });
  t.is(sent.length, 2, 'no id: no answer');
});

test('xkr_daemon_request: a bad invite answers an error, not a throw', async (t) => {
  const { route } = await setup();
  const r = await route({ type: 'xkr_daemon_request', method: 'get', path: '/info', invite: 'xkr:00' });
  t.ok(r.error && /256 hex/.test(r.error), r.error);
});
