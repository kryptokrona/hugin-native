import { Text } from 'react-native';

import { RouteProp } from '@react-navigation/native';

import { ScreenLayout } from 'components/screen-layout';
import { AuthStackParamList, AuthScreens } from 'types/navigation';

interface Props {
  route: RouteProp<AuthStackParamList, typeof AuthScreens.RequestPin.name>;
}

export const RequestPinScreen: React.FC<Props> = () => {
  return (
    <ScreenLayout>
      <Text>Request Pin Screen</Text>
    </ScreenLayout>
  );
};
