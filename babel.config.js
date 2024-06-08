module.exports = {
  presets: ['module:@react-native/babel-preset'],
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
  ],
};
