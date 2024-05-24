import { Text } from 'react-native';

import { RouteProp } from '@react-navigation/native';

import { ScreenLayout } from '@/components';
import type { AuthStackParamList, AuthScreens } from '@/types';

interface Props {
  route: RouteProp<
    AuthStackParamList,
    typeof AuthScreens.RequestHardwareAuth.name
  >;
}

export const RequestHardwareAuthScreen: React.FC<Props> = () => {
  return (
    <ScreenLayout>
      <Text>Request Hardware Auth Screen</Text>
    </ScreenLayout>
  );
};
