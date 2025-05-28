import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { useThemeStore } from '@/services';
import { Styles, textType } from '@/styles';
import type { CustomIconProps } from '@/types';

import { CustomIcon, TextField, TouchableOpacity } from './_elements';

interface Props {
  onPress: () => void;
  icon: CustomIconProps;
  title: string;
}

export const SettingsItem: React.FC<Props> = ({ title, icon, onPress }) => {
  const { t } = useTranslation();
  const theme = useThemeStore((state) => state.theme);
  const backgroundColor = theme.primary;
  const color = theme.primary;
  // const borderColor = theme.border;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.settingsItem]}>
      <CustomIcon color={theme[textType['secondary']]} name={icon.name} type={icon.type} size={16} />
      <TextField size={"small"} style={{ marginLeft: 24 }}>{t(title)}</TextField>
      <View style={{position: 'absolute', right: 10}}>
      <CustomIcon name={'arrow-forward-ios'} type={'MI'} size={10} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  settingsItem: {
    alignItems: 'center',
    borderRadius: Styles.borderRadius.small,
    // borderWidth: 1,
    flexDirection: 'row',
    marginVertical: 6,
    padding: 8,
    paddingLeft: 16
  },
});
