import { StyleSheet, View } from 'react-native';

import { useThemeStore } from '@/services';

export const Separator = () => {
  const theme = useThemeStore((state) => state.theme);

  return (
    <View style={[styles.separatorline, { backgroundColor: theme.card }]} />
  );
};

const styles = StyleSheet.create({
  separatorline: {
    height: 1,
  },
});
