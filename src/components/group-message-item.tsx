import { useEffect, useMemo, useRef, useState } from 'react';

import { ActivityIndicator, Image, Platform, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { useGlobalStore, useThemeStore } from '@/services';
import { Message, MessageStatus, TipType } from '@/types';
import { getAvatar, getColorFromHash, prettyPrintDate } from '@/utils';

import {
  FinishMode,
  IWaveformRef,
  PermissionStatus,
  PlaybackSpeedType,
  PlayerState,
  RecorderState,
  UpdateFrequency,
  Waveform,
  useAudioPermission,
  useAudioPlayer,
} from '@simform_solutions/react-native-audio-waveform';

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
import { GroupInvite } from '.';
import { extractHuginLinkAndClean } from '@/services/utils';
import { markMessageAsRead } from '@/services/bare/sqlite';
import Toast from 'react-native-toast-message';

interface Props extends Partial<Message> {
  userAddress: string;
  reactions: string[];
  replyHash?: string;
  onReplyToMessagePress: (val: string) => void;
  onEmojiReactionPress: (val: string, val2: string) => void;
  onShowImagePress: (path: string | undefined) => void;
  onTipPress: (address: string) => void;
  onPress?: () => void;
  dm?: boolean;
  status: MessageStatus;
  scrollToMessage: (hash: string) => void;
  onlyMessage?: boolean;
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
  onPress,
  replyto,
  tip,
  read,
  dm = false,
  status = 'success',
  onlyMessage = false,
  scrollToMessage = () => {}
}) => {
  try {
    tip = JSON.parse(tip);
  } catch {}
  const { t } = useTranslation();
  const myUserAddress = useGlobalStore((state) => state.address);
  const theme = useThemeStore((state) => state.theme);
  const [actionsModal, setActionsModal] = useState(false);
  const [actions, setActions] = useState(true);
  const ref = useRef<IWaveformRef>(null);
  const [playerState, setPlayerState] = useState(PlayerState.stopped);
  const [isLoading, setIsLoading] = useState(true);
  const lastPress = useRef<number>(0);
  const DOUBLE_PRESS_DELAY = 300;

  if(!read) {
    markMessageAsRead(replyHash, 'roomsmessages');
  }

  const handlePress = () => {
  const now = Date.now();

  if (now - lastPress.current < DOUBLE_PRESS_DELAY && status === 'success' && !dm) {
    onReaction('👍');
  }

  lastPress.current = now;
};


  const dateString = prettyPrintDate(timestamp ?? 0); // TODO Not sure this will ever be undefined, add ! if not.
  const color = getColorFromHash(userAddress);
  let name = nickname ?? 'Anon';
  name = name.substring(0,10) + (name.length > 10 ? '...' : '');

  // Parse the message to see if it's JSON with a "path" property
  const imageDetails = useMemo(() => {
    try {
      let isImageMessage: boolean = false;
      let imagePath = '';

      if (file?.path && file?.image && file?.type === 'image') {
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
      if (parsedMessage?.path && parsedMessage?.image && file?.type === 'image') {
        isImageMessage = true;
        imagePath = 'file://' + parsedMessage.path;
      }

      return { imagePath, isImageMessage };
    } catch (e) {}
  }, [replyto]);

  const audioDetails = useMemo(() => {
    try {
      let isAudioMessage: boolean = false;
      let audioPath = '';

      if (file?.path && file?.type === 'audio') {
        isAudioMessage = true;
        if (Platform.OS === 'android') {
          audioPath = file.path;
        } else audioPath = 'file://' + file.path;
      }
      // setIsLoading(false);
      return { audioPath, isAudioMessage };
    } catch (e) {}
  }, [message]);

  setTimeout(() => {setIsLoading(false)}, 100)

  const handlePlayPauseAction = async () => {

      if (ref.current?.currentState === PlayerState.paused) {
        await ref.current?.resumePlayer();
      } else if (ref.current?.currentState === PlayerState.playing) {
        await ref.current?.pausePlayer();
      } else if (ref.current?.currentState === PlayerState.stopped) {
        await ref.current?.startPlayer();
      }
    };

  function handleLongPress() {
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
    if (emoji === '👍') {
          Toast.show({
            text1: "Info",
            text2: t('thumbsUpInfo'),
            type: 'info'
          });
        }
    onEmojiReactionPress(emoji, replyHash!);
    setActionsModal(false);
  }

  function onReplyPess() {
    onReplyToMessagePress(replyHash!);
    setActionsModal(false);
  }

function handleReplyPress() {
  const replyToHash = replyto?.[0]?.hash;
  if (replyToHash) {
    scrollToMessage(replyToHash);
  }
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

const { link: huginLink, cleanedMessage } = extractHuginLinkAndClean(message);


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
    <TouchableOpacity
      onPress={handlePress}
      style={[
        styles.container,
        status === 'pending' && styles.pending,
        onlyMessage && { marginTop: -8, marginBottom: 2 }
      ]}
      onLongPress={handleLongPress}
    >
      <ModalBottom visible={actionsModal} closeModal={onCloseActionsModal}>
        {!dm && <EmojiPicker hideActions={hideActions} emojiPressed={onReaction} />}
        {actions && (
          <View>
            {!dm &&
            <TextButton
              small
              onPress={onReplyPess}
              icon={<CustomIcon name="reply" color={theme.primaryForeground} type="MI" size={16} />}>
              {t('reply')}
            </TextButton>
            }
            <CopyButton
              small
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
            {Platform.OS == 'android' && 
            <TextButton
              small
              onPress={onTipUser}
              icon={<CustomIcon color={theme.primaryForeground} name="attach-money" type="MI" size={16} />}>
              {t('tipUser')}
            </TextButton>
            }
          </View>
        )}
      </ModalBottom>
      {/* REPLY STUFF */}
      <View style={styles.content}>
        {replyto?.[0]?.nickname && (
          <TouchableOpacity onPress={handleReplyPress} style={styles.replyContainer}>
            <View style={styles.replyIcon}>
              <CustomIcon
                type="FI"
                name="corner-left-down"
                color={theme.mutedForeground}
                size={16}
              />
            </View>
            <TextField style={{ marginRight: 10 }} size="xsmall" type="muted">
              {replyto[0].nickname.substring(0,10) + (replyto[0].nickname.length > 10 ? '...' : '')}
            </TextField>
            {replyImageDetails?.isImageMessage ? (
              <Image
                style={styles.replyImage}
                source={{ uri: replyImageDetails?.imagePath }}
                resizeMode="contain"
              />
            ) : (
              <TextField maxLength={35} size="xsmall" style={styles.replyMessage}>
                {replyto?.[0]?.message ?? ''}
              </TextField>
            )}
          </TouchableOpacity>
        )}

  {/* HEADER ROW */}
  {!onlyMessage && (
    <View style={styles.headerRow}>
      <Avatar base64={getAvatar(userAddress)} size={18} />
      <View style={styles.headerText}>
        <TextField bold size="xsmall" style={{ color }}>
          {name}
        </TextField>
        <TextField type="muted" size="xsmall">
          {dateString}
        </TextField>
      </View>
    </View>
  )}

  {/* MESSAGE ROW (FULL WIDTH) */}
  <View style={styles.bodyRow}>
    {imageDetails?.isImageMessage && (
      <TouchableOpacity onPress={handleImagePress}>
        <Image
          style={[{ aspectRatio: imageAspectRatio }, styles.image]}
          source={{ uri: imageDetails.imagePath }}
          resizeMode="cover"
        />
      </TouchableOpacity>
    )}

    {!isLoading && audioDetails?.isAudioMessage && (
      <View style={styles.waveFormWrapper}>
        {/* unchanged audio code */}
      </View>
    )}

    {!audioDetails?.isAudioMessage &&
      !imageDetails?.isImageMessage &&
      message && (
        <TextField size="small" style={styles.message}>
          {cleanedMessage}
        </TextField>
      )}

    {huginLink && <GroupInvite invite={huginLink} />}
    {tip && <Tip tip={tip as TipType} />}
    <Reactions items={reactions} onReact={onPressReaction} />
  </View>

      </View>
      {status == 'failed' &&
      <View>
        <TextField size='xsmall'>❌</TextField>
      </View>
      }
      {status == 'pending' &&
      <View>
        <ActivityIndicator size={'small'} /> 
      </View>
      }
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  waveFormWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignContent: 'center',
    justifyContent: 'center',
    verticalAlign: 'middle',
    alignItems: 'center',
    textAlignVertical: 'center',
    gap: 10,
    width: '100%',
  alignSelf: 'stretch',
  },
  avatar: { marginRight: 10 },
  container: {
    flexDirection: 'row',
    marginRight: 8,
    // marginVertical: 8,
    marginTop: 8
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
  },
  messageContainer: {
    flexDirection: 'row',
    overflow: 'visible',
    flex: 1,
    maxWidth: '98%'
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
  staticWaveformView: {
    flex: 1,
  },
  pending: {
    opacity: 0.4
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 10,
  },

  headerText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  bodyRow: {
    width: '100%',
  },

});
