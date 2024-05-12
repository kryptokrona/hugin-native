import React from 'react';

import {
  type BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';

import {
  MainScreen,
  SettingsScreen,
  TransactionScreen,
  TransferScreen,
} from '@/screens';

import { MyTabBar } from './tab-bar';

const Tab = createBottomTabNavigator();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        tabBar={(props: BottomTabBarProps) => <MyTabBar {...props} />}>
        <Tab.Screen name="Main" component={MainScreen} />
        <Tab.Screen name="Transactions" component={TransactionScreen} />
        <Tab.Screen name="Transfer" component={TransferScreen} />
        {/* <Tab.Screen name="Recipients" component={} /> */}
        {/* <Tab.Screen name="Groups" component={} /> */}
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

// const styles = StyleSheet.create({
//   tabBar: {
//     backgroundColor: 'red',
//   },
// });
