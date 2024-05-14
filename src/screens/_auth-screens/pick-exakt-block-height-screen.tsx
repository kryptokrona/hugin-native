import { Text } from 'react-native';

import { RouteProp } from '@react-navigation/native';

import { ScreenLayout } from 'components/screen-layout';
import { AuthStackParamList, AuthScreens } from 'types/navigation';

interface Props {
  route: RouteProp<
    AuthStackParamList,
    typeof AuthScreens.PickExactBlockHeight.name
  >;
}

export const PickExaktBlockHeightScreen: React.FC<Props> = () => {
  return (
    <ScreenLayout>
      <Text>Pick Exakt Block Height Screen</Text>
    </ScreenLayout>
  );
};
