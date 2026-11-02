<script setup lang="ts">
  /**
   * The toolbar builder, config options or custom styles setting for a CKEditor field, as a control panel
   * UI control (`ckeditor:editor-config`).
   *
   * Mounts the server-rendered settings markup, starts craft-code-editor’s Monaco editors, and emits the inputs’
   * values (`toolbar`, `configMode`, `json`, `js`, `jsFile`, `cssMode`, `css`, `cssFile`) whenever they change.
   * The toolbar builder works with the config options, so its module runs once both parts of the same group
   * are mounted.
   */
  import {onBeforeUnmount, onMounted, ref} from 'vue';
  import {
    applyGlobals,
    importModule,
    loadScript,
    loadStyle,
    type ControlAssets,
    type EditorGlobals,
  } from '../assets';
  import {
    partMounted,
    partUnmounted,
    readValue,
    startCodeEditors,
    type CodeEditorSettings,
  } from '../editor-config';

  type EditorConfigProps = {
    html: string;
    module: string;
    part: string | null;
    group: string | null;
    assets?: ControlAssets;
    codeEditor?: CodeEditorSettings;
    globals?: EditorGlobals;
  };

  type EditorConfigValue = Record<string, unknown>;

  const props = withDefaults(
    defineProps<{
      control: {
        props: EditorConfigProps;
        path: string[];
        mode: string;
      };
      value?: EditorConfigValue | null;
      label?: string | null;
      editable?: boolean;
      invalid?: boolean;
      required?: boolean;
    }>(),
    {value: null, label: null, editable: true, invalid: false, required: false},
  );

  const emit = defineEmits<{
    (
      event: 'update:value',
      value: EditorConfigValue,
      kind: 'typing' | 'discrete',
    ): void;
  }>();

  const root = ref<HTMLElement | null>(null);
  const error = ref<string | null>(null);
  let lastValue: string | null = null;
  let pollInterval: ReturnType<typeof setInterval> | null = null;

  const sync = (kind: 'typing' | 'discrete' = 'discrete') => {
    if (!root.value || props.control.mode !== 'editable') {
      return;
    }
    const value = readValue(root.value);
    const serialized = JSON.stringify(value);
    if (serialized !== lastValue) {
      lastValue = serialized;
      emit('update:value', value, kind);
    }
  };

  onMounted(async () => {
    const p = props.control.props;
    const assets = p.assets ?? {};
    const el = root.value!;

    try {
      // craft-code-editor resolves its web workers relative to this, so set it before loading its scripts
      window.codeEditorBaseAssetsUrl = p.codeEditor?.baseUrl;
      applyGlobals(p.globals ?? {});
      await Promise.all((assets.styles ?? []).map((url) => loadStyle(url)));
      // craft-code-editor’s scripts depend on each other, so load them in order
      for (const url of assets.scripts ?? []) {
        await loadScript(url);
      }
      await Promise.all(
        (assets.modules ?? []).map((url) => loadScript(url, 'module')),
      );

      el.innerHTML = p.html;

      // Wait for the markup’s custom elements (e.g. <craft-button>) to render before starting the editors
      const customTags = [
        ...new Set(
          [...el.querySelectorAll('*')]
            .map((child) => child.localName)
            .filter((name) => name.includes('-')),
        ),
      ];
      await Promise.all(
        customTags.map((name) => customElements.whenDefined(name)),
      );
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );

      startCodeEditors(el, p.codeEditor ?? {});

      // Monaco measures its container when it’s created; lay the editors out again once the field has rendered
      const relayout = () =>
        root.value
          ?.querySelectorAll<HTMLTextAreaElement>('textarea[data-code-editor]')
          .forEach((textarea) =>
            window.monacoEditorInstances?.[textarea.id]?.layout(),
          );
      setTimeout(relayout, 100);
      new ResizeObserver(relayout).observe(el);

      if (partMounted(p.group, p.part)) {
        const module = await importModule(p.module);
        module.default();
      }

      // Record the initial state, so only real changes are emitted
      lastValue = JSON.stringify(readValue(el));

      // Monaco and the toolbar builder update their inputs without firing events, so check periodically too
      el.addEventListener('input', () => sync('typing'));
      el.addEventListener('change', () => sync('discrete'));
      el.addEventListener('click', () => setTimeout(() => sync('discrete')));
      el.addEventListener('keyup', () => sync('typing'));
      pollInterval = setInterval(() => sync('typing'), 500);
    } catch (e: any) {
      console.error(e);
      error.value = e?.message ?? String(e);
    }
  });

  onBeforeUnmount(() => {
    partUnmounted(props.control.props.group, props.control.props.part);
    if (pollInterval) {
      clearInterval(pollInterval);
    }
  });
</script>

<template>
  <div class="ckeditor-editor-config" style="min-width: 0; width: 100%">
    <div ref="root" style="min-width: 0; width: 100%"></div>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>
