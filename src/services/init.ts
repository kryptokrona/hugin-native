import i18n from 'i18next';
import RNFS from 'react-native-fs';

import { bare } from 'lib/native';

import { defaultTheme } from '@/styles';
import { sleep } from '@/utils';

import { ASYNC_STORAGE_KEYS, getStorageValue } from './async-storage';
import { getRoomUsers, joinRooms } from './bare';
import { newKeyPair } from './crypto';
import { initDB, loadAccount, saveAccount } from './sqlite';
import {
  defaultPreferences,
  defaultUser,
  setStorePreferences,
  setStoreTheme,
  setStoreUser,
} from './zustand';

export const init = async () => {
  const theme = await getStorageValue(ASYNC_STORAGE_KEYS.THEME);
  const preferences = await getStorageValue(ASYNC_STORAGE_KEYS.PREFERENCES);
  const mUser = await getStorageValue(ASYNC_STORAGE_KEYS.USER);
  const user = mUser ?? defaultUser;
  user.downloadDir = RNFS.DownloadDirectoryPath;
  await bare(user);
  console.log('Initializing database..');
  await initDB();
  setStoreUser(user);
  getRoomUsers();
  setStoreTheme(theme ?? defaultTheme);
  setStorePreferences(preferences ?? defaultPreferences);
  await sleep(100);
  const acc = await loadAccount();
  console.log('Account', acc);
  if (!acc) {
    console.log('No account, create new one');
    const keys = newKeyPair();
    console.log('Got new keys');
    await saveAccount(keys.publicKey, keys.secretKey);
  }
  await joinRooms();
  if (preferences) {
    await i18n.changeLanguage(preferences.language);
  }
};
