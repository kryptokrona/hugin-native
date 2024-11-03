import { AuthNavigator, MainNavigator } from './_stacks';
import { LinkingOptions, NavigationContainer } from '@react-navigation/native';
import { MainScreens, Stacks } from '@/config';
import React, { useEffect } from 'react';
import {
  useAppStoreState,
  useGlobalStore,
  usePreferencesStore,
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
          [MainScreens.AddGroupScreen]: 'join-group/:name/:roomKey/:joining',
        },
      },
    },
  },
  prefixes: ['hugin://'],
};

export const RootNavigator = () => {
  const hydrated = useAppStoreState((state) => state._hasHydrated);
  const authenticated = useGlobalStore((state) => state.authenticated);
  const authMethod = usePreferencesStore(
    (state) => state.preferences?.authMethod,
  );
  useEffect(() => {
    const handleDeepLink = (e: { url: string }) => {
      // console.log('Linking', e.url); // TODO
    };

    Linking.addEventListener('url', handleDeepLink);
  }, []);

  if (!hydrated.preferences || !hydrated.user || !hydrated.theme) {
    return (
      <NavigationContainer>
        <SplashScreen />
      </NavigationContainer>
    );
  }

  let initialRouteName = Stacks.AuthStack;
  if (authenticated && authMethod) {
    initialRouteName = Stacks.MainStack;
  } else {
    initialRouteName = Stacks.AuthStack;
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
