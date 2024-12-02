import '../shim';
import React from 'react';

import Toast from 'react-native-toast-message';

import { AppProvider } from './contexts';

import { RootNavigator } from './components/_navigation/root-navigator';

// Maybe https://wix.github.io/react-native-notifications/api/general-api/
// import PushNotificationIOS from '@react-native-community/push-notification-ios'; // TODO iOS
// import PushNotification, {
//   PushNotificationObject,
// } from 'react-native-push-notification';

// import SplashScreen from 'react-native-splash-screen';
// import { useEffect } from 'react';
const App = () => {
  return (
    <AppProvider>
      <RootNavigator />

      <Toast />
    </AppProvider>
  );
};

export default App;
