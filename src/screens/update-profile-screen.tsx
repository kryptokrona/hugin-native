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
import { updateAvatar, updateUser, useGlobalStore } from '@/services';
import {
  SettingsScreens,
  SettingsStackNavigationType,
  SettingsStackParamList,
} from '@/types';

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

  return (
    <ScreenLayout>
      <View style={styles.container}>
        <View style={styles.top}>
          <TouchableOpacity onPress={updateAvatar} style={styles.header}>
            <View style={styles.avatarContainer}>
              <Avatar base64={avatar} size={100} />
            </View>
            <View style={styles.avatarButton}>
              <CustomIcon
                type="MI"
                name="mode-edit"
                size={26}
                color={theme.secondary}
              />
            </View>
          </TouchableOpacity>
          <InputField label={t('name')} value={value} onChange={onNameInput} />
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
    position: 'absolute',
    right: -24,
    top: 0,
  },
  avatarContainer: {
    alignItems: 'center',
    borderRadius: 100,
    height: 100,
    marginBottom: 20,
    overflow: 'hidden',
    width: 100,
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
