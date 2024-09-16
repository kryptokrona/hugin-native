import { useState } from 'react';

import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { useGlobalStore } from '@/services';

import { Avatar, TextField } from './_elements';

interface Props {
  name: string;
  key: string;
  message: string;
  timestamp: number;
  onPress: (hash: string, name: string) => void;
}

export const PreviewItem: React.FC<Props> = ({
  name,
  key,
  message,
  timestamp,
  onPress,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const theme = useGlobalStore((state) => state.theme);
  const isNew = false; // dummy
  const borderColor = isNew ? theme.foreground : theme.border;

  function handleLongPress() {
    setIsPressed(true);
    // Do something like a popup?
  }

  function handlePress() {
    onPress(key, name);
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
