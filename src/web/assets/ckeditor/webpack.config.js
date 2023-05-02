/* globals module, require, __dirname */
const {getConfig} = require('@craftcms/webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const config = getConfig({
  context: __dirname,
  config: {
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          {
            from: require.resolve('ckeditor5/build/ckeditor5-dll.js'),
          },
        ],
      }),
    ],
  },
});

module.exports = config;
