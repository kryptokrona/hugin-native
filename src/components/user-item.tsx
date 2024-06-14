import { useState } from 'react';

import { Dimensions, StyleSheet, TouchableOpacity } from 'react-native';

import { nameMaxLength } from '@/config';
import { User } from '@/types';

import { Avatar, TextField } from './_elements';

type Props = User;

export const UserItem: React.FC<Props> = ({ name, avatar }) => {
  const [pressed, setPressed] = useState(false);
  const w = Dimensions.get('window').width;
  const width = w / 2;

  function onPress() {
    setPressed(!pressed);
  }

  return (
    <TouchableOpacity style={[styles.onlineUser, { width }]} onPress={onPress}>
      <Avatar size={28} base64={avatar} />
      <TextField size="xsmall" maxLength={nameMaxLength} style={styles.name}>
        {name}
      </TextField>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  name: { marginLeft: 6 },
  onlineUser: {
    flexDirection: 'row',
    margin: 1,
    marginBottom: 4,
  },
});
