import { useLayoutEffect, useState } from 'react';

import { StyleSheet, Switch, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import {
  Card,
  Header,
  InputField,
  Pincode,
  ScreenLayout,
  TextButton,
  TextField,
} from '@/components';
import { nameMaxLength } from '@/config';
import { AuthStackNavigationType } from '@/types';

import { usePreferencesStore } from '@/services/zustand';

export const CreateProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<AuthStackNavigationType>();

  const [name, setName] = useState<string>('');
  const [usePin, setUsePin] = useState<boolean>(false);
  const [pincode, setPincode] = useState<string | null>(null);
  // const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => <Header backButton title={t('createProfile')} />,
    });
  }, [t]);

  function onNameInput(value: string) {
    setName(value);
  }

  // async function onUploadAvatar() {
  //     const base64 = await pickAvatar();
  //     if (base64) {
  //         setAvatar(base64);
  //     }
  // }

  async function onCreateProfile() {
    setLoading(true);
    // const address = generateAddress();
    // store pin to preferences
    usePreferencesStore.setState((state) => ({
      ...state,
      pincode,
    }));

    // TODO create address, add to userStorage and then we can run the init function
  }

  function onUsePinPress() {
    setUsePin(!usePin);
  }

  function onEnterPin(pin: string) {
    setPincode(pin);
  }

  return (
    <ScreenLayout>
      <View>
        <TextField size="small">{t('chooseNickname')}</TextField>
        <InputField
          label={t('nickname')}
          value={name}
          onChange={onNameInput}
          maxLength={nameMaxLength}
        />
      </View>
      <Card>
        <TextField size="small">{t('usePinCode')}</TextField>
        <Switch
          value={usePin}
          onValueChange={onUsePinPress}
          style={styles.switch}
        />
        {usePin && <Pincode onFinish={onEnterPin} length={6} />}
      </Card>

      <TextButton onPress={onCreateProfile} disabled={loading}>
        {t('createProfile')}
      </TextButton>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  switch: {
    marginRight: 15,
  },
});
