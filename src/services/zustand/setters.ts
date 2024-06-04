import { type ColorSchemeName } from 'react-native';

import { Themes } from '@/styles';
import type { Preferences } from '@/types';

import { useGlobalStore } from './global-store';

export const setTheme = (payload: ColorSchemeName) => {
  const theme = Themes[payload as 'light' | 'dark'];

  useGlobalStore.setState({ theme });
};

export const toggleTheme = async () => {
  const { theme } = useGlobalStore.getState();

  setTheme(theme.mode === 'light' ? 'dark' : 'light');
};

export const setPreferences = (preferences: Preferences) => {
  useGlobalStore.setState({ preferences });
};

// Do never set individual preferences here, always set the whole preferences object
// Should be set to storage and then to the store
