/**
 * @format
 */
import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';
import './src/i18n/i18n';
import ReactNativeForegroundService from '@supersami/rn-foreground-service';
ReactNativeForegroundService.register({
  config: {
    alert: true,
    onServiceErrorCallBack: () => {
      console.error('Foreground service error occurred');
    },
  },
});

AppRegistry.registerComponent(appName, () => App);
