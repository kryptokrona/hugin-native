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
import { RoomsScreens } from '@/config';
import {
  onSendGroupMessage,
  onSendGroupMessageWithFile,
  saveRoomsMessageToDatabase,
  useGlobalStore,
  useUserStore,
} from '@/services';
import type {
  SelectedFile,
  RoomStackNavigationType,
  RoomStackParamList,
  Message,
} from '@/types';
import { getAvatar } from '@/utils';

interface Props {
  route: RouteProp<RoomStackParamList, typeof RoomsScreens.RoomChatScreen>;
}

export const RoomChatScreen: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation<RoomStackNavigationType>();
  const flatListRef = useRef<FlatList>(null);
  const [replyToMessageHash, setReplyToMessageHash] = useState<string | null>(
    null,
  );
  const { name: userName } = useUserStore((state) => state.user);
  const { roomKey, name } = route.params;
  const messages = useGlobalStore((state) => state.roomMessages);
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
    navigation.navigate(RoomsScreens.ModifyRoomScreen, {
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
      if (flatListRef.current && messages?.length > 0) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }, 1000);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  async function onSend(
    text: string,
    file: SelectedFile | null,
    reply: string | false = false,
  ) {
    if (file) {
      text = file.fileName;
    }

    console.log('Sending to room:', name);
    if (file) {
      const sentFile = onSendGroupMessageWithFile(roomKey, file, text);
      //If we need to return something... or print something locally
      console.log('sent file!', sentFile);
    } else {
      const sent = await onSendGroupMessage(
        roomKey,
        text,
        reply ? reply : replyToMessageHash,
      );
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

  async function onEmojiReactionPress(emoji: string, hash: string) {
    //Send hash because of race condition with onCloseReplyPress
    onSend(emoji, null, hash);
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
              onEmojiReactionPress={onEmojiReactionPress}
              replyHash={item.hash}
              reactions={item.reactions!}
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
