import React, { useLayoutEffect, useState } from 'react';

import { FlatList, TouchableOpacity, View } from 'react-native';

import { useNavigation, type RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import {
  Container,
  CustomIcon,
  ModalCenter,
  PreviewItem,
  ScreenLayout,
  TextButton,
  TextField,
} from '@/components';
import { MainScreens } from '@/config';
import {
  setRoomMessages,
  setStoreCurrentRoom,
  useGlobalStore,
} from '@/services';
import type { MainStackNavigationType, MainNavigationParamList } from '@/types';
import { Header } from '../components/_navigation/header';

interface Props {
  route: RouteProp<MainNavigationParamList, typeof MainScreens.GroupsScreen>;
}

export const GroupsScreen: React.FC<Props> = () => {
  //TODO** rename Groups -> Rooms
  const { t } = useTranslation();
  const navigation = useNavigation<MainStackNavigationType>();
  const rooms = useGlobalStore((state) => state.rooms);
  const [modalVisible, setModalVisible] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <Header
          title={t('rooms')}
          right={
            <TouchableOpacity onPress={onAddGroupPress}>
              <CustomIcon type="IO" name="add-outline" size={30} />
            </TouchableOpacity>
          }
        />
      ),
    });
  }, [navigation]);

  function onAddGroupPress() {
    setModalVisible(true);
  }

  async function onPress(roomKey: string, name: string) {
    await setRoomMessages(roomKey, 0);
    setStoreCurrentRoom(roomKey);
    navigation.navigate(MainScreens.GroupChatScreen, { name, roomKey });
  }

  function onCloseModal() {
    setModalVisible(false);
  }

  function onJoinRoom() {
    setModalVisible(false);
    navigation.navigate(MainScreens.AddGroupScreen, {
      joining: true,
    });
  }

  function onCreateRoom() {
    setModalVisible(false);
    navigation.navigate(MainScreens.AddGroupScreen, {
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
