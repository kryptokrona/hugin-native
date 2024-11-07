import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Styles } from '@/styles';
import { TextField } from './text-field';
import { useThemeStore } from '@/services';
import { useTranslation } from 'react-i18next';

interface PINInputProps {
  onFinish: (pin: string) => void;
}

export const Pincode: React.FC<PINInputProps> = ({ onFinish }) => {
  const { t } = useTranslation();

  const [focus, setFocus] = useState(false);
  const theme = useThemeStore((state) => state.theme);
  const backgroundColor = theme.background;
  const borderColor = focus ? theme.foreground : theme.input;
  const color = focus ? theme.foreground : theme.mutedForeground;
  const [pin, setPin] = useState('');
  const length = 6;

  function onFocus() {
    setFocus(true);
  }

  function onBlur() {
    setFocus(false);
  }

  const onChange = (text: string) => {
    console.log({ text, length });
    console.log('here 1');
    if (text.length <= length) {
      console.log('here 2');
      setPin(text);
      if (text.length === length) {
        console.log('here 3');
        onFinish(text);
      }
    }
  };

  const onSubmit = () => {
    if (pin.length === length) {
      onFinish(pin);
    }
  };

  return (
    <View style={styles.container}>
      <TextField size="small" type={focus ? 'secondary' : 'muted'}>
        {t('enterPin')}
      </TextField>
      <View style={styles.inputContainer}>
        <TextInput
          secureTextEntry
          returnKeyLabel={t('done')}
          returnKeyType={'done'}
          onSubmitEditing={onSubmit}
          placeholderTextColor={color}
          style={[styles.input, { backgroundColor, borderColor, color }]}
          value={pin?.toString()}
          onChangeText={(text) => onChange(text)}
          keyboardType={'number-pad'}
          maxLength={6}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  inputContainer: {
    // flexDirection: 'row',
    // alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 16,
    width: 100,
  },
  input: {
    borderRadius: Styles.borderRadius.small,
    borderWidth: 1,
    fontFamily: 'Montserrat-Medium',
    marginTop: 4,
    padding: 8,
    paddingHorizontal: 10,
    fontSize: 30,
  },
});
