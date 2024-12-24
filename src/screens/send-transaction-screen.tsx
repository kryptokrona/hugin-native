import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { InputField, ScreenLayout, TextButton } from '@/components';
import Clipboard from '@react-native-clipboard/clipboard';
import { Styles, backgroundType, textType } from '@/styles';

import {prettyPrintAmount} from 'kryptokrona-wallet-backend-js';

import {
    useNavigation,
  } from '@react-navigation/native';

import { useThemeStore, Wallet } from '@/services';
import Toast from 'react-native-toast-message';

interface Props {}

export const SendTransactionScreen: React.FC<Props> = () => {
  // Form states
  const [address, setAddress] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [amount, setAmount] = useState('');
  const [preparedTx, setPreparedTx] = useState({});
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
  const generatePaymentId = async () => {
    Wallet.generate
    setPaymentId('GeneratedPaymentId123');
  };

  // Placeholder function for max amount
  const sendMaxAmount = () => {
    setAmount('1.2345');
    setSendAll(true);
  };

  const prepareTransaction = async () => {

    const result = await Wallet.active.sendTransactionAdvanced(
        [[address, parseInt(parseFloat(amount).toFixed(5) * 100000)]],
        3,
        {isFixedFee: true, fixedFee: 10000},
        paymentId,
        undefined,
        undefined,
        false,
        false,
        undefined
      );


      if (result.success) {
        setPreparedTx(result); } else {

            Toast.show({
                type: 'error',
                text1: 'Transaction failed',
              });

        }

  }

  const sendPreparedTx = async () => {

    const result = await Wallet.active.sendPreparedTransaction(preparedTx.transactionHash);
    
    if (result.success) {
        navigation.pop();

        Toast.show({
            type: 'success',
            text1: 'Transaction sent ✅',
          });

    } else {

        Toast.show({
            type: 'error',
            text1: 'Transaction failed',
          });
    }

  }

  return (
    <ScreenLayout>
      <View>
        {/* Form */}
        <View>
          <InputField
            style={styles.input}
            label="Address"
            value={address}
            onChange={setAddress}
            maxLength={101}
          />
          <TextButton style={styles.button} onPress={pasteAddress}>Paste</TextButton>
        </View>
        {/* <View>
          <InputField
            style={styles.input}
            placeholder="Payment ID (optional)"
            placeholderTextColor="#888"
            value={paymentId}
            onChange={setPaymentId}
          />
          <TextButton style={styles.button} onPress={generatePaymentId}>Generate</TextButton>
        </View> */}
        <View>
          <InputField
            style={[styles.input, { flex: 1 }]}
            label="Amount"
            value={amount}
            onChange={setAmount}
            keyboardType="decimal-pad"
          />
          {/* {<TextButton style={styles.button} onPress={sendMaxAmount}>Send max</TextButton>} */}
        </View>

        <TextButton onPress={prepareTransaction}>Send transaction</TextButton>

        {/* Transaction Details */}
        {preparedTx.success ? (
          <View style={[
            styles.transactionBox,
            { borderColor },
          ]}>
            <Text style={[styles.heading, {color: borderColor}]}>Receiving Address</Text>
            <Text style={[styles.detail, {color}]}>
              {preparedTx.destinations.userDestinations[0].address.slice(0, 24)}...{preparedTx.destinations.userDestinations[0].address.slice(-24)}
            </Text>

{/* {            <Text style={styles.heading}>Payment ID</Text>
            <Text style={styles.detail}>
              {preparedTx.paymentID ? preparedTx.paymentID : 'Not Applicable'}
            </Text>} */}

            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={[styles.heading, {color: borderColor}]}>Total Amount</Text>
                <Text style={[styles.detail, {color}]}>{prettyPrintAmount(preparedTx.destinations.userDestinations[0].amount)}</Text>
              </View>
              <View style={styles.column}>
                <Text style={[styles.heading, {color: borderColor}]}>Fee</Text>
                <Text style={[styles.detail, {color}]}>{prettyPrintAmount(preparedTx.fee)}</Text>
              </View>
            </View>

            <View style={styles.actions}>
            <TextButton style={styles.button} onPress={() => setPreparedTx({})}>Cancel</TextButton>
            <TextButton style={styles.button} onPress={sendPreparedTx}>Send</TextButton>
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