import { StyleSheet, View } from 'react-native';

import { useGlobalStore } from '@/services';
import { Styles } from '@/styles';

interface Props {
  children: React.ReactNode;
}

export const Card: React.FC<Props> = ({ children }) => {
  const theme = useGlobalStore((state) => state.theme);
  const backgroundColor = theme.backgroundAccent;
  const borderColor = theme.border;

  return (
    <View style={[styles.card, { backgroundColor, borderColor }]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    // alignSelf: 'flex-start',
    borderRadius: Styles.borderRadius.small,
    borderWidth: 1,
    elevation: 5,
    marginVertical: 2,
    padding: 10,
  },
});
