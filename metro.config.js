const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite's web worker imports wa-sqlite.wasm directly. Metro must treat
// WebAssembly as an asset or the static web export cannot resolve expo-sqlite.
if (!config.resolver.assetExts.includes('wasm')) {
	config.resolver.assetExts.push('wasm');
}

if (config.watcher) {
	delete config.watcher.unstable_workerThreads;
}

module.exports = config;
