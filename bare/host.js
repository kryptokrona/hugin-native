'use strict';

// The worklet's host for hugin-network (hugin-network README, "Host hooks and events"): one HuginP2P instance for rooms, DMs, the
// feed, files, room calls and the hugin-node connection. React Native keeps the wallet (it
// signs and verifies XKR messages), the database (room and feed messages) and the UI; this file
// reaches them through `Hugin.request` (bare-rpc requests answered by src/lib/rpc.js) and turns
// the library's events into the bare-rpc events React Native has always listened to (EVENT_MAP
// below).
//
// Keys: React Native names a room by its invite and a DM by the key derivation hash it sent
// with `new_swarm`; hugin-network names a DM by the contact's address. `rnKey` / `libKey` translate.
//
// Text: room and feed messages are passed on exactly as they were signed (React Native stores
// every field, `signature` included, and serves the rows back as history, where peers verify
// them again). Our own text is normalised with `sanitizeText` before it is signed, as
// hugin-desktop does, so what is signed, sent, stored and shown is the same text. Names that are
// only shown (peers, voice status) are normalised on the way to React Native.

const p2pLib = require('hugin-network');

const { HuginP2P, events: E, sanitize, wire, constants } = p2pLib;

/** Feed gossip runs only while the app is in the foreground (owner decision). */
const GOSSIP = 'foreground';
/** hugin-node event that lib/events.js does not list (lib/hugin-p2p.js NODE_POW_REQUIRED). */
const NODE_POW_REQUIRED = 'node:pow-required';

/** Requests to React Native that wait for the wallet (sign / verify). */
const WALLET_TIMEOUT_MS = 60000;
/** Database lookups. */
const QUERY_TIMEOUT_MS = 30000;

/** Most attempts in one native PoW slice (kryptokrona-crypto `findPowShare`'s limit). */
const MAX_NATIVE_POW_ATTEMPTS = 5000000;

/** Native drive layout: `<store>/corestorage/<topic>/files` (as before), fetched files also saved to downloads. */
const STORAGE_DIR = '/corestorage';
const PRUNE_MAX_BYTES = 500 * 1024 * 1024;

const MEDIA_TYPES = [
  ['.png', 'image'],
  ['.jpg', 'image'],
  ['.gif', 'image'],
  ['.jfif', 'image'],
  ['.jpeg', 'image'],
  ['.webp', 'image'],
  ['.mp4', 'video'],
  ['.webm', 'video'],
  ['.avi', 'video'],
  ['.mov', 'video'],
  ['.wmv', 'video'],
  ['.mkv', 'video'],
  ['.mpeg', 'video'],
  ['.m4a', 'audio'],
  ['.mp3', 'audio'],
  ['.wav', 'audio'],
];
const MAX_MEDIA_BYTES = 50000000;

function clean(text) {
  return typeof text === 'string' ? sanitize.sanitizeText(text) : '';
}

/** `{ image, type }` of a file name: image is true for the media types React Native previews. */
function mediaOf(fileName, size) {
  if (typeof fileName !== 'string' || (typeof size === 'number' && size >= MAX_MEDIA_BYTES)) {
    return { image: false, type: undefined };
  }
  const lower = fileName.toLowerCase();
  for (const [ext, type] of MEDIA_TYPES) {
    if (lower.endsWith(ext)) return { image: true, type };
  }
  return { image: false, type: undefined };
}

function baseName(path) {
  if (typeof path !== 'string' || path.length === 0 || path === 'storage') return null;
  return path.split('/').pop() || null;
}

function errMessage(err) {
  return (err && err.message) || String(err);
}

