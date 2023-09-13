/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

'use strict';

/* eslint-env node */

const {getConfig} = require('@craftcms/webpack');
const path = require('path');
const fs = require('fs');
const {DllReferencePlugin, ProvidePlugin} = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const {
  CKEditorTranslationsPlugin,
} = require('@ckeditor/ckeditor5-dev-translations');
const {
  loaderDefinitions,
  getModuleResolutionPaths,
} = require('@ckeditor/ckeditor5-package-tools/lib/utils/webpack-utils');
const packageRoot = path.resolve(__dirname, '..', '..', '..', '..');
const moduleResolutionPaths = getModuleResolutionPaths(packageRoot);
const ckeditor5manifestPath = require.resolve(
  'ckeditor5/build/ckeditor5-dll.manifest.json',
);

const config = getConfig({
  context: __dirname,
  config: {
    entry: {
      'ckeditor5-craftcms': './ckeditor5-craftcms.js',
    },
    output: {
      filename: '[name].js',
      library: ['CKEditor5', 'craftcms'],
      libraryTarget: 'window',
    },
    performance: {
      hints: false,
    },
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          extractComments: false,
        }),
      ],
    },
    resolve: {
      // Triple dots syntax allows extending default extension list instead of overwriting it.
      extensions: ['.ts', '...'],
      modules: moduleResolutionPaths,
    },
    resolveLoader: {
      modules: moduleResolutionPaths,
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          {
            from: require.resolve('ckeditor5/build/ckeditor5-dll.js'),
          },
        ],
      }),
      new DllReferencePlugin({
        manifest: require(ckeditor5manifestPath),
        scope: 'ckeditor5/src',
        name: 'CKEditor5.dll',
      }),
      new ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      }),
      new CKEditorTranslationsPlugin({
        language: 'en',
        additionalLanguages: 'all',
        skipPluralFormFunction: true,
        buildAllTranslationsToSeparateFiles: true,
      }),
    ],
  },
});

// Prevent collisions with CKEditor's rules via include/exclude
config.module.rules = config.module.rules
  .map((rule) =>
    Object.assign(rule, {
      include: path.join(__dirname),
    }),
  )
  .concat([
    Object.assign(loaderDefinitions.raw(), {
      exclude: path.join(__dirname),
    }),
    Object.assign(loaderDefinitions.styles(packageRoot), {
      exclude: path.join(__dirname),
    }),
    Object.assign(loaderDefinitions.typescript(), {
      exclude: path.join(__dirname),
    }),
  ]);

module.exports = config;
