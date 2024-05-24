import { Text } from 'react-native';

import { RouteProp } from '@react-navigation/native';

import { ScreenLayout } from '@/components';
import type { AuthStackParamList, AuthScreens } from '@/types';

interface Props {
  route: RouteProp<AuthStackParamList, typeof AuthScreens.ForgotPin.name>;
}

export const ForgotPinScreen: React.FC<Props> = () => {
  return (
    <ScreenLayout>
      <Text>Forgot Pin Screen</Text>
    </ScreenLayout>
  );
};
