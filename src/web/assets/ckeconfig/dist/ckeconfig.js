import "ckeditor5";
import { create } from "@craftcms/ckeditor";
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
const ToolbarBuilder = Garnish.Base.extend({
  $sourceContainer: null,
  $targetContainer: null,
  $input: null,
  value: null,
  components: {},
  drag: null,
  $items: null,
  draggingSourceItem: null,
  draggingSeparator: null,
  $insertion: null,
  showingInsertion: false,
  closestItem: null,
  readOnly: false,
  init: function(id2, containerId, configOptions, plugins = []) {
    this.$container = $(`#${id2}`);
    this.$sourceContainer = this.$container.find(
      ".ckeditor-tb--source .ck-toolbar__items"
    );
    this.$targetContainer = this.$container.find(
      ".ckeditor-tb--target .ck-toolbar__items"
    );
    this.$input = this.$container.find("input");
    this.value = JSON.parse(this.$input.val());
    this.readOnly = $(`#${id2}`).hasClass("disabled");
    const editorContainer = document.createElement("DIV");
    const editorElement = document.createElement("DIV");
    editorContainer.appendChild(editorElement);
    create(editorElement, {
      linkOptions: [{ elementType: "craft\\elements\\Asset" }],
      assetSources: ["*"],
      entryTypeOptions: [{ label: "fake", value: "fake" }],
      plugins
    }).then((editor) => {
      const cf = editor.ui.componentFactory;
      for (const name of cf.names()) {
        this.components[name] = cf.create(name);
      }
      const items = JSON.parse(this.$container.attr("data-available-items"));
      for (let i = 0; i < items.length; i++) {
        const group = items[i];
        if (group.length > 1) {
          const index = this.value.findIndex(
            (name) => group.some((item) => item.button === name)
          );
          if (index !== -1) {
            for (let j = 0; j < group.length; j++) {
              if (this.value[index + j] !== group[j].button) {
                items.splice(i, 1, ...group.map((item) => [item]));
                i += group.length - 1;
                break;
              }
            }
          }
        }
      }
      if (!this.readOnly) {
        this.drag = new Garnish.DragDrop({
          dropTargets: this.$targetContainer,
          helper: ($item) => {
            const $outerContainer = $(
              '<div class="offset-drag-helper ck ck-reset_all ck-editor ck-rounded-corners"/>'
            );
            const $innerContainer = $(
              '<div class="ck ck-toolbar"/>'
            ).appendTo($outerContainer);
            $item.appendTo($innerContainer);
            return $outerContainer;
          },
          moveHelperToCursor: true,
          onDragStart: () => {
            Garnish.$bod.addClass("dragging");
            const $draggee = this.drag.$draggee;
            this.draggingSourceItem = $.contains(
              this.$sourceContainer[0],
              $draggee[0]
            );
            this.draggingSeparator = $draggee.hasClass(
              "ckeditor-tb--separator"
            );
            this.$insertion = $('<div class="ckeditor-tb--insertion"/>').css({
              width: $draggee.outerWidth(),
              height: $draggee.outerHeight()
            });
            if (this.draggingSourceItem) {
              if (this.draggingSeparator) {
                $draggee.css("visibility", "");
              } else {
                const property = Craft.orientation === "ltr" ? "margin-right" : "margin-left";
                const margin = -1 * $draggee.outerWidth();
                $draggee.stop().velocity({ [property]: margin }, 200, () => {
                  $draggee.addClass("hidden");
                });
              }
            } else {
              $draggee.addClass("hidden");
              this.$insertion.insertBefore($draggee);
              this.showingInsertion = true;
            }
            this.setMidpoints();
          },
          onDrag: () => {
            this.checkForNewClosestItem();
          },
          onDragStop: () => {
            Garnish.$bod.removeClass("dragging");
            let $draggee = this.drag.$draggee;
            this.checkForNewClosestItem();
            if (this.showingInsertion) {
              if (this.draggingSourceItem) {
                let $item;
                if (this.draggingSeparator) {
                  $item = this.renderSeparator();
                } else {
                  const componentNames = $draggee.data("componentNames");
                  $item = this.renderComponentGroup(componentNames);
                  for (const name of componentNames) {
                    const item = items.flat().find(({ button }) => button === name);
                    if (item && item.configOption) {
                      configOptions.addSetting(item.configOption);
                    }
                  }
                }
                $item.data("sourceItem", $draggee[0]);
                $item.css("visibility", "hidden");
                this.$insertion.replaceWith($item);
                this.drag.$draggee = $item;
              } else {
                this.$insertion.replaceWith($draggee);
                $draggee.removeClass("hidden");
              }
            } else {
              if (!this.draggingSourceItem) {
                const $sourceItem = $($draggee.data("sourceItem"));
                $draggee.remove();
                this.drag.$draggee = $draggee = $sourceItem;
                if (!this.draggingSeparator) {
                  for (const name of $sourceItem.data("componentNames")) {
                    const item = items.flat().find(({ button }) => button === name);
                    if (item && item.configOption) {
                      configOptions.removeSetting(item.configOption);
                    }
                  }
                }
              }
              if (!this.draggingSeparator) {
                $draggee.removeClass("hidden");
                const property = Craft.orientation === "ltr" ? "margin-right" : "margin-left";
                const currentMargin = $draggee.css(property);
                $draggee.css(property, "");
                const targetMargin = $draggee.css(property);
                $draggee.css(property, currentMargin);
                $draggee.stop().velocity({ [property]: targetMargin }, 200, () => {
                  $draggee.css(property, "");
                });
              }
            }
            this.drag.returnHelpersToDraggees();
            this.$items = this.$targetContainer.children();
            this.value = [];
            for (const item of this.$items.toArray()) {
              const $item = $(item);
              if ($item.hasClass("ckeditor-tb--separator")) {
                this.value.push("|");
              } else {
                this.value.push(...$item.data("componentNames"));
              }
            }
            this.$input.val(JSON.stringify(this.value));
          }
        });
      } else {
        this.drag = $();
      }
      const sourceItems = {};
      for (let group of items) {
        const $item = this.renderComponentGroup(group);
        if (!$item) {
          continue;
        }
        $item.appendTo(this.$sourceContainer);
        sourceItems[group.map((item) => item.button).join(",")] = $item[0];
        if (this.value.includes(group[0].button)) {
          $item.addClass("hidden");
        }
      }
      sourceItems["|"] = this.renderSeparator().appendTo(
        this.$sourceContainer
      )[0];
      this.$items = $();
      for (let i = 0; i < this.value.length; i++) {
        const name = this.value[i];
        let $item, key;
        if (name === "|") {
          $item = this.renderSeparator().appendTo(this.$targetContainer);
          key = "|";
        } else {
          const group = items.find(
            (group2) => group2.some((item) => item.button === name)
          );
          if (!group) {
            continue;
          }
          $item = this.renderComponentGroup(group);
          if (!$item) {
            continue;
          }
          $item.appendTo(this.$targetContainer);
          key = group.map((item) => item.button).join(",");
          i += group.length - 1;
        }
        $item.data("sourceItem", sourceItems[key]);
        this.$items = this.$items.add($item);
      }
    }).catch(console.error);
  },
  renderSeparator: function() {
    const $separator = $(
      '<div class="ckeditor-tb--item ckeditor-tb--separator" data-cke-tooltip-text="Separator"><span class="ck ck-toolbar__separator"/></div>'
    );
    if (!this.readOnly) {
      this.drag.addItems($separator);
    } else {
      this.drag.add($separator);
    }
    return $separator;
  },
  renderComponentGroup: function(group) {
    group = group.map(
      (item) => typeof item === "string" ? item : item.button
    );
    const elements = [];
    const tooltips = [];
    for (const name of group) {
      let $element;
      try {
        $element = this.renderComponent(name);
      } catch (e) {
        console.warn(e);
        continue;
      }
      elements.push($element);
      const tooltip = ($element.is("[data-cke-tooltip-text]") ? $element : $element.find("[data-cke-tooltip-text]")).attr("data-cke-tooltip-text");
      tooltips.push(
        tooltip ? tooltip.replace(/ \(.*\)$/, "") : `${name[0].toUpperCase()}${name.slice(1)}`
      );
    }
    if (!elements.length) {
      return false;
    }
    const $item = $('<div class="ckeditor-tb--item"/>').append(elements);
    $item.attr("data-cke-tooltip-text", tooltips.join(", "));
    $item.data("componentNames", group);
    if (!this.readOnly) {
      this.drag.addItems($item);
    } else {
      this.drag.add($item);
    }
    return $item;
  },
  renderComponent: function(name) {
    const component = this.components[name];
    if (!component) {
      throw `Missing component: ${name}`;
    }
    if (!component.isRendered) {
      component.render();
    }
    const $element = $(component.element.outerHTML);
    $element.data("componentName", name);
    return $element;
  },
  getClosestItem: function() {
    if (!Garnish.hitTest(
      this.drag.mouseX,
      this.drag.mouseY,
      this.$targetContainer
    )) {
      return false;
    }
    if (!this.$items.length) {
      return null;
    }
    const items = this.$items.toArray();
    if (this.showingInsertion) {
      items.push(this.$insertion[0]);
    }
    const mouseDiffs = items.map((item) => {
      const midpoint = $.data(item, "midpoint");
      return Garnish.getDist(
        midpoint.left,
        midpoint.top,
        this.drag.mouseX,
        this.drag.mouseY
      );
    });
    const minMouseDiff = Math.min(...mouseDiffs);
    const index = mouseDiffs.indexOf(minMouseDiff);
    return items[index];
  },
  checkForNewClosestItem: function() {
    const closestItem = this.getClosestItem();
    if (closestItem === false) {
      if (this.showingInsertion) {
        this.$insertion.remove();
        this.showingInsertion = false;
      }
      return;
    }
    if (closestItem === this.$insertion[0]) {
      return;
    }
    if (!closestItem) {
      this.$insertion.appendTo(this.$targetContainer);
    } else if (this.drag.mouseX < $.data(closestItem, "midpoint").left) {
      this.$insertion.insertBefore(closestItem);
    } else {
      this.$insertion.insertAfter(closestItem);
    }
    this.showingInsertion = true;
    this.setMidpoints();
  },
  setMidpoints: function() {
    const items = this.$items.toArray();
    if (this.showingInsertion) {
      items.push(this.$insertion[0]);
    }
    for (const item of items) {
      const $item = $(item);
      const offset = $item.offset();
      const left = offset.left + $item.outerWidth() / 2;
      const top = offset.top + $item.outerHeight() / 2;
      $item.data("midpoint", { left, top });
    }
  }
});
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
const ConfigOptions = Garnish.Base.extend({
  jsonSchemaUri: null,
  language: null,
  $container: null,
  $jsonContainer: null,
  $jsContainer: null,
  jsonEditor: null,
  jsEditor: null,
  defaults: null,
  init: function(id, jsonSchemaUri) {
    this.jsonSchemaUri = jsonSchemaUri;
    this.$container = $(`#${id}`);
    this.$jsonContainer = $(`#${id}-json-container`);
    this.$jsContainer = $(`#${id}-js-container`);
    this.jsonEditor = window.monacoEditorInstances[`${id}-json`];
    this.jsEditor = window.monacoEditorInstances[`${id}-js`];
    const $languagePicker = this.$container.children(".btngroup");
    if (this.$jsonContainer.hasClass("hidden")) {
      this.language = "js";
    } else {
      this.language = "json";
    }
    this.defaults = {};
    let lastJsValue = null;
    new Craft.Listbox($languagePicker, {
      onChange: ($selectedOption) => {
        this.language = $selectedOption.data("language");
        switch (this.language) {
          case "json":
            lastJsValue = this.jsEditor.getModel().getValue();
            if (this.jsContainsFunctions(lastJsValue)) {
              if (!confirm(
                Craft.t(
                  "ckeditor",
                  "Your JavaScript config contains functions. If you switch to JSON, they will be lost. Would you like to continue?"
                )
              )) {
                let listbox = $languagePicker.data("listbox");
                listbox.$options.not('[data-language="json"]').trigger("click");
                break;
              }
            }
            this.$jsonContainer.removeClass("hidden");
            this.$jsContainer.addClass("hidden");
            const json2 = this.js2json(lastJsValue);
            lastJsValue = null;
            this.jsonEditor.getModel().setValue(json2 || "{\n  \n}");
            this.jsEditor.getModel().setValue("");
            break;
          case "js":
            this.$jsonContainer.addClass("hidden");
            this.$jsContainer.removeClass("hidden");
            let js2;
            if (lastJsValue !== null) {
              js2 = lastJsValue;
              lastJsValue = null;
            } else {
              js2 = this.json2js(this.jsonEditor.getModel().getValue());
            }
            this.jsEditor.getModel().setValue(js2 || "return {\n  \n}");
            this.jsonEditor.getModel().setValue("");
            break;
        }
      }
    });
    this.jsonEditor.onDidPaste((ev) => {
      const pastedContent = this.jsonEditor.getModel().getValueInRange(ev.range);
      let config;
      try {
        eval(`config = {${pastedContent}}`);
      } catch (e) {
        return;
      }
      const json = JSON.stringify(config, null, 2);
      const trimmed = Craft.trim(json.substring(1, json.length - 1));
      if (!trimmed) {
        return;
      }
      this.jsonEditor.executeEdits("", [
        {
          range: ev.range,
          text: trimmed
        }
      ]);
    });
  },
  getConfig: function() {
    let json2;
    if (this.language === "json") {
      json2 = Craft.trim(this.jsonEditor.getModel().getValue()) || "{}";
    } else {
      const value = Craft.trim(this.jsEditor.getModel().getValue());
      json2 = value ? this.js2json(value) : "{}";
      if (json2 === false) {
        return false;
      }
    }
    try {
      const config2 = JSON.parse(json2);
      return $.isPlainObject(config2) ? config2 : false;
    } catch (e) {
      return false;
    }
  },
  setConfig: function(config2) {
    const json2 = this.config2json(config2);
    if (this.language === "json") {
      this.jsonEditor.getModel().setValue(json2);
    } else {
      const js2 = this.json2js(json2);
      this.jsEditor.getModel().setValue(js2 || "return {\n  \n}");
    }
  },
  addSetting: function(setting) {
    const config2 = this.getConfig();
    if (!config2) {
      return;
    }
    if (typeof config2[setting] !== "undefined") {
      return;
    }
    if (typeof this.defaults[setting] === "undefined") {
      this.populateDefault(setting);
      if (typeof this.defaults[setting] === "undefined") {
        return;
      }
    }
    config2[setting] = this.defaults[setting];
    this.setConfig(config2);
  },
  removeSetting: function(setting) {
    const config2 = this.getConfig();
    if (!config2) {
      return;
    }
    if (typeof config2[setting] === "undefined") {
      return;
    }
    this.defaults[setting] = config2[setting];
    delete config2[setting];
    this.setConfig(config2);
  },
  populateDefault: function(setting) {
    let schema;
    try {
      schema = window.monaco.languages.json.jsonDefaults.diagnosticsOptions.schemas.find(
        (s) => s.uri === this.jsonSchemaUri
      ).schema;
    } catch (e) {
      console.warn("Couldn’t get config options JSON schema.", e);
      return;
    }
    if (!schema.$defs || !schema.$defs.EditorConfig || !schema.$defs.EditorConfig.properties) {
      console.warn(
        "Config options JSON schema is missing $defs.EditorConfig.properties"
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
    const m2 = property.$ref.match(/^#\/\$defs\/(\w+)/);
    if (!m2) {
      return;
    }
    const defName = m2[1];
    if (!schema.$defs[defName] || !schema.$defs[defName].default) {
      return;
    }
    this.defaults[setting] = schema.$defs[defName].default;
  },
  replacer: function(key, value) {
    if (typeof value === "function") {
      return "__HAS__FUNCTION__";
    }
    return value;
  },
  jsContainsFunctions: function(js2) {
    let config2 = this.getValidJsonConfig(js2);
    if (config2 === false) {
      return true;
    }
    let json2 = JSON.stringify(config2, this.replacer, 2);
    if (json2.match(/__HAS__FUNCTION__/)) {
      return true;
    }
    return false;
  },
  config2json: function(config2) {
    let json2 = JSON.stringify(config2, null, 2);
    if (json2 === "{}") {
      json2 = "{\n  \n}";
    }
    return json2;
  },
  getValidJsonConfig: function(js) {
    const m = (js || "").match(/return\s*(\{[\w\W]*})/);
    if (!m) {
      return false;
    }
    let config;
    try {
      eval(`config = ${m[1]};`);
    } catch (e) {
      return false;
    }
    return config;
  },
  js2json: function(js2) {
    let config2 = this.getValidJsonConfig(js2);
    if (config2 === false) {
      return false;
    }
    return this.config2json(config2);
  },
  json2js: function(json2) {
    let config2;
    try {
      config2 = JSON.parse(json2);
    } catch (e) {
      return false;
    }
    if (!$.isPlainObject(config2)) {
      return false;
    }
    let js2 = this.jsify(config2, "");
    if (js2 === "{\n}") {
      js2 = "{\n  \n}";
    }
    return `return ${js2}`;
  },
  jsify: function(value, indent) {
    let js2;
    if ($.isArray(value)) {
      js2 = "[\n";
      for (const v of value) {
        js2 += `${indent}  ${this.jsify(v, indent + "  ")},
`;
      }
      js2 += `${indent}]`;
    } else if ($.isPlainObject(value)) {
      js2 = "{\n";
      for (const [k, v] of Object.entries(value)) {
        js2 += `${indent}  ${k}: ${this.jsify(v, indent + "  ")},
`;
      }
      js2 += `${indent}}`;
    } else if (typeof value === "string" && !value.match(/[\r\n']/)) {
      js2 = `'${value}'`;
    } else {
      js2 = JSON.stringify(value);
    }
    return js2;
  }
});
const CkeEntryTypeSelectInput = Craft.EntryTypeSelectInput.extend(
  {
    init: function(settings = {}) {
      this.base(
        Object.assign({}, Craft.EntryTypeSelectInput.defaults, settings)
      );
    },
    addComponentInternal: function($component) {
      let $input = $component.find('input[name$="entryTypes[]"]');
      let config2 = JSON.parse($input.val());
      let $actionBtn = $component.find(".action-btn");
      let disclosureMenu = $actionBtn.disclosureMenu().data("disclosureMenu");
      let expandBtn, collapseBtn, withColorBtn, withoutColorBtn, withIconBtn, withoutIconBtn, withTextBtn, withoutTextBtn;
      expandBtn = disclosureMenu.addItem({
        icon: async () => await Craft.ui.icon("eye"),
        label: Craft.t("ckeditor", "Expand to a separate button"),
        callback: () => {
          config2.expanded = true;
          this.applyConfigChange($component, $input, config2);
        }
      });
      collapseBtn = disclosureMenu.addItem({
        icon: async () => await Craft.ui.icon("eye-slash"),
        label: Craft.t("ckeditor", "Collapse to a dropdown"),
        callback: () => {
          config2.expanded = false;
          this.applyConfigChange($component, $input, config2);
        }
      });
      withColorBtn = disclosureMenu.addItem({
        icon: async () => await Craft.ui.icon("brush"),
        label: Craft.t("ckeditor", "Show with color"),
        callback: () => {
          config2.withColor = true;
          this.applyConfigChange($component, $input, config2);
        }
      });
      withoutColorBtn = disclosureMenu.addItem({
        icon: async () => await Craft.ui.icon("xmark"),
        label: Craft.t("ckeditor", "Show without color"),
        callback: () => {
          config2.withColor = false;
          this.applyConfigChange($component, $input, config2);
        }
      });
      withIconBtn = disclosureMenu.addItem({
        icon: async () => await Craft.ui.icon("image"),
        label: Craft.t("ckeditor", "Show with icon"),
        callback: () => {
          config2.withIcon = true;
          this.applyConfigChange($component, $input, config2);
        }
      });
      withoutIconBtn = disclosureMenu.addItem({
        icon: async () => await Craft.ui.icon("xmark"),
        label: Craft.t("ckeditor", "Show without icon"),
        callback: () => {
          config2.withIcon = false;
          this.applyConfigChange($component, $input, config2);
        }
      });
      withTextBtn = disclosureMenu.addItem({
        icon: async () => await Craft.ui.icon("t"),
        label: Craft.t("ckeditor", "Show with text"),
        callback: () => {
          config2.withText = true;
          this.applyConfigChange($component, $input, config2);
        }
      });
      withoutTextBtn = disclosureMenu.addItem({
        icon: async () => await Craft.ui.icon("xmark"),
        label: Craft.t("ckeditor", "Show without text"),
        callback: () => {
          config2.withText = false;
          this.applyConfigChange($component, $input, config2);
        }
      });
      disclosureMenu.on("show", () => {
        disclosureMenu.toggleItem(expandBtn, !config2.expanded);
        disclosureMenu.toggleItem(collapseBtn, config2.expanded);
        disclosureMenu.toggleItem(withColorBtn, !config2.withColor);
        disclosureMenu.toggleItem(withoutColorBtn, config2.withColor);
        disclosureMenu.toggleItem(withIconBtn, !config2.withIcon);
        disclosureMenu.toggleItem(withoutIconBtn, config2.withIcon);
        disclosureMenu.toggleItem(withTextBtn, !config2.withText);
        disclosureMenu.toggleItem(withoutTextBtn, config2.withText);
      });
      this.base($component);
    },
    async applyConfigChange($component, $input, config2) {
      this.applyIndicators($component, config2).then(() => {
        this.updateConfig($input, config2);
      });
    },
    async applyIndicators($component, config2) {
      var _a, _b;
      let data;
      try {
        const response = await Craft.sendActionRequest(
          "POST",
          "ckeditor/cke-configs/apply-entry-type-indicators",
          {
            data: {
              config: config2
            }
          }
        );
        data = response.data;
      } catch (e) {
        Craft.cp.displayError((_b = (_a = e == null ? void 0 : e.response) == null ? void 0 : _a.data) == null ? void 0 : _b.message);
        throw e;
      }
      const $oldIndicators = $component.find(".indicators");
      const $newIndicators = $(data.chip).find(".indicators");
      $oldIndicators.replaceWith($newIndicators);
    },
    updateConfig: function($input, config2) {
      $input.val(JSON.stringify(config2));
    }
  },
  {
    defaults: {
      allowOverrides: false
    }
  }
);
export {
  CkeEntryTypeSelectInput,
  ConfigOptions,
  ToolbarBuilder
};
