import React from 'react';

import {
  type BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';

import {
  GroupsScreen,
  MainScreen,
  RecipientsScreen,
  SettingsScreen,
  TransactionScreen,
  TransferScreen,
} from '@/screens';
import { MainScreens, type MainStackParamList } from '@/types';

import { MyTabBar } from './tab-bar';

const screens: any[] = [
  { Groups: GroupsScreen },
  { Main: MainScreen },
  { Recipients: RecipientsScreen },
  { Settings: SettingsScreen },
  { Transactions: TransactionScreen },
  { Transfer: TransferScreen },
];

const Tab = createBottomTabNavigator<MainStackParamList>();

export const MainNavigator = () => {
  function itemMapper(item: keyof typeof MainScreens) {
    const screen = MainScreens[item];
    const key = screen.name;
    const value = screens.find((item) => item[key])![key];

    return <Tab.Screen key={key} name={key} component={value} />;
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        tabBar={(props: BottomTabBarProps) => <MyTabBar {...props} />}>
        {/* {screens.map(itemMapper)} */}
        <Tab.Screen name="Main" component={MainScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};
