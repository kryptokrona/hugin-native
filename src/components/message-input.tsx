import React, { useState } from 'react';

import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { useGlobalStore } from '@/services';

import { CustomIcon } from './_elements';

interface Props {
  onSend: (text: string) => void;
}

export const MessageInput: React.FC<Props> = ({ onSend }) => {
  const theme = useGlobalStore((state) => state.theme);
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim()) {
      onSend(text);
      setText('');
    }
  };

  const onChange = (text: string) => {
    setText(text);
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          { backgroundColor: theme.backgroundAccent },
        ]}>
        <TextInput
          style={[styles.inputField, { color: theme.primary }]}
          value={text}
          onChangeText={onChange}
          placeholder="Type a message..."
          placeholderTextColor={theme.secondary}
          multiline
        />
        <TouchableOpacity onPress={handleSend} style={styles.btn}>
          <CustomIcon name="send" type="IO" size={24} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  btn: {
    padding: 10,
  },
  container: {
    width: '100%',
  },
  inputContainer: {
    alignItems: 'center',
    borderRadius: 10,
    flexDirection: 'row',
  },
  inputField: {
    flex: 1,
    minHeight: 50,
  },
});
