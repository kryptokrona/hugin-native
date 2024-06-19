import { useCallback, useEffect } from 'react';

import { Alert, Platform, View } from 'react-native';

import { RouteProp, useNavigation } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import ReactNativeBiometrics, { TouchID } from 'react-native-biometrics';

import { TextButton, ScreenLayout, TextField, XKRLogo } from '@/components';
import { AuthScreens } from '@/config';
import type { AuthStackParamList, AuthStackNavigationType } from '@/types';

const authErrorToHumanError = new Map([
  ['AuthenticationNotMatch', 'Fingerprint does not match stored fingerprint.'],
  ['AuthenticationFailed', 'Fingerprint does not match stored fingerprint.'],
  ['UserCancel', 'Authentication was cancelled.'],
  ['UserFallback', 'Authentication was cancelled.'],
  ['SystemCancel', 'Authentication was cancelled by the system.'],
  ['PasscodeNotSet', 'No fingerprints have been registered.'],
  [
    'FingerprintScannerNotAvailable',
    'This device does not support fingerprint scanning.',
  ],
  ['FingerprintScannerNotEnrolled', 'No fingerprints have been registered.'],
  [
    'FingerprintScannerUnknownError',
    'Failed to authenticate for an unknown reason.',
  ],
  [
    'FingerprintScannerNotSupported',
    'This device does not support fingerprint scanning.',
  ],
  ['DeviceLocked', 'Authentication failed too many times.'],
]);

interface Props {
  route: RouteProp<
    AuthStackParamList,
    typeof AuthScreens.RequestHardwareAuthScreen
  >;
}

export const RequestHardwareAuthScreen: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation<AuthStackNavigationType>();

  useEffect(() => {
    auth();

    return () => {
      // Cleanup if necessary
    };
  }, []);

  const onAuthAttempt = useCallback(
    (error: any) => {
      const detailedError =
        authErrorToHumanError.get(error.name) ?? error.message;

      const usePinInsteadErrors = [
        'UserCancel',
        'UserFallback',
        'SystemCancel',
        'PasscodeNotSet',
        'FingerprintScannerNotAvailable',
        'FingerprintScannerNotEnrolled',
        'FingerprintScannerUnknownError',
        'FingerprintScannerNotSupported',
        'DeviceLocked',
      ];

      if (usePinInsteadErrors.includes(error.name)) {
        Alert.alert(
          'Failed ' + route.params?.subtitle,
          `${detailedError} Please use PIN Auth instead.`,
          [
            {
              onPress: () => {
                navigation.navigate(AuthScreens.RequestPinScreen, {
                  finishFunction: route.params?.finishFunction,
                  subtitle: route.params?.subtitle,
                });
              },
              text: 'OK',
            },
          ],
        );
      } else {
        Alert.alert(
          'Failed ' + route.params?.subtitle,
          `Please try again (Error: ${detailedError})`,
          [
            {
              onPress: () => {
                auth();
              },
              text: 'OK',
            },
          ],
        );
      }
    },
    [navigation, route.params?.subtitle, route.params?.finishFunction],
  );

  const auth = async () => {
    const rnBiometrics = new ReactNativeBiometrics();
    try {
      const { available, biometryType } =
        await rnBiometrics.isSensorAvailable();

      if (available && biometryType === TouchID) {
        const { success } = await rnBiometrics.simplePrompt({
          promptMessage: 'Confirm fingerprint',
        });
        if (success) {
          route.params?.finishFunction(navigation);
        } else {
          onAuthAttempt(new Error('AuthenticationFailed'));
        }
      } else {
        onAuthAttempt(new Error('FingerprintScannerNotAvailable'));
      }
    } catch (error) {
      onAuthAttempt(error);
    }
  };

  const onPress = () => {
    navigation.navigate(AuthScreens.RequestPinScreen, {
      finishFunction: route.params?.finishFunction,
      subtitle: route.params?.subtitle,
    });
  };

  return (
    <ScreenLayout>
      {Platform.OS === 'android' && (
        <View
          style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
          <View
            style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
            <XKRLogo />

            <TextField type="inverted" size="large">
              {`
             Touch the fingerprint sensor{' '}
             `}
              {/* ${this.props.navigation.state.params.subtitle} */}
              {/* // TODO */}
            </TextField>

            <Animatable.Image
              source={require('../../assets/img/fingerprint.png')}
              style={{
                height: 80,
                justifyContent: 'flex-end',
                marginTop: 40,
                resizeMode: 'contain',
                width: 80,
              }}
              animation="pulse"
              easing="ease-out"
              iterationCount="infinite"
            />
          </View>

          <View style={{ bottom: 20, position: 'absolute', width: '100%' }}>
            <TextButton onPress={onPress} type="inverted">
              Or enter your PIN
            </TextButton>
          </View>
        </View>
      )}
    </ScreenLayout>
  );
};
