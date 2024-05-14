import { Text } from 'react-native';

import { RouteProp } from '@react-navigation/native';

import { AuthScreens, AuthStackParamList } from 'types/navigation';

import { ScreenLayout } from '@/components';

interface Props {
  route: RouteProp<AuthStackParamList, typeof AuthScreens.CreateWallet.name>;
}
export const CreateWalletScreen: React.FC<Props> = () => {
  return (
    <ScreenLayout>
      <Text>Create wallet Screen</Text>
    </ScreenLayout>
  );
};
