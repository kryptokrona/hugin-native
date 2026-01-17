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
import { setMessages } from '../../services/bare/contacts';

import { CallFloater } from '@/components';
import { Alert, Linking } from 'react-native';
import { RootStackParamList } from '@/types';
import { SplashScreen } from '@/screens';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { navigationRef } from '@/contexts';

import { fadeScreenTransition } from '@/styles';
import { parseHuginUrl } from '@/utils';

const Stack = createNativeStackNavigator();

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['hugin://'],
  config: {
    screens: {
      [Stacks.MainStack]: {
        screens: {
          [MainScreens.GroupChatScreen]: {
            path: 'chat/:roomKey/:name',
            parse: {
              roomKey: String,
              name: decodeURIComponent,
            },
          },
          [MainScreens.MessageScreen]: {
            path: 'message/:roomKey/:name',
            parse: {
              roomKey: String,
              name: decodeURIComponent,
            },
          },
          [MainScreens.GroupChatScreen + 'Call']: {
            path: 'call/:roomKey/:name',
            exact: true,
            parse: {
              roomKey: String,
              name: decodeURIComponent,
            },
          },
        },
      },
    },
  },
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
  const [minTimeElapsed, setMinTimeElapsed] = useState(started);
  const [navigationReady, setNavigationReady] = useState(false);
  const [mainStackReady, setMainStackReady] = useState(false);
  const pendingLink = useGlobalStore((state) => state.pendingLink);

  useEffect(() => {
    if (navigationReady && mainStackReady && pendingLink) {
      navigateFromUrl(pendingLink);
      // useGlobalStore().resetPendingLink();
    }
  },[navigationReady, mainStackReady, pendingLink]);

  function navigateFromUrl(url: string) {
  if (!navigationRef.isReady()) return;

  const parsed = parseHuginUrl(url);
  if (!parsed) {
    console.warn('Failed to parse URL:', url);
  };

  console.log('Navigating from URL:', parsed);

  switch (parsed.type) {
    case 'message':
      setMessages(parsed.params.roomKey, 0);
      navigationRef.navigate(MainScreens.MessageStack, {
        screen: MainScreens.MessageScreen,
        params: parsed.params,
      });
      break;

    case 'chat':
      navigationRef.navigate(MainScreens.GroupStack, {
        screen: MainScreens.GroupChatScreen,
        params: parsed.params,
      });
      break;

    case 'call':
      navigationRef.navigate(Stacks.MainStack, {
        screen: MainScreens.GroupChatScreen,
        params: { ...parsed.params, call: true },
      });
      break;

    default:
      console.warn('Unknown deep link type:', parsed.type);
  }
}


  useEffect(() => {
    if (!started) {
      const timer = setTimeout(() => {
        setMinTimeElapsed(true);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [started]);

  useEffect(() => {
    Linking.getInitialURL().then(url => {
      if (url) useGlobalStore().setPendingLink(url);
    });

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
      <NavigationContainer 
      ref={navigationRef} 
      linking={authenticated ? linking : undefined}
      onReady={() => {
        console.log('Navigation is ready');
        setNavigationReady(true);
      }}
      >
        {currentCallRoom.length > 0 && <CallFloater />}
        
        <Stack.Navigator screenOptions={{ headerShown: false, ...fadeScreenTransition }}>
          {displaySplash ? (
            <Stack.Screen name="SplashScreen" component={SplashScreen} />
          ) : authenticated ? (
            <Stack.Screen 
            name={Stacks.MainStack} 
            component={MainNavigator} 
            listeners={{
            focus: () => {
              console.log('MainStack mounted');
              setMainStackReady(true);
            },
          }}/>
          ) : (
            <Stack.Screen name={Stacks.AuthStack} component={AuthNavigator} />
          )}
        </Stack.Navigator>

      </NavigationContainer>
    </GestureHandlerRootView>
  );
};
