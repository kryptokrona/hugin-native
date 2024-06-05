// // Copyright (C) 2018, Zpalmtree
// //
// // Please see the included LICENSE file for more information.

// import { AppState, Platform, PushNotificationIOS } from 'react-native';

// import NetInfo from '@react-native-community/netinfo';
// import { WalletBackend, LogLevel } from 'kryptokrona-wallet-backend-js';
// import PushNotification from 'react-native-push-notification';

// import { config, globals } from '@/config';

// import {
//   haveWallet,
//   loadWallet,
//   openDB,
//   loadPreferencesFromDatabase,
// } from './Database';
// // import { sendNotification } from './HuginUtilities';
// import { processBlockOutputs } from './NativeCode';

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

// const State = {
//   running: false,
//   shouldStop: false,
//   unsubscribe: () => {},
// };

// function onStateChange(state) {
//   if (state !== 'background') {
//     State.shouldStop = true;
//   }
// }

// async function handleNetInfoChange({ type }) {
//   if (globals.preferences.limitData && type === 'cellular') {
//     globals.logger.addLogMessage(
//       '[Background Sync] Network connection changed to cellular, and we are limiting data. Stopping sync.',
//     );
//     State.shouldStop = true;
//   }
// }

// /**
//  * Check background syncing is all good and setup a few vars
//  */
// async function setupBackgroundSync() {
//   /* Probably shouldn't happen... but check we're not already running. */
//   if (State.running) {
//     globals.logger.addLogMessage(
//       '[Background Sync] Background sync already running. Not starting.',
//     );
//     return false;
//   }

//   /* Not in the background, don't sync */
//   if (AppState.currentState !== 'background') {
//     globals.logger.addLogMessage(
//       '[Background Sync] Background sync launched while in foreground. Not starting.',
//     );
//     return false;
//   }

//   /* Wallet not loaded yet. Probably launching from headlessJS */
//   if (globals.wallet === undefined) {
//     const backgroundInitSuccess = await fromHeadlessJSInit();

//     if (!backgroundInitSuccess) {
//       return false;
//     }
//   }

//   const netInfo = await NetInfo.fetch();

//   if (globals.preferences.limitData && netInfo.type === 'cellular') {
//     globals.logger.addLogMessage(
//       '[Background Sync] On mobile data. Not starting background sync.',
//     );
//     return false;
//   }

//   State.unsubscribe = NetInfo.addEventListener(handleNetInfoChange);

//   AppState.addEventListener('change', onStateChange);

//   State.shouldStop = false;

//   globals.logger.addLogMessage('[Background Sync] Running background sync...');

//   return true;
// }

// /**
//  * Complete the background syncing and pull down a few vars
//  */
// export function finishBackgroundSync() {
//   AppState.removeEventListener('change', onStateChange); //TODO mysterious

//   State.unsubscribe();

//   //   BackgroundFetch.finish(BackgroundFetch.FETCH_RESULT_NEW_DATA);

//   State.running = false;

//   globals.logger.addLogMessage('[Background Sync] Background sync complete.');
// }

// async function fromHeadlessJSInit() {
//   /* See if user has previously made a wallet */
//   const hasWallet = await haveWallet();

//   if (!hasWallet) {
//     globals.logger.addLogMessage(
//       '[Background Sync] No wallet stored. Not starting background sync.',
//     );
//     return false;
//   }

//   await openDB();

//   const prefs = await loadPreferencesFromDatabase();

//   if (prefs !== undefined) {
//     globals.preferences = prefs;
//   }

//   /* Load wallet data from DB */
//   const [walletData, dbError] = await loadWallet();

//   if (dbError) {
//     globals.logger.addLogMessage(
//       '[Background Sync] Failed to load wallet. Not starting background sync.',
//     );
//     return false;
//   }

//   const [wallet, walletError] = await WalletBackend.loadWalletFromJSON(
//     globals.getDaemon(),
//     walletData,
//     config,
//   );

//   if (walletError) {
//     globals.logger.addLogMessage(
//       '[Background Sync] Failed to load wallet. Not starting background sync.',
//     );
//     return false;
//   }

//   globals.wallet = wallet;

//   globals.wallet.scanCoinbaseTransactions(
//     globals.preferences.scanCoinbaseTransactions,
//   );
//   globals.wallet.enableAutoOptimization(false);

//   /* Remove any previously added listeners to pretend double notifications */
//   globals.wallet.removeAllListeners('incomingtx');

//   globals.wallet.on('incomingtx', (transaction: any) => {
//     // sendNotification(transaction);
//   });

//   globals.wallet.setLoggerCallback((prettyMessage: any, message: any) => {
//     globals.logger.addLogMessage(message);
//   });

//   globals.wallet.setLogLevel(LogLevel.DEBUG);

//   /* Use our native C++ func to process blocks, provided we're on android */
//   /* TODO: iOS support */
//   if (Platform.OS === 'android') {
//     globals.wallet.setBlockOutputProcessFunc(processBlockOutputs);
//   }

//   PushNotification.configure({
//     onNotification: (notification) => {
//       notification.finish(PushNotificationIOS.FetchResult.NoData);
//     },

//     permissions: {
//       alert: true,
//       badge: true,
//       sound: true,
//     },

//     popInitialNotification: true,

//     requestPermissions: true,
//   });

//   return true;
// }

// /**
//  * Perform the background sync itself.
//  * Note - don't use anything with setInterval here, it won't run in the background
//  */
// // export async function backgroundSync() {
// //   if (!(await setupBackgroundSync())) {
// //     BackgroundFetch.finish(BackgroundFetch.FETCH_RESULT_NO_DATA);
// //     return;
// //   } else {
// //     State.running = true;
// //   }

// //   const startTime = new Date();

// //   /* ios only allows 30 seconds of runtime. Android allows... infinite???
// //        Since we run every 15 minutes, just set it to 14 for android.
// //        Not exactly sure on this. */
// //   const allowedRunTime = Platform.OS === 'ios' ? 25 : 60 * 14;

// //   let secsRunning = 0;

// //   /* Run for 25 seconds or until the app comes back to the foreground */
// //   while (!State.shouldStop && secsRunning < allowedRunTime) {
// //     await backgroundSyncMessages();

// //     /* Update the daemon info */
// //     await globals.wallet.internal().updateDaemonInfo();

// //     const [walletBlockCount, localDaemonBlockCount, networkBlockCount] =
// //       globals.wallet.getSyncStatus();

// //     /* Check if we're synced so we don't kill the users battery */
// //     if (
// //       walletBlockCount >= localDaemonBlockCount ||
// //       walletBlockCount >= networkBlockCount
// //     ) {
// //       globals.logger.addLogMessage(
// //         '[Background Sync] Wallet is synced. Stopping background sync.',
// //       );

// //       /* Save the wallet */
// //       saveToDatabase(globals.wallet);

// //       break;
// //     }

// //     /* Process 1000 blocks */
// //     for (let i = 0; i < 1000 / config.blocksPerTick; i++) {
// //       if (State.shouldStop) {
// //         break;
// //       }

// //       const syncedBlocks = await globals.wallet.internal().sync(false);

// //       if (!syncedBlocks) {
// //         break;
// //       }
// //     }

// //     globals.logger.addLogMessage(
// //       '[Background Sync] Saving wallet in background.',
// //     );

// //     /* Save the wallet */
// //     saveToDatabase(globals.wallet);

// //     /* Update our running time */
// //     secsRunning = (new Date() - startTime) / 1000;
// //   }

// //   finishBackgroundSync();
// // }
// //
