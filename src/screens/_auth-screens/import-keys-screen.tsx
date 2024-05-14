import { Text } from 'react-native';

import { RouteProp } from '@react-navigation/native';

import { AuthStackParamList, AuthScreens } from 'types/navigation';

import { ScreenLayout } from '@/components';

interface Props {
  route: RouteProp<AuthStackParamList, typeof AuthScreens.ImportKeys.name>;
}

export const ImportKeysScreen: React.FC<Props> = () => {
  return (
    <ScreenLayout>
      <Text>Import Keys Screen</Text>
    </ScreenLayout>
  );
};
