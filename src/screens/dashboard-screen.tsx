import {
  Card,
  CopyButton,
  CustomIcon,
  Header,
  ScreenLayout,
  TextButton,
  TextField,
  TransactionItem,
} from '@/components';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useEffect, useLayoutEffect, useState } from 'react';

import { MainScreens } from '@/config';
import type { MainStackNavigationType } from '@/types';
import { Transaction } from 'kryptokrona-wallet-backend-js';
import { formatHashString } from '@/utils';
import { useGlobalStore } from '@/services';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

export const DashboardScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<MainStackNavigationType>();
  const online = true;
  const status = useGlobalStore((state) => state.syncStatus);
  const [synced, setSynced] = useState(status[0] == status[2]);

  useEffect(() => {
    console.log(status[0], status[2]);
    setSynced(status[2] - status[0] < 2);
  }, [status]);

  const goToStatusPage = () => {
    console.log('Clicked');
    navigation.push(MainScreens.WalletStatusScreen);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <Header
          title={t('wallet')}
          right={
            <TouchableOpacity
              style={{ flexDirection: 'row' }}
              onPress={goToStatusPage}>
              <View style={{ marginRight: 5, marginTop: 4 }}>
                <CustomIcon
                  name={'lens'}
                  size={14}
                  type={'MI'}
                  color={status[2] === 0 ? 'red' : synced ? 'green' : 'yellow'}
                />
              </View>
              <CustomIcon type="FA6" name="server" size={24} />
            </TouchableOpacity>
          }
        />
      ),
    });
  }, [navigation, synced]);

  // Subscribe to balance and address from the store
  const balance = useGlobalStore((state) => state.balance);
  const address = useGlobalStore((state) => state.address);
  const transactions = useGlobalStore((state) => state.transactions);

  const transactionsCB = ({ item }: { item: Transaction }) => {
    return <TransactionItem item={item} />;
  };

  function onSendButton() {
    navigation.push(MainScreens.SendTransactionScreen);
  }

  const calcBalance =
    (Number(balance.unlocked) + Number(balance.locked)) / 100000;
  const balanceText: string = `${calcBalance} XKR`;

  return (
    <ScreenLayout>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Card style={styles.balance}>
          <TextField style={{ margin: 10 }} size="large" bold>
            {balanceText}
          </TextField>
        </Card>

        <View style={[styles.container]}>
          <TextField style={{ paddingBottom: 10 }} centered>
            {formatHashString(address)}
          </TextField>
          <CopyButton
            onPress={() => ''}
            text={t('copyAddress')}
            data={address}
          />
          <TextButton onPress={onSendButton}>{t('sendTransaction')}</TextButton>
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
            <TextField type="secondary">{t('noTransactions')}</TextField>
          )}
        </View>
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  balance: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  container: {
    marginVertical: 15,
    padding: 5,
  },
});
