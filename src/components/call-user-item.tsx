import { useMemo, useState } from 'react';

import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { nameMaxLength } from '@/config';
import type { User } from '@/types';
import { getAvatar } from '@/utils';

import { Avatar, TextField } from './_elements';
import { ModalCenter } from './_layout';
import { useGlobalStore, useThemeStore, WebRTC } from '@/services';

import {
  MediaStream,
  RTCView
} from 'react-native-webrtc';
import { FullScreenVideoViewer } from './full-screen-video';

type Props = User;

export const CallUserItem: React.FC<Props> = ({ name, address, online = true, avatar = undefined, talking = false, video = false }) => {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);

  const theme = useThemeStore((state) => state.theme);
  const backgroundColor = theme.background;
  const borderColor = theme.border;
  const color = theme.foreground;
  const card = theme.card;
  const myUserAddress = useGlobalStore((state) => state.address);

  const talkingUsers = useGlobalStore(state => state.currentCall.talkingUsers);

  const w = Dimensions.get('window').width;
  const width = w / 2;
  if (!avatar) avatar = useMemo(() => getAvatar(address ?? ''), [address]);

  function onPress() {
    setModalVisible(true);
  }

  function onClose() {
    setModalVisible(false);
  }

  const stream = useMemo(() => {
    if (!video) return null;

    if (address === myUserAddress) {

      const localVideo = WebRTC.localMediaStream.getVideoTracks()[0];

      const videoStream = new MediaStream();
      videoStream.addTrack(localVideo);

      return videoStream;

    }

    const connection = WebRTC.active(address);
    if (!connection || !connection.peerConnection) return null;

    const videoTracks = connection.peerConnection.getReceivers()
    .map(receiver => receiver.track)
    .filter(track => track && track.kind === 'video');

    if (videoTracks.length > 0) {
      const videoStream = new MediaStream();
      videoTracks.forEach(track => videoStream.addTrack(track));
      return videoStream;
    }

    return null;
  }, [video, address]);


  return (
    <TouchableOpacity style={[styles.onlineUser, { borderRadius: 5, borderWidth: 2, backgroundColor: card, width, opacity: online === false ? 0.3 : 1, borderColor: talkingUsers[address] ? 'green' : borderColor  }]} onPress={onPress}>
      {!stream && !video &&
      <ModalCenter visible={modalVisible} closeModal={onClose}>
        <View style={styles.modalInner}>
          <Avatar size={200} base64={avatar} />
          <TextField style={{ marginVertical: 12 }}>{name}</TextField>
        </View>
      </ModalCenter>
      }
      {stream && video && 
      <>
        {modalVisible &&
        <FullScreenVideoViewer onClose={onClose} stream={stream} />
        }
        {!modalVisible &&
          <RTCView
          streamURL={stream.toURL()}
          style={styles.video}
          mirror={false}
          />
        }
      </>
      }
      <View style={styles.userInfo}>
      <Avatar size={28} base64={avatar} />
      <TextField size="xsmall" maxLength={nameMaxLength} style={styles.name}>
        {name}
      </TextField>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  video: {
    flex: 1
  },
  modalInner: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12
  },
  name: { marginLeft: 6, flexShrink: 1, },
  onlineUser: {
    flexDirection: 'row',
    margin: 1,
    marginBottom: 4,
    aspectRatio: 1,
    position: 'relative',
    flex: 1
  },
  userInfo: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    width: '100%',
    alignItems: 'center'
  }
});
