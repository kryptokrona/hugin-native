// // Copyright (C) 2018, Zpalmtree
// //
// // Please see the included LICENSE file for more information.

// import Identicon from 'identicon.js';
// import { Address, Crypto, CryptoNote } from 'kryptokrona-utils';
// // import PushNotification from 'react-native-push-notification';
// import * as Keychain from 'react-native-keychain';
// import nacl from 'tweetnacl';
// import * as NaclSealed from 'tweetnacl-sealed-box';
// import naclUtil from 'tweetnacl-util';

// import { config, globals } from '@/config';
// import { FromPayee } from '@/types';

// import {
//   emptyKnownTXs,
//   updateGroupMessage,
//   updateMessage,
//   savePreferencesToDatabase,
//   getGroupName,
//   saveGroupMessage,
//   groupMessageExists,
//   getHistory,
//   saveToDatabase,
//   loadPayeeDataFromDatabase,
//   saveMessage,
//   messageExists,
//   saveKnownTransaction,
// } from './Database';

// /**
//  * Save wallet in background
//  */
// async function backgroundSave() {
//   globals.logger.addLogMessage('Saving wallet...');

//   try {
//     await saveToDatabase(globals.wallet);
//     globals.logger.addLogMessage('Save complete.');
//   } catch (err) {
//     globals.logger.addLogMessage('Failed to background save: ' + err);
//   }
// }
// const xkrUtils = new CryptoNote();
// const crypto = new Crypto();

// import { expandSdpOffer } from './SDPParser';
// import { delay, toastPopUp } from './Utilities';

// let optimizing = false;

// export async function getBestNode(ssl = true): Promise<any> {
//   console.log('HERE 1');
//   let recommended_node;

//   try {
//     await globals.updateNodeList();
//   } catch (e) {
//     console.error('Error updating node list:', e);
//   }

//   let ssl_nodes = [];
//   if (ssl) {
//     console.log('HERE 2');
//     ssl_nodes = globals.daemons.filter((node) => node.ssl);
//   } else {
//     ssl_nodes = globals.daemons.filter((node) => !node.ssl);
//   }

//   ssl_nodes = ssl_nodes.sort(() => 0.5 - Math.random());

//   console.log('HERE 3');
//   for (const this_node of ssl_nodes) {
//     const nodeURL = `${this_node.ssl ? 'https://' : 'http://'}${
//       this_node.url
//     }:${this_node.port}/info`;
//     console.log(`Attempting to fetch from ${nodeURL}`);
//     try {
//       const controller = new AbortController();
//       const timeoutId = setTimeout(() => controller.abort(), 1000);

//       const resp = await fetch(nodeURL, {
//         method: 'GET',
//         signal: controller.signal,
//       });

//       clearTimeout(timeoutId);
//       console.log('HERE 4', resp.status);

//       if (resp.ok) {
//         recommended_node = this_node;
//         console.log('Found recommended node:', recommended_node);
//         return this_node;
//       } else {
//         console.log('Fetch failed with status:', resp.status);
//       }
//     } catch (e) {
//       console.error('Fetch error:', e);
//     }
//   }
//   console.log('HERE 5');

//   if (recommended_node === undefined) {
//     console.log('HERE 6');
//     const recommended_non_ssl_node = await getBestNode(false);
//     return recommended_non_ssl_node;
//   }
// }

// export async function getBestCache(onlyOnline = true) {
//   if (globals.preferences.autoPickCache != 'true') {
//     return;
//   }

//   console.log('Getting best cache..');

//   let recommended_cache;

//   await globals.updateNodeList();

//   // const cache_requests = [];

//   const caches = globals.caches.slice();
//   caches.sort((_a, _b) => 0.5 - Math.random());
//   caches.unshift({ url: globals.preferences.cache });

//   for (const cache in caches) {
//     const this_cache = caches[cache];
//     const cacheURL = `${this_cache.url}/api/v1/info`;
//     console.log('Trying ', this_cache);
//     try {
//       const resp = await fetch(
//         cacheURL,
//         {
//           method: 'GET',
//         },
//         3000,
//       );
//       if (!resp.ok) {
//         continue;
//       }
//       recommended_cache = this_cache;
//       const json = await resp.json();
//       console.log(json);
//       if (json.status == 'online' && onlyOnline) {
//         console.log(this_cache);
//         globals.preferences.cache = recommended_cache.url;
//         return this_cache;
//       } else {
//         globals.preferences.cache = recommended_cache.url;
//         return this_cache;
//       }
//     } catch (e) {
//       console.log(e);
//     }
//   }

//   toastPopUp('No online APIs!');
//   globals.APIOnline = false;
//   return false;
// }

// export function resyncMessage24h() {
//   globals.knownTXs = [];
//   globals.lastMessageTimestamp = Date.now() - 24 * 60 * 60 * 1000;
//   globals.lastDMTimestamp = Date.now() - 24 * 60 * 60 * 1000;
//   globals.notificationQueue = [];
//   globals.initalSyncOccurred = false;
//   emptyKnownTXs();
// }

// function trimExtra(extra: any) {
//   try {
//     const timestamp = extra.t;
//     if (timestamp) {
//       return extra;
//     }
//   } catch (err) {
//     console.log(err);
//   }

//   try {
//     const parsed = JSON.parse(extra);
//     return parsed;
//   } catch (e) {
//     console.log(e);
//   }

