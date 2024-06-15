import i18n from 'i18next';
import RNFS from 'react-native-fs';

import { ASYNC_STORAGE_KEYS, getStorageValue } from './async-storage';
import {
  defaultPreferences,
  defaultUser,
  setPreferences,
  setUser,
} from './zustand';

import { bare } from '../../lib/native.js';

export const init = async () => {
  const preferences = await getStorageValue(ASYNC_STORAGE_KEYS.PREFERENCES);
  const user = await getStorageValue(ASYNC_STORAGE_KEYS.USER);
  setPreferences(preferences ?? defaultPreferences);

  if (preferences) {
    await i18n.changeLanguage(preferences.language);
  }

  const documentDirectoryPath = RNFS.DocumentDirectoryPath;
  setUser(user ?? defaultUser);
  await bare(user ?? defaultUser, documentDirectoryPath);
};
