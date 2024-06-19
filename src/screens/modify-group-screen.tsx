import { useLayoutEffect, useState } from 'react';

import {
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { useNavigation, type RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import {
  Avatar,
  Card,
  CopyButton,
  CustomIcon,
  Header,
  InputField,
  ScreenLayout,
  TextButton,
  TextField,
  UserItem,
} from '@/components';
import { GroupsScreens, nameMaxLength } from '@/config';
import { onDeleteGroup, onLeaveGroup, useGlobalStore } from '@/services';
import type {
  GroupStackNavigationType,
  User,
  GroupStackParamList,
} from '@/types';
import { createAvatar, onlineUsers, pickAvatar } from '@/utils';

interface Props {
  route: RouteProp<GroupStackParamList, typeof GroupsScreens.ModifyGroupScreen>;
}

export const ModifyGroupScreen: React.FC<Props> = ({ route }) => {
  const { t } = useTranslation();
  const navigation = useNavigation<GroupStackNavigationType>();
  const { theme } = useGlobalStore();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [name, setName] = useState<string>('Some group name'); // route.params.name
  const tempAvatar = createAvatar();
  const isAdmin = false; // TBD

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => <Header backButton title={'{groupname} details'} />,
    });
  }, [name]);

  function onNameInput(value: string) {
    setName(value);
  }

  async function onUploadAvatar() {
    const base64 = await pickAvatar();
    if (base64) {
      // TODO
    }
  }

  async function onSave() {
    // TODO
  }

  function OnlineUserMapper({ item }: { item: User }) {
    return <UserItem {...item} />;
  }

  function onDelete() {
    onDeleteGroup('TBD topic string');
    // navigation.navigate(GroupsScreens.GroupsScreen);
  }

  function onLeave() {
    onLeaveGroup('TBD topic string');
    navigation.navigate(GroupsScreens.GroupsScreen);
  }

  return (
    <ScreenLayout>
      <ScrollView contentContainerStyle={styles.scrollViewContainer}>
        <View style={styles.flatListContainer}>
          <FlatList
            nestedScrollEnabled
            numColumns={2}
            data={onlineUsers}
            renderItem={OnlineUserMapper}
            keyExtractor={(item, i) => `${item.name}-${i}`}
          />
        </View>
        <Card>
          <TextField>
            SekrHUGINADDRESSTIHIHHIHIHIHIHihihhihihi345i34ti4girg
          </TextField>
        </Card>
        <CopyButton text={t('copyInvite')} data={'TBD'} />
        <TouchableOpacity
          onPress={onUploadAvatar}
          style={styles.avatarContainer}>
          <Avatar base64={tempAvatar} />
          <View style={styles.avatarButton}>
            <CustomIcon
              type="MI"
              name="mode-edit"
              size={20}
              color={theme.primary}
            />
          </View>
        </TouchableOpacity>
        <InputField
          label={t('name')}
          value={name}
          onChange={onNameInput}
          maxLength={nameMaxLength}
          // onSubmitEditing={onSave}
        />
        <TextButton onPress={onSave}>{t('save')}</TextButton>
        {isAdmin && (
          <TextButton onPress={onDelete} type="error">
            {t('delete')}
          </TextButton>
        )}
        {!isAdmin && (
          <TextButton onPress={onLeave} type="error">
            {t('leaveGroup')}
          </TextButton>
        )}
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  avatarButton: {
    bottom: 12,
    position: 'absolute',
    right: 10,
  },
  avatarContainer: {
    alignSelf: 'flex-start',
    position: 'relative',
  },
  flatListContainer: {
    height: 200,
    marginBottom: 12,
  },
  scrollViewContainer: {
    flexGrow: 1,
  },
});
