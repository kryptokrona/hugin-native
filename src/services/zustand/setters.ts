import { ColorSchemeName } from 'react-native';

import { Themes } from '@/styles';

import { useGlobalStore } from './global-store';

import { ASYNC_STORAGE_KEYS, setStorageValue } from '../async-storage';

export const setTheme = (payload: ColorSchemeName) => {
  const theme = Themes[payload as 'light' | 'dark'];

  useGlobalStore.setState({ theme });
};

export const toggleTheme = () => {
  const theme =
    useGlobalStore.getState().theme.mode === 'light'
      ? Themes.dark
      : Themes.light;

  useGlobalStore.setState({ theme });
  setStorageValue(ASYNC_STORAGE_KEYS.THEME_MODE, theme.mode);
};
