import React, { useEffect, useLayoutEffect, useState } from 'react';

import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';

import { RouteProp, useNavigation } from '@react-navigation/native';

import {
  Avatar,
  Header,
  MessageInput,
  MessageItem,
  ScreenLayout,
} from '@/components';
import {
  Message,
  MessagesScreens,
  MessagesStackNavigationType,
  MessagesStackParamList,
} from '@/types';

interface Props {
  route: RouteProp<
    MessagesStackParamList,
    typeof MessagesScreens.MessageScreen
  >;
}

const mockMessages: Message[] = [
  {
    id: '1',
    text: 'Hello',
    timestamp: 1609459200,
    user: {
      id: '1',
      key: 'SEKReTXy5NuZNf9259RRXDR3PsM5r1iKe2sgkDV5QU743f4FspoVAnY4TfRPLBMpCA1HQgZVnmZafQTraoYsS9K41iePDjPZbme',
      name: 'Niljr',
    },
  },
  {
    id: '2',
    text: 'Hello this is a long message that should be truncated in the UI by some dots or something like that.',
    timestamp: 1609459200,
    user: {
      id: '2',
      key: 'SEKReTELXeQK5mCaEqTUwHRf9ZkCgf4fNAQ7GeNKse45LuxcuL77S6BKTRn34yCMgG4ZpLwgpjpCkE9Y9pj2JNJXQ3Hzo4ByzxX',
      name: 'Pofffff',
    },
  },
  {
    id: '3',
    text: 'Hello',
    timestamp: 1609459200,
    user: {
      id: '2',
      key: 'SEKReTELXeQK5mCaEqTUwHRf9ZkCgf4fNAQ7GeNKse45LuxcuL77S6BKTRn34yCMgG4ZpLwgpjpCkE9Y9pj2JNJXQ3Hzo4ByzxX',
      name: 'Pofffff',
    },
  },
  {
    id: '4',
    text: 'Hello this is a long message that should be truncated in the UI by some dots or something like that.',
    timestamp: 1609459200,
    user: {
      id: '1',
      key: 'SEKReTXy5NuZNf9259RRXDR3PsM5r1iKe2sgkDV5QU743f4FspoVAnY4TfRPLBMpCA1HQgZVnmZafQTraoYsS9K41iePDjPZbme',
      name: 'Niljr',
    },
  },
  {
    id: '5',
    text: 'Hello',
    timestamp: 1609459200,
    user: {
      id: '2',
      key: 'SEKReTELXeQK5mCaEqTUwHRf9ZkCgf4fNAQ7GeNKse45LuxcuL77S6BKTRn34yCMgG4ZpLwgpjpCkE9Y9pj2JNJXQ3Hzo4ByzxX',
      name: 'Pofffff',
    },
  },

  {
    id: '6',
    text: 'Hello',
    timestamp: 16094592004,
    user: {
      id: '2',
      key: 'SEKReTELXeQK5mCaEqTUwHRf9ZkCgf4fNAQ7GeNKse45LuxcuL77S6BKTRn34yCMgG4ZpLwgpjpCkE9Y9pj2JNJXQ3Hzo4ByzxX',
      name: 'Pofffff',
    },
  },
  {
    id: '7',
    text: 'Hello',
    timestamp: 1609459200,
    user: {
      id: '2',
      key: 'SEKReTELXeQK5mCaEqTUwHRf9ZkCgf4fNAQ7GeNKse45LuxcuL77S6BKTRn34yCMgG4ZpLwgpjpCkE9Y9pj2JNJXQ3Hzo4ByzxX',
      name: 'Pofffff',
    },
  },
  {
    id: '4',
    text: 'Hello this is a long message that should be truncated in the UI by some dots or something like that.',
    timestamp: 1609459200,
    user: {
      id: '1',
      key: 'SEKReTXy5NuZNf9259RRXDR3PsM5r1iKe2sgkDV5QU743f4FspoVAnY4TfRPLBMpCA1HQgZVnmZafQTraoYsS9K41iePDjPZbme',
      name: 'Niljr',
    },
  },
];

export const MessageScreen: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation<MessagesStackNavigationType>();
  const { user } = route.params;
  const [messages, setMessages] = useState<Message[]>(mockMessages);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <Header
          backButton
          title={user.name}
          right={<Avatar hash={user.key} />}
        />
      ),
    });
  }, [user.key]);

  useEffect(() => {
    if (user) {
      setMessages(mockMessages);
    }
  }, [user]);

  const onSend = (text: string) => {
    const newMessage = {
      id: String(messages.length + 1),
      text,
      timestamp: Date.now(),
      user,
    };
    setMessages([...messages, newMessage]);
  };

  return (
    <ScreenLayout>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <MessageItem inverted={item.user.id === user.id} {...item} />
            )}
            contentContainerStyle={styles.flatListContent}
          />
          <View style={styles.inputWrapper}>
            <MessageInput onSend={onSend} />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flatListContent: {
    paddingBottom: 80, // Adjust based on your input field height
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
