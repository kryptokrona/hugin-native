import { StyleSheet, View } from 'react-native';

import { useGlobalStore } from '@/services';
import { Styles } from '@/styles';

interface Props {
  children: React.ReactNode;
}

export const Card: React.FC<Props> = ({ children }) => {
  const theme = useGlobalStore((state) => state.theme);
  const backgroundColor = theme.background;
  const borderColor = theme.borderSecondary;
  const { boxShadow } = theme;

  return (
    <View style={[styles.card, { backgroundColor, borderColor, ...boxShadow }]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Styles.borderRadius.small,
    borderWidth: 1,
    marginVertical: 2,
    padding: 10,
  },
});
