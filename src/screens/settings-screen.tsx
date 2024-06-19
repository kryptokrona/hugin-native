import { FlatList } from 'react-native';

import { useNavigation, type RouteProp } from '@react-navigation/native';

import { ScreenLayout, SettingsItem } from '@/components';
import { SettingsScreens } from '@/config';
import type {
  CustomIconProps,
  SettingsStackNavigationType,
  SettingsStackParamList,
} from '@/types';

interface Item {
  title: string;
  icon: CustomIconProps;
  screen?: keyof typeof SettingsScreens;
  function?: () => Promise<void>;
}

const items: Item[] = [
  {
    icon: { name: 'theme-light-dark', type: 'MCI' },
    screen: SettingsScreens.ChangeThemeScreen,
    title: 'changeTheme',
  },
  {
    icon: { name: 'globe', type: 'SLI' },
    screen: SettingsScreens.ChangeLanguageScreen,
    title: 'changeLanguage',
  },
  {
    icon: { name: 'user-circle', type: 'FA6' },
    screen: SettingsScreens.UpdateProfileScreen,
    title: 'updateProfile',
  },
];
interface Props {
  route: RouteProp<
    SettingsStackParamList,
    typeof SettingsScreens.SettingsScreen
  >;
}
export const SettingsScreen: React.FC<Props> = () => {
  const navigation = useNavigation<SettingsStackNavigationType>();

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
