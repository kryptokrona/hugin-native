// Copyright (C) 2018, Zpalmtree
//
// Please see the included LICENSE file for more information.

import React, { useEffect, useRef } from 'react';

import { Animated, StyleSheet, View, Easing } from 'react-native';

import { useGlobalStore } from '@/services';

export const ProgressBar: React.FC<any> = (props) => {
  const theme = useGlobalStore((state) => state.theme);
  const progress = useRef(
    new Animated.Value(props.initialProgress || 0),
  ).current;

  useEffect(() => {
    const progressListener = progress.addListener(({ value }) => {
      if (props.progress >= 0 && props.progress !== value) {
        update();
      }
    });

    return () => {
      progress.removeListener(progressListener);
    };
  }, [props.progress]);

  const update = () => {
    Animated.timing(progress, {
      duration: 500,
      easing: Easing.inOut(Easing.ease),
      toValue: props.progress,
      useNativeDriver: false,
    }).start();
  };

  const width = props.style?.width || 300;

  const fillWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width],
  });

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.backgroundInverted },
        props.style,
      ]}>
      <Animated.View
        style={[
          styles.fill,
          { backgroundColor: theme.inverted, width: fillWidth },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    borderRadius: 2,
    height: 5,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 2,
    height: 5,
  },
});
