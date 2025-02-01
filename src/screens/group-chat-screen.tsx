import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';

import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  type RouteProp,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import { t } from 'i18next';

import { Peers } from 'lib/connections';

import {
  CustomIcon,
  GroupMessageItem,
  MessageInput,
  ScreenLayout,
  FullScreenImageViewer,
  InputField,
  TextButton,
  ModalCenter,
} from '@/components';
import { MainScreens } from '@/config';
import {
  useGlobalStore,
  setStoreCurrentRoom,
  useThemeStore,
  Wallet,
  getCurrentRoom,
} from '@/services';
import type {
  SelectedFile,
  MainStackNavigationType,
  MainNavigationParamList,
  Message,
} from '@/types';

import { Header } from '../components/_navigation/header';
import {
  onSendGroupMessage,
  saveRoomMessageAndUpdate,
  onSendGroupMessageWithFile,
} from '../services/bare/groups';

interface Props {
  route: RouteProp<MainNavigationParamList, typeof MainScreens.GroupChatScreen>;
}

export const GroupChatScreen: React.FC<Props> = ({ route }) => {
  const theme = useThemeStore((state) => state.theme);
  const backgroundColor = theme.background;
  const navigation = useNavigation<MainStackNavigationType>();
  const flatListRef = useRef<FlatList>(null);
  const [replyToMessageHash, setReplyToMessageHash] = useState<string>('');
  const { roomKey, name } = route.params;
  const messages = useGlobalStore((state) => state.roomMessages);
  const [showImage, setShowImage] = useState<boolean>(false);
  const [showImagePath, setImagePath] = useState<string>(false);
  const [tipping, setTipping] = useState(false);
  const [tipAmount, setTipAmount] = useState<string>('0');
  const [tipAddress, setTipAddress] = useState<string>('');

  const replyToName = useMemo(() => {
    if (!replyToMessageHash) {
      return '';
    }

    const message = messages.find((m) => m.hash === replyToMessageHash);
    return message ? message.nickname : '';
  }, [replyToMessageHash, messages]);

  function onCustomizeGroupPress() {
    navigation.push(MainScreens.ModifyGroupScreen, {
      name,
      roomKey,
    });
  }

  const scrollToBottom = () => {
    flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
  };

  const showBigImage = (path?: string) => {
    if (!path) {
      return;
    }
    setImagePath(path);
    setShowImage(true);
  };

  async function sendTip() {
    const amount = parseInt(tipAmount * 100000);
    const sent = await Wallet.send({
      amount: amount,
      to: tipAddress,
    });
    setTipping(false);
    if (sent.success) {
      const to = messages.find((a) => a.address === tipAddress);
      onSend('', null, '', false, {
        amount, // TODO fix this
        hash: sent.transactionHash,
        receiver: to?.nickname,
      });
    }
  }

  const online = useMemo(() => {
    return Peers.connected(getCurrentRoom());
  }, [Peers, getCurrentRoom()]);

  useFocusEffect(
    React.useCallback(() => {
      setStoreCurrentRoom(roomKey);
      return () => {};
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
            <TouchableOpacity
              style={{ flexDirection: 'row' }}
              onPress={onCustomizeGroupPress}>
              <View style={{ marginRight: 5, marginTop: 4 }}>
                <CustomIcon
                  name={'lens'}
                  size={14}
                  type={'MI'}
                  color={`${online ? 'green' : 'grey'}`}
                />
              </View>
              <CustomIcon type="FA5" name={icon} />
            </TouchableOpacity>
          }
        />
      ),
    });
  }, [roomKey, name]);

  async function onSend(
    text: string,
    file: SelectedFile | null,
    reply?: string,
    emoji?: boolean | undefined,
    tip?: JSON | undefined,
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
        tip ? tip : false,
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
        undefined,
        undefined,
        tip,
      );
      setReplyToMessageHash('');
    }
    if (!emoji) {
      scrollToBottom();
    }
  }

  function onReplyToMessagePress(hash: string) {
    setReplyToMessageHash(hash);
  }

  async function onEmojiReactionPress(emoji: string, hash: string) {
    //Send hash because of race condition with onCloseReplyPress
    onSend(emoji, null, hash, true);
  }

  function onCloseReplyPress() {
    setReplyToMessageHash('');
  }

  function onTip(address: string) {
    setTipping(true);
    setTipAddress(address);
  }

  return (
    <ScreenLayout>
      {/* Full-Screen Image Viewer */}
      {showImage && (
        <FullScreenImageViewer
          imagePath={showImagePath}
          onClose={() => setShowImage(false)}
        />
      )}
      <ModalCenter visible={tipping} closeModal={() => setTipping(false)}>
        <InputField
          label={t('amount')}
          value={tipAmount}
          onChange={setTipAmount}
          onSubmitEditing={sendTip}
        />
        <TextButton onPress={sendTip}>{t('send')}</TextButton>
        <TextButton onPress={() => setTipping(false)}>{t('close')}</TextButton>
      </ModalCenter>
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
              onTipPress={onTip}
              replyHash={item.hash}
              reactions={item.reactions!}
              replyto={item.replyto}
              file={item.file!}
              onShowImagePress={showBigImage}
              tip={item.tip}
            />
          );
        }}
        contentContainerStyle={styles.flatListContent}
        initialNumToRender={messages.length}
        maxToRenderPerBatch={messages.length}
      />

      <KeyboardAvoidingView
        style={[styles.inputWrapper, { backgroundColor }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
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
    bottom: 4,
    left: 0,
    paddingBottom: 10,
    position: 'absolute',
    right: 0,
  },
});
