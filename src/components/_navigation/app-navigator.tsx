import React from 'react';

import {
  type BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';

import { TabBar } from '@/types';

import { MainStackNavigator } from './main-navigator';
import { MyTabBar } from './tab-bar';

const Tab = createBottomTabNavigator<any>();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        tabBar={(props: BottomTabBarProps) => <MyTabBar {...props} />}>
        <Tab.Screen name={TabBar.Main.name} component={MainStackNavigator} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};
