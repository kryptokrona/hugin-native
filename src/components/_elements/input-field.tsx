import { StyleSheet, TextInput, View } from 'react-native';

import { useGlobalStore } from '@/services';

import { TextField } from './text-field';

interface Props {
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  error?: boolean;
  errorText?: string;
  keyboardType?: 'default' | 'number-pad';
  maxLength?: number;
}

export const InputField: React.FC<Props> = ({
  label,
  value,
  onChange,
  error,
  errorText,
  maxLength,
  keyboardType = 'default',
}) => {
  const theme = useGlobalStore((state) => state.theme);
  return (
    <View style={styles.container}>
      <TextField size="small" type="secondary">
        {label}
      </TextField>
      <TextInput
        placeholderTextColor={theme.secondary}
        style={styles.input}
        value={value.toString()}
        onChangeText={(text) =>
          onChange(keyboardType === 'number-pad' ? Number(text) : text)
        }
        keyboardType={keyboardType}
        maxLength={maxLength}
      />
      {errorText && error && (
        <TextField size="small" type="error">
          {errorText}
        </TextField>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  input: {
    borderBottomWidth: 1,
    padding: 5,
  },
});
