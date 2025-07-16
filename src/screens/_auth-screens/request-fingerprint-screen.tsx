import React, { useEffect } from 'react';

import { View, Alert, AppState, AppStateStatus } from 'react-native';

import {
  CommonActions,
  type RouteProp,
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
    const rnBiometrics = new ReactNativeBiometrics();

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
      Alert.alert(t('error'), t('authenticationBiometricNA'));
    }
  };

  // Run fingerprint authentication on mount

  useEffect(() => {
    const onChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
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

  return (
    <ScreenLayout>
      <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
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
        {/* <TextButton onPress={handleForgotPin}>Forgot PIN?</TextButton> */}
      </View>
    </ScreenLayout>
  );
};
