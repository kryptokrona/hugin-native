import tweetnacl from 'tweetnacl';

import { loadAccount } from './sqlite';

import { hexToUint } from '../../services/utils';
import { Wallet } from '../kryptokrona';
import { generateDeterministicSubwalletKeys } from 'services/NativeTest';

export const keychain = {
  getKeyPair() {
    const privateSpendKey = Wallet.spendKey();
    return keychain.getNaclKeys(privateSpendKey);
  },

  getMsgKey() {
    const naclPubKey = keychain.getKeyPair().publicKey;
    return Buffer.from(naclPubKey).toString('hex');
  },

  getNaclKeys(privateSpendKey: string) {
    const secretKey = hexToUint(privateSpendKey);
    const keyPair = tweetnacl.box.keyPair.fromSecretKey(secretKey);
    return keyPair;
  },
};

export function nonceFromTimestamp(tmstmp: number) {
  let nonce = hexToUint(String(tmstmp));

  while (nonce.length < tweetnacl.box.nonceLength) {
    const tmp_nonce = Array.from(nonce);

    tmp_nonce.push(0);

    nonce = Uint8Array.from(tmp_nonce);
  }

  return nonce;
}

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

// export async function getPrivKey() {
//   const keys = await loadAccount();
//   console.log('Got keys', keys);
//   return keys.secretKey;
// }
