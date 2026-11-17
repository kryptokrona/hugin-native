// Copyright (c) 2026, The Kryptokrona Developers
//
// Please see the included LICENSE file for more information.

/*
 * DMs on the React Native side (hugin-network/dm), without a device: Node.js stands in for React
 * Native. The app files are compiled to CommonJS with Babel and loaded with stand-ins for the
 * React Native modules; every test user gets its own copies of
 *   src/services/bare/sqlite.ts         on node:sqlite (a react-native-sqlite-storage stand-in)
 *   src/services/hugin/identity.ts      on an in-memory Keychain
 *   src/services/hugin/dm.js            with hugin-crypto and hugin-network/dm
 *   src/services/kryptokrona/wallet.js  with a wallet-backend stand-in that holds the keys
 *   src/services/hugin/syncer.js        message and contact saving recorded
 *   src/services/pushnotifications.ts   Firebase, notifee and the stores are stand-ins
 * Addresses, signatures and key derivations are real (kryptokrona-utils). Node posts and DM
 * swarm sends of all users go to one shared pool and one list of swarm payloads.
 *
 *   node test/dm-crypto.js
 *
 * Needs Node.js 22.5 or later (node:sqlite) and kryptokrona-crypto installed with its Node-API
 * addon for this platform.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const Module = require('module');
const babel = require('@babel/core');
const test = require('brittle');
const { DatabaseSync } = require('node:sqlite');
const { Address, Crypto } = require('kryptokrona-utils');
const huginCrypto = require('hugin-crypto');

const root = path.resolve(__dirname, '..');
const xkr = new Crypto();

const HEX64 = /^[0-9a-f]{64}$/;
const toHex = (bytes) => Buffer.from(bytes).toString('hex');

/* ---- loading app files ---------------------------------------------------------------- */

/*
 * An app source file compiled to CommonJS; `modules` maps import ids to stand-ins. Package ids
 * that are not mapped load from node_modules; an app-relative id that is not mapped is an error.
 */
function loadSource(relative, modules) {
  const file = path.join(root, relative);
  const plugins = [];
  if (file.endsWith('.ts')) {
    plugins.push(require.resolve('@babel/plugin-transform-typescript'));
  }
  plugins.push(require.resolve('@babel/plugin-transform-modules-commonjs'));
  const { code } = babel.transformSync(fs.readFileSync(file, 'utf8'), {
    filename: file,
    configFile: false,
    babelrc: false,
    plugins,
  });
  const mod = new Module(file, module);
  mod.filename = file;
  mod.paths = Module._nodeModulePaths(path.dirname(file));
  const fromFile = Module.createRequire(file);
  mod.require = (id) => {
    if (Object.prototype.hasOwnProperty.call(modules, id)) {
      return modules[id];
    }
    if (/^(\.|@\/|lib\/|config\/)/.test(id)) {
      throw new Error(`${relative}: no stand-in for '${id}'`);
    }
    return fromFile(id);
  };
  mod._compile(code, file);
  return mod.exports;
}

/* ---- stand-ins ------------------------------------------------------------------------ */

/* react-native-sqlite-storage on node:sqlite: executeSql(sql, params) resolves [ResultSet] */
function sqliteStandIn(database) {
  const resultSet = (rows) => ({
    rows: { length: rows.length, item: (i) => rows[i], raw: () => rows.slice() },
    rowsAffected: 0,
  });
  const conn = {
    executed: [],
    async executeSql(sql, params = []) {
      conn.executed.push({ sql, params });
      return [resultSet(database.prepare(sql).all(...params))];
    },
    transaction() {
      throw new Error('transactions are not used by the code under test');
    },
  };
  return { enablePromise() {}, openDatabase: async () => conn, conn };
}

function loadSqlite(database, name = 'test') {
  const sql = sqliteStandIn(database);
  const sqlite = loadSource(path.join('src', 'services', 'bare', 'sqlite.ts'), {
    'react-native-sqlite-storage': sql,
    '@/types': {},
    '@/utils': { containsOnlyEmojis: () => false },
    './globals': { Files: { all: () => [] } },
    '../zustand': { useUserStore: { getState: () => ({ user: { name } }) } },
    'react-native': { Platform: { OS: 'android' } },
    'react-native-fs': {},
  });
  return { sqlite, conn: sql.conn };
}

/* react-native-keychain: generic passwords by service */
function keychainStandIn() {
  const kc = {
    entries: new Map(),
    reads: 0,
    writes: 0,
    failReads: false,
    ACCESSIBLE: { ALWAYS: 'AccessibleAlways' },
    async getGenericPassword({ service } = {}) {
      kc.reads++;
      if (kc.failReads) {
        throw new Error('keychain not readable');
      }
      const entry = kc.entries.get(service);
      return entry ? { service, username: entry.username, password: entry.password } : false;
    },
    async setGenericPassword(username, password, { service } = {}) {
      kc.writes++;
      kc.entries.set(service, { username, password });
      return { service, storage: 'test' };
    },
  };
  return kc;
}

/* NativeTest.js exports the code under test uses, on kryptokrona-utils' crypto */
const nativeTest = {
  generateKeyDerivation: (publicKey, privateKey) => xkr.generateKeyDerivation(publicKey, privateKey),
  cnFastHash: (hex) => xkr.cn_fast_hash(hex),
  generateDeterministicSubwalletKeys: async () => {
    throw new Error('not used');
  },
  generateKeys: () => xkr.generateKeys(),
  makePostRequest: async () => ({}),
  processBlockOutputs: async () => [],
};

/*
 * `pool`: node posts of all users; `beam`: DM swarm sends; `offline`: addresses whose DM swarm
 * has no connected peer (a DM swarm send to them reaches nobody); `syncAnswer(request)`, when
 * set, answers the node sync instead of the whole pool.
 */
