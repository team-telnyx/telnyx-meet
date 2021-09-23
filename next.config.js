const WorkerPlugin = require('worker-plugin');
const { BugsnagSourceMapUploaderPlugin } = require('webpack-bugsnag-plugins');

module.exports = {
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    if (!isServer) {
      config.plugins.push(
        new WorkerPlugin({
          // use "self" as the global object when receiving hot updates.
          globalObject: 'self',
        })
      );
    }

    if (process.env.NEXT_PUBLIC_BUGSNAG_API_KEY) {
      config.devtool = 'source-map';
      config.plugins.push(
        new BugsnagSourceMapUploaderPlugin({
          apiKey: process.env.NEXT_PUBLIC_BUGSNAG_API_KEY,
          appVersion: require('./package.json').version,
          publicPath: process.env.SOURCE_MAPS_PATH,
          overwrite: true,
          uploadSource: true,
        })
      );
    }

    return config;
  },
};
