import { useState } from 'react';

import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { useGlobalStore } from '@/services';
import {
  Message,
  MessagesScreens,
  type MessagesStackNavigationType,
} from '@/types';
import { prettyPrintDateFromLocale } from '@/utils';

import { Avatar, Card, TextField } from './_elements';

interface Props extends Message {
  inverted: boolean;
}

export const MessageItem: React.FC<Props> = ({
  text,
  user,
  timestamp,
  inverted,
}) => {
  const navigation = useNavigation<MessagesStackNavigationType>();
  const [isPressed, setIsPressed] = useState(false);
  const theme = useGlobalStore((state) => state.theme);
  const date = prettyPrintDateFromLocale(timestamp);

  function handleLongPress() {
    setIsPressed(true);
    navigation.navigate(MessagesScreens.MessageScreen, { user });
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !inverted ? styles.container : styles.invertedContainer,
        {
          backgroundColor: isPressed ? theme.backgroundAccent : 'transparent',
        },
      ]}
      onLongPress={handleLongPress}
      onPressOut={() => setIsPressed(false)}>
      {!inverted && (
        <>
          <View style={styles.user}>
            <Avatar hash={user.key} size={40} />
            <TextField size="small" style={styles.date}>
              {date}
            </TextField>
          </View>
          <View style={styles.card}>
            <Card>
              <TextField size="small">{text}</TextField>
            </Card>
          </View>
        </>
      )}
      {inverted && (
        <View>
          <TextField size="small" style={styles.date}>
            {date}
          </TextField>
          <View style={styles.invertedCard}>
            <Card>
              <TextField size="small">{text}</TextField>
            </Card>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    paddingRight: 30,
  },
  container: {
    marginLeft: 4,
    marginVertical: 4,
  },
  date: {
    alignSelf: 'flex-end',
    marginBottom: 6,
  },
  invertedCard: {
    alignSelf: 'flex-end',
  },
  invertedContainer: {
    alignItems: 'flex-end',
    paddingLeft: 30,
  },
  user: {
    flexDirection: 'row',
  },
});
