// Copyright (c) 2026, The Kryptokrona Developers
//
// Please see the included LICENSE file for more information.

/*
 * src/services/NativeTest.js on kryptokrona-crypto's KryptokronaCrypto module, without a device:
 * Node.js stands in for React Native. NativeTest.js is compiled to CommonJS with Babel and
 * loaded with
 *   react-native                    a stand-in whose TurboModuleRegistry returns a module with
 *                                   the methods and shapes of kryptokrona-crypto's codegen spec,
 *                                   computed by kryptokrona-crypto's Node-API addon (the same
 *                                   Rust core the C++ module calls), and NativeModules.TurtleCoin
 *                                   with a recording getWalletSyncData
 *   kryptokrona-crypto              its React Native entry point (dist/react-native.js)
 *   kryptokrona-wallet-backend-js   a TransactionInput that records its constructor arguments
 * Every export is checked for its name, arguments and result shape. src/config/wallet-config.js
 * is loaded the same way, to check the hooks it hands to kryptokrona-wallet-backend-js.
 *
 *   node test/native-crypto.js
 *
 * Needs kryptokrona-crypto 2.x installed with its Node-API addon for this platform
 * (prebuilt/napi/kryptokrona-crypto.<platform>.node; KRYPTOKRONA_CRYPTO_NAPI overrides the path).
 */
'use strict';

const fs = require('fs');
const path = require('path');
const Module = require('module');
const babel = require('@babel/core');
const test = require('brittle');

const root = path.resolve(__dirname, '..');
const cryptoDir = path.dirname(require.resolve('kryptokrona-crypto/package.json', { paths: [root] }));

function addonPath() {
  if (process.env.KRYPTOKRONA_CRYPTO_NAPI) {
    return path.resolve(process.env.KRYPTOKRONA_CRYPTO_NAPI);
  }
  const { platform, arch } = process;
  const name =
    platform === 'linux'
      ? 'linux-' + arch + '-gnu'
      : platform === 'win32'
        ? 'win32-' + arch + '-msvc'
        : platform + '-' + arch;
  return path.join(cryptoDir, 'prebuilt', 'napi', 'kryptokrona-crypto.' + name + '.node');
}

const addon = require(addonPath());

/* ---- stand-ins ------------------------------------------------------------------------ */

const calls = [];

/* KryptokronaCrypto as spec/NativeKryptokronaCrypto.ts of kryptokrona-crypto declares it */
const turboModule = {
  checkKey: (k) => addon.checkKey(k),
  checkSignature: (h, p, s) => addon.checkSignature(h, p, s),
  checkRingSignature: (h, i, keys, sigs) => addon.checkRingSignature(h, i, keys, sigs),
  cn_fast_hash: (d) => addon.cn_fast_hash(d),
  secretKeyToPublicKey: (k) => addon.secretKeyToPublicKey(k),
  scReduce32: (s) => addon.scReduce32(s),
  hashToEllipticCurve: (h) => addon.hashToEllipticCurve(h),
  hashToScalar: (d) => addon.hashToScalar(d),
  generateKeys: () => {
    const keys = addon.generateKeys();
    return [keys.private_key, keys.public_key];
  },
  generateKeyDerivation: (p, s) => addon.generateKeyDerivation(p, s),
  derivePublicKey: (d, i, p) => {
    calls.push(['derivePublicKey', typeof i]);
    return addon.derivePublicKey(d, i, p);
  },
  deriveSecretKey: (d, i, s) => {
    calls.push(['deriveSecretKey', typeof i]);
    return addon.deriveSecretKey(d, i, s);
  },
  underivePublicKey: (d, i, p) => addon.underivePublicKey(d, i, p),
  generateKeyImage: (p, s) => addon.generateKeyImage(p, s),
  generateSignature: (h, p, s) => addon.generateSignature(h, p, s),
  deriveViewTag: (d, i) => addon.deriveViewTag(d, i),
  clsagVerify: (h, ring, image, c1, s) => addon.clsagVerify(h, ring, image, c1, s),
  cn_turtle_lite_slow_hash_v2: (d) => addon.cn_turtle_lite_slow_hash_v2(d),
  generateDeterministicSubwalletKeys: async (base, index) => {
    const keys = addon.generateDeterministicSubwalletKeys(base, index);
    return [keys.private_key, keys.public_key];
  },
  generateRingSignatures: async (h, i, keys, s, real) => {
    calls.push(['generateRingSignatures', typeof real]);
    return addon.generateRingSignatures(h, i, keys, s, real);
  },
  clsagSign: async (h, ring, s, real, alpha, decoys) => {
    calls.push(['clsagSign', typeof real, alpha, decoys.length]);
    const sig = addon.clsagSign(h, ring, s, real, alpha, decoys);
    return [sig.c1].concat(sig.s);
  },
  processBlockOutputs: (block, view, spend, isView, coinbase) =>
    addon.processBlockOutputs(block, view, spend, isView, coinbase),
  findPowShare: (blob, target, start, attempts, bits, value) =>
    addon.findPowShare(blob, target, start, attempts, bits, value),
};

