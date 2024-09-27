import i18n from 'i18next';

import { bare } from 'lib/native';

import { defaultTheme } from '@/styles';

import { ASYNC_STORAGE_KEYS, getStorageValue } from './async-storage';
import { getUserGroups, joinRooms } from './bare';
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
  console.log('Initializing database..');
  await initDB();
  await bare(user);
  await joinRooms();
  setStoreTheme(theme ?? defaultTheme);
  setStorePreferences(preferences ?? defaultPreferences);
  setStoreUser(user);
  getUserGroups();
  if (preferences) {
    await i18n.changeLanguage(preferences.language);
  }
};
