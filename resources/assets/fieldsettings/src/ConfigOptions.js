/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

import './fieldsettings.css';
import {t as craftT} from '@craftcms/cp';

/** Whether a parsed config is an object literal rather than an array or null. */
const isPlainObject = (value) =>
  value !== null &&
  typeof value === 'object' &&
  [Object.prototype, null].includes(Object.getPrototypeOf(value));

export default class ConfigOptions {
  constructor(id, jsonSchemaUri, mode, hasFiles, jsonSchema = null) {
    this.jsonSchemaUri = jsonSchemaUri;
    this.jsonSchema = jsonSchema;
    this.mode = mode;
    this.lastCodeMode = mode !== 'file' ? mode : null;
    this.container = document.getElementById(id);
    this.modeInput = document.getElementById(`${id}-mode`);
    this.jsonContainer = document.getElementById(`${id}-json-container`);
    this.jsContainer = document.getElementById(`${id}-js-container`);
    this.fileContainer = document.getElementById(`${id}-file-container`);
    // TODO(code-editor): restore once craft-code-editor supports Craft 6
    // this.jsonEditor = window.monacoEditorInstances[`${id}-json`];
    // this.jsEditor = window.monacoEditorInstances[`${id}-js`];
    this.jsonEditor = document.getElementById(`${id}-json`);
    this.jsEditor = document.getElementById(`${id}-js`);
    const modePicker = this.container.querySelector(':scope > craft-listbox');

    this.defaults = {};

    const containers = [
      this.jsonContainer,
      this.jsContainer,
      this.fileContainer,
    ];

    // <craft-listbox> re-emits its listbox’s `change` event
    modePicker.addEventListener('change', (event) => {
      if (event.target !== modePicker) {
        return;
      }

      this.mode = event.detail.$selectedOption.dataset.mode;
      if (this.mode !== 'file' || hasFiles) {
        this.modeInput.value = this.mode;
      }
      containers.forEach((container) => container.classList.add('hidden'));
      switch (this.mode) {
        case 'json':
          // was JS the previously-selected non-file mode?
          if (this.lastCodeMode === 'js') {
            // get the js value
            const js = this.getValue(this.jsEditor);
            // check if the js value has any functions in it
            if (this.jsContainsFunctions(js)) {
              // if it does - show the confirmation dialogue
              if (
                !confirm(
                  craftT(
                    'Your JavaScript config contains functions. If you switch to JSON, they will be lost. Would you like to continue?',
                    {},
                    'ckeditor',
                  ),
                )
              ) {
                // if user cancels - go back to JS
                modePicker.querySelector('[data-mode="js"]')?.click();
                break;
              }
            }

            const json = this.js2json(js);
            this.setValue(this.jsonEditor, json || '{\n  \n}');
            this.setValue(this.jsEditor, '');
          }

          this.jsonContainer.classList.remove('hidden');
          break;
        case 'js':
          if (this.lastCodeMode === 'json') {
            const json = this.getValue(this.jsonEditor);
            const js = this.json2js(json);
            this.setValue(this.jsEditor, js || 'return {\n  \n}');
            this.setValue(this.jsonEditor, '');
          }
          this.jsContainer.classList.remove('hidden');
          break;
        case 'file':
          this.fileContainer.classList.remove('hidden');
          break;
      }

      if (this.mode !== 'file') {
        this.lastCodeMode = this.mode;
      }
    });

    // Handle Paste
    // TODO(code-editor): restore once craft-code-editor supports Craft 6
    // this.jsonEditor.onDidPaste((ev) => {
    //   const pastedContent = this.jsonEditor
    //     .getModel()
    //     .getValueInRange(ev.range);
    //   let config;
    //   try {
    //     eval(`config = {${pastedContent}}`);
    //   } catch (e) {
    //     // oh well
    //     return;
    //   }
    //   const json = JSON.stringify(config, null, 2);
    //   const trimmed = Craft.trim(json.substring(1, json.length - 1));
    //   if (!trimmed) {
    //     return;
    //   }
    //   this.jsonEditor.executeEdits('', [
    //     {
    //       range: ev.range,
    //       text: trimmed,
    //     },
    //   ]);
    // });
    this.jsonEditor.addEventListener('paste', (ev) => {
      const pastedContent = ev.clipboardData?.getData('text') ?? '';
      let config;
      try {
        eval(`config = {${pastedContent}}`);
      } catch (e) {
        // oh well
        return;
      }
      const json = JSON.stringify(config, null, 2);
      const trimmed = json.substring(1, json.length - 1).trim();
      if (!trimmed) {
        return;
      }
      ev.preventDefault();
      const {selectionStart, selectionEnd, value} = this.jsonEditor;
      this.setValue(
        this.jsonEditor,
        value.slice(0, selectionStart) + trimmed + value.slice(selectionEnd),
      );
      this.jsonEditor.selectionStart = this.jsonEditor.selectionEnd =
        selectionStart + trimmed.length;
    });
  }

  // TODO(code-editor): these stand in for Monaco’s getModel().getValue()/setValue() while craft-code-editor is disabled
  getValue(textarea) {
    return textarea.value;
  }

