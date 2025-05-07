import { useEffect, useState } from 'react';
import { FlatList, View, StyleSheet, Platform, Text } from 'react-native';
import { useNavigation, type RouteProp } from '@react-navigation/native';
import {
  ScreenLayout,
  SettingsItem,
  ModalCenter,
  InputField,
  TextField,
  TextButton,
} from '@/components';
import { MainScreens } from '@/config';
import type {
  CustomIconProps,
  MainStackNavigationType,
  MainNavigationParamList,
} from '@/types';
import { Wallet } from '../services/kryptokrona';
import { Linking } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';
import { t } from 'i18next';
import { TouchableOpacity } from 'react-native';
import { Nodes } from 'lib/native';
import { useThemeStore } from '@/services';

interface Item {
  title: string;
  icon: CustomIconProps;
  screen?: MainScreens;
  function?: () => Promise<void> | void;
}

interface Props {
  route: RouteProp<MainNavigationParamList, typeof MainScreens.SettingsScreen>;
}

const openURL = () => {
  Linking.openURL(
    'https://github.com/kryptokrona/hugin-native/issues/new?template=bug_report.md',
  ).catch((err) => console.error('Failed to open URL:', err));
};

export const SettingsScreen: React.FC<Props> = () => {
  const navigation = useNavigation<MainStackNavigationType>();
  const authNavigation = useNavigation<any>();
  const [syncActivated, setSyncActivated] = useState(Wallet.started);
  const [publicKey, setPublicKey] = useState('');
  const theme = useThemeStore((state) => state.theme);
  const color = theme.foreground;
  const [modalVisible, setModalVisible] = useState(false);
  const registerAddress =
    'SEKReVsk6By22AuCcRnQGkSjY6r4AxuXxSV9ygAXwnWxGAhSPinP7AsYUdqPNKmsPg2M73FiA19JT3oy31WDZq1jBkfy3kxEMNM';
  
  useEffect(() => {
    setPublicKey(Wallet?.messageKeys[1] || '');
  },[Wallet.messageKeys]);


    const copyToClipboard = (label, value) => {
      Clipboard.setString(value);
            Toast.show({
              text1: `${label} copied to clipboard!`,
              type: 'success',
            });
    };

  useEffect(() => {
    setSyncActivated(Wallet.started);
  },[Wallet.started]);  
  
  const toggleSync = async () => {
    await Wallet.toggle();
    setSyncActivated(!syncActivated);
  };

  const copyText = (data: string) => {
    Clipboard.setString(data);
    Toast.show({
      text1: t('copyText'),
      type: 'success',
    });
  };

  const upgradeHugin = async () => {

    // navigation.navigate(MainScreens.WalletStack, {
    //   screen: MainScreens.SendTransactionScreen,
    //   params: {
    //     address: registerAddress,
    //     paymentId: publicKey,
    //     amount: "99"
    //   }
    // });

    

    const destinations = [[registerAddress, parseInt(parseFloat(49).toFixed(5) * 100000)]];
    if (Nodes?.address?.length == 99) {
      destinations.push([Nodes.address, parseInt(parseFloat(50).toFixed(5) * 100000)]);
    }
    console.log('destinations',destinations);

    // return;


    const result = await Wallet?.active?.sendTransactionAdvanced(
      destinations,
      3,
      { fixedFee: 10000, isFixedFee: true },
      publicKey,
      undefined,
      undefined,
      true,
      false,
      undefined,
    );

    if (result?.success) {
      setModalVisible(false);
      Toast.show({
        text1: t('registrationSuccess'),
        type: 'success',
      });
    } else {
      Toast.show({
        text1: t('transactionFailed'),
        type: 'error',
      });
    }


  }

  const syncActivatedIcon = syncActivated
    ? 'checkbox-marked-outline'
    : 'checkbox-blank-outline';

  const items: Item[] = [
    {
      icon: { name: 'theme-light-dark', type: 'MCI' },
      screen: MainScreens.ChangeThemeScreen,
      title: 'changeTheme',
    },
    {
      icon: { name: 'globe', type: 'SLI' },
      screen: MainScreens.ChangeLanguageScreen,
      title: 'changeLanguage',
    },
    {
      icon: { name: 'user-circle', type: 'FA6' },
      screen: MainScreens.UpdateProfileScreen,
      title: 'updateProfile',
    },
    {
      icon: { name: 'server', type: 'FA6' },
      screen: MainScreens.PickNodeScreen,
      title: 'useCustomNode',
    },
    {
      function: toggleSync,
      icon: { name: syncActivatedIcon, type: 'MCI' },
      screen: MainScreens.PickNodeScreen,
      title: 'activateWalletSync',
    },
    {
      function: openURL,
      icon: { name: 'bug', type: 'FA5' },
      title: 'reportBug',
    },
    {
      icon: { name: 'terminal', type: 'FA6' },
      screen: MainScreens.LoggerScreen,
      title: 'debugLog',
    },
  ];

  if (Platform.OS == 'android') {
    items.push(
      {
        function: () => setModalVisible(true),
        icon: { name: 'star-circle', type: 'MCI' },
        title: 'Upgrade to Hugin +',
      }
    )
  }

  const itemMapper = (item: Item) => {
    async function onPress() {
      if (item.function) {
        await item.function();
      } else if (item.screen) {
        navigation.navigate(item.screen);
      }
    }

    return (
      <SettingsItem title={item.title} icon={item.icon} onPress={onPress} />
    );
  };

  return (
    <ScreenLayout>
      <FlatList
        data={items}
        keyExtractor={(item, i) => `${item.title}-${i}`}
        renderItem={({ item }) => itemMapper(item)}
      />

      <ModalCenter
        visible={modalVisible}
        closeModal={() => setModalVisible(false)}>
        <View style={styles.inviteContainer}>
          <TextField size="large" weight="medium">
            Upgrade to Hugin +
          </TextField>
          <TextField size="medium" weight="small">
            ✅ Send offline messages!
          </TextField>
          <TextField size="medium" weight="small">
            ✅ Support the project!
          </TextField>
          <TextField size="medium" weight="small">
            💸 One time cost of 99 XKR
          </TextField>
          <TextButton onPress={upgradeHugin}>Upgrade now</TextButton>
          <TextButton onPress={() => setModalVisible(false)}>Close</TextButton>
        </View>
      </ModalCenter>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  inviteContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 300,
    padding: 10,
    width: 300,
  },
  modalDescription: {
    marginVertical: 10,
    textAlign: 'center',
  },
  address: {
    fontFamily: 'monospace',
    marginBottom: 20,
  },
});
