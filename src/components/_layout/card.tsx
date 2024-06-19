import { StyleProp, StyleSheet, View } from 'react-native';

import { useGlobalStore } from '@/services';
import { Styles } from '@/styles';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<any> | undefined;
}

export const Card: React.FC<Props> = ({ children, style }) => {
  const theme = useGlobalStore((state) => state.theme);
  const backgroundColor = theme.background;
  const borderColor = theme.border;

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
