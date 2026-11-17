// The DM crypto of the app: one DmCrypto from hugin-network/dm per wallet, shared by the syncer
// (node pool entries and DM swarm payloads, syncer.js), the push handler (pushnotifications.ts)
// and the wallet's send path (wallet.js). Payload layout and handshake: hugin-network README,
// "Wire format › DM payloads" and "hugin-network/dm".
//
// Host hooks:
//   identity            the wallet's primary address and the user's display name
//   sign                the primary address's spend key signature (Wallet.sign(message, true))
//   verify              Wallet.verify (the spend public key of the address)
//   keyDerivation       generate_key_derivation(publicKey, the wallet's private view key)
//   load/saveContactCrypto  the contact_crypto table (src/services/bare/sqlite.ts)
//   load/saveKemIdentity    the Keychain entry 'kem-identity' (identity.ts)
//
// `hugin-network/dm` is a subpath of the package's "exports" map; metro.config.js resolves it for
// Metro (package exports are off there for every other import).

import * as huginCrypto from 'hugin-crypto';
import { DmCrypto, STATUS } from 'hugin-network/dm';
import { generateKeyDerivation } from '../NativeTest';
import { loadContactCrypto, saveContactCrypto } from '../bare/sqlite';
import { kemIdentity, saveKemIdentity } from './identity';

export const DM_STATUS = STATUS;

/** The hooks DmCrypto calls, over `wallet` (an ActiveWallet). `name()` gives the display name. */
export function dmHost(wallet, { name } = {}) {
  return {
    identity: () => ({
      address: wallet.address,
      name: typeof name === 'function' ? name() || '' : '',
    }),
    sign: (message) => wallet.sign(message, true),
    verify: (message, address, signature) => wallet.verify(message, address, signature),
    keyDerivation: (publicKey) => generateKeyDerivation(publicKey, wallet.privateKeys()[1]),
    loadContactCrypto: (address) => loadContactCrypto(address),
    saveContactCrypto: (address, state) => saveContactCrypto(address, state),
    loadKemIdentity: () => kemIdentity(),
    saveKemIdentity: (identity) => saveKemIdentity(identity),
    log: (level, msg, data) => console.log(`[dm] ${level}: ${msg}`, data === undefined ? '' : data),
  };
}

let current = null; // { wallet, address, options, dm }

/**
 * The DmCrypto of `wallet`, made on the first call and again when the wallet's address changed
 * (another wallet was loaded). `options.name`: a function returning the display name.
 */
export function startDm(wallet, options = {}) {
  if (current && current.wallet === wallet && current.address === wallet.address) {
    return current.dm;
  }
  const dm = new DmCrypto({ crypto: huginCrypto, host: dmHost(wallet, options) });
  current = { wallet, address: wallet.address, options, dm };
  return dm;
}

/** The current wallet's DmCrypto, or null before a wallet started one. */
export function dmCrypto() {
  if (!current) return null;
  if (current.address !== current.wallet.address) {
    return startDm(current.wallet, current.options);
  }
  return current.dm;
}

/** Forgets the DmCrypto (wallet reset). */
export function stopDm() {
  current = null;
}
