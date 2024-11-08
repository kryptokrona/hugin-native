import { useEffect } from 'react';

import { SafeAreaView } from 'react-native';

import { bare } from 'lib/native';

import { useGlobalStore, useUserStore } from '@/services';
import { sleep } from '@/utils';

import { setLatestRoomMessages, joinRooms } from '../services/bare';
import { initDB, loadAccount } from '../services/bare/sqlite';

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const authenticated = useGlobalStore((state) => state.authenticated);
  const user = useUserStore((state) => state.user);

  async function init() {
    await initDB();
    const keys = await loadAccount();
    user.keys = keys;
    await bare(user);
    await setLatestRoomMessages();
    await sleep(100);
    await joinRooms();
  }

  useEffect(() => {
    if (authenticated) {
      init();
    }
  }, [authenticated, user]);

  return <SafeAreaView style={{ flex: 1 }}>{children}</SafeAreaView>;
};
