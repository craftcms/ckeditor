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
  init: function(t, e, n = []) {
    this.$container = $(`#${t}`), this.$sourceContainer = this.$container.find(
      ".ckeditor-tb--source .ck-toolbar__items"
    ), this.$targetContainer = this.$container.find(
      ".ckeditor-tb--target .ck-toolbar__items"
    ), this.$input = this.$container.find("input"), this.value = JSON.parse(this.$input.val()), this.readOnly = $(`#${t}`).hasClass("disabled");
    const o = document.createElement("DIV"), r = document.createElement("DIV");
    o.appendChild(r), create(r, {
      linkOptions: [{ elementType: "craft\\elements\\Asset" }],
      imageSources: ["*"],
      entryTypeOptions: [{ label: "fake", value: "fake" }],
      plugins: n
    }).then((a) => {
      const h = a.ui.componentFactory;
      for (const i of h.names())
        this.components[i] = h.create(i);
      const c = JSON.parse(this.$container.attr("data-available-items"));
      for (let i = 0; i < c.length; i++) {
        const s = c[i];
        if (s.length > 1) {
          const d = this.value.findIndex(
            (l) => s.some((f) => f.button === l)
          );
          if (d !== -1) {
            for (let l = 0; l < s.length; l++)
              if (this.value[d + l] !== s[l].button) {
                c.splice(i, 1, ...s.map((f) => [f])), i += s.length - 1;
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
          ), d = $(
            '<div class="ck ck-toolbar"/>'
          ).appendTo(s);
          return i.appendTo(d), s;
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
              const s = Craft.orientation === "ltr" ? "margin-right" : "margin-left", d = -1 * i.outerWidth();
              i.stop().velocity({ [s]: d }, 200, () => {
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
                const d = i.data("componentNames");
                s = this.renderComponentGroup(d);
                for (const l of d) {
                  const f = c.flat().find(({ button: g }) => g === l);
                  f && f.configOption && e.addSetting(f.configOption);
                }
              }
              s.data("sourceItem", i[0]), s.css("visibility", "hidden"), this.$insertion.replaceWith(s), this.drag.$draggee = s;
            } else
              this.$insertion.replaceWith(i), i.removeClass("hidden");
          else {
            if (!this.draggingSourceItem) {
              const s = $(i.data("sourceItem"));
              if (i.remove(), this.drag.$draggee = i = s, !this.draggingSeparator)
                for (const d of s.data("componentNames")) {
                  const l = c.flat().find(({ button: f }) => f === d);
                  l && l.configOption && e.removeSetting(l.configOption);
                }
            }
            if (!this.draggingSeparator) {
              i.removeClass("hidden");
              const s = Craft.orientation === "ltr" ? "margin-right" : "margin-left", d = i.css(s);
              i.css(s, "");
              const l = i.css(s);
              i.css(s, d), i.stop().velocity({ [s]: l }, 200, () => {
                i.css(s, "");
              });
            }
          }
          this.drag.returnHelpersToDraggees(), this.$items = this.$targetContainer.children(), this.value = [];
          for (const s of this.$items.toArray()) {
            const d = $(s);
            d.hasClass("ckeditor-tb--separator") ? this.value.push("|") : this.value.push(...d.data("componentNames"));
          }
          this.$input.val(JSON.stringify(this.value));
        }
      });
      const u = {};
      for (let i of c) {
        const s = this.renderComponentGroup(i);
        s && (s.appendTo(this.$sourceContainer), u[i.map((d) => d.button).join(",")] = s[0], this.value.includes(i[0].button) && s.addClass("hidden"));
      }
      u["|"] = this.renderSeparator().appendTo(
        this.$sourceContainer
      )[0], this.$items = $();
      for (let i = 0; i < this.value.length; i++) {
        const s = this.value[i];
        let d, l;
        if (s === "|")
          d = this.renderSeparator().appendTo(this.$targetContainer), l = "|";
        else {
          const f = c.find(
            (g) => g.some((p) => p.button === s)
          );
          if (!f || (d = this.renderComponentGroup(f), !d))
            continue;
          d.appendTo(this.$targetContainer), l = f.map((g) => g.button).join(","), i += f.length - 1;
        }
        d.data("sourceItem", u[l]), this.$items = this.$items.add(d);
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
      (r) => typeof r == "string" ? r : r.button
    );
    const e = [], n = [];
    for (const r of t) {
      let a;
      try {
        a = this.renderComponent(r);
      } catch (c) {
        console.warn(c);
        continue;
      }
      e.push(a);
      const h = (a.is("[data-cke-tooltip-text]") ? a : a.find("[data-cke-tooltip-text]")).attr("data-cke-tooltip-text");
      n.push(
        h ? h.replace(/ \(.*\)$/, "") : `${r[0].toUpperCase()}${r.slice(1)}`
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
    const e = t.map((r) => {
      const a = $.data(r, "midpoint");
      return Garnish.getDist(
        a.left,
        a.top,
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
      const n = $(e), o = n.offset(), r = o.left + n.outerWidth() / 2, a = o.top + n.outerHeight() / 2;
      n.data("midpoint", { left: r, top: a });
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
  mode: null,
  lastCodeMode: null,
  $container: null,
  $modeInput: null,
  $jsonContainer: null,
  $jsContainer: null,
  $fileContainer: null,
  jsonEditor: null,
  jsEditor: null,
  defaults: null,
  init: function(id, jsonSchemaUri, mode, hasFiles) {
    this.jsonSchemaUri = jsonSchemaUri, this.mode = mode, this.mode !== "file" && (this.lastCodeMode = mode), this.$container = $(`#${id}`), this.$modeInput = $(`#${id}-mode`), this.$jsonContainer = $(`#${id}-json-container`), this.$jsContainer = $(`#${id}-js-container`), this.$fileContainer = $(`#${id}-file-container`), this.jsonEditor = window.monacoEditorInstances[`${id}-json`], this.jsEditor = window.monacoEditorInstances[`${id}-js`];
    const $modePicker = this.$container.children(".btngroup");
    this.defaults = {};
    const $containers = this.$jsonContainer.add(this.$jsContainer).add(this.$fileContainer);
    new Craft.Listbox($modePicker, {
      onChange: (t) => {
        switch (this.mode = t.data("mode"), (this.mode !== "file" || hasFiles) && this.$modeInput.val(this.mode), $containers.addClass("hidden"), this.mode) {
          case "json":
            if (this.lastCodeMode === "js") {
              const e = this.jsEditor.getModel().getValue();
              if (this.jsContainsFunctions(e) && !confirm(
                Craft.t(
                  "ckeditor",
                  "Your JavaScript config contains functions. If you switch to JSON, they will be lost. Would you like to continue?"
                )
              )) {
                $modePicker.data("listbox").$options.filter('[data-mode="js"]').trigger("click");
                break;
              }
              const n = this.js2json(e);
              this.jsonEditor.getModel().setValue(n || `{
  
}`), this.jsEditor.getModel().setValue("");
            }
            this.$jsonContainer.removeClass("hidden");
            break;
          case "js":
            if (this.lastCodeMode === "json") {
              const e = this.jsonEditor.getModel().getValue(), n = this.json2js(e);
              this.jsEditor.getModel().setValue(n || `return {
  
}`), this.jsonEditor.getModel().setValue("");
            }
            this.$jsContainer.removeClass("hidden");
            break;
          case "file":
            this.$fileContainer.removeClass("hidden");
            break;
        }
        this.mode !== "file" && (this.lastCodeMode = this.mode);
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
    if (this.mode === "json")
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
    if (this.mode === "json")
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
        (a) => a.uri === this.jsonSchemaUri
      ).schema;
    } catch (a) {
      console.warn("Couldn’t get config options JSON schema.", a);
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
    const r = o[1];
    !e.$defs[r] || !e.$defs[r].default || (this.defaults[t] = e.$defs[r].default);
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
    if (Array.isArray(t)) {
      n = `[
`;
      for (const o of t)
        n += `${e}  ${this.jsify(o, e + "  ")},
`;
      n += `${e}]`;
    } else if ($.isPlainObject(t)) {
      n = `{
`;
      for (const [o, r] of Object.entries(t))
        n += `${e}  ${o}: ${this.jsify(r, e + "  ")},
`;
      n += `${e}}`;
    } else typeof t == "string" && !t.match(/[\r\n']/) ? n = `'${t}'` : n = JSON.stringify(t);
    return n;
  }
});
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
const CssOptions = Garnish.Base.extend({
  mode: null,
  $container: null,
  $modeInput: null,
  $cssContainer: null,
  $fileContainer: null,
  init: function(t, e, n) {
    this.mode = e, this.$container = $(`#${t}`), this.$modeInput = $(`#${t}-mode`), this.$cssContainer = $(`#${t}-css-container`), this.$fileContainer = $(`#${t}-file-container`);
    const o = this.$container.children(".btngroup"), r = this.$cssContainer.add(this.$fileContainer);
    new Craft.Listbox(o, {
      onChange: (a) => {
        switch (this.mode = a.data("mode"), (this.mode !== "file" || n) && this.$modeInput.val(this.mode), r.addClass("hidden"), this.mode) {
          case "css":
            this.$cssContainer.removeClass("hidden");
            break;
          case "file":
            this.$fileContainer.removeClass("hidden");
            break;
        }
      }
    });
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
    let e = this.getInput(t), o = t.find(".action-btn").disclosureMenu().data("disclosureMenu"), [r, a] = this.getButtons(
      o,
      t,
      e
    );
    o.on("show", () => {
      let h = o.$trigger.parents(".chip"), c = this.getConfigFromComponent(h);
      o.toggleItem(r, !c.expanded), o.toggleItem(a, c.expanded);
    }), this.applyIndicators(t, this.getConfig(e)), this.base(t);
  },
  async applyConfigChange(t, e, n) {
    this.applyIndicators(t, n);
  },
  async applyIndicators(t, e) {
    var u, i;
    let n;
    try {
      n = (await Craft.sendActionRequest(
        "POST",
        "ckeditor/field-settings/apply-entry-type-indicators",
        {
          data: {
            config: e
          }
        }
      )).data;
    } catch (s) {
      throw Craft.cp.displayError((i = (u = s == null ? void 0 : s.response) == null ? void 0 : u.data) == null ? void 0 : i.message), s;
    }
    let o = t.find(".indicators");
    const r = this.getInput(t), a = $(n.chip).find(".indicators"), h = this.getInput($(n.chip)), c = this.getConfig(h);
    if (o.length == 0) {
      const s = t.find(".chip-label");
      o = $('<div class="indicators">').appendTo(s);
    }
    o.replaceWith(a), this.updateConfig(r, c);
  },
  updateConfig: function(t, e) {
    t.val(JSON.stringify(e));
  },
  getButtons: function(t, e, n) {
    let o = t.addItem({
      icon: async () => await Craft.ui.icon("eye"),
      label: Craft.t("ckeditor", "Expand to a separate button"),
      callback: () => {
        let a = this.getConfig(n);
        a.expanded = !0, this.applyConfigChange(e, n, a);
      }
    }), r = t.addItem({
      icon: async () => await Craft.ui.icon("eye-slash"),
      label: Craft.t("ckeditor", "Collapse to a dropdown"),
      callback: () => {
        let a = this.getConfig(n);
        a.expanded = !1, this.applyConfigChange(e, n, a);
      }
    });
    return [o, r];
  }
});
export {
  CkeEntryTypeSelectInput,
  ConfigOptions,
  CssOptions,
  ToolbarBuilder
};
