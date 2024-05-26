import '../shim';

import React from 'react';

import { AppNavigator } from '@/components';
import { AppProvider } from '@/contexts';

// import SplashScreen from 'react-native-splash-screen';
// import { useEffect } from 'react';
const App = () => {
  // const [showSplash, setShowSplash] = useState(true);
  // useEffect(() => {
  //   init();
  //   setTimeout(() => {
  //     setShowSplash(false);
  //   }, 3000);
  // }, []);

  // if (showSplash) {
  //   return (
  //     <ScreenLayout>
  //       <XKRLogo />
  //     </ScreenLayout>
  //   );
  // } else {
  return (
    <AppProvider>
      <AppNavigator />
    </AppProvider>
  );
  // }
};

export default App;
