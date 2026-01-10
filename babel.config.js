module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@/screens': './src/screens',
          '@/components': './src/components',
          '@/services': './src/services',
          '@/utils': './src/utils',
          '@/types': './src/types',
          '@/contexts': './src/contexts',
          '@/styles': './src/styles',
          '@/config': './src/config',
        },
      },
    ],

    [
      'react-native-worklets/plugin',
      {
        globals: ['__scanCodes'],
      },
    ],
  ],
};
