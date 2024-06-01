import React, { useEffect, useLayoutEffect, useState } from 'react';

import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
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
import { mockMessages } from '@/utils';

interface Props {
  route: RouteProp<
    MessagesStackParamList,
    typeof MessagesScreens.MessageScreen
  >;
}

export const MessageScreen: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation<MessagesStackNavigationType>();
  const { user } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);

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
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
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
