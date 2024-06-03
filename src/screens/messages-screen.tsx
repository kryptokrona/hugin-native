import { useEffect, useState } from 'react';

import { FlatList } from 'react-native';

import { useNavigation, type RouteProp } from '@react-navigation/native';

import { PreviewItem, ScreenLayout } from '@/components';
import {
  type Message,
  MessagesScreens,
  type MessagesStackNavigationType,
  type MessagesStackParamList,
} from '@/types';
import { mockMessages } from '@/utils';

interface Props {
  route: RouteProp<
    MessagesStackParamList,
    typeof MessagesScreens.MessagesScreen
  >;
}

export const MessagesScreen: React.FC<Props> = () => {
  const navigation = useNavigation<MessagesStackNavigationType>();
  const [chats, setChats] = useState<Message[]>([]);

  useEffect(() => {
    setChats(mockMessages);
  }, []);

  function onPress(hash: string, name: string) {
    navigation.navigate(MessagesScreens.MessageScreen, {
      user: { hash, name },
    });
  }

  return (
    <ScreenLayout>
      <FlatList
        data={chats}
        keyExtractor={(item, i) => `${item.hash}-${i}`}
        renderItem={({ item }) => <PreviewItem {...item} onPress={onPress} />}
      />
    </ScreenLayout>
  );
};
