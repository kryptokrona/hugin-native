import { useCallback, useLayoutEffect, useState } from 'react';

import {
  Alert,
  Dimensions,
  FlatList,
  StyleSheet,
  View,
} from 'react-native';

import Clipboard from '@react-native-clipboard/clipboard';
import {
  useFocusEffect,
  useNavigation,
  type RouteProp,
} from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useCameraPermission } from 'react-native-vision-camera';

import {
  CustomIcon,
  EmptyPlaceholder,
  Header,
  InputField,
  ModalCenter,
  PreviewItem,
  QrCodeDisplay,
  QrScanner,
  ScreenLayout,
  TextButton,
  TextField,
  TouchableOpacity
} from '@/components';
import { MainScreens } from '@/config';
import {
  setStoreCurrentContact,
  setStoreMessages,
  useGlobalStore,
  useUserStore,
} from '@/services';
import type { MainStackNavigationType, MainNavigationParamList } from '@/types';

import { Beam } from '../lib/native';
import { setLatestMessages, setMessages } from '../services/bare/contacts';
import { addContact, deleteContact } from '../services/bare/sqlite';

import 'text-encoding';

interface Props {
  route: RouteProp<MainNavigationParamList, typeof MainScreens.MessagesScreen>;
}

const windowWidth = Dimensions.get('window').width;
const exactWidth = windowWidth - 100;

export const MessagesScreen: React.FC<Props> = () => {
  const { t } = useTranslation();
  const user = useUserStore((state) => state.user);
  const navigation = useNavigation<MainStackNavigationType>();
  const contacts = useGlobalStore((state) => state.contacts);
  const [modalVisible, setModalVisible] = useState(false);
  const [joining, setJoining] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [name, setName] = useState('Anon');
  const [qrScanner, setQrScanner] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const { hasPermission, requestPermission } = useCameraPermission();

  function gotQRCode(code: string | undefined) {
    setLink(code ?? null);
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
    setJoining(false);
    setQrScanner(false);
    setShowQR(false);
    setLink('');
  }

  const onScanPress = async () => {
    if (!hasPermission) {
      await requestPermission();
    }
    setQrScanner(true);
  };

  function onJoinPress() {
    setJoining(true);
  }

  function removeContact(contact: { address: string; name: string }) {
    const doRemoveContact = async (address: string) => {
      await deleteContact(address);
      setLatestMessages();
    };

    Alert.alert(t('deleteContact'), t('areYouSure'), [
      {
        onPress: () => doRemoveContact(contact.address),
        style: 'destructive',
        text: t('delete'),
      },
      { onPress: () => {}, text: t('cancel') },
    ]);
  }

  function onCreateRoom() {
    if (!user.huginAddress) {
      return;
    }
    Clipboard.setString(user.huginAddress);
    setModalVisible(false);
  }

  function onInputChange(text: string) {
    setLink(text);
  }

  function onNameChange(text: string) {
    setName(text);
  }

  useFocusEffect(
    useCallback(() => {
      // This effect runs when the screen is focused
      setStoreCurrentContact('null');

      return () => {};
    }, []),
  );

  async function onJoinpress() {
    setStoreMessages([]);

    if (!link) {
      return;
    }

    const xkrAddr = link?.substring(0, 99);
    const messageKey = link?.slice(-64);

    await addContact(name, xkrAddr, messageKey, true);

    Beam.new(xkrAddr);

    // Beam.connect(
    //   Wallet.key_derivation_hash(xkrAddr),
    //   xkrAddr + messageKey,
    //   false,
    // );

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
          <QrScanner visible={qrScanner} onGotQrCode={gotQRCode} />
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
        {!joining && showQR && <QrCodeDisplay code={user.huginAddress} />}
      </ModalCenter>
      {contacts.length === 0 && (
        <EmptyPlaceholder text={t('emptyAddressBook')} />
      )}
      <FlatList
        data={contacts}
        keyExtractor={(item, i) => `${item.address}-${i}`}
        renderItem={({ item }) => (
          <PreviewItem
            {...item}
            onLongPress={() => removeContact(item)}
            onPress={onPress}
          />
        )}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  divider: {
    marginVertical: 10,
  },
});
