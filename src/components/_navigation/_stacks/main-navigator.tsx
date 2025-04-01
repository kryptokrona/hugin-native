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
  CallScreen,
  FeedScreen
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
      />
      <NativeStack.Screen
        name={MainScreens.CallScreen}
        component={CallScreen}
        options={{
          header: (_props) => <Header title={t('call')} backButton />,
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
      <NativeStack.Screen
        name={MainScreens.AddGroupScreen}
        component={AddGroupScreen}
        options={{
          header: (_props) => <Header backButton title={t('addRoom')} />,
        }}
      />
    </NativeStack.Navigator>
  );
};

const FeedStack = () => {
  return (
    <NativeStack.Navigator>
      <NativeStack.Screen
        name={MainScreens.FeedScreen}
        component={FeedScreen}
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
        name={MainScreens.CallScreen}
        component={CallScreen}
        options={{
          header: (_props) => <Header title={t('call')} backButton />,
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
      <NativeStack.Screen
        name={MainScreens.PickNodeScreen}
        component={PickNodeScreen}
        options={{
          header: (_props) => <Header title={t('nodePicker')} backButton />,
        }}
      />
    </NativeStack.Navigator>
  );
};

const SettingsStack = () => {
  return (
    <NativeStack.Navigator>
      <NativeStack.Screen
        name={MainScreens.SettingsScreen}
        component={SettingsScreen}
        options={{
          header: (_props) => <Header title={t('settingsTitle')} />,
        }}
      />
      <NativeStack.Screen
        name={MainScreens.ChangeLanguageScreen}
        component={ChangeLanguageScreen}
        options={{
          header: (_props) => <Header title={t('changeLanguage')} backButton />,
        }}
      />
      <NativeStack.Screen
        name={MainScreens.UpdateProfileScreen}
        component={UpdateProfileScreen}
        options={{
          header: (_props) => <Header title={t('updateProfile')} backButton />,
        }}
      />
      <NativeStack.Screen
        name={MainScreens.ChangeThemeScreen}
        component={ChangeThemeScreen}
        options={{
          header: (_props) => <Header title={t('changeTheme')} backButton />,
        }}
      />
      <NativeStack.Screen
        name={MainScreens.PickNodeScreen}
        component={PickNodeScreen}
        options={{
          header: (_props) => <Header title={t('nodePicker')} backButton />,
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
        name={MainScreens.GroupStack}
        component={GroupsStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name={MainScreens.MessageStack}
        component={MessagesStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name={MainScreens.FeedStack}
        component={FeedStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name={MainScreens.WalletStack}
        component={WalletStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name={MainScreens.SettingsStack}
        component={SettingsStack}
        options={{ headerShown: false }}
      />
      {/* Independent Screens */}
    </Tab.Navigator>
  );
};
