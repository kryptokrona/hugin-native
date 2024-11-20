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
import { useGlobalStore } from '@/services';

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

  // {
  //   icon: { name: 'trash-2', type: 'FI' },
  //   // screen: MainScreens.UpdateProfileScreen,
  //   title: 'deleteUser',
  //   function: async () => {
  //     Alert.alert(
  //       'Delete User',
  //       'Are you sure you want to delete your account?',
  //       [
  //         { text: 'Cancel', style: 'cancel' },
  //         {
  //           text: 'Delete',
  //           style: 'destructive',
  //           onPress: async () => {
  //             try {
  //               // await  // TODO delete sql stuff, delete user and preferences in stores
  //               console.log('User deleted successfully');
  //             } catch (error) {
  //               console.error('Failed to delete user:', error);
  //             }
  //           },
  //         },
  //       ],
  //     );
  //   },
  // }, // TODO delete user in the future
];

interface Props {
  route: RouteProp<MainNavigationParamList, typeof MainScreens.SettingsScreen>;
}
export const SettingsScreen: React.FC<Props> = () => {
  // const { t } = useTranslation();
  const navigation = useNavigation<MainStackNavigationType>();
  const authNavigation = useNavigation<any>();

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