//   try {
//     const payload = fromHex(extra.substring(66));
//     const payload_json = JSON.parse(payload);
//     return payload_json;
//   } catch (e) {
//     console.log(e);
//   }

//   try {
//     return JSON.parse(fromHex(Buffer.from(extra.substring(78)).toString()));
//   } catch (e) {
//     console.log(e);
//   }
// }

// // PushNotification.configure({
// //   onNotification: handleNotification,

// //   permissions: {
// //     alert: true,
// //     badge: true,
// //     sound: true,
// //   },

// //   popInitialNotification: true,

// //   requestPermissions: true,
// // });
// // function handleNotification(notification: any) {
// //   if (notification.transaction != undefined) {
// //     return;
// //   }

// //   let payee = notification.userInfo;

// //   if (payee.address) {
// //     payee = new URLSearchParams(payee).toString();

// //     const url = 'xkr://'.replace('address=', '') + payee;

// //     Linking.openURL(url);
// //   } else if (payee.key) {
// //     const url = `xkr://?group=${payee.key}`;

// //     Linking.openURL(url);
// //   } else {
// //     const url = 'xkr://?board=' + payee;

// //     Linking.openURL(url);
// //   }
// // }

// export function intToRGB(int: number) {
//   if (typeof int !== 'number') {
//     throw new Error('intToRGB: Expected a number');
//   }
//   if (Math.floor(int) !== int) {
//     throw new Error('intToRGB: Expected an integer');
//   }
//   if (int < 0 || int > 16777215) {
//     throw new Error('intToRGB: Expected an integer between 0 and 16777215');
//   }

//   const red = int >> 16;
//   const green = (int - (red << 16)) >> 8;
//   const blue = int - (red << 16) - (green << 8);

//   return {
//     blue: blue,
//     green: green,
//     red: red,
//   };
// }

// export function hashCode(str: any) {
//   const hash = Math.abs(str.hashCode()) * 0.007812499538;
//   return Math.floor(hash);
// }

// export function get_avatar(hash: string, size: number) {
//   // Displays a fixed identicon until user adds new contact address in the input field
//   if (hash.length < 15) {
//     hash =
//       'SEKReYanL2qEQF2HA8tu9wTpKBqoCA8TNb2mNRL5ZDyeFpxsoGNgBto3s3KJtt5PPrRH36tF7DBEJdjUn5v8eaESN2T5DPgRLVY';
//   }
//   // Get custom color scheme based on address
//   const rgb = intToRGB(hashCode(hash));
//   // Options for avatar
//   const options = {
//     // rgba black
//     background: [rgb.red / 10, rgb.green / 10, rgb.blue / 10, 0] as number[],
//     foreground: [rgb.red, rgb.green, rgb.blue, 255],
//     // 420px square
//     format: 'png',

//     // rgba white
//     margin: 0.2,
//     // 20% margin
//     size: size, // use SVG instead of PNG
//   };

//   // create a base64 encoded SVG
//   return 'data:image/png;base64,' + new Identicon(hash, options).toString();
// }

// export function handle_links(message: string) {
//   const geturl = new RegExp(
//     '(^|[ \t\r\n])((ftp|http|https|gopher|mailto|news|nntp|telnet|wais|file|prospero|aim|webcal):(([A-Za-z0-9$_.+!*(),;/?:@&~=-])|%[A-Fa-f0-9]{2}){3,}(#([a-zA-Z0-9][a-zA-Z0-9$_.+!*(),;/?:@&~=%-]*))?([A-Za-z0-9$_+!*();/?:~-]))',
//     'g',
//   );

//   // Instantiate attachments
//   let youtube_links = '';
//   let image_attached = '';

//   // Find links
//   const links_in_message = message.match(geturl);

//   // Supported image attachment filetypes
//   const imagetypes = ['.png', '.jpg', '.gif', '.webm', '.jpeg', '.webp'];

//   // Find magnet links
//   //let magnetLinks = /(magnet:\?[^\s\"]*)/gmi.exec(message);

//   //message = message.replace(magnetLinks[0], "");

//   if (links_in_message) {
//     for (let j = 0; j < links_in_message.length; j++) {
//       if (
//         links_in_message[j].match(/youtu/) ||
//         links_in_message[j].match(/y2u.be/)
//       ) {
//         // Embeds YouTube links
//         message = message.replace(links_in_message[j], '');
//         const [lastSegment] = links_in_message[j].split('/').slice(-1);
//         const [embed_code] = lastSegment.split('=').slice(-1);

//         youtube_links +=
//           '<div style="position:relative;height:0;padding-bottom:42.42%"><iframe src="https://www.youtube.com/embed/' +
//           embed_code +
//           '?modestbranding=1" style="position:absolute;width:80%;height:100%;left:10%" width="849" height="360" frameborder="0" allow="autoplay; encrypted-media"></iframe></div>';
//       } else if (imagetypes.indexOf(links_in_message[j].substr(-4)) > -1) {
//         // Embeds image links
//         message = message.replace(links_in_message[j], '');
//         const image_attached_url = links_in_message[j];
//         image_attached =
//           '<img class="attachment" src="' + image_attached_url + '" />';
//       } else {
//         // Embeds other links
//         message = message.replace(
//           links_in_message[j],
//           '<a target="_new" href="' +
//             links_in_message[j] +
//             '">' +
//             links_in_message[j] +
//             '</a>',
//         );
//       }
//     }
//     return [message, youtube_links, image_attached];
//   } else {
//     return [message, '', ''];
//   }
// }

