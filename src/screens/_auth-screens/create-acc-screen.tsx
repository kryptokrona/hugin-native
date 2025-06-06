import { useEffect, useState } from 'react';

import { StyleSheet, View, ActivityIndicator } from 'react-native';

import { RouteProp, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import {
  Avatar,
  Card,
  Container,
  CustomIcon,
  InputField,
  Pincode,
  ScreenLayout,
  TextButton,
  TextField,
  TouchableOpacity
} from '@/components';
import { AuthScreens, MainScreens, Stacks, nameMaxLength } from '@/config';
import {
  updateUser,
  useGlobalStore,
  usePreferencesStore,
  useThemeStore,
  useUserStore,
} from '@/services';
import {
  AuthMethods,
  AuthStackNavigationType,
  AuthStackParamList,
} from '@/types';

import { initDB } from '../../services/bare/sqlite';
import { Wallet } from '../../services/kryptokrona/wallet';
import { pickAvatar } from '../../utils/avatar';
import { randomNode } from '../../utils/utils';

interface Props {
  route: RouteProp<AuthStackParamList, typeof AuthScreens.CreateAccountScreen>;
}
export const CreateAccScreen: React.FC<Props> = ({ route }) => {
  const { t } = useTranslation();
  const navigation = useNavigation<AuthStackNavigationType>();
  const mainNavigation = useNavigation<any>();
  const theme = useThemeStore((state) => state.theme);
  const color = theme.foreground;
  const backgroundColor = theme.accentForeground;
  const borderColor = theme.border;
  const [name, setName] = useState<string>('');
  const [avatar, setAvatar] = useState<string>('');
  const [authMethod, setAuthMethod] = useState<AuthMethods>(
    AuthMethods.reckless,
  );
  const [pincode, setPincode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [seedWords, setSeedWords] = useState<string[]>([]);
  const [blockHeight, setBlockHeight] = useState<number>(0);

  useEffect(() => {
    if (route.params?.selectedValues) {
      setSeedWords(route.params.selectedValues.seedWords);
      setBlockHeight(route.params.selectedValues.blockHeight);
    }
  }, [route.params]);

  const nameError = !name || name.length === 0;

  const pinError = authMethod === 'pincode' && pincode.length < 6;

  function onNameInput(value: string) {
    setName(value);
  }

  async function onCreateProfile() {
    setLoading(true);
    await initDB();

    const recommendedNode = await randomNode();
    console.log('recommendedNode:', recommendedNode);
    const node = { port: recommendedNode.port, url: recommendedNode.url };
    usePreferencesStore.setState((state) => ({
      ...state,
      preferences: {
        ...state.preferences,
        authMethod,
        node: `${recommendedNode.url}:${recommendedNode.port}`,
        pincode: authMethod === 'pincode' ? pincode : null,
      },
    }));
    if (seedWords?.length === 25) {
      console.log('Importing');
      await Wallet.import(blockHeight, seedWords.join(' '), node, name);
    } else {
      console.log('Creating');
      await Wallet.create(node, name);
    }

    const [address] = Wallet.addresses();

    useUserStore.setState((state) => ({
      ...state,
      user: {
        ...state.user,
        address,
        avatar,
        name,
      },
    }));

    useGlobalStore.getState().setAuthenticated(true);

    mainNavigation.navigate(Stacks.MainStack, {
      screen: MainScreens.GroupsScreen,
    });
  }

  async function onUpdateAvatar() {
    const res = await pickAvatar();
    if (res?.base64) {
      await updateUser({ avatar: res.base64 });
      setAvatar(res.base64);
    } else if (res?.error === 'maxAvatarSize') {
      Toast.show({
        text1: t('maxAvatarSize'),
        type: 'error',
      });
    }
  }

  function onEnterPin(pin: string) {
    setPincode(pin);
  }

  return (
    <ScreenLayout>
      <View>
        <TextField type="muted" size="small">
          {t('avatar')}
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
          errorText={t('inputNameRequired')}
        />
      </View>

      <Card>
        <TextField size="small">{t('authMethod')}</TextField>
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
      <View>
        <Container bottom>
          <TextButton
            icon={loading ? <ActivityIndicator size="small" color={color}  /> : <></>}
            onPress={onCreateProfile}
            disabled={loading || nameError || pinError}>
            {t('createAccount')}
          </TextButton>
        </Container>
      </View>
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

  radioUnselected: {
    borderColor: '#999',
    borderRadius: 10,
    borderWidth: 1,
    height: 20,
    marginRight: 10,
    width: 20,
  },
});
