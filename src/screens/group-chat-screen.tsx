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
  signMessage,
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

  async function onSend(
    text: string,
    file: SelectedFile | null,
    reply: string | false = false,
  ) {
    if (file) {
      text = file.fileName;
    }
    const signature = await signMessage(text);
    console.log('Sending to room:', name);
    if (file) {
      const sentFile = onSendGroupMessageWithFile(
        roomKey,
        file,
        text,
        signature,
      );
      //If we need to return something... or print something locally
      console.log('sent file!', sentFile);
    } else {
      const sent = await onSendGroupMessage(
        roomKey,
        text,
        reply ? reply : replyToMessageHash,
        signature,
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