// ---------------------------------------------------------------------------------------------
// event map: library event -> what React Native gets
//
// | library event        | bare-rpc event(s) to React Native                                     |
// |----------------------|-----------------------------------------------------------------------|
// | room:joined          | peer-connected { joined: self }, new-swarm { connected, key, admin, chat, beam } |
// | room:left            | end-swarm { topic }                                                   |
// | peer:joined          | peer-connected { joined: { ...peer, key, topic }, beam }              |
// | peer:left            | peer-disconnected { address, key }                                    |
// | room:message         | swarm-message { message: { ...message, sent, channel, history, background }[, topic] } |
// | room:history         | history-update { key, i, background }                                 |
// | dm:wire              | beam-message { message, address, background }                         |
// | typing               | typing { datas: { typing, key, address } }                            |
// | ban:self             | banned { key }, remove-room { key }                                   |
// | ban:peer             | ban-user { address, topic } (Hugin.ban)                               |
// | feed:message         | feed-message { data, history }                                        |
// | voice:status         | voice-channel-status { data: { ...status, room } } (no avatar)        |
// | voice:call           | join-voice-channel { key, topic, address }                            |
// | voice:offer          | answer-call { data }                                                  |
// | voice:answer         | got-answer { data }                                                   |
// | voice:retry          | got-expanded-voice-channel { data }                                   |
// | file:remote          | remote-dm-file-added / room-remote-file-added { chat, remoteFiles } (+ swarm-message for a room) |
// | file:downloading     | downloading { fileName, chat, time, size, hash }                      |
// | file:progress        | download-file-progress { fileName, chat, time, progress, hash }       |
// | file:downloaded      | file-downloaded { ..., filePath, roomKey, dm } (+ dm-file for a DM)    |
// | node:connected       | hugin-node-connected {}                                               |
// | node:disconnected    | hugin-node-disconnected {}                                            |
// | node:address         | node-address { address }                                              |
// | node:messages        | pool-messages { messages, background } (pushed; sync answers go back to sync_from_node) |
// | error                | error-message { message }                                             |
// | file:uploaded, file:removed, file:error, node:job, node:reset, node:error, node:pow-required | ignored (logged) |

/** Events React Native has no use for; listed so that every library event has a decision. */
const IGNORED = null;

const EVENT_MAP = Object.freeze({
  [E.ROOM_JOINED]: (h, e) => h._roomJoined(e),
  [E.ROOM_LEFT]: (h, e) => h.send('end-swarm', { topic: e.topic }),
  [E.PEER_JOINED]: (h, e) => h._peerJoined(e),
  [E.PEER_LEFT]: (h, e) => h.send('peer-disconnected', { address: e.address, key: h.rnKey(e.key) }),
  [E.ROOM_MESSAGE]: (h, e) => h._roomMessage(e),
  [E.ROOM_HISTORY]: (h, e) =>
    h.send('history-update', { key: h.rnKey(e.key), i: e.count, background: h.background }),
  [E.DM_WIRE]: (h, e) => h.send('beam-message', { message: e.wire, address: e.address, background: h.background }),
  [E.TYPING]: (h, e) =>
    h.send('typing', {
      datas: { typing: e.typing, key: e.dm ? e.address : h.rnKey(e.key), address: e.address },
    }),
  [E.BAN_SELF]: (h, e) => {
    const key = h.rnKey(e.key);
    h.send('banned', { key });
    h.send('remove-room', { key });
  },
  [E.BAN_PEER]: (h, e) => h.hugin.ban(e.address, e.topic),
  [E.FEED_MESSAGE]: (h, e) => h.send('feed-message', { data: e.message, history: e.live === false }),
  [E.VOICE_STATUS]: (h, e) => h._voiceStatus(e),
  [E.VOICE_CALL]: (h, e) =>
    h.send('join-voice-channel', { key: h.rnKey(e.key), topic: e.topic, address: e.address }),
  [E.VOICE_OFFER]: (h, e) => h.send('answer-call', { data: e.data }),
  [E.VOICE_ANSWER]: (h, e) => h.send('got-answer', { data: e.data }),
  [E.VOICE_RETRY]: (h, e) => h.send('got-expanded-voice-channel', { data: e.data }),
  [E.FILE_REMOTE]: (h, e) => h._fileRemote(e),
  [E.FILE_DOWNLOADING]: (h, e) =>
    h.send('downloading', { fileName: e.fileName, chat: e.chat, time: e.time, size: e.size, hash: e.hash }),
  [E.FILE_PROGRESS]: (h, e) =>
    h.send('download-file-progress', {
      fileName: e.fileName,
      chat: e.chat,
      time: e.time,
      progress: e.progress,
      hash: e.hash,
    }),
  [E.FILE_DOWNLOADED]: (h, e) => h._fileDownloaded(e),
  [E.FILE_UPLOADED]: IGNORED, // the share handlers tell React Native themselves
  [E.FILE_REMOVED]: IGNORED,
  [E.FILE_ERROR]: IGNORED,
  [E.NODE_CONNECTED]: (h) => h.send('hugin-node-connected', {}),
  [E.NODE_DISCONNECTED]: (h) => h.send('hugin-node-disconnected', {}),
  [E.NODE_ADDRESS]: (h, e) => h.send('node-address', { address: e.address }),
  [E.NODE_MESSAGES]: (h, e) => {
    if (e.source === 'push') h.send('pool-messages', { messages: e.messages, background: h.background });
  },
  [E.NODE_JOB]: IGNORED,
  [E.NODE_RESET]: IGNORED,
  [E.NODE_ERROR]: IGNORED, // also arrives as `error`
  [NODE_POW_REQUIRED]: IGNORED,
  [E.ERROR]: (h, e) => h.send('error-message', { message: e && e.message }),
});

