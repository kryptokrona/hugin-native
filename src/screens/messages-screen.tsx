import React, { useLayoutEffect, useRef, useState } from 'react';

import { Alert, FlatList, TouchableOpacity, View } from 'react-native';

import Clipboard from '@react-native-clipboard/clipboard';
import {
  useFocusEffect,
  useNavigation,
  type RouteProp,
} from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-native-qrcode-svg';
import {
  Camera,
  CameraRuntimeError,
  useCameraDevice,
  useCodeScanner,
} from 'react-native-vision-camera';

import {
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
  setStoreCurrentContact,
  setStoreMessages,
  useGlobalStore,
  useUserStore,
} from '@/services';
import type { MainStackNavigationType, MainNavigationParamList } from '@/types';

import { setLatestMessages, setMessages } from '../services/bare/contacts';
import { addContact } from '../services/bare/sqlite';

import 'text-encoding';

interface Props {
  route: RouteProp<MainNavigationParamList, typeof MainScreens.MessagesScreen>;
}

export const MessagesScreen: React.FC<Props> = () => {
  const { t } = useTranslation();
  const user = useUserStore((state) => state.user);
  const navigation = useNavigation<MainStackNavigationType>();
  const contacts = useGlobalStore((state) => state.contacts);
  const [modalVisible, setModalVisible] = useState(false);
  const [joining, setJoinVisible] = useState(false);
  const [link, setLink] = useState('');
  const [name, setName] = useState('Anon');
  const [qrScanner, setQrScanner] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const device = useCameraDevice('back');
  const camera = useRef<Camera>(null);

  if (device == null) {
    Alert.alert('Error!', 'Camera could not be started');
  }

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
          title={t('messages')}
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
    await setMessages(roomKey, 0);
    setStoreCurrentContact(roomKey);
    navigation.navigate(MainScreens.MessageScreen, { name, roomKey });
  }

  function onCloseModal() {
    setModalVisible(false);
    setJoinVisible(false);
    setQrScanner(false);
    setShowQR(false);
    setLink('');
  }

  const onScanPress = () => {
    setQrScanner(true);
  };

  function onJoinPress() {
    setJoinVisible(true);
  }

  function onCreateRoom() {
    // setStoreMessages([]);
    if (!user.huginAddress) {
      return;
    }
    Clipboard.setString(user.huginAddress);
    setModalVisible(false);

    // navigation.navigate(MainScreens.AddGroupScreen);
  }

  function onInputChange(text: string) {
    setLink(text);
  }

  function onNameChange(text: string) {
    setName(text);
  }

  useFocusEffect(
    React.useCallback(() => {
      // This effect runs when the screen is focused
      setStoreCurrentContact('null');

      return () => {};
    }, []),
  );

  async function onJoinpress() {
    setStoreMessages([]);

    const xkrAddr = link.substring(0, 99);
    const messageKey = link.slice(-64);

    await addContact(name, xkrAddr, messageKey, true);

    setLatestMessages();

    setModalVisible(false);

    await setMessages(xkrAddr, 0);
    setStoreCurrentContact(xkrAddr);

    navigation.navigate(MainScreens.MessageScreen, {
      name: name,
      roomKey: xkrAddr,
    });
    setLink('');
  }

  return (
    <ScreenLayout>
      <ModalCenter visible={modalVisible} closeModal={onCloseModal}>
        {joining && !qrScanner && (
          <View>
            <InputField
              label={t('nickname')}
              value={name}
              onChange={onNameChange}
            />
            <InputField
              label={t('huginAddress')}
              value={link}
              onChange={onInputChange}
              onSubmitEditing={onJoinpress}
            />
            <TextButton onPress={onScanPress}>{t('scanQR')}</TextButton>
            <TextButton disabled={link?.length !== 163} onPress={onJoinpress}>
              {t('addUser')}
            </TextButton>
          </View>
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

        {!joining && !showQR && (
          <View>
            <TextField size="small">{t('copyYourAddress')}</TextField>
            <TextButton onPress={onCreateRoom}>{t('copy')}</TextButton>
            <TextButton onPress={() => setShowQR(true)}>
              {t('showQR')}
            </TextButton>
            <View style={styles.divider} />
            <TextField size="small">{t('addUserDescr')}</TextField>
            <TextButton onPress={onJoinPress}>{t('addUser')}</TextButton>
          </View>
        )}
        {!joining && showQR && (
          <View>
            <QRCode value={user.huginAddress} size={300} />
          </View>
        )}
      </ModalCenter>
      {contacts.length === 0 && (
        <View style={styles.emptyAddressBook}>
          <TextField centered type="muted" size="large">
            {t('emptyAddressBook')}
          </TextField>
        </View>
      )}
      <FlatList
        data={contacts}
        keyExtractor={(item, i) => `${item.address}-${i}`}
        renderItem={({ item }) => <PreviewItem {...item} onPress={onPress} />}
      />
    </ScreenLayout>
  );
};

const styles = {
  divider: {
    marginVertical: 10,
  },
  emptyAddressBook: {
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: 100,
    width: 300,
  },
  fullScreenCamera: {
    flex: 1,
    height: '100%',
    position: 'absolute',
    width: '100%',
    zIndex: 100,
  },
};
