import { useEffect, useState } from 'react';

import { StyleSheet, View } from 'react-native';

import { useNavigation, type RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { InputField, ScreenLayout, TextButton } from '@/components';
import { onCreateGroup, onRequestNewGroupKey } from '@/p2p';
import {
  GroupsScreens,
  GroupStackNavigationType,
  type GroupStackParamList,
} from '@/types';

interface Props {
  route: RouteProp<GroupStackParamList, typeof GroupsScreens.AddGroupScreen>;
}

export const AddGroupScreen: React.FC<Props> = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<GroupStackNavigationType>();
  const [name, setName] = useState<string | null>(null);
  const [key, setKey] = useState<string | null>(null);

  async function onCreatePress() {
    if (key && name) {
      const topic: string = await onCreateGroup(name, key);
      navigation.navigate(GroupsScreens.GroupChatScreen, { name, topic });
    }
  }

  async function onGeneratePress() {
    try {
      const mKey = await onRequestNewGroupKey();
      console.log({ mKey });
      if (mKey) {
        setKey(mKey);
      }
    } catch (e) {
      console.error('Error create random group key', e);
    }
  }

  useEffect(() => {
    console.log({ key });
  }, [key]);

  function onNameChange(value: string) {
    setName(value);
  }

  function onKeyChange(value: string) {
    setKey(value);
  }

  return (
    <ScreenLayout>
      <View>
        <InputField label={t('name')} value={name} onChange={onNameChange} />
        <InputField
          label={t('messageKey')}
          value={key}
          onChange={onKeyChange}
        />
        <TextButton
          small
          type="secondary"
          style={styles.generateButton}
          onPress={onGeneratePress}>
          {t('generate')}
        </TextButton>
        <TextButton disabled={!name && !key} onPress={onCreatePress}>
          {t('continue')}
        </TextButton>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  generateButton: {
    alignSelf: 'flex-start',
  },
});
