// The user's ML-KEM-512 identity key pair, used by the DM handshake (hugin-network/dm, through
// src/services/hugin/dm.js).
//
// Storage: react-native-keychain, generic password under the service 'kem-identity', as
// `${secretKeyHex}|${publicKeyHex}` (3264 and 1600 hex characters). The entry is the same one
// earlier versions of the app wrote, so an existing identity is kept.
//
// `kemIdentity()` is the one place a key pair is made: it reads the entry and, only when there is
// none (or it cannot be parsed), makes a key pair and writes it. A failed read rejects, so a new
// identity never replaces one that could not be read. Concurrent callers share one load.

import * as Keychain from 'react-native-keychain';
import { generateKemKeypair, uintToHex } from 'hugin-crypto';

const KEYCHAIN_SERVICE = 'kem-identity';
const KEYCHAIN_USERNAME = 'kem-identity';

const PUBLIC_KEY_HEX = 1600; // 800 bytes
const SECRET_KEY_HEX = 3264; // 1632 bytes
const HEX_RE = /^[0-9a-f]+$/i;

/** The key pair as hex strings, the form hugin-network/dm's loadKemIdentity / saveKemIdentity use. */
export interface KemIdentityHex {
  publicKey: string;
  secretKey: string;
}

function isHex(value: unknown, length: number): value is string {
  return typeof value === 'string' && value.length === length && HEX_RE.test(value);
}

/** Parses the Keychain value; null when it is not `${secretKeyHex}|${publicKeyHex}`. */
function parseStored(password: unknown): KemIdentityHex | null {
  if (typeof password !== 'string') return null;
  const parts = password.split('|');
  if (parts.length !== 2) return null;
  const [secretKey, publicKey] = parts;
  if (!isHex(secretKey, SECRET_KEY_HEX) || !isHex(publicKey, PUBLIC_KEY_HEX)) return null;
  return { publicKey: publicKey.toLowerCase(), secretKey: secretKey.toLowerCase() };
}

/**
 * Reads the stored key pair: null when there is no entry or it cannot be parsed. Rejects when the
 * Keychain read fails.
 */
export async function readKemIdentity(): Promise<KemIdentityHex | null> {
  const creds = await Keychain.getGenericPassword({ service: KEYCHAIN_SERVICE });
  if (!creds) return null;
  const parsed = parseStored(creds.password);
  if (!parsed) console.warn('[identity] stored ML-KEM identity cannot be parsed');
  return parsed;
}

/** Writes the key pair to the Keychain entry. Rejects when the write fails. */
export async function saveKemIdentity(identity: KemIdentityHex): Promise<void> {
  if (!isHex(identity?.publicKey, PUBLIC_KEY_HEX) || !isHex(identity?.secretKey, SECRET_KEY_HEX)) {
    throw new Error('malformed ML-KEM identity');
  }
  await Keychain.setGenericPassword(
    KEYCHAIN_USERNAME,
    `${identity.secretKey.toLowerCase()}|${identity.publicKey.toLowerCase()}`,
    { service: KEYCHAIN_SERVICE, accessible: Keychain.ACCESSIBLE.ALWAYS },
  );
}

let loaded: KemIdentityHex | null = null;
let loading: Promise<KemIdentityHex> | null = null;

async function loadOrMake(): Promise<KemIdentityHex> {
  const stored = await readKemIdentity();
  if (stored) return stored;
  const kp = generateKemKeypair();
  const made = { publicKey: uintToHex(kp.publicKey), secretKey: uintToHex(kp.secretKey) };
  try {
    await saveKemIdentity(made);
  } catch (e) {
    // The key pair is used for this session; contacts redo the handshake after a restart.
    console.error('[identity] ML-KEM identity not saved:', e);
  }
  return made;
}

/**
 * The key pair (hex): the stored one, or a new one written to the Keychain when none is stored.
 * Loaded once per process; rejects (and is tried again on the next call) when the Keychain read
 * fails.
 */
export function kemIdentity(): Promise<KemIdentityHex> {
  if (loaded) return Promise.resolve(loaded);
  if (!loading) {
    loading = loadOrMake().then(
      (identity) => {
        loaded = identity;
        loading = null;
        return identity;
      },
      (err) => {
        loading = null;
        throw err;
      },
    );
  }
  return loading;
}

/**
 * Loads the key pair at start (made on first launch). Never rejects: a failed Keychain read is
 * logged and the DM code tries again when it needs the key pair.
 */
export async function loadOrCreateIdentity(): Promise<KemIdentityHex | null> {
  try {
    return await kemIdentity();
  } catch (e) {
    console.warn('[identity] ML-KEM identity not loaded:', e);
    return null;
  }
}

/** Test-only: forget the loaded key pair so the next call reads the Keychain again. */
export function _resetCache(): void {
  loaded = null;
  loading = null;
}
