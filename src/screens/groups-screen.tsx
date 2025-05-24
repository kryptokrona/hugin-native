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
  const navigationInProgressRef = useRef(false);


  const suggestedRooms = [
  {
    name: 'Hugin',
    roomKey: '8828094c877f097854c5122013b5bb0e804dbe904fa15aece310f62ba93dc76c55bb8d1f705afa6f45aa044fb4b95277a7f529a9e55782d0c9de6f0a6fb367cc',
    invite: 'hugin://Hugin/8828094c877f097854c5122013b5bb0e804dbe904fa15aece310f62ba93dc76c55bb8d1f705afa6f45aa044fb4b95277a7f529a9e55782d0c9de6f0a6fb367cc'
  },
  {
    name: 'Kryptokrona',
    roomKey: '63a34ec1982f923b584a2d8de16f9578a722945382152fba20c83e48363a2b9d8f592bfec505d30772f60bff80b8474f75b497c4a8417c13188ded33cca673f0',
    invite: 'hugin://Kryptokrona/63a34ec1982f923b584a2d8de16f9578a722945382152fba20c83e48363a2b9d8f592bfec505d30772f60bff80b8474f75b497c4a8417c13188ded33cca673f0'
  },
  {
    name: 'Support',
    roomKey: '8ebc23b43ffbe8f7c4c2725590d4c40d7e2ae182fb8480e19c326ceef3a372483b78391ccd761d11960e29b5bccf081616a8695283d2e9fa63b801a0b8ca421d',
    invite: 'hugin://Support/8ebc23b43ffbe8f7c4c2725590d4c40d7e2ae182fb8480e19c326ceef3a372483b78391ccd761d11960e29b5bccf081616a8695283d2e9fa63b801a0b8ca421d'
  },
];

const joinedRoomKeys = new Set(rooms.map(r => r.roomKey));
const filteredSuggestedRooms = suggestedRooms.filter(r => !joinedRoomKeys.has(r.roomKey));



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
  }, [navigation, t]);

  function onAddGroupPress() {
    setModalVisible(true);
  }

  async function onPress(roomKey: string, name: string) {

  navigationInProgressRef.current = true;
  try {
    await setRoomMessages(roomKey, 0);
    setStoreCurrentRoom(roomKey);
    setThisRoom(roomKey);
    navigation.push(MainScreens.GroupChatScreen, { name, roomKey });
  } finally {
    setTimeout(() => {navigationInProgressRef.current = false}, 300);
  }
}

  function onSuggestedPress(invite: string) {
    onJoinpress(invite);
  }

  function onCloseModal() {
    setModalVisible(false);
    setJoinVisible(false);
    setQrScanner(false);
    setLink('');
  }

  function finishQrScanner() {
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

  function onJoinpress(linkToUse?: string) {
    setStoreRoomMessages([]);
    if (!link && !linkToUse) {
      return;
    }

    let parse;
    if (!linkToUse) {
      parse = link.split("/")
    } else {
      parse = linkToUse.split("/")
    }
    const roomName = parse[2];
    const originalName = roomName.replace(/-/g, ' ');
    const inviteKey = parse[3];
    if (inviteKey.length != 128) {
      return;
    }
    setStoreCurrentRoom(inviteKey);
    setThisRoom(inviteKey);

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
        renderItem={({ item }) => <PreviewItem {...item} onPress={navigationInProgressRef.current ? () => {} : onPress} />}
      />
      {filteredSuggestedRooms.length > 0 && rooms.length < 3 && (
  <Container>
    <View style={{alignItems: 'center'}}>

    
    <TextField size="small">{t('suggestedRooms', 'Suggested Rooms')}</TextField>
    {filteredSuggestedRooms.map((room) => (
      <PreviewItem
        key={room.roomKey}
        name={room.name}
        roomKey={room.roomKey}
        onPress={() => onSuggestedPress(room.invite)}
        suggested={true}
      />

    ))}
    <View style={styles.divider} />
    </View>
  </Container>
)}

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