// // function componentToHex(c) {
// //   const hex = c.toString(16);
// //   return hex.length == 1 ? '0' + hex : hex;
// // }

// // function rgbToHex(r, g, b) {
// //   return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
// // }

// export function getBoardColors(board: any) {
//   const board_color = intToRGB(hashCode(board));

//   // board_color = `rgb(${board_color.red},${board_color.green},${board_color.blue})`;
//   const boardColorStr = `rgb(${board_color.red},${board_color.green},${board_color.blue})`;

//   const comp_color = `rgb(${board_color.red + 50},${board_color.green + 50},${
//     board_color.blue + 50
//   })`;
//   return [boardColorStr, comp_color];
// }

// export function nonceFromTimestamp(tmstmp: any) {
//   let nonce = hexToUint(String(tmstmp));

//   while (nonce.length < nacl.box.nonceLength) {
//     const tmp_nonce = Array.from(nonce);

//     tmp_nonce.push(0);

//     nonce = Uint8Array.from(tmp_nonce);
//   }

//   return nonce;
// }

// export function hexToUint(hexString: any) {
//   return new Uint8Array(
//     hexString.match(/.{1,2}/g).map((byte: any) => parseInt(byte, 16)),
//   );
// }

// export function getKeyPair() {
//   // return new Promise((resolve) => setTimeout(resolve, ms));
//   const [privateSpendKey, _privateViewKey] =
//     globals.wallet.getPrimaryAddressPrivateKeys();
//   const secretKey = hexToUint(privateSpendKey);
//   const keyPair = nacl.box.keyPair.fromSecretKey(secretKey);
//   return keyPair;
// }

// export function getKeyPairOld() {
//   // return new Promise((resolve) => setTimeout(resolve, ms));
//   const [privateSpendKey, _privateViewKey] =
//     globals.wallet.getPrimaryAddressPrivateKeys();
//   const secretKey = naclUtil.decodeUTF8(privateSpendKey.substring(1, 33));
//   const keyPair = nacl.box.keyPair.fromSecretKey(secretKey);
//   return keyPair;
// }

// export function toHex(str: string, hex?: string) {
//   try {
//     hex = unescape(encodeURIComponent(str))
//       .split('')
//       .map(function (v) {
//         return v.charCodeAt(0).toString(16);
//       })
//       .join('');
//   } catch (e) {
//     hex = str;
//   }
//   return hex;
// }

// async function optimizeTimer() {
//   await delay(600 * 1000);
//   optimizing = false;
// }

// export async function optimizeMessages(nbrOfTxs: any, force = false) {
//   if (!globals?.wallet) {
//     return false;
//   }

//   console.log('Optimizing messages..', force);

//   if (globals.wallet.subWallets.getAddresses().length === 1) {
//     const [privateSpendKey, _privateViewKey] =
//       globals.wallet.getPrimaryAddressPrivateKeys();
//     const deterministicPrivateKey =
//       await crypto.generateDeterministicSubwalletKeys(privateSpendKey, 1);
//     const [_address, error] = await globals.wallet.importSubWallet(
//       deterministicPrivateKey.private_key,
//     );

//     if (error) {
//       return false;
//     }
//   }

//   if (optimizing === true) {
//     return 1;
//   }

//   const [_walletHeight, _localHeight, networkHeight] =
//     globals.wallet.getSyncStatus();

//   const [mainWallet, subWallet] = globals.wallet.subWallets.getAddresses();

//   const inputs = await globals.wallet.subWallets.getSpendableTransactionInputs(
//     [subWallet],
//     networkHeight,
//   );

//   if (inputs.length > 8 && !force) {
//     globals.logger.addLogMessage(
//       `Already have ${inputs.length} available inputs. Skipping optimization.`,
//     );
//     return 2;
//   }

//   const payments = [];
//   let i = 0;

//   /* User payment */
//   while (i < 15) {
//     payments.push([subWallet, 2000]);

//     i += 1;
//   }

//   const result = await globals.wallet.sendTransactionAdvanced(
//     payments, // destinations,
//     3, // mixin
//     { fixedFee: 1000, isFixedFee: true }, // fee
//     undefined, //paymentID
//     [mainWallet], // subWalletsToTakeFrom
//     undefined, // changeAddress
//     true, // relayToNetwork
//     false, // sneedAll
//     undefined,
//   );

//   if (result.success) {
//     globals.logger.addLogMessage(`Optimized ${payments.length} messages.`);
//     optimizeTimer();
//     optimizing = true;
//     return true;
//   }

//   return false;
// }

// export async function sendMessageWithHuginAPI(payload_hex: any) {
//   if (globals.preferences.cacheEnabled !== 'true') {
//     globals.preferences.cacheEnabled = 'true';
//     savePreferencesToDatabase(globals.preferences);
//     toastPopUp(
//       'API sending enabled. Please try again. You can turn this off on the settings page.',
//     );
//     return { success: false };
//   }

//   const cacheURL = globals.preferences.cache
//     ? globals.preferences.cache
//     : config.defaultCache;

//   console.log('Sending messag with', cacheURL);

//   const response = await fetch(`${cacheURL}/api/v1/posts`, {
//     body: JSON.stringify({ payload: payload_hex }),
//     // or 'PUT'
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     method: 'POST',
//   });
//   const response_json = await response.json();
//   return response_json;
// }

