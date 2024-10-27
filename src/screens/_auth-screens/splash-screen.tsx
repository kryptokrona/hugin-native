import { useEffect } from 'react';

import { useNavigation } from '@react-navigation/native';

import { ScreenLayout, XKRLogo } from '@/components';
import { AuthScreens, MainScreens } from '@/config';
import { init, useAppStoreState, useUserStore } from '@/services';
import type { AuthStackNavigationType, MainStackNavigationType } from '@/types';

export const SplashScreen: React.FC = () => {
  //   const navigation = useNavigation<AuthStackNavigationType>();
  const authNavigation = useNavigation<AuthStackNavigationType>();
  const appNavigation = useNavigation<MainStackNavigationType>();
  const isHydrated = useAppStoreState((state) => state._hasHydrated);
  const user = useUserStore((state) => state.user);

  async function _init() {
    await init();
  }

  useEffect(() => {
    if (isHydrated.preferences && isHydrated.user && isHydrated.theme) {
      // Async storage ninitialized, proceed to screens
      if (user?.address) {
        _init();
        // If current user we can skip create user
        appNavigation.navigate(MainScreens.MainScreen);
      } else {
        // User should navigate to create screen to generate adress, nickname and such and then intialize bare
        authNavigation.navigate(AuthScreens.CreateProfileScreen);
      }
    }
  }, [isHydrated]);

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
