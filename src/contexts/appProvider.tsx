import { useEffect } from 'react';

import { AppState, Platform, SafeAreaView } from 'react-native';

import { bare, keep_alive, send_idle_status } from 'lib/native';
import { Connection, Files } from 'services/bare/globals';

import {
  getCurrentRoom,
  setStoreCurrentRoom,
  useGlobalStore,
  usePreferencesStore,
  useThemeStore,
  useUserStore,
} from '@/services';
import { sleep } from '@/utils';

import { joinRooms, setLatestRoomMessages } from '../services/bare';
import { keychain } from '../services/bare/crypto';
import { initDB, loadSavedFiles } from '../services/bare/sqlite';
import { MessageSync } from '../services/hugin/syncer';
import { Wallet } from '../services/kryptokrona/wallet';
import { Timer } from '../services/utils';

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const theme = useThemeStore((state) => state.theme);
  const authenticated = useGlobalStore((state) => state.authenticated);
  const user = useUserStore((state) => state.user);
  const preferences = usePreferencesStore((state) => state.preferences);

  let ReactNativeForegroundService: any;

  useEffect(() => {
    const loadForegroundService = async () => {
      if (Platform.OS === 'android') {
        const { default: Service } = await import(
          '@supersami/rn-foreground-service'
        );
        ReactNativeForegroundService = Service;
      }
    };
    loadForegroundService();
  }, []);

  const addTask = async () => {
    if (Platform.OS === 'android') {
      ReactNativeForegroundService?.add_task(() => keep_alive(), {
        delay: 10000,
        onError: (e) => console.error('Error starting task', e),
        onLoop: true,
        taskId: 'hugin',
      });
    }
  };

  const startTask = async () => {
    try {
      await ReactNativeForegroundService.start({
        ServiceType: 'dataSync',
        button: false,
        button2: false,
        button2Text: 'Stop',
        buttonOnPress: 'cray',
        buttonText: 'Close',
        color: '#000000',
        icon: 'ic_launcher',
        id: 1244,
        message: 'Syncing messages...',
        setOnlyAlertOnce: 'true',
        title: 'Hugin',
        visibility: 'public',
      });
    } catch (error) {
      console.error('Failed to start foreground service', error);
    }
  };

  async function init() {
    if (Platform.OS === 'android') {
      await addTask();
      await startTask();
    }

    await initDB();
    await setLatestRoomMessages();

    const node = preferences?.node
      ? {
          port: parseInt(preferences.node.split(':')[1]),
          url: preferences.node.split(':')[0],
        }
      : { port: 80, url: 'node.xkr.network' };

    Connection.listen();
    await Wallet.init(node);

    const keys = Wallet.privateKeys();
    const contacts = [
      'ec5bc96b9e2431fbe146d23de585acc9cad32ac1adaf412f830dc68985fa6d27',
      '7368d6437260c59e5cc2609d8baa2b038bea03c14fd77db8e026678aaa63624b',
    ]; // KNOWN pub keys from db
    MessageSync.init(node, contacts, keys);

    console.log('huginAddress');
    const huginAddress = Wallet.address + keychain.getMsgKey();
    console.log('huginAddress', huginAddress);

    Files.update(await loadSavedFiles());
    await bare(user);
    await sleep(100);
    await joinRooms();
  }

  useEffect(() => {
    if (authenticated && user?.address) {
      console.log('running authenticated');
      init();
    }
  }, [authenticated, user?.address]);

  useEffect(() => {
    const Timeout = new Timer(() => {
      console.log('Stop task after inactivity');
      if (Platform.OS === 'android') {
        ReactNativeForegroundService?.stopAll();
      }
    });

    const onAppStateChange = async (state: string) => {
      if (state === 'inactive') {
        console.log('Inactive state');
        setStoreCurrentRoom(getCurrentRoom());
      } else if (state === 'background') {
        console.log('Start timer');
        Timeout.start();
        send_idle_status(true);
        setStoreCurrentRoom(getCurrentRoom());
      } else if (state === 'active') {
        console.log('App active');
        Timeout.reset();
        if (Platform.OS === 'android') {
          send_idle_status(false);
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
