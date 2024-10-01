import i18n from 'i18next';

import { bare } from 'lib/native';

import { defaultTheme } from '@/styles';
import { sleep } from '@/utils';

import { ASYNC_STORAGE_KEYS, getStorageValue } from './async-storage';
import { getRoomUsers, joinRooms } from './bare';
import { initDB } from './sqlite';
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
  await bare(user);
  console.log('Initializing database..');
  await initDB();
  await sleep(100);
  await joinRooms();
  setStoreTheme(theme ?? defaultTheme);
  setStorePreferences(preferences ?? defaultPreferences);
  setStoreUser(user);
  getRoomUsers();
  if (preferences) {
    await i18n.changeLanguage(preferences.language);
  }
};
