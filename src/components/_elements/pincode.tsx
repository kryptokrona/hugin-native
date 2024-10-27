import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { useThemeStore } from '@/services';

interface PINInputProps {
  onFinish: (pin: string) => void;
  length?: number;
}

export const Pincode: React.FC<PINInputProps> = ({ onFinish, length = 6 }) => {
  const theme = useThemeStore((state) => state.theme);
  const [pin, setPin] = useState('');

  const handleChange = (text: string) => {
    if (text.length <= length) {
      setPin(text);
      if (text.length === length) {
        onFinish(text);
      }
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        value={pin}
        onChangeText={handleChange}
        keyboardType="numeric"
        maxLength={length}
        secureTextEntry
        style={[
          styles.input,
          { borderColor: theme.primary, color: theme.primary },
        ]}
      />
      <Text style={[styles.subtitle, { color: theme.primary }]}>
        {t('enterYourPin')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    fontSize: 24,
    marginVertical: 20,
    padding: 10,
    textAlign: 'center',
    width: '80%',
  },
  subtitle: {
    fontSize: 16,
  },
});
