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
import { Alert, Linking } from 'react-native';
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


// const NavigationHandler = ({ pendingLink, clearPendingLink }: { pendingLink: string | null, clearPendingLink: () => void }) => {
//   const navigation = useNavigation();

//   const parseDeepLink = (url: string) => {
//     const match = url.match(/hugin:\/\/([^/]+)\/([^/]+)\/([^/]+)/);
//     if (match) {
//       const [_, path, name, roomKey] = match;
//       return { path, params: { name, roomKey } };
//     }
//     return { path: '', params: null };
//   };

//   useEffect(() => {
//     console.log('Opening link:', pendingLink)
//     if (pendingLink) {

//       navigation.navigate(MainScreens.GroupsScreen, {
//         joining: true,
//         link: pendingLink,
//       });

//       clearPendingLink();
//     }
//   }, [pendingLink]);

//   return null;
// };

function parseHuginUrl(url: string) {
  const match = url.match(/^hugin:\/\/([^/]+)\/([^/]+)\/([^/]+)/);
  if (!match) return null;

  const [, type, name, roomKey] = match;

  return {
    type,
    params: {
      name: decodeURIComponent(name),
      roomKey: decodeURIComponent(roomKey),
    },
  };
}

export const NavigationHandler = ({
  pendingLink,
  clearPendingLink,
  authenticated,
}: {
  pendingLink: string | null;
  clearPendingLink: () => void;
  authenticated: boolean;
}) => {
  useEffect(() => {
    if (!pendingLink) return;
    if (!authenticated) return;
    if (!navigationRef.isReady()) return;

    const parsed = parseHuginUrl(pendingLink);
    if (!parsed) return;

    console.log('Navigating from pending link:', parsed);

    // Always navigate through MainStack
    switch (parsed.type) {
      case 'message':
        navigationRef.navigate(Stacks.MainStack, {
          screen: MainScreens.MessageScreen,
          params: parsed.params,
        });
        break;

      case 'chat':
        navigationRef.navigate(Stacks.MainStack, {
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

    clearPendingLink();
  }, [pendingLink, authenticated]);

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
  const [navigationReady, setNavigationReady] = useState(false);
  const [mainStackReady, setMainStackReady] = useState(false);

  useEffect(() => {
    if (navigationReady && mainStackReady && pendingLink) {
      console.log('Navigating from pending link in RootNavigator:', pendingLink);
      navigateFromUrl(pendingLink);
      setPendingLink(null);
    }
  },[navigationReady, mainStackReady, pendingLink]);

  function navigateFromUrl(url: string) {
  if (!navigationRef.isReady()) return;

  const parsed = parseHuginUrl(url);
  if (!parsed) return;

  console.log('Navigating from URL:', parsed);

  switch (parsed.type) {
    case 'message':
      navigationRef.navigate(MainScreens.MessageStack, {
        screen: MainScreens.MessageScreen,
        params: parsed.params,
      });
      break;

    case 'chat':
      navigationRef.navigate(Stacks.MainStack, {
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
    const handleDeepLink = ({ url }: { url: string }) => {
      setPendingLink(url);  // Always store link, NavigationHandler will handle whether to act or wait.
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then((url) => {
      console.log('Initial URL:', url);
      Alert.alert('Initial URL', url || 'No initial URL');
      if (url) handleDeepLink({ url });
    });

    Linking.addEventListener('url',(url)=>{ 
      console.log('this is the url: ',url);
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

        {/* {authenticated && pendingLink && (
          <NavigationHandler
            pendingLink={pendingLink}
            clearPendingLink={() => setPendingLink(null)}
          />
        )} */}
        {/* {authenticated && pendingLink && (
          <NavigationHandler
            pendingLink={pendingLink}
            clearPendingLink={() => setPendingLink(null)}
            authenticated={authenticated}
          />
        )
        } */}

      </NavigationContainer>
    </GestureHandlerRootView>
  );
};
