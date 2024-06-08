// import { useEffect } from 'react';

// import { Alert } from 'react-native';

// import { useNavigation } from '@react-navigation/native';
// import { WalletBackend } from 'kryptokrona-wallet-backend-js';

// import { ScreenLayout, XKRLogo } from '@/components';
// import { config, globals } from '@/config';
// import { delay, haveWallet, loadWallet } from '@/services';
// import {
//   AuthScreens,
//   AuthStackNavigationType,
//   MainScreens,
//   MainStackNavigationType,
// } from '@/types';

// import { Authenticate } from './authenticate';

// const fail = (msg: string) => {
//   globals.logger.addLogMessage(msg);

//   Alert.alert('Failed to open wallet', msg, [{ text: 'OK' }]);
// };

// const tryLoadWallet = async (mainNavigation: any) => {
//   if (globals.wallet !== undefined) {
//     mainNavigation.navigate(MainScreens.MainScreen);
//     return;
//   }

//   const [walletData, dbError] = await loadWallet();

//   if (dbError) {
//     fail(dbError as any);
//     return;
//   }

//   const [wallet, walletError] = await WalletBackend.loadWalletFromJSON(
//     globals.getDaemon(),
//     walletData as string,
//     config,
//   );

//   if (walletError) {
//     await fail('Error loading wallet: ' + walletError);
//   } else {
//     globals.wallet = wallet;
//     mainNavigation.navigate(MainScreens.MainScreen);
//   }
// };

// export const SplashScreen: React.FC = () => {
//   const navigation = useNavigation<AuthStackNavigationType>();
//   const mainNavigation = useNavigation<MainStackNavigationType>();

//   useEffect(() => {
//     const init = async () => {
//       const hasWallet = await haveWallet();

//       await delay(2000);

//       if (hasWallet) {
//         Authenticate(
//           navigation,
//           'to unlock your account',
//           tryLoadWallet(mainNavigation),
//           true,
//         );
//       } else {
//         navigation.navigate(AuthScreens.WalletOptionScreen);
//         navigation.reset({
//           index: 0,
//           routes: [{ name: AuthScreens.WalletOptionScreen }],
//         });
//         // navigation.dispatch(
//         //   navigateWithDisabledBack(AuthScreens.WalletOptionScreen),
//         // );
//       }
//     };

//     init();
//   }, [navigation]);

//   return (
//     <ScreenLayout>
//       <XKRLogo />
//     </ScreenLayout>
//   );
// };
