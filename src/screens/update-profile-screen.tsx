import { useState } from 'react';

import { StyleSheet, View } from 'react-native';

import { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import {
  Avatar,
  Container,
  InputField,
  ScreenLayout,
  TextButton,
} from '@/components';
import { useGlobalStore } from '@/services';
import { SettingsScreens, SettingsStackParamList } from '@/types';

interface Props {
  route: RouteProp<
    SettingsStackParamList,
    typeof SettingsScreens.UpdateProfileScreen
  >;
}

export const UpdateProfileScreen: React.FC<Props> = () => {
  const { t } = useTranslation();
  const { name, avatar } = useGlobalStore((state) => state.user);
  const [value, setValue] = useState<string>(name);

  const onNameInput = (value: string) => {
    setValue(value);
  };

  const onSave = () => {
    // saveProfile({ name: value });
  };

  return (
    <ScreenLayout>
      <View style={styles.avatarContainer}>
        <Avatar base64={avatar} size={100} />
      </View>
      <InputField label={t('name')} value={null} onChange={onNameInput} />
      <Container row bottom>
        <TextButton onPress={onSave}>{t('save')}</TextButton>
      </Container>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  avatarContainer: {
    alignItems: 'center',
    height: 100,
    marginBottom: 20,
    width: 100,
  },
});
