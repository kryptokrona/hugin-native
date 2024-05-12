import React, { useEffect } from 'react';

import { AppNavigator } from '@/components';
import { AppProvider } from '@/contexts';
import { init } from '@/services';

// import SplashScreen from 'react-native-splash-screen';
// import { useEffect } from 'react';
const App = () => {
  useEffect(() => {
    init();
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
