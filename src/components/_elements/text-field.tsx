import { StyleSheet, Text } from 'react-native';
import { Styles, textType } from '@/styles';

import type { ElementType } from '@/types';
import { useThemeStore } from '@/services';

type SizeType = 'xxsmall' |'xsmall' | 'small' | 'medium' | 'large';

interface Props {
  children: string;
  type?: ElementType;
  size?: SizeType;
  maxLength?: number | null;
  bold?: boolean;
  style?: any;
  centered?: boolean;
  color?: string;
  margin?: boolean;
}

export const TextField: React.FC<Props> = ({
  children,
  type = 'secondary',
  size = 'medium',
  margin = true,
  maxLength,
  bold,
  style,
  centered,
  color
}) => {
  const theme = useThemeStore((state) => state.theme);
  if (!color) color = theme[textType[type]];
  const fontSize = Styles.fontSizes[size] ?? Styles.fontSizes.medium;
  const fontWeight = bold ? 'bold' : 'normal';

  const truncatedText =
    maxLength && children?.length > maxLength
      ? `${children.substring(0, maxLength)}...`
      : children;

  return (
    <Text
      textBreakStrategy="highQuality"
      ellipsizeMode="clip"
      style={[
        styles.text,
        margin && {
          marginVertical: 2
        },
        { color, fontSize, fontWeight, ...style },
        centered && { textAlign: 'center' },
      ]}>
      {truncatedText}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontFamily: 'Montserrat-Medium',
  },
});
