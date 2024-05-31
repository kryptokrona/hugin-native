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
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    elevation: 5,
    marginVertical: 2,
    padding: 10,
  },
});
