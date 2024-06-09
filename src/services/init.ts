import i18n from 'i18next';

import { ASYNC_STORAGE_KEYS, getStorageValue } from './async-storage';
import { defaultUser, setPreferences, setUser } from './zustand';

import { bare } from '../../lib/native.js';

export const init = async () => {
  const preferences = await getStorageValue(ASYNC_STORAGE_KEYS.PREFERENCES);
  const user = await getStorageValue(ASYNC_STORAGE_KEYS.USER);
  if (preferences) {
    console.log({ preferences });
    setPreferences(preferences);
    await i18n.changeLanguage(preferences.language);
  }

  if (user) {
    setUser(user);
  }
  await bare(user ?? defaultUser);
};
