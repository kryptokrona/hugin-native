import { AppStackParamList } from '@/types';
import { GroupStackNavigator } from './group-navigator';
import { MyTabBar } from '../tab-bar';
import React from 'react';
import { SettingsStackNavigator } from './settings-navigator';
import { TabBar } from '@/config';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator<AppStackParamList>();

export const AppNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarHideOnKeyboard: true,
      }}
      tabBar={(props) => <MyTabBar {...props} />}>
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
