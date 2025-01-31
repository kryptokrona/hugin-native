import { AppState, Platform, SafeAreaView } from 'react-native';
import { Connection, Files } from 'services/bare/globals';
import { bare, send_idle_status } from 'lib/native';
import { getContacts, initDB, loadSavedFiles } from '../services/bare/sqlite';
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
import {
  joinRooms,
  leaveRooms,
  setLatestMessages,
  setLatestRoomMessages,
} from '../services/bare';
import { useEffect, useRef } from 'react';

import { Foreground } from './service';
import { MessageSync } from '../services/hugin/syncer';
import { Timer } from '../services/utils';
import { Wallet } from '../services/kryptokrona/wallet';
import { keychain } from '../services/bare/crypto';
import { sleep } from '@/utils';

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const theme = useThemeStore((state) => state.theme);
  const authenticated = useGlobalStore((state) => state.authenticated);
  const user = useUserStore((state) => state.user);
  const preferences = usePreferencesStore((state) => state.preferences);
  const { setThisRoom } = useRoomStore();

  const started = useRef(false);
  const joining = useRef(false);

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
    started.current = true;
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
        console.log('Inactive state');
        setStoreCurrentRoom(getCurrentRoom());

        if (Platform.OS === 'ios') {
          const thisRoom = getCurrentRoom();
          setThisRoom(thisRoom);
          await leaveRooms();
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

        if (!started.current) {
          started.current = true;
        }

        if (!joining.current) {
          joining.current = true;
          if (Platform.OS === 'ios') {
            const currentRoom = getThisRoom();
            setStoreCurrentRoom(currentRoom);
            await joinRooms();
          }
          joining.current = false;
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

  return (
    <SafeAreaView style={{ backgroundColor: theme.background, flex: 1 }}>
      {children}
    </SafeAreaView>
  );
};
