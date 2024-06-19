import { useState } from 'react';

import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { RouteProp, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import {
  Avatar,
  Container,
  CustomIcon,
  InputField,
  ScreenLayout,
  TextButton,
} from '@/components';
import { nameMaxLength, SettingsScreens } from '@/config';
import { updateUser, useGlobalStore } from '@/services';
import type {
  SettingsStackNavigationType,
  SettingsStackParamList,
} from '@/types';
import { pickAvatar } from '@/utils';

interface Props {
  route: RouteProp<
    SettingsStackParamList,
    typeof SettingsScreens.UpdateProfileScreen
  >;
}

export const UpdateProfileScreen: React.FC<Props> = () => {
  const { t } = useTranslation();
  const theme = useGlobalStore((state) => state.theme);
  const navigation = useNavigation<SettingsStackNavigationType>();
  const { name, avatar } = useGlobalStore((state) => state.user);
  const [value, setValue] = useState<string>(name);

  const onNameInput = (value: string) => {
    setValue(value);
  };

  const onSave = async () => {
    await updateUser({ name: value });
    navigation.goBack();
  };

  async function onUpdateAvatar() {
    const base64 = await pickAvatar();
    if (base64) {
      await updateUser({ avatar: base64 });
    }
  }

  return (
    <ScreenLayout>
      <View style={styles.container}>
        <View style={styles.top}>
          <TouchableOpacity onPress={onUpdateAvatar} style={styles.header}>
            <Avatar base64={avatar} size={70} />
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
            value={value}
            onChange={onNameInput}
            onSubmitEditing={onSave}
            maxLength={nameMaxLength}
          />
        </View>
        <Container bottom>
          <TextButton onPress={onSave}>{t('save')}</TextButton>
        </Container>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  avatarButton: {
    position: 'absolute',
    right: -6,
    top: -6,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    position: 'relative',
  },
  top: {
    flex: 1,
  },
});
