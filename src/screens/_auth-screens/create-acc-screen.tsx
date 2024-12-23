import { useLayoutEffect, useState } from 'react';

import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { Wallet } from 'services/kryptokrona/wallet';

import {
  Avatar,
  Card,
  Container,
  CustomIcon,
  Header,
  InputField,
  Pincode,
  ScreenLayout,
  TextButton,
  TextField,
} from '@/components';
import { AuthScreens, MainScreens, Stacks, nameMaxLength } from '@/config';
import {
  updateUser,
  useGlobalStore,
  usePreferencesStore,
  useThemeStore,
  useUserStore,
} from '@/services';
import { AuthMethods, AuthStackNavigationType } from '@/types';

import { initDB } from '../../services/bare/sqlite';
import { pickAvatar } from '../../utils/avatar';

export const CreateAccScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<AuthStackNavigationType>();
  const mainNavigation = useNavigation<any>();

  const theme = useThemeStore((state) => state.theme);
  const backgroundColor = theme.accentForeground;
  const borderColor = theme.border;

  const [name, setName] = useState<string>('');
  const [avatar, setAvatar] = useState<string>('');

  const [authMethod, setAuthMethod] = useState<AuthMethods>(
    AuthMethods.reckless,
  );
  const [pincode, setPincode] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);

  const nameError = !name || name.length === 0;

  const pinError = authMethod === 'pincode' && pincode.length < 6;

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => <Header backButton title={t('createProfile')} />,
    });
  }, [t]);

  function onNameInput(value: string) {
    setName(value);
  }

  async function onCreateProfile() {
    setLoading(true);
    await initDB();

    //Pick node screen also
    //And create / import wallet screen
    //If import Wallet.import(height, seed, node)

    const node = { port: 11898, url: 'blocksum.org' };
    await Wallet.create(node);
    const [address] = Wallet.addresses();

    useUserStore.setState((state) => ({
      ...state,
      user: {
        ...state.user,
        address,
        name,
      },
    }));

    usePreferencesStore.setState((state) => ({
      ...state,
      preferences: {
        ...state.preferences,
        authMethod,
        pincode: authMethod === 'pincode' ? pincode : null,
      },
    }));

    useGlobalStore.getState().setAuthenticated(true);

    if (authMethod === AuthMethods.pincode) {
      navigation.navigate(AuthScreens.RequestPinScreen, {
        finishFunction: () => {
          mainNavigation.navigate(Stacks.MainStack, {
            screen: MainScreens.GroupsScreen,
          });
        },
      });
    }

    if (authMethod === AuthMethods.bioMetric) {
      navigation.navigate(AuthScreens.RequestFingerPrintScreen, {
        finishFunction: () => {
          mainNavigation.navigate(Stacks.MainStack, {
            screen: MainScreens.GroupsScreen,
          });
        },
      });
    }

    if (authMethod === AuthMethods.reckless) {
      mainNavigation.navigate(Stacks.MainStack, {
        screen: MainScreens.GroupsScreen,
      });
    }
  }

  async function onUpdateAvatar() {
    const base64 = await pickAvatar();
    if (base64) {
      await updateUser({ avatar: base64 });
      setAvatar(base64);
    }
  }

  function onEnterPin(pin: string) {
    setPincode(pin);
  }

  return (
    <ScreenLayout>
      <View>
        <TextField type="muted" size="small">
          {'Avatar'}
        </TextField>
        <TouchableOpacity
          onPress={onUpdateAvatar}
          style={styles.avatarContainer}>
          <View style={styles.avatarButton}>
            <CustomIcon
              type="MI"
              name="mode-edit"
              size={20}
              color={theme.primary}
            />
          </View>
        </TouchableOpacity>

        {avatar.length > 0 && <Avatar base64={avatar} size={70} />}
        <InputField
          label={t('nickname')}
          value={name}
          onChange={onNameInput}
          maxLength={nameMaxLength}
          error={nameError}
          errorText="Name is required"
        />
      </View>

      <Card>
        {/* // TODO translation */}

        <TextField size="small">{'Auth method'}</TextField>
        <View style={styles.radioGroup}>
          <TouchableOpacity
            style={styles.radioButton}
            onPress={() => setAuthMethod(AuthMethods.reckless)}>
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
            onPress={() => {
              setAuthMethod(AuthMethods.pincode);
              setPincode('');
            }}>
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
            onPress={() => setAuthMethod(AuthMethods.bioMetric)}>
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
            <Pincode onFinish={onEnterPin} onPartPin={() => ''} />
          </View>
        )}
      </Card>

      <Container bottom>
        <TextButton
          onPress={onCreateProfile}
          disabled={loading || nameError || pinError}>
          {t('createProfile')}
        </TextButton>
      </Container>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  avatarButton: {
    bottom: 0,
    left: 10,
    padding: 10,
    position: 'relative',
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
