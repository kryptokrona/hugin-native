import React, { useCallback, useLayoutEffect } from 'react';

import { View } from 'react-native';

import { RouteProp, useNavigation } from '@react-navigation/native';

import { Pincode, ScreenLayout } from '@/components';
import { globals } from '@/config';
import { savePreferencesToDatabase } from '@/services';
import {
  AuthStackNavigationType,
  AuthStackParamList,
  AuthScreens,
} from '@/types';

interface Props {
  route: RouteProp<AuthStackParamList, typeof AuthScreens.SetPinScreen>;
}

export const SetPinScreen: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation<AuthStackNavigationType>();

  const continueFunction = useCallback(() => {
    savePreferencesToDatabase(globals.preferences);
    if (route?.params?.nextRoute) {
      navigation.navigate(route.params.nextRoute as keyof AuthStackParamList);
    }
  }, [navigation, route?.params?.nextRoute]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: '' });
  }, [navigation]);

  // const subtitle = `to keep your ${config.coinName} secure`; // TODO

  return (
    <ScreenLayout>
      <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
        <Pincode onFinish={continueFunction} />
      </View>
    </ScreenLayout>
  );
};
