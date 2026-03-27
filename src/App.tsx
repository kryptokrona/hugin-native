import React, { useEffect, useState } from 'react';
import { AppState, AppStateStatus, View } from 'react-native';

import Toast from 'react-native-toast-message';

import { AppProvider } from './contexts';
import { useThemeStore } from './services';
import { getToastConfig } from './utils';

import { RootNavigator } from './components/_navigation/root-navigator';
import { Camera } from 'services/bare/globals';

const App = () => {
  const theme = useThemeStore((state) => state.theme);
  const toastConfig = getToastConfig(theme);

  const [hasBeenActive, setHasBeenActive] = useState(
    AppState.currentState === 'active' || Camera.active
  );

  useEffect(() => {
    if (hasBeenActive) return;

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setHasBeenActive(true);
      }
    });

    return () => sub.remove();
  }, [hasBeenActive]);

  return (
    <AppProvider>
      {hasBeenActive ? (
        <>
          <RootNavigator />
          <Toast config={toastConfig} />
        </>
      ) : (
        // Minimal placeholder when backgrounded
        <View />
      )}
    </AppProvider>
  );
};

export default App;
