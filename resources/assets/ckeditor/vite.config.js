import {defineConfig} from 'vite';
import {resolve} from 'path';

export default defineConfig({
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
      external: ['ckeditor5'],
    },
  },
});
