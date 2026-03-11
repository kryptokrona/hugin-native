import { useEffect, useRef } from "react";
import { Animated } from "react-native";

interface Props {
  children: React.ReactNode;
  skipAnimation?: boolean;
}

export const GlideInItem = ({ children, skipAnimation = false }: Props) => {
  const opacity = useRef(new Animated.Value(skipAnimation ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(skipAnimation ? 0 : 30)).current;
  const scale = useRef(new Animated.Value(skipAnimation ? 1 : 0.95)).current;

  useEffect(() => {
    if (skipAnimation) return;

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [
          { translateY },
          { scale },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
};

  