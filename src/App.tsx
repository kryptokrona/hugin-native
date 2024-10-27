import '../shim';

import React from 'react';

import { RootNavigator } from '@/components';

import { AppProvider } from './contexts';

// Maybe https://wix.github.io/react-native-notifications/api/general-api/
// import PushNotificationIOS from '@react-native-community/push-notification-ios'; // TODO iOS
// import PushNotification, {
//   PushNotificationObject,
// } from 'react-native-push-notification';

const App = () => {
  return (
    <AppProvider>
      <RootNavigator />
    </AppProvider>
  );
};

export default App;
