import React, { useLayoutEffect, useState } from 'react';

import { FlatList, TouchableOpacity, View } from 'react-native';

import Clipboard from '@react-native-clipboard/clipboard';
import {
  useFocusEffect,
  useNavigation,
  type RouteProp,
} from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

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

interface Props {
  route: RouteProp<MainNavigationParamList, typeof MainScreens.MessagesScreen>;
}

export const MessagesScreen: React.FC<Props> = () => {
  //TODO** rename Groups -> Rooms
  const { t } = useTranslation();
  const user = useUserStore((state) => state.user);
  const navigation = useNavigation<MainStackNavigationType>();
  const contacts = useGlobalStore((state) => state.contacts);
  console.log('contacts', contacts);
  const [modalVisible, setModalVisible] = useState(false);
  const [joining, setJoinVisible] = useState(false);
  const [link, setLink] = useState('');
  const [name, setName] = useState('Anon');
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
    setLink('');
  }

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
        {joining && (
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
            <TextButton onPress={onJoinpress}>{t('addUser')}</TextButton>
          </View>
        )}

        {!joining && (
          <View>
            <TextField size="small">{t('copyYourAddress')}</TextField>
            <TextButton onPress={onCreateRoom}>{t('copy')}</TextButton>
            <View style={styles.divider} />
            <TextField size="small">{t('addUserDescr')}</TextField>
            <TextButton onPress={onJoinPress}>{t('addUser')}</TextButton>
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
    alignItems: 'center' as const,
    marginTop: 100,
    width: 300,
  },
};
