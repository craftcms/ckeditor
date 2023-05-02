/* globals module, require, __dirname */
const {getConfig} = require('@craftcms/webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');
const root = path.resolve(__dirname, '..', '..', '..', '..');

const config = getConfig({
  context: __dirname,
  config: {
    entry: {
      ckeditor: './ckeditor.css',
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          {
            from: require.resolve('ckeditor5/build/ckeditor5-dll.js'),
          },
          {
            from: path.resolve(
              root,
              'packages',
              'ckeditor5-craftcms',
              'build',
              'craftcms.js'
            ),
          },
        ],
      }),
    ],
  },
});

module.exports = config;
