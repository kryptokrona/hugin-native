import React, { useState, useEffect } from 'react';

import { StyleSheet, View, Text } from 'react-native';

import { TouchableOpacity } from '@gorhom/bottom-sheet';
import {
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
} from 'react-native-reanimated';

import { MainScreens } from '@/config';

import { Peers } from 'lib/connections';
import { Rooms } from 'lib/native';

import { Avatar } from '@/components';
import { useGlobalStore, WebRTC, useThemeStore } from '@/services';
import { textType } from '@/styles';
import { Call } from '@/types';
import type { MainStackNavigationType } from '@/types';

import { CustomIcon } from './_elements/custom-icon';

import { getAvatar, getColorFromHash, prettyPrintDate } from '@/utils';

import InCallManager from 'react-native-incall-manager';
import { useNavigation } from '@react-navigation/native';

export const CallFloater: React.FC = () => {

  const users = useGlobalStore(state => state.currentCall.users);
  const room = useGlobalStore(state => state.currentCall.room);
  const talkingUsers = useGlobalStore(state => state.currentCall.talkingUsers);
  const navigation = useNavigation<MainStackNavigationType>();
  
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const myUserAddress = useGlobalStore((state) => state.address);
  const theme = useThemeStore((state) => state.theme);
  const [speaker, setSpeaker] = useState(false);
  const [muted, setMuted] = useState(false);
  const [camera, setCamera] = useState(users.find(a => a.address === myUserAddress)?.video);

  const backgroundColor = theme.background;
  const borderColor = theme.border;
  const color = theme.foreground;

  const [callDuration, setCallDuration] = useState('00 00 00'.split(' ').join('\n'));


  // useEffect(() => {
  //   console.log('Update time')
  //   const updateTimer = () => {
  //     const startTime = currentCall.time;
  //     const now = Date.now();
  //     const elapsed = Math.floor((now - startTime) / 1000);

  //     const hours = String(Math.floor(elapsed / 3600)).padStart(2, '0');
  //     const minutes = String(Math.floor((elapsed % 3600) / 60)).padStart(
  //       2,
  //       '0',
  //     );
  //     const seconds = String(elapsed % 60).padStart(2, '0');

  //     setCallDuration(`${hours} ${minutes} ${seconds}`.split(' ').join('\n'));
  //   };

  //   const timer = setInterval(updateTimer, 1000);
  //   updateTimer();

  //   return () => clearInterval(timer);
  // }, [currentCall.time]);

const panGesture = Gesture.Pan()
  .onStart((e) => {
    startX.value = translateX.value;
    startY.value = translateY.value;
  })
  .onUpdate((e) => {
    translateX.value = startX.value + e.translationX;
    translateY.value = startY.value + e.translationY;
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  function popUp() {
    navigation.navigate(MainScreens.CallScreen);
  }

  function toggleSpeaker() {
    InCallManager.setSpeakerphoneOn(!speaker);
    setSpeaker(!speaker);
  }

  async function toggleCamera() {
    await WebRTC.setVideo(!camera);
    Rooms.voice(
      {
        audioMute: !muted,
        key: room,
        screenshare: false,
        video: !camera,
        videoMute: false,
        voice: true,
      },
      true,
    );
    const me = users.find(a => a.address == myUserAddress);
    if (!me) return;
    me.video = !camera;
    useGlobalStore.getState().setUsers([...users]);

    setCamera(!camera);

    if (camera) {
      
    const videoTracks = WebRTC.localMediaStream?.getVideoTracks() || [];
    for (const track of videoTracks) {
      WebRTC.localMediaStream?.removeTrack(track);
      track.stop();
    }
    }

  }

  function toggleMuted() {
    WebRTC.localMediaStream?.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
    Rooms.voice(
      {
        audioMute: !muted,
        key: room,
        screenshare: false,
        video: false,
        videoMute: false,
        voice: true,
      },
      true,
    );
    setMuted(!muted);
  }

  function endCall() {
    Rooms.voice(
      {
        audioMute: false,
        key: room,
        screenshare: false,
        video: false,
        videoMute: false,
        voice: false,
      },
      false,
    );

    const peer = {
      address: myUserAddress,
      audioMute: false,
      screenshare: false,
      video: false,
      voice: false,
      room
    };

    Peers.voicestatus(peer);

    useGlobalStore.getState().resetCurrentCall();
    WebRTC.exit();
  }

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.overlayContainer,
          animatedStyle,
          {
            backgroundColor,
            borderColor,
            borderRadius: 20,
            borderWidth: 1,
            color,
          },
        ]}>
        <View style={styles.avatarsContainer}>
          {users.map((user) => (
            <View key={user.address} style={{borderRadius: 5, borderWidth: 2, borderColor: talkingUsers[user.address] ? 'green' : 'transparent'}}>
            <Avatar
              base64={
                user.avatar !== '' ? user.avatar : getAvatar(user.address, 32)
              }
              size={24}
            />
            </View>
          ))}
        </View>
        {/* <Text style={{ color }}>{callDuration}</Text> */}
        <TouchableOpacity onPress={toggleSpeaker}>
          {speaker ?
            (
              <CustomIcon
                color={color}
                name="volume-up"
                type="MI"
                size={24}
              />
            ) :
            (
              <CustomIcon
                color={color}
                name="volume-mute"
                type="MI"
                size={24}
              />
            )
          
          }
          
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleMuted}>
          {muted ?
            (
              <CustomIcon
                color="#dc2626"
                name="microphone-off"
                type="MCI"
                size={24}
              />
            ) :
            (
              <CustomIcon
                color={color}
                name="microphone"
                type="MCI"
                size={24}
              />
            )
          
          }
          
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleCamera}>
          {camera ?
            (
              <CustomIcon
                color="#dc2626"
                name="camera-off"
                type="MCI"
                size={24}
              />
            ) :
            (
              <CustomIcon
                color={color}
                name="camera"
                type="MCI"
                size={24}
              />
            )
          
          }
          
        </TouchableOpacity>
        <TouchableOpacity onPress={popUp}>
          <CustomIcon
            color={color}
            name="popup"
            type="ENT"
            size={24}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={endCall}>
          <CustomIcon
            color="#dc2626"
            name="phone-hangup"
            type="MCI"
            size={24}
          />
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  avatarsContainer: {
    alignItems: 'center',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 8,
  },
  container: {
    flex: 1,
  },
  overlayContainer: {
    alignItems: 'center',
    backgroundColor: 'green',
    bottom: '60%',
    flexDirection: 'column',
    gap: 10,
    justifyContent: 'center',
    right: 10,
    position: 'absolute',
    width: 60,
    padding: 10,
    zIndex: 9999
  },
});
