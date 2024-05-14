import React from 'react';

import {
  type BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';

import { MainScreens, type MainStackParamList } from '@/types';

import { MainStackNavigator } from './stack-main';
import { MyTabBar } from './tab-bar';

const Tab = createBottomTabNavigator<MainStackParamList>();

export const MainNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        tabBar={(props: BottomTabBarProps) => <MyTabBar {...props} />}>
        <Tab.Screen
          name={MainScreens.Groups.name}
          component={GroupStackNavigator}
        />
        <Tab.Screen
          name={MainScreens.Main.name}
          component={MainStackNavigator}
        />
        <Tab.Screen
          name={MainScreens.Recipients.name}
          component={RecipientStackNavigator}
        />
        <Tab.Screen
          name={MainScreens.Settings.name}
          component={SettingsStackNavigator}
        />
        <Tab.Screen
          name={MainScreens.Transactions.name}
          component={TransactionStackNavigator}
        />
        <Tab.Screen
          name={MainScreens.Transfer.name}
          component={TransferStackNavigator}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};
