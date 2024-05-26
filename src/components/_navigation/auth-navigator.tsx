import React from 'react';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  ChooseAuthMethodScreen,
  CreateWalletScreen,
  DisclaimerScreen,
  ForgotPinScreen,
  ImportKeysOrSeedScreen,
  ImportKeysScreen,
  ImportSeedScreen,
  ImportWalletScreen,
  PickBlockHeightScreen,
  PickExaktBlockHeightScreen,
  PickMonthScreen,
  RequestHardwareAuthScreen,
  RequestPinScreen,
  SetPinScreen,
  WalletOptionScreen,
} from '@/screens';
import { AuthScreens, AuthStackParamList } from '@/types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name={AuthScreens.ChooseAuthMethodScreen}
        component={ChooseAuthMethodScreen}
      />
      <Stack.Screen
        name={AuthScreens.CreateWalletScreen}
        component={CreateWalletScreen}
      />
      <Stack.Screen
        name={AuthScreens.DisclaimerScreen}
        component={DisclaimerScreen}
      />
      <Stack.Screen
        name={AuthScreens.ForgotPinScreen}
        component={ForgotPinScreen}
      />
      <Stack.Screen
        name={AuthScreens.ImportKeysScreen}
        component={ImportKeysScreen}
      />
      <Stack.Screen
        name={AuthScreens.ImportKeysOrSeedScreen}
        component={ImportKeysOrSeedScreen}
      />
      <Stack.Screen
        name={AuthScreens.ImportSeedScreen}
        component={ImportSeedScreen}
      />
      <Stack.Screen
        name={AuthScreens.ImportWalletScreen}
        component={ImportWalletScreen}
      />
      <Stack.Screen
        name={AuthScreens.PickBlockHeightScreen}
        component={PickBlockHeightScreen}
      />
      <Stack.Screen
        name={AuthScreens.PickExactBlockHeightScreen}
        component={PickExaktBlockHeightScreen}
      />
      <Stack.Screen
        name={AuthScreens.PickMonthScreen}
        component={PickMonthScreen}
      />
      <Stack.Screen
        name={AuthScreens.RequestHardwareAuthScreen}
        component={RequestHardwareAuthScreen}
      />
      <Stack.Screen
        name={AuthScreens.RequestPinScreen}
        component={RequestPinScreen}
      />
      <Stack.Screen name={AuthScreens.SetPinScreen} component={SetPinScreen} />
      <Stack.Screen
        name={AuthScreens.WalletOptionScreen}
        component={WalletOptionScreen}
      />
    </Stack.Navigator>
  );
};
