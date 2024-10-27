import { RoomStackNavigator, SettingsStackNavigator } from './_stacks';

import { AppStackParamList } from 'types/navigation';
import { MyTabBar } from './tab-bar';
import React from 'react';
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
      {/* <Tab.Screen
        name={TabBar.MainTab.tabName}
        component={MainStackNavigator}
        options={{ headerShown: false }}
      /> */}
      <Tab.Screen
        name={TabBar.RoomsTab.tabName}
        component={RoomStackNavigator}
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
