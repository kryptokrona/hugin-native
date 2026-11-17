if (typeof __dirname === 'undefined') global.__dirname = '/'
if (typeof __filename === 'undefined') global.__filename = ''
if (typeof process === 'undefined') {
  global.process = require('process')
} else {
  const bProcess = require('process')
  for (var p in bProcess) {
    if (!(p in process)) {
      process[p] = bProcess[p]
    }
  }
}

process.browser = false
// if (typeof Buffer === 'undefined') global.Buffer = require('buffer').Buffer

// global.location = global.location || { port: 80 }
const isDev = typeof __DEV__ === 'boolean' && __DEV__
process.env['NODE_ENV'] = isDev ? 'development' : 'production'
if (typeof localStorage !== 'undefined') {
  localStorage.debug = isDev ? '*' : ''
}

// crypto.getRandomValues first. Libraries read globalThis.crypto when they are first evaluated
// (@noble in hugin-crypto) or when they draw random bytes (the per-message key of
// hugin-network/dm), so it is set up here, in the first module index.js imports (after the `process`
// globals above, which react-native-crypto's dependencies read when they load). Hermes has no Web
// Crypto; the app's source is react-native-crypto (`crypto` in the package.json "react-native"
// field), which sets crypto.getRandomValues when it loads, on react-native-randombytes. When it
// did not set it (no `window` yet), getRandomValues is built on its randomBytes here.
function hasGetRandomValues() {
  return (
    typeof globalThis.crypto === 'object' &&
    globalThis.crypto !== null &&
    typeof globalThis.crypto.getRandomValues === 'function'
  );
}

if (!hasGetRandomValues()) {
  const rnCrypto = require('crypto');
  if (!hasGetRandomValues() && rnCrypto && typeof rnCrypto.randomBytes === 'function') {
    if (typeof globalThis.crypto !== 'object' || globalThis.crypto === null) {
      globalThis.crypto = {};
    }
    globalThis.crypto.getRandomValues = function getRandomValues(array) {
      const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
      const random = rnCrypto.randomBytes(bytes.length);
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = random[i];
      }
      return array;
    };
  }
}

if (!hasGetRandomValues()) {
  throw new Error('shim.js: crypto.getRandomValues is not available');
}
