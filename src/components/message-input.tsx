import React, { useState } from 'react';

import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { useGlobalStore } from '@/services';
import { commonInputProps, Styles } from '@/styles';

import { CustomIcon } from './_elements';

interface Props {
  onSend: (text: string) => void;
}

export const MessageInput: React.FC<Props> = ({ onSend }) => {
  const { t } = useTranslation();
  const theme = useGlobalStore((state) => state.theme);
  const [text, setText] = useState('');
  const [focus, setFocus] = useState(false);

  function handleSend() {
    if (text.trim()) {
      onSend(text);
      setText('');
    }
  }

  function onChange(text: string) {
    setText(text);
  }

  function onBlur() {
    setFocus(false);
  }

  function onFocus() {
    setFocus(true);
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          { backgroundColor: theme.backgroundSecondary },
        ]}>
        <TextInput
          style={[styles.inputField, { color: theme.inverted }]}
          value={text}
          onChangeText={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder="  Aa..."
          placeholderTextColor={theme.secondary}
          multiline
          autoCapitalize="sentences"
          autoCorrect
          returnKeyLabel={t('send')}
          returnKeyType="send"
          {...commonInputProps}
        />
        <TouchableOpacity onPress={handleSend} style={styles.btn}>
          <CustomIcon
            name="send"
            type="IO"
            size={24}
            color={focus ? theme.inverted : theme.secondary}
          />
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
    borderRadius: Styles.borderRadius.small,
    flexDirection: 'row',
    margin: 10,
  },
  inputField: {
    flex: 1,
    minHeight: 50,
    paddingLeft: 4,
  },
});
