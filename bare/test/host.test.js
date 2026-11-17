// Host hooks of bare/host.js (hugin-network README, "Host hooks and events") over a stubbed `Hugin.request`, and the bridge's
// request timeouts.

const test = require('brittle');
const b4a = require('b4a');
const RPC = require('bare-rpc');
const { Duplex } = require('streamx');
const { Host, GOSSIP, mediaOf } = require('../host.js');
const { Bridge, REQUEST, MESSAGE } = require('../rpc.js');
const { fakeRn, account, FakeP2P, ADDRESS, INVITE, CONTACT, DERIVATION, SIG, HASH } = require('./helpers.js');

function setup(answers, user) {
  const rn = fakeRn(answers);
  const hugin = account(rn, user);
  const host = new Host({ hugin, P2P: FakeP2P });
  return { rn, hugin, host, hooks: host.hooks };
}

test('sign: sign-message to React Native (the wallet signs with the spend key)', async (t) => {
  const { rn, hooks } = setup({ 'sign-message': SIG });
  t.is(await hooks.sign('hugin/room-message\n[]'), SIG);
  t.is(rn.requests.length, 1);
  t.is(rn.requests[0].type, 'sign-message');
  t.is(rn.requests[0].message, 'hugin/room-message\n[]');
  t.ok(rn.requests[0].timeoutMs > 0, 'bounded wait');

  const silent = setup({});
  t.is(await silent.hooks.sign('x'), null, 'no answer: no signature');
});

test('verify: verify-signature with { message, address, signature }; only exactly true verifies', async (t) => {
  const { rn, hooks } = setup({ 'verify-signature': true });
  t.is(await hooks.verify('payload', ADDRESS, SIG), true);
  t.alike(rn.requests[0].data, { message: 'payload', address: ADDRESS, signature: SIG });

  for (const answer of [false, 1, 'true', undefined, null, {}]) {
    const s = setup({ 'verify-signature': answer });
    t.is(await s.hooks.verify('payload', ADDRESS, SIG), false, 'answer ' + JSON.stringify(answer));
  }
  const failing = setup({});
  failing.rn.request = () => Promise.reject(new Error('bridge gone'));
  t.is(await failing.hooks.verify('payload', ADDRESS, SIG), false, 'a failing request does not verify');
});

test('room and feed storage queries map to the RPCs React Native answers', async (t) => {
  const row = { hash: HASH, message: 'hi', signature: SIG };
  const { rn, hooks, host } = setup({
    'room-message-exists': (d) => d.hash === HASH,
    'get-room-history': (d) => (d.key === INVITE ? [row] : []),
    'get-room-message': (d) => (d.hash === HASH ? row : undefined),
    'get-latest-room-hashes': [HASH],
    'feed-message-exists': (d) => d.hash === HASH,
    'get-feed-history': [row],
  });
  t.is(await hooks.roomMessageExists(HASH), true);
  t.is(await hooks.roomMessageExists('00'.repeat(32)), false);
  t.alike(await hooks.getRoomHistory(INVITE), [row]);
  t.alike(await hooks.getRoomMessage(HASH), row);
  t.is(await hooks.getRoomMessage('00'.repeat(32)), null);
  t.alike(await hooks.getLatestRoomHashes(INVITE), [HASH]);
  t.is(await hooks.feedMessageExists(HASH), true);
  t.alike(await hooks.getFeedHistory(), [row]);
  t.alike(
    rn.requests.map((r) => r.type),
    [
      'room-message-exists',
      'room-message-exists',
      'get-room-history',
      'get-room-message',
      'get-room-message',
      'get-latest-room-hashes',
      'feed-message-exists',
      'get-feed-history',
    ],
  );
  t.is(rn.requests[2].key, INVITE);
  t.ok(rn.requests.every((r) => r.timeoutMs > 0), 'every lookup has a bounded wait');

  // a DM's library key is the contact; React Native names it by the derivation hash
  host._map(CONTACT, DERIVATION);
  await hooks.getRoomHistory(CONTACT);
  t.is(rn.requests.at(-1).key, DERIVATION);
});

test('storage queries: answers of the wrong shape become empty results', async (t) => {
  const { hooks } = setup({
    'room-message-exists': 'yes',
    'get-room-history': false,
    'get-room-message': [{ hash: HASH }],
    'get-latest-room-hashes': undefined,
    'feed-message-exists': 1,
    'get-feed-history': { hash: HASH },
  });
  t.is(await hooks.roomMessageExists(HASH), false);
  t.alike(await hooks.getRoomHistory(INVITE), []);
  t.is(await hooks.getRoomMessage(HASH), null);
  t.alike(await hooks.getLatestRoomHashes(INVITE), []);
  t.is(await hooks.feedMessageExists(HASH), false);
  t.alike(await hooks.getFeedHistory(), []);
});

