/**
 * The toolbar builder, config options or custom styles setting for a CKEditor field, as a control panel
 * UI control (`ckeditor:editor-config`).
 *
 * Mounts the server-rendered settings markup, starts craft-code-editor’s Monaco editors, and emits the inputs’ values
 * (`toolbar`, `configMode`, `json`, `js`, `jsFile`, `cssMode`, `css`, `cssFile`) whenever they change. The toolbar
 * builder works with the config options, so its module runs once both parts of the same group are mounted.
 */
import {defineComponent, h, onBeforeUnmount, onMounted, ref} from 'vue';
import {applyGlobals, importModule, loadScript, loadStyle} from './assets.js';

const FIELDS = [
  'toolbar',
  'configMode',
  'json',
  'js',
  'jsFile',
  'cssMode',
  'css',
  'cssFile',
];

// Mounted parts, by group
const groups = new Map();

// Records a mounted part, and returns whether the group is now complete and its module should run
function partMounted(group, part) {
  if (!group) {
    return true;
  }
  const entry = groups.get(group) ?? {parts: new Set(), started: false};
  groups.set(group, entry);
  entry.parts.add(part);
  if (
    !entry.started &&
    entry.parts.has('toolbar') &&
    entry.parts.has('options')
  ) {
    entry.started = true;
    return true;
  }
  return false;
}

function partUnmounted(group, part) {
  const entry = group && groups.get(group);
  if (!entry) {
    return;
  }
  entry.parts.delete(part);
  if (!entry.parts.size) {
    groups.delete(group);
  }
}

function readValue(root) {
  const value = {};
  for (const name of FIELDS) {
    const input = root.querySelector(`[name="${name}"]`);
    if (!input) {
      continue;
    }
    value[name] = input.value;
  }
  if (typeof value.toolbar === 'string') {
    try {
      value.toolbar = JSON.parse(value.toolbar);
    } catch (e) {
      // leave it as-is
    }
  }
  return value;
}

function startCodeEditors(root, codeEditor) {
  const monacoOptions = {
    tabSize: 2,
    showUnused: false,
    ...(codeEditor.readOnly ? {domReadOnly: true, readOnly: true} : {}),
  };

  root.querySelectorAll('textarea[data-code-editor]').forEach((textarea) => {
    window.makeMonacoEditor(
      textarea.id,
      textarea.dataset.codeEditor,
      JSON.stringify({
        ...monacoOptions,
        language: textarea.dataset.codeEditorLanguage,
      }),
      JSON.stringify({wrapperClass: 'monaco-editor-background-frame'}),
      codeEditor.autocompleteUrl,
    );
  });

  // Register the config options JSON schema
  window.monaco?.languages?.json?.jsonDefaults?.setDiagnosticsOptions({
    validate: true,
    schemas: [
      {
        uri: codeEditor.jsonSchemaUri,
        fileMatch: [codeEditor.jsonSchemaUri],
        // a plain copy, since reactive proxies can’t be sent to Monaco’s web workers
        schema: JSON.parse(JSON.stringify(codeEditor.jsonSchema)),
      },
    ],
  });
}

export default defineComponent({
  name: 'CkeditorEditorConfigControl',
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
    const error = ref(null);
    let lastValue = null;
    let pollInterval = null;

    const sync = (kind = 'discrete') => {
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

        root.value.innerHTML = p.html;

        // Wait for the markup’s custom elements (e.g. <craft-field>) to render before starting the editors
        const customTags = [
          ...new Set(
            [...root.value.querySelectorAll('*')]
              .map((el) => el.localName)
              .filter((name) => name.includes('-')),
          ),
        ];
        await Promise.all(
          customTags.map((name) => customElements.whenDefined(name)),
        );
        await new Promise((resolve) => requestAnimationFrame(() => resolve()));

        startCodeEditors(root.value, p.codeEditor ?? {});

        // Monaco measures its container when it’s created; lay the editors out again once the field has rendered
        const relayout = () =>
          root.value
            ?.querySelectorAll('textarea[data-code-editor]')
            .forEach((textarea) =>
              window.monacoEditorInstances?.[textarea.id]?.layout(),
            );
        setTimeout(relayout, 100);
        new ResizeObserver(relayout).observe(root.value);

        if (partMounted(p.group, p.part)) {
          const module = await importModule(p.module);
          module.default();
        }

        // Record the initial state, so only real changes are emitted
        lastValue = JSON.stringify(readValue(root.value));

        // Monaco and the toolbar builder update their inputs without firing events, so check periodically too
        root.value.addEventListener('input', () => sync('typing'));
        root.value.addEventListener('change', () => sync('discrete'));
        root.value.addEventListener('click', () =>
          setTimeout(() => sync('discrete')),
        );
        root.value.addEventListener('keyup', () => sync('typing'));
        pollInterval = setInterval(() => sync('typing'), 500);
      } catch (e) {
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

    return () =>
      h(
        'div',
        {
          class: 'ckeditor-editor-config',
          style: {minWidth: 0, width: '100%'},
        },
        [
          h('div', {ref: root, style: {minWidth: 0, width: '100%'}}),
          error.value ? h('p', {class: 'error'}, error.value) : null,
        ],
      );
  },
});
