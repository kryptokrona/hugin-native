import { StyleProp, StyleSheet, View } from 'react-native';

import { Styles } from '@/styles';
import { useThemeStore } from '@/services';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<any> | undefined;
}

export const Card: React.FC<Props> = ({ children, style }) => {
  const theme = useThemeStore((state) => state.theme);
  const backgroundColor = theme.card;
  const borderColor = theme.cardForeground;

  return (
    <View style={[styles.card, { backgroundColor, borderColor, ...style }]}>
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
