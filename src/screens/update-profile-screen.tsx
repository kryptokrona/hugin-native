import {
  Avatar,
  Container,
  CustomIcon,
  InputField,
  ScreenLayout,
  TextButton,
} from '@/components';
import type { MainNavigationParamList, MainStackNavigationType } from '@/types';
import { MainScreens, nameMaxLength } from '@/config';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { updateUser, useThemeStore, useUserStore } from '@/services';

import { pickAvatar } from '@/utils';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  route: RouteProp<
    MainNavigationParamList,
    typeof MainScreens.UpdateProfileScreen
  >;
}

export const UpdateProfileScreen: React.FC<Props> = () => {
  const { t } = useTranslation();
  const theme = useThemeStore((state) => state.theme);
  const navigation = useNavigation<MainStackNavigationType>();
  const { name, avatar, address } = useUserStore((state) => state.user);
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
            <Avatar base64={avatar} address={address} size={70} />
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
