import { useState } from 'react';

import { StyleSheet, View } from 'react-native';

import { RouteProp, useNavigation } from '@react-navigation/native';
import {
  isValidMnemonic,
  isValidMnemonicWord,
  WalletBackend,
} from 'kryptokrona-wallet-backend-js';
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
  AuthStackNavigationType,
  MainScreens,
  MainStackNavigationType,
} from '@/types';

interface Props {
  route: RouteProp<AuthStackParamList, typeof AuthScreens.ImportSeedScreen>;
}

export const ImportSeedScreen: React.FC<Props> = ({ route }) => {
  const { t } = useTranslation();
  const mainNavigator = useNavigation<MainStackNavigationType>();
  const authNavigator = useNavigation<AuthStackNavigationType>();
  const scanHeight = route.params?.scanHeight || 0;

  const [seed, setSeed] = useState('');
  const [seedError, setSeedError] = useState('');
  const [seedIsGood, setSeedIsGood] = useState(false);

  const checkSeedIsValid = async () => {
    const words = seed.toLowerCase().split(' ');
    const invalidWords = [];

    let emptyCount = 0;
    for (const word of words) {
      if (word === '' || word === undefined) {
        emptyCount++;
      } else if (!isValidMnemonicWord(word)) {
        invalidWords.push(word);
      }
    }

    if (invalidWords.length !== 0) {
      setSeedError(
        `The following words are invalid: ${invalidWords.join(', ')}`,
      );
      return false;
    } else {
      setSeedError('');
    }

    if (words.length !== 25 || emptyCount !== 0) {
      return false;
    }

    const [valid, error] = await isValidMnemonic(words.join(' '), config);

    if (!valid) {
      setSeedError(error);
      return false;
    } else {
      setSeedError('');
    }

    return true;
  };

  const checkErrors = async () => {
    const valid = await checkSeedIsValid();
    setSeedIsGood(valid);
  };

  const importWallet = async () => {
    const [wallet, error] = await WalletBackend.importWalletFromSeed(
      globals.getDaemon(),
      scanHeight,
      seed.toLowerCase(),
      config,
    );

    if (error) {
      globals.logger.addLogMessage(
        `Failed to import wallet: ${error.toString()}`,
      );
      authNavigator.navigate(AuthScreens.ChooseAuthMethodScreen); // TODO is this right?
      return;
    }

    globals.wallet = wallet;
    await saveToDatabase(globals.wallet);
    mainNavigator.navigate(MainScreens.MainScreen);
  };

  return (
    <ScreenLayout>
      <ScreenHeader text={t('enterMnemonic')} />
      <TextField>{t('enterMnemonicSubtitle')}</TextField>

      <View style={styles.inputContainer}>
        <InputField
          label={t('mnemonicSeed')}
          value={seed}
          onChange={(text) => {
            setSeed(text.toString());
            checkErrors();
          }}
          error={!!seedError}
          errorText={seedError}
          // keyboardType="default"
          // autoCapitalize="none"
        />
      </View>

      <Button onPress={importWallet} disabled={!seedIsGood}>
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
