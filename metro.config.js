const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// The API server lives in ./backend with its own node_modules; the app bundler must never crawl it.
config.resolver.blockList = [...(config.resolver.blockList ? [].concat(config.resolver.blockList) : []), /\/backend\/.*/];

module.exports = config;
