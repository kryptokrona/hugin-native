import React, { useEffect, useState } from 'react';

import { type RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { Container, ScreenLayout, TextField } from '@/components';
import { Group, GroupsScreens, GroupStackParamList } from '@/types';

interface Props {
  route: RouteProp<GroupStackParamList, typeof GroupsScreens.GroupsScreen>;
}

export const GroupsScreen: React.FC<Props> = ({ route }) => {
  const { t } = useTranslation();
  // const navigation = useNavigation<GroupStackNavigationType>();
  const [groups, setGroups] = useState<Group[]>([]);

  // useLayoutEffect(() => {
  //   navigation.setOptions({
  //     header: () => (
  //       <Header
  //         title={t('groups')}
  //         right={<CustomIcon type="MI" name="add-box" size={30} />}
  //       />
  //     ),
  //   });
  // }, []);

  useEffect(() => {
    setGroups([]);
  }, []);

  return (
    <ScreenLayout>
      {groups.length === 0 && (
        <Container>
          <TextField size="large">{t('emptyAddressBook')}</TextField>
        </Container>
      )}
    </ScreenLayout>
  );
};
