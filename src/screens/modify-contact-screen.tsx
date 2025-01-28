import React, { useLayoutEffect, useMemo } from 'react';

import {
  FlatList,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import {
  RouteProp,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import {
  Card,
  CopyButton,
  Header,
  ScreenLayout,
  TextButton,
  TextField,
  UserItem,
} from '@/components';
import { MainScreens } from '@/config';
import { setStoreCurrentContact, setStoreCurrentRoom, useGlobalStore } from '@/services';
import { setLatestMessages } from '../services/bare/contacts';
import {
  MainNavigationParamList,
  MainStackNavigationType,
  User,
} from '@/types';
import { deleteContact } from '../services/bare/sqlite';

interface Props {
  route: RouteProp<
    MainNavigationParamList,
    typeof MainScreens.ModifyGroupScreen
  >;
}

export const ModifyContactScreen: React.FC<Props> = ({ route }) => {
  const { t } = useTranslation();
  const { name, roomKey } = route.params;
  console.log('name, roomKey', name, roomKey);
  const navigation = useNavigation<MainStackNavigationType>();
    const contacts = useGlobalStore((state) => state.contacts);
    const messageKey = contacts.find((a) => a.address === roomKey)?.messagekey;
    const huginAddress = roomKey + messageKey;
  // const theme = useThemeStore((state) => state.theme);
  // const [avatar, setAvatar] = useState<string | null>(null);
  // const [groupName, setGroupName] = useState<string>(name); // route.params.name
  // const tempAvatar = createAvatar();
  // const isAdmin = false; // TBD
  // const theme = useThemeStore((state) => state.theme);
  // const [avatar, setAvatar] = useState<string | null>(null);
  // const [groupName, setGroupName] = useState<string>(name); // route.params.name
  // const tempAvatar = createAvatar();
  // const isAdmin = false; // TBD

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <Header
          backButton
          title={name}
          onBackPress={() =>
            navigation.navigate(MainScreens.MessageScreen, { name, roomKey })
          }
        />
      ),
    });
  }, [name]);

  useFocusEffect(
    React.useCallback(() => {
      // This effect runs when the screen is focused
      setStoreCurrentContact(roomKey);

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
      <View style={styles.scrollViewContainer}>

        <TouchableWithoutFeedback>
          <Card>
            <TextField size="xsmall">{inviteText}</TextField>
          </Card>
        </TouchableWithoutFeedback>

        <CopyButton
          onPress={() => ''}
          text={t('copy')}
          data={inviteText}
        />

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
