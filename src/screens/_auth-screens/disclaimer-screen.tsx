import { Text } from 'react-native';

import { RouteProp } from '@react-navigation/native';

import { AuthScreens, AuthStackParamList } from 'types/navigation';

import { ScreenLayout } from '@/components';

interface Props {
  route: RouteProp<AuthStackParamList, typeof AuthScreens.Disclaimer.name>;
}
export const DisclaimerScreen: React.FC<Props> = () => {
  return (
    <ScreenLayout>
      <Text>Disclaimer Screen</Text>
    </ScreenLayout>
  );
};
