module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ['./src/assets/fonts'],
  dependencies: {
    'react-native-vector-icons': {
      platforms: {
        ios: null, // Disable auto-linking for iOS
      },
    },
    'react-native-background-fetch': {
      platforms: {
        android: null,
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
