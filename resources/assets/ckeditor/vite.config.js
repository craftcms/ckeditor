import {defineConfig} from 'vite';
import {resolve} from 'path';
import hasSubject from './postcss-has-subject.js';

export default defineConfig({
  publicDir: false,
  css: {
    postcss: {
      plugins: [hasSubject()],
    },
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: false,
    assetsDir: '',
    lib: {
      entry: {
        'ckeditor5-craftcms': resolve(__dirname, './src/ckeditor5-craftcms.js'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['ckeditor5', '@craftcms/cp', '@craftcms/garnish'],
    },
  },
});
