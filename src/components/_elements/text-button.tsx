import { StyleProp, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { useGlobalStore } from '@/services';
import { Styles } from '@/styles';

interface Props {
  children: React.ReactNode;
  type?: 'primary' | 'secondary' | 'error';
  onPress: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  style?: StyleProp<any> | undefined;
  small?: boolean;
}

export const TextButton: React.FC<Props> = ({
  children,
  onPress,
  type,
  icon,
  disabled,
  style,
  small,
}) => {
  const theme = useGlobalStore((state) => state.theme);
  const backgroundColor = theme.backgroundAccent;
  const borderColor = type === 'secondary' ? theme.border : theme.border;
  const color = type === 'error' ? theme.error : theme.primary;
  const smallButtonStyle = small
    ? {
        borderRadius: Styles.borderRadius.small,
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
        style,
        { backgroundColor, borderColor, ...smallButtonStyle },
      ]}>
      {icon}
      <Text style={[styles.text, { color, ...smallTextStyle }]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: Styles.borderRadius.medium,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: 4,
    marginVertical: 8,
    minHeight: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  text: {
    fontFamily: 'Montserrat-Regular',
  },
});