/** Every event the host subscribes to. */
const EVENT_NAMES = Object.freeze(Object.keys(EVENT_MAP));

// ---------------------------------------------------------------------------------------------

class Host {
  /**
   * @param {object} opts
   * @param {object} opts.hugin  bare/account.js state (identity, policy, `request`, `send`)
   * @param {Function} [opts.P2P]  the HuginP2P class (tests pass a stand-in)
   * @param {object} [opts.p2pOptions]  extra HuginP2P options (tests: bootstrap, timings)
   */
  constructor({ hugin, P2P = HuginP2P, p2pOptions = {} } = {}) {
    if (!hugin) throw new TypeError('Host: hugin is required');
    this.hugin = hugin;
    this.P2P = P2P;
    this.p2pOptions = p2pOptions;
    /** @type {import('hugin-network').HuginP2P | null} */
    this.p2p = null;
    this._rnKeys = new Map(); // library key -> React Native key
    this._libKeys = new Map(); // React Native key -> library key
    this.hooks = this._createHooks();
  }

  // -------------------------------------------------------------------------------------------
  // lifecycle

  /**
   * Creates the HuginP2P instance (once; `init_bare` calls it, after Hugin.init, so the store
   * and download paths are known).
   */
  start() {
    if (this.p2p) return this.p2p;
    const extra = this.p2pOptions || {};
    const opts = {
      ...extra,
      host: this.hooks,
      gossip: GOSSIP,
      node: { preset: 'native', ...(extra.node || {}) },
      files: extra.files === false ? false : { saveDownloads: true, pruneMaxBytes: PRUNE_MAX_BYTES, ...(extra.files || {}) },
    };
    const p2p = new this.P2P(opts);
    for (const name of EVENT_NAMES) p2p.on(name, (payload) => this.handleEvent(name, payload));
    this.p2p = p2p;
    if (this.hugin.sleeping && this.hugin.background) {
      p2p.idle({ background: true }).catch((err) => this._log('warn', 'idle failed', { message: errMessage(err) }));
    }
    return p2p;
  }

  get started() {
    return this.p2p !== null;
  }

  get background() {
    return this.hugin.background;
  }

  /**
   * `idle_status`: `force` suspends at once, `mode` with `background` marks the app idle (Ping
   * and feed gossip stop, connections are suspended after 10 s), no `mode` brings it back.
   */
  async idle({ mode, background, force } = {}) {
    const p2p = this.p2p;
    if (!p2p) return;
    if (force) return p2p.idle({ force: true });
    if (mode && background) return p2p.idle({ background: true });
    if (!mode) return p2p.idle({ background: false });
  }

