// // Copyright (C) 2018, Zpalmtree
// //
// // Please see the included LICENSE file for more information.
// // TODO fix TS errors
// // eslint-disable-next-line @typescript-eslint/ban-ts-comment
// // @ts-ignore
// import { Alert, Platform } from 'react-native';

// import NetInfo from '@react-native-community/netinfo';
// import { Daemon } from 'kryptokrona-wallet-backend-js';
// import _ from 'lodash';
// import { PushNotificationObject } from 'react-native-push-notification';
// import request from 'request-promise-native';

// import {
//   deleteDB,
//   deletePinCode,
//   getBoardsMessages,
//   getBoardSubscriptions,
//   getKnownTransactions,
//   getMessage,
//   getMessages,
//   getUnreadMessages,
//   loadGroupsDataFromDatabase,
//   loadPayeeDataFromDatabase,
//   loadTransactionDetailsFromDatabase,
//   Logger,
//   makePostRequest,
//   openDB,
//   removeGroupFromDatabase,
//   removePayeeFromDatabase,
//   resyncMessage24h,
//   saveGroupToDatabase,
//   savePayeeToDatabase,
//   saveTransactionDetailsToDatabase,
//   sendNotifications,
//   setHaveWallet,
// } from '@/services';
// import type { Preferences, Payee, Group, TransactionDetail } from '@/types';

// import { config } from './config';

// import offline_cache_list from './sheets/apis.json';
// import offline_groups_list from './sheets/groups.json';
// import offline_node_list from './sheets/nodes.json';

// class Globals {
//   wallet: any;
//   pincode: any;
//   backgroundSaveTimer: any;
//   coinPrice: number;
//   syncingMessages: boolean;
//   syncingMessagesCount: number;
//   syncSkips: number;
//   preferences: Preferences;
//   payees: Payee[];
//   groups: Group[];
//   logger: Logger;
//   updatePayeeFunctions: Function[];
//   updateGroupsFunctions: Function[];
//   updateChatFunctions: Function[];
//   updateCallFunctions: Function[];
//   updateBoardsFunctions: Function[];
//   transactionDetails: TransactionDetail[];
//   daemons: any[];
//   caches: any[];
//   standardGroups: any[];
//   messages:
//     | {
//         conversation: any;
//         count: number;
//         message: any;
//         timestamp: any;
//         type: any;
//       }[]
//     | undefined;
//   boardsMessages: any[];
//   groupMessages: any[];
//   knownTXs: any[];
//   activeChat: string;
//   activeGroup: string;
//   language: string;
//   fromChat: boolean;
//   unreadMessages: { boards: number; groups: number; pms: number };
//   sdp_answer: string;
//   calls: any[];
//   stream: boolean;
//   localWebcamOn: boolean;
//   localMicOn: boolean;
//   speakerOn: boolean;
//   notificationQueue: PushNotificationObject[]; // temp added
//   lastMessageTimestamp: number;
//   lastDMTimestamp: number;
//   webSocketStatus: 'offline' | 'online';
//   socket: WebSocket | undefined;
//   initalSyncOccurred: boolean;
//   websockets: number;
//   APIOnline: boolean;
//   messagesLoaded: number;
//   lastSyncEvent: number;
//   navigation: any;
//   activeBoard: 'Home' | null;
//   boardsSubscriptions: {
//     board: any;
//     key: any;
//     unread: any;
//   }[];

//   constructor() {
//     this.wallet = undefined;
//     this.pincode = undefined;
//     this.backgroundSaveTimer = undefined;
//     this.coinPrice = 0;
//     this.syncingMessages = false;
//     this.syncingMessagesCount = 0;
//     this.syncSkips = 0;
//     this.activeBoard = null;
//     this.boardsSubscriptions = [];

//     this.preferences = {
//       authConfirmation: false,
//       authenticationMethod: 'hardware-auth',
//       autoOptimize: false,
//       autoPickCache: 'true',
//       cache: config.defaultCache,
//       cacheEnabled: 'true',
//       currency: 'usd',
//       language: 'en',
//       limitData: false,
//       nickname: 'Anonymous',
//       node: config.defaultDaemon.getConnectionString(),
//       notificationsEnabled: true,
//       scanCoinbaseTransactions: false,
//       theme: 'darkMode',
//       websocketEnabled: 'true',
//     };

