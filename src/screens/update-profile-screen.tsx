import {
  AuthMethods,
  MainNavigationParamList,
  MainStackNavigationType,
} from '@/types';
import {
  Avatar,
  Container,
  CustomIcon,
  InputField,
  Pincode,
  ScreenLayout,
  TextButton,
  TextField,
} from '@/components';
import { MainScreens, nameMaxLength } from '@/config';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  updateUser,
  usePreferencesStore,
  useThemeStore,
  useUserStore,
} from '@/services';

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
  // const theme = useThemeStore((state) => state.theme);
  const navigation = useNavigation<MainStackNavigationType>();
  const preferences = usePreferencesStore((state) => state.preferences);
  const { name, avatar, address } = useUserStore((state) => state.user);
  const [value, setValue] = useState<string>(name);
  const [authMethod, setAuthMethod] = useState<AuthMethods | null>(
    preferences.authMethod,
  );
  const [pincode, setPincode] = useState<string | null>(null);
  const [displayPincode, setDisplayPincode] = useState(false);
  const theme = useThemeStore((state) => state.theme);
  const backgroundColor = theme.accentForeground;
  const borderColor = theme.border;

  const onNameInput = (value: string) => {
    setValue(value);
  };

  const onSave = async () => {
    await updateUser({ name: value });
    let mPincode = null;

    if (authMethod === AuthMethods.pincode) {
      mPincode = pincode ? pincode : preferences.pincode;
    } else if (authMethod === AuthMethods.reckless) {
      mPincode = null;
    } else if (authMethod === AuthMethods.bioMetric) {
      mPincode = null;
    }
    usePreferencesStore.setState((state) => ({
      preferences: { ...state.preferences, authMethod, pincode: mPincode },
    }));
    navigation.goBack();
  };

  // async function onUpdateAvatar() {
  //   const base64 = await pickAvatar();
  //   if (base64) {
  //     await updateUser({ avatar: base64 });
  //   }
  // }

  function onSetAuthMethod(method: AuthMethods) {
    switch (method) {
      case AuthMethods.reckless:
        setAuthMethod(AuthMethods.reckless);
        break;

      case AuthMethods.pincode:
        setAuthMethod(AuthMethods.pincode);
        setDisplayPincode(true);
        break;

      case AuthMethods.bioMetric:
        setAuthMethod(AuthMethods.bioMetric);
    }
  }

  function onEnterPin(pin: string) {
    setPincode(pin);
  }

  return (
    <ScreenLayout>
      <View style={styles.container}>
        <View style={styles.top}>
          {/* <TouchableOpacity onPress={onUpdateAvatar} style={styles.header}>
            <Avatar base64={avatar} address={address} size={70} />
            <View style={styles.avatarButton}>
              <CustomIcon
                type="MI"
                name="mode-edit"
                size={20}
                color={theme.primary}
              />
            </View>
          </TouchableOpacity> */}
          <InputField
            label={t('name')}
            value={value}
            onChange={onNameInput}
            onSubmitEditing={onSave}
            maxLength={nameMaxLength}
          />
        </View>
        {/* // TODO translation */}
        <Container>
          <TextField size="small">{'Auth method'}</TextField>

          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={styles.radioButton}
              onPress={() => onSetAuthMethod(AuthMethods.reckless)}>
              <View
                style={
                  authMethod === AuthMethods.reckless
                    ? [styles.radioSelected, { backgroundColor }]
                    : [styles.radioUnselected, { borderColor }]
                }
              />
              <TextField type="muted" size="small">
                {t('recklessMode')}
              </TextField>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.radioButton}
              onPress={() => onSetAuthMethod(AuthMethods.pincode)}>
              <View
                style={
                  authMethod === AuthMethods.pincode
                    ? [styles.radioSelected, { backgroundColor }]
                    : [styles.radioUnselected, { borderColor }]
                }
              />
              <TextField type="muted" size="small">
                {t('usePinCode')}
              </TextField>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.radioButton}
              onPress={() => onSetAuthMethod(AuthMethods.bioMetric)}>
              <View
                style={
                  authMethod === AuthMethods.bioMetric
                    ? [styles.radioSelected, { backgroundColor }]
                    : [styles.radioUnselected, { borderColor }]
                }
              />
              <TextField type="muted" size="small">
                {t('bioMetric')}
              </TextField>
            </TouchableOpacity>
          </View>
          {displayPincode && (
            <View>
              <Pincode onFinish={onEnterPin} />
            </View>
          )}
        </Container>
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
  radioButton: {
    flexDirection: 'row',
    // alignItems: 'center',
    marginBottom: 10,
  },
  radioGroup: {
    flexDirection: 'column',
    marginVertical: 10,
  },
  radioSelected: {
    borderRadius: 10,
    height: 20,
    marginRight: 10,
    width: 20,
  },
  radioText: {
    fontSize: 16,
  },
  radioUnselected: {
    borderColor: '#999',
    borderRadius: 10,
    borderWidth: 1,
    height: 20,
    marginRight: 10,
    width: 20,
  },
});