// export async function cacheSync(_first = true, page = 1) {
//   globals.logger.addLogMessage('Syncing group message with API.. 💌');

//   if (globals.groups.length == 0) {
//     return;
//   }

//   return new Promise((resolve, _reject) => {
//     // if(first) {
//     //   latest_board_message_timestamp = parseInt(await getLatestGroupMessage()) + 1;
//     // }

//     //console.log('Last message was:', new Date(latest_board_message_timestamp).toISOString().replace('T', ' ').replace(/\.\d+Z$/, ''))

//     //if (globals.lastMessageTimestamp > latest_board_message_timestamp)
//     const latest_board_message_timestamp = globals.lastMessageTimestamp;
//     globals.logger.addLogMessage(
//       `Syncing group messages from ${new Date(latest_board_message_timestamp)
//         .toISOString()
//         .replace('T', ' ')
//         .replace(/\.\d+Z$/, '')} to ${new Date(Date.now())
//         .toISOString()
//         .replace('T', ' ')
//         .replace(/\.\d+Z$/, '')}.. 💌`,
//     );
//     const cacheURL = globals.preferences.cache
//       ? globals.preferences.cache
//       : config.defaultCache;
//     console.log(
//       `${cacheURL}/api/v1/posts-encrypted-group?from=${
//         latest_board_message_timestamp / 1000
//       }&to=${Date.now() / 1000}&size=50&page=` + page,
//     );
//     fetch(
//       `${cacheURL}/api/v1/posts-encrypted-group?from=${
//         latest_board_message_timestamp / 1000
//       }&to=${Date.now() / 1000}&size=50&page=` + page,
//     )
//       .then((response) => response.json())
//       .then(async (json) => {
//         const items = json.encrypted_group_posts;
//         if (!items.length) {
//           resolve(true);
//           return;
//         }
//         globals.logger.addLogMessage(
//           `Found ${json.total_items} group messages.. 💌`,
//         );
//         for (const item in items) {
//           globals.logger.addLogMessage(
//             `Syncing group message ${
//               parseInt(item) + (Number(json.current_page) - 1) * 50
//             }/${json.total_items} 💌`,
//           );

//           globals.lastSyncEvent = Date.now();

//           if (await groupMessageExists(items[item].tx_timestamp)) {
//             continue;
//           }
//           if (globals.knownTXs.indexOf(items[item].tx_hash) !== -1) {
//             continue;
//           }

//           // const groupMessage = await getMessage({
//           //   sb: items[item].tx_sb,
//           //   t: items[item].tx_timestamp,
//           //   hash: items[item].tx_hash
//           // });

//           saveKnownTransaction(items[item].tx_hash);
//         }
//         if (json.total_pages == 0) {
//           resolve(true);
//         }

//         if (json.current_page < json.total_pages) {
//           await cacheSync(false, page + 1);
//           resolve(true);
//         } else {
//           console.log('Returning..');
//           globals.lastMessageTimestamp = Date.now();
//           resolve(true);
//         }
//       });
//   });
// }

// export async function cacheSyncDMs(_first = true, page = 1) {
//   if (globals.payees.length == 0) {
//     return;
//   }

//   return new Promise((resolve, _reject) => {
//     try {
//       console.log('Global timestamp', globals.lastDMTimestamp);

//       // if(first) {
//       //   latest_board_message_timestamp = parseInt(await getLatestMessage()) + 1;
//       // }

//       // if (globals.lastDMTimestamp > latest_board_message_timestamp)

//       const latest_board_message_timestamp = globals.lastDMTimestamp;

//       const cacheURL = globals.preferences.cache
//         ? globals.preferences.cache
//         : config.defaultCache;

//       console.log(
//         `${cacheURL}/api/v1/posts-encrypted?from=${
//           latest_board_message_timestamp / 1000
//         }&to=${Date.now() / 1000}&size=50&page=` + page,
//       );
//       fetch(
//         `${cacheURL}/api/v1/posts-encrypted?from=${
//           latest_board_message_timestamp / 1000
//         }&to=${Date.now() / 1000}&size=50&page=` + page,
//       )
//         .then((response) => response.json())
//         .then(async (json) => {
//           console.log(json);
//           console.log('We have items');
//           const items = json.encrypted_posts;
//           globals.logger.addLogMessage(`Found ${json.total_items} DMs 💌`);
//           if (!items.length) {
//             resolve(true);
//             return;
//           }
//           console.log('Looping items');
//           for (const item in items) {
//             globals.logger.addLogMessage(
//               `Syncing private message ${
//                 parseInt(item) + (Number(json.current_page) - 1) * 50
//               }/${json.total_items} 💌`,
//             );
//             globals.lastSyncEvent = Date.now();

//             if (await messageExists(items[item].tx_timestamp)) {
//               continue;
//             }
//             if (globals.knownTXs.indexOf(items[item].tx_hash) !== -1) {
//               continue;
//             }
//             console.log('Item doesnt exist');
//             // const this_json = {
//             //   box: items[item].tx_box,
//             //   hash: items[item].tx_hash,
//             //   t: items[item].tx_timestamp,
//             // };
//             // const message = await getMessage(
//             //   this_json,
//             //   this_json.tx_hash,
//             //   globals.navigation,
//             // );
//             saveKnownTransaction(items[item].tx_hash);
//           }
//           if (json.total_pages == 0) {
//             resolve(true);
//           }
//           if (json.current_page < json.total_pages) {
//             await cacheSyncDMs(false, page + 1);
//             resolve(true);
//           } else {
//             globals.lastDMTimestamp = Date.now();
//             resolve(true);
//           }
//         });
//     } catch (e) {
//       console.log(e);
//     }
//   });
// }

