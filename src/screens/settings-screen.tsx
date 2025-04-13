import { useState } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
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

interface Item {
  title: string;
  icon: CustomIconProps;
  screen?: MainScreens;
  function?: () => Promise<void> | void;
}

interface Props {
  route: RouteProp<
    MainNavigationParamList,
    typeof MainScreens.SettingsScreen
  >;
}

const openURL = () => {
  Linking.openURL(
    'https://github.com/kryptokrona/hugin-native/issues/new?template=bug_report.md'
  ).catch((err) => console.error('Failed to open URL:', err));
};

export const SettingsScreen: React.FC<Props> = () => {
  const navigation = useNavigation<MainStackNavigationType>();
  const authNavigation = useNavigation<any>();
  const [syncActivated, setSyncActivated] = useState(Wallet.started);
  const [modalVisible, setModalVisible] = useState(false);

  const toggleSync = async () => {
    setSyncActivated(await Wallet.toggle());
  };

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
      function: () => setModalVisible(true),
      icon: { name: 'star-circle', type: 'MCI' },
      title: 'Upgrade to Hugin +',
    },
  ];

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
        closeModal={() => setModalVisible(false)}
      >
        <View style={styles.inviteContainer}>
          <TextField size="large" weight="medium">
            Upgrade to Hugin +´
            ✅ Send offline messages to your friends!
            ✅ Support the project
          </TextField>
          <TextField size="small" style={styles.modalDescription}>
            Cost: 99 XKR.
            Paste this public key in the Payment ID field in the transaction
          </TextField>
          <TextField size="xsmall" selectable style={styles.address}>
            {Wallet.messageKeyPair()[1]}
          </TextField>
          <TextField size="small" style={styles.modalDescription}>
           Address:
          </TextField>
          <TextField size="xsmall" selectable style={styles.address}>
            SEKReVsk6By22AuCcRnQGkSjY6r4AxuXxSV9ygAXwnWxGAhSPinP7AsYUdqPNKmsPg2M73FiA19JT3oy31WDZq1jBkfy3kxEMNM
          </TextField>
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
  modalLabel: {
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  modalDescription: {
    marginVertical: 10,
    textAlign: 'center',
  },
  address: {
    fontFamily: 'monospace',
    marginBottom: 20,
  },
  divider: {
    marginVertical: 10,
  },
});