//     this.payees = [];
//     this.groups = [];
//     this.logger = new Logger();
//     this.updatePayeeFunctions = [];
//     this.updateGroupsFunctions = [];
//     this.updateChatFunctions = [];
//     this.updateCallFunctions = [];
//     this.updateBoardsFunctions = [];
//     this.transactionDetails = [];
//     this.daemons = [];
//     this.caches = [];
//     this.standardGroups = [];
//     this.messages = [];
//     this.boardsMessages = [];
//     this.groupMessages = [];
//     this.knownTXs = [];
//     this.activeChat = '';
//     this.activeGroup = '';
//     this.language = 'en-US';
//     this.fromChat = false;
//     this.unreadMessages = { boards: 0, groups: 0, pms: 0 };
//     this.sdp_answer = '';
//     this.calls = [];
//     this.stream = false;
//     this.localWebcamOn = false;
//     this.localMicOn = false;
//     this.speakerOn = true;
//     this.notificationQueue = [];
//     this.lastMessageTimestamp = Date.now() - 24 * 60 * 60 * 1000;
//     this.lastDMTimestamp = Date.now() - 24 * 60 * 60 * 1000;
//     this.webSocketStatus = 'offline';
//     this.socket = undefined;
//     this.initalSyncOccurred = false;
//     this.websockets = 0;
//     this.APIOnline = false;
//     this.messagesLoaded = 0;
//     this.lastSyncEvent = Date.now();
//     this.navigation = undefined;
//   }

//   async reset() {
//     this.wallet = undefined;
//     this.pincode = undefined;
//     this.backgroundSaveTimer = undefined;
//     this.logger = new Logger();
//     this.payees = [];
//     this.groups = [];
//     //removeMessages();

//     await deleteDB();
//     await openDB();
//     await setHaveWallet(false);
//     await deletePinCode();
//     initGlobals();
//   }

//   addTransactionDetails(txDetails: TransactionDetail) {
//     this.transactionDetails.push(txDetails);
//     saveTransactionDetailsToDatabase(txDetails);
//   }

//   addPayee(payee: Payee) {
//     this.payees.push(payee);
//     savePayeeToDatabase(payee);
//     this.update();
//     this.updateMessages();
//   }

//   removePayee(nickname: string, removeMessages: boolean) {
//     _.remove(this.payees, (item) => item.nickname === nickname);
//     removePayeeFromDatabase(nickname, removeMessages);
//     this.update();
//   }

//   update() {
//     this.updatePayeeFunctions.forEach((f) => {
//       f();
//     });
//   }

//   updateGroupsFunction() {
//     this.updateGroupsFunctions.forEach((f) => {
//       f();
//     });
//   }

//   addGroup(group: Group) {
//     if (this.groups.some((g) => g.key == group.key)) {
//       console.log('Group already exists!');
//       return;
//     }
//     this.groups.push(group);
//     saveGroupToDatabase(group);
//     this.updateGroups();
//     resyncMessage24h();
//   }

//   async removeGroup(key: string, removeMessages: boolean) {
//     this.groups = this.groups.filter((item) => item.key != key);
//     await removeGroupFromDatabase(key, removeMessages);
//     console.log('Group removed from DB');
//     this.updateGroups();
//   }

//   async updateGroups() {
//     const groups = await loadGroupsDataFromDatabase();

//     if (groups !== undefined) {
//       this.groups = groups;
//     }

//     // this.groupMessages = await getGroupMessages();
//     this.updateGroupsFunction();
//   }

//   async updateMessages() {
//     this.messages = await getMessages();
//     this.updateChat();
//     const payees = await loadPayeeDataFromDatabase();

//     if (payees !== undefined) {
//       this.payees = payees;
//     }

//     this.update();
//   }

//   async updateBoardsMessages() {
//     console.log(this.activeBoard);
//     if (this.activeBoard) {
//       this.boardsMessages = await getBoardsMessages(this.activeBoard);
//     } else if (this.activeBoard === 'Home' || this.activeBoard === '') {
//       this.boardsMessages = await getBoardsMessages();
//     }
//     this.boardsSubscriptions = await getBoardSubscriptions();
//     this.updateBoards();
//   }

//   updateChat() {
//     console.log('updateChat');
//     this.updateChatFunctions.forEach((f) => {
//       f();
//     });
//   }

//   updateCall() {
//     console.log('updateCall');
//     this.updateCallFunctions.forEach((f) => {
//       f();
//     });
//   }

//   updateBoards() {
//     console.log('updateBoards');
//     this.updateBoardsFunctions.forEach((f) => {
//       f();
//     });
//   }

//   getDaemon() {
//     const [host, port, ssl] = this.preferences.node.split(':');

//     let ssl_formatted = false;
//     if (ssl == 'true') {
//       ssl_formatted = true;
//     }

//     const daemon = new Daemon(host, Number(port), false, ssl_formatted);

