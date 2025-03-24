import * as Progress from 'react-native-progress';

import { InputField, ScreenLayout, TextButton, TextField } from '@/components';
import React, { useState } from 'react';
import { useGlobalStore, usePreferencesStore, useThemeStore } from '@/services';

import Clipboard from '@react-native-clipboard/clipboard';
import { MainScreens } from '@/config';
import { MainStackNavigationType } from '@/types';
import { Wallet } from '../services/kryptokrona/wallet';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

interface Props {}

export const WalletStatusScreen: React.FC<Props> = () => {
  const { t } = useTranslation();
  const preferences = usePreferencesStore((state) => state.preferences);

  const navigation = useNavigation<MainStackNavigationType>();
  const theme = useThemeStore((state) => state.theme);
  const color = theme.accentForeground;
  const status = useGlobalStore((state) => state.syncStatus);
  const [resyncHeight, setResyncHeight] = useState(status[2]);

  const goToNodePicker = () => {
    navigation.push(MainScreens.PickNodeScreen);
  };

  const resyncWallet = () => {
    console.log('Clicked');
    if (Wallet?.active) {
      Wallet.active.rewind(resyncHeight);
      Wallet.getAndSetSyncStatus();
    }
  };

  const copyMnemonic = async () => {
    if (Wallet.active) {
      const mnemonic = await Wallet.active.getMnemonicSeed();

      if (mnemonic[0]) {
        Clipboard.setString(mnemonic[0]);
      }
    }
  };

  const onInputResyncHeight = (text: string) => {
    setResyncHeight(parseInt(text));
  };

  return (
    <ScreenLayout>
      <TextField type="muted" size="xsmall">
        {t('currentNode')}
      </TextField>
      <TextField>{preferences.node?.toString() || ''}</TextField>
      <TextButton onPress={goToNodePicker}>{t('changeNode')}</TextButton>
      <TextField type="muted" size="xsmall">
        {t('syncStatus')}
      </TextField>
      <Progress.Bar
        progress={status[2] == 0 ? 0 : (status[0] - 1) / status[2]}
        width={null}
        color={color}
      />
      <TextField>{`${status[0] - 1} / ${status[2]}`}</TextField>
      <InputField
        label={t('resyncHeight')}
        value={resyncHeight}
        onChange={onInputResyncHeight}
        maxLength={101}
        keyboardType="number-pad"
      />
      <TextButton onPress={resyncWallet}>{t('resyncWallet')}</TextButton>
      <TextButton onPress={copyMnemonic}>{t('backupWallet')}</TextButton>
    </ScreenLayout>
  );
};
