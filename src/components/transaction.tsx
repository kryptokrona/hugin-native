import { StyleSheet, View } from 'react-native';
import { TextField, TouchableOpacity, CustomIcon } from './_elements';
import type { Transaction } from 'kryptokrona-wallet-backend-js';
import { nameMaxLength } from '@/config';
import { prettyPrintAmount } from 'kryptokrona-wallet-backend-js';
import { prettyPrintDate } from '@/utils';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGlobalStore, useThemeStore } from '@/services';

interface Props {
  item: Transaction;
  fiat: boolean;
}

export const TransactionItem: React.FC<Props> = ({ item, fiat }) => {
  const { t } = useTranslation();
  const [pressed, setPressed] = useState(false);
  const fiatPrice = useGlobalStore((state) => state.fiatPrice);
  const theme = useThemeStore((state) => state.theme);

  function onPress() {
    setPressed(!pressed);
  }

  const amount = item.totalAmount();
  const isIncoming = amount > 0;
  const amountInFiat = (amount / 100000) * fiatPrice;
  const amountColor = isIncoming ? '#4caf50' : '#f44336';

  return (
    <TouchableOpacity style={[styles.row, { borderColor: theme.border }]} onPress={onPress}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <View style={[styles.iconContainer, { backgroundColor: isIncoming ? '#4caf5020' : '#f4433620' }]}>
            <CustomIcon
              name={isIncoming ? 'arrow-downward' : 'arrow-upward'}
              type="MI"
              size={16}
              color={amountColor}
            />
          </View>
          <View style={styles.textContainer}>
            <TextField size="xsmall" type="muted">
              {item.timestamp == 0
                ? t('unconfirmed')
                : prettyPrintDate(item.timestamp * 1000)}
            </TextField>
          </View>
        </View>
        <View style={styles.rightSection}>
          <TextField size="xsmall" bold color={amountColor}>
            {`${isIncoming ? '+' : '-'}${fiat
              ? `$${Math.abs(amountInFiat).toFixed(2)}`
              : prettyPrintAmount(Math.abs(amount))}`}
          </TextField>
        </View>
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
    padding: 12,
    width: '100%',
    borderBottomWidth: 1,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flexDirection: 'column',
  },
});
