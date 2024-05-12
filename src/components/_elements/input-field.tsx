import { StyleSheet, TextInput, View } from 'react-native';

import { useGlobalStore } from '@/services';

import { TextField } from './text-field';

interface Props {
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  error?: boolean;
  errorText?: string;
}

export const InputField: React.FC<Props> = ({
  label,
  value,
  onChange,
  error,
  errorText,
}) => {
  const { theme } = useGlobalStore();
  return (
    <View style={styles.container}>
      <TextField text={label} size="small" type="secondary" />
      <TextInput
        placeholderTextColor={theme.secondary}
        style={styles.input}
        value={value.toString()}
        onChangeText={onChange}
      />
      {errorText && error && (
        <TextField text={errorText} size="small" type="error" />
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
