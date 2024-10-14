import React from 'react';

import {
  Dimensions,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { Container, ScreenLayout, TextButton, TextField } from '@/components';
import { SettingsScreens } from '@/config';
import { useThemeStore } from '@/services';
import { Styles, themes } from '@/styles';
import type { SettingsStackParamList, Theme, ThemeBase } from '@/types';

interface Props {
  route: RouteProp<
    SettingsStackParamList,
    typeof SettingsScreens.ChangeThemeScreen
  >;
}
const size = 26;
export const ChangeThemeScreen: React.FC<Props> = () => {
  const { t } = useTranslation();
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme.mode === 'dark';
  const { width } = Dimensions.get('window');
  const itemWidth = (width - size * 2) / 3;

  function setDarkTheme() {
    const darkTheme = themes[theme.name as keyof typeof themes].dark as Theme;
    useThemeStore.setState({ theme: darkTheme });
  }

  function setLightTheme() {
    const lightTheme = themes[theme.name as keyof typeof themes].light as Theme;
    useThemeStore.setState({ theme: lightTheme });
  }

  function ItemMapper({ item }: { item: string }) {
    const mTheme = themes[item as keyof typeof themes] as ThemeBase;
    const mainColors = {
      card: mTheme.dark.card,
      primary: mTheme.dark.primary,
    };
    const active = theme.name === item;
    const borderColor = active ? theme.primary : theme.border;

    function setColorTheme() {
      const newTheme = themes[item as keyof typeof themes] as ThemeBase;
      useThemeStore.setState({ theme: newTheme.dark });
    }

    return (
      <TouchableOpacity
        onPress={setColorTheme}
        style={[styles.colorContainer, { borderColor, width: itemWidth }]}>
        <View style={styles.colors}>
          <View
            style={[
              styles.color,
              { backgroundColor: mainColors.primary, borderColor },
            ]}
          />
          <View />
          <View
            style={[
              styles.color,
              { backgroundColor: mainColors.card, borderColor },
            ]}
          />
        </View>
        <TextField style={{ textTransform: 'capitalize' }}>{item}</TextField>
      </TouchableOpacity>
    );
  }

  return (
    <ScreenLayout>
      <View>
        <Container row>
          <TextButton
            style={{ flex: 1 }}
            type={isDark ? 'primary' : 'secondary'}
            onPress={setDarkTheme}>
            {t('themeDark')}
          </TextButton>
          <TextButton
            style={{ flex: 1 }}
            type={isDark ? 'secondary' : 'primary'}
            onPress={setLightTheme}>
            {t('themeLight')}
          </TextButton>
        </Container>
        <FlatList
          data={Object.keys(themes)}
          numColumns={3}
          keyExtractor={(_item, i) => `Theme-${i}`}
          renderItem={ItemMapper}
          contentContainerStyle={{ marginTop: 20 }}
        />
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  color: {
    borderRadius: Styles.borderRadius.small,
    borderWidth: 0.75,
    height: size,
    marginRight: 10,
    width: size,
  },
  colorContainer: {
    alignItems: 'center',
    borderRadius: Styles.borderRadius.small,
    borderWidth: 1,
    // flexDirection: 'row',
    margin: 5,
    padding: 10,
  },
  colors: {
    flexDirection: 'row',
    marginBottom: 10,
  },
});
