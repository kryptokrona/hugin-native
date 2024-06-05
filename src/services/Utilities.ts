// // Copyright (C) 2018, Zpalmtree
// //
// // Please see the included LICENSE file for more information.

// import moment from 'moment';

// import 'moment/locale/de';
// import 'moment/locale/sv';
// import 'moment/locale/tr';
// import 'moment/locale/zh-cn';
// import 'moment/locale/nb';
// import { Platform, ToastAndroid, Alert } from 'react-native';

// import {
//   validateAddresses,
//   WalletErrorCode,
//   validatePaymentID,
// } from 'kryptokrona-wallet-backend-js';
// import Qs from 'query-string';

// import { config, globals } from '@/config';

// import { toAtomic } from './Fee';

// export const delay = (ms: number) =>
//   new Promise((resolve) => setTimeout(resolve, ms));

// export const toastPopUp = (message: string, short: boolean = true) => {
//   if (Platform.OS !== 'ios') {
//     ToastAndroid.show(message, short ? ToastAndroid.SHORT : ToastAndroid.LONG);
//   }
// };

// // TODO other solution
// // export const navigateWithDisabledBack = (route: string, routeParams: object) => StackActions.reset({
// //   index: 0,
// //   actions: [
// //     NavigationActions.navigate({
// //       routeName: route,
// //       params: routeParams,
// //     }),
// //   ],
// // });

// // TODO tsx component
// // export function prettyPrintUnixTimestamp(timestamp) {
// //   return <Moment locale={globals.language} element={Text} unix fromNow>{timestamp}</Moment>
// // }

// export const prettyPrintDate2 = (timestamp: number) => {
//   const date = new Date(timestamp * 1000);
//   return date.toLocaleString(globals.language);
// };

// export const prettyPrintDate = (date?: moment.Moment) => {
//   const currentDate = date || moment();
//   if (moment().year() === currentDate.year()) {
//     return currentDate.format('D MMM, HH:mm');
//   }
//   return currentDate.format('D MMM, YYYY HH:mm');
// };

// export const getApproximateBlockHeight = (date: Date) => {
//   const difference =
//     (date.getTime() - config.chainLaunchTimestamp.getTime()) / 1000;
//   const blockHeight = Math.floor(difference / config.blockTargetTime);
//   return blockHeight < 0 ? 0 : blockHeight;
// };

// export const dateToScanHeight = (date: moment.Moment) => {
//   const jsDate = date.toDate();
//   const now = new Date();
//   return getApproximateBlockHeight(jsDate > now ? now : jsDate);
// };

// export const getArrivalTime = (timeUnitTranslation: string[]) => {
//   const minutes = config.blockTargetTime >= 60;
//   return `${Math.ceil(config.blockTargetTime / (minutes ? 60 : 1))} ${
//     timeUnitTranslation[minutes ? 0 : 1]
//   }`;
// };

// export const handleURI = async (data: any, navigation: any) => {
//   console.log(data);

//   if (data.url) {
//     const params = Qs.parse(data.url.replace('xkr://', ''));

//     if (params.board) {
//       console.log(params.board);
//       navigation.navigate('BoardsHome', { board: params.board });
//       return;
//     }

//     if (params.group) {
//       const groupObject = globals.groups.find(
//         (group) => group.key === params.group,
//       );
//       if (groupObject) {
//         console.log(groupObject);
//         navigation.navigate('GroupChatScreen', {
//           group: { group: groupObject.group, key: groupObject.key },
//         });
//       }
//       return;
//     }

//     if (params.istip) {
//       const newPayee = {
//         address: params.address,
//         nickname: params.name,
//         paymentID: params.paymentid,
//       };
//       const result = {
//         error: undefined,
//         payee: newPayee,
//         suggestedAction: 'Transfer',
//         valid: true, // temp added
//       };
//       console.log(params, result);
//       if (!result.valid) {
//         Alert.alert('Cannot send transaction', result.error, [{ text: 'OK' }]);
//       } else {
//         navigation.navigate('ChoosePayee');
//         navigation.navigate('Transfer', { ...result });
//       }
//       return;
//     }

