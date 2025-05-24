import { Avatar, TextButton, TextField, Unreads } from './_elements';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { getAvatar } from '@/utils';
import { useThemeStore } from '@/services';
import { t } from 'i18next';

interface Props {
  name: string;
  roomKey?: string;
  address?: string;
  message?: string;
  unreads?: number;
  onPress: (key: string, name: string) => void;
  suggested?: boolean;
}

export const PreviewItem: React.FC<Props> = ({
  name,
  roomKey,
  address,
  message,
  unreads = 0,
  onPress,
  suggested = false,
}) => {
  const mRoomKey: string = roomKey ? roomKey : (address as string);
  const theme = useThemeStore((state) => state.theme);
  const isNew = false; // Can be used for future logic
  const borderColor = isNew ? theme.foreground : theme.border;

  function handlePress() {
    onPress(mRoomKey, name);
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        styles.container,
        { borderColor },
      ]}>
      <View style={styles.avatarContainer}>
        <Unreads unreads={unreads} />
        {mRoomKey?.length > 15 && (
          <Avatar size={suggested ? 25 : 50} address={mRoomKey} base64={getAvatar(mRoomKey)} />
        )}
      </View>

      <View style={[styles.content, suggested && styles.centeredContent]}>
        <TextField bold={isNew} maxLength={22} size={suggested ? "small" : "large"}>
          {name}
        </TextField>
        {!suggested &&
          <TextField bold={isNew} maxLength={65} size="small">
            {message}
          </TextField>
        }
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
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  }
});
