import { useEffect } from 'react';

import { AppState, Platform, SafeAreaView } from 'react-native';

import { bare } from 'lib/native';
import { Connection, Files } from 'services/bare/globals';

import {
  getCurrentRoom,
  setStoreCurrentRoom,
  updateUser,
  useGlobalStore,
  usePreferencesStore,
  useThemeStore,
  useUserStore,
  useRoomStore,
  getThisRoom,
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
  const authenticated = useGlobalStore((state) => state.authenticated);
  const user = useUserStore((state) => state.user);
  const preferences = usePreferencesStore((state) => state.preferences);
  const { setThisRoom } = useRoomStore();

  async function init() {
    //Check if android background task is already running

    if (Platform.OS === 'android') {
      const err = await Foreground.init();
      if (err) {
        return;
      }
    }

    await initDB();
    await setLatestRoomMessages();
    await setLatestMessages();

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

    const contacts = await getContacts();
    const knownKeys = [];
    for (const contact of contacts) {
      knownKeys.push(contact.messagekey);
    }
    const keys = Wallet.privateKeys();
    MessageSync.init(node, knownKeys, keys);

    //Set this somewhere in a state?
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
      // do something when the app closed
      console.log('App not in focus.');
    });
  }

  const stopTasks = () => {
    Foreground.service.stopAll();
  };

  const Timeout = new Timer(() => {
    //Stop bg tasks after 1hour of inactivity.
    console.log('Stop task!');

    if (Platform.OS === 'android') {
      stopTasks();
    }
  });

  AppState.addEventListener('change', onAppStateChange);
  async function onAppStateChange(state: string) {
    if (state === 'inactive') {
      console.log('Inactive state');
      if (Platform.OS === 'ios') {
        const thisRoom = getCurrentRoom();
        setThisRoom(thisRoom);
        await leaveRooms();
      }
      //I think this is for iPhone only
    } else if (state === 'background') {
      console.log('Start timer');
      Timeout.start();
      //Start background timer to shut off foreground task?
    } else if (state === 'active') {
      if (started && !joining) {
        joining = true;
        if (Platform.OS === 'ios') {
          const currentRoom = getThisRoom();
          setStoreCurrentRoom(currentRoom);
          await joinRooms();
        }
        joining = false;
      }
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
