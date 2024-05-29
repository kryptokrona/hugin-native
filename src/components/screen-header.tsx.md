import { StyleSheet, Text, View } from 'react-native';

import { useGlobalStore } from '@/services';

interface Props {
  text: string;
}

export const ScreenHeader: React.FC<Props> = ({ text }) => {
  const theme = useGlobalStore((state) => state.theme);
  const color = theme.primary;

  return (
    <View style={[styles.container]}>
      <Text style={[styles.text, { color }]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    padding: 12,
  },
  text: {
    flexShrink: 1,
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 24,
  },
});
