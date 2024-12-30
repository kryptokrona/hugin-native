import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { useThemeStore } from '@/services';
import { textType, Styles } from '@/styles';
import { prettyPrintAmount } from 'kryptokrona-wallet-backend-js';

import { TextField } from './text-field';

interface Props {
  tip: JSON;
}

export const Tip: React.FC<Props> = (tip) => {
  tip = tip.tip;
  const theme = useThemeStore((state) => state.theme);
  const backgroundColor = theme.primary;
  const color = theme[textType['primary']];

  // Create a reference for the animated rotation value
  const rotation = useRef(new Animated.Value(0)).current;

  // Trigger the animation on mount
  useEffect(() => {
    Animated.timing(rotation, {
      toValue: 1, // Rotate to 360 degrees
      duration: 600, // Duration of the animation
      useNativeDriver: true,
    }).start();
  }, [rotation]);

  // Interpolating rotation value for rotateY
  const rotateX = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['80deg', '0deg'], // Rotate 360 degrees
  });

  const opacity = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1], // Rotate 360 degrees
  });

  // Animated style that applies the rotation
  const animatedStyle = {
    transform: [{ rotateX }],
    opacity
  };

  return (
    <Animated.View style={[styles.cardContainer, animatedStyle, { backgroundColor }]}>
      <View style={[styles.insetBorder, { borderColor: color }]}>
        <TextField size="small" style={{ color, fontFamily: 'Montserrat-Medium' }}>
          Sent {prettyPrintAmount(tip.amount)} to {tip.receiver}! 💸
        </TextField>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginTop: -20,
    borderRadius: 12,
    padding: 5, // Space to inset the border
    width: '100%',
    opacity: 0
  },
  insetBorder: {
    flex: 1, // Ensures the inner View fills the container
    borderRadius: 8, // Matches the outer container's border radius
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 12, // Space inside the dashed border
  },
});
