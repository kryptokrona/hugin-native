import React, { useEffect, useState } from 'react';

import { FlatList } from 'react-native';

import { useNavigation, type RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { Container, PreviewItem, ScreenLayout, TextField } from '@/components';
import { getUserGroups } from '@/p2p';
import {
  Group,
  GroupsScreens,
  GroupStackNavigationType,
  GroupStackParamList,
} from '@/types';

interface Props {
  route: RouteProp<GroupStackParamList, typeof GroupsScreens.GroupsScreen>;
}

export const GroupsScreen: React.FC<Props> = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<GroupStackNavigationType>();
  const [groups, setGroups] = useState<Group[]>([]);
  const mockUser = {
    someKey: '123',
  };
  useEffect(() => {
    const groups = getUserGroups(mockUser.someKey);
    setGroups(groups);
  }, []);

  function onPress(topic: string, name: string) {
    navigation.navigate(GroupsScreens.GroupChatScreen, { name, topic });
  }

  return (
    <ScreenLayout>
      {groups.length === 0 && (
        <Container>
          <TextField size="large">{t('emptyAddressBook')}</TextField>
        </Container>
      )}
      <FlatList
        data={groups}
        keyExtractor={(item, i) => `${item.topic}-${i}`}
        renderItem={({ item }) => <PreviewItem {...item} onPress={onPress} />}
      />
    </ScreenLayout>
  );
};
