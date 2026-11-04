import {defineConfig} from 'vite';
import {resolve} from 'path';

export default defineConfig({
  publicDir: false,
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
      // `@craftcms/cp` is published through the control panel’s import map (see `Cp::sharedModules()`)
      external: ['ckeditor5', '@craftcms/cp'],
    },
  },
});