//     if (params.address && params.name) {
//       navigation.navigate('ChatScreen', {
//         payee: {
//           address: params.address,
//           nickname: params.name,
//           paymentID: params.paymentID,
//         },
//       });
//       return;
//     }

//     handleURI(data.url, navigation);
//   } else if (!data.startsWith('xkr://SEKR')) {
//     return;
//   }

//   const result = await parseURI(data);
//   if (!result.valid) {
//     Alert.alert('Cannot send transaction', result.error, [{ text: 'OK' }]);
//   } else {
//     navigation.navigate('ChoosePayee');
//     navigation.navigate(result.suggestedAction, { ...result });
//   }
// };

// export const parseURI = async (qrData: string) => {
//   if (qrData.startsWith(config.uriPrefix)) {
//     const data = qrData.replace(config.uriPrefix, '');
//     const index = data.indexOf('?') === -1 ? data.length : data.indexOf('?');
//     const address = data.substring(0, index);
//     const params = Qs.parse(data.substring(index));
//     const amount = params.amount ? Number(params.amount) : undefined;
//     const { name } = params;
//     const paymentID = params.paymentid;

//     if (paymentID) {
//       const pidError = validatePaymentID(paymentID as string); // temp - probably correct
//       if (
//         pidError.errorCode !== WalletErrorCode.SUCCESS ||
//         (address.length === config.integratedAddressLength &&
//           paymentID.length !== 0)
//       ) {
//         return { error: 'QR Code is invalid', valid: false };
//       }
//     }

//     const addressError = await validateAddresses([address], true, config);
//     if (addressError.errorCode !== WalletErrorCode.SUCCESS) {
//       return { error: 'QR Code is invalid', valid: false };
//     }

//     if (!name) {
//       return {
//         address,
//         paymentID: paymentID || '',
//         suggestedAction: 'NewPayee',
//         valid: true,
//       };
//     }

//     const newPayee = { address, nickname: name, paymentID: paymentID || '' };
//     const existingPayee = globals.payees.find((p) => p.nickname === name);
//     if (
//       existingPayee &&
//       (existingPayee.address !== newPayee.address ||
//         existingPayee.paymentID !== newPayee.paymentID)
//     ) {
//       return {
//         address,
//         amount,
//         paymentID: paymentID || '',
//         suggestedAction: 'NewPayee',
//         valid: true,
//       };
//     }

//     if (!existingPayee) {
//       globals.addPayee(newPayee);
//     }

//     return !amount
//       ? { payee: newPayee, suggestedAction: 'Transfer', valid: true }
//       : { amount, payee: newPayee, suggestedAction: 'Confirm', valid: true };
//   }

//   const addressError = await validateAddresses([qrData], true, config);
//   if (addressError.errorCode !== WalletErrorCode.SUCCESS) {
//     return { error: 'QR code is invalid', valid: false };
//   }

//   return { address: qrData, suggestedAction: 'NewPayee', valid: true };
// };

// export const validAmount = (
//   amount: string,
//   unlockedBalance: number,
// ): [boolean, string] => {
//   if (!amount) {
//     return [false, ''];
//   }

//   amount = amount.replace(/,/g, '');
//   const numAmount = Number(amount);

//   if (isNaN(numAmount)) {
//     return [false, 'Amount is not a number!'];
//   }

//   const atomicAmount = Math.floor(toAtomic(numAmount));
//   if (atomicAmount < 1) {
//     return [false, 'Amount is below minimum send!'];
//   }

//   if (atomicAmount > unlockedBalance) {
//     return [false, 'Not enough funds available!'];
//   }

//   return [true, ''];
// };

// export const prettyPrintAmountMainScreen = (amount: number): string => {
//   const [integerPart, decimalPart] = (amount / 10 ** config.decimalPlaces)
//     .toFixed(5)
//     .split('.');

//   if (parseInt(integerPart) > 100000) {
//     return integerPart;
//   } else if (parseInt(integerPart) < 1000) {
//     return `${integerPart}.${decimalPart}`;
//   } else {
//     return integerPart?.slice(0, -3);
//   }
// };
