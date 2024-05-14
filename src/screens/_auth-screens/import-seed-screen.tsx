import { Text } from 'react-native';

import { RouteProp } from '@react-navigation/native';

import { ScreenLayout } from 'components/screen-layout';
import { AuthStackParamList, AuthScreens } from 'types/navigation';

interface Props {
  route: RouteProp<AuthStackParamList, typeof AuthScreens.ImportSeed.name>;
}

export const ImportSeedScreen: React.FC<Props> = () => {
  return (
    <ScreenLayout>
      <Text>Import Seed Screen</Text>
    </ScreenLayout>
  );
};
