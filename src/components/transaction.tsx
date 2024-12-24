import { useState } from 'react';

import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';

import { nameMaxLength } from '@/config';

import { Avatar, TextField } from './_elements';

import { prettyPrintAmount } from 'kryptokrona-wallet-backend-js';

import type { Transaction } from 'kryptokrona-wallet-backend-js';

import { prettyPrintDate } from '@/utils';

type Props = {
    item: Transaction; // Explicitly define the shape of the props
  };

  export const TransactionItem: React.FC<Props> = ({ item }) => {

  const [pressed, setPressed] = useState(false);

  function onPress() {
    setPressed(!pressed);
  }

  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
    <View style={styles.content}>
      <TextField size="xsmall" maxLength={nameMaxLength}>
        {item.timestamp == 0 ? 'Unconfirmed' : prettyPrintDate(item.timestamp * 1000)}
      </TextField>
      <TextField size="xsmall" maxLength={nameMaxLength}>
        {prettyPrintAmount(item.totalAmount())}
      </TextField>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: { 
    width: '100%',
    padding: 5
 },
  onlineUser: {
    flexDirection: 'row',
    margin: 1,
    marginBottom: 4,
  },
  content: {
    flexDirection: 'row', // Align children in a row
    justifyContent: 'space-between', // Push hash to the left and amount to the right
    alignItems: 'center', // Vertically align the items
    width: '100%', // Ensure content spans the full width
  },
});