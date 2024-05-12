import { ColorSchemeName } from 'react-native';

import { Themes } from '@/styles';

import { useGlobalStore } from './global-store';

export const setTheme = (payload: ColorSchemeName) => {
  const theme = Themes[payload as 'light' | 'dark'];
  useGlobalStore.setState({ theme });
};
