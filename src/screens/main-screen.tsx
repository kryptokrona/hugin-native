import React, { useCallback, useState } from 'react';

import { ScrollView, RefreshControl } from 'react-native';

import { Container, ScreenLayout, TextButton } from '@/components';
import { globals } from '@/config';
import { getCoinPriceFromAPI } from '@/services';

import { bare, swarm } from '../../lib/native.js';

const key = 'lol';
bare();
export const MainScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  // const onJoinSwarmPress = () => {
  //   joinSwarm(key);
  // };
  // const navigation = useNavigation<MainStackNavigationType>();
  const updateBalance = useCallback(async () => {
    const tmpPrice = await getCoinPriceFromAPI();
    if (tmpPrice !== undefined) {
      globals.coinPrice = tmpPrice;
    }

    // const unreads = await getUnreadMessages();
    // const [unlockedBalance, lockedBalance] = await globals.wallet.getBalance();
    // const coinValue = await coinsToFiat(
    //   unlockedBalance + lockedBalance,
    //   globals.preferences.currency,
    // );

    // setUnlockedBalance(unlockedBalance);
    // setLockedBalance(lockedBalance);
    // setCoinValue(Number(coinValue)); // Convert coinValue to a number before setting it in the state
    // setUnreads(unreads);
  }, []);

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

  const refresh = useCallback(() => {
    setRefreshing(true);
    updateBalance().then(() => setRefreshing(false));
  }, [updateBalance]);

  return (
    <ScreenLayout>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            title="Updating coin price..."
          />
        }>
        <Container bottom row>
          <TextButton
            onPress={function (): void {
              swarm(key);
            }}>
            Send
          </TextButton>
        </Container>
      </ScrollView>
    </ScreenLayout>
  );
};
