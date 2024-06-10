import { StyleSheet, TextInput, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { useGlobalStore } from '@/services';
import { Styles } from '@/styles';

import { TextField } from './text-field';

interface Props {
  label: string;
  value: string | null;
  onChange: (value: string) => void;
  error?: boolean;
  errorText?: string;
  keyboardType?: 'default' | 'number-pad';
  maxLength?: number;
  onSubmitEditing?: () => void;
}

export const InputField: React.FC<Props> = ({
  label,
  value,
  onChange,
  error,
  errorText,
  maxLength,
  onSubmitEditing,
  keyboardType = 'default',
}) => {
  const { t } = useTranslation();
  const theme = useGlobalStore((state) => state.theme);
  const backgroundColor = theme.backgroundAccent;
  const color = theme.primary;
  return (
    <View style={[styles.container]}>
      <TextField size="small" type="secondary">
        {label}
      </TextField>
      <TextInput
        returnKeyLabel={t('done')}
        returnKeyType={'done'}
        onSubmitEditing={onSubmitEditing}
        placeholderTextColor={theme.secondary}
        style={[styles.input, { backgroundColor, color }]}
        value={value?.toString()}
        onChangeText={(text) => onChange(text)}
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
    borderRadius: Styles.borderRadius.small,
    marginTop: 4,
    padding: 8,
    paddingHorizontal: 10,
  },
});
