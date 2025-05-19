import { ImageInsertUI as Bc, ButtonView as vi, IconImage as Vc, Command as Cs, Plugin as Bn, ImageUtils as Jl, Collection as yi, ViewModel as Sa, createDropdown as Ts, DropdownButtonView as Wc, IconObjectSizeMedium as Hc, addListToDropdown as Os, Widget as $c, viewToModelPositionOutsideModelElement as Yc, toWidget as qc, DomEventObserver as Kc, View as $o, IconPlus as Qc, WidgetToolbarRepository as Gl, isWidget as Gc, findAttributeRange as Xc, LinkUI as Xl, ContextualBalloon as Zc, Range as Jc, SwitchButtonView as eu, LabeledFieldView as tu, createLabeledInputText as nu, ClassicEditor as ru, SourceEditing as ec, Heading as ou } from "ckeditor5";
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class Pu extends Bc {
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
    const A = this.editor.ui.componentFactory, g = (i) => this._createToolbarImageButton(i);
    A.add("insertImage", g), A.add("imageInsert", g);
  }
  get _assetSources() {
    return this.editor.config.get("assetSources");
  }
  _createToolbarImageButton(A) {
    const g = this.editor, i = g.t, u = new vi(A);
    u.isEnabled = !0, u.label = i("Insert image"), u.icon = Vc, u.tooltip = !0;
    const c = g.commands.get("insertImage");
    return u.bind("isEnabled").to(c), this.listenTo(u, "execute", () => this._showImageSelectModal()), u;
  }
  _showImageSelectModal() {
    const A = this._assetSources, g = this.editor, i = g.config, u = Object.assign({}, i.get("assetSelectionCriteria"), {
      kind: "image"
    });
    Craft.createElementSelectorModal("craft\\elements\\Asset", {
      storageKey: `ckeditor:${this.pluginName}:'craft\\elements\\Asset'`,
      sources: A,
      criteria: u,
      defaultSiteId: i.get("elementSiteId"),
      transforms: i.get("transforms"),
      multiSelect: !0,
      autoFocusSearchBox: !1,
      onSelect: (c, o) => {
        this._processAssetUrls(c, o).then(() => {
          g.editing.view.focus();
        });
      },
      onHide: () => {
        g.editing.view.focus();
      },
      closeOtherModals: !1
    });
  }
  _processAssetUrls(A, g) {
    return new Promise((i) => {
      if (!A.length) {
        i();
        return;
      }
      const u = this.editor, c = u.config.get("defaultTransform"), o = new Craft.Queue(), _ = [];
      o.on("afterRun", () => {
        u.execute("insertImage", { source: _ }), i();
      });
      for (const m of A)
        o.push(
          () => new Promise((b) => {
            const v = this._isTransformUrl(m.url);
            if (!v && c)
              this._getTransformUrl(m.id, c, (y) => {
                _.push(y), b();
              });
            else {
              const y = this._buildAssetUrl(
                m.id,
                m.url,
                v ? g : c
              );
              _.push(y), b();
            }
          })
        );
    });
  }
  _buildAssetUrl(A, g, i) {
    return `${g}#asset:${A}:${i ? "transform:" + i : "url"}`;
  }
  _removeTransformFromUrl(A) {
    return A.replace(/(^|\/)(_[^\/]+\/)([^\/]+)$/, "$1$3");
  }
  _isTransformUrl(A) {
    return /(^|\/)_[^\/]+\/[^\/]+$/.test(A);
  }
  _getTransformUrl(A, g, i) {
    Craft.sendActionRequest("POST", "ckeditor/ckeditor/image-url", {
      data: {
        assetId: A,
        transform: g
      }
    }).then(({ data: u }) => {
      i(this._buildAssetUrl(A, u.url, g));
    }).catch(() => {
      alert("There was an error generating the transform URL.");
    });
  }
  _getAssetUrlComponents(A) {
    const g = A.match(
      /(.*)#asset:(\d+):(url|transform):?([a-zA-Z][a-zA-Z0-9_]*)?/
    );
    return g ? {
      url: g[1],
      assetId: g[2],
      transform: g[3] !== "url" ? g[4] : null
    } : null;
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class iu extends Cs {
  refresh() {
    const A = this._element(), g = this._srcInfo(A);
    this.isEnabled = !!g, g ? this.value = {
      transform: g.transform
    } : this.value = null;
  }
  _element() {
    const A = this.editor;
    return A.plugins.get("ImageUtils").getClosestSelectedImageElement(
      A.model.document.selection
    );
  }
  _srcInfo(A) {
    if (!A || !A.hasAttribute("src"))
      return null;
    const g = A.getAttribute("src"), i = g.match(
      /#asset:(\d+)(?::transform:([a-zA-Z][a-zA-Z0-9_]*))?/
    );
    return i ? {
      src: g,
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
  execute(A) {
    const i = this.editor.model, u = this._element(), c = this._srcInfo(u);
    if (this.value = {
      transform: A.transform
    }, c) {
      const o = `#asset:${c.assetId}` + (A.transform ? `:transform:${A.transform}` : "");
      i.change((_) => {
        const m = c.src.replace(/#.*/, "") + o;
        _.setAttribute("src", m, u);
      }), Craft.sendActionRequest("post", "ckeditor/ckeditor/image-url", {
        data: {
          assetId: c.assetId,
          transform: A.transform
        }
      }).then(({ data: _ }) => {
        i.change((m) => {
          const b = _.url + o;
          m.setAttribute("src", b, u), _.width && m.setAttribute("width", _.width, u), _.height && m.setAttribute("height", _.height, u);
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
  constructor(A) {
    super(A), A.config.define("transforms", []);
  }
  init() {
    const A = this.editor, g = new iu(A);
    A.commands.add("transformImage", g);
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
const au = Hc;
class su extends Bn {
  static get requires() {
    return [tc];
  }
  static get pluginName() {
    return "ImageTransformUI";
  }
  init() {
    const A = this.editor, g = A.config.get("transforms"), i = A.commands.get("transformImage");
    this.bind("isEnabled").to(i), this._registerImageTransformDropdown(g);
  }
  /**
   * A helper function that creates a dropdown component for the plugin containing all the transform options defined in
   * the editor configuration.
   *
   * @param transforms An array of the available image transforms.
   */
  _registerImageTransformDropdown(A) {
    const g = this.editor, i = g.t, u = {
      name: "transformImage:original",
      value: null
    }, c = [
      u,
      ...A.map((_) => ({
        label: _.name,
        name: `transformImage:${_.handle}`,
        value: _.handle
      }))
    ], o = (_) => {
      const m = g.commands.get("transformImage"), b = Ts(_, Wc), v = b.buttonView;
      return v.set({
        tooltip: i("Resize image"),
        commandValue: null,
        icon: au,
        isToggleable: !0,
        label: this._getOptionLabelValue(u),
        withText: !0,
        class: "ck-resize-image-button"
      }), v.bind("label").to(m, "value", (y) => {
        if (!y || !y.transform)
          return this._getOptionLabelValue(u);
        const C = A.find(
          (x) => x.handle === y.transform
        );
        return C ? C.name : y.transform;
      }), b.bind("isEnabled").to(this), Os(
        b,
        () => this._getTransformDropdownListItemDefinitions(c, m),
        {
          ariaLabel: i("Image resize list")
        }
      ), this.listenTo(b, "execute", (y) => {
        g.execute(y.source.commandName, {
          transform: y.source.commandValue
        }), g.editing.view.focus();
      }), b;
    };
    g.ui.componentFactory.add("transformImage", o);
  }
  /**
   * A helper function for creating an option label value string.
   *
   * @param option A transform option object.
   * @returns The option label.
   */
  _getOptionLabelValue(A) {
    return A.label || A.value || this.editor.t("Original");
  }
  /**
   * A helper function that parses the transform options and returns list item definitions ready for use in the dropdown.
   *
   * @param options The transform options.
   * @param command The transform image command.
   * @returns Dropdown item definitions.
   */
  _getTransformDropdownListItemDefinitions(A, g) {
    const i = new yi();
    return A.map((u) => {
      const c = {
        type: "button",
        model: new Sa({
          commandName: "transformImage",
          commandValue: u.value,
          label: this._getOptionLabelValue(u),
          withText: !0,
          icon: null
        })
      };
      c.model.bind("isOn").to(g, "value", lu(u.value)), i.add(c);
    }), i;
  }
}
function lu(xe) {
  return (A) => {
    const g = A;
    return xe === null && g === xe ? !0 : g !== null && g.transform === xe;
  };
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class Nu extends Bn {
  static get requires() {
    return [tc, su];
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
class cu extends Cs {
  refresh() {
    const A = this._element(), g = this._srcInfo(A);
    if (this.isEnabled = !!g, this.isEnabled) {
      let i = {
        assetId: g.assetId
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
    const A = this.editor;
    return A.plugins.get("ImageUtils").getClosestSelectedImageElement(
      A.model.document.selection
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
  _srcInfo(A) {
    if (!A || !A.hasAttribute("src"))
      return null;
    const g = A.getAttribute("src"), i = g.match(
      /(.*)#asset:(\d+)(?::transform:([a-zA-Z][a-zA-Z0-9_]*))?/
    );
    return i ? {
      src: g,
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
    const g = this._element(), i = this._srcInfo(g);
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
  _reloadImage(A, g) {
    let u = this.editor.model;
    this._getAllImageAssets().forEach((o) => {
      if (o.srcInfo.assetId == A)
        if (o.srcInfo.transform) {
          let _ = {
            assetId: o.srcInfo.assetId,
            handle: o.srcInfo.transform
          };
          Craft.sendActionRequest("POST", "assets/generate-transform", {
            data: _
          }).then((m) => {
            let b = m.data.url + "?" + (/* @__PURE__ */ new Date()).getTime() + "#asset:" + o.srcInfo.assetId + ":transform:" + o.srcInfo.transform;
            u.change((v) => {
              v.setAttribute("src", b, o.element);
            });
          });
        } else {
          let _ = o.srcInfo.baseSrc + "?" + (/* @__PURE__ */ new Date()).getTime() + "#asset:" + o.srcInfo.assetId;
          u.change((m) => {
            m.setAttribute("src", _, o.element);
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
    const g = this.editor.model, i = g.createRangeIn(g.document.getRoot());
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
class nc extends Bn {
  static get requires() {
    return [Jl];
  }
  static get pluginName() {
    return "ImageEditorEditing";
  }
  init() {
    const A = this.editor, g = new cu(A);
    A.commands.add("imageEditor", g);
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class uu extends Bn {
  static get requires() {
    return [nc];
  }
  static get pluginName() {
    return "ImageEditorUI";
  }
  init() {
    const g = this.editor.commands.get("imageEditor");
    this.bind("isEnabled").to(g), this._registerImageEditorButton();
  }
  /**
   * A helper function that creates a button component for the plugin that triggers launch of the Image Editor.
   */
  _registerImageEditorButton() {
    const A = this.editor, g = A.t, i = A.commands.get("imageEditor"), u = () => {
      const c = new vi();
      return c.set({
        label: g("Edit Image"),
        withText: !0
      }), c.bind("isEnabled").to(i), this.listenTo(c, "execute", (o) => {
        A.execute("imageEditor"), A.editing.view.focus();
      }), c;
    };
    A.ui.componentFactory.add("imageEditor", u);
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class Du extends Bn {
  static get requires() {
    return [nc, uu];
  }
  static get pluginName() {
    return "ImageEditor";
  }
}
class du extends Cs {
  execute(A) {
    const g = this.editor, i = g.model.document.selection;
    g.model.change((u) => {
      const c = u.createElement("craftEntryModel", {
        ...Object.fromEntries(i.getAttributes()),
        cardHtml: A.cardHtml,
        entryId: A.entryId,
        siteId: A.siteId
      });
      g.model.insertObject(c, null, null, {
        setSelection: "after"
      });
    });
  }
  refresh() {
    const g = this.editor.model.document.selection, i = !g.isCollapsed && g.getFirstRange();
    this.isEnabled = !i;
  }
}
class fu extends Bn {
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
    const A = this.editor;
    A.commands.add("insertEntry", new du(A)), A.editing.mapper.on(
      "viewToModelPosition",
      Yc(A.model, (g) => {
        g.hasClass("cke-entry-card");
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
    const A = this.editor.conversion;
    A.for("upcast").elementToElement({
      view: {
        name: "craft-entry"
        // has to be lower case
      },
      model: (i, { writer: u }) => {
        const c = i.getAttribute("data-card-html"), o = i.getAttribute("data-entry-id"), _ = i.getAttribute("data-site-id") ?? null;
        return u.createElement("craftEntryModel", {
          cardHtml: c,
          entryId: o,
          siteId: _
        });
      }
    }), A.for("editingDowncast").elementToElement({
      model: "craftEntryModel",
      view: (i, { writer: u }) => {
        const c = i.getAttribute("entryId") ?? null, o = i.getAttribute("siteId") ?? null, _ = u.createContainerElement("div", {
          class: "cke-entry-card",
          "data-entry-id": c,
          "data-site-id": o
        });
        return g(i, u, _), qc(_, u);
      }
    }), A.for("dataDowncast").elementToElement({
      model: "craftEntryModel",
      view: (i, { writer: u }) => {
        const c = i.getAttribute("entryId") ?? null, o = i.getAttribute("siteId") ?? null;
        return u.createContainerElement("craft-entry", {
          "data-entry-id": c,
          "data-site-id": o
        });
      }
    });
    const g = (i, u, c) => {
      this._getCardHtml(i).then((o) => {
        const _ = u.createRawElement(
          "div",
          null,
          function(b) {
            b.innerHTML = o.cardHtml, Craft.appendHeadHtml(o.headHtml), Craft.appendBodyHtml(o.bodyHtml);
          }
        );
        u.insert(u.createPositionAt(c, 0), _);
        const m = this.editor;
        m.editing.view.focus(), setTimeout(() => {
          Craft.cp.elementThumbLoader.load($(m.ui.element));
        }, 100), m.model.change((b) => {
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
  async _getCardHtml(A) {
    var _, m, b;
    let g = A.getAttribute("cardHtml") ?? null, i = $(this.editor.sourceElement).parents(".field");
    const u = $(i[0]).data("layout-element");
    if (g)
      return { cardHtml: g };
    const c = A.getAttribute("entryId") ?? null, o = A.getAttribute("siteId") ?? null;
    try {
      const v = this.editor, C = $(v.ui.view.element).closest(
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
    } catch (v) {
      return console.error((_ = v == null ? void 0 : v.response) == null ? void 0 : _.data), { cardHtml: '<div class="element card"><div class="card-content"><div class="card-heading"><div class="label error"><span>' + (((b = (m = v == null ? void 0 : v.response) == null ? void 0 : m.data) == null ? void 0 : b.message) || "An unknown error occurred.") + "</span></div></div></div></div>" };
    }
  }
}
class pu extends Kc {
  constructor(A) {
    super(A), this.domEventType = "dblclick";
  }
  onDomEvent(A) {
    this.fire(A.type, A);
  }
}
class hu extends $o {
  constructor(A, g = {}) {
    super(A), this.bindTemplate, this.set("isFocused", !1), this.entriesUi = g.entriesUi, this.editor = this.entriesUi.editor;
    const i = this.editor.commands.get("insertEntry");
    let u = new yi(), c = new yi();
    if (this.entriesUi._getEntryTypeButtonsCollection(g.entryTypeOptions ?? []).forEach((o, _) => {
      let m = new vi();
      if (o.model.icon) {
        let b = ["btn", "icon", "cp-icon", "ck-reset_all-excluded"];
        o.model.color && b.push([o.model.color]), m.set({
          commandValue: o.model.commandValue,
          //entry type id
          label: o.model.label,
          icon: o.model.icon,
          withText: !1,
          tooltip: Craft.t("app", "New {type}", {
            type: o.model.label
          }),
          class: b.join(" ")
        }), u.add(m);
      } else
        c.add(o);
      this.listenTo(m, "execute", (b) => {
        this.entriesUi._showCreateEntrySlideout(b.source.commandValue);
      }), m.bind("isEnabled").to(i);
    }), c.length > 0) {
      const o = Ts(A);
      o.buttonView.set({
        label: Craft.t("ckeditor", "Add nested content"),
        icon: Qc,
        tooltip: !0,
        withText: !1
      }), o.bind("isEnabled").to(i), o.id = Craft.uuid(), Os(o, () => c, {
        ariaLabel: Craft.t("ckeditor", "Entry types list")
      }), this.listenTo(o, "execute", (_) => {
        this.entriesUi._showCreateEntrySlideout(_.source.commandValue);
      }), u.add(o);
    }
    this.setTemplate({
      tag: "div",
      attributes: {
        // ck-reset_all-excluded class is needed so that CKE doesn't mess with the styles we already have
        class: ["entry-type-buttons"],
        tabindex: -1
      },
      children: u
    });
  }
}
class mu extends Bn {
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
    this._createToolbarEntriesButtons(), this.editor.ui.componentFactory.add("editEntryBtn", (A) => this._createEditEntryBtn(A)), this._listenToEvents();
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
      getRelatedElement: (g) => {
        const i = g.getSelectedElement();
        return i && Gc(i) && i.hasClass("cke-entry-card") ? i : null;
      }
    });
  }
  /**
   * Hook up event listeners
   *
   * @private
   */
  _listenToEvents() {
    const A = this.editor.editing.view, g = A.document;
    A.addObserver(pu), this.editor.listenTo(g, "dblclick", (i, u) => {
      const c = this.editor.editing.mapper.toModelElement(
        u.target.parent
      );
      c.name === "craftEntryModel" && this._initEditEntrySlideout(u, c);
    });
  }
  _initEditEntrySlideout(A = null, g = null) {
    g === null && (g = this.editor.model.document.selection.getSelectedElement());
    const i = g.getAttribute("entryId"), u = g.getAttribute("siteId") ?? null;
    this._showEditEntrySlideout(i, u, g);
  }
  /**
   * Creates toolbar buttons that allow for an entry of given type to be inserted into the editor
   *
   * @private
   */
  _createToolbarEntriesButtons() {
    const g = this.editor.config.get("entryTypeOptions");
    !g || !g.length || this.editor.ui.componentFactory.add(
      "createEntry",
      (i) => new hu(i, {
        entriesUi: this,
        entryTypeOptions: g
      })
    );
  }
  /**
   * Creates a list of entry type options that go into the insert entry button
   *
   * @param options
   * @returns {Collection<Record<string, any>>}
   * @private
   */
  _getEntryTypeButtonsCollection(A) {
    const g = new yi();
    return A.map((i) => {
      const u = {
        type: "button",
        model: new Sa({
          commandValue: i.value,
          //entry type id
          label: i.label || i.value,
          icon: i.icon,
          color: i.color,
          withText: !0
        })
      };
      g.add(u);
    }), g;
  }
  /**
   * Creates an edit entry button that shows in the contextual balloon for each craft entry widget
   * @param locale
   * @returns {ButtonView}
   * @private
   */
  _createEditEntryBtn(A) {
    const g = new vi(A);
    return g.set({
      isEnabled: !0,
      label: Craft.t("app", "Edit {type}", {
        type: Craft.elementTypeNames["craft\\elements\\Entry"][2]
      }),
      tooltip: !0,
      withText: !0
    }), this.listenTo(g, "execute", (i) => {
      this._initEditEntrySlideout();
    }), g;
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
  _getCardElement(A) {
    return $(this.editor.ui.element).find('.element.card[data-id="' + A + '"]');
  }
  /**
   * Opens an element editor for existing entry
   *
   * @param entryId
   * @private
   */
  _showEditEntrySlideout(A, g, i) {
    const u = this.editor, c = u.model, o = this.getElementEditor();
    let _ = this._getCardElement(A);
    const m = _.data("owner-id"), b = Craft.createElementEditor(this.elementType, null, {
      elementId: A,
      params: {
        siteId: g
      },
      onLoad: () => {
        b.elementEditor.on("update", () => {
          Craft.Preview.refresh();
        });
      },
      onBeforeSubmit: async () => {
        if (_ !== null && Garnish.hasAttr(_, "data-owner-is-canonical") && !o.settings.isUnpublishedDraft) {
          await b.elementEditor.checkForm(!0, !0);
          let v = $(u.sourceElement).attr("name");
          o && v && await o.setFormValue(v, "*"), o.settings.draftId && b.elementEditor.settings.draftId && (b.elementEditor.settings.saveParams || (b.elementEditor.settings.saveParams = {}), b.elementEditor.settings.saveParams.action = "elements/save-nested-element-for-derivative", b.elementEditor.settings.saveParams.newOwnerId = o.getDraftElementId(m));
        }
      },
      onSubmit: (v) => {
        let y = this._getCardElement(A);
        y !== null && v.data.id != y.data("id") && (y.attr("data-id", v.data.id).data("id", v.data.id).data("owner-id", v.data.ownerId), u.editing.model.change((C) => {
          C.setAttribute("entryId", v.data.id, i), u.ui.update();
        }), Craft.refreshElementInstances(v.data.id));
      }
    });
    b.on("beforeClose", () => {
      c.change((v) => {
        v.setSelection(v.createPositionAfter(i)), u.editing.view.focus();
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
  async _showCreateEntrySlideout(A) {
    var y, C;
    const g = this.editor, i = g.model, c = i.document.selection.getFirstRange(), o = g.config.get(
      "nestedElementAttributes"
    ), _ = Object.assign({}, o, {
      typeId: A
    }), m = this.getElementEditor();
    m && (await m.markDeltaNameAsModified(g.sourceElement.name), _.ownerId = m.getDraftElementId(
      o.ownerId
    ));
    let b;
    try {
      b = (await Craft.sendActionRequest(
        "POST",
        "elements/create",
        {
          data: _
        }
      )).data;
    } catch (x) {
      throw Craft.cp.displayError((C = (y = x == null ? void 0 : x.response) == null ? void 0 : y.data) == null ? void 0 : C.error), x;
    }
    const v = Craft.createElementEditor(this.elementType, {
      elementId: b.element.id,
      draftId: b.element.draftId,
      params: {
        fresh: 1,
        siteId: b.element.siteId
      },
      onSubmit: (x) => {
        g.commands.execute("insertEntry", {
          entryId: x.data.id,
          siteId: x.data.siteId
        });
      }
    });
    v.on("beforeClose", () => {
      v.$triggerElement = null, i.change((x) => {
        x.setSelection(
          x.createPositionAt(
            g.model.document.getRoot(),
            c.end.path[0]
          )
        );
      }), g.editing.view.focus();
    });
  }
}
class gu extends Bn {
  static get requires() {
    return [fu, mu];
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
class bu extends Bn {
  static get pluginName() {
    return "CraftLinkEditing";
  }
  constructor() {
    super(...arguments), this.conversionData = [], this.editor.config.define("advancedLinkFields", []);
  }
  init() {
    const g = this.editor.config.get("advancedLinkFields");
    this.conversionData = g.map((i) => i.conversion ?? null).filter((i) => i), this._defineSchema(), this._defineConverters(), this._adjustLinkCommand(), this._adjustUnlinkCommand();
  }
  _defineSchema() {
    const A = this.editor.model.schema;
    let g = this.conversionData.map((i) => i.model);
    A.extend("$text", {
      allowAttributes: g
    });
  }
  _defineConverters() {
    const A = this.editor.conversion;
    for (let g = 0; g < this.conversionData.length; g++)
      A.for("downcast").attributeToElement({
        model: this.conversionData[g].model,
        view: (i, { writer: u }) => {
          const c = u.createAttributeElement(
            "a",
            { [this.conversionData[g].view]: i },
            { priority: 5 }
          );
          return u.setCustomProperty("link", !0, c), c;
        }
      }), A.for("upcast").attributeToAttribute({
        view: {
          name: "a",
          key: this.conversionData[g].view
        },
        model: {
          key: this.conversionData[g].model,
          value: (i, u) => i.getAttribute(this.conversionData[g].view)
        }
      });
  }
  _adjustLinkCommand() {
    const A = this.editor, g = A.commands.get("link");
    let i = !1;
    g.on(
      "execute",
      (u, c) => {
        if (i) {
          i = !1;
          return;
        }
        u.stop(), i = !0;
        const o = c[c.length - 1], _ = A.model.document.selection;
        A.model.change((m) => {
          A.execute("link", ...c);
          const b = _.getFirstPosition();
          this.conversionData.forEach((v) => {
            if (_.isCollapsed) {
              const y = b.textNode || b.nodeBefore;
              o[v.model] ? m.setAttribute(
                v.model,
                o[v.model],
                m.createRangeOn(y)
              ) : m.removeAttribute(v.model, m.createRangeOn(y));
            } else {
              const y = A.model.schema.getValidRanges(
                _.getRanges(),
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
    const A = this.editor, g = A.commands.get("unlink"), { model: i } = A, { selection: u } = i.document;
    let c = !1;
    g.on(
      "execute",
      (o) => {
        c || (o.stop(), i.change(() => {
          c = !0, A.execute("unlink"), c = !1, i.change((_) => {
            let m;
            this.conversionData.forEach((b) => {
              u.isCollapsed ? m = [
                Xc(
                  u.getFirstPosition(),
                  b.model,
                  u.getAttribute(b.model),
                  i
                )
              ] : m = i.schema.getValidRanges(
                u.getRanges(),
                b.model
              );
              for (const v of m)
                _.removeAttribute(b.model, v);
            });
          });
        }));
      },
      { priority: "high" }
    );
  }
}
class yu extends $o {
  constructor(A, g = {}) {
    super(A), this.bindTemplate, this.set("isFocused", !1), this.linkUi = g.linkUi, this.editor = this.linkUi.editor, this.elementId = this.linkUi._getLinkElementId(), this.siteId = this.linkUi._getLinkSiteId(), this.linkOption = g.linkOption;
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
    const A = this.linkUi, g = A._linkUI, i = this.linkOption;
    this.element.addEventListener("click", function(u) {
      (this.children[0].classList.contains("add") || u.target.classList.contains("ck-button__label")) && (g._hideUI(), A._showElementSelectorModal(i));
    }), this.element.children.length == 0 && Craft.sendActionRequest("POST", "app/render-elements", {
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
    }).then((u) => {
      if (Object.keys(u.data.elements).length > 0) {
        this.element.innerHTML = u.data.elements[this.elementId][0], Craft.appendHeadHtml(u.data.headHtml), Craft.appendBodyHtml(u.data.bodyHtml);
        let c = this.element.firstChild;
        const o = [
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
        Craft.addActionsToChip(c, o), A._alignFocus();
      }
    }).catch((u) => {
      var c, o, _, m;
      throw Craft.cp.displayError((o = (c = u == null ? void 0 : u.response) == null ? void 0 : c.data) == null ? void 0 : o.message), ((m = (_ = u == null ? void 0 : u.response) == null ? void 0 : _.data) == null ? void 0 : m.message) ?? u;
    });
  }
}
class vu extends $o {
  constructor(A, g = {}) {
    super(A);
    const i = this.bindTemplate;
    this.set("label", Craft.t("app", "Advanced")), this.linkUi = g.linkUi, this.editor = this.linkUi.editor, this.children = this.createCollection(), this.advancedChildren = this.createCollection(), this.setTemplate({
      tag: "details",
      attributes: {
        class: ["ck", "ck-form__details", "link-type-advanced"]
      },
      children: this.children
    }), this.summary = new $o(A), this.summary.setTemplate({
      tag: "summary",
      attributes: {
        class: ["ck", "ck-form__details__summary"]
      },
      children: [{ text: i.to("label") }]
    }), this.children.add(this.summary), this.advancedFieldsContainer = new $o(A), this.advancedFieldsContainer.setTemplate({
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
  onToggle(A) {
    const { formView: g } = this.linkUi._linkUI;
    if (A.target.open) {
      const i = g._focusables.getIndex(this);
      this.advancedChildren._items.forEach((u, c) => {
        g._focusables.add(u, i + c + 1), g.focusTracker.add(u.element, i + c + 1);
      });
    } else
      this.advancedChildren._items.forEach((i, u) => {
        g._focusables.remove(i), g.focusTracker.remove(i.element);
      });
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class ku extends Bn {
  static get requires() {
    return [Xl];
  }
  static get pluginName() {
    return "CraftLinkUI";
  }
  constructor() {
    super(...arguments), this.linkTypeWrapperView = null, this.advancedView = null, this.linkTypeDropdownView = null, this.linkTypeDropdownItemModels = [], this.elementTypeRefHandleRE = null, this.urlWithRefHandleRE = null, this.conversionData = [], this.linkOptions = [], this.advancedLinkFields = [], this.editor.config.define("linkOptions", []), this.editor.config.define("advancedLinkFields", []);
  }
  init() {
    const A = this.editor;
    this._linkUI = A.plugins.get(Xl), this._balloon = A.plugins.get(Zc), this.linkOptions = A.config.get("linkOptions"), this.advancedLinkFields = A.config.get("advancedLinkFields"), this.conversionData = this.advancedLinkFields.map((i) => i.conversion ?? null).filter((i) => i);
    const g = CKE_LOCALIZED_REF_HANDLES.join("|");
    this.elementTypeRefHandleRE = new RegExp(
      `(#((?:${g})):\\d+)`
    ), this.urlWithRefHandleRE = new RegExp(
      `(.+)(#((?:${g})):(\\d+))(?:@(\\d+))?`
    ), this._modifyFormViewTemplate(), this._balloon.on(
      "set:visibleView",
      (i, u, c, o) => {
        const { formView: _ } = this._linkUI;
        c === o || c !== _ || this._alignFocus();
      }
    );
  }
  /**
   * Reset focus order of the extra fields we're adding to the link form view
   */
  _alignFocus() {
    const { formView: A } = this._linkUI;
    let g = 0;
    this.linkTypeWrapperView && (this.linkTypeWrapperView._unboundChildren._items.forEach((i) => {
      A._focusables.has(i) && A._focusables.remove(i), A.focusTracker.remove(i.element), A._focusables.add(i, g), A.focusTracker.add(i.element, g), g++;
    }), this.advancedView !== null && (A._focusables.has(this.advancedView) && A._focusables.remove(this.advancedView), A.focusTracker.remove(this.advancedView), A._focusables.add(this.advancedView, g), A.focusTracker.add(this.advancedView.element, g)));
  }
  /**
   * Add all our custom fields (for element linking and advanced fields) to the link form view.
   */
  _modifyFormViewTemplate() {
    this._linkUI.formView || this._linkUI._createViews();
    const { formView: A } = this._linkUI;
    A.template.attributes.class.push(
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
  _urlInputRefMatch(A) {
    return this._urlInputValue().match(A);
  }
  ////////////////////// Link Options Dropdown (link types) //////////////////////
  /**
   * Create a link type dropdown.
   */
  _linkOptionsDropdown() {
    const { formView: A } = this._linkUI, { urlInputView: g } = A, { fieldView: i } = g;
    this.linkTypeDropdownView = Ts(A.locale), this.linkTypeDropdownView.buttonView.set({
      label: "",
      withText: !0,
      isVisible: !0
    }), this.linkTypeDropdownItemModels = Object.fromEntries(
      this._getLinkListItemDefinitions().map((u) => [u.handle, u])
    ), Os(
      this.linkTypeDropdownView,
      new yi([
        ...this._getLinkListItemDefinitions().map((u) => ({
          type: "button",
          model: this.linkTypeDropdownItemModels[u.handle]
        }))
      ])
    ), i.isEmpty && this._showLinkTypeForm("default"), this.linkTypeDropdownView.on("execute", (u) => {
      if (u.source.linkOption) {
        const c = u.source.linkOption;
        this._selectLinkTypeDropdownItem(c.refHandle), this._showLinkTypeForm(c, A);
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
    let A = null;
    const g = this._urlInputValue().match(this.elementTypeRefHandleRE);
    return g && (A = g[2], A && typeof this.linkTypeDropdownItemModels[A] > "u" && (A = null)), A;
  }
  /**
   * Get element ID from the URL field value.
   */
  _getLinkElementId() {
    let A = null;
    const g = this._urlInputRefMatch(this.urlWithRefHandleRE);
    return g && (A = g[4] ? parseInt(g[4], 10) : null), A;
  }
  /**
   * Get site ID from the URL field value.
   */
  _getLinkSiteId() {
    let A = null;
    const g = this._urlInputRefMatch(this.urlWithRefHandleRE);
    return g && (A = g[5] ? parseInt(g[5], 10) : null), A;
  }
  /**
   * Toggle between element link and default URL link fields.
   */
  _toggleLinkTypeDropdownView() {
    let A = this._getLinkElementRefHandle();
    A ? (this.linkTypeDropdownView.buttonView.set("isVisible", !0), this._selectLinkTypeDropdownItem(A)) : this._selectLinkTypeDropdownItem("default");
  }
  /**
   * Select link type from the dropdown.
   */
  _selectLinkTypeDropdownItem(A) {
    const g = this.linkTypeDropdownItemModels[A], i = A ? Craft.t("app", "{name}", { name: g.label }) : g.label;
    this.linkTypeDropdownView.buttonView.set("label", i), Object.values(this.linkTypeDropdownItemModels).forEach((u) => {
      u.set("isOn", u.handle === g.handle);
    });
  }
  /**
   * Get a list of all the options that should be shown in the link type dropdown.
   */
  _getLinkListItemDefinitions() {
    const A = [];
    for (const g of this.linkOptions)
      A.push(
        new Sa({
          label: g.label,
          handle: g.refHandle,
          linkOption: g,
          withText: !0
        })
      );
    return A.push(
      new Sa({
        label: Craft.t("app", "URL"),
        handle: "default",
        withText: !0
      })
    ), A;
  }
  /**
   * Place the link type fields in the form.
   */
  _showLinkTypeForm(A) {
    let g = null;
    const { formView: i } = this._linkUI, { children: u } = i, { urlInputView: c } = i, { displayedTextInputView: o } = i;
    o.focus(), this.linkTypeWrapperView !== null && u.remove(this.linkTypeWrapperView), A === "default" ? g = c : (this._getLinkSiteId(), this._getLinkElementId(), g = new yu(i.locale, {
      linkUi: this,
      linkOption: A,
      value: this._urlInputValue()
    })), this.linkTypeWrapperView = new $o(), this.linkTypeWrapperView.setTemplate({
      tag: "div",
      children: [this.linkTypeDropdownView, g],
      attributes: {
        class: [
          "ck",
          "ck-form__row",
          "ck-form__row_large-top-padding",
          "link-type-group",
          "flex"
        ]
      }
    }), u.add(this.linkTypeWrapperView, 2);
  }
  /**
   * Show element selector modal for given element type (link option).
   */
  _showElementSelectorModal(A) {
    const g = this.editor, i = g.model, u = i.document.selection, c = u.isCollapsed, o = u.getFirstRange(), _ = this._linkUI._getSelectedLinkElement(), m = () => {
      g.editing.view.focus(), !c && o && i.change((b) => {
        b.setSelection(o);
      }), this._linkUI._hideFakeVisualSelection();
    };
    _ || this._linkUI._showFakeVisualSelection(), Craft.createElementSelectorModal(A.elementType, {
      storageKey: `ckeditor:${this.pluginName}:${A.elementType}`,
      sources: A.sources,
      criteria: A.criteria,
      defaultSiteId: g.config.get("elementSiteId"),
      autoFocusSearchBox: !1,
      onSelect: (b) => {
        if (b.length) {
          const v = b[0], y = `${v.url}#${A.refHandle}:${v.id}@${v.siteId}`;
          if (g.editing.view.focus(), (!c || _) && o) {
            i.change((N) => {
              N.setSelection(o);
            });
            const C = g.commands.get("link");
            let x = this._getAdvancedFieldValues();
            C.execute(y, x);
          } else
            i.change((C) => {
              let x = this._getAdvancedFieldValues();
              if (C.insertText(
                v.label,
                {
                  linkHref: y
                },
                u.getFirstPosition(),
                x
              ), o instanceof Jc)
                try {
                  const N = o.clone();
                  N.end.path[1] += v.label.length, C.setSelection(N);
                } catch {
                }
            });
          this._linkUI._hideFakeVisualSelection(), setTimeout(() => {
            this._linkUI._showUI(!0);
          }, 100);
        } else
          m();
      },
      onCancel: () => {
        m();
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
    const A = this.editor.commands.get("link"), { formView: g } = this._linkUI, { children: i } = g;
    this.advancedView = new vu(g.locale, {
      linkUi: this
    }), i.add(this.advancedView, 3);
    for (const c of this.advancedLinkFields) {
      let o = (u = c.conversion) == null ? void 0 : u.model;
      if (o && typeof g[o] > "u")
        if (c.conversion.type === "bool") {
          const _ = new eu();
          _.set({
            withText: !0,
            label: c.label,
            isToggleable: !0
          }), c.tooltip && (_.tooltip = c.tooltip), this.advancedView.advancedChildren.add(_), g[o] = _, g[o].bind("isOn").to(A, o, (m) => m === void 0 ? (g[o].element.value = "", !1) : (g[o].element.value = c.conversion.value, !0)), _.on("execute", () => {
            _.isOn ? (_.isOn = !1, g[o].element.value = "") : (_.isOn = !0, g[o].element.value = c.conversion.value);
          });
        } else {
          let _ = this._addLabeledField(c);
          g[o] = _, g[o].fieldView.bind("value").to(A, o), g[o].fieldView.element.value = A[o] || "";
        }
      else if (c.value === "urlSuffix") {
        let _ = this._addLabeledField(c);
        this.listenTo(
          _.fieldView,
          "change:isFocused",
          (m, b, v, y) => {
            if (v !== y && !v) {
              let C = m.source.element.value, x = null;
              const N = this._urlInputRefMatch(this.urlWithRefHandleRE);
              N ? x = N[1] : x = this._urlInputValue();
              try {
                let G = new URL(x), K = G.search, j = G.hash, B = x.replace(j, "").replace(K, "");
                const P = this._urlInputValue().replace(
                  x,
                  B + C
                );
                g.urlInputView.fieldView.set("value", P);
              } catch {
                let [K, j] = x.split("#"), [B, P] = K.split("?");
                const I = this._urlInputValue().replace(
                  x,
                  B + C
                );
                g.urlInputView.fieldView.set("value", I);
              }
            }
          }
        ), this.listenTo(g.urlInputView.fieldView, "change:value", (m) => {
          this._toggleUrlSuffixInputView(_, m.source.isEmpty);
        }), this.listenTo(
          g.urlInputView.fieldView,
          "change:isFocused",
          (m) => {
            this._toggleUrlSuffixInputView(_, m.source.isEmpty);
          }
        );
      }
    }
  }
  /**
   * Create a labeled field for given advanced field.
   */
  _addLabeledField(A) {
    const { formView: g } = this._linkUI;
    let i = new tu(
      g.locale,
      nu
    );
    return i.label = A.label, A.tooltip && (i.infoText = A.tooltip), this.advancedView.advancedChildren.add(i), i;
  }
  /**
   * Populate URL suffix advanced field with content.
   * e.g. if a query string was added directly to the default URL input field,
   * ensure the value is also showing in the URL Suffix advanced field.
   */
  _toggleUrlSuffixInputView(A, g) {
    if (g)
      A.fieldView.set("value", "");
    else {
      const i = this._urlInputRefMatch(this.urlWithRefHandleRE);
      let u = null;
      i ? u = i[1] : u = this._urlInputValue();
      try {
        let c = new URL(u), o = c.search, _ = c.hash;
        A.fieldView.set("value", o + _);
      } catch {
        let [o, _] = u.split("#"), [m, b] = o.split("?");
        _ = _ ? "#" + _ : "", b = b ? "?" + b : "", A.fieldView.set("value", b + _);
      }
    }
  }
  /**
   * When link form is submitted, pass the advanced field values the link command.
   */
  _handleAdvancedLinkFieldsFormSubmit() {
    const g = this.editor.commands.get("link"), { formView: i } = this._linkUI;
    i.on(
      "submit",
      () => {
        let u = this._getAdvancedFieldValues();
        g.once(
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
    const A = this.editor, g = A.commands.get("link"), i = A.model.document.selection;
    this.conversionData.forEach((u) => {
      g.set(u.model, null), A.model.document.on("change", () => {
        g[u.model] = i.getAttribute(u.model);
      });
    });
  }
  /**
   * Get the values of all the advanced fields.
   */
  _getAdvancedFieldValues() {
    const { formView: A } = this._linkUI;
    let g = {};
    return this.conversionData.forEach((i) => {
      let u = [];
      i.type === "bool" ? u[i.model] = A[i.model].element.value : u[i.model] = A[i.model].fieldView.element.value, Object.assign(g, u);
    }), g;
  }
}
class Ru extends Bn {
  static get requires() {
    return [bu, ku];
  }
  static get pluginName() {
    return "CraftLink";
  }
}
function wu(xe) {
  return xe && xe.__esModule && Object.prototype.hasOwnProperty.call(xe, "default") ? xe.default : xe;
}
var Ss = { exports: {} };
/*! For license information please see inspector.js.LICENSE.txt */
var Zl;
function Eu() {
  return Zl || (Zl = 1, function(xe, A) {
    (function(g, i) {
      xe.exports = i();
    })(window, function() {
      return function(g) {
        var i = {};
        function u(c) {
          if (i[c]) return i[c].exports;
          var o = i[c] = { i: c, l: !1, exports: {} };
          return g[c].call(o.exports, o, o.exports, u), o.l = !0, o.exports;
        }
        return u.m = g, u.c = i, u.d = function(c, o, _) {
          u.o(c, o) || Object.defineProperty(c, o, { enumerable: !0, get: _ });
        }, u.r = function(c) {
          typeof Symbol < "u" && Symbol.toStringTag && Object.defineProperty(c, Symbol.toStringTag, { value: "Module" }), Object.defineProperty(c, "__esModule", { value: !0 });
        }, u.t = function(c, o) {
          if (1 & o && (c = u(c)), 8 & o || 4 & o && typeof c == "object" && c && c.__esModule) return c;
          var _ = /* @__PURE__ */ Object.create(null);
          if (u.r(_), Object.defineProperty(_, "default", { enumerable: !0, value: c }), 2 & o && typeof c != "string") for (var m in c) u.d(_, m, (function(b) {
            return c[b];
          }).bind(null, m));
          return _;
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
      }([function(g, i, u) {
        g.exports = u(21);
      }, function(g, i, u) {
        u.d(i, "a", function() {
          return o;
        }), u.d(i, "b", function() {
          return _;
        }), u.d(i, "c", function() {
          return m;
        });
        var c = u(19);
        function o(v, y = !0) {
          if (v === void 0) return "undefined";
          if (typeof v == "function") return "function() {…}";
          const C = Object(c.stringify)(v, b, null, { maxDepth: 2 });
          return y ? C : C.replace(/(^"|"$)/g, "");
        }
        function _(v) {
          const y = {};
          for (const C in v) y[C] = v[C], y[C].value = o(y[C].value);
          return y;
        }
        function m(v, y) {
          return v.length > y ? v.substr(0, y) + `… [${v.length - y} characters left]` : v;
        }
        function b(v, y, C) {
          return typeof v == "string" ? `"${v.replace("'", '"')}"` : C(v);
        }
      }, function(g, i, u) {
        function c(N) {
          return N && N.name;
        }
        function o(N) {
          return N && c(N) && N.is("attributeElement");
        }
        function _(N) {
          return N && c(N) && N.is("emptyElement");
        }
        function m(N) {
          return N && c(N) && N.is("uiElement");
        }
        function b(N) {
          return N && c(N) && N.is("rawElement");
        }
        function v(N) {
          return N && c(N) && N.is("editableElement");
        }
        function y(N) {
          return N && N.is("rootElement");
        }
        function C(N) {
          return { path: [...N.parent.getPath(), N.offset], offset: N.offset, isAtEnd: N.isAtEnd, isAtStart: N.isAtStart, parent: x(N.parent) };
        }
        function x(N) {
          return c(N) ? o(N) ? "attribute:" + N.name : y(N) ? "root:" + N.name : "container:" + N.name : N.data;
        }
        u.d(i, "d", function() {
          return c;
        }), u.d(i, "b", function() {
          return o;
        }), u.d(i, "e", function() {
          return _;
        }), u.d(i, "h", function() {
          return m;
        }), u.d(i, "f", function() {
          return b;
        }), u.d(i, "c", function() {
          return v;
        }), u.d(i, "g", function() {
          return y;
        }), u.d(i, "a", function() {
          return C;
        });
      }, function(g, i, u) {
        u.d(i, "a", function() {
          return c;
        });
        class c {
          static group(..._) {
            console.group(..._);
          }
          static groupEnd(..._) {
            console.groupEnd(..._);
          }
          static log(..._) {
            console.log(..._);
          }
          static warn(..._) {
            console.warn(..._);
          }
        }
      }, function(g, i, u) {
        function c(b) {
          return b && b.is("element");
        }
        function o(b) {
          return b && b.is("rootElement");
        }
        function _(b) {
          return b.getPath ? b.getPath() : b.path;
        }
        function m(b) {
          return { path: _(b), stickiness: b.stickiness, index: b.index, isAtEnd: b.isAtEnd, isAtStart: b.isAtStart, offset: b.offset, textNode: b.textNode && b.textNode.data };
        }
        u.d(i, "c", function() {
          return c;
        }), u.d(i, "d", function() {
          return o;
        }), u.d(i, "b", function() {
          return _;
        }), u.d(i, "a", function() {
          return m;
        });
      }, function(g, i, u) {
        (function(c, o) {
          var _ = "[object Arguments]", m = "[object Map]", b = "[object Object]", v = "[object Set]", y = /^\[object .+?Constructor\]$/, C = /^(?:0|[1-9]\d*)$/, x = {};
          x["[object Float32Array]"] = x["[object Float64Array]"] = x["[object Int8Array]"] = x["[object Int16Array]"] = x["[object Int32Array]"] = x["[object Uint8Array]"] = x["[object Uint8ClampedArray]"] = x["[object Uint16Array]"] = x["[object Uint32Array]"] = !0, x[_] = x["[object Array]"] = x["[object ArrayBuffer]"] = x["[object Boolean]"] = x["[object DataView]"] = x["[object Date]"] = x["[object Error]"] = x["[object Function]"] = x[m] = x["[object Number]"] = x[b] = x["[object RegExp]"] = x[v] = x["[object String]"] = x["[object WeakMap]"] = !1;
          var N = typeof c == "object" && c && c.Object === Object && c, G = typeof self == "object" && self && self.Object === Object && self, K = N || G || Function("return this")(), j = i && !i.nodeType && i, B = j && typeof o == "object" && o && !o.nodeType && o, P = B && B.exports === j, I = P && N.process, V = function() {
            try {
              return I && I.binding && I.binding("util");
            } catch {
            }
          }(), R = V && V.isTypedArray;
          function oe(H, ae) {
            for (var ke = -1, Ce = H == null ? 0 : H.length; ++ke < Ce; ) if (ae(H[ke], ke, H)) return !0;
            return !1;
          }
          function Q(H) {
            var ae = -1, ke = Array(H.size);
            return H.forEach(function(Ce, it) {
              ke[++ae] = [it, Ce];
            }), ke;
          }
          function z(H) {
            var ae = -1, ke = Array(H.size);
            return H.forEach(function(Ce) {
              ke[++ae] = Ce;
            }), ke;
          }
          var M, se, le, te = Array.prototype, ce = Function.prototype, ye = Object.prototype, J = K["__core-js_shared__"], de = ce.toString, D = ye.hasOwnProperty, ie = (M = /[^.]+$/.exec(J && J.keys && J.keys.IE_PROTO || "")) ? "Symbol(src)_1." + M : "", be = ye.toString, Te = RegExp("^" + de.call(D).replace(/[\\^$.*+?()[\]{}|]/g, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"), we = P ? K.Buffer : void 0, Pe = K.Symbol, Se = K.Uint8Array, ze = ye.propertyIsEnumerable, Je = te.splice, X = Pe ? Pe.toStringTag : void 0, Y = Object.getOwnPropertySymbols, me = we ? we.isBuffer : void 0, l = (se = Object.keys, le = Object, function(H) {
            return se(le(H));
          }), f = gn(K, "DataView"), w = gn(K, "Map"), U = gn(K, "Promise"), F = gn(K, "Set"), W = gn(K, "WeakMap"), he = gn(Object, "create"), je = bn(f), Re = bn(w), Xe = bn(U), He = bn(F), At = bn(W), kt = Pe ? Pe.prototype : void 0, Jt = kt ? kt.valueOf : void 0;
          function wt(H) {
            var ae = -1, ke = H == null ? 0 : H.length;
            for (this.clear(); ++ae < ke; ) {
              var Ce = H[ae];
              this.set(Ce[0], Ce[1]);
            }
          }
          function gt(H) {
            var ae = -1, ke = H == null ? 0 : H.length;
            for (this.clear(); ++ae < ke; ) {
              var Ce = H[ae];
              this.set(Ce[0], Ce[1]);
            }
          }
          function cn(H) {
            var ae = -1, ke = H == null ? 0 : H.length;
            for (this.clear(); ++ae < ke; ) {
              var Ce = H[ae];
              this.set(Ce[0], Ce[1]);
            }
          }
          function Er(H) {
            var ae = -1, ke = H == null ? 0 : H.length;
            for (this.__data__ = new cn(); ++ae < ke; ) this.add(H[ae]);
          }
          function Tt(H) {
            var ae = this.__data__ = new gt(H);
            this.size = ae.size;
          }
          function pt(H, ae) {
            var ke = ar(H), Ce = !ke && ir(H), it = !ke && !Ce && Cn(H), qe = !ke && !Ce && !it && Gr(H), st = ke || Ce || it || qe, tt = st ? function(bt, Pt) {
              for (var tn = -1, ht = Array(bt); ++tn < bt; ) ht[tn] = Pt(tn);
              return ht;
            }(H.length, String) : [], Ot = tt.length;
            for (var nt in H) !D.call(H, nt) || st && (nt == "length" || it && (nt == "offset" || nt == "parent") || qe && (nt == "buffer" || nt == "byteLength" || nt == "byteOffset") || Cr(nt, Ot)) || tt.push(nt);
            return tt;
          }
          function Yn(H, ae) {
            for (var ke = H.length; ke--; ) if (Tr(H[ke][0], ae)) return ke;
            return -1;
          }
          function Sn(H) {
            return H == null ? H === void 0 ? "[object Undefined]" : "[object Null]" : X && X in Object(H) ? function(ae) {
              var ke = D.call(ae, X), Ce = ae[X];
              try {
                ae[X] = void 0;
                var it = !0;
              } catch {
              }
              var qe = be.call(ae);
              return it && (ke ? ae[X] = Ce : delete ae[X]), qe;
            }(H) : function(ae) {
              return be.call(ae);
            }(H);
          }
          function or(H) {
            return On(H) && Sn(H) == _;
          }
          function _r(H, ae, ke, Ce, it) {
            return H === ae || (H == null || ae == null || !On(H) && !On(ae) ? H != H && ae != ae : function(qe, st, tt, Ot, nt, bt) {
              var Pt = ar(qe), tn = ar(st), ht = Pt ? "[object Array]" : ut(qe), Vt = tn ? "[object Array]" : ut(st), Pn = (ht = ht == _ ? b : ht) == b, ct = (Vt = Vt == _ ? b : Vt) == b, yn = ht == Vt;
              if (yn && Cn(qe)) {
                if (!Cn(st)) return !1;
                Pt = !0, Pn = !1;
              }
              if (yn && !Pn) return bt || (bt = new Tt()), Pt || Gr(qe) ? Yt(qe, st, tt, Ot, nt, bt) : function(rt, Ue, qn, Kt, Or, Mt, nn) {
                switch (qn) {
                  case "[object DataView]":
                    if (rt.byteLength != Ue.byteLength || rt.byteOffset != Ue.byteOffset) return !1;
                    rt = rt.buffer, Ue = Ue.buffer;
                  case "[object ArrayBuffer]":
                    return !(rt.byteLength != Ue.byteLength || !Mt(new Se(rt), new Se(Ue)));
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
                    if (Wt || (Wt = z), rt.size != Ue.size && !Qt) return !1;
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
                var un = Pn && D.call(qe, "__wrapped__"), Nn = ct && D.call(st, "__wrapped__");
                if (un || Nn) {
                  var Eo = un ? qe.value() : qe, _o = Nn ? st.value() : st;
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
                  var dr = rt[rn], vn = Ue[rn];
                  if (Kt) var Ut = nn ? Kt(vn, dr, rn, Ue, rt, Mt) : Kt(dr, vn, rn, rt, Ue, Mt);
                  if (!(Ut === void 0 ? dr === vn || Or(dr, vn, qn, Kt, Mt) : Ut)) {
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
            }(H, ae, ke, Ce, _r, it));
          }
          function wo(H) {
            return !(!lr(H) || function(ae) {
              return !!ie && ie in ae;
            }(H)) && (sr(H) ? Te : y).test(bn(H));
          }
          function en(H) {
            if (ke = (ae = H) && ae.constructor, Ce = typeof ke == "function" && ke.prototype || ye, ae !== Ce) return l(H);
            var ae, ke, Ce, it = [];
            for (var qe in Object(H)) D.call(H, qe) && qe != "constructor" && it.push(qe);
            return it;
          }
          function Yt(H, ae, ke, Ce, it, qe) {
            var st = 1 & ke, tt = H.length, Ot = ae.length;
            if (tt != Ot && !(st && Ot > tt)) return !1;
            var nt = qe.get(H);
            if (nt && qe.get(ae)) return nt == ae;
            var bt = -1, Pt = !0, tn = 2 & ke ? new Er() : void 0;
            for (qe.set(H, ae), qe.set(ae, H); ++bt < tt; ) {
              var ht = H[bt], Vt = ae[bt];
              if (Ce) var Pn = st ? Ce(Vt, ht, bt, ae, H, qe) : Ce(ht, Vt, bt, H, ae, qe);
              if (Pn !== void 0) {
                if (Pn) continue;
                Pt = !1;
                break;
              }
              if (tn) {
                if (!oe(ae, function(ct, yn) {
                  if (un = yn, !tn.has(un) && (ht === ct || it(ht, ct, ke, Ce, qe))) return tn.push(yn);
                  var un;
                })) {
                  Pt = !1;
                  break;
                }
              } else if (ht !== Vt && !it(ht, Vt, ke, Ce, qe)) {
                Pt = !1;
                break;
              }
            }
            return qe.delete(H), qe.delete(ae), Pt;
          }
          function xr(H) {
            return function(ae, ke, Ce) {
              var it = ke(ae);
              return ar(ae) ? it : function(qe, st) {
                for (var tt = -1, Ot = st.length, nt = qe.length; ++tt < Ot; ) qe[nt + tt] = st[tt];
                return qe;
              }(it, Ce(ae));
            }(H, Xr, Sr);
          }
          function qt(H, ae) {
            var ke, Ce, it = H.__data__;
            return ((Ce = typeof (ke = ae)) == "string" || Ce == "number" || Ce == "symbol" || Ce == "boolean" ? ke !== "__proto__" : ke === null) ? it[typeof ae == "string" ? "string" : "hash"] : it.map;
          }
          function gn(H, ae) {
            var ke = function(Ce, it) {
              return Ce == null ? void 0 : Ce[it];
            }(H, ae);
            return wo(ke) ? ke : void 0;
          }
          wt.prototype.clear = function() {
            this.__data__ = he ? he(null) : {}, this.size = 0;
          }, wt.prototype.delete = function(H) {
            var ae = this.has(H) && delete this.__data__[H];
            return this.size -= ae ? 1 : 0, ae;
          }, wt.prototype.get = function(H) {
            var ae = this.__data__;
            if (he) {
              var ke = ae[H];
              return ke === "__lodash_hash_undefined__" ? void 0 : ke;
            }
            return D.call(ae, H) ? ae[H] : void 0;
          }, wt.prototype.has = function(H) {
            var ae = this.__data__;
            return he ? ae[H] !== void 0 : D.call(ae, H);
          }, wt.prototype.set = function(H, ae) {
            var ke = this.__data__;
            return this.size += this.has(H) ? 0 : 1, ke[H] = he && ae === void 0 ? "__lodash_hash_undefined__" : ae, this;
          }, gt.prototype.clear = function() {
            this.__data__ = [], this.size = 0;
          }, gt.prototype.delete = function(H) {
            var ae = this.__data__, ke = Yn(ae, H);
            return !(ke < 0) && (ke == ae.length - 1 ? ae.pop() : Je.call(ae, ke, 1), --this.size, !0);
          }, gt.prototype.get = function(H) {
            var ae = this.__data__, ke = Yn(ae, H);
            return ke < 0 ? void 0 : ae[ke][1];
          }, gt.prototype.has = function(H) {
            return Yn(this.__data__, H) > -1;
          }, gt.prototype.set = function(H, ae) {
            var ke = this.__data__, Ce = Yn(ke, H);
            return Ce < 0 ? (++this.size, ke.push([H, ae])) : ke[Ce][1] = ae, this;
          }, cn.prototype.clear = function() {
            this.size = 0, this.__data__ = { hash: new wt(), map: new (w || gt)(), string: new wt() };
          }, cn.prototype.delete = function(H) {
            var ae = qt(this, H).delete(H);
            return this.size -= ae ? 1 : 0, ae;
          }, cn.prototype.get = function(H) {
            return qt(this, H).get(H);
          }, cn.prototype.has = function(H) {
            return qt(this, H).has(H);
          }, cn.prototype.set = function(H, ae) {
            var ke = qt(this, H), Ce = ke.size;
            return ke.set(H, ae), this.size += ke.size == Ce ? 0 : 1, this;
          }, Er.prototype.add = Er.prototype.push = function(H) {
            return this.__data__.set(H, "__lodash_hash_undefined__"), this;
          }, Er.prototype.has = function(H) {
            return this.__data__.has(H);
          }, Tt.prototype.clear = function() {
            this.__data__ = new gt(), this.size = 0;
          }, Tt.prototype.delete = function(H) {
            var ae = this.__data__, ke = ae.delete(H);
            return this.size = ae.size, ke;
          }, Tt.prototype.get = function(H) {
            return this.__data__.get(H);
          }, Tt.prototype.has = function(H) {
            return this.__data__.has(H);
          }, Tt.prototype.set = function(H, ae) {
            var ke = this.__data__;
            if (ke instanceof gt) {
              var Ce = ke.__data__;
              if (!w || Ce.length < 199) return Ce.push([H, ae]), this.size = ++ke.size, this;
              ke = this.__data__ = new cn(Ce);
            }
            return ke.set(H, ae), this.size = ke.size, this;
          };
          var Sr = Y ? function(H) {
            return H == null ? [] : (H = Object(H), function(ae, ke) {
              for (var Ce = -1, it = ae == null ? 0 : ae.length, qe = 0, st = []; ++Ce < it; ) {
                var tt = ae[Ce];
                ke(tt, Ce, ae) && (st[qe++] = tt);
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
                return de.call(H);
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
          (f && ut(new f(new ArrayBuffer(1))) != "[object DataView]" || w && ut(new w()) != m || U && ut(U.resolve()) != "[object Promise]" || F && ut(new F()) != v || W && ut(new W()) != "[object WeakMap]") && (ut = function(H) {
            var ae = Sn(H), ke = ae == b ? H.constructor : void 0, Ce = ke ? bn(ke) : "";
            if (Ce) switch (Ce) {
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
            return On(H) && Tn(H.length) && !!x[Sn(H)];
          };
          function Xr(H) {
            return (ae = H) != null && Tn(ae.length) && !sr(ae) ? pt(H) : en(H);
            var ae;
          }
          o.exports = function(H, ae) {
            return _r(H, ae);
          };
        }).call(this, u(15), u(33)(g));
      }, function(g, i, u) {
        var c, o = function() {
          return c === void 0 && (c = !!(window && document && document.all && !window.atob)), c;
        }, _ = /* @__PURE__ */ function() {
          var P = {};
          return function(I) {
            if (P[I] === void 0) {
              var V = document.querySelector(I);
              if (window.HTMLIFrameElement && V instanceof window.HTMLIFrameElement) try {
                V = V.contentDocument.head;
              } catch {
                V = null;
              }
              P[I] = V;
            }
            return P[I];
          };
        }(), m = [];
        function b(P) {
          for (var I = -1, V = 0; V < m.length; V++) if (m[V].identifier === P) {
            I = V;
            break;
          }
          return I;
        }
        function v(P, I) {
          for (var V = {}, R = [], oe = 0; oe < P.length; oe++) {
            var Q = P[oe], z = I.base ? Q[0] + I.base : Q[0], M = V[z] || 0, se = "".concat(z, " ").concat(M);
            V[z] = M + 1;
            var le = b(se), te = { css: Q[1], media: Q[2], sourceMap: Q[3] };
            le !== -1 ? (m[le].references++, m[le].updater(te)) : m.push({ identifier: se, updater: B(te, I), references: 1 }), R.push(se);
          }
          return R;
        }
        function y(P) {
          var I = document.createElement("style"), V = P.attributes || {};
          if (V.nonce === void 0) {
            var R = u.nc;
            R && (V.nonce = R);
          }
          if (Object.keys(V).forEach(function(Q) {
            I.setAttribute(Q, V[Q]);
          }), typeof P.insert == "function") P.insert(I);
          else {
            var oe = _(P.insert || "head");
            if (!oe) throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");
            oe.appendChild(I);
          }
          return I;
        }
        var C, x = (C = [], function(P, I) {
          return C[P] = I, C.filter(Boolean).join(`
`);
        });
        function N(P, I, V, R) {
          var oe = V ? "" : R.media ? "@media ".concat(R.media, " {").concat(R.css, "}") : R.css;
          if (P.styleSheet) P.styleSheet.cssText = x(I, oe);
          else {
            var Q = document.createTextNode(oe), z = P.childNodes;
            z[I] && P.removeChild(z[I]), z.length ? P.insertBefore(Q, z[I]) : P.appendChild(Q);
          }
        }
        function G(P, I, V) {
          var R = V.css, oe = V.media, Q = V.sourceMap;
          if (oe ? P.setAttribute("media", oe) : P.removeAttribute("media"), Q && typeof btoa < "u" && (R += `
/*# sourceMappingURL=data:application/json;base64,`.concat(btoa(unescape(encodeURIComponent(JSON.stringify(Q)))), " */")), P.styleSheet) P.styleSheet.cssText = R;
          else {
            for (; P.firstChild; ) P.removeChild(P.firstChild);
            P.appendChild(document.createTextNode(R));
          }
        }
        var K = null, j = 0;
        function B(P, I) {
          var V, R, oe;
          if (I.singleton) {
            var Q = j++;
            V = K || (K = y(I)), R = N.bind(null, V, Q, !1), oe = N.bind(null, V, Q, !0);
          } else V = y(I), R = G.bind(null, V, I), oe = function() {
            (function(z) {
              if (z.parentNode === null) return !1;
              z.parentNode.removeChild(z);
            })(V);
          };
          return R(P), function(z) {
            if (z) {
              if (z.css === P.css && z.media === P.media && z.sourceMap === P.sourceMap) return;
              R(P = z);
            } else oe();
          };
        }
        g.exports = function(P, I) {
          (I = I || {}).singleton || typeof I.singleton == "boolean" || (I.singleton = o());
          var V = v(P = P || [], I);
          return function(R) {
            if (R = R || [], Object.prototype.toString.call(R) === "[object Array]") {
              for (var oe = 0; oe < V.length; oe++) {
                var Q = b(V[oe]);
                m[Q].references--;
              }
              for (var z = v(R, I), M = 0; M < V.length; M++) {
                var se = b(V[M]);
                m[se].references === 0 && (m[se].updater(), m.splice(se, 1));
              }
              V = z;
            }
          };
        };
      }, function(g, i, u) {
        g.exports = function(c) {
          var o = [];
          return o.toString = function() {
            return this.map(function(_) {
              var m = function(b, v) {
                var y = b[1] || "", C = b[3];
                if (!C) return y;
                if (v && typeof btoa == "function") {
                  var x = (G = C, "/*# sourceMappingURL=data:application/json;charset=utf-8;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(G)))) + " */"), N = C.sources.map(function(K) {
                    return "/*# sourceURL=" + C.sourceRoot + K + " */";
                  });
                  return [y].concat(N).concat([x]).join(`
`);
                }
                var G;
                return [y].join(`
`);
              }(_, c);
              return _[2] ? "@media " + _[2] + "{" + m + "}" : m;
            }).join("");
          }, o.i = function(_, m) {
            typeof _ == "string" && (_ = [[null, _, ""]]);
            for (var b = {}, v = 0; v < this.length; v++) {
              var y = this[v][0];
              y != null && (b[y] = !0);
            }
            for (v = 0; v < _.length; v++) {
              var C = _[v];
              C[0] != null && b[C[0]] || (m && !C[2] ? C[2] = m : m && (C[2] = "(" + C[2] + ") and (" + m + ")"), o.push(C));
            }
          }, o;
        };
      }, function(g, i, u) {
        u.d(i, "c", function() {
          return _;
        }), u.d(i, "b", function() {
          return m;
        }), u.d(i, "a", function() {
          return b;
        });
        var c = u(3);
        let o = 0;
        function _(v) {
          const y = { editors: {}, options: {} };
          if (typeof v[0] == "string") c.a.warn(`[CKEditorInspector] The CKEditorInspector.attach( '${v[0]}', editor ) syntax has been deprecated and will be removed in the near future. To pass a name of an editor instance, use CKEditorInspector.attach( { '${v[0]}': editor } ) instead. Learn more in https://github.com/ckeditor/ckeditor5-inspector/blob/master/README.md.`), y.editors[v[0]] = v[1];
          else {
            if ((C = v[0]).model && C.editing) y.editors["editor-" + ++o] = v[0];
            else for (const x in v[0]) y.editors[x] = v[0][x];
            y.options = v[1] || y.options;
          }
          var C;
          return y;
        }
        function m(v) {
          return [...v][0][0] || "";
        }
        function b(v, y) {
          const C = Math.min(v.length, y.length);
          for (let x = 0; x < C; x++) if (v[x] != y[x]) return x;
          return v.length == y.length ? "same" : v.length < y.length ? "prefix" : "extension";
        }
      }, function(g, i, u) {
        u.d(i, "a", function() {
          return m;
        }), u.d(i, "d", function() {
          return y;
        }), u.d(i, "c", function() {
          return C;
        }), u.d(i, "e", function() {
          return x;
        }), u.d(i, "b", function() {
          return N;
        });
        var c = u(2), o = u(8), _ = u(1);
        const m = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_view", b = `&lt;!--The View UI element content has been skipped. <a href="${m}_uielement-UIElement.html" target="_blank">Find out why</a>. --&gt;`, v = `&lt;!--The View raw element content has been skipped. <a href="${m}_rawelement-RawElement.html" target="_blank">Find out why</a>. --&gt;`;
        function y(P) {
          return P ? [...P.editing.view.document.roots] : [];
        }
        function C(P, I) {
          if (!P) return [];
          const V = [], R = P.editing.view.document.selection;
          for (const oe of R.getRanges()) oe.root.rootName === I && V.push({ type: "selection", start: Object(c.a)(oe.start), end: Object(c.a)(oe.end) });
          return V;
        }
        function x({ currentEditor: P, currentRootName: I, ranges: V }) {
          return !P || !I ? null : [G(P.editing.view.document.getRoot(I), [...V])];
        }
        function N(P) {
          const I = { editorNode: P, properties: {}, attributes: {}, customProperties: {} };
          if (Object(c.d)(P)) {
            Object(c.g)(P) ? (I.type = "RootEditableElement", I.name = P.rootName, I.url = m + "_rooteditableelement-RootEditableElement.html") : (I.name = P.name, Object(c.b)(P) ? (I.type = "AttributeElement", I.url = m + "_attributeelement-AttributeElement.html") : Object(c.e)(P) ? (I.type = "EmptyElement", I.url = m + "_emptyelement-EmptyElement.html") : Object(c.h)(P) ? (I.type = "UIElement", I.url = m + "_uielement-UIElement.html") : Object(c.f)(P) ? (I.type = "RawElement", I.url = m + "_rawelement-RawElement.html") : Object(c.c)(P) ? (I.type = "EditableElement", I.url = m + "_editableelement-EditableElement.html") : (I.type = "ContainerElement", I.url = m + "_containerelement-ContainerElement.html")), B(P).forEach(([V, R]) => {
              I.attributes[V] = { value: R };
            }), I.properties = { index: { value: P.index }, isEmpty: { value: P.isEmpty }, childCount: { value: P.childCount } };
            for (let [V, R] of P.getCustomProperties()) typeof V == "symbol" && (V = V.toString()), I.customProperties[V] = { value: R };
          } else I.name = P.data, I.type = "Text", I.url = m + "_text-Text.html", I.properties = { index: { value: P.index } };
          return I.properties = Object(_.b)(I.properties), I.customProperties = Object(_.b)(I.customProperties), I.attributes = Object(_.b)(I.attributes), I;
        }
        function G(P, I) {
          const V = {};
          return Object.assign(V, { index: P.index, path: P.getPath(), node: P, positionsBefore: [], positionsAfter: [] }), Object(c.d)(P) ? function(R, oe) {
            const Q = R.node;
            Object.assign(R, { type: "element", children: [], positions: [] }), R.name = Q.name, Object(c.b)(Q) ? R.elementType = "attribute" : Object(c.g)(Q) ? R.elementType = "root" : Object(c.e)(Q) ? R.elementType = "empty" : Object(c.h)(Q) ? R.elementType = "ui" : Object(c.f)(Q) ? R.elementType = "raw" : R.elementType = "container", Object(c.e)(Q) ? R.presentation = { isEmpty: !0 } : Object(c.h)(Q) ? R.children.push({ type: "comment", text: b }) : Object(c.f)(Q) && R.children.push({ type: "comment", text: v });
            for (const z of Q.getChildren()) R.children.push(G(z, oe));
            (function(z, M) {
              for (const se of M) {
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
            })(R, oe), R.attributes = function(z) {
              const M = B(z).map(([se, le]) => [se, Object(_.a)(le, !1)]);
              return new Map(M);
            }(Q);
          }(V, I) : function(R, oe) {
            Object.assign(R, { type: "text", startOffset: 0, text: R.node.data, positions: [] });
            for (const Q of oe) {
              const z = K(R, Q);
              R.positions.push(...z);
            }
          }(V, I), V;
        }
        function K(P, I) {
          const V = P.path, R = I.start.path, oe = I.end.path, Q = [];
          return j(V, R) && Q.push({ offset: R[R.length - 1], isEnd: !1, presentation: I.presentation || null, type: I.type, name: I.name || null }), j(V, oe) && Q.push({ offset: oe[oe.length - 1], isEnd: !0, presentation: I.presentation || null, type: I.type, name: I.name || null }), Q;
        }
        function j(P, I) {
          return P.length === I.length - 1 && Object(o.a)(P, I) === "prefix";
        }
        function B(P) {
          return [...P.getAttributes()].sort(([I], [V]) => I.toUpperCase() < V.toUpperCase() ? -1 : 1);
        }
      }, function(g, i, u) {
        u.d(i, "d", function() {
          return v;
        }), u.d(i, "c", function() {
          return y;
        }), u.d(i, "a", function() {
          return C;
        }), u.d(i, "e", function() {
          return x;
        }), u.d(i, "b", function() {
          return N;
        });
        var c = u(4), o = u(8), _ = u(1);
        const m = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_", b = ["#03a9f4", "#fb8c00", "#009688", "#e91e63", "#4caf50", "#00bcd4", "#607d8b", "#cddc39", "#9c27b0", "#f44336", "#6d4c41", "#8bc34a", "#3f51b5", "#2196f3", "#f4511e", "#673ab7", "#ffb300"];
        function v(I) {
          if (!I) return [];
          const V = [...I.model.document.roots];
          return V.filter(({ rootName: R }) => R !== "$graveyard").concat(V.filter(({ rootName: R }) => R === "$graveyard"));
        }
        function y(I, V) {
          if (!I) return [];
          const R = [], oe = I.model;
          for (const Q of oe.document.selection.getRanges()) Q.root.rootName === V && R.push({ type: "selection", start: Object(c.a)(Q.start), end: Object(c.a)(Q.end) });
          return R;
        }
        function C(I, V) {
          if (!I) return [];
          const R = [], oe = I.model;
          let Q = 0;
          for (const z of oe.markers) {
            const { name: M, affectsData: se, managedUsingOperations: le } = z, te = z.getStart(), ce = z.getEnd();
            te.root.rootName === V && R.push({ type: "marker", marker: z, name: M, affectsData: se, managedUsingOperations: le, presentation: { color: b[Q++ % (b.length - 1)] }, start: Object(c.a)(te), end: Object(c.a)(ce) });
          }
          return R;
        }
        function x({ currentEditor: I, currentRootName: V, ranges: R, markers: oe }) {
          return I ? [G(I.model.document.getRoot(V), [...R, ...oe])] : [];
        }
        function N(I, V) {
          const R = { editorNode: V, properties: {}, attributes: {} };
          Object(c.c)(V) ? (Object(c.d)(V) ? (R.type = "RootElement", R.name = V.rootName, R.url = m + "rootelement-RootElement.html") : (R.type = "Element", R.name = V.name, R.url = m + "element-Element.html"), R.properties = { childCount: { value: V.childCount }, startOffset: { value: V.startOffset }, endOffset: { value: V.endOffset }, maxOffset: { value: V.maxOffset } }) : (R.name = V.data, R.type = "Text", R.url = m + "text-Text.html", R.properties = { startOffset: { value: V.startOffset }, endOffset: { value: V.endOffset }, offsetSize: { value: V.offsetSize } }), R.properties.path = { value: Object(c.b)(V) }, j(V).forEach(([oe, Q]) => {
            R.attributes[oe] = { value: Q };
          }), R.properties = Object(_.b)(R.properties), R.attributes = Object(_.b)(R.attributes);
          for (const oe in R.attributes) {
            const Q = {}, z = I.model.schema.getAttributeProperties(oe);
            for (const M in z) Q[M] = { value: z[M] };
            R.attributes[oe].subProperties = Object(_.b)(Q);
          }
          return R;
        }
        function G(I, V) {
          const R = {}, { startOffset: oe, endOffset: Q } = I;
          return Object.assign(R, { startOffset: oe, endOffset: Q, node: I, path: I.getPath(), positionsBefore: [], positionsAfter: [] }), Object(c.c)(I) ? function(z, M) {
            const se = z.node;
            Object.assign(z, { type: "element", name: se.name, children: [], maxOffset: se.maxOffset, positions: [] });
            for (const le of se.getChildren()) z.children.push(G(le, M));
            (function(le, te) {
              for (const ce of te) {
                const ye = B(le, ce);
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
                        const be = le.children[D + 1], Te = ie.type === "text" && be && be.type === "element", we = ie.type === "element" && be && be.type === "text", Pe = ie.type === "text" && be && be.type === "text";
                        J.isEnd && (Te || we || Pe) ? be.positionsBefore.push(J) : ie.positionsAfter.push(J);
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
            })(z, M), z.attributes = K(se);
          }(R, V) : function(z) {
            const M = z.node;
            Object.assign(z, { type: "text", text: M.data, positions: [], presentation: { dontRenderAttributeValue: !0 } }), z.attributes = K(M);
          }(R), R;
        }
        function K(I) {
          const V = j(I).map(([R, oe]) => [R, Object(_.a)(oe, !1)]);
          return new Map(V);
        }
        function j(I) {
          return [...I.getAttributes()].sort(([V], [R]) => V < R ? -1 : 1);
        }
        function B(I, V) {
          const R = I.path, oe = V.start.path, Q = V.end.path, z = [];
          return P(R, oe) && z.push({ offset: oe[oe.length - 1], isEnd: !1, presentation: V.presentation || null, type: V.type, name: V.name || null }), P(R, Q) && z.push({ offset: Q[Q.length - 1], isEnd: !0, presentation: V.presentation || null, type: V.type, name: V.name || null }), z;
        }
        function P(I, V) {
          return I.length === V.length - 1 && Object(o.a)(I, V) === "prefix";
        }
      }, function(g, i, u) {
        u.d(i, "a", function() {
          return j;
        });
        var c = u(0), o = u.n(c), _ = u(5), m = u.n(_);
        class b extends c.Component {
          constructor(P) {
            super(P), this.handleClick = this.handleClick.bind(this);
          }
          handleClick(P) {
            this.globalTreeProps.onClick(P, this.definition.node);
          }
          getChildren() {
            return this.definition.children.map((P, I) => K(P, I, this.props.globalTreeProps));
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
            return !m()(this.props, P);
          }
        }
        var v = u(1);
        class y extends c.PureComponent {
          render() {
            let P;
            const I = Object(v.c)(this.props.value, 500);
            return this.props.dontRenderValue || (P = o.a.createElement("span", { className: "ck-inspector-tree-node__attribute__value" }, I)), o.a.createElement("span", { className: "ck-inspector-tree-node__attribute" }, o.a.createElement("span", { className: "ck-inspector-tree-node__attribute__name", title: I }, this.props.name), P);
          }
        }
        class C extends c.Component {
          render() {
            const P = this.props.definition, I = { className: ["ck-inspector-tree__position", P.type === "selection" ? "ck-inspector-tree__position_selection" : "", P.type === "marker" ? "ck-inspector-tree__position_marker" : "", P.isEnd ? "ck-inspector-tree__position_end" : ""].join(" "), style: {} };
            return P.presentation && P.presentation.color && (I.style["--ck-inspector-color-tree-position"] = P.presentation.color), P.type === "marker" && (I["data-marker-name"] = P.name), o.a.createElement("span", I, "​");
          }
          shouldComponentUpdate(P) {
            return !m()(this.props, P);
          }
        }
        class x extends b {
          render() {
            const P = this.definition, I = P.presentation, V = I && I.isEmpty, R = I && I.cssClass, oe = this.getChildren(), Q = ["ck-inspector-code", "ck-inspector-tree-node", this.isActive ? "ck-inspector-tree-node_active" : "", V ? "ck-inspector-tree-node_empty" : "", R], z = [], M = [];
            P.positionsBefore && P.positionsBefore.forEach((le, te) => {
              z.push(o.a.createElement(C, { key: "position-before:" + te, definition: le }));
            }), P.positionsAfter && P.positionsAfter.forEach((le, te) => {
              M.push(o.a.createElement(C, { key: "position-after:" + te, definition: le }));
            }), P.positions && P.positions.forEach((le, te) => {
              oe.push(o.a.createElement(C, { key: "position" + te, definition: le }));
            });
            let se = P.name;
            return this.globalTreeProps.showElementTypes && (se = P.elementType + ":" + se), o.a.createElement("div", { className: Q.join(" "), onClick: this.handleClick }, z, o.a.createElement("span", { className: "ck-inspector-tree-node__name" }, o.a.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_open" }), se, this.getAttributes(), V ? "" : o.a.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_close" })), o.a.createElement("div", { className: "ck-inspector-tree-node__content" }, oe), V ? "" : o.a.createElement("span", { className: "ck-inspector-tree-node__name ck-inspector-tree-node__name_close" }, o.a.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_open" }), "/", se, o.a.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_close" }), M));
          }
          getAttributes() {
            const P = [], I = this.definition;
            for (const [V, R] of I.attributes) P.push(o.a.createElement(y, { key: V, name: V, value: R }));
            return P;
          }
          shouldComponentUpdate(P) {
            return !m()(this.props, P);
          }
        }
        class N extends b {
          render() {
            const P = this.definition, I = ["ck-inspector-tree-text", this.isActive ? "ck-inspector-tree-node_active" : ""].join(" ");
            let V = this.definition.text;
            P.positions && P.positions.length && (V = V.split(""), Array.from(P.positions).sort((oe, Q) => oe.offset < Q.offset ? -1 : oe.offset === Q.offset ? 0 : 1).reverse().forEach((oe, Q) => {
              V.splice(oe.offset - P.startOffset, 0, o.a.createElement(C, { key: "position" + Q, definition: oe }));
            }));
            const R = [V];
            return P.positionsBefore && P.positionsBefore.length && P.positionsBefore.forEach((oe, Q) => {
              R.unshift(o.a.createElement(C, { key: "position-before:" + Q, definition: oe }));
            }), P.positionsAfter && P.positionsAfter.length && P.positionsAfter.forEach((oe, Q) => {
              R.push(o.a.createElement(C, { key: "position-after:" + Q, definition: oe }));
            }), o.a.createElement("span", { className: I, onClick: this.handleClick }, o.a.createElement("span", { className: "ck-inspector-tree-node__content" }, this.globalTreeProps.showCompactText ? "" : this.getAttributes(), this.globalTreeProps.showCompactText ? "" : '"', R, this.globalTreeProps.showCompactText ? "" : '"'));
          }
          getAttributes() {
            const P = [], I = this.definition, V = I.presentation, R = V && V.dontRenderAttributeValue;
            for (const [oe, Q] of I.attributes) P.push(o.a.createElement(y, { key: oe, name: oe, value: Q, dontRenderValue: R }));
            return o.a.createElement("span", { className: "ck-inspector-tree-text__attributes" }, P);
          }
          shouldComponentUpdate(P) {
            return !m()(this.props, P);
          }
        }
        class G extends c.Component {
          render() {
            return o.a.createElement("span", { className: "ck-inspector-tree-comment", dangerouslySetInnerHTML: { __html: this.props.definition.text } });
          }
        }
        function K(B, P, I) {
          return B.type === "element" ? o.a.createElement(x, { key: P, definition: B, globalTreeProps: I }) : B.type === "text" ? o.a.createElement(N, { key: P, definition: B, globalTreeProps: I }) : B.type === "comment" ? o.a.createElement(G, { key: P, definition: B }) : void 0;
        }
        u(34);
        class j extends c.Component {
          render() {
            let P;
            return P = this.props.definition ? this.props.definition.map((I, V) => K(I, V, { onClick: this.props.onClick, showCompactText: this.props.showCompactText, showElementTypes: this.props.showElementTypes, activeNode: this.props.activeNode })) : "Nothing to show.", o.a.createElement("div", { className: ["ck-inspector-tree", ...this.props.className || [], this.props.textDirection ? "ck-inspector-tree_text-direction_" + this.props.textDirection : "", this.props.showCompactText ? "ck-inspector-tree_compact-text" : ""].join(" ") }, P);
          }
        }
      }, function(g, i, u) {
        (function c() {
          if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE == "function")
            try {
              __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(c);
            } catch (o) {
              console.error(o);
            }
        })(), g.exports = u(22);
      }, function(g, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.stringifyPath = i.quoteKey = i.isValidVariableName = i.IS_VALID_IDENTIFIER = i.quoteString = void 0;
        const c = /[\\\'\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, o = /* @__PURE__ */ new Map([["\b", "\\b"], ["	", "\\t"], [`
`, "\\n"], ["\f", "\\f"], ["\r", "\\r"], ["'", "\\'"], ['"', '\\"'], ["\\", "\\\\"]]);
        function _(v) {
          return o.get(v) || "\\u" + ("0000" + v.charCodeAt(0).toString(16)).slice(-4);
        }
        i.quoteString = function(v) {
          return `'${v.replace(c, _)}'`;
        };
        const m = new Set("break else new var case finally return void catch for switch while continue function this with default if throw delete in try do instanceof typeof abstract enum int short boolean export interface static byte extends long super char final native synchronized class float package throws const goto private transient debugger implements protected volatile double import public let yield".split(" "));
        function b(v) {
          return typeof v == "string" && !m.has(v) && i.IS_VALID_IDENTIFIER.test(v);
        }
        i.IS_VALID_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/, i.isValidVariableName = b, i.quoteKey = function(v, y) {
          return b(v) ? v : y(v);
        }, i.stringifyPath = function(v, y) {
          let C = "";
          for (const x of v) b(x) ? C += "." + x : C += `[${y(x)}]`;
          return C;
        };
      }, function(g, i) {
        function u(y, C, x, N) {
          var G, K = (G = N) == null || typeof G == "number" || typeof G == "boolean" ? N : x(N), j = C.get(K);
          return j === void 0 && (j = y.call(this, N), C.set(K, j)), j;
        }
        function c(y, C, x) {
          var N = Array.prototype.slice.call(arguments, 3), G = x(N), K = C.get(G);
          return K === void 0 && (K = y.apply(this, N), C.set(G, K)), K;
        }
        function o(y, C, x, N, G) {
          return x.bind(C, y, N, G);
        }
        function _(y, C) {
          return o(y, this, y.length === 1 ? u : c, C.cache.create(), C.serializer);
        }
        function m() {
          return JSON.stringify(arguments);
        }
        function b() {
          this.cache = /* @__PURE__ */ Object.create(null);
        }
        b.prototype.has = function(y) {
          return y in this.cache;
        }, b.prototype.get = function(y) {
          return this.cache[y];
        }, b.prototype.set = function(y, C) {
          this.cache[y] = C;
        };
        var v = { create: function() {
          return new b();
        } };
        g.exports = function(y, C) {
          var x = C && C.cache ? C.cache : v, N = C && C.serializer ? C.serializer : m;
          return (C && C.strategy ? C.strategy : _)(y, { cache: x, serializer: N });
        }, g.exports.strategies = { variadic: function(y, C) {
          return o(y, this, c, C.cache.create(), C.serializer);
        }, monadic: function(y, C) {
          return o(y, this, u, C.cache.create(), C.serializer);
        } };
      }, function(g, i) {
        var u;
        u = /* @__PURE__ */ function() {
          return this;
        }();
        try {
          u = u || new Function("return this")();
        } catch {
          typeof window == "object" && (u = window);
        }
        g.exports = u;
      }, function(g, i, u) {
        var c = Object.getOwnPropertySymbols, o = Object.prototype.hasOwnProperty, _ = Object.prototype.propertyIsEnumerable;
        function m(b) {
          if (b == null) throw new TypeError("Object.assign cannot be called with null or undefined");
          return Object(b);
        }
        g.exports = function() {
          try {
            if (!Object.assign) return !1;
            var b = new String("abc");
            if (b[5] = "de", Object.getOwnPropertyNames(b)[0] === "5") return !1;
            for (var v = {}, y = 0; y < 10; y++) v["_" + String.fromCharCode(y)] = y;
            if (Object.getOwnPropertyNames(v).map(function(x) {
              return v[x];
            }).join("") !== "0123456789") return !1;
            var C = {};
            return "abcdefghijklmnopqrst".split("").forEach(function(x) {
              C[x] = x;
            }), Object.keys(Object.assign({}, C)).join("") === "abcdefghijklmnopqrst";
          } catch {
            return !1;
          }
        }() ? Object.assign : function(b, v) {
          for (var y, C, x = m(b), N = 1; N < arguments.length; N++) {
            for (var G in y = Object(arguments[N])) o.call(y, G) && (x[G] = y[G]);
            if (c) {
              C = c(y);
              for (var K = 0; K < C.length; K++) _.call(y, C[K]) && (x[C[K]] = y[C[K]]);
            }
          }
          return x;
        };
      }, function(g, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.FunctionParser = i.dedentFunction = i.functionToString = i.USED_METHOD_KEY = void 0;
        const c = u(13), o = { " "() {
        } }[" "].toString().charAt(0) === '"', _ = { Function: "function ", GeneratorFunction: "function* ", AsyncFunction: "async function ", AsyncGeneratorFunction: "async function* " }, m = { Function: "", GeneratorFunction: "*", AsyncFunction: "async ", AsyncGeneratorFunction: "async *" }, b = new Set("case delete else in instanceof new return throw typeof void , ; : + - ! ~ & | ^ * / % < > ? =".split(" "));
        i.USED_METHOD_KEY = /* @__PURE__ */ new WeakSet();
        function v(C) {
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
          return K !== void 0 && i.USED_METHOD_KEY.add(C), new y(C, x, N, K).stringify();
        }, i.dedentFunction = v;
        class y {
          constructor(x, N, G, K) {
            this.fn = x, this.indent = N, this.next = G, this.key = K, this.pos = 0, this.hadKeyword = !1, this.fnString = Function.prototype.toString.call(x), this.fnType = x.constructor.name, this.keyQuote = K === void 0 ? "" : c.quoteKey(K, G), this.keyPrefix = K === void 0 ? "" : `${this.keyQuote}:${N ? " " : ""}`, this.isMethodCandidate = K !== void 0 && (this.fn.name === "" || this.fn.name === K);
          }
          stringify() {
            const x = this.tryParse();
            return x ? v(x) : `${this.keyPrefix}void ${this.next(this.fnString)}`;
          }
          getPrefix() {
            return this.isMethodCandidate && !this.hadKeyword ? m[this.fnType] + this.keyQuote : this.keyPrefix + _[this.fnType];
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
        i.FunctionParser = y;
      }, function(g, i, u) {
        g.exports = u(53)();
      }, function(g, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.stringify = void 0;
        const c = u(25), o = u(13), _ = Symbol("root");
        i.stringify = function(m, b, v, y = {}) {
          const C = typeof v == "string" ? v : " ".repeat(v || 0), x = [], N = /* @__PURE__ */ new Set(), G = /* @__PURE__ */ new Map(), K = /* @__PURE__ */ new Map();
          let j = 0;
          const { maxDepth: B = 100, references: P = !1, skipUndefinedProperties: I = !1, maxValues: V = 1e5 } = y, R = function(M) {
            return M ? (se, le, te, ce) => M(se, le, (ye) => c.toString(ye, le, te, ce), ce) : c.toString;
          }(b), oe = (M, se) => {
            if (++j > V || I && M === void 0 || x.length > B) return;
            if (se === void 0) return R(M, C, oe, se);
            x.push(se);
            const le = Q(M, se === _ ? void 0 : se);
            return x.pop(), le;
          }, Q = P ? (M, se) => {
            if (M !== null && (typeof M == "object" || typeof M == "function" || typeof M == "symbol")) {
              if (G.has(M)) return K.set(x.slice(1), G.get(M)), R(void 0, C, oe, se);
              G.set(M, x.slice(1));
            }
            return R(M, C, oe, se);
          } : (M, se) => {
            if (N.has(M)) return;
            N.add(M);
            const le = R(M, C, oe, se);
            return N.delete(M), le;
          }, z = oe(m, _);
          if (K.size) {
            const M = C ? " " : "", se = C ? `
` : "";
            let le = `var x${M}=${M}${z};${se}`;
            for (const [te, ce] of K.entries())
              le += `x${o.stringifyPath(te, oe)}${M}=${M}x${o.stringifyPath(ce, oe)};${se}`;
            return `(function${M}()${M}{${se}${le}return x;${se}}())`;
          }
          return z;
        };
      }, function(g, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.findInArray = function(c, o) {
          for (var _ = 0, m = c.length; _ < m; _++) if (o.apply(o, [c[_], _, c])) return c[_];
        }, i.isFunction = function(c) {
          return typeof c == "function" || Object.prototype.toString.call(c) === "[object Function]";
        }, i.isNum = function(c) {
          return typeof c == "number" && !isNaN(c);
        }, i.int = function(c) {
          return parseInt(c, 10);
        }, i.dontSetMe = function(c, o, _) {
          if (c[o]) return new Error("Invalid prop ".concat(o, " passed to ").concat(_, " - do not set this, set it on the child."));
        };
      }, function(g, i, u) {
        var c = u(16), o = typeof Symbol == "function" && Symbol.for, _ = o ? Symbol.for("react.element") : 60103, m = o ? Symbol.for("react.portal") : 60106, b = o ? Symbol.for("react.fragment") : 60107, v = o ? Symbol.for("react.strict_mode") : 60108, y = o ? Symbol.for("react.profiler") : 60114, C = o ? Symbol.for("react.provider") : 60109, x = o ? Symbol.for("react.context") : 60110, N = o ? Symbol.for("react.forward_ref") : 60112, G = o ? Symbol.for("react.suspense") : 60113, K = o ? Symbol.for("react.memo") : 60115, j = o ? Symbol.for("react.lazy") : 60116, B = typeof Symbol == "function" && Symbol.iterator;
        function P(X) {
          for (var Y = "https://reactjs.org/docs/error-decoder.html?invariant=" + X, me = 1; me < arguments.length; me++) Y += "&args[]=" + encodeURIComponent(arguments[me]);
          return "Minified React error #" + X + "; visit " + Y + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
        }
        var I = { isMounted: function() {
          return !1;
        }, enqueueForceUpdate: function() {
        }, enqueueReplaceState: function() {
        }, enqueueSetState: function() {
        } }, V = {};
        function R(X, Y, me) {
          this.props = X, this.context = Y, this.refs = V, this.updater = me || I;
        }
        function oe() {
        }
        function Q(X, Y, me) {
          this.props = X, this.context = Y, this.refs = V, this.updater = me || I;
        }
        R.prototype.isReactComponent = {}, R.prototype.setState = function(X, Y) {
          if (typeof X != "object" && typeof X != "function" && X != null) throw Error(P(85));
          this.updater.enqueueSetState(this, X, Y, "setState");
        }, R.prototype.forceUpdate = function(X) {
          this.updater.enqueueForceUpdate(this, X, "forceUpdate");
        }, oe.prototype = R.prototype;
        var z = Q.prototype = new oe();
        z.constructor = Q, c(z, R.prototype), z.isPureReactComponent = !0;
        var M = { current: null }, se = Object.prototype.hasOwnProperty, le = { key: !0, ref: !0, __self: !0, __source: !0 };
        function te(X, Y, me) {
          var l, f = {}, w = null, U = null;
          if (Y != null) for (l in Y.ref !== void 0 && (U = Y.ref), Y.key !== void 0 && (w = "" + Y.key), Y) se.call(Y, l) && !le.hasOwnProperty(l) && (f[l] = Y[l]);
          var F = arguments.length - 2;
          if (F === 1) f.children = me;
          else if (1 < F) {
            for (var W = Array(F), he = 0; he < F; he++) W[he] = arguments[he + 2];
            f.children = W;
          }
          if (X && X.defaultProps) for (l in F = X.defaultProps) f[l] === void 0 && (f[l] = F[l]);
          return { $$typeof: _, type: X, key: w, ref: U, props: f, _owner: M.current };
        }
        function ce(X) {
          return typeof X == "object" && X !== null && X.$$typeof === _;
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
          return X == null ? 0 : function l(f, w, U, F) {
            var W = typeof f;
            W !== "undefined" && W !== "boolean" || (f = null);
            var he = !1;
            if (f === null) he = !0;
            else switch (W) {
              case "string":
              case "number":
                he = !0;
                break;
              case "object":
                switch (f.$$typeof) {
                  case _:
                  case m:
                    he = !0;
                }
            }
            if (he) return U(F, f, w === "" ? "." + be(f, 0) : w), 1;
            if (he = 0, w = w === "" ? "." : w + ":", Array.isArray(f)) for (var je = 0; je < f.length; je++) {
              var Re = w + be(W = f[je], je);
              he += l(W, Re, U, F);
            }
            else if (f === null || typeof f != "object" ? Re = null : Re = typeof (Re = B && f[B] || f["@@iterator"]) == "function" ? Re : null, typeof Re == "function") for (f = Re.call(f), je = 0; !(W = f.next()).done; ) he += l(W = W.value, Re = w + be(W, je++), U, F);
            else if (W === "object") throw U = "" + f, Error(P(31, U === "[object Object]" ? "object with keys {" + Object.keys(f).join(", ") + "}" : U, ""));
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
        function we(X, Y, me) {
          var l = X.result, f = X.keyPrefix;
          X = X.func.call(X.context, Y, X.count++), Array.isArray(X) ? Pe(X, l, me, function(w) {
            return w;
          }) : X != null && (ce(X) && (X = function(w, U) {
            return { $$typeof: _, type: w.type, key: U, ref: w.ref, props: w.props, _owner: w._owner };
          }(X, f + (!X.key || Y && Y.key === X.key ? "" : ("" + X.key).replace(ye, "$&/") + "/") + me)), l.push(X));
        }
        function Pe(X, Y, me, l, f) {
          var w = "";
          me != null && (w = ("" + me).replace(ye, "$&/") + "/"), ie(X, we, Y = de(Y, w, l, f)), D(Y);
        }
        var Se = { current: null };
        function ze() {
          var X = Se.current;
          if (X === null) throw Error(P(321));
          return X;
        }
        var Je = { ReactCurrentDispatcher: Se, ReactCurrentBatchConfig: { suspense: null }, ReactCurrentOwner: M, IsSomeRendererActing: { current: !1 }, assign: c };
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
        } }, i.Component = R, i.Fragment = b, i.Profiler = y, i.PureComponent = Q, i.StrictMode = v, i.Suspense = G, i.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Je, i.cloneElement = function(X, Y, me) {
          if (X == null) throw Error(P(267, X));
          var l = c({}, X.props), f = X.key, w = X.ref, U = X._owner;
          if (Y != null) {
            if (Y.ref !== void 0 && (w = Y.ref, U = M.current), Y.key !== void 0 && (f = "" + Y.key), X.type && X.type.defaultProps) var F = X.type.defaultProps;
            for (W in Y) se.call(Y, W) && !le.hasOwnProperty(W) && (l[W] = Y[W] === void 0 && F !== void 0 ? F[W] : Y[W]);
          }
          var W = arguments.length - 2;
          if (W === 1) l.children = me;
          else if (1 < W) {
            F = Array(W);
            for (var he = 0; he < W; he++) F[he] = arguments[he + 2];
            l.children = F;
          }
          return { $$typeof: _, type: X.type, key: f, ref: w, props: l, _owner: U };
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
      }, function(g, i, u) {
        var c = u(0), o = u(16), _ = u(23);
        function m(e) {
          for (var t = "https://reactjs.org/docs/error-decoder.html?invariant=" + e, n = 1; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
          return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
        }
        if (!c) throw Error(m(227));
        function b(e, t, n, r, a, p, k, T, Z) {
          var q = Array.prototype.slice.call(arguments, 3);
          try {
            t.apply(n, q);
          } catch (ge) {
            this.onError(ge);
          }
        }
        var v = !1, y = null, C = !1, x = null, N = { onError: function(e) {
          v = !0, y = e;
        } };
        function G(e, t, n, r, a, p, k, T, Z) {
          v = !1, y = null, b.apply(N, arguments);
        }
        var K = null, j = null, B = null;
        function P(e, t, n) {
          var r = e.type || "unknown-event";
          e.currentTarget = B(n), function(a, p, k, T, Z, q, ge, De, We) {
            if (G.apply(this, arguments), v) {
              if (!v) throw Error(m(198));
              var ot = y;
              v = !1, y = null, C || (C = !0, x = ot);
            }
          }(r, t, void 0, e), e.currentTarget = null;
        }
        var I = null, V = {};
        function R() {
          if (I) for (var e in V) {
            var t = V[e], n = I.indexOf(e);
            if (!(-1 < n)) throw Error(m(96, e));
            if (!Q[n]) {
              if (!t.extractEvents) throw Error(m(97, e));
              for (var r in Q[n] = t, n = t.eventTypes) {
                var a = void 0, p = n[r], k = t, T = r;
                if (z.hasOwnProperty(T)) throw Error(m(99, T));
                z[T] = p;
                var Z = p.phasedRegistrationNames;
                if (Z) {
                  for (a in Z) Z.hasOwnProperty(a) && oe(Z[a], k, T);
                  a = !0;
                } else p.registrationName ? (oe(p.registrationName, k, T), a = !0) : a = !1;
                if (!a) throw Error(m(98, r, e));
              }
            }
          }
        }
        function oe(e, t, n) {
          if (M[e]) throw Error(m(100, e));
          M[e] = t, se[e] = t.eventTypes[n].dependencies;
        }
        var Q = [], z = {}, M = {}, se = {};
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
        function de(e) {
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
            if (J = ye = null, de(e), t) for (e = 0; e < t.length; e++) de(t[e]);
          }
        }
        function be(e, t) {
          return e(t);
        }
        function Te(e, t, n, r, a) {
          return e(t, n, r, a);
        }
        function we() {
        }
        var Pe = be, Se = !1, ze = !1;
        function Je() {
          ye === null && J === null || (we(), ie());
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
        function w(e, t, n, r, a, p) {
          this.acceptsBooleans = t === 2 || t === 3 || t === 4, this.attributeName = r, this.attributeNamespace = a, this.mustUseProperty = n, this.propertyName = e, this.type = t, this.sanitizeURL = p;
        }
        var U = {};
        "children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(e) {
          U[e] = new w(e, 0, !1, e, null, !1);
        }), [["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(e) {
          var t = e[0];
          U[t] = new w(t, 1, !1, e[1], null, !1);
        }), ["contentEditable", "draggable", "spellCheck", "value"].forEach(function(e) {
          U[e] = new w(e, 2, !1, e.toLowerCase(), null, !1);
        }), ["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(e) {
          U[e] = new w(e, 2, !1, e, null, !1);
        }), "allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(e) {
          U[e] = new w(e, 3, !1, e.toLowerCase(), null, !1);
        }), ["checked", "multiple", "muted", "selected"].forEach(function(e) {
          U[e] = new w(e, 3, !0, e, null, !1);
        }), ["capture", "download"].forEach(function(e) {
          U[e] = new w(e, 4, !1, e, null, !1);
        }), ["cols", "rows", "size", "span"].forEach(function(e) {
          U[e] = new w(e, 6, !1, e, null, !1);
        }), ["rowSpan", "start"].forEach(function(e) {
          U[e] = new w(e, 5, !1, e.toLowerCase(), null, !1);
        });
        var F = /[\-:]([a-z])/g;
        function W(e) {
          return e[1].toUpperCase();
        }
        "accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e) {
          var t = e.replace(F, W);
          U[t] = new w(t, 1, !1, e, null, !1);
        }), "xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e) {
          var t = e.replace(F, W);
          U[t] = new w(t, 1, !1, e, "http://www.w3.org/1999/xlink", !1);
        }), ["xml:base", "xml:lang", "xml:space"].forEach(function(e) {
          var t = e.replace(F, W);
          U[t] = new w(t, 1, !1, e, "http://www.w3.org/XML/1998/namespace", !1);
        }), ["tabIndex", "crossOrigin"].forEach(function(e) {
          U[e] = new w(e, 1, !1, e.toLowerCase(), null, !1);
        }), U.xlinkHref = new w("xlinkHref", 1, !1, "xlink:href", "http://www.w3.org/1999/xlink", !0), ["src", "href", "action", "formAction"].forEach(function(e) {
          U[e] = new w(e, 1, !1, e.toLowerCase(), null, !0);
        });
        var he = c.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
        function je(e, t, n, r) {
          var a = U.hasOwnProperty(t) ? U[t] : null;
          (a !== null ? a.type === 0 : !r && 2 < t.length && (t[0] === "o" || t[0] === "O") && (t[1] === "n" || t[1] === "N")) || (function(p, k, T, Z) {
            if (k == null || function(q, ge, De, We) {
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
            }(p, k, T, Z)) return !0;
            if (Z) return !1;
            if (T !== null) switch (T.type) {
              case 3:
                return !k;
              case 4:
                return k === !1;
              case 5:
                return isNaN(k);
              case 6:
                return isNaN(k) || 1 > k;
            }
            return !1;
          }(t, n, a, r) && (n = null), r || a === null ? function(p) {
            return !!me.call(f, p) || !me.call(l, p) && (Y.test(p) ? f[p] = !0 : (l[p] = !0, !1));
          }(t) && (n === null ? e.removeAttribute(t) : e.setAttribute(t, "" + n)) : a.mustUseProperty ? e[a.propertyName] = n === null ? a.type !== 3 && "" : n : (t = a.attributeName, r = a.attributeNamespace, n === null ? e.removeAttribute(t) : (n = (a = a.type) === 3 || a === 4 && n === !0 ? "" : "" + n, r ? e.setAttributeNS(r, t, n) : e.setAttribute(t, n))));
        }
        he.hasOwnProperty("ReactCurrentDispatcher") || (he.ReactCurrentDispatcher = { current: null }), he.hasOwnProperty("ReactCurrentBatchConfig") || (he.ReactCurrentBatchConfig = { suspense: null });
        var Re = /^(.*)[\\\/]/, Xe = typeof Symbol == "function" && Symbol.for, He = Xe ? Symbol.for("react.element") : 60103, At = Xe ? Symbol.for("react.portal") : 60106, kt = Xe ? Symbol.for("react.fragment") : 60107, Jt = Xe ? Symbol.for("react.strict_mode") : 60108, wt = Xe ? Symbol.for("react.profiler") : 60114, gt = Xe ? Symbol.for("react.provider") : 60109, cn = Xe ? Symbol.for("react.context") : 60110, Er = Xe ? Symbol.for("react.concurrent_mode") : 60111, Tt = Xe ? Symbol.for("react.forward_ref") : 60112, pt = Xe ? Symbol.for("react.suspense") : 60113, Yn = Xe ? Symbol.for("react.suspense_list") : 60120, Sn = Xe ? Symbol.for("react.memo") : 60115, or = Xe ? Symbol.for("react.lazy") : 60116, _r = Xe ? Symbol.for("react.block") : 60121, wo = typeof Symbol == "function" && Symbol.iterator;
        function en(e) {
          return e === null || typeof e != "object" ? null : typeof (e = wo && e[wo] || e["@@iterator"]) == "function" ? e : null;
        }
        function Yt(e) {
          if (e == null) return null;
          if (typeof e == "function") return e.displayName || e.name || null;
          if (typeof e == "string") return e;
          switch (e) {
            case kt:
              return "Fragment";
            case At:
              return "Portal";
            case wt:
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
              var p = r.get, k = r.set;
              return Object.defineProperty(t, n, { configurable: !0, get: function() {
                return p.call(this);
              }, set: function(T) {
                a = "" + T, k.call(this, T);
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
        function ke(e) {
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
          return e == null || e === "http://www.w3.org/1999/xhtml" ? ke(t) : e === "http://www.w3.org/2000/svg" && t === "foreignObject" ? "http://www.w3.org/1999/xhtml" : e;
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
        var tn = Pt("animationend"), ht = Pt("animationiteration"), Vt = Pt("animationstart"), Pn = Pt("transitionend"), ct = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), yn = new (typeof WeakMap == "function" ? WeakMap : Map)();
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
        function _o(e) {
          if (Nn(e) !== e) throw Error(m(188));
        }
        function rt(e) {
          if (!(e = function(n) {
            var r = n.alternate;
            if (!r) {
              if ((r = Nn(n)) === null) throw Error(m(188));
              return r !== n ? null : n;
            }
            for (var a = n, p = r; ; ) {
              var k = a.return;
              if (k === null) break;
              var T = k.alternate;
              if (T === null) {
                if ((p = k.return) !== null) {
                  a = p;
                  continue;
                }
                break;
              }
              if (k.child === T.child) {
                for (T = k.child; T; ) {
                  if (T === a) return _o(k), n;
                  if (T === p) return _o(k), r;
                  T = T.sibling;
                }
                throw Error(m(188));
              }
              if (a.return !== p.return) a = k, p = T;
              else {
                for (var Z = !1, q = k.child; q; ) {
                  if (q === a) {
                    Z = !0, a = k, p = T;
                    break;
                  }
                  if (q === p) {
                    Z = !0, p = k, a = T;
                    break;
                  }
                  q = q.sibling;
                }
                if (!Z) {
                  for (q = T.child; q; ) {
                    if (q === a) {
                      Z = !0, a = T, p = k;
                      break;
                    }
                    if (q === p) {
                      Z = !0, p = T, a = k;
                      break;
                    }
                    q = q.sibling;
                  }
                  if (!Z) throw Error(m(189));
                }
              }
              if (a.alternate !== p) throw Error(m(190));
            }
            if (a.tag !== 3) throw Error(m(188));
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
            if (Array.isArray(t)) for (var r = 0; r < t.length && !e.isPropagationStopped(); r++) P(e, t[r], n[r]);
            else t && P(e, t, n);
            e._dispatchListeners = null, e._dispatchInstances = null, e.isPersistent() || e.constructor.release(e);
          }
        }
        function Mt(e) {
          if (e !== null && (Kt = Ue(Kt, e)), e = Kt, Kt = null, e) {
            if (qn(e, Or), Kt) throw Error(m(95));
            if (C) throw e = x, C = !1, x = null, e;
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
            (t = n.tag) !== 5 && t !== 6 || e.ancestors.push(n), n = Ir(r);
          } while (n);
          for (n = 0; n < e.ancestors.length; n++) {
            t = e.ancestors[n];
            var a = nn(e.nativeEvent);
            r = e.topLevelType;
            var p = e.nativeEvent, k = e.eventSystemFlags;
            n === 0 && (k |= 64);
            for (var T = null, Z = 0; Z < Q.length; Z++) {
              var q = Q[Z];
              q && (q = q.extractEvents(r, t, p, a, k)) && (T = Ue(T, q));
            }
            Mt(T);
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
        var Et, ur, dr, vn = !1, Ut = [], Ht = null, on = null, Kn = null, fr = /* @__PURE__ */ new Map(), Zr = /* @__PURE__ */ new Map(), Pr = [], Vn = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput close cancel copy cut paste click change contextmenu reset submit".split(" "), Nt = "focus blur dragenter dragleave mouseover mouseout pointerover pointerout gotpointercapture lostpointercapture".split(" ");
        function xo(e, t, n, r, a) {
          return { blockedOn: e, topLevelType: t, eventSystemFlags: 32 | n, nativeEvent: a, container: r };
        }
        function kn(e, t) {
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
              fr.delete(t.pointerId);
              break;
            case "gotpointercapture":
            case "lostpointercapture":
              Zr.delete(t.pointerId);
          }
        }
        function Nr(e, t, n, r, a, p) {
          return e === null || e.nativeEvent !== p ? (e = xo(t, n, r, a, p), t !== null && (t = oo(t)) !== null && ur(t), e) : (e.eventSystemFlags |= r, e);
        }
        function Ca(e) {
          var t = Ir(e.target);
          if (t !== null) {
            var n = Nn(t);
            if (n !== null) {
              if ((t = n.tag) === 13) {
                if ((t = Eo(n)) !== null) return e.blockedOn = t, void _.unstable_runWithPriority(e.priority, function() {
                  dr(n);
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
        function ki(e, t, n) {
          So(e) && n.delete(t);
        }
        function wi() {
          for (vn = !1; 0 < Ut.length; ) {
            var e = Ut[0];
            if (e.blockedOn !== null) {
              (e = oo(e.blockedOn)) !== null && Et(e);
              break;
            }
            var t = Ar(e.topLevelType, e.eventSystemFlags, e.container, e.nativeEvent);
            t !== null ? e.blockedOn = t : Ut.shift();
          }
          Ht !== null && So(Ht) && (Ht = null), on !== null && So(on) && (on = null), Kn !== null && So(Kn) && (Kn = null), fr.forEach(ki), Zr.forEach(ki);
        }
        function Dr(e, t) {
          e.blockedOn === t && (e.blockedOn = null, vn || (vn = !0, _.unstable_scheduleCallback(_.unstable_NormalPriority, wi)));
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
          for (Ht !== null && Dr(Ht, e), on !== null && Dr(on, e), Kn !== null && Dr(Kn, e), fr.forEach(t), Zr.forEach(t), n = 0; n < Pr.length; n++) (r = Pr[n]).blockedOn === e && (r.blockedOn = null);
          for (; 0 < Pr.length && (n = Pr[0]).blockedOn === null; ) Ca(n), n.blockedOn === null && Pr.shift();
        }
        var Ei = {}, _i = /* @__PURE__ */ new Map(), Rr = /* @__PURE__ */ new Map(), Ta = ["abort", "abort", tn, "animationEnd", ht, "animationIteration", Vt, "animationStart", "canplay", "canPlay", "canplaythrough", "canPlayThrough", "durationchange", "durationChange", "emptied", "emptied", "encrypted", "encrypted", "ended", "ended", "error", "error", "gotpointercapture", "gotPointerCapture", "load", "load", "loadeddata", "loadedData", "loadedmetadata", "loadedMetadata", "loadstart", "loadStart", "lostpointercapture", "lostPointerCapture", "playing", "playing", "progress", "progress", "seeking", "seeking", "stalled", "stalled", "suspend", "suspend", "timeupdate", "timeUpdate", Pn, "transitionEnd", "waiting", "waiting"];
        function Yo(e, t) {
          for (var n = 0; n < e.length; n += 2) {
            var r = e[n], a = e[n + 1], p = "on" + (a[0].toUpperCase() + a.slice(1));
            p = { phasedRegistrationNames: { bubbled: p, captured: p + "Capture" }, dependencies: [r], eventPriority: t }, Rr.set(r, t), _i.set(r, p), Ei[a] = p;
          }
        }
        Yo("blur blur cancel cancel click click close close contextmenu contextMenu copy copy cut cut auxclick auxClick dblclick doubleClick dragend dragEnd dragstart dragStart drop drop focus focus input input invalid invalid keydown keyDown keypress keyPress keyup keyUp mousedown mouseDown mouseup mouseUp paste paste pause pause play play pointercancel pointerCancel pointerdown pointerDown pointerup pointerUp ratechange rateChange reset reset seeked seeked submit submit touchcancel touchCancel touchend touchEnd touchstart touchStart volumechange volumeChange".split(" "), 0), Yo("drag drag dragenter dragEnter dragexit dragExit dragleave dragLeave dragover dragOver mousemove mouseMove mouseout mouseOut mouseover mouseOver pointermove pointerMove pointerout pointerOut pointerover pointerOver scroll scroll toggle toggle touchmove touchMove wheel wheel".split(" "), 1), Yo(Ta, 2);
        for (var xi = "change selectionchange textInput compositionstart compositionend compositionupdate".split(" "), qo = 0; qo < xi.length; qo++) Rr.set(xi[qo], 0);
        var Oa = _.unstable_UserBlockingPriority, Pa = _.unstable_runWithPriority, Co = !0;
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
              r = Na.bind(null, t, 1, e);
              break;
            default:
              r = To.bind(null, t, 1, e);
          }
          n ? e.addEventListener(t, r, !0) : e.addEventListener(t, r, !1);
        }
        function eo(e, t, n, r) {
          Se || we();
          var a = To, p = Se;
          Se = !0;
          try {
            Te(a, e, t, n, r);
          } finally {
            (Se = p) || Je();
          }
        }
        function Na(e, t, n, r) {
          Pa(Oa, To.bind(null, e, t, n, r));
        }
        function To(e, t, n, r) {
          if (Co) if (0 < Ut.length && -1 < Vn.indexOf(e)) e = xo(null, e, t, n, r), Ut.push(e);
          else {
            var a = Ar(e, t, n, r);
            if (a === null) kn(e, r);
            else if (-1 < Vn.indexOf(e)) e = xo(a, e, t, n, r), Ut.push(e);
            else if (!function(p, k, T, Z, q) {
              switch (k) {
                case "focus":
                  return Ht = Nr(Ht, p, k, T, Z, q), !0;
                case "dragenter":
                  return on = Nr(on, p, k, T, Z, q), !0;
                case "mouseover":
                  return Kn = Nr(Kn, p, k, T, Z, q), !0;
                case "pointerover":
                  var ge = q.pointerId;
                  return fr.set(ge, Nr(fr.get(ge) || null, p, k, T, Z, q)), !0;
                case "gotpointercapture":
                  return ge = q.pointerId, Zr.set(ge, Nr(Zr.get(ge) || null, p, k, T, Z, q)), !0;
              }
              return !1;
            }(a, e, t, n, r)) {
              kn(e, r), e = Dn(e, r, null, t);
              try {
                X(rn, e);
              } finally {
                cr(e);
              }
            }
          }
        }
        function Ar(e, t, n, r) {
          if ((n = Ir(n = nn(r))) !== null) {
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
        var to = { animationIterationCount: !0, borderImageOutset: !0, borderImageSlice: !0, borderImageWidth: !0, boxFlex: !0, boxFlexGroup: !0, boxOrdinalGroup: !0, columnCount: !0, columns: !0, flex: !0, flexGrow: !0, flexPositive: !0, flexShrink: !0, flexNegative: !0, flexOrder: !0, gridArea: !0, gridRow: !0, gridRowEnd: !0, gridRowSpan: !0, gridRowStart: !0, gridColumn: !0, gridColumnEnd: !0, gridColumnSpan: !0, gridColumnStart: !0, fontWeight: !0, lineClamp: !0, lineHeight: !0, opacity: !0, order: !0, orphans: !0, tabSize: !0, widows: !0, zIndex: !0, zoom: !0, fillOpacity: !0, floodOpacity: !0, stopOpacity: !0, strokeDasharray: !0, strokeDashoffset: !0, strokeMiterlimit: !0, strokeOpacity: !0, strokeWidth: !0 }, Da = ["Webkit", "ms", "Moz", "O"];
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
          Da.forEach(function(t) {
            t = t + e.charAt(0).toUpperCase() + e.substring(1), to[t] = to[e];
          });
        });
        var Ti = o({ menuitem: !0 }, { area: !0, base: !0, br: !0, col: !0, embed: !0, hr: !0, img: !0, input: !0, keygen: !0, link: !0, meta: !0, param: !0, source: !0, track: !0, wbr: !0 });
        function Ko(e, t) {
          if (t) {
            if (Ti[e] && (t.children != null || t.dangerouslySetInnerHTML != null)) throw Error(m(137, e, ""));
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
        var Oi = H;
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
        function ei(e, t) {
          return e === "textarea" || e === "option" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
        }
        var ti = typeof setTimeout == "function" ? setTimeout : void 0, Ai = typeof clearTimeout == "function" ? clearTimeout : void 0;
        function Mr(e) {
          for (; e != null; e = e.nextSibling) {
            var t = e.nodeType;
            if (t === 1 || t === 3) break;
          }
          return e;
        }
        function Mi(e) {
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
        var Po = Math.random().toString(36).slice(2), Qn = "__reactInternalInstance$" + Po, no = "__reactEventHandlers$" + Po, ro = "__reactContainere$" + Po;
        function Ir(e) {
          var t = e[Qn];
          if (t) return t;
          for (var n = e.parentNode; n; ) {
            if (t = n[ro] || n[Qn]) {
              if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = Mi(e); e !== null; ) {
                if (n = e[Qn]) return n;
                e = Mi(e);
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
        function Ii(e, t) {
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
        function ji(e, t, n) {
          (t = Ii(e, n.dispatchConfig.phasedRegistrationNames[t])) && (n._dispatchListeners = Ue(n._dispatchListeners, t), n._dispatchInstances = Ue(n._dispatchInstances, e));
        }
        function Ra(e) {
          if (e && e.dispatchConfig.phasedRegistrationNames) {
            for (var t = e._targetInst, n = []; t; ) n.push(t), t = Rn(t);
            for (t = n.length; 0 < t--; ) ji(n[t], "captured", e);
            for (t = 0; t < n.length; t++) ji(n[t], "bubbled", e);
          }
        }
        function No(e, t, n) {
          e && n && n.dispatchConfig.registrationName && (t = Ii(e, n.dispatchConfig.registrationName)) && (n._dispatchListeners = Ue(n._dispatchListeners, t), n._dispatchInstances = Ue(n._dispatchInstances, e));
        }
        function Aa(e) {
          e && e.dispatchConfig.registrationName && No(e._targetInst, null, e);
        }
        function jr(e) {
          qn(e, Ra);
        }
        var hr = null, ri = null, Do = null;
        function zi() {
          if (Do) return Do;
          var e, t, n = ri, r = n.length, a = "value" in hr ? hr.value : hr.textContent, p = a.length;
          for (e = 0; e < r && n[e] === a[e]; e++) ;
          var k = r - e;
          for (t = 1; t <= k && n[r - t] === a[p - t]; t++) ;
          return Do = a.slice(e, 1 < t ? 1 - t : void 0);
        }
        function Ro() {
          return !0;
        }
        function Ao() {
          return !1;
        }
        function an(e, t, n, r) {
          for (var a in this.dispatchConfig = e, this._targetInst = t, this.nativeEvent = n, e = this.constructor.Interface) e.hasOwnProperty(a) && ((t = e[a]) ? this[a] = t(n) : a === "target" ? this.target = r : this[a] = n[a]);
          return this.isDefaultPrevented = (n.defaultPrevented != null ? n.defaultPrevented : n.returnValue === !1) ? Ro : Ao, this.isPropagationStopped = Ao, this;
        }
        function Li(e, t, n, r) {
          if (this.eventPool.length) {
            var a = this.eventPool.pop();
            return this.call(a, e, t, n, r), a;
          }
          return new this(e, t, n, r);
        }
        function $e(e) {
          if (!(e instanceof this)) throw Error(m(279));
          e.destructor(), 10 > this.eventPool.length && this.eventPool.push(e);
        }
        function E(e) {
          e.eventPool = [], e.getPooled = Li, e.release = $e;
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
          var a = new t();
          return o(a, n.prototype), n.prototype = a, n.prototype.constructor = n, n.Interface = o({}, r.Interface, e), n.extend = r.extend, E(n), n;
        }, E(an);
        var s = an.extend({ data: null }), d = an.extend({ data: null }), h = [9, 13, 27, 32], S = te && "CompositionEvent" in window, O = null;
        te && "documentMode" in document && (O = document.documentMode);
        var L = te && "TextEvent" in window && !O, ne = te && (!S || O && 8 < O && 11 >= O), fe = " ", pe = { beforeInput: { phasedRegistrationNames: { bubbled: "onBeforeInput", captured: "onBeforeInputCapture" }, dependencies: ["compositionend", "keypress", "textInput", "paste"] }, compositionEnd: { phasedRegistrationNames: { bubbled: "onCompositionEnd", captured: "onCompositionEndCapture" }, dependencies: "blur compositionend keydown keypress keyup mousedown".split(" ") }, compositionStart: { phasedRegistrationNames: { bubbled: "onCompositionStart", captured: "onCompositionStartCapture" }, dependencies: "blur compositionstart keydown keypress keyup mousedown".split(" ") }, compositionUpdate: { phasedRegistrationNames: { bubbled: "onCompositionUpdate", captured: "onCompositionUpdateCapture" }, dependencies: "blur compositionupdate keydown keypress keyup mousedown".split(" ") } }, Ee = !1;
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
        function Ve(e) {
          return typeof (e = e.detail) == "object" && "data" in e ? e.data : null;
        }
        var Ae = !1, Ke = { eventTypes: pe, extractEvents: function(e, t, n, r) {
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
          else Ae ? Ne(e, n) && (p = pe.compositionEnd) : e === "keydown" && n.keyCode === 229 && (p = pe.compositionStart);
          return p ? (ne && n.locale !== "ko" && (Ae || p !== pe.compositionStart ? p === pe.compositionEnd && Ae && (a = zi()) : (ri = "value" in (hr = r) ? hr.value : hr.textContent, Ae = !0)), p = s.getPooled(p, t, n, r), (a || (a = Ve(n)) !== null) && (p.data = a), jr(p), a = p) : a = null, (e = L ? function(k, T) {
            switch (k) {
              case "compositionend":
                return Ve(T);
              case "keypress":
                return T.which !== 32 ? null : (Ee = !0, fe);
              case "textInput":
                return (k = T.data) === fe && Ee ? null : k;
              default:
                return null;
            }
          }(e, n) : function(k, T) {
            if (Ae) return k === "compositionend" || !S && Ne(k, T) ? (k = zi(), Do = ri = hr = null, Ae = !1, k) : null;
            switch (k) {
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
        } }, Ie = { color: !0, date: !0, datetime: !0, "datetime-local": !0, email: !0, month: !0, number: !0, password: !0, range: !0, search: !0, tel: !0, text: !0, time: !0, url: !0, week: !0 };
        function Fe(e) {
          var t = e && e.nodeName && e.nodeName.toLowerCase();
          return t === "input" ? !!Ie[e.type] : t === "textarea";
        }
        var et = { change: { phasedRegistrationNames: { bubbled: "onChange", captured: "onChangeCapture" }, dependencies: "blur change click focus input keydown keyup selectionchange".split(" ") } };
        function Ye(e, t, n) {
          return (e = an.getPooled(et.change, e, t, n)).type = "change", D(n), jr(e), e;
        }
        var Le = null, dt = null;
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
          Le && (Le.detachEvent("onpropertychange", ft), dt = Le = null);
        }
        function ft(e) {
          if (e.propertyName === "value" && It(dt)) if (e = Ye(dt, e, nn(e)), Se) Mt(e);
          else {
            Se = !0;
            try {
              be(Dt, e);
            } finally {
              Se = !1, Je();
            }
          }
        }
        function An(e, t, n) {
          e === "focus" ? (zt(), dt = n, (Le = t).attachEvent("onpropertychange", ft)) : e === "blur" && zt();
        }
        function lt(e) {
          if (e === "selectionchange" || e === "keyup" || e === "keydown") return It(dt);
        }
        function Mn(e, t) {
          if (e === "click") return It(t);
        }
        function Hn(e, t) {
          if (e === "input" || e === "change") return It(t);
        }
        te && (_t = Wt("input") && (!document.documentMode || 9 < document.documentMode));
        var zr = { eventTypes: et, _isInputEventSupported: _t, extractEvents: function(e, t, n, r) {
          var a = t ? Gn(t) : window, p = a.nodeName && a.nodeName.toLowerCase();
          if (p === "select" || p === "input" && a.type === "file") var k = jt;
          else if (Fe(a)) if (_t) k = Hn;
          else {
            k = lt;
            var T = An;
          }
          else (p = a.nodeName) && p.toLowerCase() === "input" && (a.type === "checkbox" || a.type === "radio") && (k = Mn);
          if (k && (k = k(e, t))) return Ye(k, n, r);
          T && T(e, a, t), e === "blur" && (e = a._wrapperState) && e.controlled && a.type === "number" && Cn(a, "number", a.value);
        } }, xt = an.extend({ view: null, detail: null }), io = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
        function In(e) {
          var t = this.nativeEvent;
          return t.getModifierState ? t.getModifierState(e) : !!(e = io[e]) && !!t[e];
        }
        function $t() {
          return In;
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
        } }), oi = Lr.extend({ pointerId: null, width: null, height: null, pressure: null, tangentialPressure: null, tiltX: null, tiltY: null, twist: null, pointerType: null, isPrimary: null }), Ur = { mouseEnter: { registrationName: "onMouseEnter", dependencies: ["mouseout", "mouseover"] }, mouseLeave: { registrationName: "onMouseLeave", dependencies: ["mouseout", "mouseover"] }, pointerEnter: { registrationName: "onPointerEnter", dependencies: ["pointerout", "pointerover"] }, pointerLeave: { registrationName: "onPointerLeave", dependencies: ["pointerout", "pointerover"] } }, Mo = { eventTypes: Ur, extractEvents: function(e, t, n, r, a) {
          var p = e === "mouseover" || e === "pointerover", k = e === "mouseout" || e === "pointerout";
          if (p && (32 & a) == 0 && (n.relatedTarget || n.fromElement) || !k && !p || (p = r.window === r ? r : (p = r.ownerDocument) ? p.defaultView || p.parentWindow : window, k ? (k = t, (t = (t = n.relatedTarget || n.toElement) ? Ir(t) : null) !== null && (t !== Nn(t) || t.tag !== 5 && t.tag !== 6) && (t = null)) : k = null, k === t)) return null;
          if (e === "mouseout" || e === "mouseover") var T = Lr, Z = Ur.mouseLeave, q = Ur.mouseEnter, ge = "mouse";
          else e !== "pointerout" && e !== "pointerover" || (T = oi, Z = Ur.pointerLeave, q = Ur.pointerEnter, ge = "pointer");
          if (e = k == null ? p : Gn(k), p = t == null ? p : Gn(t), (Z = T.getPooled(Z, k, n, r)).type = ge + "leave", Z.target = e, Z.relatedTarget = p, (n = T.getPooled(q, t, n, r)).type = ge + "enter", n.target = p, n.relatedTarget = e, ge = t, (r = k) && ge) e: {
            for (q = ge, k = 0, e = T = r; e; e = Rn(e)) k++;
            for (e = 0, t = q; t; t = Rn(t)) e++;
            for (; 0 < k - e; ) T = Rn(T), k--;
            for (; 0 < e - k; ) q = Rn(q), e--;
            for (; k--; ) {
              if (T === q || T === q.alternate) break e;
              T = Rn(T), q = Rn(q);
            }
            T = null;
          }
          else T = null;
          for (q = T, T = []; r && r !== q && ((k = r.alternate) === null || k !== q); ) T.push(r), r = Rn(r);
          for (r = []; ge && ge !== q && ((k = ge.alternate) === null || k !== q); ) r.push(ge), ge = Rn(ge);
          for (ge = 0; ge < T.length; ge++) No(T[ge], "bubbled", Z);
          for (ge = r.length; 0 < ge--; ) No(r[ge], "captured", n);
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
        var Io = te && "documentMode" in document && 11 >= document.documentMode, ii = { select: { phasedRegistrationNames: { bubbled: "onSelect", captured: "onSelectCapture" }, dependencies: "blur contextmenu dragend focus keydown keyup mousedown mouseup selectionchange".split(" ") } }, Zn = null, ao = null, wn = null, so = !1;
        function Ps(e, t) {
          var n = t.window === t ? t.document : t.nodeType === 9 ? t : t.ownerDocument;
          return so || Zn == null || Zn !== Go(n) ? null : ("selectionStart" in (n = Zn) && Xo(n) ? n = { start: n.selectionStart, end: n.selectionEnd } : n = { anchorNode: (n = (n.ownerDocument && n.ownerDocument.defaultView || window).getSelection()).anchorNode, anchorOffset: n.anchorOffset, focusNode: n.focusNode, focusOffset: n.focusOffset }, wn && gr(wn, n) ? null : (wn = n, (e = an.getPooled(ii.select, ao, e, t)).type = "select", e.target = Zn, jr(e), e));
        }
        var rc = { eventTypes: ii, extractEvents: function(e, t, n, r, a, p) {
          if (!(p = !(a = p || (r.window === r ? r.document : r.nodeType === 9 ? r : r.ownerDocument)))) {
            e: {
              a = un(a), p = se.onSelect;
              for (var k = 0; k < p.length; k++) if (!a.has(p[k])) {
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
              (Fe(a) || a.contentEditable === "true") && (Zn = a, ao = t, wn = null);
              break;
            case "blur":
              wn = ao = Zn = null;
              break;
            case "mousedown":
              so = !0;
              break;
            case "contextmenu":
            case "mouseup":
            case "dragend":
              return so = !1, Ps(n, r);
            case "selectionchange":
              if (Io) break;
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
        }, deltaZ: null, deltaMode: null }), hc = { eventTypes: Ei, extractEvents: function(e, t, n, r) {
          var a = _i.get(e);
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
            case Vt:
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
              e = oi;
              break;
            default:
              e = an;
          }
          return jr(t = e.getPooled(a, t, n, r)), t;
        } };
        if (I) throw Error(m(101));
        I = Array.prototype.slice.call("ResponderEventPlugin SimpleEventPlugin EnterLeaveEventPlugin ChangeEventPlugin SelectEventPlugin BeforeInputEventPlugin".split(" ")), R(), K = ni, j = oo, B = Gn, le({ SimpleEventPlugin: hc, EnterLeaveEventPlugin: Mo, ChangeEventPlugin: zr, SelectEventPlugin: rc, BeforeInputEventPlugin: Ke });
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
          var a, p = {};
          for (a in n) p[a] = t[a];
          return r && ((e = e.stateNode).__reactInternalMemoizedUnmaskedChildContext = t, e.__reactInternalMemoizedMaskedChildContext = p), p;
        }
        function hn(e) {
          return (e = e.childContextTypes) != null;
        }
        function Bi() {
          vt(pn), vt(Xt);
        }
        function Ns(e, t, n) {
          if (Xt.current !== Fr) throw Error(m(168));
          St(Xt, t), St(pn, n);
        }
        function Ds(e, t, n) {
          var r = e.stateNode;
          if (e = t.childContextTypes, typeof r.getChildContext != "function") return n;
          for (var a in r = r.getChildContext()) if (!(a in e)) throw Error(m(108, Yt(t) || "Unknown", a));
          return o({}, n, {}, r);
        }
        function Vi(e) {
          return e = (e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext || Fr, lo = Xt.current, St(Xt, e), St(pn, pn.current), !0;
        }
        function Rs(e, t, n) {
          var r = e.stateNode;
          if (!r) throw Error(m(169));
          n ? (e = Ds(e, t, lo), r.__reactInternalMemoizedMergedChildContext = e, vt(pn), vt(Xt), St(Xt, e)) : vt(pn), St(pn, n);
        }
        var mc = _.unstable_runWithPriority, Ia = _.unstable_scheduleCallback, As = _.unstable_cancelCallback, Ms = _.unstable_requestPaint, ja = _.unstable_now, gc = _.unstable_getCurrentPriorityLevel, Wi = _.unstable_ImmediatePriority, Is = _.unstable_UserBlockingPriority, js = _.unstable_NormalPriority, zs = _.unstable_LowPriority, Ls = _.unstable_IdlePriority, Us = {}, bc = _.unstable_shouldYield, yc = Ms !== void 0 ? Ms : function() {
        }, br = null, Hi = null, za = !1, Fs = ja(), jn = 1e4 > Fs ? ja : function() {
          return ja() - Fs;
        };
        function $i() {
          switch (gc()) {
            case Wi:
              return 99;
            case Is:
              return 98;
            case js:
              return 97;
            case zs:
              return 96;
            case Ls:
              return 95;
            default:
              throw Error(m(332));
          }
        }
        function Bs(e) {
          switch (e) {
            case 99:
              return Wi;
            case 98:
              return Is;
            case 97:
              return js;
            case 96:
              return zs;
            case 95:
              return Ls;
            default:
              throw Error(m(332));
          }
        }
        function Br(e, t) {
          return e = Bs(e), mc(e, t);
        }
        function Vs(e, t, n) {
          return e = Bs(e), Ia(e, t, n);
        }
        function Ws(e) {
          return br === null ? (br = [e], Hi = Ia(Wi, Hs)) : br.push(e), Us;
        }
        function Jn() {
          if (Hi !== null) {
            var e = Hi;
            Hi = null, As(e);
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
              throw br !== null && (br = br.slice(e + 1)), Ia(Wi, Jn), n;
            } finally {
              za = !1;
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
        var qi = { current: null }, Ki = null, Lo = null, Qi = null;
        function La() {
          Qi = Lo = Ki = null;
        }
        function Ua(e) {
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
        function Uo(e, t) {
          Ki = e, Qi = Lo = null, (e = e.dependencies) !== null && e.firstContext !== null && (e.expirationTime >= t && (tr = !0), e.firstContext = null);
        }
        function zn(e, t) {
          if (Qi !== e && t !== !1 && t !== 0) if (typeof t == "number" && t !== 1073741823 || (Qi = e, t = 1073741823), t = { context: e, observedBits: t, next: null }, Lo === null) {
            if (Ki === null) throw Error(m(308));
            Lo = t, Ki.dependencies = { expirationTime: 0, firstContext: t, responders: null };
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
        function Ys(e, t) {
          var n = e.alternate;
          n !== null && Ba(n, e), (n = (e = e.updateQueue).baseQueue) === null ? (e.baseQueue = t.next = t, t.next = t) : (t.next = n.next, n.next = t);
        }
        function ai(e, t, n, r) {
          var a = e.updateQueue;
          Vr = !1;
          var p = a.baseQueue, k = a.shared.pending;
          if (k !== null) {
            if (p !== null) {
              var T = p.next;
              p.next = k.next, k.next = T;
            }
            p = k, a.shared.pending = null, (T = e.alternate) !== null && (T = T.updateQueue) !== null && (T.baseQueue = k);
          }
          if (p !== null) {
            T = p.next;
            var Z = a.baseState, q = 0, ge = null, De = null, We = null;
            if (T !== null) for (var ot = T; ; ) {
              if ((k = ot.expirationTime) < r) {
                var Fn = { expirationTime: ot.expirationTime, suspenseConfig: ot.suspenseConfig, tag: ot.tag, payload: ot.payload, callback: ot.callback, next: null };
                We === null ? (De = We = Fn, ge = Z) : We = We.next = Fn, k > q && (q = k);
              } else {
                We !== null && (We = We.next = { expirationTime: 1073741823, suspenseConfig: ot.suspenseConfig, tag: ot.tag, payload: ot.payload, callback: ot.callback, next: null }), Bl(k, ot.suspenseConfig);
                e: {
                  var ln = e, re = ot;
                  switch (k = t, Fn = n, re.tag) {
                    case 1:
                      if (typeof (ln = re.payload) == "function") {
                        Z = ln.call(Fn, Z, k);
                        break e;
                      }
                      Z = ln;
                      break e;
                    case 3:
                      ln.effectTag = -4097 & ln.effectTag | 64;
                    case 0:
                      if ((k = typeof (ln = re.payload) == "function" ? ln.call(Fn, Z, k) : ln) == null) break e;
                      Z = o({}, Z, k);
                      break e;
                    case 2:
                      Vr = !0;
                  }
                }
                ot.callback !== null && (e.effectTag |= 32, (k = a.effects) === null ? a.effects = [ot] : k.push(ot));
              }
              if ((ot = ot.next) === null || ot === T) {
                if ((k = a.shared.pending) === null) break;
                ot = p.next = k.next, k.next = T, a.baseQueue = p = k, a.shared.pending = null;
              }
            }
            We === null ? ge = Z : We.next = De, a.baseState = ge, a.baseQueue = We, wa(q), e.expirationTime = q, e.memoizedState = Z;
          }
        }
        function qs(e, t, n) {
          if (e = t.effects, t.effects = null, e !== null) for (t = 0; t < e.length; t++) {
            var r = e[t], a = r.callback;
            if (a !== null) {
              if (r.callback = null, r = a, a = n, typeof r != "function") throw Error(m(191, r));
              r.call(a);
            }
          }
        }
        var si = he.ReactCurrentBatchConfig, Ks = new c.Component().refs;
        function Gi(e, t, n, r) {
          n = (n = n(r, t = e.memoizedState)) == null ? t : o({}, t, n), e.memoizedState = n, e.expirationTime === 0 && (e.updateQueue.baseState = n);
        }
        var Xi = { isMounted: function(e) {
          return !!(e = e._reactInternalFiber) && Nn(e) === e;
        }, enqueueSetState: function(e, t, n) {
          e = e._reactInternalFiber;
          var r = nr(), a = si.suspense;
          (a = Wr(r = mo(r, e, a), a)).payload = t, n != null && (a.callback = n), Hr(e, a), Kr(e, r);
        }, enqueueReplaceState: function(e, t, n) {
          e = e._reactInternalFiber;
          var r = nr(), a = si.suspense;
          (a = Wr(r = mo(r, e, a), a)).tag = 1, a.payload = t, n != null && (a.callback = n), Hr(e, a), Kr(e, r);
        }, enqueueForceUpdate: function(e, t) {
          e = e._reactInternalFiber;
          var n = nr(), r = si.suspense;
          (r = Wr(n = mo(n, e, r), r)).tag = 2, t != null && (r.callback = t), Hr(e, r), Kr(e, n);
        } };
        function Qs(e, t, n, r, a, p, k) {
          return typeof (e = e.stateNode).shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, p, k) : !t.prototype || !t.prototype.isPureReactComponent || !gr(n, r) || !gr(a, p);
        }
        function Gs(e, t, n) {
          var r = !1, a = Fr, p = t.contextType;
          return typeof p == "object" && p !== null ? p = zn(p) : (a = hn(t) ? lo : Xt.current, p = (r = (r = t.contextTypes) != null) ? zo(e, a) : Fr), t = new t(n, p), e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null, t.updater = Xi, e.stateNode = t, t._reactInternalFiber = e, r && ((e = e.stateNode).__reactInternalMemoizedUnmaskedChildContext = a, e.__reactInternalMemoizedMaskedChildContext = p), t;
        }
        function Xs(e, t, n, r) {
          e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, r), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, r), t.state !== e && Xi.enqueueReplaceState(t, t.state, null);
        }
        function Va(e, t, n, r) {
          var a = e.stateNode;
          a.props = n, a.state = e.memoizedState, a.refs = Ks, Fa(e);
          var p = t.contextType;
          typeof p == "object" && p !== null ? a.context = zn(p) : (p = hn(t) ? lo : Xt.current, a.context = zo(e, p)), ai(e, n, a, r), a.state = e.memoizedState, typeof (p = t.getDerivedStateFromProps) == "function" && (Gi(e, t, p, n), a.state = e.memoizedState), typeof t.getDerivedStateFromProps == "function" || typeof a.getSnapshotBeforeUpdate == "function" || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (t = a.state, typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount(), t !== a.state && Xi.enqueueReplaceState(a, a.state, null), ai(e, n, a, r), a.state = e.memoizedState), typeof a.componentDidMount == "function" && (e.effectTag |= 4);
        }
        var Zi = Array.isArray;
        function li(e, t, n) {
          if ((e = n.ref) !== null && typeof e != "function" && typeof e != "object") {
            if (n._owner) {
              if (n = n._owner) {
                if (n.tag !== 1) throw Error(m(309));
                var r = n.stateNode;
              }
              if (!r) throw Error(m(147, e));
              var a = "" + e;
              return t !== null && t.ref !== null && typeof t.ref == "function" && t.ref._stringRef === a ? t.ref : ((t = function(p) {
                var k = r.refs;
                k === Ks && (k = r.refs = {}), p === null ? delete k[a] : k[a] = p;
              })._stringRef = a, t);
            }
            if (typeof e != "string") throw Error(m(284));
            if (!n._owner) throw Error(m(290, e));
          }
          return e;
        }
        function Ji(e, t) {
          if (e.type !== "textarea") throw Error(m(31, Object.prototype.toString.call(t) === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : t, ""));
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
          function k(re) {
            return e && re.alternate === null && (re.effectTag = 2), re;
          }
          function T(re, ee, ue, ve) {
            return ee === null || ee.tag !== 6 ? ((ee = ys(ue, re.mode, ve)).return = re, ee) : ((ee = a(ee, ue)).return = re, ee);
          }
          function Z(re, ee, ue, ve) {
            return ee !== null && ee.elementType === ue.type ? ((ve = a(ee, ue.props)).ref = li(re, ee, ue), ve.return = re, ve) : ((ve = Ea(ue.type, ue.key, ue.props, null, re.mode, ve)).ref = li(re, ee, ue), ve.return = re, ve);
          }
          function q(re, ee, ue, ve) {
            return ee === null || ee.tag !== 4 || ee.stateNode.containerInfo !== ue.containerInfo || ee.stateNode.implementation !== ue.implementation ? ((ee = vs(ue, re.mode, ve)).return = re, ee) : ((ee = a(ee, ue.children || [])).return = re, ee);
          }
          function ge(re, ee, ue, ve, _e) {
            return ee === null || ee.tag !== 7 ? ((ee = Qr(ue, re.mode, ve, _e)).return = re, ee) : ((ee = a(ee, ue)).return = re, ee);
          }
          function De(re, ee, ue) {
            if (typeof ee == "string" || typeof ee == "number") return (ee = ys("" + ee, re.mode, ue)).return = re, ee;
            if (typeof ee == "object" && ee !== null) {
              switch (ee.$$typeof) {
                case He:
                  return (ue = Ea(ee.type, ee.key, ee.props, null, re.mode, ue)).ref = li(re, null, ee), ue.return = re, ue;
                case At:
                  return (ee = vs(ee, re.mode, ue)).return = re, ee;
              }
              if (Zi(ee) || en(ee)) return (ee = Qr(ee, re.mode, ue, null)).return = re, ee;
              Ji(re, ee);
            }
            return null;
          }
          function We(re, ee, ue, ve) {
            var _e = ee !== null ? ee.key : null;
            if (typeof ue == "string" || typeof ue == "number") return _e !== null ? null : T(re, ee, "" + ue, ve);
            if (typeof ue == "object" && ue !== null) {
              switch (ue.$$typeof) {
                case He:
                  return ue.key === _e ? ue.type === kt ? ge(re, ee, ue.props.children, ve, _e) : Z(re, ee, ue, ve) : null;
                case At:
                  return ue.key === _e ? q(re, ee, ue, ve) : null;
              }
              if (Zi(ue) || en(ue)) return _e !== null ? null : ge(re, ee, ue, ve, null);
              Ji(re, ue);
            }
            return null;
          }
          function ot(re, ee, ue, ve, _e) {
            if (typeof ve == "string" || typeof ve == "number") return T(ee, re = re.get(ue) || null, "" + ve, _e);
            if (typeof ve == "object" && ve !== null) {
              switch (ve.$$typeof) {
                case He:
                  return re = re.get(ve.key === null ? ue : ve.key) || null, ve.type === kt ? ge(ee, re, ve.props.children, _e, ve.key) : Z(ee, re, ve, _e);
                case At:
                  return q(ee, re = re.get(ve.key === null ? ue : ve.key) || null, ve, _e);
              }
              if (Zi(ve) || en(ve)) return ge(ee, re = re.get(ue) || null, ve, _e, null);
              Ji(ee, ve);
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
            return e && Be.forEach(function(wr) {
              return t(re, wr);
            }), _e;
          }
          return function(re, ee, ue, ve) {
            var _e = typeof ue == "object" && ue !== null && ue.type === kt && ue.key === null;
            _e && (ue = ue.props.children);
            var Oe = typeof ue == "object" && ue !== null;
            if (Oe) switch (ue.$$typeof) {
              case He:
                e: {
                  for (Oe = ue.key, _e = ee; _e !== null; ) {
                    if (_e.key === Oe) {
                      switch (_e.tag) {
                        case 7:
                          if (ue.type === kt) {
                            n(re, _e.sibling), (ee = a(_e, ue.props.children)).return = re, re = ee;
                            break e;
                          }
                          break;
                        default:
                          if (_e.elementType === ue.type) {
                            n(re, _e.sibling), (ee = a(_e, ue.props)).ref = li(re, _e, ue), ee.return = re, re = ee;
                            break e;
                          }
                      }
                      n(re, _e);
                      break;
                    }
                    t(re, _e), _e = _e.sibling;
                  }
                  ue.type === kt ? ((ee = Qr(ue.props.children, re.mode, ve, ue.key)).return = re, re = ee) : ((ve = Ea(ue.type, ue.key, ue.props, null, re.mode, ve)).ref = li(re, ee, ue), ve.return = re, re = ve);
                }
                return k(re);
              case At:
                e: {
                  for (_e = ue.key; ee !== null; ) {
                    if (ee.key === _e) {
                      if (ee.tag === 4 && ee.stateNode.containerInfo === ue.containerInfo && ee.stateNode.implementation === ue.implementation) {
                        n(re, ee.sibling), (ee = a(ee, ue.children || [])).return = re, re = ee;
                        break e;
                      }
                      n(re, ee);
                      break;
                    }
                    t(re, ee), ee = ee.sibling;
                  }
                  (ee = vs(ue, re.mode, ve)).return = re, re = ee;
                }
                return k(re);
            }
            if (typeof ue == "string" || typeof ue == "number") return ue = "" + ue, ee !== null && ee.tag === 6 ? (n(re, ee.sibling), (ee = a(ee, ue)).return = re, re = ee) : (n(re, ee), (ee = ys(ue, re.mode, ve)).return = re, re = ee), k(re);
            if (Zi(ue)) return Fn(re, ee, ue, ve);
            if (en(ue)) return ln(re, ee, ue, ve);
            if (Oe && Ji(re, ue), ue === void 0 && !_e) switch (re.tag) {
              case 1:
              case 0:
                throw re = re.type, Error(m(152, re.displayName || re.name || "Component"));
            }
            return n(re, ee);
          };
        }
        var Fo = Zs(!0), Wa = Zs(!1), ci = {}, er = { current: ci }, ui = { current: ci }, di = { current: ci };
        function co(e) {
          if (e === ci) throw Error(m(174));
          return e;
        }
        function Ha(e, t) {
          switch (St(di, t), St(ui, e), St(er, ci), e = t.nodeType) {
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
          vt(er), vt(ui), vt(di);
        }
        function Js(e) {
          co(di.current);
          var t = co(er.current), n = Ce(t, e.type);
          t !== n && (St(ui, e), St(er, n));
        }
        function $a(e) {
          ui.current === e && (vt(er), vt(ui));
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
        function Ya(e, t) {
          return { responder: e, props: t };
        }
        var ta = he.ReactCurrentDispatcher, Ln = he.ReactCurrentBatchConfig, $r = 0, Lt = null, sn = null, Zt = null, na = !1;
        function En() {
          throw Error(m(321));
        }
        function qa(e, t) {
          if (t === null) return !1;
          for (var n = 0; n < t.length && n < e.length; n++) if (!mr(e[n], t[n])) return !1;
          return !0;
        }
        function Ka(e, t, n, r, a, p) {
          if ($r = p, Lt = t, t.memoizedState = null, t.updateQueue = null, t.expirationTime = 0, ta.current = e === null || e.memoizedState === null ? vc : kc, e = n(r, a), t.expirationTime === $r) {
            p = 0;
            do {
              if (t.expirationTime = 0, !(25 > p)) throw Error(m(301));
              p += 1, Zt = sn = null, t.updateQueue = null, ta.current = wc, e = n(r, a);
            } while (t.expirationTime === $r);
          }
          if (ta.current = sa, t = sn !== null && sn.next !== null, $r = 0, Zt = sn = Lt = null, na = !1, t) throw Error(m(300));
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
        function ra(e) {
          var t = Wo(), n = t.queue;
          if (n === null) throw Error(m(311));
          n.lastRenderedReducer = e;
          var r = sn, a = r.baseQueue, p = n.pending;
          if (p !== null) {
            if (a !== null) {
              var k = a.next;
              a.next = p.next, p.next = k;
            }
            r.baseQueue = a = p, n.pending = null;
          }
          if (a !== null) {
            a = a.next, r = r.baseState;
            var T = k = p = null, Z = a;
            do {
              var q = Z.expirationTime;
              if (q < $r) {
                var ge = { expirationTime: Z.expirationTime, suspenseConfig: Z.suspenseConfig, action: Z.action, eagerReducer: Z.eagerReducer, eagerState: Z.eagerState, next: null };
                T === null ? (k = T = ge, p = r) : T = T.next = ge, q > Lt.expirationTime && (Lt.expirationTime = q, wa(q));
              } else T !== null && (T = T.next = { expirationTime: 1073741823, suspenseConfig: Z.suspenseConfig, action: Z.action, eagerReducer: Z.eagerReducer, eagerState: Z.eagerState, next: null }), Bl(q, Z.suspenseConfig), r = Z.eagerReducer === e ? Z.eagerState : e(r, Z.action);
              Z = Z.next;
            } while (Z !== null && Z !== a);
            T === null ? p = r : T.next = k, mr(r, t.memoizedState) || (tr = !0), t.memoizedState = r, t.baseState = p, t.baseQueue = T, n.lastRenderedState = r;
          }
          return [t.memoizedState, n.dispatch];
        }
        function oa(e) {
          var t = Wo(), n = t.queue;
          if (n === null) throw Error(m(311));
          n.lastRenderedReducer = e;
          var r = n.dispatch, a = n.pending, p = t.memoizedState;
          if (a !== null) {
            n.pending = null;
            var k = a = a.next;
            do
              p = e(p, k.action), k = k.next;
            while (k !== a);
            mr(p, t.memoizedState) || (tr = !0), t.memoizedState = p, t.baseQueue === null && (t.baseState = p), n.lastRenderedState = p;
          }
          return [p, r];
        }
        function Qa(e) {
          var t = Vo();
          return typeof e == "function" && (e = e()), t.memoizedState = t.baseState = e, e = (e = t.queue = { pending: null, dispatch: null, lastRenderedReducer: uo, lastRenderedState: e }).dispatch = sl.bind(null, Lt, e), [t.memoizedState, e];
        }
        function Ga(e, t, n, r) {
          return e = { tag: e, create: t, destroy: n, deps: r, next: null }, (t = Lt.updateQueue) === null ? (t = { lastEffect: null }, Lt.updateQueue = t, t.lastEffect = e.next = e) : (n = t.lastEffect) === null ? t.lastEffect = e.next = e : (r = n.next, n.next = e, e.next = r, t.lastEffect = e), e;
        }
        function el() {
          return Wo().memoizedState;
        }
        function Xa(e, t, n, r) {
          var a = Vo();
          Lt.effectTag |= e, a.memoizedState = Ga(1 | t, n, void 0, r === void 0 ? null : r);
        }
        function Za(e, t, n, r) {
          var a = Wo();
          r = r === void 0 ? null : r;
          var p = void 0;
          if (sn !== null) {
            var k = sn.memoizedState;
            if (p = k.destroy, r !== null && qa(r, k.deps)) return void Ga(t, n, p, r);
          }
          Lt.effectTag |= e, a.memoizedState = Ga(1 | t, n, p, r);
        }
        function tl(e, t) {
          return Xa(516, 4, e, t);
        }
        function ia(e, t) {
          return Za(516, 4, e, t);
        }
        function nl(e, t) {
          return Za(4, 2, e, t);
        }
        function rl(e, t) {
          return typeof t == "function" ? (e = e(), t(e), function() {
            t(null);
          }) : t != null ? (e = e(), t.current = e, function() {
            t.current = null;
          }) : void 0;
        }
        function ol(e, t, n) {
          return n = n != null ? n.concat([e]) : null, Za(4, 2, rl.bind(null, t, e), n);
        }
        function Ja() {
        }
        function il(e, t) {
          return Vo().memoizedState = [e, t === void 0 ? null : t], e;
        }
        function aa(e, t) {
          var n = Wo();
          t = t === void 0 ? null : t;
          var r = n.memoizedState;
          return r !== null && t !== null && qa(t, r[1]) ? r[0] : (n.memoizedState = [e, t], e);
        }
        function al(e, t) {
          var n = Wo();
          t = t === void 0 ? null : t;
          var r = n.memoizedState;
          return r !== null && t !== null && qa(t, r[1]) ? r[0] : (e = e(), n.memoizedState = [e, t], e);
        }
        function es(e, t, n) {
          var r = $i();
          Br(98 > r ? 98 : r, function() {
            e(!0);
          }), Br(97 < r ? 97 : r, function() {
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
          var r = nr(), a = si.suspense;
          a = { expirationTime: r = mo(r, e, a), suspenseConfig: a, action: n, eagerReducer: null, eagerState: null, next: null };
          var p = t.pending;
          if (p === null ? a.next = a : (a.next = p.next, p.next = a), t.pending = a, p = e.alternate, e === Lt || p !== null && p === Lt) na = !0, a.expirationTime = $r, Lt.expirationTime = $r;
          else {
            if (e.expirationTime === 0 && (p === null || p.expirationTime === 0) && (p = t.lastRenderedReducer) !== null) try {
              var k = t.lastRenderedState, T = p(k, n);
              if (a.eagerReducer = p, a.eagerState = T, mr(T, k)) return;
            } catch {
            }
            Kr(e, r);
          }
        }
        var sa = { readContext: zn, useCallback: En, useContext: En, useEffect: En, useImperativeHandle: En, useLayoutEffect: En, useMemo: En, useReducer: En, useRef: En, useState: En, useDebugValue: En, useResponder: En, useDeferredValue: En, useTransition: En }, vc = { readContext: zn, useCallback: il, useContext: zn, useEffect: tl, useImperativeHandle: function(e, t, n) {
          return n = n != null ? n.concat([e]) : null, Xa(4, 2, rl.bind(null, t, e), n);
        }, useLayoutEffect: function(e, t) {
          return Xa(4, 2, e, t);
        }, useMemo: function(e, t) {
          var n = Vo();
          return t = t === void 0 ? null : t, e = e(), n.memoizedState = [e, t], e;
        }, useReducer: function(e, t, n) {
          var r = Vo();
          return t = n !== void 0 ? n(t) : t, r.memoizedState = r.baseState = t, e = (e = r.queue = { pending: null, dispatch: null, lastRenderedReducer: e, lastRenderedState: t }).dispatch = sl.bind(null, Lt, e), [r.memoizedState, e];
        }, useRef: function(e) {
          return e = { current: e }, Vo().memoizedState = e;
        }, useState: Qa, useDebugValue: Ja, useResponder: Ya, useDeferredValue: function(e, t) {
          var n = Qa(e), r = n[0], a = n[1];
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
          var t = Qa(!1), n = t[0];
          return t = t[1], [il(es.bind(null, t, e), [t, e]), n];
        } }, kc = { readContext: zn, useCallback: aa, useContext: zn, useEffect: ia, useImperativeHandle: ol, useLayoutEffect: nl, useMemo: al, useReducer: ra, useRef: el, useState: function() {
          return ra(uo);
        }, useDebugValue: Ja, useResponder: Ya, useDeferredValue: function(e, t) {
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
          return t = t[1], [aa(es.bind(null, t, e), [t, e]), n];
        } }, wc = { readContext: zn, useCallback: aa, useContext: zn, useEffect: ia, useImperativeHandle: ol, useLayoutEffect: nl, useMemo: al, useReducer: oa, useRef: el, useState: function() {
          return oa(uo);
        }, useDebugValue: Ja, useResponder: Ya, useDeferredValue: function(e, t) {
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
          return t = t[1], [aa(es.bind(null, t, e), [t, e]), n];
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
        function ts(e) {
          if (fo) {
            var t = Yr;
            if (t) {
              var n = t;
              if (!cl(e, t)) {
                if (!(t = Mr(n.nextSibling)) || !cl(e, t)) return e.effectTag = -1025 & e.effectTag | 2, fo = !1, void (yr = e);
                ll(yr, n);
              }
              yr = e, Yr = Mr(t.firstChild);
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
          if (e.tag !== 5 || t !== "head" && t !== "body" && !ei(t, e.memoizedProps)) for (t = Yr; t; ) ll(e, t), t = Mr(t.nextSibling);
          if (ul(e), e.tag === 13) {
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
        function dl(e, t, n, r, a) {
          n = n.render;
          var p = t.ref;
          return Uo(t, a), r = Ka(e, t, n, r, p, a), e === null || tr ? (t.effectTag |= 1, Un(e, t, r, a), t.child) : (t.updateQueue = e.updateQueue, t.effectTag &= -517, e.expirationTime <= a && (e.expirationTime = 0), vr(e, t, a));
        }
        function fl(e, t, n, r, a, p) {
          if (e === null) {
            var k = n.type;
            return typeof k != "function" || bs(k) || k.defaultProps !== void 0 || n.compare !== null || n.defaultProps !== void 0 ? ((e = Ea(n.type, null, r, null, t.mode, p)).ref = t.ref, e.return = t, t.child = e) : (t.tag = 15, t.type = k, pl(e, t, k, r, a, p));
          }
          return k = e.child, a < p && (a = k.memoizedProps, (n = (n = n.compare) !== null ? n : gr)(a, r) && e.ref === t.ref) ? vr(e, t, p) : (t.effectTag |= 1, (e = vo(k, r)).ref = t.ref, e.return = t, t.child = e);
        }
        function pl(e, t, n, r, a, p) {
          return e !== null && gr(e.memoizedProps, r) && e.ref === t.ref && (tr = !1, a < p) ? (t.expirationTime = e.expirationTime, vr(e, t, p)) : rs(e, t, n, r, p);
        }
        function hl(e, t) {
          var n = t.ref;
          (e === null && n !== null || e !== null && e.ref !== n) && (t.effectTag |= 128);
        }
        function rs(e, t, n, r, a) {
          var p = hn(n) ? lo : Xt.current;
          return p = zo(t, p), Uo(t, a), n = Ka(e, t, n, r, p, a), e === null || tr ? (t.effectTag |= 1, Un(e, t, n, a), t.child) : (t.updateQueue = e.updateQueue, t.effectTag &= -517, e.expirationTime <= a && (e.expirationTime = 0), vr(e, t, a));
        }
        function ml(e, t, n, r, a) {
          if (hn(n)) {
            var p = !0;
            Vi(t);
          } else p = !1;
          if (Uo(t, a), t.stateNode === null) e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= 2), Gs(t, n, r), Va(t, n, r, a), r = !0;
          else if (e === null) {
            var k = t.stateNode, T = t.memoizedProps;
            k.props = T;
            var Z = k.context, q = n.contextType;
            typeof q == "object" && q !== null ? q = zn(q) : q = zo(t, q = hn(n) ? lo : Xt.current);
            var ge = n.getDerivedStateFromProps, De = typeof ge == "function" || typeof k.getSnapshotBeforeUpdate == "function";
            De || typeof k.UNSAFE_componentWillReceiveProps != "function" && typeof k.componentWillReceiveProps != "function" || (T !== r || Z !== q) && Xs(t, k, r, q), Vr = !1;
            var We = t.memoizedState;
            k.state = We, ai(t, r, k, a), Z = t.memoizedState, T !== r || We !== Z || pn.current || Vr ? (typeof ge == "function" && (Gi(t, n, ge, r), Z = t.memoizedState), (T = Vr || Qs(t, n, T, r, We, Z, q)) ? (De || typeof k.UNSAFE_componentWillMount != "function" && typeof k.componentWillMount != "function" || (typeof k.componentWillMount == "function" && k.componentWillMount(), typeof k.UNSAFE_componentWillMount == "function" && k.UNSAFE_componentWillMount()), typeof k.componentDidMount == "function" && (t.effectTag |= 4)) : (typeof k.componentDidMount == "function" && (t.effectTag |= 4), t.memoizedProps = r, t.memoizedState = Z), k.props = r, k.state = Z, k.context = q, r = T) : (typeof k.componentDidMount == "function" && (t.effectTag |= 4), r = !1);
          } else k = t.stateNode, Ba(e, t), T = t.memoizedProps, k.props = t.type === t.elementType ? T : $n(t.type, T), Z = k.context, typeof (q = n.contextType) == "object" && q !== null ? q = zn(q) : q = zo(t, q = hn(n) ? lo : Xt.current), (De = typeof (ge = n.getDerivedStateFromProps) == "function" || typeof k.getSnapshotBeforeUpdate == "function") || typeof k.UNSAFE_componentWillReceiveProps != "function" && typeof k.componentWillReceiveProps != "function" || (T !== r || Z !== q) && Xs(t, k, r, q), Vr = !1, Z = t.memoizedState, k.state = Z, ai(t, r, k, a), We = t.memoizedState, T !== r || Z !== We || pn.current || Vr ? (typeof ge == "function" && (Gi(t, n, ge, r), We = t.memoizedState), (ge = Vr || Qs(t, n, T, r, Z, We, q)) ? (De || typeof k.UNSAFE_componentWillUpdate != "function" && typeof k.componentWillUpdate != "function" || (typeof k.componentWillUpdate == "function" && k.componentWillUpdate(r, We, q), typeof k.UNSAFE_componentWillUpdate == "function" && k.UNSAFE_componentWillUpdate(r, We, q)), typeof k.componentDidUpdate == "function" && (t.effectTag |= 4), typeof k.getSnapshotBeforeUpdate == "function" && (t.effectTag |= 256)) : (typeof k.componentDidUpdate != "function" || T === e.memoizedProps && Z === e.memoizedState || (t.effectTag |= 4), typeof k.getSnapshotBeforeUpdate != "function" || T === e.memoizedProps && Z === e.memoizedState || (t.effectTag |= 256), t.memoizedProps = r, t.memoizedState = We), k.props = r, k.state = We, k.context = q, r = ge) : (typeof k.componentDidUpdate != "function" || T === e.memoizedProps && Z === e.memoizedState || (t.effectTag |= 4), typeof k.getSnapshotBeforeUpdate != "function" || T === e.memoizedProps && Z === e.memoizedState || (t.effectTag |= 256), r = !1);
          return os(e, t, n, r, p, a);
        }
        function os(e, t, n, r, a, p) {
          hl(e, t);
          var k = (64 & t.effectTag) != 0;
          if (!r && !k) return a && Rs(t, n, !1), vr(e, t, p);
          r = t.stateNode, Ec.current = t;
          var T = k && typeof n.getDerivedStateFromError != "function" ? null : r.render();
          return t.effectTag |= 1, e !== null && k ? (t.child = Fo(t, e.child, null, p), t.child = Fo(t, null, T, p)) : Un(e, t, T, p), t.memoizedState = r.state, a && Rs(t, n, !0), t.child;
        }
        function gl(e) {
          var t = e.stateNode;
          t.pendingContext ? Ns(0, t.pendingContext, t.pendingContext !== t.context) : t.context && Ns(0, t.context, !1), Ha(e, t.containerInfo);
        }
        var bl, yl, vl, is = { dehydrated: null, retryTime: 0 };
        function kl(e, t, n) {
          var r, a = t.mode, p = t.pendingProps, k = Ct.current, T = !1;
          if ((r = (64 & t.effectTag) != 0) || (r = (2 & k) != 0 && (e === null || e.memoizedState !== null)), r ? (T = !0, t.effectTag &= -65) : e !== null && e.memoizedState === null || p.fallback === void 0 || p.unstable_avoidThisFallback === !0 || (k |= 1), St(Ct, 1 & k), e === null) {
            if (p.fallback !== void 0 && ts(t), T) {
              if (T = p.fallback, (p = Qr(null, a, 0, null)).return = t, (2 & t.mode) == 0) for (e = t.memoizedState !== null ? t.child.child : t.child, p.child = e; e !== null; ) e.return = p, e = e.sibling;
              return (n = Qr(T, a, n, null)).return = t, p.sibling = n, t.memoizedState = is, t.child = p, n;
            }
            return a = p.children, t.memoizedState = null, t.child = Wa(t, null, a, n);
          }
          if (e.memoizedState !== null) {
            if (a = (e = e.child).sibling, T) {
              if (p = p.fallback, (n = vo(e, e.pendingProps)).return = t, (2 & t.mode) == 0 && (T = t.memoizedState !== null ? t.child.child : t.child) !== e.child) for (n.child = T; T !== null; ) T.return = n, T = T.sibling;
              return (a = vo(a, p)).return = t, n.sibling = a, n.childExpirationTime = 0, t.memoizedState = is, t.child = n, a;
            }
            return n = Fo(t, e.child, p.children, n), t.memoizedState = null, t.child = n;
          }
          if (e = e.child, T) {
            if (T = p.fallback, (p = Qr(null, a, 0, null)).return = t, p.child = e, e !== null && (e.return = p), (2 & t.mode) == 0) for (e = t.memoizedState !== null ? t.child.child : t.child, p.child = e; e !== null; ) e.return = p, e = e.sibling;
            return (n = Qr(T, a, n, null)).return = t, p.sibling = n, n.effectTag |= 2, p.childExpirationTime = 0, t.memoizedState = is, t.child = p, n;
          }
          return t.memoizedState = null, t.child = Fo(t, e, p.children, n);
        }
        function wl(e, t) {
          e.expirationTime < t && (e.expirationTime = t);
          var n = e.alternate;
          n !== null && n.expirationTime < t && (n.expirationTime = t), $s(e.return, t);
        }
        function as(e, t, n, r, a, p) {
          var k = e.memoizedState;
          k === null ? e.memoizedState = { isBackwards: t, rendering: null, renderingStartTime: 0, last: r, tail: n, tailExpiration: 0, tailMode: a, lastEffect: p } : (k.isBackwards = t, k.rendering = null, k.renderingStartTime = 0, k.last = r, k.tail = n, k.tailExpiration = 0, k.tailMode = a, k.lastEffect = p);
        }
        function El(e, t, n) {
          var r = t.pendingProps, a = r.revealOrder, p = r.tail;
          if (Un(e, t, r.children, n), (2 & (r = Ct.current)) != 0) r = 1 & r | 2, t.effectTag |= 64;
          else {
            if (e !== null && (64 & e.effectTag) != 0) e: for (e = t.child; e !== null; ) {
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
          else switch (a) {
            case "forwards":
              for (n = t.child, a = null; n !== null; ) (e = n.alternate) !== null && ea(e) === null && (a = n), n = n.sibling;
              (n = a) === null ? (a = t.child, t.child = null) : (a = n.sibling, n.sibling = null), as(t, !1, a, n, p, t.lastEffect);
              break;
            case "backwards":
              for (n = null, a = t.child, t.child = null; a !== null; ) {
                if ((e = a.alternate) !== null && ea(e) === null) {
                  t.child = a;
                  break;
                }
                e = a.sibling, a.sibling = n, n = a, a = e;
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
          if (r !== 0 && wa(r), t.childExpirationTime < n) return null;
          if (e !== null && t.child !== e.child) throw Error(m(153));
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
              return hn(t.type) && Bi(), null;
            case 3:
              return Bo(), vt(pn), vt(Xt), (n = t.stateNode).pendingContext && (n.context = n.pendingContext, n.pendingContext = null), e !== null && e.child !== null || !la(t) || (t.effectTag |= 4), null;
            case 5:
              $a(t), n = co(di.current);
              var a = t.type;
              if (e !== null && t.stateNode != null) yl(e, t, a, r, n), e.ref !== t.ref && (t.effectTag |= 128);
              else {
                if (!r) {
                  if (t.stateNode === null) throw Error(m(166));
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
                      bn(r, p), mt("invalid", r), Wn(n, "onChange");
                      break;
                    case "select":
                      r._wrapperState = { wasMultiple: !!p.multiple }, mt("invalid", r), Wn(n, "onChange");
                      break;
                    case "textarea":
                      On(r, p), mt("invalid", r), Wn(n, "onChange");
                  }
                  for (var k in Ko(a, p), e = null, p) if (p.hasOwnProperty(k)) {
                    var T = p[k];
                    k === "children" ? typeof T == "string" ? r.textContent !== T && (e = ["children", T]) : typeof T == "number" && r.textContent !== "" + T && (e = ["children", "" + T]) : M.hasOwnProperty(k) && T != null && Wn(n, k);
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
                      typeof p.onClick == "function" && (r.onclick = Oo);
                  }
                  n = e, t.updateQueue = n, n !== null && (t.effectTag |= 4);
                } else {
                  switch (k = n.nodeType === 9 ? n : n.ownerDocument, e === Oi && (e = ke(a)), e === Oi ? a === "script" ? ((e = k.createElement("div")).innerHTML = "<script><\/script>", e = e.removeChild(e.firstChild)) : typeof r.is == "string" ? e = k.createElement(a, { is: r.is }) : (e = k.createElement(a), a === "select" && (k = e, r.multiple ? k.multiple = !0 : r.size && (k.size = r.size))) : e = k.createElementNS(e, a), e[Qn] = t, e[no] = r, bl(e, t), t.stateNode = e, k = Qo(a, r), a) {
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
                      bn(e, r), T = Cr(e, r), mt("invalid", e), Wn(n, "onChange");
                      break;
                    case "option":
                      T = sr(e, r);
                      break;
                    case "select":
                      e._wrapperState = { wasMultiple: !!r.multiple }, T = o({}, r, { value: void 0 }), mt("invalid", e), Wn(n, "onChange");
                      break;
                    case "textarea":
                      On(e, r), T = lr(e, r), mt("invalid", e), Wn(n, "onChange");
                      break;
                    default:
                      T = r;
                  }
                  Ko(a, T);
                  var Z = T;
                  for (p in Z) if (Z.hasOwnProperty(p)) {
                    var q = Z[p];
                    p === "style" ? Ci(e, q) : p === "dangerouslySetInnerHTML" ? (q = q ? q.__html : void 0) != null && qe(e, q) : p === "children" ? typeof q == "string" ? (a !== "textarea" || q !== "") && st(e, q) : typeof q == "number" && st(e, "" + q) : p !== "suppressContentEditableWarning" && p !== "suppressHydrationWarning" && p !== "autoFocus" && (M.hasOwnProperty(p) ? q != null && Wn(n, p) : q != null && je(e, p, q, k));
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
                      typeof T.onClick == "function" && (e.onclick = Oo);
                  }
                  Ri(a, r) && (t.effectTag |= 4);
                }
                t.ref !== null && (t.effectTag |= 128);
              }
              return null;
            case 6:
              if (e && t.stateNode != null) vl(0, t, e.memoizedProps, r);
              else {
                if (typeof r != "string" && t.stateNode === null) throw Error(m(166));
                n = co(di.current), co(er.current), la(t) ? (n = t.stateNode, r = t.memoizedProps, n[Qn] = t, n.nodeValue !== r && (t.effectTag |= 4)) : ((n = (n.nodeType === 9 ? n : n.ownerDocument).createTextNode(r))[Qn] = t, t.stateNode = n);
              }
              return null;
            case 13:
              return vt(Ct), r = t.memoizedState, (64 & t.effectTag) != 0 ? (t.expirationTime = n, t) : (n = r !== null, r = !1, e === null ? t.memoizedProps.fallback !== void 0 && la(t) : (r = (a = e.memoizedState) !== null, n || a === null || (a = e.child.sibling) !== null && ((p = t.firstEffect) !== null ? (t.firstEffect = a, a.nextEffect = p) : (t.firstEffect = t.lastEffect = a, a.nextEffect = null), a.effectTag = 8)), n && !r && (2 & t.mode) != 0 && (e === null && t.memoizedProps.unstable_avoidThisFallback !== !0 || (1 & Ct.current) != 0 ? Ft === po && (Ft = da) : (Ft !== po && Ft !== da || (Ft = fa), pi !== 0 && _n !== null && (ko(_n, mn), Yl(_n, pi)))), (n || r) && (t.effectTag |= 4), null);
            case 4:
              return Bo(), null;
            case 10:
              return Ua(t), null;
            case 17:
              return hn(t.type) && Bi(), null;
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
          throw Error(m(156, t.tag));
        }
        function xc(e) {
          switch (e.tag) {
            case 1:
              hn(e.type) && Bi();
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
            var k, T, Z = t.stateNode;
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
            for (k in Ko(n, r), n = null, p) if (!r.hasOwnProperty(k) && p.hasOwnProperty(k) && p[k] != null) if (k === "style") for (T in Z = p[k]) Z.hasOwnProperty(T) && (n || (n = {}), n[T] = "");
            else k !== "dangerouslySetInnerHTML" && k !== "children" && k !== "suppressContentEditableWarning" && k !== "suppressHydrationWarning" && k !== "autoFocus" && (M.hasOwnProperty(k) ? e || (e = []) : (e = e || []).push(k, null));
            for (k in r) {
              var q = r[k];
              if (Z = p != null ? p[k] : void 0, r.hasOwnProperty(k) && q !== Z && (q != null || Z != null)) if (k === "style") if (Z) {
                for (T in Z) !Z.hasOwnProperty(T) || q && q.hasOwnProperty(T) || (n || (n = {}), n[T] = "");
                for (T in q) q.hasOwnProperty(T) && Z[T] !== q[T] && (n || (n = {}), n[T] = q[T]);
              } else n || (e || (e = []), e.push(k, n)), n = q;
              else k === "dangerouslySetInnerHTML" ? (q = q ? q.__html : void 0, Z = Z ? Z.__html : void 0, q != null && Z !== q && (e = e || []).push(k, q)) : k === "children" ? Z === q || typeof q != "string" && typeof q != "number" || (e = e || []).push(k, "" + q) : k !== "suppressContentEditableWarning" && k !== "suppressHydrationWarning" && (M.hasOwnProperty(k) ? (q != null && Wn(a, k), e || Z === q || (e = [])) : (e = e || []).push(k, q));
            }
            n && (e = e || []).push("style", n), a = e, (t.updateQueue = a) && (t.effectTag |= 4);
          }
        }, vl = function(e, t, n, r) {
          n !== r && (t.effectTag |= 4);
        };
        var Sc = typeof WeakSet == "function" ? WeakSet : Set;
        function ls(e, t) {
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
        function _l(e) {
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
          throw Error(m(163));
        }
        function Cl(e, t, n) {
          switch (typeof gs == "function" && gs(t), t.tag) {
            case 0:
            case 11:
            case 14:
            case 15:
            case 22:
              if ((e = t.updateQueue) !== null && (e = e.lastEffect) !== null) {
                var r = e.next;
                Br(97 < n ? 97 : n, function() {
                  var a = r;
                  do {
                    var p = a.destroy;
                    if (p !== void 0) {
                      var k = t;
                      try {
                        p();
                      } catch (T) {
                        yo(k, T);
                      }
                    }
                    a = a.next;
                  } while (a !== r);
                });
              }
              break;
            case 1:
              _l(t), typeof (n = t.stateNode).componentWillUnmount == "function" && function(a, p) {
                try {
                  p.props = a.memoizedProps, p.state = a.memoizedState, p.componentWillUnmount();
                } catch (k) {
                  yo(a, k);
                }
              }(t, n);
              break;
            case 5:
              _l(t);
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
          r ? function a(p, k, T) {
            var Z = p.tag, q = Z === 5 || Z === 6;
            if (q) p = q ? p.stateNode : p.stateNode.instance, k ? T.nodeType === 8 ? T.parentNode.insertBefore(p, k) : T.insertBefore(p, k) : (T.nodeType === 8 ? (k = T.parentNode).insertBefore(p, T) : (k = T).appendChild(p), (T = T._reactRootContainer) !== null && T !== void 0 || k.onclick !== null || (k.onclick = Oo));
            else if (Z !== 4 && (p = p.child) !== null) for (a(p, k, T), p = p.sibling; p !== null; ) a(p, k, T), p = p.sibling;
          }(e, n, t) : function a(p, k, T) {
            var Z = p.tag, q = Z === 5 || Z === 6;
            if (q) p = q ? p.stateNode : p.stateNode.instance, k ? T.insertBefore(p, k) : T.appendChild(p);
            else if (Z !== 4 && (p = p.child) !== null) for (a(p, k, T), p = p.sibling; p !== null; ) a(p, k, T), p = p.sibling;
          }(e, n, t);
        }
        function Nl(e, t, n) {
          for (var r, a, p = t, k = !1; ; ) {
            if (!k) {
              k = p.return;
              e: for (; ; ) {
                if (k === null) throw Error(m(160));
                switch (r = k.stateNode, k.tag) {
                  case 5:
                    a = !1;
                    break e;
                  case 3:
                  case 4:
                    r = r.containerInfo, a = !0;
                    break e;
                }
                k = k.return;
              }
              k = !0;
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
              (p = p.return).tag === 4 && (k = !1);
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
                  for (n[no] = r, e === "input" && r.type === "radio" && r.name != null && Tr(n, r), Qo(e, a), t = Qo(e, r), a = 0; a < p.length; a += 2) {
                    var k = p[a], T = p[a + 1];
                    k === "style" ? Ci(n, T) : k === "dangerouslySetInnerHTML" ? qe(n, T) : k === "children" ? st(n, T) : je(n, k, T, t);
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
          throw Error(m(163));
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
          (n = Wr(n, null)).tag = 3, n.payload = { element: null };
          var r = t.value;
          return n.callback = function() {
            ga || (ga = !0, ds = r), ls(e, t);
          }, n;
        }
        function Al(e, t, n) {
          (n = Wr(n, null)).tag = 3;
          var r = e.type.getDerivedStateFromError;
          if (typeof r == "function") {
            var a = t.value;
            n.payload = function() {
              return ls(e, t), r(a);
            };
          }
          var p = e.stateNode;
          return p !== null && typeof p.componentDidCatch == "function" && (n.callback = function() {
            typeof r != "function" && (qr === null ? qr = /* @__PURE__ */ new Set([this]) : qr.add(this), ls(e, t));
            var k = t.stack;
            this.componentDidCatch(t.value, { componentStack: k !== null ? k : "" });
          }), n;
        }
        var Ml, Pc = Math.ceil, ua = he.ReactCurrentDispatcher, Il = he.ReactCurrentOwner, po = 0, da = 3, fa = 4, Qe = 0, _n = null, Ge = null, mn = 0, Ft = po, pa = null, kr = 1073741823, fi = 1073741823, ha = null, pi = 0, ma = !1, us = 0, Me = null, ga = !1, ds = null, qr = null, ba = !1, hi = null, mi = 90, ho = null, gi = 0, fs = null, ya = 0;
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
              throw Error(m(326));
          }
          return _n !== null && e === mn && --e, e;
        }
        function Kr(e, t) {
          if (50 < gi) throw gi = 0, fs = null, Error(m(185));
          if ((e = va(e, t)) !== null) {
            var n = $i();
            t === 1073741823 ? (8 & Qe) != 0 && (48 & Qe) == 0 ? ps(e) : (xn(e), Qe === 0 && Jn()) : xn(e), (4 & Qe) == 0 || n !== 98 && n !== 99 || (ho === null ? ho = /* @__PURE__ */ new Map([[e, t]]) : ((n = ho.get(e)) === void 0 || n > t) && ho.set(e, t));
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
          return a !== null && (_n === a && (wa(t), Ft === fa && ko(a, mn)), Yl(a, t)), a;
        }
        function ka(e) {
          var t = e.lastExpiredTime;
          if (t !== 0 || !$l(e, t = e.firstPendingTime)) return t;
          var n = e.lastPingedTime;
          return 2 >= (e = n > (e = e.nextKnownPendingLevel) ? n : e) && t !== e ? 0 : e;
        }
        function xn(e) {
          if (e.lastExpiredTime !== 0) e.callbackExpirationTime = 1073741823, e.callbackPriority = 99, e.callbackNode = Ws(ps.bind(null, e));
          else {
            var t = ka(e), n = e.callbackNode;
            if (t === 0) n !== null && (e.callbackNode = null, e.callbackExpirationTime = 0, e.callbackPriority = 90);
            else {
              var r = nr();
              if (t === 1073741823 ? r = 99 : t === 1 || t === 2 ? r = 95 : r = 0 >= (r = 10 * (1073741821 - t) - 10 * (1073741821 - r)) ? 99 : 250 >= r ? 98 : 5250 >= r ? 97 : 95, n !== null) {
                var a = e.callbackPriority;
                if (e.callbackExpirationTime === t && a >= r) return;
                n !== Us && As(n);
              }
              e.callbackExpirationTime = t, e.callbackPriority = r, t = t === 1073741823 ? Ws(ps.bind(null, e)) : Vs(r, jl.bind(null, e), { timeout: 10 * (1073741821 - t) - jn() }), e.callbackNode = t;
            }
          }
        }
        function jl(e, t) {
          if (ya = 0, t) return ks(e, t = nr()), xn(e), null;
          var n = ka(e);
          if (n !== 0) {
            if (t = e.callbackNode, (48 & Qe) != 0) throw Error(m(327));
            if (Ho(), e === _n && n === mn || go(e, n), Ge !== null) {
              var r = Qe;
              Qe |= 16;
              for (var a = Fl(); ; ) try {
                Dc();
                break;
              } catch (T) {
                Ul(e, T);
              }
              if (La(), Qe = r, ua.current = a, Ft === 1) throw t = pa, go(e, n), ko(e, n), xn(e), t;
              if (Ge === null) switch (a = e.finishedWork = e.current.alternate, e.finishedExpirationTime = n, r = Ft, _n = null, r) {
                case po:
                case 1:
                  throw Error(m(345));
                case 2:
                  ks(e, 2 < n ? 2 : n);
                  break;
                case da:
                  if (ko(e, n), n === (r = e.lastSuspendedTime) && (e.nextKnownPendingLevel = hs(a)), kr === 1073741823 && 10 < (a = us + 500 - jn())) {
                    if (ma) {
                      var p = e.lastPingedTime;
                      if (p === 0 || p >= n) {
                        e.lastPingedTime = n, go(e, n);
                        break;
                      }
                    }
                    if ((p = ka(e)) !== 0 && p !== n) break;
                    if (r !== 0 && r !== n) {
                      e.lastPingedTime = r;
                      break;
                    }
                    e.timeoutHandle = ti(bo.bind(null, e), a);
                    break;
                  }
                  bo(e);
                  break;
                case fa:
                  if (ko(e, n), n === (r = e.lastSuspendedTime) && (e.nextKnownPendingLevel = hs(a)), ma && ((a = e.lastPingedTime) === 0 || a >= n)) {
                    e.lastPingedTime = n, go(e, n);
                    break;
                  }
                  if ((a = ka(e)) !== 0 && a !== n) break;
                  if (r !== 0 && r !== n) {
                    e.lastPingedTime = r;
                    break;
                  }
                  if (fi !== 1073741823 ? r = 10 * (1073741821 - fi) - jn() : kr === 1073741823 ? r = 0 : (r = 10 * (1073741821 - kr) - 5e3, 0 > (r = (a = jn()) - r) && (r = 0), (n = 10 * (1073741821 - n) - a) < (r = (120 > r ? 120 : 480 > r ? 480 : 1080 > r ? 1080 : 1920 > r ? 1920 : 3e3 > r ? 3e3 : 4320 > r ? 4320 : 1960 * Pc(r / 1960)) - r) && (r = n)), 10 < r) {
                    e.timeoutHandle = ti(bo.bind(null, e), r);
                    break;
                  }
                  bo(e);
                  break;
                case 5:
                  if (kr !== 1073741823 && ha !== null) {
                    p = kr;
                    var k = ha;
                    if (0 >= (r = 0 | k.busyMinDurationMs) ? r = 0 : (a = 0 | k.busyDelayMs, r = (p = jn() - (10 * (1073741821 - p) - (0 | k.timeoutMs || 5e3))) <= a ? 0 : a + r - p), 10 < r) {
                      ko(e, n), e.timeoutHandle = ti(bo.bind(null, e), r);
                      break;
                    }
                  }
                  bo(e);
                  break;
                default:
                  throw Error(m(329));
              }
              if (xn(e), e.callbackNode === t) return jl.bind(null, e);
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
            for (var r = Fl(); ; ) try {
              Nc();
              break;
            } catch (a) {
              Ul(e, a);
            }
            if (La(), Qe = n, ua.current = r, Ft === 1) throw n = pa, go(e, t), ko(e, t), xn(e), n;
            if (Ge !== null) throw Error(m(261));
            e.finishedWork = e.current.alternate, e.finishedExpirationTime = t, _n = null, bo(e), xn(e);
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
          if (n !== -1 && (e.timeoutHandle = -1, Ai(n)), Ge !== null) for (n = Ge.return; n !== null; ) {
            var r = n;
            switch (r.tag) {
              case 1:
                (r = r.type.childContextTypes) != null && Bi();
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
          _n = e, Ge = vo(e.current, null), mn = t, Ft = po, pa = null, fi = kr = 1073741823, ha = null, pi = 0, ma = !1;
        }
        function Ul(e, t) {
          for (; ; ) {
            try {
              if (La(), ta.current = sa, na) for (var n = Lt.memoizedState; n !== null; ) {
                var r = n.queue;
                r !== null && (r.pending = null), n = n.next;
              }
              if ($r = 0, Zt = sn = Lt = null, na = !1, Ge === null || Ge.return === null) return Ft = 1, pa = t, Ge = null;
              e: {
                var a = e, p = Ge.return, k = Ge, T = t;
                if (t = mn, k.effectTag |= 2048, k.firstEffect = k.lastEffect = null, T !== null && typeof T == "object" && typeof T.then == "function") {
                  var Z = T;
                  if ((2 & k.mode) == 0) {
                    var q = k.alternate;
                    q ? (k.updateQueue = q.updateQueue, k.memoizedState = q.memoizedState, k.expirationTime = q.expirationTime) : (k.updateQueue = null, k.memoizedState = null);
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
                      if ((2 & De.mode) == 0) {
                        if (De.effectTag |= 64, k.effectTag &= -2981, k.tag === 1) if (k.alternate === null) k.tag = 17;
                        else {
                          var ee = Wr(1073741823, null);
                          ee.tag = 2, Hr(k, ee);
                        }
                        k.expirationTime = 1073741823;
                        break e;
                      }
                      T = void 0, k = t;
                      var ue = a.pingCache;
                      if (ue === null ? (ue = a.pingCache = new Oc(), T = /* @__PURE__ */ new Set(), ue.set(Z, T)) : (T = ue.get(Z)) === void 0 && (T = /* @__PURE__ */ new Set(), ue.set(Z, T)), !T.has(k)) {
                        T.add(k);
                        var ve = Ic.bind(null, a, Z, k);
                        Z.then(ve, ve);
                      }
                      De.effectTag |= 4096, De.expirationTime = t;
                      break e;
                    }
                    De = De.return;
                  } while (De !== null);
                  T = Error((Yt(k.type) || "A React component") + ` suspended while rendering, but no fallback UI was specified.

Add a <Suspense fallback=...> component higher in the tree to provide a loading indicator or placeholder to display.` + xr(k));
                }
                Ft !== 5 && (Ft = 2), T = ss(T, k), De = p;
                do {
                  switch (De.tag) {
                    case 3:
                      Z = T, De.effectTag |= 4096, De.expirationTime = t, Ys(De, Rl(De, Z, t));
                      break e;
                    case 1:
                      Z = T;
                      var _e = De.type, Oe = De.stateNode;
                      if ((64 & De.effectTag) == 0 && (typeof _e.getDerivedStateFromError == "function" || Oe !== null && typeof Oe.componentDidCatch == "function" && (qr === null || !qr.has(Oe)))) {
                        De.effectTag |= 4096, De.expirationTime = t, Ys(De, Al(De, Z, t));
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
        function Fl() {
          var e = ua.current;
          return ua.current = sa, e === null ? sa : e;
        }
        function Bl(e, t) {
          e < kr && 2 < e && (kr = e), t !== null && e < fi && 2 < e && (fi = e, ha = t);
        }
        function wa(e) {
          e > pi && (pi = e);
        }
        function Nc() {
          for (; Ge !== null; ) Ge = Vl(Ge);
        }
        function Dc() {
          for (; Ge !== null && !bc(); ) Ge = Vl(Ge);
        }
        function Vl(e) {
          var t = Ml(e.alternate, e, mn);
          return e.memoizedProps = e.pendingProps, t === null && (t = Wl(e)), Il.current = null, t;
        }
        function Wl(e) {
          Ge = e;
          do {
            var t = Ge.alternate;
            if (e = Ge.return, (2048 & Ge.effectTag) == 0) {
              if (t = _c(t, Ge, mn), mn === 1 || Ge.childExpirationTime !== 1) {
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
        function hs(e) {
          var t = e.expirationTime;
          return t > (e = e.childExpirationTime) ? t : e;
        }
        function bo(e) {
          var t = $i();
          return Br(99, Rc.bind(null, e, t)), null;
        }
        function Rc(e, t) {
          do
            Ho();
          while (hi !== null);
          if ((48 & Qe) != 0) throw Error(m(327));
          var n = e.finishedWork, r = e.finishedExpirationTime;
          if (n === null) return null;
          if (e.finishedWork = null, e.finishedExpirationTime = 0, n === e.current) throw Error(m(177));
          e.callbackNode = null, e.callbackExpirationTime = 0, e.callbackPriority = 90, e.nextKnownPendingLevel = 0;
          var a = hs(n);
          if (e.firstPendingTime = a, r <= e.lastSuspendedTime ? e.firstSuspendedTime = e.lastSuspendedTime = e.nextKnownPendingLevel = 0 : r <= e.firstSuspendedTime && (e.firstSuspendedTime = r - 1), r <= e.lastPingedTime && (e.lastPingedTime = 0), r <= e.lastExpiredTime && (e.lastExpiredTime = 0), e === _n && (Ge = _n = null, mn = 0), 1 < n.effectTag ? n.lastEffect !== null ? (n.lastEffect.nextEffect = n, a = n.firstEffect) : a = n : a = n.firstEffect, a !== null) {
            var p = Qe;
            Qe |= 32, Il.current = null, Zo = Co;
            var k = Di();
            if (Xo(k)) {
              if ("selectionStart" in k) var T = { start: k.selectionStart, end: k.selectionEnd };
              else e: {
                var Z = (T = (T = k.ownerDocument) && T.defaultView || window).getSelection && T.getSelection();
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
                  var De = 0, We = -1, ot = -1, Fn = 0, ln = 0, re = k, ee = null;
                  t: for (; ; ) {
                    for (var ue; re !== T || q !== 0 && re.nodeType !== 3 || (We = De + q), re !== ge || Z !== 0 && re.nodeType !== 3 || (ot = De + Z), re.nodeType === 3 && (De += re.nodeValue.length), (ue = re.firstChild) !== null; ) ee = re, re = ue;
                    for (; ; ) {
                      if (re === k) break t;
                      if (ee === T && ++Fn === q && (We = De), ee === ge && ++ln === Z && (ot = De), (ue = re.nextSibling) !== null) break;
                      ee = (re = ee).parentNode;
                    }
                    re = ue;
                  }
                  T = We === -1 || ot === -1 ? null : { start: We, end: ot };
                } else T = null;
              }
              T = T || { start: 0, end: 0 };
            } else T = null;
            Jo = { activeElementDetached: null, focusedElem: k, selectionRange: T }, Co = !1, Me = a;
            do
              try {
                Ac();
              } catch (Ze) {
                if (Me === null) throw Error(m(330));
                yo(Me, Ze), Me = Me.nextEffect;
              }
            while (Me !== null);
            Me = a;
            do
              try {
                for (k = e, T = t; Me !== null; ) {
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
                      Pl(Me), Me.effectTag &= -3;
                      break;
                    case 6:
                      Pl(Me), Me.effectTag &= -3, cs(Me.alternate, Me);
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
                      Nl(k, q = Me, T), Tl(q);
                  }
                  Me = Me.nextEffect;
                }
              } catch (Ze) {
                if (Me === null) throw Error(m(330));
                yo(Me, Ze), Me = Me.nextEffect;
              }
            while (Me !== null);
            if (Oe = Jo, _e = Di(), ve = Oe.focusedElem, T = Oe.selectionRange, _e !== ve && ve && ve.ownerDocument && function Ze(Bt, wr) {
              return !(!Bt || !wr) && (Bt === wr || (!Bt || Bt.nodeType !== 3) && (wr && wr.nodeType === 3 ? Ze(Bt, wr.parentNode) : "contains" in Bt ? Bt.contains(wr) : !!Bt.compareDocumentPosition && !!(16 & Bt.compareDocumentPosition(wr))));
            }(ve.ownerDocument.documentElement, ve)) {
              for (T !== null && Xo(ve) && (_e = T.start, (Oe = T.end) === void 0 && (Oe = _e), "selectionStart" in ve ? (ve.selectionStart = _e, ve.selectionEnd = Math.min(Oe, ve.value.length)) : (Oe = (_e = ve.ownerDocument || document) && _e.defaultView || window).getSelection && (Oe = Oe.getSelection(), q = ve.textContent.length, k = Math.min(T.start, q), T = T.end === void 0 ? k : Math.min(T.end, q), !Oe.extend && k > T && (q = T, T = k, k = q), q = Ni(ve, k), ge = Ni(ve, T), q && ge && (Oe.rangeCount !== 1 || Oe.anchorNode !== q.node || Oe.anchorOffset !== q.offset || Oe.focusNode !== ge.node || Oe.focusOffset !== ge.offset) && ((_e = _e.createRange()).setStart(q.node, q.offset), Oe.removeAllRanges(), k > T ? (Oe.addRange(_e), Oe.extend(ge.node, ge.offset)) : (_e.setEnd(ge.node, ge.offset), Oe.addRange(_e))))), _e = [], Oe = ve; Oe = Oe.parentNode; ) Oe.nodeType === 1 && _e.push({ element: Oe, left: Oe.scrollLeft, top: Oe.scrollTop });
              for (typeof ve.focus == "function" && ve.focus(), ve = 0; ve < _e.length; ve++) (Oe = _e[ve]).element.scrollLeft = Oe.left, Oe.element.scrollTop = Oe.top;
            }
            Co = !!Zo, Jo = Zo = null, e.current = n, Me = a;
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
          if (ba) ba = !1, hi = e, mi = t;
          else for (Me = a; Me !== null; ) t = Me.nextEffect, Me.nextEffect = null, Me = t;
          if ((t = e.firstPendingTime) === 0 && (qr = null), t === 1073741823 ? e === fs ? gi++ : (gi = 0, fs = e) : gi = 0, typeof ms == "function" && ms(n.stateNode, r), xn(e), ga) throw ga = !1, e = ds, ds = null, e;
          return (8 & Qe) != 0 || Jn(), null;
        }
        function Ac() {
          for (; Me !== null; ) {
            var e = Me.effectTag;
            (256 & e) != 0 && Cc(Me.alternate, Me), (512 & e) == 0 || ba || (ba = !0, Vs(97, function() {
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
              if ((512 & n.effectTag) != 0) switch (n.tag) {
                case 0:
                case 11:
                case 15:
                case 22:
                  xl(5, n), Sl(5, n);
              }
            } catch (r) {
              if (e === null) throw Error(m(330));
              yo(e, r);
            }
            n = e.nextEffect, e.nextEffect = null, e = n;
          }
          return Qe = t, Jn(), !0;
        }
        function Hl(e, t, n) {
          Hr(e, t = Rl(e, t = ss(n, t), 1073741823)), (e = va(e, 1073741823)) !== null && xn(e);
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
                Hr(n, e = Al(n, e = ss(t, e), 1073741823)), (n = va(n, 1073741823)) !== null && xn(n);
                break;
              }
            }
            n = n.return;
          }
        }
        function Ic(e, t, n) {
          var r = e.pingCache;
          r !== null && r.delete(t), _n === e && mn === n ? Ft === fa || Ft === da && kr === 1073741823 && jn() - us < 500 ? go(e, mn) : ma = !0 : $l(e, n) && ((t = e.lastPingedTime) !== 0 && t < n || (e.lastPingedTime = n, xn(e)));
        }
        function jc(e, t) {
          var n = e.stateNode;
          n !== null && n.delete(t), (t = 0) == 0 && (t = mo(t = nr(), e, null)), (e = va(e, t)) !== null && xn(e);
        }
        Ml = function(e, t, n) {
          var r = t.expirationTime;
          if (e !== null) {
            var a = t.pendingProps;
            if (e.memoizedProps !== a || pn.current) tr = !0;
            else {
              if (r < n) {
                switch (tr = !1, t.tag) {
                  case 3:
                    gl(t), ns();
                    break;
                  case 5:
                    if (Js(t), 4 & t.mode && n !== 1 && a.hidden) return t.expirationTime = t.childExpirationTime = 1, null;
                    break;
                  case 1:
                    hn(t.type) && Vi(t);
                    break;
                  case 4:
                    Ha(t, t.stateNode.containerInfo);
                    break;
                  case 10:
                    r = t.memoizedProps.value, a = t.type._context, St(qi, a._currentValue), a._currentValue = r;
                    break;
                  case 13:
                    if (t.memoizedState !== null) return (r = t.child.childExpirationTime) !== 0 && r >= n ? kl(e, t, n) : (St(Ct, 1 & Ct.current), (t = vr(e, t, n)) !== null ? t.sibling : null);
                    St(Ct, 1 & Ct.current);
                    break;
                  case 19:
                    if (r = t.childExpirationTime >= n, (64 & e.effectTag) != 0) {
                      if (r) return El(e, t, n);
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
              if (r = t.type, e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= 2), e = t.pendingProps, a = zo(t, Xt.current), Uo(t, n), a = Ka(null, t, r, e, a, n), t.effectTag |= 1, typeof a == "object" && a !== null && typeof a.render == "function" && a.$$typeof === void 0) {
                if (t.tag = 1, t.memoizedState = null, t.updateQueue = null, hn(r)) {
                  var p = !0;
                  Vi(t);
                } else p = !1;
                t.memoizedState = a.state !== null && a.state !== void 0 ? a.state : null, Fa(t);
                var k = r.getDerivedStateFromProps;
                typeof k == "function" && Gi(t, r, k, e), a.updater = Xi, t.stateNode = a, a._reactInternalFiber = t, Va(t, r, e, n), t = os(null, t, r, !0, p, n);
              } else t.tag = 0, Un(null, t, a, n), t = t.child;
              return t;
            case 16:
              e: {
                if (a = t.elementType, e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= 2), e = t.pendingProps, function(ge) {
                  if (ge._status === -1) {
                    ge._status = 0;
                    var De = ge._ctor;
                    De = De(), ge._result = De, De.then(function(We) {
                      ge._status === 0 && (We = We.default, ge._status = 1, ge._result = We);
                    }, function(We) {
                      ge._status === 0 && (ge._status = 2, ge._result = We);
                    });
                  }
                }(a), a._status !== 1) throw a._result;
                switch (a = a._result, t.type = a, p = t.tag = function(ge) {
                  if (typeof ge == "function") return bs(ge) ? 1 : 0;
                  if (ge != null) {
                    if ((ge = ge.$$typeof) === Tt) return 11;
                    if (ge === Sn) return 14;
                  }
                  return 2;
                }(a), e = $n(a, e), p) {
                  case 0:
                    t = rs(null, t, a, e, n);
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
                throw Error(m(306, a, ""));
              }
              return t;
            case 0:
              return r = t.type, a = t.pendingProps, rs(e, t, r, a = t.elementType === r ? a : $n(r, a), n);
            case 1:
              return r = t.type, a = t.pendingProps, ml(e, t, r, a = t.elementType === r ? a : $n(r, a), n);
            case 3:
              if (gl(t), r = t.updateQueue, e === null || r === null) throw Error(m(282));
              if (r = t.pendingProps, a = (a = t.memoizedState) !== null ? a.element : null, Ba(e, t), ai(t, r, null, n), (r = t.memoizedState.element) === a) ns(), t = vr(e, t, n);
              else {
                if ((a = t.stateNode.hydrate) && (Yr = Mr(t.stateNode.containerInfo.firstChild), yr = t, a = fo = !0), a) for (n = Wa(t, null, r, n), t.child = n; n; ) n.effectTag = -3 & n.effectTag | 1024, n = n.sibling;
                else Un(e, t, r, n), ns();
                t = t.child;
              }
              return t;
            case 5:
              return Js(t), e === null && ts(t), r = t.type, a = t.pendingProps, p = e !== null ? e.memoizedProps : null, k = a.children, ei(r, a) ? k = null : p !== null && ei(r, p) && (t.effectTag |= 16), hl(e, t), 4 & t.mode && n !== 1 && a.hidden ? (t.expirationTime = t.childExpirationTime = 1, t = null) : (Un(e, t, k, n), t = t.child), t;
            case 6:
              return e === null && ts(t), null;
            case 13:
              return kl(e, t, n);
            case 4:
              return Ha(t, t.stateNode.containerInfo), r = t.pendingProps, e === null ? t.child = Fo(t, null, r, n) : Un(e, t, r, n), t.child;
            case 11:
              return r = t.type, a = t.pendingProps, dl(e, t, r, a = t.elementType === r ? a : $n(r, a), n);
            case 7:
              return Un(e, t, t.pendingProps, n), t.child;
            case 8:
            case 12:
              return Un(e, t, t.pendingProps.children, n), t.child;
            case 10:
              e: {
                r = t.type._context, a = t.pendingProps, k = t.memoizedProps, p = a.value;
                var T = t.type._context;
                if (St(qi, T._currentValue), T._currentValue = p, k !== null) if (T = k.value, (p = mr(T, p) ? 0 : 0 | (typeof r._calculateChangedBits == "function" ? r._calculateChangedBits(T, p) : 1073741823)) === 0) {
                  if (k.children === a.children && !pn.current) {
                    t = vr(e, t, n);
                    break e;
                  }
                } else for ((T = t.child) !== null && (T.return = t); T !== null; ) {
                  var Z = T.dependencies;
                  if (Z !== null) {
                    k = T.child;
                    for (var q = Z.firstContext; q !== null; ) {
                      if (q.context === r && (q.observedBits & p) != 0) {
                        T.tag === 1 && ((q = Wr(n, null)).tag = 2, Hr(T, q)), T.expirationTime < n && (T.expirationTime = n), (q = T.alternate) !== null && q.expirationTime < n && (q.expirationTime = n), $s(T.return, n), Z.expirationTime < n && (Z.expirationTime = n);
                        break;
                      }
                      q = q.next;
                    }
                  } else k = T.tag === 10 && T.type === t.type ? null : T.child;
                  if (k !== null) k.return = T;
                  else for (k = T; k !== null; ) {
                    if (k === t) {
                      k = null;
                      break;
                    }
                    if ((T = k.sibling) !== null) {
                      T.return = k.return, k = T;
                      break;
                    }
                    k = k.return;
                  }
                  T = k;
                }
                Un(e, t, a.children, n), t = t.child;
              }
              return t;
            case 9:
              return a = t.type, r = (p = t.pendingProps).children, Uo(t, n), r = r(a = zn(a, p.unstable_observedBits)), t.effectTag |= 1, Un(e, t, r, n), t.child;
            case 14:
              return p = $n(a = t.type, t.pendingProps), fl(e, t, a, p = $n(a.type, p), r, n);
            case 15:
              return pl(e, t, t.type, t.pendingProps, r, n);
            case 17:
              return r = t.type, a = t.pendingProps, a = t.elementType === r ? a : $n(r, a), e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= 2), t.tag = 1, hn(r) ? (e = !0, Vi(t)) : e = !1, Uo(t, n), Gs(t, r, a), Va(t, r, a, n), os(null, t, r, !0, e, n);
            case 19:
              return El(e, t, n);
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
        function Ea(e, t, n, r, a, p) {
          var k = 2;
          if (r = e, typeof e == "function") bs(e) && (k = 1);
          else if (typeof e == "string") k = 5;
          else e: switch (e) {
            case kt:
              return Qr(n.children, a, p, t);
            case Er:
              k = 8, a |= 7;
              break;
            case Jt:
              k = 8, a |= 1;
              break;
            case wt:
              return (e = rr(12, n, t, 8 | a)).elementType = wt, e.type = wt, e.expirationTime = p, e;
            case pt:
              return (e = rr(13, n, t, a)).type = pt, e.elementType = pt, e.expirationTime = p, e;
            case Yn:
              return (e = rr(19, n, t, a)).elementType = Yn, e.expirationTime = p, e;
            default:
              if (typeof e == "object" && e !== null) switch (e.$$typeof) {
                case gt:
                  k = 10;
                  break e;
                case cn:
                  k = 9;
                  break e;
                case Tt:
                  k = 11;
                  break e;
                case Sn:
                  k = 14;
                  break e;
                case or:
                  k = 16, r = null;
                  break e;
                case _r:
                  k = 22;
                  break e;
              }
              throw Error(m(130, e == null ? e : typeof e, ""));
          }
          return (t = rr(k, n, t, a)).elementType = e, t.type = r, t.expirationTime = p, t;
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
        function $l(e, t) {
          var n = e.firstSuspendedTime;
          return e = e.lastSuspendedTime, n !== 0 && n >= t && e <= t;
        }
        function ko(e, t) {
          var n = e.firstSuspendedTime, r = e.lastSuspendedTime;
          n < t && (e.firstSuspendedTime = t), (r > t || n === 0) && (e.lastSuspendedTime = t), t <= e.lastPingedTime && (e.lastPingedTime = 0), t <= e.lastExpiredTime && (e.lastExpiredTime = 0);
        }
        function Yl(e, t) {
          t > e.firstPendingTime && (e.firstPendingTime = t);
          var n = e.firstSuspendedTime;
          n !== 0 && (t >= n ? e.firstSuspendedTime = e.lastSuspendedTime = e.nextKnownPendingLevel = 0 : t >= e.lastSuspendedTime && (e.lastSuspendedTime = t + 1), t > e.nextKnownPendingLevel && (e.nextKnownPendingLevel = t));
        }
        function ks(e, t) {
          var n = e.lastExpiredTime;
          (n === 0 || n > t) && (e.lastExpiredTime = t);
        }
        function _a(e, t, n, r) {
          var a = t.current, p = nr(), k = si.suspense;
          p = mo(p, a, k);
          e: if (n) {
            t: {
              if (Nn(n = n._reactInternalFiber) !== n || n.tag !== 1) throw Error(m(170));
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
              throw Error(m(171));
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
          return t.context === null ? t.context = n : t.pendingContext = n, (t = Wr(p, k)).payload = { element: e }, (r = r === void 0 ? null : r) !== null && (t.callback = r), Hr(a, t), Kr(a, p), p;
        }
        function ws(e) {
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
        function Es(e, t) {
          ql(e, t), (e = e.alternate) && ql(e, t);
        }
        function _s(e, t, n) {
          var r = new Lc(e, t, n = n != null && n.hydrate === !0), a = rr(3, null, null, t === 2 ? 7 : t === 1 ? 3 : 0);
          r.current = a, a.stateNode = r, Fa(a), e[ro] = r.current, n && t !== 0 && function(p, k) {
            var T = un(k);
            Vn.forEach(function(Z) {
              yt(Z, k, T);
            }), Nt.forEach(function(Z) {
              yt(Z, k, T);
            });
          }(0, e.nodeType === 9 ? e : e.ownerDocument), this._internalRoot = r;
        }
        function bi(e) {
          return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11 && (e.nodeType !== 8 || e.nodeValue !== " react-mount-point-unstable "));
        }
        function xa(e, t, n, r, a) {
          var p = n._reactRootContainer;
          if (p) {
            var k = p._internalRoot;
            if (typeof a == "function") {
              var T = a;
              a = function() {
                var q = ws(k);
                T.call(q);
              };
            }
            _a(t, k, e, a);
          } else {
            if (p = n._reactRootContainer = function(q, ge) {
              if (ge || (ge = !(!(ge = q ? q.nodeType === 9 ? q.documentElement : q.firstChild : null) || ge.nodeType !== 1 || !ge.hasAttribute("data-reactroot"))), !ge) for (var De; De = q.lastChild; ) q.removeChild(De);
              return new _s(q, 0, ge ? { hydrate: !0 } : void 0);
            }(n, r), k = p._internalRoot, typeof a == "function") {
              var Z = a;
              a = function() {
                var q = ws(k);
                Z.call(q);
              };
            }
            Ll(function() {
              _a(t, k, e, a);
            });
          }
          return ws(k);
        }
        function Uc(e, t, n) {
          var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
          return { $$typeof: At, key: r == null ? null : "" + r, children: e, containerInfo: t, implementation: n };
        }
        function Kl(e, t) {
          var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
          if (!bi(t)) throw Error(m(200));
          return Uc(e, t, null, n);
        }
        _s.prototype.render = function(e) {
          _a(e, this._internalRoot, null, null);
        }, _s.prototype.unmount = function() {
          var e = this._internalRoot, t = e.containerInfo;
          _a(null, e, null, function() {
            t[ro] = null;
          });
        }, Et = function(e) {
          if (e.tag === 13) {
            var t = Yi(nr(), 150, 100);
            Kr(e, t), Es(e, t);
          }
        }, ur = function(e) {
          e.tag === 13 && (Kr(e, 3), Es(e, 3));
        }, dr = function(e) {
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
                    var a = ni(r);
                    if (!a) throw Error(m(90));
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
            return Br(98, e.bind(null, t, n, r, a));
          } finally {
            (Qe = p) === 0 && Jn();
          }
        }, we = function() {
          (49 & Qe) == 0 && (function() {
            if (ho !== null) {
              var e = ho;
              ho = null, e.forEach(function(t, n) {
                ks(n, t), xn(n);
              }), Jn();
            }
          }(), Ho());
        }, Pe = function(e, t) {
          var n = Qe;
          Qe |= 2;
          try {
            return e(t);
          } finally {
            (Qe = n) === 0 && Jn();
          }
        };
        var Ql, xs, Fc = { Events: [oo, Gn, ni, le, z, jr, function(e) {
          qn(e, Aa);
        }, D, ie, To, Mt, Ho, { current: !1 }] };
        xs = (Ql = { findFiberByHostInstance: Ir, bundleType: 0, version: "16.14.0", rendererPackageName: "react-dom" }).findFiberByHostInstance, function(e) {
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
        }(o({}, Ql, { overrideHookState: null, overrideProps: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: he.ReactCurrentDispatcher, findHostInstanceByFiber: function(e) {
          return (e = rt(e)) === null ? null : e.stateNode;
        }, findFiberByHostInstance: function(e) {
          return xs ? xs(e) : null;
        }, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null })), i.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Fc, i.createPortal = Kl, i.findDOMNode = function(e) {
          if (e == null) return null;
          if (e.nodeType === 1) return e;
          var t = e._reactInternalFiber;
          if (t === void 0)
            throw typeof e.render == "function" ? Error(m(188)) : Error(m(268, Object.keys(e)));
          return e = (e = rt(t)) === null ? null : e.stateNode;
        }, i.flushSync = function(e, t) {
          if ((48 & Qe) != 0) throw Error(m(187));
          var n = Qe;
          Qe |= 1;
          try {
            return Br(99, e.bind(null, t));
          } finally {
            Qe = n, Jn();
          }
        }, i.hydrate = function(e, t, n) {
          if (!bi(t)) throw Error(m(200));
          return xa(null, e, t, !0, n);
        }, i.render = function(e, t, n) {
          if (!bi(t)) throw Error(m(200));
          return xa(null, e, t, !1, n);
        }, i.unmountComponentAtNode = function(e) {
          if (!bi(e)) throw Error(m(40));
          return !!e._reactRootContainer && (Ll(function() {
            xa(null, null, e, !1, function() {
              e._reactRootContainer = null, e[ro] = null;
            });
          }), !0);
        }, i.unstable_batchedUpdates = zl, i.unstable_createPortal = function(e, t) {
          return Kl(e, t, 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null);
        }, i.unstable_renderSubtreeIntoContainer = function(e, t, n, r) {
          if (!bi(n)) throw Error(m(200));
          if (e == null || e._reactInternalFiber === void 0) throw Error(m(38));
          return xa(e, t, n, !1, r);
        }, i.version = "16.14.0";
      }, function(g, i, u) {
        g.exports = u(24);
      }, function(g, i, u) {
        var c, o, _, m, b;
        if (typeof window > "u" || typeof MessageChannel != "function") {
          var v = null, y = null, C = function() {
            if (v !== null) try {
              var Y = i.unstable_now();
              v(!0, Y), v = null;
            } catch (me) {
              throw setTimeout(C, 0), me;
            }
          }, x = Date.now();
          i.unstable_now = function() {
            return Date.now() - x;
          }, c = function(Y) {
            v !== null ? setTimeout(c, 0, Y) : (v = Y, setTimeout(C, 0));
          }, o = function(Y, me) {
            y = setTimeout(Y, me);
          }, _ = function() {
            clearTimeout(y);
          }, m = function() {
            return !1;
          }, b = i.unstable_forceFrameRate = function() {
          };
        } else {
          var N = window.performance, G = window.Date, K = window.setTimeout, j = window.clearTimeout;
          if (typeof console < "u") {
            var B = window.cancelAnimationFrame;
            typeof window.requestAnimationFrame != "function" && console.error("This browser doesn't support requestAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills"), typeof B != "function" && console.error("This browser doesn't support cancelAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills");
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
          var I = !1, V = null, R = -1, oe = 5, Q = 0;
          m = function() {
            return i.unstable_now() >= Q;
          }, b = function() {
          }, i.unstable_forceFrameRate = function(Y) {
            0 > Y || 125 < Y ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing framerates higher than 125 fps is not unsupported") : oe = 0 < Y ? Math.floor(1e3 / Y) : 5;
          };
          var z = new MessageChannel(), M = z.port2;
          z.port1.onmessage = function() {
            if (V !== null) {
              var Y = i.unstable_now();
              Q = Y + oe;
              try {
                V(!0, Y) ? M.postMessage(null) : (I = !1, V = null);
              } catch (me) {
                throw M.postMessage(null), me;
              }
            } else I = !1;
          }, c = function(Y) {
            V = Y, I || (I = !0, M.postMessage(null));
          }, o = function(Y, me) {
            R = K(function() {
              Y(i.unstable_now());
            }, me);
          }, _ = function() {
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
                var U = 2 * (f + 1) - 1, F = Y[U], W = U + 1, he = Y[W];
                if (F !== void 0 && 0 > ce(F, l)) he !== void 0 && 0 > ce(he, F) ? (Y[f] = he, Y[W] = l, f = W) : (Y[f] = F, Y[U] = l, f = U);
                else {
                  if (!(he !== void 0 && 0 > ce(he, l))) break e;
                  Y[f] = he, Y[W] = l, f = W;
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
        var ye = [], J = [], de = 1, D = null, ie = 3, be = !1, Te = !1, we = !1;
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
          if (we = !1, Pe(Y), !Te) if (le(ye) !== null) Te = !0, c(ze);
          else {
            var me = le(J);
            me !== null && o(Se, me.startTime - Y);
          }
        }
        function ze(Y, me) {
          Te = !1, we && (we = !1, _()), be = !0;
          var l = ie;
          try {
            for (Pe(me), D = le(ye); D !== null && (!(D.expirationTime > me) || Y && !m()); ) {
              var f = D.callback;
              if (f !== null) {
                D.callback = null, ie = D.priorityLevel;
                var w = f(D.expirationTime <= me);
                me = i.unstable_now(), typeof w == "function" ? D.callback = w : D === le(ye) && te(ye), Pe(me);
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
            var w = l.delay;
            w = typeof w == "number" && 0 < w ? f + w : f, l = typeof l.timeout == "number" ? l.timeout : Je(Y);
          } else l = Je(Y), w = f;
          return Y = { id: de++, callback: me, priorityLevel: Y, startTime: w, expirationTime: l = w + l, sortIndex: -1 }, w > f ? (Y.sortIndex = w, se(J, Y), le(ye) === null && Y === le(J) && (we ? _() : we = !0, o(Se, w - f))) : (Y.sortIndex = l, se(ye, Y), Te || be || (Te = !0, c(ze))), Y;
        }, i.unstable_shouldYield = function() {
          var Y = i.unstable_now();
          Pe(Y);
          var me = le(ye);
          return me !== D && D !== null && me !== null && me.callback !== null && me.startTime <= Y && me.expirationTime < D.expirationTime || m();
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
      }, function(g, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.toString = void 0;
        const c = u(13), o = u(26), _ = u(17), m = { string: c.quoteString, number: (b) => Object.is(b, -0) ? "-0" : String(b), boolean: String, symbol: (b, v, y) => {
          const C = Symbol.keyFor(b);
          return C !== void 0 ? `Symbol.for(${y(C)})` : `Symbol(${y(b.description)})`;
        }, bigint: (b, v, y) => `BigInt(${y(String(b))})`, undefined: String, object: o.objectToString, function: _.functionToString };
        i.toString = (b, v, y, C) => b === null ? "null" : m[typeof b](b, v, y, C);
      }, function(g, i, u) {
        (function(c, o) {
          Object.defineProperty(i, "__esModule", { value: !0 }), i.objectToString = void 0;
          const _ = u(13), m = u(17), b = u(31);
          i.objectToString = (C, x, N, G) => {
            if (typeof c == "function" && c.isBuffer(C)) return `Buffer.from(${N(C.toString("base64"))}, 'base64')`;
            if (typeof o == "object" && C === o) return v(C, x, N);
            const K = y[Object.prototype.toString.call(C)];
            return K ? K(C, x, N, G) : void 0;
          };
          const v = (C, x, N) => `Function(${N("return this")})()`, y = { "[object Array]": b.arrayToString, "[object Object]": (C, x, N, G) => {
            const K = x ? `
` : "", j = x ? " " : "", B = Object.keys(C).reduce(function(P, I) {
              const V = C[I], R = N(V, I);
              if (R === void 0) return P;
              const oe = R.split(`
`).join(`
` + x);
              return m.USED_METHOD_KEY.has(V) ? (P.push(`${x}${oe}`), P) : (P.push(`${x}${_.quoteKey(I, N)}:${j}${oe}`), P);
            }, []).join("," + K);
            return B === "" ? "{}" : `{${K}${B}${K}}`;
          }, "[object Error]": (C, x, N) => `new Error(${N(C.message)})`, "[object Date]": (C) => `new Date(${C.getTime()})`, "[object String]": (C, x, N) => `new String(${N(C.toString())})`, "[object Number]": (C) => `new Number(${C})`, "[object Boolean]": (C) => `new Boolean(${C})`, "[object Set]": (C, x, N) => `new Set(${N(Array.from(C))})`, "[object Map]": (C, x, N) => `new Map(${N(Array.from(C))})`, "[object RegExp]": String, "[object global]": v, "[object Window]": v };
        }).call(this, u(27).Buffer, u(15));
      }, function(g, i, u) {
        (function(c) {
          var o = u(28), _ = u(29), m = u(30);
          function b() {
            return y.TYPED_ARRAY_SUPPORT ? 2147483647 : 1073741823;
          }
          function v(l, f) {
            if (b() < f) throw new RangeError("Invalid typed array length");
            return y.TYPED_ARRAY_SUPPORT ? (l = new Uint8Array(f)).__proto__ = y.prototype : (l === null && (l = new y(f)), l.length = f), l;
          }
          function y(l, f, w) {
            if (!(y.TYPED_ARRAY_SUPPORT || this instanceof y)) return new y(l, f, w);
            if (typeof l == "number") {
              if (typeof f == "string") throw new Error("If encoding is specified then the first argument must be a string");
              return N(this, l);
            }
            return C(this, l, f, w);
          }
          function C(l, f, w, U) {
            if (typeof f == "number") throw new TypeError('"value" argument must not be a number');
            return typeof ArrayBuffer < "u" && f instanceof ArrayBuffer ? function(F, W, he, je) {
              if (W.byteLength, he < 0 || W.byteLength < he) throw new RangeError("'offset' is out of bounds");
              if (W.byteLength < he + (je || 0)) throw new RangeError("'length' is out of bounds");
              return W = he === void 0 && je === void 0 ? new Uint8Array(W) : je === void 0 ? new Uint8Array(W, he) : new Uint8Array(W, he, je), y.TYPED_ARRAY_SUPPORT ? (F = W).__proto__ = y.prototype : F = G(F, W), F;
            }(l, f, w, U) : typeof f == "string" ? function(F, W, he) {
              if (typeof he == "string" && he !== "" || (he = "utf8"), !y.isEncoding(he)) throw new TypeError('"encoding" must be a valid string encoding');
              var je = 0 | j(W, he), Re = (F = v(F, je)).write(W, he);
              return Re !== je && (F = F.slice(0, Re)), F;
            }(l, f, w) : function(F, W) {
              if (y.isBuffer(W)) {
                var he = 0 | K(W.length);
                return (F = v(F, he)).length === 0 || W.copy(F, 0, 0, he), F;
              }
              if (W) {
                if (typeof ArrayBuffer < "u" && W.buffer instanceof ArrayBuffer || "length" in W) return typeof W.length != "number" || (je = W.length) != je ? v(F, 0) : G(F, W);
                if (W.type === "Buffer" && m(W.data)) return G(F, W.data);
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
            if (x(f), l = v(l, f < 0 ? 0 : 0 | K(f)), !y.TYPED_ARRAY_SUPPORT) for (var w = 0; w < f; ++w) l[w] = 0;
            return l;
          }
          function G(l, f) {
            var w = f.length < 0 ? 0 : 0 | K(f.length);
            l = v(l, w);
            for (var U = 0; U < w; U += 1) l[U] = 255 & f[U];
            return l;
          }
          function K(l) {
            if (l >= b()) throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + b().toString(16) + " bytes");
            return 0 | l;
          }
          function j(l, f) {
            if (y.isBuffer(l)) return l.length;
            if (typeof ArrayBuffer < "u" && typeof ArrayBuffer.isView == "function" && (ArrayBuffer.isView(l) || l instanceof ArrayBuffer)) return l.byteLength;
            typeof l != "string" && (l = "" + l);
            var w = l.length;
            if (w === 0) return 0;
            for (var U = !1; ; ) switch (f) {
              case "ascii":
              case "latin1":
              case "binary":
                return w;
              case "utf8":
              case "utf-8":
              case void 0:
                return X(l).length;
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
                if (U) return X(l).length;
                f = ("" + f).toLowerCase(), U = !0;
            }
          }
          function B(l, f, w) {
            var U = !1;
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
                return de(this, f, w);
              default:
                if (U) throw new TypeError("Unknown encoding: " + l);
                l = (l + "").toLowerCase(), U = !0;
            }
          }
          function P(l, f, w) {
            var U = l[f];
            l[f] = l[w], l[w] = U;
          }
          function I(l, f, w, U, F) {
            if (l.length === 0) return -1;
            if (typeof w == "string" ? (U = w, w = 0) : w > 2147483647 ? w = 2147483647 : w < -2147483648 && (w = -2147483648), w = +w, isNaN(w) && (w = F ? 0 : l.length - 1), w < 0 && (w = l.length + w), w >= l.length) {
              if (F) return -1;
              w = l.length - 1;
            } else if (w < 0) {
              if (!F) return -1;
              w = 0;
            }
            if (typeof f == "string" && (f = y.from(f, U)), y.isBuffer(f)) return f.length === 0 ? -1 : V(l, f, w, U, F);
            if (typeof f == "number") return f &= 255, y.TYPED_ARRAY_SUPPORT && typeof Uint8Array.prototype.indexOf == "function" ? F ? Uint8Array.prototype.indexOf.call(l, f, w) : Uint8Array.prototype.lastIndexOf.call(l, f, w) : V(l, [f], w, U, F);
            throw new TypeError("val must be string, number or Buffer");
          }
          function V(l, f, w, U, F) {
            var W, he = 1, je = l.length, Re = f.length;
            if (U !== void 0 && ((U = String(U).toLowerCase()) === "ucs2" || U === "ucs-2" || U === "utf16le" || U === "utf-16le")) {
              if (l.length < 2 || f.length < 2) return -1;
              he = 2, je /= 2, Re /= 2, w /= 2;
            }
            function Xe(Jt, wt) {
              return he === 1 ? Jt[wt] : Jt.readUInt16BE(wt * he);
            }
            if (F) {
              var He = -1;
              for (W = w; W < je; W++) if (Xe(l, W) === Xe(f, He === -1 ? 0 : W - He)) {
                if (He === -1 && (He = W), W - He + 1 === Re) return He * he;
              } else He !== -1 && (W -= W - He), He = -1;
            } else for (w + Re > je && (w = je - Re), W = w; W >= 0; W--) {
              for (var At = !0, kt = 0; kt < Re; kt++) if (Xe(l, W + kt) !== Xe(f, kt)) {
                At = !1;
                break;
              }
              if (At) return W;
            }
            return -1;
          }
          function R(l, f, w, U) {
            w = Number(w) || 0;
            var F = l.length - w;
            U ? (U = Number(U)) > F && (U = F) : U = F;
            var W = f.length;
            if (W % 2 != 0) throw new TypeError("Invalid hex string");
            U > W / 2 && (U = W / 2);
            for (var he = 0; he < U; ++he) {
              var je = parseInt(f.substr(2 * he, 2), 16);
              if (isNaN(je)) return he;
              l[w + he] = je;
            }
            return he;
          }
          function oe(l, f, w, U) {
            return me(X(f, l.length - w), l, w, U);
          }
          function Q(l, f, w, U) {
            return me(function(F) {
              for (var W = [], he = 0; he < F.length; ++he) W.push(255 & F.charCodeAt(he));
              return W;
            }(f), l, w, U);
          }
          function z(l, f, w, U) {
            return Q(l, f, w, U);
          }
          function M(l, f, w, U) {
            return me(Y(f), l, w, U);
          }
          function se(l, f, w, U) {
            return me(function(F, W) {
              for (var he, je, Re, Xe = [], He = 0; He < F.length && !((W -= 2) < 0); ++He) he = F.charCodeAt(He), je = he >> 8, Re = he % 256, Xe.push(Re), Xe.push(je);
              return Xe;
            }(f, l.length - w), l, w, U);
          }
          function le(l, f, w) {
            return f === 0 && w === l.length ? o.fromByteArray(l) : o.fromByteArray(l.slice(f, w));
          }
          function te(l, f, w) {
            w = Math.min(l.length, w);
            for (var U = [], F = f; F < w; ) {
              var W, he, je, Re, Xe = l[F], He = null, At = Xe > 239 ? 4 : Xe > 223 ? 3 : Xe > 191 ? 2 : 1;
              if (F + At <= w) switch (At) {
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
            return function(kt) {
              var Jt = kt.length;
              if (Jt <= 4096) return String.fromCharCode.apply(String, kt);
              for (var wt = "", gt = 0; gt < Jt; ) wt += String.fromCharCode.apply(String, kt.slice(gt, gt += 4096));
              return wt;
            }(U);
          }
          i.Buffer = y, i.SlowBuffer = function(l) {
            return +l != l && (l = 0), y.alloc(+l);
          }, i.INSPECT_MAX_BYTES = 50, y.TYPED_ARRAY_SUPPORT = c.TYPED_ARRAY_SUPPORT !== void 0 ? c.TYPED_ARRAY_SUPPORT : function() {
            try {
              var l = new Uint8Array(1);
              return l.__proto__ = { __proto__: Uint8Array.prototype, foo: function() {
                return 42;
              } }, l.foo() === 42 && typeof l.subarray == "function" && l.subarray(1, 1).byteLength === 0;
            } catch {
              return !1;
            }
          }(), i.kMaxLength = b(), y.poolSize = 8192, y._augment = function(l) {
            return l.__proto__ = y.prototype, l;
          }, y.from = function(l, f, w) {
            return C(null, l, f, w);
          }, y.TYPED_ARRAY_SUPPORT && (y.prototype.__proto__ = Uint8Array.prototype, y.__proto__ = Uint8Array, typeof Symbol < "u" && Symbol.species && y[Symbol.species] === y && Object.defineProperty(y, Symbol.species, { value: null, configurable: !0 })), y.alloc = function(l, f, w) {
            return function(U, F, W, he) {
              return x(F), F <= 0 ? v(U, F) : W !== void 0 ? typeof he == "string" ? v(U, F).fill(W, he) : v(U, F).fill(W) : v(U, F);
            }(null, l, f, w);
          }, y.allocUnsafe = function(l) {
            return N(null, l);
          }, y.allocUnsafeSlow = function(l) {
            return N(null, l);
          }, y.isBuffer = function(l) {
            return !(l == null || !l._isBuffer);
          }, y.compare = function(l, f) {
            if (!y.isBuffer(l) || !y.isBuffer(f)) throw new TypeError("Arguments must be Buffers");
            if (l === f) return 0;
            for (var w = l.length, U = f.length, F = 0, W = Math.min(w, U); F < W; ++F) if (l[F] !== f[F]) {
              w = l[F], U = f[F];
              break;
            }
            return w < U ? -1 : U < w ? 1 : 0;
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
          }, y.concat = function(l, f) {
            if (!m(l)) throw new TypeError('"list" argument must be an Array of Buffers');
            if (l.length === 0) return y.alloc(0);
            var w;
            if (f === void 0) for (f = 0, w = 0; w < l.length; ++w) f += l[w].length;
            var U = y.allocUnsafe(f), F = 0;
            for (w = 0; w < l.length; ++w) {
              var W = l[w];
              if (!y.isBuffer(W)) throw new TypeError('"list" argument must be an Array of Buffers');
              W.copy(U, F), F += W.length;
            }
            return U;
          }, y.byteLength = j, y.prototype._isBuffer = !0, y.prototype.swap16 = function() {
            var l = this.length;
            if (l % 2 != 0) throw new RangeError("Buffer size must be a multiple of 16-bits");
            for (var f = 0; f < l; f += 2) P(this, f, f + 1);
            return this;
          }, y.prototype.swap32 = function() {
            var l = this.length;
            if (l % 4 != 0) throw new RangeError("Buffer size must be a multiple of 32-bits");
            for (var f = 0; f < l; f += 4) P(this, f, f + 3), P(this, f + 1, f + 2);
            return this;
          }, y.prototype.swap64 = function() {
            var l = this.length;
            if (l % 8 != 0) throw new RangeError("Buffer size must be a multiple of 64-bits");
            for (var f = 0; f < l; f += 8) P(this, f, f + 7), P(this, f + 1, f + 6), P(this, f + 2, f + 5), P(this, f + 3, f + 4);
            return this;
          }, y.prototype.toString = function() {
            var l = 0 | this.length;
            return l === 0 ? "" : arguments.length === 0 ? te(this, 0, l) : B.apply(this, arguments);
          }, y.prototype.equals = function(l) {
            if (!y.isBuffer(l)) throw new TypeError("Argument must be a Buffer");
            return this === l || y.compare(this, l) === 0;
          }, y.prototype.inspect = function() {
            var l = "", f = i.INSPECT_MAX_BYTES;
            return this.length > 0 && (l = this.toString("hex", 0, f).match(/.{2}/g).join(" "), this.length > f && (l += " ... ")), "<Buffer " + l + ">";
          }, y.prototype.compare = function(l, f, w, U, F) {
            if (!y.isBuffer(l)) throw new TypeError("Argument must be a Buffer");
            if (f === void 0 && (f = 0), w === void 0 && (w = l ? l.length : 0), U === void 0 && (U = 0), F === void 0 && (F = this.length), f < 0 || w > l.length || U < 0 || F > this.length) throw new RangeError("out of range index");
            if (U >= F && f >= w) return 0;
            if (U >= F) return -1;
            if (f >= w) return 1;
            if (this === l) return 0;
            for (var W = (F >>>= 0) - (U >>>= 0), he = (w >>>= 0) - (f >>>= 0), je = Math.min(W, he), Re = this.slice(U, F), Xe = l.slice(f, w), He = 0; He < je; ++He) if (Re[He] !== Xe[He]) {
              W = Re[He], he = Xe[He];
              break;
            }
            return W < he ? -1 : he < W ? 1 : 0;
          }, y.prototype.includes = function(l, f, w) {
            return this.indexOf(l, f, w) !== -1;
          }, y.prototype.indexOf = function(l, f, w) {
            return I(this, l, f, w, !0);
          }, y.prototype.lastIndexOf = function(l, f, w) {
            return I(this, l, f, w, !1);
          }, y.prototype.write = function(l, f, w, U) {
            if (f === void 0) U = "utf8", w = this.length, f = 0;
            else if (w === void 0 && typeof f == "string") U = f, w = this.length, f = 0;
            else {
              if (!isFinite(f)) throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
              f |= 0, isFinite(w) ? (w |= 0, U === void 0 && (U = "utf8")) : (U = w, w = void 0);
            }
            var F = this.length - f;
            if ((w === void 0 || w > F) && (w = F), l.length > 0 && (w < 0 || f < 0) || f > this.length) throw new RangeError("Attempt to write outside buffer bounds");
            U || (U = "utf8");
            for (var W = !1; ; ) switch (U) {
              case "hex":
                return R(this, l, f, w);
              case "utf8":
              case "utf-8":
                return oe(this, l, f, w);
              case "ascii":
                return Q(this, l, f, w);
              case "latin1":
              case "binary":
                return z(this, l, f, w);
              case "base64":
                return M(this, l, f, w);
              case "ucs2":
              case "ucs-2":
              case "utf16le":
              case "utf-16le":
                return se(this, l, f, w);
              default:
                if (W) throw new TypeError("Unknown encoding: " + U);
                U = ("" + U).toLowerCase(), W = !0;
            }
          }, y.prototype.toJSON = function() {
            return { type: "Buffer", data: Array.prototype.slice.call(this._arr || this, 0) };
          };
          function ce(l, f, w) {
            var U = "";
            w = Math.min(l.length, w);
            for (var F = f; F < w; ++F) U += String.fromCharCode(127 & l[F]);
            return U;
          }
          function ye(l, f, w) {
            var U = "";
            w = Math.min(l.length, w);
            for (var F = f; F < w; ++F) U += String.fromCharCode(l[F]);
            return U;
          }
          function J(l, f, w) {
            var U = l.length;
            (!f || f < 0) && (f = 0), (!w || w < 0 || w > U) && (w = U);
            for (var F = "", W = f; W < w; ++W) F += Je(l[W]);
            return F;
          }
          function de(l, f, w) {
            for (var U = l.slice(f, w), F = "", W = 0; W < U.length; W += 2) F += String.fromCharCode(U[W] + 256 * U[W + 1]);
            return F;
          }
          function D(l, f, w) {
            if (l % 1 != 0 || l < 0) throw new RangeError("offset is not uint");
            if (l + f > w) throw new RangeError("Trying to access beyond buffer length");
          }
          function ie(l, f, w, U, F, W) {
            if (!y.isBuffer(l)) throw new TypeError('"buffer" argument must be a Buffer instance');
            if (f > F || f < W) throw new RangeError('"value" argument is out of bounds');
            if (w + U > l.length) throw new RangeError("Index out of range");
          }
          function be(l, f, w, U) {
            f < 0 && (f = 65535 + f + 1);
            for (var F = 0, W = Math.min(l.length - w, 2); F < W; ++F) l[w + F] = (f & 255 << 8 * (U ? F : 1 - F)) >>> 8 * (U ? F : 1 - F);
          }
          function Te(l, f, w, U) {
            f < 0 && (f = 4294967295 + f + 1);
            for (var F = 0, W = Math.min(l.length - w, 4); F < W; ++F) l[w + F] = f >>> 8 * (U ? F : 3 - F) & 255;
          }
          function we(l, f, w, U, F, W) {
            if (w + U > l.length) throw new RangeError("Index out of range");
            if (w < 0) throw new RangeError("Index out of range");
          }
          function Pe(l, f, w, U, F) {
            return F || we(l, 0, w, 4), _.write(l, f, w, U, 23, 4), w + 4;
          }
          function Se(l, f, w, U, F) {
            return F || we(l, 0, w, 8), _.write(l, f, w, U, 52, 8), w + 8;
          }
          y.prototype.slice = function(l, f) {
            var w, U = this.length;
            if ((l = ~~l) < 0 ? (l += U) < 0 && (l = 0) : l > U && (l = U), (f = f === void 0 ? U : ~~f) < 0 ? (f += U) < 0 && (f = 0) : f > U && (f = U), f < l && (f = l), y.TYPED_ARRAY_SUPPORT) (w = this.subarray(l, f)).__proto__ = y.prototype;
            else {
              var F = f - l;
              w = new y(F, void 0);
              for (var W = 0; W < F; ++W) w[W] = this[W + l];
            }
            return w;
          }, y.prototype.readUIntLE = function(l, f, w) {
            l |= 0, f |= 0, w || D(l, f, this.length);
            for (var U = this[l], F = 1, W = 0; ++W < f && (F *= 256); ) U += this[l + W] * F;
            return U;
          }, y.prototype.readUIntBE = function(l, f, w) {
            l |= 0, f |= 0, w || D(l, f, this.length);
            for (var U = this[l + --f], F = 1; f > 0 && (F *= 256); ) U += this[l + --f] * F;
            return U;
          }, y.prototype.readUInt8 = function(l, f) {
            return f || D(l, 1, this.length), this[l];
          }, y.prototype.readUInt16LE = function(l, f) {
            return f || D(l, 2, this.length), this[l] | this[l + 1] << 8;
          }, y.prototype.readUInt16BE = function(l, f) {
            return f || D(l, 2, this.length), this[l] << 8 | this[l + 1];
          }, y.prototype.readUInt32LE = function(l, f) {
            return f || D(l, 4, this.length), (this[l] | this[l + 1] << 8 | this[l + 2] << 16) + 16777216 * this[l + 3];
          }, y.prototype.readUInt32BE = function(l, f) {
            return f || D(l, 4, this.length), 16777216 * this[l] + (this[l + 1] << 16 | this[l + 2] << 8 | this[l + 3]);
          }, y.prototype.readIntLE = function(l, f, w) {
            l |= 0, f |= 0, w || D(l, f, this.length);
            for (var U = this[l], F = 1, W = 0; ++W < f && (F *= 256); ) U += this[l + W] * F;
            return U >= (F *= 128) && (U -= Math.pow(2, 8 * f)), U;
          }, y.prototype.readIntBE = function(l, f, w) {
            l |= 0, f |= 0, w || D(l, f, this.length);
            for (var U = f, F = 1, W = this[l + --U]; U > 0 && (F *= 256); ) W += this[l + --U] * F;
            return W >= (F *= 128) && (W -= Math.pow(2, 8 * f)), W;
          }, y.prototype.readInt8 = function(l, f) {
            return f || D(l, 1, this.length), 128 & this[l] ? -1 * (255 - this[l] + 1) : this[l];
          }, y.prototype.readInt16LE = function(l, f) {
            f || D(l, 2, this.length);
            var w = this[l] | this[l + 1] << 8;
            return 32768 & w ? 4294901760 | w : w;
          }, y.prototype.readInt16BE = function(l, f) {
            f || D(l, 2, this.length);
            var w = this[l + 1] | this[l] << 8;
            return 32768 & w ? 4294901760 | w : w;
          }, y.prototype.readInt32LE = function(l, f) {
            return f || D(l, 4, this.length), this[l] | this[l + 1] << 8 | this[l + 2] << 16 | this[l + 3] << 24;
          }, y.prototype.readInt32BE = function(l, f) {
            return f || D(l, 4, this.length), this[l] << 24 | this[l + 1] << 16 | this[l + 2] << 8 | this[l + 3];
          }, y.prototype.readFloatLE = function(l, f) {
            return f || D(l, 4, this.length), _.read(this, l, !0, 23, 4);
          }, y.prototype.readFloatBE = function(l, f) {
            return f || D(l, 4, this.length), _.read(this, l, !1, 23, 4);
          }, y.prototype.readDoubleLE = function(l, f) {
            return f || D(l, 8, this.length), _.read(this, l, !0, 52, 8);
          }, y.prototype.readDoubleBE = function(l, f) {
            return f || D(l, 8, this.length), _.read(this, l, !1, 52, 8);
          }, y.prototype.writeUIntLE = function(l, f, w, U) {
            l = +l, f |= 0, w |= 0, U || ie(this, l, f, w, Math.pow(2, 8 * w) - 1, 0);
            var F = 1, W = 0;
            for (this[f] = 255 & l; ++W < w && (F *= 256); ) this[f + W] = l / F & 255;
            return f + w;
          }, y.prototype.writeUIntBE = function(l, f, w, U) {
            l = +l, f |= 0, w |= 0, U || ie(this, l, f, w, Math.pow(2, 8 * w) - 1, 0);
            var F = w - 1, W = 1;
            for (this[f + F] = 255 & l; --F >= 0 && (W *= 256); ) this[f + F] = l / W & 255;
            return f + w;
          }, y.prototype.writeUInt8 = function(l, f, w) {
            return l = +l, f |= 0, w || ie(this, l, f, 1, 255, 0), y.TYPED_ARRAY_SUPPORT || (l = Math.floor(l)), this[f] = 255 & l, f + 1;
          }, y.prototype.writeUInt16LE = function(l, f, w) {
            return l = +l, f |= 0, w || ie(this, l, f, 2, 65535, 0), y.TYPED_ARRAY_SUPPORT ? (this[f] = 255 & l, this[f + 1] = l >>> 8) : be(this, l, f, !0), f + 2;
          }, y.prototype.writeUInt16BE = function(l, f, w) {
            return l = +l, f |= 0, w || ie(this, l, f, 2, 65535, 0), y.TYPED_ARRAY_SUPPORT ? (this[f] = l >>> 8, this[f + 1] = 255 & l) : be(this, l, f, !1), f + 2;
          }, y.prototype.writeUInt32LE = function(l, f, w) {
            return l = +l, f |= 0, w || ie(this, l, f, 4, 4294967295, 0), y.TYPED_ARRAY_SUPPORT ? (this[f + 3] = l >>> 24, this[f + 2] = l >>> 16, this[f + 1] = l >>> 8, this[f] = 255 & l) : Te(this, l, f, !0), f + 4;
          }, y.prototype.writeUInt32BE = function(l, f, w) {
            return l = +l, f |= 0, w || ie(this, l, f, 4, 4294967295, 0), y.TYPED_ARRAY_SUPPORT ? (this[f] = l >>> 24, this[f + 1] = l >>> 16, this[f + 2] = l >>> 8, this[f + 3] = 255 & l) : Te(this, l, f, !1), f + 4;
          }, y.prototype.writeIntLE = function(l, f, w, U) {
            if (l = +l, f |= 0, !U) {
              var F = Math.pow(2, 8 * w - 1);
              ie(this, l, f, w, F - 1, -F);
            }
            var W = 0, he = 1, je = 0;
            for (this[f] = 255 & l; ++W < w && (he *= 256); ) l < 0 && je === 0 && this[f + W - 1] !== 0 && (je = 1), this[f + W] = (l / he >> 0) - je & 255;
            return f + w;
          }, y.prototype.writeIntBE = function(l, f, w, U) {
            if (l = +l, f |= 0, !U) {
              var F = Math.pow(2, 8 * w - 1);
              ie(this, l, f, w, F - 1, -F);
            }
            var W = w - 1, he = 1, je = 0;
            for (this[f + W] = 255 & l; --W >= 0 && (he *= 256); ) l < 0 && je === 0 && this[f + W + 1] !== 0 && (je = 1), this[f + W] = (l / he >> 0) - je & 255;
            return f + w;
          }, y.prototype.writeInt8 = function(l, f, w) {
            return l = +l, f |= 0, w || ie(this, l, f, 1, 127, -128), y.TYPED_ARRAY_SUPPORT || (l = Math.floor(l)), l < 0 && (l = 255 + l + 1), this[f] = 255 & l, f + 1;
          }, y.prototype.writeInt16LE = function(l, f, w) {
            return l = +l, f |= 0, w || ie(this, l, f, 2, 32767, -32768), y.TYPED_ARRAY_SUPPORT ? (this[f] = 255 & l, this[f + 1] = l >>> 8) : be(this, l, f, !0), f + 2;
          }, y.prototype.writeInt16BE = function(l, f, w) {
            return l = +l, f |= 0, w || ie(this, l, f, 2, 32767, -32768), y.TYPED_ARRAY_SUPPORT ? (this[f] = l >>> 8, this[f + 1] = 255 & l) : be(this, l, f, !1), f + 2;
          }, y.prototype.writeInt32LE = function(l, f, w) {
            return l = +l, f |= 0, w || ie(this, l, f, 4, 2147483647, -2147483648), y.TYPED_ARRAY_SUPPORT ? (this[f] = 255 & l, this[f + 1] = l >>> 8, this[f + 2] = l >>> 16, this[f + 3] = l >>> 24) : Te(this, l, f, !0), f + 4;
          }, y.prototype.writeInt32BE = function(l, f, w) {
            return l = +l, f |= 0, w || ie(this, l, f, 4, 2147483647, -2147483648), l < 0 && (l = 4294967295 + l + 1), y.TYPED_ARRAY_SUPPORT ? (this[f] = l >>> 24, this[f + 1] = l >>> 16, this[f + 2] = l >>> 8, this[f + 3] = 255 & l) : Te(this, l, f, !1), f + 4;
          }, y.prototype.writeFloatLE = function(l, f, w) {
            return Pe(this, l, f, !0, w);
          }, y.prototype.writeFloatBE = function(l, f, w) {
            return Pe(this, l, f, !1, w);
          }, y.prototype.writeDoubleLE = function(l, f, w) {
            return Se(this, l, f, !0, w);
          }, y.prototype.writeDoubleBE = function(l, f, w) {
            return Se(this, l, f, !1, w);
          }, y.prototype.copy = function(l, f, w, U) {
            if (w || (w = 0), U || U === 0 || (U = this.length), f >= l.length && (f = l.length), f || (f = 0), U > 0 && U < w && (U = w), U === w || l.length === 0 || this.length === 0) return 0;
            if (f < 0) throw new RangeError("targetStart out of bounds");
            if (w < 0 || w >= this.length) throw new RangeError("sourceStart out of bounds");
            if (U < 0) throw new RangeError("sourceEnd out of bounds");
            U > this.length && (U = this.length), l.length - f < U - w && (U = l.length - f + w);
            var F, W = U - w;
            if (this === l && w < f && f < U) for (F = W - 1; F >= 0; --F) l[F + f] = this[F + w];
            else if (W < 1e3 || !y.TYPED_ARRAY_SUPPORT) for (F = 0; F < W; ++F) l[F + f] = this[F + w];
            else Uint8Array.prototype.set.call(l, this.subarray(w, w + W), f);
            return W;
          }, y.prototype.fill = function(l, f, w, U) {
            if (typeof l == "string") {
              if (typeof f == "string" ? (U = f, f = 0, w = this.length) : typeof w == "string" && (U = w, w = this.length), l.length === 1) {
                var F = l.charCodeAt(0);
                F < 256 && (l = F);
              }
              if (U !== void 0 && typeof U != "string") throw new TypeError("encoding must be a string");
              if (typeof U == "string" && !y.isEncoding(U)) throw new TypeError("Unknown encoding: " + U);
            } else typeof l == "number" && (l &= 255);
            if (f < 0 || this.length < f || this.length < w) throw new RangeError("Out of range index");
            if (w <= f) return this;
            var W;
            if (f >>>= 0, w = w === void 0 ? this.length : w >>> 0, l || (l = 0), typeof l == "number") for (W = f; W < w; ++W) this[W] = l;
            else {
              var he = y.isBuffer(l) ? l : X(new y(l, U).toString()), je = he.length;
              for (W = 0; W < w - f; ++W) this[W + f] = he[W % je];
            }
            return this;
          };
          var ze = /[^+\/0-9A-Za-z-_]/g;
          function Je(l) {
            return l < 16 ? "0" + l.toString(16) : l.toString(16);
          }
          function X(l, f) {
            var w;
            f = f || 1 / 0;
            for (var U = l.length, F = null, W = [], he = 0; he < U; ++he) {
              if ((w = l.charCodeAt(he)) > 55295 && w < 57344) {
                if (!F) {
                  if (w > 56319) {
                    (f -= 3) > -1 && W.push(239, 191, 189);
                    continue;
                  }
                  if (he + 1 === U) {
                    (f -= 3) > -1 && W.push(239, 191, 189);
                    continue;
                  }
                  F = w;
                  continue;
                }
                if (w < 56320) {
                  (f -= 3) > -1 && W.push(239, 191, 189), F = w;
                  continue;
                }
                w = 65536 + (F - 55296 << 10 | w - 56320);
              } else F && (f -= 3) > -1 && W.push(239, 191, 189);
              if (F = null, w < 128) {
                if ((f -= 1) < 0) break;
                W.push(w);
              } else if (w < 2048) {
                if ((f -= 2) < 0) break;
                W.push(w >> 6 | 192, 63 & w | 128);
              } else if (w < 65536) {
                if ((f -= 3) < 0) break;
                W.push(w >> 12 | 224, w >> 6 & 63 | 128, 63 & w | 128);
              } else {
                if (!(w < 1114112)) throw new Error("Invalid code point");
                if ((f -= 4) < 0) break;
                W.push(w >> 18 | 240, w >> 12 & 63 | 128, w >> 6 & 63 | 128, 63 & w | 128);
              }
            }
            return W;
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
          function me(l, f, w, U) {
            for (var F = 0; F < U && !(F + w >= f.length || F >= l.length); ++F) f[F + w] = l[F];
            return F;
          }
        }).call(this, u(15));
      }, function(g, i, u) {
        i.byteLength = function(x) {
          var N = y(x), G = N[0], K = N[1];
          return 3 * (G + K) / 4 - K;
        }, i.toByteArray = function(x) {
          var N, G, K = y(x), j = K[0], B = K[1], P = new _(function(R, oe, Q) {
            return 3 * (oe + Q) / 4 - Q;
          }(0, j, B)), I = 0, V = B > 0 ? j - 4 : j;
          for (G = 0; G < V; G += 4) N = o[x.charCodeAt(G)] << 18 | o[x.charCodeAt(G + 1)] << 12 | o[x.charCodeAt(G + 2)] << 6 | o[x.charCodeAt(G + 3)], P[I++] = N >> 16 & 255, P[I++] = N >> 8 & 255, P[I++] = 255 & N;
          return B === 2 && (N = o[x.charCodeAt(G)] << 2 | o[x.charCodeAt(G + 1)] >> 4, P[I++] = 255 & N), B === 1 && (N = o[x.charCodeAt(G)] << 10 | o[x.charCodeAt(G + 1)] << 4 | o[x.charCodeAt(G + 2)] >> 2, P[I++] = N >> 8 & 255, P[I++] = 255 & N), P;
        }, i.fromByteArray = function(x) {
          for (var N, G = x.length, K = G % 3, j = [], B = 0, P = G - K; B < P; B += 16383) j.push(C(x, B, B + 16383 > P ? P : B + 16383));
          return K === 1 ? (N = x[G - 1], j.push(c[N >> 2] + c[N << 4 & 63] + "==")) : K === 2 && (N = (x[G - 2] << 8) + x[G - 1], j.push(c[N >> 10] + c[N >> 4 & 63] + c[N << 2 & 63] + "=")), j.join("");
        };
        for (var c = [], o = [], _ = typeof Uint8Array < "u" ? Uint8Array : Array, m = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", b = 0, v = m.length; b < v; ++b) c[b] = m[b], o[m.charCodeAt(b)] = b;
        function y(x) {
          var N = x.length;
          if (N % 4 > 0) throw new Error("Invalid string. Length must be a multiple of 4");
          var G = x.indexOf("=");
          return G === -1 && (G = N), [G, G === N ? 0 : 4 - G % 4];
        }
        function C(x, N, G) {
          for (var K, j, B = [], P = N; P < G; P += 3) K = (x[P] << 16 & 16711680) + (x[P + 1] << 8 & 65280) + (255 & x[P + 2]), B.push(c[(j = K) >> 18 & 63] + c[j >> 12 & 63] + c[j >> 6 & 63] + c[63 & j]);
          return B.join("");
        }
        o[45] = 62, o[95] = 63;
      }, function(g, i) {
        i.read = function(u, c, o, _, m) {
          var b, v, y = 8 * m - _ - 1, C = (1 << y) - 1, x = C >> 1, N = -7, G = o ? m - 1 : 0, K = o ? -1 : 1, j = u[c + G];
          for (G += K, b = j & (1 << -N) - 1, j >>= -N, N += y; N > 0; b = 256 * b + u[c + G], G += K, N -= 8) ;
          for (v = b & (1 << -N) - 1, b >>= -N, N += _; N > 0; v = 256 * v + u[c + G], G += K, N -= 8) ;
          if (b === 0) b = 1 - x;
          else {
            if (b === C) return v ? NaN : 1 / 0 * (j ? -1 : 1);
            v += Math.pow(2, _), b -= x;
          }
          return (j ? -1 : 1) * v * Math.pow(2, b - _);
        }, i.write = function(u, c, o, _, m, b) {
          var v, y, C, x = 8 * b - m - 1, N = (1 << x) - 1, G = N >> 1, K = m === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0, j = _ ? 0 : b - 1, B = _ ? 1 : -1, P = c < 0 || c === 0 && 1 / c < 0 ? 1 : 0;
          for (c = Math.abs(c), isNaN(c) || c === 1 / 0 ? (y = isNaN(c) ? 1 : 0, v = N) : (v = Math.floor(Math.log(c) / Math.LN2), c * (C = Math.pow(2, -v)) < 1 && (v--, C *= 2), (c += v + G >= 1 ? K / C : K * Math.pow(2, 1 - G)) * C >= 2 && (v++, C /= 2), v + G >= N ? (y = 0, v = N) : v + G >= 1 ? (y = (c * C - 1) * Math.pow(2, m), v += G) : (y = c * Math.pow(2, G - 1) * Math.pow(2, m), v = 0)); m >= 8; u[o + j] = 255 & y, j += B, y /= 256, m -= 8) ;
          for (v = v << m | y, x += m; x > 0; u[o + j] = 255 & v, j += B, v /= 256, x -= 8) ;
          u[o + j - B] |= 128 * P;
        };
      }, function(g, i) {
        var u = {}.toString;
        g.exports = Array.isArray || function(c) {
          return u.call(c) == "[object Array]";
        };
      }, function(g, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.arrayToString = void 0, i.arrayToString = (c, o, _) => {
          const m = c.map(function(v, y) {
            const C = _(v, y);
            return C === void 0 ? String(C) : o + C.split(`
`).join(`
` + o);
          }).join(o ? `,
` : ","), b = o && m ? `
` : "";
          return `[${b}${m}${b}]`;
        };
      }, function(g, i, u) {
        function c(j) {
          return (c = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(B) {
            return typeof B;
          } : function(B) {
            return B && typeof Symbol == "function" && B.constructor === Symbol && B !== Symbol.prototype ? "symbol" : typeof B;
          })(j);
        }
        Object.defineProperty(i, "__esModule", { value: !0 }), i.matchesSelector = x, i.matchesSelectorAndParentsTo = function(j, B, P) {
          var I = j;
          do {
            if (x(I, B)) return !0;
            if (I === P) return !1;
            I = I.parentNode;
          } while (I);
          return !1;
        }, i.addEvent = function(j, B, P, I) {
          if (j) {
            var V = v({ capture: !0 }, I);
            j.addEventListener ? j.addEventListener(B, P, V) : j.attachEvent ? j.attachEvent("on" + B, P) : j["on" + B] = P;
          }
        }, i.removeEvent = function(j, B, P, I) {
          if (j) {
            var V = v({ capture: !0 }, I);
            j.removeEventListener ? j.removeEventListener(B, P, V) : j.detachEvent ? j.detachEvent("on" + B, P) : j["on" + B] = null;
          }
        }, i.outerHeight = function(j) {
          var B = j.clientHeight, P = j.ownerDocument.defaultView.getComputedStyle(j);
          return B += (0, o.int)(P.borderTopWidth), B += (0, o.int)(P.borderBottomWidth);
        }, i.outerWidth = function(j) {
          var B = j.clientWidth, P = j.ownerDocument.defaultView.getComputedStyle(j);
          return B += (0, o.int)(P.borderLeftWidth), B += (0, o.int)(P.borderRightWidth);
        }, i.innerHeight = function(j) {
          var B = j.clientHeight, P = j.ownerDocument.defaultView.getComputedStyle(j);
          return B -= (0, o.int)(P.paddingTop), B -= (0, o.int)(P.paddingBottom);
        }, i.innerWidth = function(j) {
          var B = j.clientWidth, P = j.ownerDocument.defaultView.getComputedStyle(j);
          return B -= (0, o.int)(P.paddingLeft), B -= (0, o.int)(P.paddingRight);
        }, i.offsetXYFromParent = function(j, B, P) {
          var I = B === B.ownerDocument.body ? { left: 0, top: 0 } : B.getBoundingClientRect(), V = (j.clientX + B.scrollLeft - I.left) / P, R = (j.clientY + B.scrollTop - I.top) / P;
          return { x: V, y: R };
        }, i.createCSSTransform = function(j, B) {
          var P = N(j, B, "px");
          return y({}, (0, _.browserPrefixToKey)("transform", _.default), P);
        }, i.createSVGTransform = function(j, B) {
          return N(j, B, "");
        }, i.getTranslation = N, i.getTouch = function(j, B) {
          return j.targetTouches && (0, o.findInArray)(j.targetTouches, function(P) {
            return B === P.identifier;
          }) || j.changedTouches && (0, o.findInArray)(j.changedTouches, function(P) {
            return B === P.identifier;
          });
        }, i.getTouchIdentifier = function(j) {
          if (j.targetTouches && j.targetTouches[0]) return j.targetTouches[0].identifier;
          if (j.changedTouches && j.changedTouches[0]) return j.changedTouches[0].identifier;
        }, i.addUserSelectStyles = function(j) {
          if (j) {
            var B = j.getElementById("react-draggable-style-el");
            B || ((B = j.createElement("style")).type = "text/css", B.id = "react-draggable-style-el", B.innerHTML = `.react-draggable-transparent-selection *::-moz-selection {all: inherit;}
`, B.innerHTML += `.react-draggable-transparent-selection *::selection {all: inherit;}
`, j.getElementsByTagName("head")[0].appendChild(B)), j.body && G(j.body, "react-draggable-transparent-selection");
          }
        }, i.removeUserSelectStyles = function(j) {
          if (j)
            try {
              if (j.body && K(j.body, "react-draggable-transparent-selection"), j.selection) j.selection.empty();
              else {
                var B = (j.defaultView || window).getSelection();
                B && B.type !== "Caret" && B.removeAllRanges();
              }
            } catch {
            }
        }, i.addClassName = G, i.removeClassName = K;
        var o = u(20), _ = function(j) {
          if (j && j.__esModule) return j;
          if (j === null || c(j) !== "object" && typeof j != "function") return { default: j };
          var B = m();
          if (B && B.has(j)) return B.get(j);
          var P = {}, I = Object.defineProperty && Object.getOwnPropertyDescriptor;
          for (var V in j) if (Object.prototype.hasOwnProperty.call(j, V)) {
            var R = I ? Object.getOwnPropertyDescriptor(j, V) : null;
            R && (R.get || R.set) ? Object.defineProperty(P, V, R) : P[V] = j[V];
          }
          return P.default = j, B && B.set(j, P), P;
        }(u(56));
        function m() {
          if (typeof WeakMap != "function") return null;
          var j = /* @__PURE__ */ new WeakMap();
          return m = function() {
            return j;
          }, j;
        }
        function b(j, B) {
          var P = Object.keys(j);
          if (Object.getOwnPropertySymbols) {
            var I = Object.getOwnPropertySymbols(j);
            B && (I = I.filter(function(V) {
              return Object.getOwnPropertyDescriptor(j, V).enumerable;
            })), P.push.apply(P, I);
          }
          return P;
        }
        function v(j) {
          for (var B = 1; B < arguments.length; B++) {
            var P = arguments[B] != null ? arguments[B] : {};
            B % 2 ? b(Object(P), !0).forEach(function(I) {
              y(j, I, P[I]);
            }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(j, Object.getOwnPropertyDescriptors(P)) : b(Object(P)).forEach(function(I) {
              Object.defineProperty(j, I, Object.getOwnPropertyDescriptor(P, I));
            });
          }
          return j;
        }
        function y(j, B, P) {
          return B in j ? Object.defineProperty(j, B, { value: P, enumerable: !0, configurable: !0, writable: !0 }) : j[B] = P, j;
        }
        var C = "";
        function x(j, B) {
          return C || (C = (0, o.findInArray)(["matches", "webkitMatchesSelector", "mozMatchesSelector", "msMatchesSelector", "oMatchesSelector"], function(P) {
            return (0, o.isFunction)(j[P]);
          })), !!(0, o.isFunction)(j[C]) && j[C](B);
        }
        function N(j, B, P) {
          var I = j.x, V = j.y, R = "translate(".concat(I).concat(P, ",").concat(V).concat(P, ")");
          if (B) {
            var oe = "".concat(typeof B.x == "string" ? B.x : B.x + P), Q = "".concat(typeof B.y == "string" ? B.y : B.y + P);
            R = "translate(".concat(oe, ", ").concat(Q, ")") + R;
          }
          return R;
        }
        function G(j, B) {
          j.classList ? j.classList.add(B) : j.className.match(new RegExp("(?:^|\\s)".concat(B, "(?!\\S)"))) || (j.className += " ".concat(B));
        }
        function K(j, B) {
          j.classList ? j.classList.remove(B) : j.className = j.className.replace(new RegExp("(?:^|\\s)".concat(B, "(?!\\S)"), "g"), "");
        }
      }, function(g, i) {
        g.exports = function(u) {
          return u.webpackPolyfill || (u.deprecate = function() {
          }, u.paths = [], u.children || (u.children = []), Object.defineProperty(u, "loaded", { enumerable: !0, get: function() {
            return u.l;
          } }), Object.defineProperty(u, "id", { enumerable: !0, get: function() {
            return u.i;
          } }), u.webpackPolyfill = 1), u;
        };
      }, function(g, i, u) {
        var c = u(6), o = u(35);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[g.i, o, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, _), g.exports = o.locals || {};
      }, function(g, i, u) {
        (g.exports = u(7)(!1)).push([g.i, `.ck-inspector{--ck-inspector-color-tree-node-hover:#eaf2fb;--ck-inspector-color-tree-node-name:#882680;--ck-inspector-color-tree-node-attribute-name:#8a8a8a;--ck-inspector-color-tree-node-tag:#aaa;--ck-inspector-color-tree-node-attribute:#9a4819;--ck-inspector-color-tree-node-attribute-value:#2a43ac;--ck-inspector-color-tree-text-border:#b7b7b7;--ck-inspector-color-tree-node-border-hover:#b0c6e0;--ck-inspector-color-tree-content-delimiter:#ddd;--ck-inspector-color-tree-node-active-bg:#f5faff;--ck-inspector-color-tree-node-name-active-bg:#2b98f0;--ck-inspector-color-tree-node-inactive:#8a8a8a;--ck-inspector-color-tree-selection:#ff1744;--ck-inspector-color-tree-position:#000;--ck-inspector-color-comment:green}.ck-inspector .ck-inspector-tree{background:var(--ck-inspector-color-white);padding:1em;width:100%;height:100%;overflow:auto;user-select:none}.ck-inspector-tree .ck-inspector-tree-node__attribute{font:inherit;margin-left:.4em;color:var(--ck-inspector-color-tree-node-tag)}.ck-inspector-tree .ck-inspector-tree-node__attribute .ck-inspector-tree-node__attribute__name{color:var(--ck-inspector-color-tree-node-attribute)}.ck-inspector-tree .ck-inspector-tree-node__attribute .ck-inspector-tree-node__attribute__value{color:var(--ck-inspector-color-tree-node-attribute-value)}.ck-inspector-tree .ck-inspector-tree-node__attribute .ck-inspector-tree-node__attribute__value:before{content:'="'}.ck-inspector-tree .ck-inspector-tree-node__attribute .ck-inspector-tree-node__attribute__value:after{content:'"'}.ck-inspector-tree .ck-inspector-tree-node .ck-inspector-tree-node__name{color:var(--ck-inspector-color-tree-node-name);display:inline-block;width:100%;padding:0 .1em;border-left:1px solid transparent}.ck-inspector-tree .ck-inspector-tree-node .ck-inspector-tree-node__name:hover{background:var(--ck-inspector-color-tree-node-hover)}.ck-inspector-tree .ck-inspector-tree-node .ck-inspector-tree-node__content{padding:1px .5em 1px 1.5em;border-left:1px solid var(--ck-inspector-color-tree-content-delimiter);white-space:pre-wrap}.ck-inspector-tree .ck-inspector-tree-node:not(.ck-inspector-tree-node_tagless) .ck-inspector-tree-node__name>.ck-inspector-tree-node__name__bracket_open:after{content:"<";color:var(--ck-inspector-color-tree-node-tag)}.ck-inspector-tree .ck-inspector-tree-node:not(.ck-inspector-tree-node_tagless) .ck-inspector-tree-node__name .ck-inspector-tree-node__name__bracket_close:after{content:">";color:var(--ck-inspector-color-tree-node-tag)}.ck-inspector-tree .ck-inspector-tree-node:not(.ck-inspector-tree-node_tagless).ck-inspector-tree-node_empty .ck-inspector-tree-node__name:after{content:" />"}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_tagless .ck-inspector-tree-node__content{display:none}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name:not(.ck-inspector-tree-node__name_close),.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name:not(.ck-inspector-tree-node__name_close) :not(.ck-inspector-tree__position),.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name:not(.ck-inspector-tree-node__name_close)>.ck-inspector-tree-node__name__bracket:after{background:var(--ck-inspector-color-tree-node-name-active-bg);color:var(--ck-inspector-color-white)}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__content,.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name_close{background:var(--ck-inspector-color-tree-node-active-bg)}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__content{border-left-color:var(--ck-inspector-color-tree-node-name-active-bg)}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name{border-left:1px solid var(--ck-inspector-color-tree-node-name-active-bg)}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_disabled{opacity:.8}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_disabled .ck-inspector-tree-node__name,.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_disabled .ck-inspector-tree-node__name *{color:var(--ck-inspector-color-tree-node-inactive)}.ck-inspector-tree .ck-inspector-tree-text{display:block;margin-bottom:1px}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-node__content{border:1px dotted var(--ck-inspector-color-tree-text-border);border-radius:2px;padding:0 1px;margin-right:1px;display:inline-block;word-break:break-all}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes:not(:empty){margin-right:.5em}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes .ck-inspector-tree-node__attribute{background:var(--ck-inspector-color-tree-node-attribute-name);border-radius:2px;padding:0 .5em}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes .ck-inspector-tree-node__attribute+.ck-inspector-tree-node__attribute{margin-left:.2em}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes .ck-inspector-tree-node__attribute>*{color:var(--ck-inspector-color-white)}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes .ck-inspector-tree-node__attribute:first-child{margin-left:0}.ck-inspector-tree .ck-inspector-tree-text.ck-inspector-tree-node_active .ck-inspector-tree-node__content{border-style:solid;border-color:var(--ck-inspector-color-tree-node-name-active-bg)}.ck-inspector-tree .ck-inspector-tree-text.ck-inspector-tree-node_active .ck-inspector-tree-node__attribute{background:var(--ck-inspector-color-white)}.ck-inspector-tree .ck-inspector-tree-text.ck-inspector-tree-node_active .ck-inspector-tree-node__attribute>*{color:var(--ck-inspector-color-tree-node-name-active-bg)}.ck-inspector-tree .ck-inspector-tree-text.ck-inspector-tree-node_active>.ck-inspector-tree-node__content{background:var(--ck-inspector-color-tree-node-name-active-bg);color:var(--ck-inspector-color-white)}.ck-inspector-tree .ck-inspector-tree-text:not(.ck-inspector-tree-node_active) .ck-inspector-tree-node__content:hover{background:var(--ck-inspector-color-tree-node-hover);border-style:solid;border-color:var(--ck-inspector-color-tree-node-border-hover)}.ck-inspector-tree.ck-inspector-tree_text-direction_ltr .ck-inspector-tree-node__content{direction:ltr}.ck-inspector-tree.ck-inspector-tree_text-direction_rtl .ck-inspector-tree-node__content{direction:rtl}.ck-inspector-tree.ck-inspector-tree_text-direction_rtl .ck-inspector-tree-node__content .ck-inspector-tree-node__name{direction:ltr}.ck-inspector-tree.ck-inspector-tree_text-direction_rtl .ck-inspector-tree__position{transform:rotate(180deg)}.ck-inspector-tree .ck-inspector-tree-comment{color:var(--ck-inspector-color-comment);font-style:italic}.ck-inspector-tree .ck-inspector-tree-comment a{color:inherit;text-decoration:underline}.ck-inspector-tree_compact-text .ck-inspector-tree-text,.ck-inspector-tree_compact-text .ck-inspector-tree-text .ck-inspector-tree-node__content{display:inline}.ck-inspector .ck-inspector__tree__navigation{padding:.5em 1em;border-bottom:1px solid var(--ck-inspector-color-border)}.ck-inspector .ck-inspector__tree__navigation label{margin-right:.5em}.ck-inspector-tree .ck-inspector-tree__position{display:inline-block;position:relative;cursor:default;height:100%;pointer-events:none;vertical-align:top}.ck-inspector-tree .ck-inspector-tree__position:after{content:"";position:absolute;border:1px solid var(--ck-inspector-color-tree-position);width:0;top:0;bottom:0;margin-left:-1px}.ck-inspector-tree .ck-inspector-tree__position:before{margin-left:-1px}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_selection{z-index:2;--ck-inspector-color-tree-position:var(--ck-inspector-color-tree-selection)}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_selection:before{content:"";position:absolute;top:-1px;bottom:-1px;left:0;border-top:2px solid var(--ck-inspector-color-tree-position);border-bottom:2px solid var(--ck-inspector-color-tree-position);width:8px}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_selection.ck-inspector-tree__position_end:before{right:-1px;left:auto}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_marker{z-index:1}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_marker:before{content:"";display:block;position:absolute;left:0;top:-1px;cursor:default;width:0;height:0;border-left:0 solid transparent;border-bottom:0 solid transparent;border-right:7px solid transparent;border-top:7px solid var(--ck-inspector-color-tree-position)}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_marker.ck-inspector-tree__position_end:before{border-width:0 7px 7px 0;border-left-color:transparent;border-bottom-color:transparent;border-right-color:var(--ck-inspector-color-tree-position);border-top-color:transparent;left:-5px}`, ""]);
      }, function(g, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.canUseDOM = i.SafeNodeList = i.SafeHTMLCollection = void 0;
        var c, o = u(82), _ = ((c = o) && c.__esModule ? c : { default: c }).default, m = _.canUseDOM ? window.HTMLElement : {};
        i.SafeHTMLCollection = _.canUseDOM ? window.HTMLCollection : {}, i.SafeNodeList = _.canUseDOM ? window.NodeList : {}, i.canUseDOM = _.canUseDOM, i.default = m;
      }, function(g, i, u) {
        var c = u(6), o = u(38);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[g.i, o, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, _), g.exports = o.locals || {};
      }, function(g, i, u) {
        (g.exports = u(7)(!1)).push([g.i, `.ck-inspector,.ck-inspector-portal{--ck-inspector-color-white:#fff;--ck-inspector-color-black:#000;--ck-inspector-color-background:#f3f3f3;--ck-inspector-color-link:#005cc6;--ck-inspector-code-font-size:11px;--ck-inspector-code-font-family:monaco,Consolas,Lucida Console,monospace;--ck-inspector-color-border:#d0d0d0}.ck-inspector,.ck-inspector-portal,.ck-inspector-portal :not(select),.ck-inspector :not(select){box-sizing:border-box;width:auto;height:auto;position:static;margin:0;padding:0;border:0;background:transparent;text-decoration:none;transition:none;word-wrap:break-word;font-family:Arial,Helvetica Neue,Helvetica,sans-serif;font-size:12px;line-height:17px;font-weight:400;-webkit-font-smoothing:auto}.ck-inspector{overflow:hidden;border-collapse:collapse;color:var(--ck-inspector-color-black);text-align:left;white-space:normal;cursor:auto;float:none;background:var(--ck-inspector-color-background);border-top:1px solid var(--ck-inspector-color-border);z-index:9999}.ck-inspector.ck-inspector_collapsed>.ck-inspector-navbox>.ck-inspector-navbox__navigation .ck-inspector-horizontal-nav{display:none}.ck-inspector .ck-inspector-navbox__navigation__logo{background-size:contain;background-repeat:no-repeat;background-position:50%;display:block;overflow:hidden;text-indent:100px;align-self:center;white-space:nowrap;margin-right:1em;background-image:url("data:image/svg+xml;charset=utf-8,%3Csvg width='68' height='64' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M43.71 11.025a11.508 11.508 0 00-1.213 5.159c0 6.42 5.244 11.625 11.713 11.625.083 0 .167 0 .25-.002v16.282a5.464 5.464 0 01-2.756 4.739L30.986 60.7a5.548 5.548 0 01-5.512 0L4.756 48.828A5.464 5.464 0 012 44.089V20.344c0-1.955 1.05-3.76 2.756-4.738L25.474 3.733a5.548 5.548 0 015.512 0l12.724 7.292z' fill='%23FFF'/%3E%3Cpath d='M45.684 8.79a12.604 12.604 0 00-1.329 5.65c0 7.032 5.744 12.733 12.829 12.733.091 0 .183-.001.274-.003v17.834a5.987 5.987 0 01-3.019 5.19L31.747 63.196a6.076 6.076 0 01-6.037 0L3.02 50.193A5.984 5.984 0 010 45.003V18.997c0-2.14 1.15-4.119 3.019-5.19L25.71.804a6.076 6.076 0 016.037 0L45.684 8.79zm-29.44 11.89c-.834 0-1.51.671-1.51 1.498v.715c0 .828.676 1.498 1.51 1.498h25.489c.833 0 1.51-.67 1.51-1.498v-.715c0-.827-.677-1.498-1.51-1.498h-25.49zm0 9.227c-.834 0-1.51.671-1.51 1.498v.715c0 .828.676 1.498 1.51 1.498h18.479c.833 0 1.509-.67 1.509-1.498v-.715c0-.827-.676-1.498-1.51-1.498H16.244zm0 9.227c-.834 0-1.51.671-1.51 1.498v.715c0 .828.676 1.498 1.51 1.498h25.489c.833 0 1.51-.67 1.51-1.498v-.715c0-.827-.677-1.498-1.51-1.498h-25.49zm41.191-14.459c-5.835 0-10.565-4.695-10.565-10.486 0-5.792 4.73-10.487 10.565-10.487C63.27 3.703 68 8.398 68 14.19c0 5.791-4.73 10.486-10.565 10.486zm3.422-8.68c0-.467-.084-.875-.251-1.225a2.547 2.547 0 00-.686-.88 2.888 2.888 0 00-1.026-.531 4.418 4.418 0 00-1.259-.175c-.134 0-.283.006-.447.018a2.72 2.72 0 00-.446.07l.075-1.4h3.587v-1.8h-5.462l-.214 5.06c.319-.116.682-.21 1.089-.28.406-.071.77-.107 1.088-.107.218 0 .437.021.655.063.218.041.413.114.585.218s.313.244.422.419c.109.175.163.391.163.65 0 .424-.132.745-.396.961a1.434 1.434 0 01-.938.325c-.352 0-.656-.1-.912-.3-.256-.2-.43-.453-.523-.762l-1.925.588c.1.35.258.664.472.943.214.279.47.514.767.706.298.191.63.339.995.443.365.104.749.156 1.151.156.437 0 .86-.064 1.272-.193.41-.13.778-.323 1.1-.581a2.8 2.8 0 00.775-.981c.193-.396.29-.864.29-1.405z' fill='%231EBC61' fill-rule='nonzero'/%3E%3C/g%3E%3C/svg%3E");width:1.8em;height:1.8em;margin-left:1em}.ck-inspector .ck-inspector-navbox__navigation__toggle{margin-right:1em}.ck-inspector .ck-inspector-navbox__navigation__toggle.ck-inspector-navbox__navigation__toggle_up{transform:rotate(180deg)}.ck-inspector .ck-inspector-editor-selector{margin-left:auto;margin-right:.3em}@media screen and (max-width:680px){.ck-inspector .ck-inspector-editor-selector label{display:none}}.ck-inspector .ck-inspector-editor-selector select{margin-left:.5em}.ck-inspector .ck-inspector-code,.ck-inspector .ck-inspector-code *{font-size:var(--ck-inspector-code-font-size);font-family:var(--ck-inspector-code-font-family);cursor:default}.ck-inspector a{color:var(--ck-inspector-color-link);text-decoration:none}.ck-inspector a:hover{text-decoration:underline;cursor:pointer}.ck-inspector button{outline:0}.ck-inspector .ck-inspector-separator{border-right:1px solid var(--ck-inspector-color-border);display:inline-block;width:0;height:20px;margin:0 .5em;vertical-align:middle}`, ""]);
      }, function(g, i, u) {
        var c = u(49), o = { childContextTypes: !0, contextType: !0, contextTypes: !0, defaultProps: !0, displayName: !0, getDefaultProps: !0, getDerivedStateFromError: !0, getDerivedStateFromProps: !0, mixins: !0, propTypes: !0, type: !0 }, _ = { name: !0, length: !0, prototype: !0, caller: !0, callee: !0, arguments: !0, arity: !0 }, m = { $$typeof: !0, compare: !0, defaultProps: !0, displayName: !0, propTypes: !0, type: !0 }, b = {};
        function v(j) {
          return c.isMemo(j) ? m : b[j.$$typeof] || o;
        }
        b[c.ForwardRef] = { $$typeof: !0, render: !0, defaultProps: !0, displayName: !0, propTypes: !0 }, b[c.Memo] = m;
        var y = Object.defineProperty, C = Object.getOwnPropertyNames, x = Object.getOwnPropertySymbols, N = Object.getOwnPropertyDescriptor, G = Object.getPrototypeOf, K = Object.prototype;
        g.exports = function j(B, P, I) {
          if (typeof P != "string") {
            if (K) {
              var V = G(P);
              V && V !== K && j(B, V, I);
            }
            var R = C(P);
            x && (R = R.concat(x(P)));
            for (var oe = v(B), Q = v(P), z = 0; z < R.length; ++z) {
              var M = R[z];
              if (!(_[M] || I && I[M] || Q && Q[M] || oe && oe[M])) {
                var se = N(P, M);
                try {
                  y(B, M, se);
                } catch {
                }
              }
            }
          }
          return B;
        };
      }, function(g, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.getBoundPosition = function(m, b, v) {
          if (!m.props.bounds) return [b, v];
          var y = m.props.bounds;
          y = typeof y == "string" ? y : function(B) {
            return { left: B.left, top: B.top, right: B.right, bottom: B.bottom };
          }(y);
          var C = _(m);
          if (typeof y == "string") {
            var x, N = C.ownerDocument, G = N.defaultView;
            if (!((x = y === "parent" ? C.parentNode : N.querySelector(y)) instanceof G.HTMLElement)) throw new Error('Bounds selector "' + y + '" could not find an element.');
            var K = G.getComputedStyle(C), j = G.getComputedStyle(x);
            y = { left: -C.offsetLeft + (0, c.int)(j.paddingLeft) + (0, c.int)(K.marginLeft), top: -C.offsetTop + (0, c.int)(j.paddingTop) + (0, c.int)(K.marginTop), right: (0, o.innerWidth)(x) - (0, o.outerWidth)(C) - C.offsetLeft + (0, c.int)(j.paddingRight) - (0, c.int)(K.marginRight), bottom: (0, o.innerHeight)(x) - (0, o.outerHeight)(C) - C.offsetTop + (0, c.int)(j.paddingBottom) - (0, c.int)(K.marginBottom) };
          }
          return (0, c.isNum)(y.right) && (b = Math.min(b, y.right)), (0, c.isNum)(y.bottom) && (v = Math.min(v, y.bottom)), (0, c.isNum)(y.left) && (b = Math.max(b, y.left)), (0, c.isNum)(y.top) && (v = Math.max(v, y.top)), [b, v];
        }, i.snapToGrid = function(m, b, v) {
          var y = Math.round(b / m[0]) * m[0], C = Math.round(v / m[1]) * m[1];
          return [y, C];
        }, i.canDragX = function(m) {
          return m.props.axis === "both" || m.props.axis === "x";
        }, i.canDragY = function(m) {
          return m.props.axis === "both" || m.props.axis === "y";
        }, i.getControlPosition = function(m, b, v) {
          var y = typeof b == "number" ? (0, o.getTouch)(m, b) : null;
          if (typeof b == "number" && !y) return null;
          var C = _(v), x = v.props.offsetParent || C.offsetParent || C.ownerDocument.body;
          return (0, o.offsetXYFromParent)(y || m, x, v.props.scale);
        }, i.createCoreData = function(m, b, v) {
          var y = m.state, C = !(0, c.isNum)(y.lastX), x = _(m);
          return C ? { node: x, deltaX: 0, deltaY: 0, lastX: b, lastY: v, x: b, y: v } : { node: x, deltaX: b - y.lastX, deltaY: v - y.lastY, lastX: y.lastX, lastY: y.lastY, x: b, y: v };
        }, i.createDraggableData = function(m, b) {
          var v = m.props.scale;
          return { node: b.node, x: m.state.x + b.deltaX / v, y: m.state.y + b.deltaY / v, deltaX: b.deltaX / v, deltaY: b.deltaY / v, lastX: m.state.x, lastY: m.state.y };
        };
        var c = u(20), o = u(32);
        function _(m) {
          var b = m.findDOMNode();
          if (!b) throw new Error("<DraggableCore>: Unmounted during event!");
          return b;
        }
      }, function(g, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.default = function() {
        };
      }, function(g, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.default = function b(v) {
          return [].slice.call(v.querySelectorAll("*"), 0).reduce(function(y, C) {
            return y.concat(C.shadowRoot ? b(C.shadowRoot) : [C]);
          }, []).filter(m);
        };
        var c = /input|select|textarea|button|object|iframe/;
        function o(b) {
          var v = b.offsetWidth <= 0 && b.offsetHeight <= 0;
          if (v && !b.innerHTML) return !0;
          try {
            var y = window.getComputedStyle(b);
            return v ? y.getPropertyValue("overflow") !== "visible" || b.scrollWidth <= 0 && b.scrollHeight <= 0 : y.getPropertyValue("display") == "none";
          } catch {
            return console.warn("Failed to inspect element style"), !1;
          }
        }
        function _(b, v) {
          var y = b.nodeName.toLowerCase();
          return (c.test(y) && !b.disabled || y === "a" && b.href || v) && function(C) {
            for (var x = C, N = C.getRootNode && C.getRootNode(); x && x !== document.body; ) {
              if (N && x === N && (x = N.host.parentNode), o(x)) return !1;
              x = x.parentNode;
            }
            return !0;
          }(b);
        }
        function m(b) {
          var v = b.getAttribute("tabindex");
          v === null && (v = void 0);
          var y = isNaN(v);
          return (y || v >= 0) && _(b, !y);
        }
        g.exports = i.default;
      }, function(g, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.resetState = function() {
          b && (b.removeAttribute ? b.removeAttribute("aria-hidden") : b.length != null ? b.forEach(function(C) {
            return C.removeAttribute("aria-hidden");
          }) : document.querySelectorAll(b).forEach(function(C) {
            return C.removeAttribute("aria-hidden");
          })), b = null;
        }, i.log = function() {
        }, i.assertNodeList = v, i.setElement = function(C) {
          var x = C;
          if (typeof x == "string" && m.canUseDOM) {
            var N = document.querySelectorAll(x);
            v(N, x), x = N;
          }
          return b = x || b;
        }, i.validateElement = y, i.hide = function(C) {
          var x = !0, N = !1, G = void 0;
          try {
            for (var K, j = y(C)[Symbol.iterator](); !(x = (K = j.next()).done); x = !0)
              K.value.setAttribute("aria-hidden", "true");
          } catch (B) {
            N = !0, G = B;
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
            for (var K, j = y(C)[Symbol.iterator](); !(x = (K = j.next()).done); x = !0)
              K.value.removeAttribute("aria-hidden");
          } catch (B) {
            N = !0, G = B;
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
        var c, o = u(81), _ = (c = o) && c.__esModule ? c : { default: c }, m = u(36), b = null;
        function v(C, x) {
          if (!C || !C.length) throw new Error("react-modal: No elements were found for selector " + x + ".");
        }
        function y(C) {
          var x = C || b;
          return x ? Array.isArray(x) || x instanceof HTMLCollection || x instanceof NodeList ? x : [x] : ((0, _.default)(!1, ["react-modal: App element is not defined.", "Please use `Modal.setAppElement(el)` or set `appElement={el}`.", "This is needed so screen readers don't see main content", "when modal is opened. It is not recommended, but you can opt-out", "by setting `ariaHideApp={false}`."].join(" ")), []);
        }
      }, function(g, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.log = function() {
          console.log("portalOpenInstances ----------"), console.log(o.openInstances.length), o.openInstances.forEach(function(_) {
            return console.log(_);
          }), console.log("end portalOpenInstances ----------");
        }, i.resetState = function() {
          o = new c();
        };
        var c = function _() {
          var m = this;
          (function(b, v) {
            if (!(b instanceof v)) throw new TypeError("Cannot call a class as a function");
          })(this, _), this.register = function(b) {
            m.openInstances.indexOf(b) === -1 && (m.openInstances.push(b), m.emit("register"));
          }, this.deregister = function(b) {
            var v = m.openInstances.indexOf(b);
            v !== -1 && (m.openInstances.splice(v, 1), m.emit("deregister"));
          }, this.subscribe = function(b) {
            m.subscribers.push(b);
          }, this.emit = function(b) {
            m.subscribers.forEach(function(v) {
              return v(b, m.openInstances.slice());
            });
          }, this.openInstances = [], this.subscribers = [];
        }, o = new c();
        i.default = o;
      }, function(g, i, u) {
        g.exports = u(51);
      }, function(g, i, u) {
        var c = u(52), o = c.default, _ = c.DraggableCore;
        g.exports = o, g.exports.default = o, g.exports.DraggableCore = _;
      }, function(g, i, u) {
        var c = u(76), o = { "text/plain": "Text", "text/html": "Url", default: "Text" };
        g.exports = function(_, m) {
          var b, v, y, C, x, N, G = !1;
          m || (m = {}), b = m.debug || !1;
          try {
            if (y = c(), C = document.createRange(), x = document.getSelection(), (N = document.createElement("span")).textContent = _, N.style.all = "unset", N.style.position = "fixed", N.style.top = 0, N.style.clip = "rect(0, 0, 0, 0)", N.style.whiteSpace = "pre", N.style.webkitUserSelect = "text", N.style.MozUserSelect = "text", N.style.msUserSelect = "text", N.style.userSelect = "text", N.addEventListener("copy", function(K) {
              if (K.stopPropagation(), m.format) if (K.preventDefault(), K.clipboardData === void 0) {
                b && console.warn("unable to use e.clipboardData"), b && console.warn("trying IE specific stuff"), window.clipboardData.clearData();
                var j = o[m.format] || o.default;
                window.clipboardData.setData(j, _);
              } else K.clipboardData.clearData(), K.clipboardData.setData(m.format, _);
              m.onCopy && (K.preventDefault(), m.onCopy(K.clipboardData));
            }), document.body.appendChild(N), C.selectNodeContents(N), x.addRange(C), !document.execCommand("copy")) throw new Error("copy command was unsuccessful");
            G = !0;
          } catch (K) {
            b && console.error("unable to copy using execCommand: ", K), b && console.warn("trying IE specific stuff");
            try {
              window.clipboardData.setData(m.format || "text", _), m.onCopy && m.onCopy(window.clipboardData), G = !0;
            } catch (j) {
              b && console.error("unable to copy using clipboardData: ", j), b && console.error("falling back to prompt"), v = function(B) {
                var P = (/mac os x/i.test(navigator.userAgent) ? "⌘" : "Ctrl") + "+C";
                return B.replace(/#{\s*key\s*}/g, P);
              }("message" in m ? m.message : "Copy to clipboard: #{key}, Enter"), window.prompt(v, _);
            }
          } finally {
            x && (typeof x.removeRange == "function" ? x.removeRange(C) : x.removeAllRanges()), N && document.body.removeChild(N), y();
          }
          return G;
        };
      }, function(g, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 });
        var c, o = u(77), _ = (c = o) && c.__esModule ? c : { default: c };
        i.default = _.default, g.exports = i.default;
      }, function(g, i, u) {
        g.exports = u(50);
      }, function(g, i, u) {
        var c = typeof Symbol == "function" && Symbol.for, o = c ? Symbol.for("react.element") : 60103, _ = c ? Symbol.for("react.portal") : 60106, m = c ? Symbol.for("react.fragment") : 60107, b = c ? Symbol.for("react.strict_mode") : 60108, v = c ? Symbol.for("react.profiler") : 60114, y = c ? Symbol.for("react.provider") : 60109, C = c ? Symbol.for("react.context") : 60110, x = c ? Symbol.for("react.async_mode") : 60111, N = c ? Symbol.for("react.concurrent_mode") : 60111, G = c ? Symbol.for("react.forward_ref") : 60112, K = c ? Symbol.for("react.suspense") : 60113, j = c ? Symbol.for("react.suspense_list") : 60120, B = c ? Symbol.for("react.memo") : 60115, P = c ? Symbol.for("react.lazy") : 60116, I = c ? Symbol.for("react.block") : 60121, V = c ? Symbol.for("react.fundamental") : 60117, R = c ? Symbol.for("react.responder") : 60118, oe = c ? Symbol.for("react.scope") : 60119;
        function Q(M) {
          if (typeof M == "object" && M !== null) {
            var se = M.$$typeof;
            switch (se) {
              case o:
                switch (M = M.type) {
                  case x:
                  case N:
                  case m:
                  case v:
                  case b:
                  case K:
                    return M;
                  default:
                    switch (M = M && M.$$typeof) {
                      case C:
                      case G:
                      case P:
                      case B:
                      case y:
                        return M;
                      default:
                        return se;
                    }
                }
              case _:
                return se;
            }
          }
        }
        function z(M) {
          return Q(M) === N;
        }
        i.AsyncMode = x, i.ConcurrentMode = N, i.ContextConsumer = C, i.ContextProvider = y, i.Element = o, i.ForwardRef = G, i.Fragment = m, i.Lazy = P, i.Memo = B, i.Portal = _, i.Profiler = v, i.StrictMode = b, i.Suspense = K, i.isAsyncMode = function(M) {
          return z(M) || Q(M) === x;
        }, i.isConcurrentMode = z, i.isContextConsumer = function(M) {
          return Q(M) === C;
        }, i.isContextProvider = function(M) {
          return Q(M) === y;
        }, i.isElement = function(M) {
          return typeof M == "object" && M !== null && M.$$typeof === o;
        }, i.isForwardRef = function(M) {
          return Q(M) === G;
        }, i.isFragment = function(M) {
          return Q(M) === m;
        }, i.isLazy = function(M) {
          return Q(M) === P;
        }, i.isMemo = function(M) {
          return Q(M) === B;
        }, i.isPortal = function(M) {
          return Q(M) === _;
        }, i.isProfiler = function(M) {
          return Q(M) === v;
        }, i.isStrictMode = function(M) {
          return Q(M) === b;
        }, i.isSuspense = function(M) {
          return Q(M) === K;
        }, i.isValidElementType = function(M) {
          return typeof M == "string" || typeof M == "function" || M === m || M === N || M === v || M === b || M === K || M === j || typeof M == "object" && M !== null && (M.$$typeof === P || M.$$typeof === B || M.$$typeof === y || M.$$typeof === C || M.$$typeof === G || M.$$typeof === V || M.$$typeof === R || M.$$typeof === oe || M.$$typeof === I);
        }, i.typeOf = Q;
      }, function(g, i, u) {
        var c = 60103, o = 60106, _ = 60107, m = 60108, b = 60114, v = 60109, y = 60110, C = 60112, x = 60113, N = 60120, G = 60115, K = 60116, j = 60121, B = 60122, P = 60117, I = 60129, V = 60131;
        if (typeof Symbol == "function" && Symbol.for) {
          var R = Symbol.for;
          c = R("react.element"), o = R("react.portal"), _ = R("react.fragment"), m = R("react.strict_mode"), b = R("react.profiler"), v = R("react.provider"), y = R("react.context"), C = R("react.forward_ref"), x = R("react.suspense"), N = R("react.suspense_list"), G = R("react.memo"), K = R("react.lazy"), j = R("react.block"), B = R("react.server.block"), P = R("react.fundamental"), I = R("react.debug_trace_mode"), V = R("react.legacy_hidden");
        }
        function oe(D) {
          if (typeof D == "object" && D !== null) {
            var ie = D.$$typeof;
            switch (ie) {
              case c:
                switch (D = D.type) {
                  case _:
                  case b:
                  case m:
                  case x:
                  case N:
                    return D;
                  default:
                    switch (D = D && D.$$typeof) {
                      case y:
                      case C:
                      case K:
                      case G:
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
        var Q = v, z = c, M = C, se = _, le = K, te = G, ce = o, ye = b, J = m, de = x;
        i.ContextConsumer = y, i.ContextProvider = Q, i.Element = z, i.ForwardRef = M, i.Fragment = se, i.Lazy = le, i.Memo = te, i.Portal = ce, i.Profiler = ye, i.StrictMode = J, i.Suspense = de, i.isAsyncMode = function() {
          return !1;
        }, i.isConcurrentMode = function() {
          return !1;
        }, i.isContextConsumer = function(D) {
          return oe(D) === y;
        }, i.isContextProvider = function(D) {
          return oe(D) === v;
        }, i.isElement = function(D) {
          return typeof D == "object" && D !== null && D.$$typeof === c;
        }, i.isForwardRef = function(D) {
          return oe(D) === C;
        }, i.isFragment = function(D) {
          return oe(D) === _;
        }, i.isLazy = function(D) {
          return oe(D) === K;
        }, i.isMemo = function(D) {
          return oe(D) === G;
        }, i.isPortal = function(D) {
          return oe(D) === o;
        }, i.isProfiler = function(D) {
          return oe(D) === b;
        }, i.isStrictMode = function(D) {
          return oe(D) === m;
        }, i.isSuspense = function(D) {
          return oe(D) === x;
        }, i.isValidElementType = function(D) {
          return typeof D == "string" || typeof D == "function" || D === _ || D === b || D === I || D === m || D === x || D === N || D === V || typeof D == "object" && D !== null && (D.$$typeof === K || D.$$typeof === G || D.$$typeof === v || D.$$typeof === y || D.$$typeof === C || D.$$typeof === P || D.$$typeof === j || D[0] === B);
        }, i.typeOf = oe;
      }, function(g, i, u) {
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
        }(u(0)), o = N(u(18)), _ = N(u(12)), m = N(u(55)), b = u(32), v = u(40), y = u(20), C = N(u(57)), x = N(u(41));
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
        function B(J, de) {
          if (J == null) return {};
          var D, ie, be = function(we, Pe) {
            if (we == null) return {};
            var Se, ze, Je = {}, X = Object.keys(we);
            for (ze = 0; ze < X.length; ze++) Se = X[ze], Pe.indexOf(Se) >= 0 || (Je[Se] = we[Se]);
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
              var be = [], Te = !0, we = !1, Pe = void 0;
              try {
                for (var Se, ze = D[Symbol.iterator](); !(Te = (Se = ze.next()).done) && (be.push(Se.value), !ie || be.length !== ie); Te = !0) ;
              } catch (Je) {
                we = !0, Pe = Je;
              } finally {
                try {
                  Te || ze.return == null || ze.return();
                } finally {
                  if (we) throw Pe;
                }
              }
              return be;
            }
          }(J, de) || function(D, ie) {
            if (D) {
              if (typeof D == "string") return I(D, ie);
              var be = Object.prototype.toString.call(D).slice(8, -1);
              if (be === "Object" && D.constructor && (be = D.constructor.name), be === "Map" || be === "Set") return Array.from(D);
              if (be === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(be)) return I(D, ie);
            }
          }(J, de) || function() {
            throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
          }();
        }
        function I(J, de) {
          (de == null || de > J.length) && (de = J.length);
          for (var D = 0, ie = new Array(de); D < de; D++) ie[D] = J[D];
          return ie;
        }
        function V(J, de) {
          var D = Object.keys(J);
          if (Object.getOwnPropertySymbols) {
            var ie = Object.getOwnPropertySymbols(J);
            de && (ie = ie.filter(function(be) {
              return Object.getOwnPropertyDescriptor(J, be).enumerable;
            })), D.push.apply(D, ie);
          }
          return D;
        }
        function R(J) {
          for (var de = 1; de < arguments.length; de++) {
            var D = arguments[de] != null ? arguments[de] : {};
            de % 2 ? V(Object(D), !0).forEach(function(ie) {
              ce(J, ie, D[ie]);
            }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(J, Object.getOwnPropertyDescriptors(D)) : V(Object(D)).forEach(function(ie) {
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
        function M(J) {
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
          var de = M(D);
          function D(ie) {
            var be;
            return function(Te, we) {
              if (!(Te instanceof we)) throw new TypeError("Cannot call a class as a function");
            }(this, D), ce(le(be = de.call(this, ie)), "onDragStart", function(Te, we) {
              if ((0, x.default)("Draggable: onDragStart: %j", we), be.props.onStart(Te, (0, v.createDraggableData)(le(be), we)) === !1) return !1;
              be.setState({ dragging: !0, dragged: !0 });
            }), ce(le(be), "onDrag", function(Te, we) {
              if (!be.state.dragging) return !1;
              (0, x.default)("Draggable: onDrag: %j", we);
              var Pe = (0, v.createDraggableData)(le(be), we), Se = { x: Pe.x, y: Pe.y };
              if (be.props.bounds) {
                var ze = Se.x, Je = Se.y;
                Se.x += be.state.slackX, Se.y += be.state.slackY;
                var X = P((0, v.getBoundPosition)(le(be), Se.x, Se.y), 2), Y = X[0], me = X[1];
                Se.x = Y, Se.y = me, Se.slackX = be.state.slackX + (ze - Se.x), Se.slackY = be.state.slackY + (Je - Se.y), Pe.x = Se.x, Pe.y = Se.y, Pe.deltaX = Se.x - be.state.x, Pe.deltaY = Se.y - be.state.y;
              }
              if (be.props.onDrag(Te, Pe) === !1) return !1;
              be.setState(Se);
            }), ce(le(be), "onDragStop", function(Te, we) {
              if (!be.state.dragging || be.props.onStop(Te, (0, v.createDraggableData)(le(be), we)) === !1) return !1;
              (0, x.default)("Draggable: onDragStop: %j", we);
              var Pe = { dragging: !1, slackX: 0, slackY: 0 };
              if (be.props.position) {
                var Se = be.props.position, ze = Se.x, Je = Se.y;
                Pe.x = ze, Pe.y = Je;
              }
              be.setState(Pe);
            }), be.state = { dragging: !1, dragged: !1, x: ie.position ? ie.position.x : ie.defaultPosition.x, y: ie.position ? ie.position.y : ie.defaultPosition.y, prevPropsPosition: R({}, ie.position), slackX: 0, slackY: 0, isElementSVG: !1 }, !ie.position || ie.onDrag || ie.onStop || console.warn("A `position` was applied to this <Draggable>, without drag handlers. This will make this component effectively undraggable. Please attach `onDrag` or `onStop` handlers so you can adjust the `position` of this element."), be;
          }
          return Q(D, null, [{ key: "getDerivedStateFromProps", value: function(ie, be) {
            var Te = ie.position, we = be.prevPropsPosition;
            return !Te || we && Te.x === we.x && Te.y === we.y ? null : ((0, x.default)("Draggable: getDerivedStateFromProps %j", { position: Te, prevPropsPosition: we }), { x: Te.x, y: Te.y, prevPropsPosition: R({}, Te) });
          } }]), Q(D, [{ key: "componentDidMount", value: function() {
            window.SVGElement !== void 0 && this.findDOMNode() instanceof window.SVGElement && this.setState({ isElementSVG: !0 });
          } }, { key: "componentWillUnmount", value: function() {
            this.setState({ dragging: !1 });
          } }, { key: "findDOMNode", value: function() {
            return this.props.nodeRef ? this.props.nodeRef.current : _.default.findDOMNode(this);
          } }, { key: "render", value: function() {
            var ie, be = this.props, Te = (be.axis, be.bounds, be.children), we = be.defaultPosition, Pe = be.defaultClassName, Se = be.defaultClassNameDragging, ze = be.defaultClassNameDragged, Je = be.position, X = be.positionOffset, Y = (be.scale, B(be, ["axis", "bounds", "children", "defaultPosition", "defaultClassName", "defaultClassNameDragging", "defaultClassNameDragged", "position", "positionOffset", "scale"])), me = {}, l = null, f = !Je || this.state.dragging, w = Je || we, U = { x: (0, v.canDragX)(this) && f ? this.state.x : w.x, y: (0, v.canDragY)(this) && f ? this.state.y : w.y };
            this.state.isElementSVG ? l = (0, b.createSVGTransform)(U, X) : me = (0, b.createCSSTransform)(U, X);
            var F = (0, m.default)(Te.props.className || "", Pe, (ce(ie = {}, Se, this.state.dragging), ce(ie, ze, this.state.dragged), ie));
            return c.createElement(C.default, j({}, Y, { onStart: this.onDragStart, onDrag: this.onDrag, onStop: this.onDragStop }), c.cloneElement(c.Children.only(Te), { className: F, style: R(R({}, Te.props.style), me), transform: l }));
          } }]), D;
        }(c.Component);
        i.default = ye, ce(ye, "displayName", "Draggable"), ce(ye, "propTypes", R(R({}, C.default.propTypes), {}, { axis: o.default.oneOf(["both", "x", "y", "none"]), bounds: o.default.oneOfType([o.default.shape({ left: o.default.number, right: o.default.number, top: o.default.number, bottom: o.default.number }), o.default.string, o.default.oneOf([!1])]), defaultClassName: o.default.string, defaultClassNameDragging: o.default.string, defaultClassNameDragged: o.default.string, defaultPosition: o.default.shape({ x: o.default.number, y: o.default.number }), positionOffset: o.default.shape({ x: o.default.oneOfType([o.default.number, o.default.string]), y: o.default.oneOfType([o.default.number, o.default.string]) }), position: o.default.shape({ x: o.default.number, y: o.default.number }), className: y.dontSetMe, style: y.dontSetMe, transform: y.dontSetMe })), ce(ye, "defaultProps", R(R({}, C.default.defaultProps), {}, { axis: "both", bounds: !1, defaultClassName: "react-draggable", defaultClassNameDragging: "react-draggable-dragging", defaultClassNameDragged: "react-draggable-dragged", defaultPosition: { x: 0, y: 0 }, position: null, scale: 1 }));
      }, function(g, i, u) {
        var c = u(54);
        function o() {
        }
        function _() {
        }
        _.resetWarningCache = o, g.exports = function() {
          function m(y, C, x, N, G, K) {
            if (K !== c) {
              var j = new Error("Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types");
              throw j.name = "Invariant Violation", j;
            }
          }
          function b() {
            return m;
          }
          m.isRequired = m;
          var v = { array: m, bigint: m, bool: m, func: m, number: m, object: m, string: m, symbol: m, any: m, arrayOf: b, element: m, elementType: m, instanceOf: b, node: m, objectOf: b, oneOf: b, oneOfType: b, shape: b, exact: b, checkPropTypes: _, resetWarningCache: o };
          return v.PropTypes = v, v;
        };
      }, function(g, i, u) {
        g.exports = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
      }, function(g, i, u) {
        var c;
        (function() {
          var o = {}.hasOwnProperty;
          function _() {
            for (var m = [], b = 0; b < arguments.length; b++) {
              var v = arguments[b];
              if (v) {
                var y = typeof v;
                if (y === "string" || y === "number") m.push(v);
                else if (Array.isArray(v)) {
                  if (v.length) {
                    var C = _.apply(null, v);
                    C && m.push(C);
                  }
                } else if (y === "object") if (v.toString === Object.prototype.toString) for (var x in v) o.call(v, x) && v[x] && m.push(x);
                else m.push(v.toString());
              }
            }
            return m.join(" ");
          }
          g.exports ? (_.default = _, g.exports = _) : (c = (function() {
            return _;
          }).apply(i, [])) === void 0 || (g.exports = c);
        })();
      }, function(g, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.getPrefix = o, i.browserPrefixToKey = _, i.browserPrefixToStyle = function(b, v) {
          return v ? "-".concat(v.toLowerCase(), "-").concat(b) : b;
        }, i.default = void 0;
        var c = ["Moz", "Webkit", "O", "ms"];
        function o() {
          var b = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "transform";
          if (typeof window > "u" || window.document === void 0) return "";
          var v = window.document.documentElement.style;
          if (b in v) return "";
          for (var y = 0; y < c.length; y++) if (_(b, c[y]) in v) return c[y];
          return "";
        }
        function _(b, v) {
          return v ? "".concat(v).concat(function(y) {
            for (var C = "", x = !0, N = 0; N < y.length; N++) x ? (C += y[N].toUpperCase(), x = !1) : y[N] === "-" ? x = !0 : C += y[N];
            return C;
          }(b)) : b;
        }
        var m = o();
        i.default = m;
      }, function(g, i, u) {
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
        }(u(0)), o = C(u(18)), _ = C(u(12)), m = u(32), b = u(40), v = u(20), y = C(u(41));
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
                for (var Te, we = ye[Symbol.iterator](); !(D = (Te = we.next()).done) && (de.push(Te.value), !J || de.length !== J); D = !0) ;
              } catch (Pe) {
                ie = !0, be = Pe;
              } finally {
                try {
                  D || we.return == null || we.return();
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
        function B(te, ce) {
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
        function I(te) {
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
            return V(this, ye);
          };
        }
        function V(te, ce) {
          return !ce || N(ce) !== "object" && typeof ce != "function" ? R(te) : ce;
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
        var z = { start: "touchstart", move: "touchmove", stop: "touchend" }, M = { start: "mousedown", move: "mousemove", stop: "mouseup" }, se = M, le = function(te) {
          (function(D, ie) {
            if (typeof ie != "function" && ie !== null) throw new TypeError("Super expression must either be null or a function");
            D.prototype = Object.create(ie && ie.prototype, { constructor: { value: D, writable: !0, configurable: !0 } }), ie && P(D, ie);
          })(de, te);
          var ce, ye, J = I(de);
          function de() {
            var D;
            j(this, de);
            for (var ie = arguments.length, be = new Array(ie), Te = 0; Te < ie; Te++) be[Te] = arguments[Te];
            return Q(R(D = J.call.apply(J, [this].concat(be))), "state", { dragging: !1, lastX: NaN, lastY: NaN, touchIdentifier: null }), Q(R(D), "mounted", !1), Q(R(D), "handleDragStart", function(we) {
              if (D.props.onMouseDown(we), !D.props.allowAnyClick && typeof we.button == "number" && we.button !== 0) return !1;
              var Pe = D.findDOMNode();
              if (!Pe || !Pe.ownerDocument || !Pe.ownerDocument.body) throw new Error("<DraggableCore> not mounted on DragStart!");
              var Se = Pe.ownerDocument;
              if (!(D.props.disabled || !(we.target instanceof Se.defaultView.Node) || D.props.handle && !(0, m.matchesSelectorAndParentsTo)(we.target, D.props.handle, Pe) || D.props.cancel && (0, m.matchesSelectorAndParentsTo)(we.target, D.props.cancel, Pe))) {
                we.type === "touchstart" && we.preventDefault();
                var ze = (0, m.getTouchIdentifier)(we);
                D.setState({ touchIdentifier: ze });
                var Je = (0, b.getControlPosition)(we, ze, R(D));
                if (Je != null) {
                  var X = Je.x, Y = Je.y, me = (0, b.createCoreData)(R(D), X, Y);
                  (0, y.default)("DraggableCore: handleDragStart: %j", me), (0, y.default)("calling", D.props.onStart), D.props.onStart(we, me) !== !1 && D.mounted !== !1 && (D.props.enableUserSelectHack && (0, m.addUserSelectStyles)(Se), D.setState({ dragging: !0, lastX: X, lastY: Y }), (0, m.addEvent)(Se, se.move, D.handleDrag), (0, m.addEvent)(Se, se.stop, D.handleDragStop));
                }
              }
            }), Q(R(D), "handleDrag", function(we) {
              var Pe = (0, b.getControlPosition)(we, D.state.touchIdentifier, R(D));
              if (Pe != null) {
                var Se = Pe.x, ze = Pe.y;
                if (Array.isArray(D.props.grid)) {
                  var Je = Se - D.state.lastX, X = ze - D.state.lastY, Y = G((0, b.snapToGrid)(D.props.grid, Je, X), 2);
                  if (Je = Y[0], X = Y[1], !Je && !X) return;
                  Se = D.state.lastX + Je, ze = D.state.lastY + X;
                }
                var me = (0, b.createCoreData)(R(D), Se, ze);
                if ((0, y.default)("DraggableCore: handleDrag: %j", me), D.props.onDrag(we, me) !== !1 && D.mounted !== !1) D.setState({ lastX: Se, lastY: ze });
                else try {
                  D.handleDragStop(new MouseEvent("mouseup"));
                } catch {
                  var l = document.createEvent("MouseEvents");
                  l.initMouseEvent("mouseup", !0, !0, window, 0, 0, 0, 0, 0, !1, !1, !1, !1, 0, null), D.handleDragStop(l);
                }
              }
            }), Q(R(D), "handleDragStop", function(we) {
              if (D.state.dragging) {
                var Pe = (0, b.getControlPosition)(we, D.state.touchIdentifier, R(D));
                if (Pe != null) {
                  var Se = Pe.x, ze = Pe.y, Je = (0, b.createCoreData)(R(D), Se, ze);
                  if (D.props.onStop(we, Je) === !1 || D.mounted === !1) return !1;
                  var X = D.findDOMNode();
                  X && D.props.enableUserSelectHack && (0, m.removeUserSelectStyles)(X.ownerDocument), (0, y.default)("DraggableCore: handleDragStop: %j", Je), D.setState({ dragging: !1, lastX: NaN, lastY: NaN }), X && ((0, y.default)("DraggableCore: Removing handlers"), (0, m.removeEvent)(X.ownerDocument, se.move, D.handleDrag), (0, m.removeEvent)(X.ownerDocument, se.stop, D.handleDragStop));
                }
              }
            }), Q(R(D), "onMouseDown", function(we) {
              return se = M, D.handleDragStart(we);
            }), Q(R(D), "onMouseUp", function(we) {
              return se = M, D.handleDragStop(we);
            }), Q(R(D), "onTouchStart", function(we) {
              return se = z, D.handleDragStart(we);
            }), Q(R(D), "onTouchEnd", function(we) {
              return se = z, D.handleDragStop(we);
            }), D;
          }
          return ce = de, (ye = [{ key: "componentDidMount", value: function() {
            this.mounted = !0;
            var D = this.findDOMNode();
            D && (0, m.addEvent)(D, z.start, this.onTouchStart, { passive: !1 });
          } }, { key: "componentWillUnmount", value: function() {
            this.mounted = !1;
            var D = this.findDOMNode();
            if (D) {
              var ie = D.ownerDocument;
              (0, m.removeEvent)(ie, M.move, this.handleDrag), (0, m.removeEvent)(ie, z.move, this.handleDrag), (0, m.removeEvent)(ie, M.stop, this.handleDragStop), (0, m.removeEvent)(ie, z.stop, this.handleDragStop), (0, m.removeEvent)(D, z.start, this.onTouchStart, { passive: !1 }), this.props.enableUserSelectHack && (0, m.removeUserSelectStyles)(ie);
            }
          } }, { key: "findDOMNode", value: function() {
            return this.props.nodeRef ? this.props.nodeRef.current : _.default.findDOMNode(this);
          } }, { key: "render", value: function() {
            return c.cloneElement(c.Children.only(this.props.children), { onMouseDown: this.onMouseDown, onMouseUp: this.onMouseUp, onTouchEnd: this.onTouchEnd });
          } }]) && B(ce.prototype, ye), de;
        }(c.Component);
        i.default = le, Q(le, "displayName", "DraggableCore"), Q(le, "propTypes", { allowAnyClick: o.default.bool, disabled: o.default.bool, enableUserSelectHack: o.default.bool, offsetParent: function(te, ce) {
          if (te[ce] && te[ce].nodeType !== 1) throw new Error("Draggable's offsetParent must be a DOM Node.");
        }, grid: o.default.arrayOf(o.default.number), handle: o.default.string, cancel: o.default.string, nodeRef: o.default.object, onStart: o.default.func, onDrag: o.default.func, onStop: o.default.func, onMouseDown: o.default.func, scale: o.default.number, className: v.dontSetMe, style: v.dontSetMe, transform: v.dontSetMe }), Q(le, "defaultProps", { allowAnyClick: !1, cancel: null, disabled: !1, enableUserSelectHack: !0, offsetParent: null, handle: null, grid: null, transform: null, onStart: function() {
        }, onDrag: function() {
        }, onStop: function() {
        }, onMouseDown: function() {
        }, scale: 1 });
      }, function(g, i, u) {
        var c = u(6), o = u(59);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[g.i, o, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, _), g.exports = o.locals || {};
      }, function(g, i, u) {
        (g.exports = u(7)(!1)).push([g.i, ".ck-inspector{--ck-inspector-color-tab-background-hover:rgba(0,0,0,0.07);--ck-inspector-color-tab-active-border:#0dacef }.ck-inspector .ck-inspector-horizontal-nav{display:flex;flex-direction:row;user-select:none;align-self:stretch}.ck-inspector .ck-inspector-horizontal-nav .ck-inspector-horizontal-nav__item{-webkit-appearance:none;background:none;border:0;border-bottom:2px solid transparent;padding:.5em 1em;align-self:stretch}.ck-inspector .ck-inspector-horizontal-nav .ck-inspector-horizontal-nav__item:hover{background:var(--ck-inspector-color-tab-background-hover)}.ck-inspector .ck-inspector-horizontal-nav .ck-inspector-horizontal-nav__item.ck-inspector-horizontal-nav__item_active{border-bottom-color:var(--ck-inspector-color-tab-active-border)}", ""]);
      }, function(g, i, u) {
        var c = u(6), o = u(61);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[g.i, o, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, _), g.exports = o.locals || {};
      }, function(g, i, u) {
        (g.exports = u(7)(!1)).push([g.i, ".ck-inspector{--ck-inspector-navbox-empty-background:#fafafa}.ck-inspector .ck-inspector-navbox{display:flex;flex-direction:column;height:100%;align-items:stretch}.ck-inspector .ck-inspector-navbox .ck-inspector-navbox__navigation{display:flex;flex-direction:row;flex-wrap:nowrap;align-items:stretch;min-height:30px;max-height:30px;border-bottom:1px solid var(--ck-inspector-color-border);width:100%;user-select:none;align-items:center}.ck-inspector .ck-inspector-navbox .ck-inspector-navbox__content{display:flex;flex-direction:row;height:100%;overflow:hidden}", ""]);
      }, function(g, i, u) {
        var c = u(6), o = u(63);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[g.i, o, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, _), g.exports = o.locals || {};
      }, function(g, i, u) {
        (g.exports = u(7)(!1)).push([g.i, ".ck-inspector{--ck-inspector-icon-size:19px;--ck-inspector-button-size:calc(4px + var(--ck-inspector-icon-size));--ck-inspector-color-button:#777;--ck-inspector-color-button-hover:#222;--ck-inspector-color-button-on:#0f79e2}.ck-inspector .ck-inspector-button{width:var(--ck-inspector-button-size);height:var(--ck-inspector-button-size);border:0;overflow:hidden;border-radius:2px;padding:2px;color:var(--ck-inspector-color-button)}.ck-inspector .ck-inspector-button.ck-inspector-button_on,.ck-inspector .ck-inspector-button.ck-inspector-button_on:hover{color:var(--ck-inspector-color-button-on);opacity:1}.ck-inspector .ck-inspector-button.ck-inspector-button_disabled{opacity:.3}.ck-inspector .ck-inspector-button>span{display:none}.ck-inspector .ck-inspector-button:hover{color:var(--ck-inspector-color-button-hover)}.ck-inspector .ck-inspector-button svg{width:var(--ck-inspector-icon-size);height:var(--ck-inspector-icon-size)}.ck-inspector .ck-inspector-button svg,.ck-inspector .ck-inspector-button svg *{fill:currentColor}", ""]);
      }, function(g, i, u) {
        var c = u(6), o = u(65);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[g.i, o, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, _), g.exports = o.locals || {};
      }, function(g, i, u) {
        (g.exports = u(7)(!1)).push([g.i, ".ck-inspector{--ck-inspector-explorer-width:300px}.ck-inspector .ck-inspector-pane{display:flex;width:100%}.ck-inspector .ck-inspector-pane.ck-inspector-pane_empty{align-items:center;justify-content:center;padding:1em;background:var(--ck-inspector-navbox-empty-background)}.ck-inspector .ck-inspector-pane.ck-inspector-pane_empty p{align-self:center;width:100%;text-align:center}.ck-inspector .ck-inspector-pane>.ck-inspector-navbox:last-child{min-width:var(--ck-inspector-explorer-width);width:var(--ck-inspector-explorer-width)}.ck-inspector .ck-inspector-pane.ck-inspector-pane_vsplit>.ck-inspector-navbox:first-child{border-right:1px solid var(--ck-inspector-color-border);flex:1 1 auto;overflow:hidden}.ck-inspector .ck-inspector-pane.ck-inspector-pane_vsplit>.ck-inspector-navbox:first-child .ck-inspector-navbox__navigation{align-items:center}.ck-inspector .ck-inspector-pane.ck-inspector-pane_vsplit>.ck-inspector-navbox:first-child .ck-inspector-tree__config label{margin:0 .5em}.ck-inspector .ck-inspector-pane.ck-inspector-pane_vsplit>.ck-inspector-navbox:first-child .ck-inspector-tree__config input+label{margin-right:1em}", ""]);
      }, function(g, i, u) {
        var c = u(6), o = u(67);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[g.i, o, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, _), g.exports = o.locals || {};
      }, function(g, i, u) {
        (g.exports = u(7)(!1)).push([g.i, ".ck-inspector-side-pane{position:relative}", ""]);
      }, function(g, i, u) {
        var c = u(6), o = u(69);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[g.i, o, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, _), g.exports = o.locals || {};
      }, function(g, i, u) {
        (g.exports = u(7)(!1)).push([g.i, ".ck-inspector .ck-inspector-checkbox{vertical-align:middle}", ""]);
      }, function(g, i, u) {
        var c = u(6), o = u(71);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[g.i, o, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, _), g.exports = o.locals || {};
      }, function(g, i, u) {
        (g.exports = u(7)(!1)).push([g.i, '.ck-inspector{--ck-inspector-color-property-list-property-name:#d0363f;--ck-inspector-color-property-list-property-value-true:green;--ck-inspector-color-property-list-property-value-false:red;--ck-inspector-color-property-list-property-value-unknown:#888;--ck-inspector-color-property-list-background:#f5f5f5;--ck-inspector-color-property-list-title-collapser:#727272}.ck-inspector .ck-inspector-property-list{display:grid;grid-template-columns:auto 1fr;background:var(--ck-inspector-color-white)}.ck-inspector .ck-inspector-property-list>:nth-of-type(odd){background:var(--ck-inspector-color-property-list-background)}.ck-inspector .ck-inspector-property-list>:nth-of-type(2n){background:var(--ck-inspector-color-white)}.ck-inspector .ck-inspector-property-list dt{padding:0 .7em 0 1.2em;min-width:15em}.ck-inspector .ck-inspector-property-list dt.ck-inspector-property-list__title_collapsible button{display:inline-block;overflow:hidden;vertical-align:middle;margin-left:-9px;margin-right:.3em;width:0;height:0;border-left:6px solid var(--ck-inspector-color-property-list-title-collapser);border-bottom:3.5px solid transparent;border-right:0 solid transparent;border-top:3.5px solid transparent;transition:transform .2s ease-in-out;transform:rotate(0deg)}.ck-inspector .ck-inspector-property-list dt.ck-inspector-property-list__title_expanded button{transform:rotate(90deg)}.ck-inspector .ck-inspector-property-list dt.ck-inspector-property-list__title_collapsed+dd+.ck-inspector-property-list{display:none}.ck-inspector .ck-inspector-property-list dt .ck-inspector-property-list__title__color-box{width:12px;height:12px;vertical-align:text-top;display:inline-block;margin-right:3px;border-radius:2px;border:1px solid #000}.ck-inspector .ck-inspector-property-list dt.ck-inspector-property-list__title_clickable label:hover{text-decoration:underline;cursor:pointer}.ck-inspector .ck-inspector-property-list dt label{color:var(--ck-inspector-color-property-list-property-name)}.ck-inspector .ck-inspector-property-list dd{padding-right:.7em}.ck-inspector .ck-inspector-property-list dd input{width:100%}.ck-inspector .ck-inspector-property-list dd input[value=false]{color:var(--ck-inspector-color-property-list-property-value-false)}.ck-inspector .ck-inspector-property-list dd input[value=true]{color:var(--ck-inspector-color-property-list-property-value-true)}.ck-inspector .ck-inspector-property-list dd input[value="function() {…}"],.ck-inspector .ck-inspector-property-list dd input[value=undefined]{color:var(--ck-inspector-color-property-list-property-value-unknown)}.ck-inspector .ck-inspector-property-list dd input[value="function() {…}"]{font-style:italic}.ck-inspector .ck-inspector-property-list .ck-inspector-property-list{grid-column:1/-1;margin-left:1em;background:transparent}.ck-inspector .ck-inspector-property-list .ck-inspector-property-list>:nth-of-type(2n),.ck-inspector .ck-inspector-property-list .ck-inspector-property-list>:nth-of-type(odd){background:transparent}', ""]);
      }, function(g, i, u) {
        var c = u(6), o = u(73);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[g.i, o, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, _), g.exports = o.locals || {};
      }, function(g, i, u) {
        (g.exports = u(7)(!1)).push([g.i, `.ck-inspector .ck-inspector__object-inspector{width:100%;background:var(--ck-inspector-color-white);overflow:auto}.ck-inspector .ck-inspector__object-inspector h2,.ck-inspector .ck-inspector__object-inspector h3{display:flex;flex-direction:row;flex-wrap:nowrap}.ck-inspector .ck-inspector__object-inspector h2{display:flex;align-items:center;padding:1em;overflow:hidden;text-overflow:ellipsis}.ck-inspector .ck-inspector__object-inspector h2>span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;margin-right:auto}.ck-inspector .ck-inspector__object-inspector h2>.ck-inspector-button{flex-shrink:0;margin-left:.5em}.ck-inspector .ck-inspector__object-inspector h2 a{font-weight:700;color:var(--ck-inspector-color-tree-node-name)}.ck-inspector .ck-inspector__object-inspector h2 a,.ck-inspector .ck-inspector__object-inspector h2 a>*{cursor:pointer}.ck-inspector .ck-inspector__object-inspector h2 em:after,.ck-inspector .ck-inspector__object-inspector h2 em:before{content:'"'}.ck-inspector .ck-inspector__object-inspector h3{display:flex;align-items:center;font-size:12px;padding:.4em .7em}.ck-inspector .ck-inspector__object-inspector h3 a{color:inherit;font-weight:700;margin-right:auto}.ck-inspector .ck-inspector__object-inspector h3 .ck-inspector-button{visibility:hidden}.ck-inspector .ck-inspector__object-inspector h3:hover .ck-inspector-button{visibility:visible}.ck-inspector .ck-inspector__object-inspector hr{border-top:1px solid var(--ck-inspector-color-border)}`, ""]);
      }, function(g, i, u) {
        var c = u(6), o = u(75);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[g.i, o, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, _), g.exports = o.locals || {};
      }, function(g, i, u) {
        (g.exports = u(7)(!1)).push([g.i, ".ck-inspector-model-tree__hide-markers .ck-inspector-tree__position.ck-inspector-tree__position_marker{display:none}", ""]);
      }, function(g, i) {
        g.exports = function() {
          var u = document.getSelection();
          if (!u.rangeCount) return function() {
          };
          for (var c = document.activeElement, o = [], _ = 0; _ < u.rangeCount; _++) o.push(u.getRangeAt(_));
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
      }, function(g, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.bodyOpenClassName = i.portalClassName = void 0;
        var c = Object.assign || function(M) {
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
        }(), _ = u(0), m = K(_), b = K(u(12)), v = K(u(18)), y = K(u(78)), C = function(M) {
          if (M && M.__esModule) return M;
          var se = {};
          if (M != null) for (var le in M) Object.prototype.hasOwnProperty.call(M, le) && (se[le] = M[le]);
          return se.default = M, se;
        }(u(43)), x = u(36), N = K(x), G = u(85);
        function K(M) {
          return M && M.__esModule ? M : { default: M };
        }
        function j(M, se) {
          if (!(M instanceof se)) throw new TypeError("Cannot call a class as a function");
        }
        function B(M, se) {
          if (!M) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
          return !se || typeof se != "object" && typeof se != "function" ? M : se;
        }
        var P = i.portalClassName = "ReactModalPortal", I = i.bodyOpenClassName = "ReactModal__Body--open", V = x.canUseDOM && b.default.createPortal !== void 0, R = function(M) {
          return document.createElement(M);
        }, oe = function() {
          return V ? b.default.createPortal : b.default.unstable_renderSubtreeIntoContainer;
        };
        function Q(M) {
          return M();
        }
        var z = function(M) {
          function se() {
            var le, te, ce;
            j(this, se);
            for (var ye = arguments.length, J = Array(ye), de = 0; de < ye; de++) J[de] = arguments[de];
            return te = ce = B(this, (le = se.__proto__ || Object.getPrototypeOf(se)).call.apply(le, [this].concat(J))), ce.removePortal = function() {
              !V && b.default.unmountComponentAtNode(ce.node);
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
          }(se, M), o(se, [{ key: "componentDidMount", value: function() {
            x.canUseDOM && (V || (this.node = R("div")), this.node.className = this.props.portalClassName, Q(this.props.parentSelector).appendChild(this.node), !V && this.renderPortal(this.props));
          } }, { key: "getSnapshotBeforeUpdate", value: function(le) {
            return { prevParent: Q(le.parentSelector), nextParent: Q(this.props.parentSelector) };
          } }, { key: "componentDidUpdate", value: function(le, te, ce) {
            if (x.canUseDOM) {
              var ye = this.props, J = ye.isOpen, de = ye.portalClassName;
              le.portalClassName !== de && (this.node.className = de);
              var D = ce.prevParent, ie = ce.nextParent;
              ie !== D && (D.removeChild(this.node), ie.appendChild(this.node)), (le.isOpen || J) && !V && this.renderPortal(this.props);
            }
          } }, { key: "componentWillUnmount", value: function() {
            if (x.canUseDOM && this.node && this.portal) {
              var le = this.portal.state, te = Date.now(), ce = le.isOpen && this.props.closeTimeoutMS && (le.closesAt || te + this.props.closeTimeoutMS);
              ce ? (le.beforeClose || this.portal.closeWithTimeout(), setTimeout(this.removePortal, ce - te)) : this.removePortal();
            }
          } }, { key: "render", value: function() {
            return x.canUseDOM && V ? (!this.node && V && (this.node = R("div")), oe()(m.default.createElement(y.default, c({ ref: this.portalRef, defaultStyles: se.defaultStyles }, this.props)), this.node)) : null;
          } }], [{ key: "setAppElement", value: function(le) {
            C.setElement(le);
          } }]), se;
        }(_.Component);
        z.propTypes = { isOpen: v.default.bool.isRequired, style: v.default.shape({ content: v.default.object, overlay: v.default.object }), portalClassName: v.default.string, bodyOpenClassName: v.default.string, htmlOpenClassName: v.default.string, className: v.default.oneOfType([v.default.string, v.default.shape({ base: v.default.string.isRequired, afterOpen: v.default.string.isRequired, beforeClose: v.default.string.isRequired })]), overlayClassName: v.default.oneOfType([v.default.string, v.default.shape({ base: v.default.string.isRequired, afterOpen: v.default.string.isRequired, beforeClose: v.default.string.isRequired })]), appElement: v.default.oneOfType([v.default.instanceOf(N.default), v.default.instanceOf(x.SafeHTMLCollection), v.default.instanceOf(x.SafeNodeList), v.default.arrayOf(v.default.instanceOf(N.default))]), onAfterOpen: v.default.func, onRequestClose: v.default.func, closeTimeoutMS: v.default.number, ariaHideApp: v.default.bool, shouldFocusAfterRender: v.default.bool, shouldCloseOnOverlayClick: v.default.bool, shouldReturnFocusAfterClose: v.default.bool, preventScroll: v.default.bool, parentSelector: v.default.func, aria: v.default.object, data: v.default.object, role: v.default.string, contentLabel: v.default.string, shouldCloseOnEsc: v.default.bool, overlayRef: v.default.func, contentRef: v.default.func, id: v.default.string, overlayElement: v.default.func, contentElement: v.default.func }, z.defaultProps = { isOpen: !1, portalClassName: P, bodyOpenClassName: I, role: "dialog", ariaHideApp: !0, closeTimeoutMS: 0, shouldFocusAfterRender: !0, shouldCloseOnEsc: !0, shouldCloseOnOverlayClick: !0, shouldReturnFocusAfterClose: !0, preventScroll: !1, parentSelector: function() {
          return document.body;
        }, overlayElement: function(M, se) {
          return m.default.createElement("div", M, se);
        }, contentElement: function(M, se) {
          return m.default.createElement("div", M, se);
        } }, z.defaultStyles = { overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(255, 255, 255, 0.75)" }, content: { position: "absolute", top: "40px", left: "40px", right: "40px", bottom: "40px", border: "1px solid #ccc", background: "#fff", overflow: "auto", WebkitOverflowScrolling: "touch", borderRadius: "4px", outline: "none", padding: "20px" } }, (0, G.polyfill)(z), i.default = z;
      }, function(g, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 });
        var c = Object.assign || function(R) {
          for (var oe = 1; oe < arguments.length; oe++) {
            var Q = arguments[oe];
            for (var z in Q) Object.prototype.hasOwnProperty.call(Q, z) && (R[z] = Q[z]);
          }
          return R;
        }, o = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(R) {
          return typeof R;
        } : function(R) {
          return R && typeof Symbol == "function" && R.constructor === Symbol && R !== Symbol.prototype ? "symbol" : typeof R;
        }, _ = /* @__PURE__ */ function() {
          function R(oe, Q) {
            for (var z = 0; z < Q.length; z++) {
              var M = Q[z];
              M.enumerable = M.enumerable || !1, M.configurable = !0, "value" in M && (M.writable = !0), Object.defineProperty(oe, M.key, M);
            }
          }
          return function(oe, Q, z) {
            return Q && R(oe.prototype, Q), z && R(oe, z), oe;
          };
        }(), m = u(0), b = B(u(18)), v = j(u(79)), y = B(u(80)), C = j(u(43)), x = j(u(83)), N = u(36), G = B(N), K = B(u(44));
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
        var P = { overlay: "ReactModal__Overlay", content: "ReactModal__Content" }, I = 0, V = function(R) {
          function oe(Q) {
            (function(M, se) {
              if (!(M instanceof se)) throw new TypeError("Cannot call a class as a function");
            })(this, oe);
            var z = function(M, se) {
              if (!M) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
              return !se || typeof se != "object" && typeof se != "function" ? M : se;
            }(this, (oe.__proto__ || Object.getPrototypeOf(oe)).call(this, Q));
            return z.setOverlayRef = function(M) {
              z.overlay = M, z.props.overlayRef && z.props.overlayRef(M);
            }, z.setContentRef = function(M) {
              z.content = M, z.props.contentRef && z.props.contentRef(M);
            }, z.afterClose = function() {
              var M = z.props, se = M.appElement, le = M.ariaHideApp, te = M.htmlOpenClassName, ce = M.bodyOpenClassName;
              ce && x.remove(document.body, ce), te && x.remove(document.getElementsByTagName("html")[0], te), le && I > 0 && (I -= 1) === 0 && C.show(se), z.props.shouldFocusAfterRender && (z.props.shouldReturnFocusAfterClose ? (v.returnFocus(z.props.preventScroll), v.teardownScopedFocus()) : v.popWithoutFocus()), z.props.onAfterClose && z.props.onAfterClose(), K.default.deregister(z);
            }, z.open = function() {
              z.beforeOpen(), z.state.afterOpen && z.state.beforeClose ? (clearTimeout(z.closeTimer), z.setState({ beforeClose: !1 })) : (z.props.shouldFocusAfterRender && (v.setupScopedFocus(z.node), v.markForFocusLater()), z.setState({ isOpen: !0 }, function() {
                z.openAnimationFrame = requestAnimationFrame(function() {
                  z.setState({ afterOpen: !0 }), z.props.isOpen && z.props.onAfterOpen && z.props.onAfterOpen({ overlayEl: z.overlay, contentEl: z.content });
                });
              }));
            }, z.close = function() {
              z.props.closeTimeoutMS > 0 ? z.closeWithTimeout() : z.closeWithoutTimeout();
            }, z.focusContent = function() {
              return z.content && !z.contentHasFocus() && z.content.focus({ preventScroll: !0 });
            }, z.closeWithTimeout = function() {
              var M = Date.now() + z.props.closeTimeoutMS;
              z.setState({ beforeClose: !0, closesAt: M }, function() {
                z.closeTimer = setTimeout(z.closeWithoutTimeout, z.state.closesAt - Date.now());
              });
            }, z.closeWithoutTimeout = function() {
              z.setState({ beforeClose: !1, isOpen: !1, afterOpen: !1, closesAt: null }, z.afterClose);
            }, z.handleKeyDown = function(M) {
              M.keyCode === 9 && (0, y.default)(z.content, M), z.props.shouldCloseOnEsc && M.keyCode === 27 && (M.stopPropagation(), z.requestClose(M));
            }, z.handleOverlayOnClick = function(M) {
              z.shouldClose === null && (z.shouldClose = !0), z.shouldClose && z.props.shouldCloseOnOverlayClick && (z.ownerHandlesClose() ? z.requestClose(M) : z.focusContent()), z.shouldClose = null;
            }, z.handleContentOnMouseUp = function() {
              z.shouldClose = !1;
            }, z.handleOverlayOnMouseDown = function(M) {
              z.props.shouldCloseOnOverlayClick || M.target != z.overlay || M.preventDefault();
            }, z.handleContentOnClick = function() {
              z.shouldClose = !1;
            }, z.handleContentOnMouseDown = function() {
              z.shouldClose = !1;
            }, z.requestClose = function(M) {
              return z.ownerHandlesClose() && z.props.onRequestClose(M);
            }, z.ownerHandlesClose = function() {
              return z.props.onRequestClose;
            }, z.shouldBeClosed = function() {
              return !z.state.isOpen && !z.state.beforeClose;
            }, z.contentHasFocus = function() {
              return document.activeElement === z.content || z.content.contains(document.activeElement);
            }, z.buildClassName = function(M, se) {
              var le = (se === void 0 ? "undefined" : o(se)) === "object" ? se : { base: P[M], afterOpen: P[M] + "--after-open", beforeClose: P[M] + "--before-close" }, te = le.base;
              return z.state.afterOpen && (te = te + " " + le.afterOpen), z.state.beforeClose && (te = te + " " + le.beforeClose), typeof se == "string" && se ? te + " " + se : te;
            }, z.attributesFromObject = function(M, se) {
              return Object.keys(se).reduce(function(le, te) {
                return le[M + "-" + te] = se[te], le;
              }, {});
            }, z.state = { afterOpen: !1, beforeClose: !1 }, z.shouldClose = null, z.moveFromContentToOverlay = null, z;
          }
          return function(Q, z) {
            if (typeof z != "function" && z !== null) throw new TypeError("Super expression must either be null or a function, not " + typeof z);
            Q.prototype = Object.create(z && z.prototype, { constructor: { value: Q, enumerable: !1, writable: !0, configurable: !0 } }), z && (Object.setPrototypeOf ? Object.setPrototypeOf(Q, z) : Q.__proto__ = z);
          }(oe, R), _(oe, [{ key: "componentDidMount", value: function() {
            this.props.isOpen && this.open();
          } }, { key: "componentDidUpdate", value: function(Q, z) {
            this.props.isOpen && !Q.isOpen ? this.open() : !this.props.isOpen && Q.isOpen && this.close(), this.props.shouldFocusAfterRender && this.state.isOpen && !z.isOpen && this.focusContent();
          } }, { key: "componentWillUnmount", value: function() {
            this.state.isOpen && this.afterClose(), clearTimeout(this.closeTimer), cancelAnimationFrame(this.openAnimationFrame);
          } }, { key: "beforeOpen", value: function() {
            var Q = this.props, z = Q.appElement, M = Q.ariaHideApp, se = Q.htmlOpenClassName, le = Q.bodyOpenClassName;
            le && x.add(document.body, le), se && x.add(document.getElementsByTagName("html")[0], se), M && (I += 1, C.hide(z)), K.default.register(this);
          } }, { key: "render", value: function() {
            var Q = this.props, z = Q.id, M = Q.className, se = Q.overlayClassName, le = Q.defaultStyles, te = Q.children, ce = M ? {} : le.content, ye = se ? {} : le.overlay;
            if (this.shouldBeClosed()) return null;
            var J = { ref: this.setOverlayRef, className: this.buildClassName("overlay", se), style: c({}, ye, this.props.style.overlay), onClick: this.handleOverlayOnClick, onMouseDown: this.handleOverlayOnMouseDown }, de = c({ id: z, ref: this.setContentRef, style: c({}, ce, this.props.style.content), className: this.buildClassName("content", M), tabIndex: "-1", onKeyDown: this.handleKeyDown, onMouseDown: this.handleContentOnMouseDown, onMouseUp: this.handleContentOnMouseUp, onClick: this.handleContentOnClick, role: this.props.role, "aria-label": this.props.contentLabel }, this.attributesFromObject("aria", c({ modal: !0 }, this.props.aria)), this.attributesFromObject("data", this.props.data || {}), { "data-testid": this.props.testId }), D = this.props.contentElement(de, te);
            return this.props.overlayElement(J, D);
          } }]), oe;
        }(m.Component);
        V.defaultProps = { style: { overlay: {}, content: {} }, defaultStyles: {} }, V.propTypes = { isOpen: b.default.bool.isRequired, defaultStyles: b.default.shape({ content: b.default.object, overlay: b.default.object }), style: b.default.shape({ content: b.default.object, overlay: b.default.object }), className: b.default.oneOfType([b.default.string, b.default.object]), overlayClassName: b.default.oneOfType([b.default.string, b.default.object]), bodyOpenClassName: b.default.string, htmlOpenClassName: b.default.string, ariaHideApp: b.default.bool, appElement: b.default.oneOfType([b.default.instanceOf(G.default), b.default.instanceOf(N.SafeHTMLCollection), b.default.instanceOf(N.SafeNodeList), b.default.arrayOf(b.default.instanceOf(G.default))]), onAfterOpen: b.default.func, onAfterClose: b.default.func, onRequestClose: b.default.func, closeTimeoutMS: b.default.number, shouldFocusAfterRender: b.default.bool, shouldCloseOnOverlayClick: b.default.bool, shouldReturnFocusAfterClose: b.default.bool, preventScroll: b.default.bool, role: b.default.string, contentLabel: b.default.string, aria: b.default.object, data: b.default.object, children: b.default.node, shouldCloseOnEsc: b.default.bool, overlayRef: b.default.func, contentRef: b.default.func, id: b.default.string, overlayElement: b.default.func, contentElement: b.default.func, testId: b.default.string }, i.default = V, g.exports = i.default;
      }, function(g, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.resetState = function() {
          m = [];
        }, i.log = function() {
        }, i.handleBlur = y, i.handleFocus = C, i.markForFocusLater = function() {
          m.push(document.activeElement);
        }, i.returnFocus = function() {
          var x = arguments.length > 0 && arguments[0] !== void 0 && arguments[0], N = null;
          try {
            return void (m.length !== 0 && (N = m.pop()).focus({ preventScroll: x }));
          } catch {
            console.warn(["You tried to return focus to", N, "but it is not in the DOM anymore"].join(" "));
          }
        }, i.popWithoutFocus = function() {
          m.length > 0 && m.pop();
        }, i.setupScopedFocus = function(x) {
          b = x, window.addEventListener ? (window.addEventListener("blur", y, !1), document.addEventListener("focus", C, !0)) : (window.attachEvent("onBlur", y), document.attachEvent("onFocus", C));
        }, i.teardownScopedFocus = function() {
          b = null, window.addEventListener ? (window.removeEventListener("blur", y), document.removeEventListener("focus", C)) : (window.detachEvent("onBlur", y), document.detachEvent("onFocus", C));
        };
        var c, o = u(42), _ = (c = o) && c.__esModule ? c : { default: c }, m = [], b = null, v = !1;
        function y() {
          v = !0;
        }
        function C() {
          if (v) {
            if (v = !1, !b) return;
            setTimeout(function() {
              b.contains(document.activeElement) || ((0, _.default)(b)[0] || b).focus();
            }, 0);
          }
        }
      }, function(g, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.default = function(m, b) {
          var v = (0, _.default)(m);
          if (!v.length) return void b.preventDefault();
          var y = void 0, C = b.shiftKey, x = v[0], N = v[v.length - 1], G = function B() {
            var P = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : document;
            return P.activeElement.shadowRoot ? B(P.activeElement.shadowRoot) : P.activeElement;
          }();
          if (m === G) {
            if (!C) return;
            y = N;
          }
          if (N !== G || C || (y = x), x === G && C && (y = N), y) return b.preventDefault(), void y.focus();
          var K = /(\bChrome\b|\bSafari\b)\//.exec(navigator.userAgent);
          if (!(K == null || K[1] == "Chrome" || /\biPod\b|\biPad\b/g.exec(navigator.userAgent) != null)) {
            var j = v.indexOf(G);
            if (j > -1 && (j += C ? -1 : 1), (y = v[j]) === void 0) return b.preventDefault(), void (y = C ? N : x).focus();
            b.preventDefault(), y.focus();
          }
        };
        var c, o = u(42), _ = (c = o) && c.__esModule ? c : { default: c };
        g.exports = i.default;
      }, function(g, i, u) {
        var c = function() {
        };
        g.exports = c;
      }, function(g, i, u) {
        var c;
        (function() {
          var o = !(typeof window > "u" || !window.document || !window.document.createElement), _ = { canUseDOM: o, canUseWorkers: typeof Worker < "u", canUseEventListeners: o && !(!window.addEventListener && !window.attachEvent), canUseViewport: o && !!window.screen };
          (c = (function() {
            return _;
          }).call(i, u, i, g)) === void 0 || (g.exports = c);
        })();
      }, function(g, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.resetState = function() {
          var m = document.getElementsByTagName("html")[0];
          for (var b in c) _(m, c[b]);
          var v = document.body;
          for (var y in o) _(v, o[y]);
          c = {}, o = {};
        }, i.log = function() {
        };
        var c = {}, o = {};
        function _(m, b) {
          m.classList.remove(b);
        }
        i.add = function(m, b) {
          return v = m.classList, y = m.nodeName.toLowerCase() == "html" ? c : o, void b.split(" ").forEach(function(C) {
            (function(x, N) {
              x[N] || (x[N] = 0), x[N] += 1;
            })(y, C), v.add(C);
          });
          var v, y;
        }, i.remove = function(m, b) {
          return v = m.classList, y = m.nodeName.toLowerCase() == "html" ? c : o, void b.split(" ").forEach(function(C) {
            (function(x, N) {
              x[N] && (x[N] -= 1);
            })(y, C), y[C] === 0 && v.remove(C);
          });
          var v, y;
        };
      }, function(g, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.resetState = function() {
          for (var C = [m, b], x = 0; x < C.length; x++) {
            var N = C[x];
            N && N.parentNode && N.parentNode.removeChild(N);
          }
          m = b = null, v = [];
        }, i.log = function() {
          console.log("bodyTrap ----------"), console.log(v.length);
          for (var C = [m, b], x = 0; x < C.length; x++) {
            var N = C[x] || {};
            console.log(N.nodeName, N.className, N.id);
          }
          console.log("edn bodyTrap ----------");
        };
        var c, o = u(44), _ = (c = o) && c.__esModule ? c : { default: c }, m = void 0, b = void 0, v = [];
        function y() {
          v.length !== 0 && v[v.length - 1].focusContent();
        }
        _.default.subscribe(function(C, x) {
          m || b || ((m = document.createElement("div")).setAttribute("data-react-modal-body-trap", ""), m.style.position = "absolute", m.style.opacity = "0", m.setAttribute("tabindex", "0"), m.addEventListener("focus", y), (b = m.cloneNode()).addEventListener("focus", y)), (v = x).length > 0 ? (document.body.firstChild !== m && document.body.insertBefore(m, document.body.firstChild), document.body.lastChild !== b && document.body.appendChild(b)) : (m.parentElement && m.parentElement.removeChild(m), b.parentElement && b.parentElement.removeChild(b));
        });
      }, function(g, i, u) {
        function c() {
          var b = this.constructor.getDerivedStateFromProps(this.props, this.state);
          b != null && this.setState(b);
        }
        function o(b) {
          this.setState((function(v) {
            var y = this.constructor.getDerivedStateFromProps(b, v);
            return y ?? null;
          }).bind(this));
        }
        function _(b, v) {
          try {
            var y = this.props, C = this.state;
            this.props = b, this.state = v, this.__reactInternalSnapshotFlag = !0, this.__reactInternalSnapshot = this.getSnapshotBeforeUpdate(y, C);
          } finally {
            this.props = y, this.state = C;
          }
        }
        function m(b) {
          var v = b.prototype;
          if (!v || !v.isReactComponent) throw new Error("Can only polyfill class components");
          if (typeof b.getDerivedStateFromProps != "function" && typeof v.getSnapshotBeforeUpdate != "function") return b;
          var y = null, C = null, x = null;
          if (typeof v.componentWillMount == "function" ? y = "componentWillMount" : typeof v.UNSAFE_componentWillMount == "function" && (y = "UNSAFE_componentWillMount"), typeof v.componentWillReceiveProps == "function" ? C = "componentWillReceiveProps" : typeof v.UNSAFE_componentWillReceiveProps == "function" && (C = "UNSAFE_componentWillReceiveProps"), typeof v.componentWillUpdate == "function" ? x = "componentWillUpdate" : typeof v.UNSAFE_componentWillUpdate == "function" && (x = "UNSAFE_componentWillUpdate"), y !== null || C !== null || x !== null) {
            var N = b.displayName || b.name, G = typeof b.getDerivedStateFromProps == "function" ? "getDerivedStateFromProps()" : "getSnapshotBeforeUpdate()";
            throw Error(`Unsafe legacy lifecycles will not be called for components using new component APIs.

` + N + " uses " + G + " but also contains the following legacy lifecycles:" + (y !== null ? `
  ` + y : "") + (C !== null ? `
  ` + C : "") + (x !== null ? `
  ` + x : "") + `

The above lifecycles should be removed. Learn more about this warning here:
https://fb.me/react-async-component-lifecycle-hooks`);
          }
          if (typeof b.getDerivedStateFromProps == "function" && (v.componentWillMount = c, v.componentWillReceiveProps = o), typeof v.getSnapshotBeforeUpdate == "function") {
            if (typeof v.componentDidUpdate != "function") throw new Error("Cannot polyfill getSnapshotBeforeUpdate() for components that do not define componentDidUpdate() on the prototype");
            v.componentWillUpdate = _;
            var K = v.componentDidUpdate;
            v.componentDidUpdate = function(j, B, P) {
              var I = this.__reactInternalSnapshotFlag ? this.__reactInternalSnapshot : P;
              K.call(this, j, B, I);
            };
          }
          return b;
        }
        u.r(i), u.d(i, "polyfill", function() {
          return m;
        }), c.__suppressDeprecationWarning = !0, o.__suppressDeprecationWarning = !0, _.__suppressDeprecationWarning = !0;
      }, function(g, i, u) {
        var c = u(6), o = u(87);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[g.i, o, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, _), g.exports = o.locals || {};
      }, function(g, i, u) {
        (g.exports = u(7)(!1)).push([g.i, ".ck-inspector-modal{--ck-inspector-set-data-modal-overlay:rgba(0,0,0,0.5);--ck-inspector-set-data-modal-shadow:rgba(0,0,0,0.06);--ck-inspector-set-data-modal-button-background:#eee;--ck-inspector-set-data-modal-button-background-hover:#ddd;--ck-inspector-set-data-modal-save-button-background:#1976d2;--ck-inspector-set-data-modal-save-button-background-hover:#0b60b5}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal{z-index:999999;position:fixed;inset:0;background-color:var(--ck-inspector-set-data-modal-overlay)}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content{position:absolute;border:1px solid var(--ck-inspector-color-border);background:var(--ck-inspector-color-white);overflow:auto;border-radius:2px;outline:none;box-shadow:0 1px 1px var(--ck-inspector-set-data-modal-shadow),0 2px 2px var(--ck-inspector-set-data-modal-shadow),0 4px 4px var(--ck-inspector-set-data-modal-shadow),0 8px 8px var(--ck-inspector-set-data-modal-shadow),0 16px 16px var(--ck-inspector-set-data-modal-shadow);max-height:calc(100vh - 160px);max-width:calc(100vw - 160px);width:100%;height:100%;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;justify-content:space-between}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content h2{font-size:14px;font-weight:700;margin:0;padding:12px 20px;background:var(--ck-inspector-color-background);border-bottom:1px solid var(--ck-inspector-color-border)}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content textarea{flex-grow:1;margin:20px;border:1px solid var(--ck-inspector-color-border);border-radius:2px;resize:none;padding:10px;font-family:monospace;font-size:14px}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content button{padding:10px 20px;border-radius:2px;font-size:14px;white-space:nowrap;border:1px solid var(--ck-inspector-color-border)}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content button:hover{background:var(--ck-inspector-set-data-modal-button-background-hover)}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons{margin:0 20px 20px;display:flex;justify-content:center}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button+button{margin-left:20px}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button:first-child{margin-right:auto}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button:not(:first-child){flex-basis:20%}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button:last-child{background:var(--ck-inspector-set-data-modal-save-button-background);border-color:var(--ck-inspector-set-data-modal-save-button-background);color:#fff;font-weight:700}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button:last-child:hover{background:var(--ck-inspector-set-data-modal-save-button-background-hover)}", ""]);
      }, function(g, i, u) {
        var c = u(6), o = u(89);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[g.i, o, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, _), g.exports = o.locals || {};
      }, function(g, i, u) {
        (g.exports = u(7)(!1)).push([g.i, ".ck-inspector .ck-inspector-editor-quick-actions{display:flex;align-content:center;justify-content:center;align-items:center;flex-direction:row;flex-wrap:nowrap}.ck-inspector .ck-inspector-editor-quick-actions>.ck-inspector-button{margin-left:.3em}.ck-inspector .ck-inspector-editor-quick-actions>.ck-inspector-button.ck-inspector-button_data-copied{animation-duration:.5s;animation-name:ck-inspector-bounce-in;color:green}@keyframes ck-inspector-bounce-in{0%{opacity:0;transform:scale3d(.5,.5,.5)}20%{transform:scale3d(1.1,1.1,1.1)}40%{transform:scale3d(.8,.8,.8)}60%{opacity:1;transform:scale3d(1.05,1.05,1.05)}to{opacity:1;transform:scaleX(1)}}", ""]);
      }, function(g, i, u) {
        var c = u(6), o = u(91);
        typeof (o = o.__esModule ? o.default : o) == "string" && (o = [[g.i, o, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(o, _), g.exports = o.locals || {};
      }, function(g, i, u) {
        (g.exports = u(7)(!1)).push([g.i, "html body.ck-inspector-body-expanded{margin-bottom:var(--ck-inspector-height)}html body.ck-inspector-body-collapsed{margin-bottom:var(--ck-inspector-collapsed-height)}.ck-inspector-wrapper *{box-sizing:border-box}", ""]);
      }, , , function(g, i, u) {
        u.r(i), u.d(i, "default", function() {
          return $e;
        });
        var c = u(0), o = u.n(c), _ = u(12), m = u.n(_);
        function b(E) {
          return "Minified Redux error #" + E + "; visit https://redux.js.org/Errors?code=" + E + " for the full message or use the non-minified dev environment for full errors. ";
        }
        var v = typeof Symbol == "function" && Symbol.observable || "@@observable", y = function() {
          return Math.random().toString(36).substring(7).split("").join(".");
        }, C = { INIT: "@@redux/INIT" + y(), REPLACE: "@@redux/REPLACE" + y() };
        function x(E) {
          if (typeof E != "object" || E === null) return !1;
          for (var s = E; Object.getPrototypeOf(s) !== null; ) s = Object.getPrototypeOf(s);
          return Object.getPrototypeOf(E) === s;
        }
        function N(E, s, d) {
          var h;
          if (typeof s == "function" && typeof d == "function" || typeof d == "function" && typeof arguments[3] == "function") throw new Error(b(0));
          if (typeof s == "function" && d === void 0 && (d = s, s = void 0), d !== void 0) {
            if (typeof d != "function") throw new Error(b(1));
            return d(N)(E, s);
          }
          if (typeof E != "function") throw new Error(b(2));
          var S = E, O = s, L = [], ne = L, fe = !1;
          function pe() {
            ne === L && (ne = L.slice());
          }
          function Ee() {
            if (fe) throw new Error(b(3));
            return O;
          }
          function Ne(Ie) {
            if (typeof Ie != "function") throw new Error(b(4));
            if (fe) throw new Error(b(5));
            var Fe = !0;
            return pe(), ne.push(Ie), function() {
              if (Fe) {
                if (fe) throw new Error(b(6));
                Fe = !1, pe();
                var et = ne.indexOf(Ie);
                ne.splice(et, 1), L = null;
              }
            };
          }
          function Ve(Ie) {
            if (!x(Ie)) throw new Error(b(7));
            if (Ie.type === void 0) throw new Error(b(8));
            if (fe) throw new Error(b(9));
            try {
              fe = !0, O = S(O, Ie);
            } finally {
              fe = !1;
            }
            for (var Fe = L = ne, et = 0; et < Fe.length; et++)
              (0, Fe[et])();
            return Ie;
          }
          function Ae(Ie) {
            if (typeof Ie != "function") throw new Error(b(10));
            S = Ie, Ve({ type: C.REPLACE });
          }
          function Ke() {
            var Ie, Fe = Ne;
            return (Ie = { subscribe: function(et) {
              if (typeof et != "object" || et === null) throw new Error(b(11));
              function Ye() {
                et.next && et.next(Ee());
              }
              return Ye(), { unsubscribe: Fe(Ye) };
            } })[v] = function() {
              return this;
            }, Ie;
          }
          return Ve({ type: C.INIT }), (h = { dispatch: Ve, subscribe: Ne, getState: Ee, replaceReducer: Ae })[v] = Ke, h;
        }
        var G = o.a.createContext(null), K = function(E) {
          E();
        };
        function j() {
          var E = K, s = null, d = null;
          return { clear: function() {
            s = null, d = null;
          }, notify: function() {
            E(function() {
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
        var B = { notify: function() {
        }, get: function() {
          return [];
        } };
        function P(E, s) {
          var d, h = B;
          function S() {
            L.onStateChange && L.onStateChange();
          }
          function O() {
            d || (d = s ? s.addNestedSub(S) : E.subscribe(S), h = j());
          }
          var L = { addNestedSub: function(ne) {
            return O(), h.subscribe(ne);
          }, notifyNestedSubs: function() {
            h.notify();
          }, handleChangeWrapper: S, isSubscribed: function() {
            return !!d;
          }, trySubscribe: O, tryUnsubscribe: function() {
            d && (d(), d = void 0, h.clear(), h = B);
          }, getListeners: function() {
            return h;
          } };
          return L;
        }
        var I = typeof window < "u" && window.document !== void 0 && window.document.createElement !== void 0 ? c.useLayoutEffect : c.useEffect, V = function(E) {
          var s = E.store, d = E.context, h = E.children, S = Object(c.useMemo)(function() {
            var ne = P(s);
            return { store: s, subscription: ne };
          }, [s]), O = Object(c.useMemo)(function() {
            return s.getState();
          }, [s]);
          I(function() {
            var ne = S.subscription;
            return ne.onStateChange = ne.notifyNestedSubs, ne.trySubscribe(), O !== s.getState() && ne.notifyNestedSubs(), function() {
              ne.tryUnsubscribe(), ne.onStateChange = null;
            };
          }, [S, O]);
          var L = d || G;
          return o.a.createElement(L.Provider, { value: S }, h);
        };
        function R() {
          return (R = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var h in d) Object.prototype.hasOwnProperty.call(d, h) && (E[h] = d[h]);
            }
            return E;
          }).apply(this, arguments);
        }
        function oe(E, s) {
          if (E == null) return {};
          var d, h, S = {}, O = Object.keys(E);
          for (h = 0; h < O.length; h++) d = O[h], s.indexOf(d) >= 0 || (S[d] = E[d]);
          return S;
        }
        var Q = u(39), z = u.n(Q), M = u(45), se = ["getDisplayName", "methodName", "renderCountProp", "shouldHandleStateChanges", "storeKey", "withRef", "forwardRef", "context"], le = ["reactReduxForwardedRef"], te = [], ce = [null, null];
        function ye(E, s) {
          var d = E[1];
          return [s.payload, d + 1];
        }
        function J(E, s, d) {
          I(function() {
            return E.apply(void 0, s);
          }, d);
        }
        function de(E, s, d, h, S, O, L) {
          E.current = h, s.current = S, d.current = !1, O.current && (O.current = null, L());
        }
        function D(E, s, d, h, S, O, L, ne, fe, pe) {
          if (E) {
            var Ee = !1, Ne = null, Ve = function() {
              if (!Ee) {
                var Ae, Ke, Ie = s.getState();
                try {
                  Ae = h(Ie, S.current);
                } catch (Fe) {
                  Ke = Fe, Ne = Fe;
                }
                Ke || (Ne = null), Ae === O.current ? L.current || fe() : (O.current = Ae, ne.current = Ae, L.current = !0, pe({ type: "STORE_UPDATED", payload: { error: Ke } }));
              }
            };
            return d.onStateChange = Ve, d.trySubscribe(), Ve(), function() {
              if (Ee = !0, d.tryUnsubscribe(), d.onStateChange = null, Ne) throw Ne;
            };
          }
        }
        var ie = function() {
          return [null, 0];
        };
        function be(E, s) {
          s === void 0 && (s = {});
          var d = s, h = d.getDisplayName, S = h === void 0 ? function(Le) {
            return "ConnectAdvanced(" + Le + ")";
          } : h, O = d.methodName, L = O === void 0 ? "connectAdvanced" : O, ne = d.renderCountProp, fe = ne === void 0 ? void 0 : ne, pe = d.shouldHandleStateChanges, Ee = pe === void 0 || pe, Ne = d.storeKey, Ve = Ne === void 0 ? "store" : Ne, Ae = (d.withRef, d.forwardRef), Ke = Ae !== void 0 && Ae, Ie = d.context, Fe = Ie === void 0 ? G : Ie, et = oe(d, se), Ye = Fe;
          return function(Le) {
            var dt = Le.displayName || Le.name || "Component", Dt = S(dt), It = R({}, et, { getDisplayName: S, methodName: L, renderCountProp: fe, shouldHandleStateChanges: Ee, storeKey: Ve, displayName: Dt, wrappedComponentName: dt, WrappedComponent: Le }), jt = et.pure, _t = jt ? c.useMemo : function(lt) {
              return lt();
            };
            function zt(lt) {
              var Mn = Object(c.useMemo)(function() {
                var wn = lt.reactReduxForwardedRef, so = oe(lt, le);
                return [lt.context, wn, so];
              }, [lt]), Hn = Mn[0], zr = Mn[1], xt = Mn[2], io = Object(c.useMemo)(function() {
                return Hn && Hn.Consumer && Object(M.isContextConsumer)(o.a.createElement(Hn.Consumer, null)) ? Hn : Ye;
              }, [Hn, Ye]), In = Object(c.useContext)(io), $t = !!lt.store && !!lt.store.getState && !!lt.store.dispatch;
              In && In.store;
              var dn = $t ? lt.store : In.store, Xn = Object(c.useMemo)(function() {
                return function(wn) {
                  return E(wn.dispatch, It);
                }(dn);
              }, [dn]), Gt = Object(c.useMemo)(function() {
                if (!Ee) return ce;
                var wn = P(dn, $t ? null : In.subscription), so = wn.notifyNestedSubs.bind(wn);
                return [wn, so];
              }, [dn, $t, In]), fn = Gt[0], Lr = Gt[1], oi = Object(c.useMemo)(function() {
                return $t ? In : R({}, In, { subscription: fn });
              }, [$t, In, fn]), Ur = Object(c.useReducer)(ye, te, ie), Mo = Ur[0][0], mr = Ur[1];
              if (Mo && Mo.error) throw Mo.error;
              var Ui = Object(c.useRef)(), gr = Object(c.useRef)(xt), Io = Object(c.useRef)(), ii = Object(c.useRef)(!1), Zn = _t(function() {
                return Io.current && xt === gr.current ? Io.current : Xn(dn.getState(), xt);
              }, [dn, Mo, xt]);
              J(de, [gr, Ui, ii, xt, Zn, Io, Lr]), J(D, [Ee, dn, fn, Xn, gr, Ui, ii, Io, Lr, mr], [dn, fn, Xn]);
              var ao = Object(c.useMemo)(function() {
                return o.a.createElement(Le, R({}, Zn, { ref: zr }));
              }, [zr, Le, Zn]);
              return Object(c.useMemo)(function() {
                return Ee ? o.a.createElement(io.Provider, { value: oi }, ao) : ao;
              }, [io, ao, oi]);
            }
            var ft = jt ? o.a.memo(zt) : zt;
            if (ft.WrappedComponent = Le, ft.displayName = zt.displayName = Dt, Ke) {
              var An = o.a.forwardRef(function(lt, Mn) {
                return o.a.createElement(ft, R({}, lt, { reactReduxForwardedRef: Mn }));
              });
              return An.displayName = Dt, An.WrappedComponent = Le, z()(An, Le);
            }
            return z()(ft, Le);
          };
        }
        function Te(E, s) {
          return E === s ? E !== 0 || s !== 0 || 1 / E == 1 / s : E != E && s != s;
        }
        function we(E, s) {
          if (Te(E, s)) return !0;
          if (typeof E != "object" || E === null || typeof s != "object" || s === null) return !1;
          var d = Object.keys(E), h = Object.keys(s);
          if (d.length !== h.length) return !1;
          for (var S = 0; S < d.length; S++) if (!Object.prototype.hasOwnProperty.call(s, d[S]) || !Te(E[d[S]], s[d[S]])) return !1;
          return !0;
        }
        function Pe(E) {
          return function(s, d) {
            var h = E(s, d);
            function S() {
              return h;
            }
            return S.dependsOnOwnProps = !1, S;
          };
        }
        function Se(E) {
          return E.dependsOnOwnProps !== null && E.dependsOnOwnProps !== void 0 ? !!E.dependsOnOwnProps : E.length !== 1;
        }
        function ze(E, s) {
          return function(d, h) {
            h.displayName;
            var S = function(O, L) {
              return S.dependsOnOwnProps ? S.mapToProps(O, L) : S.mapToProps(O);
            };
            return S.dependsOnOwnProps = !0, S.mapToProps = function(O, L) {
              S.mapToProps = E, S.dependsOnOwnProps = Se(E);
              var ne = S(O, L);
              return typeof ne == "function" && (S.mapToProps = ne, S.dependsOnOwnProps = Se(ne), ne = S(O, L)), ne;
            }, S;
          };
        }
        var Je = [function(E) {
          return typeof E == "function" ? ze(E) : void 0;
        }, function(E) {
          return E ? void 0 : Pe(function(s) {
            return { dispatch: s };
          });
        }, function(E) {
          return E && typeof E == "object" ? Pe(function(s) {
            return function(d, h) {
              var S = {}, O = function(ne) {
                var fe = d[ne];
                typeof fe == "function" && (S[ne] = function() {
                  return h(fe.apply(void 0, arguments));
                });
              };
              for (var L in d) O(L);
              return S;
            }(E, s);
          }) : void 0;
        }], X = [function(E) {
          return typeof E == "function" ? ze(E) : void 0;
        }, function(E) {
          return E ? void 0 : Pe(function() {
            return {};
          });
        }];
        function Y(E, s, d) {
          return R({}, d, E, s);
        }
        var me = [function(E) {
          return typeof E == "function" ? /* @__PURE__ */ function(s) {
            return function(d, h) {
              h.displayName;
              var S, O = h.pure, L = h.areMergedPropsEqual, ne = !1;
              return function(fe, pe, Ee) {
                var Ne = s(fe, pe, Ee);
                return ne ? O && L(Ne, S) || (S = Ne) : (ne = !0, S = Ne), S;
              };
            };
          }(E) : void 0;
        }, function(E) {
          return E ? void 0 : function() {
            return Y;
          };
        }], l = ["initMapStateToProps", "initMapDispatchToProps", "initMergeProps"];
        function f(E, s, d, h) {
          return function(S, O) {
            return d(E(S, O), s(h, O), O);
          };
        }
        function w(E, s, d, h, S) {
          var O, L, ne, fe, pe, Ee = S.areStatesEqual, Ne = S.areOwnPropsEqual, Ve = S.areStatePropsEqual, Ae = !1;
          function Ke(Ie, Fe) {
            var et, Ye, Le = !Ne(Fe, L), dt = !Ee(Ie, O);
            return O = Ie, L = Fe, Le && dt ? (ne = E(O, L), s.dependsOnOwnProps && (fe = s(h, L)), pe = d(ne, fe, L)) : Le ? (E.dependsOnOwnProps && (ne = E(O, L)), s.dependsOnOwnProps && (fe = s(h, L)), pe = d(ne, fe, L)) : (dt && (et = E(O, L), Ye = !Ve(et, ne), ne = et, Ye && (pe = d(ne, fe, L))), pe);
          }
          return function(Ie, Fe) {
            return Ae ? Ke(Ie, Fe) : (ne = E(O = Ie, L = Fe), fe = s(h, L), pe = d(ne, fe, L), Ae = !0, pe);
          };
        }
        function U(E, s) {
          var d = s.initMapStateToProps, h = s.initMapDispatchToProps, S = s.initMergeProps, O = oe(s, l), L = d(E, O), ne = h(E, O), fe = S(E, O);
          return (O.pure ? w : f)(L, ne, fe, E, O);
        }
        var F = ["pure", "areStatesEqual", "areOwnPropsEqual", "areStatePropsEqual", "areMergedPropsEqual"];
        function W(E, s, d) {
          for (var h = s.length - 1; h >= 0; h--) {
            var S = s[h](E);
            if (S) return S;
          }
          return function(O, L) {
            throw new Error("Invalid value of type " + typeof E + " for " + d + " argument when connecting component " + L.wrappedComponentName + ".");
          };
        }
        function he(E, s) {
          return E === s;
        }
        function je(E) {
          var s = {}, d = s.connectHOC, h = d === void 0 ? be : d, S = s.mapStateToPropsFactories, O = S === void 0 ? X : S, L = s.mapDispatchToPropsFactories, ne = L === void 0 ? Je : L, fe = s.mergePropsFactories, pe = fe === void 0 ? me : fe, Ee = s.selectorFactory, Ne = Ee === void 0 ? U : Ee;
          return function(Ve, Ae, Ke, Ie) {
            Ie === void 0 && (Ie = {});
            var Fe = Ie, et = Fe.pure, Ye = et === void 0 || et, Le = Fe.areStatesEqual, dt = Le === void 0 ? he : Le, Dt = Fe.areOwnPropsEqual, It = Dt === void 0 ? we : Dt, jt = Fe.areStatePropsEqual, _t = jt === void 0 ? we : jt, zt = Fe.areMergedPropsEqual, ft = zt === void 0 ? we : zt, An = oe(Fe, F), lt = W(Ve, O, "mapStateToProps"), Mn = W(Ae, ne, "mapDispatchToProps"), Hn = W(Ke, pe, "mergeProps");
            return h(Ne, R({ methodName: "connect", getDisplayName: function(zr) {
              return "Connect(" + zr + ")";
            }, shouldHandleStateChanges: !!Ve, initMapStateToProps: lt, initMapDispatchToProps: Mn, initMergeProps: Hn, pure: Ye, areStatesEqual: dt, areOwnPropsEqual: It, areStatePropsEqual: _t, areMergedPropsEqual: ft }, An));
          };
        }
        var Re = je(), Xe;
        Xe = _.unstable_batchedUpdates, K = Xe;
        function He(E) {
          return { type: "SET_MODEL_ACTIVE_TAB", tabName: E };
        }
        function At() {
          return { type: "TOGGLE_IS_COLLAPSED" };
        }
        function kt(E) {
          return { type: "SET_EDITORS", editors: E };
        }
        function Jt(E) {
          return { type: "SET_CURRENT_EDITOR_NAME", editorName: E };
        }
        function wt(E) {
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
          static set(s, d) {
            window.localStorage.setItem("ck5-inspector-" + s, d);
          }
          static get(s) {
            return window.localStorage.getItem("ck5-inspector-" + s);
          }
        }
        function Yn(E, s, d) {
          const h = function(S, O, L) {
            if (S.ui.activeTab !== "Model") return O;
            if (!O) return Sn(S, O);
            switch (L.type) {
              case "SET_MODEL_CURRENT_ROOT_NAME":
                return function(ne, fe, pe) {
                  const Ee = pe.currentRootName;
                  return { ...fe, ...or(ne, fe, { currentRootName: Ee }), currentNode: null, currentNodeDefinition: null, currentRootName: Ee };
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
          }(E, s, d);
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
        function Sn(E, s = {}) {
          const d = Tt(E);
          if (!d) return { ui: s.ui };
          const h = Object(gt.d)(d)[0].rootName;
          return { ...s, ...or(E, s, { currentRootName: h }), currentRootName: h, currentNode: null, currentNodeDefinition: null };
        }
        function or(E, s, d) {
          const h = Tt(E), S = { ...s, ...d }, O = S.currentRootName, L = Object(gt.c)(h, O), ne = Object(gt.a)(h, O), fe = Object(gt.e)({ currentEditor: h, currentRootName: S.currentRootName, ranges: L, markers: ne });
          let pe = S.currentNode, Ee = S.currentNodeDefinition;
          return pe ? pe.root.rootName !== O || !Object(cn.d)(pe) && !pe.parent ? (pe = null, Ee = null) : Ee = Object(gt.b)(h, pe) : Ee = null, { treeDefinition: fe, currentNode: pe, currentNodeDefinition: Ee, ranges: L, markers: ne };
        }
        function _r(E) {
          return { type: "SET_VIEW_ACTIVE_TAB", tabName: E };
        }
        function wo() {
          return { type: "UPDATE_VIEW_STATE" };
        }
        var en = u(9), Yt = u(2);
        function xr(E, s, d) {
          const h = function(S, O, L) {
            if (S.ui.activeTab !== "View") return O;
            if (!O) return qt(S, O);
            switch (L.type) {
              case "SET_VIEW_CURRENT_ROOT_NAME":
                return function(ne, fe, pe) {
                  const Ee = pe.currentRootName;
                  return { ...fe, ...gn(ne, fe, { currentRootName: Ee }), currentNode: null, currentNodeDefinition: null, currentRootName: Ee };
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
          }(E, s, d);
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
        function qt(E, s = {}) {
          const d = Tt(E), h = Object(en.d)(d), S = h[0] ? h[0].rootName : null;
          return { ...s, ...gn(E, s, { currentRootName: S }), currentRootName: S, currentNode: null, currentNodeDefinition: null };
        }
        function gn(E, s, d) {
          const h = { ...s, ...d }, S = h.currentRootName, O = Object(en.c)(Tt(E), S), L = Object(en.e)({ currentEditor: Tt(E), currentRootName: S, ranges: O });
          let ne = h.currentNode, fe = h.currentNodeDefinition;
          return ne ? ne.root.rootName !== S || !Object(Yt.g)(ne) && !ne.parent ? (ne = null, fe = null) : fe = Object(en.b)(ne) : fe = null, { treeDefinition: L, currentNode: ne, currentNodeDefinition: fe, ranges: O };
        }
        function Sr() {
          return { type: "UPDATE_COMMANDS_STATE" };
        }
        var ut = u(1);
        function Cr({ editors: E, currentEditorName: s }, d) {
          if (!d) return null;
          const h = E.get(s).commands.get(d);
          return { currentCommandName: d, type: "Command", url: "https://ckeditor.com/docs/ckeditor5/latest/api/module_core_command-Command.html", properties: Object(ut.b)({ isEnabled: { value: h.isEnabled }, value: { value: h.value } }), command: h };
        }
        function bn({ editors: E, currentEditorName: s }) {
          if (!E.get(s)) return [];
          const d = [];
          for (const [h, S] of E.get(s).commands) {
            const O = [];
            S.value !== void 0 && O.push(["value", Object(ut.a)(S.value, !1)]), d.push({ name: h, type: "element", children: [], node: h, attributes: O, presentation: { isEmpty: !0, cssClass: ["ck-inspector-tree-node_tagless", S.isEnabled ? "" : "ck-inspector-tree-node_disabled"].join(" ") } });
          }
          return d.sort((h, S) => h.name > S.name ? 1 : -1);
        }
        function Tr(E, s = {}) {
          return { ...s, currentCommandName: null, currentCommandDefinition: null, treeDefinition: bn(E) };
        }
        function ir(E) {
          return { type: "SET_SCHEMA_CURRENT_DEFINITION_NAME", currentSchemaDefinitionName: E };
        }
        const ar = ["isBlock", "isInline", "isObject", "isContent", "isLimit", "isSelectable"], Cn = "https://ckeditor.com/docs/ckeditor5/latest/api/";
        function sr({ editors: E, currentEditorName: s }, d) {
          if (!d) return null;
          const h = E.get(s).model.schema, S = h.getDefinitions()[d], O = {}, L = {}, ne = {};
          let fe = {};
          for (const pe of ar) S[pe] && (O[pe] = { value: S[pe] });
          for (const pe of S.allowChildren.sort()) L[pe] = { value: !0, title: "Click to see the definition of " + pe };
          for (const pe of S.allowIn.sort()) ne[pe] = { value: !0, title: "Click to see the definition of " + pe };
          for (const pe of S.allowAttributes.sort()) fe[pe] = { value: !0 };
          fe = Object(ut.b)(fe);
          for (const pe in fe) {
            const Ee = h.getAttributeProperties(pe), Ne = {};
            for (const Ve in Ee) Ne[Ve] = { value: Ee[Ve] };
            fe[pe].subProperties = Object(ut.b)(Ne);
          }
          return { currentSchemaDefinitionName: d, type: "SchemaCompiledItemDefinition", urls: { general: Cn + "module_engine_model_schema-SchemaCompiledItemDefinition.html", allowAttributes: Cn + "module_engine_model_schema-SchemaItemDefinition.html#member-allowAttributes", allowChildren: Cn + "module_engine_model_schema-SchemaItemDefinition.html#member-allowChildren", allowIn: Cn + "module_engine_model_schema-SchemaItemDefinition.html#member-allowIn" }, properties: Object(ut.b)(O), allowChildren: Object(ut.b)(L), allowIn: Object(ut.b)(ne), allowAttributes: fe, definition: S };
        }
        function Tn({ editors: E, currentEditorName: s }) {
          if (!E.get(s)) return [];
          const d = [], h = E.get(s).model.schema.getDefinitions();
          for (const S in h) d.push({ name: S, type: "element", children: [], node: S, attributes: [], presentation: { isEmpty: !0, cssClass: "ck-inspector-tree-node_tagless" } });
          return d.sort((S, O) => S.name > O.name ? 1 : -1);
        }
        function lr(E, s = {}) {
          return { ...s, currentSchemaDefinitionName: null, currentSchemaDefinition: null, treeDefinition: Tn(E) };
        }
        var On = u(8);
        function Gr(E, s) {
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
          }(E, s);
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
          }(d, d.schema, s), { ...E, ...d };
        }
        function Xr(E, s) {
          const d = Tt(E);
          return { ...s, isReadOnly: !!d && d.isReadOnly };
        }
        var H = u(46), ae = u.n(H), ke = /* @__PURE__ */ function() {
          var E = function(s, d) {
            return (E = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(h, S) {
              h.__proto__ = S;
            } || function(h, S) {
              for (var O in S) S.hasOwnProperty(O) && (h[O] = S[O]);
            })(s, d);
          };
          return function(s, d) {
            function h() {
              this.constructor = s;
            }
            E(s, d), s.prototype = d === null ? Object.create(d) : (h.prototype = d.prototype, new h());
          };
        }(), Ce = function() {
          return (Ce = Object.assign || function(E) {
            for (var s, d = 1, h = arguments.length; d < h; d++) for (var S in s = arguments[d]) Object.prototype.hasOwnProperty.call(s, S) && (E[S] = s[S]);
            return E;
          }).apply(this, arguments);
        }, it = { top: { width: "100%", height: "10px", top: "-5px", left: "0px", cursor: "row-resize" }, right: { width: "10px", height: "100%", top: "0px", right: "-5px", cursor: "col-resize" }, bottom: { width: "100%", height: "10px", bottom: "-5px", left: "0px", cursor: "row-resize" }, left: { width: "10px", height: "100%", top: "0px", left: "-5px", cursor: "col-resize" }, topRight: { width: "20px", height: "20px", position: "absolute", right: "-10px", top: "-10px", cursor: "ne-resize" }, bottomRight: { width: "20px", height: "20px", position: "absolute", right: "-10px", bottom: "-10px", cursor: "se-resize" }, bottomLeft: { width: "20px", height: "20px", position: "absolute", left: "-10px", bottom: "-10px", cursor: "sw-resize" }, topLeft: { width: "20px", height: "20px", position: "absolute", left: "-10px", top: "-10px", cursor: "nw-resize" } }, qe = function(E) {
          function s() {
            var d = E !== null && E.apply(this, arguments) || this;
            return d.onMouseDown = function(h) {
              d.props.onResizeStart(h, d.props.direction);
            }, d.onTouchStart = function(h) {
              d.props.onResizeStart(h, d.props.direction);
            }, d;
          }
          return ke(s, E), s.prototype.render = function() {
            return c.createElement("div", { className: this.props.className || "", style: Ce(Ce({ position: "absolute", userSelect: "none" }, it[this.props.direction]), this.props.replaceStyles || {}), onMouseDown: this.onMouseDown, onTouchStart: this.onTouchStart }, this.props.children);
          }, s;
        }(c.PureComponent), st = u(14), tt = u.n(st), Ot = /* @__PURE__ */ function() {
          var E = function(s, d) {
            return (E = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(h, S) {
              h.__proto__ = S;
            } || function(h, S) {
              for (var O in S) S.hasOwnProperty(O) && (h[O] = S[O]);
            })(s, d);
          };
          return function(s, d) {
            function h() {
              this.constructor = s;
            }
            E(s, d), s.prototype = d === null ? Object.create(d) : (h.prototype = d.prototype, new h());
          };
        }(), nt = function() {
          return (nt = Object.assign || function(E) {
            for (var s, d = 1, h = arguments.length; d < h; d++) for (var S in s = arguments[d]) Object.prototype.hasOwnProperty.call(s, S) && (E[S] = s[S]);
            return E;
          }).apply(this, arguments);
        }, bt = { width: "auto", height: "auto" }, Pt = tt()(function(E, s, d) {
          return Math.max(Math.min(E, d), s);
        }), tn = tt()(function(E, s) {
          return Math.round(E / s) * s;
        }), ht = tt()(function(E, s) {
          return new RegExp(E, "i").test(s);
        }), Vt = function(E) {
          return !!(E.touches && E.touches.length);
        }, Pn = tt()(function(E, s, d) {
          d === void 0 && (d = 0);
          var h = s.reduce(function(O, L, ne) {
            return Math.abs(L - E) < Math.abs(s[O] - E) ? ne : O;
          }, 0), S = Math.abs(s[h] - E);
          return d === 0 || S < d ? s[h] : E;
        }), ct = tt()(function(E, s) {
          return E.substr(E.length - s.length, s.length) === s;
        }), yn = tt()(function(E) {
          return (E = E.toString()) === "auto" || ct(E, "px") || ct(E, "%") || ct(E, "vh") || ct(E, "vw") || ct(E, "vmax") || ct(E, "vmin") ? E : E + "px";
        }), un = function(E, s, d, h) {
          if (E && typeof E == "string") {
            if (ct(E, "px")) return Number(E.replace("px", ""));
            if (ct(E, "%")) return s * (Number(E.replace("%", "")) / 100);
            if (ct(E, "vw")) return d * (Number(E.replace("vw", "")) / 100);
            if (ct(E, "vh")) return h * (Number(E.replace("vh", "")) / 100);
          }
          return E;
        }, Nn = tt()(function(E, s, d, h, S, O, L) {
          return h = un(h, E.width, s, d), S = un(S, E.height, s, d), O = un(O, E.width, s, d), L = un(L, E.height, s, d), { maxWidth: h === void 0 ? void 0 : Number(h), maxHeight: S === void 0 ? void 0 : Number(S), minWidth: O === void 0 ? void 0 : Number(O), minHeight: L === void 0 ? void 0 : Number(L) };
        }), Eo = ["as", "style", "className", "grid", "snap", "bounds", "boundsByDirection", "size", "defaultSize", "minWidth", "minHeight", "maxWidth", "maxHeight", "lockAspectRatio", "lockAspectRatioExtraWidth", "lockAspectRatioExtraHeight", "enable", "handleStyles", "handleClasses", "handleWrapperStyle", "handleWrapperClass", "children", "onResizeStart", "onResize", "onResizeStop", "handleComponent", "scale", "resizeRatio", "snapGap"], _o = function(E) {
          function s(d) {
            var h = E.call(this, d) || this;
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
          return Ot(s, E), Object.defineProperty(s.prototype, "parentNode", { get: function() {
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
              var Ee = this.parentNode;
              Ee && (S = fe ? this.resizableRight - this.parentLeft : Ee.offsetWidth + (this.parentLeft - this.resizableLeft), O = pe ? this.resizableBottom - this.parentTop : Ee.offsetHeight + (this.parentTop - this.resizableTop));
            } else this.props.bounds === "window" ? this.window && (S = fe ? this.resizableRight : this.window.innerWidth - this.resizableLeft, O = pe ? this.resizableBottom : this.window.innerHeight - this.resizableTop) : this.props.bounds && (S = fe ? this.resizableRight - this.targetLeft : this.props.bounds.offsetWidth + (this.targetLeft - this.resizableLeft), O = pe ? this.resizableBottom - this.targetTop : this.props.bounds.offsetHeight + (this.targetTop - this.resizableTop));
            return S && Number.isFinite(S) && (d = d && d < S ? d : S), O && Number.isFinite(O) && (h = h && h < O ? h : O), { maxWidth: d, maxHeight: h };
          }, s.prototype.calculateNewSizeFromDirection = function(d, h) {
            var S = this.props.scale || 1, O = this.props.resizeRatio || 1, L = this.state, ne = L.direction, fe = L.original, pe = this.props, Ee = pe.lockAspectRatio, Ne = pe.lockAspectRatioExtraHeight, Ve = pe.lockAspectRatioExtraWidth, Ae = fe.width, Ke = fe.height, Ie = Ne || 0, Fe = Ve || 0;
            return ht("right", ne) && (Ae = fe.width + (d - fe.x) * O / S, Ee && (Ke = (Ae - Fe) / this.ratio + Ie)), ht("left", ne) && (Ae = fe.width - (d - fe.x) * O / S, Ee && (Ke = (Ae - Fe) / this.ratio + Ie)), ht("bottom", ne) && (Ke = fe.height + (h - fe.y) * O / S, Ee && (Ae = (Ke - Ie) * this.ratio + Fe)), ht("top", ne) && (Ke = fe.height - (h - fe.y) * O / S, Ee && (Ae = (Ke - Ie) * this.ratio + Fe)), { newWidth: Ae, newHeight: Ke };
          }, s.prototype.calculateNewSizeFromAspectRatio = function(d, h, S, O) {
            var L = this.props, ne = L.lockAspectRatio, fe = L.lockAspectRatioExtraHeight, pe = L.lockAspectRatioExtraWidth, Ee = O.width === void 0 ? 10 : O.width, Ne = S.width === void 0 || S.width < 0 ? d : S.width, Ve = O.height === void 0 ? 10 : O.height, Ae = S.height === void 0 || S.height < 0 ? h : S.height, Ke = fe || 0, Ie = pe || 0;
            if (ne) {
              var Fe = (Ve - Ke) * this.ratio + Ie, et = (Ae - Ke) * this.ratio + Ie, Ye = (Ee - Ie) / this.ratio + Ke, Le = (Ne - Ie) / this.ratio + Ke, dt = Math.max(Ee, Fe), Dt = Math.min(Ne, et), It = Math.max(Ve, Ye), jt = Math.min(Ae, Le);
              d = Pt(d, dt, Dt), h = Pt(h, It, jt);
            } else d = Pt(d, Ee, Ne), h = Pt(h, Ve, Ae);
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
              } else d.nativeEvent && Vt(d.nativeEvent) && (O = d.nativeEvent.touches[0].clientX, L = d.nativeEvent.touches[0].clientY);
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
              var Ee = { original: { x: O, y: L, width: this.size.width, height: this.size.height }, isResizing: !0, backgroundStyle: nt(nt({}, this.state.backgroundStyle), { cursor: this.window.getComputedStyle(d.target).cursor || "auto" }), direction: h, flexBasis: S };
              this.setState(Ee);
            }
          }, s.prototype.onMouseMove = function(d) {
            if (this.state.isResizing && this.resizable && this.window) {
              if (this.window.TouchEvent && Vt(d)) try {
                d.preventDefault(), d.stopPropagation();
              } catch {
              }
              var h = this.props, S = h.maxWidth, O = h.maxHeight, L = h.minWidth, ne = h.minHeight, fe = Vt(d) ? d.touches[0].clientX : d.clientX, pe = Vt(d) ? d.touches[0].clientY : d.clientY, Ee = this.state, Ne = Ee.direction, Ve = Ee.original, Ae = Ee.width, Ke = Ee.height, Ie = this.getParentSize(), Fe = Nn(Ie, this.window.innerWidth, this.window.innerHeight, S, O, L, ne);
              S = Fe.maxWidth, O = Fe.maxHeight, L = Fe.minWidth, ne = Fe.minHeight;
              var et = this.calculateNewSizeFromDirection(fe, pe), Ye = et.newHeight, Le = et.newWidth, dt = this.calculateNewMaxFromBoundary(S, O), Dt = this.calculateNewSizeFromAspectRatio(Le, Ye, { width: dt.maxWidth, height: dt.maxHeight }, { width: L, height: ne });
              if (Le = Dt.newWidth, Ye = Dt.newHeight, this.props.grid) {
                var It = tn(Le, this.props.grid[0]), jt = tn(Ye, this.props.grid[1]), _t = this.props.snapGap || 0;
                Le = _t === 0 || Math.abs(It - Le) <= _t ? It : Le, Ye = _t === 0 || Math.abs(jt - Ye) <= _t ? jt : Ye;
              }
              this.props.snap && this.props.snap.x && (Le = Pn(Le, this.props.snap.x, this.props.snapGap)), this.props.snap && this.props.snap.y && (Ye = Pn(Ye, this.props.snap.y, this.props.snapGap));
              var zt = { width: Le - Ve.width, height: Ye - Ve.height };
              Ae && typeof Ae == "string" && (ct(Ae, "%") ? Le = Le / Ie.width * 100 + "%" : ct(Ae, "vw") ? Le = Le / this.window.innerWidth * 100 + "vw" : ct(Ae, "vh") && (Le = Le / this.window.innerHeight * 100 + "vh")), Ke && typeof Ke == "string" && (ct(Ke, "%") ? Ye = Ye / Ie.height * 100 + "%" : ct(Ke, "vw") ? Ye = Ye / this.window.innerWidth * 100 + "vw" : ct(Ke, "vh") && (Ye = Ye / this.window.innerHeight * 100 + "vh"));
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
            var Ee = Object.keys(S).map(function(Ne) {
              return S[Ne] !== !1 ? c.createElement(qe, { key: Ne, direction: Ne, onResizeStart: d.onResizeStart, replaceStyles: O && O[Ne], className: L && L[Ne] }, pe && pe[Ne] ? pe[Ne] : null) : null;
            });
            return c.createElement("div", { className: fe, style: ne }, Ee);
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
        }(c.PureComponent), rt = function(E, s) {
          return (rt = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d, h) {
            d.__proto__ = h;
          } || function(d, h) {
            for (var S in h) h.hasOwnProperty(S) && (d[S] = h[S]);
          })(E, s);
        }, Ue = function() {
          return (Ue = Object.assign || function(E) {
            for (var s, d = 1, h = arguments.length; d < h; d++) for (var S in s = arguments[d]) Object.prototype.hasOwnProperty.call(s, S) && (E[S] = s[S]);
            return E;
          }).apply(this, arguments);
        }, qn = ae.a, Kt = { width: "auto", height: "auto", display: "inline-block", position: "absolute", top: 0, left: 0 }, Or = function(E) {
          function s(d) {
            var h = E.call(this, d) || this;
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
          }(s, E), s.prototype.componentDidMount = function() {
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
                  var ne = O.getBoundingClientRect(), fe = ne.left, pe = ne.top, Ee = document.body.getBoundingClientRect(), Ne = -(fe - O.offsetLeft * L - Ee.left) / L, Ve = -(pe - O.offsetTop * L - Ee.top) / L, Ae = (document.body.offsetWidth - this.resizable.size.width * L) / L + Ne, Ke = (document.body.offsetHeight - this.resizable.size.height * L) / L + Ve;
                  return this.setState({ bounds: { top: Ve, right: Ae, bottom: Ke, left: Ne } });
                }
                if (this.props.bounds === "window") {
                  if (!this.resizable) return;
                  var Ie = O.getBoundingClientRect(), Fe = Ie.left, et = Ie.top, Ye = -(Fe - O.offsetLeft * L) / L, Le = -(et - O.offsetTop * L) / L;
                  return Ae = (window.innerWidth - this.resizable.size.width * L) / L + Ye, Ke = (window.innerHeight - this.resizable.size.height * L) / L + Le, this.setState({ bounds: { top: Le, right: Ae, bottom: Ke, left: Ye } });
                }
                S = document.querySelector(this.props.bounds);
              }
              if (S instanceof HTMLElement && O instanceof HTMLElement) {
                var dt = S.getBoundingClientRect(), Dt = dt.left, It = dt.top, jt = O.getBoundingClientRect(), _t = (Dt - jt.left) / L, zt = It - jt.top;
                if (this.resizable) {
                  this.updateOffsetFromParent();
                  var ft = this.offsetFromParent;
                  this.setState({ bounds: { top: zt - ft.top, right: _t + (S.offsetWidth - this.resizable.size.width) - ft.left / L, bottom: zt + (S.offsetHeight - this.resizable.size.height) - ft.top, left: _t - ft.left / L } });
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
              var Ee = this.getSelfElement();
              if (Ee instanceof Element && (pe instanceof HTMLElement || pe === window) && fe instanceof HTMLElement) {
                var Ne = this.getMaxSizesFromProps(), Ve = Ne.maxWidth, Ae = Ne.maxHeight, Ke = this.getParentSize();
                if (Ve && typeof Ve == "string") if (Ve.endsWith("%")) {
                  var Ie = Number(Ve.replace("%", "")) / 100;
                  Ve = Ke.width * Ie;
                } else Ve.endsWith("px") && (Ve = Number(Ve.replace("px", "")));
                Ae && typeof Ae == "string" && (Ae.endsWith("%") ? (Ie = Number(Ae.replace("%", "")) / 100, Ae = Ke.width * Ie) : Ae.endsWith("px") && (Ae = Number(Ae.replace("px", ""))));
                var Fe = Ee.getBoundingClientRect(), et = Fe.left, Ye = Fe.top, Le = this.props.bounds === "window" ? { left: 0, top: 0 } : pe.getBoundingClientRect(), dt = Le.left, Dt = Le.top, It = this.getOffsetWidth(pe), jt = this.getOffsetHeight(pe), _t = h.toLowerCase().endsWith("left"), zt = h.toLowerCase().endsWith("right"), ft = h.startsWith("top"), An = h.startsWith("bottom");
                if (_t && this.resizable) {
                  var lt = (et - dt) / O + this.resizable.size.width;
                  this.setState({ maxWidth: lt > Number(Ve) ? Ve : lt });
                }
                (zt || this.props.lockAspectRatio && !_t) && (lt = It + (dt - et) / O, this.setState({ maxWidth: lt > Number(Ve) ? Ve : lt })), ft && this.resizable && (lt = (Ye - Dt) / O + this.resizable.size.height, this.setState({ maxHeight: lt > Number(Ae) ? Ae : lt })), (An || this.props.lockAspectRatio && !ft) && (lt = jt + (Dt - Ye) / O, this.setState({ maxHeight: lt > Number(Ae) ? Ae : lt }));
              }
            } else this.setState({ maxWidth: this.props.maxWidth, maxHeight: this.props.maxHeight });
            this.props.onResizeStart && this.props.onResizeStart(d, h, S);
          }, s.prototype.onResize = function(d, h, S, O) {
            var L = { x: this.state.original.x, y: this.state.original.y }, ne = -O.width, fe = -O.height;
            ["top", "left", "topLeft", "bottomLeft", "topRight"].indexOf(h) !== -1 && (h === "bottomLeft" ? L.x += ne : (h === "topRight" || (L.x += ne), L.y += fe)), L.x === this.draggable.state.x && L.y === this.draggable.state.y || this.draggable.setState(L), this.updateOffsetFromParent();
            var pe = this.offsetFromParent, Ee = this.getDraggablePosition().x + pe.left, Ne = this.getDraggablePosition().y + pe.top;
            this.resizingPosition = { x: Ee, y: Ne }, this.props.onResize && this.props.onResize(d, h, S, O, { x: Ee, y: Ne });
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
            var d = this.props, h = d.disableDragging, S = d.style, O = d.dragHandleClassName, L = d.position, ne = d.onMouseDown, fe = d.onMouseUp, pe = d.dragAxis, Ee = d.dragGrid, Ne = d.bounds, Ve = d.enableUserSelectHack, Ae = d.cancel, Ke = d.children, Ie = (d.onResizeStart, d.onResize, d.onResizeStop, d.onDragStart, d.onDrag, d.onDragStop, d.resizeHandleStyles), Fe = d.resizeHandleClasses, et = d.resizeHandleComponent, Ye = d.enableResizing, Le = d.resizeGrid, dt = d.resizeHandleWrapperClass, Dt = d.resizeHandleWrapperStyle, It = d.scale, jt = d.allowAnyClick, _t = function($t, dn) {
              var Xn = {};
              for (var Gt in $t) Object.prototype.hasOwnProperty.call($t, Gt) && dn.indexOf(Gt) < 0 && (Xn[Gt] = $t[Gt]);
              if ($t != null && typeof Object.getOwnPropertySymbols == "function") {
                var fn = 0;
                for (Gt = Object.getOwnPropertySymbols($t); fn < Gt.length; fn++) dn.indexOf(Gt[fn]) < 0 && Object.prototype.propertyIsEnumerable.call($t, Gt[fn]) && (Xn[Gt[fn]] = $t[Gt[fn]]);
              }
              return Xn;
            }(d, ["disableDragging", "style", "dragHandleClassName", "position", "onMouseDown", "onMouseUp", "dragAxis", "dragGrid", "bounds", "enableUserSelectHack", "cancel", "children", "onResizeStart", "onResize", "onResizeStop", "onDragStart", "onDrag", "onDragStop", "resizeHandleStyles", "resizeHandleClasses", "resizeHandleComponent", "enableResizing", "resizeGrid", "resizeHandleWrapperClass", "resizeHandleWrapperStyle", "scale", "allowAnyClick"]), zt = this.props.default ? Ue({}, this.props.default) : void 0;
            delete _t.default;
            var ft, An = h || O ? { cursor: "auto" } : { cursor: "move" }, lt = Ue(Ue(Ue({}, Kt), An), S), Mn = this.offsetFromParent, Hn = Mn.left, zr = Mn.top;
            L && (ft = { x: L.x - Hn, y: L.y - zr });
            var xt, io = this.resizing ? void 0 : ft, In = this.resizing ? "both" : pe;
            return Object(c.createElement)(qn, { ref: this.refDraggable, handle: O ? "." + O : void 0, defaultPosition: zt, onMouseDown: ne, onMouseUp: fe, onStart: this.onDragStart, onDrag: this.onDrag, onStop: this.onDragStop, axis: In, disabled: h, grid: Ee, bounds: Ne ? this.state.bounds : void 0, position: io, enableUserSelectHack: Ve, cancel: Ae, scale: It, allowAnyClick: jt, nodeRef: this.resizableElement }, Object(c.createElement)(_o, Ue({}, _t, { ref: this.refResizable, defaultSize: zt, size: this.props.size, enable: typeof Ye == "boolean" ? (xt = Ye, { bottom: xt, bottomLeft: xt, bottomRight: xt, left: xt, right: xt, top: xt, topLeft: xt, topRight: xt }) : Ye, onResizeStart: this.onResizeStart, onResize: this.onResize, onResizeStop: this.onResizeStop, style: lt, minWidth: this.props.minWidth, minHeight: this.props.minHeight, maxWidth: this.resizing ? this.state.maxWidth : this.props.maxWidth, maxHeight: this.resizing ? this.state.maxHeight : this.props.maxHeight, grid: Le, handleWrapperClass: dt, handleWrapperStyle: Dt, lockAspectRatio: this.props.lockAspectRatio, lockAspectRatioExtraWidth: this.props.lockAspectRatioExtraWidth, lockAspectRatioExtraHeight: this.props.lockAspectRatioExtraHeight, handleStyles: Ie, handleClasses: Fe, handleComponent: et, scale: this.props.scale }), Ke));
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
            return o.a.createElement(Wt, null, [this.props.contentBefore, o.a.createElement(Mt, { key: "navigation", definitions: s.map((d) => d.props.label), activeTab: this.props.activeTab, onClick: this.handleTabClick }), this.props.contentAfter], s.filter((d) => d.props.label === this.props.activeTab));
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
        class Et extends c.Component {
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
        var vn = Re(({ ui: { sidePaneWidth: E } }) => ({ sidePaneWidth: E }), { setSidePaneWidth: function(E) {
          return { type: "SET_SIDE_PANE_WIDTH", newWidth: E };
        } })(dr), Ut = u(11);
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
          handleTreeClick(s, d) {
            s.persist(), s.stopPropagation(), this.props.setModelCurrentNode(d), s.detail === 2 && this.props.setModelActiveTab("Inspect");
          }
          handleRootChange(s) {
            this.props.setModelCurrentRootName(s.target.value);
          }
          render() {
            const s = this.props.editors.get(this.props.currentEditorName);
            return o.a.createElement(Wt, null, [o.a.createElement("div", { className: "ck-inspector-tree__config", key: "root-cfg" }, o.a.createElement(rn, { id: "view-root-select", label: "Root", value: this.props.currentRootName, options: Object(gt.d)(s).map((d) => d.rootName), onChange: this.handleRootChange })), o.a.createElement("span", { className: "ck-inspector-separator", key: "separator" }), o.a.createElement("div", { className: "ck-inspector-tree__config", key: "text-cfg" }, o.a.createElement(Ht, { label: "Compact text", id: "model-compact-text", isChecked: this.props.showCompactText, onChange: this.props.toggleModelShowCompactText }), o.a.createElement(Ht, { label: "Show markers", id: "model-show-markers", isChecked: this.props.showMarkers, onChange: this.props.toggleModelShowMarkers }))], o.a.createElement(Ut.a, { className: [this.props.showMarkers ? "" : "ck-inspector-model-tree__hide-markers"], definition: this.props.treeDefinition, textDirection: s.locale.contentLanguageDirection, onClick: this.handleTreeClick, showCompactText: this.props.showCompactText, activeNode: this.props.currentNode }));
          }
        }
        var Kn = Re(({ editors: E, currentEditorName: s, model: { treeDefinition: d, currentRootName: h, currentNode: S, ui: { showMarkers: O, showCompactText: L } } }) => ({ treeDefinition: d, editors: E, currentEditorName: s, currentRootName: h, currentNode: S, showMarkers: O, showCompactText: L }), { toggleModelShowCompactText: function() {
          return { type: "TOGGLE_MODEL_SHOW_COMPACT_TEXT" };
        }, setModelCurrentRootName: function(E) {
          return { type: "SET_MODEL_CURRENT_ROOT_NAME", currentRootName: E };
        }, toggleModelShowMarkers: function() {
          return { type: "TOGGLE_MODEL_SHOW_MARKERS" };
        }, setModelCurrentNode: function(E) {
          return { type: "SET_MODEL_CURRENT_NODE", currentNode: E };
        }, setModelActiveTab: He })(on);
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
          return (Pr = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var h in d) Object.prototype.hasOwnProperty.call(d, h) && (E[h] = d[h]);
            }
            return E;
          }).apply(this, arguments);
        }
        class Vn extends c.PureComponent {
          render() {
            const s = [];
            for (const d of this.props.lists) Object.keys(d.itemDefinitions).length && s.push(o.a.createElement("hr", { key: d.name + "-separator" }), o.a.createElement("h3", { key: d.name + "-header" }, o.a.createElement("a", { href: d.url, target: "_blank", rel: "noopener noreferrer" }, d.name), d.buttons && d.buttons.map((h, S) => o.a.createElement(yt, Pr({ key: "button" + S }, h)))), o.a.createElement(fr, { key: d.name + "-list", name: d.name, itemDefinitions: d.itemDefinitions, presentation: d.presentation, onPropertyTitleClick: d.onPropertyTitleClick }));
            return o.a.createElement("div", { className: "ck-inspector__object-inspector" }, o.a.createElement("h2", { className: "ck-inspector-code" }, this.props.header), s);
          }
        }
        var Nt = u(3);
        function xo() {
          return (xo = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var h in d) Object.prototype.hasOwnProperty.call(d, h) && (E[h] = d[h]);
            }
            return E;
          }).apply(this, arguments);
        }
        var kn = ({ styles: E = {}, ...s }) => o.a.createElement("svg", xo({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, s), o.a.createElement("path", { d: "M17 15.75a.75.75 0 01.102 1.493L17 17.25H9a.75.75 0 01-.102-1.493L9 15.75h8zM2.156 2.947l.095.058 7.58 5.401a.75.75 0 01.084 1.152l-.083.069-7.58 5.425a.75.75 0 01-.958-1.148l.086-.071 6.724-4.815-6.723-4.792a.75.75 0 01-.233-.95l.057-.096a.75.75 0 01.951-.233z" }));
        function Nr() {
          return (Nr = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var h in d) Object.prototype.hasOwnProperty.call(d, h) && (E[h] = d[h]);
            }
            return E;
          }).apply(this, arguments);
        }
        var Ca = ({ styles: E = {}, ...s }) => o.a.createElement("svg", Nr({ fill: "none", xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 19 19" }, s), o.a.createElement("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M6 1a1 1 0 011-1h5a1 1 0 011 1v5a1 1 0 01-1 1h-2v2h5a1 1 0 011 1v3h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3a1 1 0 011-1h1v-2.5a.5.5 0 00-.5-.5H10v3h1a1 1 0 011 1v3a1 1 0 01-1 1H8a1 1 0 01-1-1v-3a1 1 0 011-1h1v-3H4.5a.5.5 0 00-.5.5V13h1a1 1 0 011 1v3a1 1 0 01-1 1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1v-3a1 1 0 011-1h5V7H7a1 1 0 01-1-1V1zm1.5 4.5v-4h4v4h-4zm-5 11v-2h2v2h-2zm6-2v2h2v-2h-2zm6 2v-2h2v2h-2z", fill: "#000" }));
        class So extends c.Component {
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
            return s ? o.a.createElement(Vn, { header: [o.a.createElement("span", { key: "link" }, o.a.createElement("a", { href: s.url, target: "_blank", rel: "noopener noreferrer" }, o.a.createElement("b", null, s.type)), ":", s.type === "Text" ? o.a.createElement("em", null, s.name) : s.name), o.a.createElement(yt, { key: "log", icon: o.a.createElement(kn, null), text: "Log in console", onClick: this.handleNodeLogButtonClick }), o.a.createElement(yt, { key: "schema", icon: o.a.createElement(Ca, null), text: "Show in schema", onClick: this.handleNodeSchemaButtonClick })], lists: [{ name: "Attributes", url: s.url, itemDefinitions: s.attributes }, { name: "Properties", url: s.url, itemDefinitions: s.properties }] }) : o.a.createElement(Et, { isEmpty: "true" }, o.a.createElement("p", null, "Select a node in the tree to inspect"));
          }
        }
        var ki = Re(({ editors: E, currentEditorName: s, model: { currentNodeDefinition: d } }) => ({ editors: E, currentEditorName: s, currentNodeDefinition: d }), { setActiveTab: wt, setSchemaCurrentDefinitionName: ir })(So);
        function wi() {
          return (wi = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var h in d) Object.prototype.hasOwnProperty.call(d, h) && (E[h] = d[h]);
            }
            return E;
          }).apply(this, arguments);
        }
        var Dr = ({ styles: E = {}, ...s }) => o.a.createElement("svg", wi({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, s), o.a.createElement("path", { d: "M9.5 4.5c1.85 0 3.667.561 5.199 1.519C16.363 7.059 17.5 8.4 17.5 9.5s-1.137 2.441-2.801 3.481c-1.532.958-3.35 1.519-5.199 1.519-1.85 0-3.667-.561-5.199-1.519C2.637 11.941 1.5 10.6 1.5 9.5s1.137-2.441 2.801-3.481C5.833 5.06 7.651 4.5 9.5 4.5zm0 1a4 4 0 11-.2.005l.2-.005c-1.655 0-3.29.505-4.669 1.367C3.431 7.742 2.5 8.84 2.5 9.5c0 .66.931 1.758 2.331 2.633C6.21 12.995 7.845 13.5 9.5 13.5c1.655 0 3.29-.505 4.669-1.367 1.4-.875 2.331-1.974 2.331-2.633 0-.66-.931-1.758-2.331-2.633C12.79 6.005 11.155 5.5 9.5 5.5zM8 6.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" }));
        const pr = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_selection-Selection.html";
        class Ei extends c.Component {
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
            return o.a.createElement(Vn, { header: [o.a.createElement("span", { key: "link" }, o.a.createElement("a", { href: pr, target: "_blank", rel: "noopener noreferrer" }, o.a.createElement("b", null, "Selection"))), o.a.createElement(yt, { key: "log", icon: o.a.createElement(kn, null), text: "Log in console", onClick: this.handleSelectionLogButtonClick }), o.a.createElement(yt, { key: "scroll", icon: o.a.createElement(Dr, null), text: "Scroll to selection", onClick: this.handleScrollToSelectionButtonClick })], lists: [{ name: "Attributes", url: pr + "#function-getAttributes", itemDefinitions: d.attributes }, { name: "Properties", url: "" + pr, itemDefinitions: d.properties }, { name: "Anchor", url: pr + "#member-anchor", buttons: [{ icon: o.a.createElement(kn, null), text: "Log in console", onClick: () => Nt.a.log(s.model.document.selection.anchor) }], itemDefinitions: d.anchor }, { name: "Focus", url: pr + "#member-focus", buttons: [{ icon: o.a.createElement(kn, null), text: "Log in console", onClick: () => Nt.a.log(s.model.document.selection.focus) }], itemDefinitions: d.focus }, { name: "Ranges", url: pr + "#function-getRanges", buttons: [{ icon: o.a.createElement(kn, null), text: "Log in console", onClick: () => Nt.a.log(...s.model.document.selection.getRanges()) }], itemDefinitions: d.ranges, presentation: { expandCollapsibles: !0 } }] });
          }
        }
        var _i = Re(({ editors: E, currentEditorName: s, model: { ranges: d } }) => {
          const h = E.get(s);
          return { editor: h, currentEditorName: s, info: function(S, O) {
            const L = S.model.document.selection, ne = L.anchor, fe = L.focus, pe = { properties: { isCollapsed: { value: L.isCollapsed }, isBackward: { value: L.isBackward }, isGravityOverridden: { value: L.isGravityOverridden }, rangeCount: { value: L.rangeCount } }, attributes: {}, anchor: Rr(Object(cn.a)(ne)), focus: Rr(Object(cn.a)(fe)), ranges: {} };
            for (const [Ee, Ne] of L.getAttributes()) pe.attributes[Ee] = { value: Ne };
            O.forEach((Ee, Ne) => {
              pe.ranges[Ne] = { value: "", subProperties: { start: { value: "", subProperties: Object(ut.b)(Rr(Ee.start)) }, end: { value: "", subProperties: Object(ut.b)(Rr(Ee.end)) } } };
            });
            for (const Ee in pe) Ee !== "ranges" && (pe[Ee] = Object(ut.b)(pe[Ee]));
            return pe;
          }(h, d) };
        }, {})(Ei);
        function Rr({ path: E, stickiness: s, index: d, isAtEnd: h, isAtStart: S, offset: O, textNode: L }) {
          return { path: { value: E }, stickiness: { value: s }, index: { value: d }, isAtEnd: { value: h }, isAtStart: { value: S }, offset: { value: O }, textNode: { value: L } };
        }
        class Ta extends c.Component {
          render() {
            const s = function(S) {
              const O = {};
              for (const L of S) {
                const ne = L.name.split(":");
                let fe = O;
                for (const pe of ne) {
                  const Ee = pe === ne[ne.length - 1];
                  fe = fe[pe] ? fe[pe] : fe[pe] = Ee ? L : {};
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
            return Object.keys(s).length ? o.a.createElement(Vn, { header: [o.a.createElement("span", { key: "link" }, o.a.createElement("a", { href: "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_markercollection-Marker.html", target: "_blank", rel: "noopener noreferrer" }, o.a.createElement("b", null, "Markers"))), o.a.createElement(yt, { key: "log", icon: o.a.createElement(kn, null), text: "Log in console", onClick: () => Nt.a.log([...h.model.markers]) })], lists: [{ name: "Markers tree", itemDefinitions: d, presentation: { expandCollapsibles: !0 } }] }) : o.a.createElement(Et, { isEmpty: "true" }, o.a.createElement("p", null, "No markers in the document."));
          }
        }
        var Yo = Re(({ editors: E, currentEditorName: s, model: { markers: d } }) => ({ editors: E, currentEditorName: s, markers: d }), {})(Ta);
        function xi({ name: E, start: s, end: d, affectsData: h, managedUsingOperations: S }) {
          return { name: { value: E }, start: { value: s.path }, end: { value: d.path }, affectsData: { value: h }, managedUsingOperations: { value: S } };
        }
        u(74);
        class qo extends c.Component {
          render() {
            return this.props.currentEditorName ? o.a.createElement(Et, { splitVertically: "true" }, o.a.createElement(Kn, null), o.a.createElement(vn, null, o.a.createElement(Qt, { onTabChange: this.props.setModelActiveTab, activeTab: this.props.activeTab }, o.a.createElement(ki, { label: "Inspect" }), o.a.createElement(_i, { label: "Selection" }), o.a.createElement(Yo, { label: "Markers" })))) : o.a.createElement(Et, { isEmpty: "true" }, o.a.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
          }
        }
        var Oa = Re(({ currentEditorName: E, model: { ui: { activeTab: s } } }) => ({ currentEditorName: E, activeTab: s }), { setModelActiveTab: He })(qo);
        class Pa extends c.Component {
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
            return o.a.createElement(Wt, null, [o.a.createElement("div", { className: "ck-inspector-tree__config", key: "root-cfg" }, o.a.createElement(rn, { id: "view-root-select", label: "Root", value: this.props.currentRootName, options: Object(en.d)(s).map((d) => d.rootName), onChange: this.handleRootChange })), o.a.createElement("span", { className: "ck-inspector-separator", key: "separator" }), o.a.createElement("div", { className: "ck-inspector-tree__config", key: "types-cfg" }, o.a.createElement(Ht, { label: "Show element types", id: "view-show-types", isChecked: this.props.showElementTypes, onChange: this.props.toggleViewShowElementTypes }))], o.a.createElement(Ut.a, { definition: this.props.treeDefinition, textDirection: s.locale.contentLanguageDirection, onClick: this.handleTreeClick, showCompactText: "true", showElementTypes: this.props.showElementTypes, activeNode: this.props.currentNode }));
          }
        }
        var Co = Re(({ editors: E, currentEditorName: s, view: { treeDefinition: d, currentRootName: h, currentNode: S, ui: { showElementTypes: O } } }) => ({ treeDefinition: d, editors: E, currentEditorName: s, currentRootName: h, currentNode: S, showElementTypes: O }), { setViewCurrentRootName: function(E) {
          return { type: "SET_VIEW_CURRENT_ROOT_NAME", currentRootName: E };
        }, toggleViewShowElementTypes: function() {
          return { type: "TOGGLE_VIEW_SHOW_ELEMENT_TYPES" };
        }, setViewCurrentNode: function(E) {
          return { type: "SET_VIEW_CURRENT_NODE", currentNode: E };
        }, setViewActiveTab: _r })(Pa);
        class mt extends c.Component {
          constructor(s) {
            super(s), this.handleNodeLogButtonClick = this.handleNodeLogButtonClick.bind(this);
          }
          handleNodeLogButtonClick() {
            Nt.a.log(this.props.currentNodeDefinition.editorNode);
          }
          render() {
            const s = this.props.currentNodeDefinition;
            return s ? o.a.createElement(Vn, { header: [o.a.createElement("span", { key: "link" }, o.a.createElement("a", { href: s.url, target: "_blank", rel: "noopener noreferrer" }, o.a.createElement("b", null, s.type), ":"), s.type === "Text" ? o.a.createElement("em", null, s.name) : s.name), o.a.createElement(yt, { key: "log", icon: o.a.createElement(kn, null), text: "Log in console", onClick: this.handleNodeLogButtonClick })], lists: [{ name: "Attributes", url: s.url, itemDefinitions: s.attributes }, { name: "Properties", url: s.url, itemDefinitions: s.properties }, { name: "Custom Properties", url: en.a + "_element-Element.html#function-getCustomProperty", itemDefinitions: s.customProperties }] }) : o.a.createElement(Et, { isEmpty: "true" }, o.a.createElement("p", null, "Select a node in the tree to inspect"));
          }
        }
        var Jr = Re(({ view: { currentNodeDefinition: E } }) => ({ currentNodeDefinition: E }), {})(mt);
        const eo = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_view_selection-Selection.html";
        class Na extends c.Component {
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
            return o.a.createElement(Vn, { header: [o.a.createElement("span", { key: "link" }, o.a.createElement("a", { href: eo, target: "_blank", rel: "noopener noreferrer" }, o.a.createElement("b", null, "Selection"))), o.a.createElement(yt, { key: "log", icon: o.a.createElement(kn, null), text: "Log in console", onClick: this.handleSelectionLogButtonClick }), o.a.createElement(yt, { key: "scroll", icon: o.a.createElement(Dr, null), text: "Scroll to selection", onClick: this.handleScrollToSelectionButtonClick })], lists: [{ name: "Properties", url: "" + eo, itemDefinitions: d.properties }, { name: "Anchor", url: eo + "#member-anchor", buttons: [{ type: "log", text: "Log in console", onClick: () => Nt.a.log(s.editing.view.document.selection.anchor) }], itemDefinitions: d.anchor }, { name: "Focus", url: eo + "#member-focus", buttons: [{ type: "log", text: "Log in console", onClick: () => Nt.a.log(s.editing.view.document.selection.focus) }], itemDefinitions: d.focus }, { name: "Ranges", url: eo + "#function-getRanges", buttons: [{ type: "log", text: "Log in console", onClick: () => Nt.a.log(...s.editing.view.document.selection.getRanges()) }], itemDefinitions: d.ranges, presentation: { expandCollapsibles: !0 } }] });
          }
        }
        var To = Re(({ editors: E, currentEditorName: s, view: { ranges: d } }) => {
          const h = E.get(s);
          return { editor: h, currentEditorName: s, info: function(S, O) {
            const L = S.editing.view.document.selection, ne = { properties: { isCollapsed: { value: L.isCollapsed }, isBackward: { value: L.isBackward }, isFake: { value: L.isFake }, rangeCount: { value: L.rangeCount } }, anchor: Ar(Object(Yt.a)(L.anchor)), focus: Ar(Object(Yt.a)(L.focus)), ranges: {} };
            O.forEach((fe, pe) => {
              ne.ranges[pe] = { value: "", subProperties: { start: { value: "", subProperties: Object(ut.b)(Ar(fe.start)) }, end: { value: "", subProperties: Object(ut.b)(Ar(fe.end)) } } };
            });
            for (const fe in ne) fe !== "ranges" && (ne[fe] = Object(ut.b)(ne[fe]));
            return ne;
          }(h, d) };
        }, {})(Na);
        function Ar({ offset: E, isAtEnd: s, isAtStart: d, parent: h }) {
          return { offset: { value: E }, isAtEnd: { value: s }, isAtStart: { value: d }, parent: { value: h } };
        }
        class to extends c.Component {
          render() {
            return this.props.currentEditorName ? o.a.createElement(Et, { splitVertically: "true" }, o.a.createElement(Co, null), o.a.createElement(vn, null, o.a.createElement(Qt, { onTabChange: this.props.setViewActiveTab, activeTab: this.props.activeTab }, o.a.createElement(Jr, { label: "Inspect" }), o.a.createElement(To, { label: "Selection" })))) : o.a.createElement(Et, { isEmpty: "true" }, o.a.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
          }
        }
        var Da = Re(({ currentEditorName: E, view: { ui: { activeTab: s } } }) => ({ currentEditorName: E, activeTab: s }), { setViewActiveTab: _r, updateViewState: wo })(to);
        class Si extends c.Component {
          constructor(s) {
            super(s), this.handleTreeClick = this.handleTreeClick.bind(this);
          }
          handleTreeClick(s, d) {
            s.persist(), s.stopPropagation(), this.props.setCommandsCurrentCommandName(d);
          }
          render() {
            return o.a.createElement(Wt, null, o.a.createElement(Ut.a, { definition: this.props.treeDefinition, onClick: this.handleTreeClick, activeNode: this.props.currentCommandName }));
          }
        }
        var Ci = Re(({ commands: { treeDefinition: E, currentCommandName: s } }) => ({ treeDefinition: E, currentCommandName: s }), { setCommandsCurrentCommandName: function(E) {
          return { type: "SET_COMMANDS_CURRENT_COMMAND_NAME", currentCommandName: E };
        } })(Si);
        function Ti() {
          return (Ti = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var h in d) Object.prototype.hasOwnProperty.call(d, h) && (E[h] = d[h]);
            }
            return E;
          }).apply(this, arguments);
        }
        var Ko = ({ styles: E = {}, ...s }) => o.a.createElement("svg", Ti({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, s), o.a.createElement("path", { d: "M9.25 1.25a8 8 0 110 16 8 8 0 010-16zm0 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM7.344 6.485l4.98 2.765-4.98 3.018V6.485z" }));
        class Qo extends c.Component {
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
            return s ? o.a.createElement(Vn, { header: [o.a.createElement("span", { key: "link" }, o.a.createElement("a", { href: s.url, target: "_blank", rel: "noopener noreferrer" }, o.a.createElement("b", null, s.type)), ":", this.props.currentCommandName), o.a.createElement(yt, { key: "exec", icon: o.a.createElement(Ko, null), text: "Execute command", onClick: this.handleCommandExecuteButtonClick }), o.a.createElement(yt, { key: "log", icon: o.a.createElement(kn, null), text: "Log in console", onClick: this.handleCommandLogButtonClick })], lists: [{ name: "Properties", url: s.url, itemDefinitions: s.properties }] }) : o.a.createElement(Et, { isEmpty: "true" }, o.a.createElement("p", null, "Select a command to inspect"));
          }
        }
        var Oi = Re(({ editors: E, currentEditorName: s, commands: { currentCommandName: d, currentCommandDefinition: h } }) => ({ editors: E, currentEditorName: s, currentCommandName: d, currentCommandDefinition: h }), {})(Qo);
        class Wn extends c.Component {
          render() {
            return this.props.currentEditorName ? o.a.createElement(Et, { splitVertically: "true" }, o.a.createElement(Ci, null), o.a.createElement(vn, null, o.a.createElement(Qt, { activeTab: "Inspect" }, o.a.createElement(Oi, { label: "Inspect" })))) : o.a.createElement(Et, { isEmpty: "true" }, o.a.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
          }
        }
        var Oo = Re(({ currentEditorName: E }) => ({ currentEditorName: E }), { updateCommandsState: Sr })(Wn);
        class Go extends c.Component {
          constructor(s) {
            super(s), this.handleTreeClick = this.handleTreeClick.bind(this);
          }
          handleTreeClick(s, d) {
            s.persist(), s.stopPropagation(), this.props.setSchemaCurrentDefinitionName(d);
          }
          render() {
            return o.a.createElement(Wt, null, o.a.createElement(Ut.a, { definition: this.props.treeDefinition, onClick: this.handleTreeClick, activeNode: this.props.currentSchemaDefinitionName }));
          }
        }
        var Pi = Re(({ schema: { treeDefinition: E, currentSchemaDefinitionName: s } }) => ({ treeDefinition: E, currentSchemaDefinitionName: s }), { setSchemaCurrentDefinitionName: ir })(Go);
        class Ni extends c.Component {
          render() {
            const s = this.props.currentSchemaDefinition;
            return s ? o.a.createElement(Vn, { header: [o.a.createElement("span", { key: "link" }, o.a.createElement("a", { href: s.urls.general, target: "_blank", rel: "noopener noreferrer" }, o.a.createElement("b", null, s.type)), ":", this.props.currentSchemaDefinitionName)], lists: [{ name: "Properties", url: s.urls.general, itemDefinitions: s.properties }, { name: "Allowed attributes", url: s.urls.allowAttributes, itemDefinitions: s.allowAttributes }, { name: "Allowed children", url: s.urls.allowChildren, itemDefinitions: s.allowChildren, onPropertyTitleClick: (d) => {
              this.props.setSchemaCurrentDefinitionName(d);
            } }, { name: "Allowed in", url: s.urls.allowIn, itemDefinitions: s.allowIn, onPropertyTitleClick: (d) => {
              this.props.setSchemaCurrentDefinitionName(d);
            } }] }) : o.a.createElement(Et, { isEmpty: "true" }, o.a.createElement("p", null, "Select a schema definition to inspect"));
          }
        }
        var Di = Re(({ editors: E, currentEditorName: s, schema: { currentSchemaDefinitionName: d, currentSchemaDefinition: h } }) => ({ editors: E, currentEditorName: s, currentSchemaDefinitionName: d, currentSchemaDefinition: h }), { setSchemaCurrentDefinitionName: ir })(Ni);
        class Xo extends c.Component {
          render() {
            return this.props.currentEditorName ? o.a.createElement(Et, { splitVertically: "true" }, o.a.createElement(Pi, null), o.a.createElement(vn, null, o.a.createElement(Qt, { activeTab: "Inspect" }, o.a.createElement(Di, { label: "Inspect" })))) : o.a.createElement(Et, { isEmpty: "true" }, o.a.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
          }
        }
        var Zo = Re(({ currentEditorName: E }) => ({ currentEditorName: E }))(Xo), Jo = u(47), Ri = u.n(Jo), ei = u(48), ti = u.n(ei);
        function Ai() {
          return (Ai = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var h in d) Object.prototype.hasOwnProperty.call(d, h) && (E[h] = d[h]);
            }
            return E;
          }).apply(this, arguments);
        }
        var Mr = ({ styles: E = {}, ...s }) => o.a.createElement("svg", Ai({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, s), o.a.createElement("path", { d: "M12.936 0l5 4.5v12.502l-1.504-.001v.003h1.504v1.499h-5v-1.501l3.496-.001V5.208L12.21 1.516 3.436 1.5v15.504l3.5-.001v1.5h-5V0h11z" }), o.a.createElement("path", { d: "M10.374 9.463l.085.072.477.464L11 10v.06l3.545 3.453-1.047 1.075L11 12.155V19H9v-6.9l-2.424 2.476-1.072-1.05L9.4 9.547a.75.75 0 01.974-.084zM12.799 1.5l-.001 2.774h3.645v1.5h-5.144V1.5z" }));
        u(86);
        class Mi extends c.Component {
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
        function Po() {
          return (Po = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var h in d) Object.prototype.hasOwnProperty.call(d, h) && (E[h] = d[h]);
            }
            return E;
          }).apply(this, arguments);
        }
        var Qn = ({ styles: E = {}, ...s }) => o.a.createElement("svg", Po({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, s), o.a.createElement("path", { d: "M12.936 0l5 4.5v14.003h-4.503L14.936 17h-10l1.503 1.503H1.936V0h11zm-9.5 1.5v15.504h12.996V5.208L12.21 1.516 3.436 1.5z" }), o.a.createElement("path", { d: "M12.799 1.5l-.001 2.774h3.645v1.5h-5.144V1.5zM9.675 18.859l-.085-.072-4.086-3.978 1.047-1.075L9 16.119V9h2v7.273l2.473-2.526 1.072 1.049-3.896 3.979a.75.75 0 01-.974.084z" }));
        function no() {
          return (no = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var h in d) Object.prototype.hasOwnProperty.call(d, h) && (E[h] = d[h]);
            }
            return E;
          }).apply(this, arguments);
        }
        var ro = ({ styles: E = {}, ...s }) => o.a.createElement("svg", no({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, s), o.a.createElement("path", { d: "M3.144 15.748l2.002 1.402-1.976.516-.026-1.918zM2.438 3.391l15.346 11.023-.875 1.218-5.202-3.736-2.877 4.286.006.005-3.055.797-2.646-1.852-.04-2.95-.006-.005.006-.008v-.025l.01.008L6.02 7.81l-4.457-3.2.876-1.22zM7.25 8.695l-2.13 3.198 3.277 2.294 2.104-3.158-3.25-2.334zM14.002 0l2.16 1.512-.856 1.222c.828.967 1.144 2.141.432 3.158l-2.416 3.599-1.214-.873 2.396-3.593.005.003c.317-.452-.16-1.332-1.064-1.966-.891-.624-1.865-.776-2.197-.349l-.006-.004-2.384 3.575-1.224-.879 2.376-3.539c.674-.932 1.706-1.155 3.096-.668l.046.018.85-1.216z" }));
        function Ir() {
          return (Ir = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var h in d) Object.prototype.hasOwnProperty.call(d, h) && (E[h] = d[h]);
            }
            return E;
          }).apply(this, arguments);
        }
        var oo = ({ styles: E = {}, ...s }) => o.a.createElement("svg", Ir({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, s), o.a.createElement("path", { d: "M11.28 1a1 1 0 01.948.684l.333 1 .018.066H16a.75.75 0 01.102 1.493L16 4.25h-.5V16a2 2 0 01-2 2h-8a2 2 0 01-2-2V4.25H3a.75.75 0 01-.102-1.493L3 2.75h3.42a1 1 0 01.019-.066l.333-1A1 1 0 017.721 1h3.558zM14 4.5H5V16a.5.5 0 00.41.492l.09.008h8a.5.5 0 00.492-.41L14 16V4.5zM7.527 6.06v8.951h-1V6.06h1zm5 0v8.951h-1V6.06h1zM10 6.06v8.951H9V6.06h1z" }));
        function Gn() {
          return (Gn = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var h in d) Object.prototype.hasOwnProperty.call(d, h) && (E[h] = d[h]);
            }
            return E;
          }).apply(this, arguments);
        }
        var ni = ({ styles: E = {}, ...s }) => o.a.createElement("svg", Gn({ viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg" }, s), o.a.createElement("path", { d: "M2.284 2.498c-.239.266-.184.617-.184 1.002V4H2a.5.5 0 00-.492.41L1.5 4.5V17a1 1 0 00.883.993L2.5 18h10a1 1 0 00.97-.752l-.081-.062c.438.368.976.54 1.507.526a2.5 2.5 0 01-2.232 1.783l-.164.005h-10a2.5 2.5 0 01-2.495-2.336L0 17V4.5a2 2 0 011.85-1.995L2 2.5l.284-.002zm10.532 0L13 2.5a2 2 0 011.995 1.85L15 4.5v2.28a2.243 2.243 0 00-1.5.404V4.5a.5.5 0 00-.41-.492L13 4v-.5l-.007-.144c-.031-.329.032-.626-.177-.858z" }), o.a.createElement("path", { d: "M6 .49l-.144.006a1.75 1.75 0 00-1.41.94l-.029.058.083-.004c-.69 0-1.25.56-1.25 1.25v1c0 .69.56 1.25 1.25 1.25h6c.69 0 1.25-.56 1.25-1.25v-1l-.006-.128a1.25 1.25 0 00-1.116-1.116l-.046-.002-.027-.058A1.75 1.75 0 009 .49H6zm0 1.5h3a.25.25 0 01.25.25l.007.102A.75.75 0 0010 2.99h.25v.5h-5.5v-.5H5a.75.75 0 00.743-.648l.007-.102A.25.25 0 016 1.99zm9.374 6.55a.75.75 0 01-.093 1.056l-2.33 1.954h6.127a.75.75 0 010 1.501h-5.949l2.19 1.837a.75.75 0 11-.966 1.15l-3.788-3.18a.747.747 0 01-.21-.285.75.75 0 01.17-.945l3.792-3.182a.75.75 0 011.057.093z" }));
        function Rn() {
          return (Rn = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var h in d) Object.prototype.hasOwnProperty.call(d, h) && (E[h] = d[h]);
            }
            return E;
          }).apply(this, arguments);
        }
        var Ii = ({ styles: E = {}, ...s }) => o.a.createElement("svg", Rn({ viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg" }, s), o.a.createElement("path", { fill: "#4fa800", d: "M6.972 16.615a.997.997 0 01-.744-.292l-4.596-4.596a1 1 0 111.414-1.414l3.926 3.926 9.937-9.937a1 1 0 011.414 1.415L7.717 16.323a.997.997 0 01-.745.292z" }));
        u(88);
        class ji extends c.Component {
          constructor(s) {
            super(s), this.state = { isShiftKeyPressed: !1, wasEditorDataJustCopied: !1 }, this._keyDownHandler = this._handleKeyDown.bind(this), this._keyUpHandler = this._handleKeyUp.bind(this), this._readOnlyHandler = this._handleReadOnly.bind(this), this._editorDataJustCopiedTimeout = null;
          }
          render() {
            return o.a.createElement("div", { className: "ck-inspector-editor-quick-actions" }, o.a.createElement(yt, { text: "Log editor", icon: o.a.createElement(kn, null), isEnabled: !!this.props.editor, onClick: () => console.log(this.props.editor) }), this._getLogButton(), o.a.createElement(Mi, { editor: this.props.editor }), o.a.createElement(yt, { text: "Toggle read only", icon: o.a.createElement(ro, null), isOn: this.props.isReadOnly, isEnabled: !!this.props.editor, onClick: this._readOnlyHandler }), o.a.createElement(yt, { text: "Destroy editor", icon: o.a.createElement(oo, null), isEnabled: !!this.props.editor, onClick: () => {
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
            return this.state.wasEditorDataJustCopied ? (s = o.a.createElement(Ii, null), d = "Data copied to clipboard.") : (s = this.state.isShiftKeyPressed ? o.a.createElement(ni, null) : o.a.createElement(Qn, null), d = "Log editor data (press with Shift to copy)"), o.a.createElement(yt, { text: d, icon: s, className: this.state.wasEditorDataJustCopied ? "ck-inspector-button_data-copied" : "", isEnabled: !!this.props.editor, onClick: this._handleLogEditorDataClick.bind(this) });
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
        var Ra = Re(({ editors: E, currentEditorName: s, currentEditorGlobals: { isReadOnly: d } }) => ({ editor: E.get(s), isReadOnly: d }), {})(ji);
        function No() {
          return (No = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var h in d) Object.prototype.hasOwnProperty.call(d, h) && (E[h] = d[h]);
            }
            return E;
          }).apply(this, arguments);
        }
        var Aa = ({ styles: E = {}, ...s }) => o.a.createElement("svg", No({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, s), o.a.createElement("path", { d: "M17.03 6.47a.75.75 0 01.073.976l-.072.084-6.984 7a.75.75 0 01-.977.073l-.084-.072-7.016-7a.75.75 0 01.976-1.134l.084.072 6.485 6.47 6.454-6.469a.75.75 0 01.977-.073l.084.072z" }));
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
            return this.props.isCollapsed ? (document.body.classList.remove("ck-inspector-body-expanded"), document.body.classList.add("ck-inspector-body-collapsed")) : (document.body.classList.remove("ck-inspector-body-collapsed"), document.body.classList.add("ck-inspector-body-expanded")), o.a.createElement(Or, { bounds: "window", enableResizing: { top: !this.props.isCollapsed }, disableDragging: !0, minHeight: "100", maxHeight: "100%", style: jr, className: ["ck-inspector", this.props.isCollapsed ? "ck-inspector_collapsed" : ""].join(" "), position: { x: 0, y: "100%" }, size: { width: "100%", height: this.props.isCollapsed ? 30 : this.props.height }, onResizeStop: this.handleInspectorResize }, o.a.createElement(Qt, { onTabChange: this.props.setActiveTab, contentBefore: o.a.createElement(Do, { key: "docs" }), activeTab: this.props.activeTab, contentAfter: [o.a.createElement(an, { key: "selector" }), o.a.createElement("span", { className: "ck-inspector-separator", key: "separator-a" }), o.a.createElement(Ra, { key: "quick-actions" }), o.a.createElement("span", { className: "ck-inspector-separator", key: "separator-b" }), o.a.createElement(Ro, { key: "inspector-toggle" })] }, o.a.createElement(Oa, { label: "Model" }), o.a.createElement(Da, { label: "View" }), o.a.createElement(Oo, { label: "Commands" }), o.a.createElement(Zo, { label: "Schema" })));
          }
          componentWillUnmount() {
            document.body.classList.remove("ck-inspector-body-expanded"), document.body.classList.remove("ck-inspector-body-collapsed");
          }
        }
        var ri = Re(({ editors: E, currentEditorName: s, ui: { isCollapsed: d, height: h, activeTab: S } }) => ({ isCollapsed: d, height: h, editors: E, currentEditorName: s, activeTab: S }), { toggleIsCollapsed: At, setHeight: function(E) {
          return { type: "SET_HEIGHT", newHeight: E };
        }, setEditors: kt, setCurrentEditorName: Jt, setActiveTab: wt })(hr);
        class Do extends c.Component {
          render() {
            return o.a.createElement("a", { className: "ck-inspector-navbox__navigation__logo", title: "Go to the documentation", href: "https://ckeditor.com/docs/ckeditor5/latest/", target: "_blank", rel: "noopener noreferrer" }, "CKEditor documentation");
          }
        }
        class zi extends c.Component {
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
            (function(d) {
              return d.altKey && !d.shiftKey && !d.ctrlKey && d.key === "F12";
            })(s) && this.props.toggleIsCollapsed();
          }
        }
        const Ro = Re(({ ui: { isCollapsed: E } }) => ({ isCollapsed: E }), { toggleIsCollapsed: At })(zi);
        class Ao extends c.Component {
          render() {
            return o.a.createElement("div", { className: "ck-inspector-editor-selector", key: "editor-selector" }, this.props.currentEditorName ? o.a.createElement(rn, { id: "inspector-editor-selector", label: "Instance", value: this.props.currentEditorName, options: [...this.props.editors].map(([s]) => s), onChange: (s) => this.props.setCurrentEditorName(s.target.value) }) : "");
          }
        }
        const an = Re(({ currentEditorName: E, editors: s }) => ({ currentEditorName: E, editors: s }), { setCurrentEditorName: Jt })(Ao);
        function Li(E) {
          document.body.style.setProperty("--ck-inspector-height", E);
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
            m.a.unmountComponentAtNode($e._wrapper), $e._editors.clear(), $e._wrapper.remove();
            const s = $e._store.getState(), d = s.editors.get(s.currentEditorName);
            d && $e._editorListener.stopListening(d), $e._editorListener = null, $e._wrapper = null, $e._store = null;
          }
          static _updateEditorsState() {
            $e._store.dispatch(kt($e._editors));
          }
          static _mount(s) {
            if ($e._wrapper) return;
            const d = $e._wrapper = document.createElement("div");
            let h, S;
            d.className = "ck-inspector-wrapper", document.body.appendChild(d), $e._editorListener = new Er({ onModelChange() {
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
            }), m.a.render(o.a.createElement(V, { store: $e._store }, o.a.createElement(ri, null)), d);
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
var _u = Eu();
const xu = /* @__PURE__ */ wu(_u);
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
const Su = function(xe) {
  const A = xe.plugins.get(ec), g = $(xe.ui.view.element), i = $(xe.sourceElement), u = `ckeditor${Math.floor(Math.random() * 1e9)}`, c = [
    "keypress",
    "keyup",
    "change",
    "focus",
    "blur",
    "click",
    "mousedown",
    "mouseup"
  ].map((o) => `${o}.${u}`).join(" ");
  A.on("change:isSourceEditingMode", () => {
    const o = g.find(
      ".ck-source-editing-area"
    );
    if (A.isSourceEditingMode) {
      let _ = o.attr("data-value");
      o.on(c, () => {
        _ !== (_ = o.attr("data-value")) && i.val(_);
      });
    } else
      o.off(`.${u}`);
  });
}, Cu = function(xe, A) {
  if (A.heading !== void 0) {
    var g = A.heading.options;
    g.find((i) => i.view === "h1") !== void 0 && xe.keystrokes.set(
      "Ctrl+Alt+1",
      () => xe.execute("heading", { value: "heading1" })
    ), g.find((i) => i.view === "h2") !== void 0 && xe.keystrokes.set(
      "Ctrl+Alt+2",
      () => xe.execute("heading", { value: "heading2" })
    ), g.find((i) => i.view === "h3") !== void 0 && xe.keystrokes.set(
      "Ctrl+Alt+3",
      () => xe.execute("heading", { value: "heading3" })
    ), g.find((i) => i.view === "h4") !== void 0 && xe.keystrokes.set(
      "Ctrl+Alt+4",
      () => xe.execute("heading", { value: "heading4" })
    ), g.find((i) => i.view === "h5") !== void 0 && xe.keystrokes.set(
      "Ctrl+Alt+5",
      () => xe.execute("heading", { value: "heading5" })
    ), g.find((i) => i.view === "h6") !== void 0 && xe.keystrokes.set(
      "Ctrl+Alt+6",
      () => xe.execute("heading", { value: "heading6" })
    ), g.find((i) => i.model === "paragraph") !== void 0 && xe.keystrokes.set("Ctrl+Alt+p", "paragraph");
  }
}, Tu = function(xe, A) {
  let g = null;
  const i = xe.editing.view.document, u = xe.plugins.get("ClipboardPipeline");
  i.on("clipboardOutput", (c, o) => {
    g = xe.id;
  }), i.on("clipboardInput", async (c, o) => {
    let _ = o.dataTransfer.getData("text/html");
    if (_ && _.includes("<craft-entry") && !(o.method == "drop" && g === xe.id)) {
      if (o.method == "paste" || o.method == "drop" && g !== xe.id) {
        let m = _, b = !1;
        const v = Craft.siteId;
        let y = null, C = null;
        const x = xe.getData(), N = [..._.matchAll(/data-entry-id="([0-9]+)/g)];
        c.stop();
        const G = $(xe.ui.view.element);
        let j = G.parents("form").data("elementEditor");
        await j.ensureIsDraftOrRevision(), y = j.settings.elementId, C = G.parents(".field").data("layoutElement");
        for (let B = 0; B < N.length; B++) {
          let P = null;
          if (N[B][1] && (P = N[B][1]), P !== null) {
            const I = new RegExp('data-entry-id="' + P + '"');
            if (!(g === xe.id && !I.test(x))) {
              let V = null;
              g !== xe.id && (A.includes(gu) ? V = xe.config.get("entryTypeOptions").map((R) => R.value) : (Craft.cp.displayError(
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
                    siteId: v,
                    targetEntryTypeIds: V,
                    targetOwnerId: y,
                    targetLayoutElementUid: C
                  }
                }
              ).then((R) => {
                R.data.newEntryId && (m = m.replace(
                  P,
                  R.data.newEntryId
                ));
              }).catch((R) => {
                var oe, Q, z, M;
                b = !0, Craft.cp.displayError((Q = (oe = R == null ? void 0 : R.response) == null ? void 0 : oe.data) == null ? void 0 : Q.message), console.error((M = (z = R == null ? void 0 : R.response) == null ? void 0 : z.data) == null ? void 0 : M.additionalMessage);
              });
            }
          }
        }
        b || (o.content = xe.data.htmlProcessor.toView(m), u.fire("inputTransformation", o));
      }
    }
  });
}, Au = async function(xe, A) {
  typeof xe == "string" && (xe = document.querySelector(`#${xe}`)), A.licenseKey = "GPL";
  const g = await ru.create(xe, A);
  return Craft.showCkeditorInspector && Craft.userIsAdmin && xu.attach(g), g.editing.view.change((i) => {
    const u = g.editing.view.document.getRoot();
    if (typeof A.accessibleFieldName < "u" && A.accessibleFieldName.length) {
      let c = u.getAttribute("aria-label");
      i.setAttribute(
        "aria-label",
        A.accessibleFieldName + ", " + c,
        u
      );
    }
    typeof A.describedBy < "u" && A.describedBy.length && i.setAttribute(
      "aria-describedby",
      A.describedBy,
      u
    );
  }), g.updateSourceElement(), g.model.document.on("change:data", () => {
    g.updateSourceElement();
  }), A.plugins.includes(ec) && Su(g), A.plugins.includes(ou) && Cu(g, A), Tu(g, A.plugins), g;
};
export {
  gu as CraftEntries,
  Pu as CraftImageInsertUI,
  Ru as CraftLink,
  Du as ImageEditor,
  Nu as ImageTransform,
  Au as create
};