test('identity: address, name (markup removed) and avatar from Hugin; updates are read live', (t) => {
  const { hooks, hugin } = setup({}, { name: '<b>Nat</b> &amp; co', avatar: 'aGk=' });
  t.alike(hooks.identity(), { address: ADDRESS, name: 'Nat & co', avatar: 'aGk=' });
  hugin.update({ name: 'New', address: ADDRESS, avatar: '' });
  t.is(hooks.identity().name, 'New');
});

test('policy: bans, blocks, auto-sync, known files', (t) => {
  const { rn, hooks, hugin } = setup({});
  t.absent(hooks.isBanned(ADDRESS, 'e5'.repeat(32)));
  hugin.ban(ADDRESS, 'e5'.repeat(32));
  t.ok(hooks.isBanned(ADDRESS, 'e5'.repeat(32)));
  t.absent(hooks.isBanned(ADDRESS, 'f6'.repeat(32)), 'per room');
  t.alike(rn.sent('ban-user'), [{ address: ADDRESS, topic: 'e5'.repeat(32) }]);
  hugin.ban(ADDRESS, 'e5'.repeat(32));
  t.is(rn.sent('ban-user').length, 1, 'once');

  t.absent(hooks.isBlocked(CONTACT));
  hugin.block(CONTACT);
  t.ok(hooks.isBlocked(CONTACT));
  hugin.blockList.push({ address: ADDRESS });
  t.ok(hooks.isBlocked(ADDRESS), '{ address } entries too');

  t.ok(hooks.autoSyncFiles('e5'.repeat(32), INVITE, false), 'rooms: the syncImages setting');
  hugin.syncImages = false;
  t.absent(hooks.autoSyncFiles('e5'.repeat(32), INVITE, false));
  t.ok(hooks.autoSyncFiles('f6'.repeat(32), CONTACT, true), 'DMs always');

  hugin.files = [HASH, { hash: '11'.repeat(32) }];
  t.ok(hooks.knownFile(HASH));
  t.ok(hooks.knownFile('11'.repeat(32)));
  t.absent(hooks.knownFile('22'.repeat(32)));
});

test('paths: the drives stay where the worklet kept them (<store>/corestorage), downloads as set', (t) => {
  const { hooks, hugin } = setup({}, { store: '/data/app', downloadDir: '/data/dl' });
  t.alike(hooks.paths(), { storage: '/data/app/corestorage', downloads: '/data/dl' });
  hugin.store = '';
  t.is(hooks.paths().storage, '', 'no store: no file storage');
});

test('findShare / powHash: the hugin-pow backend, answered by pow-find-share and cn-turtle-lite-slow-hash-v2', async (t) => {
  const share = { nonce: 'aabbccdd', result: 'ff'.repeat(32), hashes_performed: 840, threads: 4 };
  const { rn, hooks } = setup({ 'pow-find-share': () => ({ ...share }), 'cn-turtle-lite-slow-hash-v2': () => 'AB'.repeat(32) });
  const blobHex = '00'.repeat(76);

  const found = await hooks.findShare({ blobHex, targetHex: 'ffffffff', startNonce: 0xfffffffe, maxAttempts: 1680 });
  t.alike(found, share, 'the native answer as it is (hugin-pow adds the job id)');
  const req = rn.requests[0];
  t.is(req.type, 'pow-find-share');
  t.is(req.blobHex, blobHex);
  t.is(req.targetHex, 'ffffffff');
  t.is(req.startNonce, 0xfffffffe);
  t.is(req.maxAttempts, 1680);
  t.is(req.nonceTagBits, 0);
  t.is(req.nonceTagValue, 0);
  t.is(req.timeoutMs, 0, 'the native search is not cut short');

  await hooks.findShare({ blobHex, targetHex: 'ffffffff', startNonce: 1, maxAttempts: 1e12 });
  t.is(rn.requests[1].maxAttempts, 5000000, 'capped');
  await hooks.findShare({ blobHex, targetHex: 'ffffffff', startNonce: 1, maxAttempts: 'x' });
  t.is(rn.requests[2].maxAttempts, 1, 'at least one');

  t.is(await hooks.powHash(blobHex), 'ab'.repeat(32), 'lower case');
  t.is(rn.requests[3].type, 'cn-turtle-lite-slow-hash-v2');
  t.is(rn.requests[3].blobHex, blobHex);

  const none = setup({ 'pow-find-share': null, 'cn-turtle-lite-slow-hash-v2': null });
  t.is(await none.hooks.findShare({ blobHex, targetHex: 'ffffffff', startNonce: 1, maxAttempts: 840 }), null);
  t.is(await none.hooks.findShare({ targetHex: 'ffffffff' }), null, 'no blob: nothing asked');
  t.is(await none.hooks.powHash(blobHex), null);
  t.is(none.rn.requests.length, 2);
});

