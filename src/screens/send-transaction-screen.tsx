import React, { useEffect, useRef, useState } from 'react';

import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import Clipboard from '@react-native-clipboard/clipboard';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { t } from 'i18next';
import { prettyPrintAmount } from 'kryptokrona-wallet-backend-js';
import Toast from 'react-native-toast-message';
import {
  Camera,
  CameraRuntimeError,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';

import {
  InputField,
  ModalCenter,
  ScreenLayout,
  TextButton,
  TextField,
} from '@/components';
import { MainScreens } from '@/config';
import { useGlobalStore, useThemeStore } from '@/services';
import { MainNavigationParamList, MainStackNavigationType } from '@/types';

import { Wallet } from '../services/kryptokrona';

interface Props {
  route: RouteProp<
    MainNavigationParamList,
    typeof MainScreens.SendTransactionScreen
  >;
}

export const SendTransactionScreen: React.FC<Props> = ({ route }) => {
  const mAddress = route.params?.address;
  const [address, setAddress] = useState(mAddress || '');
  const [paymentId, setPaymentId] = useState(undefined);
  const [amount, setAmount] = useState('');
  const [preparedTx, setPreparedTx] = useState<{
    success?: boolean;
    transactionHash?: string;
    fee?: number;
    destinations?: any;
  } | null>(null);
  const [sendAll, setSendAll] = useState(false);
  const fiatPrice = useGlobalStore((state) => state.fiatPrice);

  useEffect(() => {

    if (route?.params?.address) {
      setAddress(route?.params?.address);
    }
    if (route?.params?.paymentId){
      setPaymentId(route?.params?.paymentId);
    }
    if (route?.params?.amount) {
      setAmount((route?.params?.amount).toString());
    }

  },[route.params])

  const { hasPermission, requestPermission } = useCameraPermission();

  const navigation = useNavigation<MainStackNavigationType>();

  const theme = useThemeStore((state) => state.theme);

  const borderColor = theme.foreground;

  const color = theme.mutedForeground;

  const [qrScanner, setQrScanner] = useState(false);

  const device = useCameraDevice('back');
  const camera = useRef<Camera>(null);

  if (device == null) {
    // Alert.alert('Error!', 'Camera could not be started');
  }

  const onError = (error: CameraRuntimeError) => {
    Alert.alert('Error!', error.message);
  };

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      if (codes.length > 0) {
        if (codes[0].value) {
          setTimeout(() => gotQRCode(codes[0].value), 500);
        }
      }
      return;
    },
  });

  function gotQRCode(code) {
    setAddress(code);
    setQrScanner(false);
  }

  const onScanPress = async () => {
    if (!hasPermission) {
      await requestPermission();
    }
    setQrScanner(true);
  };

  function onCloseModal() {
    setQrScanner(false);
  }

  // Placeholder function for address paste
  const pasteAddress = async () => {
    const content = await Clipboard.getString();
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
      <ScrollView>
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
          <TextButton onPress={onScanPress}>{t('scanQR')}</TextButton>
          <InputField
            // style={styles.input}
            label={'Payment ID'}
            value={paymentId}
            onChange={setPaymentId}
            maxLength={101}
          />
        </View>

        <View>
          <InputField
            label={
              t('amount') +
              `${amount ? ' $' + (fiatPrice * amount).toFixed(2) : ''}`
            }
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
            <TextField style={[styles.heading, { borderColor }]}>
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
                <TextField style={[styles.heading, { borderColor }]}>
                  {t('totalAmount')}
                </TextField>
                <TextField>
                  {prettyPrintAmount(
                    preparedTx.destinations.userDestinations[0].amount,
                  )}
                </TextField>
              </View>
              <View style={styles.column}>
                <TextField style={[styles.heading, { borderColor }]}>
                  {t('fee')}
                </TextField>
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
      </ScrollView>
      <ModalCenter visible={qrScanner} closeModal={onCloseModal}>
        <View
          style={{
            borderRadius: 10,
            height: 300,
            margin: -30,
            overflow: 'hidden',
            width: 300,
          }}>
          <Camera
            ref={camera}
            onError={onError}
            photo={false}
            style={styles.fullScreenCamera}
            device={device}
            codeScanner={codeScanner}
            isActive={qrScanner}
          />
        </View>
      </ModalCenter>
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
  fullScreenCamera: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    flex: 1,
    zIndex: 100,
  },
});
