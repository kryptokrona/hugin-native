import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useEffect
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
  CallUserItem,
} from '@/components';

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
  route: RouteProp<MainNavigationParamList, typeof MainScreens.CallScreen>;
}

export const CallScreen: React.FC<Props> = ({ route }) => {
  const theme = useThemeStore((state) => state.theme);
  const backgroundColor = theme.background;
  const borderColor = theme.border;
  const color = theme.foreground;
  const navigation = useNavigation<MainStackNavigationType>();
  const flatListRef = useRef<FlatList>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const myUserAddress = useGlobalStore((state) => state.address);
  const currentCall = useGlobalStore((state) => state.currentCall);
  const inCallUsers = 0;


  const userList = useMemo(() => {
    return currentCall.users;
  }, [currentCall.users]);

  function OnlineUserMapper({ item }: { item: User }) {
    return <CallUserItem {...item} />;
  }

  // const handleSheetChanges = useCallback((index: number) => {
  //   console.log('handleSheetChanges', index);
  // }, []);

  const scrollToBottom = () => {
    flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
  };

  const showBigImage = (path?: string) => {
    if (!path) {
      return;
    }
    setImagePath(path);
  };

  useEffect(() => {
    if (currentCall.room.length === 0) {
      navigation.goBack();
    }
  }, [currentCall.room, navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <Header
          backButton
          title={t('currentCall')}
        />
      ),
    });
  }, []);


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

            <View style={{ flex: 1, width: '100%' }}>
              <View style={styles.flatListContainer}>
                <View style={styles.flatListWrapper}>
                  <FlatList
                    nestedScrollEnabled={true}
                    columnWrapperStyle={{ gap: 10 }}
                    contentContainerStyle={{ gap: 10 }}
                    numColumns={2}
                    data={userList}
                    renderItem={OnlineUserMapper}
                    keyExtractor={(item, i) => `${item.name}-${i}`}
                    style={{ flex: 1, gap: 5 }}
                  />
                </View>
              </View>
            </View>
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
    paddingTop: 60
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
