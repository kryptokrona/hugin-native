import { useEffect, useMemo, useState } from 'react';

import { ActivityIndicator, Dimensions, StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { nameMaxLength } from '@/config';
import type { User } from '@/types';
import { getAvatar } from '@/utils';

import { Avatar, TextField } from './_elements';
import { ModalCenter } from './_layout';
import { useGlobalStore, useThemeStore, WebRTC } from '@/services';
import { getColors } from 'react-native-image-colors'
import { TouchableOpacity } from '@/components';


import {
  MediaStream,
  RTCView
} from 'react-native-webrtc';
import { FullScreenVideoViewer } from './full-screen-video';
import { lightenHexColor } from '@/services/utils';

type Props = User;

export const CallUserItem: React.FC<User> = (props) => {

  const { address, name, avatar, video, talking, online } = props;


  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  
  const theme = useThemeStore((state) => state.theme);
  const backgroundColor = theme.background;
  const borderColor = theme.border;
  const color = theme.foreground;
  const card = theme.card;
  const [userColor, setUserColor] = useState(theme.card);
  let hadAvatar = true;
  const myUserAddress = useGlobalStore((state) => state.address);

  const talkingUsers = useGlobalStore(state => state.currentCall.talkingUsers);

  const w = Dimensions.get('window').width;
  const width = w / 2;

  useEffect(() => {

    async function getUserColor() {

      const thisUserColor = await getColors('data:image/png;base64,'+avatar, {
        fallback: '#228B22',
        cache: true,
        key: avatar,
      });
      let backgroundColor = thisUserColor?.background || thisUserColor?.dominant;
      if (!hadAvatar) {
        backgroundColor = lightenHexColor(backgroundColor, 60)

      }
      setUserColor(backgroundColor);
      
    }

    getUserColor();



    }, [avatar]);
    
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
    <TouchableOpacity style={[styles.onlineUser, { borderRadius: 25, borderWidth: 2, width, opacity: (props.connectionStatus !== 'connected' && myUserAddress !== address) ? 0.3 : 1, borderColor: talkingUsers[address] ? 'green' : 'transparent'  }]} onPress={onPress}>
      <View style={[{backgroundColor: video ? 'transparent' : userColor, borderWidth: 3, borderColor: backgroundColor, borderRadius: 22}, styles.onlineUser]}>
        {!stream && !video &&
        <ModalCenter visible={modalVisible} closeModal={onClose}>
          <View style={styles.modalInner}>
            <Avatar size={200} base64={avatar} />
            <View style={styles.userInfo}>
            <TextField style={{ marginVertical: 12 }}>{name}</TextField>
            {(props.connectionStatus !== 'connected' && myUserAddress !== address) && <ActivityIndicator size={'small'} />}
            {props?.muted &&
              <View><TextField size={"xsmall"}> 🔇</TextField></View>
            }
            </View>
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
        {video && stream ? (
        <View style={styles.inlineContainer}>
          <View style={styles.userInfo}>
          <Avatar size={24} base64={avatar} />
          <TextField size="xsmall" maxLength={nameMaxLength} style={styles.inlineName}>
            {name}
          </TextField>
            {props?.muted &&
              <View><TextField size={"xsmall"}> 🔇</TextField></View>
            }
          {(props.connectionStatus !== 'connected' && myUserAddress !== address) && <ActivityIndicator size={'small'} />}
          </View>
        </View>
      ) : (
        <>
          <View style={styles.avatar}>
            <Avatar size={48} base64={avatar} />
          </View>
          <View style={styles.userInfo}>
            <TextField size="xsmall" maxLength={nameMaxLength} style={styles.name}>
              {name}
            </TextField>
            {props?.muted &&
              <View><TextField size={"xsmall"}> 🔇</TextField></View>
            }
            {(props.connectionStatus !== 'connected' && myUserAddress !== address) && <ActivityIndicator size={'small'} />}
          </View>
        </>
      )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  video: {
    flex: 1,
    borderRadius: 22
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
    width: '100%',  
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  avatar: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -24 }, { translateY: -24 }],
  },
  avatarvideo: {
    position: 'absolute',
    left: 5,
    bottom: 5

  },
  inlineContainer: {
    flexDirection: 'row',
    position: 'absolute',
    left: 5,
    bottom: 5,
    width: '100%',
    justifyContent: 'center',
    marginLeft: -10
  },
  inlineName: {
    marginLeft: 8,
    flexShrink: 1
  }
});
