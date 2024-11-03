import { FlatList } from 'react-native';

import { useNavigation, type RouteProp } from '@react-navigation/native';

import { ScreenLayout, SettingsItem } from '@/components';
import { MainScreens } from '@/config';
import type {
  CustomIconProps,
  MainStackNavigationType,
  MainNavigationParamList,
} from '@/types';
import { useTranslation } from 'react-i18next';

interface Item {
  title: string;
  icon: CustomIconProps;
  screen?: MainScreens;
  function?: () => Promise<void>;
}

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
    icon: { name: 'delete', type: 'MCI' },
    // screen: MainScreens.UpdateProfileScreen,
    title: 'deleteUser',
    // function
  },
];
interface Props {
  route: RouteProp<MainNavigationParamList, typeof MainScreens.SettingsScreen>;
}
export const SettingsScreen: React.FC<Props> = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<MainStackNavigationType>();

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
    // TODO
  }

  async function onDeleteUser() {
    // TODO
  }

  return (
    <ScreenLayout>
      <FlatList
        data={items}
        keyExtractor={(item, i) => `${item.title}-${i}`}
        renderItem={({ item }) => itemMapper(item)}
      />
      <SettingsItem
        title={t('logout')}
        icon={{ name: 'exit-run', type: 'MCI' }}
        onPress={onLogoutPress}
      />
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
