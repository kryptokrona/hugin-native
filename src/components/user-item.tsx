import { useMemo, useState } from 'react';

import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { nameMaxLength } from '@/config';
import type { User } from '@/types';
import { getAvatar } from '@/utils';

import { Avatar, TextField } from './_elements';
import { ModalCenter } from './_layout';

type Props = User;

export const UserItem: React.FC<Props> = ({ name, address, online = true, avatar = undefined }) => {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const w = Dimensions.get('window').width;
  const width = w / 2;
  if (!avatar) avatar = useMemo(() => getAvatar(address ?? ''), [address]);

  function onPress() {
    setModalVisible(true);
  }

  function onClose() {
    setModalVisible(false);
  }

  function onPressDm() {
    onClose();
    // navigation.navigate(MainScreens.MessageScreen, { roomKey, name });
  }

  return (
    <TouchableOpacity style={[styles.onlineUser, { width, opacity: online === false ? 0.3 : 1 }]} onPress={onPress}>
      <ModalCenter visible={modalVisible} closeModal={onClose}>
        <View style={styles.modalInner}>
          <Avatar size={200} base64={avatar} />
          <TextField style={{ marginVertical: 12 }}>{name}</TextField>
          {/* <TextButton type="secondary" onPress={onPressDm}>
            {t('messageUser')}
          </TextButton> */}
        </View>
      </ModalCenter>
      <Avatar size={28} base64={avatar} />
      <TextField size="xsmall" maxLength={nameMaxLength} style={styles.name}>
        {name}
      </TextField>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  modalInner: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  name: { marginLeft: 6 },
  onlineUser: {
    flexDirection: 'row',
    margin: 1,
    marginBottom: 4,
  },
});
