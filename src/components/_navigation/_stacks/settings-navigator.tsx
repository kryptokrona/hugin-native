import {
  ChangeLanguageScreen,
  ChangeThemeScreen,
  SettingsScreen,
  UpdateProfileScreen,
} from '@/screens';

import { Header } from '../header';
import { SettingsScreens } from '@/config';
import type { SettingsStackParamList } from '@/types';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export const SettingsStackNavigator = () => {
  const { t } = useTranslation();
  return (
    <Stack.Navigator>
      <Stack.Screen
        name={SettingsScreens.SettingsScreen}
        component={SettingsScreen}
        options={() => ({
          header: (_props) => <Header title={t('settingsTitle')} />,
        })}
      />
      <Stack.Screen
        name={SettingsScreens.ChangeLanguageScreen}
        component={ChangeLanguageScreen}
        options={() => ({
          header: (_props) => <Header title={t('changeLanguage')} backButton />,
        })}
      />
      <Stack.Screen
        name={SettingsScreens.UpdateProfileScreen}
        component={UpdateProfileScreen}
        options={() => ({
          header: (_props) => <Header title={t('updateProfile')} backButton />,
        })}
      />
      <Stack.Screen
        name={SettingsScreens.ChangeThemeScreen}
        component={ChangeThemeScreen}
        options={() => ({
          header: (_props) => <Header title={t('changeTheme')} backButton />,
        })}
      />
    </Stack.Navigator>
  );
};
