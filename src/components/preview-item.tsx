import { Avatar, CustomIcon, TextField, Unreads } from './_elements';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { getAvatar } from '@/utils';
import { useGlobalStore, useThemeStore } from '@/services';
import { useEffect, useState } from 'react';

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
  const [voiceOnline, setVoiceOnline] = useState(false);

  const roomUsers = useGlobalStore((state) => state.roomUsers[roomKey]);

    useEffect(() => {
      if (roomUsers?.some(a => a.voice == true)) {
        setVoiceOnline(true);
      } else {
        setVoiceOnline(false);
      }
    }, [roomUsers]);

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
        {voiceOnline &&

            <View
              style={[
                styles.counter,
                { backgroundColor: theme.accent }
              ]}>
                <CustomIcon size={12} type="MCI" name={'phone'} />
            </View>

        }
        <Unreads unreads={unreads} />
        {mRoomKey?.length > 15 && (
          <Avatar size={50} base64={getAvatar(mRoomKey)} />
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
  counter: {
    borderRadius: 50,
    top: -2,
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
  },
});
