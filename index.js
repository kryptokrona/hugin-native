import './src/i18n/i18n';

/**
 * @format
 */
import { AppRegistry, Platform } from 'react-native';

import App from './src/App';
import { name as appName } from './app.json';

if (Platform.OS === 'android') {
  (async () => {
    try {
      const { default: ReactNativeForegroundService } = await import(
        '@supersami/rn-foreground-service'
      );

      ReactNativeForegroundService.register({
        config: {
          alert: true,
          onServiceErrorCallBack: () => {
            console.error('Foreground service error occurred');
          },
        },
      });
    } catch (error) {
      console.error('Failed to load the foreground service:', error);
    }
  })();
}

AppRegistry.registerComponent(appName, () => App);
