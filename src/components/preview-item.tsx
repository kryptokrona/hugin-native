import { Avatar, TextField, Unreads } from './_elements';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { getAvatar } from '@/utils';
import { useThemeStore } from '@/services';

interface Props {
  name: string;
  roomKey?: string;
  address?: string;
  message: string;
  unreads?: number;
  onPress: (key: string, name: string) => void;
}

export const PreviewItem: React.FC<Props> = ({
  name,
  roomKey,
  address,
  message,
  onPress,
  unreads = 0,
}) => {
  const mRoomKey: string = roomKey ? roomKey : (address as string);
  const theme = useThemeStore((state) => state.theme);
  const isNew = false; // dummy
  const borderColor = isNew ? theme.foreground : theme.border;

  function handlePress() {
    onPress(mRoomKey, name);
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        styles.container,
        {
          borderColor,
        },
      ]}>
      <View style={styles.avatarContainer}>
        <Unreads unreads={unreads} />
        {mRoomKey?.length > 15 && (
          <Avatar size={50} address={mRoomKey} base64={getAvatar(mRoomKey)} />
        )}
      </View>
      <View style={styles.content}>
        <TextField bold={isNew} maxLength={22} size="large">
          {name}
        </TextField>
        <TextField bold={isNew} maxLength={65} size="small">
          {message}
        </TextField>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  avatarContainer: {
    position: 'relative',
  },
  container: {
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingVertical: 16,
  },
  content: {
    flex: 1,
    marginLeft: 16,
  },
});