const syncRequests = [];

/* The app's own platform module: only getWalletSyncData is used by NativeTest.js */
const TurtleCoin = {
  getWalletSyncData: async (...args) => {
    syncRequests.push(args);
    return JSON.stringify({ items: [], synced: true });
  },
};

const reactNative = {
  NativeModules: { TurtleCoin },
  TurboModuleRegistry: {
    get: (name) => (name === 'KryptokronaCrypto' ? turboModule : null),
  },
};

class TransactionInput {
  constructor(...args) {
    this.args = args;
  }
}

/* `require('react-native')` from kryptokrona-crypto's entry point gets the stand-in too */
const fakeReactNative = path.join(root, 'test', '.react-native-stand-in.js');
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request === 'react-native') {
    return fakeReactNative;
  }
  return originalResolveFilename.call(this, request, ...rest);
};
const stub = new Module(fakeReactNative);
stub.filename = fakeReactNative;
stub.loaded = true;
stub.exports = reactNative;
require.cache[fakeReactNative] = stub;

/* ---- NativeTest.js, compiled to CommonJS ---------------------------------------------- */

/* An app source file compiled to CommonJS; `modules` maps import ids to stand-ins */
function loadSource(relative, modules) {
  const file = path.join(root, relative);
  const { code } = babel.transformSync(fs.readFileSync(file, 'utf8'), {
    filename: file,
    configFile: false,
    babelrc: false,
    plugins: [require.resolve('@babel/plugin-transform-modules-commonjs')],
  });
  const mod = new Module(file, module);
  mod.filename = file;
  mod.paths = Module._nodeModulePaths(path.dirname(file));
  mod.require = (id) => (id in modules ? modules[id] : require(id));
  mod._compile(code, file);
  return mod.exports;
}

const native = loadSource(path.join('src', 'services', 'NativeTest.js'), {
  'react-native': reactNative,
  'kryptokrona-crypto': require(path.join(cryptoDir, 'dist', 'react-native.js')),
  'kryptokrona-wallet-backend-js': { TransactionInput },
});

/* wallet-config.js with recording stand-ins for the wallet-backend classes it constructs */
class MixinLimit {
  constructor(...args) {
    this.args = args;
  }
}
class MixinLimits {
  constructor(...args) {
    this.args = args;
  }
}
class Daemon {
  constructor(...args) {
    this.args = args;
  }
}

const { WalletConfig } = loadSource(path.join('src', 'config', 'wallet-config.js'), {
  'kryptokrona-wallet-backend-js': { MixinLimit, MixinLimits, Daemon },
  '../services/NativeTest': native,
});

/* ---- vectors (kryptokrona-crypto tests/crypto.ts) ------------------------------------- */

