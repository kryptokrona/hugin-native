import { useEffect } from 'react';

import { Animated, Image, StyleSheet } from 'react-native';

interface Props {}

export const XKRLogo: React.FC<Props> = () => {
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
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: interpolateColor,
        },
      ]}>
      <Image
        style={styles.image}
        source={require('../../assets/img/hugin-logo.svg')}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 150,
    height: 250,
    width: 250,
  },
  image: {
    height: 250,
    marginLeft: -25,
    marginTop: 4,
    width: 300,
  },
});

// export class XKRLogo extends React.Component {
//   constructor(props) {
//     super(props);
//     this.animation = new Animated.Value(0);
//   }

//   componentWillMount() {
//     this.animatedValue = new Animated.Value(0);
//   }

//   componentDidMount() {
//     let flipFlop = false;

//     const keepAnimating = () => {
//       Animated.timing(this.animatedValue, {
//         duration: 3000,
//         toValue: flipFlop ? 0 : 224,
//       }).start(() => {
//         flipFlop = flipFlop ? false : true;
//         keepAnimating();
//       });
//     };

//     Animated.timing(this.animatedValue, {
//       duration: 3000,
//       toValue: 224,
//     }).start(() => {
//       keepAnimating();
//     });
//   }

//   render() {
//     const interpolateColor = this.animatedValue.interpolate({
//       inputRange: [0, 32, 64, 96, 128, 160, 192, 224],
//       outputRange: [
//         '#5f86f2',
//         '#a65ff2',
//         '#f25fd0',
//         '#f25f61',
//         '#f2cb5f',
//         '#abf25f',
//         '#5ff281',
//         '#5ff2f0',
//       ],
//     });

//     return (
//       <Animated.View
//         style={{
//           backgroundColor: interpolateColor,
//           borderRadius: 150,
//           height: 250,
//           width: 250,
//         }}>
//         <Image
//           style={{ height: 250, marginLeft: -25, marginTop: 4, width: 300 }}
//           source={require('../assets/img/hugin.png')}
//         />
//       </Animated.View>
//     );
//   }
// }
