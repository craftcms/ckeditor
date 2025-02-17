import { ImageInsertUI as Bc, ButtonView as Cs, icons as Zl, Plugin as rr, LinkUI as Ql, ContextualBalloon as Wc, createDropdown as _a, SplitButtonView as Hc, addListToDropdown as xa, Collection as Sa, ViewModel as $o, Range as Vc, Command as Ts, ImageUtils as Jl, DropdownButtonView as $c, Widget as Yc, viewToModelPositionOutsideModelElement as qc, toWidget as Kc, DomEventObserver as Qc, WidgetToolbarRepository as Gl, isWidget as Gc, ClassicEditor as Xc, SourceEditing as ec, Heading as Zc } from "ckeditor5";
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class wu extends Bc {
  static get pluginName() {
    return "CraftImageInsertUI";
  }
  init() {
    if (!this._assetSources) {
      console.warn(
        'Omitting the "image" CKEditor toolbar button, because there aren’t any permitted volumes.'
      );
      return;
    }
    const V = this.editor.ui.componentFactory, E = (s) => this._createToolbarImageButton(s);
    V.add("insertImage", E), V.add("imageInsert", E);
  }
  get _assetSources() {
    return this.editor.config.get("assetSources");
  }
  _createToolbarImageButton(V) {
    const E = this.editor, s = E.t, h = new Cs(V);
    h.isEnabled = !0, h.label = s("Insert image"), h.icon = Zl.image, h.tooltip = !0;
    const u = E.commands.get("insertImage");
    return h.bind("isEnabled").to(u), this.listenTo(h, "execute", () => this._showImageSelectModal()), h;
  }
  _showImageSelectModal() {
    const V = this._assetSources, E = this.editor, s = E.config, h = Object.assign({}, s.get("assetSelectionCriteria"), {
      kind: "image"
    });
    Craft.createElementSelectorModal("craft\\elements\\Asset", {
      storageKey: `ckeditor:${this.pluginName}:'craft\\elements\\Asset'`,
      sources: V,
      criteria: h,
      defaultSiteId: s.get("elementSiteId"),
      transforms: s.get("transforms"),
      multiSelect: !0,
      autoFocusSearchBox: !1,
      onSelect: (u, o) => {
        this._processAssetUrls(u, o).then(() => {
          E.editing.view.focus();
        });
      },
      onHide: () => {
        E.editing.view.focus();
      },
      closeOtherModals: !1
    });
  }
  _processAssetUrls(V, E) {
    return new Promise((s) => {
      if (!V.length) {
        s();
        return;
      }
      const h = this.editor, u = h.config.get("defaultTransform"), o = new Craft.Queue(), O = [];
      o.on("afterRun", () => {
        h.execute("insertImage", { source: O }), s();
      });
      for (const m of V)
        o.push(
          () => new Promise((g) => {
            const y = this._isTransformUrl(m.url);
            if (!y && u)
              this._getTransformUrl(m.id, u, (b) => {
                O.push(b), g();
              });
            else {
              const b = this._buildAssetUrl(
                m.id,
                m.url,
                y ? E : u
              );
              O.push(b), g();
            }
          })
        );
    });
  }
  _buildAssetUrl(V, E, s) {
    return `${E}#asset:${V}:${s ? "transform:" + s : "url"}`;
  }
  _removeTransformFromUrl(V) {
    return V.replace(/(^|\/)(_[^\/]+\/)([^\/]+)$/, "$1$3");
  }
  _isTransformUrl(V) {
    return /(^|\/)_[^\/]+\/[^\/]+$/.test(V);
  }
  _getTransformUrl(V, E, s) {
    Craft.sendActionRequest("POST", "ckeditor/ckeditor/image-url", {
      data: {
        assetId: V,
        transform: E
      }
    }).then(({ data: h }) => {
      s(this._buildAssetUrl(V, h.url, E));
    }).catch(() => {
      alert("There was an error generating the transform URL.");
    });
  }
  _getAssetUrlComponents(V) {
    const E = V.match(
      /(.*)#asset:(\d+):(url|transform):?([a-zA-Z][a-zA-Z0-9_]*)?/
    );
    return E ? {
      url: E[1],
      assetId: E[2],
      transform: E[3] !== "url" ? E[4] : null
    } : null;
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
const Jc = '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="m11.077 15 .991-1.416a.75.75 0 1 1 1.229.86l-1.148 1.64a.748.748 0 0 1-.217.206 5.251 5.251 0 0 1-8.503-5.955.741.741 0 0 1 .12-.274l1.147-1.639a.75.75 0 1 1 1.228.86L4.933 10.7l.006.003a3.75 3.75 0 0 0 6.132 4.294l.006.004zm5.494-5.335a.748.748 0 0 1-.12.274l-1.147 1.639a.75.75 0 1 1-1.228-.86l.86-1.23a3.75 3.75 0 0 0-6.144-4.301l-.86 1.229a.75.75 0 0 1-1.229-.86l1.148-1.64a.748.748 0 0 1 .217-.206 5.251 5.251 0 0 1 8.503 5.955zm-4.563-2.532a.75.75 0 0 1 .184 1.045l-3.155 4.505a.75.75 0 1 1-1.229-.86l3.155-4.506a.75.75 0 0 1 1.045-.184z"/></svg>', eu = "Ctrl+K";
class ku extends rr {
  static get requires() {
    return [Ql];
  }
  static get pluginName() {
    return "CraftLinkUI";
  }
  constructor() {
    super(...arguments), this.siteDropdownView = null, this.siteDropdownItemModels = null, this.localizedRefHandleRE = null, this.editor.config.define("linkOptions", []);
  }
  init() {
    const V = this.editor;
    if (this._linkUI = V.plugins.get(Ql), this._balloon = V.plugins.get(Wc), this._createToolbarLinkButton(), Craft.isMultiSite) {
      this._modifyFormViewTemplate();
      const E = CKE_LOCALIZED_REF_HANDLES.join("|");
      this.localizedRefHandleRE = new RegExp(
        `(#(?:${E}):\\d+)(?:@(\\d+))?`
      );
    }
  }
  _createToolbarLinkButton() {
    const V = this.editor, E = V.config.get("linkOptions");
    if (!E || !E.length) {
      this._linkUI._createToolbarLinkButton();
      return;
    }
    const s = V.commands.get("link"), h = V.t;
    V.ui.componentFactory.add("link", (u) => {
      const o = _a(u, Hc), O = o.buttonView;
      return O.isEnabled = !0, O.label = h("Link"), O.icon = Jc, O.keystroke = eu, O.tooltip = !0, O.isToggleable = !0, this.listenTo(
        O,
        "execute",
        () => this._linkUI._showUI(!0)
      ), o.on("execute", (m) => {
        if (m.source.linkOption) {
          const g = m.source.linkOption;
          this._showElementSelectorModal(g);
        } else
          this._linkUI._showUI(!0);
      }), o.class = "ck-code-block-dropdown", o.bind("isEnabled").to(s, "isEnabled"), O.bind("isOn").to(s, "value", (m) => !!m), xa(
        o,
        () => this._getLinkListItemDefinitions(E)
      ), o;
    });
  }
  _getLinkListItemDefinitions(V) {
    const E = new Sa();
    for (const s of V)
      E.add({
        type: "button",
        model: new $o({
          label: s.label,
          linkOption: s,
          withText: !0
        })
      });
    return E.add({
      type: "button",
      model: new $o({
        label: Craft.t("ckeditor", "Insert link"),
        withText: !0
      })
    }), E;
  }
  _showElementSelectorModal(V) {
    const E = this.editor, s = E.model, h = s.document.selection, u = h.isCollapsed, o = h.getFirstRange(), O = () => {
      E.editing.view.focus(), !u && o && s.change((m) => {
        m.setSelection(o);
      }), this._linkUI._hideFakeVisualSelection();
    };
    this._linkUI._getSelectedLinkElement() || this._linkUI._showFakeVisualSelection(), Craft.createElementSelectorModal(V.elementType, {
      storageKey: `ckeditor:${this.pluginName}:${V.elementType}`,
      sources: V.sources,
      criteria: V.criteria,
      defaultSiteId: E.config.get("elementSiteId"),
      autoFocusSearchBox: !1,
      onSelect: (m) => {
        if (m.length) {
          const g = m[0], y = `${g.url}#${V.refHandle}:${g.id}@${g.siteId}`;
          E.editing.view.focus(), !u && o ? (s.change((S) => {
            S.setSelection(o);
          }), E.commands.get("link").execute(y)) : s.change((b) => {
            if (b.insertText(
              g.label,
              {
                linkHref: y
              },
              h.getFirstPosition()
            ), o instanceof Vc)
              try {
                const S = o.clone();
                S.end.path[1] += g.label.length, b.setSelection(S);
              } catch {
              }
          }), this._linkUI._hideFakeVisualSelection(), setTimeout(() => {
            E.editing.view.focus(), this._linkUI._showUI(!0);
          }, 100);
        } else
          O();
      },
      onCancel: () => {
        O();
      },
      closeOtherModals: !1
    });
  }
  _modifyFormViewTemplate() {
    this._linkUI.formView || this._linkUI._createViews();
    const { formView: V } = this._linkUI, { urlInputView: E } = V, { fieldView: s } = E;
    V.template.attributes.class.push(
      "ck-link-form_layout-vertical",
      "ck-vertical-form"
    ), this.siteDropdownView = _a(V.locale), this.siteDropdownView.buttonView.set({
      label: "",
      withText: !0,
      isVisible: !1
    }), this.siteDropdownItemModels = Object.fromEntries(
      Craft.sites.map((o) => [
        o.id,
        new $o({
          label: o.name,
          siteId: o.id,
          withText: !0
        })
      ])
    ), this.siteDropdownItemModels.current = new $o({
      label: Craft.t("ckeditor", "Link to the current site"),
      siteId: null,
      withText: !0
    }), xa(
      this.siteDropdownView,
      new Sa([
        ...Craft.sites.map((o) => ({
          type: "button",
          model: this.siteDropdownItemModels[o.id]
        })),
        {
          type: "button",
          model: this.siteDropdownItemModels.current
        }
      ])
    ), this.siteDropdownView.on("execute", (o) => {
      const O = this._urlInputRefMatch();
      if (!O) {
        console.warn(
          `No reference tag hash present in URL: ${this._urlInputValue()}`
        );
        return;
      }
      const { siteId: m } = o.source;
      let g = O[1];
      m && (g += `@${m}`);
      const y = this._urlInputValue().replace(O[0], g);
      s.set("value", y);
    });
    const { children: h } = V, u = h.getIndex(E);
    h.add(this.siteDropdownView, u + 1), V._focusables.add(this.siteDropdownView), V.focusTracker.add(this.siteDropdownView.element), this.listenTo(s, "change:value", () => {
      this._toggleSiteDropdownView();
    }), this.listenTo(s, "input", () => {
      this._toggleSiteDropdownView();
    });
  }
  _urlInputValue() {
    return this._linkUI.formView.urlInputView.fieldView.element.value;
  }
  _urlInputRefMatch() {
    return this._urlInputValue().match(this.localizedRefHandleRE);
  }
  _toggleSiteDropdownView() {
    const V = this._urlInputRefMatch();
    if (V) {
      this.siteDropdownView.buttonView.set("isVisible", !0);
      let E = V[2] ? parseInt(V[2], 10) : null;
      E && typeof this.siteDropdownItemModels[E] > "u" && (E = null), this._selectSiteDropdownItem(E);
    } else
      this.siteDropdownView.buttonView.set("isVisible", !1);
  }
  _selectSiteDropdownItem(V) {
    const E = this.siteDropdownItemModels[V ?? "current"], s = V ? Craft.t("ckeditor", "Site: {name}", { name: E.label }) : E.label;
    this.siteDropdownView.buttonView.set("label", s), Object.values(this.siteDropdownItemModels).forEach((h) => {
      h.set("isOn", h === E);
    });
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class tu extends Ts {
  refresh() {
    const V = this._element(), E = this._srcInfo(V);
    this.isEnabled = !!E, E ? this.value = {
      transform: E.transform
    } : this.value = null;
  }
  _element() {
    const V = this.editor;
    return V.plugins.get("ImageUtils").getClosestSelectedImageElement(
      V.model.document.selection
    );
  }
  _srcInfo(V) {
    if (!V || !V.hasAttribute("src"))
      return null;
    const E = V.getAttribute("src"), s = E.match(
      /#asset:(\d+)(?::transform:([a-zA-Z][a-zA-Z0-9_]*))?/
    );
    return s ? {
      src: E,
      assetId: s[1],
      transform: s[2]
    } : null;
  }
  /**
   * Executes the command.
   *
   * ```js
   * // Applies the `thumb` transform
   * editor.execute( 'transformImage', { transform: 'thumb' } );
   *
   * // Removes the transform
   * editor.execute( 'transformImage', { transform: null } );
   * ```
   *
   * @param options
   * @param options.transform The new transform for the image.
   * @fires execute
   */
  execute(V) {
    const s = this.editor.model, h = this._element(), u = this._srcInfo(h);
    if (this.value = {
      transform: V.transform
    }, u) {
      const o = `#asset:${u.assetId}` + (V.transform ? `:transform:${V.transform}` : "");
      s.change((O) => {
        const m = u.src.replace(/#.*/, "") + o;
        O.setAttribute("src", m, h);
      }), Craft.sendActionRequest("post", "ckeditor/ckeditor/image-url", {
        data: {
          assetId: u.assetId,
          transform: V.transform
        }
      }).then(({ data: O }) => {
        s.change((m) => {
          const g = O.url + o;
          m.setAttribute("src", g, h), O.width && m.setAttribute("width", O.width, h), O.height && m.setAttribute("height", O.height, h);
        });
      });
    }
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class tc extends rr {
  static get requires() {
    return [Jl];
  }
  static get pluginName() {
    return "ImageTransformEditing";
  }
  constructor(V) {
    super(V), V.config.define("transforms", []);
  }
  init() {
    const V = this.editor, E = new tu(V);
    V.commands.add("transformImage", E);
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
const nu = Zl.objectSizeMedium;
class ru extends rr {
  static get requires() {
    return [tc];
  }
  static get pluginName() {
    return "ImageTransformUI";
  }
  init() {
    const V = this.editor, E = V.config.get("transforms"), s = V.commands.get("transformImage");
    this.bind("isEnabled").to(s), this._registerImageTransformDropdown(E);
  }
  /**
   * A helper function that creates a dropdown component for the plugin containing all the transform options defined in
   * the editor configuration.
   *
   * @param transforms An array of the available image transforms.
   */
  _registerImageTransformDropdown(V) {
    const E = this.editor, s = E.t, h = {
      name: "transformImage:original",
      value: null
    }, u = [
      h,
      ...V.map((O) => ({
        label: O.name,
        name: `transformImage:${O.handle}`,
        value: O.handle
      }))
    ], o = (O) => {
      const m = E.commands.get("transformImage"), g = _a(O, $c), y = g.buttonView;
      return y.set({
        tooltip: s("Resize image"),
        commandValue: null,
        icon: nu,
        isToggleable: !0,
        label: this._getOptionLabelValue(h),
        withText: !0,
        class: "ck-resize-image-button"
      }), y.bind("label").to(m, "value", (b) => {
        if (!b || !b.transform)
          return this._getOptionLabelValue(h);
        const S = V.find(
          (T) => T.handle === b.transform
        );
        return S ? S.name : b.transform;
      }), g.bind("isEnabled").to(this), xa(
        g,
        () => this._getTransformDropdownListItemDefinitions(u, m),
        {
          ariaLabel: s("Image resize list")
        }
      ), this.listenTo(g, "execute", (b) => {
        E.execute(b.source.commandName, {
          transform: b.source.commandValue
        }), E.editing.view.focus();
      }), g;
    };
    E.ui.componentFactory.add("transformImage", o);
  }
  /**
   * A helper function for creating an option label value string.
   *
   * @param option A transform option object.
   * @returns The option label.
   */
  _getOptionLabelValue(V) {
    return V.label || V.value || this.editor.t("Original");
  }
  /**
   * A helper function that parses the transform options and returns list item definitions ready for use in the dropdown.
   *
   * @param options The transform options.
   * @param command The transform image command.
   * @returns Dropdown item definitions.
   */
  _getTransformDropdownListItemDefinitions(V, E) {
    const s = new Sa();
    return V.map((h) => {
      const u = {
        type: "button",
        model: new $o({
          commandName: "transformImage",
          commandValue: h.value,
          label: this._getOptionLabelValue(h),
          withText: !0,
          icon: null
        })
      };
      u.model.bind("isOn").to(E, "value", ou(h.value)), s.add(u);
    }), s;
  }
}
function ou(Oe) {
  return (V) => {
    const E = V;
    return Oe === null && E === Oe ? !0 : E !== null && E.transform === Oe;
  };
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class Eu extends rr {
  static get requires() {
    return [tc, ru];
  }
  static get pluginName() {
    return "ImageTransform";
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class iu extends Ts {
  refresh() {
    const V = this._element(), E = this._srcInfo(V);
    if (this.isEnabled = !!E, this.isEnabled) {
      let s = {
        assetId: E.assetId
      };
      Craft.sendActionRequest("POST", "ckeditor/ckeditor/image-permissions", {
        data: s
      }).then((h) => {
        h.data.editable === !1 && (this.isEnabled = !1);
      });
    }
  }
  /**
   * Returns the selected image element.
   */
  _element() {
    const V = this.editor;
    return V.plugins.get("ImageUtils").getClosestSelectedImageElement(
      V.model.document.selection
    );
  }
  /**
   * Checks if element has a src attribute and at least an asset id.
   * Returns null if not and array containing src, baseSrc, asset id and transform (if used).
   *
   * @param element
   * @returns {{transform: *, src: *, assetId: *, baseSrc: *}|null}
   * @private
   */
  _srcInfo(V) {
    if (!V || !V.hasAttribute("src"))
      return null;
    const E = V.getAttribute("src"), s = E.match(
      /(.*)#asset:(\d+)(?::transform:([a-zA-Z][a-zA-Z0-9_]*))?/
    );
    return s ? {
      src: E,
      baseSrc: s[1],
      assetId: s[2],
      transform: s[3]
    } : null;
  }
  /**
   * Executes the command.
   *
   * @fires execute
   */
  execute() {
    this.editor.model;
    const E = this._element(), s = this._srcInfo(E);
    if (s) {
      let h = {
        allowSavingAsNew: !1,
        // todo: we might want to change that, but currently we're doing the same functionality as in Redactor
        onSave: (u) => {
          this._reloadImage(s.assetId, u);
        },
        allowDegreeFractions: Craft.isImagick
      };
      new Craft.AssetImageEditor(s.assetId, h);
    }
  }
  /**
   * Reloads the matching images after save was triggered from the Image Editor.
   *
   * @param data
   */
  _reloadImage(V, E) {
    let h = this.editor.model;
    this._getAllImageAssets().forEach((o) => {
      if (o.srcInfo.assetId == V)
        if (o.srcInfo.transform) {
          let O = {
            assetId: o.srcInfo.assetId,
            handle: o.srcInfo.transform
          };
          Craft.sendActionRequest("POST", "assets/generate-transform", {
            data: O
          }).then((m) => {
            let g = m.data.url + "?" + (/* @__PURE__ */ new Date()).getTime() + "#asset:" + o.srcInfo.assetId + ":transform:" + o.srcInfo.transform;
            h.change((y) => {
              y.setAttribute("src", g, o.element);
            });
          });
        } else {
          let O = o.srcInfo.baseSrc + "?" + (/* @__PURE__ */ new Date()).getTime() + "#asset:" + o.srcInfo.assetId;
          h.change((m) => {
            m.setAttribute("src", O, o.element);
          });
        }
    });
  }
  /**
   * Returns all images present in the editor that are Craft Assets.
   *
   * @returns {*[]}
   * @private
   */
  _getAllImageAssets() {
    const E = this.editor.model, s = E.createRangeIn(E.document.getRoot());
    let h = [];
    for (const u of s.getWalker({ ignoreElementEnd: !0 }))
      if (u.item.is("element") && u.item.name === "imageBlock") {
        let o = this._srcInfo(u.item);
        o && h.push({
          element: u.item,
          srcInfo: o
        });
      }
    return h;
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class nc extends rr {
  static get requires() {
    return [Jl];
  }
  static get pluginName() {
    return "ImageEditorEditing";
  }
  init() {
    const V = this.editor, E = new iu(V);
    V.commands.add("imageEditor", E);
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class au extends rr {
  static get requires() {
    return [nc];
  }
  static get pluginName() {
    return "ImageEditorUI";
  }
  init() {
    const E = this.editor.commands.get("imageEditor");
    this.bind("isEnabled").to(E), this._registerImageEditorButton();
  }
  /**
   * A helper function that creates a button component for the plugin that triggers launch of the Image Editor.
   */
  _registerImageEditorButton() {
    const V = this.editor, E = V.t, s = V.commands.get("imageEditor"), h = () => {
      const u = new Cs();
      return u.set({
        label: E("Edit Image"),
        withText: !0
      }), u.bind("isEnabled").to(s), this.listenTo(u, "execute", (o) => {
        V.execute("imageEditor"), V.editing.view.focus();
      }), u;
    };
    V.ui.componentFactory.add("imageEditor", h);
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class _u extends rr {
  static get requires() {
    return [nc, au];
  }
  static get pluginName() {
    return "ImageEditor";
  }
}
class su extends Ts {
  execute(V) {
    const E = this.editor, s = E.model.document.selection;
    E.model.change((h) => {
      const u = h.createElement("craftEntryModel", {
        ...Object.fromEntries(s.getAttributes()),
        cardHtml: V.cardHtml,
        entryId: V.entryId,
        siteId: V.siteId
      });
      E.model.insertObject(u, null, null, {
        setSelection: "after"
      });
    });
  }
  refresh() {
    const E = this.editor.model.document.selection, s = !E.isCollapsed && E.getFirstRange();
    this.isEnabled = !s;
  }
}
class lu extends rr {
  /**
   * @inheritDoc
   */
  static get requires() {
    return [Yc];
  }
  /**
   * @inheritDoc
   */
  static get pluginName() {
    return "CraftEntriesEditing";
  }
  /**
   * @inheritDoc
   */
  init() {
    this._defineSchema(), this._defineConverters();
    const V = this.editor;
    V.commands.add("insertEntry", new su(V)), V.editing.mapper.on(
      "viewToModelPosition",
      qc(V.model, (E) => {
        E.hasClass("cke-entry-card");
      })
    );
  }
  /**
   * Defines model schema for our widget.
   * @private
   */
  _defineSchema() {
    this.editor.model.schema.register("craftEntryModel", {
      inheritAllFrom: "$blockObject",
      allowAttributes: ["cardHtml", "entryId", "siteId"],
      allowChildren: !1
    });
  }
  /**
   * Defines conversion methods for model and both editing and data views.
   * @private
   */
  _defineConverters() {
    const V = this.editor.conversion;
    V.for("upcast").elementToElement({
      view: {
        name: "craft-entry"
        // has to be lower case
      },
      model: (s, { writer: h }) => {
        const u = s.getAttribute("data-card-html"), o = s.getAttribute("data-entry-id"), O = s.getAttribute("data-site-id") ?? null;
        return h.createElement("craftEntryModel", {
          cardHtml: u,
          entryId: o,
          siteId: O
        });
      }
    }), V.for("editingDowncast").elementToElement({
      model: "craftEntryModel",
      view: (s, { writer: h }) => {
        const u = s.getAttribute("entryId") ?? null, o = s.getAttribute("siteId") ?? null, O = h.createContainerElement("div", {
          class: "cke-entry-card",
          "data-entry-id": u,
          "data-site-id": o
        });
        return E(s, h, O), Kc(O, h);
      }
    }), V.for("dataDowncast").elementToElement({
      model: "craftEntryModel",
      view: (s, { writer: h }) => {
        const u = s.getAttribute("entryId") ?? null, o = s.getAttribute("siteId") ?? null;
        return h.createContainerElement("craft-entry", {
          "data-entry-id": u,
          "data-site-id": o
        });
      }
    });
    const E = (s, h, u) => {
      this._getCardHtml(s).then((o) => {
        const O = h.createRawElement(
          "div",
          null,
          function(g) {
            g.innerHTML = o.cardHtml, Craft.appendHeadHtml(o.headHtml), Craft.appendBodyHtml(o.bodyHtml);
          }
        );
        h.insert(h.createPositionAt(u, 0), O);
        const m = this.editor;
        m.editing.view.focus(), setTimeout(() => {
          Craft.cp.elementThumbLoader.load($(m.ui.element));
        }, 100), m.model.change((g) => {
          m.ui.update(), $(m.sourceElement).trigger("keyup");
        });
      });
    };
  }
  /**
   * Get card html either from the attribute or via ajax request. In both cases, return via a promise.
   *
   * @param modelItem
   * @returns {Promise<unknown>|Promise<T | string>}
   * @private
   */
  async _getCardHtml(V) {
    var O, m, g;
    let E = V.getAttribute("cardHtml") ?? null, s = $(this.editor.sourceElement).parents(".field");
    const h = $(s[0]).data("layout-element");
    if (E)
      return { cardHtml: E };
    const u = V.getAttribute("entryId") ?? null, o = V.getAttribute("siteId") ?? null;
    try {
      const y = this.editor, S = $(y.ui.view.element).closest(
        "form,.lp-editor-container"
      ).data("elementEditor");
      S && await S.checkForm();
      const { data: T } = await Craft.sendActionRequest(
        "POST",
        "ckeditor/ckeditor/entry-card-html",
        {
          data: {
            entryId: u,
            siteId: o,
            layoutElementUid: h
          }
        }
      );
      return T;
    } catch (y) {
      return console.error((O = y == null ? void 0 : y.response) == null ? void 0 : O.data), { cardHtml: '<div class="element card"><div class="card-content"><div class="card-heading"><div class="label error"><span>' + (((g = (m = y == null ? void 0 : y.response) == null ? void 0 : m.data) == null ? void 0 : g.message) || "An unknown error occurred.") + "</span></div></div></div></div>" };
    }
  }
}
class cu extends Qc {
  constructor(V) {
    super(V), this.domEventType = "dblclick";
  }
  onDomEvent(V) {
    this.fire(V.type, V);
  }
}
class uu extends rr {
  /**
   * @inheritDoc
   */
  static get requires() {
    return [Gl];
  }
  /**
   * @inheritDoc
   */
  static get pluginName() {
    return "CraftEntriesUI";
  }
  /**
   * @inheritDoc
   */
  init() {
    this.editor.ui.componentFactory.add("createEntry", (V) => this._createToolbarEntriesButton(V)), this.editor.ui.componentFactory.add("editEntryBtn", (V) => this._createEditEntryBtn(V)), this._listenToEvents();
  }
  /**
   * @inheritDoc
   */
  afterInit() {
    this.editor.plugins.get(
      Gl
    ).register("entriesBalloon", {
      ariaLabel: Craft.t("ckeditor", "Entry toolbar"),
      // Toolbar Buttons
      items: ["editEntryBtn"],
      // If a related element is returned the toolbar is attached
      getRelatedElement: (E) => {
        const s = E.getSelectedElement();
        return s && Gc(s) && s.hasClass("cke-entry-card") ? s : null;
      }
    });
  }
  /**
   * Hook up event listeners
   *
   * @private
   */
  _listenToEvents() {
    const V = this.editor.editing.view, E = V.document;
    V.addObserver(cu), this.editor.listenTo(E, "dblclick", (s, h) => {
      const u = this.editor.editing.mapper.toModelElement(
        h.target.parent
      );
      u.name === "craftEntryModel" && this._initEditEntrySlideout(h, u);
    });
  }
  _initEditEntrySlideout(V = null, E = null) {
    E === null && (E = this.editor.model.document.selection.getSelectedElement());
    const s = E.getAttribute("entryId"), h = E.getAttribute("siteId") ?? null;
    this._showEditEntrySlideout(s, h, E);
  }
  /**
   * Creates a toolbar button that allows for an entry to be inserted into the editor
   *
   * @param locale
   * @private
   */
  _createToolbarEntriesButton(V) {
    const E = this.editor, s = E.config.get("entryTypeOptions"), h = E.commands.get("insertEntry");
    if (!s || !s.length)
      return;
    const u = _a(V);
    return u.buttonView.set({
      label: E.config.get("createButtonLabel") || Craft.t("app", "New {type}", {
        type: Craft.t("app", "entry")
      }),
      tooltip: !0,
      withText: !0
      //commandValue: null,
    }), u.bind("isEnabled").to(h), xa(
      u,
      () => this._getDropdownItemsDefinitions(s, h),
      {
        ariaLabel: Craft.t("ckeditor", "Entry types list")
      }
    ), this.listenTo(u, "execute", (o) => {
      this._showCreateEntrySlideout(o.source.commandValue);
    }), u;
  }
  /**
   * Creates a list of entry type options that go into the insert entry button
   *
   * @param options
   * @param command
   * @returns {Collection<Record<string, any>>}
   * @private
   */
  _getDropdownItemsDefinitions(V, E) {
    const s = new Sa();
    return V.map((h) => {
      const u = {
        type: "button",
        model: new $o({
          commandValue: h.value,
          //entry type id
          label: h.label || h.value,
          icon: h.icon,
          withText: !0
        })
      };
      s.add(u);
    }), s;
  }
  /**
   * Creates an edit entry button that shows in the contextual balloon for each craft entry widget
   * @param locale
   * @returns {ButtonView}
   * @private
   */
  _createEditEntryBtn(V) {
    const E = new Cs(V);
    return E.set({
      isEnabled: !0,
      label: Craft.t("app", "Edit {type}", {
        type: Craft.elementTypeNames["craft\\elements\\Entry"][2]
      }),
      tooltip: !0,
      withText: !0
    }), this.listenTo(E, "execute", (s) => {
      this._initEditEntrySlideout();
    }), E;
  }
  /**
   * Returns Craft.ElementEditor instance that the CKEditor field belongs to.
   *
   * @returns {*}
   */
  getElementEditor() {
    return $(this.editor.ui.view.element).closest(
      "form,.lp-editor-container"
    ).data("elementEditor");
  }
  /**
   * Returns HTML of the card by the entry ID.
   *
   * @param entryId
   * @returns {*}
   * @private
   */
  _getCardElement(V) {
    return $(this.editor.ui.element).find('.element.card[data-id="' + V + '"]');
  }
  /**
   * Opens an element editor for existing entry
   *
   * @param entryId
   * @private
   */
  _showEditEntrySlideout(V, E, s) {
    const h = this.editor, u = this.getElementEditor();
    let o = this._getCardElement(V);
    const O = o.data("owner-id"), m = Craft.createElementEditor(this.elementType, null, {
      elementId: V,
      params: {
        siteId: E
      },
      onBeforeSubmit: async () => {
        if (o !== null && Garnish.hasAttr(o, "data-owner-is-canonical") && !u.settings.isUnpublishedDraft) {
          await m.elementEditor.checkForm(!0, !0);
          let g = $(h.sourceElement).attr("name");
          u && g && await u.setFormValue(g, "*"), u.settings.draftId && m.elementEditor.settings.draftId && (m.elementEditor.settings.saveParams || (m.elementEditor.settings.saveParams = {}), m.elementEditor.settings.saveParams.action = "elements/save-nested-element-for-derivative", m.elementEditor.settings.saveParams.newOwnerId = u.getDraftElementId(O));
        }
      },
      onSubmit: (g) => {
        let y = this._getCardElement(V);
        y !== null && g.data.id != y.data("id") && (y.attr("data-id", g.data.id).data("id", g.data.id).data("owner-id", g.data.ownerId), h.editing.model.change((b) => {
          b.setAttribute("entryId", g.data.id, s), h.ui.update();
        }), Craft.refreshElementInstances(g.data.id));
      }
    });
  }
  /**
   * Creates new entry and opens the element editor for it
   *
   * @param entryTypeId
   * @private
   */
  async _showCreateEntrySlideout(V) {
    var m, g;
    const E = this.editor, s = E.config.get(
      "nestedElementAttributes"
    ), h = Object.assign({}, s, {
      typeId: V
    }), u = this.getElementEditor();
    u && (await u.markDeltaNameAsModified(E.sourceElement.name), h.ownerId = u.getDraftElementId(
      s.ownerId
    ));
    let o;
    try {
      o = (await Craft.sendActionRequest(
        "POST",
        "elements/create",
        {
          data: h
        }
      )).data;
    } catch (y) {
      throw Craft.cp.displayError((g = (m = y == null ? void 0 : y.response) == null ? void 0 : m.data) == null ? void 0 : g.error), y;
    }
    Craft.createElementEditor(this.elementType, {
      elementId: o.element.id,
      draftId: o.element.draftId,
      params: {
        fresh: 1,
        siteId: o.element.siteId
      }
    }).on("submit", (y) => {
      E.commands.execute("insertEntry", {
        entryId: y.data.id,
        siteId: y.data.siteId
      });
    });
  }
}
class fu extends rr {
  static get requires() {
    return [lu, uu];
  }
  static get pluginName() {
    return "CraftEntries";
  }
}
function du(Oe) {
  return Oe && Oe.__esModule && Object.prototype.hasOwnProperty.call(Oe, "default") ? Oe.default : Oe;
}
var Ss = { exports: {} };
/*! For license information please see inspector.js.LICENSE.txt */
var Xl;
function pu() {
  return Xl || (Xl = 1, function(Oe, V) {
    (function(E, s) {
      Oe.exports = s();
    })(window, function() {
      return function(E) {
        var s = {};
        function h(u) {
          if (s[u]) return s[u].exports;
          var o = s[u] = { i: u, l: !1, exports: {} };
          return E[u].call(o.exports, o, o.exports, h), o.l = !0, o.exports;
        }
        return h.m = E, h.c = s, h.d = function(u, o, O) {
          h.o(u, o) || Object.defineProperty(u, o, { enumerable: !0, get: O });
        }, h.r = function(u) {
          typeof Symbol < "u" && Symbol.toStringTag && Object.defineProperty(u, Symbol.toStringTag, { value: "Module" }), Object.defineProperty(u, "__esModule", { value: !0 });
        }, h.t = function(u, o) {
          if (1 & o && (u = h(u)), 8 & o || 4 & o && typeof u == "object" && u && u.__esModule) return u;
          var O = /* @__PURE__ */ Object.create(null);
          if (h.r(O), Object.defineProperty(O, "default", { enumerable: !0, value: u }), 2 & o && typeof u != "string") for (var m in u) h.d(O, m, (function(g) {
            return u[g];
          }).bind(null, m));
          return O;
        }, h.n = function(u) {
          var o = u && u.__esModule ? function() {
            return u.default;
          } : function() {
            return u;
          };
          return h.d(o, "a", o), o;
        }, h.o = function(u, o) {
          return Object.prototype.hasOwnProperty.call(u, o);
        }, h.p = "", h(h.s = 94);
      }([function(E, s, h) {
        E.exports = h(21);
      }, function(E, s, h) {
        h.d(s, "a", function() {
          return o;
        }), h.d(s, "b", function() {
          return O;
        }), h.d(s, "c", function() {
          return m;
        });
        var u = h(19);
        function o(y, b = !0) {
          if (y === void 0) return "undefined";
          if (typeof y == "function") return "function() {…}";
          const S = Object(u.stringify)(y, g, null, { maxDepth: 2 });
          return b ? S : S.replace(/(^"|"$)/g, "");
        }
        function O(y) {
          const b = {};
          for (const S in y) b[S] = y[S], b[S].value = o(b[S].value);
          return b;
        }
        function m(y, b) {
          return y.length > b ? y.substr(0, b) + `… [${y.length - b} characters left]` : y;
        }
        function g(y, b, S) {
          return typeof y == "string" ? `"${y.replace("'", '"')}"` : S(y);
        }
      }, function(E, s, h) {
        function u(P) {
          return P && P.name;
        }
        function o(P) {
          return P && u(P) && P.is("attributeElement");
        }
        function O(P) {
          return P && u(P) && P.is("emptyElement");
        }
        function m(P) {
          return P && u(P) && P.is("uiElement");
        }
        function g(P) {
          return P && u(P) && P.is("rawElement");
        }
        function y(P) {
          return P && u(P) && P.is("editableElement");
        }
        function b(P) {
          return P && P.is("rootElement");
        }
        function S(P) {
          return { path: [...P.parent.getPath(), P.offset], offset: P.offset, isAtEnd: P.isAtEnd, isAtStart: P.isAtStart, parent: T(P.parent) };
        }
        function T(P) {
          return u(P) ? o(P) ? "attribute:" + P.name : b(P) ? "root:" + P.name : "container:" + P.name : P.data;
        }
        h.d(s, "d", function() {
          return u;
        }), h.d(s, "b", function() {
          return o;
        }), h.d(s, "e", function() {
          return O;
        }), h.d(s, "h", function() {
          return m;
        }), h.d(s, "f", function() {
          return g;
        }), h.d(s, "c", function() {
          return y;
        }), h.d(s, "g", function() {
          return b;
        }), h.d(s, "a", function() {
          return S;
        });
      }, function(E, s, h) {
        h.d(s, "a", function() {
          return u;
        });
        class u {
          static group(...O) {
            console.group(...O);
          }
          static groupEnd(...O) {
            console.groupEnd(...O);
          }
          static log(...O) {
            console.log(...O);
          }
          static warn(...O) {
            console.warn(...O);
          }
        }
      }, function(E, s, h) {
        function u(g) {
          return g && g.is("element");
        }
        function o(g) {
          return g && g.is("rootElement");
        }
        function O(g) {
          return g.getPath ? g.getPath() : g.path;
        }
        function m(g) {
          return { path: O(g), stickiness: g.stickiness, index: g.index, isAtEnd: g.isAtEnd, isAtStart: g.isAtStart, offset: g.offset, textNode: g.textNode && g.textNode.data };
        }
        h.d(s, "c", function() {
          return u;
        }), h.d(s, "d", function() {
          return o;
        }), h.d(s, "b", function() {
          return O;
        }), h.d(s, "a", function() {
          return m;
        });
      }, function(E, s, h) {
        (function(u, o) {
          var O = "[object Arguments]", m = "[object Map]", g = "[object Object]", y = "[object Set]", b = /^\[object .+?Constructor\]$/, S = /^(?:0|[1-9]\d*)$/, T = {};
          T["[object Float32Array]"] = T["[object Float64Array]"] = T["[object Int8Array]"] = T["[object Int16Array]"] = T["[object Int32Array]"] = T["[object Uint8Array]"] = T["[object Uint8ClampedArray]"] = T["[object Uint16Array]"] = T["[object Uint32Array]"] = !0, T[O] = T["[object Array]"] = T["[object ArrayBuffer]"] = T["[object Boolean]"] = T["[object DataView]"] = T["[object Date]"] = T["[object Error]"] = T["[object Function]"] = T[m] = T["[object Number]"] = T[g] = T["[object RegExp]"] = T[y] = T["[object String]"] = T["[object WeakMap]"] = !1;
          var P = typeof u == "object" && u && u.Object === Object && u, Z = typeof self == "object" && self && self.Object === Object && self, Q = P || Z || Function("return this")(), j = s && !s.nodeType && s, W = j && typeof o == "object" && o && !o.nodeType && o, N = W && W.exports === j, A = N && P.process, F = function() {
            try {
              return A && A.binding && A.binding("util");
            } catch {
            }
          }(), R = F && F.isTypedArray;
          function oe(H, ae) {
            for (var we = -1, Se = H == null ? 0 : H.length; ++we < Se; ) if (ae(H[we], we, H)) return !0;
            return !1;
          }
          function K(H) {
            var ae = -1, we = Array(H.size);
            return H.forEach(function(Se, it) {
              we[++ae] = [it, Se];
            }), we;
          }
          function I(H) {
            var ae = -1, we = Array(H.size);
            return H.forEach(function(Se) {
              we[++ae] = Se;
            }), we;
          }
          var M, se, le, te = Array.prototype, ce = Function.prototype, ye = Object.prototype, J = Q["__core-js_shared__"], fe = ce.toString, D = ye.hasOwnProperty, ie = (M = /[^.]+$/.exec(J && J.keys && J.keys.IE_PROTO || "")) ? "Symbol(src)_1." + M : "", be = ye.toString, Ce = RegExp("^" + fe.call(D).replace(/[\\^$.*+?()[\]{}|]/g, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"), ke = N ? Q.Buffer : void 0, Ne = Q.Symbol, xe = Q.Uint8Array, ze = ye.propertyIsEnumerable, Je = te.splice, G = Ne ? Ne.toStringTag : void 0, Y = Object.getOwnPropertySymbols, me = ke ? ke.isBuffer : void 0, l = (se = Object.keys, le = Object, function(H) {
            return se(le(H));
          }), f = gn(Q, "DataView"), w = gn(Q, "Map"), L = gn(Q, "Promise"), U = gn(Q, "Set"), B = gn(Q, "WeakMap"), he = gn(Object, "create"), je = bn(f), Re = bn(w), Xe = bn(L), Ve = bn(U), Mt = bn(B), wt = Ne ? Ne.prototype : void 0, Jt = wt ? wt.valueOf : void 0;
          function kt(H) {
            var ae = -1, we = H == null ? 0 : H.length;
            for (this.clear(); ++ae < we; ) {
              var Se = H[ae];
              this.set(Se[0], Se[1]);
            }
          }
          function gt(H) {
            var ae = -1, we = H == null ? 0 : H.length;
            for (this.clear(); ++ae < we; ) {
              var Se = H[ae];
              this.set(Se[0], Se[1]);
            }
          }
          function cn(H) {
            var ae = -1, we = H == null ? 0 : H.length;
            for (this.clear(); ++ae < we; ) {
              var Se = H[ae];
              this.set(Se[0], Se[1]);
            }
          }
          function Er(H) {
            var ae = -1, we = H == null ? 0 : H.length;
            for (this.__data__ = new cn(); ++ae < we; ) this.add(H[ae]);
          }
          function Tt(H) {
            var ae = this.__data__ = new gt(H);
            this.size = ae.size;
          }
          function pt(H, ae) {
            var we = ar(H), Se = !we && ir(H), it = !we && !Se && Cn(H), qe = !we && !Se && !it && Gr(H), st = we || Se || it || qe, tt = st ? function(bt, Nt) {
              for (var tn = -1, ht = Array(bt); ++tn < bt; ) ht[tn] = Nt(tn);
              return ht;
            }(H.length, String) : [], Ot = tt.length;
            for (var nt in H) !D.call(H, nt) || st && (nt == "length" || it && (nt == "offset" || nt == "parent") || qe && (nt == "buffer" || nt == "byteLength" || nt == "byteOffset") || Cr(nt, Ot)) || tt.push(nt);
            return tt;
          }
          function $n(H, ae) {
            for (var we = H.length; we--; ) if (Tr(H[we][0], ae)) return we;
            return -1;
          }
          function Sn(H) {
            return H == null ? H === void 0 ? "[object Undefined]" : "[object Null]" : G && G in Object(H) ? function(ae) {
              var we = D.call(ae, G), Se = ae[G];
              try {
                ae[G] = void 0;
                var it = !0;
              } catch {
              }
              var qe = be.call(ae);
              return it && (we ? ae[G] = Se : delete ae[G]), qe;
            }(H) : function(ae) {
              return be.call(ae);
            }(H);
          }
          function or(H) {
            return On(H) && Sn(H) == O;
          }
          function _r(H, ae, we, Se, it) {
            return H === ae || (H == null || ae == null || !On(H) && !On(ae) ? H != H && ae != ae : function(qe, st, tt, Ot, nt, bt) {
              var Nt = ar(qe), tn = ar(st), ht = Nt ? "[object Array]" : ut(qe), Wt = tn ? "[object Array]" : ut(st), Nn = (ht = ht == O ? g : ht) == g, ct = (Wt = Wt == O ? g : Wt) == g, yn = ht == Wt;
              if (yn && Cn(qe)) {
                if (!Cn(st)) return !1;
                Nt = !0, Nn = !1;
              }
              if (yn && !Nn) return bt || (bt = new Tt()), Nt || Gr(qe) ? Yt(qe, st, tt, Ot, nt, bt) : function(rt, Ue, Yn, Kt, Or, At, nn) {
                switch (Yn) {
                  case "[object DataView]":
                    if (rt.byteLength != Ue.byteLength || rt.byteOffset != Ue.byteOffset) return !1;
                    rt = rt.buffer, Ue = Ue.buffer;
                  case "[object ArrayBuffer]":
                    return !(rt.byteLength != Ue.byteLength || !At(new xe(rt), new xe(Ue)));
                  case "[object Boolean]":
                  case "[object Date]":
                  case "[object Number]":
                    return Tr(+rt, +Ue);
                  case "[object Error]":
                    return rt.name == Ue.name && rt.message == Ue.message;
                  case "[object RegExp]":
                  case "[object String]":
                    return rt == Ue + "";
                  case m:
                    var Ht = K;
                  case y:
                    var Qt = 1 & Kt;
                    if (Ht || (Ht = I), rt.size != Ue.size && !Qt) return !1;
                    var cr = nn.get(rt);
                    if (cr) return cr == Ue;
                    Kt |= 2, nn.set(rt, Ue);
                    var Dn = Yt(Ht(rt), Ht(Ue), Kt, Or, At, nn);
                    return nn.delete(rt), Dn;
                  case "[object Symbol]":
                    if (Jt) return Jt.call(rt) == Jt.call(Ue);
                }
                return !1;
              }(qe, st, ht, tt, Ot, nt, bt);
              if (!(1 & tt)) {
                var un = Nn && D.call(qe, "__wrapped__"), Pn = ct && D.call(st, "__wrapped__");
                if (un || Pn) {
                  var Eo = un ? qe.value() : qe, _o = Pn ? st.value() : st;
                  return bt || (bt = new Tt()), nt(Eo, _o, tt, Ot, bt);
                }
              }
              return yn ? (bt || (bt = new Tt()), function(rt, Ue, Yn, Kt, Or, At) {
                var nn = 1 & Yn, Ht = xr(rt), Qt = Ht.length, cr = xr(Ue).length;
                if (Qt != cr && !nn) return !1;
                for (var Dn = Qt; Dn--; ) {
                  var rn = Ht[Dn];
                  if (!(nn ? rn in Ue : D.call(Ue, rn))) return !1;
                }
                var yt = At.get(rt);
                if (yt && At.get(Ue)) return yt == Ue;
                var Et = !0;
                At.set(rt, Ue), At.set(Ue, rt);
                for (var ur = nn; ++Dn < Qt; ) {
                  rn = Ht[Dn];
                  var fr = rt[rn], vn = Ue[rn];
                  if (Kt) var Ut = nn ? Kt(vn, fr, rn, Ue, rt, At) : Kt(fr, vn, rn, rt, Ue, At);
                  if (!(Ut === void 0 ? fr === vn || Or(fr, vn, Yn, Kt, At) : Ut)) {
                    Et = !1;
                    break;
                  }
                  ur || (ur = rn == "constructor");
                }
                if (Et && !ur) {
                  var Vt = rt.constructor, on = Ue.constructor;
                  Vt == on || !("constructor" in rt) || !("constructor" in Ue) || typeof Vt == "function" && Vt instanceof Vt && typeof on == "function" && on instanceof on || (Et = !1);
                }
                return At.delete(rt), At.delete(Ue), Et;
              }(qe, st, tt, Ot, nt, bt)) : !1;
            }(H, ae, we, Se, _r, it));
          }
          function ko(H) {
            return !(!lr(H) || function(ae) {
              return !!ie && ie in ae;
            }(H)) && (sr(H) ? Ce : b).test(bn(H));
          }
          function en(H) {
            if (we = (ae = H) && ae.constructor, Se = typeof we == "function" && we.prototype || ye, ae !== Se) return l(H);
            var ae, we, Se, it = [];
            for (var qe in Object(H)) D.call(H, qe) && qe != "constructor" && it.push(qe);
            return it;
          }
          function Yt(H, ae, we, Se, it, qe) {
            var st = 1 & we, tt = H.length, Ot = ae.length;
            if (tt != Ot && !(st && Ot > tt)) return !1;
            var nt = qe.get(H);
            if (nt && qe.get(ae)) return nt == ae;
            var bt = -1, Nt = !0, tn = 2 & we ? new Er() : void 0;
            for (qe.set(H, ae), qe.set(ae, H); ++bt < tt; ) {
              var ht = H[bt], Wt = ae[bt];
              if (Se) var Nn = st ? Se(Wt, ht, bt, ae, H, qe) : Se(ht, Wt, bt, H, ae, qe);
              if (Nn !== void 0) {
                if (Nn) continue;
                Nt = !1;
                break;
              }
              if (tn) {
                if (!oe(ae, function(ct, yn) {
                  if (un = yn, !tn.has(un) && (ht === ct || it(ht, ct, we, Se, qe))) return tn.push(yn);
                  var un;
                })) {
                  Nt = !1;
                  break;
                }
              } else if (ht !== Wt && !it(ht, Wt, we, Se, qe)) {
                Nt = !1;
                break;
              }
            }
            return qe.delete(H), qe.delete(ae), Nt;
          }
          function xr(H) {
            return function(ae, we, Se) {
              var it = we(ae);
              return ar(ae) ? it : function(qe, st) {
                for (var tt = -1, Ot = st.length, nt = qe.length; ++tt < Ot; ) qe[nt + tt] = st[tt];
                return qe;
              }(it, Se(ae));
            }(H, Xr, Sr);
          }
          function qt(H, ae) {
            var we, Se, it = H.__data__;
            return ((Se = typeof (we = ae)) == "string" || Se == "number" || Se == "symbol" || Se == "boolean" ? we !== "__proto__" : we === null) ? it[typeof ae == "string" ? "string" : "hash"] : it.map;
          }
          function gn(H, ae) {
            var we = function(Se, it) {
              return Se == null ? void 0 : Se[it];
            }(H, ae);
            return ko(we) ? we : void 0;
          }
          kt.prototype.clear = function() {
            this.__data__ = he ? he(null) : {}, this.size = 0;
          }, kt.prototype.delete = function(H) {
            var ae = this.has(H) && delete this.__data__[H];
            return this.size -= ae ? 1 : 0, ae;
          }, kt.prototype.get = function(H) {
            var ae = this.__data__;
            if (he) {
              var we = ae[H];
              return we === "__lodash_hash_undefined__" ? void 0 : we;
            }
            return D.call(ae, H) ? ae[H] : void 0;
          }, kt.prototype.has = function(H) {
            var ae = this.__data__;
            return he ? ae[H] !== void 0 : D.call(ae, H);
          }, kt.prototype.set = function(H, ae) {
            var we = this.__data__;
            return this.size += this.has(H) ? 0 : 1, we[H] = he && ae === void 0 ? "__lodash_hash_undefined__" : ae, this;
          }, gt.prototype.clear = function() {
            this.__data__ = [], this.size = 0;
          }, gt.prototype.delete = function(H) {
            var ae = this.__data__, we = $n(ae, H);
            return !(we < 0) && (we == ae.length - 1 ? ae.pop() : Je.call(ae, we, 1), --this.size, !0);
          }, gt.prototype.get = function(H) {
            var ae = this.__data__, we = $n(ae, H);
            return we < 0 ? void 0 : ae[we][1];
          }, gt.prototype.has = function(H) {
            return $n(this.__data__, H) > -1;
          }, gt.prototype.set = function(H, ae) {
            var we = this.__data__, Se = $n(we, H);
            return Se < 0 ? (++this.size, we.push([H, ae])) : we[Se][1] = ae, this;
          }, cn.prototype.clear = function() {
            this.size = 0, this.__data__ = { hash: new kt(), map: new (w || gt)(), string: new kt() };
          }, cn.prototype.delete = function(H) {
            var ae = qt(this, H).delete(H);
            return this.size -= ae ? 1 : 0, ae;
          }, cn.prototype.get = function(H) {
            return qt(this, H).get(H);
          }, cn.prototype.has = function(H) {
            return qt(this, H).has(H);
          }, cn.prototype.set = function(H, ae) {
            var we = qt(this, H), Se = we.size;
            return we.set(H, ae), this.size += we.size == Se ? 0 : 1, this;
          }, Er.prototype.add = Er.prototype.push = function(H) {
            return this.__data__.set(H, "__lodash_hash_undefined__"), this;
          }, Er.prototype.has = function(H) {
            return this.__data__.has(H);
          }, Tt.prototype.clear = function() {
            this.__data__ = new gt(), this.size = 0;
          }, Tt.prototype.delete = function(H) {
            var ae = this.__data__, we = ae.delete(H);
            return this.size = ae.size, we;
          }, Tt.prototype.get = function(H) {
            return this.__data__.get(H);
          }, Tt.prototype.has = function(H) {
            return this.__data__.has(H);
          }, Tt.prototype.set = function(H, ae) {
            var we = this.__data__;
            if (we instanceof gt) {
              var Se = we.__data__;
              if (!w || Se.length < 199) return Se.push([H, ae]), this.size = ++we.size, this;
              we = this.__data__ = new cn(Se);
            }
            return we.set(H, ae), this.size = we.size, this;
          };
          var Sr = Y ? function(H) {
            return H == null ? [] : (H = Object(H), function(ae, we) {
              for (var Se = -1, it = ae == null ? 0 : ae.length, qe = 0, st = []; ++Se < it; ) {
                var tt = ae[Se];
                we(tt, Se, ae) && (st[qe++] = tt);
              }
              return st;
            }(Y(H), function(ae) {
              return ze.call(H, ae);
            }));
          } : function() {
            return [];
          }, ut = Sn;
          function Cr(H, ae) {
            return !!(ae = ae ?? 9007199254740991) && (typeof H == "number" || S.test(H)) && H > -1 && H % 1 == 0 && H < ae;
          }
          function bn(H) {
            if (H != null) {
              try {
                return fe.call(H);
              } catch {
              }
              try {
                return H + "";
              } catch {
              }
            }
            return "";
          }
          function Tr(H, ae) {
            return H === ae || H != H && ae != ae;
          }
          (f && ut(new f(new ArrayBuffer(1))) != "[object DataView]" || w && ut(new w()) != m || L && ut(L.resolve()) != "[object Promise]" || U && ut(new U()) != y || B && ut(new B()) != "[object WeakMap]") && (ut = function(H) {
            var ae = Sn(H), we = ae == g ? H.constructor : void 0, Se = we ? bn(we) : "";
            if (Se) switch (Se) {
              case je:
                return "[object DataView]";
              case Re:
                return m;
              case Xe:
                return "[object Promise]";
              case Ve:
                return y;
              case Mt:
                return "[object WeakMap]";
            }
            return ae;
          });
          var ir = or(/* @__PURE__ */ function() {
            return arguments;
          }()) ? or : function(H) {
            return On(H) && D.call(H, "callee") && !ze.call(H, "callee");
          }, ar = Array.isArray, Cn = me || function() {
            return !1;
          };
          function sr(H) {
            if (!lr(H)) return !1;
            var ae = Sn(H);
            return ae == "[object Function]" || ae == "[object GeneratorFunction]" || ae == "[object AsyncFunction]" || ae == "[object Proxy]";
          }
          function Tn(H) {
            return typeof H == "number" && H > -1 && H % 1 == 0 && H <= 9007199254740991;
          }
          function lr(H) {
            var ae = typeof H;
            return H != null && (ae == "object" || ae == "function");
          }
          function On(H) {
            return H != null && typeof H == "object";
          }
          var Gr = R ? /* @__PURE__ */ function(H) {
            return function(ae) {
              return H(ae);
            };
          }(R) : function(H) {
            return On(H) && Tn(H.length) && !!T[Sn(H)];
          };
          function Xr(H) {
            return (ae = H) != null && Tn(ae.length) && !sr(ae) ? pt(H) : en(H);
            var ae;
          }
          o.exports = function(H, ae) {
            return _r(H, ae);
          };
        }).call(this, h(15), h(33)(E));
      }, function(E, s, h) {
        var u, o = function() {
          return u === void 0 && (u = !!(window && document && document.all && !window.atob)), u;
        }, O = /* @__PURE__ */ function() {
          var N = {};
          return function(A) {
            if (N[A] === void 0) {
              var F = document.querySelector(A);
              if (window.HTMLIFrameElement && F instanceof window.HTMLIFrameElement) try {
                F = F.contentDocument.head;
              } catch {
                F = null;
              }
              N[A] = F;
            }
            return N[A];
          };
        }(), m = [];
        function g(N) {
          for (var A = -1, F = 0; F < m.length; F++) if (m[F].identifier === N) {
            A = F;
            break;
          }
          return A;
        }
        function y(N, A) {
          for (var F = {}, R = [], oe = 0; oe < N.length; oe++) {
            var K = N[oe], I = A.base ? K[0] + A.base : K[0], M = F[I] || 0, se = "".concat(I, " ").concat(M);
            F[I] = M + 1;
            var le = g(se), te = { css: K[1], media: K[2], sourceMap: K[3] };
            le !== -1 ? (m[le].references++, m[le].updater(te)) : m.push({ identifier: se, updater: W(te, A), references: 1 }), R.push(se);
          }
          return R;
        }
        function b(N) {
          var A = document.createElement("style"), F = N.attributes || {};
          if (F.nonce === void 0) {
            var R = h.nc;
            R && (F.nonce = R);
          }
          if (Object.keys(F).forEach(function(K) {
            A.setAttribute(K, F[K]);
          }), typeof N.insert == "function") N.insert(A);
          else {
            var oe = O(N.insert || "head");
            if (!oe) throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");
            oe.appendChild(A);
          }
          return A;
        }
        var S, T = (S = [], function(N, A) {
          return S[N] = A, S.filter(Boolean).join(`
`);
        });
        function P(N, A, F, R) {
          var oe = F ? "" : R.media ? "@media ".concat(R.media, " {").concat(R.css, "}") : R.css;
          if (N.styleSheet) N.styleSheet.cssText = T(A, oe);
          else {
            var K = document.createTextNode(oe), I = N.childNodes;
            I[A] && N.removeChild(I[A]), I.length ? N.insertBefore(K, I[A]) : N.appendChild(K);
          }
        }
        function Z(N, A, F) {
          var R = F.css, oe = F.media, K = F.sourceMap;
          if (oe ? N.setAttribute("media", oe) : N.removeAttribute("media"), K && typeof btoa < "u" && (R += `
/*# sourceMappingURL=data:application/json;base64,`.concat(btoa(unescape(encodeURIComponent(JSON.stringify(K)))), " */")), N.styleSheet) N.styleSheet.cssText = R;
          else {
            for (; N.firstChild; ) N.removeChild(N.firstChild);
            N.appendChild(document.createTextNode(R));
          }
        }
        var Q = null, j = 0;
        function W(N, A) {
          var F, R, oe;
          if (A.singleton) {
            var K = j++;
            F = Q || (Q = b(A)), R = P.bind(null, F, K, !1), oe = P.bind(null, F, K, !0);
          } else F = b(A), R = Z.bind(null, F, A), oe = function() {
            (function(I) {
              if (I.parentNode === null) return !1;
              I.parentNode.removeChild(I);
            })(F);
          };
          return R(N), function(I) {
            if (I) {
              if (I.css === N.css && I.media === N.media && I.sourceMap === N.sourceMap) return;
              R(N = I);
            } else oe();
          };
        }
        E.exports = function(N, A) {
          (A = A || {}).singleton || typeof A.singleton == "boolean" || (A.singleton = o());
          var F = y(N = N || [], A);
          return function(R) {
            if (R = R || [], Object.prototype.toString.call(R) === "[object Array]") {
              for (var oe = 0; oe < F.length; oe++) {
                var K = g(F[oe]);
                m[K].references--;
              }
              for (var I = y(R, A), M = 0; M < F.length; M++) {
                var se = g(F[M]);
                m[se].references === 0 && (m[se].updater(), m.splice(se, 1));
              }
              F = I;
            }
          };
        };
      }, function(E, s, h) {
        E.exports = function(u) {
          var o = [];
          return o.toString = function() {
            return this.map(function(O) {
              var m = function(g, y) {
                var b = g[1] || "", S = g[3];
                if (!S) return b;
                if (y && typeof btoa == "function") {
                  var T = (Z = S, "/*# sourceMappingURL=data:application/json;charset=utf-8;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(Z)))) + " */"), P = S.sources.map(function(Q) {
                    return "/*# sourceURL=" + S.sourceRoot + Q + " */";
                  });
                  return [b].concat(P).concat([T]).join(`
`);
                }
                var Z;
                return [b].join(`
`);
              }(O, u);
              return O[2] ? "@media " + O[2] + "{" + m + "}" : m;
            }).join("");
          }, o.i = function(O, m) {
            typeof O == "string" && (O = [[null, O, ""]]);
            for (var g = {}, y = 0; y < this.length; y++) {
              var b = this[y][0];
              b != null && (g[b] = !0);
            }
            for (y = 0; y < O.length; y++) {
              var S = O[y];
              S[0] != null && g[S[0]] || (m && !S[2] ? S[2] = m : m && (S[2] = "(" + S[2] + ") and (" + m + ")"), o.push(S));
            }
          }, o;
        };
      }, function(E, s, h) {
        h.d(s, "c", function() {
          return O;
        }), h.d(s, "b", function() {
          return m;
        }), h.d(s, "a", function() {
          return g;
        });
        var u = h(3);
        let o = 0;
        function O(y) {
          const b = { editors: {}, options: {} };
          if (typeof y[0] == "string") u.a.warn(`[CKEditorInspector] The CKEditorInspector.attach( '${y[0]}', editor ) syntax has been deprecated and will be removed in the near future. To pass a name of an editor instance, use CKEditorInspector.attach( { '${y[0]}': editor } ) instead. Learn more in https://github.com/ckeditor/ckeditor5-inspector/blob/master/README.md.`), b.editors[y[0]] = y[1];
          else {
            if ((S = y[0]).model && S.editing) b.editors["editor-" + ++o] = y[0];
            else for (const T in y[0]) b.editors[T] = y[0][T];
            b.options = y[1] || b.options;
          }
          var S;
          return b;
        }
        function m(y) {
          return [...y][0][0] || "";
        }
        function g(y, b) {
          const S = Math.min(y.length, b.length);
          for (let T = 0; T < S; T++) if (y[T] != b[T]) return T;
          return y.length == b.length ? "same" : y.length < b.length ? "prefix" : "extension";
        }
      }, function(E, s, h) {
        h.d(s, "a", function() {
          return m;
        }), h.d(s, "d", function() {
          return b;
        }), h.d(s, "c", function() {
          return S;
        }), h.d(s, "e", function() {
          return T;
        }), h.d(s, "b", function() {
          return P;
        });
        var u = h(2), o = h(8), O = h(1);
        const m = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_view", g = `&lt;!--The View UI element content has been skipped. <a href="${m}_uielement-UIElement.html" target="_blank">Find out why</a>. --&gt;`, y = `&lt;!--The View raw element content has been skipped. <a href="${m}_rawelement-RawElement.html" target="_blank">Find out why</a>. --&gt;`;
        function b(N) {
          return N ? [...N.editing.view.document.roots] : [];
        }
        function S(N, A) {
          if (!N) return [];
          const F = [], R = N.editing.view.document.selection;
          for (const oe of R.getRanges()) oe.root.rootName === A && F.push({ type: "selection", start: Object(u.a)(oe.start), end: Object(u.a)(oe.end) });
          return F;
        }
        function T({ currentEditor: N, currentRootName: A, ranges: F }) {
          return !N || !A ? null : [Z(N.editing.view.document.getRoot(A), [...F])];
        }
        function P(N) {
          const A = { editorNode: N, properties: {}, attributes: {}, customProperties: {} };
          if (Object(u.d)(N)) {
            Object(u.g)(N) ? (A.type = "RootEditableElement", A.name = N.rootName, A.url = m + "_rooteditableelement-RootEditableElement.html") : (A.name = N.name, Object(u.b)(N) ? (A.type = "AttributeElement", A.url = m + "_attributeelement-AttributeElement.html") : Object(u.e)(N) ? (A.type = "EmptyElement", A.url = m + "_emptyelement-EmptyElement.html") : Object(u.h)(N) ? (A.type = "UIElement", A.url = m + "_uielement-UIElement.html") : Object(u.f)(N) ? (A.type = "RawElement", A.url = m + "_rawelement-RawElement.html") : Object(u.c)(N) ? (A.type = "EditableElement", A.url = m + "_editableelement-EditableElement.html") : (A.type = "ContainerElement", A.url = m + "_containerelement-ContainerElement.html")), W(N).forEach(([F, R]) => {
              A.attributes[F] = { value: R };
            }), A.properties = { index: { value: N.index }, isEmpty: { value: N.isEmpty }, childCount: { value: N.childCount } };
            for (let [F, R] of N.getCustomProperties()) typeof F == "symbol" && (F = F.toString()), A.customProperties[F] = { value: R };
          } else A.name = N.data, A.type = "Text", A.url = m + "_text-Text.html", A.properties = { index: { value: N.index } };
          return A.properties = Object(O.b)(A.properties), A.customProperties = Object(O.b)(A.customProperties), A.attributes = Object(O.b)(A.attributes), A;
        }
        function Z(N, A) {
          const F = {};
          return Object.assign(F, { index: N.index, path: N.getPath(), node: N, positionsBefore: [], positionsAfter: [] }), Object(u.d)(N) ? function(R, oe) {
            const K = R.node;
            Object.assign(R, { type: "element", children: [], positions: [] }), R.name = K.name, Object(u.b)(K) ? R.elementType = "attribute" : Object(u.g)(K) ? R.elementType = "root" : Object(u.e)(K) ? R.elementType = "empty" : Object(u.h)(K) ? R.elementType = "ui" : Object(u.f)(K) ? R.elementType = "raw" : R.elementType = "container", Object(u.e)(K) ? R.presentation = { isEmpty: !0 } : Object(u.h)(K) ? R.children.push({ type: "comment", text: g }) : Object(u.f)(K) && R.children.push({ type: "comment", text: y });
            for (const I of K.getChildren()) R.children.push(Z(I, oe));
            (function(I, M) {
              for (const se of M) {
                const le = Q(I, se);
                for (const te of le) {
                  const ce = te.offset;
                  if (ce === 0) {
                    const ye = I.children[0];
                    ye ? ye.positionsBefore.push(te) : I.positions.push(te);
                  } else if (ce === I.children.length) {
                    const ye = I.children[I.children.length - 1];
                    ye ? ye.positionsAfter.push(te) : I.positions.push(te);
                  } else {
                    let ye = te.isEnd ? 0 : I.children.length - 1, J = I.children[ye];
                    for (; J; ) {
                      if (J.index === ce) {
                        J.positionsBefore.push(te);
                        break;
                      }
                      if (J.index + 1 === ce) {
                        J.positionsAfter.push(te);
                        break;
                      }
                      ye += te.isEnd ? 1 : -1, J = I.children[ye];
                    }
                  }
                }
              }
            })(R, oe), R.attributes = function(I) {
              const M = W(I).map(([se, le]) => [se, Object(O.a)(le, !1)]);
              return new Map(M);
            }(K);
          }(F, A) : function(R, oe) {
            Object.assign(R, { type: "text", startOffset: 0, text: R.node.data, positions: [] });
            for (const K of oe) {
              const I = Q(R, K);
              R.positions.push(...I);
            }
          }(F, A), F;
        }
        function Q(N, A) {
          const F = N.path, R = A.start.path, oe = A.end.path, K = [];
          return j(F, R) && K.push({ offset: R[R.length - 1], isEnd: !1, presentation: A.presentation || null, type: A.type, name: A.name || null }), j(F, oe) && K.push({ offset: oe[oe.length - 1], isEnd: !0, presentation: A.presentation || null, type: A.type, name: A.name || null }), K;
        }
        function j(N, A) {
          return N.length === A.length - 1 && Object(o.a)(N, A) === "prefix";
        }
        function W(N) {
          return [...N.getAttributes()].sort(([A], [F]) => A.toUpperCase() < F.toUpperCase() ? -1 : 1);
        }
      }, function(E, s, h) {
        h.d(s, "d", function() {
          return y;
        }), h.d(s, "c", function() {
          return b;
        }), h.d(s, "a", function() {
          return S;
        }), h.d(s, "e", function() {
          return T;
        }), h.d(s, "b", function() {
          return P;
        });
        var u = h(4), o = h(8), O = h(1);
        const m = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_", g = ["#03a9f4", "#fb8c00", "#009688", "#e91e63", "#4caf50", "#00bcd4", "#607d8b", "#cddc39", "#9c27b0", "#f44336", "#6d4c41", "#8bc34a", "#3f51b5", "#2196f3", "#f4511e", "#673ab7", "#ffb300"];
        function y(A) {
          if (!A) return [];
          const F = [...A.model.document.roots];
          return F.filter(({ rootName: R }) => R !== "$graveyard").concat(F.filter(({ rootName: R }) => R === "$graveyard"));
        }
        function b(A, F) {
          if (!A) return [];
          const R = [], oe = A.model;
          for (const K of oe.document.selection.getRanges()) K.root.rootName === F && R.push({ type: "selection", start: Object(u.a)(K.start), end: Object(u.a)(K.end) });
          return R;
        }
        function S(A, F) {
          if (!A) return [];
          const R = [], oe = A.model;
          let K = 0;
          for (const I of oe.markers) {
            const { name: M, affectsData: se, managedUsingOperations: le } = I, te = I.getStart(), ce = I.getEnd();
            te.root.rootName === F && R.push({ type: "marker", marker: I, name: M, affectsData: se, managedUsingOperations: le, presentation: { color: g[K++ % (g.length - 1)] }, start: Object(u.a)(te), end: Object(u.a)(ce) });
          }
          return R;
        }
        function T({ currentEditor: A, currentRootName: F, ranges: R, markers: oe }) {
          return A ? [Z(A.model.document.getRoot(F), [...R, ...oe])] : [];
        }
        function P(A, F) {
          const R = { editorNode: F, properties: {}, attributes: {} };
          Object(u.c)(F) ? (Object(u.d)(F) ? (R.type = "RootElement", R.name = F.rootName, R.url = m + "rootelement-RootElement.html") : (R.type = "Element", R.name = F.name, R.url = m + "element-Element.html"), R.properties = { childCount: { value: F.childCount }, startOffset: { value: F.startOffset }, endOffset: { value: F.endOffset }, maxOffset: { value: F.maxOffset } }) : (R.name = F.data, R.type = "Text", R.url = m + "text-Text.html", R.properties = { startOffset: { value: F.startOffset }, endOffset: { value: F.endOffset }, offsetSize: { value: F.offsetSize } }), R.properties.path = { value: Object(u.b)(F) }, j(F).forEach(([oe, K]) => {
            R.attributes[oe] = { value: K };
          }), R.properties = Object(O.b)(R.properties), R.attributes = Object(O.b)(R.attributes);
          for (const oe in R.attributes) {
            const K = {}, I = A.model.schema.getAttributeProperties(oe);
            for (const M in I) K[M] = { value: I[M] };
            R.attributes[oe].subProperties = Object(O.b)(K);
          }
          return R;
        }
        function Z(A, F) {
          const R = {}, { startOffset: oe, endOffset: K } = A;
          return Object.assign(R, { startOffset: oe, endOffset: K, node: A, path: A.getPath(), positionsBefore: [], positionsAfter: [] }), Object(u.c)(A) ? function(I, M) {
            const se = I.node;
            Object.assign(I, { type: "element", name: se.name, children: [], maxOffset: se.maxOffset, positions: [] });
            for (const le of se.getChildren()) I.children.push(Z(le, M));
            (function(le, te) {
              for (const ce of te) {
                const ye = W(le, ce);
                for (const J of ye) {
                  const fe = J.offset;
                  if (fe === 0) {
                    const D = le.children[0];
                    D ? D.positionsBefore.push(J) : le.positions.push(J);
                  } else if (fe === le.maxOffset) {
                    const D = le.children[le.children.length - 1];
                    D ? D.positionsAfter.push(J) : le.positions.push(J);
                  } else {
                    let D = J.isEnd ? 0 : le.children.length - 1, ie = le.children[D];
                    for (; ie; ) {
                      if (ie.startOffset === fe) {
                        ie.positionsBefore.push(J);
                        break;
                      }
                      if (ie.endOffset === fe) {
                        const be = le.children[D + 1], Ce = ie.type === "text" && be && be.type === "element", ke = ie.type === "element" && be && be.type === "text", Ne = ie.type === "text" && be && be.type === "text";
                        J.isEnd && (Ce || ke || Ne) ? be.positionsBefore.push(J) : ie.positionsAfter.push(J);
                        break;
                      }
                      if (ie.startOffset < fe && ie.endOffset > fe) {
                        ie.positions.push(J);
                        break;
                      }
                      D += J.isEnd ? 1 : -1, ie = le.children[D];
                    }
                  }
                }
              }
            })(I, M), I.attributes = Q(se);
          }(R, F) : function(I) {
            const M = I.node;
            Object.assign(I, { type: "text", text: M.data, positions: [], presentation: { dontRenderAttributeValue: !0 } }), I.attributes = Q(M);
          }(R), R;
        }
        function Q(A) {
          const F = j(A).map(([R, oe]) => [R, Object(O.a)(oe, !1)]);
          return new Map(F);
        }
        function j(A) {
          return [...A.getAttributes()].sort(([F], [R]) => F < R ? -1 : 1);
        }
        function W(A, F) {
          const R = A.path, oe = F.start.path, K = F.end.path, I = [];
          return N(R, oe) && I.push({ offset: oe[oe.length - 1], isEnd: !1, presentation: F.presentation || null, type: F.type, name: F.name || null }), N(R, K) && I.push({ offset: K[K.length - 1], isEnd: !0, presentation: F.presentation || null, type: F.type, name: F.name || null }), I;
        }
        function N(A, F) {
          return A.length === F.length - 1 && Object(o.a)(A, F) === "prefix";
        }
      }, function(E, s, h) {
        h.d(s, "a", function() {
          return j;
        });
        var u = h(0), o = h.n(u), O = h(5), m = h.n(O);
        class g extends u.Component {
          constructor(N) {
            super(N), this.handleClick = this.handleClick.bind(this);
          }
          handleClick(N) {
            this.globalTreeProps.onClick(N, this.definition.node);
          }
          getChildren() {
            return this.definition.children.map((N, A) => Q(N, A, this.props.globalTreeProps));
          }
          get definition() {
            return this.props.definition;
          }
          get globalTreeProps() {
            return this.props.globalTreeProps || {};
          }
          get isActive() {
            return this.definition.node === this.globalTreeProps.activeNode;
          }
          shouldComponentUpdate(N) {
            return !m()(this.props, N);
          }
        }
        var y = h(1);
        class b extends u.PureComponent {
          render() {
            let N;
            const A = Object(y.c)(this.props.value, 500);
            return this.props.dontRenderValue || (N = o.a.createElement("span", { className: "ck-inspector-tree-node__attribute__value" }, A)), o.a.createElement("span", { className: "ck-inspector-tree-node__attribute" }, o.a.createElement("span", { className: "ck-inspector-tree-node__attribute__name", title: A }, this.props.name), N);
          }
        }
        class S extends u.Component {
          render() {
            const N = this.props.definition, A = { className: ["ck-inspector-tree__position", N.type === "selection" ? "ck-inspector-tree__position_selection" : "", N.type === "marker" ? "ck-inspector-tree__position_marker" : "", N.isEnd ? "ck-inspector-tree__position_end" : ""].join(" "), style: {} };
            return N.presentation && N.presentation.color && (A.style["--ck-inspector-color-tree-position"] = N.presentation.color), N.type === "marker" && (A["data-marker-name"] = N.name), o.a.createElement("span", A, "​");
          }
          shouldComponentUpdate(N) {
            return !m()(this.props, N);
          }
        }
        class T extends g {
          render() {
            const N = this.definition, A = N.presentation, F = A && A.isEmpty, R = A && A.cssClass, oe = this.getChildren(), K = ["ck-inspector-code", "ck-inspector-tree-node", this.isActive ? "ck-inspector-tree-node_active" : "", F ? "ck-inspector-tree-node_empty" : "", R], I = [], M = [];
            N.positionsBefore && N.positionsBefore.forEach((le, te) => {
              I.push(o.a.createElement(S, { key: "position-before:" + te, definition: le }));
            }), N.positionsAfter && N.positionsAfter.forEach((le, te) => {
              M.push(o.a.createElement(S, { key: "position-after:" + te, definition: le }));
            }), N.positions && N.positions.forEach((le, te) => {
              oe.push(o.a.createElement(S, { key: "position" + te, definition: le }));
            });
            let se = N.name;
            return this.globalTreeProps.showElementTypes && (se = N.elementType + ":" + se), o.a.createElement("div", { className: K.join(" "), onClick: this.handleClick }, I, o.a.createElement("span", { className: "ck-inspector-tree-node__name" }, o.a.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_open" }), se, this.getAttributes(), F ? "" : o.a.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_close" })), o.a.createElement("div", { className: "ck-inspector-tree-node__content" }, oe), F ? "" : o.a.createElement("span", { className: "ck-inspector-tree-node__name ck-inspector-tree-node__name_close" }, o.a.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_open" }), "/", se, o.a.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_close" }), M));
          }
          getAttributes() {
            const N = [], A = this.definition;
            for (const [F, R] of A.attributes) N.push(o.a.createElement(b, { key: F, name: F, value: R }));
            return N;
          }
          shouldComponentUpdate(N) {
            return !m()(this.props, N);
          }
        }
        class P extends g {
          render() {
            const N = this.definition, A = ["ck-inspector-tree-text", this.isActive ? "ck-inspector-tree-node_active" : ""].join(" ");
            let F = this.definition.text;
            N.positions && N.positions.length && (F = F.split(""), Array.from(N.positions).sort((oe, K) => oe.offset < K.offset ? -1 : oe.offset === K.offset ? 0 : 1).reverse().forEach((oe, K) => {
              F.splice(oe.offset - N.startOffset, 0, o.a.createElement(S, { key: "position" + K, definition: oe }));
            }));
            const R = [F];
            return N.positionsBefore && N.positionsBefore.length && N.positionsBefore.forEach((oe, K) => {
              R.unshift(o.a.createElement(S, { key: "position-before:" + K, definition: oe }));
            }), N.positionsAfter && N.positionsAfter.length && N.positionsAfter.forEach((oe, K) => {
              R.push(o.a.createElement(S, { key: "position-after:" + K, definition: oe }));
            }), o.a.createElement("span", { className: A, onClick: this.handleClick }, o.a.createElement("span", { className: "ck-inspector-tree-node__content" }, this.globalTreeProps.showCompactText ? "" : this.getAttributes(), this.globalTreeProps.showCompactText ? "" : '"', R, this.globalTreeProps.showCompactText ? "" : '"'));
          }
          getAttributes() {
            const N = [], A = this.definition, F = A.presentation, R = F && F.dontRenderAttributeValue;
            for (const [oe, K] of A.attributes) N.push(o.a.createElement(b, { key: oe, name: oe, value: K, dontRenderValue: R }));
            return o.a.createElement("span", { className: "ck-inspector-tree-text__attributes" }, N);
          }
          shouldComponentUpdate(N) {
            return !m()(this.props, N);
          }
        }
        class Z extends u.Component {
          render() {
            return o.a.createElement("span", { className: "ck-inspector-tree-comment", dangerouslySetInnerHTML: { __html: this.props.definition.text } });
          }
        }
        function Q(W, N, A) {
          return W.type === "element" ? o.a.createElement(T, { key: N, definition: W, globalTreeProps: A }) : W.type === "text" ? o.a.createElement(P, { key: N, definition: W, globalTreeProps: A }) : W.type === "comment" ? o.a.createElement(Z, { key: N, definition: W }) : void 0;
        }
        h(34);
        class j extends u.Component {
          render() {
            let N;
            return N = this.props.definition ? this.props.definition.map((A, F) => Q(A, F, { onClick: this.props.onClick, showCompactText: this.props.showCompactText, showElementTypes: this.props.showElementTypes, activeNode: this.props.activeNode })) : "Nothing to show.", o.a.createElement("div", { className: ["ck-inspector-tree", ...this.props.className || [], this.props.textDirection ? "ck-inspector-tree_text-direction_" + this.props.textDirection : "", this.props.showCompactText ? "ck-inspector-tree_compact-text" : ""].join(" ") }, N);
          }
        }
      }, function(E, s, h) {
        (function u() {
          if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE == "function")
            try {
              __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(u);
            } catch (o) {
              console.error(o);
            }
        })(), E.exports = h(22);
      }, function(E, s, h) {
        Object.defineProperty(s, "__esModule", { value: !0 }), s.stringifyPath = s.quoteKey = s.isValidVariableName = s.IS_VALID_IDENTIFIER = s.quoteString = void 0;
        const u = /[\\\'\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, o = /* @__PURE__ */ new Map([["\b", "\\b"], ["	", "\\t"], [`
`, "\\n"], ["\f", "\\f"], ["\r", "\\r"], ["'", "\\'"], ['"', '\\"'], ["\\", "\\\\"]]);
        function O(y) {
          return o.get(y) || "\\u" + ("0000" + y.charCodeAt(0).toString(16)).slice(-4);
        }
        s.quoteString = function(y) {
          return `'${y.replace(u, O)}'`;
        };
        const m = new Set("break else new var case finally return void catch for switch while continue function this with default if throw delete in try do instanceof typeof abstract enum int short boolean export interface static byte extends long super char final native synchronized class float package throws const goto private transient debugger implements protected volatile double import public let yield".split(" "));
        function g(y) {
          return typeof y == "string" && !m.has(y) && s.IS_VALID_IDENTIFIER.test(y);
        }
        s.IS_VALID_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/, s.isValidVariableName = g, s.quoteKey = function(y, b) {
          return g(y) ? y : b(y);
        }, s.stringifyPath = function(y, b) {
          let S = "";
          for (const T of y) g(T) ? S += "." + T : S += `[${b(T)}]`;
          return S;
        };
      }, function(E, s) {
        function h(b, S, T, P) {
          var Z, Q = (Z = P) == null || typeof Z == "number" || typeof Z == "boolean" ? P : T(P), j = S.get(Q);
          return j === void 0 && (j = b.call(this, P), S.set(Q, j)), j;
        }
        function u(b, S, T) {
          var P = Array.prototype.slice.call(arguments, 3), Z = T(P), Q = S.get(Z);
          return Q === void 0 && (Q = b.apply(this, P), S.set(Z, Q)), Q;
        }
        function o(b, S, T, P, Z) {
          return T.bind(S, b, P, Z);
        }
        function O(b, S) {
          return o(b, this, b.length === 1 ? h : u, S.cache.create(), S.serializer);
        }
        function m() {
          return JSON.stringify(arguments);
        }
        function g() {
          this.cache = /* @__PURE__ */ Object.create(null);
        }
        g.prototype.has = function(b) {
          return b in this.cache;
        }, g.prototype.get = function(b) {
          return this.cache[b];
        }, g.prototype.set = function(b, S) {
          this.cache[b] = S;
        };
        var y = { create: function() {
          return new g();
        } };
        E.exports = function(b, S) {
          var T = S && S.cache ? S.cache : y, P = S && S.serializer ? S.serializer : m;
          return (S && S.strategy ? S.strategy : O)(b, { cache: T, serializer: P });
        }, E.exports.strategies = { variadic: function(b, S) {
          return o(b, this, u, S.cache.create(), S.serializer);
        }, monadic: function(b, S) {
          return o(b, this, h, S.cache.create(), S.serializer);
        } };
      }, function(E, s) {
        var h;
        h = /* @__PURE__ */ function() {
          return this;
        }();
        try {
          h = h || new Function("return this")();
        } catch {
          typeof window == "object" && (h = window);
        }
        E.exports = h;
      }, function(E, s, h) {
        var u = Object.getOwnPropertySymbols, o = Object.prototype.hasOwnProperty, O = Object.prototype.propertyIsEnumerable;
        function m(g) {
          if (g == null) throw new TypeError("Object.assign cannot be called with null or undefined");
          return Object(g);
        }
        E.exports = function() {
          try {
            if (!Object.assign) return !1;
            var g = new String("abc");
            if (g[5] = "de", Object.getOwnPropertyNames(g)[0] === "5") return !1;
            for (var y = {}, b = 0; b < 10; b++) y["_" + String.fromCharCode(b)] = b;
            if (Object.getOwnPropertyNames(y).map(function(T) {
              return y[T];
            }).join("") !== "0123456789") return !1;
            var S = {};
            return "abcdefghijklmnopqrst".split("").forEach(function(T) {
              S[T] = T;
            }), Object.keys(Object.assign({}, S)).join("") === "abcdefghijklmnopqrst";
          } catch {
            return !1;
          }
        }() ? Object.assign : function(g, y) {
          for (var b, S, T = m(g), P = 1; P < arguments.length; P++) {
            for (var Z in b = Object(arguments[P])) o.call(b, Z) && (T[Z] = b[Z]);
            if (u) {
              S = u(b);
              for (var Q = 0; Q < S.length; Q++) O.call(b, S[Q]) && (T[S[Q]] = b[S[Q]]);
            }
          }
          return T;
        };
      }, function(E, s, h) {
        Object.defineProperty(s, "__esModule", { value: !0 }), s.FunctionParser = s.dedentFunction = s.functionToString = s.USED_METHOD_KEY = void 0;
        const u = h(13), o = { " "() {
        } }[" "].toString().charAt(0) === '"', O = { Function: "function ", GeneratorFunction: "function* ", AsyncFunction: "async function ", AsyncGeneratorFunction: "async function* " }, m = { Function: "", GeneratorFunction: "*", AsyncFunction: "async ", AsyncGeneratorFunction: "async *" }, g = new Set("case delete else in instanceof new return throw typeof void , ; : + - ! ~ & | ^ * / % < > ? =".split(" "));
        s.USED_METHOD_KEY = /* @__PURE__ */ new WeakSet();
        function y(S) {
          let T;
          for (const P of S.split(`
`).slice(1)) {
            const Z = /^[\s\t]+/.exec(P);
            if (!Z) return S;
            const [Q] = Z;
            (T === void 0 || Q.length < T.length) && (T = Q);
          }
          return T ? S.split(`
` + T).join(`
`) : S;
        }
        s.functionToString = (S, T, P, Z) => {
          const Q = typeof Z == "string" ? Z : void 0;
          return Q !== void 0 && s.USED_METHOD_KEY.add(S), new b(S, T, P, Q).stringify();
        }, s.dedentFunction = y;
        class b {
          constructor(T, P, Z, Q) {
            this.fn = T, this.indent = P, this.next = Z, this.key = Q, this.pos = 0, this.hadKeyword = !1, this.fnString = Function.prototype.toString.call(T), this.fnType = T.constructor.name, this.keyQuote = Q === void 0 ? "" : u.quoteKey(Q, Z), this.keyPrefix = Q === void 0 ? "" : `${this.keyQuote}:${P ? " " : ""}`, this.isMethodCandidate = Q !== void 0 && (this.fn.name === "" || this.fn.name === Q);
          }
          stringify() {
            const T = this.tryParse();
            return T ? y(T) : `${this.keyPrefix}void ${this.next(this.fnString)}`;
          }
          getPrefix() {
            return this.isMethodCandidate && !this.hadKeyword ? m[this.fnType] + this.keyQuote : this.keyPrefix + O[this.fnType];
          }
          tryParse() {
            if (this.fnString[this.fnString.length - 1] !== "}") return this.keyPrefix + this.fnString;
            if (this.fn.name) {
              const P = this.tryStrippingName();
              if (P) return P;
            }
            const T = this.pos;
            if (this.consumeSyntax() === "class") return this.fnString;
            if (this.pos = T, this.tryParsePrefixTokens()) {
              const P = this.tryStrippingName();
              if (P) return P;
              let Z = this.pos;
              switch (this.consumeSyntax("WORD_LIKE")) {
                case "WORD_LIKE":
                  this.isMethodCandidate && !this.hadKeyword && (Z = this.pos);
                case "()":
                  if (this.fnString.substr(this.pos, 2) === "=>") return this.keyPrefix + this.fnString;
                  this.pos = Z;
                case '"':
                case "'":
                case "[]":
                  return this.getPrefix() + this.fnString.substr(this.pos);
              }
            }
          }
          tryStrippingName() {
            if (o) return;
            let T = this.pos;
            const P = this.fnString.substr(this.pos, this.fn.name.length);
            if (P === this.fn.name && (this.pos += P.length, this.consumeSyntax() === "()" && this.consumeSyntax() === "{}" && this.pos === this.fnString.length)) return !this.isMethodCandidate && u.isValidVariableName(P) || (T += P.length), this.getPrefix() + this.fnString.substr(T);
            this.pos = T;
          }
          tryParsePrefixTokens() {
            let T = this.pos;
            switch (this.hadKeyword = !1, this.fnType) {
              case "AsyncFunction":
                if (this.consumeSyntax() !== "async") return !1;
                T = this.pos;
              case "Function":
                return this.consumeSyntax() === "function" ? this.hadKeyword = !0 : this.pos = T, !0;
              case "AsyncGeneratorFunction":
                if (this.consumeSyntax() !== "async") return !1;
              case "GeneratorFunction":
                let P = this.consumeSyntax();
                return P === "function" && (P = this.consumeSyntax(), this.hadKeyword = !0), P === "*";
            }
          }
          consumeSyntax(T) {
            const P = this.consumeMatch(/^(?:([A-Za-z_0-9$\xA0-\uFFFF]+)|=>|\+\+|\-\-|.)/);
            if (!P) return;
            const [Z, Q] = P;
            if (this.consumeWhitespace(), Q) return T || Q;
            switch (Z) {
              case "(":
                return this.consumeSyntaxUntil("(", ")");
              case "[":
                return this.consumeSyntaxUntil("[", "]");
              case "{":
                return this.consumeSyntaxUntil("{", "}");
              case "`":
                return this.consumeTemplate();
              case '"':
                return this.consumeRegExp(/^(?:[^\\"]|\\.)*"/, '"');
              case "'":
                return this.consumeRegExp(/^(?:[^\\']|\\.)*'/, "'");
            }
            return Z;
          }
          consumeSyntaxUntil(T, P) {
            let Z = !0;
            for (; ; ) {
              const Q = this.consumeSyntax();
              if (Q === P) return T + P;
              if (!Q || Q === ")" || Q === "]" || Q === "}") return;
              Q === "/" && Z && this.consumeMatch(/^(?:\\.|[^\\\/\n[]|\[(?:\\.|[^\]])*\])+\/[a-z]*/) ? (Z = !1, this.consumeWhitespace()) : Z = g.has(Q);
            }
          }
          consumeMatch(T) {
            const P = T.exec(this.fnString.substr(this.pos));
            return P && (this.pos += P[0].length), P;
          }
          consumeRegExp(T, P) {
            const Z = T.exec(this.fnString.substr(this.pos));
            if (Z) return this.pos += Z[0].length, this.consumeWhitespace(), P;
          }
          consumeTemplate() {
            for (; ; ) {
              if (this.consumeMatch(/^(?:[^`$\\]|\\.|\$(?!{))*/), this.fnString[this.pos] === "`") return this.pos++, this.consumeWhitespace(), "`";
              if (this.fnString.substr(this.pos, 2) !== "${" || (this.pos += 2, this.consumeWhitespace(), !this.consumeSyntaxUntil("{", "}"))) return;
            }
          }
          consumeWhitespace() {
            this.consumeMatch(/^(?:\s|\/\/.*|\/\*[^]*?\*\/)*/);
          }
        }
        s.FunctionParser = b;
      }, function(E, s, h) {
        E.exports = h(53)();
      }, function(E, s, h) {
        Object.defineProperty(s, "__esModule", { value: !0 }), s.stringify = void 0;
        const u = h(25), o = h(13), O = Symbol("root");
        s.stringify = function(m, g, y, b = {}) {
          const S = typeof y == "string" ? y : " ".repeat(y || 0), T = [], P = /* @__PURE__ */ new Set(), Z = /* @__PURE__ */ new Map(), Q = /* @__PURE__ */ new Map();
          let j = 0;
          const { maxDepth: W = 100, references: N = !1, skipUndefinedProperties: A = !1, maxValues: F = 1e5 } = b, R = function(M) {
            return M ? (se, le, te, ce) => M(se, le, (ye) => u.toString(ye, le, te, ce), ce) : u.toString;
          }(g), oe = (M, se) => {
            if (++j > F || A && M === void 0 || T.length > W) return;
            if (se === void 0) return R(M, S, oe, se);
            T.push(se);
            const le = K(M, se === O ? void 0 : se);
            return T.pop(), le;
          }, K = N ? (M, se) => {
            if (M !== null && (typeof M == "object" || typeof M == "function" || typeof M == "symbol")) {
              if (Z.has(M)) return Q.set(T.slice(1), Z.get(M)), R(void 0, S, oe, se);
              Z.set(M, T.slice(1));
            }
            return R(M, S, oe, se);
          } : (M, se) => {
            if (P.has(M)) return;
            P.add(M);
            const le = R(M, S, oe, se);
            return P.delete(M), le;
          }, I = oe(m, O);
          if (Q.size) {
            const M = S ? " " : "", se = S ? `
` : "";
            let le = `var x${M}=${M}${I};${se}`;
            for (const [te, ce] of Q.entries())
              le += `x${o.stringifyPath(te, oe)}${M}=${M}x${o.stringifyPath(ce, oe)};${se}`;
            return `(function${M}()${M}{${se}${le}return x;${se}}())`;
          }
          return I;
        };
      }, function(E, s, h) {
        Object.defineProperty(s, "__esModule", { value: !0 }), s.findInArray = function(u, o) {
          for (var O = 0, m = u.length; O < m; O++) if (o.apply(o, [u[O], O, u])) return u[O];
        }, s.isFunction = function(u) {
          return typeof u == "function" || Object.prototype.toString.call(u) === "[object Function]";
        }, s.isNum = function(u) {
          return typeof u == "number" && !isNaN(u);
        }, s.int = function(u) {
          return parseInt(u, 10);
        }, s.dontSetMe = function(u, o, O) {
          if (u[o]) return new Error("Invalid prop ".concat(o, " passed to ").concat(O, " - do not set this, set it on the child."));
        };
      }, function(E, s, h) {
        var u = h(16), o = typeof Symbol == "function" && Symbol.for, O = o ? Symbol.for("react.element") : 60103, m = o ? Symbol.for("react.portal") : 60106, g = o ? Symbol.for("react.fragment") : 60107, y = o ? Symbol.for("react.strict_mode") : 60108, b = o ? Symbol.for("react.profiler") : 60114, S = o ? Symbol.for("react.provider") : 60109, T = o ? Symbol.for("react.context") : 60110, P = o ? Symbol.for("react.forward_ref") : 60112, Z = o ? Symbol.for("react.suspense") : 60113, Q = o ? Symbol.for("react.memo") : 60115, j = o ? Symbol.for("react.lazy") : 60116, W = typeof Symbol == "function" && Symbol.iterator;
        function N(G) {
          for (var Y = "https://reactjs.org/docs/error-decoder.html?invariant=" + G, me = 1; me < arguments.length; me++) Y += "&args[]=" + encodeURIComponent(arguments[me]);
          return "Minified React error #" + G + "; visit " + Y + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
        }
        var A = { isMounted: function() {
          return !1;
        }, enqueueForceUpdate: function() {
        }, enqueueReplaceState: function() {
        }, enqueueSetState: function() {
        } }, F = {};
        function R(G, Y, me) {
          this.props = G, this.context = Y, this.refs = F, this.updater = me || A;
        }
        function oe() {
        }
        function K(G, Y, me) {
          this.props = G, this.context = Y, this.refs = F, this.updater = me || A;
        }
        R.prototype.isReactComponent = {}, R.prototype.setState = function(G, Y) {
          if (typeof G != "object" && typeof G != "function" && G != null) throw Error(N(85));
          this.updater.enqueueSetState(this, G, Y, "setState");
        }, R.prototype.forceUpdate = function(G) {
          this.updater.enqueueForceUpdate(this, G, "forceUpdate");
        }, oe.prototype = R.prototype;
        var I = K.prototype = new oe();
        I.constructor = K, u(I, R.prototype), I.isPureReactComponent = !0;
        var M = { current: null }, se = Object.prototype.hasOwnProperty, le = { key: !0, ref: !0, __self: !0, __source: !0 };
        function te(G, Y, me) {
          var l, f = {}, w = null, L = null;
          if (Y != null) for (l in Y.ref !== void 0 && (L = Y.ref), Y.key !== void 0 && (w = "" + Y.key), Y) se.call(Y, l) && !le.hasOwnProperty(l) && (f[l] = Y[l]);
          var U = arguments.length - 2;
          if (U === 1) f.children = me;
          else if (1 < U) {
            for (var B = Array(U), he = 0; he < U; he++) B[he] = arguments[he + 2];
            f.children = B;
          }
          if (G && G.defaultProps) for (l in U = G.defaultProps) f[l] === void 0 && (f[l] = U[l]);
          return { $$typeof: O, type: G, key: w, ref: L, props: f, _owner: M.current };
        }
        function ce(G) {
          return typeof G == "object" && G !== null && G.$$typeof === O;
        }
        var ye = /\/+/g, J = [];
        function fe(G, Y, me, l) {
          if (J.length) {
            var f = J.pop();
            return f.result = G, f.keyPrefix = Y, f.func = me, f.context = l, f.count = 0, f;
          }
          return { result: G, keyPrefix: Y, func: me, context: l, count: 0 };
        }
        function D(G) {
          G.result = null, G.keyPrefix = null, G.func = null, G.context = null, G.count = 0, 10 > J.length && J.push(G);
        }
        function ie(G, Y, me) {
          return G == null ? 0 : function l(f, w, L, U) {
            var B = typeof f;
            B !== "undefined" && B !== "boolean" || (f = null);
            var he = !1;
            if (f === null) he = !0;
            else switch (B) {
              case "string":
              case "number":
                he = !0;
                break;
              case "object":
                switch (f.$$typeof) {
                  case O:
                  case m:
                    he = !0;
                }
            }
            if (he) return L(U, f, w === "" ? "." + be(f, 0) : w), 1;
            if (he = 0, w = w === "" ? "." : w + ":", Array.isArray(f)) for (var je = 0; je < f.length; je++) {
              var Re = w + be(B = f[je], je);
              he += l(B, Re, L, U);
            }
            else if (f === null || typeof f != "object" ? Re = null : Re = typeof (Re = W && f[W] || f["@@iterator"]) == "function" ? Re : null, typeof Re == "function") for (f = Re.call(f), je = 0; !(B = f.next()).done; ) he += l(B = B.value, Re = w + be(B, je++), L, U);
            else if (B === "object") throw L = "" + f, Error(N(31, L === "[object Object]" ? "object with keys {" + Object.keys(f).join(", ") + "}" : L, ""));
            return he;
          }(G, "", Y, me);
        }
        function be(G, Y) {
          return typeof G == "object" && G !== null && G.key != null ? function(me) {
            var l = { "=": "=0", ":": "=2" };
            return "$" + ("" + me).replace(/[=:]/g, function(f) {
              return l[f];
            });
          }(G.key) : Y.toString(36);
        }
        function Ce(G, Y) {
          G.func.call(G.context, Y, G.count++);
        }
        function ke(G, Y, me) {
          var l = G.result, f = G.keyPrefix;
          G = G.func.call(G.context, Y, G.count++), Array.isArray(G) ? Ne(G, l, me, function(w) {
            return w;
          }) : G != null && (ce(G) && (G = function(w, L) {
            return { $$typeof: O, type: w.type, key: L, ref: w.ref, props: w.props, _owner: w._owner };
          }(G, f + (!G.key || Y && Y.key === G.key ? "" : ("" + G.key).replace(ye, "$&/") + "/") + me)), l.push(G));
        }
        function Ne(G, Y, me, l, f) {
          var w = "";
          me != null && (w = ("" + me).replace(ye, "$&/") + "/"), ie(G, ke, Y = fe(Y, w, l, f)), D(Y);
        }
        var xe = { current: null };
        function ze() {
          var G = xe.current;
          if (G === null) throw Error(N(321));
          return G;
        }
        var Je = { ReactCurrentDispatcher: xe, ReactCurrentBatchConfig: { suspense: null }, ReactCurrentOwner: M, IsSomeRendererActing: { current: !1 }, assign: u };
        s.Children = { map: function(G, Y, me) {
          if (G == null) return G;
          var l = [];
          return Ne(G, l, null, Y, me), l;
        }, forEach: function(G, Y, me) {
          if (G == null) return G;
          ie(G, Ce, Y = fe(null, null, Y, me)), D(Y);
        }, count: function(G) {
          return ie(G, function() {
            return null;
          }, null);
        }, toArray: function(G) {
          var Y = [];
          return Ne(G, Y, null, function(me) {
            return me;
          }), Y;
        }, only: function(G) {
          if (!ce(G)) throw Error(N(143));
          return G;
        } }, s.Component = R, s.Fragment = g, s.Profiler = b, s.PureComponent = K, s.StrictMode = y, s.Suspense = Z, s.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Je, s.cloneElement = function(G, Y, me) {
          if (G == null) throw Error(N(267, G));
          var l = u({}, G.props), f = G.key, w = G.ref, L = G._owner;
          if (Y != null) {
            if (Y.ref !== void 0 && (w = Y.ref, L = M.current), Y.key !== void 0 && (f = "" + Y.key), G.type && G.type.defaultProps) var U = G.type.defaultProps;
            for (B in Y) se.call(Y, B) && !le.hasOwnProperty(B) && (l[B] = Y[B] === void 0 && U !== void 0 ? U[B] : Y[B]);
          }
          var B = arguments.length - 2;
          if (B === 1) l.children = me;
          else if (1 < B) {
            U = Array(B);
            for (var he = 0; he < B; he++) U[he] = arguments[he + 2];
            l.children = U;
          }
          return { $$typeof: O, type: G.type, key: f, ref: w, props: l, _owner: L };
        }, s.createContext = function(G, Y) {
          return Y === void 0 && (Y = null), (G = { $$typeof: T, _calculateChangedBits: Y, _currentValue: G, _currentValue2: G, _threadCount: 0, Provider: null, Consumer: null }).Provider = { $$typeof: S, _context: G }, G.Consumer = G;
        }, s.createElement = te, s.createFactory = function(G) {
          var Y = te.bind(null, G);
          return Y.type = G, Y;
        }, s.createRef = function() {
          return { current: null };
        }, s.forwardRef = function(G) {
          return { $$typeof: P, render: G };
        }, s.isValidElement = ce, s.lazy = function(G) {
          return { $$typeof: j, _ctor: G, _status: -1, _result: null };
        }, s.memo = function(G, Y) {
          return { $$typeof: Q, type: G, compare: Y === void 0 ? null : Y };
        }, s.useCallback = function(G, Y) {
          return ze().useCallback(G, Y);
        }, s.useContext = function(G, Y) {
          return ze().useContext(G, Y);
        }, s.useDebugValue = function() {
        }, s.useEffect = function(G, Y) {
          return ze().useEffect(G, Y);
        }, s.useImperativeHandle = function(G, Y, me) {
          return ze().useImperativeHandle(G, Y, me);
        }, s.useLayoutEffect = function(G, Y) {
          return ze().useLayoutEffect(G, Y);
        }, s.useMemo = function(G, Y) {
          return ze().useMemo(G, Y);
        }, s.useReducer = function(G, Y, me) {
          return ze().useReducer(G, Y, me);
        }, s.useRef = function(G) {
          return ze().useRef(G);
        }, s.useState = function(G) {
          return ze().useState(G);
        }, s.version = "16.14.0";
      }, function(E, s, h) {
        var u = h(0), o = h(16), O = h(23);
        function m(e) {
          for (var t = "https://reactjs.org/docs/error-decoder.html?invariant=" + e, n = 1; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
          return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
        }
        if (!u) throw Error(m(227));
        function g(e, t, n, r, i, d, v, x, X) {
          var q = Array.prototype.slice.call(arguments, 3);
          try {
            t.apply(n, q);
          } catch (ge) {
            this.onError(ge);
          }
        }
        var y = !1, b = null, S = !1, T = null, P = { onError: function(e) {
          y = !0, b = e;
        } };
        function Z(e, t, n, r, i, d, v, x, X) {
          y = !1, b = null, g.apply(P, arguments);
        }
        var Q = null, j = null, W = null;
        function N(e, t, n) {
          var r = e.type || "unknown-event";
          e.currentTarget = W(n), function(i, d, v, x, X, q, ge, De, He) {
            if (Z.apply(this, arguments), y) {
              if (!y) throw Error(m(198));
              var ot = b;
              y = !1, b = null, S || (S = !0, T = ot);
            }
          }(r, t, void 0, e), e.currentTarget = null;
        }
        var A = null, F = {};
        function R() {
          if (A) for (var e in F) {
            var t = F[e], n = A.indexOf(e);
            if (!(-1 < n)) throw Error(m(96, e));
            if (!K[n]) {
              if (!t.extractEvents) throw Error(m(97, e));
              for (var r in K[n] = t, n = t.eventTypes) {
                var i = void 0, d = n[r], v = t, x = r;
                if (I.hasOwnProperty(x)) throw Error(m(99, x));
                I[x] = d;
                var X = d.phasedRegistrationNames;
                if (X) {
                  for (i in X) X.hasOwnProperty(i) && oe(X[i], v, x);
                  i = !0;
                } else d.registrationName ? (oe(d.registrationName, v, x), i = !0) : i = !1;
                if (!i) throw Error(m(98, r, e));
              }
            }
          }
        }
        function oe(e, t, n) {
          if (M[e]) throw Error(m(100, e));
          M[e] = t, se[e] = t.eventTypes[n].dependencies;
        }
        var K = [], I = {}, M = {}, se = {};
        function le(e) {
          var t, n = !1;
          for (t in e) if (e.hasOwnProperty(t)) {
            var r = e[t];
            if (!F.hasOwnProperty(t) || F[t] !== r) {
              if (F[t]) throw Error(m(102, t));
              F[t] = r, n = !0;
            }
          }
          n && R();
        }
        var te = !(typeof window > "u" || window.document === void 0 || window.document.createElement === void 0), ce = null, ye = null, J = null;
        function fe(e) {
          if (e = j(e)) {
            if (typeof ce != "function") throw Error(m(280));
            var t = e.stateNode;
            t && (t = Q(t), ce(e.stateNode, e.type, t));
          }
        }
        function D(e) {
          ye ? J ? J.push(e) : J = [e] : ye = e;
        }
        function ie() {
          if (ye) {
            var e = ye, t = J;
            if (J = ye = null, fe(e), t) for (e = 0; e < t.length; e++) fe(t[e]);
          }
        }
        function be(e, t) {
          return e(t);
        }
        function Ce(e, t, n, r, i) {
          return e(t, n, r, i);
        }
        function ke() {
        }
        var Ne = be, xe = !1, ze = !1;
        function Je() {
          ye === null && J === null || (ke(), ie());
        }
        function G(e, t, n) {
          if (ze) return e(t, n);
          ze = !0;
          try {
            return Ne(e, t, n);
          } finally {
            ze = !1, Je();
          }
        }
        var Y = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, me = Object.prototype.hasOwnProperty, l = {}, f = {};
        function w(e, t, n, r, i, d) {
          this.acceptsBooleans = t === 2 || t === 3 || t === 4, this.attributeName = r, this.attributeNamespace = i, this.mustUseProperty = n, this.propertyName = e, this.type = t, this.sanitizeURL = d;
        }
        var L = {};
        "children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(e) {
          L[e] = new w(e, 0, !1, e, null, !1);
        }), [["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(e) {
          var t = e[0];
          L[t] = new w(t, 1, !1, e[1], null, !1);
        }), ["contentEditable", "draggable", "spellCheck", "value"].forEach(function(e) {
          L[e] = new w(e, 2, !1, e.toLowerCase(), null, !1);
        }), ["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(e) {
          L[e] = new w(e, 2, !1, e, null, !1);
        }), "allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(e) {
          L[e] = new w(e, 3, !1, e.toLowerCase(), null, !1);
        }), ["checked", "multiple", "muted", "selected"].forEach(function(e) {
          L[e] = new w(e, 3, !0, e, null, !1);
        }), ["capture", "download"].forEach(function(e) {
          L[e] = new w(e, 4, !1, e, null, !1);
        }), ["cols", "rows", "size", "span"].forEach(function(e) {
          L[e] = new w(e, 6, !1, e, null, !1);
        }), ["rowSpan", "start"].forEach(function(e) {
          L[e] = new w(e, 5, !1, e.toLowerCase(), null, !1);
        });
        var U = /[\-:]([a-z])/g;
        function B(e) {
          return e[1].toUpperCase();
        }
        "accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e) {
          var t = e.replace(U, B);
          L[t] = new w(t, 1, !1, e, null, !1);
        }), "xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e) {
          var t = e.replace(U, B);
          L[t] = new w(t, 1, !1, e, "http://www.w3.org/1999/xlink", !1);
        }), ["xml:base", "xml:lang", "xml:space"].forEach(function(e) {
          var t = e.replace(U, B);
          L[t] = new w(t, 1, !1, e, "http://www.w3.org/XML/1998/namespace", !1);
        }), ["tabIndex", "crossOrigin"].forEach(function(e) {
          L[e] = new w(e, 1, !1, e.toLowerCase(), null, !1);
        }), L.xlinkHref = new w("xlinkHref", 1, !1, "xlink:href", "http://www.w3.org/1999/xlink", !0), ["src", "href", "action", "formAction"].forEach(function(e) {
          L[e] = new w(e, 1, !1, e.toLowerCase(), null, !0);
        });
        var he = u.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
        function je(e, t, n, r) {
          var i = L.hasOwnProperty(t) ? L[t] : null;
          (i !== null ? i.type === 0 : !r && 2 < t.length && (t[0] === "o" || t[0] === "O") && (t[1] === "n" || t[1] === "N")) || (function(d, v, x, X) {
            if (v == null || function(q, ge, De, He) {
              if (De !== null && De.type === 0) return !1;
              switch (typeof ge) {
                case "function":
                case "symbol":
                  return !0;
                case "boolean":
                  return !He && (De !== null ? !De.acceptsBooleans : (q = q.toLowerCase().slice(0, 5)) !== "data-" && q !== "aria-");
                default:
                  return !1;
              }
            }(d, v, x, X)) return !0;
            if (X) return !1;
            if (x !== null) switch (x.type) {
              case 3:
                return !v;
              case 4:
                return v === !1;
              case 5:
                return isNaN(v);
              case 6:
                return isNaN(v) || 1 > v;
            }
            return !1;
          }(t, n, i, r) && (n = null), r || i === null ? function(d) {
            return !!me.call(f, d) || !me.call(l, d) && (Y.test(d) ? f[d] = !0 : (l[d] = !0, !1));
          }(t) && (n === null ? e.removeAttribute(t) : e.setAttribute(t, "" + n)) : i.mustUseProperty ? e[i.propertyName] = n === null ? i.type !== 3 && "" : n : (t = i.attributeName, r = i.attributeNamespace, n === null ? e.removeAttribute(t) : (n = (i = i.type) === 3 || i === 4 && n === !0 ? "" : "" + n, r ? e.setAttributeNS(r, t, n) : e.setAttribute(t, n))));
        }
        he.hasOwnProperty("ReactCurrentDispatcher") || (he.ReactCurrentDispatcher = { current: null }), he.hasOwnProperty("ReactCurrentBatchConfig") || (he.ReactCurrentBatchConfig = { suspense: null });
        var Re = /^(.*)[\\\/]/, Xe = typeof Symbol == "function" && Symbol.for, Ve = Xe ? Symbol.for("react.element") : 60103, Mt = Xe ? Symbol.for("react.portal") : 60106, wt = Xe ? Symbol.for("react.fragment") : 60107, Jt = Xe ? Symbol.for("react.strict_mode") : 60108, kt = Xe ? Symbol.for("react.profiler") : 60114, gt = Xe ? Symbol.for("react.provider") : 60109, cn = Xe ? Symbol.for("react.context") : 60110, Er = Xe ? Symbol.for("react.concurrent_mode") : 60111, Tt = Xe ? Symbol.for("react.forward_ref") : 60112, pt = Xe ? Symbol.for("react.suspense") : 60113, $n = Xe ? Symbol.for("react.suspense_list") : 60120, Sn = Xe ? Symbol.for("react.memo") : 60115, or = Xe ? Symbol.for("react.lazy") : 60116, _r = Xe ? Symbol.for("react.block") : 60121, ko = typeof Symbol == "function" && Symbol.iterator;
        function en(e) {
          return e === null || typeof e != "object" ? null : typeof (e = ko && e[ko] || e["@@iterator"]) == "function" ? e : null;
        }
        function Yt(e) {
          if (e == null) return null;
          if (typeof e == "function") return e.displayName || e.name || null;
          if (typeof e == "string") return e;
          switch (e) {
            case wt:
              return "Fragment";
            case Mt:
              return "Portal";
            case kt:
              return "Profiler";
            case Jt:
              return "StrictMode";
            case pt:
              return "Suspense";
            case $n:
              return "SuspenseList";
          }
          if (typeof e == "object") switch (e.$$typeof) {
            case cn:
              return "Context.Consumer";
            case gt:
              return "Context.Provider";
            case Tt:
              var t = e.render;
              return t = t.displayName || t.name || "", e.displayName || (t !== "" ? "ForwardRef(" + t + ")" : "ForwardRef");
            case Sn:
              return Yt(e.type);
            case _r:
              return Yt(e.render);
            case or:
              if (e = e._status === 1 ? e._result : null) return Yt(e);
          }
          return null;
        }
        function xr(e) {
          var t = "";
          do {
            e: switch (e.tag) {
              case 3:
              case 4:
              case 6:
              case 7:
              case 10:
              case 9:
                var n = "";
                break e;
              default:
                var r = e._debugOwner, i = e._debugSource, d = Yt(e.type);
                n = null, r && (n = Yt(r.type)), r = d, d = "", i ? d = " (at " + i.fileName.replace(Re, "") + ":" + i.lineNumber + ")" : n && (d = " (created by " + n + ")"), n = `
    in ` + (r || "Unknown") + d;
            }
            t += n, e = e.return;
          } while (e);
          return t;
        }
        function qt(e) {
          switch (typeof e) {
            case "boolean":
            case "number":
            case "object":
            case "string":
            case "undefined":
              return e;
            default:
              return "";
          }
        }
        function gn(e) {
          var t = e.type;
          return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
        }
        function Sr(e) {
          e._valueTracker || (e._valueTracker = function(t) {
            var n = gn(t) ? "checked" : "value", r = Object.getOwnPropertyDescriptor(t.constructor.prototype, n), i = "" + t[n];
            if (!t.hasOwnProperty(n) && r !== void 0 && typeof r.get == "function" && typeof r.set == "function") {
              var d = r.get, v = r.set;
              return Object.defineProperty(t, n, { configurable: !0, get: function() {
                return d.call(this);
              }, set: function(x) {
                i = "" + x, v.call(this, x);
              } }), Object.defineProperty(t, n, { enumerable: r.enumerable }), { getValue: function() {
                return i;
              }, setValue: function(x) {
                i = "" + x;
              }, stopTracking: function() {
                t._valueTracker = null, delete t[n];
              } };
            }
          }(e));
        }
        function ut(e) {
          if (!e) return !1;
          var t = e._valueTracker;
          if (!t) return !0;
          var n = t.getValue(), r = "";
          return e && (r = gn(e) ? e.checked ? "true" : "false" : e.value), (e = r) !== n && (t.setValue(e), !0);
        }
        function Cr(e, t) {
          var n = t.checked;
          return o({}, t, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: n ?? e._wrapperState.initialChecked });
        }
        function bn(e, t) {
          var n = t.defaultValue == null ? "" : t.defaultValue, r = t.checked != null ? t.checked : t.defaultChecked;
          n = qt(t.value != null ? t.value : n), e._wrapperState = { initialChecked: r, initialValue: n, controlled: t.type === "checkbox" || t.type === "radio" ? t.checked != null : t.value != null };
        }
        function Tr(e, t) {
          (t = t.checked) != null && je(e, "checked", t, !1);
        }
        function ir(e, t) {
          Tr(e, t);
          var n = qt(t.value), r = t.type;
          if (n != null) r === "number" ? (n === 0 && e.value === "" || e.value != n) && (e.value = "" + n) : e.value !== "" + n && (e.value = "" + n);
          else if (r === "submit" || r === "reset") return void e.removeAttribute("value");
          t.hasOwnProperty("value") ? Cn(e, t.type, n) : t.hasOwnProperty("defaultValue") && Cn(e, t.type, qt(t.defaultValue)), t.checked == null && t.defaultChecked != null && (e.defaultChecked = !!t.defaultChecked);
        }
        function ar(e, t, n) {
          if (t.hasOwnProperty("value") || t.hasOwnProperty("defaultValue")) {
            var r = t.type;
            if (!(r !== "submit" && r !== "reset" || t.value !== void 0 && t.value !== null)) return;
            t = "" + e._wrapperState.initialValue, n || t === e.value || (e.value = t), e.defaultValue = t;
          }
          (n = e.name) !== "" && (e.name = ""), e.defaultChecked = !!e._wrapperState.initialChecked, n !== "" && (e.name = n);
        }
        function Cn(e, t, n) {
          t === "number" && e.ownerDocument.activeElement === e || (n == null ? e.defaultValue = "" + e._wrapperState.initialValue : e.defaultValue !== "" + n && (e.defaultValue = "" + n));
        }
        function sr(e, t) {
          return e = o({ children: void 0 }, t), (t = function(n) {
            var r = "";
            return u.Children.forEach(n, function(i) {
              i != null && (r += i);
            }), r;
          }(t.children)) && (e.children = t), e;
        }
        function Tn(e, t, n, r) {
          if (e = e.options, t) {
            t = {};
            for (var i = 0; i < n.length; i++) t["$" + n[i]] = !0;
            for (n = 0; n < e.length; n++) i = t.hasOwnProperty("$" + e[n].value), e[n].selected !== i && (e[n].selected = i), i && r && (e[n].defaultSelected = !0);
          } else {
            for (n = "" + qt(n), t = null, i = 0; i < e.length; i++) {
              if (e[i].value === n) return e[i].selected = !0, void (r && (e[i].defaultSelected = !0));
              t !== null || e[i].disabled || (t = e[i]);
            }
            t !== null && (t.selected = !0);
          }
        }
        function lr(e, t) {
          if (t.dangerouslySetInnerHTML != null) throw Error(m(91));
          return o({}, t, { value: void 0, defaultValue: void 0, children: "" + e._wrapperState.initialValue });
        }
        function On(e, t) {
          var n = t.value;
          if (n == null) {
            if (n = t.children, t = t.defaultValue, n != null) {
              if (t != null) throw Error(m(92));
              if (Array.isArray(n)) {
                if (!(1 >= n.length)) throw Error(m(93));
                n = n[0];
              }
              t = n;
            }
            t == null && (t = ""), n = t;
          }
          e._wrapperState = { initialValue: qt(n) };
        }
        function Gr(e, t) {
          var n = qt(t.value), r = qt(t.defaultValue);
          n != null && ((n = "" + n) !== e.value && (e.value = n), t.defaultValue == null && e.defaultValue !== n && (e.defaultValue = n)), r != null && (e.defaultValue = "" + r);
        }
        function Xr(e) {
          var t = e.textContent;
          t === e._wrapperState.initialValue && t !== "" && t !== null && (e.value = t);
        }
        var H = "http://www.w3.org/1999/xhtml", ae = "http://www.w3.org/2000/svg";
        function we(e) {
          switch (e) {
            case "svg":
              return "http://www.w3.org/2000/svg";
            case "math":
              return "http://www.w3.org/1998/Math/MathML";
            default:
              return "http://www.w3.org/1999/xhtml";
          }
        }
        function Se(e, t) {
          return e == null || e === "http://www.w3.org/1999/xhtml" ? we(t) : e === "http://www.w3.org/2000/svg" && t === "foreignObject" ? "http://www.w3.org/1999/xhtml" : e;
        }
        var it, qe = function(e) {
          return typeof MSApp < "u" && MSApp.execUnsafeLocalFunction ? function(t, n, r, i) {
            MSApp.execUnsafeLocalFunction(function() {
              return e(t, n);
            });
          } : e;
        }(function(e, t) {
          if (e.namespaceURI !== ae || "innerHTML" in e) e.innerHTML = t;
          else {
            for ((it = it || document.createElement("div")).innerHTML = "<svg>" + t.valueOf().toString() + "</svg>", t = it.firstChild; e.firstChild; ) e.removeChild(e.firstChild);
            for (; t.firstChild; ) e.appendChild(t.firstChild);
          }
        });
        function st(e, t) {
          if (t) {
            var n = e.firstChild;
            if (n && n === e.lastChild && n.nodeType === 3) return void (n.nodeValue = t);
          }
          e.textContent = t;
        }
        function tt(e, t) {
          var n = {};
          return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
        }
        var Ot = { animationend: tt("Animation", "AnimationEnd"), animationiteration: tt("Animation", "AnimationIteration"), animationstart: tt("Animation", "AnimationStart"), transitionend: tt("Transition", "TransitionEnd") }, nt = {}, bt = {};
        function Nt(e) {
          if (nt[e]) return nt[e];
          if (!Ot[e]) return e;
          var t, n = Ot[e];
          for (t in n) if (n.hasOwnProperty(t) && t in bt) return nt[e] = n[t];
          return e;
        }
        te && (bt = document.createElement("div").style, "AnimationEvent" in window || (delete Ot.animationend.animation, delete Ot.animationiteration.animation, delete Ot.animationstart.animation), "TransitionEvent" in window || delete Ot.transitionend.transition);
        var tn = Nt("animationend"), ht = Nt("animationiteration"), Wt = Nt("animationstart"), Nn = Nt("transitionend"), ct = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), yn = new (typeof WeakMap == "function" ? WeakMap : Map)();
        function un(e) {
          var t = yn.get(e);
          return t === void 0 && (t = /* @__PURE__ */ new Map(), yn.set(e, t)), t;
        }
        function Pn(e) {
          var t = e, n = e;
          if (e.alternate) for (; t.return; ) t = t.return;
          else {
            e = t;
            do
              1026 & (t = e).effectTag && (n = t.return), e = t.return;
            while (e);
          }
          return t.tag === 3 ? n : null;
        }
        function Eo(e) {
          if (e.tag === 13) {
            var t = e.memoizedState;
            if (t === null && (e = e.alternate) !== null && (t = e.memoizedState), t !== null) return t.dehydrated;
          }
          return null;
        }
        function _o(e) {
          if (Pn(e) !== e) throw Error(m(188));
        }
        function rt(e) {
          if (!(e = function(n) {
            var r = n.alternate;
            if (!r) {
              if ((r = Pn(n)) === null) throw Error(m(188));
              return r !== n ? null : n;
            }
            for (var i = n, d = r; ; ) {
              var v = i.return;
              if (v === null) break;
              var x = v.alternate;
              if (x === null) {
                if ((d = v.return) !== null) {
                  i = d;
                  continue;
                }
                break;
              }
              if (v.child === x.child) {
                for (x = v.child; x; ) {
                  if (x === i) return _o(v), n;
                  if (x === d) return _o(v), r;
                  x = x.sibling;
                }
                throw Error(m(188));
              }
              if (i.return !== d.return) i = v, d = x;
              else {
                for (var X = !1, q = v.child; q; ) {
                  if (q === i) {
                    X = !0, i = v, d = x;
                    break;
                  }
                  if (q === d) {
                    X = !0, d = v, i = x;
                    break;
                  }
                  q = q.sibling;
                }
                if (!X) {
                  for (q = x.child; q; ) {
                    if (q === i) {
                      X = !0, i = x, d = v;
                      break;
                    }
                    if (q === d) {
                      X = !0, d = x, i = v;
                      break;
                    }
                    q = q.sibling;
                  }
                  if (!X) throw Error(m(189));
                }
              }
              if (i.alternate !== d) throw Error(m(190));
            }
            if (i.tag !== 3) throw Error(m(188));
            return i.stateNode.current === i ? n : r;
          }(e))) return null;
          for (var t = e; ; ) {
            if (t.tag === 5 || t.tag === 6) return t;
            if (t.child) t.child.return = t, t = t.child;
            else {
              if (t === e) break;
              for (; !t.sibling; ) {
                if (!t.return || t.return === e) return null;
                t = t.return;
              }
              t.sibling.return = t.return, t = t.sibling;
            }
          }
          return null;
        }
        function Ue(e, t) {
          if (t == null) throw Error(m(30));
          return e == null ? t : Array.isArray(e) ? Array.isArray(t) ? (e.push.apply(e, t), e) : (e.push(t), e) : Array.isArray(t) ? [e].concat(t) : [e, t];
        }
        function Yn(e, t, n) {
          Array.isArray(e) ? e.forEach(t, n) : e && t.call(n, e);
        }
        var Kt = null;
        function Or(e) {
          if (e) {
            var t = e._dispatchListeners, n = e._dispatchInstances;
            if (Array.isArray(t)) for (var r = 0; r < t.length && !e.isPropagationStopped(); r++) N(e, t[r], n[r]);
            else t && N(e, t, n);
            e._dispatchListeners = null, e._dispatchInstances = null, e.isPersistent() || e.constructor.release(e);
          }
        }
        function At(e) {
          if (e !== null && (Kt = Ue(Kt, e)), e = Kt, Kt = null, e) {
            if (Yn(e, Or), Kt) throw Error(m(95));
            if (S) throw e = T, S = !1, T = null, e;
          }
        }
        function nn(e) {
          return (e = e.target || e.srcElement || window).correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
        }
        function Ht(e) {
          if (!te) return !1;
          var t = (e = "on" + e) in document;
          return t || ((t = document.createElement("div")).setAttribute(e, "return;"), t = typeof t[e] == "function"), t;
        }
        var Qt = [];
        function cr(e) {
          e.topLevelType = null, e.nativeEvent = null, e.targetInst = null, e.ancestors.length = 0, 10 > Qt.length && Qt.push(e);
        }
        function Dn(e, t, n, r) {
          if (Qt.length) {
            var i = Qt.pop();
            return i.topLevelType = e, i.eventSystemFlags = r, i.nativeEvent = t, i.targetInst = n, i;
          }
          return { topLevelType: e, eventSystemFlags: r, nativeEvent: t, targetInst: n, ancestors: [] };
        }
        function rn(e) {
          var t = e.targetInst, n = t;
          do {
            if (!n) {
              e.ancestors.push(n);
              break;
            }
            var r = n;
            if (r.tag === 3) r = r.stateNode.containerInfo;
            else {
              for (; r.return; ) r = r.return;
              r = r.tag !== 3 ? null : r.stateNode.containerInfo;
            }
            if (!r) break;
            (t = n.tag) !== 5 && t !== 6 || e.ancestors.push(n), n = Ir(r);
          } while (n);
          for (n = 0; n < e.ancestors.length; n++) {
            t = e.ancestors[n];
            var i = nn(e.nativeEvent);
            r = e.topLevelType;
            var d = e.nativeEvent, v = e.eventSystemFlags;
            n === 0 && (v |= 64);
            for (var x = null, X = 0; X < K.length; X++) {
              var q = K[X];
              q && (q = q.extractEvents(r, t, d, i, v)) && (x = Ue(x, q));
            }
            At(x);
          }
        }
        function yt(e, t, n) {
          if (!n.has(e)) {
            switch (e) {
              case "scroll":
                Jr(t, "scroll", !0);
                break;
              case "focus":
              case "blur":
                Jr(t, "focus", !0), Jr(t, "blur", !0), n.set("blur", null), n.set("focus", null);
                break;
              case "cancel":
              case "close":
                Ht(e) && Jr(t, e, !0);
                break;
              case "invalid":
              case "submit":
              case "reset":
                break;
              default:
                ct.indexOf(e) === -1 && mt(e, t);
            }
            n.set(e, null);
          }
        }
        var Et, ur, fr, vn = !1, Ut = [], Vt = null, on = null, qn = null, dr = /* @__PURE__ */ new Map(), Zr = /* @__PURE__ */ new Map(), Nr = [], Bn = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput close cancel copy cut paste click change contextmenu reset submit".split(" "), Pt = "focus blur dragenter dragleave mouseover mouseout pointerover pointerout gotpointercapture lostpointercapture".split(" ");
        function xo(e, t, n, r, i) {
          return { blockedOn: e, topLevelType: t, eventSystemFlags: 32 | n, nativeEvent: i, container: r };
        }
        function wn(e, t) {
          switch (e) {
            case "focus":
            case "blur":
              Vt = null;
              break;
            case "dragenter":
            case "dragleave":
              on = null;
              break;
            case "mouseover":
            case "mouseout":
              qn = null;
              break;
            case "pointerover":
            case "pointerout":
              dr.delete(t.pointerId);
              break;
            case "gotpointercapture":
            case "lostpointercapture":
              Zr.delete(t.pointerId);
          }
        }
        function Pr(e, t, n, r, i, d) {
          return e === null || e.nativeEvent !== d ? (e = xo(t, n, r, i, d), t !== null && (t = oo(t)) !== null && ur(t), e) : (e.eventSystemFlags |= r, e);
        }
        function Ca(e) {
          var t = Ir(e.target);
          if (t !== null) {
            var n = Pn(t);
            if (n !== null) {
              if ((t = n.tag) === 13) {
                if ((t = Eo(n)) !== null) return e.blockedOn = t, void O.unstable_runWithPriority(e.priority, function() {
                  fr(n);
                });
              } else if (t === 3 && n.stateNode.hydrate) return void (e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null);
            }
          }
          e.blockedOn = null;
        }
        function So(e) {
          if (e.blockedOn !== null) return !1;
          var t = Mr(e.topLevelType, e.eventSystemFlags, e.container, e.nativeEvent);
          if (t !== null) {
            var n = oo(t);
            return n !== null && ur(n), e.blockedOn = t, !1;
          }
          return !0;
        }
        function yi(e, t, n) {
          So(e) && n.delete(t);
        }
        function vi() {
          for (vn = !1; 0 < Ut.length; ) {
            var e = Ut[0];
            if (e.blockedOn !== null) {
              (e = oo(e.blockedOn)) !== null && Et(e);
              break;
            }
            var t = Mr(e.topLevelType, e.eventSystemFlags, e.container, e.nativeEvent);
            t !== null ? e.blockedOn = t : Ut.shift();
          }
          Vt !== null && So(Vt) && (Vt = null), on !== null && So(on) && (on = null), qn !== null && So(qn) && (qn = null), dr.forEach(yi), Zr.forEach(yi);
        }
        function Dr(e, t) {
          e.blockedOn === t && (e.blockedOn = null, vn || (vn = !0, O.unstable_scheduleCallback(O.unstable_NormalPriority, vi)));
        }
        function pr(e) {
          function t(i) {
            return Dr(i, e);
          }
          if (0 < Ut.length) {
            Dr(Ut[0], e);
            for (var n = 1; n < Ut.length; n++) {
              var r = Ut[n];
              r.blockedOn === e && (r.blockedOn = null);
            }
          }
          for (Vt !== null && Dr(Vt, e), on !== null && Dr(on, e), qn !== null && Dr(qn, e), dr.forEach(t), Zr.forEach(t), n = 0; n < Nr.length; n++) (r = Nr[n]).blockedOn === e && (r.blockedOn = null);
          for (; 0 < Nr.length && (n = Nr[0]).blockedOn === null; ) Ca(n), n.blockedOn === null && Nr.shift();
        }
        var wi = {}, ki = /* @__PURE__ */ new Map(), Rr = /* @__PURE__ */ new Map(), Ta = ["abort", "abort", tn, "animationEnd", ht, "animationIteration", Wt, "animationStart", "canplay", "canPlay", "canplaythrough", "canPlayThrough", "durationchange", "durationChange", "emptied", "emptied", "encrypted", "encrypted", "ended", "ended", "error", "error", "gotpointercapture", "gotPointerCapture", "load", "load", "loadeddata", "loadedData", "loadedmetadata", "loadedMetadata", "loadstart", "loadStart", "lostpointercapture", "lostPointerCapture", "playing", "playing", "progress", "progress", "seeking", "seeking", "stalled", "stalled", "suspend", "suspend", "timeupdate", "timeUpdate", Nn, "transitionEnd", "waiting", "waiting"];
        function Yo(e, t) {
          for (var n = 0; n < e.length; n += 2) {
            var r = e[n], i = e[n + 1], d = "on" + (i[0].toUpperCase() + i.slice(1));
            d = { phasedRegistrationNames: { bubbled: d, captured: d + "Capture" }, dependencies: [r], eventPriority: t }, Rr.set(r, t), ki.set(r, d), wi[i] = d;
          }
        }
        Yo("blur blur cancel cancel click click close close contextmenu contextMenu copy copy cut cut auxclick auxClick dblclick doubleClick dragend dragEnd dragstart dragStart drop drop focus focus input input invalid invalid keydown keyDown keypress keyPress keyup keyUp mousedown mouseDown mouseup mouseUp paste paste pause pause play play pointercancel pointerCancel pointerdown pointerDown pointerup pointerUp ratechange rateChange reset reset seeked seeked submit submit touchcancel touchCancel touchend touchEnd touchstart touchStart volumechange volumeChange".split(" "), 0), Yo("drag drag dragenter dragEnter dragexit dragExit dragleave dragLeave dragover dragOver mousemove mouseMove mouseout mouseOut mouseover mouseOver pointermove pointerMove pointerout pointerOut pointerover pointerOver scroll scroll toggle toggle touchmove touchMove wheel wheel".split(" "), 1), Yo(Ta, 2);
        for (var Ei = "change selectionchange textInput compositionstart compositionend compositionupdate".split(" "), qo = 0; qo < Ei.length; qo++) Rr.set(Ei[qo], 0);
        var Oa = O.unstable_UserBlockingPriority, Na = O.unstable_runWithPriority, Co = !0;
        function mt(e, t) {
          Jr(t, e, !1);
        }
        function Jr(e, t, n) {
          var r = Rr.get(t);
          switch (r === void 0 ? 2 : r) {
            case 0:
              r = eo.bind(null, t, 1, e);
              break;
            case 1:
              r = Pa.bind(null, t, 1, e);
              break;
            default:
              r = To.bind(null, t, 1, e);
          }
          n ? e.addEventListener(t, r, !0) : e.addEventListener(t, r, !1);
        }
        function eo(e, t, n, r) {
          xe || ke();
          var i = To, d = xe;
          xe = !0;
          try {
            Ce(i, e, t, n, r);
          } finally {
            (xe = d) || Je();
          }
        }
        function Pa(e, t, n, r) {
          Na(Oa, To.bind(null, e, t, n, r));
        }
        function To(e, t, n, r) {
          if (Co) if (0 < Ut.length && -1 < Bn.indexOf(e)) e = xo(null, e, t, n, r), Ut.push(e);
          else {
            var i = Mr(e, t, n, r);
            if (i === null) wn(e, r);
            else if (-1 < Bn.indexOf(e)) e = xo(i, e, t, n, r), Ut.push(e);
            else if (!function(d, v, x, X, q) {
              switch (v) {
                case "focus":
                  return Vt = Pr(Vt, d, v, x, X, q), !0;
                case "dragenter":
                  return on = Pr(on, d, v, x, X, q), !0;
                case "mouseover":
                  return qn = Pr(qn, d, v, x, X, q), !0;
                case "pointerover":
                  var ge = q.pointerId;
                  return dr.set(ge, Pr(dr.get(ge) || null, d, v, x, X, q)), !0;
                case "gotpointercapture":
                  return ge = q.pointerId, Zr.set(ge, Pr(Zr.get(ge) || null, d, v, x, X, q)), !0;
              }
              return !1;
            }(i, e, t, n, r)) {
              wn(e, r), e = Dn(e, r, null, t);
              try {
                G(rn, e);
              } finally {
                cr(e);
              }
            }
          }
        }
        function Mr(e, t, n, r) {
          if ((n = Ir(n = nn(r))) !== null) {
            var i = Pn(n);
            if (i === null) n = null;
            else {
              var d = i.tag;
              if (d === 13) {
                if ((n = Eo(i)) !== null) return n;
                n = null;
              } else if (d === 3) {
                if (i.stateNode.hydrate) return i.tag === 3 ? i.stateNode.containerInfo : null;
                n = null;
              } else i !== n && (n = null);
            }
          }
          e = Dn(e, r, n, t);
          try {
            G(rn, e);
          } finally {
            cr(e);
          }
          return null;
        }
        var to = { animationIterationCount: !0, borderImageOutset: !0, borderImageSlice: !0, borderImageWidth: !0, boxFlex: !0, boxFlexGroup: !0, boxOrdinalGroup: !0, columnCount: !0, columns: !0, flex: !0, flexGrow: !0, flexPositive: !0, flexShrink: !0, flexNegative: !0, flexOrder: !0, gridArea: !0, gridRow: !0, gridRowEnd: !0, gridRowSpan: !0, gridRowStart: !0, gridColumn: !0, gridColumnEnd: !0, gridColumnSpan: !0, gridColumnStart: !0, fontWeight: !0, lineClamp: !0, lineHeight: !0, opacity: !0, order: !0, orphans: !0, tabSize: !0, widows: !0, zIndex: !0, zoom: !0, fillOpacity: !0, floodOpacity: !0, stopOpacity: !0, strokeDasharray: !0, strokeDashoffset: !0, strokeMiterlimit: !0, strokeOpacity: !0, strokeWidth: !0 }, Da = ["Webkit", "ms", "Moz", "O"];
        function _i(e, t, n) {
          return t == null || typeof t == "boolean" || t === "" ? "" : n || typeof t != "number" || t === 0 || to.hasOwnProperty(e) && to[e] ? ("" + t).trim() : t + "px";
        }
        function xi(e, t) {
          for (var n in e = e.style, t) if (t.hasOwnProperty(n)) {
            var r = n.indexOf("--") === 0, i = _i(n, t[n], r);
            n === "float" && (n = "cssFloat"), r ? e.setProperty(n, i) : e[n] = i;
          }
        }
        Object.keys(to).forEach(function(e) {
          Da.forEach(function(t) {
            t = t + e.charAt(0).toUpperCase() + e.substring(1), to[t] = to[e];
          });
        });
        var Si = o({ menuitem: !0 }, { area: !0, base: !0, br: !0, col: !0, embed: !0, hr: !0, img: !0, input: !0, keygen: !0, link: !0, meta: !0, param: !0, source: !0, track: !0, wbr: !0 });
        function Ko(e, t) {
          if (t) {
            if (Si[e] && (t.children != null || t.dangerouslySetInnerHTML != null)) throw Error(m(137, e, ""));
            if (t.dangerouslySetInnerHTML != null) {
              if (t.children != null) throw Error(m(60));
              if (typeof t.dangerouslySetInnerHTML != "object" || !("__html" in t.dangerouslySetInnerHTML)) throw Error(m(61));
            }
            if (t.style != null && typeof t.style != "object") throw Error(m(62, ""));
          }
        }
        function Qo(e, t) {
          if (e.indexOf("-") === -1) return typeof t.is == "string";
          switch (e) {
            case "annotation-xml":
            case "color-profile":
            case "font-face":
            case "font-face-src":
            case "font-face-uri":
            case "font-face-format":
            case "font-face-name":
            case "missing-glyph":
              return !1;
            default:
              return !0;
          }
        }
        var Ci = H;
        function Wn(e, t) {
          var n = un(e = e.nodeType === 9 || e.nodeType === 11 ? e : e.ownerDocument);
          t = se[t];
          for (var r = 0; r < t.length; r++) yt(t[r], e, n);
        }
        function Oo() {
        }
        function Go(e) {
          if ((e = e || (typeof document < "u" ? document : void 0)) === void 0) return null;
          try {
            return e.activeElement || e.body;
          } catch {
            return e.body;
          }
        }
        function Ti(e) {
          for (; e && e.firstChild; ) e = e.firstChild;
          return e;
        }
        function Oi(e, t) {
          var n, r = Ti(e);
          for (e = 0; r; ) {
            if (r.nodeType === 3) {
              if (n = e + r.textContent.length, e <= t && n >= t) return { node: r, offset: t - e };
              e = n;
            }
            e: {
              for (; r; ) {
                if (r.nextSibling) {
                  r = r.nextSibling;
                  break e;
                }
                r = r.parentNode;
              }
              r = void 0;
            }
            r = Ti(r);
          }
        }
        function Ni() {
          for (var e = window, t = Go(); t instanceof e.HTMLIFrameElement; ) {
            try {
              var n = typeof t.contentWindow.location.href == "string";
            } catch {
              n = !1;
            }
            if (!n) break;
            t = Go((e = t.contentWindow).document);
          }
          return t;
        }
        function Xo(e) {
          var t = e && e.nodeName && e.nodeName.toLowerCase();
          return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
        }
        var Zo = null, Jo = null;
        function Pi(e, t) {
          switch (e) {
            case "button":
            case "input":
            case "select":
            case "textarea":
              return !!t.autoFocus;
          }
          return !1;
        }
        function ei(e, t) {
          return e === "textarea" || e === "option" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
        }
        var ti = typeof setTimeout == "function" ? setTimeout : void 0, Di = typeof clearTimeout == "function" ? clearTimeout : void 0;
        function Ar(e) {
          for (; e != null; e = e.nextSibling) {
            var t = e.nodeType;
            if (t === 1 || t === 3) break;
          }
          return e;
        }
        function Ri(e) {
          e = e.previousSibling;
          for (var t = 0; e; ) {
            if (e.nodeType === 8) {
              var n = e.data;
              if (n === "$" || n === "$!" || n === "$?") {
                if (t === 0) return e;
                t--;
              } else n === "/$" && t++;
            }
            e = e.previousSibling;
          }
          return null;
        }
        var No = Math.random().toString(36).slice(2), Kn = "__reactInternalInstance$" + No, no = "__reactEventHandlers$" + No, ro = "__reactContainere$" + No;
        function Ir(e) {
          var t = e[Kn];
          if (t) return t;
          for (var n = e.parentNode; n; ) {
            if (t = n[ro] || n[Kn]) {
              if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = Ri(e); e !== null; ) {
                if (n = e[Kn]) return n;
                e = Ri(e);
              }
              return t;
            }
            n = (e = n).parentNode;
          }
          return null;
        }
        function oo(e) {
          return !(e = e[Kn] || e[ro]) || e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3 ? null : e;
        }
        function Qn(e) {
          if (e.tag === 5 || e.tag === 6) return e.stateNode;
          throw Error(m(33));
        }
        function ni(e) {
          return e[no] || null;
        }
        function Rn(e) {
          do
            e = e.return;
          while (e && e.tag !== 5);
          return e || null;
        }
        function Mi(e, t) {
          var n = e.stateNode;
          if (!n) return null;
          var r = Q(n);
          if (!r) return null;
          n = r[t];
          e: switch (t) {
            case "onClick":
            case "onClickCapture":
            case "onDoubleClick":
            case "onDoubleClickCapture":
            case "onMouseDown":
            case "onMouseDownCapture":
            case "onMouseMove":
            case "onMouseMoveCapture":
            case "onMouseUp":
            case "onMouseUpCapture":
            case "onMouseEnter":
              (r = !r.disabled) || (r = !((e = e.type) === "button" || e === "input" || e === "select" || e === "textarea")), e = !r;
              break e;
            default:
              e = !1;
          }
          if (e) return null;
          if (n && typeof n != "function") throw Error(m(231, t, typeof n));
          return n;
        }
        function Ai(e, t, n) {
          (t = Mi(e, n.dispatchConfig.phasedRegistrationNames[t])) && (n._dispatchListeners = Ue(n._dispatchListeners, t), n._dispatchInstances = Ue(n._dispatchInstances, e));
        }
        function Ra(e) {
          if (e && e.dispatchConfig.phasedRegistrationNames) {
            for (var t = e._targetInst, n = []; t; ) n.push(t), t = Rn(t);
            for (t = n.length; 0 < t--; ) Ai(n[t], "captured", e);
            for (t = 0; t < n.length; t++) Ai(n[t], "bubbled", e);
          }
        }
        function Po(e, t, n) {
          e && n && n.dispatchConfig.registrationName && (t = Mi(e, n.dispatchConfig.registrationName)) && (n._dispatchListeners = Ue(n._dispatchListeners, t), n._dispatchInstances = Ue(n._dispatchInstances, e));
        }
        function Ma(e) {
          e && e.dispatchConfig.registrationName && Po(e._targetInst, null, e);
        }
        function jr(e) {
          Yn(e, Ra);
        }
        var hr = null, ri = null, Do = null;
        function Ii() {
          if (Do) return Do;
          var e, t, n = ri, r = n.length, i = "value" in hr ? hr.value : hr.textContent, d = i.length;
          for (e = 0; e < r && n[e] === i[e]; e++) ;
          var v = r - e;
          for (t = 1; t <= v && n[r - t] === i[d - t]; t++) ;
          return Do = i.slice(e, 1 < t ? 1 - t : void 0);
        }
        function Ro() {
          return !0;
        }
        function Mo() {
          return !1;
        }
        function an(e, t, n, r) {
          for (var i in this.dispatchConfig = e, this._targetInst = t, this.nativeEvent = n, e = this.constructor.Interface) e.hasOwnProperty(i) && ((t = e[i]) ? this[i] = t(n) : i === "target" ? this.target = r : this[i] = n[i]);
          return this.isDefaultPrevented = (n.defaultPrevented != null ? n.defaultPrevented : n.returnValue === !1) ? Ro : Mo, this.isPropagationStopped = Mo, this;
        }
        function ji(e, t, n, r) {
          if (this.eventPool.length) {
            var i = this.eventPool.pop();
            return this.call(i, e, t, n, r), i;
          }
          return new this(e, t, n, r);
        }
        function $e(e) {
          if (!(e instanceof this)) throw Error(m(279));
          e.destructor(), 10 > this.eventPool.length && this.eventPool.push(e);
        }
        function k(e) {
          e.eventPool = [], e.getPooled = ji, e.release = $e;
        }
        o(an.prototype, { preventDefault: function() {
          this.defaultPrevented = !0;
          var e = this.nativeEvent;
          e && (e.preventDefault ? e.preventDefault() : typeof e.returnValue != "unknown" && (e.returnValue = !1), this.isDefaultPrevented = Ro);
        }, stopPropagation: function() {
          var e = this.nativeEvent;
          e && (e.stopPropagation ? e.stopPropagation() : typeof e.cancelBubble != "unknown" && (e.cancelBubble = !0), this.isPropagationStopped = Ro);
        }, persist: function() {
          this.isPersistent = Ro;
        }, isPersistent: Mo, destructor: function() {
          var e, t = this.constructor.Interface;
          for (e in t) this[e] = null;
          this.nativeEvent = this._targetInst = this.dispatchConfig = null, this.isPropagationStopped = this.isDefaultPrevented = Mo, this._dispatchInstances = this._dispatchListeners = null;
        } }), an.Interface = { type: null, target: null, currentTarget: function() {
          return null;
        }, eventPhase: null, bubbles: null, cancelable: null, timeStamp: function(e) {
          return e.timeStamp || Date.now();
        }, defaultPrevented: null, isTrusted: null }, an.extend = function(e) {
          function t() {
          }
          function n() {
            return r.apply(this, arguments);
          }
          var r = this;
          t.prototype = r.prototype;
          var i = new t();
          return o(i, n.prototype), n.prototype = i, n.prototype.constructor = n, n.Interface = o({}, r.Interface, e), n.extend = r.extend, k(n), n;
        }, k(an);
        var a = an.extend({ data: null }), c = an.extend({ data: null }), p = [9, 13, 27, 32], _ = te && "CompositionEvent" in window, C = null;
        te && "documentMode" in document && (C = document.documentMode);
        var z = te && "TextEvent" in window && !C, ne = te && (!_ || C && 8 < C && 11 >= C), de = " ", pe = { beforeInput: { phasedRegistrationNames: { bubbled: "onBeforeInput", captured: "onBeforeInputCapture" }, dependencies: ["compositionend", "keypress", "textInput", "paste"] }, compositionEnd: { phasedRegistrationNames: { bubbled: "onCompositionEnd", captured: "onCompositionEndCapture" }, dependencies: "blur compositionend keydown keypress keyup mousedown".split(" ") }, compositionStart: { phasedRegistrationNames: { bubbled: "onCompositionStart", captured: "onCompositionStartCapture" }, dependencies: "blur compositionstart keydown keypress keyup mousedown".split(" ") }, compositionUpdate: { phasedRegistrationNames: { bubbled: "onCompositionUpdate", captured: "onCompositionUpdateCapture" }, dependencies: "blur compositionupdate keydown keypress keyup mousedown".split(" ") } }, Ee = !1;
        function Pe(e, t) {
          switch (e) {
            case "keyup":
              return p.indexOf(t.keyCode) !== -1;
            case "keydown":
              return t.keyCode !== 229;
            case "keypress":
            case "mousedown":
            case "blur":
              return !0;
            default:
              return !1;
          }
        }
        function We(e) {
          return typeof (e = e.detail) == "object" && "data" in e ? e.data : null;
        }
        var Me = !1, Ke = { eventTypes: pe, extractEvents: function(e, t, n, r) {
          var i;
          if (_) e: {
            switch (e) {
              case "compositionstart":
                var d = pe.compositionStart;
                break e;
              case "compositionend":
                d = pe.compositionEnd;
                break e;
              case "compositionupdate":
                d = pe.compositionUpdate;
                break e;
            }
            d = void 0;
          }
          else Me ? Pe(e, n) && (d = pe.compositionEnd) : e === "keydown" && n.keyCode === 229 && (d = pe.compositionStart);
          return d ? (ne && n.locale !== "ko" && (Me || d !== pe.compositionStart ? d === pe.compositionEnd && Me && (i = Ii()) : (ri = "value" in (hr = r) ? hr.value : hr.textContent, Me = !0)), d = a.getPooled(d, t, n, r), (i || (i = We(n)) !== null) && (d.data = i), jr(d), i = d) : i = null, (e = z ? function(v, x) {
            switch (v) {
              case "compositionend":
                return We(x);
              case "keypress":
                return x.which !== 32 ? null : (Ee = !0, de);
              case "textInput":
                return (v = x.data) === de && Ee ? null : v;
              default:
                return null;
            }
          }(e, n) : function(v, x) {
            if (Me) return v === "compositionend" || !_ && Pe(v, x) ? (v = Ii(), Do = ri = hr = null, Me = !1, v) : null;
            switch (v) {
              case "paste":
                return null;
              case "keypress":
                if (!(x.ctrlKey || x.altKey || x.metaKey) || x.ctrlKey && x.altKey) {
                  if (x.char && 1 < x.char.length) return x.char;
                  if (x.which) return String.fromCharCode(x.which);
                }
                return null;
              case "compositionend":
                return ne && x.locale !== "ko" ? null : x.data;
              default:
                return null;
            }
          }(e, n)) ? ((t = c.getPooled(pe.beforeInput, t, n, r)).data = e, jr(t)) : t = null, i === null ? t : t === null ? i : [i, t];
        } }, Ie = { color: !0, date: !0, datetime: !0, "datetime-local": !0, email: !0, month: !0, number: !0, password: !0, range: !0, search: !0, tel: !0, text: !0, time: !0, url: !0, week: !0 };
        function Fe(e) {
          var t = e && e.nodeName && e.nodeName.toLowerCase();
          return t === "input" ? !!Ie[e.type] : t === "textarea";
        }
        var et = { change: { phasedRegistrationNames: { bubbled: "onChange", captured: "onChangeCapture" }, dependencies: "blur change click focus input keydown keyup selectionchange".split(" ") } };
        function Ye(e, t, n) {
          return (e = an.getPooled(et.change, e, t, n)).type = "change", D(n), jr(e), e;
        }
        var Le = null, ft = null;
        function Dt(e) {
          At(e);
        }
        function It(e) {
          if (ut(Qn(e))) return e;
        }
        function jt(e, t) {
          if (e === "change") return t;
        }
        var _t = !1;
        function zt() {
          Le && (Le.detachEvent("onpropertychange", dt), ft = Le = null);
        }
        function dt(e) {
          if (e.propertyName === "value" && It(ft)) if (e = Ye(ft, e, nn(e)), xe) At(e);
          else {
            xe = !0;
            try {
              be(Dt, e);
            } finally {
              xe = !1, Je();
            }
          }
        }
        function Mn(e, t, n) {
          e === "focus" ? (zt(), ft = n, (Le = t).attachEvent("onpropertychange", dt)) : e === "blur" && zt();
        }
        function lt(e) {
          if (e === "selectionchange" || e === "keyup" || e === "keydown") return It(ft);
        }
        function An(e, t) {
          if (e === "click") return It(t);
        }
        function Hn(e, t) {
          if (e === "input" || e === "change") return It(t);
        }
        te && (_t = Ht("input") && (!document.documentMode || 9 < document.documentMode));
        var zr = { eventTypes: et, _isInputEventSupported: _t, extractEvents: function(e, t, n, r) {
          var i = t ? Qn(t) : window, d = i.nodeName && i.nodeName.toLowerCase();
          if (d === "select" || d === "input" && i.type === "file") var v = jt;
          else if (Fe(i)) if (_t) v = Hn;
          else {
            v = lt;
            var x = Mn;
          }
          else (d = i.nodeName) && d.toLowerCase() === "input" && (i.type === "checkbox" || i.type === "radio") && (v = An);
          if (v && (v = v(e, t))) return Ye(v, n, r);
          x && x(e, i, t), e === "blur" && (e = i._wrapperState) && e.controlled && i.type === "number" && Cn(i, "number", i.value);
        } }, xt = an.extend({ view: null, detail: null }), io = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
        function In(e) {
          var t = this.nativeEvent;
          return t.getModifierState ? t.getModifierState(e) : !!(e = io[e]) && !!t[e];
        }
        function $t() {
          return In;
        }
        var fn = 0, Gn = 0, Gt = !1, dn = !1, Lr = xt.extend({ screenX: null, screenY: null, clientX: null, clientY: null, pageX: null, pageY: null, ctrlKey: null, shiftKey: null, altKey: null, metaKey: null, getModifierState: $t, button: null, buttons: null, relatedTarget: function(e) {
          return e.relatedTarget || (e.fromElement === e.srcElement ? e.toElement : e.fromElement);
        }, movementX: function(e) {
          if ("movementX" in e) return e.movementX;
          var t = fn;
          return fn = e.screenX, Gt ? e.type === "mousemove" ? e.screenX - t : 0 : (Gt = !0, 0);
        }, movementY: function(e) {
          if ("movementY" in e) return e.movementY;
          var t = Gn;
          return Gn = e.screenY, dn ? e.type === "mousemove" ? e.screenY - t : 0 : (dn = !0, 0);
        } }), oi = Lr.extend({ pointerId: null, width: null, height: null, pressure: null, tangentialPressure: null, tiltX: null, tiltY: null, twist: null, pointerType: null, isPrimary: null }), Ur = { mouseEnter: { registrationName: "onMouseEnter", dependencies: ["mouseout", "mouseover"] }, mouseLeave: { registrationName: "onMouseLeave", dependencies: ["mouseout", "mouseover"] }, pointerEnter: { registrationName: "onPointerEnter", dependencies: ["pointerout", "pointerover"] }, pointerLeave: { registrationName: "onPointerLeave", dependencies: ["pointerout", "pointerover"] } }, Ao = { eventTypes: Ur, extractEvents: function(e, t, n, r, i) {
          var d = e === "mouseover" || e === "pointerover", v = e === "mouseout" || e === "pointerout";
          if (d && !(32 & i) && (n.relatedTarget || n.fromElement) || !v && !d || (d = r.window === r ? r : (d = r.ownerDocument) ? d.defaultView || d.parentWindow : window, v ? (v = t, (t = (t = n.relatedTarget || n.toElement) ? Ir(t) : null) !== null && (t !== Pn(t) || t.tag !== 5 && t.tag !== 6) && (t = null)) : v = null, v === t)) return null;
          if (e === "mouseout" || e === "mouseover") var x = Lr, X = Ur.mouseLeave, q = Ur.mouseEnter, ge = "mouse";
          else e !== "pointerout" && e !== "pointerover" || (x = oi, X = Ur.pointerLeave, q = Ur.pointerEnter, ge = "pointer");
          if (e = v == null ? d : Qn(v), d = t == null ? d : Qn(t), (X = x.getPooled(X, v, n, r)).type = ge + "leave", X.target = e, X.relatedTarget = d, (n = x.getPooled(q, t, n, r)).type = ge + "enter", n.target = d, n.relatedTarget = e, ge = t, (r = v) && ge) e: {
            for (q = ge, v = 0, e = x = r; e; e = Rn(e)) v++;
            for (e = 0, t = q; t; t = Rn(t)) e++;
            for (; 0 < v - e; ) x = Rn(x), v--;
            for (; 0 < e - v; ) q = Rn(q), e--;
            for (; v--; ) {
              if (x === q || x === q.alternate) break e;
              x = Rn(x), q = Rn(q);
            }
            x = null;
          }
          else x = null;
          for (q = x, x = []; r && r !== q && ((v = r.alternate) === null || v !== q); ) x.push(r), r = Rn(r);
          for (r = []; ge && ge !== q && ((v = ge.alternate) === null || v !== q); ) r.push(ge), ge = Rn(ge);
          for (ge = 0; ge < x.length; ge++) Po(x[ge], "bubbled", X);
          for (ge = r.length; 0 < ge--; ) Po(r[ge], "captured", n);
          return 64 & i ? [X, n] : [X];
        } }, mr = typeof Object.is == "function" ? Object.is : function(e, t) {
          return e === t && (e !== 0 || 1 / e == 1 / t) || e != e && t != t;
        }, zi = Object.prototype.hasOwnProperty;
        function gr(e, t) {
          if (mr(e, t)) return !0;
          if (typeof e != "object" || e === null || typeof t != "object" || t === null) return !1;
          var n = Object.keys(e), r = Object.keys(t);
          if (n.length !== r.length) return !1;
          for (r = 0; r < n.length; r++) if (!zi.call(t, n[r]) || !mr(e[n[r]], t[n[r]])) return !1;
          return !0;
        }
        var Io = te && "documentMode" in document && 11 >= document.documentMode, ii = { select: { phasedRegistrationNames: { bubbled: "onSelect", captured: "onSelectCapture" }, dependencies: "blur contextmenu dragend focus keydown keyup mousedown mouseup selectionchange".split(" ") } }, Xn = null, ao = null, kn = null, so = !1;
        function Os(e, t) {
          var n = t.window === t ? t.document : t.nodeType === 9 ? t : t.ownerDocument;
          return so || Xn == null || Xn !== Go(n) ? null : ("selectionStart" in (n = Xn) && Xo(n) ? n = { start: n.selectionStart, end: n.selectionEnd } : n = { anchorNode: (n = (n.ownerDocument && n.ownerDocument.defaultView || window).getSelection()).anchorNode, anchorOffset: n.anchorOffset, focusNode: n.focusNode, focusOffset: n.focusOffset }, kn && gr(kn, n) ? null : (kn = n, (e = an.getPooled(ii.select, ao, e, t)).type = "select", e.target = Xn, jr(e), e));
        }
        var rc = { eventTypes: ii, extractEvents: function(e, t, n, r, i, d) {
          if (!(d = !(i = d || (r.window === r ? r.document : r.nodeType === 9 ? r : r.ownerDocument)))) {
            e: {
              i = un(i), d = se.onSelect;
              for (var v = 0; v < d.length; v++) if (!i.has(d[v])) {
                i = !1;
                break e;
              }
              i = !0;
            }
            d = !i;
          }
          if (d) return null;
          switch (i = t ? Qn(t) : window, e) {
            case "focus":
              (Fe(i) || i.contentEditable === "true") && (Xn = i, ao = t, kn = null);
              break;
            case "blur":
              kn = ao = Xn = null;
              break;
            case "mousedown":
              so = !0;
              break;
            case "contextmenu":
            case "mouseup":
            case "dragend":
              return so = !1, Os(n, r);
            case "selectionchange":
              if (Io) break;
            case "keydown":
            case "keyup":
              return Os(n, r);
          }
          return null;
        } }, oc = an.extend({ animationName: null, elapsedTime: null, pseudoElement: null }), ic = an.extend({ clipboardData: function(e) {
          return "clipboardData" in e ? e.clipboardData : window.clipboardData;
        } }), ac = xt.extend({ relatedTarget: null });
        function Li(e) {
          var t = e.keyCode;
          return "charCode" in e ? (e = e.charCode) === 0 && t === 13 && (e = 13) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
        }
        var sc = { Esc: "Escape", Spacebar: " ", Left: "ArrowLeft", Up: "ArrowUp", Right: "ArrowRight", Down: "ArrowDown", Del: "Delete", Win: "OS", Menu: "ContextMenu", Apps: "ContextMenu", Scroll: "ScrollLock", MozPrintableKey: "Unidentified" }, lc = { 8: "Backspace", 9: "Tab", 12: "Clear", 13: "Enter", 16: "Shift", 17: "Control", 18: "Alt", 19: "Pause", 20: "CapsLock", 27: "Escape", 32: " ", 33: "PageUp", 34: "PageDown", 35: "End", 36: "Home", 37: "ArrowLeft", 38: "ArrowUp", 39: "ArrowRight", 40: "ArrowDown", 45: "Insert", 46: "Delete", 112: "F1", 113: "F2", 114: "F3", 115: "F4", 116: "F5", 117: "F6", 118: "F7", 119: "F8", 120: "F9", 121: "F10", 122: "F11", 123: "F12", 144: "NumLock", 145: "ScrollLock", 224: "Meta" }, cc = xt.extend({ key: function(e) {
          if (e.key) {
            var t = sc[e.key] || e.key;
            if (t !== "Unidentified") return t;
          }
          return e.type === "keypress" ? (e = Li(e)) === 13 ? "Enter" : String.fromCharCode(e) : e.type === "keydown" || e.type === "keyup" ? lc[e.keyCode] || "Unidentified" : "";
        }, location: null, ctrlKey: null, shiftKey: null, altKey: null, metaKey: null, repeat: null, locale: null, getModifierState: $t, charCode: function(e) {
          return e.type === "keypress" ? Li(e) : 0;
        }, keyCode: function(e) {
          return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
        }, which: function(e) {
          return e.type === "keypress" ? Li(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
        } }), uc = Lr.extend({ dataTransfer: null }), fc = xt.extend({ touches: null, targetTouches: null, changedTouches: null, altKey: null, metaKey: null, ctrlKey: null, shiftKey: null, getModifierState: $t }), dc = an.extend({ propertyName: null, elapsedTime: null, pseudoElement: null }), pc = Lr.extend({ deltaX: function(e) {
          return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
        }, deltaY: function(e) {
          return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
        }, deltaZ: null, deltaMode: null }), hc = { eventTypes: wi, extractEvents: function(e, t, n, r) {
          var i = ki.get(e);
          if (!i) return null;
          switch (e) {
            case "keypress":
              if (Li(n) === 0) return null;
            case "keydown":
            case "keyup":
              e = cc;
              break;
            case "blur":
            case "focus":
              e = ac;
              break;
            case "click":
              if (n.button === 2) return null;
            case "auxclick":
            case "dblclick":
            case "mousedown":
            case "mousemove":
            case "mouseup":
            case "mouseout":
            case "mouseover":
            case "contextmenu":
              e = Lr;
              break;
            case "drag":
            case "dragend":
            case "dragenter":
            case "dragexit":
            case "dragleave":
            case "dragover":
            case "dragstart":
            case "drop":
              e = uc;
              break;
            case "touchcancel":
            case "touchend":
            case "touchmove":
            case "touchstart":
              e = fc;
              break;
            case tn:
            case ht:
            case Wt:
              e = oc;
              break;
            case Nn:
              e = dc;
              break;
            case "scroll":
              e = xt;
              break;
            case "wheel":
              e = pc;
              break;
            case "copy":
            case "cut":
            case "paste":
              e = ic;
              break;
            case "gotpointercapture":
            case "lostpointercapture":
            case "pointercancel":
            case "pointerdown":
            case "pointermove":
            case "pointerout":
            case "pointerover":
            case "pointerup":
              e = oi;
              break;
            default:
              e = an;
          }
          return jr(t = e.getPooled(i, t, n, r)), t;
        } };
        if (A) throw Error(m(101));
        A = Array.prototype.slice.call("ResponderEventPlugin SimpleEventPlugin EnterLeaveEventPlugin ChangeEventPlugin SelectEventPlugin BeforeInputEventPlugin".split(" ")), R(), Q = ni, j = oo, W = Qn, le({ SimpleEventPlugin: hc, EnterLeaveEventPlugin: Ao, ChangeEventPlugin: zr, SelectEventPlugin: rc, BeforeInputEventPlugin: Ke });
        var Aa = [], jo = -1;
        function vt(e) {
          0 > jo || (e.current = Aa[jo], Aa[jo] = null, jo--);
        }
        function St(e, t) {
          jo++, Aa[jo] = e.current, e.current = t;
        }
        var Fr = {}, Xt = { current: Fr }, pn = { current: !1 }, lo = Fr;
        function zo(e, t) {
          var n = e.type.contextTypes;
          if (!n) return Fr;
          var r = e.stateNode;
          if (r && r.__reactInternalMemoizedUnmaskedChildContext === t) return r.__reactInternalMemoizedMaskedChildContext;
          var i, d = {};
          for (i in n) d[i] = t[i];
          return r && ((e = e.stateNode).__reactInternalMemoizedUnmaskedChildContext = t, e.__reactInternalMemoizedMaskedChildContext = d), d;
        }
        function hn(e) {
          return (e = e.childContextTypes) != null;
        }
        function Ui() {
          vt(pn), vt(Xt);
        }
        function Ns(e, t, n) {
          if (Xt.current !== Fr) throw Error(m(168));
          St(Xt, t), St(pn, n);
        }
        function Ps(e, t, n) {
          var r = e.stateNode;
          if (e = t.childContextTypes, typeof r.getChildContext != "function") return n;
          for (var i in r = r.getChildContext()) if (!(i in e)) throw Error(m(108, Yt(t) || "Unknown", i));
          return o({}, n, {}, r);
        }
        function Fi(e) {
          return e = (e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext || Fr, lo = Xt.current, St(Xt, e), St(pn, pn.current), !0;
        }
        function Ds(e, t, n) {
          var r = e.stateNode;
          if (!r) throw Error(m(169));
          n ? (e = Ps(e, t, lo), r.__reactInternalMemoizedMergedChildContext = e, vt(pn), vt(Xt), St(Xt, e)) : vt(pn), St(pn, n);
        }
        var mc = O.unstable_runWithPriority, Ia = O.unstable_scheduleCallback, Rs = O.unstable_cancelCallback, Ms = O.unstable_requestPaint, ja = O.unstable_now, gc = O.unstable_getCurrentPriorityLevel, Bi = O.unstable_ImmediatePriority, As = O.unstable_UserBlockingPriority, Is = O.unstable_NormalPriority, js = O.unstable_LowPriority, zs = O.unstable_IdlePriority, Ls = {}, bc = O.unstable_shouldYield, yc = Ms !== void 0 ? Ms : function() {
        }, br = null, Wi = null, za = !1, Us = ja(), jn = 1e4 > Us ? ja : function() {
          return ja() - Us;
        };
        function Hi() {
          switch (gc()) {
            case Bi:
              return 99;
            case As:
              return 98;
            case Is:
              return 97;
            case js:
              return 96;
            case zs:
              return 95;
            default:
              throw Error(m(332));
          }
        }
        function Fs(e) {
          switch (e) {
            case 99:
              return Bi;
            case 98:
              return As;
            case 97:
              return Is;
            case 96:
              return js;
            case 95:
              return zs;
            default:
              throw Error(m(332));
          }
        }
        function Br(e, t) {
          return e = Fs(e), mc(e, t);
        }
        function Bs(e, t, n) {
          return e = Fs(e), Ia(e, t, n);
        }
        function Ws(e) {
          return br === null ? (br = [e], Wi = Ia(Bi, Hs)) : br.push(e), Ls;
        }
        function Zn() {
          if (Wi !== null) {
            var e = Wi;
            Wi = null, Rs(e);
          }
          Hs();
        }
        function Hs() {
          if (!za && br !== null) {
            za = !0;
            var e = 0;
            try {
              var t = br;
              Br(99, function() {
                for (; e < t.length; e++) {
                  var n = t[e];
                  do
                    n = n(!0);
                  while (n !== null);
                }
              }), br = null;
            } catch (n) {
              throw br !== null && (br = br.slice(e + 1)), Ia(Bi, Zn), n;
            } finally {
              za = !1;
            }
          }
        }
        function Vi(e, t, n) {
          return 1073741821 - (1 + ((1073741821 - e + t / 10) / (n /= 10) | 0)) * n;
        }
        function Vn(e, t) {
          if (e && e.defaultProps) for (var n in t = o({}, t), e = e.defaultProps) t[n] === void 0 && (t[n] = e[n]);
          return t;
        }
        var $i = { current: null }, Yi = null, Lo = null, qi = null;
        function La() {
          qi = Lo = Yi = null;
        }
        function Ua(e) {
          var t = $i.current;
          vt($i), e.type._context._currentValue = t;
        }
        function Vs(e, t) {
          for (; e !== null; ) {
            var n = e.alternate;
            if (e.childExpirationTime < t) e.childExpirationTime = t, n !== null && n.childExpirationTime < t && (n.childExpirationTime = t);
            else {
              if (!(n !== null && n.childExpirationTime < t)) break;
              n.childExpirationTime = t;
            }
            e = e.return;
          }
        }
        function Uo(e, t) {
          Yi = e, qi = Lo = null, (e = e.dependencies) !== null && e.firstContext !== null && (e.expirationTime >= t && (er = !0), e.firstContext = null);
        }
        function zn(e, t) {
          if (qi !== e && t !== !1 && t !== 0) if (typeof t == "number" && t !== 1073741823 || (qi = e, t = 1073741823), t = { context: e, observedBits: t, next: null }, Lo === null) {
            if (Yi === null) throw Error(m(308));
            Lo = t, Yi.dependencies = { expirationTime: 0, firstContext: t, responders: null };
          } else Lo = Lo.next = t;
          return e._currentValue;
        }
        var Wr = !1;
        function Fa(e) {
          e.updateQueue = { baseState: e.memoizedState, baseQueue: null, shared: { pending: null }, effects: null };
        }
        function Ba(e, t) {
          e = e.updateQueue, t.updateQueue === e && (t.updateQueue = { baseState: e.baseState, baseQueue: e.baseQueue, shared: e.shared, effects: e.effects });
        }
        function Hr(e, t) {
          return (e = { expirationTime: e, suspenseConfig: t, tag: 0, payload: null, callback: null, next: null }).next = e;
        }
        function Vr(e, t) {
          if ((e = e.updateQueue) !== null) {
            var n = (e = e.shared).pending;
            n === null ? t.next = t : (t.next = n.next, n.next = t), e.pending = t;
          }
        }
        function $s(e, t) {
          var n = e.alternate;
          n !== null && Ba(n, e), (n = (e = e.updateQueue).baseQueue) === null ? (e.baseQueue = t.next = t, t.next = t) : (t.next = n.next, n.next = t);
        }
        function ai(e, t, n, r) {
          var i = e.updateQueue;
          Wr = !1;
          var d = i.baseQueue, v = i.shared.pending;
          if (v !== null) {
            if (d !== null) {
              var x = d.next;
              d.next = v.next, v.next = x;
            }
            d = v, i.shared.pending = null, (x = e.alternate) !== null && (x = x.updateQueue) !== null && (x.baseQueue = v);
          }
          if (d !== null) {
            x = d.next;
            var X = i.baseState, q = 0, ge = null, De = null, He = null;
            if (x !== null) for (var ot = x; ; ) {
              if ((v = ot.expirationTime) < r) {
                var Fn = { expirationTime: ot.expirationTime, suspenseConfig: ot.suspenseConfig, tag: ot.tag, payload: ot.payload, callback: ot.callback, next: null };
                He === null ? (De = He = Fn, ge = X) : He = He.next = Fn, v > q && (q = v);
              } else {
                He !== null && (He = He.next = { expirationTime: 1073741823, suspenseConfig: ot.suspenseConfig, tag: ot.tag, payload: ot.payload, callback: ot.callback, next: null }), Fl(v, ot.suspenseConfig);
                e: {
                  var ln = e, re = ot;
                  switch (v = t, Fn = n, re.tag) {
                    case 1:
                      if (typeof (ln = re.payload) == "function") {
                        X = ln.call(Fn, X, v);
                        break e;
                      }
                      X = ln;
                      break e;
                    case 3:
                      ln.effectTag = -4097 & ln.effectTag | 64;
                    case 0:
                      if ((v = typeof (ln = re.payload) == "function" ? ln.call(Fn, X, v) : ln) == null) break e;
                      X = o({}, X, v);
                      break e;
                    case 2:
                      Wr = !0;
                  }
                }
                ot.callback !== null && (e.effectTag |= 32, (v = i.effects) === null ? i.effects = [ot] : v.push(ot));
              }
              if ((ot = ot.next) === null || ot === x) {
                if ((v = i.shared.pending) === null) break;
                ot = d.next = v.next, v.next = x, i.baseQueue = d = v, i.shared.pending = null;
              }
            }
            He === null ? ge = X : He.next = De, i.baseState = ge, i.baseQueue = He, va(q), e.expirationTime = q, e.memoizedState = X;
          }
        }
        function Ys(e, t, n) {
          if (e = t.effects, t.effects = null, e !== null) for (t = 0; t < e.length; t++) {
            var r = e[t], i = r.callback;
            if (i !== null) {
              if (r.callback = null, r = i, i = n, typeof r != "function") throw Error(m(191, r));
              r.call(i);
            }
          }
        }
        var si = he.ReactCurrentBatchConfig, qs = new u.Component().refs;
        function Ki(e, t, n, r) {
          n = (n = n(r, t = e.memoizedState)) == null ? t : o({}, t, n), e.memoizedState = n, e.expirationTime === 0 && (e.updateQueue.baseState = n);
        }
        var Qi = { isMounted: function(e) {
          return !!(e = e._reactInternalFiber) && Pn(e) === e;
        }, enqueueSetState: function(e, t, n) {
          e = e._reactInternalFiber;
          var r = tr(), i = si.suspense;
          (i = Hr(r = mo(r, e, i), i)).payload = t, n != null && (i.callback = n), Vr(e, i), Kr(e, r);
        }, enqueueReplaceState: function(e, t, n) {
          e = e._reactInternalFiber;
          var r = tr(), i = si.suspense;
          (i = Hr(r = mo(r, e, i), i)).tag = 1, i.payload = t, n != null && (i.callback = n), Vr(e, i), Kr(e, r);
        }, enqueueForceUpdate: function(e, t) {
          e = e._reactInternalFiber;
          var n = tr(), r = si.suspense;
          (r = Hr(n = mo(n, e, r), r)).tag = 2, t != null && (r.callback = t), Vr(e, r), Kr(e, n);
        } };
        function Ks(e, t, n, r, i, d, v) {
          return typeof (e = e.stateNode).shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, d, v) : !t.prototype || !t.prototype.isPureReactComponent || !gr(n, r) || !gr(i, d);
        }
        function Qs(e, t, n) {
          var r = !1, i = Fr, d = t.contextType;
          return typeof d == "object" && d !== null ? d = zn(d) : (i = hn(t) ? lo : Xt.current, d = (r = (r = t.contextTypes) != null) ? zo(e, i) : Fr), t = new t(n, d), e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null, t.updater = Qi, e.stateNode = t, t._reactInternalFiber = e, r && ((e = e.stateNode).__reactInternalMemoizedUnmaskedChildContext = i, e.__reactInternalMemoizedMaskedChildContext = d), t;
        }
        function Gs(e, t, n, r) {
          e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, r), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, r), t.state !== e && Qi.enqueueReplaceState(t, t.state, null);
        }
        function Wa(e, t, n, r) {
          var i = e.stateNode;
          i.props = n, i.state = e.memoizedState, i.refs = qs, Fa(e);
          var d = t.contextType;
          typeof d == "object" && d !== null ? i.context = zn(d) : (d = hn(t) ? lo : Xt.current, i.context = zo(e, d)), ai(e, n, i, r), i.state = e.memoizedState, typeof (d = t.getDerivedStateFromProps) == "function" && (Ki(e, t, d, n), i.state = e.memoizedState), typeof t.getDerivedStateFromProps == "function" || typeof i.getSnapshotBeforeUpdate == "function" || typeof i.UNSAFE_componentWillMount != "function" && typeof i.componentWillMount != "function" || (t = i.state, typeof i.componentWillMount == "function" && i.componentWillMount(), typeof i.UNSAFE_componentWillMount == "function" && i.UNSAFE_componentWillMount(), t !== i.state && Qi.enqueueReplaceState(i, i.state, null), ai(e, n, i, r), i.state = e.memoizedState), typeof i.componentDidMount == "function" && (e.effectTag |= 4);
        }
        var Gi = Array.isArray;
        function li(e, t, n) {
          if ((e = n.ref) !== null && typeof e != "function" && typeof e != "object") {
            if (n._owner) {
              if (n = n._owner) {
                if (n.tag !== 1) throw Error(m(309));
                var r = n.stateNode;
              }
              if (!r) throw Error(m(147, e));
              var i = "" + e;
              return t !== null && t.ref !== null && typeof t.ref == "function" && t.ref._stringRef === i ? t.ref : ((t = function(d) {
                var v = r.refs;
                v === qs && (v = r.refs = {}), d === null ? delete v[i] : v[i] = d;
              })._stringRef = i, t);
            }
            if (typeof e != "string") throw Error(m(284));
            if (!n._owner) throw Error(m(290, e));
          }
          return e;
        }
        function Xi(e, t) {
          if (e.type !== "textarea") throw Error(m(31, Object.prototype.toString.call(t) === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : t, ""));
        }
        function Xs(e) {
          function t(re, ee) {
            if (e) {
              var ue = re.lastEffect;
              ue !== null ? (ue.nextEffect = ee, re.lastEffect = ee) : re.firstEffect = re.lastEffect = ee, ee.nextEffect = null, ee.effectTag = 8;
            }
          }
          function n(re, ee) {
            if (!e) return null;
            for (; ee !== null; ) t(re, ee), ee = ee.sibling;
            return null;
          }
          function r(re, ee) {
            for (re = /* @__PURE__ */ new Map(); ee !== null; ) ee.key !== null ? re.set(ee.key, ee) : re.set(ee.index, ee), ee = ee.sibling;
            return re;
          }
          function i(re, ee) {
            return (re = vo(re, ee)).index = 0, re.sibling = null, re;
          }
          function d(re, ee, ue) {
            return re.index = ue, e ? (ue = re.alternate) !== null ? (ue = ue.index) < ee ? (re.effectTag = 2, ee) : ue : (re.effectTag = 2, ee) : ee;
          }
          function v(re) {
            return e && re.alternate === null && (re.effectTag = 2), re;
          }
          function x(re, ee, ue, ve) {
            return ee === null || ee.tag !== 6 ? ((ee = ys(ue, re.mode, ve)).return = re, ee) : ((ee = i(ee, ue)).return = re, ee);
          }
          function X(re, ee, ue, ve) {
            return ee !== null && ee.elementType === ue.type ? ((ve = i(ee, ue.props)).ref = li(re, ee, ue), ve.return = re, ve) : ((ve = wa(ue.type, ue.key, ue.props, null, re.mode, ve)).ref = li(re, ee, ue), ve.return = re, ve);
          }
          function q(re, ee, ue, ve) {
            return ee === null || ee.tag !== 4 || ee.stateNode.containerInfo !== ue.containerInfo || ee.stateNode.implementation !== ue.implementation ? ((ee = vs(ue, re.mode, ve)).return = re, ee) : ((ee = i(ee, ue.children || [])).return = re, ee);
          }
          function ge(re, ee, ue, ve, _e) {
            return ee === null || ee.tag !== 7 ? ((ee = Qr(ue, re.mode, ve, _e)).return = re, ee) : ((ee = i(ee, ue)).return = re, ee);
          }
          function De(re, ee, ue) {
            if (typeof ee == "string" || typeof ee == "number") return (ee = ys("" + ee, re.mode, ue)).return = re, ee;
            if (typeof ee == "object" && ee !== null) {
              switch (ee.$$typeof) {
                case Ve:
                  return (ue = wa(ee.type, ee.key, ee.props, null, re.mode, ue)).ref = li(re, null, ee), ue.return = re, ue;
                case Mt:
                  return (ee = vs(ee, re.mode, ue)).return = re, ee;
              }
              if (Gi(ee) || en(ee)) return (ee = Qr(ee, re.mode, ue, null)).return = re, ee;
              Xi(re, ee);
            }
            return null;
          }
          function He(re, ee, ue, ve) {
            var _e = ee !== null ? ee.key : null;
            if (typeof ue == "string" || typeof ue == "number") return _e !== null ? null : x(re, ee, "" + ue, ve);
            if (typeof ue == "object" && ue !== null) {
              switch (ue.$$typeof) {
                case Ve:
                  return ue.key === _e ? ue.type === wt ? ge(re, ee, ue.props.children, ve, _e) : X(re, ee, ue, ve) : null;
                case Mt:
                  return ue.key === _e ? q(re, ee, ue, ve) : null;
              }
              if (Gi(ue) || en(ue)) return _e !== null ? null : ge(re, ee, ue, ve, null);
              Xi(re, ue);
            }
            return null;
          }
          function ot(re, ee, ue, ve, _e) {
            if (typeof ve == "string" || typeof ve == "number") return x(ee, re = re.get(ue) || null, "" + ve, _e);
            if (typeof ve == "object" && ve !== null) {
              switch (ve.$$typeof) {
                case Ve:
                  return re = re.get(ve.key === null ? ue : ve.key) || null, ve.type === wt ? ge(ee, re, ve.props.children, _e, ve.key) : X(ee, re, ve, _e);
                case Mt:
                  return q(ee, re = re.get(ve.key === null ? ue : ve.key) || null, ve, _e);
              }
              if (Gi(ve) || en(ve)) return ge(ee, re = re.get(ue) || null, ve, _e, null);
              Xi(ee, ve);
            }
            return null;
          }
          function Fn(re, ee, ue, ve) {
            for (var _e = null, Te = null, Be = ee, at = ee = 0, Rt = null; Be !== null && at < ue.length; at++) {
              Be.index > at ? (Rt = Be, Be = null) : Rt = Be.sibling;
              var Ze = He(re, Be, ue[at], ve);
              if (Ze === null) {
                Be === null && (Be = Rt);
                break;
              }
              e && Be && Ze.alternate === null && t(re, Be), ee = d(Ze, ee, at), Te === null ? _e = Ze : Te.sibling = Ze, Te = Ze, Be = Rt;
            }
            if (at === ue.length) return n(re, Be), _e;
            if (Be === null) {
              for (; at < ue.length; at++) (Be = De(re, ue[at], ve)) !== null && (ee = d(Be, ee, at), Te === null ? _e = Be : Te.sibling = Be, Te = Be);
              return _e;
            }
            for (Be = r(re, Be); at < ue.length; at++) (Rt = ot(Be, re, at, ue[at], ve)) !== null && (e && Rt.alternate !== null && Be.delete(Rt.key === null ? at : Rt.key), ee = d(Rt, ee, at), Te === null ? _e = Rt : Te.sibling = Rt, Te = Rt);
            return e && Be.forEach(function(Bt) {
              return t(re, Bt);
            }), _e;
          }
          function ln(re, ee, ue, ve) {
            var _e = en(ue);
            if (typeof _e != "function") throw Error(m(150));
            if ((ue = _e.call(ue)) == null) throw Error(m(151));
            for (var Te = _e = null, Be = ee, at = ee = 0, Rt = null, Ze = ue.next(); Be !== null && !Ze.done; at++, Ze = ue.next()) {
              Be.index > at ? (Rt = Be, Be = null) : Rt = Be.sibling;
              var Bt = He(re, Be, Ze.value, ve);
              if (Bt === null) {
                Be === null && (Be = Rt);
                break;
              }
              e && Be && Bt.alternate === null && t(re, Be), ee = d(Bt, ee, at), Te === null ? _e = Bt : Te.sibling = Bt, Te = Bt, Be = Rt;
            }
            if (Ze.done) return n(re, Be), _e;
            if (Be === null) {
              for (; !Ze.done; at++, Ze = ue.next()) (Ze = De(re, Ze.value, ve)) !== null && (ee = d(Ze, ee, at), Te === null ? _e = Ze : Te.sibling = Ze, Te = Ze);
              return _e;
            }
            for (Be = r(re, Be); !Ze.done; at++, Ze = ue.next()) (Ze = ot(Be, re, at, Ze.value, ve)) !== null && (e && Ze.alternate !== null && Be.delete(Ze.key === null ? at : Ze.key), ee = d(Ze, ee, at), Te === null ? _e = Ze : Te.sibling = Ze, Te = Ze);
            return e && Be.forEach(function(kr) {
              return t(re, kr);
            }), _e;
          }
          return function(re, ee, ue, ve) {
            var _e = typeof ue == "object" && ue !== null && ue.type === wt && ue.key === null;
            _e && (ue = ue.props.children);
            var Te = typeof ue == "object" && ue !== null;
            if (Te) switch (ue.$$typeof) {
              case Ve:
                e: {
                  for (Te = ue.key, _e = ee; _e !== null; ) {
                    if (_e.key === Te) {
                      switch (_e.tag) {
                        case 7:
                          if (ue.type === wt) {
                            n(re, _e.sibling), (ee = i(_e, ue.props.children)).return = re, re = ee;
                            break e;
                          }
                          break;
                        default:
                          if (_e.elementType === ue.type) {
                            n(re, _e.sibling), (ee = i(_e, ue.props)).ref = li(re, _e, ue), ee.return = re, re = ee;
                            break e;
                          }
                      }
                      n(re, _e);
                      break;
                    }
                    t(re, _e), _e = _e.sibling;
                  }
                  ue.type === wt ? ((ee = Qr(ue.props.children, re.mode, ve, ue.key)).return = re, re = ee) : ((ve = wa(ue.type, ue.key, ue.props, null, re.mode, ve)).ref = li(re, ee, ue), ve.return = re, re = ve);
                }
                return v(re);
              case Mt:
                e: {
                  for (_e = ue.key; ee !== null; ) {
                    if (ee.key === _e) {
                      if (ee.tag === 4 && ee.stateNode.containerInfo === ue.containerInfo && ee.stateNode.implementation === ue.implementation) {
                        n(re, ee.sibling), (ee = i(ee, ue.children || [])).return = re, re = ee;
                        break e;
                      }
                      n(re, ee);
                      break;
                    }
                    t(re, ee), ee = ee.sibling;
                  }
                  (ee = vs(ue, re.mode, ve)).return = re, re = ee;
                }
                return v(re);
            }
            if (typeof ue == "string" || typeof ue == "number") return ue = "" + ue, ee !== null && ee.tag === 6 ? (n(re, ee.sibling), (ee = i(ee, ue)).return = re, re = ee) : (n(re, ee), (ee = ys(ue, re.mode, ve)).return = re, re = ee), v(re);
            if (Gi(ue)) return Fn(re, ee, ue, ve);
            if (en(ue)) return ln(re, ee, ue, ve);
            if (Te && Xi(re, ue), ue === void 0 && !_e) switch (re.tag) {
              case 1:
              case 0:
                throw re = re.type, Error(m(152, re.displayName || re.name || "Component"));
            }
            return n(re, ee);
          };
        }
        var Fo = Xs(!0), Ha = Xs(!1), ci = {}, Jn = { current: ci }, ui = { current: ci }, fi = { current: ci };
        function co(e) {
          if (e === ci) throw Error(m(174));
          return e;
        }
        function Va(e, t) {
          switch (St(fi, t), St(ui, e), St(Jn, ci), e = t.nodeType) {
            case 9:
            case 11:
              t = (t = t.documentElement) ? t.namespaceURI : Se(null, "");
              break;
            default:
              t = Se(t = (e = e === 8 ? t.parentNode : t).namespaceURI || null, e = e.tagName);
          }
          vt(Jn), St(Jn, t);
        }
        function Bo() {
          vt(Jn), vt(ui), vt(fi);
        }
        function Zs(e) {
          co(fi.current);
          var t = co(Jn.current), n = Se(t, e.type);
          t !== n && (St(ui, e), St(Jn, n));
        }
        function $a(e) {
          ui.current === e && (vt(Jn), vt(ui));
        }
        var Ct = { current: 0 };
        function Zi(e) {
          for (var t = e; t !== null; ) {
            if (t.tag === 13) {
              var n = t.memoizedState;
              if (n !== null && ((n = n.dehydrated) === null || n.data === "$?" || n.data === "$!")) return t;
            } else if (t.tag === 19 && t.memoizedProps.revealOrder !== void 0) {
              if (64 & t.effectTag) return t;
            } else if (t.child !== null) {
              t.child.return = t, t = t.child;
              continue;
            }
            if (t === e) break;
            for (; t.sibling === null; ) {
              if (t.return === null || t.return === e) return null;
              t = t.return;
            }
            t.sibling.return = t.return, t = t.sibling;
          }
          return null;
        }
        function Ya(e, t) {
          return { responder: e, props: t };
        }
        var Ji = he.ReactCurrentDispatcher, Ln = he.ReactCurrentBatchConfig, $r = 0, Lt = null, sn = null, Zt = null, ea = !1;
        function En() {
          throw Error(m(321));
        }
        function qa(e, t) {
          if (t === null) return !1;
          for (var n = 0; n < t.length && n < e.length; n++) if (!mr(e[n], t[n])) return !1;
          return !0;
        }
        function Ka(e, t, n, r, i, d) {
          if ($r = d, Lt = t, t.memoizedState = null, t.updateQueue = null, t.expirationTime = 0, Ji.current = e === null || e.memoizedState === null ? vc : wc, e = n(r, i), t.expirationTime === $r) {
            d = 0;
            do {
              if (t.expirationTime = 0, !(25 > d)) throw Error(m(301));
              d += 1, Zt = sn = null, t.updateQueue = null, Ji.current = kc, e = n(r, i);
            } while (t.expirationTime === $r);
          }
          if (Ji.current = ia, t = sn !== null && sn.next !== null, $r = 0, Zt = sn = Lt = null, ea = !1, t) throw Error(m(300));
          return e;
        }
        function Wo() {
          var e = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
          return Zt === null ? Lt.memoizedState = Zt = e : Zt = Zt.next = e, Zt;
        }
        function Ho() {
          if (sn === null) {
            var e = Lt.alternate;
            e = e !== null ? e.memoizedState : null;
          } else e = sn.next;
          var t = Zt === null ? Lt.memoizedState : Zt.next;
          if (t !== null) Zt = t, sn = e;
          else {
            if (e === null) throw Error(m(310));
            e = { memoizedState: (sn = e).memoizedState, baseState: sn.baseState, baseQueue: sn.baseQueue, queue: sn.queue, next: null }, Zt === null ? Lt.memoizedState = Zt = e : Zt = Zt.next = e;
          }
          return Zt;
        }
        function uo(e, t) {
          return typeof t == "function" ? t(e) : t;
        }
        function ta(e) {
          var t = Ho(), n = t.queue;
          if (n === null) throw Error(m(311));
          n.lastRenderedReducer = e;
          var r = sn, i = r.baseQueue, d = n.pending;
          if (d !== null) {
            if (i !== null) {
              var v = i.next;
              i.next = d.next, d.next = v;
            }
            r.baseQueue = i = d, n.pending = null;
          }
          if (i !== null) {
            i = i.next, r = r.baseState;
            var x = v = d = null, X = i;
            do {
              var q = X.expirationTime;
              if (q < $r) {
                var ge = { expirationTime: X.expirationTime, suspenseConfig: X.suspenseConfig, action: X.action, eagerReducer: X.eagerReducer, eagerState: X.eagerState, next: null };
                x === null ? (v = x = ge, d = r) : x = x.next = ge, q > Lt.expirationTime && (Lt.expirationTime = q, va(q));
              } else x !== null && (x = x.next = { expirationTime: 1073741823, suspenseConfig: X.suspenseConfig, action: X.action, eagerReducer: X.eagerReducer, eagerState: X.eagerState, next: null }), Fl(q, X.suspenseConfig), r = X.eagerReducer === e ? X.eagerState : e(r, X.action);
              X = X.next;
            } while (X !== null && X !== i);
            x === null ? d = r : x.next = v, mr(r, t.memoizedState) || (er = !0), t.memoizedState = r, t.baseState = d, t.baseQueue = x, n.lastRenderedState = r;
          }
          return [t.memoizedState, n.dispatch];
        }
        function na(e) {
          var t = Ho(), n = t.queue;
          if (n === null) throw Error(m(311));
          n.lastRenderedReducer = e;
          var r = n.dispatch, i = n.pending, d = t.memoizedState;
          if (i !== null) {
            n.pending = null;
            var v = i = i.next;
            do
              d = e(d, v.action), v = v.next;
            while (v !== i);
            mr(d, t.memoizedState) || (er = !0), t.memoizedState = d, t.baseQueue === null && (t.baseState = d), n.lastRenderedState = d;
          }
          return [d, r];
        }
        function Qa(e) {
          var t = Wo();
          return typeof e == "function" && (e = e()), t.memoizedState = t.baseState = e, e = (e = t.queue = { pending: null, dispatch: null, lastRenderedReducer: uo, lastRenderedState: e }).dispatch = al.bind(null, Lt, e), [t.memoizedState, e];
        }
        function Ga(e, t, n, r) {
          return e = { tag: e, create: t, destroy: n, deps: r, next: null }, (t = Lt.updateQueue) === null ? (t = { lastEffect: null }, Lt.updateQueue = t, t.lastEffect = e.next = e) : (n = t.lastEffect) === null ? t.lastEffect = e.next = e : (r = n.next, n.next = e, e.next = r, t.lastEffect = e), e;
        }
        function Js() {
          return Ho().memoizedState;
        }
        function Xa(e, t, n, r) {
          var i = Wo();
          Lt.effectTag |= e, i.memoizedState = Ga(1 | t, n, void 0, r === void 0 ? null : r);
        }
        function Za(e, t, n, r) {
          var i = Ho();
          r = r === void 0 ? null : r;
          var d = void 0;
          if (sn !== null) {
            var v = sn.memoizedState;
            if (d = v.destroy, r !== null && qa(r, v.deps)) return void Ga(t, n, d, r);
          }
          Lt.effectTag |= e, i.memoizedState = Ga(1 | t, n, d, r);
        }
        function el(e, t) {
          return Xa(516, 4, e, t);
        }
        function ra(e, t) {
          return Za(516, 4, e, t);
        }
        function tl(e, t) {
          return Za(4, 2, e, t);
        }
        function nl(e, t) {
          return typeof t == "function" ? (e = e(), t(e), function() {
            t(null);
          }) : t != null ? (e = e(), t.current = e, function() {
            t.current = null;
          }) : void 0;
        }
        function rl(e, t, n) {
          return n = n != null ? n.concat([e]) : null, Za(4, 2, nl.bind(null, t, e), n);
        }
        function Ja() {
        }
        function ol(e, t) {
          return Wo().memoizedState = [e, t === void 0 ? null : t], e;
        }
        function oa(e, t) {
          var n = Ho();
          t = t === void 0 ? null : t;
          var r = n.memoizedState;
          return r !== null && t !== null && qa(t, r[1]) ? r[0] : (n.memoizedState = [e, t], e);
        }
        function il(e, t) {
          var n = Ho();
          t = t === void 0 ? null : t;
          var r = n.memoizedState;
          return r !== null && t !== null && qa(t, r[1]) ? r[0] : (e = e(), n.memoizedState = [e, t], e);
        }
        function es(e, t, n) {
          var r = Hi();
          Br(98 > r ? 98 : r, function() {
            e(!0);
          }), Br(97 < r ? 97 : r, function() {
            var i = Ln.suspense;
            Ln.suspense = t === void 0 ? null : t;
            try {
              e(!1), n();
            } finally {
              Ln.suspense = i;
            }
          });
        }
        function al(e, t, n) {
          var r = tr(), i = si.suspense;
          i = { expirationTime: r = mo(r, e, i), suspenseConfig: i, action: n, eagerReducer: null, eagerState: null, next: null };
          var d = t.pending;
          if (d === null ? i.next = i : (i.next = d.next, d.next = i), t.pending = i, d = e.alternate, e === Lt || d !== null && d === Lt) ea = !0, i.expirationTime = $r, Lt.expirationTime = $r;
          else {
            if (e.expirationTime === 0 && (d === null || d.expirationTime === 0) && (d = t.lastRenderedReducer) !== null) try {
              var v = t.lastRenderedState, x = d(v, n);
              if (i.eagerReducer = d, i.eagerState = x, mr(x, v)) return;
            } catch {
            }
            Kr(e, r);
          }
        }
        var ia = { readContext: zn, useCallback: En, useContext: En, useEffect: En, useImperativeHandle: En, useLayoutEffect: En, useMemo: En, useReducer: En, useRef: En, useState: En, useDebugValue: En, useResponder: En, useDeferredValue: En, useTransition: En }, vc = { readContext: zn, useCallback: ol, useContext: zn, useEffect: el, useImperativeHandle: function(e, t, n) {
          return n = n != null ? n.concat([e]) : null, Xa(4, 2, nl.bind(null, t, e), n);
        }, useLayoutEffect: function(e, t) {
          return Xa(4, 2, e, t);
        }, useMemo: function(e, t) {
          var n = Wo();
          return t = t === void 0 ? null : t, e = e(), n.memoizedState = [e, t], e;
        }, useReducer: function(e, t, n) {
          var r = Wo();
          return t = n !== void 0 ? n(t) : t, r.memoizedState = r.baseState = t, e = (e = r.queue = { pending: null, dispatch: null, lastRenderedReducer: e, lastRenderedState: t }).dispatch = al.bind(null, Lt, e), [r.memoizedState, e];
        }, useRef: function(e) {
          return e = { current: e }, Wo().memoizedState = e;
        }, useState: Qa, useDebugValue: Ja, useResponder: Ya, useDeferredValue: function(e, t) {
          var n = Qa(e), r = n[0], i = n[1];
          return el(function() {
            var d = Ln.suspense;
            Ln.suspense = t === void 0 ? null : t;
            try {
              i(e);
            } finally {
              Ln.suspense = d;
            }
          }, [e, t]), r;
        }, useTransition: function(e) {
          var t = Qa(!1), n = t[0];
          return t = t[1], [ol(es.bind(null, t, e), [t, e]), n];
        } }, wc = { readContext: zn, useCallback: oa, useContext: zn, useEffect: ra, useImperativeHandle: rl, useLayoutEffect: tl, useMemo: il, useReducer: ta, useRef: Js, useState: function() {
          return ta(uo);
        }, useDebugValue: Ja, useResponder: Ya, useDeferredValue: function(e, t) {
          var n = ta(uo), r = n[0], i = n[1];
          return ra(function() {
            var d = Ln.suspense;
            Ln.suspense = t === void 0 ? null : t;
            try {
              i(e);
            } finally {
              Ln.suspense = d;
            }
          }, [e, t]), r;
        }, useTransition: function(e) {
          var t = ta(uo), n = t[0];
          return t = t[1], [oa(es.bind(null, t, e), [t, e]), n];
        } }, kc = { readContext: zn, useCallback: oa, useContext: zn, useEffect: ra, useImperativeHandle: rl, useLayoutEffect: tl, useMemo: il, useReducer: na, useRef: Js, useState: function() {
          return na(uo);
        }, useDebugValue: Ja, useResponder: Ya, useDeferredValue: function(e, t) {
          var n = na(uo), r = n[0], i = n[1];
          return ra(function() {
            var d = Ln.suspense;
            Ln.suspense = t === void 0 ? null : t;
            try {
              i(e);
            } finally {
              Ln.suspense = d;
            }
          }, [e, t]), r;
        }, useTransition: function(e) {
          var t = na(uo), n = t[0];
          return t = t[1], [oa(es.bind(null, t, e), [t, e]), n];
        } }, yr = null, Yr = null, fo = !1;
        function sl(e, t) {
          var n = nr(5, null, null, 0);
          n.elementType = "DELETED", n.type = "DELETED", n.stateNode = t, n.return = e, n.effectTag = 8, e.lastEffect !== null ? (e.lastEffect.nextEffect = n, e.lastEffect = n) : e.firstEffect = e.lastEffect = n;
        }
        function ll(e, t) {
          switch (e.tag) {
            case 5:
              var n = e.type;
              return (t = t.nodeType !== 1 || n.toLowerCase() !== t.nodeName.toLowerCase() ? null : t) !== null && (e.stateNode = t, !0);
            case 6:
              return (t = e.pendingProps === "" || t.nodeType !== 3 ? null : t) !== null && (e.stateNode = t, !0);
            case 13:
            default:
              return !1;
          }
        }
        function ts(e) {
          if (fo) {
            var t = Yr;
            if (t) {
              var n = t;
              if (!ll(e, t)) {
                if (!(t = Ar(n.nextSibling)) || !ll(e, t)) return e.effectTag = -1025 & e.effectTag | 2, fo = !1, void (yr = e);
                sl(yr, n);
              }
              yr = e, Yr = Ar(t.firstChild);
            } else e.effectTag = -1025 & e.effectTag | 2, fo = !1, yr = e;
          }
        }
        function cl(e) {
          for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13; ) e = e.return;
          yr = e;
        }
        function aa(e) {
          if (e !== yr) return !1;
          if (!fo) return cl(e), fo = !0, !1;
          var t = e.type;
          if (e.tag !== 5 || t !== "head" && t !== "body" && !ei(t, e.memoizedProps)) for (t = Yr; t; ) sl(e, t), t = Ar(t.nextSibling);
          if (cl(e), e.tag === 13) {
            if (!(e = (e = e.memoizedState) !== null ? e.dehydrated : null)) throw Error(m(317));
            e: {
              for (e = e.nextSibling, t = 0; e; ) {
                if (e.nodeType === 8) {
                  var n = e.data;
                  if (n === "/$") {
                    if (t === 0) {
                      Yr = Ar(e.nextSibling);
                      break e;
                    }
                    t--;
                  } else n !== "$" && n !== "$!" && n !== "$?" || t++;
                }
                e = e.nextSibling;
              }
              Yr = null;
            }
          } else Yr = yr ? Ar(e.stateNode.nextSibling) : null;
          return !0;
        }
        function ns() {
          Yr = yr = null, fo = !1;
        }
        var Ec = he.ReactCurrentOwner, er = !1;
        function Un(e, t, n, r) {
          t.child = e === null ? Ha(t, null, n, r) : Fo(t, e.child, n, r);
        }
        function ul(e, t, n, r, i) {
          n = n.render;
          var d = t.ref;
          return Uo(t, i), r = Ka(e, t, n, r, d, i), e === null || er ? (t.effectTag |= 1, Un(e, t, r, i), t.child) : (t.updateQueue = e.updateQueue, t.effectTag &= -517, e.expirationTime <= i && (e.expirationTime = 0), vr(e, t, i));
        }
        function fl(e, t, n, r, i, d) {
          if (e === null) {
            var v = n.type;
            return typeof v != "function" || bs(v) || v.defaultProps !== void 0 || n.compare !== null || n.defaultProps !== void 0 ? ((e = wa(n.type, null, r, null, t.mode, d)).ref = t.ref, e.return = t, t.child = e) : (t.tag = 15, t.type = v, dl(e, t, v, r, i, d));
          }
          return v = e.child, i < d && (i = v.memoizedProps, (n = (n = n.compare) !== null ? n : gr)(i, r) && e.ref === t.ref) ? vr(e, t, d) : (t.effectTag |= 1, (e = vo(v, r)).ref = t.ref, e.return = t, t.child = e);
        }
        function dl(e, t, n, r, i, d) {
          return e !== null && gr(e.memoizedProps, r) && e.ref === t.ref && (er = !1, i < d) ? (t.expirationTime = e.expirationTime, vr(e, t, d)) : rs(e, t, n, r, d);
        }
        function pl(e, t) {
          var n = t.ref;
          (e === null && n !== null || e !== null && e.ref !== n) && (t.effectTag |= 128);
        }
        function rs(e, t, n, r, i) {
          var d = hn(n) ? lo : Xt.current;
          return d = zo(t, d), Uo(t, i), n = Ka(e, t, n, r, d, i), e === null || er ? (t.effectTag |= 1, Un(e, t, n, i), t.child) : (t.updateQueue = e.updateQueue, t.effectTag &= -517, e.expirationTime <= i && (e.expirationTime = 0), vr(e, t, i));
        }
        function hl(e, t, n, r, i) {
          if (hn(n)) {
            var d = !0;
            Fi(t);
          } else d = !1;
          if (Uo(t, i), t.stateNode === null) e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= 2), Qs(t, n, r), Wa(t, n, r, i), r = !0;
          else if (e === null) {
            var v = t.stateNode, x = t.memoizedProps;
            v.props = x;
            var X = v.context, q = n.contextType;
            typeof q == "object" && q !== null ? q = zn(q) : q = zo(t, q = hn(n) ? lo : Xt.current);
            var ge = n.getDerivedStateFromProps, De = typeof ge == "function" || typeof v.getSnapshotBeforeUpdate == "function";
            De || typeof v.UNSAFE_componentWillReceiveProps != "function" && typeof v.componentWillReceiveProps != "function" || (x !== r || X !== q) && Gs(t, v, r, q), Wr = !1;
            var He = t.memoizedState;
            v.state = He, ai(t, r, v, i), X = t.memoizedState, x !== r || He !== X || pn.current || Wr ? (typeof ge == "function" && (Ki(t, n, ge, r), X = t.memoizedState), (x = Wr || Ks(t, n, x, r, He, X, q)) ? (De || typeof v.UNSAFE_componentWillMount != "function" && typeof v.componentWillMount != "function" || (typeof v.componentWillMount == "function" && v.componentWillMount(), typeof v.UNSAFE_componentWillMount == "function" && v.UNSAFE_componentWillMount()), typeof v.componentDidMount == "function" && (t.effectTag |= 4)) : (typeof v.componentDidMount == "function" && (t.effectTag |= 4), t.memoizedProps = r, t.memoizedState = X), v.props = r, v.state = X, v.context = q, r = x) : (typeof v.componentDidMount == "function" && (t.effectTag |= 4), r = !1);
          } else v = t.stateNode, Ba(e, t), x = t.memoizedProps, v.props = t.type === t.elementType ? x : Vn(t.type, x), X = v.context, typeof (q = n.contextType) == "object" && q !== null ? q = zn(q) : q = zo(t, q = hn(n) ? lo : Xt.current), (De = typeof (ge = n.getDerivedStateFromProps) == "function" || typeof v.getSnapshotBeforeUpdate == "function") || typeof v.UNSAFE_componentWillReceiveProps != "function" && typeof v.componentWillReceiveProps != "function" || (x !== r || X !== q) && Gs(t, v, r, q), Wr = !1, X = t.memoizedState, v.state = X, ai(t, r, v, i), He = t.memoizedState, x !== r || X !== He || pn.current || Wr ? (typeof ge == "function" && (Ki(t, n, ge, r), He = t.memoizedState), (ge = Wr || Ks(t, n, x, r, X, He, q)) ? (De || typeof v.UNSAFE_componentWillUpdate != "function" && typeof v.componentWillUpdate != "function" || (typeof v.componentWillUpdate == "function" && v.componentWillUpdate(r, He, q), typeof v.UNSAFE_componentWillUpdate == "function" && v.UNSAFE_componentWillUpdate(r, He, q)), typeof v.componentDidUpdate == "function" && (t.effectTag |= 4), typeof v.getSnapshotBeforeUpdate == "function" && (t.effectTag |= 256)) : (typeof v.componentDidUpdate != "function" || x === e.memoizedProps && X === e.memoizedState || (t.effectTag |= 4), typeof v.getSnapshotBeforeUpdate != "function" || x === e.memoizedProps && X === e.memoizedState || (t.effectTag |= 256), t.memoizedProps = r, t.memoizedState = He), v.props = r, v.state = He, v.context = q, r = ge) : (typeof v.componentDidUpdate != "function" || x === e.memoizedProps && X === e.memoizedState || (t.effectTag |= 4), typeof v.getSnapshotBeforeUpdate != "function" || x === e.memoizedProps && X === e.memoizedState || (t.effectTag |= 256), r = !1);
          return os(e, t, n, r, d, i);
        }
        function os(e, t, n, r, i, d) {
          pl(e, t);
          var v = (64 & t.effectTag) != 0;
          if (!r && !v) return i && Ds(t, n, !1), vr(e, t, d);
          r = t.stateNode, Ec.current = t;
          var x = v && typeof n.getDerivedStateFromError != "function" ? null : r.render();
          return t.effectTag |= 1, e !== null && v ? (t.child = Fo(t, e.child, null, d), t.child = Fo(t, null, x, d)) : Un(e, t, x, d), t.memoizedState = r.state, i && Ds(t, n, !0), t.child;
        }
        function ml(e) {
          var t = e.stateNode;
          t.pendingContext ? Ns(0, t.pendingContext, t.pendingContext !== t.context) : t.context && Ns(0, t.context, !1), Va(e, t.containerInfo);
        }
        var gl, bl, yl, is = { dehydrated: null, retryTime: 0 };
        function vl(e, t, n) {
          var r, i = t.mode, d = t.pendingProps, v = Ct.current, x = !1;
          if ((r = (64 & t.effectTag) != 0) || (r = (2 & v) != 0 && (e === null || e.memoizedState !== null)), r ? (x = !0, t.effectTag &= -65) : e !== null && e.memoizedState === null || d.fallback === void 0 || d.unstable_avoidThisFallback === !0 || (v |= 1), St(Ct, 1 & v), e === null) {
            if (d.fallback !== void 0 && ts(t), x) {
              if (x = d.fallback, (d = Qr(null, i, 0, null)).return = t, (2 & t.mode) == 0) for (e = t.memoizedState !== null ? t.child.child : t.child, d.child = e; e !== null; ) e.return = d, e = e.sibling;
              return (n = Qr(x, i, n, null)).return = t, d.sibling = n, t.memoizedState = is, t.child = d, n;
            }
            return i = d.children, t.memoizedState = null, t.child = Ha(t, null, i, n);
          }
          if (e.memoizedState !== null) {
            if (i = (e = e.child).sibling, x) {
              if (d = d.fallback, (n = vo(e, e.pendingProps)).return = t, (2 & t.mode) == 0 && (x = t.memoizedState !== null ? t.child.child : t.child) !== e.child) for (n.child = x; x !== null; ) x.return = n, x = x.sibling;
              return (i = vo(i, d)).return = t, n.sibling = i, n.childExpirationTime = 0, t.memoizedState = is, t.child = n, i;
            }
            return n = Fo(t, e.child, d.children, n), t.memoizedState = null, t.child = n;
          }
          if (e = e.child, x) {
            if (x = d.fallback, (d = Qr(null, i, 0, null)).return = t, d.child = e, e !== null && (e.return = d), (2 & t.mode) == 0) for (e = t.memoizedState !== null ? t.child.child : t.child, d.child = e; e !== null; ) e.return = d, e = e.sibling;
            return (n = Qr(x, i, n, null)).return = t, d.sibling = n, n.effectTag |= 2, d.childExpirationTime = 0, t.memoizedState = is, t.child = d, n;
          }
          return t.memoizedState = null, t.child = Fo(t, e, d.children, n);
        }
        function wl(e, t) {
          e.expirationTime < t && (e.expirationTime = t);
          var n = e.alternate;
          n !== null && n.expirationTime < t && (n.expirationTime = t), Vs(e.return, t);
        }
        function as(e, t, n, r, i, d) {
          var v = e.memoizedState;
          v === null ? e.memoizedState = { isBackwards: t, rendering: null, renderingStartTime: 0, last: r, tail: n, tailExpiration: 0, tailMode: i, lastEffect: d } : (v.isBackwards = t, v.rendering = null, v.renderingStartTime = 0, v.last = r, v.tail = n, v.tailExpiration = 0, v.tailMode = i, v.lastEffect = d);
        }
        function kl(e, t, n) {
          var r = t.pendingProps, i = r.revealOrder, d = r.tail;
          if (Un(e, t, r.children, n), (2 & (r = Ct.current)) != 0) r = 1 & r | 2, t.effectTag |= 64;
          else {
            if (e !== null && 64 & e.effectTag) e: for (e = t.child; e !== null; ) {
              if (e.tag === 13) e.memoizedState !== null && wl(e, n);
              else if (e.tag === 19) wl(e, n);
              else if (e.child !== null) {
                e.child.return = e, e = e.child;
                continue;
              }
              if (e === t) break e;
              for (; e.sibling === null; ) {
                if (e.return === null || e.return === t) break e;
                e = e.return;
              }
              e.sibling.return = e.return, e = e.sibling;
            }
            r &= 1;
          }
          if (St(Ct, r), (2 & t.mode) == 0) t.memoizedState = null;
          else switch (i) {
            case "forwards":
              for (n = t.child, i = null; n !== null; ) (e = n.alternate) !== null && Zi(e) === null && (i = n), n = n.sibling;
              (n = i) === null ? (i = t.child, t.child = null) : (i = n.sibling, n.sibling = null), as(t, !1, i, n, d, t.lastEffect);
              break;
            case "backwards":
              for (n = null, i = t.child, t.child = null; i !== null; ) {
                if ((e = i.alternate) !== null && Zi(e) === null) {
                  t.child = i;
                  break;
                }
                e = i.sibling, i.sibling = n, n = i, i = e;
              }
              as(t, !0, n, null, d, t.lastEffect);
              break;
            case "together":
              as(t, !1, null, null, void 0, t.lastEffect);
              break;
            default:
              t.memoizedState = null;
          }
          return t.child;
        }
        function vr(e, t, n) {
          e !== null && (t.dependencies = e.dependencies);
          var r = t.expirationTime;
          if (r !== 0 && va(r), t.childExpirationTime < n) return null;
          if (e !== null && t.child !== e.child) throw Error(m(153));
          if (t.child !== null) {
            for (n = vo(e = t.child, e.pendingProps), t.child = n, n.return = t; e.sibling !== null; ) e = e.sibling, (n = n.sibling = vo(e, e.pendingProps)).return = t;
            n.sibling = null;
          }
          return t.child;
        }
        function sa(e, t) {
          switch (e.tailMode) {
            case "hidden":
              t = e.tail;
              for (var n = null; t !== null; ) t.alternate !== null && (n = t), t = t.sibling;
              n === null ? e.tail = null : n.sibling = null;
              break;
            case "collapsed":
              n = e.tail;
              for (var r = null; n !== null; ) n.alternate !== null && (r = n), n = n.sibling;
              r === null ? t || e.tail === null ? e.tail = null : e.tail.sibling = null : r.sibling = null;
          }
        }
        function _c(e, t, n) {
          var r = t.pendingProps;
          switch (t.tag) {
            case 2:
            case 16:
            case 15:
            case 0:
            case 11:
            case 7:
            case 8:
            case 12:
            case 9:
            case 14:
              return null;
            case 1:
              return hn(t.type) && Ui(), null;
            case 3:
              return Bo(), vt(pn), vt(Xt), (n = t.stateNode).pendingContext && (n.context = n.pendingContext, n.pendingContext = null), e !== null && e.child !== null || !aa(t) || (t.effectTag |= 4), null;
            case 5:
              $a(t), n = co(fi.current);
              var i = t.type;
              if (e !== null && t.stateNode != null) bl(e, t, i, r, n), e.ref !== t.ref && (t.effectTag |= 128);
              else {
                if (!r) {
                  if (t.stateNode === null) throw Error(m(166));
                  return null;
                }
                if (e = co(Jn.current), aa(t)) {
                  r = t.stateNode, i = t.type;
                  var d = t.memoizedProps;
                  switch (r[Kn] = t, r[no] = d, i) {
                    case "iframe":
                    case "object":
                    case "embed":
                      mt("load", r);
                      break;
                    case "video":
                    case "audio":
                      for (e = 0; e < ct.length; e++) mt(ct[e], r);
                      break;
                    case "source":
                      mt("error", r);
                      break;
                    case "img":
                    case "image":
                    case "link":
                      mt("error", r), mt("load", r);
                      break;
                    case "form":
                      mt("reset", r), mt("submit", r);
                      break;
                    case "details":
                      mt("toggle", r);
                      break;
                    case "input":
                      bn(r, d), mt("invalid", r), Wn(n, "onChange");
                      break;
                    case "select":
                      r._wrapperState = { wasMultiple: !!d.multiple }, mt("invalid", r), Wn(n, "onChange");
                      break;
                    case "textarea":
                      On(r, d), mt("invalid", r), Wn(n, "onChange");
                  }
                  for (var v in Ko(i, d), e = null, d) if (d.hasOwnProperty(v)) {
                    var x = d[v];
                    v === "children" ? typeof x == "string" ? r.textContent !== x && (e = ["children", x]) : typeof x == "number" && r.textContent !== "" + x && (e = ["children", "" + x]) : M.hasOwnProperty(v) && x != null && Wn(n, v);
                  }
                  switch (i) {
                    case "input":
                      Sr(r), ar(r, d, !0);
                      break;
                    case "textarea":
                      Sr(r), Xr(r);
                      break;
                    case "select":
                    case "option":
                      break;
                    default:
                      typeof d.onClick == "function" && (r.onclick = Oo);
                  }
                  n = e, t.updateQueue = n, n !== null && (t.effectTag |= 4);
                } else {
                  switch (v = n.nodeType === 9 ? n : n.ownerDocument, e === Ci && (e = we(i)), e === Ci ? i === "script" ? ((e = v.createElement("div")).innerHTML = "<script><\/script>", e = e.removeChild(e.firstChild)) : typeof r.is == "string" ? e = v.createElement(i, { is: r.is }) : (e = v.createElement(i), i === "select" && (v = e, r.multiple ? v.multiple = !0 : r.size && (v.size = r.size))) : e = v.createElementNS(e, i), e[Kn] = t, e[no] = r, gl(e, t), t.stateNode = e, v = Qo(i, r), i) {
                    case "iframe":
                    case "object":
                    case "embed":
                      mt("load", e), x = r;
                      break;
                    case "video":
                    case "audio":
                      for (x = 0; x < ct.length; x++) mt(ct[x], e);
                      x = r;
                      break;
                    case "source":
                      mt("error", e), x = r;
                      break;
                    case "img":
                    case "image":
                    case "link":
                      mt("error", e), mt("load", e), x = r;
                      break;
                    case "form":
                      mt("reset", e), mt("submit", e), x = r;
                      break;
                    case "details":
                      mt("toggle", e), x = r;
                      break;
                    case "input":
                      bn(e, r), x = Cr(e, r), mt("invalid", e), Wn(n, "onChange");
                      break;
                    case "option":
                      x = sr(e, r);
                      break;
                    case "select":
                      e._wrapperState = { wasMultiple: !!r.multiple }, x = o({}, r, { value: void 0 }), mt("invalid", e), Wn(n, "onChange");
                      break;
                    case "textarea":
                      On(e, r), x = lr(e, r), mt("invalid", e), Wn(n, "onChange");
                      break;
                    default:
                      x = r;
                  }
                  Ko(i, x);
                  var X = x;
                  for (d in X) if (X.hasOwnProperty(d)) {
                    var q = X[d];
                    d === "style" ? xi(e, q) : d === "dangerouslySetInnerHTML" ? (q = q ? q.__html : void 0) != null && qe(e, q) : d === "children" ? typeof q == "string" ? (i !== "textarea" || q !== "") && st(e, q) : typeof q == "number" && st(e, "" + q) : d !== "suppressContentEditableWarning" && d !== "suppressHydrationWarning" && d !== "autoFocus" && (M.hasOwnProperty(d) ? q != null && Wn(n, d) : q != null && je(e, d, q, v));
                  }
                  switch (i) {
                    case "input":
                      Sr(e), ar(e, r, !1);
                      break;
                    case "textarea":
                      Sr(e), Xr(e);
                      break;
                    case "option":
                      r.value != null && e.setAttribute("value", "" + qt(r.value));
                      break;
                    case "select":
                      e.multiple = !!r.multiple, (n = r.value) != null ? Tn(e, !!r.multiple, n, !1) : r.defaultValue != null && Tn(e, !!r.multiple, r.defaultValue, !0);
                      break;
                    default:
                      typeof x.onClick == "function" && (e.onclick = Oo);
                  }
                  Pi(i, r) && (t.effectTag |= 4);
                }
                t.ref !== null && (t.effectTag |= 128);
              }
              return null;
            case 6:
              if (e && t.stateNode != null) yl(0, t, e.memoizedProps, r);
              else {
                if (typeof r != "string" && t.stateNode === null) throw Error(m(166));
                n = co(fi.current), co(Jn.current), aa(t) ? (n = t.stateNode, r = t.memoizedProps, n[Kn] = t, n.nodeValue !== r && (t.effectTag |= 4)) : ((n = (n.nodeType === 9 ? n : n.ownerDocument).createTextNode(r))[Kn] = t, t.stateNode = n);
              }
              return null;
            case 13:
              return vt(Ct), r = t.memoizedState, 64 & t.effectTag ? (t.expirationTime = n, t) : (n = r !== null, r = !1, e === null ? t.memoizedProps.fallback !== void 0 && aa(t) : (r = (i = e.memoizedState) !== null, n || i === null || (i = e.child.sibling) !== null && ((d = t.firstEffect) !== null ? (t.firstEffect = i, i.nextEffect = d) : (t.firstEffect = t.lastEffect = i, i.nextEffect = null), i.effectTag = 8)), n && !r && 2 & t.mode && (e === null && t.memoizedProps.unstable_avoidThisFallback !== !0 || 1 & Ct.current ? Ft === po && (Ft = ca) : (Ft !== po && Ft !== ca || (Ft = ua), pi !== 0 && _n !== null && (wo(_n, mn), $l(_n, pi)))), (n || r) && (t.effectTag |= 4), null);
            case 4:
              return Bo(), null;
            case 10:
              return Ua(t), null;
            case 17:
              return hn(t.type) && Ui(), null;
            case 19:
              if (vt(Ct), (r = t.memoizedState) === null) return null;
              if (i = (64 & t.effectTag) != 0, (d = r.rendering) === null) {
                if (i) sa(r, !1);
                else if (Ft !== po || e !== null && 64 & e.effectTag) for (d = t.child; d !== null; ) {
                  if ((e = Zi(d)) !== null) {
                    for (t.effectTag |= 64, sa(r, !1), (i = e.updateQueue) !== null && (t.updateQueue = i, t.effectTag |= 4), r.lastEffect === null && (t.firstEffect = null), t.lastEffect = r.lastEffect, r = t.child; r !== null; ) d = n, (i = r).effectTag &= 2, i.nextEffect = null, i.firstEffect = null, i.lastEffect = null, (e = i.alternate) === null ? (i.childExpirationTime = 0, i.expirationTime = d, i.child = null, i.memoizedProps = null, i.memoizedState = null, i.updateQueue = null, i.dependencies = null) : (i.childExpirationTime = e.childExpirationTime, i.expirationTime = e.expirationTime, i.child = e.child, i.memoizedProps = e.memoizedProps, i.memoizedState = e.memoizedState, i.updateQueue = e.updateQueue, d = e.dependencies, i.dependencies = d === null ? null : { expirationTime: d.expirationTime, firstContext: d.firstContext, responders: d.responders }), r = r.sibling;
                    return St(Ct, 1 & Ct.current | 2), t.child;
                  }
                  d = d.sibling;
                }
              } else {
                if (!i) if ((e = Zi(d)) !== null) {
                  if (t.effectTag |= 64, i = !0, (n = e.updateQueue) !== null && (t.updateQueue = n, t.effectTag |= 4), sa(r, !0), r.tail === null && r.tailMode === "hidden" && !d.alternate) return (t = t.lastEffect = r.lastEffect) !== null && (t.nextEffect = null), null;
                } else 2 * jn() - r.renderingStartTime > r.tailExpiration && 1 < n && (t.effectTag |= 64, i = !0, sa(r, !1), t.expirationTime = t.childExpirationTime = n - 1);
                r.isBackwards ? (d.sibling = t.child, t.child = d) : ((n = r.last) !== null ? n.sibling = d : t.child = d, r.last = d);
              }
              return r.tail !== null ? (r.tailExpiration === 0 && (r.tailExpiration = jn() + 500), n = r.tail, r.rendering = n, r.tail = n.sibling, r.lastEffect = t.lastEffect, r.renderingStartTime = jn(), n.sibling = null, t = Ct.current, St(Ct, i ? 1 & t | 2 : 1 & t), n) : null;
          }
          throw Error(m(156, t.tag));
        }
        function xc(e) {
          switch (e.tag) {
            case 1:
              hn(e.type) && Ui();
              var t = e.effectTag;
              return 4096 & t ? (e.effectTag = -4097 & t | 64, e) : null;
            case 3:
              if (Bo(), vt(pn), vt(Xt), (64 & (t = e.effectTag)) != 0) throw Error(m(285));
              return e.effectTag = -4097 & t | 64, e;
            case 5:
              return $a(e), null;
            case 13:
              return vt(Ct), 4096 & (t = e.effectTag) ? (e.effectTag = -4097 & t | 64, e) : null;
            case 19:
              return vt(Ct), null;
            case 4:
              return Bo(), null;
            case 10:
              return Ua(e), null;
            default:
              return null;
          }
        }
        function ss(e, t) {
          return { value: e, source: t, stack: xr(t) };
        }
        gl = function(e, t) {
          for (var n = t.child; n !== null; ) {
            if (n.tag === 5 || n.tag === 6) e.appendChild(n.stateNode);
            else if (n.tag !== 4 && n.child !== null) {
              n.child.return = n, n = n.child;
              continue;
            }
            if (n === t) break;
            for (; n.sibling === null; ) {
              if (n.return === null || n.return === t) return;
              n = n.return;
            }
            n.sibling.return = n.return, n = n.sibling;
          }
        }, bl = function(e, t, n, r, i) {
          var d = e.memoizedProps;
          if (d !== r) {
            var v, x, X = t.stateNode;
            switch (co(Jn.current), e = null, n) {
              case "input":
                d = Cr(X, d), r = Cr(X, r), e = [];
                break;
              case "option":
                d = sr(X, d), r = sr(X, r), e = [];
                break;
              case "select":
                d = o({}, d, { value: void 0 }), r = o({}, r, { value: void 0 }), e = [];
                break;
              case "textarea":
                d = lr(X, d), r = lr(X, r), e = [];
                break;
              default:
                typeof d.onClick != "function" && typeof r.onClick == "function" && (X.onclick = Oo);
            }
            for (v in Ko(n, r), n = null, d) if (!r.hasOwnProperty(v) && d.hasOwnProperty(v) && d[v] != null) if (v === "style") for (x in X = d[v]) X.hasOwnProperty(x) && (n || (n = {}), n[x] = "");
            else v !== "dangerouslySetInnerHTML" && v !== "children" && v !== "suppressContentEditableWarning" && v !== "suppressHydrationWarning" && v !== "autoFocus" && (M.hasOwnProperty(v) ? e || (e = []) : (e = e || []).push(v, null));
            for (v in r) {
              var q = r[v];
              if (X = d != null ? d[v] : void 0, r.hasOwnProperty(v) && q !== X && (q != null || X != null)) if (v === "style") if (X) {
                for (x in X) !X.hasOwnProperty(x) || q && q.hasOwnProperty(x) || (n || (n = {}), n[x] = "");
                for (x in q) q.hasOwnProperty(x) && X[x] !== q[x] && (n || (n = {}), n[x] = q[x]);
              } else n || (e || (e = []), e.push(v, n)), n = q;
              else v === "dangerouslySetInnerHTML" ? (q = q ? q.__html : void 0, X = X ? X.__html : void 0, q != null && X !== q && (e = e || []).push(v, q)) : v === "children" ? X === q || typeof q != "string" && typeof q != "number" || (e = e || []).push(v, "" + q) : v !== "suppressContentEditableWarning" && v !== "suppressHydrationWarning" && (M.hasOwnProperty(v) ? (q != null && Wn(i, v), e || X === q || (e = [])) : (e = e || []).push(v, q));
            }
            n && (e = e || []).push("style", n), i = e, (t.updateQueue = i) && (t.effectTag |= 4);
          }
        }, yl = function(e, t, n, r) {
          n !== r && (t.effectTag |= 4);
        };
        var Sc = typeof WeakSet == "function" ? WeakSet : Set;
        function ls(e, t) {
          var n = t.source, r = t.stack;
          r === null && n !== null && (r = xr(n)), n !== null && Yt(n.type), t = t.value, e !== null && e.tag === 1 && Yt(e.type);
          try {
            console.error(t);
          } catch (i) {
            setTimeout(function() {
              throw i;
            });
          }
        }
        function El(e) {
          var t = e.ref;
          if (t !== null) if (typeof t == "function") try {
            t(null);
          } catch (n) {
            yo(e, n);
          }
          else t.current = null;
        }
        function Cc(e, t) {
          switch (t.tag) {
            case 0:
            case 11:
            case 15:
            case 22:
              return;
            case 1:
              if (256 & t.effectTag && e !== null) {
                var n = e.memoizedProps, r = e.memoizedState;
                t = (e = t.stateNode).getSnapshotBeforeUpdate(t.elementType === t.type ? n : Vn(t.type, n), r), e.__reactInternalSnapshotBeforeUpdate = t;
              }
              return;
            case 3:
            case 5:
            case 6:
            case 4:
            case 17:
              return;
          }
          throw Error(m(163));
        }
        function _l(e, t) {
          if ((t = (t = t.updateQueue) !== null ? t.lastEffect : null) !== null) {
            var n = t = t.next;
            do {
              if ((n.tag & e) === e) {
                var r = n.destroy;
                n.destroy = void 0, r !== void 0 && r();
              }
              n = n.next;
            } while (n !== t);
          }
        }
        function xl(e, t) {
          if ((t = (t = t.updateQueue) !== null ? t.lastEffect : null) !== null) {
            var n = t = t.next;
            do {
              if ((n.tag & e) === e) {
                var r = n.create;
                n.destroy = r();
              }
              n = n.next;
            } while (n !== t);
          }
        }
        function Tc(e, t, n) {
          switch (n.tag) {
            case 0:
            case 11:
            case 15:
            case 22:
              return void xl(3, n);
            case 1:
              if (e = n.stateNode, 4 & n.effectTag) if (t === null) e.componentDidMount();
              else {
                var r = n.elementType === n.type ? t.memoizedProps : Vn(n.type, t.memoizedProps);
                e.componentDidUpdate(r, t.memoizedState, e.__reactInternalSnapshotBeforeUpdate);
              }
              return void ((t = n.updateQueue) !== null && Ys(n, t, e));
            case 3:
              if ((t = n.updateQueue) !== null) {
                if (e = null, n.child !== null) switch (n.child.tag) {
                  case 5:
                    e = n.child.stateNode;
                    break;
                  case 1:
                    e = n.child.stateNode;
                }
                Ys(n, t, e);
              }
              return;
            case 5:
              return e = n.stateNode, void (t === null && 4 & n.effectTag && Pi(n.type, n.memoizedProps) && e.focus());
            case 6:
            case 4:
            case 12:
              return;
            case 13:
              return void (n.memoizedState === null && (n = n.alternate, n !== null && (n = n.memoizedState, n !== null && (n = n.dehydrated, n !== null && pr(n)))));
            case 19:
            case 17:
            case 20:
            case 21:
              return;
          }
          throw Error(m(163));
        }
        function Sl(e, t, n) {
          switch (typeof gs == "function" && gs(t), t.tag) {
            case 0:
            case 11:
            case 14:
            case 15:
            case 22:
              if ((e = t.updateQueue) !== null && (e = e.lastEffect) !== null) {
                var r = e.next;
                Br(97 < n ? 97 : n, function() {
                  var i = r;
                  do {
                    var d = i.destroy;
                    if (d !== void 0) {
                      var v = t;
                      try {
                        d();
                      } catch (x) {
                        yo(v, x);
                      }
                    }
                    i = i.next;
                  } while (i !== r);
                });
              }
              break;
            case 1:
              El(t), typeof (n = t.stateNode).componentWillUnmount == "function" && function(i, d) {
                try {
                  d.props = i.memoizedProps, d.state = i.memoizedState, d.componentWillUnmount();
                } catch (v) {
                  yo(i, v);
                }
              }(t, n);
              break;
            case 5:
              El(t);
              break;
            case 4:
              Nl(e, t, n);
          }
        }
        function Cl(e) {
          var t = e.alternate;
          e.return = null, e.child = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.alternate = null, e.firstEffect = null, e.lastEffect = null, e.pendingProps = null, e.memoizedProps = null, e.stateNode = null, t !== null && Cl(t);
        }
        function Tl(e) {
          return e.tag === 5 || e.tag === 3 || e.tag === 4;
        }
        function Ol(e) {
          e: {
            for (var t = e.return; t !== null; ) {
              if (Tl(t)) {
                var n = t;
                break e;
              }
              t = t.return;
            }
            throw Error(m(160));
          }
          switch (t = n.stateNode, n.tag) {
            case 5:
              var r = !1;
              break;
            case 3:
            case 4:
              t = t.containerInfo, r = !0;
              break;
            default:
              throw Error(m(161));
          }
          16 & n.effectTag && (st(t, ""), n.effectTag &= -17);
          e: t: for (n = e; ; ) {
            for (; n.sibling === null; ) {
              if (n.return === null || Tl(n.return)) {
                n = null;
                break e;
              }
              n = n.return;
            }
            for (n.sibling.return = n.return, n = n.sibling; n.tag !== 5 && n.tag !== 6 && n.tag !== 18; ) {
              if (2 & n.effectTag || n.child === null || n.tag === 4) continue t;
              n.child.return = n, n = n.child;
            }
            if (!(2 & n.effectTag)) {
              n = n.stateNode;
              break e;
            }
          }
          r ? function i(d, v, x) {
            var X = d.tag, q = X === 5 || X === 6;
            if (q) d = q ? d.stateNode : d.stateNode.instance, v ? x.nodeType === 8 ? x.parentNode.insertBefore(d, v) : x.insertBefore(d, v) : (x.nodeType === 8 ? (v = x.parentNode).insertBefore(d, x) : (v = x).appendChild(d), (x = x._reactRootContainer) !== null && x !== void 0 || v.onclick !== null || (v.onclick = Oo));
            else if (X !== 4 && (d = d.child) !== null) for (i(d, v, x), d = d.sibling; d !== null; ) i(d, v, x), d = d.sibling;
          }(e, n, t) : function i(d, v, x) {
            var X = d.tag, q = X === 5 || X === 6;
            if (q) d = q ? d.stateNode : d.stateNode.instance, v ? x.insertBefore(d, v) : x.appendChild(d);
            else if (X !== 4 && (d = d.child) !== null) for (i(d, v, x), d = d.sibling; d !== null; ) i(d, v, x), d = d.sibling;
          }(e, n, t);
        }
        function Nl(e, t, n) {
          for (var r, i, d = t, v = !1; ; ) {
            if (!v) {
              v = d.return;
              e: for (; ; ) {
                if (v === null) throw Error(m(160));
                switch (r = v.stateNode, v.tag) {
                  case 5:
                    i = !1;
                    break e;
                  case 3:
                  case 4:
                    r = r.containerInfo, i = !0;
                    break e;
                }
                v = v.return;
              }
              v = !0;
            }
            if (d.tag === 5 || d.tag === 6) {
              e: for (var x = e, X = d, q = n, ge = X; ; ) if (Sl(x, ge, q), ge.child !== null && ge.tag !== 4) ge.child.return = ge, ge = ge.child;
              else {
                if (ge === X) break e;
                for (; ge.sibling === null; ) {
                  if (ge.return === null || ge.return === X) break e;
                  ge = ge.return;
                }
                ge.sibling.return = ge.return, ge = ge.sibling;
              }
              i ? (x = r, X = d.stateNode, x.nodeType === 8 ? x.parentNode.removeChild(X) : x.removeChild(X)) : r.removeChild(d.stateNode);
            } else if (d.tag === 4) {
              if (d.child !== null) {
                r = d.stateNode.containerInfo, i = !0, d.child.return = d, d = d.child;
                continue;
              }
            } else if (Sl(e, d, n), d.child !== null) {
              d.child.return = d, d = d.child;
              continue;
            }
            if (d === t) break;
            for (; d.sibling === null; ) {
              if (d.return === null || d.return === t) return;
              (d = d.return).tag === 4 && (v = !1);
            }
            d.sibling.return = d.return, d = d.sibling;
          }
        }
        function cs(e, t) {
          switch (t.tag) {
            case 0:
            case 11:
            case 14:
            case 15:
            case 22:
              return void _l(3, t);
            case 1:
              return;
            case 5:
              var n = t.stateNode;
              if (n != null) {
                var r = t.memoizedProps, i = e !== null ? e.memoizedProps : r;
                e = t.type;
                var d = t.updateQueue;
                if (t.updateQueue = null, d !== null) {
                  for (n[no] = r, e === "input" && r.type === "radio" && r.name != null && Tr(n, r), Qo(e, i), t = Qo(e, r), i = 0; i < d.length; i += 2) {
                    var v = d[i], x = d[i + 1];
                    v === "style" ? xi(n, x) : v === "dangerouslySetInnerHTML" ? qe(n, x) : v === "children" ? st(n, x) : je(n, v, x, t);
                  }
                  switch (e) {
                    case "input":
                      ir(n, r);
                      break;
                    case "textarea":
                      Gr(n, r);
                      break;
                    case "select":
                      t = n._wrapperState.wasMultiple, n._wrapperState.wasMultiple = !!r.multiple, (e = r.value) != null ? Tn(n, !!r.multiple, e, !1) : t !== !!r.multiple && (r.defaultValue != null ? Tn(n, !!r.multiple, r.defaultValue, !0) : Tn(n, !!r.multiple, r.multiple ? [] : "", !1));
                  }
                }
              }
              return;
            case 6:
              if (t.stateNode === null) throw Error(m(162));
              return void (t.stateNode.nodeValue = t.memoizedProps);
            case 3:
              return void ((t = t.stateNode).hydrate && (t.hydrate = !1, pr(t.containerInfo)));
            case 12:
              return;
            case 13:
              if (n = t, t.memoizedState === null ? r = !1 : (r = !0, n = t.child, us = jn()), n !== null) e: for (e = n; ; ) {
                if (e.tag === 5) d = e.stateNode, r ? typeof (d = d.style).setProperty == "function" ? d.setProperty("display", "none", "important") : d.display = "none" : (d = e.stateNode, i = (i = e.memoizedProps.style) != null && i.hasOwnProperty("display") ? i.display : null, d.style.display = _i("display", i));
                else if (e.tag === 6) e.stateNode.nodeValue = r ? "" : e.memoizedProps;
                else {
                  if (e.tag === 13 && e.memoizedState !== null && e.memoizedState.dehydrated === null) {
                    (d = e.child.sibling).return = e, e = d;
                    continue;
                  }
                  if (e.child !== null) {
                    e.child.return = e, e = e.child;
                    continue;
                  }
                }
                if (e === n) break;
                for (; e.sibling === null; ) {
                  if (e.return === null || e.return === n) break e;
                  e = e.return;
                }
                e.sibling.return = e.return, e = e.sibling;
              }
              return void Pl(t);
            case 19:
              return void Pl(t);
            case 17:
              return;
          }
          throw Error(m(163));
        }
        function Pl(e) {
          var t = e.updateQueue;
          if (t !== null) {
            e.updateQueue = null;
            var n = e.stateNode;
            n === null && (n = e.stateNode = new Sc()), t.forEach(function(r) {
              var i = jc.bind(null, e, r);
              n.has(r) || (n.add(r), r.then(i, i));
            });
          }
        }
        var Oc = typeof WeakMap == "function" ? WeakMap : Map;
        function Dl(e, t, n) {
          (n = Hr(n, null)).tag = 3, n.payload = { element: null };
          var r = t.value;
          return n.callback = function() {
            ha || (ha = !0, fs = r), ls(e, t);
          }, n;
        }
        function Rl(e, t, n) {
          (n = Hr(n, null)).tag = 3;
          var r = e.type.getDerivedStateFromError;
          if (typeof r == "function") {
            var i = t.value;
            n.payload = function() {
              return ls(e, t), r(i);
            };
          }
          var d = e.stateNode;
          return d !== null && typeof d.componentDidCatch == "function" && (n.callback = function() {
            typeof r != "function" && (qr === null ? qr = /* @__PURE__ */ new Set([this]) : qr.add(this), ls(e, t));
            var v = t.stack;
            this.componentDidCatch(t.value, { componentStack: v !== null ? v : "" });
          }), n;
        }
        var Ml, Nc = Math.ceil, la = he.ReactCurrentDispatcher, Al = he.ReactCurrentOwner, po = 0, ca = 3, ua = 4, Qe = 0, _n = null, Ge = null, mn = 0, Ft = po, fa = null, wr = 1073741823, di = 1073741823, da = null, pi = 0, pa = !1, us = 0, Ae = null, ha = !1, fs = null, qr = null, ma = !1, hi = null, mi = 90, ho = null, gi = 0, ds = null, ga = 0;
        function tr() {
          return 48 & Qe ? 1073741821 - (jn() / 10 | 0) : ga !== 0 ? ga : ga = 1073741821 - (jn() / 10 | 0);
        }
        function mo(e, t, n) {
          if (!(2 & (t = t.mode))) return 1073741823;
          var r = Hi();
          if (!(4 & t)) return r === 99 ? 1073741823 : 1073741822;
          if (16 & Qe) return mn;
          if (n !== null) e = Vi(e, 0 | n.timeoutMs || 5e3, 250);
          else switch (r) {
            case 99:
              e = 1073741823;
              break;
            case 98:
              e = Vi(e, 150, 100);
              break;
            case 97:
            case 96:
              e = Vi(e, 5e3, 250);
              break;
            case 95:
              e = 2;
              break;
            default:
              throw Error(m(326));
          }
          return _n !== null && e === mn && --e, e;
        }
        function Kr(e, t) {
          if (50 < gi) throw gi = 0, ds = null, Error(m(185));
          if ((e = ba(e, t)) !== null) {
            var n = Hi();
            t === 1073741823 ? 8 & Qe && !(48 & Qe) ? ps(e) : (xn(e), Qe === 0 && Zn()) : xn(e), !(4 & Qe) || n !== 98 && n !== 99 || (ho === null ? ho = /* @__PURE__ */ new Map([[e, t]]) : ((n = ho.get(e)) === void 0 || n > t) && ho.set(e, t));
          }
        }
        function ba(e, t) {
          e.expirationTime < t && (e.expirationTime = t);
          var n = e.alternate;
          n !== null && n.expirationTime < t && (n.expirationTime = t);
          var r = e.return, i = null;
          if (r === null && e.tag === 3) i = e.stateNode;
          else for (; r !== null; ) {
            if (n = r.alternate, r.childExpirationTime < t && (r.childExpirationTime = t), n !== null && n.childExpirationTime < t && (n.childExpirationTime = t), r.return === null && r.tag === 3) {
              i = r.stateNode;
              break;
            }
            r = r.return;
          }
          return i !== null && (_n === i && (va(t), Ft === ua && wo(i, mn)), $l(i, t)), i;
        }
        function ya(e) {
          var t = e.lastExpiredTime;
          if (t !== 0 || !Vl(e, t = e.firstPendingTime)) return t;
          var n = e.lastPingedTime;
          return 2 >= (e = n > (e = e.nextKnownPendingLevel) ? n : e) && t !== e ? 0 : e;
        }
        function xn(e) {
          if (e.lastExpiredTime !== 0) e.callbackExpirationTime = 1073741823, e.callbackPriority = 99, e.callbackNode = Ws(ps.bind(null, e));
          else {
            var t = ya(e), n = e.callbackNode;
            if (t === 0) n !== null && (e.callbackNode = null, e.callbackExpirationTime = 0, e.callbackPriority = 90);
            else {
              var r = tr();
              if (t === 1073741823 ? r = 99 : t === 1 || t === 2 ? r = 95 : r = 0 >= (r = 10 * (1073741821 - t) - 10 * (1073741821 - r)) ? 99 : 250 >= r ? 98 : 5250 >= r ? 97 : 95, n !== null) {
                var i = e.callbackPriority;
                if (e.callbackExpirationTime === t && i >= r) return;
                n !== Ls && Rs(n);
              }
              e.callbackExpirationTime = t, e.callbackPriority = r, t = t === 1073741823 ? Ws(ps.bind(null, e)) : Bs(r, Il.bind(null, e), { timeout: 10 * (1073741821 - t) - jn() }), e.callbackNode = t;
            }
          }
        }
        function Il(e, t) {
          if (ga = 0, t) return ws(e, t = tr()), xn(e), null;
          var n = ya(e);
          if (n !== 0) {
            if (t = e.callbackNode, (48 & Qe) != 0) throw Error(m(327));
            if (Vo(), e === _n && n === mn || go(e, n), Ge !== null) {
              var r = Qe;
              Qe |= 16;
              for (var i = Ul(); ; ) try {
                Dc();
                break;
              } catch (x) {
                Ll(e, x);
              }
              if (La(), Qe = r, la.current = i, Ft === 1) throw t = fa, go(e, n), wo(e, n), xn(e), t;
              if (Ge === null) switch (i = e.finishedWork = e.current.alternate, e.finishedExpirationTime = n, r = Ft, _n = null, r) {
                case po:
                case 1:
                  throw Error(m(345));
                case 2:
                  ws(e, 2 < n ? 2 : n);
                  break;
                case ca:
                  if (wo(e, n), n === (r = e.lastSuspendedTime) && (e.nextKnownPendingLevel = hs(i)), wr === 1073741823 && 10 < (i = us + 500 - jn())) {
                    if (pa) {
                      var d = e.lastPingedTime;
                      if (d === 0 || d >= n) {
                        e.lastPingedTime = n, go(e, n);
                        break;
                      }
                    }
                    if ((d = ya(e)) !== 0 && d !== n) break;
                    if (r !== 0 && r !== n) {
                      e.lastPingedTime = r;
                      break;
                    }
                    e.timeoutHandle = ti(bo.bind(null, e), i);
                    break;
                  }
                  bo(e);
                  break;
                case ua:
                  if (wo(e, n), n === (r = e.lastSuspendedTime) && (e.nextKnownPendingLevel = hs(i)), pa && ((i = e.lastPingedTime) === 0 || i >= n)) {
                    e.lastPingedTime = n, go(e, n);
                    break;
                  }
                  if ((i = ya(e)) !== 0 && i !== n) break;
                  if (r !== 0 && r !== n) {
                    e.lastPingedTime = r;
                    break;
                  }
                  if (di !== 1073741823 ? r = 10 * (1073741821 - di) - jn() : wr === 1073741823 ? r = 0 : (r = 10 * (1073741821 - wr) - 5e3, 0 > (r = (i = jn()) - r) && (r = 0), (n = 10 * (1073741821 - n) - i) < (r = (120 > r ? 120 : 480 > r ? 480 : 1080 > r ? 1080 : 1920 > r ? 1920 : 3e3 > r ? 3e3 : 4320 > r ? 4320 : 1960 * Nc(r / 1960)) - r) && (r = n)), 10 < r) {
                    e.timeoutHandle = ti(bo.bind(null, e), r);
                    break;
                  }
                  bo(e);
                  break;
                case 5:
                  if (wr !== 1073741823 && da !== null) {
                    d = wr;
                    var v = da;
                    if (0 >= (r = 0 | v.busyMinDurationMs) ? r = 0 : (i = 0 | v.busyDelayMs, r = (d = jn() - (10 * (1073741821 - d) - (0 | v.timeoutMs || 5e3))) <= i ? 0 : i + r - d), 10 < r) {
                      wo(e, n), e.timeoutHandle = ti(bo.bind(null, e), r);
                      break;
                    }
                  }
                  bo(e);
                  break;
                default:
                  throw Error(m(329));
              }
              if (xn(e), e.callbackNode === t) return Il.bind(null, e);
            }
          }
          return null;
        }
        function ps(e) {
          var t = e.lastExpiredTime;
          if (t = t !== 0 ? t : 1073741823, (48 & Qe) != 0) throw Error(m(327));
          if (Vo(), e === _n && t === mn || go(e, t), Ge !== null) {
            var n = Qe;
            Qe |= 16;
            for (var r = Ul(); ; ) try {
              Pc();
              break;
            } catch (i) {
              Ll(e, i);
            }
            if (La(), Qe = n, la.current = r, Ft === 1) throw n = fa, go(e, t), wo(e, t), xn(e), n;
            if (Ge !== null) throw Error(m(261));
            e.finishedWork = e.current.alternate, e.finishedExpirationTime = t, _n = null, bo(e), xn(e);
          }
          return null;
        }
        function jl(e, t) {
          var n = Qe;
          Qe |= 1;
          try {
            return e(t);
          } finally {
            (Qe = n) === 0 && Zn();
          }
        }
        function zl(e, t) {
          var n = Qe;
          Qe &= -2, Qe |= 8;
          try {
            return e(t);
          } finally {
            (Qe = n) === 0 && Zn();
          }
        }
        function go(e, t) {
          e.finishedWork = null, e.finishedExpirationTime = 0;
          var n = e.timeoutHandle;
          if (n !== -1 && (e.timeoutHandle = -1, Di(n)), Ge !== null) for (n = Ge.return; n !== null; ) {
            var r = n;
            switch (r.tag) {
              case 1:
                (r = r.type.childContextTypes) != null && Ui();
                break;
              case 3:
                Bo(), vt(pn), vt(Xt);
                break;
              case 5:
                $a(r);
                break;
              case 4:
                Bo();
                break;
              case 13:
              case 19:
                vt(Ct);
                break;
              case 10:
                Ua(r);
            }
            n = n.return;
          }
          _n = e, Ge = vo(e.current, null), mn = t, Ft = po, fa = null, di = wr = 1073741823, da = null, pi = 0, pa = !1;
        }
        function Ll(e, t) {
          for (; ; ) {
            try {
              if (La(), Ji.current = ia, ea) for (var n = Lt.memoizedState; n !== null; ) {
                var r = n.queue;
                r !== null && (r.pending = null), n = n.next;
              }
              if ($r = 0, Zt = sn = Lt = null, ea = !1, Ge === null || Ge.return === null) return Ft = 1, fa = t, Ge = null;
              e: {
                var i = e, d = Ge.return, v = Ge, x = t;
                if (t = mn, v.effectTag |= 2048, v.firstEffect = v.lastEffect = null, x !== null && typeof x == "object" && typeof x.then == "function") {
                  var X = x;
                  if (!(2 & v.mode)) {
                    var q = v.alternate;
                    q ? (v.updateQueue = q.updateQueue, v.memoizedState = q.memoizedState, v.expirationTime = q.expirationTime) : (v.updateQueue = null, v.memoizedState = null);
                  }
                  var ge = (1 & Ct.current) != 0, De = d;
                  do {
                    var He;
                    if (He = De.tag === 13) {
                      var ot = De.memoizedState;
                      if (ot !== null) He = ot.dehydrated !== null;
                      else {
                        var Fn = De.memoizedProps;
                        He = Fn.fallback !== void 0 && (Fn.unstable_avoidThisFallback !== !0 || !ge);
                      }
                    }
                    if (He) {
                      var ln = De.updateQueue;
                      if (ln === null) {
                        var re = /* @__PURE__ */ new Set();
                        re.add(X), De.updateQueue = re;
                      } else ln.add(X);
                      if (!(2 & De.mode)) {
                        if (De.effectTag |= 64, v.effectTag &= -2981, v.tag === 1) if (v.alternate === null) v.tag = 17;
                        else {
                          var ee = Hr(1073741823, null);
                          ee.tag = 2, Vr(v, ee);
                        }
                        v.expirationTime = 1073741823;
                        break e;
                      }
                      x = void 0, v = t;
                      var ue = i.pingCache;
                      if (ue === null ? (ue = i.pingCache = new Oc(), x = /* @__PURE__ */ new Set(), ue.set(X, x)) : (x = ue.get(X)) === void 0 && (x = /* @__PURE__ */ new Set(), ue.set(X, x)), !x.has(v)) {
                        x.add(v);
                        var ve = Ic.bind(null, i, X, v);
                        X.then(ve, ve);
                      }
                      De.effectTag |= 4096, De.expirationTime = t;
                      break e;
                    }
                    De = De.return;
                  } while (De !== null);
                  x = Error((Yt(v.type) || "A React component") + ` suspended while rendering, but no fallback UI was specified.

Add a <Suspense fallback=...> component higher in the tree to provide a loading indicator or placeholder to display.` + xr(v));
                }
                Ft !== 5 && (Ft = 2), x = ss(x, v), De = d;
                do {
                  switch (De.tag) {
                    case 3:
                      X = x, De.effectTag |= 4096, De.expirationTime = t, $s(De, Dl(De, X, t));
                      break e;
                    case 1:
                      X = x;
                      var _e = De.type, Te = De.stateNode;
                      if (!(64 & De.effectTag) && (typeof _e.getDerivedStateFromError == "function" || Te !== null && typeof Te.componentDidCatch == "function" && (qr === null || !qr.has(Te)))) {
                        De.effectTag |= 4096, De.expirationTime = t, $s(De, Rl(De, X, t));
                        break e;
                      }
                  }
                  De = De.return;
                } while (De !== null);
              }
              Ge = Wl(Ge);
            } catch (Be) {
              t = Be;
              continue;
            }
            break;
          }
        }
        function Ul() {
          var e = la.current;
          return la.current = ia, e === null ? ia : e;
        }
        function Fl(e, t) {
          e < wr && 2 < e && (wr = e), t !== null && e < di && 2 < e && (di = e, da = t);
        }
        function va(e) {
          e > pi && (pi = e);
        }
        function Pc() {
          for (; Ge !== null; ) Ge = Bl(Ge);
        }
        function Dc() {
          for (; Ge !== null && !bc(); ) Ge = Bl(Ge);
        }
        function Bl(e) {
          var t = Ml(e.alternate, e, mn);
          return e.memoizedProps = e.pendingProps, t === null && (t = Wl(e)), Al.current = null, t;
        }
        function Wl(e) {
          Ge = e;
          do {
            var t = Ge.alternate;
            if (e = Ge.return, (2048 & Ge.effectTag) == 0) {
              if (t = _c(t, Ge, mn), mn === 1 || Ge.childExpirationTime !== 1) {
                for (var n = 0, r = Ge.child; r !== null; ) {
                  var i = r.expirationTime, d = r.childExpirationTime;
                  i > n && (n = i), d > n && (n = d), r = r.sibling;
                }
                Ge.childExpirationTime = n;
              }
              if (t !== null) return t;
              e !== null && !(2048 & e.effectTag) && (e.firstEffect === null && (e.firstEffect = Ge.firstEffect), Ge.lastEffect !== null && (e.lastEffect !== null && (e.lastEffect.nextEffect = Ge.firstEffect), e.lastEffect = Ge.lastEffect), 1 < Ge.effectTag && (e.lastEffect !== null ? e.lastEffect.nextEffect = Ge : e.firstEffect = Ge, e.lastEffect = Ge));
            } else {
              if ((t = xc(Ge)) !== null) return t.effectTag &= 2047, t;
              e !== null && (e.firstEffect = e.lastEffect = null, e.effectTag |= 2048);
            }
            if ((t = Ge.sibling) !== null) return t;
            Ge = e;
          } while (Ge !== null);
          return Ft === po && (Ft = 5), null;
        }
        function hs(e) {
          var t = e.expirationTime;
          return t > (e = e.childExpirationTime) ? t : e;
        }
        function bo(e) {
          var t = Hi();
          return Br(99, Rc.bind(null, e, t)), null;
        }
        function Rc(e, t) {
          do
            Vo();
          while (hi !== null);
          if (48 & Qe) throw Error(m(327));
          var n = e.finishedWork, r = e.finishedExpirationTime;
          if (n === null) return null;
          if (e.finishedWork = null, e.finishedExpirationTime = 0, n === e.current) throw Error(m(177));
          e.callbackNode = null, e.callbackExpirationTime = 0, e.callbackPriority = 90, e.nextKnownPendingLevel = 0;
          var i = hs(n);
          if (e.firstPendingTime = i, r <= e.lastSuspendedTime ? e.firstSuspendedTime = e.lastSuspendedTime = e.nextKnownPendingLevel = 0 : r <= e.firstSuspendedTime && (e.firstSuspendedTime = r - 1), r <= e.lastPingedTime && (e.lastPingedTime = 0), r <= e.lastExpiredTime && (e.lastExpiredTime = 0), e === _n && (Ge = _n = null, mn = 0), 1 < n.effectTag ? n.lastEffect !== null ? (n.lastEffect.nextEffect = n, i = n.firstEffect) : i = n : i = n.firstEffect, i !== null) {
            var d = Qe;
            Qe |= 32, Al.current = null, Zo = Co;
            var v = Ni();
            if (Xo(v)) {
              if ("selectionStart" in v) var x = { start: v.selectionStart, end: v.selectionEnd };
              else e: {
                var X = (x = (x = v.ownerDocument) && x.defaultView || window).getSelection && x.getSelection();
                if (X && X.rangeCount !== 0) {
                  x = X.anchorNode;
                  var q = X.anchorOffset, ge = X.focusNode;
                  X = X.focusOffset;
                  try {
                    x.nodeType, ge.nodeType;
                  } catch {
                    x = null;
                    break e;
                  }
                  var De = 0, He = -1, ot = -1, Fn = 0, ln = 0, re = v, ee = null;
                  t: for (; ; ) {
                    for (var ue; re !== x || q !== 0 && re.nodeType !== 3 || (He = De + q), re !== ge || X !== 0 && re.nodeType !== 3 || (ot = De + X), re.nodeType === 3 && (De += re.nodeValue.length), (ue = re.firstChild) !== null; ) ee = re, re = ue;
                    for (; ; ) {
                      if (re === v) break t;
                      if (ee === x && ++Fn === q && (He = De), ee === ge && ++ln === X && (ot = De), (ue = re.nextSibling) !== null) break;
                      ee = (re = ee).parentNode;
                    }
                    re = ue;
                  }
                  x = He === -1 || ot === -1 ? null : { start: He, end: ot };
                } else x = null;
              }
              x = x || { start: 0, end: 0 };
            } else x = null;
            Jo = { activeElementDetached: null, focusedElem: v, selectionRange: x }, Co = !1, Ae = i;
            do
              try {
                Mc();
              } catch (Ze) {
                if (Ae === null) throw Error(m(330));
                yo(Ae, Ze), Ae = Ae.nextEffect;
              }
            while (Ae !== null);
            Ae = i;
            do
              try {
                for (v = e, x = t; Ae !== null; ) {
                  var ve = Ae.effectTag;
                  if (16 & ve && st(Ae.stateNode, ""), 128 & ve) {
                    var _e = Ae.alternate;
                    if (_e !== null) {
                      var Te = _e.ref;
                      Te !== null && (typeof Te == "function" ? Te(null) : Te.current = null);
                    }
                  }
                  switch (1038 & ve) {
                    case 2:
                      Ol(Ae), Ae.effectTag &= -3;
                      break;
                    case 6:
                      Ol(Ae), Ae.effectTag &= -3, cs(Ae.alternate, Ae);
                      break;
                    case 1024:
                      Ae.effectTag &= -1025;
                      break;
                    case 1028:
                      Ae.effectTag &= -1025, cs(Ae.alternate, Ae);
                      break;
                    case 4:
                      cs(Ae.alternate, Ae);
                      break;
                    case 8:
                      Nl(v, q = Ae, x), Cl(q);
                  }
                  Ae = Ae.nextEffect;
                }
              } catch (Ze) {
                if (Ae === null) throw Error(m(330));
                yo(Ae, Ze), Ae = Ae.nextEffect;
              }
            while (Ae !== null);
            if (Te = Jo, _e = Ni(), ve = Te.focusedElem, x = Te.selectionRange, _e !== ve && ve && ve.ownerDocument && function Ze(Bt, kr) {
              return !(!Bt || !kr) && (Bt === kr || (!Bt || Bt.nodeType !== 3) && (kr && kr.nodeType === 3 ? Ze(Bt, kr.parentNode) : "contains" in Bt ? Bt.contains(kr) : !!Bt.compareDocumentPosition && !!(16 & Bt.compareDocumentPosition(kr))));
            }(ve.ownerDocument.documentElement, ve)) {
              for (x !== null && Xo(ve) && (_e = x.start, (Te = x.end) === void 0 && (Te = _e), "selectionStart" in ve ? (ve.selectionStart = _e, ve.selectionEnd = Math.min(Te, ve.value.length)) : (Te = (_e = ve.ownerDocument || document) && _e.defaultView || window).getSelection && (Te = Te.getSelection(), q = ve.textContent.length, v = Math.min(x.start, q), x = x.end === void 0 ? v : Math.min(x.end, q), !Te.extend && v > x && (q = x, x = v, v = q), q = Oi(ve, v), ge = Oi(ve, x), q && ge && (Te.rangeCount !== 1 || Te.anchorNode !== q.node || Te.anchorOffset !== q.offset || Te.focusNode !== ge.node || Te.focusOffset !== ge.offset) && ((_e = _e.createRange()).setStart(q.node, q.offset), Te.removeAllRanges(), v > x ? (Te.addRange(_e), Te.extend(ge.node, ge.offset)) : (_e.setEnd(ge.node, ge.offset), Te.addRange(_e))))), _e = [], Te = ve; Te = Te.parentNode; ) Te.nodeType === 1 && _e.push({ element: Te, left: Te.scrollLeft, top: Te.scrollTop });
              for (typeof ve.focus == "function" && ve.focus(), ve = 0; ve < _e.length; ve++) (Te = _e[ve]).element.scrollLeft = Te.left, Te.element.scrollTop = Te.top;
            }
            Co = !!Zo, Jo = Zo = null, e.current = n, Ae = i;
            do
              try {
                for (ve = e; Ae !== null; ) {
                  var Be = Ae.effectTag;
                  if (36 & Be && Tc(ve, Ae.alternate, Ae), 128 & Be) {
                    _e = void 0;
                    var at = Ae.ref;
                    if (at !== null) {
                      var Rt = Ae.stateNode;
                      switch (Ae.tag) {
                        case 5:
                          _e = Rt;
                          break;
                        default:
                          _e = Rt;
                      }
                      typeof at == "function" ? at(_e) : at.current = _e;
                    }
                  }
                  Ae = Ae.nextEffect;
                }
              } catch (Ze) {
                if (Ae === null) throw Error(m(330));
                yo(Ae, Ze), Ae = Ae.nextEffect;
              }
            while (Ae !== null);
            Ae = null, yc(), Qe = d;
          } else e.current = n;
          if (ma) ma = !1, hi = e, mi = t;
          else for (Ae = i; Ae !== null; ) t = Ae.nextEffect, Ae.nextEffect = null, Ae = t;
          if ((t = e.firstPendingTime) === 0 && (qr = null), t === 1073741823 ? e === ds ? gi++ : (gi = 0, ds = e) : gi = 0, typeof ms == "function" && ms(n.stateNode, r), xn(e), ha) throw ha = !1, e = fs, fs = null, e;
          return 8 & Qe || Zn(), null;
        }
        function Mc() {
          for (; Ae !== null; ) {
            var e = Ae.effectTag;
            256 & e && Cc(Ae.alternate, Ae), !(512 & e) || ma || (ma = !0, Bs(97, function() {
              return Vo(), null;
            })), Ae = Ae.nextEffect;
          }
        }
        function Vo() {
          if (mi !== 90) {
            var e = 97 < mi ? 97 : mi;
            return mi = 90, Br(e, Ac);
          }
        }
        function Ac() {
          if (hi === null) return !1;
          var e = hi;
          if (hi = null, (48 & Qe) != 0) throw Error(m(331));
          var t = Qe;
          for (Qe |= 32, e = e.current.firstEffect; e !== null; ) {
            try {
              var n = e;
              if (512 & n.effectTag) switch (n.tag) {
                case 0:
                case 11:
                case 15:
                case 22:
                  _l(5, n), xl(5, n);
              }
            } catch (r) {
              if (e === null) throw Error(m(330));
              yo(e, r);
            }
            n = e.nextEffect, e.nextEffect = null, e = n;
          }
          return Qe = t, Zn(), !0;
        }
        function Hl(e, t, n) {
          Vr(e, t = Dl(e, t = ss(n, t), 1073741823)), (e = ba(e, 1073741823)) !== null && xn(e);
        }
        function yo(e, t) {
          if (e.tag === 3) Hl(e, e, t);
          else for (var n = e.return; n !== null; ) {
            if (n.tag === 3) {
              Hl(n, e, t);
              break;
            }
            if (n.tag === 1) {
              var r = n.stateNode;
              if (typeof n.type.getDerivedStateFromError == "function" || typeof r.componentDidCatch == "function" && (qr === null || !qr.has(r))) {
                Vr(n, e = Rl(n, e = ss(t, e), 1073741823)), (n = ba(n, 1073741823)) !== null && xn(n);
                break;
              }
            }
            n = n.return;
          }
        }
        function Ic(e, t, n) {
          var r = e.pingCache;
          r !== null && r.delete(t), _n === e && mn === n ? Ft === ua || Ft === ca && wr === 1073741823 && jn() - us < 500 ? go(e, mn) : pa = !0 : Vl(e, n) && ((t = e.lastPingedTime) !== 0 && t < n || (e.lastPingedTime = n, xn(e)));
        }
        function jc(e, t) {
          var n = e.stateNode;
          n !== null && n.delete(t), (t = 0) == 0 && (t = mo(t = tr(), e, null)), (e = ba(e, t)) !== null && xn(e);
        }
        Ml = function(e, t, n) {
          var r = t.expirationTime;
          if (e !== null) {
            var i = t.pendingProps;
            if (e.memoizedProps !== i || pn.current) er = !0;
            else {
              if (r < n) {
                switch (er = !1, t.tag) {
                  case 3:
                    ml(t), ns();
                    break;
                  case 5:
                    if (Zs(t), 4 & t.mode && n !== 1 && i.hidden) return t.expirationTime = t.childExpirationTime = 1, null;
                    break;
                  case 1:
                    hn(t.type) && Fi(t);
                    break;
                  case 4:
                    Va(t, t.stateNode.containerInfo);
                    break;
                  case 10:
                    r = t.memoizedProps.value, i = t.type._context, St($i, i._currentValue), i._currentValue = r;
                    break;
                  case 13:
                    if (t.memoizedState !== null) return (r = t.child.childExpirationTime) !== 0 && r >= n ? vl(e, t, n) : (St(Ct, 1 & Ct.current), (t = vr(e, t, n)) !== null ? t.sibling : null);
                    St(Ct, 1 & Ct.current);
                    break;
                  case 19:
                    if (r = t.childExpirationTime >= n, (64 & e.effectTag) != 0) {
                      if (r) return kl(e, t, n);
                      t.effectTag |= 64;
                    }
                    if ((i = t.memoizedState) !== null && (i.rendering = null, i.tail = null), St(Ct, Ct.current), !r) return null;
                }
                return vr(e, t, n);
              }
              er = !1;
            }
          } else er = !1;
          switch (t.expirationTime = 0, t.tag) {
            case 2:
              if (r = t.type, e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= 2), e = t.pendingProps, i = zo(t, Xt.current), Uo(t, n), i = Ka(null, t, r, e, i, n), t.effectTag |= 1, typeof i == "object" && i !== null && typeof i.render == "function" && i.$$typeof === void 0) {
                if (t.tag = 1, t.memoizedState = null, t.updateQueue = null, hn(r)) {
                  var d = !0;
                  Fi(t);
                } else d = !1;
                t.memoizedState = i.state !== null && i.state !== void 0 ? i.state : null, Fa(t);
                var v = r.getDerivedStateFromProps;
                typeof v == "function" && Ki(t, r, v, e), i.updater = Qi, t.stateNode = i, i._reactInternalFiber = t, Wa(t, r, e, n), t = os(null, t, r, !0, d, n);
              } else t.tag = 0, Un(null, t, i, n), t = t.child;
              return t;
            case 16:
              e: {
                if (i = t.elementType, e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= 2), e = t.pendingProps, function(ge) {
                  if (ge._status === -1) {
                    ge._status = 0;
                    var De = ge._ctor;
                    De = De(), ge._result = De, De.then(function(He) {
                      ge._status === 0 && (He = He.default, ge._status = 1, ge._result = He);
                    }, function(He) {
                      ge._status === 0 && (ge._status = 2, ge._result = He);
                    });
                  }
                }(i), i._status !== 1) throw i._result;
                switch (i = i._result, t.type = i, d = t.tag = function(ge) {
                  if (typeof ge == "function") return bs(ge) ? 1 : 0;
                  if (ge != null) {
                    if ((ge = ge.$$typeof) === Tt) return 11;
                    if (ge === Sn) return 14;
                  }
                  return 2;
                }(i), e = Vn(i, e), d) {
                  case 0:
                    t = rs(null, t, i, e, n);
                    break e;
                  case 1:
                    t = hl(null, t, i, e, n);
                    break e;
                  case 11:
                    t = ul(null, t, i, e, n);
                    break e;
                  case 14:
                    t = fl(null, t, i, Vn(i.type, e), r, n);
                    break e;
                }
                throw Error(m(306, i, ""));
              }
              return t;
            case 0:
              return r = t.type, i = t.pendingProps, rs(e, t, r, i = t.elementType === r ? i : Vn(r, i), n);
            case 1:
              return r = t.type, i = t.pendingProps, hl(e, t, r, i = t.elementType === r ? i : Vn(r, i), n);
            case 3:
              if (ml(t), r = t.updateQueue, e === null || r === null) throw Error(m(282));
              if (r = t.pendingProps, i = (i = t.memoizedState) !== null ? i.element : null, Ba(e, t), ai(t, r, null, n), (r = t.memoizedState.element) === i) ns(), t = vr(e, t, n);
              else {
                if ((i = t.stateNode.hydrate) && (Yr = Ar(t.stateNode.containerInfo.firstChild), yr = t, i = fo = !0), i) for (n = Ha(t, null, r, n), t.child = n; n; ) n.effectTag = -3 & n.effectTag | 1024, n = n.sibling;
                else Un(e, t, r, n), ns();
                t = t.child;
              }
              return t;
            case 5:
              return Zs(t), e === null && ts(t), r = t.type, i = t.pendingProps, d = e !== null ? e.memoizedProps : null, v = i.children, ei(r, i) ? v = null : d !== null && ei(r, d) && (t.effectTag |= 16), pl(e, t), 4 & t.mode && n !== 1 && i.hidden ? (t.expirationTime = t.childExpirationTime = 1, t = null) : (Un(e, t, v, n), t = t.child), t;
            case 6:
              return e === null && ts(t), null;
            case 13:
              return vl(e, t, n);
            case 4:
              return Va(t, t.stateNode.containerInfo), r = t.pendingProps, e === null ? t.child = Fo(t, null, r, n) : Un(e, t, r, n), t.child;
            case 11:
              return r = t.type, i = t.pendingProps, ul(e, t, r, i = t.elementType === r ? i : Vn(r, i), n);
            case 7:
              return Un(e, t, t.pendingProps, n), t.child;
            case 8:
            case 12:
              return Un(e, t, t.pendingProps.children, n), t.child;
            case 10:
              e: {
                r = t.type._context, i = t.pendingProps, v = t.memoizedProps, d = i.value;
                var x = t.type._context;
                if (St($i, x._currentValue), x._currentValue = d, v !== null) if (x = v.value, (d = mr(x, d) ? 0 : 0 | (typeof r._calculateChangedBits == "function" ? r._calculateChangedBits(x, d) : 1073741823)) === 0) {
                  if (v.children === i.children && !pn.current) {
                    t = vr(e, t, n);
                    break e;
                  }
                } else for ((x = t.child) !== null && (x.return = t); x !== null; ) {
                  var X = x.dependencies;
                  if (X !== null) {
                    v = x.child;
                    for (var q = X.firstContext; q !== null; ) {
                      if (q.context === r && q.observedBits & d) {
                        x.tag === 1 && ((q = Hr(n, null)).tag = 2, Vr(x, q)), x.expirationTime < n && (x.expirationTime = n), (q = x.alternate) !== null && q.expirationTime < n && (q.expirationTime = n), Vs(x.return, n), X.expirationTime < n && (X.expirationTime = n);
                        break;
                      }
                      q = q.next;
                    }
                  } else v = x.tag === 10 && x.type === t.type ? null : x.child;
                  if (v !== null) v.return = x;
                  else for (v = x; v !== null; ) {
                    if (v === t) {
                      v = null;
                      break;
                    }
                    if ((x = v.sibling) !== null) {
                      x.return = v.return, v = x;
                      break;
                    }
                    v = v.return;
                  }
                  x = v;
                }
                Un(e, t, i.children, n), t = t.child;
              }
              return t;
            case 9:
              return i = t.type, r = (d = t.pendingProps).children, Uo(t, n), r = r(i = zn(i, d.unstable_observedBits)), t.effectTag |= 1, Un(e, t, r, n), t.child;
            case 14:
              return d = Vn(i = t.type, t.pendingProps), fl(e, t, i, d = Vn(i.type, d), r, n);
            case 15:
              return dl(e, t, t.type, t.pendingProps, r, n);
            case 17:
              return r = t.type, i = t.pendingProps, i = t.elementType === r ? i : Vn(r, i), e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= 2), t.tag = 1, hn(r) ? (e = !0, Fi(t)) : e = !1, Uo(t, n), Qs(t, r, i), Wa(t, r, i, n), os(null, t, r, !0, e, n);
            case 19:
              return kl(e, t, n);
          }
          throw Error(m(156, t.tag));
        };
        var ms = null, gs = null;
        function zc(e, t, n, r) {
          this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = r, this.effectTag = 0, this.lastEffect = this.firstEffect = this.nextEffect = null, this.childExpirationTime = this.expirationTime = 0, this.alternate = null;
        }
        function nr(e, t, n, r) {
          return new zc(e, t, n, r);
        }
        function bs(e) {
          return !(!(e = e.prototype) || !e.isReactComponent);
        }
        function vo(e, t) {
          var n = e.alternate;
          return n === null ? ((n = nr(e.tag, t, e.key, e.mode)).elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.effectTag = 0, n.nextEffect = null, n.firstEffect = null, n.lastEffect = null), n.childExpirationTime = e.childExpirationTime, n.expirationTime = e.expirationTime, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : { expirationTime: t.expirationTime, firstContext: t.firstContext, responders: t.responders }, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n;
        }
        function wa(e, t, n, r, i, d) {
          var v = 2;
          if (r = e, typeof e == "function") bs(e) && (v = 1);
          else if (typeof e == "string") v = 5;
          else e: switch (e) {
            case wt:
              return Qr(n.children, i, d, t);
            case Er:
              v = 8, i |= 7;
              break;
            case Jt:
              v = 8, i |= 1;
              break;
            case kt:
              return (e = nr(12, n, t, 8 | i)).elementType = kt, e.type = kt, e.expirationTime = d, e;
            case pt:
              return (e = nr(13, n, t, i)).type = pt, e.elementType = pt, e.expirationTime = d, e;
            case $n:
              return (e = nr(19, n, t, i)).elementType = $n, e.expirationTime = d, e;
            default:
              if (typeof e == "object" && e !== null) switch (e.$$typeof) {
                case gt:
                  v = 10;
                  break e;
                case cn:
                  v = 9;
                  break e;
                case Tt:
                  v = 11;
                  break e;
                case Sn:
                  v = 14;
                  break e;
                case or:
                  v = 16, r = null;
                  break e;
                case _r:
                  v = 22;
                  break e;
              }
              throw Error(m(130, e == null ? e : typeof e, ""));
          }
          return (t = nr(v, n, t, i)).elementType = e, t.type = r, t.expirationTime = d, t;
        }
        function Qr(e, t, n, r) {
          return (e = nr(7, e, r, t)).expirationTime = n, e;
        }
        function ys(e, t, n) {
          return (e = nr(6, e, null, t)).expirationTime = n, e;
        }
        function vs(e, t, n) {
          return (t = nr(4, e.children !== null ? e.children : [], e.key, t)).expirationTime = n, t.stateNode = { containerInfo: e.containerInfo, pendingChildren: null, implementation: e.implementation }, t;
        }
        function Lc(e, t, n) {
          this.tag = t, this.current = null, this.containerInfo = e, this.pingCache = this.pendingChildren = null, this.finishedExpirationTime = 0, this.finishedWork = null, this.timeoutHandle = -1, this.pendingContext = this.context = null, this.hydrate = n, this.callbackNode = null, this.callbackPriority = 90, this.lastExpiredTime = this.lastPingedTime = this.nextKnownPendingLevel = this.lastSuspendedTime = this.firstSuspendedTime = this.firstPendingTime = 0;
        }
        function Vl(e, t) {
          var n = e.firstSuspendedTime;
          return e = e.lastSuspendedTime, n !== 0 && n >= t && e <= t;
        }
        function wo(e, t) {
          var n = e.firstSuspendedTime, r = e.lastSuspendedTime;
          n < t && (e.firstSuspendedTime = t), (r > t || n === 0) && (e.lastSuspendedTime = t), t <= e.lastPingedTime && (e.lastPingedTime = 0), t <= e.lastExpiredTime && (e.lastExpiredTime = 0);
        }
        function $l(e, t) {
          t > e.firstPendingTime && (e.firstPendingTime = t);
          var n = e.firstSuspendedTime;
          n !== 0 && (t >= n ? e.firstSuspendedTime = e.lastSuspendedTime = e.nextKnownPendingLevel = 0 : t >= e.lastSuspendedTime && (e.lastSuspendedTime = t + 1), t > e.nextKnownPendingLevel && (e.nextKnownPendingLevel = t));
        }
        function ws(e, t) {
          var n = e.lastExpiredTime;
          (n === 0 || n > t) && (e.lastExpiredTime = t);
        }
        function ka(e, t, n, r) {
          var i = t.current, d = tr(), v = si.suspense;
          d = mo(d, i, v);
          e: if (n) {
            t: {
              if (Pn(n = n._reactInternalFiber) !== n || n.tag !== 1) throw Error(m(170));
              var x = n;
              do {
                switch (x.tag) {
                  case 3:
                    x = x.stateNode.context;
                    break t;
                  case 1:
                    if (hn(x.type)) {
                      x = x.stateNode.__reactInternalMemoizedMergedChildContext;
                      break t;
                    }
                }
                x = x.return;
              } while (x !== null);
              throw Error(m(171));
            }
            if (n.tag === 1) {
              var X = n.type;
              if (hn(X)) {
                n = Ps(n, X, x);
                break e;
              }
            }
            n = x;
          } else n = Fr;
          return t.context === null ? t.context = n : t.pendingContext = n, (t = Hr(d, v)).payload = { element: e }, (r = r === void 0 ? null : r) !== null && (t.callback = r), Vr(i, t), Kr(i, d), d;
        }
        function ks(e) {
          if (!(e = e.current).child) return null;
          switch (e.child.tag) {
            case 5:
            default:
              return e.child.stateNode;
          }
        }
        function Yl(e, t) {
          (e = e.memoizedState) !== null && e.dehydrated !== null && e.retryTime < t && (e.retryTime = t);
        }
        function Es(e, t) {
          Yl(e, t), (e = e.alternate) && Yl(e, t);
        }
        function _s(e, t, n) {
          var r = new Lc(e, t, n = n != null && n.hydrate === !0), i = nr(3, null, null, t === 2 ? 7 : t === 1 ? 3 : 0);
          r.current = i, i.stateNode = r, Fa(i), e[ro] = r.current, n && t !== 0 && function(d, v) {
            var x = un(v);
            Bn.forEach(function(X) {
              yt(X, v, x);
            }), Pt.forEach(function(X) {
              yt(X, v, x);
            });
          }(0, e.nodeType === 9 ? e : e.ownerDocument), this._internalRoot = r;
        }
        function bi(e) {
          return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11 && (e.nodeType !== 8 || e.nodeValue !== " react-mount-point-unstable "));
        }
        function Ea(e, t, n, r, i) {
          var d = n._reactRootContainer;
          if (d) {
            var v = d._internalRoot;
            if (typeof i == "function") {
              var x = i;
              i = function() {
                var q = ks(v);
                x.call(q);
              };
            }
            ka(t, v, e, i);
          } else {
            if (d = n._reactRootContainer = function(q, ge) {
              if (ge || (ge = !(!(ge = q ? q.nodeType === 9 ? q.documentElement : q.firstChild : null) || ge.nodeType !== 1 || !ge.hasAttribute("data-reactroot"))), !ge) for (var De; De = q.lastChild; ) q.removeChild(De);
              return new _s(q, 0, ge ? { hydrate: !0 } : void 0);
            }(n, r), v = d._internalRoot, typeof i == "function") {
              var X = i;
              i = function() {
                var q = ks(v);
                X.call(q);
              };
            }
            zl(function() {
              ka(t, v, e, i);
            });
          }
          return ks(v);
        }
        function Uc(e, t, n) {
          var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
          return { $$typeof: Mt, key: r == null ? null : "" + r, children: e, containerInfo: t, implementation: n };
        }
        function ql(e, t) {
          var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
          if (!bi(t)) throw Error(m(200));
          return Uc(e, t, null, n);
        }
        _s.prototype.render = function(e) {
          ka(e, this._internalRoot, null, null);
        }, _s.prototype.unmount = function() {
          var e = this._internalRoot, t = e.containerInfo;
          ka(null, e, null, function() {
            t[ro] = null;
          });
        }, Et = function(e) {
          if (e.tag === 13) {
            var t = Vi(tr(), 150, 100);
            Kr(e, t), Es(e, t);
          }
        }, ur = function(e) {
          e.tag === 13 && (Kr(e, 3), Es(e, 3));
        }, fr = function(e) {
          if (e.tag === 13) {
            var t = tr();
            Kr(e, t = mo(t, e, null)), Es(e, t);
          }
        }, ce = function(e, t, n) {
          switch (t) {
            case "input":
              if (ir(e, n), t = n.name, n.type === "radio" && t != null) {
                for (n = e; n.parentNode; ) n = n.parentNode;
                for (n = n.querySelectorAll("input[name=" + JSON.stringify("" + t) + '][type="radio"]'), t = 0; t < n.length; t++) {
                  var r = n[t];
                  if (r !== e && r.form === e.form) {
                    var i = ni(r);
                    if (!i) throw Error(m(90));
                    ut(r), ir(r, i);
                  }
                }
              }
              break;
            case "textarea":
              Gr(e, n);
              break;
            case "select":
              (t = n.value) != null && Tn(e, !!n.multiple, t, !1);
          }
        }, be = jl, Ce = function(e, t, n, r, i) {
          var d = Qe;
          Qe |= 4;
          try {
            return Br(98, e.bind(null, t, n, r, i));
          } finally {
            (Qe = d) === 0 && Zn();
          }
        }, ke = function() {
          !(49 & Qe) && (function() {
            if (ho !== null) {
              var e = ho;
              ho = null, e.forEach(function(t, n) {
                ws(n, t), xn(n);
              }), Zn();
            }
          }(), Vo());
        }, Ne = function(e, t) {
          var n = Qe;
          Qe |= 2;
          try {
            return e(t);
          } finally {
            (Qe = n) === 0 && Zn();
          }
        };
        var Kl, xs, Fc = { Events: [oo, Qn, ni, le, I, jr, function(e) {
          Yn(e, Ma);
        }, D, ie, To, At, Vo, { current: !1 }] };
        xs = (Kl = { findFiberByHostInstance: Ir, bundleType: 0, version: "16.14.0", rendererPackageName: "react-dom" }).findFiberByHostInstance, function(e) {
          if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u") return !1;
          var t = __REACT_DEVTOOLS_GLOBAL_HOOK__;
          if (t.isDisabled || !t.supportsFiber) return !0;
          try {
            var n = t.inject(e);
            ms = function(r) {
              try {
                t.onCommitFiberRoot(n, r, void 0, (64 & r.current.effectTag) == 64);
              } catch {
              }
            }, gs = function(r) {
              try {
                t.onCommitFiberUnmount(n, r);
              } catch {
              }
            };
          } catch {
          }
        }(o({}, Kl, { overrideHookState: null, overrideProps: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: he.ReactCurrentDispatcher, findHostInstanceByFiber: function(e) {
          return (e = rt(e)) === null ? null : e.stateNode;
        }, findFiberByHostInstance: function(e) {
          return xs ? xs(e) : null;
        }, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null })), s.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Fc, s.createPortal = ql, s.findDOMNode = function(e) {
          if (e == null) return null;
          if (e.nodeType === 1) return e;
          var t = e._reactInternalFiber;
          if (t === void 0)
            throw typeof e.render == "function" ? Error(m(188)) : Error(m(268, Object.keys(e)));
          return e = (e = rt(t)) === null ? null : e.stateNode;
        }, s.flushSync = function(e, t) {
          if (48 & Qe) throw Error(m(187));
          var n = Qe;
          Qe |= 1;
          try {
            return Br(99, e.bind(null, t));
          } finally {
            Qe = n, Zn();
          }
        }, s.hydrate = function(e, t, n) {
          if (!bi(t)) throw Error(m(200));
          return Ea(null, e, t, !0, n);
        }, s.render = function(e, t, n) {
          if (!bi(t)) throw Error(m(200));
          return Ea(null, e, t, !1, n);
        }, s.unmountComponentAtNode = function(e) {
          if (!bi(e)) throw Error(m(40));
          return !!e._reactRootContainer && (zl(function() {
            Ea(null, null, e, !1, function() {
              e._reactRootContainer = null, e[ro] = null;
            });
          }), !0);
        }, s.unstable_batchedUpdates = jl, s.unstable_createPortal = function(e, t) {
          return ql(e, t, 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null);
        }, s.unstable_renderSubtreeIntoContainer = function(e, t, n, r) {
          if (!bi(n)) throw Error(m(200));
          if (e == null || e._reactInternalFiber === void 0) throw Error(m(38));
          return Ea(e, t, n, !1, r);
        }, s.version = "16.14.0";
      }, function(E, s, h) {
        E.exports = h(24);
      }, function(E, s, h) {
        var u, o, O, m, g;
        if (typeof window > "u" || typeof MessageChannel != "function") {
          var y = null, b = null, S = function() {
            if (y !== null) try {
              var Y = s.unstable_now();
              y(!0, Y), y = null;
            } catch (me) {
              throw setTimeout(S, 0), me;
            }
          }, T = Date.now();
          s.unstable_now = function() {
            return Date.now() - T;
          }, u = function(Y) {
            y !== null ? setTimeout(u, 0, Y) : (y = Y, setTimeout(S, 0));
          }, o = function(Y, me) {
            b = setTimeout(Y, me);
          }, O = function() {
            clearTimeout(b);
          }, m = function() {
            return !1;
          }, g = s.unstable_forceFrameRate = function() {
          };
        } else {
          var P = window.performance, Z = window.Date, Q = window.setTimeout, j = window.clearTimeout;
          if (typeof console < "u") {
            var W = window.cancelAnimationFrame;
            typeof window.requestAnimationFrame != "function" && console.error("This browser doesn't support requestAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills"), typeof W != "function" && console.error("This browser doesn't support cancelAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills");
          }
          if (typeof P == "object" && typeof P.now == "function") s.unstable_now = function() {
            return P.now();
          };
          else {
            var N = Z.now();
            s.unstable_now = function() {
              return Z.now() - N;
            };
          }
          var A = !1, F = null, R = -1, oe = 5, K = 0;
          m = function() {
            return s.unstable_now() >= K;
          }, g = function() {
          }, s.unstable_forceFrameRate = function(Y) {
            0 > Y || 125 < Y ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing framerates higher than 125 fps is not unsupported") : oe = 0 < Y ? Math.floor(1e3 / Y) : 5;
          };
          var I = new MessageChannel(), M = I.port2;
          I.port1.onmessage = function() {
            if (F !== null) {
              var Y = s.unstable_now();
              K = Y + oe;
              try {
                F(!0, Y) ? M.postMessage(null) : (A = !1, F = null);
              } catch (me) {
                throw M.postMessage(null), me;
              }
            } else A = !1;
          }, u = function(Y) {
            F = Y, A || (A = !0, M.postMessage(null));
          }, o = function(Y, me) {
            R = Q(function() {
              Y(s.unstable_now());
            }, me);
          }, O = function() {
            j(R), R = -1;
          };
        }
        function se(Y, me) {
          var l = Y.length;
          Y.push(me);
          e: for (; ; ) {
            var f = l - 1 >>> 1, w = Y[f];
            if (!(w !== void 0 && 0 < ce(w, me))) break e;
            Y[f] = me, Y[l] = w, l = f;
          }
        }
        function le(Y) {
          return (Y = Y[0]) === void 0 ? null : Y;
        }
        function te(Y) {
          var me = Y[0];
          if (me !== void 0) {
            var l = Y.pop();
            if (l !== me) {
              Y[0] = l;
              e: for (var f = 0, w = Y.length; f < w; ) {
                var L = 2 * (f + 1) - 1, U = Y[L], B = L + 1, he = Y[B];
                if (U !== void 0 && 0 > ce(U, l)) he !== void 0 && 0 > ce(he, U) ? (Y[f] = he, Y[B] = l, f = B) : (Y[f] = U, Y[L] = l, f = L);
                else {
                  if (!(he !== void 0 && 0 > ce(he, l))) break e;
                  Y[f] = he, Y[B] = l, f = B;
                }
              }
            }
            return me;
          }
          return null;
        }
        function ce(Y, me) {
          var l = Y.sortIndex - me.sortIndex;
          return l !== 0 ? l : Y.id - me.id;
        }
        var ye = [], J = [], fe = 1, D = null, ie = 3, be = !1, Ce = !1, ke = !1;
        function Ne(Y) {
          for (var me = le(J); me !== null; ) {
            if (me.callback === null) te(J);
            else {
              if (!(me.startTime <= Y)) break;
              te(J), me.sortIndex = me.expirationTime, se(ye, me);
            }
            me = le(J);
          }
        }
        function xe(Y) {
          if (ke = !1, Ne(Y), !Ce) if (le(ye) !== null) Ce = !0, u(ze);
          else {
            var me = le(J);
            me !== null && o(xe, me.startTime - Y);
          }
        }
        function ze(Y, me) {
          Ce = !1, ke && (ke = !1, O()), be = !0;
          var l = ie;
          try {
            for (Ne(me), D = le(ye); D !== null && (!(D.expirationTime > me) || Y && !m()); ) {
              var f = D.callback;
              if (f !== null) {
                D.callback = null, ie = D.priorityLevel;
                var w = f(D.expirationTime <= me);
                me = s.unstable_now(), typeof w == "function" ? D.callback = w : D === le(ye) && te(ye), Ne(me);
              } else te(ye);
              D = le(ye);
            }
            if (D !== null) var L = !0;
            else {
              var U = le(J);
              U !== null && o(xe, U.startTime - me), L = !1;
            }
            return L;
          } finally {
            D = null, ie = l, be = !1;
          }
        }
        function Je(Y) {
          switch (Y) {
            case 1:
              return -1;
            case 2:
              return 250;
            case 5:
              return 1073741823;
            case 4:
              return 1e4;
            default:
              return 5e3;
          }
        }
        var G = g;
        s.unstable_IdlePriority = 5, s.unstable_ImmediatePriority = 1, s.unstable_LowPriority = 4, s.unstable_NormalPriority = 3, s.unstable_Profiling = null, s.unstable_UserBlockingPriority = 2, s.unstable_cancelCallback = function(Y) {
          Y.callback = null;
        }, s.unstable_continueExecution = function() {
          Ce || be || (Ce = !0, u(ze));
        }, s.unstable_getCurrentPriorityLevel = function() {
          return ie;
        }, s.unstable_getFirstCallbackNode = function() {
          return le(ye);
        }, s.unstable_next = function(Y) {
          switch (ie) {
            case 1:
            case 2:
            case 3:
              var me = 3;
              break;
            default:
              me = ie;
          }
          var l = ie;
          ie = me;
          try {
            return Y();
          } finally {
            ie = l;
          }
        }, s.unstable_pauseExecution = function() {
        }, s.unstable_requestPaint = G, s.unstable_runWithPriority = function(Y, me) {
          switch (Y) {
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
              break;
            default:
              Y = 3;
          }
          var l = ie;
          ie = Y;
          try {
            return me();
          } finally {
            ie = l;
          }
        }, s.unstable_scheduleCallback = function(Y, me, l) {
          var f = s.unstable_now();
          if (typeof l == "object" && l !== null) {
            var w = l.delay;
            w = typeof w == "number" && 0 < w ? f + w : f, l = typeof l.timeout == "number" ? l.timeout : Je(Y);
          } else l = Je(Y), w = f;
          return Y = { id: fe++, callback: me, priorityLevel: Y, startTime: w, expirationTime: l = w + l, sortIndex: -1 }, w > f ? (Y.sortIndex = w, se(J, Y), le(ye) === null && Y === le(J) && (ke ? O() : ke = !0, o(xe, w - f))) : (Y.sortIndex = l, se(ye, Y), Ce || be || (Ce = !0, u(ze))), Y;
        }, s.unstable_shouldYield = function() {
          var Y = s.unstable_now();
          Ne(Y);
          var me = le(ye);
          return me !== D && D !== null && me !== null && me.callback !== null && me.startTime <= Y && me.expirationTime < D.expirationTime || m();
        }, s.unstable_wrapCallback = function(Y) {
          var me = ie;
          return function() {
            var l = ie;
            ie = me;
            try {
              return Y.apply(this, arguments);
            } finally {
              ie = l;
            }
          };
        };
      }, function(E, s, h) {
        Object.defineProperty(s, "__esModule", { value: !0 }), s.toString = void 0;
        const u = h(13), o = h(26), O = h(17), m = { string: u.quoteString, number: (g) => Object.is(g, -0) ? "-0" : String(g), boolean: String, symbol: (g, y, b) => {
          const S = Symbol.keyFor(g);
          return S !== void 0 ? `Symbol.for(${b(S)})` : `Symbol(${b(g.description)})`;
        }, bigint: (g, y, b) => `BigInt(${b(String(g))})`, undefined: String, object: o.objectToString, function: O.functionToString };
        s.toString = (g, y, b, S) => g === null ? "null" : m[typeof g](g, y, b, S);
      }, function(E, s, h) {
        (function(u, o) {
          Object.defineProperty(s, "__esModule", { value: !0 }), s.objectToString = void 0;
          const O = h(13), m = h(17), g = h(31);
          s.objectToString = (S, T, P, Z) => {
            if (typeof u == "function" && u.isBuffer(S)) return `Buffer.from(${P(S.toString("base64"))}, 'base64')`;
            if (typeof o == "object" && S === o) return y(S, T, P);
            const Q = b[Object.prototype.toString.call(S)];
            return Q ? Q(S, T, P, Z) : void 0;
          };
          const y = (S, T, P) => `Function(${P("return this")})()`, b = { "[object Array]": g.arrayToString, "[object Object]": (S, T, P, Z) => {
            const Q = T ? `
` : "", j = T ? " " : "", W = Object.keys(S).reduce(function(N, A) {
              const F = S[A], R = P(F, A);
              if (R === void 0) return N;
              const oe = R.split(`
`).join(`
` + T);
              return m.USED_METHOD_KEY.has(F) ? (N.push(`${T}${oe}`), N) : (N.push(`${T}${O.quoteKey(A, P)}:${j}${oe}`), N);
            }, []).join("," + Q);
            return W === "" ? "{}" : `{${Q}${W}${Q}}`;
          }, "[object Error]": (S, T, P) => `new Error(${P(S.message)})`, "[object Date]": (S) => `new Date(${S.getTime()})`, "[object String]": (S, T, P) => `new String(${P(S.toString())})`, "[object Number]": (S) => `new Number(${S})`, "[object Boolean]": (S) => `new Boolean(${S})`, "[object Set]": (S, T, P) => `new Set(${P(Array.from(S))})`, "[object Map]": (S, T, P) => `new Map(${P(Array.from(S))})`, "[object RegExp]": String, "[object global]": y, "[object Window]": y };
        }).call(this, h(27).Buffer, h(15));
      }, function(E, s, h) {
        (function(u) {
          var o = h(28), O = h(29), m = h(30);
          function g() {
            return b.TYPED_ARRAY_SUPPORT ? 2147483647 : 1073741823;
          }
          function y(l, f) {
            if (g() < f) throw new RangeError("Invalid typed array length");
            return b.TYPED_ARRAY_SUPPORT ? (l = new Uint8Array(f)).__proto__ = b.prototype : (l === null && (l = new b(f)), l.length = f), l;
          }
          function b(l, f, w) {
            if (!(b.TYPED_ARRAY_SUPPORT || this instanceof b)) return new b(l, f, w);
            if (typeof l == "number") {
              if (typeof f == "string") throw new Error("If encoding is specified then the first argument must be a string");
              return P(this, l);
            }
            return S(this, l, f, w);
          }
          function S(l, f, w, L) {
            if (typeof f == "number") throw new TypeError('"value" argument must not be a number');
            return typeof ArrayBuffer < "u" && f instanceof ArrayBuffer ? function(U, B, he, je) {
              if (B.byteLength, he < 0 || B.byteLength < he) throw new RangeError("'offset' is out of bounds");
              if (B.byteLength < he + (je || 0)) throw new RangeError("'length' is out of bounds");
              return B = he === void 0 && je === void 0 ? new Uint8Array(B) : je === void 0 ? new Uint8Array(B, he) : new Uint8Array(B, he, je), b.TYPED_ARRAY_SUPPORT ? (U = B).__proto__ = b.prototype : U = Z(U, B), U;
            }(l, f, w, L) : typeof f == "string" ? function(U, B, he) {
              if (typeof he == "string" && he !== "" || (he = "utf8"), !b.isEncoding(he)) throw new TypeError('"encoding" must be a valid string encoding');
              var je = 0 | j(B, he), Re = (U = y(U, je)).write(B, he);
              return Re !== je && (U = U.slice(0, Re)), U;
            }(l, f, w) : function(U, B) {
              if (b.isBuffer(B)) {
                var he = 0 | Q(B.length);
                return (U = y(U, he)).length === 0 || B.copy(U, 0, 0, he), U;
              }
              if (B) {
                if (typeof ArrayBuffer < "u" && B.buffer instanceof ArrayBuffer || "length" in B) return typeof B.length != "number" || (je = B.length) != je ? y(U, 0) : Z(U, B);
                if (B.type === "Buffer" && m(B.data)) return Z(U, B.data);
              }
              var je;
              throw new TypeError("First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.");
            }(l, f);
          }
          function T(l) {
            if (typeof l != "number") throw new TypeError('"size" argument must be a number');
            if (l < 0) throw new RangeError('"size" argument must not be negative');
          }
          function P(l, f) {
            if (T(f), l = y(l, f < 0 ? 0 : 0 | Q(f)), !b.TYPED_ARRAY_SUPPORT) for (var w = 0; w < f; ++w) l[w] = 0;
            return l;
          }
          function Z(l, f) {
            var w = f.length < 0 ? 0 : 0 | Q(f.length);
            l = y(l, w);
            for (var L = 0; L < w; L += 1) l[L] = 255 & f[L];
            return l;
          }
          function Q(l) {
            if (l >= g()) throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + g().toString(16) + " bytes");
            return 0 | l;
          }
          function j(l, f) {
            if (b.isBuffer(l)) return l.length;
            if (typeof ArrayBuffer < "u" && typeof ArrayBuffer.isView == "function" && (ArrayBuffer.isView(l) || l instanceof ArrayBuffer)) return l.byteLength;
            typeof l != "string" && (l = "" + l);
            var w = l.length;
            if (w === 0) return 0;
            for (var L = !1; ; ) switch (f) {
              case "ascii":
              case "latin1":
              case "binary":
                return w;
              case "utf8":
              case "utf-8":
              case void 0:
                return G(l).length;
              case "ucs2":
              case "ucs-2":
              case "utf16le":
              case "utf-16le":
                return 2 * w;
              case "hex":
                return w >>> 1;
              case "base64":
                return Y(l).length;
              default:
                if (L) return G(l).length;
                f = ("" + f).toLowerCase(), L = !0;
            }
          }
          function W(l, f, w) {
            var L = !1;
            if ((f === void 0 || f < 0) && (f = 0), f > this.length || ((w === void 0 || w > this.length) && (w = this.length), w <= 0) || (w >>>= 0) <= (f >>>= 0)) return "";
            for (l || (l = "utf8"); ; ) switch (l) {
              case "hex":
                return J(this, f, w);
              case "utf8":
              case "utf-8":
                return te(this, f, w);
              case "ascii":
                return ce(this, f, w);
              case "latin1":
              case "binary":
                return ye(this, f, w);
              case "base64":
                return le(this, f, w);
              case "ucs2":
              case "ucs-2":
              case "utf16le":
              case "utf-16le":
                return fe(this, f, w);
              default:
                if (L) throw new TypeError("Unknown encoding: " + l);
                l = (l + "").toLowerCase(), L = !0;
            }
          }
          function N(l, f, w) {
            var L = l[f];
            l[f] = l[w], l[w] = L;
          }
          function A(l, f, w, L, U) {
            if (l.length === 0) return -1;
            if (typeof w == "string" ? (L = w, w = 0) : w > 2147483647 ? w = 2147483647 : w < -2147483648 && (w = -2147483648), w = +w, isNaN(w) && (w = U ? 0 : l.length - 1), w < 0 && (w = l.length + w), w >= l.length) {
              if (U) return -1;
              w = l.length - 1;
            } else if (w < 0) {
              if (!U) return -1;
              w = 0;
            }
            if (typeof f == "string" && (f = b.from(f, L)), b.isBuffer(f)) return f.length === 0 ? -1 : F(l, f, w, L, U);
            if (typeof f == "number") return f &= 255, b.TYPED_ARRAY_SUPPORT && typeof Uint8Array.prototype.indexOf == "function" ? U ? Uint8Array.prototype.indexOf.call(l, f, w) : Uint8Array.prototype.lastIndexOf.call(l, f, w) : F(l, [f], w, L, U);
            throw new TypeError("val must be string, number or Buffer");
          }
          function F(l, f, w, L, U) {
            var B, he = 1, je = l.length, Re = f.length;
            if (L !== void 0 && ((L = String(L).toLowerCase()) === "ucs2" || L === "ucs-2" || L === "utf16le" || L === "utf-16le")) {
              if (l.length < 2 || f.length < 2) return -1;
              he = 2, je /= 2, Re /= 2, w /= 2;
            }
            function Xe(Jt, kt) {
              return he === 1 ? Jt[kt] : Jt.readUInt16BE(kt * he);
            }
            if (U) {
              var Ve = -1;
              for (B = w; B < je; B++) if (Xe(l, B) === Xe(f, Ve === -1 ? 0 : B - Ve)) {
                if (Ve === -1 && (Ve = B), B - Ve + 1 === Re) return Ve * he;
              } else Ve !== -1 && (B -= B - Ve), Ve = -1;
            } else for (w + Re > je && (w = je - Re), B = w; B >= 0; B--) {
              for (var Mt = !0, wt = 0; wt < Re; wt++) if (Xe(l, B + wt) !== Xe(f, wt)) {
                Mt = !1;
                break;
              }
              if (Mt) return B;
            }
            return -1;
          }
          function R(l, f, w, L) {
            w = Number(w) || 0;
            var U = l.length - w;
            L ? (L = Number(L)) > U && (L = U) : L = U;
            var B = f.length;
            if (B % 2 != 0) throw new TypeError("Invalid hex string");
            L > B / 2 && (L = B / 2);
            for (var he = 0; he < L; ++he) {
              var je = parseInt(f.substr(2 * he, 2), 16);
              if (isNaN(je)) return he;
              l[w + he] = je;
            }
            return he;
          }
          function oe(l, f, w, L) {
            return me(G(f, l.length - w), l, w, L);
          }
          function K(l, f, w, L) {
            return me(function(U) {
              for (var B = [], he = 0; he < U.length; ++he) B.push(255 & U.charCodeAt(he));
              return B;
            }(f), l, w, L);
          }
          function I(l, f, w, L) {
            return K(l, f, w, L);
          }
          function M(l, f, w, L) {
            return me(Y(f), l, w, L);
          }
          function se(l, f, w, L) {
            return me(function(U, B) {
              for (var he, je, Re, Xe = [], Ve = 0; Ve < U.length && !((B -= 2) < 0); ++Ve) he = U.charCodeAt(Ve), je = he >> 8, Re = he % 256, Xe.push(Re), Xe.push(je);
              return Xe;
            }(f, l.length - w), l, w, L);
          }
          function le(l, f, w) {
            return f === 0 && w === l.length ? o.fromByteArray(l) : o.fromByteArray(l.slice(f, w));
          }
          function te(l, f, w) {
            w = Math.min(l.length, w);
            for (var L = [], U = f; U < w; ) {
              var B, he, je, Re, Xe = l[U], Ve = null, Mt = Xe > 239 ? 4 : Xe > 223 ? 3 : Xe > 191 ? 2 : 1;
              if (U + Mt <= w) switch (Mt) {
                case 1:
                  Xe < 128 && (Ve = Xe);
                  break;
                case 2:
                  (192 & (B = l[U + 1])) == 128 && (Re = (31 & Xe) << 6 | 63 & B) > 127 && (Ve = Re);
                  break;
                case 3:
                  B = l[U + 1], he = l[U + 2], (192 & B) == 128 && (192 & he) == 128 && (Re = (15 & Xe) << 12 | (63 & B) << 6 | 63 & he) > 2047 && (Re < 55296 || Re > 57343) && (Ve = Re);
                  break;
                case 4:
                  B = l[U + 1], he = l[U + 2], je = l[U + 3], (192 & B) == 128 && (192 & he) == 128 && (192 & je) == 128 && (Re = (15 & Xe) << 18 | (63 & B) << 12 | (63 & he) << 6 | 63 & je) > 65535 && Re < 1114112 && (Ve = Re);
              }
              Ve === null ? (Ve = 65533, Mt = 1) : Ve > 65535 && (Ve -= 65536, L.push(Ve >>> 10 & 1023 | 55296), Ve = 56320 | 1023 & Ve), L.push(Ve), U += Mt;
            }
            return function(wt) {
              var Jt = wt.length;
              if (Jt <= 4096) return String.fromCharCode.apply(String, wt);
              for (var kt = "", gt = 0; gt < Jt; ) kt += String.fromCharCode.apply(String, wt.slice(gt, gt += 4096));
              return kt;
            }(L);
          }
          s.Buffer = b, s.SlowBuffer = function(l) {
            return +l != l && (l = 0), b.alloc(+l);
          }, s.INSPECT_MAX_BYTES = 50, b.TYPED_ARRAY_SUPPORT = u.TYPED_ARRAY_SUPPORT !== void 0 ? u.TYPED_ARRAY_SUPPORT : function() {
            try {
              var l = new Uint8Array(1);
              return l.__proto__ = { __proto__: Uint8Array.prototype, foo: function() {
                return 42;
              } }, l.foo() === 42 && typeof l.subarray == "function" && l.subarray(1, 1).byteLength === 0;
            } catch {
              return !1;
            }
          }(), s.kMaxLength = g(), b.poolSize = 8192, b._augment = function(l) {
            return l.__proto__ = b.prototype, l;
          }, b.from = function(l, f, w) {
            return S(null, l, f, w);
          }, b.TYPED_ARRAY_SUPPORT && (b.prototype.__proto__ = Uint8Array.prototype, b.__proto__ = Uint8Array, typeof Symbol < "u" && Symbol.species && b[Symbol.species] === b && Object.defineProperty(b, Symbol.species, { value: null, configurable: !0 })), b.alloc = function(l, f, w) {
            return function(L, U, B, he) {
              return T(U), U <= 0 ? y(L, U) : B !== void 0 ? typeof he == "string" ? y(L, U).fill(B, he) : y(L, U).fill(B) : y(L, U);
            }(null, l, f, w);
          }, b.allocUnsafe = function(l) {
            return P(null, l);
          }, b.allocUnsafeSlow = function(l) {
            return P(null, l);
          }, b.isBuffer = function(l) {
            return !(l == null || !l._isBuffer);
          }, b.compare = function(l, f) {
            if (!b.isBuffer(l) || !b.isBuffer(f)) throw new TypeError("Arguments must be Buffers");
            if (l === f) return 0;
            for (var w = l.length, L = f.length, U = 0, B = Math.min(w, L); U < B; ++U) if (l[U] !== f[U]) {
              w = l[U], L = f[U];
              break;
            }
            return w < L ? -1 : L < w ? 1 : 0;
          }, b.isEncoding = function(l) {
            switch (String(l).toLowerCase()) {
              case "hex":
              case "utf8":
              case "utf-8":
              case "ascii":
              case "latin1":
              case "binary":
              case "base64":
              case "ucs2":
              case "ucs-2":
              case "utf16le":
              case "utf-16le":
                return !0;
              default:
                return !1;
            }
          }, b.concat = function(l, f) {
            if (!m(l)) throw new TypeError('"list" argument must be an Array of Buffers');
            if (l.length === 0) return b.alloc(0);
            var w;
            if (f === void 0) for (f = 0, w = 0; w < l.length; ++w) f += l[w].length;
            var L = b.allocUnsafe(f), U = 0;
            for (w = 0; w < l.length; ++w) {
              var B = l[w];
              if (!b.isBuffer(B)) throw new TypeError('"list" argument must be an Array of Buffers');
              B.copy(L, U), U += B.length;
            }
            return L;
          }, b.byteLength = j, b.prototype._isBuffer = !0, b.prototype.swap16 = function() {
            var l = this.length;
            if (l % 2 != 0) throw new RangeError("Buffer size must be a multiple of 16-bits");
            for (var f = 0; f < l; f += 2) N(this, f, f + 1);
            return this;
          }, b.prototype.swap32 = function() {
            var l = this.length;
            if (l % 4 != 0) throw new RangeError("Buffer size must be a multiple of 32-bits");
            for (var f = 0; f < l; f += 4) N(this, f, f + 3), N(this, f + 1, f + 2);
            return this;
          }, b.prototype.swap64 = function() {
            var l = this.length;
            if (l % 8 != 0) throw new RangeError("Buffer size must be a multiple of 64-bits");
            for (var f = 0; f < l; f += 8) N(this, f, f + 7), N(this, f + 1, f + 6), N(this, f + 2, f + 5), N(this, f + 3, f + 4);
            return this;
          }, b.prototype.toString = function() {
            var l = 0 | this.length;
            return l === 0 ? "" : arguments.length === 0 ? te(this, 0, l) : W.apply(this, arguments);
          }, b.prototype.equals = function(l) {
            if (!b.isBuffer(l)) throw new TypeError("Argument must be a Buffer");
            return this === l || b.compare(this, l) === 0;
          }, b.prototype.inspect = function() {
            var l = "", f = s.INSPECT_MAX_BYTES;
            return this.length > 0 && (l = this.toString("hex", 0, f).match(/.{2}/g).join(" "), this.length > f && (l += " ... ")), "<Buffer " + l + ">";
          }, b.prototype.compare = function(l, f, w, L, U) {
            if (!b.isBuffer(l)) throw new TypeError("Argument must be a Buffer");
            if (f === void 0 && (f = 0), w === void 0 && (w = l ? l.length : 0), L === void 0 && (L = 0), U === void 0 && (U = this.length), f < 0 || w > l.length || L < 0 || U > this.length) throw new RangeError("out of range index");
            if (L >= U && f >= w) return 0;
            if (L >= U) return -1;
            if (f >= w) return 1;
            if (this === l) return 0;
            for (var B = (U >>>= 0) - (L >>>= 0), he = (w >>>= 0) - (f >>>= 0), je = Math.min(B, he), Re = this.slice(L, U), Xe = l.slice(f, w), Ve = 0; Ve < je; ++Ve) if (Re[Ve] !== Xe[Ve]) {
              B = Re[Ve], he = Xe[Ve];
              break;
            }
            return B < he ? -1 : he < B ? 1 : 0;
          }, b.prototype.includes = function(l, f, w) {
            return this.indexOf(l, f, w) !== -1;
          }, b.prototype.indexOf = function(l, f, w) {
            return A(this, l, f, w, !0);
          }, b.prototype.lastIndexOf = function(l, f, w) {
            return A(this, l, f, w, !1);
          }, b.prototype.write = function(l, f, w, L) {
            if (f === void 0) L = "utf8", w = this.length, f = 0;
            else if (w === void 0 && typeof f == "string") L = f, w = this.length, f = 0;
            else {
              if (!isFinite(f)) throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
              f |= 0, isFinite(w) ? (w |= 0, L === void 0 && (L = "utf8")) : (L = w, w = void 0);
            }
            var U = this.length - f;
            if ((w === void 0 || w > U) && (w = U), l.length > 0 && (w < 0 || f < 0) || f > this.length) throw new RangeError("Attempt to write outside buffer bounds");
            L || (L = "utf8");
            for (var B = !1; ; ) switch (L) {
              case "hex":
                return R(this, l, f, w);
              case "utf8":
              case "utf-8":
                return oe(this, l, f, w);
              case "ascii":
                return K(this, l, f, w);
              case "latin1":
              case "binary":
                return I(this, l, f, w);
              case "base64":
                return M(this, l, f, w);
              case "ucs2":
              case "ucs-2":
              case "utf16le":
              case "utf-16le":
                return se(this, l, f, w);
              default:
                if (B) throw new TypeError("Unknown encoding: " + L);
                L = ("" + L).toLowerCase(), B = !0;
            }
          }, b.prototype.toJSON = function() {
            return { type: "Buffer", data: Array.prototype.slice.call(this._arr || this, 0) };
          };
          function ce(l, f, w) {
            var L = "";
            w = Math.min(l.length, w);
            for (var U = f; U < w; ++U) L += String.fromCharCode(127 & l[U]);
            return L;
          }
          function ye(l, f, w) {
            var L = "";
            w = Math.min(l.length, w);
            for (var U = f; U < w; ++U) L += String.fromCharCode(l[U]);
            return L;
          }
          function J(l, f, w) {
            var L = l.length;
            (!f || f < 0) && (f = 0), (!w || w < 0 || w > L) && (w = L);
            for (var U = "", B = f; B < w; ++B) U += Je(l[B]);
            return U;
          }
          function fe(l, f, w) {
            for (var L = l.slice(f, w), U = "", B = 0; B < L.length; B += 2) U += String.fromCharCode(L[B] + 256 * L[B + 1]);
            return U;
          }
          function D(l, f, w) {
            if (l % 1 != 0 || l < 0) throw new RangeError("offset is not uint");
            if (l + f > w) throw new RangeError("Trying to access beyond buffer length");
          }
          function ie(l, f, w, L, U, B) {
            if (!b.isBuffer(l)) throw new TypeError('"buffer" argument must be a Buffer instance');
            if (f > U || f < B) throw new RangeError('"value" argument is out of bounds');
            if (w + L > l.length) throw new RangeError("Index out of range");
          }
          function be(l, f, w, L) {
            f < 0 && (f = 65535 + f + 1);
            for (var U = 0, B = Math.min(l.length - w, 2); U < B; ++U) l[w + U] = (f & 255 << 8 * (L ? U : 1 - U)) >>> 8 * (L ? U : 1 - U);
          }
          function Ce(l, f, w, L) {
            f < 0 && (f = 4294967295 + f + 1);
            for (var U = 0, B = Math.min(l.length - w, 4); U < B; ++U) l[w + U] = f >>> 8 * (L ? U : 3 - U) & 255;
          }
          function ke(l, f, w, L, U, B) {
            if (w + L > l.length) throw new RangeError("Index out of range");
            if (w < 0) throw new RangeError("Index out of range");
          }
          function Ne(l, f, w, L, U) {
            return U || ke(l, 0, w, 4), O.write(l, f, w, L, 23, 4), w + 4;
          }
          function xe(l, f, w, L, U) {
            return U || ke(l, 0, w, 8), O.write(l, f, w, L, 52, 8), w + 8;
          }
          b.prototype.slice = function(l, f) {
            var w, L = this.length;
            if ((l = ~~l) < 0 ? (l += L) < 0 && (l = 0) : l > L && (l = L), (f = f === void 0 ? L : ~~f) < 0 ? (f += L) < 0 && (f = 0) : f > L && (f = L), f < l && (f = l), b.TYPED_ARRAY_SUPPORT) (w = this.subarray(l, f)).__proto__ = b.prototype;
            else {
              var U = f - l;
              w = new b(U, void 0);
              for (var B = 0; B < U; ++B) w[B] = this[B + l];
            }
            return w;
          }, b.prototype.readUIntLE = function(l, f, w) {
            l |= 0, f |= 0, w || D(l, f, this.length);
            for (var L = this[l], U = 1, B = 0; ++B < f && (U *= 256); ) L += this[l + B] * U;
            return L;
          }, b.prototype.readUIntBE = function(l, f, w) {
            l |= 0, f |= 0, w || D(l, f, this.length);
            for (var L = this[l + --f], U = 1; f > 0 && (U *= 256); ) L += this[l + --f] * U;
            return L;
          }, b.prototype.readUInt8 = function(l, f) {
            return f || D(l, 1, this.length), this[l];
          }, b.prototype.readUInt16LE = function(l, f) {
            return f || D(l, 2, this.length), this[l] | this[l + 1] << 8;
          }, b.prototype.readUInt16BE = function(l, f) {
            return f || D(l, 2, this.length), this[l] << 8 | this[l + 1];
          }, b.prototype.readUInt32LE = function(l, f) {
            return f || D(l, 4, this.length), (this[l] | this[l + 1] << 8 | this[l + 2] << 16) + 16777216 * this[l + 3];
          }, b.prototype.readUInt32BE = function(l, f) {
            return f || D(l, 4, this.length), 16777216 * this[l] + (this[l + 1] << 16 | this[l + 2] << 8 | this[l + 3]);
          }, b.prototype.readIntLE = function(l, f, w) {
            l |= 0, f |= 0, w || D(l, f, this.length);
            for (var L = this[l], U = 1, B = 0; ++B < f && (U *= 256); ) L += this[l + B] * U;
            return L >= (U *= 128) && (L -= Math.pow(2, 8 * f)), L;
          }, b.prototype.readIntBE = function(l, f, w) {
            l |= 0, f |= 0, w || D(l, f, this.length);
            for (var L = f, U = 1, B = this[l + --L]; L > 0 && (U *= 256); ) B += this[l + --L] * U;
            return B >= (U *= 128) && (B -= Math.pow(2, 8 * f)), B;
          }, b.prototype.readInt8 = function(l, f) {
            return f || D(l, 1, this.length), 128 & this[l] ? -1 * (255 - this[l] + 1) : this[l];
          }, b.prototype.readInt16LE = function(l, f) {
            f || D(l, 2, this.length);
            var w = this[l] | this[l + 1] << 8;
            return 32768 & w ? 4294901760 | w : w;
          }, b.prototype.readInt16BE = function(l, f) {
            f || D(l, 2, this.length);
            var w = this[l + 1] | this[l] << 8;
            return 32768 & w ? 4294901760 | w : w;
          }, b.prototype.readInt32LE = function(l, f) {
            return f || D(l, 4, this.length), this[l] | this[l + 1] << 8 | this[l + 2] << 16 | this[l + 3] << 24;
          }, b.prototype.readInt32BE = function(l, f) {
            return f || D(l, 4, this.length), this[l] << 24 | this[l + 1] << 16 | this[l + 2] << 8 | this[l + 3];
          }, b.prototype.readFloatLE = function(l, f) {
            return f || D(l, 4, this.length), O.read(this, l, !0, 23, 4);
          }, b.prototype.readFloatBE = function(l, f) {
            return f || D(l, 4, this.length), O.read(this, l, !1, 23, 4);
          }, b.prototype.readDoubleLE = function(l, f) {
            return f || D(l, 8, this.length), O.read(this, l, !0, 52, 8);
          }, b.prototype.readDoubleBE = function(l, f) {
            return f || D(l, 8, this.length), O.read(this, l, !1, 52, 8);
          }, b.prototype.writeUIntLE = function(l, f, w, L) {
            l = +l, f |= 0, w |= 0, L || ie(this, l, f, w, Math.pow(2, 8 * w) - 1, 0);
            var U = 1, B = 0;
            for (this[f] = 255 & l; ++B < w && (U *= 256); ) this[f + B] = l / U & 255;
            return f + w;
          }, b.prototype.writeUIntBE = function(l, f, w, L) {
            l = +l, f |= 0, w |= 0, L || ie(this, l, f, w, Math.pow(2, 8 * w) - 1, 0);
            var U = w - 1, B = 1;
            for (this[f + U] = 255 & l; --U >= 0 && (B *= 256); ) this[f + U] = l / B & 255;
            return f + w;
          }, b.prototype.writeUInt8 = function(l, f, w) {
            return l = +l, f |= 0, w || ie(this, l, f, 1, 255, 0), b.TYPED_ARRAY_SUPPORT || (l = Math.floor(l)), this[f] = 255 & l, f + 1;
          }, b.prototype.writeUInt16LE = function(l, f, w) {
            return l = +l, f |= 0, w || ie(this, l, f, 2, 65535, 0), b.TYPED_ARRAY_SUPPORT ? (this[f] = 255 & l, this[f + 1] = l >>> 8) : be(this, l, f, !0), f + 2;
          }, b.prototype.writeUInt16BE = function(l, f, w) {
            return l = +l, f |= 0, w || ie(this, l, f, 2, 65535, 0), b.TYPED_ARRAY_SUPPORT ? (this[f] = l >>> 8, this[f + 1] = 255 & l) : be(this, l, f, !1), f + 2;
          }, b.prototype.writeUInt32LE = function(l, f, w) {
            return l = +l, f |= 0, w || ie(this, l, f, 4, 4294967295, 0), b.TYPED_ARRAY_SUPPORT ? (this[f + 3] = l >>> 24, this[f + 2] = l >>> 16, this[f + 1] = l >>> 8, this[f] = 255 & l) : Ce(this, l, f, !0), f + 4;
          }, b.prototype.writeUInt32BE = function(l, f, w) {
            return l = +l, f |= 0, w || ie(this, l, f, 4, 4294967295, 0), b.TYPED_ARRAY_SUPPORT ? (this[f] = l >>> 24, this[f + 1] = l >>> 16, this[f + 2] = l >>> 8, this[f + 3] = 255 & l) : Ce(this, l, f, !1), f + 4;
          }, b.prototype.writeIntLE = function(l, f, w, L) {
            if (l = +l, f |= 0, !L) {
              var U = Math.pow(2, 8 * w - 1);
              ie(this, l, f, w, U - 1, -U);
            }
            var B = 0, he = 1, je = 0;
            for (this[f] = 255 & l; ++B < w && (he *= 256); ) l < 0 && je === 0 && this[f + B - 1] !== 0 && (je = 1), this[f + B] = (l / he >> 0) - je & 255;
            return f + w;
          }, b.prototype.writeIntBE = function(l, f, w, L) {
            if (l = +l, f |= 0, !L) {
              var U = Math.pow(2, 8 * w - 1);
              ie(this, l, f, w, U - 1, -U);
            }
            var B = w - 1, he = 1, je = 0;
            for (this[f + B] = 255 & l; --B >= 0 && (he *= 256); ) l < 0 && je === 0 && this[f + B + 1] !== 0 && (je = 1), this[f + B] = (l / he >> 0) - je & 255;
            return f + w;
          }, b.prototype.writeInt8 = function(l, f, w) {
            return l = +l, f |= 0, w || ie(this, l, f, 1, 127, -128), b.TYPED_ARRAY_SUPPORT || (l = Math.floor(l)), l < 0 && (l = 255 + l + 1), this[f] = 255 & l, f + 1;
          }, b.prototype.writeInt16LE = function(l, f, w) {
            return l = +l, f |= 0, w || ie(this, l, f, 2, 32767, -32768), b.TYPED_ARRAY_SUPPORT ? (this[f] = 255 & l, this[f + 1] = l >>> 8) : be(this, l, f, !0), f + 2;
          }, b.prototype.writeInt16BE = function(l, f, w) {
            return l = +l, f |= 0, w || ie(this, l, f, 2, 32767, -32768), b.TYPED_ARRAY_SUPPORT ? (this[f] = l >>> 8, this[f + 1] = 255 & l) : be(this, l, f, !1), f + 2;
          }, b.prototype.writeInt32LE = function(l, f, w) {
            return l = +l, f |= 0, w || ie(this, l, f, 4, 2147483647, -2147483648), b.TYPED_ARRAY_SUPPORT ? (this[f] = 255 & l, this[f + 1] = l >>> 8, this[f + 2] = l >>> 16, this[f + 3] = l >>> 24) : Ce(this, l, f, !0), f + 4;
          }, b.prototype.writeInt32BE = function(l, f, w) {
            return l = +l, f |= 0, w || ie(this, l, f, 4, 2147483647, -2147483648), l < 0 && (l = 4294967295 + l + 1), b.TYPED_ARRAY_SUPPORT ? (this[f] = l >>> 24, this[f + 1] = l >>> 16, this[f + 2] = l >>> 8, this[f + 3] = 255 & l) : Ce(this, l, f, !1), f + 4;
          }, b.prototype.writeFloatLE = function(l, f, w) {
            return Ne(this, l, f, !0, w);
          }, b.prototype.writeFloatBE = function(l, f, w) {
            return Ne(this, l, f, !1, w);
          }, b.prototype.writeDoubleLE = function(l, f, w) {
            return xe(this, l, f, !0, w);
          }, b.prototype.writeDoubleBE = function(l, f, w) {
            return xe(this, l, f, !1, w);
          }, b.prototype.copy = function(l, f, w, L) {
            if (w || (w = 0), L || L === 0 || (L = this.length), f >= l.length && (f = l.length), f || (f = 0), L > 0 && L < w && (L = w), L === w || l.length === 0 || this.length === 0) return 0;
            if (f < 0) throw new RangeError("targetStart out of bounds");
            if (w < 0 || w >= this.length) throw new RangeError("sourceStart out of bounds");
            if (L < 0) throw new RangeError("sourceEnd out of bounds");
            L > this.length && (L = this.length), l.length - f < L - w && (L = l.length - f + w);
            var U, B = L - w;
            if (this === l && w < f && f < L) for (U = B - 1; U >= 0; --U) l[U + f] = this[U + w];
            else if (B < 1e3 || !b.TYPED_ARRAY_SUPPORT) for (U = 0; U < B; ++U) l[U + f] = this[U + w];
            else Uint8Array.prototype.set.call(l, this.subarray(w, w + B), f);
            return B;
          }, b.prototype.fill = function(l, f, w, L) {
            if (typeof l == "string") {
              if (typeof f == "string" ? (L = f, f = 0, w = this.length) : typeof w == "string" && (L = w, w = this.length), l.length === 1) {
                var U = l.charCodeAt(0);
                U < 256 && (l = U);
              }
              if (L !== void 0 && typeof L != "string") throw new TypeError("encoding must be a string");
              if (typeof L == "string" && !b.isEncoding(L)) throw new TypeError("Unknown encoding: " + L);
            } else typeof l == "number" && (l &= 255);
            if (f < 0 || this.length < f || this.length < w) throw new RangeError("Out of range index");
            if (w <= f) return this;
            var B;
            if (f >>>= 0, w = w === void 0 ? this.length : w >>> 0, l || (l = 0), typeof l == "number") for (B = f; B < w; ++B) this[B] = l;
            else {
              var he = b.isBuffer(l) ? l : G(new b(l, L).toString()), je = he.length;
              for (B = 0; B < w - f; ++B) this[B + f] = he[B % je];
            }
            return this;
          };
          var ze = /[^+\/0-9A-Za-z-_]/g;
          function Je(l) {
            return l < 16 ? "0" + l.toString(16) : l.toString(16);
          }
          function G(l, f) {
            var w;
            f = f || 1 / 0;
            for (var L = l.length, U = null, B = [], he = 0; he < L; ++he) {
              if ((w = l.charCodeAt(he)) > 55295 && w < 57344) {
                if (!U) {
                  if (w > 56319) {
                    (f -= 3) > -1 && B.push(239, 191, 189);
                    continue;
                  }
                  if (he + 1 === L) {
                    (f -= 3) > -1 && B.push(239, 191, 189);
                    continue;
                  }
                  U = w;
                  continue;
                }
                if (w < 56320) {
                  (f -= 3) > -1 && B.push(239, 191, 189), U = w;
                  continue;
                }
                w = 65536 + (U - 55296 << 10 | w - 56320);
              } else U && (f -= 3) > -1 && B.push(239, 191, 189);
              if (U = null, w < 128) {
                if ((f -= 1) < 0) break;
                B.push(w);
              } else if (w < 2048) {
                if ((f -= 2) < 0) break;
                B.push(w >> 6 | 192, 63 & w | 128);
              } else if (w < 65536) {
                if ((f -= 3) < 0) break;
                B.push(w >> 12 | 224, w >> 6 & 63 | 128, 63 & w | 128);
              } else {
                if (!(w < 1114112)) throw new Error("Invalid code point");
                if ((f -= 4) < 0) break;
                B.push(w >> 18 | 240, w >> 12 & 63 | 128, w >> 6 & 63 | 128, 63 & w | 128);
              }
            }
            return B;
          }
          function Y(l) {
            return o.toByteArray(function(f) {
              if ((f = function(w) {
                return w.trim ? w.trim() : w.replace(/^\s+|\s+$/g, "");
              }(f).replace(ze, "")).length < 2) return "";
              for (; f.length % 4 != 0; ) f += "=";
              return f;
            }(l));
          }
          function me(l, f, w, L) {
            for (var U = 0; U < L && !(U + w >= f.length || U >= l.length); ++U) f[U + w] = l[U];
            return U;
          }
        }).call(this, h(15));
      }, function(E, s, h) {
        s.byteLength = function(T) {
          var P = b(T), Z = P[0], Q = P[1];
          return 3 * (Z + Q) / 4 - Q;
        }, s.toByteArray = function(T) {
          var P, Z, Q = b(T), j = Q[0], W = Q[1], N = new O(function(R, oe, K) {
            return 3 * (oe + K) / 4 - K;
          }(0, j, W)), A = 0, F = W > 0 ? j - 4 : j;
          for (Z = 0; Z < F; Z += 4) P = o[T.charCodeAt(Z)] << 18 | o[T.charCodeAt(Z + 1)] << 12 | o[T.charCodeAt(Z + 2)] << 6 | o[T.charCodeAt(Z + 3)], N[A++] = P >> 16 & 255, N[A++] = P >> 8 & 255, N[A++] = 255 & P;
          return W === 2 && (P = o[T.charCodeAt(Z)] << 2 | o[T.charCodeAt(Z + 1)] >> 4, N[A++] = 255 & P), W === 1 && (P = o[T.charCodeAt(Z)] << 10 | o[T.charCodeAt(Z + 1)] << 4 | o[T.charCodeAt(Z + 2)] >> 2, N[A++] = P >> 8 & 255, N[A++] = 255 & P), N;
        }, s.fromByteArray = function(T) {
          for (var P, Z = T.length, Q = Z % 3, j = [], W = 0, N = Z - Q; W < N; W += 16383) j.push(S(T, W, W + 16383 > N ? N : W + 16383));
          return Q === 1 ? (P = T[Z - 1], j.push(u[P >> 2] + u[P << 4 & 63] + "==")) : Q === 2 && (P = (T[Z - 2] << 8) + T[Z - 1], j.push(u[P >> 10] + u[P >> 4 & 63] + u[P << 2 & 63] + "=")), j.join("");
        };
        for (var u = [], o = [], O = typeof Uint8Array < "u" ? Uint8Array : Array, m = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", g = 0, y = m.length; g < y; ++g) u[g] = m[g], o[m.charCodeAt(g)] = g;
        function b(T) {
          var P = T.length;
          if (P % 4 > 0) throw new Error("Invalid string. Length must be a multiple of 4");
          var Z = T.indexOf("=");
          return Z === -1 && (Z = P), [Z, Z === P ? 0 : 4 - Z % 4];
        }
        function S(T, P, Z) {
          for (var Q, j, W = [], N = P; N < Z; N += 3) Q = (T[N] << 16 & 16711680) + (T[N + 1] << 8 & 65280) + (255 & T[N + 2]), W.push(u[(j = Q) >> 18 & 63] + u[j >> 12 & 63] + u[j >> 6 & 63] + u[63 & j]);
          return W.join("");
        }
        o[45] = 62, o[95] = 63;
      }, function(E, s) {
        s.read = function(h, u, o, O, m) {
          var g, y, b = 8 * m - O - 1, S = (1 << b) - 1, T = S >> 1, P = -7, Z = o ? m - 1 : 0, Q = o ? -1 : 1, j = h[u + Z];
          for (Z += Q, g = j & (1 << -P) - 1, j >>= -P, P += b; P > 0; g = 256 * g + h[u + Z], Z += Q, P -= 8) ;
          for (y = g & (1 << -P) - 1, g >>= -P, P += O; P > 0; y = 256 * y + h[u + Z], Z += Q, P -= 8) ;
          if (g === 0) g = 1 - T;
          else {
            if (g === S) return y ? NaN : 1 / 0 * (j ? -1 : 1);
            y += Math.pow(2, O), g -= T;
          }
          return (j ? -1 : 1) * y * Math.pow(2, g - O);
        }, s.write = function(h, u, o, O, m, g) {
          var y, b, S, T = 8 * g - m - 1, P = (1 << T) - 1, Z = P >> 1, Q = m === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0, j = O ? 0 : g - 1, W = O ? 1 : -1, N = u < 0 || u === 0 && 1 / u < 0 ? 1 : 0;
          for (u = Math.abs(u), isNaN(u) || u === 1 / 0 ? (b = isNaN(u) ? 1 : 0, y = P) : (y = Math.floor(Math.log(u) / Math.LN2), u * (S = Math.pow(2, -y)) < 1 && (y--, S *= 2), (u += y + Z >= 1 ? Q / S : Q * Math.pow(2, 1 - Z)) * S >= 2 && (y++, S /= 2), y + Z >= P ? (b = 0, y = P) : y + Z >= 1 ? (b = (u * S - 1) * Math.pow(2, m), y += Z) : (b = u * Math.pow(2, Z - 1) * Math.pow(2, m), y = 0)); m >= 8; h[o + j] = 255 & b, j += W, b /= 256, m -= 8) ;
          for (y = y << m | b, T += m; T > 0; h[o + j] = 255 & y, j += W, y /= 256, T -= 8) ;
          h[o + j - W] |= 128 * N;
        };
      }, function(E, s) {
        var h = {}.toString;
        E.exports = Array.isArray || function(u) {
          return h.call(u) == "[object Array]";
        };
      }, function(E, s, h) {
        Object.defineProperty(s, "__esModule", { value: !0 }), s.arrayToString = void 0, s.arrayToString = (u, o, O) => {
          const m = u.map(function(y, b) {
            const S = O(y, b);
            return S === void 0 ? String(S) : o + S.split(`
`).join(`
` + o);
          }).join(o ? `,
` : ","), g = o && m ? `
` : "";
          return `[${g}${m}${g}]`;
        };
      }, function(E, s, h) {
        function u(j) {
          return (u = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(W) {
            return typeof W;
          } : function(W) {
            return W && typeof Symbol == "function" && W.constructor === Symbol && W !== Symbol.prototype ? "symbol" : typeof W;
          })(j);
        }
        Object.defineProperty(s, "__esModule", { value: !0 }), s.matchesSelector = T, s.matchesSelectorAndParentsTo = function(j, W, N) {
          var A = j;
          do {
            if (T(A, W)) return !0;
            if (A === N) return !1;
            A = A.parentNode;
          } while (A);
          return !1;
        }, s.addEvent = function(j, W, N, A) {
          if (j) {
            var F = y({ capture: !0 }, A);
            j.addEventListener ? j.addEventListener(W, N, F) : j.attachEvent ? j.attachEvent("on" + W, N) : j["on" + W] = N;
          }
        }, s.removeEvent = function(j, W, N, A) {
          if (j) {
            var F = y({ capture: !0 }, A);
            j.removeEventListener ? j.removeEventListener(W, N, F) : j.detachEvent ? j.detachEvent("on" + W, N) : j["on" + W] = null;
          }
        }, s.outerHeight = function(j) {
          var W = j.clientHeight, N = j.ownerDocument.defaultView.getComputedStyle(j);
          return W += (0, o.int)(N.borderTopWidth), W += (0, o.int)(N.borderBottomWidth);
        }, s.outerWidth = function(j) {
          var W = j.clientWidth, N = j.ownerDocument.defaultView.getComputedStyle(j);
          return W += (0, o.int)(N.borderLeftWidth), W += (0, o.int)(N.borderRightWidth);
        }, s.innerHeight = function(j) {
          var W = j.clientHeight, N = j.ownerDocument.defaultView.getComputedStyle(j);
          return W -= (0, o.int)(N.paddingTop), W -= (0, o.int)(N.paddingBottom);
        }, s.innerWidth = function(j) {
          var W = j.clientWidth, N = j.ownerDocument.defaultView.getComputedStyle(j);
          return W -= (0, o.int)(N.paddingLeft), W -= (0, o.int)(N.paddingRight);
        }, s.offsetXYFromParent = function(j, W, N) {
          var A = W === W.ownerDocument.body ? { left: 0, top: 0 } : W.getBoundingClientRect(), F = (j.clientX + W.scrollLeft - A.left) / N, R = (j.clientY + W.scrollTop - A.top) / N;
          return { x: F, y: R };
        }, s.createCSSTransform = function(j, W) {
          var N = P(j, W, "px");
          return b({}, (0, O.browserPrefixToKey)("transform", O.default), N);
        }, s.createSVGTransform = function(j, W) {
          return P(j, W, "");
        }, s.getTranslation = P, s.getTouch = function(j, W) {
          return j.targetTouches && (0, o.findInArray)(j.targetTouches, function(N) {
            return W === N.identifier;
          }) || j.changedTouches && (0, o.findInArray)(j.changedTouches, function(N) {
            return W === N.identifier;
          });
        }, s.getTouchIdentifier = function(j) {
          if (j.targetTouches && j.targetTouches[0]) return j.targetTouches[0].identifier;
          if (j.changedTouches && j.changedTouches[0]) return j.changedTouches[0].identifier;
        }, s.addUserSelectStyles = function(j) {
          if (j) {
            var W = j.getElementById("react-draggable-style-el");
            W || ((W = j.createElement("style")).type = "text/css", W.id = "react-draggable-style-el", W.innerHTML = `.react-draggable-transparent-selection *::-moz-selection {all: inherit;}
`, W.innerHTML += `.react-draggable-transparent-selection *::selection {all: inherit;}
`, j.getElementsByTagName("head")[0].appendChild(W)), j.body && Z(j.body, "react-draggable-transparent-selection");
          }
        }, s.removeUserSelectStyles = function(j) {
          if (j)
            try {
              if (j.body && Q(j.body, "react-draggable-transparent-selection"), j.selection) j.selection.empty();
              else {
                var W = (j.defaultView || window).getSelection();
                W && W.type !== "Caret" && W.removeAllRanges();
              }
            } catch {
            }
        }, s.addClassName = Z, s.removeClassName = Q;
        var o = h(20), O = function(j) {
          if (j && j.__esModule) return j;
          if (j === null || u(j) !== "object" && typeof j != "function") return { default: j };
          var W = m();
          if (W && W.has(j)) return W.get(j);
          var N = {}, A = Object.defineProperty && Object.getOwnPropertyDescriptor;
          for (var F in j) if (Object.prototype.hasOwnProperty.call(j, F)) {
            var R = A ? Object.getOwnPropertyDescriptor(j, F) : null;
            R && (R.get || R.set) ? Object.defineProperty(N, F, R) : N[F] = j[F];
          }
          return N.default = j, W && W.set(j, N), N;
        }(h(56));
        function m() {
          if (typeof WeakMap != "function") return null;
          var j = /* @__PURE__ */ new WeakMap();
          return m = function() {
            return j;
          }, j;
        }
        function g(j, W) {
          var N = Object.keys(j);
          if (Object.getOwnPropertySymbols) {
            var A = Object.getOwnPropertySymbols(j);
            W && (A = A.filter(function(F) {
              return Object.getOwnPropertyDescriptor(j, F).enumerable;
            })), N.push.apply(N, A);
          }
          return N;
        }
        function y(j) {
          for (var W = 1; W < arguments.length; W++) {
            var N = arguments[W] != null ? arguments[W] : {};
            W % 2 ? g(Object(N), !0).forEach(function(A) {
              b(j, A, N[A]);
            }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(j, Object.getOwnPropertyDescriptors(N)) : g(Object(N)).forEach(function(A) {
              Object.defineProperty(j, A, Object.getOwnPropertyDescriptor(N, A));
            });
          }
          return j;
        }
        function b(j, W, N) {
          return W in j ? Object.defineProperty(j, W, { value: N, enumerable: !0, configurable: !0, writable: !0 }) : j[W] = N, j;
        }
        var S = "";
        function T(j, W) {
          return S || (S = (0, o.findInArray)(["matches", "webkitMatchesSelector", "mozMatchesSelector", "msMatchesSelector", "oMatchesSelector"], function(N) {
            return (0, o.isFunction)(j[N]);
          })), !!(0, o.isFunction)(j[S]) && j[S](W);
        }
        function P(j, W, N) {
          var A = j.x, F = j.y, R = "translate(".concat(A).concat(N, ",").concat(F).concat(N, ")");
          if (W) {
            var oe = "".concat(typeof W.x == "string" ? W.x : W.x + N), K = "".concat(typeof W.y == "string" ? W.y : W.y + N);
            R = "translate(".concat(oe, ", ").concat(K, ")") + R;
          }
          return R;
        }
        function Z(j, W) {
          j.classList ? j.classList.add(W) : j.className.match(new RegExp("(?:^|\\s)".concat(W, "(?!\\S)"))) || (j.className += " ".concat(W));
        }
        function Q(j, W) {
          j.classList ? j.classList.remove(W) : j.className = j.className.replace(new RegExp("(?:^|\\s)".concat(W, "(?!\\S)"), "g"), "");
        }
      }, function(E, s) {
        E.exports = function(h) {
          return h.webpackPolyfill || (h.deprecate = function() {
          }, h.paths = [], h.children || (h.children = []), Object.defineProperty(h, "loaded", { enumerable: !0, get: function() {
            return h.l;
          } }), Object.defineProperty(h, "id", { enumerable: !0, get: function() {
            return h.i;
          } }), h.webpackPolyfill = 1), h;
        };
      }, function(E, s, h) {
        var u = h(6), o = h(35);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[E.i, o, ""]]);
        var O = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        u(o, O), E.exports = o.locals || {};
      }, function(E, s, h) {
        (E.exports = h(7)(!1)).push([E.i, `.ck-inspector{--ck-inspector-color-tree-node-hover:#eaf2fb;--ck-inspector-color-tree-node-name:#882680;--ck-inspector-color-tree-node-attribute-name:#8a8a8a;--ck-inspector-color-tree-node-tag:#aaa;--ck-inspector-color-tree-node-attribute:#9a4819;--ck-inspector-color-tree-node-attribute-value:#2a43ac;--ck-inspector-color-tree-text-border:#b7b7b7;--ck-inspector-color-tree-node-border-hover:#b0c6e0;--ck-inspector-color-tree-content-delimiter:#ddd;--ck-inspector-color-tree-node-active-bg:#f5faff;--ck-inspector-color-tree-node-name-active-bg:#2b98f0;--ck-inspector-color-tree-node-inactive:#8a8a8a;--ck-inspector-color-tree-selection:#ff1744;--ck-inspector-color-tree-position:#000;--ck-inspector-color-comment:green}.ck-inspector .ck-inspector-tree{background:var(--ck-inspector-color-white);padding:1em;width:100%;height:100%;overflow:auto;user-select:none}.ck-inspector-tree .ck-inspector-tree-node__attribute{font:inherit;margin-left:.4em;color:var(--ck-inspector-color-tree-node-tag)}.ck-inspector-tree .ck-inspector-tree-node__attribute .ck-inspector-tree-node__attribute__name{color:var(--ck-inspector-color-tree-node-attribute)}.ck-inspector-tree .ck-inspector-tree-node__attribute .ck-inspector-tree-node__attribute__value{color:var(--ck-inspector-color-tree-node-attribute-value)}.ck-inspector-tree .ck-inspector-tree-node__attribute .ck-inspector-tree-node__attribute__value:before{content:'="'}.ck-inspector-tree .ck-inspector-tree-node__attribute .ck-inspector-tree-node__attribute__value:after{content:'"'}.ck-inspector-tree .ck-inspector-tree-node .ck-inspector-tree-node__name{color:var(--ck-inspector-color-tree-node-name);display:inline-block;width:100%;padding:0 .1em;border-left:1px solid transparent}.ck-inspector-tree .ck-inspector-tree-node .ck-inspector-tree-node__name:hover{background:var(--ck-inspector-color-tree-node-hover)}.ck-inspector-tree .ck-inspector-tree-node .ck-inspector-tree-node__content{padding:1px .5em 1px 1.5em;border-left:1px solid var(--ck-inspector-color-tree-content-delimiter);white-space:pre-wrap}.ck-inspector-tree .ck-inspector-tree-node:not(.ck-inspector-tree-node_tagless) .ck-inspector-tree-node__name>.ck-inspector-tree-node__name__bracket_open:after{content:"<";color:var(--ck-inspector-color-tree-node-tag)}.ck-inspector-tree .ck-inspector-tree-node:not(.ck-inspector-tree-node_tagless) .ck-inspector-tree-node__name .ck-inspector-tree-node__name__bracket_close:after{content:">";color:var(--ck-inspector-color-tree-node-tag)}.ck-inspector-tree .ck-inspector-tree-node:not(.ck-inspector-tree-node_tagless).ck-inspector-tree-node_empty .ck-inspector-tree-node__name:after{content:" />"}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_tagless .ck-inspector-tree-node__content{display:none}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name:not(.ck-inspector-tree-node__name_close),.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name:not(.ck-inspector-tree-node__name_close) :not(.ck-inspector-tree__position),.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name:not(.ck-inspector-tree-node__name_close)>.ck-inspector-tree-node__name__bracket:after{background:var(--ck-inspector-color-tree-node-name-active-bg);color:var(--ck-inspector-color-white)}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__content,.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name_close{background:var(--ck-inspector-color-tree-node-active-bg)}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__content{border-left-color:var(--ck-inspector-color-tree-node-name-active-bg)}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name{border-left:1px solid var(--ck-inspector-color-tree-node-name-active-bg)}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_disabled{opacity:.8}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_disabled .ck-inspector-tree-node__name,.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_disabled .ck-inspector-tree-node__name *{color:var(--ck-inspector-color-tree-node-inactive)}.ck-inspector-tree .ck-inspector-tree-text{display:block;margin-bottom:1px}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-node__content{border:1px dotted var(--ck-inspector-color-tree-text-border);border-radius:2px;padding:0 1px;margin-right:1px;display:inline-block;word-break:break-all}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes:not(:empty){margin-right:.5em}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes .ck-inspector-tree-node__attribute{background:var(--ck-inspector-color-tree-node-attribute-name);border-radius:2px;padding:0 .5em}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes .ck-inspector-tree-node__attribute+.ck-inspector-tree-node__attribute{margin-left:.2em}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes .ck-inspector-tree-node__attribute>*{color:var(--ck-inspector-color-white)}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes .ck-inspector-tree-node__attribute:first-child{margin-left:0}.ck-inspector-tree .ck-inspector-tree-text.ck-inspector-tree-node_active .ck-inspector-tree-node__content{border-style:solid;border-color:var(--ck-inspector-color-tree-node-name-active-bg)}.ck-inspector-tree .ck-inspector-tree-text.ck-inspector-tree-node_active .ck-inspector-tree-node__attribute{background:var(--ck-inspector-color-white)}.ck-inspector-tree .ck-inspector-tree-text.ck-inspector-tree-node_active .ck-inspector-tree-node__attribute>*{color:var(--ck-inspector-color-tree-node-name-active-bg)}.ck-inspector-tree .ck-inspector-tree-text.ck-inspector-tree-node_active>.ck-inspector-tree-node__content{background:var(--ck-inspector-color-tree-node-name-active-bg);color:var(--ck-inspector-color-white)}.ck-inspector-tree .ck-inspector-tree-text:not(.ck-inspector-tree-node_active) .ck-inspector-tree-node__content:hover{background:var(--ck-inspector-color-tree-node-hover);border-style:solid;border-color:var(--ck-inspector-color-tree-node-border-hover)}.ck-inspector-tree.ck-inspector-tree_text-direction_ltr .ck-inspector-tree-node__content{direction:ltr}.ck-inspector-tree.ck-inspector-tree_text-direction_rtl .ck-inspector-tree-node__content{direction:rtl}.ck-inspector-tree.ck-inspector-tree_text-direction_rtl .ck-inspector-tree-node__content .ck-inspector-tree-node__name{direction:ltr}.ck-inspector-tree.ck-inspector-tree_text-direction_rtl .ck-inspector-tree__position{transform:rotate(180deg)}.ck-inspector-tree .ck-inspector-tree-comment{color:var(--ck-inspector-color-comment);font-style:italic}.ck-inspector-tree .ck-inspector-tree-comment a{color:inherit;text-decoration:underline}.ck-inspector-tree_compact-text .ck-inspector-tree-text,.ck-inspector-tree_compact-text .ck-inspector-tree-text .ck-inspector-tree-node__content{display:inline}.ck-inspector .ck-inspector__tree__navigation{padding:.5em 1em;border-bottom:1px solid var(--ck-inspector-color-border)}.ck-inspector .ck-inspector__tree__navigation label{margin-right:.5em}.ck-inspector-tree .ck-inspector-tree__position{display:inline-block;position:relative;cursor:default;height:100%;pointer-events:none;vertical-align:top}.ck-inspector-tree .ck-inspector-tree__position:after{content:"";position:absolute;border:1px solid var(--ck-inspector-color-tree-position);width:0;top:0;bottom:0;margin-left:-1px}.ck-inspector-tree .ck-inspector-tree__position:before{margin-left:-1px}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_selection{z-index:2;--ck-inspector-color-tree-position:var(--ck-inspector-color-tree-selection)}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_selection:before{content:"";position:absolute;top:-1px;bottom:-1px;left:0;border-top:2px solid var(--ck-inspector-color-tree-position);border-bottom:2px solid var(--ck-inspector-color-tree-position);width:8px}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_selection.ck-inspector-tree__position_end:before{right:-1px;left:auto}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_marker{z-index:1}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_marker:before{content:"";display:block;position:absolute;left:0;top:-1px;cursor:default;width:0;height:0;border-left:0 solid transparent;border-bottom:0 solid transparent;border-right:7px solid transparent;border-top:7px solid var(--ck-inspector-color-tree-position)}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_marker.ck-inspector-tree__position_end:before{border-width:0 7px 7px 0;border-left-color:transparent;border-bottom-color:transparent;border-right-color:var(--ck-inspector-color-tree-position);border-top-color:transparent;left:-5px}`, ""]);
      }, function(E, s, h) {
        Object.defineProperty(s, "__esModule", { value: !0 }), s.canUseDOM = s.SafeNodeList = s.SafeHTMLCollection = void 0;
        var u, o = h(82), O = ((u = o) && u.__esModule ? u : { default: u }).default, m = O.canUseDOM ? window.HTMLElement : {};
        s.SafeHTMLCollection = O.canUseDOM ? window.HTMLCollection : {}, s.SafeNodeList = O.canUseDOM ? window.NodeList : {}, s.canUseDOM = O.canUseDOM, s.default = m;
      }, function(E, s, h) {
        var u = h(6), o = h(38);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[E.i, o, ""]]);
        var O = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        u(o, O), E.exports = o.locals || {};
      }, function(E, s, h) {
        (E.exports = h(7)(!1)).push([E.i, `.ck-inspector,.ck-inspector-portal{--ck-inspector-color-white:#fff;--ck-inspector-color-black:#000;--ck-inspector-color-background:#f3f3f3;--ck-inspector-color-link:#005cc6;--ck-inspector-code-font-size:11px;--ck-inspector-code-font-family:monaco,Consolas,Lucida Console,monospace;--ck-inspector-color-border:#d0d0d0}.ck-inspector,.ck-inspector-portal,.ck-inspector-portal :not(select),.ck-inspector :not(select){box-sizing:border-box;width:auto;height:auto;position:static;margin:0;padding:0;border:0;background:transparent;text-decoration:none;transition:none;word-wrap:break-word;font-family:Arial,Helvetica Neue,Helvetica,sans-serif;font-size:12px;line-height:17px;font-weight:400;-webkit-font-smoothing:auto}.ck-inspector{overflow:hidden;border-collapse:collapse;color:var(--ck-inspector-color-black);text-align:left;white-space:normal;cursor:auto;float:none;background:var(--ck-inspector-color-background);border-top:1px solid var(--ck-inspector-color-border);z-index:9999}.ck-inspector.ck-inspector_collapsed>.ck-inspector-navbox>.ck-inspector-navbox__navigation .ck-inspector-horizontal-nav{display:none}.ck-inspector .ck-inspector-navbox__navigation__logo{background-size:contain;background-repeat:no-repeat;background-position:50%;display:block;overflow:hidden;text-indent:100px;align-self:center;white-space:nowrap;margin-right:1em;background-image:url("data:image/svg+xml;charset=utf-8,%3Csvg width='68' height='64' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M43.71 11.025a11.508 11.508 0 00-1.213 5.159c0 6.42 5.244 11.625 11.713 11.625.083 0 .167 0 .25-.002v16.282a5.464 5.464 0 01-2.756 4.739L30.986 60.7a5.548 5.548 0 01-5.512 0L4.756 48.828A5.464 5.464 0 012 44.089V20.344c0-1.955 1.05-3.76 2.756-4.738L25.474 3.733a5.548 5.548 0 015.512 0l12.724 7.292z' fill='%23FFF'/%3E%3Cpath d='M45.684 8.79a12.604 12.604 0 00-1.329 5.65c0 7.032 5.744 12.733 12.829 12.733.091 0 .183-.001.274-.003v17.834a5.987 5.987 0 01-3.019 5.19L31.747 63.196a6.076 6.076 0 01-6.037 0L3.02 50.193A5.984 5.984 0 010 45.003V18.997c0-2.14 1.15-4.119 3.019-5.19L25.71.804a6.076 6.076 0 016.037 0L45.684 8.79zm-29.44 11.89c-.834 0-1.51.671-1.51 1.498v.715c0 .828.676 1.498 1.51 1.498h25.489c.833 0 1.51-.67 1.51-1.498v-.715c0-.827-.677-1.498-1.51-1.498h-25.49zm0 9.227c-.834 0-1.51.671-1.51 1.498v.715c0 .828.676 1.498 1.51 1.498h18.479c.833 0 1.509-.67 1.509-1.498v-.715c0-.827-.676-1.498-1.51-1.498H16.244zm0 9.227c-.834 0-1.51.671-1.51 1.498v.715c0 .828.676 1.498 1.51 1.498h25.489c.833 0 1.51-.67 1.51-1.498v-.715c0-.827-.677-1.498-1.51-1.498h-25.49zm41.191-14.459c-5.835 0-10.565-4.695-10.565-10.486 0-5.792 4.73-10.487 10.565-10.487C63.27 3.703 68 8.398 68 14.19c0 5.791-4.73 10.486-10.565 10.486zm3.422-8.68c0-.467-.084-.875-.251-1.225a2.547 2.547 0 00-.686-.88 2.888 2.888 0 00-1.026-.531 4.418 4.418 0 00-1.259-.175c-.134 0-.283.006-.447.018a2.72 2.72 0 00-.446.07l.075-1.4h3.587v-1.8h-5.462l-.214 5.06c.319-.116.682-.21 1.089-.28.406-.071.77-.107 1.088-.107.218 0 .437.021.655.063.218.041.413.114.585.218s.313.244.422.419c.109.175.163.391.163.65 0 .424-.132.745-.396.961a1.434 1.434 0 01-.938.325c-.352 0-.656-.1-.912-.3-.256-.2-.43-.453-.523-.762l-1.925.588c.1.35.258.664.472.943.214.279.47.514.767.706.298.191.63.339.995.443.365.104.749.156 1.151.156.437 0 .86-.064 1.272-.193.41-.13.778-.323 1.1-.581a2.8 2.8 0 00.775-.981c.193-.396.29-.864.29-1.405z' fill='%231EBC61' fill-rule='nonzero'/%3E%3C/g%3E%3C/svg%3E");width:1.8em;height:1.8em;margin-left:1em}.ck-inspector .ck-inspector-navbox__navigation__toggle{margin-right:1em}.ck-inspector .ck-inspector-navbox__navigation__toggle.ck-inspector-navbox__navigation__toggle_up{transform:rotate(180deg)}.ck-inspector .ck-inspector-editor-selector{margin-left:auto;margin-right:.3em}@media screen and (max-width:680px){.ck-inspector .ck-inspector-editor-selector label{display:none}}.ck-inspector .ck-inspector-editor-selector select{margin-left:.5em}.ck-inspector .ck-inspector-code,.ck-inspector .ck-inspector-code *{font-size:var(--ck-inspector-code-font-size);font-family:var(--ck-inspector-code-font-family);cursor:default}.ck-inspector a{color:var(--ck-inspector-color-link);text-decoration:none}.ck-inspector a:hover{text-decoration:underline;cursor:pointer}.ck-inspector button{outline:0}.ck-inspector .ck-inspector-separator{border-right:1px solid var(--ck-inspector-color-border);display:inline-block;width:0;height:20px;margin:0 .5em;vertical-align:middle}`, ""]);
      }, function(E, s, h) {
        var u = h(49), o = { childContextTypes: !0, contextType: !0, contextTypes: !0, defaultProps: !0, displayName: !0, getDefaultProps: !0, getDerivedStateFromError: !0, getDerivedStateFromProps: !0, mixins: !0, propTypes: !0, type: !0 }, O = { name: !0, length: !0, prototype: !0, caller: !0, callee: !0, arguments: !0, arity: !0 }, m = { $$typeof: !0, compare: !0, defaultProps: !0, displayName: !0, propTypes: !0, type: !0 }, g = {};
        function y(j) {
          return u.isMemo(j) ? m : g[j.$$typeof] || o;
        }
        g[u.ForwardRef] = { $$typeof: !0, render: !0, defaultProps: !0, displayName: !0, propTypes: !0 }, g[u.Memo] = m;
        var b = Object.defineProperty, S = Object.getOwnPropertyNames, T = Object.getOwnPropertySymbols, P = Object.getOwnPropertyDescriptor, Z = Object.getPrototypeOf, Q = Object.prototype;
        E.exports = function j(W, N, A) {
          if (typeof N != "string") {
            if (Q) {
              var F = Z(N);
              F && F !== Q && j(W, F, A);
            }
            var R = S(N);
            T && (R = R.concat(T(N)));
            for (var oe = y(W), K = y(N), I = 0; I < R.length; ++I) {
              var M = R[I];
              if (!(O[M] || A && A[M] || K && K[M] || oe && oe[M])) {
                var se = P(N, M);
                try {
                  b(W, M, se);
                } catch {
                }
              }
            }
          }
          return W;
        };
      }, function(E, s, h) {
        Object.defineProperty(s, "__esModule", { value: !0 }), s.getBoundPosition = function(m, g, y) {
          if (!m.props.bounds) return [g, y];
          var b = m.props.bounds;
          b = typeof b == "string" ? b : function(W) {
            return { left: W.left, top: W.top, right: W.right, bottom: W.bottom };
          }(b);
          var S = O(m);
          if (typeof b == "string") {
            var T, P = S.ownerDocument, Z = P.defaultView;
            if (!((T = b === "parent" ? S.parentNode : P.querySelector(b)) instanceof Z.HTMLElement)) throw new Error('Bounds selector "' + b + '" could not find an element.');
            var Q = Z.getComputedStyle(S), j = Z.getComputedStyle(T);
            b = { left: -S.offsetLeft + (0, u.int)(j.paddingLeft) + (0, u.int)(Q.marginLeft), top: -S.offsetTop + (0, u.int)(j.paddingTop) + (0, u.int)(Q.marginTop), right: (0, o.innerWidth)(T) - (0, o.outerWidth)(S) - S.offsetLeft + (0, u.int)(j.paddingRight) - (0, u.int)(Q.marginRight), bottom: (0, o.innerHeight)(T) - (0, o.outerHeight)(S) - S.offsetTop + (0, u.int)(j.paddingBottom) - (0, u.int)(Q.marginBottom) };
          }
          return (0, u.isNum)(b.right) && (g = Math.min(g, b.right)), (0, u.isNum)(b.bottom) && (y = Math.min(y, b.bottom)), (0, u.isNum)(b.left) && (g = Math.max(g, b.left)), (0, u.isNum)(b.top) && (y = Math.max(y, b.top)), [g, y];
        }, s.snapToGrid = function(m, g, y) {
          var b = Math.round(g / m[0]) * m[0], S = Math.round(y / m[1]) * m[1];
          return [b, S];
        }, s.canDragX = function(m) {
          return m.props.axis === "both" || m.props.axis === "x";
        }, s.canDragY = function(m) {
          return m.props.axis === "both" || m.props.axis === "y";
        }, s.getControlPosition = function(m, g, y) {
          var b = typeof g == "number" ? (0, o.getTouch)(m, g) : null;
          if (typeof g == "number" && !b) return null;
          var S = O(y), T = y.props.offsetParent || S.offsetParent || S.ownerDocument.body;
          return (0, o.offsetXYFromParent)(b || m, T, y.props.scale);
        }, s.createCoreData = function(m, g, y) {
          var b = m.state, S = !(0, u.isNum)(b.lastX), T = O(m);
          return S ? { node: T, deltaX: 0, deltaY: 0, lastX: g, lastY: y, x: g, y } : { node: T, deltaX: g - b.lastX, deltaY: y - b.lastY, lastX: b.lastX, lastY: b.lastY, x: g, y };
        }, s.createDraggableData = function(m, g) {
          var y = m.props.scale;
          return { node: g.node, x: m.state.x + g.deltaX / y, y: m.state.y + g.deltaY / y, deltaX: g.deltaX / y, deltaY: g.deltaY / y, lastX: m.state.x, lastY: m.state.y };
        };
        var u = h(20), o = h(32);
        function O(m) {
          var g = m.findDOMNode();
          if (!g) throw new Error("<DraggableCore>: Unmounted during event!");
          return g;
        }
      }, function(E, s, h) {
        Object.defineProperty(s, "__esModule", { value: !0 }), s.default = function() {
        };
      }, function(E, s, h) {
        Object.defineProperty(s, "__esModule", { value: !0 }), s.default = function g(y) {
          return [].slice.call(y.querySelectorAll("*"), 0).reduce(function(b, S) {
            return b.concat(S.shadowRoot ? g(S.shadowRoot) : [S]);
          }, []).filter(m);
        };
        var u = /input|select|textarea|button|object|iframe/;
        function o(g) {
          var y = g.offsetWidth <= 0 && g.offsetHeight <= 0;
          if (y && !g.innerHTML) return !0;
          try {
            var b = window.getComputedStyle(g);
            return y ? b.getPropertyValue("overflow") !== "visible" || g.scrollWidth <= 0 && g.scrollHeight <= 0 : b.getPropertyValue("display") == "none";
          } catch {
            return console.warn("Failed to inspect element style"), !1;
          }
        }
        function O(g, y) {
          var b = g.nodeName.toLowerCase();
          return (u.test(b) && !g.disabled || b === "a" && g.href || y) && function(S) {
            for (var T = S, P = S.getRootNode && S.getRootNode(); T && T !== document.body; ) {
              if (P && T === P && (T = P.host.parentNode), o(T)) return !1;
              T = T.parentNode;
            }
            return !0;
          }(g);
        }
        function m(g) {
          var y = g.getAttribute("tabindex");
          y === null && (y = void 0);
          var b = isNaN(y);
          return (b || y >= 0) && O(g, !b);
        }
        E.exports = s.default;
      }, function(E, s, h) {
        Object.defineProperty(s, "__esModule", { value: !0 }), s.resetState = function() {
          g && (g.removeAttribute ? g.removeAttribute("aria-hidden") : g.length != null ? g.forEach(function(S) {
            return S.removeAttribute("aria-hidden");
          }) : document.querySelectorAll(g).forEach(function(S) {
            return S.removeAttribute("aria-hidden");
          })), g = null;
        }, s.log = function() {
        }, s.assertNodeList = y, s.setElement = function(S) {
          var T = S;
          if (typeof T == "string" && m.canUseDOM) {
            var P = document.querySelectorAll(T);
            y(P, T), T = P;
          }
          return g = T || g;
        }, s.validateElement = b, s.hide = function(S) {
          var T = !0, P = !1, Z = void 0;
          try {
            for (var Q, j = b(S)[Symbol.iterator](); !(T = (Q = j.next()).done); T = !0)
              Q.value.setAttribute("aria-hidden", "true");
          } catch (W) {
            P = !0, Z = W;
          } finally {
            try {
              !T && j.return && j.return();
            } finally {
              if (P) throw Z;
            }
          }
        }, s.show = function(S) {
          var T = !0, P = !1, Z = void 0;
          try {
            for (var Q, j = b(S)[Symbol.iterator](); !(T = (Q = j.next()).done); T = !0)
              Q.value.removeAttribute("aria-hidden");
          } catch (W) {
            P = !0, Z = W;
          } finally {
            try {
              !T && j.return && j.return();
            } finally {
              if (P) throw Z;
            }
          }
        }, s.documentNotReadyOrSSRTesting = function() {
          g = null;
        };
        var u, o = h(81), O = (u = o) && u.__esModule ? u : { default: u }, m = h(36), g = null;
        function y(S, T) {
          if (!S || !S.length) throw new Error("react-modal: No elements were found for selector " + T + ".");
        }
        function b(S) {
          var T = S || g;
          return T ? Array.isArray(T) || T instanceof HTMLCollection || T instanceof NodeList ? T : [T] : ((0, O.default)(!1, ["react-modal: App element is not defined.", "Please use `Modal.setAppElement(el)` or set `appElement={el}`.", "This is needed so screen readers don't see main content", "when modal is opened. It is not recommended, but you can opt-out", "by setting `ariaHideApp={false}`."].join(" ")), []);
        }
      }, function(E, s, h) {
        Object.defineProperty(s, "__esModule", { value: !0 }), s.log = function() {
          console.log("portalOpenInstances ----------"), console.log(o.openInstances.length), o.openInstances.forEach(function(O) {
            return console.log(O);
          }), console.log("end portalOpenInstances ----------");
        }, s.resetState = function() {
          o = new u();
        };
        var u = function O() {
          var m = this;
          (function(g, y) {
            if (!(g instanceof y)) throw new TypeError("Cannot call a class as a function");
          })(this, O), this.register = function(g) {
            m.openInstances.indexOf(g) === -1 && (m.openInstances.push(g), m.emit("register"));
          }, this.deregister = function(g) {
            var y = m.openInstances.indexOf(g);
            y !== -1 && (m.openInstances.splice(y, 1), m.emit("deregister"));
          }, this.subscribe = function(g) {
            m.subscribers.push(g);
          }, this.emit = function(g) {
            m.subscribers.forEach(function(y) {
              return y(g, m.openInstances.slice());
            });
          }, this.openInstances = [], this.subscribers = [];
        }, o = new u();
        s.default = o;
      }, function(E, s, h) {
        E.exports = h(51);
      }, function(E, s, h) {
        var u = h(52), o = u.default, O = u.DraggableCore;
        E.exports = o, E.exports.default = o, E.exports.DraggableCore = O;
      }, function(E, s, h) {
        var u = h(76), o = { "text/plain": "Text", "text/html": "Url", default: "Text" };
        E.exports = function(O, m) {
          var g, y, b, S, T, P, Z = !1;
          m || (m = {}), g = m.debug || !1;
          try {
            if (b = u(), S = document.createRange(), T = document.getSelection(), (P = document.createElement("span")).textContent = O, P.style.all = "unset", P.style.position = "fixed", P.style.top = 0, P.style.clip = "rect(0, 0, 0, 0)", P.style.whiteSpace = "pre", P.style.webkitUserSelect = "text", P.style.MozUserSelect = "text", P.style.msUserSelect = "text", P.style.userSelect = "text", P.addEventListener("copy", function(Q) {
              if (Q.stopPropagation(), m.format) if (Q.preventDefault(), Q.clipboardData === void 0) {
                g && console.warn("unable to use e.clipboardData"), g && console.warn("trying IE specific stuff"), window.clipboardData.clearData();
                var j = o[m.format] || o.default;
                window.clipboardData.setData(j, O);
              } else Q.clipboardData.clearData(), Q.clipboardData.setData(m.format, O);
              m.onCopy && (Q.preventDefault(), m.onCopy(Q.clipboardData));
            }), document.body.appendChild(P), S.selectNodeContents(P), T.addRange(S), !document.execCommand("copy")) throw new Error("copy command was unsuccessful");
            Z = !0;
          } catch (Q) {
            g && console.error("unable to copy using execCommand: ", Q), g && console.warn("trying IE specific stuff");
            try {
              window.clipboardData.setData(m.format || "text", O), m.onCopy && m.onCopy(window.clipboardData), Z = !0;
            } catch (j) {
              g && console.error("unable to copy using clipboardData: ", j), g && console.error("falling back to prompt"), y = function(W) {
                var N = (/mac os x/i.test(navigator.userAgent) ? "⌘" : "Ctrl") + "+C";
                return W.replace(/#{\s*key\s*}/g, N);
              }("message" in m ? m.message : "Copy to clipboard: #{key}, Enter"), window.prompt(y, O);
            }
          } finally {
            T && (typeof T.removeRange == "function" ? T.removeRange(S) : T.removeAllRanges()), P && document.body.removeChild(P), b();
          }
          return Z;
        };
      }, function(E, s, h) {
        Object.defineProperty(s, "__esModule", { value: !0 });
        var u, o = h(77), O = (u = o) && u.__esModule ? u : { default: u };
        s.default = O.default, E.exports = s.default;
      }, function(E, s, h) {
        E.exports = h(50);
      }, function(E, s, h) {
        var u = typeof Symbol == "function" && Symbol.for, o = u ? Symbol.for("react.element") : 60103, O = u ? Symbol.for("react.portal") : 60106, m = u ? Symbol.for("react.fragment") : 60107, g = u ? Symbol.for("react.strict_mode") : 60108, y = u ? Symbol.for("react.profiler") : 60114, b = u ? Symbol.for("react.provider") : 60109, S = u ? Symbol.for("react.context") : 60110, T = u ? Symbol.for("react.async_mode") : 60111, P = u ? Symbol.for("react.concurrent_mode") : 60111, Z = u ? Symbol.for("react.forward_ref") : 60112, Q = u ? Symbol.for("react.suspense") : 60113, j = u ? Symbol.for("react.suspense_list") : 60120, W = u ? Symbol.for("react.memo") : 60115, N = u ? Symbol.for("react.lazy") : 60116, A = u ? Symbol.for("react.block") : 60121, F = u ? Symbol.for("react.fundamental") : 60117, R = u ? Symbol.for("react.responder") : 60118, oe = u ? Symbol.for("react.scope") : 60119;
        function K(M) {
          if (typeof M == "object" && M !== null) {
            var se = M.$$typeof;
            switch (se) {
              case o:
                switch (M = M.type) {
                  case T:
                  case P:
                  case m:
                  case y:
                  case g:
                  case Q:
                    return M;
                  default:
                    switch (M = M && M.$$typeof) {
                      case S:
                      case Z:
                      case N:
                      case W:
                      case b:
                        return M;
                      default:
                        return se;
                    }
                }
              case O:
                return se;
            }
          }
        }
        function I(M) {
          return K(M) === P;
        }
        s.AsyncMode = T, s.ConcurrentMode = P, s.ContextConsumer = S, s.ContextProvider = b, s.Element = o, s.ForwardRef = Z, s.Fragment = m, s.Lazy = N, s.Memo = W, s.Portal = O, s.Profiler = y, s.StrictMode = g, s.Suspense = Q, s.isAsyncMode = function(M) {
          return I(M) || K(M) === T;
        }, s.isConcurrentMode = I, s.isContextConsumer = function(M) {
          return K(M) === S;
        }, s.isContextProvider = function(M) {
          return K(M) === b;
        }, s.isElement = function(M) {
          return typeof M == "object" && M !== null && M.$$typeof === o;
        }, s.isForwardRef = function(M) {
          return K(M) === Z;
        }, s.isFragment = function(M) {
          return K(M) === m;
        }, s.isLazy = function(M) {
          return K(M) === N;
        }, s.isMemo = function(M) {
          return K(M) === W;
        }, s.isPortal = function(M) {
          return K(M) === O;
        }, s.isProfiler = function(M) {
          return K(M) === y;
        }, s.isStrictMode = function(M) {
          return K(M) === g;
        }, s.isSuspense = function(M) {
          return K(M) === Q;
        }, s.isValidElementType = function(M) {
          return typeof M == "string" || typeof M == "function" || M === m || M === P || M === y || M === g || M === Q || M === j || typeof M == "object" && M !== null && (M.$$typeof === N || M.$$typeof === W || M.$$typeof === b || M.$$typeof === S || M.$$typeof === Z || M.$$typeof === F || M.$$typeof === R || M.$$typeof === oe || M.$$typeof === A);
        }, s.typeOf = K;
      }, function(E, s, h) {
        var u = 60103, o = 60106, O = 60107, m = 60108, g = 60114, y = 60109, b = 60110, S = 60112, T = 60113, P = 60120, Z = 60115, Q = 60116, j = 60121, W = 60122, N = 60117, A = 60129, F = 60131;
        if (typeof Symbol == "function" && Symbol.for) {
          var R = Symbol.for;
          u = R("react.element"), o = R("react.portal"), O = R("react.fragment"), m = R("react.strict_mode"), g = R("react.profiler"), y = R("react.provider"), b = R("react.context"), S = R("react.forward_ref"), T = R("react.suspense"), P = R("react.suspense_list"), Z = R("react.memo"), Q = R("react.lazy"), j = R("react.block"), W = R("react.server.block"), N = R("react.fundamental"), A = R("react.debug_trace_mode"), F = R("react.legacy_hidden");
        }
        function oe(D) {
          if (typeof D == "object" && D !== null) {
            var ie = D.$$typeof;
            switch (ie) {
              case u:
                switch (D = D.type) {
                  case O:
                  case g:
                  case m:
                  case T:
                  case P:
                    return D;
                  default:
                    switch (D = D && D.$$typeof) {
                      case b:
                      case S:
                      case Q:
                      case Z:
                      case y:
                        return D;
                      default:
                        return ie;
                    }
                }
              case o:
                return ie;
            }
          }
        }
        var K = y, I = u, M = S, se = O, le = Q, te = Z, ce = o, ye = g, J = m, fe = T;
        s.ContextConsumer = b, s.ContextProvider = K, s.Element = I, s.ForwardRef = M, s.Fragment = se, s.Lazy = le, s.Memo = te, s.Portal = ce, s.Profiler = ye, s.StrictMode = J, s.Suspense = fe, s.isAsyncMode = function() {
          return !1;
        }, s.isConcurrentMode = function() {
          return !1;
        }, s.isContextConsumer = function(D) {
          return oe(D) === b;
        }, s.isContextProvider = function(D) {
          return oe(D) === y;
        }, s.isElement = function(D) {
          return typeof D == "object" && D !== null && D.$$typeof === u;
        }, s.isForwardRef = function(D) {
          return oe(D) === S;
        }, s.isFragment = function(D) {
          return oe(D) === O;
        }, s.isLazy = function(D) {
          return oe(D) === Q;
        }, s.isMemo = function(D) {
          return oe(D) === Z;
        }, s.isPortal = function(D) {
          return oe(D) === o;
        }, s.isProfiler = function(D) {
          return oe(D) === g;
        }, s.isStrictMode = function(D) {
          return oe(D) === m;
        }, s.isSuspense = function(D) {
          return oe(D) === T;
        }, s.isValidElementType = function(D) {
          return typeof D == "string" || typeof D == "function" || D === O || D === g || D === A || D === m || D === T || D === P || D === F || typeof D == "object" && D !== null && (D.$$typeof === Q || D.$$typeof === Z || D.$$typeof === y || D.$$typeof === b || D.$$typeof === S || D.$$typeof === N || D.$$typeof === j || D[0] === W);
        }, s.typeOf = oe;
      }, function(E, s, h) {
        Object.defineProperty(s, "__esModule", { value: !0 }), Object.defineProperty(s, "DraggableCore", { enumerable: !0, get: function() {
          return S.default;
        } }), s.default = void 0;
        var u = function(J) {
          if (J && J.__esModule) return J;
          if (J === null || Q(J) !== "object" && typeof J != "function") return { default: J };
          var fe = Z();
          if (fe && fe.has(J)) return fe.get(J);
          var D = {}, ie = Object.defineProperty && Object.getOwnPropertyDescriptor;
          for (var be in J) if (Object.prototype.hasOwnProperty.call(J, be)) {
            var Ce = ie ? Object.getOwnPropertyDescriptor(J, be) : null;
            Ce && (Ce.get || Ce.set) ? Object.defineProperty(D, be, Ce) : D[be] = J[be];
          }
          return D.default = J, fe && fe.set(J, D), D;
        }(h(0)), o = P(h(18)), O = P(h(12)), m = P(h(55)), g = h(32), y = h(40), b = h(20), S = P(h(57)), T = P(h(41));
        function P(J) {
          return J && J.__esModule ? J : { default: J };
        }
        function Z() {
          if (typeof WeakMap != "function") return null;
          var J = /* @__PURE__ */ new WeakMap();
          return Z = function() {
            return J;
          }, J;
        }
        function Q(J) {
          return (Q = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(fe) {
            return typeof fe;
          } : function(fe) {
            return fe && typeof Symbol == "function" && fe.constructor === Symbol && fe !== Symbol.prototype ? "symbol" : typeof fe;
          })(J);
        }
        function j() {
          return (j = Object.assign || function(J) {
            for (var fe = 1; fe < arguments.length; fe++) {
              var D = arguments[fe];
              for (var ie in D) Object.prototype.hasOwnProperty.call(D, ie) && (J[ie] = D[ie]);
            }
            return J;
          }).apply(this, arguments);
        }
        function W(J, fe) {
          if (J == null) return {};
          var D, ie, be = function(ke, Ne) {
            if (ke == null) return {};
            var xe, ze, Je = {}, G = Object.keys(ke);
            for (ze = 0; ze < G.length; ze++) xe = G[ze], Ne.indexOf(xe) >= 0 || (Je[xe] = ke[xe]);
            return Je;
          }(J, fe);
          if (Object.getOwnPropertySymbols) {
            var Ce = Object.getOwnPropertySymbols(J);
            for (ie = 0; ie < Ce.length; ie++) D = Ce[ie], fe.indexOf(D) >= 0 || Object.prototype.propertyIsEnumerable.call(J, D) && (be[D] = J[D]);
          }
          return be;
        }
        function N(J, fe) {
          return function(D) {
            if (Array.isArray(D)) return D;
          }(J) || function(D, ie) {
            if (!(typeof Symbol > "u" || !(Symbol.iterator in Object(D)))) {
              var be = [], Ce = !0, ke = !1, Ne = void 0;
              try {
                for (var xe, ze = D[Symbol.iterator](); !(Ce = (xe = ze.next()).done) && (be.push(xe.value), !ie || be.length !== ie); Ce = !0) ;
              } catch (Je) {
                ke = !0, Ne = Je;
              } finally {
                try {
                  Ce || ze.return == null || ze.return();
                } finally {
                  if (ke) throw Ne;
                }
              }
              return be;
            }
          }(J, fe) || function(D, ie) {
            if (D) {
              if (typeof D == "string") return A(D, ie);
              var be = Object.prototype.toString.call(D).slice(8, -1);
              if (be === "Object" && D.constructor && (be = D.constructor.name), be === "Map" || be === "Set") return Array.from(D);
              if (be === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(be)) return A(D, ie);
            }
          }(J, fe) || function() {
            throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
          }();
        }
        function A(J, fe) {
          (fe == null || fe > J.length) && (fe = J.length);
          for (var D = 0, ie = new Array(fe); D < fe; D++) ie[D] = J[D];
          return ie;
        }
        function F(J, fe) {
          var D = Object.keys(J);
          if (Object.getOwnPropertySymbols) {
            var ie = Object.getOwnPropertySymbols(J);
            fe && (ie = ie.filter(function(be) {
              return Object.getOwnPropertyDescriptor(J, be).enumerable;
            })), D.push.apply(D, ie);
          }
          return D;
        }
        function R(J) {
          for (var fe = 1; fe < arguments.length; fe++) {
            var D = arguments[fe] != null ? arguments[fe] : {};
            fe % 2 ? F(Object(D), !0).forEach(function(ie) {
              ce(J, ie, D[ie]);
            }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(J, Object.getOwnPropertyDescriptors(D)) : F(Object(D)).forEach(function(ie) {
              Object.defineProperty(J, ie, Object.getOwnPropertyDescriptor(D, ie));
            });
          }
          return J;
        }
        function oe(J, fe) {
          for (var D = 0; D < fe.length; D++) {
            var ie = fe[D];
            ie.enumerable = ie.enumerable || !1, ie.configurable = !0, "value" in ie && (ie.writable = !0), Object.defineProperty(J, ie.key, ie);
          }
        }
        function K(J, fe, D) {
          return fe && oe(J.prototype, fe), D && oe(J, D), J;
        }
        function I(J, fe) {
          return (I = Object.setPrototypeOf || function(D, ie) {
            return D.__proto__ = ie, D;
          })(J, fe);
        }
        function M(J) {
          var fe = function() {
            if (typeof Reflect > "u" || !Reflect.construct || Reflect.construct.sham) return !1;
            if (typeof Proxy == "function") return !0;
            try {
              return Date.prototype.toString.call(Reflect.construct(Date, [], function() {
              })), !0;
            } catch {
              return !1;
            }
          }();
          return function() {
            var D, ie = te(J);
            if (fe) {
              var be = te(this).constructor;
              D = Reflect.construct(ie, arguments, be);
            } else D = ie.apply(this, arguments);
            return se(this, D);
          };
        }
        function se(J, fe) {
          return !fe || Q(fe) !== "object" && typeof fe != "function" ? le(J) : fe;
        }
        function le(J) {
          if (J === void 0) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
          return J;
        }
        function te(J) {
          return (te = Object.setPrototypeOf ? Object.getPrototypeOf : function(fe) {
            return fe.__proto__ || Object.getPrototypeOf(fe);
          })(J);
        }
        function ce(J, fe, D) {
          return fe in J ? Object.defineProperty(J, fe, { value: D, enumerable: !0, configurable: !0, writable: !0 }) : J[fe] = D, J;
        }
        var ye = function(J) {
          (function(ie, be) {
            if (typeof be != "function" && be !== null) throw new TypeError("Super expression must either be null or a function");
            ie.prototype = Object.create(be && be.prototype, { constructor: { value: ie, writable: !0, configurable: !0 } }), be && I(ie, be);
          })(D, J);
          var fe = M(D);
          function D(ie) {
            var be;
            return function(Ce, ke) {
              if (!(Ce instanceof ke)) throw new TypeError("Cannot call a class as a function");
            }(this, D), ce(le(be = fe.call(this, ie)), "onDragStart", function(Ce, ke) {
              if ((0, T.default)("Draggable: onDragStart: %j", ke), be.props.onStart(Ce, (0, y.createDraggableData)(le(be), ke)) === !1) return !1;
              be.setState({ dragging: !0, dragged: !0 });
            }), ce(le(be), "onDrag", function(Ce, ke) {
              if (!be.state.dragging) return !1;
              (0, T.default)("Draggable: onDrag: %j", ke);
              var Ne = (0, y.createDraggableData)(le(be), ke), xe = { x: Ne.x, y: Ne.y };
              if (be.props.bounds) {
                var ze = xe.x, Je = xe.y;
                xe.x += be.state.slackX, xe.y += be.state.slackY;
                var G = N((0, y.getBoundPosition)(le(be), xe.x, xe.y), 2), Y = G[0], me = G[1];
                xe.x = Y, xe.y = me, xe.slackX = be.state.slackX + (ze - xe.x), xe.slackY = be.state.slackY + (Je - xe.y), Ne.x = xe.x, Ne.y = xe.y, Ne.deltaX = xe.x - be.state.x, Ne.deltaY = xe.y - be.state.y;
              }
              if (be.props.onDrag(Ce, Ne) === !1) return !1;
              be.setState(xe);
            }), ce(le(be), "onDragStop", function(Ce, ke) {
              if (!be.state.dragging || be.props.onStop(Ce, (0, y.createDraggableData)(le(be), ke)) === !1) return !1;
              (0, T.default)("Draggable: onDragStop: %j", ke);
              var Ne = { dragging: !1, slackX: 0, slackY: 0 };
              if (be.props.position) {
                var xe = be.props.position, ze = xe.x, Je = xe.y;
                Ne.x = ze, Ne.y = Je;
              }
              be.setState(Ne);
            }), be.state = { dragging: !1, dragged: !1, x: ie.position ? ie.position.x : ie.defaultPosition.x, y: ie.position ? ie.position.y : ie.defaultPosition.y, prevPropsPosition: R({}, ie.position), slackX: 0, slackY: 0, isElementSVG: !1 }, !ie.position || ie.onDrag || ie.onStop || console.warn("A `position` was applied to this <Draggable>, without drag handlers. This will make this component effectively undraggable. Please attach `onDrag` or `onStop` handlers so you can adjust the `position` of this element."), be;
          }
          return K(D, null, [{ key: "getDerivedStateFromProps", value: function(ie, be) {
            var Ce = ie.position, ke = be.prevPropsPosition;
            return !Ce || ke && Ce.x === ke.x && Ce.y === ke.y ? null : ((0, T.default)("Draggable: getDerivedStateFromProps %j", { position: Ce, prevPropsPosition: ke }), { x: Ce.x, y: Ce.y, prevPropsPosition: R({}, Ce) });
          } }]), K(D, [{ key: "componentDidMount", value: function() {
            window.SVGElement !== void 0 && this.findDOMNode() instanceof window.SVGElement && this.setState({ isElementSVG: !0 });
          } }, { key: "componentWillUnmount", value: function() {
            this.setState({ dragging: !1 });
          } }, { key: "findDOMNode", value: function() {
            return this.props.nodeRef ? this.props.nodeRef.current : O.default.findDOMNode(this);
          } }, { key: "render", value: function() {
            var ie, be = this.props, Ce = (be.axis, be.bounds, be.children), ke = be.defaultPosition, Ne = be.defaultClassName, xe = be.defaultClassNameDragging, ze = be.defaultClassNameDragged, Je = be.position, G = be.positionOffset, Y = (be.scale, W(be, ["axis", "bounds", "children", "defaultPosition", "defaultClassName", "defaultClassNameDragging", "defaultClassNameDragged", "position", "positionOffset", "scale"])), me = {}, l = null, f = !Je || this.state.dragging, w = Je || ke, L = { x: (0, y.canDragX)(this) && f ? this.state.x : w.x, y: (0, y.canDragY)(this) && f ? this.state.y : w.y };
            this.state.isElementSVG ? l = (0, g.createSVGTransform)(L, G) : me = (0, g.createCSSTransform)(L, G);
            var U = (0, m.default)(Ce.props.className || "", Ne, (ce(ie = {}, xe, this.state.dragging), ce(ie, ze, this.state.dragged), ie));
            return u.createElement(S.default, j({}, Y, { onStart: this.onDragStart, onDrag: this.onDrag, onStop: this.onDragStop }), u.cloneElement(u.Children.only(Ce), { className: U, style: R(R({}, Ce.props.style), me), transform: l }));
          } }]), D;
        }(u.Component);
        s.default = ye, ce(ye, "displayName", "Draggable"), ce(ye, "propTypes", R(R({}, S.default.propTypes), {}, { axis: o.default.oneOf(["both", "x", "y", "none"]), bounds: o.default.oneOfType([o.default.shape({ left: o.default.number, right: o.default.number, top: o.default.number, bottom: o.default.number }), o.default.string, o.default.oneOf([!1])]), defaultClassName: o.default.string, defaultClassNameDragging: o.default.string, defaultClassNameDragged: o.default.string, defaultPosition: o.default.shape({ x: o.default.number, y: o.default.number }), positionOffset: o.default.shape({ x: o.default.oneOfType([o.default.number, o.default.string]), y: o.default.oneOfType([o.default.number, o.default.string]) }), position: o.default.shape({ x: o.default.number, y: o.default.number }), className: b.dontSetMe, style: b.dontSetMe, transform: b.dontSetMe })), ce(ye, "defaultProps", R(R({}, S.default.defaultProps), {}, { axis: "both", bounds: !1, defaultClassName: "react-draggable", defaultClassNameDragging: "react-draggable-dragging", defaultClassNameDragged: "react-draggable-dragged", defaultPosition: { x: 0, y: 0 }, position: null, scale: 1 }));
      }, function(E, s, h) {
        var u = h(54);
        function o() {
        }
        function O() {
        }
        O.resetWarningCache = o, E.exports = function() {
          function m(b, S, T, P, Z, Q) {
            if (Q !== u) {
              var j = new Error("Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types");
              throw j.name = "Invariant Violation", j;
            }
          }
          function g() {
            return m;
          }
          m.isRequired = m;
          var y = { array: m, bigint: m, bool: m, func: m, number: m, object: m, string: m, symbol: m, any: m, arrayOf: g, element: m, elementType: m, instanceOf: g, node: m, objectOf: g, oneOf: g, oneOfType: g, shape: g, exact: g, checkPropTypes: O, resetWarningCache: o };
          return y.PropTypes = y, y;
        };
      }, function(E, s, h) {
        E.exports = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
      }, function(E, s, h) {
        var u;
        (function() {
          var o = {}.hasOwnProperty;
          function O() {
            for (var m = [], g = 0; g < arguments.length; g++) {
              var y = arguments[g];
              if (y) {
                var b = typeof y;
                if (b === "string" || b === "number") m.push(y);
                else if (Array.isArray(y)) {
                  if (y.length) {
                    var S = O.apply(null, y);
                    S && m.push(S);
                  }
                } else if (b === "object") if (y.toString === Object.prototype.toString) for (var T in y) o.call(y, T) && y[T] && m.push(T);
                else m.push(y.toString());
              }
            }
            return m.join(" ");
          }
          E.exports ? (O.default = O, E.exports = O) : (u = (function() {
            return O;
          }).apply(s, [])) === void 0 || (E.exports = u);
        })();
      }, function(E, s, h) {
        Object.defineProperty(s, "__esModule", { value: !0 }), s.getPrefix = o, s.browserPrefixToKey = O, s.browserPrefixToStyle = function(g, y) {
          return y ? "-".concat(y.toLowerCase(), "-").concat(g) : g;
        }, s.default = void 0;
        var u = ["Moz", "Webkit", "O", "ms"];
        function o() {
          var g = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "transform";
          if (typeof window > "u" || window.document === void 0) return "";
          var y = window.document.documentElement.style;
          if (g in y) return "";
          for (var b = 0; b < u.length; b++) if (O(g, u[b]) in y) return u[b];
          return "";
        }
        function O(g, y) {
          return y ? "".concat(y).concat(function(b) {
            for (var S = "", T = !0, P = 0; P < b.length; P++) T ? (S += b[P].toUpperCase(), T = !1) : b[P] === "-" ? T = !0 : S += b[P];
            return S;
          }(g)) : g;
        }
        var m = o();
        s.default = m;
      }, function(E, s, h) {
        Object.defineProperty(s, "__esModule", { value: !0 }), s.default = void 0;
        var u = function(te) {
          if (te && te.__esModule) return te;
          if (te === null || P(te) !== "object" && typeof te != "function") return { default: te };
          var ce = T();
          if (ce && ce.has(te)) return ce.get(te);
          var ye = {}, J = Object.defineProperty && Object.getOwnPropertyDescriptor;
          for (var fe in te) if (Object.prototype.hasOwnProperty.call(te, fe)) {
            var D = J ? Object.getOwnPropertyDescriptor(te, fe) : null;
            D && (D.get || D.set) ? Object.defineProperty(ye, fe, D) : ye[fe] = te[fe];
          }
          return ye.default = te, ce && ce.set(te, ye), ye;
        }(h(0)), o = S(h(18)), O = S(h(12)), m = h(32), g = h(40), y = h(20), b = S(h(41));
        function S(te) {
          return te && te.__esModule ? te : { default: te };
        }
        function T() {
          if (typeof WeakMap != "function") return null;
          var te = /* @__PURE__ */ new WeakMap();
          return T = function() {
            return te;
          }, te;
        }
        function P(te) {
          return (P = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(ce) {
            return typeof ce;
          } : function(ce) {
            return ce && typeof Symbol == "function" && ce.constructor === Symbol && ce !== Symbol.prototype ? "symbol" : typeof ce;
          })(te);
        }
        function Z(te, ce) {
          return function(ye) {
            if (Array.isArray(ye)) return ye;
          }(te) || function(ye, J) {
            if (!(typeof Symbol > "u" || !(Symbol.iterator in Object(ye)))) {
              var fe = [], D = !0, ie = !1, be = void 0;
              try {
                for (var Ce, ke = ye[Symbol.iterator](); !(D = (Ce = ke.next()).done) && (fe.push(Ce.value), !J || fe.length !== J); D = !0) ;
              } catch (Ne) {
                ie = !0, be = Ne;
              } finally {
                try {
                  D || ke.return == null || ke.return();
                } finally {
                  if (ie) throw be;
                }
              }
              return fe;
            }
          }(te, ce) || function(ye, J) {
            if (ye) {
              if (typeof ye == "string") return Q(ye, J);
              var fe = Object.prototype.toString.call(ye).slice(8, -1);
              if (fe === "Object" && ye.constructor && (fe = ye.constructor.name), fe === "Map" || fe === "Set") return Array.from(ye);
              if (fe === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(fe)) return Q(ye, J);
            }
          }(te, ce) || function() {
            throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
          }();
        }
        function Q(te, ce) {
          (ce == null || ce > te.length) && (ce = te.length);
          for (var ye = 0, J = new Array(ce); ye < ce; ye++) J[ye] = te[ye];
          return J;
        }
        function j(te, ce) {
          if (!(te instanceof ce)) throw new TypeError("Cannot call a class as a function");
        }
        function W(te, ce) {
          for (var ye = 0; ye < ce.length; ye++) {
            var J = ce[ye];
            J.enumerable = J.enumerable || !1, J.configurable = !0, "value" in J && (J.writable = !0), Object.defineProperty(te, J.key, J);
          }
        }
        function N(te, ce) {
          return (N = Object.setPrototypeOf || function(ye, J) {
            return ye.__proto__ = J, ye;
          })(te, ce);
        }
        function A(te) {
          var ce = function() {
            if (typeof Reflect > "u" || !Reflect.construct || Reflect.construct.sham) return !1;
            if (typeof Proxy == "function") return !0;
            try {
              return Date.prototype.toString.call(Reflect.construct(Date, [], function() {
              })), !0;
            } catch {
              return !1;
            }
          }();
          return function() {
            var ye, J = oe(te);
            if (ce) {
              var fe = oe(this).constructor;
              ye = Reflect.construct(J, arguments, fe);
            } else ye = J.apply(this, arguments);
            return F(this, ye);
          };
        }
        function F(te, ce) {
          return !ce || P(ce) !== "object" && typeof ce != "function" ? R(te) : ce;
        }
        function R(te) {
          if (te === void 0) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
          return te;
        }
        function oe(te) {
          return (oe = Object.setPrototypeOf ? Object.getPrototypeOf : function(ce) {
            return ce.__proto__ || Object.getPrototypeOf(ce);
          })(te);
        }
        function K(te, ce, ye) {
          return ce in te ? Object.defineProperty(te, ce, { value: ye, enumerable: !0, configurable: !0, writable: !0 }) : te[ce] = ye, te;
        }
        var I = { start: "touchstart", move: "touchmove", stop: "touchend" }, M = { start: "mousedown", move: "mousemove", stop: "mouseup" }, se = M, le = function(te) {
          (function(D, ie) {
            if (typeof ie != "function" && ie !== null) throw new TypeError("Super expression must either be null or a function");
            D.prototype = Object.create(ie && ie.prototype, { constructor: { value: D, writable: !0, configurable: !0 } }), ie && N(D, ie);
          })(fe, te);
          var ce, ye, J = A(fe);
          function fe() {
            var D;
            j(this, fe);
            for (var ie = arguments.length, be = new Array(ie), Ce = 0; Ce < ie; Ce++) be[Ce] = arguments[Ce];
            return K(R(D = J.call.apply(J, [this].concat(be))), "state", { dragging: !1, lastX: NaN, lastY: NaN, touchIdentifier: null }), K(R(D), "mounted", !1), K(R(D), "handleDragStart", function(ke) {
              if (D.props.onMouseDown(ke), !D.props.allowAnyClick && typeof ke.button == "number" && ke.button !== 0) return !1;
              var Ne = D.findDOMNode();
              if (!Ne || !Ne.ownerDocument || !Ne.ownerDocument.body) throw new Error("<DraggableCore> not mounted on DragStart!");
              var xe = Ne.ownerDocument;
              if (!(D.props.disabled || !(ke.target instanceof xe.defaultView.Node) || D.props.handle && !(0, m.matchesSelectorAndParentsTo)(ke.target, D.props.handle, Ne) || D.props.cancel && (0, m.matchesSelectorAndParentsTo)(ke.target, D.props.cancel, Ne))) {
                ke.type === "touchstart" && ke.preventDefault();
                var ze = (0, m.getTouchIdentifier)(ke);
                D.setState({ touchIdentifier: ze });
                var Je = (0, g.getControlPosition)(ke, ze, R(D));
                if (Je != null) {
                  var G = Je.x, Y = Je.y, me = (0, g.createCoreData)(R(D), G, Y);
                  (0, b.default)("DraggableCore: handleDragStart: %j", me), (0, b.default)("calling", D.props.onStart), D.props.onStart(ke, me) !== !1 && D.mounted !== !1 && (D.props.enableUserSelectHack && (0, m.addUserSelectStyles)(xe), D.setState({ dragging: !0, lastX: G, lastY: Y }), (0, m.addEvent)(xe, se.move, D.handleDrag), (0, m.addEvent)(xe, se.stop, D.handleDragStop));
                }
              }
            }), K(R(D), "handleDrag", function(ke) {
              var Ne = (0, g.getControlPosition)(ke, D.state.touchIdentifier, R(D));
              if (Ne != null) {
                var xe = Ne.x, ze = Ne.y;
                if (Array.isArray(D.props.grid)) {
                  var Je = xe - D.state.lastX, G = ze - D.state.lastY, Y = Z((0, g.snapToGrid)(D.props.grid, Je, G), 2);
                  if (Je = Y[0], G = Y[1], !Je && !G) return;
                  xe = D.state.lastX + Je, ze = D.state.lastY + G;
                }
                var me = (0, g.createCoreData)(R(D), xe, ze);
                if ((0, b.default)("DraggableCore: handleDrag: %j", me), D.props.onDrag(ke, me) !== !1 && D.mounted !== !1) D.setState({ lastX: xe, lastY: ze });
                else try {
                  D.handleDragStop(new MouseEvent("mouseup"));
                } catch {
                  var l = document.createEvent("MouseEvents");
                  l.initMouseEvent("mouseup", !0, !0, window, 0, 0, 0, 0, 0, !1, !1, !1, !1, 0, null), D.handleDragStop(l);
                }
              }
            }), K(R(D), "handleDragStop", function(ke) {
              if (D.state.dragging) {
                var Ne = (0, g.getControlPosition)(ke, D.state.touchIdentifier, R(D));
                if (Ne != null) {
                  var xe = Ne.x, ze = Ne.y, Je = (0, g.createCoreData)(R(D), xe, ze);
                  if (D.props.onStop(ke, Je) === !1 || D.mounted === !1) return !1;
                  var G = D.findDOMNode();
                  G && D.props.enableUserSelectHack && (0, m.removeUserSelectStyles)(G.ownerDocument), (0, b.default)("DraggableCore: handleDragStop: %j", Je), D.setState({ dragging: !1, lastX: NaN, lastY: NaN }), G && ((0, b.default)("DraggableCore: Removing handlers"), (0, m.removeEvent)(G.ownerDocument, se.move, D.handleDrag), (0, m.removeEvent)(G.ownerDocument, se.stop, D.handleDragStop));
                }
              }
            }), K(R(D), "onMouseDown", function(ke) {
              return se = M, D.handleDragStart(ke);
            }), K(R(D), "onMouseUp", function(ke) {
              return se = M, D.handleDragStop(ke);
            }), K(R(D), "onTouchStart", function(ke) {
              return se = I, D.handleDragStart(ke);
            }), K(R(D), "onTouchEnd", function(ke) {
              return se = I, D.handleDragStop(ke);
            }), D;
          }
          return ce = fe, (ye = [{ key: "componentDidMount", value: function() {
            this.mounted = !0;
            var D = this.findDOMNode();
            D && (0, m.addEvent)(D, I.start, this.onTouchStart, { passive: !1 });
          } }, { key: "componentWillUnmount", value: function() {
            this.mounted = !1;
            var D = this.findDOMNode();
            if (D) {
              var ie = D.ownerDocument;
              (0, m.removeEvent)(ie, M.move, this.handleDrag), (0, m.removeEvent)(ie, I.move, this.handleDrag), (0, m.removeEvent)(ie, M.stop, this.handleDragStop), (0, m.removeEvent)(ie, I.stop, this.handleDragStop), (0, m.removeEvent)(D, I.start, this.onTouchStart, { passive: !1 }), this.props.enableUserSelectHack && (0, m.removeUserSelectStyles)(ie);
            }
          } }, { key: "findDOMNode", value: function() {
            return this.props.nodeRef ? this.props.nodeRef.current : O.default.findDOMNode(this);
          } }, { key: "render", value: function() {
            return u.cloneElement(u.Children.only(this.props.children), { onMouseDown: this.onMouseDown, onMouseUp: this.onMouseUp, onTouchEnd: this.onTouchEnd });
          } }]) && W(ce.prototype, ye), fe;
        }(u.Component);
        s.default = le, K(le, "displayName", "DraggableCore"), K(le, "propTypes", { allowAnyClick: o.default.bool, disabled: o.default.bool, enableUserSelectHack: o.default.bool, offsetParent: function(te, ce) {
          if (te[ce] && te[ce].nodeType !== 1) throw new Error("Draggable's offsetParent must be a DOM Node.");
        }, grid: o.default.arrayOf(o.default.number), handle: o.default.string, cancel: o.default.string, nodeRef: o.default.object, onStart: o.default.func, onDrag: o.default.func, onStop: o.default.func, onMouseDown: o.default.func, scale: o.default.number, className: y.dontSetMe, style: y.dontSetMe, transform: y.dontSetMe }), K(le, "defaultProps", { allowAnyClick: !1, cancel: null, disabled: !1, enableUserSelectHack: !0, offsetParent: null, handle: null, grid: null, transform: null, onStart: function() {
        }, onDrag: function() {
        }, onStop: function() {
        }, onMouseDown: function() {
        }, scale: 1 });
      }, function(E, s, h) {
        var u = h(6), o = h(59);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[E.i, o, ""]]);
        var O = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        u(o, O), E.exports = o.locals || {};
      }, function(E, s, h) {
        (E.exports = h(7)(!1)).push([E.i, ".ck-inspector{--ck-inspector-color-tab-background-hover:rgba(0,0,0,0.07);--ck-inspector-color-tab-active-border:#0dacef }.ck-inspector .ck-inspector-horizontal-nav{display:flex;flex-direction:row;user-select:none;align-self:stretch}.ck-inspector .ck-inspector-horizontal-nav .ck-inspector-horizontal-nav__item{-webkit-appearance:none;background:none;border:0;border-bottom:2px solid transparent;padding:.5em 1em;align-self:stretch}.ck-inspector .ck-inspector-horizontal-nav .ck-inspector-horizontal-nav__item:hover{background:var(--ck-inspector-color-tab-background-hover)}.ck-inspector .ck-inspector-horizontal-nav .ck-inspector-horizontal-nav__item.ck-inspector-horizontal-nav__item_active{border-bottom-color:var(--ck-inspector-color-tab-active-border)}", ""]);
      }, function(E, s, h) {
        var u = h(6), o = h(61);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[E.i, o, ""]]);
        var O = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        u(o, O), E.exports = o.locals || {};
      }, function(E, s, h) {
        (E.exports = h(7)(!1)).push([E.i, ".ck-inspector{--ck-inspector-navbox-empty-background:#fafafa}.ck-inspector .ck-inspector-navbox{display:flex;flex-direction:column;height:100%;align-items:stretch}.ck-inspector .ck-inspector-navbox .ck-inspector-navbox__navigation{display:flex;flex-direction:row;flex-wrap:nowrap;align-items:stretch;min-height:30px;max-height:30px;border-bottom:1px solid var(--ck-inspector-color-border);width:100%;user-select:none;align-items:center}.ck-inspector .ck-inspector-navbox .ck-inspector-navbox__content{display:flex;flex-direction:row;height:100%;overflow:hidden}", ""]);
      }, function(E, s, h) {
        var u = h(6), o = h(63);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[E.i, o, ""]]);
        var O = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        u(o, O), E.exports = o.locals || {};
      }, function(E, s, h) {
        (E.exports = h(7)(!1)).push([E.i, ".ck-inspector{--ck-inspector-icon-size:19px;--ck-inspector-button-size:calc(4px + var(--ck-inspector-icon-size));--ck-inspector-color-button:#777;--ck-inspector-color-button-hover:#222;--ck-inspector-color-button-on:#0f79e2}.ck-inspector .ck-inspector-button{width:var(--ck-inspector-button-size);height:var(--ck-inspector-button-size);border:0;overflow:hidden;border-radius:2px;padding:2px;color:var(--ck-inspector-color-button)}.ck-inspector .ck-inspector-button.ck-inspector-button_on,.ck-inspector .ck-inspector-button.ck-inspector-button_on:hover{color:var(--ck-inspector-color-button-on);opacity:1}.ck-inspector .ck-inspector-button.ck-inspector-button_disabled{opacity:.3}.ck-inspector .ck-inspector-button>span{display:none}.ck-inspector .ck-inspector-button:hover{color:var(--ck-inspector-color-button-hover)}.ck-inspector .ck-inspector-button svg{width:var(--ck-inspector-icon-size);height:var(--ck-inspector-icon-size)}.ck-inspector .ck-inspector-button svg,.ck-inspector .ck-inspector-button svg *{fill:currentColor}", ""]);
      }, function(E, s, h) {
        var u = h(6), o = h(65);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[E.i, o, ""]]);
        var O = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        u(o, O), E.exports = o.locals || {};
      }, function(E, s, h) {
        (E.exports = h(7)(!1)).push([E.i, ".ck-inspector{--ck-inspector-explorer-width:300px}.ck-inspector .ck-inspector-pane{display:flex;width:100%}.ck-inspector .ck-inspector-pane.ck-inspector-pane_empty{align-items:center;justify-content:center;padding:1em;background:var(--ck-inspector-navbox-empty-background)}.ck-inspector .ck-inspector-pane.ck-inspector-pane_empty p{align-self:center;width:100%;text-align:center}.ck-inspector .ck-inspector-pane>.ck-inspector-navbox:last-child{min-width:var(--ck-inspector-explorer-width);width:var(--ck-inspector-explorer-width)}.ck-inspector .ck-inspector-pane.ck-inspector-pane_vsplit>.ck-inspector-navbox:first-child{border-right:1px solid var(--ck-inspector-color-border);flex:1 1 auto;overflow:hidden}.ck-inspector .ck-inspector-pane.ck-inspector-pane_vsplit>.ck-inspector-navbox:first-child .ck-inspector-navbox__navigation{align-items:center}.ck-inspector .ck-inspector-pane.ck-inspector-pane_vsplit>.ck-inspector-navbox:first-child .ck-inspector-tree__config label{margin:0 .5em}.ck-inspector .ck-inspector-pane.ck-inspector-pane_vsplit>.ck-inspector-navbox:first-child .ck-inspector-tree__config input+label{margin-right:1em}", ""]);
      }, function(E, s, h) {
        var u = h(6), o = h(67);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[E.i, o, ""]]);
        var O = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        u(o, O), E.exports = o.locals || {};
      }, function(E, s, h) {
        (E.exports = h(7)(!1)).push([E.i, ".ck-inspector-side-pane{position:relative}", ""]);
      }, function(E, s, h) {
        var u = h(6), o = h(69);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[E.i, o, ""]]);
        var O = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        u(o, O), E.exports = o.locals || {};
      }, function(E, s, h) {
        (E.exports = h(7)(!1)).push([E.i, ".ck-inspector .ck-inspector-checkbox{vertical-align:middle}", ""]);
      }, function(E, s, h) {
        var u = h(6), o = h(71);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[E.i, o, ""]]);
        var O = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        u(o, O), E.exports = o.locals || {};
      }, function(E, s, h) {
        (E.exports = h(7)(!1)).push([E.i, '.ck-inspector{--ck-inspector-color-property-list-property-name:#d0363f;--ck-inspector-color-property-list-property-value-true:green;--ck-inspector-color-property-list-property-value-false:red;--ck-inspector-color-property-list-property-value-unknown:#888;--ck-inspector-color-property-list-background:#f5f5f5;--ck-inspector-color-property-list-title-collapser:#727272}.ck-inspector .ck-inspector-property-list{display:grid;grid-template-columns:auto 1fr;background:var(--ck-inspector-color-white)}.ck-inspector .ck-inspector-property-list>:nth-of-type(odd){background:var(--ck-inspector-color-property-list-background)}.ck-inspector .ck-inspector-property-list>:nth-of-type(2n){background:var(--ck-inspector-color-white)}.ck-inspector .ck-inspector-property-list dt{padding:0 .7em 0 1.2em;min-width:15em}.ck-inspector .ck-inspector-property-list dt.ck-inspector-property-list__title_collapsible button{display:inline-block;overflow:hidden;vertical-align:middle;margin-left:-9px;margin-right:.3em;width:0;height:0;border-left:6px solid var(--ck-inspector-color-property-list-title-collapser);border-bottom:3.5px solid transparent;border-right:0 solid transparent;border-top:3.5px solid transparent;transition:transform .2s ease-in-out;transform:rotate(0deg)}.ck-inspector .ck-inspector-property-list dt.ck-inspector-property-list__title_expanded button{transform:rotate(90deg)}.ck-inspector .ck-inspector-property-list dt.ck-inspector-property-list__title_collapsed+dd+.ck-inspector-property-list{display:none}.ck-inspector .ck-inspector-property-list dt .ck-inspector-property-list__title__color-box{width:12px;height:12px;vertical-align:text-top;display:inline-block;margin-right:3px;border-radius:2px;border:1px solid #000}.ck-inspector .ck-inspector-property-list dt.ck-inspector-property-list__title_clickable label:hover{text-decoration:underline;cursor:pointer}.ck-inspector .ck-inspector-property-list dt label{color:var(--ck-inspector-color-property-list-property-name)}.ck-inspector .ck-inspector-property-list dd{padding-right:.7em}.ck-inspector .ck-inspector-property-list dd input{width:100%}.ck-inspector .ck-inspector-property-list dd input[value=false]{color:var(--ck-inspector-color-property-list-property-value-false)}.ck-inspector .ck-inspector-property-list dd input[value=true]{color:var(--ck-inspector-color-property-list-property-value-true)}.ck-inspector .ck-inspector-property-list dd input[value="function() {…}"],.ck-inspector .ck-inspector-property-list dd input[value=undefined]{color:var(--ck-inspector-color-property-list-property-value-unknown)}.ck-inspector .ck-inspector-property-list dd input[value="function() {…}"]{font-style:italic}.ck-inspector .ck-inspector-property-list .ck-inspector-property-list{grid-column:1/-1;margin-left:1em;background:transparent}.ck-inspector .ck-inspector-property-list .ck-inspector-property-list>:nth-of-type(2n),.ck-inspector .ck-inspector-property-list .ck-inspector-property-list>:nth-of-type(odd){background:transparent}', ""]);
      }, function(E, s, h) {
        var u = h(6), o = h(73);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[E.i, o, ""]]);
        var O = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        u(o, O), E.exports = o.locals || {};
      }, function(E, s, h) {
        (E.exports = h(7)(!1)).push([E.i, `.ck-inspector .ck-inspector__object-inspector{width:100%;background:var(--ck-inspector-color-white);overflow:auto}.ck-inspector .ck-inspector__object-inspector h2,.ck-inspector .ck-inspector__object-inspector h3{display:flex;flex-direction:row;flex-wrap:nowrap}.ck-inspector .ck-inspector__object-inspector h2{display:flex;align-items:center;padding:1em;overflow:hidden;text-overflow:ellipsis}.ck-inspector .ck-inspector__object-inspector h2>span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;margin-right:auto}.ck-inspector .ck-inspector__object-inspector h2>.ck-inspector-button{flex-shrink:0;margin-left:.5em}.ck-inspector .ck-inspector__object-inspector h2 a{font-weight:700;color:var(--ck-inspector-color-tree-node-name)}.ck-inspector .ck-inspector__object-inspector h2 a,.ck-inspector .ck-inspector__object-inspector h2 a>*{cursor:pointer}.ck-inspector .ck-inspector__object-inspector h2 em:after,.ck-inspector .ck-inspector__object-inspector h2 em:before{content:'"'}.ck-inspector .ck-inspector__object-inspector h3{display:flex;align-items:center;font-size:12px;padding:.4em .7em}.ck-inspector .ck-inspector__object-inspector h3 a{color:inherit;font-weight:700;margin-right:auto}.ck-inspector .ck-inspector__object-inspector h3 .ck-inspector-button{visibility:hidden}.ck-inspector .ck-inspector__object-inspector h3:hover .ck-inspector-button{visibility:visible}.ck-inspector .ck-inspector__object-inspector hr{border-top:1px solid var(--ck-inspector-color-border)}`, ""]);
      }, function(E, s, h) {
        var u = h(6), o = h(75);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[E.i, o, ""]]);
        var O = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        u(o, O), E.exports = o.locals || {};
      }, function(E, s, h) {
        (E.exports = h(7)(!1)).push([E.i, ".ck-inspector-model-tree__hide-markers .ck-inspector-tree__position.ck-inspector-tree__position_marker{display:none}", ""]);
      }, function(E, s) {
        E.exports = function() {
          var h = document.getSelection();
          if (!h.rangeCount) return function() {
          };
          for (var u = document.activeElement, o = [], O = 0; O < h.rangeCount; O++) o.push(h.getRangeAt(O));
          switch (u.tagName.toUpperCase()) {
            case "INPUT":
            case "TEXTAREA":
              u.blur();
              break;
            default:
              u = null;
          }
          return h.removeAllRanges(), function() {
            h.type === "Caret" && h.removeAllRanges(), h.rangeCount || o.forEach(function(m) {
              h.addRange(m);
            }), u && u.focus();
          };
        };
      }, function(E, s, h) {
        Object.defineProperty(s, "__esModule", { value: !0 }), s.bodyOpenClassName = s.portalClassName = void 0;
        var u = Object.assign || function(M) {
          for (var se = 1; se < arguments.length; se++) {
            var le = arguments[se];
            for (var te in le) Object.prototype.hasOwnProperty.call(le, te) && (M[te] = le[te]);
          }
          return M;
        }, o = /* @__PURE__ */ function() {
          function M(se, le) {
            for (var te = 0; te < le.length; te++) {
              var ce = le[te];
              ce.enumerable = ce.enumerable || !1, ce.configurable = !0, "value" in ce && (ce.writable = !0), Object.defineProperty(se, ce.key, ce);
            }
          }
          return function(se, le, te) {
            return le && M(se.prototype, le), te && M(se, te), se;
          };
        }(), O = h(0), m = Q(O), g = Q(h(12)), y = Q(h(18)), b = Q(h(78)), S = function(M) {
          if (M && M.__esModule) return M;
          var se = {};
          if (M != null) for (var le in M) Object.prototype.hasOwnProperty.call(M, le) && (se[le] = M[le]);
          return se.default = M, se;
        }(h(43)), T = h(36), P = Q(T), Z = h(85);
        function Q(M) {
          return M && M.__esModule ? M : { default: M };
        }
        function j(M, se) {
          if (!(M instanceof se)) throw new TypeError("Cannot call a class as a function");
        }
        function W(M, se) {
          if (!M) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
          return !se || typeof se != "object" && typeof se != "function" ? M : se;
        }
        var N = s.portalClassName = "ReactModalPortal", A = s.bodyOpenClassName = "ReactModal__Body--open", F = T.canUseDOM && g.default.createPortal !== void 0, R = function(M) {
          return document.createElement(M);
        }, oe = function() {
          return F ? g.default.createPortal : g.default.unstable_renderSubtreeIntoContainer;
        };
        function K(M) {
          return M();
        }
        var I = function(M) {
          function se() {
            var le, te, ce;
            j(this, se);
            for (var ye = arguments.length, J = Array(ye), fe = 0; fe < ye; fe++) J[fe] = arguments[fe];
            return te = ce = W(this, (le = se.__proto__ || Object.getPrototypeOf(se)).call.apply(le, [this].concat(J))), ce.removePortal = function() {
              !F && g.default.unmountComponentAtNode(ce.node);
              var D = K(ce.props.parentSelector);
              D && D.contains(ce.node) ? D.removeChild(ce.node) : console.warn('React-Modal: "parentSelector" prop did not returned any DOM element. Make sure that the parent element is unmounted to avoid any memory leaks.');
            }, ce.portalRef = function(D) {
              ce.portal = D;
            }, ce.renderPortal = function(D) {
              var ie = oe()(ce, m.default.createElement(b.default, u({ defaultStyles: se.defaultStyles }, D)), ce.node);
              ce.portalRef(ie);
            }, W(ce, te);
          }
          return function(le, te) {
            if (typeof te != "function" && te !== null) throw new TypeError("Super expression must either be null or a function, not " + typeof te);
            le.prototype = Object.create(te && te.prototype, { constructor: { value: le, enumerable: !1, writable: !0, configurable: !0 } }), te && (Object.setPrototypeOf ? Object.setPrototypeOf(le, te) : le.__proto__ = te);
          }(se, M), o(se, [{ key: "componentDidMount", value: function() {
            T.canUseDOM && (F || (this.node = R("div")), this.node.className = this.props.portalClassName, K(this.props.parentSelector).appendChild(this.node), !F && this.renderPortal(this.props));
          } }, { key: "getSnapshotBeforeUpdate", value: function(le) {
            return { prevParent: K(le.parentSelector), nextParent: K(this.props.parentSelector) };
          } }, { key: "componentDidUpdate", value: function(le, te, ce) {
            if (T.canUseDOM) {
              var ye = this.props, J = ye.isOpen, fe = ye.portalClassName;
              le.portalClassName !== fe && (this.node.className = fe);
              var D = ce.prevParent, ie = ce.nextParent;
              ie !== D && (D.removeChild(this.node), ie.appendChild(this.node)), (le.isOpen || J) && !F && this.renderPortal(this.props);
            }
          } }, { key: "componentWillUnmount", value: function() {
            if (T.canUseDOM && this.node && this.portal) {
              var le = this.portal.state, te = Date.now(), ce = le.isOpen && this.props.closeTimeoutMS && (le.closesAt || te + this.props.closeTimeoutMS);
              ce ? (le.beforeClose || this.portal.closeWithTimeout(), setTimeout(this.removePortal, ce - te)) : this.removePortal();
            }
          } }, { key: "render", value: function() {
            return T.canUseDOM && F ? (!this.node && F && (this.node = R("div")), oe()(m.default.createElement(b.default, u({ ref: this.portalRef, defaultStyles: se.defaultStyles }, this.props)), this.node)) : null;
          } }], [{ key: "setAppElement", value: function(le) {
            S.setElement(le);
          } }]), se;
        }(O.Component);
        I.propTypes = { isOpen: y.default.bool.isRequired, style: y.default.shape({ content: y.default.object, overlay: y.default.object }), portalClassName: y.default.string, bodyOpenClassName: y.default.string, htmlOpenClassName: y.default.string, className: y.default.oneOfType([y.default.string, y.default.shape({ base: y.default.string.isRequired, afterOpen: y.default.string.isRequired, beforeClose: y.default.string.isRequired })]), overlayClassName: y.default.oneOfType([y.default.string, y.default.shape({ base: y.default.string.isRequired, afterOpen: y.default.string.isRequired, beforeClose: y.default.string.isRequired })]), appElement: y.default.oneOfType([y.default.instanceOf(P.default), y.default.instanceOf(T.SafeHTMLCollection), y.default.instanceOf(T.SafeNodeList), y.default.arrayOf(y.default.instanceOf(P.default))]), onAfterOpen: y.default.func, onRequestClose: y.default.func, closeTimeoutMS: y.default.number, ariaHideApp: y.default.bool, shouldFocusAfterRender: y.default.bool, shouldCloseOnOverlayClick: y.default.bool, shouldReturnFocusAfterClose: y.default.bool, preventScroll: y.default.bool, parentSelector: y.default.func, aria: y.default.object, data: y.default.object, role: y.default.string, contentLabel: y.default.string, shouldCloseOnEsc: y.default.bool, overlayRef: y.default.func, contentRef: y.default.func, id: y.default.string, overlayElement: y.default.func, contentElement: y.default.func }, I.defaultProps = { isOpen: !1, portalClassName: N, bodyOpenClassName: A, role: "dialog", ariaHideApp: !0, closeTimeoutMS: 0, shouldFocusAfterRender: !0, shouldCloseOnEsc: !0, shouldCloseOnOverlayClick: !0, shouldReturnFocusAfterClose: !0, preventScroll: !1, parentSelector: function() {
          return document.body;
        }, overlayElement: function(M, se) {
          return m.default.createElement("div", M, se);
        }, contentElement: function(M, se) {
          return m.default.createElement("div", M, se);
        } }, I.defaultStyles = { overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(255, 255, 255, 0.75)" }, content: { position: "absolute", top: "40px", left: "40px", right: "40px", bottom: "40px", border: "1px solid #ccc", background: "#fff", overflow: "auto", WebkitOverflowScrolling: "touch", borderRadius: "4px", outline: "none", padding: "20px" } }, (0, Z.polyfill)(I), s.default = I;
      }, function(E, s, h) {
        Object.defineProperty(s, "__esModule", { value: !0 });
        var u = Object.assign || function(R) {
          for (var oe = 1; oe < arguments.length; oe++) {
            var K = arguments[oe];
            for (var I in K) Object.prototype.hasOwnProperty.call(K, I) && (R[I] = K[I]);
          }
          return R;
        }, o = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(R) {
          return typeof R;
        } : function(R) {
          return R && typeof Symbol == "function" && R.constructor === Symbol && R !== Symbol.prototype ? "symbol" : typeof R;
        }, O = /* @__PURE__ */ function() {
          function R(oe, K) {
            for (var I = 0; I < K.length; I++) {
              var M = K[I];
              M.enumerable = M.enumerable || !1, M.configurable = !0, "value" in M && (M.writable = !0), Object.defineProperty(oe, M.key, M);
            }
          }
          return function(oe, K, I) {
            return K && R(oe.prototype, K), I && R(oe, I), oe;
          };
        }(), m = h(0), g = W(h(18)), y = j(h(79)), b = W(h(80)), S = j(h(43)), T = j(h(83)), P = h(36), Z = W(P), Q = W(h(44));
        function j(R) {
          if (R && R.__esModule) return R;
          var oe = {};
          if (R != null) for (var K in R) Object.prototype.hasOwnProperty.call(R, K) && (oe[K] = R[K]);
          return oe.default = R, oe;
        }
        function W(R) {
          return R && R.__esModule ? R : { default: R };
        }
        h(84);
        var N = { overlay: "ReactModal__Overlay", content: "ReactModal__Content" }, A = 0, F = function(R) {
          function oe(K) {
            (function(M, se) {
              if (!(M instanceof se)) throw new TypeError("Cannot call a class as a function");
            })(this, oe);
            var I = function(M, se) {
              if (!M) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
              return !se || typeof se != "object" && typeof se != "function" ? M : se;
            }(this, (oe.__proto__ || Object.getPrototypeOf(oe)).call(this, K));
            return I.setOverlayRef = function(M) {
              I.overlay = M, I.props.overlayRef && I.props.overlayRef(M);
            }, I.setContentRef = function(M) {
              I.content = M, I.props.contentRef && I.props.contentRef(M);
            }, I.afterClose = function() {
              var M = I.props, se = M.appElement, le = M.ariaHideApp, te = M.htmlOpenClassName, ce = M.bodyOpenClassName;
              ce && T.remove(document.body, ce), te && T.remove(document.getElementsByTagName("html")[0], te), le && A > 0 && (A -= 1) === 0 && S.show(se), I.props.shouldFocusAfterRender && (I.props.shouldReturnFocusAfterClose ? (y.returnFocus(I.props.preventScroll), y.teardownScopedFocus()) : y.popWithoutFocus()), I.props.onAfterClose && I.props.onAfterClose(), Q.default.deregister(I);
            }, I.open = function() {
              I.beforeOpen(), I.state.afterOpen && I.state.beforeClose ? (clearTimeout(I.closeTimer), I.setState({ beforeClose: !1 })) : (I.props.shouldFocusAfterRender && (y.setupScopedFocus(I.node), y.markForFocusLater()), I.setState({ isOpen: !0 }, function() {
                I.openAnimationFrame = requestAnimationFrame(function() {
                  I.setState({ afterOpen: !0 }), I.props.isOpen && I.props.onAfterOpen && I.props.onAfterOpen({ overlayEl: I.overlay, contentEl: I.content });
                });
              }));
            }, I.close = function() {
              I.props.closeTimeoutMS > 0 ? I.closeWithTimeout() : I.closeWithoutTimeout();
            }, I.focusContent = function() {
              return I.content && !I.contentHasFocus() && I.content.focus({ preventScroll: !0 });
            }, I.closeWithTimeout = function() {
              var M = Date.now() + I.props.closeTimeoutMS;
              I.setState({ beforeClose: !0, closesAt: M }, function() {
                I.closeTimer = setTimeout(I.closeWithoutTimeout, I.state.closesAt - Date.now());
              });
            }, I.closeWithoutTimeout = function() {
              I.setState({ beforeClose: !1, isOpen: !1, afterOpen: !1, closesAt: null }, I.afterClose);
            }, I.handleKeyDown = function(M) {
              M.keyCode === 9 && (0, b.default)(I.content, M), I.props.shouldCloseOnEsc && M.keyCode === 27 && (M.stopPropagation(), I.requestClose(M));
            }, I.handleOverlayOnClick = function(M) {
              I.shouldClose === null && (I.shouldClose = !0), I.shouldClose && I.props.shouldCloseOnOverlayClick && (I.ownerHandlesClose() ? I.requestClose(M) : I.focusContent()), I.shouldClose = null;
            }, I.handleContentOnMouseUp = function() {
              I.shouldClose = !1;
            }, I.handleOverlayOnMouseDown = function(M) {
              I.props.shouldCloseOnOverlayClick || M.target != I.overlay || M.preventDefault();
            }, I.handleContentOnClick = function() {
              I.shouldClose = !1;
            }, I.handleContentOnMouseDown = function() {
              I.shouldClose = !1;
            }, I.requestClose = function(M) {
              return I.ownerHandlesClose() && I.props.onRequestClose(M);
            }, I.ownerHandlesClose = function() {
              return I.props.onRequestClose;
            }, I.shouldBeClosed = function() {
              return !I.state.isOpen && !I.state.beforeClose;
            }, I.contentHasFocus = function() {
              return document.activeElement === I.content || I.content.contains(document.activeElement);
            }, I.buildClassName = function(M, se) {
              var le = (se === void 0 ? "undefined" : o(se)) === "object" ? se : { base: N[M], afterOpen: N[M] + "--after-open", beforeClose: N[M] + "--before-close" }, te = le.base;
              return I.state.afterOpen && (te = te + " " + le.afterOpen), I.state.beforeClose && (te = te + " " + le.beforeClose), typeof se == "string" && se ? te + " " + se : te;
            }, I.attributesFromObject = function(M, se) {
              return Object.keys(se).reduce(function(le, te) {
                return le[M + "-" + te] = se[te], le;
              }, {});
            }, I.state = { afterOpen: !1, beforeClose: !1 }, I.shouldClose = null, I.moveFromContentToOverlay = null, I;
          }
          return function(K, I) {
            if (typeof I != "function" && I !== null) throw new TypeError("Super expression must either be null or a function, not " + typeof I);
            K.prototype = Object.create(I && I.prototype, { constructor: { value: K, enumerable: !1, writable: !0, configurable: !0 } }), I && (Object.setPrototypeOf ? Object.setPrototypeOf(K, I) : K.__proto__ = I);
          }(oe, R), O(oe, [{ key: "componentDidMount", value: function() {
            this.props.isOpen && this.open();
          } }, { key: "componentDidUpdate", value: function(K, I) {
            this.props.isOpen && !K.isOpen ? this.open() : !this.props.isOpen && K.isOpen && this.close(), this.props.shouldFocusAfterRender && this.state.isOpen && !I.isOpen && this.focusContent();
          } }, { key: "componentWillUnmount", value: function() {
            this.state.isOpen && this.afterClose(), clearTimeout(this.closeTimer), cancelAnimationFrame(this.openAnimationFrame);
          } }, { key: "beforeOpen", value: function() {
            var K = this.props, I = K.appElement, M = K.ariaHideApp, se = K.htmlOpenClassName, le = K.bodyOpenClassName;
            le && T.add(document.body, le), se && T.add(document.getElementsByTagName("html")[0], se), M && (A += 1, S.hide(I)), Q.default.register(this);
          } }, { key: "render", value: function() {
            var K = this.props, I = K.id, M = K.className, se = K.overlayClassName, le = K.defaultStyles, te = K.children, ce = M ? {} : le.content, ye = se ? {} : le.overlay;
            if (this.shouldBeClosed()) return null;
            var J = { ref: this.setOverlayRef, className: this.buildClassName("overlay", se), style: u({}, ye, this.props.style.overlay), onClick: this.handleOverlayOnClick, onMouseDown: this.handleOverlayOnMouseDown }, fe = u({ id: I, ref: this.setContentRef, style: u({}, ce, this.props.style.content), className: this.buildClassName("content", M), tabIndex: "-1", onKeyDown: this.handleKeyDown, onMouseDown: this.handleContentOnMouseDown, onMouseUp: this.handleContentOnMouseUp, onClick: this.handleContentOnClick, role: this.props.role, "aria-label": this.props.contentLabel }, this.attributesFromObject("aria", u({ modal: !0 }, this.props.aria)), this.attributesFromObject("data", this.props.data || {}), { "data-testid": this.props.testId }), D = this.props.contentElement(fe, te);
            return this.props.overlayElement(J, D);
          } }]), oe;
        }(m.Component);
        F.defaultProps = { style: { overlay: {}, content: {} }, defaultStyles: {} }, F.propTypes = { isOpen: g.default.bool.isRequired, defaultStyles: g.default.shape({ content: g.default.object, overlay: g.default.object }), style: g.default.shape({ content: g.default.object, overlay: g.default.object }), className: g.default.oneOfType([g.default.string, g.default.object]), overlayClassName: g.default.oneOfType([g.default.string, g.default.object]), bodyOpenClassName: g.default.string, htmlOpenClassName: g.default.string, ariaHideApp: g.default.bool, appElement: g.default.oneOfType([g.default.instanceOf(Z.default), g.default.instanceOf(P.SafeHTMLCollection), g.default.instanceOf(P.SafeNodeList), g.default.arrayOf(g.default.instanceOf(Z.default))]), onAfterOpen: g.default.func, onAfterClose: g.default.func, onRequestClose: g.default.func, closeTimeoutMS: g.default.number, shouldFocusAfterRender: g.default.bool, shouldCloseOnOverlayClick: g.default.bool, shouldReturnFocusAfterClose: g.default.bool, preventScroll: g.default.bool, role: g.default.string, contentLabel: g.default.string, aria: g.default.object, data: g.default.object, children: g.default.node, shouldCloseOnEsc: g.default.bool, overlayRef: g.default.func, contentRef: g.default.func, id: g.default.string, overlayElement: g.default.func, contentElement: g.default.func, testId: g.default.string }, s.default = F, E.exports = s.default;
      }, function(E, s, h) {
        Object.defineProperty(s, "__esModule", { value: !0 }), s.resetState = function() {
          m = [];
        }, s.log = function() {
        }, s.handleBlur = b, s.handleFocus = S, s.markForFocusLater = function() {
          m.push(document.activeElement);
        }, s.returnFocus = function() {
          var T = arguments.length > 0 && arguments[0] !== void 0 && arguments[0], P = null;
          try {
            return void (m.length !== 0 && (P = m.pop()).focus({ preventScroll: T }));
          } catch {
            console.warn(["You tried to return focus to", P, "but it is not in the DOM anymore"].join(" "));
          }
        }, s.popWithoutFocus = function() {
          m.length > 0 && m.pop();
        }, s.setupScopedFocus = function(T) {
          g = T, window.addEventListener ? (window.addEventListener("blur", b, !1), document.addEventListener("focus", S, !0)) : (window.attachEvent("onBlur", b), document.attachEvent("onFocus", S));
        }, s.teardownScopedFocus = function() {
          g = null, window.addEventListener ? (window.removeEventListener("blur", b), document.removeEventListener("focus", S)) : (window.detachEvent("onBlur", b), document.detachEvent("onFocus", S));
        };
        var u, o = h(42), O = (u = o) && u.__esModule ? u : { default: u }, m = [], g = null, y = !1;
        function b() {
          y = !0;
        }
        function S() {
          if (y) {
            if (y = !1, !g) return;
            setTimeout(function() {
              g.contains(document.activeElement) || ((0, O.default)(g)[0] || g).focus();
            }, 0);
          }
        }
      }, function(E, s, h) {
        Object.defineProperty(s, "__esModule", { value: !0 }), s.default = function(m, g) {
          var y = (0, O.default)(m);
          if (!y.length) return void g.preventDefault();
          var b = void 0, S = g.shiftKey, T = y[0], P = y[y.length - 1], Z = function W() {
            var N = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : document;
            return N.activeElement.shadowRoot ? W(N.activeElement.shadowRoot) : N.activeElement;
          }();
          if (m === Z) {
            if (!S) return;
            b = P;
          }
          if (P !== Z || S || (b = T), T === Z && S && (b = P), b) return g.preventDefault(), void b.focus();
          var Q = /(\bChrome\b|\bSafari\b)\//.exec(navigator.userAgent);
          if (!(Q == null || Q[1] == "Chrome" || /\biPod\b|\biPad\b/g.exec(navigator.userAgent) != null)) {
            var j = y.indexOf(Z);
            if (j > -1 && (j += S ? -1 : 1), (b = y[j]) === void 0) return g.preventDefault(), void (b = S ? P : T).focus();
            g.preventDefault(), b.focus();
          }
        };
        var u, o = h(42), O = (u = o) && u.__esModule ? u : { default: u };
        E.exports = s.default;
      }, function(E, s, h) {
        var u = function() {
        };
        E.exports = u;
      }, function(E, s, h) {
        var u;
        (function() {
          var o = !(typeof window > "u" || !window.document || !window.document.createElement), O = { canUseDOM: o, canUseWorkers: typeof Worker < "u", canUseEventListeners: o && !(!window.addEventListener && !window.attachEvent), canUseViewport: o && !!window.screen };
          (u = (function() {
            return O;
          }).call(s, h, s, E)) === void 0 || (E.exports = u);
        })();
      }, function(E, s, h) {
        Object.defineProperty(s, "__esModule", { value: !0 }), s.resetState = function() {
          var m = document.getElementsByTagName("html")[0];
          for (var g in u) O(m, u[g]);
          var y = document.body;
          for (var b in o) O(y, o[b]);
          u = {}, o = {};
        }, s.log = function() {
        };
        var u = {}, o = {};
        function O(m, g) {
          m.classList.remove(g);
        }
        s.add = function(m, g) {
          return y = m.classList, b = m.nodeName.toLowerCase() == "html" ? u : o, void g.split(" ").forEach(function(S) {
            (function(T, P) {
              T[P] || (T[P] = 0), T[P] += 1;
            })(b, S), y.add(S);
          });
          var y, b;
        }, s.remove = function(m, g) {
          return y = m.classList, b = m.nodeName.toLowerCase() == "html" ? u : o, void g.split(" ").forEach(function(S) {
            (function(T, P) {
              T[P] && (T[P] -= 1);
            })(b, S), b[S] === 0 && y.remove(S);
          });
          var y, b;
        };
      }, function(E, s, h) {
        Object.defineProperty(s, "__esModule", { value: !0 }), s.resetState = function() {
          for (var S = [m, g], T = 0; T < S.length; T++) {
            var P = S[T];
            P && P.parentNode && P.parentNode.removeChild(P);
          }
          m = g = null, y = [];
        }, s.log = function() {
          console.log("bodyTrap ----------"), console.log(y.length);
          for (var S = [m, g], T = 0; T < S.length; T++) {
            var P = S[T] || {};
            console.log(P.nodeName, P.className, P.id);
          }
          console.log("edn bodyTrap ----------");
        };
        var u, o = h(44), O = (u = o) && u.__esModule ? u : { default: u }, m = void 0, g = void 0, y = [];
        function b() {
          y.length !== 0 && y[y.length - 1].focusContent();
        }
        O.default.subscribe(function(S, T) {
          m || g || ((m = document.createElement("div")).setAttribute("data-react-modal-body-trap", ""), m.style.position = "absolute", m.style.opacity = "0", m.setAttribute("tabindex", "0"), m.addEventListener("focus", b), (g = m.cloneNode()).addEventListener("focus", b)), (y = T).length > 0 ? (document.body.firstChild !== m && document.body.insertBefore(m, document.body.firstChild), document.body.lastChild !== g && document.body.appendChild(g)) : (m.parentElement && m.parentElement.removeChild(m), g.parentElement && g.parentElement.removeChild(g));
        });
      }, function(E, s, h) {
        function u() {
          var g = this.constructor.getDerivedStateFromProps(this.props, this.state);
          g != null && this.setState(g);
        }
        function o(g) {
          this.setState((function(y) {
            var b = this.constructor.getDerivedStateFromProps(g, y);
            return b ?? null;
          }).bind(this));
        }
        function O(g, y) {
          try {
            var b = this.props, S = this.state;
            this.props = g, this.state = y, this.__reactInternalSnapshotFlag = !0, this.__reactInternalSnapshot = this.getSnapshotBeforeUpdate(b, S);
          } finally {
            this.props = b, this.state = S;
          }
        }
        function m(g) {
          var y = g.prototype;
          if (!y || !y.isReactComponent) throw new Error("Can only polyfill class components");
          if (typeof g.getDerivedStateFromProps != "function" && typeof y.getSnapshotBeforeUpdate != "function") return g;
          var b = null, S = null, T = null;
          if (typeof y.componentWillMount == "function" ? b = "componentWillMount" : typeof y.UNSAFE_componentWillMount == "function" && (b = "UNSAFE_componentWillMount"), typeof y.componentWillReceiveProps == "function" ? S = "componentWillReceiveProps" : typeof y.UNSAFE_componentWillReceiveProps == "function" && (S = "UNSAFE_componentWillReceiveProps"), typeof y.componentWillUpdate == "function" ? T = "componentWillUpdate" : typeof y.UNSAFE_componentWillUpdate == "function" && (T = "UNSAFE_componentWillUpdate"), b !== null || S !== null || T !== null) {
            var P = g.displayName || g.name, Z = typeof g.getDerivedStateFromProps == "function" ? "getDerivedStateFromProps()" : "getSnapshotBeforeUpdate()";
            throw Error(`Unsafe legacy lifecycles will not be called for components using new component APIs.

` + P + " uses " + Z + " but also contains the following legacy lifecycles:" + (b !== null ? `
  ` + b : "") + (S !== null ? `
  ` + S : "") + (T !== null ? `
  ` + T : "") + `

The above lifecycles should be removed. Learn more about this warning here:
https://fb.me/react-async-component-lifecycle-hooks`);
          }
          if (typeof g.getDerivedStateFromProps == "function" && (y.componentWillMount = u, y.componentWillReceiveProps = o), typeof y.getSnapshotBeforeUpdate == "function") {
            if (typeof y.componentDidUpdate != "function") throw new Error("Cannot polyfill getSnapshotBeforeUpdate() for components that do not define componentDidUpdate() on the prototype");
            y.componentWillUpdate = O;
            var Q = y.componentDidUpdate;
            y.componentDidUpdate = function(j, W, N) {
              var A = this.__reactInternalSnapshotFlag ? this.__reactInternalSnapshot : N;
              Q.call(this, j, W, A);
            };
          }
          return g;
        }
        h.r(s), h.d(s, "polyfill", function() {
          return m;
        }), u.__suppressDeprecationWarning = !0, o.__suppressDeprecationWarning = !0, O.__suppressDeprecationWarning = !0;
      }, function(E, s, h) {
        var u = h(6), o = h(87);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[E.i, o, ""]]);
        var O = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        u(o, O), E.exports = o.locals || {};
      }, function(E, s, h) {
        (E.exports = h(7)(!1)).push([E.i, ".ck-inspector-modal{--ck-inspector-set-data-modal-overlay:rgba(0,0,0,0.5);--ck-inspector-set-data-modal-shadow:rgba(0,0,0,0.06);--ck-inspector-set-data-modal-button-background:#eee;--ck-inspector-set-data-modal-button-background-hover:#ddd;--ck-inspector-set-data-modal-save-button-background:#1976d2;--ck-inspector-set-data-modal-save-button-background-hover:#0b60b5}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal{z-index:999999;position:fixed;inset:0;background-color:var(--ck-inspector-set-data-modal-overlay)}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content{position:absolute;border:1px solid var(--ck-inspector-color-border);background:var(--ck-inspector-color-white);overflow:auto;border-radius:2px;outline:none;box-shadow:0 1px 1px var(--ck-inspector-set-data-modal-shadow),0 2px 2px var(--ck-inspector-set-data-modal-shadow),0 4px 4px var(--ck-inspector-set-data-modal-shadow),0 8px 8px var(--ck-inspector-set-data-modal-shadow),0 16px 16px var(--ck-inspector-set-data-modal-shadow);max-height:calc(100vh - 160px);max-width:calc(100vw - 160px);width:100%;height:100%;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;justify-content:space-between}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content h2{font-size:14px;font-weight:700;margin:0;padding:12px 20px;background:var(--ck-inspector-color-background);border-bottom:1px solid var(--ck-inspector-color-border)}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content textarea{flex-grow:1;margin:20px;border:1px solid var(--ck-inspector-color-border);border-radius:2px;resize:none;padding:10px;font-family:monospace;font-size:14px}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content button{padding:10px 20px;border-radius:2px;font-size:14px;white-space:nowrap;border:1px solid var(--ck-inspector-color-border)}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content button:hover{background:var(--ck-inspector-set-data-modal-button-background-hover)}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons{margin:0 20px 20px;display:flex;justify-content:center}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button+button{margin-left:20px}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button:first-child{margin-right:auto}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button:not(:first-child){flex-basis:20%}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button:last-child{background:var(--ck-inspector-set-data-modal-save-button-background);border-color:var(--ck-inspector-set-data-modal-save-button-background);color:#fff;font-weight:700}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button:last-child:hover{background:var(--ck-inspector-set-data-modal-save-button-background-hover)}", ""]);
      }, function(E, s, h) {
        var u = h(6), o = h(89);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[E.i, o, ""]]);
        var O = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        u(o, O), E.exports = o.locals || {};
      }, function(E, s, h) {
        (E.exports = h(7)(!1)).push([E.i, ".ck-inspector .ck-inspector-editor-quick-actions{display:flex;align-content:center;justify-content:center;align-items:center;flex-direction:row;flex-wrap:nowrap}.ck-inspector .ck-inspector-editor-quick-actions>.ck-inspector-button{margin-left:.3em}.ck-inspector .ck-inspector-editor-quick-actions>.ck-inspector-button.ck-inspector-button_data-copied{animation-duration:.5s;animation-name:ck-inspector-bounce-in;color:green}@keyframes ck-inspector-bounce-in{0%{opacity:0;transform:scale3d(.5,.5,.5)}20%{transform:scale3d(1.1,1.1,1.1)}40%{transform:scale3d(.8,.8,.8)}60%{opacity:1;transform:scale3d(1.05,1.05,1.05)}to{opacity:1;transform:scaleX(1)}}", ""]);
      }, function(E, s, h) {
        var u = h(6), o = h(91);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[E.i, o, ""]]);
        var O = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        u(o, O), E.exports = o.locals || {};
      }, function(E, s, h) {
        (E.exports = h(7)(!1)).push([E.i, "html body.ck-inspector-body-expanded{margin-bottom:var(--ck-inspector-height)}html body.ck-inspector-body-collapsed{margin-bottom:var(--ck-inspector-collapsed-height)}.ck-inspector-wrapper *{box-sizing:border-box}", ""]);
      }, , , function(E, s, h) {
        h.r(s), h.d(s, "default", function() {
          return $e;
        });
        var u = h(0), o = h.n(u), O = h(12), m = h.n(O);
        function g(k) {
          return "Minified Redux error #" + k + "; visit https://redux.js.org/Errors?code=" + k + " for the full message or use the non-minified dev environment for full errors. ";
        }
        var y = typeof Symbol == "function" && Symbol.observable || "@@observable", b = function() {
          return Math.random().toString(36).substring(7).split("").join(".");
        }, S = { INIT: "@@redux/INIT" + b(), REPLACE: "@@redux/REPLACE" + b(), PROBE_UNKNOWN_ACTION: function() {
          return "@@redux/PROBE_UNKNOWN_ACTION" + b();
        } };
        function T(k) {
          if (typeof k != "object" || k === null) return !1;
          for (var a = k; Object.getPrototypeOf(a) !== null; ) a = Object.getPrototypeOf(a);
          return Object.getPrototypeOf(k) === a;
        }
        function P(k, a, c) {
          var p;
          if (typeof a == "function" && typeof c == "function" || typeof c == "function" && typeof arguments[3] == "function") throw new Error(g(0));
          if (typeof a == "function" && c === void 0 && (c = a, a = void 0), c !== void 0) {
            if (typeof c != "function") throw new Error(g(1));
            return c(P)(k, a);
          }
          if (typeof k != "function") throw new Error(g(2));
          var _ = k, C = a, z = [], ne = z, de = !1;
          function pe() {
            ne === z && (ne = z.slice());
          }
          function Ee() {
            if (de) throw new Error(g(3));
            return C;
          }
          function Pe(Ie) {
            if (typeof Ie != "function") throw new Error(g(4));
            if (de) throw new Error(g(5));
            var Fe = !0;
            return pe(), ne.push(Ie), function() {
              if (Fe) {
                if (de) throw new Error(g(6));
                Fe = !1, pe();
                var et = ne.indexOf(Ie);
                ne.splice(et, 1), z = null;
              }
            };
          }
          function We(Ie) {
            if (!T(Ie)) throw new Error(g(7));
            if (Ie.type === void 0) throw new Error(g(8));
            if (de) throw new Error(g(9));
            try {
              de = !0, C = _(C, Ie);
            } finally {
              de = !1;
            }
            for (var Fe = z = ne, et = 0; et < Fe.length; et++)
              (0, Fe[et])();
            return Ie;
          }
          function Me(Ie) {
            if (typeof Ie != "function") throw new Error(g(10));
            _ = Ie, We({ type: S.REPLACE });
          }
          function Ke() {
            var Ie, Fe = Pe;
            return (Ie = { subscribe: function(et) {
              if (typeof et != "object" || et === null) throw new Error(g(11));
              function Ye() {
                et.next && et.next(Ee());
              }
              return Ye(), { unsubscribe: Fe(Ye) };
            } })[y] = function() {
              return this;
            }, Ie;
          }
          return We({ type: S.INIT }), (p = { dispatch: We, subscribe: Pe, getState: Ee, replaceReducer: Me })[y] = Ke, p;
        }
        var Z = o.a.createContext(null), Q = function(k) {
          k();
        };
        function j() {
          var k = Q, a = null, c = null;
          return { clear: function() {
            a = null, c = null;
          }, notify: function() {
            k(function() {
              for (var p = a; p; ) p.callback(), p = p.next;
            });
          }, get: function() {
            for (var p = [], _ = a; _; ) p.push(_), _ = _.next;
            return p;
          }, subscribe: function(p) {
            var _ = !0, C = c = { callback: p, next: null, prev: c };
            return C.prev ? C.prev.next = C : a = C, function() {
              _ && a !== null && (_ = !1, C.next ? C.next.prev = C.prev : c = C.prev, C.prev ? C.prev.next = C.next : a = C.next);
            };
          } };
        }
        var W = { notify: function() {
        }, get: function() {
          return [];
        } };
        function N(k, a) {
          var c, p = W;
          function _() {
            z.onStateChange && z.onStateChange();
          }
          function C() {
            c || (c = a ? a.addNestedSub(_) : k.subscribe(_), p = j());
          }
          var z = { addNestedSub: function(ne) {
            return C(), p.subscribe(ne);
          }, notifyNestedSubs: function() {
            p.notify();
          }, handleChangeWrapper: _, isSubscribed: function() {
            return !!c;
          }, trySubscribe: C, tryUnsubscribe: function() {
            c && (c(), c = void 0, p.clear(), p = W);
          }, getListeners: function() {
            return p;
          } };
          return z;
        }
        var A = typeof window < "u" && window.document !== void 0 && window.document.createElement !== void 0 ? u.useLayoutEffect : u.useEffect, F = function(k) {
          var a = k.store, c = k.context, p = k.children, _ = Object(u.useMemo)(function() {
            var ne = N(a);
            return { store: a, subscription: ne };
          }, [a]), C = Object(u.useMemo)(function() {
            return a.getState();
          }, [a]);
          A(function() {
            var ne = _.subscription;
            return ne.onStateChange = ne.notifyNestedSubs, ne.trySubscribe(), C !== a.getState() && ne.notifyNestedSubs(), function() {
              ne.tryUnsubscribe(), ne.onStateChange = null;
            };
          }, [_, C]);
          var z = c || Z;
          return o.a.createElement(z.Provider, { value: _ }, p);
        };
        function R() {
          return (R = Object.assign ? Object.assign.bind() : function(k) {
            for (var a = 1; a < arguments.length; a++) {
              var c = arguments[a];
              for (var p in c) Object.prototype.hasOwnProperty.call(c, p) && (k[p] = c[p]);
            }
            return k;
          }).apply(this, arguments);
        }
        function oe(k, a) {
          if (k == null) return {};
          var c, p, _ = {}, C = Object.keys(k);
          for (p = 0; p < C.length; p++) c = C[p], a.indexOf(c) >= 0 || (_[c] = k[c]);
          return _;
        }
        var K = h(39), I = h.n(K), M = h(45), se = ["getDisplayName", "methodName", "renderCountProp", "shouldHandleStateChanges", "storeKey", "withRef", "forwardRef", "context"], le = ["reactReduxForwardedRef"], te = [], ce = [null, null];
        function ye(k, a) {
          var c = k[1];
          return [a.payload, c + 1];
        }
        function J(k, a, c) {
          A(function() {
            return k.apply(void 0, a);
          }, c);
        }
        function fe(k, a, c, p, _, C, z) {
          k.current = p, a.current = _, c.current = !1, C.current && (C.current = null, z());
        }
        function D(k, a, c, p, _, C, z, ne, de, pe) {
          if (k) {
            var Ee = !1, Pe = null, We = function() {
              if (!Ee) {
                var Me, Ke, Ie = a.getState();
                try {
                  Me = p(Ie, _.current);
                } catch (Fe) {
                  Ke = Fe, Pe = Fe;
                }
                Ke || (Pe = null), Me === C.current ? z.current || de() : (C.current = Me, ne.current = Me, z.current = !0, pe({ type: "STORE_UPDATED", payload: { error: Ke } }));
              }
            };
            return c.onStateChange = We, c.trySubscribe(), We(), function() {
              if (Ee = !0, c.tryUnsubscribe(), c.onStateChange = null, Pe) throw Pe;
            };
          }
        }
        var ie = function() {
          return [null, 0];
        };
        function be(k, a) {
          a === void 0 && (a = {});
          var c = a, p = c.getDisplayName, _ = p === void 0 ? function(Le) {
            return "ConnectAdvanced(" + Le + ")";
          } : p, C = c.methodName, z = C === void 0 ? "connectAdvanced" : C, ne = c.renderCountProp, de = ne === void 0 ? void 0 : ne, pe = c.shouldHandleStateChanges, Ee = pe === void 0 || pe, Pe = c.storeKey, We = Pe === void 0 ? "store" : Pe, Me = (c.withRef, c.forwardRef), Ke = Me !== void 0 && Me, Ie = c.context, Fe = Ie === void 0 ? Z : Ie, et = oe(c, se), Ye = Fe;
          return function(Le) {
            var ft = Le.displayName || Le.name || "Component", Dt = _(ft), It = R({}, et, { getDisplayName: _, methodName: z, renderCountProp: de, shouldHandleStateChanges: Ee, storeKey: We, displayName: Dt, wrappedComponentName: ft, WrappedComponent: Le }), jt = et.pure, _t = jt ? u.useMemo : function(lt) {
              return lt();
            };
            function zt(lt) {
              var An = Object(u.useMemo)(function() {
                var kn = lt.reactReduxForwardedRef, so = oe(lt, le);
                return [lt.context, kn, so];
              }, [lt]), Hn = An[0], zr = An[1], xt = An[2], io = Object(u.useMemo)(function() {
                return Hn && Hn.Consumer && Object(M.isContextConsumer)(o.a.createElement(Hn.Consumer, null)) ? Hn : Ye;
              }, [Hn, Ye]), In = Object(u.useContext)(io), $t = !!lt.store && !!lt.store.getState && !!lt.store.dispatch;
              In && In.store;
              var fn = $t ? lt.store : In.store, Gn = Object(u.useMemo)(function() {
                return function(kn) {
                  return k(kn.dispatch, It);
                }(fn);
              }, [fn]), Gt = Object(u.useMemo)(function() {
                if (!Ee) return ce;
                var kn = N(fn, $t ? null : In.subscription), so = kn.notifyNestedSubs.bind(kn);
                return [kn, so];
              }, [fn, $t, In]), dn = Gt[0], Lr = Gt[1], oi = Object(u.useMemo)(function() {
                return $t ? In : R({}, In, { subscription: dn });
              }, [$t, In, dn]), Ur = Object(u.useReducer)(ye, te, ie), Ao = Ur[0][0], mr = Ur[1];
              if (Ao && Ao.error) throw Ao.error;
              var zi = Object(u.useRef)(), gr = Object(u.useRef)(xt), Io = Object(u.useRef)(), ii = Object(u.useRef)(!1), Xn = _t(function() {
                return Io.current && xt === gr.current ? Io.current : Gn(fn.getState(), xt);
              }, [fn, Ao, xt]);
              J(fe, [gr, zi, ii, xt, Xn, Io, Lr]), J(D, [Ee, fn, dn, Gn, gr, zi, ii, Io, Lr, mr], [fn, dn, Gn]);
              var ao = Object(u.useMemo)(function() {
                return o.a.createElement(Le, R({}, Xn, { ref: zr }));
              }, [zr, Le, Xn]);
              return Object(u.useMemo)(function() {
                return Ee ? o.a.createElement(io.Provider, { value: oi }, ao) : ao;
              }, [io, ao, oi]);
            }
            var dt = jt ? o.a.memo(zt) : zt;
            if (dt.WrappedComponent = Le, dt.displayName = zt.displayName = Dt, Ke) {
              var Mn = o.a.forwardRef(function(lt, An) {
                return o.a.createElement(dt, R({}, lt, { reactReduxForwardedRef: An }));
              });
              return Mn.displayName = Dt, Mn.WrappedComponent = Le, I()(Mn, Le);
            }
            return I()(dt, Le);
          };
        }
        function Ce(k, a) {
          return k === a ? k !== 0 || a !== 0 || 1 / k == 1 / a : k != k && a != a;
        }
        function ke(k, a) {
          if (Ce(k, a)) return !0;
          if (typeof k != "object" || k === null || typeof a != "object" || a === null) return !1;
          var c = Object.keys(k), p = Object.keys(a);
          if (c.length !== p.length) return !1;
          for (var _ = 0; _ < c.length; _++) if (!Object.prototype.hasOwnProperty.call(a, c[_]) || !Ce(k[c[_]], a[c[_]])) return !1;
          return !0;
        }
        function Ne(k) {
          return function(a, c) {
            var p = k(a, c);
            function _() {
              return p;
            }
            return _.dependsOnOwnProps = !1, _;
          };
        }
        function xe(k) {
          return k.dependsOnOwnProps !== null && k.dependsOnOwnProps !== void 0 ? !!k.dependsOnOwnProps : k.length !== 1;
        }
        function ze(k, a) {
          return function(c, p) {
            p.displayName;
            var _ = function(C, z) {
              return _.dependsOnOwnProps ? _.mapToProps(C, z) : _.mapToProps(C);
            };
            return _.dependsOnOwnProps = !0, _.mapToProps = function(C, z) {
              _.mapToProps = k, _.dependsOnOwnProps = xe(k);
              var ne = _(C, z);
              return typeof ne == "function" && (_.mapToProps = ne, _.dependsOnOwnProps = xe(ne), ne = _(C, z)), ne;
            }, _;
          };
        }
        var Je = [function(k) {
          return typeof k == "function" ? ze(k) : void 0;
        }, function(k) {
          return k ? void 0 : Ne(function(a) {
            return { dispatch: a };
          });
        }, function(k) {
          return k && typeof k == "object" ? Ne(function(a) {
            return function(c, p) {
              var _ = {}, C = function(ne) {
                var de = c[ne];
                typeof de == "function" && (_[ne] = function() {
                  return p(de.apply(void 0, arguments));
                });
              };
              for (var z in c) C(z);
              return _;
            }(k, a);
          }) : void 0;
        }], G = [function(k) {
          return typeof k == "function" ? ze(k) : void 0;
        }, function(k) {
          return k ? void 0 : Ne(function() {
            return {};
          });
        }];
        function Y(k, a, c) {
          return R({}, c, k, a);
        }
        var me = [function(k) {
          return typeof k == "function" ? /* @__PURE__ */ function(a) {
            return function(c, p) {
              p.displayName;
              var _, C = p.pure, z = p.areMergedPropsEqual, ne = !1;
              return function(de, pe, Ee) {
                var Pe = a(de, pe, Ee);
                return ne ? C && z(Pe, _) || (_ = Pe) : (ne = !0, _ = Pe), _;
              };
            };
          }(k) : void 0;
        }, function(k) {
          return k ? void 0 : function() {
            return Y;
          };
        }], l = ["initMapStateToProps", "initMapDispatchToProps", "initMergeProps"];
        function f(k, a, c, p) {
          return function(_, C) {
            return c(k(_, C), a(p, C), C);
          };
        }
        function w(k, a, c, p, _) {
          var C, z, ne, de, pe, Ee = _.areStatesEqual, Pe = _.areOwnPropsEqual, We = _.areStatePropsEqual, Me = !1;
          function Ke(Ie, Fe) {
            var et, Ye, Le = !Pe(Fe, z), ft = !Ee(Ie, C);
            return C = Ie, z = Fe, Le && ft ? (ne = k(C, z), a.dependsOnOwnProps && (de = a(p, z)), pe = c(ne, de, z)) : Le ? (k.dependsOnOwnProps && (ne = k(C, z)), a.dependsOnOwnProps && (de = a(p, z)), pe = c(ne, de, z)) : (ft && (et = k(C, z), Ye = !We(et, ne), ne = et, Ye && (pe = c(ne, de, z))), pe);
          }
          return function(Ie, Fe) {
            return Me ? Ke(Ie, Fe) : (ne = k(C = Ie, z = Fe), de = a(p, z), pe = c(ne, de, z), Me = !0, pe);
          };
        }
        function L(k, a) {
          var c = a.initMapStateToProps, p = a.initMapDispatchToProps, _ = a.initMergeProps, C = oe(a, l), z = c(k, C), ne = p(k, C), de = _(k, C);
          return (C.pure ? w : f)(z, ne, de, k, C);
        }
        var U = ["pure", "areStatesEqual", "areOwnPropsEqual", "areStatePropsEqual", "areMergedPropsEqual"];
        function B(k, a, c) {
          for (var p = a.length - 1; p >= 0; p--) {
            var _ = a[p](k);
            if (_) return _;
          }
          return function(C, z) {
            throw new Error("Invalid value of type " + typeof k + " for " + c + " argument when connecting component " + z.wrappedComponentName + ".");
          };
        }
        function he(k, a) {
          return k === a;
        }
        function je(k) {
          var a = {}, c = a.connectHOC, p = c === void 0 ? be : c, _ = a.mapStateToPropsFactories, C = _ === void 0 ? G : _, z = a.mapDispatchToPropsFactories, ne = z === void 0 ? Je : z, de = a.mergePropsFactories, pe = de === void 0 ? me : de, Ee = a.selectorFactory, Pe = Ee === void 0 ? L : Ee;
          return function(We, Me, Ke, Ie) {
            Ie === void 0 && (Ie = {});
            var Fe = Ie, et = Fe.pure, Ye = et === void 0 || et, Le = Fe.areStatesEqual, ft = Le === void 0 ? he : Le, Dt = Fe.areOwnPropsEqual, It = Dt === void 0 ? ke : Dt, jt = Fe.areStatePropsEqual, _t = jt === void 0 ? ke : jt, zt = Fe.areMergedPropsEqual, dt = zt === void 0 ? ke : zt, Mn = oe(Fe, U), lt = B(We, C, "mapStateToProps"), An = B(Me, ne, "mapDispatchToProps"), Hn = B(Ke, pe, "mergeProps");
            return p(Pe, R({ methodName: "connect", getDisplayName: function(zr) {
              return "Connect(" + zr + ")";
            }, shouldHandleStateChanges: !!We, initMapStateToProps: lt, initMapDispatchToProps: An, initMergeProps: Hn, pure: Ye, areStatesEqual: ft, areOwnPropsEqual: It, areStatePropsEqual: _t, areMergedPropsEqual: dt }, Mn));
          };
        }
        var Re = je(), Xe;
        Xe = O.unstable_batchedUpdates, Q = Xe;
        function Ve(k) {
          return { type: "SET_MODEL_ACTIVE_TAB", tabName: k };
        }
        function Mt() {
          return { type: "TOGGLE_IS_COLLAPSED" };
        }
        function wt(k) {
          return { type: "SET_EDITORS", editors: k };
        }
        function Jt(k) {
          return { type: "SET_CURRENT_EDITOR_NAME", editorName: k };
        }
        function kt(k) {
          return { type: "SET_ACTIVE_INSPECTOR_TAB", tabName: k };
        }
        var gt = h(10), cn = h(4);
        class Er {
          constructor(a) {
            this._config = a;
          }
          startListening(a) {
            a.model.document.on("change", this._config.onModelChange), a.editing.view.on("render", this._config.onViewRender), a.on("change:isReadOnly", this._config.onReadOnlyChange);
          }
          stopListening(a) {
            a.model.document.off("change", this._config.onModelChange), a.editing.view.off("render", this._config.onViewRender), a.off("change:isReadOnly", this._config.onReadOnlyChange);
          }
        }
        function Tt(k) {
          return k.editors.get(k.currentEditorName);
        }
        class pt {
          static set(a, c) {
            window.localStorage.setItem("ck5-inspector-" + a, c);
          }
          static get(a) {
            return window.localStorage.getItem("ck5-inspector-" + a);
          }
        }
        function $n(k, a, c) {
          const p = function(_, C, z) {
            if (_.ui.activeTab !== "Model") return C;
            if (!C) return Sn(_, C);
            switch (z.type) {
              case "SET_MODEL_CURRENT_ROOT_NAME":
                return function(ne, de, pe) {
                  const Ee = pe.currentRootName;
                  return { ...de, ...or(ne, de, { currentRootName: Ee }), currentNode: null, currentNodeDefinition: null, currentRootName: Ee };
                }(_, C, z);
              case "SET_MODEL_CURRENT_NODE":
                return { ...C, currentNode: z.currentNode, currentNodeDefinition: Object(gt.b)(Tt(_), z.currentNode) };
              case "SET_ACTIVE_INSPECTOR_TAB":
              case "UPDATE_MODEL_STATE":
                return { ...C, ...or(_, C) };
              case "SET_EDITORS":
              case "SET_CURRENT_EDITOR_NAME":
                return Sn(_, C);
              default:
                return C;
            }
          }(k, a, c);
          return p && (p.ui = function(_, C) {
            if (!_) return { activeTab: pt.get("active-model-tab-name") || "Inspect", showMarkers: pt.get("model-show-markers") === "true", showCompactText: pt.get("model-compact-text") === "true" };
            switch (C.type) {
              case "SET_MODEL_ACTIVE_TAB":
                return function(z, ne) {
                  return pt.set("active-model-tab-name", ne.tabName), { ...z, activeTab: ne.tabName };
                }(_, C);
              case "TOGGLE_MODEL_SHOW_MARKERS":
                return function(z) {
                  const ne = !z.showMarkers;
                  return pt.set("model-show-markers", ne), { ...z, showMarkers: ne };
                }(_);
              case "TOGGLE_MODEL_SHOW_COMPACT_TEXT":
                return function(z) {
                  const ne = !z.showCompactText;
                  return pt.set("model-compact-text", ne), { ...z, showCompactText: ne };
                }(_);
              default:
                return _;
            }
          }(p.ui, c)), p;
        }
        function Sn(k, a = {}) {
          const c = Tt(k);
          if (!c) return { ui: a.ui };
          const p = Object(gt.d)(c)[0].rootName;
          return { ...a, ...or(k, a, { currentRootName: p }), currentRootName: p, currentNode: null, currentNodeDefinition: null };
        }
        function or(k, a, c) {
          const p = Tt(k), _ = { ...a, ...c }, C = _.currentRootName, z = Object(gt.c)(p, C), ne = Object(gt.a)(p, C), de = Object(gt.e)({ currentEditor: p, currentRootName: _.currentRootName, ranges: z, markers: ne });
          let pe = _.currentNode, Ee = _.currentNodeDefinition;
          return pe ? pe.root.rootName !== C || !Object(cn.d)(pe) && !pe.parent ? (pe = null, Ee = null) : Ee = Object(gt.b)(p, pe) : Ee = null, { treeDefinition: de, currentNode: pe, currentNodeDefinition: Ee, ranges: z, markers: ne };
        }
        function _r(k) {
          return { type: "SET_VIEW_ACTIVE_TAB", tabName: k };
        }
        function ko() {
          return { type: "UPDATE_VIEW_STATE" };
        }
        var en = h(9), Yt = h(2);
        function xr(k, a, c) {
          const p = function(_, C, z) {
            if (_.ui.activeTab !== "View") return C;
            if (!C) return qt(_, C);
            switch (z.type) {
              case "SET_VIEW_CURRENT_ROOT_NAME":
                return function(ne, de, pe) {
                  const Ee = pe.currentRootName;
                  return { ...de, ...gn(ne, de, { currentRootName: Ee }), currentNode: null, currentNodeDefinition: null, currentRootName: Ee };
                }(_, C, z);
              case "SET_VIEW_CURRENT_NODE":
                return { ...C, currentNode: z.currentNode, currentNodeDefinition: Object(en.b)(z.currentNode) };
              case "SET_ACTIVE_INSPECTOR_TAB":
              case "UPDATE_VIEW_STATE":
                return { ...C, ...gn(_, C) };
              case "SET_EDITORS":
              case "SET_CURRENT_EDITOR_NAME":
                return qt(_, C);
              default:
                return C;
            }
          }(k, a, c);
          return p && (p.ui = function(_, C, z) {
            if (!C) return { activeTab: pt.get("active-view-tab-name") || "Inspect", showElementTypes: pt.get("view-element-types") === "true" };
            switch (z.type) {
              case "SET_VIEW_ACTIVE_TAB":
                return function(ne, de) {
                  return pt.set("active-view-tab-name", de.tabName), { ...ne, activeTab: de.tabName };
                }(C, z);
              case "TOGGLE_VIEW_SHOW_ELEMENT_TYPES":
                return function(ne, de) {
                  const pe = !de.showElementTypes;
                  return pt.set("view-element-types", pe), { ...de, showElementTypes: pe };
                }(0, C);
              default:
                return C;
            }
          }(0, p.ui, c)), p;
        }
        function qt(k, a = {}) {
          const c = Tt(k), p = Object(en.d)(c), _ = p[0] ? p[0].rootName : null;
          return { ...a, ...gn(k, a, { currentRootName: _ }), currentRootName: _, currentNode: null, currentNodeDefinition: null };
        }
        function gn(k, a, c) {
          const p = { ...a, ...c }, _ = p.currentRootName, C = Object(en.c)(Tt(k), _), z = Object(en.e)({ currentEditor: Tt(k), currentRootName: _, ranges: C });
          let ne = p.currentNode, de = p.currentNodeDefinition;
          return ne ? ne.root.rootName !== _ || !Object(Yt.g)(ne) && !ne.parent ? (ne = null, de = null) : de = Object(en.b)(ne) : de = null, { treeDefinition: z, currentNode: ne, currentNodeDefinition: de, ranges: C };
        }
        function Sr() {
          return { type: "UPDATE_COMMANDS_STATE" };
        }
        var ut = h(1);
        function Cr({ editors: k, currentEditorName: a }, c) {
          if (!c) return null;
          const p = k.get(a).commands.get(c);
          return { currentCommandName: c, type: "Command", url: "https://ckeditor.com/docs/ckeditor5/latest/api/module_core_command-Command.html", properties: Object(ut.b)({ isEnabled: { value: p.isEnabled }, value: { value: p.value } }), command: p };
        }
        function bn({ editors: k, currentEditorName: a }) {
          if (!k.get(a)) return [];
          const c = [];
          for (const [p, _] of k.get(a).commands) {
            const C = [];
            _.value !== void 0 && C.push(["value", Object(ut.a)(_.value, !1)]), c.push({ name: p, type: "element", children: [], node: p, attributes: C, presentation: { isEmpty: !0, cssClass: ["ck-inspector-tree-node_tagless", _.isEnabled ? "" : "ck-inspector-tree-node_disabled"].join(" ") } });
          }
          return c.sort((p, _) => p.name > _.name ? 1 : -1);
        }
        function Tr(k, a = {}) {
          return { ...a, currentCommandName: null, currentCommandDefinition: null, treeDefinition: bn(k) };
        }
        function ir(k) {
          return { type: "SET_SCHEMA_CURRENT_DEFINITION_NAME", currentSchemaDefinitionName: k };
        }
        const ar = ["isBlock", "isInline", "isObject", "isContent", "isLimit", "isSelectable"], Cn = "https://ckeditor.com/docs/ckeditor5/latest/api/";
        function sr({ editors: k, currentEditorName: a }, c) {
          if (!c) return null;
          const p = k.get(a).model.schema, _ = p.getDefinitions()[c], C = {}, z = {}, ne = {};
          let de = {};
          for (const pe of ar) _[pe] && (C[pe] = { value: _[pe] });
          for (const pe of _.allowChildren.sort()) z[pe] = { value: !0, title: "Click to see the definition of " + pe };
          for (const pe of _.allowIn.sort()) ne[pe] = { value: !0, title: "Click to see the definition of " + pe };
          for (const pe of _.allowAttributes.sort()) de[pe] = { value: !0 };
          de = Object(ut.b)(de);
          for (const pe in de) {
            const Ee = p.getAttributeProperties(pe), Pe = {};
            for (const We in Ee) Pe[We] = { value: Ee[We] };
            de[pe].subProperties = Object(ut.b)(Pe);
          }
          return { currentSchemaDefinitionName: c, type: "SchemaCompiledItemDefinition", urls: { general: Cn + "module_engine_model_schema-SchemaCompiledItemDefinition.html", allowAttributes: Cn + "module_engine_model_schema-SchemaItemDefinition.html#member-allowAttributes", allowChildren: Cn + "module_engine_model_schema-SchemaItemDefinition.html#member-allowChildren", allowIn: Cn + "module_engine_model_schema-SchemaItemDefinition.html#member-allowIn" }, properties: Object(ut.b)(C), allowChildren: Object(ut.b)(z), allowIn: Object(ut.b)(ne), allowAttributes: de, definition: _ };
        }
        function Tn({ editors: k, currentEditorName: a }) {
          if (!k.get(a)) return [];
          const c = [], p = k.get(a).model.schema.getDefinitions();
          for (const _ in p) c.push({ name: _, type: "element", children: [], node: _, attributes: [], presentation: { isEmpty: !0, cssClass: "ck-inspector-tree-node_tagless" } });
          return c.sort((_, C) => _.name > C.name ? 1 : -1);
        }
        function lr(k, a = {}) {
          return { ...a, currentSchemaDefinitionName: null, currentSchemaDefinition: null, treeDefinition: Tn(k) };
        }
        var On = h(8);
        function Gr(k, a) {
          const c = function(p, _) {
            switch (_.type) {
              case "SET_EDITORS":
                return function(C, z) {
                  const ne = { editors: new Map(z.editors) };
                  return z.editors.size ? z.editors.has(C.currentEditorName) || (ne.currentEditorName = Object(On.b)(z.editors)) : ne.currentEditorName = null, { ...C, ...ne };
                }(p, _);
              case "SET_CURRENT_EDITOR_NAME":
                return function(C, z) {
                  return { ...C, currentEditorName: z.editorName };
                }(p, _);
              default:
                return p;
            }
          }(k, a);
          return c.currentEditorGlobals = function(p, _, C) {
            switch (C.type) {
              case "SET_EDITORS":
              case "SET_CURRENT_EDITOR_NAME":
                return { ...Xr(p, {}) };
              case "UPDATE_CURRENT_EDITOR_IS_READ_ONLY":
                return Xr(p, _);
              default:
                return _;
            }
          }(c, c.currentEditorGlobals, a), c.ui = function(p, _) {
            if (!p.activeTab) {
              let C;
              return C = p.isCollapsed !== void 0 ? p.isCollapsed : pt.get("is-collapsed") === "true", { ...p, isCollapsed: C, activeTab: pt.get("active-tab-name") || "Model", height: pt.get("height") || "400px", sidePaneWidth: pt.get("side-pane-width") || "500px" };
            }
            switch (_.type) {
              case "TOGGLE_IS_COLLAPSED":
                return function(C) {
                  const z = !C.isCollapsed;
                  return pt.set("is-collapsed", z), { ...C, isCollapsed: z };
                }(p);
              case "SET_HEIGHT":
                return function(C, z) {
                  return pt.set("height", z.newHeight), { ...C, height: z.newHeight };
                }(p, _);
              case "SET_SIDE_PANE_WIDTH":
                return function(C, z) {
                  return pt.set("side-pane-width", z.newWidth), { ...C, sidePaneWidth: z.newWidth };
                }(p, _);
              case "SET_ACTIVE_INSPECTOR_TAB":
                return function(C, z) {
                  return pt.set("active-tab-name", z.tabName), { ...C, activeTab: z.tabName };
                }(p, _);
              default:
                return p;
            }
          }(c.ui, a), c.model = $n(c, c.model, a), c.view = xr(c, c.view, a), c.commands = function(p, _, C) {
            if (p.ui.activeTab !== "Commands") return _;
            if (!_) return Tr(p, _);
            switch (C.type) {
              case "SET_COMMANDS_CURRENT_COMMAND_NAME":
                return { ..._, currentCommandDefinition: Cr(p, C.currentCommandName), currentCommandName: C.currentCommandName };
              case "SET_ACTIVE_INSPECTOR_TAB":
              case "UPDATE_COMMANDS_STATE":
                return { ..._, currentCommandDefinition: Cr(p, _.currentCommandName), treeDefinition: bn(p) };
              case "SET_EDITORS":
              case "SET_CURRENT_EDITOR_NAME":
                return Tr(p, _);
              default:
                return _;
            }
          }(c, c.commands, a), c.schema = function(p, _, C) {
            if (p.ui.activeTab !== "Schema") return _;
            if (!_) return lr(p, _);
            switch (C.type) {
              case "SET_SCHEMA_CURRENT_DEFINITION_NAME":
                return { ..._, currentSchemaDefinition: sr(p, C.currentSchemaDefinitionName), currentSchemaDefinitionName: C.currentSchemaDefinitionName };
              case "SET_ACTIVE_INSPECTOR_TAB":
                return { ..._, currentSchemaDefinition: sr(p, _.currentSchemaDefinitionName), treeDefinition: Tn(p) };
              case "SET_EDITORS":
              case "SET_CURRENT_EDITOR_NAME":
                return lr(p, _);
              default:
                return _;
            }
          }(c, c.schema, a), { ...k, ...c };
        }
        function Xr(k, a) {
          const c = Tt(k);
          return { ...a, isReadOnly: !!c && c.isReadOnly };
        }
        var H = h(46), ae = h.n(H), we = /* @__PURE__ */ function() {
          var k = function(a, c) {
            return (k = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(p, _) {
              p.__proto__ = _;
            } || function(p, _) {
              for (var C in _) _.hasOwnProperty(C) && (p[C] = _[C]);
            })(a, c);
          };
          return function(a, c) {
            function p() {
              this.constructor = a;
            }
            k(a, c), a.prototype = c === null ? Object.create(c) : (p.prototype = c.prototype, new p());
          };
        }(), Se = function() {
          return (Se = Object.assign || function(k) {
            for (var a, c = 1, p = arguments.length; c < p; c++) for (var _ in a = arguments[c]) Object.prototype.hasOwnProperty.call(a, _) && (k[_] = a[_]);
            return k;
          }).apply(this, arguments);
        }, it = { top: { width: "100%", height: "10px", top: "-5px", left: "0px", cursor: "row-resize" }, right: { width: "10px", height: "100%", top: "0px", right: "-5px", cursor: "col-resize" }, bottom: { width: "100%", height: "10px", bottom: "-5px", left: "0px", cursor: "row-resize" }, left: { width: "10px", height: "100%", top: "0px", left: "-5px", cursor: "col-resize" }, topRight: { width: "20px", height: "20px", position: "absolute", right: "-10px", top: "-10px", cursor: "ne-resize" }, bottomRight: { width: "20px", height: "20px", position: "absolute", right: "-10px", bottom: "-10px", cursor: "se-resize" }, bottomLeft: { width: "20px", height: "20px", position: "absolute", left: "-10px", bottom: "-10px", cursor: "sw-resize" }, topLeft: { width: "20px", height: "20px", position: "absolute", left: "-10px", top: "-10px", cursor: "nw-resize" } }, qe = function(k) {
          function a() {
            var c = k !== null && k.apply(this, arguments) || this;
            return c.onMouseDown = function(p) {
              c.props.onResizeStart(p, c.props.direction);
            }, c.onTouchStart = function(p) {
              c.props.onResizeStart(p, c.props.direction);
            }, c;
          }
          return we(a, k), a.prototype.render = function() {
            return u.createElement("div", { className: this.props.className || "", style: Se(Se({ position: "absolute", userSelect: "none" }, it[this.props.direction]), this.props.replaceStyles || {}), onMouseDown: this.onMouseDown, onTouchStart: this.onTouchStart }, this.props.children);
          }, a;
        }(u.PureComponent), st = h(14), tt = h.n(st), Ot = /* @__PURE__ */ function() {
          var k = function(a, c) {
            return (k = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(p, _) {
              p.__proto__ = _;
            } || function(p, _) {
              for (var C in _) _.hasOwnProperty(C) && (p[C] = _[C]);
            })(a, c);
          };
          return function(a, c) {
            function p() {
              this.constructor = a;
            }
            k(a, c), a.prototype = c === null ? Object.create(c) : (p.prototype = c.prototype, new p());
          };
        }(), nt = function() {
          return (nt = Object.assign || function(k) {
            for (var a, c = 1, p = arguments.length; c < p; c++) for (var _ in a = arguments[c]) Object.prototype.hasOwnProperty.call(a, _) && (k[_] = a[_]);
            return k;
          }).apply(this, arguments);
        }, bt = { width: "auto", height: "auto" }, Nt = tt()(function(k, a, c) {
          return Math.max(Math.min(k, c), a);
        }), tn = tt()(function(k, a) {
          return Math.round(k / a) * a;
        }), ht = tt()(function(k, a) {
          return new RegExp(k, "i").test(a);
        }), Wt = function(k) {
          return !!(k.touches && k.touches.length);
        }, Nn = tt()(function(k, a, c) {
          c === void 0 && (c = 0);
          var p = a.reduce(function(C, z, ne) {
            return Math.abs(z - k) < Math.abs(a[C] - k) ? ne : C;
          }, 0), _ = Math.abs(a[p] - k);
          return c === 0 || _ < c ? a[p] : k;
        }), ct = tt()(function(k, a) {
          return k.substr(k.length - a.length, a.length) === a;
        }), yn = tt()(function(k) {
          return (k = k.toString()) === "auto" || ct(k, "px") || ct(k, "%") || ct(k, "vh") || ct(k, "vw") || ct(k, "vmax") || ct(k, "vmin") ? k : k + "px";
        }), un = function(k, a, c, p) {
          if (k && typeof k == "string") {
            if (ct(k, "px")) return Number(k.replace("px", ""));
            if (ct(k, "%")) return a * (Number(k.replace("%", "")) / 100);
            if (ct(k, "vw")) return c * (Number(k.replace("vw", "")) / 100);
            if (ct(k, "vh")) return p * (Number(k.replace("vh", "")) / 100);
          }
          return k;
        }, Pn = tt()(function(k, a, c, p, _, C, z) {
          return p = un(p, k.width, a, c), _ = un(_, k.height, a, c), C = un(C, k.width, a, c), z = un(z, k.height, a, c), { maxWidth: p === void 0 ? void 0 : Number(p), maxHeight: _ === void 0 ? void 0 : Number(_), minWidth: C === void 0 ? void 0 : Number(C), minHeight: z === void 0 ? void 0 : Number(z) };
        }), Eo = ["as", "style", "className", "grid", "snap", "bounds", "boundsByDirection", "size", "defaultSize", "minWidth", "minHeight", "maxWidth", "maxHeight", "lockAspectRatio", "lockAspectRatioExtraWidth", "lockAspectRatioExtraHeight", "enable", "handleStyles", "handleClasses", "handleWrapperStyle", "handleWrapperClass", "children", "onResizeStart", "onResize", "onResizeStop", "handleComponent", "scale", "resizeRatio", "snapGap"], _o = function(k) {
          function a(c) {
            var p = k.call(this, c) || this;
            return p.ratio = 1, p.resizable = null, p.parentLeft = 0, p.parentTop = 0, p.resizableLeft = 0, p.resizableRight = 0, p.resizableTop = 0, p.resizableBottom = 0, p.targetLeft = 0, p.targetTop = 0, p.appendBase = function() {
              if (!p.resizable || !p.window) return null;
              var _ = p.parentNode;
              if (!_) return null;
              var C = p.window.document.createElement("div");
              return C.style.width = "100%", C.style.height = "100%", C.style.position = "absolute", C.style.transform = "scale(0, 0)", C.style.left = "0", C.style.flex = "0", C.classList ? C.classList.add("__resizable_base__") : C.className += "__resizable_base__", _.appendChild(C), C;
            }, p.removeBase = function(_) {
              var C = p.parentNode;
              C && C.removeChild(_);
            }, p.ref = function(_) {
              _ && (p.resizable = _);
            }, p.state = { isResizing: !1, width: (p.propsSize && p.propsSize.width) === void 0 ? "auto" : p.propsSize && p.propsSize.width, height: (p.propsSize && p.propsSize.height) === void 0 ? "auto" : p.propsSize && p.propsSize.height, direction: "right", original: { x: 0, y: 0, width: 0, height: 0 }, backgroundStyle: { height: "100%", width: "100%", backgroundColor: "rgba(0,0,0,0)", cursor: "auto", opacity: 0, position: "fixed", zIndex: 9999, top: "0", left: "0", bottom: "0", right: "0" }, flexBasis: void 0 }, p.onResizeStart = p.onResizeStart.bind(p), p.onMouseMove = p.onMouseMove.bind(p), p.onMouseUp = p.onMouseUp.bind(p), p;
          }
          return Ot(a, k), Object.defineProperty(a.prototype, "parentNode", { get: function() {
            return this.resizable ? this.resizable.parentNode : null;
          }, enumerable: !1, configurable: !0 }), Object.defineProperty(a.prototype, "window", { get: function() {
            return this.resizable && this.resizable.ownerDocument ? this.resizable.ownerDocument.defaultView : null;
          }, enumerable: !1, configurable: !0 }), Object.defineProperty(a.prototype, "propsSize", { get: function() {
            return this.props.size || this.props.defaultSize || bt;
          }, enumerable: !1, configurable: !0 }), Object.defineProperty(a.prototype, "size", { get: function() {
            var c = 0, p = 0;
            if (this.resizable && this.window) {
              var _ = this.resizable.offsetWidth, C = this.resizable.offsetHeight, z = this.resizable.style.position;
              z !== "relative" && (this.resizable.style.position = "relative"), c = this.resizable.style.width !== "auto" ? this.resizable.offsetWidth : _, p = this.resizable.style.height !== "auto" ? this.resizable.offsetHeight : C, this.resizable.style.position = z;
            }
            return { width: c, height: p };
          }, enumerable: !1, configurable: !0 }), Object.defineProperty(a.prototype, "sizeStyle", { get: function() {
            var c = this, p = this.props.size, _ = function(C) {
              if (c.state[C] === void 0 || c.state[C] === "auto") return "auto";
              if (c.propsSize && c.propsSize[C] && ct(c.propsSize[C].toString(), "%")) {
                if (ct(c.state[C].toString(), "%")) return c.state[C].toString();
                var z = c.getParentSize();
                return Number(c.state[C].toString().replace("px", "")) / z[C] * 100 + "%";
              }
              return yn(c.state[C]);
            };
            return { width: p && p.width !== void 0 && !this.state.isResizing ? yn(p.width) : _("width"), height: p && p.height !== void 0 && !this.state.isResizing ? yn(p.height) : _("height") };
          }, enumerable: !1, configurable: !0 }), a.prototype.getParentSize = function() {
            if (!this.parentNode) return this.window ? { width: this.window.innerWidth, height: this.window.innerHeight } : { width: 0, height: 0 };
            var c = this.appendBase();
            if (!c) return { width: 0, height: 0 };
            var p = !1, _ = this.parentNode.style.flexWrap;
            _ !== "wrap" && (p = !0, this.parentNode.style.flexWrap = "wrap"), c.style.position = "relative", c.style.minWidth = "100%";
            var C = { width: c.offsetWidth, height: c.offsetHeight };
            return p && (this.parentNode.style.flexWrap = _), this.removeBase(c), C;
          }, a.prototype.bindEvents = function() {
            this.window && (this.window.addEventListener("mouseup", this.onMouseUp), this.window.addEventListener("mousemove", this.onMouseMove), this.window.addEventListener("mouseleave", this.onMouseUp), this.window.addEventListener("touchmove", this.onMouseMove, { capture: !0, passive: !1 }), this.window.addEventListener("touchend", this.onMouseUp));
          }, a.prototype.unbindEvents = function() {
            this.window && (this.window.removeEventListener("mouseup", this.onMouseUp), this.window.removeEventListener("mousemove", this.onMouseMove), this.window.removeEventListener("mouseleave", this.onMouseUp), this.window.removeEventListener("touchmove", this.onMouseMove, !0), this.window.removeEventListener("touchend", this.onMouseUp));
          }, a.prototype.componentDidMount = function() {
            if (this.resizable && this.window) {
              var c = this.window.getComputedStyle(this.resizable);
              this.setState({ width: this.state.width || this.size.width, height: this.state.height || this.size.height, flexBasis: c.flexBasis !== "auto" ? c.flexBasis : void 0 });
            }
          }, a.prototype.componentWillUnmount = function() {
            this.window && this.unbindEvents();
          }, a.prototype.createSizeForCssProperty = function(c, p) {
            var _ = this.propsSize && this.propsSize[p];
            return this.state[p] !== "auto" || this.state.original[p] !== c || _ !== void 0 && _ !== "auto" ? c : "auto";
          }, a.prototype.calculateNewMaxFromBoundary = function(c, p) {
            var _, C, z = this.props.boundsByDirection, ne = this.state.direction, de = z && ht("left", ne), pe = z && ht("top", ne);
            if (this.props.bounds === "parent") {
              var Ee = this.parentNode;
              Ee && (_ = de ? this.resizableRight - this.parentLeft : Ee.offsetWidth + (this.parentLeft - this.resizableLeft), C = pe ? this.resizableBottom - this.parentTop : Ee.offsetHeight + (this.parentTop - this.resizableTop));
            } else this.props.bounds === "window" ? this.window && (_ = de ? this.resizableRight : this.window.innerWidth - this.resizableLeft, C = pe ? this.resizableBottom : this.window.innerHeight - this.resizableTop) : this.props.bounds && (_ = de ? this.resizableRight - this.targetLeft : this.props.bounds.offsetWidth + (this.targetLeft - this.resizableLeft), C = pe ? this.resizableBottom - this.targetTop : this.props.bounds.offsetHeight + (this.targetTop - this.resizableTop));
            return _ && Number.isFinite(_) && (c = c && c < _ ? c : _), C && Number.isFinite(C) && (p = p && p < C ? p : C), { maxWidth: c, maxHeight: p };
          }, a.prototype.calculateNewSizeFromDirection = function(c, p) {
            var _ = this.props.scale || 1, C = this.props.resizeRatio || 1, z = this.state, ne = z.direction, de = z.original, pe = this.props, Ee = pe.lockAspectRatio, Pe = pe.lockAspectRatioExtraHeight, We = pe.lockAspectRatioExtraWidth, Me = de.width, Ke = de.height, Ie = Pe || 0, Fe = We || 0;
            return ht("right", ne) && (Me = de.width + (c - de.x) * C / _, Ee && (Ke = (Me - Fe) / this.ratio + Ie)), ht("left", ne) && (Me = de.width - (c - de.x) * C / _, Ee && (Ke = (Me - Fe) / this.ratio + Ie)), ht("bottom", ne) && (Ke = de.height + (p - de.y) * C / _, Ee && (Me = (Ke - Ie) * this.ratio + Fe)), ht("top", ne) && (Ke = de.height - (p - de.y) * C / _, Ee && (Me = (Ke - Ie) * this.ratio + Fe)), { newWidth: Me, newHeight: Ke };
          }, a.prototype.calculateNewSizeFromAspectRatio = function(c, p, _, C) {
            var z = this.props, ne = z.lockAspectRatio, de = z.lockAspectRatioExtraHeight, pe = z.lockAspectRatioExtraWidth, Ee = C.width === void 0 ? 10 : C.width, Pe = _.width === void 0 || _.width < 0 ? c : _.width, We = C.height === void 0 ? 10 : C.height, Me = _.height === void 0 || _.height < 0 ? p : _.height, Ke = de || 0, Ie = pe || 0;
            if (ne) {
              var Fe = (We - Ke) * this.ratio + Ie, et = (Me - Ke) * this.ratio + Ie, Ye = (Ee - Ie) / this.ratio + Ke, Le = (Pe - Ie) / this.ratio + Ke, ft = Math.max(Ee, Fe), Dt = Math.min(Pe, et), It = Math.max(We, Ye), jt = Math.min(Me, Le);
              c = Nt(c, ft, Dt), p = Nt(p, It, jt);
            } else c = Nt(c, Ee, Pe), p = Nt(p, We, Me);
            return { newWidth: c, newHeight: p };
          }, a.prototype.setBoundingClientRect = function() {
            if (this.props.bounds === "parent") {
              var c = this.parentNode;
              if (c) {
                var p = c.getBoundingClientRect();
                this.parentLeft = p.left, this.parentTop = p.top;
              }
            }
            if (this.props.bounds && typeof this.props.bounds != "string") {
              var _ = this.props.bounds.getBoundingClientRect();
              this.targetLeft = _.left, this.targetTop = _.top;
            }
            if (this.resizable) {
              var C = this.resizable.getBoundingClientRect(), z = C.left, ne = C.top, de = C.right, pe = C.bottom;
              this.resizableLeft = z, this.resizableRight = de, this.resizableTop = ne, this.resizableBottom = pe;
            }
          }, a.prototype.onResizeStart = function(c, p) {
            if (this.resizable && this.window) {
              var _, C = 0, z = 0;
              if (c.nativeEvent && function(Pe) {
                return !!((Pe.clientX || Pe.clientX === 0) && (Pe.clientY || Pe.clientY === 0));
              }(c.nativeEvent)) {
                if (C = c.nativeEvent.clientX, z = c.nativeEvent.clientY, c.nativeEvent.which === 3) return;
              } else c.nativeEvent && Wt(c.nativeEvent) && (C = c.nativeEvent.touches[0].clientX, z = c.nativeEvent.touches[0].clientY);
              if (this.props.onResizeStart && this.resizable && this.props.onResizeStart(c, p, this.resizable) === !1) return;
              this.props.size && (this.props.size.height !== void 0 && this.props.size.height !== this.state.height && this.setState({ height: this.props.size.height }), this.props.size.width !== void 0 && this.props.size.width !== this.state.width && this.setState({ width: this.props.size.width })), this.ratio = typeof this.props.lockAspectRatio == "number" ? this.props.lockAspectRatio : this.size.width / this.size.height;
              var ne = this.window.getComputedStyle(this.resizable);
              if (ne.flexBasis !== "auto") {
                var de = this.parentNode;
                if (de) {
                  var pe = this.window.getComputedStyle(de).flexDirection;
                  this.flexDir = pe.startsWith("row") ? "row" : "column", _ = ne.flexBasis;
                }
              }
              this.setBoundingClientRect(), this.bindEvents();
              var Ee = { original: { x: C, y: z, width: this.size.width, height: this.size.height }, isResizing: !0, backgroundStyle: nt(nt({}, this.state.backgroundStyle), { cursor: this.window.getComputedStyle(c.target).cursor || "auto" }), direction: p, flexBasis: _ };
              this.setState(Ee);
            }
          }, a.prototype.onMouseMove = function(c) {
            if (this.state.isResizing && this.resizable && this.window) {
              if (this.window.TouchEvent && Wt(c)) try {
                c.preventDefault(), c.stopPropagation();
              } catch {
              }
              var p = this.props, _ = p.maxWidth, C = p.maxHeight, z = p.minWidth, ne = p.minHeight, de = Wt(c) ? c.touches[0].clientX : c.clientX, pe = Wt(c) ? c.touches[0].clientY : c.clientY, Ee = this.state, Pe = Ee.direction, We = Ee.original, Me = Ee.width, Ke = Ee.height, Ie = this.getParentSize(), Fe = Pn(Ie, this.window.innerWidth, this.window.innerHeight, _, C, z, ne);
              _ = Fe.maxWidth, C = Fe.maxHeight, z = Fe.minWidth, ne = Fe.minHeight;
              var et = this.calculateNewSizeFromDirection(de, pe), Ye = et.newHeight, Le = et.newWidth, ft = this.calculateNewMaxFromBoundary(_, C), Dt = this.calculateNewSizeFromAspectRatio(Le, Ye, { width: ft.maxWidth, height: ft.maxHeight }, { width: z, height: ne });
              if (Le = Dt.newWidth, Ye = Dt.newHeight, this.props.grid) {
                var It = tn(Le, this.props.grid[0]), jt = tn(Ye, this.props.grid[1]), _t = this.props.snapGap || 0;
                Le = _t === 0 || Math.abs(It - Le) <= _t ? It : Le, Ye = _t === 0 || Math.abs(jt - Ye) <= _t ? jt : Ye;
              }
              this.props.snap && this.props.snap.x && (Le = Nn(Le, this.props.snap.x, this.props.snapGap)), this.props.snap && this.props.snap.y && (Ye = Nn(Ye, this.props.snap.y, this.props.snapGap));
              var zt = { width: Le - We.width, height: Ye - We.height };
              Me && typeof Me == "string" && (ct(Me, "%") ? Le = Le / Ie.width * 100 + "%" : ct(Me, "vw") ? Le = Le / this.window.innerWidth * 100 + "vw" : ct(Me, "vh") && (Le = Le / this.window.innerHeight * 100 + "vh")), Ke && typeof Ke == "string" && (ct(Ke, "%") ? Ye = Ye / Ie.height * 100 + "%" : ct(Ke, "vw") ? Ye = Ye / this.window.innerWidth * 100 + "vw" : ct(Ke, "vh") && (Ye = Ye / this.window.innerHeight * 100 + "vh"));
              var dt = { width: this.createSizeForCssProperty(Le, "width"), height: this.createSizeForCssProperty(Ye, "height") };
              this.flexDir === "row" ? dt.flexBasis = dt.width : this.flexDir === "column" && (dt.flexBasis = dt.height), this.setState(dt), this.props.onResize && this.props.onResize(c, Pe, this.resizable, zt);
            }
          }, a.prototype.onMouseUp = function(c) {
            var p = this.state, _ = p.isResizing, C = p.direction, z = p.original;
            if (_ && this.resizable) {
              var ne = { width: this.size.width - z.width, height: this.size.height - z.height };
              this.props.onResizeStop && this.props.onResizeStop(c, C, this.resizable, ne), this.props.size && this.setState(this.props.size), this.unbindEvents(), this.setState({ isResizing: !1, backgroundStyle: nt(nt({}, this.state.backgroundStyle), { cursor: "auto" }) });
            }
          }, a.prototype.updateSize = function(c) {
            this.setState({ width: c.width, height: c.height });
          }, a.prototype.renderResizer = function() {
            var c = this, p = this.props, _ = p.enable, C = p.handleStyles, z = p.handleClasses, ne = p.handleWrapperStyle, de = p.handleWrapperClass, pe = p.handleComponent;
            if (!_) return null;
            var Ee = Object.keys(_).map(function(Pe) {
              return _[Pe] !== !1 ? u.createElement(qe, { key: Pe, direction: Pe, onResizeStart: c.onResizeStart, replaceStyles: C && C[Pe], className: z && z[Pe] }, pe && pe[Pe] ? pe[Pe] : null) : null;
            });
            return u.createElement("div", { className: de, style: ne }, Ee);
          }, a.prototype.render = function() {
            var c = this, p = Object.keys(this.props).reduce(function(z, ne) {
              return Eo.indexOf(ne) !== -1 || (z[ne] = c.props[ne]), z;
            }, {}), _ = nt(nt(nt({ position: "relative", userSelect: this.state.isResizing ? "none" : "auto" }, this.props.style), this.sizeStyle), { maxWidth: this.props.maxWidth, maxHeight: this.props.maxHeight, minWidth: this.props.minWidth, minHeight: this.props.minHeight, boxSizing: "border-box", flexShrink: 0 });
            this.state.flexBasis && (_.flexBasis = this.state.flexBasis);
            var C = this.props.as || "div";
            return u.createElement(C, nt({ ref: this.ref, style: _, className: this.props.className }, p), this.state.isResizing && u.createElement("div", { style: this.state.backgroundStyle }), this.props.children, this.renderResizer());
          }, a.defaultProps = { as: "div", onResizeStart: function() {
          }, onResize: function() {
          }, onResizeStop: function() {
          }, enable: { top: !0, right: !0, bottom: !0, left: !0, topRight: !0, bottomRight: !0, bottomLeft: !0, topLeft: !0 }, style: {}, grid: [1, 1], lockAspectRatio: !1, lockAspectRatioExtraWidth: 0, lockAspectRatioExtraHeight: 0, scale: 1, resizeRatio: 1, snapGap: 0 }, a;
        }(u.PureComponent), rt = function(k, a) {
          return (rt = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(c, p) {
            c.__proto__ = p;
          } || function(c, p) {
            for (var _ in p) p.hasOwnProperty(_) && (c[_] = p[_]);
          })(k, a);
        }, Ue = function() {
          return (Ue = Object.assign || function(k) {
            for (var a, c = 1, p = arguments.length; c < p; c++) for (var _ in a = arguments[c]) Object.prototype.hasOwnProperty.call(a, _) && (k[_] = a[_]);
            return k;
          }).apply(this, arguments);
        }, Yn = ae.a, Kt = { width: "auto", height: "auto", display: "inline-block", position: "absolute", top: 0, left: 0 }, Or = function(k) {
          function a(c) {
            var p = k.call(this, c) || this;
            return p.resizing = !1, p.resizingPosition = { x: 0, y: 0 }, p.offsetFromParent = { left: 0, top: 0 }, p.resizableElement = { current: null }, p.refDraggable = function(_) {
              _ && (p.draggable = _);
            }, p.refResizable = function(_) {
              _ && (p.resizable = _, p.resizableElement.current = _.resizable);
            }, p.state = { original: { x: 0, y: 0 }, bounds: { top: 0, right: 0, bottom: 0, left: 0 }, maxWidth: c.maxWidth, maxHeight: c.maxHeight }, p.onResizeStart = p.onResizeStart.bind(p), p.onResize = p.onResize.bind(p), p.onResizeStop = p.onResizeStop.bind(p), p.onDragStart = p.onDragStart.bind(p), p.onDrag = p.onDrag.bind(p), p.onDragStop = p.onDragStop.bind(p), p.getMaxSizesFromProps = p.getMaxSizesFromProps.bind(p), p;
          }
          return function(c, p) {
            function _() {
              this.constructor = c;
            }
            rt(c, p), c.prototype = p === null ? Object.create(p) : (_.prototype = p.prototype, new _());
          }(a, k), a.prototype.componentDidMount = function() {
            this.updateOffsetFromParent();
            var c = this.offsetFromParent, p = c.left, _ = c.top, C = this.getDraggablePosition(), z = C.x, ne = C.y;
            this.draggable.setState({ x: z - p, y: ne - _ }), this.forceUpdate();
          }, a.prototype.getDraggablePosition = function() {
            var c = this.draggable.state;
            return { x: c.x, y: c.y };
          }, a.prototype.getParent = function() {
            return this.resizable && this.resizable.parentNode;
          }, a.prototype.getParentSize = function() {
            return this.resizable.getParentSize();
          }, a.prototype.getMaxSizesFromProps = function() {
            return { maxWidth: this.props.maxWidth === void 0 ? Number.MAX_SAFE_INTEGER : this.props.maxWidth, maxHeight: this.props.maxHeight === void 0 ? Number.MAX_SAFE_INTEGER : this.props.maxHeight };
          }, a.prototype.getSelfElement = function() {
            return this.resizable && this.resizable.resizable;
          }, a.prototype.getOffsetHeight = function(c) {
            var p = this.props.scale;
            switch (this.props.bounds) {
              case "window":
                return window.innerHeight / p;
              case "body":
                return document.body.offsetHeight / p;
              default:
                return c.offsetHeight;
            }
          }, a.prototype.getOffsetWidth = function(c) {
            var p = this.props.scale;
            switch (this.props.bounds) {
              case "window":
                return window.innerWidth / p;
              case "body":
                return document.body.offsetWidth / p;
              default:
                return c.offsetWidth;
            }
          }, a.prototype.onDragStart = function(c, p) {
            if (this.props.onDragStart && this.props.onDragStart(c, p), this.props.bounds) {
              var _, C = this.getParent(), z = this.props.scale;
              if (this.props.bounds === "parent") _ = C;
              else {
                if (this.props.bounds === "body") {
                  var ne = C.getBoundingClientRect(), de = ne.left, pe = ne.top, Ee = document.body.getBoundingClientRect(), Pe = -(de - C.offsetLeft * z - Ee.left) / z, We = -(pe - C.offsetTop * z - Ee.top) / z, Me = (document.body.offsetWidth - this.resizable.size.width * z) / z + Pe, Ke = (document.body.offsetHeight - this.resizable.size.height * z) / z + We;
                  return this.setState({ bounds: { top: We, right: Me, bottom: Ke, left: Pe } });
                }
                if (this.props.bounds === "window") {
                  if (!this.resizable) return;
                  var Ie = C.getBoundingClientRect(), Fe = Ie.left, et = Ie.top, Ye = -(Fe - C.offsetLeft * z) / z, Le = -(et - C.offsetTop * z) / z;
                  return Me = (window.innerWidth - this.resizable.size.width * z) / z + Ye, Ke = (window.innerHeight - this.resizable.size.height * z) / z + Le, this.setState({ bounds: { top: Le, right: Me, bottom: Ke, left: Ye } });
                }
                _ = document.querySelector(this.props.bounds);
              }
              if (_ instanceof HTMLElement && C instanceof HTMLElement) {
                var ft = _.getBoundingClientRect(), Dt = ft.left, It = ft.top, jt = C.getBoundingClientRect(), _t = (Dt - jt.left) / z, zt = It - jt.top;
                if (this.resizable) {
                  this.updateOffsetFromParent();
                  var dt = this.offsetFromParent;
                  this.setState({ bounds: { top: zt - dt.top, right: _t + (_.offsetWidth - this.resizable.size.width) - dt.left / z, bottom: zt + (_.offsetHeight - this.resizable.size.height) - dt.top, left: _t - dt.left / z } });
                }
              }
            }
          }, a.prototype.onDrag = function(c, p) {
            if (this.props.onDrag) {
              var _ = this.offsetFromParent;
              return this.props.onDrag(c, Ue(Ue({}, p), { x: p.x - _.left, y: p.y - _.top }));
            }
          }, a.prototype.onDragStop = function(c, p) {
            if (this.props.onDragStop) {
              var _ = this.offsetFromParent, C = _.left, z = _.top;
              return this.props.onDragStop(c, Ue(Ue({}, p), { x: p.x + C, y: p.y + z }));
            }
          }, a.prototype.onResizeStart = function(c, p, _) {
            c.stopPropagation(), this.resizing = !0;
            var C = this.props.scale, z = this.offsetFromParent, ne = this.getDraggablePosition();
            if (this.resizingPosition = { x: ne.x + z.left, y: ne.y + z.top }, this.setState({ original: ne }), this.props.bounds) {
              var de = this.getParent(), pe = void 0;
              pe = this.props.bounds === "parent" ? de : this.props.bounds === "body" ? document.body : this.props.bounds === "window" ? window : document.querySelector(this.props.bounds);
              var Ee = this.getSelfElement();
              if (Ee instanceof Element && (pe instanceof HTMLElement || pe === window) && de instanceof HTMLElement) {
                var Pe = this.getMaxSizesFromProps(), We = Pe.maxWidth, Me = Pe.maxHeight, Ke = this.getParentSize();
                if (We && typeof We == "string") if (We.endsWith("%")) {
                  var Ie = Number(We.replace("%", "")) / 100;
                  We = Ke.width * Ie;
                } else We.endsWith("px") && (We = Number(We.replace("px", "")));
                Me && typeof Me == "string" && (Me.endsWith("%") ? (Ie = Number(Me.replace("%", "")) / 100, Me = Ke.width * Ie) : Me.endsWith("px") && (Me = Number(Me.replace("px", ""))));
                var Fe = Ee.getBoundingClientRect(), et = Fe.left, Ye = Fe.top, Le = this.props.bounds === "window" ? { left: 0, top: 0 } : pe.getBoundingClientRect(), ft = Le.left, Dt = Le.top, It = this.getOffsetWidth(pe), jt = this.getOffsetHeight(pe), _t = p.toLowerCase().endsWith("left"), zt = p.toLowerCase().endsWith("right"), dt = p.startsWith("top"), Mn = p.startsWith("bottom");
                if (_t && this.resizable) {
                  var lt = (et - ft) / C + this.resizable.size.width;
                  this.setState({ maxWidth: lt > Number(We) ? We : lt });
                }
                (zt || this.props.lockAspectRatio && !_t) && (lt = It + (ft - et) / C, this.setState({ maxWidth: lt > Number(We) ? We : lt })), dt && this.resizable && (lt = (Ye - Dt) / C + this.resizable.size.height, this.setState({ maxHeight: lt > Number(Me) ? Me : lt })), (Mn || this.props.lockAspectRatio && !dt) && (lt = jt + (Dt - Ye) / C, this.setState({ maxHeight: lt > Number(Me) ? Me : lt }));
              }
            } else this.setState({ maxWidth: this.props.maxWidth, maxHeight: this.props.maxHeight });
            this.props.onResizeStart && this.props.onResizeStart(c, p, _);
          }, a.prototype.onResize = function(c, p, _, C) {
            var z = { x: this.state.original.x, y: this.state.original.y }, ne = -C.width, de = -C.height;
            ["top", "left", "topLeft", "bottomLeft", "topRight"].indexOf(p) !== -1 && (p === "bottomLeft" ? z.x += ne : (p === "topRight" || (z.x += ne), z.y += de)), z.x === this.draggable.state.x && z.y === this.draggable.state.y || this.draggable.setState(z), this.updateOffsetFromParent();
            var pe = this.offsetFromParent, Ee = this.getDraggablePosition().x + pe.left, Pe = this.getDraggablePosition().y + pe.top;
            this.resizingPosition = { x: Ee, y: Pe }, this.props.onResize && this.props.onResize(c, p, _, C, { x: Ee, y: Pe });
          }, a.prototype.onResizeStop = function(c, p, _, C) {
            this.resizing = !1;
            var z = this.getMaxSizesFromProps(), ne = z.maxWidth, de = z.maxHeight;
            this.setState({ maxWidth: ne, maxHeight: de }), this.props.onResizeStop && this.props.onResizeStop(c, p, _, C, this.resizingPosition);
          }, a.prototype.updateSize = function(c) {
            this.resizable && this.resizable.updateSize({ width: c.width, height: c.height });
          }, a.prototype.updatePosition = function(c) {
            this.draggable.setState(c);
          }, a.prototype.updateOffsetFromParent = function() {
            var c = this.props.scale, p = this.getParent(), _ = this.getSelfElement();
            if (!p || _ === null) return { top: 0, left: 0 };
            var C = p.getBoundingClientRect(), z = C.left, ne = C.top, de = _.getBoundingClientRect(), pe = this.getDraggablePosition();
            this.offsetFromParent = { left: de.left - z - pe.x * c, top: de.top - ne - pe.y * c };
          }, a.prototype.render = function() {
            var c = this.props, p = c.disableDragging, _ = c.style, C = c.dragHandleClassName, z = c.position, ne = c.onMouseDown, de = c.onMouseUp, pe = c.dragAxis, Ee = c.dragGrid, Pe = c.bounds, We = c.enableUserSelectHack, Me = c.cancel, Ke = c.children, Ie = (c.onResizeStart, c.onResize, c.onResizeStop, c.onDragStart, c.onDrag, c.onDragStop, c.resizeHandleStyles), Fe = c.resizeHandleClasses, et = c.resizeHandleComponent, Ye = c.enableResizing, Le = c.resizeGrid, ft = c.resizeHandleWrapperClass, Dt = c.resizeHandleWrapperStyle, It = c.scale, jt = c.allowAnyClick, _t = function($t, fn) {
              var Gn = {};
              for (var Gt in $t) Object.prototype.hasOwnProperty.call($t, Gt) && fn.indexOf(Gt) < 0 && (Gn[Gt] = $t[Gt]);
              if ($t != null && typeof Object.getOwnPropertySymbols == "function") {
                var dn = 0;
                for (Gt = Object.getOwnPropertySymbols($t); dn < Gt.length; dn++) fn.indexOf(Gt[dn]) < 0 && Object.prototype.propertyIsEnumerable.call($t, Gt[dn]) && (Gn[Gt[dn]] = $t[Gt[dn]]);
              }
              return Gn;
            }(c, ["disableDragging", "style", "dragHandleClassName", "position", "onMouseDown", "onMouseUp", "dragAxis", "dragGrid", "bounds", "enableUserSelectHack", "cancel", "children", "onResizeStart", "onResize", "onResizeStop", "onDragStart", "onDrag", "onDragStop", "resizeHandleStyles", "resizeHandleClasses", "resizeHandleComponent", "enableResizing", "resizeGrid", "resizeHandleWrapperClass", "resizeHandleWrapperStyle", "scale", "allowAnyClick"]), zt = this.props.default ? Ue({}, this.props.default) : void 0;
            delete _t.default;
            var dt, Mn = p || C ? { cursor: "auto" } : { cursor: "move" }, lt = Ue(Ue(Ue({}, Kt), Mn), _), An = this.offsetFromParent, Hn = An.left, zr = An.top;
            z && (dt = { x: z.x - Hn, y: z.y - zr });
            var xt, io = this.resizing ? void 0 : dt, In = this.resizing ? "both" : pe;
            return Object(u.createElement)(Yn, { ref: this.refDraggable, handle: C ? "." + C : void 0, defaultPosition: zt, onMouseDown: ne, onMouseUp: de, onStart: this.onDragStart, onDrag: this.onDrag, onStop: this.onDragStop, axis: In, disabled: p, grid: Ee, bounds: Pe ? this.state.bounds : void 0, position: io, enableUserSelectHack: We, cancel: Me, scale: It, allowAnyClick: jt, nodeRef: this.resizableElement }, Object(u.createElement)(_o, Ue({}, _t, { ref: this.refResizable, defaultSize: zt, size: this.props.size, enable: typeof Ye == "boolean" ? (xt = Ye, { bottom: xt, bottomLeft: xt, bottomRight: xt, left: xt, right: xt, top: xt, topLeft: xt, topRight: xt }) : Ye, onResizeStart: this.onResizeStart, onResize: this.onResize, onResizeStop: this.onResizeStop, style: lt, minWidth: this.props.minWidth, minHeight: this.props.minHeight, maxWidth: this.resizing ? this.state.maxWidth : this.props.maxWidth, maxHeight: this.resizing ? this.state.maxHeight : this.props.maxHeight, grid: Le, handleWrapperClass: ft, handleWrapperStyle: Dt, lockAspectRatio: this.props.lockAspectRatio, lockAspectRatioExtraWidth: this.props.lockAspectRatioExtraWidth, lockAspectRatioExtraHeight: this.props.lockAspectRatioExtraHeight, handleStyles: Ie, handleClasses: Fe, handleComponent: et, scale: this.props.scale }), Ke));
          }, a.defaultProps = { maxWidth: Number.MAX_SAFE_INTEGER, maxHeight: Number.MAX_SAFE_INTEGER, scale: 1, onResizeStart: function() {
          }, onResize: function() {
          }, onResizeStop: function() {
          }, onDragStart: function() {
          }, onDrag: function() {
          }, onDragStop: function() {
          } }, a;
        }(u.PureComponent);
        h(58);
        class At extends u.Component {
          constructor(a) {
            super(a), this.handleTabClick = this.handleTabClick.bind(this);
          }
          handleTabClick(a) {
            this.setState({ activeTab: a }, () => {
              this.props.onClick(a);
            });
          }
          render() {
            return o.a.createElement("div", { className: "ck-inspector-horizontal-nav" }, this.props.definitions.map((a) => o.a.createElement(nn, { key: a, label: a, isActive: this.props.activeTab === a, onClick: () => this.handleTabClick(a) })));
          }
        }
        class nn extends u.Component {
          render() {
            return o.a.createElement("button", { className: ["ck-inspector-horizontal-nav__item", this.props.isActive ? " ck-inspector-horizontal-nav__item_active" : ""].join(" "), key: this.props.label, onClick: this.props.onClick, type: "button" }, this.props.label);
          }
        }
        h(60);
        class Ht extends u.Component {
          render() {
            const a = Array.isArray(this.props.children) ? this.props.children : [this.props.children];
            return o.a.createElement("div", { className: "ck-inspector-navbox" }, a.length > 1 ? o.a.createElement("div", { className: "ck-inspector-navbox__navigation" }, a[0]) : "", o.a.createElement("div", { className: "ck-inspector-navbox__content" }, a[a.length - 1]));
          }
        }
        class Qt extends u.Component {
          constructor(a) {
            super(a), this.handleTabClick = this.handleTabClick.bind(this);
          }
          handleTabClick(a) {
            this.props.onTabChange(a);
          }
          render() {
            const a = Array.isArray(this.props.children) ? this.props.children : [this.props.children];
            return o.a.createElement(Ht, null, [this.props.contentBefore, o.a.createElement(At, { key: "navigation", definitions: a.map((c) => c.props.label), activeTab: this.props.activeTab, onClick: this.handleTabClick }), this.props.contentAfter], a.filter((c) => c.props.label === this.props.activeTab));
          }
        }
        var cr = h(5), Dn = h.n(cr);
        class rn extends u.Component {
          render() {
            return [o.a.createElement("label", { htmlFor: this.props.id, key: "label" }, this.props.label, ":"), o.a.createElement("select", { id: this.props.id, value: this.props.value, onChange: this.props.onChange, key: "select" }, this.props.options.map((a) => o.a.createElement("option", { value: a, key: a }, a)))];
          }
          shouldComponentUpdate(a) {
            return !Dn()(this.props, a);
          }
        }
        h(62);
        class yt extends u.PureComponent {
          render() {
            const a = ["ck-inspector-button", this.props.className || "", this.props.isOn ? "ck-inspector-button_on" : "", this.props.isEnabled === !1 ? "ck-inspector-button_disabled" : ""].filter((c) => c).join(" ");
            return o.a.createElement("button", { className: a, type: "button", onClick: this.props.isEnabled === !1 ? () => {
            } : this.props.onClick, title: this.props.title || this.props.text }, o.a.createElement("span", null, this.props.text), this.props.icon);
          }
        }
        h(64);
        class Et extends u.Component {
          render() {
            return o.a.createElement("div", { className: ["ck-inspector-pane", this.props.splitVertically ? "ck-inspector-pane_vsplit" : "", this.props.isEmpty ? "ck-inspector-pane_empty" : ""].join(" ") }, this.props.children);
          }
        }
        h(66);
        const ur = { position: "relative" };
        class fr extends u.Component {
          get maxSidePaneWidth() {
            return Math.min(window.innerWidth - 400, 0.8 * window.innerWidth);
          }
          render() {
            return o.a.createElement("div", { className: "ck-inspector-side-pane" }, o.a.createElement(Or, { enableResizing: { left: !0 }, disableDragging: !0, minWidth: 200, maxWidth: this.maxSidePaneWidth, style: ur, position: { x: "100%", y: "100%" }, size: { width: this.props.sidePaneWidth, height: "100%" }, onResizeStop: (a, c, p) => this.props.setSidePaneWidth(p.style.width) }, this.props.children));
          }
        }
        var vn = Re(({ ui: { sidePaneWidth: k } }) => ({ sidePaneWidth: k }), { setSidePaneWidth: function(k) {
          return { type: "SET_SIDE_PANE_WIDTH", newWidth: k };
        } })(fr), Ut = h(11);
        h(68);
        class Vt extends u.PureComponent {
          render() {
            return [o.a.createElement("input", { type: "checkbox", className: "ck-inspector-checkbox", id: this.props.id, key: "input", checked: this.props.isChecked, onChange: this.props.onChange }), o.a.createElement("label", { htmlFor: this.props.id, key: "label" }, this.props.label)];
          }
        }
        class on extends u.Component {
          constructor(a) {
            super(a), this.handleTreeClick = this.handleTreeClick.bind(this), this.handleRootChange = this.handleRootChange.bind(this);
          }
          handleTreeClick(a, c) {
            a.persist(), a.stopPropagation(), this.props.setModelCurrentNode(c), a.detail === 2 && this.props.setModelActiveTab("Inspect");
          }
          handleRootChange(a) {
            this.props.setModelCurrentRootName(a.target.value);
          }
          render() {
            const a = this.props.editors.get(this.props.currentEditorName);
            return o.a.createElement(Ht, null, [o.a.createElement("div", { className: "ck-inspector-tree__config", key: "root-cfg" }, o.a.createElement(rn, { id: "view-root-select", label: "Root", value: this.props.currentRootName, options: Object(gt.d)(a).map((c) => c.rootName), onChange: this.handleRootChange })), o.a.createElement("span", { className: "ck-inspector-separator", key: "separator" }), o.a.createElement("div", { className: "ck-inspector-tree__config", key: "text-cfg" }, o.a.createElement(Vt, { label: "Compact text", id: "model-compact-text", isChecked: this.props.showCompactText, onChange: this.props.toggleModelShowCompactText }), o.a.createElement(Vt, { label: "Show markers", id: "model-show-markers", isChecked: this.props.showMarkers, onChange: this.props.toggleModelShowMarkers }))], o.a.createElement(Ut.a, { className: [this.props.showMarkers ? "" : "ck-inspector-model-tree__hide-markers"], definition: this.props.treeDefinition, textDirection: a.locale.contentLanguageDirection, onClick: this.handleTreeClick, showCompactText: this.props.showCompactText, activeNode: this.props.currentNode }));
          }
        }
        var qn = Re(({ editors: k, currentEditorName: a, model: { treeDefinition: c, currentRootName: p, currentNode: _, ui: { showMarkers: C, showCompactText: z } } }) => ({ treeDefinition: c, editors: k, currentEditorName: a, currentRootName: p, currentNode: _, showMarkers: C, showCompactText: z }), { toggleModelShowCompactText: function() {
          return { type: "TOGGLE_MODEL_SHOW_COMPACT_TEXT" };
        }, setModelCurrentRootName: function(k) {
          return { type: "SET_MODEL_CURRENT_ROOT_NAME", currentRootName: k };
        }, toggleModelShowMarkers: function() {
          return { type: "TOGGLE_MODEL_SHOW_MARKERS" };
        }, setModelCurrentNode: function(k) {
          return { type: "SET_MODEL_CURRENT_NODE", currentNode: k };
        }, setModelActiveTab: Ve })(on);
        h(70);
        class dr extends u.Component {
          render() {
            const a = this.props.presentation && this.props.presentation.expandCollapsibles, c = [];
            for (const p in this.props.itemDefinitions) {
              const _ = this.props.itemDefinitions[p], { subProperties: C, presentation: z = {} } = _, ne = C && Object.keys(C).length, de = Object(ut.c)(String(_.value), 2e3), pe = [o.a.createElement(Zr, { key: `${this.props.name}-${p}-name`, name: p, listUid: this.props.name, canCollapse: ne, colorBox: z.colorBox, expandCollapsibles: a, onClick: this.props.onPropertyTitleClick, title: _.title }), o.a.createElement("dd", { key: `${this.props.name}-${p}-value` }, o.a.createElement("input", { id: `${this.props.name}-${p}-value-input`, type: "text", value: de, readOnly: !0 }))];
              ne && pe.push(o.a.createElement(dr, { name: `${this.props.name}-${p}`, key: `${this.props.name}-${p}`, itemDefinitions: C, presentation: this.props.presentation })), c.push(pe);
            }
            return o.a.createElement("dl", { className: "ck-inspector-property-list ck-inspector-code" }, c);
          }
          shouldComponentUpdate(a) {
            return !Dn()(this.props, a);
          }
        }
        class Zr extends u.PureComponent {
          constructor(a) {
            super(a), this.state = { isCollapsed: !this.props.expandCollapsibles }, this.handleCollapsedChange = this.handleCollapsedChange.bind(this);
          }
          handleCollapsedChange() {
            this.setState({ isCollapsed: !this.state.isCollapsed });
          }
          render() {
            const a = ["ck-inspector-property-list__title"];
            let c, p;
            return this.props.canCollapse && (a.push("ck-inspector-property-list__title_collapsible"), a.push("ck-inspector-property-list__title_" + (this.state.isCollapsed ? "collapsed" : "expanded")), c = o.a.createElement("button", { type: "button", onClick: this.handleCollapsedChange }, "Toggle")), this.props.colorBox && (p = o.a.createElement("span", { className: "ck-inspector-property-list__title__color-box", style: { background: this.props.colorBox } })), this.props.onClick && a.push("ck-inspector-property-list__title_clickable"), o.a.createElement("dt", { className: a.join(" ").trim() }, c, p, o.a.createElement("label", { htmlFor: `${this.props.listUid}-${this.props.name}-value-input`, onClick: this.props.onClick ? () => this.props.onClick(this.props.name) : null, title: this.props.title }, this.props.name), ":");
          }
        }
        h(72);
        function Nr() {
          return (Nr = Object.assign ? Object.assign.bind() : function(k) {
            for (var a = 1; a < arguments.length; a++) {
              var c = arguments[a];
              for (var p in c) Object.prototype.hasOwnProperty.call(c, p) && (k[p] = c[p]);
            }
            return k;
          }).apply(this, arguments);
        }
        class Bn extends u.PureComponent {
          render() {
            const a = [];
            for (const c of this.props.lists) Object.keys(c.itemDefinitions).length && a.push(o.a.createElement("hr", { key: c.name + "-separator" }), o.a.createElement("h3", { key: c.name + "-header" }, o.a.createElement("a", { href: c.url, target: "_blank", rel: "noopener noreferrer" }, c.name), c.buttons && c.buttons.map((p, _) => o.a.createElement(yt, Nr({ key: "button" + _ }, p)))), o.a.createElement(dr, { key: c.name + "-list", name: c.name, itemDefinitions: c.itemDefinitions, presentation: c.presentation, onPropertyTitleClick: c.onPropertyTitleClick }));
            return o.a.createElement("div", { className: "ck-inspector__object-inspector" }, o.a.createElement("h2", { className: "ck-inspector-code" }, this.props.header), a);
          }
        }
        var Pt = h(3);
        function xo() {
          return (xo = Object.assign ? Object.assign.bind() : function(k) {
            for (var a = 1; a < arguments.length; a++) {
              var c = arguments[a];
              for (var p in c) Object.prototype.hasOwnProperty.call(c, p) && (k[p] = c[p]);
            }
            return k;
          }).apply(this, arguments);
        }
        var wn = ({ styles: k = {}, ...a }) => o.a.createElement("svg", xo({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, a), o.a.createElement("path", { d: "M17 15.75a.75.75 0 01.102 1.493L17 17.25H9a.75.75 0 01-.102-1.493L9 15.75h8zM2.156 2.947l.095.058 7.58 5.401a.75.75 0 01.084 1.152l-.083.069-7.58 5.425a.75.75 0 01-.958-1.148l.086-.071 6.724-4.815-6.723-4.792a.75.75 0 01-.233-.95l.057-.096a.75.75 0 01.951-.233z" }));
        function Pr() {
          return (Pr = Object.assign ? Object.assign.bind() : function(k) {
            for (var a = 1; a < arguments.length; a++) {
              var c = arguments[a];
              for (var p in c) Object.prototype.hasOwnProperty.call(c, p) && (k[p] = c[p]);
            }
            return k;
          }).apply(this, arguments);
        }
        var Ca = ({ styles: k = {}, ...a }) => o.a.createElement("svg", Pr({ fill: "none", xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 19 19" }, a), o.a.createElement("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M6 1a1 1 0 011-1h5a1 1 0 011 1v5a1 1 0 01-1 1h-2v2h5a1 1 0 011 1v3h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3a1 1 0 011-1h1v-2.5a.5.5 0 00-.5-.5H10v3h1a1 1 0 011 1v3a1 1 0 01-1 1H8a1 1 0 01-1-1v-3a1 1 0 011-1h1v-3H4.5a.5.5 0 00-.5.5V13h1a1 1 0 011 1v3a1 1 0 01-1 1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1v-3a1 1 0 011-1h5V7H7a1 1 0 01-1-1V1zm1.5 4.5v-4h4v4h-4zm-5 11v-2h2v2h-2zm6-2v2h2v-2h-2zm6 2v-2h2v2h-2z", fill: "#000" }));
        class So extends u.Component {
          constructor(a) {
            super(a), this.handleNodeLogButtonClick = this.handleNodeLogButtonClick.bind(this), this.handleNodeSchemaButtonClick = this.handleNodeSchemaButtonClick.bind(this);
          }
          handleNodeLogButtonClick() {
            Pt.a.log(this.props.currentNodeDefinition.editorNode);
          }
          handleNodeSchemaButtonClick() {
            const a = this.props.editors.get(this.props.currentEditorName).model.schema.getDefinition(this.props.currentNodeDefinition.editorNode);
            this.props.setActiveTab("Schema"), this.props.setSchemaCurrentDefinitionName(a.name);
          }
          render() {
            const a = this.props.currentNodeDefinition;
            return a ? o.a.createElement(Bn, { header: [o.a.createElement("span", { key: "link" }, o.a.createElement("a", { href: a.url, target: "_blank", rel: "noopener noreferrer" }, o.a.createElement("b", null, a.type)), ":", a.type === "Text" ? o.a.createElement("em", null, a.name) : a.name), o.a.createElement(yt, { key: "log", icon: o.a.createElement(wn, null), text: "Log in console", onClick: this.handleNodeLogButtonClick }), o.a.createElement(yt, { key: "schema", icon: o.a.createElement(Ca, null), text: "Show in schema", onClick: this.handleNodeSchemaButtonClick })], lists: [{ name: "Attributes", url: a.url, itemDefinitions: a.attributes }, { name: "Properties", url: a.url, itemDefinitions: a.properties }] }) : o.a.createElement(Et, { isEmpty: "true" }, o.a.createElement("p", null, "Select a node in the tree to inspect"));
          }
        }
        var yi = Re(({ editors: k, currentEditorName: a, model: { currentNodeDefinition: c } }) => ({ editors: k, currentEditorName: a, currentNodeDefinition: c }), { setActiveTab: kt, setSchemaCurrentDefinitionName: ir })(So);
        function vi() {
          return (vi = Object.assign ? Object.assign.bind() : function(k) {
            for (var a = 1; a < arguments.length; a++) {
              var c = arguments[a];
              for (var p in c) Object.prototype.hasOwnProperty.call(c, p) && (k[p] = c[p]);
            }
            return k;
          }).apply(this, arguments);
        }
        var Dr = ({ styles: k = {}, ...a }) => o.a.createElement("svg", vi({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, a), o.a.createElement("path", { d: "M9.5 4.5c1.85 0 3.667.561 5.199 1.519C16.363 7.059 17.5 8.4 17.5 9.5s-1.137 2.441-2.801 3.481c-1.532.958-3.35 1.519-5.199 1.519-1.85 0-3.667-.561-5.199-1.519C2.637 11.941 1.5 10.6 1.5 9.5s1.137-2.441 2.801-3.481C5.833 5.06 7.651 4.5 9.5 4.5zm0 1a4 4 0 11-.2.005l.2-.005c-1.655 0-3.29.505-4.669 1.367C3.431 7.742 2.5 8.84 2.5 9.5c0 .66.931 1.758 2.331 2.633C6.21 12.995 7.845 13.5 9.5 13.5c1.655 0 3.29-.505 4.669-1.367 1.4-.875 2.331-1.974 2.331-2.633 0-.66-.931-1.758-2.331-2.633C12.79 6.005 11.155 5.5 9.5 5.5zM8 6.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" }));
        const pr = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_selection-Selection.html";
        class wi extends u.Component {
          constructor(a) {
            super(a), this.handleSelectionLogButtonClick = this.handleSelectionLogButtonClick.bind(this), this.handleScrollToSelectionButtonClick = this.handleScrollToSelectionButtonClick.bind(this);
          }
          handleSelectionLogButtonClick() {
            const a = this.props.editor;
            Pt.a.log(a.model.document.selection);
          }
          handleScrollToSelectionButtonClick() {
            const a = document.querySelector(".ck-inspector-tree__position.ck-inspector-tree__position_selection");
            a && a.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          render() {
            const a = this.props.editor, c = this.props.info;
            return o.a.createElement(Bn, { header: [o.a.createElement("span", { key: "link" }, o.a.createElement("a", { href: pr, target: "_blank", rel: "noopener noreferrer" }, o.a.createElement("b", null, "Selection"))), o.a.createElement(yt, { key: "log", icon: o.a.createElement(wn, null), text: "Log in console", onClick: this.handleSelectionLogButtonClick }), o.a.createElement(yt, { key: "scroll", icon: o.a.createElement(Dr, null), text: "Scroll to selection", onClick: this.handleScrollToSelectionButtonClick })], lists: [{ name: "Attributes", url: pr + "#function-getAttributes", itemDefinitions: c.attributes }, { name: "Properties", url: "" + pr, itemDefinitions: c.properties }, { name: "Anchor", url: pr + "#member-anchor", buttons: [{ icon: o.a.createElement(wn, null), text: "Log in console", onClick: () => Pt.a.log(a.model.document.selection.anchor) }], itemDefinitions: c.anchor }, { name: "Focus", url: pr + "#member-focus", buttons: [{ icon: o.a.createElement(wn, null), text: "Log in console", onClick: () => Pt.a.log(a.model.document.selection.focus) }], itemDefinitions: c.focus }, { name: "Ranges", url: pr + "#function-getRanges", buttons: [{ icon: o.a.createElement(wn, null), text: "Log in console", onClick: () => Pt.a.log(...a.model.document.selection.getRanges()) }], itemDefinitions: c.ranges, presentation: { expandCollapsibles: !0 } }] });
          }
        }
        var ki = Re(({ editors: k, currentEditorName: a, model: { ranges: c } }) => {
          const p = k.get(a);
          return { editor: p, currentEditorName: a, info: function(_, C) {
            const z = _.model.document.selection, ne = z.anchor, de = z.focus, pe = { properties: { isCollapsed: { value: z.isCollapsed }, isBackward: { value: z.isBackward }, isGravityOverridden: { value: z.isGravityOverridden }, rangeCount: { value: z.rangeCount } }, attributes: {}, anchor: Rr(Object(cn.a)(ne)), focus: Rr(Object(cn.a)(de)), ranges: {} };
            for (const [Ee, Pe] of z.getAttributes()) pe.attributes[Ee] = { value: Pe };
            C.forEach((Ee, Pe) => {
              pe.ranges[Pe] = { value: "", subProperties: { start: { value: "", subProperties: Object(ut.b)(Rr(Ee.start)) }, end: { value: "", subProperties: Object(ut.b)(Rr(Ee.end)) } } };
            });
            for (const Ee in pe) Ee !== "ranges" && (pe[Ee] = Object(ut.b)(pe[Ee]));
            return pe;
          }(p, c) };
        }, {})(wi);
        function Rr({ path: k, stickiness: a, index: c, isAtEnd: p, isAtStart: _, offset: C, textNode: z }) {
          return { path: { value: k }, stickiness: { value: a }, index: { value: c }, isAtEnd: { value: p }, isAtStart: { value: _ }, offset: { value: C }, textNode: { value: z } };
        }
        class Ta extends u.Component {
          render() {
            const a = function(_) {
              const C = {};
              for (const z of _) {
                const ne = z.name.split(":");
                let de = C;
                for (const pe of ne) {
                  const Ee = pe === ne[ne.length - 1];
                  de = de[pe] ? de[pe] : de[pe] = Ee ? z : {};
                }
              }
              return C;
            }(this.props.markers), c = function _(C) {
              const z = {};
              for (const ne in C) {
                const de = C[ne];
                if (de.name) {
                  const pe = Object(ut.b)(Ei(de));
                  z[ne] = { value: "", presentation: { colorBox: de.presentation.color }, subProperties: pe };
                } else {
                  const pe = Object.keys(de).length;
                  z[ne] = { value: pe + " marker" + (pe > 1 ? "s" : ""), subProperties: _(de) };
                }
              }
              return z;
            }(a), p = this.props.editors.get(this.props.currentEditorName);
            return Object.keys(a).length ? o.a.createElement(Bn, { header: [o.a.createElement("span", { key: "link" }, o.a.createElement("a", { href: "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_markercollection-Marker.html", target: "_blank", rel: "noopener noreferrer" }, o.a.createElement("b", null, "Markers"))), o.a.createElement(yt, { key: "log", icon: o.a.createElement(wn, null), text: "Log in console", onClick: () => Pt.a.log([...p.model.markers]) })], lists: [{ name: "Markers tree", itemDefinitions: c, presentation: { expandCollapsibles: !0 } }] }) : o.a.createElement(Et, { isEmpty: "true" }, o.a.createElement("p", null, "No markers in the document."));
          }
        }
        var Yo = Re(({ editors: k, currentEditorName: a, model: { markers: c } }) => ({ editors: k, currentEditorName: a, markers: c }), {})(Ta);
        function Ei({ name: k, start: a, end: c, affectsData: p, managedUsingOperations: _ }) {
          return { name: { value: k }, start: { value: a.path }, end: { value: c.path }, affectsData: { value: p }, managedUsingOperations: { value: _ } };
        }
        h(74);
        class qo extends u.Component {
          render() {
            return this.props.currentEditorName ? o.a.createElement(Et, { splitVertically: "true" }, o.a.createElement(qn, null), o.a.createElement(vn, null, o.a.createElement(Qt, { onTabChange: this.props.setModelActiveTab, activeTab: this.props.activeTab }, o.a.createElement(yi, { label: "Inspect" }), o.a.createElement(ki, { label: "Selection" }), o.a.createElement(Yo, { label: "Markers" })))) : o.a.createElement(Et, { isEmpty: "true" }, o.a.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
          }
        }
        var Oa = Re(({ currentEditorName: k, model: { ui: { activeTab: a } } }) => ({ currentEditorName: k, activeTab: a }), { setModelActiveTab: Ve })(qo);
        class Na extends u.Component {
          constructor(a) {
            super(a), this.handleTreeClick = this.handleTreeClick.bind(this), this.handleRootChange = this.handleRootChange.bind(this);
          }
          handleTreeClick(a, c) {
            a.persist(), a.stopPropagation(), this.props.setViewCurrentNode(c), a.detail === 2 && this.props.setViewActiveTab("Inspect");
          }
          handleRootChange(a) {
            this.props.setViewCurrentRootName(a.target.value);
          }
          render() {
            const a = this.props.editors.get(this.props.currentEditorName);
            return o.a.createElement(Ht, null, [o.a.createElement("div", { className: "ck-inspector-tree__config", key: "root-cfg" }, o.a.createElement(rn, { id: "view-root-select", label: "Root", value: this.props.currentRootName, options: Object(en.d)(a).map((c) => c.rootName), onChange: this.handleRootChange })), o.a.createElement("span", { className: "ck-inspector-separator", key: "separator" }), o.a.createElement("div", { className: "ck-inspector-tree__config", key: "types-cfg" }, o.a.createElement(Vt, { label: "Show element types", id: "view-show-types", isChecked: this.props.showElementTypes, onChange: this.props.toggleViewShowElementTypes }))], o.a.createElement(Ut.a, { definition: this.props.treeDefinition, textDirection: a.locale.contentLanguageDirection, onClick: this.handleTreeClick, showCompactText: "true", showElementTypes: this.props.showElementTypes, activeNode: this.props.currentNode }));
          }
        }
        var Co = Re(({ editors: k, currentEditorName: a, view: { treeDefinition: c, currentRootName: p, currentNode: _, ui: { showElementTypes: C } } }) => ({ treeDefinition: c, editors: k, currentEditorName: a, currentRootName: p, currentNode: _, showElementTypes: C }), { setViewCurrentRootName: function(k) {
          return { type: "SET_VIEW_CURRENT_ROOT_NAME", currentRootName: k };
        }, toggleViewShowElementTypes: function() {
          return { type: "TOGGLE_VIEW_SHOW_ELEMENT_TYPES" };
        }, setViewCurrentNode: function(k) {
          return { type: "SET_VIEW_CURRENT_NODE", currentNode: k };
        }, setViewActiveTab: _r })(Na);
        class mt extends u.Component {
          constructor(a) {
            super(a), this.handleNodeLogButtonClick = this.handleNodeLogButtonClick.bind(this);
          }
          handleNodeLogButtonClick() {
            Pt.a.log(this.props.currentNodeDefinition.editorNode);
          }
          render() {
            const a = this.props.currentNodeDefinition;
            return a ? o.a.createElement(Bn, { header: [o.a.createElement("span", { key: "link" }, o.a.createElement("a", { href: a.url, target: "_blank", rel: "noopener noreferrer" }, o.a.createElement("b", null, a.type), ":"), a.type === "Text" ? o.a.createElement("em", null, a.name) : a.name), o.a.createElement(yt, { key: "log", icon: o.a.createElement(wn, null), text: "Log in console", onClick: this.handleNodeLogButtonClick })], lists: [{ name: "Attributes", url: a.url, itemDefinitions: a.attributes }, { name: "Properties", url: a.url, itemDefinitions: a.properties }, { name: "Custom Properties", url: en.a + "_element-Element.html#function-getCustomProperty", itemDefinitions: a.customProperties }] }) : o.a.createElement(Et, { isEmpty: "true" }, o.a.createElement("p", null, "Select a node in the tree to inspect"));
          }
        }
        var Jr = Re(({ view: { currentNodeDefinition: k } }) => ({ currentNodeDefinition: k }), {})(mt);
        const eo = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_view_selection-Selection.html";
        class Pa extends u.Component {
          constructor(a) {
            super(a), this.handleSelectionLogButtonClick = this.handleSelectionLogButtonClick.bind(this), this.handleScrollToSelectionButtonClick = this.handleScrollToSelectionButtonClick.bind(this);
          }
          handleSelectionLogButtonClick() {
            const a = this.props.editor;
            Pt.a.log(a.editing.view.document.selection);
          }
          handleScrollToSelectionButtonClick() {
            const a = document.querySelector(".ck-inspector-tree__position.ck-inspector-tree__position_selection");
            a && a.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          render() {
            const a = this.props.editor, c = this.props.info;
            return o.a.createElement(Bn, { header: [o.a.createElement("span", { key: "link" }, o.a.createElement("a", { href: eo, target: "_blank", rel: "noopener noreferrer" }, o.a.createElement("b", null, "Selection"))), o.a.createElement(yt, { key: "log", icon: o.a.createElement(wn, null), text: "Log in console", onClick: this.handleSelectionLogButtonClick }), o.a.createElement(yt, { key: "scroll", icon: o.a.createElement(Dr, null), text: "Scroll to selection", onClick: this.handleScrollToSelectionButtonClick })], lists: [{ name: "Properties", url: "" + eo, itemDefinitions: c.properties }, { name: "Anchor", url: eo + "#member-anchor", buttons: [{ type: "log", text: "Log in console", onClick: () => Pt.a.log(a.editing.view.document.selection.anchor) }], itemDefinitions: c.anchor }, { name: "Focus", url: eo + "#member-focus", buttons: [{ type: "log", text: "Log in console", onClick: () => Pt.a.log(a.editing.view.document.selection.focus) }], itemDefinitions: c.focus }, { name: "Ranges", url: eo + "#function-getRanges", buttons: [{ type: "log", text: "Log in console", onClick: () => Pt.a.log(...a.editing.view.document.selection.getRanges()) }], itemDefinitions: c.ranges, presentation: { expandCollapsibles: !0 } }] });
          }
        }
        var To = Re(({ editors: k, currentEditorName: a, view: { ranges: c } }) => {
          const p = k.get(a);
          return { editor: p, currentEditorName: a, info: function(_, C) {
            const z = _.editing.view.document.selection, ne = { properties: { isCollapsed: { value: z.isCollapsed }, isBackward: { value: z.isBackward }, isFake: { value: z.isFake }, rangeCount: { value: z.rangeCount } }, anchor: Mr(Object(Yt.a)(z.anchor)), focus: Mr(Object(Yt.a)(z.focus)), ranges: {} };
            C.forEach((de, pe) => {
              ne.ranges[pe] = { value: "", subProperties: { start: { value: "", subProperties: Object(ut.b)(Mr(de.start)) }, end: { value: "", subProperties: Object(ut.b)(Mr(de.end)) } } };
            });
            for (const de in ne) de !== "ranges" && (ne[de] = Object(ut.b)(ne[de]));
            return ne;
          }(p, c) };
        }, {})(Pa);
        function Mr({ offset: k, isAtEnd: a, isAtStart: c, parent: p }) {
          return { offset: { value: k }, isAtEnd: { value: a }, isAtStart: { value: c }, parent: { value: p } };
        }
        class to extends u.Component {
          render() {
            return this.props.currentEditorName ? o.a.createElement(Et, { splitVertically: "true" }, o.a.createElement(Co, null), o.a.createElement(vn, null, o.a.createElement(Qt, { onTabChange: this.props.setViewActiveTab, activeTab: this.props.activeTab }, o.a.createElement(Jr, { label: "Inspect" }), o.a.createElement(To, { label: "Selection" })))) : o.a.createElement(Et, { isEmpty: "true" }, o.a.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
          }
        }
        var Da = Re(({ currentEditorName: k, view: { ui: { activeTab: a } } }) => ({ currentEditorName: k, activeTab: a }), { setViewActiveTab: _r, updateViewState: ko })(to);
        class _i extends u.Component {
          constructor(a) {
            super(a), this.handleTreeClick = this.handleTreeClick.bind(this);
          }
          handleTreeClick(a, c) {
            a.persist(), a.stopPropagation(), this.props.setCommandsCurrentCommandName(c);
          }
          render() {
            return o.a.createElement(Ht, null, o.a.createElement(Ut.a, { definition: this.props.treeDefinition, onClick: this.handleTreeClick, activeNode: this.props.currentCommandName }));
          }
        }
        var xi = Re(({ commands: { treeDefinition: k, currentCommandName: a } }) => ({ treeDefinition: k, currentCommandName: a }), { setCommandsCurrentCommandName: function(k) {
          return { type: "SET_COMMANDS_CURRENT_COMMAND_NAME", currentCommandName: k };
        } })(_i);
        function Si() {
          return (Si = Object.assign ? Object.assign.bind() : function(k) {
            for (var a = 1; a < arguments.length; a++) {
              var c = arguments[a];
              for (var p in c) Object.prototype.hasOwnProperty.call(c, p) && (k[p] = c[p]);
            }
            return k;
          }).apply(this, arguments);
        }
        var Ko = ({ styles: k = {}, ...a }) => o.a.createElement("svg", Si({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, a), o.a.createElement("path", { d: "M9.25 1.25a8 8 0 110 16 8 8 0 010-16zm0 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM7.344 6.485l4.98 2.765-4.98 3.018V6.485z" }));
        class Qo extends u.Component {
          constructor(a) {
            super(a), this.handleCommandLogButtonClick = this.handleCommandLogButtonClick.bind(this), this.handleCommandExecuteButtonClick = this.handleCommandExecuteButtonClick.bind(this);
          }
          handleCommandLogButtonClick() {
            Pt.a.log(this.props.currentCommandDefinition.command);
          }
          handleCommandExecuteButtonClick() {
            this.props.editors.get(this.props.currentEditorName).execute(this.props.currentCommandName);
          }
          render() {
            const a = this.props.currentCommandDefinition;
            return a ? o.a.createElement(Bn, { header: [o.a.createElement("span", { key: "link" }, o.a.createElement("a", { href: a.url, target: "_blank", rel: "noopener noreferrer" }, o.a.createElement("b", null, a.type)), ":", this.props.currentCommandName), o.a.createElement(yt, { key: "exec", icon: o.a.createElement(Ko, null), text: "Execute command", onClick: this.handleCommandExecuteButtonClick }), o.a.createElement(yt, { key: "log", icon: o.a.createElement(wn, null), text: "Log in console", onClick: this.handleCommandLogButtonClick })], lists: [{ name: "Properties", url: a.url, itemDefinitions: a.properties }] }) : o.a.createElement(Et, { isEmpty: "true" }, o.a.createElement("p", null, "Select a command to inspect"));
          }
        }
        var Ci = Re(({ editors: k, currentEditorName: a, commands: { currentCommandName: c, currentCommandDefinition: p } }) => ({ editors: k, currentEditorName: a, currentCommandName: c, currentCommandDefinition: p }), {})(Qo);
        class Wn extends u.Component {
          render() {
            return this.props.currentEditorName ? o.a.createElement(Et, { splitVertically: "true" }, o.a.createElement(xi, null), o.a.createElement(vn, null, o.a.createElement(Qt, { activeTab: "Inspect" }, o.a.createElement(Ci, { label: "Inspect" })))) : o.a.createElement(Et, { isEmpty: "true" }, o.a.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
          }
        }
        var Oo = Re(({ currentEditorName: k }) => ({ currentEditorName: k }), { updateCommandsState: Sr })(Wn);
        class Go extends u.Component {
          constructor(a) {
            super(a), this.handleTreeClick = this.handleTreeClick.bind(this);
          }
          handleTreeClick(a, c) {
            a.persist(), a.stopPropagation(), this.props.setSchemaCurrentDefinitionName(c);
          }
          render() {
            return o.a.createElement(Ht, null, o.a.createElement(Ut.a, { definition: this.props.treeDefinition, onClick: this.handleTreeClick, activeNode: this.props.currentSchemaDefinitionName }));
          }
        }
        var Ti = Re(({ schema: { treeDefinition: k, currentSchemaDefinitionName: a } }) => ({ treeDefinition: k, currentSchemaDefinitionName: a }), { setSchemaCurrentDefinitionName: ir })(Go);
        class Oi extends u.Component {
          render() {
            const a = this.props.currentSchemaDefinition;
            return a ? o.a.createElement(Bn, { header: [o.a.createElement("span", { key: "link" }, o.a.createElement("a", { href: a.urls.general, target: "_blank", rel: "noopener noreferrer" }, o.a.createElement("b", null, a.type)), ":", this.props.currentSchemaDefinitionName)], lists: [{ name: "Properties", url: a.urls.general, itemDefinitions: a.properties }, { name: "Allowed attributes", url: a.urls.allowAttributes, itemDefinitions: a.allowAttributes }, { name: "Allowed children", url: a.urls.allowChildren, itemDefinitions: a.allowChildren, onPropertyTitleClick: (c) => {
              this.props.setSchemaCurrentDefinitionName(c);
            } }, { name: "Allowed in", url: a.urls.allowIn, itemDefinitions: a.allowIn, onPropertyTitleClick: (c) => {
              this.props.setSchemaCurrentDefinitionName(c);
            } }] }) : o.a.createElement(Et, { isEmpty: "true" }, o.a.createElement("p", null, "Select a schema definition to inspect"));
          }
        }
        var Ni = Re(({ editors: k, currentEditorName: a, schema: { currentSchemaDefinitionName: c, currentSchemaDefinition: p } }) => ({ editors: k, currentEditorName: a, currentSchemaDefinitionName: c, currentSchemaDefinition: p }), { setSchemaCurrentDefinitionName: ir })(Oi);
        class Xo extends u.Component {
          render() {
            return this.props.currentEditorName ? o.a.createElement(Et, { splitVertically: "true" }, o.a.createElement(Ti, null), o.a.createElement(vn, null, o.a.createElement(Qt, { activeTab: "Inspect" }, o.a.createElement(Ni, { label: "Inspect" })))) : o.a.createElement(Et, { isEmpty: "true" }, o.a.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
          }
        }
        var Zo = Re(({ currentEditorName: k }) => ({ currentEditorName: k }))(Xo), Jo = h(47), Pi = h.n(Jo), ei = h(48), ti = h.n(ei);
        function Di() {
          return (Di = Object.assign ? Object.assign.bind() : function(k) {
            for (var a = 1; a < arguments.length; a++) {
              var c = arguments[a];
              for (var p in c) Object.prototype.hasOwnProperty.call(c, p) && (k[p] = c[p]);
            }
            return k;
          }).apply(this, arguments);
        }
        var Ar = ({ styles: k = {}, ...a }) => o.a.createElement("svg", Di({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, a), o.a.createElement("path", { d: "M12.936 0l5 4.5v12.502l-1.504-.001v.003h1.504v1.499h-5v-1.501l3.496-.001V5.208L12.21 1.516 3.436 1.5v15.504l3.5-.001v1.5h-5V0h11z" }), o.a.createElement("path", { d: "M10.374 9.463l.085.072.477.464L11 10v.06l3.545 3.453-1.047 1.075L11 12.155V19H9v-6.9l-2.424 2.476-1.072-1.05L9.4 9.547a.75.75 0 01.974-.084zM12.799 1.5l-.001 2.774h3.645v1.5h-5.144V1.5z" }));
        h(86);
        class Ri extends u.Component {
          constructor(a) {
            super(a), this.state = { isModalOpen: !1, editorDataValue: "" }, this.textarea = o.a.createRef();
          }
          render() {
            return [o.a.createElement(yt, { text: "Set editor data", icon: o.a.createElement(Ar, null), isEnabled: !!this.props.editor, onClick: () => this.setState({ isModalOpen: !0 }), key: "button" }), o.a.createElement(ti.a, { isOpen: this.state.isModalOpen, appElement: document.querySelector(".ck-inspector-wrapper"), onAfterOpen: this._handleModalAfterOpen.bind(this), overlayClassName: "ck-inspector-modal ck-inspector-quick-actions__set-data-modal", className: "ck-inspector-quick-actions__set-data-modal__content", onRequestClose: this._closeModal.bind(this), portalClassName: "ck-inspector-portal", shouldCloseOnEsc: !0, shouldCloseOnOverlayClick: !0, key: "modal" }, o.a.createElement("h2", null, "Set editor data"), o.a.createElement("textarea", { autoFocus: !0, ref: this.textarea, value: this.state.editorDataValue, placeholder: "Paste HTML here...", onChange: this._handlDataChange.bind(this), onKeyPress: (a) => {
              a.key == "Enter" && a.shiftKey && this._setEditorDataAndCloseModal();
            } }), o.a.createElement("div", { className: "ck-inspector-quick-actions__set-data-modal__buttons" }, o.a.createElement("button", { type: "button", onClick: () => {
              this.setState({ editorDataValue: this.props.editor.getData() }), this.textarea.current.focus();
            } }, "Load data"), o.a.createElement("button", { type: "button", title: "Cancel (Esc)", onClick: this._closeModal.bind(this) }, "Cancel"), o.a.createElement("button", { type: "button", title: "Set editor data (⇧+Enter)", onClick: this._setEditorDataAndCloseModal.bind(this) }, "Set data")))];
          }
          _setEditorDataAndCloseModal() {
            this.props.editor.setData(this.state.editorDataValue), this._closeModal();
          }
          _closeModal() {
            this.setState({ isModalOpen: !1 });
          }
          _handlDataChange(a) {
            this.setState({ editorDataValue: a.target.value });
          }
          _handleModalAfterOpen() {
            this.setState({ editorDataValue: this.props.editor.getData() }), this.textarea.current.select();
          }
        }
        function No() {
          return (No = Object.assign ? Object.assign.bind() : function(k) {
            for (var a = 1; a < arguments.length; a++) {
              var c = arguments[a];
              for (var p in c) Object.prototype.hasOwnProperty.call(c, p) && (k[p] = c[p]);
            }
            return k;
          }).apply(this, arguments);
        }
        var Kn = ({ styles: k = {}, ...a }) => o.a.createElement("svg", No({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, a), o.a.createElement("path", { d: "M12.936 0l5 4.5v14.003h-4.503L14.936 17h-10l1.503 1.503H1.936V0h11zm-9.5 1.5v15.504h12.996V5.208L12.21 1.516 3.436 1.5z" }), o.a.createElement("path", { d: "M12.799 1.5l-.001 2.774h3.645v1.5h-5.144V1.5zM9.675 18.859l-.085-.072-4.086-3.978 1.047-1.075L9 16.119V9h2v7.273l2.473-2.526 1.072 1.049-3.896 3.979a.75.75 0 01-.974.084z" }));
        function no() {
          return (no = Object.assign ? Object.assign.bind() : function(k) {
            for (var a = 1; a < arguments.length; a++) {
              var c = arguments[a];
              for (var p in c) Object.prototype.hasOwnProperty.call(c, p) && (k[p] = c[p]);
            }
            return k;
          }).apply(this, arguments);
        }
        var ro = ({ styles: k = {}, ...a }) => o.a.createElement("svg", no({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, a), o.a.createElement("path", { d: "M3.144 15.748l2.002 1.402-1.976.516-.026-1.918zM2.438 3.391l15.346 11.023-.875 1.218-5.202-3.736-2.877 4.286.006.005-3.055.797-2.646-1.852-.04-2.95-.006-.005.006-.008v-.025l.01.008L6.02 7.81l-4.457-3.2.876-1.22zM7.25 8.695l-2.13 3.198 3.277 2.294 2.104-3.158-3.25-2.334zM14.002 0l2.16 1.512-.856 1.222c.828.967 1.144 2.141.432 3.158l-2.416 3.599-1.214-.873 2.396-3.593.005.003c.317-.452-.16-1.332-1.064-1.966-.891-.624-1.865-.776-2.197-.349l-.006-.004-2.384 3.575-1.224-.879 2.376-3.539c.674-.932 1.706-1.155 3.096-.668l.046.018.85-1.216z" }));
        function Ir() {
          return (Ir = Object.assign ? Object.assign.bind() : function(k) {
            for (var a = 1; a < arguments.length; a++) {
              var c = arguments[a];
              for (var p in c) Object.prototype.hasOwnProperty.call(c, p) && (k[p] = c[p]);
            }
            return k;
          }).apply(this, arguments);
        }
        var oo = ({ styles: k = {}, ...a }) => o.a.createElement("svg", Ir({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, a), o.a.createElement("path", { d: "M11.28 1a1 1 0 01.948.684l.333 1 .018.066H16a.75.75 0 01.102 1.493L16 4.25h-.5V16a2 2 0 01-2 2h-8a2 2 0 01-2-2V4.25H3a.75.75 0 01-.102-1.493L3 2.75h3.42a1 1 0 01.019-.066l.333-1A1 1 0 017.721 1h3.558zM14 4.5H5V16a.5.5 0 00.41.492l.09.008h8a.5.5 0 00.492-.41L14 16V4.5zM7.527 6.06v8.951h-1V6.06h1zm5 0v8.951h-1V6.06h1zM10 6.06v8.951H9V6.06h1z" }));
        function Qn() {
          return (Qn = Object.assign ? Object.assign.bind() : function(k) {
            for (var a = 1; a < arguments.length; a++) {
              var c = arguments[a];
              for (var p in c) Object.prototype.hasOwnProperty.call(c, p) && (k[p] = c[p]);
            }
            return k;
          }).apply(this, arguments);
        }
        var ni = ({ styles: k = {}, ...a }) => o.a.createElement("svg", Qn({ viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg" }, a), o.a.createElement("path", { d: "M2.284 2.498c-.239.266-.184.617-.184 1.002V4H2a.5.5 0 00-.492.41L1.5 4.5V17a1 1 0 00.883.993L2.5 18h10a1 1 0 00.97-.752l-.081-.062c.438.368.976.54 1.507.526a2.5 2.5 0 01-2.232 1.783l-.164.005h-10a2.5 2.5 0 01-2.495-2.336L0 17V4.5a2 2 0 011.85-1.995L2 2.5l.284-.002zm10.532 0L13 2.5a2 2 0 011.995 1.85L15 4.5v2.28a2.243 2.243 0 00-1.5.404V4.5a.5.5 0 00-.41-.492L13 4v-.5l-.007-.144c-.031-.329.032-.626-.177-.858z" }), o.a.createElement("path", { d: "M6 .49l-.144.006a1.75 1.75 0 00-1.41.94l-.029.058.083-.004c-.69 0-1.25.56-1.25 1.25v1c0 .69.56 1.25 1.25 1.25h6c.69 0 1.25-.56 1.25-1.25v-1l-.006-.128a1.25 1.25 0 00-1.116-1.116l-.046-.002-.027-.058A1.75 1.75 0 009 .49H6zm0 1.5h3a.25.25 0 01.25.25l.007.102A.75.75 0 0010 2.99h.25v.5h-5.5v-.5H5a.75.75 0 00.743-.648l.007-.102A.25.25 0 016 1.99zm9.374 6.55a.75.75 0 01-.093 1.056l-2.33 1.954h6.127a.75.75 0 010 1.501h-5.949l2.19 1.837a.75.75 0 11-.966 1.15l-3.788-3.18a.747.747 0 01-.21-.285.75.75 0 01.17-.945l3.792-3.182a.75.75 0 011.057.093z" }));
        function Rn() {
          return (Rn = Object.assign ? Object.assign.bind() : function(k) {
            for (var a = 1; a < arguments.length; a++) {
              var c = arguments[a];
              for (var p in c) Object.prototype.hasOwnProperty.call(c, p) && (k[p] = c[p]);
            }
            return k;
          }).apply(this, arguments);
        }
        var Mi = ({ styles: k = {}, ...a }) => o.a.createElement("svg", Rn({ viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg" }, a), o.a.createElement("path", { fill: "#4fa800", d: "M6.972 16.615a.997.997 0 01-.744-.292l-4.596-4.596a1 1 0 111.414-1.414l3.926 3.926 9.937-9.937a1 1 0 011.414 1.415L7.717 16.323a.997.997 0 01-.745.292z" }));
        h(88);
        class Ai extends u.Component {
          constructor(a) {
            super(a), this.state = { isShiftKeyPressed: !1, wasEditorDataJustCopied: !1 }, this._keyDownHandler = this._handleKeyDown.bind(this), this._keyUpHandler = this._handleKeyUp.bind(this), this._readOnlyHandler = this._handleReadOnly.bind(this), this._editorDataJustCopiedTimeout = null;
          }
          render() {
            return o.a.createElement("div", { className: "ck-inspector-editor-quick-actions" }, o.a.createElement(yt, { text: "Log editor", icon: o.a.createElement(wn, null), isEnabled: !!this.props.editor, onClick: () => console.log(this.props.editor) }), this._getLogButton(), o.a.createElement(Ri, { editor: this.props.editor }), o.a.createElement(yt, { text: "Toggle read only", icon: o.a.createElement(ro, null), isOn: this.props.isReadOnly, isEnabled: !!this.props.editor, onClick: this._readOnlyHandler }), o.a.createElement(yt, { text: "Destroy editor", icon: o.a.createElement(oo, null), isEnabled: !!this.props.editor, onClick: () => {
              this.props.editor.destroy();
            } }));
          }
          componentDidMount() {
            document.addEventListener("keydown", this._keyDownHandler), document.addEventListener("keyup", this._keyUpHandler);
          }
          componentWillUnmount() {
            document.removeEventListener("keydown", this._keyDownHandler), document.removeEventListener("keyup", this._keyUpHandler), clearTimeout(this._editorDataJustCopiedTimeout);
          }
          _getLogButton() {
            let a, c;
            return this.state.wasEditorDataJustCopied ? (a = o.a.createElement(Mi, null), c = "Data copied to clipboard.") : (a = this.state.isShiftKeyPressed ? o.a.createElement(ni, null) : o.a.createElement(Kn, null), c = "Log editor data (press with Shift to copy)"), o.a.createElement(yt, { text: c, icon: a, className: this.state.wasEditorDataJustCopied ? "ck-inspector-button_data-copied" : "", isEnabled: !!this.props.editor, onClick: this._handleLogEditorDataClick.bind(this) });
          }
          _handleLogEditorDataClick({ shiftKey: a }) {
            a ? (Pi()(this.props.editor.getData()), this.setState({ wasEditorDataJustCopied: !0 }), clearTimeout(this._editorDataJustCopiedTimeout), this._editorDataJustCopiedTimeout = setTimeout(() => {
              this.setState({ wasEditorDataJustCopied: !1 });
            }, 3e3)) : console.log(this.props.editor.getData());
          }
          _handleKeyDown({ key: a }) {
            this.setState({ isShiftKeyPressed: a === "Shift" });
          }
          _handleKeyUp() {
            this.setState({ isShiftKeyPressed: !1 });
          }
          _handleReadOnly() {
            this.props.editor.isReadOnly ? this.props.editor.disableReadOnlyMode("Lock from Inspector (@ckeditor/ckeditor5-inspector)") : this.props.editor.enableReadOnlyMode("Lock from Inspector (@ckeditor/ckeditor5-inspector)");
          }
        }
        var Ra = Re(({ editors: k, currentEditorName: a, currentEditorGlobals: { isReadOnly: c } }) => ({ editor: k.get(a), isReadOnly: c }), {})(Ai);
        function Po() {
          return (Po = Object.assign ? Object.assign.bind() : function(k) {
            for (var a = 1; a < arguments.length; a++) {
              var c = arguments[a];
              for (var p in c) Object.prototype.hasOwnProperty.call(c, p) && (k[p] = c[p]);
            }
            return k;
          }).apply(this, arguments);
        }
        var Ma = ({ styles: k = {}, ...a }) => o.a.createElement("svg", Po({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, a), o.a.createElement("path", { d: "M17.03 6.47a.75.75 0 01.073.976l-.072.084-6.984 7a.75.75 0 01-.977.073l-.084-.072-7.016-7a.75.75 0 01.976-1.134l.084.072 6.485 6.47 6.454-6.469a.75.75 0 01.977-.073l.084.072z" }));
        h(37);
        const jr = { position: "fixed", bottom: "0", left: "0", right: "0", top: "auto" };
        class hr extends u.Component {
          constructor(a) {
            super(a), ji(this.props.height), document.body.style.setProperty("--ck-inspector-collapsed-height", "30px"), this.handleInspectorResize = this.handleInspectorResize.bind(this);
          }
          handleInspectorResize(a, c, p) {
            const _ = p.style.height;
            this.props.setHeight(_), ji(_);
          }
          render() {
            return this.props.isCollapsed ? (document.body.classList.remove("ck-inspector-body-expanded"), document.body.classList.add("ck-inspector-body-collapsed")) : (document.body.classList.remove("ck-inspector-body-collapsed"), document.body.classList.add("ck-inspector-body-expanded")), o.a.createElement(Or, { bounds: "window", enableResizing: { top: !this.props.isCollapsed }, disableDragging: !0, minHeight: "100", maxHeight: "100%", style: jr, className: ["ck-inspector", this.props.isCollapsed ? "ck-inspector_collapsed" : ""].join(" "), position: { x: 0, y: "100%" }, size: { width: "100%", height: this.props.isCollapsed ? 30 : this.props.height }, onResizeStop: this.handleInspectorResize }, o.a.createElement(Qt, { onTabChange: this.props.setActiveTab, contentBefore: o.a.createElement(Do, { key: "docs" }), activeTab: this.props.activeTab, contentAfter: [o.a.createElement(an, { key: "selector" }), o.a.createElement("span", { className: "ck-inspector-separator", key: "separator-a" }), o.a.createElement(Ra, { key: "quick-actions" }), o.a.createElement("span", { className: "ck-inspector-separator", key: "separator-b" }), o.a.createElement(Ro, { key: "inspector-toggle" })] }, o.a.createElement(Oa, { label: "Model" }), o.a.createElement(Da, { label: "View" }), o.a.createElement(Oo, { label: "Commands" }), o.a.createElement(Zo, { label: "Schema" })));
          }
          componentWillUnmount() {
            document.body.classList.remove("ck-inspector-body-expanded"), document.body.classList.remove("ck-inspector-body-collapsed");
          }
        }
        var ri = Re(({ editors: k, currentEditorName: a, ui: { isCollapsed: c, height: p, activeTab: _ } }) => ({ isCollapsed: c, height: p, editors: k, currentEditorName: a, activeTab: _ }), { toggleIsCollapsed: Mt, setHeight: function(k) {
          return { type: "SET_HEIGHT", newHeight: k };
        }, setEditors: wt, setCurrentEditorName: Jt, setActiveTab: kt })(hr);
        class Do extends u.Component {
          render() {
            return o.a.createElement("a", { className: "ck-inspector-navbox__navigation__logo", title: "Go to the documentation", href: "https://ckeditor.com/docs/ckeditor5/latest/", target: "_blank", rel: "noopener noreferrer" }, "CKEditor documentation");
          }
        }
        class Ii extends u.Component {
          constructor(a) {
            super(a), this.handleShortcut = this.handleShortcut.bind(this);
          }
          render() {
            return o.a.createElement(yt, { text: "Toggle inspector", icon: o.a.createElement(Ma, null), onClick: this.props.toggleIsCollapsed, title: "Toggle inspector (Alt+F12)", className: ["ck-inspector-navbox__navigation__toggle", this.props.isCollapsed ? " ck-inspector-navbox__navigation__toggle_up" : ""].join(" ") });
          }
          componentDidMount() {
            window.addEventListener("keydown", this.handleShortcut);
          }
          componentWillUnmount() {
            window.removeEventListener("keydown", this.handleShortcut);
          }
          handleShortcut(a) {
            (function(c) {
              return c.altKey && !c.shiftKey && !c.ctrlKey && c.key === "F12";
            })(a) && this.props.toggleIsCollapsed();
          }
        }
        const Ro = Re(({ ui: { isCollapsed: k } }) => ({ isCollapsed: k }), { toggleIsCollapsed: Mt })(Ii);
        class Mo extends u.Component {
          render() {
            return o.a.createElement("div", { className: "ck-inspector-editor-selector", key: "editor-selector" }, this.props.currentEditorName ? o.a.createElement(rn, { id: "inspector-editor-selector", label: "Instance", value: this.props.currentEditorName, options: [...this.props.editors].map(([a]) => a), onChange: (a) => this.props.setCurrentEditorName(a.target.value) }) : "");
          }
        }
        const an = Re(({ currentEditorName: k, editors: a }) => ({ currentEditorName: k, editors: a }), { setCurrentEditorName: Jt })(Mo);
        function ji(k) {
          document.body.style.setProperty("--ck-inspector-height", k);
        }
        h(90), window.CKEDITOR_INSPECTOR_VERSION = "4.1.0";
        class $e {
          constructor() {
            Pt.a.warn("[CKEditorInspector] Whoops! Looks like you tried to create an instance of the CKEditorInspector class. To attach the inspector, use the static CKEditorInspector.attach( editor ) method instead. For the latest API, please refer to https://github.com/ckeditor/ckeditor5-inspector/blob/master/README.md. ");
          }
          static attach(...a) {
            const { CKEDITOR_VERSION: c } = window;
            if (c) {
              const [C] = c.split(".").map(Number);
              C < 34 && Pt.a.warn("[CKEditorInspector] The inspector requires using CKEditor 5 in version 34 or higher. If you cannot update CKEditor 5, consider downgrading the major version of the inspector to version 3.");
            } else Pt.a.warn("[CKEditorInspector] Could not determine a version of CKEditor 5. Some of the functionalities may not work as expected.");
            const { editors: p, options: _ } = Object(On.c)(a);
            for (const C in p) {
              const z = p[C];
              Pt.a.group("%cAttached the inspector to a CKEditor 5 instance. To learn more, visit https://ckeditor.com/docs/ckeditor5.", "font-weight: bold;"), Pt.a.log(`Editor instance "${C}"`, z), Pt.a.groupEnd(), $e._editors.set(C, z), z.on("destroy", () => {
                $e.detach(C);
              }), $e._mount(_), $e._updateEditorsState();
            }
            return Object.keys(p);
          }
          static attachToAll(a) {
            const c = document.querySelectorAll(".ck.ck-content.ck-editor__editable"), p = [];
            for (const _ of c) {
              const C = _.ckeditorInstance;
              C && !$e._isAttachedTo(C) && p.push(...$e.attach(C, a));
            }
            return p;
          }
          static detach(a) {
            $e._wrapper && ($e._editors.delete(a), $e._updateEditorsState());
          }
          static destroy() {
            if (!$e._wrapper) return;
            m.a.unmountComponentAtNode($e._wrapper), $e._editors.clear(), $e._wrapper.remove();
            const a = $e._store.getState(), c = a.editors.get(a.currentEditorName);
            c && $e._editorListener.stopListening(c), $e._editorListener = null, $e._wrapper = null, $e._store = null;
          }
          static _updateEditorsState() {
            $e._store.dispatch(wt($e._editors));
          }
          static _mount(a) {
            if ($e._wrapper) return;
            const c = $e._wrapper = document.createElement("div");
            let p, _;
            c.className = "ck-inspector-wrapper", document.body.appendChild(c), $e._editorListener = new Er({ onModelChange() {
              const C = $e._store;
              C.getState().ui.isCollapsed || (C.dispatch({ type: "UPDATE_MODEL_STATE" }), C.dispatch({ type: "UPDATE_COMMANDS_STATE" }));
            }, onViewRender() {
              const C = $e._store;
              C.getState().ui.isCollapsed || C.dispatch({ type: "UPDATE_VIEW_STATE" });
            }, onReadOnlyChange() {
              $e._store.dispatch({ type: "UPDATE_CURRENT_EDITOR_IS_READ_ONLY" });
            } }), $e._store = P(Gr, { editors: $e._editors, currentEditorName: Object(On.b)($e._editors), currentEditorGlobals: {}, ui: { isCollapsed: a.isCollapsed } }), $e._store.subscribe(() => {
              const C = $e._store.getState(), z = C.editors.get(C.currentEditorName);
              p !== z && (p && $e._editorListener.stopListening(p), z && $e._editorListener.startListening(z), p = z);
            }), $e._store.subscribe(() => {
              const C = $e._store, z = C.getState().ui.isCollapsed, ne = _ && !z;
              _ = z, ne && (C.dispatch({ type: "UPDATE_MODEL_STATE" }), C.dispatch({ type: "UPDATE_COMMANDS_STATE" }), C.dispatch({ type: "UPDATE_VIEW_STATE" }));
            }), m.a.render(o.a.createElement(F, { store: $e._store }, o.a.createElement(ri, null)), c);
          }
          static _isAttachedTo(a) {
            return [...$e._editors.values()].includes(a);
          }
        }
        $e._editors = /* @__PURE__ */ new Map(), $e._wrapper = null;
      }]).default;
    });
  }(Ss)), Ss.exports;
}
var hu = pu();
const mu = /* @__PURE__ */ du(hu);
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
const gu = function(Oe) {
  const V = Oe.plugins.get(ec), E = $(Oe.ui.view.element), s = $(Oe.sourceElement), h = `ckeditor${Math.floor(Math.random() * 1e9)}`, u = [
    "keypress",
    "keyup",
    "change",
    "focus",
    "blur",
    "click",
    "mousedown",
    "mouseup"
  ].map((o) => `${o}.${h}`).join(" ");
  V.on("change:isSourceEditingMode", () => {
    const o = E.find(
      ".ck-source-editing-area"
    );
    if (V.isSourceEditingMode) {
      let O = o.attr("data-value");
      o.on(u, () => {
        O !== (O = o.attr("data-value")) && s.val(O);
      });
    } else
      o.off(`.${h}`);
  });
}, bu = function(Oe, V) {
  if (V.heading !== void 0) {
    var E = V.heading.options;
    E.find((s) => s.view === "h1") !== void 0 && Oe.keystrokes.set(
      "Ctrl+Alt+1",
      () => Oe.execute("heading", { value: "heading1" })
    ), E.find((s) => s.view === "h2") !== void 0 && Oe.keystrokes.set(
      "Ctrl+Alt+2",
      () => Oe.execute("heading", { value: "heading2" })
    ), E.find((s) => s.view === "h3") !== void 0 && Oe.keystrokes.set(
      "Ctrl+Alt+3",
      () => Oe.execute("heading", { value: "heading3" })
    ), E.find((s) => s.view === "h4") !== void 0 && Oe.keystrokes.set(
      "Ctrl+Alt+4",
      () => Oe.execute("heading", { value: "heading4" })
    ), E.find((s) => s.view === "h5") !== void 0 && Oe.keystrokes.set(
      "Ctrl+Alt+5",
      () => Oe.execute("heading", { value: "heading5" })
    ), E.find((s) => s.view === "h6") !== void 0 && Oe.keystrokes.set(
      "Ctrl+Alt+6",
      () => Oe.execute("heading", { value: "heading6" })
    ), E.find((s) => s.model === "paragraph") !== void 0 && Oe.keystrokes.set("Ctrl+Alt+p", "paragraph");
  }
}, yu = function(Oe, V) {
  let E = null;
  const s = Oe.editing.view.document, h = Oe.plugins.get("ClipboardPipeline");
  s.on("clipboardOutput", (u, o) => {
    E = Oe.id;
  }), s.on("clipboardInput", async (u, o) => {
    let O = o.dataTransfer.getData("text/html");
    if (O && O.includes("<craft-entry") && !(o.method == "drop" && E === Oe.id)) {
      if (o.method == "paste" || o.method == "drop" && E !== Oe.id) {
        let m = O, g = !1;
        const y = Craft.siteId;
        let b = null, S = null;
        const T = Oe.getData(), P = [...O.matchAll(/data-entry-id="([0-9]+)/g)];
        u.stop();
        const Z = $(Oe.ui.view.element);
        let j = Z.parents("form").data("elementEditor");
        await j.ensureIsDraftOrRevision(), b = j.settings.elementId, S = Z.parents(".field").data("layoutElement");
        for (let W = 0; W < P.length; W++) {
          let N = null;
          if (P[W][1] && (N = P[W][1]), N !== null) {
            const A = new RegExp('data-entry-id="' + N + '"');
            if (!(E === Oe.id && !A.test(T))) {
              let F = null;
              E !== Oe.id && (V.includes(fu) ? F = Oe.config.get("entryTypeOptions").map((R) => R.value) : (Craft.cp.displayError(
                Craft.t(
                  "ckeditor",
                  "This field doesn’t allow nested entries."
                )
              ), g = !0)), await Craft.sendActionRequest(
                "POST",
                "ckeditor/ckeditor/duplicate-nested-entry",
                {
                  data: {
                    entryId: N,
                    siteId: y,
                    targetEntryTypeIds: F,
                    targetOwnerId: b,
                    targetLayoutElementUid: S
                  }
                }
              ).then((R) => {
                R.data.newEntryId && (m = m.replace(
                  N,
                  R.data.newEntryId
                ));
              }).catch((R) => {
                var oe, K, I, M;
                g = !0, Craft.cp.displayError((K = (oe = R == null ? void 0 : R.response) == null ? void 0 : oe.data) == null ? void 0 : K.message), console.error((M = (I = R == null ? void 0 : R.response) == null ? void 0 : I.data) == null ? void 0 : M.additionalMessage);
              });
            }
          }
        }
        g || (o.content = Oe.data.htmlProcessor.toView(m), h.fire("inputTransformation", o));
      }
    }
  });
}, xu = async function(Oe, V) {
  typeof Oe == "string" && (Oe = document.querySelector(`#${Oe}`)), V.licenseKey = "GPL";
  const E = await Xc.create(Oe, V);
  return Craft.showCkeditorInspector && Craft.userIsAdmin && mu.attach(E), E.editing.view.change((s) => {
    const h = E.editing.view.document.getRoot();
    if (typeof V.accessibleFieldName < "u" && V.accessibleFieldName.length) {
      let u = h.getAttribute("aria-label");
      s.setAttribute(
        "aria-label",
        V.accessibleFieldName + ", " + u,
        h
      );
    }
    typeof V.describedBy < "u" && V.describedBy.length && s.setAttribute(
      "aria-describedby",
      V.describedBy,
      h
    );
  }), E.updateSourceElement(), E.model.document.on("change:data", () => {
    E.updateSourceElement();
  }), V.plugins.includes(ec) && gu(E), V.plugins.includes(Zc) && bu(E, V), yu(E, V.plugins), E;
};
export {
  fu as CraftEntries,
  wu as CraftImageInsertUI,
  ku as CraftLinkUI,
  _u as ImageEditor,
  Eu as ImageTransform,
  xu as create
};