  /** `close_connections`: every room connection is closed; the swarms find their peers again. */
  async closeConnections() {
    const p2p = this.p2p;
    if (!p2p || p2p.rooms.suspended) return;
    await p2p.rooms.suspend();
    await p2p.rooms.resume();
  }

  // -------------------------------------------------------------------------------------------
  // keys

  rnKey(libKey) {
    return this._rnKeys.get(libKey) || libKey;
  }

  libKey(rnKey) {
    return this._libKeys.get(rnKey) || rnKey;
  }

  _map(libKey, rnKey) {
    this._rnKeys.set(libKey, rnKey);
    this._libKeys.set(rnKey, libKey);
  }

  _unmap(libKey) {
    const rnKey = this._rnKeys.get(libKey);
    this._rnKeys.delete(libKey);
    if (rnKey !== undefined && this._libKeys.get(rnKey) === libKey) this._libKeys.delete(rnKey);
  }

  // -------------------------------------------------------------------------------------------
  // rooms and DMs

  /** `new_swarm` for a room: `key` is the invite, `admin` the admin seed when we created it. */
  async joinRoom({ key, admin } = {}) {
    const p2p = this.p2p;
    if (!p2p || typeof key !== 'string') return null;
    this._map(key, key);
    try {
      return await p2p.rooms.join({ invite: key, adminSeed: typeof admin === 'string' ? admin : undefined });
    } catch (err) {
      if (!p2p.rooms.get(key)) this._unmap(key);
      this._log('warn', 'room not joined', { message: errMessage(err) });
      return null;
    }
  }

  /** `new_swarm` for a DM: `key` is the key derivation hash, `chat` the contact's address. */
  async joinDm({ key, chat } = {}) {
    const p2p = this.p2p;
    if (!p2p || typeof key !== 'string' || typeof chat !== 'string') return null;
    const contact = chat.slice(0, constants.XKR_ADDRESS_LENGTH);
    this._map(contact, key);
    try {
      return await p2p.rooms.joinDm({ address: chat, derivationHash: key });
    } catch (err) {
      if (!p2p.rooms.get(contact)) this._unmap(contact);
      this._log('warn', 'DM swarm not joined', { message: errMessage(err) });
      return null;
    }
  }

  /** `end_swarm`. */
  async leave(rnKey) {
    const p2p = this.p2p;
    if (!p2p) return false;
    const libKey = this.libKey(rnKey);
    const left = await p2p.rooms.leave(libKey);
    if (!p2p.rooms.get(libKey)) this._unmap(libKey);
    return left;
  }

  /**
   * `send_room_msg`: signed and sent by hugin-network (the hash is derived from the message, the
   * one React Native passes is not used). Returns the message as sent, `signature` included;
   * `{ type: 'Error' }` when we are not in the room; the unsigned message (not sent) when it
   * could not be signed or built.
   */
  async sendRoomMessage({ key, message, reply, tip } = {}) {
    const p2p = this.p2p;
    const room = p2p ? p2p.rooms.get(this.libKey(key)) : null;
    if (!room || room.dm) return { type: 'Error' };
    const fields = {
      message: clean(message),
      reply: typeof reply === 'string' ? reply : '',
      tip: tip || false,
    };
    try {
      return { ...(await p2p.rooms.send(room.key, fields)) };
    } catch (err) {
      this._log('warn', 'room message not sent', { message: errMessage(err) });
      if (err && err.code === 'HUGIN_ROOMS_UNKNOWN') return { type: 'Error' };
      return this._unsentRoomMessage(room.key, fields);
    }
  }

  _unsentRoomMessage(room, { message, reply, tip }) {
    const id = this.hooks.identity();
    const m = {
      hash: '',
      room,
      address: id.address,
      message,
      name: id.name,
      reply,
      signature: '',
      timestamp: Date.now(),
      tip,
    };
    try {
      m.hash = wire.roomMessageHash(m);
    } catch {}
    return m;
  }