const TX_PUBLIC = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94';
const VIEW_SECRET = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909';
const DERIVATION = '4827dbde0c0994c0979e2f9c046825bb4a065b6e35cabc0290ff5216af060c20';
const SPEND_PUBLIC = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418';
const SPEND_SECRET = 'd9d555a892a85f64916cae1a168bd3f7f400b6471c7b12b438b599601298210b';
const OUTPUT_KEY = 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d';
const OUTPUT_SECRET = 'e52ece5717f01843e3accc4df651d669e339c31eb8059145e881faae19ad4a0e';
const TESTDATA =
  '0100fb8e8ac805899323371bb790db19218afd8db8e3755d8b90f39b3d5506a9' +
  'abce4fa912244500000000ee8146d49fa93ee724deb57d12cbc6c6f3b924d946' +
  '127c7a97418f9348828f0f02';
const HEX64 = /^[0-9a-f]{64}$/;

/* tx-v2-view-tags.json (monero) of kryptokrona-crypto: indexes around the one-byte varint limit */
const VIEW_TAG_DERIVATION = '0fc47054f355ced4d67de73bfa12e4c78ff19089548fffa7d07a674741860f97';
const VIEW_TAGS = [
  [0, '76'],
  [1, 'd6'],
  [127, '2c'],
  [128, '11'],
];

/* tx-v2-clsag.json of kryptokrona-crypto, vector n3_l1 (ring size 3, signer index 1) */
const CLSAG = {
  message: 'b3618090bdbc6ffd88ab0327c6bd3dac34bfb86bd03350b47fb4b694f4c5853f',
  ring: [
    '58260aca4c4a2e6589041df92c58ae5d12954db09f506308b011de1dbd709baa',
    '2c527780939c6997b66c6240f2bc0cb543e16eee7859f058db352962c3ea4bcf',
    '107d27fcb90e36a2a61ab0c24ed5f753b5f061ee8fabea88185d936a06755adb',
  ],
  signerIndex: 1,
  secret: '3a04e724c9842dc9d85d5aee449d4209d2da66f8977f09c3c420ad789bafb306',
  keyImage: 'ba11a5999014ee552b5470d5191c4549591df53d5fe9df34e3f3e14d9ebb55cd',
  alpha: '1b8d89d39856984e8a04adeda3929777c926dd385f1831150021e690879fec02',
  decoyResponses: [
    'c3ef3aebcb04211ac7a01a8d962de4037bc126ec6f78f4b84983280f9e4d930e',
    '09e95f7046a793b435fae05fd5852165e0d128815c16d337d35fc8d488109f06',
  ],
  c1: '2dbcd54dad8120c4ead74d8c5a6d4435683279ed3efde8d4ae125e6f61cec90f',
  s: [
    '09e95f7046a793b435fae05fd5852165e0d128815c16d337d35fc8d488109f06',
    'b867be47491507856dcf943a5f7ea65a0d0d083ce3095c7e7d9d8517f562ad01',
    'c3ef3aebcb04211ac7a01a8d962de4037bc126ec6f78f4b84983280f9e4d930e',
  ],
};

/* ---- tests ---------------------------------------------------------------------------- */

test('exports keep their names', (t) => {
  const names = [
    'checkKey', 'checkRingSignature', 'checkSignature', 'clsagSign', 'clsagVerify', 'cnFastHash',
    'cnTurtleLiteSlowHashV2', 'derivePublicKey', 'deriveSecretKey', 'deriveViewTag', 'findPowShare',
    'generateDeterministicSubwalletKeys',
    'generateKeyDerivation', 'generateKeyImage', 'generateKeys', 'generateRingSignatures',
    'generateSignature', 'hashToEllipticCurve', 'hashToScalar', 'makePostRequest',
    'processBlockOutputs', 'scReduce32', 'secretKeyToPublicKey', 'underivePublicKey',
  ];
  t.alike(Object.keys(native).filter((k) => k !== '__esModule').sort(), names.sort());
  for (const name of names) {
    t.is(typeof native[name], 'function', name);
  }
});

