import React, { useState } from 'react';

import { StyleSheet, View } from 'react-native';

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
  const [pinOK, setPinOk] = useState(false);

  const finishProcess = () => {
    setAuthenticated(true);
  };

  const verifyPin = (inputPin: string) => {
    if (pincode === inputPin) {
      console.log({ inputPin, pincode });
      setPinOk(true);
      finishProcess();
    } else {
      setPinOk(false);
      Toast.show({
        text1: t('invalidPin'),
        text2: t('invalidPinMessage'),
        type: 'error',
      });
    }
  };

  return (
    <ScreenLayout>
      <View style={styles.container}>
        <Pincode focusMode onFinish={verifyPin} />
        <TextButton
          style={styles.btn}
          disabled={!pinOK}
          onPress={finishProcess}>
          {t('authenticate')}
        </TextButton>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  btn: {
    marginTop: 20,
  },
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