  /** `send_feed_msg`: like `sendRoomMessage`, over every room connection. */
  async sendFeedMessage({ message, reply, tip } = {}) {
    const p2p = this.p2p;
    const fields = {
      message: clean(message),
      reply: typeof reply === 'string' ? reply : '',
      tip: tip || false,
    };
    if (p2p) {
      try {
        return { ...(await p2p.feed.send(fields)) };
      } catch (err) {
        this._log('warn', 'feed message not sent', { message: errMessage(err) });
      }
    }
    const id = this.hooks.identity();
    return {
      type: 'feed',
      message: fields.message,
      nickname: id.name,
      address: id.address,
      reply: fields.reply,
      tip: fields.tip,
      hash: '',
      timestamp: Date.now(),
      signature: '',
    };
  }

  /** `beam_message` / `beam_dm`: a DM payload over the DM swarm; returns the peers written to. */
  sendDm(address, message) {
    const p2p = this.p2p;
    if (!p2p) return 0;
    return p2p.rooms.sendDm(address, message);
  }

  /** `typing`. */
  typing(key, typing) {
    const p2p = this.p2p;
    if (!p2p) return 0;
    return p2p.rooms.typing(this.libKey(key), typing === true);
  }

  // -------------------------------------------------------------------------------------------
  // files

  /**
   * `begin_send_file` (`file.key` is the room) and `send_dm_file` (`dm`, `conversation` = the
   * contact): stores the file in the room's drive, announces it, then shows it as our own
   * message (`swarm-message` / `dm-file`). Returns false when it could not be shared.
   */
  async shareFile(file, { dm = false, conversation = '' } = {}) {
    const p2p = this.p2p;
    if (!p2p || !p2p.files || !file || typeof file !== 'object') return false;
    if (dm && typeof conversation !== 'string') return false;
    const libKey = dm ? conversation.slice(0, constants.XKR_ADDRESS_LENGTH) : this.libKey(file.key);
    const time = typeof file.time === 'number' && Number.isFinite(file.time) ? file.time : Date.now();
    let announcement;
    try {
      ({ announcement } = await p2p.rooms.shareFile(libKey, file.path, { fileName: file.fileName, time }));
    } catch (err) {
      this._log('warn', 'file not shared', { message: errMessage(err) });
      return false;
    }
    this._rememberFile(announcement.hash);
    const { image, type } = mediaOf(announcement.fileName, announcement.size);
    const message = {
      address: announcement.address,
      name: announcement.name,
      message: announcement.fileName,
      hash: announcement.hash,
      timestamp: announcement.time,
      room: this.rnKey(libKey),
      reply: '',
      sent: true,
      history: false,
      file: {
        path: file.path,
        fileName: announcement.fileName,
        timestamp: announcement.time,
        hash: announcement.hash,
        sent: true,
        image,
        type,
      },
    };
    if (dm) {
      message.conversation = conversation;
      this.send('dm-file', { message });
    } else {
      this.send('swarm-message', { message });
    }
    return true;
  }

  /** `group_download`: fetches a file React Native got from `*-remote-file-added`. */
  async download(file) {
    const p2p = this.p2p;
    if (!p2p || !p2p.files || !file || typeof file !== 'object') return { success: false, error: 'room' };
    let topic = typeof file.topic === 'string' ? file.topic : null;
    if (!topic) {
      const room = p2p.rooms.get(this.libKey(file.key));
      topic = room ? room.topic : null;
    }
    if (!topic) return { success: false, error: 'room' };
    return p2p.files.download(topic, file);
  }

  /** `save_to_downloads`. */
  async saveToDownloads(hash, fileName, topic) {
    const p2p = this.p2p;
    if (!p2p || !p2p.files) return { success: false, error: 'Room not found' };
    const result = await p2p.files.saveToDownloads(hash, fileName, topic);
    if (result && result.success) {
      this.send('file-saved-to-downloads', { hash, filePath: result.filePath, fileName });
    }
    return result;
  }

