import { useEffect, useState } from 'react';

import { View } from 'react-native';

import {
  CommonActions,
  useNavigation,
  type RouteProp,
} from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { InputField, ScreenLayout, TextButton } from '@/components';
import { MainScreens } from '@/config';
import {
  joinAndSaveRoom,
  onRequestNewGroupKey,
  useUserStore,
} from '@/services';
import type { MainStackNavigationType, MainNavigationParamList } from '@/types';

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
      navigation.dispatch(
        CommonActions.reset({
          index: 1,
          routes: [
            { name: MainScreens.GroupsScreen },
            {
              name: MainScreens.GroupChatScreen,
              params: { name, roomKey: generated.invite },
            },
          ],
        }),
      );
    }
  }

  async function generateKey() {
    try {
      const keys = await onRequestNewGroupKey();
      const [invite, seed] = JSON.parse(keys);

      if (invite) {
        return { invite, admin: seed };
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
