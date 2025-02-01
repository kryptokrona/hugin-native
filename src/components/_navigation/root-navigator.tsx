import { AuthNavigator, MainNavigator } from './_stacks';
import { LinkingOptions, NavigationContainer } from '@react-navigation/native';
import { MainScreens, Stacks } from '@/config';
import React, { useEffect, useState } from 'react';
import {
  useAppStoreState,
  useGlobalStore,
  usePreferencesStore,
  useUserStore,
} from '@/services';

import { Linking } from 'react-native';
import { RootStackParamList } from '@/types';
import { SplashScreen } from '@/screens';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

const linking: LinkingOptions<RootStackParamList> = {
  config: {
    screens: {
      [Stacks.MainStack]: {
        screens: {
          [MainScreens.AddGroupScreen]: ':name/:roomKey',
        },
      },
    },
  },
  prefixes: ['hugin://'],
};

export const RootNavigator = () => {
  const hydrated = useAppStoreState((state) => state._hasHydrated);
  const authenticated = useGlobalStore((state) => state.authenticated);
  const user = useUserStore((state) => state.user);
  const authMethod = usePreferencesStore(
    (state) => state.preferences?.authMethod,
  );
  const [displaySplash, setDisplaySplash] = useState(true);
  useEffect(() => {
    const handleDeepLink = (e: { url: string }) => {
      // console.log('Linking', e.url); // TODO
    };

    setTimeout(() => {
      setDisplaySplash(false);
    }, 1000);

    Linking.addEventListener('url', handleDeepLink);
  }, []);

  if (
    (!hydrated.preferences || !hydrated.user || !hydrated.theme) &&
    displaySplash
  ) {
    return (
      <NavigationContainer>
        <SplashScreen />
      </NavigationContainer>
    );
  }

  let initialRouteName = Stacks.AuthStack;
  if (
    authenticated &&
    authMethod &&
    user?.address &&
    user.address.length >= 64
  ) {
    initialRouteName = Stacks.MainStack;
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name={Stacks.AuthStack}
          component={AuthNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={Stacks.MainStack}
          component={MainNavigator}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