  _rememberFile(hash) {
    if (typeof hash !== 'string') return;
    if (!Array.isArray(this.hugin.files)) this.hugin.files = [];
    if (!this._knownFile(hash)) this.hugin.files.push(hash);
  }

  _knownFile(hash) {
    const list = Array.isArray(this.hugin.files) ? this.hugin.files : [];
    return list.some((f) => f === hash || (f && typeof f === 'object' && f.hash === hash));
  }

  // -------------------------------------------------------------------------------------------
  // room calls

  /** `voice_status`: `status.key` is the room. */
  async setVoiceStatus(status, update) {
    const p2p = this.p2p;
    if (!p2p || !status || typeof status !== 'object') return false;
    return p2p.voice.setStatus(
      this.libKey(status.key),
      {
        voice: status.voice === true,
        video: status.video === true,
        audioMute: status.audioMute === true,
        videoMute: status.videoMute === true,
        screenshare: status.screenshare === true,
      },
      { update: update === true },
    );
  }

  /** `send_sdp`: `{ type, key, topic, address, data, retry }` from the UI. */
  sendSdp(data) {
    const p2p = this.p2p;
    if (!p2p || !data || typeof data !== 'object') return false;
    return p2p.voice.sendSdp({
      topic: data.topic,
      key: typeof data.key === 'string' ? this.libKey(data.key) : undefined,
      address: data.address,
      data: data.data,
      type: data.type,
      retry: data.retry,
    });
  }

  // -------------------------------------------------------------------------------------------
  // hugin-node

  /** `connect_to_node`: the public node topic (`pub`) or a private node invite. */
  async connectNode(address, pub) {
    const p2p = this.p2p;
    if (!p2p) return false;
    if (!pub && (typeof address !== 'string' || address.length === 0)) {
      this._log('warn', 'no node address given');
      return false;
    }
    await p2p.node.connect(pub ? { publicNode: true } : { address });
    return true;
  }

  /** `sync_from_node`: store-and-forward messages since `request.timestamp`. */
  async syncNode(request) {
    const p2p = this.p2p;
    if (!p2p) return [];
    const since = request && Number.isFinite(Number(request.timestamp)) ? Number(request.timestamp) : 0;
    return p2p.node.sync({ since });
  }

  /** `send_node_msg` / `room_push_send`: a post paid with PoW; `{ success, reason? }`. */
  async post({ cipher, hash, viewtag, kind = 'dm' } = {}) {
    const p2p = this.p2p;
    if (!p2p) return { success: false, reason: 'No connection to node' };
    try {
      return await p2p.node.post({ cipher, hash, viewtag, kind });
    } catch (err) {
      this._log('warn', 'node post refused', { message: errMessage(err) });
      return { success: false, reason: err && err.name === 'PacketError' ? 'invalid_packet' : 'message_exception' };
    }
  }

  /** `push_registration` / `push_register_all`. */
  async register(data) {
    const p2p = this.p2p;
    if (!p2p) return { success: false, reason: 'No connection to node' };
    try {
      return await p2p.node.register(data);
    } catch (err) {
      this._log('warn', 'push registration refused', { message: errMessage(err) });
      return { success: false, reason: 'register_exception' };
    }
  }

  // -------------------------------------------------------------------------------------------
  // events

  /** Maps one library event to React Native (EVENT_MAP). Never throws. */
  handleEvent(name, payload) {
    const fn = EVENT_MAP[name];
    if (!fn) {
      if (name === E.FILE_ERROR || name === E.NODE_ERROR) {
        this._log('info', name, { message: payload && payload.message, error: payload && payload.error });
      }
      return;
    }
    try {
      fn(this, payload || {});
    } catch (err) {
      this._log('warn', 'event not passed on', { event: name, message: errMessage(err) });
    }
  }

  /** `Hugin.send`; nothing goes out before init_bare gave us the bridge. */
  send(type, data) {
    try {
      this.hugin.send(type, data);
    } catch (err) {
      this._log('warn', 'event not sent', { type, message: errMessage(err) });
    }
  }

