import {defineConfig} from 'vite';
import {resolve} from 'path';
import {viteStaticCopy} from 'vite-plugin-static-copy';

export default defineConfig({
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
      external: ['ckeditor5', 'jquery', '@craftcms/ckeditor'],
      globals: {
        jquery: '$',
      },
    },
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: resolve(__dirname, 'src/images/*'),
          dest: resolve(__dirname, 'dist/images/'),
        },
      ],
    }),
  ],
});