test('derivation chain and key images', async (t) => {
  const recorded = calls.length;
  t.is(await native.generateKeyDerivation(TX_PUBLIC, VIEW_SECRET), DERIVATION);
  t.is(await native.derivePublicKey(DERIVATION, 2, SPEND_PUBLIC), OUTPUT_KEY);
  t.is(await native.deriveSecretKey(DERIVATION, 2, SPEND_SECRET), OUTPUT_SECRET);
  t.is(await native.underivePublicKey(DERIVATION, 2, OUTPUT_KEY), SPEND_PUBLIC);
  t.is(
    await native.generateKeyImage(OUTPUT_KEY, OUTPUT_SECRET),
    '5997cf23543ce2e05c327297a47f26e710af868344859a6f8d65683d8a2498b0',
  );
  /* the index reaches the module as a plain number (no { outputIndex } wrapper) */
  t.alike(calls.slice(recorded), [['derivePublicKey', 'number'], ['deriveSecretKey', 'number']]);
});

test('keys', async (t) => {
  t.is(
    await native.secretKeyToPublicKey('4a078e76cd41a3d3b534b83dc6f2ea2de500b653ca82273b7bfad8045d85a400'),
    '7849297236cd7c0d6c69a3c8c179c038d3c1c434735741bb3c8995c3c9d6f2ac',
  );
  t.is(await native.checkKey('7849297236cd7c0d6c69a3c8c179c038d3c1c434735741bb3c8995c3c9d6f2ac'), true);
  t.is(await native.checkKey('4a078e76cd41a3d3b534b83dc6f2ea2de500b653ca82273b7bfad8045d85a400'), false);
  const l = 'edd3f55c1a631258d69cf7a2def9de1400000000000000000000000000000010';
  t.is(await native.scReduce32(l), '00'.repeat(32));
  t.is(await native.scReduce32(SPEND_SECRET), SPEND_SECRET);

  const keys = await native.generateKeys();
  t.alike(Object.keys(keys).sort(), ['private_key', 'public_key']);
  t.ok(HEX64.test(keys.private_key) && HEX64.test(keys.public_key));
  t.is(await native.secretKeyToPublicKey(keys.private_key), keys.public_key);

  const sub = await native.generateDeterministicSubwalletKeys(
    'dd0c02d3202634821b4d9d91b63d919725f5c3e97e803f3512e52fb0dc2aab0c',
    1,
  );
  t.alike(Object.keys(sub).sort(), ['private_key', 'public_key']);
  t.is(sub.private_key, 'c55cbe4fd1c49dca5958fa1c7b9212c2dbf3fd5bfec84de741d434056e298600');
  t.is(sub.public_key, await native.secretKeyToPublicKey(sub.private_key));
});

test('hashes', async (t) => {
  t.is(await native.cnFastHash(TESTDATA), 'b542df5b6e7f5f05275c98e7345884e2ac726aeeb07e03e44e0389eb86cd05f0');
  t.is(
    await native.cnTurtleLiteSlowHashV2(TESTDATA),
    'b2172ec9466e1aee70ec8572a14c233ee354582bcb93f869d429744de5726a26',
  );
  t.ok(HEX64.test(await native.hashToEllipticCurve(OUTPUT_KEY)));
  t.ok(HEX64.test(await native.hashToScalar(TESTDATA)));
});

