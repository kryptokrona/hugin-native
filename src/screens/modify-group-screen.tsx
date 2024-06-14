import { useState } from 'react';

import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

import { type RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import {
  Avatar,
  Card,
  CopyButton,
  CustomIcon,
  InputField,
  ScreenLayout,
  TextButton,
  TextField,
  UserItem,
} from '@/components';
import { useGlobalStore } from '@/services';
import { GroupsScreens, User, type GroupStackParamList } from '@/types';
import { createAvatar, onlineUsers, pickAvatar } from '@/utils';

interface Props {
  route: RouteProp<GroupStackParamList, typeof GroupsScreens.ModifyGroupScreen>;
}

export const ModifyGroupScreen: React.FC<Props> = ({ route }) => {
  const { t } = useTranslation();
  const { theme } = useGlobalStore();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [name, setName] = useState<string>('Some group name'); // route.params.name
  const tempAvatar = createAvatar();

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

  return (
    <ScreenLayout>
      <FlatList
        scrollEnabled={true}
        numColumns={3}
        data={onlineUsers}
        renderItem={OnlineUserMapper}
        keyExtractor={(item) => item.name}
        contentContainerStyle={{ height: 200 }}
      />
      {/* <ScrollView> */}
      <Card>
        <TextField>
          SekrHUGINADDRESSTIHIHHIHIHIHIHihihhihihi345i34ti4girg
        </TextField>
      </Card>
      <CopyButton text={t('copyInvite')} data={'TBD'} />
      <TouchableOpacity onPress={onUploadAvatar} style={styles.avatarContainer}>
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
        maxLength={25}
        // onSubmitEditing={onSave}
      />
      <TextButton onPress={onSave}>{t('save')}</TextButton>
      {/* </ScrollView> */}
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
});
