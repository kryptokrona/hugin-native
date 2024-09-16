import { useLayoutEffect, useRef } from 'react';

import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

import { type RouteProp, useNavigation } from '@react-navigation/native';

import {
  CustomIcon,
  GroupMessageItem,
  Header,
  MessageInput,
  ScreenLayout,
} from '@/components';
import { GroupsScreens } from '@/config';
import {
  onSendGroupMessage,
  onSendGroupMessageWithFile,
  useGlobalStore,
} from '@/services';
import type {
  SelectedFile,
  GroupStackNavigationType,
  GroupStackParamList,
} from '@/types';
import { mockAvatar, mockMessages } from '@/utils';

interface Props {
  route: RouteProp<GroupStackParamList, typeof GroupsScreens.GroupChatScreen>;
}

export const GroupChatScreen: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation<GroupStackNavigationType>();
  const flatListRef = useRef<FlatList>(null);
  const { name: userName } = useGlobalStore((state) => state.user);
  const { topic, name } = route.params;

  // TODO: get messages from topic, rename Groups -> Rooms
  // Use getRoomMessages with a page index (0 is default) to load more messages
  //getRoomMessages(key, page) -> [alreadyloaded, ...more]

  function onCustomizeGroupPress() {
    navigation.navigate(GroupsScreens.ModifyGroupScreen, {
      name,
      topic,
    });
  }

  useLayoutEffect(() => {
    const isAdmin = true; // TODO
    const icon = isAdmin ? 'users-cog' : 'users';
    navigation.setOptions({
      header: () => (
        <Header
          backButton
          title={name}
          right={
            <TouchableOpacity onPress={onCustomizeGroupPress}>
              <CustomIcon type="FA5" name={icon} />
            </TouchableOpacity>
          }
        />
      ),
    });
  }, [topic, name]);

  useLayoutEffect(() => {
    const timeout = setTimeout(() => {
      if (flatListRef.current && mockMessages && mockMessages.length > 0) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }, 1000);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  function onSend(text: string, file: SelectedFile | null) {
    console.log('Send message to room with topic: ', topic);
    console.log('Room name:', name);
    //TODO** check if reply state is active
    //add the hash of the message we are replying to as reply
    if (file) {
      onSendGroupMessageWithFile(topic, file, text);
    } else {
      onSendGroupMessage(topic, text);
    }
  }

  return (
    <ScreenLayout>
      <FlatList
        ref={flatListRef}
        data={mockMessages}
        keyExtractor={(item, i) => `${item.k}${i}`}
        renderItem={({ item }) => (
          <GroupMessageItem
            message={item.m}
            date={item.t}
            avatar={mockAvatar}
            name={item.n}
            userAddress={item.k}
            reactions={item.reactions}
          />
        )}
        contentContainerStyle={styles.flatListContent}
      />
      <View style={styles.inputWrapper}>
        <MessageInput onSend={onSend} />
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  flatListContent: {
    paddingBottom: 60,
  },
  inputWrapper: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
});
