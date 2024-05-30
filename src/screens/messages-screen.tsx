import { Text } from 'react-native';

import { type RouteProp } from '@react-navigation/native';

import { ScreenLayout } from '@/components';
import type { MessagesScreens, MessagesStackParamList } from '@/types';

interface Props {
  route: RouteProp<
    MessagesStackParamList,
    typeof MessagesScreens.MessageScreen
  >;
}
export const MessagesScreen: React.FC<Props> = () => {
  return (
    <ScreenLayout>
      <Text>Messages</Text>
    </ScreenLayout>
  );
};
