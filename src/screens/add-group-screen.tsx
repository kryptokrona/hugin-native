import { useState } from 'react';

import { StyleSheet, View } from 'react-native';

import { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { InputField, ScreenLayout, TextButton } from '@/components';
import { GroupsScreens, GroupStackParamList } from '@/types';

interface Props {
  route: RouteProp<GroupStackParamList, typeof GroupsScreens.AddGroupScreen>;
}

export const AddGroupScreen: React.FC<Props> = ({ route }) => {
  const { t } = useTranslation();
  const [name, setName] = useState<string | null>(null);
  const [key, setKey] = useState<string | null>(null);
  function onCreatePress() {
    console.log('Create pressed');
  }

  function onNameChange(value: string | number) {
    setName(value.toString());
  }

  function onKeyChange(value: string | number) {
    setKey(value.toString());
  }

  function onGeneratePress() {
    console.log('Generating new message key');
  }

  return (
    <ScreenLayout>
      <View style={styles.inputGroup}>
        <InputField label={t('name')} value={name} onChange={onNameChange} />
        <InputField
          label={t('messageKey')}
          value={key}
          onChange={onKeyChange}
        />
        <TextButton
          small
          style={styles.generateButton}
          onPress={onGeneratePress}>
          {t('generate')}
        </TextButton>
        <TextButton disabled={!name && !key} onPress={onCreatePress}>
          {t('continue')}
        </TextButton>
      </View>
      <View />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  generateButton: {
    alignSelf: 'flex-start',
  },
  inputGroup: {
    marginHorizontal: 20,
  },
});
