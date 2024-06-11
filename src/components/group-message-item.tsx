import { useState } from 'react';

import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { useGlobalStore } from '@/services';
import { type MessagesStackNavigationType } from '@/types';
import { getColorFromHash, prettyPrintDate } from '@/utils';

import { Avatar, TextField } from './_elements';

interface Props {
  message: string;
  avatar: string;
  date: Date;
  name: string;
  userAddress: string;
}

export const GroupMessageItem: React.FC<Props> = ({
  message,
  avatar,
  date,
  name,
  userAddress,
}) => {
  const navigation = useNavigation<MessagesStackNavigationType>();
  const [isPressed, setIsPressed] = useState(false);
  const theme = useGlobalStore((state) => state.theme);
  const dateString = prettyPrintDate(date);
  const color = getColorFromHash(userAddress);

  function handleLongPress() {
    setIsPressed(true);
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onLongPress={handleLongPress}
      onPressOut={() => setIsPressed(false)}>
      <View style={styles.avatar}>
        <Avatar base64={avatar} size={24} />
      </View>
      <View style={styles.left}>
        <View style={styles.info}>
          <TextField bold size="small" style={{ color }}>
            {name}
          </TextField>
          <TextField size="xsmall" style={styles.date}>
            {dateString}
          </TextField>
        </View>
        <TextField size="small" style={styles.message}>
          {message}
        </TextField>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  avatar: { marginRight: 10 },
  container: {
    flexDirection: 'row',
    marginRight: 8,
    marginVertical: 8,
  },
  date: {
    marginLeft: 10,
  },
  info: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  left: {},
  message: {
    flexShrink: 1,
    paddingRight: 10,
  },
});