function makeNet() {
  return { pool: [], beam: [], offline: new Set(), syncAnswer: null };
}

async function newAddress() {
  const keys = await Address.fromEntropy();
  return {
    address: await keys.address(),
    spend: keys.spend.privateKey,
    view: keys.view.privateKey,
    viewPublic: keys.view.publicKey,
  };
}

/*
 * One user: keys, database, Keychain and the app modules, wired to each other. With
 * `realMessages`, DMs are checked and saved by sqlite.ts itself (`messageExists`,
 * `saveMessage`) in the user's database; otherwise by the recording stand-in below.
 */
async function user(name, net, { keychain, realMessages = false } = {}) {
  const keys = await newAddress();
  const address = keys.address;
  const database = new DatabaseSync(':memory:');
  const { sqlite, conn } = loadSqlite(database, name);
  await sqlite.initDB();
  // node:sqlite may be built without double-quoted string literals, which the status column's
  // ALTER uses; the column is added here the way it is on a device.
  const messageColumns = database.prepare('PRAGMA table_info(messages)').all().map((c) => c.name);
  if (!messageColumns.includes('status')) {
    database.exec("ALTER TABLE messages ADD status TEXT DEFAULT 'success'");
  }
  const kc = keychain || keychainStandIn();

  const rec = {
    contacts: [],
    beamsOpened: [],
    updated: [],
    beamSent: [],
    nodeSent: [],
    queue: [],
    notifications: [],
    syncRequests: [],
  };
  const store = { contacts: [], messages: [] };

  /* message and contact storage, recorded (the DM crypto state uses the real sqlite.ts) */
  const messageStore = {
    ...sqlite,
    getContacts: async () => store.contacts.slice(),
    addContact: async (contactName, contactAddress, messagekey) => {
      if (store.contacts.some((c) => c.address === contactAddress)) {
        return false;
      }
      const contact = { name: contactName, address: contactAddress, messagekey };
      store.contacts.push(contact);
      rec.contacts.push(contact);
      return contact;
    },
    // the rules of sqlite.ts: one row per message id, and per conversation, direction and
    // timestamp
    messageExists: async (hash) => store.messages.some((m) => m.hash === hash),
    saveMessage: async (conversation, message, reply, timestamp, hash, sent) => {
      const same = (m) =>
        m.hash === hash || (m.conversation === conversation && m.timestamp === timestamp && m.sent === sent);
      if (store.messages.some(same)) {
        return undefined;
      }
      const saved = { conversation, message, reply, timestamp, hash, sent };
      store.messages.push(saved);
      return saved;
    },
    saveFileInfo: async () => true,
  };
  if (realMessages) {
    messageStore.messageExists = sqlite.messageExists;
    messageStore.saveMessage = sqlite.saveMessage;
  }

  const native = {
    Beam: {
      message: (to, payload) => {
        rec.beamSent.push({ to, payload });
        net.beam.push({ from: address, to, payload });
      },
      send: async (to, payload) => {
        if (net.offline.has(to)) {
          return 0;
        }
        rec.beamSent.push({ to, payload });
        net.beam.push({ from: address, to, payload });
        return 1;
      },
      new: (contact) => rec.beamsOpened.push(contact),
    },
    Nodes: {
      message: async (payload, hash, viewtag, kind) => {
        rec.nodeSent.push({ payload, hash, viewtag, kind });
        net.pool.push({ hash, cipher: payload, timestamp: Date.now() });
        return { success: true };
      },
      sync: async (request) => {
        rec.syncRequests.push(request);
        return net.syncAnswer ? net.syncAnswer(request) : { resp: net.pool.slice(), background: false };
      },
    },
    Rooms: { idle() {} },
    decrypt_sealed_box: async () => null,
    room_push_decrypt: async () => false,
    sync_push_registrations() {},
  };

  const userStore = { getState: () => ({ user: { name, address } }) };
  const globalStore = { getState: () => ({ huginNode: { connected: true } }) };
  const contactsModule = {
    setLatestMessages() {},
    updateMessage: (message, background) => rec.updated.push({ message, background }),
  };

  const identity = loadSource(path.join('src', 'services', 'hugin', 'identity.ts'), {
    'react-native-keychain': kc,
  });
  const dmModule = loadSource(path.join('src', 'services', 'hugin', 'dm.js'), {
    '../NativeTest': nativeTest,
    '../bare/sqlite': sqlite,
    './identity': identity,
  });
  const syncerModule = loadSource(path.join('src', 'services', 'hugin', 'syncer.js'), {
    '../bare/sqlite': messageStore,
    '../bare/contacts': contactsModule,
    'lib/native': native,
    './dm': dmModule,
  });
  const walletModule = loadSource(path.join('src', 'services', 'kryptokrona', 'wallet.js'), {
    '../../lib/native': native,
    '../hugin/dm': dmModule,
    'kryptokrona-wallet-backend-js': { Daemon: class {}, WalletBackend: {} },
    '../NativeTest': nativeTest,
    '../utils': {
      parse: (s) => JSON.parse(s),
      toHex: (s) => Buffer.from(String(s), 'utf8').toString('hex'),
    },
    '../bare': { joinAndSaveRoom() {}, saveRoomMessageAndUpdate() {}, setRoomMessages() {} },
    '../../services/bare/sqlite': {
      loadWallet: async () => [null, true],
      saveRoomToDatabase: async () => {},
      saveWallet: async () => {},
    },
    '@/services': {
      setBalance() {},
      setStoreAddress() {},
      setStoreCurrentRoom() {},
      setSyncStatus() {},
      setTransactions() {},
      useUserStore: userStore,
      useGlobalStore: globalStore,
    },
    '@react-native-clipboard/clipboard': { setString() {} },
    '../hugin/syncer': syncerModule,
    'react-native-toast-message': { show() {} },
    'config/wallet-config': { WalletConfig: {} },
    i18next: { t: (key) => key },
    '../../services/pushnotifications': { getDeviceId: () => 'device' },
    '@/utils': { fetchWithTimeout: async () => ({}), sleep: async () => {} },
  });

  const wallet = new walletModule.ActiveWallet();
  wallet.active = {
    getPrimaryAddressPrivateKeys: () => [keys.spend, keys.view],
    getAddresses: () => [address],
  };
  wallet.address = address;
  wallet.loaded = true;
  wallet.dm();

  const handlers = {};
  loadSource(path.join('src', 'services', 'pushnotifications.ts'), {
    '@react-native-firebase/messaging': {
      getInitialNotification: async () => null,
      getMessaging: () => ({}),
      onMessage: (messaging, fn) => {
        handlers.foreground = fn;
      },
      onNotificationOpenedApp: () => {},
      isDeviceRegisteredForRemoteMessages: () => true,
      registerDeviceForRemoteMessages: async () => {},
      requestPermission: async () => 0,
      AuthorizationStatus: { AUTHORIZED: 1, PROVISIONAL: 2 },
      getToken: async () => 'token',
      setBackgroundMessageHandler: (messaging, fn) => {
        handlers.background = fn;
      },
    },
    '@react-native-firebase/app': { getApp: () => ({}) },
    '@notifee/react-native': {
      __esModule: true,
      default: {
        createChannel: async () => 'channel',
        displayNotification: async (n) => rec.notifications.push(n),
      },
      AndroidCategory: { MESSAGE: 'msg' },
      AndroidImportance: { HIGH: 4 },
      AndroidVisibility: { PUBLIC: 1 },
      EventType: {},
    },
    '../utils/messageQueue': {
      saveMessageToQueue: async (m) => rec.queue.push(m),
      resetMessageQueue() {},
      getMessageQueue: async () => rec.queue.slice(),
    },
    './zustand': {
      updateUser() {},
      useGlobalStore: globalStore,
      usePreferencesStore: {
        getState: () => ({ preferences: {}, setBasePushVerified() {}, addRegisteredRoomKeys() {} }),
      },
      useUserStore: userStore,
    },
    './bare/sqlite': {
      ...messageStore,
      getRooms: async () => ({}),
      roomMessageExists: async () => false,
      saveRoomMessage: async () => null,
    },
    'lib/native': native,
    './hugin/dm': dmModule,
    './bare/globals': { Connection: {} },
    '../types/user': { ConnectionStatus: { connected: 'connected', connecting: 'connecting' } },
    './bare/contacts': contactsModule,
    './calls': { WebRTC: {} },
    'lib/connections': { Peers: {} },
    '../utils/utils': {
      sleep: async () => {},
      waitForCondition: async () => true,
      containsOnlyEmojis: () => false,
    },
    './kryptokrona': { Wallet: wallet },
    './bare': { saveRoomMessageAndUpdate() {} },
    'react-native': { Linking: { openURL() {} } },
  });

  return {
    name,
    address,
    keys,
    database,
    conn,
    sqlite,
    keychain: kc,
    identity,
    dmModule,
    wallet,
    syncer: syncerModule.MessageSync,
    syncerModule,
    handlers,
    rec,
    store,
  };
}

