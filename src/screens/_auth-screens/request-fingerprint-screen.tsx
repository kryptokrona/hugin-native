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
import { sleep } from '@/utils';


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


  const finishProcess = () => {
    setAuthenticated(true);
    if (route.params?.finishFunction) {
      route.params.finishFunction();
    } else {
      mainNavigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: Stacks.MainStack }],
        }),
      );
    }
  };

  // const handleForgotPin = () => {
  //   navigation.navigate(AuthScreens.ForgotPinScreen);
  // };

  const authenticateBiometric = async () => {
    console.log('Invoking authenticateBiometric')
    const rnBiometrics = new ReactNativeBiometrics();
    
    let result = await rnBiometrics.isSensorAvailable();
    let { available, biometryType } = result;

    console.log('Available: ', available)

    let timeouts = 0;
    while (!available && timeouts < 10) {
      await sleep(500);
      result = await rnBiometrics.isSensorAvailable();
      available = result.available;
      biometryType = result.biometryType;
      timeouts++;
    }

    if (!available) {
      // Alert.alert(t('error'), t('biometricUnavailable'));
      return;
    }

    try {
      const { success } = await rnBiometrics.simplePrompt({
        cancelButtonText: t('cancel'),
        promptMessage: t('authenticateBiometric'),
      });

      if (success) {
        finishProcess();
      } else {
        Alert.alert(
          t('authenticationFailed'),
          t('authenticationBiometricFailed'),
        );
      }
    } catch (error) {
      // Alert.alert(t('error'), t('authenticationBiometricNA'));
    }
  };

  // Run fingerprint authentication on mount

  useEffect(() => {
    console.log('Invoking useEffect with state', appState.current)
    const onChange = (nextAppState: AppStateStatus) => {
      console.log('Invoking onChange with state', appState.current, '->', nextAppState)
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        authenticateBiometric();
        InteractionManager.runAfterInteractions(() => {
          authenticateBiometric();
        });
      }
      appState.current = nextAppState;
    };

    if (appState.current == 'active') authenticateBiometric();

    const sub = AppState.addEventListener('change', onChange);

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
