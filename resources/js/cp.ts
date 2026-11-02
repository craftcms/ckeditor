import {registerEntryTypeChipActions} from './modules/entry-type-chips';

/**
 * Registers the CKEditor UI controls with the control panel, and adds the
 * “Expand to a separate button” action to the field settings’ entry type chips.
 *
 * The components are loaded on demand, so CKEditor’s code is only fetched on the pages that use it.
 * `window.Cp` may not exist yet when this runs (see Commerce’s `resources/js/cp.ts`), so wait for it.
 */
function registerComponents(): void {
  window.Cp.$components.register(
    'ckeditor:editor',
    () => import('./modules/ui/CkeditorControl.vue'),
  );
  window.Cp.$components.register(
    'ckeditor:editor-config',
    () => import('./modules/ui/EditorConfigControl.vue'),
  );
}

registerEntryTypeChipActions();

if (window.Cp) {
  registerComponents();
} else {
  const id = setInterval(() => {
    if (window.Cp) {
      clearInterval(id);
      registerComponents();
    }
  }, 10);
}
