import { useLayoutEffect } from 'react';

import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { type RouteProp, useNavigation } from '@react-navigation/native';

import { CustomIcon, Header, MessageInput, ScreenLayout } from '@/components';
import { onSendGroupMessage } from '@/p2p';
import {
  GroupsScreens,
  type GroupStackNavigationType,
  type GroupStackParamList,
} from '@/types';

interface Props {
  route: RouteProp<GroupStackParamList, typeof GroupsScreens.GroupChatScreen>;
}

export const GroupChatScreen: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation<GroupStackNavigationType>();
  const { topic, name } = route.params;

  function onCustomizeGroupPress() {
    navigation.navigate(GroupsScreens.ModifyGroupScreen);
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
