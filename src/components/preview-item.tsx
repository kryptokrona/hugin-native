import { useState } from 'react';

import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { useThemeStore } from '@/services';
import { getAvatar } from '@/utils';

import { Avatar, TextField } from './_elements';

interface Props {
  name: string;
  roomKey: string;
  message: string;
  timestamp: number;
  onPress: (key: string, name: string) => void;
}

export const PreviewItem: React.FC<Props> = ({
  name,
  roomKey,
  message,
  timestamp,
  onPress,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const theme = useThemeStore((state) => state.theme);
  const isNew = false; // dummy
  const borderColor = isNew ? theme.foreground : theme.border;

  function handleLongPress() {
    setIsPressed(true);
    // Do something like a popup?
  }

  function handlePress() {
    onPress(roomKey, name);
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        styles.container,
        {
          borderColor,
        },
      ]}
      onLongPress={handleLongPress}
      onPressOut={() => setIsPressed(false)}>
      <Avatar size={50} base64={getAvatar(roomKey)} />
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
