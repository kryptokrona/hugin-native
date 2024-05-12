import { Text } from 'react-native';

import { ScreenLayout } from '@/components';

interface Props {}

export const MainScreen: React.FC<Props> = () => {
  return (
    <ScreenLayout>
      <Text>Main Screen</Text>
      <Text>Main Screen</Text>
    </ScreenLayout>
  );
};
