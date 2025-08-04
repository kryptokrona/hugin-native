import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
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
  ModalCenter,
  ModalBottom,
  TouchableOpacity,
  CallModal
} from '@/components';
import { MainScreens } from '@/config';
import {
  useGlobalStore,
  useUserStore,
  useThemeStore,
  getCurrentRoom,
  setStoreCurrentContact,
  WebRTC,
  setStoreMessages,
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
import { textType } from '@/styles';
import { GlideInItem } from '../components/glider';

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
  const [modalVisible, setModalVisible] = useState(false);
  const registerAddress =
    'SEKReVsk6By22AuCcRnQGkSjY6r4AxuXxSV9ygAXwnWxGAhSPinP7AsYUdqPNKmsPg2M73FiA19JT3oy31WDZq1jBkfy3kxEMNM';

  const allRoomUsers = useGlobalStore((state) => state.roomUsers);
  const [roomUsers, setRoomUsers] = useState<User[]>([]);
  const [voiceUsers, setVoiceUsers] = useState<User[]>([]);
  const [online, setOnline] = useState(false);

  const currentCall = useGlobalStore((state) => state.currentCall);
  
  const myUserAddress = useGlobalStore((state) => state.address);

  
  const keyRef = useRef('null');
  const inCall = currentCall.room === keyRef.current;

  const [callMenuActive, setCallMenuActive] = useState<boolean>(false);

  function onCloseCallMenu() {
    setCallMenuActive(false);
  }

  useEffect(() => {
    if (keyRef.current != 'null') return; // Prevent re-execution if key is already set
    const deriveKey = async () => {
      const derivedKey = await Wallet.key_derivation_hash(roomKey);
      keyRef.current = derivedKey;
      console.log('derived key', derivedKey);
      setRoomUsers(allRoomUsers[derivedKey])
    };

    deriveKey();
  }, [roomKey]); // Run only when `roomKey` changes


const handleRoomUserUpdate = () => {
  if (keyRef.current === 'null') return;
  const currentRoomUsers = useGlobalStore.getState().roomUsers[keyRef.current];
  setRoomUsers(currentRoomUsers);
  setOnline(currentRoomUsers?.some((a) => a.address === roomKey));
  setVoiceUsers(currentRoomUsers?.filter(a => a.voice === true));
};

useEffect(() => {
  handleRoomUserUpdate();
}, []);

useEffect(() => {
  handleRoomUserUpdate();
}, [allRoomUsers, keyRef.current]);
  

  const upgradeHugin = () => {

    if (!Wallet?.messageKeys[1]) return;

    navigation.navigate(MainScreens.WalletStack, {
      screen: MainScreens.SendTransactionScreen,
      params: {
        address: registerAddress,
        paymentId: Wallet.messageKeys[1],
        amount: "99"
      }
    });

    setModalVisible(false);

  }



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
      WebRTC.init();
      onCloseCallMenu();
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
        room: keyRef.current
      };
      const me = roomUsers.filter((a) => a.address === myUserAddress)[0];
      me.voice = true;
      const call = { room: keyRef.current, time: Date.now(), users: [...userList, me], talkingUsers: {} };
      useGlobalStore.getState().setCurrentCall(call);
      Peers.voicestatus(peer);
      if (voiceUsers?.length > 0) return; // Change to voice
      Wallet.start_call(keyRef.current, huginAddress);
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
        room: keyRef.current
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

  // scrollToBottom();

  useFocusEffect(
    React.useCallback(() => {
      setStoreCurrentContact(roomKey);
      return () => {};
    }, [roomKey]),
  );

  function onShowCall() {
    setCallMenuActive(true);
  }

  useLayoutEffect(() => {
    const isAdmin = true; // TODO
    const icon = isAdmin ? 'users-cog' : 'users';
    navigation.setOptions({
      header: () => (
        <Header
          backButton
          title={name.substring(0,10) + (name.length > 10 ? '..' : '')}
          right={
            <View style={{ flexDirection: 'row', gap: 10, marginLeft: -5, marginRight: 10 }}>
            <TouchableOpacity
              style={{ flexDirection: 'row', marginTop: 5 }}
              onPress={onShowCall}>
              <View style={{ position: 'absolute', bottom: -3, right: -5  }}>
                <Unreads
                style={{transform: [{ scale: 0.8 }], zIndex: 9999999}}
                  unreads={userList?.length}
                  color={`${inCall ? 'green' : 'grey'}`}
                />
              </View>

              <CustomIcon size={24} type="MCI" name={'phone'} />
              <View style={{ marginLeft: -5, marginTop: -3 }}>
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
              <View style={{ position: 'relative', marginRight: 20, marginTop: 0 }}>
                {roomKey && (
                  <Avatar
                    base64={getAvatar(roomKey)}
                    address={roomKey}
                    size={36}
                    onPress={onCustomizeGroupPress}
                  />
                )}
                <View style={{position: 'absolute', top: 2, right: -4}}>
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
  }, [roomKey, name, online, userList]);

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
    file: SelectedFile | undefined,
    reply: string,
    emoji: boolean | undefined,
    tip?: JSON | undefined,
    retryHash?: string | undefined
  ) {


      const newMessage: Message = {
        address: myUserAddress,
        message: text,
        reply,
        timestamp: Date.now(),
        nickname: userName,
        hash: Date.now().toString(),
        sent: true,
        reactions: [],
        joined: false,
        file
      };

      const messageList = retryHash ? messages.filter(a => a.hash != retryHash) : messages;

      setStoreMessages([...messageList, newMessage]);

    if (file) {
      text = file.fileName;
    }

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

      if (!success) {
          Toast.show({
            text1: error,
            type: 'error',
          });   

        if (error == 'Not verified.') {
          setModalVisible(true);
        }

        newMessage.status = 'failed';
        setStoreMessages([...messageList, newMessage]);

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

      <ModalCenter
        visible={modalVisible && Platform.OS == 'android'}
        closeModal={() => setModalVisible(false)}>
        <View style={styles.inviteContainer}>
          <TextField size="large" weight="medium">
            Upgrade to Hugin +
          </TextField>
          <TextField size="medium" weight="small">
            ✅ Send offline messages!
          </TextField>
          <TextField size="medium" weight="small">
            ✅ Support the project!
          </TextField>
          <TextField size="medium" weight="small">
            💸 One time cost of 99 XKR
          </TextField>
          <TextButton onPress={upgradeHugin}>Upgrade now</TextButton>
          <TextButton onPress={() => setModalVisible(false)}>Close</TextButton>
        </View>
      </ModalCenter>
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
        renderItem={({ item, index }) => {
          const isNewestMessage = index === messages.length - 1;
      
          const messageContent = (
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
              status={item.status}
              onPress={item.status == 'failed' ? 
                () => onSend(item.message, item.file, item.reply, false, false, item.hash) : 
                () => {}}
            />
          );
      
          return isNewestMessage ? (
            <GlideInItem>{messageContent}</GlideInItem>
          ) : (
            messageContent
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
  flatListContent: {
    flexDirection: 'column-reverse',
    paddingTop: 60,
  },
  inputWrapper: {
    bottom: 0,
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
    minHeight: 200
  },
  inviteContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 300,
    padding: 10,
    width: 300,
  },
});