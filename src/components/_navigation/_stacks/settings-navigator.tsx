import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MainScreen } from '@/screens';
import { SettingsScreens, SettingsStackParamList } from '@/types';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export const SettingsStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name={SettingsScreens.SettingsScreen}
        component={MainScreen}
      />
      <Stack.Screen
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
      />
    </Stack.Navigator>
  );
};
