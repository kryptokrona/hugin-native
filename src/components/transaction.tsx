import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { TextField } from './_elements';
import type { Transaction } from 'kryptokrona-wallet-backend-js';
import { nameMaxLength } from '@/config';
import { prettyPrintAmount } from 'kryptokrona-wallet-backend-js';
import { prettyPrintDate } from '@/utils';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGlobalStore } from '@/services';

interface Props {
  item: Transaction;
  fiat: boolean;
}

export const TransactionItem: React.FC<Props> = ({ item, fiat }) => {
  const { t } = useTranslation();
  const [pressed, setPressed] = useState(false);
  const fiatPrice = useGlobalStore((state) => state.fiatPrice);

  function onPress() {
    setPressed(!pressed);
  }

  const amountInFiat = (item.totalAmount() / 100000) * fiatPrice;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={styles.content}>
        <TextField size="xsmall" maxLength={nameMaxLength}>
          {item.timestamp == 0
            ? t('unconfirmed')
            : prettyPrintDate(item.timestamp * 1000)}
        </TextField>
        <TextField size="xsmall" maxLength={nameMaxLength}>
          {fiat
            ? `${amountInFiat > 0 ? '$' + amountInFiat.toFixed(2) : ''}`
            : prettyPrintAmount(item.totalAmount())}
        </TextField>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  row: {
    padding: 5,
    width: '100%',
  },
});
