import { Appearance } from 'react-native';

import { setTheme } from '@/services';

import {
  ASYNC_STORAGE_KEYS,
  getStorageValue,
  setStorageValue,
} from './async-storage';

// TODO
// Add feature to switch theme as user
export const handleTheme = async () => {
  const themeMode = (await getStorageValue(ASYNC_STORAGE_KEYS.THEME_MODE)) as
    | 'light'
    | 'dark'
    | null;

  if (themeMode) {
    setTheme(themeMode);
  } else {
    const colorScheme =
      Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
    setTheme(colorScheme);
    setStorageValue(ASYNC_STORAGE_KEYS.THEME_MODE, colorScheme);
  }
};
