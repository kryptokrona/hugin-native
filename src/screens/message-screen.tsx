import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

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
import Toast from 'react-native-toast-message';

import {
  GroupMessageItem,
  MessageInput,
  ScreenLayout,
  FullScreenImageViewer,
  InputField,
  TextButton,
  Avatar,
  CustomIcon,
  Unreads,
  TextField,
  UserItem,
} from '@/components';
import { MainScreens } from '@/config';
import {
  useGlobalStore,
  useUserStore,
  useThemeStore,
  getCurrentRoom,
  setStoreCurrentContact,
  WebRTC,
} from '@/services';
import type {
  SelectedFile,
  MainStackNavigationType,
  MainNavigationParamList,
  Message,
  User,
} from '@/types';
import { getAvatar } from '@/utils';

import { Header } from '../components/_navigation/header';
import { Peers } from '../lib/connections';
import { setLatestMessages, updateMessage } from '../services/bare/contacts';
import { saveMessage } from '../services/bare/sqlite';
import { Wallet } from '../services/kryptokrona/wallet';
import { Beam, Rooms } from 'lib/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { textType } from '@/styles';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

interface Props {
  route: RouteProp<MainNavigationParamList, typeof MainScreens.MessageScreen>;
}

export const MessageScreen: React.FC<Props> = ({ route }) => {
  const theme = useThemeStore((state) => state.theme);
  const backgroundColor = theme.background;
  const borderColor = theme.border;
  const color = theme.foreground;
  const navigation = useNavigation<MainStackNavigationType>();
  const flatListRef = useRef<FlatList>(null);
  const [replyToMessageHash, setReplyToMessageHash] = useState<string>('');
  const { name: userName, address } = useUserStore((state) => state.user);
  const contacts = useGlobalStore((state) => state.contacts);
  const { roomKey, name } = route.params;
  const messages = useGlobalStore((state) => state.messages);
  const messageKey = contacts.find((a) => a.address === roomKey)?.messagekey;
  const huginAddress = roomKey + messageKey;

  const [showImage, setShowImage] = useState<boolean>(false);
  const [showImagePath, setImagePath] = useState<string>(false);
  const [tipping, setTipping] = useState(false);
  const [tipAmount, setTipAmount] = useState<string>('0');
  const [tipAddress, setTipAddress] = useState<string>('');

  const roomUsers = useGlobalStore((state) => state.roomUsers);

  const currentCall = useGlobalStore((state) => state.currentCall);
  
  const myUserAddress = useGlobalStore((state) => state.address);
  const snapPoints = useMemo(() => ['50%'], []);
  const bottomSheetRef = useRef<BottomSheet>(null);
  
  const keyRef = useRef(null);
  const inCall = currentCall.room === keyRef.current;

  useEffect(() => {
    if (keyRef.current) return; // Prevent re-execution if key is already set

    const deriveKey = async () => {
      const derivedKey = await Wallet.key_derivation_hash(roomKey);
      keyRef.current = derivedKey;
    };

    deriveKey();
  }, [roomKey]); // Run only when `roomKey` changes

  

  const voiceUsers = useGlobalStore(
    useCallback(
      (state) =>
        state.roomUsers.filter((a) => a.room === keyRef.current && a.voice === true),
      [keyRef.current],
    ),
  );



  const userList = useMemo(() => {
    return voiceUsers;
  }, [voiceUsers]);
  
  const replyToName = useMemo(() => {
    if (!replyToMessageHash) {
      return '';
    }

    const message = messages.find((m) => m.hash === replyToMessageHash);
    return message ? message.nickname : '';
  }, [replyToMessageHash, messages]);

  function onCustomizeGroupPress() {
    navigation.push(MainScreens.ModifyContactScreen, {
      name,
      roomKey,
    });
  }

  function OnlineUserMapper({ item }: { item: User }) {
    return <UserItem {...item} />;
  }

  async function onJoinCall() {
      console.log('Joining call!', roomKey);
      WebRTC.init();
      Rooms.voice(
        {
          audioMute: false,
          key: keyRef.current,
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
      const call = { room: keyRef.current, time: Date.now(), users: [...userList, me] };
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
      useGlobalStore.getState().setCurrentCall({ room: '', users: [] });
      WebRTC.exit();
    }

  const scrollToBottom = () => {
    flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
  };

  const showBigImage = (path: string | undefined) => {
    if (path) {
      setImagePath(path);
    }
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

  const online = useGlobalStore(
    useCallback(
      (state) => state.roomUsers.some((a) => a.address === roomKey && a.dm === true),
      [roomUsers, roomKey],
    ),
  );

  // scrollToBottom();

  useFocusEffect(
    React.useCallback(() => {
      setStoreCurrentContact(roomKey);
      return () => {};
    }, [roomKey]),
  );

  function onShowCall() {
    bottomSheetRef?.current?.snapToIndex(0);
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
            <View style={{ flexDirection: 'row', gap: 10, marginLeft: -5 }}>
            <TouchableOpacity
              style={{ flexDirection: 'row' }}
              onPress={onShowCall}>
              <View style={{ marginRight: 5, marginTop: 4 }}>
                <Unreads
                  unreads={0}
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
              <View style={{ position: 'relative', marginRight: 5, marginTop: 4 }}>
                {roomKey && (
                  <Avatar
                    base64={getAvatar(roomKey)}
                    address={roomKey}
                    size={30}
                  />
                )}
                <View style={{position: 'absolute', top: -4, right: -4}}>
                  <CustomIcon
                    name={'lens'}
                    size={10}
                    type={'MI'}
                    color={`${online ? 'green' : 'grey'}`}
                    />
                </View>
              </View>
            </TouchableOpacity>
            </View>
          }
        />
      ),
    });
  }, [roomKey, name, online]);

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
    emoji: boolean | undefined,
    tip?: JSON | undefined,
  ) {
    if (file) {
      text = file.fileName;
    }

    console.log('Sending to room:', name);
    if (file) {
      Beam.file(roomKey, file);
      //If we need to return something... or print something locally
      // console.log('sent file!', sentFile);
    } else {
      ///
      // const beam = false; //// *** check if connected to this user in beam.
      const { hash, success, error } = await Wallet.send_message(
        text,
        huginAddress,
        online,
      );

      if (error === 'balance') {
        Toast.show({
          text1: t('noFunds'),
          type: 'error',
        });
        return;
      }
      if (hash) {
        const saved = await saveMessage(
          roomKey,
          text,
          '',
          Date.now(),
          hash,
          true,
          address,
          undefined,
          name,
        );
        if (saved) {
          updateMessage(saved);
          setLatestMessages();
        }
      }

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
      <GestureHandlerRootView>
      {/* Full-Screen Image Viewer */}
      {showImage && (
        <FullScreenImageViewer
          imagePath={showImagePath}
          onClose={() => setShowImage(false)}
        />
      )}
      {tipping && (
        <TouchableOpacity
          style={[styles.modal, { backgroundColor }]}
          onPress={() => setTipping(false)}>
          <View style={styles.tipContainer}>
            <InputField
              label={''}
              value={tipAmount}
              onChange={setTipAmount}
              onSubmitEditing={sendTip}
            />
            <TextButton onPress={sendTip}>{t('send')}</TextButton>
            <View style={styles.divider} />
            <TextButton onPress={() => setTipping(false)}>
              {t('close')}
            </TextButton>
          </View>
        </TouchableOpacity>
      )}
      <FlatList
        inverted
        ref={flatListRef}
        data={messages}
        keyExtractor={(item: Message, i) => `${item.address}-${i}`}
        renderItem={({ item }) => {
          return (
            <GroupMessageItem
              dm={true}
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
          dm={true}
        />
      </KeyboardAvoidingView>
      <BottomSheet
          ref={bottomSheetRef}
          onChange={() => {}}
          snapPoints={snapPoints}
          index={-1}
          enablePanDownToClose={true}
          backgroundStyle={{backgroundColor: 'transparent'}}
          bottomInset={10}
          handleIndicatorStyle={{ backgroundColor: color }}>
          <BottomSheetView
            style={[{ backgroundColor, borderColor }, styles.contentContainer]}>
            {/* <TextField>Awesome 🎉</TextField> */}
            <View style={{ flex: 1, width: '100%' }}>
              <View style={styles.flatListContainer}>
                <TextField size={'xsmall'} type="muted" style={styles.onlineUsersText}>
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
  flatListContent: {
    flexDirection: 'column-reverse',
    paddingTop: 60,
  },
  inputWrapper: {
    bottom: 6,
    left: 0,
    // marginBottom: 10,
    paddingBottom: 10,
    position: 'absolute',
    right: 0,
  },
  modal: {
    alignSelf: 'center',
    borderRadius: 20,
    position: 'absolute',
    top: '10%',
    width: '50%',
    zIndex: 5,
  },
  tipContainer: {
    padding: 20,
    zIndex: 5,
  },
  contentContainer: {
    alignItems: 'center',
    flex: 1,
    padding: 25,
    marginBottom: 10,
    borderRadius: 25,
    borderWidth: 1
  },
  onlineUsersText: {
    textAlign: 'center',
    width: '100%',
    marginTop: -10,
    marginBottom: 10
  },
  flatListContainer: {
    flex: 1,
    marginVertical: 12,
  },
  flatListWrapper: {
    flex: 1,
  },
});
