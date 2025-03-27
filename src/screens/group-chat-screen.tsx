import React, {
  useCallback,
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
  TouchableOpacity,
  View,
} from 'react-native';

import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import {
  type RouteProp,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import { t } from 'i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
  TextField,
  UserItem,
} from '@/components';

// import Animated, { useSharedValue } from 'react-native-reanimated';

import { MainScreens } from '@/config';
import {
  useGlobalStore,
  setStoreCurrentRoom,
  useThemeStore,
  WebRTC,
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
import {
  onSendGroupMessage,
  saveRoomMessageAndUpdate,
  onSendGroupMessageWithFile,
} from '../services/bare/groups';
import { Wallet } from '../services/kryptokrona/wallet';

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
  const { roomKey, name } = route.params;
  const messages = useGlobalStore((state) => state.roomMessages);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [tipping, setTipping] = useState(false);
  const [tipAmount, setTipAmount] = useState<string>('0');
  const [tipAddress, setTipAddress] = useState<string>('');
  // const [inCall, setInCall] = useState<boolean>();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const myUserAddress = useGlobalStore((state) => state.address);
  const currentCall = useGlobalStore((state) => state.currentCall);
  const inCall = currentCall.room === roomKey;
  // console.log('currentCall', currentCall);
  const inCallUsers = 0;

  const voiceUsers = useGlobalStore(
    useCallback(
      (state) =>
        state.roomUsers.filter((a) => a.room === roomKey && a.voice === true),
      [roomKey],
    ),
  );

  const roomUsers = useGlobalStore(
    useCallback(
      (state) => state.roomUsers.filter((a) => a.room === roomKey),
      [roomKey],
    ),
  );

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
    console.log('Clicked');
    bottomSheetRef?.current?.snapToIndex(0);
  }

  function onJoinCall() {
    console.log('Joining call!');
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
      screenshare: false,
      video: false,
      voice: true,
    };
    const me = roomUsers.filter((a) => a.address === myUserAddress)[0];
    me.voice = true;
    const call = { room: roomKey, time: Date.now(), users: [...userList, me] };
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
      screenshare: false,
      video: false,
      voice: false,
    };

    Peers.voicestatus(peer);
    useGlobalStore.getState().resetCurrentCall();
    WebRTC.exit();
  }

  function OnlineUserMapper({ item }: { item: User }) {
    return <UserItem {...item} />;
  }

  const handleSheetChanges = useCallback((index: number) => {
    console.log('handleSheetChanges', index);
  }, []);

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

  useFocusEffect(
    React.useCallback(() => {
      setStoreCurrentRoom(roomKey);
      return () => {};
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
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flexDirection: 'row' }}
                onPress={onCustomizeGroupPress}>
                <CustomIcon type="MI" name={'groups-3'} />
                <CustomIcon
                  name={'lens'}
                  size={10}
                  type={'MI'}
                  color={`${online ? 'green' : 'grey'}`}
                />
                {/* <View style={{ marginTop: 16, transform: [{ scale: 0.8 }] }}>
                    <Unreads
                      unreads={onlineUsers}
                      color={`${online ? 'green' : 'grey'}`}
                      />
                </View> */}
              </TouchableOpacity>
            </View>
          }
        />
      ),
    });
  }, [roomKey, name, inCall]);

  async function onSend(
    text: string,
    file: SelectedFile | null,
    reply?: string,
    emoji?: boolean | undefined,
    tip?: TipType | undefined,
  ) {
    console.log('Sending to room:', name);
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

  return (
    <ScreenLayout>
      <GestureHandlerRootView>
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
          <TextButton type="secondary" onPress={() => setTipping(false)}>
            {t('close')}
          </TextButton>
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
          keyboardVerticalOffset={Platform.OS === 'ios' ? 97 : 0}>
          <MessageInput
            onSend={onSend}
            replyToName={replyToName}
            onCloseReplyPress={onCloseReplyPress}
          />
        </KeyboardAvoidingView>

        <BottomSheet
          ref={bottomSheetRef}
          onChange={handleSheetChanges}
          snapPoints={snapPoints}
          index={-1}
          enablePanDownToClose={true}
          handleStyle={{
            backgroundColor,
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
          }}
          handleIndicatorStyle={{ backgroundColor: color }}>
          <BottomSheetView
            style={[{ backgroundColor, borderColor }, styles.contentContainer]}>
            {/* <TextField>Awesome 🎉</TextField> */}
            <View style={{ flex: 1, width: '100%' }}>
              <View style={styles.flatListContainer}>
                <TextField size={'xsmall'} type="muted">
                  {`${t('onlineRoomMembers')} (${voiceUsers?.length})`}
                </TextField>
                <View style={styles.flatListWrapper}>
                  <FlatList
                    nestedScrollEnabled={true}
                    numColumns={2}
                    data={userList}
                    renderItem={OnlineUserMapper}
                    keyExtractor={(item, i) => `${item.name}-${i}`}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>

              {!inCall ? (
                <TextButton
                  small
                  type="secondary"
                  onPress={onJoinCall}
                  icon={<CustomIcon name="phone" type="MCI" size={16} />}>
                  {t('joinCall')}
                </TextButton>
              ) : (
                <TextButton
                  small
                  type="destructive"
                  onPress={onEndCall}
                  icon={
                    <CustomIcon
                      color={theme[textType.destructive]}
                      name="phone-hangup"
                      type="MCI"
                      size={16}
                    />
                  }>
                  {t('endCall')}
                </TextButton>
              )}
            </View>
          </BottomSheetView>
        </BottomSheet>
      </GestureHandlerRootView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'grey',
    flex: 1,
  },
  contentContainer: {
    alignItems: 'center',
    flex: 1,
    padding: 36,
  },
  flatListContainer: {
    flex: 1,
    marginVertical: 12,
  },
  flatListContent: {
    flexDirection: 'column-reverse',
    paddingTop: 60,
  },
  flatListWrapper: {
    flex: 1,
  },
  inputWrapper: {
    bottom: 0,
    left: 0,
    // marginBottom: 10,
    paddingBottom: 10,
    position: 'absolute',
    right: 0,
  },
});
