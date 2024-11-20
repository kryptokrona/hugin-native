import { initDB, loadAccount } from '../services/bare/sqlite';
import { joinRooms, setLatestRoomMessages } from '../services/bare';
import { useGlobalStore, useUserStore } from '@/services';

import { SafeAreaView } from 'react-native';
import { bare } from 'lib/native';
import { sleep } from '@/utils';
import { useEffect } from 'react';

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
    if (authenticated && user?.address) {
      console.log('running authenticated');
      init();
    }
  }, [authenticated, user?.address]);

  return <SafeAreaView style={{ flex: 1 }}>{children}</SafeAreaView>;
};
