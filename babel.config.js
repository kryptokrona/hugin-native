module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'], 
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
    'react-native-reanimated/plugin',
  ],
};
