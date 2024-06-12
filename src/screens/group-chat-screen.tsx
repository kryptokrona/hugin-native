import { useLayoutEffect } from 'react';

import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

import { type RouteProp, useNavigation } from '@react-navigation/native';

import {
  CustomIcon,
  GroupMessageItem,
  Header,
  MessageInput,
  ScreenLayout,
} from '@/components';
import { onSendGroupMessage } from '@/p2p';
import { useGlobalStore } from '@/services';
import {
  GroupsScreens,
  type GroupStackNavigationType,
  type GroupStackParamList,
} from '@/types';
import { mockAvatar, mockMessages } from '@/utils';

interface Props {
  route: RouteProp<GroupStackParamList, typeof GroupsScreens.GroupChatScreen>;
}

export const GroupChatScreen: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation<GroupStackNavigationType>();
  const { name: userName } = useGlobalStore((state) => state.user);
  const { topic, name } = route.params;

  function onCustomizeGroupPress() {
    navigation.navigate(GroupsScreens.ModifyGroupScreen, {
      name,
      topic,
    });
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <Header
          backButton
          title={name}
          right={
            <TouchableOpacity onPress={onCustomizeGroupPress}>
              <CustomIcon type="MCI" name="cog-outline" />
            </TouchableOpacity>
          }
        />
      ),
    });
  }, [topic, name]);

  function onSend(text: string) {
    onSendGroupMessage(topic, text);
  }

  return (
    <ScreenLayout>
      <FlatList
        data={mockMessages}
        keyExtractor={(item, i) => `${item.k}${i}`}
        renderItem={({ item }) => (
          <GroupMessageItem
            message={item.m}
            date={item.t}
            avatar={mockAvatar}
            name={item.n}
            userAddress={item.k}
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
