// The event map of bare/host.js: every hugin-network event is mapped to the bare-rpc events React
// Native listens to, or explicitly ignored, and each mapping produces the
// names and payload shapes src/lib/rpc.js reads.

const test = require('brittle');
const { events, HuginP2P } = require('hugin-network');
const { Host, EVENT_MAP, EVENT_NAMES, IGNORED, NODE_POW_REQUIRED } = require('../host.js');
const {
  fakeRn,
  account,
  FakeP2P,
  ADDRESS,
  CONTACT,
  INVITE,
  DERIVATION,
  TOPIC,
  DM_TOPIC,
  SIG,
  HASH,
  DRIVE_KEY,
  PAST,
} = require('./helpers.js');

function setup(user) {
  const rn = fakeRn();
  const hugin = account(rn, user);
  const host = new Host({ hugin, P2P: FakeP2P });
  const p2p = host.start();
  host._map(CONTACT, DERIVATION);
  return { rn, hugin, host, p2p };
}

test('every hugin-network event is mapped or explicitly ignored', (t) => {
  const known = new Set([...events.ALL, NODE_POW_REQUIRED]);
  for (const name of known) {
    t.ok(Object.prototype.hasOwnProperty.call(EVENT_MAP, name), name + ' has a decision');
    const v = EVENT_MAP[name];
    t.ok(typeof v === 'function' || v === IGNORED, name + ' is a mapping or IGNORED');
  }
  for (const name of Object.keys(EVENT_MAP)) t.ok(known.has(name), name + ' is a hugin-network event');
  t.alike([...EVENT_NAMES].sort(), [...known].sort(), 'the host subscribes to all of them');

  const ignored = Object.keys(EVENT_MAP).filter((n) => EVENT_MAP[n] === IGNORED).sort();
  t.alike(ignored, ['file:error', 'file:removed', 'file:uploaded', 'node:error', 'node:job', 'node:pow-required', 'node:reset']);
});

test('the host listens to every event on the HuginP2P it creates', (t) => {
  const { p2p } = setup();
  for (const name of EVENT_NAMES) t.is(p2p.listenerCount(name), 1, name);
});

// [library event, payload, expected [type, data] list sent to React Native]
const room = { key: INVITE, topic: TOPIC, dm: false };
const dm = { key: CONTACT, topic: DM_TOPIC, dm: true };
const message = {
  message: '<b>as signed</b>',
  address: CONTACT,
  signature: SIG,
  room: INVITE,
  timestamp: PAST,
  name: 'Ann',
  reply: '',
  hash: HASH,
  tip: false,
};
const peer = {
  address: CONTACT,
  name: '<i>Ann</i>',
  avatar: '',
  voice: false,
  video: false,
  audioMute: false,
  videoMute: false,
  screenshare: false,
  admin: true,
  time: PAST,
};
const remoteFile = {
  fileName: 'a.png',
  address: CONTACT,
  size: 10,
  topic: TOPIC,
  key: INVITE,
  chat: CONTACT,
  hash: HASH,
  name: 'Ann',
  time: PAST,
  signature: SIG,
  driveKey: DRIVE_KEY,
};
const download = { hash: HASH, fileName: 'a.png', chat: CONTACT, address: CONTACT, name: 'Ann', time: PAST, size: 10, topic: TOPIC, key: INVITE, dm: false, driveKey: DRIVE_KEY, auto: true };

