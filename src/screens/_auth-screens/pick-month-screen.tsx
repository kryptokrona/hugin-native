import { Text } from 'react-native';

import { RouteProp } from '@react-navigation/native';

import { ScreenLayout } from '@/components';
import type { AuthStackParamList, AuthScreens } from '@/types';

interface Props {
  route: RouteProp<AuthStackParamList, typeof AuthScreens.PickMonth.name>;
}

export const PickMonthScreen: React.FC<Props> = () => {
  return (
    <ScreenLayout>
      <Text>Pick Month Screen</Text>
    </ScreenLayout>
  );
};
