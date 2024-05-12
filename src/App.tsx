import React, { useEffect } from 'react';

import { Appearance } from 'react-native';

import { AppNavigator } from '@/components';
import { AppProvider } from '@/contexts';
import { setTheme } from '@/services';

// import SplashScreen from 'react-native-splash-screen';
// import { useEffect } from 'react';
const App = () => {
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setTheme(colorScheme);
    });

    return () => subscription.remove();

    // setTimeout(() => {
    //   SplashScreen.hide();
    // }, 1500);
  }, []);

  return (
    <AppProvider>
      <AppNavigator />
    </AppProvider>
  );
};

export default App;
