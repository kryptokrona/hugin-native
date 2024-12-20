import React, { useLayoutEffect } from 'react';

import { View, Alert } from 'react-native';

import { type RouteProp, useNavigation } from '@react-navigation/native';

import { TextButton, Pincode, ScreenLayout } from '@/components';
import { AuthScreens, Stacks } from '@/config';
import { setAuthenticated, usePreferencesStore } from '@/services';
import type {
  AuthStackParamList,
  AuthStackNavigationType,
  MainStackNavigationType,
} from '@/types';

interface Props {
  route: RouteProp<AuthStackParamList, typeof AuthScreens.RequestPinScreen>;
}

export const RequestPinScreen: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation<AuthStackNavigationType>();
  const mainNavigation = useNavigation<MainStackNavigationType>();
  const pincode = usePreferencesStore((state) => state.preferences?.pincode);
  useLayoutEffect(() => {
    navigation.setOptions({ title: '' });
  }, [navigation]);

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

  const verifyPin = (inputPin: string) => {
    if (pincode === inputPin) {
      console.log({ inputPin, pincode });
      finishProcess();
    } else {
      Alert.alert('Invalid PIN', 'The PIN you entered is incorrect.');
    }
  };

  return (
    <ScreenLayout>
      <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
        <Pincode onFinish={verifyPin} />
        <TextButton onPress={() => verifyPin(pincode ?? '')}>
          Authenticate
        </TextButton>

        {/* <TextButton type="secondary" onPress={handleForgotPin}>
          Forgot PIN?
        </TextButton> */}
      </View>
    </ScreenLayout>
  );
};
