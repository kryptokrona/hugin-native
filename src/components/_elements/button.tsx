import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { useGlobalStore } from '@/services';

interface Props {
  children: React.ReactNode;
  type?: 'primary' | 'secondary' | 'error';
  onPress: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export const Button: React.FC<Props> = ({
  children,
  onPress,
  type,
  icon,
  disabled,
}) => {
  const theme = useGlobalStore((state) => state.theme);
  const backgroundColor = theme.primary;
  const borderColor = type === 'secondary' ? theme.secondary : theme.primary;
  const color = type === 'error' ? theme.error : theme.primary;

  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, { backgroundColor, borderColor }]}>
      {icon}
      <Text style={{ color }}>{children}</Text>
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
    marginVertical: 4,
    minHeight: 50,
    padding: 12,
  },
});
