import { StyleProp, StyleSheet, View } from 'react-native';

import { useThemeStore } from '@/services';

import { TextField } from './text-field';
import { CustomIcon } from './custom-icon';

interface Props {
  style?: StyleProp<any> | undefined;
}

export const CallIndicator: React.FC<Props> = ({ style }) => {
  const theme = useThemeStore((state) => state.theme);



  return (
    <View
      style={[
        styles.counter,
        { backgroundColor: theme.accent },
        style && style,
      ]}>
        <CustomIcon size={13} type="MCI" name={'phone'} />
    </View>
  );
};

const styles = StyleSheet.create({
  counter: {
    borderRadius: 50,
    bottom: -2,
    elevation: 10,
    justifyContent: 'center',
    minHeight: 20,
    minWidth: 20,
    padding: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    position: 'absolute',
    right: 0,
    zIndex: 10,
  },
});
