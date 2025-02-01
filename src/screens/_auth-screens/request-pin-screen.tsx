import React from 'react';

import { View } from 'react-native';

import { type RouteProp, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { TextButton, Pincode, ScreenLayout } from '@/components';
import { AuthScreens, Stacks } from '@/config';
import { setAuthenticated, usePreferencesStore } from '@/services';
import type { AuthStackParamList, MainStackNavigationType } from '@/types';

interface Props {
  route: RouteProp<AuthStackParamList, typeof AuthScreens.RequestPinScreen>;
}

export const RequestPinScreen: React.FC<Props> = ({ route }) => {
  const { t } = useTranslation();
  const mainNavigation = useNavigation<MainStackNavigationType>();
  const pincode = usePreferencesStore((state) => state.preferences?.pincode);

  const finishProcess = () => {
    setAuthenticated(true);
    if (route.params?.finishFunction) {
      route.params.finishFunction();
    } else {
      mainNavigation.navigate(Stacks.MainStack); // TODO fix type
    }
  };

  // const handleForgotPin = () => {
  //   navigation.navigate(AuthScreens.ForgotPinScreen);
  // };

  const verifyPin = (inputPin: string) => {
    if (pincode === inputPin) {
      console.log({ inputPin, pincode });
      finishProcess();
    } else {
      Toast.show({
        text1: t('invalidPin'),
        text2: t('invalidPinMessage'),
        type: 'error',
      });
    }
  };

  return (
    <ScreenLayout>
      <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
        <Pincode onFinish={verifyPin} />
        <TextButton onPress={() => verifyPin(pincode ?? '')}>
          {t('authenticate')}
        </TextButton>

        {/* <TextButton type="secondary" onPress={handleForgotPin}>
          Forgot PIN?
        </TextButton> */}
      </View>
    </ScreenLayout>
  );
};