// export async function createRoom() {
//   return await Buffer.from(nacl.randomBytes(32)).toString('hex');
// }

// export async function sendGroupsMessage(
//   message: any,
//   group: any,
//   temp_timestamp: any,
//   reply = '',
// ) {
//   console.log('reply', reply);

//   const my_address = globals.wallet.getPrimaryAddress();

//   const [privateSpendKey, _privateViewKey] =
//     globals.wallet.getPrimaryAddressPrivateKeys();

//   const signature = await xkrUtils.signMessage(message, privateSpendKey);

//   const timestamp = parseInt(temp_timestamp);

//   const nonce = nonceFromTimestamp(timestamp);

//   const message_json = {
//     g: group,
//     k: my_address,
//     m: message,
//     n: globals.preferences.nickname,
//     r: undefined,
//     s: signature,
//   };

//   if (reply) {
//     message_json.r = reply; // FIX
//   } else {
//     reply = undefined;
//   }

//   console.log(message_json);

//   const payload_unencrypted = naclUtil.decodeUTF8(JSON.stringify(message_json));

//   const secretbox = nacl.secretbox(
//     payload_unencrypted,
//     nonce,
//     hexToUint(group),
//   );

//   const payload_encrypted = {
//     sb: Buffer.from(secretbox).toString('hex'),
//     t: timestamp,
//   };

//   const payload_encrypted_hex = toHex(JSON.stringify(payload_encrypted));

//   const [_mainWallet, subWallet] = globals.wallet.subWallets.getAddresses();

//   let result = await globals.wallet.sendTransactionAdvanced(
//     [[subWallet, 1000]], // destinations,
//     3, // mixin
//     { fixedFee: 1000, isFixedFee: true }, // fee
//     undefined, //paymentID
//     [subWallet], // subWalletsToTakeFrom
//     undefined, // changeAddress
//     true, // relayToNetwork
//     false, // sneedAll
//     Buffer.from(payload_encrypted_hex, 'hex'),
//   );
//   if (!result.success) {
//     optimizeMessages(10, true);
//     try {
//       result = await sendMessageWithHuginAPI(payload_encrypted_hex);
//     } catch (err) {
//       console.log('Failed to send with Hugin API..', err);
//     }
//   } else {
//     optimizeMessages(10);
//   }
//   console.log(result);
//   if (result.success == true) {
//     //saveGroupMessage(group, 'sent', message_json.m, timestamp, message_json.n, message_json.k, reply, result.transactionHash);
//     updateGroupMessage(temp_timestamp, 'sent', result.transactionHash);
//     backgroundSave();
//     globals.lastMessageTimestamp = timestamp;
//   } else {
//     updateGroupMessage(temp_timestamp, 'failed', temp_timestamp);
//   }

//   return result;
// }

// export async function sendMessage(
//   message: any,
//   receiver: any,
//   messageKey: any,
//   temp_timestamp: any,
// ) {
//   if (message.length == 0) {
//     return;
//   }

//   const has_history = await getHistory(receiver);

//   const my_address = globals.wallet.getPrimaryAddress();

//   // const my_addresses = globals.wallet.getAddresses();

//   const timestamp = temp_timestamp;

//   let box;

//   if (!has_history) {
//     // If you haven't yet sent a message to this specific contact, send the
//     // first one with a sealed box so it can be decrypted by the recipient
//     // at now, or at a later stage.
//     // const addr = await Address.fromAddress(my_address);
//     const [privateSpendKey, _privateViewKey] =
//       globals.wallet.getPrimaryAddressPrivateKeys();
//     const xkr_private_key = privateSpendKey;
//     const signature = await xkrUtils.signMessage(message, xkr_private_key);
//     const payload_json = {
//       from: my_address,
//       k: Buffer.from(getKeyPair().publicKey).toString('hex'),
//       msg: message,
//       s: signature,
//     };
//     const payload_json_decoded = naclUtil.decodeUTF8(
//       JSON.stringify(payload_json),
//     );
//     box = new NaclSealed.secretbox( // upd
//       payload_json_decoded,
//       nonceFromTimestamp(timestamp),
//       hexToUint(messageKey),
//     );
//   } else {
//     // If you have history with this contact, it should be sent with a regular
//     // box.
//     const payload_json = { from: my_address, msg: message };

//     const payload_json_decoded = naclUtil.decodeUTF8(
//       JSON.stringify(payload_json),
//     );

//     box = nacl.box(
//       payload_json_decoded,
//       nonceFromTimestamp(timestamp),
//       hexToUint(messageKey),
//       getKeyPair().secretKey,
//     );
//   }

//   const payload_box = { box: Buffer.from(box).toString('hex'), t: timestamp };

//   // Convert json to hex
//   const payload_hex = toHex(JSON.stringify(payload_box));

//   const [_mainWallet, subWallet] = globals.wallet.subWallets.getAddresses();

