import React from 'react';

import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';

import { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { ScreenLayout, TextButton, Container, TextField } from '@/components';
import { setStoreTheme, useGlobalStore } from '@/services';
import { colorfulColors, createTheme, Styles } from '@/styles';
import {
  SettingsScreens,
  ThemeColor,
  type SettingsStackParamList,
  type ThemeMode,
} from '@/types';

interface Props {
  route: RouteProp<
    SettingsStackParamList,
    typeof SettingsScreens.ChangeThemeScreen
  >;
}
const size = 26;
export const ChangeThemeScreen: React.FC<Props> = () => {
  const { t } = useTranslation();
  const theme = useGlobalStore((state) => state.theme);
  const currentColor = theme.backgroundSecondary;
  const isDark = theme.mode === 'dark';
  const border = theme.borderAccent;

  function setDarkTheme() {
    handleThemeChange('dark', currentColor);
  }

  function setLightTheme() {
    handleThemeChange('light', currentColor);
  }

  function handleThemeChange(mode: ThemeMode, color?: string) {
    const newTheme = createTheme(mode, color);
    setStoreTheme(newTheme);
  }

  const { width } = Dimensions.get('window');
  const itemWidth = (width - size * 2) / 3;

  function ItemMapper({ item }: { item: ThemeColor }) {
    const active = item.colorCode === currentColor;
    const borderColor = active ? theme.primary : border;

    function setColorTheme() {
      handleThemeChange(theme.mode, item.colorCode);
    }

    return (
      <TouchableOpacity
        onPress={setColorTheme}
        style={[styles.colorContainer, { borderColor, width: itemWidth }]}>
        <View style={[styles.color, { backgroundColor: item.colorCode }]} />
        <TextField style={{ textTransform: 'capitalize' }}>
          {item.name}
        </TextField>
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
          data={colorfulColors}
          numColumns={3}
          keyExtractor={(item) => item.colorCode}
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
    height: size,
    marginRight: 10,
    width: size,
  },
  colorContainer: {
    alignItems: 'center',
    borderRadius: Styles.borderRadius.small,
    borderWidth: 1,
    flexDirection: 'row',
    margin: 5,
    padding: 10,
  },
});
