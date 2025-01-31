import * as Keychain from 'react-native-keychain';

import type { AuthStackNavigationType, AuthStackParamList } from '@/types';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { ScreenLayout, TextButton, TextField } from '@/components';

import { AuthScreens } from '@/config';
import React from 'react';
import { View } from 'react-native';

interface Props {
  route: RouteProp<AuthStackParamList, typeof AuthScreens.ForgotPinScreen>;
}

export const ForgotPinScreen: React.FC<Props> = () => {
  const navigation = useNavigation<AuthStackNavigationType>();

  const resetPinCode = async () => {
    await Keychain.resetGenericPassword();
  };

  const onPress = async () => {
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
      <TextButton onPress={onPress} type="destructive">
        Delete Account
      </TextButton>
    </ScreenLayout>
  );
};
