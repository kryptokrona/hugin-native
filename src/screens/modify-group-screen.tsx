import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';

import {
  FlatList,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import {
  RouteProp,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import {
  Card,
  CopyButton,
  Header,
  ModalCenter,
  QrCodeDisplay,
  ScreenLayout,
  TextButton,
  TextField,
  UserItem,
} from '@/components';
import { MainScreens } from '@/config';
import { setStoreCurrentRoom, useGlobalStore } from '@/services';
import {
  MainNavigationParamList,
  MainStackNavigationType,
  User,
} from '@/types';

import { onDeleteGroup } from '../services/bare/groups';
import { getRoomUsers } from '../services/bare/sqlite';
import { opacity } from 'react-native-reanimated/lib/typescript/Colors';

interface Props {
  route: RouteProp<
    MainNavigationParamList,
    typeof MainScreens.ModifyGroupScreen
  >;
}

export const ModifyGroupScreen: React.FC<Props> = ({ route }) => {
  const { t } = useTranslation();
  const { name, roomKey } = route.params;
  const navigation = useNavigation<MainStackNavigationType>();
  const onlineUsers = useGlobalStore((state) => state.roomUsers[roomKey]);
  const [userList, setUserList] = useState<User[]>([]);

  const [offlineUsers, setOfflineUsers] = useState<User[]>([]);

  const [showQR, setShowQR] = useState(false);

  function onCloseModal() {
    setShowQR(false);
  }

  useEffect(() => {
    if (!onlineUsers) {
      return;
    }

    function fetchAndMergeUsers() {
      const mergedUsers = [...onlineUsers, ...offlineUsers];
      const uniqueUsers = mergedUsers.reduce((acc: User[], user) => {
        const existingUserIndex = acc.findIndex(
          (u) => u.address === user.address,
        );
        if (existingUserIndex === -1) {
          acc.push(user);
        } else if (user.online) {
          acc[existingUserIndex] = user;
        }
        return acc;
      }, []);

      setUserList(uniqueUsers);
    }

    fetchAndMergeUsers();
  }, [onlineUsers, offlineUsers]);

  useEffect(() => {
    async function fetchOfflineUsers() {
      const storedRoomUsers = await getRoomUsers(roomKey);
      setOfflineUsers(storedRoomUsers);
    }
    fetchOfflineUsers();
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <Header
          backButton
          title={name}
          onBackPress={() =>
            navigation.navigate(MainScreens.GroupChatScreen, { name, roomKey })
          }
        />
      ),
    });
  }, [name]);

  useFocusEffect(
    React.useCallback(() => {
      // This effect runs when the screen is focused
      setStoreCurrentRoom(roomKey);

      return () => {};
    }, [roomKey]),
  );

  function OnlineUserMapper({ item }: { item: User }) {
    return <UserItem style={{opacity: item.online ? 1 : 0.3 }} {...item} />;
  }

  function onLeave() {
    onDeleteGroup(roomKey);
    navigation.navigate(MainScreens.GroupsScreen);
  }

  const inviteText = useMemo(() => {
    const linkName = name.replace(/ /g, '-');
    return `hugin://${linkName}/${roomKey}`;
  }, [name, roomKey]);

  return (
    <ScreenLayout>
      <View style={styles.scrollViewContainer}>
        <View style={styles.flatListContainer}>
          <TextField size={'xsmall'} type="muted">
            {`${t('onlineRoomMembers')} (${onlineUsers?.length})`}
          </TextField>
          <View style={styles.flatListWrapper}>
            <FlatList
              nestedScrollEnabled={true}
              numColumns={2}
              data={userList}
              renderItem={OnlineUserMapper}
              keyExtractor={(item, i) => `${item.name}-${i}`}
              style={{ flex: 1 }}
            />
          </View>
        </View>
        <TouchableWithoutFeedback>
          <Card>
            <TextField size="xsmall">{inviteText}</TextField>
          </Card>
        </TouchableWithoutFeedback>

        <CopyButton
          onPress={() => ''}
          text={t('copyInvite')}
          data={inviteText}
        />

        <TextButton onPress={() => setShowQR(true)}>{t('showQR')}</TextButton>

        <View style={styles.leaveContainer}>
          <TextButton onPress={onLeave} type="destructive">
            {t('leaveGroup')}
          </TextButton>
        </View>
      </View>

      <ModalCenter visible={showQR} closeModal={onCloseModal}>
        <QrCodeDisplay code={inviteText} />
      </ModalCenter>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  flatListContainer: {
    flex: 1,
    marginVertical: 12,
  },
  flatListWrapper: {
    flex: 1,
  },
  leaveContainer: {
    flexShrink: 0,
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  scrollViewContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
});
