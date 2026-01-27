import { useEffect, useLayoutEffect, useState } from 'react';
import { FlatList, View, StyleSheet, Platform, Text, Alert } from 'react-native';
import { CommonActions, useNavigation, type RouteProp } from '@react-navigation/native';
import {
  ScreenLayout,
  SettingsItem,
  ModalCenter,
  InputField,
  TextField,
  TextButton,
  Avatar,
  CustomIcon,
  Header,
} from '@/components';
import { AuthScreens, MainScreens, Stacks } from '@/config';
import {
  type CustomIconProps,
  type MainStackNavigationType,
  type MainNavigationParamList,
  type AuthStackNavigationType,
  AuthMethods,
} from '@/types';
import { Wallet } from '../services/kryptokrona';
import { Linking } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';
import { t } from 'i18next';
import { Nodes, Rooms } from 'lib/native';
import { defaultPreferences, defaultRoom, defaultUser, resetGlobalStore, useAppStoreState, useGlobalStore, usePreferencesStore, useRoomStore, useThemeStore, useUserStore } from '@/services';
import DeviceInfo from 'react-native-device-info';
import { resetDB } from '@/services/bare/sqlite';
import { defaultTheme, Styles } from '@/styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TouchableOpacity } from '@/components';
import { waitForCondition } from '@/utils';
import { navigationRef } from '@/contexts';



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
  const authnavigation = useNavigation<AuthStackNavigationType>();
  const authMethod = usePreferencesStore(
    (state) => state.preferences.authMethod,
  );
  const { name, address, avatar } = useUserStore((state) => state.user);
  const [syncActivated, setSyncActivated] = useState(true);
  const [publicKey, setPublicKey] = useState('');
  const theme = useThemeStore((state) => state.theme);
  const color = theme.foreground;
  const [modalVisible, setModalVisible] = useState(false);
  const registerAddress =
    'SEKReVsk6By22AuCcRnQGkSjY6r4AxuXxSV9ygAXwnWxGAhSPinP7AsYUdqPNKmsPg2M73FiA19JT3oy31WDZq1jBkfy3kxEMNM';
  let readableVersion = DeviceInfo.getReadableVersion();


  useEffect(() => {
    if (!Wallet?.messageKeys) return;
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

  const deleteAccount = () => {

  Alert.alert(t('deleteAccount'), t('deleteAccountSubtitle'), [
  {text: t('deleteAccount'), onPress: continueDeleteAccount, style: 'destructive'},
  {text: t('cancel'), onPress: () => {}},
]);

};

const doCopyMnemonic = () => {

  console.log('Preparing to copy mnemonic');

  const finishFunction = async () => {
    Wallet.copyMnemonic();
  };

  useGlobalStore.getState().setAuthTarget({
    stack: Stacks.MainStack,
    parent: MainScreens.SettingsStack,
    screen: MainScreens.SettingsScreen,
  });
  useGlobalStore.getState().setAuthFinishFunction(finishFunction);
  useGlobalStore.getState().setAuthenticated(false);

};



  const continueDeleteAccount = () => {

  const doDeleteAccount = async () => {

    resetDB();
    try {

    await AsyncStorage.clear();


    useUserStore.setState({ user: defaultUser });
    usePreferencesStore.setState({ preferences: defaultPreferences, skipBgRefreshWarning: false });
    useThemeStore.setState({ theme: defaultTheme, showFooterMask: false });
    useRoomStore.setState({ thisRoom: defaultRoom });


    useAppStoreState.getState().resetHydration();
    resetGlobalStore();

  } catch (e) {
    console.error('Error resetting app state', e);
  }
    console.log('Account deleted');
    Rooms.close();
    Wallet.reset();

    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: Stacks.MainStack, state: {
          routes: [{ name: MainScreens.GroupsScreen }]
        }}],
      })
    );

    authnavigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: Stacks.AuthStack, state: {
          routes: [{ name: AuthScreens.WelcomeScreen }]
        }}],
      })
    );

  };

    let screen;

    if (authMethod === AuthMethods.pincode) {
      screen = AuthScreens.RequestPinScreen;
    }
    if (authMethod === AuthMethods.bioMetric) {
      screen = AuthScreens.RequestFingerPrintScreen;
    }
    if (authMethod === AuthMethods.reckless) {
      doDeleteAccount();
      return;
    }

    useGlobalStore.setState({ authenticated: false });

    waitForCondition(() => useGlobalStore.getState().authenticated === true).then(doDeleteAccount);


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

    useLayoutEffect(() => {
      navigation.setOptions({
        header: () => (
          <Header
            noLeft={true}
            title={t('settingsTitle')}
          />
        ),
      });
    }, []);

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
    {
      function: () => doCopyMnemonic(),
      icon: { name: 'backup-restore', type: 'MCI' },
      title: 'copyMnemonic',
    },
        {
      function: deleteAccount,
      icon: { name: 'delete', type: 'MCI' },
      title: 'deleteAccount',
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

  const updateProfile = () => {
    navigation.navigate(MainScreens.UpdateProfileScreen);
  }

  return (
    <ScreenLayout>

      <TouchableOpacity onPress={updateProfile} style={[styles.profile, {borderColor: theme.border}]}>
        <View style={{margin: 5}}>
        {address && avatar?.length === 0 && (
          <Avatar address={address} size={50} />
        )}

        {avatar?.length > 15 && (
          <Avatar key={avatar} base64={avatar} size={50} />
        )}
        </View>
        <View>
        <TextField bold>{name}</TextField>
        <TextField size={"xsmall"}>
          {t('updateProfile')}
        </TextField>
        </View>
        <View style={{position: 'absolute', right: 10}}>
        <CustomIcon name={'arrow-forward-ios'} type={'MI'} size={10} />
        </View>
      </TouchableOpacity>

      <FlatList
        contentContainerStyle={[styles.settingsGroup, {borderColor: theme.border}]}
        data={items}
        keyExtractor={(item, i) => `${item.title}-${i}`}
        renderItem={({ item }) => itemMapper(item)}
        ItemSeparatorComponent={<View style={{width: '100%', borderColor: theme.border, borderBottomWidth: 1}}></View>}
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
      <View style={{alignItems: 'center', flexDirection: 'column'}}>
      <TextField size={"xsmall"}>Hugin Messenger v.{readableVersion}</TextField>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Styles.borderRadius.large,
    borderWidth: 0
  },
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
  settingsGroup: {
    borderRadius: Styles.borderRadius.large,
    borderWidth: 1
  }
});
