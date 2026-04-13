import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { useTranslation } from 'react-i18next';

import { useGlobalStore, useThemeStore } from '@/services';
import { Message, MessageStatus, TipType } from '@/types';
import { Rooms } from '../lib/native';
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
import { GroupInvite, VideoPlayer } from '.';
import { extractHuginLinkAndClean } from '../services/utils';
import { markMessageAsRead } from '../services/bare/sqlite';
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
  status?: MessageStatus;
  scrollToMessage?: (hash: string) => void;
  onlyMessage?: boolean;
  isLastInCluster?: boolean;
  onRetryPress?: (hash: string) => void;
}

const MessageItemInner: React.FC<Props> = ({
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
  scrollToMessage = () => {},
  isLastInCluster = false,
  onRetryPress,
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
  const [isLoading, setIsLoading] = useState(false);
  const [waveformError, setWaveformError] = useState(false);
  const lastPress = useRef<number>(0);
  const DOUBLE_PRESS_DELAY = 300;

  if (!read) {
    markMessageAsRead(replyHash, 'roomsmessages');
  }

  const handlePress = () => {
    const now = Date.now();

    if (status === 'failed' && onRetryPress) {
      if (replyHash) {
        onRetryPress(replyHash);
      }
      return;
    }

    if (
      now - lastPress.current < DOUBLE_PRESS_DELAY &&
      status !== 'failed' &&
      !dm
    ) {
      onReaction('👍', false);
    }

    lastPress.current = now;
  };

  const dateString = prettyPrintDate(timestamp ?? 0); // TODO Not sure this will ever be undefined, add ! if not.
  const color = getColorFromHash(userAddress);
  let name = nickname ?? 'Anon';
  name = name.substring(0, 10) + (name.length > 10 ? '...' : '');

  // Parse the message to see if it's JSON with a "path" property
  const imageDetails = useMemo(() => {
    try {
      let isImageMessage: boolean = false;
      let imagePath = '';

      if (file?.path && file?.image && file?.type === 'image') {
        isImageMessage = true;
        imagePath = 'file://' + file.path;
        console.log('file path image', file.path);
      }

      return { imagePath, isImageMessage };
    } catch (e) {}
  }, [file]);

  const replyImageDetails = useMemo(() => {
    try {
      let isImageMessage: boolean = false;
      let imagePath = '';

      const parsedMessage = replyto?.[0].file;
      if (
        parsedMessage?.path &&
        parsedMessage?.image &&
        file?.type === 'image'
      ) {
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
        audioPath = file.path;
        console.log('file', file);
        console.log('Audio path', file.path);
      }
      return { audioPath, isAudioMessage };
    } catch (e) {}
  }, [file]);

  const videoDetails = useMemo(() => {
    if (file?.path && file?.type === 'video') {
      return { isVideoMessage: true, videoPath: file.path };
    }
    return { isVideoMessage: false, videoPath: '' };
  }, [file]);

  const pendingRemoteFile = useGlobalStore((state) => {
    const list = dm ? state.remoteDmFiles : state.remoteRoomFiles;
    return list.find(
      (f) =>
        f.hash === replyHash ||
        (!!message &&
          f.fileName === message &&
          Number(f.time) === Number(timestamp)),
    );
  });
  const fileDl = useGlobalStore((state) =>
    replyHash
      ? state.fileDownloads.find((d) => d.hash === replyHash)
      : undefined,
  );

  const isUndownloadedFile =
    !!file &&
    !file.path &&
    file.type === 'file' &&
    !imageDetails?.isImageMessage &&
    !audioDetails?.isAudioMessage &&
    !videoDetails.isVideoMessage;

  const [downloadStarted, setDownloadStarted] = useState(false);

  const handleDownload = () => {
    setDownloadStarted(true);
    if (pendingRemoteFile) Rooms.download(pendingRemoteFile);
  };

  const [visualProgress, setVisualProgress] = useState(0);

  useEffect(() => {
    if (file?.path) setDownloadStarted(false);
  }, [file?.path]);

  useEffect(() => {
    const active =
      (isUndownloadedFile && !pendingRemoteFile) ||
      (!!pendingRemoteFile &&
        !file?.path &&
        (downloadStarted || !!fileDl));
    if (!active) {
      setVisualProgress(0);
      return;
    }
    const id = setInterval(() => {
      setVisualProgress((p) => p + (95 - p) * 0.04);
    }, 200);
    return () => clearInterval(id);
  }, [
    isUndownloadedFile,
    pendingRemoteFile,
    fileDl?.hash,
    fileDl?.progress,
    file?.path,
    downloadStarted,
  ]);

  useEffect(() => {
    setWaveformError(false);
  }, [audioDetails?.audioPath]);

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

  function onReaction(emoji: string, showToast: boolean = true) {
    if (emoji === '👍' && showToast) {
      Toast.show({
        text1: 'Info',
        text2: t('thumbsUpInfo'),
        type: 'info',
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
        onlyMessage && { marginTop: -8, marginBottom: 2 },
      ]}
      onLongPress={handleLongPress}>
      <ModalBottom visible={actionsModal} closeModal={onCloseActionsModal}>
        {!dm && (
          <EmojiPicker hideActions={hideActions} emojiPressed={onReaction} />
        )}
        {actions && (
          <View>
            {!dm && (
              <TextButton
                small
                onPress={onReplyPess}
                icon={
                  <CustomIcon
                    name="reply"
                    color={theme.primaryForeground}
                    type="MI"
                    size={16}
                  />
                }>
                {t('reply')}
              </TextButton>
            )}
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
            {Platform.OS == 'android' && (
              <TextButton
                small
                onPress={onTipUser}
                icon={
                  <CustomIcon
                    color={theme.primaryForeground}
                    name="attach-money"
                    type="MI"
                    size={16}
                  />
                }>
                {t('tipUser')}
              </TextButton>
            )}
          </View>
        )}
      </ModalBottom>
      {/* REPLY STUFF */}
      <View style={styles.content}>
        {replyto?.[0]?.nickname && (
          <TouchableOpacity
            onPress={handleReplyPress}
            style={styles.replyContainer}>
            <View style={styles.replyIcon}>
              <CustomIcon
                type="FI"
                name="corner-left-down"
                color={theme.mutedForeground}
                size={16}
              />
            </View>
            <TextField style={{ marginRight: 10 }} size="xsmall" type="muted">
              {replyto[0].nickname.substring(0, 10) +
                (replyto[0].nickname.length > 10 ? '...' : '')}
            </TextField>
            {replyImageDetails?.isImageMessage ? (
              <Image
                style={styles.replyImage}
                source={{ uri: replyImageDetails?.imagePath }}
                resizeMode="contain"
              />
            ) : (
              <TextField
                maxLength={35}
                size="xsmall"
                style={styles.replyMessage}>
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

          {audioDetails?.isAudioMessage && audioDetails.audioPath && (
            <View style={styles.waveFormWrapper}>
              {isLoading && (
                <ActivityIndicator
                  size="small"
                  color={color}
                  style={styles.waveformSpinner}
                />
              )}
              {waveformError ? (
                <TextField size="xsmall" type="muted">
                  Audio unavailable
                </TextField>
              ) : (
                <>
                  <Pressable
                    onPress={handlePlayPauseAction}
                    style={{ padding: 4 }}>
                    {playerState !== PlayerState.playing ? (
                      <CustomIcon
                        type="FI"
                        name="play"
                        color={color}
                        size={20}
                      />
                    ) : (
                      <CustomIcon
                        type="FI"
                        name="pause"
                        color={color}
                        size={20}
                      />
                    )}
                  </Pressable>
                  <Waveform
                    containerStyle={styles.staticWaveformView}
                    mode="static"
                    key={audioDetails.audioPath}
                    playbackSpeed={1}
                    ref={ref}
                    path={audioDetails.audioPath}
                    candleSpace={2}
                    candleWidth={4}
                    scrubColor={'#fff'}
                    waveColor={color}
                    candleHeightScale={4}
                    onPlayerStateChange={setPlayerState}
                    onChangeWaveformLoadState={(loading) =>
                      setIsLoading(loading)
                    }
                    onError={(error) => {
                      console.log('Waveform error:', error);
                      setIsLoading(false);
                      setWaveformError(true);
                    }}
                    onCurrentProgressChange={(
                      _currentProgress,
                      _songDuration,
                    ) => {}}
                  />
                </>
              )}
            </View>
          )}

          {videoDetails.isVideoMessage && (
            <VideoPlayer path={videoDetails.videoPath} />
          )}

          {isUndownloadedFile && !pendingRemoteFile && (
            <View style={styles.filePendingBox}>
              <TextField size="xsmall" type="muted">
                {t('syncingFileFromPeers', 'Waiting for peer…')}
              </TextField>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(visualProgress, 95)}%` },
                  ]}
                />
              </View>
              <TextField size="xsmall">{file?.fileName || message}</TextField>
            </View>
          )}

          {!audioDetails?.isAudioMessage &&
            !imageDetails?.isImageMessage &&
            !videoDetails.isVideoMessage &&
            !pendingRemoteFile &&
            !isUndownloadedFile &&
            message && (
              <TextField
                size="small"
                style={styles.message}
                color={status === 'failed' ? '#ff4444' : undefined}>
                {cleanedMessage}
              </TextField>
            )}

          {pendingRemoteFile && !file?.path && (
            <>
              {downloadStarted || fileDl ? (
                <View style={styles.filePendingBox}>
                  <TextField size="xsmall" type="muted">
                    {t('downloading', 'Downloading…')}
                  </TextField>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.min(visualProgress, 95)}%` },
                      ]}
                    />
                  </View>
                  <TextField size="xsmall">
                    {pendingRemoteFile.fileName}
                  </TextField>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handleDownload}
                  style={styles.downloadButton}>
                  <CustomIcon
                    type="FI"
                    name="download"
                    color={theme.primaryForeground}
                    size={16}
                  />
                  <TextField size="xsmall" style={styles.downloadText}>
                    {pendingRemoteFile.fileName}
                  </TextField>
                </TouchableOpacity>
              )}
            </>
          )}

          {huginLink && <GroupInvite invite={huginLink} />}
          {tip && <Tip tip={tip as TipType} />}
          <Reactions items={reactions} onReact={onPressReaction} />
        </View>
      </View>
      {status === 'success' &&
        userAddress === myUserAddress &&
        isLastInCluster && (
          <View
            style={{
              justifyContent: 'flex-end',
              paddingBottom: 10,
              paddingLeft: 2,
            }}>
            <CustomIcon
              type="IO"
              name="checkmark"
              size={16}
              color={theme.mutedForeground}
            />
          </View>
        )}
    </TouchableOpacity>
  );
};

export const MessageItem = React.memo(MessageItemInner);

const styles = StyleSheet.create({
  waveformSpinner: {
    marginRight: 8,
  },
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
    marginTop: 8,
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
    maxWidth: '98%',
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
    opacity: 0.4,
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

  downloadButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.3)',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    marginRight: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  downloadText: {
    flexShrink: 1,
  },
  filePendingBox: {
    marginBottom: 8,
    marginRight: 8,
    maxWidth: '92%',
  },
  progressTrack: {
    backgroundColor: 'rgba(128,128,128,0.25)',
    borderRadius: 4,
    height: 5,
    marginVertical: 6,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    backgroundColor: '#4caf50',
    borderRadius: 4,
    height: '100%',
  },
});
