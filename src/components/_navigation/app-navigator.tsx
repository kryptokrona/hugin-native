import React from 'react';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { TabBar } from '@/types';

import { MainStackNavigator } from './main-navigator';
import { MyTabBar } from './tab-bar';

const Tab = createBottomTabNavigator<any>();

export const AppNavigator = () => {
  return (
    <Tab.Navigator tabBar={(props) => <MyTabBar {...props} />}>
      <Tab.Screen name={TabBar.Main.name} component={MainStackNavigator} />
    </Tab.Navigator>
  );
};
