const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = ['mjs', ...config.resolver.sourceExts.filter(ext => ext !== 'mjs')];
config.resolver.unstable_enablePackageExports = true;

// Fix for tslib __extends undefined error with framer-motion
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'tslib') {
    return {
      type: 'sourceFile',
      filePath: require.resolve('tslib/tslib.js'),
    };
  }
  // Let NativeWind/Expo handle the rest
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
