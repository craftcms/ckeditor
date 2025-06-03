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
    const l = document.createElement("DIV"), c = document.createElement("DIV");
    l.appendChild(c), create(c, {
      linkOptions: [{ elementType: "craft\\elements\\Asset" }],
      assetSources: ["*"],
      entryTypeOptions: [{ label: "fake", value: "fake" }],
      plugins: o
    }).then((f) => {
      const g = f.ui.componentFactory;
      for (const s of g.names())
        this.components[s] = g.create(s);
      const d = JSON.parse(this.$container.attr("data-available-items"));
      for (let s = 0; s < d.length; s++) {
        const i = d[s];
        if (i.length > 1) {
          const a = this.value.findIndex(
            (r) => i.some((h) => h.button === r)
          );
          if (a !== -1) {
            for (let r = 0; r < i.length; r++)
              if (this.value[a + r] !== i[r].button) {
                d.splice(s, 1, ...i.map((h) => [h])), s += i.length - 1;
                break;
              }
          }
        }
      }
      this.readOnly ? this.drag = $() : this.drag = new Garnish.DragDrop({
        dropTargets: this.$targetContainer,
        helper: (s) => {
          const i = $(
            '<div class="offset-drag-helper ck ck-reset_all ck-editor ck-rounded-corners"/>'
          ), a = $(
            '<div class="ck ck-toolbar"/>'
          ).appendTo(i);
          return s.appendTo(a), i;
        },
        moveHelperToCursor: !0,
        onDragStart: () => {
          Garnish.$bod.addClass("dragging");
          const s = this.drag.$draggee;
          if (this.draggingSourceItem = $.contains(
            this.$sourceContainer[0],
            s[0]
          ), this.draggingSeparator = s.hasClass(
            "ckeditor-tb--separator"
          ), this.$insertion = $('<div class="ckeditor-tb--insertion"/>').css({
            width: s.outerWidth(),
            height: s.outerHeight()
          }), this.draggingSourceItem)
            if (this.draggingSeparator)
              s.css("visibility", "");
            else {
              const i = Craft.orientation === "ltr" ? "margin-right" : "margin-left", a = -1 * s.outerWidth();
              s.stop().velocity({ [i]: a }, 200, () => {
                s.addClass("hidden");
              });
            }
          else
            s.addClass("hidden"), this.$insertion.insertBefore(s), this.showingInsertion = !0;
          this.setMidpoints();
        },
        onDrag: () => {
          this.checkForNewClosestItem();
        },
        onDragStop: () => {
          Garnish.$bod.removeClass("dragging");
          let s = this.drag.$draggee;
          if (this.checkForNewClosestItem(), this.showingInsertion)
            if (this.draggingSourceItem) {
              let i;
              if (this.draggingSeparator)
                i = this.renderSeparator();
              else {
                const a = s.data("componentNames");
                i = this.renderComponentGroup(a);
                for (const r of a) {
                  const h = d.flat().find(({ button: p }) => p === r);
                  h && h.configOption && n.addSetting(h.configOption);
                }
              }
              i.data("sourceItem", s[0]), i.css("visibility", "hidden"), this.$insertion.replaceWith(i), this.drag.$draggee = i;
            } else
              this.$insertion.replaceWith(s), s.removeClass("hidden");
          else {
            if (!this.draggingSourceItem) {
              const i = $(s.data("sourceItem"));
              if (s.remove(), this.drag.$draggee = s = i, !this.draggingSeparator)
                for (const a of i.data("componentNames")) {
                  const r = d.flat().find(({ button: h }) => h === a);
                  r && r.configOption && n.removeSetting(r.configOption);
                }
            }
            if (!this.draggingSeparator) {
              s.removeClass("hidden");
              const i = Craft.orientation === "ltr" ? "margin-right" : "margin-left", a = s.css(i);
              s.css(i, "");
              const r = s.css(i);
              s.css(i, a), s.stop().velocity({ [i]: r }, 200, () => {
                s.css(i, "");
              });
            }
          }
          this.drag.returnHelpersToDraggees(), this.$items = this.$targetContainer.children(), this.value = [];
          for (const i of this.$items.toArray()) {
            const a = $(i);
            a.hasClass("ckeditor-tb--separator") ? this.value.push("|") : this.value.push(...a.data("componentNames"));
          }
          this.$input.val(JSON.stringify(this.value));
        }
      });
      const u = {};
      for (let s of d) {
        const i = this.renderComponentGroup(s);
        i && (i.appendTo(this.$sourceContainer), u[s.map((a) => a.button).join(",")] = i[0], this.value.includes(s[0].button) && i.addClass("hidden"));
      }
      u["|"] = this.renderSeparator().appendTo(
        this.$sourceContainer
      )[0], this.$items = $();
      for (let s = 0; s < this.value.length; s++) {
        const i = this.value[s];
        let a, r;
        if (i === "|")
          a = this.renderSeparator().appendTo(this.$targetContainer), r = "|";
        else {
          const h = d.find(
            (p) => p.some((C) => C.button === i)
          );
          if (!h || (a = this.renderComponentGroup(h), !a))
            continue;
          a.appendTo(this.$targetContainer), r = h.map((p) => p.button).join(","), s += h.length - 1;
        }
        a.data("sourceItem", u[r]), this.$items = this.$items.add(a);
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
      (l) => typeof l == "string" ? l : l.button
    );
    const e = [], n = [];
    for (const l of t) {
      let c;
      try {
        c = this.renderComponent(l);
      } catch (g) {
        console.warn(g);
        continue;
      }
      e.push(c);
      const f = (c.is("[data-cke-tooltip-text]") ? c : c.find("[data-cke-tooltip-text]")).attr("data-cke-tooltip-text");
      n.push(
        f ? f.replace(/ \(.*\)$/, "") : `${l[0].toUpperCase()}${l.slice(1)}`
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
    const e = t.map((l) => {
      const c = $.data(l, "midpoint");
      return Garnish.getDist(
        c.left,
        c.top,
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
      const n = $(e), o = n.offset(), l = o.left + n.outerWidth() / 2, c = o.top + n.outerHeight() / 2;
      n.data("midpoint", { left: l, top: c });
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
        (c) => c.uri === this.jsonSchemaUri
      ).schema;
    } catch (c) {
      console.warn("Couldn’t get config options JSON schema.", c);
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
    const l = o[1];
    !e.$defs[l] || !e.$defs[l].default || (this.defaults[t] = e.$defs[l].default);
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
      for (const [o, l] of Object.entries(t))
        n += `${e}  ${o}: ${this.jsify(l, e + "  ")},
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
    let e = this.getInput(t), o = t.find(".action-btn").disclosureMenu().data("disclosureMenu"), [
      l,
      c,
      f,
      g,
      d,
      u,
      s,
      i
    ] = this.getButtons(o, t, e);
    o.on("show", () => {
      let a = o.$trigger.parents(".chip"), r = this.getConfigFromComponent(a);
      o.toggleItem(l, !r.expanded), o.toggleItem(c, r.expanded), o.toggleItem(f, !r.withColor), o.toggleItem(g, r.withColor), o.toggleItem(d, !r.withIcon), o.toggleItem(u, r.withIcon), o.toggleItem(s, !r.withText), o.toggleItem(i, r.withText);
    }), this.applyIndicators(t, this.getConfig(e)), this.base(t);
  },
  async applyConfigChange(t, e, n) {
    this.applyIndicators(t, n);
  },
  async applyIndicators(t, e) {
    var d, u;
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
    } catch (s) {
      throw Craft.cp.displayError((u = (d = s == null ? void 0 : s.response) == null ? void 0 : d.data) == null ? void 0 : u.message), s;
    }
    let o = t.find(".indicators");
    const l = this.getInput(t), c = $(n.chip).find(".indicators"), f = this.getInput($(n.chip)), g = this.getConfig(f);
    if (o.length == 0) {
      const s = t.find(".chip-label");
      o = $('<div class="indicators">').appendTo(s);
    }
    o.replaceWith(c), this.updateConfig(l, g);
  },
  updateConfig: function(t, e) {
    t.val(JSON.stringify(e));
  },
  getButtons: function(t, e, n) {
    let o = t.addItem({
      icon: async () => await Craft.ui.icon("eye"),
      label: Craft.t("ckeditor", "Expand to a separate button"),
      callback: () => {
        let i = this.getConfig(n);
        i.expanded = !0, this.applyConfigChange(e, n, i);
      }
    }), l = t.addItem({
      icon: async () => await Craft.ui.icon("eye-slash"),
      label: Craft.t("ckeditor", "Collapse to a dropdown"),
      callback: () => {
        let i = this.getConfig(n);
        i.expanded = !1, this.applyConfigChange(e, n, i);
      }
    }), c = t.addItem({
      icon: async () => await Craft.ui.icon("brush"),
      label: Craft.t("ckeditor", "Show with color"),
      callback: () => {
        let i = this.getConfig(n);
        i.withColor = !0, this.applyConfigChange(e, n, i);
      }
    }), f = t.addItem({
      icon: async () => await Craft.ui.icon("xmark"),
      label: Craft.t("ckeditor", "Show without color"),
      callback: () => {
        let i = this.getConfig(n);
        i.withColor = !1, this.applyConfigChange(e, n, i);
      }
    }), g = t.addItem({
      icon: async () => await Craft.ui.icon("image"),
      label: Craft.t("ckeditor", "Show with icon"),
      callback: () => {
        let i = this.getConfig(n);
        i.withIcon = !0, this.applyConfigChange(e, n, i);
      }
    }), d = t.addItem({
      icon: async () => await Craft.ui.icon("xmark"),
      label: Craft.t("ckeditor", "Show without icon"),
      callback: () => {
        let i = this.getConfig(n);
        i.withIcon = !1, this.applyConfigChange(e, n, i);
      }
    }), u = t.addItem({
      icon: async () => await Craft.ui.icon("t"),
      label: Craft.t("ckeditor", "Show with text"),
      callback: () => {
        let i = this.getConfig(n);
        i.withText = !0, this.applyConfigChange(e, n, i);
      }
    }), s = t.addItem({
      icon: async () => await Craft.ui.icon("xmark"),
      label: Craft.t("ckeditor", "Show without text"),
      callback: () => {
        let i = this.getConfig(n);
        i.withText = !1, this.applyConfigChange(e, n, i);
      }
    });
    return [
      o,
      l,
      c,
      f,
      g,
      d,
      u,
      s
    ];
  }
});
export {
  CkeEntryTypeSelectInput,
  ConfigOptions,
  ToolbarBuilder
};
