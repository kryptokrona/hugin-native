import { AuthNavigator, MainNavigator } from './_stacks';
import { LinkingOptions, NavigationContainer, useNavigation } from '@react-navigation/native';
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
import { navigationRef } from '@/contexts';

import { fadeScreenTransition } from '@/styles';

const Stack = createNativeStackNavigator();

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['hugin://'],
  config: {
    screens: {
      [Stacks.MainStack]: {
        screens: {
          [MainScreens.AddGroupScreen]: ':name/:roomKey',
        },
      },
    },
  },
};

const NavigationHandler = ({ pendingLink, clearPendingLink }: { pendingLink: string | null, clearPendingLink: () => void }) => {
  const navigation = useNavigation();

  const parseDeepLink = (url: string) => {
    const match = url.match(/hugin:\/\/([^/]+)\/([^/]+)\/([^/]+)/);
    if (match) {
      const [_, path, name, roomKey] = match;
      return { path, params: { name, roomKey } };
    }
    return { path: '', params: null };
  };

  useEffect(() => {
    console.log('Opening link:', pendingLink)
    if (pendingLink) {

      navigation.navigate(MainScreens.GroupsScreen, {
        joining: true,
        link: pendingLink,
      });

      clearPendingLink();
    }
  }, [pendingLink]);

  return null;
};

export const RootNavigator = () => {
  const hydrated = useAppStoreState((state) => state._hasHydrated);
  const authenticated = useGlobalStore((state) => state.authenticated);
  const started = useGlobalStore((state) => state.started);
  const currentCallRoom = useGlobalStore((state) => state.currentCall).room;
  const user = useUserStore((state) => state.user);
  const authMethod = usePreferencesStore(
    (state) => state.preferences?.authMethod,
  );

  const [displaySplash, setDisplaySplash] = useState(!started);
  const [pendingLink, setPendingLink] = useState<string | null>(null);
  const [minTimeElapsed, setMinTimeElapsed] = useState(started);

  useEffect(() => {
    if (!started) {
      const timer = setTimeout(() => {
        setMinTimeElapsed(true);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [started]);

  useEffect(() => {
    const handleDeepLink = ({ url }: { url: string }) => {
      setPendingLink(url);  // Always store link, NavigationHandler will handle whether to act or wait.
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then((url) => {
      console.log('Initial URL:', url);
      if (url) handleDeepLink({ url });
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (started) {  
      setDisplaySplash(false);
    }
    const isHydrated = hydrated.preferences && hydrated.user && hydrated.theme;
    
    if (isHydrated && minTimeElapsed) {
      const shouldGoToMain = 
        authenticated && 
        authMethod && 
        user?.address && 
        user.address.length >= 64;
        

      if (shouldGoToMain && !started) {
        return;
      }
    }
  }, [hydrated, authenticated, authMethod, user, started, minTimeElapsed]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer ref={navigationRef} linking={authenticated ? linking : undefined}>
        {currentCallRoom.length > 0 && <CallFloater />}
        
        <Stack.Navigator screenOptions={{ headerShown: false, ...fadeScreenTransition }}>
          {displaySplash ? (
            <Stack.Screen name="SplashScreen" component={SplashScreen} />
          ) : authenticated ? (
            <Stack.Screen name={Stacks.MainStack} component={MainNavigator} />
          ) : (
            <Stack.Screen name={Stacks.AuthStack} component={AuthNavigator} />
          )}
        </Stack.Navigator>

        {authenticated && pendingLink && (
          <NavigationHandler
            pendingLink={pendingLink}
            clearPendingLink={() => setPendingLink(null)}
          />
        )}
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};
