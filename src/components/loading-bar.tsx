import React, { useEffect, useRef } from 'react';

import { View, Animated, StyleSheet } from 'react-native';

export const LoadingBar = ({ duration = 3000, onComplete }) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate the bar
    Animated.timing(progress, {
      duration,
      toValue: 1,
      useNativeDriver: false,
    }).start(() => {
      if (onComplete) {
        onComplete();
      }
    });
  }, [progress, duration, onComplete]);

  const widthInterpolated = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.bar, { width: widthInterpolated }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    backgroundColor: '#4caf50',
    borderRadius: 5,
    height: '100%',
  },
  container: {
    backgroundColor: '#ddd',
    borderRadius: 5,
    height: 10,
    overflow: 'hidden',
    width: '100%',
  },
});
