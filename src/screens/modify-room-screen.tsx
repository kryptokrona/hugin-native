import { useLayoutEffect, useMemo, useState } from 'react';

import { FlatList, ScrollView, StyleSheet, View } from 'react-native';

import { RouteProp, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import {
  Card,
  CopyButton,
  Header,
  InputField,
  ScreenLayout,
  TextButton,
  TextField,
  UserItem,
} from '@/components';
import { RoomsScreens, nameMaxLength } from '@/config';
import { onDeleteGroup, useGlobalStore } from '@/services';
import { RoomStackNavigationType, RoomStackParamList, User } from '@/types';

interface Props {
  route: RouteProp<RoomStackParamList, typeof RoomsScreens.ModifyRoomScreen>;
}

export const ModifyRoomScreen: React.FC<Props> = ({ route }) => {
  const { t } = useTranslation();
  const { name, roomKey } = route.params;
  const navigation = useNavigation<RoomStackNavigationType>();
  // const theme = useThemeStore((state) => state.theme);
  // const [avatar, setAvatar] = useState<string | null>(null);
  const [groupName, setGroupName] = useState<string>(name); // route.params.name
  // const tempAvatar = createAvatar();
  // const isAdmin = false; // TODO
  const roomUsers = useGlobalStore((state) => state.roomUsers).filter(
    (a) => a.room == roomKey,
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => <Header backButton title={name} />,
    });
  }, [name]);

  function onNameInput(value: string) {
    setGroupName(value);
  }

  // async function onUploadAvatar() {
  //   const base64 = await pickAvatar();
  //   if (base64) {
  //  TODO avatar
  //   }
  // }

  async function onSave() {
    // TODO
  }

  function OnlineUserMapper({ item }: { item: User }) {
    return <UserItem {...item} />;
  }

  function onLeave() {
    onDeleteGroup(roomKey);
    navigation.navigate(RoomsScreens.RoomScreens);
  }

  const inviteText = useMemo(() => {
    const linkName = name.replace(/ /g, '-');
    return `hugin://${linkName}/${roomKey}`;
  }, [name, roomKey]);

  return (
    <ScreenLayout>
      <ScrollView contentContainerStyle={styles.scrollViewContainer}>
        <View style={styles.flatListContainer}>
          <FlatList
            nestedScrollEnabled={true}
            numColumns={2}
            data={roomUsers}
            renderItem={OnlineUserMapper}
            keyExtractor={(item, i) => `${item.name}-${i}`}
          />
        </View>

        <Card>
          <TextField>{inviteText}</TextField>
        </Card>
        <CopyButton text={t('copyInvite')} data={inviteText} />

        {/* Avatar Upload */}
        {/* <TouchableOpacity
          onPress={onUploadAvatar}
          style={styles.avatarContainer}>
          <Avatar base64={avatar ?? undefined} address={roomKey} />
          <View style={styles.avatarButton}>
            <CustomIcon
              type="MI"
              name="mode-edit"
              size={20}
              color={theme.primaryForeground}
            />
          </View>
        </TouchableOpacity> */}

        <InputField
          label={t('name')}
          value={groupName}
          onChange={onNameInput}
          maxLength={nameMaxLength}
        />
        <TextButton onPress={onSave}>{t('save')}</TextButton>
        <TextButton onPress={onLeave} type="destructive">
          {t('leaveGroup')}
        </TextButton>
      </ScrollView>
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
    height: 200,
    marginBottom: 12,
  },
  scrollViewContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
});