/* Runs `fn` with timers that do not keep the process alive (the push handler sets a 10 s one). */
async function withUnrefTimers(fn) {
  const original = global.setTimeout;
  global.setTimeout = (...args) => {
    const timer = original(...args);
    if (timer && typeof timer.unref === 'function') timer.unref();
    return timer;
  };
  try {
    return await fn();
  } finally {
    global.setTimeout = original;
  }
}

/* A distinct timestamp for every message: the app stores one DM per conversation, direction and
 * sender timestamp. */
const tick = () => new Promise((resolve) => setTimeout(resolve, 3));

function kemPublicKeyOf(u) {
  const entry = u.keychain.entries.get('kem-identity');
  return entry ? entry.password.split('|')[1] : null;
}

/* payload length in hex characters (hugin-network README, "DM payloads") */
const INITIAL = (name, text) => 2 * (1023 + Buffer.byteLength(name) + Buffer.byteLength(text));
const REPLY = (name, text) => 2 * (1007 + Buffer.byteLength(name) + Buffer.byteLength(text));
const ESTABLISHED = (name, text) => 2 * (239 + Buffer.byteLength(name) + Buffer.byteLength(text));

/* ---- tests ---------------------------------------------------------------------------- */

test('two users: handshake and messages through the app hooks', async (t) => {
  const net = makeNet();
  const alice = await user('alice', net);
  const bob = await user('bob', net);
  const other = await newAddress();

  // alice -> bob, node post: alice holds no key for bob, her ML-KEM public key goes along
  const s1 = await alice.wallet.send_message('hi bob', bob.address);
  t.ok(s1.success, 'sent');
  const post1 = alice.rec.nodeSent[0];
  t.is(post1.payload.length, INITIAL('alice', 'hi bob'), 'payload with the ML-KEM public key');
  t.is(post1.hash, s1.hash, 'the hash returned is the one posted');
  t.is(post1.hash, huginCrypto.messageHash(post1.payload), 'message id: messageHash of the payload');
  t.is(post1.kind, 'dm');
  t.is(post1.viewtag, await bob.wallet.generate_view_tag(), "the post carries bob's push view tag");
  t.is(await alice.sqlite.loadContactCrypto(bob.address), null, 'sending does not change the state');
  const alicePub = kemPublicKeyOf(alice);
  t.ok(/^[0-9a-f]{1600}$/.test(alicePub), "alice's ML-KEM identity is in the Keychain entry");
  t.is(alice.keychain.entries.get('kem-identity').password.split('|')[0].length, 3264);

  // bob reads the node pool
  await bob.syncer.decrypt_batch(net.pool.slice(), false);
  t.is(bob.store.messages.length, 1, 'bob saved one message');
  const m1 = bob.store.messages[0];
  t.is(m1.conversation, alice.address);
  t.is(m1.message, 'hi bob');
  t.is(m1.hash, s1.hash, 'saved under the pool hash');
  t.is(m1.sent, false);
  t.alike(bob.rec.contacts, [{ name: 'alice', address: alice.address, messagekey: '' }], 'alice added as a contact');
  t.alike(bob.rec.beamsOpened, [alice.address], 'DM swarm with alice opened');
  const b1 = await bob.sqlite.loadContactCrypto(alice.address);
  t.ok(HEX64.test(b1.messageKey), 'bob made a message key');
  t.is(b1.pendingKemCapsule.length, 1536, 'with a capsule for alice');
  t.is(b1.peerKemPub, alicePub, "for alice's ML-KEM public key");
  t.is(b1.keyTime, m1.timestamp, 'at the time of her message');

  // bob -> alice over the DM swarm: the capsule goes along
  await tick();
  const s2 = await bob.wallet.send_message('hi alice', alice.address, true);
  t.ok(s2.success);
  t.is(bob.rec.nodeSent.length, 0, 'nothing posted to the node');
  const beam2 = bob.rec.beamSent[0];
  t.is(beam2.to, alice.address);
  t.is(beam2.payload.length, REPLY('bob', 'hi alice'), 'payload with the capsule');
  t.absent(
    await alice.syncer.check_for_pm(beam2.payload, undefined, false, other.address),
    "refused from another contact's DM swarm",
  );
  t.ok(await alice.syncer.check_for_pm(beam2.payload, undefined, false, bob.address), 'opened from bob');
  const m2 = alice.store.messages[0];
  t.is(m2.message, 'hi alice');
  t.is(m2.hash, s2.hash, 'saved under the payload hash');
  const a2 = await alice.sqlite.loadContactCrypto(bob.address);
  t.is(a2.messageKey, b1.messageKey, 'alice took the key from the capsule');
  t.is(a2.pendingKemCapsule, '');

  // alice -> bob under the key: bob's capsule is not sent any more
  await tick();
  const s3 = await alice.wallet.send_message('third', bob.address);
  t.ok(s3.success);
  t.is(alice.rec.nodeSent[1].payload.length, ESTABLISHED('alice', 'third'), 'only the box under the key');
  await bob.syncer.decrypt_batch(net.pool.slice(), false);
  t.alike(
    bob.store.messages.map((m) => m.message),
    ['hi bob', 'third'],
    'the known pool entry is not opened again',
  );
  const b3 = await bob.sqlite.loadContactCrypto(alice.address);
  t.is(b3.messageKey, b1.messageKey);
  t.is(b3.pendingKemCapsule, '', 'the capsule arrived');

  // bob -> alice under the key, read by alice's node poll
  await tick();
  const s4 = await bob.wallet.send_message('all set', alice.address);
  t.ok(s4.success);
  t.is(bob.rec.nodeSent[0].payload.length, ESTABLISHED('bob', 'all set'));
  await alice.syncer.tick();
  t.alike(alice.store.messages.map((m) => m.message), ['hi alice', 'all set']);
  t.is(alice.store.messages[1].hash, s4.hash);
  t.alike(alice.rec.contacts.map((c) => c.address), [bob.address], 'bob added once');

  const stateSql = [...alice.conn.executed, ...bob.conn.executed].filter((e) => /contact_crypto/.test(e.sql));
  t.ok(stateSql.length > 0);
  t.ok(
    stateSql.every((e) => !e.sql.includes(alice.address) && !e.sql.includes(bob.address)),
    'addresses go to SQLite as bound parameters',
  );
});