const CASES = [
  [
    'room:joined (room)',
    'room:joined',
    { ...room, admin: true },
    [
      ['peer-connected', { joined: { name: 'Native', address: ADDRESS, key: INVITE, avatar: '' } }],
      ['new-swarm', { connected: true, key: INVITE, admin: true, chat: false, beam: false }],
    ],
  ],
  [
    'room:joined (DM): keyed by the derivation hash React Native sent',
    'room:joined',
    { ...dm, admin: false, address: CONTACT },
    [
      ['peer-connected', { joined: { name: 'Native', address: ADDRESS, key: DERIVATION, avatar: '' } }],
      ['new-swarm', { connected: true, key: DERIVATION, admin: false, chat: CONTACT, beam: true }],
    ],
  ],
  ['room:left', 'room:left', room, [['end-swarm', { topic: TOPIC }]]],
  [
    'peer:joined (room): name normalised for display',
    'peer:joined',
    { ...room, peer },
    [['peer-connected', { joined: { ...peer, name: 'Ann', key: INVITE, topic: TOPIC }, beam: false }]],
  ],
  [
    'peer:joined (DM)',
    'peer:joined',
    { ...dm, peer: { ...peer, admin: false } },
    [['peer-connected', { joined: { ...peer, admin: false, name: 'Ann', key: DERIVATION, topic: DM_TOPIC }, beam: true }]],
  ],
  ['peer:left', 'peer:left', { ...dm, address: CONTACT }, [['peer-disconnected', { address: CONTACT, key: DERIVATION }]]],
  [
    'room:message (live): every field as signed, signature included',
    'room:message',
    { ...room, message, history: false, live: true },
    [['swarm-message', { message: { ...message, sent: false, channel: 'channel', history: false, background: false }, topic: TOPIC }]],
  ],
  [
    'room:message (history)',
    'room:message',
    { ...room, message, history: true, live: false },
    [['swarm-message', { message: { ...message, sent: false, channel: 'channel', history: true, background: false } }]],
  ],
  ['room:history', 'room:history', { ...room, count: 3, missing: [] }, [['history-update', { key: INVITE, i: 3, background: false }]]],
  ['dm:wire', 'dm:wire', { address: CONTACT, topic: DM_TOPIC, wire: 'abcd' }, [['beam-message', { message: 'abcd', address: CONTACT, background: false }]]],
  [
    'typing (room)',
    'typing',
    { ...room, address: CONTACT, typing: true },
    [['typing', { datas: { typing: true, key: INVITE, address: CONTACT } }]],
  ],
  [
    'typing (DM): keyed by the contact',
    'typing',
    { ...dm, address: CONTACT, typing: false },
    [['typing', { datas: { typing: false, key: CONTACT, address: CONTACT } }]],
  ],
  [
    'ban:self',
    'ban:self',
    { key: INVITE, topic: TOPIC },
    [
      ['banned', { key: INVITE }],
      ['remove-room', { key: INVITE }],
    ],
  ],
  ['ban:peer', 'ban:peer', { key: INVITE, topic: TOPIC, address: CONTACT, admin: true }, [['ban-user', { address: CONTACT, topic: TOPIC }]]],
  [
    'feed:message: as signed',
    'feed:message',
    { message: { message: 'x', nickname: 'N', address: CONTACT, signature: SIG, reply: '', hash: HASH, timestamp: PAST, tip: false }, live: true },
    [['feed-message', { data: { message: 'x', nickname: 'N', address: CONTACT, signature: SIG, reply: '', hash: HASH, timestamp: PAST, tip: false }, history: false }]],
  ],
  [
    'feed:message: from history',
    'feed:message',
    { message: { message: 'x', nickname: 'N', address: CONTACT, signature: SIG, reply: '', hash: HASH, timestamp: PAST, tip: false }, live: false },
    [['feed-message', { data: { message: 'x', nickname: 'N', address: CONTACT, signature: SIG, reply: '', hash: HASH, timestamp: PAST, tip: false }, history: true }]],
  ],
  [
    'voice:status: no avatar, room key added',
    'voice:status',
    { key: INVITE, topic: TOPIC, address: CONTACT, name: 'Ann', avatar: 'aGk=', message: TOPIC, voice: true, video: false, audioMute: false, videoMute: false, screenshare: false },
    [
      [
        'voice-channel-status',
        { data: { topic: TOPIC, address: CONTACT, name: 'Ann', message: TOPIC, voice: true, video: false, audioMute: false, videoMute: false, screenshare: false, room: INVITE } },
      ],
    ],
  ],
  [
    'voice:call',
    'voice:call',
    { key: INVITE, topic: TOPIC, address: CONTACT, name: 'Ann', video: false, audioMute: false, videoMute: false, screenshare: false },
    [['join-voice-channel', { key: INVITE, topic: TOPIC, address: CONTACT }]],
  ],
  ['voice:offer', 'voice:offer', { key: INVITE, topic: TOPIC, address: CONTACT, data: { data: 'sdp', offer: true } }, [['answer-call', { data: { data: 'sdp', offer: true } }]]],
  ['voice:answer', 'voice:answer', { key: INVITE, topic: TOPIC, address: CONTACT, data: { data: 'sdp', offer: false } }, [['got-answer', { data: { data: 'sdp', offer: false } }]]],
  [
    'voice:retry',
    'voice:retry',
    { key: INVITE, topic: TOPIC, address: CONTACT, data: { data: 'sdp', offer: true, retry: true } },
    [['got-expanded-voice-channel', { data: { data: 'sdp', offer: true, retry: true } }]],
  ],
  [
    'file:remote (room): the remote file, then a chat message for its download button',
    'file:remote',
    { ...room, file: remoteFile },
    [
      ['room-remote-file-added', { chat: INVITE, remoteFiles: [remoteFile] }],
      [
        'swarm-message',
        {
          message: {
            message: 'a.png',
            address: CONTACT,
            name: 'Ann',
            timestamp: PAST,
            room: INVITE,
            hash: HASH,
            reply: '',
            sent: false,
            file: { fileName: 'a.png', hash: HASH, timestamp: PAST, sent: false, path: '', image: false, topic: TOPIC, type: 'file' },
          },
        },
      ],
    ],
  ],
  [
    'file:remote (DM)',
    'file:remote',
    { ...dm, file: { ...remoteFile, key: CONTACT, topic: DM_TOPIC } },
    [['remote-dm-file-added', { chat: CONTACT, remoteFiles: [{ ...remoteFile, key: CONTACT, topic: DM_TOPIC }] }]],
  ],
  ['file:downloading', 'file:downloading', download, [['downloading', { fileName: 'a.png', chat: CONTACT, time: PAST, size: 10, hash: HASH }]]],
  [
    'file:progress',
    'file:progress',
    { ...download, progress: 40 },
    [['download-file-progress', { fileName: 'a.png', chat: CONTACT, time: PAST, progress: 40, hash: HASH }]],
  ],
  [
    'file:downloaded (room): the saved name and path',
    'file:downloaded',
    { ...download, path: '/tmp/downloads/a (1).png' },
    [
      [
        'file-downloaded',
        { fileName: 'a (1).png', hash: HASH, address: CONTACT, name: 'Ann', time: PAST, size: 10, topic: TOPIC, filePath: '/tmp/downloads/a (1).png', roomKey: INVITE, dm: false },
      ],
    ],
  ],
  [
    'file:downloaded (DM): also the chat message (dm-file)',
    'file:downloaded',
    { ...download, key: CONTACT, topic: DM_TOPIC, dm: true, path: '/tmp/downloads/a.png' },
    [
      [
        'file-downloaded',
        { fileName: 'a.png', hash: HASH, address: CONTACT, name: 'Ann', time: PAST, size: 10, topic: DM_TOPIC, filePath: '/tmp/downloads/a.png', roomKey: DERIVATION, dm: true },
      ],
      [
        'dm-file',
        {
          message: {
            message: 'a.png',
            address: CONTACT,
            name: 'Ann',
            hash: HASH,
            timestamp: PAST,
            room: DERIVATION,
            reply: '',
            sent: false,
            history: false,
            file: { fileName: 'a.png', address: CONTACT, hash: HASH, timestamp: PAST, image: true, path: '/tmp/downloads/a.png', topic: DM_TOPIC, type: 'image' },
            tip: false,
          },
        },
      ],
    ],
  ],
  ['node:connected', 'node:connected', { remotePublicKey: DRIVE_KEY, backup: false, publicNode: true }, [['hugin-node-connected', {}]]],
  ['node:disconnected', 'node:disconnected', { reason: 'close', remotePublicKey: DRIVE_KEY }, [['hugin-node-disconnected', {}]]],
  ['node:address', 'node:address', { address: ADDRESS, version: '2' }, [['node-address', { address: ADDRESS }]]],
  [
    'node:messages (pushed)',
    'node:messages',
    { messages: [{ hash: HASH, cipher: 'ab', timestamp: PAST }], source: 'push' },
    [['pool-messages', { messages: [{ hash: HASH, cipher: 'ab', timestamp: PAST }], background: false }]],
  ],
  ['node:messages (sync answer: returned to sync_from_node)', 'node:messages', { messages: [], source: 'sync', since: 0 }, []],
  ['error', 'error', { message: 'node error', source: 'node' }, [['error-message', { message: 'node error' }]]],
  ['file:uploaded', 'file:uploaded', { hash: HASH }, []],
  ['file:removed', 'file:removed', { hashes: [HASH] }, []],
  ['file:error', 'file:error', { error: 'timeout', message: 'x' }, []],
  ['node:job', 'node:job', { job: {} }, []],
  ['node:reset', 'node:reset', { reason: 'fallback' }, []],
  ['node:error', 'node:error', { message: 'x' }, []],
  ['node:pow-required', 'node:pow-required', { kind: 'post' }, []],
];

