import { useEffect } from 'react';

import {
  AppState,
  BackHandler,
  Platform,
  SafeAreaView,
  StyleSheet,
} from 'react-native';

import { useNavigationContainerRef } from '@react-navigation/native';

import { bare, send_idle_status } from 'lib/native';
import { Connection, Files } from 'services/bare/globals';

import {
  getCurrentRoom,
  getThisRoom,
  setStoreCurrentRoom,
  updateUser,
  useGlobalStore,
  usePreferencesStore,
  useRoomStore,
  useThemeStore,
  useUserStore,
} from '@/services';
import { sleep } from '@/utils';

import { Foreground } from './service';

import {
  joinRooms,
  leaveRooms,
  setLatestMessages,
  setLatestRoomMessages,
} from '../services/bare';
import { keychain } from '../services/bare/crypto';
import { getContacts, initDB, loadSavedFiles } from '../services/bare/sqlite';
import { MessageSync } from '../services/hugin/syncer';
import { Wallet } from '../services/kryptokrona/wallet';
import { Timer } from '../services/utils';

interface AppProviderProps {
  children: React.ReactNode;
}

let started = false;
let joining = false;

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const theme = useThemeStore((state) => state.theme);
  const navigationRef = useNavigationContainerRef();

  const authenticated = useGlobalStore((state) => state.authenticated);
  const user = useUserStore((state) => state.user);
  const preferences = usePreferencesStore((state) => state.preferences);
  const { setThisRoom } = useRoomStore();

  async function init() {
    if (Platform.OS === 'android') {
      const err = await Foreground.init();
      if (err) {
        return;
      }
    }

    await initDB();
    await setLatestRoomMessages();
    await setLatestMessages();

    const node = preferences?.node
      ? {
          port: parseInt(preferences.node.split(':')[1]),
          url: preferences.node.split(':')[0],
        }
      : { port: 80, url: 'node.xkr.network' };

    Connection.listen();
    await Wallet.init(node);

    const contacts = await getContacts();
    const knownKeys = contacts.map((contact) => contact.messagekey);
    const keys = Wallet.privateKeys();
    MessageSync.init(node, knownKeys, keys);

    const huginAddress = Wallet.address + keychain.getMsgKey();
    console.log('huginAddress', huginAddress);

    await updateUser({ huginAddress });

    Files.update(await loadSavedFiles());
    await bare(user);
    await sleep(100);
    await joinRooms();
    started = true;
  }

  useEffect(() => {
    if (authenticated && user?.address) {
      console.log('running authenticated');
      init();
    }
  }, [authenticated, user?.address]);

  if (Platform.OS === 'android') {
    AppState.addEventListener('blur', () => {
      console.log('App not in focus.');
    });
  }

  const stopTasks = () => {
    Foreground?.service?.stopAll();
  };

  const Timeout = new Timer(() => {
    console.log('Stop task!');

    if (Platform.OS === 'android') {
      stopTasks();
    }
  });

  useEffect(() => {
    const onAppStateChange = async (state: string) => {
      if (state === 'inactive') {
        if (!started) {
          return;
        }
        console.log('Inactive state');
        setStoreCurrentRoom(getCurrentRoom());

        if (Platform.OS === 'ios') {
          const thisRoom = getCurrentRoom();
          setThisRoom(thisRoom);
          await leaveRooms();
          console.log('Successfully left rooms');
        }
      } else if (state === 'background') {
        console.log('Start timer');
        Timeout.start();
        send_idle_status(true);
        setStoreCurrentRoom(getCurrentRoom());
      } else if (state === 'active') {
        console.log('App active');
        Timeout.reset();
        send_idle_status(false);

        if (started && !joining) {
          joining = true;
          if (Platform.OS === 'ios') {
            const currentRoom = getThisRoom();
            setStoreCurrentRoom(currentRoom);
            await joinRooms();
            console.log('Successfully joined rooms after inactivity');
          }
          joining = false;
        }

        if (Platform.OS === 'android') {
          setStoreCurrentRoom(getCurrentRoom());
        }
      }
    };

    const subscription = AppState.addEventListener('change', onAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    // Prevent app closing when navigation history is empty. E.g after press switch product.
    const backAction = () => {
      if (!navigationRef.canGoBack()) {
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [navigationRef]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 40 : 0,
  },
});
