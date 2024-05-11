import { Text } from 'react-native';

import { ScreenLayout } from '@/components';

interface Props {}

export const SettingsScreen: React.FC<Props> = () => {
  return (
    <ScreenLayout>
      <Text>Settings Screen</Text>
    </ScreenLayout>
  );
};
