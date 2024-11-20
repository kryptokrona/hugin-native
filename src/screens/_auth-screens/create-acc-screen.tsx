import { AuthMethods, AuthStackNavigationType } from '@/types';
import { AuthScreens, MainScreens, Stacks, nameMaxLength } from '@/config';
import {
  Card,
  Container,
  Header,
  InputField,
  Pincode,
  ScreenLayout,
  TextButton,
  TextField,
} from '@/components';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  createUserAddress,
  useGlobalStore,
  usePreferencesStore,
  useThemeStore,
  useUserStore,
} from '@/services';
import { useLayoutEffect, useState } from 'react';

import { initDB } from '../../services/bare/sqlite';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

export const CreateAccScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<AuthStackNavigationType>();
  const mainNavigation = useNavigation<any>();

  const theme = useThemeStore((state) => state.theme);
  const backgroundColor = theme.accentForeground;
  const borderColor = theme.border;

  const [name, setName] = useState<string>('');
  const [authMethod, setAuthMethod] = useState<AuthMethods>(
    AuthMethods.reckless,
  );
  const [pincode, setPincode] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const nameError = !name || name.length === 0;

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
    // Save selected authentication method and pincode if applicable
    await initDB();
    const address = await createUserAddress();

    useUserStore.setState((state) => ({
      ...state,
      user: {
        ...state.user,
        address,
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

    console.log({ authMethod });
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

  function onEnterPin(pin: string) {
    setPincode(pin);
  }

  return (
    <ScreenLayout>
      <View>
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
        <TextField size="small">{t('enablePin')}</TextField>
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
            onPress={() => setAuthMethod(AuthMethods.pincode)}>
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
          <View style={styles.pinContainer}>
            <Pincode onFinish={onEnterPin} />
          </View>
        )}
      </Card>

      <Container bottom>
        <TextButton onPress={onCreateProfile} disabled={loading || nameError}>
          {t('createProfile')}
        </TextButton>
      </Container>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  pinContainer: {},
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
