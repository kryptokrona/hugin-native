import { InputField, ScreenLayout, TextButton, TextField } from '@/components';
import { MainNavigationParamList, MainStackNavigationType } from '@/types';
import React, { useState } from 'react';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { StyleSheet, View } from 'react-native';

import Clipboard from '@react-native-clipboard/clipboard';
import { MainScreens } from '@/config';
import Toast from 'react-native-toast-message';
import { Wallet } from '../services/kryptokrona';
import { prettyPrintAmount } from 'kryptokrona-wallet-backend-js';
import { t } from 'i18next';
import { useThemeStore } from '@/services';

interface Props {
  route: RouteProp<
    MainNavigationParamList,
    typeof MainScreens.SendTransactionScreen
  >;
}

export const SendTransactionScreen: React.FC<Props> = ({ route }) => {
  const mAddress = route.params?.address;
  const [address, setAddress] = useState(mAddress || '');
  const [paymentId, setPaymentId] = useState('');
  const [amount, setAmount] = useState('');
  const [preparedTx, setPreparedTx] = useState<{
    success?: boolean;
    transactionHash?: string;
    fee?: number;
    destinations?: any;
  } | null>(null);
  const [sendAll, setSendAll] = useState(false);

  const navigation = useNavigation<MainStackNavigationType>();

  const theme = useThemeStore((state) => state.theme);

  const borderColor = theme.foreground;

  const color = theme.mutedForeground;

  // Placeholder function for address paste
  const pasteAddress = async () => {
    const content = await Clipboard.getString();
    console.log('Wallet', Wallet);
    setAddress(content);
  };

  // Placeholder function for generating payment ID
  // const generatePaymentId = async () => {
  //   Wallet.generate;
  //   setPaymentId('GeneratedPaymentId123');
  // };

  // Placeholder function for max amount
  // const sendMaxAmount = () => {
  //   setAmount('1.2345');
  //   setSendAll(true);
  // };

  const prepareTransaction = async () => {
    const result = await Wallet?.active?.sendTransactionAdvanced(
      [[address, parseInt(parseFloat(amount).toFixed(5) * 100000)]],
      3,
      { fixedFee: 10000, isFixedFee: true },
      paymentId,
      undefined,
      undefined,
      false,
      false,
      undefined,
    );

    if (result?.success) {
      setPreparedTx(result);
    } else {
      Toast.show({
        text1: t('transactionFailed'),
        type: 'error',
      });
    }
  };

  const sendPreparedTx = async () => {
    const result = await Wallet?.active?.sendPreparedTransaction(
      preparedTx.transactionHash,
    );

    if (result?.success) {
      if (mAddress) {
        console.log('Pop 2');
        navigation.pop(2);
      } else {
        navigation.pop();
      }

      Toast.show({
        text1: t('transactionSuccess'),
        type: 'success',
      });
    } else {
      Toast.show({
        text1: t('transactionFailed'),
        type: 'error',
      });
    }
  };

  return (
    <ScreenLayout>
      <View>
        <View>
          <InputField
            // style={styles.input}
            label={t('address')}
            value={address}
            onChange={setAddress}
            maxLength={101}
          />
          <TextButton style={styles.button} onPress={pasteAddress}>
            {t('paste')}
          </TextButton>
        </View>

        <View>
          <InputField
            label={t('amount')}
            value={amount}
            onChange={setAmount}
            keyboardType="number-pad"
          />
        </View>

        <TextButton onPress={prepareTransaction}>
          {t('sendTransaction')}
        </TextButton>

        {preparedTx?.success ? (
          <View style={[styles.transactionBox, { borderColor }]}>
            <TextField style={[styles.heading, { color: borderColor }]}>
              {t('receivingAddress')}
            </TextField>
            <TextField style={[styles.detail, { color }]}>
              {`${preparedTx.destinations.userDestinations[0].address.slice(
                0,
                24,
              )}...${preparedTx.destinations.userDestinations[0].address.slice(
                -24,
              )}`}
            </TextField>

            <View style={styles.row}>
              <View style={styles.column}>
                <TextField>{t('totalAmount')}</TextField>
                <TextField>
                  {prettyPrintAmount(
                    preparedTx.destinations.userDestinations[0].amount,
                  )}
                </TextField>
              </View>
              <View style={styles.column}>
                <TextField size="large">{t('fee')}</TextField>
                <TextField>{prettyPrintAmount(preparedTx?.fee || 0)}</TextField>
              </View>
            </View>

            <View style={styles.actions}>
              <TextButton
                style={styles.button}
                onPress={() => setPreparedTx({})}>
                {t('cancel')}
              </TextButton>
              <TextButton style={styles.button} onPress={sendPreparedTx}>
                {t('send')}
              </TextButton>
            </View>
          </View>
        ) : (
          <></>
        )}
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
  column: {
    flex: 1,
  },
  detail: {
    color: '#00ffcc',
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    marginBottom: 16,
  },

  heading: {
    color: 'white',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
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
});
