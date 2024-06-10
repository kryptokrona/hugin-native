import { type ColorSchemeName } from 'react-native';

import { User } from '@/types';

import {
  ASYNC_STORAGE_KEYS,
  getStorageValue,
  setStorageValue,
} from './async-storage';
import { useGlobalStore } from './zustand';

export const updateLanguage = async (language: string) => {
  const preferences = await getStorageValue(ASYNC_STORAGE_KEYS.PREFERENCES);
  const newPref = {
    ...preferences,
    language,
  };
  await setStorageValue(ASYNC_STORAGE_KEYS.PREFERENCES, newPref);
};

export const updateUser = async (value: Partial<User>) => {
  const { user } = useGlobalStore.getState();
  if (!user) {
    return;
  }
  const newUser = {
    ...user,
    ...value,
  };
  useGlobalStore.setState({ user: newUser });
};

export const toggleTheme = async () => {
  const { preferences } = useGlobalStore.getState();
  if (!preferences) {
    return;
  }
  const newTheme = (
    preferences.themeMode === 'light' ? 'dark' : 'light'
  ) as ColorSchemeName;
  const newPref = { ...preferences, themeMode: newTheme };

  useGlobalStore.setState({ preferences: newPref });
};
