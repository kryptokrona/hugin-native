import { changeLanguage } from 'i18next';

import { bare } from 'lib/native';

import { sleep } from '@/utils';

import { getRoomUsers, joinRooms } from './bare';
import { newKeyPair } from './crypto';
import { initDB, loadAccount, saveAccount } from './sqlite';
import { usePreferencesStore, useUserStore } from './zustand';

export const init = async () => {
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
