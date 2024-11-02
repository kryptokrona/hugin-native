// import ErrorBoundary from '../components/ErrorBoundary';

import { getRoomUsers, joinRooms } from '../services/bare/groups';
import { initDB, loadAccount, saveAccount } from '../services/bare/sqlite';
import {
  useAppStoreState,
  usePreferencesStore,
  useUserStore,
} from '@/services';

import { SafeAreaView } from 'react-native';
import { bare } from 'lib/native';
import { changeLanguage } from 'i18next';
import { newKeyPair } from '../services/bare/crypto';
import { sleep } from '@/utils';
import { useEffect } from 'react';

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const isHydrated = useAppStoreState((state) => state._hasHydrated);

  useEffect(() => {
    async function _init() {
      await init();
    }
    if (isHydrated.preferences && isHydrated.user && isHydrated.theme) {
      _init();
    }
  }, [isHydrated]);

  return <SafeAreaView style={{ flex: 1 }}>{children}</SafeAreaView>;
};

const init = async () => {
  const { user } = useUserStore.getState();
  const { preferences } = usePreferencesStore.getState();
  await changeLanguage(preferences.language);
  await bare(user);
  console.log('Initializing database..');
  await initDB();
  getRoomUsers();
  await sleep(100);
  const acc = await loadAccount();
  console.log('Account', acc);
  if (!acc) {
    console.log('No account, create new one');
    const keys = newKeyPair();
    console.log('Got new keys');
    await saveAccount(keys.publicKey, keys.secretKey);
    useUserStore.setState((state) => ({
      ...state,
      user: {
        ...state.user,
        address: keys.publicKey,
      },
    }));
  }
  await joinRooms();
};
