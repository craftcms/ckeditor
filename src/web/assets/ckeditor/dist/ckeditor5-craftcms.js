import { ImageInsertUI as Bc, ButtonView as Cs, icons as Zl, Command as Ts, Plugin as Bn, ImageUtils as Jl, Collection as _a, ViewModel as $o, createDropdown as xa, DropdownButtonView as Vc, addListToDropdown as Sa, Widget as Wc, viewToModelPositionOutsideModelElement as Hc, toWidget as $c, DomEventObserver as Yc, WidgetToolbarRepository as Ql, isWidget as qc, findAttributeRange as Kc, LinkUI as Gl, ContextualBalloon as Qc, Range as Gc, View as Xc, LabeledFieldView as Zc, createLabeledInputText as Jc, ClassicEditor as eu, SourceEditing as ec, Heading as tu } from "ckeditor5";
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class _u extends Bc {
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
    const L = this.editor.ui.componentFactory, b = (a) => this._createToolbarImageButton(a);
    L.add("insertImage", b), L.add("imageInsert", b);
  }
  get _assetSources() {
    return this.editor.config.get("assetSources");
  }
  _createToolbarImageButton(L) {
    const b = this.editor, a = b.t, u = new Cs(L);
    u.isEnabled = !0, u.label = a("Insert image"), u.icon = Zl.image, u.tooltip = !0;
    const c = b.commands.get("insertImage");
    return u.bind("isEnabled").to(c), this.listenTo(u, "execute", () => this._showImageSelectModal()), u;
  }
  _showImageSelectModal() {
    const L = this._assetSources, b = this.editor, a = b.config, u = Object.assign({}, a.get("assetSelectionCriteria"), {
      kind: "image"
    });
    Craft.createElementSelectorModal("craft\\elements\\Asset", {
      storageKey: `ckeditor:${this.pluginName}:'craft\\elements\\Asset'`,
      sources: L,
      criteria: u,
      defaultSiteId: a.get("elementSiteId"),
      transforms: a.get("transforms"),
      multiSelect: !0,
      autoFocusSearchBox: !1,
      onSelect: (c, o) => {
        this._processAssetUrls(c, o).then(() => {
          b.editing.view.focus();
        });
      },
      onHide: () => {
        b.editing.view.focus();
      },
      closeOtherModals: !1
    });
  }
  _processAssetUrls(L, b) {
    return new Promise((a) => {
      if (!L.length) {
        a();
        return;
      }
      const u = this.editor, c = u.config.get("defaultTransform"), o = new Craft.Queue(), x = [];
      o.on("afterRun", () => {
        u.execute("insertImage", { source: x }), a();
      });
      for (const m of L)
        o.push(
          () => new Promise((g) => {
            const v = this._isTransformUrl(m.url);
            if (!v && c)
              this._getTransformUrl(m.id, c, (y) => {
                x.push(y), g();
              });
            else {
              const y = this._buildAssetUrl(
                m.id,
                m.url,
                v ? b : c
              );
              x.push(y), g();
            }
          })
        );
    });
  }
  _buildAssetUrl(L, b, a) {
    return `${b}#asset:${L}:${a ? "transform:" + a : "url"}`;
  }
  _removeTransformFromUrl(L) {
    return L.replace(/(^|\/)(_[^\/]+\/)([^\/]+)$/, "$1$3");
  }
  _isTransformUrl(L) {
    return /(^|\/)_[^\/]+\/[^\/]+$/.test(L);
  }
  _getTransformUrl(L, b, a) {
    Craft.sendActionRequest("POST", "ckeditor/ckeditor/image-url", {
      data: {
        assetId: L,
        transform: b
      }
    }).then(({ data: u }) => {
      a(this._buildAssetUrl(L, u.url, b));
    }).catch(() => {
      alert("There was an error generating the transform URL.");
    });
  }
  _getAssetUrlComponents(L) {
    const b = L.match(
      /(.*)#asset:(\d+):(url|transform):?([a-zA-Z][a-zA-Z0-9_]*)?/
    );
    return b ? {
      url: b[1],
      assetId: b[2],
      transform: b[3] !== "url" ? b[4] : null
    } : null;
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class nu extends Ts {
  refresh() {
    const L = this._element(), b = this._srcInfo(L);
    this.isEnabled = !!b, b ? this.value = {
      transform: b.transform
    } : this.value = null;
  }
  _element() {
    const L = this.editor;
    return L.plugins.get("ImageUtils").getClosestSelectedImageElement(
      L.model.document.selection
    );
  }
  _srcInfo(L) {
    if (!L || !L.hasAttribute("src"))
      return null;
    const b = L.getAttribute("src"), a = b.match(
      /#asset:(\d+)(?::transform:([a-zA-Z][a-zA-Z0-9_]*))?/
    );
    return a ? {
      src: b,
      assetId: a[1],
      transform: a[2]
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
  execute(L) {
    const a = this.editor.model, u = this._element(), c = this._srcInfo(u);
    if (this.value = {
      transform: L.transform
    }, c) {
      const o = `#asset:${c.assetId}` + (L.transform ? `:transform:${L.transform}` : "");
      a.change((x) => {
        const m = c.src.replace(/#.*/, "") + o;
        x.setAttribute("src", m, u);
      }), Craft.sendActionRequest("post", "ckeditor/ckeditor/image-url", {
        data: {
          assetId: c.assetId,
          transform: L.transform
        }
      }).then(({ data: x }) => {
        a.change((m) => {
          const g = x.url + o;
          m.setAttribute("src", g, u), x.width && m.setAttribute("width", x.width, u), x.height && m.setAttribute("height", x.height, u);
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
class tc extends Bn {
  static get requires() {
    return [Jl];
  }
  static get pluginName() {
    return "ImageTransformEditing";
  }
  constructor(L) {
    super(L), L.config.define("transforms", []);
  }
  init() {
    const L = this.editor, b = new nu(L);
    L.commands.add("transformImage", b);
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
const ru = Zl.objectSizeMedium;
class ou extends Bn {
  static get requires() {
    return [tc];
  }
  static get pluginName() {
    return "ImageTransformUI";
  }
  init() {
    const L = this.editor, b = L.config.get("transforms"), a = L.commands.get("transformImage");
    this.bind("isEnabled").to(a), this._registerImageTransformDropdown(b);
  }
  /**
   * A helper function that creates a dropdown component for the plugin containing all the transform options defined in
   * the editor configuration.
   *
   * @param transforms An array of the available image transforms.
   */
  _registerImageTransformDropdown(L) {
    const b = this.editor, a = b.t, u = {
      name: "transformImage:original",
      value: null
    }, c = [
      u,
      ...L.map((x) => ({
        label: x.name,
        name: `transformImage:${x.handle}`,
        value: x.handle
      }))
    ], o = (x) => {
      const m = b.commands.get("transformImage"), g = xa(x, Vc), v = g.buttonView;
      return v.set({
        tooltip: a("Resize image"),
        commandValue: null,
        icon: ru,
        isToggleable: !0,
        label: this._getOptionLabelValue(u),
        withText: !0,
        class: "ck-resize-image-button"
      }), v.bind("label").to(m, "value", (y) => {
        if (!y || !y.transform)
          return this._getOptionLabelValue(u);
        const C = L.find(
          (T) => T.handle === y.transform
        );
        return C ? C.name : y.transform;
      }), g.bind("isEnabled").to(this), Sa(
        g,
        () => this._getTransformDropdownListItemDefinitions(c, m),
        {
          ariaLabel: a("Image resize list")
        }
      ), this.listenTo(g, "execute", (y) => {
        b.execute(y.source.commandName, {
          transform: y.source.commandValue
        }), b.editing.view.focus();
      }), g;
    };
    b.ui.componentFactory.add("transformImage", o);
  }
  /**
   * A helper function for creating an option label value string.
   *
   * @param option A transform option object.
   * @returns The option label.
   */
  _getOptionLabelValue(L) {
    return L.label || L.value || this.editor.t("Original");
  }
  /**
   * A helper function that parses the transform options and returns list item definitions ready for use in the dropdown.
   *
   * @param options The transform options.
   * @param command The transform image command.
   * @returns Dropdown item definitions.
   */
  _getTransformDropdownListItemDefinitions(L, b) {
    const a = new _a();
    return L.map((u) => {
      const c = {
        type: "button",
        model: new $o({
          commandName: "transformImage",
          commandValue: u.value,
          label: this._getOptionLabelValue(u),
          withText: !0,
          icon: null
        })
      };
      c.model.bind("isOn").to(b, "value", iu(u.value)), a.add(c);
    }), a;
  }
}
function iu(Te) {
  return (L) => {
    const b = L;
    return Te === null && b === Te ? !0 : b !== null && b.transform === Te;
  };
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class xu extends Bn {
  static get requires() {
    return [tc, ou];
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
class au extends Ts {
  refresh() {
    const L = this._element(), b = this._srcInfo(L);
    if (this.isEnabled = !!b, this.isEnabled) {
      let a = {
        assetId: b.assetId
      };
      Craft.sendActionRequest("POST", "ckeditor/ckeditor/image-permissions", {
        data: a
      }).then((u) => {
        u.data.editable === !1 && (this.isEnabled = !1);
      });
    }
  }
  /**
   * Returns the selected image element.
   */
  _element() {
    const L = this.editor;
    return L.plugins.get("ImageUtils").getClosestSelectedImageElement(
      L.model.document.selection
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
  _srcInfo(L) {
    if (!L || !L.hasAttribute("src"))
      return null;
    const b = L.getAttribute("src"), a = b.match(
      /(.*)#asset:(\d+)(?::transform:([a-zA-Z][a-zA-Z0-9_]*))?/
    );
    return a ? {
      src: b,
      baseSrc: a[1],
      assetId: a[2],
      transform: a[3]
    } : null;
  }
  /**
   * Executes the command.
   *
   * @fires execute
   */
  execute() {
    this.editor.model;
    const b = this._element(), a = this._srcInfo(b);
    if (a) {
      let u = {
        allowSavingAsNew: !1,
        // todo: we might want to change that, but currently we're doing the same functionality as in Redactor
        onSave: (c) => {
          this._reloadImage(a.assetId, c);
        },
        allowDegreeFractions: Craft.isImagick
      };
      new Craft.AssetImageEditor(a.assetId, u);
    }
  }
  /**
   * Reloads the matching images after save was triggered from the Image Editor.
   *
   * @param data
   */
  _reloadImage(L, b) {
    let u = this.editor.model;
    this._getAllImageAssets().forEach((o) => {
      if (o.srcInfo.assetId == L)
        if (o.srcInfo.transform) {
          let x = {
            assetId: o.srcInfo.assetId,
            handle: o.srcInfo.transform
          };
          Craft.sendActionRequest("POST", "assets/generate-transform", {
            data: x
          }).then((m) => {
            let g = m.data.url + "?" + (/* @__PURE__ */ new Date()).getTime() + "#asset:" + o.srcInfo.assetId + ":transform:" + o.srcInfo.transform;
            u.change((v) => {
              v.setAttribute("src", g, o.element);
            });
          });
        } else {
          let x = o.srcInfo.baseSrc + "?" + (/* @__PURE__ */ new Date()).getTime() + "#asset:" + o.srcInfo.assetId;
          u.change((m) => {
            m.setAttribute("src", x, o.element);
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
    const b = this.editor.model, a = b.createRangeIn(b.document.getRoot());
    let u = [];
    for (const c of a.getWalker({ ignoreElementEnd: !0 }))
      if (c.item.is("element") && c.item.name === "imageBlock") {
        let o = this._srcInfo(c.item);
        o && u.push({
          element: c.item,
          srcInfo: o
        });
      }
    return u;
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class nc extends Bn {
  static get requires() {
    return [Jl];
  }
  static get pluginName() {
    return "ImageEditorEditing";
  }
  init() {
    const L = this.editor, b = new au(L);
    L.commands.add("imageEditor", b);
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class su extends Bn {
  static get requires() {
    return [nc];
  }
  static get pluginName() {
    return "ImageEditorUI";
  }
  init() {
    const b = this.editor.commands.get("imageEditor");
    this.bind("isEnabled").to(b), this._registerImageEditorButton();
  }
  /**
   * A helper function that creates a button component for the plugin that triggers launch of the Image Editor.
   */
  _registerImageEditorButton() {
    const L = this.editor, b = L.t, a = L.commands.get("imageEditor"), u = () => {
      const c = new Cs();
      return c.set({
        label: b("Edit Image"),
        withText: !0
      }), c.bind("isEnabled").to(a), this.listenTo(c, "execute", (o) => {
        L.execute("imageEditor"), L.editing.view.focus();
      }), c;
    };
    L.ui.componentFactory.add("imageEditor", u);
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class Su extends Bn {
  static get requires() {
    return [nc, su];
  }
  static get pluginName() {
    return "ImageEditor";
  }
}
class lu extends Ts {
  execute(L) {
    const b = this.editor, a = b.model.document.selection;
    b.model.change((u) => {
      const c = u.createElement("craftEntryModel", {
        ...Object.fromEntries(a.getAttributes()),
        cardHtml: L.cardHtml,
        entryId: L.entryId,
        siteId: L.siteId
      });
      b.model.insertObject(c, null, null, {
        setSelection: "after"
      });
    });
  }
  refresh() {
    const b = this.editor.model.document.selection, a = !b.isCollapsed && b.getFirstRange();
    this.isEnabled = !a;
  }
}
class cu extends Bn {
  /**
   * @inheritDoc
   */
  static get requires() {
    return [Wc];
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
    const L = this.editor;
    L.commands.add("insertEntry", new lu(L)), L.editing.mapper.on(
      "viewToModelPosition",
      Hc(L.model, (b) => {
        b.hasClass("cke-entry-card");
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
    const L = this.editor.conversion;
    L.for("upcast").elementToElement({
      view: {
        name: "craft-entry"
        // has to be lower case
      },
      model: (a, { writer: u }) => {
        const c = a.getAttribute("data-card-html"), o = a.getAttribute("data-entry-id"), x = a.getAttribute("data-site-id") ?? null;
        return u.createElement("craftEntryModel", {
          cardHtml: c,
          entryId: o,
          siteId: x
        });
      }
    }), L.for("editingDowncast").elementToElement({
      model: "craftEntryModel",
      view: (a, { writer: u }) => {
        const c = a.getAttribute("entryId") ?? null, o = a.getAttribute("siteId") ?? null, x = u.createContainerElement("div", {
          class: "cke-entry-card",
          "data-entry-id": c,
          "data-site-id": o
        });
        return b(a, u, x), $c(x, u);
      }
    }), L.for("dataDowncast").elementToElement({
      model: "craftEntryModel",
      view: (a, { writer: u }) => {
        const c = a.getAttribute("entryId") ?? null, o = a.getAttribute("siteId") ?? null;
        return u.createContainerElement("craft-entry", {
          "data-entry-id": c,
          "data-site-id": o
        });
      }
    });
    const b = (a, u, c) => {
      this._getCardHtml(a).then((o) => {
        const x = u.createRawElement(
          "div",
          null,
          function(g) {
            g.innerHTML = o.cardHtml, Craft.appendHeadHtml(o.headHtml), Craft.appendBodyHtml(o.bodyHtml);
          }
        );
        u.insert(u.createPositionAt(c, 0), x);
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
  async _getCardHtml(L) {
    var x, m, g;
    let b = L.getAttribute("cardHtml") ?? null, a = $(this.editor.sourceElement).parents(".field");
    const u = $(a[0]).data("layout-element");
    if (b)
      return { cardHtml: b };
    const c = L.getAttribute("entryId") ?? null, o = L.getAttribute("siteId") ?? null;
    try {
      const v = this.editor, C = $(v.ui.view.element).closest(
        "form,.lp-editor-container"
      ).data("elementEditor");
      C && await C.checkForm();
      const { data: T } = await Craft.sendActionRequest(
        "POST",
        "ckeditor/ckeditor/entry-card-html",
        {
          data: {
            entryId: c,
            siteId: o,
            layoutElementUid: u
          }
        }
      );
      return T;
    } catch (v) {
      return console.error((x = v == null ? void 0 : v.response) == null ? void 0 : x.data), { cardHtml: '<div class="element card"><div class="card-content"><div class="card-heading"><div class="label error"><span>' + (((g = (m = v == null ? void 0 : v.response) == null ? void 0 : m.data) == null ? void 0 : g.message) || "An unknown error occurred.") + "</span></div></div></div></div>" };
    }
  }
}
class uu extends Yc {
  constructor(L) {
    super(L), this.domEventType = "dblclick";
  }
  onDomEvent(L) {
    this.fire(L.type, L);
  }
}
class fu extends Bn {
  /**
   * @inheritDoc
   */
  static get requires() {
    return [Ql];
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
    this.editor.ui.componentFactory.add("createEntry", (L) => this._createToolbarEntriesButton(L)), this.editor.ui.componentFactory.add("editEntryBtn", (L) => this._createEditEntryBtn(L)), this._listenToEvents();
  }
  /**
   * @inheritDoc
   */
  afterInit() {
    this.editor.plugins.get(
      Ql
    ).register("entriesBalloon", {
      ariaLabel: Craft.t("ckeditor", "Entry toolbar"),
      // Toolbar Buttons
      items: ["editEntryBtn"],
      // If a related element is returned the toolbar is attached
      getRelatedElement: (b) => {
        const a = b.getSelectedElement();
        return a && qc(a) && a.hasClass("cke-entry-card") ? a : null;
      }
    });
  }
  /**
   * Hook up event listeners
   *
   * @private
   */
  _listenToEvents() {
    const L = this.editor.editing.view, b = L.document;
    L.addObserver(uu), this.editor.listenTo(b, "dblclick", (a, u) => {
      const c = this.editor.editing.mapper.toModelElement(
        u.target.parent
      );
      c.name === "craftEntryModel" && this._initEditEntrySlideout(u, c);
    });
  }
  _initEditEntrySlideout(L = null, b = null) {
    b === null && (b = this.editor.model.document.selection.getSelectedElement());
    const a = b.getAttribute("entryId"), u = b.getAttribute("siteId") ?? null;
    this._showEditEntrySlideout(a, u, b);
  }
  /**
   * Creates a toolbar button that allows for an entry to be inserted into the editor
   *
   * @param locale
   * @private
   */
  _createToolbarEntriesButton(L) {
    const b = this.editor, a = b.config.get("entryTypeOptions"), u = b.commands.get("insertEntry");
    if (!a || !a.length)
      return;
    const c = xa(L);
    return c.buttonView.set({
      label: b.config.get("createButtonLabel") || Craft.t("app", "New {type}", {
        type: Craft.t("app", "entry")
      }),
      tooltip: !0,
      withText: !0
      //commandValue: null,
    }), c.bind("isEnabled").to(u), Sa(
      c,
      () => this._getDropdownItemsDefinitions(a, u),
      {
        ariaLabel: Craft.t("ckeditor", "Entry types list")
      }
    ), this.listenTo(c, "execute", (o) => {
      this._showCreateEntrySlideout(o.source.commandValue);
    }), c;
  }
  /**
   * Creates a list of entry type options that go into the insert entry button
   *
   * @param options
   * @param command
   * @returns {Collection<Record<string, any>>}
   * @private
   */
  _getDropdownItemsDefinitions(L, b) {
    const a = new _a();
    return L.map((u) => {
      const c = {
        type: "button",
        model: new $o({
          commandValue: u.value,
          //entry type id
          label: u.label || u.value,
          icon: u.icon,
          withText: !0
        })
      };
      a.add(c);
    }), a;
  }
  /**
   * Creates an edit entry button that shows in the contextual balloon for each craft entry widget
   * @param locale
   * @returns {ButtonView}
   * @private
   */
  _createEditEntryBtn(L) {
    const b = new Cs(L);
    return b.set({
      isEnabled: !0,
      label: Craft.t("app", "Edit {type}", {
        type: Craft.elementTypeNames["craft\\elements\\Entry"][2]
      }),
      tooltip: !0,
      withText: !0
    }), this.listenTo(b, "execute", (a) => {
      this._initEditEntrySlideout();
    }), b;
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
  _getCardElement(L) {
    return $(this.editor.ui.element).find('.element.card[data-id="' + L + '"]');
  }
  /**
   * Opens an element editor for existing entry
   *
   * @param entryId
   * @private
   */
  _showEditEntrySlideout(L, b, a) {
    const u = this.editor, c = this.getElementEditor();
    let o = this._getCardElement(L);
    const x = o.data("owner-id"), m = Craft.createElementEditor(this.elementType, null, {
      elementId: L,
      params: {
        siteId: b
      },
      onBeforeSubmit: async () => {
        if (o !== null && Garnish.hasAttr(o, "data-owner-is-canonical") && !c.settings.isUnpublishedDraft) {
          await m.elementEditor.checkForm(!0, !0);
          let g = $(u.sourceElement).attr("name");
          c && g && await c.setFormValue(g, "*"), c.settings.draftId && m.elementEditor.settings.draftId && (m.elementEditor.settings.saveParams || (m.elementEditor.settings.saveParams = {}), m.elementEditor.settings.saveParams.action = "elements/save-nested-element-for-derivative", m.elementEditor.settings.saveParams.newOwnerId = c.getDraftElementId(x));
        }
      },
      onSubmit: (g) => {
        let v = this._getCardElement(L);
        v !== null && g.data.id != v.data("id") && (v.attr("data-id", g.data.id).data("id", g.data.id).data("owner-id", g.data.ownerId), u.editing.model.change((y) => {
          y.setAttribute("entryId", g.data.id, a), u.ui.update();
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
  async _showCreateEntrySlideout(L) {
    var m, g;
    const b = this.editor, a = b.config.get(
      "nestedElementAttributes"
    ), u = Object.assign({}, a, {
      typeId: L
    }), c = this.getElementEditor();
    c && (await c.markDeltaNameAsModified(b.sourceElement.name), u.ownerId = c.getDraftElementId(
      a.ownerId
    ));
    let o;
    try {
      o = (await Craft.sendActionRequest(
        "POST",
        "elements/create",
        {
          data: u
        }
      )).data;
    } catch (v) {
      throw Craft.cp.displayError((g = (m = v == null ? void 0 : v.response) == null ? void 0 : m.data) == null ? void 0 : g.error), v;
    }
    Craft.createElementEditor(this.elementType, {
      elementId: o.element.id,
      draftId: o.element.draftId,
      params: {
        fresh: 1,
        siteId: o.element.siteId
      }
    }).on("submit", (v) => {
      b.commands.execute("insertEntry", {
        entryId: v.data.id,
        siteId: v.data.siteId
      });
    });
  }
}
class du extends Bn {
  static get requires() {
    return [cu, fu];
  }
  static get pluginName() {
    return "CraftEntries";
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class pu extends Bn {
  static get pluginName() {
    return "CraftLinkEditing";
  }
  constructor() {
    super(...arguments), this.conversionData = [], this.editor.config.define("advancedLinkFields", []);
  }
  init() {
    const b = this.editor.config.get("advancedLinkFields");
    this.conversionData = b.map((a) => a.conversion ?? null).filter((a) => a), this._defineSchema(), this._defineConverters(), this._adjustLinkCommand(), this._adjustUnlinkCommand();
  }
  _defineSchema() {
    const L = this.editor.model.schema;
    let b = this.conversionData.map((a) => a.model);
    L.extend("$text", {
      allowAttributes: b
    });
  }
  _defineConverters() {
    const L = this.editor.conversion;
    for (let b = 0; b < this.conversionData.length; b++)
      L.for("downcast").attributeToElement({
        model: this.conversionData[b].model,
        view: (a, { writer: u }) => {
          const c = u.createAttributeElement(
            "a",
            { [this.conversionData[b].view]: a },
            { priority: 5 }
          );
          return u.setCustomProperty("link", !0, c), c;
        }
      }), L.for("upcast").elementToAttribute({
        view: {
          name: "a",
          attributes: {
            [this.conversionData[b].view]: !0
          }
        },
        model: {
          key: this.conversionData[b].model,
          value: (a, u) => a.getAttribute(this.conversionData[b].view)
        }
      });
  }
  _adjustLinkCommand() {
    const L = this.editor, b = L.commands.get("link");
    let a = !1;
    b.on(
      "execute",
      (u, c) => {
        if (a) {
          a = !1;
          return;
        }
        u.stop(), a = !0;
        const o = c[c.length - 1], x = L.model.document.selection;
        L.model.change((m) => {
          L.execute("link", ...c);
          const g = x.getFirstPosition();
          this.conversionData.forEach((v) => {
            if (x.isCollapsed) {
              const y = g.textNode || g.nodeBefore;
              o[v.model] ? m.setAttribute(
                v.model,
                o[v.model],
                m.createRangeOn(y)
              ) : m.removeAttribute(v.model, m.createRangeOn(y)), m.removeSelectionAttribute(v.model);
            } else {
              const y = L.model.schema.getValidRanges(
                x.getRanges(),
                v.model
              );
              for (const C of y)
                o[v.model] ? m.setAttribute(
                  v.model,
                  o[v.model],
                  C
                ) : m.removeAttribute(v.model, C);
            }
          });
        });
      },
      { priority: "high" }
    );
  }
  _adjustUnlinkCommand() {
    const L = this.editor, b = L.commands.get("unlink"), { model: a } = L, { selection: u } = a.document;
    let c = !1;
    b.on(
      "execute",
      (o) => {
        c || (o.stop(), a.change(() => {
          c = !0, L.execute("unlink"), c = !1, a.change((x) => {
            let m;
            this.conversionData.forEach((g) => {
              u.isCollapsed ? m = [
                Kc(
                  u.getFirstPosition(),
                  g.model,
                  u.getAttribute(g.model),
                  a
                )
              ] : m = a.schema.getValidRanges(
                u.getRanges(),
                g.model
              );
              for (const v of m)
                x.removeAttribute(g.model, v);
            });
          });
        }));
      },
      { priority: "high" }
    );
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class hu extends Bn {
  static get requires() {
    return [Gl];
  }
  static get pluginName() {
    return "CraftLinkUI";
  }
  constructor() {
    super(...arguments), this.siteDropdownView = null, this.siteDropdownItemModels = null, this.localizedRefHandleRE = null, this.linkTypeDropdownView = null, this.linkTypeDropdownItemModels = [], this.elementTypeRefHandleRE = null, this.urlWithRefHandleRE = null, this.conversionData = [], this.editor.config.define("linkOptions", []), this.editor.config.define("advancedLinkFields", []);
  }
  init() {
    const L = this.editor;
    this._linkUI = L.plugins.get(Gl), this._balloon = L.plugins.get(Qc);
    const b = L.config.get("linkOptions"), a = L.config.get("advancedLinkFields");
    this.conversionData = a.map((c) => c.conversion ?? null).filter((c) => c);
    const u = CKE_LOCALIZED_REF_HANDLES.join("|");
    Craft.isMultiSite && (this.localizedRefHandleRE = new RegExp(
      `(#(?:${u}):\\d+)(?:@(\\d+))?`
    )), this.elementTypeRefHandleRE = new RegExp(
      `(#((?:${u})):\\d+)`
    ), this.urlWithRefHandleRE = new RegExp(
      `(.+)(#(?:${u}):\\d+)(?:@(\\d+))?`
    ), this._modifyFormViewTemplate(b, a);
  }
  _modifyFormViewTemplate(L, b) {
    this._linkUI.formView || this._linkUI._createViews();
    const { formView: a } = this._linkUI, { urlInputView: u } = a, { fieldView: c } = u;
    a.template.attributes.class.push(
      "ck-link-form_layout-vertical",
      "ck-vertical-form"
    ), L && L.length && this._linkOptionsDropdown(L, a, c), Craft.isMultiSite && this._sitesDropdown(a, c), b && b.length && this._advancedLinkFields(b, a);
  }
  _urlInputValue() {
    return this._linkUI.formView.urlInputView.fieldView.element.value;
  }
  _urlInputRefMatch(L) {
    return this._urlInputValue().match(L);
  }
  ////////////////////// Sites Dropdown //////////////////////
  _sitesDropdown(L, b) {
    this.siteDropdownView = xa(L.locale), this.siteDropdownView.buttonView.set({
      label: "",
      withText: !0,
      isVisible: !1
    }), this.siteDropdownItemModels = Object.fromEntries(
      Craft.sites.map((u) => [
        u.id,
        new $o({
          label: u.name,
          siteId: u.id,
          withText: !0
        })
      ])
    ), this.siteDropdownItemModels.current = new $o({
      label: Craft.t("ckeditor", "Link to the current site"),
      siteId: null,
      withText: !0
    }), Sa(
      this.siteDropdownView,
      new _a([
        ...Craft.sites.map((u) => ({
          type: "button",
          model: this.siteDropdownItemModels[u.id]
        })),
        {
          type: "button",
          model: this.siteDropdownItemModels.current
        }
      ])
    ), this.siteDropdownView.on("execute", (u) => {
      const c = this._urlInputRefMatch(this.localizedRefHandleRE);
      if (!c) {
        console.warn(
          `No reference tag hash present in URL: ${this._urlInputValue()}`
        );
        return;
      }
      const { siteId: o } = u.source;
      let x = c[1];
      o && (x += `@${o}`);
      const m = this._urlInputValue().replace(c[0], x);
      b.set("value", m);
    });
    const { children: a } = L;
    a.add(this.siteDropdownView, a.length - 2), L._focusables.add(this.siteDropdownView), L.focusTracker.add(this.siteDropdownView.element), this.listenTo(b, "change:value", () => {
      this._toggleSiteDropdownView();
    }), this.listenTo(b, "input", () => {
      this._toggleSiteDropdownView();
    });
  }
  _toggleSiteDropdownView() {
    const L = this._urlInputRefMatch(this.localizedRefHandleRE);
    if (L) {
      this.siteDropdownView.buttonView.set("isVisible", !0);
      let b = L[2] ? parseInt(L[2], 10) : null;
      b && typeof this.siteDropdownItemModels[b] > "u" && (b = null), this._selectSiteDropdownItem(b);
    }
  }
  _selectSiteDropdownItem(L) {
    const b = this.siteDropdownItemModels[L ?? "current"], a = L ? Craft.t("ckeditor", "Site: {name}", { name: b.label }) : b.label;
    this.siteDropdownView.buttonView.set("label", a), Object.values(this.siteDropdownItemModels).forEach((u) => {
      u.set("isOn", u === b);
    });
  }
  ////////////////////// Link Options Dropdown (link types) //////////////////////
  _linkOptionsDropdown(L, b, a) {
    this.linkTypeDropdownView = xa(b.locale), this.linkTypeDropdownView.buttonView.set({
      label: "",
      withText: !0,
      isVisible: !0
    }), this.linkTypeDropdownItemModels = Object.fromEntries(
      this._getLinkListItemDefinitions(L).map((c) => [
        c.handle,
        c
      ])
    ), Sa(
      this.linkTypeDropdownView,
      new _a([
        ...this._getLinkListItemDefinitions(L).map((c) => ({
          type: "button",
          model: this.linkTypeDropdownItemModels[c.handle]
        }))
      ])
    ), this.linkTypeDropdownView.on("execute", (c) => {
      var o;
      if (c.source.linkOption) {
        this._linkUI._hideUI();
        const x = c.source.linkOption;
        this._showElementSelectorModal(x);
      } else
        this._selectLinkTypeDropdownItem("default"), a.set("value", ""), (o = this.siteDropdownView) == null || o.buttonView.set("isVisible", !1);
    });
    const { children: u } = b;
    u.add(this.linkTypeDropdownView, u.length - 2), b._focusables.add(this.linkTypeDropdownView), b.focusTracker.add(this.linkTypeDropdownView.element), this.listenTo(a, "change:value", () => {
      this._toggleLinkTypeDropdownView();
    }), this.listenTo(a, "input", () => {
      this._toggleLinkTypeDropdownView();
    });
  }
  _toggleLinkTypeDropdownView() {
    const L = this._urlInputValue().match(this.elementTypeRefHandleRE);
    if (L) {
      this.linkTypeDropdownView.buttonView.set("isVisible", !0);
      let b = L[2];
      b && typeof this.linkTypeDropdownItemModels[b] > "u" && (b = null), this._selectLinkTypeDropdownItem(b);
    } else
      this._selectLinkTypeDropdownItem("default");
  }
  _selectLinkTypeDropdownItem(L) {
    const b = this.linkTypeDropdownItemModels[L], a = L ? Craft.t("app", "{name}", { name: b.label }) : b.label;
    this.linkTypeDropdownView.buttonView.set("label", a), Object.values(this.linkTypeDropdownItemModels).forEach((u) => {
      u.set("isOn", u.handle === b.handle);
    });
  }
  _getLinkListItemDefinitions(L) {
    const b = [];
    for (const a of L)
      b.push(
        new $o({
          label: a.label,
          handle: a.refHandle,
          linkOption: a,
          withText: !0
        })
      );
    return b.push(
      new $o({
        label: Craft.t("app", "URL"),
        handle: "default",
        withText: !0
      })
    ), b;
  }
  _showElementSelectorModal(L) {
    const b = this.editor, a = b.model, u = a.document.selection, c = u.isCollapsed, o = u.getFirstRange(), x = () => {
      b.editing.view.focus(), !c && o && a.change((m) => {
        m.setSelection(o);
      }), this._linkUI._hideFakeVisualSelection();
    };
    this._linkUI._getSelectedLinkElement() || this._linkUI._showFakeVisualSelection(), Craft.createElementSelectorModal(L.elementType, {
      storageKey: `ckeditor:${this.pluginName}:${L.elementType}`,
      sources: L.sources,
      criteria: L.criteria,
      defaultSiteId: b.config.get("elementSiteId"),
      autoFocusSearchBox: !1,
      onSelect: (m) => {
        if (m.length) {
          const g = m[0], v = `${g.url}#${L.refHandle}:${g.id}@${g.siteId}`;
          b.editing.view.focus(), !c && o ? (a.change((C) => {
            C.setSelection(o);
          }), b.commands.get("link").execute(v)) : a.change((y) => {
            if (y.insertText(
              g.label,
              {
                linkHref: v
              },
              u.getFirstPosition()
            ), o instanceof Gc)
              try {
                const C = o.clone();
                C.end.path[1] += g.label.length, y.setSelection(C);
              } catch {
              }
          }), this._linkUI._hideFakeVisualSelection(), setTimeout(() => {
            b.editing.view.focus(), this._linkUI._showUI(!0);
          }, 100);
        } else
          x();
      },
      onCancel: () => {
        x();
      },
      closeOtherModals: !1
    });
  }
  ////////////////////// Advanced Link Fields //////////////////////
  _advancedLinkFields(L, b) {
    this._addAdvancedLinkFieldInputs(L, b), this._handleAdvancedLinkFieldsFormSubmit(b), this._trackAdvancedLinkFieldsValueChange();
  }
  _addAdvancedLinkFieldInputs(L, b) {
    var u;
    const a = this.editor.commands.get("link");
    for (const c of L) {
      let o = (u = c.conversion) == null ? void 0 : u.model;
      if (o && typeof b[o] > "u") {
        let x = this._createLabeledField(
          b,
          c.label,
          c.info
        );
        b[o] = x, b[o].fieldView.bind("value").to(a, o), b[o].fieldView.element.value = a[o] || "";
      } else if (c.value === "urlSuffix") {
        let x = this._createLabeledField(
          b,
          c.label,
          c.info
        );
        this.listenTo(
          x.fieldView,
          "change:isFocused",
          (m, g, v, y) => {
            if (v !== y && !v) {
              let C = m.source.element.value;
              const T = this._urlInputRefMatch(this.urlWithRefHandleRE);
              if (T) {
                let P = new URL(T[1]), X = P.search, K = P.hash, j = T[1].replace(K, "").replace(X, "");
                const B = this._urlInputValue().replace(
                  T[1],
                  j + C
                );
                b.urlInputView.fieldView.set("value", B);
              }
            }
          }
        ), this.listenTo(b.urlInputView.fieldView, "change:value", () => {
          this._toggleUrlSuffixInputView(x);
        }), this.listenTo(b.urlInputView.fieldView, "input", () => {
          this._toggleUrlSuffixInputView(x);
        });
      } else if (c.value === "target") {
        let x = b._manualDecoratorSwitches._items.filter(
          (m) => m.name === "linkOpenInNewTab"
        );
        if (x.length) {
          const { children: m } = b;
          x = x[0];
          const g = new Xc();
          g.setTemplate({
            tag: "ul",
            children: [
              {
                tag: "li",
                children: [x],
                attributes: {
                  class: ["ck", "ck-list__item"]
                }
              }
            ],
            attributes: {
              class: ["ck", "ck-reset", "ck-list"]
            }
          }), m.add(g, m.length - 2);
        }
      }
    }
  }
  _createLabeledField(L, b, a) {
    let u = new Zc(
      L.locale,
      Jc
    );
    u.label = b, a && (u.infoText = a);
    const { children: c } = L;
    return c.add(u, c.length - 2), L._focusables.add(u.fieldView), L.focusTracker.add(u.fieldView.element), u;
  }
  _toggleUrlSuffixInputView(L) {
    const b = this._urlInputRefMatch(this.urlWithRefHandleRE);
    if (b) {
      let a = new URL(b[1]), u = a.search, c = a.hash;
      L.fieldView.set("value", u + c);
    }
  }
  _handleAdvancedLinkFieldsFormSubmit(L) {
    const a = this.editor.commands.get("link"), u = this.conversionData.map((c) => c.model);
    L.on(
      "submit",
      () => {
        let c = {};
        u.forEach((o) => {
          let x = [];
          x[o] = L[o].fieldView.element.value, Object.assign(c, x);
        }), a.once(
          "execute",
          (o, x) => {
            x.length < 3 ? x.push(c) : x.length === 3 && Object.assign(x[2], c);
          },
          { priority: "highest" }
        );
      },
      { priority: "high" }
    );
  }
  _trackAdvancedLinkFieldsValueChange() {
    const L = this.editor, b = L.commands.get("link"), a = L.model.document.selection;
    this.conversionData.forEach((u) => {
      b.set(u.model, null), L.model.document.on("change", () => {
        b[u.model] = a.getAttribute(u.model);
      });
    });
  }
}
class Cu extends Bn {
  static get requires() {
    return [pu, hu];
  }
  static get pluginName() {
    return "CraftLink";
  }
}
function mu(Te) {
  return Te && Te.__esModule && Object.prototype.hasOwnProperty.call(Te, "default") ? Te.default : Te;
}
var Ss = { exports: {} };
/*! For license information please see inspector.js.LICENSE.txt */
var Xl;
function gu() {
  return Xl || (Xl = 1, function(Te, L) {
    (function(b, a) {
      Te.exports = a();
    })(window, function() {
      return function(b) {
        var a = {};
        function u(c) {
          if (a[c]) return a[c].exports;
          var o = a[c] = { i: c, l: !1, exports: {} };
          return b[c].call(o.exports, o, o.exports, u), o.l = !0, o.exports;
        }
        return u.m = b, u.c = a, u.d = function(c, o, x) {
          u.o(c, o) || Object.defineProperty(c, o, { enumerable: !0, get: x });
        }, u.r = function(c) {
          typeof Symbol < "u" && Symbol.toStringTag && Object.defineProperty(c, Symbol.toStringTag, { value: "Module" }), Object.defineProperty(c, "__esModule", { value: !0 });
        }, u.t = function(c, o) {
          if (1 & o && (c = u(c)), 8 & o || 4 & o && typeof c == "object" && c && c.__esModule) return c;
          var x = /* @__PURE__ */ Object.create(null);
          if (u.r(x), Object.defineProperty(x, "default", { enumerable: !0, value: c }), 2 & o && typeof c != "string") for (var m in c) u.d(x, m, (function(g) {
            return c[g];
          }).bind(null, m));
          return x;
        }, u.n = function(c) {
          var o = c && c.__esModule ? function() {
            return c.default;
          } : function() {
            return c;
          };
          return u.d(o, "a", o), o;
        }, u.o = function(c, o) {
          return Object.prototype.hasOwnProperty.call(c, o);
        }, u.p = "", u(u.s = 94);
      }([function(b, a, u) {
        b.exports = u(21);
      }, function(b, a, u) {
        u.d(a, "a", function() {
          return o;
        }), u.d(a, "b", function() {
          return x;
        }), u.d(a, "c", function() {
          return m;
        });
        var c = u(19);
        function o(v, y = !0) {
          if (v === void 0) return "undefined";
          if (typeof v == "function") return "function() {…}";
          const C = Object(c.stringify)(v, g, null, { maxDepth: 2 });
          return y ? C : C.replace(/(^"|"$)/g, "");
        }
        function x(v) {
          const y = {};
          for (const C in v) y[C] = v[C], y[C].value = o(y[C].value);
          return y;
        }
        function m(v, y) {
          return v.length > y ? v.substr(0, y) + `… [${v.length - y} characters left]` : v;
        }
        function g(v, y, C) {
          return typeof v == "string" ? `"${v.replace("'", '"')}"` : C(v);
        }
      }, function(b, a, u) {
        function c(P) {
          return P && P.name;
        }
        function o(P) {
          return P && c(P) && P.is("attributeElement");
        }
        function x(P) {
          return P && c(P) && P.is("emptyElement");
        }
        function m(P) {
          return P && c(P) && P.is("uiElement");
        }
        function g(P) {
          return P && c(P) && P.is("rawElement");
        }
        function v(P) {
          return P && c(P) && P.is("editableElement");
        }
        function y(P) {
          return P && P.is("rootElement");
        }
        function C(P) {
          return { path: [...P.parent.getPath(), P.offset], offset: P.offset, isAtEnd: P.isAtEnd, isAtStart: P.isAtStart, parent: T(P.parent) };
        }
        function T(P) {
          return c(P) ? o(P) ? "attribute:" + P.name : y(P) ? "root:" + P.name : "container:" + P.name : P.data;
        }
        u.d(a, "d", function() {
          return c;
        }), u.d(a, "b", function() {
          return o;
        }), u.d(a, "e", function() {
          return x;
        }), u.d(a, "h", function() {
          return m;
        }), u.d(a, "f", function() {
          return g;
        }), u.d(a, "c", function() {
          return v;
        }), u.d(a, "g", function() {
          return y;
        }), u.d(a, "a", function() {
          return C;
        });
      }, function(b, a, u) {
        u.d(a, "a", function() {
          return c;
        });
        class c {
          static group(...x) {
            console.group(...x);
          }
          static groupEnd(...x) {
            console.groupEnd(...x);
          }
          static log(...x) {
            console.log(...x);
          }
          static warn(...x) {
            console.warn(...x);
          }
        }
      }, function(b, a, u) {
        function c(g) {
          return g && g.is("element");
        }
        function o(g) {
          return g && g.is("rootElement");
        }
        function x(g) {
          return g.getPath ? g.getPath() : g.path;
        }
        function m(g) {
          return { path: x(g), stickiness: g.stickiness, index: g.index, isAtEnd: g.isAtEnd, isAtStart: g.isAtStart, offset: g.offset, textNode: g.textNode && g.textNode.data };
        }
        u.d(a, "c", function() {
          return c;
        }), u.d(a, "d", function() {
          return o;
        }), u.d(a, "b", function() {
          return x;
        }), u.d(a, "a", function() {
          return m;
        });
      }, function(b, a, u) {
        (function(c, o) {
          var x = "[object Arguments]", m = "[object Map]", g = "[object Object]", v = "[object Set]", y = /^\[object .+?Constructor\]$/, C = /^(?:0|[1-9]\d*)$/, T = {};
          T["[object Float32Array]"] = T["[object Float64Array]"] = T["[object Int8Array]"] = T["[object Int16Array]"] = T["[object Int32Array]"] = T["[object Uint8Array]"] = T["[object Uint8ClampedArray]"] = T["[object Uint16Array]"] = T["[object Uint32Array]"] = !0, T[x] = T["[object Array]"] = T["[object ArrayBuffer]"] = T["[object Boolean]"] = T["[object DataView]"] = T["[object Date]"] = T["[object Error]"] = T["[object Function]"] = T[m] = T["[object Number]"] = T[g] = T["[object RegExp]"] = T[v] = T["[object String]"] = T["[object WeakMap]"] = !1;
          var P = typeof c == "object" && c && c.Object === Object && c, X = typeof self == "object" && self && self.Object === Object && self, K = P || X || Function("return this")(), j = a && !a.nodeType && a, B = j && typeof o == "object" && o && !o.nodeType && o, N = B && B.exports === j, M = N && P.process, V = function() {
            try {
              return M && M.binding && M.binding("util");
            } catch {
            }
          }(), R = V && V.isTypedArray;
          function oe(H, ae) {
            for (var we = -1, Se = H == null ? 0 : H.length; ++we < Se; ) if (ae(H[we], we, H)) return !0;
            return !1;
          }
          function Q(H) {
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
          var A, se, le, te = Array.prototype, ce = Function.prototype, ye = Object.prototype, J = K["__core-js_shared__"], fe = ce.toString, D = ye.hasOwnProperty, ie = (A = /[^.]+$/.exec(J && J.keys && J.keys.IE_PROTO || "")) ? "Symbol(src)_1." + A : "", be = ye.toString, Ce = RegExp("^" + fe.call(D).replace(/[\\^$.*+?()[\]{}|]/g, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"), ke = N ? K.Buffer : void 0, Ne = K.Symbol, xe = K.Uint8Array, ze = ye.propertyIsEnumerable, Je = te.splice, G = Ne ? Ne.toStringTag : void 0, Y = Object.getOwnPropertySymbols, me = ke ? ke.isBuffer : void 0, l = (se = Object.keys, le = Object, function(H) {
            return se(le(H));
          }), d = gn(K, "DataView"), k = gn(K, "Map"), U = gn(K, "Promise"), F = gn(K, "Set"), W = gn(K, "WeakMap"), he = gn(Object, "create"), je = bn(d), Re = bn(k), Xe = bn(U), He = bn(F), At = bn(W), wt = Ne ? Ne.prototype : void 0, Jt = wt ? wt.valueOf : void 0;
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
          function Yn(H, ae) {
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
            return On(H) && Sn(H) == x;
          }
          function _r(H, ae, we, Se, it) {
            return H === ae || (H == null || ae == null || !On(H) && !On(ae) ? H != H && ae != ae : function(qe, st, tt, Ot, nt, bt) {
              var Nt = ar(qe), tn = ar(st), ht = Nt ? "[object Array]" : ut(qe), Vt = tn ? "[object Array]" : ut(st), Nn = (ht = ht == x ? g : ht) == g, ct = (Vt = Vt == x ? g : Vt) == g, yn = ht == Vt;
              if (yn && Cn(qe)) {
                if (!Cn(st)) return !1;
                Nt = !0, Nn = !1;
              }
              if (yn && !Nn) return bt || (bt = new Tt()), Nt || Gr(qe) ? Yt(qe, st, tt, Ot, nt, bt) : function(rt, Ue, qn, Kt, Or, Mt, nn) {
                switch (qn) {
                  case "[object DataView]":
                    if (rt.byteLength != Ue.byteLength || rt.byteOffset != Ue.byteOffset) return !1;
                    rt = rt.buffer, Ue = Ue.buffer;
                  case "[object ArrayBuffer]":
                    return !(rt.byteLength != Ue.byteLength || !Mt(new xe(rt), new xe(Ue)));
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
                    var Wt = Q;
                  case v:
                    var Qt = 1 & Kt;
                    if (Wt || (Wt = I), rt.size != Ue.size && !Qt) return !1;
                    var cr = nn.get(rt);
                    if (cr) return cr == Ue;
                    Kt |= 2, nn.set(rt, Ue);
                    var Dn = Yt(Wt(rt), Wt(Ue), Kt, Or, Mt, nn);
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
              return yn ? (bt || (bt = new Tt()), function(rt, Ue, qn, Kt, Or, Mt) {
                var nn = 1 & qn, Wt = xr(rt), Qt = Wt.length, cr = xr(Ue).length;
                if (Qt != cr && !nn) return !1;
                for (var Dn = Qt; Dn--; ) {
                  var rn = Wt[Dn];
                  if (!(nn ? rn in Ue : D.call(Ue, rn))) return !1;
                }
                var yt = Mt.get(rt);
                if (yt && Mt.get(Ue)) return yt == Ue;
                var Et = !0;
                Mt.set(rt, Ue), Mt.set(Ue, rt);
                for (var ur = nn; ++Dn < Qt; ) {
                  rn = Wt[Dn];
                  var fr = rt[rn], vn = Ue[rn];
                  if (Kt) var Ut = nn ? Kt(vn, fr, rn, Ue, rt, Mt) : Kt(fr, vn, rn, rt, Ue, Mt);
                  if (!(Ut === void 0 ? fr === vn || Or(fr, vn, qn, Kt, Mt) : Ut)) {
                    Et = !1;
                    break;
                  }
                  ur || (ur = rn == "constructor");
                }
                if (Et && !ur) {
                  var Ht = rt.constructor, on = Ue.constructor;
                  Ht == on || !("constructor" in rt) || !("constructor" in Ue) || typeof Ht == "function" && Ht instanceof Ht && typeof on == "function" && on instanceof on || (Et = !1);
                }
                return Mt.delete(rt), Mt.delete(Ue), Et;
              }(qe, st, tt, Ot, nt, bt)) : !1;
            }(H, ae, we, Se, _r, it));
          }
          function ko(H) {
            return !(!lr(H) || function(ae) {
              return !!ie && ie in ae;
            }(H)) && (sr(H) ? Ce : y).test(bn(H));
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
              var ht = H[bt], Vt = ae[bt];
              if (Se) var Nn = st ? Se(Vt, ht, bt, ae, H, qe) : Se(ht, Vt, bt, H, ae, qe);
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
              } else if (ht !== Vt && !it(ht, Vt, we, Se, qe)) {
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
            var ae = this.__data__, we = Yn(ae, H);
            return !(we < 0) && (we == ae.length - 1 ? ae.pop() : Je.call(ae, we, 1), --this.size, !0);
          }, gt.prototype.get = function(H) {
            var ae = this.__data__, we = Yn(ae, H);
            return we < 0 ? void 0 : ae[we][1];
          }, gt.prototype.has = function(H) {
            return Yn(this.__data__, H) > -1;
          }, gt.prototype.set = function(H, ae) {
            var we = this.__data__, Se = Yn(we, H);
            return Se < 0 ? (++this.size, we.push([H, ae])) : we[Se][1] = ae, this;
          }, cn.prototype.clear = function() {
            this.size = 0, this.__data__ = { hash: new kt(), map: new (k || gt)(), string: new kt() };
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
              if (!k || Se.length < 199) return Se.push([H, ae]), this.size = ++we.size, this;
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
            return !!(ae = ae ?? 9007199254740991) && (typeof H == "number" || C.test(H)) && H > -1 && H % 1 == 0 && H < ae;
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
          (d && ut(new d(new ArrayBuffer(1))) != "[object DataView]" || k && ut(new k()) != m || U && ut(U.resolve()) != "[object Promise]" || F && ut(new F()) != v || W && ut(new W()) != "[object WeakMap]") && (ut = function(H) {
            var ae = Sn(H), we = ae == g ? H.constructor : void 0, Se = we ? bn(we) : "";
            if (Se) switch (Se) {
              case je:
                return "[object DataView]";
              case Re:
                return m;
              case Xe:
                return "[object Promise]";
              case He:
                return v;
              case At:
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
        }).call(this, u(15), u(33)(b));
      }, function(b, a, u) {
        var c, o = function() {
          return c === void 0 && (c = !!(window && document && document.all && !window.atob)), c;
        }, x = /* @__PURE__ */ function() {
          var N = {};
          return function(M) {
            if (N[M] === void 0) {
              var V = document.querySelector(M);
              if (window.HTMLIFrameElement && V instanceof window.HTMLIFrameElement) try {
                V = V.contentDocument.head;
              } catch {
                V = null;
              }
              N[M] = V;
            }
            return N[M];
          };
        }(), m = [];
        function g(N) {
          for (var M = -1, V = 0; V < m.length; V++) if (m[V].identifier === N) {
            M = V;
            break;
          }
          return M;
        }
        function v(N, M) {
          for (var V = {}, R = [], oe = 0; oe < N.length; oe++) {
            var Q = N[oe], I = M.base ? Q[0] + M.base : Q[0], A = V[I] || 0, se = "".concat(I, " ").concat(A);
            V[I] = A + 1;
            var le = g(se), te = { css: Q[1], media: Q[2], sourceMap: Q[3] };
            le !== -1 ? (m[le].references++, m[le].updater(te)) : m.push({ identifier: se, updater: B(te, M), references: 1 }), R.push(se);
          }
          return R;
        }
        function y(N) {
          var M = document.createElement("style"), V = N.attributes || {};
          if (V.nonce === void 0) {
            var R = u.nc;
            R && (V.nonce = R);
          }
          if (Object.keys(V).forEach(function(Q) {
            M.setAttribute(Q, V[Q]);
          }), typeof N.insert == "function") N.insert(M);
          else {
            var oe = x(N.insert || "head");
            if (!oe) throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");
            oe.appendChild(M);
          }
          return M;
        }
        var C, T = (C = [], function(N, M) {
          return C[N] = M, C.filter(Boolean).join(`
`);
        });
        function P(N, M, V, R) {
          var oe = V ? "" : R.media ? "@media ".concat(R.media, " {").concat(R.css, "}") : R.css;
          if (N.styleSheet) N.styleSheet.cssText = T(M, oe);
          else {
            var Q = document.createTextNode(oe), I = N.childNodes;
            I[M] && N.removeChild(I[M]), I.length ? N.insertBefore(Q, I[M]) : N.appendChild(Q);
          }
        }
        function X(N, M, V) {
          var R = V.css, oe = V.media, Q = V.sourceMap;
          if (oe ? N.setAttribute("media", oe) : N.removeAttribute("media"), Q && typeof btoa < "u" && (R += `
/*# sourceMappingURL=data:application/json;base64,`.concat(btoa(unescape(encodeURIComponent(JSON.stringify(Q)))), " */")), N.styleSheet) N.styleSheet.cssText = R;
          else {
            for (; N.firstChild; ) N.removeChild(N.firstChild);
            N.appendChild(document.createTextNode(R));
          }
        }
        var K = null, j = 0;
        function B(N, M) {
          var V, R, oe;
          if (M.singleton) {
            var Q = j++;
            V = K || (K = y(M)), R = P.bind(null, V, Q, !1), oe = P.bind(null, V, Q, !0);
          } else V = y(M), R = X.bind(null, V, M), oe = function() {
            (function(I) {
              if (I.parentNode === null) return !1;
              I.parentNode.removeChild(I);
            })(V);
          };
          return R(N), function(I) {
            if (I) {
              if (I.css === N.css && I.media === N.media && I.sourceMap === N.sourceMap) return;
              R(N = I);
            } else oe();
          };
        }
        b.exports = function(N, M) {
          (M = M || {}).singleton || typeof M.singleton == "boolean" || (M.singleton = o());
          var V = v(N = N || [], M);
          return function(R) {
            if (R = R || [], Object.prototype.toString.call(R) === "[object Array]") {
              for (var oe = 0; oe < V.length; oe++) {
                var Q = g(V[oe]);
                m[Q].references--;
              }
              for (var I = v(R, M), A = 0; A < V.length; A++) {
                var se = g(V[A]);
                m[se].references === 0 && (m[se].updater(), m.splice(se, 1));
              }
              V = I;
            }
          };
        };
      }, function(b, a, u) {
        b.exports = function(c) {
          var o = [];
          return o.toString = function() {
            return this.map(function(x) {
              var m = function(g, v) {
                var y = g[1] || "", C = g[3];
                if (!C) return y;
                if (v && typeof btoa == "function") {
                  var T = (X = C, "/*# sourceMappingURL=data:application/json;charset=utf-8;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(X)))) + " */"), P = C.sources.map(function(K) {
                    return "/*# sourceURL=" + C.sourceRoot + K + " */";
                  });
                  return [y].concat(P).concat([T]).join(`
`);
                }
                var X;
                return [y].join(`
`);
              }(x, c);
              return x[2] ? "@media " + x[2] + "{" + m + "}" : m;
            }).join("");
          }, o.i = function(x, m) {
            typeof x == "string" && (x = [[null, x, ""]]);
            for (var g = {}, v = 0; v < this.length; v++) {
              var y = this[v][0];
              y != null && (g[y] = !0);
            }
            for (v = 0; v < x.length; v++) {
              var C = x[v];
              C[0] != null && g[C[0]] || (m && !C[2] ? C[2] = m : m && (C[2] = "(" + C[2] + ") and (" + m + ")"), o.push(C));
            }
          }, o;
        };
      }, function(b, a, u) {
        u.d(a, "c", function() {
          return x;
        }), u.d(a, "b", function() {
          return m;
        }), u.d(a, "a", function() {
          return g;
        });
        var c = u(3);
        let o = 0;
        function x(v) {
          const y = { editors: {}, options: {} };
          if (typeof v[0] == "string") c.a.warn(`[CKEditorInspector] The CKEditorInspector.attach( '${v[0]}', editor ) syntax has been deprecated and will be removed in the near future. To pass a name of an editor instance, use CKEditorInspector.attach( { '${v[0]}': editor } ) instead. Learn more in https://github.com/ckeditor/ckeditor5-inspector/blob/master/README.md.`), y.editors[v[0]] = v[1];
          else {
            if ((C = v[0]).model && C.editing) y.editors["editor-" + ++o] = v[0];
            else for (const T in v[0]) y.editors[T] = v[0][T];
            y.options = v[1] || y.options;
          }
          var C;
          return y;
        }
        function m(v) {
          return [...v][0][0] || "";
        }
        function g(v, y) {
          const C = Math.min(v.length, y.length);
          for (let T = 0; T < C; T++) if (v[T] != y[T]) return T;
          return v.length == y.length ? "same" : v.length < y.length ? "prefix" : "extension";
        }
      }, function(b, a, u) {
        u.d(a, "a", function() {
          return m;
        }), u.d(a, "d", function() {
          return y;
        }), u.d(a, "c", function() {
          return C;
        }), u.d(a, "e", function() {
          return T;
        }), u.d(a, "b", function() {
          return P;
        });
        var c = u(2), o = u(8), x = u(1);
        const m = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_view", g = `&lt;!--The View UI element content has been skipped. <a href="${m}_uielement-UIElement.html" target="_blank">Find out why</a>. --&gt;`, v = `&lt;!--The View raw element content has been skipped. <a href="${m}_rawelement-RawElement.html" target="_blank">Find out why</a>. --&gt;`;
        function y(N) {
          return N ? [...N.editing.view.document.roots] : [];
        }
        function C(N, M) {
          if (!N) return [];
          const V = [], R = N.editing.view.document.selection;
          for (const oe of R.getRanges()) oe.root.rootName === M && V.push({ type: "selection", start: Object(c.a)(oe.start), end: Object(c.a)(oe.end) });
          return V;
        }
        function T({ currentEditor: N, currentRootName: M, ranges: V }) {
          return !N || !M ? null : [X(N.editing.view.document.getRoot(M), [...V])];
        }
        function P(N) {
          const M = { editorNode: N, properties: {}, attributes: {}, customProperties: {} };
          if (Object(c.d)(N)) {
            Object(c.g)(N) ? (M.type = "RootEditableElement", M.name = N.rootName, M.url = m + "_rooteditableelement-RootEditableElement.html") : (M.name = N.name, Object(c.b)(N) ? (M.type = "AttributeElement", M.url = m + "_attributeelement-AttributeElement.html") : Object(c.e)(N) ? (M.type = "EmptyElement", M.url = m + "_emptyelement-EmptyElement.html") : Object(c.h)(N) ? (M.type = "UIElement", M.url = m + "_uielement-UIElement.html") : Object(c.f)(N) ? (M.type = "RawElement", M.url = m + "_rawelement-RawElement.html") : Object(c.c)(N) ? (M.type = "EditableElement", M.url = m + "_editableelement-EditableElement.html") : (M.type = "ContainerElement", M.url = m + "_containerelement-ContainerElement.html")), B(N).forEach(([V, R]) => {
              M.attributes[V] = { value: R };
            }), M.properties = { index: { value: N.index }, isEmpty: { value: N.isEmpty }, childCount: { value: N.childCount } };
            for (let [V, R] of N.getCustomProperties()) typeof V == "symbol" && (V = V.toString()), M.customProperties[V] = { value: R };
          } else M.name = N.data, M.type = "Text", M.url = m + "_text-Text.html", M.properties = { index: { value: N.index } };
          return M.properties = Object(x.b)(M.properties), M.customProperties = Object(x.b)(M.customProperties), M.attributes = Object(x.b)(M.attributes), M;
        }
        function X(N, M) {
          const V = {};
          return Object.assign(V, { index: N.index, path: N.getPath(), node: N, positionsBefore: [], positionsAfter: [] }), Object(c.d)(N) ? function(R, oe) {
            const Q = R.node;
            Object.assign(R, { type: "element", children: [], positions: [] }), R.name = Q.name, Object(c.b)(Q) ? R.elementType = "attribute" : Object(c.g)(Q) ? R.elementType = "root" : Object(c.e)(Q) ? R.elementType = "empty" : Object(c.h)(Q) ? R.elementType = "ui" : Object(c.f)(Q) ? R.elementType = "raw" : R.elementType = "container", Object(c.e)(Q) ? R.presentation = { isEmpty: !0 } : Object(c.h)(Q) ? R.children.push({ type: "comment", text: g }) : Object(c.f)(Q) && R.children.push({ type: "comment", text: v });
            for (const I of Q.getChildren()) R.children.push(X(I, oe));
            (function(I, A) {
              for (const se of A) {
                const le = K(I, se);
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
              const A = B(I).map(([se, le]) => [se, Object(x.a)(le, !1)]);
              return new Map(A);
            }(Q);
          }(V, M) : function(R, oe) {
            Object.assign(R, { type: "text", startOffset: 0, text: R.node.data, positions: [] });
            for (const Q of oe) {
              const I = K(R, Q);
              R.positions.push(...I);
            }
          }(V, M), V;
        }
        function K(N, M) {
          const V = N.path, R = M.start.path, oe = M.end.path, Q = [];
          return j(V, R) && Q.push({ offset: R[R.length - 1], isEnd: !1, presentation: M.presentation || null, type: M.type, name: M.name || null }), j(V, oe) && Q.push({ offset: oe[oe.length - 1], isEnd: !0, presentation: M.presentation || null, type: M.type, name: M.name || null }), Q;
        }
        function j(N, M) {
          return N.length === M.length - 1 && Object(o.a)(N, M) === "prefix";
        }
        function B(N) {
          return [...N.getAttributes()].sort(([M], [V]) => M.toUpperCase() < V.toUpperCase() ? -1 : 1);
        }
      }, function(b, a, u) {
        u.d(a, "d", function() {
          return v;
        }), u.d(a, "c", function() {
          return y;
        }), u.d(a, "a", function() {
          return C;
        }), u.d(a, "e", function() {
          return T;
        }), u.d(a, "b", function() {
          return P;
        });
        var c = u(4), o = u(8), x = u(1);
        const m = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_", g = ["#03a9f4", "#fb8c00", "#009688", "#e91e63", "#4caf50", "#00bcd4", "#607d8b", "#cddc39", "#9c27b0", "#f44336", "#6d4c41", "#8bc34a", "#3f51b5", "#2196f3", "#f4511e", "#673ab7", "#ffb300"];
        function v(M) {
          if (!M) return [];
          const V = [...M.model.document.roots];
          return V.filter(({ rootName: R }) => R !== "$graveyard").concat(V.filter(({ rootName: R }) => R === "$graveyard"));
        }
        function y(M, V) {
          if (!M) return [];
          const R = [], oe = M.model;
          for (const Q of oe.document.selection.getRanges()) Q.root.rootName === V && R.push({ type: "selection", start: Object(c.a)(Q.start), end: Object(c.a)(Q.end) });
          return R;
        }
        function C(M, V) {
          if (!M) return [];
          const R = [], oe = M.model;
          let Q = 0;
          for (const I of oe.markers) {
            const { name: A, affectsData: se, managedUsingOperations: le } = I, te = I.getStart(), ce = I.getEnd();
            te.root.rootName === V && R.push({ type: "marker", marker: I, name: A, affectsData: se, managedUsingOperations: le, presentation: { color: g[Q++ % (g.length - 1)] }, start: Object(c.a)(te), end: Object(c.a)(ce) });
          }
          return R;
        }
        function T({ currentEditor: M, currentRootName: V, ranges: R, markers: oe }) {
          return M ? [X(M.model.document.getRoot(V), [...R, ...oe])] : [];
        }
        function P(M, V) {
          const R = { editorNode: V, properties: {}, attributes: {} };
          Object(c.c)(V) ? (Object(c.d)(V) ? (R.type = "RootElement", R.name = V.rootName, R.url = m + "rootelement-RootElement.html") : (R.type = "Element", R.name = V.name, R.url = m + "element-Element.html"), R.properties = { childCount: { value: V.childCount }, startOffset: { value: V.startOffset }, endOffset: { value: V.endOffset }, maxOffset: { value: V.maxOffset } }) : (R.name = V.data, R.type = "Text", R.url = m + "text-Text.html", R.properties = { startOffset: { value: V.startOffset }, endOffset: { value: V.endOffset }, offsetSize: { value: V.offsetSize } }), R.properties.path = { value: Object(c.b)(V) }, j(V).forEach(([oe, Q]) => {
            R.attributes[oe] = { value: Q };
          }), R.properties = Object(x.b)(R.properties), R.attributes = Object(x.b)(R.attributes);
          for (const oe in R.attributes) {
            const Q = {}, I = M.model.schema.getAttributeProperties(oe);
            for (const A in I) Q[A] = { value: I[A] };
            R.attributes[oe].subProperties = Object(x.b)(Q);
          }
          return R;
        }
        function X(M, V) {
          const R = {}, { startOffset: oe, endOffset: Q } = M;
          return Object.assign(R, { startOffset: oe, endOffset: Q, node: M, path: M.getPath(), positionsBefore: [], positionsAfter: [] }), Object(c.c)(M) ? function(I, A) {
            const se = I.node;
            Object.assign(I, { type: "element", name: se.name, children: [], maxOffset: se.maxOffset, positions: [] });
            for (const le of se.getChildren()) I.children.push(X(le, A));
            (function(le, te) {
              for (const ce of te) {
                const ye = B(le, ce);
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
            })(I, A), I.attributes = K(se);
          }(R, V) : function(I) {
            const A = I.node;
            Object.assign(I, { type: "text", text: A.data, positions: [], presentation: { dontRenderAttributeValue: !0 } }), I.attributes = K(A);
          }(R), R;
        }
        function K(M) {
          const V = j(M).map(([R, oe]) => [R, Object(x.a)(oe, !1)]);
          return new Map(V);
        }
        function j(M) {
          return [...M.getAttributes()].sort(([V], [R]) => V < R ? -1 : 1);
        }
        function B(M, V) {
          const R = M.path, oe = V.start.path, Q = V.end.path, I = [];
          return N(R, oe) && I.push({ offset: oe[oe.length - 1], isEnd: !1, presentation: V.presentation || null, type: V.type, name: V.name || null }), N(R, Q) && I.push({ offset: Q[Q.length - 1], isEnd: !0, presentation: V.presentation || null, type: V.type, name: V.name || null }), I;
        }
        function N(M, V) {
          return M.length === V.length - 1 && Object(o.a)(M, V) === "prefix";
        }
      }, function(b, a, u) {
        u.d(a, "a", function() {
          return j;
        });
        var c = u(0), o = u.n(c), x = u(5), m = u.n(x);
        class g extends c.Component {
          constructor(N) {
            super(N), this.handleClick = this.handleClick.bind(this);
          }
          handleClick(N) {
            this.globalTreeProps.onClick(N, this.definition.node);
          }
          getChildren() {
            return this.definition.children.map((N, M) => K(N, M, this.props.globalTreeProps));
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
        var v = u(1);
        class y extends c.PureComponent {
          render() {
            let N;
            const M = Object(v.c)(this.props.value, 500);
            return this.props.dontRenderValue || (N = o.a.createElement("span", { className: "ck-inspector-tree-node__attribute__value" }, M)), o.a.createElement("span", { className: "ck-inspector-tree-node__attribute" }, o.a.createElement("span", { className: "ck-inspector-tree-node__attribute__name", title: M }, this.props.name), N);
          }
        }
        class C extends c.Component {
          render() {
            const N = this.props.definition, M = { className: ["ck-inspector-tree__position", N.type === "selection" ? "ck-inspector-tree__position_selection" : "", N.type === "marker" ? "ck-inspector-tree__position_marker" : "", N.isEnd ? "ck-inspector-tree__position_end" : ""].join(" "), style: {} };
            return N.presentation && N.presentation.color && (M.style["--ck-inspector-color-tree-position"] = N.presentation.color), N.type === "marker" && (M["data-marker-name"] = N.name), o.a.createElement("span", M, "​");
          }
          shouldComponentUpdate(N) {
            return !m()(this.props, N);
          }
        }
        class T extends g {
          render() {
            const N = this.definition, M = N.presentation, V = M && M.isEmpty, R = M && M.cssClass, oe = this.getChildren(), Q = ["ck-inspector-code", "ck-inspector-tree-node", this.isActive ? "ck-inspector-tree-node_active" : "", V ? "ck-inspector-tree-node_empty" : "", R], I = [], A = [];
            N.positionsBefore && N.positionsBefore.forEach((le, te) => {
              I.push(o.a.createElement(C, { key: "position-before:" + te, definition: le }));
            }), N.positionsAfter && N.positionsAfter.forEach((le, te) => {
              A.push(o.a.createElement(C, { key: "position-after:" + te, definition: le }));
            }), N.positions && N.positions.forEach((le, te) => {
              oe.push(o.a.createElement(C, { key: "position" + te, definition: le }));
            });
            let se = N.name;
            return this.globalTreeProps.showElementTypes && (se = N.elementType + ":" + se), o.a.createElement("div", { className: Q.join(" "), onClick: this.handleClick }, I, o.a.createElement("span", { className: "ck-inspector-tree-node__name" }, o.a.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_open" }), se, this.getAttributes(), V ? "" : o.a.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_close" })), o.a.createElement("div", { className: "ck-inspector-tree-node__content" }, oe), V ? "" : o.a.createElement("span", { className: "ck-inspector-tree-node__name ck-inspector-tree-node__name_close" }, o.a.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_open" }), "/", se, o.a.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_close" }), A));
          }
          getAttributes() {
            const N = [], M = this.definition;
            for (const [V, R] of M.attributes) N.push(o.a.createElement(y, { key: V, name: V, value: R }));
            return N;
          }
          shouldComponentUpdate(N) {
            return !m()(this.props, N);
          }
        }
        class P extends g {
          render() {
            const N = this.definition, M = ["ck-inspector-tree-text", this.isActive ? "ck-inspector-tree-node_active" : ""].join(" ");
            let V = this.definition.text;
            N.positions && N.positions.length && (V = V.split(""), Array.from(N.positions).sort((oe, Q) => oe.offset < Q.offset ? -1 : oe.offset === Q.offset ? 0 : 1).reverse().forEach((oe, Q) => {
              V.splice(oe.offset - N.startOffset, 0, o.a.createElement(C, { key: "position" + Q, definition: oe }));
            }));
            const R = [V];
            return N.positionsBefore && N.positionsBefore.length && N.positionsBefore.forEach((oe, Q) => {
              R.unshift(o.a.createElement(C, { key: "position-before:" + Q, definition: oe }));
            }), N.positionsAfter && N.positionsAfter.length && N.positionsAfter.forEach((oe, Q) => {
              R.push(o.a.createElement(C, { key: "position-after:" + Q, definition: oe }));
            }), o.a.createElement("span", { className: M, onClick: this.handleClick }, o.a.createElement("span", { className: "ck-inspector-tree-node__content" }, this.globalTreeProps.showCompactText ? "" : this.getAttributes(), this.globalTreeProps.showCompactText ? "" : '"', R, this.globalTreeProps.showCompactText ? "" : '"'));
          }
          getAttributes() {
            const N = [], M = this.definition, V = M.presentation, R = V && V.dontRenderAttributeValue;
            for (const [oe, Q] of M.attributes) N.push(o.a.createElement(y, { key: oe, name: oe, value: Q, dontRenderValue: R }));
            return o.a.createElement("span", { className: "ck-inspector-tree-text__attributes" }, N);
          }
          shouldComponentUpdate(N) {
            return !m()(this.props, N);
          }
        }
        class X extends c.Component {
          render() {
            return o.a.createElement("span", { className: "ck-inspector-tree-comment", dangerouslySetInnerHTML: { __html: this.props.definition.text } });
          }
        }
        function K(B, N, M) {
          return B.type === "element" ? o.a.createElement(T, { key: N, definition: B, globalTreeProps: M }) : B.type === "text" ? o.a.createElement(P, { key: N, definition: B, globalTreeProps: M }) : B.type === "comment" ? o.a.createElement(X, { key: N, definition: B }) : void 0;
        }
        u(34);
        class j extends c.Component {
          render() {
            let N;
            return N = this.props.definition ? this.props.definition.map((M, V) => K(M, V, { onClick: this.props.onClick, showCompactText: this.props.showCompactText, showElementTypes: this.props.showElementTypes, activeNode: this.props.activeNode })) : "Nothing to show.", o.a.createElement("div", { className: ["ck-inspector-tree", ...this.props.className || [], this.props.textDirection ? "ck-inspector-tree_text-direction_" + this.props.textDirection : "", this.props.showCompactText ? "ck-inspector-tree_compact-text" : ""].join(" ") }, N);
          }
        }
      }, function(b, a, u) {
        (function c() {
          if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE == "function")
            try {
              __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(c);
            } catch (o) {
              console.error(o);
            }
        })(), b.exports = u(22);
      }, function(b, a, u) {
        Object.defineProperty(a, "__esModule", { value: !0 }), a.stringifyPath = a.quoteKey = a.isValidVariableName = a.IS_VALID_IDENTIFIER = a.quoteString = void 0;
        const c = /[\\\'\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, o = /* @__PURE__ */ new Map([["\b", "\\b"], ["	", "\\t"], [`
`, "\\n"], ["\f", "\\f"], ["\r", "\\r"], ["'", "\\'"], ['"', '\\"'], ["\\", "\\\\"]]);
        function x(v) {
          return o.get(v) || "\\u" + ("0000" + v.charCodeAt(0).toString(16)).slice(-4);
        }
        a.quoteString = function(v) {
          return `'${v.replace(c, x)}'`;
        };
        const m = new Set("break else new var case finally return void catch for switch while continue function this with default if throw delete in try do instanceof typeof abstract enum int short boolean export interface static byte extends long super char final native synchronized class float package throws const goto private transient debugger implements protected volatile double import public let yield".split(" "));
        function g(v) {
          return typeof v == "string" && !m.has(v) && a.IS_VALID_IDENTIFIER.test(v);
        }
        a.IS_VALID_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/, a.isValidVariableName = g, a.quoteKey = function(v, y) {
          return g(v) ? v : y(v);
        }, a.stringifyPath = function(v, y) {
          let C = "";
          for (const T of v) g(T) ? C += "." + T : C += `[${y(T)}]`;
          return C;
        };
      }, function(b, a) {
        function u(y, C, T, P) {
          var X, K = (X = P) == null || typeof X == "number" || typeof X == "boolean" ? P : T(P), j = C.get(K);
          return j === void 0 && (j = y.call(this, P), C.set(K, j)), j;
        }
        function c(y, C, T) {
          var P = Array.prototype.slice.call(arguments, 3), X = T(P), K = C.get(X);
          return K === void 0 && (K = y.apply(this, P), C.set(X, K)), K;
        }
        function o(y, C, T, P, X) {
          return T.bind(C, y, P, X);
        }
        function x(y, C) {
          return o(y, this, y.length === 1 ? u : c, C.cache.create(), C.serializer);
        }
        function m() {
          return JSON.stringify(arguments);
        }
        function g() {
          this.cache = /* @__PURE__ */ Object.create(null);
        }
        g.prototype.has = function(y) {
          return y in this.cache;
        }, g.prototype.get = function(y) {
          return this.cache[y];
        }, g.prototype.set = function(y, C) {
          this.cache[y] = C;
        };
        var v = { create: function() {
          return new g();
        } };
        b.exports = function(y, C) {
          var T = C && C.cache ? C.cache : v, P = C && C.serializer ? C.serializer : m;
          return (C && C.strategy ? C.strategy : x)(y, { cache: T, serializer: P });
        }, b.exports.strategies = { variadic: function(y, C) {
          return o(y, this, c, C.cache.create(), C.serializer);
        }, monadic: function(y, C) {
          return o(y, this, u, C.cache.create(), C.serializer);
        } };
      }, function(b, a) {
        var u;
        u = /* @__PURE__ */ function() {
          return this;
        }();
        try {
          u = u || new Function("return this")();
        } catch {
          typeof window == "object" && (u = window);
        }
        b.exports = u;
      }, function(b, a, u) {
        var c = Object.getOwnPropertySymbols, o = Object.prototype.hasOwnProperty, x = Object.prototype.propertyIsEnumerable;
        function m(g) {
          if (g == null) throw new TypeError("Object.assign cannot be called with null or undefined");
          return Object(g);
        }
        b.exports = function() {
          try {
            if (!Object.assign) return !1;
            var g = new String("abc");
            if (g[5] = "de", Object.getOwnPropertyNames(g)[0] === "5") return !1;
            for (var v = {}, y = 0; y < 10; y++) v["_" + String.fromCharCode(y)] = y;
            if (Object.getOwnPropertyNames(v).map(function(T) {
              return v[T];
            }).join("") !== "0123456789") return !1;
            var C = {};
            return "abcdefghijklmnopqrst".split("").forEach(function(T) {
              C[T] = T;
            }), Object.keys(Object.assign({}, C)).join("") === "abcdefghijklmnopqrst";
          } catch {
            return !1;
          }
        }() ? Object.assign : function(g, v) {
          for (var y, C, T = m(g), P = 1; P < arguments.length; P++) {
            for (var X in y = Object(arguments[P])) o.call(y, X) && (T[X] = y[X]);
            if (c) {
              C = c(y);
              for (var K = 0; K < C.length; K++) x.call(y, C[K]) && (T[C[K]] = y[C[K]]);
            }
          }
          return T;
        };
      }, function(b, a, u) {
        Object.defineProperty(a, "__esModule", { value: !0 }), a.FunctionParser = a.dedentFunction = a.functionToString = a.USED_METHOD_KEY = void 0;
        const c = u(13), o = { " "() {
        } }[" "].toString().charAt(0) === '"', x = { Function: "function ", GeneratorFunction: "function* ", AsyncFunction: "async function ", AsyncGeneratorFunction: "async function* " }, m = { Function: "", GeneratorFunction: "*", AsyncFunction: "async ", AsyncGeneratorFunction: "async *" }, g = new Set("case delete else in instanceof new return throw typeof void , ; : + - ! ~ & | ^ * / % < > ? =".split(" "));
        a.USED_METHOD_KEY = /* @__PURE__ */ new WeakSet();
        function v(C) {
          let T;
          for (const P of C.split(`
`).slice(1)) {
            const X = /^[\s\t]+/.exec(P);
            if (!X) return C;
            const [K] = X;
            (T === void 0 || K.length < T.length) && (T = K);
          }
          return T ? C.split(`
` + T).join(`
`) : C;
        }
        a.functionToString = (C, T, P, X) => {
          const K = typeof X == "string" ? X : void 0;
          return K !== void 0 && a.USED_METHOD_KEY.add(C), new y(C, T, P, K).stringify();
        }, a.dedentFunction = v;
        class y {
          constructor(T, P, X, K) {
            this.fn = T, this.indent = P, this.next = X, this.key = K, this.pos = 0, this.hadKeyword = !1, this.fnString = Function.prototype.toString.call(T), this.fnType = T.constructor.name, this.keyQuote = K === void 0 ? "" : c.quoteKey(K, X), this.keyPrefix = K === void 0 ? "" : `${this.keyQuote}:${P ? " " : ""}`, this.isMethodCandidate = K !== void 0 && (this.fn.name === "" || this.fn.name === K);
          }
          stringify() {
            const T = this.tryParse();
            return T ? v(T) : `${this.keyPrefix}void ${this.next(this.fnString)}`;
          }
          getPrefix() {
            return this.isMethodCandidate && !this.hadKeyword ? m[this.fnType] + this.keyQuote : this.keyPrefix + x[this.fnType];
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
              let X = this.pos;
              switch (this.consumeSyntax("WORD_LIKE")) {
                case "WORD_LIKE":
                  this.isMethodCandidate && !this.hadKeyword && (X = this.pos);
                case "()":
                  if (this.fnString.substr(this.pos, 2) === "=>") return this.keyPrefix + this.fnString;
                  this.pos = X;
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
            if (P === this.fn.name && (this.pos += P.length, this.consumeSyntax() === "()" && this.consumeSyntax() === "{}" && this.pos === this.fnString.length)) return !this.isMethodCandidate && c.isValidVariableName(P) || (T += P.length), this.getPrefix() + this.fnString.substr(T);
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
            const [X, K] = P;
            if (this.consumeWhitespace(), K) return T || K;
            switch (X) {
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
            return X;
          }
          consumeSyntaxUntil(T, P) {
            let X = !0;
            for (; ; ) {
              const K = this.consumeSyntax();
              if (K === P) return T + P;
              if (!K || K === ")" || K === "]" || K === "}") return;
              K === "/" && X && this.consumeMatch(/^(?:\\.|[^\\\/\n[]|\[(?:\\.|[^\]])*\])+\/[a-z]*/) ? (X = !1, this.consumeWhitespace()) : X = g.has(K);
            }
          }
          consumeMatch(T) {
            const P = T.exec(this.fnString.substr(this.pos));
            return P && (this.pos += P[0].length), P;
          }
          consumeRegExp(T, P) {
            const X = T.exec(this.fnString.substr(this.pos));
            if (X) return this.pos += X[0].length, this.consumeWhitespace(), P;
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
        a.FunctionParser = y;
      }, function(b, a, u) {
        b.exports = u(53)();
      }, function(b, a, u) {
        Object.defineProperty(a, "__esModule", { value: !0 }), a.stringify = void 0;
        const c = u(25), o = u(13), x = Symbol("root");
        a.stringify = function(m, g, v, y = {}) {
          const C = typeof v == "string" ? v : " ".repeat(v || 0), T = [], P = /* @__PURE__ */ new Set(), X = /* @__PURE__ */ new Map(), K = /* @__PURE__ */ new Map();
          let j = 0;
          const { maxDepth: B = 100, references: N = !1, skipUndefinedProperties: M = !1, maxValues: V = 1e5 } = y, R = function(A) {
            return A ? (se, le, te, ce) => A(se, le, (ye) => c.toString(ye, le, te, ce), ce) : c.toString;
          }(g), oe = (A, se) => {
            if (++j > V || M && A === void 0 || T.length > B) return;
            if (se === void 0) return R(A, C, oe, se);
            T.push(se);
            const le = Q(A, se === x ? void 0 : se);
            return T.pop(), le;
          }, Q = N ? (A, se) => {
            if (A !== null && (typeof A == "object" || typeof A == "function" || typeof A == "symbol")) {
              if (X.has(A)) return K.set(T.slice(1), X.get(A)), R(void 0, C, oe, se);
              X.set(A, T.slice(1));
            }
            return R(A, C, oe, se);
          } : (A, se) => {
            if (P.has(A)) return;
            P.add(A);
            const le = R(A, C, oe, se);
            return P.delete(A), le;
          }, I = oe(m, x);
          if (K.size) {
            const A = C ? " " : "", se = C ? `
` : "";
            let le = `var x${A}=${A}${I};${se}`;
            for (const [te, ce] of K.entries())
              le += `x${o.stringifyPath(te, oe)}${A}=${A}x${o.stringifyPath(ce, oe)};${se}`;
            return `(function${A}()${A}{${se}${le}return x;${se}}())`;
          }
          return I;
        };
      }, function(b, a, u) {
        Object.defineProperty(a, "__esModule", { value: !0 }), a.findInArray = function(c, o) {
          for (var x = 0, m = c.length; x < m; x++) if (o.apply(o, [c[x], x, c])) return c[x];
        }, a.isFunction = function(c) {
          return typeof c == "function" || Object.prototype.toString.call(c) === "[object Function]";
        }, a.isNum = function(c) {
          return typeof c == "number" && !isNaN(c);
        }, a.int = function(c) {
          return parseInt(c, 10);
        }, a.dontSetMe = function(c, o, x) {
          if (c[o]) return new Error("Invalid prop ".concat(o, " passed to ").concat(x, " - do not set this, set it on the child."));
        };
      }, function(b, a, u) {
        var c = u(16), o = typeof Symbol == "function" && Symbol.for, x = o ? Symbol.for("react.element") : 60103, m = o ? Symbol.for("react.portal") : 60106, g = o ? Symbol.for("react.fragment") : 60107, v = o ? Symbol.for("react.strict_mode") : 60108, y = o ? Symbol.for("react.profiler") : 60114, C = o ? Symbol.for("react.provider") : 60109, T = o ? Symbol.for("react.context") : 60110, P = o ? Symbol.for("react.forward_ref") : 60112, X = o ? Symbol.for("react.suspense") : 60113, K = o ? Symbol.for("react.memo") : 60115, j = o ? Symbol.for("react.lazy") : 60116, B = typeof Symbol == "function" && Symbol.iterator;
        function N(G) {
          for (var Y = "https://reactjs.org/docs/error-decoder.html?invariant=" + G, me = 1; me < arguments.length; me++) Y += "&args[]=" + encodeURIComponent(arguments[me]);
          return "Minified React error #" + G + "; visit " + Y + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
        }
        var M = { isMounted: function() {
          return !1;
        }, enqueueForceUpdate: function() {
        }, enqueueReplaceState: function() {
        }, enqueueSetState: function() {
        } }, V = {};
        function R(G, Y, me) {
          this.props = G, this.context = Y, this.refs = V, this.updater = me || M;
        }
        function oe() {
        }
        function Q(G, Y, me) {
          this.props = G, this.context = Y, this.refs = V, this.updater = me || M;
        }
        R.prototype.isReactComponent = {}, R.prototype.setState = function(G, Y) {
          if (typeof G != "object" && typeof G != "function" && G != null) throw Error(N(85));
          this.updater.enqueueSetState(this, G, Y, "setState");
        }, R.prototype.forceUpdate = function(G) {
          this.updater.enqueueForceUpdate(this, G, "forceUpdate");
        }, oe.prototype = R.prototype;
        var I = Q.prototype = new oe();
        I.constructor = Q, c(I, R.prototype), I.isPureReactComponent = !0;
        var A = { current: null }, se = Object.prototype.hasOwnProperty, le = { key: !0, ref: !0, __self: !0, __source: !0 };
        function te(G, Y, me) {
          var l, d = {}, k = null, U = null;
          if (Y != null) for (l in Y.ref !== void 0 && (U = Y.ref), Y.key !== void 0 && (k = "" + Y.key), Y) se.call(Y, l) && !le.hasOwnProperty(l) && (d[l] = Y[l]);
          var F = arguments.length - 2;
          if (F === 1) d.children = me;
          else if (1 < F) {
            for (var W = Array(F), he = 0; he < F; he++) W[he] = arguments[he + 2];
            d.children = W;
          }
          if (G && G.defaultProps) for (l in F = G.defaultProps) d[l] === void 0 && (d[l] = F[l]);
          return { $$typeof: x, type: G, key: k, ref: U, props: d, _owner: A.current };
        }
        function ce(G) {
          return typeof G == "object" && G !== null && G.$$typeof === x;
        }
        var ye = /\/+/g, J = [];
        function fe(G, Y, me, l) {
          if (J.length) {
            var d = J.pop();
            return d.result = G, d.keyPrefix = Y, d.func = me, d.context = l, d.count = 0, d;
          }
          return { result: G, keyPrefix: Y, func: me, context: l, count: 0 };
        }
        function D(G) {
          G.result = null, G.keyPrefix = null, G.func = null, G.context = null, G.count = 0, 10 > J.length && J.push(G);
        }
        function ie(G, Y, me) {
          return G == null ? 0 : function l(d, k, U, F) {
            var W = typeof d;
            W !== "undefined" && W !== "boolean" || (d = null);
            var he = !1;
            if (d === null) he = !0;
            else switch (W) {
              case "string":
              case "number":
                he = !0;
                break;
              case "object":
                switch (d.$$typeof) {
                  case x:
                  case m:
                    he = !0;
                }
            }
            if (he) return U(F, d, k === "" ? "." + be(d, 0) : k), 1;
            if (he = 0, k = k === "" ? "." : k + ":", Array.isArray(d)) for (var je = 0; je < d.length; je++) {
              var Re = k + be(W = d[je], je);
              he += l(W, Re, U, F);
            }
            else if (d === null || typeof d != "object" ? Re = null : Re = typeof (Re = B && d[B] || d["@@iterator"]) == "function" ? Re : null, typeof Re == "function") for (d = Re.call(d), je = 0; !(W = d.next()).done; ) he += l(W = W.value, Re = k + be(W, je++), U, F);
            else if (W === "object") throw U = "" + d, Error(N(31, U === "[object Object]" ? "object with keys {" + Object.keys(d).join(", ") + "}" : U, ""));
            return he;
          }(G, "", Y, me);
        }
        function be(G, Y) {
          return typeof G == "object" && G !== null && G.key != null ? function(me) {
            var l = { "=": "=0", ":": "=2" };
            return "$" + ("" + me).replace(/[=:]/g, function(d) {
              return l[d];
            });
          }(G.key) : Y.toString(36);
        }
        function Ce(G, Y) {
          G.func.call(G.context, Y, G.count++);
        }
        function ke(G, Y, me) {
          var l = G.result, d = G.keyPrefix;
          G = G.func.call(G.context, Y, G.count++), Array.isArray(G) ? Ne(G, l, me, function(k) {
            return k;
          }) : G != null && (ce(G) && (G = function(k, U) {
            return { $$typeof: x, type: k.type, key: U, ref: k.ref, props: k.props, _owner: k._owner };
          }(G, d + (!G.key || Y && Y.key === G.key ? "" : ("" + G.key).replace(ye, "$&/") + "/") + me)), l.push(G));
        }
        function Ne(G, Y, me, l, d) {
          var k = "";
          me != null && (k = ("" + me).replace(ye, "$&/") + "/"), ie(G, ke, Y = fe(Y, k, l, d)), D(Y);
        }
        var xe = { current: null };
        function ze() {
          var G = xe.current;
          if (G === null) throw Error(N(321));
          return G;
        }
        var Je = { ReactCurrentDispatcher: xe, ReactCurrentBatchConfig: { suspense: null }, ReactCurrentOwner: A, IsSomeRendererActing: { current: !1 }, assign: c };
        a.Children = { map: function(G, Y, me) {
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
        } }, a.Component = R, a.Fragment = g, a.Profiler = y, a.PureComponent = Q, a.StrictMode = v, a.Suspense = X, a.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Je, a.cloneElement = function(G, Y, me) {
          if (G == null) throw Error(N(267, G));
          var l = c({}, G.props), d = G.key, k = G.ref, U = G._owner;
          if (Y != null) {
            if (Y.ref !== void 0 && (k = Y.ref, U = A.current), Y.key !== void 0 && (d = "" + Y.key), G.type && G.type.defaultProps) var F = G.type.defaultProps;
            for (W in Y) se.call(Y, W) && !le.hasOwnProperty(W) && (l[W] = Y[W] === void 0 && F !== void 0 ? F[W] : Y[W]);
          }
          var W = arguments.length - 2;
          if (W === 1) l.children = me;
          else if (1 < W) {
            F = Array(W);
            for (var he = 0; he < W; he++) F[he] = arguments[he + 2];
            l.children = F;
          }
          return { $$typeof: x, type: G.type, key: d, ref: k, props: l, _owner: U };
        }, a.createContext = function(G, Y) {
          return Y === void 0 && (Y = null), (G = { $$typeof: T, _calculateChangedBits: Y, _currentValue: G, _currentValue2: G, _threadCount: 0, Provider: null, Consumer: null }).Provider = { $$typeof: C, _context: G }, G.Consumer = G;
        }, a.createElement = te, a.createFactory = function(G) {
          var Y = te.bind(null, G);
          return Y.type = G, Y;
        }, a.createRef = function() {
          return { current: null };
        }, a.forwardRef = function(G) {
          return { $$typeof: P, render: G };
        }, a.isValidElement = ce, a.lazy = function(G) {
          return { $$typeof: j, _ctor: G, _status: -1, _result: null };
        }, a.memo = function(G, Y) {
          return { $$typeof: K, type: G, compare: Y === void 0 ? null : Y };
        }, a.useCallback = function(G, Y) {
          return ze().useCallback(G, Y);
        }, a.useContext = function(G, Y) {
          return ze().useContext(G, Y);
        }, a.useDebugValue = function() {
        }, a.useEffect = function(G, Y) {
          return ze().useEffect(G, Y);
        }, a.useImperativeHandle = function(G, Y, me) {
          return ze().useImperativeHandle(G, Y, me);
        }, a.useLayoutEffect = function(G, Y) {
          return ze().useLayoutEffect(G, Y);
        }, a.useMemo = function(G, Y) {
          return ze().useMemo(G, Y);
        }, a.useReducer = function(G, Y, me) {
          return ze().useReducer(G, Y, me);
        }, a.useRef = function(G) {
          return ze().useRef(G);
        }, a.useState = function(G) {
          return ze().useState(G);
        }, a.version = "16.14.0";
      }, function(b, a, u) {
        var c = u(0), o = u(16), x = u(23);
        function m(e) {
          for (var t = "https://reactjs.org/docs/error-decoder.html?invariant=" + e, n = 1; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
          return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
        }
        if (!c) throw Error(m(227));
        function g(e, t, n, r, i, p, w, S, Z) {
          var q = Array.prototype.slice.call(arguments, 3);
          try {
            t.apply(n, q);
          } catch (ge) {
            this.onError(ge);
          }
        }
        var v = !1, y = null, C = !1, T = null, P = { onError: function(e) {
          v = !0, y = e;
        } };
        function X(e, t, n, r, i, p, w, S, Z) {
          v = !1, y = null, g.apply(P, arguments);
        }
        var K = null, j = null, B = null;
        function N(e, t, n) {
          var r = e.type || "unknown-event";
          e.currentTarget = B(n), function(i, p, w, S, Z, q, ge, De, We) {
            if (X.apply(this, arguments), v) {
              if (!v) throw Error(m(198));
              var ot = y;
              v = !1, y = null, C || (C = !0, T = ot);
            }
          }(r, t, void 0, e), e.currentTarget = null;
        }
        var M = null, V = {};
        function R() {
          if (M) for (var e in V) {
            var t = V[e], n = M.indexOf(e);
            if (!(-1 < n)) throw Error(m(96, e));
            if (!Q[n]) {
              if (!t.extractEvents) throw Error(m(97, e));
              for (var r in Q[n] = t, n = t.eventTypes) {
                var i = void 0, p = n[r], w = t, S = r;
                if (I.hasOwnProperty(S)) throw Error(m(99, S));
                I[S] = p;
                var Z = p.phasedRegistrationNames;
                if (Z) {
                  for (i in Z) Z.hasOwnProperty(i) && oe(Z[i], w, S);
                  i = !0;
                } else p.registrationName ? (oe(p.registrationName, w, S), i = !0) : i = !1;
                if (!i) throw Error(m(98, r, e));
              }
            }
          }
        }
        function oe(e, t, n) {
          if (A[e]) throw Error(m(100, e));
          A[e] = t, se[e] = t.eventTypes[n].dependencies;
        }
        var Q = [], I = {}, A = {}, se = {};
        function le(e) {
          var t, n = !1;
          for (t in e) if (e.hasOwnProperty(t)) {
            var r = e[t];
            if (!V.hasOwnProperty(t) || V[t] !== r) {
              if (V[t]) throw Error(m(102, t));
              V[t] = r, n = !0;
            }
          }
          n && R();
        }
        var te = !(typeof window > "u" || window.document === void 0 || window.document.createElement === void 0), ce = null, ye = null, J = null;
        function fe(e) {
          if (e = j(e)) {
            if (typeof ce != "function") throw Error(m(280));
            var t = e.stateNode;
            t && (t = K(t), ce(e.stateNode, e.type, t));
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
        var Y = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, me = Object.prototype.hasOwnProperty, l = {}, d = {};
        function k(e, t, n, r, i, p) {
          this.acceptsBooleans = t === 2 || t === 3 || t === 4, this.attributeName = r, this.attributeNamespace = i, this.mustUseProperty = n, this.propertyName = e, this.type = t, this.sanitizeURL = p;
        }
        var U = {};
        "children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(e) {
          U[e] = new k(e, 0, !1, e, null, !1);
        }), [["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(e) {
          var t = e[0];
          U[t] = new k(t, 1, !1, e[1], null, !1);
        }), ["contentEditable", "draggable", "spellCheck", "value"].forEach(function(e) {
          U[e] = new k(e, 2, !1, e.toLowerCase(), null, !1);
        }), ["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(e) {
          U[e] = new k(e, 2, !1, e, null, !1);
        }), "allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(e) {
          U[e] = new k(e, 3, !1, e.toLowerCase(), null, !1);
        }), ["checked", "multiple", "muted", "selected"].forEach(function(e) {
          U[e] = new k(e, 3, !0, e, null, !1);
        }), ["capture", "download"].forEach(function(e) {
          U[e] = new k(e, 4, !1, e, null, !1);
        }), ["cols", "rows", "size", "span"].forEach(function(e) {
          U[e] = new k(e, 6, !1, e, null, !1);
        }), ["rowSpan", "start"].forEach(function(e) {
          U[e] = new k(e, 5, !1, e.toLowerCase(), null, !1);
        });
        var F = /[\-:]([a-z])/g;
        function W(e) {
          return e[1].toUpperCase();
        }
        "accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e) {
          var t = e.replace(F, W);
          U[t] = new k(t, 1, !1, e, null, !1);
        }), "xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e) {
          var t = e.replace(F, W);
          U[t] = new k(t, 1, !1, e, "http://www.w3.org/1999/xlink", !1);
        }), ["xml:base", "xml:lang", "xml:space"].forEach(function(e) {
          var t = e.replace(F, W);
          U[t] = new k(t, 1, !1, e, "http://www.w3.org/XML/1998/namespace", !1);
        }), ["tabIndex", "crossOrigin"].forEach(function(e) {
          U[e] = new k(e, 1, !1, e.toLowerCase(), null, !1);
        }), U.xlinkHref = new k("xlinkHref", 1, !1, "xlink:href", "http://www.w3.org/1999/xlink", !0), ["src", "href", "action", "formAction"].forEach(function(e) {
          U[e] = new k(e, 1, !1, e.toLowerCase(), null, !0);
        });
        var he = c.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
        function je(e, t, n, r) {
          var i = U.hasOwnProperty(t) ? U[t] : null;
          (i !== null ? i.type === 0 : !r && 2 < t.length && (t[0] === "o" || t[0] === "O") && (t[1] === "n" || t[1] === "N")) || (function(p, w, S, Z) {
            if (w == null || function(q, ge, De, We) {
              if (De !== null && De.type === 0) return !1;
              switch (typeof ge) {
                case "function":
                case "symbol":
                  return !0;
                case "boolean":
                  return !We && (De !== null ? !De.acceptsBooleans : (q = q.toLowerCase().slice(0, 5)) !== "data-" && q !== "aria-");
                default:
                  return !1;
              }
            }(p, w, S, Z)) return !0;
            if (Z) return !1;
            if (S !== null) switch (S.type) {
              case 3:
                return !w;
              case 4:
                return w === !1;
              case 5:
                return isNaN(w);
              case 6:
                return isNaN(w) || 1 > w;
            }
            return !1;
          }(t, n, i, r) && (n = null), r || i === null ? function(p) {
            return !!me.call(d, p) || !me.call(l, p) && (Y.test(p) ? d[p] = !0 : (l[p] = !0, !1));
          }(t) && (n === null ? e.removeAttribute(t) : e.setAttribute(t, "" + n)) : i.mustUseProperty ? e[i.propertyName] = n === null ? i.type !== 3 && "" : n : (t = i.attributeName, r = i.attributeNamespace, n === null ? e.removeAttribute(t) : (n = (i = i.type) === 3 || i === 4 && n === !0 ? "" : "" + n, r ? e.setAttributeNS(r, t, n) : e.setAttribute(t, n))));
        }
        he.hasOwnProperty("ReactCurrentDispatcher") || (he.ReactCurrentDispatcher = { current: null }), he.hasOwnProperty("ReactCurrentBatchConfig") || (he.ReactCurrentBatchConfig = { suspense: null });
        var Re = /^(.*)[\\\/]/, Xe = typeof Symbol == "function" && Symbol.for, He = Xe ? Symbol.for("react.element") : 60103, At = Xe ? Symbol.for("react.portal") : 60106, wt = Xe ? Symbol.for("react.fragment") : 60107, Jt = Xe ? Symbol.for("react.strict_mode") : 60108, kt = Xe ? Symbol.for("react.profiler") : 60114, gt = Xe ? Symbol.for("react.provider") : 60109, cn = Xe ? Symbol.for("react.context") : 60110, Er = Xe ? Symbol.for("react.concurrent_mode") : 60111, Tt = Xe ? Symbol.for("react.forward_ref") : 60112, pt = Xe ? Symbol.for("react.suspense") : 60113, Yn = Xe ? Symbol.for("react.suspense_list") : 60120, Sn = Xe ? Symbol.for("react.memo") : 60115, or = Xe ? Symbol.for("react.lazy") : 60116, _r = Xe ? Symbol.for("react.block") : 60121, ko = typeof Symbol == "function" && Symbol.iterator;
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
            case At:
              return "Portal";
            case kt:
              return "Profiler";
            case Jt:
              return "StrictMode";
            case pt:
              return "Suspense";
            case Yn:
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
                var r = e._debugOwner, i = e._debugSource, p = Yt(e.type);
                n = null, r && (n = Yt(r.type)), r = p, p = "", i ? p = " (at " + i.fileName.replace(Re, "") + ":" + i.lineNumber + ")" : n && (p = " (created by " + n + ")"), n = `
    in ` + (r || "Unknown") + p;
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
              var p = r.get, w = r.set;
              return Object.defineProperty(t, n, { configurable: !0, get: function() {
                return p.call(this);
              }, set: function(S) {
                i = "" + S, w.call(this, S);
              } }), Object.defineProperty(t, n, { enumerable: r.enumerable }), { getValue: function() {
                return i;
              }, setValue: function(S) {
                i = "" + S;
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
            return c.Children.forEach(n, function(i) {
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
        var tn = Nt("animationend"), ht = Nt("animationiteration"), Vt = Nt("animationstart"), Nn = Nt("transitionend"), ct = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), yn = new (typeof WeakMap == "function" ? WeakMap : Map)();
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
            for (var i = n, p = r; ; ) {
              var w = i.return;
              if (w === null) break;
              var S = w.alternate;
              if (S === null) {
                if ((p = w.return) !== null) {
                  i = p;
                  continue;
                }
                break;
              }
              if (w.child === S.child) {
                for (S = w.child; S; ) {
                  if (S === i) return _o(w), n;
                  if (S === p) return _o(w), r;
                  S = S.sibling;
                }
                throw Error(m(188));
              }
              if (i.return !== p.return) i = w, p = S;
              else {
                for (var Z = !1, q = w.child; q; ) {
                  if (q === i) {
                    Z = !0, i = w, p = S;
                    break;
                  }
                  if (q === p) {
                    Z = !0, p = w, i = S;
                    break;
                  }
                  q = q.sibling;
                }
                if (!Z) {
                  for (q = S.child; q; ) {
                    if (q === i) {
                      Z = !0, i = S, p = w;
                      break;
                    }
                    if (q === p) {
                      Z = !0, p = S, i = w;
                      break;
                    }
                    q = q.sibling;
                  }
                  if (!Z) throw Error(m(189));
                }
              }
              if (i.alternate !== p) throw Error(m(190));
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
        function qn(e, t, n) {
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
        function Mt(e) {
          if (e !== null && (Kt = Ue(Kt, e)), e = Kt, Kt = null, e) {
            if (qn(e, Or), Kt) throw Error(m(95));
            if (C) throw e = T, C = !1, T = null, e;
          }
        }
        function nn(e) {
          return (e = e.target || e.srcElement || window).correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
        }
        function Wt(e) {
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
            var p = e.nativeEvent, w = e.eventSystemFlags;
            n === 0 && (w |= 64);
            for (var S = null, Z = 0; Z < Q.length; Z++) {
              var q = Q[Z];
              q && (q = q.extractEvents(r, t, p, i, w)) && (S = Ue(S, q));
            }
            Mt(S);
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
                Wt(e) && Jr(t, e, !0);
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
        var Et, ur, fr, vn = !1, Ut = [], Ht = null, on = null, Kn = null, dr = /* @__PURE__ */ new Map(), Zr = /* @__PURE__ */ new Map(), Nr = [], Vn = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput close cancel copy cut paste click change contextmenu reset submit".split(" "), Pt = "focus blur dragenter dragleave mouseover mouseout pointerover pointerout gotpointercapture lostpointercapture".split(" ");
        function xo(e, t, n, r, i) {
          return { blockedOn: e, topLevelType: t, eventSystemFlags: 32 | n, nativeEvent: i, container: r };
        }
        function wn(e, t) {
          switch (e) {
            case "focus":
            case "blur":
              Ht = null;
              break;
            case "dragenter":
            case "dragleave":
              on = null;
              break;
            case "mouseover":
            case "mouseout":
              Kn = null;
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
        function Pr(e, t, n, r, i, p) {
          return e === null || e.nativeEvent !== p ? (e = xo(t, n, r, i, p), t !== null && (t = oo(t)) !== null && ur(t), e) : (e.eventSystemFlags |= r, e);
        }
        function Ca(e) {
          var t = Ir(e.target);
          if (t !== null) {
            var n = Pn(t);
            if (n !== null) {
              if ((t = n.tag) === 13) {
                if ((t = Eo(n)) !== null) return e.blockedOn = t, void x.unstable_runWithPriority(e.priority, function() {
                  fr(n);
                });
              } else if (t === 3 && n.stateNode.hydrate) return void (e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null);
            }
          }
          e.blockedOn = null;
        }
        function So(e) {
          if (e.blockedOn !== null) return !1;
          var t = Ar(e.topLevelType, e.eventSystemFlags, e.container, e.nativeEvent);
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
            var t = Ar(e.topLevelType, e.eventSystemFlags, e.container, e.nativeEvent);
            t !== null ? e.blockedOn = t : Ut.shift();
          }
          Ht !== null && So(Ht) && (Ht = null), on !== null && So(on) && (on = null), Kn !== null && So(Kn) && (Kn = null), dr.forEach(yi), Zr.forEach(yi);
        }
        function Dr(e, t) {
          e.blockedOn === t && (e.blockedOn = null, vn || (vn = !0, x.unstable_scheduleCallback(x.unstable_NormalPriority, vi)));
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
          for (Ht !== null && Dr(Ht, e), on !== null && Dr(on, e), Kn !== null && Dr(Kn, e), dr.forEach(t), Zr.forEach(t), n = 0; n < Nr.length; n++) (r = Nr[n]).blockedOn === e && (r.blockedOn = null);
          for (; 0 < Nr.length && (n = Nr[0]).blockedOn === null; ) Ca(n), n.blockedOn === null && Nr.shift();
        }
        var wi = {}, ki = /* @__PURE__ */ new Map(), Rr = /* @__PURE__ */ new Map(), Ta = ["abort", "abort", tn, "animationEnd", ht, "animationIteration", Vt, "animationStart", "canplay", "canPlay", "canplaythrough", "canPlayThrough", "durationchange", "durationChange", "emptied", "emptied", "encrypted", "encrypted", "ended", "ended", "error", "error", "gotpointercapture", "gotPointerCapture", "load", "load", "loadeddata", "loadedData", "loadedmetadata", "loadedMetadata", "loadstart", "loadStart", "lostpointercapture", "lostPointerCapture", "playing", "playing", "progress", "progress", "seeking", "seeking", "stalled", "stalled", "suspend", "suspend", "timeupdate", "timeUpdate", Nn, "transitionEnd", "waiting", "waiting"];
        function Yo(e, t) {
          for (var n = 0; n < e.length; n += 2) {
            var r = e[n], i = e[n + 1], p = "on" + (i[0].toUpperCase() + i.slice(1));
            p = { phasedRegistrationNames: { bubbled: p, captured: p + "Capture" }, dependencies: [r], eventPriority: t }, Rr.set(r, t), ki.set(r, p), wi[i] = p;
          }
        }
        Yo("blur blur cancel cancel click click close close contextmenu contextMenu copy copy cut cut auxclick auxClick dblclick doubleClick dragend dragEnd dragstart dragStart drop drop focus focus input input invalid invalid keydown keyDown keypress keyPress keyup keyUp mousedown mouseDown mouseup mouseUp paste paste pause pause play play pointercancel pointerCancel pointerdown pointerDown pointerup pointerUp ratechange rateChange reset reset seeked seeked submit submit touchcancel touchCancel touchend touchEnd touchstart touchStart volumechange volumeChange".split(" "), 0), Yo("drag drag dragenter dragEnter dragexit dragExit dragleave dragLeave dragover dragOver mousemove mouseMove mouseout mouseOut mouseover mouseOver pointermove pointerMove pointerout pointerOut pointerover pointerOver scroll scroll toggle toggle touchmove touchMove wheel wheel".split(" "), 1), Yo(Ta, 2);
        for (var Ei = "change selectionchange textInput compositionstart compositionend compositionupdate".split(" "), qo = 0; qo < Ei.length; qo++) Rr.set(Ei[qo], 0);
        var Oa = x.unstable_UserBlockingPriority, Na = x.unstable_runWithPriority, Co = !0;
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
          var i = To, p = xe;
          xe = !0;
          try {
            Ce(i, e, t, n, r);
          } finally {
            (xe = p) || Je();
          }
        }
        function Pa(e, t, n, r) {
          Na(Oa, To.bind(null, e, t, n, r));
        }
        function To(e, t, n, r) {
          if (Co) if (0 < Ut.length && -1 < Vn.indexOf(e)) e = xo(null, e, t, n, r), Ut.push(e);
          else {
            var i = Ar(e, t, n, r);
            if (i === null) wn(e, r);
            else if (-1 < Vn.indexOf(e)) e = xo(i, e, t, n, r), Ut.push(e);
            else if (!function(p, w, S, Z, q) {
              switch (w) {
                case "focus":
                  return Ht = Pr(Ht, p, w, S, Z, q), !0;
                case "dragenter":
                  return on = Pr(on, p, w, S, Z, q), !0;
                case "mouseover":
                  return Kn = Pr(Kn, p, w, S, Z, q), !0;
                case "pointerover":
                  var ge = q.pointerId;
                  return dr.set(ge, Pr(dr.get(ge) || null, p, w, S, Z, q)), !0;
                case "gotpointercapture":
                  return ge = q.pointerId, Zr.set(ge, Pr(Zr.get(ge) || null, p, w, S, Z, q)), !0;
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
        function Ar(e, t, n, r) {
          if ((n = Ir(n = nn(r))) !== null) {
            var i = Pn(n);
            if (i === null) n = null;
            else {
              var p = i.tag;
              if (p === 13) {
                if ((n = Eo(i)) !== null) return n;
                n = null;
              } else if (p === 3) {
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
        function Mr(e) {
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
        var No = Math.random().toString(36).slice(2), Qn = "__reactInternalInstance$" + No, no = "__reactEventHandlers$" + No, ro = "__reactContainere$" + No;
        function Ir(e) {
          var t = e[Qn];
          if (t) return t;
          for (var n = e.parentNode; n; ) {
            if (t = n[ro] || n[Qn]) {
              if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = Ri(e); e !== null; ) {
                if (n = e[Qn]) return n;
                e = Ri(e);
              }
              return t;
            }
            n = (e = n).parentNode;
          }
          return null;
        }
        function oo(e) {
          return !(e = e[Qn] || e[ro]) || e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3 ? null : e;
        }
        function Gn(e) {
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
        function Ai(e, t) {
          var n = e.stateNode;
          if (!n) return null;
          var r = K(n);
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
        function Mi(e, t, n) {
          (t = Ai(e, n.dispatchConfig.phasedRegistrationNames[t])) && (n._dispatchListeners = Ue(n._dispatchListeners, t), n._dispatchInstances = Ue(n._dispatchInstances, e));
        }
        function Ra(e) {
          if (e && e.dispatchConfig.phasedRegistrationNames) {
            for (var t = e._targetInst, n = []; t; ) n.push(t), t = Rn(t);
            for (t = n.length; 0 < t--; ) Mi(n[t], "captured", e);
            for (t = 0; t < n.length; t++) Mi(n[t], "bubbled", e);
          }
        }
        function Po(e, t, n) {
          e && n && n.dispatchConfig.registrationName && (t = Ai(e, n.dispatchConfig.registrationName)) && (n._dispatchListeners = Ue(n._dispatchListeners, t), n._dispatchInstances = Ue(n._dispatchInstances, e));
        }
        function Aa(e) {
          e && e.dispatchConfig.registrationName && Po(e._targetInst, null, e);
        }
        function jr(e) {
          qn(e, Ra);
        }
        var hr = null, ri = null, Do = null;
        function Ii() {
          if (Do) return Do;
          var e, t, n = ri, r = n.length, i = "value" in hr ? hr.value : hr.textContent, p = i.length;
          for (e = 0; e < r && n[e] === i[e]; e++) ;
          var w = r - e;
          for (t = 1; t <= w && n[r - t] === i[p - t]; t++) ;
          return Do = i.slice(e, 1 < t ? 1 - t : void 0);
        }
        function Ro() {
          return !0;
        }
        function Ao() {
          return !1;
        }
        function an(e, t, n, r) {
          for (var i in this.dispatchConfig = e, this._targetInst = t, this.nativeEvent = n, e = this.constructor.Interface) e.hasOwnProperty(i) && ((t = e[i]) ? this[i] = t(n) : i === "target" ? this.target = r : this[i] = n[i]);
          return this.isDefaultPrevented = (n.defaultPrevented != null ? n.defaultPrevented : n.returnValue === !1) ? Ro : Ao, this.isPropagationStopped = Ao, this;
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
        function E(e) {
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
        }, isPersistent: Ao, destructor: function() {
          var e, t = this.constructor.Interface;
          for (e in t) this[e] = null;
          this.nativeEvent = this._targetInst = this.dispatchConfig = null, this.isPropagationStopped = this.isDefaultPrevented = Ao, this._dispatchInstances = this._dispatchListeners = null;
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
          return o(i, n.prototype), n.prototype = i, n.prototype.constructor = n, n.Interface = o({}, r.Interface, e), n.extend = r.extend, E(n), n;
        }, E(an);
        var s = an.extend({ data: null }), f = an.extend({ data: null }), h = [9, 13, 27, 32], _ = te && "CompositionEvent" in window, O = null;
        te && "documentMode" in document && (O = document.documentMode);
        var z = te && "TextEvent" in window && !O, ne = te && (!_ || O && 8 < O && 11 >= O), de = " ", pe = { beforeInput: { phasedRegistrationNames: { bubbled: "onBeforeInput", captured: "onBeforeInputCapture" }, dependencies: ["compositionend", "keypress", "textInput", "paste"] }, compositionEnd: { phasedRegistrationNames: { bubbled: "onCompositionEnd", captured: "onCompositionEndCapture" }, dependencies: "blur compositionend keydown keypress keyup mousedown".split(" ") }, compositionStart: { phasedRegistrationNames: { bubbled: "onCompositionStart", captured: "onCompositionStartCapture" }, dependencies: "blur compositionstart keydown keypress keyup mousedown".split(" ") }, compositionUpdate: { phasedRegistrationNames: { bubbled: "onCompositionUpdate", captured: "onCompositionUpdateCapture" }, dependencies: "blur compositionupdate keydown keypress keyup mousedown".split(" ") } }, Ee = !1;
        function Pe(e, t) {
          switch (e) {
            case "keyup":
              return h.indexOf(t.keyCode) !== -1;
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
        function Ve(e) {
          return typeof (e = e.detail) == "object" && "data" in e ? e.data : null;
        }
        var Ae = !1, Ke = { eventTypes: pe, extractEvents: function(e, t, n, r) {
          var i;
          if (_) e: {
            switch (e) {
              case "compositionstart":
                var p = pe.compositionStart;
                break e;
              case "compositionend":
                p = pe.compositionEnd;
                break e;
              case "compositionupdate":
                p = pe.compositionUpdate;
                break e;
            }
            p = void 0;
          }
          else Ae ? Pe(e, n) && (p = pe.compositionEnd) : e === "keydown" && n.keyCode === 229 && (p = pe.compositionStart);
          return p ? (ne && n.locale !== "ko" && (Ae || p !== pe.compositionStart ? p === pe.compositionEnd && Ae && (i = Ii()) : (ri = "value" in (hr = r) ? hr.value : hr.textContent, Ae = !0)), p = s.getPooled(p, t, n, r), (i || (i = Ve(n)) !== null) && (p.data = i), jr(p), i = p) : i = null, (e = z ? function(w, S) {
            switch (w) {
              case "compositionend":
                return Ve(S);
              case "keypress":
                return S.which !== 32 ? null : (Ee = !0, de);
              case "textInput":
                return (w = S.data) === de && Ee ? null : w;
              default:
                return null;
            }
          }(e, n) : function(w, S) {
            if (Ae) return w === "compositionend" || !_ && Pe(w, S) ? (w = Ii(), Do = ri = hr = null, Ae = !1, w) : null;
            switch (w) {
              case "paste":
                return null;
              case "keypress":
                if (!(S.ctrlKey || S.altKey || S.metaKey) || S.ctrlKey && S.altKey) {
                  if (S.char && 1 < S.char.length) return S.char;
                  if (S.which) return String.fromCharCode(S.which);
                }
                return null;
              case "compositionend":
                return ne && S.locale !== "ko" ? null : S.data;
              default:
                return null;
            }
          }(e, n)) ? ((t = f.getPooled(pe.beforeInput, t, n, r)).data = e, jr(t)) : t = null, i === null ? t : t === null ? i : [i, t];
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
          Mt(e);
        }
        function It(e) {
          if (ut(Gn(e))) return e;
        }
        function jt(e, t) {
          if (e === "change") return t;
        }
        var _t = !1;
        function zt() {
          Le && (Le.detachEvent("onpropertychange", dt), ft = Le = null);
        }
        function dt(e) {
          if (e.propertyName === "value" && It(ft)) if (e = Ye(ft, e, nn(e)), xe) Mt(e);
          else {
            xe = !0;
            try {
              be(Dt, e);
            } finally {
              xe = !1, Je();
            }
          }
        }
        function An(e, t, n) {
          e === "focus" ? (zt(), ft = n, (Le = t).attachEvent("onpropertychange", dt)) : e === "blur" && zt();
        }
        function lt(e) {
          if (e === "selectionchange" || e === "keyup" || e === "keydown") return It(ft);
        }
        function Mn(e, t) {
          if (e === "click") return It(t);
        }
        function Hn(e, t) {
          if (e === "input" || e === "change") return It(t);
        }
        te && (_t = Wt("input") && (!document.documentMode || 9 < document.documentMode));
        var zr = { eventTypes: et, _isInputEventSupported: _t, extractEvents: function(e, t, n, r) {
          var i = t ? Gn(t) : window, p = i.nodeName && i.nodeName.toLowerCase();
          if (p === "select" || p === "input" && i.type === "file") var w = jt;
          else if (Fe(i)) if (_t) w = Hn;
          else {
            w = lt;
            var S = An;
          }
          else (p = i.nodeName) && p.toLowerCase() === "input" && (i.type === "checkbox" || i.type === "radio") && (w = Mn);
          if (w && (w = w(e, t))) return Ye(w, n, r);
          S && S(e, i, t), e === "blur" && (e = i._wrapperState) && e.controlled && i.type === "number" && Cn(i, "number", i.value);
        } }, xt = an.extend({ view: null, detail: null }), io = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
        function In(e) {
          var t = this.nativeEvent;
          return t.getModifierState ? t.getModifierState(e) : !!(e = io[e]) && !!t[e];
        }
        function $t() {
          return In;
        }
        var fn = 0, Xn = 0, Gt = !1, dn = !1, Lr = xt.extend({ screenX: null, screenY: null, clientX: null, clientY: null, pageX: null, pageY: null, ctrlKey: null, shiftKey: null, altKey: null, metaKey: null, getModifierState: $t, button: null, buttons: null, relatedTarget: function(e) {
          return e.relatedTarget || (e.fromElement === e.srcElement ? e.toElement : e.fromElement);
        }, movementX: function(e) {
          if ("movementX" in e) return e.movementX;
          var t = fn;
          return fn = e.screenX, Gt ? e.type === "mousemove" ? e.screenX - t : 0 : (Gt = !0, 0);
        }, movementY: function(e) {
          if ("movementY" in e) return e.movementY;
          var t = Xn;
          return Xn = e.screenY, dn ? e.type === "mousemove" ? e.screenY - t : 0 : (dn = !0, 0);
        } }), oi = Lr.extend({ pointerId: null, width: null, height: null, pressure: null, tangentialPressure: null, tiltX: null, tiltY: null, twist: null, pointerType: null, isPrimary: null }), Ur = { mouseEnter: { registrationName: "onMouseEnter", dependencies: ["mouseout", "mouseover"] }, mouseLeave: { registrationName: "onMouseLeave", dependencies: ["mouseout", "mouseover"] }, pointerEnter: { registrationName: "onPointerEnter", dependencies: ["pointerout", "pointerover"] }, pointerLeave: { registrationName: "onPointerLeave", dependencies: ["pointerout", "pointerover"] } }, Mo = { eventTypes: Ur, extractEvents: function(e, t, n, r, i) {
          var p = e === "mouseover" || e === "pointerover", w = e === "mouseout" || e === "pointerout";
          if (p && !(32 & i) && (n.relatedTarget || n.fromElement) || !w && !p || (p = r.window === r ? r : (p = r.ownerDocument) ? p.defaultView || p.parentWindow : window, w ? (w = t, (t = (t = n.relatedTarget || n.toElement) ? Ir(t) : null) !== null && (t !== Pn(t) || t.tag !== 5 && t.tag !== 6) && (t = null)) : w = null, w === t)) return null;
          if (e === "mouseout" || e === "mouseover") var S = Lr, Z = Ur.mouseLeave, q = Ur.mouseEnter, ge = "mouse";
          else e !== "pointerout" && e !== "pointerover" || (S = oi, Z = Ur.pointerLeave, q = Ur.pointerEnter, ge = "pointer");
          if (e = w == null ? p : Gn(w), p = t == null ? p : Gn(t), (Z = S.getPooled(Z, w, n, r)).type = ge + "leave", Z.target = e, Z.relatedTarget = p, (n = S.getPooled(q, t, n, r)).type = ge + "enter", n.target = p, n.relatedTarget = e, ge = t, (r = w) && ge) e: {
            for (q = ge, w = 0, e = S = r; e; e = Rn(e)) w++;
            for (e = 0, t = q; t; t = Rn(t)) e++;
            for (; 0 < w - e; ) S = Rn(S), w--;
            for (; 0 < e - w; ) q = Rn(q), e--;
            for (; w--; ) {
              if (S === q || S === q.alternate) break e;
              S = Rn(S), q = Rn(q);
            }
            S = null;
          }
          else S = null;
          for (q = S, S = []; r && r !== q && ((w = r.alternate) === null || w !== q); ) S.push(r), r = Rn(r);
          for (r = []; ge && ge !== q && ((w = ge.alternate) === null || w !== q); ) r.push(ge), ge = Rn(ge);
          for (ge = 0; ge < S.length; ge++) Po(S[ge], "bubbled", Z);
          for (ge = r.length; 0 < ge--; ) Po(r[ge], "captured", n);
          return 64 & i ? [Z, n] : [Z];
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
        var Io = te && "documentMode" in document && 11 >= document.documentMode, ii = { select: { phasedRegistrationNames: { bubbled: "onSelect", captured: "onSelectCapture" }, dependencies: "blur contextmenu dragend focus keydown keyup mousedown mouseup selectionchange".split(" ") } }, Zn = null, ao = null, kn = null, so = !1;
        function Os(e, t) {
          var n = t.window === t ? t.document : t.nodeType === 9 ? t : t.ownerDocument;
          return so || Zn == null || Zn !== Go(n) ? null : ("selectionStart" in (n = Zn) && Xo(n) ? n = { start: n.selectionStart, end: n.selectionEnd } : n = { anchorNode: (n = (n.ownerDocument && n.ownerDocument.defaultView || window).getSelection()).anchorNode, anchorOffset: n.anchorOffset, focusNode: n.focusNode, focusOffset: n.focusOffset }, kn && gr(kn, n) ? null : (kn = n, (e = an.getPooled(ii.select, ao, e, t)).type = "select", e.target = Zn, jr(e), e));
        }
        var rc = { eventTypes: ii, extractEvents: function(e, t, n, r, i, p) {
          if (!(p = !(i = p || (r.window === r ? r.document : r.nodeType === 9 ? r : r.ownerDocument)))) {
            e: {
              i = un(i), p = se.onSelect;
              for (var w = 0; w < p.length; w++) if (!i.has(p[w])) {
                i = !1;
                break e;
              }
              i = !0;
            }
            p = !i;
          }
          if (p) return null;
          switch (i = t ? Gn(t) : window, e) {
            case "focus":
              (Fe(i) || i.contentEditable === "true") && (Zn = i, ao = t, kn = null);
              break;
            case "blur":
              kn = ao = Zn = null;
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
            case Vt:
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
        if (M) throw Error(m(101));
        M = Array.prototype.slice.call("ResponderEventPlugin SimpleEventPlugin EnterLeaveEventPlugin ChangeEventPlugin SelectEventPlugin BeforeInputEventPlugin".split(" ")), R(), K = ni, j = oo, B = Gn, le({ SimpleEventPlugin: hc, EnterLeaveEventPlugin: Mo, ChangeEventPlugin: zr, SelectEventPlugin: rc, BeforeInputEventPlugin: Ke });
        var Ma = [], jo = -1;
        function vt(e) {
          0 > jo || (e.current = Ma[jo], Ma[jo] = null, jo--);
        }
        function St(e, t) {
          jo++, Ma[jo] = e.current, e.current = t;
        }
        var Fr = {}, Xt = { current: Fr }, pn = { current: !1 }, lo = Fr;
        function zo(e, t) {
          var n = e.type.contextTypes;
          if (!n) return Fr;
          var r = e.stateNode;
          if (r && r.__reactInternalMemoizedUnmaskedChildContext === t) return r.__reactInternalMemoizedMaskedChildContext;
          var i, p = {};
          for (i in n) p[i] = t[i];
          return r && ((e = e.stateNode).__reactInternalMemoizedUnmaskedChildContext = t, e.__reactInternalMemoizedMaskedChildContext = p), p;
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
        var mc = x.unstable_runWithPriority, Ia = x.unstable_scheduleCallback, Rs = x.unstable_cancelCallback, As = x.unstable_requestPaint, ja = x.unstable_now, gc = x.unstable_getCurrentPriorityLevel, Bi = x.unstable_ImmediatePriority, Ms = x.unstable_UserBlockingPriority, Is = x.unstable_NormalPriority, js = x.unstable_LowPriority, zs = x.unstable_IdlePriority, Ls = {}, bc = x.unstable_shouldYield, yc = As !== void 0 ? As : function() {
        }, br = null, Vi = null, za = !1, Us = ja(), jn = 1e4 > Us ? ja : function() {
          return ja() - Us;
        };
        function Wi() {
          switch (gc()) {
            case Bi:
              return 99;
            case Ms:
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
              return Ms;
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
        function Vs(e) {
          return br === null ? (br = [e], Vi = Ia(Bi, Ws)) : br.push(e), Ls;
        }
        function Jn() {
          if (Vi !== null) {
            var e = Vi;
            Vi = null, Rs(e);
          }
          Ws();
        }
        function Ws() {
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
              throw br !== null && (br = br.slice(e + 1)), Ia(Bi, Jn), n;
            } finally {
              za = !1;
            }
          }
        }
        function Hi(e, t, n) {
          return 1073741821 - (1 + ((1073741821 - e + t / 10) / (n /= 10) | 0)) * n;
        }
        function $n(e, t) {
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
        function Hs(e, t) {
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
          Yi = e, qi = Lo = null, (e = e.dependencies) !== null && e.firstContext !== null && (e.expirationTime >= t && (tr = !0), e.firstContext = null);
        }
        function zn(e, t) {
          if (qi !== e && t !== !1 && t !== 0) if (typeof t == "number" && t !== 1073741823 || (qi = e, t = 1073741823), t = { context: e, observedBits: t, next: null }, Lo === null) {
            if (Yi === null) throw Error(m(308));
            Lo = t, Yi.dependencies = { expirationTime: 0, firstContext: t, responders: null };
          } else Lo = Lo.next = t;
          return e._currentValue;
        }
        var Vr = !1;
        function Fa(e) {
          e.updateQueue = { baseState: e.memoizedState, baseQueue: null, shared: { pending: null }, effects: null };
        }
        function Ba(e, t) {
          e = e.updateQueue, t.updateQueue === e && (t.updateQueue = { baseState: e.baseState, baseQueue: e.baseQueue, shared: e.shared, effects: e.effects });
        }
        function Wr(e, t) {
          return (e = { expirationTime: e, suspenseConfig: t, tag: 0, payload: null, callback: null, next: null }).next = e;
        }
        function Hr(e, t) {
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
          Vr = !1;
          var p = i.baseQueue, w = i.shared.pending;
          if (w !== null) {
            if (p !== null) {
              var S = p.next;
              p.next = w.next, w.next = S;
            }
            p = w, i.shared.pending = null, (S = e.alternate) !== null && (S = S.updateQueue) !== null && (S.baseQueue = w);
          }
          if (p !== null) {
            S = p.next;
            var Z = i.baseState, q = 0, ge = null, De = null, We = null;
            if (S !== null) for (var ot = S; ; ) {
              if ((w = ot.expirationTime) < r) {
                var Fn = { expirationTime: ot.expirationTime, suspenseConfig: ot.suspenseConfig, tag: ot.tag, payload: ot.payload, callback: ot.callback, next: null };
                We === null ? (De = We = Fn, ge = Z) : We = We.next = Fn, w > q && (q = w);
              } else {
                We !== null && (We = We.next = { expirationTime: 1073741823, suspenseConfig: ot.suspenseConfig, tag: ot.tag, payload: ot.payload, callback: ot.callback, next: null }), Fl(w, ot.suspenseConfig);
                e: {
                  var ln = e, re = ot;
                  switch (w = t, Fn = n, re.tag) {
                    case 1:
                      if (typeof (ln = re.payload) == "function") {
                        Z = ln.call(Fn, Z, w);
                        break e;
                      }
                      Z = ln;
                      break e;
                    case 3:
                      ln.effectTag = -4097 & ln.effectTag | 64;
                    case 0:
                      if ((w = typeof (ln = re.payload) == "function" ? ln.call(Fn, Z, w) : ln) == null) break e;
                      Z = o({}, Z, w);
                      break e;
                    case 2:
                      Vr = !0;
                  }
                }
                ot.callback !== null && (e.effectTag |= 32, (w = i.effects) === null ? i.effects = [ot] : w.push(ot));
              }
              if ((ot = ot.next) === null || ot === S) {
                if ((w = i.shared.pending) === null) break;
                ot = p.next = w.next, w.next = S, i.baseQueue = p = w, i.shared.pending = null;
              }
            }
            We === null ? ge = Z : We.next = De, i.baseState = ge, i.baseQueue = We, va(q), e.expirationTime = q, e.memoizedState = Z;
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
        var si = he.ReactCurrentBatchConfig, qs = new c.Component().refs;
        function Ki(e, t, n, r) {
          n = (n = n(r, t = e.memoizedState)) == null ? t : o({}, t, n), e.memoizedState = n, e.expirationTime === 0 && (e.updateQueue.baseState = n);
        }
        var Qi = { isMounted: function(e) {
          return !!(e = e._reactInternalFiber) && Pn(e) === e;
        }, enqueueSetState: function(e, t, n) {
          e = e._reactInternalFiber;
          var r = nr(), i = si.suspense;
          (i = Wr(r = mo(r, e, i), i)).payload = t, n != null && (i.callback = n), Hr(e, i), Kr(e, r);
        }, enqueueReplaceState: function(e, t, n) {
          e = e._reactInternalFiber;
          var r = nr(), i = si.suspense;
          (i = Wr(r = mo(r, e, i), i)).tag = 1, i.payload = t, n != null && (i.callback = n), Hr(e, i), Kr(e, r);
        }, enqueueForceUpdate: function(e, t) {
          e = e._reactInternalFiber;
          var n = nr(), r = si.suspense;
          (r = Wr(n = mo(n, e, r), r)).tag = 2, t != null && (r.callback = t), Hr(e, r), Kr(e, n);
        } };
        function Ks(e, t, n, r, i, p, w) {
          return typeof (e = e.stateNode).shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, p, w) : !t.prototype || !t.prototype.isPureReactComponent || !gr(n, r) || !gr(i, p);
        }
        function Qs(e, t, n) {
          var r = !1, i = Fr, p = t.contextType;
          return typeof p == "object" && p !== null ? p = zn(p) : (i = hn(t) ? lo : Xt.current, p = (r = (r = t.contextTypes) != null) ? zo(e, i) : Fr), t = new t(n, p), e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null, t.updater = Qi, e.stateNode = t, t._reactInternalFiber = e, r && ((e = e.stateNode).__reactInternalMemoizedUnmaskedChildContext = i, e.__reactInternalMemoizedMaskedChildContext = p), t;
        }
        function Gs(e, t, n, r) {
          e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, r), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, r), t.state !== e && Qi.enqueueReplaceState(t, t.state, null);
        }
        function Va(e, t, n, r) {
          var i = e.stateNode;
          i.props = n, i.state = e.memoizedState, i.refs = qs, Fa(e);
          var p = t.contextType;
          typeof p == "object" && p !== null ? i.context = zn(p) : (p = hn(t) ? lo : Xt.current, i.context = zo(e, p)), ai(e, n, i, r), i.state = e.memoizedState, typeof (p = t.getDerivedStateFromProps) == "function" && (Ki(e, t, p, n), i.state = e.memoizedState), typeof t.getDerivedStateFromProps == "function" || typeof i.getSnapshotBeforeUpdate == "function" || typeof i.UNSAFE_componentWillMount != "function" && typeof i.componentWillMount != "function" || (t = i.state, typeof i.componentWillMount == "function" && i.componentWillMount(), typeof i.UNSAFE_componentWillMount == "function" && i.UNSAFE_componentWillMount(), t !== i.state && Qi.enqueueReplaceState(i, i.state, null), ai(e, n, i, r), i.state = e.memoizedState), typeof i.componentDidMount == "function" && (e.effectTag |= 4);
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
              return t !== null && t.ref !== null && typeof t.ref == "function" && t.ref._stringRef === i ? t.ref : ((t = function(p) {
                var w = r.refs;
                w === qs && (w = r.refs = {}), p === null ? delete w[i] : w[i] = p;
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
          function p(re, ee, ue) {
            return re.index = ue, e ? (ue = re.alternate) !== null ? (ue = ue.index) < ee ? (re.effectTag = 2, ee) : ue : (re.effectTag = 2, ee) : ee;
          }
          function w(re) {
            return e && re.alternate === null && (re.effectTag = 2), re;
          }
          function S(re, ee, ue, ve) {
            return ee === null || ee.tag !== 6 ? ((ee = ys(ue, re.mode, ve)).return = re, ee) : ((ee = i(ee, ue)).return = re, ee);
          }
          function Z(re, ee, ue, ve) {
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
                case He:
                  return (ue = wa(ee.type, ee.key, ee.props, null, re.mode, ue)).ref = li(re, null, ee), ue.return = re, ue;
                case At:
                  return (ee = vs(ee, re.mode, ue)).return = re, ee;
              }
              if (Gi(ee) || en(ee)) return (ee = Qr(ee, re.mode, ue, null)).return = re, ee;
              Xi(re, ee);
            }
            return null;
          }
          function We(re, ee, ue, ve) {
            var _e = ee !== null ? ee.key : null;
            if (typeof ue == "string" || typeof ue == "number") return _e !== null ? null : S(re, ee, "" + ue, ve);
            if (typeof ue == "object" && ue !== null) {
              switch (ue.$$typeof) {
                case He:
                  return ue.key === _e ? ue.type === wt ? ge(re, ee, ue.props.children, ve, _e) : Z(re, ee, ue, ve) : null;
                case At:
                  return ue.key === _e ? q(re, ee, ue, ve) : null;
              }
              if (Gi(ue) || en(ue)) return _e !== null ? null : ge(re, ee, ue, ve, null);
              Xi(re, ue);
            }
            return null;
          }
          function ot(re, ee, ue, ve, _e) {
            if (typeof ve == "string" || typeof ve == "number") return S(ee, re = re.get(ue) || null, "" + ve, _e);
            if (typeof ve == "object" && ve !== null) {
              switch (ve.$$typeof) {
                case He:
                  return re = re.get(ve.key === null ? ue : ve.key) || null, ve.type === wt ? ge(ee, re, ve.props.children, _e, ve.key) : Z(ee, re, ve, _e);
                case At:
                  return q(ee, re = re.get(ve.key === null ? ue : ve.key) || null, ve, _e);
              }
              if (Gi(ve) || en(ve)) return ge(ee, re = re.get(ue) || null, ve, _e, null);
              Xi(ee, ve);
            }
            return null;
          }
          function Fn(re, ee, ue, ve) {
            for (var _e = null, Oe = null, Be = ee, at = ee = 0, Rt = null; Be !== null && at < ue.length; at++) {
              Be.index > at ? (Rt = Be, Be = null) : Rt = Be.sibling;
              var Ze = We(re, Be, ue[at], ve);
              if (Ze === null) {
                Be === null && (Be = Rt);
                break;
              }
              e && Be && Ze.alternate === null && t(re, Be), ee = p(Ze, ee, at), Oe === null ? _e = Ze : Oe.sibling = Ze, Oe = Ze, Be = Rt;
            }
            if (at === ue.length) return n(re, Be), _e;
            if (Be === null) {
              for (; at < ue.length; at++) (Be = De(re, ue[at], ve)) !== null && (ee = p(Be, ee, at), Oe === null ? _e = Be : Oe.sibling = Be, Oe = Be);
              return _e;
            }
            for (Be = r(re, Be); at < ue.length; at++) (Rt = ot(Be, re, at, ue[at], ve)) !== null && (e && Rt.alternate !== null && Be.delete(Rt.key === null ? at : Rt.key), ee = p(Rt, ee, at), Oe === null ? _e = Rt : Oe.sibling = Rt, Oe = Rt);
            return e && Be.forEach(function(Bt) {
              return t(re, Bt);
            }), _e;
          }
          function ln(re, ee, ue, ve) {
            var _e = en(ue);
            if (typeof _e != "function") throw Error(m(150));
            if ((ue = _e.call(ue)) == null) throw Error(m(151));
            for (var Oe = _e = null, Be = ee, at = ee = 0, Rt = null, Ze = ue.next(); Be !== null && !Ze.done; at++, Ze = ue.next()) {
              Be.index > at ? (Rt = Be, Be = null) : Rt = Be.sibling;
              var Bt = We(re, Be, Ze.value, ve);
              if (Bt === null) {
                Be === null && (Be = Rt);
                break;
              }
              e && Be && Bt.alternate === null && t(re, Be), ee = p(Bt, ee, at), Oe === null ? _e = Bt : Oe.sibling = Bt, Oe = Bt, Be = Rt;
            }
            if (Ze.done) return n(re, Be), _e;
            if (Be === null) {
              for (; !Ze.done; at++, Ze = ue.next()) (Ze = De(re, Ze.value, ve)) !== null && (ee = p(Ze, ee, at), Oe === null ? _e = Ze : Oe.sibling = Ze, Oe = Ze);
              return _e;
            }
            for (Be = r(re, Be); !Ze.done; at++, Ze = ue.next()) (Ze = ot(Be, re, at, Ze.value, ve)) !== null && (e && Ze.alternate !== null && Be.delete(Ze.key === null ? at : Ze.key), ee = p(Ze, ee, at), Oe === null ? _e = Ze : Oe.sibling = Ze, Oe = Ze);
            return e && Be.forEach(function(kr) {
              return t(re, kr);
            }), _e;
          }
          return function(re, ee, ue, ve) {
            var _e = typeof ue == "object" && ue !== null && ue.type === wt && ue.key === null;
            _e && (ue = ue.props.children);
            var Oe = typeof ue == "object" && ue !== null;
            if (Oe) switch (ue.$$typeof) {
              case He:
                e: {
                  for (Oe = ue.key, _e = ee; _e !== null; ) {
                    if (_e.key === Oe) {
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
                return w(re);
              case At:
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
                return w(re);
            }
            if (typeof ue == "string" || typeof ue == "number") return ue = "" + ue, ee !== null && ee.tag === 6 ? (n(re, ee.sibling), (ee = i(ee, ue)).return = re, re = ee) : (n(re, ee), (ee = ys(ue, re.mode, ve)).return = re, re = ee), w(re);
            if (Gi(ue)) return Fn(re, ee, ue, ve);
            if (en(ue)) return ln(re, ee, ue, ve);
            if (Oe && Xi(re, ue), ue === void 0 && !_e) switch (re.tag) {
              case 1:
              case 0:
                throw re = re.type, Error(m(152, re.displayName || re.name || "Component"));
            }
            return n(re, ee);
          };
        }
        var Fo = Xs(!0), Wa = Xs(!1), ci = {}, er = { current: ci }, ui = { current: ci }, fi = { current: ci };
        function co(e) {
          if (e === ci) throw Error(m(174));
          return e;
        }
        function Ha(e, t) {
          switch (St(fi, t), St(ui, e), St(er, ci), e = t.nodeType) {
            case 9:
            case 11:
              t = (t = t.documentElement) ? t.namespaceURI : Se(null, "");
              break;
            default:
              t = Se(t = (e = e === 8 ? t.parentNode : t).namespaceURI || null, e = e.tagName);
          }
          vt(er), St(er, t);
        }
        function Bo() {
          vt(er), vt(ui), vt(fi);
        }
        function Zs(e) {
          co(fi.current);
          var t = co(er.current), n = Se(t, e.type);
          t !== n && (St(ui, e), St(er, n));
        }
        function $a(e) {
          ui.current === e && (vt(er), vt(ui));
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
        function Ka(e, t, n, r, i, p) {
          if ($r = p, Lt = t, t.memoizedState = null, t.updateQueue = null, t.expirationTime = 0, Ji.current = e === null || e.memoizedState === null ? vc : wc, e = n(r, i), t.expirationTime === $r) {
            p = 0;
            do {
              if (t.expirationTime = 0, !(25 > p)) throw Error(m(301));
              p += 1, Zt = sn = null, t.updateQueue = null, Ji.current = kc, e = n(r, i);
            } while (t.expirationTime === $r);
          }
          if (Ji.current = ia, t = sn !== null && sn.next !== null, $r = 0, Zt = sn = Lt = null, ea = !1, t) throw Error(m(300));
          return e;
        }
        function Vo() {
          var e = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
          return Zt === null ? Lt.memoizedState = Zt = e : Zt = Zt.next = e, Zt;
        }
        function Wo() {
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
          var t = Wo(), n = t.queue;
          if (n === null) throw Error(m(311));
          n.lastRenderedReducer = e;
          var r = sn, i = r.baseQueue, p = n.pending;
          if (p !== null) {
            if (i !== null) {
              var w = i.next;
              i.next = p.next, p.next = w;
            }
            r.baseQueue = i = p, n.pending = null;
          }
          if (i !== null) {
            i = i.next, r = r.baseState;
            var S = w = p = null, Z = i;
            do {
              var q = Z.expirationTime;
              if (q < $r) {
                var ge = { expirationTime: Z.expirationTime, suspenseConfig: Z.suspenseConfig, action: Z.action, eagerReducer: Z.eagerReducer, eagerState: Z.eagerState, next: null };
                S === null ? (w = S = ge, p = r) : S = S.next = ge, q > Lt.expirationTime && (Lt.expirationTime = q, va(q));
              } else S !== null && (S = S.next = { expirationTime: 1073741823, suspenseConfig: Z.suspenseConfig, action: Z.action, eagerReducer: Z.eagerReducer, eagerState: Z.eagerState, next: null }), Fl(q, Z.suspenseConfig), r = Z.eagerReducer === e ? Z.eagerState : e(r, Z.action);
              Z = Z.next;
            } while (Z !== null && Z !== i);
            S === null ? p = r : S.next = w, mr(r, t.memoizedState) || (tr = !0), t.memoizedState = r, t.baseState = p, t.baseQueue = S, n.lastRenderedState = r;
          }
          return [t.memoizedState, n.dispatch];
        }
        function na(e) {
          var t = Wo(), n = t.queue;
          if (n === null) throw Error(m(311));
          n.lastRenderedReducer = e;
          var r = n.dispatch, i = n.pending, p = t.memoizedState;
          if (i !== null) {
            n.pending = null;
            var w = i = i.next;
            do
              p = e(p, w.action), w = w.next;
            while (w !== i);
            mr(p, t.memoizedState) || (tr = !0), t.memoizedState = p, t.baseQueue === null && (t.baseState = p), n.lastRenderedState = p;
          }
          return [p, r];
        }
        function Qa(e) {
          var t = Vo();
          return typeof e == "function" && (e = e()), t.memoizedState = t.baseState = e, e = (e = t.queue = { pending: null, dispatch: null, lastRenderedReducer: uo, lastRenderedState: e }).dispatch = al.bind(null, Lt, e), [t.memoizedState, e];
        }
        function Ga(e, t, n, r) {
          return e = { tag: e, create: t, destroy: n, deps: r, next: null }, (t = Lt.updateQueue) === null ? (t = { lastEffect: null }, Lt.updateQueue = t, t.lastEffect = e.next = e) : (n = t.lastEffect) === null ? t.lastEffect = e.next = e : (r = n.next, n.next = e, e.next = r, t.lastEffect = e), e;
        }
        function Js() {
          return Wo().memoizedState;
        }
        function Xa(e, t, n, r) {
          var i = Vo();
          Lt.effectTag |= e, i.memoizedState = Ga(1 | t, n, void 0, r === void 0 ? null : r);
        }
        function Za(e, t, n, r) {
          var i = Wo();
          r = r === void 0 ? null : r;
          var p = void 0;
          if (sn !== null) {
            var w = sn.memoizedState;
            if (p = w.destroy, r !== null && qa(r, w.deps)) return void Ga(t, n, p, r);
          }
          Lt.effectTag |= e, i.memoizedState = Ga(1 | t, n, p, r);
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
          return Vo().memoizedState = [e, t === void 0 ? null : t], e;
        }
        function oa(e, t) {
          var n = Wo();
          t = t === void 0 ? null : t;
          var r = n.memoizedState;
          return r !== null && t !== null && qa(t, r[1]) ? r[0] : (n.memoizedState = [e, t], e);
        }
        function il(e, t) {
          var n = Wo();
          t = t === void 0 ? null : t;
          var r = n.memoizedState;
          return r !== null && t !== null && qa(t, r[1]) ? r[0] : (e = e(), n.memoizedState = [e, t], e);
        }
        function es(e, t, n) {
          var r = Wi();
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
          var r = nr(), i = si.suspense;
          i = { expirationTime: r = mo(r, e, i), suspenseConfig: i, action: n, eagerReducer: null, eagerState: null, next: null };
          var p = t.pending;
          if (p === null ? i.next = i : (i.next = p.next, p.next = i), t.pending = i, p = e.alternate, e === Lt || p !== null && p === Lt) ea = !0, i.expirationTime = $r, Lt.expirationTime = $r;
          else {
            if (e.expirationTime === 0 && (p === null || p.expirationTime === 0) && (p = t.lastRenderedReducer) !== null) try {
              var w = t.lastRenderedState, S = p(w, n);
              if (i.eagerReducer = p, i.eagerState = S, mr(S, w)) return;
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
          var n = Vo();
          return t = t === void 0 ? null : t, e = e(), n.memoizedState = [e, t], e;
        }, useReducer: function(e, t, n) {
          var r = Vo();
          return t = n !== void 0 ? n(t) : t, r.memoizedState = r.baseState = t, e = (e = r.queue = { pending: null, dispatch: null, lastRenderedReducer: e, lastRenderedState: t }).dispatch = al.bind(null, Lt, e), [r.memoizedState, e];
        }, useRef: function(e) {
          return e = { current: e }, Vo().memoizedState = e;
        }, useState: Qa, useDebugValue: Ja, useResponder: Ya, useDeferredValue: function(e, t) {
          var n = Qa(e), r = n[0], i = n[1];
          return el(function() {
            var p = Ln.suspense;
            Ln.suspense = t === void 0 ? null : t;
            try {
              i(e);
            } finally {
              Ln.suspense = p;
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
            var p = Ln.suspense;
            Ln.suspense = t === void 0 ? null : t;
            try {
              i(e);
            } finally {
              Ln.suspense = p;
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
            var p = Ln.suspense;
            Ln.suspense = t === void 0 ? null : t;
            try {
              i(e);
            } finally {
              Ln.suspense = p;
            }
          }, [e, t]), r;
        }, useTransition: function(e) {
          var t = na(uo), n = t[0];
          return t = t[1], [oa(es.bind(null, t, e), [t, e]), n];
        } }, yr = null, Yr = null, fo = !1;
        function sl(e, t) {
          var n = rr(5, null, null, 0);
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
                if (!(t = Mr(n.nextSibling)) || !ll(e, t)) return e.effectTag = -1025 & e.effectTag | 2, fo = !1, void (yr = e);
                sl(yr, n);
              }
              yr = e, Yr = Mr(t.firstChild);
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
          if (e.tag !== 5 || t !== "head" && t !== "body" && !ei(t, e.memoizedProps)) for (t = Yr; t; ) sl(e, t), t = Mr(t.nextSibling);
          if (cl(e), e.tag === 13) {
            if (!(e = (e = e.memoizedState) !== null ? e.dehydrated : null)) throw Error(m(317));
            e: {
              for (e = e.nextSibling, t = 0; e; ) {
                if (e.nodeType === 8) {
                  var n = e.data;
                  if (n === "/$") {
                    if (t === 0) {
                      Yr = Mr(e.nextSibling);
                      break e;
                    }
                    t--;
                  } else n !== "$" && n !== "$!" && n !== "$?" || t++;
                }
                e = e.nextSibling;
              }
              Yr = null;
            }
          } else Yr = yr ? Mr(e.stateNode.nextSibling) : null;
          return !0;
        }
        function ns() {
          Yr = yr = null, fo = !1;
        }
        var Ec = he.ReactCurrentOwner, tr = !1;
        function Un(e, t, n, r) {
          t.child = e === null ? Wa(t, null, n, r) : Fo(t, e.child, n, r);
        }
        function ul(e, t, n, r, i) {
          n = n.render;
          var p = t.ref;
          return Uo(t, i), r = Ka(e, t, n, r, p, i), e === null || tr ? (t.effectTag |= 1, Un(e, t, r, i), t.child) : (t.updateQueue = e.updateQueue, t.effectTag &= -517, e.expirationTime <= i && (e.expirationTime = 0), vr(e, t, i));
        }
        function fl(e, t, n, r, i, p) {
          if (e === null) {
            var w = n.type;
            return typeof w != "function" || bs(w) || w.defaultProps !== void 0 || n.compare !== null || n.defaultProps !== void 0 ? ((e = wa(n.type, null, r, null, t.mode, p)).ref = t.ref, e.return = t, t.child = e) : (t.tag = 15, t.type = w, dl(e, t, w, r, i, p));
          }
          return w = e.child, i < p && (i = w.memoizedProps, (n = (n = n.compare) !== null ? n : gr)(i, r) && e.ref === t.ref) ? vr(e, t, p) : (t.effectTag |= 1, (e = vo(w, r)).ref = t.ref, e.return = t, t.child = e);
        }
        function dl(e, t, n, r, i, p) {
          return e !== null && gr(e.memoizedProps, r) && e.ref === t.ref && (tr = !1, i < p) ? (t.expirationTime = e.expirationTime, vr(e, t, p)) : rs(e, t, n, r, p);
        }
        function pl(e, t) {
          var n = t.ref;
          (e === null && n !== null || e !== null && e.ref !== n) && (t.effectTag |= 128);
        }
        function rs(e, t, n, r, i) {
          var p = hn(n) ? lo : Xt.current;
          return p = zo(t, p), Uo(t, i), n = Ka(e, t, n, r, p, i), e === null || tr ? (t.effectTag |= 1, Un(e, t, n, i), t.child) : (t.updateQueue = e.updateQueue, t.effectTag &= -517, e.expirationTime <= i && (e.expirationTime = 0), vr(e, t, i));
        }
        function hl(e, t, n, r, i) {
          if (hn(n)) {
            var p = !0;
            Fi(t);
          } else p = !1;
          if (Uo(t, i), t.stateNode === null) e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= 2), Qs(t, n, r), Va(t, n, r, i), r = !0;
          else if (e === null) {
            var w = t.stateNode, S = t.memoizedProps;
            w.props = S;
            var Z = w.context, q = n.contextType;
            typeof q == "object" && q !== null ? q = zn(q) : q = zo(t, q = hn(n) ? lo : Xt.current);
            var ge = n.getDerivedStateFromProps, De = typeof ge == "function" || typeof w.getSnapshotBeforeUpdate == "function";
            De || typeof w.UNSAFE_componentWillReceiveProps != "function" && typeof w.componentWillReceiveProps != "function" || (S !== r || Z !== q) && Gs(t, w, r, q), Vr = !1;
            var We = t.memoizedState;
            w.state = We, ai(t, r, w, i), Z = t.memoizedState, S !== r || We !== Z || pn.current || Vr ? (typeof ge == "function" && (Ki(t, n, ge, r), Z = t.memoizedState), (S = Vr || Ks(t, n, S, r, We, Z, q)) ? (De || typeof w.UNSAFE_componentWillMount != "function" && typeof w.componentWillMount != "function" || (typeof w.componentWillMount == "function" && w.componentWillMount(), typeof w.UNSAFE_componentWillMount == "function" && w.UNSAFE_componentWillMount()), typeof w.componentDidMount == "function" && (t.effectTag |= 4)) : (typeof w.componentDidMount == "function" && (t.effectTag |= 4), t.memoizedProps = r, t.memoizedState = Z), w.props = r, w.state = Z, w.context = q, r = S) : (typeof w.componentDidMount == "function" && (t.effectTag |= 4), r = !1);
          } else w = t.stateNode, Ba(e, t), S = t.memoizedProps, w.props = t.type === t.elementType ? S : $n(t.type, S), Z = w.context, typeof (q = n.contextType) == "object" && q !== null ? q = zn(q) : q = zo(t, q = hn(n) ? lo : Xt.current), (De = typeof (ge = n.getDerivedStateFromProps) == "function" || typeof w.getSnapshotBeforeUpdate == "function") || typeof w.UNSAFE_componentWillReceiveProps != "function" && typeof w.componentWillReceiveProps != "function" || (S !== r || Z !== q) && Gs(t, w, r, q), Vr = !1, Z = t.memoizedState, w.state = Z, ai(t, r, w, i), We = t.memoizedState, S !== r || Z !== We || pn.current || Vr ? (typeof ge == "function" && (Ki(t, n, ge, r), We = t.memoizedState), (ge = Vr || Ks(t, n, S, r, Z, We, q)) ? (De || typeof w.UNSAFE_componentWillUpdate != "function" && typeof w.componentWillUpdate != "function" || (typeof w.componentWillUpdate == "function" && w.componentWillUpdate(r, We, q), typeof w.UNSAFE_componentWillUpdate == "function" && w.UNSAFE_componentWillUpdate(r, We, q)), typeof w.componentDidUpdate == "function" && (t.effectTag |= 4), typeof w.getSnapshotBeforeUpdate == "function" && (t.effectTag |= 256)) : (typeof w.componentDidUpdate != "function" || S === e.memoizedProps && Z === e.memoizedState || (t.effectTag |= 4), typeof w.getSnapshotBeforeUpdate != "function" || S === e.memoizedProps && Z === e.memoizedState || (t.effectTag |= 256), t.memoizedProps = r, t.memoizedState = We), w.props = r, w.state = We, w.context = q, r = ge) : (typeof w.componentDidUpdate != "function" || S === e.memoizedProps && Z === e.memoizedState || (t.effectTag |= 4), typeof w.getSnapshotBeforeUpdate != "function" || S === e.memoizedProps && Z === e.memoizedState || (t.effectTag |= 256), r = !1);
          return os(e, t, n, r, p, i);
        }
        function os(e, t, n, r, i, p) {
          pl(e, t);
          var w = (64 & t.effectTag) != 0;
          if (!r && !w) return i && Ds(t, n, !1), vr(e, t, p);
          r = t.stateNode, Ec.current = t;
          var S = w && typeof n.getDerivedStateFromError != "function" ? null : r.render();
          return t.effectTag |= 1, e !== null && w ? (t.child = Fo(t, e.child, null, p), t.child = Fo(t, null, S, p)) : Un(e, t, S, p), t.memoizedState = r.state, i && Ds(t, n, !0), t.child;
        }
        function ml(e) {
          var t = e.stateNode;
          t.pendingContext ? Ns(0, t.pendingContext, t.pendingContext !== t.context) : t.context && Ns(0, t.context, !1), Ha(e, t.containerInfo);
        }
        var gl, bl, yl, is = { dehydrated: null, retryTime: 0 };
        function vl(e, t, n) {
          var r, i = t.mode, p = t.pendingProps, w = Ct.current, S = !1;
          if ((r = (64 & t.effectTag) != 0) || (r = (2 & w) != 0 && (e === null || e.memoizedState !== null)), r ? (S = !0, t.effectTag &= -65) : e !== null && e.memoizedState === null || p.fallback === void 0 || p.unstable_avoidThisFallback === !0 || (w |= 1), St(Ct, 1 & w), e === null) {
            if (p.fallback !== void 0 && ts(t), S) {
              if (S = p.fallback, (p = Qr(null, i, 0, null)).return = t, (2 & t.mode) == 0) for (e = t.memoizedState !== null ? t.child.child : t.child, p.child = e; e !== null; ) e.return = p, e = e.sibling;
              return (n = Qr(S, i, n, null)).return = t, p.sibling = n, t.memoizedState = is, t.child = p, n;
            }
            return i = p.children, t.memoizedState = null, t.child = Wa(t, null, i, n);
          }
          if (e.memoizedState !== null) {
            if (i = (e = e.child).sibling, S) {
              if (p = p.fallback, (n = vo(e, e.pendingProps)).return = t, (2 & t.mode) == 0 && (S = t.memoizedState !== null ? t.child.child : t.child) !== e.child) for (n.child = S; S !== null; ) S.return = n, S = S.sibling;
              return (i = vo(i, p)).return = t, n.sibling = i, n.childExpirationTime = 0, t.memoizedState = is, t.child = n, i;
            }
            return n = Fo(t, e.child, p.children, n), t.memoizedState = null, t.child = n;
          }
          if (e = e.child, S) {
            if (S = p.fallback, (p = Qr(null, i, 0, null)).return = t, p.child = e, e !== null && (e.return = p), (2 & t.mode) == 0) for (e = t.memoizedState !== null ? t.child.child : t.child, p.child = e; e !== null; ) e.return = p, e = e.sibling;
            return (n = Qr(S, i, n, null)).return = t, p.sibling = n, n.effectTag |= 2, p.childExpirationTime = 0, t.memoizedState = is, t.child = p, n;
          }
          return t.memoizedState = null, t.child = Fo(t, e, p.children, n);
        }
        function wl(e, t) {
          e.expirationTime < t && (e.expirationTime = t);
          var n = e.alternate;
          n !== null && n.expirationTime < t && (n.expirationTime = t), Hs(e.return, t);
        }
        function as(e, t, n, r, i, p) {
          var w = e.memoizedState;
          w === null ? e.memoizedState = { isBackwards: t, rendering: null, renderingStartTime: 0, last: r, tail: n, tailExpiration: 0, tailMode: i, lastEffect: p } : (w.isBackwards = t, w.rendering = null, w.renderingStartTime = 0, w.last = r, w.tail = n, w.tailExpiration = 0, w.tailMode = i, w.lastEffect = p);
        }
        function kl(e, t, n) {
          var r = t.pendingProps, i = r.revealOrder, p = r.tail;
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
              (n = i) === null ? (i = t.child, t.child = null) : (i = n.sibling, n.sibling = null), as(t, !1, i, n, p, t.lastEffect);
              break;
            case "backwards":
              for (n = null, i = t.child, t.child = null; i !== null; ) {
                if ((e = i.alternate) !== null && Zi(e) === null) {
                  t.child = i;
                  break;
                }
                e = i.sibling, i.sibling = n, n = i, i = e;
              }
              as(t, !0, n, null, p, t.lastEffect);
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
                if (e = co(er.current), aa(t)) {
                  r = t.stateNode, i = t.type;
                  var p = t.memoizedProps;
                  switch (r[Qn] = t, r[no] = p, i) {
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
                      bn(r, p), mt("invalid", r), Wn(n, "onChange");
                      break;
                    case "select":
                      r._wrapperState = { wasMultiple: !!p.multiple }, mt("invalid", r), Wn(n, "onChange");
                      break;
                    case "textarea":
                      On(r, p), mt("invalid", r), Wn(n, "onChange");
                  }
                  for (var w in Ko(i, p), e = null, p) if (p.hasOwnProperty(w)) {
                    var S = p[w];
                    w === "children" ? typeof S == "string" ? r.textContent !== S && (e = ["children", S]) : typeof S == "number" && r.textContent !== "" + S && (e = ["children", "" + S]) : A.hasOwnProperty(w) && S != null && Wn(n, w);
                  }
                  switch (i) {
                    case "input":
                      Sr(r), ar(r, p, !0);
                      break;
                    case "textarea":
                      Sr(r), Xr(r);
                      break;
                    case "select":
                    case "option":
                      break;
                    default:
                      typeof p.onClick == "function" && (r.onclick = Oo);
                  }
                  n = e, t.updateQueue = n, n !== null && (t.effectTag |= 4);
                } else {
                  switch (w = n.nodeType === 9 ? n : n.ownerDocument, e === Ci && (e = we(i)), e === Ci ? i === "script" ? ((e = w.createElement("div")).innerHTML = "<script><\/script>", e = e.removeChild(e.firstChild)) : typeof r.is == "string" ? e = w.createElement(i, { is: r.is }) : (e = w.createElement(i), i === "select" && (w = e, r.multiple ? w.multiple = !0 : r.size && (w.size = r.size))) : e = w.createElementNS(e, i), e[Qn] = t, e[no] = r, gl(e, t), t.stateNode = e, w = Qo(i, r), i) {
                    case "iframe":
                    case "object":
                    case "embed":
                      mt("load", e), S = r;
                      break;
                    case "video":
                    case "audio":
                      for (S = 0; S < ct.length; S++) mt(ct[S], e);
                      S = r;
                      break;
                    case "source":
                      mt("error", e), S = r;
                      break;
                    case "img":
                    case "image":
                    case "link":
                      mt("error", e), mt("load", e), S = r;
                      break;
                    case "form":
                      mt("reset", e), mt("submit", e), S = r;
                      break;
                    case "details":
                      mt("toggle", e), S = r;
                      break;
                    case "input":
                      bn(e, r), S = Cr(e, r), mt("invalid", e), Wn(n, "onChange");
                      break;
                    case "option":
                      S = sr(e, r);
                      break;
                    case "select":
                      e._wrapperState = { wasMultiple: !!r.multiple }, S = o({}, r, { value: void 0 }), mt("invalid", e), Wn(n, "onChange");
                      break;
                    case "textarea":
                      On(e, r), S = lr(e, r), mt("invalid", e), Wn(n, "onChange");
                      break;
                    default:
                      S = r;
                  }
                  Ko(i, S);
                  var Z = S;
                  for (p in Z) if (Z.hasOwnProperty(p)) {
                    var q = Z[p];
                    p === "style" ? xi(e, q) : p === "dangerouslySetInnerHTML" ? (q = q ? q.__html : void 0) != null && qe(e, q) : p === "children" ? typeof q == "string" ? (i !== "textarea" || q !== "") && st(e, q) : typeof q == "number" && st(e, "" + q) : p !== "suppressContentEditableWarning" && p !== "suppressHydrationWarning" && p !== "autoFocus" && (A.hasOwnProperty(p) ? q != null && Wn(n, p) : q != null && je(e, p, q, w));
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
                      typeof S.onClick == "function" && (e.onclick = Oo);
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
                n = co(fi.current), co(er.current), aa(t) ? (n = t.stateNode, r = t.memoizedProps, n[Qn] = t, n.nodeValue !== r && (t.effectTag |= 4)) : ((n = (n.nodeType === 9 ? n : n.ownerDocument).createTextNode(r))[Qn] = t, t.stateNode = n);
              }
              return null;
            case 13:
              return vt(Ct), r = t.memoizedState, 64 & t.effectTag ? (t.expirationTime = n, t) : (n = r !== null, r = !1, e === null ? t.memoizedProps.fallback !== void 0 && aa(t) : (r = (i = e.memoizedState) !== null, n || i === null || (i = e.child.sibling) !== null && ((p = t.firstEffect) !== null ? (t.firstEffect = i, i.nextEffect = p) : (t.firstEffect = t.lastEffect = i, i.nextEffect = null), i.effectTag = 8)), n && !r && 2 & t.mode && (e === null && t.memoizedProps.unstable_avoidThisFallback !== !0 || 1 & Ct.current ? Ft === po && (Ft = ca) : (Ft !== po && Ft !== ca || (Ft = ua), pi !== 0 && _n !== null && (wo(_n, mn), $l(_n, pi)))), (n || r) && (t.effectTag |= 4), null);
            case 4:
              return Bo(), null;
            case 10:
              return Ua(t), null;
            case 17:
              return hn(t.type) && Ui(), null;
            case 19:
              if (vt(Ct), (r = t.memoizedState) === null) return null;
              if (i = (64 & t.effectTag) != 0, (p = r.rendering) === null) {
                if (i) sa(r, !1);
                else if (Ft !== po || e !== null && 64 & e.effectTag) for (p = t.child; p !== null; ) {
                  if ((e = Zi(p)) !== null) {
                    for (t.effectTag |= 64, sa(r, !1), (i = e.updateQueue) !== null && (t.updateQueue = i, t.effectTag |= 4), r.lastEffect === null && (t.firstEffect = null), t.lastEffect = r.lastEffect, r = t.child; r !== null; ) p = n, (i = r).effectTag &= 2, i.nextEffect = null, i.firstEffect = null, i.lastEffect = null, (e = i.alternate) === null ? (i.childExpirationTime = 0, i.expirationTime = p, i.child = null, i.memoizedProps = null, i.memoizedState = null, i.updateQueue = null, i.dependencies = null) : (i.childExpirationTime = e.childExpirationTime, i.expirationTime = e.expirationTime, i.child = e.child, i.memoizedProps = e.memoizedProps, i.memoizedState = e.memoizedState, i.updateQueue = e.updateQueue, p = e.dependencies, i.dependencies = p === null ? null : { expirationTime: p.expirationTime, firstContext: p.firstContext, responders: p.responders }), r = r.sibling;
                    return St(Ct, 1 & Ct.current | 2), t.child;
                  }
                  p = p.sibling;
                }
              } else {
                if (!i) if ((e = Zi(p)) !== null) {
                  if (t.effectTag |= 64, i = !0, (n = e.updateQueue) !== null && (t.updateQueue = n, t.effectTag |= 4), sa(r, !0), r.tail === null && r.tailMode === "hidden" && !p.alternate) return (t = t.lastEffect = r.lastEffect) !== null && (t.nextEffect = null), null;
                } else 2 * jn() - r.renderingStartTime > r.tailExpiration && 1 < n && (t.effectTag |= 64, i = !0, sa(r, !1), t.expirationTime = t.childExpirationTime = n - 1);
                r.isBackwards ? (p.sibling = t.child, t.child = p) : ((n = r.last) !== null ? n.sibling = p : t.child = p, r.last = p);
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
          var p = e.memoizedProps;
          if (p !== r) {
            var w, S, Z = t.stateNode;
            switch (co(er.current), e = null, n) {
              case "input":
                p = Cr(Z, p), r = Cr(Z, r), e = [];
                break;
              case "option":
                p = sr(Z, p), r = sr(Z, r), e = [];
                break;
              case "select":
                p = o({}, p, { value: void 0 }), r = o({}, r, { value: void 0 }), e = [];
                break;
              case "textarea":
                p = lr(Z, p), r = lr(Z, r), e = [];
                break;
              default:
                typeof p.onClick != "function" && typeof r.onClick == "function" && (Z.onclick = Oo);
            }
            for (w in Ko(n, r), n = null, p) if (!r.hasOwnProperty(w) && p.hasOwnProperty(w) && p[w] != null) if (w === "style") for (S in Z = p[w]) Z.hasOwnProperty(S) && (n || (n = {}), n[S] = "");
            else w !== "dangerouslySetInnerHTML" && w !== "children" && w !== "suppressContentEditableWarning" && w !== "suppressHydrationWarning" && w !== "autoFocus" && (A.hasOwnProperty(w) ? e || (e = []) : (e = e || []).push(w, null));
            for (w in r) {
              var q = r[w];
              if (Z = p != null ? p[w] : void 0, r.hasOwnProperty(w) && q !== Z && (q != null || Z != null)) if (w === "style") if (Z) {
                for (S in Z) !Z.hasOwnProperty(S) || q && q.hasOwnProperty(S) || (n || (n = {}), n[S] = "");
                for (S in q) q.hasOwnProperty(S) && Z[S] !== q[S] && (n || (n = {}), n[S] = q[S]);
              } else n || (e || (e = []), e.push(w, n)), n = q;
              else w === "dangerouslySetInnerHTML" ? (q = q ? q.__html : void 0, Z = Z ? Z.__html : void 0, q != null && Z !== q && (e = e || []).push(w, q)) : w === "children" ? Z === q || typeof q != "string" && typeof q != "number" || (e = e || []).push(w, "" + q) : w !== "suppressContentEditableWarning" && w !== "suppressHydrationWarning" && (A.hasOwnProperty(w) ? (q != null && Wn(i, w), e || Z === q || (e = [])) : (e = e || []).push(w, q));
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
                t = (e = t.stateNode).getSnapshotBeforeUpdate(t.elementType === t.type ? n : $n(t.type, n), r), e.__reactInternalSnapshotBeforeUpdate = t;
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
                var r = n.elementType === n.type ? t.memoizedProps : $n(n.type, t.memoizedProps);
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
                    var p = i.destroy;
                    if (p !== void 0) {
                      var w = t;
                      try {
                        p();
                      } catch (S) {
                        yo(w, S);
                      }
                    }
                    i = i.next;
                  } while (i !== r);
                });
              }
              break;
            case 1:
              El(t), typeof (n = t.stateNode).componentWillUnmount == "function" && function(i, p) {
                try {
                  p.props = i.memoizedProps, p.state = i.memoizedState, p.componentWillUnmount();
                } catch (w) {
                  yo(i, w);
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
          r ? function i(p, w, S) {
            var Z = p.tag, q = Z === 5 || Z === 6;
            if (q) p = q ? p.stateNode : p.stateNode.instance, w ? S.nodeType === 8 ? S.parentNode.insertBefore(p, w) : S.insertBefore(p, w) : (S.nodeType === 8 ? (w = S.parentNode).insertBefore(p, S) : (w = S).appendChild(p), (S = S._reactRootContainer) !== null && S !== void 0 || w.onclick !== null || (w.onclick = Oo));
            else if (Z !== 4 && (p = p.child) !== null) for (i(p, w, S), p = p.sibling; p !== null; ) i(p, w, S), p = p.sibling;
          }(e, n, t) : function i(p, w, S) {
            var Z = p.tag, q = Z === 5 || Z === 6;
            if (q) p = q ? p.stateNode : p.stateNode.instance, w ? S.insertBefore(p, w) : S.appendChild(p);
            else if (Z !== 4 && (p = p.child) !== null) for (i(p, w, S), p = p.sibling; p !== null; ) i(p, w, S), p = p.sibling;
          }(e, n, t);
        }
        function Nl(e, t, n) {
          for (var r, i, p = t, w = !1; ; ) {
            if (!w) {
              w = p.return;
              e: for (; ; ) {
                if (w === null) throw Error(m(160));
                switch (r = w.stateNode, w.tag) {
                  case 5:
                    i = !1;
                    break e;
                  case 3:
                  case 4:
                    r = r.containerInfo, i = !0;
                    break e;
                }
                w = w.return;
              }
              w = !0;
            }
            if (p.tag === 5 || p.tag === 6) {
              e: for (var S = e, Z = p, q = n, ge = Z; ; ) if (Sl(S, ge, q), ge.child !== null && ge.tag !== 4) ge.child.return = ge, ge = ge.child;
              else {
                if (ge === Z) break e;
                for (; ge.sibling === null; ) {
                  if (ge.return === null || ge.return === Z) break e;
                  ge = ge.return;
                }
                ge.sibling.return = ge.return, ge = ge.sibling;
              }
              i ? (S = r, Z = p.stateNode, S.nodeType === 8 ? S.parentNode.removeChild(Z) : S.removeChild(Z)) : r.removeChild(p.stateNode);
            } else if (p.tag === 4) {
              if (p.child !== null) {
                r = p.stateNode.containerInfo, i = !0, p.child.return = p, p = p.child;
                continue;
              }
            } else if (Sl(e, p, n), p.child !== null) {
              p.child.return = p, p = p.child;
              continue;
            }
            if (p === t) break;
            for (; p.sibling === null; ) {
              if (p.return === null || p.return === t) return;
              (p = p.return).tag === 4 && (w = !1);
            }
            p.sibling.return = p.return, p = p.sibling;
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
                var p = t.updateQueue;
                if (t.updateQueue = null, p !== null) {
                  for (n[no] = r, e === "input" && r.type === "radio" && r.name != null && Tr(n, r), Qo(e, i), t = Qo(e, r), i = 0; i < p.length; i += 2) {
                    var w = p[i], S = p[i + 1];
                    w === "style" ? xi(n, S) : w === "dangerouslySetInnerHTML" ? qe(n, S) : w === "children" ? st(n, S) : je(n, w, S, t);
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
                if (e.tag === 5) p = e.stateNode, r ? typeof (p = p.style).setProperty == "function" ? p.setProperty("display", "none", "important") : p.display = "none" : (p = e.stateNode, i = (i = e.memoizedProps.style) != null && i.hasOwnProperty("display") ? i.display : null, p.style.display = _i("display", i));
                else if (e.tag === 6) e.stateNode.nodeValue = r ? "" : e.memoizedProps;
                else {
                  if (e.tag === 13 && e.memoizedState !== null && e.memoizedState.dehydrated === null) {
                    (p = e.child.sibling).return = e, e = p;
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
          (n = Wr(n, null)).tag = 3, n.payload = { element: null };
          var r = t.value;
          return n.callback = function() {
            ha || (ha = !0, fs = r), ls(e, t);
          }, n;
        }
        function Rl(e, t, n) {
          (n = Wr(n, null)).tag = 3;
          var r = e.type.getDerivedStateFromError;
          if (typeof r == "function") {
            var i = t.value;
            n.payload = function() {
              return ls(e, t), r(i);
            };
          }
          var p = e.stateNode;
          return p !== null && typeof p.componentDidCatch == "function" && (n.callback = function() {
            typeof r != "function" && (qr === null ? qr = /* @__PURE__ */ new Set([this]) : qr.add(this), ls(e, t));
            var w = t.stack;
            this.componentDidCatch(t.value, { componentStack: w !== null ? w : "" });
          }), n;
        }
        var Al, Nc = Math.ceil, la = he.ReactCurrentDispatcher, Ml = he.ReactCurrentOwner, po = 0, ca = 3, ua = 4, Qe = 0, _n = null, Ge = null, mn = 0, Ft = po, fa = null, wr = 1073741823, di = 1073741823, da = null, pi = 0, pa = !1, us = 0, Me = null, ha = !1, fs = null, qr = null, ma = !1, hi = null, mi = 90, ho = null, gi = 0, ds = null, ga = 0;
        function nr() {
          return 48 & Qe ? 1073741821 - (jn() / 10 | 0) : ga !== 0 ? ga : ga = 1073741821 - (jn() / 10 | 0);
        }
        function mo(e, t, n) {
          if (!(2 & (t = t.mode))) return 1073741823;
          var r = Wi();
          if (!(4 & t)) return r === 99 ? 1073741823 : 1073741822;
          if (16 & Qe) return mn;
          if (n !== null) e = Hi(e, 0 | n.timeoutMs || 5e3, 250);
          else switch (r) {
            case 99:
              e = 1073741823;
              break;
            case 98:
              e = Hi(e, 150, 100);
              break;
            case 97:
            case 96:
              e = Hi(e, 5e3, 250);
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
            var n = Wi();
            t === 1073741823 ? 8 & Qe && !(48 & Qe) ? ps(e) : (xn(e), Qe === 0 && Jn()) : xn(e), !(4 & Qe) || n !== 98 && n !== 99 || (ho === null ? ho = /* @__PURE__ */ new Map([[e, t]]) : ((n = ho.get(e)) === void 0 || n > t) && ho.set(e, t));
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
          if (t !== 0 || !Hl(e, t = e.firstPendingTime)) return t;
          var n = e.lastPingedTime;
          return 2 >= (e = n > (e = e.nextKnownPendingLevel) ? n : e) && t !== e ? 0 : e;
        }
        function xn(e) {
          if (e.lastExpiredTime !== 0) e.callbackExpirationTime = 1073741823, e.callbackPriority = 99, e.callbackNode = Vs(ps.bind(null, e));
          else {
            var t = ya(e), n = e.callbackNode;
            if (t === 0) n !== null && (e.callbackNode = null, e.callbackExpirationTime = 0, e.callbackPriority = 90);
            else {
              var r = nr();
              if (t === 1073741823 ? r = 99 : t === 1 || t === 2 ? r = 95 : r = 0 >= (r = 10 * (1073741821 - t) - 10 * (1073741821 - r)) ? 99 : 250 >= r ? 98 : 5250 >= r ? 97 : 95, n !== null) {
                var i = e.callbackPriority;
                if (e.callbackExpirationTime === t && i >= r) return;
                n !== Ls && Rs(n);
              }
              e.callbackExpirationTime = t, e.callbackPriority = r, t = t === 1073741823 ? Vs(ps.bind(null, e)) : Bs(r, Il.bind(null, e), { timeout: 10 * (1073741821 - t) - jn() }), e.callbackNode = t;
            }
          }
        }
        function Il(e, t) {
          if (ga = 0, t) return ws(e, t = nr()), xn(e), null;
          var n = ya(e);
          if (n !== 0) {
            if (t = e.callbackNode, (48 & Qe) != 0) throw Error(m(327));
            if (Ho(), e === _n && n === mn || go(e, n), Ge !== null) {
              var r = Qe;
              Qe |= 16;
              for (var i = Ul(); ; ) try {
                Dc();
                break;
              } catch (S) {
                Ll(e, S);
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
                      var p = e.lastPingedTime;
                      if (p === 0 || p >= n) {
                        e.lastPingedTime = n, go(e, n);
                        break;
                      }
                    }
                    if ((p = ya(e)) !== 0 && p !== n) break;
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
                    p = wr;
                    var w = da;
                    if (0 >= (r = 0 | w.busyMinDurationMs) ? r = 0 : (i = 0 | w.busyDelayMs, r = (p = jn() - (10 * (1073741821 - p) - (0 | w.timeoutMs || 5e3))) <= i ? 0 : i + r - p), 10 < r) {
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
          if (Ho(), e === _n && t === mn || go(e, t), Ge !== null) {
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
            (Qe = n) === 0 && Jn();
          }
        }
        function zl(e, t) {
          var n = Qe;
          Qe &= -2, Qe |= 8;
          try {
            return e(t);
          } finally {
            (Qe = n) === 0 && Jn();
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
                var i = e, p = Ge.return, w = Ge, S = t;
                if (t = mn, w.effectTag |= 2048, w.firstEffect = w.lastEffect = null, S !== null && typeof S == "object" && typeof S.then == "function") {
                  var Z = S;
                  if (!(2 & w.mode)) {
                    var q = w.alternate;
                    q ? (w.updateQueue = q.updateQueue, w.memoizedState = q.memoizedState, w.expirationTime = q.expirationTime) : (w.updateQueue = null, w.memoizedState = null);
                  }
                  var ge = (1 & Ct.current) != 0, De = p;
                  do {
                    var We;
                    if (We = De.tag === 13) {
                      var ot = De.memoizedState;
                      if (ot !== null) We = ot.dehydrated !== null;
                      else {
                        var Fn = De.memoizedProps;
                        We = Fn.fallback !== void 0 && (Fn.unstable_avoidThisFallback !== !0 || !ge);
                      }
                    }
                    if (We) {
                      var ln = De.updateQueue;
                      if (ln === null) {
                        var re = /* @__PURE__ */ new Set();
                        re.add(Z), De.updateQueue = re;
                      } else ln.add(Z);
                      if (!(2 & De.mode)) {
                        if (De.effectTag |= 64, w.effectTag &= -2981, w.tag === 1) if (w.alternate === null) w.tag = 17;
                        else {
                          var ee = Wr(1073741823, null);
                          ee.tag = 2, Hr(w, ee);
                        }
                        w.expirationTime = 1073741823;
                        break e;
                      }
                      S = void 0, w = t;
                      var ue = i.pingCache;
                      if (ue === null ? (ue = i.pingCache = new Oc(), S = /* @__PURE__ */ new Set(), ue.set(Z, S)) : (S = ue.get(Z)) === void 0 && (S = /* @__PURE__ */ new Set(), ue.set(Z, S)), !S.has(w)) {
                        S.add(w);
                        var ve = Ic.bind(null, i, Z, w);
                        Z.then(ve, ve);
                      }
                      De.effectTag |= 4096, De.expirationTime = t;
                      break e;
                    }
                    De = De.return;
                  } while (De !== null);
                  S = Error((Yt(w.type) || "A React component") + ` suspended while rendering, but no fallback UI was specified.

Add a <Suspense fallback=...> component higher in the tree to provide a loading indicator or placeholder to display.` + xr(w));
                }
                Ft !== 5 && (Ft = 2), S = ss(S, w), De = p;
                do {
                  switch (De.tag) {
                    case 3:
                      Z = S, De.effectTag |= 4096, De.expirationTime = t, $s(De, Dl(De, Z, t));
                      break e;
                    case 1:
                      Z = S;
                      var _e = De.type, Oe = De.stateNode;
                      if (!(64 & De.effectTag) && (typeof _e.getDerivedStateFromError == "function" || Oe !== null && typeof Oe.componentDidCatch == "function" && (qr === null || !qr.has(Oe)))) {
                        De.effectTag |= 4096, De.expirationTime = t, $s(De, Rl(De, Z, t));
                        break e;
                      }
                  }
                  De = De.return;
                } while (De !== null);
              }
              Ge = Vl(Ge);
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
          var t = Al(e.alternate, e, mn);
          return e.memoizedProps = e.pendingProps, t === null && (t = Vl(e)), Ml.current = null, t;
        }
        function Vl(e) {
          Ge = e;
          do {
            var t = Ge.alternate;
            if (e = Ge.return, (2048 & Ge.effectTag) == 0) {
              if (t = _c(t, Ge, mn), mn === 1 || Ge.childExpirationTime !== 1) {
                for (var n = 0, r = Ge.child; r !== null; ) {
                  var i = r.expirationTime, p = r.childExpirationTime;
                  i > n && (n = i), p > n && (n = p), r = r.sibling;
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
          var t = Wi();
          return Br(99, Rc.bind(null, e, t)), null;
        }
        function Rc(e, t) {
          do
            Ho();
          while (hi !== null);
          if (48 & Qe) throw Error(m(327));
          var n = e.finishedWork, r = e.finishedExpirationTime;
          if (n === null) return null;
          if (e.finishedWork = null, e.finishedExpirationTime = 0, n === e.current) throw Error(m(177));
          e.callbackNode = null, e.callbackExpirationTime = 0, e.callbackPriority = 90, e.nextKnownPendingLevel = 0;
          var i = hs(n);
          if (e.firstPendingTime = i, r <= e.lastSuspendedTime ? e.firstSuspendedTime = e.lastSuspendedTime = e.nextKnownPendingLevel = 0 : r <= e.firstSuspendedTime && (e.firstSuspendedTime = r - 1), r <= e.lastPingedTime && (e.lastPingedTime = 0), r <= e.lastExpiredTime && (e.lastExpiredTime = 0), e === _n && (Ge = _n = null, mn = 0), 1 < n.effectTag ? n.lastEffect !== null ? (n.lastEffect.nextEffect = n, i = n.firstEffect) : i = n : i = n.firstEffect, i !== null) {
            var p = Qe;
            Qe |= 32, Ml.current = null, Zo = Co;
            var w = Ni();
            if (Xo(w)) {
              if ("selectionStart" in w) var S = { start: w.selectionStart, end: w.selectionEnd };
              else e: {
                var Z = (S = (S = w.ownerDocument) && S.defaultView || window).getSelection && S.getSelection();
                if (Z && Z.rangeCount !== 0) {
                  S = Z.anchorNode;
                  var q = Z.anchorOffset, ge = Z.focusNode;
                  Z = Z.focusOffset;
                  try {
                    S.nodeType, ge.nodeType;
                  } catch {
                    S = null;
                    break e;
                  }
                  var De = 0, We = -1, ot = -1, Fn = 0, ln = 0, re = w, ee = null;
                  t: for (; ; ) {
                    for (var ue; re !== S || q !== 0 && re.nodeType !== 3 || (We = De + q), re !== ge || Z !== 0 && re.nodeType !== 3 || (ot = De + Z), re.nodeType === 3 && (De += re.nodeValue.length), (ue = re.firstChild) !== null; ) ee = re, re = ue;
                    for (; ; ) {
                      if (re === w) break t;
                      if (ee === S && ++Fn === q && (We = De), ee === ge && ++ln === Z && (ot = De), (ue = re.nextSibling) !== null) break;
                      ee = (re = ee).parentNode;
                    }
                    re = ue;
                  }
                  S = We === -1 || ot === -1 ? null : { start: We, end: ot };
                } else S = null;
              }
              S = S || { start: 0, end: 0 };
            } else S = null;
            Jo = { activeElementDetached: null, focusedElem: w, selectionRange: S }, Co = !1, Me = i;
            do
              try {
                Ac();
              } catch (Ze) {
                if (Me === null) throw Error(m(330));
                yo(Me, Ze), Me = Me.nextEffect;
              }
            while (Me !== null);
            Me = i;
            do
              try {
                for (w = e, S = t; Me !== null; ) {
                  var ve = Me.effectTag;
                  if (16 & ve && st(Me.stateNode, ""), 128 & ve) {
                    var _e = Me.alternate;
                    if (_e !== null) {
                      var Oe = _e.ref;
                      Oe !== null && (typeof Oe == "function" ? Oe(null) : Oe.current = null);
                    }
                  }
                  switch (1038 & ve) {
                    case 2:
                      Ol(Me), Me.effectTag &= -3;
                      break;
                    case 6:
                      Ol(Me), Me.effectTag &= -3, cs(Me.alternate, Me);
                      break;
                    case 1024:
                      Me.effectTag &= -1025;
                      break;
                    case 1028:
                      Me.effectTag &= -1025, cs(Me.alternate, Me);
                      break;
                    case 4:
                      cs(Me.alternate, Me);
                      break;
                    case 8:
                      Nl(w, q = Me, S), Cl(q);
                  }
                  Me = Me.nextEffect;
                }
              } catch (Ze) {
                if (Me === null) throw Error(m(330));
                yo(Me, Ze), Me = Me.nextEffect;
              }
            while (Me !== null);
            if (Oe = Jo, _e = Ni(), ve = Oe.focusedElem, S = Oe.selectionRange, _e !== ve && ve && ve.ownerDocument && function Ze(Bt, kr) {
              return !(!Bt || !kr) && (Bt === kr || (!Bt || Bt.nodeType !== 3) && (kr && kr.nodeType === 3 ? Ze(Bt, kr.parentNode) : "contains" in Bt ? Bt.contains(kr) : !!Bt.compareDocumentPosition && !!(16 & Bt.compareDocumentPosition(kr))));
            }(ve.ownerDocument.documentElement, ve)) {
              for (S !== null && Xo(ve) && (_e = S.start, (Oe = S.end) === void 0 && (Oe = _e), "selectionStart" in ve ? (ve.selectionStart = _e, ve.selectionEnd = Math.min(Oe, ve.value.length)) : (Oe = (_e = ve.ownerDocument || document) && _e.defaultView || window).getSelection && (Oe = Oe.getSelection(), q = ve.textContent.length, w = Math.min(S.start, q), S = S.end === void 0 ? w : Math.min(S.end, q), !Oe.extend && w > S && (q = S, S = w, w = q), q = Oi(ve, w), ge = Oi(ve, S), q && ge && (Oe.rangeCount !== 1 || Oe.anchorNode !== q.node || Oe.anchorOffset !== q.offset || Oe.focusNode !== ge.node || Oe.focusOffset !== ge.offset) && ((_e = _e.createRange()).setStart(q.node, q.offset), Oe.removeAllRanges(), w > S ? (Oe.addRange(_e), Oe.extend(ge.node, ge.offset)) : (_e.setEnd(ge.node, ge.offset), Oe.addRange(_e))))), _e = [], Oe = ve; Oe = Oe.parentNode; ) Oe.nodeType === 1 && _e.push({ element: Oe, left: Oe.scrollLeft, top: Oe.scrollTop });
              for (typeof ve.focus == "function" && ve.focus(), ve = 0; ve < _e.length; ve++) (Oe = _e[ve]).element.scrollLeft = Oe.left, Oe.element.scrollTop = Oe.top;
            }
            Co = !!Zo, Jo = Zo = null, e.current = n, Me = i;
            do
              try {
                for (ve = e; Me !== null; ) {
                  var Be = Me.effectTag;
                  if (36 & Be && Tc(ve, Me.alternate, Me), 128 & Be) {
                    _e = void 0;
                    var at = Me.ref;
                    if (at !== null) {
                      var Rt = Me.stateNode;
                      switch (Me.tag) {
                        case 5:
                          _e = Rt;
                          break;
                        default:
                          _e = Rt;
                      }
                      typeof at == "function" ? at(_e) : at.current = _e;
                    }
                  }
                  Me = Me.nextEffect;
                }
              } catch (Ze) {
                if (Me === null) throw Error(m(330));
                yo(Me, Ze), Me = Me.nextEffect;
              }
            while (Me !== null);
            Me = null, yc(), Qe = p;
          } else e.current = n;
          if (ma) ma = !1, hi = e, mi = t;
          else for (Me = i; Me !== null; ) t = Me.nextEffect, Me.nextEffect = null, Me = t;
          if ((t = e.firstPendingTime) === 0 && (qr = null), t === 1073741823 ? e === ds ? gi++ : (gi = 0, ds = e) : gi = 0, typeof ms == "function" && ms(n.stateNode, r), xn(e), ha) throw ha = !1, e = fs, fs = null, e;
          return 8 & Qe || Jn(), null;
        }
        function Ac() {
          for (; Me !== null; ) {
            var e = Me.effectTag;
            256 & e && Cc(Me.alternate, Me), !(512 & e) || ma || (ma = !0, Bs(97, function() {
              return Ho(), null;
            })), Me = Me.nextEffect;
          }
        }
        function Ho() {
          if (mi !== 90) {
            var e = 97 < mi ? 97 : mi;
            return mi = 90, Br(e, Mc);
          }
        }
        function Mc() {
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
          return Qe = t, Jn(), !0;
        }
        function Wl(e, t, n) {
          Hr(e, t = Dl(e, t = ss(n, t), 1073741823)), (e = ba(e, 1073741823)) !== null && xn(e);
        }
        function yo(e, t) {
          if (e.tag === 3) Wl(e, e, t);
          else for (var n = e.return; n !== null; ) {
            if (n.tag === 3) {
              Wl(n, e, t);
              break;
            }
            if (n.tag === 1) {
              var r = n.stateNode;
              if (typeof n.type.getDerivedStateFromError == "function" || typeof r.componentDidCatch == "function" && (qr === null || !qr.has(r))) {
                Hr(n, e = Rl(n, e = ss(t, e), 1073741823)), (n = ba(n, 1073741823)) !== null && xn(n);
                break;
              }
            }
            n = n.return;
          }
        }
        function Ic(e, t, n) {
          var r = e.pingCache;
          r !== null && r.delete(t), _n === e && mn === n ? Ft === ua || Ft === ca && wr === 1073741823 && jn() - us < 500 ? go(e, mn) : pa = !0 : Hl(e, n) && ((t = e.lastPingedTime) !== 0 && t < n || (e.lastPingedTime = n, xn(e)));
        }
        function jc(e, t) {
          var n = e.stateNode;
          n !== null && n.delete(t), (t = 0) == 0 && (t = mo(t = nr(), e, null)), (e = ba(e, t)) !== null && xn(e);
        }
        Al = function(e, t, n) {
          var r = t.expirationTime;
          if (e !== null) {
            var i = t.pendingProps;
            if (e.memoizedProps !== i || pn.current) tr = !0;
            else {
              if (r < n) {
                switch (tr = !1, t.tag) {
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
                    Ha(t, t.stateNode.containerInfo);
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
              tr = !1;
            }
          } else tr = !1;
          switch (t.expirationTime = 0, t.tag) {
            case 2:
              if (r = t.type, e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= 2), e = t.pendingProps, i = zo(t, Xt.current), Uo(t, n), i = Ka(null, t, r, e, i, n), t.effectTag |= 1, typeof i == "object" && i !== null && typeof i.render == "function" && i.$$typeof === void 0) {
                if (t.tag = 1, t.memoizedState = null, t.updateQueue = null, hn(r)) {
                  var p = !0;
                  Fi(t);
                } else p = !1;
                t.memoizedState = i.state !== null && i.state !== void 0 ? i.state : null, Fa(t);
                var w = r.getDerivedStateFromProps;
                typeof w == "function" && Ki(t, r, w, e), i.updater = Qi, t.stateNode = i, i._reactInternalFiber = t, Va(t, r, e, n), t = os(null, t, r, !0, p, n);
              } else t.tag = 0, Un(null, t, i, n), t = t.child;
              return t;
            case 16:
              e: {
                if (i = t.elementType, e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= 2), e = t.pendingProps, function(ge) {
                  if (ge._status === -1) {
                    ge._status = 0;
                    var De = ge._ctor;
                    De = De(), ge._result = De, De.then(function(We) {
                      ge._status === 0 && (We = We.default, ge._status = 1, ge._result = We);
                    }, function(We) {
                      ge._status === 0 && (ge._status = 2, ge._result = We);
                    });
                  }
                }(i), i._status !== 1) throw i._result;
                switch (i = i._result, t.type = i, p = t.tag = function(ge) {
                  if (typeof ge == "function") return bs(ge) ? 1 : 0;
                  if (ge != null) {
                    if ((ge = ge.$$typeof) === Tt) return 11;
                    if (ge === Sn) return 14;
                  }
                  return 2;
                }(i), e = $n(i, e), p) {
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
                    t = fl(null, t, i, $n(i.type, e), r, n);
                    break e;
                }
                throw Error(m(306, i, ""));
              }
              return t;
            case 0:
              return r = t.type, i = t.pendingProps, rs(e, t, r, i = t.elementType === r ? i : $n(r, i), n);
            case 1:
              return r = t.type, i = t.pendingProps, hl(e, t, r, i = t.elementType === r ? i : $n(r, i), n);
            case 3:
              if (ml(t), r = t.updateQueue, e === null || r === null) throw Error(m(282));
              if (r = t.pendingProps, i = (i = t.memoizedState) !== null ? i.element : null, Ba(e, t), ai(t, r, null, n), (r = t.memoizedState.element) === i) ns(), t = vr(e, t, n);
              else {
                if ((i = t.stateNode.hydrate) && (Yr = Mr(t.stateNode.containerInfo.firstChild), yr = t, i = fo = !0), i) for (n = Wa(t, null, r, n), t.child = n; n; ) n.effectTag = -3 & n.effectTag | 1024, n = n.sibling;
                else Un(e, t, r, n), ns();
                t = t.child;
              }
              return t;
            case 5:
              return Zs(t), e === null && ts(t), r = t.type, i = t.pendingProps, p = e !== null ? e.memoizedProps : null, w = i.children, ei(r, i) ? w = null : p !== null && ei(r, p) && (t.effectTag |= 16), pl(e, t), 4 & t.mode && n !== 1 && i.hidden ? (t.expirationTime = t.childExpirationTime = 1, t = null) : (Un(e, t, w, n), t = t.child), t;
            case 6:
              return e === null && ts(t), null;
            case 13:
              return vl(e, t, n);
            case 4:
              return Ha(t, t.stateNode.containerInfo), r = t.pendingProps, e === null ? t.child = Fo(t, null, r, n) : Un(e, t, r, n), t.child;
            case 11:
              return r = t.type, i = t.pendingProps, ul(e, t, r, i = t.elementType === r ? i : $n(r, i), n);
            case 7:
              return Un(e, t, t.pendingProps, n), t.child;
            case 8:
            case 12:
              return Un(e, t, t.pendingProps.children, n), t.child;
            case 10:
              e: {
                r = t.type._context, i = t.pendingProps, w = t.memoizedProps, p = i.value;
                var S = t.type._context;
                if (St($i, S._currentValue), S._currentValue = p, w !== null) if (S = w.value, (p = mr(S, p) ? 0 : 0 | (typeof r._calculateChangedBits == "function" ? r._calculateChangedBits(S, p) : 1073741823)) === 0) {
                  if (w.children === i.children && !pn.current) {
                    t = vr(e, t, n);
                    break e;
                  }
                } else for ((S = t.child) !== null && (S.return = t); S !== null; ) {
                  var Z = S.dependencies;
                  if (Z !== null) {
                    w = S.child;
                    for (var q = Z.firstContext; q !== null; ) {
                      if (q.context === r && q.observedBits & p) {
                        S.tag === 1 && ((q = Wr(n, null)).tag = 2, Hr(S, q)), S.expirationTime < n && (S.expirationTime = n), (q = S.alternate) !== null && q.expirationTime < n && (q.expirationTime = n), Hs(S.return, n), Z.expirationTime < n && (Z.expirationTime = n);
                        break;
                      }
                      q = q.next;
                    }
                  } else w = S.tag === 10 && S.type === t.type ? null : S.child;
                  if (w !== null) w.return = S;
                  else for (w = S; w !== null; ) {
                    if (w === t) {
                      w = null;
                      break;
                    }
                    if ((S = w.sibling) !== null) {
                      S.return = w.return, w = S;
                      break;
                    }
                    w = w.return;
                  }
                  S = w;
                }
                Un(e, t, i.children, n), t = t.child;
              }
              return t;
            case 9:
              return i = t.type, r = (p = t.pendingProps).children, Uo(t, n), r = r(i = zn(i, p.unstable_observedBits)), t.effectTag |= 1, Un(e, t, r, n), t.child;
            case 14:
              return p = $n(i = t.type, t.pendingProps), fl(e, t, i, p = $n(i.type, p), r, n);
            case 15:
              return dl(e, t, t.type, t.pendingProps, r, n);
            case 17:
              return r = t.type, i = t.pendingProps, i = t.elementType === r ? i : $n(r, i), e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= 2), t.tag = 1, hn(r) ? (e = !0, Fi(t)) : e = !1, Uo(t, n), Qs(t, r, i), Va(t, r, i, n), os(null, t, r, !0, e, n);
            case 19:
              return kl(e, t, n);
          }
          throw Error(m(156, t.tag));
        };
        var ms = null, gs = null;
        function zc(e, t, n, r) {
          this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = r, this.effectTag = 0, this.lastEffect = this.firstEffect = this.nextEffect = null, this.childExpirationTime = this.expirationTime = 0, this.alternate = null;
        }
        function rr(e, t, n, r) {
          return new zc(e, t, n, r);
        }
        function bs(e) {
          return !(!(e = e.prototype) || !e.isReactComponent);
        }
        function vo(e, t) {
          var n = e.alternate;
          return n === null ? ((n = rr(e.tag, t, e.key, e.mode)).elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.effectTag = 0, n.nextEffect = null, n.firstEffect = null, n.lastEffect = null), n.childExpirationTime = e.childExpirationTime, n.expirationTime = e.expirationTime, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : { expirationTime: t.expirationTime, firstContext: t.firstContext, responders: t.responders }, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n;
        }
        function wa(e, t, n, r, i, p) {
          var w = 2;
          if (r = e, typeof e == "function") bs(e) && (w = 1);
          else if (typeof e == "string") w = 5;
          else e: switch (e) {
            case wt:
              return Qr(n.children, i, p, t);
            case Er:
              w = 8, i |= 7;
              break;
            case Jt:
              w = 8, i |= 1;
              break;
            case kt:
              return (e = rr(12, n, t, 8 | i)).elementType = kt, e.type = kt, e.expirationTime = p, e;
            case pt:
              return (e = rr(13, n, t, i)).type = pt, e.elementType = pt, e.expirationTime = p, e;
            case Yn:
              return (e = rr(19, n, t, i)).elementType = Yn, e.expirationTime = p, e;
            default:
              if (typeof e == "object" && e !== null) switch (e.$$typeof) {
                case gt:
                  w = 10;
                  break e;
                case cn:
                  w = 9;
                  break e;
                case Tt:
                  w = 11;
                  break e;
                case Sn:
                  w = 14;
                  break e;
                case or:
                  w = 16, r = null;
                  break e;
                case _r:
                  w = 22;
                  break e;
              }
              throw Error(m(130, e == null ? e : typeof e, ""));
          }
          return (t = rr(w, n, t, i)).elementType = e, t.type = r, t.expirationTime = p, t;
        }
        function Qr(e, t, n, r) {
          return (e = rr(7, e, r, t)).expirationTime = n, e;
        }
        function ys(e, t, n) {
          return (e = rr(6, e, null, t)).expirationTime = n, e;
        }
        function vs(e, t, n) {
          return (t = rr(4, e.children !== null ? e.children : [], e.key, t)).expirationTime = n, t.stateNode = { containerInfo: e.containerInfo, pendingChildren: null, implementation: e.implementation }, t;
        }
        function Lc(e, t, n) {
          this.tag = t, this.current = null, this.containerInfo = e, this.pingCache = this.pendingChildren = null, this.finishedExpirationTime = 0, this.finishedWork = null, this.timeoutHandle = -1, this.pendingContext = this.context = null, this.hydrate = n, this.callbackNode = null, this.callbackPriority = 90, this.lastExpiredTime = this.lastPingedTime = this.nextKnownPendingLevel = this.lastSuspendedTime = this.firstSuspendedTime = this.firstPendingTime = 0;
        }
        function Hl(e, t) {
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
          var i = t.current, p = nr(), w = si.suspense;
          p = mo(p, i, w);
          e: if (n) {
            t: {
              if (Pn(n = n._reactInternalFiber) !== n || n.tag !== 1) throw Error(m(170));
              var S = n;
              do {
                switch (S.tag) {
                  case 3:
                    S = S.stateNode.context;
                    break t;
                  case 1:
                    if (hn(S.type)) {
                      S = S.stateNode.__reactInternalMemoizedMergedChildContext;
                      break t;
                    }
                }
                S = S.return;
              } while (S !== null);
              throw Error(m(171));
            }
            if (n.tag === 1) {
              var Z = n.type;
              if (hn(Z)) {
                n = Ps(n, Z, S);
                break e;
              }
            }
            n = S;
          } else n = Fr;
          return t.context === null ? t.context = n : t.pendingContext = n, (t = Wr(p, w)).payload = { element: e }, (r = r === void 0 ? null : r) !== null && (t.callback = r), Hr(i, t), Kr(i, p), p;
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
          var r = new Lc(e, t, n = n != null && n.hydrate === !0), i = rr(3, null, null, t === 2 ? 7 : t === 1 ? 3 : 0);
          r.current = i, i.stateNode = r, Fa(i), e[ro] = r.current, n && t !== 0 && function(p, w) {
            var S = un(w);
            Vn.forEach(function(Z) {
              yt(Z, w, S);
            }), Pt.forEach(function(Z) {
              yt(Z, w, S);
            });
          }(0, e.nodeType === 9 ? e : e.ownerDocument), this._internalRoot = r;
        }
        function bi(e) {
          return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11 && (e.nodeType !== 8 || e.nodeValue !== " react-mount-point-unstable "));
        }
        function Ea(e, t, n, r, i) {
          var p = n._reactRootContainer;
          if (p) {
            var w = p._internalRoot;
            if (typeof i == "function") {
              var S = i;
              i = function() {
                var q = ks(w);
                S.call(q);
              };
            }
            ka(t, w, e, i);
          } else {
            if (p = n._reactRootContainer = function(q, ge) {
              if (ge || (ge = !(!(ge = q ? q.nodeType === 9 ? q.documentElement : q.firstChild : null) || ge.nodeType !== 1 || !ge.hasAttribute("data-reactroot"))), !ge) for (var De; De = q.lastChild; ) q.removeChild(De);
              return new _s(q, 0, ge ? { hydrate: !0 } : void 0);
            }(n, r), w = p._internalRoot, typeof i == "function") {
              var Z = i;
              i = function() {
                var q = ks(w);
                Z.call(q);
              };
            }
            zl(function() {
              ka(t, w, e, i);
            });
          }
          return ks(w);
        }
        function Uc(e, t, n) {
          var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
          return { $$typeof: At, key: r == null ? null : "" + r, children: e, containerInfo: t, implementation: n };
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
            var t = Hi(nr(), 150, 100);
            Kr(e, t), Es(e, t);
          }
        }, ur = function(e) {
          e.tag === 13 && (Kr(e, 3), Es(e, 3));
        }, fr = function(e) {
          if (e.tag === 13) {
            var t = nr();
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
          var p = Qe;
          Qe |= 4;
          try {
            return Br(98, e.bind(null, t, n, r, i));
          } finally {
            (Qe = p) === 0 && Jn();
          }
        }, ke = function() {
          !(49 & Qe) && (function() {
            if (ho !== null) {
              var e = ho;
              ho = null, e.forEach(function(t, n) {
                ws(n, t), xn(n);
              }), Jn();
            }
          }(), Ho());
        }, Ne = function(e, t) {
          var n = Qe;
          Qe |= 2;
          try {
            return e(t);
          } finally {
            (Qe = n) === 0 && Jn();
          }
        };
        var Kl, xs, Fc = { Events: [oo, Gn, ni, le, I, jr, function(e) {
          qn(e, Aa);
        }, D, ie, To, Mt, Ho, { current: !1 }] };
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
        }, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null })), a.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Fc, a.createPortal = ql, a.findDOMNode = function(e) {
          if (e == null) return null;
          if (e.nodeType === 1) return e;
          var t = e._reactInternalFiber;
          if (t === void 0)
            throw typeof e.render == "function" ? Error(m(188)) : Error(m(268, Object.keys(e)));
          return e = (e = rt(t)) === null ? null : e.stateNode;
        }, a.flushSync = function(e, t) {
          if (48 & Qe) throw Error(m(187));
          var n = Qe;
          Qe |= 1;
          try {
            return Br(99, e.bind(null, t));
          } finally {
            Qe = n, Jn();
          }
        }, a.hydrate = function(e, t, n) {
          if (!bi(t)) throw Error(m(200));
          return Ea(null, e, t, !0, n);
        }, a.render = function(e, t, n) {
          if (!bi(t)) throw Error(m(200));
          return Ea(null, e, t, !1, n);
        }, a.unmountComponentAtNode = function(e) {
          if (!bi(e)) throw Error(m(40));
          return !!e._reactRootContainer && (zl(function() {
            Ea(null, null, e, !1, function() {
              e._reactRootContainer = null, e[ro] = null;
            });
          }), !0);
        }, a.unstable_batchedUpdates = jl, a.unstable_createPortal = function(e, t) {
          return ql(e, t, 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null);
        }, a.unstable_renderSubtreeIntoContainer = function(e, t, n, r) {
          if (!bi(n)) throw Error(m(200));
          if (e == null || e._reactInternalFiber === void 0) throw Error(m(38));
          return Ea(e, t, n, !1, r);
        }, a.version = "16.14.0";
      }, function(b, a, u) {
        b.exports = u(24);
      }, function(b, a, u) {
        var c, o, x, m, g;
        if (typeof window > "u" || typeof MessageChannel != "function") {
          var v = null, y = null, C = function() {
            if (v !== null) try {
              var Y = a.unstable_now();
              v(!0, Y), v = null;
            } catch (me) {
              throw setTimeout(C, 0), me;
            }
          }, T = Date.now();
          a.unstable_now = function() {
            return Date.now() - T;
          }, c = function(Y) {
            v !== null ? setTimeout(c, 0, Y) : (v = Y, setTimeout(C, 0));
          }, o = function(Y, me) {
            y = setTimeout(Y, me);
          }, x = function() {
            clearTimeout(y);
          }, m = function() {
            return !1;
          }, g = a.unstable_forceFrameRate = function() {
          };
        } else {
          var P = window.performance, X = window.Date, K = window.setTimeout, j = window.clearTimeout;
          if (typeof console < "u") {
            var B = window.cancelAnimationFrame;
            typeof window.requestAnimationFrame != "function" && console.error("This browser doesn't support requestAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills"), typeof B != "function" && console.error("This browser doesn't support cancelAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills");
          }
          if (typeof P == "object" && typeof P.now == "function") a.unstable_now = function() {
            return P.now();
          };
          else {
            var N = X.now();
            a.unstable_now = function() {
              return X.now() - N;
            };
          }
          var M = !1, V = null, R = -1, oe = 5, Q = 0;
          m = function() {
            return a.unstable_now() >= Q;
          }, g = function() {
          }, a.unstable_forceFrameRate = function(Y) {
            0 > Y || 125 < Y ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing framerates higher than 125 fps is not unsupported") : oe = 0 < Y ? Math.floor(1e3 / Y) : 5;
          };
          var I = new MessageChannel(), A = I.port2;
          I.port1.onmessage = function() {
            if (V !== null) {
              var Y = a.unstable_now();
              Q = Y + oe;
              try {
                V(!0, Y) ? A.postMessage(null) : (M = !1, V = null);
              } catch (me) {
                throw A.postMessage(null), me;
              }
            } else M = !1;
          }, c = function(Y) {
            V = Y, M || (M = !0, A.postMessage(null));
          }, o = function(Y, me) {
            R = K(function() {
              Y(a.unstable_now());
            }, me);
          }, x = function() {
            j(R), R = -1;
          };
        }
        function se(Y, me) {
          var l = Y.length;
          Y.push(me);
          e: for (; ; ) {
            var d = l - 1 >>> 1, k = Y[d];
            if (!(k !== void 0 && 0 < ce(k, me))) break e;
            Y[d] = me, Y[l] = k, l = d;
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
              e: for (var d = 0, k = Y.length; d < k; ) {
                var U = 2 * (d + 1) - 1, F = Y[U], W = U + 1, he = Y[W];
                if (F !== void 0 && 0 > ce(F, l)) he !== void 0 && 0 > ce(he, F) ? (Y[d] = he, Y[W] = l, d = W) : (Y[d] = F, Y[U] = l, d = U);
                else {
                  if (!(he !== void 0 && 0 > ce(he, l))) break e;
                  Y[d] = he, Y[W] = l, d = W;
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
          if (ke = !1, Ne(Y), !Ce) if (le(ye) !== null) Ce = !0, c(ze);
          else {
            var me = le(J);
            me !== null && o(xe, me.startTime - Y);
          }
        }
        function ze(Y, me) {
          Ce = !1, ke && (ke = !1, x()), be = !0;
          var l = ie;
          try {
            for (Ne(me), D = le(ye); D !== null && (!(D.expirationTime > me) || Y && !m()); ) {
              var d = D.callback;
              if (d !== null) {
                D.callback = null, ie = D.priorityLevel;
                var k = d(D.expirationTime <= me);
                me = a.unstable_now(), typeof k == "function" ? D.callback = k : D === le(ye) && te(ye), Ne(me);
              } else te(ye);
              D = le(ye);
            }
            if (D !== null) var U = !0;
            else {
              var F = le(J);
              F !== null && o(xe, F.startTime - me), U = !1;
            }
            return U;
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
        a.unstable_IdlePriority = 5, a.unstable_ImmediatePriority = 1, a.unstable_LowPriority = 4, a.unstable_NormalPriority = 3, a.unstable_Profiling = null, a.unstable_UserBlockingPriority = 2, a.unstable_cancelCallback = function(Y) {
          Y.callback = null;
        }, a.unstable_continueExecution = function() {
          Ce || be || (Ce = !0, c(ze));
        }, a.unstable_getCurrentPriorityLevel = function() {
          return ie;
        }, a.unstable_getFirstCallbackNode = function() {
          return le(ye);
        }, a.unstable_next = function(Y) {
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
        }, a.unstable_pauseExecution = function() {
        }, a.unstable_requestPaint = G, a.unstable_runWithPriority = function(Y, me) {
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
        }, a.unstable_scheduleCallback = function(Y, me, l) {
          var d = a.unstable_now();
          if (typeof l == "object" && l !== null) {
            var k = l.delay;
            k = typeof k == "number" && 0 < k ? d + k : d, l = typeof l.timeout == "number" ? l.timeout : Je(Y);
          } else l = Je(Y), k = d;
          return Y = { id: fe++, callback: me, priorityLevel: Y, startTime: k, expirationTime: l = k + l, sortIndex: -1 }, k > d ? (Y.sortIndex = k, se(J, Y), le(ye) === null && Y === le(J) && (ke ? x() : ke = !0, o(xe, k - d))) : (Y.sortIndex = l, se(ye, Y), Ce || be || (Ce = !0, c(ze))), Y;
        }, a.unstable_shouldYield = function() {
          var Y = a.unstable_now();
          Ne(Y);
          var me = le(ye);
          return me !== D && D !== null && me !== null && me.callback !== null && me.startTime <= Y && me.expirationTime < D.expirationTime || m();
        }, a.unstable_wrapCallback = function(Y) {
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
      }, function(b, a, u) {
        Object.defineProperty(a, "__esModule", { value: !0 }), a.toString = void 0;
        const c = u(13), o = u(26), x = u(17), m = { string: c.quoteString, number: (g) => Object.is(g, -0) ? "-0" : String(g), boolean: String, symbol: (g, v, y) => {
          const C = Symbol.keyFor(g);
          return C !== void 0 ? `Symbol.for(${y(C)})` : `Symbol(${y(g.description)})`;
        }, bigint: (g, v, y) => `BigInt(${y(String(g))})`, undefined: String, object: o.objectToString, function: x.functionToString };
        a.toString = (g, v, y, C) => g === null ? "null" : m[typeof g](g, v, y, C);
      }, function(b, a, u) {
        (function(c, o) {
          Object.defineProperty(a, "__esModule", { value: !0 }), a.objectToString = void 0;
          const x = u(13), m = u(17), g = u(31);
          a.objectToString = (C, T, P, X) => {
            if (typeof c == "function" && c.isBuffer(C)) return `Buffer.from(${P(C.toString("base64"))}, 'base64')`;
            if (typeof o == "object" && C === o) return v(C, T, P);
            const K = y[Object.prototype.toString.call(C)];
            return K ? K(C, T, P, X) : void 0;
          };
          const v = (C, T, P) => `Function(${P("return this")})()`, y = { "[object Array]": g.arrayToString, "[object Object]": (C, T, P, X) => {
            const K = T ? `
` : "", j = T ? " " : "", B = Object.keys(C).reduce(function(N, M) {
              const V = C[M], R = P(V, M);
              if (R === void 0) return N;
              const oe = R.split(`
`).join(`
` + T);
              return m.USED_METHOD_KEY.has(V) ? (N.push(`${T}${oe}`), N) : (N.push(`${T}${x.quoteKey(M, P)}:${j}${oe}`), N);
            }, []).join("," + K);
            return B === "" ? "{}" : `{${K}${B}${K}}`;
          }, "[object Error]": (C, T, P) => `new Error(${P(C.message)})`, "[object Date]": (C) => `new Date(${C.getTime()})`, "[object String]": (C, T, P) => `new String(${P(C.toString())})`, "[object Number]": (C) => `new Number(${C})`, "[object Boolean]": (C) => `new Boolean(${C})`, "[object Set]": (C, T, P) => `new Set(${P(Array.from(C))})`, "[object Map]": (C, T, P) => `new Map(${P(Array.from(C))})`, "[object RegExp]": String, "[object global]": v, "[object Window]": v };
        }).call(this, u(27).Buffer, u(15));
      }, function(b, a, u) {
        (function(c) {
          var o = u(28), x = u(29), m = u(30);
          function g() {
            return y.TYPED_ARRAY_SUPPORT ? 2147483647 : 1073741823;
          }
          function v(l, d) {
            if (g() < d) throw new RangeError("Invalid typed array length");
            return y.TYPED_ARRAY_SUPPORT ? (l = new Uint8Array(d)).__proto__ = y.prototype : (l === null && (l = new y(d)), l.length = d), l;
          }
          function y(l, d, k) {
            if (!(y.TYPED_ARRAY_SUPPORT || this instanceof y)) return new y(l, d, k);
            if (typeof l == "number") {
              if (typeof d == "string") throw new Error("If encoding is specified then the first argument must be a string");
              return P(this, l);
            }
            return C(this, l, d, k);
          }
          function C(l, d, k, U) {
            if (typeof d == "number") throw new TypeError('"value" argument must not be a number');
            return typeof ArrayBuffer < "u" && d instanceof ArrayBuffer ? function(F, W, he, je) {
              if (W.byteLength, he < 0 || W.byteLength < he) throw new RangeError("'offset' is out of bounds");
              if (W.byteLength < he + (je || 0)) throw new RangeError("'length' is out of bounds");
              return W = he === void 0 && je === void 0 ? new Uint8Array(W) : je === void 0 ? new Uint8Array(W, he) : new Uint8Array(W, he, je), y.TYPED_ARRAY_SUPPORT ? (F = W).__proto__ = y.prototype : F = X(F, W), F;
            }(l, d, k, U) : typeof d == "string" ? function(F, W, he) {
              if (typeof he == "string" && he !== "" || (he = "utf8"), !y.isEncoding(he)) throw new TypeError('"encoding" must be a valid string encoding');
              var je = 0 | j(W, he), Re = (F = v(F, je)).write(W, he);
              return Re !== je && (F = F.slice(0, Re)), F;
            }(l, d, k) : function(F, W) {
              if (y.isBuffer(W)) {
                var he = 0 | K(W.length);
                return (F = v(F, he)).length === 0 || W.copy(F, 0, 0, he), F;
              }
              if (W) {
                if (typeof ArrayBuffer < "u" && W.buffer instanceof ArrayBuffer || "length" in W) return typeof W.length != "number" || (je = W.length) != je ? v(F, 0) : X(F, W);
                if (W.type === "Buffer" && m(W.data)) return X(F, W.data);
              }
              var je;
              throw new TypeError("First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.");
            }(l, d);
          }
          function T(l) {
            if (typeof l != "number") throw new TypeError('"size" argument must be a number');
            if (l < 0) throw new RangeError('"size" argument must not be negative');
          }
          function P(l, d) {
            if (T(d), l = v(l, d < 0 ? 0 : 0 | K(d)), !y.TYPED_ARRAY_SUPPORT) for (var k = 0; k < d; ++k) l[k] = 0;
            return l;
          }
          function X(l, d) {
            var k = d.length < 0 ? 0 : 0 | K(d.length);
            l = v(l, k);
            for (var U = 0; U < k; U += 1) l[U] = 255 & d[U];
            return l;
          }
          function K(l) {
            if (l >= g()) throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + g().toString(16) + " bytes");
            return 0 | l;
          }
          function j(l, d) {
            if (y.isBuffer(l)) return l.length;
            if (typeof ArrayBuffer < "u" && typeof ArrayBuffer.isView == "function" && (ArrayBuffer.isView(l) || l instanceof ArrayBuffer)) return l.byteLength;
            typeof l != "string" && (l = "" + l);
            var k = l.length;
            if (k === 0) return 0;
            for (var U = !1; ; ) switch (d) {
              case "ascii":
              case "latin1":
              case "binary":
                return k;
              case "utf8":
              case "utf-8":
              case void 0:
                return G(l).length;
              case "ucs2":
              case "ucs-2":
              case "utf16le":
              case "utf-16le":
                return 2 * k;
              case "hex":
                return k >>> 1;
              case "base64":
                return Y(l).length;
              default:
                if (U) return G(l).length;
                d = ("" + d).toLowerCase(), U = !0;
            }
          }
          function B(l, d, k) {
            var U = !1;
            if ((d === void 0 || d < 0) && (d = 0), d > this.length || ((k === void 0 || k > this.length) && (k = this.length), k <= 0) || (k >>>= 0) <= (d >>>= 0)) return "";
            for (l || (l = "utf8"); ; ) switch (l) {
              case "hex":
                return J(this, d, k);
              case "utf8":
              case "utf-8":
                return te(this, d, k);
              case "ascii":
                return ce(this, d, k);
              case "latin1":
              case "binary":
                return ye(this, d, k);
              case "base64":
                return le(this, d, k);
              case "ucs2":
              case "ucs-2":
              case "utf16le":
              case "utf-16le":
                return fe(this, d, k);
              default:
                if (U) throw new TypeError("Unknown encoding: " + l);
                l = (l + "").toLowerCase(), U = !0;
            }
          }
          function N(l, d, k) {
            var U = l[d];
            l[d] = l[k], l[k] = U;
          }
          function M(l, d, k, U, F) {
            if (l.length === 0) return -1;
            if (typeof k == "string" ? (U = k, k = 0) : k > 2147483647 ? k = 2147483647 : k < -2147483648 && (k = -2147483648), k = +k, isNaN(k) && (k = F ? 0 : l.length - 1), k < 0 && (k = l.length + k), k >= l.length) {
              if (F) return -1;
              k = l.length - 1;
            } else if (k < 0) {
              if (!F) return -1;
              k = 0;
            }
            if (typeof d == "string" && (d = y.from(d, U)), y.isBuffer(d)) return d.length === 0 ? -1 : V(l, d, k, U, F);
            if (typeof d == "number") return d &= 255, y.TYPED_ARRAY_SUPPORT && typeof Uint8Array.prototype.indexOf == "function" ? F ? Uint8Array.prototype.indexOf.call(l, d, k) : Uint8Array.prototype.lastIndexOf.call(l, d, k) : V(l, [d], k, U, F);
            throw new TypeError("val must be string, number or Buffer");
          }
          function V(l, d, k, U, F) {
            var W, he = 1, je = l.length, Re = d.length;
            if (U !== void 0 && ((U = String(U).toLowerCase()) === "ucs2" || U === "ucs-2" || U === "utf16le" || U === "utf-16le")) {
              if (l.length < 2 || d.length < 2) return -1;
              he = 2, je /= 2, Re /= 2, k /= 2;
            }
            function Xe(Jt, kt) {
              return he === 1 ? Jt[kt] : Jt.readUInt16BE(kt * he);
            }
            if (F) {
              var He = -1;
              for (W = k; W < je; W++) if (Xe(l, W) === Xe(d, He === -1 ? 0 : W - He)) {
                if (He === -1 && (He = W), W - He + 1 === Re) return He * he;
              } else He !== -1 && (W -= W - He), He = -1;
            } else for (k + Re > je && (k = je - Re), W = k; W >= 0; W--) {
              for (var At = !0, wt = 0; wt < Re; wt++) if (Xe(l, W + wt) !== Xe(d, wt)) {
                At = !1;
                break;
              }
              if (At) return W;
            }
            return -1;
          }
          function R(l, d, k, U) {
            k = Number(k) || 0;
            var F = l.length - k;
            U ? (U = Number(U)) > F && (U = F) : U = F;
            var W = d.length;
            if (W % 2 != 0) throw new TypeError("Invalid hex string");
            U > W / 2 && (U = W / 2);
            for (var he = 0; he < U; ++he) {
              var je = parseInt(d.substr(2 * he, 2), 16);
              if (isNaN(je)) return he;
              l[k + he] = je;
            }
            return he;
          }
          function oe(l, d, k, U) {
            return me(G(d, l.length - k), l, k, U);
          }
          function Q(l, d, k, U) {
            return me(function(F) {
              for (var W = [], he = 0; he < F.length; ++he) W.push(255 & F.charCodeAt(he));
              return W;
            }(d), l, k, U);
          }
          function I(l, d, k, U) {
            return Q(l, d, k, U);
          }
          function A(l, d, k, U) {
            return me(Y(d), l, k, U);
          }
          function se(l, d, k, U) {
            return me(function(F, W) {
              for (var he, je, Re, Xe = [], He = 0; He < F.length && !((W -= 2) < 0); ++He) he = F.charCodeAt(He), je = he >> 8, Re = he % 256, Xe.push(Re), Xe.push(je);
              return Xe;
            }(d, l.length - k), l, k, U);
          }
          function le(l, d, k) {
            return d === 0 && k === l.length ? o.fromByteArray(l) : o.fromByteArray(l.slice(d, k));
          }
          function te(l, d, k) {
            k = Math.min(l.length, k);
            for (var U = [], F = d; F < k; ) {
              var W, he, je, Re, Xe = l[F], He = null, At = Xe > 239 ? 4 : Xe > 223 ? 3 : Xe > 191 ? 2 : 1;
              if (F + At <= k) switch (At) {
                case 1:
                  Xe < 128 && (He = Xe);
                  break;
                case 2:
                  (192 & (W = l[F + 1])) == 128 && (Re = (31 & Xe) << 6 | 63 & W) > 127 && (He = Re);
                  break;
                case 3:
                  W = l[F + 1], he = l[F + 2], (192 & W) == 128 && (192 & he) == 128 && (Re = (15 & Xe) << 12 | (63 & W) << 6 | 63 & he) > 2047 && (Re < 55296 || Re > 57343) && (He = Re);
                  break;
                case 4:
                  W = l[F + 1], he = l[F + 2], je = l[F + 3], (192 & W) == 128 && (192 & he) == 128 && (192 & je) == 128 && (Re = (15 & Xe) << 18 | (63 & W) << 12 | (63 & he) << 6 | 63 & je) > 65535 && Re < 1114112 && (He = Re);
              }
              He === null ? (He = 65533, At = 1) : He > 65535 && (He -= 65536, U.push(He >>> 10 & 1023 | 55296), He = 56320 | 1023 & He), U.push(He), F += At;
            }
            return function(wt) {
              var Jt = wt.length;
              if (Jt <= 4096) return String.fromCharCode.apply(String, wt);
              for (var kt = "", gt = 0; gt < Jt; ) kt += String.fromCharCode.apply(String, wt.slice(gt, gt += 4096));
              return kt;
            }(U);
          }
          a.Buffer = y, a.SlowBuffer = function(l) {
            return +l != l && (l = 0), y.alloc(+l);
          }, a.INSPECT_MAX_BYTES = 50, y.TYPED_ARRAY_SUPPORT = c.TYPED_ARRAY_SUPPORT !== void 0 ? c.TYPED_ARRAY_SUPPORT : function() {
            try {
              var l = new Uint8Array(1);
              return l.__proto__ = { __proto__: Uint8Array.prototype, foo: function() {
                return 42;
              } }, l.foo() === 42 && typeof l.subarray == "function" && l.subarray(1, 1).byteLength === 0;
            } catch {
              return !1;
            }
          }(), a.kMaxLength = g(), y.poolSize = 8192, y._augment = function(l) {
            return l.__proto__ = y.prototype, l;
          }, y.from = function(l, d, k) {
            return C(null, l, d, k);
          }, y.TYPED_ARRAY_SUPPORT && (y.prototype.__proto__ = Uint8Array.prototype, y.__proto__ = Uint8Array, typeof Symbol < "u" && Symbol.species && y[Symbol.species] === y && Object.defineProperty(y, Symbol.species, { value: null, configurable: !0 })), y.alloc = function(l, d, k) {
            return function(U, F, W, he) {
              return T(F), F <= 0 ? v(U, F) : W !== void 0 ? typeof he == "string" ? v(U, F).fill(W, he) : v(U, F).fill(W) : v(U, F);
            }(null, l, d, k);
          }, y.allocUnsafe = function(l) {
            return P(null, l);
          }, y.allocUnsafeSlow = function(l) {
            return P(null, l);
          }, y.isBuffer = function(l) {
            return !(l == null || !l._isBuffer);
          }, y.compare = function(l, d) {
            if (!y.isBuffer(l) || !y.isBuffer(d)) throw new TypeError("Arguments must be Buffers");
            if (l === d) return 0;
            for (var k = l.length, U = d.length, F = 0, W = Math.min(k, U); F < W; ++F) if (l[F] !== d[F]) {
              k = l[F], U = d[F];
              break;
            }
            return k < U ? -1 : U < k ? 1 : 0;
          }, y.isEncoding = function(l) {
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
          }, y.concat = function(l, d) {
            if (!m(l)) throw new TypeError('"list" argument must be an Array of Buffers');
            if (l.length === 0) return y.alloc(0);
            var k;
            if (d === void 0) for (d = 0, k = 0; k < l.length; ++k) d += l[k].length;
            var U = y.allocUnsafe(d), F = 0;
            for (k = 0; k < l.length; ++k) {
              var W = l[k];
              if (!y.isBuffer(W)) throw new TypeError('"list" argument must be an Array of Buffers');
              W.copy(U, F), F += W.length;
            }
            return U;
          }, y.byteLength = j, y.prototype._isBuffer = !0, y.prototype.swap16 = function() {
            var l = this.length;
            if (l % 2 != 0) throw new RangeError("Buffer size must be a multiple of 16-bits");
            for (var d = 0; d < l; d += 2) N(this, d, d + 1);
            return this;
          }, y.prototype.swap32 = function() {
            var l = this.length;
            if (l % 4 != 0) throw new RangeError("Buffer size must be a multiple of 32-bits");
            for (var d = 0; d < l; d += 4) N(this, d, d + 3), N(this, d + 1, d + 2);
            return this;
          }, y.prototype.swap64 = function() {
            var l = this.length;
            if (l % 8 != 0) throw new RangeError("Buffer size must be a multiple of 64-bits");
            for (var d = 0; d < l; d += 8) N(this, d, d + 7), N(this, d + 1, d + 6), N(this, d + 2, d + 5), N(this, d + 3, d + 4);
            return this;
          }, y.prototype.toString = function() {
            var l = 0 | this.length;
            return l === 0 ? "" : arguments.length === 0 ? te(this, 0, l) : B.apply(this, arguments);
          }, y.prototype.equals = function(l) {
            if (!y.isBuffer(l)) throw new TypeError("Argument must be a Buffer");
            return this === l || y.compare(this, l) === 0;
          }, y.prototype.inspect = function() {
            var l = "", d = a.INSPECT_MAX_BYTES;
            return this.length > 0 && (l = this.toString("hex", 0, d).match(/.{2}/g).join(" "), this.length > d && (l += " ... ")), "<Buffer " + l + ">";
          }, y.prototype.compare = function(l, d, k, U, F) {
            if (!y.isBuffer(l)) throw new TypeError("Argument must be a Buffer");
            if (d === void 0 && (d = 0), k === void 0 && (k = l ? l.length : 0), U === void 0 && (U = 0), F === void 0 && (F = this.length), d < 0 || k > l.length || U < 0 || F > this.length) throw new RangeError("out of range index");
            if (U >= F && d >= k) return 0;
            if (U >= F) return -1;
            if (d >= k) return 1;
            if (this === l) return 0;
            for (var W = (F >>>= 0) - (U >>>= 0), he = (k >>>= 0) - (d >>>= 0), je = Math.min(W, he), Re = this.slice(U, F), Xe = l.slice(d, k), He = 0; He < je; ++He) if (Re[He] !== Xe[He]) {
              W = Re[He], he = Xe[He];
              break;
            }
            return W < he ? -1 : he < W ? 1 : 0;
          }, y.prototype.includes = function(l, d, k) {
            return this.indexOf(l, d, k) !== -1;
          }, y.prototype.indexOf = function(l, d, k) {
            return M(this, l, d, k, !0);
          }, y.prototype.lastIndexOf = function(l, d, k) {
            return M(this, l, d, k, !1);
          }, y.prototype.write = function(l, d, k, U) {
            if (d === void 0) U = "utf8", k = this.length, d = 0;
            else if (k === void 0 && typeof d == "string") U = d, k = this.length, d = 0;
            else {
              if (!isFinite(d)) throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
              d |= 0, isFinite(k) ? (k |= 0, U === void 0 && (U = "utf8")) : (U = k, k = void 0);
            }
            var F = this.length - d;
            if ((k === void 0 || k > F) && (k = F), l.length > 0 && (k < 0 || d < 0) || d > this.length) throw new RangeError("Attempt to write outside buffer bounds");
            U || (U = "utf8");
            for (var W = !1; ; ) switch (U) {
              case "hex":
                return R(this, l, d, k);
              case "utf8":
              case "utf-8":
                return oe(this, l, d, k);
              case "ascii":
                return Q(this, l, d, k);
              case "latin1":
              case "binary":
                return I(this, l, d, k);
              case "base64":
                return A(this, l, d, k);
              case "ucs2":
              case "ucs-2":
              case "utf16le":
              case "utf-16le":
                return se(this, l, d, k);
              default:
                if (W) throw new TypeError("Unknown encoding: " + U);
                U = ("" + U).toLowerCase(), W = !0;
            }
          }, y.prototype.toJSON = function() {
            return { type: "Buffer", data: Array.prototype.slice.call(this._arr || this, 0) };
          };
          function ce(l, d, k) {
            var U = "";
            k = Math.min(l.length, k);
            for (var F = d; F < k; ++F) U += String.fromCharCode(127 & l[F]);
            return U;
          }
          function ye(l, d, k) {
            var U = "";
            k = Math.min(l.length, k);
            for (var F = d; F < k; ++F) U += String.fromCharCode(l[F]);
            return U;
          }
          function J(l, d, k) {
            var U = l.length;
            (!d || d < 0) && (d = 0), (!k || k < 0 || k > U) && (k = U);
            for (var F = "", W = d; W < k; ++W) F += Je(l[W]);
            return F;
          }
          function fe(l, d, k) {
            for (var U = l.slice(d, k), F = "", W = 0; W < U.length; W += 2) F += String.fromCharCode(U[W] + 256 * U[W + 1]);
            return F;
          }
          function D(l, d, k) {
            if (l % 1 != 0 || l < 0) throw new RangeError("offset is not uint");
            if (l + d > k) throw new RangeError("Trying to access beyond buffer length");
          }
          function ie(l, d, k, U, F, W) {
            if (!y.isBuffer(l)) throw new TypeError('"buffer" argument must be a Buffer instance');
            if (d > F || d < W) throw new RangeError('"value" argument is out of bounds');
            if (k + U > l.length) throw new RangeError("Index out of range");
          }
          function be(l, d, k, U) {
            d < 0 && (d = 65535 + d + 1);
            for (var F = 0, W = Math.min(l.length - k, 2); F < W; ++F) l[k + F] = (d & 255 << 8 * (U ? F : 1 - F)) >>> 8 * (U ? F : 1 - F);
          }
          function Ce(l, d, k, U) {
            d < 0 && (d = 4294967295 + d + 1);
            for (var F = 0, W = Math.min(l.length - k, 4); F < W; ++F) l[k + F] = d >>> 8 * (U ? F : 3 - F) & 255;
          }
          function ke(l, d, k, U, F, W) {
            if (k + U > l.length) throw new RangeError("Index out of range");
            if (k < 0) throw new RangeError("Index out of range");
          }
          function Ne(l, d, k, U, F) {
            return F || ke(l, 0, k, 4), x.write(l, d, k, U, 23, 4), k + 4;
          }
          function xe(l, d, k, U, F) {
            return F || ke(l, 0, k, 8), x.write(l, d, k, U, 52, 8), k + 8;
          }
          y.prototype.slice = function(l, d) {
            var k, U = this.length;
            if ((l = ~~l) < 0 ? (l += U) < 0 && (l = 0) : l > U && (l = U), (d = d === void 0 ? U : ~~d) < 0 ? (d += U) < 0 && (d = 0) : d > U && (d = U), d < l && (d = l), y.TYPED_ARRAY_SUPPORT) (k = this.subarray(l, d)).__proto__ = y.prototype;
            else {
              var F = d - l;
              k = new y(F, void 0);
              for (var W = 0; W < F; ++W) k[W] = this[W + l];
            }
            return k;
          }, y.prototype.readUIntLE = function(l, d, k) {
            l |= 0, d |= 0, k || D(l, d, this.length);
            for (var U = this[l], F = 1, W = 0; ++W < d && (F *= 256); ) U += this[l + W] * F;
            return U;
          }, y.prototype.readUIntBE = function(l, d, k) {
            l |= 0, d |= 0, k || D(l, d, this.length);
            for (var U = this[l + --d], F = 1; d > 0 && (F *= 256); ) U += this[l + --d] * F;
            return U;
          }, y.prototype.readUInt8 = function(l, d) {
            return d || D(l, 1, this.length), this[l];
          }, y.prototype.readUInt16LE = function(l, d) {
            return d || D(l, 2, this.length), this[l] | this[l + 1] << 8;
          }, y.prototype.readUInt16BE = function(l, d) {
            return d || D(l, 2, this.length), this[l] << 8 | this[l + 1];
          }, y.prototype.readUInt32LE = function(l, d) {
            return d || D(l, 4, this.length), (this[l] | this[l + 1] << 8 | this[l + 2] << 16) + 16777216 * this[l + 3];
          }, y.prototype.readUInt32BE = function(l, d) {
            return d || D(l, 4, this.length), 16777216 * this[l] + (this[l + 1] << 16 | this[l + 2] << 8 | this[l + 3]);
          }, y.prototype.readIntLE = function(l, d, k) {
            l |= 0, d |= 0, k || D(l, d, this.length);
            for (var U = this[l], F = 1, W = 0; ++W < d && (F *= 256); ) U += this[l + W] * F;
            return U >= (F *= 128) && (U -= Math.pow(2, 8 * d)), U;
          }, y.prototype.readIntBE = function(l, d, k) {
            l |= 0, d |= 0, k || D(l, d, this.length);
            for (var U = d, F = 1, W = this[l + --U]; U > 0 && (F *= 256); ) W += this[l + --U] * F;
            return W >= (F *= 128) && (W -= Math.pow(2, 8 * d)), W;
          }, y.prototype.readInt8 = function(l, d) {
            return d || D(l, 1, this.length), 128 & this[l] ? -1 * (255 - this[l] + 1) : this[l];
          }, y.prototype.readInt16LE = function(l, d) {
            d || D(l, 2, this.length);
            var k = this[l] | this[l + 1] << 8;
            return 32768 & k ? 4294901760 | k : k;
          }, y.prototype.readInt16BE = function(l, d) {
            d || D(l, 2, this.length);
            var k = this[l + 1] | this[l] << 8;
            return 32768 & k ? 4294901760 | k : k;
          }, y.prototype.readInt32LE = function(l, d) {
            return d || D(l, 4, this.length), this[l] | this[l + 1] << 8 | this[l + 2] << 16 | this[l + 3] << 24;
          }, y.prototype.readInt32BE = function(l, d) {
            return d || D(l, 4, this.length), this[l] << 24 | this[l + 1] << 16 | this[l + 2] << 8 | this[l + 3];
          }, y.prototype.readFloatLE = function(l, d) {
            return d || D(l, 4, this.length), x.read(this, l, !0, 23, 4);
          }, y.prototype.readFloatBE = function(l, d) {
            return d || D(l, 4, this.length), x.read(this, l, !1, 23, 4);
          }, y.prototype.readDoubleLE = function(l, d) {
            return d || D(l, 8, this.length), x.read(this, l, !0, 52, 8);
          }, y.prototype.readDoubleBE = function(l, d) {
            return d || D(l, 8, this.length), x.read(this, l, !1, 52, 8);
          }, y.prototype.writeUIntLE = function(l, d, k, U) {
            l = +l, d |= 0, k |= 0, U || ie(this, l, d, k, Math.pow(2, 8 * k) - 1, 0);
            var F = 1, W = 0;
            for (this[d] = 255 & l; ++W < k && (F *= 256); ) this[d + W] = l / F & 255;
            return d + k;
          }, y.prototype.writeUIntBE = function(l, d, k, U) {
            l = +l, d |= 0, k |= 0, U || ie(this, l, d, k, Math.pow(2, 8 * k) - 1, 0);
            var F = k - 1, W = 1;
            for (this[d + F] = 255 & l; --F >= 0 && (W *= 256); ) this[d + F] = l / W & 255;
            return d + k;
          }, y.prototype.writeUInt8 = function(l, d, k) {
            return l = +l, d |= 0, k || ie(this, l, d, 1, 255, 0), y.TYPED_ARRAY_SUPPORT || (l = Math.floor(l)), this[d] = 255 & l, d + 1;
          }, y.prototype.writeUInt16LE = function(l, d, k) {
            return l = +l, d |= 0, k || ie(this, l, d, 2, 65535, 0), y.TYPED_ARRAY_SUPPORT ? (this[d] = 255 & l, this[d + 1] = l >>> 8) : be(this, l, d, !0), d + 2;
          }, y.prototype.writeUInt16BE = function(l, d, k) {
            return l = +l, d |= 0, k || ie(this, l, d, 2, 65535, 0), y.TYPED_ARRAY_SUPPORT ? (this[d] = l >>> 8, this[d + 1] = 255 & l) : be(this, l, d, !1), d + 2;
          }, y.prototype.writeUInt32LE = function(l, d, k) {
            return l = +l, d |= 0, k || ie(this, l, d, 4, 4294967295, 0), y.TYPED_ARRAY_SUPPORT ? (this[d + 3] = l >>> 24, this[d + 2] = l >>> 16, this[d + 1] = l >>> 8, this[d] = 255 & l) : Ce(this, l, d, !0), d + 4;
          }, y.prototype.writeUInt32BE = function(l, d, k) {
            return l = +l, d |= 0, k || ie(this, l, d, 4, 4294967295, 0), y.TYPED_ARRAY_SUPPORT ? (this[d] = l >>> 24, this[d + 1] = l >>> 16, this[d + 2] = l >>> 8, this[d + 3] = 255 & l) : Ce(this, l, d, !1), d + 4;
          }, y.prototype.writeIntLE = function(l, d, k, U) {
            if (l = +l, d |= 0, !U) {
              var F = Math.pow(2, 8 * k - 1);
              ie(this, l, d, k, F - 1, -F);
            }
            var W = 0, he = 1, je = 0;
            for (this[d] = 255 & l; ++W < k && (he *= 256); ) l < 0 && je === 0 && this[d + W - 1] !== 0 && (je = 1), this[d + W] = (l / he >> 0) - je & 255;
            return d + k;
          }, y.prototype.writeIntBE = function(l, d, k, U) {
            if (l = +l, d |= 0, !U) {
              var F = Math.pow(2, 8 * k - 1);
              ie(this, l, d, k, F - 1, -F);
            }
            var W = k - 1, he = 1, je = 0;
            for (this[d + W] = 255 & l; --W >= 0 && (he *= 256); ) l < 0 && je === 0 && this[d + W + 1] !== 0 && (je = 1), this[d + W] = (l / he >> 0) - je & 255;
            return d + k;
          }, y.prototype.writeInt8 = function(l, d, k) {
            return l = +l, d |= 0, k || ie(this, l, d, 1, 127, -128), y.TYPED_ARRAY_SUPPORT || (l = Math.floor(l)), l < 0 && (l = 255 + l + 1), this[d] = 255 & l, d + 1;
          }, y.prototype.writeInt16LE = function(l, d, k) {
            return l = +l, d |= 0, k || ie(this, l, d, 2, 32767, -32768), y.TYPED_ARRAY_SUPPORT ? (this[d] = 255 & l, this[d + 1] = l >>> 8) : be(this, l, d, !0), d + 2;
          }, y.prototype.writeInt16BE = function(l, d, k) {
            return l = +l, d |= 0, k || ie(this, l, d, 2, 32767, -32768), y.TYPED_ARRAY_SUPPORT ? (this[d] = l >>> 8, this[d + 1] = 255 & l) : be(this, l, d, !1), d + 2;
          }, y.prototype.writeInt32LE = function(l, d, k) {
            return l = +l, d |= 0, k || ie(this, l, d, 4, 2147483647, -2147483648), y.TYPED_ARRAY_SUPPORT ? (this[d] = 255 & l, this[d + 1] = l >>> 8, this[d + 2] = l >>> 16, this[d + 3] = l >>> 24) : Ce(this, l, d, !0), d + 4;
          }, y.prototype.writeInt32BE = function(l, d, k) {
            return l = +l, d |= 0, k || ie(this, l, d, 4, 2147483647, -2147483648), l < 0 && (l = 4294967295 + l + 1), y.TYPED_ARRAY_SUPPORT ? (this[d] = l >>> 24, this[d + 1] = l >>> 16, this[d + 2] = l >>> 8, this[d + 3] = 255 & l) : Ce(this, l, d, !1), d + 4;
          }, y.prototype.writeFloatLE = function(l, d, k) {
            return Ne(this, l, d, !0, k);
          }, y.prototype.writeFloatBE = function(l, d, k) {
            return Ne(this, l, d, !1, k);
          }, y.prototype.writeDoubleLE = function(l, d, k) {
            return xe(this, l, d, !0, k);
          }, y.prototype.writeDoubleBE = function(l, d, k) {
            return xe(this, l, d, !1, k);
          }, y.prototype.copy = function(l, d, k, U) {
            if (k || (k = 0), U || U === 0 || (U = this.length), d >= l.length && (d = l.length), d || (d = 0), U > 0 && U < k && (U = k), U === k || l.length === 0 || this.length === 0) return 0;
            if (d < 0) throw new RangeError("targetStart out of bounds");
            if (k < 0 || k >= this.length) throw new RangeError("sourceStart out of bounds");
            if (U < 0) throw new RangeError("sourceEnd out of bounds");
            U > this.length && (U = this.length), l.length - d < U - k && (U = l.length - d + k);
            var F, W = U - k;
            if (this === l && k < d && d < U) for (F = W - 1; F >= 0; --F) l[F + d] = this[F + k];
            else if (W < 1e3 || !y.TYPED_ARRAY_SUPPORT) for (F = 0; F < W; ++F) l[F + d] = this[F + k];
            else Uint8Array.prototype.set.call(l, this.subarray(k, k + W), d);
            return W;
          }, y.prototype.fill = function(l, d, k, U) {
            if (typeof l == "string") {
              if (typeof d == "string" ? (U = d, d = 0, k = this.length) : typeof k == "string" && (U = k, k = this.length), l.length === 1) {
                var F = l.charCodeAt(0);
                F < 256 && (l = F);
              }
              if (U !== void 0 && typeof U != "string") throw new TypeError("encoding must be a string");
              if (typeof U == "string" && !y.isEncoding(U)) throw new TypeError("Unknown encoding: " + U);
            } else typeof l == "number" && (l &= 255);
            if (d < 0 || this.length < d || this.length < k) throw new RangeError("Out of range index");
            if (k <= d) return this;
            var W;
            if (d >>>= 0, k = k === void 0 ? this.length : k >>> 0, l || (l = 0), typeof l == "number") for (W = d; W < k; ++W) this[W] = l;
            else {
              var he = y.isBuffer(l) ? l : G(new y(l, U).toString()), je = he.length;
              for (W = 0; W < k - d; ++W) this[W + d] = he[W % je];
            }
            return this;
          };
          var ze = /[^+\/0-9A-Za-z-_]/g;
          function Je(l) {
            return l < 16 ? "0" + l.toString(16) : l.toString(16);
          }
          function G(l, d) {
            var k;
            d = d || 1 / 0;
            for (var U = l.length, F = null, W = [], he = 0; he < U; ++he) {
              if ((k = l.charCodeAt(he)) > 55295 && k < 57344) {
                if (!F) {
                  if (k > 56319) {
                    (d -= 3) > -1 && W.push(239, 191, 189);
                    continue;
                  }
                  if (he + 1 === U) {
                    (d -= 3) > -1 && W.push(239, 191, 189);
                    continue;
                  }
                  F = k;
                  continue;
                }
                if (k < 56320) {
                  (d -= 3) > -1 && W.push(239, 191, 189), F = k;
                  continue;
                }
                k = 65536 + (F - 55296 << 10 | k - 56320);
              } else F && (d -= 3) > -1 && W.push(239, 191, 189);
              if (F = null, k < 128) {
                if ((d -= 1) < 0) break;
                W.push(k);
              } else if (k < 2048) {
                if ((d -= 2) < 0) break;
                W.push(k >> 6 | 192, 63 & k | 128);
              } else if (k < 65536) {
                if ((d -= 3) < 0) break;
                W.push(k >> 12 | 224, k >> 6 & 63 | 128, 63 & k | 128);
              } else {
                if (!(k < 1114112)) throw new Error("Invalid code point");
                if ((d -= 4) < 0) break;
                W.push(k >> 18 | 240, k >> 12 & 63 | 128, k >> 6 & 63 | 128, 63 & k | 128);
              }
            }
            return W;
          }
          function Y(l) {
            return o.toByteArray(function(d) {
              if ((d = function(k) {
                return k.trim ? k.trim() : k.replace(/^\s+|\s+$/g, "");
              }(d).replace(ze, "")).length < 2) return "";
              for (; d.length % 4 != 0; ) d += "=";
              return d;
            }(l));
          }
          function me(l, d, k, U) {
            for (var F = 0; F < U && !(F + k >= d.length || F >= l.length); ++F) d[F + k] = l[F];
            return F;
          }
        }).call(this, u(15));
      }, function(b, a, u) {
        a.byteLength = function(T) {
          var P = y(T), X = P[0], K = P[1];
          return 3 * (X + K) / 4 - K;
        }, a.toByteArray = function(T) {
          var P, X, K = y(T), j = K[0], B = K[1], N = new x(function(R, oe, Q) {
            return 3 * (oe + Q) / 4 - Q;
          }(0, j, B)), M = 0, V = B > 0 ? j - 4 : j;
          for (X = 0; X < V; X += 4) P = o[T.charCodeAt(X)] << 18 | o[T.charCodeAt(X + 1)] << 12 | o[T.charCodeAt(X + 2)] << 6 | o[T.charCodeAt(X + 3)], N[M++] = P >> 16 & 255, N[M++] = P >> 8 & 255, N[M++] = 255 & P;
          return B === 2 && (P = o[T.charCodeAt(X)] << 2 | o[T.charCodeAt(X + 1)] >> 4, N[M++] = 255 & P), B === 1 && (P = o[T.charCodeAt(X)] << 10 | o[T.charCodeAt(X + 1)] << 4 | o[T.charCodeAt(X + 2)] >> 2, N[M++] = P >> 8 & 255, N[M++] = 255 & P), N;
        }, a.fromByteArray = function(T) {
          for (var P, X = T.length, K = X % 3, j = [], B = 0, N = X - K; B < N; B += 16383) j.push(C(T, B, B + 16383 > N ? N : B + 16383));
          return K === 1 ? (P = T[X - 1], j.push(c[P >> 2] + c[P << 4 & 63] + "==")) : K === 2 && (P = (T[X - 2] << 8) + T[X - 1], j.push(c[P >> 10] + c[P >> 4 & 63] + c[P << 2 & 63] + "=")), j.join("");
        };
        for (var c = [], o = [], x = typeof Uint8Array < "u" ? Uint8Array : Array, m = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", g = 0, v = m.length; g < v; ++g) c[g] = m[g], o[m.charCodeAt(g)] = g;
        function y(T) {
          var P = T.length;
          if (P % 4 > 0) throw new Error("Invalid string. Length must be a multiple of 4");
          var X = T.indexOf("=");
          return X === -1 && (X = P), [X, X === P ? 0 : 4 - X % 4];
        }
        function C(T, P, X) {
          for (var K, j, B = [], N = P; N < X; N += 3) K = (T[N] << 16 & 16711680) + (T[N + 1] << 8 & 65280) + (255 & T[N + 2]), B.push(c[(j = K) >> 18 & 63] + c[j >> 12 & 63] + c[j >> 6 & 63] + c[63 & j]);
          return B.join("");
        }
        o[45] = 62, o[95] = 63;
      }, function(b, a) {
        a.read = function(u, c, o, x, m) {
          var g, v, y = 8 * m - x - 1, C = (1 << y) - 1, T = C >> 1, P = -7, X = o ? m - 1 : 0, K = o ? -1 : 1, j = u[c + X];
          for (X += K, g = j & (1 << -P) - 1, j >>= -P, P += y; P > 0; g = 256 * g + u[c + X], X += K, P -= 8) ;
          for (v = g & (1 << -P) - 1, g >>= -P, P += x; P > 0; v = 256 * v + u[c + X], X += K, P -= 8) ;
          if (g === 0) g = 1 - T;
          else {
            if (g === C) return v ? NaN : 1 / 0 * (j ? -1 : 1);
            v += Math.pow(2, x), g -= T;
          }
          return (j ? -1 : 1) * v * Math.pow(2, g - x);
        }, a.write = function(u, c, o, x, m, g) {
          var v, y, C, T = 8 * g - m - 1, P = (1 << T) - 1, X = P >> 1, K = m === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0, j = x ? 0 : g - 1, B = x ? 1 : -1, N = c < 0 || c === 0 && 1 / c < 0 ? 1 : 0;
          for (c = Math.abs(c), isNaN(c) || c === 1 / 0 ? (y = isNaN(c) ? 1 : 0, v = P) : (v = Math.floor(Math.log(c) / Math.LN2), c * (C = Math.pow(2, -v)) < 1 && (v--, C *= 2), (c += v + X >= 1 ? K / C : K * Math.pow(2, 1 - X)) * C >= 2 && (v++, C /= 2), v + X >= P ? (y = 0, v = P) : v + X >= 1 ? (y = (c * C - 1) * Math.pow(2, m), v += X) : (y = c * Math.pow(2, X - 1) * Math.pow(2, m), v = 0)); m >= 8; u[o + j] = 255 & y, j += B, y /= 256, m -= 8) ;
          for (v = v << m | y, T += m; T > 0; u[o + j] = 255 & v, j += B, v /= 256, T -= 8) ;
          u[o + j - B] |= 128 * N;
        };
      }, function(b, a) {
        var u = {}.toString;
        b.exports = Array.isArray || function(c) {
          return u.call(c) == "[object Array]";
        };
      }, function(b, a, u) {
        Object.defineProperty(a, "__esModule", { value: !0 }), a.arrayToString = void 0, a.arrayToString = (c, o, x) => {
          const m = c.map(function(v, y) {
            const C = x(v, y);
            return C === void 0 ? String(C) : o + C.split(`
`).join(`
` + o);
          }).join(o ? `,
` : ","), g = o && m ? `
` : "";
          return `[${g}${m}${g}]`;
        };
      }, function(b, a, u) {
        function c(j) {
          return (c = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(B) {
            return typeof B;
          } : function(B) {
            return B && typeof Symbol == "function" && B.constructor === Symbol && B !== Symbol.prototype ? "symbol" : typeof B;
          })(j);
        }
        Object.defineProperty(a, "__esModule", { value: !0 }), a.matchesSelector = T, a.matchesSelectorAndParentsTo = function(j, B, N) {
          var M = j;
          do {
            if (T(M, B)) return !0;
            if (M === N) return !1;
            M = M.parentNode;
          } while (M);
          return !1;
        }, a.addEvent = function(j, B, N, M) {
          if (j) {
            var V = v({ capture: !0 }, M);
            j.addEventListener ? j.addEventListener(B, N, V) : j.attachEvent ? j.attachEvent("on" + B, N) : j["on" + B] = N;
          }
        }, a.removeEvent = function(j, B, N, M) {
          if (j) {
            var V = v({ capture: !0 }, M);
            j.removeEventListener ? j.removeEventListener(B, N, V) : j.detachEvent ? j.detachEvent("on" + B, N) : j["on" + B] = null;
          }
        }, a.outerHeight = function(j) {
          var B = j.clientHeight, N = j.ownerDocument.defaultView.getComputedStyle(j);
          return B += (0, o.int)(N.borderTopWidth), B += (0, o.int)(N.borderBottomWidth);
        }, a.outerWidth = function(j) {
          var B = j.clientWidth, N = j.ownerDocument.defaultView.getComputedStyle(j);
          return B += (0, o.int)(N.borderLeftWidth), B += (0, o.int)(N.borderRightWidth);
        }, a.innerHeight = function(j) {
          var B = j.clientHeight, N = j.ownerDocument.defaultView.getComputedStyle(j);
          return B -= (0, o.int)(N.paddingTop), B -= (0, o.int)(N.paddingBottom);
        }, a.innerWidth = function(j) {
          var B = j.clientWidth, N = j.ownerDocument.defaultView.getComputedStyle(j);
          return B -= (0, o.int)(N.paddingLeft), B -= (0, o.int)(N.paddingRight);
        }, a.offsetXYFromParent = function(j, B, N) {
          var M = B === B.ownerDocument.body ? { left: 0, top: 0 } : B.getBoundingClientRect(), V = (j.clientX + B.scrollLeft - M.left) / N, R = (j.clientY + B.scrollTop - M.top) / N;
          return { x: V, y: R };
        }, a.createCSSTransform = function(j, B) {
          var N = P(j, B, "px");
          return y({}, (0, x.browserPrefixToKey)("transform", x.default), N);
        }, a.createSVGTransform = function(j, B) {
          return P(j, B, "");
        }, a.getTranslation = P, a.getTouch = function(j, B) {
          return j.targetTouches && (0, o.findInArray)(j.targetTouches, function(N) {
            return B === N.identifier;
          }) || j.changedTouches && (0, o.findInArray)(j.changedTouches, function(N) {
            return B === N.identifier;
          });
        }, a.getTouchIdentifier = function(j) {
          if (j.targetTouches && j.targetTouches[0]) return j.targetTouches[0].identifier;
          if (j.changedTouches && j.changedTouches[0]) return j.changedTouches[0].identifier;
        }, a.addUserSelectStyles = function(j) {
          if (j) {
            var B = j.getElementById("react-draggable-style-el");
            B || ((B = j.createElement("style")).type = "text/css", B.id = "react-draggable-style-el", B.innerHTML = `.react-draggable-transparent-selection *::-moz-selection {all: inherit;}
`, B.innerHTML += `.react-draggable-transparent-selection *::selection {all: inherit;}
`, j.getElementsByTagName("head")[0].appendChild(B)), j.body && X(j.body, "react-draggable-transparent-selection");
          }
        }, a.removeUserSelectStyles = function(j) {
          if (j)
            try {
              if (j.body && K(j.body, "react-draggable-transparent-selection"), j.selection) j.selection.empty();
              else {
                var B = (j.defaultView || window).getSelection();
                B && B.type !== "Caret" && B.removeAllRanges();
              }
            } catch {
            }
        }, a.addClassName = X, a.removeClassName = K;
        var o = u(20), x = function(j) {
          if (j && j.__esModule) return j;
          if (j === null || c(j) !== "object" && typeof j != "function") return { default: j };
          var B = m();
          if (B && B.has(j)) return B.get(j);
          var N = {}, M = Object.defineProperty && Object.getOwnPropertyDescriptor;
          for (var V in j) if (Object.prototype.hasOwnProperty.call(j, V)) {
            var R = M ? Object.getOwnPropertyDescriptor(j, V) : null;
            R && (R.get || R.set) ? Object.defineProperty(N, V, R) : N[V] = j[V];
          }
          return N.default = j, B && B.set(j, N), N;
        }(u(56));
        function m() {
          if (typeof WeakMap != "function") return null;
          var j = /* @__PURE__ */ new WeakMap();
          return m = function() {
            return j;
          }, j;
        }
        function g(j, B) {
          var N = Object.keys(j);
          if (Object.getOwnPropertySymbols) {
            var M = Object.getOwnPropertySymbols(j);
            B && (M = M.filter(function(V) {
              return Object.getOwnPropertyDescriptor(j, V).enumerable;
            })), N.push.apply(N, M);
          }
          return N;
        }
        function v(j) {
          for (var B = 1; B < arguments.length; B++) {
            var N = arguments[B] != null ? arguments[B] : {};
            B % 2 ? g(Object(N), !0).forEach(function(M) {
              y(j, M, N[M]);
            }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(j, Object.getOwnPropertyDescriptors(N)) : g(Object(N)).forEach(function(M) {
              Object.defineProperty(j, M, Object.getOwnPropertyDescriptor(N, M));
            });
          }
          return j;
        }
        function y(j, B, N) {
          return B in j ? Object.defineProperty(j, B, { value: N, enumerable: !0, configurable: !0, writable: !0 }) : j[B] = N, j;
        }
        var C = "";
        function T(j, B) {
          return C || (C = (0, o.findInArray)(["matches", "webkitMatchesSelector", "mozMatchesSelector", "msMatchesSelector", "oMatchesSelector"], function(N) {
            return (0, o.isFunction)(j[N]);
          })), !!(0, o.isFunction)(j[C]) && j[C](B);
        }
        function P(j, B, N) {
          var M = j.x, V = j.y, R = "translate(".concat(M).concat(N, ",").concat(V).concat(N, ")");
          if (B) {
            var oe = "".concat(typeof B.x == "string" ? B.x : B.x + N), Q = "".concat(typeof B.y == "string" ? B.y : B.y + N);
            R = "translate(".concat(oe, ", ").concat(Q, ")") + R;
          }
          return R;
        }
        function X(j, B) {
          j.classList ? j.classList.add(B) : j.className.match(new RegExp("(?:^|\\s)".concat(B, "(?!\\S)"))) || (j.className += " ".concat(B));
        }
        function K(j, B) {
          j.classList ? j.classList.remove(B) : j.className = j.className.replace(new RegExp("(?:^|\\s)".concat(B, "(?!\\S)"), "g"), "");
        }
      }, function(b, a) {
        b.exports = function(u) {
          return u.webpackPolyfill || (u.deprecate = function() {
          }, u.paths = [], u.children || (u.children = []), Object.defineProperty(u, "loaded", { enumerable: !0, get: function() {
            return u.l;
          } }), Object.defineProperty(u, "id", { enumerable: !0, get: function() {
            return u.i;
          } }), u.webpackPolyfill = 1), u;
        };
      }, function(b, a, u) {
        var c = u(6), o = u(35);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[b.i, o, ""]]);
        var x = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, x), b.exports = o.locals || {};
      }, function(b, a, u) {
        (b.exports = u(7)(!1)).push([b.i, `.ck-inspector{--ck-inspector-color-tree-node-hover:#eaf2fb;--ck-inspector-color-tree-node-name:#882680;--ck-inspector-color-tree-node-attribute-name:#8a8a8a;--ck-inspector-color-tree-node-tag:#aaa;--ck-inspector-color-tree-node-attribute:#9a4819;--ck-inspector-color-tree-node-attribute-value:#2a43ac;--ck-inspector-color-tree-text-border:#b7b7b7;--ck-inspector-color-tree-node-border-hover:#b0c6e0;--ck-inspector-color-tree-content-delimiter:#ddd;--ck-inspector-color-tree-node-active-bg:#f5faff;--ck-inspector-color-tree-node-name-active-bg:#2b98f0;--ck-inspector-color-tree-node-inactive:#8a8a8a;--ck-inspector-color-tree-selection:#ff1744;--ck-inspector-color-tree-position:#000;--ck-inspector-color-comment:green}.ck-inspector .ck-inspector-tree{background:var(--ck-inspector-color-white);padding:1em;width:100%;height:100%;overflow:auto;user-select:none}.ck-inspector-tree .ck-inspector-tree-node__attribute{font:inherit;margin-left:.4em;color:var(--ck-inspector-color-tree-node-tag)}.ck-inspector-tree .ck-inspector-tree-node__attribute .ck-inspector-tree-node__attribute__name{color:var(--ck-inspector-color-tree-node-attribute)}.ck-inspector-tree .ck-inspector-tree-node__attribute .ck-inspector-tree-node__attribute__value{color:var(--ck-inspector-color-tree-node-attribute-value)}.ck-inspector-tree .ck-inspector-tree-node__attribute .ck-inspector-tree-node__attribute__value:before{content:'="'}.ck-inspector-tree .ck-inspector-tree-node__attribute .ck-inspector-tree-node__attribute__value:after{content:'"'}.ck-inspector-tree .ck-inspector-tree-node .ck-inspector-tree-node__name{color:var(--ck-inspector-color-tree-node-name);display:inline-block;width:100%;padding:0 .1em;border-left:1px solid transparent}.ck-inspector-tree .ck-inspector-tree-node .ck-inspector-tree-node__name:hover{background:var(--ck-inspector-color-tree-node-hover)}.ck-inspector-tree .ck-inspector-tree-node .ck-inspector-tree-node__content{padding:1px .5em 1px 1.5em;border-left:1px solid var(--ck-inspector-color-tree-content-delimiter);white-space:pre-wrap}.ck-inspector-tree .ck-inspector-tree-node:not(.ck-inspector-tree-node_tagless) .ck-inspector-tree-node__name>.ck-inspector-tree-node__name__bracket_open:after{content:"<";color:var(--ck-inspector-color-tree-node-tag)}.ck-inspector-tree .ck-inspector-tree-node:not(.ck-inspector-tree-node_tagless) .ck-inspector-tree-node__name .ck-inspector-tree-node__name__bracket_close:after{content:">";color:var(--ck-inspector-color-tree-node-tag)}.ck-inspector-tree .ck-inspector-tree-node:not(.ck-inspector-tree-node_tagless).ck-inspector-tree-node_empty .ck-inspector-tree-node__name:after{content:" />"}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_tagless .ck-inspector-tree-node__content{display:none}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name:not(.ck-inspector-tree-node__name_close),.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name:not(.ck-inspector-tree-node__name_close) :not(.ck-inspector-tree__position),.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name:not(.ck-inspector-tree-node__name_close)>.ck-inspector-tree-node__name__bracket:after{background:var(--ck-inspector-color-tree-node-name-active-bg);color:var(--ck-inspector-color-white)}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__content,.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name_close{background:var(--ck-inspector-color-tree-node-active-bg)}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__content{border-left-color:var(--ck-inspector-color-tree-node-name-active-bg)}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name{border-left:1px solid var(--ck-inspector-color-tree-node-name-active-bg)}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_disabled{opacity:.8}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_disabled .ck-inspector-tree-node__name,.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_disabled .ck-inspector-tree-node__name *{color:var(--ck-inspector-color-tree-node-inactive)}.ck-inspector-tree .ck-inspector-tree-text{display:block;margin-bottom:1px}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-node__content{border:1px dotted var(--ck-inspector-color-tree-text-border);border-radius:2px;padding:0 1px;margin-right:1px;display:inline-block;word-break:break-all}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes:not(:empty){margin-right:.5em}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes .ck-inspector-tree-node__attribute{background:var(--ck-inspector-color-tree-node-attribute-name);border-radius:2px;padding:0 .5em}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes .ck-inspector-tree-node__attribute+.ck-inspector-tree-node__attribute{margin-left:.2em}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes .ck-inspector-tree-node__attribute>*{color:var(--ck-inspector-color-white)}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes .ck-inspector-tree-node__attribute:first-child{margin-left:0}.ck-inspector-tree .ck-inspector-tree-text.ck-inspector-tree-node_active .ck-inspector-tree-node__content{border-style:solid;border-color:var(--ck-inspector-color-tree-node-name-active-bg)}.ck-inspector-tree .ck-inspector-tree-text.ck-inspector-tree-node_active .ck-inspector-tree-node__attribute{background:var(--ck-inspector-color-white)}.ck-inspector-tree .ck-inspector-tree-text.ck-inspector-tree-node_active .ck-inspector-tree-node__attribute>*{color:var(--ck-inspector-color-tree-node-name-active-bg)}.ck-inspector-tree .ck-inspector-tree-text.ck-inspector-tree-node_active>.ck-inspector-tree-node__content{background:var(--ck-inspector-color-tree-node-name-active-bg);color:var(--ck-inspector-color-white)}.ck-inspector-tree .ck-inspector-tree-text:not(.ck-inspector-tree-node_active) .ck-inspector-tree-node__content:hover{background:var(--ck-inspector-color-tree-node-hover);border-style:solid;border-color:var(--ck-inspector-color-tree-node-border-hover)}.ck-inspector-tree.ck-inspector-tree_text-direction_ltr .ck-inspector-tree-node__content{direction:ltr}.ck-inspector-tree.ck-inspector-tree_text-direction_rtl .ck-inspector-tree-node__content{direction:rtl}.ck-inspector-tree.ck-inspector-tree_text-direction_rtl .ck-inspector-tree-node__content .ck-inspector-tree-node__name{direction:ltr}.ck-inspector-tree.ck-inspector-tree_text-direction_rtl .ck-inspector-tree__position{transform:rotate(180deg)}.ck-inspector-tree .ck-inspector-tree-comment{color:var(--ck-inspector-color-comment);font-style:italic}.ck-inspector-tree .ck-inspector-tree-comment a{color:inherit;text-decoration:underline}.ck-inspector-tree_compact-text .ck-inspector-tree-text,.ck-inspector-tree_compact-text .ck-inspector-tree-text .ck-inspector-tree-node__content{display:inline}.ck-inspector .ck-inspector__tree__navigation{padding:.5em 1em;border-bottom:1px solid var(--ck-inspector-color-border)}.ck-inspector .ck-inspector__tree__navigation label{margin-right:.5em}.ck-inspector-tree .ck-inspector-tree__position{display:inline-block;position:relative;cursor:default;height:100%;pointer-events:none;vertical-align:top}.ck-inspector-tree .ck-inspector-tree__position:after{content:"";position:absolute;border:1px solid var(--ck-inspector-color-tree-position);width:0;top:0;bottom:0;margin-left:-1px}.ck-inspector-tree .ck-inspector-tree__position:before{margin-left:-1px}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_selection{z-index:2;--ck-inspector-color-tree-position:var(--ck-inspector-color-tree-selection)}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_selection:before{content:"";position:absolute;top:-1px;bottom:-1px;left:0;border-top:2px solid var(--ck-inspector-color-tree-position);border-bottom:2px solid var(--ck-inspector-color-tree-position);width:8px}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_selection.ck-inspector-tree__position_end:before{right:-1px;left:auto}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_marker{z-index:1}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_marker:before{content:"";display:block;position:absolute;left:0;top:-1px;cursor:default;width:0;height:0;border-left:0 solid transparent;border-bottom:0 solid transparent;border-right:7px solid transparent;border-top:7px solid var(--ck-inspector-color-tree-position)}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_marker.ck-inspector-tree__position_end:before{border-width:0 7px 7px 0;border-left-color:transparent;border-bottom-color:transparent;border-right-color:var(--ck-inspector-color-tree-position);border-top-color:transparent;left:-5px}`, ""]);
      }, function(b, a, u) {
        Object.defineProperty(a, "__esModule", { value: !0 }), a.canUseDOM = a.SafeNodeList = a.SafeHTMLCollection = void 0;
        var c, o = u(82), x = ((c = o) && c.__esModule ? c : { default: c }).default, m = x.canUseDOM ? window.HTMLElement : {};
        a.SafeHTMLCollection = x.canUseDOM ? window.HTMLCollection : {}, a.SafeNodeList = x.canUseDOM ? window.NodeList : {}, a.canUseDOM = x.canUseDOM, a.default = m;
      }, function(b, a, u) {
        var c = u(6), o = u(38);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[b.i, o, ""]]);
        var x = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, x), b.exports = o.locals || {};
      }, function(b, a, u) {
        (b.exports = u(7)(!1)).push([b.i, `.ck-inspector,.ck-inspector-portal{--ck-inspector-color-white:#fff;--ck-inspector-color-black:#000;--ck-inspector-color-background:#f3f3f3;--ck-inspector-color-link:#005cc6;--ck-inspector-code-font-size:11px;--ck-inspector-code-font-family:monaco,Consolas,Lucida Console,monospace;--ck-inspector-color-border:#d0d0d0}.ck-inspector,.ck-inspector-portal,.ck-inspector-portal :not(select),.ck-inspector :not(select){box-sizing:border-box;width:auto;height:auto;position:static;margin:0;padding:0;border:0;background:transparent;text-decoration:none;transition:none;word-wrap:break-word;font-family:Arial,Helvetica Neue,Helvetica,sans-serif;font-size:12px;line-height:17px;font-weight:400;-webkit-font-smoothing:auto}.ck-inspector{overflow:hidden;border-collapse:collapse;color:var(--ck-inspector-color-black);text-align:left;white-space:normal;cursor:auto;float:none;background:var(--ck-inspector-color-background);border-top:1px solid var(--ck-inspector-color-border);z-index:9999}.ck-inspector.ck-inspector_collapsed>.ck-inspector-navbox>.ck-inspector-navbox__navigation .ck-inspector-horizontal-nav{display:none}.ck-inspector .ck-inspector-navbox__navigation__logo{background-size:contain;background-repeat:no-repeat;background-position:50%;display:block;overflow:hidden;text-indent:100px;align-self:center;white-space:nowrap;margin-right:1em;background-image:url("data:image/svg+xml;charset=utf-8,%3Csvg width='68' height='64' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M43.71 11.025a11.508 11.508 0 00-1.213 5.159c0 6.42 5.244 11.625 11.713 11.625.083 0 .167 0 .25-.002v16.282a5.464 5.464 0 01-2.756 4.739L30.986 60.7a5.548 5.548 0 01-5.512 0L4.756 48.828A5.464 5.464 0 012 44.089V20.344c0-1.955 1.05-3.76 2.756-4.738L25.474 3.733a5.548 5.548 0 015.512 0l12.724 7.292z' fill='%23FFF'/%3E%3Cpath d='M45.684 8.79a12.604 12.604 0 00-1.329 5.65c0 7.032 5.744 12.733 12.829 12.733.091 0 .183-.001.274-.003v17.834a5.987 5.987 0 01-3.019 5.19L31.747 63.196a6.076 6.076 0 01-6.037 0L3.02 50.193A5.984 5.984 0 010 45.003V18.997c0-2.14 1.15-4.119 3.019-5.19L25.71.804a6.076 6.076 0 016.037 0L45.684 8.79zm-29.44 11.89c-.834 0-1.51.671-1.51 1.498v.715c0 .828.676 1.498 1.51 1.498h25.489c.833 0 1.51-.67 1.51-1.498v-.715c0-.827-.677-1.498-1.51-1.498h-25.49zm0 9.227c-.834 0-1.51.671-1.51 1.498v.715c0 .828.676 1.498 1.51 1.498h18.479c.833 0 1.509-.67 1.509-1.498v-.715c0-.827-.676-1.498-1.51-1.498H16.244zm0 9.227c-.834 0-1.51.671-1.51 1.498v.715c0 .828.676 1.498 1.51 1.498h25.489c.833 0 1.51-.67 1.51-1.498v-.715c0-.827-.677-1.498-1.51-1.498h-25.49zm41.191-14.459c-5.835 0-10.565-4.695-10.565-10.486 0-5.792 4.73-10.487 10.565-10.487C63.27 3.703 68 8.398 68 14.19c0 5.791-4.73 10.486-10.565 10.486zm3.422-8.68c0-.467-.084-.875-.251-1.225a2.547 2.547 0 00-.686-.88 2.888 2.888 0 00-1.026-.531 4.418 4.418 0 00-1.259-.175c-.134 0-.283.006-.447.018a2.72 2.72 0 00-.446.07l.075-1.4h3.587v-1.8h-5.462l-.214 5.06c.319-.116.682-.21 1.089-.28.406-.071.77-.107 1.088-.107.218 0 .437.021.655.063.218.041.413.114.585.218s.313.244.422.419c.109.175.163.391.163.65 0 .424-.132.745-.396.961a1.434 1.434 0 01-.938.325c-.352 0-.656-.1-.912-.3-.256-.2-.43-.453-.523-.762l-1.925.588c.1.35.258.664.472.943.214.279.47.514.767.706.298.191.63.339.995.443.365.104.749.156 1.151.156.437 0 .86-.064 1.272-.193.41-.13.778-.323 1.1-.581a2.8 2.8 0 00.775-.981c.193-.396.29-.864.29-1.405z' fill='%231EBC61' fill-rule='nonzero'/%3E%3C/g%3E%3C/svg%3E");width:1.8em;height:1.8em;margin-left:1em}.ck-inspector .ck-inspector-navbox__navigation__toggle{margin-right:1em}.ck-inspector .ck-inspector-navbox__navigation__toggle.ck-inspector-navbox__navigation__toggle_up{transform:rotate(180deg)}.ck-inspector .ck-inspector-editor-selector{margin-left:auto;margin-right:.3em}@media screen and (max-width:680px){.ck-inspector .ck-inspector-editor-selector label{display:none}}.ck-inspector .ck-inspector-editor-selector select{margin-left:.5em}.ck-inspector .ck-inspector-code,.ck-inspector .ck-inspector-code *{font-size:var(--ck-inspector-code-font-size);font-family:var(--ck-inspector-code-font-family);cursor:default}.ck-inspector a{color:var(--ck-inspector-color-link);text-decoration:none}.ck-inspector a:hover{text-decoration:underline;cursor:pointer}.ck-inspector button{outline:0}.ck-inspector .ck-inspector-separator{border-right:1px solid var(--ck-inspector-color-border);display:inline-block;width:0;height:20px;margin:0 .5em;vertical-align:middle}`, ""]);
      }, function(b, a, u) {
        var c = u(49), o = { childContextTypes: !0, contextType: !0, contextTypes: !0, defaultProps: !0, displayName: !0, getDefaultProps: !0, getDerivedStateFromError: !0, getDerivedStateFromProps: !0, mixins: !0, propTypes: !0, type: !0 }, x = { name: !0, length: !0, prototype: !0, caller: !0, callee: !0, arguments: !0, arity: !0 }, m = { $$typeof: !0, compare: !0, defaultProps: !0, displayName: !0, propTypes: !0, type: !0 }, g = {};
        function v(j) {
          return c.isMemo(j) ? m : g[j.$$typeof] || o;
        }
        g[c.ForwardRef] = { $$typeof: !0, render: !0, defaultProps: !0, displayName: !0, propTypes: !0 }, g[c.Memo] = m;
        var y = Object.defineProperty, C = Object.getOwnPropertyNames, T = Object.getOwnPropertySymbols, P = Object.getOwnPropertyDescriptor, X = Object.getPrototypeOf, K = Object.prototype;
        b.exports = function j(B, N, M) {
          if (typeof N != "string") {
            if (K) {
              var V = X(N);
              V && V !== K && j(B, V, M);
            }
            var R = C(N);
            T && (R = R.concat(T(N)));
            for (var oe = v(B), Q = v(N), I = 0; I < R.length; ++I) {
              var A = R[I];
              if (!(x[A] || M && M[A] || Q && Q[A] || oe && oe[A])) {
                var se = P(N, A);
                try {
                  y(B, A, se);
                } catch {
                }
              }
            }
          }
          return B;
        };
      }, function(b, a, u) {
        Object.defineProperty(a, "__esModule", { value: !0 }), a.getBoundPosition = function(m, g, v) {
          if (!m.props.bounds) return [g, v];
          var y = m.props.bounds;
          y = typeof y == "string" ? y : function(B) {
            return { left: B.left, top: B.top, right: B.right, bottom: B.bottom };
          }(y);
          var C = x(m);
          if (typeof y == "string") {
            var T, P = C.ownerDocument, X = P.defaultView;
            if (!((T = y === "parent" ? C.parentNode : P.querySelector(y)) instanceof X.HTMLElement)) throw new Error('Bounds selector "' + y + '" could not find an element.');
            var K = X.getComputedStyle(C), j = X.getComputedStyle(T);
            y = { left: -C.offsetLeft + (0, c.int)(j.paddingLeft) + (0, c.int)(K.marginLeft), top: -C.offsetTop + (0, c.int)(j.paddingTop) + (0, c.int)(K.marginTop), right: (0, o.innerWidth)(T) - (0, o.outerWidth)(C) - C.offsetLeft + (0, c.int)(j.paddingRight) - (0, c.int)(K.marginRight), bottom: (0, o.innerHeight)(T) - (0, o.outerHeight)(C) - C.offsetTop + (0, c.int)(j.paddingBottom) - (0, c.int)(K.marginBottom) };
          }
          return (0, c.isNum)(y.right) && (g = Math.min(g, y.right)), (0, c.isNum)(y.bottom) && (v = Math.min(v, y.bottom)), (0, c.isNum)(y.left) && (g = Math.max(g, y.left)), (0, c.isNum)(y.top) && (v = Math.max(v, y.top)), [g, v];
        }, a.snapToGrid = function(m, g, v) {
          var y = Math.round(g / m[0]) * m[0], C = Math.round(v / m[1]) * m[1];
          return [y, C];
        }, a.canDragX = function(m) {
          return m.props.axis === "both" || m.props.axis === "x";
        }, a.canDragY = function(m) {
          return m.props.axis === "both" || m.props.axis === "y";
        }, a.getControlPosition = function(m, g, v) {
          var y = typeof g == "number" ? (0, o.getTouch)(m, g) : null;
          if (typeof g == "number" && !y) return null;
          var C = x(v), T = v.props.offsetParent || C.offsetParent || C.ownerDocument.body;
          return (0, o.offsetXYFromParent)(y || m, T, v.props.scale);
        }, a.createCoreData = function(m, g, v) {
          var y = m.state, C = !(0, c.isNum)(y.lastX), T = x(m);
          return C ? { node: T, deltaX: 0, deltaY: 0, lastX: g, lastY: v, x: g, y: v } : { node: T, deltaX: g - y.lastX, deltaY: v - y.lastY, lastX: y.lastX, lastY: y.lastY, x: g, y: v };
        }, a.createDraggableData = function(m, g) {
          var v = m.props.scale;
          return { node: g.node, x: m.state.x + g.deltaX / v, y: m.state.y + g.deltaY / v, deltaX: g.deltaX / v, deltaY: g.deltaY / v, lastX: m.state.x, lastY: m.state.y };
        };
        var c = u(20), o = u(32);
        function x(m) {
          var g = m.findDOMNode();
          if (!g) throw new Error("<DraggableCore>: Unmounted during event!");
          return g;
        }
      }, function(b, a, u) {
        Object.defineProperty(a, "__esModule", { value: !0 }), a.default = function() {
        };
      }, function(b, a, u) {
        Object.defineProperty(a, "__esModule", { value: !0 }), a.default = function g(v) {
          return [].slice.call(v.querySelectorAll("*"), 0).reduce(function(y, C) {
            return y.concat(C.shadowRoot ? g(C.shadowRoot) : [C]);
          }, []).filter(m);
        };
        var c = /input|select|textarea|button|object|iframe/;
        function o(g) {
          var v = g.offsetWidth <= 0 && g.offsetHeight <= 0;
          if (v && !g.innerHTML) return !0;
          try {
            var y = window.getComputedStyle(g);
            return v ? y.getPropertyValue("overflow") !== "visible" || g.scrollWidth <= 0 && g.scrollHeight <= 0 : y.getPropertyValue("display") == "none";
          } catch {
            return console.warn("Failed to inspect element style"), !1;
          }
        }
        function x(g, v) {
          var y = g.nodeName.toLowerCase();
          return (c.test(y) && !g.disabled || y === "a" && g.href || v) && function(C) {
            for (var T = C, P = C.getRootNode && C.getRootNode(); T && T !== document.body; ) {
              if (P && T === P && (T = P.host.parentNode), o(T)) return !1;
              T = T.parentNode;
            }
            return !0;
          }(g);
        }
        function m(g) {
          var v = g.getAttribute("tabindex");
          v === null && (v = void 0);
          var y = isNaN(v);
          return (y || v >= 0) && x(g, !y);
        }
        b.exports = a.default;
      }, function(b, a, u) {
        Object.defineProperty(a, "__esModule", { value: !0 }), a.resetState = function() {
          g && (g.removeAttribute ? g.removeAttribute("aria-hidden") : g.length != null ? g.forEach(function(C) {
            return C.removeAttribute("aria-hidden");
          }) : document.querySelectorAll(g).forEach(function(C) {
            return C.removeAttribute("aria-hidden");
          })), g = null;
        }, a.log = function() {
        }, a.assertNodeList = v, a.setElement = function(C) {
          var T = C;
          if (typeof T == "string" && m.canUseDOM) {
            var P = document.querySelectorAll(T);
            v(P, T), T = P;
          }
          return g = T || g;
        }, a.validateElement = y, a.hide = function(C) {
          var T = !0, P = !1, X = void 0;
          try {
            for (var K, j = y(C)[Symbol.iterator](); !(T = (K = j.next()).done); T = !0)
              K.value.setAttribute("aria-hidden", "true");
          } catch (B) {
            P = !0, X = B;
          } finally {
            try {
              !T && j.return && j.return();
            } finally {
              if (P) throw X;
            }
          }
        }, a.show = function(C) {
          var T = !0, P = !1, X = void 0;
          try {
            for (var K, j = y(C)[Symbol.iterator](); !(T = (K = j.next()).done); T = !0)
              K.value.removeAttribute("aria-hidden");
          } catch (B) {
            P = !0, X = B;
          } finally {
            try {
              !T && j.return && j.return();
            } finally {
              if (P) throw X;
            }
          }
        }, a.documentNotReadyOrSSRTesting = function() {
          g = null;
        };
        var c, o = u(81), x = (c = o) && c.__esModule ? c : { default: c }, m = u(36), g = null;
        function v(C, T) {
          if (!C || !C.length) throw new Error("react-modal: No elements were found for selector " + T + ".");
        }
        function y(C) {
          var T = C || g;
          return T ? Array.isArray(T) || T instanceof HTMLCollection || T instanceof NodeList ? T : [T] : ((0, x.default)(!1, ["react-modal: App element is not defined.", "Please use `Modal.setAppElement(el)` or set `appElement={el}`.", "This is needed so screen readers don't see main content", "when modal is opened. It is not recommended, but you can opt-out", "by setting `ariaHideApp={false}`."].join(" ")), []);
        }
      }, function(b, a, u) {
        Object.defineProperty(a, "__esModule", { value: !0 }), a.log = function() {
          console.log("portalOpenInstances ----------"), console.log(o.openInstances.length), o.openInstances.forEach(function(x) {
            return console.log(x);
          }), console.log("end portalOpenInstances ----------");
        }, a.resetState = function() {
          o = new c();
        };
        var c = function x() {
          var m = this;
          (function(g, v) {
            if (!(g instanceof v)) throw new TypeError("Cannot call a class as a function");
          })(this, x), this.register = function(g) {
            m.openInstances.indexOf(g) === -1 && (m.openInstances.push(g), m.emit("register"));
          }, this.deregister = function(g) {
            var v = m.openInstances.indexOf(g);
            v !== -1 && (m.openInstances.splice(v, 1), m.emit("deregister"));
          }, this.subscribe = function(g) {
            m.subscribers.push(g);
          }, this.emit = function(g) {
            m.subscribers.forEach(function(v) {
              return v(g, m.openInstances.slice());
            });
          }, this.openInstances = [], this.subscribers = [];
        }, o = new c();
        a.default = o;
      }, function(b, a, u) {
        b.exports = u(51);
      }, function(b, a, u) {
        var c = u(52), o = c.default, x = c.DraggableCore;
        b.exports = o, b.exports.default = o, b.exports.DraggableCore = x;
      }, function(b, a, u) {
        var c = u(76), o = { "text/plain": "Text", "text/html": "Url", default: "Text" };
        b.exports = function(x, m) {
          var g, v, y, C, T, P, X = !1;
          m || (m = {}), g = m.debug || !1;
          try {
            if (y = c(), C = document.createRange(), T = document.getSelection(), (P = document.createElement("span")).textContent = x, P.style.all = "unset", P.style.position = "fixed", P.style.top = 0, P.style.clip = "rect(0, 0, 0, 0)", P.style.whiteSpace = "pre", P.style.webkitUserSelect = "text", P.style.MozUserSelect = "text", P.style.msUserSelect = "text", P.style.userSelect = "text", P.addEventListener("copy", function(K) {
              if (K.stopPropagation(), m.format) if (K.preventDefault(), K.clipboardData === void 0) {
                g && console.warn("unable to use e.clipboardData"), g && console.warn("trying IE specific stuff"), window.clipboardData.clearData();
                var j = o[m.format] || o.default;
                window.clipboardData.setData(j, x);
              } else K.clipboardData.clearData(), K.clipboardData.setData(m.format, x);
              m.onCopy && (K.preventDefault(), m.onCopy(K.clipboardData));
            }), document.body.appendChild(P), C.selectNodeContents(P), T.addRange(C), !document.execCommand("copy")) throw new Error("copy command was unsuccessful");
            X = !0;
          } catch (K) {
            g && console.error("unable to copy using execCommand: ", K), g && console.warn("trying IE specific stuff");
            try {
              window.clipboardData.setData(m.format || "text", x), m.onCopy && m.onCopy(window.clipboardData), X = !0;
            } catch (j) {
              g && console.error("unable to copy using clipboardData: ", j), g && console.error("falling back to prompt"), v = function(B) {
                var N = (/mac os x/i.test(navigator.userAgent) ? "⌘" : "Ctrl") + "+C";
                return B.replace(/#{\s*key\s*}/g, N);
              }("message" in m ? m.message : "Copy to clipboard: #{key}, Enter"), window.prompt(v, x);
            }
          } finally {
            T && (typeof T.removeRange == "function" ? T.removeRange(C) : T.removeAllRanges()), P && document.body.removeChild(P), y();
          }
          return X;
        };
      }, function(b, a, u) {
        Object.defineProperty(a, "__esModule", { value: !0 });
        var c, o = u(77), x = (c = o) && c.__esModule ? c : { default: c };
        a.default = x.default, b.exports = a.default;
      }, function(b, a, u) {
        b.exports = u(50);
      }, function(b, a, u) {
        var c = typeof Symbol == "function" && Symbol.for, o = c ? Symbol.for("react.element") : 60103, x = c ? Symbol.for("react.portal") : 60106, m = c ? Symbol.for("react.fragment") : 60107, g = c ? Symbol.for("react.strict_mode") : 60108, v = c ? Symbol.for("react.profiler") : 60114, y = c ? Symbol.for("react.provider") : 60109, C = c ? Symbol.for("react.context") : 60110, T = c ? Symbol.for("react.async_mode") : 60111, P = c ? Symbol.for("react.concurrent_mode") : 60111, X = c ? Symbol.for("react.forward_ref") : 60112, K = c ? Symbol.for("react.suspense") : 60113, j = c ? Symbol.for("react.suspense_list") : 60120, B = c ? Symbol.for("react.memo") : 60115, N = c ? Symbol.for("react.lazy") : 60116, M = c ? Symbol.for("react.block") : 60121, V = c ? Symbol.for("react.fundamental") : 60117, R = c ? Symbol.for("react.responder") : 60118, oe = c ? Symbol.for("react.scope") : 60119;
        function Q(A) {
          if (typeof A == "object" && A !== null) {
            var se = A.$$typeof;
            switch (se) {
              case o:
                switch (A = A.type) {
                  case T:
                  case P:
                  case m:
                  case v:
                  case g:
                  case K:
                    return A;
                  default:
                    switch (A = A && A.$$typeof) {
                      case C:
                      case X:
                      case N:
                      case B:
                      case y:
                        return A;
                      default:
                        return se;
                    }
                }
              case x:
                return se;
            }
          }
        }
        function I(A) {
          return Q(A) === P;
        }
        a.AsyncMode = T, a.ConcurrentMode = P, a.ContextConsumer = C, a.ContextProvider = y, a.Element = o, a.ForwardRef = X, a.Fragment = m, a.Lazy = N, a.Memo = B, a.Portal = x, a.Profiler = v, a.StrictMode = g, a.Suspense = K, a.isAsyncMode = function(A) {
          return I(A) || Q(A) === T;
        }, a.isConcurrentMode = I, a.isContextConsumer = function(A) {
          return Q(A) === C;
        }, a.isContextProvider = function(A) {
          return Q(A) === y;
        }, a.isElement = function(A) {
          return typeof A == "object" && A !== null && A.$$typeof === o;
        }, a.isForwardRef = function(A) {
          return Q(A) === X;
        }, a.isFragment = function(A) {
          return Q(A) === m;
        }, a.isLazy = function(A) {
          return Q(A) === N;
        }, a.isMemo = function(A) {
          return Q(A) === B;
        }, a.isPortal = function(A) {
          return Q(A) === x;
        }, a.isProfiler = function(A) {
          return Q(A) === v;
        }, a.isStrictMode = function(A) {
          return Q(A) === g;
        }, a.isSuspense = function(A) {
          return Q(A) === K;
        }, a.isValidElementType = function(A) {
          return typeof A == "string" || typeof A == "function" || A === m || A === P || A === v || A === g || A === K || A === j || typeof A == "object" && A !== null && (A.$$typeof === N || A.$$typeof === B || A.$$typeof === y || A.$$typeof === C || A.$$typeof === X || A.$$typeof === V || A.$$typeof === R || A.$$typeof === oe || A.$$typeof === M);
        }, a.typeOf = Q;
      }, function(b, a, u) {
        var c = 60103, o = 60106, x = 60107, m = 60108, g = 60114, v = 60109, y = 60110, C = 60112, T = 60113, P = 60120, X = 60115, K = 60116, j = 60121, B = 60122, N = 60117, M = 60129, V = 60131;
        if (typeof Symbol == "function" && Symbol.for) {
          var R = Symbol.for;
          c = R("react.element"), o = R("react.portal"), x = R("react.fragment"), m = R("react.strict_mode"), g = R("react.profiler"), v = R("react.provider"), y = R("react.context"), C = R("react.forward_ref"), T = R("react.suspense"), P = R("react.suspense_list"), X = R("react.memo"), K = R("react.lazy"), j = R("react.block"), B = R("react.server.block"), N = R("react.fundamental"), M = R("react.debug_trace_mode"), V = R("react.legacy_hidden");
        }
        function oe(D) {
          if (typeof D == "object" && D !== null) {
            var ie = D.$$typeof;
            switch (ie) {
              case c:
                switch (D = D.type) {
                  case x:
                  case g:
                  case m:
                  case T:
                  case P:
                    return D;
                  default:
                    switch (D = D && D.$$typeof) {
                      case y:
                      case C:
                      case K:
                      case X:
                      case v:
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
        var Q = v, I = c, A = C, se = x, le = K, te = X, ce = o, ye = g, J = m, fe = T;
        a.ContextConsumer = y, a.ContextProvider = Q, a.Element = I, a.ForwardRef = A, a.Fragment = se, a.Lazy = le, a.Memo = te, a.Portal = ce, a.Profiler = ye, a.StrictMode = J, a.Suspense = fe, a.isAsyncMode = function() {
          return !1;
        }, a.isConcurrentMode = function() {
          return !1;
        }, a.isContextConsumer = function(D) {
          return oe(D) === y;
        }, a.isContextProvider = function(D) {
          return oe(D) === v;
        }, a.isElement = function(D) {
          return typeof D == "object" && D !== null && D.$$typeof === c;
        }, a.isForwardRef = function(D) {
          return oe(D) === C;
        }, a.isFragment = function(D) {
          return oe(D) === x;
        }, a.isLazy = function(D) {
          return oe(D) === K;
        }, a.isMemo = function(D) {
          return oe(D) === X;
        }, a.isPortal = function(D) {
          return oe(D) === o;
        }, a.isProfiler = function(D) {
          return oe(D) === g;
        }, a.isStrictMode = function(D) {
          return oe(D) === m;
        }, a.isSuspense = function(D) {
          return oe(D) === T;
        }, a.isValidElementType = function(D) {
          return typeof D == "string" || typeof D == "function" || D === x || D === g || D === M || D === m || D === T || D === P || D === V || typeof D == "object" && D !== null && (D.$$typeof === K || D.$$typeof === X || D.$$typeof === v || D.$$typeof === y || D.$$typeof === C || D.$$typeof === N || D.$$typeof === j || D[0] === B);
        }, a.typeOf = oe;
      }, function(b, a, u) {
        Object.defineProperty(a, "__esModule", { value: !0 }), Object.defineProperty(a, "DraggableCore", { enumerable: !0, get: function() {
          return C.default;
        } }), a.default = void 0;
        var c = function(J) {
          if (J && J.__esModule) return J;
          if (J === null || K(J) !== "object" && typeof J != "function") return { default: J };
          var fe = X();
          if (fe && fe.has(J)) return fe.get(J);
          var D = {}, ie = Object.defineProperty && Object.getOwnPropertyDescriptor;
          for (var be in J) if (Object.prototype.hasOwnProperty.call(J, be)) {
            var Ce = ie ? Object.getOwnPropertyDescriptor(J, be) : null;
            Ce && (Ce.get || Ce.set) ? Object.defineProperty(D, be, Ce) : D[be] = J[be];
          }
          return D.default = J, fe && fe.set(J, D), D;
        }(u(0)), o = P(u(18)), x = P(u(12)), m = P(u(55)), g = u(32), v = u(40), y = u(20), C = P(u(57)), T = P(u(41));
        function P(J) {
          return J && J.__esModule ? J : { default: J };
        }
        function X() {
          if (typeof WeakMap != "function") return null;
          var J = /* @__PURE__ */ new WeakMap();
          return X = function() {
            return J;
          }, J;
        }
        function K(J) {
          return (K = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(fe) {
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
        function B(J, fe) {
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
              if (typeof D == "string") return M(D, ie);
              var be = Object.prototype.toString.call(D).slice(8, -1);
              if (be === "Object" && D.constructor && (be = D.constructor.name), be === "Map" || be === "Set") return Array.from(D);
              if (be === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(be)) return M(D, ie);
            }
          }(J, fe) || function() {
            throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
          }();
        }
        function M(J, fe) {
          (fe == null || fe > J.length) && (fe = J.length);
          for (var D = 0, ie = new Array(fe); D < fe; D++) ie[D] = J[D];
          return ie;
        }
        function V(J, fe) {
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
            fe % 2 ? V(Object(D), !0).forEach(function(ie) {
              ce(J, ie, D[ie]);
            }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(J, Object.getOwnPropertyDescriptors(D)) : V(Object(D)).forEach(function(ie) {
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
        function Q(J, fe, D) {
          return fe && oe(J.prototype, fe), D && oe(J, D), J;
        }
        function I(J, fe) {
          return (I = Object.setPrototypeOf || function(D, ie) {
            return D.__proto__ = ie, D;
          })(J, fe);
        }
        function A(J) {
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
          return !fe || K(fe) !== "object" && typeof fe != "function" ? le(J) : fe;
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
          var fe = A(D);
          function D(ie) {
            var be;
            return function(Ce, ke) {
              if (!(Ce instanceof ke)) throw new TypeError("Cannot call a class as a function");
            }(this, D), ce(le(be = fe.call(this, ie)), "onDragStart", function(Ce, ke) {
              if ((0, T.default)("Draggable: onDragStart: %j", ke), be.props.onStart(Ce, (0, v.createDraggableData)(le(be), ke)) === !1) return !1;
              be.setState({ dragging: !0, dragged: !0 });
            }), ce(le(be), "onDrag", function(Ce, ke) {
              if (!be.state.dragging) return !1;
              (0, T.default)("Draggable: onDrag: %j", ke);
              var Ne = (0, v.createDraggableData)(le(be), ke), xe = { x: Ne.x, y: Ne.y };
              if (be.props.bounds) {
                var ze = xe.x, Je = xe.y;
                xe.x += be.state.slackX, xe.y += be.state.slackY;
                var G = N((0, v.getBoundPosition)(le(be), xe.x, xe.y), 2), Y = G[0], me = G[1];
                xe.x = Y, xe.y = me, xe.slackX = be.state.slackX + (ze - xe.x), xe.slackY = be.state.slackY + (Je - xe.y), Ne.x = xe.x, Ne.y = xe.y, Ne.deltaX = xe.x - be.state.x, Ne.deltaY = xe.y - be.state.y;
              }
              if (be.props.onDrag(Ce, Ne) === !1) return !1;
              be.setState(xe);
            }), ce(le(be), "onDragStop", function(Ce, ke) {
              if (!be.state.dragging || be.props.onStop(Ce, (0, v.createDraggableData)(le(be), ke)) === !1) return !1;
              (0, T.default)("Draggable: onDragStop: %j", ke);
              var Ne = { dragging: !1, slackX: 0, slackY: 0 };
              if (be.props.position) {
                var xe = be.props.position, ze = xe.x, Je = xe.y;
                Ne.x = ze, Ne.y = Je;
              }
              be.setState(Ne);
            }), be.state = { dragging: !1, dragged: !1, x: ie.position ? ie.position.x : ie.defaultPosition.x, y: ie.position ? ie.position.y : ie.defaultPosition.y, prevPropsPosition: R({}, ie.position), slackX: 0, slackY: 0, isElementSVG: !1 }, !ie.position || ie.onDrag || ie.onStop || console.warn("A `position` was applied to this <Draggable>, without drag handlers. This will make this component effectively undraggable. Please attach `onDrag` or `onStop` handlers so you can adjust the `position` of this element."), be;
          }
          return Q(D, null, [{ key: "getDerivedStateFromProps", value: function(ie, be) {
            var Ce = ie.position, ke = be.prevPropsPosition;
            return !Ce || ke && Ce.x === ke.x && Ce.y === ke.y ? null : ((0, T.default)("Draggable: getDerivedStateFromProps %j", { position: Ce, prevPropsPosition: ke }), { x: Ce.x, y: Ce.y, prevPropsPosition: R({}, Ce) });
          } }]), Q(D, [{ key: "componentDidMount", value: function() {
            window.SVGElement !== void 0 && this.findDOMNode() instanceof window.SVGElement && this.setState({ isElementSVG: !0 });
          } }, { key: "componentWillUnmount", value: function() {
            this.setState({ dragging: !1 });
          } }, { key: "findDOMNode", value: function() {
            return this.props.nodeRef ? this.props.nodeRef.current : x.default.findDOMNode(this);
          } }, { key: "render", value: function() {
            var ie, be = this.props, Ce = (be.axis, be.bounds, be.children), ke = be.defaultPosition, Ne = be.defaultClassName, xe = be.defaultClassNameDragging, ze = be.defaultClassNameDragged, Je = be.position, G = be.positionOffset, Y = (be.scale, B(be, ["axis", "bounds", "children", "defaultPosition", "defaultClassName", "defaultClassNameDragging", "defaultClassNameDragged", "position", "positionOffset", "scale"])), me = {}, l = null, d = !Je || this.state.dragging, k = Je || ke, U = { x: (0, v.canDragX)(this) && d ? this.state.x : k.x, y: (0, v.canDragY)(this) && d ? this.state.y : k.y };
            this.state.isElementSVG ? l = (0, g.createSVGTransform)(U, G) : me = (0, g.createCSSTransform)(U, G);
            var F = (0, m.default)(Ce.props.className || "", Ne, (ce(ie = {}, xe, this.state.dragging), ce(ie, ze, this.state.dragged), ie));
            return c.createElement(C.default, j({}, Y, { onStart: this.onDragStart, onDrag: this.onDrag, onStop: this.onDragStop }), c.cloneElement(c.Children.only(Ce), { className: F, style: R(R({}, Ce.props.style), me), transform: l }));
          } }]), D;
        }(c.Component);
        a.default = ye, ce(ye, "displayName", "Draggable"), ce(ye, "propTypes", R(R({}, C.default.propTypes), {}, { axis: o.default.oneOf(["both", "x", "y", "none"]), bounds: o.default.oneOfType([o.default.shape({ left: o.default.number, right: o.default.number, top: o.default.number, bottom: o.default.number }), o.default.string, o.default.oneOf([!1])]), defaultClassName: o.default.string, defaultClassNameDragging: o.default.string, defaultClassNameDragged: o.default.string, defaultPosition: o.default.shape({ x: o.default.number, y: o.default.number }), positionOffset: o.default.shape({ x: o.default.oneOfType([o.default.number, o.default.string]), y: o.default.oneOfType([o.default.number, o.default.string]) }), position: o.default.shape({ x: o.default.number, y: o.default.number }), className: y.dontSetMe, style: y.dontSetMe, transform: y.dontSetMe })), ce(ye, "defaultProps", R(R({}, C.default.defaultProps), {}, { axis: "both", bounds: !1, defaultClassName: "react-draggable", defaultClassNameDragging: "react-draggable-dragging", defaultClassNameDragged: "react-draggable-dragged", defaultPosition: { x: 0, y: 0 }, position: null, scale: 1 }));
      }, function(b, a, u) {
        var c = u(54);
        function o() {
        }
        function x() {
        }
        x.resetWarningCache = o, b.exports = function() {
          function m(y, C, T, P, X, K) {
            if (K !== c) {
              var j = new Error("Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types");
              throw j.name = "Invariant Violation", j;
            }
          }
          function g() {
            return m;
          }
          m.isRequired = m;
          var v = { array: m, bigint: m, bool: m, func: m, number: m, object: m, string: m, symbol: m, any: m, arrayOf: g, element: m, elementType: m, instanceOf: g, node: m, objectOf: g, oneOf: g, oneOfType: g, shape: g, exact: g, checkPropTypes: x, resetWarningCache: o };
          return v.PropTypes = v, v;
        };
      }, function(b, a, u) {
        b.exports = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
      }, function(b, a, u) {
        var c;
        (function() {
          var o = {}.hasOwnProperty;
          function x() {
            for (var m = [], g = 0; g < arguments.length; g++) {
              var v = arguments[g];
              if (v) {
                var y = typeof v;
                if (y === "string" || y === "number") m.push(v);
                else if (Array.isArray(v)) {
                  if (v.length) {
                    var C = x.apply(null, v);
                    C && m.push(C);
                  }
                } else if (y === "object") if (v.toString === Object.prototype.toString) for (var T in v) o.call(v, T) && v[T] && m.push(T);
                else m.push(v.toString());
              }
            }
            return m.join(" ");
          }
          b.exports ? (x.default = x, b.exports = x) : (c = (function() {
            return x;
          }).apply(a, [])) === void 0 || (b.exports = c);
        })();
      }, function(b, a, u) {
        Object.defineProperty(a, "__esModule", { value: !0 }), a.getPrefix = o, a.browserPrefixToKey = x, a.browserPrefixToStyle = function(g, v) {
          return v ? "-".concat(v.toLowerCase(), "-").concat(g) : g;
        }, a.default = void 0;
        var c = ["Moz", "Webkit", "O", "ms"];
        function o() {
          var g = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "transform";
          if (typeof window > "u" || window.document === void 0) return "";
          var v = window.document.documentElement.style;
          if (g in v) return "";
          for (var y = 0; y < c.length; y++) if (x(g, c[y]) in v) return c[y];
          return "";
        }
        function x(g, v) {
          return v ? "".concat(v).concat(function(y) {
            for (var C = "", T = !0, P = 0; P < y.length; P++) T ? (C += y[P].toUpperCase(), T = !1) : y[P] === "-" ? T = !0 : C += y[P];
            return C;
          }(g)) : g;
        }
        var m = o();
        a.default = m;
      }, function(b, a, u) {
        Object.defineProperty(a, "__esModule", { value: !0 }), a.default = void 0;
        var c = function(te) {
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
        }(u(0)), o = C(u(18)), x = C(u(12)), m = u(32), g = u(40), v = u(20), y = C(u(41));
        function C(te) {
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
        function X(te, ce) {
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
              if (typeof ye == "string") return K(ye, J);
              var fe = Object.prototype.toString.call(ye).slice(8, -1);
              if (fe === "Object" && ye.constructor && (fe = ye.constructor.name), fe === "Map" || fe === "Set") return Array.from(ye);
              if (fe === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(fe)) return K(ye, J);
            }
          }(te, ce) || function() {
            throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
          }();
        }
        function K(te, ce) {
          (ce == null || ce > te.length) && (ce = te.length);
          for (var ye = 0, J = new Array(ce); ye < ce; ye++) J[ye] = te[ye];
          return J;
        }
        function j(te, ce) {
          if (!(te instanceof ce)) throw new TypeError("Cannot call a class as a function");
        }
        function B(te, ce) {
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
        function M(te) {
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
            return V(this, ye);
          };
        }
        function V(te, ce) {
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
        function Q(te, ce, ye) {
          return ce in te ? Object.defineProperty(te, ce, { value: ye, enumerable: !0, configurable: !0, writable: !0 }) : te[ce] = ye, te;
        }
        var I = { start: "touchstart", move: "touchmove", stop: "touchend" }, A = { start: "mousedown", move: "mousemove", stop: "mouseup" }, se = A, le = function(te) {
          (function(D, ie) {
            if (typeof ie != "function" && ie !== null) throw new TypeError("Super expression must either be null or a function");
            D.prototype = Object.create(ie && ie.prototype, { constructor: { value: D, writable: !0, configurable: !0 } }), ie && N(D, ie);
          })(fe, te);
          var ce, ye, J = M(fe);
          function fe() {
            var D;
            j(this, fe);
            for (var ie = arguments.length, be = new Array(ie), Ce = 0; Ce < ie; Ce++) be[Ce] = arguments[Ce];
            return Q(R(D = J.call.apply(J, [this].concat(be))), "state", { dragging: !1, lastX: NaN, lastY: NaN, touchIdentifier: null }), Q(R(D), "mounted", !1), Q(R(D), "handleDragStart", function(ke) {
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
                  (0, y.default)("DraggableCore: handleDragStart: %j", me), (0, y.default)("calling", D.props.onStart), D.props.onStart(ke, me) !== !1 && D.mounted !== !1 && (D.props.enableUserSelectHack && (0, m.addUserSelectStyles)(xe), D.setState({ dragging: !0, lastX: G, lastY: Y }), (0, m.addEvent)(xe, se.move, D.handleDrag), (0, m.addEvent)(xe, se.stop, D.handleDragStop));
                }
              }
            }), Q(R(D), "handleDrag", function(ke) {
              var Ne = (0, g.getControlPosition)(ke, D.state.touchIdentifier, R(D));
              if (Ne != null) {
                var xe = Ne.x, ze = Ne.y;
                if (Array.isArray(D.props.grid)) {
                  var Je = xe - D.state.lastX, G = ze - D.state.lastY, Y = X((0, g.snapToGrid)(D.props.grid, Je, G), 2);
                  if (Je = Y[0], G = Y[1], !Je && !G) return;
                  xe = D.state.lastX + Je, ze = D.state.lastY + G;
                }
                var me = (0, g.createCoreData)(R(D), xe, ze);
                if ((0, y.default)("DraggableCore: handleDrag: %j", me), D.props.onDrag(ke, me) !== !1 && D.mounted !== !1) D.setState({ lastX: xe, lastY: ze });
                else try {
                  D.handleDragStop(new MouseEvent("mouseup"));
                } catch {
                  var l = document.createEvent("MouseEvents");
                  l.initMouseEvent("mouseup", !0, !0, window, 0, 0, 0, 0, 0, !1, !1, !1, !1, 0, null), D.handleDragStop(l);
                }
              }
            }), Q(R(D), "handleDragStop", function(ke) {
              if (D.state.dragging) {
                var Ne = (0, g.getControlPosition)(ke, D.state.touchIdentifier, R(D));
                if (Ne != null) {
                  var xe = Ne.x, ze = Ne.y, Je = (0, g.createCoreData)(R(D), xe, ze);
                  if (D.props.onStop(ke, Je) === !1 || D.mounted === !1) return !1;
                  var G = D.findDOMNode();
                  G && D.props.enableUserSelectHack && (0, m.removeUserSelectStyles)(G.ownerDocument), (0, y.default)("DraggableCore: handleDragStop: %j", Je), D.setState({ dragging: !1, lastX: NaN, lastY: NaN }), G && ((0, y.default)("DraggableCore: Removing handlers"), (0, m.removeEvent)(G.ownerDocument, se.move, D.handleDrag), (0, m.removeEvent)(G.ownerDocument, se.stop, D.handleDragStop));
                }
              }
            }), Q(R(D), "onMouseDown", function(ke) {
              return se = A, D.handleDragStart(ke);
            }), Q(R(D), "onMouseUp", function(ke) {
              return se = A, D.handleDragStop(ke);
            }), Q(R(D), "onTouchStart", function(ke) {
              return se = I, D.handleDragStart(ke);
            }), Q(R(D), "onTouchEnd", function(ke) {
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
              (0, m.removeEvent)(ie, A.move, this.handleDrag), (0, m.removeEvent)(ie, I.move, this.handleDrag), (0, m.removeEvent)(ie, A.stop, this.handleDragStop), (0, m.removeEvent)(ie, I.stop, this.handleDragStop), (0, m.removeEvent)(D, I.start, this.onTouchStart, { passive: !1 }), this.props.enableUserSelectHack && (0, m.removeUserSelectStyles)(ie);
            }
          } }, { key: "findDOMNode", value: function() {
            return this.props.nodeRef ? this.props.nodeRef.current : x.default.findDOMNode(this);
          } }, { key: "render", value: function() {
            return c.cloneElement(c.Children.only(this.props.children), { onMouseDown: this.onMouseDown, onMouseUp: this.onMouseUp, onTouchEnd: this.onTouchEnd });
          } }]) && B(ce.prototype, ye), fe;
        }(c.Component);
        a.default = le, Q(le, "displayName", "DraggableCore"), Q(le, "propTypes", { allowAnyClick: o.default.bool, disabled: o.default.bool, enableUserSelectHack: o.default.bool, offsetParent: function(te, ce) {
          if (te[ce] && te[ce].nodeType !== 1) throw new Error("Draggable's offsetParent must be a DOM Node.");
        }, grid: o.default.arrayOf(o.default.number), handle: o.default.string, cancel: o.default.string, nodeRef: o.default.object, onStart: o.default.func, onDrag: o.default.func, onStop: o.default.func, onMouseDown: o.default.func, scale: o.default.number, className: v.dontSetMe, style: v.dontSetMe, transform: v.dontSetMe }), Q(le, "defaultProps", { allowAnyClick: !1, cancel: null, disabled: !1, enableUserSelectHack: !0, offsetParent: null, handle: null, grid: null, transform: null, onStart: function() {
        }, onDrag: function() {
        }, onStop: function() {
        }, onMouseDown: function() {
        }, scale: 1 });
      }, function(b, a, u) {
        var c = u(6), o = u(59);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[b.i, o, ""]]);
        var x = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, x), b.exports = o.locals || {};
      }, function(b, a, u) {
        (b.exports = u(7)(!1)).push([b.i, ".ck-inspector{--ck-inspector-color-tab-background-hover:rgba(0,0,0,0.07);--ck-inspector-color-tab-active-border:#0dacef }.ck-inspector .ck-inspector-horizontal-nav{display:flex;flex-direction:row;user-select:none;align-self:stretch}.ck-inspector .ck-inspector-horizontal-nav .ck-inspector-horizontal-nav__item{-webkit-appearance:none;background:none;border:0;border-bottom:2px solid transparent;padding:.5em 1em;align-self:stretch}.ck-inspector .ck-inspector-horizontal-nav .ck-inspector-horizontal-nav__item:hover{background:var(--ck-inspector-color-tab-background-hover)}.ck-inspector .ck-inspector-horizontal-nav .ck-inspector-horizontal-nav__item.ck-inspector-horizontal-nav__item_active{border-bottom-color:var(--ck-inspector-color-tab-active-border)}", ""]);
      }, function(b, a, u) {
        var c = u(6), o = u(61);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[b.i, o, ""]]);
        var x = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, x), b.exports = o.locals || {};
      }, function(b, a, u) {
        (b.exports = u(7)(!1)).push([b.i, ".ck-inspector{--ck-inspector-navbox-empty-background:#fafafa}.ck-inspector .ck-inspector-navbox{display:flex;flex-direction:column;height:100%;align-items:stretch}.ck-inspector .ck-inspector-navbox .ck-inspector-navbox__navigation{display:flex;flex-direction:row;flex-wrap:nowrap;align-items:stretch;min-height:30px;max-height:30px;border-bottom:1px solid var(--ck-inspector-color-border);width:100%;user-select:none;align-items:center}.ck-inspector .ck-inspector-navbox .ck-inspector-navbox__content{display:flex;flex-direction:row;height:100%;overflow:hidden}", ""]);
      }, function(b, a, u) {
        var c = u(6), o = u(63);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[b.i, o, ""]]);
        var x = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, x), b.exports = o.locals || {};
      }, function(b, a, u) {
        (b.exports = u(7)(!1)).push([b.i, ".ck-inspector{--ck-inspector-icon-size:19px;--ck-inspector-button-size:calc(4px + var(--ck-inspector-icon-size));--ck-inspector-color-button:#777;--ck-inspector-color-button-hover:#222;--ck-inspector-color-button-on:#0f79e2}.ck-inspector .ck-inspector-button{width:var(--ck-inspector-button-size);height:var(--ck-inspector-button-size);border:0;overflow:hidden;border-radius:2px;padding:2px;color:var(--ck-inspector-color-button)}.ck-inspector .ck-inspector-button.ck-inspector-button_on,.ck-inspector .ck-inspector-button.ck-inspector-button_on:hover{color:var(--ck-inspector-color-button-on);opacity:1}.ck-inspector .ck-inspector-button.ck-inspector-button_disabled{opacity:.3}.ck-inspector .ck-inspector-button>span{display:none}.ck-inspector .ck-inspector-button:hover{color:var(--ck-inspector-color-button-hover)}.ck-inspector .ck-inspector-button svg{width:var(--ck-inspector-icon-size);height:var(--ck-inspector-icon-size)}.ck-inspector .ck-inspector-button svg,.ck-inspector .ck-inspector-button svg *{fill:currentColor}", ""]);
      }, function(b, a, u) {
        var c = u(6), o = u(65);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[b.i, o, ""]]);
        var x = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, x), b.exports = o.locals || {};
      }, function(b, a, u) {
        (b.exports = u(7)(!1)).push([b.i, ".ck-inspector{--ck-inspector-explorer-width:300px}.ck-inspector .ck-inspector-pane{display:flex;width:100%}.ck-inspector .ck-inspector-pane.ck-inspector-pane_empty{align-items:center;justify-content:center;padding:1em;background:var(--ck-inspector-navbox-empty-background)}.ck-inspector .ck-inspector-pane.ck-inspector-pane_empty p{align-self:center;width:100%;text-align:center}.ck-inspector .ck-inspector-pane>.ck-inspector-navbox:last-child{min-width:var(--ck-inspector-explorer-width);width:var(--ck-inspector-explorer-width)}.ck-inspector .ck-inspector-pane.ck-inspector-pane_vsplit>.ck-inspector-navbox:first-child{border-right:1px solid var(--ck-inspector-color-border);flex:1 1 auto;overflow:hidden}.ck-inspector .ck-inspector-pane.ck-inspector-pane_vsplit>.ck-inspector-navbox:first-child .ck-inspector-navbox__navigation{align-items:center}.ck-inspector .ck-inspector-pane.ck-inspector-pane_vsplit>.ck-inspector-navbox:first-child .ck-inspector-tree__config label{margin:0 .5em}.ck-inspector .ck-inspector-pane.ck-inspector-pane_vsplit>.ck-inspector-navbox:first-child .ck-inspector-tree__config input+label{margin-right:1em}", ""]);
      }, function(b, a, u) {
        var c = u(6), o = u(67);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[b.i, o, ""]]);
        var x = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, x), b.exports = o.locals || {};
      }, function(b, a, u) {
        (b.exports = u(7)(!1)).push([b.i, ".ck-inspector-side-pane{position:relative}", ""]);
      }, function(b, a, u) {
        var c = u(6), o = u(69);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[b.i, o, ""]]);
        var x = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, x), b.exports = o.locals || {};
      }, function(b, a, u) {
        (b.exports = u(7)(!1)).push([b.i, ".ck-inspector .ck-inspector-checkbox{vertical-align:middle}", ""]);
      }, function(b, a, u) {
        var c = u(6), o = u(71);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[b.i, o, ""]]);
        var x = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, x), b.exports = o.locals || {};
      }, function(b, a, u) {
        (b.exports = u(7)(!1)).push([b.i, '.ck-inspector{--ck-inspector-color-property-list-property-name:#d0363f;--ck-inspector-color-property-list-property-value-true:green;--ck-inspector-color-property-list-property-value-false:red;--ck-inspector-color-property-list-property-value-unknown:#888;--ck-inspector-color-property-list-background:#f5f5f5;--ck-inspector-color-property-list-title-collapser:#727272}.ck-inspector .ck-inspector-property-list{display:grid;grid-template-columns:auto 1fr;background:var(--ck-inspector-color-white)}.ck-inspector .ck-inspector-property-list>:nth-of-type(odd){background:var(--ck-inspector-color-property-list-background)}.ck-inspector .ck-inspector-property-list>:nth-of-type(2n){background:var(--ck-inspector-color-white)}.ck-inspector .ck-inspector-property-list dt{padding:0 .7em 0 1.2em;min-width:15em}.ck-inspector .ck-inspector-property-list dt.ck-inspector-property-list__title_collapsible button{display:inline-block;overflow:hidden;vertical-align:middle;margin-left:-9px;margin-right:.3em;width:0;height:0;border-left:6px solid var(--ck-inspector-color-property-list-title-collapser);border-bottom:3.5px solid transparent;border-right:0 solid transparent;border-top:3.5px solid transparent;transition:transform .2s ease-in-out;transform:rotate(0deg)}.ck-inspector .ck-inspector-property-list dt.ck-inspector-property-list__title_expanded button{transform:rotate(90deg)}.ck-inspector .ck-inspector-property-list dt.ck-inspector-property-list__title_collapsed+dd+.ck-inspector-property-list{display:none}.ck-inspector .ck-inspector-property-list dt .ck-inspector-property-list__title__color-box{width:12px;height:12px;vertical-align:text-top;display:inline-block;margin-right:3px;border-radius:2px;border:1px solid #000}.ck-inspector .ck-inspector-property-list dt.ck-inspector-property-list__title_clickable label:hover{text-decoration:underline;cursor:pointer}.ck-inspector .ck-inspector-property-list dt label{color:var(--ck-inspector-color-property-list-property-name)}.ck-inspector .ck-inspector-property-list dd{padding-right:.7em}.ck-inspector .ck-inspector-property-list dd input{width:100%}.ck-inspector .ck-inspector-property-list dd input[value=false]{color:var(--ck-inspector-color-property-list-property-value-false)}.ck-inspector .ck-inspector-property-list dd input[value=true]{color:var(--ck-inspector-color-property-list-property-value-true)}.ck-inspector .ck-inspector-property-list dd input[value="function() {…}"],.ck-inspector .ck-inspector-property-list dd input[value=undefined]{color:var(--ck-inspector-color-property-list-property-value-unknown)}.ck-inspector .ck-inspector-property-list dd input[value="function() {…}"]{font-style:italic}.ck-inspector .ck-inspector-property-list .ck-inspector-property-list{grid-column:1/-1;margin-left:1em;background:transparent}.ck-inspector .ck-inspector-property-list .ck-inspector-property-list>:nth-of-type(2n),.ck-inspector .ck-inspector-property-list .ck-inspector-property-list>:nth-of-type(odd){background:transparent}', ""]);
      }, function(b, a, u) {
        var c = u(6), o = u(73);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[b.i, o, ""]]);
        var x = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, x), b.exports = o.locals || {};
      }, function(b, a, u) {
        (b.exports = u(7)(!1)).push([b.i, `.ck-inspector .ck-inspector__object-inspector{width:100%;background:var(--ck-inspector-color-white);overflow:auto}.ck-inspector .ck-inspector__object-inspector h2,.ck-inspector .ck-inspector__object-inspector h3{display:flex;flex-direction:row;flex-wrap:nowrap}.ck-inspector .ck-inspector__object-inspector h2{display:flex;align-items:center;padding:1em;overflow:hidden;text-overflow:ellipsis}.ck-inspector .ck-inspector__object-inspector h2>span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;margin-right:auto}.ck-inspector .ck-inspector__object-inspector h2>.ck-inspector-button{flex-shrink:0;margin-left:.5em}.ck-inspector .ck-inspector__object-inspector h2 a{font-weight:700;color:var(--ck-inspector-color-tree-node-name)}.ck-inspector .ck-inspector__object-inspector h2 a,.ck-inspector .ck-inspector__object-inspector h2 a>*{cursor:pointer}.ck-inspector .ck-inspector__object-inspector h2 em:after,.ck-inspector .ck-inspector__object-inspector h2 em:before{content:'"'}.ck-inspector .ck-inspector__object-inspector h3{display:flex;align-items:center;font-size:12px;padding:.4em .7em}.ck-inspector .ck-inspector__object-inspector h3 a{color:inherit;font-weight:700;margin-right:auto}.ck-inspector .ck-inspector__object-inspector h3 .ck-inspector-button{visibility:hidden}.ck-inspector .ck-inspector__object-inspector h3:hover .ck-inspector-button{visibility:visible}.ck-inspector .ck-inspector__object-inspector hr{border-top:1px solid var(--ck-inspector-color-border)}`, ""]);
      }, function(b, a, u) {
        var c = u(6), o = u(75);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[b.i, o, ""]]);
        var x = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, x), b.exports = o.locals || {};
      }, function(b, a, u) {
        (b.exports = u(7)(!1)).push([b.i, ".ck-inspector-model-tree__hide-markers .ck-inspector-tree__position.ck-inspector-tree__position_marker{display:none}", ""]);
      }, function(b, a) {
        b.exports = function() {
          var u = document.getSelection();
          if (!u.rangeCount) return function() {
          };
          for (var c = document.activeElement, o = [], x = 0; x < u.rangeCount; x++) o.push(u.getRangeAt(x));
          switch (c.tagName.toUpperCase()) {
            case "INPUT":
            case "TEXTAREA":
              c.blur();
              break;
            default:
              c = null;
          }
          return u.removeAllRanges(), function() {
            u.type === "Caret" && u.removeAllRanges(), u.rangeCount || o.forEach(function(m) {
              u.addRange(m);
            }), c && c.focus();
          };
        };
      }, function(b, a, u) {
        Object.defineProperty(a, "__esModule", { value: !0 }), a.bodyOpenClassName = a.portalClassName = void 0;
        var c = Object.assign || function(A) {
          for (var se = 1; se < arguments.length; se++) {
            var le = arguments[se];
            for (var te in le) Object.prototype.hasOwnProperty.call(le, te) && (A[te] = le[te]);
          }
          return A;
        }, o = /* @__PURE__ */ function() {
          function A(se, le) {
            for (var te = 0; te < le.length; te++) {
              var ce = le[te];
              ce.enumerable = ce.enumerable || !1, ce.configurable = !0, "value" in ce && (ce.writable = !0), Object.defineProperty(se, ce.key, ce);
            }
          }
          return function(se, le, te) {
            return le && A(se.prototype, le), te && A(se, te), se;
          };
        }(), x = u(0), m = K(x), g = K(u(12)), v = K(u(18)), y = K(u(78)), C = function(A) {
          if (A && A.__esModule) return A;
          var se = {};
          if (A != null) for (var le in A) Object.prototype.hasOwnProperty.call(A, le) && (se[le] = A[le]);
          return se.default = A, se;
        }(u(43)), T = u(36), P = K(T), X = u(85);
        function K(A) {
          return A && A.__esModule ? A : { default: A };
        }
        function j(A, se) {
          if (!(A instanceof se)) throw new TypeError("Cannot call a class as a function");
        }
        function B(A, se) {
          if (!A) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
          return !se || typeof se != "object" && typeof se != "function" ? A : se;
        }
        var N = a.portalClassName = "ReactModalPortal", M = a.bodyOpenClassName = "ReactModal__Body--open", V = T.canUseDOM && g.default.createPortal !== void 0, R = function(A) {
          return document.createElement(A);
        }, oe = function() {
          return V ? g.default.createPortal : g.default.unstable_renderSubtreeIntoContainer;
        };
        function Q(A) {
          return A();
        }
        var I = function(A) {
          function se() {
            var le, te, ce;
            j(this, se);
            for (var ye = arguments.length, J = Array(ye), fe = 0; fe < ye; fe++) J[fe] = arguments[fe];
            return te = ce = B(this, (le = se.__proto__ || Object.getPrototypeOf(se)).call.apply(le, [this].concat(J))), ce.removePortal = function() {
              !V && g.default.unmountComponentAtNode(ce.node);
              var D = Q(ce.props.parentSelector);
              D && D.contains(ce.node) ? D.removeChild(ce.node) : console.warn('React-Modal: "parentSelector" prop did not returned any DOM element. Make sure that the parent element is unmounted to avoid any memory leaks.');
            }, ce.portalRef = function(D) {
              ce.portal = D;
            }, ce.renderPortal = function(D) {
              var ie = oe()(ce, m.default.createElement(y.default, c({ defaultStyles: se.defaultStyles }, D)), ce.node);
              ce.portalRef(ie);
            }, B(ce, te);
          }
          return function(le, te) {
            if (typeof te != "function" && te !== null) throw new TypeError("Super expression must either be null or a function, not " + typeof te);
            le.prototype = Object.create(te && te.prototype, { constructor: { value: le, enumerable: !1, writable: !0, configurable: !0 } }), te && (Object.setPrototypeOf ? Object.setPrototypeOf(le, te) : le.__proto__ = te);
          }(se, A), o(se, [{ key: "componentDidMount", value: function() {
            T.canUseDOM && (V || (this.node = R("div")), this.node.className = this.props.portalClassName, Q(this.props.parentSelector).appendChild(this.node), !V && this.renderPortal(this.props));
          } }, { key: "getSnapshotBeforeUpdate", value: function(le) {
            return { prevParent: Q(le.parentSelector), nextParent: Q(this.props.parentSelector) };
          } }, { key: "componentDidUpdate", value: function(le, te, ce) {
            if (T.canUseDOM) {
              var ye = this.props, J = ye.isOpen, fe = ye.portalClassName;
              le.portalClassName !== fe && (this.node.className = fe);
              var D = ce.prevParent, ie = ce.nextParent;
              ie !== D && (D.removeChild(this.node), ie.appendChild(this.node)), (le.isOpen || J) && !V && this.renderPortal(this.props);
            }
          } }, { key: "componentWillUnmount", value: function() {
            if (T.canUseDOM && this.node && this.portal) {
              var le = this.portal.state, te = Date.now(), ce = le.isOpen && this.props.closeTimeoutMS && (le.closesAt || te + this.props.closeTimeoutMS);
              ce ? (le.beforeClose || this.portal.closeWithTimeout(), setTimeout(this.removePortal, ce - te)) : this.removePortal();
            }
          } }, { key: "render", value: function() {
            return T.canUseDOM && V ? (!this.node && V && (this.node = R("div")), oe()(m.default.createElement(y.default, c({ ref: this.portalRef, defaultStyles: se.defaultStyles }, this.props)), this.node)) : null;
          } }], [{ key: "setAppElement", value: function(le) {
            C.setElement(le);
          } }]), se;
        }(x.Component);
        I.propTypes = { isOpen: v.default.bool.isRequired, style: v.default.shape({ content: v.default.object, overlay: v.default.object }), portalClassName: v.default.string, bodyOpenClassName: v.default.string, htmlOpenClassName: v.default.string, className: v.default.oneOfType([v.default.string, v.default.shape({ base: v.default.string.isRequired, afterOpen: v.default.string.isRequired, beforeClose: v.default.string.isRequired })]), overlayClassName: v.default.oneOfType([v.default.string, v.default.shape({ base: v.default.string.isRequired, afterOpen: v.default.string.isRequired, beforeClose: v.default.string.isRequired })]), appElement: v.default.oneOfType([v.default.instanceOf(P.default), v.default.instanceOf(T.SafeHTMLCollection), v.default.instanceOf(T.SafeNodeList), v.default.arrayOf(v.default.instanceOf(P.default))]), onAfterOpen: v.default.func, onRequestClose: v.default.func, closeTimeoutMS: v.default.number, ariaHideApp: v.default.bool, shouldFocusAfterRender: v.default.bool, shouldCloseOnOverlayClick: v.default.bool, shouldReturnFocusAfterClose: v.default.bool, preventScroll: v.default.bool, parentSelector: v.default.func, aria: v.default.object, data: v.default.object, role: v.default.string, contentLabel: v.default.string, shouldCloseOnEsc: v.default.bool, overlayRef: v.default.func, contentRef: v.default.func, id: v.default.string, overlayElement: v.default.func, contentElement: v.default.func }, I.defaultProps = { isOpen: !1, portalClassName: N, bodyOpenClassName: M, role: "dialog", ariaHideApp: !0, closeTimeoutMS: 0, shouldFocusAfterRender: !0, shouldCloseOnEsc: !0, shouldCloseOnOverlayClick: !0, shouldReturnFocusAfterClose: !0, preventScroll: !1, parentSelector: function() {
          return document.body;
        }, overlayElement: function(A, se) {
          return m.default.createElement("div", A, se);
        }, contentElement: function(A, se) {
          return m.default.createElement("div", A, se);
        } }, I.defaultStyles = { overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(255, 255, 255, 0.75)" }, content: { position: "absolute", top: "40px", left: "40px", right: "40px", bottom: "40px", border: "1px solid #ccc", background: "#fff", overflow: "auto", WebkitOverflowScrolling: "touch", borderRadius: "4px", outline: "none", padding: "20px" } }, (0, X.polyfill)(I), a.default = I;
      }, function(b, a, u) {
        Object.defineProperty(a, "__esModule", { value: !0 });
        var c = Object.assign || function(R) {
          for (var oe = 1; oe < arguments.length; oe++) {
            var Q = arguments[oe];
            for (var I in Q) Object.prototype.hasOwnProperty.call(Q, I) && (R[I] = Q[I]);
          }
          return R;
        }, o = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(R) {
          return typeof R;
        } : function(R) {
          return R && typeof Symbol == "function" && R.constructor === Symbol && R !== Symbol.prototype ? "symbol" : typeof R;
        }, x = /* @__PURE__ */ function() {
          function R(oe, Q) {
            for (var I = 0; I < Q.length; I++) {
              var A = Q[I];
              A.enumerable = A.enumerable || !1, A.configurable = !0, "value" in A && (A.writable = !0), Object.defineProperty(oe, A.key, A);
            }
          }
          return function(oe, Q, I) {
            return Q && R(oe.prototype, Q), I && R(oe, I), oe;
          };
        }(), m = u(0), g = B(u(18)), v = j(u(79)), y = B(u(80)), C = j(u(43)), T = j(u(83)), P = u(36), X = B(P), K = B(u(44));
        function j(R) {
          if (R && R.__esModule) return R;
          var oe = {};
          if (R != null) for (var Q in R) Object.prototype.hasOwnProperty.call(R, Q) && (oe[Q] = R[Q]);
          return oe.default = R, oe;
        }
        function B(R) {
          return R && R.__esModule ? R : { default: R };
        }
        u(84);
        var N = { overlay: "ReactModal__Overlay", content: "ReactModal__Content" }, M = 0, V = function(R) {
          function oe(Q) {
            (function(A, se) {
              if (!(A instanceof se)) throw new TypeError("Cannot call a class as a function");
            })(this, oe);
            var I = function(A, se) {
              if (!A) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
              return !se || typeof se != "object" && typeof se != "function" ? A : se;
            }(this, (oe.__proto__ || Object.getPrototypeOf(oe)).call(this, Q));
            return I.setOverlayRef = function(A) {
              I.overlay = A, I.props.overlayRef && I.props.overlayRef(A);
            }, I.setContentRef = function(A) {
              I.content = A, I.props.contentRef && I.props.contentRef(A);
            }, I.afterClose = function() {
              var A = I.props, se = A.appElement, le = A.ariaHideApp, te = A.htmlOpenClassName, ce = A.bodyOpenClassName;
              ce && T.remove(document.body, ce), te && T.remove(document.getElementsByTagName("html")[0], te), le && M > 0 && (M -= 1) === 0 && C.show(se), I.props.shouldFocusAfterRender && (I.props.shouldReturnFocusAfterClose ? (v.returnFocus(I.props.preventScroll), v.teardownScopedFocus()) : v.popWithoutFocus()), I.props.onAfterClose && I.props.onAfterClose(), K.default.deregister(I);
            }, I.open = function() {
              I.beforeOpen(), I.state.afterOpen && I.state.beforeClose ? (clearTimeout(I.closeTimer), I.setState({ beforeClose: !1 })) : (I.props.shouldFocusAfterRender && (v.setupScopedFocus(I.node), v.markForFocusLater()), I.setState({ isOpen: !0 }, function() {
                I.openAnimationFrame = requestAnimationFrame(function() {
                  I.setState({ afterOpen: !0 }), I.props.isOpen && I.props.onAfterOpen && I.props.onAfterOpen({ overlayEl: I.overlay, contentEl: I.content });
                });
              }));
            }, I.close = function() {
              I.props.closeTimeoutMS > 0 ? I.closeWithTimeout() : I.closeWithoutTimeout();
            }, I.focusContent = function() {
              return I.content && !I.contentHasFocus() && I.content.focus({ preventScroll: !0 });
            }, I.closeWithTimeout = function() {
              var A = Date.now() + I.props.closeTimeoutMS;
              I.setState({ beforeClose: !0, closesAt: A }, function() {
                I.closeTimer = setTimeout(I.closeWithoutTimeout, I.state.closesAt - Date.now());
              });
            }, I.closeWithoutTimeout = function() {
              I.setState({ beforeClose: !1, isOpen: !1, afterOpen: !1, closesAt: null }, I.afterClose);
            }, I.handleKeyDown = function(A) {
              A.keyCode === 9 && (0, y.default)(I.content, A), I.props.shouldCloseOnEsc && A.keyCode === 27 && (A.stopPropagation(), I.requestClose(A));
            }, I.handleOverlayOnClick = function(A) {
              I.shouldClose === null && (I.shouldClose = !0), I.shouldClose && I.props.shouldCloseOnOverlayClick && (I.ownerHandlesClose() ? I.requestClose(A) : I.focusContent()), I.shouldClose = null;
            }, I.handleContentOnMouseUp = function() {
              I.shouldClose = !1;
            }, I.handleOverlayOnMouseDown = function(A) {
              I.props.shouldCloseOnOverlayClick || A.target != I.overlay || A.preventDefault();
            }, I.handleContentOnClick = function() {
              I.shouldClose = !1;
            }, I.handleContentOnMouseDown = function() {
              I.shouldClose = !1;
            }, I.requestClose = function(A) {
              return I.ownerHandlesClose() && I.props.onRequestClose(A);
            }, I.ownerHandlesClose = function() {
              return I.props.onRequestClose;
            }, I.shouldBeClosed = function() {
              return !I.state.isOpen && !I.state.beforeClose;
            }, I.contentHasFocus = function() {
              return document.activeElement === I.content || I.content.contains(document.activeElement);
            }, I.buildClassName = function(A, se) {
              var le = (se === void 0 ? "undefined" : o(se)) === "object" ? se : { base: N[A], afterOpen: N[A] + "--after-open", beforeClose: N[A] + "--before-close" }, te = le.base;
              return I.state.afterOpen && (te = te + " " + le.afterOpen), I.state.beforeClose && (te = te + " " + le.beforeClose), typeof se == "string" && se ? te + " " + se : te;
            }, I.attributesFromObject = function(A, se) {
              return Object.keys(se).reduce(function(le, te) {
                return le[A + "-" + te] = se[te], le;
              }, {});
            }, I.state = { afterOpen: !1, beforeClose: !1 }, I.shouldClose = null, I.moveFromContentToOverlay = null, I;
          }
          return function(Q, I) {
            if (typeof I != "function" && I !== null) throw new TypeError("Super expression must either be null or a function, not " + typeof I);
            Q.prototype = Object.create(I && I.prototype, { constructor: { value: Q, enumerable: !1, writable: !0, configurable: !0 } }), I && (Object.setPrototypeOf ? Object.setPrototypeOf(Q, I) : Q.__proto__ = I);
          }(oe, R), x(oe, [{ key: "componentDidMount", value: function() {
            this.props.isOpen && this.open();
          } }, { key: "componentDidUpdate", value: function(Q, I) {
            this.props.isOpen && !Q.isOpen ? this.open() : !this.props.isOpen && Q.isOpen && this.close(), this.props.shouldFocusAfterRender && this.state.isOpen && !I.isOpen && this.focusContent();
          } }, { key: "componentWillUnmount", value: function() {
            this.state.isOpen && this.afterClose(), clearTimeout(this.closeTimer), cancelAnimationFrame(this.openAnimationFrame);
          } }, { key: "beforeOpen", value: function() {
            var Q = this.props, I = Q.appElement, A = Q.ariaHideApp, se = Q.htmlOpenClassName, le = Q.bodyOpenClassName;
            le && T.add(document.body, le), se && T.add(document.getElementsByTagName("html")[0], se), A && (M += 1, C.hide(I)), K.default.register(this);
          } }, { key: "render", value: function() {
            var Q = this.props, I = Q.id, A = Q.className, se = Q.overlayClassName, le = Q.defaultStyles, te = Q.children, ce = A ? {} : le.content, ye = se ? {} : le.overlay;
            if (this.shouldBeClosed()) return null;
            var J = { ref: this.setOverlayRef, className: this.buildClassName("overlay", se), style: c({}, ye, this.props.style.overlay), onClick: this.handleOverlayOnClick, onMouseDown: this.handleOverlayOnMouseDown }, fe = c({ id: I, ref: this.setContentRef, style: c({}, ce, this.props.style.content), className: this.buildClassName("content", A), tabIndex: "-1", onKeyDown: this.handleKeyDown, onMouseDown: this.handleContentOnMouseDown, onMouseUp: this.handleContentOnMouseUp, onClick: this.handleContentOnClick, role: this.props.role, "aria-label": this.props.contentLabel }, this.attributesFromObject("aria", c({ modal: !0 }, this.props.aria)), this.attributesFromObject("data", this.props.data || {}), { "data-testid": this.props.testId }), D = this.props.contentElement(fe, te);
            return this.props.overlayElement(J, D);
          } }]), oe;
        }(m.Component);
        V.defaultProps = { style: { overlay: {}, content: {} }, defaultStyles: {} }, V.propTypes = { isOpen: g.default.bool.isRequired, defaultStyles: g.default.shape({ content: g.default.object, overlay: g.default.object }), style: g.default.shape({ content: g.default.object, overlay: g.default.object }), className: g.default.oneOfType([g.default.string, g.default.object]), overlayClassName: g.default.oneOfType([g.default.string, g.default.object]), bodyOpenClassName: g.default.string, htmlOpenClassName: g.default.string, ariaHideApp: g.default.bool, appElement: g.default.oneOfType([g.default.instanceOf(X.default), g.default.instanceOf(P.SafeHTMLCollection), g.default.instanceOf(P.SafeNodeList), g.default.arrayOf(g.default.instanceOf(X.default))]), onAfterOpen: g.default.func, onAfterClose: g.default.func, onRequestClose: g.default.func, closeTimeoutMS: g.default.number, shouldFocusAfterRender: g.default.bool, shouldCloseOnOverlayClick: g.default.bool, shouldReturnFocusAfterClose: g.default.bool, preventScroll: g.default.bool, role: g.default.string, contentLabel: g.default.string, aria: g.default.object, data: g.default.object, children: g.default.node, shouldCloseOnEsc: g.default.bool, overlayRef: g.default.func, contentRef: g.default.func, id: g.default.string, overlayElement: g.default.func, contentElement: g.default.func, testId: g.default.string }, a.default = V, b.exports = a.default;
      }, function(b, a, u) {
        Object.defineProperty(a, "__esModule", { value: !0 }), a.resetState = function() {
          m = [];
        }, a.log = function() {
        }, a.handleBlur = y, a.handleFocus = C, a.markForFocusLater = function() {
          m.push(document.activeElement);
        }, a.returnFocus = function() {
          var T = arguments.length > 0 && arguments[0] !== void 0 && arguments[0], P = null;
          try {
            return void (m.length !== 0 && (P = m.pop()).focus({ preventScroll: T }));
          } catch {
            console.warn(["You tried to return focus to", P, "but it is not in the DOM anymore"].join(" "));
          }
        }, a.popWithoutFocus = function() {
          m.length > 0 && m.pop();
        }, a.setupScopedFocus = function(T) {
          g = T, window.addEventListener ? (window.addEventListener("blur", y, !1), document.addEventListener("focus", C, !0)) : (window.attachEvent("onBlur", y), document.attachEvent("onFocus", C));
        }, a.teardownScopedFocus = function() {
          g = null, window.addEventListener ? (window.removeEventListener("blur", y), document.removeEventListener("focus", C)) : (window.detachEvent("onBlur", y), document.detachEvent("onFocus", C));
        };
        var c, o = u(42), x = (c = o) && c.__esModule ? c : { default: c }, m = [], g = null, v = !1;
        function y() {
          v = !0;
        }
        function C() {
          if (v) {
            if (v = !1, !g) return;
            setTimeout(function() {
              g.contains(document.activeElement) || ((0, x.default)(g)[0] || g).focus();
            }, 0);
          }
        }
      }, function(b, a, u) {
        Object.defineProperty(a, "__esModule", { value: !0 }), a.default = function(m, g) {
          var v = (0, x.default)(m);
          if (!v.length) return void g.preventDefault();
          var y = void 0, C = g.shiftKey, T = v[0], P = v[v.length - 1], X = function B() {
            var N = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : document;
            return N.activeElement.shadowRoot ? B(N.activeElement.shadowRoot) : N.activeElement;
          }();
          if (m === X) {
            if (!C) return;
            y = P;
          }
          if (P !== X || C || (y = T), T === X && C && (y = P), y) return g.preventDefault(), void y.focus();
          var K = /(\bChrome\b|\bSafari\b)\//.exec(navigator.userAgent);
          if (!(K == null || K[1] == "Chrome" || /\biPod\b|\biPad\b/g.exec(navigator.userAgent) != null)) {
            var j = v.indexOf(X);
            if (j > -1 && (j += C ? -1 : 1), (y = v[j]) === void 0) return g.preventDefault(), void (y = C ? P : T).focus();
            g.preventDefault(), y.focus();
          }
        };
        var c, o = u(42), x = (c = o) && c.__esModule ? c : { default: c };
        b.exports = a.default;
      }, function(b, a, u) {
        var c = function() {
        };
        b.exports = c;
      }, function(b, a, u) {
        var c;
        (function() {
          var o = !(typeof window > "u" || !window.document || !window.document.createElement), x = { canUseDOM: o, canUseWorkers: typeof Worker < "u", canUseEventListeners: o && !(!window.addEventListener && !window.attachEvent), canUseViewport: o && !!window.screen };
          (c = (function() {
            return x;
          }).call(a, u, a, b)) === void 0 || (b.exports = c);
        })();
      }, function(b, a, u) {
        Object.defineProperty(a, "__esModule", { value: !0 }), a.resetState = function() {
          var m = document.getElementsByTagName("html")[0];
          for (var g in c) x(m, c[g]);
          var v = document.body;
          for (var y in o) x(v, o[y]);
          c = {}, o = {};
        }, a.log = function() {
        };
        var c = {}, o = {};
        function x(m, g) {
          m.classList.remove(g);
        }
        a.add = function(m, g) {
          return v = m.classList, y = m.nodeName.toLowerCase() == "html" ? c : o, void g.split(" ").forEach(function(C) {
            (function(T, P) {
              T[P] || (T[P] = 0), T[P] += 1;
            })(y, C), v.add(C);
          });
          var v, y;
        }, a.remove = function(m, g) {
          return v = m.classList, y = m.nodeName.toLowerCase() == "html" ? c : o, void g.split(" ").forEach(function(C) {
            (function(T, P) {
              T[P] && (T[P] -= 1);
            })(y, C), y[C] === 0 && v.remove(C);
          });
          var v, y;
        };
      }, function(b, a, u) {
        Object.defineProperty(a, "__esModule", { value: !0 }), a.resetState = function() {
          for (var C = [m, g], T = 0; T < C.length; T++) {
            var P = C[T];
            P && P.parentNode && P.parentNode.removeChild(P);
          }
          m = g = null, v = [];
        }, a.log = function() {
          console.log("bodyTrap ----------"), console.log(v.length);
          for (var C = [m, g], T = 0; T < C.length; T++) {
            var P = C[T] || {};
            console.log(P.nodeName, P.className, P.id);
          }
          console.log("edn bodyTrap ----------");
        };
        var c, o = u(44), x = (c = o) && c.__esModule ? c : { default: c }, m = void 0, g = void 0, v = [];
        function y() {
          v.length !== 0 && v[v.length - 1].focusContent();
        }
        x.default.subscribe(function(C, T) {
          m || g || ((m = document.createElement("div")).setAttribute("data-react-modal-body-trap", ""), m.style.position = "absolute", m.style.opacity = "0", m.setAttribute("tabindex", "0"), m.addEventListener("focus", y), (g = m.cloneNode()).addEventListener("focus", y)), (v = T).length > 0 ? (document.body.firstChild !== m && document.body.insertBefore(m, document.body.firstChild), document.body.lastChild !== g && document.body.appendChild(g)) : (m.parentElement && m.parentElement.removeChild(m), g.parentElement && g.parentElement.removeChild(g));
        });
      }, function(b, a, u) {
        function c() {
          var g = this.constructor.getDerivedStateFromProps(this.props, this.state);
          g != null && this.setState(g);
        }
        function o(g) {
          this.setState((function(v) {
            var y = this.constructor.getDerivedStateFromProps(g, v);
            return y ?? null;
          }).bind(this));
        }
        function x(g, v) {
          try {
            var y = this.props, C = this.state;
            this.props = g, this.state = v, this.__reactInternalSnapshotFlag = !0, this.__reactInternalSnapshot = this.getSnapshotBeforeUpdate(y, C);
          } finally {
            this.props = y, this.state = C;
          }
        }
        function m(g) {
          var v = g.prototype;
          if (!v || !v.isReactComponent) throw new Error("Can only polyfill class components");
          if (typeof g.getDerivedStateFromProps != "function" && typeof v.getSnapshotBeforeUpdate != "function") return g;
          var y = null, C = null, T = null;
          if (typeof v.componentWillMount == "function" ? y = "componentWillMount" : typeof v.UNSAFE_componentWillMount == "function" && (y = "UNSAFE_componentWillMount"), typeof v.componentWillReceiveProps == "function" ? C = "componentWillReceiveProps" : typeof v.UNSAFE_componentWillReceiveProps == "function" && (C = "UNSAFE_componentWillReceiveProps"), typeof v.componentWillUpdate == "function" ? T = "componentWillUpdate" : typeof v.UNSAFE_componentWillUpdate == "function" && (T = "UNSAFE_componentWillUpdate"), y !== null || C !== null || T !== null) {
            var P = g.displayName || g.name, X = typeof g.getDerivedStateFromProps == "function" ? "getDerivedStateFromProps()" : "getSnapshotBeforeUpdate()";
            throw Error(`Unsafe legacy lifecycles will not be called for components using new component APIs.

` + P + " uses " + X + " but also contains the following legacy lifecycles:" + (y !== null ? `
  ` + y : "") + (C !== null ? `
  ` + C : "") + (T !== null ? `
  ` + T : "") + `

The above lifecycles should be removed. Learn more about this warning here:
https://fb.me/react-async-component-lifecycle-hooks`);
          }
          if (typeof g.getDerivedStateFromProps == "function" && (v.componentWillMount = c, v.componentWillReceiveProps = o), typeof v.getSnapshotBeforeUpdate == "function") {
            if (typeof v.componentDidUpdate != "function") throw new Error("Cannot polyfill getSnapshotBeforeUpdate() for components that do not define componentDidUpdate() on the prototype");
            v.componentWillUpdate = x;
            var K = v.componentDidUpdate;
            v.componentDidUpdate = function(j, B, N) {
              var M = this.__reactInternalSnapshotFlag ? this.__reactInternalSnapshot : N;
              K.call(this, j, B, M);
            };
          }
          return g;
        }
        u.r(a), u.d(a, "polyfill", function() {
          return m;
        }), c.__suppressDeprecationWarning = !0, o.__suppressDeprecationWarning = !0, x.__suppressDeprecationWarning = !0;
      }, function(b, a, u) {
        var c = u(6), o = u(87);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[b.i, o, ""]]);
        var x = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, x), b.exports = o.locals || {};
      }, function(b, a, u) {
        (b.exports = u(7)(!1)).push([b.i, ".ck-inspector-modal{--ck-inspector-set-data-modal-overlay:rgba(0,0,0,0.5);--ck-inspector-set-data-modal-shadow:rgba(0,0,0,0.06);--ck-inspector-set-data-modal-button-background:#eee;--ck-inspector-set-data-modal-button-background-hover:#ddd;--ck-inspector-set-data-modal-save-button-background:#1976d2;--ck-inspector-set-data-modal-save-button-background-hover:#0b60b5}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal{z-index:999999;position:fixed;inset:0;background-color:var(--ck-inspector-set-data-modal-overlay)}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content{position:absolute;border:1px solid var(--ck-inspector-color-border);background:var(--ck-inspector-color-white);overflow:auto;border-radius:2px;outline:none;box-shadow:0 1px 1px var(--ck-inspector-set-data-modal-shadow),0 2px 2px var(--ck-inspector-set-data-modal-shadow),0 4px 4px var(--ck-inspector-set-data-modal-shadow),0 8px 8px var(--ck-inspector-set-data-modal-shadow),0 16px 16px var(--ck-inspector-set-data-modal-shadow);max-height:calc(100vh - 160px);max-width:calc(100vw - 160px);width:100%;height:100%;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;justify-content:space-between}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content h2{font-size:14px;font-weight:700;margin:0;padding:12px 20px;background:var(--ck-inspector-color-background);border-bottom:1px solid var(--ck-inspector-color-border)}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content textarea{flex-grow:1;margin:20px;border:1px solid var(--ck-inspector-color-border);border-radius:2px;resize:none;padding:10px;font-family:monospace;font-size:14px}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content button{padding:10px 20px;border-radius:2px;font-size:14px;white-space:nowrap;border:1px solid var(--ck-inspector-color-border)}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content button:hover{background:var(--ck-inspector-set-data-modal-button-background-hover)}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons{margin:0 20px 20px;display:flex;justify-content:center}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button+button{margin-left:20px}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button:first-child{margin-right:auto}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button:not(:first-child){flex-basis:20%}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button:last-child{background:var(--ck-inspector-set-data-modal-save-button-background);border-color:var(--ck-inspector-set-data-modal-save-button-background);color:#fff;font-weight:700}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button:last-child:hover{background:var(--ck-inspector-set-data-modal-save-button-background-hover)}", ""]);
      }, function(b, a, u) {
        var c = u(6), o = u(89);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[b.i, o, ""]]);
        var x = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, x), b.exports = o.locals || {};
      }, function(b, a, u) {
        (b.exports = u(7)(!1)).push([b.i, ".ck-inspector .ck-inspector-editor-quick-actions{display:flex;align-content:center;justify-content:center;align-items:center;flex-direction:row;flex-wrap:nowrap}.ck-inspector .ck-inspector-editor-quick-actions>.ck-inspector-button{margin-left:.3em}.ck-inspector .ck-inspector-editor-quick-actions>.ck-inspector-button.ck-inspector-button_data-copied{animation-duration:.5s;animation-name:ck-inspector-bounce-in;color:green}@keyframes ck-inspector-bounce-in{0%{opacity:0;transform:scale3d(.5,.5,.5)}20%{transform:scale3d(1.1,1.1,1.1)}40%{transform:scale3d(.8,.8,.8)}60%{opacity:1;transform:scale3d(1.05,1.05,1.05)}to{opacity:1;transform:scaleX(1)}}", ""]);
      }, function(b, a, u) {
        var c = u(6), o = u(91);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[b.i, o, ""]]);
        var x = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, x), b.exports = o.locals || {};
      }, function(b, a, u) {
        (b.exports = u(7)(!1)).push([b.i, "html body.ck-inspector-body-expanded{margin-bottom:var(--ck-inspector-height)}html body.ck-inspector-body-collapsed{margin-bottom:var(--ck-inspector-collapsed-height)}.ck-inspector-wrapper *{box-sizing:border-box}", ""]);
      }, , , function(b, a, u) {
        u.r(a), u.d(a, "default", function() {
          return $e;
        });
        var c = u(0), o = u.n(c), x = u(12), m = u.n(x);
        function g(E) {
          return "Minified Redux error #" + E + "; visit https://redux.js.org/Errors?code=" + E + " for the full message or use the non-minified dev environment for full errors. ";
        }
        var v = typeof Symbol == "function" && Symbol.observable || "@@observable", y = function() {
          return Math.random().toString(36).substring(7).split("").join(".");
        }, C = { INIT: "@@redux/INIT" + y(), REPLACE: "@@redux/REPLACE" + y(), PROBE_UNKNOWN_ACTION: function() {
          return "@@redux/PROBE_UNKNOWN_ACTION" + y();
        } };
        function T(E) {
          if (typeof E != "object" || E === null) return !1;
          for (var s = E; Object.getPrototypeOf(s) !== null; ) s = Object.getPrototypeOf(s);
          return Object.getPrototypeOf(E) === s;
        }
        function P(E, s, f) {
          var h;
          if (typeof s == "function" && typeof f == "function" || typeof f == "function" && typeof arguments[3] == "function") throw new Error(g(0));
          if (typeof s == "function" && f === void 0 && (f = s, s = void 0), f !== void 0) {
            if (typeof f != "function") throw new Error(g(1));
            return f(P)(E, s);
          }
          if (typeof E != "function") throw new Error(g(2));
          var _ = E, O = s, z = [], ne = z, de = !1;
          function pe() {
            ne === z && (ne = z.slice());
          }
          function Ee() {
            if (de) throw new Error(g(3));
            return O;
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
          function Ve(Ie) {
            if (!T(Ie)) throw new Error(g(7));
            if (Ie.type === void 0) throw new Error(g(8));
            if (de) throw new Error(g(9));
            try {
              de = !0, O = _(O, Ie);
            } finally {
              de = !1;
            }
            for (var Fe = z = ne, et = 0; et < Fe.length; et++)
              (0, Fe[et])();
            return Ie;
          }
          function Ae(Ie) {
            if (typeof Ie != "function") throw new Error(g(10));
            _ = Ie, Ve({ type: C.REPLACE });
          }
          function Ke() {
            var Ie, Fe = Pe;
            return (Ie = { subscribe: function(et) {
              if (typeof et != "object" || et === null) throw new Error(g(11));
              function Ye() {
                et.next && et.next(Ee());
              }
              return Ye(), { unsubscribe: Fe(Ye) };
            } })[v] = function() {
              return this;
            }, Ie;
          }
          return Ve({ type: C.INIT }), (h = { dispatch: Ve, subscribe: Pe, getState: Ee, replaceReducer: Ae })[v] = Ke, h;
        }
        var X = o.a.createContext(null), K = function(E) {
          E();
        };
        function j() {
          var E = K, s = null, f = null;
          return { clear: function() {
            s = null, f = null;
          }, notify: function() {
            E(function() {
              for (var h = s; h; ) h.callback(), h = h.next;
            });
          }, get: function() {
            for (var h = [], _ = s; _; ) h.push(_), _ = _.next;
            return h;
          }, subscribe: function(h) {
            var _ = !0, O = f = { callback: h, next: null, prev: f };
            return O.prev ? O.prev.next = O : s = O, function() {
              _ && s !== null && (_ = !1, O.next ? O.next.prev = O.prev : f = O.prev, O.prev ? O.prev.next = O.next : s = O.next);
            };
          } };
        }
        var B = { notify: function() {
        }, get: function() {
          return [];
        } };
        function N(E, s) {
          var f, h = B;
          function _() {
            z.onStateChange && z.onStateChange();
          }
          function O() {
            f || (f = s ? s.addNestedSub(_) : E.subscribe(_), h = j());
          }
          var z = { addNestedSub: function(ne) {
            return O(), h.subscribe(ne);
          }, notifyNestedSubs: function() {
            h.notify();
          }, handleChangeWrapper: _, isSubscribed: function() {
            return !!f;
          }, trySubscribe: O, tryUnsubscribe: function() {
            f && (f(), f = void 0, h.clear(), h = B);
          }, getListeners: function() {
            return h;
          } };
          return z;
        }
        var M = typeof window < "u" && window.document !== void 0 && window.document.createElement !== void 0 ? c.useLayoutEffect : c.useEffect, V = function(E) {
          var s = E.store, f = E.context, h = E.children, _ = Object(c.useMemo)(function() {
            var ne = N(s);
            return { store: s, subscription: ne };
          }, [s]), O = Object(c.useMemo)(function() {
            return s.getState();
          }, [s]);
          M(function() {
            var ne = _.subscription;
            return ne.onStateChange = ne.notifyNestedSubs, ne.trySubscribe(), O !== s.getState() && ne.notifyNestedSubs(), function() {
              ne.tryUnsubscribe(), ne.onStateChange = null;
            };
          }, [_, O]);
          var z = f || X;
          return o.a.createElement(z.Provider, { value: _ }, h);
        };
        function R() {
          return (R = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var f = arguments[s];
              for (var h in f) Object.prototype.hasOwnProperty.call(f, h) && (E[h] = f[h]);
            }
            return E;
          }).apply(this, arguments);
        }
        function oe(E, s) {
          if (E == null) return {};
          var f, h, _ = {}, O = Object.keys(E);
          for (h = 0; h < O.length; h++) f = O[h], s.indexOf(f) >= 0 || (_[f] = E[f]);
          return _;
        }
        var Q = u(39), I = u.n(Q), A = u(45), se = ["getDisplayName", "methodName", "renderCountProp", "shouldHandleStateChanges", "storeKey", "withRef", "forwardRef", "context"], le = ["reactReduxForwardedRef"], te = [], ce = [null, null];
        function ye(E, s) {
          var f = E[1];
          return [s.payload, f + 1];
        }
        function J(E, s, f) {
          M(function() {
            return E.apply(void 0, s);
          }, f);
        }
        function fe(E, s, f, h, _, O, z) {
          E.current = h, s.current = _, f.current = !1, O.current && (O.current = null, z());
        }
        function D(E, s, f, h, _, O, z, ne, de, pe) {
          if (E) {
            var Ee = !1, Pe = null, Ve = function() {
              if (!Ee) {
                var Ae, Ke, Ie = s.getState();
                try {
                  Ae = h(Ie, _.current);
                } catch (Fe) {
                  Ke = Fe, Pe = Fe;
                }
                Ke || (Pe = null), Ae === O.current ? z.current || de() : (O.current = Ae, ne.current = Ae, z.current = !0, pe({ type: "STORE_UPDATED", payload: { error: Ke } }));
              }
            };
            return f.onStateChange = Ve, f.trySubscribe(), Ve(), function() {
              if (Ee = !0, f.tryUnsubscribe(), f.onStateChange = null, Pe) throw Pe;
            };
          }
        }
        var ie = function() {
          return [null, 0];
        };
        function be(E, s) {
          s === void 0 && (s = {});
          var f = s, h = f.getDisplayName, _ = h === void 0 ? function(Le) {
            return "ConnectAdvanced(" + Le + ")";
          } : h, O = f.methodName, z = O === void 0 ? "connectAdvanced" : O, ne = f.renderCountProp, de = ne === void 0 ? void 0 : ne, pe = f.shouldHandleStateChanges, Ee = pe === void 0 || pe, Pe = f.storeKey, Ve = Pe === void 0 ? "store" : Pe, Ae = (f.withRef, f.forwardRef), Ke = Ae !== void 0 && Ae, Ie = f.context, Fe = Ie === void 0 ? X : Ie, et = oe(f, se), Ye = Fe;
          return function(Le) {
            var ft = Le.displayName || Le.name || "Component", Dt = _(ft), It = R({}, et, { getDisplayName: _, methodName: z, renderCountProp: de, shouldHandleStateChanges: Ee, storeKey: Ve, displayName: Dt, wrappedComponentName: ft, WrappedComponent: Le }), jt = et.pure, _t = jt ? c.useMemo : function(lt) {
              return lt();
            };
            function zt(lt) {
              var Mn = Object(c.useMemo)(function() {
                var kn = lt.reactReduxForwardedRef, so = oe(lt, le);
                return [lt.context, kn, so];
              }, [lt]), Hn = Mn[0], zr = Mn[1], xt = Mn[2], io = Object(c.useMemo)(function() {
                return Hn && Hn.Consumer && Object(A.isContextConsumer)(o.a.createElement(Hn.Consumer, null)) ? Hn : Ye;
              }, [Hn, Ye]), In = Object(c.useContext)(io), $t = !!lt.store && !!lt.store.getState && !!lt.store.dispatch;
              In && In.store;
              var fn = $t ? lt.store : In.store, Xn = Object(c.useMemo)(function() {
                return function(kn) {
                  return E(kn.dispatch, It);
                }(fn);
              }, [fn]), Gt = Object(c.useMemo)(function() {
                if (!Ee) return ce;
                var kn = N(fn, $t ? null : In.subscription), so = kn.notifyNestedSubs.bind(kn);
                return [kn, so];
              }, [fn, $t, In]), dn = Gt[0], Lr = Gt[1], oi = Object(c.useMemo)(function() {
                return $t ? In : R({}, In, { subscription: dn });
              }, [$t, In, dn]), Ur = Object(c.useReducer)(ye, te, ie), Mo = Ur[0][0], mr = Ur[1];
              if (Mo && Mo.error) throw Mo.error;
              var zi = Object(c.useRef)(), gr = Object(c.useRef)(xt), Io = Object(c.useRef)(), ii = Object(c.useRef)(!1), Zn = _t(function() {
                return Io.current && xt === gr.current ? Io.current : Xn(fn.getState(), xt);
              }, [fn, Mo, xt]);
              J(fe, [gr, zi, ii, xt, Zn, Io, Lr]), J(D, [Ee, fn, dn, Xn, gr, zi, ii, Io, Lr, mr], [fn, dn, Xn]);
              var ao = Object(c.useMemo)(function() {
                return o.a.createElement(Le, R({}, Zn, { ref: zr }));
              }, [zr, Le, Zn]);
              return Object(c.useMemo)(function() {
                return Ee ? o.a.createElement(io.Provider, { value: oi }, ao) : ao;
              }, [io, ao, oi]);
            }
            var dt = jt ? o.a.memo(zt) : zt;
            if (dt.WrappedComponent = Le, dt.displayName = zt.displayName = Dt, Ke) {
              var An = o.a.forwardRef(function(lt, Mn) {
                return o.a.createElement(dt, R({}, lt, { reactReduxForwardedRef: Mn }));
              });
              return An.displayName = Dt, An.WrappedComponent = Le, I()(An, Le);
            }
            return I()(dt, Le);
          };
        }
        function Ce(E, s) {
          return E === s ? E !== 0 || s !== 0 || 1 / E == 1 / s : E != E && s != s;
        }
        function ke(E, s) {
          if (Ce(E, s)) return !0;
          if (typeof E != "object" || E === null || typeof s != "object" || s === null) return !1;
          var f = Object.keys(E), h = Object.keys(s);
          if (f.length !== h.length) return !1;
          for (var _ = 0; _ < f.length; _++) if (!Object.prototype.hasOwnProperty.call(s, f[_]) || !Ce(E[f[_]], s[f[_]])) return !1;
          return !0;
        }
        function Ne(E) {
          return function(s, f) {
            var h = E(s, f);
            function _() {
              return h;
            }
            return _.dependsOnOwnProps = !1, _;
          };
        }
        function xe(E) {
          return E.dependsOnOwnProps !== null && E.dependsOnOwnProps !== void 0 ? !!E.dependsOnOwnProps : E.length !== 1;
        }
        function ze(E, s) {
          return function(f, h) {
            h.displayName;
            var _ = function(O, z) {
              return _.dependsOnOwnProps ? _.mapToProps(O, z) : _.mapToProps(O);
            };
            return _.dependsOnOwnProps = !0, _.mapToProps = function(O, z) {
              _.mapToProps = E, _.dependsOnOwnProps = xe(E);
              var ne = _(O, z);
              return typeof ne == "function" && (_.mapToProps = ne, _.dependsOnOwnProps = xe(ne), ne = _(O, z)), ne;
            }, _;
          };
        }
        var Je = [function(E) {
          return typeof E == "function" ? ze(E) : void 0;
        }, function(E) {
          return E ? void 0 : Ne(function(s) {
            return { dispatch: s };
          });
        }, function(E) {
          return E && typeof E == "object" ? Ne(function(s) {
            return function(f, h) {
              var _ = {}, O = function(ne) {
                var de = f[ne];
                typeof de == "function" && (_[ne] = function() {
                  return h(de.apply(void 0, arguments));
                });
              };
              for (var z in f) O(z);
              return _;
            }(E, s);
          }) : void 0;
        }], G = [function(E) {
          return typeof E == "function" ? ze(E) : void 0;
        }, function(E) {
          return E ? void 0 : Ne(function() {
            return {};
          });
        }];
        function Y(E, s, f) {
          return R({}, f, E, s);
        }
        var me = [function(E) {
          return typeof E == "function" ? /* @__PURE__ */ function(s) {
            return function(f, h) {
              h.displayName;
              var _, O = h.pure, z = h.areMergedPropsEqual, ne = !1;
              return function(de, pe, Ee) {
                var Pe = s(de, pe, Ee);
                return ne ? O && z(Pe, _) || (_ = Pe) : (ne = !0, _ = Pe), _;
              };
            };
          }(E) : void 0;
        }, function(E) {
          return E ? void 0 : function() {
            return Y;
          };
        }], l = ["initMapStateToProps", "initMapDispatchToProps", "initMergeProps"];
        function d(E, s, f, h) {
          return function(_, O) {
            return f(E(_, O), s(h, O), O);
          };
        }
        function k(E, s, f, h, _) {
          var O, z, ne, de, pe, Ee = _.areStatesEqual, Pe = _.areOwnPropsEqual, Ve = _.areStatePropsEqual, Ae = !1;
          function Ke(Ie, Fe) {
            var et, Ye, Le = !Pe(Fe, z), ft = !Ee(Ie, O);
            return O = Ie, z = Fe, Le && ft ? (ne = E(O, z), s.dependsOnOwnProps && (de = s(h, z)), pe = f(ne, de, z)) : Le ? (E.dependsOnOwnProps && (ne = E(O, z)), s.dependsOnOwnProps && (de = s(h, z)), pe = f(ne, de, z)) : (ft && (et = E(O, z), Ye = !Ve(et, ne), ne = et, Ye && (pe = f(ne, de, z))), pe);
          }
          return function(Ie, Fe) {
            return Ae ? Ke(Ie, Fe) : (ne = E(O = Ie, z = Fe), de = s(h, z), pe = f(ne, de, z), Ae = !0, pe);
          };
        }
        function U(E, s) {
          var f = s.initMapStateToProps, h = s.initMapDispatchToProps, _ = s.initMergeProps, O = oe(s, l), z = f(E, O), ne = h(E, O), de = _(E, O);
          return (O.pure ? k : d)(z, ne, de, E, O);
        }
        var F = ["pure", "areStatesEqual", "areOwnPropsEqual", "areStatePropsEqual", "areMergedPropsEqual"];
        function W(E, s, f) {
          for (var h = s.length - 1; h >= 0; h--) {
            var _ = s[h](E);
            if (_) return _;
          }
          return function(O, z) {
            throw new Error("Invalid value of type " + typeof E + " for " + f + " argument when connecting component " + z.wrappedComponentName + ".");
          };
        }
        function he(E, s) {
          return E === s;
        }
        function je(E) {
          var s = {}, f = s.connectHOC, h = f === void 0 ? be : f, _ = s.mapStateToPropsFactories, O = _ === void 0 ? G : _, z = s.mapDispatchToPropsFactories, ne = z === void 0 ? Je : z, de = s.mergePropsFactories, pe = de === void 0 ? me : de, Ee = s.selectorFactory, Pe = Ee === void 0 ? U : Ee;
          return function(Ve, Ae, Ke, Ie) {
            Ie === void 0 && (Ie = {});
            var Fe = Ie, et = Fe.pure, Ye = et === void 0 || et, Le = Fe.areStatesEqual, ft = Le === void 0 ? he : Le, Dt = Fe.areOwnPropsEqual, It = Dt === void 0 ? ke : Dt, jt = Fe.areStatePropsEqual, _t = jt === void 0 ? ke : jt, zt = Fe.areMergedPropsEqual, dt = zt === void 0 ? ke : zt, An = oe(Fe, F), lt = W(Ve, O, "mapStateToProps"), Mn = W(Ae, ne, "mapDispatchToProps"), Hn = W(Ke, pe, "mergeProps");
            return h(Pe, R({ methodName: "connect", getDisplayName: function(zr) {
              return "Connect(" + zr + ")";
            }, shouldHandleStateChanges: !!Ve, initMapStateToProps: lt, initMapDispatchToProps: Mn, initMergeProps: Hn, pure: Ye, areStatesEqual: ft, areOwnPropsEqual: It, areStatePropsEqual: _t, areMergedPropsEqual: dt }, An));
          };
        }
        var Re = je(), Xe;
        Xe = x.unstable_batchedUpdates, K = Xe;
        function He(E) {
          return { type: "SET_MODEL_ACTIVE_TAB", tabName: E };
        }
        function At() {
          return { type: "TOGGLE_IS_COLLAPSED" };
        }
        function wt(E) {
          return { type: "SET_EDITORS", editors: E };
        }
        function Jt(E) {
          return { type: "SET_CURRENT_EDITOR_NAME", editorName: E };
        }
        function kt(E) {
          return { type: "SET_ACTIVE_INSPECTOR_TAB", tabName: E };
        }
        var gt = u(10), cn = u(4);
        class Er {
          constructor(s) {
            this._config = s;
          }
          startListening(s) {
            s.model.document.on("change", this._config.onModelChange), s.editing.view.on("render", this._config.onViewRender), s.on("change:isReadOnly", this._config.onReadOnlyChange);
          }
          stopListening(s) {
            s.model.document.off("change", this._config.onModelChange), s.editing.view.off("render", this._config.onViewRender), s.off("change:isReadOnly", this._config.onReadOnlyChange);
          }
        }
        function Tt(E) {
          return E.editors.get(E.currentEditorName);
        }
        class pt {
          static set(s, f) {
            window.localStorage.setItem("ck5-inspector-" + s, f);
          }
          static get(s) {
            return window.localStorage.getItem("ck5-inspector-" + s);
          }
        }
        function Yn(E, s, f) {
          const h = function(_, O, z) {
            if (_.ui.activeTab !== "Model") return O;
            if (!O) return Sn(_, O);
            switch (z.type) {
              case "SET_MODEL_CURRENT_ROOT_NAME":
                return function(ne, de, pe) {
                  const Ee = pe.currentRootName;
                  return { ...de, ...or(ne, de, { currentRootName: Ee }), currentNode: null, currentNodeDefinition: null, currentRootName: Ee };
                }(_, O, z);
              case "SET_MODEL_CURRENT_NODE":
                return { ...O, currentNode: z.currentNode, currentNodeDefinition: Object(gt.b)(Tt(_), z.currentNode) };
              case "SET_ACTIVE_INSPECTOR_TAB":
              case "UPDATE_MODEL_STATE":
                return { ...O, ...or(_, O) };
              case "SET_EDITORS":
              case "SET_CURRENT_EDITOR_NAME":
                return Sn(_, O);
              default:
                return O;
            }
          }(E, s, f);
          return h && (h.ui = function(_, O) {
            if (!_) return { activeTab: pt.get("active-model-tab-name") || "Inspect", showMarkers: pt.get("model-show-markers") === "true", showCompactText: pt.get("model-compact-text") === "true" };
            switch (O.type) {
              case "SET_MODEL_ACTIVE_TAB":
                return function(z, ne) {
                  return pt.set("active-model-tab-name", ne.tabName), { ...z, activeTab: ne.tabName };
                }(_, O);
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
          }(h.ui, f)), h;
        }
        function Sn(E, s = {}) {
          const f = Tt(E);
          if (!f) return { ui: s.ui };
          const h = Object(gt.d)(f)[0].rootName;
          return { ...s, ...or(E, s, { currentRootName: h }), currentRootName: h, currentNode: null, currentNodeDefinition: null };
        }
        function or(E, s, f) {
          const h = Tt(E), _ = { ...s, ...f }, O = _.currentRootName, z = Object(gt.c)(h, O), ne = Object(gt.a)(h, O), de = Object(gt.e)({ currentEditor: h, currentRootName: _.currentRootName, ranges: z, markers: ne });
          let pe = _.currentNode, Ee = _.currentNodeDefinition;
          return pe ? pe.root.rootName !== O || !Object(cn.d)(pe) && !pe.parent ? (pe = null, Ee = null) : Ee = Object(gt.b)(h, pe) : Ee = null, { treeDefinition: de, currentNode: pe, currentNodeDefinition: Ee, ranges: z, markers: ne };
        }
        function _r(E) {
          return { type: "SET_VIEW_ACTIVE_TAB", tabName: E };
        }
        function ko() {
          return { type: "UPDATE_VIEW_STATE" };
        }
        var en = u(9), Yt = u(2);
        function xr(E, s, f) {
          const h = function(_, O, z) {
            if (_.ui.activeTab !== "View") return O;
            if (!O) return qt(_, O);
            switch (z.type) {
              case "SET_VIEW_CURRENT_ROOT_NAME":
                return function(ne, de, pe) {
                  const Ee = pe.currentRootName;
                  return { ...de, ...gn(ne, de, { currentRootName: Ee }), currentNode: null, currentNodeDefinition: null, currentRootName: Ee };
                }(_, O, z);
              case "SET_VIEW_CURRENT_NODE":
                return { ...O, currentNode: z.currentNode, currentNodeDefinition: Object(en.b)(z.currentNode) };
              case "SET_ACTIVE_INSPECTOR_TAB":
              case "UPDATE_VIEW_STATE":
                return { ...O, ...gn(_, O) };
              case "SET_EDITORS":
              case "SET_CURRENT_EDITOR_NAME":
                return qt(_, O);
              default:
                return O;
            }
          }(E, s, f);
          return h && (h.ui = function(_, O, z) {
            if (!O) return { activeTab: pt.get("active-view-tab-name") || "Inspect", showElementTypes: pt.get("view-element-types") === "true" };
            switch (z.type) {
              case "SET_VIEW_ACTIVE_TAB":
                return function(ne, de) {
                  return pt.set("active-view-tab-name", de.tabName), { ...ne, activeTab: de.tabName };
                }(O, z);
              case "TOGGLE_VIEW_SHOW_ELEMENT_TYPES":
                return function(ne, de) {
                  const pe = !de.showElementTypes;
                  return pt.set("view-element-types", pe), { ...de, showElementTypes: pe };
                }(0, O);
              default:
                return O;
            }
          }(0, h.ui, f)), h;
        }
        function qt(E, s = {}) {
          const f = Tt(E), h = Object(en.d)(f), _ = h[0] ? h[0].rootName : null;
          return { ...s, ...gn(E, s, { currentRootName: _ }), currentRootName: _, currentNode: null, currentNodeDefinition: null };
        }
        function gn(E, s, f) {
          const h = { ...s, ...f }, _ = h.currentRootName, O = Object(en.c)(Tt(E), _), z = Object(en.e)({ currentEditor: Tt(E), currentRootName: _, ranges: O });
          let ne = h.currentNode, de = h.currentNodeDefinition;
          return ne ? ne.root.rootName !== _ || !Object(Yt.g)(ne) && !ne.parent ? (ne = null, de = null) : de = Object(en.b)(ne) : de = null, { treeDefinition: z, currentNode: ne, currentNodeDefinition: de, ranges: O };
        }
        function Sr() {
          return { type: "UPDATE_COMMANDS_STATE" };
        }
        var ut = u(1);
        function Cr({ editors: E, currentEditorName: s }, f) {
          if (!f) return null;
          const h = E.get(s).commands.get(f);
          return { currentCommandName: f, type: "Command", url: "https://ckeditor.com/docs/ckeditor5/latest/api/module_core_command-Command.html", properties: Object(ut.b)({ isEnabled: { value: h.isEnabled }, value: { value: h.value } }), command: h };
        }
        function bn({ editors: E, currentEditorName: s }) {
          if (!E.get(s)) return [];
          const f = [];
          for (const [h, _] of E.get(s).commands) {
            const O = [];
            _.value !== void 0 && O.push(["value", Object(ut.a)(_.value, !1)]), f.push({ name: h, type: "element", children: [], node: h, attributes: O, presentation: { isEmpty: !0, cssClass: ["ck-inspector-tree-node_tagless", _.isEnabled ? "" : "ck-inspector-tree-node_disabled"].join(" ") } });
          }
          return f.sort((h, _) => h.name > _.name ? 1 : -1);
        }
        function Tr(E, s = {}) {
          return { ...s, currentCommandName: null, currentCommandDefinition: null, treeDefinition: bn(E) };
        }
        function ir(E) {
          return { type: "SET_SCHEMA_CURRENT_DEFINITION_NAME", currentSchemaDefinitionName: E };
        }
        const ar = ["isBlock", "isInline", "isObject", "isContent", "isLimit", "isSelectable"], Cn = "https://ckeditor.com/docs/ckeditor5/latest/api/";
        function sr({ editors: E, currentEditorName: s }, f) {
          if (!f) return null;
          const h = E.get(s).model.schema, _ = h.getDefinitions()[f], O = {}, z = {}, ne = {};
          let de = {};
          for (const pe of ar) _[pe] && (O[pe] = { value: _[pe] });
          for (const pe of _.allowChildren.sort()) z[pe] = { value: !0, title: "Click to see the definition of " + pe };
          for (const pe of _.allowIn.sort()) ne[pe] = { value: !0, title: "Click to see the definition of " + pe };
          for (const pe of _.allowAttributes.sort()) de[pe] = { value: !0 };
          de = Object(ut.b)(de);
          for (const pe in de) {
            const Ee = h.getAttributeProperties(pe), Pe = {};
            for (const Ve in Ee) Pe[Ve] = { value: Ee[Ve] };
            de[pe].subProperties = Object(ut.b)(Pe);
          }
          return { currentSchemaDefinitionName: f, type: "SchemaCompiledItemDefinition", urls: { general: Cn + "module_engine_model_schema-SchemaCompiledItemDefinition.html", allowAttributes: Cn + "module_engine_model_schema-SchemaItemDefinition.html#member-allowAttributes", allowChildren: Cn + "module_engine_model_schema-SchemaItemDefinition.html#member-allowChildren", allowIn: Cn + "module_engine_model_schema-SchemaItemDefinition.html#member-allowIn" }, properties: Object(ut.b)(O), allowChildren: Object(ut.b)(z), allowIn: Object(ut.b)(ne), allowAttributes: de, definition: _ };
        }
        function Tn({ editors: E, currentEditorName: s }) {
          if (!E.get(s)) return [];
          const f = [], h = E.get(s).model.schema.getDefinitions();
          for (const _ in h) f.push({ name: _, type: "element", children: [], node: _, attributes: [], presentation: { isEmpty: !0, cssClass: "ck-inspector-tree-node_tagless" } });
          return f.sort((_, O) => _.name > O.name ? 1 : -1);
        }
        function lr(E, s = {}) {
          return { ...s, currentSchemaDefinitionName: null, currentSchemaDefinition: null, treeDefinition: Tn(E) };
        }
        var On = u(8);
        function Gr(E, s) {
          const f = function(h, _) {
            switch (_.type) {
              case "SET_EDITORS":
                return function(O, z) {
                  const ne = { editors: new Map(z.editors) };
                  return z.editors.size ? z.editors.has(O.currentEditorName) || (ne.currentEditorName = Object(On.b)(z.editors)) : ne.currentEditorName = null, { ...O, ...ne };
                }(h, _);
              case "SET_CURRENT_EDITOR_NAME":
                return function(O, z) {
                  return { ...O, currentEditorName: z.editorName };
                }(h, _);
              default:
                return h;
            }
          }(E, s);
          return f.currentEditorGlobals = function(h, _, O) {
            switch (O.type) {
              case "SET_EDITORS":
              case "SET_CURRENT_EDITOR_NAME":
                return { ...Xr(h, {}) };
              case "UPDATE_CURRENT_EDITOR_IS_READ_ONLY":
                return Xr(h, _);
              default:
                return _;
            }
          }(f, f.currentEditorGlobals, s), f.ui = function(h, _) {
            if (!h.activeTab) {
              let O;
              return O = h.isCollapsed !== void 0 ? h.isCollapsed : pt.get("is-collapsed") === "true", { ...h, isCollapsed: O, activeTab: pt.get("active-tab-name") || "Model", height: pt.get("height") || "400px", sidePaneWidth: pt.get("side-pane-width") || "500px" };
            }
            switch (_.type) {
              case "TOGGLE_IS_COLLAPSED":
                return function(O) {
                  const z = !O.isCollapsed;
                  return pt.set("is-collapsed", z), { ...O, isCollapsed: z };
                }(h);
              case "SET_HEIGHT":
                return function(O, z) {
                  return pt.set("height", z.newHeight), { ...O, height: z.newHeight };
                }(h, _);
              case "SET_SIDE_PANE_WIDTH":
                return function(O, z) {
                  return pt.set("side-pane-width", z.newWidth), { ...O, sidePaneWidth: z.newWidth };
                }(h, _);
              case "SET_ACTIVE_INSPECTOR_TAB":
                return function(O, z) {
                  return pt.set("active-tab-name", z.tabName), { ...O, activeTab: z.tabName };
                }(h, _);
              default:
                return h;
            }
          }(f.ui, s), f.model = Yn(f, f.model, s), f.view = xr(f, f.view, s), f.commands = function(h, _, O) {
            if (h.ui.activeTab !== "Commands") return _;
            if (!_) return Tr(h, _);
            switch (O.type) {
              case "SET_COMMANDS_CURRENT_COMMAND_NAME":
                return { ..._, currentCommandDefinition: Cr(h, O.currentCommandName), currentCommandName: O.currentCommandName };
              case "SET_ACTIVE_INSPECTOR_TAB":
              case "UPDATE_COMMANDS_STATE":
                return { ..._, currentCommandDefinition: Cr(h, _.currentCommandName), treeDefinition: bn(h) };
              case "SET_EDITORS":
              case "SET_CURRENT_EDITOR_NAME":
                return Tr(h, _);
              default:
                return _;
            }
          }(f, f.commands, s), f.schema = function(h, _, O) {
            if (h.ui.activeTab !== "Schema") return _;
            if (!_) return lr(h, _);
            switch (O.type) {
              case "SET_SCHEMA_CURRENT_DEFINITION_NAME":
                return { ..._, currentSchemaDefinition: sr(h, O.currentSchemaDefinitionName), currentSchemaDefinitionName: O.currentSchemaDefinitionName };
              case "SET_ACTIVE_INSPECTOR_TAB":
                return { ..._, currentSchemaDefinition: sr(h, _.currentSchemaDefinitionName), treeDefinition: Tn(h) };
              case "SET_EDITORS":
              case "SET_CURRENT_EDITOR_NAME":
                return lr(h, _);
              default:
                return _;
            }
          }(f, f.schema, s), { ...E, ...f };
        }
        function Xr(E, s) {
          const f = Tt(E);
          return { ...s, isReadOnly: !!f && f.isReadOnly };
        }
        var H = u(46), ae = u.n(H), we = /* @__PURE__ */ function() {
          var E = function(s, f) {
            return (E = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(h, _) {
              h.__proto__ = _;
            } || function(h, _) {
              for (var O in _) _.hasOwnProperty(O) && (h[O] = _[O]);
            })(s, f);
          };
          return function(s, f) {
            function h() {
              this.constructor = s;
            }
            E(s, f), s.prototype = f === null ? Object.create(f) : (h.prototype = f.prototype, new h());
          };
        }(), Se = function() {
          return (Se = Object.assign || function(E) {
            for (var s, f = 1, h = arguments.length; f < h; f++) for (var _ in s = arguments[f]) Object.prototype.hasOwnProperty.call(s, _) && (E[_] = s[_]);
            return E;
          }).apply(this, arguments);
        }, it = { top: { width: "100%", height: "10px", top: "-5px", left: "0px", cursor: "row-resize" }, right: { width: "10px", height: "100%", top: "0px", right: "-5px", cursor: "col-resize" }, bottom: { width: "100%", height: "10px", bottom: "-5px", left: "0px", cursor: "row-resize" }, left: { width: "10px", height: "100%", top: "0px", left: "-5px", cursor: "col-resize" }, topRight: { width: "20px", height: "20px", position: "absolute", right: "-10px", top: "-10px", cursor: "ne-resize" }, bottomRight: { width: "20px", height: "20px", position: "absolute", right: "-10px", bottom: "-10px", cursor: "se-resize" }, bottomLeft: { width: "20px", height: "20px", position: "absolute", left: "-10px", bottom: "-10px", cursor: "sw-resize" }, topLeft: { width: "20px", height: "20px", position: "absolute", left: "-10px", top: "-10px", cursor: "nw-resize" } }, qe = function(E) {
          function s() {
            var f = E !== null && E.apply(this, arguments) || this;
            return f.onMouseDown = function(h) {
              f.props.onResizeStart(h, f.props.direction);
            }, f.onTouchStart = function(h) {
              f.props.onResizeStart(h, f.props.direction);
            }, f;
          }
          return we(s, E), s.prototype.render = function() {
            return c.createElement("div", { className: this.props.className || "", style: Se(Se({ position: "absolute", userSelect: "none" }, it[this.props.direction]), this.props.replaceStyles || {}), onMouseDown: this.onMouseDown, onTouchStart: this.onTouchStart }, this.props.children);
          }, s;
        }(c.PureComponent), st = u(14), tt = u.n(st), Ot = /* @__PURE__ */ function() {
          var E = function(s, f) {
            return (E = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(h, _) {
              h.__proto__ = _;
            } || function(h, _) {
              for (var O in _) _.hasOwnProperty(O) && (h[O] = _[O]);
            })(s, f);
          };
          return function(s, f) {
            function h() {
              this.constructor = s;
            }
            E(s, f), s.prototype = f === null ? Object.create(f) : (h.prototype = f.prototype, new h());
          };
        }(), nt = function() {
          return (nt = Object.assign || function(E) {
            for (var s, f = 1, h = arguments.length; f < h; f++) for (var _ in s = arguments[f]) Object.prototype.hasOwnProperty.call(s, _) && (E[_] = s[_]);
            return E;
          }).apply(this, arguments);
        }, bt = { width: "auto", height: "auto" }, Nt = tt()(function(E, s, f) {
          return Math.max(Math.min(E, f), s);
        }), tn = tt()(function(E, s) {
          return Math.round(E / s) * s;
        }), ht = tt()(function(E, s) {
          return new RegExp(E, "i").test(s);
        }), Vt = function(E) {
          return !!(E.touches && E.touches.length);
        }, Nn = tt()(function(E, s, f) {
          f === void 0 && (f = 0);
          var h = s.reduce(function(O, z, ne) {
            return Math.abs(z - E) < Math.abs(s[O] - E) ? ne : O;
          }, 0), _ = Math.abs(s[h] - E);
          return f === 0 || _ < f ? s[h] : E;
        }), ct = tt()(function(E, s) {
          return E.substr(E.length - s.length, s.length) === s;
        }), yn = tt()(function(E) {
          return (E = E.toString()) === "auto" || ct(E, "px") || ct(E, "%") || ct(E, "vh") || ct(E, "vw") || ct(E, "vmax") || ct(E, "vmin") ? E : E + "px";
        }), un = function(E, s, f, h) {
          if (E && typeof E == "string") {
            if (ct(E, "px")) return Number(E.replace("px", ""));
            if (ct(E, "%")) return s * (Number(E.replace("%", "")) / 100);
            if (ct(E, "vw")) return f * (Number(E.replace("vw", "")) / 100);
            if (ct(E, "vh")) return h * (Number(E.replace("vh", "")) / 100);
          }
          return E;
        }, Pn = tt()(function(E, s, f, h, _, O, z) {
          return h = un(h, E.width, s, f), _ = un(_, E.height, s, f), O = un(O, E.width, s, f), z = un(z, E.height, s, f), { maxWidth: h === void 0 ? void 0 : Number(h), maxHeight: _ === void 0 ? void 0 : Number(_), minWidth: O === void 0 ? void 0 : Number(O), minHeight: z === void 0 ? void 0 : Number(z) };
        }), Eo = ["as", "style", "className", "grid", "snap", "bounds", "boundsByDirection", "size", "defaultSize", "minWidth", "minHeight", "maxWidth", "maxHeight", "lockAspectRatio", "lockAspectRatioExtraWidth", "lockAspectRatioExtraHeight", "enable", "handleStyles", "handleClasses", "handleWrapperStyle", "handleWrapperClass", "children", "onResizeStart", "onResize", "onResizeStop", "handleComponent", "scale", "resizeRatio", "snapGap"], _o = function(E) {
          function s(f) {
            var h = E.call(this, f) || this;
            return h.ratio = 1, h.resizable = null, h.parentLeft = 0, h.parentTop = 0, h.resizableLeft = 0, h.resizableRight = 0, h.resizableTop = 0, h.resizableBottom = 0, h.targetLeft = 0, h.targetTop = 0, h.appendBase = function() {
              if (!h.resizable || !h.window) return null;
              var _ = h.parentNode;
              if (!_) return null;
              var O = h.window.document.createElement("div");
              return O.style.width = "100%", O.style.height = "100%", O.style.position = "absolute", O.style.transform = "scale(0, 0)", O.style.left = "0", O.style.flex = "0", O.classList ? O.classList.add("__resizable_base__") : O.className += "__resizable_base__", _.appendChild(O), O;
            }, h.removeBase = function(_) {
              var O = h.parentNode;
              O && O.removeChild(_);
            }, h.ref = function(_) {
              _ && (h.resizable = _);
            }, h.state = { isResizing: !1, width: (h.propsSize && h.propsSize.width) === void 0 ? "auto" : h.propsSize && h.propsSize.width, height: (h.propsSize && h.propsSize.height) === void 0 ? "auto" : h.propsSize && h.propsSize.height, direction: "right", original: { x: 0, y: 0, width: 0, height: 0 }, backgroundStyle: { height: "100%", width: "100%", backgroundColor: "rgba(0,0,0,0)", cursor: "auto", opacity: 0, position: "fixed", zIndex: 9999, top: "0", left: "0", bottom: "0", right: "0" }, flexBasis: void 0 }, h.onResizeStart = h.onResizeStart.bind(h), h.onMouseMove = h.onMouseMove.bind(h), h.onMouseUp = h.onMouseUp.bind(h), h;
          }
          return Ot(s, E), Object.defineProperty(s.prototype, "parentNode", { get: function() {
            return this.resizable ? this.resizable.parentNode : null;
          }, enumerable: !1, configurable: !0 }), Object.defineProperty(s.prototype, "window", { get: function() {
            return this.resizable && this.resizable.ownerDocument ? this.resizable.ownerDocument.defaultView : null;
          }, enumerable: !1, configurable: !0 }), Object.defineProperty(s.prototype, "propsSize", { get: function() {
            return this.props.size || this.props.defaultSize || bt;
          }, enumerable: !1, configurable: !0 }), Object.defineProperty(s.prototype, "size", { get: function() {
            var f = 0, h = 0;
            if (this.resizable && this.window) {
              var _ = this.resizable.offsetWidth, O = this.resizable.offsetHeight, z = this.resizable.style.position;
              z !== "relative" && (this.resizable.style.position = "relative"), f = this.resizable.style.width !== "auto" ? this.resizable.offsetWidth : _, h = this.resizable.style.height !== "auto" ? this.resizable.offsetHeight : O, this.resizable.style.position = z;
            }
            return { width: f, height: h };
          }, enumerable: !1, configurable: !0 }), Object.defineProperty(s.prototype, "sizeStyle", { get: function() {
            var f = this, h = this.props.size, _ = function(O) {
              if (f.state[O] === void 0 || f.state[O] === "auto") return "auto";
              if (f.propsSize && f.propsSize[O] && ct(f.propsSize[O].toString(), "%")) {
                if (ct(f.state[O].toString(), "%")) return f.state[O].toString();
                var z = f.getParentSize();
                return Number(f.state[O].toString().replace("px", "")) / z[O] * 100 + "%";
              }
              return yn(f.state[O]);
            };
            return { width: h && h.width !== void 0 && !this.state.isResizing ? yn(h.width) : _("width"), height: h && h.height !== void 0 && !this.state.isResizing ? yn(h.height) : _("height") };
          }, enumerable: !1, configurable: !0 }), s.prototype.getParentSize = function() {
            if (!this.parentNode) return this.window ? { width: this.window.innerWidth, height: this.window.innerHeight } : { width: 0, height: 0 };
            var f = this.appendBase();
            if (!f) return { width: 0, height: 0 };
            var h = !1, _ = this.parentNode.style.flexWrap;
            _ !== "wrap" && (h = !0, this.parentNode.style.flexWrap = "wrap"), f.style.position = "relative", f.style.minWidth = "100%";
            var O = { width: f.offsetWidth, height: f.offsetHeight };
            return h && (this.parentNode.style.flexWrap = _), this.removeBase(f), O;
          }, s.prototype.bindEvents = function() {
            this.window && (this.window.addEventListener("mouseup", this.onMouseUp), this.window.addEventListener("mousemove", this.onMouseMove), this.window.addEventListener("mouseleave", this.onMouseUp), this.window.addEventListener("touchmove", this.onMouseMove, { capture: !0, passive: !1 }), this.window.addEventListener("touchend", this.onMouseUp));
          }, s.prototype.unbindEvents = function() {
            this.window && (this.window.removeEventListener("mouseup", this.onMouseUp), this.window.removeEventListener("mousemove", this.onMouseMove), this.window.removeEventListener("mouseleave", this.onMouseUp), this.window.removeEventListener("touchmove", this.onMouseMove, !0), this.window.removeEventListener("touchend", this.onMouseUp));
          }, s.prototype.componentDidMount = function() {
            if (this.resizable && this.window) {
              var f = this.window.getComputedStyle(this.resizable);
              this.setState({ width: this.state.width || this.size.width, height: this.state.height || this.size.height, flexBasis: f.flexBasis !== "auto" ? f.flexBasis : void 0 });
            }
          }, s.prototype.componentWillUnmount = function() {
            this.window && this.unbindEvents();
          }, s.prototype.createSizeForCssProperty = function(f, h) {
            var _ = this.propsSize && this.propsSize[h];
            return this.state[h] !== "auto" || this.state.original[h] !== f || _ !== void 0 && _ !== "auto" ? f : "auto";
          }, s.prototype.calculateNewMaxFromBoundary = function(f, h) {
            var _, O, z = this.props.boundsByDirection, ne = this.state.direction, de = z && ht("left", ne), pe = z && ht("top", ne);
            if (this.props.bounds === "parent") {
              var Ee = this.parentNode;
              Ee && (_ = de ? this.resizableRight - this.parentLeft : Ee.offsetWidth + (this.parentLeft - this.resizableLeft), O = pe ? this.resizableBottom - this.parentTop : Ee.offsetHeight + (this.parentTop - this.resizableTop));
            } else this.props.bounds === "window" ? this.window && (_ = de ? this.resizableRight : this.window.innerWidth - this.resizableLeft, O = pe ? this.resizableBottom : this.window.innerHeight - this.resizableTop) : this.props.bounds && (_ = de ? this.resizableRight - this.targetLeft : this.props.bounds.offsetWidth + (this.targetLeft - this.resizableLeft), O = pe ? this.resizableBottom - this.targetTop : this.props.bounds.offsetHeight + (this.targetTop - this.resizableTop));
            return _ && Number.isFinite(_) && (f = f && f < _ ? f : _), O && Number.isFinite(O) && (h = h && h < O ? h : O), { maxWidth: f, maxHeight: h };
          }, s.prototype.calculateNewSizeFromDirection = function(f, h) {
            var _ = this.props.scale || 1, O = this.props.resizeRatio || 1, z = this.state, ne = z.direction, de = z.original, pe = this.props, Ee = pe.lockAspectRatio, Pe = pe.lockAspectRatioExtraHeight, Ve = pe.lockAspectRatioExtraWidth, Ae = de.width, Ke = de.height, Ie = Pe || 0, Fe = Ve || 0;
            return ht("right", ne) && (Ae = de.width + (f - de.x) * O / _, Ee && (Ke = (Ae - Fe) / this.ratio + Ie)), ht("left", ne) && (Ae = de.width - (f - de.x) * O / _, Ee && (Ke = (Ae - Fe) / this.ratio + Ie)), ht("bottom", ne) && (Ke = de.height + (h - de.y) * O / _, Ee && (Ae = (Ke - Ie) * this.ratio + Fe)), ht("top", ne) && (Ke = de.height - (h - de.y) * O / _, Ee && (Ae = (Ke - Ie) * this.ratio + Fe)), { newWidth: Ae, newHeight: Ke };
          }, s.prototype.calculateNewSizeFromAspectRatio = function(f, h, _, O) {
            var z = this.props, ne = z.lockAspectRatio, de = z.lockAspectRatioExtraHeight, pe = z.lockAspectRatioExtraWidth, Ee = O.width === void 0 ? 10 : O.width, Pe = _.width === void 0 || _.width < 0 ? f : _.width, Ve = O.height === void 0 ? 10 : O.height, Ae = _.height === void 0 || _.height < 0 ? h : _.height, Ke = de || 0, Ie = pe || 0;
            if (ne) {
              var Fe = (Ve - Ke) * this.ratio + Ie, et = (Ae - Ke) * this.ratio + Ie, Ye = (Ee - Ie) / this.ratio + Ke, Le = (Pe - Ie) / this.ratio + Ke, ft = Math.max(Ee, Fe), Dt = Math.min(Pe, et), It = Math.max(Ve, Ye), jt = Math.min(Ae, Le);
              f = Nt(f, ft, Dt), h = Nt(h, It, jt);
            } else f = Nt(f, Ee, Pe), h = Nt(h, Ve, Ae);
            return { newWidth: f, newHeight: h };
          }, s.prototype.setBoundingClientRect = function() {
            if (this.props.bounds === "parent") {
              var f = this.parentNode;
              if (f) {
                var h = f.getBoundingClientRect();
                this.parentLeft = h.left, this.parentTop = h.top;
              }
            }
            if (this.props.bounds && typeof this.props.bounds != "string") {
              var _ = this.props.bounds.getBoundingClientRect();
              this.targetLeft = _.left, this.targetTop = _.top;
            }
            if (this.resizable) {
              var O = this.resizable.getBoundingClientRect(), z = O.left, ne = O.top, de = O.right, pe = O.bottom;
              this.resizableLeft = z, this.resizableRight = de, this.resizableTop = ne, this.resizableBottom = pe;
            }
          }, s.prototype.onResizeStart = function(f, h) {
            if (this.resizable && this.window) {
              var _, O = 0, z = 0;
              if (f.nativeEvent && function(Pe) {
                return !!((Pe.clientX || Pe.clientX === 0) && (Pe.clientY || Pe.clientY === 0));
              }(f.nativeEvent)) {
                if (O = f.nativeEvent.clientX, z = f.nativeEvent.clientY, f.nativeEvent.which === 3) return;
              } else f.nativeEvent && Vt(f.nativeEvent) && (O = f.nativeEvent.touches[0].clientX, z = f.nativeEvent.touches[0].clientY);
              if (this.props.onResizeStart && this.resizable && this.props.onResizeStart(f, h, this.resizable) === !1) return;
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
              var Ee = { original: { x: O, y: z, width: this.size.width, height: this.size.height }, isResizing: !0, backgroundStyle: nt(nt({}, this.state.backgroundStyle), { cursor: this.window.getComputedStyle(f.target).cursor || "auto" }), direction: h, flexBasis: _ };
              this.setState(Ee);
            }
          }, s.prototype.onMouseMove = function(f) {
            if (this.state.isResizing && this.resizable && this.window) {
              if (this.window.TouchEvent && Vt(f)) try {
                f.preventDefault(), f.stopPropagation();
              } catch {
              }
              var h = this.props, _ = h.maxWidth, O = h.maxHeight, z = h.minWidth, ne = h.minHeight, de = Vt(f) ? f.touches[0].clientX : f.clientX, pe = Vt(f) ? f.touches[0].clientY : f.clientY, Ee = this.state, Pe = Ee.direction, Ve = Ee.original, Ae = Ee.width, Ke = Ee.height, Ie = this.getParentSize(), Fe = Pn(Ie, this.window.innerWidth, this.window.innerHeight, _, O, z, ne);
              _ = Fe.maxWidth, O = Fe.maxHeight, z = Fe.minWidth, ne = Fe.minHeight;
              var et = this.calculateNewSizeFromDirection(de, pe), Ye = et.newHeight, Le = et.newWidth, ft = this.calculateNewMaxFromBoundary(_, O), Dt = this.calculateNewSizeFromAspectRatio(Le, Ye, { width: ft.maxWidth, height: ft.maxHeight }, { width: z, height: ne });
              if (Le = Dt.newWidth, Ye = Dt.newHeight, this.props.grid) {
                var It = tn(Le, this.props.grid[0]), jt = tn(Ye, this.props.grid[1]), _t = this.props.snapGap || 0;
                Le = _t === 0 || Math.abs(It - Le) <= _t ? It : Le, Ye = _t === 0 || Math.abs(jt - Ye) <= _t ? jt : Ye;
              }
              this.props.snap && this.props.snap.x && (Le = Nn(Le, this.props.snap.x, this.props.snapGap)), this.props.snap && this.props.snap.y && (Ye = Nn(Ye, this.props.snap.y, this.props.snapGap));
              var zt = { width: Le - Ve.width, height: Ye - Ve.height };
              Ae && typeof Ae == "string" && (ct(Ae, "%") ? Le = Le / Ie.width * 100 + "%" : ct(Ae, "vw") ? Le = Le / this.window.innerWidth * 100 + "vw" : ct(Ae, "vh") && (Le = Le / this.window.innerHeight * 100 + "vh")), Ke && typeof Ke == "string" && (ct(Ke, "%") ? Ye = Ye / Ie.height * 100 + "%" : ct(Ke, "vw") ? Ye = Ye / this.window.innerWidth * 100 + "vw" : ct(Ke, "vh") && (Ye = Ye / this.window.innerHeight * 100 + "vh"));
              var dt = { width: this.createSizeForCssProperty(Le, "width"), height: this.createSizeForCssProperty(Ye, "height") };
              this.flexDir === "row" ? dt.flexBasis = dt.width : this.flexDir === "column" && (dt.flexBasis = dt.height), this.setState(dt), this.props.onResize && this.props.onResize(f, Pe, this.resizable, zt);
            }
          }, s.prototype.onMouseUp = function(f) {
            var h = this.state, _ = h.isResizing, O = h.direction, z = h.original;
            if (_ && this.resizable) {
              var ne = { width: this.size.width - z.width, height: this.size.height - z.height };
              this.props.onResizeStop && this.props.onResizeStop(f, O, this.resizable, ne), this.props.size && this.setState(this.props.size), this.unbindEvents(), this.setState({ isResizing: !1, backgroundStyle: nt(nt({}, this.state.backgroundStyle), { cursor: "auto" }) });
            }
          }, s.prototype.updateSize = function(f) {
            this.setState({ width: f.width, height: f.height });
          }, s.prototype.renderResizer = function() {
            var f = this, h = this.props, _ = h.enable, O = h.handleStyles, z = h.handleClasses, ne = h.handleWrapperStyle, de = h.handleWrapperClass, pe = h.handleComponent;
            if (!_) return null;
            var Ee = Object.keys(_).map(function(Pe) {
              return _[Pe] !== !1 ? c.createElement(qe, { key: Pe, direction: Pe, onResizeStart: f.onResizeStart, replaceStyles: O && O[Pe], className: z && z[Pe] }, pe && pe[Pe] ? pe[Pe] : null) : null;
            });
            return c.createElement("div", { className: de, style: ne }, Ee);
          }, s.prototype.render = function() {
            var f = this, h = Object.keys(this.props).reduce(function(z, ne) {
              return Eo.indexOf(ne) !== -1 || (z[ne] = f.props[ne]), z;
            }, {}), _ = nt(nt(nt({ position: "relative", userSelect: this.state.isResizing ? "none" : "auto" }, this.props.style), this.sizeStyle), { maxWidth: this.props.maxWidth, maxHeight: this.props.maxHeight, minWidth: this.props.minWidth, minHeight: this.props.minHeight, boxSizing: "border-box", flexShrink: 0 });
            this.state.flexBasis && (_.flexBasis = this.state.flexBasis);
            var O = this.props.as || "div";
            return c.createElement(O, nt({ ref: this.ref, style: _, className: this.props.className }, h), this.state.isResizing && c.createElement("div", { style: this.state.backgroundStyle }), this.props.children, this.renderResizer());
          }, s.defaultProps = { as: "div", onResizeStart: function() {
          }, onResize: function() {
          }, onResizeStop: function() {
          }, enable: { top: !0, right: !0, bottom: !0, left: !0, topRight: !0, bottomRight: !0, bottomLeft: !0, topLeft: !0 }, style: {}, grid: [1, 1], lockAspectRatio: !1, lockAspectRatioExtraWidth: 0, lockAspectRatioExtraHeight: 0, scale: 1, resizeRatio: 1, snapGap: 0 }, s;
        }(c.PureComponent), rt = function(E, s) {
          return (rt = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(f, h) {
            f.__proto__ = h;
          } || function(f, h) {
            for (var _ in h) h.hasOwnProperty(_) && (f[_] = h[_]);
          })(E, s);
        }, Ue = function() {
          return (Ue = Object.assign || function(E) {
            for (var s, f = 1, h = arguments.length; f < h; f++) for (var _ in s = arguments[f]) Object.prototype.hasOwnProperty.call(s, _) && (E[_] = s[_]);
            return E;
          }).apply(this, arguments);
        }, qn = ae.a, Kt = { width: "auto", height: "auto", display: "inline-block", position: "absolute", top: 0, left: 0 }, Or = function(E) {
          function s(f) {
            var h = E.call(this, f) || this;
            return h.resizing = !1, h.resizingPosition = { x: 0, y: 0 }, h.offsetFromParent = { left: 0, top: 0 }, h.resizableElement = { current: null }, h.refDraggable = function(_) {
              _ && (h.draggable = _);
            }, h.refResizable = function(_) {
              _ && (h.resizable = _, h.resizableElement.current = _.resizable);
            }, h.state = { original: { x: 0, y: 0 }, bounds: { top: 0, right: 0, bottom: 0, left: 0 }, maxWidth: f.maxWidth, maxHeight: f.maxHeight }, h.onResizeStart = h.onResizeStart.bind(h), h.onResize = h.onResize.bind(h), h.onResizeStop = h.onResizeStop.bind(h), h.onDragStart = h.onDragStart.bind(h), h.onDrag = h.onDrag.bind(h), h.onDragStop = h.onDragStop.bind(h), h.getMaxSizesFromProps = h.getMaxSizesFromProps.bind(h), h;
          }
          return function(f, h) {
            function _() {
              this.constructor = f;
            }
            rt(f, h), f.prototype = h === null ? Object.create(h) : (_.prototype = h.prototype, new _());
          }(s, E), s.prototype.componentDidMount = function() {
            this.updateOffsetFromParent();
            var f = this.offsetFromParent, h = f.left, _ = f.top, O = this.getDraggablePosition(), z = O.x, ne = O.y;
            this.draggable.setState({ x: z - h, y: ne - _ }), this.forceUpdate();
          }, s.prototype.getDraggablePosition = function() {
            var f = this.draggable.state;
            return { x: f.x, y: f.y };
          }, s.prototype.getParent = function() {
            return this.resizable && this.resizable.parentNode;
          }, s.prototype.getParentSize = function() {
            return this.resizable.getParentSize();
          }, s.prototype.getMaxSizesFromProps = function() {
            return { maxWidth: this.props.maxWidth === void 0 ? Number.MAX_SAFE_INTEGER : this.props.maxWidth, maxHeight: this.props.maxHeight === void 0 ? Number.MAX_SAFE_INTEGER : this.props.maxHeight };
          }, s.prototype.getSelfElement = function() {
            return this.resizable && this.resizable.resizable;
          }, s.prototype.getOffsetHeight = function(f) {
            var h = this.props.scale;
            switch (this.props.bounds) {
              case "window":
                return window.innerHeight / h;
              case "body":
                return document.body.offsetHeight / h;
              default:
                return f.offsetHeight;
            }
          }, s.prototype.getOffsetWidth = function(f) {
            var h = this.props.scale;
            switch (this.props.bounds) {
              case "window":
                return window.innerWidth / h;
              case "body":
                return document.body.offsetWidth / h;
              default:
                return f.offsetWidth;
            }
          }, s.prototype.onDragStart = function(f, h) {
            if (this.props.onDragStart && this.props.onDragStart(f, h), this.props.bounds) {
              var _, O = this.getParent(), z = this.props.scale;
              if (this.props.bounds === "parent") _ = O;
              else {
                if (this.props.bounds === "body") {
                  var ne = O.getBoundingClientRect(), de = ne.left, pe = ne.top, Ee = document.body.getBoundingClientRect(), Pe = -(de - O.offsetLeft * z - Ee.left) / z, Ve = -(pe - O.offsetTop * z - Ee.top) / z, Ae = (document.body.offsetWidth - this.resizable.size.width * z) / z + Pe, Ke = (document.body.offsetHeight - this.resizable.size.height * z) / z + Ve;
                  return this.setState({ bounds: { top: Ve, right: Ae, bottom: Ke, left: Pe } });
                }
                if (this.props.bounds === "window") {
                  if (!this.resizable) return;
                  var Ie = O.getBoundingClientRect(), Fe = Ie.left, et = Ie.top, Ye = -(Fe - O.offsetLeft * z) / z, Le = -(et - O.offsetTop * z) / z;
                  return Ae = (window.innerWidth - this.resizable.size.width * z) / z + Ye, Ke = (window.innerHeight - this.resizable.size.height * z) / z + Le, this.setState({ bounds: { top: Le, right: Ae, bottom: Ke, left: Ye } });
                }
                _ = document.querySelector(this.props.bounds);
              }
              if (_ instanceof HTMLElement && O instanceof HTMLElement) {
                var ft = _.getBoundingClientRect(), Dt = ft.left, It = ft.top, jt = O.getBoundingClientRect(), _t = (Dt - jt.left) / z, zt = It - jt.top;
                if (this.resizable) {
                  this.updateOffsetFromParent();
                  var dt = this.offsetFromParent;
                  this.setState({ bounds: { top: zt - dt.top, right: _t + (_.offsetWidth - this.resizable.size.width) - dt.left / z, bottom: zt + (_.offsetHeight - this.resizable.size.height) - dt.top, left: _t - dt.left / z } });
                }
              }
            }
          }, s.prototype.onDrag = function(f, h) {
            if (this.props.onDrag) {
              var _ = this.offsetFromParent;
              return this.props.onDrag(f, Ue(Ue({}, h), { x: h.x - _.left, y: h.y - _.top }));
            }
          }, s.prototype.onDragStop = function(f, h) {
            if (this.props.onDragStop) {
              var _ = this.offsetFromParent, O = _.left, z = _.top;
              return this.props.onDragStop(f, Ue(Ue({}, h), { x: h.x + O, y: h.y + z }));
            }
          }, s.prototype.onResizeStart = function(f, h, _) {
            f.stopPropagation(), this.resizing = !0;
            var O = this.props.scale, z = this.offsetFromParent, ne = this.getDraggablePosition();
            if (this.resizingPosition = { x: ne.x + z.left, y: ne.y + z.top }, this.setState({ original: ne }), this.props.bounds) {
              var de = this.getParent(), pe = void 0;
              pe = this.props.bounds === "parent" ? de : this.props.bounds === "body" ? document.body : this.props.bounds === "window" ? window : document.querySelector(this.props.bounds);
              var Ee = this.getSelfElement();
              if (Ee instanceof Element && (pe instanceof HTMLElement || pe === window) && de instanceof HTMLElement) {
                var Pe = this.getMaxSizesFromProps(), Ve = Pe.maxWidth, Ae = Pe.maxHeight, Ke = this.getParentSize();
                if (Ve && typeof Ve == "string") if (Ve.endsWith("%")) {
                  var Ie = Number(Ve.replace("%", "")) / 100;
                  Ve = Ke.width * Ie;
                } else Ve.endsWith("px") && (Ve = Number(Ve.replace("px", "")));
                Ae && typeof Ae == "string" && (Ae.endsWith("%") ? (Ie = Number(Ae.replace("%", "")) / 100, Ae = Ke.width * Ie) : Ae.endsWith("px") && (Ae = Number(Ae.replace("px", ""))));
                var Fe = Ee.getBoundingClientRect(), et = Fe.left, Ye = Fe.top, Le = this.props.bounds === "window" ? { left: 0, top: 0 } : pe.getBoundingClientRect(), ft = Le.left, Dt = Le.top, It = this.getOffsetWidth(pe), jt = this.getOffsetHeight(pe), _t = h.toLowerCase().endsWith("left"), zt = h.toLowerCase().endsWith("right"), dt = h.startsWith("top"), An = h.startsWith("bottom");
                if (_t && this.resizable) {
                  var lt = (et - ft) / O + this.resizable.size.width;
                  this.setState({ maxWidth: lt > Number(Ve) ? Ve : lt });
                }
                (zt || this.props.lockAspectRatio && !_t) && (lt = It + (ft - et) / O, this.setState({ maxWidth: lt > Number(Ve) ? Ve : lt })), dt && this.resizable && (lt = (Ye - Dt) / O + this.resizable.size.height, this.setState({ maxHeight: lt > Number(Ae) ? Ae : lt })), (An || this.props.lockAspectRatio && !dt) && (lt = jt + (Dt - Ye) / O, this.setState({ maxHeight: lt > Number(Ae) ? Ae : lt }));
              }
            } else this.setState({ maxWidth: this.props.maxWidth, maxHeight: this.props.maxHeight });
            this.props.onResizeStart && this.props.onResizeStart(f, h, _);
          }, s.prototype.onResize = function(f, h, _, O) {
            var z = { x: this.state.original.x, y: this.state.original.y }, ne = -O.width, de = -O.height;
            ["top", "left", "topLeft", "bottomLeft", "topRight"].indexOf(h) !== -1 && (h === "bottomLeft" ? z.x += ne : (h === "topRight" || (z.x += ne), z.y += de)), z.x === this.draggable.state.x && z.y === this.draggable.state.y || this.draggable.setState(z), this.updateOffsetFromParent();
            var pe = this.offsetFromParent, Ee = this.getDraggablePosition().x + pe.left, Pe = this.getDraggablePosition().y + pe.top;
            this.resizingPosition = { x: Ee, y: Pe }, this.props.onResize && this.props.onResize(f, h, _, O, { x: Ee, y: Pe });
          }, s.prototype.onResizeStop = function(f, h, _, O) {
            this.resizing = !1;
            var z = this.getMaxSizesFromProps(), ne = z.maxWidth, de = z.maxHeight;
            this.setState({ maxWidth: ne, maxHeight: de }), this.props.onResizeStop && this.props.onResizeStop(f, h, _, O, this.resizingPosition);
          }, s.prototype.updateSize = function(f) {
            this.resizable && this.resizable.updateSize({ width: f.width, height: f.height });
          }, s.prototype.updatePosition = function(f) {
            this.draggable.setState(f);
          }, s.prototype.updateOffsetFromParent = function() {
            var f = this.props.scale, h = this.getParent(), _ = this.getSelfElement();
            if (!h || _ === null) return { top: 0, left: 0 };
            var O = h.getBoundingClientRect(), z = O.left, ne = O.top, de = _.getBoundingClientRect(), pe = this.getDraggablePosition();
            this.offsetFromParent = { left: de.left - z - pe.x * f, top: de.top - ne - pe.y * f };
          }, s.prototype.render = function() {
            var f = this.props, h = f.disableDragging, _ = f.style, O = f.dragHandleClassName, z = f.position, ne = f.onMouseDown, de = f.onMouseUp, pe = f.dragAxis, Ee = f.dragGrid, Pe = f.bounds, Ve = f.enableUserSelectHack, Ae = f.cancel, Ke = f.children, Ie = (f.onResizeStart, f.onResize, f.onResizeStop, f.onDragStart, f.onDrag, f.onDragStop, f.resizeHandleStyles), Fe = f.resizeHandleClasses, et = f.resizeHandleComponent, Ye = f.enableResizing, Le = f.resizeGrid, ft = f.resizeHandleWrapperClass, Dt = f.resizeHandleWrapperStyle, It = f.scale, jt = f.allowAnyClick, _t = function($t, fn) {
              var Xn = {};
              for (var Gt in $t) Object.prototype.hasOwnProperty.call($t, Gt) && fn.indexOf(Gt) < 0 && (Xn[Gt] = $t[Gt]);
              if ($t != null && typeof Object.getOwnPropertySymbols == "function") {
                var dn = 0;
                for (Gt = Object.getOwnPropertySymbols($t); dn < Gt.length; dn++) fn.indexOf(Gt[dn]) < 0 && Object.prototype.propertyIsEnumerable.call($t, Gt[dn]) && (Xn[Gt[dn]] = $t[Gt[dn]]);
              }
              return Xn;
            }(f, ["disableDragging", "style", "dragHandleClassName", "position", "onMouseDown", "onMouseUp", "dragAxis", "dragGrid", "bounds", "enableUserSelectHack", "cancel", "children", "onResizeStart", "onResize", "onResizeStop", "onDragStart", "onDrag", "onDragStop", "resizeHandleStyles", "resizeHandleClasses", "resizeHandleComponent", "enableResizing", "resizeGrid", "resizeHandleWrapperClass", "resizeHandleWrapperStyle", "scale", "allowAnyClick"]), zt = this.props.default ? Ue({}, this.props.default) : void 0;
            delete _t.default;
            var dt, An = h || O ? { cursor: "auto" } : { cursor: "move" }, lt = Ue(Ue(Ue({}, Kt), An), _), Mn = this.offsetFromParent, Hn = Mn.left, zr = Mn.top;
            z && (dt = { x: z.x - Hn, y: z.y - zr });
            var xt, io = this.resizing ? void 0 : dt, In = this.resizing ? "both" : pe;
            return Object(c.createElement)(qn, { ref: this.refDraggable, handle: O ? "." + O : void 0, defaultPosition: zt, onMouseDown: ne, onMouseUp: de, onStart: this.onDragStart, onDrag: this.onDrag, onStop: this.onDragStop, axis: In, disabled: h, grid: Ee, bounds: Pe ? this.state.bounds : void 0, position: io, enableUserSelectHack: Ve, cancel: Ae, scale: It, allowAnyClick: jt, nodeRef: this.resizableElement }, Object(c.createElement)(_o, Ue({}, _t, { ref: this.refResizable, defaultSize: zt, size: this.props.size, enable: typeof Ye == "boolean" ? (xt = Ye, { bottom: xt, bottomLeft: xt, bottomRight: xt, left: xt, right: xt, top: xt, topLeft: xt, topRight: xt }) : Ye, onResizeStart: this.onResizeStart, onResize: this.onResize, onResizeStop: this.onResizeStop, style: lt, minWidth: this.props.minWidth, minHeight: this.props.minHeight, maxWidth: this.resizing ? this.state.maxWidth : this.props.maxWidth, maxHeight: this.resizing ? this.state.maxHeight : this.props.maxHeight, grid: Le, handleWrapperClass: ft, handleWrapperStyle: Dt, lockAspectRatio: this.props.lockAspectRatio, lockAspectRatioExtraWidth: this.props.lockAspectRatioExtraWidth, lockAspectRatioExtraHeight: this.props.lockAspectRatioExtraHeight, handleStyles: Ie, handleClasses: Fe, handleComponent: et, scale: this.props.scale }), Ke));
          }, s.defaultProps = { maxWidth: Number.MAX_SAFE_INTEGER, maxHeight: Number.MAX_SAFE_INTEGER, scale: 1, onResizeStart: function() {
          }, onResize: function() {
          }, onResizeStop: function() {
          }, onDragStart: function() {
          }, onDrag: function() {
          }, onDragStop: function() {
          } }, s;
        }(c.PureComponent);
        u(58);
        class Mt extends c.Component {
          constructor(s) {
            super(s), this.handleTabClick = this.handleTabClick.bind(this);
          }
          handleTabClick(s) {
            this.setState({ activeTab: s }, () => {
              this.props.onClick(s);
            });
          }
          render() {
            return o.a.createElement("div", { className: "ck-inspector-horizontal-nav" }, this.props.definitions.map((s) => o.a.createElement(nn, { key: s, label: s, isActive: this.props.activeTab === s, onClick: () => this.handleTabClick(s) })));
          }
        }
        class nn extends c.Component {
          render() {
            return o.a.createElement("button", { className: ["ck-inspector-horizontal-nav__item", this.props.isActive ? " ck-inspector-horizontal-nav__item_active" : ""].join(" "), key: this.props.label, onClick: this.props.onClick, type: "button" }, this.props.label);
          }
        }
        u(60);
        class Wt extends c.Component {
          render() {
            const s = Array.isArray(this.props.children) ? this.props.children : [this.props.children];
            return o.a.createElement("div", { className: "ck-inspector-navbox" }, s.length > 1 ? o.a.createElement("div", { className: "ck-inspector-navbox__navigation" }, s[0]) : "", o.a.createElement("div", { className: "ck-inspector-navbox__content" }, s[s.length - 1]));
          }
        }
        class Qt extends c.Component {
          constructor(s) {
            super(s), this.handleTabClick = this.handleTabClick.bind(this);
          }
          handleTabClick(s) {
            this.props.onTabChange(s);
          }
          render() {
            const s = Array.isArray(this.props.children) ? this.props.children : [this.props.children];
            return o.a.createElement(Wt, null, [this.props.contentBefore, o.a.createElement(Mt, { key: "navigation", definitions: s.map((f) => f.props.label), activeTab: this.props.activeTab, onClick: this.handleTabClick }), this.props.contentAfter], s.filter((f) => f.props.label === this.props.activeTab));
          }
        }
        var cr = u(5), Dn = u.n(cr);
        class rn extends c.Component {
          render() {
            return [o.a.createElement("label", { htmlFor: this.props.id, key: "label" }, this.props.label, ":"), o.a.createElement("select", { id: this.props.id, value: this.props.value, onChange: this.props.onChange, key: "select" }, this.props.options.map((s) => o.a.createElement("option", { value: s, key: s }, s)))];
          }
          shouldComponentUpdate(s) {
            return !Dn()(this.props, s);
          }
        }
        u(62);
        class yt extends c.PureComponent {
          render() {
            const s = ["ck-inspector-button", this.props.className || "", this.props.isOn ? "ck-inspector-button_on" : "", this.props.isEnabled === !1 ? "ck-inspector-button_disabled" : ""].filter((f) => f).join(" ");
            return o.a.createElement("button", { className: s, type: "button", onClick: this.props.isEnabled === !1 ? () => {
            } : this.props.onClick, title: this.props.title || this.props.text }, o.a.createElement("span", null, this.props.text), this.props.icon);
          }
        }
        u(64);
        class Et extends c.Component {
          render() {
            return o.a.createElement("div", { className: ["ck-inspector-pane", this.props.splitVertically ? "ck-inspector-pane_vsplit" : "", this.props.isEmpty ? "ck-inspector-pane_empty" : ""].join(" ") }, this.props.children);
          }
        }
        u(66);
        const ur = { position: "relative" };
        class fr extends c.Component {
          get maxSidePaneWidth() {
            return Math.min(window.innerWidth - 400, 0.8 * window.innerWidth);
          }
          render() {
            return o.a.createElement("div", { className: "ck-inspector-side-pane" }, o.a.createElement(Or, { enableResizing: { left: !0 }, disableDragging: !0, minWidth: 200, maxWidth: this.maxSidePaneWidth, style: ur, position: { x: "100%", y: "100%" }, size: { width: this.props.sidePaneWidth, height: "100%" }, onResizeStop: (s, f, h) => this.props.setSidePaneWidth(h.style.width) }, this.props.children));
          }
        }
        var vn = Re(({ ui: { sidePaneWidth: E } }) => ({ sidePaneWidth: E }), { setSidePaneWidth: function(E) {
          return { type: "SET_SIDE_PANE_WIDTH", newWidth: E };
        } })(fr), Ut = u(11);
        u(68);
        class Ht extends c.PureComponent {
          render() {
            return [o.a.createElement("input", { type: "checkbox", className: "ck-inspector-checkbox", id: this.props.id, key: "input", checked: this.props.isChecked, onChange: this.props.onChange }), o.a.createElement("label", { htmlFor: this.props.id, key: "label" }, this.props.label)];
          }
        }
        class on extends c.Component {
          constructor(s) {
            super(s), this.handleTreeClick = this.handleTreeClick.bind(this), this.handleRootChange = this.handleRootChange.bind(this);
          }
          handleTreeClick(s, f) {
            s.persist(), s.stopPropagation(), this.props.setModelCurrentNode(f), s.detail === 2 && this.props.setModelActiveTab("Inspect");
          }
          handleRootChange(s) {
            this.props.setModelCurrentRootName(s.target.value);
          }
          render() {
            const s = this.props.editors.get(this.props.currentEditorName);
            return o.a.createElement(Wt, null, [o.a.createElement("div", { className: "ck-inspector-tree__config", key: "root-cfg" }, o.a.createElement(rn, { id: "view-root-select", label: "Root", value: this.props.currentRootName, options: Object(gt.d)(s).map((f) => f.rootName), onChange: this.handleRootChange })), o.a.createElement("span", { className: "ck-inspector-separator", key: "separator" }), o.a.createElement("div", { className: "ck-inspector-tree__config", key: "text-cfg" }, o.a.createElement(Ht, { label: "Compact text", id: "model-compact-text", isChecked: this.props.showCompactText, onChange: this.props.toggleModelShowCompactText }), o.a.createElement(Ht, { label: "Show markers", id: "model-show-markers", isChecked: this.props.showMarkers, onChange: this.props.toggleModelShowMarkers }))], o.a.createElement(Ut.a, { className: [this.props.showMarkers ? "" : "ck-inspector-model-tree__hide-markers"], definition: this.props.treeDefinition, textDirection: s.locale.contentLanguageDirection, onClick: this.handleTreeClick, showCompactText: this.props.showCompactText, activeNode: this.props.currentNode }));
          }
        }
        var Kn = Re(({ editors: E, currentEditorName: s, model: { treeDefinition: f, currentRootName: h, currentNode: _, ui: { showMarkers: O, showCompactText: z } } }) => ({ treeDefinition: f, editors: E, currentEditorName: s, currentRootName: h, currentNode: _, showMarkers: O, showCompactText: z }), { toggleModelShowCompactText: function() {
          return { type: "TOGGLE_MODEL_SHOW_COMPACT_TEXT" };
        }, setModelCurrentRootName: function(E) {
          return { type: "SET_MODEL_CURRENT_ROOT_NAME", currentRootName: E };
        }, toggleModelShowMarkers: function() {
          return { type: "TOGGLE_MODEL_SHOW_MARKERS" };
        }, setModelCurrentNode: function(E) {
          return { type: "SET_MODEL_CURRENT_NODE", currentNode: E };
        }, setModelActiveTab: He })(on);
        u(70);
        class dr extends c.Component {
          render() {
            const s = this.props.presentation && this.props.presentation.expandCollapsibles, f = [];
            for (const h in this.props.itemDefinitions) {
              const _ = this.props.itemDefinitions[h], { subProperties: O, presentation: z = {} } = _, ne = O && Object.keys(O).length, de = Object(ut.c)(String(_.value), 2e3), pe = [o.a.createElement(Zr, { key: `${this.props.name}-${h}-name`, name: h, listUid: this.props.name, canCollapse: ne, colorBox: z.colorBox, expandCollapsibles: s, onClick: this.props.onPropertyTitleClick, title: _.title }), o.a.createElement("dd", { key: `${this.props.name}-${h}-value` }, o.a.createElement("input", { id: `${this.props.name}-${h}-value-input`, type: "text", value: de, readOnly: !0 }))];
              ne && pe.push(o.a.createElement(dr, { name: `${this.props.name}-${h}`, key: `${this.props.name}-${h}`, itemDefinitions: O, presentation: this.props.presentation })), f.push(pe);
            }
            return o.a.createElement("dl", { className: "ck-inspector-property-list ck-inspector-code" }, f);
          }
          shouldComponentUpdate(s) {
            return !Dn()(this.props, s);
          }
        }
        class Zr extends c.PureComponent {
          constructor(s) {
            super(s), this.state = { isCollapsed: !this.props.expandCollapsibles }, this.handleCollapsedChange = this.handleCollapsedChange.bind(this);
          }
          handleCollapsedChange() {
            this.setState({ isCollapsed: !this.state.isCollapsed });
          }
          render() {
            const s = ["ck-inspector-property-list__title"];
            let f, h;
            return this.props.canCollapse && (s.push("ck-inspector-property-list__title_collapsible"), s.push("ck-inspector-property-list__title_" + (this.state.isCollapsed ? "collapsed" : "expanded")), f = o.a.createElement("button", { type: "button", onClick: this.handleCollapsedChange }, "Toggle")), this.props.colorBox && (h = o.a.createElement("span", { className: "ck-inspector-property-list__title__color-box", style: { background: this.props.colorBox } })), this.props.onClick && s.push("ck-inspector-property-list__title_clickable"), o.a.createElement("dt", { className: s.join(" ").trim() }, f, h, o.a.createElement("label", { htmlFor: `${this.props.listUid}-${this.props.name}-value-input`, onClick: this.props.onClick ? () => this.props.onClick(this.props.name) : null, title: this.props.title }, this.props.name), ":");
          }
        }
        u(72);
        function Nr() {
          return (Nr = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var f = arguments[s];
              for (var h in f) Object.prototype.hasOwnProperty.call(f, h) && (E[h] = f[h]);
            }
            return E;
          }).apply(this, arguments);
        }
        class Vn extends c.PureComponent {
          render() {
            const s = [];
            for (const f of this.props.lists) Object.keys(f.itemDefinitions).length && s.push(o.a.createElement("hr", { key: f.name + "-separator" }), o.a.createElement("h3", { key: f.name + "-header" }, o.a.createElement("a", { href: f.url, target: "_blank", rel: "noopener noreferrer" }, f.name), f.buttons && f.buttons.map((h, _) => o.a.createElement(yt, Nr({ key: "button" + _ }, h)))), o.a.createElement(dr, { key: f.name + "-list", name: f.name, itemDefinitions: f.itemDefinitions, presentation: f.presentation, onPropertyTitleClick: f.onPropertyTitleClick }));
            return o.a.createElement("div", { className: "ck-inspector__object-inspector" }, o.a.createElement("h2", { className: "ck-inspector-code" }, this.props.header), s);
          }
        }
        var Pt = u(3);
        function xo() {
          return (xo = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var f = arguments[s];
              for (var h in f) Object.prototype.hasOwnProperty.call(f, h) && (E[h] = f[h]);
            }
            return E;
          }).apply(this, arguments);
        }
        var wn = ({ styles: E = {}, ...s }) => o.a.createElement("svg", xo({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, s), o.a.createElement("path", { d: "M17 15.75a.75.75 0 01.102 1.493L17 17.25H9a.75.75 0 01-.102-1.493L9 15.75h8zM2.156 2.947l.095.058 7.58 5.401a.75.75 0 01.084 1.152l-.083.069-7.58 5.425a.75.75 0 01-.958-1.148l.086-.071 6.724-4.815-6.723-4.792a.75.75 0 01-.233-.95l.057-.096a.75.75 0 01.951-.233z" }));
        function Pr() {
          return (Pr = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var f = arguments[s];
              for (var h in f) Object.prototype.hasOwnProperty.call(f, h) && (E[h] = f[h]);
            }
            return E;
          }).apply(this, arguments);
        }
        var Ca = ({ styles: E = {}, ...s }) => o.a.createElement("svg", Pr({ fill: "none", xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 19 19" }, s), o.a.createElement("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M6 1a1 1 0 011-1h5a1 1 0 011 1v5a1 1 0 01-1 1h-2v2h5a1 1 0 011 1v3h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3a1 1 0 011-1h1v-2.5a.5.5 0 00-.5-.5H10v3h1a1 1 0 011 1v3a1 1 0 01-1 1H8a1 1 0 01-1-1v-3a1 1 0 011-1h1v-3H4.5a.5.5 0 00-.5.5V13h1a1 1 0 011 1v3a1 1 0 01-1 1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1v-3a1 1 0 011-1h5V7H7a1 1 0 01-1-1V1zm1.5 4.5v-4h4v4h-4zm-5 11v-2h2v2h-2zm6-2v2h2v-2h-2zm6 2v-2h2v2h-2z", fill: "#000" }));
        class So extends c.Component {
          constructor(s) {
            super(s), this.handleNodeLogButtonClick = this.handleNodeLogButtonClick.bind(this), this.handleNodeSchemaButtonClick = this.handleNodeSchemaButtonClick.bind(this);
          }
          handleNodeLogButtonClick() {
            Pt.a.log(this.props.currentNodeDefinition.editorNode);
          }
          handleNodeSchemaButtonClick() {
            const s = this.props.editors.get(this.props.currentEditorName).model.schema.getDefinition(this.props.currentNodeDefinition.editorNode);
            this.props.setActiveTab("Schema"), this.props.setSchemaCurrentDefinitionName(s.name);
          }
          render() {
            const s = this.props.currentNodeDefinition;
            return s ? o.a.createElement(Vn, { header: [o.a.createElement("span", { key: "link" }, o.a.createElement("a", { href: s.url, target: "_blank", rel: "noopener noreferrer" }, o.a.createElement("b", null, s.type)), ":", s.type === "Text" ? o.a.createElement("em", null, s.name) : s.name), o.a.createElement(yt, { key: "log", icon: o.a.createElement(wn, null), text: "Log in console", onClick: this.handleNodeLogButtonClick }), o.a.createElement(yt, { key: "schema", icon: o.a.createElement(Ca, null), text: "Show in schema", onClick: this.handleNodeSchemaButtonClick })], lists: [{ name: "Attributes", url: s.url, itemDefinitions: s.attributes }, { name: "Properties", url: s.url, itemDefinitions: s.properties }] }) : o.a.createElement(Et, { isEmpty: "true" }, o.a.createElement("p", null, "Select a node in the tree to inspect"));
          }
        }
        var yi = Re(({ editors: E, currentEditorName: s, model: { currentNodeDefinition: f } }) => ({ editors: E, currentEditorName: s, currentNodeDefinition: f }), { setActiveTab: kt, setSchemaCurrentDefinitionName: ir })(So);
        function vi() {
          return (vi = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var f = arguments[s];
              for (var h in f) Object.prototype.hasOwnProperty.call(f, h) && (E[h] = f[h]);
            }
            return E;
          }).apply(this, arguments);
        }
        var Dr = ({ styles: E = {}, ...s }) => o.a.createElement("svg", vi({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, s), o.a.createElement("path", { d: "M9.5 4.5c1.85 0 3.667.561 5.199 1.519C16.363 7.059 17.5 8.4 17.5 9.5s-1.137 2.441-2.801 3.481c-1.532.958-3.35 1.519-5.199 1.519-1.85 0-3.667-.561-5.199-1.519C2.637 11.941 1.5 10.6 1.5 9.5s1.137-2.441 2.801-3.481C5.833 5.06 7.651 4.5 9.5 4.5zm0 1a4 4 0 11-.2.005l.2-.005c-1.655 0-3.29.505-4.669 1.367C3.431 7.742 2.5 8.84 2.5 9.5c0 .66.931 1.758 2.331 2.633C6.21 12.995 7.845 13.5 9.5 13.5c1.655 0 3.29-.505 4.669-1.367 1.4-.875 2.331-1.974 2.331-2.633 0-.66-.931-1.758-2.331-2.633C12.79 6.005 11.155 5.5 9.5 5.5zM8 6.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" }));
        const pr = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_selection-Selection.html";
        class wi extends c.Component {
          constructor(s) {
            super(s), this.handleSelectionLogButtonClick = this.handleSelectionLogButtonClick.bind(this), this.handleScrollToSelectionButtonClick = this.handleScrollToSelectionButtonClick.bind(this);
          }
          handleSelectionLogButtonClick() {
            const s = this.props.editor;
            Pt.a.log(s.model.document.selection);
          }
          handleScrollToSelectionButtonClick() {
            const s = document.querySelector(".ck-inspector-tree__position.ck-inspector-tree__position_selection");
            s && s.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          render() {
            const s = this.props.editor, f = this.props.info;
            return o.a.createElement(Vn, { header: [o.a.createElement("span", { key: "link" }, o.a.createElement("a", { href: pr, target: "_blank", rel: "noopener noreferrer" }, o.a.createElement("b", null, "Selection"))), o.a.createElement(yt, { key: "log", icon: o.a.createElement(wn, null), text: "Log in console", onClick: this.handleSelectionLogButtonClick }), o.a.createElement(yt, { key: "scroll", icon: o.a.createElement(Dr, null), text: "Scroll to selection", onClick: this.handleScrollToSelectionButtonClick })], lists: [{ name: "Attributes", url: pr + "#function-getAttributes", itemDefinitions: f.attributes }, { name: "Properties", url: "" + pr, itemDefinitions: f.properties }, { name: "Anchor", url: pr + "#member-anchor", buttons: [{ icon: o.a.createElement(wn, null), text: "Log in console", onClick: () => Pt.a.log(s.model.document.selection.anchor) }], itemDefinitions: f.anchor }, { name: "Focus", url: pr + "#member-focus", buttons: [{ icon: o.a.createElement(wn, null), text: "Log in console", onClick: () => Pt.a.log(s.model.document.selection.focus) }], itemDefinitions: f.focus }, { name: "Ranges", url: pr + "#function-getRanges", buttons: [{ icon: o.a.createElement(wn, null), text: "Log in console", onClick: () => Pt.a.log(...s.model.document.selection.getRanges()) }], itemDefinitions: f.ranges, presentation: { expandCollapsibles: !0 } }] });
          }
        }
        var ki = Re(({ editors: E, currentEditorName: s, model: { ranges: f } }) => {
          const h = E.get(s);
          return { editor: h, currentEditorName: s, info: function(_, O) {
            const z = _.model.document.selection, ne = z.anchor, de = z.focus, pe = { properties: { isCollapsed: { value: z.isCollapsed }, isBackward: { value: z.isBackward }, isGravityOverridden: { value: z.isGravityOverridden }, rangeCount: { value: z.rangeCount } }, attributes: {}, anchor: Rr(Object(cn.a)(ne)), focus: Rr(Object(cn.a)(de)), ranges: {} };
            for (const [Ee, Pe] of z.getAttributes()) pe.attributes[Ee] = { value: Pe };
            O.forEach((Ee, Pe) => {
              pe.ranges[Pe] = { value: "", subProperties: { start: { value: "", subProperties: Object(ut.b)(Rr(Ee.start)) }, end: { value: "", subProperties: Object(ut.b)(Rr(Ee.end)) } } };
            });
            for (const Ee in pe) Ee !== "ranges" && (pe[Ee] = Object(ut.b)(pe[Ee]));
            return pe;
          }(h, f) };
        }, {})(wi);
        function Rr({ path: E, stickiness: s, index: f, isAtEnd: h, isAtStart: _, offset: O, textNode: z }) {
          return { path: { value: E }, stickiness: { value: s }, index: { value: f }, isAtEnd: { value: h }, isAtStart: { value: _ }, offset: { value: O }, textNode: { value: z } };
        }
        class Ta extends c.Component {
          render() {
            const s = function(_) {
              const O = {};
              for (const z of _) {
                const ne = z.name.split(":");
                let de = O;
                for (const pe of ne) {
                  const Ee = pe === ne[ne.length - 1];
                  de = de[pe] ? de[pe] : de[pe] = Ee ? z : {};
                }
              }
              return O;
            }(this.props.markers), f = function _(O) {
              const z = {};
              for (const ne in O) {
                const de = O[ne];
                if (de.name) {
                  const pe = Object(ut.b)(Ei(de));
                  z[ne] = { value: "", presentation: { colorBox: de.presentation.color }, subProperties: pe };
                } else {
                  const pe = Object.keys(de).length;
                  z[ne] = { value: pe + " marker" + (pe > 1 ? "s" : ""), subProperties: _(de) };
                }
              }
              return z;
            }(s), h = this.props.editors.get(this.props.currentEditorName);
            return Object.keys(s).length ? o.a.createElement(Vn, { header: [o.a.createElement("span", { key: "link" }, o.a.createElement("a", { href: "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_markercollection-Marker.html", target: "_blank", rel: "noopener noreferrer" }, o.a.createElement("b", null, "Markers"))), o.a.createElement(yt, { key: "log", icon: o.a.createElement(wn, null), text: "Log in console", onClick: () => Pt.a.log([...h.model.markers]) })], lists: [{ name: "Markers tree", itemDefinitions: f, presentation: { expandCollapsibles: !0 } }] }) : o.a.createElement(Et, { isEmpty: "true" }, o.a.createElement("p", null, "No markers in the document."));
          }
        }
        var Yo = Re(({ editors: E, currentEditorName: s, model: { markers: f } }) => ({ editors: E, currentEditorName: s, markers: f }), {})(Ta);
        function Ei({ name: E, start: s, end: f, affectsData: h, managedUsingOperations: _ }) {
          return { name: { value: E }, start: { value: s.path }, end: { value: f.path }, affectsData: { value: h }, managedUsingOperations: { value: _ } };
        }
        u(74);
        class qo extends c.Component {
          render() {
            return this.props.currentEditorName ? o.a.createElement(Et, { splitVertically: "true" }, o.a.createElement(Kn, null), o.a.createElement(vn, null, o.a.createElement(Qt, { onTabChange: this.props.setModelActiveTab, activeTab: this.props.activeTab }, o.a.createElement(yi, { label: "Inspect" }), o.a.createElement(ki, { label: "Selection" }), o.a.createElement(Yo, { label: "Markers" })))) : o.a.createElement(Et, { isEmpty: "true" }, o.a.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
          }
        }
        var Oa = Re(({ currentEditorName: E, model: { ui: { activeTab: s } } }) => ({ currentEditorName: E, activeTab: s }), { setModelActiveTab: He })(qo);
        class Na extends c.Component {
          constructor(s) {
            super(s), this.handleTreeClick = this.handleTreeClick.bind(this), this.handleRootChange = this.handleRootChange.bind(this);
          }
          handleTreeClick(s, f) {
            s.persist(), s.stopPropagation(), this.props.setViewCurrentNode(f), s.detail === 2 && this.props.setViewActiveTab("Inspect");
          }
          handleRootChange(s) {
            this.props.setViewCurrentRootName(s.target.value);
          }
          render() {
            const s = this.props.editors.get(this.props.currentEditorName);
            return o.a.createElement(Wt, null, [o.a.createElement("div", { className: "ck-inspector-tree__config", key: "root-cfg" }, o.a.createElement(rn, { id: "view-root-select", label: "Root", value: this.props.currentRootName, options: Object(en.d)(s).map((f) => f.rootName), onChange: this.handleRootChange })), o.a.createElement("span", { className: "ck-inspector-separator", key: "separator" }), o.a.createElement("div", { className: "ck-inspector-tree__config", key: "types-cfg" }, o.a.createElement(Ht, { label: "Show element types", id: "view-show-types", isChecked: this.props.showElementTypes, onChange: this.props.toggleViewShowElementTypes }))], o.a.createElement(Ut.a, { definition: this.props.treeDefinition, textDirection: s.locale.contentLanguageDirection, onClick: this.handleTreeClick, showCompactText: "true", showElementTypes: this.props.showElementTypes, activeNode: this.props.currentNode }));
          }
        }
        var Co = Re(({ editors: E, currentEditorName: s, view: { treeDefinition: f, currentRootName: h, currentNode: _, ui: { showElementTypes: O } } }) => ({ treeDefinition: f, editors: E, currentEditorName: s, currentRootName: h, currentNode: _, showElementTypes: O }), { setViewCurrentRootName: function(E) {
          return { type: "SET_VIEW_CURRENT_ROOT_NAME", currentRootName: E };
        }, toggleViewShowElementTypes: function() {
          return { type: "TOGGLE_VIEW_SHOW_ELEMENT_TYPES" };
        }, setViewCurrentNode: function(E) {
          return { type: "SET_VIEW_CURRENT_NODE", currentNode: E };
        }, setViewActiveTab: _r })(Na);
        class mt extends c.Component {
          constructor(s) {
            super(s), this.handleNodeLogButtonClick = this.handleNodeLogButtonClick.bind(this);
          }
          handleNodeLogButtonClick() {
            Pt.a.log(this.props.currentNodeDefinition.editorNode);
          }
          render() {
            const s = this.props.currentNodeDefinition;
            return s ? o.a.createElement(Vn, { header: [o.a.createElement("span", { key: "link" }, o.a.createElement("a", { href: s.url, target: "_blank", rel: "noopener noreferrer" }, o.a.createElement("b", null, s.type), ":"), s.type === "Text" ? o.a.createElement("em", null, s.name) : s.name), o.a.createElement(yt, { key: "log", icon: o.a.createElement(wn, null), text: "Log in console", onClick: this.handleNodeLogButtonClick })], lists: [{ name: "Attributes", url: s.url, itemDefinitions: s.attributes }, { name: "Properties", url: s.url, itemDefinitions: s.properties }, { name: "Custom Properties", url: en.a + "_element-Element.html#function-getCustomProperty", itemDefinitions: s.customProperties }] }) : o.a.createElement(Et, { isEmpty: "true" }, o.a.createElement("p", null, "Select a node in the tree to inspect"));
          }
        }
        var Jr = Re(({ view: { currentNodeDefinition: E } }) => ({ currentNodeDefinition: E }), {})(mt);
        const eo = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_view_selection-Selection.html";
        class Pa extends c.Component {
          constructor(s) {
            super(s), this.handleSelectionLogButtonClick = this.handleSelectionLogButtonClick.bind(this), this.handleScrollToSelectionButtonClick = this.handleScrollToSelectionButtonClick.bind(this);
          }
          handleSelectionLogButtonClick() {
            const s = this.props.editor;
            Pt.a.log(s.editing.view.document.selection);
          }
          handleScrollToSelectionButtonClick() {
            const s = document.querySelector(".ck-inspector-tree__position.ck-inspector-tree__position_selection");
            s && s.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          render() {
            const s = this.props.editor, f = this.props.info;
            return o.a.createElement(Vn, { header: [o.a.createElement("span", { key: "link" }, o.a.createElement("a", { href: eo, target: "_blank", rel: "noopener noreferrer" }, o.a.createElement("b", null, "Selection"))), o.a.createElement(yt, { key: "log", icon: o.a.createElement(wn, null), text: "Log in console", onClick: this.handleSelectionLogButtonClick }), o.a.createElement(yt, { key: "scroll", icon: o.a.createElement(Dr, null), text: "Scroll to selection", onClick: this.handleScrollToSelectionButtonClick })], lists: [{ name: "Properties", url: "" + eo, itemDefinitions: f.properties }, { name: "Anchor", url: eo + "#member-anchor", buttons: [{ type: "log", text: "Log in console", onClick: () => Pt.a.log(s.editing.view.document.selection.anchor) }], itemDefinitions: f.anchor }, { name: "Focus", url: eo + "#member-focus", buttons: [{ type: "log", text: "Log in console", onClick: () => Pt.a.log(s.editing.view.document.selection.focus) }], itemDefinitions: f.focus }, { name: "Ranges", url: eo + "#function-getRanges", buttons: [{ type: "log", text: "Log in console", onClick: () => Pt.a.log(...s.editing.view.document.selection.getRanges()) }], itemDefinitions: f.ranges, presentation: { expandCollapsibles: !0 } }] });
          }
        }
        var To = Re(({ editors: E, currentEditorName: s, view: { ranges: f } }) => {
          const h = E.get(s);
          return { editor: h, currentEditorName: s, info: function(_, O) {
            const z = _.editing.view.document.selection, ne = { properties: { isCollapsed: { value: z.isCollapsed }, isBackward: { value: z.isBackward }, isFake: { value: z.isFake }, rangeCount: { value: z.rangeCount } }, anchor: Ar(Object(Yt.a)(z.anchor)), focus: Ar(Object(Yt.a)(z.focus)), ranges: {} };
            O.forEach((de, pe) => {
              ne.ranges[pe] = { value: "", subProperties: { start: { value: "", subProperties: Object(ut.b)(Ar(de.start)) }, end: { value: "", subProperties: Object(ut.b)(Ar(de.end)) } } };
            });
            for (const de in ne) de !== "ranges" && (ne[de] = Object(ut.b)(ne[de]));
            return ne;
          }(h, f) };
        }, {})(Pa);
        function Ar({ offset: E, isAtEnd: s, isAtStart: f, parent: h }) {
          return { offset: { value: E }, isAtEnd: { value: s }, isAtStart: { value: f }, parent: { value: h } };
        }
        class to extends c.Component {
          render() {
            return this.props.currentEditorName ? o.a.createElement(Et, { splitVertically: "true" }, o.a.createElement(Co, null), o.a.createElement(vn, null, o.a.createElement(Qt, { onTabChange: this.props.setViewActiveTab, activeTab: this.props.activeTab }, o.a.createElement(Jr, { label: "Inspect" }), o.a.createElement(To, { label: "Selection" })))) : o.a.createElement(Et, { isEmpty: "true" }, o.a.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
          }
        }
        var Da = Re(({ currentEditorName: E, view: { ui: { activeTab: s } } }) => ({ currentEditorName: E, activeTab: s }), { setViewActiveTab: _r, updateViewState: ko })(to);
        class _i extends c.Component {
          constructor(s) {
            super(s), this.handleTreeClick = this.handleTreeClick.bind(this);
          }
          handleTreeClick(s, f) {
            s.persist(), s.stopPropagation(), this.props.setCommandsCurrentCommandName(f);
          }
          render() {
            return o.a.createElement(Wt, null, o.a.createElement(Ut.a, { definition: this.props.treeDefinition, onClick: this.handleTreeClick, activeNode: this.props.currentCommandName }));
          }
        }
        var xi = Re(({ commands: { treeDefinition: E, currentCommandName: s } }) => ({ treeDefinition: E, currentCommandName: s }), { setCommandsCurrentCommandName: function(E) {
          return { type: "SET_COMMANDS_CURRENT_COMMAND_NAME", currentCommandName: E };
        } })(_i);
        function Si() {
          return (Si = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var f = arguments[s];
              for (var h in f) Object.prototype.hasOwnProperty.call(f, h) && (E[h] = f[h]);
            }
            return E;
          }).apply(this, arguments);
        }
        var Ko = ({ styles: E = {}, ...s }) => o.a.createElement("svg", Si({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, s), o.a.createElement("path", { d: "M9.25 1.25a8 8 0 110 16 8 8 0 010-16zm0 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM7.344 6.485l4.98 2.765-4.98 3.018V6.485z" }));
        class Qo extends c.Component {
          constructor(s) {
            super(s), this.handleCommandLogButtonClick = this.handleCommandLogButtonClick.bind(this), this.handleCommandExecuteButtonClick = this.handleCommandExecuteButtonClick.bind(this);
          }
          handleCommandLogButtonClick() {
            Pt.a.log(this.props.currentCommandDefinition.command);
          }
          handleCommandExecuteButtonClick() {
            this.props.editors.get(this.props.currentEditorName).execute(this.props.currentCommandName);
          }
          render() {
            const s = this.props.currentCommandDefinition;
            return s ? o.a.createElement(Vn, { header: [o.a.createElement("span", { key: "link" }, o.a.createElement("a", { href: s.url, target: "_blank", rel: "noopener noreferrer" }, o.a.createElement("b", null, s.type)), ":", this.props.currentCommandName), o.a.createElement(yt, { key: "exec", icon: o.a.createElement(Ko, null), text: "Execute command", onClick: this.handleCommandExecuteButtonClick }), o.a.createElement(yt, { key: "log", icon: o.a.createElement(wn, null), text: "Log in console", onClick: this.handleCommandLogButtonClick })], lists: [{ name: "Properties", url: s.url, itemDefinitions: s.properties }] }) : o.a.createElement(Et, { isEmpty: "true" }, o.a.createElement("p", null, "Select a command to inspect"));
          }
        }
        var Ci = Re(({ editors: E, currentEditorName: s, commands: { currentCommandName: f, currentCommandDefinition: h } }) => ({ editors: E, currentEditorName: s, currentCommandName: f, currentCommandDefinition: h }), {})(Qo);
        class Wn extends c.Component {
          render() {
            return this.props.currentEditorName ? o.a.createElement(Et, { splitVertically: "true" }, o.a.createElement(xi, null), o.a.createElement(vn, null, o.a.createElement(Qt, { activeTab: "Inspect" }, o.a.createElement(Ci, { label: "Inspect" })))) : o.a.createElement(Et, { isEmpty: "true" }, o.a.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
          }
        }
        var Oo = Re(({ currentEditorName: E }) => ({ currentEditorName: E }), { updateCommandsState: Sr })(Wn);
        class Go extends c.Component {
          constructor(s) {
            super(s), this.handleTreeClick = this.handleTreeClick.bind(this);
          }
          handleTreeClick(s, f) {
            s.persist(), s.stopPropagation(), this.props.setSchemaCurrentDefinitionName(f);
          }
          render() {
            return o.a.createElement(Wt, null, o.a.createElement(Ut.a, { definition: this.props.treeDefinition, onClick: this.handleTreeClick, activeNode: this.props.currentSchemaDefinitionName }));
          }
        }
        var Ti = Re(({ schema: { treeDefinition: E, currentSchemaDefinitionName: s } }) => ({ treeDefinition: E, currentSchemaDefinitionName: s }), { setSchemaCurrentDefinitionName: ir })(Go);
        class Oi extends c.Component {
          render() {
            const s = this.props.currentSchemaDefinition;
            return s ? o.a.createElement(Vn, { header: [o.a.createElement("span", { key: "link" }, o.a.createElement("a", { href: s.urls.general, target: "_blank", rel: "noopener noreferrer" }, o.a.createElement("b", null, s.type)), ":", this.props.currentSchemaDefinitionName)], lists: [{ name: "Properties", url: s.urls.general, itemDefinitions: s.properties }, { name: "Allowed attributes", url: s.urls.allowAttributes, itemDefinitions: s.allowAttributes }, { name: "Allowed children", url: s.urls.allowChildren, itemDefinitions: s.allowChildren, onPropertyTitleClick: (f) => {
              this.props.setSchemaCurrentDefinitionName(f);
            } }, { name: "Allowed in", url: s.urls.allowIn, itemDefinitions: s.allowIn, onPropertyTitleClick: (f) => {
              this.props.setSchemaCurrentDefinitionName(f);
            } }] }) : o.a.createElement(Et, { isEmpty: "true" }, o.a.createElement("p", null, "Select a schema definition to inspect"));
          }
        }
        var Ni = Re(({ editors: E, currentEditorName: s, schema: { currentSchemaDefinitionName: f, currentSchemaDefinition: h } }) => ({ editors: E, currentEditorName: s, currentSchemaDefinitionName: f, currentSchemaDefinition: h }), { setSchemaCurrentDefinitionName: ir })(Oi);
        class Xo extends c.Component {
          render() {
            return this.props.currentEditorName ? o.a.createElement(Et, { splitVertically: "true" }, o.a.createElement(Ti, null), o.a.createElement(vn, null, o.a.createElement(Qt, { activeTab: "Inspect" }, o.a.createElement(Ni, { label: "Inspect" })))) : o.a.createElement(Et, { isEmpty: "true" }, o.a.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
          }
        }
        var Zo = Re(({ currentEditorName: E }) => ({ currentEditorName: E }))(Xo), Jo = u(47), Pi = u.n(Jo), ei = u(48), ti = u.n(ei);
        function Di() {
          return (Di = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var f = arguments[s];
              for (var h in f) Object.prototype.hasOwnProperty.call(f, h) && (E[h] = f[h]);
            }
            return E;
          }).apply(this, arguments);
        }
        var Mr = ({ styles: E = {}, ...s }) => o.a.createElement("svg", Di({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, s), o.a.createElement("path", { d: "M12.936 0l5 4.5v12.502l-1.504-.001v.003h1.504v1.499h-5v-1.501l3.496-.001V5.208L12.21 1.516 3.436 1.5v15.504l3.5-.001v1.5h-5V0h11z" }), o.a.createElement("path", { d: "M10.374 9.463l.085.072.477.464L11 10v.06l3.545 3.453-1.047 1.075L11 12.155V19H9v-6.9l-2.424 2.476-1.072-1.05L9.4 9.547a.75.75 0 01.974-.084zM12.799 1.5l-.001 2.774h3.645v1.5h-5.144V1.5z" }));
        u(86);
        class Ri extends c.Component {
          constructor(s) {
            super(s), this.state = { isModalOpen: !1, editorDataValue: "" }, this.textarea = o.a.createRef();
          }
          render() {
            return [o.a.createElement(yt, { text: "Set editor data", icon: o.a.createElement(Mr, null), isEnabled: !!this.props.editor, onClick: () => this.setState({ isModalOpen: !0 }), key: "button" }), o.a.createElement(ti.a, { isOpen: this.state.isModalOpen, appElement: document.querySelector(".ck-inspector-wrapper"), onAfterOpen: this._handleModalAfterOpen.bind(this), overlayClassName: "ck-inspector-modal ck-inspector-quick-actions__set-data-modal", className: "ck-inspector-quick-actions__set-data-modal__content", onRequestClose: this._closeModal.bind(this), portalClassName: "ck-inspector-portal", shouldCloseOnEsc: !0, shouldCloseOnOverlayClick: !0, key: "modal" }, o.a.createElement("h2", null, "Set editor data"), o.a.createElement("textarea", { autoFocus: !0, ref: this.textarea, value: this.state.editorDataValue, placeholder: "Paste HTML here...", onChange: this._handlDataChange.bind(this), onKeyPress: (s) => {
              s.key == "Enter" && s.shiftKey && this._setEditorDataAndCloseModal();
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
          _handlDataChange(s) {
            this.setState({ editorDataValue: s.target.value });
          }
          _handleModalAfterOpen() {
            this.setState({ editorDataValue: this.props.editor.getData() }), this.textarea.current.select();
          }
        }
        function No() {
          return (No = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var f = arguments[s];
              for (var h in f) Object.prototype.hasOwnProperty.call(f, h) && (E[h] = f[h]);
            }
            return E;
          }).apply(this, arguments);
        }
        var Qn = ({ styles: E = {}, ...s }) => o.a.createElement("svg", No({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, s), o.a.createElement("path", { d: "M12.936 0l5 4.5v14.003h-4.503L14.936 17h-10l1.503 1.503H1.936V0h11zm-9.5 1.5v15.504h12.996V5.208L12.21 1.516 3.436 1.5z" }), o.a.createElement("path", { d: "M12.799 1.5l-.001 2.774h3.645v1.5h-5.144V1.5zM9.675 18.859l-.085-.072-4.086-3.978 1.047-1.075L9 16.119V9h2v7.273l2.473-2.526 1.072 1.049-3.896 3.979a.75.75 0 01-.974.084z" }));
        function no() {
          return (no = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var f = arguments[s];
              for (var h in f) Object.prototype.hasOwnProperty.call(f, h) && (E[h] = f[h]);
            }
            return E;
          }).apply(this, arguments);
        }
        var ro = ({ styles: E = {}, ...s }) => o.a.createElement("svg", no({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, s), o.a.createElement("path", { d: "M3.144 15.748l2.002 1.402-1.976.516-.026-1.918zM2.438 3.391l15.346 11.023-.875 1.218-5.202-3.736-2.877 4.286.006.005-3.055.797-2.646-1.852-.04-2.95-.006-.005.006-.008v-.025l.01.008L6.02 7.81l-4.457-3.2.876-1.22zM7.25 8.695l-2.13 3.198 3.277 2.294 2.104-3.158-3.25-2.334zM14.002 0l2.16 1.512-.856 1.222c.828.967 1.144 2.141.432 3.158l-2.416 3.599-1.214-.873 2.396-3.593.005.003c.317-.452-.16-1.332-1.064-1.966-.891-.624-1.865-.776-2.197-.349l-.006-.004-2.384 3.575-1.224-.879 2.376-3.539c.674-.932 1.706-1.155 3.096-.668l.046.018.85-1.216z" }));
        function Ir() {
          return (Ir = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var f = arguments[s];
              for (var h in f) Object.prototype.hasOwnProperty.call(f, h) && (E[h] = f[h]);
            }
            return E;
          }).apply(this, arguments);
        }
        var oo = ({ styles: E = {}, ...s }) => o.a.createElement("svg", Ir({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, s), o.a.createElement("path", { d: "M11.28 1a1 1 0 01.948.684l.333 1 .018.066H16a.75.75 0 01.102 1.493L16 4.25h-.5V16a2 2 0 01-2 2h-8a2 2 0 01-2-2V4.25H3a.75.75 0 01-.102-1.493L3 2.75h3.42a1 1 0 01.019-.066l.333-1A1 1 0 017.721 1h3.558zM14 4.5H5V16a.5.5 0 00.41.492l.09.008h8a.5.5 0 00.492-.41L14 16V4.5zM7.527 6.06v8.951h-1V6.06h1zm5 0v8.951h-1V6.06h1zM10 6.06v8.951H9V6.06h1z" }));
        function Gn() {
          return (Gn = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var f = arguments[s];
              for (var h in f) Object.prototype.hasOwnProperty.call(f, h) && (E[h] = f[h]);
            }
            return E;
          }).apply(this, arguments);
        }
        var ni = ({ styles: E = {}, ...s }) => o.a.createElement("svg", Gn({ viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg" }, s), o.a.createElement("path", { d: "M2.284 2.498c-.239.266-.184.617-.184 1.002V4H2a.5.5 0 00-.492.41L1.5 4.5V17a1 1 0 00.883.993L2.5 18h10a1 1 0 00.97-.752l-.081-.062c.438.368.976.54 1.507.526a2.5 2.5 0 01-2.232 1.783l-.164.005h-10a2.5 2.5 0 01-2.495-2.336L0 17V4.5a2 2 0 011.85-1.995L2 2.5l.284-.002zm10.532 0L13 2.5a2 2 0 011.995 1.85L15 4.5v2.28a2.243 2.243 0 00-1.5.404V4.5a.5.5 0 00-.41-.492L13 4v-.5l-.007-.144c-.031-.329.032-.626-.177-.858z" }), o.a.createElement("path", { d: "M6 .49l-.144.006a1.75 1.75 0 00-1.41.94l-.029.058.083-.004c-.69 0-1.25.56-1.25 1.25v1c0 .69.56 1.25 1.25 1.25h6c.69 0 1.25-.56 1.25-1.25v-1l-.006-.128a1.25 1.25 0 00-1.116-1.116l-.046-.002-.027-.058A1.75 1.75 0 009 .49H6zm0 1.5h3a.25.25 0 01.25.25l.007.102A.75.75 0 0010 2.99h.25v.5h-5.5v-.5H5a.75.75 0 00.743-.648l.007-.102A.25.25 0 016 1.99zm9.374 6.55a.75.75 0 01-.093 1.056l-2.33 1.954h6.127a.75.75 0 010 1.501h-5.949l2.19 1.837a.75.75 0 11-.966 1.15l-3.788-3.18a.747.747 0 01-.21-.285.75.75 0 01.17-.945l3.792-3.182a.75.75 0 011.057.093z" }));
        function Rn() {
          return (Rn = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var f = arguments[s];
              for (var h in f) Object.prototype.hasOwnProperty.call(f, h) && (E[h] = f[h]);
            }
            return E;
          }).apply(this, arguments);
        }
        var Ai = ({ styles: E = {}, ...s }) => o.a.createElement("svg", Rn({ viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg" }, s), o.a.createElement("path", { fill: "#4fa800", d: "M6.972 16.615a.997.997 0 01-.744-.292l-4.596-4.596a1 1 0 111.414-1.414l3.926 3.926 9.937-9.937a1 1 0 011.414 1.415L7.717 16.323a.997.997 0 01-.745.292z" }));
        u(88);
        class Mi extends c.Component {
          constructor(s) {
            super(s), this.state = { isShiftKeyPressed: !1, wasEditorDataJustCopied: !1 }, this._keyDownHandler = this._handleKeyDown.bind(this), this._keyUpHandler = this._handleKeyUp.bind(this), this._readOnlyHandler = this._handleReadOnly.bind(this), this._editorDataJustCopiedTimeout = null;
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
            let s, f;
            return this.state.wasEditorDataJustCopied ? (s = o.a.createElement(Ai, null), f = "Data copied to clipboard.") : (s = this.state.isShiftKeyPressed ? o.a.createElement(ni, null) : o.a.createElement(Qn, null), f = "Log editor data (press with Shift to copy)"), o.a.createElement(yt, { text: f, icon: s, className: this.state.wasEditorDataJustCopied ? "ck-inspector-button_data-copied" : "", isEnabled: !!this.props.editor, onClick: this._handleLogEditorDataClick.bind(this) });
          }
          _handleLogEditorDataClick({ shiftKey: s }) {
            s ? (Pi()(this.props.editor.getData()), this.setState({ wasEditorDataJustCopied: !0 }), clearTimeout(this._editorDataJustCopiedTimeout), this._editorDataJustCopiedTimeout = setTimeout(() => {
              this.setState({ wasEditorDataJustCopied: !1 });
            }, 3e3)) : console.log(this.props.editor.getData());
          }
          _handleKeyDown({ key: s }) {
            this.setState({ isShiftKeyPressed: s === "Shift" });
          }
          _handleKeyUp() {
            this.setState({ isShiftKeyPressed: !1 });
          }
          _handleReadOnly() {
            this.props.editor.isReadOnly ? this.props.editor.disableReadOnlyMode("Lock from Inspector (@ckeditor/ckeditor5-inspector)") : this.props.editor.enableReadOnlyMode("Lock from Inspector (@ckeditor/ckeditor5-inspector)");
          }
        }
        var Ra = Re(({ editors: E, currentEditorName: s, currentEditorGlobals: { isReadOnly: f } }) => ({ editor: E.get(s), isReadOnly: f }), {})(Mi);
        function Po() {
          return (Po = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var f = arguments[s];
              for (var h in f) Object.prototype.hasOwnProperty.call(f, h) && (E[h] = f[h]);
            }
            return E;
          }).apply(this, arguments);
        }
        var Aa = ({ styles: E = {}, ...s }) => o.a.createElement("svg", Po({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, s), o.a.createElement("path", { d: "M17.03 6.47a.75.75 0 01.073.976l-.072.084-6.984 7a.75.75 0 01-.977.073l-.084-.072-7.016-7a.75.75 0 01.976-1.134l.084.072 6.485 6.47 6.454-6.469a.75.75 0 01.977-.073l.084.072z" }));
        u(37);
        const jr = { position: "fixed", bottom: "0", left: "0", right: "0", top: "auto" };
        class hr extends c.Component {
          constructor(s) {
            super(s), ji(this.props.height), document.body.style.setProperty("--ck-inspector-collapsed-height", "30px"), this.handleInspectorResize = this.handleInspectorResize.bind(this);
          }
          handleInspectorResize(s, f, h) {
            const _ = h.style.height;
            this.props.setHeight(_), ji(_);
          }
          render() {
            return this.props.isCollapsed ? (document.body.classList.remove("ck-inspector-body-expanded"), document.body.classList.add("ck-inspector-body-collapsed")) : (document.body.classList.remove("ck-inspector-body-collapsed"), document.body.classList.add("ck-inspector-body-expanded")), o.a.createElement(Or, { bounds: "window", enableResizing: { top: !this.props.isCollapsed }, disableDragging: !0, minHeight: "100", maxHeight: "100%", style: jr, className: ["ck-inspector", this.props.isCollapsed ? "ck-inspector_collapsed" : ""].join(" "), position: { x: 0, y: "100%" }, size: { width: "100%", height: this.props.isCollapsed ? 30 : this.props.height }, onResizeStop: this.handleInspectorResize }, o.a.createElement(Qt, { onTabChange: this.props.setActiveTab, contentBefore: o.a.createElement(Do, { key: "docs" }), activeTab: this.props.activeTab, contentAfter: [o.a.createElement(an, { key: "selector" }), o.a.createElement("span", { className: "ck-inspector-separator", key: "separator-a" }), o.a.createElement(Ra, { key: "quick-actions" }), o.a.createElement("span", { className: "ck-inspector-separator", key: "separator-b" }), o.a.createElement(Ro, { key: "inspector-toggle" })] }, o.a.createElement(Oa, { label: "Model" }), o.a.createElement(Da, { label: "View" }), o.a.createElement(Oo, { label: "Commands" }), o.a.createElement(Zo, { label: "Schema" })));
          }
          componentWillUnmount() {
            document.body.classList.remove("ck-inspector-body-expanded"), document.body.classList.remove("ck-inspector-body-collapsed");
          }
        }
        var ri = Re(({ editors: E, currentEditorName: s, ui: { isCollapsed: f, height: h, activeTab: _ } }) => ({ isCollapsed: f, height: h, editors: E, currentEditorName: s, activeTab: _ }), { toggleIsCollapsed: At, setHeight: function(E) {
          return { type: "SET_HEIGHT", newHeight: E };
        }, setEditors: wt, setCurrentEditorName: Jt, setActiveTab: kt })(hr);
        class Do extends c.Component {
          render() {
            return o.a.createElement("a", { className: "ck-inspector-navbox__navigation__logo", title: "Go to the documentation", href: "https://ckeditor.com/docs/ckeditor5/latest/", target: "_blank", rel: "noopener noreferrer" }, "CKEditor documentation");
          }
        }
        class Ii extends c.Component {
          constructor(s) {
            super(s), this.handleShortcut = this.handleShortcut.bind(this);
          }
          render() {
            return o.a.createElement(yt, { text: "Toggle inspector", icon: o.a.createElement(Aa, null), onClick: this.props.toggleIsCollapsed, title: "Toggle inspector (Alt+F12)", className: ["ck-inspector-navbox__navigation__toggle", this.props.isCollapsed ? " ck-inspector-navbox__navigation__toggle_up" : ""].join(" ") });
          }
          componentDidMount() {
            window.addEventListener("keydown", this.handleShortcut);
          }
          componentWillUnmount() {
            window.removeEventListener("keydown", this.handleShortcut);
          }
          handleShortcut(s) {
            (function(f) {
              return f.altKey && !f.shiftKey && !f.ctrlKey && f.key === "F12";
            })(s) && this.props.toggleIsCollapsed();
          }
        }
        const Ro = Re(({ ui: { isCollapsed: E } }) => ({ isCollapsed: E }), { toggleIsCollapsed: At })(Ii);
        class Ao extends c.Component {
          render() {
            return o.a.createElement("div", { className: "ck-inspector-editor-selector", key: "editor-selector" }, this.props.currentEditorName ? o.a.createElement(rn, { id: "inspector-editor-selector", label: "Instance", value: this.props.currentEditorName, options: [...this.props.editors].map(([s]) => s), onChange: (s) => this.props.setCurrentEditorName(s.target.value) }) : "");
          }
        }
        const an = Re(({ currentEditorName: E, editors: s }) => ({ currentEditorName: E, editors: s }), { setCurrentEditorName: Jt })(Ao);
        function ji(E) {
          document.body.style.setProperty("--ck-inspector-height", E);
        }
        u(90), window.CKEDITOR_INSPECTOR_VERSION = "4.1.0";
        class $e {
          constructor() {
            Pt.a.warn("[CKEditorInspector] Whoops! Looks like you tried to create an instance of the CKEditorInspector class. To attach the inspector, use the static CKEditorInspector.attach( editor ) method instead. For the latest API, please refer to https://github.com/ckeditor/ckeditor5-inspector/blob/master/README.md. ");
          }
          static attach(...s) {
            const { CKEDITOR_VERSION: f } = window;
            if (f) {
              const [O] = f.split(".").map(Number);
              O < 34 && Pt.a.warn("[CKEditorInspector] The inspector requires using CKEditor 5 in version 34 or higher. If you cannot update CKEditor 5, consider downgrading the major version of the inspector to version 3.");
            } else Pt.a.warn("[CKEditorInspector] Could not determine a version of CKEditor 5. Some of the functionalities may not work as expected.");
            const { editors: h, options: _ } = Object(On.c)(s);
            for (const O in h) {
              const z = h[O];
              Pt.a.group("%cAttached the inspector to a CKEditor 5 instance. To learn more, visit https://ckeditor.com/docs/ckeditor5.", "font-weight: bold;"), Pt.a.log(`Editor instance "${O}"`, z), Pt.a.groupEnd(), $e._editors.set(O, z), z.on("destroy", () => {
                $e.detach(O);
              }), $e._mount(_), $e._updateEditorsState();
            }
            return Object.keys(h);
          }
          static attachToAll(s) {
            const f = document.querySelectorAll(".ck.ck-content.ck-editor__editable"), h = [];
            for (const _ of f) {
              const O = _.ckeditorInstance;
              O && !$e._isAttachedTo(O) && h.push(...$e.attach(O, s));
            }
            return h;
          }
          static detach(s) {
            $e._wrapper && ($e._editors.delete(s), $e._updateEditorsState());
          }
          static destroy() {
            if (!$e._wrapper) return;
            m.a.unmountComponentAtNode($e._wrapper), $e._editors.clear(), $e._wrapper.remove();
            const s = $e._store.getState(), f = s.editors.get(s.currentEditorName);
            f && $e._editorListener.stopListening(f), $e._editorListener = null, $e._wrapper = null, $e._store = null;
          }
          static _updateEditorsState() {
            $e._store.dispatch(wt($e._editors));
          }
          static _mount(s) {
            if ($e._wrapper) return;
            const f = $e._wrapper = document.createElement("div");
            let h, _;
            f.className = "ck-inspector-wrapper", document.body.appendChild(f), $e._editorListener = new Er({ onModelChange() {
              const O = $e._store;
              O.getState().ui.isCollapsed || (O.dispatch({ type: "UPDATE_MODEL_STATE" }), O.dispatch({ type: "UPDATE_COMMANDS_STATE" }));
            }, onViewRender() {
              const O = $e._store;
              O.getState().ui.isCollapsed || O.dispatch({ type: "UPDATE_VIEW_STATE" });
            }, onReadOnlyChange() {
              $e._store.dispatch({ type: "UPDATE_CURRENT_EDITOR_IS_READ_ONLY" });
            } }), $e._store = P(Gr, { editors: $e._editors, currentEditorName: Object(On.b)($e._editors), currentEditorGlobals: {}, ui: { isCollapsed: s.isCollapsed } }), $e._store.subscribe(() => {
              const O = $e._store.getState(), z = O.editors.get(O.currentEditorName);
              h !== z && (h && $e._editorListener.stopListening(h), z && $e._editorListener.startListening(z), h = z);
            }), $e._store.subscribe(() => {
              const O = $e._store, z = O.getState().ui.isCollapsed, ne = _ && !z;
              _ = z, ne && (O.dispatch({ type: "UPDATE_MODEL_STATE" }), O.dispatch({ type: "UPDATE_COMMANDS_STATE" }), O.dispatch({ type: "UPDATE_VIEW_STATE" }));
            }), m.a.render(o.a.createElement(V, { store: $e._store }, o.a.createElement(ri, null)), f);
          }
          static _isAttachedTo(s) {
            return [...$e._editors.values()].includes(s);
          }
        }
        $e._editors = /* @__PURE__ */ new Map(), $e._wrapper = null;
      }]).default;
    });
  }(Ss)), Ss.exports;
}
var bu = gu();
const yu = /* @__PURE__ */ mu(bu);
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
const vu = function(Te) {
  const L = Te.plugins.get(ec), b = $(Te.ui.view.element), a = $(Te.sourceElement), u = `ckeditor${Math.floor(Math.random() * 1e9)}`, c = [
    "keypress",
    "keyup",
    "change",
    "focus",
    "blur",
    "click",
    "mousedown",
    "mouseup"
  ].map((o) => `${o}.${u}`).join(" ");
  L.on("change:isSourceEditingMode", () => {
    const o = b.find(
      ".ck-source-editing-area"
    );
    if (L.isSourceEditingMode) {
      let x = o.attr("data-value");
      o.on(c, () => {
        x !== (x = o.attr("data-value")) && a.val(x);
      });
    } else
      o.off(`.${u}`);
  });
}, wu = function(Te, L) {
  if (L.heading !== void 0) {
    var b = L.heading.options;
    b.find((a) => a.view === "h1") !== void 0 && Te.keystrokes.set(
      "Ctrl+Alt+1",
      () => Te.execute("heading", { value: "heading1" })
    ), b.find((a) => a.view === "h2") !== void 0 && Te.keystrokes.set(
      "Ctrl+Alt+2",
      () => Te.execute("heading", { value: "heading2" })
    ), b.find((a) => a.view === "h3") !== void 0 && Te.keystrokes.set(
      "Ctrl+Alt+3",
      () => Te.execute("heading", { value: "heading3" })
    ), b.find((a) => a.view === "h4") !== void 0 && Te.keystrokes.set(
      "Ctrl+Alt+4",
      () => Te.execute("heading", { value: "heading4" })
    ), b.find((a) => a.view === "h5") !== void 0 && Te.keystrokes.set(
      "Ctrl+Alt+5",
      () => Te.execute("heading", { value: "heading5" })
    ), b.find((a) => a.view === "h6") !== void 0 && Te.keystrokes.set(
      "Ctrl+Alt+6",
      () => Te.execute("heading", { value: "heading6" })
    ), b.find((a) => a.model === "paragraph") !== void 0 && Te.keystrokes.set("Ctrl+Alt+p", "paragraph");
  }
}, ku = function(Te, L) {
  let b = null;
  const a = Te.editing.view.document, u = Te.plugins.get("ClipboardPipeline");
  a.on("clipboardOutput", (c, o) => {
    b = Te.id;
  }), a.on("clipboardInput", async (c, o) => {
    let x = o.dataTransfer.getData("text/html");
    if (x && x.includes("<craft-entry") && !(o.method == "drop" && b === Te.id)) {
      if (o.method == "paste" || o.method == "drop" && b !== Te.id) {
        let m = x, g = !1;
        const v = Craft.siteId;
        let y = null, C = null;
        const T = Te.getData(), P = [...x.matchAll(/data-entry-id="([0-9]+)/g)];
        c.stop();
        const X = $(Te.ui.view.element);
        let j = X.parents("form").data("elementEditor");
        await j.ensureIsDraftOrRevision(), y = j.settings.elementId, C = X.parents(".field").data("layoutElement");
        for (let B = 0; B < P.length; B++) {
          let N = null;
          if (P[B][1] && (N = P[B][1]), N !== null) {
            const M = new RegExp('data-entry-id="' + N + '"');
            if (!(b === Te.id && !M.test(T))) {
              let V = null;
              b !== Te.id && (L.includes(du) ? V = Te.config.get("entryTypeOptions").map((R) => R.value) : (Craft.cp.displayError(
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
                    siteId: v,
                    targetEntryTypeIds: V,
                    targetOwnerId: y,
                    targetLayoutElementUid: C
                  }
                }
              ).then((R) => {
                R.data.newEntryId && (m = m.replace(
                  N,
                  R.data.newEntryId
                ));
              }).catch((R) => {
                var oe, Q, I, A;
                g = !0, Craft.cp.displayError((Q = (oe = R == null ? void 0 : R.response) == null ? void 0 : oe.data) == null ? void 0 : Q.message), console.error((A = (I = R == null ? void 0 : R.response) == null ? void 0 : I.data) == null ? void 0 : A.additionalMessage);
              });
            }
          }
        }
        g || (o.content = Te.data.htmlProcessor.toView(m), u.fire("inputTransformation", o));
      }
    }
  });
}, Tu = async function(Te, L) {
  typeof Te == "string" && (Te = document.querySelector(`#${Te}`)), L.licenseKey = "GPL";
  const b = await eu.create(Te, L);
  return Craft.showCkeditorInspector && Craft.userIsAdmin && yu.attach(b), b.editing.view.change((a) => {
    const u = b.editing.view.document.getRoot();
    if (typeof L.accessibleFieldName < "u" && L.accessibleFieldName.length) {
      let c = u.getAttribute("aria-label");
      a.setAttribute(
        "aria-label",
        L.accessibleFieldName + ", " + c,
        u
      );
    }
    typeof L.describedBy < "u" && L.describedBy.length && a.setAttribute(
      "aria-describedby",
      L.describedBy,
      u
    );
  }), b.updateSourceElement(), b.model.document.on("change:data", () => {
    b.updateSourceElement();
  }), L.plugins.includes(ec) && vu(b), L.plugins.includes(tu) && wu(b, L), ku(b, L.plugins), b;
};
export {
  du as CraftEntries,
  _u as CraftImageInsertUI,
  Cu as CraftLink,
  Su as ImageEditor,
  xu as ImageTransform,
  Tu as create
};
