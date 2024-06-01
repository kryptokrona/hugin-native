import { useEffect, useState } from 'react';

import { FlatList } from 'react-native';

import { type RouteProp } from '@react-navigation/native';

import { MessagePreviewItem, ScreenLayout } from '@/components';
import type {
  MessagesScreens,
  MessagesStackParamList,
  PreviewChat,
} from '@/types';
import { mockChats } from '@/utils';

interface Props {
  route: RouteProp<
    MessagesStackParamList,
    typeof MessagesScreens.MessagesScreen
  >;
}

export const MessagesScreen: React.FC<Props> = () => {
  const [chats, setChats] = useState<PreviewChat[]>([]);

  useEffect(() => {
    setChats(mockChats);
  }, []);

  return (
    <ScreenLayout>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessagePreviewItem {...item} />}
      />
    </ScreenLayout>
  );
};
