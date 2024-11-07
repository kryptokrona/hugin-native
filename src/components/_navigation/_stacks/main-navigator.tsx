import {
  AddGroupScreen,
  ChangeLanguageScreen,
  ChangeThemeScreen,
  GroupChatScreen,
  GroupsScreen,
  ModifyGroupScreen,
  SettingsScreen,
  UpdateProfileScreen,
} from '@/screens';
import { MainScreens, TabBar } from '@/config';

import { Header } from '../header';
import { MainNavigationParamList } from '@/types';
import { MyTabBar } from '../tab-bar';
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { t } from 'i18next';

const Tab = createBottomTabNavigator<MainNavigationParamList>();

export const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarHideOnKeyboard: true,
      }}
      tabBar={(props) => <MyTabBar {...props} />}>
      {/* // Groups */}

      <Tab.Screen
        name={MainScreens.GroupsScreen}
        component={GroupsScreen}
        options={() => ({
          header: (_props) => <Header title={t('rooms')} />, // More actions handled in screen
        })}
      />
      <Tab.Screen
        name={MainScreens.AddGroupScreen}
        component={AddGroupScreen}
        options={() => ({
          header: (_props) => <Header backButton title={t('subscribe')} />,
        })}
      />
      <Tab.Screen
        name={MainScreens.GroupChatScreen}
        component={GroupChatScreen}
        options={() => ({
          header: (_props) => (
            <Header
              // Is set in screen
              title={'Untitled'}
              backButton
            />
          ),
        })}
      />
      <Tab.Screen
        name={MainScreens.ModifyGroupScreen}
        component={ModifyGroupScreen}
        options={() => ({
          header: (_props) => <Header backButton title={t('modify')} />,
        })}
      />

      {/* // Settings */}

      <Tab.Screen
        name={MainScreens.SettingsScreen}
        component={SettingsScreen}
        options={() => ({
          header: (_props) => <Header title={t('settingsTitle')} />,
        })}
      />
      <Tab.Screen
        name={MainScreens.ChangeLanguageScreen}
        component={ChangeLanguageScreen}
        options={() => ({
          header: (_props) => <Header title={t('changeLanguage')} backButton />,
        })}
      />
      <Tab.Screen
        name={MainScreens.UpdateProfileScreen}
        component={UpdateProfileScreen}
        options={() => ({
          header: (_props) => <Header title={t('updateProfile')} backButton />,
        })}
      />
      <Tab.Screen
        name={MainScreens.ChangeThemeScreen}
        component={ChangeThemeScreen}
        options={() => ({
          header: (_props) => <Header title={t('changeTheme')} backButton />,
        })}
      />
    </Tab.Navigator>
  );
};
