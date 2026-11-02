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
  init: function(t, e, i = []) {
    this.$container = $(`#${t}`), this.$sourceContainer = this.$container.find(
      ".ckeditor-tb--source .ck-toolbar__items"
    ), this.$targetContainer = this.$container.find(
      ".ckeditor-tb--target .ck-toolbar__items"
    ), this.$input = this.$container.find("input"), this.value = JSON.parse(this.$input.val()), this.readOnly = $(`#${t}`).hasClass("disabled");
    const o = document.createElement("DIV");
    o.classList.add("hidden");
    const a = document.createElement("DIV");
    o.appendChild(a), this.$container.append(o), create(a, {
      linkOptions: [{ elementType: "CraftCms\\Cms\\Asset\\Elements\\Asset" }],
      imageSources: ["*"],
      entryTypeOptions: [{ label: "fake", value: "fake" }],
      plugins: i
    }).then((d) => {
      const f = d.ui.componentFactory;
      for (const n of f.names())
        this.components[n] = f.create(n);
      const h = JSON.parse(this.$container.attr("data-available-items"));
      for (let n = 0; n < h.length; n++) {
        const s = h[n];
        if (s.length > 1) {
          const r = this.value.findIndex(
            (l) => s.some((c) => c.button === l)
          );
          if (r !== -1) {
            for (let l = 0; l < s.length; l++)
              if (this.value[r + l] !== s[l].button) {
                h.splice(n, 1, ...s.map((c) => [c])), n += s.length - 1;
                break;
              }
          }
        }
      }
      this.readOnly ? this.drag = $() : this.drag = new Garnish.DragDrop({
        dropTargets: this.$targetContainer,
        helper: (n) => {
          const s = $(
            '<div class="offset-drag-helper ck ck-reset_all ck-editor ck-rounded-corners"/>'
          ), r = $(
            '<div class="ck ck-toolbar"/>'
          ).appendTo(s);
          return n.appendTo(r), s;
        },
        moveHelperToCursor: !0,
        onDragStart: () => {
          Garnish.$bod.addClass("dragging");
          const n = this.drag.$draggee;
          if (this.draggingSourceItem = $.contains(
            this.$sourceContainer[0],
            n[0]
          ), this.draggingSeparator = n.hasClass(
            "ckeditor-tb--separator"
          ), this.$insertion = $('<div class="ckeditor-tb--insertion"/>').css({
            width: n.outerWidth(),
            height: n.outerHeight()
          }), this.draggingSourceItem)
            if (this.draggingSeparator)
              n.css("visibility", "");
            else {
              const s = Craft.orientation === "ltr" ? "margin-right" : "margin-left", r = -1 * n.outerWidth();
              n.stop().velocity({ [s]: r }, 200, () => {
                n.addClass("hidden");
              });
            }
          else
            n.addClass("hidden"), this.$insertion.insertBefore(n), this.showingInsertion = !0;
          this.setMidpoints();
        },
        onDrag: () => {
          this.checkForNewClosestItem();
        },
        onDragStop: () => {
          Garnish.$bod.removeClass("dragging");
          let n = this.drag.$draggee;
          if (this.checkForNewClosestItem(), this.showingInsertion)
            if (this.draggingSourceItem) {
              let s;
              if (this.draggingSeparator)
                s = this.renderSeparator();
              else {
                const r = n.data("componentNames");
                s = this.renderComponentGroup(r);
                for (const l of r) {
                  const c = h.flat().find(({ button: u }) => u === l);
                  c && c.configOption && e.addSetting(c.configOption);
                }
              }
              s.data("sourceItem", n[0]), s.css("visibility", "hidden"), this.$insertion.replaceWith(s), this.drag.$draggee = s;
            } else
              this.$insertion.replaceWith(n), n.removeClass("hidden");
          else {
            if (!this.draggingSourceItem) {
              const s = $(n.data("sourceItem"));
              if (n.remove(), this.drag.$draggee = n = s, !this.draggingSeparator)
                for (const r of s.data("componentNames")) {
                  const l = h.flat().find(({ button: c }) => c === r);
                  l && l.configOption && e.removeSetting(l.configOption);
                }
            }
            if (!this.draggingSeparator) {
              n.removeClass("hidden");
              const s = Craft.orientation === "ltr" ? "margin-right" : "margin-left", r = n.css(s);
              n.css(s, "");
              const l = n.css(s);
              n.css(s, r), n.stop().velocity({ [s]: l }, 200, () => {
                n.css(s, "");
              });
            }
          }
          this.drag.returnHelpersToDraggees(), this.$items = this.$targetContainer.children(), this.value = [];
          for (const s of this.$items.toArray()) {
            const r = $(s);
            r.hasClass("ckeditor-tb--separator") ? this.value.push("|") : this.value.push(...r.data("componentNames"));
          }
          this.$input.val(JSON.stringify(this.value));
        }
      });
      const g = {};
      for (let n of h) {
        const s = this.renderComponentGroup(n);
        s && (s.appendTo(this.$sourceContainer), g[n.map((r) => r.button).join(",")] = s[0], this.value.includes(n[0].button) && s.addClass("hidden"));
      }
      g["|"] = this.renderSeparator().appendTo(
        this.$sourceContainer
      )[0], this.$items = $();
      for (let n = 0; n < this.value.length; n++) {
        const s = this.value[n];
        let r, l;
        if (s === "|")
          r = this.renderSeparator().appendTo(this.$targetContainer), l = "|";
        else {
          const c = h.find(
            (u) => u.some((p) => p.button === s)
          );
          if (!c || (r = this.renderComponentGroup(c), !r))
            continue;
          r.appendTo(this.$targetContainer), l = c.map((u) => u.button).join(","), n += c.length - 1;
        }
        r.data("sourceItem", g[l]), this.$items = this.$items.add(r);
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
    const e = [], i = [];
    for (const a of t) {
      let d;
      try {
        d = this.renderComponent(a);
      } catch (h) {
        console.warn(h);
        continue;
      }
      e.push(d);
      const f = (d.is("[data-cke-tooltip-text]") ? d : d.find("[data-cke-tooltip-text]")).attr("data-cke-tooltip-text");
      i.push(
        f ? f.replace(/ \(.*\)$/, "") : `${a[0].toUpperCase()}${a.slice(1)}`
      );
    }
    if (!e.length)
      return !1;
    const o = $('<div class="ckeditor-tb--item"/>').append(e);
    return o.attr("data-cke-tooltip-text", i.join(", ")), o.data("componentNames", t), this.readOnly ? this.drag.add(o) : this.drag.addItems(o), o;
  },
  renderComponent: function(t) {
    const e = this.components[t];
    if (!e)
      throw `Missing component: ${t}`;
    e.isRendered || e.render();
    const i = $(e.element.outerHTML);
    return i.data("componentName", t), i;
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
      const d = $.data(a, "midpoint");
      return Garnish.getDist(
        d.left,
        d.top,
        this.drag.mouseX,
        this.drag.mouseY
      );
    }), i = Math.min(...e), o = e.indexOf(i);
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
      const i = $(e), o = i.offset(), a = o.left + i.outerWidth() / 2, d = o.top + i.outerHeight() / 2;
      i.data("midpoint", { left: a, top: d });
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
              const i = this.js2json(e);
              this.jsonEditor.getModel().setValue(i || `{
  
}`), this.jsEditor.getModel().setValue("");
            }
            this.$jsonContainer.removeClass("hidden");
            break;
          case "js":
            if (this.lastCodeMode === "json") {
              const e = this.jsonEditor.getModel().getValue(), i = this.json2js(e);
              this.jsEditor.getModel().setValue(i || `return {
  
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
      const i = this.json2js(e);
      this.jsEditor.getModel().setValue(i || `return {
  
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
        (d) => d.uri === this.jsonSchemaUri
      ).schema;
    } catch (d) {
      console.warn("Couldn’t get config options JSON schema.", d);
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
    const i = e.$defs.EditorConfig.properties[t];
    if (i.default) {
      this.defaults[t] = i.default;
      return;
    }
    if (!i.$ref)
      return;
    const o = i.$ref.match(/^#\/\$defs\/(\w+)/);
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
    let i = this.jsify(e, "");
    return i === `{
}` && (i = `{
  
}`), `return ${i}`;
  },
  jsify: function(t, e) {
    let i;
    if (Array.isArray(t)) {
      i = `[
`;
      for (const o of t)
        i += `${e}  ${this.jsify(o, e + "  ")},
`;
      i += `${e}]`;
    } else if ($.isPlainObject(t)) {
      i = `{
`;
      for (const [o, a] of Object.entries(t))
        i += `${e}  ${o}: ${this.jsify(a, e + "  ")},
`;
      i += `${e}}`;
    } else typeof t == "string" && !t.match(/[\r\n']/) ? i = `'${t}'` : i = JSON.stringify(t);
    return i;
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
  init: function(t, e, i) {
    this.mode = e, this.$container = $(`#${t}`), this.$modeInput = $(`#${t}-mode`), this.$cssContainer = $(`#${t}-css-container`), this.$fileContainer = $(`#${t}-file-container`);
    const o = this.$container.children(".btngroup"), a = this.$cssContainer.add(this.$fileContainer);
    new Craft.Listbox(o, {
      onChange: (d) => {
        switch (this.mode = d.data("mode"), (this.mode !== "file" || i) && this.$modeInput.val(this.mode), a.addClass("hidden"), this.mode) {
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
});
export {
  ConfigOptions,
  CssOptions,
  ToolbarBuilder
};
