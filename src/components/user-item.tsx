import { useState } from 'react';

import { StyleSheet, TouchableOpacity } from 'react-native';

import { User } from '@/types';

import { Avatar, TextField } from './_elements';

type Props = User;

export const UserItem: React.FC<Props> = ({ name, avatar }) => {
  const [pressed, setPressed] = useState(false);

  function onPress() {
    setPressed(!pressed);
  }

  return (
    <TouchableOpacity style={styles.onlineUser} onPress={onPress}>
      <Avatar size={36} base64={avatar} />
      <TextField size="xsmall" maxLength={15}>
        {name}
      </TextField>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  onlineUser: {
    // alignItems: 'center',
    flexDirection: 'row',
    margin: 1,
    marginBottom: 4,
    width: 100,
  },
});
