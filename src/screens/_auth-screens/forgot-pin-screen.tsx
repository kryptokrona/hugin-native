import React from 'react';

import { View } from 'react-native';

import { RouteProp, useNavigation } from '@react-navigation/native';
import * as Keychain from 'react-native-keychain';

import { Button, ScreenLayout, TextField } from '@/components';
import { globals } from '@/config';
import {
  AuthStackParamList,
  AuthScreens,
  AuthStackNavigationType,
} from '@/types';

interface Props {
  route: RouteProp<AuthStackParamList, typeof AuthScreens.ForgotPinScreen>;
}

export const ForgotPinScreen: React.FC<Props> = () => {
  const navigation = useNavigation<AuthStackNavigationType>();

  const resetPinCode = async () => {
    await Keychain.resetGenericPassword();
  };

  const onPress = async () => {
    globals.reset();
    await resetPinCode();

    navigation.navigate(AuthScreens.SplashScreen);
    navigation.reset({
      index: 0,
      routes: [{ name: AuthScreens.SplashScreen }],
    });

    /* Can't use navigateWithDisabledBack between routes, but don't
       want to be able to go back to previous screen...
       Navigate to splash, then once on that route, reset the
      stack. */
  };

  return (
    <ScreenLayout>
      <View
        style={{
          alignItems: 'flex-start',
          flex: 1,
          justifyContent: 'flex-start',
          marginTop: 60,
        }}>
        <TextField size="large">
          Your account is encrypted with your pin, so unfortunately, if you have
          forgotten your pin, it cannot be recovered.
        </TextField>
        <TextField size="large">
          However, you can delete your account if you wish to create a new one.
        </TextField>
      </View>

      <Button onPress={onPress} type="error">
        Delete Account
      </Button>
    </ScreenLayout>
  );
};