test('signatures', async (t) => {
  const prefix = 'b542df5b6e7f5f05275c98e7345884e2ac726aeeb07e03e44e0389eb86cd05f0';
  const keys = await native.generateKeys();
  const signature = await native.generateSignature(prefix, keys.public_key, keys.private_key);
  t.ok(/^[0-9a-f]{128}$/.test(signature));
  t.is(await native.checkSignature(prefix, keys.public_key, signature), true);

  const keyImage = '6865866ed8a25824e042e21dd36e946836b58b03366e489aecf979f444f599b0';
  const ring = [
    '492390897da1cabd3886e3eff43ad1d04aa510a905bec0acd31a0a2f260e7862',
    '7644ccb5410cca2be18b033e5f7497aeeeafd1d8f317f29cba4803e4306aa402',
    'bb9a956ffdf8159ad69474e6b0811316c44a17a540d5e39a44642d4d933a6460',
    'e1cd9ccdfdf2b3a45ac2cfd1e29185d22c185742849f52368c3cdd1c0ce499c0',
  ];
  const recorded = calls.length;
  const sigs = await native.generateRingSignatures(
    prefix,
    keyImage,
    ring,
    '73a8e577d58f7c11992201d4014ac7eef39c1e9f6f6d78673103de60a0c3240b',
    3,
  );
  t.is(sigs.length, 4);
  t.ok(sigs.every((s) => /^[0-9a-f]{128}$/.test(s)));
  t.is(await native.checkRingSignature(prefix, keyImage, ring, sigs), true);
  t.alike(calls.slice(recorded), [['generateRingSignatures', 'number']]);
});

test('view tags', async (t) => {
  for (const [index, tag] of VIEW_TAGS) {
    t.is(await native.deriveViewTag(VIEW_TAG_DERIVATION, index), tag, 'index ' + index);
  }

  /* the first byte of cn_fast_hash("view_tag" || derivation || varint(index)) */
  const derivation = await native.generateKeyDerivation(TX_PUBLIC, VIEW_SECRET);
  for (const [index, varint] of [[2, '02'], [300, 'ac02']]) {
    const hash = await native.cnFastHash('766965775f746167' + derivation + varint);
    t.is(await native.deriveViewTag(derivation, index), hash.substr(0, 2), 'index ' + index);
  }

  const pending = native.deriveViewTag('00', 0);
  t.ok(pending instanceof Promise);
  await t.exception(pending);
});

test('CLSAG: known answer with explicit randomness', async (t) => {
  const recorded = calls.length;
  const signature = await native.clsagSign(
    CLSAG.message,
    CLSAG.ring,
    CLSAG.secret,
    CLSAG.signerIndex,
    CLSAG.alpha,
    CLSAG.decoyResponses,
  );
  t.alike(signature, { c1: CLSAG.c1, s: CLSAG.s });
  t.alike(calls.slice(recorded), [['clsagSign', 'number', CLSAG.alpha, 2]]);

  /* the key image of the input is the ordinary one of the real output */
  t.is(await native.generateKeyImage(CLSAG.ring[CLSAG.signerIndex], CLSAG.secret), CLSAG.keyImage);
  t.is(await native.clsagVerify(CLSAG.message, CLSAG.ring, CLSAG.keyImage, CLSAG.c1, CLSAG.s), true);
});

test('CLSAG: sign and verify with fresh randomness', async (t) => {
  const prefix = 'b542df5b6e7f5f05275c98e7345884e2ac726aeeb07e03e44e0389eb86cd05f0';
  const members = [];
  for (let i = 0; i < 4; i++) {
    members.push(await native.generateKeys());
  }
  const ring = members.map((keys) => keys.public_key);
  const real = 2;
  const secret = members[real].private_key;
  const keyImage = await native.generateKeyImage(ring[real], secret);

  /* wallet-backend calls the hook with alpha '' and decoyResponses [] for fresh randomness */
  const recorded = calls.length;
  const signature = await native.clsagSign(prefix, ring, secret, real, '', []);
  t.alike(Object.keys(signature).sort(), ['c1', 's']);
  t.ok(HEX64.test(signature.c1));
  t.is(signature.s.length, ring.length);
  t.ok(signature.s.every((s) => HEX64.test(s)));
  t.is(await native.clsagVerify(prefix, ring, keyImage, signature.c1, signature.s), true);

  /* without the last two arguments as well */
  const again = await native.clsagSign(prefix, ring, secret, real);
  t.is(await native.clsagVerify(prefix, ring, keyImage, again.c1, again.s), true);
  t.not(again.c1, signature.c1, 'fresh randomness per signature');
  t.alike(calls.slice(recorded), [['clsagSign', 'number', '', 0], ['clsagSign', 'number', '', 0]]);

  /* any other message, ring, key image or response does not verify */
  const other = 'ab'.repeat(32);
  const verify = (h, r, i, c1, s) => native.clsagVerify(h, r, i, c1, s);
  t.is(await verify(other, ring, keyImage, signature.c1, signature.s), false);
  t.is(await verify(prefix, [ring[1], ring[0], ring[2], ring[3]], keyImage, signature.c1, signature.s), false);
  t.is(await verify(prefix, ring, await native.generateKeyImage(ring[0], members[0].private_key),
    signature.c1, signature.s), false);
  t.is(await verify(prefix, ring, keyImage, signature.s[0], signature.s), false);
  t.is(await verify(prefix, ring, keyImage, signature.c1, [signature.s[1]].concat(signature.s.slice(1))), false);
  t.is(await verify(prefix, ring, keyImage, signature.c1, signature.s.slice(1)), false);

  /* malformed input is false, not a rejection */
  t.is(await verify('00', ring, keyImage, signature.c1, signature.s), false);
  t.is(await verify(prefix, ring, 'zz'.repeat(32), signature.c1, signature.s), false);

  /* a secret that does not belong to the real ring member, or an index outside the ring, rejects */
  await t.exception(native.clsagSign(prefix, ring, members[0].private_key, real, '', []));
  await t.exception(native.clsagSign(prefix, ring, secret, ring.length, '', []));
});

