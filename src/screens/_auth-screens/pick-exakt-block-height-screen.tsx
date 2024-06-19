import { useState } from 'react';

import { View } from 'react-native';

import { type RouteProp, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { TextButton, InputField, ScreenLayout } from '@/components';
import { AuthScreens } from '@/config';
import type { AuthStackParamList, AuthStackNavigationType } from '@/types';

interface Props {
  route: RouteProp<
    AuthStackParamList,
    typeof AuthScreens.PickExactBlockHeightScreen
  >;
}

export const PickExaktBlockHeightScreen: React.FC<Props> = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<AuthStackNavigationType>();

  const [value, setValue] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [valid, setValid] = useState(false);

  const scanHeightIsValid = (
    scanHeightText?: string,
  ): { valid: boolean; text: string } => {
    if (scanHeightText === '' || scanHeightText === undefined) {
      return { text: 'Scan height is empty.', valid: false };
    }

    const scanHeight = Number(scanHeightText);

    if (isNaN(scanHeight)) {
      return { text: 'Scan height is not a number.', valid: false };
    }

    if (scanHeight < 0) {
      return { text: 'Scan height is less than 0.', valid: false };
    }

    if (!Number.isInteger(scanHeight)) {
      return { text: 'Scan height is not an integer.', valid: false };
    }

    return { text: '', valid: true };
  };

  const onChangeText = (text: string) => {
    const { valid: mValid, text: mText } = scanHeightIsValid(text);

    setValue(mText);
    setErrorMessage(mText);
    setValid(mValid);
  };

  return (
    <ScreenLayout>
      {/* <ScreenHeader text={t('whichBlock')} /> */}
      <View style={{ alignItems: 'flex-start', justifyContent: 'center' }}>
        <InputField
          label={'Block'} // TODO figure out props.label
          value={value}
          onChange={onChangeText}
          error={!!errorMessage}
          errorText={errorMessage ?? undefined}
          keyboardType="number-pad"
        />
      </View>

      <TextButton
        type="primary"
        onPress={() =>
          navigation.navigate(AuthScreens.ImportKeysOrSeedScreen, {
            scanHeight: Number(value),
          })
        }
        disabled={!valid}>
        {t('continue')}
      </TextButton>
    </ScreenLayout>
  );
};
