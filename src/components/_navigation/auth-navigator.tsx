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
} from 'screens/_auth-screens';

import { AuthScreens, AuthStackParamList } from '@/types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name={AuthScreens.ChooseAuthMethod.name}
        component={ChooseAuthMethodScreen}
      />
      <Stack.Screen
        name={AuthScreens.CreateWallet.name}
        component={CreateWalletScreen}
      />
      <Stack.Screen
        name={AuthScreens.Disclaimer.name}
        component={DisclaimerScreen}
      />
      <Stack.Screen
        name={AuthScreens.ForgotPin.name}
        component={ForgotPinScreen}
      />
      <Stack.Screen
        name={AuthScreens.ImportKeys.name}
        component={ImportKeysScreen}
      />
      <Stack.Screen
        name={AuthScreens.ImportKeysOrSeed.name}
        component={ImportKeysOrSeedScreen}
      />
      <Stack.Screen
        name={AuthScreens.ImportSeed.name}
        component={ImportSeedScreen}
      />
      <Stack.Screen
        name={AuthScreens.ImportWallet.name}
        component={ImportWalletScreen}
      />
      <Stack.Screen
        name={AuthScreens.PickBlockHeight.name}
        component={PickBlockHeightScreen}
      />
      <Stack.Screen
        name={AuthScreens.PickExactBlockHeight.name}
        component={PickExaktBlockHeightScreen}
      />
      <Stack.Screen
        name={AuthScreens.PickMonth.name}
        component={PickMonthScreen}
      />
      <Stack.Screen
        name={AuthScreens.RequestHardwareAuth.name}
        component={RequestHardwareAuthScreen}
      />
      <Stack.Screen
        name={AuthScreens.RequestPin.name}
        component={RequestPinScreen}
      />
      <Stack.Screen name={AuthScreens.SetPin.name} component={SetPinScreen} />
      <Stack.Screen
        name={AuthScreens.WalletOption.name}
        component={WalletOptionScreen}
      />
    </Stack.Navigator>
  );
};
