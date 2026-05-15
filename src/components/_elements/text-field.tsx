import { StyleSheet, Text, Linking, Alert } from 'react-native';
import { Styles, textType } from '@/styles';

import type { ElementType } from '@/types';
import { useThemeStore } from '@/services';

import { t } from 'i18next';

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
  color,
  ...rest
}) => {
  const theme = useThemeStore((state) => state.theme);
  if (!color) color = theme[textType[type]];
  const fontSize = Styles.fontSizes[size] ?? Styles.fontSizes.medium;
  const fontWeight = bold ? 'bold' : 'normal';

  const truncatedText =
    maxLength && children?.length > maxLength
      ? `${children.substring(0, maxLength)}...`
      : children;

  const renderText = (text: string) => {
    if (typeof text !== 'string') return text;
    
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <Text
            key={index}
            style={{ textDecorationLine: 'underline' }}
            onPress={() => {
              Alert.alert(
                'Open Link',
                `${t('openLink')}\n\n${part}`,
                [
                  { text: t('cancel'), style: 'cancel' },
                  { text: t('open'), onPress: () => Linking.openURL(part).catch(err => console.error("Couldn't load page", err)) }
                ]
              );
            }}
          >
            {part}
          </Text>
        );
      }
      return part;
    });
  };

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
      ]}
      {...rest}
      >
      {renderText(truncatedText)}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontFamily: 'Montserrat-Medium'
  },
});
