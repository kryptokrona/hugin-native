import { StyleSheet, View } from 'react-native';

import { XKRLogo } from '@/components';

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

export const SplashScreen: React.FC = () => {
  return (
    <View style={[styles.screen, { backgroundColor: 'black' }]}>
      <XKRLogo />
    </View>
  );
};

const styles = StyleSheet.create({
  innerView: {
    flexGrow: 1,
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 20,
    paddingVertical: 4,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  screen: {
    flex: 1,
    flexGrow: 1,
  },
});
