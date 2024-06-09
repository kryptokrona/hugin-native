import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import { RouteProp } from '@react-navigation/native';

import { MessageInput, ScreenLayout } from '@/components';
import type { GroupsScreens, GroupStackParamList } from '@/types';

interface Props {
  route: RouteProp<GroupStackParamList, typeof GroupsScreens.GroupChatScreen>;
}

export const GroupChatScreen: React.FC<Props> = ({ route }) => {
  function onSend(text: string) {
    console.log({ text });
  }

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
