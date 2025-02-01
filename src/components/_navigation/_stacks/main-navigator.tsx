import {
  AddGroupScreen,
  ChangeLanguageScreen,
  ChangeThemeScreen,
  DashboardScreen,
  GroupChatScreen,
  GroupsScreen,
  MessageScreen,
  MessagesScreen,
  ModifyContactScreen,
  ModifyGroupScreen,
  PickNodeScreen,
  SendTransactionScreen,
  SettingsScreen,
  UpdateProfileScreen,
  WalletStatusScreen,
} from '@/screens';

import { Header } from '../header';
import { MainNavigationParamList } from '@/types';
import { MainScreens } from '@/config';
import { MyTabBar } from '../tab-bar';
import React from 'react';
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
          header: (_props) => <Header title={'Untitled'} backButton />,
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

const MessagesStack = () => {
  return (
    <NativeStack.Navigator>
      <NativeStack.Screen
        name={MainScreens.MessagesScreen}
        component={MessagesScreen}
        options={{
          header: (_props) => <Header title={t('messages')} />,
        }}
      />
      <NativeStack.Screen
        name={MainScreens.MessageScreen}
        component={MessageScreen}
        options={{
          header: (_props) => <Header title={'Untitled'} backButton />,
        }}
      />
      <NativeStack.Screen
        name={MainScreens.ModifyContactScreen}
        component={ModifyContactScreen}
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
      />
      <NativeStack.Screen
        name={MainScreens.SendTransactionScreen}
        component={SendTransactionScreen}
        options={{
          header: (_props) => (
            <Header title={t('sendTransaction')} backButton />
          ),
        }}
      />
      <NativeStack.Screen
        name={MainScreens.WalletStatusScreen}
        component={WalletStatusScreen}
        options={{
          header: (_props) => <Header title={t('walletStatus')} backButton />,
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
        // headerShown: false,
        tabBarHideOnKeyboard: true, // Headers managed within the navigators themselves
      }}
      tabBar={(props) => <MyTabBar {...props} />}>
      {/* Groups Tab */}
      <Tab.Screen
        name={MainScreens.GroupsScreen}
        component={GroupsStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name={MainScreens.MessagesScreen}
        component={MessagesStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name={MainScreens.DashboardScreen}
        component={WalletStack}
        options={{ headerShown: false }}
      />
      {/* Independent Screens */}
      <Tab.Screen
        name={MainScreens.AddGroupScreen}
        component={AddGroupScreen}
        options={{
          header: (_props) => <Header backButton title={t('addRoom')} />,
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
      <Tab.Screen
        name={MainScreens.PickNodeScreen}
        component={PickNodeScreen}
        options={{
          header: (_props) => <Header title={t('nodePicker')} backButton />,
        }}
      />
    </Tab.Navigator>
  );
};
