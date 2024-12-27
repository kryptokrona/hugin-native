import React, { useCallback, useState } from 'react';
import {
  useFocusEffect,
  useNavigation,
  type RouteProp,
} from '@react-navigation/native';
import { ScrollView, RefreshControl, Text, StyleSheet, View, FlatList } from 'react-native';

import { ScreenLayout, CopyButton, TextButton, Separator, TransactionItem } from '@/components';
// import { Transaction } from '@/types';
import { t } from 'i18next';
import { getBalance, getAddress, useGlobalStore, useThemeStore } from '@/services';
import type { MainStackNavigationType, MainNavigationParamList } from '@/types';
import { MainScreens } from '@/config';
import { Transaction } from 'kryptokrona-wallet-backend-js';

export const DashboardScreen: React.FC = () => {
  // const [refreshing, setRefreshing] = useState(false);

  const navigation = useNavigation<MainStackNavigationType>();

    // Subscribe to balance and address from the store
    const balance = useGlobalStore((state) => state.balance);
    const address = useGlobalStore((state) => state.address);
    const transactions = useGlobalStore((state) => state.transactions);

      const theme = useThemeStore((state) => state.theme);
    
      const color = theme.foreground;
    
      const borderColor = theme.mutedForeground;

  const transactionsCB = ({ item }: { item: Transaction }) => {
    return <TransactionItem item={item} />;
  };

function onSendButton(e) {
  navigation.push(MainScreens.SendTransactionScreen);
}

  return (
    <ScreenLayout>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <Text style={[styles.balance, {color}]}>{(balance.unlocked + balance.locked) / 100000} XKR</Text>

        {/* <TransactionChart transactions={transactions} /> */}
        
        <View style={styles.separator}>
          <Text style={{color, textAlign: 'center'}}>{address.substring(0,4) + "..." + address.substring(94,99)}</Text>
          <CopyButton
            onPress={() => ''}
            text={'Copy address'}
            data={address}
          />
          <TextButton onPress={onSendButton}>Send transaction</TextButton>
        </View>
        <View>
          {transactions.length > 0 ? (
            <FlatList
              nestedScrollEnabled={true}
              numColumns={1}
              data={transactions}
              renderItem={transactionsCB}
              keyExtractor={(item, i) => `${item.hash}-${i}`}
            />
          ) : (
            <Text style={styles.noTransactions}>{t('noTransactions')}</Text>
          )}
        </View>

      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
 balance: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'monospace'
  },
  separator: {
    width: '100vw',
    padding: 5,
    marginTop: 15,
    text: {
      color: 'white',
      textAlign: 'center',
    }
  }
});