for (const [title, name, payload, expected] of CASES) {
  test('event ' + title, (t) => {
    const { rn, p2p } = setup();
    rn.clear();
    p2p.emit(name, JSON.parse(JSON.stringify(payload)));
    t.alike(
      rn.events.map((e) => [e.type, e.data]),
      expected,
    );
  });
}

test('every mapped event is covered by a case', (t) => {
  const covered = new Set(CASES.map((c) => c[1]));
  for (const name of EVENT_NAMES) t.ok(covered.has(name), name);
});

test('event payloads carry `background` from idle_status', (t) => {
  const { rn, p2p, hugin } = setup();
  hugin.sleep(true, true);
  rn.clear();
  p2p.emit('dm:wire', { address: CONTACT, topic: DM_TOPIC, wire: 'ab' });
  t.alike(rn.events[0].data, { message: 'ab', address: CONTACT, background: true });
});

test('a downloaded file is remembered as known', (t) => {
  const { p2p, host } = setup();
  p2p.emit('file:downloaded', { ...download, path: '/tmp/downloads/a.png' });
  t.ok(host.hooks.knownFile(HASH));
});

test('a mapping that throws is contained', (t) => {
  const { host, hugin, p2p, rn } = setup();
  hugin.ban = () => {
    throw new Error('store failed');
  };
  p2p.emit('ban:peer', { key: INVITE, topic: TOPIC, address: CONTACT, admin: true });
  host.handleEvent('voice:status', null);
  host.handleEvent('not-an-event', {});
  rn.clear();
  p2p.emit('peer:left', { ...room, address: CONTACT });
  t.alike(rn.sent('peer-disconnected'), [{ address: CONTACT, key: INVITE }], 'later events still go out');
});

