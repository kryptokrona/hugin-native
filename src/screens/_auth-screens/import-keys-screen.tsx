import { useEffect, useState } from 'react';

import { StyleSheet, View } from 'react-native';

import { type RouteProp, useNavigation } from '@react-navigation/native';
import { WalletBackend } from 'kryptokrona-wallet-backend-js';
import { useTranslation } from 'react-i18next';

import {
  Button,
  InputField,
  ScreenHeader,
  ScreenLayout,
  TextField,
} from '@/components';
import { config, globals } from '@/config';
import { saveToDatabase } from '@/services';
import {
  type AuthStackParamList,
  AuthScreens,
  MainScreens,
  type MainStackNavigationType,
  AuthStackNavigationType,
} from '@/types';

interface Props {
  route: RouteProp<AuthStackParamList, typeof AuthScreens.ImportKeysScreen>;
}

export const ImportKeysScreen: React.FC<Props> = ({ route }) => {
  const { t } = useTranslation();
  const mainNavigation = useNavigation<MainStackNavigationType>();
  const authNavigation = useNavigation<AuthStackNavigationType>();
  const scanHeight = route.params?.scanHeight ?? 0;

  const [privateSpendKey, setPrivateSpendKey] = useState('');
  const [privateViewKey, setPrivateViewKey] = useState('');
  const [continueEnabled, setContinueEnabled] = useState(false);
  const [spendKeyError, setSpendKeyError] = useState('');
  const [viewKeyError, setViewKeyError] = useState('');

  const checkKey = (
    key: string,
  ): { isValid: boolean; errorMessage: string } => {
    let errorMessage = '';

    if (!key) {
      return { errorMessage, isValid: false };
    }

    const regex = /^[0-9a-fA-F]{64}$/;

    if (key.length !== 64) {
      errorMessage = 'Key is too short/long';
      return { errorMessage, isValid: false };
    }

    const isValid = regex.test(key);

    if (!isValid) {
      errorMessage = 'Key is not hex (a-f, 0-9)';
      return { errorMessage, isValid: false };
    }

    return { errorMessage: '', isValid: true };
  };

  const checkErrors = () => {
    const spendKeyValidation = checkKey(privateSpendKey);
    const viewKeyValidation = checkKey(privateViewKey);

    setContinueEnabled(spendKeyValidation.isValid && viewKeyValidation.isValid);
    setSpendKeyError(spendKeyValidation.errorMessage);
    setViewKeyError(viewKeyValidation.errorMessage);
  };
  useEffect(() => {
    checkErrors();
  }, [privateSpendKey, privateViewKey]);

  const importWallet = async () => {
    const [wallet, error] = await WalletBackend.importWalletFromKeys(
      globals.getDaemon(),
      scanHeight,
      privateViewKey,
      privateSpendKey,
      config,
    );

    if (error) {
      globals.logger.addLogMessage(
        `Failed to import wallet: ${error.toString()}`,
      );
      authNavigation.navigate(AuthScreens.ChooseAuthMethodScreen);
      return;
    }

    globals.wallet = wallet;
    await saveToDatabase(globals.wallet);
    mainNavigation.navigate(MainScreens.MainScreen);
  };

  return (
    <ScreenLayout>
      <ScreenHeader text={t('enterKeys')} />
      <TextField type="primary" size="medium">
        {t('enterKeysSubtitle')}
      </TextField>

      <View style={styles.inputContainer}>
        <InputField
          label={t('privateSpendKey')}
          value={privateSpendKey}
          onChange={(text) => setPrivateSpendKey(text.toString())}
          error={!!spendKeyError}
          errorText={spendKeyError}
          maxLength={64}
          keyboardType="default"
          // autoCapitalize="none"
        />

        <InputField
          label={t('privateViewKey')}
          value={privateViewKey}
          onChange={(text) => setPrivateViewKey(text.toString())}
          error={!!viewKeyError}
          errorText={viewKeyError}
          maxLength={64}
          keyboardType="default"
          // autoCapitalize="none"
        />
      </View>

      <Button type="primary" onPress={importWallet} disabled={!continueEnabled}>
        {t('continue')}
      </Button>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    alignItems: 'flex-start',
    flex: 1,
    justifyContent: 'flex-start',
    marginBottom: 30,
    marginLeft: 20,
    width: '90%',
  },
});
