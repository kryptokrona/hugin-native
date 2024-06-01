// Copyright (C) 2018, Zpalmtree
//
// Please see the included LICENSE file for more information.

import { config } from 'process';

import React, { useState, useCallback } from 'react';

import { StyleSheet, View, Text, Linking, Button } from 'react-native';

import { prettyPrintAmount } from 'kryptokrona-wallet-backend-js';
import { useTranslation } from 'react-i18next';

import { prettyPrintAmountMainScreen, useGlobalStore } from '@/services';
import { Styles } from '@/styles';

import { TextField } from './_elements';

interface Props {
  unlockedBalance: number;
  lockedBalance: number;
  address: string;
  coinValue: number;
  screenProps: any;
}

export const Balance: React.FC<Props> = ({
  unlockedBalance,
  lockedBalance,
  coinValue,
  address,
}) => {
  const [expandedBalance, setExpandedBalance] = useState(false);
  const theme = useGlobalStore((state) => state.theme);
  const { t } = useTranslation();
  const hasBalance = unlockedBalance + lockedBalance > 0 ? true : false;

  const handlePress = useCallback(async () => {
    await Linking.openURL(
      `https://kryptokrona.org/en/faucet?address=${props.address}`,
    );
  }, [address]);

  const OpenURLButton = () => {
    return false ? (
      <Button title={`⛽ ${t('topUp')}`} onPress={handlePress} />
    ) : (
      <View style={{ alignItems: 'center' }} />
    );
  };

  const compactBalance = (
    <TextField>{prettyPrintAmountMainScreen(unlockedBalance)}</TextField>
  );

  //   const lockedBalance = (
  //     <View style={styles.balanceRow}>
  //       {/* TODO  */}
  //       {/* <FontAwesome
  //         name="lock"
  //         size={16}
  //         color="white"
  //         style={styles.iconLock}
  //       />
  //       <OneLineText
  //         style={[styles.balanceAmount, { color: 'white' }]}
  //         onPress={() => setExpandedBalance(!expandedBalance)}>
  //         {prettyPrintAmount(props.lockedBalance, config).slice(0, -4)}
  //       </OneLineText> */}
  //     </View>
  //   );

  //   const unlockedBalance = (
  //     <View style={styles.balanceRow}>
  //       <FontAwesome
  //         name="unlock"
  //         size={16}
  //         color="white"
  //         style={styles.iconUnlock}
  //       />
  //       <OneLineText
  //         style={[styles.balanceAmount, { color: 'white' }]}
  //         onPress={() => setExpandedBalance(!expandedBalance)}>
  //         {prettyPrintAmount(unlockedBalance, config).slice(0, -4)}
  //       </OneLineText>
  //     </View>
  //   );

  const expandedBalanceComponent = (
    <View style={styles.expandedBalance}>
      {unlockedBalance}
      {lockedBalance}
    </View>
  );

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.balanceContainer,
          {
            backgroundColor: theme.backgroundAccent,
            borderColor: theme.border,
          },
        ]}>
        <View style={styles.balanceWrapper}>
          {expandedBalance ? expandedBalanceComponent : compactBalance}
        </View>
      </View>
      {lockedBalance > 0 && (
        <Text style={{ color: 'white' }}>
          + {prettyPrintAmount(lockedBalance, config).slice(0, -4)}
        </Text>
      )}
      <OpenURLButton />
      {hasBalance && <Text>{coinValue}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  balanceAmount: {
    fontFamily: 'MajorMonoDisplay-Regular',
    fontSize: 25,
  },
  balanceContainer: {
    alignItems: 'center',
    borderRadius: Styles.borderRadius.medium,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 20,
    minWidth: '80%',
    padding: 8,
    textAlign: 'center',
  },
  balanceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  balanceText: {
    alignItems: 'center',
    fontFamily: 'MajorMonoDisplay-Regular',
    fontSize: 24,
    fontWeight: 'bolder',
    textAlign: 'center',
  },
  balanceWrapper: {
    marginBottom: 8,
  },
  container: {
    alignItems: 'center',
  },
  expandedBalance: {
    alignItems: 'center',
    justifyContent: 'center',
    textAlignVertical: 'middle',
  },
  icon: {
    color: 'white',
    fontFamily: 'icomoon',
    fontSize: 20,
    marginRight: 30,
  },
  iconLock: {
    marginRight: 7,
    marginTop: 0,
  },
  iconUnlock: {
    marginRight: 7,
    marginTop: 3,
  },
});
