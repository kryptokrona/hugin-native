/**
 * @format
 */
import './shim';
import 'react-native-reanimated';
import './src/i18n/i18n';
import './src/services/init';
import './src/services/pushnotifications';

import App from './src/App';
import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
