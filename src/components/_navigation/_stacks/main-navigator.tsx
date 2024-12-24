import React from 'react';
import {
  AddGroupScreen,
  ChangeLanguageScreen,
  ChangeThemeScreen,
  GroupChatScreen,
  GroupsScreen,
  ModifyGroupScreen,
  SettingsScreen,
  UpdateProfileScreen,
  DashboardScreen,
  SendTransactionScreen
} from '@/screens';
import { MainScreens } from '@/config';
import { Header } from '../header';
import { MainNavigationParamList } from '@/types';
import { MyTabBar } from '../tab-bar';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { t } from 'i18next';

const Tab = createBottomTabNavigator<MainNavigationParamList>();
const NativeStack = createNativeStackNavigator<MainNavigationParamList>();

// Sequential flow: Native Stack Navigator for Groups, Chat, and Modify Group
const GroupsStack = () => {
  return (
    <NativeStack.Navigator>
      <NativeStack.Screen
        name={MainScreens.GroupsScreen}
        component={GroupsScreen}
        options={{
          header: (_props) => <Header title={t('rooms')} />,
        }}
      />
      <NativeStack.Screen
        name={MainScreens.GroupChatScreen}
        component={GroupChatScreen}
        options={{
          header: (_props) => (
            <Header
              title={'Untitled'}
              backButton
            />
          ),
        }}
      />
      <NativeStack.Screen
        name={MainScreens.ModifyGroupScreen}
        component={ModifyGroupScreen}
        options={{
          header: (_props) => <Header backButton title={t('modify')} />,
        }}
      />
    </NativeStack.Navigator>
  );
};

const WalletStack = () => {
  return (
    <NativeStack.Navigator>
      <NativeStack.Screen
        name={MainScreens.DashboardScreen}
        component={DashboardScreen}
        options={{
          header: (_props) => <Header title={'Wallet'} />,
        }}
      />
      <NativeStack.Screen
        name={MainScreens.SendTransactionScreen}
        component={SendTransactionScreen}
        options={{
          header: (_props) => (
            <Header
              title={'Send transaction'}
              backButton
            />
          ),
        }}
      />
    </NativeStack.Navigator>
  );
};

// Main Tab Navigator
export const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarHideOnKeyboard: true,
        headerShown: false, // Headers managed within the navigators themselves
      }}
      tabBar={(props) => <MyTabBar {...props} />}
    >
      {/* Groups Tab */}
      <Tab.Screen
        name={MainScreens.GroupsScreen}
        component={GroupsStack}
        options={{
          tabBarLabel: t('rooms'), // Display "Rooms" in the tab bar
        }}
      />
      <Tab.Screen
        name={MainScreens.DashboardScreen}
        component={WalletStack}
        options={{
          tabBarLabel: 'Wallet', // Display "Rooms" in the tab bar
        }}
      />
      {/* Independent Screens */}
      <Tab.Screen
        name={MainScreens.AddGroupScreen}
        component={AddGroupScreen}
        options={{
          header: (_props) => <Header backButton title={t('subscribe')} />,
        }}
      />
      <Tab.Screen
        name={MainScreens.SettingsScreen}
        component={SettingsScreen}
        options={{
          header: (_props) => <Header title={t('settingsTitle')} />,
        }}
      />
      <Tab.Screen
        name={MainScreens.ChangeLanguageScreen}
        component={ChangeLanguageScreen}
        options={{
          header: (_props) => <Header title={t('changeLanguage')} backButton />,
        }}
      />
      <Tab.Screen
        name={MainScreens.UpdateProfileScreen}
        component={UpdateProfileScreen}
        options={{
          header: (_props) => <Header title={t('updateProfile')} backButton />,
        }}
      />
      <Tab.Screen
        name={MainScreens.ChangeThemeScreen}
        component={ChangeThemeScreen}
        options={{
          header: (_props) => <Header title={t('changeTheme')} backButton />,
        }}
      />
    </Tab.Navigator>
  );
};
