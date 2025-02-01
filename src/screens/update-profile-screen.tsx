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
import { useMemo, useState } from 'react';

import { Peers } from 'lib/connections';
import Toast from 'react-native-toast-message';
import { pickAvatar } from '../utils/avatar';
import { update_bare_user } from 'lib/native';
import { useTranslation } from 'react-i18next';

interface Props {
  route: RouteProp<
    MainNavigationParamList,
    typeof MainScreens.UpdateProfileScreen
  >;
}

export const UpdateProfileScreen: React.FC<Props> = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<MainStackNavigationType>();
  const preferences = usePreferencesStore((state) => state.preferences);
  const { name, avatar, address } = useUserStore((state) => state.user);
  const [value, setValue] = useState<string>(name);
  const [authMethod, setAuthMethod] = useState<AuthMethods | null>(
    preferences.authMethod,
  );
  const [pincode, setPincode] = useState<string>('');
  const theme = useThemeStore((state) => state.theme);
  const backgroundColor = theme.accentForeground;
  const borderColor = theme.border;
  const pinError = useMemo(
    () => authMethod === AuthMethods.pincode && pincode.length < 6,
    [authMethod, pincode],
  );

  const onNameInput = (value: string) => {
    setValue(value);
  };

  const onSave = async () => {
    await updateUser({ name: value });
    Peers.name(address, value);
    let mPincode = null;
    update_bare_user({ address, avatar, name: value });
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
  async function onUpdateAvatar() {
    const base64 = await pickAvatar();
    if (base64) {
      await updateUser({ avatar: base64 });
    } else {
      Toast.show({
        text1: t('maxAvatarSize'),
        type: 'error',
      });
    }
  }

  function onSetAuthMethod(method: AuthMethods) {
    switch (method) {
      case AuthMethods.reckless:
        setAuthMethod(AuthMethods.reckless);
        break;

      case AuthMethods.pincode:
        setAuthMethod(AuthMethods.pincode);
        break;

      case AuthMethods.bioMetric:
        setAuthMethod(AuthMethods.bioMetric);
    }
  }

  function onEnterPin(pin: string) {
    setPincode(pin);
  }

  function pinChange(pin: string) {
    console.log('pin changed', pin);
    setPincode(pin);
  }

  return (
    <ScreenLayout>
      <View>
        <View>
          <TextField type="muted" size="small">
            {t('avatar')}
          </TextField>
          <TouchableOpacity
            onPress={onUpdateAvatar}
            style={styles.avatarContainer}>
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
        <Container>
          <TextField size="small">{t('authMethod')}</TextField>

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
          {authMethod === 'pincode' && (
            <View>
              <Pincode onFinish={onEnterPin} onPartPin={pinChange} />
            </View>
          )}
        </Container>
        <Container bottom>
          <TextButton onPress={onSave} disabled={pinError}>
            {t('save')}
          </TextButton>
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
  // radioText: {
  //   fontSize: 16,
  // },
  radioUnselected: {
    borderColor: '#999',
    borderRadius: 10,
    borderWidth: 1,
    height: 20,
    marginRight: 10,
    width: 20,
  },
});
