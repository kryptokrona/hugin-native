import i18n from 'i18next';

import { defaultTheme } from '@/styles';

import { ASYNC_STORAGE_KEYS, getStorageValue } from './async-storage';
import { initDB } from './sqlite';
import { getUserGroups, joinRooms } from './bare';
import {
  defaultPreferences,
  defaultUser,
  setStorePreferences,
  setStoreTheme,
  setStoreUser,
} from './zustand';

import { bare } from '/lib/native.js';

export const init = async () => {
  const theme = await getStorageValue(ASYNC_STORAGE_KEYS.THEME);
  const preferences = await getStorageValue(ASYNC_STORAGE_KEYS.PREFERENCES);
  const mUser = await getStorageValue(ASYNC_STORAGE_KEYS.USER);
  console.log('Initializing database..');
  await initDB();

  const user = mUser ?? defaultUser;
  await joinRooms();
  setStoreTheme(theme ?? defaultTheme);
  setStorePreferences(preferences ?? defaultPreferences);
  setStoreUser(user);

  getUserGroups();

  if (preferences) {
    await i18n.changeLanguage(preferences.language);
  }

  await bare(user);
};
