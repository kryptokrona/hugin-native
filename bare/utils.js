const sodium = require('sodium-native');
const b4a = require('b4a');

//Generic sealed boxes for the `get_sealed_box` / `decrypt_sealed_box` RPCs.
function encrypt_sealed_box(pk, data) {
  const pub = b4a.from(pk, 'hex');
  const m = b4a.from(data, 'utf-8');
  const cipher = b4a.alloc(m.length + sodium.crypto_box_SEALBYTES);
  sodium.crypto_box_seal(cipher, m, pub);
  return b4a.toString(cipher, 'hex');
}

function decrypt_sealed_box(data) {
  const { skHex, pkHex, cipherHex } = data;
  const sk = b4a.from(skHex, 'hex'); // secret key
  const pk = b4a.from(pkHex, 'hex'); // public key
  const cipher = b4a.from(cipherHex, 'hex');
  if (cipher.length <= sodium.crypto_box_SEALBYTES) return 'fail';

  const message = b4a.alloc(cipher.length - sodium.crypto_box_SEALBYTES);

  const success = sodium.crypto_box_seal_open(message, cipher, pk, sk);

  if (!success) {
    return 'fail';
  }

  return b4a.toString(message, 'utf-8');
}

module.exports = {
  encrypt_sealed_box,
  decrypt_sealed_box,
};
