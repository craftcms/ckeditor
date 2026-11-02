/**
 * Registers the CKEditor UI control with the control panel.
 *
 * Loaded as a deferred classic script ahead of `Cp.start()`. The component itself is loaded lazily,
 * as an ES module that imports the control panel’s shared `vue` build through the import map.
 */
(() => {
  const componentUrl = new URL(
    'ckeditor-control.js',
    document.currentScript.src,
  ).href;

  window.Cp.booting((cp) => {
    cp.$components.register('ckeditor:editor', () => import(componentUrl));
  });
})();
