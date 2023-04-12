/* globals module, require, __dirname */
const {getConfig} = require('@craftcms/webpack');
const path = require('path');
const {styles} = require('@ckeditor/ckeditor5-dev-utils');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const config = getConfig({
  context: __dirname,
  config: {
    entry: {
      ckeditor: './ckeditor.js',
    },
    module: {
      rules: [
        {
          test: require.resolve('./src/ckeditor.js'),
          loader: 'expose-loader',
          options: {
            exposes: [
              {
                globalName: 'Ckeditor',
                moduleLocalName: 'default',
              },
            ],
          },
        },
      ],
    },
  },
});

// Prefix our base rules so they don't collide with CKEditor's
config.module.rules = config.module.rules
  .map((rule) => Object.assign(rule, {include: __dirname}))
  .concat([
    {
      test: /ckeditor5-[^/\\]+[/\\]theme[/\\]icons[/\\][^/\\]+\.svg$/,
      use: ['raw-loader'],
    },
    {
      test: /ckeditor5-[^/\\]+[/\\]theme[/\\].+\.css$/,
      use: [
        {
          loader: 'style-loader',
          options: {
            injectType: 'singletonStyleTag',
            attributes: {
              'data-cke': true,
            },
          },
        },
        'css-loader',
        {
          loader: 'postcss-loader',
          options: {
            postcssOptions: styles.getPostCssConfig({
              themeImporter: {
                themePath: require.resolve('@ckeditor/ckeditor5-theme-lark'),
              },
              minify: true,
            }),
          },
        },
      ],
    },
  ]);

module.exports = config;