  _roomJoined(e) {
    const key = this.rnKey(e.key);
    const id = this.hooks.identity();
    this.send('peer-connected', { joined: { name: id.name, address: id.address, key, avatar: id.avatar } });
    this.send('new-swarm', { connected: true, key, admin: e.admin === true, chat: e.dm ? e.address : false, beam: e.dm === true });
  }

  _peerJoined(e) {
    const peer = e.peer || {};
    this.send('peer-connected', {
      joined: { ...peer, name: clean(peer.name), key: this.rnKey(e.key), topic: e.topic },
      beam: e.dm === true,
    });
  }

  _roomMessage(e) {
    const message = {
      ...e.message,
      sent: false,
      channel: 'channel',
      history: e.history === true,
      background: this.background,
    };
    if (e.history) this.send('swarm-message', { message });
    else this.send('swarm-message', { message, topic: e.topic });
  }

  _voiceStatus(e) {
    const { avatar, key, ...data } = e;
    data.name = clean(data.name);
    data.room = this.rnKey(key);
    this.send('voice-channel-status', { data });
  }

  _fileRemote(e) {
    const file = { ...(e.file || {}) };
    if (e.dm) {
      this.send('remote-dm-file-added', { chat: file.address, remoteFiles: [file] });
      return;
    }
    const key = this.rnKey(e.key);
    // first the remote file, so that the chat message below finds it and shows a download button
    this.send('room-remote-file-added', { chat: key, remoteFiles: [file] });
    this.send('swarm-message', {
      message: {
        message: file.fileName,
        address: file.address,
        name: clean(file.name),
        timestamp: file.time,
        room: key,
        hash: file.hash,
        reply: '',
        sent: false,
        file: {
          fileName: file.fileName,
          hash: file.hash,
          timestamp: file.time,
          sent: false,
          path: '',
          image: false,
          topic: e.topic,
          type: 'file',
        },
      },
    });
  }

  _fileDownloaded(e) {
    this._rememberFile(e.hash);
    const fileName = baseName(e.path) || e.fileName;
    const roomKey = this.rnKey(e.key);
    this.send('file-downloaded', {
      fileName,
      hash: e.hash,
      address: e.address,
      name: e.name,
      time: e.time,
      size: e.size,
      topic: e.topic,
      filePath: e.path,
      roomKey,
      dm: e.dm === true,
    });
    if (!e.dm) return;
    const { image, type } = mediaOf(fileName, e.size);
    this.send('dm-file', {
      message: {
        message: fileName,
        address: e.address,
        name: e.name,
        hash: e.hash,
        timestamp: e.time,
        room: roomKey,
        reply: '',
        sent: false,
        history: false,
        file: {
          fileName,
          address: e.address,
          hash: e.hash,
          timestamp: e.time,
          image,
          path: e.path || 'storage',
          topic: e.topic,
          type,
        },
        tip: false,
      },
    });
  }

  // -------------------------------------------------------------------------------------------
  // host hooks (hugin-network README, "Host hooks and events")

  /** A request to React Native; `fallback` when it gives no answer in time (0: no limit). */
  async request(data, timeoutMs = QUERY_TIMEOUT_MS, fallback) {
    try {
      const answer = await this.hugin.request(data, timeoutMs);
      return answer === undefined ? fallback : answer;
    } catch (err) {
      this._log('warn', 'request failed', { type: data && data.type, message: errMessage(err) });
      return fallback;
    }
  }

