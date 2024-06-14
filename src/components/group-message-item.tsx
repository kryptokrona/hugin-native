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
import { ModalBottom } from './_layout';
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
  const [modalVisible, setModalVisible] = useState(false);
  const [actions, setActions] = useState(true);

  const dateString = prettyPrintDate(date);
  const color = getColorFromHash(userAddress);

  function handleLongPress() {
    setModalVisible(true);
  }

  function onClose() {
    setModalVisible(false);
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
      // onPressOut={}
    >
      <ModalBottom visible={modalVisible} closeModal={onClose}>
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
