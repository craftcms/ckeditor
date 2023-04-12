const {styles} = require('@ckeditor/ckeditor5-dev-utils');
const {getConfig} = require('@craftcms/webpack');

const config = getConfig({
  context: __dirname,
  config: {
    entry: {
      ckeditor: './ckeditor.js',
    },
  },
});

config.module.rules = [
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
];

module.exports = config;
