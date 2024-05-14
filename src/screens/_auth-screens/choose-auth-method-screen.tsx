import { Text } from 'react-native';

import { RouteProp } from '@react-navigation/native';

import { AuthScreens, AuthStackParamList } from 'types/navigation';

import { ScreenLayout } from '@/components';

interface Props {
  route: RouteProp<
    AuthStackParamList,
    typeof AuthScreens.ChooseAuthMethod.name
  >;
}
export const ChooseAuthMethodScreen: React.FC<Props> = () => {
  return (
    <ScreenLayout>
      <Text>Choose Auth Method Screen</Text>
    </ScreenLayout>
  );
};
