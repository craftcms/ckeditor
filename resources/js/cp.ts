import {registerCopiedValuePreview} from './modules/copied-value';
import {registerEntryTypeChipActions} from './modules/entry-type-chips';

registerEntryTypeChipActions();

// Register the CKEditor UI controls with the control panel, along with the preview of their copied values.
// The components are loaded on demand, so CKEditor’s code is only fetched on the pages that use it.
window.Cp.booting((cp: any) => {
  cp.$components.register(
    'ckeditor:editor',
    () => import('./modules/ui/CkeditorControl.vue'),
  );
  cp.$components.register(
    'ckeditor:editor-config',
    () => import('./modules/ui/EditorConfigControl.vue'),
  );
  registerCopiedValuePreview(cp);
});