test('with the real HuginP2P: feed gossip only while in the foreground', async (t) => {
  const rn = fakeRn();
  const hugin = account(rn, { store: '' }); // no store: no file storage, nothing on disk
  const host = new Host({ hugin, p2pOptions: { rooms: { idleSuspendMs: 60000 } } });
  const p2p = host.start();
  t.ok(p2p instanceof HuginP2P);
  t.is(p2p.files, null);
  t.is(p2p.node.preset, 'native');
  for (const name of EVENT_NAMES) t.ok(p2p.listenerCount(name) >= 1, 'listens to ' + name);

  t.ok(p2p.foreground);
  t.ok(p2p.feed._gossipOn(), 'gossip in the foreground');
  await host.idle({ mode: true, background: true, force: false });
  t.absent(p2p.foreground);
  t.absent(p2p.feed._gossipOn(), 'no gossip in the background');
  await host.idle({ mode: false, background: false, force: false });
  t.ok(p2p.feed._gossipOn(), 'gossip again in the foreground');

  // a library event reaches React Native through the map
  rn.clear();
  p2p.emit('typing', { key: INVITE, topic: TOPIC, address: CONTACT, typing: true, dm: false });
  t.alike(rn.events, [{ type: 'typing', data: { datas: { typing: true, key: INVITE, address: CONTACT } } }]);
  await p2p.destroy();
});
