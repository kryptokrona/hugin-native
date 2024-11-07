import { getRoomUsers, joinRooms } from '../services/bare';
import { useGlobalStore, useUserStore } from '@/services';

import { SafeAreaView } from 'react-native';
import { bare } from 'lib/native';
import { initDB } from '../services/bare/sqlite';
import { sleep } from '@/utils';
import { useEffect } from 'react';

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const authenticated = useGlobalStore((state) => state.authenticated);
  const setStoreRooms = useGlobalStore((state) => state.setStoreRooms);
  const user = useUserStore((state) => state.user);

  async function init() {
    await bare(user);
    await initDB();
    await sleep(100);
    const rooms = await getRoomUsers();
    setStoreRooms(rooms);
    // const acc = await loadAccount();
    await joinRooms();
  }

  useEffect(() => {
    if (authenticated) {
      init();
    }
  }, [authenticated, user]);

  return <SafeAreaView style={{ flex: 1 }}>{children}</SafeAreaView>;
};
