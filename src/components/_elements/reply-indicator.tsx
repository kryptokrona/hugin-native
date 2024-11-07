import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { CustomIcon } from './custom-icon';
import { TextField } from './text-field';
import { useThemeStore } from '@/services';

interface Props {
  toName: string;
  onCloseReply: () => void;
}

export const ReplyIndicator: React.FC<Props> = ({ toName, onCloseReply }) => {
  const theme = useThemeStore((state) => state.theme);
  const color = theme.accentForeground;

  return (
    <View style={[styles.container, { borderColor: theme.border }]}>
      <View style={styles.textContainer}>
        <TextField style={styles.textField} size={'xsmall'}>
          Replying to:
        </TextField>
        <TextField style={styles.textField} size="small">
          {toName}
        </TextField>
      </View>

      <TouchableOpacity onPress={onCloseReply} style={{ padding: 5 }}>
        <CustomIcon name="close" type="IO" size={24} color={color} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderTopWidth: 1,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  textContainer: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    flexDirection: 'row',
  },
  textField: {
    marginRight: 10,
  },
});