test('wallet-config hands the hooks to kryptokrona-wallet-backend-js', (t) => {
  /* the config names CnUtils.ts and CryptoWrapper.ts of wallet-backend 2.7.0 read */
  const hooks = [
    'cnFastHash', 'checkRingSignature', 'derivePublicKey', 'deriveSecretKey',
    'generateKeyDerivation', 'generateKeyImage', 'generateRingSignatures', 'secretKeyToPublicKey',
    'underivePublicKey', 'scReduce32', 'checkKey', 'hashToEllipticCurve', 'generateSignature',
    'checkSignature', 'hashToScalar', 'generateKeys', 'deriveViewTag', 'clsagSign', 'clsagVerify',
  ];
  for (const hook of hooks) {
    t.is(typeof WalletConfig[hook], 'function', hook);
    t.is(WalletConfig[hook], native[hook], hook);
  }
});

test('invalid input rejects (never throws synchronously)', async (t) => {
  const pending = native.derivePublicKey('00', 0, SPEND_PUBLIC);
  t.ok(pending instanceof Promise);
  await t.exception(pending);
  await t.exception(native.generateKeyDerivation('zz', VIEW_SECRET));
});

test('findPowShare result shapes', async (t) => {
  const share = await native.findPowShare(TESTDATA, 'ffffffff', 7, 100, 0, 0);
  t.is(share.job_id, '');
  t.ok(/^[0-9a-f]{8}$/.test(share.nonce));
  t.ok(HEX64.test(share.result));
  t.ok(share.hashes_performed >= 1 && share.threads >= 1);
  const blob = TESTDATA.substr(0, 78) + share.nonce + TESTDATA.substr(86);
  t.is(share.result, await native.cnTurtleLiteSlowHashV2(blob));

  /* rpc.js treats a result without nonce as "no share" and reads hashes_performed */
  const none = await native.findPowShare(TESTDATA, '01000000', 0, 2);
  t.is(none.nonce, undefined);
  t.ok(none.hashes_performed >= 2 && none.threads >= 1);

  t.is(await native.findPowShare('', 'ffffffff', 0, 1, 0, 0), null);
});

