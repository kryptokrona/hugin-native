import { FlatList, StyleSheet, TouchableOpacity } from 'react-native';

import { useNavigation, type RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { ScreenLayout, TextField } from '@/components';
import { MainScreens } from '@/config';
import { updateLanguage, useThemeStore } from '@/services';
import type { MainNavigationParamList } from '@/types';

import { languages } from '../i18n';
import { flags } from '../assets/flags';

interface Props {
  route: RouteProp<
    MainNavigationParamList,
    typeof MainScreens.ChangeLanguageScreen
  >;
}

export const ChangeLanguageScreen: React.FC<Props> = () => {
  const { i18n } = useTranslation();
  const navigation = useNavigation();
  const theme = useThemeStore((state) => state.theme);
  const borderColor = theme.muted;
  const currentLanguage = i18n.language;
  const sortedLanguages = [...languages].sort((a, b) => {
    if (a.code === currentLanguage) {
      return -1;
    }
    if (b.code === currentLanguage) {
      return 1;
    }
    return 0;
  });

  const itemMapper = (item: { name: string; code: string }) => {
    async function onPress() {
      await i18n.changeLanguage(item.code);
      await updateLanguage(item.code);
      navigation.goBack();
    }
    const active = currentLanguage === item.code;
    console.log('item:', item)
    const flag = flags?.find(a => a.code == item.code)
    console.log('flag:', flag)
    return (
      <TouchableOpacity
        disabled={active}
        onPress={onPress}
        style={[styles.item, { borderColor }]}>
        <TextField style={styles.flag}>{flag ? flag.flag : ''} </TextField>
        <TextField style={styles.itemTitle} bold={active}>
          {item.name}
        </TextField>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenLayout>
      <FlatList
        data={sortedLanguages}
        keyExtractor={(item, i) => `${item.name}-${i}`}
        renderItem={({ item }) => itemMapper(item)}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  item: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    padding: 16,
  },
  itemTitle: {
    alignSelf: 'center',
  },
});
