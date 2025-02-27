import { useEffect, useMemo, useState } from 'react';

import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { useGlobalStore, useThemeStore } from '@/services';
import { Message, TipType } from '@/types';
import { getAvatar, getColorFromHash, prettyPrintDate } from '@/utils';

import {
  Avatar,
  CopyButton,
  CustomIcon,
  Reactions,
  TextButton,
  TextField,
  Tip,
} from './_elements';
import { ModalBottom } from './_layout';
import { EmojiPicker } from './emoji-picker';

interface Props extends Partial<Message> {
  userAddress: string;
  reactions: string[];
  replyHash?: string;
  onReplyToMessagePress: (val: string) => void;
  onEmojiReactionPress: (val: string, val2: string) => void;
  onShowImagePress: (path: string | undefined) => void;
  onTipPress: (address: string) => void;
  dm?: boolean;
}

export const GroupMessageItem: React.FC<Props> = ({
  message,
  timestamp,
  nickname,
  userAddress,
  reactions,
  replyHash,
  file,
  onReplyToMessagePress,
  onEmojiReactionPress,
  onShowImagePress,
  onTipPress,
  replyto,
  tip,
  dm = false,
}) => {
  try {
    tip = JSON.parse(tip);
  } catch {}
  const { t } = useTranslation();
  const myUserAddress = useGlobalStore((state) => state.address);
  const theme = useThemeStore((state) => state.theme);
  const [actionsModal, setActionsModal] = useState(false);
  const [actions, setActions] = useState(true);

  const dateString = prettyPrintDate(timestamp ?? 0); // TODO Not sure this will ever be undefined, add ! if not.
  const color = getColorFromHash(userAddress);
  const name = nickname ?? 'Anon';

  // Parse the message to see if it's JSON with a "path" property
  const imageDetails = useMemo(() => {
    try {
      let isImageMessage: boolean = false;
      let imagePath = '';

      if (file?.path && file?.image) {
        isImageMessage = true;
        imagePath = 'file://' + file.path;
      }

      return { imagePath, isImageMessage };
    } catch (e) {}
  }, [message]);

  const replyImageDetails = useMemo(() => {
    try {
      let isImageMessage: boolean = false;
      let imagePath = '';

      const parsedMessage = replyto?.[0].file;
      if (parsedMessage?.path && parsedMessage?.image) {
        isImageMessage = true;
        imagePath = 'file://' + parsedMessage.path;
      }

      return { imagePath, isImageMessage };
    } catch (e) {}
  }, [replyto]);

  function handleLongPress() {
    if (dm) {
      return false;
    }
    setActionsModal(true);
  }

  function onCloseActionsModal() {
    setActionsModal(false);
  }

  function onTipUser() {
    onTipPress(userAddress);
    setActionsModal(false);
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

  function onDmUser() {
    setActionsModal(false);
    //TODO: DM USER
    // navigation.navigate(MainScreens.MessageScreen, { roomKey, name });
  }

  function onPressReaction(emoji: string) {
    onReaction(emoji!);
  }

  function onPressCopyText() {
    setActionsModal(false);
  }

  function handleImagePress() {
    onShowImagePress(imageDetails?.imagePath);
  }

  useEffect(() => {
    return () => {
      setActions(true);
    };
  }, []);

  const [imageAspectRatio, setImageAspectRatio] = useState(1);


  useEffect(() => {
    if (imageDetails?.imagePath) {
      Image.getSize(imageDetails.imagePath, (width, height) => {
        setImageAspectRatio(width / height);
      });
    }
  }, [imageDetails?.imagePath]);

  return (
    <TouchableOpacity style={styles.container} onLongPress={handleLongPress}>
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
              onPress={onPressCopyText}
            />
            {/* //TODO DM USER */}
            {/* <TextButton
              small
              type="secondary"
              onPress={onDmUser}
              icon={
                <CustomIcon name="comment-text-outline" type="MCI" size={16} />
              }>
              {t('messageUser')}
            </TextButton> */}
            <TextButton
              small
              type="secondary"
              onPress={onTipUser}
              icon={<CustomIcon name="attach-money" type="MI" size={16} />}>
              {t('tipUser')}
            </TextButton>
          </View>
        )}
      </ModalBottom>
      {/* REPLY STUFF */}
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
                resizeMode="contain"
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
            {userAddress.length > 15 && (
              <Avatar base64={getAvatar(userAddress)} size={24} />
            )}
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
              <TouchableOpacity onPress={handleImagePress}>
                <Image
                  style={[{aspectRatio: imageAspectRatio}, styles.image]}
                  source={{ uri: imageDetails?.imagePath }}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ) : (
              <TextField size="small" style={styles.message}>
                {message ?? ''}
              </TextField>
            )}
            {tip && (
              <View>
                <Tip tip={tip as unknown as TipType} />
              </View>
            )}
            <Reactions items={reactions} onReact={onPressReaction} />
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
    overflow: 'visible',
    width: '100%',
  },
  date: {
    marginLeft: 10,
  },
  image: {
    borderRadius: 10,
    height: 'auto',
    marginVertical: 8,
    width: '92%',
  },
  info: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  message: {
    flexShrink: 1,
    marginBottom: 8,
    marginRight: 8,
    paddingRight: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    overflow: 'visible',
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
