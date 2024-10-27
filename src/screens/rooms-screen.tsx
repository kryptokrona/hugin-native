import React, { useLayoutEffect, useState } from 'react';

import { FlatList, TouchableOpacity, View } from 'react-native';

import { useNavigation, type RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import {
  Container,
  CustomIcon,
  Header,
  ModalCenter,
  PreviewItem,
  ScreenLayout,
  TextButton,
  TextField,
} from '@/components';
import { RoomsScreens } from '@/config';
import {
  setRoomMessages,
  setStoreCurrentRoom,
  useGlobalStore,
} from '@/services';
import type { RoomStackNavigationType, RoomStackParamList } from '@/types';

interface Props {
  route: RouteProp<RoomStackParamList, typeof RoomsScreens.RoomScreens>;
}

export const RoomScreens: React.FC<Props> = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<RoomStackNavigationType>();
  const rooms = useGlobalStore((state) => state.rooms);
  const [modalVisible, setModalVisible] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <Header
          backButton
          title={t('rooms')}
          right={
            <TouchableOpacity onPress={onAddRoomPress}>
              <CustomIcon type="IO" name="add-outline" size={30} />
            </TouchableOpacity>
          }
        />
      ),
    });
  }, [navigation]);

  function onAddRoomPress() {
    setModalVisible(true);
  }

  async function onPress(roomKey: string, name: string) {
    await setRoomMessages(roomKey, 0);
    setStoreCurrentRoom(roomKey);
    navigation.navigate(RoomsScreens.RoomChatScreen, { name, roomKey });
  }

  function onCloseModal() {
    setModalVisible(false);
  }

  function onJoinRoom() {
    setModalVisible(false);
    navigation.navigate(RoomsScreens.AddRoomScreen, {
      joining: true,
    });
  }

  function onCreateRoom() {
    setModalVisible(false);
    navigation.navigate(RoomsScreens.AddRoomScreen, {
      joining: false,
    });
  }

  return (
    <ScreenLayout>
      <ModalCenter visible={modalVisible} closeModal={onCloseModal}>
        <View>
          <TextField size="small">{t('createRoomDescr')}</TextField>
          <TextButton onPress={onCreateRoom}>{t('createRoom')}</TextButton>
          <View style={styles.divider} />
          <TextField size="small">{t('joinRoomDescr')}</TextField>
          <TextButton onPress={onJoinRoom}>{t('joinRoom')}</TextButton>
        </View>
      </ModalCenter>
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

const styles = {
  divider: {
    marginVertical: 10,
  },
};
