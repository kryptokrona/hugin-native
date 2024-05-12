module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ['./assets/fonts'],
  dependencies: {
    // Avoid adding react-native-vector-icons to bundle
    'react-native-vector-icons': {
      platforms: {
        ios: null,
      },
    },
  },
  // dependencies: {
  //     'react-native-flipper': {
  //         platforms: {
  //             ios: null,
  //         },
  //     },
  // }
};