//     if (Platform.OS === 'android') {
//       /* Override with our native makePostRequest implementation which can
//          actually cancel requests part way through */
//       // @ts-ignore // TODO
//       daemon.makePostRequest = makePostRequest;
//     }

//     return daemon;
//   }

//   async updateNodeList() {
//     let i = 0;
//     while (config.nodeListURLs.length > i) {
//       try {
//         const data = await request({
//           json: true,
//           method: 'GET',
//           timeout: config.requestTimeout,
//           url: config.nodeListURLs[i],
//         });

//         if (data.nodes) {
//           this.daemons = data.nodes;
//           this.caches = data.apis;
//           return;
//         }
//       } catch (error) {
//         console.log(offline_node_list);
//         this.logger.addLogMessage(
//           'Failed to get node list from API: ' + error?.toString(),
//         );
//       }
//       i++;
//     }
//     this.daemons = offline_node_list.nodes;
//     this.caches = offline_cache_list.apis; // temp fix
//   }

//   async updateGroupsList() {
//     try {
//       const data = await request({
//         json: true,
//         method: 'GET',
//         timeout: config.requestTimeout,
//         url: config.groupsListURL,
//       });
//       console.log(data);
//       if (data.apis) {
//         this.standardGroups = data.groups;
//       } else {
//         this.standardGroups = offline_groups_list.groups;
//       }
//     } catch (error) {
//       console.log(offline_cache_list);
//       this.logger.addLogMessage(
//         'Failed to get groups list from API: ' + error?.toString(),
//       );
//       this.standardGroups = offline_groups_list.groups;
//     }
//   }
// }

// export const globals = new Globals();

// export function updateConnection(connection: any) {
//   if (globals.preferences.limitData && connection.type === 'cellular') {
//     globals.wallet.stop();
//   } else {
//     globals.wallet.enableAutoOptimization(false);
//     globals.wallet.start();
//   }
// }

// /* Note... you probably don't want to await this function. Can block for a while
//    if no internet. */

// export async function startWebsocket() {
//   if (globals.websockets || globals.preferences.websocketEnabled != 'true') {
//     return;
//   }

//   if (globals.preferences.cacheEnabled != 'true') {
//     return;
//   }
//   const socketURL =
//     globals.preferences.cache
//       .replace(/^http:\/\//, 'ws://')
//       .replace(/^https:\/\//, 'wss://') + '/ws';
//   globals.socket = new WebSocket(socketURL);

//   // Open connection wit Cache
//   globals.socket.onopen = () => {
//     globals.websockets++;
//     console.log('Connected 🤖');
//     globals.logger.addLogMessage('Connected to WebSocket 🤖');
//     globals.webSocketStatus = 'online';
//   };

//   globals.socket.onclose = (_e: any) => {
//     if (globals.websockets > 0) {
//       globals.websockets--;
//     }

//     globals.webSocketStatus = 'offline';
//     globals.logger.addLogMessage('Disconnected from WebSocket 🤖');
//     startWebsocket();
//   };

//   // Listen for messages
//   globals.socket.onmessage = async (e) => {
//     globals.logger.addLogMessage('Received WebSocket Message!');
//     const { data } = e;
//     globals.logger.addLogMessage(data);

//     try {
//       const json = JSON.parse(data);
//       await getMessage(json, json.hash, globals.navigation);
//       sendNotifications();
//     } catch (err) {
//       console.log(err);
//     }
//   };
// }

// export async function initGlobals() {
//   const payees = await loadPayeeDataFromDatabase();

//   if (payees !== undefined) {
//     globals.payees = payees;
//   }

//   globals.knownTXs = await getKnownTransactions();

//   const groups = await loadGroupsDataFromDatabase();

//   globals.groups = groups;

//   globals.boardsSubscriptions = await getBoardSubscriptions();

//   globals.unreadMessages = await getUnreadMessages();

//   const transactionDetails = await loadTransactionDetailsFromDatabase();

//   if (transactionDetails !== undefined) {
//     globals.transactionDetails = transactionDetails;
//   }

//   const netInfo = await NetInfo.fetch();

//   /* Start syncing */
//   if (globals.preferences.limitData && netInfo.type === 'cellular') {
//     Alert.alert(
//       'Not Syncing',
//       'You enabled data limits, and are on a limited connection. Not starting sync.',
//       [{ text: 'OK' }],
//     );
//   } else {
//     globals.wallet.enableAutoOptimization(false);
//     globals.wallet.start();
//   }

//   await globals.updateNodeList();
//   await globals.updateGroupsList();
// }
