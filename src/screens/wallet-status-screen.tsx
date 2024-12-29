import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { InputField, ScreenLayout, TextButton } from '@/components';
import Clipboard from '@react-native-clipboard/clipboard';
import { Styles, backgroundType, textType } from '@/styles';

import {prettyPrintAmount} from 'kryptokrona-wallet-backend-js';
import * as Progress from 'react-native-progress';


import {
    useNavigation,
  } from '@react-navigation/native';

import { useGlobalStore, usePreferencesStore, useThemeStore, Wallet } from '@/services';
import Toast from 'react-native-toast-message';
import { MainStackNavigationType, Preferences } from '@/types';
import { MainScreens } from '@/config';

interface Props {}

export const WalletStatusScreen: React.FC<Props> = () => {

  
  const preferences = usePreferencesStore((state) => state.preferences);
  const [selectedNode, setSelectedNode] = useState<Preferences | null>(preferences.node);

  const navigation = useNavigation<MainStackNavigationType>();

  const theme = useThemeStore((state) => state.theme);

  const borderColor = theme.foreground;

  const color = theme.mutedForeground;

  const status = useGlobalStore((state) => state.syncStatus);
  const [resyncHeight, setResyncHeight] = useState(status[2]);

  const goToNodePicker = () => {
    navigation.navigate(MainScreens.PickNodeScreen);
  }

  const resyncWallet = () => {
    console.log('Clicked');
    Wallet.active.rewind(parseInt(resyncHeight));
  }

  const copyMnemonic = async () => {
    const mnemonic = await Wallet.active.getMnemonicSeed();
    Clipboard.setString(mnemonic[0]);
  }
  

  return (
    <ScreenLayout>
      <View style={{textAlign: 'center'}}>
        <Text style={{color}}>Current node:</Text>
        <Text style={{color}}>{selectedNode}</Text>
        <TextButton onPress={goToNodePicker}>Change node</TextButton>
        <Text style={{color}}>Sync status:</Text>
        <Progress.Bar progress={(status[0] / status[2])} width={'400'} color={color} />
        <Text style={{color}}>{status[0]} / {status[2]}</Text>
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
  wrapper: {
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    width: '100%',
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    margin: 0
  },
  button: {
    margin: 0
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  transactionBox: {
    padding: 16,
    borderRadius: 8,
    width: '100%',
    borderWidth: 1
  },
  noTransaction: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
    fontFamily: 'Montserrat-SemiBold',
  },
  detail: {
    fontSize: 14,
    color: '#00ffcc',
    marginBottom: 16,
    fontFamily: 'Montserrat-Medium',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  column: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
});