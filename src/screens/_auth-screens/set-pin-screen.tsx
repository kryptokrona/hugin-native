import { Text } from 'react-native';

import { RouteProp } from '@react-navigation/native';

import { ScreenLayout } from 'components/screen-layout';
import { AuthStackParamList, AuthScreens } from 'types/navigation';

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
