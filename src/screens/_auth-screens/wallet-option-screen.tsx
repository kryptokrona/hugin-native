import { Text } from 'react-native';

import { RouteProp } from '@react-navigation/native';

import { ScreenLayout } from '@/components';
import type { AuthStackParamList, AuthScreens } from '@/types';

interface Props {
  route: RouteProp<AuthStackParamList, typeof AuthScreens.WalletOption.name>;
}

export const WalletOptionScreen: React.FC<Props> = () => {
  return (
    <ScreenLayout>
      <Text>Wallet Option Screen</Text>
    </ScreenLayout>
  );
};
