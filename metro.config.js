const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const config = {
  resolver: {
    extraNodeModules: {
      '@opentelemetry/api': require.resolve('./shims/opentelemetry-api-stub.js'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
