import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { TextField } from './_elements';
import type { Transaction } from 'kryptokrona-wallet-backend-js';
import { nameMaxLength } from '@/config';
import { prettyPrintAmount } from 'kryptokrona-wallet-backend-js';
import { prettyPrintDate } from '@/utils';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  item: Transaction;
}

export const TransactionItem: React.FC<Props> = ({ item }) => {
  const { t } = useTranslation();
  const [pressed, setPressed] = useState(false);

  function onPress() {
    setPressed(!pressed);
  }

  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={styles.content}>
        <TextField size="xsmall" maxLength={nameMaxLength}>
          {item.timestamp == 0
            ? t('unconfirmed')
            : prettyPrintDate(item.timestamp * 1000)}
        </TextField>
        <TextField size="xsmall" maxLength={nameMaxLength}>
          {prettyPrintAmount(item.totalAmount())}
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
