import { useLayoutEffect, useRef } from 'react';

import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

import { type RouteProp, useNavigation } from '@react-navigation/native';

import {
  CustomIcon,
  GroupMessageItem,
  Header,
  MessageInput,
  ScreenLayout,
} from '@/components';
import { GroupsScreens } from '@/config';
import {
  naclHash,
  onSendGroupMessage,
  onSendGroupMessageWithFile,
  saveRoomsMessageToDatabase,
  useGlobalStore,
} from '@/services';
import type {
  SelectedFile,
  GroupStackNavigationType,
  GroupStackParamList,
  Message,
} from '@/types';
import { getAvatar, mockMessages } from '@/utils';

interface Props {
  route: RouteProp<GroupStackParamList, typeof GroupsScreens.GroupChatScreen>;
}

export const GroupChatScreen: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation<GroupStackNavigationType>();
  const flatListRef = useRef<FlatList>(null);
  const { name: userName } = useGlobalStore((state) => state.user);
  const { roomKey, name } = route.params;
  const messages = useGlobalStore((state) => state.roomMessages);
  // Use getRoomMessages with a page index (0 is default) to load more messages
  //getRoomMessages(key, page) -> [alreadyloaded, ...more]

  function onCustomizeGroupPress() {
    navigation.navigate(GroupsScreens.ModifyGroupScreen, {
      name,
      roomKey,
    });
  }

  useLayoutEffect(() => {
    const isAdmin = true; // TODO
    const icon = isAdmin ? 'users-cog' : 'users';
    navigation.setOptions({
      header: () => (
        <Header
          backButton
          title={name}
          right={
            <TouchableOpacity onPress={onCustomizeGroupPress}>
              <CustomIcon type="FA5" name={icon} />
            </TouchableOpacity>
          }
        />
      ),
    });
  }, [roomKey, name]);

  useLayoutEffect(() => {
    const timeout = setTimeout(() => {
      if (flatListRef.current && mockMessages && mockMessages.length > 0) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }, 1000);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  async function onSend(text: string, file: SelectedFile | null) {
    console.log('Send message to room with invite key: ', roomKey);
    console.log('Room name:', name);
    //TODO** check if reply state is active
    //add the hash of the message we are replying to as reply
    // const reply = state.reply.hash
    const reply = '';
    if (file) {
      const sentFile = onSendGroupMessageWithFile(
        naclHash(roomKey),
        file,
        text,
        roomKey,
      );
      //If we need to return something... or print something locally
      console.log('sent file!', sentFile);
    } else {
      const sent = await onSendGroupMessage(
        naclHash(roomKey),
        text,
        reply,
        roomKey,
      );
      const parse = JSON.parse(sent);
      const print: Message = {
        address: parse.k,
        hash: parse.hash,
        message: parse.m,
        nickname: parse.n,
        reply: parse.r,
        room: parse.g,
        sent: true,
        timestamp: parse.t,
      };
      
      saveRoomsMessageToDatabase(
        print.address,
        print.message,
        print.room,
        print.reply,
        print.timestamp,
        print.nickname,
        print.hash,
        true,
      );
    }
  }

  return (
    <ScreenLayout>

          <FlatList
            inverted
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, i) => `${item.k}${i}`}
            renderItem={({ item }) => (
              <GroupMessageItem
                message={item.message}
                date={item.timestamp}
                avatar={getAvatar(item.address)}
                name={item.nickname}
                userAddress={item.address}
                reactions={[]}
              />
            )}
            contentContainerStyle={styles.flatListContent}
          />

      <View style={styles.inputWrapper}>
        <MessageInput onSend={onSend} />
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  flatListContent: {
    flexDirection: 'column-reverse',
    paddingTop: 60
  },
  inputWrapper: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
});
