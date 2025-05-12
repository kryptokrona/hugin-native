import { StyleProp, StyleSheet, View } from 'react-native';

import { useThemeStore } from '@/services';

import { TextField } from './text-field';

interface Props {
  online: number;
  style?: StyleProp<any> | undefined;
}

export const OnlineUsers: React.FC<Props> = ({ online, style }) => {
  const theme = useThemeStore((state) => state.theme);

  let mUnreads = null;

  if (online > 20) {
    mUnreads = '20+';
  } else if (online > 0) {
    mUnreads = String(online);
  }
  if (!mUnreads) {
    return null;
  }

  return (
    <View
      style={[
        styles.counter,
        { backgroundColor: theme.accent },
        style && style,
      ]}>
      <TextField margin={false} bold size="xsmall" type="secondary">
        {mUnreads}
      </TextField>
    </View>
  );
};

const styles = StyleSheet.create({
  counter: {
    borderRadius: 50,
    bottom: -2,
    elevation: 10,
    justifyContent: 'center', // centers vertically
    alignItems: 'center',     // centers horizontally
    height: 15,
    width: 15,
    // padding: 1,
    position: 'absolute',
    right: -2,
    zIndex: 10,
  },
  
});