//   let result = await globals.wallet.sendTransactionAdvanced(
//     [[subWallet, 1000]], // destinations,
//     3, // mixin
//     { fixedFee: 1000, isFixedFee: true }, // fee
//     undefined, //paymentID
//     [subWallet], // subWalletsToTakeFrom
//     undefined, // changeAddress
//     true, // relayToNetwork
//     false, // sneedAll
//     Buffer.from(payload_hex, 'hex'),
//   );

//   globals.logger.addLogMessage('Trying to send DM..');

//   if (!result.success) {
//     globals.logger.addLogMessage('Failed to send DM..');
//     optimizeMessages(10, true);
//     try {
//       globals.logger.addLogMessage('Trying to send DM with API..');
//       result = await sendMessageWithHuginAPI(payload_hex);
//     } catch (err) {
//       globals.logger.addLogMessage('Trying to send DM with API..');
//     }
//   } else {
//     optimizeMessages(10);
//   }

//   if (result.success) {
//     globals.logger.addLogMessage('Succeeded sending DM!');
//     if (message.substring(0, 1) == 'Δ' || message.substring(0, 1) == 'Λ') {
//       message = 'Call started';
//     }
//     if (message.substring(0, 1) == 'δ' || message.substring(0, 1) == 'λ') {
//       message = 'Call answered';
//     }
//     updateMessage(temp_timestamp, 'sent');
//     backgroundSave();
//     globals.lastMessageTimestamp = timestamp;
//   } else {
//     updateMessage(temp_timestamp, 'failed');
//   }

//   globals.updateMessages();

//   return result;
// }

// export function fromHex(hex: string, str?: string) {
//   try {
//     str = decodeURIComponent(hex.replace(/(..)/g, '%$1'));
//   } catch (e) {
//     str = hex;
//   }
//   return str;
// }

// export async function getExtra(hash: string) {
//   return new Promise((resolve, _reject) => {
//     const daemonInfo = globals.wallet.getDaemonConnectionInfo();
//     const nodeURL = `${daemonInfo.ssl ? 'https://' : 'http://'}${
//       daemonInfo.host
//     }:${daemonInfo.port}/json_rpc`;

//     globals.logger.addLogMessage('Message possibly received: ' + hash);
//     globals.logger.addLogMessage('Using rpc: ' + nodeURL);

//     fetch(nodeURL, {
//       body: JSON.stringify({
//         jsonrpc: '2.0',
//         method: 'f_transaction_json',
//         params: { hash: hash },
//       }),
//       method: 'POST',
//     })
//       .then((response) => response.json())
//       .then((json) => {
//         const data = fromHex(json.result.tx.extra);
//         resolve(data);
//       })
//       .catch((error) => globals.logger.addLogMessage(error));
//   });
// }

// async function getGroupMessage(tx: any) {
//   if (!tx.t) {
//     globals.logger.addLogMessage('Invalid message format');
//     return;
//   }

//   if (await groupMessageExists(tx.t)) {
//     globals.logger.addLogMessage('Message already exists');
//     return;
//   }

//   console.log('Trying to decrypt', tx);

//   let decryptBox = null; // temp "false"

//   const { groups } = globals;

//   let key: any;

//   let i = 0;

//   while (!decryptBox && i < groups.length) {
//     const possibleKey = groups[i].key;

//     i += 1;

//     try {
//       globals.logger.addLogMessage('Trying to decrypt with ' + possibleKey);

//       decryptBox = nacl.secretbox.open(
//         hexToUint(tx.sb),
//         nonceFromTimestamp(tx.t),
//         hexToUint(possibleKey),
//       );

//       key = possibleKey;
//     } catch (err) {
//       console.log(err);
//       globals.logger.addLogMessage('Decrypt error ' + err);
//       continue;
//     }
//   }

//   if (!decryptBox) {
//     console.log('Cannot decrypt group message!');
//     globals.logger.addLogMessage('Cannot decrypt group message!');
//     return false;
//   }

//   const message_dec = naclUtil.encodeUTF8(decryptBox);

//   globals.logger.addLogMessage('Message decoded' + message_dec);

//   const payload_json = JSON.parse(message_dec);

//   const from = payload_json.k;
//   const from_myself = from == globals.wallet.getPrimaryAddress() ? true : false;

//   globals.logger.addLogMessage('From myself?' + from_myself);
//   const received = from_myself ? 'sent' : 'received';

//   const this_addr = await Address.fromAddress(from);

//   const verified = await xkrUtils.verifyMessageSignature(
//     payload_json.m,
//     this_addr.spend.publicKey,
//     payload_json.s,
//   );

//   globals.logger.addLogMessage('Verified?' + verified);

//   const reply = payload_json?.r ? payload_json.r : '';

//   saveGroupMessage(
//     key,
//     received,
//     payload_json.m,
//     tx.t,
//     payload_json.n,
//     payload_json.k,
//     reply,
//     tx.hash,
//   );

//   const nickname = payload_json.n ? payload_json.n : 'Anonymous';

//   const group_object = globals.groups.filter((group) => {
//     return group.key === key;
//   });

//   const groupname = await getGroupName(key);

//   if (globals.activeGroup != key && !from_myself) {
//     globals.notificationQueue.push({
//       data: tx.t, //TODO Check this

//       largeIconUrl: get_avatar(from, 64),
//       //'Incoming transaction received!',
//       //message: `You were sent ${prettyPrintAmount(transaction.totalAmount(), config)}`,
//       message: payload_json.m,
//       title: `${nickname} in ${groupname}`,
//       userInfo: group_object[0],
//     });
//   }

