import React, { useLayoutEffect } from 'react';

import { View, Alert } from 'react-native';

import { type RouteProp, useNavigation } from '@react-navigation/native';
import * as Keychain from 'react-native-keychain';

import { Button, Pincode, ScreenLayout } from '@/components';
import {
  type AuthStackParamList,
  AuthScreens,
  type AuthStackNavigationType,
} from '@/types';

interface Props {
  route: RouteProp<AuthStackParamList, typeof AuthScreens.RequestPinScreen>;
}

export const RequestPinScreen: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation<AuthStackNavigationType>();

  useLayoutEffect(() => {
    navigation.setOptions({ title: '' });
  }, [navigation]);

  const finishProcess = () => {
    route.params?.finishFunction(navigation);
  };

  const handleForgotPin = () => {
    navigation.navigate(AuthScreens.ForgotPinScreen);
  };

  const verifyPin = async (inputPin: string) => {
    const credentials = await Keychain.getGenericPassword();
    if (credentials && credentials.password === inputPin) {
      finishProcess();
    } else {
      Alert.alert('Invalid PIN', 'The PIN you entered is incorrect.');
    }
  };

  return (
    <ScreenLayout>
      <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
        <Pincode onFinish={verifyPin} />
        <Button onPress={handleForgotPin}>Forgot PIN?</Button>
      </View>
    </ScreenLayout>
  );
};