test('log: never throws, debug is quiet', (t) => {
  const { hooks } = setup({});
  hooks.log('debug', 'x');
  hooks.log('warn', 'y', { a: 1 });
  const circular = {};
  circular.self = circular;
  hooks.log('info', 'z', circular);
  t.pass();
});

test('start: one HuginP2P with the host hooks, native node preset, foreground-only feed gossip, native file options', (t) => {
  const { host } = setup({});
  const p2p = host.start();
  t.is(host.start(), p2p, 'once');
  t.is(p2p.opts.host, host.hooks);
  t.is(p2p.opts.gossip, GOSSIP);
  t.is(GOSSIP, 'foreground');
  t.is(p2p.opts.node.preset, 'native');
  t.is(p2p.opts.files.saveDownloads, true);
  t.is(p2p.opts.files.pruneMaxBytes, 500 * 1024 * 1024);
});

test('mediaOf: the file types React Native previews', (t) => {
  t.alike(mediaOf('a.PNG', 10), { image: true, type: 'image' });
  t.alike(mediaOf('a.mov', 10), { image: true, type: 'video' });
  t.alike(mediaOf('a.mp3', 10), { image: true, type: 'audio' });
  t.alike(mediaOf('a.pdf', 10), { image: false, type: undefined });
  t.alike(mediaOf('a.png', 60000000), { image: false, type: undefined }, 'too large to preview');
  t.alike(mediaOf(undefined, 1), { image: false, type: undefined });
});

// ---------------------------------------------------------------------------------------------
// bare/rpc.js Bridge

function duplexPair() {
  let a = null;
  let b = null;
  a = new Duplex({
    write(data, cb) {
      b.push(data);
      cb(null);
    },
  });
  b = new Duplex({
    write(data, cb) {
      a.push(data);
      cb(null);
    },
  });
  return [a, b];
}

function bridgePair(onRn) {
  const [workletEnd, rnEnd] = duplexPair();
  const bridge = new Bridge(workletEnd);
  const rn = new RPC(rnEnd, (req) => onRn(JSON.parse(b4a.toString(req.data)), req.command));
  const rnSend = (command, data) => rn.request(command).send(JSON.stringify(data));
  const close = () => {
    workletEnd.destroy();
    rnEnd.destroy();
  };
  return { bridge, rnSend, close };
}

test('Bridge: answers resolve requests; a request from React Native with the same id does not', async (t) => {
  const seen = [];
  const { bridge, rnSend, close } = bridgePair((data, command) => {
    seen.push({ data, command });
    if (data.type === 'room-message-exists') {
      // React Native's own request with a colliding id first, then the answer
      rnSend(REQUEST, { type: 'send_room_msg', id: data.id, message: 'hi' });
      rnSend(MESSAGE, { id: data.id, data: true });
    }
  });
  const events = [];
  bridge.on('data', (d) => events.push(d));

  const answer = await bridge.request({ type: 'room-message-exists', hash: HASH });
  t.is(answer, true);
  t.is(seen[0].command, REQUEST, 'requests go out as command 1');
  t.is(events.length, 1);
  t.is(events[0].type, 'send_room_msg', "React Native's request reached the router");

  bridge.send('typing', { datas: {} });
  await new Promise((resolve) => setTimeout(resolve, 20));
  t.is(seen.at(-1).command, MESSAGE, 'events go out as command 2');
  t.is(seen.at(-1).data.type, 'typing');
  close();
});

test('Bridge: a request with a timeout resolves undefined when no answer comes', async (t) => {
  const { bridge, close } = bridgePair(() => {});
  const start = Date.now();
  t.is(await bridge.request({ type: 'get-room-history', key: INVITE }, { timeoutMs: 50 }), undefined);
  t.ok(Date.now() - start >= 45);
  t.is(bridge.pendingRequests.size, 0, 'forgotten');
  close();
});

test('Hugin.request passes the timeout to the bridge; nothing is sent before init', async (t) => {
  const rn = fakeRn({ 'get-feed-history': [] });
  const hugin = account(rn);
  await hugin.request({ type: 'get-feed-history' }, 1234);
  t.is(rn.requests[0].timeoutMs, 1234);

  const { Account } = require('../account.js');
  const fresh = new Account();
  t.is(await fresh.request({ type: 'x' }), undefined);
  fresh.send('typing', {});
  t.pass('no bridge yet: nothing sent, nothing thrown');
});

test('Hugin.init: files default to an empty list', (t) => {
  const hugin = account(fakeRn(), { files: undefined });
  t.alike(hugin.files, []);
  t.is(hugin.address, ADDRESS);
});
