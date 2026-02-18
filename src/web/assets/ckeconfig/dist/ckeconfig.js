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
  showingInsertion: !1,
  closestItem: null,
  readOnly: !1,
  init: function(t, e, n, o = []) {
    this.$container = $(`#${t}`), this.$sourceContainer = this.$container.find(
      ".ckeditor-tb--source .ck-toolbar__items"
    ), this.$targetContainer = this.$container.find(
      ".ckeditor-tb--target .ck-toolbar__items"
    ), this.$input = this.$container.find("input"), this.value = JSON.parse(this.$input.val()), this.readOnly = $(`#${t}`).hasClass("disabled");
    const a = document.createElement("DIV"), r = document.createElement("DIV");
    a.appendChild(r), create(r, {
      linkOptions: [{ elementType: "craft\\elements\\Asset" }],
      assetSources: ["*"],
      entryTypeOptions: [{ label: "fake", value: "fake" }],
      plugins: o
    }).then((u) => {
      const h = u.ui.componentFactory;
      for (const i of h.names())
        this.components[i] = h.create(i);
      const f = JSON.parse(this.$container.attr("data-available-items"));
      for (let i = 0; i < f.length; i++) {
        const s = f[i];
        if (s.length > 1) {
          const l = this.value.findIndex(
            (c) => s.some((d) => d.button === c)
          );
          if (l !== -1) {
            for (let c = 0; c < s.length; c++)
              if (this.value[l + c] !== s[c].button) {
                f.splice(i, 1, ...s.map((d) => [d])), i += s.length - 1;
                break;
              }
          }
        }
      }
      this.readOnly ? this.drag = $() : this.drag = new Garnish.DragDrop({
        dropTargets: this.$targetContainer,
        helper: (i) => {
          const s = $(
            '<div class="offset-drag-helper ck ck-reset_all ck-editor ck-rounded-corners"/>'
          ), l = $(
            '<div class="ck ck-toolbar"/>'
          ).appendTo(s);
          return i.appendTo(l), s;
        },
        moveHelperToCursor: !0,
        onDragStart: () => {
          Garnish.$bod.addClass("dragging");
          const i = this.drag.$draggee;
          if (this.draggingSourceItem = $.contains(
            this.$sourceContainer[0],
            i[0]
          ), this.draggingSeparator = i.hasClass(
            "ckeditor-tb--separator"
          ), this.$insertion = $('<div class="ckeditor-tb--insertion"/>').css({
            width: i.outerWidth(),
            height: i.outerHeight()
          }), this.draggingSourceItem)
            if (this.draggingSeparator)
              i.css("visibility", "");
            else {
              const s = Craft.orientation === "ltr" ? "margin-right" : "margin-left", l = -1 * i.outerWidth();
              i.stop().velocity({ [s]: l }, 200, () => {
                i.addClass("hidden");
              });
            }
          else
            i.addClass("hidden"), this.$insertion.insertBefore(i), this.showingInsertion = !0;
          this.setMidpoints();
        },
        onDrag: () => {
          this.checkForNewClosestItem();
        },
        onDragStop: () => {
          Garnish.$bod.removeClass("dragging");
          let i = this.drag.$draggee;
          if (this.checkForNewClosestItem(), this.showingInsertion)
            if (this.draggingSourceItem) {
              let s;
              if (this.draggingSeparator)
                s = this.renderSeparator();
              else {
                const l = i.data("componentNames");
                s = this.renderComponentGroup(l);
                for (const c of l) {
                  const d = f.flat().find(({ button: p }) => p === c);
                  d && d.configOption && n.addSetting(d.configOption);
                }
              }
              s.data("sourceItem", i[0]), s.css("visibility", "hidden"), this.$insertion.replaceWith(s), this.drag.$draggee = s;
            } else
              this.$insertion.replaceWith(i), i.removeClass("hidden");
          else {
            if (!this.draggingSourceItem) {
              const s = $(i.data("sourceItem"));
              if (i.remove(), this.drag.$draggee = i = s, !this.draggingSeparator)
                for (const l of s.data("componentNames")) {
                  const c = f.flat().find(({ button: d }) => d === l);
                  c && c.configOption && n.removeSetting(c.configOption);
                }
            }
            if (!this.draggingSeparator) {
              i.removeClass("hidden");
              const s = Craft.orientation === "ltr" ? "margin-right" : "margin-left", l = i.css(s);
              i.css(s, "");
              const c = i.css(s);
              i.css(s, l), i.stop().velocity({ [s]: c }, 200, () => {
                i.css(s, "");
              });
            }
          }
          this.drag.returnHelpersToDraggees(), this.$items = this.$targetContainer.children(), this.value = [];
          for (const s of this.$items.toArray()) {
            const l = $(s);
            l.hasClass("ckeditor-tb--separator") ? this.value.push("|") : this.value.push(...l.data("componentNames"));
          }
          this.$input.val(JSON.stringify(this.value));
        }
      });
      const g = {};
      for (let i of f) {
        const s = this.renderComponentGroup(i);
        s && (s.appendTo(this.$sourceContainer), g[i.map((l) => l.button).join(",")] = s[0], this.value.includes(i[0].button) && s.addClass("hidden"));
      }
      g["|"] = this.renderSeparator().appendTo(
        this.$sourceContainer
      )[0], this.$items = $();
      for (let i = 0; i < this.value.length; i++) {
        const s = this.value[i];
        let l, c;
        if (s === "|")
          l = this.renderSeparator().appendTo(this.$targetContainer), c = "|";
        else {
          const d = f.find(
            (p) => p.some((C) => C.button === s)
          );
          if (!d || (l = this.renderComponentGroup(d), !l))
            continue;
          l.appendTo(this.$targetContainer), c = d.map((p) => p.button).join(","), i += d.length - 1;
        }
        l.data("sourceItem", g[c]), this.$items = this.$items.add(l);
      }
    }).catch(console.error);
  },
  renderSeparator: function() {
    const t = $(
      '<div class="ckeditor-tb--item ckeditor-tb--separator" data-cke-tooltip-text="Separator"><span class="ck ck-toolbar__separator"/></div>'
    );
    return this.readOnly ? this.drag.add(t) : this.drag.addItems(t), t;
  },
  renderComponentGroup: function(t) {
    t = t.map(
      (a) => typeof a == "string" ? a : a.button
    );
    const e = [], n = [];
    for (const a of t) {
      let r;
      try {
        r = this.renderComponent(a);
      } catch (h) {
        console.warn(h);
        continue;
      }
      e.push(r);
      const u = (r.is("[data-cke-tooltip-text]") ? r : r.find("[data-cke-tooltip-text]")).attr("data-cke-tooltip-text");
      n.push(
        u ? u.replace(/ \(.*\)$/, "") : `${a[0].toUpperCase()}${a.slice(1)}`
      );
    }
    if (!e.length)
      return !1;
    const o = $('<div class="ckeditor-tb--item"/>').append(e);
    return o.attr("data-cke-tooltip-text", n.join(", ")), o.data("componentNames", t), this.readOnly ? this.drag.add(o) : this.drag.addItems(o), o;
  },
  renderComponent: function(t) {
    const e = this.components[t];
    if (!e)
      throw `Missing component: ${t}`;
    e.isRendered || e.render();
    const n = $(e.element.outerHTML);
    return n.data("componentName", t), n;
  },
  getClosestItem: function() {
    if (!Garnish.hitTest(
      this.drag.mouseX,
      this.drag.mouseY,
      this.$targetContainer
    ))
      return !1;
    if (!this.$items.length)
      return null;
    const t = this.$items.toArray();
    this.showingInsertion && t.push(this.$insertion[0]);
    const e = t.map((a) => {
      const r = $.data(a, "midpoint");
      return Garnish.getDist(
        r.left,
        r.top,
        this.drag.mouseX,
        this.drag.mouseY
      );
    }), n = Math.min(...e), o = e.indexOf(n);
    return t[o];
  },
  checkForNewClosestItem: function() {
    const t = this.getClosestItem();
    if (t === !1) {
      this.showingInsertion && (this.$insertion.remove(), this.showingInsertion = !1);
      return;
    }
    t !== this.$insertion[0] && (t ? this.drag.mouseX < $.data(t, "midpoint").left ? this.$insertion.insertBefore(t) : this.$insertion.insertAfter(t) : this.$insertion.appendTo(this.$targetContainer), this.showingInsertion = !0, this.setMidpoints());
  },
  setMidpoints: function() {
    const t = this.$items.toArray();
    this.showingInsertion && t.push(this.$insertion[0]);
    for (const e of t) {
      const n = $(e), o = n.offset(), a = o.left + n.outerWidth() / 2, r = o.top + n.outerHeight() / 2;
      n.data("midpoint", { left: a, top: r });
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
    this.jsonSchemaUri = jsonSchemaUri, this.$container = $(`#${id}`), this.$jsonContainer = $(`#${id}-json-container`), this.$jsContainer = $(`#${id}-js-container`), this.jsonEditor = window.monacoEditorInstances[`${id}-json`], this.jsEditor = window.monacoEditorInstances[`${id}-js`];
    const $languagePicker = this.$container.children(".btngroup");
    this.$jsonContainer.hasClass("hidden") ? this.language = "js" : this.language = "json", this.defaults = {};
    let lastJsValue = null;
    new Craft.Listbox($languagePicker, {
      onChange: (t) => {
        switch (this.language = t.data("language"), this.language) {
          case "json":
            if (lastJsValue = this.jsEditor.getModel().getValue(), this.jsContainsFunctions(lastJsValue) && !confirm(
              Craft.t(
                "ckeditor",
                "Your JavaScript config contains functions. If you switch to JSON, they will be lost. Would you like to continue?"
              )
            )) {
              $languagePicker.data("listbox").$options.not('[data-language="json"]').trigger("click");
              break;
            }
            this.$jsonContainer.removeClass("hidden"), this.$jsContainer.addClass("hidden");
            const e = this.js2json(lastJsValue);
            lastJsValue = null, this.jsonEditor.getModel().setValue(e || `{
  
}`), this.jsEditor.getModel().setValue("");
            break;
          case "js":
            this.$jsonContainer.addClass("hidden"), this.$jsContainer.removeClass("hidden");
            let n;
            lastJsValue !== null ? (n = lastJsValue, lastJsValue = null) : n = this.json2js(this.jsonEditor.getModel().getValue()), this.jsEditor.getModel().setValue(n || `return {
  
}`), this.jsonEditor.getModel().setValue("");
            break;
        }
      }
    }), this.jsonEditor.onDidPaste((ev) => {
      const pastedContent = this.jsonEditor.getModel().getValueInRange(ev.range);
      let config;
      try {
        eval(`config = {${pastedContent}}`);
      } catch (t) {
        return;
      }
      const json = JSON.stringify(config, null, 2), trimmed = Craft.trim(json.substring(1, json.length - 1));
      trimmed && this.jsonEditor.executeEdits("", [
        {
          range: ev.range,
          text: trimmed
        }
      ]);
    });
  },
  getConfig: function() {
    let t;
    if (this.language === "json")
      t = Craft.trim(this.jsonEditor.getModel().getValue()) || "{}";
    else {
      const e = Craft.trim(this.jsEditor.getModel().getValue());
      if (t = e ? this.js2json(e) : "{}", t === !1)
        return !1;
    }
    try {
      const e = JSON.parse(t);
      return $.isPlainObject(e) ? e : !1;
    } catch {
      return !1;
    }
  },
  setConfig: function(t) {
    const e = this.config2json(t);
    if (this.language === "json")
      this.jsonEditor.getModel().setValue(e);
    else {
      const n = this.json2js(e);
      this.jsEditor.getModel().setValue(n || `return {
  
}`);
    }
  },
  addSetting: function(t) {
    const e = this.getConfig();
    e && (typeof e[t] < "u" || typeof this.defaults[t] > "u" && (this.populateDefault(t), typeof this.defaults[t] > "u") || (e[t] = this.defaults[t], this.setConfig(e)));
  },
  removeSetting: function(t) {
    const e = this.getConfig();
    e && (typeof e[t] > "u" || (this.defaults[t] = e[t], delete e[t], this.setConfig(e)));
  },
  populateDefault: function(t) {
    let e;
    try {
      e = window.monaco.languages.json.jsonDefaults.diagnosticsOptions.schemas.find(
        (r) => r.uri === this.jsonSchemaUri
      ).schema;
    } catch (r) {
      console.warn("Couldn’t get config options JSON schema.", r);
      return;
    }
    if (!e.$defs || !e.$defs.EditorConfig || !e.$defs.EditorConfig.properties) {
      console.warn(
        "Config options JSON schema is missing $defs.EditorConfig.properties"
      );
      return;
    }
    if (!e.$defs.EditorConfig.properties[t])
      return;
    const n = e.$defs.EditorConfig.properties[t];
    if (n.default) {
      this.defaults[t] = n.default;
      return;
    }
    if (!n.$ref)
      return;
    const o = n.$ref.match(/^#\/\$defs\/(\w+)/);
    if (!o)
      return;
    const a = o[1];
    !e.$defs[a] || !e.$defs[a].default || (this.defaults[t] = e.$defs[a].default);
  },
  replacer: function(t, e) {
    return typeof e == "function" ? "__HAS__FUNCTION__" : e;
  },
  jsContainsFunctions: function(t) {
    let e = this.getValidJsonConfig(t);
    return !!(e === !1 || JSON.stringify(e, this.replacer, 2).match(/__HAS__FUNCTION__/));
  },
  config2json: function(t) {
    let e = JSON.stringify(t, null, 2);
    return e === "{}" && (e = `{
  
}`), e;
  },
  getValidJsonConfig: function(js) {
    const m = (js || "").match(/return\s*(\{[\w\W]*})/);
    if (!m)
      return !1;
    let config;
    try {
      eval(`config = ${m[1]};`);
    } catch (t) {
      return !1;
    }
    return config;
  },
  js2json: function(t) {
    let e = this.getValidJsonConfig(t);
    return e === !1 ? !1 : this.config2json(e);
  },
  json2js: function(t) {
    let e;
    try {
      e = JSON.parse(t);
    } catch {
      return !1;
    }
    if (!$.isPlainObject(e))
      return !1;
    let n = this.jsify(e, "");
    return n === `{
}` && (n = `{
  
}`), `return ${n}`;
  },
  jsify: function(t, e) {
    let n;
    if ($.isArray(t)) {
      n = `[
`;
      for (const o of t)
        n += `${e}  ${this.jsify(o, e + "  ")},
`;
      n += `${e}]`;
    } else if ($.isPlainObject(t)) {
      n = `{
`;
      for (const [o, a] of Object.entries(t))
        n += `${e}  ${o}: ${this.jsify(a, e + "  ")},
`;
      n += `${e}}`;
    } else typeof t == "string" && !t.match(/[\r\n']/) ? n = `'${t}'` : n = JSON.stringify(t);
    return n;
  }
}), CkeEntryTypeSelectInput = Craft.EntryTypeSelectInput.extend({
  init: function(t = {}) {
    this.base(Object.assign({}, Craft.EntryTypeSelectInput.defaults, t));
  },
  getInput: function(t) {
    return t.find("input");
  },
  getConfig: function(t) {
    return JSON.parse(t.val());
  },
  getConfigFromComponent: function(t) {
    let e = this.getInput(t);
    return JSON.parse(e.val());
  },
  addComponentInternal: function(t) {
    this.on("applySettings", () => {
      this.applyIndicators(t, this.getConfigFromComponent(t));
    });
    let e = this.getInput(t), o = t.find(".action-btn").disclosureMenu().data("disclosureMenu"), [a, r] = this.getButtons(
      o,
      t,
      e
    );
    o.on("show", () => {
      let u = o.$trigger.parents(".chip"), h = this.getConfigFromComponent(u);
      o.toggleItem(a, !h.expanded), o.toggleItem(r, h.expanded);
    }), this.applyIndicators(t, this.getConfig(e)), this.base(t);
  },
  async applyConfigChange(t, e, n) {
    this.applyIndicators(t, n);
  },
  async applyIndicators(t, e) {
    var f, g;
    let n;
    try {
      n = (await Craft.sendActionRequest(
        "POST",
        "ckeditor/cke-configs/apply-entry-type-indicators",
        {
          data: {
            config: e
          }
        }
      )).data;
    } catch (i) {
      throw Craft.cp.displayError((g = (f = i == null ? void 0 : i.response) == null ? void 0 : f.data) == null ? void 0 : g.message), i;
    }
    let o = t.find(".indicators");
    const a = this.getInput(t), r = $(n.chip).find(".indicators"), u = this.getInput($(n.chip)), h = this.getConfig(u);
    if (o.length == 0) {
      const i = t.find(".chip-label");
      o = $('<div class="indicators">').appendTo(i);
    }
    o.replaceWith(r), this.updateConfig(a, h);
  },
  updateConfig: function(t, e) {
    t.val(JSON.stringify(e));
  },
  getButtons: function(t, e, n) {
    let o = t.addItem({
      icon: async () => await Craft.ui.icon("eye"),
      label: Craft.t("ckeditor", "Expand to a separate button"),
      callback: () => {
        let r = this.getConfig(n);
        r.expanded = !0, this.applyConfigChange(e, n, r);
      }
    }), a = t.addItem({
      icon: async () => await Craft.ui.icon("eye-slash"),
      label: Craft.t("ckeditor", "Collapse to a dropdown"),
      callback: () => {
        let r = this.getConfig(n);
        r.expanded = !1, this.applyConfigChange(e, n, r);
      }
    });
    return [o, a];
  }
});
export {
  CkeEntryTypeSelectInput,
  ConfigOptions,
  ToolbarBuilder
};
