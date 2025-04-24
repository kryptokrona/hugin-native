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
import { getFeedMessages } from '../services/bare/sqlite';

interface Props {
  route: RouteProp<MainNavigationParamList, typeof MainScreens.FeedScreen>;
}

export const FeedScreen: React.FC<Props> = ({ route }) => {
  const theme = useThemeStore((state) => state.theme);
  const backgroundColor = theme.background;
  const borderColor = theme.border;
  const color = theme.foreground;
  const navigation = useNavigation<MainStackNavigationType>();
  const flatListRef = useRef<FlatList>(null);
  const [replyToMessageHash, setReplyToMessageHash] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  // const { roomKey, name } = route.params;
  const messages = useGlobalStore((state) => state.feedMessages);


  useEffect(() => {
    // const getFeedMessagesFromDB = async (page=0) => {
    //   console.log('Get DB feeds');
    //   const thisMessages = await getFeedMessages(page);
    //   setMessages(thisMessages);
    // }
    // getFeedMessagesFromDB();
    setFeedMessages(0);
    return () => {
      console.log('Screen unmounted');
    };
  }, []);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      // Your actual refresh logic here:
      await setFeedMessages(0);  // or call getFeedMessages / fetch new data
    } catch (error) {
      console.error('Error refreshing feed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // const messages = [
  //   {
  //     "address": "SEKReXGS2GSG65cY9ZSPTC6RAnq1NN8ziSNA3Af4DgWmPbJmM7LbKUze5PCLAgugDmdkerZHZ2wNDJ3Eb1Ys4ZgaQfXNfFbjQSc",
  //     "file": undefined, 
  //     "hash": "295c0c0a896fcfd1a5a50e972a1e4c62ba6b67ea719a3ca22772e046ca40d905", 
  //     "message": "12test", 
  //     "nickname": "aaa", 
  //     "reactions": [], 
  //     "replies": [], 
  //     "reply": "", 
  //     "replyto": false, 
  //     "room": "8828094c877f097854c5122013b5bb0e804dbe904fa15aece310f62ba93dc76c55bb8d1f705afa6f45aa044fb4b95277a7f529a9e55782d0c9de6f0a6fb367cc",
  //     "sent": 0,f
  //     "timestamp": 1742700693766, 
  //     "tip": "false"
  //   }
  // ]
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [tipping, setTipping] = useState(false);
  const [tipAmount, setTipAmount] = useState<string>('0');
  const [tipAddress, setTipAddress] = useState<string>('');

  const bottomSheetRef = useRef<BottomSheet>(null);
  const myUserAddress = useGlobalStore((state) => state.address);
  const user = useUserStore((state) => state.user);

  const replyToName = useMemo(() => {
    if (!replyToMessageHash) {
      return '';
    }

    const message = messages.find((m) => m.hash === replyToMessageHash);
    return message ? message.nickname : '';
  }, [replyToMessageHash, messages]);

  const snapPoints = useMemo(() => ['30%'], []);

  function OnlineUserMapper({ item }: { item: User }) {
    return <UserItem {...item} />;
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

  function onCreatePost() {
    
      bottomSheetRef?.current?.snapToIndex(0);

  }

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <Header
          title={'Feed'}
          right={
            <TouchableOpacity onPress={onCreatePost}>
              <CustomIcon type="IO" name="add-outline" size={30} />
            </TouchableOpacity>
          }
        />
      ),
    });
  }, []);

  async function onSend(
    text: string,
    file: SelectedFile | null,
    reply?: string,
    emoji?: boolean | undefined,
    tip?: TipType | undefined,
  ) {
    console.log('Sending feed message');
    if (file) {
      onSendFeedMessageWithFile(file, text);
      //If we need to return something... or print something locally
      // console.log('sent file!', sentFile);
    }
    if (text.length) {
      const sent = await Rooms.feed_message(
        text,
        reply ? reply : replyToMessageHash,
        tip ? tip : false,
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
    if (!emoji) {
      scrollToBottom();
      bottomSheetRef.current.close()
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
    <ScreenLayout padding={false}>
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
          // inverted
          ref={flatListRef}
          data={messages}
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
          ItemSeparatorComponent={<View style={{marginLeft: '-100%', width: '250%', borderColor, borderTopWidth: 1}} />}
          initialNumToRender={messages.length}
          maxToRenderPerBatch={messages.length}
          // refreshing={refreshing}
          // onRefresh={onRefresh}
        />

        {/* <KeyboardAvoidingView
          style={[styles.inputWrapper, { backgroundColor }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 97 : 0}>
          <MessageInput
            onSend={onSend}
            replyToName={replyToName}
            onCloseReplyPress={onCloseReplyPress}
          />
        </KeyboardAvoidingView> */}
        {/* <BottomSheet
          ref={bottomSheetRef}
          // onChange={handleSheetChanges}
          snapPoints={snapPoints}
          index={-1}
          enablePanDownToClose={true}
          keyboardBehavior="interactive"
          backgroundStyle={{backgroundColor: 'transparent'}}
          bottomInset={10}
          handleIndicatorStyle={{ backgroundColor: color }}>
          <BottomSheetView
            style={[{ backgroundColor, borderColor }, styles.contentContainer]}>
            
            <View
              style={[styles.inputWrapper]}
              // behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              // keyboardVerticalOffset={Platform.OS === 'ios' ? 97 : 0}
              >
              <MessageInput
                onSend={onSend}
                replyToName={replyToName}
                onCloseReplyPress={onCloseReplyPress}
                hideExtras={true}
              />
            </View>
            
          </BottomSheetView>
        </BottomSheet> */}
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
    padding: 25,
    marginBottom: 10,
    borderRadius: 25,
    borderWidth: 1,
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
    flexDirection: 'column',
    // paddingTop: 60,
  },
  flatListWrapper: {
    flex: 1,
  },
  inputWrapper: {
    paddingBottom: 10,
    flex: 1,
    width: '100%',
    minHeight: 60,
  },
});
