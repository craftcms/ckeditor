import {defineConfig, type Plugin} from 'vite';
import vue from '@vitejs/plugin-vue';
import laravel from 'laravel-vite-plugin';

/**
 * The CKEditor plugin’s control panel bundle (entry: `resources/js/cp.ts`), which registers its UI controls with
 * the control panel. It follows Commerce’s `vite.config.mts`.
 *
 * The CKEditor editor and field settings libraries are built separately, by the configs in `resources/assets/`.
 *
 * Output lands in `public/build`, which is where `HasFrontendAssets` (via `Plugin::$vite`) reads it from.
 */

/**
 * Specifiers the control panel publishes through its import map (see `Cp::sharedModules()`). Left out of the build
 * so the components share the control panel’s own instances rather than bundling second copies.
 *
 * Each maps to its named exports, or `null` for a package the dev server can import itself to find them.
 * Keep `@craftcms/cp`’s list in sync with the names declared in `resources/js/craftcms-cp.d.ts`.
 */
const cpSharedModuleExports: Record<string, string[] | null> = {
  vue: null,
  '@craftcms/cp': ['actionClient', 't'],
};
const cpSharedModules = Object.keys(cpSharedModuleExports);

/**
 * `build.rollupOptions.external` only applies to builds, and the dev server rewrites even an external bare `vue`
 * import to its own `/@id/` URL, which the import map can’t match. So in dev each shared module resolves to a
 * stand-in that loads it through a specifier Vite can’t rewrite, leaving the browser to resolve it via the import
 * map, and re-exports its named exports.
 */
function externalCpSharedModules(): Plugin {
  const prefix = '\0ckeditor-cp-shared:';

  return {
    name: 'ckeditor:external-cp-shared-modules',
    apply: 'serve',
    enforce: 'pre',
    resolveId(id) {
      return cpSharedModules.includes(id) ? prefix + id : null;
    },
    async load(id) {
      if (!id.startsWith(prefix)) {
        return null;
      }

      const specifier = id.slice(prefix.length);
      const names =
        cpSharedModuleExports[specifier] ??
        Object.keys(await import(specifier)).filter(
          (name) => name !== 'default' && /^[A-Za-z_$][\w$]*$/.test(name),
        );

      return [
        `const specifier = ${JSON.stringify(specifier)};`,
        'const shared = await import(/* @vite-ignore */ specifier);',
        `export const {${names.join(', ')}} = shared;`,
        ...(specifier === 'vue'
          ? [
              'globalThis.__VUE_HMR_RUNTIME__ ??= {',
              '  createRecord: () => true,',
              '  rerender: () => location.reload(),',
              '  reload: () => location.reload(),',
              '};',
            ]
          : []),
      ].join('\n');
    },
  };
}

export default defineConfig({
  plugins: [
    externalCpSharedModules(),
    laravel({
      input: ['resources/js/cp.ts'],
      publicDirectory: 'public',
      buildDirectory: 'build',
      refresh: false,
    }),
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.includes('-'),
        },
      },
    }),
  ],
  build: {
    outDir: 'public/build',
    emptyOutDir: true,
    rollupOptions: {
      external: cpSharedModules,
    },
  },
  optimizeDeps: {
    exclude: cpSharedModules,
  },
  // The build is served from wherever Craft publishes the plugin’s assets, not `/build`, so chunks find their
  // dependencies relative to themselves.
  experimental: {
    renderBuiltUrl(_filename, {hostType}) {
      return hostType === 'js' ? {relative: true} : undefined;
    },
  },
});
