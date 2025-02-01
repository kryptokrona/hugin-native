import * as Keychain from 'react-native-keychain';

import type { AuthStackNavigationType, AuthStackParamList } from '@/types';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { ScreenLayout, TextButton, TextField } from '@/components';

import { AuthScreens } from '@/config';
import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

interface Props {
  route: RouteProp<AuthStackParamList, typeof AuthScreens.ForgotPinScreen>;
}

export const ForgotPinScreen: React.FC<Props> = () => {
  const { t } = useTranslation();
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
        <TextField size="large">{t('forgotPinText1')}</TextField>
        <TextField size="large">{t('forgotPinText2')}</TextField>
      </View>
      <TextButton onPress={onPress} type="destructive">
        {t('deleteAccount')}
      </TextButton>
    </ScreenLayout>
  );
};
