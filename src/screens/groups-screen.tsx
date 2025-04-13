import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { Alert, FlatList, TouchableOpacity, View } from 'react-native';

import {
  useFocusEffect,
  useNavigation,
  type RouteProp,
} from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  Camera,
  CameraRuntimeError,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';

import {
  Container,
  CustomIcon,
  Header,
  InputField,
  ModalCenter,
  PreviewItem,
  ScreenLayout,
  TextButton,
  TextField,
} from '@/components';
import { MainScreens } from '@/config';
import {
  setStoreCurrentRoom,
  setStoreRoomMessages,
  useGlobalStore,
  useRoomStore,
  useUserStore,
} from '@/services';
import type { MainStackNavigationType, MainNavigationParamList } from '@/types';

import { joinAndSaveRoom, setRoomMessages } from '../services/bare/groups';

interface Props {
  route: RouteProp<MainNavigationParamList, typeof MainScreens.GroupsScreen>;
}

export const GroupsScreen: React.FC<Props> = ({ route }) => {
  const { t } = useTranslation();
  const user = useUserStore((state) => state.user);
  const navigation = useNavigation<MainStackNavigationType>();
  const rooms = useGlobalStore((state) => state.rooms);
  const [modalVisible, setModalVisible] = useState(false);
  const [qrScanner, setQrScanner] = useState(false);
  const [joining, setJoinVisible] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const { setThisRoom } = useRoomStore();
  const device = useCameraDevice('back');
  const camera = useRef<Camera>(null);
  const { hasPermission, requestPermission } = useCameraPermission();
  if (device == null) {
    // Alert.alert('Error!', 'Camera could not be started');
  }

  useEffect(() => {
    if (route.params?.joining) {
      setModalVisible(true);
      setJoinVisible(true);
    }
    if (route.params?.link) {
      setLink(route.params.link);
    }
  }, [route.params]);

  const onError = (error: CameraRuntimeError) => {
    Alert.alert('Error!', error.message);
  };

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      console.log('Got qr:', codes);
      if (codes.length > 0) {
        if (codes[0].value) {
          setTimeout(() => gotQRCode(codes[0].value), 500);
        }
      }
      return;
    },
  });

  function gotQRCode(code) {
    setLink(code);
    setQrScanner(false);
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <Header
          title={t('rooms')}
          right={
            <TouchableOpacity onPress={onAddGroupPress}>
              <CustomIcon type="IO" name="add-outline" size={30} />
            </TouchableOpacity>
          }
        />
      ),
    });
  }, [navigation]);

  function onAddGroupPress() {
    setModalVisible(true);
  }

  async function onPress(roomKey: string, name: string) {
    await setRoomMessages(roomKey, 0);
    setStoreCurrentRoom(roomKey);
    setThisRoom(roomKey);
    navigation.push(MainScreens.GroupChatScreen, {name, roomKey});
  }

  function onCloseModal() {
    setModalVisible(false);
    setJoinVisible(false);
    setQrScanner(false);
    setLink('');
  }

  function finishQrScanner() {
    console.log('qrscanner finsihed');
    // setQrScanner(false);
    setLink('');
  }

  function onJoinPress() {
    setJoinVisible(true);
  }

  function onCreateRoom() {
    setStoreRoomMessages([]);
    setModalVisible(false);
    navigation.navigate(MainScreens.AddGroupScreen);
  }

  function onInputChange(text: string) {
    setLink(text);
  }

  useFocusEffect(
    useCallback(() => {
      // This effect runs when the screen is focused
      setStoreCurrentRoom('null');

      return () => {};
    }, []),
  );

  const onScanPress = async () => {
    if (!hasPermission) {
      await requestPermission();
    }
    setQrScanner(true);
  };

  function onJoinpress() {
    setStoreRoomMessages([]);
    if (!link) {
      return;
    }
    const parse = link.split("/")
    const roomName = parse[2];
    const originalName = roomName.replace(/-/g, ' ');
    const inviteKey = parse[3];
    if (inviteKey.length != 128) {
      return;
    }


    if (inviteKey && originalName && user?.address) {
      joinAndSaveRoom(inviteKey, originalName, user.address, user?.name);

      setModalVisible(false);
      navigation.push(MainScreens.GroupChatScreen, {
        name: roomName,
        roomKey: inviteKey,
      });
      setLink('');
    }
  }

  return (
    <ScreenLayout>
      <ModalCenter visible={modalVisible} closeModal={onCloseModal}>
        {joining && !qrScanner && (
          <>
            <InputField
              label={t('inviteLink')}
              value={link}
              onChange={onInputChange}
              onSubmitEditing={onJoinpress}
            />
            <TextButton onPress={onScanPress}>{t('scanQR')}</TextButton>
            <TextButton disabled={link === null} onPress={onJoinpress}>
              {t('joinRoom')}
            </TextButton>
          </>
        )}

        {joining && qrScanner && (
          <View
            style={{
              borderRadius: 10,
              height: 300,
              margin: -30,
              overflow: 'hidden',
              width: 300,
            }}>
            <Camera
              ref={camera}
              onError={onError}
              photo={false}
              style={styles.fullScreenCamera}
              device={device}
              codeScanner={codeScanner}
              isActive={qrScanner}
            />
          </View>
        )}

        {!joining && (
          <View>
            <TextField size="small">{t('createRoomDescr')}</TextField>
            <TextButton onPress={onCreateRoom}>{t('createRoom')}</TextButton>
            <View style={styles.divider} />
            <TextField size="small">{t('joinRoomDescr')}</TextField>
            <TextButton onPress={onJoinPress}>{t('joinRoom')}</TextButton>
          </View>
        )}
      </ModalCenter>
      {rooms.length === 0 && (
        <Container>
          <TextField size="large">{t('emptyAddressBook')}</TextField>
        </Container>
      )}
      <FlatList
        data={rooms}
        keyExtractor={(item, i) => `${item.roomKey}-${i}`}
        renderItem={({ item }) => <PreviewItem {...item} onPress={onPress} />}
      />
    </ScreenLayout>
  );
};

const styles = {
  divider: {
    marginVertical: 10,
  },
  fullScreenCamera: {
    flex: 1,
    height: '100%',
    position: 'absolute',
    width: '100%',
    zIndex: 100,
  },
  inviteContainer: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
    // Set a fixed width
    maxWidth: 300,
    // Prevent expansion
    padding: 10,
    width: 300,
  },
};
