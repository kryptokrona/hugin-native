import React from 'react';

import { FlatList } from 'react-native';

import { useNavigation, type RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { Container, PreviewItem, ScreenLayout, TextField } from '@/components';
import { GroupsScreens } from '@/config';
import {
  setRoomMessages,
  setStoreCurrentRoom,
  useGlobalStore,
} from '@/services';
import type { GroupStackNavigationType, GroupStackParamList } from '@/types';

interface Props {
  route: RouteProp<GroupStackParamList, typeof GroupsScreens.GroupsScreen>;
}

export const GroupsScreen: React.FC<Props> = () => {
  //TODO** rename Groups -> Rooms
  const { t } = useTranslation();
  const navigation = useNavigation<GroupStackNavigationType>();
  const rooms = useGlobalStore((state) => state.rooms);
  async function onPress(roomKey: string, name: string) {
    await setRoomMessages(roomKey, 0);
    setStoreCurrentRoom(roomKey);
    navigation.navigate(GroupsScreens.GroupChatScreen, { name, roomKey });
  }

  return (
    <ScreenLayout>
      {rooms.length === 0 && (
        <Container>
          <TextField size="large">{t('emptyAddressBook')}</TextField>
        </Container>
      )}
      <FlatList
        data={rooms}
        keyExtractor={(item, i) => `${item.roomKey}-${i}`}
        renderItem={({ item }) => <PreviewItem {...item} onPress={onPress} />}
      />
    </ScreenLayout>
  );
};
