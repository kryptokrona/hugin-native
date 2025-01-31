import '../shim';

import React from 'react';

import Toast from 'react-native-toast-message';

import { AppProvider } from './contexts';
import { useThemeStore } from './services';
import { getToastConfig } from './utils';

import { RootNavigator } from './components/_navigation/root-navigator';

const App = () => {
  const theme = useThemeStore((state) => state.theme);

  const toastConfig = getToastConfig(theme);

  return (
    <AppProvider>
      <RootNavigator />
      <Toast config={toastConfig} />
    </AppProvider>
  );
};

export default App;
