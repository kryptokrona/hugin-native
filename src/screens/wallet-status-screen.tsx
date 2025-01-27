import React, { useState } from 'react';

import { StyleSheet, Text, View } from 'react-native';

import Clipboard from '@react-native-clipboard/clipboard';
import { useNavigation } from '@react-navigation/native';
import * as Progress from 'react-native-progress';

import { InputField, ScreenLayout, TextButton } from '@/components';
import { MainScreens } from '@/config';
import { useGlobalStore, usePreferencesStore, useThemeStore } from '@/services';
import { MainStackNavigationType, Preferences } from '@/types';

import { Wallet } from '../services/kryptokrona/wallet';

interface Props {}

export const WalletStatusScreen: React.FC<Props> = () => {
  const preferences = usePreferencesStore((state) => state.preferences);
  const [selectedNode, setSelectedNode] = useState<Preferences | null>(
    preferences.node,
  );

  const navigation = useNavigation<MainStackNavigationType>();

  const theme = useThemeStore((state) => state.theme);

  const borderColor = theme.foreground;

  const color = theme.mutedForeground;

  const status = useGlobalStore((state) => state.syncStatus);
  const [resyncHeight, setResyncHeight] = useState(status[2]);

  const goToNodePicker = () => {
    navigation.navigate(MainScreens.PickNodeScreen);
  };

  const resyncWallet = () => {
    console.log('Clicked');
    Wallet.active.rewind(parseInt(resyncHeight));
  };

  const copyMnemonic = async () => {
    const mnemonic = await Wallet.active.getMnemonicSeed();
    Clipboard.setString(mnemonic[0]);
  };

  return (
    <ScreenLayout>
      <View style={{ textAlign: 'center' }}>
        <Text style={[styles.detail, { color }]}>Current node:</Text>
        <Text style={[styles.detail, { color }]}>{selectedNode}</Text>
        <TextButton onPress={goToNodePicker}>Change node</TextButton>
        <Text style={[styles.detail, { color }]}>Sync status:</Text>
        <Progress.Bar
          progress={status[0] / status[2]}
          width={'400'}
          color={color}
        />
        <Text style={[styles.detail, { color, textAlign: 'center' }]}>
          {status[0]} / {status[2]}
        </Text>
        <InputField
          label="Resync height"
          value={resyncHeight}
          onChange={setResyncHeight}
          maxLength={101}
        />
        <TextButton onPress={resyncWallet}>Resync wallet</TextButton>
        <TextButton onPress={copyMnemonic}>Backup seed</TextButton>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    margin: 0,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  column: {
    flex: 1,
  },
  detail: {
    color: '#00ffcc',
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    marginBottom: 16,
  },
  field: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 16,
  },
  heading: {
    color: 'white',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  input: {
    margin: 0,
  },
  noTransaction: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  transactionBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    width: '100%',
  },
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    padding: 16,
    width: '100%',
  },
});
