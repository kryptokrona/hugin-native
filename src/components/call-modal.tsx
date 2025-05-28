import React, { useState, useEffect } from 'react';

import { StyleSheet, View, Text, FlatList } from 'react-native';

import { Avatar, TextButton, TextField, TouchableOpacity, UserItem } from '@/components';
import { useGlobalStore, WebRTC, useThemeStore } from '@/services';
import { textType } from '@/styles';
import { t } from 'i18next';
import type { MainStackNavigationType, User } from '@/types';

import { CustomIcon } from './_elements/custom-icon';

type CallModalProps = {
  inCall: boolean;
  userList: User[];
  voiceUsers: User[];
  onJoinCall: () => void;
  onEndCall: () => void;
};

export const CallModal: React.FC<CallModalProps> = ({
  inCall,
  userList,
  voiceUsers,
  onJoinCall,
  onEndCall,
}) => {

  const theme = useThemeStore((state) => state.theme);

  function OnlineUserMapper({ item }: { item: User }) {
    return <UserItem {...item} />;
  }

  return (
    <View>

      <TextField
        size={'xsmall'}
        type="muted"
        style={styles.onlineUsersText}>
        {`${t('onlineRoomMembers')} (${voiceUsers?.length})`}
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

      {!inCall ? (
        <TextButton
          small
          type={theme.mode === 'color' ? undefined : "secondary"}
          onPress={onJoinCall}
          icon={<CustomIcon name="phone" type="MCI" size={16} />}>
          {t('joinCall')}
        </TextButton>
      ) : (
        <TextButton
          small
          type="destructive"
          onPress={onEndCall}
          icon={
            <CustomIcon
              color={theme[textType.destructive]}
              name="phone-hangup"
              type="MCI"
              size={16}
            />
          }>
          {t('endCall')}
        </TextButton>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'grey',
    flex: 1,
  },
  contentContainer: {
    alignItems: 'center',
    borderRadius: 25,
    borderWidth: 1,
    flex: 1,
    marginBottom: 200,
    padding: 25,
  },
  flatListContainer: {
    flex: 1,
  },
  flatListContent: {
    flexDirection: 'column-reverse',
    paddingTop: 60,
  },
  flatListWrapper: {
    minHeight: 200
  },
  inputWrapper: {
    bottom: 0,
    left: 0,
    // marginBottom: 10,
    paddingBottom: 10,
    position: 'absolute',
    right: 0,
  },
  onlineUsersText: {
    marginBottom: 10,
    marginTop: -10,
    textAlign: 'center',
    width: '100%',
  },
});
