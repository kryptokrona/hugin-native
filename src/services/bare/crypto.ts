// RN-side crypto helpers — kept intentionally tiny.
//
// All real crypto (PM encrypt/decrypt, push encrypt/decrypt, room secretbox,
// account keypair generation) lives in Bare with hugin-crypto + sodium-native.
// What stays here is just bytes-shuffling polyfilled by `react-native-crypto`
// plus thin wrappers around two Bare RPCs.

import { hexToUint } from '../../services/utils';
import { randomBytes, createHash } from 'crypto';
import { create_account_keypair, sha512_hex } from 'lib/native';

/**
 * 24-byte nonce derived from a timestamp. Matches the desktop + Bare scheme
 * exactly so boxes encrypted on either client are decryptable by the other.
 */
export function nonceFromTimestamp(tmstmp: number) {
  let nonce = hexToUint(String(tmstmp));
  while (nonce.length < 24) {
    const tmp = Array.from(nonce);
    tmp.push(0);
    nonce = Uint8Array.from(tmp);
  }
  return nonce;
}

/**
 * SHA-512 over hex bytes, returned in the comma-separated-bytes shape the
 * swarm topic derivation expects. Byte-identical to the old tweetnacl.hash
 * output so existing swarm topics keep resolving to the same peers.
 *
 * Bare can compute this via `sha512_hex` RPC; we use the local `crypto`
 * polyfill so this stays synchronous (some callers are sync).
 */
export function naclHash(val: string): string {
  const buf = createHash('sha512').update(Buffer.from(hexToUint(val))).digest();
  return Array.from(buf).join(',');
}

/** 32 random bytes, hex. */
export function randomKey(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Account identity Ed25519 keypair. Was tweetnacl.sign.keyPair() before;
 * now generated in Bare with sodium so the JS keychain has no tweetnacl.
 * Used once during onboarding (createUserAddress).
 */
export async function newKeyPair(): Promise<{ publicKey: string; secretKey: string }> {
  return await create_account_keypair();
}
