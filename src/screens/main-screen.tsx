import React, { useCallback, useState } from 'react';

import { ScrollView, RefreshControl } from 'react-native';

import { ScreenLayout, ScreenHeader } from '@/components';
import { globals } from '@/config';
import { getCoinPriceFromAPI } from '@/services';

// import { BalanceComponent, SyncComponent } from './SharedComponents';

export const MainScreen: React.FC = () => {
  // const [addressOnly, setAddressOnly] = useState(false);
  // const [unlockedBalance, setUnlockedBalance] = useState(0);
  // const [lockedBalance, setLockedBalance] = useState(0);
  // const [address, _setAddress] = useState(globals.wallet.getPrimaryAddress());
  // const [messages, _setMessages] = useState(globals?.messages?.length);
  // const [groupMessages, _setGroupMessages] = useState(
  //   globals.groupMessages.length,
  // );
  // const [_unreads, setUnreads] = useState(globals.unreadMessages);
  // const [coinValue, setCoinValue] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            title="Updating coin price..."
          />
        }>
        <ScreenHeader text="Home" />
        {/* <TouchableOpacity onPress={() => setAddressOnly(!addressOnly)}>
          <Card>
            <Image
              style={{ height: 112, width: 112 }}
              source={{ uri: get_avatar(address, 112) }}
            />
            <Button
              onPress={() => {
              }}>
              {address}
            </Button>
            <TextField>
              {addressOnly ? 'Show Balance' : 'Hide Balance'}
            </TextField>
            <QRCode
              value={`xkr://${address}?paymentid=${Buffer.from(
                getKeyPair().publicKey,
              ).toString('hex')}`}
              size={175}
              backgroundColor={'transparent'}
            />
          </Card>
        </TouchableOpacity> */}
        {/* {!addressOnly && (
          <Button onPress={() => navigation.navigate(MainScreens.C)}>
            <BalanceComponent
              unlockedBalance={unlockedBalance}
              lockedBalance={lockedBalance}
              coinValue={coinValue}
              address={address}
            />
          </Button>
        )} */}
        {/* {!addressOnly && (
          <Card>
            <Button onPress={() => navigation.navigate('Groups')}>
              Groups {groupMessages.length}
            </Button>
            <Button
              onPress={() => navigation.navigate(MainScreens.RecipientsScreen)}>
              Messages {messages.length}
            </Button>
          </Card>
        )} */}
        {/* <SyncComponent /> */}
      </ScrollView>
    </ScreenLayout>
  );
};

// const styles = StyleSheet.create({
//   cardStyle: {
//     alignContent: 'center',
//     backgroundColor: 'backgroundEmphasis',
//     borderColor: 'borderColour',
//     borderRadius: 15,
//     borderWidth: 1,
//     flex: 1,
//     flexDirection: 'row',
//     padding: 10,
//   },
// });