//   return payload_json;
// }

// export async function getMessage(
//   extra: any,
//   hash: any,
//   navigation: any,
//   fromBackground = false,
// ) {
//   globals.logger.addLogMessage('Getting payees..');
//   let from_payee: FromPayee;
//   return new Promise(async (resolve, reject) => {
//     setTimeout(() => {
//       resolve('Promise timed out!');
//     }, 10000);

//     const tx = trimExtra(extra);

//     console.log('Trimmed', tx);

//     if (tx.t == undefined) {
//       resolve();
//       return;
//     }

//     if (tx.sb) {
//       if (await groupMessageExists(tx.t)) {
//         reject();
//         return;
//       }
//       if (!tx.hash) {
//         tx.hash = hash;
//       }

//       const groupMessage = await getGroupMessage(tx);
//       resolve(groupMessage);
//     }

//     // If no key is appended to message we need to try the keys in our payload_keychain
//     const { box } = tx;

//     const timestamp = tx.t;

//     if (await messageExists(timestamp)) {
//       reject();
//       return;
//     }

//     let decryptBox: any;
//     let createNewPayee = false;

//     let key = '';

//     try {
//       decryptBox = NaclSealed.secretbox.open(
//         hexToUint(box),
//         nonceFromTimestamp(timestamp),
//         getKeyPair().secretKey,
//       );
//       createNewPayee = true;
//     } catch (err) {}
//     if (!decryptBox) {
//       try {
//         decryptBox = NaclSealed.secretbox.open(
//           hexToUint(box),
//           nonceFromTimestamp(timestamp),
//           getKeyPairOld().secretKey,
//         );
//         const message_dec_temp = naclUtil.encodeUTF8(decryptBox);
//         const payload_json_temp = JSON.parse(message_dec_temp);
//         const from_temp = payload_json_temp.from;
//         const [payee] = globals.payees.filter(
//           (item) => item.address == from_temp,
//         );
//         globals.removePayee(payee.nickname, false);
//         createNewPayee = true;
//       } catch (err) {
//         console.log(err);
//       }
//     }

//     console.log('Thats cool we keep goinbg');

//     let i = 0;

//     const payees = await loadPayeeDataFromDatabase();

//     while (!decryptBox && payees && i < payees.length) {
//       const possibleKey = payees?.[i].paymentID;

//       i += 1;

//       try {
//         decryptBox = nacl.box.open(
//           hexToUint(box),
//           nonceFromTimestamp(timestamp),
//           hexToUint(possibleKey),
//           getKeyPair().secretKey,
//         );
//         key = possibleKey;
//       } catch (err) {
//         continue;
//       }
//     }

//     if (!decryptBox) {
//       console.log('No encrypted message found.. Sad!');
//       resolve();
//       return;
//     }

//     const message_dec = naclUtil.encodeUTF8(decryptBox);

//     const payload_json = JSON.parse(message_dec);

//     payload_json.t = timestamp;
//     let { from } = payload_json;
//     let from_myself = false;
//     if (from == globals.wallet.getPrimaryAddress()) {
//       from_myself = true;
//     }

//     const from_address = from;

//     // let from_payee: FromPayee;

//     if (!from_myself && payees) {
//       for (const payee of payees) {
//         if (payee.address == from) {
//           from = payee.nickname;
//           createNewPayee = false;

//           from_payee = {
//             address: from_address,
//             name: from,
//             paymentID: payee.paymentID,
//           };
//         }
//       }
//     } else if (payees && payees?.length > 0) {
//       from_payee = payees.filter((payee) => {
//         return payee.paymentID == key;
//       });
//     }

//     if (createNewPayee && !from_myself) {
//       const payee = {
//         address: payload_json.from,
//         nickname: payload_json.from.substring(0, 12) + '..',
//         paymentID: payload_json.k,
//       };

//       globals.addPayee(payee);

//       from_payee = payee;
//     }

//     let received = 'received';

//     if (from_myself) {
//       payload_json.from = from_payee.address;
//       received = 'sent';
//     }

//     if (
//       payload_json.msg.substring(0, 1) == 'Δ' ||
//       payload_json.msg.substring(0, 1) == 'Λ'
//     ) {
//       console.log('Call received!');

//       let missed;

//       Date.now() - payload_json.t < 180000 ? (missed = false) : (missed = true);

//       console.log('Call is missed? ', missed);
//       console.log('What is navigation', navigation);

//       if (navigation && !missed) {
//         console.log('Navigating to dis bichh');
//         navigation.navigate('CallScreen', {
//           payee: {
//             address: from_payee.address,
//             nickname: from_payee.name,
//             paymentID: from_payee.paymentID,
//           },
//           sdp: payload_json.msg,
//         });
//       } else {
//         // use URL to
//       }
//       if (!from_myself && !missed) {
//         console.log('Notifying call..');
//         //   PushNotification.localNotification({
//         //     data: payload_json.t,
//         //     largeIconUrl: get_avatar(payload_json.from, 64),
//         //     message: missed ? 'Call missed' : 'Call received',
//         //     title: from,
//         //     userInfo: {
//         //       address: from_payee.address,
//         //       nickname: from_payee.name,
//         //       paymentID: from_payee.paymentID,
//         //     },
//         //   });
//         // } else if (!from_myself && missed) {
//         //   globals.notificationQueue.push({
//         //     data: payload_json.t,

