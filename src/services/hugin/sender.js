import { Wallet } from '../services/kryptokrona';
import {
  generateKeys,
  generateKeyDerivation,
  cnFastHash,
} from '../services/NativeTest';
import { Address } from 'kryptokrona-utils';
import naclUtil from 'tweetnacl-util';
import { MessageSync } from './syncer';
import * as NaclSealed from 'tweetnacl-sealed-box';
import { hexToUint } from '../services/utils';
import { keychain } from '../services/bare/crypto';
import { nonceFromTimestamp } from '../services/bare';

let optimized = false;

//***TODO fix save sent message here in this file*/

export async function send_message(message, receiver, beam = false) {
  //Assert address length
  if (receiver.length !== 163) {
    console.log('Error: Address too long/short');
    return;
  }
  if (message.length === 0) {
    console.log('Error: No message to send');
    return;
  }

  //Split address and check history
  let address = receiver.substring(0, 99);
  let messageKey = receiver.substring(99, 163);
  let has_history = await check_history(messageKey, address);
  if (!beam_this) {
    let balance = await check_balance();
    if (!balance) {
      console.log('Error: No balance to send with');
      return;
    }
  }

  let payload_hex;
  const seal = has_history ? false : true;

  payload_hex = await encrypt_hugin_message(message, messageKey, seal, address);
  //Choose subwallet with message inputs
  let messageSubWallet = Wallet.active.getAddresses()[1];

  if (!beam) {
    let result = await Wallet.active.sendTransactionAdvanced(
      [[messageSubWallet, 1000]], // destinations,
      3, // mixin
      { fixedFee: 1000, isFixedFee: true }, // fee
      undefined, //paymentID
      [messageSubWallet], // subWalletsToTakeFrom
      undefined, // changeAddresss
      true, // relayToNetwork
      false, // sneedAll
      Buffer.from(payload_hex, 'hex'),
    );
    if (result.success) {
      //save_message(sentMsg);
      optimize_message_inputs();
      optimized = true;
    } else {
      let error = {
        message: `Failed to send, please wait a couple of minutes.`,
        name: 'Error',
        hash: Date.now(),
      };
      optimized = false;
      optimize_message_inputs(true);
      console.log(
        `Error: Failed to send transaction: ${result.error.toString()}`,
      );
      console.log('Error: ', error);
    }
  } else if (beam) {
    send_beam_message(sendMsg, address);
  }

  //TODO save message
}

async function encrypt_hugin_message(
  message,
  messageKey,
  sealed = false,
  toAddr,
) {
  let timestamp = Date.now();
  let my_address = Wallet.address;
  const addr = await Address.fromAddress(toAddr);
  const [privateSpendKey, privateViewKey] = Wallet.privateKeys();
  let xkr_private_key = privateSpendKey;
  let box;

  //Create the view tag using a one time private key and the receiver view key
  const keys = await generateKeys();
  const toKey = addr.m_keys.m_viewKeys.m_publicKey;
  const outDerivation = await generateKeyDerivation(toKey, keys.private_key);
  const hashDerivation = await cnFastHash(outDerivation);
  const viewTag = hashDerivation.substring(0, 2);

  if (sealed) {
    let signature = await Wallet.sign(message, xkr_private_key);
    let payload_json = {
      from: my_address,
      k: Buffer.from(keychain.getKeyPair().publicKey).toString('hex'),
      msg: message,
      s: signature,
    };
    let payload_json_decoded = naclUtil.decodeUTF8(
      JSON.stringify(payload_json),
    );
    box = new NaclSealed.sealedbox(
      payload_json_decoded,
      nonceFromTimestamp(timestamp),
      hexToUint(messageKey),
    );
  } else if (!sealed) {
    console.log('Has history, not using sealedbox');
    let payload_json = { from: my_address, msg: message };
    let payload_json_decoded = naclUtil.decodeUTF8(
      JSON.stringify(payload_json),
    );

    box = nacl.box(
      payload_json_decoded,
      nonceFromTimestamp(timestamp),
      hexToUint(messageKey),
      keychain.getKeyPair().secretKey,
    );
  }
  //Box object
  let payload_box = {
    box: Buffer.from(box).toString('hex'),
    t: timestamp,
    txKey: keys.public_key,
    vt: viewTag,
  };
  // Convert json to hex
  let payload_hex = toHex(JSON.stringify(payload_box));
  return payload_hex;
}

async function send_beam_message() {
  console.log('Implement code : Beam this');
}
async function check_history(messageKey) {
  //Check history
  if (MessageSync.known_keys.indexOf(messageKey) > -1) {
    return true;
  } else {
    MessageSync.known_keys.push(messageKey);
    return false;
  }
}

const check_balance = async () => {
  try {
    let [munlockedBalance, mlockedBalance] = await Wallet.active.getBalance();

    if (munlockedBalance < 11) {
      console.log('Error: Not enough unlocked funds.');
      return false;
    }
  } catch (err) {
    console.log('Error:', err);
    return false;
  }
  return true;
};

async function optimize_message_inputs(force = false) {
  let [mainWallet, messageSubWallet] = Wallet.active.getAddresses();
  const [walletHeight, localHeight, networkHeight] =
    await Wallet.active.getSyncStatus();

  let inputs = await Wallet.active.subWallets.getSpendableTransactionInputs(
    [messageSubWallet],
    networkHeight,
  );

  if (inputs.length > 25 && !force) {
    optimized = true;
    return;
  }

  if (optimized) {
    return;
  }

  let payments = [];
  let i = 0;
  /* User payment */
  while (i <= 49) {
    payments.push([messageSubWallet, 1000]);
    i += 1;
  }

  let result = await Wallet.active.sendTransactionAdvanced(
    payments, // destinations,
    3, // mixin
    { fixedFee: 1000, isFixedFee: true }, // fee
    undefined, //paymentID
    [mainWallet], // subWalletsToTakeFrom
    undefined, // changeAddress
    true, // relayToNetwork
    false, // sneedAll
    undefined,
  );

  if (result.success) {
    optimized = true;

    // reset_optimize(); TODO** set timer? or wait for optimize tx to return?

    let optimizeMessage = {
      message: 'Your wallet is creating message inputs, please wait',
      name: 'Optimizing',
      hash: parseInt(Date.now()),
      key: mainWallet,
      optimized: true,
    };

    // Hugin.send('sent_tx', sent);
    console.log('Optimize completed: ', optimizeMessage);
    return true;
  } else {
    optimized = false;

    let error = {
      message: 'Optimize failed',
      name: 'Optimizing wallet failed',
      hash: parseInt(Date.now()),
      key: mainWallet,
    };
    console.log('Error:', error);
    return false;
  }
}
