import React from 'react';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { t } from 'i18next';

import { AuthScreens } from '@/config';
import {
  WelcomeScreen,
  CreateAccScreen,
  RequestFingerprintScreen,
  RequestPinScreen,
  RestoreAccountScreen,
} from '@/screens';
import { usePreferencesStore, useUserStore } from '@/services';
import { AuthMethods, type AuthStackParamList } from '@/types';

import { Header } from '../header';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator = () => {
  // const navigation = useNavigation<AuthStackNavigationType>();
  const user = useUserStore((state) => state.user);
  const authMethod = usePreferencesStore(
    (state) => state.preferences.authMethod,
  );
  // const setAuthMethod = usePreferencesStore((state) => state.setAuthMethod);

  // function onRequestPinBackPress() {
  //   setAuthMethod(null);
  //   navigation.navigate(AuthScreens.CreateAccountScreen);
  // }

  let initialRouteName = AuthScreens.CreateAccountScreen;

  if (!user?.address) {
    initialRouteName = AuthScreens.WelcomeScreen;
  } else {
    if (authMethod === AuthMethods.pincode) {
      initialRouteName = AuthScreens.RequestPinScreen;
    }
    if (authMethod === AuthMethods.bioMetric) {
      initialRouteName = AuthScreens.RequestFingerPrintScreen;
    }
    // if(authMethod === AuthMethods.reckless){
    //   initialRouteName = AuthScreens.CreateAccountScreen;
    // }
  }

  return (
    <Stack.Navigator initialRouteName={initialRouteName}>
      <Stack.Screen
        name={AuthScreens.RequestPinScreen}
        component={RequestPinScreen}
        options={() => ({
          header: (_props) => <Header title={t('requestPin')} />,
        })}
      />
      <Stack.Screen
        name={AuthScreens.RequestFingerPrintScreen}
        component={RequestFingerprintScreen}
        options={() => ({
          header: (_props) => <Header title={t('requestFingerPrint')} />,
        })}
      />
      <Stack.Screen
        name={AuthScreens.CreateAccountScreen}
        component={CreateAccScreen}
        options={() => ({
          header: (_props) => <Header title={t('createProfile')} />,
        })}
      />
      <Stack.Screen
        name={AuthScreens.WelcomeScreen}
        component={WelcomeScreen}
      />
      <Stack.Screen
        name={AuthScreens.RestoreAccountScreen}
        component={RestoreAccountScreen}
        options={() => ({
          header: (_props) => <Header title={t('restoreAccount')} />,
        })}
      />
    </Stack.Navigator>
  );
};
