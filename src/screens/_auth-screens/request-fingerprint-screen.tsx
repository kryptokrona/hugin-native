import React from 'react';

import { View, Alert } from 'react-native';

import { type RouteProp, useNavigation } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import ReactNativeBiometrics from 'react-native-biometrics';

import { ScreenLayout } from '@/components';
import { AuthScreens, Stacks } from '@/config';
import { setAuthenticated } from '@/services';
import type {
  AuthStackParamList,
  AuthStackNavigationType,
  MainStackNavigationType,
} from '@/types';

interface Props {
  route: RouteProp<
    AuthStackParamList,
    typeof AuthScreens.RequestFingerPrintScreen
  >;
}

export const RequestFingerprintScreen: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation<AuthStackNavigationType>();
  const mainNavigation = useNavigation<MainStackNavigationType>();

  const finishProcess = () => {
    setAuthenticated(true);
    if (route.params?.finishFunction) {
      route.params.finishFunction();
    } else {
      mainNavigation.navigate(Stacks.MainStack); // TODO fix type
    }
  };

  const handleForgotPin = () => {
    navigation.navigate(AuthScreens.ForgotPinScreen);
  };

  const authenticateFingerprint = async () => {
    const rnBiometrics = new ReactNativeBiometrics();

    try {
      const { success } = await rnBiometrics.simplePrompt({
        cancelButtonText: 'Cancel',
        promptMessage: 'Authenticate with Fingerprint',
      });

      if (success) {
        finishProcess();
      } else {
        Alert.alert(
          'Authentication Failed',
          'Fingerprint authentication was not successful.',
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Biometric authentication is not available on this device.',
      );
    }
  };

  // Run fingerprint authentication on mount
  React.useEffect(() => {
    authenticateFingerprint();
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
