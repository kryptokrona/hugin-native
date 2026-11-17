const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = defaultConfig.resolver;

// Package subpaths taken from the package's "exports" map. Package exports stay off
// (unstable_enablePackageExports) for every other import, whose resolution does not change.
// Node resolves these here through the same "exports" entry ("default" condition).
// hugin-network/dm: the DM crypto (src/services/hugin/dm.js), pure JavaScript.
const EXPORTED_SUBPATHS = new Set(['hugin-network/dm']);

const config = {
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resetCache: true,
  resolver: {
    assetExts: assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...sourceExts, 'svg'],
    unstable_enablePackageExports: false,
    resolveRequest: (context, moduleName, platform) => {
      if (EXPORTED_SUBPATHS.has(moduleName)) {
        return {
          type: 'sourceFile',
          filePath: require.resolve(moduleName, { paths: [__dirname] }),
        };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
