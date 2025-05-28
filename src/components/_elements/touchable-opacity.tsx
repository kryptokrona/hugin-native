import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  ViewStyle
} from 'react-native';
import { flatten } from 'react-native/Libraries/StyleSheet/StyleSheet';


import Animated, { useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function extractOpacity(
  style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>)
): number | undefined {
  // If style is a function, we can't resolve it without knowing the "pressed" state
  if (typeof style === 'function') {
    const resolved = style({ pressed: false }); // or true, depending on what you want
    return extractOpacity(resolved);
  }

  if (!style) return undefined;

  const flat = flatten(style); // Flattens arrays and registered styles into a single object
  return flat?.opacity;
}

type Props = PressableProps & {
  style?: ViewStyle | ((state: { pressed: boolean }) => ViewStyle);
  children: React.ReactNode;
};

export const TouchableOpacity: React.FC<Props> = ({ style, children, ...rest }) => {

  const originalOpacity = extractOpacity(style) || 1;

  const opacity = useSharedValue(originalOpacity);

  const handlePressIn = () => {
    opacity.value = withSpring(originalOpacity * 0.2);
  };

  const handlePressOut = () => {
    opacity.value = withSpring(originalOpacity);
  };

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, {opacity}]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  touchable: {
    // Optional default styling
  },
  pressed: {
    opacity: 0.7
  },
});
