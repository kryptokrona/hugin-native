import { Appearance } from 'react-native';

import { ASYNC_STORAGE_KEYS, getStorageValue } from './async-storage';
import { getStoreTheme, setTheme } from './zustand';

export const handleTheme = async () => {
  const themeMode = (await getStorageValue(ASYNC_STORAGE_KEYS.PREFERENCES))
    ?.themeMode as 'light' | 'dark' | null;

  if (themeMode) {
    setTheme(themeMode);
  } else {
    const colorScheme =
      Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
    setTheme(colorScheme);
  }
};

export const toggleTheme = async () => {
  const theme = getStoreTheme();

  setTheme(theme.mode === 'light' ? 'dark' : 'light');
};
