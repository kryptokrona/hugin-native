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
import QRCode from 'react-native-qrcode-svg';

import { Peers } from 'lib/connections';

import {
  Card,
  CopyButton,
  Header,
  ModalCenter,
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
  const globalRoomUsers = useGlobalStore((state) => state.roomUsers).filter(
    (a) => a.room === roomKey,
  );
  const [roomUsers, setRoomUsers] = useState<User[]>(globalRoomUsers);

  const [change, setChange] = useState<boolean>(false);

  const [offlineUsers, setOfflineUsers] = useState<User[]>([]);

  const [showQR, setShowQR] = useState(false);

  function onCloseModal() {
    setShowQR(false);
  }

  useEffect(() => {
    async function fetchOfflineUsers() {
      const storedRoomUsers = await getRoomUsers(roomKey);
      setOfflineUsers(storedRoomUsers);
    }
    fetchOfflineUsers();
  }, [roomKey]);

  const userList = useMemo(() => {
    console.log('useMemo triggered! ');

    function fetchAndMergeUsers() {
      const mergedUsers = [...globalRoomUsers, ...offlineUsers];
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

      return uniqueUsers;
    }

    const userList = fetchAndMergeUsers();

    return userList;
  }, [offlineUsers, change]);

  Peers.on('change', () => {
    console.log('Peers changed!');
    setChange(!change);
  });

  // useEffect(() => {
  //   console.log('Useeffect triggered');
  //   setRoomUsers(userList);

  // }, [userList]);

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
    return <UserItem {...item} />;
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
            {`${t('onlineRoomMembers')} (${globalRoomUsers?.length})`}
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
        <View>
          <QRCode value={inviteText} size={300} />
        </View>
      </ModalCenter>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  flatListContainer: {
    marginVertical: 12,
    flex: 1,
  },
  flatListWrapper: {
    flex: 1,
  },
  leaveContainer: {
    justifyContent: 'flex-end',
    paddingBottom: 20,
    flexShrink: 0,
  },
  scrollViewContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
});