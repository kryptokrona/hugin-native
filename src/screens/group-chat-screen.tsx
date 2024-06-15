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
import { onSendGroupMessage, onSendGroupMessageWithFile } from '@/p2p';
import { useGlobalStore } from '@/services';
import {
  GroupsScreens,
  type SelectedFile,
  type GroupStackNavigationType,
  type GroupStackParamList,
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
    if (file) {
      const hardTopic =
        'c36483f42ff391d0a1f006f5cc72058eb7c3d9080aeecd3a7b2c2138f62f4965';
      onSendGroupMessageWithFile(hardTopic, file, text);
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
