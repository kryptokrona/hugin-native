import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { useGlobalStore } from '@/services';

interface Props {
  children: React.ReactNode;
  type?: 'primary' | 'secondary' | 'error';
  onPress: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export const TextButton: React.FC<Props> = ({
  children,
  onPress,
  type,
  icon,
  disabled,
}) => {
  const theme = useGlobalStore((state) => state.theme);
  const backgroundColor = theme.backgroundAccent;
  const borderColor = type === 'secondary' ? theme.border : theme.border;
  const color = type === 'error' ? theme.error : theme.primary;

  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, { backgroundColor, borderColor }]}>
      {icon}
      <Text style={[{ color }, styles.text]}>{children}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 15,
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
    fontSize: 16,
  },
});
