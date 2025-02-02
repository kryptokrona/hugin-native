import { Animated, StyleSheet, View } from 'react-native';
import React, { useEffect, useRef } from 'react';

import { TextField } from './text-field';
import { TipType } from '@/types';
import { prettyPrintAmount } from 'kryptokrona-wallet-backend-js';
import { textType } from '@/styles';
import { useThemeStore } from '@/services';
import { useTranslation } from 'react-i18next';

interface Props {
  tip: TipType;
}

export const Tip: React.FC<Props> = ({ tip }) => {
  const { t } = useTranslation();
  const theme = useThemeStore((state) => state.theme);
  const backgroundColor = theme.primary;
  const color = theme[textType.primary];

  // Create a reference for the animated rotation value
  const rotation = useRef(new Animated.Value(0)).current;

  // Trigger the animation on mount
  useEffect(() => {
    Animated.timing(rotation, {
      // Rotate to 360 degrees
      duration: 600,
      toValue: 1, // Duration of the animation
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
    opacity,
    transform: [{ rotateX }],
  };

  const message = t('tipSent', {
    amount: prettyPrintAmount(tip.amount),
    receiver: tip.receiver,
  });

  return (
    <Animated.View
      style={[styles.cardContainer, animatedStyle, { backgroundColor }]}>
      <View style={[styles.insetBorder, { borderColor: color }]}>
        <TextField type="primary" maxLength={40} size="xsmall">
          {message}
        </TextField>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 12,
    marginTop: -20,
    opacity: 0,
    padding: 5,
    width: '100%',
  },
  insetBorder: {
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    padding: 12,
  },
});
