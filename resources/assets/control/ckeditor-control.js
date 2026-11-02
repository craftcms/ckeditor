/**
 * The CKEditor field input, as a control panel UI control (`ckeditor:editor`).
 *
 * The field provides a JavaScript module whose default export creates the editor on a source `<textarea>`.
 * This component loads the editor’s assets, imports that module, and emits the editor’s data as the
 * control’s value whenever it changes.
 */
import {defineComponent, h, onBeforeUnmount, onMounted, ref} from 'vue';
import {applyGlobals, importModule, loadScript, loadStyle} from './assets.js';

const NESTED_OWNER_EDITOR_REQUEST = 'craft:nested-owner-editor-request';

/**
 * Finds the element editor containing the given element.
 *
 * Craft dispatches this event for its own HTML islands; there’s no public API for it yet.
 */
function requestOwnerEditor(element) {
  if (!element) {
    return null;
  }
  const request = new CustomEvent(NESTED_OWNER_EDITOR_REQUEST, {
    bubbles: true,
    detail: {editor: null},
  });
  element.dispatchEvent(request);
  return request.detail.editor;
}

/**
 * Creates the owner bridge the CKEditor JavaScript uses in place of Craft 5’s element editor.
 */
function createOwnerBridge(getRoot, getControl) {
  const context = () => getControl().props.owner;

  return {
    /**
     * Makes sure the owner is a draft (autosaving it if needed), and resolves to the owner ID
     * nested entries should be created for.
     */
    async prepare() {
      const owner = context();
      if (!owner) {
        return null;
      }

      const ownerEditor = requestOwnerEditor(getRoot());
      if (!ownerEditor) {
        return owner.ownerId;
      }

      const prepared = await ownerEditor.prepare(getControl().path, {
        ownerId: owner.ownerId,
        ownerIsDerivative: owner.ownerIsDerivative,
        ownerIsInDerivativeTree: owner.ownerIsInDerivativeTree,
        ownerIsUnpublishedDraft: owner.ownerIsUnpublishedDraft,
        requiresDerivative: owner.ownerHasDrafts,
      });

      if (!prepared) {
        return owner.ownerId;
      }

      if (
        prepared.requiresDerivative &&
        !prepared.isProvisionalDraft &&
        !prepared.draftId &&
        !owner.ownerIsInDerivativeTree &&
        !owner.ownerIsUnpublishedDraft
      ) {
        throw new Error('Could not prepare the owner draft.');
      }

      return prepared.ownerId ?? owner.ownerId;
    },

    /**
     * Maps a canonical nested element ID to its ID in the owner’s draft.
     */
    resolveElementId(id) {
      return requestOwnerEditor(getRoot())?.resolveElementId?.(id) ?? id;
    },

    /**
     * Refreshes the owner’s UI after nested entries change.
     */
    refresh() {
      requestOwnerEditor(getRoot())?.refresh?.();
    },
  };
}

export default defineComponent({
  name: 'CkeditorControl',
  props: {
    control: {type: Object, required: true},
    value: {type: null, default: null},
    label: {type: String, default: null},
    editable: {type: Boolean, default: true},
    invalid: {type: Boolean, default: false},
    required: {type: Boolean, default: false},
  },
  emits: ['update:value'],
  setup(props, {emit}) {
    const root = ref(null);
    const textarea = ref(null);
    const wordCount = ref(null);
    const owner = createOwnerBridge(
      () => root.value,
      () => props.control,
    );
    const error = ref(null);
    let editor = null;
    let destroyed = false;

    onMounted(async () => {
      const p = props.control.props;
      const assets = p.assets ?? {};

      try {
        applyGlobals(p.globals ?? {});
        await Promise.all([
          ...(assets.styles ?? []).map((url) => loadStyle(url)),
          ...(assets.scripts ?? []).map((url) => loadScript(url)),
          ...(assets.modules ?? []).map((url) => loadScript(url, 'module')),
        ]);

        textarea.value.value = props.value ?? '';

        const module = await importModule(p.module);
        const instance = await module.default(textarea.value, {
          containerId: p.containerId,
          wordCountElement: wordCount.value,
          readOnly: props.control.mode !== 'editable',
          owner,
        });

        if (destroyed) {
          await instance.destroy();
          return;
        }

        editor = instance;
        editor.model.document.on('change:data', () => {
          emit('update:value', editor.getData(), 'typing');
        });
      } catch (e) {
        console.error(e);
        error.value = e?.message ?? String(e);
      }
    });

    onBeforeUnmount(() => {
      destroyed = true;
      if (editor) {
        editor.destroy().catch(() => {});
        editor = null;
      }
    });

    return () => {
      const p = props.control.props;
      return h(
        'div',
        {
          ref: root,
          id: p.containerId,
          class: [
            'ckeditor-container',
            {'ck-with-show-word-count': p.showWordCount},
          ],
        },
        [
          p.css ? h('style', p.css) : null,
          h('textarea', {
            ref: textarea,
            class: 'hidden',
            'aria-label': props.label,
          }),
          p.showWordCount
            ? h(
                'div',
                {
                  ref: wordCount,
                  class: ['ck-word-count', 'light', 'smalltext'],
                },
                ' ',
              )
            : null,
          error.value ? h('p', {class: 'error'}, error.value) : null,
        ],
      );
    };
  },
});
