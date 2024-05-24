import { Text } from 'react-native';

import { RouteProp } from '@react-navigation/native';

import { ScreenLayout } from '@/components';
import type { AuthStackParamList, AuthScreens } from '@/types';

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
