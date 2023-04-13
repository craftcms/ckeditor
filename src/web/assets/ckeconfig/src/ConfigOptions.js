/** global: Ckeditor, Garnish */
import './ckeconfig.css';
import $ from 'jquery';

export default Garnish.Base.extend({
  $container: null,
  $jsonContainer: null,
  $jsContainer: null,
  jsonEditor: null,
  jsEditor: null,

  init: function (id) {
    this.$container = $(`#${id}`);
    this.$jsonContainer = $(`#${id}-json-container`);
    this.$jsContainer = $(`#${id}-js-container`);
    this.jsonEditor = window.monacoEditorInstances[`${id}-json`];
    this.jsEditor = window.monacoEditorInstances[`${id}-js`];
    const $languagePicker = this.$container.children('.btngroup');

    new Craft.Listbox($languagePicker, {
      onChange: ($selectedOption) => {
        const language = $selectedOption.data('language');
        switch (language) {
          case 'json':
            this.$jsonContainer.removeClass('hidden');
            this.$jsContainer.addClass('hidden');
            const json = this.js2json(this.jsEditor.getModel().getValue());
            this.jsonEditor.getModel().setValue(json || '{\n  \n}');
            this.jsEditor.getModel().setValue('');
            break;
          case 'js':
            this.$jsonContainer.addClass('hidden');
            this.$jsContainer.removeClass('hidden');
            const js = this.json2js(this.jsonEditor.getModel().getValue());
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

  js2json: function (js) {
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
    let json = JSON.stringify(config, null, 2);
    if (json === '{}') {
      json = '{\n  \n}';
    }
    return json;
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