  _createHooks() {
    const h = this.hugin;
    const list = (v) => (Array.isArray(v) ? v : []);
    return {
      identity: () => ({
        address: typeof h.address === 'string' ? h.address : '',
        name: clean(h.name),
        avatar: typeof h.avatar === 'string' ? h.avatar : '',
      }),

      // the wallet in React Native signs with the spend key of our address
      sign: (message) => this.request({ type: 'sign-message', message }, WALLET_TIMEOUT_MS, null),
      verify: async (message, address, signature) =>
        (await this.request({ type: 'verify-signature', data: { message, address, signature } }, WALLET_TIMEOUT_MS, false)) === true,

      roomMessageExists: async (hash) => (await this.request({ type: 'room-message-exists', hash }, QUERY_TIMEOUT_MS, false)) === true,
      getRoomHistory: async (key) => list(await this.request({ type: 'get-room-history', key: this.rnKey(key) }, QUERY_TIMEOUT_MS, [])),
      getRoomMessage: async (hash) => {
        const m = await this.request({ type: 'get-room-message', hash }, QUERY_TIMEOUT_MS, null);
        return m && typeof m === 'object' && !Array.isArray(m) ? m : null;
      },
      getLatestRoomHashes: async (key) =>
        list(await this.request({ type: 'get-latest-room-hashes', key: this.rnKey(key) }, QUERY_TIMEOUT_MS, [])),
      feedMessageExists: async (hash) => (await this.request({ type: 'feed-message-exists', hash }, QUERY_TIMEOUT_MS, false)) === true,
      getFeedHistory: async () => list(await this.request({ type: 'get-feed-history' }, QUERY_TIMEOUT_MS, [])),

      isBanned: (address, topic) => h.banned(address, topic),
      isBlocked: (address) => h.blocked(address),
      autoSyncFiles: (topic, key, dm) => dm === true || h.syncImages === true,
      knownFile: (hash) => this._knownFile(hash),

      // proof of work: the hugin-pow backend, both parts answered by React Native's native module
      findShare: (req) => this._findShare(req),
      powHash: (blobHex) => this._powHash(blobHex),

      paths: () => ({
        storage: typeof h.store === 'string' && h.store.length > 0 ? h.store + STORAGE_DIR : '',
        downloads: typeof h.downloadDir === 'string' ? h.downloadDir : '',
      }),

      log: (level, msg, data) => this._log(level, msg, data),
    };
  }

  /**
   * One slice of the PoW share search, the `findShare` of hugin-pow's backend (hugin-network's
   * node client drives it through hugin-pow's JobTracker): React Native runs it in its native
   * module (`pow-find-share`, kryptokrona-crypto `findPowShare` on several threads) and answers
   * `{ nonce, result, hashes_performed?, threads? }`, or null when the slice found nothing.
   */
  async _findShare({ blobHex, targetHex, startNonce, maxAttempts } = {}) {
    if (typeof blobHex !== 'string' || typeof targetHex !== 'string') return null;
    const attempts = Number.parseInt(maxAttempts, 10);
    const share = await this.request(
      {
        type: 'pow-find-share',
        blobHex,
        targetHex,
        startNonce: (Number.parseInt(startNonce, 10) || 0) >>> 0,
        maxAttempts: Math.min(Math.max(1, Number.isFinite(attempts) ? attempts : 1), MAX_NATIVE_POW_ATTEMPTS),
        nonceTagBits: 0,
        nonceTagValue: 0,
      },
      0,
      null,
    );
    return share && typeof share === 'object' ? share : null;
  }

  /**
   * CN-Turtle-Lite v2 of one blob, the `hash` of hugin-pow's backend: hugin-pow checks the native
   * module against its reference vector once and every share it reports.
   */
  async _powHash(blobHex) {
    if (typeof blobHex !== 'string') return null;
    const hash = await this.request({ type: 'cn-turtle-lite-slow-hash-v2', blobHex }, 0, null);
    return typeof hash === 'string' ? hash.toLowerCase() : null;
  }

  _log(level, msg, data) {
    if (level === 'debug') return;
    try {
      if (data === undefined) console.log('[hugin-network]', level, msg);
      else console.log('[hugin-network]', level, msg, JSON.stringify(data));
    } catch {}
  }
}

module.exports = {
  Host,
  EVENT_MAP,
  EVENT_NAMES,
  IGNORED,
  NODE_POW_REQUIRED,
  GOSSIP,
  mediaOf,
};
