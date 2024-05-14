import { Text } from 'react-native';

import { RouteProp } from '@react-navigation/native';

import { ScreenLayout } from 'components/screen-layout';
import { AuthStackParamList, AuthScreens } from 'types/navigation';

interface Props {
  route: RouteProp<
    AuthStackParamList,
    typeof AuthScreens.ImportKeysOrSeed.name
  >;
}

export const ImportKeysOrSeedScreen: React.FC<Props> = () => {
  return (
    <ScreenLayout>
      <Text>Import Keys Or Seed Screen</Text>
    </ScreenLayout>
  );
};
