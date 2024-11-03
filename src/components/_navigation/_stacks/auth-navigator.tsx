import {
  CreateAccScreen,
  RequestFingerprintScreen,
  RequestPinScreen,
} from '@/screens';

import { AuthScreens } from '@/config';
import {
  AuthMethods,
  AuthStackNavigationType,
  type AuthStackParamList,
} from '@/types';
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { usePreferencesStore, useUserStore } from '@/services';
import { Header } from '../header';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<AuthStackNavigationType>();
  const user = useUserStore((state) => state.user);
  const authMethod = usePreferencesStore(
    (state) => state.preferences.authMethod,
  );
  const setAuthMethod = usePreferencesStore((state) => state.setAuthMethod);

  function onRequestPinBackPress() {
    setAuthMethod(null);
    navigation.navigate(AuthScreens.CreateAccountScreen);
  }

  let initialRouteName = AuthScreens.CreateAccountScreen;

  if (!user?.address) {
    initialRouteName = AuthScreens.RequestPinScreen;
  } else {
    if (authMethod === AuthMethods.pincode) {
      initialRouteName = AuthScreens.SetPinScreen;
    }
    if (authMethod === AuthMethods.bioMetric) {
      initialRouteName = AuthScreens.RequestFingerPrintScreen;
    }
  }

  return (
    <Stack.Navigator initialRouteName={initialRouteName}>
      <Stack.Screen
        name={AuthScreens.CreateAccountScreen}
        component={CreateAccScreen}
      />
      <Stack.Screen
        name={AuthScreens.RequestPinScreen}
        component={RequestPinScreen}
        options={() => ({
          header: (_props) => (
            <Header backButton onBackPress={onRequestPinBackPress} />
          ),
        })}
      />
      <Stack.Screen
        name={AuthScreens.RequestFingerPrintScreen}
        component={RequestFingerprintScreen}
        options={() => ({
          header: (_props) => (
            <Header backButton onBackPress={onRequestPinBackPress} />
          ),
        })}
      />
    </Stack.Navigator>
  );
};
