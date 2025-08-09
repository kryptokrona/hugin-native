import { StyleProp, StyleSheet, View } from 'react-native';

import { useThemeStore } from '@/services';

import { TextField } from './text-field';

interface Props {
  unreads: number;
  style?: StyleProp<any> | undefined;
}

export const Unreads: React.FC<Props> = ({ unreads, style }) => {
  const theme = useThemeStore((state) => state.theme);

  let mUnreads = null;

  if (unreads > 20) {
    mUnreads = '20+';
  } else if (unreads > 0) {
    mUnreads = String(unreads);
  }
  if (!mUnreads) {
    return null;
  }

  return (
    <View
      style={[
        styles.counter,
        { backgroundColor: theme.accent, minWidth: unreads > 20 ? 37 : unreads > 9 ? 28 : 20 },
        style && style,
      ]}>
      <TextField bold numberOfLines={1} size="xsmall" type="secondary">
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
    justifyContent: 'center',
    minHeight: 20,
    minWidth: 20,
    padding: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    position: 'absolute',
    right: 0,
    zIndex: 10,
    alignSelf: 'flex-start'
  },
});
