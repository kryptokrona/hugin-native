import { Alert, FlatList } from 'react-native';

import { useNavigation, type RouteProp } from '@react-navigation/native';

import { ScreenLayout, SettingsItem } from '@/components';
import { MainScreens, Stacks } from '@/config';
import type {
  CustomIconProps,
  MainStackNavigationType,
  MainNavigationParamList,
  AuthStackNavigationType,
} from '@/types';
import { useTranslation } from 'react-i18next';
import { useGlobalStore, Wallet } from '@/services';
import { useState } from 'react';

interface Item {
  title: string;
  icon: CustomIconProps;
  screen?: MainScreens;
  function?: () => Promise<void>;
}

interface Props {
  route: RouteProp<MainNavigationParamList, typeof MainScreens.SettingsScreen>;
}
export const SettingsScreen: React.FC<Props> = () => {
  // const { t } = useTranslation();
  const navigation = useNavigation<MainStackNavigationType>();
  const authNavigation = useNavigation<any>();
  const [syncActivated, setSyncActivated] = useState(Wallet.started);

  const toggleSync = async () => {
    setSyncActivated(await Wallet.toggle());
  }

  const syncActivatedIcon = syncActivated ? 'checkbox-marked-outline' : 'checkbox-blank-outline';

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
    icon: { name: syncActivatedIcon, type: 'MCI' },
    screen: MainScreens.PickNodeScreen,
    title: 'Activate wallet sync',
    function: toggleSync
  }

];

  const itemMapper = (item: Item) => {
    async function onPress() {
      if (item.function) {
        await item.function();
      } else if (item.screen) {
        navigation.navigate(item.screen); // TODO
      }
    }

    return (
      <SettingsItem title={item.title} icon={item.icon} onPress={onPress} />
    );
  };

  async function onLogoutPress() {
    useGlobalStore.setState({ authenticated: false });
    authNavigation.navigate(Stacks.AuthStack);
  }

  return (
    <ScreenLayout>
      <FlatList
        data={items}
        keyExtractor={(item, i) => `${item.title}-${i}`}
        renderItem={({ item }) => itemMapper(item)}
      />
      {/* <SettingsItem
        title={t('logout')}
        icon={{ name: 'exit-run', type: 'MCI' }}
        onPress={onLogoutPress}
      /> */}
    </ScreenLayout>
  );
};

// const styles = StyleSheet.create({
//   itemTitle: {
//     marginLeft: 16,
//   },
//   settingsItem: {
//     alignItems: 'center',
//     flexDirection: 'row',
//     padding: 16,
//   },
// });
