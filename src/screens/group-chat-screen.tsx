import { useLayoutEffect, useMemo, useRef, useState } from 'react';

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
  const [replyToMessageHash, setReplyToMessageHash] = useState<string | null>(
    null,
  );
  const { name: userName } = useGlobalStore((state) => state.user);
  const { roomKey, name } = route.params;
  const messages = useGlobalStore((state) => state.roomMessages);
  console.log(messages);
  // Use getRoomMessages with a page index (0 is default) to load more messages
  //getRoomMessages(key, page) -> [alreadyloaded, ...more]

  const replyToName = useMemo(() => {
    if (!replyToMessageHash) {
      return '';
    }

    const message = messages.find((m) => m.hash === replyToMessageHash);
    return message ? message.nickname : '';
  }, [replyToMessageHash, messages]);

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
    if (file) {
      const sentFile = onSendGroupMessageWithFile(roomKey, file, text);
      //If we need to return something... or print something locally
      console.log('sent file!', sentFile);
    } else {
      const sent = await onSendGroupMessage(roomKey, text, replyToMessageHash);
      const save = JSON.parse(sent);

      saveRoomsMessageToDatabase(
        save.k,
        save.m,
        save.g,
        save.r,
        save.t,
        save.n,
        save.hash,
        true,
      );
      setReplyToMessageHash(null);
    }
  }

  function onReplyToMessagePress(hash: string) {
    setReplyToMessageHash(hash);
  }

  function onCloseReplyPress() {
    setReplyToMessageHash(null);
  }

  return (
    <ScreenLayout>
      <FlatList
        inverted
        ref={flatListRef}
        data={messages}
        keyExtractor={(item: Message, i) => `${item.address}-${i}`}
        renderItem={({ item }) => {
          // if (item.replyto) {
          //   return <GroupMessageReplyItem />;
          // } else {
          return (
            <GroupMessageItem
              message={item.message}
              timestamp={item.timestamp}
              avatar={getAvatar(item.address)} // TODO fix avatar
              nickname={item.nickname}
              userAddress={item.address}
              onReplyToMessagePress={onReplyToMessagePress}
              replyHash={item.hash}
              reactions={[]}
              replyto={item.replyto}
            />
          );
          // }
        }}
        contentContainerStyle={styles.flatListContent}
        initialNumToRender={messages.length}
        maxToRenderPerBatch={messages.length}
      />

      <View style={styles.inputWrapper}>
        <MessageInput
          onSend={onSend}
          replyToName={replyToName}
          onCloseReplyPress={onCloseReplyPress}
        />
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  flatListContent: {
    flexDirection: 'column-reverse',
    paddingTop: 60,
  },
  inputWrapper: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
});
