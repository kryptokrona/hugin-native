import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
  ActivityIndicator,
} from 'react-native';

import {
  type RouteProp,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import { t } from 'i18next';
import Toast from 'react-native-toast-message';

import { Peers } from 'lib/connections';
import { Rooms } from 'lib/native';

import {
  CustomIcon,
  GroupMessageItem,
  MessageInput,
  ScreenLayout,
  FullScreenImageViewer,
  InputField,
  TextButton,
  ModalCenter,
  Unreads,
  OnlineUsers,
  TextField,
  UserItem,
  GroupOnlineIndicator,
  ModalBottom,
  TouchableOpacity,
  CallModal,
  Avatar
} from '@/components';

// import Animated, { useSharedValue } from 'react-native-reanimated';

import { MainScreens } from '@/config';
import {
  useGlobalStore,
  setStoreCurrentRoom,
  useThemeStore,
  WebRTC,
  setStoreRoomMessages,
} from '@/services';
import { textType } from '@/styles';
import type {
  SelectedFile,
  MainStackNavigationType,
  MainNavigationParamList,
  Message,
  TipType,
  User,
} from '@/types';

import { Header } from '../components/_navigation/header';
import { GlideInItem } from '../components/glider';
import {
  onSendGroupMessage,
  saveRoomMessageAndUpdate,
  onSendGroupMessageWithFile,
  setRoomMessages,
} from '../services/bare/groups';
import { getRoomMessages } from '../services/bare/sqlite';
import { Wallet } from '../services/kryptokrona/wallet';
import { sleep } from '@/utils';

interface Props {
  route: RouteProp<MainNavigationParamList, typeof MainScreens.GroupChatScreen>;
}

export const GroupChatScreen: React.FC<Props> = ({ route }) => {
  const theme = useThemeStore((state) => state.theme);
  const backgroundColor = theme.background;
  const borderColor = theme.border;
  const color = theme.foreground;
  const navigation = useNavigation<MainStackNavigationType>();
  const flatListRef = useRef<FlatList>(null);
  const [replyToMessageHash, setReplyToMessageHash] = useState<string>('');
  const { roomKey, name, call } = route.params;
  const messages = useGlobalStore((state) => state.roomMessages);//.filter((a) => a.room === roomKey,
  
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [tipping, setTipping] = useState(false);
  const [tipAmount, setTipAmount] = useState<string>('0');
  const [unreadIndex, setUnreadIndex] = useState<number>(0);
  const [unreadCounted, setUnreadCounted] = useState<boolean>(false);
  const [tipAddress, setTipAddress] = useState<string>('');
  const [dots, setDots] = useState<string>('');
  const [someoneTyping, setSomeoneTyping] = useState<boolean>(false);
  const [voiceUsers, setVoiceUsers] = useState<User[]>([]);
  // const [messages, setMessages] = useState<Message[]>(globalMessages || []);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [noMoreMessages, setNoMoreMessages] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const typingUsers = useGlobalStore((state) => state.typingUsers[roomKey]);

  useEffect(() => {

    if (unreadCounted) return;
    if (!messages?.length) return;
    setUnreadCounted(true);

    setUnreadIndex(messages.findIndex(m => !m.read) - 1);
    if (messages.findIndex(m => !m.read) !== -1) {
      flatListRef.current?.scrollToIndex({
        index: messages.findIndex(m => !m.read),
        animated: false,
        viewPosition: 0.5
      });
      } else {
        scrollToBottom();
      }
  }, [messages])
  
  
  // const [inCall, setInCall] = useState<boolean>();
  const myUserAddress = useGlobalStore((state) => state.address);
  const inCall = useGlobalStore((state) => state.currentCall.room) === roomKey;
  const globalVoiceUsers = useGlobalStore((state) => state.roomUsers);
  const roomUsers = useGlobalStore((state) => state.roomUsers[roomKey]);
  // console.log('currentCall', currentCall);
  const inCallUsers = 0;
  
  const [callMenuActive, setCallMenuActive] = useState<boolean>(false);

  function onCloseCallMenu() {
    setCallMenuActive(false);
  }

  useEffect(() => {

    async function changeDots() {
      while (typingUsers?.length > 0 && someoneTyping) {
        await sleep(500);
        setDots('.')
        await sleep(500);
        setDots('..')
        await sleep(500);
        setDots('...')
      }
    }
    if (typingUsers?.length === 0) setSomeoneTyping(false);
    if (typingUsers?.length > 0) setSomeoneTyping(true);
    if (someoneTyping) changeDots();

  }, [typingUsers]);

  useEffect(() => {
    if (!roomUsers) {
      return;
    }
    setVoiceUsers(roomUsers.filter((a) => a.voice === true));
  }, [roomUsers, inCall]);

  const userList = useMemo(() => {
    return voiceUsers;
  }, [voiceUsers]);

  const online = useMemo(() => {
    return roomUsers;
  }, [roomUsers]);

  const replyToName = useMemo(() => {
    if (!replyToMessageHash) {
      return '';
    }

    const message = messages.find((m) => m.hash === replyToMessageHash);
    return message ? message.nickname : '';
  }, [replyToMessageHash, messages]);

  const snapPoints = useMemo(() => ['50%'], []);

  function onShowCall() {
    setCallMenuActive(true);
  }

  function onJoinCall() {
    onCloseCallMenu();
    WebRTC.init();
    Rooms.voice(
      {
        audioMute: false,
        key: roomKey,
        screenshare: false,
        video: false,
        videoMute: false,
        voice: true,
      },
      false,
    );

    const peer = {
      address: myUserAddress,
      audioMute: false,
      room: roomKey,
      screenshare: false,
      video: false,
      voice: true,
    };
    const me = roomUsers.filter((a) => a.address === myUserAddress)[0];
    me.voice = true;
    const call = {
      room: roomKey,
      talkingUsers: {},
      time: Date.now(),
      users: [...userList, me],
    };
    useGlobalStore.getState().setCurrentCall(call);
    Peers.voicestatus(peer);
  }

  function onEndCall() {
    Rooms.voice(
      {
        audioMute: false,
        key: roomKey,
        screenshare: false,
        video: false,
        videoMute: false,
        voice: false,
      },
      false,
    );

    const peer = {
      address: myUserAddress,
      audioMute: false,
      room: roomKey,
      screenshare: false,
      video: false,
      voice: false,
    };

    Peers.voicestatus(peer);
    useGlobalStore.getState().resetCurrentCall();
    WebRTC.exit();
  }

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
  };

  async function sendTip() {
    const normalizedTipAmount = tipAmount.replace(/,/g, '');
    const amount = Math.round(parseFloat(normalizedTipAmount) * 100000);

    const sent = await Wallet.send({
      amount: amount,
      to: tipAddress,
    });

    setTipping(false);
    if (sent.success) {
      const to = messages
        .slice()
        .reverse()
        .find((a) => a.address === tipAddress);

      onSend('', null, '', false, {
        amount, // TODO fix this
        hash: sent.transactionHash!,
        receiver: to?.nickname ?? 'Anon',
      });
      Toast.show({
        text1: t('transactionSuccess'),
        type: 'success',
      });
    } else {
      Toast.show({
        text1: t('transactionFailed'),
        type: 'error',
      });
    }
  }

  const loadMoreMessages = async () => {
    if (isLoadingMore || noMoreMessages) {
      return;
    }
    setIsLoadingMore(true);
    const nextPageMessages = await getRoomMessages(roomKey, currentPage);
    if (nextPageMessages.length == 0) {
      setNoMoreMessages(true);
    }
    const newMessages = [...nextPageMessages, ...messages];
    setStoreRoomMessages(newMessages);
    setCurrentPage(currentPage + 1);
    setIsLoadingMore(false);
  };

  // useEffect(() => {
  //   setRoomMessages(roomKey, 0);
  // },[roomKey])

  useFocusEffect(
    React.useCallback(() => {
      setStoreCurrentRoom(roomKey);
      setRoomMessages(roomKey, 0);
      return () => {
        setStoreRoomMessages([]);
      };
    }, [roomKey]),
  );

  // useEffect(() => {
  //   const subscription = Peers.on('change', () => {
  //     setChange(!change);
  //   });

  //   return () => {
  //     subscription.remove();
  //   };
  // }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <Header
          backButton
          title={name}
          subtitle={`${roomUsers?.length} online`}
          right={
            <View style={{ flexDirection: 'row', gap: 10, marginLeft: -5 }}>
              <TouchableOpacity
                style={{ flexDirection: 'row' }}
                onPress={onShowCall}>
                <View style={{ marginRight: 5, marginTop: 4 }}>
                  <Unreads
                    unreads={inCallUsers}
                    color={`${inCall ? 'green' : 'grey'}`}
                  />
                </View>

                <CustomIcon type="MCI" name={'phone'} />
                <View style={{ marginLeft: -5 }}>
                  <CustomIcon
                    name={'lens'}
                    size={10}
                    type={'MI'}
                    color={`${inCall ? 'green' : 'grey'}`}
                  />
                  {voiceUsers && (
                    <View style={{ marginLeft: 5, marginTop: 15 }}>
                      <OnlineUsers
                        online={voiceUsers.length}
                        // color={`${online ? 'green' : 'grey'}`}
                      />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
              {/* <TouchableOpacity
                style={{ flexDirection: 'row', marginRight: 15 }}
                onPress={onCustomizeGroupPress}>
                <CustomIcon type="MI" name={'groups-3'} />
                <View style={{zIndex: 9999}}>

                <CustomIcon
                  name={'lens'}
                  size={10}
                  type={'MI'}
                  color={`${roomUsers?.length > 0 ? 'green' : 'grey'}`}
                  />
                  </View>
                {roomUsers &&

                  <OnlineUsers
                      online={roomUsers.length}
                      // color={`${online ? 'green' : 'grey'}`}
                      />

                    }
              </TouchableOpacity> */}
              <GroupOnlineIndicator
                roomKey={roomKey}
                onPress={onCustomizeGroupPress}
              />
            </View>
          }
        />
      ),
    });
  }, [roomKey, name, inCall, roomUsers, voiceUsers]);

  async function onSend(
    text: string,
    file: SelectedFile | null,
    reply?: string,
    emoji?: boolean | undefined,
    tip?: TipType | undefined,
  ) {
    if (file) {
      onSendGroupMessageWithFile(roomKey, file, text);
      //If we need to return something... or print something locally
      // console.log('sent file!', sentFile);
    }
    if (text.length) {
      const sent = await onSendGroupMessage(
        roomKey,
        text,
        reply ? reply : replyToMessageHash,
        tip ? tip : false,
      );
      const save = sent;

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

  function onCloseTipping() {
    setTipping(false);
    setTipAmount('0');
  }

  const scrollToMessage = (hash: string) => {
  const index = messages.findIndex((m) => m.hash === hash);
  if (index !== -1 && flatListRef.current) {
    flatListRef.current.scrollToIndex({ index: index + 1, animated: true });
  }
};

  return (
    <ScreenLayout>
        {/* Full-Screen Image Viewer */}
        {imagePath && (
          <FullScreenImageViewer
            imagePath={imagePath}
            onClose={() => setImagePath(null)}
          />
        )}
        <ModalCenter visible={tipping} closeModal={onCloseTipping}>
          <InputField
            label={t('amount')}
            value={tipAmount}
            onChange={setTipAmount}
            onSubmitEditing={sendTip}
            keyboardType="number-pad"
          />
          <TextButton disabled={tipAmount === '0'} onPress={sendTip}>
            {t('send')}
          </TextButton>
          <TextButton onPress={() => setTipping(false)}>
            {t('close')}
          </TextButton>
        </ModalCenter>
        {messages?.length && 
        <FlatList
          inverted
          ref={flatListRef}
          data={messages}
          keyExtractor={(item: Message, i) => `${item.address}-${i}`}
          renderItem={({ item, index }) => {
            const isNewestMessage = index === messages.length - 1;
            const isFirstUnread = index === unreadIndex;
            const content = (
                  <>
      {isFirstUnread && (
        <View style={{ alignItems: 'center', marginVertical: 8 }}>
          <TextField size="small">-- New messages below --</TextField>
        </View>
      )}
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
                read={item.read}
                scrollToMessage={scrollToMessage}
              />
                  </>
            );

            return isNewestMessage ? (
              <GlideInItem>{content}</GlideInItem>
            ) : (
              content
            );
          }}
          contentContainerStyle={styles.flatListContent}
          initialNumToRender={messages.length}
          maxToRenderPerBatch={messages.length}
          onEndReached={loadMoreMessages}
          onEndReachedThreshold={0.1}
          ListHeaderComponent={
            isLoadingMore ? (
              <ActivityIndicator size="small" color={color} />
            ) : null
          }
          ListFooterComponentStyle={{height: 20}}
          ListFooterComponent={
            typingUsers?.length > 0 ? 
            (
              <View style={{height: 20, justifyContent: 'center', alignItems: 'center' }}>
                {typingUsers?.length == 1 ?
                (<TextField size='xsmall'>{roomUsers.find(a => a.address == typingUsers[0])?.name} is typing{dots}</TextField>)
                :
                (<TextField size='xsmall'>{typingUsers.length} users are typing{dots}</TextField>)
                }
              </View>
            ) : 
            <View style={{height: 20}}>
            </View>
            }
              onScrollToIndexFailed={info => {
              setTimeout(() => {
                flatListRef.current?.scrollToIndex({
                  index: info.index,
                  animated: false,
                  viewPosition: 0.5
                });
              }, 100);
            }}
        />
          }

        <KeyboardAvoidingView
          style={[styles.inputWrapper, { backgroundColor }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 97 : 0}>
          <MessageInput
            roomKey={roomKey}
            onSend={onSend}
            replyToName={replyToName}
            onCloseReplyPress={onCloseReplyPress}
          />
        </KeyboardAvoidingView>

          <ModalBottom visible={callMenuActive} closeModal={onCloseCallMenu}>

            <CallModal 
            onEndCall={onEndCall} 
            onJoinCall={onJoinCall} 
            voiceUsers={voiceUsers} 
            userList={userList} 
            inCall={inCall} />

          </ModalBottom>

    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'grey',
    flex: 1,
  },
  flatListContent: {
    flexDirection: 'column-reverse',
    paddingTop: 60,
    maxWidth: '100%',
  },
  flatListWrapper: {
    minHeight: 200
  },
  inputWrapper: {
    bottom: 0,
    left: 0,
    // marginBottom: 10,
    paddingBottom: 10,
    position: 'absolute',
    right: 0
  },
  onlineUsersText: {
    marginBottom: 10,
    marginTop: -10,
    textAlign: 'center',
    width: '100%',
  },
});
