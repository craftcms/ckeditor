import {defineConfig} from 'vite';
import {resolve} from 'path';
import {viteStaticCopy} from 'vite-plugin-static-copy';

export default defineConfig({
  publicDir: false,
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: false,
    assetsDir: '',
    lib: {
      entry: {
        fieldsettings: resolve(__dirname, 'src/fieldsettings.js'),
      },
      name: 'fieldsettings',
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'ckeditor5',
        '@craftcms/ckeditor',
        '@craftcms/cp',
        '@craftcms/garnish',
      ],
    },
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: resolve(__dirname, 'src/images/*'),
          dest: resolve(__dirname, 'dist/images/'),
          rename: {stripBase: true},
        },
      ],
    }),
  ],
});
