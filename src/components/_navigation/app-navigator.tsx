import React from 'react';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { AppStackParamList } from 'types/navigation';

import { TabBar } from '@/config';

import { GroupStackNavigator, SettingsStackNavigator } from './_stacks';
import { MyTabBar } from './tab-bar';

const Tab = createBottomTabNavigator<AppStackParamList>();

export const AppNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarHideOnKeyboard: true,
      }}
      tabBar={(props) => <MyTabBar {...props} />}>
      {/* <Tab.Screen
        name={TabBar.MainTab.tabName}
        component={MainStackNavigator}
        options={{ headerShown: false }}
      /> */}
      <Tab.Screen
        name={TabBar.GroupsTab.tabName}
        component={GroupStackNavigator}
        options={{ headerShown: false }}
      />
      {/* <Tab.Screen
        name={TabBar.MessagesTab.tabName}
        component={MessagesStackNavigator}
        options={{ headerShown: false }}
      /> */}
      <Tab.Screen
        name={TabBar.SettingsTab.tabName}
        component={SettingsStackNavigator}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
};
