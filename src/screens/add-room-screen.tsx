import { useEffect, useState } from 'react';

import { View } from 'react-native';

import {
  CommonActions,
  useNavigation,
  type RouteProp,
} from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { InputField, ScreenLayout, TextButton } from '@/components';
import { RoomsScreens } from '@/config';
import {
  joinAndSaveRoom,
  onRequestNewGroupKey,
  useUserStore,
} from '@/services';
import type { RoomStackNavigationType, RoomStackParamList } from '@/types';

interface Props {
  route: RouteProp<RoomStackParamList, typeof RoomsScreens.AddRoomScreen>;
}

let admin: string = '';
export const AddRoomScreen: React.FC<Props> = ({ route }) => {
  const { t } = useTranslation();
  const { name: initialName, key: initialKey } = route.params;
  const formattedName = initialName ? initialName.replace(/-/g, ' ') : null;
  const navigation = useNavigation<RoomStackNavigationType>();
  const [name, setName] = useState<string | null>(formattedName);
  const [keyInput, setKeyInput] = useState<string | null>(initialKey ?? null);
  const { name: userName, address } = useUserStore((state) => state.user);
  const continueText = initialKey ? t('joinRoom') : t('createRoom');

  async function onCreatePress() {
    const roomKey = keyInput ?? (await generateKey());
    if (roomKey && name) {
      joinAndSaveRoom(roomKey, name, admin, address, userName);
      navigation.dispatch(
        CommonActions.reset({
          index: 1,
          routes: [
            { name: RoomsScreens.RoomScreens },
            {
              name: RoomsScreens.RoomChatScreen,
              params: { name, roomKey },
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
      console.log('Invite key:', invite);
      console.log('Admin seed:', seed);
      if (invite) {
        // setKey(invite);
        admin = seed;
        return invite;
      }
    } catch (e) {
      console.error('Error create random room key', e);
    }
  }

  function onNameChange(value: string) {
    setName(value);
  }

  function onKeyChange(value: string) {
    setKeyInput(value);
  }

  useEffect(() => {
    if (!initialKey) {
      generateKey();
    }
  }, [initialKey]);

  useEffect(() => {
    return () => {
      setName(null);
      setKeyInput(null);
    };
  }, []);

  return (
    <ScreenLayout>
      <View>
        <InputField label={t('name')} value={name} onChange={onNameChange} />
        {initialKey && (
          <InputField
            label={t('messageKey')}
            value={keyInput}
            onChange={onKeyChange}
          />
        )}
        {/* {!isJoiningExisting && (
          <TextButton
            small
            type="secondary"
            style={styles.generateButton}
            onPress={onGeneratePress}>
            {t('generate')}
          </TextButton>
        )} */}
        <TextButton disabled={!name} onPress={onCreatePress}>
          {continueText}
        </TextButton>
      </View>
    </ScreenLayout>
  );
};

// const styles = StyleSheet.create({
//   generateButton: {
//     alignSelf: 'flex-start',
//   },
// });
