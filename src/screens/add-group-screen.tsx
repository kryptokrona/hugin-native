import { useEffect, useState } from 'react';

import { View } from 'react-native';

import {
  CommonActions,
  useNavigation,
  type RouteProp,
} from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { InputField, ScreenLayout, TextButton } from '@/components';
import { GroupsScreens } from '@/config';
import {
  joinAndSaveRoom,
  onRequestNewGroupKey,
  useUserStore,
} from '@/services';
import type { GroupStackNavigationType, GroupStackParamList } from '@/types';

interface Props {
  route: RouteProp<GroupStackParamList, typeof GroupsScreens.AddGroupScreen>;
}

let admin: string = '';
export const AddGroupScreen: React.FC<Props> = ({ route }) => {
  const { t } = useTranslation();
  const { name: initialName, roomKey: initialKey, joining } = route.params;
  const formattedName = initialName ? initialName.replace(/-/g, ' ') : null;
  const navigation = useNavigation<GroupStackNavigationType>();
  const [name, setName] = useState<string | null>(formattedName);
  const [keyInput, setKeyInput] = useState<string | null>(initialKey ?? null);
  const { name: userName, address } = useUserStore((state) => state.user);
  const continueText = joining ? t('joinRoom') : t('createRoom');

  async function onCreatePress() {
    const roomKey = keyInput ?? (await generateKey());
    if (roomKey && name) {
      joinAndSaveRoom(roomKey, name, admin, address, userName);
      navigation.dispatch(
        CommonActions.reset({
          index: 1,
          routes: [
            { name: GroupsScreens.GroupsScreen },
            {
              name: GroupsScreens.GroupChatScreen,
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
      console.error('Error create random group key', e);
    }
  }

  function onNameChange(value: string) {
    setName(value);
  }

  function onKeyChange(value: string) {
    setKeyInput(value);
  }

  useEffect(() => {
    if (!joining) {
      generateKey();
    }
  }, [joining]);

  // useEffect(() => {
  //   if (name !== initialName || roomKey !== initialKey) {
  //     setIsJoiningExisting(false);
  //   }
  // }, [name, roomKey]);

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
        {joining && (
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
