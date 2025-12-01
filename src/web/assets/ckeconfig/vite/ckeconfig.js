import {create, toolbarItems} from '@craftcms/ckeditor';
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
  components: null,
  drag: null,
  $items: null,
  draggingSourceItem: null,
  draggingSeparator: null,
  $insertion: null,
  showingInsertion: !1,
  closestItem: null,
  init: function (t, e, s, r) {
    (this.$sourceContainer = $(
      `#${t} .ckeditor-tb--source .ck-toolbar__items`,
    )),
      (this.$targetContainer = $(
        `#${t} .ckeditor-tb--target .ck-toolbar__items`,
      )),
      (this.$input = $(`#${t} input`)),
      (this.value = JSON.parse(this.$input.val()));
    const a = document.createElement('DIV'),
      c = document.createElement('DIV');
    a.appendChild(c),
      create(c, {
        linkOptions: [{elementType: 'craft\\elements\\Asset'}],
        assetSources: ['*'],
        entryTypeOptions: [{label: 'fake', value: 'fake'}],
      }).then((h) => {
        const g = h.ui.componentFactory,
          j = Array.from(g.names());
        this.components = {};
        for (const n of j) this.components[n] = g.create(n);
        const f = toolbarItems;
        for (let n = 0; n < f.length; n++) {
          const i = f[n];
          if (i.length > 1) {
            const o = this.value.findIndex((l) =>
              i.some((d) => d.button === l),
            );
            if (o !== -1) {
              for (let l = 0; l < i.length; l++)
                if (this.value[o + l] !== i[l].button) {
                  f.splice(n, 1, ...i.map((d) => [d])), (n += i.length - 1);
                  break;
                }
            }
          }
        }
        this.drag = new Garnish.DragDrop({
          dropTargets: this.$targetContainer,
          helper: (n) => {
            const i = $(
                '<div class="offset-drag-helper ck ck-reset_all ck-editor ck-rounded-corners"/>',
              ),
              o = $('<div class="ck ck-toolbar"/>').appendTo(i);
            return n.appendTo(o), i;
          },
          moveHelperToCursor: !0,
          onDragStart: () => {
            Garnish.$bod.addClass('dragging');
            const n = this.drag.$draggee;
            if (
              ((this.draggingSourceItem = $.contains(
                this.$sourceContainer[0],
                n[0],
              )),
              (this.draggingSeparator = n.hasClass('ckeditor-tb--separator')),
              (this.$insertion = $('<div class="ckeditor-tb--insertion"/>').css(
                {
                  width: n.outerWidth(),
                },
              )),
              this.draggingSourceItem)
            )
              if (this.draggingSeparator) n.css('visibility', '');
              else {
                const i =
                    Craft.orientation === 'ltr'
                      ? 'margin-right'
                      : 'margin-left',
                  o = -1 * n.outerWidth();
                n.stop().velocity({[i]: o}, 200, () => {
                  n.addClass('hidden');
                });
              }
            else
              n.addClass('hidden'),
                this.$insertion.insertBefore(n),
                (this.showingInsertion = !0);
            this.setMidpoints();
          },
          onDrag: () => {
            this.checkForNewClosestItem();
          },
          onDragStop: () => {
            Garnish.$bod.removeClass('dragging');
            let n = this.drag.$draggee;
            if ((this.checkForNewClosestItem(), this.showingInsertion))
              if (this.draggingSourceItem) {
                let i;
                if (this.draggingSeparator) i = this.renderSeparator();
                else {
                  const o = n.data('componentNames');
                  i = this.renderComponentGroup(o);
                  for (const l of o) {
                    const d = f.flat().find(({button: u}) => u === l);
                    d && d.configOption && s.addSetting(d.configOption);
                  }
                }
                i.data('sourceItem', n[0]),
                  i.css('visibility', 'hidden'),
                  this.$insertion.replaceWith(i),
                  (this.drag.$draggee = i);
              } else this.$insertion.replaceWith(n), n.removeClass('hidden');
            else {
              if (!this.draggingSourceItem) {
                const i = $(n.data('sourceItem'));
                if (
                  (n.remove(),
                  (this.drag.$draggee = n = i),
                  !this.draggingSeparator)
                )
                  for (const o of i.data('componentNames')) {
                    const l = f.flat().find(({button: d}) => d === o);
                    l && l.configOption && s.removeSetting(l.configOption);
                  }
              }
              if (!this.draggingSeparator) {
                n.removeClass('hidden');
                const i =
                    Craft.orientation === 'ltr'
                      ? 'margin-right'
                      : 'margin-left',
                  o = n.css(i);
                n.css(i, '');
                const l = n.css(i);
                n.css(i, o),
                  n.stop().velocity({[i]: l}, 200, () => {
                    n.css(i, '');
                  });
              }
            }
            this.drag.returnHelpersToDraggees(),
              (this.$items = this.$targetContainer.children()),
              (this.value = []);
            for (const i of this.$items.toArray()) {
              const o = $(i);
              o.hasClass('ckeditor-tb--separator')
                ? this.value.push('|')
                : this.value.push(...o.data('componentNames'));
            }
            this.$input.val(JSON.stringify(this.value));
          },
        });
        const p = {};
        for (let n of f) {
          const i = this.renderComponentGroup(n);
          i &&
            (i.appendTo(this.$sourceContainer),
            (p[n.map((o) => o.button).join(',')] = i[0]),
            this.value.includes(n[0].button) && i.addClass('hidden'));
        }
        (p['|'] = this.renderSeparator().appendTo(this.$sourceContainer)[0]),
          (this.$items = $());
        for (let n = 0; n < this.value.length; n++) {
          const i = this.value[n];
          let o, l;
          if (i === '|')
            (o = this.renderSeparator().appendTo(this.$targetContainer)),
              (l = '|');
          else {
            const d = f.find((u) => u.some((C) => C.button === i));
            if (!d || ((o = this.renderComponentGroup(d)), !o)) continue;
            o.appendTo(this.$targetContainer),
              (l = d.map((u) => u.button).join(',')),
              (n += d.length - 1);
          }
          o.data('sourceItem', p[l]), (this.$items = this.$items.add(o));
        }
      });
  },
  renderSeparator: function () {
    const t = $(
      '<div class="ckeditor-tb--item ckeditor-tb--separator" data-cke-tooltip-text="Separator"><span class="ck ck-toolbar__separator"/></div>',
    );
    return this.drag.addItems(t), t;
  },
  renderComponentGroup: function (t) {
    t = t.map((a) => (typeof a == 'string' ? a : a.button));
    const e = [],
      s = [];
    for (const a of t) {
      let c;
      try {
        c = this.renderComponent(a);
      } catch (g) {
        console.warn(g);
        continue;
      }
      e.push(c);
      const h = (
        c.is('[data-cke-tooltip-text]') ? c : c.find('[data-cke-tooltip-text]')
      ).attr('data-cke-tooltip-text');
      s.push(
        h ? h.replace(/ \(.*\)$/, '') : `${a[0].toUpperCase()}${a.slice(1)}`,
      );
    }
    if (!e.length) return !1;
    const r = $('<div class="ckeditor-tb--item"/>').append(e);
    return (
      r.attr('data-cke-tooltip-text', s.join(', ')),
      r.data('componentNames', t),
      this.drag.addItems(r),
      r
    );
  },
  renderComponent: function (t) {
    const e = this.components[t];
    if (!e) throw `Missing component: ${t}`;
    e.isRendered || e.render();
    const s = $(e.element.outerHTML);
    return s.data('componentName', t), s;
  },
  getClosestItem: function () {
    if (
      !Garnish.hitTest(
        this.drag.mouseX,
        this.drag.mouseY,
        this.$targetContainer,
      )
    )
      return !1;
    if (!this.$items.length) return null;
    const t = this.$items.toArray();
    this.showingInsertion && t.push(this.$insertion[0]);
    const e = t.map((a) => {
        const c = $.data(a, 'midpoint');
        return Garnish.getDist(
          c.left,
          c.top,
          this.drag.mouseX,
          this.drag.mouseY,
        );
      }),
      s = Math.min(...e),
      r = e.indexOf(s);
    return t[r];
  },
  checkForNewClosestItem: function () {
    const t = this.getClosestItem();
    if (t === !1) {
      this.showingInsertion &&
        (this.$insertion.remove(), (this.showingInsertion = !1));
      return;
    }
    t !== this.$insertion[0] &&
      (t
        ? this.drag.mouseX < $.data(t, 'midpoint').left
          ? this.$insertion.insertBefore(t)
          : this.$insertion.insertAfter(t)
        : this.$insertion.appendTo(this.$targetContainer),
      (this.showingInsertion = !0),
      this.setMidpoints());
  },
  setMidpoints: function () {
    const t = this.$items.toArray();
    this.showingInsertion && t.push(this.$insertion[0]);
    for (const e of t) {
      const s = $(e),
        r = s.offset(),
        a = r.left + s.outerWidth() / 2,
        c = r.top + s.outerHeight() / 2;
      s.data('midpoint', {left: a, top: c});
    }
  },
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
  init: function (id, jsonSchemaUri) {
    (this.jsonSchemaUri = jsonSchemaUri),
      (this.$container = $(`#${id}`)),
      (this.$jsonContainer = $(`#${id}-json-container`)),
      (this.$jsContainer = $(`#${id}-js-container`)),
      (this.jsonEditor = window.monacoEditorInstances[`${id}-json`]),
      (this.jsEditor = window.monacoEditorInstances[`${id}-js`]);
    const $languagePicker = this.$container.children('.btngroup');
    this.$jsonContainer.hasClass('hidden')
      ? (this.language = 'js')
      : (this.language = 'json'),
      (this.defaults = {});
    let lastJsValue = null;
    new Craft.Listbox($languagePicker, {
      onChange: (t) => {
        switch (((this.language = t.data('language')), this.language)) {
          case 'json':
            if (
              ((lastJsValue = this.jsEditor.getModel().getValue()),
              this.jsContainsFunctions(lastJsValue) &&
                !confirm(
                  Craft.t(
                    'ckeditor',
                    'Your JavaScript config contains functions. If you switch to JSON, they will be lost. Would you like to continue?',
                  ),
                ))
            ) {
              $languagePicker
                .data('listbox')
                .$options.not('[data-language="json"]')
                .trigger('click');
              break;
            }
            this.$jsonContainer.removeClass('hidden'),
              this.$jsContainer.addClass('hidden');
            const e = this.js2json(lastJsValue);
            (lastJsValue = null),
              this.jsonEditor.getModel().setValue(
                e ||
                  `{
  
}`,
              ),
              this.jsEditor.getModel().setValue('');
            break;
          case 'js':
            this.$jsonContainer.addClass('hidden'),
              this.$jsContainer.removeClass('hidden');
            let s;
            lastJsValue !== null
              ? ((s = lastJsValue), (lastJsValue = null))
              : (s = this.json2js(this.jsonEditor.getModel().getValue())),
              this.jsEditor.getModel().setValue(
                s ||
                  `return {
  
}`,
              ),
              this.jsonEditor.getModel().setValue('');
            break;
        }
      },
    }),
      this.jsonEditor.onDidPaste((ev) => {
        const pastedContent = this.jsonEditor
          .getModel()
          .getValueInRange(ev.range);
        let config;
        try {
          eval(`config = {${pastedContent}}`);
        } catch (t) {
          return;
        }
        const json = JSON.stringify(config, null, 2),
          trimmed = Craft.trim(json.substring(1, json.length - 1));
        trimmed &&
          this.jsonEditor.executeEdits('', [
            {
              range: ev.range,
              text: trimmed,
            },
          ]);
      });
  },
  getConfig: function () {
    let t;
    if (this.language === 'json')
      t = Craft.trim(this.jsonEditor.getModel().getValue()) || '{}';
    else {
      const e = Craft.trim(this.jsEditor.getModel().getValue());
      if (((t = e ? this.js2json(e) : '{}'), t === !1)) return !1;
    }
    try {
      const e = JSON.parse(t);
      return $.isPlainObject(e) ? e : !1;
    } catch {
      return !1;
    }
  },
  setConfig: function (t) {
    const e = this.config2json(t);
    if (this.language === 'json') this.jsonEditor.getModel().setValue(e);
    else {
      const s = this.json2js(e);
      this.jsEditor.getModel().setValue(
        s ||
          `return {
  
}`,
      );
    }
  },
  addSetting: function (t) {
    const e = this.getConfig();
    e &&
      (typeof e[t] < 'u' ||
        (typeof this.defaults[t] > 'u' &&
          (this.populateDefault(t), typeof this.defaults[t] > 'u')) ||
        ((e[t] = this.defaults[t]), this.setConfig(e)));
  },
  removeSetting: function (t) {
    const e = this.getConfig();
    e &&
      (typeof e[t] > 'u' ||
        ((this.defaults[t] = e[t]), delete e[t], this.setConfig(e)));
  },
  populateDefault: function (t) {
    let e;
    try {
      e =
        window.monaco.languages.json.jsonDefaults.diagnosticsOptions.schemas.find(
          (c) => c.uri === this.jsonSchemaUri,
        ).schema;
    } catch (c) {
      console.warn('Couldn’t get config options JSON schema.', c);
      return;
    }
    if (!e.$defs || !e.$defs.EditorConfig || !e.$defs.EditorConfig.properties) {
      console.warn(
        'Config options JSON schema is missing $defs.EditorConfig.properties',
      );
      return;
    }
    if (!e.$defs.EditorConfig.properties[t]) return;
    const s = e.$defs.EditorConfig.properties[t];
    if (s.default) {
      this.defaults[t] = s.default;
      return;
    }
    if (!s.$ref) return;
    const r = s.$ref.match(/^#\/\$defs\/(\w+)/);
    if (!r) return;
    const a = r[1];
    !e.$defs[a] ||
      !e.$defs[a].default ||
      (this.defaults[t] = e.$defs[a].default);
  },
  replacer: function (t, e) {
    return typeof e == 'function' ? '__HAS__FUNCTION__' : e;
  },
  jsContainsFunctions: function (t) {
    let e = this.getValidJsonConfig(t);
    return !!(
      e === !1 || JSON.stringify(e, this.replacer, 2).match(/__HAS__FUNCTION__/)
    );
  },
  config2json: function (t) {
    let e = JSON.stringify(t, null, 2);
    return (
      e === '{}' &&
        (e = `{
  
}`),
      e
    );
  },
  getValidJsonConfig: function (js) {
    const m = (js || '').match(/return\s*(\{[\w\W]*})/);
    if (!m) return !1;
    let config;
    try {
      eval(`config = ${m[1]};`);
    } catch (t) {
      return !1;
    }
    return config;
  },
  js2json: function (t) {
    let e = this.getValidJsonConfig(t);
    return e === !1 ? !1 : this.config2json(e);
  },
  json2js: function (t) {
    let e;
    try {
      e = JSON.parse(t);
    } catch {
      return !1;
    }
    if (!$.isPlainObject(e)) return !1;
    let s = this.jsify(e, '');
    return (
      s ===
        `{
}` &&
        (s = `{
  
}`),
      `return ${s}`
    );
  },
  jsify: function (t, e) {
    let s;
    if ($.isArray(t)) {
      s = `[
`;
      for (const r of t)
        s += `${e}  ${this.jsify(r, e + '  ')},
`;
      s += `${e}]`;
    } else if ($.isPlainObject(t)) {
      s = `{
`;
      for (const [r, a] of Object.entries(t))
        s += `${e}  ${r}: ${this.jsify(a, e + '  ')},
`;
      s += `${e}}`;
    } else
      typeof t == 'string' && !t.match(/[\r\n']/)
        ? (s = `'${t}'`)
        : (s = JSON.stringify(t));
    return s;
  },
});
export {ConfigOptions, ToolbarBuilder};
