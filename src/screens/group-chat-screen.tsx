import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';

import {
  FlatList,
  KeyboardAvoidingView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

import {
  type RouteProp,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';

import {
  CustomIcon,
  GroupMessageItem,
  MessageInput,
  ScreenLayout,
} from '@/components';
import { MainScreens } from '@/config';
import {
  useGlobalStore,
  useUserStore,
  saveRoomMessageAndUpdate,
  onSendGroupMessageWithFile,
  onSendGroupMessage,
  setStoreCurrentRoom,
} from '@/services';
import type {
  SelectedFile,
  MainStackNavigationType,
  MainNavigationParamList,
  Message,
} from '@/types';

import { Header } from '../components/_navigation/header';

interface Props {
  route: RouteProp<MainNavigationParamList, typeof MainScreens.GroupChatScreen>;
}

export const GroupChatScreen: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation<MainStackNavigationType>();
  const flatListRef = useRef<FlatList>(null);
  const [replyToMessageHash, setReplyToMessageHash] = useState<string>('');
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
    navigation.navigate(MainScreens.ModifyGroupScreen, {
      name,
      roomKey,
    });
  }

  useFocusEffect(
    React.useCallback(() => {
      // This effect runs when the screen is focused
      setStoreCurrentRoom(roomKey);

      return () => {
        // This cleanup runs when the screen is unfocused
        setStoreCurrentRoom('null');
      };
    }, [roomKey]),
  );

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

  // useLayoutEffect(() => {
  //   const timeout = setTimeout(() => {
  //     if (flatListRef.current && mockMessages && mockMessages.length > 0) {
  //       flatListRef.current.scrollToEnd({ animated: true });
  //     }
  //   }, 1000);

  //   return () => {
  //     clearTimeout(timeout);
  //   };
  // }, []);

  async function onSend(
    text: string,
    file: SelectedFile | null,
    reply: string,
  ) {
    if (file) {
      text = file.fileName;
    }

    console.log('Sending to room:', name);
    if (file) {
      onSendGroupMessageWithFile(roomKey, file, text);
      //If we need to return something... or print something locally
      // console.log('sent file!', sentFile);
    } else {
      const sent = await onSendGroupMessage(
        roomKey,
        text,
        reply ? reply : replyToMessageHash,
      );
      const save = JSON.parse(sent);

      await saveRoomMessageAndUpdate(
        save.k,
        save.m,
        save.g,
        save.r,
        save.t,
        save.n,
        save.hash,
        true,
      );
      setReplyToMessageHash('');
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
    setReplyToMessageHash('');
  }

  return (
    <ScreenLayout>
      <FlatList
        inverted
        ref={flatListRef}
        data={messages}
        keyExtractor={(item: Message, i) => `${item.address}-${i}`}
        renderItem={({ item }) => {
          return (
            <GroupMessageItem
              message={item.message}
              timestamp={item.timestamp}
              nickname={item.nickname}
              userAddress={item.address}
              onReplyToMessagePress={onReplyToMessagePress}
              onEmojiReactionPress={onEmojiReactionPress}
              replyHash={item.hash}
              reactions={item.reactions!}
              replyto={item.replyto}
              file={item.file!}
            />
          );
        }}
        contentContainerStyle={styles.flatListContent}
        initialNumToRender={messages.length}
        maxToRenderPerBatch={messages.length}
      />

      <KeyboardAvoidingView style={styles.inputWrapper}>
        <MessageInput
          onSend={onSend}
          replyToName={replyToName}
          onCloseReplyPress={onCloseReplyPress}
        />
      </KeyboardAvoidingView>
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
    paddingBottom: 10,
    position: 'absolute',
    right: 0,
  },
});
