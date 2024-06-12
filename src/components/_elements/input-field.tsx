import { useState } from 'react';

import { StyleSheet, TextInput, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { useGlobalStore } from '@/services';
import { commonInputProps, Styles } from '@/styles';

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
  // https://reactnative.dev/docs/inputaccessoryview
  const { t } = useTranslation();
  const [focus, setFocus] = useState(false);
  const theme = useGlobalStore((state) => state.theme);
  const backgroundColor = theme.background;
  const borderColor = focus ? theme.border : theme.borderSecondary;
  const color = focus ? theme.primary : theme.secondary;

  function onFocus() {
    setFocus(true);
  }

  function onBlur() {
    setFocus(false);
  }

  return (
    <View style={[styles.container]}>
      <TextField size="small" type={focus ? 'primary' : 'secondary'}>
        {label}
      </TextField>
      <TextInput
        returnKeyLabel={t('done')}
        returnKeyType={'done'}
        onSubmitEditing={onSubmitEditing}
        placeholderTextColor={theme.inverted}
        style={[styles.input, { backgroundColor, borderColor, color }]}
        value={value?.toString()}
        onChangeText={(text) => onChange(text)}
        keyboardType={keyboardType}
        maxLength={maxLength}
        onFocus={onFocus}
        onBlur={onBlur}
        {...commonInputProps}
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
    borderWidth: 1,
    fontFamily: 'Montserrat-Medium',
    marginTop: 4,
    padding: 8,
    paddingHorizontal: 10,
  },
});
