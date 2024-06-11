import { useLayoutEffect } from 'react';

import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
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
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  flatListContent: {
    paddingBottom: 80,
  },
  inputWrapper: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
});
