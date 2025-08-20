import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = PressableProps & {
  style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
  children: React.ReactNode;
};

function safeStyle(style: any) {
  const flat = StyleSheet.flatten(style) || {};
  for (const key in flat) {
    if (flat[key] === 'none') flat[key] = undefined;
  }
  return flat;
}

export const TouchableOpacity: React.FC<Props> = ({ style, children, ...rest }) => {
  const pressed = useSharedValue(false);

  // Extract initial opacity if possible
  const extractInitialOpacity = (): number => {
    let resolved: any = style;

    if (typeof style === 'function') {
      resolved = style({ pressed: false });
    }

    const flat = StyleSheet.flatten(resolved) || {};
    return typeof flat.opacity === 'number' ? flat.opacity : 1;
  };

  const baseOpacity = extractInitialOpacity();
  const animatedOpacity = useSharedValue(baseOpacity);

  const handlePressIn = () => {
    pressed.value = true;
    animatedOpacity.value = withSpring(baseOpacity * 0.2);
  };

  const handlePressOut = () => {
    pressed.value = false;
    animatedOpacity.value = withSpring(baseOpacity);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: animatedOpacity.value,
  }));

  // Resolve style function to object before passing to AnimatedPressable
  const resolvedStyle = typeof style === 'function' ? style({ pressed: pressed.value }) : style;

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[safeStyle(resolvedStyle), safeStyle(animatedStyle)]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
};
