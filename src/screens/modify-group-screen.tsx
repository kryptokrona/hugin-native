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
import {
  FlatList,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {
  MainNavigationParamList,
  MainStackNavigationType,
  User,
} from '@/types';
import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import { onDeleteGroup, setStoreCurrentRoom, useGlobalStore } from '@/services';

import { MainScreens } from '@/config';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-native-qrcode-svg';

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
  const roomUsers = useGlobalStore((state) => state.roomUsers).filter(
    (a) => a.room === roomKey,
  );
  const [showQR, setShowQR] = useState(false);

  function onCloseModal() {
    setShowQR(false);
  }

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
            {t('onlineRoomMembers')}
          </TextField>
          <FlatList
            nestedScrollEnabled={true}
            numColumns={2}
            data={roomUsers}
            renderItem={OnlineUserMapper}
            keyExtractor={(item, i) => `${item.name}-${i}`}
          />
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
          <QRCode
            value={inviteText}
            size={300}
          />
        </View>
      </ModalCenter>

    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  flatListContainer: {
    marginVertical: 12,
  },
  leaveContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrollViewContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
});
