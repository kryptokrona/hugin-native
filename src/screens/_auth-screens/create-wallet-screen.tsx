import { useEffect, useState } from 'react';

import { View } from 'react-native';

import { type RouteProp, useNavigation } from '@react-navigation/native';
import { WalletBackend } from 'kryptokrona-wallet-backend-js';
import { useTranslation } from 'react-i18next';

import { Button, ScreenLayout, SeedComponent, TextField } from '@/components';
import { config, globals } from '@/config';
import { changeNode, saveToDatabase } from '@/services';
import {
  MainScreens,
  type AuthScreens,
  type AuthStackParamList,
} from '@/types';

interface Props {
  route: RouteProp<AuthStackParamList, typeof AuthScreens.CreateWalletScreen>;
}
export const CreateWalletScreen: React.FC<Props> = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [mSeed, setMSeed] = useState(null);

  const initializeWallet = async () => {
    const wallet = await WalletBackend.createWallet(
      globals.getDaemon(),
      config,
    );
    console.log({ wallet });
    globals.wallet = wallet;

    const [seed] = await globals.wallet.getMnemonicSeed();
    console.log({ seed });
    setMSeed(seed);
    await changeNode();
  };

  useEffect(() => {
    initializeWallet();
  }, []);

  const onPress = async () => {
    await saveToDatabase(globals.wallet);
    navigation.reset({
      index: 0,
      routes: [{ name: 'App' }],
    });
    navigation.navigate(MainScreens.MainScreen);
  };

  return (
    <ScreenLayout>
      <TextField>{t('walletCreated')}</TextField>
      <TextField type="secondary">{t('walletCreatedSubtitle')}</TextField>
      <TextField type="error">{t('walletCreatedSubtitleSubtitle')}</TextField>

      <View>
        <SeedComponent seed={mSeed} />
        <Button onPress={onPress}>{t('continue')}</Button>
      </View>
    </ScreenLayout>
  );
};
