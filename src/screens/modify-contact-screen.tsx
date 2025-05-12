import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { StyleSheet, TouchableWithoutFeedback, View } from 'react-native';

import {
  RouteProp,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import {
  Avatar,
  Card,
  CopyButton,
  Header,
  InputField,
  ModalCenter,
  ScreenLayout,
  TextButton,
  TextField,
} from '@/components';
import { MainScreens } from '@/config';
import { setStoreCurrentContact, useGlobalStore } from '@/services';
import { MainNavigationParamList, MainStackNavigationType } from '@/types';

import { setLatestMessages, setMessages } from '../services/bare/contacts';
import { deleteContact, updateContact } from '../services/bare/sqlite';
import { getAvatar } from '../utils/avatar';
import { Wallet } from '../services/kryptokrona/wallet';

interface Props {
  route: RouteProp<
    MainNavigationParamList,
    typeof MainScreens.ModifyContactScreen
  >;
}

export const ModifyContactScreen: React.FC<Props> = ({ route }) => {
  const { t } = useTranslation();
  const { name, roomKey } = route.params;
  const navigation = useNavigation<MainStackNavigationType>();
  const contacts = useGlobalStore((state) => state.contacts);
  const messageKey = contacts.find((a) => a.address === roomKey)?.messagekey;
  const huginAddress = roomKey + messageKey;
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState(name);
  const keyRef = useRef('null');

    useEffect(() => {
  
      const deriveKey = async () => {
        const derivedKey = await Wallet.key_derivation_hash(roomKey);
          console.log("huginAddress", huginAddress)
          keyRef.current = derivedKey
      };
  
      deriveKey();
    }, [roomKey]); // Run only when `roomKey` changes

  const onCloseModal = () => {
    setModalVisible(false);
  };

  const onNameChange = (text: string) => {
    setNewName(text);
  };

  const onChangeName = async () => {
    const updatedName = await updateContact(newName, roomKey);
    if (updatedName === newName) {
      setLatestMessages();
      await setMessages(roomKey, 0);
      navigation.navigate(MainScreens.MessageScreen, {
        name: newName,
        roomKey,
      });
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <Header
          backButton
          title={name}
          onBackPress={() =>
            navigation.navigate(MainScreens.MessageScreen, { name, roomKey })
          }
          right={
            <View style={{ flexDirection: 'row' }}>
              <View style={{ marginRight: 5, marginTop: 4 }}>
                {roomKey && (
                  <Avatar
                    base64={getAvatar(roomKey)}
                    address={roomKey}
                    size={30}
                  />
                )}
              </View>
            </View>
          }
        />
      ),
    });
  }, [name]);

  useFocusEffect(
    React.useCallback(() => {
      // This effect runs when the screen is focused
      if (!keyRef.current) return
        setStoreCurrentContact(keyRef.current);
      return () => {};
    }, [roomKey]),
  );

  // function onNameInput(value: string) {
  //   setGroupName(value);
  // }

  // async function onUploadAvatar() {
  //   const base64 = await pickAvatar();
  //   if (base64) {
  //     // TODO
  //   }
  // }

  // async function onSave() {
  //   // TODO
  // }

  async function onLeave() {
    await deleteContact(roomKey);
    setLatestMessages();
    // onDeleteGroup(roomKey);
    navigation.navigate(MainScreens.MessagesScreen);
  }

  const inviteText = useMemo(() => {
    return huginAddress;
  }, [name, roomKey]);

  return (
    <ScreenLayout>
      <ModalCenter visible={modalVisible} closeModal={onCloseModal}>
        <View>
          <InputField
            label={t('nickname')}
            value={newName}
            onChange={onNameChange}
          />
          <TextButton onPress={onChangeName}>{t('changeName')}</TextButton>
        </View>
      </ModalCenter>
      <View style={styles.scrollViewContainer}>
        <TouchableWithoutFeedback>
          <Card>
            <TextField size="xsmall">{inviteText}</TextField>
          </Card>
        </TouchableWithoutFeedback>

        <CopyButton onPress={() => ''} text={t('copy')} data={inviteText} />

        <TextButton onPress={() => setModalVisible(true)}>
          {t('changeName')}
        </TextButton>

        {/* <TouchableOpacity
          onPress={onUploadAvatar}
          style={styles.avatarContainer}>
          <Avatar base64={avatar ?? getAvatar(roomKey)} />
          <View style={styles.avatarButton}>
            <CustomIcon
              type="MI"
              name="mode-edit"
              size={20}
              color={theme.accentForeground}
            />
          </View>
        </TouchableOpacity> */}

        {/* <InputField
          label={t('name')}
          value={groupName}
          onChange={onNameInput}
          maxLength={nameMaxLength}
        /> */}
        {/* <TextButton onPress={onSave}>{t('save')}</TextButton> */}
        <View style={styles.leaveContainer}>
          <TextButton onPress={onLeave} type="destructive">
            {t('deleteContact')}
          </TextButton>
        </View>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  // avatarButton: {
  //   bottom: 12,
  //   position: 'absolute',
  //   right: 10,
  // },
  // avatarContainer: {
  //   alignSelf: 'flex-start',
  //   position: 'relative',
  // },
  flatListContainer: {
    marginBottom: 12,
  },
  leaveContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrollViewContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
});
