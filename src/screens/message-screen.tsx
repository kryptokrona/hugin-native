import { Avatar, MessageInput, ScreenLayout } from '@/components';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import type {
  Message,
  MessagesStackNavigationType,
  MessagesStackParamList,
} from '@/types';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { RouteProp, useNavigation } from '@react-navigation/native';

import { Header } from '../components/_navigation/header';
import { MessagesScreens } from '@/config';
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
          right={<Avatar base64={user.name} />}
        />
      ),
    });
  }, [user]);

  useEffect(() => {
    if (user) {
      setMessages(mockMessages);
    }
  }, [user]);

  const onSend = (text: string) => {
    console.log('Message sent:', text);
  };

  return (
    <ScreenLayout>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        {/* <FlatList
          data={messages}
          keyExtractor={(item) => item.timestamp.toString()}
          renderItem={({ item }) => (
            // TODO inverted: message from me
            <MessageItem inverted={false} {...item} />
          )}
          contentContainerStyle={styles.flatListContent}
        /> */}
        <View style={styles.inputWrapper}>
          <MessageInput onSend={onSend} />
        </View>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  // flatListContent: {
  //   paddingBottom: 80,
  // },
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
