import React, { useEffect } from 'react';

import { View, Alert, AppState, AppStateStatus, TouchableOpacity } from 'react-native';

import {
  CommonActions,
  type RouteProp,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import * as Animatable from 'react-native-animatable';
import ReactNativeBiometrics from 'react-native-biometrics';

import { ScreenLayout } from '@/components';
import { AuthScreens, Stacks } from '@/config';
import { setAuthenticated } from '@/services';
import type { AuthStackParamList, MainStackNavigationType } from '@/types';
import { InteractionManager } from 'react-native';
import { sleep, waitForCondition } from '@/utils';
import { navigationRef } from '@/contexts';


interface Props {
  route: RouteProp<
    AuthStackParamList,
    typeof AuthScreens.RequestFingerPrintScreen
  >;
}

export const RequestFingerprintScreen: React.FC<Props> = ({ route }) => {
  const { t } = useTranslation();
  const mainNavigation = useNavigation<MainStackNavigationType>();
  const appState = React.useRef(AppState.currentState);
  const hasPromptedRef = React.useRef(false);
  const isFinishingRef = React.useRef(false);



const finishProcess = async () => {
  if (isFinishingRef.current) return;
  isFinishingRef.current = true;

  setAuthenticated(true);

  if (route.params?.finishFunction) {
    await route.params.finishFunction();
  }
};



  // const handleForgotPin = () => {
  //   navigation.navigate(AuthScreens.ForgotPinScreen);
  // };

  const authenticateBiometric = async () => {
  if (hasPromptedRef.current) {
    console.log('⏭️ Biometric already prompted, skipping');
    return;
  }

  hasPromptedRef.current = true;

  console.log('Invoking authenticateBiometric');

  const rnBiometrics = new ReactNativeBiometrics();

  let result = await rnBiometrics.isSensorAvailable();
  let { available, biometryType } = result;

  let timeouts = 0;
  while (!available && timeouts < 10) {
    await sleep(500);
    result = await rnBiometrics.isSensorAvailable();
    available = result.available;
    biometryType = result.biometryType;
    timeouts++;
  }

  if (!available) return;

  try {
    const { success } = await rnBiometrics.simplePrompt({
      cancelButtonText: t('cancel'),
      promptMessage: t('authenticateBiometric'),
    });

    if (success) {
      await finishProcess();
    } else {
      hasPromptedRef.current = false; // allow retry on manual tap
      Alert.alert(
        t('authenticationFailed'),
        t('authenticationBiometricFailed'),
      );
    }
  } catch (error) {
    hasPromptedRef.current = false; // allow retry
  }
};


  // Run fingerprint authentication on mount

  // useEffect(() => {
  //   console.log('RequestFingerprintScreen mounted');

  //   authenticateBiometric();

  //   return () => {
  //     console.log('RequestFingerprintScreen unmounted');
  //   };
  // }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        hasPromptedRef.current = false;
        authenticateBiometric();
      }
    });

    authenticateBiometric();

    return () => sub.remove();
  }, []);


//   useFocusEffect(
//   React.useCallback(() => {
//     const timeout = setTimeout(() => {
//       authenticateBiometric();
//     }, 100); // small delay to allow UI to settle
//     return () => clearTimeout(timeout);
//   }, [])
// );

  return (
    <ScreenLayout>
      <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
        <TouchableOpacity onPress={authenticateBiometric}>
          <Animatable.Image
            source={require('../../assets/img/fingerprint.png')}
            style={{
              height: 80,
              marginTop: 40,
              resizeMode: 'contain',
              width: 80,
            }}
            animation="pulse"
            easing="ease-out"
            iterationCount="infinite"
            />
        </TouchableOpacity>
        {/* <TextButton onPress={handleForgotPin}>Forgot PIN?</TextButton> */}
      </View>
    </ScreenLayout>
  );
};
