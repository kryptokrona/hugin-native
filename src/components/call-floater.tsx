import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
} from 'react-native-reanimated';

import { Call } from '@/types';

import { useGlobalStore, WebRTC } from '@/services';

import { CustomIcon } from './_elements/custom-icon';

import { useThemeStore } from '@/services';

import { textType } from '@/styles';
import { TouchableOpacity } from '@gorhom/bottom-sheet';
import { Rooms } from 'lib/native';
import { Peers } from 'lib/connections';
import { Avatar } from '@/components';

interface Props {
  currentCall: Call;
}

const getAvatar = (userAddress: string) => {
  return `data:image/png;base64,${userAddress}`;
};

export const CallFloater: React.FC<Props> = ({ currentCall }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const myUserAddress = useGlobalStore((state) => state.address);
  const theme = useThemeStore((state) => state.theme);

  const backgroundColor = theme.background;
  const borderColor = theme.border;
  const color = theme.foreground;

  const [callDuration, setCallDuration] = useState('00:00:00');

  useEffect(() => {
    const updateTimer = () => {
      const startTime = currentCall.time;
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);

      const hours = String(Math.floor(elapsed / 3600)).padStart(2, '0');
      const minutes = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
      const seconds = String(elapsed % 60).padStart(2, '0');

      setCallDuration(`${hours}:${minutes}:${seconds}`);
    };

    const timer = setInterval(updateTimer, 1000);
    updateTimer();

    return () => clearInterval(timer);
  }, [currentCall.time]);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx: any) => {
      translateX.value = ctx.startX + event.translationX;
      translateY.value = ctx.startY + event.translationY;
    },
    onEnd: () => {
      translateX.value = withSpring(translateX.value);
      translateY.value = withSpring(translateY.value);
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  function endCall() {
    Rooms.voice({ key: currentCall.room, voice: false, video: false, screenshare: false, audioMute: false, videoMute: false }, false);

    const peer = {
      address: myUserAddress,
      voice: false,
      video: false,
      screenshare: false,
      audioMute: false
    };

    Peers.voicestatus(peer);

    useGlobalStore.getState().setCurrentCall({ room: '', users: [] });
    WebRTC.endCall();
  }

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={[styles.overlayContainer, animatedStyle, { borderColor, borderWidth: 1, color, backgroundColor, borderRadius: 20 }]}>
        <View style={styles.avatarsContainer}>
          {currentCall.users.map((user) => (
            <Avatar
              key={user.address}
              base64={user.avatar !== '' ? user.avatar : getAvatar(user.address)}
              size={24}
            />
          ))}
        </View>
        <Text style={{ color }}>{callDuration}</Text>
        <TouchableOpacity onPress={endCall}>
          <CustomIcon color={theme[textType['destructive']]} name="phone-hangup" type="MCI" size={24} />
        </TouchableOpacity>
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  overlayContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    backgroundColor: 'green',
    height: 42,
    width: '80%',
    justifyContent: 'center',
    position: 'absolute',
    bottom: '20%',
    left: '10%',
  },
  avatarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
});