test('processBlockOutputs: [publicSpendKey, TransactionInput] per owned output', async (t) => {
  const view = await native.generateKeys();
  const spend = await native.generateKeys();
  const coinbaseKeys = await native.generateKeys();
  const txKeys = await native.generateKeys();

  const outputKey = async (txSecret, index) =>
    native.derivePublicKey(await native.generateKeyDerivation(view.public_key, txSecret), index, spend.public_key);

  const coinbaseOutput = await outputKey(coinbaseKeys.private_key, 0);
  const txOutput = await outputKey(txKeys.private_key, 1);

  const block = {
    blockHeight: 1234,
    blockHash: 'dd'.repeat(32),
    blockTimestamp: 1700000000,
    coinbaseTransaction: {
      keyOutputs: [{ key: coinbaseOutput, amount: 100, globalIndex: 7 }],
      hash: 'cb'.repeat(32),
      transactionPublicKey: coinbaseKeys.public_key,
      unlockTime: 1294,
    },
    transactions: [
      {
        keyOutputs: [
          { key: SPEND_PUBLIC, amount: 1, globalIndex: 8 },
          { key: txOutput, amount: 25 },
        ],
        hash: 'aa'.repeat(32),
        transactionPublicKey: txKeys.public_key,
        unlockTime: 0,
        paymentID: '',
        inputs: [],
      },
    ],
  };

  const found = await native.processBlockOutputs(
    block,
    view.private_key,
    [[spend.public_key, spend.private_key]],
    false,
    true,
  );

  t.is(found.length, 2);
  for (const [publicSpendKey, input] of found) {
    t.is(publicSpendKey, spend.public_key);
    t.ok(input instanceof TransactionInput);
  }

  const [, coinbase] = found[0];
  const derivation = await native.generateKeyDerivation(coinbaseKeys.public_key, view.private_key);
  const ephemeral = await native.deriveSecretKey(derivation, 0, spend.private_key);
  t.alike(coinbase.args, [
    await native.generateKeyImage(coinbaseOutput, ephemeral),
    100,
    1234,
    coinbaseKeys.public_key,
    0,
    7,
    coinbaseOutput,
    0,
    1294,
    'cb'.repeat(32),
  ]);

  const [, regular] = found[1];
  t.is(regular.args[1], 25);
  t.is(regular.args[3], txKeys.public_key);
  t.is(regular.args[4], 1);
  t.is(regular.args[5], undefined, 'no globalIndex in the block: undefined');
  t.is(regular.args[9], 'aa'.repeat(32));

  /* without coinbase processing, and as a view wallet (all-zero key image) */
  t.is((await native.processBlockOutputs(block, view.private_key, [[spend.public_key, spend.private_key]], false, false)).length, 1);
  const viewed = await native.processBlockOutputs(block, view.private_key, [[spend.public_key, '']], true, true);
  t.ok(viewed.every(([, input]) => input.args[0] === '0'.repeat(64)));
});

test('processBlockOutputs caps numbers above Number.MAX_SAFE_INTEGER', async (t) => {
  const view = await native.generateKeys();
  const block = {
    blockHeight: 2 ** 60,
    coinbaseTransaction: null,
    transactions: [],
  };
  t.alike(await native.processBlockOutputs(block, view.private_key, [], false, true), []);
  t.is(block.blockHeight, Number.MAX_SAFE_INTEGER);
});

test('makePostRequest: getwalletsyncdata through NativeModules.TurtleCoin, other endpoints unchanged', async (t) => {
  const daemon = {
    sslDetermined: true,
    ssl: true,
    host: 'node.example',
    port: 11898,
    config: { scanCoinbaseTransactions: false },
    makeRequest: async (...args) => ({ via: 'makeRequest', args }),
  };
  const body = {
    blockCount: 100,
    blockHashCheckpoints: ['ab'.repeat(32)],
    startHeight: 5,
    startTimestamp: 0,
    skipCoinbaseTransactions: true,
  };
  const data = await native.makePostRequest.call(daemon, '/getwalletsyncdata', body);
  t.alike(data, { items: [], synced: true });
  t.alike(syncRequests, [[['ab'.repeat(32)], 5, 0, 100, true, 'https://node.example:11898/getwalletsyncdata']]);

  t.alike(await native.makePostRequest.call(daemon, '/info', { a: 1 }), {
    via: 'makeRequest',
    args: ['/info', 'POST', { a: 1 }],
  });
});
