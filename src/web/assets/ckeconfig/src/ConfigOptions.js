/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

/** global: CKEditor5, Garnish */
import './ckeconfig.css';
import $ from 'jquery';

export default Garnish.Base.extend({
  jsonSchemaUri: null,
  language: null,
  $container: null,
  $jsonContainer: null,
  $jsContainer: null,
  jsonEditor: null,
  jsEditor: null,
  defaults: null,

  init: function (id, jsonSchemaUri) {
    this.jsonSchemaUri = jsonSchemaUri;
    this.$container = $(`#${id}`);
    this.$jsonContainer = $(`#${id}-json-container`);
    this.$jsContainer = $(`#${id}-js-container`);
    this.jsonEditor = window.monacoEditorInstances[`${id}-json`];
    this.jsEditor = window.monacoEditorInstances[`${id}-js`];
    const $languagePicker = this.$container.children('.btngroup');

    if (this.$jsonContainer.hasClass('hidden')) {
      this.language = 'js';
    } else {
      this.language = 'json';
    }

    this.defaults = {};

    let lastJsValue = null;

    new Craft.Listbox($languagePicker, {
      onChange: ($selectedOption) => {
        this.language = $selectedOption.data('language');
        switch (this.language) {
          case 'json':
            // get the js value
            lastJsValue = this.jsEditor.getModel().getValue();
            // check if the js value has any functions in it
            if (this.jsContainsFunctions(lastJsValue)) {
              // if it does - show the confirmation dialogue
              if (
                !confirm(
                  Craft.t(
                    'ckeditor',
                    'Your JavaScript config contains functions. If you switch to JSON, they will be lost. Would you like to continue?',
                  ),
                )
              ) {
                // if user cancels - go back to the previous option (js)
                let listbox = $languagePicker.data('listbox');
                listbox.$options.not('[data-language="json"]').trigger('click');
                break;
              }
            }
            // if user confirms that they want to proceed, or we don't have functions in the js value,
            // go ahead and switch
            this.$jsonContainer.removeClass('hidden');
            this.$jsContainer.addClass('hidden');
            const json = this.js2json(lastJsValue);
            lastJsValue = null;
            this.jsonEditor.getModel().setValue(json || '{\n  \n}');
            this.jsEditor.getModel().setValue('');
            break;
          case 'js':
            this.$jsonContainer.addClass('hidden');
            this.$jsContainer.removeClass('hidden');
            let js;
            // if we have the last remembered js value, it means we're switching back after cancelled confirmation,
            // so let's use it
            if (lastJsValue !== null) {
              js = lastJsValue;
              lastJsValue = null;
            } else {
              js = this.json2js(this.jsonEditor.getModel().getValue());
            }
            this.jsEditor.getModel().setValue(js || 'return {\n  \n}');
            this.jsonEditor.getModel().setValue('');
            break;
        }
      },
    });

    // Handle Paste
    this.jsonEditor.onDidPaste((ev) => {
      const pastedContent = this.jsonEditor
        .getModel()
        .getValueInRange(ev.range);
      let config;
      try {
        eval(`config = {${pastedContent}}`);
      } catch (e) {
        // oh well
        return;
      }
      const json = JSON.stringify(config, null, 2);
      const trimmed = Craft.trim(json.substring(1, json.length - 1));
      if (!trimmed) {
        return;
      }
      this.jsonEditor.executeEdits('', [
        {
          range: ev.range,
          text: trimmed,
        },
      ]);
    });
  },

  getConfig: function () {
    let json;
    if (this.language === 'json') {
      json = Craft.trim(this.jsonEditor.getModel().getValue()) || '{}';
    } else {
      const value = Craft.trim(this.jsEditor.getModel().getValue());
      json = value ? this.js2json(value) : '{}';
      if (json === false) {
        return false;
      }
    }

    try {
      const config = JSON.parse(json);
      return $.isPlainObject(config) ? config : false;
    } catch (e) {
      return false;
    }
  },

  setConfig: function (config) {
    const json = this.config2json(config);

    if (this.language === 'json') {
      this.jsonEditor.getModel().setValue(json);
    } else {
      const js = this.json2js(json);
      this.jsEditor.getModel().setValue(js || 'return {\n  \n}');
    }
  },

  addSetting: function (setting) {
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
  },

  removeSetting: function (setting) {
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
  },

  populateDefault: function (setting) {
    let schema;
    try {
      schema =
        window.monaco.languages.json.jsonDefaults.diagnosticsOptions.schemas.find(
          (s) => s.uri === this.jsonSchemaUri,
        ).schema;
    } catch (e) {
      console.warn('Couldn’t get config options JSON schema.', e);
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
  },

  replacer: function (key, value) {
    if (typeof value === 'function') {
      return '__HAS__FUNCTION__';
    }
    return value;
  },

  jsContainsFunctions: function (js) {
    let config = this.getValidJsonConfig(js);
    if (config === false) {
      return true;
    }

    let json = JSON.stringify(config, this.replacer, 2);
    if (json.match(/__HAS__FUNCTION__/)) {
      return true;
    }

    return false;
  },

  config2json: function (config) {
    let json = JSON.stringify(config, null, 2);
    if (json === '{}') {
      json = '{\n  \n}';
    }
    return json;
  },

  getValidJsonConfig: function (js) {
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
  },

  js2json: function (js) {
    let config = this.getValidJsonConfig(js);

    if (config === false) {
      return false;
    }

    return this.config2json(config);
  },

  json2js: function (json) {
    let config;
    try {
      config = JSON.parse(json);
    } catch (e) {
      return false;
    }
    if (!$.isPlainObject(config)) {
      return false;
    }
    let js = this.jsify(config, '');
    if (js === '{\n}') {
      js = '{\n  \n}';
    }
    return `return ${js}`;
  },

  jsify: function (value, indent) {
    let js;
    if ($.isArray(value)) {
      js = '[\n';
      for (const v of value) {
        js += `${indent}  ${this.jsify(v, indent + '  ')},\n`;
      }
      js += `${indent}]`;
    } else if ($.isPlainObject(value)) {
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
  },
});
