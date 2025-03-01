import { useEffect, useState } from 'react';

import { View } from 'react-native';

import { useNavigation, type RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { InputField, ScreenLayout, TextButton } from '@/components';
import { MainScreens } from '@/config';
import { useUserStore } from '@/services';
import type { MainStackNavigationType, MainNavigationParamList } from '@/types';

import { group_random_key } from '../lib/native';
import { joinAndSaveRoom } from '../services/bare/groups';

interface Props {
  route: RouteProp<MainNavigationParamList, typeof MainScreens.AddGroupScreen>;
}

export const AddGroupScreen: React.FC<Props> = ({ route }) => {
  const { t } = useTranslation();
  const navigation = useNavigation<MainStackNavigationType>();
  const [name, setName] = useState<string | null>(null);
  const { name: userName, address } = useUserStore((state) => state.user);

  async function onCreatePress() {
    const generated = await generateKey();
    const admin = generated?.admin;

    if (generated?.invite && name && address && admin) {
      joinAndSaveRoom(generated.invite, name, address, userName, admin);
      navigation.navigate(MainScreens.GroupChatScreen, {
        name,
        roomKey: generated.invite,
      });
    }
  }

  async function generateKey() {
    try {
      const keys = await group_random_key();
      const [invite, seed] = keys;

      if (invite) {
        return { admin: seed, invite };
      }
    } catch (e) {
      console.error('Error create random group key', e);
    }
  }

  function onNameChange(value: string) {
    setName(value);
  }

  useEffect(() => {
    return () => {
      setName(null);
    };
  }, []);

  return (
    <ScreenLayout>
      <View>
        <InputField
          label={t('name')}
          value={name}
          onChange={onNameChange}
          onSubmitEditing={onCreatePress}
        />
        <TextButton disabled={!name} onPress={onCreatePress}>
          {t('createRoom')}
        </TextButton>
      </View>
    </ScreenLayout>
  );
};
