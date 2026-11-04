/**
 * Helpers for the toolbar builder, config options and custom styles settings controls.
 */
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

export interface CodeEditorSettings {
  baseUrl?: string;
  autocompleteUrl?: string;
  jsonSchemaUri?: string;
  jsonSchema?: unknown;
  readOnly?: boolean;
}

// Mounted parts, by group
const groups = new Map<string, {parts: Set<string>; started: boolean}>();

/**
 * Records a mounted part, and returns whether its group is now complete and its module should run.
 *
 * The toolbar builder updates the config options, so the `toolbar` and `options` parts share a group.
 */
export function partMounted(
  group: string | null,
  part: string | null,
): boolean {
  if (!group || !part) {
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

export function partUnmounted(group: string | null, part: string | null): void {
  const entry = group ? groups.get(group) : undefined;
  if (!entry || !part) {
    return;
  }
  entry.parts.delete(part);
  if (!entry.parts.size) {
    groups.delete(group!);
  }
}

/**
 * Reads the settings inputs’ values.
 */
export function readValue(root: HTMLElement): Record<string, unknown> {
  const value: Record<string, unknown> = {};
  for (const name of FIELDS) {
    // <craft-textarea> hosts carry the name too, so skip them for their native textarea
    const input = root.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      `[name="${name}"]:not(craft-textarea)`,
    );
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

/**
 * Starts craft-code-editor’s Monaco editors for the settings’ code textareas.
 */
export function startCodeEditors(
  root: HTMLElement,
  codeEditor: CodeEditorSettings,
): void {
  const monacoOptions = {
    tabSize: 2,
    showUnused: false,
    ...(codeEditor.readOnly ? {domReadOnly: true, readOnly: true} : {}),
  };

  root
    .querySelectorAll<HTMLTextAreaElement>('textarea[data-code-editor]')
    .forEach((textarea) => {
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
