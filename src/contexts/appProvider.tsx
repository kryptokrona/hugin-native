import { useEffect } from 'react';

import { AppState, Platform, SafeAreaView } from 'react-native';

import ReactNativeForegroundService from '@supersami/rn-foreground-service';

import { bare, keep_alive } from 'lib/native';

import { useGlobalStore, useUserStore } from '@/services';
import { sleep } from '@/utils';

import { joinRooms, setLatestRoomMessages } from '../services/bare';
import { initDB, loadAccount } from '../services/bare/sqlite';

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const authenticated = useGlobalStore((state) => state.authenticated);
  const user = useUserStore((state) => state.user);
  const addTask = async () => {
    if (Platform.OS === 'android') {
      ReactNativeForegroundService.add_task(() => keep_alive(), {
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
    if (Platform.OS === 'android') {
      addTask();
      const err = await startTask();
      if (err) {
        return;
      }
    }
    await initDB();
    const keys = await loadAccount();
    user.keys = keys;
    await bare(user);
    await setLatestRoomMessages();
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

  return <SafeAreaView style={{ flex: 1 }}>{children}</SafeAreaView>;
};
