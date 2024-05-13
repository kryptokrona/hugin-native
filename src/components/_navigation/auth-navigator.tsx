import React from 'react';

import {
  type BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';

import { AuthScreens, AuthStackParamList } from '@/types';

import { MyTabBar } from './tab-bar';

const screens: any[] = [
  // {TestScreen: }
  //  export const AuthScreens = {
  //   {ChooseAuthMethod: },
  //   {CreateWallet: },
  //   {Disclaimer: },
  //   {ForgotPin: },
  //   {ImportKeys: },
  //   {ImportKeysOrSeed: },
  //   {ImportSeed: },
  //   {ImportWallet: },
  //   {PickBlockHeight: },
  //   {PickExactBlockHeight:},
  //   {PickMonth: },
  //   {RequestHardwareAuth:},
  //  { RequestPin: },
  //   SetPin,
  //   {Splash:},
  //  {  WalletOption: }
];

const Tab = createBottomTabNavigator<AuthStackParamList>();

export const AuthNavigator = () => {
  function itemMapper(item: keyof typeof AuthScreens) {
    const screen = AuthScreens[item];
    const key = screen.name;
    const value = screens.find((item) => item[key])![key];

    return <Tab.Screen key={key} name={key} component={value} />;
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        tabBar={(props: BottomTabBarProps) => <MyTabBar {...props} />}>
        {screens.map(itemMapper)}
      </Tab.Navigator>
    </NavigationContainer>
  );
};
