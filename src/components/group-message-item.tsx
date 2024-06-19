import { useEffect, useState } from 'react';

import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { getColorFromHash, prettyPrintDate } from '@/utils';

import {
  Avatar,
  CopyButton,
  CustomIcon,
  Reactions,
  TextButton,
  TextField,
} from './_elements';
import { ModalBottom, ModalCenter } from './_layout';
import { EmojiPicker } from './emoji-picker';

interface Props {
  message: string;
  avatar: string;
  date: Date;
  name: string;
  userAddress: string;
  reactions: string[];
}

export const GroupMessageItem: React.FC<Props> = ({
  message,
  avatar,
  date,
  name,
  userAddress,
  reactions,
}) => {
  const { t } = useTranslation();
  const [actionsModal, setActionsModal] = useState(false);
  const [userModal, setUserVisible] = useState(false);
  const [actions, setActions] = useState(true);

  const dateString = prettyPrintDate(date);
  const color = getColorFromHash(userAddress);

  function handleLongPress() {
    setActionsModal(true);
  }

  function onCloseActionsModal() {
    setActionsModal(false);
  }

  function onBlockUser() {
    console.log('onBlockUser press');
  }

  function hideActions() {
    setActions(false);
  }

  function onReaction(emoji: string) {
    console.log('onReaction press', emoji);
  }

  function onPress() {
    setUserVisible(true);
  }

  function onCloseUserModal() {
    setUserVisible(false);
  }

  useEffect(() => {
    // Set actions visible onClose
    return () => {
      setActions(true);
    };
  }, []);

  return (
    <TouchableOpacity
      style={styles.container}
      onLongPress={handleLongPress}
      onPress={onPress}
      // onPressOut={}
    >
      <ModalBottom visible={actionsModal} closeModal={onCloseActionsModal}>
        <EmojiPicker hideActions={hideActions} emojiPressed={onReaction} />
        {actions && (
          <View>
            <TextButton
              small
              type="secondary"
              onPress={onBlockUser}
              icon={<CustomIcon name="reply" type="FA5" size={16} />}>
              {t('reply')}
            </TextButton>
            <CopyButton
              small
              type="secondary"
              data={message}
              text={t('copyText')}
            />
            <TextButton
              small
              type="secondary"
              onPress={onBlockUser}
              icon={<CustomIcon name="block-helper" type="MCI" size={16} />}>
              {t('blockUser')}
            </TextButton>
          </View>
        )}
      </ModalBottom>

      <ModalCenter visible={userModal} closeModal={onCloseUserModal}>
        <Avatar base64={avatar} size={100} />
        <TextField style={{ marginTop: 20 }} size="large">
          {name}
        </TextField>
      </ModalCenter>

      <View style={styles.avatar}>
        <Avatar base64={avatar} size={24} />
      </View>
      <View style={styles.left}>
        <View style={styles.info}>
          <TextField bold size="xsmall" style={{ color }}>
            {name}
          </TextField>
          <TextField type="muted" size="xsmall" style={styles.date}>
            {dateString}
          </TextField>
        </View>
        <TextField size="small" style={styles.message}>
          {message}
        </TextField>
        <Reactions items={reactions} />
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
    marginBottom: 8,
    paddingRight: 10,
  },
});