test('a node pool batch through the syncer', async (t) => {
  const net = makeNet();
  const alice = await user('alice', net);
  const bob = await user('bob', net);
  const carol = await user('carol', net);

  await alice.wallet.send_message('one', bob.address);
  await tick();
  await alice.wallet.send_message('two', bob.address);
  await tick();
  await carol.wallet.send_message('for alice', alice.address);

  const oldForm = Buffer.from(JSON.stringify({ box: 'ab'.repeat(120), t: 1 })).toString('hex');
  const entries = [
    ...net.pool.slice().reverse(),
    { hash: 'aa'.repeat(32), cipher: oldForm, timestamp: 1 },
    { hash: 'bb'.repeat(32), cipher: 'abcd', timestamp: 2 },
    { hash: 'cc'.repeat(32), cipher: 7, timestamp: 3 },
    { hash: 'not a hash', cipher: net.pool[0].cipher, timestamp: 4 },
  ];
  await bob.syncer.decrypt_batch(entries, true);

  t.alike(bob.store.messages.map((m) => m.message), ['one', 'two'], "bob's DMs, oldest first");
  t.alike(
    bob.store.messages.map((m) => m.hash),
    [net.pool[0].hash, net.pool[1].hash],
    'saved under their pool hashes',
  );
  t.ok(bob.rec.updated.every((u) => u.background === true), 'background flag passed on');
  t.alike(bob.rec.contacts.map((c) => c.address), [alice.address], 'alice added once');
  t.alike(bob.rec.beamsOpened, [alice.address]);
  const state = await bob.sqlite.loadContactCrypto(alice.address);
  t.ok(HEX64.test(state.messageKey), 'one key for alice');
  t.is(state.peerKemPub, kemPublicKeyOf(alice));

  // the node poll returns the same pool again: nothing new is opened or saved
  await bob.syncer.decrypt_batch(net.pool.slice(), false);
  t.is(bob.store.messages.length, 2);
  t.alike(await bob.sqlite.loadContactCrypto(alice.address), state, 'state unchanged');
});

