import { StyleSheet, TouchableOpacity } from 'react-native';

import { useTranslation } from 'react-i18next';

import { useGlobalStore } from '@/services';
import type { CustomIconProps } from '@/types';

import { CustomIcon, TextField } from './_elements';

interface Props {
  onPress: () => void;
  icon: CustomIconProps;
  title: string;
}

export const SettingsItem: React.FC<Props> = ({ title, icon, onPress }) => {
  const { t } = useTranslation();
  const theme = useGlobalStore((state) => state.theme);
  const backgroundColor = theme.backgroundAccent;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.settingsItem, { backgroundColor }]}>
      <CustomIcon name={icon.name} type={icon.type} size={24} />
      <TextField style={styles.itemTitle}>{t(title)}</TextField>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  itemTitle: {
    marginLeft: 24,
  },
  settingsItem: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: 16,
  },
});
