import React, { useState } from 'react';

import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { joinAndSaveRoom, setStoreCurrentRoom, setStoreRoomMessages, useGlobalStore, useRoomStore, useThemeStore, useUserStore } from '@/services';
import { Styles } from '@/styles';
import { prettyPrintDate } from '@/utils';

import { Avatar, TextField } from './_elements';
import { ModalBottom } from './_layout';
import { PreviewItem } from '.';
import { MainScreens } from '@/config';
import { useNavigation } from '@react-navigation/native';
import { MainStackNavigationType } from '@/types';

interface Props {
  invite: string;
}

export const GroupInvite: React.FC<Props> = ({
  invite
}) => {
  // const navigation = useNavigation<MainStackNavigationType>();
  const [_isPressed, setIsPressed] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const theme = useThemeStore((state) => state.theme);
  const borderColor = theme.border;
  const user = useUserStore((state) => state.user);
  const navigation = useNavigation<MainStackNavigationType>();
  const parse = invite.split("/");
  const roomName = parse[2];
  const originalName = roomName.replace(/-/g, ' ');
  const roomKey = parse[3];
  const { setThisRoom } = useRoomStore();
  const rooms = useGlobalStore((state) => state.rooms);

  const joinedRoomKeys = new Set(rooms.map(r => r.roomKey));
  const inRoom = joinedRoomKeys.has(roomKey);


function onPress() {
    setStoreRoomMessages([]);

    if (roomKey.length != 128) {
      return;
    }
    setStoreCurrentRoom(roomKey);
    setThisRoom(roomKey);

    if (roomKey && originalName && user?.address) {
      if (!inRoom) joinAndSaveRoom(roomKey, originalName, user.address, user?.name);

      const state = navigation.getState();
      const currentRoute = state.routes[state.index]?.name;

      if (currentRoute != "GroupChatScreen") {
        navigation.navigate(MainScreens.GroupsScreen);
      }

      navigation.push(MainScreens.GroupChatScreen, {
        name: roomName,
        roomKey
      });
    }
  }

  return (
    <View style={[styles.card, {borderColor}]}>
      <PreviewItem name={originalName.substring(0,16)} roomKey={roomKey} suggested alreadyInRoom={inRoom} onPress={onPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 10,
    marginTop: 0,
    marginLeft: -25,
    minWidth: '98%',
    alignSelf: 'stretch',
    borderRadius: Styles.borderRadius.small,
    paddingHorizontal: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  container: {
    marginLeft: 4,
    marginVertical: 4,
  },
  date: {
    alignSelf: 'flex-end',
    marginBottom: 6,
    marginLeft: 6,
  },
  invertedCard: {
    alignSelf: 'flex-end',
  },
  invertedContainer: {
    alignItems: 'flex-end',
    paddingLeft: 30,
  },
  messageContainer: {
    paddingRight: 30,
  },
  user: {
    flexDirection: 'row',
  },
});