test('push: a DM push is opened by the DmCrypto the syncer and the wallet use', async (t) => {
  const net = makeNet();
  const alice = await user('alice', net);
  const bob = await user('bob', net);
  const carol = await user('carol', net);

  t.is(bob.wallet.dm(), bob.dmModule.dmCrypto(), 'one DmCrypto per wallet');

  // background push of alice's first message
  await alice.wallet.send_message('push me', bob.address);
  const post = alice.rec.nodeSent[0];
  await withUnrefTimers(() => bob.handlers.background({ data: { encryptedPayload: post.payload } }));
  t.is(bob.rec.queue.length, 1, 'queued for the app');
  const queued = bob.rec.queue[0];
  t.is(queued.from, alice.address);
  t.is(queued.msg, 'push me');
  t.is(queued.name, 'alice');
  t.is(queued.hash, post.hash);
  t.is(queued.timestamp, queued.t);
  t.is(bob.rec.notifications.length, 1, 'notification shown');
  t.is(bob.rec.notifications[0].title, 'alice');
  t.is(bob.rec.notifications[0].body, 'push me');

  // the handshake state the push saved is the one bob's wallet sends with
  const state = await bob.wallet.dm().contactState(alice.address);
  t.is(state.pendingKemCapsule.length, 1536, 'push saved the handshake state');
  await tick();
  const reply = await bob.wallet.send_message('got it', alice.address);
  t.ok(reply.success);
  t.is(bob.rec.nodeSent[0].payload.length, REPLY('bob', 'got it'), "bob's reply carries the capsule");
  await alice.syncer.decrypt_batch(net.pool.slice(), false);
  t.alike(alice.store.messages.map((m) => m.message), ['got it']);
  t.is((await alice.sqlite.loadContactCrypto(bob.address)).messageKey, state.messageKey, 'one key');

  // foreground push: saved directly, alice added as a contact
  await tick();
  await alice.wallet.send_message('second', bob.address);
  const post2 = alice.rec.nodeSent[1];
  t.is(post2.payload.length, ESTABLISHED('alice', 'second'));
  await bob.handlers.foreground({ data: { encryptedPayload: post2.payload } });
  t.alike(bob.store.messages.map((m) => m.message), ['second']);
  t.is(bob.store.messages[0].conversation, alice.address);
  t.alike(bob.rec.contacts, [{ name: 'alice', address: alice.address, messagekey: '' }]);
  t.alike(bob.rec.beamsOpened, [alice.address]);
  t.is((await bob.sqlite.loadContactCrypto(alice.address)).pendingKemCapsule, '', 'the capsule arrived');

  // a push of a DM for someone else shows nothing
  await carol.wallet.send_message('not for bob', alice.address);
  await withUnrefTimers(() =>
    bob.handlers.background({ data: { encryptedPayload: carol.rec.nodeSent[0].payload } }),
  );
  t.is(bob.rec.queue.length, 1, 'nothing queued');
  t.is(bob.rec.notifications.length, 1, 'no notification');
});

test('contact_crypto table: created on start, existing data kept', async (t) => {
  const database = new DatabaseSync(':memory:');
  // the contacts table as earlier versions left it, with their handshake columns
  database.exec(`CREATE TABLE contacts (
    name TEXT,
    address TEXT NOT NULL,
    messagekey TEXT NOT NULL,
    latestmessage INT DEFAULT 0,
    pending_kem_capsule TEXT DEFAULT '',
    peer_kem_pub TEXT DEFAULT '',
    UNIQUE (address, messagekey)
  )`);
  const carol = (await newAddress()).address;
  const oldRow = {
    name: 'carol',
    address: carol,
    messagekey: 'ab'.repeat(32),
    latestmessage: 5,
    pending_kem_capsule: 'cd'.repeat(768),
    peer_kem_pub: 'ef'.repeat(800),
  };
  database
    .prepare(
      'INSERT INTO contacts (name, address, messagekey, latestmessage, pending_kem_capsule, peer_kem_pub) VALUES (?, ?, ?, ?, ?, ?)',
    )
    .run(...Object.values(oldRow));

  const { sqlite } = loadSqlite(database);
  let failed = false;
  try {
    await sqlite.loadContactCrypto(carol);
  } catch {
    failed = true;
  }
  t.ok(failed, 'a load before the database is open rejects');

  await sqlite.initDB();
  const columns = database
    .prepare('PRAGMA table_info(contact_crypto)')
    .all()
    .map((c) => c.name);
  t.alike(
    columns,
    ['address', 'message_key', 'pending_kem_capsule', 'peer_kem_pub', 'key_time', 'previous_keys', 'updated'],
    'contact_crypto created',
  );
  const rows = database.prepare('SELECT name, address, messagekey, latestmessage, pending_kem_capsule, peer_kem_pub FROM contacts').all();
  t.alike(JSON.parse(JSON.stringify(rows)), [oldRow], 'the contacts row is unchanged');
  t.is(await sqlite.loadContactCrypto(carol), null, 'no state taken over: the contact starts a new handshake');

  const state = {
    messageKey: 'AB'.repeat(32),
    pendingKemCapsule: '',
    peerKemPub: '12'.repeat(800),
    keyTime: 1731500000123,
    previousKeys: ['cd'.repeat(32)],
  };
  await sqlite.saveContactCrypto(carol, state);
  await sqlite.saveContactCrypto(carol, state);
  const expected = { ...state, messageKey: 'ab'.repeat(32) };
  t.alike(await sqlite.loadContactCrypto(carol), expected, 'saved and loaded');
  t.is(database.prepare('SELECT COUNT(*) AS n FROM contact_crypto WHERE address = ?').get(carol).n, 1, 'one row per address');

  const odd = "SEKR'); DROP TABLE contacts; --";
  await sqlite.saveContactCrypto(odd, { messageKey: '', keyTime: 1, previousKeys: [] });
  t.is((await sqlite.loadContactCrypto(odd)).keyTime, 1, 'any address string is stored as a value');
  t.is(database.prepare('SELECT COUNT(*) AS n FROM contacts').get().n, 1, 'contacts still there');

  // a second start on the same database keeps the rows
  const again = loadSqlite(database).sqlite;
  await again.initDB();
  t.alike(await again.loadContactCrypto(carol), expected, 'kept across a restart');

  // a reset (wallet removed) drops it with the other tables
  await again.resetDB();
  t.is(database.prepare('PRAGMA table_info(contact_crypto)').all().length, 0, 'dropped by resetDB');
});

