// Copyright (C) 2018, Zpalmtree
// Copyright (c) 2026, The Kryptokrona Developers
//
// Please see the included LICENSE file for more information.

'use strict';

/*
 * The wallet's crypto hooks (wallet-config.js, wallet.js, lib/rpc.js) on kryptokrona-crypto's
 * native module KryptokronaCrypto (Rust crypto core, C++ Turbo Native Module, autolinked).
 * Every export keeps its name, arguments and result shape. getWalletSyncData (networking) stays
 * on the app's own platform module NativeModules.TurtleCoin.
 */

import { NativeModules } from 'react-native';
import { TransactionInput } from 'kryptokrona-wallet-backend-js';
import {
  nativeCrypto,
  processBlockOutputs as nativeProcessBlockOutputs,
  findPowShare as nativeFindPowShare,
} from 'kryptokrona-crypto';

function crypto() {
  if (!nativeCrypto) {
    throw new Error('KryptokronaCrypto native module not linked');
  }
  return nativeCrypto;
}

/* { private_key, public_key } */
export async function generateDeterministicSubwalletKeys(
  basePrivateKey,
  walletIndex,
) {
  return crypto().generateDeterministicSubwalletKeys(basePrivateKey, walletIndex);
}

/* { private_key, public_key } */
export async function generateKeys() {
  return crypto().generateKeys();
}

export async function cnFastHash(hashInput) {
  return crypto().cn_fast_hash(hashInput);
}

export async function cnTurtleLiteSlowHashV2(hashInput) {
  return crypto().cn_turtle_lite_slow_hash_v2(hashInput);
}

/* { job_id: '', nonce, result, hashes_performed, threads } when a share was found,
   { hashes_performed, threads } when not, null for unusable input */
export async function findPowShare(
  blobHex,
  targetHex,
  startNonce,
  maxAttempts,
  nonceTagBits,
  nonceTagValue,
) {
  return nativeFindPowShare(
    blobHex,
    targetHex,
    startNonce,
    maxAttempts,
    nonceTagBits || 0,
    nonceTagValue || 0,
  );
}

export async function secretKeyToPublicKey(secretKey) {
  return crypto().secretKeyToPublicKey(secretKey);
}

export async function scReduce32(scalar) {
  return crypto().scReduce32(scalar);
}

export async function checkKey(key) {
  return crypto().checkKey(key);
}

export async function hashToEllipticCurve(hash) {
  return crypto().hashToEllipticCurve(hash);
}

export async function generateSignature(message, publicKey, privateKey) {
  return crypto().generateSignature(message, publicKey, privateKey);
}

export async function checkSignature(message, publicKey, signature) {
  return crypto().checkSignature(message, publicKey, signature);
}

export async function hashToScalar(hash) {
  return crypto().hashToScalar(hash);
}

export async function underivePublicKey(derivation, index, outputKey) {
  return crypto().underivePublicKey(derivation, index, outputKey);
}

export async function generateKeyImage(publicEphemeral, privateEphemeral) {
  return crypto().generateKeyImage(publicEphemeral, privateEphemeral);
}

export async function deriveSecretKey(
  derivation,
  outputIndex,
  privateSpendKey,
) {
  return crypto().deriveSecretKey(derivation, outputIndex, privateSpendKey);
}

export async function derivePublicKey(derivation, outputIndex, publicSpendKey) {
  return crypto().derivePublicKey(derivation, outputIndex, publicSpendKey);
}

export async function generateKeyDerivation(
  transactionPublicKey,
  privateViewKey,
) {
  return crypto().generateKeyDerivation(transactionPublicKey, privateViewKey);
}

export async function generateRingSignatures(
  transactionPrefixHash,
  keyImage,
  inputKeys,
  privateKey,
  realIndex,
) {
  return crypto().generateRingSignatures(
    transactionPrefixHash,
    keyImage,
    inputKeys,
    privateKey,
    realIndex,
  );
}

export async function checkRingSignature(
  transactionPrefixHash,
  keyImage,
  publicKeys,
  signatures,
) {
  return crypto().checkRingSignature(
    transactionPrefixHash,
    keyImage,
    publicKeys,
    signatures,
  );
}

/* Transaction version 2 (fork 14): view tags and single-key CLSAG signatures */

/* Two lowercase hex characters: the first byte of
   cn_fast_hash("view_tag" || derivation || varint(outputIndex)) */
export async function deriveViewTag(derivation, outputIndex) {
  return crypto().deriveViewTag(derivation, outputIndex);
}

