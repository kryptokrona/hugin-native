import { useEffect } from 'react';

import { type RouteProp, useNavigation } from '@react-navigation/native';

import { ScreenLayout, XKRLogo } from '@/components';
import {
  AuthScreens,
  AuthStackParamList,
  MainScreens,
  Stacks,
  TabBar,
} from '@/types';

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

interface Props {
  route: RouteProp<AuthStackParamList, typeof AuthScreens.SplashScreen>;
}

export const SplashScreen: React.FC<Props> = () => {
  //   const navigation = useNavigation<AuthStackNavigationType>();
  const navigation = useNavigation<any>();

  useEffect(() => {
    setTimeout(() => {
      // navigation.dispatch(
      //   CommonActions.reset({
      //     index: 0,
      //     routes: [
      //       {
      //         name: Stacks.AppStack,
      //         params: { screen: MainScreens.MainScreen },
      //       },
      //     ],
      //   }),
      // );
      navigation.navigate(Stacks.AppStack, {
        params: {
          screen: MainScreens.MainScreen,
        },
        screen: TabBar.MainTab.tabName,
      });
    }, 3000);
  }, []);

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

  return (
    <ScreenLayout>
      <XKRLogo />
    </ScreenLayout>
  );
};
