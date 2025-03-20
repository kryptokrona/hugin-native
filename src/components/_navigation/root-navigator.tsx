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

import { CallFloater } from '@/components';

import { Linking } from 'react-native';
import { RootStackParamList } from '@/types';
import { SplashScreen } from '@/screens';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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
  const currentCall = useGlobalStore((state) => state.currentCall);
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
    <GestureHandlerRootView style={{ flex: 1 }}>
    <NavigationContainer linking={linking}>
      {currentCall.room.length > 0 && (
        <CallFloater currentCall={currentCall} />
      )}
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
    </GestureHandlerRootView>
  );
};
