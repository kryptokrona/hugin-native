import { useEffect, useState } from 'react';

import { View } from 'react-native';

import { type RouteProp, useNavigation } from '@react-navigation/native';
import { WalletBackend } from 'kryptokrona-wallet-backend-js';
import { useTranslation } from 'react-i18next';

import { Button, ScreenLayout, SeedComponent, TextField } from '@/components';
import { config, globals } from '@/config';
import { changeNode, saveToDatabase } from '@/services';
import {
  type AuthScreens,
  type AuthStackParamList,
  MainScreens,
  type MainStackNavigationType,
} from '@/types';

interface Props {
  route: RouteProp<AuthStackParamList, typeof AuthScreens.CreateWalletScreen>;
}
export const CreateWalletScreen: React.FC<Props> = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<MainStackNavigationType>();
  const [mSeed, setMSeed] = useState(null);

  useEffect(() => {
    const initializeWallet = async () => {
      globals.wallet = await WalletBackend.createWallet(
        globals.getDaemon(),
        config,
      );
      const [seed] = await globals.wallet.getMnemonicSeed();
      await changeNode();
      setMSeed(seed);
      saveToDatabase(globals.wallet);
    };

    initializeWallet();
  }, []);

  const onPress = () => {
    navigation.navigate(MainScreens.MainScreen);
    // navigate to Home // TODO
  };

  return (
    <ScreenLayout>
      <TextField>{t('walletCreated')}</TextField>
      <TextField type="secondary">{t('walletCreatedSubtitle')}</TextField>
      <TextField type="error">{t('walletCreatedSubtitleSubtitle')}</TextField>

      <View
        style={{ alignItems: 'center', flex: 1, justifyContent: 'flex-start' }}>
        {mSeed && <SeedComponent seed={mSeed} />}

        <Button
          onPress={onPress}
          // {...this.props}
        >
          {t('continue')}
        </Button>
      </View>
    </ScreenLayout>
  );
};
