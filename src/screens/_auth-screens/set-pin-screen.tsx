import { Text } from 'react-native';

import { RouteProp } from '@react-navigation/native';

import { ScreenLayout } from '@/components';
import type { AuthStackParamList, AuthScreens } from '@/types';

interface Props {
  route: RouteProp<AuthStackParamList, typeof AuthScreens.SetPin.name>;
}

export const SetPinScreen: React.FC<Props> = () => {
  return (
    <ScreenLayout>
      <Text>Set Pin Screen</Text>
    </ScreenLayout>
  );
};
