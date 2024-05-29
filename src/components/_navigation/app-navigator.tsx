import React from 'react';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { TabBar } from '@/types';

import {
  GroupStackNavigator,
  MainStackNavigator,
  SettingsStackNavigator,
  TransactionsStackNavigator,
  TransferStackNavigator,
} from './_stacks';
import { MyTabBar } from './tab-bar';

const Tab = createBottomTabNavigator<any>();

export const AppNavigator = () => {
  return (
    <Tab.Navigator tabBar={(props) => <MyTabBar {...props} />}>
      <Tab.Screen
        name={TabBar.Main}
        component={MainStackNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name={TabBar.Groups}
        component={GroupStackNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name={TabBar.Transfer}
        component={TransferStackNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name={TabBar.Transaction}
        component={TransactionsStackNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name={TabBar.Settings}
        component={SettingsStackNavigator}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
};
