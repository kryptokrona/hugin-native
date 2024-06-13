import { StyleSheet, TouchableOpacity } from 'react-native';

import { useTranslation } from 'react-i18next';

import { useGlobalStore } from '@/services';
import { Styles } from '@/styles';
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
  const backgroundColor = theme.backgroundTertiary;
  const shadow = theme.boxShadow;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.settingsItem, { backgroundColor, ...shadow }]}>
      <CustomIcon name={icon.name} type={icon.type} size={24} />
      <TextField style={{ color: theme.primary, marginLeft: 24 }}>
        {t(title)}
      </TextField>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  settingsItem: {
    alignItems: 'center',
    borderRadius: Styles.borderRadius.small,
    flexDirection: 'row',
    marginVertical: 6,
    padding: 16,
  },
});
