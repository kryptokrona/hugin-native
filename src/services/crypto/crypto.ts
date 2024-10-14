import tweetnacl from 'tweetnacl';

import { loadAccount } from '@/services';

const hexToUint = (hexString: string) =>
  new Uint8Array(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));

export function naclHash(val: string) {
  const hash = tweetnacl.hash(hexToUint(val));
  return hash.toString();
}

export function randomKey() {
  return Buffer.from(tweetnacl.randomBytes(32)).toString('hex');
}

export function newKeyPair() {
  const { publicKey, secretKey } = tweetnacl.sign.keyPair();

  return {
    publicKey: Buffer.from(publicKey).toString('hex'),
    secretKey: Buffer.from(secretKey).toString('hex'),
  };
}

export async function signMessage(message: string) {
  const keys = await loadAccount();
  const secret = hexToUint(keys.secretKey);
  const sig = tweetnacl.sign.detached(hexToUint(message), secret);
  return Buffer.from(sig).toString('hex');
}
