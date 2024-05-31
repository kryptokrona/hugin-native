import { useState } from 'react';

import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { useGlobalStore } from '@/services';
import {
  MessagesScreens,
  type MessagesStackNavigationType,
  type MessageUser,
} from '@/types';

import { Avatar, TextField } from './_elements';

interface Props {
  lastMessage: {
    id: string;
    text: string;
  };
  user: MessageUser;
}

export const MessagePreviewItem: React.FC<Props> = ({ lastMessage, user }) => {
  const navigation = useNavigation<MessagesStackNavigationType>();
  const [isPressed, setIsPressed] = useState(false);
  const theme = useGlobalStore((state) => state.theme);
  const isNew = lastMessage.id === '123abc'; // Dummy condition
  const borderColor = isNew ? theme.primary : theme.border;

  function handleLongPress() {
    setIsPressed(true);
    // Do something like a popup?
  }

  function handlePress() {
    navigation.navigate(MessagesScreens.MessageScreen, { user });
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isPressed ? theme.backgroundAccent : 'transparent',
          borderColor,
        },
      ]}
      onLongPress={handleLongPress}
      onPress={handlePress}
      onPressOut={() => setIsPressed(false)}>
      <Avatar size={50} hash={user.key} />
      <View style={styles.content}>
        <TextField bold={isNew} maxLength={22} size="large">
          {user.name}
        </TextField>
        <TextField bold={isNew} maxLength={80} size="small">
          {lastMessage.text}
        </TextField>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    flexDirection: 'row',
    padding: 16,
  },
  content: {
    flex: 1,
    marginLeft: 16,
  },
});
