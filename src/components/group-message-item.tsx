import { useEffect, useMemo, useState } from 'react';

import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { Message } from 'types/p2p';

import { useGlobalStore } from '@/services';
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

interface Props extends Partial<Message> {
  avatar: string;
  userAddress: string;
  reactions: string[];
  replyHash?: string;
  onReplyToMessagePress: (val: string) => void;
  onEmojiReactionPress: (val: string, val2: string) => void;
}

export const GroupMessageItem: React.FC<Props> = ({
  message,
  avatar,
  timestamp,
  nickname,
  userAddress,
  reactions,
  replyHash,
  onReplyToMessagePress,
  onEmojiReactionPress,
  replyto,
}) => {
  const { t } = useTranslation();
  const theme = useGlobalStore((state) => state.theme);
  const [actionsModal, setActionsModal] = useState(false);
  const [userModal, setUserVisible] = useState(false);
  const [actions, setActions] = useState(true);

  const dateString = prettyPrintDate(timestamp ?? 0); // TODO Not sure this will ever be undefined, add ! if not.
  const color = getColorFromHash(userAddress);
  const name = nickname ?? 'Anon';

  // Parse the message to see if it's JSON with a "path" property
  const imageDetails = useMemo(() => {
    try {
      let isImageMessage: boolean = false;
      let imagePath = '';

      const parsedMessage = JSON.parse(message ?? '');
      if (parsedMessage?.path) {
        isImageMessage = true;
        imagePath = 'file://' + parsedMessage.path;
      }

      return { imagePath, isImageMessage };
    } catch (e) {}
  }, [message]);

  const replyImageDetails = useMemo(() => {
    try {
      let isImageMessage: boolean = false;
      let imagePath = '';

      const parsedMessage = JSON.parse(replyto?.[0].message ?? '');
      if (parsedMessage?.path) {
        isImageMessage = true;
        imagePath = 'file://' + parsedMessage.path;
      }

      return { imagePath, isImageMessage };
    } catch (e) {}
  }, [replyto]);

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
    onEmojiReactionPress(emoji, replyHash!);
    setActionsModal(false);
  }

  function onReplyPess() {
    onReplyToMessagePress(replyHash!);
    setActionsModal(false);
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
              onPress={onReplyPess}
              icon={<CustomIcon name="reply" type="FA5" size={16} />}>
              {t('reply')}
            </TextButton>
            <CopyButton
              small
              type="secondary"
              data={message ?? ''}
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
      <View style={styles.content}>
        {replyto?.[0]?.nickname && (
          <View style={styles.replyContainer}>
            <View style={styles.replyIcon}>
              <CustomIcon
                type="FI"
                name="corner-left-down"
                color={theme.mutedForeground}
                size={16}
              />
            </View>
            <TextField style={{ marginRight: 10 }} size="xsmall" type="muted">
              {replyto[0].nickname}
            </TextField>
            {replyImageDetails?.isImageMessage ? (
              <Image
                style={styles.replyImage}
                source={{ uri: replyImageDetails?.imagePath }}
                resizeMode="cover"
              />
            ) : (
              <TextField size="xsmall" style={styles.replyMessage}>
                {replyto?.[0]?.message ?? ''}
              </TextField>
            )}
          </View>
        )}

        <View style={styles.messageContainer}>
          <View style={styles.avatar}>
            <Avatar base64={avatar} size={24} />
          </View>
          <View>
            <View style={styles.info}>
              <TextField bold size="xsmall" style={{ color }}>
                {name}
              </TextField>
              <TextField type="muted" size="xsmall" style={styles.date}>
                {dateString}
              </TextField>
            </View>
            {imageDetails?.isImageMessage ? (
              <Image
                style={styles.image}
                source={{ uri: imageDetails?.imagePath }}
                resizeMode="cover"
              />
            ) : (
              <TextField size="small" style={styles.message}>
                {message ?? ''}
              </TextField>
            )}
            <Reactions items={reactions} />
          </View>
        </View>
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
  content: {
    flex: 1,
    flexDirection: 'column',
  },
  date: {
    marginLeft: 10,
  },
  image: {
    borderRadius: 10,
    height: 200,
    marginVertical: 8,
    width: 200,
  },
  info: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  message: {
    flexShrink: 1,
    marginBottom: 8,
    paddingRight: 10,
  },
  messageContainer: {
    flexDirection: 'row',
  },

  replyContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  replyIcon: {
    marginHorizontal: 5,
    paddingTop: 10,
  },
  replyImage: {
    borderRadius: 10,
    height: 30,
    marginBottom: 8,
    marginRight: 10,
    width: 30,
  },
  replyMessage: {
    flexShrink: 1,
    paddingRight: 10,
  },
});
