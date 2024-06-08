import { Text } from 'react-native';

import { ScreenLayout } from '@/components';

interface Props {}

export const TransactionScreen: React.FC<Props> = () => {
  return (
    <ScreenLayout>
      <Text>Transaction Screen</Text>
    </ScreenLayout>
  );
};