  setValue(textarea, value) {
    textarea.value = value;
    textarea.dispatchEvent(new Event('input', {bubbles: true}));
  }

  getConfig() {
    let json;
    if (this.mode === 'json') {
      json = this.getValue(this.jsonEditor).trim() || '{}';
    } else {
      const value = this.getValue(this.jsEditor).trim();
      json = value ? this.js2json(value) : '{}';
      if (json === false) {
        return false;
      }
    }

    try {
      const config = JSON.parse(json);
      return isPlainObject(config) ? config : false;
    } catch (e) {
      return false;
    }
  }

  setConfig(config) {
    const json = this.config2json(config);

    if (this.mode === 'json') {
      this.setValue(this.jsonEditor, json);
    } else {
      const js = this.json2js(json);
      this.setValue(this.jsEditor, js || 'return {\n  \n}');
    }
  }

  addSetting(setting) {
    const config = this.getConfig();
    if (!config) {
      return;
    }

    // already present?
    if (typeof config[setting] !== 'undefined') {
      return;
    }

    if (typeof this.defaults[setting] === 'undefined') {
      this.populateDefault(setting);
      if (typeof this.defaults[setting] === 'undefined') {
        return;
      }
    }

    config[setting] = this.defaults[setting];
    this.setConfig(config);
  }

  removeSetting(setting) {
    const config = this.getConfig();
    if (!config) {
      return;
    }

    // not present?
    if (typeof config[setting] === 'undefined') {
      return;
    }

    // keep track of the value in case the setting needs to be added back later
    this.defaults[setting] = config[setting];

    delete config[setting];
    this.setConfig(config);
  }

  populateDefault(setting) {
    let schema;
    // TODO(code-editor): restore once craft-code-editor supports Craft 6
    // try {
    //   schema =
    //     window.monaco.languages.json.jsonDefaults.diagnosticsOptions.schemas.find(
    //       (s) => s.uri === this.jsonSchemaUri,
    //     ).schema;
    // } catch (e) {
    //   console.warn('Couldn’t get config options JSON schema.', e);
    //   return;
    // }
    schema = this.jsonSchema;
    if (!schema) {
      console.warn('Couldn’t get config options JSON schema.');
      return;
    }

    if (
      !schema.$defs ||
      !schema.$defs.EditorConfig ||
      !schema.$defs.EditorConfig.properties
    ) {
      console.warn(
        'Config options JSON schema is missing $defs.EditorConfig.properties',
      );
      return;
    }

    if (!schema.$defs.EditorConfig.properties[setting]) {
      return;
    }

    const property = schema.$defs.EditorConfig.properties[setting];
    if (property.default) {
      this.defaults[setting] = property.default;
      return;
    }

    if (!property.$ref) {
      return;
    }

    const m = property.$ref.match(/^#\/\$defs\/(\w+)/);
    if (!m) {
      return;
    }

    const defName = m[1];
    if (!schema.$defs[defName] || !schema.$defs[defName].default) {
      return;
    }

    this.defaults[setting] = schema.$defs[defName].default;
  }

  replacer(key, value) {
    if (typeof value === 'function') {
      return '__HAS__FUNCTION__';
    }
    return value;
  }

  jsContainsFunctions(js) {
    let config = this.getValidJsonConfig(js);
    if (config === false) {
      return true;
    }

    let json = JSON.stringify(config, this.replacer, 2);
    if (json.match(/__HAS__FUNCTION__/)) {
      return true;
    }

    return false;
  }

  config2json(config) {
    let json = JSON.stringify(config, null, 2);
    if (json === '{}') {
      json = '{\n  \n}';
    }
    return json;
  }

  getValidJsonConfig(js) {
    const m = (js || '').match(/return\s*(\{[\w\W]*})/);
    if (!m) {
      return false;
    }
    let config;
    // See if it's valid JSON
    try {
      eval(`config = ${m[1]};`);
    } catch (e) {
      // oh well
      return false;
    }

    return config;
  }

  js2json(js) {
    let config = this.getValidJsonConfig(js);

    if (config === false) {
      return false;
    }

    return this.config2json(config);
  }

  json2js(json) {
    let config;
    try {
      config = JSON.parse(json);
    } catch (e) {
      return false;
    }
    if (!isPlainObject(config)) {
      return false;
    }
    let js = this.jsify(config, '');
    if (js === '{\n}') {
      js = '{\n  \n}';
    }
    return `return ${js}`;
  }

  jsify(value, indent) {
    let js;
    if (Array.isArray(value)) {
      js = '[\n';
      for (const v of value) {
        js += `${indent}  ${this.jsify(v, indent + '  ')},\n`;
      }
      js += `${indent}]`;
    } else if (isPlainObject(value)) {
      js = '{\n';
      for (const [k, v] of Object.entries(value)) {
        js += `${indent}  ${k}: ${this.jsify(v, indent + '  ')},\n`;
      }
      js += `${indent}}`;
    } else if (typeof value === 'string' && !value.match(/[\r\n']/)) {
      js = `'${value}'`;
    } else {
      js = JSON.stringify(value);
    }
    return js;
  }
}
