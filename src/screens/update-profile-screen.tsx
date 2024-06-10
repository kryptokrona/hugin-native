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
import { updateUser, useGlobalStore } from '@/services';
import {
  SettingsScreens,
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
            <View style={styles.avatarContainer}>
              <Avatar base64={avatar} size={70} />
            </View>
            <View style={styles.avatarButton}>
              <CustomIcon
                type="MI"
                name="mode-edit"
                size={20}
                color={theme.secondary}
              />
            </View>
          </TouchableOpacity>
          <InputField
            label={t('name')}
            value={value}
            onChange={onNameInput}
            onSubmitEditing={onSave}
          />
        </View>
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
    alignItems: 'center',
    borderRadius: 70,
    height: 70,
    margin: 20,
    overflow: 'hidden',
    width: 70,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    alignSelf: 'flex-start',
    position: 'relative',
  },
  top: {
    flex: 1,
  },
});
