import { useEffect, useMemo, useRef, useState } from 'react';

import { Image, Pressable, StyleSheet, View } from 'react-native';

import { TouchableOpacity } from '@/components';

import { useTranslation } from 'react-i18next';

import { useGlobalStore, useThemeStore } from '@/services';
import { MainStackNavigationType, Message, TipType } from '@/types';
import { containsOnlyEmojis, getAvatar, getColorFromHash, prettyPrintDate } from '@/utils';

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

import { getColors } from 'react-native-image-colors'
import { useNavigation } from '@react-navigation/native';
import { MainScreens } from '@/config';
import { extractHuginLinkAndClean, lightenHexColor } from '@/services/utils/tools';
import { GroupInvite } from './group-invite';

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

export const FeedMessageItem: React.FC<Props> = ({
  message,
  replies,
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
  hash,
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
  const ref = useRef<IWaveformRef>(null);
  const [playerState, setPlayerState] = useState(PlayerState.stopped);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation<MainStackNavigationType>();

  const borderColor = theme.border;
  const card = theme.card;

  const [userColor, setUserColor] = useState(theme.card);

  const avatar = useMemo(() => getAvatar(userAddress ?? ''), [userAddress]);


  const dateString = prettyPrintDate(timestamp ?? 0); // TODO Not sure this will ever be undefined, add ! if not.
  const color = getColorFromHash(userAddress);
  let name = nickname ?? 'Anon';
  name = name.substring(0,10) + (name.length > 10 ? '...' : '');

  const { link: huginLink, cleanedMessage } = extractHuginLinkAndClean(message);

  if (replies?.length) {

    for (const reply of replies) {
      if (containsOnlyEmojis(reply.message) && reply.message.length < 9) continue;
      reactions.push('💬');
    }

  }


  useEffect(() => {

    async function getUserColor() {

      const thisUserColor = await getColors('data:image/png;base64,'+avatar, {
        fallback: '#228B22',
        cache: true,
        key: avatar,
      });

      const useColor = thisUserColor?.background || thisUserColor?.dominant;

      setUserColor(lightenHexColor(useColor, 60));
      
    }

    getUserColor();



    }, [avatar]);

  // Parse the message to see if it's JSON with a "path" property
  const imageDetails = useMemo(() => {
    try {
      let isImageMessage: boolean = false;
      let imagePath = '';

      if (file?.path && file?.image && file?.type == 'image') {
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
      if (parsedMessage?.path && parsedMessage?.image && file?.type == 'image') {
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

      if (file?.path && file?.type == 'audio') {
        isAudioMessage = true;
        audioPath = 'file://' + file.path;
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

  function handlePress() {
      navigation.push(MainScreens.MessageDetailsScreen, {
        hash
      });
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
    <TouchableOpacity style={[styles.container, {borderColor}]} onLongPress={handleLongPress} onPress={handlePress}>
      <ModalBottom visible={actionsModal} closeModal={onCloseActionsModal}>
        <EmojiPicker hideActions={hideActions} emojiPressed={onReaction} />
        {actions && (
          <View>
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
            <TextButton
              small
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
          <View style={[styles.avatar]}>
            {userAddress.length > 15 && (
              <Avatar address={userAddress} size={36} />
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
            {imageDetails?.isImageMessage && (
              <TouchableOpacity onPress={handleImagePress}>
                <Image
                  style={[{aspectRatio: imageAspectRatio}, styles.image]}
                  source={{ uri: imageDetails?.imagePath }}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}
            {!isLoading && audioDetails?.isAudioMessage && (
              <View style={styles.waveFormWrapper}>
                <Pressable
                  onPress={handlePlayPauseAction}
                  style={styles.playBackControlPressable}>
                    {playerState !== PlayerState.playing
                          ? <CustomIcon
                          type="FI"
                          name="play"
                          color={color}
                          size={20}
                        />
                          : <CustomIcon
                          type="FI"
                          name="pause"
                          color={color}
                          size={20}
                        />}
                          
                </Pressable>
              <Waveform
              containerStyle={styles.staticWaveformView}
              mode="static"
              key={audioDetails?.audioPath}
              playbackSpeed={1}
              ref={ref}
              path={audioDetails?.audioPath}
              candleSpace={2}
              candleWidth={4}
              scrubColor={'#fff'}
              waveColor={color}
              candleHeightScale={4}
              onPlayerStateChange={setPlayerState}
              onChangeWaveformLoadState={state => {
                // setIsLoading(state);
              }}
              onError={error => {
                console.log('Error in static player:', error);
              }}
              onCurrentProgressChange={(_currentProgress, _songDuration) => {
                // console.log(
                //     `currentProgress ${_currentProgress}, songDuration ${_songDuration}`
                //   );
                  // if (_currentProgress === _songDuration) ref.current?.stopPlayer();
                }}
                />
                
                </View>
            )}
            {!audioDetails?.isAudioMessage && !imageDetails?.isImageMessage && (
            <TextField size="small" style={styles.message}>
                {cleanedMessage.replace(/(\r\n|\r|\n){2,}/g, '$1\n') ?? ''}
              </TextField>
            )}
            {huginLink && <GroupInvite invite={huginLink} />}
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
  avatar: { 
    marginRight: 10,
    // padding: 10,
    height: 32,
    width: 32,
    borderRadius: 16,
    alignItems: 'center', // Centers horizontally
    justifyContent: 'center', // Centers vertically
   },
  container: {
    flexDirection: 'row',
    marginRight: 8,
    marginVertical: 8,
    borderRadius: 25,
    padding: 20,
    flex: 1,
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
  staticWaveformView: {
    flex: 1,
  }
});
