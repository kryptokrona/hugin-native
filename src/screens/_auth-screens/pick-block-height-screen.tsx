import { Text } from 'react-native';

import { RouteProp } from '@react-navigation/native';

import { ScreenLayout } from 'components/screen-layout';
import { AuthStackParamList, AuthScreens } from 'types/navigation';

interface Props {
  route: RouteProp<AuthStackParamList, typeof AuthScreens.PickBlockHeight.name>;
}

export const PickBlockHeightScreen: React.FC<Props> = () => {
  return (
    <ScreenLayout>
      <Text>Pick Block Height Screen</Text>
    </ScreenLayout>
  );
};
