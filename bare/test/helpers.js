// Stand-ins for the worklet's tests: React Native's side of the bridge (a recorder that answers
// `Hugin.request` from a table) and a HuginP2P stand-in that records calls and emits events the
// way hugin-network does (room:joined before join resolves, ...).

const EventEmitter = require('bare-events');
const { Account } = require('../account.js');

const ADDRESS = 'SEKReYU57DLLvUjNzmjVhaK7jqc8SdZZ3cyKJS5f4gWXK4NQQYChzKUUwzCGhgqUPkWQypeR94rqpgMPjXWG9ijnZKNw2LWXnZU';
const CONTACT = 'SEKRe' + 'c'.repeat(94);
const INVITE = 'a0'.repeat(32) + 'b1'.repeat(32);
const SEED = '5e'.repeat(32);
const DERIVATION = 'd7'.repeat(32);
const TOPIC = 'e5'.repeat(32);
const DM_TOPIC = 'f6'.repeat(32);
const SIG = 'ab'.repeat(64);
const HASH = 'c3'.repeat(32);
const DRIVE_KEY = '7a'.repeat(32);
const PAST = 1731500000000;

/**
 * React Native's end: `requests` records every `Hugin.request` (with the timeout it was given),
 * `events` every `Hugin.send`. `answers[type]` is a value or `(data) => value`.
 */
function fakeRn(answers = {}) {
  const rn = {
    requests: [],
    events: [],
    answers,
    request(data, opts = {}) {
      rn.requests.push({ ...data, timeoutMs: opts.timeoutMs });
      const a = rn.answers[data.type];
      return Promise.resolve(typeof a === 'function' ? a(data) : a);
    },
    send(type, data) {
      rn.events.push({ type, data: JSON.parse(JSON.stringify(data)) });
    },
    sent(type) {
      return rn.events.filter((e) => e.type === type).map((e) => e.data);
    },
    clear() {
      rn.requests.length = 0;
      rn.events.length = 0;
    },
  };
  return rn;
}

function account(rn, user = {}) {
  const hugin = new Account();
  hugin.init(
    {
      name: 'Native',
      address: ADDRESS,
      avatar: '',
      downloadDir: '/tmp/downloads',
      keys: {},
      store: '/tmp/store',
      files: [],
      ...user,
    },
    rn,
  );
  return hugin;
}

class FakeRooms {
  constructor(p2p) {
    this.p2p = p2p;
    this.map = new Map(); // key -> room
    this.suspended = false;
  }

  _call(name, ...args) {
    this.p2p.calls.push(['rooms.' + name, ...args]);
  }

  async join({ invite, adminSeed }) {
    this._call('join', { invite, adminSeed });
    if (this.p2p.fail.join) throw this.p2p.fail.join;
    const room = { key: invite, topic: TOPIC, dm: false, admin: typeof adminSeed === 'string' };
    this.map.set(invite, room);
    this.p2p.emit('room:joined', { key: room.key, topic: room.topic, dm: false, admin: room.admin });
    return { key: room.key, topic: room.topic, dm: false, admin: room.admin };
  }

  async joinDm({ address, derivationHash }) {
    this._call('joinDm', { address, derivationHash });
    const contact = address.slice(0, 99);
    const room = { key: contact, topic: DM_TOPIC, dm: true, admin: false, contact };
    this.map.set(contact, room);
    this.p2p.emit('room:joined', { key: contact, topic: DM_TOPIC, dm: true, admin: false, address: contact });
    return { key: contact, topic: DM_TOPIC, dm: true, admin: false, address: contact };
  }

  async leave(key) {
    this._call('leave', key);
    const room = this.get(key);
    if (!room) return false;
    this.map.delete(room.key);
    this.p2p.emit('room:left', { key: room.key, topic: room.topic, dm: room.dm });
    return true;
  }

  get(key) {
    for (const room of this.map.values()) if (room.key === key || room.topic === key) return room;
    return null;
  }

  async send(key, fields) {
    this._call('send', key, fields);
    if (this.p2p.fail.send) throw this.p2p.fail.send;
    return { ...fields, hash: HASH, room: key, address: ADDRESS, name: 'Native', signature: SIG, timestamp: PAST };
  }

  sendDm(address, wire) {
    this._call('sendDm', address, wire);
    const room = this.map.get(address);
    return room && room.dm ? 1 : 0; // the contact's peers written to (one per joined DM here)
  }

  typing(key, typing) {
    this._call('typing', key, typing);
    return 1;
  }

  async shareFile(key, source, meta) {
    this._call('shareFile', key, source, meta);
    if (this.p2p.fail.share) throw this.p2p.fail.share;
    return {
      announcement: {
        fileName: meta.fileName,
        address: ADDRESS,
        name: 'Native',
        topic: this.get(key) ? this.get(key).topic : TOPIC,
        size: 1234,
        time: meta.time,
        hash: HASH,
        signature: SIG,
        info: 'file-shared',
        type: 'file',
      },
      sent: 1,
    };
  }

  async suspend() {
    this._call('suspend');
    this.suspended = true;
  }

  async resume() {
    this._call('resume');
    this.suspended = false;
  }
}

/** Records what the host asks of hugin-network; `opts` is what the host constructed it with. */
class FakeP2P extends EventEmitter {
  constructor(opts) {
    super();
    this.opts = opts;
    this.calls = [];
    this.fail = {};
    this.rooms = new FakeRooms(this);
    const call = (name) => (...args) => {
      this.calls.push([name, ...args]);
      const r = this.results[name];
      if (r instanceof Error) return Promise.reject(r);
      return Promise.resolve(typeof r === 'function' ? r(...args) : r);
    };
    this.results = {
      'feed.send': (f) => ({ type: 'feed', ...f, nickname: 'Native', address: ADDRESS, hash: HASH, timestamp: PAST, signature: SIG }),
      'voice.setStatus': true,
      'files.download': { success: true, hash: HASH, path: '/tmp/downloads/a.png' },
      'files.saveToDownloads': { success: true, filePath: '/tmp/downloads/a.png' },
      'node.connect': undefined,
      'node.sync': [{ hash: HASH, cipher: 'ab', timestamp: PAST }],
      'node.post': { success: true, id: PAST },
      'node.register': { success: true, id: PAST },
      idle: undefined,
    };
    this.feed = { send: call('feed.send') };
    this.voice = {
      setStatus: call('voice.setStatus'),
      sendSdp: (o) => {
        this.calls.push(['voice.sendSdp', o]);
        return true;
      },
    };
    this.files = opts && opts.files === false ? null : { download: call('files.download'), saveToDownloads: call('files.saveToDownloads') };
    this.node = { connect: call('node.connect'), sync: call('node.sync'), post: call('node.post'), register: call('node.register') };
    this.idle = call('idle');
  }

  called(name) {
    return this.calls.filter((c) => c[0] === name).map((c) => c.slice(1));
  }
}

module.exports = {
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
};
