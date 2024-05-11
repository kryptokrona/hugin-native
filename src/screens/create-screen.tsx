import { Text } from 'react-native';

import { ScreenLayout } from '@/components';

interface Props {}

export const CreateScreen: React.FC<Props> = () => {
  return (
    <ScreenLayout>
      <Text>Create Screen</Text>
    </ScreenLayout>
  );
};
