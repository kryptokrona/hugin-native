import { useEffect } from 'react';

import { AppState, Platform, SafeAreaView } from 'react-native';

import { bare, keep_alive } from 'lib/native';
import { Connection, Files } from 'services/bare/globals';

import {
  useGlobalStore,
  usePreferencesStore,
  useThemeStore,
  useUserStore,
  // keychain
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

//TODO** FIX android import. This does not work
// let ReactNativeForegroundService: any;
// async function importPackage() {
//   async () => {
//     ReactNativeForegroundService = { default: ReactNativeForegroundService } =
//       await import('@supersami/rn-foreground-service');
//   };
// }

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const theme = useThemeStore((state) => state.theme);
  const authenticated = useGlobalStore((state) => state.authenticated);
  const user = useUserStore((state) => state.user);
  const preferences = usePreferencesStore((state) => state.preferences);

  const addTask = async () => {
    if (Platform.OS === 'android') {
      ReactNativeForegroundService?.add_task(() => keep_alive(), {
        delay: 10000,
        onError: (e) => {
          console.error('Error starting task', e);
        },
        onLoop: true,
        taskId: 'hugin',
      });
    }

    //Add iphone bg/fg task here
  };

  const startTask = async () => {
    //Todo fix notification****
    const error = await ReactNativeForegroundService.start({
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
    return error;
  };

  async function init() {
    //Check if android background task is already running

    //TODO** FIX android foreground import. This does not work
    // if (Platform.OS === 'android') {
    //   await importPackage();
    //   addTask();
    //   const err = await startTask();
    //   if (err) {
    //     return;
    //   }
    // }

    await initDB();
    await setLatestRoomMessages();
    let node = {};
    if (preferences?.node === undefined) {
      node = { port: 80, url: 'node.xkr.network' };
    } else {
      node = {
        port: parseInt(preferences.node.split(':')[1]),
        url: preferences.node.split(':')[0],
      };
    }
    Connection.listen();
    await Wallet.init(node);

    const keys = Wallet.privateKeys();

    const contacts = [
      'ec5bc96b9e2431fbe146d23de585acc9cad32ac1adaf412f830dc68985fa6d27',
      '7368d6437260c59e5cc2609d8baa2b038bea03c14fd77db8e026678aaa63624b',
    ]; //KNOWN pub keys from db
    MessageSync.init(node, contacts, keys);

    console.log('huginAddress');
    //Set this somewhere in a state?
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

  if (Platform.OS === 'android') {
    AppState.addEventListener('blur', () => {
      // do something when the app closed
      console.log('App not in focus.');
    });
  }

  const stopTasks = () => {
    ReactNativeForegroundService.stopAll();
  };

  const Timeout = new Timer(() => {
    //Stop bg tasks after 1hour of inactivity.
    console.log('Stop task!');
    console.log('Stop task!');
    console.log('Stop task!');
    console.log('Stop task!');

    if (Platform.OS === 'android') {
      stopTasks();
    }
  });

  AppState.addEventListener('change', onAppStateChange);

  async function onAppStateChange(state: string) {
    if (state === 'inactive') {
      console.log('Inactive state');
      //I think this is for iPhone only
    } else if (state === 'background') {
      console.log('Start timer');
      Timeout.start();
      //Start background timer to shut off foreground task?
    } else if (state === 'active') {
      console.log('Reset timer');
      Timeout.reset();
    }
  }

  return (
    <SafeAreaView style={{ backgroundColor: theme.background, flex: 1 }}>
      {children}
    </SafeAreaView>
  );
};
