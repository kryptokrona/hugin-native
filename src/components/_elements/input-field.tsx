import { useState } from 'react';

import { StyleSheet, TextInput, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { useThemeStore } from '@/services';
import { Styles, commonInputProps } from '@/styles';

import { TextField } from './text-field';

interface Props {
  label: string;
  value: string | null;
  onChange: (value: string) => void;
  error?: boolean;
  errorText?: string;
  // keyboardType?: 'default' | 'number-pad';
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
  // keyboardType = 'default',
}) => {
  const { t } = useTranslation();
  const [focus, setFocus] = useState(false);
  const theme = useThemeStore((state) => state.theme);
  const backgroundColor = theme.background;
  const borderColor = focus
    ? theme.foreground
    : error
    ? theme.destructiveForeground
    : theme.input;
  const color = focus ? theme.foreground : theme.mutedForeground;

  function onFocus() {
    setFocus(true);
  }

  function onBlur() {
    setFocus(false);
  }

  return (
    <View style={styles.container}>
      <TextField size="small" type={focus ? 'secondary' : 'muted'}>
        {label}
      </TextField>
      <TextInput
        returnKeyLabel={t('done')}
        returnKeyType={'done'}
        onSubmitEditing={onSubmitEditing}
        placeholderTextColor={color}
        style={[styles.input, { backgroundColor, borderColor, color }]}
        value={value?.toString()}
        onChangeText={(text) => onChange(text)}
        keyboardType={'default'}
        maxLength={maxLength}
        onFocus={onFocus}
        onBlur={onBlur}
        {...commonInputProps}
      />
      {errorText && error && (
        <TextField size="small" type="destructive">
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
    borderWidth: 1,
    fontFamily: 'Montserrat-Medium',
    marginTop: 4,
    padding: 8,
    paddingHorizontal: 10,
  },
});
