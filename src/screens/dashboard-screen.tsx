import React, { useCallback, useState } from 'react';

import { ScrollView, RefreshControl, Text, StyleSheet, View, FlatList } from 'react-native';

import { ScreenLayout, CopyButton } from '@/components';
// import { Transaction } from '@/types';
import { t } from 'i18next';
import { getBalance, getAddress, useGlobalStore } from '@/services';

export const DashboardScreen: React.FC = () => {
  // const [refreshing, setRefreshing] = useState(false);

    // Subscribe to balance and address from the store
    const balance = useGlobalStore((state) => state.balance);
    const address = useGlobalStore((state) => state.address);

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

  // const transactionsCB = ({ item }: { item: Transaction }) => {

  //   return <TransactionItem {...item} />;

  // }



  const transactions = [
    {
        "hash": "aced5e9869317acd4fd54e4f711d401f068092ba4551f13e126b236e373ab0f6",
        "amount": 1000000, // adjusted
        "time": 1729452404,
        "height": 1899987,
        "confirmed": true
    },
    {
        "hash": "cee3b6685f23f6d6617a10bdfefcd0584b7e1b658fba60c0ae39f411208fbc0b",
        "amount": -500000, // adjusted
        "time": 1729452627,
        "height": 1899988,
        "confirmed": true
    },
    {
        "hash": "64e38b15e73745ba4fca99fbf832492cf363b93326c8b457bcdb089c3d6f62ad",
        "amount": 200000, // adjusted
        "time": 1729453140,
        "height": 1899999,
        "confirmed": true
    },
    {
        "hash": "6fe549fdabce1f856aa54a019d74bed6420857eb960f63870298c5bd3c09a10f",
        "amount": -700000, // adjusted
        "time": 1730663182,
        "height": 1913349,
        "confirmed": true
    },
    {
        "hash": "a7c4a4b8593c97f94ea781e855d603e891372301b07fbc7165ddf8cd5a9786fd",
        "amount": 1000000, // adjusted
        "time": 1730663938,
        "height": 1913357,
        "confirmed": true
    },
    {
        "hash": "cb6f0129932e958a6c629ca3248ea6448dac082e027e57c8fda14d8d9ce13039",
        "amount": -600000, // adjusted
        "time": 1730664196,
        "height": 1913360,
        "confirmed": true
    },
    {
        "hash": "21deb9a328b62c6f60a1a673453d86c507a1dfb069dc391829f09c259dafc3a6",
        "amount": 1200000, // adjusted
        "time": 1730665224,
        "height": 1913371,
        "confirmed": true
    },
    {
        "hash": "e811bdcce07b79fb291e6d4ca18b49f5c4a1b805410e06f6d2004a4c0d976133",
        "amount": 500000, // adjusted
        "time": 1730666736,
        "height": 1913392,
        "confirmed": true
    },
    {
        "hash": "18cb031fb7036f5ca1b72093898f0fe17358f93036814b5386b9617efce59c53",
        "amount": 1000000, // adjusted
        "time": 1730669850,
        "height": 1913416,
        "confirmed": true
    },
    {
        "hash": "e95888ac1105abd63b609890da5ca7493edfc9da0dceabc07100d73d8f19c023",
        "amount": 1500000, // adjusted
        "time": 1730669850,
        "height": 1913416,
        "confirmed": true
    },
    {
        "hash": "46bf0bd18de6c377ceac78e75ba13d84bb06a9b0b45dee6dc377203c2ef5a7d0",
        "amount": 1000000, // adjusted
        "time": 1730758217,
        "height": 1914396,
        "confirmed": true
    },
    {
        "hash": "9118a0257f70245079d0ead60ce41fb1acc88c1726ba0c994f3d670fab0e37a8",
        "amount": -1000000, // adjusted
        "time": 1730794544,
        "height": 1914800,
        "confirmed": true
    },
    {
        "hash": "3eb28089994d527972c1f52f92cbc3c9f5931cba0002b199c3ae2db8c93f3181",
        "amount": -50000, // adjusted
        "time": 1730795844,
        "height": 1914816,
        "confirmed": true
    },
    {
        "hash": "c9b3fe1bf49bb3ac813c3f303d4d5da5c39cd9fdddaf1dc528aa7ca9ccefd96a",
        "amount": 1000000, // adjusted
        "time": 1730796052,
        "height": 1914818,
        "confirmed": true
    }
];




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
        </View>
        {/* <View>
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
        </View> */}

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