import { useState } from 'react';

import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { type RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import {
  Avatar,
  Card,
  Container,
  CopyButton,
  CustomIcon,
  InputField,
  ScreenLayout,
  TextButton,
  TextField,
} from '@/components';
import { useGlobalStore } from '@/services';
import { GroupsScreens, type GroupStackParamList } from '@/types';
import { createAvatar, pickAvatar } from '@/utils';

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

  return (
    <ScreenLayout>
      <View style={styles.inner}>
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
              color={theme.inverted}
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
        <Container bottom row>
          <TextButton onPress={onSave}>{t('save')}</TextButton>
        </Container>
      </View>
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
  inner: {
    // flex: 1,
  },
});
