import { useEffect } from 'react';

import { Animated, Image, StyleSheet, View } from 'react-native';

export const XKRLogo: React.FC = () => {
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    let flipFlop = false;
    const keepAnimating = () => {
      Animated.timing(animatedValue, {
        duration: 3000,
        toValue: flipFlop ? 0 : 224,
        useNativeDriver: false,
      }).start(() => {
        flipFlop = flipFlop ? false : true;
        keepAnimating();
      });
    };
    Animated.timing(animatedValue, {
      duration: 3000,
      toValue: 224,
      useNativeDriver: false,
    }).start(() => {
      keepAnimating();
    });
  });

  const interpolateColor = animatedValue.interpolate({
    inputRange: [0, 32, 64, 96, 128, 160, 192, 224],
    outputRange: [
      '#5f86f2',
      '#a65ff2',
      '#f25fd0',
      '#f25f61',
      '#f2cb5f',
      '#abf25f',
      '#5ff281',
      '#5ff2f0',
    ],
  });

  return (
    <View style={[styles.container]}>
      <Animated.View
        style={[
          styles.logo,
          {
            backgroundColor: interpolateColor,
          },
        ]}>
        <Image
          style={styles.image}
          source={require('../../assets/img/hugin-animated.png')}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  image: {
    height: 250,
    marginLeft: -25,
    marginTop: 4,
    width: 300,
  },
  logo: {
    borderRadius: 150,
    height: 250,
    width: 250,
  },
});
