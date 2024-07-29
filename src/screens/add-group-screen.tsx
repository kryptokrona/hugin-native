import { useEffect, useState } from 'react';

import { StyleSheet, View } from 'react-native';

import { useNavigation, type RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { InputField, ScreenLayout, TextButton } from '@/components';
import { GroupsScreens } from '@/config';
import { onCreateGroup, onRequestNewGroupKey } from '@/services';
import type { GroupStackNavigationType, GroupStackParamList } from '@/types';

interface Props {
  route: RouteProp<GroupStackParamList, typeof GroupsScreens.AddGroupScreen>;
}

export const AddGroupScreen: React.FC<Props> = ({ route }) => {
  const { t } = useTranslation();
  const { name: initialName, topic: initialtopic } = route.params;
  const navigation = useNavigation<GroupStackNavigationType>();
  const [name, setName] = useState<string | null>(initialName ?? null);
  const [key, setKey] = useState<string | null>(initialtopic ?? null);
  const [isJoiningExisting, setIsJoiningExisting] = useState(false);
  const continueText = isJoiningExisting ? t('joinGroup') : t('createGroup');

  async function onCreatePress() {
    if (key && name) {
      const topic: string = await onCreateGroup(name, key);
      navigation.navigate(GroupsScreens.GroupChatScreen, { name, topic });
    }
  }

  async function onGeneratePress() {
    try {
      const mKey = await onRequestNewGroupKey();
      const [key, seed] = JSON.parse(mKey);
      console.log(key, seed);
      if (key) {
        setKey(key);
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

  useEffect(() => {
    if (initialName && initialtopic) {
      setIsJoiningExisting(true);
    }
  }, [initialName, initialtopic]);

  useEffect(() => {
    if (name !== initialName || key !== initialtopic) {
      setIsJoiningExisting(false);
    }
  }, [name, key]);

  return (
    <ScreenLayout>
      <View>
        <InputField label={t('name')} value={name} onChange={onNameChange} />
        <InputField
          label={t('messageKey')}
          value={key}
          onChange={onKeyChange}
        />
        {!isJoiningExisting && (
          <TextButton
            small
            type="secondary"
            style={styles.generateButton}
            onPress={onGeneratePress}>
            {t('generate')}
          </TextButton>
        )}
        <TextButton disabled={!name && !key} onPress={onCreatePress}>
          {continueText}
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