/* { c1, s } with one response in s per ring member. The ring is in transaction order
   (ascending global index, each member once); alpha '' and decoyResponses [] draw fresh
   randomness, otherwise the signature is deterministic (decoy responses in consumption
   order s_{l+1} .. s_{n-1}, s_0 .. s_{l-1}) */
export async function clsagSign(
  prefixHash,
  ring,
  privateEphemeral,
  realOutputIndex,
  alpha,
  decoyResponses,
) {
  return crypto().clsagSign(
    prefixHash,
    ring,
    privateEphemeral,
    realOutputIndex,
    alpha || '',
    decoyResponses || [],
  );
}

/* true or false; malformed input is false */
export async function clsagVerify(prefixHash, ring, keyImage, c1, s) {
  return crypto().clsagVerify(prefixHash, ring, keyImage, c1, s);
}

export async function makePostRequest(endpoint, body) {
  if (endpoint !== '/getwalletsyncdata') {
    return this.makeRequest(endpoint, 'POST', body);
  }

  const {
    blockCount,
    blockHashCheckpoints,
    startHeight,
    startTimestamp,
    skipCoinbaseTransactions,
  } = body;

  const protocol = this.sslDetermined ? (this.ssl ? 'https' : 'http') : 'https';
  const url = `${protocol}://${this.host}:${this.port}/getwalletsyncdata`;

  /* This is being executed within the Daemon module, so we can get access
       to it's class with `this` */
  let data = await NativeModules.TurtleCoin.getWalletSyncData(
    blockHashCheckpoints,
    startHeight,
    startTimestamp,
    blockCount,
    skipCoinbaseTransactions,
    url,
  );

  if (data.error) {
    if (this.sslDetermined) {
      throw new Error(data.error);
    }

    /* Ssl failed, lets try http */
    data = await NativeModules.TurtleCoin.getWalletSyncData(
      blockHashCheckpoints,
      startHeight,
      startTimestamp,
      blockCount,
      this.config.scanCoinbaseTransactions,
      `http://${this.host}:${this.port}/getwalletsyncdata`,
    );

    if (data.error) {
      throw new Error(data.error);
    }

    try {
      data = JSON.parse(data);
    } catch (err) {
      throw new Error(err);
    }
  }

  try {
    data = JSON.parse(data);
  } catch (err) {
    throw new Error(err);
  }

  return data;
}

export async function processBlockOutputs(
  block,
  privateViewKey,
  spendKeys,
  isViewWallet,
  processCoinbaseTransactions,
) {
  /* Numbers above Number.MAX_SAFE_INTEGER are capped (see capIntToSafeValue) */
  capIntToSafeValue(block);

  const nativeSpendKeys = spendKeys.map(([publicKey, privateKey]) => {
    return {
      publicKey: publicKey,
      privateKey: privateKey,
    };
  });

  const inputs = await nativeProcessBlockOutputs(
    block,
    privateViewKey,
    nativeSpendKeys,
    isViewWallet,
    processCoinbaseTransactions,
  );

  /* The coinbase transaction (first in the result when processed) and the others */
  const transactions = block.coinbaseTransaction
    ? [block.coinbaseTransaction, ...block.transactions]
    : block.transactions;

  const jsInputs = inputs.map((data) => {
    const tx = transactions.find(
      (t) => t.hash === data.input.parentTransactionHash,
    );

    const spendHeight = 0;

    const globalIndex =
      data.input.globalOutputIndex === -1
        ? undefined
        : data.input.globalOutputIndex;

    const input = new TransactionInput(
      data.input.keyImage,
      data.input.amount,
      block.blockHeight,
      tx.transactionPublicKey,
      data.input.transactionIndex,
      globalIndex,
      data.input.key,
      spendHeight,
      tx.unlockTime,
      data.input.parentTransactionHash,
    );

    return [data.publicSpendKey, input];
  });

  return jsInputs;
}

/* Numbers in the block are capped to Number.MAX_SAFE_INTEGER, the largest integer
   JavaScript represents exactly (the scan reads amounts and indexes as integers) */
function capIntToSafeValue(object) {
  Object.keys(object).forEach(function (element) {
    /* Recurse if this element is also an object (null has no keys) */
    if (object[element] !== null && typeof object[element] === 'object') {
      capIntToSafeValue(object[element]);
    } else if (
      typeof object[element] === 'number' &&
      object[element] > Number.MAX_SAFE_INTEGER
    ) {
      object[element] = Number.MAX_SAFE_INTEGER;
    }
  });
}
