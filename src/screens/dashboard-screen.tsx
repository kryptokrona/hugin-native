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
import { getBalance, getAddress, useGlobalStore } from '@/services';
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

    

  // useEffect(() => {
  //   updateBalance();
  //   init();

  //   const unsubscribeNetInfo = NetInfo.addEventListener(handleNetInfoChange);
  //   AppState.addEventListener('change', handleAppStateChange);
  //   Linking.addEventListener('url', handleURI);
  //   initBackgroundSync();

  //   globals.navigation = navigation;

  //   const updateHandlers = [
  //     globals.wallet.on('transaction', updateBalance),
  //     globals.wallet.on('createdtx', updateBalance),
  //     globals.wallet.on('createdfusiontx', updateBalance),
  //     globals.wallet.on('sync', updateBalance),
  //   ];

  //   globals.updateBoardsFunctions.push(updateBalance);
  //   globals.updatePayeeFunctions.push(updateBalance);
  //   globals.updateGroupsFunctions.push(updateBalance);

  //   return () => {
  //     unsubscribeNetInfo();
  //     AppState.removeEventListener('change', handleAppStateChange);
  //     Linking.removeEventListener('url', handleURI);
  //     updateHandlers.forEach((unsubscribe) => unsubscribe());
  //   };
  // }, [navigation, updateBalance]);

  // const handleNetInfoChange = useCallback(({ type }: any) => {
  //   if (globals.preferences.limitData && type === 'cellular') {
  //     globals.logger.addLogMessage(
  //       'Network connection changed to cellular, and we are limiting data. Stopping sync.',
  //     );
  //     globals.wallet.stop();
  //   } else {
  //     globals.logger.addLogMessage(
  //       'Network connection changed. Restarting sync process if needed.',
  //     );
  //     globals.wallet.start();
  //   }
  // }, []);

  // const handleAppStateChange = useCallback(
  //   (appState: any) => {
  //     if (appState === 'active') {
  //       updateBalance();
  //       resumeSyncing();
  //     }
  //   },
  //   [updateBalance],
  // );

  // const resumeSyncing = useCallback(async () => {
  //   const netInfo = await NetInfo.fetch();
  //   if (globals.preferences.limitData && netInfo.type === 'cellular') {
  //     return;
  //   }
  //   globals.wallet.start();
  // }, []);

  // const handleURI = useCallback(
  //   (url: string) => {
  //     handleURI(url, navigation); // TODO
  //   },
  //   [navigation],
  // );

  // const refresh = useCallback(() => {
  //   setRefreshing(true);
  //   updateBalance().then(() => setRefreshing(false));
  // }, [updateBalance]);

  const transactionsCB = ({ item }: { item: Transaction }) => {
    console.log('thisnew', item.totalAmount());
  
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
        <Text style={styles.balance}>{(balance.unlocked + balance.locked) / 100000} XKR</Text>

        {/* <TransactionChart transactions={transactions} /> */}
        
        <View style={styles.separator}>
          <Text style={{color: 'white'}}>{address.substring(0,4) + "..." + address.substring(94,99)}</Text>
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
              ItemSeparatorComponent={Separator}
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
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 5,
    marginTop: 15,
    text: {
      color: 'white',
      textAlign: 'center',
    }
  }
});