test("the KEM identity: the existing Keychain entry is used, a failed read does not replace it", async (t) => {
  const net = makeNet();
  const kp = huginCrypto.generateKemKeypair();
  const keychain = keychainStandIn();
  keychain.entries.set('kem-identity', {
    username: 'kem-identity',
    password: `${toHex(kp.secretKey)}|${toHex(kp.publicKey)}`,
  });
  const alice = await user('alice', net, { keychain });
  const bob = await user('bob', net);

  await alice.wallet.send_message('same key', bob.address);
  await bob.syncer.decrypt_batch(net.pool.slice(), false);
  t.is((await bob.sqlite.loadContactCrypto(alice.address)).peerKemPub, toHex(kp.publicKey), 'the stored public key went out');
  t.is(keychain.writes, 0, 'the Keychain entry was not rewritten');
  t.is((await alice.identity.loadOrCreateIdentity()).publicKey, toHex(kp.publicKey));

  const locked = keychainStandIn();
  locked.failReads = true;
  const dave = await user('dave', net, { keychain: locked });
  const failed = await dave.wallet.send_message('hello', bob.address);
  t.alike(failed, { success: false, error: 'encrypt_failed', hash: '' }, 'no send without the identity');
  t.is(await dave.identity.loadOrCreateIdentity(), null, 'the start-up load does not reject');
  t.is(locked.writes, 0, 'no new identity written');

  locked.failReads = false;
  const sent = await dave.wallet.send_message('hello', bob.address);
  t.ok(sent.success, 'sent once the Keychain can be read');
  t.is(locked.writes, 1, 'a first identity is made when there is none');
  t.ok(/^[0-9a-f]{3264}\|[0-9a-f]{1600}$/.test(locked.entries.get('kem-identity').password), 'stored as secret|public');
});

test('DM swarm key and long messages', async (t) => {
  const net = makeNet();
  const alice = await user('alice', net);
  const bob = await user('bob', net);

  const ab = await alice.wallet.key_derivation_hash(bob.address);
  const ba = await bob.wallet.key_derivation_hash(alice.address);
  t.ok(HEX64.test(ab));
  t.is(ab, ba, 'the same key on both sides');
  const previous = await xkr.cn_fast_hash(await xkr.generateKeyDerivation(bob.keys.viewPublic, alice.keys.view));
  t.is(ab, previous, 'the value the app derived before (cn_fast_hash of the key derivation)');

  // a long first message does not fit a node post: it goes over the DM swarm
  const text = 'a'.repeat(3000);
  const sent = await alice.wallet.send_message(text, bob.address);
  t.ok(sent.success);
  t.is(alice.rec.nodeSent.length, 0, 'not posted to the node');
  t.is(alice.rec.beamSent.length, 1, 'sent over the DM swarm');
  t.ok(alice.rec.beamSent[0].payload.length > 7600);
  t.ok(await bob.syncer.check_for_pm(alice.rec.beamSent[0].payload, undefined, false, alice.address));
  t.is(bob.store.messages[0].message, text);
});

test('a long DM while the contact is not connected is not reported as sent', async (t) => {
  const net = makeNet();
  const alice = await user('alice', net);
  const bob = await user('bob', net);
  net.offline.add(bob.address);

  const text = 'b'.repeat(3000);
  const unsent = await alice.wallet.send_message(text, bob.address);
  t.alike(unsent, { success: false, error: 'contact_offline', hash: '' }, 'not sent: the contact is not connected');
  const unsentBeam = await alice.wallet.send_message(text, bob.address, true);
  t.alike(unsentBeam, { success: false, error: 'contact_offline', hash: '' }, 'the same with the DM swarm flag set');
  t.is(alice.rec.beamSent.length, 0, 'nothing went over the DM swarm');
  t.is(alice.rec.nodeSent.length, 0, 'nothing was posted to the node');

  // a DM that fits a node post is posted when the DM swarm reaches nobody
  await tick();
  const short = await alice.wallet.send_message('short', bob.address, true);
  t.ok(short.success);
  t.is(alice.rec.beamSent.length, 0);
  t.is(alice.rec.nodeSent.length, 1, 'posted to the node instead');
  t.is(alice.rec.nodeSent[0].hash, short.hash);

  // the contact is connected: sent again, it is delivered and opened
  net.offline.delete(bob.address);
  await tick();
  const resent = await alice.wallet.send_message(text, bob.address, true);
  t.ok(resent.success, 'sent once the contact is connected');
  t.is(alice.rec.beamSent.length, 1);
  t.is(resent.hash, huginCrypto.messageHash(alice.rec.beamSent[0].payload));
  t.ok(await bob.syncer.check_for_pm(alice.rec.beamSent[0].payload, undefined, false, alice.address));
  t.alike(bob.store.messages.map((m) => m.message), [text]);
  t.is(bob.store.messages[0].hash, resent.hash);

  // the message screen keeps an own message that was not delivered as failed, in one row
  const carol = await user('carol', net, { realMessages: true });
  const outgoing = 'a1'.repeat(32);
  const at = Date.now();
  await carol.sqlite.saveMessage(bob.address, text, '', at, outgoing, true, carol.address, undefined, 'carol', 'pending');
  await carol.sqlite.saveMessage(bob.address, text, '', at, outgoing, true, carol.address, undefined, 'carol', 'failed');
  const own = carol.database.prepare('SELECT hash, status, sent FROM messages WHERE conversation = ?').all(bob.address);
  t.alike(JSON.parse(JSON.stringify(own)), [{ hash: outgoing, status: 'failed', sent: 1 }], 'one row, failed (offered for resend)');
});

