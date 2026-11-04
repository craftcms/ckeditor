<script setup lang="ts">
  /**
   * The CKEditor field input, as a control panel UI control (`ckeditor:editor`).
   *
   * The field provides a JavaScript module whose default export creates the editor on a source `<textarea>`.
   * This component loads the editor’s assets, imports that module, and emits the editor’s data as the
   * control’s value whenever it changes.
   */
  import {h, onBeforeUnmount, onMounted, ref, watch} from 'vue';
  import {actionClient} from '@craftcms/cp';
  import {
    applyGlobals,
    importModule,
    loadScript,
    loadStyle,
    type ControlAssets,
    type EditorGlobals,
  } from '../assets';
  import {createOwnerBridge, type OwnerContext} from '../owner-bridge';

  type CardHtml = {entryId: number; cardHtml: string};

  type CkeditorProps = {
    containerId: string;
    module: string;
    css?: string | null;
    showWordCount?: boolean;
    assets?: ControlAssets;
    globals?: EditorGlobals;
    owner?: OwnerContext | null;
    cards?: CardHtml[];
  };

  const props = withDefaults(
    defineProps<{
      control: {
        props: CkeditorProps;
        path: string[];
        mode: string;
      };
      value?: string | null;
      label?: string | null;
      editable?: boolean;
      invalid?: boolean;
      required?: boolean;
    }>(),
    {value: null, label: null, editable: true, invalid: false, required: false},
  );

  const emit = defineEmits<{
    (event: 'update:value', value: string, kind: 'typing'): void;
  }>();

  // Vue templates can’t contain `<style>` tags, so render the field’s scoped CSS with a render function
  const ScopedCss = (p: {css: string}) => h('style', p.css);

  const root = ref<HTMLElement | null>(null);
  const textarea = ref<HTMLTextAreaElement | null>(null);
  const wordCount = ref<HTMLElement | null>(null);
  const error = ref<string | null>(null);
  const owner = createOwnerBridge(
    () => root.value,
    () => props.control,
  );
  let editor: any = null;
  let destroyed = false;
  // The value last emitted, so changes that don’t affect it (e.g. a refreshed entry card) aren’t emitted
  let emittedValue: string | null = null;
  let syncing = false;
  // Runs a change to the editor without emitting it as a value change
  const withoutEmitting = (fn: () => void) => {
    syncing = true;
    try {
      fn();
    } finally {
      syncing = false;
    }
  };
  // The nested entries’ card HTML, which the server sends alongside the value rather than in it
  const cards = new Map<string, string>();
  const cardHtml = (entryId: string | number) =>
    cards.get(String(entryId)) ?? null;
  const rememberCards = (list?: CardHtml[] | null) => {
    for (const {entryId, cardHtml} of list ?? []) {
      cards.set(String(entryId), cardHtml);
    }
  };
  // Whether the cards were re-sent since the last owner change, so their HTML reflects the current owner
  let cardsUpdated = false;
  rememberCards(props.control.props.cards);
  watch(
    () => props.control.props.cards,
    (html) => {
      rememberCards(html);
      cardsUpdated = true;
    },
  );

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

      textarea.value!.value = props.value ?? '';

      const module = await importModule(p.module);
      const instance = await module.default(textarea.value, {
        containerId: p.containerId,
        wordCountElement: wordCount.value,
        readOnly: props.control.mode !== 'editable',
        owner,
        cardHtml,
      });

      if (destroyed) {
        await instance.destroy();
        return;
      }

      editor = instance;
      // Start from the editor’s own output, so only real changes are emitted
      emittedValue = editor.getData();
      editor.model.document.on('change:data', () => {
        const data = editor.getData();
        const changed = data !== emittedValue;
        emittedValue = data;
        if (changed && !syncing) {
          emit('update:value', data, 'typing');
        }
      });
    } catch (e: any) {
      console.error(e);
      error.value = e?.message ?? String(e);
    }
  });

  /**
   * Replaces the editor’s content with the field’s saved value for the owner, without reporting it as a change.
   */
  const reloadValue = async (ownerId: number) => {
    const {data} = await actionClient.post('ckeditor/ckeditor/field-value', {
      ownerId,
      siteId: props.control.props.owner?.ownerSiteId ?? null,
      layoutElementUid: editor.config.get('layoutElementUid'),
    });
    if (!editor) {
      return;
    }
    rememberCards(data.cards);
    withoutEmitting(() => {
      editor.setData(data.value ?? '');
      // in-flight image uploads have placeholders in the content that the saved value doesn’t
      if (editor.plugins.has('CraftImageInsertUI')) {
        editor.plugins.get('CraftImageInsertUI').restorePlaceholders();
      }
      emittedValue = editor.getData();
    });
  };

  // When the owner changes (its draft is created, applied or discarded), the entry cards’ owner info is out of date,
  // so re-render them. Once the owner’s draft is applied, the nested entries created or copied for it get new IDs,
  // which the server adjusts the saved value for, so reload the content from there instead. The control keeps its
  // value, which doesn’t need saving again.
  watch(
    () =>
      [
        props.control.props.owner?.ownerId,
        props.control.props.owner?.ownerIsDerivative,
      ] as const,
    ([ownerId, isDerivative], [oldOwnerId, wasDerivative]) => {
      if (
        !editor ||
        !editor.plugins.has('CraftEntriesUI') ||
        (ownerId === oldOwnerId && isDerivative === wasDerivative)
      ) {
        return;
      }
      const entriesUi = editor.plugins.get('CraftEntriesUI');
      const lookup = cardsUpdated ? cardHtml : null;
      cardsUpdated = false;
      if (
        wasDerivative &&
        !isDerivative &&
        ownerId &&
        editor.config.get('layoutElementUid')
      ) {
        reloadValue(ownerId).catch((e) => {
          console.error(e);
          entriesUi.refreshCards();
        });
        return;
      }
      withoutEmitting(() => entriesUi.refreshCards(lookup));
    },
  );

  // Apply values set from outside, e.g. when the owner’s draft is discarded and its values are reset
  watch(
    () => props.value,
    (value) => {
      if (!editor || (value ?? '') === emittedValue) {
        return;
      }
      emittedValue = value ?? '';
      withoutEmitting(() => editor.setData(emittedValue));
    },
  );

  onBeforeUnmount(() => {
    destroyed = true;
    if (editor) {
      editor.destroy().catch(() => {});
      editor = null;
    }
  });
</script>

<template>
  <div
    :id="control.props.containerId"
    ref="root"
    :class="[
      'ckeditor-container',
      {'ck-with-show-word-count': control.props.showWordCount},
    ]"
  >
    <ScopedCss v-if="control.props.css" :css="control.props.css" />
    <textarea
      ref="textarea"
      class="hidden"
      :aria-label="label ?? undefined"
    ></textarea>
    <div
      v-if="control.props.showWordCount"
      ref="wordCount"
      class="ck-word-count text-quiet text-sm"
    ></div>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<style scoped>
  /* Fill the field’s input row, which `craft-field` lays out with flexbox */
  .ckeditor-container {
    flex: 1;
    min-width: 0;
  }
</style>
