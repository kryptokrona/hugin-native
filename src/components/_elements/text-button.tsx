import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useGlobalStore } from '@/services';
import { backgroundType, Styles, textType } from '@/styles';
import type { ElementType } from '@/types';

interface Props {
  children: React.ReactNode;
  type?: ElementType;
  onPress: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  style?: StyleProp<any> | undefined;
  small?: boolean;
}

export const TextButton: React.FC<Props> = ({
  children,
  onPress,
  type = 'primary',
  icon,
  disabled,
  style,
  small,
}) => {
  const theme = useGlobalStore((state) => state.theme);

  const backgroundColor = theme[backgroundType[type]];
  const borderColor = theme[textType[type]];
  const color = theme[textType[type]];

  const smallButtonStyle = small
    ? {
        borderRadius: Styles.borderRadius.small,
        marginVertical: 6,
        minHeight: 40,
        paddingHorizontal: 10,
        paddingVertical: 8,
      }
    : {};

  const smallTextStyle = small
    ? { fontSize: Styles.fontSizes.small }
    : { fontSize: Styles.fontSizes.medium };

  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        { backgroundColor, borderColor, ...smallButtonStyle },
        style,
      ]}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={[styles.text, { color, ...smallTextStyle }]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: Styles.borderRadius.small,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 8,
    minHeight: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'relative',
  },
  icon: {
    left: 18,
    position: 'absolute',
  },
  text: {
    fontFamily: 'Montserrat-SemiBold',
  },
});
