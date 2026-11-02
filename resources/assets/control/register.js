/**
 * Registers the CKEditor UI controls with the control panel.
 *
 * Loaded as a deferred classic script ahead of `Cp.start()`. The components themselves are loaded lazily,
 * as ES modules that import the control panel’s shared `vue` build through the import map.
 */
(() => {
  const url = (file) => new URL(file, document.currentScript.src).href;
  const editorUrl = url('ckeditor-control.js');
  const editorConfigUrl = url('editor-config-control.js');

  window.Cp.booting((cp) => {
    cp.$components.register('ckeditor:editor', () => import(editorUrl));
    cp.$components.register(
      'ckeditor:editor-config',
      () => import(editorConfigUrl),
    );
  });
})();
