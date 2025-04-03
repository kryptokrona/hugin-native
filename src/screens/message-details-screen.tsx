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
  FeedMessageItem,
  MessageInput,
  ScreenLayout,
  FullScreenImageViewer,
  InputField,
  TextButton,
  ModalCenter,
  Unreads,
  TextField,
  UserItem,
  Reactions,
  Avatar,
} from '@/components';

// import Animated, { useSharedValue } from 'react-native-reanimated';

import { MainScreens } from '@/config';
import {
  useGlobalStore,
  setStoreCurrentRoom,
  useThemeStore,
  WebRTC,
  useUserStore,
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
  saveFeedMessageAndUpdate,
  onSendFeedMessageWithFile,
  setFeedMessages
} from '../services/bare/feed';
import { Wallet } from '../services/kryptokrona/wallet';
import { getFeedMessage, getFeedMessages } from '../services/bare/sqlite';
import { lightenHexColor } from '@/services/utils/tools';
import { getAvatar, prettyPrintDate } from '@/utils';
import { getColors } from 'react-native-image-colors';

interface Props {
  route: RouteProp<MainNavigationParamList, typeof MainScreens.FeedScreen>;
}

export const MessageDetailsScreen: React.FC<Props> = ({ route }) => {
  const theme = useThemeStore((state) => state.theme);
  const backgroundColor = theme.background;
  const borderColor = theme.border;
  const color = theme.foreground;
  const navigation = useNavigation<MainStackNavigationType>();
  const flatListRef = useRef<FlatList>(null);
  const [replyToMessageHash, setReplyToMessageHash] = useState<string>('');
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [tipping, setTipping] = useState(false);
  const [tipAmount, setTipAmount] = useState<string>('0');
  const [tipAddress, setTipAddress] = useState<string>('');
  const [message, setMessage] = useState<Message | null>(null);
  const [userColor, setUserColor] = useState(backgroundColor);
  const [dateString, setDateString] = useState(0);

  const myUserAddress = useGlobalStore((state) => state.address);
  const user = useUserStore((state) => state.user);
  const { hash } = route.params;

  const avatar = useMemo(() => getAvatar(message?.address ?? ''), [message?.address]);

  useEffect(() => {

    async function getUserColor() {

      const thisUserColor = await getColors('data:image/png;base64,'+avatar, {
        fallback: '#228B22',
        cache: true,
        key: avatar,
      });

      console.log('Got colors: ', thisUserColor);

      setUserColor(lightenHexColor(thisUserColor?.background, 60) || thisUserColor?.vibrant);
      
    }

    getUserColor();



    }, [avatar]);

  useEffect(() => {
    async function getMessage() {

      const thisMessage = await getFeedMessage(hash);

      setMessage(thisMessage[0]);

      setDateString(prettyPrintDate(thisMessage[0].timestamp ?? 0));

    }

    getMessage();

  }, [hash]);
  console.log('THis hash: ', hash);
  console.log('THis message: ', message)


  // const replyToName = useMemo(() => {
  //   if (!replyToMessageHash) {
  //     return '';
  //   }

  //   const message = messages.find((m) => m.hash === replyToMessageHash);
  //   return message ? message.nickname : '';
  // }, [replyToMessageHash, messages]);

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

  function onCreatePost() {
    
      bottomSheetRef?.current?.snapToIndex(0);

  }

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <Header
          title={'Feed'}
          backButton
        />
      ),
    });
  }, []);

  async function onSend(
    text: string,
    // file: SelectedFile | null,
    // reply?: string,
    // emoji?: boolean | undefined,
    // tip?: TipType | undefined,
  ) {
    // console.log('Sending feed message');
    // if (file) {
    //   onSendFeedMessageWithFile(file, text);
    //   //If we need to return something... or print something locally
    //   // console.log('sent file!', sentFile);
    // }
    if (text.length) {
      const sent = await Rooms.feed_message(
        text,
        hash,
        false
      );
      const save = sent;

      // {"address": "SEKReZBSm9DNB9tHwko6Go7HqmiTDc44eXrevxMenpjKFb2Jv7A2uRHggufuR1LHvY2H1G6jW4dJxSAdD4tXM3Y2CXh6dbRBTER", 
      //   "hash": "ab7c9733d8744eaa95a46567a72279e5fb33d9c4c3722faf73a70400df8268a4", 
      //   "id": 0,
      //   "message": "Goated",
      //   "nickame": "TestFreak333",
      //   "reply": "",
      //   "signature": "993207e4e254aad2ee5009d8af522682a2355b9f4b72289404e176206b7e040904d38b6fb2e891aec34b0afc83a5d7f45ae988007dd9511d604111c3fa9ec609",
      //   "time": 1743457015793,
      //   "tip": false,
      //   "type": "send_feed_msg"}

      console.log('Sent feed msg: ', sent)

      await saveFeedMessageAndUpdate(
        save.address,
        save.message,
        save.reply,
        save.timestamp,
        save.nickname,
        save.hash,
        undefined,
        undefined,
      );
      setReplyToMessageHash('');
    }
    // if (!emoji) {
    //   scrollToBottom();
    //   bottomSheetRef.current.close()
    // }
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

  function onPressReaction() {

  }

  return (
    <ScreenLayout padding={false}>
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

        <View style={styles.messageContainer}>
          <View style={[styles.avatar, {backgroundColor: userColor}]}>
            {message?.address.length > 15 && (
              <Avatar base64={getAvatar(message?.address)} size={24} />
            )}
          </View>
          <View>
            <View style={styles.info}>
              <TextField bold size="xsmall" style={{ color }}>
                {message?.nickname}
              </TextField>
              <TextField type="muted" size="xsmall" style={styles.date}>
                {dateString}
              </TextField>
            </View>
            {/* {imageDetails?.isImageMessage && (
              <TouchableOpacity onPress={handleImagePress}>
                <Image
                  style={[{aspectRatio: imageAspectRatio}, styles.image]}
                  source={{ uri: imageDetails?.imagePath }}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )} */}
            <TextField size="small" style={styles.message}>
                {message?.message ?? ''}
            </TextField>
            {message?.reactions && 
            <Reactions items={message?.reactions} onReact={onPressReaction} />
            }
          </View>
        </View>

        <View style={{marginLeft: '-25%', width: '150%', borderColor, borderTopWidth: 1}} />

        <KeyboardAvoidingView
              style={[styles.inputWrapper, { backgroundColor }]}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 97 : 0}>
              <MessageInput
                onSend={onSend}
                // replyToName={'anon'}
                onCloseReplyPress={onCloseReplyPress}
              />
            </KeyboardAvoidingView>


        <FlatList
          // inverted
          ref={flatListRef}
          data={message?.replies}
          keyExtractor={(item: Message, i) => `${item.address}-${i}`}
          renderItem={({ item }) => {
            return (
              <FeedMessageItem
                message={item.message}
                replies={item.replies}
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
                hash={item.hash}
              />
            );
          }}
          contentContainerStyle={styles.flatListContent}
          initialNumToRender={message?.replies.length}
          maxToRenderPerBatch={message?.replies.length}
          ItemSeparatorComponent={<View style={{marginLeft: '-100%', width: '250%', borderColor, borderTopWidth: 1}} />}
        />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'grey',
    flex: 1,
  },
  flatListContainer: {
    flex: 1,
  },
  onlineUsersText: {
    textAlign: 'center',
    width: '100%',
    marginTop: -10,
    marginBottom: 10
  },
  flatListContent: {
    flexGrow: 1, 
    width: '100%',
  },
  inputWrapper: {
    bottom: 0,
    left: 0,
    // marginBottom: 10,
    paddingBottom: 10,
    position: 'absolute',
    right: 0,
    zIndex: 999999
    // flex: 1
  },
  waveFormWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignContent: 'center',
    justifyContent: 'center',
    verticalAlign: 'middle',
    alignItems: 'center',
    textAlignVertical: 'center',
    gap: 10,
    width: '100%',
  alignSelf: 'stretch',
  },
  avatar: { 
    marginRight: 10,
    // padding: 10,
    height: 32,
    width: 32,
    borderRadius: 16,
    alignItems: 'center', // Centers horizontally
    justifyContent: 'center', // Centers vertically
   },
  content: {
    flex: 1,
    flexDirection: 'column',
    overflow: 'visible',
    width: '100%',
  },
  date: {
    marginLeft: 10,
  },
  image: {
    borderRadius: 10,
    height: 'auto',
    marginVertical: 8,
    width: '92%',
  },
  info: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  message: {
    flexShrink: 1,
    marginBottom: 8,
    marginRight: 8,
    paddingRight: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    overflow: 'visible',
    padding: 15
  },

  replyContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  replyIcon: {
    marginHorizontal: 5,
    paddingTop: 10,
  },
  replyImage: {
    borderRadius: 10,
    height: 30,
    marginBottom: 8,
    marginRight: 10,
    width: 30,
  },
  replyMessage: {
    flexShrink: 1,
    paddingRight: 10,
  },
  staticWaveformView: {
    flex: 1,
  }
});
