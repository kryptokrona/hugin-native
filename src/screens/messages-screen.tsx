import { useEffect, useState } from 'react';

import { FlatList } from 'react-native';

import { useNavigation, type RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { Container, PreviewItem, ScreenLayout, TextField } from '@/components';
import { MessagesScreens } from '@/config';
import type {
  Message,
  MessagesStackNavigationType,
  MessagesStackParamList,
} from '@/types';
import { mockMessages } from '@/utils';

interface Props {
  route: RouteProp<
    MessagesStackParamList,
    typeof MessagesScreens.MessagesScreen
  >;
}

export const MessagesScreen: React.FC<Props> = () => {
  const { t } = useTranslation();
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
      {chats.length === 0 && (
        <Container>
          <TextField size="large">{t('noMessages')}</TextField>
        </Container>
      )}
      <FlatList
        data={chats}
        keyExtractor={(item, i) => `${item.hash}-${i}`}
        renderItem={({ item }) => (
          <PreviewItem name={''} roomKey={''} {...item} onPress={onPress} />
        )}
      />
    </ScreenLayout>
  );
};