test('node sync: every entry of an answer is opened, and the next sync asks after it', async (t) => {
  const net = makeNet();
  const alice = await user('alice', net);
  const bob = await user('bob', net);
  const { NODE_SYNC_LIMIT, SYNC_OVERLAP_MS, nextSyncTimestamp, slices } = bob.syncerModule;

  t.is(nextSyncTimestamp([], 5, 100000), 5, 'an answer without timestamps keeps the request timestamp');
  t.is(nextSyncTimestamp([{ timestamp: 50000 }, { timestamp: 'x' }, {}], 0, 100000), 50000 - SYNC_OVERLAP_MS);
  t.is(nextSyncTimestamp([{ timestamp: 500000 }], 0, 100000), 100000 - SYNC_OVERLAP_MS, 'not after the local clock');
  t.is(nextSyncTimestamp([{ timestamp: 31000 }], 5000, 100000), 5000, 'never earlier than the request');
  t.alike(slices([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);

  // a full answer: DMs for bob at the first, the 351st and the last place
  for (const text of ['at 0', 'at 350', 'at 499']) {
    await alice.wallet.send_message(text, bob.address);
    await tick();
  }
  const posts = net.pool.slice();
  const base = Date.now() - 20 * 60 * 1000;
  const answer = [];
  for (let i = 0; i < NODE_SYNC_LIMIT; i++) {
    answer.push({ hash: i.toString(16).padStart(64, '0'), cipher: 'ab'.repeat(150), timestamp: base + i });
  }
  [0, 350, 499].forEach((at, k) => {
    answer[at] = { ...posts[k], timestamp: base + at };
  });
  net.syncAnswer = (request) => ({
    resp: answer.filter((e) => e.timestamp > request.timestamp),
    background: false,
  });

  const sizes = [];
  const open = bob.syncer.decrypt_batch.bind(bob.syncer);
  bob.syncer.decrypt_batch = (list, background) => {
    sizes.push(list.length);
    return open(list, background);
  };

  await bob.syncer.tick();
  t.is(bob.rec.syncRequests[0].timestamp, 0, 'the first sync asks from 0');
  t.alike(sizes, [299, 201], 'the whole answer is opened, in slices of at most 299');
  t.alike(
    bob.store.messages.map((m) => m.message),
    ['at 0', 'at 350', 'at 499'],
    'the DMs after the first 299 entries are saved too',
  );
  t.alike(bob.store.messages.map((m) => m.hash), posts.map((p) => p.hash), 'under their pool hashes');
  const next = base + 499 - SYNC_OVERLAP_MS;
  t.is(bob.syncer.lastChecked, next, 'the next sync asks from the newest entry less the overlap');

  await bob.syncer.tick();
  t.is(bob.rec.syncRequests[1].timestamp, next);
  t.is(
    sizes.slice(2).reduce((sum, n) => sum + n, 0),
    answer.filter((e) => e.timestamp > next).length,
    'the entries after it, all of them',
  );
  t.is(bob.store.messages.length, 3, 'entries opened before are not saved again');

  // a poll that is still running is not overlapped by the next one
  let release;
  net.syncAnswer = () =>
    new Promise((resolve) => {
      release = () => resolve({ resp: [], background: false });
    });
  const running = bob.syncer.tick();
  await bob.syncer.tick();
  t.is(bob.rec.syncRequests.length, 3, 'one request while a poll runs');
  release();
  await running;
  t.is(bob.syncer.busy, false);
});

test('push and node sync store a DM once, under its message id', async (t) => {
  const net = makeNet();
  const alice = await user('alice', net);
  const bob = await user('bob', net, { realMessages: true });
  const rows = () =>
    bob.database
      .prepare('SELECT message, timestamp, hash, sent FROM messages WHERE conversation = ? ORDER BY timestamp')
      .all(alice.address);

  // the push first, then the node sync
  await alice.wallet.send_message('pushed first', bob.address);
  const p1 = alice.rec.nodeSent[0];
  await bob.handlers.foreground({ data: { encryptedPayload: p1.payload } });
  await bob.syncer.decrypt_batch(net.pool.slice(), false);
  t.alike(rows().map((r) => [r.message, r.hash]), [['pushed first', p1.hash]], 'one row, under the pool hash');

  // the node sync first, then the push
  await tick();
  await alice.wallet.send_message('synced first', bob.address);
  const p2 = alice.rec.nodeSent[1];
  await bob.syncer.decrypt_batch(net.pool.slice(), false);
  await bob.handlers.foreground({ data: { encryptedPayload: p2.payload } });
  t.alike(rows().map((r) => r.hash), [p1.hash, p2.hash], 'one row each');
  t.is(bob.rec.updated.length, 2, 'each shown once');

  // the background push queues the message under the same id
  await tick();
  await alice.wallet.send_message('queued', bob.address);
  const p3 = alice.rec.nodeSent[2];
  await withUnrefTimers(() => bob.handlers.background({ data: { encryptedPayload: p3.payload } }));
  t.is(bob.rec.queue[0].hash, p3.hash, 'queued under the pool hash');

  // a row an earlier version saved from a push, under the sender's timestamp
  const queuedAt = bob.rec.queue[0].timestamp;
  bob.database
    .prepare(
      'INSERT INTO messages (conversation, message, reply, timestamp, hash, sent, read, status, tip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
    .run(alice.address, 'queued', '', queuedAt, String(queuedAt), 0, 0, 'success', 'false');
  await bob.syncer.decrypt_batch(net.pool.slice(), false);
  t.is(rows().filter((r) => r.message === 'queued').length, 1, 'the node sync does not add a second row');

  // two rows of one DM (from before): the list shows it once, under its message id
  const at = 1731500000000;
  const insert = bob.database.prepare(
    'INSERT INTO messages (conversation, message, reply, timestamp, hash, sent, read, status, tip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  );
  insert.run(alice.address, 'twice', '', at, String(at), 0, 0, 'success', 'false');
  insert.run(alice.address, 'twice', '', at, 'ee'.repeat(32), 0, 0, 'success', 'false');
  const shown = await bob.sqlite.getMessages(alice.address, 0);
  t.alike(shown.map((m) => m.message), ['twice', 'pushed first', 'synced first', 'queued']);
  t.is(shown[0].hash, 'ee'.repeat(32), 'the row with the message id');
  t.is((await bob.sqlite.getMessages(alice.address, 0, false)).length, 4, 'the reply view too');

  // another conversation's DM with the same timestamp is its own message
  const dave = (await newAddress()).address;
  const saved = await bob.sqlite.saveMessage(dave, 'same time', '', at, 'dd'.repeat(32), false, undefined);
  t.ok(saved, 'saved');
  t.is(await bob.sqlite.messageExists('dd'.repeat(32)), true);
  t.is(await bob.sqlite.messageExists(String(at + 1)), false);
});

test('hugin-crypto 1.1.0: create, then open with the own address, through the ML-KEM handshake', async (t) => {
  t.is(require('hugin-crypto/package.json').version, '1.1.0');
  const at = 1731500000000;
  const party = async () => {
    const keys = await newAddress();
    return {
      address: keys.address,
      sender: { address: keys.address, privateSpendKey: keys.spend },
      open: { privateViewKey: keys.view, myAddress: keys.address },
      view: keys.view,
      kem: huginCrypto.generateKemKeypair(),
    };
  };
  const alice = await party();
  const bob = await party();
  const carol = await party();

  // initial: alice's ML-KEM public key goes along
  const wire = await huginCrypto.createFriendRequest({
    message: 'hi bob',
    sender: alice.sender,
    toAddress: bob.address,
    name: 'alice',
    myKemPub: alice.kem.publicKey,
    timestamp: at,
  });
  const r1 = await huginCrypto.openFriendRequest(
    huginCrypto.decodeExtra(huginCrypto.encodeExtra(wire)),
    bob.open,
    bob.kem.secretKey,
  );
  t.ok(r1, 'opened');
  t.is(r1.type, 'friend-request');
  t.is(r1.from, alice.address);
  t.is(r1.msg, 'hi bob');
  t.is(r1.name, 'alice');
  t.is(r1.t, at);
  t.is(r1.verified, true);
  t.is(toHex(r1.handshake.peerKemPub), toHex(alice.kem.publicKey));

  // first reply: bob's capsule and the inner box under the new key
  const { ciphertext, sharedSecret } = huginCrypto.encapsulate(r1.handshake.peerKemPub);
  const reply = await huginCrypto.createFriendRequest({
    message: 'hi alice',
    sender: bob.sender,
    toAddress: alice.address,
    messageKey: sharedSecret,
    kemCiphertext: ciphertext,
    timestamp: at + 1,
  });
  const r2 = await huginCrypto.openFriendRequest(reply, { ...alice.open, getMessageKey: () => null }, alice.kem.secretKey);
  t.ok(r2, 'opened');
  t.is(r2.type, 'message');
  t.is(r2.msg, 'hi alice');
  t.is(toHex(r2.handshake.sharedSecret), toHex(sharedSecret), 'alice gets the same key');

  // established: the stored key, looked up by the sender's address
  const msg = await huginCrypto.createFriendRequest({
    message: 'both keys',
    sender: alice.sender,
    toAddress: bob.address,
    messageKey: sharedSecret,
    timestamp: at + 2,
  });
  const r3 = await huginCrypto.openFriendRequest(msg, {
    ...bob.open,
    getMessageKey: async (from) => (from === alice.address ? sharedSecret : null),
  });
  t.ok(r3, 'opened');
  t.is(r3.msg, 'both keys');

  // false, never a rejection: another recipient, no myAddress, bad input
  t.is(await huginCrypto.openFriendRequest(wire, carol.open), false, "carol's keys");
  t.is(
    await huginCrypto.openFriendRequest(wire, { privateViewKey: bob.view, myAddress: carol.address }),
    false,
    'the signature names bob as the recipient',
  );
  t.is(await huginCrypto.openFriendRequest(wire, { privateViewKey: bob.view }), false, 'no myAddress');
  t.is(await huginCrypto.openFriendRequest({ ...wire, box: 'zz' }, bob.open), false, 'box not hex');
  t.is(await huginCrypto.openFriendRequest(null, bob.open), false);
});