//         //     largeIconUrl: get_avatar(payload_json.from, 64),
//         //     //message: `You were sent ${prettyPrintAmount(transaction.totalAmount(), config)}`,
//         //     message: 'Call missed',
//         //     title: from,
//         //     userInfo: {
//         //       address: from_payee.address,
//         //       nickname: from_payee.name,
//         //       paymentID: from_payee.paymentID,
//         //     },
//         //   });
//       }
//       payload_json.msg = 'Call received';
//       saveMessage(payload_json.from, received, 'Call received', payload_json.t);

//       resolve(payload_json);

//       return;
//     }
//     if (
//       payload_json.msg.substring(0, 1) == 'δ' ||
//       payload_json.msg.substring(0, 1) == 'λ'
//     ) {
//       globals.sdp_answer = payload_json.msg;
//       const expanded_answer = expandSdpOffer(payload_json.msg);
//       globals.calls
//         .find((call) => call.contact == from_payee.paymentID)
//         .channel.setRemoteDescription(expanded_answer);
//       saveMessage(payload_json.from, received, 'Call answered', payload_json.t);
//       payload_json.msg = 'Call answered';
//       resolve(payload_json);
//     }

//     saveMessage(payload_json.from, received, payload_json.msg, payload_json.t);

//     if (
//       (globals.activeChat != payload_json.from && !from_myself) ||
//       (!from_myself && fromBackground)
//     ) {
//       globals.notificationQueue.push({
//         data: payload_json.t,
//         largeIconUrl: get_avatar(payload_json.from, 64),
//         message: payload_json.msg,
//         title: from,
//         userInfo: from_payee,
//       });
//     }

//     resolve(payload_json);
//   });
// }

// export const sendNotifications = async () => {
//   console.log('Sending', globals.notificationQueue);
//   if (globals.notificationQueue.length > 2) {
//     // PushNotification.localNotification({
//     //   message: `You've received ${globals.notificationQueue.length} new messages.`,
//     //   title: 'New messages received!',
//     // });
//   } else if (
//     globals.notificationQueue.length > 0 &&
//     globals.notificationQueue.length <= 2
//   ) {
//     for (const n in globals.notificationQueue) {
//       // PushNotification.localNotification({
//       //   data: globals.notificationQueue[n].data,
//       //   largeIconUrl: globals.notificationQueue[n].largeIconUrl,
//       //   message: globals.notificationQueue[n].message,
//       //   title: globals.notificationQueue[n].title,
//       //   userInfo: globals.notificationQueue[n].userInfo,
//       // });
//     }
//   }
//   globals.notificationQueue = [];
// };

// export const changeNode = async () => {
//   const node = await getBestNode();

//   globals.preferences.node = node.url + ':' + node.port + ':' + node.ssl;

//   await savePreferencesToDatabase(globals.preferences);

//   globals.wallet.swapNode(globals.getDaemon());
//   console.log('HEEREEE');
// };

// export const deletePinCode = async () => {
//   await Keychain.resetGenericPassword();
// };

// // export function initBackgroundSync() {
// //   BackgroundFetch.configure(
// //     {
// //       enableHeadless: true,
// //       forceReload: false,

// //       minimumFetchInterval: 15,

// //       requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY,

// //       startOnBoot: true,
// //       // <-- minutes (15 is minimum allowed)
// //       stopOnTerminate: false,
// //     },
// //     async () => {
// //       await backgroundSync();
// //     },
// //     (error) => {
// //       globals.logger.addLogMessage(
// //         '[js] RNBackgroundFetch failed to start: ' + error.toString(),
// //       );
// //     },
// //   );
// // }

// // export async function sendNotification(transaction: any) {
// //   // /* Don't show notifications if disabled */

// //   console.log('WTFWTFWTF');

// //   const this_addr = await Address.fromAddress(
// //     globals.wallet.getPrimaryAddress(),
// //   );

// //   const my_public_key = this_addr.spend.publicKey;

// //   const amount_received = transaction.transfers.get(my_public_key);

// //   // const payments = [];

// //   const nbrOfTxs = amount_received / 100000;

// //   console.log('Receieved ', nbrOfTxs);

// //   if (nbrOfTxs < 1) {
// //     return;
// //   }
// //   console.log(transaction);
// //   console.log(transaction.paymentID);
// //   let isTip = await boardsMessageExists(transaction.paymentID);
// //   console.log('isTip', isTip);
// //   let tippedMsg;
// //   isTip = isTip && transaction.paymentID != '';
// //   console.log('isTip2', isTip);
// //   if (isTip) {
// //     // tippedMsg = await getBoardsMessage(transaction.paymentID); // TODO Does not exist
// //   }
// //   console.log(tippedMsg);
// // const title = isTip ? 'Tip received' : 'Payment received';
// // const message = isTip
// //   ? `You just received a tip for your post "${tippedMsg[0].message}" in ${tippedMsg[0].board} worth ${nbrOfTxs} XKR`
// //   : `You just received ${nbrOfTxs} XKR`;

// // PushNotification.localNotification({ // TODO
// //   data: JSON.stringify(transaction.hash),

// //   //'Incoming transaction received!',
// //   //message: `You were sent ${prettyPrintAmount(transaction.totalAmount(), Config)}`,
// //   message: message,
// //   title: title,
// //   transaction: JSON.stringify(transaction.hash),
// // });
// // }
