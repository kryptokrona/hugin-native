import { StyleSheet, Text } from 'react-native';

import { useGlobalStore } from '@/services';
import { fontSizes } from '@/styles';

type TextType = 'primary' | 'secondary' | 'error';
type SizeType = 'small' | 'medium' | 'large';

interface Props {
  text: string;
  type?: TextType;
  size?: SizeType;
}

export const TextField: React.FC<Props> = ({
  text,
  type = 'primary',
  size = 'medium',
}) => {
  const { theme } = useGlobalStore();
  const color = theme?.[type];
  const fontSize = fontSizes[size] ?? fontSizes.medium;

  return <Text style={[styles.text, { color, fontSize }]}>{text}</Text>;
};

const styles = StyleSheet.create({
  text: {
    marginVertical: 2,
  },
});
