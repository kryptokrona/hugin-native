import { StyleSheet, View } from 'react-native';

import { useGlobalStore } from '@/services';

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
    borderRadius: 16,
    borderWidth: 1,
    elevation: 5,
    marginVertical: 10,
    padding: 10,
  },
});
