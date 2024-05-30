import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { SettingsScreen } from '@/screens';
import { SettingsScreens, type SettingsStackParamList } from '@/types';

import { Header } from '../header';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export const SettingsStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name={SettingsScreens.SettingsScreen}
        component={SettingsScreen}
        options={() => ({
          header: (_props) => <Header title={'Settings'} />,
        })}
      />
      {/* <Stack.Screen
        name={SettingsScreens.DisableDozeScreen}
        component={MainScreen}
      />
      <Stack.Screen
        name={SettingsScreens.ExportKeysScreen}
        component={MainScreen}
      />
      <Stack.Screen name={SettingsScreens.FaqScreen} component={MainScreen} />
      <Stack.Screen
        name={SettingsScreens.OptimizeScreen}
        component={MainScreen}
      />
      <Stack.Screen
        name={SettingsScreens.SwapAPIScreen}
        component={MainScreen}
      />
      <Stack.Screen
        name={SettingsScreens.SwapCurrencyScreen}
        component={MainScreen}
      />
      <Stack.Screen
        name={SettingsScreens.SwapLanguageScreen}
        component={MainScreen}
      />
      <Stack.Screen
        name={SettingsScreens.SwapNodeScreen}
        component={MainScreen}
      /> */}
    </Stack.Navigator>
  );
};
