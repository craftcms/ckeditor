import { ImageInsertUI as Vc, ButtonView as vi, IconImage as Bc, Command as Os, Plugin as Vn, ImageUtils as Jl, Collection as Sa, ViewModel as Yo, createDropdown as Ca, DropdownButtonView as Hc, IconObjectSizeMedium as Wc, addListToDropdown as Ta, Widget as $c, viewToModelPositionOutsideModelElement as Yc, toWidget as qc, DomEventObserver as Kc, WidgetToolbarRepository as Gl, isWidget as Qc, findAttributeRange as Gc, View as ko, LinkUI as Xl, ContextualBalloon as Xc, Range as Zc, SwitchButtonView as Jc, LabeledFieldView as eu, createLabeledInputText as tu, ClassicEditor as nu, SourceEditing as ec, Heading as ru } from "ckeditor5";
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class Ou extends Vc {
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
    const R = this.editor.ui.componentFactory, m = (i) => this._createToolbarImageButton(i);
    R.add("insertImage", m), R.add("imageInsert", m);
  }
  get _assetSources() {
    return this.editor.config.get("assetSources");
  }
  _createToolbarImageButton(R) {
    const m = this.editor, i = m.t, u = new vi(R);
    u.isEnabled = !0, u.label = i("Insert image"), u.icon = Bc, u.tooltip = !0;
    const c = m.commands.get("insertImage");
    return u.bind("isEnabled").to(c), this.listenTo(u, "execute", () => this._showImageSelectModal()), u;
  }
  _showImageSelectModal() {
    const R = this._assetSources, m = this.editor, i = m.config, u = Object.assign({}, i.get("assetSelectionCriteria"), {
      kind: "image"
    });
    Craft.createElementSelectorModal("craft\\elements\\Asset", {
      storageKey: `ckeditor:${this.pluginName}:'craft\\elements\\Asset'`,
      sources: R,
      criteria: u,
      defaultSiteId: i.get("elementSiteId"),
      transforms: i.get("transforms"),
      multiSelect: !0,
      autoFocusSearchBox: !1,
      onSelect: (c, o) => {
        this._processAssetUrls(c, o).then(() => {
          m.editing.view.focus();
        });
      },
      onHide: () => {
        m.editing.view.focus();
      },
      closeOtherModals: !1
    });
  }
  _processAssetUrls(R, m) {
    return new Promise((i) => {
      if (!R.length) {
        i();
        return;
      }
      const u = this.editor, c = u.config.get("defaultTransform"), o = new Craft.Queue(), E = [];
      o.on("afterRun", () => {
        u.execute("insertImage", { source: E }), i();
      });
      for (const g of R)
        o.push(
          () => new Promise((b) => {
            const y = this._isTransformUrl(g.url);
            if (!y && c)
              this._getTransformUrl(g.id, c, (v) => {
                E.push(v), b();
              });
            else {
              const v = this._buildAssetUrl(
                g.id,
                g.url,
                y ? m : c
              );
              E.push(v), b();
            }
          })
        );
    });
  }
  _buildAssetUrl(R, m, i) {
    return `${m}#asset:${R}:${i ? "transform:" + i : "url"}`;
  }
  _removeTransformFromUrl(R) {
    return R.replace(/(^|\/)(_[^\/]+\/)([^\/]+)$/, "$1$3");
  }
  _isTransformUrl(R) {
    return /(^|\/)_[^\/]+\/[^\/]+$/.test(R);
  }
  _getTransformUrl(R, m, i) {
    Craft.sendActionRequest("POST", "ckeditor/ckeditor/image-url", {
      data: {
        assetId: R,
        transform: m
      }
    }).then(({ data: u }) => {
      i(this._buildAssetUrl(R, u.url, m));
    }).catch(() => {
      alert("There was an error generating the transform URL.");
    });
  }
  _getAssetUrlComponents(R) {
    const m = R.match(
      /(.*)#asset:(\d+):(url|transform):?([a-zA-Z][a-zA-Z0-9_]*)?/
    );
    return m ? {
      url: m[1],
      assetId: m[2],
      transform: m[3] !== "url" ? m[4] : null
    } : null;
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class ou extends Os {
  refresh() {
    const R = this._element(), m = this._srcInfo(R);
    this.isEnabled = !!m, m ? this.value = {
      transform: m.transform
    } : this.value = null;
  }
  _element() {
    const R = this.editor;
    return R.plugins.get("ImageUtils").getClosestSelectedImageElement(
      R.model.document.selection
    );
  }
  _srcInfo(R) {
    if (!R || !R.hasAttribute("src"))
      return null;
    const m = R.getAttribute("src"), i = m.match(
      /#asset:(\d+)(?::transform:([a-zA-Z][a-zA-Z0-9_]*))?/
    );
    return i ? {
      src: m,
      assetId: i[1],
      transform: i[2]
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
  execute(R) {
    const i = this.editor.model, u = this._element(), c = this._srcInfo(u);
    if (this.value = {
      transform: R.transform
    }, c) {
      const o = `#asset:${c.assetId}` + (R.transform ? `:transform:${R.transform}` : "");
      i.change((E) => {
        const g = c.src.replace(/#.*/, "") + o;
        E.setAttribute("src", g, u);
      }), Craft.sendActionRequest("post", "ckeditor/ckeditor/image-url", {
        data: {
          assetId: c.assetId,
          transform: R.transform
        }
      }).then(({ data: E }) => {
        i.change((g) => {
          const b = E.url + o;
          g.setAttribute("src", b, u), E.width && g.setAttribute("width", E.width, u), E.height && g.setAttribute("height", E.height, u);
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
class tc extends Vn {
  static get requires() {
    return [Jl];
  }
  static get pluginName() {
    return "ImageTransformEditing";
  }
  constructor(R) {
    super(R), R.config.define("transforms", []);
  }
  init() {
    const R = this.editor, m = new ou(R);
    R.commands.add("transformImage", m);
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
const iu = Wc;
class au extends Vn {
  static get requires() {
    return [tc];
  }
  static get pluginName() {
    return "ImageTransformUI";
  }
  init() {
    const R = this.editor, m = R.config.get("transforms"), i = R.commands.get("transformImage");
    this.bind("isEnabled").to(i), this._registerImageTransformDropdown(m);
  }
  /**
   * A helper function that creates a dropdown component for the plugin containing all the transform options defined in
   * the editor configuration.
   *
   * @param transforms An array of the available image transforms.
   */
  _registerImageTransformDropdown(R) {
    const m = this.editor, i = m.t, u = {
      name: "transformImage:original",
      value: null
    }, c = [
      u,
      ...R.map((E) => ({
        label: E.name,
        name: `transformImage:${E.handle}`,
        value: E.handle
      }))
    ], o = (E) => {
      const g = m.commands.get("transformImage"), b = Ca(E, Hc), y = b.buttonView;
      return y.set({
        tooltip: i("Resize image"),
        commandValue: null,
        icon: iu,
        isToggleable: !0,
        label: this._getOptionLabelValue(u),
        withText: !0,
        class: "ck-resize-image-button"
      }), y.bind("label").to(g, "value", (v) => {
        if (!v || !v.transform)
          return this._getOptionLabelValue(u);
        const C = R.find(
          (x) => x.handle === v.transform
        );
        return C ? C.name : v.transform;
      }), b.bind("isEnabled").to(this), Ta(
        b,
        () => this._getTransformDropdownListItemDefinitions(c, g),
        {
          ariaLabel: i("Image resize list")
        }
      ), this.listenTo(b, "execute", (v) => {
        m.execute(v.source.commandName, {
          transform: v.source.commandValue
        }), m.editing.view.focus();
      }), b;
    };
    m.ui.componentFactory.add("transformImage", o);
  }
  /**
   * A helper function for creating an option label value string.
   *
   * @param option A transform option object.
   * @returns The option label.
   */
  _getOptionLabelValue(R) {
    return R.label || R.value || this.editor.t("Original");
  }
  /**
   * A helper function that parses the transform options and returns list item definitions ready for use in the dropdown.
   *
   * @param options The transform options.
   * @param command The transform image command.
   * @returns Dropdown item definitions.
   */
  _getTransformDropdownListItemDefinitions(R, m) {
    const i = new Sa();
    return R.map((u) => {
      const c = {
        type: "button",
        model: new Yo({
          commandName: "transformImage",
          commandValue: u.value,
          label: this._getOptionLabelValue(u),
          withText: !0,
          icon: null
        })
      };
      c.model.bind("isOn").to(m, "value", su(u.value)), i.add(c);
    }), i;
  }
}
function su(xe) {
  return (R) => {
    const m = R;
    return xe === null && m === xe ? !0 : m !== null && m.transform === xe;
  };
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class Pu extends Vn {
  static get requires() {
    return [tc, au];
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
class lu extends Os {
  refresh() {
    const R = this._element(), m = this._srcInfo(R);
    if (this.isEnabled = !!m, this.isEnabled) {
      let i = {
        assetId: m.assetId
      };
      Craft.sendActionRequest("POST", "ckeditor/ckeditor/image-permissions", {
        data: i
      }).then((u) => {
        u.data.editable === !1 && (this.isEnabled = !1);
      });
    }
  }
  /**
   * Returns the selected image element.
   */
  _element() {
    const R = this.editor;
    return R.plugins.get("ImageUtils").getClosestSelectedImageElement(
      R.model.document.selection
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
  _srcInfo(R) {
    if (!R || !R.hasAttribute("src"))
      return null;
    const m = R.getAttribute("src"), i = m.match(
      /(.*)#asset:(\d+)(?::transform:([a-zA-Z][a-zA-Z0-9_]*))?/
    );
    return i ? {
      src: m,
      baseSrc: i[1],
      assetId: i[2],
      transform: i[3]
    } : null;
  }
  /**
   * Executes the command.
   *
   * @fires execute
   */
  execute() {
    this.editor.model;
    const m = this._element(), i = this._srcInfo(m);
    if (i) {
      let u = {
        allowSavingAsNew: !1,
        // todo: we might want to change that, but currently we're doing the same functionality as in Redactor
        onSave: (c) => {
          this._reloadImage(i.assetId, c);
        },
        allowDegreeFractions: Craft.isImagick
      };
      new Craft.AssetImageEditor(i.assetId, u);
    }
  }
  /**
   * Reloads the matching images after save was triggered from the Image Editor.
   *
   * @param data
   */
  _reloadImage(R, m) {
    let u = this.editor.model;
    this._getAllImageAssets().forEach((o) => {
      if (o.srcInfo.assetId == R)
        if (o.srcInfo.transform) {
          let E = {
            assetId: o.srcInfo.assetId,
            handle: o.srcInfo.transform
          };
          Craft.sendActionRequest("POST", "assets/generate-transform", {
            data: E
          }).then((g) => {
            let b = g.data.url + "?" + (/* @__PURE__ */ new Date()).getTime() + "#asset:" + o.srcInfo.assetId + ":transform:" + o.srcInfo.transform;
            u.change((y) => {
              y.setAttribute("src", b, o.element);
            });
          });
        } else {
          let E = o.srcInfo.baseSrc + "?" + (/* @__PURE__ */ new Date()).getTime() + "#asset:" + o.srcInfo.assetId;
          u.change((g) => {
            g.setAttribute("src", E, o.element);
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
    const m = this.editor.model, i = m.createRangeIn(m.document.getRoot());
    let u = [];
    for (const c of i.getWalker({ ignoreElementEnd: !0 }))
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
class nc extends Vn {
  static get requires() {
    return [Jl];
  }
  static get pluginName() {
    return "ImageEditorEditing";
  }
  init() {
    const R = this.editor, m = new lu(R);
    R.commands.add("imageEditor", m);
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class cu extends Vn {
  static get requires() {
    return [nc];
  }
  static get pluginName() {
    return "ImageEditorUI";
  }
  init() {
    const m = this.editor.commands.get("imageEditor");
    this.bind("isEnabled").to(m), this._registerImageEditorButton();
  }
  /**
   * A helper function that creates a button component for the plugin that triggers launch of the Image Editor.
   */
  _registerImageEditorButton() {
    const R = this.editor, m = R.t, i = R.commands.get("imageEditor"), u = () => {
      const c = new vi();
      return c.set({
        label: m("Edit Image"),
        withText: !0
      }), c.bind("isEnabled").to(i), this.listenTo(c, "execute", (o) => {
        R.execute("imageEditor"), R.editing.view.focus();
      }), c;
    };
    R.ui.componentFactory.add("imageEditor", u);
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class Nu extends Vn {
  static get requires() {
    return [nc, cu];
  }
  static get pluginName() {
    return "ImageEditor";
  }
}
class uu extends Os {
  execute(R) {
    const m = this.editor, i = m.model.document.selection;
    m.model.change((u) => {
      const c = u.createElement("craftEntryModel", {
        ...Object.fromEntries(i.getAttributes()),
        cardHtml: R.cardHtml,
        entryId: R.entryId,
        siteId: R.siteId
      });
      m.model.insertObject(c, null, null, {
        setSelection: "after"
      });
    });
  }
  refresh() {
    const m = this.editor.model.document.selection, i = !m.isCollapsed && m.getFirstRange();
    this.isEnabled = !i;
  }
}
class du extends Vn {
  /**
   * @inheritDoc
   */
  static get requires() {
    return [$c];
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
    const R = this.editor;
    R.commands.add("insertEntry", new uu(R)), R.editing.mapper.on(
      "viewToModelPosition",
      Yc(R.model, (m) => {
        m.hasClass("cke-entry-card");
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
    const R = this.editor.conversion;
    R.for("upcast").elementToElement({
      view: {
        name: "craft-entry"
        // has to be lower case
      },
      model: (i, { writer: u }) => {
        const c = i.getAttribute("data-card-html"), o = i.getAttribute("data-entry-id"), E = i.getAttribute("data-site-id") ?? null;
        return u.createElement("craftEntryModel", {
          cardHtml: c,
          entryId: o,
          siteId: E
        });
      }
    }), R.for("editingDowncast").elementToElement({
      model: "craftEntryModel",
      view: (i, { writer: u }) => {
        const c = i.getAttribute("entryId") ?? null, o = i.getAttribute("siteId") ?? null, E = u.createContainerElement("div", {
          class: "cke-entry-card",
          "data-entry-id": c,
          "data-site-id": o
        });
        return m(i, u, E), qc(E, u);
      }
    }), R.for("dataDowncast").elementToElement({
      model: "craftEntryModel",
      view: (i, { writer: u }) => {
        const c = i.getAttribute("entryId") ?? null, o = i.getAttribute("siteId") ?? null;
        return u.createContainerElement("craft-entry", {
          "data-entry-id": c,
          "data-site-id": o
        });
      }
    });
    const m = (i, u, c) => {
      this._getCardHtml(i).then((o) => {
        const E = u.createRawElement(
          "div",
          null,
          function(b) {
            b.innerHTML = o.cardHtml, Craft.appendHeadHtml(o.headHtml), Craft.appendBodyHtml(o.bodyHtml);
          }
        );
        u.insert(u.createPositionAt(c, 0), E);
        const g = this.editor;
        g.editing.view.focus(), setTimeout(() => {
          Craft.cp.elementThumbLoader.load($(g.ui.element));
        }, 100), g.model.change((b) => {
          g.ui.update(), $(g.sourceElement).trigger("keyup");
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
  async _getCardHtml(R) {
    var E, g, b;
    let m = R.getAttribute("cardHtml") ?? null, i = $(this.editor.sourceElement).parents(".field");
    const u = $(i[0]).data("layout-element");
    if (m)
      return { cardHtml: m };
    const c = R.getAttribute("entryId") ?? null, o = R.getAttribute("siteId") ?? null;
    try {
      const y = this.editor, C = $(y.ui.view.element).closest(
        "form,.lp-editor-container"
      ).data("elementEditor");
      C && await C.checkForm();
      const { data: x } = await Craft.sendActionRequest(
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
      return x;
    } catch (y) {
      return console.error((E = y == null ? void 0 : y.response) == null ? void 0 : E.data), { cardHtml: '<div class="element card"><div class="card-content"><div class="card-heading"><div class="label error"><span>' + (((b = (g = y == null ? void 0 : y.response) == null ? void 0 : g.data) == null ? void 0 : b.message) || "An unknown error occurred.") + "</span></div></div></div></div>" };
    }
  }
}
class fu extends Kc {
  constructor(R) {
    super(R), this.domEventType = "dblclick";
  }
  onDomEvent(R) {
    this.fire(R.type, R);
  }
}
class pu extends Vn {
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
    this.editor.ui.componentFactory.add("createEntry", (R) => this._createToolbarEntriesButton(R)), this.editor.ui.componentFactory.add("editEntryBtn", (R) => this._createEditEntryBtn(R)), this._listenToEvents();
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
      getRelatedElement: (m) => {
        const i = m.getSelectedElement();
        return i && Qc(i) && i.hasClass("cke-entry-card") ? i : null;
      }
    });
  }
  /**
   * Hook up event listeners
   *
   * @private
   */
  _listenToEvents() {
    const R = this.editor.editing.view, m = R.document;
    R.addObserver(fu), this.editor.listenTo(m, "dblclick", (i, u) => {
      const c = this.editor.editing.mapper.toModelElement(
        u.target.parent
      );
      c.name === "craftEntryModel" && this._initEditEntrySlideout(u, c);
    });
  }
  _initEditEntrySlideout(R = null, m = null) {
    m === null && (m = this.editor.model.document.selection.getSelectedElement());
    const i = m.getAttribute("entryId"), u = m.getAttribute("siteId") ?? null;
    this._showEditEntrySlideout(i, u, m);
  }
  /**
   * Creates a toolbar button that allows for an entry to be inserted into the editor
   *
   * @param locale
   * @private
   */
  _createToolbarEntriesButton(R) {
    const m = this.editor, i = m.config.get("entryTypeOptions"), u = m.commands.get("insertEntry");
    if (!i || !i.length)
      return;
    const c = Ca(R);
    return c.buttonView.set({
      label: m.config.get("createButtonLabel") || Craft.t("app", "New {type}", {
        type: Craft.t("app", "entry")
      }),
      tooltip: !0,
      withText: !0
      //commandValue: null,
    }), c.bind("isEnabled").to(u), Ta(
      c,
      () => this._getDropdownItemsDefinitions(i, u),
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
  _getDropdownItemsDefinitions(R, m) {
    const i = new Sa();
    return R.map((u) => {
      const c = {
        type: "button",
        model: new Yo({
          commandValue: u.value,
          //entry type id
          label: u.label || u.value,
          icon: u.icon,
          withText: !0
        })
      };
      i.add(c);
    }), i;
  }
  /**
   * Creates an edit entry button that shows in the contextual balloon for each craft entry widget
   * @param locale
   * @returns {ButtonView}
   * @private
   */
  _createEditEntryBtn(R) {
    const m = new vi(R);
    return m.set({
      isEnabled: !0,
      label: Craft.t("app", "Edit {type}", {
        type: Craft.elementTypeNames["craft\\elements\\Entry"][2]
      }),
      tooltip: !0,
      withText: !0
    }), this.listenTo(m, "execute", (i) => {
      this._initEditEntrySlideout();
    }), m;
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
  _getCardElement(R) {
    return $(this.editor.ui.element).find('.element.card[data-id="' + R + '"]');
  }
  /**
   * Opens an element editor for existing entry
   *
   * @param entryId
   * @private
   */
  _showEditEntrySlideout(R, m, i) {
    const u = this.editor, c = u.model, o = this.getElementEditor();
    let E = this._getCardElement(R);
    const g = E.data("owner-id"), b = Craft.createElementEditor(this.elementType, null, {
      elementId: R,
      params: {
        siteId: m
      },
      onLoad: () => {
        b.elementEditor.on("update", () => {
          Craft.Preview.refresh();
        });
      },
      onBeforeSubmit: async () => {
        if (E !== null && Garnish.hasAttr(E, "data-owner-is-canonical") && !o.settings.isUnpublishedDraft) {
          await b.elementEditor.checkForm(!0, !0);
          let y = $(u.sourceElement).attr("name");
          o && y && await o.setFormValue(y, "*"), o.settings.draftId && b.elementEditor.settings.draftId && (b.elementEditor.settings.saveParams || (b.elementEditor.settings.saveParams = {}), b.elementEditor.settings.saveParams.action = "elements/save-nested-element-for-derivative", b.elementEditor.settings.saveParams.newOwnerId = o.getDraftElementId(g));
        }
      },
      onSubmit: (y) => {
        let v = this._getCardElement(R);
        v !== null && y.data.id != v.data("id") && (v.attr("data-id", y.data.id).data("id", y.data.id).data("owner-id", y.data.ownerId), u.editing.model.change((C) => {
          C.setAttribute("entryId", y.data.id, i), u.ui.update();
        }), Craft.refreshElementInstances(y.data.id));
      }
    });
    b.on("beforeClose", () => {
      c.change((y) => {
        y.setSelection(y.createPositionAfter(i)), u.editing.view.focus();
      });
    }), b.on("close", () => {
      u.editing.view.focus();
    });
  }
  /**
   * Creates new entry and opens the element editor for it
   *
   * @param entryTypeId
   * @private
   */
  async _showCreateEntrySlideout(R) {
    var v, C;
    const m = this.editor, i = m.model, c = i.document.selection.getFirstRange(), o = m.config.get(
      "nestedElementAttributes"
    ), E = Object.assign({}, o, {
      typeId: R
    }), g = this.getElementEditor();
    g && (await g.markDeltaNameAsModified(m.sourceElement.name), E.ownerId = g.getDraftElementId(
      o.ownerId
    ));
    let b;
    try {
      b = (await Craft.sendActionRequest(
        "POST",
        "elements/create",
        {
          data: E
        }
      )).data;
    } catch (x) {
      throw Craft.cp.displayError((C = (v = x == null ? void 0 : x.response) == null ? void 0 : v.data) == null ? void 0 : C.error), x;
    }
    const y = Craft.createElementEditor(this.elementType, {
      elementId: b.element.id,
      draftId: b.element.draftId,
      params: {
        fresh: 1,
        siteId: b.element.siteId
      },
      onSubmit: (x) => {
        m.commands.execute("insertEntry", {
          entryId: x.data.id,
          siteId: x.data.siteId
        });
      }
    });
    y.on("beforeClose", () => {
      y.$triggerElement = null, i.change((x) => {
        x.setSelection(
          x.createPositionAt(
            m.model.document.getRoot(),
            c.end.path[0]
          )
        );
      }), m.editing.view.focus();
    });
  }
}
class hu extends Vn {
  static get requires() {
    return [du, pu];
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
class mu extends Vn {
  static get pluginName() {
    return "CraftLinkEditing";
  }
  constructor() {
    super(...arguments), this.conversionData = [], this.editor.config.define("advancedLinkFields", []);
  }
  init() {
    const m = this.editor.config.get("advancedLinkFields");
    this.conversionData = m.map((i) => i.conversion ?? null).filter((i) => i), this._defineSchema(), this._defineConverters(), this._adjustLinkCommand(), this._adjustUnlinkCommand();
  }
  _defineSchema() {
    const R = this.editor.model.schema;
    let m = this.conversionData.map((i) => i.model);
    R.extend("$text", {
      allowAttributes: m
    });
  }
  _defineConverters() {
    const R = this.editor.conversion;
    for (let m = 0; m < this.conversionData.length; m++)
      R.for("downcast").attributeToElement({
        model: this.conversionData[m].model,
        view: (i, { writer: u }) => {
          const c = u.createAttributeElement(
            "a",
            { [this.conversionData[m].view]: i },
            { priority: 5 }
          );
          return u.setCustomProperty("link", !0, c), c;
        }
      }), R.for("upcast").attributeToAttribute({
        view: {
          name: "a",
          key: this.conversionData[m].view
        },
        model: {
          key: this.conversionData[m].model,
          value: (i, u) => i.getAttribute(this.conversionData[m].view)
        }
      });
  }
  _adjustLinkCommand() {
    const R = this.editor, m = R.commands.get("link");
    let i = !1;
    m.on(
      "execute",
      (u, c) => {
        if (i) {
          i = !1;
          return;
        }
        u.stop(), i = !0;
        const o = c[c.length - 1], E = R.model.document.selection;
        R.model.change((g) => {
          R.execute("link", ...c);
          const b = E.getFirstPosition();
          this.conversionData.forEach((y) => {
            if (E.isCollapsed) {
              const v = b.textNode || b.nodeBefore;
              o[y.model] ? g.setAttribute(
                y.model,
                o[y.model],
                g.createRangeOn(v)
              ) : g.removeAttribute(y.model, g.createRangeOn(v));
            } else {
              const v = R.model.schema.getValidRanges(
                E.getRanges(),
                y.model
              );
              for (const C of v)
                o[y.model] ? g.setAttribute(
                  y.model,
                  o[y.model],
                  C
                ) : g.removeAttribute(y.model, C);
            }
          });
        });
      },
      { priority: "high" }
    );
  }
  _adjustUnlinkCommand() {
    const R = this.editor, m = R.commands.get("unlink"), { model: i } = R, { selection: u } = i.document;
    let c = !1;
    m.on(
      "execute",
      (o) => {
        c || (o.stop(), i.change(() => {
          c = !0, R.execute("unlink"), c = !1, i.change((E) => {
            let g;
            this.conversionData.forEach((b) => {
              u.isCollapsed ? g = [
                Gc(
                  u.getFirstPosition(),
                  b.model,
                  u.getAttribute(b.model),
                  i
                )
              ] : g = i.schema.getValidRanges(
                u.getRanges(),
                b.model
              );
              for (const y of g)
                E.removeAttribute(b.model, y);
            });
          });
        }));
      },
      { priority: "high" }
    );
  }
}
class gu extends ko {
  constructor(R, m = {}) {
    super(R), this.bindTemplate, this.set("isFocused", !1), this.linkUi = m.linkUi, this.editor = this.linkUi.editor, this.elementId = this.linkUi._getLinkElementId(), this.siteId = this.linkUi._getLinkSiteId(), this.linkOption = m.linkOption;
    const i = this.linkUi._getLinkElementRefHandle();
    if (this.button = null, i) {
      const u = this.linkUi.linkTypeDropdownItemModels[i];
      this.linkUi.linkTypeDropdownView.buttonView.label == u.label && (this.button = Craft.t("app", "Loading"));
    }
    this.button == null && (this.button = new vi(), this.button.set({
      label: Craft.t("app", "Choose"),
      withText: !0,
      class: "btn add icon dashed"
    })), this.setTemplate({
      tag: "div",
      attributes: {
        // ck-reset_all-excluded class is needed so that CKE doesn't mess with the styles we already have
        class: ["elementselect", "ck-reset_all-excluded"],
        tabindex: 0
      },
      children: [this.button]
    });
  }
  // this is needed so that the '.elementselect' is focusable
  focus() {
    this.element.focus();
  }
  render() {
    super.render();
    const R = this.linkUi, m = R._linkUI, i = this.linkOption;
    this.element.addEventListener("click", function(u) {
      (this.children[0].classList.contains("add") || u.target.classList.contains("ck-button__label")) && (m._hideUI(), R._showElementSelectorModal(i));
    }), this.element.children.length == 0 && Craft.sendActionRequest(
      "POST",
      "ckeditor/ckeditor/render-element-with-supported-sites",
      {
        data: {
          elements: [
            {
              type: i.elementType,
              id: this.elementId,
              siteId: this.siteId,
              instances: [
                {
                  context: "field",
                  ui: "chip",
                  sortable: !1,
                  showActionMenu: !1
                }
              ]
            }
          ]
        }
      }
    ).then((u) => {
      var c;
      if (Object.keys(u.data.elements).length > 0) {
        for (const [g, b] of Object.entries(
          this.linkUi.sitesView.siteDropdownItemModels
        ))
          u.data.siteIds.includes(parseInt(g)) || g == "current" ? b.set("isEnabled", !0) : b.set("isEnabled", !1);
        this.element.innerHTML = u.data.elements[this.elementId][0], Craft.appendHeadHtml(u.data.headHtml), Craft.appendBodyHtml(u.data.bodyHtml);
        let o = this.element.firstChild;
        const E = [
          {
            icon: "arrows-rotate",
            label: Craft.t("app", "Replace"),
            callback: () => {
              this.linkUi._showElementSelectorModal(this.linkOption);
            }
          },
          {
            icon: "remove",
            label: Craft.t("app", "Remove"),
            callback: () => {
              this.editor.commands.get("unlink").execute();
            }
          }
        ];
        Craft.addActionsToChip(o, E), R._alignFocus();
      } else if (((c = this.linkUi.previousLinkValue) == null ? void 0 : c.length) > 0) {
        const { formView: o } = this.linkUi._linkUI;
        o.urlInputView.fieldView.set(
          "value",
          this.linkUi.previousLinkValue
        );
      } else
        this.button = new vi(), this.button.set({
          label: Craft.t("app", "Choose"),
          withText: !0,
          class: "btn add icon dashed"
        }), this.button.render(), this.element.innerHTML = this.button.element.outerHTML;
    }).catch((u) => {
      var c, o, E, g;
      throw Craft.cp.displayError((o = (c = u == null ? void 0 : u.response) == null ? void 0 : c.data) == null ? void 0 : o.message), ((g = (E = u == null ? void 0 : u.response) == null ? void 0 : E.data) == null ? void 0 : g.message) ?? u;
    });
  }
}
class bu extends ko {
  constructor(R, m = {}) {
    super(R), this.bindTemplate, this.set("isFocused", !1), this.linkUi = m.linkUi, this.editor = this.linkUi.editor, this.elementId = this.linkUi._getLinkElementId(), this.siteId = this.linkUi._getLinkSiteId(), this.linkOption = m.linkOption, this.siteIds = m.siteIds ?? null, this.linkUi._getLinkElementRefHandle(), this.siteDropdownView = Ca(this.linkUi._linkUI.formView.locale), this.siteDropdownItemModels = null, this.localizedRefHandleRE = null;
    const i = CKE_LOCALIZED_REF_HANDLES.join("|");
    this.localizedRefHandleRE = new RegExp(
      `(#(?:${i}):\\d+)(?:@(\\d+))?`
    ), this.setTemplate({
      tag: "div",
      attributes: {
        // ck-reset_all-excluded class is needed so that CKE doesn't mess with the styles we already have
        class: ["sites-dropdown", "ck-reset_all-excluded"],
        tabindex: 0
      },
      children: [this.siteDropdownView]
    });
  }
  // this is needed so that the '.elementselect' is focusable
  focus() {
    this.element.focus();
  }
  render() {
    super.render(), this.sitesDropdown(this.siteIds);
  }
  sitesDropdown() {
    const { formView: R } = this.linkUi._linkUI, { urlInputView: m } = R, { fieldView: i } = m;
    this.siteDropdownView.buttonView.set({
      label: "",
      withText: !0,
      isVisible: !0
    }), this.siteDropdownItemModels = Object.fromEntries(
      Craft.sites.map((u) => [
        u.id,
        new Yo({
          label: u.name,
          siteId: u.id,
          withText: !0
        })
      ])
    ), this.siteDropdownItemModels.current = new Yo({
      label: Craft.t("ckeditor", "Link to the current site"),
      siteId: null,
      withText: !0
    }), Ta(
      this.siteDropdownView,
      new Sa([
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
      const c = this.linkUi._urlInputRefMatch(this.localizedRefHandleRE);
      if (!c) {
        console.warn(
          `No reference tag hash present in URL: ${this.linkUi._urlInputValue()}`
        );
        return;
      }
      const { siteId: o } = u.source;
      let E = c[1];
      o && (E += `@${o}`), this.linkUi.previousLinkValue = this.linkUi._urlInputValue();
      const g = this.linkUi._urlInputValue().replace(c[0], E);
      R.urlInputView.fieldView.set("value", g), this._toggleSiteDropdownView();
    }), this.listenTo(i, "change:value", () => {
      this._toggleSiteDropdownView();
    }), this.listenTo(i, "input", () => {
      this._toggleSiteDropdownView();
    });
  }
  _toggleSiteDropdownView() {
    const R = this.linkUi._urlInputRefMatch(this.localizedRefHandleRE);
    if (R) {
      this.siteDropdownView.buttonView.set("isVisible", !0);
      let m = R[2] ? parseInt(R[2], 10) : null;
      m && typeof this.siteDropdownItemModels[m] > "u" && (m = null), this._selectSiteDropdownItem(m), this.siteDropdownView.buttonView.set("isVisible", !0);
    } else
      this.siteDropdownView.buttonView.set("isVisible", !1);
  }
  _selectSiteDropdownItem(R) {
    const m = this.siteDropdownItemModels[R ?? "current"], i = R ? Craft.t("ckeditor", "Site: {name}", { name: m.label }) : m.label;
    this.siteDropdownView.buttonView.set("label", i), Object.values(this.siteDropdownItemModels).forEach((u) => {
      u.set("isOn", u.siteId === m.siteId);
    });
  }
}
class yu extends ko {
  constructor(R, m = {}) {
    super(R);
    const i = this.bindTemplate;
    this.set("label", Craft.t("app", "Advanced")), this.linkUi = m.linkUi, this.editor = this.linkUi.editor, this.children = this.createCollection(), this.advancedChildren = this.createCollection(), this.setTemplate({
      tag: "details",
      attributes: {
        class: ["ck", "ck-form__details", "link-type-advanced"]
      },
      children: this.children
    }), this.summary = new ko(R), this.summary.setTemplate({
      tag: "summary",
      attributes: {
        class: ["ck", "ck-form__details__summary"]
      },
      children: [{ text: i.to("label") }]
    }), this.children.add(this.summary), this.advancedFieldsContainer = new ko(R), this.advancedFieldsContainer.setTemplate({
      tag: "div",
      attributes: {
        class: ["meta", "pane", "hairline"]
      },
      children: this.advancedChildren
    }), this.children.add(this.advancedFieldsContainer);
  }
  // this is needed so that the "Advanced" summary is focused when you tab into the details container
  focus() {
    this.summary.element.focus();
  }
  render() {
    super.render(), this.element.addEventListener("toggle", this.onToggle.bind(this));
  }
  // this is needed to control the focus order
  onToggle(R) {
    const { formView: m } = this.linkUi._linkUI;
    if (R.target.open) {
      const i = m._focusables.getIndex(this);
      this.advancedChildren._items.forEach((u, c) => {
        m._focusables.add(u, i + c + 1), m.focusTracker.add(u.element, i + c + 1);
      });
    } else
      this.advancedChildren._items.forEach((i, u) => {
        m._focusables.remove(i), m.focusTracker.remove(i.element);
      });
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class vu extends Vn {
  static get requires() {
    return [Xl];
  }
  static get pluginName() {
    return "CraftLinkUI";
  }
  constructor() {
    super(...arguments), this.linkTypeWrapperView = null, this.advancedView = null, this.elementInputView = null, this.sitesView = null, this.previousLinkValue = null, this.linkTypeDropdownView = null, this.linkTypeDropdownItemModels = [], this.elementTypeRefHandleRE = null, this.urlWithRefHandleRE = null, this.conversionData = [], this.linkOptions = [], this.advancedLinkFields = [], this.editor.config.define("linkOptions", []), this.editor.config.define("advancedLinkFields", []);
  }
  init() {
    const R = this.editor;
    this._linkUI = R.plugins.get(Xl), this._balloon = R.plugins.get(Xc), this.linkOptions = R.config.get("linkOptions"), this.advancedLinkFields = R.config.get("advancedLinkFields"), this.conversionData = this.advancedLinkFields.map((i) => i.conversion ?? null).filter((i) => i);
    const m = CKE_LOCALIZED_REF_HANDLES.join("|");
    this.elementTypeRefHandleRE = new RegExp(
      `(#((?:${m})):\\d+)`
    ), this.urlWithRefHandleRE = new RegExp(
      `(.+)(#((?:${m})):(\\d+))(?:@(\\d+))?`
    ), this._modifyFormViewTemplate(), this._balloon.on(
      "set:visibleView",
      (i, u, c, o) => {
        const { formView: E } = this._linkUI;
        c === o || c !== E || this._alignFocus();
      }
    );
  }
  /**
   * Reset focus order of the extra fields we're adding to the link form view
   */
  _alignFocus() {
    const { formView: R } = this._linkUI;
    let m = 0;
    this.linkTypeWrapperView && (this.linkTypeWrapperView._unboundChildren._items.forEach((i) => {
      R._focusables.has(i) && R._focusables.remove(i), R.focusTracker.remove(i.element), R._focusables.add(i, m), R.focusTracker.add(i.element, m), m++;
    }), this.advancedView !== null && (R._focusables.has(this.advancedView) && R._focusables.remove(this.advancedView), R.focusTracker.remove(this.advancedView), R._focusables.add(this.advancedView, m), R.focusTracker.add(this.advancedView.element, m)));
  }
  /**
   * Add all our custom fields (for element linking and advanced fields) to the link form view.
   */
  _modifyFormViewTemplate() {
    this._linkUI.formView || this._linkUI._createViews();
    const { formView: R } = this._linkUI;
    R.template.attributes.class.push(
      "ck-link-form_layout-vertical",
      "ck-vertical-form"
    ), this.linkOptions && this.linkOptions.length && this._linkOptionsDropdown(), this.advancedLinkFields && this.advancedLinkFields.length && this._advancedLinkFields();
  }
  /**
   * Get the value of the "default" URL input field.
   */
  _urlInputValue() {
    return this._linkUI.formView.urlInputView.fieldView.element.value;
  }
  /**
   * Returns whether the "default" URL input field value matched given regular expression.
   */
  _urlInputRefMatch(R) {
    return this._urlInputValue().match(R);
  }
  ////////////////////// Link Options Dropdown (link types) //////////////////////
  /**
   * Create a link type dropdown.
   */
  _linkOptionsDropdown() {
    const { formView: R } = this._linkUI, { urlInputView: m } = R, { fieldView: i } = m;
    this.linkTypeDropdownView = Ca(R.locale), this.linkTypeDropdownView.buttonView.set({
      label: "",
      withText: !0,
      isVisible: !0
    }), this.linkTypeDropdownItemModels = Object.fromEntries(
      this._getLinkListItemDefinitions().map((u) => [u.handle, u])
    ), Ta(
      this.linkTypeDropdownView,
      new Sa([
        ...this._getLinkListItemDefinitions().map((u) => ({
          type: "button",
          model: this.linkTypeDropdownItemModels[u.handle]
        }))
      ])
    ), i.isEmpty && this._showLinkTypeForm("default"), this.linkTypeDropdownView.on("execute", (u) => {
      if (u.source.linkOption) {
        const c = u.source.linkOption;
        this._selectLinkTypeDropdownItem(c.refHandle), this._showLinkTypeForm(c, R);
      } else
        this._selectLinkTypeDropdownItem("default"), this._showLinkTypeForm("default");
    }), this.listenTo(i, "change:value", () => {
      this._toggleLinkTypeDropdownView();
      const u = this._getLinkElementRefHandle();
      u ? this._showLinkTypeForm(
        this.linkTypeDropdownItemModels[u].linkOption
      ) : this._showLinkTypeForm("default");
    }), this.listenTo(i, "input", () => {
      this._toggleLinkTypeDropdownView();
    });
  }
  /**
   * Get the refHandle from the URL field value.
   */
  _getLinkElementRefHandle() {
    let R = null;
    const m = this._urlInputValue().match(this.elementTypeRefHandleRE);
    return m && (R = m[2], R && typeof this.linkTypeDropdownItemModels[R] > "u" && (R = null)), R;
  }
  /**
   * Get element ID from the URL field value.
   */
  _getLinkElementId() {
    let R = null;
    const m = this._urlInputRefMatch(this.urlWithRefHandleRE);
    return m && (R = m[4] ? parseInt(m[4], 10) : null), R;
  }
  /**
   * Get site ID from the URL field value.
   */
  _getLinkSiteId() {
    let R = null;
    const m = this._urlInputRefMatch(this.urlWithRefHandleRE);
    return m && (R = m[5] ? parseInt(m[5], 10) : null), R;
  }
  /**
   * Toggle between element link and default URL link fields.
   */
  _toggleLinkTypeDropdownView() {
    let R = this._getLinkElementRefHandle();
    R ? (this.linkTypeDropdownView.buttonView.set("isVisible", !0), this._selectLinkTypeDropdownItem(R)) : this._selectLinkTypeDropdownItem("default");
  }
  /**
   * Select link type from the dropdown.
   */
  _selectLinkTypeDropdownItem(R) {
    const m = this.linkTypeDropdownItemModels[R], i = R ? Craft.t("app", "{name}", { name: m.label }) : m.label;
    this.linkTypeDropdownView.buttonView.set("label", i), Object.values(this.linkTypeDropdownItemModels).forEach((u) => {
      u.set("isOn", u.handle === m.handle);
    });
  }
  /**
   * Get a list of all the options that should be shown in the link type dropdown.
   */
  _getLinkListItemDefinitions() {
    const R = [];
    for (const m of this.linkOptions)
      R.push(
        new Yo({
          label: m.label,
          handle: m.refHandle,
          linkOption: m,
          withText: !0
        })
      );
    return R.push(
      new Yo({
        label: Craft.t("app", "URL"),
        handle: "default",
        withText: !0
      })
    ), R;
  }
  /**
   * Place the link type fields in the form.
   */
  _showLinkTypeForm(R) {
    var E, g, b, y;
    const { formView: m } = this._linkUI, { children: i } = m, { urlInputView: u } = m, { displayedTextInputView: c } = m;
    c.focus(), this.linkTypeWrapperView !== null && i.remove(this.linkTypeWrapperView), R === "default" ? (this.elementInputView = u, this.sitesView !== null && (g = (E = this.sitesView) == null ? void 0 : E.siteDropdownView) != null && g.buttonView && this.sitesView.siteDropdownView.buttonView.set("isVisible", !1)) : (this.elementInputView = new gu(m.locale, {
      linkUi: this,
      linkOption: R,
      value: this._urlInputValue()
    }), this.sitesView !== null && (y = (b = this.sitesView) == null ? void 0 : b.siteDropdownView) != null && y.buttonView && this.sitesView.siteDropdownView.buttonView.set("isVisible", !0)), Craft.isMultiSite && this.sitesView == null && (this.sitesView = new bu(m.locale, {
      linkUi: this,
      linkOption: R,
      value: this._urlInputValue()
    }));
    let o = new ko();
    o.setTemplate({
      tag: "span",
      attributes: {
        class: ["break"]
      }
    }), this.linkTypeWrapperView = new ko(), this.linkTypeWrapperView.setTemplate({
      tag: "div",
      children: [
        this.linkTypeDropdownView,
        this.elementInputView,
        o,
        this.sitesView
      ],
      attributes: {
        class: [
          "ck",
          "ck-form__row",
          "ck-form__row_large-top-padding",
          "link-type-group",
          "flex"
        ]
      }
    }), i.add(this.linkTypeWrapperView, 2);
  }
  /**
   * Show element selector modal for given element type (link option).
   */
  _showElementSelectorModal(R) {
    const m = this.editor, i = m.model, u = i.document.selection, c = u.isCollapsed, o = u.getFirstRange(), E = this._linkUI._getSelectedLinkElement(), g = () => {
      m.editing.view.focus(), !c && o && i.change((b) => {
        b.setSelection(o);
      }), this._linkUI._hideFakeVisualSelection();
    };
    E || this._linkUI._showFakeVisualSelection(), Craft.createElementSelectorModal(R.elementType, {
      storageKey: `ckeditor:${this.pluginName}:${R.elementType}`,
      sources: R.sources,
      criteria: R.criteria,
      defaultSiteId: m.config.get("elementSiteId"),
      autoFocusSearchBox: !1,
      onSelect: (b) => {
        if (b.length) {
          const y = b[0], v = `${y.url}#${R.refHandle}:${y.id}@${y.siteId}`;
          if (m.editing.view.focus(), (!c || E) && o) {
            i.change((N) => {
              N.setSelection(o);
            });
            const C = m.commands.get("link");
            let x = this._getAdvancedFieldValues();
            C.execute(v, x);
          } else
            i.change((C) => {
              let x = this._getAdvancedFieldValues();
              if (C.insertText(
                y.label,
                {
                  linkHref: v
                },
                u.getFirstPosition(),
                x
              ), o instanceof Zc)
                try {
                  const N = o.clone();
                  N.end.path[1] += y.label.length, C.setSelection(N);
                } catch {
                }
            });
          setTimeout(() => {
            this._linkUI._addToolbarView(), this._linkUI._balloon.showStack("main"), this._linkUI._addFormView(), this._linkUI._startUpdatingUI();
          }, 100);
        } else
          g();
      },
      onCancel: () => {
        g();
      },
      closeOtherModals: !1
    });
  }
  ////////////////////// Advanced Link Fields //////////////////////
  /**
   * Set up advanced link field.
   */
  _advancedLinkFields() {
    this._addAdvancedLinkFieldInputs(), this._handleAdvancedLinkFieldsFormSubmit(), this._trackAdvancedLinkFieldsValueChange();
  }
  /**
   * Create advanced link field inputs and add them to the link form view.
   */
  _addAdvancedLinkFieldInputs() {
    var u;
    const R = this.editor.commands.get("link"), { formView: m } = this._linkUI, { children: i } = m;
    this.advancedView = new yu(m.locale, {
      linkUi: this
    }), i.add(this.advancedView, 3);
    for (const c of this.advancedLinkFields) {
      let o = (u = c.conversion) == null ? void 0 : u.model;
      if (o && typeof m[o] > "u")
        if (c.conversion.type === "bool") {
          const E = new Jc();
          E.set({
            withText: !0,
            label: c.label,
            isToggleable: !0
          }), c.tooltip && (E.tooltip = c.tooltip), this.advancedView.advancedChildren.add(E), m[o] = E, m[o].bind("isOn").to(R, o, (g) => g === void 0 ? (m[o].element.value = "", !1) : (m[o].element.value = c.conversion.value, !0)), E.on("execute", () => {
            E.isOn ? (E.isOn = !1, m[o].element.value = "") : (E.isOn = !0, m[o].element.value = c.conversion.value);
          });
        } else {
          let E = this._addLabeledField(c);
          m[o] = E, m[o].fieldView.bind("value").to(R, o), m[o].fieldView.element.value = R[o] || "";
        }
      else if (c.value === "urlSuffix") {
        let E = this._addLabeledField(c);
        this.listenTo(
          E.fieldView,
          "change:isFocused",
          (g, b, y, v) => {
            if (y !== v && !y) {
              let C = g.source.element.value, x = null;
              const N = this._urlInputRefMatch(this.urlWithRefHandleRE);
              N ? x = N[1] : x = this._urlInputValue();
              try {
                let G = new URL(x), K = G.search, j = G.hash, V = x.replace(j, "").replace(K, "");
                const P = this._urlInputValue().replace(
                  x,
                  V + C
                );
                m.urlInputView.fieldView.set("value", P);
              } catch {
                let [K, j] = x.split("#"), [V, P] = K.split("?");
                const M = this._urlInputValue().replace(
                  x,
                  V + C
                );
                m.urlInputView.fieldView.set("value", M);
              }
            }
          }
        ), this.listenTo(m.urlInputView.fieldView, "change:value", (g) => {
          this._toggleUrlSuffixInputView(E, g.source.isEmpty);
        }), this.listenTo(
          m.urlInputView.fieldView,
          "change:isFocused",
          (g) => {
            this._toggleUrlSuffixInputView(E, g.source.isEmpty);
          }
        );
      }
    }
  }
  /**
   * Create a labeled field for given advanced field.
   */
  _addLabeledField(R) {
    const { formView: m } = this._linkUI;
    let i = new eu(
      m.locale,
      tu
    );
    return i.label = R.label, R.tooltip && (i.infoText = R.tooltip), this.advancedView.advancedChildren.add(i), i;
  }
  /**
   * Populate URL suffix advanced field with content.
   * e.g. if a query string was added directly to the default URL input field,
   * ensure the value is also showing in the URL Suffix advanced field.
   */
  _toggleUrlSuffixInputView(R, m) {
    if (m)
      R.fieldView.set("value", "");
    else {
      const i = this._urlInputRefMatch(this.urlWithRefHandleRE);
      let u = null;
      i ? u = i[1] : u = this._urlInputValue();
      try {
        let c = new URL(u), o = c.search, E = c.hash;
        R.fieldView.set("value", o + E);
      } catch {
        let [o, E] = u.split("#"), [g, b] = o.split("?");
        E = E ? "#" + E : "", b = b ? "?" + b : "", R.fieldView.set("value", b + E);
      }
    }
  }
  /**
   * When link form is submitted, pass the advanced field values the link command.
   */
  _handleAdvancedLinkFieldsFormSubmit() {
    const m = this.editor.commands.get("link"), { formView: i } = this._linkUI;
    i.on(
      "submit",
      () => {
        let u = this._getAdvancedFieldValues();
        m.once(
          "execute",
          (c, o) => {
            o.length === 4 ? Object.assign(o[3], u) : o.push(u);
          },
          { priority: "highest" }
        );
      },
      { priority: "high" }
    );
  }
  /**
   * Update the link command when the advanced field value changes.
   */
  _trackAdvancedLinkFieldsValueChange() {
    const R = this.editor, m = R.commands.get("link"), i = R.model.document.selection;
    this.conversionData.forEach((u) => {
      m.set(u.model, null), R.model.document.on("change", () => {
        m[u.model] = i.getAttribute(u.model);
      });
    });
  }
  /**
   * Get the values of all the advanced fields.
   */
  _getAdvancedFieldValues() {
    const { formView: R } = this._linkUI;
    let m = {};
    return this.conversionData.forEach((i) => {
      let u = [];
      i.type === "bool" ? u[i.model] = R[i.model].element.value : u[i.model] = R[i.model].fieldView.element.value, Object.assign(m, u);
    }), m;
  }
}
class Du extends Vn {
  static get requires() {
    return [mu, vu];
  }
  static get pluginName() {
    return "CraftLink";
  }
}
function wu(xe) {
  return xe && xe.__esModule && Object.prototype.hasOwnProperty.call(xe, "default") ? xe.default : xe;
}
var Ts = { exports: {} };
/*! For license information please see inspector.js.LICENSE.txt */
var Zl;
function ku() {
  return Zl || (Zl = 1, function(xe, R) {
    (function(m, i) {
      xe.exports = i();
    })(window, function() {
      return function(m) {
        var i = {};
        function u(c) {
          if (i[c]) return i[c].exports;
          var o = i[c] = { i: c, l: !1, exports: {} };
          return m[c].call(o.exports, o, o.exports, u), o.l = !0, o.exports;
        }
        return u.m = m, u.c = i, u.d = function(c, o, E) {
          u.o(c, o) || Object.defineProperty(c, o, { enumerable: !0, get: E });
        }, u.r = function(c) {
          typeof Symbol < "u" && Symbol.toStringTag && Object.defineProperty(c, Symbol.toStringTag, { value: "Module" }), Object.defineProperty(c, "__esModule", { value: !0 });
        }, u.t = function(c, o) {
          if (1 & o && (c = u(c)), 8 & o || 4 & o && typeof c == "object" && c && c.__esModule) return c;
          var E = /* @__PURE__ */ Object.create(null);
          if (u.r(E), Object.defineProperty(E, "default", { enumerable: !0, value: c }), 2 & o && typeof c != "string") for (var g in c) u.d(E, g, (function(b) {
            return c[b];
          }).bind(null, g));
          return E;
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
      }([function(m, i, u) {
        m.exports = u(21);
      }, function(m, i, u) {
        u.d(i, "a", function() {
          return o;
        }), u.d(i, "b", function() {
          return E;
        }), u.d(i, "c", function() {
          return g;
        });
        var c = u(19);
        function o(y, v = !0) {
          if (y === void 0) return "undefined";
          if (typeof y == "function") return "function() {…}";
          const C = Object(c.stringify)(y, b, null, { maxDepth: 2 });
          return v ? C : C.replace(/(^"|"$)/g, "");
        }
        function E(y) {
          const v = {};
          for (const C in y) v[C] = y[C], v[C].value = o(v[C].value);
          return v;
        }
        function g(y, v) {
          return y.length > v ? y.substr(0, v) + `… [${y.length - v} characters left]` : y;
        }
        function b(y, v, C) {
          return typeof y == "string" ? `"${y.replace("'", '"')}"` : C(y);
        }
      }, function(m, i, u) {
        function c(N) {
          return N && N.name;
        }
        function o(N) {
          return N && c(N) && N.is("attributeElement");
        }
        function E(N) {
          return N && c(N) && N.is("emptyElement");
        }
        function g(N) {
          return N && c(N) && N.is("uiElement");
        }
        function b(N) {
          return N && c(N) && N.is("rawElement");
        }
        function y(N) {
          return N && c(N) && N.is("editableElement");
        }
        function v(N) {
          return N && N.is("rootElement");
        }
        function C(N) {
          return { path: [...N.parent.getPath(), N.offset], offset: N.offset, isAtEnd: N.isAtEnd, isAtStart: N.isAtStart, parent: x(N.parent) };
        }
        function x(N) {
          return c(N) ? o(N) ? "attribute:" + N.name : v(N) ? "root:" + N.name : "container:" + N.name : N.data;
        }
        u.d(i, "d", function() {
          return c;
        }), u.d(i, "b", function() {
          return o;
        }), u.d(i, "e", function() {
          return E;
        }), u.d(i, "h", function() {
          return g;
        }), u.d(i, "f", function() {
          return b;
        }), u.d(i, "c", function() {
          return y;
        }), u.d(i, "g", function() {
          return v;
        }), u.d(i, "a", function() {
          return C;
        });
      }, function(m, i, u) {
        u.d(i, "a", function() {
          return c;
        });
        class c {
          static group(...E) {
            console.group(...E);
          }
          static groupEnd(...E) {
            console.groupEnd(...E);
          }
          static log(...E) {
            console.log(...E);
          }
          static warn(...E) {
            console.warn(...E);
          }
        }
      }, function(m, i, u) {
        function c(b) {
          return b && b.is("element");
        }
        function o(b) {
          return b && b.is("rootElement");
        }
        function E(b) {
          return b.getPath ? b.getPath() : b.path;
        }
        function g(b) {
          return { path: E(b), stickiness: b.stickiness, index: b.index, isAtEnd: b.isAtEnd, isAtStart: b.isAtStart, offset: b.offset, textNode: b.textNode && b.textNode.data };
        }
        u.d(i, "c", function() {
          return c;
        }), u.d(i, "d", function() {
          return o;
        }), u.d(i, "b", function() {
          return E;
        }), u.d(i, "a", function() {
          return g;
        });
      }, function(m, i, u) {
        (function(c, o) {
          var E = "[object Arguments]", g = "[object Map]", b = "[object Object]", y = "[object Set]", v = /^\[object .+?Constructor\]$/, C = /^(?:0|[1-9]\d*)$/, x = {};
          x["[object Float32Array]"] = x["[object Float64Array]"] = x["[object Int8Array]"] = x["[object Int16Array]"] = x["[object Int32Array]"] = x["[object Uint8Array]"] = x["[object Uint8ClampedArray]"] = x["[object Uint16Array]"] = x["[object Uint32Array]"] = !0, x[E] = x["[object Array]"] = x["[object ArrayBuffer]"] = x["[object Boolean]"] = x["[object DataView]"] = x["[object Date]"] = x["[object Error]"] = x["[object Function]"] = x[g] = x["[object Number]"] = x[b] = x["[object RegExp]"] = x[y] = x["[object String]"] = x["[object WeakMap]"] = !1;
          var N = typeof c == "object" && c && c.Object === Object && c, G = typeof self == "object" && self && self.Object === Object && self, K = N || G || Function("return this")(), j = i && !i.nodeType && i, V = j && typeof o == "object" && o && !o.nodeType && o, P = V && V.exports === j, M = P && N.process, B = function() {
            try {
              return M && M.binding && M.binding("util");
            } catch {
            }
          }(), I = B && B.isTypedArray;
          function oe(W, ae) {
            for (var we = -1, Ce = W == null ? 0 : W.length; ++we < Ce; ) if (ae(W[we], we, W)) return !0;
            return !1;
          }
          function Q(W) {
            var ae = -1, we = Array(W.size);
            return W.forEach(function(Ce, it) {
              we[++ae] = [it, Ce];
            }), we;
          }
          function z(W) {
            var ae = -1, we = Array(W.size);
            return W.forEach(function(Ce) {
              we[++ae] = Ce;
            }), we;
          }
          var A, se, le, te = Array.prototype, ce = Function.prototype, ye = Object.prototype, J = K["__core-js_shared__"], de = ce.toString, D = ye.hasOwnProperty, ie = (A = /[^.]+$/.exec(J && J.keys && J.keys.IE_PROTO || "")) ? "Symbol(src)_1." + A : "", be = ye.toString, Te = RegExp("^" + de.call(D).replace(/[\\^$.*+?()[\]{}|]/g, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"), ke = P ? K.Buffer : void 0, Pe = K.Symbol, Se = K.Uint8Array, ze = ye.propertyIsEnumerable, Je = te.splice, X = Pe ? Pe.toStringTag : void 0, Y = Object.getOwnPropertySymbols, me = ke ? ke.isBuffer : void 0, l = (se = Object.keys, le = Object, function(W) {
            return se(le(W));
          }), f = gn(K, "DataView"), k = gn(K, "Map"), U = gn(K, "Promise"), F = gn(K, "Set"), H = gn(K, "WeakMap"), he = gn(Object, "create"), je = bn(f), Re = bn(k), Xe = bn(U), We = bn(F), It = bn(H), wt = Pe ? Pe.prototype : void 0, Jt = wt ? wt.valueOf : void 0;
          function kt(W) {
            var ae = -1, we = W == null ? 0 : W.length;
            for (this.clear(); ++ae < we; ) {
              var Ce = W[ae];
              this.set(Ce[0], Ce[1]);
            }
          }
          function gt(W) {
            var ae = -1, we = W == null ? 0 : W.length;
            for (this.clear(); ++ae < we; ) {
              var Ce = W[ae];
              this.set(Ce[0], Ce[1]);
            }
          }
          function cn(W) {
            var ae = -1, we = W == null ? 0 : W.length;
            for (this.clear(); ++ae < we; ) {
              var Ce = W[ae];
              this.set(Ce[0], Ce[1]);
            }
          }
          function _r(W) {
            var ae = -1, we = W == null ? 0 : W.length;
            for (this.__data__ = new cn(); ++ae < we; ) this.add(W[ae]);
          }
          function Tt(W) {
            var ae = this.__data__ = new gt(W);
            this.size = ae.size;
          }
          function pt(W, ae) {
            var we = ar(W), Ce = !we && ir(W), it = !we && !Ce && Cn(W), qe = !we && !Ce && !it && Gr(W), st = we || Ce || it || qe, tt = st ? function(bt, Pt) {
              for (var tn = -1, ht = Array(bt); ++tn < bt; ) ht[tn] = Pt(tn);
              return ht;
            }(W.length, String) : [], Ot = tt.length;
            for (var nt in W) !D.call(W, nt) || st && (nt == "length" || it && (nt == "offset" || nt == "parent") || qe && (nt == "buffer" || nt == "byteLength" || nt == "byteOffset") || Cr(nt, Ot)) || tt.push(nt);
            return tt;
          }
          function Yn(W, ae) {
            for (var we = W.length; we--; ) if (Tr(W[we][0], ae)) return we;
            return -1;
          }
          function Sn(W) {
            return W == null ? W === void 0 ? "[object Undefined]" : "[object Null]" : X && X in Object(W) ? function(ae) {
              var we = D.call(ae, X), Ce = ae[X];
              try {
                ae[X] = void 0;
                var it = !0;
              } catch {
              }
              var qe = be.call(ae);
              return it && (we ? ae[X] = Ce : delete ae[X]), qe;
            }(W) : function(ae) {
              return be.call(ae);
            }(W);
          }
          function or(W) {
            return On(W) && Sn(W) == E;
          }
          function Er(W, ae, we, Ce, it) {
            return W === ae || (W == null || ae == null || !On(W) && !On(ae) ? W != W && ae != ae : function(qe, st, tt, Ot, nt, bt) {
              var Pt = ar(qe), tn = ar(st), ht = Pt ? "[object Array]" : ut(qe), Bt = tn ? "[object Array]" : ut(st), Pn = (ht = ht == E ? b : ht) == b, ct = (Bt = Bt == E ? b : Bt) == b, yn = ht == Bt;
              if (yn && Cn(qe)) {
                if (!Cn(st)) return !1;
                Pt = !0, Pn = !1;
              }
              if (yn && !Pn) return bt || (bt = new Tt()), Pt || Gr(qe) ? Yt(qe, st, tt, Ot, nt, bt) : function(rt, Ue, qn, Kt, Or, At, nn) {
                switch (qn) {
                  case "[object DataView]":
                    if (rt.byteLength != Ue.byteLength || rt.byteOffset != Ue.byteOffset) return !1;
                    rt = rt.buffer, Ue = Ue.buffer;
                  case "[object ArrayBuffer]":
                    return !(rt.byteLength != Ue.byteLength || !At(new Se(rt), new Se(Ue)));
                  case "[object Boolean]":
                  case "[object Date]":
                  case "[object Number]":
                    return Tr(+rt, +Ue);
                  case "[object Error]":
                    return rt.name == Ue.name && rt.message == Ue.message;
                  case "[object RegExp]":
                  case "[object String]":
                    return rt == Ue + "";
                  case g:
                    var Ht = Q;
                  case y:
                    var Qt = 1 & Kt;
                    if (Ht || (Ht = z), rt.size != Ue.size && !Qt) return !1;
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
                var un = Pn && D.call(qe, "__wrapped__"), Nn = ct && D.call(st, "__wrapped__");
                if (un || Nn) {
                  var Eo = un ? qe.value() : qe, xo = Nn ? st.value() : st;
                  return bt || (bt = new Tt()), nt(Eo, xo, tt, Ot, bt);
                }
              }
              return yn ? (bt || (bt = new Tt()), function(rt, Ue, qn, Kt, Or, At) {
                var nn = 1 & qn, Ht = xr(rt), Qt = Ht.length, cr = xr(Ue).length;
                if (Qt != cr && !nn) return !1;
                for (var Dn = Qt; Dn--; ) {
                  var rn = Ht[Dn];
                  if (!(nn ? rn in Ue : D.call(Ue, rn))) return !1;
                }
                var yt = At.get(rt);
                if (yt && At.get(Ue)) return yt == Ue;
                var _t = !0;
                At.set(rt, Ue), At.set(Ue, rt);
                for (var ur = nn; ++Dn < Qt; ) {
                  rn = Ht[Dn];
                  var dr = rt[rn], vn = Ue[rn];
                  if (Kt) var Ut = nn ? Kt(vn, dr, rn, Ue, rt, At) : Kt(dr, vn, rn, rt, Ue, At);
                  if (!(Ut === void 0 ? dr === vn || Or(dr, vn, qn, Kt, At) : Ut)) {
                    _t = !1;
                    break;
                  }
                  ur || (ur = rn == "constructor");
                }
                if (_t && !ur) {
                  var Wt = rt.constructor, on = Ue.constructor;
                  Wt == on || !("constructor" in rt) || !("constructor" in Ue) || typeof Wt == "function" && Wt instanceof Wt && typeof on == "function" && on instanceof on || (_t = !1);
                }
                return At.delete(rt), At.delete(Ue), _t;
              }(qe, st, tt, Ot, nt, bt)) : !1;
            }(W, ae, we, Ce, Er, it));
          }
          function _o(W) {
            return !(!lr(W) || function(ae) {
              return !!ie && ie in ae;
            }(W)) && (sr(W) ? Te : v).test(bn(W));
          }
          function en(W) {
            if (we = (ae = W) && ae.constructor, Ce = typeof we == "function" && we.prototype || ye, ae !== Ce) return l(W);
            var ae, we, Ce, it = [];
            for (var qe in Object(W)) D.call(W, qe) && qe != "constructor" && it.push(qe);
            return it;
          }
          function Yt(W, ae, we, Ce, it, qe) {
            var st = 1 & we, tt = W.length, Ot = ae.length;
            if (tt != Ot && !(st && Ot > tt)) return !1;
            var nt = qe.get(W);
            if (nt && qe.get(ae)) return nt == ae;
            var bt = -1, Pt = !0, tn = 2 & we ? new _r() : void 0;
            for (qe.set(W, ae), qe.set(ae, W); ++bt < tt; ) {
              var ht = W[bt], Bt = ae[bt];
              if (Ce) var Pn = st ? Ce(Bt, ht, bt, ae, W, qe) : Ce(ht, Bt, bt, W, ae, qe);
              if (Pn !== void 0) {
                if (Pn) continue;
                Pt = !1;
                break;
              }
              if (tn) {
                if (!oe(ae, function(ct, yn) {
                  if (un = yn, !tn.has(un) && (ht === ct || it(ht, ct, we, Ce, qe))) return tn.push(yn);
                  var un;
                })) {
                  Pt = !1;
                  break;
                }
              } else if (ht !== Bt && !it(ht, Bt, we, Ce, qe)) {
                Pt = !1;
                break;
              }
            }
            return qe.delete(W), qe.delete(ae), Pt;
          }
          function xr(W) {
            return function(ae, we, Ce) {
              var it = we(ae);
              return ar(ae) ? it : function(qe, st) {
                for (var tt = -1, Ot = st.length, nt = qe.length; ++tt < Ot; ) qe[nt + tt] = st[tt];
                return qe;
              }(it, Ce(ae));
            }(W, Xr, Sr);
          }
          function qt(W, ae) {
            var we, Ce, it = W.__data__;
            return ((Ce = typeof (we = ae)) == "string" || Ce == "number" || Ce == "symbol" || Ce == "boolean" ? we !== "__proto__" : we === null) ? it[typeof ae == "string" ? "string" : "hash"] : it.map;
          }
          function gn(W, ae) {
            var we = function(Ce, it) {
              return Ce == null ? void 0 : Ce[it];
            }(W, ae);
            return _o(we) ? we : void 0;
          }
          kt.prototype.clear = function() {
            this.__data__ = he ? he(null) : {}, this.size = 0;
          }, kt.prototype.delete = function(W) {
            var ae = this.has(W) && delete this.__data__[W];
            return this.size -= ae ? 1 : 0, ae;
          }, kt.prototype.get = function(W) {
            var ae = this.__data__;
            if (he) {
              var we = ae[W];
              return we === "__lodash_hash_undefined__" ? void 0 : we;
            }
            return D.call(ae, W) ? ae[W] : void 0;
          }, kt.prototype.has = function(W) {
            var ae = this.__data__;
            return he ? ae[W] !== void 0 : D.call(ae, W);
          }, kt.prototype.set = function(W, ae) {
            var we = this.__data__;
            return this.size += this.has(W) ? 0 : 1, we[W] = he && ae === void 0 ? "__lodash_hash_undefined__" : ae, this;
          }, gt.prototype.clear = function() {
            this.__data__ = [], this.size = 0;
          }, gt.prototype.delete = function(W) {
            var ae = this.__data__, we = Yn(ae, W);
            return !(we < 0) && (we == ae.length - 1 ? ae.pop() : Je.call(ae, we, 1), --this.size, !0);
          }, gt.prototype.get = function(W) {
            var ae = this.__data__, we = Yn(ae, W);
            return we < 0 ? void 0 : ae[we][1];
          }, gt.prototype.has = function(W) {
            return Yn(this.__data__, W) > -1;
          }, gt.prototype.set = function(W, ae) {
            var we = this.__data__, Ce = Yn(we, W);
            return Ce < 0 ? (++this.size, we.push([W, ae])) : we[Ce][1] = ae, this;
          }, cn.prototype.clear = function() {
            this.size = 0, this.__data__ = { hash: new kt(), map: new (k || gt)(), string: new kt() };
          }, cn.prototype.delete = function(W) {
            var ae = qt(this, W).delete(W);
            return this.size -= ae ? 1 : 0, ae;
          }, cn.prototype.get = function(W) {
            return qt(this, W).get(W);
          }, cn.prototype.has = function(W) {
            return qt(this, W).has(W);
          }, cn.prototype.set = function(W, ae) {
            var we = qt(this, W), Ce = we.size;
            return we.set(W, ae), this.size += we.size == Ce ? 0 : 1, this;
          }, _r.prototype.add = _r.prototype.push = function(W) {
            return this.__data__.set(W, "__lodash_hash_undefined__"), this;
          }, _r.prototype.has = function(W) {
            return this.__data__.has(W);
          }, Tt.prototype.clear = function() {
            this.__data__ = new gt(), this.size = 0;
          }, Tt.prototype.delete = function(W) {
            var ae = this.__data__, we = ae.delete(W);
            return this.size = ae.size, we;
          }, Tt.prototype.get = function(W) {
            return this.__data__.get(W);
          }, Tt.prototype.has = function(W) {
            return this.__data__.has(W);
          }, Tt.prototype.set = function(W, ae) {
            var we = this.__data__;
            if (we instanceof gt) {
              var Ce = we.__data__;
              if (!k || Ce.length < 199) return Ce.push([W, ae]), this.size = ++we.size, this;
              we = this.__data__ = new cn(Ce);
            }
            return we.set(W, ae), this.size = we.size, this;
          };
          var Sr = Y ? function(W) {
            return W == null ? [] : (W = Object(W), function(ae, we) {
              for (var Ce = -1, it = ae == null ? 0 : ae.length, qe = 0, st = []; ++Ce < it; ) {
                var tt = ae[Ce];
                we(tt, Ce, ae) && (st[qe++] = tt);
              }
              return st;
            }(Y(W), function(ae) {
              return ze.call(W, ae);
            }));
          } : function() {
            return [];
          }, ut = Sn;
          function Cr(W, ae) {
            return !!(ae = ae ?? 9007199254740991) && (typeof W == "number" || C.test(W)) && W > -1 && W % 1 == 0 && W < ae;
          }
          function bn(W) {
            if (W != null) {
              try {
                return de.call(W);
              } catch {
              }
              try {
                return W + "";
              } catch {
              }
            }
            return "";
          }
          function Tr(W, ae) {
            return W === ae || W != W && ae != ae;
          }
          (f && ut(new f(new ArrayBuffer(1))) != "[object DataView]" || k && ut(new k()) != g || U && ut(U.resolve()) != "[object Promise]" || F && ut(new F()) != y || H && ut(new H()) != "[object WeakMap]") && (ut = function(W) {
            var ae = Sn(W), we = ae == b ? W.constructor : void 0, Ce = we ? bn(we) : "";
            if (Ce) switch (Ce) {
              case je:
                return "[object DataView]";
              case Re:
                return g;
              case Xe:
                return "[object Promise]";
              case We:
                return y;
              case It:
                return "[object WeakMap]";
            }
            return ae;
          });
          var ir = or(/* @__PURE__ */ function() {
            return arguments;
          }()) ? or : function(W) {
            return On(W) && D.call(W, "callee") && !ze.call(W, "callee");
          }, ar = Array.isArray, Cn = me || function() {
            return !1;
          };
          function sr(W) {
            if (!lr(W)) return !1;
            var ae = Sn(W);
            return ae == "[object Function]" || ae == "[object GeneratorFunction]" || ae == "[object AsyncFunction]" || ae == "[object Proxy]";
          }
          function Tn(W) {
            return typeof W == "number" && W > -1 && W % 1 == 0 && W <= 9007199254740991;
          }
          function lr(W) {
            var ae = typeof W;
            return W != null && (ae == "object" || ae == "function");
          }
          function On(W) {
            return W != null && typeof W == "object";
          }
          var Gr = I ? /* @__PURE__ */ function(W) {
            return function(ae) {
              return W(ae);
            };
          }(I) : function(W) {
            return On(W) && Tn(W.length) && !!x[Sn(W)];
          };
          function Xr(W) {
            return (ae = W) != null && Tn(ae.length) && !sr(ae) ? pt(W) : en(W);
            var ae;
          }
          o.exports = function(W, ae) {
            return Er(W, ae);
          };
        }).call(this, u(15), u(33)(m));
      }, function(m, i, u) {
        var c, o = function() {
          return c === void 0 && (c = !!(window && document && document.all && !window.atob)), c;
        }, E = /* @__PURE__ */ function() {
          var P = {};
          return function(M) {
            if (P[M] === void 0) {
              var B = document.querySelector(M);
              if (window.HTMLIFrameElement && B instanceof window.HTMLIFrameElement) try {
                B = B.contentDocument.head;
              } catch {
                B = null;
              }
              P[M] = B;
            }
            return P[M];
          };
        }(), g = [];
        function b(P) {
          for (var M = -1, B = 0; B < g.length; B++) if (g[B].identifier === P) {
            M = B;
            break;
          }
          return M;
        }
        function y(P, M) {
          for (var B = {}, I = [], oe = 0; oe < P.length; oe++) {
            var Q = P[oe], z = M.base ? Q[0] + M.base : Q[0], A = B[z] || 0, se = "".concat(z, " ").concat(A);
            B[z] = A + 1;
            var le = b(se), te = { css: Q[1], media: Q[2], sourceMap: Q[3] };
            le !== -1 ? (g[le].references++, g[le].updater(te)) : g.push({ identifier: se, updater: V(te, M), references: 1 }), I.push(se);
          }
          return I;
        }
        function v(P) {
          var M = document.createElement("style"), B = P.attributes || {};
          if (B.nonce === void 0) {
            var I = u.nc;
            I && (B.nonce = I);
          }
          if (Object.keys(B).forEach(function(Q) {
            M.setAttribute(Q, B[Q]);
          }), typeof P.insert == "function") P.insert(M);
          else {
            var oe = E(P.insert || "head");
            if (!oe) throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");
            oe.appendChild(M);
          }
          return M;
        }
        var C, x = (C = [], function(P, M) {
          return C[P] = M, C.filter(Boolean).join(`
`);
        });
        function N(P, M, B, I) {
          var oe = B ? "" : I.media ? "@media ".concat(I.media, " {").concat(I.css, "}") : I.css;
          if (P.styleSheet) P.styleSheet.cssText = x(M, oe);
          else {
            var Q = document.createTextNode(oe), z = P.childNodes;
            z[M] && P.removeChild(z[M]), z.length ? P.insertBefore(Q, z[M]) : P.appendChild(Q);
          }
        }
        function G(P, M, B) {
          var I = B.css, oe = B.media, Q = B.sourceMap;
          if (oe ? P.setAttribute("media", oe) : P.removeAttribute("media"), Q && typeof btoa < "u" && (I += `
/*# sourceMappingURL=data:application/json;base64,`.concat(btoa(unescape(encodeURIComponent(JSON.stringify(Q)))), " */")), P.styleSheet) P.styleSheet.cssText = I;
          else {
            for (; P.firstChild; ) P.removeChild(P.firstChild);
            P.appendChild(document.createTextNode(I));
          }
        }
        var K = null, j = 0;
        function V(P, M) {
          var B, I, oe;
          if (M.singleton) {
            var Q = j++;
            B = K || (K = v(M)), I = N.bind(null, B, Q, !1), oe = N.bind(null, B, Q, !0);
          } else B = v(M), I = G.bind(null, B, M), oe = function() {
            (function(z) {
              if (z.parentNode === null) return !1;
              z.parentNode.removeChild(z);
            })(B);
          };
          return I(P), function(z) {
            if (z) {
              if (z.css === P.css && z.media === P.media && z.sourceMap === P.sourceMap) return;
              I(P = z);
            } else oe();
          };
        }
        m.exports = function(P, M) {
          (M = M || {}).singleton || typeof M.singleton == "boolean" || (M.singleton = o());
          var B = y(P = P || [], M);
          return function(I) {
            if (I = I || [], Object.prototype.toString.call(I) === "[object Array]") {
              for (var oe = 0; oe < B.length; oe++) {
                var Q = b(B[oe]);
                g[Q].references--;
              }
              for (var z = y(I, M), A = 0; A < B.length; A++) {
                var se = b(B[A]);
                g[se].references === 0 && (g[se].updater(), g.splice(se, 1));
              }
              B = z;
            }
          };
        };
      }, function(m, i, u) {
        m.exports = function(c) {
          var o = [];
          return o.toString = function() {
            return this.map(function(E) {
              var g = function(b, y) {
                var v = b[1] || "", C = b[3];
                if (!C) return v;
                if (y && typeof btoa == "function") {
                  var x = (G = C, "/*# sourceMappingURL=data:application/json;charset=utf-8;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(G)))) + " */"), N = C.sources.map(function(K) {
                    return "/*# sourceURL=" + C.sourceRoot + K + " */";
                  });
                  return [v].concat(N).concat([x]).join(`
`);
                }
                var G;
                return [v].join(`
`);
              }(E, c);
              return E[2] ? "@media " + E[2] + "{" + g + "}" : g;
            }).join("");
          }, o.i = function(E, g) {
            typeof E == "string" && (E = [[null, E, ""]]);
            for (var b = {}, y = 0; y < this.length; y++) {
              var v = this[y][0];
              v != null && (b[v] = !0);
            }
            for (y = 0; y < E.length; y++) {
              var C = E[y];
              C[0] != null && b[C[0]] || (g && !C[2] ? C[2] = g : g && (C[2] = "(" + C[2] + ") and (" + g + ")"), o.push(C));
            }
          }, o;
        };
      }, function(m, i, u) {
        u.d(i, "c", function() {
          return E;
        }), u.d(i, "b", function() {
          return g;
        }), u.d(i, "a", function() {
          return b;
        });
        var c = u(3);
        let o = 0;
        function E(y) {
          const v = { editors: {}, options: {} };
          if (typeof y[0] == "string") c.a.warn(`[CKEditorInspector] The CKEditorInspector.attach( '${y[0]}', editor ) syntax has been deprecated and will be removed in the near future. To pass a name of an editor instance, use CKEditorInspector.attach( { '${y[0]}': editor } ) instead. Learn more in https://github.com/ckeditor/ckeditor5-inspector/blob/master/README.md.`), v.editors[y[0]] = y[1];
          else {
            if ((C = y[0]).model && C.editing) v.editors["editor-" + ++o] = y[0];
            else for (const x in y[0]) v.editors[x] = y[0][x];
            v.options = y[1] || v.options;
          }
          var C;
          return v;
        }
        function g(y) {
          return [...y][0][0] || "";
        }
        function b(y, v) {
          const C = Math.min(y.length, v.length);
          for (let x = 0; x < C; x++) if (y[x] != v[x]) return x;
          return y.length == v.length ? "same" : y.length < v.length ? "prefix" : "extension";
        }
      }, function(m, i, u) {
        u.d(i, "a", function() {
          return g;
        }), u.d(i, "d", function() {
          return v;
        }), u.d(i, "c", function() {
          return C;
        }), u.d(i, "e", function() {
          return x;
        }), u.d(i, "b", function() {
          return N;
        });
        var c = u(2), o = u(8), E = u(1);
        const g = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_view", b = `&lt;!--The View UI element content has been skipped. <a href="${g}_uielement-UIElement.html" target="_blank">Find out why</a>. --&gt;`, y = `&lt;!--The View raw element content has been skipped. <a href="${g}_rawelement-RawElement.html" target="_blank">Find out why</a>. --&gt;`;
        function v(P) {
          return P ? [...P.editing.view.document.roots] : [];
        }
        function C(P, M) {
          if (!P) return [];
          const B = [], I = P.editing.view.document.selection;
          for (const oe of I.getRanges()) oe.root.rootName === M && B.push({ type: "selection", start: Object(c.a)(oe.start), end: Object(c.a)(oe.end) });
          return B;
        }
        function x({ currentEditor: P, currentRootName: M, ranges: B }) {
          return !P || !M ? null : [G(P.editing.view.document.getRoot(M), [...B])];
        }
        function N(P) {
          const M = { editorNode: P, properties: {}, attributes: {}, customProperties: {} };
          if (Object(c.d)(P)) {
            Object(c.g)(P) ? (M.type = "RootEditableElement", M.name = P.rootName, M.url = g + "_rooteditableelement-RootEditableElement.html") : (M.name = P.name, Object(c.b)(P) ? (M.type = "AttributeElement", M.url = g + "_attributeelement-AttributeElement.html") : Object(c.e)(P) ? (M.type = "EmptyElement", M.url = g + "_emptyelement-EmptyElement.html") : Object(c.h)(P) ? (M.type = "UIElement", M.url = g + "_uielement-UIElement.html") : Object(c.f)(P) ? (M.type = "RawElement", M.url = g + "_rawelement-RawElement.html") : Object(c.c)(P) ? (M.type = "EditableElement", M.url = g + "_editableelement-EditableElement.html") : (M.type = "ContainerElement", M.url = g + "_containerelement-ContainerElement.html")), V(P).forEach(([B, I]) => {
              M.attributes[B] = { value: I };
            }), M.properties = { index: { value: P.index }, isEmpty: { value: P.isEmpty }, childCount: { value: P.childCount } };
            for (let [B, I] of P.getCustomProperties()) typeof B == "symbol" && (B = B.toString()), M.customProperties[B] = { value: I };
          } else M.name = P.data, M.type = "Text", M.url = g + "_text-Text.html", M.properties = { index: { value: P.index } };
          return M.properties = Object(E.b)(M.properties), M.customProperties = Object(E.b)(M.customProperties), M.attributes = Object(E.b)(M.attributes), M;
        }
        function G(P, M) {
          const B = {};
          return Object.assign(B, { index: P.index, path: P.getPath(), node: P, positionsBefore: [], positionsAfter: [] }), Object(c.d)(P) ? function(I, oe) {
            const Q = I.node;
            Object.assign(I, { type: "element", children: [], positions: [] }), I.name = Q.name, Object(c.b)(Q) ? I.elementType = "attribute" : Object(c.g)(Q) ? I.elementType = "root" : Object(c.e)(Q) ? I.elementType = "empty" : Object(c.h)(Q) ? I.elementType = "ui" : Object(c.f)(Q) ? I.elementType = "raw" : I.elementType = "container", Object(c.e)(Q) ? I.presentation = { isEmpty: !0 } : Object(c.h)(Q) ? I.children.push({ type: "comment", text: b }) : Object(c.f)(Q) && I.children.push({ type: "comment", text: y });
            for (const z of Q.getChildren()) I.children.push(G(z, oe));
            (function(z, A) {
              for (const se of A) {
                const le = K(z, se);
                for (const te of le) {
                  const ce = te.offset;
                  if (ce === 0) {
                    const ye = z.children[0];
                    ye ? ye.positionsBefore.push(te) : z.positions.push(te);
                  } else if (ce === z.children.length) {
                    const ye = z.children[z.children.length - 1];
                    ye ? ye.positionsAfter.push(te) : z.positions.push(te);
                  } else {
                    let ye = te.isEnd ? 0 : z.children.length - 1, J = z.children[ye];
                    for (; J; ) {
                      if (J.index === ce) {
                        J.positionsBefore.push(te);
                        break;
                      }
                      if (J.index + 1 === ce) {
                        J.positionsAfter.push(te);
                        break;
                      }
                      ye += te.isEnd ? 1 : -1, J = z.children[ye];
                    }
                  }
                }
              }
            })(I, oe), I.attributes = function(z) {
              const A = V(z).map(([se, le]) => [se, Object(E.a)(le, !1)]);
              return new Map(A);
            }(Q);
          }(B, M) : function(I, oe) {
            Object.assign(I, { type: "text", startOffset: 0, text: I.node.data, positions: [] });
            for (const Q of oe) {
              const z = K(I, Q);
              I.positions.push(...z);
            }
          }(B, M), B;
        }
        function K(P, M) {
          const B = P.path, I = M.start.path, oe = M.end.path, Q = [];
          return j(B, I) && Q.push({ offset: I[I.length - 1], isEnd: !1, presentation: M.presentation || null, type: M.type, name: M.name || null }), j(B, oe) && Q.push({ offset: oe[oe.length - 1], isEnd: !0, presentation: M.presentation || null, type: M.type, name: M.name || null }), Q;
        }
        function j(P, M) {
          return P.length === M.length - 1 && Object(o.a)(P, M) === "prefix";
        }
        function V(P) {
          return [...P.getAttributes()].sort(([M], [B]) => M.toUpperCase() < B.toUpperCase() ? -1 : 1);
        }
      }, function(m, i, u) {
        u.d(i, "d", function() {
          return y;
        }), u.d(i, "c", function() {
          return v;
        }), u.d(i, "a", function() {
          return C;
        }), u.d(i, "e", function() {
          return x;
        }), u.d(i, "b", function() {
          return N;
        });
        var c = u(4), o = u(8), E = u(1);
        const g = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_", b = ["#03a9f4", "#fb8c00", "#009688", "#e91e63", "#4caf50", "#00bcd4", "#607d8b", "#cddc39", "#9c27b0", "#f44336", "#6d4c41", "#8bc34a", "#3f51b5", "#2196f3", "#f4511e", "#673ab7", "#ffb300"];
        function y(M) {
          if (!M) return [];
          const B = [...M.model.document.roots];
          return B.filter(({ rootName: I }) => I !== "$graveyard").concat(B.filter(({ rootName: I }) => I === "$graveyard"));
        }
        function v(M, B) {
          if (!M) return [];
          const I = [], oe = M.model;
          for (const Q of oe.document.selection.getRanges()) Q.root.rootName === B && I.push({ type: "selection", start: Object(c.a)(Q.start), end: Object(c.a)(Q.end) });
          return I;
        }
        function C(M, B) {
          if (!M) return [];
          const I = [], oe = M.model;
          let Q = 0;
          for (const z of oe.markers) {
            const { name: A, affectsData: se, managedUsingOperations: le } = z, te = z.getStart(), ce = z.getEnd();
            te.root.rootName === B && I.push({ type: "marker", marker: z, name: A, affectsData: se, managedUsingOperations: le, presentation: { color: b[Q++ % (b.length - 1)] }, start: Object(c.a)(te), end: Object(c.a)(ce) });
          }
          return I;
        }
        function x({ currentEditor: M, currentRootName: B, ranges: I, markers: oe }) {
          return M ? [G(M.model.document.getRoot(B), [...I, ...oe])] : [];
        }
        function N(M, B) {
          const I = { editorNode: B, properties: {}, attributes: {} };
          Object(c.c)(B) ? (Object(c.d)(B) ? (I.type = "RootElement", I.name = B.rootName, I.url = g + "rootelement-RootElement.html") : (I.type = "Element", I.name = B.name, I.url = g + "element-Element.html"), I.properties = { childCount: { value: B.childCount }, startOffset: { value: B.startOffset }, endOffset: { value: B.endOffset }, maxOffset: { value: B.maxOffset } }) : (I.name = B.data, I.type = "Text", I.url = g + "text-Text.html", I.properties = { startOffset: { value: B.startOffset }, endOffset: { value: B.endOffset }, offsetSize: { value: B.offsetSize } }), I.properties.path = { value: Object(c.b)(B) }, j(B).forEach(([oe, Q]) => {
            I.attributes[oe] = { value: Q };
          }), I.properties = Object(E.b)(I.properties), I.attributes = Object(E.b)(I.attributes);
          for (const oe in I.attributes) {
            const Q = {}, z = M.model.schema.getAttributeProperties(oe);
            for (const A in z) Q[A] = { value: z[A] };
            I.attributes[oe].subProperties = Object(E.b)(Q);
          }
          return I;
        }
        function G(M, B) {
          const I = {}, { startOffset: oe, endOffset: Q } = M;
          return Object.assign(I, { startOffset: oe, endOffset: Q, node: M, path: M.getPath(), positionsBefore: [], positionsAfter: [] }), Object(c.c)(M) ? function(z, A) {
            const se = z.node;
            Object.assign(z, { type: "element", name: se.name, children: [], maxOffset: se.maxOffset, positions: [] });
            for (const le of se.getChildren()) z.children.push(G(le, A));
            (function(le, te) {
              for (const ce of te) {
                const ye = V(le, ce);
                for (const J of ye) {
                  const de = J.offset;
                  if (de === 0) {
                    const D = le.children[0];
                    D ? D.positionsBefore.push(J) : le.positions.push(J);
                  } else if (de === le.maxOffset) {
                    const D = le.children[le.children.length - 1];
                    D ? D.positionsAfter.push(J) : le.positions.push(J);
                  } else {
                    let D = J.isEnd ? 0 : le.children.length - 1, ie = le.children[D];
                    for (; ie; ) {
                      if (ie.startOffset === de) {
                        ie.positionsBefore.push(J);
                        break;
                      }
                      if (ie.endOffset === de) {
                        const be = le.children[D + 1], Te = ie.type === "text" && be && be.type === "element", ke = ie.type === "element" && be && be.type === "text", Pe = ie.type === "text" && be && be.type === "text";
                        J.isEnd && (Te || ke || Pe) ? be.positionsBefore.push(J) : ie.positionsAfter.push(J);
                        break;
                      }
                      if (ie.startOffset < de && ie.endOffset > de) {
                        ie.positions.push(J);
                        break;
                      }
                      D += J.isEnd ? 1 : -1, ie = le.children[D];
                    }
                  }
                }
              }
            })(z, A), z.attributes = K(se);
          }(I, B) : function(z) {
            const A = z.node;
            Object.assign(z, { type: "text", text: A.data, positions: [], presentation: { dontRenderAttributeValue: !0 } }), z.attributes = K(A);
          }(I), I;
        }
        function K(M) {
          const B = j(M).map(([I, oe]) => [I, Object(E.a)(oe, !1)]);
          return new Map(B);
        }
        function j(M) {
          return [...M.getAttributes()].sort(([B], [I]) => B < I ? -1 : 1);
        }
        function V(M, B) {
          const I = M.path, oe = B.start.path, Q = B.end.path, z = [];
          return P(I, oe) && z.push({ offset: oe[oe.length - 1], isEnd: !1, presentation: B.presentation || null, type: B.type, name: B.name || null }), P(I, Q) && z.push({ offset: Q[Q.length - 1], isEnd: !0, presentation: B.presentation || null, type: B.type, name: B.name || null }), z;
        }
        function P(M, B) {
          return M.length === B.length - 1 && Object(o.a)(M, B) === "prefix";
        }
      }, function(m, i, u) {
        u.d(i, "a", function() {
          return j;
        });
        var c = u(0), o = u.n(c), E = u(5), g = u.n(E);
        class b extends c.Component {
          constructor(P) {
            super(P), this.handleClick = this.handleClick.bind(this);
          }
          handleClick(P) {
            this.globalTreeProps.onClick(P, this.definition.node);
          }
          getChildren() {
            return this.definition.children.map((P, M) => K(P, M, this.props.globalTreeProps));
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
          shouldComponentUpdate(P) {
            return !g()(this.props, P);
          }
        }
        var y = u(1);
        class v extends c.PureComponent {
          render() {
            let P;
            const M = Object(y.c)(this.props.value, 500);
            return this.props.dontRenderValue || (P = o.a.createElement("span", { className: "ck-inspector-tree-node__attribute__value" }, M)), o.a.createElement("span", { className: "ck-inspector-tree-node__attribute" }, o.a.createElement("span", { className: "ck-inspector-tree-node__attribute__name", title: M }, this.props.name), P);
          }
        }
        class C extends c.Component {
          render() {
            const P = this.props.definition, M = { className: ["ck-inspector-tree__position", P.type === "selection" ? "ck-inspector-tree__position_selection" : "", P.type === "marker" ? "ck-inspector-tree__position_marker" : "", P.isEnd ? "ck-inspector-tree__position_end" : ""].join(" "), style: {} };
            return P.presentation && P.presentation.color && (M.style["--ck-inspector-color-tree-position"] = P.presentation.color), P.type === "marker" && (M["data-marker-name"] = P.name), o.a.createElement("span", M, "​");
          }
          shouldComponentUpdate(P) {
            return !g()(this.props, P);
          }
        }
        class x extends b {
          render() {
            const P = this.definition, M = P.presentation, B = M && M.isEmpty, I = M && M.cssClass, oe = this.getChildren(), Q = ["ck-inspector-code", "ck-inspector-tree-node", this.isActive ? "ck-inspector-tree-node_active" : "", B ? "ck-inspector-tree-node_empty" : "", I], z = [], A = [];
            P.positionsBefore && P.positionsBefore.forEach((le, te) => {
              z.push(o.a.createElement(C, { key: "position-before:" + te, definition: le }));
            }), P.positionsAfter && P.positionsAfter.forEach((le, te) => {
              A.push(o.a.createElement(C, { key: "position-after:" + te, definition: le }));
            }), P.positions && P.positions.forEach((le, te) => {
              oe.push(o.a.createElement(C, { key: "position" + te, definition: le }));
            });
            let se = P.name;
            return this.globalTreeProps.showElementTypes && (se = P.elementType + ":" + se), o.a.createElement("div", { className: Q.join(" "), onClick: this.handleClick }, z, o.a.createElement("span", { className: "ck-inspector-tree-node__name" }, o.a.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_open" }), se, this.getAttributes(), B ? "" : o.a.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_close" })), o.a.createElement("div", { className: "ck-inspector-tree-node__content" }, oe), B ? "" : o.a.createElement("span", { className: "ck-inspector-tree-node__name ck-inspector-tree-node__name_close" }, o.a.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_open" }), "/", se, o.a.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_close" }), A));
          }
          getAttributes() {
            const P = [], M = this.definition;
            for (const [B, I] of M.attributes) P.push(o.a.createElement(v, { key: B, name: B, value: I }));
            return P;
          }
          shouldComponentUpdate(P) {
            return !g()(this.props, P);
          }
        }
        class N extends b {
          render() {
            const P = this.definition, M = ["ck-inspector-tree-text", this.isActive ? "ck-inspector-tree-node_active" : ""].join(" ");
            let B = this.definition.text;
            P.positions && P.positions.length && (B = B.split(""), Array.from(P.positions).sort((oe, Q) => oe.offset < Q.offset ? -1 : oe.offset === Q.offset ? 0 : 1).reverse().forEach((oe, Q) => {
              B.splice(oe.offset - P.startOffset, 0, o.a.createElement(C, { key: "position" + Q, definition: oe }));
            }));
            const I = [B];
            return P.positionsBefore && P.positionsBefore.length && P.positionsBefore.forEach((oe, Q) => {
              I.unshift(o.a.createElement(C, { key: "position-before:" + Q, definition: oe }));
            }), P.positionsAfter && P.positionsAfter.length && P.positionsAfter.forEach((oe, Q) => {
              I.push(o.a.createElement(C, { key: "position-after:" + Q, definition: oe }));
            }), o.a.createElement("span", { className: M, onClick: this.handleClick }, o.a.createElement("span", { className: "ck-inspector-tree-node__content" }, this.globalTreeProps.showCompactText ? "" : this.getAttributes(), this.globalTreeProps.showCompactText ? "" : '"', I, this.globalTreeProps.showCompactText ? "" : '"'));
          }
          getAttributes() {
            const P = [], M = this.definition, B = M.presentation, I = B && B.dontRenderAttributeValue;
            for (const [oe, Q] of M.attributes) P.push(o.a.createElement(v, { key: oe, name: oe, value: Q, dontRenderValue: I }));
            return o.a.createElement("span", { className: "ck-inspector-tree-text__attributes" }, P);
          }
          shouldComponentUpdate(P) {
            return !g()(this.props, P);
          }
        }
        class G extends c.Component {
          render() {
            return o.a.createElement("span", { className: "ck-inspector-tree-comment", dangerouslySetInnerHTML: { __html: this.props.definition.text } });
          }
        }
        function K(V, P, M) {
          return V.type === "element" ? o.a.createElement(x, { key: P, definition: V, globalTreeProps: M }) : V.type === "text" ? o.a.createElement(N, { key: P, definition: V, globalTreeProps: M }) : V.type === "comment" ? o.a.createElement(G, { key: P, definition: V }) : void 0;
        }
        u(34);
        class j extends c.Component {
          render() {
            let P;
            return P = this.props.definition ? this.props.definition.map((M, B) => K(M, B, { onClick: this.props.onClick, showCompactText: this.props.showCompactText, showElementTypes: this.props.showElementTypes, activeNode: this.props.activeNode })) : "Nothing to show.", o.a.createElement("div", { className: ["ck-inspector-tree", ...this.props.className || [], this.props.textDirection ? "ck-inspector-tree_text-direction_" + this.props.textDirection : "", this.props.showCompactText ? "ck-inspector-tree_compact-text" : ""].join(" ") }, P);
          }
        }
      }, function(m, i, u) {
        (function c() {
          if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE == "function")
            try {
              __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(c);
            } catch (o) {
              console.error(o);
            }
        })(), m.exports = u(22);
      }, function(m, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.stringifyPath = i.quoteKey = i.isValidVariableName = i.IS_VALID_IDENTIFIER = i.quoteString = void 0;
        const c = /[\\\'\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, o = /* @__PURE__ */ new Map([["\b", "\\b"], ["	", "\\t"], [`
`, "\\n"], ["\f", "\\f"], ["\r", "\\r"], ["'", "\\'"], ['"', '\\"'], ["\\", "\\\\"]]);
        function E(y) {
          return o.get(y) || "\\u" + ("0000" + y.charCodeAt(0).toString(16)).slice(-4);
        }
        i.quoteString = function(y) {
          return `'${y.replace(c, E)}'`;
        };
        const g = new Set("break else new var case finally return void catch for switch while continue function this with default if throw delete in try do instanceof typeof abstract enum int short boolean export interface static byte extends long super char final native synchronized class float package throws const goto private transient debugger implements protected volatile double import public let yield".split(" "));
        function b(y) {
          return typeof y == "string" && !g.has(y) && i.IS_VALID_IDENTIFIER.test(y);
        }
        i.IS_VALID_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/, i.isValidVariableName = b, i.quoteKey = function(y, v) {
          return b(y) ? y : v(y);
        }, i.stringifyPath = function(y, v) {
          let C = "";
          for (const x of y) b(x) ? C += "." + x : C += `[${v(x)}]`;
          return C;
        };
      }, function(m, i) {
        function u(v, C, x, N) {
          var G, K = (G = N) == null || typeof G == "number" || typeof G == "boolean" ? N : x(N), j = C.get(K);
          return j === void 0 && (j = v.call(this, N), C.set(K, j)), j;
        }
        function c(v, C, x) {
          var N = Array.prototype.slice.call(arguments, 3), G = x(N), K = C.get(G);
          return K === void 0 && (K = v.apply(this, N), C.set(G, K)), K;
        }
        function o(v, C, x, N, G) {
          return x.bind(C, v, N, G);
        }
        function E(v, C) {
          return o(v, this, v.length === 1 ? u : c, C.cache.create(), C.serializer);
        }
        function g() {
          return JSON.stringify(arguments);
        }
        function b() {
          this.cache = /* @__PURE__ */ Object.create(null);
        }
        b.prototype.has = function(v) {
          return v in this.cache;
        }, b.prototype.get = function(v) {
          return this.cache[v];
        }, b.prototype.set = function(v, C) {
          this.cache[v] = C;
        };
        var y = { create: function() {
          return new b();
        } };
        m.exports = function(v, C) {
          var x = C && C.cache ? C.cache : y, N = C && C.serializer ? C.serializer : g;
          return (C && C.strategy ? C.strategy : E)(v, { cache: x, serializer: N });
        }, m.exports.strategies = { variadic: function(v, C) {
          return o(v, this, c, C.cache.create(), C.serializer);
        }, monadic: function(v, C) {
          return o(v, this, u, C.cache.create(), C.serializer);
        } };
      }, function(m, i) {
        var u;
        u = /* @__PURE__ */ function() {
          return this;
        }();
        try {
          u = u || new Function("return this")();
        } catch {
          typeof window == "object" && (u = window);
        }
        m.exports = u;
      }, function(m, i, u) {
        var c = Object.getOwnPropertySymbols, o = Object.prototype.hasOwnProperty, E = Object.prototype.propertyIsEnumerable;
        function g(b) {
          if (b == null) throw new TypeError("Object.assign cannot be called with null or undefined");
          return Object(b);
        }
        m.exports = function() {
          try {
            if (!Object.assign) return !1;
            var b = new String("abc");
            if (b[5] = "de", Object.getOwnPropertyNames(b)[0] === "5") return !1;
            for (var y = {}, v = 0; v < 10; v++) y["_" + String.fromCharCode(v)] = v;
            if (Object.getOwnPropertyNames(y).map(function(x) {
              return y[x];
            }).join("") !== "0123456789") return !1;
            var C = {};
            return "abcdefghijklmnopqrst".split("").forEach(function(x) {
              C[x] = x;
            }), Object.keys(Object.assign({}, C)).join("") === "abcdefghijklmnopqrst";
          } catch {
            return !1;
          }
        }() ? Object.assign : function(b, y) {
          for (var v, C, x = g(b), N = 1; N < arguments.length; N++) {
            for (var G in v = Object(arguments[N])) o.call(v, G) && (x[G] = v[G]);
            if (c) {
              C = c(v);
              for (var K = 0; K < C.length; K++) E.call(v, C[K]) && (x[C[K]] = v[C[K]]);
            }
          }
          return x;
        };
      }, function(m, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.FunctionParser = i.dedentFunction = i.functionToString = i.USED_METHOD_KEY = void 0;
        const c = u(13), o = { " "() {
        } }[" "].toString().charAt(0) === '"', E = { Function: "function ", GeneratorFunction: "function* ", AsyncFunction: "async function ", AsyncGeneratorFunction: "async function* " }, g = { Function: "", GeneratorFunction: "*", AsyncFunction: "async ", AsyncGeneratorFunction: "async *" }, b = new Set("case delete else in instanceof new return throw typeof void , ; : + - ! ~ & | ^ * / % < > ? =".split(" "));
        i.USED_METHOD_KEY = /* @__PURE__ */ new WeakSet();
        function y(C) {
          let x;
          for (const N of C.split(`
`).slice(1)) {
            const G = /^[\s\t]+/.exec(N);
            if (!G) return C;
            const [K] = G;
            (x === void 0 || K.length < x.length) && (x = K);
          }
          return x ? C.split(`
` + x).join(`
`) : C;
        }
        i.functionToString = (C, x, N, G) => {
          const K = typeof G == "string" ? G : void 0;
          return K !== void 0 && i.USED_METHOD_KEY.add(C), new v(C, x, N, K).stringify();
        }, i.dedentFunction = y;
        class v {
          constructor(x, N, G, K) {
            this.fn = x, this.indent = N, this.next = G, this.key = K, this.pos = 0, this.hadKeyword = !1, this.fnString = Function.prototype.toString.call(x), this.fnType = x.constructor.name, this.keyQuote = K === void 0 ? "" : c.quoteKey(K, G), this.keyPrefix = K === void 0 ? "" : `${this.keyQuote}:${N ? " " : ""}`, this.isMethodCandidate = K !== void 0 && (this.fn.name === "" || this.fn.name === K);
          }
          stringify() {
            const x = this.tryParse();
            return x ? y(x) : `${this.keyPrefix}void ${this.next(this.fnString)}`;
          }
          getPrefix() {
            return this.isMethodCandidate && !this.hadKeyword ? g[this.fnType] + this.keyQuote : this.keyPrefix + E[this.fnType];
          }
          tryParse() {
            if (this.fnString[this.fnString.length - 1] !== "}") return this.keyPrefix + this.fnString;
            if (this.fn.name) {
              const N = this.tryStrippingName();
              if (N) return N;
            }
            const x = this.pos;
            if (this.consumeSyntax() === "class") return this.fnString;
            if (this.pos = x, this.tryParsePrefixTokens()) {
              const N = this.tryStrippingName();
              if (N) return N;
              let G = this.pos;
              switch (this.consumeSyntax("WORD_LIKE")) {
                case "WORD_LIKE":
                  this.isMethodCandidate && !this.hadKeyword && (G = this.pos);
                case "()":
                  if (this.fnString.substr(this.pos, 2) === "=>") return this.keyPrefix + this.fnString;
                  this.pos = G;
                case '"':
                case "'":
                case "[]":
                  return this.getPrefix() + this.fnString.substr(this.pos);
              }
            }
          }
          tryStrippingName() {
            if (o) return;
            let x = this.pos;
            const N = this.fnString.substr(this.pos, this.fn.name.length);
            if (N === this.fn.name && (this.pos += N.length, this.consumeSyntax() === "()" && this.consumeSyntax() === "{}" && this.pos === this.fnString.length)) return !this.isMethodCandidate && c.isValidVariableName(N) || (x += N.length), this.getPrefix() + this.fnString.substr(x);
            this.pos = x;
          }
          tryParsePrefixTokens() {
            let x = this.pos;
            switch (this.hadKeyword = !1, this.fnType) {
              case "AsyncFunction":
                if (this.consumeSyntax() !== "async") return !1;
                x = this.pos;
              case "Function":
                return this.consumeSyntax() === "function" ? this.hadKeyword = !0 : this.pos = x, !0;
              case "AsyncGeneratorFunction":
                if (this.consumeSyntax() !== "async") return !1;
              case "GeneratorFunction":
                let N = this.consumeSyntax();
                return N === "function" && (N = this.consumeSyntax(), this.hadKeyword = !0), N === "*";
            }
          }
          consumeSyntax(x) {
            const N = this.consumeMatch(/^(?:([A-Za-z_0-9$\xA0-\uFFFF]+)|=>|\+\+|\-\-|.)/);
            if (!N) return;
            const [G, K] = N;
            if (this.consumeWhitespace(), K) return x || K;
            switch (G) {
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
            return G;
          }
          consumeSyntaxUntil(x, N) {
            let G = !0;
            for (; ; ) {
              const K = this.consumeSyntax();
              if (K === N) return x + N;
              if (!K || K === ")" || K === "]" || K === "}") return;
              K === "/" && G && this.consumeMatch(/^(?:\\.|[^\\\/\n[]|\[(?:\\.|[^\]])*\])+\/[a-z]*/) ? (G = !1, this.consumeWhitespace()) : G = b.has(K);
            }
          }
          consumeMatch(x) {
            const N = x.exec(this.fnString.substr(this.pos));
            return N && (this.pos += N[0].length), N;
          }
          consumeRegExp(x, N) {
            const G = x.exec(this.fnString.substr(this.pos));
            if (G) return this.pos += G[0].length, this.consumeWhitespace(), N;
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
        i.FunctionParser = v;
      }, function(m, i, u) {
        m.exports = u(53)();
      }, function(m, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.stringify = void 0;
        const c = u(25), o = u(13), E = Symbol("root");
        i.stringify = function(g, b, y, v = {}) {
          const C = typeof y == "string" ? y : " ".repeat(y || 0), x = [], N = /* @__PURE__ */ new Set(), G = /* @__PURE__ */ new Map(), K = /* @__PURE__ */ new Map();
          let j = 0;
          const { maxDepth: V = 100, references: P = !1, skipUndefinedProperties: M = !1, maxValues: B = 1e5 } = v, I = function(A) {
            return A ? (se, le, te, ce) => A(se, le, (ye) => c.toString(ye, le, te, ce), ce) : c.toString;
          }(b), oe = (A, se) => {
            if (++j > B || M && A === void 0 || x.length > V) return;
            if (se === void 0) return I(A, C, oe, se);
            x.push(se);
            const le = Q(A, se === E ? void 0 : se);
            return x.pop(), le;
          }, Q = P ? (A, se) => {
            if (A !== null && (typeof A == "object" || typeof A == "function" || typeof A == "symbol")) {
              if (G.has(A)) return K.set(x.slice(1), G.get(A)), I(void 0, C, oe, se);
              G.set(A, x.slice(1));
            }
            return I(A, C, oe, se);
          } : (A, se) => {
            if (N.has(A)) return;
            N.add(A);
            const le = I(A, C, oe, se);
            return N.delete(A), le;
          }, z = oe(g, E);
          if (K.size) {
            const A = C ? " " : "", se = C ? `
` : "";
            let le = `var x${A}=${A}${z};${se}`;
            for (const [te, ce] of K.entries())
              le += `x${o.stringifyPath(te, oe)}${A}=${A}x${o.stringifyPath(ce, oe)};${se}`;
            return `(function${A}()${A}{${se}${le}return x;${se}}())`;
          }
          return z;
        };
      }, function(m, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.findInArray = function(c, o) {
          for (var E = 0, g = c.length; E < g; E++) if (o.apply(o, [c[E], E, c])) return c[E];
        }, i.isFunction = function(c) {
          return typeof c == "function" || Object.prototype.toString.call(c) === "[object Function]";
        }, i.isNum = function(c) {
          return typeof c == "number" && !isNaN(c);
        }, i.int = function(c) {
          return parseInt(c, 10);
        }, i.dontSetMe = function(c, o, E) {
          if (c[o]) return new Error("Invalid prop ".concat(o, " passed to ").concat(E, " - do not set this, set it on the child."));
        };
      }, function(m, i, u) {
        var c = u(16), o = typeof Symbol == "function" && Symbol.for, E = o ? Symbol.for("react.element") : 60103, g = o ? Symbol.for("react.portal") : 60106, b = o ? Symbol.for("react.fragment") : 60107, y = o ? Symbol.for("react.strict_mode") : 60108, v = o ? Symbol.for("react.profiler") : 60114, C = o ? Symbol.for("react.provider") : 60109, x = o ? Symbol.for("react.context") : 60110, N = o ? Symbol.for("react.forward_ref") : 60112, G = o ? Symbol.for("react.suspense") : 60113, K = o ? Symbol.for("react.memo") : 60115, j = o ? Symbol.for("react.lazy") : 60116, V = typeof Symbol == "function" && Symbol.iterator;
        function P(X) {
          for (var Y = "https://reactjs.org/docs/error-decoder.html?invariant=" + X, me = 1; me < arguments.length; me++) Y += "&args[]=" + encodeURIComponent(arguments[me]);
          return "Minified React error #" + X + "; visit " + Y + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
        }
        var M = { isMounted: function() {
          return !1;
        }, enqueueForceUpdate: function() {
        }, enqueueReplaceState: function() {
        }, enqueueSetState: function() {
        } }, B = {};
        function I(X, Y, me) {
          this.props = X, this.context = Y, this.refs = B, this.updater = me || M;
        }
        function oe() {
        }
        function Q(X, Y, me) {
          this.props = X, this.context = Y, this.refs = B, this.updater = me || M;
        }
        I.prototype.isReactComponent = {}, I.prototype.setState = function(X, Y) {
          if (typeof X != "object" && typeof X != "function" && X != null) throw Error(P(85));
          this.updater.enqueueSetState(this, X, Y, "setState");
        }, I.prototype.forceUpdate = function(X) {
          this.updater.enqueueForceUpdate(this, X, "forceUpdate");
        }, oe.prototype = I.prototype;
        var z = Q.prototype = new oe();
        z.constructor = Q, c(z, I.prototype), z.isPureReactComponent = !0;
        var A = { current: null }, se = Object.prototype.hasOwnProperty, le = { key: !0, ref: !0, __self: !0, __source: !0 };
        function te(X, Y, me) {
          var l, f = {}, k = null, U = null;
          if (Y != null) for (l in Y.ref !== void 0 && (U = Y.ref), Y.key !== void 0 && (k = "" + Y.key), Y) se.call(Y, l) && !le.hasOwnProperty(l) && (f[l] = Y[l]);
          var F = arguments.length - 2;
          if (F === 1) f.children = me;
          else if (1 < F) {
            for (var H = Array(F), he = 0; he < F; he++) H[he] = arguments[he + 2];
            f.children = H;
          }
          if (X && X.defaultProps) for (l in F = X.defaultProps) f[l] === void 0 && (f[l] = F[l]);
          return { $$typeof: E, type: X, key: k, ref: U, props: f, _owner: A.current };
        }
        function ce(X) {
          return typeof X == "object" && X !== null && X.$$typeof === E;
        }
        var ye = /\/+/g, J = [];
        function de(X, Y, me, l) {
          if (J.length) {
            var f = J.pop();
            return f.result = X, f.keyPrefix = Y, f.func = me, f.context = l, f.count = 0, f;
          }
          return { result: X, keyPrefix: Y, func: me, context: l, count: 0 };
        }
        function D(X) {
          X.result = null, X.keyPrefix = null, X.func = null, X.context = null, X.count = 0, 10 > J.length && J.push(X);
        }
        function ie(X, Y, me) {
          return X == null ? 0 : function l(f, k, U, F) {
            var H = typeof f;
            H !== "undefined" && H !== "boolean" || (f = null);
            var he = !1;
            if (f === null) he = !0;
            else switch (H) {
              case "string":
              case "number":
                he = !0;
                break;
              case "object":
                switch (f.$$typeof) {
                  case E:
                  case g:
                    he = !0;
                }
            }
            if (he) return U(F, f, k === "" ? "." + be(f, 0) : k), 1;
            if (he = 0, k = k === "" ? "." : k + ":", Array.isArray(f)) for (var je = 0; je < f.length; je++) {
              var Re = k + be(H = f[je], je);
              he += l(H, Re, U, F);
            }
            else if (f === null || typeof f != "object" ? Re = null : Re = typeof (Re = V && f[V] || f["@@iterator"]) == "function" ? Re : null, typeof Re == "function") for (f = Re.call(f), je = 0; !(H = f.next()).done; ) he += l(H = H.value, Re = k + be(H, je++), U, F);
            else if (H === "object") throw U = "" + f, Error(P(31, U === "[object Object]" ? "object with keys {" + Object.keys(f).join(", ") + "}" : U, ""));
            return he;
          }(X, "", Y, me);
        }
        function be(X, Y) {
          return typeof X == "object" && X !== null && X.key != null ? function(me) {
            var l = { "=": "=0", ":": "=2" };
            return "$" + ("" + me).replace(/[=:]/g, function(f) {
              return l[f];
            });
          }(X.key) : Y.toString(36);
        }
        function Te(X, Y) {
          X.func.call(X.context, Y, X.count++);
        }
        function ke(X, Y, me) {
          var l = X.result, f = X.keyPrefix;
          X = X.func.call(X.context, Y, X.count++), Array.isArray(X) ? Pe(X, l, me, function(k) {
            return k;
          }) : X != null && (ce(X) && (X = function(k, U) {
            return { $$typeof: E, type: k.type, key: U, ref: k.ref, props: k.props, _owner: k._owner };
          }(X, f + (!X.key || Y && Y.key === X.key ? "" : ("" + X.key).replace(ye, "$&/") + "/") + me)), l.push(X));
        }
        function Pe(X, Y, me, l, f) {
          var k = "";
          me != null && (k = ("" + me).replace(ye, "$&/") + "/"), ie(X, ke, Y = de(Y, k, l, f)), D(Y);
        }
        var Se = { current: null };
        function ze() {
          var X = Se.current;
          if (X === null) throw Error(P(321));
          return X;
        }
        var Je = { ReactCurrentDispatcher: Se, ReactCurrentBatchConfig: { suspense: null }, ReactCurrentOwner: A, IsSomeRendererActing: { current: !1 }, assign: c };
        i.Children = { map: function(X, Y, me) {
          if (X == null) return X;
          var l = [];
          return Pe(X, l, null, Y, me), l;
        }, forEach: function(X, Y, me) {
          if (X == null) return X;
          ie(X, Te, Y = de(null, null, Y, me)), D(Y);
        }, count: function(X) {
          return ie(X, function() {
            return null;
          }, null);
        }, toArray: function(X) {
          var Y = [];
          return Pe(X, Y, null, function(me) {
            return me;
          }), Y;
        }, only: function(X) {
          if (!ce(X)) throw Error(P(143));
          return X;
        } }, i.Component = I, i.Fragment = b, i.Profiler = v, i.PureComponent = Q, i.StrictMode = y, i.Suspense = G, i.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Je, i.cloneElement = function(X, Y, me) {
          if (X == null) throw Error(P(267, X));
          var l = c({}, X.props), f = X.key, k = X.ref, U = X._owner;
          if (Y != null) {
            if (Y.ref !== void 0 && (k = Y.ref, U = A.current), Y.key !== void 0 && (f = "" + Y.key), X.type && X.type.defaultProps) var F = X.type.defaultProps;
            for (H in Y) se.call(Y, H) && !le.hasOwnProperty(H) && (l[H] = Y[H] === void 0 && F !== void 0 ? F[H] : Y[H]);
          }
          var H = arguments.length - 2;
          if (H === 1) l.children = me;
          else if (1 < H) {
            F = Array(H);
            for (var he = 0; he < H; he++) F[he] = arguments[he + 2];
            l.children = F;
          }
          return { $$typeof: E, type: X.type, key: f, ref: k, props: l, _owner: U };
        }, i.createContext = function(X, Y) {
          return Y === void 0 && (Y = null), (X = { $$typeof: x, _calculateChangedBits: Y, _currentValue: X, _currentValue2: X, _threadCount: 0, Provider: null, Consumer: null }).Provider = { $$typeof: C, _context: X }, X.Consumer = X;
        }, i.createElement = te, i.createFactory = function(X) {
          var Y = te.bind(null, X);
          return Y.type = X, Y;
        }, i.createRef = function() {
          return { current: null };
        }, i.forwardRef = function(X) {
          return { $$typeof: N, render: X };
        }, i.isValidElement = ce, i.lazy = function(X) {
          return { $$typeof: j, _ctor: X, _status: -1, _result: null };
        }, i.memo = function(X, Y) {
          return { $$typeof: K, type: X, compare: Y === void 0 ? null : Y };
        }, i.useCallback = function(X, Y) {
          return ze().useCallback(X, Y);
        }, i.useContext = function(X, Y) {
          return ze().useContext(X, Y);
        }, i.useDebugValue = function() {
        }, i.useEffect = function(X, Y) {
          return ze().useEffect(X, Y);
        }, i.useImperativeHandle = function(X, Y, me) {
          return ze().useImperativeHandle(X, Y, me);
        }, i.useLayoutEffect = function(X, Y) {
          return ze().useLayoutEffect(X, Y);
        }, i.useMemo = function(X, Y) {
          return ze().useMemo(X, Y);
        }, i.useReducer = function(X, Y, me) {
          return ze().useReducer(X, Y, me);
        }, i.useRef = function(X) {
          return ze().useRef(X);
        }, i.useState = function(X) {
          return ze().useState(X);
        }, i.version = "16.14.0";
      }, function(m, i, u) {
        var c = u(0), o = u(16), E = u(23);
        function g(e) {
          for (var t = "https://reactjs.org/docs/error-decoder.html?invariant=" + e, n = 1; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
          return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
        }
        if (!c) throw Error(g(227));
        function b(e, t, n, r, a, p, w, T, Z) {
          var q = Array.prototype.slice.call(arguments, 3);
          try {
            t.apply(n, q);
          } catch (ge) {
            this.onError(ge);
          }
        }
        var y = !1, v = null, C = !1, x = null, N = { onError: function(e) {
          y = !0, v = e;
        } };
        function G(e, t, n, r, a, p, w, T, Z) {
          y = !1, v = null, b.apply(N, arguments);
        }
        var K = null, j = null, V = null;
        function P(e, t, n) {
          var r = e.type || "unknown-event";
          e.currentTarget = V(n), function(a, p, w, T, Z, q, ge, De, He) {
            if (G.apply(this, arguments), y) {
              if (!y) throw Error(g(198));
              var ot = v;
              y = !1, v = null, C || (C = !0, x = ot);
            }
          }(r, t, void 0, e), e.currentTarget = null;
        }
        var M = null, B = {};
        function I() {
          if (M) for (var e in B) {
            var t = B[e], n = M.indexOf(e);
            if (!(-1 < n)) throw Error(g(96, e));
            if (!Q[n]) {
              if (!t.extractEvents) throw Error(g(97, e));
              for (var r in Q[n] = t, n = t.eventTypes) {
                var a = void 0, p = n[r], w = t, T = r;
                if (z.hasOwnProperty(T)) throw Error(g(99, T));
                z[T] = p;
                var Z = p.phasedRegistrationNames;
                if (Z) {
                  for (a in Z) Z.hasOwnProperty(a) && oe(Z[a], w, T);
                  a = !0;
                } else p.registrationName ? (oe(p.registrationName, w, T), a = !0) : a = !1;
                if (!a) throw Error(g(98, r, e));
              }
            }
          }
        }
        function oe(e, t, n) {
          if (A[e]) throw Error(g(100, e));
          A[e] = t, se[e] = t.eventTypes[n].dependencies;
        }
        var Q = [], z = {}, A = {}, se = {};
        function le(e) {
          var t, n = !1;
          for (t in e) if (e.hasOwnProperty(t)) {
            var r = e[t];
            if (!B.hasOwnProperty(t) || B[t] !== r) {
              if (B[t]) throw Error(g(102, t));
              B[t] = r, n = !0;
            }
          }
          n && I();
        }
        var te = !(typeof window > "u" || window.document === void 0 || window.document.createElement === void 0), ce = null, ye = null, J = null;
        function de(e) {
          if (e = j(e)) {
            if (typeof ce != "function") throw Error(g(280));
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
            if (J = ye = null, de(e), t) for (e = 0; e < t.length; e++) de(t[e]);
          }
        }
        function be(e, t) {
          return e(t);
        }
        function Te(e, t, n, r, a) {
          return e(t, n, r, a);
        }
        function ke() {
        }
        var Pe = be, Se = !1, ze = !1;
        function Je() {
          ye === null && J === null || (ke(), ie());
        }
        function X(e, t, n) {
          if (ze) return e(t, n);
          ze = !0;
          try {
            return Pe(e, t, n);
          } finally {
            ze = !1, Je();
          }
        }
        var Y = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, me = Object.prototype.hasOwnProperty, l = {}, f = {};
        function k(e, t, n, r, a, p) {
          this.acceptsBooleans = t === 2 || t === 3 || t === 4, this.attributeName = r, this.attributeNamespace = a, this.mustUseProperty = n, this.propertyName = e, this.type = t, this.sanitizeURL = p;
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
        function H(e) {
          return e[1].toUpperCase();
        }
        "accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e) {
          var t = e.replace(F, H);
          U[t] = new k(t, 1, !1, e, null, !1);
        }), "xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e) {
          var t = e.replace(F, H);
          U[t] = new k(t, 1, !1, e, "http://www.w3.org/1999/xlink", !1);
        }), ["xml:base", "xml:lang", "xml:space"].forEach(function(e) {
          var t = e.replace(F, H);
          U[t] = new k(t, 1, !1, e, "http://www.w3.org/XML/1998/namespace", !1);
        }), ["tabIndex", "crossOrigin"].forEach(function(e) {
          U[e] = new k(e, 1, !1, e.toLowerCase(), null, !1);
        }), U.xlinkHref = new k("xlinkHref", 1, !1, "xlink:href", "http://www.w3.org/1999/xlink", !0), ["src", "href", "action", "formAction"].forEach(function(e) {
          U[e] = new k(e, 1, !1, e.toLowerCase(), null, !0);
        });
        var he = c.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
        function je(e, t, n, r) {
          var a = U.hasOwnProperty(t) ? U[t] : null;
          (a !== null ? a.type === 0 : !r && 2 < t.length && (t[0] === "o" || t[0] === "O") && (t[1] === "n" || t[1] === "N")) || (function(p, w, T, Z) {
            if (w == null || function(q, ge, De, He) {
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
            }(p, w, T, Z)) return !0;
            if (Z) return !1;
            if (T !== null) switch (T.type) {
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
          }(t, n, a, r) && (n = null), r || a === null ? function(p) {
            return !!me.call(f, p) || !me.call(l, p) && (Y.test(p) ? f[p] = !0 : (l[p] = !0, !1));
          }(t) && (n === null ? e.removeAttribute(t) : e.setAttribute(t, "" + n)) : a.mustUseProperty ? e[a.propertyName] = n === null ? a.type !== 3 && "" : n : (t = a.attributeName, r = a.attributeNamespace, n === null ? e.removeAttribute(t) : (n = (a = a.type) === 3 || a === 4 && n === !0 ? "" : "" + n, r ? e.setAttributeNS(r, t, n) : e.setAttribute(t, n))));
        }
        he.hasOwnProperty("ReactCurrentDispatcher") || (he.ReactCurrentDispatcher = { current: null }), he.hasOwnProperty("ReactCurrentBatchConfig") || (he.ReactCurrentBatchConfig = { suspense: null });
        var Re = /^(.*)[\\\/]/, Xe = typeof Symbol == "function" && Symbol.for, We = Xe ? Symbol.for("react.element") : 60103, It = Xe ? Symbol.for("react.portal") : 60106, wt = Xe ? Symbol.for("react.fragment") : 60107, Jt = Xe ? Symbol.for("react.strict_mode") : 60108, kt = Xe ? Symbol.for("react.profiler") : 60114, gt = Xe ? Symbol.for("react.provider") : 60109, cn = Xe ? Symbol.for("react.context") : 60110, _r = Xe ? Symbol.for("react.concurrent_mode") : 60111, Tt = Xe ? Symbol.for("react.forward_ref") : 60112, pt = Xe ? Symbol.for("react.suspense") : 60113, Yn = Xe ? Symbol.for("react.suspense_list") : 60120, Sn = Xe ? Symbol.for("react.memo") : 60115, or = Xe ? Symbol.for("react.lazy") : 60116, Er = Xe ? Symbol.for("react.block") : 60121, _o = typeof Symbol == "function" && Symbol.iterator;
        function en(e) {
          return e === null || typeof e != "object" ? null : typeof (e = _o && e[_o] || e["@@iterator"]) == "function" ? e : null;
        }
        function Yt(e) {
          if (e == null) return null;
          if (typeof e == "function") return e.displayName || e.name || null;
          if (typeof e == "string") return e;
          switch (e) {
            case wt:
              return "Fragment";
            case It:
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
            case Er:
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
                var r = e._debugOwner, a = e._debugSource, p = Yt(e.type);
                n = null, r && (n = Yt(r.type)), r = p, p = "", a ? p = " (at " + a.fileName.replace(Re, "") + ":" + a.lineNumber + ")" : n && (p = " (created by " + n + ")"), n = `
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
            var n = gn(t) ? "checked" : "value", r = Object.getOwnPropertyDescriptor(t.constructor.prototype, n), a = "" + t[n];
            if (!t.hasOwnProperty(n) && r !== void 0 && typeof r.get == "function" && typeof r.set == "function") {
              var p = r.get, w = r.set;
              return Object.defineProperty(t, n, { configurable: !0, get: function() {
                return p.call(this);
              }, set: function(T) {
                a = "" + T, w.call(this, T);
              } }), Object.defineProperty(t, n, { enumerable: r.enumerable }), { getValue: function() {
                return a;
              }, setValue: function(T) {
                a = "" + T;
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
            return c.Children.forEach(n, function(a) {
              a != null && (r += a);
            }), r;
          }(t.children)) && (e.children = t), e;
        }
        function Tn(e, t, n, r) {
          if (e = e.options, t) {
            t = {};
            for (var a = 0; a < n.length; a++) t["$" + n[a]] = !0;
            for (n = 0; n < e.length; n++) a = t.hasOwnProperty("$" + e[n].value), e[n].selected !== a && (e[n].selected = a), a && r && (e[n].defaultSelected = !0);
          } else {
            for (n = "" + qt(n), t = null, a = 0; a < e.length; a++) {
              if (e[a].value === n) return e[a].selected = !0, void (r && (e[a].defaultSelected = !0));
              t !== null || e[a].disabled || (t = e[a]);
            }
            t !== null && (t.selected = !0);
          }
        }
        function lr(e, t) {
          if (t.dangerouslySetInnerHTML != null) throw Error(g(91));
          return o({}, t, { value: void 0, defaultValue: void 0, children: "" + e._wrapperState.initialValue });
        }
        function On(e, t) {
          var n = t.value;
          if (n == null) {
            if (n = t.children, t = t.defaultValue, n != null) {
              if (t != null) throw Error(g(92));
              if (Array.isArray(n)) {
                if (!(1 >= n.length)) throw Error(g(93));
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
        var W = "http://www.w3.org/1999/xhtml", ae = "http://www.w3.org/2000/svg";
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
        function Ce(e, t) {
          return e == null || e === "http://www.w3.org/1999/xhtml" ? we(t) : e === "http://www.w3.org/2000/svg" && t === "foreignObject" ? "http://www.w3.org/1999/xhtml" : e;
        }
        var it, qe = function(e) {
          return typeof MSApp < "u" && MSApp.execUnsafeLocalFunction ? function(t, n, r, a) {
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
        function Pt(e) {
          if (nt[e]) return nt[e];
          if (!Ot[e]) return e;
          var t, n = Ot[e];
          for (t in n) if (n.hasOwnProperty(t) && t in bt) return nt[e] = n[t];
          return e;
        }
        te && (bt = document.createElement("div").style, "AnimationEvent" in window || (delete Ot.animationend.animation, delete Ot.animationiteration.animation, delete Ot.animationstart.animation), "TransitionEvent" in window || delete Ot.transitionend.transition);
        var tn = Pt("animationend"), ht = Pt("animationiteration"), Bt = Pt("animationstart"), Pn = Pt("transitionend"), ct = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), yn = new (typeof WeakMap == "function" ? WeakMap : Map)();
        function un(e) {
          var t = yn.get(e);
          return t === void 0 && (t = /* @__PURE__ */ new Map(), yn.set(e, t)), t;
        }
        function Nn(e) {
          var t = e, n = e;
          if (e.alternate) for (; t.return; ) t = t.return;
          else {
            e = t;
            do
              (1026 & (t = e).effectTag) != 0 && (n = t.return), e = t.return;
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
        function xo(e) {
          if (Nn(e) !== e) throw Error(g(188));
        }
        function rt(e) {
          if (!(e = function(n) {
            var r = n.alternate;
            if (!r) {
              if ((r = Nn(n)) === null) throw Error(g(188));
              return r !== n ? null : n;
            }
            for (var a = n, p = r; ; ) {
              var w = a.return;
              if (w === null) break;
              var T = w.alternate;
              if (T === null) {
                if ((p = w.return) !== null) {
                  a = p;
                  continue;
                }
                break;
              }
              if (w.child === T.child) {
                for (T = w.child; T; ) {
                  if (T === a) return xo(w), n;
                  if (T === p) return xo(w), r;
                  T = T.sibling;
                }
                throw Error(g(188));
              }
              if (a.return !== p.return) a = w, p = T;
              else {
                for (var Z = !1, q = w.child; q; ) {
                  if (q === a) {
                    Z = !0, a = w, p = T;
                    break;
                  }
                  if (q === p) {
                    Z = !0, p = w, a = T;
                    break;
                  }
                  q = q.sibling;
                }
                if (!Z) {
                  for (q = T.child; q; ) {
                    if (q === a) {
                      Z = !0, a = T, p = w;
                      break;
                    }
                    if (q === p) {
                      Z = !0, p = T, a = w;
                      break;
                    }
                    q = q.sibling;
                  }
                  if (!Z) throw Error(g(189));
                }
              }
              if (a.alternate !== p) throw Error(g(190));
            }
            if (a.tag !== 3) throw Error(g(188));
            return a.stateNode.current === a ? n : r;
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
          if (t == null) throw Error(g(30));
          return e == null ? t : Array.isArray(e) ? Array.isArray(t) ? (e.push.apply(e, t), e) : (e.push(t), e) : Array.isArray(t) ? [e].concat(t) : [e, t];
        }
        function qn(e, t, n) {
          Array.isArray(e) ? e.forEach(t, n) : e && t.call(n, e);
        }
        var Kt = null;
        function Or(e) {
          if (e) {
            var t = e._dispatchListeners, n = e._dispatchInstances;
            if (Array.isArray(t)) for (var r = 0; r < t.length && !e.isPropagationStopped(); r++) P(e, t[r], n[r]);
            else t && P(e, t, n);
            e._dispatchListeners = null, e._dispatchInstances = null, e.isPersistent() || e.constructor.release(e);
          }
        }
        function At(e) {
          if (e !== null && (Kt = Ue(Kt, e)), e = Kt, Kt = null, e) {
            if (qn(e, Or), Kt) throw Error(g(95));
            if (C) throw e = x, C = !1, x = null, e;
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
            var a = Qt.pop();
            return a.topLevelType = e, a.eventSystemFlags = r, a.nativeEvent = t, a.targetInst = n, a;
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
            (t = n.tag) !== 5 && t !== 6 || e.ancestors.push(n), n = Mr(r);
          } while (n);
          for (n = 0; n < e.ancestors.length; n++) {
            t = e.ancestors[n];
            var a = nn(e.nativeEvent);
            r = e.topLevelType;
            var p = e.nativeEvent, w = e.eventSystemFlags;
            n === 0 && (w |= 64);
            for (var T = null, Z = 0; Z < Q.length; Z++) {
              var q = Q[Z];
              q && (q = q.extractEvents(r, t, p, a, w)) && (T = Ue(T, q));
            }
            At(T);
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
        var _t, ur, dr, vn = !1, Ut = [], Wt = null, on = null, Kn = null, fr = /* @__PURE__ */ new Map(), Zr = /* @__PURE__ */ new Map(), Pr = [], Bn = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput close cancel copy cut paste click change contextmenu reset submit".split(" "), Nt = "focus blur dragenter dragleave mouseover mouseout pointerover pointerout gotpointercapture lostpointercapture".split(" ");
        function So(e, t, n, r, a) {
          return { blockedOn: e, topLevelType: t, eventSystemFlags: 32 | n, nativeEvent: a, container: r };
        }
        function wn(e, t) {
          switch (e) {
            case "focus":
            case "blur":
              Wt = null;
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
              fr.delete(t.pointerId);
              break;
            case "gotpointercapture":
            case "lostpointercapture":
              Zr.delete(t.pointerId);
          }
        }
        function Nr(e, t, n, r, a, p) {
          return e === null || e.nativeEvent !== p ? (e = So(t, n, r, a, p), t !== null && (t = oo(t)) !== null && ur(t), e) : (e.eventSystemFlags |= r, e);
        }
        function Oa(e) {
          var t = Mr(e.target);
          if (t !== null) {
            var n = Nn(t);
            if (n !== null) {
              if ((t = n.tag) === 13) {
                if ((t = Eo(n)) !== null) return e.blockedOn = t, void E.unstable_runWithPriority(e.priority, function() {
                  dr(n);
                });
              } else if (t === 3 && n.stateNode.hydrate) return void (e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null);
            }
          }
          e.blockedOn = null;
        }
        function Co(e) {
          if (e.blockedOn !== null) return !1;
          var t = Ir(e.topLevelType, e.eventSystemFlags, e.container, e.nativeEvent);
          if (t !== null) {
            var n = oo(t);
            return n !== null && ur(n), e.blockedOn = t, !1;
          }
          return !0;
        }
        function wi(e, t, n) {
          Co(e) && n.delete(t);
        }
        function ki() {
          for (vn = !1; 0 < Ut.length; ) {
            var e = Ut[0];
            if (e.blockedOn !== null) {
              (e = oo(e.blockedOn)) !== null && _t(e);
              break;
            }
            var t = Ir(e.topLevelType, e.eventSystemFlags, e.container, e.nativeEvent);
            t !== null ? e.blockedOn = t : Ut.shift();
          }
          Wt !== null && Co(Wt) && (Wt = null), on !== null && Co(on) && (on = null), Kn !== null && Co(Kn) && (Kn = null), fr.forEach(wi), Zr.forEach(wi);
        }
        function Dr(e, t) {
          e.blockedOn === t && (e.blockedOn = null, vn || (vn = !0, E.unstable_scheduleCallback(E.unstable_NormalPriority, ki)));
        }
        function pr(e) {
          function t(a) {
            return Dr(a, e);
          }
          if (0 < Ut.length) {
            Dr(Ut[0], e);
            for (var n = 1; n < Ut.length; n++) {
              var r = Ut[n];
              r.blockedOn === e && (r.blockedOn = null);
            }
          }
          for (Wt !== null && Dr(Wt, e), on !== null && Dr(on, e), Kn !== null && Dr(Kn, e), fr.forEach(t), Zr.forEach(t), n = 0; n < Pr.length; n++) (r = Pr[n]).blockedOn === e && (r.blockedOn = null);
          for (; 0 < Pr.length && (n = Pr[0]).blockedOn === null; ) Oa(n), n.blockedOn === null && Pr.shift();
        }
        var _i = {}, Ei = /* @__PURE__ */ new Map(), Rr = /* @__PURE__ */ new Map(), Pa = ["abort", "abort", tn, "animationEnd", ht, "animationIteration", Bt, "animationStart", "canplay", "canPlay", "canplaythrough", "canPlayThrough", "durationchange", "durationChange", "emptied", "emptied", "encrypted", "encrypted", "ended", "ended", "error", "error", "gotpointercapture", "gotPointerCapture", "load", "load", "loadeddata", "loadedData", "loadedmetadata", "loadedMetadata", "loadstart", "loadStart", "lostpointercapture", "lostPointerCapture", "playing", "playing", "progress", "progress", "seeking", "seeking", "stalled", "stalled", "suspend", "suspend", "timeupdate", "timeUpdate", Pn, "transitionEnd", "waiting", "waiting"];
        function qo(e, t) {
          for (var n = 0; n < e.length; n += 2) {
            var r = e[n], a = e[n + 1], p = "on" + (a[0].toUpperCase() + a.slice(1));
            p = { phasedRegistrationNames: { bubbled: p, captured: p + "Capture" }, dependencies: [r], eventPriority: t }, Rr.set(r, t), Ei.set(r, p), _i[a] = p;
          }
        }
        qo("blur blur cancel cancel click click close close contextmenu contextMenu copy copy cut cut auxclick auxClick dblclick doubleClick dragend dragEnd dragstart dragStart drop drop focus focus input input invalid invalid keydown keyDown keypress keyPress keyup keyUp mousedown mouseDown mouseup mouseUp paste paste pause pause play play pointercancel pointerCancel pointerdown pointerDown pointerup pointerUp ratechange rateChange reset reset seeked seeked submit submit touchcancel touchCancel touchend touchEnd touchstart touchStart volumechange volumeChange".split(" "), 0), qo("drag drag dragenter dragEnter dragexit dragExit dragleave dragLeave dragover dragOver mousemove mouseMove mouseout mouseOut mouseover mouseOver pointermove pointerMove pointerout pointerOut pointerover pointerOver scroll scroll toggle toggle touchmove touchMove wheel wheel".split(" "), 1), qo(Pa, 2);
        for (var xi = "change selectionchange textInput compositionstart compositionend compositionupdate".split(" "), Ko = 0; Ko < xi.length; Ko++) Rr.set(xi[Ko], 0);
        var Na = E.unstable_UserBlockingPriority, Da = E.unstable_runWithPriority, To = !0;
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
              r = Ra.bind(null, t, 1, e);
              break;
            default:
              r = Oo.bind(null, t, 1, e);
          }
          n ? e.addEventListener(t, r, !0) : e.addEventListener(t, r, !1);
        }
        function eo(e, t, n, r) {
          Se || ke();
          var a = Oo, p = Se;
          Se = !0;
          try {
            Te(a, e, t, n, r);
          } finally {
            (Se = p) || Je();
          }
        }
        function Ra(e, t, n, r) {
          Da(Na, Oo.bind(null, e, t, n, r));
        }
        function Oo(e, t, n, r) {
          if (To) if (0 < Ut.length && -1 < Bn.indexOf(e)) e = So(null, e, t, n, r), Ut.push(e);
          else {
            var a = Ir(e, t, n, r);
            if (a === null) wn(e, r);
            else if (-1 < Bn.indexOf(e)) e = So(a, e, t, n, r), Ut.push(e);
            else if (!function(p, w, T, Z, q) {
              switch (w) {
                case "focus":
                  return Wt = Nr(Wt, p, w, T, Z, q), !0;
                case "dragenter":
                  return on = Nr(on, p, w, T, Z, q), !0;
                case "mouseover":
                  return Kn = Nr(Kn, p, w, T, Z, q), !0;
                case "pointerover":
                  var ge = q.pointerId;
                  return fr.set(ge, Nr(fr.get(ge) || null, p, w, T, Z, q)), !0;
                case "gotpointercapture":
                  return ge = q.pointerId, Zr.set(ge, Nr(Zr.get(ge) || null, p, w, T, Z, q)), !0;
              }
              return !1;
            }(a, e, t, n, r)) {
              wn(e, r), e = Dn(e, r, null, t);
              try {
                X(rn, e);
              } finally {
                cr(e);
              }
            }
          }
        }
        function Ir(e, t, n, r) {
          if ((n = Mr(n = nn(r))) !== null) {
            var a = Nn(n);
            if (a === null) n = null;
            else {
              var p = a.tag;
              if (p === 13) {
                if ((n = Eo(a)) !== null) return n;
                n = null;
              } else if (p === 3) {
                if (a.stateNode.hydrate) return a.tag === 3 ? a.stateNode.containerInfo : null;
                n = null;
              } else a !== n && (n = null);
            }
          }
          e = Dn(e, r, n, t);
          try {
            X(rn, e);
          } finally {
            cr(e);
          }
          return null;
        }
        var to = { animationIterationCount: !0, borderImageOutset: !0, borderImageSlice: !0, borderImageWidth: !0, boxFlex: !0, boxFlexGroup: !0, boxOrdinalGroup: !0, columnCount: !0, columns: !0, flex: !0, flexGrow: !0, flexPositive: !0, flexShrink: !0, flexNegative: !0, flexOrder: !0, gridArea: !0, gridRow: !0, gridRowEnd: !0, gridRowSpan: !0, gridRowStart: !0, gridColumn: !0, gridColumnEnd: !0, gridColumnSpan: !0, gridColumnStart: !0, fontWeight: !0, lineClamp: !0, lineHeight: !0, opacity: !0, order: !0, orphans: !0, tabSize: !0, widows: !0, zIndex: !0, zoom: !0, fillOpacity: !0, floodOpacity: !0, stopOpacity: !0, strokeDasharray: !0, strokeDashoffset: !0, strokeMiterlimit: !0, strokeOpacity: !0, strokeWidth: !0 }, Ia = ["Webkit", "ms", "Moz", "O"];
        function Si(e, t, n) {
          return t == null || typeof t == "boolean" || t === "" ? "" : n || typeof t != "number" || t === 0 || to.hasOwnProperty(e) && to[e] ? ("" + t).trim() : t + "px";
        }
        function Ci(e, t) {
          for (var n in e = e.style, t) if (t.hasOwnProperty(n)) {
            var r = n.indexOf("--") === 0, a = Si(n, t[n], r);
            n === "float" && (n = "cssFloat"), r ? e.setProperty(n, a) : e[n] = a;
          }
        }
        Object.keys(to).forEach(function(e) {
          Ia.forEach(function(t) {
            t = t + e.charAt(0).toUpperCase() + e.substring(1), to[t] = to[e];
          });
        });
        var Ti = o({ menuitem: !0 }, { area: !0, base: !0, br: !0, col: !0, embed: !0, hr: !0, img: !0, input: !0, keygen: !0, link: !0, meta: !0, param: !0, source: !0, track: !0, wbr: !0 });
        function Qo(e, t) {
          if (t) {
            if (Ti[e] && (t.children != null || t.dangerouslySetInnerHTML != null)) throw Error(g(137, e, ""));
            if (t.dangerouslySetInnerHTML != null) {
              if (t.children != null) throw Error(g(60));
              if (typeof t.dangerouslySetInnerHTML != "object" || !("__html" in t.dangerouslySetInnerHTML)) throw Error(g(61));
            }
            if (t.style != null && typeof t.style != "object") throw Error(g(62, ""));
          }
        }
        function Go(e, t) {
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
        var Oi = W;
        function Hn(e, t) {
          var n = un(e = e.nodeType === 9 || e.nodeType === 11 ? e : e.ownerDocument);
          t = se[t];
          for (var r = 0; r < t.length; r++) yt(t[r], e, n);
        }
        function Po() {
        }
        function Xo(e) {
          if ((e = e || (typeof document < "u" ? document : void 0)) === void 0) return null;
          try {
            return e.activeElement || e.body;
          } catch {
            return e.body;
          }
        }
        function Pi(e) {
          for (; e && e.firstChild; ) e = e.firstChild;
          return e;
        }
        function Ni(e, t) {
          var n, r = Pi(e);
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
            r = Pi(r);
          }
        }
        function Di() {
          for (var e = window, t = Xo(); t instanceof e.HTMLIFrameElement; ) {
            try {
              var n = typeof t.contentWindow.location.href == "string";
            } catch {
              n = !1;
            }
            if (!n) break;
            t = Xo((e = t.contentWindow).document);
          }
          return t;
        }
        function Zo(e) {
          var t = e && e.nodeName && e.nodeName.toLowerCase();
          return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
        }
        var Jo = null, ei = null;
        function Ri(e, t) {
          switch (e) {
            case "button":
            case "input":
            case "select":
            case "textarea":
              return !!t.autoFocus;
          }
          return !1;
        }
        function ti(e, t) {
          return e === "textarea" || e === "option" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
        }
        var ni = typeof setTimeout == "function" ? setTimeout : void 0, Ii = typeof clearTimeout == "function" ? clearTimeout : void 0;
        function Ar(e) {
          for (; e != null; e = e.nextSibling) {
            var t = e.nodeType;
            if (t === 1 || t === 3) break;
          }
          return e;
        }
        function Ai(e) {
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
        function Mr(e) {
          var t = e[Qn];
          if (t) return t;
          for (var n = e.parentNode; n; ) {
            if (t = n[ro] || n[Qn]) {
              if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = Ai(e); e !== null; ) {
                if (n = e[Qn]) return n;
                e = Ai(e);
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
          throw Error(g(33));
        }
        function ri(e) {
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
          if (n && typeof n != "function") throw Error(g(231, t, typeof n));
          return n;
        }
        function ji(e, t, n) {
          (t = Mi(e, n.dispatchConfig.phasedRegistrationNames[t])) && (n._dispatchListeners = Ue(n._dispatchListeners, t), n._dispatchInstances = Ue(n._dispatchInstances, e));
        }
        function Aa(e) {
          if (e && e.dispatchConfig.phasedRegistrationNames) {
            for (var t = e._targetInst, n = []; t; ) n.push(t), t = Rn(t);
            for (t = n.length; 0 < t--; ) ji(n[t], "captured", e);
            for (t = 0; t < n.length; t++) ji(n[t], "bubbled", e);
          }
        }
        function Do(e, t, n) {
          e && n && n.dispatchConfig.registrationName && (t = Mi(e, n.dispatchConfig.registrationName)) && (n._dispatchListeners = Ue(n._dispatchListeners, t), n._dispatchInstances = Ue(n._dispatchInstances, e));
        }
        function Ma(e) {
          e && e.dispatchConfig.registrationName && Do(e._targetInst, null, e);
        }
        function jr(e) {
          qn(e, Aa);
        }
        var hr = null, oi = null, Ro = null;
        function zi() {
          if (Ro) return Ro;
          var e, t, n = oi, r = n.length, a = "value" in hr ? hr.value : hr.textContent, p = a.length;
          for (e = 0; e < r && n[e] === a[e]; e++) ;
          var w = r - e;
          for (t = 1; t <= w && n[r - t] === a[p - t]; t++) ;
          return Ro = a.slice(e, 1 < t ? 1 - t : void 0);
        }
        function Io() {
          return !0;
        }
        function Ao() {
          return !1;
        }
        function an(e, t, n, r) {
          for (var a in this.dispatchConfig = e, this._targetInst = t, this.nativeEvent = n, e = this.constructor.Interface) e.hasOwnProperty(a) && ((t = e[a]) ? this[a] = t(n) : a === "target" ? this.target = r : this[a] = n[a]);
          return this.isDefaultPrevented = (n.defaultPrevented != null ? n.defaultPrevented : n.returnValue === !1) ? Io : Ao, this.isPropagationStopped = Ao, this;
        }
        function Li(e, t, n, r) {
          if (this.eventPool.length) {
            var a = this.eventPool.pop();
            return this.call(a, e, t, n, r), a;
          }
          return new this(e, t, n, r);
        }
        function $e(e) {
          if (!(e instanceof this)) throw Error(g(279));
          e.destructor(), 10 > this.eventPool.length && this.eventPool.push(e);
        }
        function _(e) {
          e.eventPool = [], e.getPooled = Li, e.release = $e;
        }
        o(an.prototype, { preventDefault: function() {
          this.defaultPrevented = !0;
          var e = this.nativeEvent;
          e && (e.preventDefault ? e.preventDefault() : typeof e.returnValue != "unknown" && (e.returnValue = !1), this.isDefaultPrevented = Io);
        }, stopPropagation: function() {
          var e = this.nativeEvent;
          e && (e.stopPropagation ? e.stopPropagation() : typeof e.cancelBubble != "unknown" && (e.cancelBubble = !0), this.isPropagationStopped = Io);
        }, persist: function() {
          this.isPersistent = Io;
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
          var a = new t();
          return o(a, n.prototype), n.prototype = a, n.prototype.constructor = n, n.Interface = o({}, r.Interface, e), n.extend = r.extend, _(n), n;
        }, _(an);
        var s = an.extend({ data: null }), d = an.extend({ data: null }), h = [9, 13, 27, 32], S = te && "CompositionEvent" in window, O = null;
        te && "documentMode" in document && (O = document.documentMode);
        var L = te && "TextEvent" in window && !O, ne = te && (!S || O && 8 < O && 11 >= O), fe = " ", pe = { beforeInput: { phasedRegistrationNames: { bubbled: "onBeforeInput", captured: "onBeforeInputCapture" }, dependencies: ["compositionend", "keypress", "textInput", "paste"] }, compositionEnd: { phasedRegistrationNames: { bubbled: "onCompositionEnd", captured: "onCompositionEndCapture" }, dependencies: "blur compositionend keydown keypress keyup mousedown".split(" ") }, compositionStart: { phasedRegistrationNames: { bubbled: "onCompositionStart", captured: "onCompositionStartCapture" }, dependencies: "blur compositionstart keydown keypress keyup mousedown".split(" ") }, compositionUpdate: { phasedRegistrationNames: { bubbled: "onCompositionUpdate", captured: "onCompositionUpdateCapture" }, dependencies: "blur compositionupdate keydown keypress keyup mousedown".split(" ") } }, _e = !1;
        function Ne(e, t) {
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
        function Be(e) {
          return typeof (e = e.detail) == "object" && "data" in e ? e.data : null;
        }
        var Ie = !1, Ke = { eventTypes: pe, extractEvents: function(e, t, n, r) {
          var a;
          if (S) e: {
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
          else Ie ? Ne(e, n) && (p = pe.compositionEnd) : e === "keydown" && n.keyCode === 229 && (p = pe.compositionStart);
          return p ? (ne && n.locale !== "ko" && (Ie || p !== pe.compositionStart ? p === pe.compositionEnd && Ie && (a = zi()) : (oi = "value" in (hr = r) ? hr.value : hr.textContent, Ie = !0)), p = s.getPooled(p, t, n, r), (a || (a = Be(n)) !== null) && (p.data = a), jr(p), a = p) : a = null, (e = L ? function(w, T) {
            switch (w) {
              case "compositionend":
                return Be(T);
              case "keypress":
                return T.which !== 32 ? null : (_e = !0, fe);
              case "textInput":
                return (w = T.data) === fe && _e ? null : w;
              default:
                return null;
            }
          }(e, n) : function(w, T) {
            if (Ie) return w === "compositionend" || !S && Ne(w, T) ? (w = zi(), Ro = oi = hr = null, Ie = !1, w) : null;
            switch (w) {
              case "paste":
                return null;
              case "keypress":
                if (!(T.ctrlKey || T.altKey || T.metaKey) || T.ctrlKey && T.altKey) {
                  if (T.char && 1 < T.char.length) return T.char;
                  if (T.which) return String.fromCharCode(T.which);
                }
                return null;
              case "compositionend":
                return ne && T.locale !== "ko" ? null : T.data;
              default:
                return null;
            }
          }(e, n)) ? ((t = d.getPooled(pe.beforeInput, t, n, r)).data = e, jr(t)) : t = null, a === null ? t : t === null ? a : [a, t];
        } }, Me = { color: !0, date: !0, datetime: !0, "datetime-local": !0, email: !0, month: !0, number: !0, password: !0, range: !0, search: !0, tel: !0, text: !0, time: !0, url: !0, week: !0 };
        function Fe(e) {
          var t = e && e.nodeName && e.nodeName.toLowerCase();
          return t === "input" ? !!Me[e.type] : t === "textarea";
        }
        var et = { change: { phasedRegistrationNames: { bubbled: "onChange", captured: "onChangeCapture" }, dependencies: "blur change click focus input keydown keyup selectionchange".split(" ") } };
        function Ye(e, t, n) {
          return (e = an.getPooled(et.change, e, t, n)).type = "change", D(n), jr(e), e;
        }
        var Le = null, dt = null;
        function Dt(e) {
          At(e);
        }
        function Mt(e) {
          if (ut(Gn(e))) return e;
        }
        function jt(e, t) {
          if (e === "change") return t;
        }
        var Et = !1;
        function zt() {
          Le && (Le.detachEvent("onpropertychange", ft), dt = Le = null);
        }
        function ft(e) {
          if (e.propertyName === "value" && Mt(dt)) if (e = Ye(dt, e, nn(e)), Se) At(e);
          else {
            Se = !0;
            try {
              be(Dt, e);
            } finally {
              Se = !1, Je();
            }
          }
        }
        function In(e, t, n) {
          e === "focus" ? (zt(), dt = n, (Le = t).attachEvent("onpropertychange", ft)) : e === "blur" && zt();
        }
        function lt(e) {
          if (e === "selectionchange" || e === "keyup" || e === "keydown") return Mt(dt);
        }
        function An(e, t) {
          if (e === "click") return Mt(t);
        }
        function Wn(e, t) {
          if (e === "input" || e === "change") return Mt(t);
        }
        te && (Et = Ht("input") && (!document.documentMode || 9 < document.documentMode));
        var zr = { eventTypes: et, _isInputEventSupported: Et, extractEvents: function(e, t, n, r) {
          var a = t ? Gn(t) : window, p = a.nodeName && a.nodeName.toLowerCase();
          if (p === "select" || p === "input" && a.type === "file") var w = jt;
          else if (Fe(a)) if (Et) w = Wn;
          else {
            w = lt;
            var T = In;
          }
          else (p = a.nodeName) && p.toLowerCase() === "input" && (a.type === "checkbox" || a.type === "radio") && (w = An);
          if (w && (w = w(e, t))) return Ye(w, n, r);
          T && T(e, a, t), e === "blur" && (e = a._wrapperState) && e.controlled && a.type === "number" && Cn(a, "number", a.value);
        } }, xt = an.extend({ view: null, detail: null }), io = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
        function Mn(e) {
          var t = this.nativeEvent;
          return t.getModifierState ? t.getModifierState(e) : !!(e = io[e]) && !!t[e];
        }
        function $t() {
          return Mn;
        }
        var dn = 0, Xn = 0, Gt = !1, fn = !1, Lr = xt.extend({ screenX: null, screenY: null, clientX: null, clientY: null, pageX: null, pageY: null, ctrlKey: null, shiftKey: null, altKey: null, metaKey: null, getModifierState: $t, button: null, buttons: null, relatedTarget: function(e) {
          return e.relatedTarget || (e.fromElement === e.srcElement ? e.toElement : e.fromElement);
        }, movementX: function(e) {
          if ("movementX" in e) return e.movementX;
          var t = dn;
          return dn = e.screenX, Gt ? e.type === "mousemove" ? e.screenX - t : 0 : (Gt = !0, 0);
        }, movementY: function(e) {
          if ("movementY" in e) return e.movementY;
          var t = Xn;
          return Xn = e.screenY, fn ? e.type === "mousemove" ? e.screenY - t : 0 : (fn = !0, 0);
        } }), ii = Lr.extend({ pointerId: null, width: null, height: null, pressure: null, tangentialPressure: null, tiltX: null, tiltY: null, twist: null, pointerType: null, isPrimary: null }), Ur = { mouseEnter: { registrationName: "onMouseEnter", dependencies: ["mouseout", "mouseover"] }, mouseLeave: { registrationName: "onMouseLeave", dependencies: ["mouseout", "mouseover"] }, pointerEnter: { registrationName: "onPointerEnter", dependencies: ["pointerout", "pointerover"] }, pointerLeave: { registrationName: "onPointerLeave", dependencies: ["pointerout", "pointerover"] } }, Mo = { eventTypes: Ur, extractEvents: function(e, t, n, r, a) {
          var p = e === "mouseover" || e === "pointerover", w = e === "mouseout" || e === "pointerout";
          if (p && (32 & a) == 0 && (n.relatedTarget || n.fromElement) || !w && !p || (p = r.window === r ? r : (p = r.ownerDocument) ? p.defaultView || p.parentWindow : window, w ? (w = t, (t = (t = n.relatedTarget || n.toElement) ? Mr(t) : null) !== null && (t !== Nn(t) || t.tag !== 5 && t.tag !== 6) && (t = null)) : w = null, w === t)) return null;
          if (e === "mouseout" || e === "mouseover") var T = Lr, Z = Ur.mouseLeave, q = Ur.mouseEnter, ge = "mouse";
          else e !== "pointerout" && e !== "pointerover" || (T = ii, Z = Ur.pointerLeave, q = Ur.pointerEnter, ge = "pointer");
          if (e = w == null ? p : Gn(w), p = t == null ? p : Gn(t), (Z = T.getPooled(Z, w, n, r)).type = ge + "leave", Z.target = e, Z.relatedTarget = p, (n = T.getPooled(q, t, n, r)).type = ge + "enter", n.target = p, n.relatedTarget = e, ge = t, (r = w) && ge) e: {
            for (q = ge, w = 0, e = T = r; e; e = Rn(e)) w++;
            for (e = 0, t = q; t; t = Rn(t)) e++;
            for (; 0 < w - e; ) T = Rn(T), w--;
            for (; 0 < e - w; ) q = Rn(q), e--;
            for (; w--; ) {
              if (T === q || T === q.alternate) break e;
              T = Rn(T), q = Rn(q);
            }
            T = null;
          }
          else T = null;
          for (q = T, T = []; r && r !== q && ((w = r.alternate) === null || w !== q); ) T.push(r), r = Rn(r);
          for (r = []; ge && ge !== q && ((w = ge.alternate) === null || w !== q); ) r.push(ge), ge = Rn(ge);
          for (ge = 0; ge < T.length; ge++) Do(T[ge], "bubbled", Z);
          for (ge = r.length; 0 < ge--; ) Do(r[ge], "captured", n);
          return (64 & a) == 0 ? [Z] : [Z, n];
        } }, mr = typeof Object.is == "function" ? Object.is : function(e, t) {
          return e === t && (e !== 0 || 1 / e == 1 / t) || e != e && t != t;
        }, Ui = Object.prototype.hasOwnProperty;
        function gr(e, t) {
          if (mr(e, t)) return !0;
          if (typeof e != "object" || e === null || typeof t != "object" || t === null) return !1;
          var n = Object.keys(e), r = Object.keys(t);
          if (n.length !== r.length) return !1;
          for (r = 0; r < n.length; r++) if (!Ui.call(t, n[r]) || !mr(e[n[r]], t[n[r]])) return !1;
          return !0;
        }
        var jo = te && "documentMode" in document && 11 >= document.documentMode, ai = { select: { phasedRegistrationNames: { bubbled: "onSelect", captured: "onSelectCapture" }, dependencies: "blur contextmenu dragend focus keydown keyup mousedown mouseup selectionchange".split(" ") } }, Zn = null, ao = null, kn = null, so = !1;
        function Ps(e, t) {
          var n = t.window === t ? t.document : t.nodeType === 9 ? t : t.ownerDocument;
          return so || Zn == null || Zn !== Xo(n) ? null : ("selectionStart" in (n = Zn) && Zo(n) ? n = { start: n.selectionStart, end: n.selectionEnd } : n = { anchorNode: (n = (n.ownerDocument && n.ownerDocument.defaultView || window).getSelection()).anchorNode, anchorOffset: n.anchorOffset, focusNode: n.focusNode, focusOffset: n.focusOffset }, kn && gr(kn, n) ? null : (kn = n, (e = an.getPooled(ai.select, ao, e, t)).type = "select", e.target = Zn, jr(e), e));
        }
        var rc = { eventTypes: ai, extractEvents: function(e, t, n, r, a, p) {
          if (!(p = !(a = p || (r.window === r ? r.document : r.nodeType === 9 ? r : r.ownerDocument)))) {
            e: {
              a = un(a), p = se.onSelect;
              for (var w = 0; w < p.length; w++) if (!a.has(p[w])) {
                a = !1;
                break e;
              }
              a = !0;
            }
            p = !a;
          }
          if (p) return null;
          switch (a = t ? Gn(t) : window, e) {
            case "focus":
              (Fe(a) || a.contentEditable === "true") && (Zn = a, ao = t, kn = null);
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
              return so = !1, Ps(n, r);
            case "selectionchange":
              if (jo) break;
            case "keydown":
            case "keyup":
              return Ps(n, r);
          }
          return null;
        } }, oc = an.extend({ animationName: null, elapsedTime: null, pseudoElement: null }), ic = an.extend({ clipboardData: function(e) {
          return "clipboardData" in e ? e.clipboardData : window.clipboardData;
        } }), ac = xt.extend({ relatedTarget: null });
        function Fi(e) {
          var t = e.keyCode;
          return "charCode" in e ? (e = e.charCode) === 0 && t === 13 && (e = 13) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
        }
        var sc = { Esc: "Escape", Spacebar: " ", Left: "ArrowLeft", Up: "ArrowUp", Right: "ArrowRight", Down: "ArrowDown", Del: "Delete", Win: "OS", Menu: "ContextMenu", Apps: "ContextMenu", Scroll: "ScrollLock", MozPrintableKey: "Unidentified" }, lc = { 8: "Backspace", 9: "Tab", 12: "Clear", 13: "Enter", 16: "Shift", 17: "Control", 18: "Alt", 19: "Pause", 20: "CapsLock", 27: "Escape", 32: " ", 33: "PageUp", 34: "PageDown", 35: "End", 36: "Home", 37: "ArrowLeft", 38: "ArrowUp", 39: "ArrowRight", 40: "ArrowDown", 45: "Insert", 46: "Delete", 112: "F1", 113: "F2", 114: "F3", 115: "F4", 116: "F5", 117: "F6", 118: "F7", 119: "F8", 120: "F9", 121: "F10", 122: "F11", 123: "F12", 144: "NumLock", 145: "ScrollLock", 224: "Meta" }, cc = xt.extend({ key: function(e) {
          if (e.key) {
            var t = sc[e.key] || e.key;
            if (t !== "Unidentified") return t;
          }
          return e.type === "keypress" ? (e = Fi(e)) === 13 ? "Enter" : String.fromCharCode(e) : e.type === "keydown" || e.type === "keyup" ? lc[e.keyCode] || "Unidentified" : "";
        }, location: null, ctrlKey: null, shiftKey: null, altKey: null, metaKey: null, repeat: null, locale: null, getModifierState: $t, charCode: function(e) {
          return e.type === "keypress" ? Fi(e) : 0;
        }, keyCode: function(e) {
          return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
        }, which: function(e) {
          return e.type === "keypress" ? Fi(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
        } }), uc = Lr.extend({ dataTransfer: null }), dc = xt.extend({ touches: null, targetTouches: null, changedTouches: null, altKey: null, metaKey: null, ctrlKey: null, shiftKey: null, getModifierState: $t }), fc = an.extend({ propertyName: null, elapsedTime: null, pseudoElement: null }), pc = Lr.extend({ deltaX: function(e) {
          return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
        }, deltaY: function(e) {
          return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
        }, deltaZ: null, deltaMode: null }), hc = { eventTypes: _i, extractEvents: function(e, t, n, r) {
          var a = Ei.get(e);
          if (!a) return null;
          switch (e) {
            case "keypress":
              if (Fi(n) === 0) return null;
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
              e = dc;
              break;
            case tn:
            case ht:
            case Bt:
              e = oc;
              break;
            case Pn:
              e = fc;
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
              e = ii;
              break;
            default:
              e = an;
          }
          return jr(t = e.getPooled(a, t, n, r)), t;
        } };
        if (M) throw Error(g(101));
        M = Array.prototype.slice.call("ResponderEventPlugin SimpleEventPlugin EnterLeaveEventPlugin ChangeEventPlugin SelectEventPlugin BeforeInputEventPlugin".split(" ")), I(), K = ri, j = oo, V = Gn, le({ SimpleEventPlugin: hc, EnterLeaveEventPlugin: Mo, ChangeEventPlugin: zr, SelectEventPlugin: rc, BeforeInputEventPlugin: Ke });
        var ja = [], zo = -1;
        function vt(e) {
          0 > zo || (e.current = ja[zo], ja[zo] = null, zo--);
        }
        function St(e, t) {
          zo++, ja[zo] = e.current, e.current = t;
        }
        var Fr = {}, Xt = { current: Fr }, pn = { current: !1 }, lo = Fr;
        function Lo(e, t) {
          var n = e.type.contextTypes;
          if (!n) return Fr;
          var r = e.stateNode;
          if (r && r.__reactInternalMemoizedUnmaskedChildContext === t) return r.__reactInternalMemoizedMaskedChildContext;
          var a, p = {};
          for (a in n) p[a] = t[a];
          return r && ((e = e.stateNode).__reactInternalMemoizedUnmaskedChildContext = t, e.__reactInternalMemoizedMaskedChildContext = p), p;
        }
        function hn(e) {
          return (e = e.childContextTypes) != null;
        }
        function Vi() {
          vt(pn), vt(Xt);
        }
        function Ns(e, t, n) {
          if (Xt.current !== Fr) throw Error(g(168));
          St(Xt, t), St(pn, n);
        }
        function Ds(e, t, n) {
          var r = e.stateNode;
          if (e = t.childContextTypes, typeof r.getChildContext != "function") return n;
          for (var a in r = r.getChildContext()) if (!(a in e)) throw Error(g(108, Yt(t) || "Unknown", a));
          return o({}, n, {}, r);
        }
        function Bi(e) {
          return e = (e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext || Fr, lo = Xt.current, St(Xt, e), St(pn, pn.current), !0;
        }
        function Rs(e, t, n) {
          var r = e.stateNode;
          if (!r) throw Error(g(169));
          n ? (e = Ds(e, t, lo), r.__reactInternalMemoizedMergedChildContext = e, vt(pn), vt(Xt), St(Xt, e)) : vt(pn), St(pn, n);
        }
        var mc = E.unstable_runWithPriority, za = E.unstable_scheduleCallback, Is = E.unstable_cancelCallback, As = E.unstable_requestPaint, La = E.unstable_now, gc = E.unstable_getCurrentPriorityLevel, Hi = E.unstable_ImmediatePriority, Ms = E.unstable_UserBlockingPriority, js = E.unstable_NormalPriority, zs = E.unstable_LowPriority, Ls = E.unstable_IdlePriority, Us = {}, bc = E.unstable_shouldYield, yc = As !== void 0 ? As : function() {
        }, br = null, Wi = null, Ua = !1, Fs = La(), jn = 1e4 > Fs ? La : function() {
          return La() - Fs;
        };
        function $i() {
          switch (gc()) {
            case Hi:
              return 99;
            case Ms:
              return 98;
            case js:
              return 97;
            case zs:
              return 96;
            case Ls:
              return 95;
            default:
              throw Error(g(332));
          }
        }
        function Vs(e) {
          switch (e) {
            case 99:
              return Hi;
            case 98:
              return Ms;
            case 97:
              return js;
            case 96:
              return zs;
            case 95:
              return Ls;
            default:
              throw Error(g(332));
          }
        }
        function Vr(e, t) {
          return e = Vs(e), mc(e, t);
        }
        function Bs(e, t, n) {
          return e = Vs(e), za(e, t, n);
        }
        function Hs(e) {
          return br === null ? (br = [e], Wi = za(Hi, Ws)) : br.push(e), Us;
        }
        function Jn() {
          if (Wi !== null) {
            var e = Wi;
            Wi = null, Is(e);
          }
          Ws();
        }
        function Ws() {
          if (!Ua && br !== null) {
            Ua = !0;
            var e = 0;
            try {
              var t = br;
              Vr(99, function() {
                for (; e < t.length; e++) {
                  var n = t[e];
                  do
                    n = n(!0);
                  while (n !== null);
                }
              }), br = null;
            } catch (n) {
              throw br !== null && (br = br.slice(e + 1)), za(Hi, Jn), n;
            } finally {
              Ua = !1;
            }
          }
        }
        function Yi(e, t, n) {
          return 1073741821 - (1 + ((1073741821 - e + t / 10) / (n /= 10) | 0)) * n;
        }
        function $n(e, t) {
          if (e && e.defaultProps) for (var n in t = o({}, t), e = e.defaultProps) t[n] === void 0 && (t[n] = e[n]);
          return t;
        }
        var qi = { current: null }, Ki = null, Uo = null, Qi = null;
        function Fa() {
          Qi = Uo = Ki = null;
        }
        function Va(e) {
          var t = qi.current;
          vt(qi), e.type._context._currentValue = t;
        }
        function $s(e, t) {
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
        function Fo(e, t) {
          Ki = e, Qi = Uo = null, (e = e.dependencies) !== null && e.firstContext !== null && (e.expirationTime >= t && (tr = !0), e.firstContext = null);
        }
        function zn(e, t) {
          if (Qi !== e && t !== !1 && t !== 0) if (typeof t == "number" && t !== 1073741823 || (Qi = e, t = 1073741823), t = { context: e, observedBits: t, next: null }, Uo === null) {
            if (Ki === null) throw Error(g(308));
            Uo = t, Ki.dependencies = { expirationTime: 0, firstContext: t, responders: null };
          } else Uo = Uo.next = t;
          return e._currentValue;
        }
        var Br = !1;
        function Ba(e) {
          e.updateQueue = { baseState: e.memoizedState, baseQueue: null, shared: { pending: null }, effects: null };
        }
        function Ha(e, t) {
          e = e.updateQueue, t.updateQueue === e && (t.updateQueue = { baseState: e.baseState, baseQueue: e.baseQueue, shared: e.shared, effects: e.effects });
        }
        function Hr(e, t) {
          return (e = { expirationTime: e, suspenseConfig: t, tag: 0, payload: null, callback: null, next: null }).next = e;
        }
        function Wr(e, t) {
          if ((e = e.updateQueue) !== null) {
            var n = (e = e.shared).pending;
            n === null ? t.next = t : (t.next = n.next, n.next = t), e.pending = t;
          }
        }
        function Ys(e, t) {
          var n = e.alternate;
          n !== null && Ha(n, e), (n = (e = e.updateQueue).baseQueue) === null ? (e.baseQueue = t.next = t, t.next = t) : (t.next = n.next, n.next = t);
        }
        function si(e, t, n, r) {
          var a = e.updateQueue;
          Br = !1;
          var p = a.baseQueue, w = a.shared.pending;
          if (w !== null) {
            if (p !== null) {
              var T = p.next;
              p.next = w.next, w.next = T;
            }
            p = w, a.shared.pending = null, (T = e.alternate) !== null && (T = T.updateQueue) !== null && (T.baseQueue = w);
          }
          if (p !== null) {
            T = p.next;
            var Z = a.baseState, q = 0, ge = null, De = null, He = null;
            if (T !== null) for (var ot = T; ; ) {
              if ((w = ot.expirationTime) < r) {
                var Fn = { expirationTime: ot.expirationTime, suspenseConfig: ot.suspenseConfig, tag: ot.tag, payload: ot.payload, callback: ot.callback, next: null };
                He === null ? (De = He = Fn, ge = Z) : He = He.next = Fn, w > q && (q = w);
              } else {
                He !== null && (He = He.next = { expirationTime: 1073741823, suspenseConfig: ot.suspenseConfig, tag: ot.tag, payload: ot.payload, callback: ot.callback, next: null }), Vl(w, ot.suspenseConfig);
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
                      Br = !0;
                  }
                }
                ot.callback !== null && (e.effectTag |= 32, (w = a.effects) === null ? a.effects = [ot] : w.push(ot));
              }
              if ((ot = ot.next) === null || ot === T) {
                if ((w = a.shared.pending) === null) break;
                ot = p.next = w.next, w.next = T, a.baseQueue = p = w, a.shared.pending = null;
              }
            }
            He === null ? ge = Z : He.next = De, a.baseState = ge, a.baseQueue = He, ka(q), e.expirationTime = q, e.memoizedState = Z;
          }
        }
        function qs(e, t, n) {
          if (e = t.effects, t.effects = null, e !== null) for (t = 0; t < e.length; t++) {
            var r = e[t], a = r.callback;
            if (a !== null) {
              if (r.callback = null, r = a, a = n, typeof r != "function") throw Error(g(191, r));
              r.call(a);
            }
          }
        }
        var li = he.ReactCurrentBatchConfig, Ks = new c.Component().refs;
        function Gi(e, t, n, r) {
          n = (n = n(r, t = e.memoizedState)) == null ? t : o({}, t, n), e.memoizedState = n, e.expirationTime === 0 && (e.updateQueue.baseState = n);
        }
        var Xi = { isMounted: function(e) {
          return !!(e = e._reactInternalFiber) && Nn(e) === e;
        }, enqueueSetState: function(e, t, n) {
          e = e._reactInternalFiber;
          var r = nr(), a = li.suspense;
          (a = Hr(r = mo(r, e, a), a)).payload = t, n != null && (a.callback = n), Wr(e, a), Kr(e, r);
        }, enqueueReplaceState: function(e, t, n) {
          e = e._reactInternalFiber;
          var r = nr(), a = li.suspense;
          (a = Hr(r = mo(r, e, a), a)).tag = 1, a.payload = t, n != null && (a.callback = n), Wr(e, a), Kr(e, r);
        }, enqueueForceUpdate: function(e, t) {
          e = e._reactInternalFiber;
          var n = nr(), r = li.suspense;
          (r = Hr(n = mo(n, e, r), r)).tag = 2, t != null && (r.callback = t), Wr(e, r), Kr(e, n);
        } };
        function Qs(e, t, n, r, a, p, w) {
          return typeof (e = e.stateNode).shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, p, w) : !t.prototype || !t.prototype.isPureReactComponent || !gr(n, r) || !gr(a, p);
        }
        function Gs(e, t, n) {
          var r = !1, a = Fr, p = t.contextType;
          return typeof p == "object" && p !== null ? p = zn(p) : (a = hn(t) ? lo : Xt.current, p = (r = (r = t.contextTypes) != null) ? Lo(e, a) : Fr), t = new t(n, p), e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null, t.updater = Xi, e.stateNode = t, t._reactInternalFiber = e, r && ((e = e.stateNode).__reactInternalMemoizedUnmaskedChildContext = a, e.__reactInternalMemoizedMaskedChildContext = p), t;
        }
        function Xs(e, t, n, r) {
          e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, r), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, r), t.state !== e && Xi.enqueueReplaceState(t, t.state, null);
        }
        function Wa(e, t, n, r) {
          var a = e.stateNode;
          a.props = n, a.state = e.memoizedState, a.refs = Ks, Ba(e);
          var p = t.contextType;
          typeof p == "object" && p !== null ? a.context = zn(p) : (p = hn(t) ? lo : Xt.current, a.context = Lo(e, p)), si(e, n, a, r), a.state = e.memoizedState, typeof (p = t.getDerivedStateFromProps) == "function" && (Gi(e, t, p, n), a.state = e.memoizedState), typeof t.getDerivedStateFromProps == "function" || typeof a.getSnapshotBeforeUpdate == "function" || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (t = a.state, typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount(), t !== a.state && Xi.enqueueReplaceState(a, a.state, null), si(e, n, a, r), a.state = e.memoizedState), typeof a.componentDidMount == "function" && (e.effectTag |= 4);
        }
        var Zi = Array.isArray;
        function ci(e, t, n) {
          if ((e = n.ref) !== null && typeof e != "function" && typeof e != "object") {
            if (n._owner) {
              if (n = n._owner) {
                if (n.tag !== 1) throw Error(g(309));
                var r = n.stateNode;
              }
              if (!r) throw Error(g(147, e));
              var a = "" + e;
              return t !== null && t.ref !== null && typeof t.ref == "function" && t.ref._stringRef === a ? t.ref : ((t = function(p) {
                var w = r.refs;
                w === Ks && (w = r.refs = {}), p === null ? delete w[a] : w[a] = p;
              })._stringRef = a, t);
            }
            if (typeof e != "string") throw Error(g(284));
            if (!n._owner) throw Error(g(290, e));
          }
          return e;
        }
        function Ji(e, t) {
          if (e.type !== "textarea") throw Error(g(31, Object.prototype.toString.call(t) === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : t, ""));
        }
        function Zs(e) {
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
          function a(re, ee) {
            return (re = vo(re, ee)).index = 0, re.sibling = null, re;
          }
          function p(re, ee, ue) {
            return re.index = ue, e ? (ue = re.alternate) !== null ? (ue = ue.index) < ee ? (re.effectTag = 2, ee) : ue : (re.effectTag = 2, ee) : ee;
          }
          function w(re) {
            return e && re.alternate === null && (re.effectTag = 2), re;
          }
          function T(re, ee, ue, ve) {
            return ee === null || ee.tag !== 6 ? ((ee = ws(ue, re.mode, ve)).return = re, ee) : ((ee = a(ee, ue)).return = re, ee);
          }
          function Z(re, ee, ue, ve) {
            return ee !== null && ee.elementType === ue.type ? ((ve = a(ee, ue.props)).ref = ci(re, ee, ue), ve.return = re, ve) : ((ve = _a(ue.type, ue.key, ue.props, null, re.mode, ve)).ref = ci(re, ee, ue), ve.return = re, ve);
          }
          function q(re, ee, ue, ve) {
            return ee === null || ee.tag !== 4 || ee.stateNode.containerInfo !== ue.containerInfo || ee.stateNode.implementation !== ue.implementation ? ((ee = ks(ue, re.mode, ve)).return = re, ee) : ((ee = a(ee, ue.children || [])).return = re, ee);
          }
          function ge(re, ee, ue, ve, Ee) {
            return ee === null || ee.tag !== 7 ? ((ee = Qr(ue, re.mode, ve, Ee)).return = re, ee) : ((ee = a(ee, ue)).return = re, ee);
          }
          function De(re, ee, ue) {
            if (typeof ee == "string" || typeof ee == "number") return (ee = ws("" + ee, re.mode, ue)).return = re, ee;
            if (typeof ee == "object" && ee !== null) {
              switch (ee.$$typeof) {
                case We:
                  return (ue = _a(ee.type, ee.key, ee.props, null, re.mode, ue)).ref = ci(re, null, ee), ue.return = re, ue;
                case It:
                  return (ee = ks(ee, re.mode, ue)).return = re, ee;
              }
              if (Zi(ee) || en(ee)) return (ee = Qr(ee, re.mode, ue, null)).return = re, ee;
              Ji(re, ee);
            }
            return null;
          }
          function He(re, ee, ue, ve) {
            var Ee = ee !== null ? ee.key : null;
            if (typeof ue == "string" || typeof ue == "number") return Ee !== null ? null : T(re, ee, "" + ue, ve);
            if (typeof ue == "object" && ue !== null) {
              switch (ue.$$typeof) {
                case We:
                  return ue.key === Ee ? ue.type === wt ? ge(re, ee, ue.props.children, ve, Ee) : Z(re, ee, ue, ve) : null;
                case It:
                  return ue.key === Ee ? q(re, ee, ue, ve) : null;
              }
              if (Zi(ue) || en(ue)) return Ee !== null ? null : ge(re, ee, ue, ve, null);
              Ji(re, ue);
            }
            return null;
          }
          function ot(re, ee, ue, ve, Ee) {
            if (typeof ve == "string" || typeof ve == "number") return T(ee, re = re.get(ue) || null, "" + ve, Ee);
            if (typeof ve == "object" && ve !== null) {
              switch (ve.$$typeof) {
                case We:
                  return re = re.get(ve.key === null ? ue : ve.key) || null, ve.type === wt ? ge(ee, re, ve.props.children, Ee, ve.key) : Z(ee, re, ve, Ee);
                case It:
                  return q(ee, re = re.get(ve.key === null ? ue : ve.key) || null, ve, Ee);
              }
              if (Zi(ve) || en(ve)) return ge(ee, re = re.get(ue) || null, ve, Ee, null);
              Ji(ee, ve);
            }
            return null;
          }
          function Fn(re, ee, ue, ve) {
            for (var Ee = null, Oe = null, Ve = ee, at = ee = 0, Rt = null; Ve !== null && at < ue.length; at++) {
              Ve.index > at ? (Rt = Ve, Ve = null) : Rt = Ve.sibling;
              var Ze = He(re, Ve, ue[at], ve);
              if (Ze === null) {
                Ve === null && (Ve = Rt);
                break;
              }
              e && Ve && Ze.alternate === null && t(re, Ve), ee = p(Ze, ee, at), Oe === null ? Ee = Ze : Oe.sibling = Ze, Oe = Ze, Ve = Rt;
            }
            if (at === ue.length) return n(re, Ve), Ee;
            if (Ve === null) {
              for (; at < ue.length; at++) (Ve = De(re, ue[at], ve)) !== null && (ee = p(Ve, ee, at), Oe === null ? Ee = Ve : Oe.sibling = Ve, Oe = Ve);
              return Ee;
            }
            for (Ve = r(re, Ve); at < ue.length; at++) (Rt = ot(Ve, re, at, ue[at], ve)) !== null && (e && Rt.alternate !== null && Ve.delete(Rt.key === null ? at : Rt.key), ee = p(Rt, ee, at), Oe === null ? Ee = Rt : Oe.sibling = Rt, Oe = Rt);
            return e && Ve.forEach(function(Vt) {
              return t(re, Vt);
            }), Ee;
          }
          function ln(re, ee, ue, ve) {
            var Ee = en(ue);
            if (typeof Ee != "function") throw Error(g(150));
            if ((ue = Ee.call(ue)) == null) throw Error(g(151));
            for (var Oe = Ee = null, Ve = ee, at = ee = 0, Rt = null, Ze = ue.next(); Ve !== null && !Ze.done; at++, Ze = ue.next()) {
              Ve.index > at ? (Rt = Ve, Ve = null) : Rt = Ve.sibling;
              var Vt = He(re, Ve, Ze.value, ve);
              if (Vt === null) {
                Ve === null && (Ve = Rt);
                break;
              }
              e && Ve && Vt.alternate === null && t(re, Ve), ee = p(Vt, ee, at), Oe === null ? Ee = Vt : Oe.sibling = Vt, Oe = Vt, Ve = Rt;
            }
            if (Ze.done) return n(re, Ve), Ee;
            if (Ve === null) {
              for (; !Ze.done; at++, Ze = ue.next()) (Ze = De(re, Ze.value, ve)) !== null && (ee = p(Ze, ee, at), Oe === null ? Ee = Ze : Oe.sibling = Ze, Oe = Ze);
              return Ee;
            }
            for (Ve = r(re, Ve); !Ze.done; at++, Ze = ue.next()) (Ze = ot(Ve, re, at, Ze.value, ve)) !== null && (e && Ze.alternate !== null && Ve.delete(Ze.key === null ? at : Ze.key), ee = p(Ze, ee, at), Oe === null ? Ee = Ze : Oe.sibling = Ze, Oe = Ze);
            return e && Ve.forEach(function(kr) {
              return t(re, kr);
            }), Ee;
          }
          return function(re, ee, ue, ve) {
            var Ee = typeof ue == "object" && ue !== null && ue.type === wt && ue.key === null;
            Ee && (ue = ue.props.children);
            var Oe = typeof ue == "object" && ue !== null;
            if (Oe) switch (ue.$$typeof) {
              case We:
                e: {
                  for (Oe = ue.key, Ee = ee; Ee !== null; ) {
                    if (Ee.key === Oe) {
                      switch (Ee.tag) {
                        case 7:
                          if (ue.type === wt) {
                            n(re, Ee.sibling), (ee = a(Ee, ue.props.children)).return = re, re = ee;
                            break e;
                          }
                          break;
                        default:
                          if (Ee.elementType === ue.type) {
                            n(re, Ee.sibling), (ee = a(Ee, ue.props)).ref = ci(re, Ee, ue), ee.return = re, re = ee;
                            break e;
                          }
                      }
                      n(re, Ee);
                      break;
                    }
                    t(re, Ee), Ee = Ee.sibling;
                  }
                  ue.type === wt ? ((ee = Qr(ue.props.children, re.mode, ve, ue.key)).return = re, re = ee) : ((ve = _a(ue.type, ue.key, ue.props, null, re.mode, ve)).ref = ci(re, ee, ue), ve.return = re, re = ve);
                }
                return w(re);
              case It:
                e: {
                  for (Ee = ue.key; ee !== null; ) {
                    if (ee.key === Ee) {
                      if (ee.tag === 4 && ee.stateNode.containerInfo === ue.containerInfo && ee.stateNode.implementation === ue.implementation) {
                        n(re, ee.sibling), (ee = a(ee, ue.children || [])).return = re, re = ee;
                        break e;
                      }
                      n(re, ee);
                      break;
                    }
                    t(re, ee), ee = ee.sibling;
                  }
                  (ee = ks(ue, re.mode, ve)).return = re, re = ee;
                }
                return w(re);
            }
            if (typeof ue == "string" || typeof ue == "number") return ue = "" + ue, ee !== null && ee.tag === 6 ? (n(re, ee.sibling), (ee = a(ee, ue)).return = re, re = ee) : (n(re, ee), (ee = ws(ue, re.mode, ve)).return = re, re = ee), w(re);
            if (Zi(ue)) return Fn(re, ee, ue, ve);
            if (en(ue)) return ln(re, ee, ue, ve);
            if (Oe && Ji(re, ue), ue === void 0 && !Ee) switch (re.tag) {
              case 1:
              case 0:
                throw re = re.type, Error(g(152, re.displayName || re.name || "Component"));
            }
            return n(re, ee);
          };
        }
        var Vo = Zs(!0), $a = Zs(!1), ui = {}, er = { current: ui }, di = { current: ui }, fi = { current: ui };
        function co(e) {
          if (e === ui) throw Error(g(174));
          return e;
        }
        function Ya(e, t) {
          switch (St(fi, t), St(di, e), St(er, ui), e = t.nodeType) {
            case 9:
            case 11:
              t = (t = t.documentElement) ? t.namespaceURI : Ce(null, "");
              break;
            default:
              t = Ce(t = (e = e === 8 ? t.parentNode : t).namespaceURI || null, e = e.tagName);
          }
          vt(er), St(er, t);
        }
        function Bo() {
          vt(er), vt(di), vt(fi);
        }
        function Js(e) {
          co(fi.current);
          var t = co(er.current), n = Ce(t, e.type);
          t !== n && (St(di, e), St(er, n));
        }
        function qa(e) {
          di.current === e && (vt(er), vt(di));
        }
        var Ct = { current: 0 };
        function ea(e) {
          for (var t = e; t !== null; ) {
            if (t.tag === 13) {
              var n = t.memoizedState;
              if (n !== null && ((n = n.dehydrated) === null || n.data === "$?" || n.data === "$!")) return t;
            } else if (t.tag === 19 && t.memoizedProps.revealOrder !== void 0) {
              if ((64 & t.effectTag) != 0) return t;
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
        function Ka(e, t) {
          return { responder: e, props: t };
        }
        var ta = he.ReactCurrentDispatcher, Ln = he.ReactCurrentBatchConfig, $r = 0, Lt = null, sn = null, Zt = null, na = !1;
        function _n() {
          throw Error(g(321));
        }
        function Qa(e, t) {
          if (t === null) return !1;
          for (var n = 0; n < t.length && n < e.length; n++) if (!mr(e[n], t[n])) return !1;
          return !0;
        }
        function Ga(e, t, n, r, a, p) {
          if ($r = p, Lt = t, t.memoizedState = null, t.updateQueue = null, t.expirationTime = 0, ta.current = e === null || e.memoizedState === null ? vc : wc, e = n(r, a), t.expirationTime === $r) {
            p = 0;
            do {
              if (t.expirationTime = 0, !(25 > p)) throw Error(g(301));
              p += 1, Zt = sn = null, t.updateQueue = null, ta.current = kc, e = n(r, a);
            } while (t.expirationTime === $r);
          }
          if (ta.current = sa, t = sn !== null && sn.next !== null, $r = 0, Zt = sn = Lt = null, na = !1, t) throw Error(g(300));
          return e;
        }
        function Ho() {
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
            if (e === null) throw Error(g(310));
            e = { memoizedState: (sn = e).memoizedState, baseState: sn.baseState, baseQueue: sn.baseQueue, queue: sn.queue, next: null }, Zt === null ? Lt.memoizedState = Zt = e : Zt = Zt.next = e;
          }
          return Zt;
        }
        function uo(e, t) {
          return typeof t == "function" ? t(e) : t;
        }
        function ra(e) {
          var t = Wo(), n = t.queue;
          if (n === null) throw Error(g(311));
          n.lastRenderedReducer = e;
          var r = sn, a = r.baseQueue, p = n.pending;
          if (p !== null) {
            if (a !== null) {
              var w = a.next;
              a.next = p.next, p.next = w;
            }
            r.baseQueue = a = p, n.pending = null;
          }
          if (a !== null) {
            a = a.next, r = r.baseState;
            var T = w = p = null, Z = a;
            do {
              var q = Z.expirationTime;
              if (q < $r) {
                var ge = { expirationTime: Z.expirationTime, suspenseConfig: Z.suspenseConfig, action: Z.action, eagerReducer: Z.eagerReducer, eagerState: Z.eagerState, next: null };
                T === null ? (w = T = ge, p = r) : T = T.next = ge, q > Lt.expirationTime && (Lt.expirationTime = q, ka(q));
              } else T !== null && (T = T.next = { expirationTime: 1073741823, suspenseConfig: Z.suspenseConfig, action: Z.action, eagerReducer: Z.eagerReducer, eagerState: Z.eagerState, next: null }), Vl(q, Z.suspenseConfig), r = Z.eagerReducer === e ? Z.eagerState : e(r, Z.action);
              Z = Z.next;
            } while (Z !== null && Z !== a);
            T === null ? p = r : T.next = w, mr(r, t.memoizedState) || (tr = !0), t.memoizedState = r, t.baseState = p, t.baseQueue = T, n.lastRenderedState = r;
          }
          return [t.memoizedState, n.dispatch];
        }
        function oa(e) {
          var t = Wo(), n = t.queue;
          if (n === null) throw Error(g(311));
          n.lastRenderedReducer = e;
          var r = n.dispatch, a = n.pending, p = t.memoizedState;
          if (a !== null) {
            n.pending = null;
            var w = a = a.next;
            do
              p = e(p, w.action), w = w.next;
            while (w !== a);
            mr(p, t.memoizedState) || (tr = !0), t.memoizedState = p, t.baseQueue === null && (t.baseState = p), n.lastRenderedState = p;
          }
          return [p, r];
        }
        function Xa(e) {
          var t = Ho();
          return typeof e == "function" && (e = e()), t.memoizedState = t.baseState = e, e = (e = t.queue = { pending: null, dispatch: null, lastRenderedReducer: uo, lastRenderedState: e }).dispatch = sl.bind(null, Lt, e), [t.memoizedState, e];
        }
        function Za(e, t, n, r) {
          return e = { tag: e, create: t, destroy: n, deps: r, next: null }, (t = Lt.updateQueue) === null ? (t = { lastEffect: null }, Lt.updateQueue = t, t.lastEffect = e.next = e) : (n = t.lastEffect) === null ? t.lastEffect = e.next = e : (r = n.next, n.next = e, e.next = r, t.lastEffect = e), e;
        }
        function el() {
          return Wo().memoizedState;
        }
        function Ja(e, t, n, r) {
          var a = Ho();
          Lt.effectTag |= e, a.memoizedState = Za(1 | t, n, void 0, r === void 0 ? null : r);
        }
        function es(e, t, n, r) {
          var a = Wo();
          r = r === void 0 ? null : r;
          var p = void 0;
          if (sn !== null) {
            var w = sn.memoizedState;
            if (p = w.destroy, r !== null && Qa(r, w.deps)) return void Za(t, n, p, r);
          }
          Lt.effectTag |= e, a.memoizedState = Za(1 | t, n, p, r);
        }
        function tl(e, t) {
          return Ja(516, 4, e, t);
        }
        function ia(e, t) {
          return es(516, 4, e, t);
        }
        function nl(e, t) {
          return es(4, 2, e, t);
        }
        function rl(e, t) {
          return typeof t == "function" ? (e = e(), t(e), function() {
            t(null);
          }) : t != null ? (e = e(), t.current = e, function() {
            t.current = null;
          }) : void 0;
        }
        function ol(e, t, n) {
          return n = n != null ? n.concat([e]) : null, es(4, 2, rl.bind(null, t, e), n);
        }
        function ts() {
        }
        function il(e, t) {
          return Ho().memoizedState = [e, t === void 0 ? null : t], e;
        }
        function aa(e, t) {
          var n = Wo();
          t = t === void 0 ? null : t;
          var r = n.memoizedState;
          return r !== null && t !== null && Qa(t, r[1]) ? r[0] : (n.memoizedState = [e, t], e);
        }
        function al(e, t) {
          var n = Wo();
          t = t === void 0 ? null : t;
          var r = n.memoizedState;
          return r !== null && t !== null && Qa(t, r[1]) ? r[0] : (e = e(), n.memoizedState = [e, t], e);
        }
        function ns(e, t, n) {
          var r = $i();
          Vr(98 > r ? 98 : r, function() {
            e(!0);
          }), Vr(97 < r ? 97 : r, function() {
            var a = Ln.suspense;
            Ln.suspense = t === void 0 ? null : t;
            try {
              e(!1), n();
            } finally {
              Ln.suspense = a;
            }
          });
        }
        function sl(e, t, n) {
          var r = nr(), a = li.suspense;
          a = { expirationTime: r = mo(r, e, a), suspenseConfig: a, action: n, eagerReducer: null, eagerState: null, next: null };
          var p = t.pending;
          if (p === null ? a.next = a : (a.next = p.next, p.next = a), t.pending = a, p = e.alternate, e === Lt || p !== null && p === Lt) na = !0, a.expirationTime = $r, Lt.expirationTime = $r;
          else {
            if (e.expirationTime === 0 && (p === null || p.expirationTime === 0) && (p = t.lastRenderedReducer) !== null) try {
              var w = t.lastRenderedState, T = p(w, n);
              if (a.eagerReducer = p, a.eagerState = T, mr(T, w)) return;
            } catch {
            }
            Kr(e, r);
          }
        }
        var sa = { readContext: zn, useCallback: _n, useContext: _n, useEffect: _n, useImperativeHandle: _n, useLayoutEffect: _n, useMemo: _n, useReducer: _n, useRef: _n, useState: _n, useDebugValue: _n, useResponder: _n, useDeferredValue: _n, useTransition: _n }, vc = { readContext: zn, useCallback: il, useContext: zn, useEffect: tl, useImperativeHandle: function(e, t, n) {
          return n = n != null ? n.concat([e]) : null, Ja(4, 2, rl.bind(null, t, e), n);
        }, useLayoutEffect: function(e, t) {
          return Ja(4, 2, e, t);
        }, useMemo: function(e, t) {
          var n = Ho();
          return t = t === void 0 ? null : t, e = e(), n.memoizedState = [e, t], e;
        }, useReducer: function(e, t, n) {
          var r = Ho();
          return t = n !== void 0 ? n(t) : t, r.memoizedState = r.baseState = t, e = (e = r.queue = { pending: null, dispatch: null, lastRenderedReducer: e, lastRenderedState: t }).dispatch = sl.bind(null, Lt, e), [r.memoizedState, e];
        }, useRef: function(e) {
          return e = { current: e }, Ho().memoizedState = e;
        }, useState: Xa, useDebugValue: ts, useResponder: Ka, useDeferredValue: function(e, t) {
          var n = Xa(e), r = n[0], a = n[1];
          return tl(function() {
            var p = Ln.suspense;
            Ln.suspense = t === void 0 ? null : t;
            try {
              a(e);
            } finally {
              Ln.suspense = p;
            }
          }, [e, t]), r;
        }, useTransition: function(e) {
          var t = Xa(!1), n = t[0];
          return t = t[1], [il(ns.bind(null, t, e), [t, e]), n];
        } }, wc = { readContext: zn, useCallback: aa, useContext: zn, useEffect: ia, useImperativeHandle: ol, useLayoutEffect: nl, useMemo: al, useReducer: ra, useRef: el, useState: function() {
          return ra(uo);
        }, useDebugValue: ts, useResponder: Ka, useDeferredValue: function(e, t) {
          var n = ra(uo), r = n[0], a = n[1];
          return ia(function() {
            var p = Ln.suspense;
            Ln.suspense = t === void 0 ? null : t;
            try {
              a(e);
            } finally {
              Ln.suspense = p;
            }
          }, [e, t]), r;
        }, useTransition: function(e) {
          var t = ra(uo), n = t[0];
          return t = t[1], [aa(ns.bind(null, t, e), [t, e]), n];
        } }, kc = { readContext: zn, useCallback: aa, useContext: zn, useEffect: ia, useImperativeHandle: ol, useLayoutEffect: nl, useMemo: al, useReducer: oa, useRef: el, useState: function() {
          return oa(uo);
        }, useDebugValue: ts, useResponder: Ka, useDeferredValue: function(e, t) {
          var n = oa(uo), r = n[0], a = n[1];
          return ia(function() {
            var p = Ln.suspense;
            Ln.suspense = t === void 0 ? null : t;
            try {
              a(e);
            } finally {
              Ln.suspense = p;
            }
          }, [e, t]), r;
        }, useTransition: function(e) {
          var t = oa(uo), n = t[0];
          return t = t[1], [aa(ns.bind(null, t, e), [t, e]), n];
        } }, yr = null, Yr = null, fo = !1;
        function ll(e, t) {
          var n = rr(5, null, null, 0);
          n.elementType = "DELETED", n.type = "DELETED", n.stateNode = t, n.return = e, n.effectTag = 8, e.lastEffect !== null ? (e.lastEffect.nextEffect = n, e.lastEffect = n) : e.firstEffect = e.lastEffect = n;
        }
        function cl(e, t) {
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
        function rs(e) {
          if (fo) {
            var t = Yr;
            if (t) {
              var n = t;
              if (!cl(e, t)) {
                if (!(t = Ar(n.nextSibling)) || !cl(e, t)) return e.effectTag = -1025 & e.effectTag | 2, fo = !1, void (yr = e);
                ll(yr, n);
              }
              yr = e, Yr = Ar(t.firstChild);
            } else e.effectTag = -1025 & e.effectTag | 2, fo = !1, yr = e;
          }
        }
        function ul(e) {
          for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13; ) e = e.return;
          yr = e;
        }
        function la(e) {
          if (e !== yr) return !1;
          if (!fo) return ul(e), fo = !0, !1;
          var t = e.type;
          if (e.tag !== 5 || t !== "head" && t !== "body" && !ti(t, e.memoizedProps)) for (t = Yr; t; ) ll(e, t), t = Ar(t.nextSibling);
          if (ul(e), e.tag === 13) {
            if (!(e = (e = e.memoizedState) !== null ? e.dehydrated : null)) throw Error(g(317));
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
        function os() {
          Yr = yr = null, fo = !1;
        }
        var _c = he.ReactCurrentOwner, tr = !1;
        function Un(e, t, n, r) {
          t.child = e === null ? $a(t, null, n, r) : Vo(t, e.child, n, r);
        }
        function dl(e, t, n, r, a) {
          n = n.render;
          var p = t.ref;
          return Fo(t, a), r = Ga(e, t, n, r, p, a), e === null || tr ? (t.effectTag |= 1, Un(e, t, r, a), t.child) : (t.updateQueue = e.updateQueue, t.effectTag &= -517, e.expirationTime <= a && (e.expirationTime = 0), vr(e, t, a));
        }
        function fl(e, t, n, r, a, p) {
          if (e === null) {
            var w = n.type;
            return typeof w != "function" || vs(w) || w.defaultProps !== void 0 || n.compare !== null || n.defaultProps !== void 0 ? ((e = _a(n.type, null, r, null, t.mode, p)).ref = t.ref, e.return = t, t.child = e) : (t.tag = 15, t.type = w, pl(e, t, w, r, a, p));
          }
          return w = e.child, a < p && (a = w.memoizedProps, (n = (n = n.compare) !== null ? n : gr)(a, r) && e.ref === t.ref) ? vr(e, t, p) : (t.effectTag |= 1, (e = vo(w, r)).ref = t.ref, e.return = t, t.child = e);
        }
        function pl(e, t, n, r, a, p) {
          return e !== null && gr(e.memoizedProps, r) && e.ref === t.ref && (tr = !1, a < p) ? (t.expirationTime = e.expirationTime, vr(e, t, p)) : is(e, t, n, r, p);
        }
        function hl(e, t) {
          var n = t.ref;
          (e === null && n !== null || e !== null && e.ref !== n) && (t.effectTag |= 128);
        }
        function is(e, t, n, r, a) {
          var p = hn(n) ? lo : Xt.current;
          return p = Lo(t, p), Fo(t, a), n = Ga(e, t, n, r, p, a), e === null || tr ? (t.effectTag |= 1, Un(e, t, n, a), t.child) : (t.updateQueue = e.updateQueue, t.effectTag &= -517, e.expirationTime <= a && (e.expirationTime = 0), vr(e, t, a));
        }
        function ml(e, t, n, r, a) {
          if (hn(n)) {
            var p = !0;
            Bi(t);
          } else p = !1;
          if (Fo(t, a), t.stateNode === null) e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= 2), Gs(t, n, r), Wa(t, n, r, a), r = !0;
          else if (e === null) {
            var w = t.stateNode, T = t.memoizedProps;
            w.props = T;
            var Z = w.context, q = n.contextType;
            typeof q == "object" && q !== null ? q = zn(q) : q = Lo(t, q = hn(n) ? lo : Xt.current);
            var ge = n.getDerivedStateFromProps, De = typeof ge == "function" || typeof w.getSnapshotBeforeUpdate == "function";
            De || typeof w.UNSAFE_componentWillReceiveProps != "function" && typeof w.componentWillReceiveProps != "function" || (T !== r || Z !== q) && Xs(t, w, r, q), Br = !1;
            var He = t.memoizedState;
            w.state = He, si(t, r, w, a), Z = t.memoizedState, T !== r || He !== Z || pn.current || Br ? (typeof ge == "function" && (Gi(t, n, ge, r), Z = t.memoizedState), (T = Br || Qs(t, n, T, r, He, Z, q)) ? (De || typeof w.UNSAFE_componentWillMount != "function" && typeof w.componentWillMount != "function" || (typeof w.componentWillMount == "function" && w.componentWillMount(), typeof w.UNSAFE_componentWillMount == "function" && w.UNSAFE_componentWillMount()), typeof w.componentDidMount == "function" && (t.effectTag |= 4)) : (typeof w.componentDidMount == "function" && (t.effectTag |= 4), t.memoizedProps = r, t.memoizedState = Z), w.props = r, w.state = Z, w.context = q, r = T) : (typeof w.componentDidMount == "function" && (t.effectTag |= 4), r = !1);
          } else w = t.stateNode, Ha(e, t), T = t.memoizedProps, w.props = t.type === t.elementType ? T : $n(t.type, T), Z = w.context, typeof (q = n.contextType) == "object" && q !== null ? q = zn(q) : q = Lo(t, q = hn(n) ? lo : Xt.current), (De = typeof (ge = n.getDerivedStateFromProps) == "function" || typeof w.getSnapshotBeforeUpdate == "function") || typeof w.UNSAFE_componentWillReceiveProps != "function" && typeof w.componentWillReceiveProps != "function" || (T !== r || Z !== q) && Xs(t, w, r, q), Br = !1, Z = t.memoizedState, w.state = Z, si(t, r, w, a), He = t.memoizedState, T !== r || Z !== He || pn.current || Br ? (typeof ge == "function" && (Gi(t, n, ge, r), He = t.memoizedState), (ge = Br || Qs(t, n, T, r, Z, He, q)) ? (De || typeof w.UNSAFE_componentWillUpdate != "function" && typeof w.componentWillUpdate != "function" || (typeof w.componentWillUpdate == "function" && w.componentWillUpdate(r, He, q), typeof w.UNSAFE_componentWillUpdate == "function" && w.UNSAFE_componentWillUpdate(r, He, q)), typeof w.componentDidUpdate == "function" && (t.effectTag |= 4), typeof w.getSnapshotBeforeUpdate == "function" && (t.effectTag |= 256)) : (typeof w.componentDidUpdate != "function" || T === e.memoizedProps && Z === e.memoizedState || (t.effectTag |= 4), typeof w.getSnapshotBeforeUpdate != "function" || T === e.memoizedProps && Z === e.memoizedState || (t.effectTag |= 256), t.memoizedProps = r, t.memoizedState = He), w.props = r, w.state = He, w.context = q, r = ge) : (typeof w.componentDidUpdate != "function" || T === e.memoizedProps && Z === e.memoizedState || (t.effectTag |= 4), typeof w.getSnapshotBeforeUpdate != "function" || T === e.memoizedProps && Z === e.memoizedState || (t.effectTag |= 256), r = !1);
          return as(e, t, n, r, p, a);
        }
        function as(e, t, n, r, a, p) {
          hl(e, t);
          var w = (64 & t.effectTag) != 0;
          if (!r && !w) return a && Rs(t, n, !1), vr(e, t, p);
          r = t.stateNode, _c.current = t;
          var T = w && typeof n.getDerivedStateFromError != "function" ? null : r.render();
          return t.effectTag |= 1, e !== null && w ? (t.child = Vo(t, e.child, null, p), t.child = Vo(t, null, T, p)) : Un(e, t, T, p), t.memoizedState = r.state, a && Rs(t, n, !0), t.child;
        }
        function gl(e) {
          var t = e.stateNode;
          t.pendingContext ? Ns(0, t.pendingContext, t.pendingContext !== t.context) : t.context && Ns(0, t.context, !1), Ya(e, t.containerInfo);
        }
        var bl, yl, vl, ss = { dehydrated: null, retryTime: 0 };
        function wl(e, t, n) {
          var r, a = t.mode, p = t.pendingProps, w = Ct.current, T = !1;
          if ((r = (64 & t.effectTag) != 0) || (r = (2 & w) != 0 && (e === null || e.memoizedState !== null)), r ? (T = !0, t.effectTag &= -65) : e !== null && e.memoizedState === null || p.fallback === void 0 || p.unstable_avoidThisFallback === !0 || (w |= 1), St(Ct, 1 & w), e === null) {
            if (p.fallback !== void 0 && rs(t), T) {
              if (T = p.fallback, (p = Qr(null, a, 0, null)).return = t, (2 & t.mode) == 0) for (e = t.memoizedState !== null ? t.child.child : t.child, p.child = e; e !== null; ) e.return = p, e = e.sibling;
              return (n = Qr(T, a, n, null)).return = t, p.sibling = n, t.memoizedState = ss, t.child = p, n;
            }
            return a = p.children, t.memoizedState = null, t.child = $a(t, null, a, n);
          }
          if (e.memoizedState !== null) {
            if (a = (e = e.child).sibling, T) {
              if (p = p.fallback, (n = vo(e, e.pendingProps)).return = t, (2 & t.mode) == 0 && (T = t.memoizedState !== null ? t.child.child : t.child) !== e.child) for (n.child = T; T !== null; ) T.return = n, T = T.sibling;
              return (a = vo(a, p)).return = t, n.sibling = a, n.childExpirationTime = 0, t.memoizedState = ss, t.child = n, a;
            }
            return n = Vo(t, e.child, p.children, n), t.memoizedState = null, t.child = n;
          }
          if (e = e.child, T) {
            if (T = p.fallback, (p = Qr(null, a, 0, null)).return = t, p.child = e, e !== null && (e.return = p), (2 & t.mode) == 0) for (e = t.memoizedState !== null ? t.child.child : t.child, p.child = e; e !== null; ) e.return = p, e = e.sibling;
            return (n = Qr(T, a, n, null)).return = t, p.sibling = n, n.effectTag |= 2, p.childExpirationTime = 0, t.memoizedState = ss, t.child = p, n;
          }
          return t.memoizedState = null, t.child = Vo(t, e, p.children, n);
        }
        function kl(e, t) {
          e.expirationTime < t && (e.expirationTime = t);
          var n = e.alternate;
          n !== null && n.expirationTime < t && (n.expirationTime = t), $s(e.return, t);
        }
        function ls(e, t, n, r, a, p) {
          var w = e.memoizedState;
          w === null ? e.memoizedState = { isBackwards: t, rendering: null, renderingStartTime: 0, last: r, tail: n, tailExpiration: 0, tailMode: a, lastEffect: p } : (w.isBackwards = t, w.rendering = null, w.renderingStartTime = 0, w.last = r, w.tail = n, w.tailExpiration = 0, w.tailMode = a, w.lastEffect = p);
        }
        function _l(e, t, n) {
          var r = t.pendingProps, a = r.revealOrder, p = r.tail;
          if (Un(e, t, r.children, n), (2 & (r = Ct.current)) != 0) r = 1 & r | 2, t.effectTag |= 64;
          else {
            if (e !== null && (64 & e.effectTag) != 0) e: for (e = t.child; e !== null; ) {
              if (e.tag === 13) e.memoizedState !== null && kl(e, n);
              else if (e.tag === 19) kl(e, n);
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
          else switch (a) {
            case "forwards":
              for (n = t.child, a = null; n !== null; ) (e = n.alternate) !== null && ea(e) === null && (a = n), n = n.sibling;
              (n = a) === null ? (a = t.child, t.child = null) : (a = n.sibling, n.sibling = null), ls(t, !1, a, n, p, t.lastEffect);
              break;
            case "backwards":
              for (n = null, a = t.child, t.child = null; a !== null; ) {
                if ((e = a.alternate) !== null && ea(e) === null) {
                  t.child = a;
                  break;
                }
                e = a.sibling, a.sibling = n, n = a, a = e;
              }
              ls(t, !0, n, null, p, t.lastEffect);
              break;
            case "together":
              ls(t, !1, null, null, void 0, t.lastEffect);
              break;
            default:
              t.memoizedState = null;
          }
          return t.child;
        }
        function vr(e, t, n) {
          e !== null && (t.dependencies = e.dependencies);
          var r = t.expirationTime;
          if (r !== 0 && ka(r), t.childExpirationTime < n) return null;
          if (e !== null && t.child !== e.child) throw Error(g(153));
          if (t.child !== null) {
            for (n = vo(e = t.child, e.pendingProps), t.child = n, n.return = t; e.sibling !== null; ) e = e.sibling, (n = n.sibling = vo(e, e.pendingProps)).return = t;
            n.sibling = null;
          }
          return t.child;
        }
        function ca(e, t) {
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
        function Ec(e, t, n) {
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
              return hn(t.type) && Vi(), null;
            case 3:
              return Bo(), vt(pn), vt(Xt), (n = t.stateNode).pendingContext && (n.context = n.pendingContext, n.pendingContext = null), e !== null && e.child !== null || !la(t) || (t.effectTag |= 4), null;
            case 5:
              qa(t), n = co(fi.current);
              var a = t.type;
              if (e !== null && t.stateNode != null) yl(e, t, a, r, n), e.ref !== t.ref && (t.effectTag |= 128);
              else {
                if (!r) {
                  if (t.stateNode === null) throw Error(g(166));
                  return null;
                }
                if (e = co(er.current), la(t)) {
                  r = t.stateNode, a = t.type;
                  var p = t.memoizedProps;
                  switch (r[Qn] = t, r[no] = p, a) {
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
                      bn(r, p), mt("invalid", r), Hn(n, "onChange");
                      break;
                    case "select":
                      r._wrapperState = { wasMultiple: !!p.multiple }, mt("invalid", r), Hn(n, "onChange");
                      break;
                    case "textarea":
                      On(r, p), mt("invalid", r), Hn(n, "onChange");
                  }
                  for (var w in Qo(a, p), e = null, p) if (p.hasOwnProperty(w)) {
                    var T = p[w];
                    w === "children" ? typeof T == "string" ? r.textContent !== T && (e = ["children", T]) : typeof T == "number" && r.textContent !== "" + T && (e = ["children", "" + T]) : A.hasOwnProperty(w) && T != null && Hn(n, w);
                  }
                  switch (a) {
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
                      typeof p.onClick == "function" && (r.onclick = Po);
                  }
                  n = e, t.updateQueue = n, n !== null && (t.effectTag |= 4);
                } else {
                  switch (w = n.nodeType === 9 ? n : n.ownerDocument, e === Oi && (e = we(a)), e === Oi ? a === "script" ? ((e = w.createElement("div")).innerHTML = "<script><\/script>", e = e.removeChild(e.firstChild)) : typeof r.is == "string" ? e = w.createElement(a, { is: r.is }) : (e = w.createElement(a), a === "select" && (w = e, r.multiple ? w.multiple = !0 : r.size && (w.size = r.size))) : e = w.createElementNS(e, a), e[Qn] = t, e[no] = r, bl(e, t), t.stateNode = e, w = Go(a, r), a) {
                    case "iframe":
                    case "object":
                    case "embed":
                      mt("load", e), T = r;
                      break;
                    case "video":
                    case "audio":
                      for (T = 0; T < ct.length; T++) mt(ct[T], e);
                      T = r;
                      break;
                    case "source":
                      mt("error", e), T = r;
                      break;
                    case "img":
                    case "image":
                    case "link":
                      mt("error", e), mt("load", e), T = r;
                      break;
                    case "form":
                      mt("reset", e), mt("submit", e), T = r;
                      break;
                    case "details":
                      mt("toggle", e), T = r;
                      break;
                    case "input":
                      bn(e, r), T = Cr(e, r), mt("invalid", e), Hn(n, "onChange");
                      break;
                    case "option":
                      T = sr(e, r);
                      break;
                    case "select":
                      e._wrapperState = { wasMultiple: !!r.multiple }, T = o({}, r, { value: void 0 }), mt("invalid", e), Hn(n, "onChange");
                      break;
                    case "textarea":
                      On(e, r), T = lr(e, r), mt("invalid", e), Hn(n, "onChange");
                      break;
                    default:
                      T = r;
                  }
                  Qo(a, T);
                  var Z = T;
                  for (p in Z) if (Z.hasOwnProperty(p)) {
                    var q = Z[p];
                    p === "style" ? Ci(e, q) : p === "dangerouslySetInnerHTML" ? (q = q ? q.__html : void 0) != null && qe(e, q) : p === "children" ? typeof q == "string" ? (a !== "textarea" || q !== "") && st(e, q) : typeof q == "number" && st(e, "" + q) : p !== "suppressContentEditableWarning" && p !== "suppressHydrationWarning" && p !== "autoFocus" && (A.hasOwnProperty(p) ? q != null && Hn(n, p) : q != null && je(e, p, q, w));
                  }
                  switch (a) {
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
                      typeof T.onClick == "function" && (e.onclick = Po);
                  }
                  Ri(a, r) && (t.effectTag |= 4);
                }
                t.ref !== null && (t.effectTag |= 128);
              }
              return null;
            case 6:
              if (e && t.stateNode != null) vl(0, t, e.memoizedProps, r);
              else {
                if (typeof r != "string" && t.stateNode === null) throw Error(g(166));
                n = co(fi.current), co(er.current), la(t) ? (n = t.stateNode, r = t.memoizedProps, n[Qn] = t, n.nodeValue !== r && (t.effectTag |= 4)) : ((n = (n.nodeType === 9 ? n : n.ownerDocument).createTextNode(r))[Qn] = t, t.stateNode = n);
              }
              return null;
            case 13:
              return vt(Ct), r = t.memoizedState, (64 & t.effectTag) != 0 ? (t.expirationTime = n, t) : (n = r !== null, r = !1, e === null ? t.memoizedProps.fallback !== void 0 && la(t) : (r = (a = e.memoizedState) !== null, n || a === null || (a = e.child.sibling) !== null && ((p = t.firstEffect) !== null ? (t.firstEffect = a, a.nextEffect = p) : (t.firstEffect = t.lastEffect = a, a.nextEffect = null), a.effectTag = 8)), n && !r && (2 & t.mode) != 0 && (e === null && t.memoizedProps.unstable_avoidThisFallback !== !0 || (1 & Ct.current) != 0 ? Ft === po && (Ft = da) : (Ft !== po && Ft !== da || (Ft = fa), hi !== 0 && En !== null && (wo(En, mn), Yl(En, hi)))), (n || r) && (t.effectTag |= 4), null);
            case 4:
              return Bo(), null;
            case 10:
              return Va(t), null;
            case 17:
              return hn(t.type) && Vi(), null;
            case 19:
              if (vt(Ct), (r = t.memoizedState) === null) return null;
              if (a = (64 & t.effectTag) != 0, (p = r.rendering) === null) {
                if (a) ca(r, !1);
                else if (Ft !== po || e !== null && (64 & e.effectTag) != 0) for (p = t.child; p !== null; ) {
                  if ((e = ea(p)) !== null) {
                    for (t.effectTag |= 64, ca(r, !1), (a = e.updateQueue) !== null && (t.updateQueue = a, t.effectTag |= 4), r.lastEffect === null && (t.firstEffect = null), t.lastEffect = r.lastEffect, r = t.child; r !== null; ) p = n, (a = r).effectTag &= 2, a.nextEffect = null, a.firstEffect = null, a.lastEffect = null, (e = a.alternate) === null ? (a.childExpirationTime = 0, a.expirationTime = p, a.child = null, a.memoizedProps = null, a.memoizedState = null, a.updateQueue = null, a.dependencies = null) : (a.childExpirationTime = e.childExpirationTime, a.expirationTime = e.expirationTime, a.child = e.child, a.memoizedProps = e.memoizedProps, a.memoizedState = e.memoizedState, a.updateQueue = e.updateQueue, p = e.dependencies, a.dependencies = p === null ? null : { expirationTime: p.expirationTime, firstContext: p.firstContext, responders: p.responders }), r = r.sibling;
                    return St(Ct, 1 & Ct.current | 2), t.child;
                  }
                  p = p.sibling;
                }
              } else {
                if (!a) if ((e = ea(p)) !== null) {
                  if (t.effectTag |= 64, a = !0, (n = e.updateQueue) !== null && (t.updateQueue = n, t.effectTag |= 4), ca(r, !0), r.tail === null && r.tailMode === "hidden" && !p.alternate) return (t = t.lastEffect = r.lastEffect) !== null && (t.nextEffect = null), null;
                } else 2 * jn() - r.renderingStartTime > r.tailExpiration && 1 < n && (t.effectTag |= 64, a = !0, ca(r, !1), t.expirationTime = t.childExpirationTime = n - 1);
                r.isBackwards ? (p.sibling = t.child, t.child = p) : ((n = r.last) !== null ? n.sibling = p : t.child = p, r.last = p);
              }
              return r.tail !== null ? (r.tailExpiration === 0 && (r.tailExpiration = jn() + 500), n = r.tail, r.rendering = n, r.tail = n.sibling, r.lastEffect = t.lastEffect, r.renderingStartTime = jn(), n.sibling = null, t = Ct.current, St(Ct, a ? 1 & t | 2 : 1 & t), n) : null;
          }
          throw Error(g(156, t.tag));
        }
        function xc(e) {
          switch (e.tag) {
            case 1:
              hn(e.type) && Vi();
              var t = e.effectTag;
              return 4096 & t ? (e.effectTag = -4097 & t | 64, e) : null;
            case 3:
              if (Bo(), vt(pn), vt(Xt), (64 & (t = e.effectTag)) != 0) throw Error(g(285));
              return e.effectTag = -4097 & t | 64, e;
            case 5:
              return qa(e), null;
            case 13:
              return vt(Ct), 4096 & (t = e.effectTag) ? (e.effectTag = -4097 & t | 64, e) : null;
            case 19:
              return vt(Ct), null;
            case 4:
              return Bo(), null;
            case 10:
              return Va(e), null;
            default:
              return null;
          }
        }
        function cs(e, t) {
          return { value: e, source: t, stack: xr(t) };
        }
        bl = function(e, t) {
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
        }, yl = function(e, t, n, r, a) {
          var p = e.memoizedProps;
          if (p !== r) {
            var w, T, Z = t.stateNode;
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
                typeof p.onClick != "function" && typeof r.onClick == "function" && (Z.onclick = Po);
            }
            for (w in Qo(n, r), n = null, p) if (!r.hasOwnProperty(w) && p.hasOwnProperty(w) && p[w] != null) if (w === "style") for (T in Z = p[w]) Z.hasOwnProperty(T) && (n || (n = {}), n[T] = "");
            else w !== "dangerouslySetInnerHTML" && w !== "children" && w !== "suppressContentEditableWarning" && w !== "suppressHydrationWarning" && w !== "autoFocus" && (A.hasOwnProperty(w) ? e || (e = []) : (e = e || []).push(w, null));
            for (w in r) {
              var q = r[w];
              if (Z = p != null ? p[w] : void 0, r.hasOwnProperty(w) && q !== Z && (q != null || Z != null)) if (w === "style") if (Z) {
                for (T in Z) !Z.hasOwnProperty(T) || q && q.hasOwnProperty(T) || (n || (n = {}), n[T] = "");
                for (T in q) q.hasOwnProperty(T) && Z[T] !== q[T] && (n || (n = {}), n[T] = q[T]);
              } else n || (e || (e = []), e.push(w, n)), n = q;
              else w === "dangerouslySetInnerHTML" ? (q = q ? q.__html : void 0, Z = Z ? Z.__html : void 0, q != null && Z !== q && (e = e || []).push(w, q)) : w === "children" ? Z === q || typeof q != "string" && typeof q != "number" || (e = e || []).push(w, "" + q) : w !== "suppressContentEditableWarning" && w !== "suppressHydrationWarning" && (A.hasOwnProperty(w) ? (q != null && Hn(a, w), e || Z === q || (e = [])) : (e = e || []).push(w, q));
            }
            n && (e = e || []).push("style", n), a = e, (t.updateQueue = a) && (t.effectTag |= 4);
          }
        }, vl = function(e, t, n, r) {
          n !== r && (t.effectTag |= 4);
        };
        var Sc = typeof WeakSet == "function" ? WeakSet : Set;
        function us(e, t) {
          var n = t.source, r = t.stack;
          r === null && n !== null && (r = xr(n)), n !== null && Yt(n.type), t = t.value, e !== null && e.tag === 1 && Yt(e.type);
          try {
            console.error(t);
          } catch (a) {
            setTimeout(function() {
              throw a;
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
          throw Error(g(163));
        }
        function xl(e, t) {
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
        function Sl(e, t) {
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
              return void Sl(3, n);
            case 1:
              if (e = n.stateNode, 4 & n.effectTag) if (t === null) e.componentDidMount();
              else {
                var r = n.elementType === n.type ? t.memoizedProps : $n(n.type, t.memoizedProps);
                e.componentDidUpdate(r, t.memoizedState, e.__reactInternalSnapshotBeforeUpdate);
              }
              return void ((t = n.updateQueue) !== null && qs(n, t, e));
            case 3:
              if ((t = n.updateQueue) !== null) {
                if (e = null, n.child !== null) switch (n.child.tag) {
                  case 5:
                    e = n.child.stateNode;
                    break;
                  case 1:
                    e = n.child.stateNode;
                }
                qs(n, t, e);
              }
              return;
            case 5:
              return e = n.stateNode, void (t === null && 4 & n.effectTag && Ri(n.type, n.memoizedProps) && e.focus());
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
          throw Error(g(163));
        }
        function Cl(e, t, n) {
          switch (typeof ys == "function" && ys(t), t.tag) {
            case 0:
            case 11:
            case 14:
            case 15:
            case 22:
              if ((e = t.updateQueue) !== null && (e = e.lastEffect) !== null) {
                var r = e.next;
                Vr(97 < n ? 97 : n, function() {
                  var a = r;
                  do {
                    var p = a.destroy;
                    if (p !== void 0) {
                      var w = t;
                      try {
                        p();
                      } catch (T) {
                        yo(w, T);
                      }
                    }
                    a = a.next;
                  } while (a !== r);
                });
              }
              break;
            case 1:
              El(t), typeof (n = t.stateNode).componentWillUnmount == "function" && function(a, p) {
                try {
                  p.props = a.memoizedProps, p.state = a.memoizedState, p.componentWillUnmount();
                } catch (w) {
                  yo(a, w);
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
        function Tl(e) {
          var t = e.alternate;
          e.return = null, e.child = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.alternate = null, e.firstEffect = null, e.lastEffect = null, e.pendingProps = null, e.memoizedProps = null, e.stateNode = null, t !== null && Tl(t);
        }
        function Ol(e) {
          return e.tag === 5 || e.tag === 3 || e.tag === 4;
        }
        function Pl(e) {
          e: {
            for (var t = e.return; t !== null; ) {
              if (Ol(t)) {
                var n = t;
                break e;
              }
              t = t.return;
            }
            throw Error(g(160));
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
              throw Error(g(161));
          }
          16 & n.effectTag && (st(t, ""), n.effectTag &= -17);
          e: t: for (n = e; ; ) {
            for (; n.sibling === null; ) {
              if (n.return === null || Ol(n.return)) {
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
          r ? function a(p, w, T) {
            var Z = p.tag, q = Z === 5 || Z === 6;
            if (q) p = q ? p.stateNode : p.stateNode.instance, w ? T.nodeType === 8 ? T.parentNode.insertBefore(p, w) : T.insertBefore(p, w) : (T.nodeType === 8 ? (w = T.parentNode).insertBefore(p, T) : (w = T).appendChild(p), (T = T._reactRootContainer) !== null && T !== void 0 || w.onclick !== null || (w.onclick = Po));
            else if (Z !== 4 && (p = p.child) !== null) for (a(p, w, T), p = p.sibling; p !== null; ) a(p, w, T), p = p.sibling;
          }(e, n, t) : function a(p, w, T) {
            var Z = p.tag, q = Z === 5 || Z === 6;
            if (q) p = q ? p.stateNode : p.stateNode.instance, w ? T.insertBefore(p, w) : T.appendChild(p);
            else if (Z !== 4 && (p = p.child) !== null) for (a(p, w, T), p = p.sibling; p !== null; ) a(p, w, T), p = p.sibling;
          }(e, n, t);
        }
        function Nl(e, t, n) {
          for (var r, a, p = t, w = !1; ; ) {
            if (!w) {
              w = p.return;
              e: for (; ; ) {
                if (w === null) throw Error(g(160));
                switch (r = w.stateNode, w.tag) {
                  case 5:
                    a = !1;
                    break e;
                  case 3:
                  case 4:
                    r = r.containerInfo, a = !0;
                    break e;
                }
                w = w.return;
              }
              w = !0;
            }
            if (p.tag === 5 || p.tag === 6) {
              e: for (var T = e, Z = p, q = n, ge = Z; ; ) if (Cl(T, ge, q), ge.child !== null && ge.tag !== 4) ge.child.return = ge, ge = ge.child;
              else {
                if (ge === Z) break e;
                for (; ge.sibling === null; ) {
                  if (ge.return === null || ge.return === Z) break e;
                  ge = ge.return;
                }
                ge.sibling.return = ge.return, ge = ge.sibling;
              }
              a ? (T = r, Z = p.stateNode, T.nodeType === 8 ? T.parentNode.removeChild(Z) : T.removeChild(Z)) : r.removeChild(p.stateNode);
            } else if (p.tag === 4) {
              if (p.child !== null) {
                r = p.stateNode.containerInfo, a = !0, p.child.return = p, p = p.child;
                continue;
              }
            } else if (Cl(e, p, n), p.child !== null) {
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
        function ds(e, t) {
          switch (t.tag) {
            case 0:
            case 11:
            case 14:
            case 15:
            case 22:
              return void xl(3, t);
            case 1:
              return;
            case 5:
              var n = t.stateNode;
              if (n != null) {
                var r = t.memoizedProps, a = e !== null ? e.memoizedProps : r;
                e = t.type;
                var p = t.updateQueue;
                if (t.updateQueue = null, p !== null) {
                  for (n[no] = r, e === "input" && r.type === "radio" && r.name != null && Tr(n, r), Go(e, a), t = Go(e, r), a = 0; a < p.length; a += 2) {
                    var w = p[a], T = p[a + 1];
                    w === "style" ? Ci(n, T) : w === "dangerouslySetInnerHTML" ? qe(n, T) : w === "children" ? st(n, T) : je(n, w, T, t);
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
              if (t.stateNode === null) throw Error(g(162));
              return void (t.stateNode.nodeValue = t.memoizedProps);
            case 3:
              return void ((t = t.stateNode).hydrate && (t.hydrate = !1, pr(t.containerInfo)));
            case 12:
              return;
            case 13:
              if (n = t, t.memoizedState === null ? r = !1 : (r = !0, n = t.child, fs = jn()), n !== null) e: for (e = n; ; ) {
                if (e.tag === 5) p = e.stateNode, r ? typeof (p = p.style).setProperty == "function" ? p.setProperty("display", "none", "important") : p.display = "none" : (p = e.stateNode, a = (a = e.memoizedProps.style) != null && a.hasOwnProperty("display") ? a.display : null, p.style.display = Si("display", a));
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
              return void Dl(t);
            case 19:
              return void Dl(t);
            case 17:
              return;
          }
          throw Error(g(163));
        }
        function Dl(e) {
          var t = e.updateQueue;
          if (t !== null) {
            e.updateQueue = null;
            var n = e.stateNode;
            n === null && (n = e.stateNode = new Sc()), t.forEach(function(r) {
              var a = jc.bind(null, e, r);
              n.has(r) || (n.add(r), r.then(a, a));
            });
          }
        }
        var Oc = typeof WeakMap == "function" ? WeakMap : Map;
        function Rl(e, t, n) {
          (n = Hr(n, null)).tag = 3, n.payload = { element: null };
          var r = t.value;
          return n.callback = function() {
            ga || (ga = !0, ps = r), us(e, t);
          }, n;
        }
        function Il(e, t, n) {
          (n = Hr(n, null)).tag = 3;
          var r = e.type.getDerivedStateFromError;
          if (typeof r == "function") {
            var a = t.value;
            n.payload = function() {
              return us(e, t), r(a);
            };
          }
          var p = e.stateNode;
          return p !== null && typeof p.componentDidCatch == "function" && (n.callback = function() {
            typeof r != "function" && (qr === null ? qr = /* @__PURE__ */ new Set([this]) : qr.add(this), us(e, t));
            var w = t.stack;
            this.componentDidCatch(t.value, { componentStack: w !== null ? w : "" });
          }), n;
        }
        var Al, Pc = Math.ceil, ua = he.ReactCurrentDispatcher, Ml = he.ReactCurrentOwner, po = 0, da = 3, fa = 4, Qe = 0, En = null, Ge = null, mn = 0, Ft = po, pa = null, wr = 1073741823, pi = 1073741823, ha = null, hi = 0, ma = !1, fs = 0, Ae = null, ga = !1, ps = null, qr = null, ba = !1, mi = null, gi = 90, ho = null, bi = 0, hs = null, ya = 0;
        function nr() {
          return (48 & Qe) != 0 ? 1073741821 - (jn() / 10 | 0) : ya !== 0 ? ya : ya = 1073741821 - (jn() / 10 | 0);
        }
        function mo(e, t, n) {
          if ((2 & (t = t.mode)) == 0) return 1073741823;
          var r = $i();
          if ((4 & t) == 0) return r === 99 ? 1073741823 : 1073741822;
          if ((16 & Qe) != 0) return mn;
          if (n !== null) e = Yi(e, 0 | n.timeoutMs || 5e3, 250);
          else switch (r) {
            case 99:
              e = 1073741823;
              break;
            case 98:
              e = Yi(e, 150, 100);
              break;
            case 97:
            case 96:
              e = Yi(e, 5e3, 250);
              break;
            case 95:
              e = 2;
              break;
            default:
              throw Error(g(326));
          }
          return En !== null && e === mn && --e, e;
        }
        function Kr(e, t) {
          if (50 < bi) throw bi = 0, hs = null, Error(g(185));
          if ((e = va(e, t)) !== null) {
            var n = $i();
            t === 1073741823 ? (8 & Qe) != 0 && (48 & Qe) == 0 ? ms(e) : (xn(e), Qe === 0 && Jn()) : xn(e), (4 & Qe) == 0 || n !== 98 && n !== 99 || (ho === null ? ho = /* @__PURE__ */ new Map([[e, t]]) : ((n = ho.get(e)) === void 0 || n > t) && ho.set(e, t));
          }
        }
        function va(e, t) {
          e.expirationTime < t && (e.expirationTime = t);
          var n = e.alternate;
          n !== null && n.expirationTime < t && (n.expirationTime = t);
          var r = e.return, a = null;
          if (r === null && e.tag === 3) a = e.stateNode;
          else for (; r !== null; ) {
            if (n = r.alternate, r.childExpirationTime < t && (r.childExpirationTime = t), n !== null && n.childExpirationTime < t && (n.childExpirationTime = t), r.return === null && r.tag === 3) {
              a = r.stateNode;
              break;
            }
            r = r.return;
          }
          return a !== null && (En === a && (ka(t), Ft === fa && wo(a, mn)), Yl(a, t)), a;
        }
        function wa(e) {
          var t = e.lastExpiredTime;
          if (t !== 0 || !$l(e, t = e.firstPendingTime)) return t;
          var n = e.lastPingedTime;
          return 2 >= (e = n > (e = e.nextKnownPendingLevel) ? n : e) && t !== e ? 0 : e;
        }
        function xn(e) {
          if (e.lastExpiredTime !== 0) e.callbackExpirationTime = 1073741823, e.callbackPriority = 99, e.callbackNode = Hs(ms.bind(null, e));
          else {
            var t = wa(e), n = e.callbackNode;
            if (t === 0) n !== null && (e.callbackNode = null, e.callbackExpirationTime = 0, e.callbackPriority = 90);
            else {
              var r = nr();
              if (t === 1073741823 ? r = 99 : t === 1 || t === 2 ? r = 95 : r = 0 >= (r = 10 * (1073741821 - t) - 10 * (1073741821 - r)) ? 99 : 250 >= r ? 98 : 5250 >= r ? 97 : 95, n !== null) {
                var a = e.callbackPriority;
                if (e.callbackExpirationTime === t && a >= r) return;
                n !== Us && Is(n);
              }
              e.callbackExpirationTime = t, e.callbackPriority = r, t = t === 1073741823 ? Hs(ms.bind(null, e)) : Bs(r, jl.bind(null, e), { timeout: 10 * (1073741821 - t) - jn() }), e.callbackNode = t;
            }
          }
        }
        function jl(e, t) {
          if (ya = 0, t) return _s(e, t = nr()), xn(e), null;
          var n = wa(e);
          if (n !== 0) {
            if (t = e.callbackNode, (48 & Qe) != 0) throw Error(g(327));
            if ($o(), e === En && n === mn || go(e, n), Ge !== null) {
              var r = Qe;
              Qe |= 16;
              for (var a = Fl(); ; ) try {
                Dc();
                break;
              } catch (T) {
                Ul(e, T);
              }
              if (Fa(), Qe = r, ua.current = a, Ft === 1) throw t = pa, go(e, n), wo(e, n), xn(e), t;
              if (Ge === null) switch (a = e.finishedWork = e.current.alternate, e.finishedExpirationTime = n, r = Ft, En = null, r) {
                case po:
                case 1:
                  throw Error(g(345));
                case 2:
                  _s(e, 2 < n ? 2 : n);
                  break;
                case da:
                  if (wo(e, n), n === (r = e.lastSuspendedTime) && (e.nextKnownPendingLevel = gs(a)), wr === 1073741823 && 10 < (a = fs + 500 - jn())) {
                    if (ma) {
                      var p = e.lastPingedTime;
                      if (p === 0 || p >= n) {
                        e.lastPingedTime = n, go(e, n);
                        break;
                      }
                    }
                    if ((p = wa(e)) !== 0 && p !== n) break;
                    if (r !== 0 && r !== n) {
                      e.lastPingedTime = r;
                      break;
                    }
                    e.timeoutHandle = ni(bo.bind(null, e), a);
                    break;
                  }
                  bo(e);
                  break;
                case fa:
                  if (wo(e, n), n === (r = e.lastSuspendedTime) && (e.nextKnownPendingLevel = gs(a)), ma && ((a = e.lastPingedTime) === 0 || a >= n)) {
                    e.lastPingedTime = n, go(e, n);
                    break;
                  }
                  if ((a = wa(e)) !== 0 && a !== n) break;
                  if (r !== 0 && r !== n) {
                    e.lastPingedTime = r;
                    break;
                  }
                  if (pi !== 1073741823 ? r = 10 * (1073741821 - pi) - jn() : wr === 1073741823 ? r = 0 : (r = 10 * (1073741821 - wr) - 5e3, 0 > (r = (a = jn()) - r) && (r = 0), (n = 10 * (1073741821 - n) - a) < (r = (120 > r ? 120 : 480 > r ? 480 : 1080 > r ? 1080 : 1920 > r ? 1920 : 3e3 > r ? 3e3 : 4320 > r ? 4320 : 1960 * Pc(r / 1960)) - r) && (r = n)), 10 < r) {
                    e.timeoutHandle = ni(bo.bind(null, e), r);
                    break;
                  }
                  bo(e);
                  break;
                case 5:
                  if (wr !== 1073741823 && ha !== null) {
                    p = wr;
                    var w = ha;
                    if (0 >= (r = 0 | w.busyMinDurationMs) ? r = 0 : (a = 0 | w.busyDelayMs, r = (p = jn() - (10 * (1073741821 - p) - (0 | w.timeoutMs || 5e3))) <= a ? 0 : a + r - p), 10 < r) {
                      wo(e, n), e.timeoutHandle = ni(bo.bind(null, e), r);
                      break;
                    }
                  }
                  bo(e);
                  break;
                default:
                  throw Error(g(329));
              }
              if (xn(e), e.callbackNode === t) return jl.bind(null, e);
            }
          }
          return null;
        }
        function ms(e) {
          var t = e.lastExpiredTime;
          if (t = t !== 0 ? t : 1073741823, (48 & Qe) != 0) throw Error(g(327));
          if ($o(), e === En && t === mn || go(e, t), Ge !== null) {
            var n = Qe;
            Qe |= 16;
            for (var r = Fl(); ; ) try {
              Nc();
              break;
            } catch (a) {
              Ul(e, a);
            }
            if (Fa(), Qe = n, ua.current = r, Ft === 1) throw n = pa, go(e, t), wo(e, t), xn(e), n;
            if (Ge !== null) throw Error(g(261));
            e.finishedWork = e.current.alternate, e.finishedExpirationTime = t, En = null, bo(e), xn(e);
          }
          return null;
        }
        function zl(e, t) {
          var n = Qe;
          Qe |= 1;
          try {
            return e(t);
          } finally {
            (Qe = n) === 0 && Jn();
          }
        }
        function Ll(e, t) {
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
          if (n !== -1 && (e.timeoutHandle = -1, Ii(n)), Ge !== null) for (n = Ge.return; n !== null; ) {
            var r = n;
            switch (r.tag) {
              case 1:
                (r = r.type.childContextTypes) != null && Vi();
                break;
              case 3:
                Bo(), vt(pn), vt(Xt);
                break;
              case 5:
                qa(r);
                break;
              case 4:
                Bo();
                break;
              case 13:
              case 19:
                vt(Ct);
                break;
              case 10:
                Va(r);
            }
            n = n.return;
          }
          En = e, Ge = vo(e.current, null), mn = t, Ft = po, pa = null, pi = wr = 1073741823, ha = null, hi = 0, ma = !1;
        }
        function Ul(e, t) {
          for (; ; ) {
            try {
              if (Fa(), ta.current = sa, na) for (var n = Lt.memoizedState; n !== null; ) {
                var r = n.queue;
                r !== null && (r.pending = null), n = n.next;
              }
              if ($r = 0, Zt = sn = Lt = null, na = !1, Ge === null || Ge.return === null) return Ft = 1, pa = t, Ge = null;
              e: {
                var a = e, p = Ge.return, w = Ge, T = t;
                if (t = mn, w.effectTag |= 2048, w.firstEffect = w.lastEffect = null, T !== null && typeof T == "object" && typeof T.then == "function") {
                  var Z = T;
                  if ((2 & w.mode) == 0) {
                    var q = w.alternate;
                    q ? (w.updateQueue = q.updateQueue, w.memoizedState = q.memoizedState, w.expirationTime = q.expirationTime) : (w.updateQueue = null, w.memoizedState = null);
                  }
                  var ge = (1 & Ct.current) != 0, De = p;
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
                        re.add(Z), De.updateQueue = re;
                      } else ln.add(Z);
                      if ((2 & De.mode) == 0) {
                        if (De.effectTag |= 64, w.effectTag &= -2981, w.tag === 1) if (w.alternate === null) w.tag = 17;
                        else {
                          var ee = Hr(1073741823, null);
                          ee.tag = 2, Wr(w, ee);
                        }
                        w.expirationTime = 1073741823;
                        break e;
                      }
                      T = void 0, w = t;
                      var ue = a.pingCache;
                      if (ue === null ? (ue = a.pingCache = new Oc(), T = /* @__PURE__ */ new Set(), ue.set(Z, T)) : (T = ue.get(Z)) === void 0 && (T = /* @__PURE__ */ new Set(), ue.set(Z, T)), !T.has(w)) {
                        T.add(w);
                        var ve = Mc.bind(null, a, Z, w);
                        Z.then(ve, ve);
                      }
                      De.effectTag |= 4096, De.expirationTime = t;
                      break e;
                    }
                    De = De.return;
                  } while (De !== null);
                  T = Error((Yt(w.type) || "A React component") + ` suspended while rendering, but no fallback UI was specified.

Add a <Suspense fallback=...> component higher in the tree to provide a loading indicator or placeholder to display.` + xr(w));
                }
                Ft !== 5 && (Ft = 2), T = cs(T, w), De = p;
                do {
                  switch (De.tag) {
                    case 3:
                      Z = T, De.effectTag |= 4096, De.expirationTime = t, Ys(De, Rl(De, Z, t));
                      break e;
                    case 1:
                      Z = T;
                      var Ee = De.type, Oe = De.stateNode;
                      if ((64 & De.effectTag) == 0 && (typeof Ee.getDerivedStateFromError == "function" || Oe !== null && typeof Oe.componentDidCatch == "function" && (qr === null || !qr.has(Oe)))) {
                        De.effectTag |= 4096, De.expirationTime = t, Ys(De, Il(De, Z, t));
                        break e;
                      }
                  }
                  De = De.return;
                } while (De !== null);
              }
              Ge = Hl(Ge);
            } catch (Ve) {
              t = Ve;
              continue;
            }
            break;
          }
        }
        function Fl() {
          var e = ua.current;
          return ua.current = sa, e === null ? sa : e;
        }
        function Vl(e, t) {
          e < wr && 2 < e && (wr = e), t !== null && e < pi && 2 < e && (pi = e, ha = t);
        }
        function ka(e) {
          e > hi && (hi = e);
        }
        function Nc() {
          for (; Ge !== null; ) Ge = Bl(Ge);
        }
        function Dc() {
          for (; Ge !== null && !bc(); ) Ge = Bl(Ge);
        }
        function Bl(e) {
          var t = Al(e.alternate, e, mn);
          return e.memoizedProps = e.pendingProps, t === null && (t = Hl(e)), Ml.current = null, t;
        }
        function Hl(e) {
          Ge = e;
          do {
            var t = Ge.alternate;
            if (e = Ge.return, (2048 & Ge.effectTag) == 0) {
              if (t = Ec(t, Ge, mn), mn === 1 || Ge.childExpirationTime !== 1) {
                for (var n = 0, r = Ge.child; r !== null; ) {
                  var a = r.expirationTime, p = r.childExpirationTime;
                  a > n && (n = a), p > n && (n = p), r = r.sibling;
                }
                Ge.childExpirationTime = n;
              }
              if (t !== null) return t;
              e !== null && (2048 & e.effectTag) == 0 && (e.firstEffect === null && (e.firstEffect = Ge.firstEffect), Ge.lastEffect !== null && (e.lastEffect !== null && (e.lastEffect.nextEffect = Ge.firstEffect), e.lastEffect = Ge.lastEffect), 1 < Ge.effectTag && (e.lastEffect !== null ? e.lastEffect.nextEffect = Ge : e.firstEffect = Ge, e.lastEffect = Ge));
            } else {
              if ((t = xc(Ge)) !== null) return t.effectTag &= 2047, t;
              e !== null && (e.firstEffect = e.lastEffect = null, e.effectTag |= 2048);
            }
            if ((t = Ge.sibling) !== null) return t;
            Ge = e;
          } while (Ge !== null);
          return Ft === po && (Ft = 5), null;
        }
        function gs(e) {
          var t = e.expirationTime;
          return t > (e = e.childExpirationTime) ? t : e;
        }
        function bo(e) {
          var t = $i();
          return Vr(99, Rc.bind(null, e, t)), null;
        }
        function Rc(e, t) {
          do
            $o();
          while (mi !== null);
          if ((48 & Qe) != 0) throw Error(g(327));
          var n = e.finishedWork, r = e.finishedExpirationTime;
          if (n === null) return null;
          if (e.finishedWork = null, e.finishedExpirationTime = 0, n === e.current) throw Error(g(177));
          e.callbackNode = null, e.callbackExpirationTime = 0, e.callbackPriority = 90, e.nextKnownPendingLevel = 0;
          var a = gs(n);
          if (e.firstPendingTime = a, r <= e.lastSuspendedTime ? e.firstSuspendedTime = e.lastSuspendedTime = e.nextKnownPendingLevel = 0 : r <= e.firstSuspendedTime && (e.firstSuspendedTime = r - 1), r <= e.lastPingedTime && (e.lastPingedTime = 0), r <= e.lastExpiredTime && (e.lastExpiredTime = 0), e === En && (Ge = En = null, mn = 0), 1 < n.effectTag ? n.lastEffect !== null ? (n.lastEffect.nextEffect = n, a = n.firstEffect) : a = n : a = n.firstEffect, a !== null) {
            var p = Qe;
            Qe |= 32, Ml.current = null, Jo = To;
            var w = Di();
            if (Zo(w)) {
              if ("selectionStart" in w) var T = { start: w.selectionStart, end: w.selectionEnd };
              else e: {
                var Z = (T = (T = w.ownerDocument) && T.defaultView || window).getSelection && T.getSelection();
                if (Z && Z.rangeCount !== 0) {
                  T = Z.anchorNode;
                  var q = Z.anchorOffset, ge = Z.focusNode;
                  Z = Z.focusOffset;
                  try {
                    T.nodeType, ge.nodeType;
                  } catch {
                    T = null;
                    break e;
                  }
                  var De = 0, He = -1, ot = -1, Fn = 0, ln = 0, re = w, ee = null;
                  t: for (; ; ) {
                    for (var ue; re !== T || q !== 0 && re.nodeType !== 3 || (He = De + q), re !== ge || Z !== 0 && re.nodeType !== 3 || (ot = De + Z), re.nodeType === 3 && (De += re.nodeValue.length), (ue = re.firstChild) !== null; ) ee = re, re = ue;
                    for (; ; ) {
                      if (re === w) break t;
                      if (ee === T && ++Fn === q && (He = De), ee === ge && ++ln === Z && (ot = De), (ue = re.nextSibling) !== null) break;
                      ee = (re = ee).parentNode;
                    }
                    re = ue;
                  }
                  T = He === -1 || ot === -1 ? null : { start: He, end: ot };
                } else T = null;
              }
              T = T || { start: 0, end: 0 };
            } else T = null;
            ei = { activeElementDetached: null, focusedElem: w, selectionRange: T }, To = !1, Ae = a;
            do
              try {
                Ic();
              } catch (Ze) {
                if (Ae === null) throw Error(g(330));
                yo(Ae, Ze), Ae = Ae.nextEffect;
              }
            while (Ae !== null);
            Ae = a;
            do
              try {
                for (w = e, T = t; Ae !== null; ) {
                  var ve = Ae.effectTag;
                  if (16 & ve && st(Ae.stateNode, ""), 128 & ve) {
                    var Ee = Ae.alternate;
                    if (Ee !== null) {
                      var Oe = Ee.ref;
                      Oe !== null && (typeof Oe == "function" ? Oe(null) : Oe.current = null);
                    }
                  }
                  switch (1038 & ve) {
                    case 2:
                      Pl(Ae), Ae.effectTag &= -3;
                      break;
                    case 6:
                      Pl(Ae), Ae.effectTag &= -3, ds(Ae.alternate, Ae);
                      break;
                    case 1024:
                      Ae.effectTag &= -1025;
                      break;
                    case 1028:
                      Ae.effectTag &= -1025, ds(Ae.alternate, Ae);
                      break;
                    case 4:
                      ds(Ae.alternate, Ae);
                      break;
                    case 8:
                      Nl(w, q = Ae, T), Tl(q);
                  }
                  Ae = Ae.nextEffect;
                }
              } catch (Ze) {
                if (Ae === null) throw Error(g(330));
                yo(Ae, Ze), Ae = Ae.nextEffect;
              }
            while (Ae !== null);
            if (Oe = ei, Ee = Di(), ve = Oe.focusedElem, T = Oe.selectionRange, Ee !== ve && ve && ve.ownerDocument && function Ze(Vt, kr) {
              return !(!Vt || !kr) && (Vt === kr || (!Vt || Vt.nodeType !== 3) && (kr && kr.nodeType === 3 ? Ze(Vt, kr.parentNode) : "contains" in Vt ? Vt.contains(kr) : !!Vt.compareDocumentPosition && !!(16 & Vt.compareDocumentPosition(kr))));
            }(ve.ownerDocument.documentElement, ve)) {
              for (T !== null && Zo(ve) && (Ee = T.start, (Oe = T.end) === void 0 && (Oe = Ee), "selectionStart" in ve ? (ve.selectionStart = Ee, ve.selectionEnd = Math.min(Oe, ve.value.length)) : (Oe = (Ee = ve.ownerDocument || document) && Ee.defaultView || window).getSelection && (Oe = Oe.getSelection(), q = ve.textContent.length, w = Math.min(T.start, q), T = T.end === void 0 ? w : Math.min(T.end, q), !Oe.extend && w > T && (q = T, T = w, w = q), q = Ni(ve, w), ge = Ni(ve, T), q && ge && (Oe.rangeCount !== 1 || Oe.anchorNode !== q.node || Oe.anchorOffset !== q.offset || Oe.focusNode !== ge.node || Oe.focusOffset !== ge.offset) && ((Ee = Ee.createRange()).setStart(q.node, q.offset), Oe.removeAllRanges(), w > T ? (Oe.addRange(Ee), Oe.extend(ge.node, ge.offset)) : (Ee.setEnd(ge.node, ge.offset), Oe.addRange(Ee))))), Ee = [], Oe = ve; Oe = Oe.parentNode; ) Oe.nodeType === 1 && Ee.push({ element: Oe, left: Oe.scrollLeft, top: Oe.scrollTop });
              for (typeof ve.focus == "function" && ve.focus(), ve = 0; ve < Ee.length; ve++) (Oe = Ee[ve]).element.scrollLeft = Oe.left, Oe.element.scrollTop = Oe.top;
            }
            To = !!Jo, ei = Jo = null, e.current = n, Ae = a;
            do
              try {
                for (ve = e; Ae !== null; ) {
                  var Ve = Ae.effectTag;
                  if (36 & Ve && Tc(ve, Ae.alternate, Ae), 128 & Ve) {
                    Ee = void 0;
                    var at = Ae.ref;
                    if (at !== null) {
                      var Rt = Ae.stateNode;
                      switch (Ae.tag) {
                        case 5:
                          Ee = Rt;
                          break;
                        default:
                          Ee = Rt;
                      }
                      typeof at == "function" ? at(Ee) : at.current = Ee;
                    }
                  }
                  Ae = Ae.nextEffect;
                }
              } catch (Ze) {
                if (Ae === null) throw Error(g(330));
                yo(Ae, Ze), Ae = Ae.nextEffect;
              }
            while (Ae !== null);
            Ae = null, yc(), Qe = p;
          } else e.current = n;
          if (ba) ba = !1, mi = e, gi = t;
          else for (Ae = a; Ae !== null; ) t = Ae.nextEffect, Ae.nextEffect = null, Ae = t;
          if ((t = e.firstPendingTime) === 0 && (qr = null), t === 1073741823 ? e === hs ? bi++ : (bi = 0, hs = e) : bi = 0, typeof bs == "function" && bs(n.stateNode, r), xn(e), ga) throw ga = !1, e = ps, ps = null, e;
          return (8 & Qe) != 0 || Jn(), null;
        }
        function Ic() {
          for (; Ae !== null; ) {
            var e = Ae.effectTag;
            (256 & e) != 0 && Cc(Ae.alternate, Ae), (512 & e) == 0 || ba || (ba = !0, Bs(97, function() {
              return $o(), null;
            })), Ae = Ae.nextEffect;
          }
        }
        function $o() {
          if (gi !== 90) {
            var e = 97 < gi ? 97 : gi;
            return gi = 90, Vr(e, Ac);
          }
        }
        function Ac() {
          if (mi === null) return !1;
          var e = mi;
          if (mi = null, (48 & Qe) != 0) throw Error(g(331));
          var t = Qe;
          for (Qe |= 32, e = e.current.firstEffect; e !== null; ) {
            try {
              var n = e;
              if ((512 & n.effectTag) != 0) switch (n.tag) {
                case 0:
                case 11:
                case 15:
                case 22:
                  xl(5, n), Sl(5, n);
              }
            } catch (r) {
              if (e === null) throw Error(g(330));
              yo(e, r);
            }
            n = e.nextEffect, e.nextEffect = null, e = n;
          }
          return Qe = t, Jn(), !0;
        }
        function Wl(e, t, n) {
          Wr(e, t = Rl(e, t = cs(n, t), 1073741823)), (e = va(e, 1073741823)) !== null && xn(e);
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
                Wr(n, e = Il(n, e = cs(t, e), 1073741823)), (n = va(n, 1073741823)) !== null && xn(n);
                break;
              }
            }
            n = n.return;
          }
        }
        function Mc(e, t, n) {
          var r = e.pingCache;
          r !== null && r.delete(t), En === e && mn === n ? Ft === fa || Ft === da && wr === 1073741823 && jn() - fs < 500 ? go(e, mn) : ma = !0 : $l(e, n) && ((t = e.lastPingedTime) !== 0 && t < n || (e.lastPingedTime = n, xn(e)));
        }
        function jc(e, t) {
          var n = e.stateNode;
          n !== null && n.delete(t), (t = 0) == 0 && (t = mo(t = nr(), e, null)), (e = va(e, t)) !== null && xn(e);
        }
        Al = function(e, t, n) {
          var r = t.expirationTime;
          if (e !== null) {
            var a = t.pendingProps;
            if (e.memoizedProps !== a || pn.current) tr = !0;
            else {
              if (r < n) {
                switch (tr = !1, t.tag) {
                  case 3:
                    gl(t), os();
                    break;
                  case 5:
                    if (Js(t), 4 & t.mode && n !== 1 && a.hidden) return t.expirationTime = t.childExpirationTime = 1, null;
                    break;
                  case 1:
                    hn(t.type) && Bi(t);
                    break;
                  case 4:
                    Ya(t, t.stateNode.containerInfo);
                    break;
                  case 10:
                    r = t.memoizedProps.value, a = t.type._context, St(qi, a._currentValue), a._currentValue = r;
                    break;
                  case 13:
                    if (t.memoizedState !== null) return (r = t.child.childExpirationTime) !== 0 && r >= n ? wl(e, t, n) : (St(Ct, 1 & Ct.current), (t = vr(e, t, n)) !== null ? t.sibling : null);
                    St(Ct, 1 & Ct.current);
                    break;
                  case 19:
                    if (r = t.childExpirationTime >= n, (64 & e.effectTag) != 0) {
                      if (r) return _l(e, t, n);
                      t.effectTag |= 64;
                    }
                    if ((a = t.memoizedState) !== null && (a.rendering = null, a.tail = null), St(Ct, Ct.current), !r) return null;
                }
                return vr(e, t, n);
              }
              tr = !1;
            }
          } else tr = !1;
          switch (t.expirationTime = 0, t.tag) {
            case 2:
              if (r = t.type, e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= 2), e = t.pendingProps, a = Lo(t, Xt.current), Fo(t, n), a = Ga(null, t, r, e, a, n), t.effectTag |= 1, typeof a == "object" && a !== null && typeof a.render == "function" && a.$$typeof === void 0) {
                if (t.tag = 1, t.memoizedState = null, t.updateQueue = null, hn(r)) {
                  var p = !0;
                  Bi(t);
                } else p = !1;
                t.memoizedState = a.state !== null && a.state !== void 0 ? a.state : null, Ba(t);
                var w = r.getDerivedStateFromProps;
                typeof w == "function" && Gi(t, r, w, e), a.updater = Xi, t.stateNode = a, a._reactInternalFiber = t, Wa(t, r, e, n), t = as(null, t, r, !0, p, n);
              } else t.tag = 0, Un(null, t, a, n), t = t.child;
              return t;
            case 16:
              e: {
                if (a = t.elementType, e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= 2), e = t.pendingProps, function(ge) {
                  if (ge._status === -1) {
                    ge._status = 0;
                    var De = ge._ctor;
                    De = De(), ge._result = De, De.then(function(He) {
                      ge._status === 0 && (He = He.default, ge._status = 1, ge._result = He);
                    }, function(He) {
                      ge._status === 0 && (ge._status = 2, ge._result = He);
                    });
                  }
                }(a), a._status !== 1) throw a._result;
                switch (a = a._result, t.type = a, p = t.tag = function(ge) {
                  if (typeof ge == "function") return vs(ge) ? 1 : 0;
                  if (ge != null) {
                    if ((ge = ge.$$typeof) === Tt) return 11;
                    if (ge === Sn) return 14;
                  }
                  return 2;
                }(a), e = $n(a, e), p) {
                  case 0:
                    t = is(null, t, a, e, n);
                    break e;
                  case 1:
                    t = ml(null, t, a, e, n);
                    break e;
                  case 11:
                    t = dl(null, t, a, e, n);
                    break e;
                  case 14:
                    t = fl(null, t, a, $n(a.type, e), r, n);
                    break e;
                }
                throw Error(g(306, a, ""));
              }
              return t;
            case 0:
              return r = t.type, a = t.pendingProps, is(e, t, r, a = t.elementType === r ? a : $n(r, a), n);
            case 1:
              return r = t.type, a = t.pendingProps, ml(e, t, r, a = t.elementType === r ? a : $n(r, a), n);
            case 3:
              if (gl(t), r = t.updateQueue, e === null || r === null) throw Error(g(282));
              if (r = t.pendingProps, a = (a = t.memoizedState) !== null ? a.element : null, Ha(e, t), si(t, r, null, n), (r = t.memoizedState.element) === a) os(), t = vr(e, t, n);
              else {
                if ((a = t.stateNode.hydrate) && (Yr = Ar(t.stateNode.containerInfo.firstChild), yr = t, a = fo = !0), a) for (n = $a(t, null, r, n), t.child = n; n; ) n.effectTag = -3 & n.effectTag | 1024, n = n.sibling;
                else Un(e, t, r, n), os();
                t = t.child;
              }
              return t;
            case 5:
              return Js(t), e === null && rs(t), r = t.type, a = t.pendingProps, p = e !== null ? e.memoizedProps : null, w = a.children, ti(r, a) ? w = null : p !== null && ti(r, p) && (t.effectTag |= 16), hl(e, t), 4 & t.mode && n !== 1 && a.hidden ? (t.expirationTime = t.childExpirationTime = 1, t = null) : (Un(e, t, w, n), t = t.child), t;
            case 6:
              return e === null && rs(t), null;
            case 13:
              return wl(e, t, n);
            case 4:
              return Ya(t, t.stateNode.containerInfo), r = t.pendingProps, e === null ? t.child = Vo(t, null, r, n) : Un(e, t, r, n), t.child;
            case 11:
              return r = t.type, a = t.pendingProps, dl(e, t, r, a = t.elementType === r ? a : $n(r, a), n);
            case 7:
              return Un(e, t, t.pendingProps, n), t.child;
            case 8:
            case 12:
              return Un(e, t, t.pendingProps.children, n), t.child;
            case 10:
              e: {
                r = t.type._context, a = t.pendingProps, w = t.memoizedProps, p = a.value;
                var T = t.type._context;
                if (St(qi, T._currentValue), T._currentValue = p, w !== null) if (T = w.value, (p = mr(T, p) ? 0 : 0 | (typeof r._calculateChangedBits == "function" ? r._calculateChangedBits(T, p) : 1073741823)) === 0) {
                  if (w.children === a.children && !pn.current) {
                    t = vr(e, t, n);
                    break e;
                  }
                } else for ((T = t.child) !== null && (T.return = t); T !== null; ) {
                  var Z = T.dependencies;
                  if (Z !== null) {
                    w = T.child;
                    for (var q = Z.firstContext; q !== null; ) {
                      if (q.context === r && (q.observedBits & p) != 0) {
                        T.tag === 1 && ((q = Hr(n, null)).tag = 2, Wr(T, q)), T.expirationTime < n && (T.expirationTime = n), (q = T.alternate) !== null && q.expirationTime < n && (q.expirationTime = n), $s(T.return, n), Z.expirationTime < n && (Z.expirationTime = n);
                        break;
                      }
                      q = q.next;
                    }
                  } else w = T.tag === 10 && T.type === t.type ? null : T.child;
                  if (w !== null) w.return = T;
                  else for (w = T; w !== null; ) {
                    if (w === t) {
                      w = null;
                      break;
                    }
                    if ((T = w.sibling) !== null) {
                      T.return = w.return, w = T;
                      break;
                    }
                    w = w.return;
                  }
                  T = w;
                }
                Un(e, t, a.children, n), t = t.child;
              }
              return t;
            case 9:
              return a = t.type, r = (p = t.pendingProps).children, Fo(t, n), r = r(a = zn(a, p.unstable_observedBits)), t.effectTag |= 1, Un(e, t, r, n), t.child;
            case 14:
              return p = $n(a = t.type, t.pendingProps), fl(e, t, a, p = $n(a.type, p), r, n);
            case 15:
              return pl(e, t, t.type, t.pendingProps, r, n);
            case 17:
              return r = t.type, a = t.pendingProps, a = t.elementType === r ? a : $n(r, a), e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= 2), t.tag = 1, hn(r) ? (e = !0, Bi(t)) : e = !1, Fo(t, n), Gs(t, r, a), Wa(t, r, a, n), as(null, t, r, !0, e, n);
            case 19:
              return _l(e, t, n);
          }
          throw Error(g(156, t.tag));
        };
        var bs = null, ys = null;
        function zc(e, t, n, r) {
          this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = r, this.effectTag = 0, this.lastEffect = this.firstEffect = this.nextEffect = null, this.childExpirationTime = this.expirationTime = 0, this.alternate = null;
        }
        function rr(e, t, n, r) {
          return new zc(e, t, n, r);
        }
        function vs(e) {
          return !(!(e = e.prototype) || !e.isReactComponent);
        }
        function vo(e, t) {
          var n = e.alternate;
          return n === null ? ((n = rr(e.tag, t, e.key, e.mode)).elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.effectTag = 0, n.nextEffect = null, n.firstEffect = null, n.lastEffect = null), n.childExpirationTime = e.childExpirationTime, n.expirationTime = e.expirationTime, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : { expirationTime: t.expirationTime, firstContext: t.firstContext, responders: t.responders }, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n;
        }
        function _a(e, t, n, r, a, p) {
          var w = 2;
          if (r = e, typeof e == "function") vs(e) && (w = 1);
          else if (typeof e == "string") w = 5;
          else e: switch (e) {
            case wt:
              return Qr(n.children, a, p, t);
            case _r:
              w = 8, a |= 7;
              break;
            case Jt:
              w = 8, a |= 1;
              break;
            case kt:
              return (e = rr(12, n, t, 8 | a)).elementType = kt, e.type = kt, e.expirationTime = p, e;
            case pt:
              return (e = rr(13, n, t, a)).type = pt, e.elementType = pt, e.expirationTime = p, e;
            case Yn:
              return (e = rr(19, n, t, a)).elementType = Yn, e.expirationTime = p, e;
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
                case Er:
                  w = 22;
                  break e;
              }
              throw Error(g(130, e == null ? e : typeof e, ""));
          }
          return (t = rr(w, n, t, a)).elementType = e, t.type = r, t.expirationTime = p, t;
        }
        function Qr(e, t, n, r) {
          return (e = rr(7, e, r, t)).expirationTime = n, e;
        }
        function ws(e, t, n) {
          return (e = rr(6, e, null, t)).expirationTime = n, e;
        }
        function ks(e, t, n) {
          return (t = rr(4, e.children !== null ? e.children : [], e.key, t)).expirationTime = n, t.stateNode = { containerInfo: e.containerInfo, pendingChildren: null, implementation: e.implementation }, t;
        }
        function Lc(e, t, n) {
          this.tag = t, this.current = null, this.containerInfo = e, this.pingCache = this.pendingChildren = null, this.finishedExpirationTime = 0, this.finishedWork = null, this.timeoutHandle = -1, this.pendingContext = this.context = null, this.hydrate = n, this.callbackNode = null, this.callbackPriority = 90, this.lastExpiredTime = this.lastPingedTime = this.nextKnownPendingLevel = this.lastSuspendedTime = this.firstSuspendedTime = this.firstPendingTime = 0;
        }
        function $l(e, t) {
          var n = e.firstSuspendedTime;
          return e = e.lastSuspendedTime, n !== 0 && n >= t && e <= t;
        }
        function wo(e, t) {
          var n = e.firstSuspendedTime, r = e.lastSuspendedTime;
          n < t && (e.firstSuspendedTime = t), (r > t || n === 0) && (e.lastSuspendedTime = t), t <= e.lastPingedTime && (e.lastPingedTime = 0), t <= e.lastExpiredTime && (e.lastExpiredTime = 0);
        }
        function Yl(e, t) {
          t > e.firstPendingTime && (e.firstPendingTime = t);
          var n = e.firstSuspendedTime;
          n !== 0 && (t >= n ? e.firstSuspendedTime = e.lastSuspendedTime = e.nextKnownPendingLevel = 0 : t >= e.lastSuspendedTime && (e.lastSuspendedTime = t + 1), t > e.nextKnownPendingLevel && (e.nextKnownPendingLevel = t));
        }
        function _s(e, t) {
          var n = e.lastExpiredTime;
          (n === 0 || n > t) && (e.lastExpiredTime = t);
        }
        function Ea(e, t, n, r) {
          var a = t.current, p = nr(), w = li.suspense;
          p = mo(p, a, w);
          e: if (n) {
            t: {
              if (Nn(n = n._reactInternalFiber) !== n || n.tag !== 1) throw Error(g(170));
              var T = n;
              do {
                switch (T.tag) {
                  case 3:
                    T = T.stateNode.context;
                    break t;
                  case 1:
                    if (hn(T.type)) {
                      T = T.stateNode.__reactInternalMemoizedMergedChildContext;
                      break t;
                    }
                }
                T = T.return;
              } while (T !== null);
              throw Error(g(171));
            }
            if (n.tag === 1) {
              var Z = n.type;
              if (hn(Z)) {
                n = Ds(n, Z, T);
                break e;
              }
            }
            n = T;
          } else n = Fr;
          return t.context === null ? t.context = n : t.pendingContext = n, (t = Hr(p, w)).payload = { element: e }, (r = r === void 0 ? null : r) !== null && (t.callback = r), Wr(a, t), Kr(a, p), p;
        }
        function Es(e) {
          if (!(e = e.current).child) return null;
          switch (e.child.tag) {
            case 5:
            default:
              return e.child.stateNode;
          }
        }
        function ql(e, t) {
          (e = e.memoizedState) !== null && e.dehydrated !== null && e.retryTime < t && (e.retryTime = t);
        }
        function xs(e, t) {
          ql(e, t), (e = e.alternate) && ql(e, t);
        }
        function Ss(e, t, n) {
          var r = new Lc(e, t, n = n != null && n.hydrate === !0), a = rr(3, null, null, t === 2 ? 7 : t === 1 ? 3 : 0);
          r.current = a, a.stateNode = r, Ba(a), e[ro] = r.current, n && t !== 0 && function(p, w) {
            var T = un(w);
            Bn.forEach(function(Z) {
              yt(Z, w, T);
            }), Nt.forEach(function(Z) {
              yt(Z, w, T);
            });
          }(0, e.nodeType === 9 ? e : e.ownerDocument), this._internalRoot = r;
        }
        function yi(e) {
          return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11 && (e.nodeType !== 8 || e.nodeValue !== " react-mount-point-unstable "));
        }
        function xa(e, t, n, r, a) {
          var p = n._reactRootContainer;
          if (p) {
            var w = p._internalRoot;
            if (typeof a == "function") {
              var T = a;
              a = function() {
                var q = Es(w);
                T.call(q);
              };
            }
            Ea(t, w, e, a);
          } else {
            if (p = n._reactRootContainer = function(q, ge) {
              if (ge || (ge = !(!(ge = q ? q.nodeType === 9 ? q.documentElement : q.firstChild : null) || ge.nodeType !== 1 || !ge.hasAttribute("data-reactroot"))), !ge) for (var De; De = q.lastChild; ) q.removeChild(De);
              return new Ss(q, 0, ge ? { hydrate: !0 } : void 0);
            }(n, r), w = p._internalRoot, typeof a == "function") {
              var Z = a;
              a = function() {
                var q = Es(w);
                Z.call(q);
              };
            }
            Ll(function() {
              Ea(t, w, e, a);
            });
          }
          return Es(w);
        }
        function Uc(e, t, n) {
          var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
          return { $$typeof: It, key: r == null ? null : "" + r, children: e, containerInfo: t, implementation: n };
        }
        function Kl(e, t) {
          var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
          if (!yi(t)) throw Error(g(200));
          return Uc(e, t, null, n);
        }
        Ss.prototype.render = function(e) {
          Ea(e, this._internalRoot, null, null);
        }, Ss.prototype.unmount = function() {
          var e = this._internalRoot, t = e.containerInfo;
          Ea(null, e, null, function() {
            t[ro] = null;
          });
        }, _t = function(e) {
          if (e.tag === 13) {
            var t = Yi(nr(), 150, 100);
            Kr(e, t), xs(e, t);
          }
        }, ur = function(e) {
          e.tag === 13 && (Kr(e, 3), xs(e, 3));
        }, dr = function(e) {
          if (e.tag === 13) {
            var t = nr();
            Kr(e, t = mo(t, e, null)), xs(e, t);
          }
        }, ce = function(e, t, n) {
          switch (t) {
            case "input":
              if (ir(e, n), t = n.name, n.type === "radio" && t != null) {
                for (n = e; n.parentNode; ) n = n.parentNode;
                for (n = n.querySelectorAll("input[name=" + JSON.stringify("" + t) + '][type="radio"]'), t = 0; t < n.length; t++) {
                  var r = n[t];
                  if (r !== e && r.form === e.form) {
                    var a = ri(r);
                    if (!a) throw Error(g(90));
                    ut(r), ir(r, a);
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
        }, be = zl, Te = function(e, t, n, r, a) {
          var p = Qe;
          Qe |= 4;
          try {
            return Vr(98, e.bind(null, t, n, r, a));
          } finally {
            (Qe = p) === 0 && Jn();
          }
        }, ke = function() {
          (49 & Qe) == 0 && (function() {
            if (ho !== null) {
              var e = ho;
              ho = null, e.forEach(function(t, n) {
                _s(n, t), xn(n);
              }), Jn();
            }
          }(), $o());
        }, Pe = function(e, t) {
          var n = Qe;
          Qe |= 2;
          try {
            return e(t);
          } finally {
            (Qe = n) === 0 && Jn();
          }
        };
        var Ql, Cs, Fc = { Events: [oo, Gn, ri, le, z, jr, function(e) {
          qn(e, Ma);
        }, D, ie, Oo, At, $o, { current: !1 }] };
        Cs = (Ql = { findFiberByHostInstance: Mr, bundleType: 0, version: "16.14.0", rendererPackageName: "react-dom" }).findFiberByHostInstance, function(e) {
          if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u") return !1;
          var t = __REACT_DEVTOOLS_GLOBAL_HOOK__;
          if (t.isDisabled || !t.supportsFiber) return !0;
          try {
            var n = t.inject(e);
            bs = function(r) {
              try {
                t.onCommitFiberRoot(n, r, void 0, (64 & r.current.effectTag) == 64);
              } catch {
              }
            }, ys = function(r) {
              try {
                t.onCommitFiberUnmount(n, r);
              } catch {
              }
            };
          } catch {
          }
        }(o({}, Ql, { overrideHookState: null, overrideProps: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: he.ReactCurrentDispatcher, findHostInstanceByFiber: function(e) {
          return (e = rt(e)) === null ? null : e.stateNode;
        }, findFiberByHostInstance: function(e) {
          return Cs ? Cs(e) : null;
        }, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null })), i.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Fc, i.createPortal = Kl, i.findDOMNode = function(e) {
          if (e == null) return null;
          if (e.nodeType === 1) return e;
          var t = e._reactInternalFiber;
          if (t === void 0)
            throw typeof e.render == "function" ? Error(g(188)) : Error(g(268, Object.keys(e)));
          return e = (e = rt(t)) === null ? null : e.stateNode;
        }, i.flushSync = function(e, t) {
          if ((48 & Qe) != 0) throw Error(g(187));
          var n = Qe;
          Qe |= 1;
          try {
            return Vr(99, e.bind(null, t));
          } finally {
            Qe = n, Jn();
          }
        }, i.hydrate = function(e, t, n) {
          if (!yi(t)) throw Error(g(200));
          return xa(null, e, t, !0, n);
        }, i.render = function(e, t, n) {
          if (!yi(t)) throw Error(g(200));
          return xa(null, e, t, !1, n);
        }, i.unmountComponentAtNode = function(e) {
          if (!yi(e)) throw Error(g(40));
          return !!e._reactRootContainer && (Ll(function() {
            xa(null, null, e, !1, function() {
              e._reactRootContainer = null, e[ro] = null;
            });
          }), !0);
        }, i.unstable_batchedUpdates = zl, i.unstable_createPortal = function(e, t) {
          return Kl(e, t, 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null);
        }, i.unstable_renderSubtreeIntoContainer = function(e, t, n, r) {
          if (!yi(n)) throw Error(g(200));
          if (e == null || e._reactInternalFiber === void 0) throw Error(g(38));
          return xa(e, t, n, !1, r);
        }, i.version = "16.14.0";
      }, function(m, i, u) {
        m.exports = u(24);
      }, function(m, i, u) {
        var c, o, E, g, b;
        if (typeof window > "u" || typeof MessageChannel != "function") {
          var y = null, v = null, C = function() {
            if (y !== null) try {
              var Y = i.unstable_now();
              y(!0, Y), y = null;
            } catch (me) {
              throw setTimeout(C, 0), me;
            }
          }, x = Date.now();
          i.unstable_now = function() {
            return Date.now() - x;
          }, c = function(Y) {
            y !== null ? setTimeout(c, 0, Y) : (y = Y, setTimeout(C, 0));
          }, o = function(Y, me) {
            v = setTimeout(Y, me);
          }, E = function() {
            clearTimeout(v);
          }, g = function() {
            return !1;
          }, b = i.unstable_forceFrameRate = function() {
          };
        } else {
          var N = window.performance, G = window.Date, K = window.setTimeout, j = window.clearTimeout;
          if (typeof console < "u") {
            var V = window.cancelAnimationFrame;
            typeof window.requestAnimationFrame != "function" && console.error("This browser doesn't support requestAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills"), typeof V != "function" && console.error("This browser doesn't support cancelAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills");
          }
          if (typeof N == "object" && typeof N.now == "function") i.unstable_now = function() {
            return N.now();
          };
          else {
            var P = G.now();
            i.unstable_now = function() {
              return G.now() - P;
            };
          }
          var M = !1, B = null, I = -1, oe = 5, Q = 0;
          g = function() {
            return i.unstable_now() >= Q;
          }, b = function() {
          }, i.unstable_forceFrameRate = function(Y) {
            0 > Y || 125 < Y ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing framerates higher than 125 fps is not unsupported") : oe = 0 < Y ? Math.floor(1e3 / Y) : 5;
          };
          var z = new MessageChannel(), A = z.port2;
          z.port1.onmessage = function() {
            if (B !== null) {
              var Y = i.unstable_now();
              Q = Y + oe;
              try {
                B(!0, Y) ? A.postMessage(null) : (M = !1, B = null);
              } catch (me) {
                throw A.postMessage(null), me;
              }
            } else M = !1;
          }, c = function(Y) {
            B = Y, M || (M = !0, A.postMessage(null));
          }, o = function(Y, me) {
            I = K(function() {
              Y(i.unstable_now());
            }, me);
          }, E = function() {
            j(I), I = -1;
          };
        }
        function se(Y, me) {
          var l = Y.length;
          Y.push(me);
          e: for (; ; ) {
            var f = l - 1 >>> 1, k = Y[f];
            if (!(k !== void 0 && 0 < ce(k, me))) break e;
            Y[f] = me, Y[l] = k, l = f;
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
              e: for (var f = 0, k = Y.length; f < k; ) {
                var U = 2 * (f + 1) - 1, F = Y[U], H = U + 1, he = Y[H];
                if (F !== void 0 && 0 > ce(F, l)) he !== void 0 && 0 > ce(he, F) ? (Y[f] = he, Y[H] = l, f = H) : (Y[f] = F, Y[U] = l, f = U);
                else {
                  if (!(he !== void 0 && 0 > ce(he, l))) break e;
                  Y[f] = he, Y[H] = l, f = H;
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
        var ye = [], J = [], de = 1, D = null, ie = 3, be = !1, Te = !1, ke = !1;
        function Pe(Y) {
          for (var me = le(J); me !== null; ) {
            if (me.callback === null) te(J);
            else {
              if (!(me.startTime <= Y)) break;
              te(J), me.sortIndex = me.expirationTime, se(ye, me);
            }
            me = le(J);
          }
        }
        function Se(Y) {
          if (ke = !1, Pe(Y), !Te) if (le(ye) !== null) Te = !0, c(ze);
          else {
            var me = le(J);
            me !== null && o(Se, me.startTime - Y);
          }
        }
        function ze(Y, me) {
          Te = !1, ke && (ke = !1, E()), be = !0;
          var l = ie;
          try {
            for (Pe(me), D = le(ye); D !== null && (!(D.expirationTime > me) || Y && !g()); ) {
              var f = D.callback;
              if (f !== null) {
                D.callback = null, ie = D.priorityLevel;
                var k = f(D.expirationTime <= me);
                me = i.unstable_now(), typeof k == "function" ? D.callback = k : D === le(ye) && te(ye), Pe(me);
              } else te(ye);
              D = le(ye);
            }
            if (D !== null) var U = !0;
            else {
              var F = le(J);
              F !== null && o(Se, F.startTime - me), U = !1;
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
        var X = b;
        i.unstable_IdlePriority = 5, i.unstable_ImmediatePriority = 1, i.unstable_LowPriority = 4, i.unstable_NormalPriority = 3, i.unstable_Profiling = null, i.unstable_UserBlockingPriority = 2, i.unstable_cancelCallback = function(Y) {
          Y.callback = null;
        }, i.unstable_continueExecution = function() {
          Te || be || (Te = !0, c(ze));
        }, i.unstable_getCurrentPriorityLevel = function() {
          return ie;
        }, i.unstable_getFirstCallbackNode = function() {
          return le(ye);
        }, i.unstable_next = function(Y) {
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
        }, i.unstable_pauseExecution = function() {
        }, i.unstable_requestPaint = X, i.unstable_runWithPriority = function(Y, me) {
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
        }, i.unstable_scheduleCallback = function(Y, me, l) {
          var f = i.unstable_now();
          if (typeof l == "object" && l !== null) {
            var k = l.delay;
            k = typeof k == "number" && 0 < k ? f + k : f, l = typeof l.timeout == "number" ? l.timeout : Je(Y);
          } else l = Je(Y), k = f;
          return Y = { id: de++, callback: me, priorityLevel: Y, startTime: k, expirationTime: l = k + l, sortIndex: -1 }, k > f ? (Y.sortIndex = k, se(J, Y), le(ye) === null && Y === le(J) && (ke ? E() : ke = !0, o(Se, k - f))) : (Y.sortIndex = l, se(ye, Y), Te || be || (Te = !0, c(ze))), Y;
        }, i.unstable_shouldYield = function() {
          var Y = i.unstable_now();
          Pe(Y);
          var me = le(ye);
          return me !== D && D !== null && me !== null && me.callback !== null && me.startTime <= Y && me.expirationTime < D.expirationTime || g();
        }, i.unstable_wrapCallback = function(Y) {
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
      }, function(m, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.toString = void 0;
        const c = u(13), o = u(26), E = u(17), g = { string: c.quoteString, number: (b) => Object.is(b, -0) ? "-0" : String(b), boolean: String, symbol: (b, y, v) => {
          const C = Symbol.keyFor(b);
          return C !== void 0 ? `Symbol.for(${v(C)})` : `Symbol(${v(b.description)})`;
        }, bigint: (b, y, v) => `BigInt(${v(String(b))})`, undefined: String, object: o.objectToString, function: E.functionToString };
        i.toString = (b, y, v, C) => b === null ? "null" : g[typeof b](b, y, v, C);
      }, function(m, i, u) {
        (function(c, o) {
          Object.defineProperty(i, "__esModule", { value: !0 }), i.objectToString = void 0;
          const E = u(13), g = u(17), b = u(31);
          i.objectToString = (C, x, N, G) => {
            if (typeof c == "function" && c.isBuffer(C)) return `Buffer.from(${N(C.toString("base64"))}, 'base64')`;
            if (typeof o == "object" && C === o) return y(C, x, N);
            const K = v[Object.prototype.toString.call(C)];
            return K ? K(C, x, N, G) : void 0;
          };
          const y = (C, x, N) => `Function(${N("return this")})()`, v = { "[object Array]": b.arrayToString, "[object Object]": (C, x, N, G) => {
            const K = x ? `
` : "", j = x ? " " : "", V = Object.keys(C).reduce(function(P, M) {
              const B = C[M], I = N(B, M);
              if (I === void 0) return P;
              const oe = I.split(`
`).join(`
` + x);
              return g.USED_METHOD_KEY.has(B) ? (P.push(`${x}${oe}`), P) : (P.push(`${x}${E.quoteKey(M, N)}:${j}${oe}`), P);
            }, []).join("," + K);
            return V === "" ? "{}" : `{${K}${V}${K}}`;
          }, "[object Error]": (C, x, N) => `new Error(${N(C.message)})`, "[object Date]": (C) => `new Date(${C.getTime()})`, "[object String]": (C, x, N) => `new String(${N(C.toString())})`, "[object Number]": (C) => `new Number(${C})`, "[object Boolean]": (C) => `new Boolean(${C})`, "[object Set]": (C, x, N) => `new Set(${N(Array.from(C))})`, "[object Map]": (C, x, N) => `new Map(${N(Array.from(C))})`, "[object RegExp]": String, "[object global]": y, "[object Window]": y };
        }).call(this, u(27).Buffer, u(15));
      }, function(m, i, u) {
        (function(c) {
          var o = u(28), E = u(29), g = u(30);
          function b() {
            return v.TYPED_ARRAY_SUPPORT ? 2147483647 : 1073741823;
          }
          function y(l, f) {
            if (b() < f) throw new RangeError("Invalid typed array length");
            return v.TYPED_ARRAY_SUPPORT ? (l = new Uint8Array(f)).__proto__ = v.prototype : (l === null && (l = new v(f)), l.length = f), l;
          }
          function v(l, f, k) {
            if (!(v.TYPED_ARRAY_SUPPORT || this instanceof v)) return new v(l, f, k);
            if (typeof l == "number") {
              if (typeof f == "string") throw new Error("If encoding is specified then the first argument must be a string");
              return N(this, l);
            }
            return C(this, l, f, k);
          }
          function C(l, f, k, U) {
            if (typeof f == "number") throw new TypeError('"value" argument must not be a number');
            return typeof ArrayBuffer < "u" && f instanceof ArrayBuffer ? function(F, H, he, je) {
              if (H.byteLength, he < 0 || H.byteLength < he) throw new RangeError("'offset' is out of bounds");
              if (H.byteLength < he + (je || 0)) throw new RangeError("'length' is out of bounds");
              return H = he === void 0 && je === void 0 ? new Uint8Array(H) : je === void 0 ? new Uint8Array(H, he) : new Uint8Array(H, he, je), v.TYPED_ARRAY_SUPPORT ? (F = H).__proto__ = v.prototype : F = G(F, H), F;
            }(l, f, k, U) : typeof f == "string" ? function(F, H, he) {
              if (typeof he == "string" && he !== "" || (he = "utf8"), !v.isEncoding(he)) throw new TypeError('"encoding" must be a valid string encoding');
              var je = 0 | j(H, he), Re = (F = y(F, je)).write(H, he);
              return Re !== je && (F = F.slice(0, Re)), F;
            }(l, f, k) : function(F, H) {
              if (v.isBuffer(H)) {
                var he = 0 | K(H.length);
                return (F = y(F, he)).length === 0 || H.copy(F, 0, 0, he), F;
              }
              if (H) {
                if (typeof ArrayBuffer < "u" && H.buffer instanceof ArrayBuffer || "length" in H) return typeof H.length != "number" || (je = H.length) != je ? y(F, 0) : G(F, H);
                if (H.type === "Buffer" && g(H.data)) return G(F, H.data);
              }
              var je;
              throw new TypeError("First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.");
            }(l, f);
          }
          function x(l) {
            if (typeof l != "number") throw new TypeError('"size" argument must be a number');
            if (l < 0) throw new RangeError('"size" argument must not be negative');
          }
          function N(l, f) {
            if (x(f), l = y(l, f < 0 ? 0 : 0 | K(f)), !v.TYPED_ARRAY_SUPPORT) for (var k = 0; k < f; ++k) l[k] = 0;
            return l;
          }
          function G(l, f) {
            var k = f.length < 0 ? 0 : 0 | K(f.length);
            l = y(l, k);
            for (var U = 0; U < k; U += 1) l[U] = 255 & f[U];
            return l;
          }
          function K(l) {
            if (l >= b()) throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + b().toString(16) + " bytes");
            return 0 | l;
          }
          function j(l, f) {
            if (v.isBuffer(l)) return l.length;
            if (typeof ArrayBuffer < "u" && typeof ArrayBuffer.isView == "function" && (ArrayBuffer.isView(l) || l instanceof ArrayBuffer)) return l.byteLength;
            typeof l != "string" && (l = "" + l);
            var k = l.length;
            if (k === 0) return 0;
            for (var U = !1; ; ) switch (f) {
              case "ascii":
              case "latin1":
              case "binary":
                return k;
              case "utf8":
              case "utf-8":
              case void 0:
                return X(l).length;
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
                if (U) return X(l).length;
                f = ("" + f).toLowerCase(), U = !0;
            }
          }
          function V(l, f, k) {
            var U = !1;
            if ((f === void 0 || f < 0) && (f = 0), f > this.length || ((k === void 0 || k > this.length) && (k = this.length), k <= 0) || (k >>>= 0) <= (f >>>= 0)) return "";
            for (l || (l = "utf8"); ; ) switch (l) {
              case "hex":
                return J(this, f, k);
              case "utf8":
              case "utf-8":
                return te(this, f, k);
              case "ascii":
                return ce(this, f, k);
              case "latin1":
              case "binary":
                return ye(this, f, k);
              case "base64":
                return le(this, f, k);
              case "ucs2":
              case "ucs-2":
              case "utf16le":
              case "utf-16le":
                return de(this, f, k);
              default:
                if (U) throw new TypeError("Unknown encoding: " + l);
                l = (l + "").toLowerCase(), U = !0;
            }
          }
          function P(l, f, k) {
            var U = l[f];
            l[f] = l[k], l[k] = U;
          }
          function M(l, f, k, U, F) {
            if (l.length === 0) return -1;
            if (typeof k == "string" ? (U = k, k = 0) : k > 2147483647 ? k = 2147483647 : k < -2147483648 && (k = -2147483648), k = +k, isNaN(k) && (k = F ? 0 : l.length - 1), k < 0 && (k = l.length + k), k >= l.length) {
              if (F) return -1;
              k = l.length - 1;
            } else if (k < 0) {
              if (!F) return -1;
              k = 0;
            }
            if (typeof f == "string" && (f = v.from(f, U)), v.isBuffer(f)) return f.length === 0 ? -1 : B(l, f, k, U, F);
            if (typeof f == "number") return f &= 255, v.TYPED_ARRAY_SUPPORT && typeof Uint8Array.prototype.indexOf == "function" ? F ? Uint8Array.prototype.indexOf.call(l, f, k) : Uint8Array.prototype.lastIndexOf.call(l, f, k) : B(l, [f], k, U, F);
            throw new TypeError("val must be string, number or Buffer");
          }
          function B(l, f, k, U, F) {
            var H, he = 1, je = l.length, Re = f.length;
            if (U !== void 0 && ((U = String(U).toLowerCase()) === "ucs2" || U === "ucs-2" || U === "utf16le" || U === "utf-16le")) {
              if (l.length < 2 || f.length < 2) return -1;
              he = 2, je /= 2, Re /= 2, k /= 2;
            }
            function Xe(Jt, kt) {
              return he === 1 ? Jt[kt] : Jt.readUInt16BE(kt * he);
            }
            if (F) {
              var We = -1;
              for (H = k; H < je; H++) if (Xe(l, H) === Xe(f, We === -1 ? 0 : H - We)) {
                if (We === -1 && (We = H), H - We + 1 === Re) return We * he;
              } else We !== -1 && (H -= H - We), We = -1;
            } else for (k + Re > je && (k = je - Re), H = k; H >= 0; H--) {
              for (var It = !0, wt = 0; wt < Re; wt++) if (Xe(l, H + wt) !== Xe(f, wt)) {
                It = !1;
                break;
              }
              if (It) return H;
            }
            return -1;
          }
          function I(l, f, k, U) {
            k = Number(k) || 0;
            var F = l.length - k;
            U ? (U = Number(U)) > F && (U = F) : U = F;
            var H = f.length;
            if (H % 2 != 0) throw new TypeError("Invalid hex string");
            U > H / 2 && (U = H / 2);
            for (var he = 0; he < U; ++he) {
              var je = parseInt(f.substr(2 * he, 2), 16);
              if (isNaN(je)) return he;
              l[k + he] = je;
            }
            return he;
          }
          function oe(l, f, k, U) {
            return me(X(f, l.length - k), l, k, U);
          }
          function Q(l, f, k, U) {
            return me(function(F) {
              for (var H = [], he = 0; he < F.length; ++he) H.push(255 & F.charCodeAt(he));
              return H;
            }(f), l, k, U);
          }
          function z(l, f, k, U) {
            return Q(l, f, k, U);
          }
          function A(l, f, k, U) {
            return me(Y(f), l, k, U);
          }
          function se(l, f, k, U) {
            return me(function(F, H) {
              for (var he, je, Re, Xe = [], We = 0; We < F.length && !((H -= 2) < 0); ++We) he = F.charCodeAt(We), je = he >> 8, Re = he % 256, Xe.push(Re), Xe.push(je);
              return Xe;
            }(f, l.length - k), l, k, U);
          }
          function le(l, f, k) {
            return f === 0 && k === l.length ? o.fromByteArray(l) : o.fromByteArray(l.slice(f, k));
          }
          function te(l, f, k) {
            k = Math.min(l.length, k);
            for (var U = [], F = f; F < k; ) {
              var H, he, je, Re, Xe = l[F], We = null, It = Xe > 239 ? 4 : Xe > 223 ? 3 : Xe > 191 ? 2 : 1;
              if (F + It <= k) switch (It) {
                case 1:
                  Xe < 128 && (We = Xe);
                  break;
                case 2:
                  (192 & (H = l[F + 1])) == 128 && (Re = (31 & Xe) << 6 | 63 & H) > 127 && (We = Re);
                  break;
                case 3:
                  H = l[F + 1], he = l[F + 2], (192 & H) == 128 && (192 & he) == 128 && (Re = (15 & Xe) << 12 | (63 & H) << 6 | 63 & he) > 2047 && (Re < 55296 || Re > 57343) && (We = Re);
                  break;
                case 4:
                  H = l[F + 1], he = l[F + 2], je = l[F + 3], (192 & H) == 128 && (192 & he) == 128 && (192 & je) == 128 && (Re = (15 & Xe) << 18 | (63 & H) << 12 | (63 & he) << 6 | 63 & je) > 65535 && Re < 1114112 && (We = Re);
              }
              We === null ? (We = 65533, It = 1) : We > 65535 && (We -= 65536, U.push(We >>> 10 & 1023 | 55296), We = 56320 | 1023 & We), U.push(We), F += It;
            }
            return function(wt) {
              var Jt = wt.length;
              if (Jt <= 4096) return String.fromCharCode.apply(String, wt);
              for (var kt = "", gt = 0; gt < Jt; ) kt += String.fromCharCode.apply(String, wt.slice(gt, gt += 4096));
              return kt;
            }(U);
          }
          i.Buffer = v, i.SlowBuffer = function(l) {
            return +l != l && (l = 0), v.alloc(+l);
          }, i.INSPECT_MAX_BYTES = 50, v.TYPED_ARRAY_SUPPORT = c.TYPED_ARRAY_SUPPORT !== void 0 ? c.TYPED_ARRAY_SUPPORT : function() {
            try {
              var l = new Uint8Array(1);
              return l.__proto__ = { __proto__: Uint8Array.prototype, foo: function() {
                return 42;
              } }, l.foo() === 42 && typeof l.subarray == "function" && l.subarray(1, 1).byteLength === 0;
            } catch {
              return !1;
            }
          }(), i.kMaxLength = b(), v.poolSize = 8192, v._augment = function(l) {
            return l.__proto__ = v.prototype, l;
          }, v.from = function(l, f, k) {
            return C(null, l, f, k);
          }, v.TYPED_ARRAY_SUPPORT && (v.prototype.__proto__ = Uint8Array.prototype, v.__proto__ = Uint8Array, typeof Symbol < "u" && Symbol.species && v[Symbol.species] === v && Object.defineProperty(v, Symbol.species, { value: null, configurable: !0 })), v.alloc = function(l, f, k) {
            return function(U, F, H, he) {
              return x(F), F <= 0 ? y(U, F) : H !== void 0 ? typeof he == "string" ? y(U, F).fill(H, he) : y(U, F).fill(H) : y(U, F);
            }(null, l, f, k);
          }, v.allocUnsafe = function(l) {
            return N(null, l);
          }, v.allocUnsafeSlow = function(l) {
            return N(null, l);
          }, v.isBuffer = function(l) {
            return !(l == null || !l._isBuffer);
          }, v.compare = function(l, f) {
            if (!v.isBuffer(l) || !v.isBuffer(f)) throw new TypeError("Arguments must be Buffers");
            if (l === f) return 0;
            for (var k = l.length, U = f.length, F = 0, H = Math.min(k, U); F < H; ++F) if (l[F] !== f[F]) {
              k = l[F], U = f[F];
              break;
            }
            return k < U ? -1 : U < k ? 1 : 0;
          }, v.isEncoding = function(l) {
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
          }, v.concat = function(l, f) {
            if (!g(l)) throw new TypeError('"list" argument must be an Array of Buffers');
            if (l.length === 0) return v.alloc(0);
            var k;
            if (f === void 0) for (f = 0, k = 0; k < l.length; ++k) f += l[k].length;
            var U = v.allocUnsafe(f), F = 0;
            for (k = 0; k < l.length; ++k) {
              var H = l[k];
              if (!v.isBuffer(H)) throw new TypeError('"list" argument must be an Array of Buffers');
              H.copy(U, F), F += H.length;
            }
            return U;
          }, v.byteLength = j, v.prototype._isBuffer = !0, v.prototype.swap16 = function() {
            var l = this.length;
            if (l % 2 != 0) throw new RangeError("Buffer size must be a multiple of 16-bits");
            for (var f = 0; f < l; f += 2) P(this, f, f + 1);
            return this;
          }, v.prototype.swap32 = function() {
            var l = this.length;
            if (l % 4 != 0) throw new RangeError("Buffer size must be a multiple of 32-bits");
            for (var f = 0; f < l; f += 4) P(this, f, f + 3), P(this, f + 1, f + 2);
            return this;
          }, v.prototype.swap64 = function() {
            var l = this.length;
            if (l % 8 != 0) throw new RangeError("Buffer size must be a multiple of 64-bits");
            for (var f = 0; f < l; f += 8) P(this, f, f + 7), P(this, f + 1, f + 6), P(this, f + 2, f + 5), P(this, f + 3, f + 4);
            return this;
          }, v.prototype.toString = function() {
            var l = 0 | this.length;
            return l === 0 ? "" : arguments.length === 0 ? te(this, 0, l) : V.apply(this, arguments);
          }, v.prototype.equals = function(l) {
            if (!v.isBuffer(l)) throw new TypeError("Argument must be a Buffer");
            return this === l || v.compare(this, l) === 0;
          }, v.prototype.inspect = function() {
            var l = "", f = i.INSPECT_MAX_BYTES;
            return this.length > 0 && (l = this.toString("hex", 0, f).match(/.{2}/g).join(" "), this.length > f && (l += " ... ")), "<Buffer " + l + ">";
          }, v.prototype.compare = function(l, f, k, U, F) {
            if (!v.isBuffer(l)) throw new TypeError("Argument must be a Buffer");
            if (f === void 0 && (f = 0), k === void 0 && (k = l ? l.length : 0), U === void 0 && (U = 0), F === void 0 && (F = this.length), f < 0 || k > l.length || U < 0 || F > this.length) throw new RangeError("out of range index");
            if (U >= F && f >= k) return 0;
            if (U >= F) return -1;
            if (f >= k) return 1;
            if (this === l) return 0;
            for (var H = (F >>>= 0) - (U >>>= 0), he = (k >>>= 0) - (f >>>= 0), je = Math.min(H, he), Re = this.slice(U, F), Xe = l.slice(f, k), We = 0; We < je; ++We) if (Re[We] !== Xe[We]) {
              H = Re[We], he = Xe[We];
              break;
            }
            return H < he ? -1 : he < H ? 1 : 0;
          }, v.prototype.includes = function(l, f, k) {
            return this.indexOf(l, f, k) !== -1;
          }, v.prototype.indexOf = function(l, f, k) {
            return M(this, l, f, k, !0);
          }, v.prototype.lastIndexOf = function(l, f, k) {
            return M(this, l, f, k, !1);
          }, v.prototype.write = function(l, f, k, U) {
            if (f === void 0) U = "utf8", k = this.length, f = 0;
            else if (k === void 0 && typeof f == "string") U = f, k = this.length, f = 0;
            else {
              if (!isFinite(f)) throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
              f |= 0, isFinite(k) ? (k |= 0, U === void 0 && (U = "utf8")) : (U = k, k = void 0);
            }
            var F = this.length - f;
            if ((k === void 0 || k > F) && (k = F), l.length > 0 && (k < 0 || f < 0) || f > this.length) throw new RangeError("Attempt to write outside buffer bounds");
            U || (U = "utf8");
            for (var H = !1; ; ) switch (U) {
              case "hex":
                return I(this, l, f, k);
              case "utf8":
              case "utf-8":
                return oe(this, l, f, k);
              case "ascii":
                return Q(this, l, f, k);
              case "latin1":
              case "binary":
                return z(this, l, f, k);
              case "base64":
                return A(this, l, f, k);
              case "ucs2":
              case "ucs-2":
              case "utf16le":
              case "utf-16le":
                return se(this, l, f, k);
              default:
                if (H) throw new TypeError("Unknown encoding: " + U);
                U = ("" + U).toLowerCase(), H = !0;
            }
          }, v.prototype.toJSON = function() {
            return { type: "Buffer", data: Array.prototype.slice.call(this._arr || this, 0) };
          };
          function ce(l, f, k) {
            var U = "";
            k = Math.min(l.length, k);
            for (var F = f; F < k; ++F) U += String.fromCharCode(127 & l[F]);
            return U;
          }
          function ye(l, f, k) {
            var U = "";
            k = Math.min(l.length, k);
            for (var F = f; F < k; ++F) U += String.fromCharCode(l[F]);
            return U;
          }
          function J(l, f, k) {
            var U = l.length;
            (!f || f < 0) && (f = 0), (!k || k < 0 || k > U) && (k = U);
            for (var F = "", H = f; H < k; ++H) F += Je(l[H]);
            return F;
          }
          function de(l, f, k) {
            for (var U = l.slice(f, k), F = "", H = 0; H < U.length; H += 2) F += String.fromCharCode(U[H] + 256 * U[H + 1]);
            return F;
          }
          function D(l, f, k) {
            if (l % 1 != 0 || l < 0) throw new RangeError("offset is not uint");
            if (l + f > k) throw new RangeError("Trying to access beyond buffer length");
          }
          function ie(l, f, k, U, F, H) {
            if (!v.isBuffer(l)) throw new TypeError('"buffer" argument must be a Buffer instance');
            if (f > F || f < H) throw new RangeError('"value" argument is out of bounds');
            if (k + U > l.length) throw new RangeError("Index out of range");
          }
          function be(l, f, k, U) {
            f < 0 && (f = 65535 + f + 1);
            for (var F = 0, H = Math.min(l.length - k, 2); F < H; ++F) l[k + F] = (f & 255 << 8 * (U ? F : 1 - F)) >>> 8 * (U ? F : 1 - F);
          }
          function Te(l, f, k, U) {
            f < 0 && (f = 4294967295 + f + 1);
            for (var F = 0, H = Math.min(l.length - k, 4); F < H; ++F) l[k + F] = f >>> 8 * (U ? F : 3 - F) & 255;
          }
          function ke(l, f, k, U, F, H) {
            if (k + U > l.length) throw new RangeError("Index out of range");
            if (k < 0) throw new RangeError("Index out of range");
          }
          function Pe(l, f, k, U, F) {
            return F || ke(l, 0, k, 4), E.write(l, f, k, U, 23, 4), k + 4;
          }
          function Se(l, f, k, U, F) {
            return F || ke(l, 0, k, 8), E.write(l, f, k, U, 52, 8), k + 8;
          }
          v.prototype.slice = function(l, f) {
            var k, U = this.length;
            if ((l = ~~l) < 0 ? (l += U) < 0 && (l = 0) : l > U && (l = U), (f = f === void 0 ? U : ~~f) < 0 ? (f += U) < 0 && (f = 0) : f > U && (f = U), f < l && (f = l), v.TYPED_ARRAY_SUPPORT) (k = this.subarray(l, f)).__proto__ = v.prototype;
            else {
              var F = f - l;
              k = new v(F, void 0);
              for (var H = 0; H < F; ++H) k[H] = this[H + l];
            }
            return k;
          }, v.prototype.readUIntLE = function(l, f, k) {
            l |= 0, f |= 0, k || D(l, f, this.length);
            for (var U = this[l], F = 1, H = 0; ++H < f && (F *= 256); ) U += this[l + H] * F;
            return U;
          }, v.prototype.readUIntBE = function(l, f, k) {
            l |= 0, f |= 0, k || D(l, f, this.length);
            for (var U = this[l + --f], F = 1; f > 0 && (F *= 256); ) U += this[l + --f] * F;
            return U;
          }, v.prototype.readUInt8 = function(l, f) {
            return f || D(l, 1, this.length), this[l];
          }, v.prototype.readUInt16LE = function(l, f) {
            return f || D(l, 2, this.length), this[l] | this[l + 1] << 8;
          }, v.prototype.readUInt16BE = function(l, f) {
            return f || D(l, 2, this.length), this[l] << 8 | this[l + 1];
          }, v.prototype.readUInt32LE = function(l, f) {
            return f || D(l, 4, this.length), (this[l] | this[l + 1] << 8 | this[l + 2] << 16) + 16777216 * this[l + 3];
          }, v.prototype.readUInt32BE = function(l, f) {
            return f || D(l, 4, this.length), 16777216 * this[l] + (this[l + 1] << 16 | this[l + 2] << 8 | this[l + 3]);
          }, v.prototype.readIntLE = function(l, f, k) {
            l |= 0, f |= 0, k || D(l, f, this.length);
            for (var U = this[l], F = 1, H = 0; ++H < f && (F *= 256); ) U += this[l + H] * F;
            return U >= (F *= 128) && (U -= Math.pow(2, 8 * f)), U;
          }, v.prototype.readIntBE = function(l, f, k) {
            l |= 0, f |= 0, k || D(l, f, this.length);
            for (var U = f, F = 1, H = this[l + --U]; U > 0 && (F *= 256); ) H += this[l + --U] * F;
            return H >= (F *= 128) && (H -= Math.pow(2, 8 * f)), H;
          }, v.prototype.readInt8 = function(l, f) {
            return f || D(l, 1, this.length), 128 & this[l] ? -1 * (255 - this[l] + 1) : this[l];
          }, v.prototype.readInt16LE = function(l, f) {
            f || D(l, 2, this.length);
            var k = this[l] | this[l + 1] << 8;
            return 32768 & k ? 4294901760 | k : k;
          }, v.prototype.readInt16BE = function(l, f) {
            f || D(l, 2, this.length);
            var k = this[l + 1] | this[l] << 8;
            return 32768 & k ? 4294901760 | k : k;
          }, v.prototype.readInt32LE = function(l, f) {
            return f || D(l, 4, this.length), this[l] | this[l + 1] << 8 | this[l + 2] << 16 | this[l + 3] << 24;
          }, v.prototype.readInt32BE = function(l, f) {
            return f || D(l, 4, this.length), this[l] << 24 | this[l + 1] << 16 | this[l + 2] << 8 | this[l + 3];
          }, v.prototype.readFloatLE = function(l, f) {
            return f || D(l, 4, this.length), E.read(this, l, !0, 23, 4);
          }, v.prototype.readFloatBE = function(l, f) {
            return f || D(l, 4, this.length), E.read(this, l, !1, 23, 4);
          }, v.prototype.readDoubleLE = function(l, f) {
            return f || D(l, 8, this.length), E.read(this, l, !0, 52, 8);
          }, v.prototype.readDoubleBE = function(l, f) {
            return f || D(l, 8, this.length), E.read(this, l, !1, 52, 8);
          }, v.prototype.writeUIntLE = function(l, f, k, U) {
            l = +l, f |= 0, k |= 0, U || ie(this, l, f, k, Math.pow(2, 8 * k) - 1, 0);
            var F = 1, H = 0;
            for (this[f] = 255 & l; ++H < k && (F *= 256); ) this[f + H] = l / F & 255;
            return f + k;
          }, v.prototype.writeUIntBE = function(l, f, k, U) {
            l = +l, f |= 0, k |= 0, U || ie(this, l, f, k, Math.pow(2, 8 * k) - 1, 0);
            var F = k - 1, H = 1;
            for (this[f + F] = 255 & l; --F >= 0 && (H *= 256); ) this[f + F] = l / H & 255;
            return f + k;
          }, v.prototype.writeUInt8 = function(l, f, k) {
            return l = +l, f |= 0, k || ie(this, l, f, 1, 255, 0), v.TYPED_ARRAY_SUPPORT || (l = Math.floor(l)), this[f] = 255 & l, f + 1;
          }, v.prototype.writeUInt16LE = function(l, f, k) {
            return l = +l, f |= 0, k || ie(this, l, f, 2, 65535, 0), v.TYPED_ARRAY_SUPPORT ? (this[f] = 255 & l, this[f + 1] = l >>> 8) : be(this, l, f, !0), f + 2;
          }, v.prototype.writeUInt16BE = function(l, f, k) {
            return l = +l, f |= 0, k || ie(this, l, f, 2, 65535, 0), v.TYPED_ARRAY_SUPPORT ? (this[f] = l >>> 8, this[f + 1] = 255 & l) : be(this, l, f, !1), f + 2;
          }, v.prototype.writeUInt32LE = function(l, f, k) {
            return l = +l, f |= 0, k || ie(this, l, f, 4, 4294967295, 0), v.TYPED_ARRAY_SUPPORT ? (this[f + 3] = l >>> 24, this[f + 2] = l >>> 16, this[f + 1] = l >>> 8, this[f] = 255 & l) : Te(this, l, f, !0), f + 4;
          }, v.prototype.writeUInt32BE = function(l, f, k) {
            return l = +l, f |= 0, k || ie(this, l, f, 4, 4294967295, 0), v.TYPED_ARRAY_SUPPORT ? (this[f] = l >>> 24, this[f + 1] = l >>> 16, this[f + 2] = l >>> 8, this[f + 3] = 255 & l) : Te(this, l, f, !1), f + 4;
          }, v.prototype.writeIntLE = function(l, f, k, U) {
            if (l = +l, f |= 0, !U) {
              var F = Math.pow(2, 8 * k - 1);
              ie(this, l, f, k, F - 1, -F);
            }
            var H = 0, he = 1, je = 0;
            for (this[f] = 255 & l; ++H < k && (he *= 256); ) l < 0 && je === 0 && this[f + H - 1] !== 0 && (je = 1), this[f + H] = (l / he >> 0) - je & 255;
            return f + k;
          }, v.prototype.writeIntBE = function(l, f, k, U) {
            if (l = +l, f |= 0, !U) {
              var F = Math.pow(2, 8 * k - 1);
              ie(this, l, f, k, F - 1, -F);
            }
            var H = k - 1, he = 1, je = 0;
            for (this[f + H] = 255 & l; --H >= 0 && (he *= 256); ) l < 0 && je === 0 && this[f + H + 1] !== 0 && (je = 1), this[f + H] = (l / he >> 0) - je & 255;
            return f + k;
          }, v.prototype.writeInt8 = function(l, f, k) {
            return l = +l, f |= 0, k || ie(this, l, f, 1, 127, -128), v.TYPED_ARRAY_SUPPORT || (l = Math.floor(l)), l < 0 && (l = 255 + l + 1), this[f] = 255 & l, f + 1;
          }, v.prototype.writeInt16LE = function(l, f, k) {
            return l = +l, f |= 0, k || ie(this, l, f, 2, 32767, -32768), v.TYPED_ARRAY_SUPPORT ? (this[f] = 255 & l, this[f + 1] = l >>> 8) : be(this, l, f, !0), f + 2;
          }, v.prototype.writeInt16BE = function(l, f, k) {
            return l = +l, f |= 0, k || ie(this, l, f, 2, 32767, -32768), v.TYPED_ARRAY_SUPPORT ? (this[f] = l >>> 8, this[f + 1] = 255 & l) : be(this, l, f, !1), f + 2;
          }, v.prototype.writeInt32LE = function(l, f, k) {
            return l = +l, f |= 0, k || ie(this, l, f, 4, 2147483647, -2147483648), v.TYPED_ARRAY_SUPPORT ? (this[f] = 255 & l, this[f + 1] = l >>> 8, this[f + 2] = l >>> 16, this[f + 3] = l >>> 24) : Te(this, l, f, !0), f + 4;
          }, v.prototype.writeInt32BE = function(l, f, k) {
            return l = +l, f |= 0, k || ie(this, l, f, 4, 2147483647, -2147483648), l < 0 && (l = 4294967295 + l + 1), v.TYPED_ARRAY_SUPPORT ? (this[f] = l >>> 24, this[f + 1] = l >>> 16, this[f + 2] = l >>> 8, this[f + 3] = 255 & l) : Te(this, l, f, !1), f + 4;
          }, v.prototype.writeFloatLE = function(l, f, k) {
            return Pe(this, l, f, !0, k);
          }, v.prototype.writeFloatBE = function(l, f, k) {
            return Pe(this, l, f, !1, k);
          }, v.prototype.writeDoubleLE = function(l, f, k) {
            return Se(this, l, f, !0, k);
          }, v.prototype.writeDoubleBE = function(l, f, k) {
            return Se(this, l, f, !1, k);
          }, v.prototype.copy = function(l, f, k, U) {
            if (k || (k = 0), U || U === 0 || (U = this.length), f >= l.length && (f = l.length), f || (f = 0), U > 0 && U < k && (U = k), U === k || l.length === 0 || this.length === 0) return 0;
            if (f < 0) throw new RangeError("targetStart out of bounds");
            if (k < 0 || k >= this.length) throw new RangeError("sourceStart out of bounds");
            if (U < 0) throw new RangeError("sourceEnd out of bounds");
            U > this.length && (U = this.length), l.length - f < U - k && (U = l.length - f + k);
            var F, H = U - k;
            if (this === l && k < f && f < U) for (F = H - 1; F >= 0; --F) l[F + f] = this[F + k];
            else if (H < 1e3 || !v.TYPED_ARRAY_SUPPORT) for (F = 0; F < H; ++F) l[F + f] = this[F + k];
            else Uint8Array.prototype.set.call(l, this.subarray(k, k + H), f);
            return H;
          }, v.prototype.fill = function(l, f, k, U) {
            if (typeof l == "string") {
              if (typeof f == "string" ? (U = f, f = 0, k = this.length) : typeof k == "string" && (U = k, k = this.length), l.length === 1) {
                var F = l.charCodeAt(0);
                F < 256 && (l = F);
              }
              if (U !== void 0 && typeof U != "string") throw new TypeError("encoding must be a string");
              if (typeof U == "string" && !v.isEncoding(U)) throw new TypeError("Unknown encoding: " + U);
            } else typeof l == "number" && (l &= 255);
            if (f < 0 || this.length < f || this.length < k) throw new RangeError("Out of range index");
            if (k <= f) return this;
            var H;
            if (f >>>= 0, k = k === void 0 ? this.length : k >>> 0, l || (l = 0), typeof l == "number") for (H = f; H < k; ++H) this[H] = l;
            else {
              var he = v.isBuffer(l) ? l : X(new v(l, U).toString()), je = he.length;
              for (H = 0; H < k - f; ++H) this[H + f] = he[H % je];
            }
            return this;
          };
          var ze = /[^+\/0-9A-Za-z-_]/g;
          function Je(l) {
            return l < 16 ? "0" + l.toString(16) : l.toString(16);
          }
          function X(l, f) {
            var k;
            f = f || 1 / 0;
            for (var U = l.length, F = null, H = [], he = 0; he < U; ++he) {
              if ((k = l.charCodeAt(he)) > 55295 && k < 57344) {
                if (!F) {
                  if (k > 56319) {
                    (f -= 3) > -1 && H.push(239, 191, 189);
                    continue;
                  }
                  if (he + 1 === U) {
                    (f -= 3) > -1 && H.push(239, 191, 189);
                    continue;
                  }
                  F = k;
                  continue;
                }
                if (k < 56320) {
                  (f -= 3) > -1 && H.push(239, 191, 189), F = k;
                  continue;
                }
                k = 65536 + (F - 55296 << 10 | k - 56320);
              } else F && (f -= 3) > -1 && H.push(239, 191, 189);
              if (F = null, k < 128) {
                if ((f -= 1) < 0) break;
                H.push(k);
              } else if (k < 2048) {
                if ((f -= 2) < 0) break;
                H.push(k >> 6 | 192, 63 & k | 128);
              } else if (k < 65536) {
                if ((f -= 3) < 0) break;
                H.push(k >> 12 | 224, k >> 6 & 63 | 128, 63 & k | 128);
              } else {
                if (!(k < 1114112)) throw new Error("Invalid code point");
                if ((f -= 4) < 0) break;
                H.push(k >> 18 | 240, k >> 12 & 63 | 128, k >> 6 & 63 | 128, 63 & k | 128);
              }
            }
            return H;
          }
          function Y(l) {
            return o.toByteArray(function(f) {
              if ((f = function(k) {
                return k.trim ? k.trim() : k.replace(/^\s+|\s+$/g, "");
              }(f).replace(ze, "")).length < 2) return "";
              for (; f.length % 4 != 0; ) f += "=";
              return f;
            }(l));
          }
          function me(l, f, k, U) {
            for (var F = 0; F < U && !(F + k >= f.length || F >= l.length); ++F) f[F + k] = l[F];
            return F;
          }
        }).call(this, u(15));
      }, function(m, i, u) {
        i.byteLength = function(x) {
          var N = v(x), G = N[0], K = N[1];
          return 3 * (G + K) / 4 - K;
        }, i.toByteArray = function(x) {
          var N, G, K = v(x), j = K[0], V = K[1], P = new E(function(I, oe, Q) {
            return 3 * (oe + Q) / 4 - Q;
          }(0, j, V)), M = 0, B = V > 0 ? j - 4 : j;
          for (G = 0; G < B; G += 4) N = o[x.charCodeAt(G)] << 18 | o[x.charCodeAt(G + 1)] << 12 | o[x.charCodeAt(G + 2)] << 6 | o[x.charCodeAt(G + 3)], P[M++] = N >> 16 & 255, P[M++] = N >> 8 & 255, P[M++] = 255 & N;
          return V === 2 && (N = o[x.charCodeAt(G)] << 2 | o[x.charCodeAt(G + 1)] >> 4, P[M++] = 255 & N), V === 1 && (N = o[x.charCodeAt(G)] << 10 | o[x.charCodeAt(G + 1)] << 4 | o[x.charCodeAt(G + 2)] >> 2, P[M++] = N >> 8 & 255, P[M++] = 255 & N), P;
        }, i.fromByteArray = function(x) {
          for (var N, G = x.length, K = G % 3, j = [], V = 0, P = G - K; V < P; V += 16383) j.push(C(x, V, V + 16383 > P ? P : V + 16383));
          return K === 1 ? (N = x[G - 1], j.push(c[N >> 2] + c[N << 4 & 63] + "==")) : K === 2 && (N = (x[G - 2] << 8) + x[G - 1], j.push(c[N >> 10] + c[N >> 4 & 63] + c[N << 2 & 63] + "=")), j.join("");
        };
        for (var c = [], o = [], E = typeof Uint8Array < "u" ? Uint8Array : Array, g = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", b = 0, y = g.length; b < y; ++b) c[b] = g[b], o[g.charCodeAt(b)] = b;
        function v(x) {
          var N = x.length;
          if (N % 4 > 0) throw new Error("Invalid string. Length must be a multiple of 4");
          var G = x.indexOf("=");
          return G === -1 && (G = N), [G, G === N ? 0 : 4 - G % 4];
        }
        function C(x, N, G) {
          for (var K, j, V = [], P = N; P < G; P += 3) K = (x[P] << 16 & 16711680) + (x[P + 1] << 8 & 65280) + (255 & x[P + 2]), V.push(c[(j = K) >> 18 & 63] + c[j >> 12 & 63] + c[j >> 6 & 63] + c[63 & j]);
          return V.join("");
        }
        o[45] = 62, o[95] = 63;
      }, function(m, i) {
        i.read = function(u, c, o, E, g) {
          var b, y, v = 8 * g - E - 1, C = (1 << v) - 1, x = C >> 1, N = -7, G = o ? g - 1 : 0, K = o ? -1 : 1, j = u[c + G];
          for (G += K, b = j & (1 << -N) - 1, j >>= -N, N += v; N > 0; b = 256 * b + u[c + G], G += K, N -= 8) ;
          for (y = b & (1 << -N) - 1, b >>= -N, N += E; N > 0; y = 256 * y + u[c + G], G += K, N -= 8) ;
          if (b === 0) b = 1 - x;
          else {
            if (b === C) return y ? NaN : 1 / 0 * (j ? -1 : 1);
            y += Math.pow(2, E), b -= x;
          }
          return (j ? -1 : 1) * y * Math.pow(2, b - E);
        }, i.write = function(u, c, o, E, g, b) {
          var y, v, C, x = 8 * b - g - 1, N = (1 << x) - 1, G = N >> 1, K = g === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0, j = E ? 0 : b - 1, V = E ? 1 : -1, P = c < 0 || c === 0 && 1 / c < 0 ? 1 : 0;
          for (c = Math.abs(c), isNaN(c) || c === 1 / 0 ? (v = isNaN(c) ? 1 : 0, y = N) : (y = Math.floor(Math.log(c) / Math.LN2), c * (C = Math.pow(2, -y)) < 1 && (y--, C *= 2), (c += y + G >= 1 ? K / C : K * Math.pow(2, 1 - G)) * C >= 2 && (y++, C /= 2), y + G >= N ? (v = 0, y = N) : y + G >= 1 ? (v = (c * C - 1) * Math.pow(2, g), y += G) : (v = c * Math.pow(2, G - 1) * Math.pow(2, g), y = 0)); g >= 8; u[o + j] = 255 & v, j += V, v /= 256, g -= 8) ;
          for (y = y << g | v, x += g; x > 0; u[o + j] = 255 & y, j += V, y /= 256, x -= 8) ;
          u[o + j - V] |= 128 * P;
        };
      }, function(m, i) {
        var u = {}.toString;
        m.exports = Array.isArray || function(c) {
          return u.call(c) == "[object Array]";
        };
      }, function(m, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.arrayToString = void 0, i.arrayToString = (c, o, E) => {
          const g = c.map(function(y, v) {
            const C = E(y, v);
            return C === void 0 ? String(C) : o + C.split(`
`).join(`
` + o);
          }).join(o ? `,
` : ","), b = o && g ? `
` : "";
          return `[${b}${g}${b}]`;
        };
      }, function(m, i, u) {
        function c(j) {
          return (c = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(V) {
            return typeof V;
          } : function(V) {
            return V && typeof Symbol == "function" && V.constructor === Symbol && V !== Symbol.prototype ? "symbol" : typeof V;
          })(j);
        }
        Object.defineProperty(i, "__esModule", { value: !0 }), i.matchesSelector = x, i.matchesSelectorAndParentsTo = function(j, V, P) {
          var M = j;
          do {
            if (x(M, V)) return !0;
            if (M === P) return !1;
            M = M.parentNode;
          } while (M);
          return !1;
        }, i.addEvent = function(j, V, P, M) {
          if (j) {
            var B = y({ capture: !0 }, M);
            j.addEventListener ? j.addEventListener(V, P, B) : j.attachEvent ? j.attachEvent("on" + V, P) : j["on" + V] = P;
          }
        }, i.removeEvent = function(j, V, P, M) {
          if (j) {
            var B = y({ capture: !0 }, M);
            j.removeEventListener ? j.removeEventListener(V, P, B) : j.detachEvent ? j.detachEvent("on" + V, P) : j["on" + V] = null;
          }
        }, i.outerHeight = function(j) {
          var V = j.clientHeight, P = j.ownerDocument.defaultView.getComputedStyle(j);
          return V += (0, o.int)(P.borderTopWidth), V += (0, o.int)(P.borderBottomWidth);
        }, i.outerWidth = function(j) {
          var V = j.clientWidth, P = j.ownerDocument.defaultView.getComputedStyle(j);
          return V += (0, o.int)(P.borderLeftWidth), V += (0, o.int)(P.borderRightWidth);
        }, i.innerHeight = function(j) {
          var V = j.clientHeight, P = j.ownerDocument.defaultView.getComputedStyle(j);
          return V -= (0, o.int)(P.paddingTop), V -= (0, o.int)(P.paddingBottom);
        }, i.innerWidth = function(j) {
          var V = j.clientWidth, P = j.ownerDocument.defaultView.getComputedStyle(j);
          return V -= (0, o.int)(P.paddingLeft), V -= (0, o.int)(P.paddingRight);
        }, i.offsetXYFromParent = function(j, V, P) {
          var M = V === V.ownerDocument.body ? { left: 0, top: 0 } : V.getBoundingClientRect(), B = (j.clientX + V.scrollLeft - M.left) / P, I = (j.clientY + V.scrollTop - M.top) / P;
          return { x: B, y: I };
        }, i.createCSSTransform = function(j, V) {
          var P = N(j, V, "px");
          return v({}, (0, E.browserPrefixToKey)("transform", E.default), P);
        }, i.createSVGTransform = function(j, V) {
          return N(j, V, "");
        }, i.getTranslation = N, i.getTouch = function(j, V) {
          return j.targetTouches && (0, o.findInArray)(j.targetTouches, function(P) {
            return V === P.identifier;
          }) || j.changedTouches && (0, o.findInArray)(j.changedTouches, function(P) {
            return V === P.identifier;
          });
        }, i.getTouchIdentifier = function(j) {
          if (j.targetTouches && j.targetTouches[0]) return j.targetTouches[0].identifier;
          if (j.changedTouches && j.changedTouches[0]) return j.changedTouches[0].identifier;
        }, i.addUserSelectStyles = function(j) {
          if (j) {
            var V = j.getElementById("react-draggable-style-el");
            V || ((V = j.createElement("style")).type = "text/css", V.id = "react-draggable-style-el", V.innerHTML = `.react-draggable-transparent-selection *::-moz-selection {all: inherit;}
`, V.innerHTML += `.react-draggable-transparent-selection *::selection {all: inherit;}
`, j.getElementsByTagName("head")[0].appendChild(V)), j.body && G(j.body, "react-draggable-transparent-selection");
          }
        }, i.removeUserSelectStyles = function(j) {
          if (j)
            try {
              if (j.body && K(j.body, "react-draggable-transparent-selection"), j.selection) j.selection.empty();
              else {
                var V = (j.defaultView || window).getSelection();
                V && V.type !== "Caret" && V.removeAllRanges();
              }
            } catch {
            }
        }, i.addClassName = G, i.removeClassName = K;
        var o = u(20), E = function(j) {
          if (j && j.__esModule) return j;
          if (j === null || c(j) !== "object" && typeof j != "function") return { default: j };
          var V = g();
          if (V && V.has(j)) return V.get(j);
          var P = {}, M = Object.defineProperty && Object.getOwnPropertyDescriptor;
          for (var B in j) if (Object.prototype.hasOwnProperty.call(j, B)) {
            var I = M ? Object.getOwnPropertyDescriptor(j, B) : null;
            I && (I.get || I.set) ? Object.defineProperty(P, B, I) : P[B] = j[B];
          }
          return P.default = j, V && V.set(j, P), P;
        }(u(56));
        function g() {
          if (typeof WeakMap != "function") return null;
          var j = /* @__PURE__ */ new WeakMap();
          return g = function() {
            return j;
          }, j;
        }
        function b(j, V) {
          var P = Object.keys(j);
          if (Object.getOwnPropertySymbols) {
            var M = Object.getOwnPropertySymbols(j);
            V && (M = M.filter(function(B) {
              return Object.getOwnPropertyDescriptor(j, B).enumerable;
            })), P.push.apply(P, M);
          }
          return P;
        }
        function y(j) {
          for (var V = 1; V < arguments.length; V++) {
            var P = arguments[V] != null ? arguments[V] : {};
            V % 2 ? b(Object(P), !0).forEach(function(M) {
              v(j, M, P[M]);
            }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(j, Object.getOwnPropertyDescriptors(P)) : b(Object(P)).forEach(function(M) {
              Object.defineProperty(j, M, Object.getOwnPropertyDescriptor(P, M));
            });
          }
          return j;
        }
        function v(j, V, P) {
          return V in j ? Object.defineProperty(j, V, { value: P, enumerable: !0, configurable: !0, writable: !0 }) : j[V] = P, j;
        }
        var C = "";
        function x(j, V) {
          return C || (C = (0, o.findInArray)(["matches", "webkitMatchesSelector", "mozMatchesSelector", "msMatchesSelector", "oMatchesSelector"], function(P) {
            return (0, o.isFunction)(j[P]);
          })), !!(0, o.isFunction)(j[C]) && j[C](V);
        }
        function N(j, V, P) {
          var M = j.x, B = j.y, I = "translate(".concat(M).concat(P, ",").concat(B).concat(P, ")");
          if (V) {
            var oe = "".concat(typeof V.x == "string" ? V.x : V.x + P), Q = "".concat(typeof V.y == "string" ? V.y : V.y + P);
            I = "translate(".concat(oe, ", ").concat(Q, ")") + I;
          }
          return I;
        }
        function G(j, V) {
          j.classList ? j.classList.add(V) : j.className.match(new RegExp("(?:^|\\s)".concat(V, "(?!\\S)"))) || (j.className += " ".concat(V));
        }
        function K(j, V) {
          j.classList ? j.classList.remove(V) : j.className = j.className.replace(new RegExp("(?:^|\\s)".concat(V, "(?!\\S)"), "g"), "");
        }
      }, function(m, i) {
        m.exports = function(u) {
          return u.webpackPolyfill || (u.deprecate = function() {
          }, u.paths = [], u.children || (u.children = []), Object.defineProperty(u, "loaded", { enumerable: !0, get: function() {
            return u.l;
          } }), Object.defineProperty(u, "id", { enumerable: !0, get: function() {
            return u.i;
          } }), u.webpackPolyfill = 1), u;
        };
      }, function(m, i, u) {
        var c = u(6), o = u(35);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[m.i, o, ""]]);
        var E = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, E), m.exports = o.locals || {};
      }, function(m, i, u) {
        (m.exports = u(7)(!1)).push([m.i, `.ck-inspector{--ck-inspector-color-tree-node-hover:#eaf2fb;--ck-inspector-color-tree-node-name:#882680;--ck-inspector-color-tree-node-attribute-name:#8a8a8a;--ck-inspector-color-tree-node-tag:#aaa;--ck-inspector-color-tree-node-attribute:#9a4819;--ck-inspector-color-tree-node-attribute-value:#2a43ac;--ck-inspector-color-tree-text-border:#b7b7b7;--ck-inspector-color-tree-node-border-hover:#b0c6e0;--ck-inspector-color-tree-content-delimiter:#ddd;--ck-inspector-color-tree-node-active-bg:#f5faff;--ck-inspector-color-tree-node-name-active-bg:#2b98f0;--ck-inspector-color-tree-node-inactive:#8a8a8a;--ck-inspector-color-tree-selection:#ff1744;--ck-inspector-color-tree-position:#000;--ck-inspector-color-comment:green}.ck-inspector .ck-inspector-tree{background:var(--ck-inspector-color-white);padding:1em;width:100%;height:100%;overflow:auto;user-select:none}.ck-inspector-tree .ck-inspector-tree-node__attribute{font:inherit;margin-left:.4em;color:var(--ck-inspector-color-tree-node-tag)}.ck-inspector-tree .ck-inspector-tree-node__attribute .ck-inspector-tree-node__attribute__name{color:var(--ck-inspector-color-tree-node-attribute)}.ck-inspector-tree .ck-inspector-tree-node__attribute .ck-inspector-tree-node__attribute__value{color:var(--ck-inspector-color-tree-node-attribute-value)}.ck-inspector-tree .ck-inspector-tree-node__attribute .ck-inspector-tree-node__attribute__value:before{content:'="'}.ck-inspector-tree .ck-inspector-tree-node__attribute .ck-inspector-tree-node__attribute__value:after{content:'"'}.ck-inspector-tree .ck-inspector-tree-node .ck-inspector-tree-node__name{color:var(--ck-inspector-color-tree-node-name);display:inline-block;width:100%;padding:0 .1em;border-left:1px solid transparent}.ck-inspector-tree .ck-inspector-tree-node .ck-inspector-tree-node__name:hover{background:var(--ck-inspector-color-tree-node-hover)}.ck-inspector-tree .ck-inspector-tree-node .ck-inspector-tree-node__content{padding:1px .5em 1px 1.5em;border-left:1px solid var(--ck-inspector-color-tree-content-delimiter);white-space:pre-wrap}.ck-inspector-tree .ck-inspector-tree-node:not(.ck-inspector-tree-node_tagless) .ck-inspector-tree-node__name>.ck-inspector-tree-node__name__bracket_open:after{content:"<";color:var(--ck-inspector-color-tree-node-tag)}.ck-inspector-tree .ck-inspector-tree-node:not(.ck-inspector-tree-node_tagless) .ck-inspector-tree-node__name .ck-inspector-tree-node__name__bracket_close:after{content:">";color:var(--ck-inspector-color-tree-node-tag)}.ck-inspector-tree .ck-inspector-tree-node:not(.ck-inspector-tree-node_tagless).ck-inspector-tree-node_empty .ck-inspector-tree-node__name:after{content:" />"}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_tagless .ck-inspector-tree-node__content{display:none}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name:not(.ck-inspector-tree-node__name_close),.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name:not(.ck-inspector-tree-node__name_close) :not(.ck-inspector-tree__position),.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name:not(.ck-inspector-tree-node__name_close)>.ck-inspector-tree-node__name__bracket:after{background:var(--ck-inspector-color-tree-node-name-active-bg);color:var(--ck-inspector-color-white)}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__content,.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name_close{background:var(--ck-inspector-color-tree-node-active-bg)}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__content{border-left-color:var(--ck-inspector-color-tree-node-name-active-bg)}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name{border-left:1px solid var(--ck-inspector-color-tree-node-name-active-bg)}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_disabled{opacity:.8}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_disabled .ck-inspector-tree-node__name,.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_disabled .ck-inspector-tree-node__name *{color:var(--ck-inspector-color-tree-node-inactive)}.ck-inspector-tree .ck-inspector-tree-text{display:block;margin-bottom:1px}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-node__content{border:1px dotted var(--ck-inspector-color-tree-text-border);border-radius:2px;padding:0 1px;margin-right:1px;display:inline-block;word-break:break-all}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes:not(:empty){margin-right:.5em}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes .ck-inspector-tree-node__attribute{background:var(--ck-inspector-color-tree-node-attribute-name);border-radius:2px;padding:0 .5em}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes .ck-inspector-tree-node__attribute+.ck-inspector-tree-node__attribute{margin-left:.2em}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes .ck-inspector-tree-node__attribute>*{color:var(--ck-inspector-color-white)}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes .ck-inspector-tree-node__attribute:first-child{margin-left:0}.ck-inspector-tree .ck-inspector-tree-text.ck-inspector-tree-node_active .ck-inspector-tree-node__content{border-style:solid;border-color:var(--ck-inspector-color-tree-node-name-active-bg)}.ck-inspector-tree .ck-inspector-tree-text.ck-inspector-tree-node_active .ck-inspector-tree-node__attribute{background:var(--ck-inspector-color-white)}.ck-inspector-tree .ck-inspector-tree-text.ck-inspector-tree-node_active .ck-inspector-tree-node__attribute>*{color:var(--ck-inspector-color-tree-node-name-active-bg)}.ck-inspector-tree .ck-inspector-tree-text.ck-inspector-tree-node_active>.ck-inspector-tree-node__content{background:var(--ck-inspector-color-tree-node-name-active-bg);color:var(--ck-inspector-color-white)}.ck-inspector-tree .ck-inspector-tree-text:not(.ck-inspector-tree-node_active) .ck-inspector-tree-node__content:hover{background:var(--ck-inspector-color-tree-node-hover);border-style:solid;border-color:var(--ck-inspector-color-tree-node-border-hover)}.ck-inspector-tree.ck-inspector-tree_text-direction_ltr .ck-inspector-tree-node__content{direction:ltr}.ck-inspector-tree.ck-inspector-tree_text-direction_rtl .ck-inspector-tree-node__content{direction:rtl}.ck-inspector-tree.ck-inspector-tree_text-direction_rtl .ck-inspector-tree-node__content .ck-inspector-tree-node__name{direction:ltr}.ck-inspector-tree.ck-inspector-tree_text-direction_rtl .ck-inspector-tree__position{transform:rotate(180deg)}.ck-inspector-tree .ck-inspector-tree-comment{color:var(--ck-inspector-color-comment);font-style:italic}.ck-inspector-tree .ck-inspector-tree-comment a{color:inherit;text-decoration:underline}.ck-inspector-tree_compact-text .ck-inspector-tree-text,.ck-inspector-tree_compact-text .ck-inspector-tree-text .ck-inspector-tree-node__content{display:inline}.ck-inspector .ck-inspector__tree__navigation{padding:.5em 1em;border-bottom:1px solid var(--ck-inspector-color-border)}.ck-inspector .ck-inspector__tree__navigation label{margin-right:.5em}.ck-inspector-tree .ck-inspector-tree__position{display:inline-block;position:relative;cursor:default;height:100%;pointer-events:none;vertical-align:top}.ck-inspector-tree .ck-inspector-tree__position:after{content:"";position:absolute;border:1px solid var(--ck-inspector-color-tree-position);width:0;top:0;bottom:0;margin-left:-1px}.ck-inspector-tree .ck-inspector-tree__position:before{margin-left:-1px}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_selection{z-index:2;--ck-inspector-color-tree-position:var(--ck-inspector-color-tree-selection)}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_selection:before{content:"";position:absolute;top:-1px;bottom:-1px;left:0;border-top:2px solid var(--ck-inspector-color-tree-position);border-bottom:2px solid var(--ck-inspector-color-tree-position);width:8px}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_selection.ck-inspector-tree__position_end:before{right:-1px;left:auto}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_marker{z-index:1}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_marker:before{content:"";display:block;position:absolute;left:0;top:-1px;cursor:default;width:0;height:0;border-left:0 solid transparent;border-bottom:0 solid transparent;border-right:7px solid transparent;border-top:7px solid var(--ck-inspector-color-tree-position)}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_marker.ck-inspector-tree__position_end:before{border-width:0 7px 7px 0;border-left-color:transparent;border-bottom-color:transparent;border-right-color:var(--ck-inspector-color-tree-position);border-top-color:transparent;left:-5px}`, ""]);
      }, function(m, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.canUseDOM = i.SafeNodeList = i.SafeHTMLCollection = void 0;
        var c, o = u(82), E = ((c = o) && c.__esModule ? c : { default: c }).default, g = E.canUseDOM ? window.HTMLElement : {};
        i.SafeHTMLCollection = E.canUseDOM ? window.HTMLCollection : {}, i.SafeNodeList = E.canUseDOM ? window.NodeList : {}, i.canUseDOM = E.canUseDOM, i.default = g;
      }, function(m, i, u) {
        var c = u(6), o = u(38);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[m.i, o, ""]]);
        var E = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, E), m.exports = o.locals || {};
      }, function(m, i, u) {
        (m.exports = u(7)(!1)).push([m.i, `.ck-inspector,.ck-inspector-portal{--ck-inspector-color-white:#fff;--ck-inspector-color-black:#000;--ck-inspector-color-background:#f3f3f3;--ck-inspector-color-link:#005cc6;--ck-inspector-code-font-size:11px;--ck-inspector-code-font-family:monaco,Consolas,Lucida Console,monospace;--ck-inspector-color-border:#d0d0d0}.ck-inspector,.ck-inspector-portal,.ck-inspector-portal :not(select),.ck-inspector :not(select){box-sizing:border-box;width:auto;height:auto;position:static;margin:0;padding:0;border:0;background:transparent;text-decoration:none;transition:none;word-wrap:break-word;font-family:Arial,Helvetica Neue,Helvetica,sans-serif;font-size:12px;line-height:17px;font-weight:400;-webkit-font-smoothing:auto}.ck-inspector{overflow:hidden;border-collapse:collapse;color:var(--ck-inspector-color-black);text-align:left;white-space:normal;cursor:auto;float:none;background:var(--ck-inspector-color-background);border-top:1px solid var(--ck-inspector-color-border);z-index:9999}.ck-inspector.ck-inspector_collapsed>.ck-inspector-navbox>.ck-inspector-navbox__navigation .ck-inspector-horizontal-nav{display:none}.ck-inspector .ck-inspector-navbox__navigation__logo{background-size:contain;background-repeat:no-repeat;background-position:50%;display:block;overflow:hidden;text-indent:100px;align-self:center;white-space:nowrap;margin-right:1em;background-image:url("data:image/svg+xml;charset=utf-8,%3Csvg width='68' height='64' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M43.71 11.025a11.508 11.508 0 00-1.213 5.159c0 6.42 5.244 11.625 11.713 11.625.083 0 .167 0 .25-.002v16.282a5.464 5.464 0 01-2.756 4.739L30.986 60.7a5.548 5.548 0 01-5.512 0L4.756 48.828A5.464 5.464 0 012 44.089V20.344c0-1.955 1.05-3.76 2.756-4.738L25.474 3.733a5.548 5.548 0 015.512 0l12.724 7.292z' fill='%23FFF'/%3E%3Cpath d='M45.684 8.79a12.604 12.604 0 00-1.329 5.65c0 7.032 5.744 12.733 12.829 12.733.091 0 .183-.001.274-.003v17.834a5.987 5.987 0 01-3.019 5.19L31.747 63.196a6.076 6.076 0 01-6.037 0L3.02 50.193A5.984 5.984 0 010 45.003V18.997c0-2.14 1.15-4.119 3.019-5.19L25.71.804a6.076 6.076 0 016.037 0L45.684 8.79zm-29.44 11.89c-.834 0-1.51.671-1.51 1.498v.715c0 .828.676 1.498 1.51 1.498h25.489c.833 0 1.51-.67 1.51-1.498v-.715c0-.827-.677-1.498-1.51-1.498h-25.49zm0 9.227c-.834 0-1.51.671-1.51 1.498v.715c0 .828.676 1.498 1.51 1.498h18.479c.833 0 1.509-.67 1.509-1.498v-.715c0-.827-.676-1.498-1.51-1.498H16.244zm0 9.227c-.834 0-1.51.671-1.51 1.498v.715c0 .828.676 1.498 1.51 1.498h25.489c.833 0 1.51-.67 1.51-1.498v-.715c0-.827-.677-1.498-1.51-1.498h-25.49zm41.191-14.459c-5.835 0-10.565-4.695-10.565-10.486 0-5.792 4.73-10.487 10.565-10.487C63.27 3.703 68 8.398 68 14.19c0 5.791-4.73 10.486-10.565 10.486zm3.422-8.68c0-.467-.084-.875-.251-1.225a2.547 2.547 0 00-.686-.88 2.888 2.888 0 00-1.026-.531 4.418 4.418 0 00-1.259-.175c-.134 0-.283.006-.447.018a2.72 2.72 0 00-.446.07l.075-1.4h3.587v-1.8h-5.462l-.214 5.06c.319-.116.682-.21 1.089-.28.406-.071.77-.107 1.088-.107.218 0 .437.021.655.063.218.041.413.114.585.218s.313.244.422.419c.109.175.163.391.163.65 0 .424-.132.745-.396.961a1.434 1.434 0 01-.938.325c-.352 0-.656-.1-.912-.3-.256-.2-.43-.453-.523-.762l-1.925.588c.1.35.258.664.472.943.214.279.47.514.767.706.298.191.63.339.995.443.365.104.749.156 1.151.156.437 0 .86-.064 1.272-.193.41-.13.778-.323 1.1-.581a2.8 2.8 0 00.775-.981c.193-.396.29-.864.29-1.405z' fill='%231EBC61' fill-rule='nonzero'/%3E%3C/g%3E%3C/svg%3E");width:1.8em;height:1.8em;margin-left:1em}.ck-inspector .ck-inspector-navbox__navigation__toggle{margin-right:1em}.ck-inspector .ck-inspector-navbox__navigation__toggle.ck-inspector-navbox__navigation__toggle_up{transform:rotate(180deg)}.ck-inspector .ck-inspector-editor-selector{margin-left:auto;margin-right:.3em}@media screen and (max-width:680px){.ck-inspector .ck-inspector-editor-selector label{display:none}}.ck-inspector .ck-inspector-editor-selector select{margin-left:.5em}.ck-inspector .ck-inspector-code,.ck-inspector .ck-inspector-code *{font-size:var(--ck-inspector-code-font-size);font-family:var(--ck-inspector-code-font-family);cursor:default}.ck-inspector a{color:var(--ck-inspector-color-link);text-decoration:none}.ck-inspector a:hover{text-decoration:underline;cursor:pointer}.ck-inspector button{outline:0}.ck-inspector .ck-inspector-separator{border-right:1px solid var(--ck-inspector-color-border);display:inline-block;width:0;height:20px;margin:0 .5em;vertical-align:middle}`, ""]);
      }, function(m, i, u) {
        var c = u(49), o = { childContextTypes: !0, contextType: !0, contextTypes: !0, defaultProps: !0, displayName: !0, getDefaultProps: !0, getDerivedStateFromError: !0, getDerivedStateFromProps: !0, mixins: !0, propTypes: !0, type: !0 }, E = { name: !0, length: !0, prototype: !0, caller: !0, callee: !0, arguments: !0, arity: !0 }, g = { $$typeof: !0, compare: !0, defaultProps: !0, displayName: !0, propTypes: !0, type: !0 }, b = {};
        function y(j) {
          return c.isMemo(j) ? g : b[j.$$typeof] || o;
        }
        b[c.ForwardRef] = { $$typeof: !0, render: !0, defaultProps: !0, displayName: !0, propTypes: !0 }, b[c.Memo] = g;
        var v = Object.defineProperty, C = Object.getOwnPropertyNames, x = Object.getOwnPropertySymbols, N = Object.getOwnPropertyDescriptor, G = Object.getPrototypeOf, K = Object.prototype;
        m.exports = function j(V, P, M) {
          if (typeof P != "string") {
            if (K) {
              var B = G(P);
              B && B !== K && j(V, B, M);
            }
            var I = C(P);
            x && (I = I.concat(x(P)));
            for (var oe = y(V), Q = y(P), z = 0; z < I.length; ++z) {
              var A = I[z];
              if (!(E[A] || M && M[A] || Q && Q[A] || oe && oe[A])) {
                var se = N(P, A);
                try {
                  v(V, A, se);
                } catch {
                }
              }
            }
          }
          return V;
        };
      }, function(m, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.getBoundPosition = function(g, b, y) {
          if (!g.props.bounds) return [b, y];
          var v = g.props.bounds;
          v = typeof v == "string" ? v : function(V) {
            return { left: V.left, top: V.top, right: V.right, bottom: V.bottom };
          }(v);
          var C = E(g);
          if (typeof v == "string") {
            var x, N = C.ownerDocument, G = N.defaultView;
            if (!((x = v === "parent" ? C.parentNode : N.querySelector(v)) instanceof G.HTMLElement)) throw new Error('Bounds selector "' + v + '" could not find an element.');
            var K = G.getComputedStyle(C), j = G.getComputedStyle(x);
            v = { left: -C.offsetLeft + (0, c.int)(j.paddingLeft) + (0, c.int)(K.marginLeft), top: -C.offsetTop + (0, c.int)(j.paddingTop) + (0, c.int)(K.marginTop), right: (0, o.innerWidth)(x) - (0, o.outerWidth)(C) - C.offsetLeft + (0, c.int)(j.paddingRight) - (0, c.int)(K.marginRight), bottom: (0, o.innerHeight)(x) - (0, o.outerHeight)(C) - C.offsetTop + (0, c.int)(j.paddingBottom) - (0, c.int)(K.marginBottom) };
          }
          return (0, c.isNum)(v.right) && (b = Math.min(b, v.right)), (0, c.isNum)(v.bottom) && (y = Math.min(y, v.bottom)), (0, c.isNum)(v.left) && (b = Math.max(b, v.left)), (0, c.isNum)(v.top) && (y = Math.max(y, v.top)), [b, y];
        }, i.snapToGrid = function(g, b, y) {
          var v = Math.round(b / g[0]) * g[0], C = Math.round(y / g[1]) * g[1];
          return [v, C];
        }, i.canDragX = function(g) {
          return g.props.axis === "both" || g.props.axis === "x";
        }, i.canDragY = function(g) {
          return g.props.axis === "both" || g.props.axis === "y";
        }, i.getControlPosition = function(g, b, y) {
          var v = typeof b == "number" ? (0, o.getTouch)(g, b) : null;
          if (typeof b == "number" && !v) return null;
          var C = E(y), x = y.props.offsetParent || C.offsetParent || C.ownerDocument.body;
          return (0, o.offsetXYFromParent)(v || g, x, y.props.scale);
        }, i.createCoreData = function(g, b, y) {
          var v = g.state, C = !(0, c.isNum)(v.lastX), x = E(g);
          return C ? { node: x, deltaX: 0, deltaY: 0, lastX: b, lastY: y, x: b, y } : { node: x, deltaX: b - v.lastX, deltaY: y - v.lastY, lastX: v.lastX, lastY: v.lastY, x: b, y };
        }, i.createDraggableData = function(g, b) {
          var y = g.props.scale;
          return { node: b.node, x: g.state.x + b.deltaX / y, y: g.state.y + b.deltaY / y, deltaX: b.deltaX / y, deltaY: b.deltaY / y, lastX: g.state.x, lastY: g.state.y };
        };
        var c = u(20), o = u(32);
        function E(g) {
          var b = g.findDOMNode();
          if (!b) throw new Error("<DraggableCore>: Unmounted during event!");
          return b;
        }
      }, function(m, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.default = function() {
        };
      }, function(m, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.default = function b(y) {
          return [].slice.call(y.querySelectorAll("*"), 0).reduce(function(v, C) {
            return v.concat(C.shadowRoot ? b(C.shadowRoot) : [C]);
          }, []).filter(g);
        };
        var c = /input|select|textarea|button|object|iframe/;
        function o(b) {
          var y = b.offsetWidth <= 0 && b.offsetHeight <= 0;
          if (y && !b.innerHTML) return !0;
          try {
            var v = window.getComputedStyle(b);
            return y ? v.getPropertyValue("overflow") !== "visible" || b.scrollWidth <= 0 && b.scrollHeight <= 0 : v.getPropertyValue("display") == "none";
          } catch {
            return console.warn("Failed to inspect element style"), !1;
          }
        }
        function E(b, y) {
          var v = b.nodeName.toLowerCase();
          return (c.test(v) && !b.disabled || v === "a" && b.href || y) && function(C) {
            for (var x = C, N = C.getRootNode && C.getRootNode(); x && x !== document.body; ) {
              if (N && x === N && (x = N.host.parentNode), o(x)) return !1;
              x = x.parentNode;
            }
            return !0;
          }(b);
        }
        function g(b) {
          var y = b.getAttribute("tabindex");
          y === null && (y = void 0);
          var v = isNaN(y);
          return (v || y >= 0) && E(b, !v);
        }
        m.exports = i.default;
      }, function(m, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.resetState = function() {
          b && (b.removeAttribute ? b.removeAttribute("aria-hidden") : b.length != null ? b.forEach(function(C) {
            return C.removeAttribute("aria-hidden");
          }) : document.querySelectorAll(b).forEach(function(C) {
            return C.removeAttribute("aria-hidden");
          })), b = null;
        }, i.log = function() {
        }, i.assertNodeList = y, i.setElement = function(C) {
          var x = C;
          if (typeof x == "string" && g.canUseDOM) {
            var N = document.querySelectorAll(x);
            y(N, x), x = N;
          }
          return b = x || b;
        }, i.validateElement = v, i.hide = function(C) {
          var x = !0, N = !1, G = void 0;
          try {
            for (var K, j = v(C)[Symbol.iterator](); !(x = (K = j.next()).done); x = !0)
              K.value.setAttribute("aria-hidden", "true");
          } catch (V) {
            N = !0, G = V;
          } finally {
            try {
              !x && j.return && j.return();
            } finally {
              if (N) throw G;
            }
          }
        }, i.show = function(C) {
          var x = !0, N = !1, G = void 0;
          try {
            for (var K, j = v(C)[Symbol.iterator](); !(x = (K = j.next()).done); x = !0)
              K.value.removeAttribute("aria-hidden");
          } catch (V) {
            N = !0, G = V;
          } finally {
            try {
              !x && j.return && j.return();
            } finally {
              if (N) throw G;
            }
          }
        }, i.documentNotReadyOrSSRTesting = function() {
          b = null;
        };
        var c, o = u(81), E = (c = o) && c.__esModule ? c : { default: c }, g = u(36), b = null;
        function y(C, x) {
          if (!C || !C.length) throw new Error("react-modal: No elements were found for selector " + x + ".");
        }
        function v(C) {
          var x = C || b;
          return x ? Array.isArray(x) || x instanceof HTMLCollection || x instanceof NodeList ? x : [x] : ((0, E.default)(!1, ["react-modal: App element is not defined.", "Please use `Modal.setAppElement(el)` or set `appElement={el}`.", "This is needed so screen readers don't see main content", "when modal is opened. It is not recommended, but you can opt-out", "by setting `ariaHideApp={false}`."].join(" ")), []);
        }
      }, function(m, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.log = function() {
          console.log("portalOpenInstances ----------"), console.log(o.openInstances.length), o.openInstances.forEach(function(E) {
            return console.log(E);
          }), console.log("end portalOpenInstances ----------");
        }, i.resetState = function() {
          o = new c();
        };
        var c = function E() {
          var g = this;
          (function(b, y) {
            if (!(b instanceof y)) throw new TypeError("Cannot call a class as a function");
          })(this, E), this.register = function(b) {
            g.openInstances.indexOf(b) === -1 && (g.openInstances.push(b), g.emit("register"));
          }, this.deregister = function(b) {
            var y = g.openInstances.indexOf(b);
            y !== -1 && (g.openInstances.splice(y, 1), g.emit("deregister"));
          }, this.subscribe = function(b) {
            g.subscribers.push(b);
          }, this.emit = function(b) {
            g.subscribers.forEach(function(y) {
              return y(b, g.openInstances.slice());
            });
          }, this.openInstances = [], this.subscribers = [];
        }, o = new c();
        i.default = o;
      }, function(m, i, u) {
        m.exports = u(51);
      }, function(m, i, u) {
        var c = u(52), o = c.default, E = c.DraggableCore;
        m.exports = o, m.exports.default = o, m.exports.DraggableCore = E;
      }, function(m, i, u) {
        var c = u(76), o = { "text/plain": "Text", "text/html": "Url", default: "Text" };
        m.exports = function(E, g) {
          var b, y, v, C, x, N, G = !1;
          g || (g = {}), b = g.debug || !1;
          try {
            if (v = c(), C = document.createRange(), x = document.getSelection(), (N = document.createElement("span")).textContent = E, N.style.all = "unset", N.style.position = "fixed", N.style.top = 0, N.style.clip = "rect(0, 0, 0, 0)", N.style.whiteSpace = "pre", N.style.webkitUserSelect = "text", N.style.MozUserSelect = "text", N.style.msUserSelect = "text", N.style.userSelect = "text", N.addEventListener("copy", function(K) {
              if (K.stopPropagation(), g.format) if (K.preventDefault(), K.clipboardData === void 0) {
                b && console.warn("unable to use e.clipboardData"), b && console.warn("trying IE specific stuff"), window.clipboardData.clearData();
                var j = o[g.format] || o.default;
                window.clipboardData.setData(j, E);
              } else K.clipboardData.clearData(), K.clipboardData.setData(g.format, E);
              g.onCopy && (K.preventDefault(), g.onCopy(K.clipboardData));
            }), document.body.appendChild(N), C.selectNodeContents(N), x.addRange(C), !document.execCommand("copy")) throw new Error("copy command was unsuccessful");
            G = !0;
          } catch (K) {
            b && console.error("unable to copy using execCommand: ", K), b && console.warn("trying IE specific stuff");
            try {
              window.clipboardData.setData(g.format || "text", E), g.onCopy && g.onCopy(window.clipboardData), G = !0;
            } catch (j) {
              b && console.error("unable to copy using clipboardData: ", j), b && console.error("falling back to prompt"), y = function(V) {
                var P = (/mac os x/i.test(navigator.userAgent) ? "⌘" : "Ctrl") + "+C";
                return V.replace(/#{\s*key\s*}/g, P);
              }("message" in g ? g.message : "Copy to clipboard: #{key}, Enter"), window.prompt(y, E);
            }
          } finally {
            x && (typeof x.removeRange == "function" ? x.removeRange(C) : x.removeAllRanges()), N && document.body.removeChild(N), v();
          }
          return G;
        };
      }, function(m, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 });
        var c, o = u(77), E = (c = o) && c.__esModule ? c : { default: c };
        i.default = E.default, m.exports = i.default;
      }, function(m, i, u) {
        m.exports = u(50);
      }, function(m, i, u) {
        var c = typeof Symbol == "function" && Symbol.for, o = c ? Symbol.for("react.element") : 60103, E = c ? Symbol.for("react.portal") : 60106, g = c ? Symbol.for("react.fragment") : 60107, b = c ? Symbol.for("react.strict_mode") : 60108, y = c ? Symbol.for("react.profiler") : 60114, v = c ? Symbol.for("react.provider") : 60109, C = c ? Symbol.for("react.context") : 60110, x = c ? Symbol.for("react.async_mode") : 60111, N = c ? Symbol.for("react.concurrent_mode") : 60111, G = c ? Symbol.for("react.forward_ref") : 60112, K = c ? Symbol.for("react.suspense") : 60113, j = c ? Symbol.for("react.suspense_list") : 60120, V = c ? Symbol.for("react.memo") : 60115, P = c ? Symbol.for("react.lazy") : 60116, M = c ? Symbol.for("react.block") : 60121, B = c ? Symbol.for("react.fundamental") : 60117, I = c ? Symbol.for("react.responder") : 60118, oe = c ? Symbol.for("react.scope") : 60119;
        function Q(A) {
          if (typeof A == "object" && A !== null) {
            var se = A.$$typeof;
            switch (se) {
              case o:
                switch (A = A.type) {
                  case x:
                  case N:
                  case g:
                  case y:
                  case b:
                  case K:
                    return A;
                  default:
                    switch (A = A && A.$$typeof) {
                      case C:
                      case G:
                      case P:
                      case V:
                      case v:
                        return A;
                      default:
                        return se;
                    }
                }
              case E:
                return se;
            }
          }
        }
        function z(A) {
          return Q(A) === N;
        }
        i.AsyncMode = x, i.ConcurrentMode = N, i.ContextConsumer = C, i.ContextProvider = v, i.Element = o, i.ForwardRef = G, i.Fragment = g, i.Lazy = P, i.Memo = V, i.Portal = E, i.Profiler = y, i.StrictMode = b, i.Suspense = K, i.isAsyncMode = function(A) {
          return z(A) || Q(A) === x;
        }, i.isConcurrentMode = z, i.isContextConsumer = function(A) {
          return Q(A) === C;
        }, i.isContextProvider = function(A) {
          return Q(A) === v;
        }, i.isElement = function(A) {
          return typeof A == "object" && A !== null && A.$$typeof === o;
        }, i.isForwardRef = function(A) {
          return Q(A) === G;
        }, i.isFragment = function(A) {
          return Q(A) === g;
        }, i.isLazy = function(A) {
          return Q(A) === P;
        }, i.isMemo = function(A) {
          return Q(A) === V;
        }, i.isPortal = function(A) {
          return Q(A) === E;
        }, i.isProfiler = function(A) {
          return Q(A) === y;
        }, i.isStrictMode = function(A) {
          return Q(A) === b;
        }, i.isSuspense = function(A) {
          return Q(A) === K;
        }, i.isValidElementType = function(A) {
          return typeof A == "string" || typeof A == "function" || A === g || A === N || A === y || A === b || A === K || A === j || typeof A == "object" && A !== null && (A.$$typeof === P || A.$$typeof === V || A.$$typeof === v || A.$$typeof === C || A.$$typeof === G || A.$$typeof === B || A.$$typeof === I || A.$$typeof === oe || A.$$typeof === M);
        }, i.typeOf = Q;
      }, function(m, i, u) {
        var c = 60103, o = 60106, E = 60107, g = 60108, b = 60114, y = 60109, v = 60110, C = 60112, x = 60113, N = 60120, G = 60115, K = 60116, j = 60121, V = 60122, P = 60117, M = 60129, B = 60131;
        if (typeof Symbol == "function" && Symbol.for) {
          var I = Symbol.for;
          c = I("react.element"), o = I("react.portal"), E = I("react.fragment"), g = I("react.strict_mode"), b = I("react.profiler"), y = I("react.provider"), v = I("react.context"), C = I("react.forward_ref"), x = I("react.suspense"), N = I("react.suspense_list"), G = I("react.memo"), K = I("react.lazy"), j = I("react.block"), V = I("react.server.block"), P = I("react.fundamental"), M = I("react.debug_trace_mode"), B = I("react.legacy_hidden");
        }
        function oe(D) {
          if (typeof D == "object" && D !== null) {
            var ie = D.$$typeof;
            switch (ie) {
              case c:
                switch (D = D.type) {
                  case E:
                  case b:
                  case g:
                  case x:
                  case N:
                    return D;
                  default:
                    switch (D = D && D.$$typeof) {
                      case v:
                      case C:
                      case K:
                      case G:
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
        var Q = y, z = c, A = C, se = E, le = K, te = G, ce = o, ye = b, J = g, de = x;
        i.ContextConsumer = v, i.ContextProvider = Q, i.Element = z, i.ForwardRef = A, i.Fragment = se, i.Lazy = le, i.Memo = te, i.Portal = ce, i.Profiler = ye, i.StrictMode = J, i.Suspense = de, i.isAsyncMode = function() {
          return !1;
        }, i.isConcurrentMode = function() {
          return !1;
        }, i.isContextConsumer = function(D) {
          return oe(D) === v;
        }, i.isContextProvider = function(D) {
          return oe(D) === y;
        }, i.isElement = function(D) {
          return typeof D == "object" && D !== null && D.$$typeof === c;
        }, i.isForwardRef = function(D) {
          return oe(D) === C;
        }, i.isFragment = function(D) {
          return oe(D) === E;
        }, i.isLazy = function(D) {
          return oe(D) === K;
        }, i.isMemo = function(D) {
          return oe(D) === G;
        }, i.isPortal = function(D) {
          return oe(D) === o;
        }, i.isProfiler = function(D) {
          return oe(D) === b;
        }, i.isStrictMode = function(D) {
          return oe(D) === g;
        }, i.isSuspense = function(D) {
          return oe(D) === x;
        }, i.isValidElementType = function(D) {
          return typeof D == "string" || typeof D == "function" || D === E || D === b || D === M || D === g || D === x || D === N || D === B || typeof D == "object" && D !== null && (D.$$typeof === K || D.$$typeof === G || D.$$typeof === y || D.$$typeof === v || D.$$typeof === C || D.$$typeof === P || D.$$typeof === j || D[0] === V);
        }, i.typeOf = oe;
      }, function(m, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), Object.defineProperty(i, "DraggableCore", { enumerable: !0, get: function() {
          return C.default;
        } }), i.default = void 0;
        var c = function(J) {
          if (J && J.__esModule) return J;
          if (J === null || K(J) !== "object" && typeof J != "function") return { default: J };
          var de = G();
          if (de && de.has(J)) return de.get(J);
          var D = {}, ie = Object.defineProperty && Object.getOwnPropertyDescriptor;
          for (var be in J) if (Object.prototype.hasOwnProperty.call(J, be)) {
            var Te = ie ? Object.getOwnPropertyDescriptor(J, be) : null;
            Te && (Te.get || Te.set) ? Object.defineProperty(D, be, Te) : D[be] = J[be];
          }
          return D.default = J, de && de.set(J, D), D;
        }(u(0)), o = N(u(18)), E = N(u(12)), g = N(u(55)), b = u(32), y = u(40), v = u(20), C = N(u(57)), x = N(u(41));
        function N(J) {
          return J && J.__esModule ? J : { default: J };
        }
        function G() {
          if (typeof WeakMap != "function") return null;
          var J = /* @__PURE__ */ new WeakMap();
          return G = function() {
            return J;
          }, J;
        }
        function K(J) {
          return (K = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(de) {
            return typeof de;
          } : function(de) {
            return de && typeof Symbol == "function" && de.constructor === Symbol && de !== Symbol.prototype ? "symbol" : typeof de;
          })(J);
        }
        function j() {
          return (j = Object.assign || function(J) {
            for (var de = 1; de < arguments.length; de++) {
              var D = arguments[de];
              for (var ie in D) Object.prototype.hasOwnProperty.call(D, ie) && (J[ie] = D[ie]);
            }
            return J;
          }).apply(this, arguments);
        }
        function V(J, de) {
          if (J == null) return {};
          var D, ie, be = function(ke, Pe) {
            if (ke == null) return {};
            var Se, ze, Je = {}, X = Object.keys(ke);
            for (ze = 0; ze < X.length; ze++) Se = X[ze], Pe.indexOf(Se) >= 0 || (Je[Se] = ke[Se]);
            return Je;
          }(J, de);
          if (Object.getOwnPropertySymbols) {
            var Te = Object.getOwnPropertySymbols(J);
            for (ie = 0; ie < Te.length; ie++) D = Te[ie], de.indexOf(D) >= 0 || Object.prototype.propertyIsEnumerable.call(J, D) && (be[D] = J[D]);
          }
          return be;
        }
        function P(J, de) {
          return function(D) {
            if (Array.isArray(D)) return D;
          }(J) || function(D, ie) {
            if (!(typeof Symbol > "u" || !(Symbol.iterator in Object(D)))) {
              var be = [], Te = !0, ke = !1, Pe = void 0;
              try {
                for (var Se, ze = D[Symbol.iterator](); !(Te = (Se = ze.next()).done) && (be.push(Se.value), !ie || be.length !== ie); Te = !0) ;
              } catch (Je) {
                ke = !0, Pe = Je;
              } finally {
                try {
                  Te || ze.return == null || ze.return();
                } finally {
                  if (ke) throw Pe;
                }
              }
              return be;
            }
          }(J, de) || function(D, ie) {
            if (D) {
              if (typeof D == "string") return M(D, ie);
              var be = Object.prototype.toString.call(D).slice(8, -1);
              if (be === "Object" && D.constructor && (be = D.constructor.name), be === "Map" || be === "Set") return Array.from(D);
              if (be === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(be)) return M(D, ie);
            }
          }(J, de) || function() {
            throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
          }();
        }
        function M(J, de) {
          (de == null || de > J.length) && (de = J.length);
          for (var D = 0, ie = new Array(de); D < de; D++) ie[D] = J[D];
          return ie;
        }
        function B(J, de) {
          var D = Object.keys(J);
          if (Object.getOwnPropertySymbols) {
            var ie = Object.getOwnPropertySymbols(J);
            de && (ie = ie.filter(function(be) {
              return Object.getOwnPropertyDescriptor(J, be).enumerable;
            })), D.push.apply(D, ie);
          }
          return D;
        }
        function I(J) {
          for (var de = 1; de < arguments.length; de++) {
            var D = arguments[de] != null ? arguments[de] : {};
            de % 2 ? B(Object(D), !0).forEach(function(ie) {
              ce(J, ie, D[ie]);
            }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(J, Object.getOwnPropertyDescriptors(D)) : B(Object(D)).forEach(function(ie) {
              Object.defineProperty(J, ie, Object.getOwnPropertyDescriptor(D, ie));
            });
          }
          return J;
        }
        function oe(J, de) {
          for (var D = 0; D < de.length; D++) {
            var ie = de[D];
            ie.enumerable = ie.enumerable || !1, ie.configurable = !0, "value" in ie && (ie.writable = !0), Object.defineProperty(J, ie.key, ie);
          }
        }
        function Q(J, de, D) {
          return de && oe(J.prototype, de), D && oe(J, D), J;
        }
        function z(J, de) {
          return (z = Object.setPrototypeOf || function(D, ie) {
            return D.__proto__ = ie, D;
          })(J, de);
        }
        function A(J) {
          var de = function() {
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
            if (de) {
              var be = te(this).constructor;
              D = Reflect.construct(ie, arguments, be);
            } else D = ie.apply(this, arguments);
            return se(this, D);
          };
        }
        function se(J, de) {
          return !de || K(de) !== "object" && typeof de != "function" ? le(J) : de;
        }
        function le(J) {
          if (J === void 0) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
          return J;
        }
        function te(J) {
          return (te = Object.setPrototypeOf ? Object.getPrototypeOf : function(de) {
            return de.__proto__ || Object.getPrototypeOf(de);
          })(J);
        }
        function ce(J, de, D) {
          return de in J ? Object.defineProperty(J, de, { value: D, enumerable: !0, configurable: !0, writable: !0 }) : J[de] = D, J;
        }
        var ye = function(J) {
          (function(ie, be) {
            if (typeof be != "function" && be !== null) throw new TypeError("Super expression must either be null or a function");
            ie.prototype = Object.create(be && be.prototype, { constructor: { value: ie, writable: !0, configurable: !0 } }), be && z(ie, be);
          })(D, J);
          var de = A(D);
          function D(ie) {
            var be;
            return function(Te, ke) {
              if (!(Te instanceof ke)) throw new TypeError("Cannot call a class as a function");
            }(this, D), ce(le(be = de.call(this, ie)), "onDragStart", function(Te, ke) {
              if ((0, x.default)("Draggable: onDragStart: %j", ke), be.props.onStart(Te, (0, y.createDraggableData)(le(be), ke)) === !1) return !1;
              be.setState({ dragging: !0, dragged: !0 });
            }), ce(le(be), "onDrag", function(Te, ke) {
              if (!be.state.dragging) return !1;
              (0, x.default)("Draggable: onDrag: %j", ke);
              var Pe = (0, y.createDraggableData)(le(be), ke), Se = { x: Pe.x, y: Pe.y };
              if (be.props.bounds) {
                var ze = Se.x, Je = Se.y;
                Se.x += be.state.slackX, Se.y += be.state.slackY;
                var X = P((0, y.getBoundPosition)(le(be), Se.x, Se.y), 2), Y = X[0], me = X[1];
                Se.x = Y, Se.y = me, Se.slackX = be.state.slackX + (ze - Se.x), Se.slackY = be.state.slackY + (Je - Se.y), Pe.x = Se.x, Pe.y = Se.y, Pe.deltaX = Se.x - be.state.x, Pe.deltaY = Se.y - be.state.y;
              }
              if (be.props.onDrag(Te, Pe) === !1) return !1;
              be.setState(Se);
            }), ce(le(be), "onDragStop", function(Te, ke) {
              if (!be.state.dragging || be.props.onStop(Te, (0, y.createDraggableData)(le(be), ke)) === !1) return !1;
              (0, x.default)("Draggable: onDragStop: %j", ke);
              var Pe = { dragging: !1, slackX: 0, slackY: 0 };
              if (be.props.position) {
                var Se = be.props.position, ze = Se.x, Je = Se.y;
                Pe.x = ze, Pe.y = Je;
              }
              be.setState(Pe);
            }), be.state = { dragging: !1, dragged: !1, x: ie.position ? ie.position.x : ie.defaultPosition.x, y: ie.position ? ie.position.y : ie.defaultPosition.y, prevPropsPosition: I({}, ie.position), slackX: 0, slackY: 0, isElementSVG: !1 }, !ie.position || ie.onDrag || ie.onStop || console.warn("A `position` was applied to this <Draggable>, without drag handlers. This will make this component effectively undraggable. Please attach `onDrag` or `onStop` handlers so you can adjust the `position` of this element."), be;
          }
          return Q(D, null, [{ key: "getDerivedStateFromProps", value: function(ie, be) {
            var Te = ie.position, ke = be.prevPropsPosition;
            return !Te || ke && Te.x === ke.x && Te.y === ke.y ? null : ((0, x.default)("Draggable: getDerivedStateFromProps %j", { position: Te, prevPropsPosition: ke }), { x: Te.x, y: Te.y, prevPropsPosition: I({}, Te) });
          } }]), Q(D, [{ key: "componentDidMount", value: function() {
            window.SVGElement !== void 0 && this.findDOMNode() instanceof window.SVGElement && this.setState({ isElementSVG: !0 });
          } }, { key: "componentWillUnmount", value: function() {
            this.setState({ dragging: !1 });
          } }, { key: "findDOMNode", value: function() {
            return this.props.nodeRef ? this.props.nodeRef.current : E.default.findDOMNode(this);
          } }, { key: "render", value: function() {
            var ie, be = this.props, Te = (be.axis, be.bounds, be.children), ke = be.defaultPosition, Pe = be.defaultClassName, Se = be.defaultClassNameDragging, ze = be.defaultClassNameDragged, Je = be.position, X = be.positionOffset, Y = (be.scale, V(be, ["axis", "bounds", "children", "defaultPosition", "defaultClassName", "defaultClassNameDragging", "defaultClassNameDragged", "position", "positionOffset", "scale"])), me = {}, l = null, f = !Je || this.state.dragging, k = Je || ke, U = { x: (0, y.canDragX)(this) && f ? this.state.x : k.x, y: (0, y.canDragY)(this) && f ? this.state.y : k.y };
            this.state.isElementSVG ? l = (0, b.createSVGTransform)(U, X) : me = (0, b.createCSSTransform)(U, X);
            var F = (0, g.default)(Te.props.className || "", Pe, (ce(ie = {}, Se, this.state.dragging), ce(ie, ze, this.state.dragged), ie));
            return c.createElement(C.default, j({}, Y, { onStart: this.onDragStart, onDrag: this.onDrag, onStop: this.onDragStop }), c.cloneElement(c.Children.only(Te), { className: F, style: I(I({}, Te.props.style), me), transform: l }));
          } }]), D;
        }(c.Component);
        i.default = ye, ce(ye, "displayName", "Draggable"), ce(ye, "propTypes", I(I({}, C.default.propTypes), {}, { axis: o.default.oneOf(["both", "x", "y", "none"]), bounds: o.default.oneOfType([o.default.shape({ left: o.default.number, right: o.default.number, top: o.default.number, bottom: o.default.number }), o.default.string, o.default.oneOf([!1])]), defaultClassName: o.default.string, defaultClassNameDragging: o.default.string, defaultClassNameDragged: o.default.string, defaultPosition: o.default.shape({ x: o.default.number, y: o.default.number }), positionOffset: o.default.shape({ x: o.default.oneOfType([o.default.number, o.default.string]), y: o.default.oneOfType([o.default.number, o.default.string]) }), position: o.default.shape({ x: o.default.number, y: o.default.number }), className: v.dontSetMe, style: v.dontSetMe, transform: v.dontSetMe })), ce(ye, "defaultProps", I(I({}, C.default.defaultProps), {}, { axis: "both", bounds: !1, defaultClassName: "react-draggable", defaultClassNameDragging: "react-draggable-dragging", defaultClassNameDragged: "react-draggable-dragged", defaultPosition: { x: 0, y: 0 }, position: null, scale: 1 }));
      }, function(m, i, u) {
        var c = u(54);
        function o() {
        }
        function E() {
        }
        E.resetWarningCache = o, m.exports = function() {
          function g(v, C, x, N, G, K) {
            if (K !== c) {
              var j = new Error("Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types");
              throw j.name = "Invariant Violation", j;
            }
          }
          function b() {
            return g;
          }
          g.isRequired = g;
          var y = { array: g, bigint: g, bool: g, func: g, number: g, object: g, string: g, symbol: g, any: g, arrayOf: b, element: g, elementType: g, instanceOf: b, node: g, objectOf: b, oneOf: b, oneOfType: b, shape: b, exact: b, checkPropTypes: E, resetWarningCache: o };
          return y.PropTypes = y, y;
        };
      }, function(m, i, u) {
        m.exports = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
      }, function(m, i, u) {
        var c;
        (function() {
          var o = {}.hasOwnProperty;
          function E() {
            for (var g = [], b = 0; b < arguments.length; b++) {
              var y = arguments[b];
              if (y) {
                var v = typeof y;
                if (v === "string" || v === "number") g.push(y);
                else if (Array.isArray(y)) {
                  if (y.length) {
                    var C = E.apply(null, y);
                    C && g.push(C);
                  }
                } else if (v === "object") if (y.toString === Object.prototype.toString) for (var x in y) o.call(y, x) && y[x] && g.push(x);
                else g.push(y.toString());
              }
            }
            return g.join(" ");
          }
          m.exports ? (E.default = E, m.exports = E) : (c = (function() {
            return E;
          }).apply(i, [])) === void 0 || (m.exports = c);
        })();
      }, function(m, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.getPrefix = o, i.browserPrefixToKey = E, i.browserPrefixToStyle = function(b, y) {
          return y ? "-".concat(y.toLowerCase(), "-").concat(b) : b;
        }, i.default = void 0;
        var c = ["Moz", "Webkit", "O", "ms"];
        function o() {
          var b = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "transform";
          if (typeof window > "u" || window.document === void 0) return "";
          var y = window.document.documentElement.style;
          if (b in y) return "";
          for (var v = 0; v < c.length; v++) if (E(b, c[v]) in y) return c[v];
          return "";
        }
        function E(b, y) {
          return y ? "".concat(y).concat(function(v) {
            for (var C = "", x = !0, N = 0; N < v.length; N++) x ? (C += v[N].toUpperCase(), x = !1) : v[N] === "-" ? x = !0 : C += v[N];
            return C;
          }(b)) : b;
        }
        var g = o();
        i.default = g;
      }, function(m, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.default = void 0;
        var c = function(te) {
          if (te && te.__esModule) return te;
          if (te === null || N(te) !== "object" && typeof te != "function") return { default: te };
          var ce = x();
          if (ce && ce.has(te)) return ce.get(te);
          var ye = {}, J = Object.defineProperty && Object.getOwnPropertyDescriptor;
          for (var de in te) if (Object.prototype.hasOwnProperty.call(te, de)) {
            var D = J ? Object.getOwnPropertyDescriptor(te, de) : null;
            D && (D.get || D.set) ? Object.defineProperty(ye, de, D) : ye[de] = te[de];
          }
          return ye.default = te, ce && ce.set(te, ye), ye;
        }(u(0)), o = C(u(18)), E = C(u(12)), g = u(32), b = u(40), y = u(20), v = C(u(41));
        function C(te) {
          return te && te.__esModule ? te : { default: te };
        }
        function x() {
          if (typeof WeakMap != "function") return null;
          var te = /* @__PURE__ */ new WeakMap();
          return x = function() {
            return te;
          }, te;
        }
        function N(te) {
          return (N = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(ce) {
            return typeof ce;
          } : function(ce) {
            return ce && typeof Symbol == "function" && ce.constructor === Symbol && ce !== Symbol.prototype ? "symbol" : typeof ce;
          })(te);
        }
        function G(te, ce) {
          return function(ye) {
            if (Array.isArray(ye)) return ye;
          }(te) || function(ye, J) {
            if (!(typeof Symbol > "u" || !(Symbol.iterator in Object(ye)))) {
              var de = [], D = !0, ie = !1, be = void 0;
              try {
                for (var Te, ke = ye[Symbol.iterator](); !(D = (Te = ke.next()).done) && (de.push(Te.value), !J || de.length !== J); D = !0) ;
              } catch (Pe) {
                ie = !0, be = Pe;
              } finally {
                try {
                  D || ke.return == null || ke.return();
                } finally {
                  if (ie) throw be;
                }
              }
              return de;
            }
          }(te, ce) || function(ye, J) {
            if (ye) {
              if (typeof ye == "string") return K(ye, J);
              var de = Object.prototype.toString.call(ye).slice(8, -1);
              if (de === "Object" && ye.constructor && (de = ye.constructor.name), de === "Map" || de === "Set") return Array.from(ye);
              if (de === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(de)) return K(ye, J);
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
        function V(te, ce) {
          for (var ye = 0; ye < ce.length; ye++) {
            var J = ce[ye];
            J.enumerable = J.enumerable || !1, J.configurable = !0, "value" in J && (J.writable = !0), Object.defineProperty(te, J.key, J);
          }
        }
        function P(te, ce) {
          return (P = Object.setPrototypeOf || function(ye, J) {
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
              var de = oe(this).constructor;
              ye = Reflect.construct(J, arguments, de);
            } else ye = J.apply(this, arguments);
            return B(this, ye);
          };
        }
        function B(te, ce) {
          return !ce || N(ce) !== "object" && typeof ce != "function" ? I(te) : ce;
        }
        function I(te) {
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
        var z = { start: "touchstart", move: "touchmove", stop: "touchend" }, A = { start: "mousedown", move: "mousemove", stop: "mouseup" }, se = A, le = function(te) {
          (function(D, ie) {
            if (typeof ie != "function" && ie !== null) throw new TypeError("Super expression must either be null or a function");
            D.prototype = Object.create(ie && ie.prototype, { constructor: { value: D, writable: !0, configurable: !0 } }), ie && P(D, ie);
          })(de, te);
          var ce, ye, J = M(de);
          function de() {
            var D;
            j(this, de);
            for (var ie = arguments.length, be = new Array(ie), Te = 0; Te < ie; Te++) be[Te] = arguments[Te];
            return Q(I(D = J.call.apply(J, [this].concat(be))), "state", { dragging: !1, lastX: NaN, lastY: NaN, touchIdentifier: null }), Q(I(D), "mounted", !1), Q(I(D), "handleDragStart", function(ke) {
              if (D.props.onMouseDown(ke), !D.props.allowAnyClick && typeof ke.button == "number" && ke.button !== 0) return !1;
              var Pe = D.findDOMNode();
              if (!Pe || !Pe.ownerDocument || !Pe.ownerDocument.body) throw new Error("<DraggableCore> not mounted on DragStart!");
              var Se = Pe.ownerDocument;
              if (!(D.props.disabled || !(ke.target instanceof Se.defaultView.Node) || D.props.handle && !(0, g.matchesSelectorAndParentsTo)(ke.target, D.props.handle, Pe) || D.props.cancel && (0, g.matchesSelectorAndParentsTo)(ke.target, D.props.cancel, Pe))) {
                ke.type === "touchstart" && ke.preventDefault();
                var ze = (0, g.getTouchIdentifier)(ke);
                D.setState({ touchIdentifier: ze });
                var Je = (0, b.getControlPosition)(ke, ze, I(D));
                if (Je != null) {
                  var X = Je.x, Y = Je.y, me = (0, b.createCoreData)(I(D), X, Y);
                  (0, v.default)("DraggableCore: handleDragStart: %j", me), (0, v.default)("calling", D.props.onStart), D.props.onStart(ke, me) !== !1 && D.mounted !== !1 && (D.props.enableUserSelectHack && (0, g.addUserSelectStyles)(Se), D.setState({ dragging: !0, lastX: X, lastY: Y }), (0, g.addEvent)(Se, se.move, D.handleDrag), (0, g.addEvent)(Se, se.stop, D.handleDragStop));
                }
              }
            }), Q(I(D), "handleDrag", function(ke) {
              var Pe = (0, b.getControlPosition)(ke, D.state.touchIdentifier, I(D));
              if (Pe != null) {
                var Se = Pe.x, ze = Pe.y;
                if (Array.isArray(D.props.grid)) {
                  var Je = Se - D.state.lastX, X = ze - D.state.lastY, Y = G((0, b.snapToGrid)(D.props.grid, Je, X), 2);
                  if (Je = Y[0], X = Y[1], !Je && !X) return;
                  Se = D.state.lastX + Je, ze = D.state.lastY + X;
                }
                var me = (0, b.createCoreData)(I(D), Se, ze);
                if ((0, v.default)("DraggableCore: handleDrag: %j", me), D.props.onDrag(ke, me) !== !1 && D.mounted !== !1) D.setState({ lastX: Se, lastY: ze });
                else try {
                  D.handleDragStop(new MouseEvent("mouseup"));
                } catch {
                  var l = document.createEvent("MouseEvents");
                  l.initMouseEvent("mouseup", !0, !0, window, 0, 0, 0, 0, 0, !1, !1, !1, !1, 0, null), D.handleDragStop(l);
                }
              }
            }), Q(I(D), "handleDragStop", function(ke) {
              if (D.state.dragging) {
                var Pe = (0, b.getControlPosition)(ke, D.state.touchIdentifier, I(D));
                if (Pe != null) {
                  var Se = Pe.x, ze = Pe.y, Je = (0, b.createCoreData)(I(D), Se, ze);
                  if (D.props.onStop(ke, Je) === !1 || D.mounted === !1) return !1;
                  var X = D.findDOMNode();
                  X && D.props.enableUserSelectHack && (0, g.removeUserSelectStyles)(X.ownerDocument), (0, v.default)("DraggableCore: handleDragStop: %j", Je), D.setState({ dragging: !1, lastX: NaN, lastY: NaN }), X && ((0, v.default)("DraggableCore: Removing handlers"), (0, g.removeEvent)(X.ownerDocument, se.move, D.handleDrag), (0, g.removeEvent)(X.ownerDocument, se.stop, D.handleDragStop));
                }
              }
            }), Q(I(D), "onMouseDown", function(ke) {
              return se = A, D.handleDragStart(ke);
            }), Q(I(D), "onMouseUp", function(ke) {
              return se = A, D.handleDragStop(ke);
            }), Q(I(D), "onTouchStart", function(ke) {
              return se = z, D.handleDragStart(ke);
            }), Q(I(D), "onTouchEnd", function(ke) {
              return se = z, D.handleDragStop(ke);
            }), D;
          }
          return ce = de, (ye = [{ key: "componentDidMount", value: function() {
            this.mounted = !0;
            var D = this.findDOMNode();
            D && (0, g.addEvent)(D, z.start, this.onTouchStart, { passive: !1 });
          } }, { key: "componentWillUnmount", value: function() {
            this.mounted = !1;
            var D = this.findDOMNode();
            if (D) {
              var ie = D.ownerDocument;
              (0, g.removeEvent)(ie, A.move, this.handleDrag), (0, g.removeEvent)(ie, z.move, this.handleDrag), (0, g.removeEvent)(ie, A.stop, this.handleDragStop), (0, g.removeEvent)(ie, z.stop, this.handleDragStop), (0, g.removeEvent)(D, z.start, this.onTouchStart, { passive: !1 }), this.props.enableUserSelectHack && (0, g.removeUserSelectStyles)(ie);
            }
          } }, { key: "findDOMNode", value: function() {
            return this.props.nodeRef ? this.props.nodeRef.current : E.default.findDOMNode(this);
          } }, { key: "render", value: function() {
            return c.cloneElement(c.Children.only(this.props.children), { onMouseDown: this.onMouseDown, onMouseUp: this.onMouseUp, onTouchEnd: this.onTouchEnd });
          } }]) && V(ce.prototype, ye), de;
        }(c.Component);
        i.default = le, Q(le, "displayName", "DraggableCore"), Q(le, "propTypes", { allowAnyClick: o.default.bool, disabled: o.default.bool, enableUserSelectHack: o.default.bool, offsetParent: function(te, ce) {
          if (te[ce] && te[ce].nodeType !== 1) throw new Error("Draggable's offsetParent must be a DOM Node.");
        }, grid: o.default.arrayOf(o.default.number), handle: o.default.string, cancel: o.default.string, nodeRef: o.default.object, onStart: o.default.func, onDrag: o.default.func, onStop: o.default.func, onMouseDown: o.default.func, scale: o.default.number, className: y.dontSetMe, style: y.dontSetMe, transform: y.dontSetMe }), Q(le, "defaultProps", { allowAnyClick: !1, cancel: null, disabled: !1, enableUserSelectHack: !0, offsetParent: null, handle: null, grid: null, transform: null, onStart: function() {
        }, onDrag: function() {
        }, onStop: function() {
        }, onMouseDown: function() {
        }, scale: 1 });
      }, function(m, i, u) {
        var c = u(6), o = u(59);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[m.i, o, ""]]);
        var E = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, E), m.exports = o.locals || {};
      }, function(m, i, u) {
        (m.exports = u(7)(!1)).push([m.i, ".ck-inspector{--ck-inspector-color-tab-background-hover:rgba(0,0,0,0.07);--ck-inspector-color-tab-active-border:#0dacef }.ck-inspector .ck-inspector-horizontal-nav{display:flex;flex-direction:row;user-select:none;align-self:stretch}.ck-inspector .ck-inspector-horizontal-nav .ck-inspector-horizontal-nav__item{-webkit-appearance:none;background:none;border:0;border-bottom:2px solid transparent;padding:.5em 1em;align-self:stretch}.ck-inspector .ck-inspector-horizontal-nav .ck-inspector-horizontal-nav__item:hover{background:var(--ck-inspector-color-tab-background-hover)}.ck-inspector .ck-inspector-horizontal-nav .ck-inspector-horizontal-nav__item.ck-inspector-horizontal-nav__item_active{border-bottom-color:var(--ck-inspector-color-tab-active-border)}", ""]);
      }, function(m, i, u) {
        var c = u(6), o = u(61);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[m.i, o, ""]]);
        var E = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, E), m.exports = o.locals || {};
      }, function(m, i, u) {
        (m.exports = u(7)(!1)).push([m.i, ".ck-inspector{--ck-inspector-navbox-empty-background:#fafafa}.ck-inspector .ck-inspector-navbox{display:flex;flex-direction:column;height:100%;align-items:stretch}.ck-inspector .ck-inspector-navbox .ck-inspector-navbox__navigation{display:flex;flex-direction:row;flex-wrap:nowrap;align-items:stretch;min-height:30px;max-height:30px;border-bottom:1px solid var(--ck-inspector-color-border);width:100%;user-select:none;align-items:center}.ck-inspector .ck-inspector-navbox .ck-inspector-navbox__content{display:flex;flex-direction:row;height:100%;overflow:hidden}", ""]);
      }, function(m, i, u) {
        var c = u(6), o = u(63);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[m.i, o, ""]]);
        var E = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, E), m.exports = o.locals || {};
      }, function(m, i, u) {
        (m.exports = u(7)(!1)).push([m.i, ".ck-inspector{--ck-inspector-icon-size:19px;--ck-inspector-button-size:calc(4px + var(--ck-inspector-icon-size));--ck-inspector-color-button:#777;--ck-inspector-color-button-hover:#222;--ck-inspector-color-button-on:#0f79e2}.ck-inspector .ck-inspector-button{width:var(--ck-inspector-button-size);height:var(--ck-inspector-button-size);border:0;overflow:hidden;border-radius:2px;padding:2px;color:var(--ck-inspector-color-button)}.ck-inspector .ck-inspector-button.ck-inspector-button_on,.ck-inspector .ck-inspector-button.ck-inspector-button_on:hover{color:var(--ck-inspector-color-button-on);opacity:1}.ck-inspector .ck-inspector-button.ck-inspector-button_disabled{opacity:.3}.ck-inspector .ck-inspector-button>span{display:none}.ck-inspector .ck-inspector-button:hover{color:var(--ck-inspector-color-button-hover)}.ck-inspector .ck-inspector-button svg{width:var(--ck-inspector-icon-size);height:var(--ck-inspector-icon-size)}.ck-inspector .ck-inspector-button svg,.ck-inspector .ck-inspector-button svg *{fill:currentColor}", ""]);
      }, function(m, i, u) {
        var c = u(6), o = u(65);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[m.i, o, ""]]);
        var E = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, E), m.exports = o.locals || {};
      }, function(m, i, u) {
        (m.exports = u(7)(!1)).push([m.i, ".ck-inspector{--ck-inspector-explorer-width:300px}.ck-inspector .ck-inspector-pane{display:flex;width:100%}.ck-inspector .ck-inspector-pane.ck-inspector-pane_empty{align-items:center;justify-content:center;padding:1em;background:var(--ck-inspector-navbox-empty-background)}.ck-inspector .ck-inspector-pane.ck-inspector-pane_empty p{align-self:center;width:100%;text-align:center}.ck-inspector .ck-inspector-pane>.ck-inspector-navbox:last-child{min-width:var(--ck-inspector-explorer-width);width:var(--ck-inspector-explorer-width)}.ck-inspector .ck-inspector-pane.ck-inspector-pane_vsplit>.ck-inspector-navbox:first-child{border-right:1px solid var(--ck-inspector-color-border);flex:1 1 auto;overflow:hidden}.ck-inspector .ck-inspector-pane.ck-inspector-pane_vsplit>.ck-inspector-navbox:first-child .ck-inspector-navbox__navigation{align-items:center}.ck-inspector .ck-inspector-pane.ck-inspector-pane_vsplit>.ck-inspector-navbox:first-child .ck-inspector-tree__config label{margin:0 .5em}.ck-inspector .ck-inspector-pane.ck-inspector-pane_vsplit>.ck-inspector-navbox:first-child .ck-inspector-tree__config input+label{margin-right:1em}", ""]);
      }, function(m, i, u) {
        var c = u(6), o = u(67);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[m.i, o, ""]]);
        var E = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, E), m.exports = o.locals || {};
      }, function(m, i, u) {
        (m.exports = u(7)(!1)).push([m.i, ".ck-inspector-side-pane{position:relative}", ""]);
      }, function(m, i, u) {
        var c = u(6), o = u(69);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[m.i, o, ""]]);
        var E = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, E), m.exports = o.locals || {};
      }, function(m, i, u) {
        (m.exports = u(7)(!1)).push([m.i, ".ck-inspector .ck-inspector-checkbox{vertical-align:middle}", ""]);
      }, function(m, i, u) {
        var c = u(6), o = u(71);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[m.i, o, ""]]);
        var E = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, E), m.exports = o.locals || {};
      }, function(m, i, u) {
        (m.exports = u(7)(!1)).push([m.i, '.ck-inspector{--ck-inspector-color-property-list-property-name:#d0363f;--ck-inspector-color-property-list-property-value-true:green;--ck-inspector-color-property-list-property-value-false:red;--ck-inspector-color-property-list-property-value-unknown:#888;--ck-inspector-color-property-list-background:#f5f5f5;--ck-inspector-color-property-list-title-collapser:#727272}.ck-inspector .ck-inspector-property-list{display:grid;grid-template-columns:auto 1fr;background:var(--ck-inspector-color-white)}.ck-inspector .ck-inspector-property-list>:nth-of-type(odd){background:var(--ck-inspector-color-property-list-background)}.ck-inspector .ck-inspector-property-list>:nth-of-type(2n){background:var(--ck-inspector-color-white)}.ck-inspector .ck-inspector-property-list dt{padding:0 .7em 0 1.2em;min-width:15em}.ck-inspector .ck-inspector-property-list dt.ck-inspector-property-list__title_collapsible button{display:inline-block;overflow:hidden;vertical-align:middle;margin-left:-9px;margin-right:.3em;width:0;height:0;border-left:6px solid var(--ck-inspector-color-property-list-title-collapser);border-bottom:3.5px solid transparent;border-right:0 solid transparent;border-top:3.5px solid transparent;transition:transform .2s ease-in-out;transform:rotate(0deg)}.ck-inspector .ck-inspector-property-list dt.ck-inspector-property-list__title_expanded button{transform:rotate(90deg)}.ck-inspector .ck-inspector-property-list dt.ck-inspector-property-list__title_collapsed+dd+.ck-inspector-property-list{display:none}.ck-inspector .ck-inspector-property-list dt .ck-inspector-property-list__title__color-box{width:12px;height:12px;vertical-align:text-top;display:inline-block;margin-right:3px;border-radius:2px;border:1px solid #000}.ck-inspector .ck-inspector-property-list dt.ck-inspector-property-list__title_clickable label:hover{text-decoration:underline;cursor:pointer}.ck-inspector .ck-inspector-property-list dt label{color:var(--ck-inspector-color-property-list-property-name)}.ck-inspector .ck-inspector-property-list dd{padding-right:.7em}.ck-inspector .ck-inspector-property-list dd input{width:100%}.ck-inspector .ck-inspector-property-list dd input[value=false]{color:var(--ck-inspector-color-property-list-property-value-false)}.ck-inspector .ck-inspector-property-list dd input[value=true]{color:var(--ck-inspector-color-property-list-property-value-true)}.ck-inspector .ck-inspector-property-list dd input[value="function() {…}"],.ck-inspector .ck-inspector-property-list dd input[value=undefined]{color:var(--ck-inspector-color-property-list-property-value-unknown)}.ck-inspector .ck-inspector-property-list dd input[value="function() {…}"]{font-style:italic}.ck-inspector .ck-inspector-property-list .ck-inspector-property-list{grid-column:1/-1;margin-left:1em;background:transparent}.ck-inspector .ck-inspector-property-list .ck-inspector-property-list>:nth-of-type(2n),.ck-inspector .ck-inspector-property-list .ck-inspector-property-list>:nth-of-type(odd){background:transparent}', ""]);
      }, function(m, i, u) {
        var c = u(6), o = u(73);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[m.i, o, ""]]);
        var E = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, E), m.exports = o.locals || {};
      }, function(m, i, u) {
        (m.exports = u(7)(!1)).push([m.i, `.ck-inspector .ck-inspector__object-inspector{width:100%;background:var(--ck-inspector-color-white);overflow:auto}.ck-inspector .ck-inspector__object-inspector h2,.ck-inspector .ck-inspector__object-inspector h3{display:flex;flex-direction:row;flex-wrap:nowrap}.ck-inspector .ck-inspector__object-inspector h2{display:flex;align-items:center;padding:1em;overflow:hidden;text-overflow:ellipsis}.ck-inspector .ck-inspector__object-inspector h2>span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;margin-right:auto}.ck-inspector .ck-inspector__object-inspector h2>.ck-inspector-button{flex-shrink:0;margin-left:.5em}.ck-inspector .ck-inspector__object-inspector h2 a{font-weight:700;color:var(--ck-inspector-color-tree-node-name)}.ck-inspector .ck-inspector__object-inspector h2 a,.ck-inspector .ck-inspector__object-inspector h2 a>*{cursor:pointer}.ck-inspector .ck-inspector__object-inspector h2 em:after,.ck-inspector .ck-inspector__object-inspector h2 em:before{content:'"'}.ck-inspector .ck-inspector__object-inspector h3{display:flex;align-items:center;font-size:12px;padding:.4em .7em}.ck-inspector .ck-inspector__object-inspector h3 a{color:inherit;font-weight:700;margin-right:auto}.ck-inspector .ck-inspector__object-inspector h3 .ck-inspector-button{visibility:hidden}.ck-inspector .ck-inspector__object-inspector h3:hover .ck-inspector-button{visibility:visible}.ck-inspector .ck-inspector__object-inspector hr{border-top:1px solid var(--ck-inspector-color-border)}`, ""]);
      }, function(m, i, u) {
        var c = u(6), o = u(75);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[m.i, o, ""]]);
        var E = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, E), m.exports = o.locals || {};
      }, function(m, i, u) {
        (m.exports = u(7)(!1)).push([m.i, ".ck-inspector-model-tree__hide-markers .ck-inspector-tree__position.ck-inspector-tree__position_marker{display:none}", ""]);
      }, function(m, i) {
        m.exports = function() {
          var u = document.getSelection();
          if (!u.rangeCount) return function() {
          };
          for (var c = document.activeElement, o = [], E = 0; E < u.rangeCount; E++) o.push(u.getRangeAt(E));
          switch (c.tagName.toUpperCase()) {
            case "INPUT":
            case "TEXTAREA":
              c.blur();
              break;
            default:
              c = null;
          }
          return u.removeAllRanges(), function() {
            u.type === "Caret" && u.removeAllRanges(), u.rangeCount || o.forEach(function(g) {
              u.addRange(g);
            }), c && c.focus();
          };
        };
      }, function(m, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.bodyOpenClassName = i.portalClassName = void 0;
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
        }(), E = u(0), g = K(E), b = K(u(12)), y = K(u(18)), v = K(u(78)), C = function(A) {
          if (A && A.__esModule) return A;
          var se = {};
          if (A != null) for (var le in A) Object.prototype.hasOwnProperty.call(A, le) && (se[le] = A[le]);
          return se.default = A, se;
        }(u(43)), x = u(36), N = K(x), G = u(85);
        function K(A) {
          return A && A.__esModule ? A : { default: A };
        }
        function j(A, se) {
          if (!(A instanceof se)) throw new TypeError("Cannot call a class as a function");
        }
        function V(A, se) {
          if (!A) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
          return !se || typeof se != "object" && typeof se != "function" ? A : se;
        }
        var P = i.portalClassName = "ReactModalPortal", M = i.bodyOpenClassName = "ReactModal__Body--open", B = x.canUseDOM && b.default.createPortal !== void 0, I = function(A) {
          return document.createElement(A);
        }, oe = function() {
          return B ? b.default.createPortal : b.default.unstable_renderSubtreeIntoContainer;
        };
        function Q(A) {
          return A();
        }
        var z = function(A) {
          function se() {
            var le, te, ce;
            j(this, se);
            for (var ye = arguments.length, J = Array(ye), de = 0; de < ye; de++) J[de] = arguments[de];
            return te = ce = V(this, (le = se.__proto__ || Object.getPrototypeOf(se)).call.apply(le, [this].concat(J))), ce.removePortal = function() {
              !B && b.default.unmountComponentAtNode(ce.node);
              var D = Q(ce.props.parentSelector);
              D && D.contains(ce.node) ? D.removeChild(ce.node) : console.warn('React-Modal: "parentSelector" prop did not returned any DOM element. Make sure that the parent element is unmounted to avoid any memory leaks.');
            }, ce.portalRef = function(D) {
              ce.portal = D;
            }, ce.renderPortal = function(D) {
              var ie = oe()(ce, g.default.createElement(v.default, c({ defaultStyles: se.defaultStyles }, D)), ce.node);
              ce.portalRef(ie);
            }, V(ce, te);
          }
          return function(le, te) {
            if (typeof te != "function" && te !== null) throw new TypeError("Super expression must either be null or a function, not " + typeof te);
            le.prototype = Object.create(te && te.prototype, { constructor: { value: le, enumerable: !1, writable: !0, configurable: !0 } }), te && (Object.setPrototypeOf ? Object.setPrototypeOf(le, te) : le.__proto__ = te);
          }(se, A), o(se, [{ key: "componentDidMount", value: function() {
            x.canUseDOM && (B || (this.node = I("div")), this.node.className = this.props.portalClassName, Q(this.props.parentSelector).appendChild(this.node), !B && this.renderPortal(this.props));
          } }, { key: "getSnapshotBeforeUpdate", value: function(le) {
            return { prevParent: Q(le.parentSelector), nextParent: Q(this.props.parentSelector) };
          } }, { key: "componentDidUpdate", value: function(le, te, ce) {
            if (x.canUseDOM) {
              var ye = this.props, J = ye.isOpen, de = ye.portalClassName;
              le.portalClassName !== de && (this.node.className = de);
              var D = ce.prevParent, ie = ce.nextParent;
              ie !== D && (D.removeChild(this.node), ie.appendChild(this.node)), (le.isOpen || J) && !B && this.renderPortal(this.props);
            }
          } }, { key: "componentWillUnmount", value: function() {
            if (x.canUseDOM && this.node && this.portal) {
              var le = this.portal.state, te = Date.now(), ce = le.isOpen && this.props.closeTimeoutMS && (le.closesAt || te + this.props.closeTimeoutMS);
              ce ? (le.beforeClose || this.portal.closeWithTimeout(), setTimeout(this.removePortal, ce - te)) : this.removePortal();
            }
          } }, { key: "render", value: function() {
            return x.canUseDOM && B ? (!this.node && B && (this.node = I("div")), oe()(g.default.createElement(v.default, c({ ref: this.portalRef, defaultStyles: se.defaultStyles }, this.props)), this.node)) : null;
          } }], [{ key: "setAppElement", value: function(le) {
            C.setElement(le);
          } }]), se;
        }(E.Component);
        z.propTypes = { isOpen: y.default.bool.isRequired, style: y.default.shape({ content: y.default.object, overlay: y.default.object }), portalClassName: y.default.string, bodyOpenClassName: y.default.string, htmlOpenClassName: y.default.string, className: y.default.oneOfType([y.default.string, y.default.shape({ base: y.default.string.isRequired, afterOpen: y.default.string.isRequired, beforeClose: y.default.string.isRequired })]), overlayClassName: y.default.oneOfType([y.default.string, y.default.shape({ base: y.default.string.isRequired, afterOpen: y.default.string.isRequired, beforeClose: y.default.string.isRequired })]), appElement: y.default.oneOfType([y.default.instanceOf(N.default), y.default.instanceOf(x.SafeHTMLCollection), y.default.instanceOf(x.SafeNodeList), y.default.arrayOf(y.default.instanceOf(N.default))]), onAfterOpen: y.default.func, onRequestClose: y.default.func, closeTimeoutMS: y.default.number, ariaHideApp: y.default.bool, shouldFocusAfterRender: y.default.bool, shouldCloseOnOverlayClick: y.default.bool, shouldReturnFocusAfterClose: y.default.bool, preventScroll: y.default.bool, parentSelector: y.default.func, aria: y.default.object, data: y.default.object, role: y.default.string, contentLabel: y.default.string, shouldCloseOnEsc: y.default.bool, overlayRef: y.default.func, contentRef: y.default.func, id: y.default.string, overlayElement: y.default.func, contentElement: y.default.func }, z.defaultProps = { isOpen: !1, portalClassName: P, bodyOpenClassName: M, role: "dialog", ariaHideApp: !0, closeTimeoutMS: 0, shouldFocusAfterRender: !0, shouldCloseOnEsc: !0, shouldCloseOnOverlayClick: !0, shouldReturnFocusAfterClose: !0, preventScroll: !1, parentSelector: function() {
          return document.body;
        }, overlayElement: function(A, se) {
          return g.default.createElement("div", A, se);
        }, contentElement: function(A, se) {
          return g.default.createElement("div", A, se);
        } }, z.defaultStyles = { overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(255, 255, 255, 0.75)" }, content: { position: "absolute", top: "40px", left: "40px", right: "40px", bottom: "40px", border: "1px solid #ccc", background: "#fff", overflow: "auto", WebkitOverflowScrolling: "touch", borderRadius: "4px", outline: "none", padding: "20px" } }, (0, G.polyfill)(z), i.default = z;
      }, function(m, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 });
        var c = Object.assign || function(I) {
          for (var oe = 1; oe < arguments.length; oe++) {
            var Q = arguments[oe];
            for (var z in Q) Object.prototype.hasOwnProperty.call(Q, z) && (I[z] = Q[z]);
          }
          return I;
        }, o = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(I) {
          return typeof I;
        } : function(I) {
          return I && typeof Symbol == "function" && I.constructor === Symbol && I !== Symbol.prototype ? "symbol" : typeof I;
        }, E = /* @__PURE__ */ function() {
          function I(oe, Q) {
            for (var z = 0; z < Q.length; z++) {
              var A = Q[z];
              A.enumerable = A.enumerable || !1, A.configurable = !0, "value" in A && (A.writable = !0), Object.defineProperty(oe, A.key, A);
            }
          }
          return function(oe, Q, z) {
            return Q && I(oe.prototype, Q), z && I(oe, z), oe;
          };
        }(), g = u(0), b = V(u(18)), y = j(u(79)), v = V(u(80)), C = j(u(43)), x = j(u(83)), N = u(36), G = V(N), K = V(u(44));
        function j(I) {
          if (I && I.__esModule) return I;
          var oe = {};
          if (I != null) for (var Q in I) Object.prototype.hasOwnProperty.call(I, Q) && (oe[Q] = I[Q]);
          return oe.default = I, oe;
        }
        function V(I) {
          return I && I.__esModule ? I : { default: I };
        }
        u(84);
        var P = { overlay: "ReactModal__Overlay", content: "ReactModal__Content" }, M = 0, B = function(I) {
          function oe(Q) {
            (function(A, se) {
              if (!(A instanceof se)) throw new TypeError("Cannot call a class as a function");
            })(this, oe);
            var z = function(A, se) {
              if (!A) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
              return !se || typeof se != "object" && typeof se != "function" ? A : se;
            }(this, (oe.__proto__ || Object.getPrototypeOf(oe)).call(this, Q));
            return z.setOverlayRef = function(A) {
              z.overlay = A, z.props.overlayRef && z.props.overlayRef(A);
            }, z.setContentRef = function(A) {
              z.content = A, z.props.contentRef && z.props.contentRef(A);
            }, z.afterClose = function() {
              var A = z.props, se = A.appElement, le = A.ariaHideApp, te = A.htmlOpenClassName, ce = A.bodyOpenClassName;
              ce && x.remove(document.body, ce), te && x.remove(document.getElementsByTagName("html")[0], te), le && M > 0 && (M -= 1) === 0 && C.show(se), z.props.shouldFocusAfterRender && (z.props.shouldReturnFocusAfterClose ? (y.returnFocus(z.props.preventScroll), y.teardownScopedFocus()) : y.popWithoutFocus()), z.props.onAfterClose && z.props.onAfterClose(), K.default.deregister(z);
            }, z.open = function() {
              z.beforeOpen(), z.state.afterOpen && z.state.beforeClose ? (clearTimeout(z.closeTimer), z.setState({ beforeClose: !1 })) : (z.props.shouldFocusAfterRender && (y.setupScopedFocus(z.node), y.markForFocusLater()), z.setState({ isOpen: !0 }, function() {
                z.openAnimationFrame = requestAnimationFrame(function() {
                  z.setState({ afterOpen: !0 }), z.props.isOpen && z.props.onAfterOpen && z.props.onAfterOpen({ overlayEl: z.overlay, contentEl: z.content });
                });
              }));
            }, z.close = function() {
              z.props.closeTimeoutMS > 0 ? z.closeWithTimeout() : z.closeWithoutTimeout();
            }, z.focusContent = function() {
              return z.content && !z.contentHasFocus() && z.content.focus({ preventScroll: !0 });
            }, z.closeWithTimeout = function() {
              var A = Date.now() + z.props.closeTimeoutMS;
              z.setState({ beforeClose: !0, closesAt: A }, function() {
                z.closeTimer = setTimeout(z.closeWithoutTimeout, z.state.closesAt - Date.now());
              });
            }, z.closeWithoutTimeout = function() {
              z.setState({ beforeClose: !1, isOpen: !1, afterOpen: !1, closesAt: null }, z.afterClose);
            }, z.handleKeyDown = function(A) {
              A.keyCode === 9 && (0, v.default)(z.content, A), z.props.shouldCloseOnEsc && A.keyCode === 27 && (A.stopPropagation(), z.requestClose(A));
            }, z.handleOverlayOnClick = function(A) {
              z.shouldClose === null && (z.shouldClose = !0), z.shouldClose && z.props.shouldCloseOnOverlayClick && (z.ownerHandlesClose() ? z.requestClose(A) : z.focusContent()), z.shouldClose = null;
            }, z.handleContentOnMouseUp = function() {
              z.shouldClose = !1;
            }, z.handleOverlayOnMouseDown = function(A) {
              z.props.shouldCloseOnOverlayClick || A.target != z.overlay || A.preventDefault();
            }, z.handleContentOnClick = function() {
              z.shouldClose = !1;
            }, z.handleContentOnMouseDown = function() {
              z.shouldClose = !1;
            }, z.requestClose = function(A) {
              return z.ownerHandlesClose() && z.props.onRequestClose(A);
            }, z.ownerHandlesClose = function() {
              return z.props.onRequestClose;
            }, z.shouldBeClosed = function() {
              return !z.state.isOpen && !z.state.beforeClose;
            }, z.contentHasFocus = function() {
              return document.activeElement === z.content || z.content.contains(document.activeElement);
            }, z.buildClassName = function(A, se) {
              var le = (se === void 0 ? "undefined" : o(se)) === "object" ? se : { base: P[A], afterOpen: P[A] + "--after-open", beforeClose: P[A] + "--before-close" }, te = le.base;
              return z.state.afterOpen && (te = te + " " + le.afterOpen), z.state.beforeClose && (te = te + " " + le.beforeClose), typeof se == "string" && se ? te + " " + se : te;
            }, z.attributesFromObject = function(A, se) {
              return Object.keys(se).reduce(function(le, te) {
                return le[A + "-" + te] = se[te], le;
              }, {});
            }, z.state = { afterOpen: !1, beforeClose: !1 }, z.shouldClose = null, z.moveFromContentToOverlay = null, z;
          }
          return function(Q, z) {
            if (typeof z != "function" && z !== null) throw new TypeError("Super expression must either be null or a function, not " + typeof z);
            Q.prototype = Object.create(z && z.prototype, { constructor: { value: Q, enumerable: !1, writable: !0, configurable: !0 } }), z && (Object.setPrototypeOf ? Object.setPrototypeOf(Q, z) : Q.__proto__ = z);
          }(oe, I), E(oe, [{ key: "componentDidMount", value: function() {
            this.props.isOpen && this.open();
          } }, { key: "componentDidUpdate", value: function(Q, z) {
            this.props.isOpen && !Q.isOpen ? this.open() : !this.props.isOpen && Q.isOpen && this.close(), this.props.shouldFocusAfterRender && this.state.isOpen && !z.isOpen && this.focusContent();
          } }, { key: "componentWillUnmount", value: function() {
            this.state.isOpen && this.afterClose(), clearTimeout(this.closeTimer), cancelAnimationFrame(this.openAnimationFrame);
          } }, { key: "beforeOpen", value: function() {
            var Q = this.props, z = Q.appElement, A = Q.ariaHideApp, se = Q.htmlOpenClassName, le = Q.bodyOpenClassName;
            le && x.add(document.body, le), se && x.add(document.getElementsByTagName("html")[0], se), A && (M += 1, C.hide(z)), K.default.register(this);
          } }, { key: "render", value: function() {
            var Q = this.props, z = Q.id, A = Q.className, se = Q.overlayClassName, le = Q.defaultStyles, te = Q.children, ce = A ? {} : le.content, ye = se ? {} : le.overlay;
            if (this.shouldBeClosed()) return null;
            var J = { ref: this.setOverlayRef, className: this.buildClassName("overlay", se), style: c({}, ye, this.props.style.overlay), onClick: this.handleOverlayOnClick, onMouseDown: this.handleOverlayOnMouseDown }, de = c({ id: z, ref: this.setContentRef, style: c({}, ce, this.props.style.content), className: this.buildClassName("content", A), tabIndex: "-1", onKeyDown: this.handleKeyDown, onMouseDown: this.handleContentOnMouseDown, onMouseUp: this.handleContentOnMouseUp, onClick: this.handleContentOnClick, role: this.props.role, "aria-label": this.props.contentLabel }, this.attributesFromObject("aria", c({ modal: !0 }, this.props.aria)), this.attributesFromObject("data", this.props.data || {}), { "data-testid": this.props.testId }), D = this.props.contentElement(de, te);
            return this.props.overlayElement(J, D);
          } }]), oe;
        }(g.Component);
        B.defaultProps = { style: { overlay: {}, content: {} }, defaultStyles: {} }, B.propTypes = { isOpen: b.default.bool.isRequired, defaultStyles: b.default.shape({ content: b.default.object, overlay: b.default.object }), style: b.default.shape({ content: b.default.object, overlay: b.default.object }), className: b.default.oneOfType([b.default.string, b.default.object]), overlayClassName: b.default.oneOfType([b.default.string, b.default.object]), bodyOpenClassName: b.default.string, htmlOpenClassName: b.default.string, ariaHideApp: b.default.bool, appElement: b.default.oneOfType([b.default.instanceOf(G.default), b.default.instanceOf(N.SafeHTMLCollection), b.default.instanceOf(N.SafeNodeList), b.default.arrayOf(b.default.instanceOf(G.default))]), onAfterOpen: b.default.func, onAfterClose: b.default.func, onRequestClose: b.default.func, closeTimeoutMS: b.default.number, shouldFocusAfterRender: b.default.bool, shouldCloseOnOverlayClick: b.default.bool, shouldReturnFocusAfterClose: b.default.bool, preventScroll: b.default.bool, role: b.default.string, contentLabel: b.default.string, aria: b.default.object, data: b.default.object, children: b.default.node, shouldCloseOnEsc: b.default.bool, overlayRef: b.default.func, contentRef: b.default.func, id: b.default.string, overlayElement: b.default.func, contentElement: b.default.func, testId: b.default.string }, i.default = B, m.exports = i.default;
      }, function(m, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.resetState = function() {
          g = [];
        }, i.log = function() {
        }, i.handleBlur = v, i.handleFocus = C, i.markForFocusLater = function() {
          g.push(document.activeElement);
        }, i.returnFocus = function() {
          var x = arguments.length > 0 && arguments[0] !== void 0 && arguments[0], N = null;
          try {
            return void (g.length !== 0 && (N = g.pop()).focus({ preventScroll: x }));
          } catch {
            console.warn(["You tried to return focus to", N, "but it is not in the DOM anymore"].join(" "));
          }
        }, i.popWithoutFocus = function() {
          g.length > 0 && g.pop();
        }, i.setupScopedFocus = function(x) {
          b = x, window.addEventListener ? (window.addEventListener("blur", v, !1), document.addEventListener("focus", C, !0)) : (window.attachEvent("onBlur", v), document.attachEvent("onFocus", C));
        }, i.teardownScopedFocus = function() {
          b = null, window.addEventListener ? (window.removeEventListener("blur", v), document.removeEventListener("focus", C)) : (window.detachEvent("onBlur", v), document.detachEvent("onFocus", C));
        };
        var c, o = u(42), E = (c = o) && c.__esModule ? c : { default: c }, g = [], b = null, y = !1;
        function v() {
          y = !0;
        }
        function C() {
          if (y) {
            if (y = !1, !b) return;
            setTimeout(function() {
              b.contains(document.activeElement) || ((0, E.default)(b)[0] || b).focus();
            }, 0);
          }
        }
      }, function(m, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.default = function(g, b) {
          var y = (0, E.default)(g);
          if (!y.length) return void b.preventDefault();
          var v = void 0, C = b.shiftKey, x = y[0], N = y[y.length - 1], G = function V() {
            var P = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : document;
            return P.activeElement.shadowRoot ? V(P.activeElement.shadowRoot) : P.activeElement;
          }();
          if (g === G) {
            if (!C) return;
            v = N;
          }
          if (N !== G || C || (v = x), x === G && C && (v = N), v) return b.preventDefault(), void v.focus();
          var K = /(\bChrome\b|\bSafari\b)\//.exec(navigator.userAgent);
          if (!(K == null || K[1] == "Chrome" || /\biPod\b|\biPad\b/g.exec(navigator.userAgent) != null)) {
            var j = y.indexOf(G);
            if (j > -1 && (j += C ? -1 : 1), (v = y[j]) === void 0) return b.preventDefault(), void (v = C ? N : x).focus();
            b.preventDefault(), v.focus();
          }
        };
        var c, o = u(42), E = (c = o) && c.__esModule ? c : { default: c };
        m.exports = i.default;
      }, function(m, i, u) {
        var c = function() {
        };
        m.exports = c;
      }, function(m, i, u) {
        var c;
        (function() {
          var o = !(typeof window > "u" || !window.document || !window.document.createElement), E = { canUseDOM: o, canUseWorkers: typeof Worker < "u", canUseEventListeners: o && !(!window.addEventListener && !window.attachEvent), canUseViewport: o && !!window.screen };
          (c = (function() {
            return E;
          }).call(i, u, i, m)) === void 0 || (m.exports = c);
        })();
      }, function(m, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.resetState = function() {
          var g = document.getElementsByTagName("html")[0];
          for (var b in c) E(g, c[b]);
          var y = document.body;
          for (var v in o) E(y, o[v]);
          c = {}, o = {};
        }, i.log = function() {
        };
        var c = {}, o = {};
        function E(g, b) {
          g.classList.remove(b);
        }
        i.add = function(g, b) {
          return y = g.classList, v = g.nodeName.toLowerCase() == "html" ? c : o, void b.split(" ").forEach(function(C) {
            (function(x, N) {
              x[N] || (x[N] = 0), x[N] += 1;
            })(v, C), y.add(C);
          });
          var y, v;
        }, i.remove = function(g, b) {
          return y = g.classList, v = g.nodeName.toLowerCase() == "html" ? c : o, void b.split(" ").forEach(function(C) {
            (function(x, N) {
              x[N] && (x[N] -= 1);
            })(v, C), v[C] === 0 && y.remove(C);
          });
          var y, v;
        };
      }, function(m, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.resetState = function() {
          for (var C = [g, b], x = 0; x < C.length; x++) {
            var N = C[x];
            N && N.parentNode && N.parentNode.removeChild(N);
          }
          g = b = null, y = [];
        }, i.log = function() {
          console.log("bodyTrap ----------"), console.log(y.length);
          for (var C = [g, b], x = 0; x < C.length; x++) {
            var N = C[x] || {};
            console.log(N.nodeName, N.className, N.id);
          }
          console.log("edn bodyTrap ----------");
        };
        var c, o = u(44), E = (c = o) && c.__esModule ? c : { default: c }, g = void 0, b = void 0, y = [];
        function v() {
          y.length !== 0 && y[y.length - 1].focusContent();
        }
        E.default.subscribe(function(C, x) {
          g || b || ((g = document.createElement("div")).setAttribute("data-react-modal-body-trap", ""), g.style.position = "absolute", g.style.opacity = "0", g.setAttribute("tabindex", "0"), g.addEventListener("focus", v), (b = g.cloneNode()).addEventListener("focus", v)), (y = x).length > 0 ? (document.body.firstChild !== g && document.body.insertBefore(g, document.body.firstChild), document.body.lastChild !== b && document.body.appendChild(b)) : (g.parentElement && g.parentElement.removeChild(g), b.parentElement && b.parentElement.removeChild(b));
        });
      }, function(m, i, u) {
        function c() {
          var b = this.constructor.getDerivedStateFromProps(this.props, this.state);
          b != null && this.setState(b);
        }
        function o(b) {
          this.setState((function(y) {
            var v = this.constructor.getDerivedStateFromProps(b, y);
            return v ?? null;
          }).bind(this));
        }
        function E(b, y) {
          try {
            var v = this.props, C = this.state;
            this.props = b, this.state = y, this.__reactInternalSnapshotFlag = !0, this.__reactInternalSnapshot = this.getSnapshotBeforeUpdate(v, C);
          } finally {
            this.props = v, this.state = C;
          }
        }
        function g(b) {
          var y = b.prototype;
          if (!y || !y.isReactComponent) throw new Error("Can only polyfill class components");
          if (typeof b.getDerivedStateFromProps != "function" && typeof y.getSnapshotBeforeUpdate != "function") return b;
          var v = null, C = null, x = null;
          if (typeof y.componentWillMount == "function" ? v = "componentWillMount" : typeof y.UNSAFE_componentWillMount == "function" && (v = "UNSAFE_componentWillMount"), typeof y.componentWillReceiveProps == "function" ? C = "componentWillReceiveProps" : typeof y.UNSAFE_componentWillReceiveProps == "function" && (C = "UNSAFE_componentWillReceiveProps"), typeof y.componentWillUpdate == "function" ? x = "componentWillUpdate" : typeof y.UNSAFE_componentWillUpdate == "function" && (x = "UNSAFE_componentWillUpdate"), v !== null || C !== null || x !== null) {
            var N = b.displayName || b.name, G = typeof b.getDerivedStateFromProps == "function" ? "getDerivedStateFromProps()" : "getSnapshotBeforeUpdate()";
            throw Error(`Unsafe legacy lifecycles will not be called for components using new component APIs.

` + N + " uses " + G + " but also contains the following legacy lifecycles:" + (v !== null ? `
  ` + v : "") + (C !== null ? `
  ` + C : "") + (x !== null ? `
  ` + x : "") + `

The above lifecycles should be removed. Learn more about this warning here:
https://fb.me/react-async-component-lifecycle-hooks`);
          }
          if (typeof b.getDerivedStateFromProps == "function" && (y.componentWillMount = c, y.componentWillReceiveProps = o), typeof y.getSnapshotBeforeUpdate == "function") {
            if (typeof y.componentDidUpdate != "function") throw new Error("Cannot polyfill getSnapshotBeforeUpdate() for components that do not define componentDidUpdate() on the prototype");
            y.componentWillUpdate = E;
            var K = y.componentDidUpdate;
            y.componentDidUpdate = function(j, V, P) {
              var M = this.__reactInternalSnapshotFlag ? this.__reactInternalSnapshot : P;
              K.call(this, j, V, M);
            };
          }
          return b;
        }
        u.r(i), u.d(i, "polyfill", function() {
          return g;
        }), c.__suppressDeprecationWarning = !0, o.__suppressDeprecationWarning = !0, E.__suppressDeprecationWarning = !0;
      }, function(m, i, u) {
        var c = u(6), o = u(87);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[m.i, o, ""]]);
        var E = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, E), m.exports = o.locals || {};
      }, function(m, i, u) {
        (m.exports = u(7)(!1)).push([m.i, ".ck-inspector-modal{--ck-inspector-set-data-modal-overlay:rgba(0,0,0,0.5);--ck-inspector-set-data-modal-shadow:rgba(0,0,0,0.06);--ck-inspector-set-data-modal-button-background:#eee;--ck-inspector-set-data-modal-button-background-hover:#ddd;--ck-inspector-set-data-modal-save-button-background:#1976d2;--ck-inspector-set-data-modal-save-button-background-hover:#0b60b5}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal{z-index:999999;position:fixed;inset:0;background-color:var(--ck-inspector-set-data-modal-overlay)}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content{position:absolute;border:1px solid var(--ck-inspector-color-border);background:var(--ck-inspector-color-white);overflow:auto;border-radius:2px;outline:none;box-shadow:0 1px 1px var(--ck-inspector-set-data-modal-shadow),0 2px 2px var(--ck-inspector-set-data-modal-shadow),0 4px 4px var(--ck-inspector-set-data-modal-shadow),0 8px 8px var(--ck-inspector-set-data-modal-shadow),0 16px 16px var(--ck-inspector-set-data-modal-shadow);max-height:calc(100vh - 160px);max-width:calc(100vw - 160px);width:100%;height:100%;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;justify-content:space-between}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content h2{font-size:14px;font-weight:700;margin:0;padding:12px 20px;background:var(--ck-inspector-color-background);border-bottom:1px solid var(--ck-inspector-color-border)}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content textarea{flex-grow:1;margin:20px;border:1px solid var(--ck-inspector-color-border);border-radius:2px;resize:none;padding:10px;font-family:monospace;font-size:14px}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content button{padding:10px 20px;border-radius:2px;font-size:14px;white-space:nowrap;border:1px solid var(--ck-inspector-color-border)}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content button:hover{background:var(--ck-inspector-set-data-modal-button-background-hover)}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons{margin:0 20px 20px;display:flex;justify-content:center}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button+button{margin-left:20px}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button:first-child{margin-right:auto}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button:not(:first-child){flex-basis:20%}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button:last-child{background:var(--ck-inspector-set-data-modal-save-button-background);border-color:var(--ck-inspector-set-data-modal-save-button-background);color:#fff;font-weight:700}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button:last-child:hover{background:var(--ck-inspector-set-data-modal-save-button-background-hover)}", ""]);
      }, function(m, i, u) {
        var c = u(6), o = u(89);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[m.i, o, ""]]);
        var E = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, E), m.exports = o.locals || {};
      }, function(m, i, u) {
        (m.exports = u(7)(!1)).push([m.i, ".ck-inspector .ck-inspector-editor-quick-actions{display:flex;align-content:center;justify-content:center;align-items:center;flex-direction:row;flex-wrap:nowrap}.ck-inspector .ck-inspector-editor-quick-actions>.ck-inspector-button{margin-left:.3em}.ck-inspector .ck-inspector-editor-quick-actions>.ck-inspector-button.ck-inspector-button_data-copied{animation-duration:.5s;animation-name:ck-inspector-bounce-in;color:green}@keyframes ck-inspector-bounce-in{0%{opacity:0;transform:scale3d(.5,.5,.5)}20%{transform:scale3d(1.1,1.1,1.1)}40%{transform:scale3d(.8,.8,.8)}60%{opacity:1;transform:scale3d(1.05,1.05,1.05)}to{opacity:1;transform:scaleX(1)}}", ""]);
      }, function(m, i, u) {
        var c = u(6), o = u(91);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[m.i, o, ""]]);
        var E = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, E), m.exports = o.locals || {};
      }, function(m, i, u) {
        (m.exports = u(7)(!1)).push([m.i, "html body.ck-inspector-body-expanded{margin-bottom:var(--ck-inspector-height)}html body.ck-inspector-body-collapsed{margin-bottom:var(--ck-inspector-collapsed-height)}.ck-inspector-wrapper *{box-sizing:border-box}", ""]);
      }, , , function(m, i, u) {
        u.r(i), u.d(i, "default", function() {
          return $e;
        });
        var c = u(0), o = u.n(c), E = u(12), g = u.n(E);
        function b(_) {
          return "Minified Redux error #" + _ + "; visit https://redux.js.org/Errors?code=" + _ + " for the full message or use the non-minified dev environment for full errors. ";
        }
        var y = typeof Symbol == "function" && Symbol.observable || "@@observable", v = function() {
          return Math.random().toString(36).substring(7).split("").join(".");
        }, C = { INIT: "@@redux/INIT" + v(), REPLACE: "@@redux/REPLACE" + v() };
        function x(_) {
          if (typeof _ != "object" || _ === null) return !1;
          for (var s = _; Object.getPrototypeOf(s) !== null; ) s = Object.getPrototypeOf(s);
          return Object.getPrototypeOf(_) === s;
        }
        function N(_, s, d) {
          var h;
          if (typeof s == "function" && typeof d == "function" || typeof d == "function" && typeof arguments[3] == "function") throw new Error(b(0));
          if (typeof s == "function" && d === void 0 && (d = s, s = void 0), d !== void 0) {
            if (typeof d != "function") throw new Error(b(1));
            return d(N)(_, s);
          }
          if (typeof _ != "function") throw new Error(b(2));
          var S = _, O = s, L = [], ne = L, fe = !1;
          function pe() {
            ne === L && (ne = L.slice());
          }
          function _e() {
            if (fe) throw new Error(b(3));
            return O;
          }
          function Ne(Me) {
            if (typeof Me != "function") throw new Error(b(4));
            if (fe) throw new Error(b(5));
            var Fe = !0;
            return pe(), ne.push(Me), function() {
              if (Fe) {
                if (fe) throw new Error(b(6));
                Fe = !1, pe();
                var et = ne.indexOf(Me);
                ne.splice(et, 1), L = null;
              }
            };
          }
          function Be(Me) {
            if (!x(Me)) throw new Error(b(7));
            if (Me.type === void 0) throw new Error(b(8));
            if (fe) throw new Error(b(9));
            try {
              fe = !0, O = S(O, Me);
            } finally {
              fe = !1;
            }
            for (var Fe = L = ne, et = 0; et < Fe.length; et++)
              (0, Fe[et])();
            return Me;
          }
          function Ie(Me) {
            if (typeof Me != "function") throw new Error(b(10));
            S = Me, Be({ type: C.REPLACE });
          }
          function Ke() {
            var Me, Fe = Ne;
            return (Me = { subscribe: function(et) {
              if (typeof et != "object" || et === null) throw new Error(b(11));
              function Ye() {
                et.next && et.next(_e());
              }
              return Ye(), { unsubscribe: Fe(Ye) };
            } })[y] = function() {
              return this;
            }, Me;
          }
          return Be({ type: C.INIT }), (h = { dispatch: Be, subscribe: Ne, getState: _e, replaceReducer: Ie })[y] = Ke, h;
        }
        var G = o.a.createContext(null), K = function(_) {
          _();
        };
        function j() {
          var _ = K, s = null, d = null;
          return { clear: function() {
            s = null, d = null;
          }, notify: function() {
            _(function() {
              for (var h = s; h; ) h.callback(), h = h.next;
            });
          }, get: function() {
            for (var h = [], S = s; S; ) h.push(S), S = S.next;
            return h;
          }, subscribe: function(h) {
            var S = !0, O = d = { callback: h, next: null, prev: d };
            return O.prev ? O.prev.next = O : s = O, function() {
              S && s !== null && (S = !1, O.next ? O.next.prev = O.prev : d = O.prev, O.prev ? O.prev.next = O.next : s = O.next);
            };
          } };
        }
        var V = { notify: function() {
        }, get: function() {
          return [];
        } };
        function P(_, s) {
          var d, h = V;
          function S() {
            L.onStateChange && L.onStateChange();
          }
          function O() {
            d || (d = s ? s.addNestedSub(S) : _.subscribe(S), h = j());
          }
          var L = { addNestedSub: function(ne) {
            return O(), h.subscribe(ne);
          }, notifyNestedSubs: function() {
            h.notify();
          }, handleChangeWrapper: S, isSubscribed: function() {
            return !!d;
          }, trySubscribe: O, tryUnsubscribe: function() {
            d && (d(), d = void 0, h.clear(), h = V);
          }, getListeners: function() {
            return h;
          } };
          return L;
        }
        var M = typeof window < "u" && window.document !== void 0 && window.document.createElement !== void 0 ? c.useLayoutEffect : c.useEffect, B = function(_) {
          var s = _.store, d = _.context, h = _.children, S = Object(c.useMemo)(function() {
            var ne = P(s);
            return { store: s, subscription: ne };
          }, [s]), O = Object(c.useMemo)(function() {
            return s.getState();
          }, [s]);
          M(function() {
            var ne = S.subscription;
            return ne.onStateChange = ne.notifyNestedSubs, ne.trySubscribe(), O !== s.getState() && ne.notifyNestedSubs(), function() {
              ne.tryUnsubscribe(), ne.onStateChange = null;
            };
          }, [S, O]);
          var L = d || G;
          return o.a.createElement(L.Provider, { value: S }, h);
        };
        function I() {
          return (I = Object.assign ? Object.assign.bind() : function(_) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var h in d) Object.prototype.hasOwnProperty.call(d, h) && (_[h] = d[h]);
            }
            return _;
          }).apply(this, arguments);
        }
        function oe(_, s) {
          if (_ == null) return {};
          var d, h, S = {}, O = Object.keys(_);
          for (h = 0; h < O.length; h++) d = O[h], s.indexOf(d) >= 0 || (S[d] = _[d]);
          return S;
        }
        var Q = u(39), z = u.n(Q), A = u(45), se = ["getDisplayName", "methodName", "renderCountProp", "shouldHandleStateChanges", "storeKey", "withRef", "forwardRef", "context"], le = ["reactReduxForwardedRef"], te = [], ce = [null, null];
        function ye(_, s) {
          var d = _[1];
          return [s.payload, d + 1];
        }
        function J(_, s, d) {
          M(function() {
            return _.apply(void 0, s);
          }, d);
        }
        function de(_, s, d, h, S, O, L) {
          _.current = h, s.current = S, d.current = !1, O.current && (O.current = null, L());
        }
        function D(_, s, d, h, S, O, L, ne, fe, pe) {
          if (_) {
            var _e = !1, Ne = null, Be = function() {
              if (!_e) {
                var Ie, Ke, Me = s.getState();
                try {
                  Ie = h(Me, S.current);
                } catch (Fe) {
                  Ke = Fe, Ne = Fe;
                }
                Ke || (Ne = null), Ie === O.current ? L.current || fe() : (O.current = Ie, ne.current = Ie, L.current = !0, pe({ type: "STORE_UPDATED", payload: { error: Ke } }));
              }
            };
            return d.onStateChange = Be, d.trySubscribe(), Be(), function() {
              if (_e = !0, d.tryUnsubscribe(), d.onStateChange = null, Ne) throw Ne;
            };
          }
        }
        var ie = function() {
          return [null, 0];
        };
        function be(_, s) {
          s === void 0 && (s = {});
          var d = s, h = d.getDisplayName, S = h === void 0 ? function(Le) {
            return "ConnectAdvanced(" + Le + ")";
          } : h, O = d.methodName, L = O === void 0 ? "connectAdvanced" : O, ne = d.renderCountProp, fe = ne === void 0 ? void 0 : ne, pe = d.shouldHandleStateChanges, _e = pe === void 0 || pe, Ne = d.storeKey, Be = Ne === void 0 ? "store" : Ne, Ie = (d.withRef, d.forwardRef), Ke = Ie !== void 0 && Ie, Me = d.context, Fe = Me === void 0 ? G : Me, et = oe(d, se), Ye = Fe;
          return function(Le) {
            var dt = Le.displayName || Le.name || "Component", Dt = S(dt), Mt = I({}, et, { getDisplayName: S, methodName: L, renderCountProp: fe, shouldHandleStateChanges: _e, storeKey: Be, displayName: Dt, wrappedComponentName: dt, WrappedComponent: Le }), jt = et.pure, Et = jt ? c.useMemo : function(lt) {
              return lt();
            };
            function zt(lt) {
              var An = Object(c.useMemo)(function() {
                var kn = lt.reactReduxForwardedRef, so = oe(lt, le);
                return [lt.context, kn, so];
              }, [lt]), Wn = An[0], zr = An[1], xt = An[2], io = Object(c.useMemo)(function() {
                return Wn && Wn.Consumer && Object(A.isContextConsumer)(o.a.createElement(Wn.Consumer, null)) ? Wn : Ye;
              }, [Wn, Ye]), Mn = Object(c.useContext)(io), $t = !!lt.store && !!lt.store.getState && !!lt.store.dispatch;
              Mn && Mn.store;
              var dn = $t ? lt.store : Mn.store, Xn = Object(c.useMemo)(function() {
                return function(kn) {
                  return _(kn.dispatch, Mt);
                }(dn);
              }, [dn]), Gt = Object(c.useMemo)(function() {
                if (!_e) return ce;
                var kn = P(dn, $t ? null : Mn.subscription), so = kn.notifyNestedSubs.bind(kn);
                return [kn, so];
              }, [dn, $t, Mn]), fn = Gt[0], Lr = Gt[1], ii = Object(c.useMemo)(function() {
                return $t ? Mn : I({}, Mn, { subscription: fn });
              }, [$t, Mn, fn]), Ur = Object(c.useReducer)(ye, te, ie), Mo = Ur[0][0], mr = Ur[1];
              if (Mo && Mo.error) throw Mo.error;
              var Ui = Object(c.useRef)(), gr = Object(c.useRef)(xt), jo = Object(c.useRef)(), ai = Object(c.useRef)(!1), Zn = Et(function() {
                return jo.current && xt === gr.current ? jo.current : Xn(dn.getState(), xt);
              }, [dn, Mo, xt]);
              J(de, [gr, Ui, ai, xt, Zn, jo, Lr]), J(D, [_e, dn, fn, Xn, gr, Ui, ai, jo, Lr, mr], [dn, fn, Xn]);
              var ao = Object(c.useMemo)(function() {
                return o.a.createElement(Le, I({}, Zn, { ref: zr }));
              }, [zr, Le, Zn]);
              return Object(c.useMemo)(function() {
                return _e ? o.a.createElement(io.Provider, { value: ii }, ao) : ao;
              }, [io, ao, ii]);
            }
            var ft = jt ? o.a.memo(zt) : zt;
            if (ft.WrappedComponent = Le, ft.displayName = zt.displayName = Dt, Ke) {
              var In = o.a.forwardRef(function(lt, An) {
                return o.a.createElement(ft, I({}, lt, { reactReduxForwardedRef: An }));
              });
              return In.displayName = Dt, In.WrappedComponent = Le, z()(In, Le);
            }
            return z()(ft, Le);
          };
        }
        function Te(_, s) {
          return _ === s ? _ !== 0 || s !== 0 || 1 / _ == 1 / s : _ != _ && s != s;
        }
        function ke(_, s) {
          if (Te(_, s)) return !0;
          if (typeof _ != "object" || _ === null || typeof s != "object" || s === null) return !1;
          var d = Object.keys(_), h = Object.keys(s);
          if (d.length !== h.length) return !1;
          for (var S = 0; S < d.length; S++) if (!Object.prototype.hasOwnProperty.call(s, d[S]) || !Te(_[d[S]], s[d[S]])) return !1;
          return !0;
        }
        function Pe(_) {
          return function(s, d) {
            var h = _(s, d);
            function S() {
              return h;
            }
            return S.dependsOnOwnProps = !1, S;
          };
        }
        function Se(_) {
          return _.dependsOnOwnProps !== null && _.dependsOnOwnProps !== void 0 ? !!_.dependsOnOwnProps : _.length !== 1;
        }
        function ze(_, s) {
          return function(d, h) {
            h.displayName;
            var S = function(O, L) {
              return S.dependsOnOwnProps ? S.mapToProps(O, L) : S.mapToProps(O);
            };
            return S.dependsOnOwnProps = !0, S.mapToProps = function(O, L) {
              S.mapToProps = _, S.dependsOnOwnProps = Se(_);
              var ne = S(O, L);
              return typeof ne == "function" && (S.mapToProps = ne, S.dependsOnOwnProps = Se(ne), ne = S(O, L)), ne;
            }, S;
          };
        }
        var Je = [function(_) {
          return typeof _ == "function" ? ze(_) : void 0;
        }, function(_) {
          return _ ? void 0 : Pe(function(s) {
            return { dispatch: s };
          });
        }, function(_) {
          return _ && typeof _ == "object" ? Pe(function(s) {
            return function(d, h) {
              var S = {}, O = function(ne) {
                var fe = d[ne];
                typeof fe == "function" && (S[ne] = function() {
                  return h(fe.apply(void 0, arguments));
                });
              };
              for (var L in d) O(L);
              return S;
            }(_, s);
          }) : void 0;
        }], X = [function(_) {
          return typeof _ == "function" ? ze(_) : void 0;
        }, function(_) {
          return _ ? void 0 : Pe(function() {
            return {};
          });
        }];
        function Y(_, s, d) {
          return I({}, d, _, s);
        }
        var me = [function(_) {
          return typeof _ == "function" ? /* @__PURE__ */ function(s) {
            return function(d, h) {
              h.displayName;
              var S, O = h.pure, L = h.areMergedPropsEqual, ne = !1;
              return function(fe, pe, _e) {
                var Ne = s(fe, pe, _e);
                return ne ? O && L(Ne, S) || (S = Ne) : (ne = !0, S = Ne), S;
              };
            };
          }(_) : void 0;
        }, function(_) {
          return _ ? void 0 : function() {
            return Y;
          };
        }], l = ["initMapStateToProps", "initMapDispatchToProps", "initMergeProps"];
        function f(_, s, d, h) {
          return function(S, O) {
            return d(_(S, O), s(h, O), O);
          };
        }
        function k(_, s, d, h, S) {
          var O, L, ne, fe, pe, _e = S.areStatesEqual, Ne = S.areOwnPropsEqual, Be = S.areStatePropsEqual, Ie = !1;
          function Ke(Me, Fe) {
            var et, Ye, Le = !Ne(Fe, L), dt = !_e(Me, O);
            return O = Me, L = Fe, Le && dt ? (ne = _(O, L), s.dependsOnOwnProps && (fe = s(h, L)), pe = d(ne, fe, L)) : Le ? (_.dependsOnOwnProps && (ne = _(O, L)), s.dependsOnOwnProps && (fe = s(h, L)), pe = d(ne, fe, L)) : (dt && (et = _(O, L), Ye = !Be(et, ne), ne = et, Ye && (pe = d(ne, fe, L))), pe);
          }
          return function(Me, Fe) {
            return Ie ? Ke(Me, Fe) : (ne = _(O = Me, L = Fe), fe = s(h, L), pe = d(ne, fe, L), Ie = !0, pe);
          };
        }
        function U(_, s) {
          var d = s.initMapStateToProps, h = s.initMapDispatchToProps, S = s.initMergeProps, O = oe(s, l), L = d(_, O), ne = h(_, O), fe = S(_, O);
          return (O.pure ? k : f)(L, ne, fe, _, O);
        }
        var F = ["pure", "areStatesEqual", "areOwnPropsEqual", "areStatePropsEqual", "areMergedPropsEqual"];
        function H(_, s, d) {
          for (var h = s.length - 1; h >= 0; h--) {
            var S = s[h](_);
            if (S) return S;
          }
          return function(O, L) {
            throw new Error("Invalid value of type " + typeof _ + " for " + d + " argument when connecting component " + L.wrappedComponentName + ".");
          };
        }
        function he(_, s) {
          return _ === s;
        }
        function je(_) {
          var s = {}, d = s.connectHOC, h = d === void 0 ? be : d, S = s.mapStateToPropsFactories, O = S === void 0 ? X : S, L = s.mapDispatchToPropsFactories, ne = L === void 0 ? Je : L, fe = s.mergePropsFactories, pe = fe === void 0 ? me : fe, _e = s.selectorFactory, Ne = _e === void 0 ? U : _e;
          return function(Be, Ie, Ke, Me) {
            Me === void 0 && (Me = {});
            var Fe = Me, et = Fe.pure, Ye = et === void 0 || et, Le = Fe.areStatesEqual, dt = Le === void 0 ? he : Le, Dt = Fe.areOwnPropsEqual, Mt = Dt === void 0 ? ke : Dt, jt = Fe.areStatePropsEqual, Et = jt === void 0 ? ke : jt, zt = Fe.areMergedPropsEqual, ft = zt === void 0 ? ke : zt, In = oe(Fe, F), lt = H(Be, O, "mapStateToProps"), An = H(Ie, ne, "mapDispatchToProps"), Wn = H(Ke, pe, "mergeProps");
            return h(Ne, I({ methodName: "connect", getDisplayName: function(zr) {
              return "Connect(" + zr + ")";
            }, shouldHandleStateChanges: !!Be, initMapStateToProps: lt, initMapDispatchToProps: An, initMergeProps: Wn, pure: Ye, areStatesEqual: dt, areOwnPropsEqual: Mt, areStatePropsEqual: Et, areMergedPropsEqual: ft }, In));
          };
        }
        var Re = je(), Xe;
        Xe = E.unstable_batchedUpdates, K = Xe;
        function We(_) {
          return { type: "SET_MODEL_ACTIVE_TAB", tabName: _ };
        }
        function It() {
          return { type: "TOGGLE_IS_COLLAPSED" };
        }
        function wt(_) {
          return { type: "SET_EDITORS", editors: _ };
        }
        function Jt(_) {
          return { type: "SET_CURRENT_EDITOR_NAME", editorName: _ };
        }
        function kt(_) {
          return { type: "SET_ACTIVE_INSPECTOR_TAB", tabName: _ };
        }
        var gt = u(10), cn = u(4);
        class _r {
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
        function Tt(_) {
          return _.editors.get(_.currentEditorName);
        }
        class pt {
          static set(s, d) {
            window.localStorage.setItem("ck5-inspector-" + s, d);
          }
          static get(s) {
            return window.localStorage.getItem("ck5-inspector-" + s);
          }
        }
        function Yn(_, s, d) {
          const h = function(S, O, L) {
            if (S.ui.activeTab !== "Model") return O;
            if (!O) return Sn(S, O);
            switch (L.type) {
              case "SET_MODEL_CURRENT_ROOT_NAME":
                return function(ne, fe, pe) {
                  const _e = pe.currentRootName;
                  return { ...fe, ...or(ne, fe, { currentRootName: _e }), currentNode: null, currentNodeDefinition: null, currentRootName: _e };
                }(S, O, L);
              case "SET_MODEL_CURRENT_NODE":
                return { ...O, currentNode: L.currentNode, currentNodeDefinition: Object(gt.b)(Tt(S), L.currentNode) };
              case "SET_ACTIVE_INSPECTOR_TAB":
              case "UPDATE_MODEL_STATE":
                return { ...O, ...or(S, O) };
              case "SET_EDITORS":
              case "SET_CURRENT_EDITOR_NAME":
                return Sn(S, O);
              default:
                return O;
            }
          }(_, s, d);
          return h && (h.ui = function(S, O) {
            if (!S) return { activeTab: pt.get("active-model-tab-name") || "Inspect", showMarkers: pt.get("model-show-markers") === "true", showCompactText: pt.get("model-compact-text") === "true" };
            switch (O.type) {
              case "SET_MODEL_ACTIVE_TAB":
                return function(L, ne) {
                  return pt.set("active-model-tab-name", ne.tabName), { ...L, activeTab: ne.tabName };
                }(S, O);
              case "TOGGLE_MODEL_SHOW_MARKERS":
                return function(L) {
                  const ne = !L.showMarkers;
                  return pt.set("model-show-markers", ne), { ...L, showMarkers: ne };
                }(S);
              case "TOGGLE_MODEL_SHOW_COMPACT_TEXT":
                return function(L) {
                  const ne = !L.showCompactText;
                  return pt.set("model-compact-text", ne), { ...L, showCompactText: ne };
                }(S);
              default:
                return S;
            }
          }(h.ui, d)), h;
        }
        function Sn(_, s = {}) {
          const d = Tt(_);
          if (!d) return { ui: s.ui };
          const h = Object(gt.d)(d)[0].rootName;
          return { ...s, ...or(_, s, { currentRootName: h }), currentRootName: h, currentNode: null, currentNodeDefinition: null };
        }
        function or(_, s, d) {
          const h = Tt(_), S = { ...s, ...d }, O = S.currentRootName, L = Object(gt.c)(h, O), ne = Object(gt.a)(h, O), fe = Object(gt.e)({ currentEditor: h, currentRootName: S.currentRootName, ranges: L, markers: ne });
          let pe = S.currentNode, _e = S.currentNodeDefinition;
          return pe ? pe.root.rootName !== O || !Object(cn.d)(pe) && !pe.parent ? (pe = null, _e = null) : _e = Object(gt.b)(h, pe) : _e = null, { treeDefinition: fe, currentNode: pe, currentNodeDefinition: _e, ranges: L, markers: ne };
        }
        function Er(_) {
          return { type: "SET_VIEW_ACTIVE_TAB", tabName: _ };
        }
        function _o() {
          return { type: "UPDATE_VIEW_STATE" };
        }
        var en = u(9), Yt = u(2);
        function xr(_, s, d) {
          const h = function(S, O, L) {
            if (S.ui.activeTab !== "View") return O;
            if (!O) return qt(S, O);
            switch (L.type) {
              case "SET_VIEW_CURRENT_ROOT_NAME":
                return function(ne, fe, pe) {
                  const _e = pe.currentRootName;
                  return { ...fe, ...gn(ne, fe, { currentRootName: _e }), currentNode: null, currentNodeDefinition: null, currentRootName: _e };
                }(S, O, L);
              case "SET_VIEW_CURRENT_NODE":
                return { ...O, currentNode: L.currentNode, currentNodeDefinition: Object(en.b)(L.currentNode) };
              case "SET_ACTIVE_INSPECTOR_TAB":
              case "UPDATE_VIEW_STATE":
                return { ...O, ...gn(S, O) };
              case "SET_EDITORS":
              case "SET_CURRENT_EDITOR_NAME":
                return qt(S, O);
              default:
                return O;
            }
          }(_, s, d);
          return h && (h.ui = function(S, O, L) {
            if (!O) return { activeTab: pt.get("active-view-tab-name") || "Inspect", showElementTypes: pt.get("view-element-types") === "true" };
            switch (L.type) {
              case "SET_VIEW_ACTIVE_TAB":
                return function(ne, fe) {
                  return pt.set("active-view-tab-name", fe.tabName), { ...ne, activeTab: fe.tabName };
                }(O, L);
              case "TOGGLE_VIEW_SHOW_ELEMENT_TYPES":
                return function(ne, fe) {
                  const pe = !fe.showElementTypes;
                  return pt.set("view-element-types", pe), { ...fe, showElementTypes: pe };
                }(0, O);
              default:
                return O;
            }
          }(0, h.ui, d)), h;
        }
        function qt(_, s = {}) {
          const d = Tt(_), h = Object(en.d)(d), S = h[0] ? h[0].rootName : null;
          return { ...s, ...gn(_, s, { currentRootName: S }), currentRootName: S, currentNode: null, currentNodeDefinition: null };
        }
        function gn(_, s, d) {
          const h = { ...s, ...d }, S = h.currentRootName, O = Object(en.c)(Tt(_), S), L = Object(en.e)({ currentEditor: Tt(_), currentRootName: S, ranges: O });
          let ne = h.currentNode, fe = h.currentNodeDefinition;
          return ne ? ne.root.rootName !== S || !Object(Yt.g)(ne) && !ne.parent ? (ne = null, fe = null) : fe = Object(en.b)(ne) : fe = null, { treeDefinition: L, currentNode: ne, currentNodeDefinition: fe, ranges: O };
        }
        function Sr() {
          return { type: "UPDATE_COMMANDS_STATE" };
        }
        var ut = u(1);
        function Cr({ editors: _, currentEditorName: s }, d) {
          if (!d) return null;
          const h = _.get(s).commands.get(d);
          return { currentCommandName: d, type: "Command", url: "https://ckeditor.com/docs/ckeditor5/latest/api/module_core_command-Command.html", properties: Object(ut.b)({ isEnabled: { value: h.isEnabled }, value: { value: h.value } }), command: h };
        }
        function bn({ editors: _, currentEditorName: s }) {
          if (!_.get(s)) return [];
          const d = [];
          for (const [h, S] of _.get(s).commands) {
            const O = [];
            S.value !== void 0 && O.push(["value", Object(ut.a)(S.value, !1)]), d.push({ name: h, type: "element", children: [], node: h, attributes: O, presentation: { isEmpty: !0, cssClass: ["ck-inspector-tree-node_tagless", S.isEnabled ? "" : "ck-inspector-tree-node_disabled"].join(" ") } });
          }
          return d.sort((h, S) => h.name > S.name ? 1 : -1);
        }
        function Tr(_, s = {}) {
          return { ...s, currentCommandName: null, currentCommandDefinition: null, treeDefinition: bn(_) };
        }
        function ir(_) {
          return { type: "SET_SCHEMA_CURRENT_DEFINITION_NAME", currentSchemaDefinitionName: _ };
        }
        const ar = ["isBlock", "isInline", "isObject", "isContent", "isLimit", "isSelectable"], Cn = "https://ckeditor.com/docs/ckeditor5/latest/api/";
        function sr({ editors: _, currentEditorName: s }, d) {
          if (!d) return null;
          const h = _.get(s).model.schema, S = h.getDefinitions()[d], O = {}, L = {}, ne = {};
          let fe = {};
          for (const pe of ar) S[pe] && (O[pe] = { value: S[pe] });
          for (const pe of S.allowChildren.sort()) L[pe] = { value: !0, title: "Click to see the definition of " + pe };
          for (const pe of S.allowIn.sort()) ne[pe] = { value: !0, title: "Click to see the definition of " + pe };
          for (const pe of S.allowAttributes.sort()) fe[pe] = { value: !0 };
          fe = Object(ut.b)(fe);
          for (const pe in fe) {
            const _e = h.getAttributeProperties(pe), Ne = {};
            for (const Be in _e) Ne[Be] = { value: _e[Be] };
            fe[pe].subProperties = Object(ut.b)(Ne);
          }
          return { currentSchemaDefinitionName: d, type: "SchemaCompiledItemDefinition", urls: { general: Cn + "module_engine_model_schema-SchemaCompiledItemDefinition.html", allowAttributes: Cn + "module_engine_model_schema-SchemaItemDefinition.html#member-allowAttributes", allowChildren: Cn + "module_engine_model_schema-SchemaItemDefinition.html#member-allowChildren", allowIn: Cn + "module_engine_model_schema-SchemaItemDefinition.html#member-allowIn" }, properties: Object(ut.b)(O), allowChildren: Object(ut.b)(L), allowIn: Object(ut.b)(ne), allowAttributes: fe, definition: S };
        }
        function Tn({ editors: _, currentEditorName: s }) {
          if (!_.get(s)) return [];
          const d = [], h = _.get(s).model.schema.getDefinitions();
          for (const S in h) d.push({ name: S, type: "element", children: [], node: S, attributes: [], presentation: { isEmpty: !0, cssClass: "ck-inspector-tree-node_tagless" } });
          return d.sort((S, O) => S.name > O.name ? 1 : -1);
        }
        function lr(_, s = {}) {
          return { ...s, currentSchemaDefinitionName: null, currentSchemaDefinition: null, treeDefinition: Tn(_) };
        }
        var On = u(8);
        function Gr(_, s) {
          const d = function(h, S) {
            switch (S.type) {
              case "SET_EDITORS":
                return function(O, L) {
                  const ne = { editors: new Map(L.editors) };
                  return L.editors.size ? L.editors.has(O.currentEditorName) || (ne.currentEditorName = Object(On.b)(L.editors)) : ne.currentEditorName = null, { ...O, ...ne };
                }(h, S);
              case "SET_CURRENT_EDITOR_NAME":
                return function(O, L) {
                  return { ...O, currentEditorName: L.editorName };
                }(h, S);
              default:
                return h;
            }
          }(_, s);
          return d.currentEditorGlobals = function(h, S, O) {
            switch (O.type) {
              case "SET_EDITORS":
              case "SET_CURRENT_EDITOR_NAME":
                return { ...Xr(h, {}) };
              case "UPDATE_CURRENT_EDITOR_IS_READ_ONLY":
                return Xr(h, S);
              default:
                return S;
            }
          }(d, d.currentEditorGlobals, s), d.ui = function(h, S) {
            if (!h.activeTab) {
              let O;
              return O = h.isCollapsed !== void 0 ? h.isCollapsed : pt.get("is-collapsed") === "true", { ...h, isCollapsed: O, activeTab: pt.get("active-tab-name") || "Model", height: pt.get("height") || "400px", sidePaneWidth: pt.get("side-pane-width") || "500px" };
            }
            switch (S.type) {
              case "TOGGLE_IS_COLLAPSED":
                return function(O) {
                  const L = !O.isCollapsed;
                  return pt.set("is-collapsed", L), { ...O, isCollapsed: L };
                }(h);
              case "SET_HEIGHT":
                return function(O, L) {
                  return pt.set("height", L.newHeight), { ...O, height: L.newHeight };
                }(h, S);
              case "SET_SIDE_PANE_WIDTH":
                return function(O, L) {
                  return pt.set("side-pane-width", L.newWidth), { ...O, sidePaneWidth: L.newWidth };
                }(h, S);
              case "SET_ACTIVE_INSPECTOR_TAB":
                return function(O, L) {
                  return pt.set("active-tab-name", L.tabName), { ...O, activeTab: L.tabName };
                }(h, S);
              default:
                return h;
            }
          }(d.ui, s), d.model = Yn(d, d.model, s), d.view = xr(d, d.view, s), d.commands = function(h, S, O) {
            if (h.ui.activeTab !== "Commands") return S;
            if (!S) return Tr(h, S);
            switch (O.type) {
              case "SET_COMMANDS_CURRENT_COMMAND_NAME":
                return { ...S, currentCommandDefinition: Cr(h, O.currentCommandName), currentCommandName: O.currentCommandName };
              case "SET_ACTIVE_INSPECTOR_TAB":
              case "UPDATE_COMMANDS_STATE":
                return { ...S, currentCommandDefinition: Cr(h, S.currentCommandName), treeDefinition: bn(h) };
              case "SET_EDITORS":
              case "SET_CURRENT_EDITOR_NAME":
                return Tr(h, S);
              default:
                return S;
            }
          }(d, d.commands, s), d.schema = function(h, S, O) {
            if (h.ui.activeTab !== "Schema") return S;
            if (!S) return lr(h, S);
            switch (O.type) {
              case "SET_SCHEMA_CURRENT_DEFINITION_NAME":
                return { ...S, currentSchemaDefinition: sr(h, O.currentSchemaDefinitionName), currentSchemaDefinitionName: O.currentSchemaDefinitionName };
              case "SET_ACTIVE_INSPECTOR_TAB":
                return { ...S, currentSchemaDefinition: sr(h, S.currentSchemaDefinitionName), treeDefinition: Tn(h) };
              case "SET_EDITORS":
              case "SET_CURRENT_EDITOR_NAME":
                return lr(h, S);
              default:
                return S;
            }
          }(d, d.schema, s), { ..._, ...d };
        }
        function Xr(_, s) {
          const d = Tt(_);
          return { ...s, isReadOnly: !!d && d.isReadOnly };
        }
        var W = u(46), ae = u.n(W), we = /* @__PURE__ */ function() {
          var _ = function(s, d) {
            return (_ = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(h, S) {
              h.__proto__ = S;
            } || function(h, S) {
              for (var O in S) S.hasOwnProperty(O) && (h[O] = S[O]);
            })(s, d);
          };
          return function(s, d) {
            function h() {
              this.constructor = s;
            }
            _(s, d), s.prototype = d === null ? Object.create(d) : (h.prototype = d.prototype, new h());
          };
        }(), Ce = function() {
          return (Ce = Object.assign || function(_) {
            for (var s, d = 1, h = arguments.length; d < h; d++) for (var S in s = arguments[d]) Object.prototype.hasOwnProperty.call(s, S) && (_[S] = s[S]);
            return _;
          }).apply(this, arguments);
        }, it = { top: { width: "100%", height: "10px", top: "-5px", left: "0px", cursor: "row-resize" }, right: { width: "10px", height: "100%", top: "0px", right: "-5px", cursor: "col-resize" }, bottom: { width: "100%", height: "10px", bottom: "-5px", left: "0px", cursor: "row-resize" }, left: { width: "10px", height: "100%", top: "0px", left: "-5px", cursor: "col-resize" }, topRight: { width: "20px", height: "20px", position: "absolute", right: "-10px", top: "-10px", cursor: "ne-resize" }, bottomRight: { width: "20px", height: "20px", position: "absolute", right: "-10px", bottom: "-10px", cursor: "se-resize" }, bottomLeft: { width: "20px", height: "20px", position: "absolute", left: "-10px", bottom: "-10px", cursor: "sw-resize" }, topLeft: { width: "20px", height: "20px", position: "absolute", left: "-10px", top: "-10px", cursor: "nw-resize" } }, qe = function(_) {
          function s() {
            var d = _ !== null && _.apply(this, arguments) || this;
            return d.onMouseDown = function(h) {
              d.props.onResizeStart(h, d.props.direction);
            }, d.onTouchStart = function(h) {
              d.props.onResizeStart(h, d.props.direction);
            }, d;
          }
          return we(s, _), s.prototype.render = function() {
            return c.createElement("div", { className: this.props.className || "", style: Ce(Ce({ position: "absolute", userSelect: "none" }, it[this.props.direction]), this.props.replaceStyles || {}), onMouseDown: this.onMouseDown, onTouchStart: this.onTouchStart }, this.props.children);
          }, s;
        }(c.PureComponent), st = u(14), tt = u.n(st), Ot = /* @__PURE__ */ function() {
          var _ = function(s, d) {
            return (_ = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(h, S) {
              h.__proto__ = S;
            } || function(h, S) {
              for (var O in S) S.hasOwnProperty(O) && (h[O] = S[O]);
            })(s, d);
          };
          return function(s, d) {
            function h() {
              this.constructor = s;
            }
            _(s, d), s.prototype = d === null ? Object.create(d) : (h.prototype = d.prototype, new h());
          };
        }(), nt = function() {
          return (nt = Object.assign || function(_) {
            for (var s, d = 1, h = arguments.length; d < h; d++) for (var S in s = arguments[d]) Object.prototype.hasOwnProperty.call(s, S) && (_[S] = s[S]);
            return _;
          }).apply(this, arguments);
        }, bt = { width: "auto", height: "auto" }, Pt = tt()(function(_, s, d) {
          return Math.max(Math.min(_, d), s);
        }), tn = tt()(function(_, s) {
          return Math.round(_ / s) * s;
        }), ht = tt()(function(_, s) {
          return new RegExp(_, "i").test(s);
        }), Bt = function(_) {
          return !!(_.touches && _.touches.length);
        }, Pn = tt()(function(_, s, d) {
          d === void 0 && (d = 0);
          var h = s.reduce(function(O, L, ne) {
            return Math.abs(L - _) < Math.abs(s[O] - _) ? ne : O;
          }, 0), S = Math.abs(s[h] - _);
          return d === 0 || S < d ? s[h] : _;
        }), ct = tt()(function(_, s) {
          return _.substr(_.length - s.length, s.length) === s;
        }), yn = tt()(function(_) {
          return (_ = _.toString()) === "auto" || ct(_, "px") || ct(_, "%") || ct(_, "vh") || ct(_, "vw") || ct(_, "vmax") || ct(_, "vmin") ? _ : _ + "px";
        }), un = function(_, s, d, h) {
          if (_ && typeof _ == "string") {
            if (ct(_, "px")) return Number(_.replace("px", ""));
            if (ct(_, "%")) return s * (Number(_.replace("%", "")) / 100);
            if (ct(_, "vw")) return d * (Number(_.replace("vw", "")) / 100);
            if (ct(_, "vh")) return h * (Number(_.replace("vh", "")) / 100);
          }
          return _;
        }, Nn = tt()(function(_, s, d, h, S, O, L) {
          return h = un(h, _.width, s, d), S = un(S, _.height, s, d), O = un(O, _.width, s, d), L = un(L, _.height, s, d), { maxWidth: h === void 0 ? void 0 : Number(h), maxHeight: S === void 0 ? void 0 : Number(S), minWidth: O === void 0 ? void 0 : Number(O), minHeight: L === void 0 ? void 0 : Number(L) };
        }), Eo = ["as", "style", "className", "grid", "snap", "bounds", "boundsByDirection", "size", "defaultSize", "minWidth", "minHeight", "maxWidth", "maxHeight", "lockAspectRatio", "lockAspectRatioExtraWidth", "lockAspectRatioExtraHeight", "enable", "handleStyles", "handleClasses", "handleWrapperStyle", "handleWrapperClass", "children", "onResizeStart", "onResize", "onResizeStop", "handleComponent", "scale", "resizeRatio", "snapGap"], xo = function(_) {
          function s(d) {
            var h = _.call(this, d) || this;
            return h.ratio = 1, h.resizable = null, h.parentLeft = 0, h.parentTop = 0, h.resizableLeft = 0, h.resizableRight = 0, h.resizableTop = 0, h.resizableBottom = 0, h.targetLeft = 0, h.targetTop = 0, h.appendBase = function() {
              if (!h.resizable || !h.window) return null;
              var S = h.parentNode;
              if (!S) return null;
              var O = h.window.document.createElement("div");
              return O.style.width = "100%", O.style.height = "100%", O.style.position = "absolute", O.style.transform = "scale(0, 0)", O.style.left = "0", O.style.flex = "0", O.classList ? O.classList.add("__resizable_base__") : O.className += "__resizable_base__", S.appendChild(O), O;
            }, h.removeBase = function(S) {
              var O = h.parentNode;
              O && O.removeChild(S);
            }, h.ref = function(S) {
              S && (h.resizable = S);
            }, h.state = { isResizing: !1, width: (h.propsSize && h.propsSize.width) === void 0 ? "auto" : h.propsSize && h.propsSize.width, height: (h.propsSize && h.propsSize.height) === void 0 ? "auto" : h.propsSize && h.propsSize.height, direction: "right", original: { x: 0, y: 0, width: 0, height: 0 }, backgroundStyle: { height: "100%", width: "100%", backgroundColor: "rgba(0,0,0,0)", cursor: "auto", opacity: 0, position: "fixed", zIndex: 9999, top: "0", left: "0", bottom: "0", right: "0" }, flexBasis: void 0 }, h.onResizeStart = h.onResizeStart.bind(h), h.onMouseMove = h.onMouseMove.bind(h), h.onMouseUp = h.onMouseUp.bind(h), h;
          }
          return Ot(s, _), Object.defineProperty(s.prototype, "parentNode", { get: function() {
            return this.resizable ? this.resizable.parentNode : null;
          }, enumerable: !1, configurable: !0 }), Object.defineProperty(s.prototype, "window", { get: function() {
            return this.resizable && this.resizable.ownerDocument ? this.resizable.ownerDocument.defaultView : null;
          }, enumerable: !1, configurable: !0 }), Object.defineProperty(s.prototype, "propsSize", { get: function() {
            return this.props.size || this.props.defaultSize || bt;
          }, enumerable: !1, configurable: !0 }), Object.defineProperty(s.prototype, "size", { get: function() {
            var d = 0, h = 0;
            if (this.resizable && this.window) {
              var S = this.resizable.offsetWidth, O = this.resizable.offsetHeight, L = this.resizable.style.position;
              L !== "relative" && (this.resizable.style.position = "relative"), d = this.resizable.style.width !== "auto" ? this.resizable.offsetWidth : S, h = this.resizable.style.height !== "auto" ? this.resizable.offsetHeight : O, this.resizable.style.position = L;
            }
            return { width: d, height: h };
          }, enumerable: !1, configurable: !0 }), Object.defineProperty(s.prototype, "sizeStyle", { get: function() {
            var d = this, h = this.props.size, S = function(O) {
              if (d.state[O] === void 0 || d.state[O] === "auto") return "auto";
              if (d.propsSize && d.propsSize[O] && ct(d.propsSize[O].toString(), "%")) {
                if (ct(d.state[O].toString(), "%")) return d.state[O].toString();
                var L = d.getParentSize();
                return Number(d.state[O].toString().replace("px", "")) / L[O] * 100 + "%";
              }
              return yn(d.state[O]);
            };
            return { width: h && h.width !== void 0 && !this.state.isResizing ? yn(h.width) : S("width"), height: h && h.height !== void 0 && !this.state.isResizing ? yn(h.height) : S("height") };
          }, enumerable: !1, configurable: !0 }), s.prototype.getParentSize = function() {
            if (!this.parentNode) return this.window ? { width: this.window.innerWidth, height: this.window.innerHeight } : { width: 0, height: 0 };
            var d = this.appendBase();
            if (!d) return { width: 0, height: 0 };
            var h = !1, S = this.parentNode.style.flexWrap;
            S !== "wrap" && (h = !0, this.parentNode.style.flexWrap = "wrap"), d.style.position = "relative", d.style.minWidth = "100%";
            var O = { width: d.offsetWidth, height: d.offsetHeight };
            return h && (this.parentNode.style.flexWrap = S), this.removeBase(d), O;
          }, s.prototype.bindEvents = function() {
            this.window && (this.window.addEventListener("mouseup", this.onMouseUp), this.window.addEventListener("mousemove", this.onMouseMove), this.window.addEventListener("mouseleave", this.onMouseUp), this.window.addEventListener("touchmove", this.onMouseMove, { capture: !0, passive: !1 }), this.window.addEventListener("touchend", this.onMouseUp));
          }, s.prototype.unbindEvents = function() {
            this.window && (this.window.removeEventListener("mouseup", this.onMouseUp), this.window.removeEventListener("mousemove", this.onMouseMove), this.window.removeEventListener("mouseleave", this.onMouseUp), this.window.removeEventListener("touchmove", this.onMouseMove, !0), this.window.removeEventListener("touchend", this.onMouseUp));
          }, s.prototype.componentDidMount = function() {
            if (this.resizable && this.window) {
              var d = this.window.getComputedStyle(this.resizable);
              this.setState({ width: this.state.width || this.size.width, height: this.state.height || this.size.height, flexBasis: d.flexBasis !== "auto" ? d.flexBasis : void 0 });
            }
          }, s.prototype.componentWillUnmount = function() {
            this.window && this.unbindEvents();
          }, s.prototype.createSizeForCssProperty = function(d, h) {
            var S = this.propsSize && this.propsSize[h];
            return this.state[h] !== "auto" || this.state.original[h] !== d || S !== void 0 && S !== "auto" ? d : "auto";
          }, s.prototype.calculateNewMaxFromBoundary = function(d, h) {
            var S, O, L = this.props.boundsByDirection, ne = this.state.direction, fe = L && ht("left", ne), pe = L && ht("top", ne);
            if (this.props.bounds === "parent") {
              var _e = this.parentNode;
              _e && (S = fe ? this.resizableRight - this.parentLeft : _e.offsetWidth + (this.parentLeft - this.resizableLeft), O = pe ? this.resizableBottom - this.parentTop : _e.offsetHeight + (this.parentTop - this.resizableTop));
            } else this.props.bounds === "window" ? this.window && (S = fe ? this.resizableRight : this.window.innerWidth - this.resizableLeft, O = pe ? this.resizableBottom : this.window.innerHeight - this.resizableTop) : this.props.bounds && (S = fe ? this.resizableRight - this.targetLeft : this.props.bounds.offsetWidth + (this.targetLeft - this.resizableLeft), O = pe ? this.resizableBottom - this.targetTop : this.props.bounds.offsetHeight + (this.targetTop - this.resizableTop));
            return S && Number.isFinite(S) && (d = d && d < S ? d : S), O && Number.isFinite(O) && (h = h && h < O ? h : O), { maxWidth: d, maxHeight: h };
          }, s.prototype.calculateNewSizeFromDirection = function(d, h) {
            var S = this.props.scale || 1, O = this.props.resizeRatio || 1, L = this.state, ne = L.direction, fe = L.original, pe = this.props, _e = pe.lockAspectRatio, Ne = pe.lockAspectRatioExtraHeight, Be = pe.lockAspectRatioExtraWidth, Ie = fe.width, Ke = fe.height, Me = Ne || 0, Fe = Be || 0;
            return ht("right", ne) && (Ie = fe.width + (d - fe.x) * O / S, _e && (Ke = (Ie - Fe) / this.ratio + Me)), ht("left", ne) && (Ie = fe.width - (d - fe.x) * O / S, _e && (Ke = (Ie - Fe) / this.ratio + Me)), ht("bottom", ne) && (Ke = fe.height + (h - fe.y) * O / S, _e && (Ie = (Ke - Me) * this.ratio + Fe)), ht("top", ne) && (Ke = fe.height - (h - fe.y) * O / S, _e && (Ie = (Ke - Me) * this.ratio + Fe)), { newWidth: Ie, newHeight: Ke };
          }, s.prototype.calculateNewSizeFromAspectRatio = function(d, h, S, O) {
            var L = this.props, ne = L.lockAspectRatio, fe = L.lockAspectRatioExtraHeight, pe = L.lockAspectRatioExtraWidth, _e = O.width === void 0 ? 10 : O.width, Ne = S.width === void 0 || S.width < 0 ? d : S.width, Be = O.height === void 0 ? 10 : O.height, Ie = S.height === void 0 || S.height < 0 ? h : S.height, Ke = fe || 0, Me = pe || 0;
            if (ne) {
              var Fe = (Be - Ke) * this.ratio + Me, et = (Ie - Ke) * this.ratio + Me, Ye = (_e - Me) / this.ratio + Ke, Le = (Ne - Me) / this.ratio + Ke, dt = Math.max(_e, Fe), Dt = Math.min(Ne, et), Mt = Math.max(Be, Ye), jt = Math.min(Ie, Le);
              d = Pt(d, dt, Dt), h = Pt(h, Mt, jt);
            } else d = Pt(d, _e, Ne), h = Pt(h, Be, Ie);
            return { newWidth: d, newHeight: h };
          }, s.prototype.setBoundingClientRect = function() {
            if (this.props.bounds === "parent") {
              var d = this.parentNode;
              if (d) {
                var h = d.getBoundingClientRect();
                this.parentLeft = h.left, this.parentTop = h.top;
              }
            }
            if (this.props.bounds && typeof this.props.bounds != "string") {
              var S = this.props.bounds.getBoundingClientRect();
              this.targetLeft = S.left, this.targetTop = S.top;
            }
            if (this.resizable) {
              var O = this.resizable.getBoundingClientRect(), L = O.left, ne = O.top, fe = O.right, pe = O.bottom;
              this.resizableLeft = L, this.resizableRight = fe, this.resizableTop = ne, this.resizableBottom = pe;
            }
          }, s.prototype.onResizeStart = function(d, h) {
            if (this.resizable && this.window) {
              var S, O = 0, L = 0;
              if (d.nativeEvent && function(Ne) {
                return !!((Ne.clientX || Ne.clientX === 0) && (Ne.clientY || Ne.clientY === 0));
              }(d.nativeEvent)) {
                if (O = d.nativeEvent.clientX, L = d.nativeEvent.clientY, d.nativeEvent.which === 3) return;
              } else d.nativeEvent && Bt(d.nativeEvent) && (O = d.nativeEvent.touches[0].clientX, L = d.nativeEvent.touches[0].clientY);
              if (this.props.onResizeStart && this.resizable && this.props.onResizeStart(d, h, this.resizable) === !1) return;
              this.props.size && (this.props.size.height !== void 0 && this.props.size.height !== this.state.height && this.setState({ height: this.props.size.height }), this.props.size.width !== void 0 && this.props.size.width !== this.state.width && this.setState({ width: this.props.size.width })), this.ratio = typeof this.props.lockAspectRatio == "number" ? this.props.lockAspectRatio : this.size.width / this.size.height;
              var ne = this.window.getComputedStyle(this.resizable);
              if (ne.flexBasis !== "auto") {
                var fe = this.parentNode;
                if (fe) {
                  var pe = this.window.getComputedStyle(fe).flexDirection;
                  this.flexDir = pe.startsWith("row") ? "row" : "column", S = ne.flexBasis;
                }
              }
              this.setBoundingClientRect(), this.bindEvents();
              var _e = { original: { x: O, y: L, width: this.size.width, height: this.size.height }, isResizing: !0, backgroundStyle: nt(nt({}, this.state.backgroundStyle), { cursor: this.window.getComputedStyle(d.target).cursor || "auto" }), direction: h, flexBasis: S };
              this.setState(_e);
            }
          }, s.prototype.onMouseMove = function(d) {
            if (this.state.isResizing && this.resizable && this.window) {
              if (this.window.TouchEvent && Bt(d)) try {
                d.preventDefault(), d.stopPropagation();
              } catch {
              }
              var h = this.props, S = h.maxWidth, O = h.maxHeight, L = h.minWidth, ne = h.minHeight, fe = Bt(d) ? d.touches[0].clientX : d.clientX, pe = Bt(d) ? d.touches[0].clientY : d.clientY, _e = this.state, Ne = _e.direction, Be = _e.original, Ie = _e.width, Ke = _e.height, Me = this.getParentSize(), Fe = Nn(Me, this.window.innerWidth, this.window.innerHeight, S, O, L, ne);
              S = Fe.maxWidth, O = Fe.maxHeight, L = Fe.minWidth, ne = Fe.minHeight;
              var et = this.calculateNewSizeFromDirection(fe, pe), Ye = et.newHeight, Le = et.newWidth, dt = this.calculateNewMaxFromBoundary(S, O), Dt = this.calculateNewSizeFromAspectRatio(Le, Ye, { width: dt.maxWidth, height: dt.maxHeight }, { width: L, height: ne });
              if (Le = Dt.newWidth, Ye = Dt.newHeight, this.props.grid) {
                var Mt = tn(Le, this.props.grid[0]), jt = tn(Ye, this.props.grid[1]), Et = this.props.snapGap || 0;
                Le = Et === 0 || Math.abs(Mt - Le) <= Et ? Mt : Le, Ye = Et === 0 || Math.abs(jt - Ye) <= Et ? jt : Ye;
              }
              this.props.snap && this.props.snap.x && (Le = Pn(Le, this.props.snap.x, this.props.snapGap)), this.props.snap && this.props.snap.y && (Ye = Pn(Ye, this.props.snap.y, this.props.snapGap));
              var zt = { width: Le - Be.width, height: Ye - Be.height };
              Ie && typeof Ie == "string" && (ct(Ie, "%") ? Le = Le / Me.width * 100 + "%" : ct(Ie, "vw") ? Le = Le / this.window.innerWidth * 100 + "vw" : ct(Ie, "vh") && (Le = Le / this.window.innerHeight * 100 + "vh")), Ke && typeof Ke == "string" && (ct(Ke, "%") ? Ye = Ye / Me.height * 100 + "%" : ct(Ke, "vw") ? Ye = Ye / this.window.innerWidth * 100 + "vw" : ct(Ke, "vh") && (Ye = Ye / this.window.innerHeight * 100 + "vh"));
              var ft = { width: this.createSizeForCssProperty(Le, "width"), height: this.createSizeForCssProperty(Ye, "height") };
              this.flexDir === "row" ? ft.flexBasis = ft.width : this.flexDir === "column" && (ft.flexBasis = ft.height), this.setState(ft), this.props.onResize && this.props.onResize(d, Ne, this.resizable, zt);
            }
          }, s.prototype.onMouseUp = function(d) {
            var h = this.state, S = h.isResizing, O = h.direction, L = h.original;
            if (S && this.resizable) {
              var ne = { width: this.size.width - L.width, height: this.size.height - L.height };
              this.props.onResizeStop && this.props.onResizeStop(d, O, this.resizable, ne), this.props.size && this.setState(this.props.size), this.unbindEvents(), this.setState({ isResizing: !1, backgroundStyle: nt(nt({}, this.state.backgroundStyle), { cursor: "auto" }) });
            }
          }, s.prototype.updateSize = function(d) {
            this.setState({ width: d.width, height: d.height });
          }, s.prototype.renderResizer = function() {
            var d = this, h = this.props, S = h.enable, O = h.handleStyles, L = h.handleClasses, ne = h.handleWrapperStyle, fe = h.handleWrapperClass, pe = h.handleComponent;
            if (!S) return null;
            var _e = Object.keys(S).map(function(Ne) {
              return S[Ne] !== !1 ? c.createElement(qe, { key: Ne, direction: Ne, onResizeStart: d.onResizeStart, replaceStyles: O && O[Ne], className: L && L[Ne] }, pe && pe[Ne] ? pe[Ne] : null) : null;
            });
            return c.createElement("div", { className: fe, style: ne }, _e);
          }, s.prototype.render = function() {
            var d = this, h = Object.keys(this.props).reduce(function(L, ne) {
              return Eo.indexOf(ne) !== -1 || (L[ne] = d.props[ne]), L;
            }, {}), S = nt(nt(nt({ position: "relative", userSelect: this.state.isResizing ? "none" : "auto" }, this.props.style), this.sizeStyle), { maxWidth: this.props.maxWidth, maxHeight: this.props.maxHeight, minWidth: this.props.minWidth, minHeight: this.props.minHeight, boxSizing: "border-box", flexShrink: 0 });
            this.state.flexBasis && (S.flexBasis = this.state.flexBasis);
            var O = this.props.as || "div";
            return c.createElement(O, nt({ ref: this.ref, style: S, className: this.props.className }, h), this.state.isResizing && c.createElement("div", { style: this.state.backgroundStyle }), this.props.children, this.renderResizer());
          }, s.defaultProps = { as: "div", onResizeStart: function() {
          }, onResize: function() {
          }, onResizeStop: function() {
          }, enable: { top: !0, right: !0, bottom: !0, left: !0, topRight: !0, bottomRight: !0, bottomLeft: !0, topLeft: !0 }, style: {}, grid: [1, 1], lockAspectRatio: !1, lockAspectRatioExtraWidth: 0, lockAspectRatioExtraHeight: 0, scale: 1, resizeRatio: 1, snapGap: 0 }, s;
        }(c.PureComponent), rt = function(_, s) {
          return (rt = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d, h) {
            d.__proto__ = h;
          } || function(d, h) {
            for (var S in h) h.hasOwnProperty(S) && (d[S] = h[S]);
          })(_, s);
        }, Ue = function() {
          return (Ue = Object.assign || function(_) {
            for (var s, d = 1, h = arguments.length; d < h; d++) for (var S in s = arguments[d]) Object.prototype.hasOwnProperty.call(s, S) && (_[S] = s[S]);
            return _;
          }).apply(this, arguments);
        }, qn = ae.a, Kt = { width: "auto", height: "auto", display: "inline-block", position: "absolute", top: 0, left: 0 }, Or = function(_) {
          function s(d) {
            var h = _.call(this, d) || this;
            return h.resizing = !1, h.resizingPosition = { x: 0, y: 0 }, h.offsetFromParent = { left: 0, top: 0 }, h.resizableElement = { current: null }, h.refDraggable = function(S) {
              S && (h.draggable = S);
            }, h.refResizable = function(S) {
              S && (h.resizable = S, h.resizableElement.current = S.resizable);
            }, h.state = { original: { x: 0, y: 0 }, bounds: { top: 0, right: 0, bottom: 0, left: 0 }, maxWidth: d.maxWidth, maxHeight: d.maxHeight }, h.onResizeStart = h.onResizeStart.bind(h), h.onResize = h.onResize.bind(h), h.onResizeStop = h.onResizeStop.bind(h), h.onDragStart = h.onDragStart.bind(h), h.onDrag = h.onDrag.bind(h), h.onDragStop = h.onDragStop.bind(h), h.getMaxSizesFromProps = h.getMaxSizesFromProps.bind(h), h;
          }
          return function(d, h) {
            function S() {
              this.constructor = d;
            }
            rt(d, h), d.prototype = h === null ? Object.create(h) : (S.prototype = h.prototype, new S());
          }(s, _), s.prototype.componentDidMount = function() {
            this.updateOffsetFromParent();
            var d = this.offsetFromParent, h = d.left, S = d.top, O = this.getDraggablePosition(), L = O.x, ne = O.y;
            this.draggable.setState({ x: L - h, y: ne - S }), this.forceUpdate();
          }, s.prototype.getDraggablePosition = function() {
            var d = this.draggable.state;
            return { x: d.x, y: d.y };
          }, s.prototype.getParent = function() {
            return this.resizable && this.resizable.parentNode;
          }, s.prototype.getParentSize = function() {
            return this.resizable.getParentSize();
          }, s.prototype.getMaxSizesFromProps = function() {
            return { maxWidth: this.props.maxWidth === void 0 ? Number.MAX_SAFE_INTEGER : this.props.maxWidth, maxHeight: this.props.maxHeight === void 0 ? Number.MAX_SAFE_INTEGER : this.props.maxHeight };
          }, s.prototype.getSelfElement = function() {
            return this.resizable && this.resizable.resizable;
          }, s.prototype.getOffsetHeight = function(d) {
            var h = this.props.scale;
            switch (this.props.bounds) {
              case "window":
                return window.innerHeight / h;
              case "body":
                return document.body.offsetHeight / h;
              default:
                return d.offsetHeight;
            }
          }, s.prototype.getOffsetWidth = function(d) {
            var h = this.props.scale;
            switch (this.props.bounds) {
              case "window":
                return window.innerWidth / h;
              case "body":
                return document.body.offsetWidth / h;
              default:
                return d.offsetWidth;
            }
          }, s.prototype.onDragStart = function(d, h) {
            if (this.props.onDragStart && this.props.onDragStart(d, h), this.props.bounds) {
              var S, O = this.getParent(), L = this.props.scale;
              if (this.props.bounds === "parent") S = O;
              else {
                if (this.props.bounds === "body") {
                  var ne = O.getBoundingClientRect(), fe = ne.left, pe = ne.top, _e = document.body.getBoundingClientRect(), Ne = -(fe - O.offsetLeft * L - _e.left) / L, Be = -(pe - O.offsetTop * L - _e.top) / L, Ie = (document.body.offsetWidth - this.resizable.size.width * L) / L + Ne, Ke = (document.body.offsetHeight - this.resizable.size.height * L) / L + Be;
                  return this.setState({ bounds: { top: Be, right: Ie, bottom: Ke, left: Ne } });
                }
                if (this.props.bounds === "window") {
                  if (!this.resizable) return;
                  var Me = O.getBoundingClientRect(), Fe = Me.left, et = Me.top, Ye = -(Fe - O.offsetLeft * L) / L, Le = -(et - O.offsetTop * L) / L;
                  return Ie = (window.innerWidth - this.resizable.size.width * L) / L + Ye, Ke = (window.innerHeight - this.resizable.size.height * L) / L + Le, this.setState({ bounds: { top: Le, right: Ie, bottom: Ke, left: Ye } });
                }
                S = document.querySelector(this.props.bounds);
              }
              if (S instanceof HTMLElement && O instanceof HTMLElement) {
                var dt = S.getBoundingClientRect(), Dt = dt.left, Mt = dt.top, jt = O.getBoundingClientRect(), Et = (Dt - jt.left) / L, zt = Mt - jt.top;
                if (this.resizable) {
                  this.updateOffsetFromParent();
                  var ft = this.offsetFromParent;
                  this.setState({ bounds: { top: zt - ft.top, right: Et + (S.offsetWidth - this.resizable.size.width) - ft.left / L, bottom: zt + (S.offsetHeight - this.resizable.size.height) - ft.top, left: Et - ft.left / L } });
                }
              }
            }
          }, s.prototype.onDrag = function(d, h) {
            if (this.props.onDrag) {
              var S = this.offsetFromParent;
              return this.props.onDrag(d, Ue(Ue({}, h), { x: h.x - S.left, y: h.y - S.top }));
            }
          }, s.prototype.onDragStop = function(d, h) {
            if (this.props.onDragStop) {
              var S = this.offsetFromParent, O = S.left, L = S.top;
              return this.props.onDragStop(d, Ue(Ue({}, h), { x: h.x + O, y: h.y + L }));
            }
          }, s.prototype.onResizeStart = function(d, h, S) {
            d.stopPropagation(), this.resizing = !0;
            var O = this.props.scale, L = this.offsetFromParent, ne = this.getDraggablePosition();
            if (this.resizingPosition = { x: ne.x + L.left, y: ne.y + L.top }, this.setState({ original: ne }), this.props.bounds) {
              var fe = this.getParent(), pe = void 0;
              pe = this.props.bounds === "parent" ? fe : this.props.bounds === "body" ? document.body : this.props.bounds === "window" ? window : document.querySelector(this.props.bounds);
              var _e = this.getSelfElement();
              if (_e instanceof Element && (pe instanceof HTMLElement || pe === window) && fe instanceof HTMLElement) {
                var Ne = this.getMaxSizesFromProps(), Be = Ne.maxWidth, Ie = Ne.maxHeight, Ke = this.getParentSize();
                if (Be && typeof Be == "string") if (Be.endsWith("%")) {
                  var Me = Number(Be.replace("%", "")) / 100;
                  Be = Ke.width * Me;
                } else Be.endsWith("px") && (Be = Number(Be.replace("px", "")));
                Ie && typeof Ie == "string" && (Ie.endsWith("%") ? (Me = Number(Ie.replace("%", "")) / 100, Ie = Ke.width * Me) : Ie.endsWith("px") && (Ie = Number(Ie.replace("px", ""))));
                var Fe = _e.getBoundingClientRect(), et = Fe.left, Ye = Fe.top, Le = this.props.bounds === "window" ? { left: 0, top: 0 } : pe.getBoundingClientRect(), dt = Le.left, Dt = Le.top, Mt = this.getOffsetWidth(pe), jt = this.getOffsetHeight(pe), Et = h.toLowerCase().endsWith("left"), zt = h.toLowerCase().endsWith("right"), ft = h.startsWith("top"), In = h.startsWith("bottom");
                if (Et && this.resizable) {
                  var lt = (et - dt) / O + this.resizable.size.width;
                  this.setState({ maxWidth: lt > Number(Be) ? Be : lt });
                }
                (zt || this.props.lockAspectRatio && !Et) && (lt = Mt + (dt - et) / O, this.setState({ maxWidth: lt > Number(Be) ? Be : lt })), ft && this.resizable && (lt = (Ye - Dt) / O + this.resizable.size.height, this.setState({ maxHeight: lt > Number(Ie) ? Ie : lt })), (In || this.props.lockAspectRatio && !ft) && (lt = jt + (Dt - Ye) / O, this.setState({ maxHeight: lt > Number(Ie) ? Ie : lt }));
              }
            } else this.setState({ maxWidth: this.props.maxWidth, maxHeight: this.props.maxHeight });
            this.props.onResizeStart && this.props.onResizeStart(d, h, S);
          }, s.prototype.onResize = function(d, h, S, O) {
            var L = { x: this.state.original.x, y: this.state.original.y }, ne = -O.width, fe = -O.height;
            ["top", "left", "topLeft", "bottomLeft", "topRight"].indexOf(h) !== -1 && (h === "bottomLeft" ? L.x += ne : (h === "topRight" || (L.x += ne), L.y += fe)), L.x === this.draggable.state.x && L.y === this.draggable.state.y || this.draggable.setState(L), this.updateOffsetFromParent();
            var pe = this.offsetFromParent, _e = this.getDraggablePosition().x + pe.left, Ne = this.getDraggablePosition().y + pe.top;
            this.resizingPosition = { x: _e, y: Ne }, this.props.onResize && this.props.onResize(d, h, S, O, { x: _e, y: Ne });
          }, s.prototype.onResizeStop = function(d, h, S, O) {
            this.resizing = !1;
            var L = this.getMaxSizesFromProps(), ne = L.maxWidth, fe = L.maxHeight;
            this.setState({ maxWidth: ne, maxHeight: fe }), this.props.onResizeStop && this.props.onResizeStop(d, h, S, O, this.resizingPosition);
          }, s.prototype.updateSize = function(d) {
            this.resizable && this.resizable.updateSize({ width: d.width, height: d.height });
          }, s.prototype.updatePosition = function(d) {
            this.draggable.setState(d);
          }, s.prototype.updateOffsetFromParent = function() {
            var d = this.props.scale, h = this.getParent(), S = this.getSelfElement();
            if (!h || S === null) return { top: 0, left: 0 };
            var O = h.getBoundingClientRect(), L = O.left, ne = O.top, fe = S.getBoundingClientRect(), pe = this.getDraggablePosition();
            this.offsetFromParent = { left: fe.left - L - pe.x * d, top: fe.top - ne - pe.y * d };
          }, s.prototype.render = function() {
            var d = this.props, h = d.disableDragging, S = d.style, O = d.dragHandleClassName, L = d.position, ne = d.onMouseDown, fe = d.onMouseUp, pe = d.dragAxis, _e = d.dragGrid, Ne = d.bounds, Be = d.enableUserSelectHack, Ie = d.cancel, Ke = d.children, Me = (d.onResizeStart, d.onResize, d.onResizeStop, d.onDragStart, d.onDrag, d.onDragStop, d.resizeHandleStyles), Fe = d.resizeHandleClasses, et = d.resizeHandleComponent, Ye = d.enableResizing, Le = d.resizeGrid, dt = d.resizeHandleWrapperClass, Dt = d.resizeHandleWrapperStyle, Mt = d.scale, jt = d.allowAnyClick, Et = function($t, dn) {
              var Xn = {};
              for (var Gt in $t) Object.prototype.hasOwnProperty.call($t, Gt) && dn.indexOf(Gt) < 0 && (Xn[Gt] = $t[Gt]);
              if ($t != null && typeof Object.getOwnPropertySymbols == "function") {
                var fn = 0;
                for (Gt = Object.getOwnPropertySymbols($t); fn < Gt.length; fn++) dn.indexOf(Gt[fn]) < 0 && Object.prototype.propertyIsEnumerable.call($t, Gt[fn]) && (Xn[Gt[fn]] = $t[Gt[fn]]);
              }
              return Xn;
            }(d, ["disableDragging", "style", "dragHandleClassName", "position", "onMouseDown", "onMouseUp", "dragAxis", "dragGrid", "bounds", "enableUserSelectHack", "cancel", "children", "onResizeStart", "onResize", "onResizeStop", "onDragStart", "onDrag", "onDragStop", "resizeHandleStyles", "resizeHandleClasses", "resizeHandleComponent", "enableResizing", "resizeGrid", "resizeHandleWrapperClass", "resizeHandleWrapperStyle", "scale", "allowAnyClick"]), zt = this.props.default ? Ue({}, this.props.default) : void 0;
            delete Et.default;
            var ft, In = h || O ? { cursor: "auto" } : { cursor: "move" }, lt = Ue(Ue(Ue({}, Kt), In), S), An = this.offsetFromParent, Wn = An.left, zr = An.top;
            L && (ft = { x: L.x - Wn, y: L.y - zr });
            var xt, io = this.resizing ? void 0 : ft, Mn = this.resizing ? "both" : pe;
            return Object(c.createElement)(qn, { ref: this.refDraggable, handle: O ? "." + O : void 0, defaultPosition: zt, onMouseDown: ne, onMouseUp: fe, onStart: this.onDragStart, onDrag: this.onDrag, onStop: this.onDragStop, axis: Mn, disabled: h, grid: _e, bounds: Ne ? this.state.bounds : void 0, position: io, enableUserSelectHack: Be, cancel: Ie, scale: Mt, allowAnyClick: jt, nodeRef: this.resizableElement }, Object(c.createElement)(xo, Ue({}, Et, { ref: this.refResizable, defaultSize: zt, size: this.props.size, enable: typeof Ye == "boolean" ? (xt = Ye, { bottom: xt, bottomLeft: xt, bottomRight: xt, left: xt, right: xt, top: xt, topLeft: xt, topRight: xt }) : Ye, onResizeStart: this.onResizeStart, onResize: this.onResize, onResizeStop: this.onResizeStop, style: lt, minWidth: this.props.minWidth, minHeight: this.props.minHeight, maxWidth: this.resizing ? this.state.maxWidth : this.props.maxWidth, maxHeight: this.resizing ? this.state.maxHeight : this.props.maxHeight, grid: Le, handleWrapperClass: dt, handleWrapperStyle: Dt, lockAspectRatio: this.props.lockAspectRatio, lockAspectRatioExtraWidth: this.props.lockAspectRatioExtraWidth, lockAspectRatioExtraHeight: this.props.lockAspectRatioExtraHeight, handleStyles: Me, handleClasses: Fe, handleComponent: et, scale: this.props.scale }), Ke));
          }, s.defaultProps = { maxWidth: Number.MAX_SAFE_INTEGER, maxHeight: Number.MAX_SAFE_INTEGER, scale: 1, onResizeStart: function() {
          }, onResize: function() {
          }, onResizeStop: function() {
          }, onDragStart: function() {
          }, onDrag: function() {
          }, onDragStop: function() {
          } }, s;
        }(c.PureComponent);
        u(58);
        class At extends c.Component {
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
        class Ht extends c.Component {
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
            return o.a.createElement(Ht, null, [this.props.contentBefore, o.a.createElement(At, { key: "navigation", definitions: s.map((d) => d.props.label), activeTab: this.props.activeTab, onClick: this.handleTabClick }), this.props.contentAfter], s.filter((d) => d.props.label === this.props.activeTab));
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
            const s = ["ck-inspector-button", this.props.className || "", this.props.isOn ? "ck-inspector-button_on" : "", this.props.isEnabled === !1 ? "ck-inspector-button_disabled" : ""].filter((d) => d).join(" ");
            return o.a.createElement("button", { className: s, type: "button", onClick: this.props.isEnabled === !1 ? () => {
            } : this.props.onClick, title: this.props.title || this.props.text }, o.a.createElement("span", null, this.props.text), this.props.icon);
          }
        }
        u(64);
        class _t extends c.Component {
          render() {
            return o.a.createElement("div", { className: ["ck-inspector-pane", this.props.splitVertically ? "ck-inspector-pane_vsplit" : "", this.props.isEmpty ? "ck-inspector-pane_empty" : ""].join(" ") }, this.props.children);
          }
        }
        u(66);
        const ur = { position: "relative" };
        class dr extends c.Component {
          get maxSidePaneWidth() {
            return Math.min(window.innerWidth - 400, 0.8 * window.innerWidth);
          }
          render() {
            return o.a.createElement("div", { className: "ck-inspector-side-pane" }, o.a.createElement(Or, { enableResizing: { left: !0 }, disableDragging: !0, minWidth: 200, maxWidth: this.maxSidePaneWidth, style: ur, position: { x: "100%", y: "100%" }, size: { width: this.props.sidePaneWidth, height: "100%" }, onResizeStop: (s, d, h) => this.props.setSidePaneWidth(h.style.width) }, this.props.children));
          }
        }
        var vn = Re(({ ui: { sidePaneWidth: _ } }) => ({ sidePaneWidth: _ }), { setSidePaneWidth: function(_) {
          return { type: "SET_SIDE_PANE_WIDTH", newWidth: _ };
        } })(dr), Ut = u(11);
        u(68);
        class Wt extends c.PureComponent {
          render() {
            return [o.a.createElement("input", { type: "checkbox", className: "ck-inspector-checkbox", id: this.props.id, key: "input", checked: this.props.isChecked, onChange: this.props.onChange }), o.a.createElement("label", { htmlFor: this.props.id, key: "label" }, this.props.label)];
          }
        }
        class on extends c.Component {
          constructor(s) {
            super(s), this.handleTreeClick = this.handleTreeClick.bind(this), this.handleRootChange = this.handleRootChange.bind(this);
          }
          handleTreeClick(s, d) {
            s.persist(), s.stopPropagation(), this.props.setModelCurrentNode(d), s.detail === 2 && this.props.setModelActiveTab("Inspect");
          }
          handleRootChange(s) {
            this.props.setModelCurrentRootName(s.target.value);
          }
          render() {
            const s = this.props.editors.get(this.props.currentEditorName);
            return o.a.createElement(Ht, null, [o.a.createElement("div", { className: "ck-inspector-tree__config", key: "root-cfg" }, o.a.createElement(rn, { id: "view-root-select", label: "Root", value: this.props.currentRootName, options: Object(gt.d)(s).map((d) => d.rootName), onChange: this.handleRootChange })), o.a.createElement("span", { className: "ck-inspector-separator", key: "separator" }), o.a.createElement("div", { className: "ck-inspector-tree__config", key: "text-cfg" }, o.a.createElement(Wt, { label: "Compact text", id: "model-compact-text", isChecked: this.props.showCompactText, onChange: this.props.toggleModelShowCompactText }), o.a.createElement(Wt, { label: "Show markers", id: "model-show-markers", isChecked: this.props.showMarkers, onChange: this.props.toggleModelShowMarkers }))], o.a.createElement(Ut.a, { className: [this.props.showMarkers ? "" : "ck-inspector-model-tree__hide-markers"], definition: this.props.treeDefinition, textDirection: s.locale.contentLanguageDirection, onClick: this.handleTreeClick, showCompactText: this.props.showCompactText, activeNode: this.props.currentNode }));
          }
        }
        var Kn = Re(({ editors: _, currentEditorName: s, model: { treeDefinition: d, currentRootName: h, currentNode: S, ui: { showMarkers: O, showCompactText: L } } }) => ({ treeDefinition: d, editors: _, currentEditorName: s, currentRootName: h, currentNode: S, showMarkers: O, showCompactText: L }), { toggleModelShowCompactText: function() {
          return { type: "TOGGLE_MODEL_SHOW_COMPACT_TEXT" };
        }, setModelCurrentRootName: function(_) {
          return { type: "SET_MODEL_CURRENT_ROOT_NAME", currentRootName: _ };
        }, toggleModelShowMarkers: function() {
          return { type: "TOGGLE_MODEL_SHOW_MARKERS" };
        }, setModelCurrentNode: function(_) {
          return { type: "SET_MODEL_CURRENT_NODE", currentNode: _ };
        }, setModelActiveTab: We })(on);
        u(70);
        class fr extends c.Component {
          render() {
            const s = this.props.presentation && this.props.presentation.expandCollapsibles, d = [];
            for (const h in this.props.itemDefinitions) {
              const S = this.props.itemDefinitions[h], { subProperties: O, presentation: L = {} } = S, ne = O && Object.keys(O).length, fe = Object(ut.c)(String(S.value), 2e3), pe = [o.a.createElement(Zr, { key: `${this.props.name}-${h}-name`, name: h, listUid: this.props.name, canCollapse: ne, colorBox: L.colorBox, expandCollapsibles: s, onClick: this.props.onPropertyTitleClick, title: S.title }), o.a.createElement("dd", { key: `${this.props.name}-${h}-value` }, o.a.createElement("input", { id: `${this.props.name}-${h}-value-input`, type: "text", value: fe, readOnly: !0 }))];
              ne && pe.push(o.a.createElement(fr, { name: `${this.props.name}-${h}`, key: `${this.props.name}-${h}`, itemDefinitions: O, presentation: this.props.presentation })), d.push(pe);
            }
            return o.a.createElement("dl", { className: "ck-inspector-property-list ck-inspector-code" }, d);
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
            let d, h;
            return this.props.canCollapse && (s.push("ck-inspector-property-list__title_collapsible"), s.push("ck-inspector-property-list__title_" + (this.state.isCollapsed ? "collapsed" : "expanded")), d = o.a.createElement("button", { type: "button", onClick: this.handleCollapsedChange }, "Toggle")), this.props.colorBox && (h = o.a.createElement("span", { className: "ck-inspector-property-list__title__color-box", style: { background: this.props.colorBox } })), this.props.onClick && s.push("ck-inspector-property-list__title_clickable"), o.a.createElement("dt", { className: s.join(" ").trim() }, d, h, o.a.createElement("label", { htmlFor: `${this.props.listUid}-${this.props.name}-value-input`, onClick: this.props.onClick ? () => this.props.onClick(this.props.name) : null, title: this.props.title }, this.props.name), ":");
          }
        }
        u(72);
        function Pr() {
          return (Pr = Object.assign ? Object.assign.bind() : function(_) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var h in d) Object.prototype.hasOwnProperty.call(d, h) && (_[h] = d[h]);
            }
            return _;
          }).apply(this, arguments);
        }
        class Bn extends c.PureComponent {
          render() {
            const s = [];
            for (const d of this.props.lists) Object.keys(d.itemDefinitions).length && s.push(o.a.createElement("hr", { key: d.name + "-separator" }), o.a.createElement("h3", { key: d.name + "-header" }, o.a.createElement("a", { href: d.url, target: "_blank", rel: "noopener noreferrer" }, d.name), d.buttons && d.buttons.map((h, S) => o.a.createElement(yt, Pr({ key: "button" + S }, h)))), o.a.createElement(fr, { key: d.name + "-list", name: d.name, itemDefinitions: d.itemDefinitions, presentation: d.presentation, onPropertyTitleClick: d.onPropertyTitleClick }));
            return o.a.createElement("div", { className: "ck-inspector__object-inspector" }, o.a.createElement("h2", { className: "ck-inspector-code" }, this.props.header), s);
          }
        }
        var Nt = u(3);
        function So() {
          return (So = Object.assign ? Object.assign.bind() : function(_) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var h in d) Object.prototype.hasOwnProperty.call(d, h) && (_[h] = d[h]);
            }
            return _;
          }).apply(this, arguments);
        }
        var wn = ({ styles: _ = {}, ...s }) => o.a.createElement("svg", So({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, s), o.a.createElement("path", { d: "M17 15.75a.75.75 0 01.102 1.493L17 17.25H9a.75.75 0 01-.102-1.493L9 15.75h8zM2.156 2.947l.095.058 7.58 5.401a.75.75 0 01.084 1.152l-.083.069-7.58 5.425a.75.75 0 01-.958-1.148l.086-.071 6.724-4.815-6.723-4.792a.75.75 0 01-.233-.95l.057-.096a.75.75 0 01.951-.233z" }));
        function Nr() {
          return (Nr = Object.assign ? Object.assign.bind() : function(_) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var h in d) Object.prototype.hasOwnProperty.call(d, h) && (_[h] = d[h]);
            }
            return _;
          }).apply(this, arguments);
        }
        var Oa = ({ styles: _ = {}, ...s }) => o.a.createElement("svg", Nr({ fill: "none", xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 19 19" }, s), o.a.createElement("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M6 1a1 1 0 011-1h5a1 1 0 011 1v5a1 1 0 01-1 1h-2v2h5a1 1 0 011 1v3h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3a1 1 0 011-1h1v-2.5a.5.5 0 00-.5-.5H10v3h1a1 1 0 011 1v3a1 1 0 01-1 1H8a1 1 0 01-1-1v-3a1 1 0 011-1h1v-3H4.5a.5.5 0 00-.5.5V13h1a1 1 0 011 1v3a1 1 0 01-1 1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1v-3a1 1 0 011-1h5V7H7a1 1 0 01-1-1V1zm1.5 4.5v-4h4v4h-4zm-5 11v-2h2v2h-2zm6-2v2h2v-2h-2zm6 2v-2h2v2h-2z", fill: "#000" }));
        class Co extends c.Component {
          constructor(s) {
            super(s), this.handleNodeLogButtonClick = this.handleNodeLogButtonClick.bind(this), this.handleNodeSchemaButtonClick = this.handleNodeSchemaButtonClick.bind(this);
          }
          handleNodeLogButtonClick() {
            Nt.a.log(this.props.currentNodeDefinition.editorNode);
          }
          handleNodeSchemaButtonClick() {
            const s = this.props.editors.get(this.props.currentEditorName).model.schema.getDefinition(this.props.currentNodeDefinition.editorNode);
            this.props.setActiveTab("Schema"), this.props.setSchemaCurrentDefinitionName(s.name);
          }
          render() {
            const s = this.props.currentNodeDefinition;
            return s ? o.a.createElement(Bn, { header: [o.a.createElement("span", { key: "link" }, o.a.createElement("a", { href: s.url, target: "_blank", rel: "noopener noreferrer" }, o.a.createElement("b", null, s.type)), ":", s.type === "Text" ? o.a.createElement("em", null, s.name) : s.name), o.a.createElement(yt, { key: "log", icon: o.a.createElement(wn, null), text: "Log in console", onClick: this.handleNodeLogButtonClick }), o.a.createElement(yt, { key: "schema", icon: o.a.createElement(Oa, null), text: "Show in schema", onClick: this.handleNodeSchemaButtonClick })], lists: [{ name: "Attributes", url: s.url, itemDefinitions: s.attributes }, { name: "Properties", url: s.url, itemDefinitions: s.properties }] }) : o.a.createElement(_t, { isEmpty: "true" }, o.a.createElement("p", null, "Select a node in the tree to inspect"));
          }
        }
        var wi = Re(({ editors: _, currentEditorName: s, model: { currentNodeDefinition: d } }) => ({ editors: _, currentEditorName: s, currentNodeDefinition: d }), { setActiveTab: kt, setSchemaCurrentDefinitionName: ir })(Co);
        function ki() {
          return (ki = Object.assign ? Object.assign.bind() : function(_) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var h in d) Object.prototype.hasOwnProperty.call(d, h) && (_[h] = d[h]);
            }
            return _;
          }).apply(this, arguments);
        }
        var Dr = ({ styles: _ = {}, ...s }) => o.a.createElement("svg", ki({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, s), o.a.createElement("path", { d: "M9.5 4.5c1.85 0 3.667.561 5.199 1.519C16.363 7.059 17.5 8.4 17.5 9.5s-1.137 2.441-2.801 3.481c-1.532.958-3.35 1.519-5.199 1.519-1.85 0-3.667-.561-5.199-1.519C2.637 11.941 1.5 10.6 1.5 9.5s1.137-2.441 2.801-3.481C5.833 5.06 7.651 4.5 9.5 4.5zm0 1a4 4 0 11-.2.005l.2-.005c-1.655 0-3.29.505-4.669 1.367C3.431 7.742 2.5 8.84 2.5 9.5c0 .66.931 1.758 2.331 2.633C6.21 12.995 7.845 13.5 9.5 13.5c1.655 0 3.29-.505 4.669-1.367 1.4-.875 2.331-1.974 2.331-2.633 0-.66-.931-1.758-2.331-2.633C12.79 6.005 11.155 5.5 9.5 5.5zM8 6.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" }));
        const pr = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_selection-Selection.html";
        class _i extends c.Component {
          constructor(s) {
            super(s), this.handleSelectionLogButtonClick = this.handleSelectionLogButtonClick.bind(this), this.handleScrollToSelectionButtonClick = this.handleScrollToSelectionButtonClick.bind(this);
          }
          handleSelectionLogButtonClick() {
            const s = this.props.editor;
            Nt.a.log(s.model.document.selection);
          }
          handleScrollToSelectionButtonClick() {
            const s = document.querySelector(".ck-inspector-tree__position.ck-inspector-tree__position_selection");
            s && s.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          render() {
            const s = this.props.editor, d = this.props.info;
            return o.a.createElement(Bn, { header: [o.a.createElement("span", { key: "link" }, o.a.createElement("a", { href: pr, target: "_blank", rel: "noopener noreferrer" }, o.a.createElement("b", null, "Selection"))), o.a.createElement(yt, { key: "log", icon: o.a.createElement(wn, null), text: "Log in console", onClick: this.handleSelectionLogButtonClick }), o.a.createElement(yt, { key: "scroll", icon: o.a.createElement(Dr, null), text: "Scroll to selection", onClick: this.handleScrollToSelectionButtonClick })], lists: [{ name: "Attributes", url: pr + "#function-getAttributes", itemDefinitions: d.attributes }, { name: "Properties", url: "" + pr, itemDefinitions: d.properties }, { name: "Anchor", url: pr + "#member-anchor", buttons: [{ icon: o.a.createElement(wn, null), text: "Log in console", onClick: () => Nt.a.log(s.model.document.selection.anchor) }], itemDefinitions: d.anchor }, { name: "Focus", url: pr + "#member-focus", buttons: [{ icon: o.a.createElement(wn, null), text: "Log in console", onClick: () => Nt.a.log(s.model.document.selection.focus) }], itemDefinitions: d.focus }, { name: "Ranges", url: pr + "#function-getRanges", buttons: [{ icon: o.a.createElement(wn, null), text: "Log in console", onClick: () => Nt.a.log(...s.model.document.selection.getRanges()) }], itemDefinitions: d.ranges, presentation: { expandCollapsibles: !0 } }] });
          }
        }
        var Ei = Re(({ editors: _, currentEditorName: s, model: { ranges: d } }) => {
          const h = _.get(s);
          return { editor: h, currentEditorName: s, info: function(S, O) {
            const L = S.model.document.selection, ne = L.anchor, fe = L.focus, pe = { properties: { isCollapsed: { value: L.isCollapsed }, isBackward: { value: L.isBackward }, isGravityOverridden: { value: L.isGravityOverridden }, rangeCount: { value: L.rangeCount } }, attributes: {}, anchor: Rr(Object(cn.a)(ne)), focus: Rr(Object(cn.a)(fe)), ranges: {} };
            for (const [_e, Ne] of L.getAttributes()) pe.attributes[_e] = { value: Ne };
            O.forEach((_e, Ne) => {
              pe.ranges[Ne] = { value: "", subProperties: { start: { value: "", subProperties: Object(ut.b)(Rr(_e.start)) }, end: { value: "", subProperties: Object(ut.b)(Rr(_e.end)) } } };
            });
            for (const _e in pe) _e !== "ranges" && (pe[_e] = Object(ut.b)(pe[_e]));
            return pe;
          }(h, d) };
        }, {})(_i);
        function Rr({ path: _, stickiness: s, index: d, isAtEnd: h, isAtStart: S, offset: O, textNode: L }) {
          return { path: { value: _ }, stickiness: { value: s }, index: { value: d }, isAtEnd: { value: h }, isAtStart: { value: S }, offset: { value: O }, textNode: { value: L } };
        }
        class Pa extends c.Component {
          render() {
            const s = function(S) {
              const O = {};
              for (const L of S) {
                const ne = L.name.split(":");
                let fe = O;
                for (const pe of ne) {
                  const _e = pe === ne[ne.length - 1];
                  fe = fe[pe] ? fe[pe] : fe[pe] = _e ? L : {};
                }
              }
              return O;
            }(this.props.markers), d = function S(O) {
              const L = {};
              for (const ne in O) {
                const fe = O[ne];
                if (fe.name) {
                  const pe = Object(ut.b)(xi(fe));
                  L[ne] = { value: "", presentation: { colorBox: fe.presentation.color }, subProperties: pe };
                } else {
                  const pe = Object.keys(fe).length;
                  L[ne] = { value: pe + " marker" + (pe > 1 ? "s" : ""), subProperties: S(fe) };
                }
              }
              return L;
            }(s), h = this.props.editors.get(this.props.currentEditorName);
            return Object.keys(s).length ? o.a.createElement(Bn, { header: [o.a.createElement("span", { key: "link" }, o.a.createElement("a", { href: "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_markercollection-Marker.html", target: "_blank", rel: "noopener noreferrer" }, o.a.createElement("b", null, "Markers"))), o.a.createElement(yt, { key: "log", icon: o.a.createElement(wn, null), text: "Log in console", onClick: () => Nt.a.log([...h.model.markers]) })], lists: [{ name: "Markers tree", itemDefinitions: d, presentation: { expandCollapsibles: !0 } }] }) : o.a.createElement(_t, { isEmpty: "true" }, o.a.createElement("p", null, "No markers in the document."));
          }
        }
        var qo = Re(({ editors: _, currentEditorName: s, model: { markers: d } }) => ({ editors: _, currentEditorName: s, markers: d }), {})(Pa);
        function xi({ name: _, start: s, end: d, affectsData: h, managedUsingOperations: S }) {
          return { name: { value: _ }, start: { value: s.path }, end: { value: d.path }, affectsData: { value: h }, managedUsingOperations: { value: S } };
        }
        u(74);
        class Ko extends c.Component {
          render() {
            return this.props.currentEditorName ? o.a.createElement(_t, { splitVertically: "true" }, o.a.createElement(Kn, null), o.a.createElement(vn, null, o.a.createElement(Qt, { onTabChange: this.props.setModelActiveTab, activeTab: this.props.activeTab }, o.a.createElement(wi, { label: "Inspect" }), o.a.createElement(Ei, { label: "Selection" }), o.a.createElement(qo, { label: "Markers" })))) : o.a.createElement(_t, { isEmpty: "true" }, o.a.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
          }
        }
        var Na = Re(({ currentEditorName: _, model: { ui: { activeTab: s } } }) => ({ currentEditorName: _, activeTab: s }), { setModelActiveTab: We })(Ko);
        class Da extends c.Component {
          constructor(s) {
            super(s), this.handleTreeClick = this.handleTreeClick.bind(this), this.handleRootChange = this.handleRootChange.bind(this);
          }
          handleTreeClick(s, d) {
            s.persist(), s.stopPropagation(), this.props.setViewCurrentNode(d), s.detail === 2 && this.props.setViewActiveTab("Inspect");
          }
          handleRootChange(s) {
            this.props.setViewCurrentRootName(s.target.value);
          }
          render() {
            const s = this.props.editors.get(this.props.currentEditorName);
            return o.a.createElement(Ht, null, [o.a.createElement("div", { className: "ck-inspector-tree__config", key: "root-cfg" }, o.a.createElement(rn, { id: "view-root-select", label: "Root", value: this.props.currentRootName, options: Object(en.d)(s).map((d) => d.rootName), onChange: this.handleRootChange })), o.a.createElement("span", { className: "ck-inspector-separator", key: "separator" }), o.a.createElement("div", { className: "ck-inspector-tree__config", key: "types-cfg" }, o.a.createElement(Wt, { label: "Show element types", id: "view-show-types", isChecked: this.props.showElementTypes, onChange: this.props.toggleViewShowElementTypes }))], o.a.createElement(Ut.a, { definition: this.props.treeDefinition, textDirection: s.locale.contentLanguageDirection, onClick: this.handleTreeClick, showCompactText: "true", showElementTypes: this.props.showElementTypes, activeNode: this.props.currentNode }));
          }
        }
        var To = Re(({ editors: _, currentEditorName: s, view: { treeDefinition: d, currentRootName: h, currentNode: S, ui: { showElementTypes: O } } }) => ({ treeDefinition: d, editors: _, currentEditorName: s, currentRootName: h, currentNode: S, showElementTypes: O }), { setViewCurrentRootName: function(_) {
          return { type: "SET_VIEW_CURRENT_ROOT_NAME", currentRootName: _ };
        }, toggleViewShowElementTypes: function() {
          return { type: "TOGGLE_VIEW_SHOW_ELEMENT_TYPES" };
        }, setViewCurrentNode: function(_) {
          return { type: "SET_VIEW_CURRENT_NODE", currentNode: _ };
        }, setViewActiveTab: Er })(Da);
        class mt extends c.Component {
          constructor(s) {
            super(s), this.handleNodeLogButtonClick = this.handleNodeLogButtonClick.bind(this);
          }
          handleNodeLogButtonClick() {
            Nt.a.log(this.props.currentNodeDefinition.editorNode);
          }
          render() {
            const s = this.props.currentNodeDefinition;
            return s ? o.a.createElement(Bn, { header: [o.a.createElement("span", { key: "link" }, o.a.createElement("a", { href: s.url, target: "_blank", rel: "noopener noreferrer" }, o.a.createElement("b", null, s.type), ":"), s.type === "Text" ? o.a.createElement("em", null, s.name) : s.name), o.a.createElement(yt, { key: "log", icon: o.a.createElement(wn, null), text: "Log in console", onClick: this.handleNodeLogButtonClick })], lists: [{ name: "Attributes", url: s.url, itemDefinitions: s.attributes }, { name: "Properties", url: s.url, itemDefinitions: s.properties }, { name: "Custom Properties", url: en.a + "_element-Element.html#function-getCustomProperty", itemDefinitions: s.customProperties }] }) : o.a.createElement(_t, { isEmpty: "true" }, o.a.createElement("p", null, "Select a node in the tree to inspect"));
          }
        }
        var Jr = Re(({ view: { currentNodeDefinition: _ } }) => ({ currentNodeDefinition: _ }), {})(mt);
        const eo = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_view_selection-Selection.html";
        class Ra extends c.Component {
          constructor(s) {
            super(s), this.handleSelectionLogButtonClick = this.handleSelectionLogButtonClick.bind(this), this.handleScrollToSelectionButtonClick = this.handleScrollToSelectionButtonClick.bind(this);
          }
          handleSelectionLogButtonClick() {
            const s = this.props.editor;
            Nt.a.log(s.editing.view.document.selection);
          }
          handleScrollToSelectionButtonClick() {
            const s = document.querySelector(".ck-inspector-tree__position.ck-inspector-tree__position_selection");
            s && s.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          render() {
            const s = this.props.editor, d = this.props.info;
            return o.a.createElement(Bn, { header: [o.a.createElement("span", { key: "link" }, o.a.createElement("a", { href: eo, target: "_blank", rel: "noopener noreferrer" }, o.a.createElement("b", null, "Selection"))), o.a.createElement(yt, { key: "log", icon: o.a.createElement(wn, null), text: "Log in console", onClick: this.handleSelectionLogButtonClick }), o.a.createElement(yt, { key: "scroll", icon: o.a.createElement(Dr, null), text: "Scroll to selection", onClick: this.handleScrollToSelectionButtonClick })], lists: [{ name: "Properties", url: "" + eo, itemDefinitions: d.properties }, { name: "Anchor", url: eo + "#member-anchor", buttons: [{ type: "log", text: "Log in console", onClick: () => Nt.a.log(s.editing.view.document.selection.anchor) }], itemDefinitions: d.anchor }, { name: "Focus", url: eo + "#member-focus", buttons: [{ type: "log", text: "Log in console", onClick: () => Nt.a.log(s.editing.view.document.selection.focus) }], itemDefinitions: d.focus }, { name: "Ranges", url: eo + "#function-getRanges", buttons: [{ type: "log", text: "Log in console", onClick: () => Nt.a.log(...s.editing.view.document.selection.getRanges()) }], itemDefinitions: d.ranges, presentation: { expandCollapsibles: !0 } }] });
          }
        }
        var Oo = Re(({ editors: _, currentEditorName: s, view: { ranges: d } }) => {
          const h = _.get(s);
          return { editor: h, currentEditorName: s, info: function(S, O) {
            const L = S.editing.view.document.selection, ne = { properties: { isCollapsed: { value: L.isCollapsed }, isBackward: { value: L.isBackward }, isFake: { value: L.isFake }, rangeCount: { value: L.rangeCount } }, anchor: Ir(Object(Yt.a)(L.anchor)), focus: Ir(Object(Yt.a)(L.focus)), ranges: {} };
            O.forEach((fe, pe) => {
              ne.ranges[pe] = { value: "", subProperties: { start: { value: "", subProperties: Object(ut.b)(Ir(fe.start)) }, end: { value: "", subProperties: Object(ut.b)(Ir(fe.end)) } } };
            });
            for (const fe in ne) fe !== "ranges" && (ne[fe] = Object(ut.b)(ne[fe]));
            return ne;
          }(h, d) };
        }, {})(Ra);
        function Ir({ offset: _, isAtEnd: s, isAtStart: d, parent: h }) {
          return { offset: { value: _ }, isAtEnd: { value: s }, isAtStart: { value: d }, parent: { value: h } };
        }
        class to extends c.Component {
          render() {
            return this.props.currentEditorName ? o.a.createElement(_t, { splitVertically: "true" }, o.a.createElement(To, null), o.a.createElement(vn, null, o.a.createElement(Qt, { onTabChange: this.props.setViewActiveTab, activeTab: this.props.activeTab }, o.a.createElement(Jr, { label: "Inspect" }), o.a.createElement(Oo, { label: "Selection" })))) : o.a.createElement(_t, { isEmpty: "true" }, o.a.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
          }
        }
        var Ia = Re(({ currentEditorName: _, view: { ui: { activeTab: s } } }) => ({ currentEditorName: _, activeTab: s }), { setViewActiveTab: Er, updateViewState: _o })(to);
        class Si extends c.Component {
          constructor(s) {
            super(s), this.handleTreeClick = this.handleTreeClick.bind(this);
          }
          handleTreeClick(s, d) {
            s.persist(), s.stopPropagation(), this.props.setCommandsCurrentCommandName(d);
          }
          render() {
            return o.a.createElement(Ht, null, o.a.createElement(Ut.a, { definition: this.props.treeDefinition, onClick: this.handleTreeClick, activeNode: this.props.currentCommandName }));
          }
        }
        var Ci = Re(({ commands: { treeDefinition: _, currentCommandName: s } }) => ({ treeDefinition: _, currentCommandName: s }), { setCommandsCurrentCommandName: function(_) {
          return { type: "SET_COMMANDS_CURRENT_COMMAND_NAME", currentCommandName: _ };
        } })(Si);
        function Ti() {
          return (Ti = Object.assign ? Object.assign.bind() : function(_) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var h in d) Object.prototype.hasOwnProperty.call(d, h) && (_[h] = d[h]);
            }
            return _;
          }).apply(this, arguments);
        }
        var Qo = ({ styles: _ = {}, ...s }) => o.a.createElement("svg", Ti({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, s), o.a.createElement("path", { d: "M9.25 1.25a8 8 0 110 16 8 8 0 010-16zm0 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM7.344 6.485l4.98 2.765-4.98 3.018V6.485z" }));
        class Go extends c.Component {
          constructor(s) {
            super(s), this.handleCommandLogButtonClick = this.handleCommandLogButtonClick.bind(this), this.handleCommandExecuteButtonClick = this.handleCommandExecuteButtonClick.bind(this);
          }
          handleCommandLogButtonClick() {
            Nt.a.log(this.props.currentCommandDefinition.command);
          }
          handleCommandExecuteButtonClick() {
            this.props.editors.get(this.props.currentEditorName).execute(this.props.currentCommandName);
          }
          render() {
            const s = this.props.currentCommandDefinition;
            return s ? o.a.createElement(Bn, { header: [o.a.createElement("span", { key: "link" }, o.a.createElement("a", { href: s.url, target: "_blank", rel: "noopener noreferrer" }, o.a.createElement("b", null, s.type)), ":", this.props.currentCommandName), o.a.createElement(yt, { key: "exec", icon: o.a.createElement(Qo, null), text: "Execute command", onClick: this.handleCommandExecuteButtonClick }), o.a.createElement(yt, { key: "log", icon: o.a.createElement(wn, null), text: "Log in console", onClick: this.handleCommandLogButtonClick })], lists: [{ name: "Properties", url: s.url, itemDefinitions: s.properties }] }) : o.a.createElement(_t, { isEmpty: "true" }, o.a.createElement("p", null, "Select a command to inspect"));
          }
        }
        var Oi = Re(({ editors: _, currentEditorName: s, commands: { currentCommandName: d, currentCommandDefinition: h } }) => ({ editors: _, currentEditorName: s, currentCommandName: d, currentCommandDefinition: h }), {})(Go);
        class Hn extends c.Component {
          render() {
            return this.props.currentEditorName ? o.a.createElement(_t, { splitVertically: "true" }, o.a.createElement(Ci, null), o.a.createElement(vn, null, o.a.createElement(Qt, { activeTab: "Inspect" }, o.a.createElement(Oi, { label: "Inspect" })))) : o.a.createElement(_t, { isEmpty: "true" }, o.a.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
          }
        }
        var Po = Re(({ currentEditorName: _ }) => ({ currentEditorName: _ }), { updateCommandsState: Sr })(Hn);
        class Xo extends c.Component {
          constructor(s) {
            super(s), this.handleTreeClick = this.handleTreeClick.bind(this);
          }
          handleTreeClick(s, d) {
            s.persist(), s.stopPropagation(), this.props.setSchemaCurrentDefinitionName(d);
          }
          render() {
            return o.a.createElement(Ht, null, o.a.createElement(Ut.a, { definition: this.props.treeDefinition, onClick: this.handleTreeClick, activeNode: this.props.currentSchemaDefinitionName }));
          }
        }
        var Pi = Re(({ schema: { treeDefinition: _, currentSchemaDefinitionName: s } }) => ({ treeDefinition: _, currentSchemaDefinitionName: s }), { setSchemaCurrentDefinitionName: ir })(Xo);
        class Ni extends c.Component {
          render() {
            const s = this.props.currentSchemaDefinition;
            return s ? o.a.createElement(Bn, { header: [o.a.createElement("span", { key: "link" }, o.a.createElement("a", { href: s.urls.general, target: "_blank", rel: "noopener noreferrer" }, o.a.createElement("b", null, s.type)), ":", this.props.currentSchemaDefinitionName)], lists: [{ name: "Properties", url: s.urls.general, itemDefinitions: s.properties }, { name: "Allowed attributes", url: s.urls.allowAttributes, itemDefinitions: s.allowAttributes }, { name: "Allowed children", url: s.urls.allowChildren, itemDefinitions: s.allowChildren, onPropertyTitleClick: (d) => {
              this.props.setSchemaCurrentDefinitionName(d);
            } }, { name: "Allowed in", url: s.urls.allowIn, itemDefinitions: s.allowIn, onPropertyTitleClick: (d) => {
              this.props.setSchemaCurrentDefinitionName(d);
            } }] }) : o.a.createElement(_t, { isEmpty: "true" }, o.a.createElement("p", null, "Select a schema definition to inspect"));
          }
        }
        var Di = Re(({ editors: _, currentEditorName: s, schema: { currentSchemaDefinitionName: d, currentSchemaDefinition: h } }) => ({ editors: _, currentEditorName: s, currentSchemaDefinitionName: d, currentSchemaDefinition: h }), { setSchemaCurrentDefinitionName: ir })(Ni);
        class Zo extends c.Component {
          render() {
            return this.props.currentEditorName ? o.a.createElement(_t, { splitVertically: "true" }, o.a.createElement(Pi, null), o.a.createElement(vn, null, o.a.createElement(Qt, { activeTab: "Inspect" }, o.a.createElement(Di, { label: "Inspect" })))) : o.a.createElement(_t, { isEmpty: "true" }, o.a.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
          }
        }
        var Jo = Re(({ currentEditorName: _ }) => ({ currentEditorName: _ }))(Zo), ei = u(47), Ri = u.n(ei), ti = u(48), ni = u.n(ti);
        function Ii() {
          return (Ii = Object.assign ? Object.assign.bind() : function(_) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var h in d) Object.prototype.hasOwnProperty.call(d, h) && (_[h] = d[h]);
            }
            return _;
          }).apply(this, arguments);
        }
        var Ar = ({ styles: _ = {}, ...s }) => o.a.createElement("svg", Ii({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, s), o.a.createElement("path", { d: "M12.936 0l5 4.5v12.502l-1.504-.001v.003h1.504v1.499h-5v-1.501l3.496-.001V5.208L12.21 1.516 3.436 1.5v15.504l3.5-.001v1.5h-5V0h11z" }), o.a.createElement("path", { d: "M10.374 9.463l.085.072.477.464L11 10v.06l3.545 3.453-1.047 1.075L11 12.155V19H9v-6.9l-2.424 2.476-1.072-1.05L9.4 9.547a.75.75 0 01.974-.084zM12.799 1.5l-.001 2.774h3.645v1.5h-5.144V1.5z" }));
        u(86);
        class Ai extends c.Component {
          constructor(s) {
            super(s), this.state = { isModalOpen: !1, editorDataValue: "" }, this.textarea = o.a.createRef();
          }
          render() {
            return [o.a.createElement(yt, { text: "Set editor data", icon: o.a.createElement(Ar, null), isEnabled: !!this.props.editor, onClick: () => this.setState({ isModalOpen: !0 }), key: "button" }), o.a.createElement(ni.a, { isOpen: this.state.isModalOpen, appElement: document.querySelector(".ck-inspector-wrapper"), onAfterOpen: this._handleModalAfterOpen.bind(this), overlayClassName: "ck-inspector-modal ck-inspector-quick-actions__set-data-modal", className: "ck-inspector-quick-actions__set-data-modal__content", onRequestClose: this._closeModal.bind(this), portalClassName: "ck-inspector-portal", shouldCloseOnEsc: !0, shouldCloseOnOverlayClick: !0, key: "modal" }, o.a.createElement("h2", null, "Set editor data"), o.a.createElement("textarea", { autoFocus: !0, ref: this.textarea, value: this.state.editorDataValue, placeholder: "Paste HTML here...", onChange: this._handlDataChange.bind(this), onKeyPress: (s) => {
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
          return (No = Object.assign ? Object.assign.bind() : function(_) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var h in d) Object.prototype.hasOwnProperty.call(d, h) && (_[h] = d[h]);
            }
            return _;
          }).apply(this, arguments);
        }
        var Qn = ({ styles: _ = {}, ...s }) => o.a.createElement("svg", No({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, s), o.a.createElement("path", { d: "M12.936 0l5 4.5v14.003h-4.503L14.936 17h-10l1.503 1.503H1.936V0h11zm-9.5 1.5v15.504h12.996V5.208L12.21 1.516 3.436 1.5z" }), o.a.createElement("path", { d: "M12.799 1.5l-.001 2.774h3.645v1.5h-5.144V1.5zM9.675 18.859l-.085-.072-4.086-3.978 1.047-1.075L9 16.119V9h2v7.273l2.473-2.526 1.072 1.049-3.896 3.979a.75.75 0 01-.974.084z" }));
        function no() {
          return (no = Object.assign ? Object.assign.bind() : function(_) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var h in d) Object.prototype.hasOwnProperty.call(d, h) && (_[h] = d[h]);
            }
            return _;
          }).apply(this, arguments);
        }
        var ro = ({ styles: _ = {}, ...s }) => o.a.createElement("svg", no({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, s), o.a.createElement("path", { d: "M3.144 15.748l2.002 1.402-1.976.516-.026-1.918zM2.438 3.391l15.346 11.023-.875 1.218-5.202-3.736-2.877 4.286.006.005-3.055.797-2.646-1.852-.04-2.95-.006-.005.006-.008v-.025l.01.008L6.02 7.81l-4.457-3.2.876-1.22zM7.25 8.695l-2.13 3.198 3.277 2.294 2.104-3.158-3.25-2.334zM14.002 0l2.16 1.512-.856 1.222c.828.967 1.144 2.141.432 3.158l-2.416 3.599-1.214-.873 2.396-3.593.005.003c.317-.452-.16-1.332-1.064-1.966-.891-.624-1.865-.776-2.197-.349l-.006-.004-2.384 3.575-1.224-.879 2.376-3.539c.674-.932 1.706-1.155 3.096-.668l.046.018.85-1.216z" }));
        function Mr() {
          return (Mr = Object.assign ? Object.assign.bind() : function(_) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var h in d) Object.prototype.hasOwnProperty.call(d, h) && (_[h] = d[h]);
            }
            return _;
          }).apply(this, arguments);
        }
        var oo = ({ styles: _ = {}, ...s }) => o.a.createElement("svg", Mr({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, s), o.a.createElement("path", { d: "M11.28 1a1 1 0 01.948.684l.333 1 .018.066H16a.75.75 0 01.102 1.493L16 4.25h-.5V16a2 2 0 01-2 2h-8a2 2 0 01-2-2V4.25H3a.75.75 0 01-.102-1.493L3 2.75h3.42a1 1 0 01.019-.066l.333-1A1 1 0 017.721 1h3.558zM14 4.5H5V16a.5.5 0 00.41.492l.09.008h8a.5.5 0 00.492-.41L14 16V4.5zM7.527 6.06v8.951h-1V6.06h1zm5 0v8.951h-1V6.06h1zM10 6.06v8.951H9V6.06h1z" }));
        function Gn() {
          return (Gn = Object.assign ? Object.assign.bind() : function(_) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var h in d) Object.prototype.hasOwnProperty.call(d, h) && (_[h] = d[h]);
            }
            return _;
          }).apply(this, arguments);
        }
        var ri = ({ styles: _ = {}, ...s }) => o.a.createElement("svg", Gn({ viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg" }, s), o.a.createElement("path", { d: "M2.284 2.498c-.239.266-.184.617-.184 1.002V4H2a.5.5 0 00-.492.41L1.5 4.5V17a1 1 0 00.883.993L2.5 18h10a1 1 0 00.97-.752l-.081-.062c.438.368.976.54 1.507.526a2.5 2.5 0 01-2.232 1.783l-.164.005h-10a2.5 2.5 0 01-2.495-2.336L0 17V4.5a2 2 0 011.85-1.995L2 2.5l.284-.002zm10.532 0L13 2.5a2 2 0 011.995 1.85L15 4.5v2.28a2.243 2.243 0 00-1.5.404V4.5a.5.5 0 00-.41-.492L13 4v-.5l-.007-.144c-.031-.329.032-.626-.177-.858z" }), o.a.createElement("path", { d: "M6 .49l-.144.006a1.75 1.75 0 00-1.41.94l-.029.058.083-.004c-.69 0-1.25.56-1.25 1.25v1c0 .69.56 1.25 1.25 1.25h6c.69 0 1.25-.56 1.25-1.25v-1l-.006-.128a1.25 1.25 0 00-1.116-1.116l-.046-.002-.027-.058A1.75 1.75 0 009 .49H6zm0 1.5h3a.25.25 0 01.25.25l.007.102A.75.75 0 0010 2.99h.25v.5h-5.5v-.5H5a.75.75 0 00.743-.648l.007-.102A.25.25 0 016 1.99zm9.374 6.55a.75.75 0 01-.093 1.056l-2.33 1.954h6.127a.75.75 0 010 1.501h-5.949l2.19 1.837a.75.75 0 11-.966 1.15l-3.788-3.18a.747.747 0 01-.21-.285.75.75 0 01.17-.945l3.792-3.182a.75.75 0 011.057.093z" }));
        function Rn() {
          return (Rn = Object.assign ? Object.assign.bind() : function(_) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var h in d) Object.prototype.hasOwnProperty.call(d, h) && (_[h] = d[h]);
            }
            return _;
          }).apply(this, arguments);
        }
        var Mi = ({ styles: _ = {}, ...s }) => o.a.createElement("svg", Rn({ viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg" }, s), o.a.createElement("path", { fill: "#4fa800", d: "M6.972 16.615a.997.997 0 01-.744-.292l-4.596-4.596a1 1 0 111.414-1.414l3.926 3.926 9.937-9.937a1 1 0 011.414 1.415L7.717 16.323a.997.997 0 01-.745.292z" }));
        u(88);
        class ji extends c.Component {
          constructor(s) {
            super(s), this.state = { isShiftKeyPressed: !1, wasEditorDataJustCopied: !1 }, this._keyDownHandler = this._handleKeyDown.bind(this), this._keyUpHandler = this._handleKeyUp.bind(this), this._readOnlyHandler = this._handleReadOnly.bind(this), this._editorDataJustCopiedTimeout = null;
          }
          render() {
            return o.a.createElement("div", { className: "ck-inspector-editor-quick-actions" }, o.a.createElement(yt, { text: "Log editor", icon: o.a.createElement(wn, null), isEnabled: !!this.props.editor, onClick: () => console.log(this.props.editor) }), this._getLogButton(), o.a.createElement(Ai, { editor: this.props.editor }), o.a.createElement(yt, { text: "Toggle read only", icon: o.a.createElement(ro, null), isOn: this.props.isReadOnly, isEnabled: !!this.props.editor, onClick: this._readOnlyHandler }), o.a.createElement(yt, { text: "Destroy editor", icon: o.a.createElement(oo, null), isEnabled: !!this.props.editor, onClick: () => {
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
            let s, d;
            return this.state.wasEditorDataJustCopied ? (s = o.a.createElement(Mi, null), d = "Data copied to clipboard.") : (s = this.state.isShiftKeyPressed ? o.a.createElement(ri, null) : o.a.createElement(Qn, null), d = "Log editor data (press with Shift to copy)"), o.a.createElement(yt, { text: d, icon: s, className: this.state.wasEditorDataJustCopied ? "ck-inspector-button_data-copied" : "", isEnabled: !!this.props.editor, onClick: this._handleLogEditorDataClick.bind(this) });
          }
          _handleLogEditorDataClick({ shiftKey: s }) {
            s ? (Ri()(this.props.editor.getData()), this.setState({ wasEditorDataJustCopied: !0 }), clearTimeout(this._editorDataJustCopiedTimeout), this._editorDataJustCopiedTimeout = setTimeout(() => {
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
        var Aa = Re(({ editors: _, currentEditorName: s, currentEditorGlobals: { isReadOnly: d } }) => ({ editor: _.get(s), isReadOnly: d }), {})(ji);
        function Do() {
          return (Do = Object.assign ? Object.assign.bind() : function(_) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var h in d) Object.prototype.hasOwnProperty.call(d, h) && (_[h] = d[h]);
            }
            return _;
          }).apply(this, arguments);
        }
        var Ma = ({ styles: _ = {}, ...s }) => o.a.createElement("svg", Do({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, s), o.a.createElement("path", { d: "M17.03 6.47a.75.75 0 01.073.976l-.072.084-6.984 7a.75.75 0 01-.977.073l-.084-.072-7.016-7a.75.75 0 01.976-1.134l.084.072 6.485 6.47 6.454-6.469a.75.75 0 01.977-.073l.084.072z" }));
        u(37);
        const jr = { position: "fixed", bottom: "0", left: "0", right: "0", top: "auto" };
        class hr extends c.Component {
          constructor(s) {
            super(s), Li(this.props.height), document.body.style.setProperty("--ck-inspector-collapsed-height", "30px"), this.handleInspectorResize = this.handleInspectorResize.bind(this);
          }
          handleInspectorResize(s, d, h) {
            const S = h.style.height;
            this.props.setHeight(S), Li(S);
          }
          render() {
            return this.props.isCollapsed ? (document.body.classList.remove("ck-inspector-body-expanded"), document.body.classList.add("ck-inspector-body-collapsed")) : (document.body.classList.remove("ck-inspector-body-collapsed"), document.body.classList.add("ck-inspector-body-expanded")), o.a.createElement(Or, { bounds: "window", enableResizing: { top: !this.props.isCollapsed }, disableDragging: !0, minHeight: "100", maxHeight: "100%", style: jr, className: ["ck-inspector", this.props.isCollapsed ? "ck-inspector_collapsed" : ""].join(" "), position: { x: 0, y: "100%" }, size: { width: "100%", height: this.props.isCollapsed ? 30 : this.props.height }, onResizeStop: this.handleInspectorResize }, o.a.createElement(Qt, { onTabChange: this.props.setActiveTab, contentBefore: o.a.createElement(Ro, { key: "docs" }), activeTab: this.props.activeTab, contentAfter: [o.a.createElement(an, { key: "selector" }), o.a.createElement("span", { className: "ck-inspector-separator", key: "separator-a" }), o.a.createElement(Aa, { key: "quick-actions" }), o.a.createElement("span", { className: "ck-inspector-separator", key: "separator-b" }), o.a.createElement(Io, { key: "inspector-toggle" })] }, o.a.createElement(Na, { label: "Model" }), o.a.createElement(Ia, { label: "View" }), o.a.createElement(Po, { label: "Commands" }), o.a.createElement(Jo, { label: "Schema" })));
          }
          componentWillUnmount() {
            document.body.classList.remove("ck-inspector-body-expanded"), document.body.classList.remove("ck-inspector-body-collapsed");
          }
        }
        var oi = Re(({ editors: _, currentEditorName: s, ui: { isCollapsed: d, height: h, activeTab: S } }) => ({ isCollapsed: d, height: h, editors: _, currentEditorName: s, activeTab: S }), { toggleIsCollapsed: It, setHeight: function(_) {
          return { type: "SET_HEIGHT", newHeight: _ };
        }, setEditors: wt, setCurrentEditorName: Jt, setActiveTab: kt })(hr);
        class Ro extends c.Component {
          render() {
            return o.a.createElement("a", { className: "ck-inspector-navbox__navigation__logo", title: "Go to the documentation", href: "https://ckeditor.com/docs/ckeditor5/latest/", target: "_blank", rel: "noopener noreferrer" }, "CKEditor documentation");
          }
        }
        class zi extends c.Component {
          constructor(s) {
            super(s), this.handleShortcut = this.handleShortcut.bind(this);
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
          handleShortcut(s) {
            (function(d) {
              return d.altKey && !d.shiftKey && !d.ctrlKey && d.key === "F12";
            })(s) && this.props.toggleIsCollapsed();
          }
        }
        const Io = Re(({ ui: { isCollapsed: _ } }) => ({ isCollapsed: _ }), { toggleIsCollapsed: It })(zi);
        class Ao extends c.Component {
          render() {
            return o.a.createElement("div", { className: "ck-inspector-editor-selector", key: "editor-selector" }, this.props.currentEditorName ? o.a.createElement(rn, { id: "inspector-editor-selector", label: "Instance", value: this.props.currentEditorName, options: [...this.props.editors].map(([s]) => s), onChange: (s) => this.props.setCurrentEditorName(s.target.value) }) : "");
          }
        }
        const an = Re(({ currentEditorName: _, editors: s }) => ({ currentEditorName: _, editors: s }), { setCurrentEditorName: Jt })(Ao);
        function Li(_) {
          document.body.style.setProperty("--ck-inspector-height", _);
        }
        u(90), window.CKEDITOR_INSPECTOR_VERSION = "4.1.0";
        class $e {
          constructor() {
            Nt.a.warn("[CKEditorInspector] Whoops! Looks like you tried to create an instance of the CKEditorInspector class. To attach the inspector, use the static CKEditorInspector.attach( editor ) method instead. For the latest API, please refer to https://github.com/ckeditor/ckeditor5-inspector/blob/master/README.md. ");
          }
          static attach(...s) {
            const { CKEDITOR_VERSION: d } = window;
            if (d) {
              const [O] = d.split(".").map(Number);
              O < 34 && Nt.a.warn("[CKEditorInspector] The inspector requires using CKEditor 5 in version 34 or higher. If you cannot update CKEditor 5, consider downgrading the major version of the inspector to version 3.");
            } else Nt.a.warn("[CKEditorInspector] Could not determine a version of CKEditor 5. Some of the functionalities may not work as expected.");
            const { editors: h, options: S } = Object(On.c)(s);
            for (const O in h) {
              const L = h[O];
              Nt.a.group("%cAttached the inspector to a CKEditor 5 instance. To learn more, visit https://ckeditor.com/docs/ckeditor5.", "font-weight: bold;"), Nt.a.log(`Editor instance "${O}"`, L), Nt.a.groupEnd(), $e._editors.set(O, L), L.on("destroy", () => {
                $e.detach(O);
              }), $e._mount(S), $e._updateEditorsState();
            }
            return Object.keys(h);
          }
          static attachToAll(s) {
            const d = document.querySelectorAll(".ck.ck-content.ck-editor__editable"), h = [];
            for (const S of d) {
              const O = S.ckeditorInstance;
              O && !$e._isAttachedTo(O) && h.push(...$e.attach(O, s));
            }
            return h;
          }
          static detach(s) {
            $e._wrapper && ($e._editors.delete(s), $e._updateEditorsState());
          }
          static destroy() {
            if (!$e._wrapper) return;
            g.a.unmountComponentAtNode($e._wrapper), $e._editors.clear(), $e._wrapper.remove();
            const s = $e._store.getState(), d = s.editors.get(s.currentEditorName);
            d && $e._editorListener.stopListening(d), $e._editorListener = null, $e._wrapper = null, $e._store = null;
          }
          static _updateEditorsState() {
            $e._store.dispatch(wt($e._editors));
          }
          static _mount(s) {
            if ($e._wrapper) return;
            const d = $e._wrapper = document.createElement("div");
            let h, S;
            d.className = "ck-inspector-wrapper", document.body.appendChild(d), $e._editorListener = new _r({ onModelChange() {
              const O = $e._store;
              O.getState().ui.isCollapsed || (O.dispatch({ type: "UPDATE_MODEL_STATE" }), O.dispatch({ type: "UPDATE_COMMANDS_STATE" }));
            }, onViewRender() {
              const O = $e._store;
              O.getState().ui.isCollapsed || O.dispatch({ type: "UPDATE_VIEW_STATE" });
            }, onReadOnlyChange() {
              $e._store.dispatch({ type: "UPDATE_CURRENT_EDITOR_IS_READ_ONLY" });
            } }), $e._store = N(Gr, { editors: $e._editors, currentEditorName: Object(On.b)($e._editors), currentEditorGlobals: {}, ui: { isCollapsed: s.isCollapsed } }), $e._store.subscribe(() => {
              const O = $e._store.getState(), L = O.editors.get(O.currentEditorName);
              h !== L && (h && $e._editorListener.stopListening(h), L && $e._editorListener.startListening(L), h = L);
            }), $e._store.subscribe(() => {
              const O = $e._store, L = O.getState().ui.isCollapsed, ne = S && !L;
              S = L, ne && (O.dispatch({ type: "UPDATE_MODEL_STATE" }), O.dispatch({ type: "UPDATE_COMMANDS_STATE" }), O.dispatch({ type: "UPDATE_VIEW_STATE" }));
            }), g.a.render(o.a.createElement(B, { store: $e._store }, o.a.createElement(oi, null)), d);
          }
          static _isAttachedTo(s) {
            return [...$e._editors.values()].includes(s);
          }
        }
        $e._editors = /* @__PURE__ */ new Map(), $e._wrapper = null;
      }]).default;
    });
  }(Ts)), Ts.exports;
}
var _u = ku();
const Eu = /* @__PURE__ */ wu(_u);
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
const xu = function(xe) {
  const R = xe.plugins.get(ec), m = $(xe.ui.view.element), i = $(xe.sourceElement), u = `ckeditor${Math.floor(Math.random() * 1e9)}`, c = [
    "keypress",
    "keyup",
    "change",
    "focus",
    "blur",
    "click",
    "mousedown",
    "mouseup"
  ].map((o) => `${o}.${u}`).join(" ");
  R.on("change:isSourceEditingMode", () => {
    const o = m.find(
      ".ck-source-editing-area"
    );
    if (R.isSourceEditingMode) {
      let E = o.attr("data-value");
      o.on(c, () => {
        E !== (E = o.attr("data-value")) && i.val(E);
      });
    } else
      o.off(`.${u}`);
  });
}, Su = function(xe, R) {
  if (R.heading !== void 0) {
    var m = R.heading.options;
    m.find((i) => i.view === "h1") !== void 0 && xe.keystrokes.set(
      "Ctrl+Alt+1",
      () => xe.execute("heading", { value: "heading1" })
    ), m.find((i) => i.view === "h2") !== void 0 && xe.keystrokes.set(
      "Ctrl+Alt+2",
      () => xe.execute("heading", { value: "heading2" })
    ), m.find((i) => i.view === "h3") !== void 0 && xe.keystrokes.set(
      "Ctrl+Alt+3",
      () => xe.execute("heading", { value: "heading3" })
    ), m.find((i) => i.view === "h4") !== void 0 && xe.keystrokes.set(
      "Ctrl+Alt+4",
      () => xe.execute("heading", { value: "heading4" })
    ), m.find((i) => i.view === "h5") !== void 0 && xe.keystrokes.set(
      "Ctrl+Alt+5",
      () => xe.execute("heading", { value: "heading5" })
    ), m.find((i) => i.view === "h6") !== void 0 && xe.keystrokes.set(
      "Ctrl+Alt+6",
      () => xe.execute("heading", { value: "heading6" })
    ), m.find((i) => i.model === "paragraph") !== void 0 && xe.keystrokes.set("Ctrl+Alt+p", "paragraph");
  }
}, Cu = function(xe, R) {
  let m = null;
  const i = xe.editing.view.document, u = xe.plugins.get("ClipboardPipeline");
  i.on("clipboardOutput", (c, o) => {
    m = xe.id;
  }), i.on("clipboardInput", async (c, o) => {
    let E = o.dataTransfer.getData("text/html");
    if (E && E.includes("<craft-entry") && !(o.method == "drop" && m === xe.id)) {
      if (o.method == "paste" || o.method == "drop" && m !== xe.id) {
        let g = E, b = !1;
        const y = Craft.siteId;
        let v = null, C = null;
        const x = xe.getData(), N = [...E.matchAll(/data-entry-id="([0-9]+)/g)];
        c.stop();
        const G = $(xe.ui.view.element);
        let j = G.parents("form").data("elementEditor");
        await j.ensureIsDraftOrRevision(), v = j.settings.elementId, C = G.parents(".field").data("layoutElement");
        for (let V = 0; V < N.length; V++) {
          let P = null;
          if (N[V][1] && (P = N[V][1]), P !== null) {
            const M = new RegExp('data-entry-id="' + P + '"');
            if (!(m === xe.id && !M.test(x))) {
              let B = null;
              m !== xe.id && (R.includes(hu) ? B = xe.config.get("entryTypeOptions").map((I) => I.value) : (Craft.cp.displayError(
                Craft.t(
                  "ckeditor",
                  "This field doesn’t allow nested entries."
                )
              ), b = !0)), await Craft.sendActionRequest(
                "POST",
                "ckeditor/ckeditor/duplicate-nested-entry",
                {
                  data: {
                    entryId: P,
                    siteId: y,
                    targetEntryTypeIds: B,
                    targetOwnerId: v,
                    targetLayoutElementUid: C
                  }
                }
              ).then((I) => {
                I.data.newEntryId && (g = g.replace(
                  P,
                  I.data.newEntryId
                ));
              }).catch((I) => {
                var oe, Q, z, A;
                b = !0, Craft.cp.displayError((Q = (oe = I == null ? void 0 : I.response) == null ? void 0 : oe.data) == null ? void 0 : Q.message), console.error((A = (z = I == null ? void 0 : I.response) == null ? void 0 : z.data) == null ? void 0 : A.additionalMessage);
              });
            }
          }
        }
        b || (o.content = xe.data.htmlProcessor.toView(g), u.fire("inputTransformation", o));
      }
    }
  });
}, Ru = async function(xe, R) {
  typeof xe == "string" && (xe = document.querySelector(`#${xe}`)), R.licenseKey = "GPL";
  const m = await nu.create(xe, R);
  return Craft.showCkeditorInspector && Craft.userIsAdmin && Eu.attach(m), m.editing.view.change((i) => {
    const u = m.editing.view.document.getRoot();
    if (typeof R.accessibleFieldName < "u" && R.accessibleFieldName.length) {
      let c = u.getAttribute("aria-label");
      i.setAttribute(
        "aria-label",
        R.accessibleFieldName + ", " + c,
        u
      );
    }
    typeof R.describedBy < "u" && R.describedBy.length && i.setAttribute(
      "aria-describedby",
      R.describedBy,
      u
    );
  }), m.updateSourceElement(), m.model.document.on("change:data", () => {
    m.updateSourceElement();
  }), R.plugins.includes(ec) && xu(m), R.plugins.includes(ru) && Su(m, R), Cu(m, R.plugins), m;
};
export {
  hu as CraftEntries,
  Ou as CraftImageInsertUI,
  Du as CraftLink,
  Nu as ImageEditor,
  Pu as ImageTransform,
  Ru as create
};
