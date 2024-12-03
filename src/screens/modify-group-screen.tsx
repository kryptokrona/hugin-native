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
import { onDeleteGroup, setStoreCurrentRoom, useGlobalStore } from '@/services';
import {
  MainNavigationParamList,
  MainStackNavigationType,
  User,
} from '@/types';

interface Props {
  route: RouteProp<
    MainNavigationParamList,
    typeof MainScreens.ModifyGroupScreen
  >;
}

export const ModifyGroupScreen: React.FC<Props> = ({ route }) => {
  const { t } = useTranslation();
  const { name, roomKey } = route.params;
  const navigation = useNavigation<MainStackNavigationType>();
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
  const roomUsers = useGlobalStore((state) => state.roomUsers).filter(
    (a) => a.room === roomKey,
  );

  const online = useMemo(() => {
    return roomUsers;
  }, [roomUsers]);

  console.log('online', roomUsers.length);
  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <Header
          backButton
          title={name}
          onBackPress={() =>
            navigation.navigate(MainScreens.GroupChatScreen, { name, roomKey })
          }
        />
      ),
    });
  }, [name]);

  useFocusEffect(
    React.useCallback(() => {
      // This effect runs when the screen is focused
      setStoreCurrentRoom(roomKey);

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

  function OnlineUserMapper({ item }: { item: User }) {
    console.log(item);
    return <UserItem {...item} />;
  }

  function onLeave() {
    onDeleteGroup(roomKey);
    navigation.navigate(MainScreens.GroupsScreen);
  }

  const inviteText = useMemo(() => {
    const linkName = name.replace(/ /g, '-');
    return `hugin://${linkName}/${roomKey}`;
  }, [name, roomKey]);

  console.log({ roomUsers });

  return (
    <ScreenLayout>
      <View style={styles.scrollViewContainer}>
        <View style={styles.flatListContainer}>
          <FlatList
            nestedScrollEnabled={true}
            numColumns={2}
            data={online}
            renderItem={OnlineUserMapper}
            keyExtractor={(item, i) => `${item.name}-${i}`}
          />
        </View>
        <TouchableWithoutFeedback>
          <Card>
            <TextField size="xsmall">{inviteText}</TextField>
          </Card>
        </TouchableWithoutFeedback>

        <CopyButton text={t('copyInvite')} data={inviteText} />

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
            {t('leaveGroup')}
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
