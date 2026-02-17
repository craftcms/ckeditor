import { ImageInsertUI as Bc, ButtonView as qo, IconImage as Hc, Command as Os, Plugin as Vn, ImageUtils as Jl, Collection as Yo, ViewModel as Ko, createDropdown as ki, DropdownButtonView as Wc, IconObjectSizeMedium as $c, addListToDropdown as Ei, Widget as qc, viewToModelPositionOutsideModelElement as Yc, toWidget as Kc, DomEventObserver as Qc, View as Gr, IconPlus as ec, WidgetToolbarRepository as Gl, isWidget as Gc, findAttributeRange as Xc, LinkUI as Xl, ContextualBalloon as Zc, Range as Jc, SwitchButtonView as eu, LabeledFieldView as tu, createLabeledInputText as nu, ClassicEditor as ru, SourceEditing as tc, Heading as ou } from "ckeditor5";
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class Nu extends Bc {
  static get pluginName() {
    return "CraftImageInsertUI";
  }
  constructor() {
    super(...arguments), this.$container = null, this.progressBar = null, this.$fileInput = null, this.uploader = null;
  }
  init() {
    if (!this._assetSources) {
      console.warn(
        'Omitting the "image" CKEditor toolbar button, because there aren’t any permitted volumes.'
      );
      return;
    }
    const D = this.editor.ui.componentFactory, p = (i) => this._createToolbarImageButton(i);
    D.add("insertImage", p), D.add("imageInsert", p), this._attachUploader();
  }
  get _assetSources() {
    return this.editor.config.get("assetSources");
  }
  _createToolbarImageButton(D) {
    const p = this.editor, i = p.t, l = new qo(D);
    l.isEnabled = !0, l.label = i("Insert image"), l.icon = Hc, l.tooltip = !0;
    const u = p.commands.get("insertImage");
    return l.bind("isEnabled").to(u), this.listenTo(l, "execute", () => this._showImageSelectModal()), l;
  }
  _showImageSelectModal() {
    const D = this._assetSources, p = this.editor, i = p.config, l = Object.assign({}, i.get("assetSelectionCriteria"), {
      kind: "image"
    });
    Craft.createElementSelectorModal("craft\\elements\\Asset", {
      storageKey: `ckeditor:${this.pluginName}:'craft\\elements\\Asset'`,
      sources: D,
      criteria: l,
      defaultSiteId: i.get("elementSiteId"),
      transforms: i.get("transforms"),
      multiSelect: !0,
      autoFocusSearchBox: !1,
      onSelect: (u, r) => {
        this._processAssetUrls(u, r).then(() => {
          p.editing.view.focus();
        });
      },
      onHide: () => {
        p.editing.view.focus();
      },
      closeOtherModals: !1
    });
  }
  _processAssetUrls(D, p) {
    return new Promise((i) => {
      if (!D.length) {
        i();
        return;
      }
      const l = this.editor, u = l.config.get("defaultTransform"), r = new Craft.Queue(), _ = [];
      r.on("afterRun", () => {
        l.execute("insertImage", { source: _ }), i();
      });
      for (const m of D)
        r.push(
          () => new Promise((b) => {
            const y = this._isTransformUrl(m.url);
            if (!y && u)
              this._getTransformUrl(m.id, u, (v) => {
                _.push(v), b();
              });
            else {
              const v = this._buildAssetUrl(
                m.id,
                m.url,
                y ? p : u
              );
              _.push(v), b();
            }
          })
        );
    });
  }
  _buildAssetUrl(D, p, i) {
    return `${p}#asset:${D}:${i ? "transform:" + i : "url"}`;
  }
  _removeTransformFromUrl(D) {
    return D.replace(/(^|\/)(_[^\/]+\/)([^\/]+)$/, "$1$3");
  }
  _isTransformUrl(D) {
    return /(^|\/)_[^\/]+\/[^\/]+$/.test(D);
  }
  _getTransformUrl(D, p, i) {
    Craft.sendActionRequest("POST", "ckeditor/ckeditor/image-url", {
      data: {
        assetId: D,
        transform: p
      }
    }).then(({ data: l }) => {
      i(this._buildAssetUrl(D, l.url, p));
    }).catch(() => {
      alert("There was an error generating the transform URL.");
    });
  }
  _getAssetUrlComponents(D) {
    const p = D.match(
      /(.*)#asset:(\d+):(url|transform):?([a-zA-Z][a-zA-Z0-9_]*)?/
    );
    return p ? {
      url: p[1],
      assetId: p[2],
      transform: p[3] !== "url" ? p[4] : null
    } : null;
  }
  /**
   * Attach the uploader with drag event handler
   */
  _attachUploader() {
    let D = this.editor, p = D.config.get("assetUploadParams") ?? null;
    if (!(!p || !p.folderId)) {
      this.$container = $(D.sourceElement).parents(".input"), this.progressBar = new Craft.ProgressBar(
        $('<div class="progress-shade"></div>').appendTo(this.$container)
      ), this.$fileInput = $("<input/>", {
        type: "file",
        class: "hidden",
        multiple: !1
      }).insertAfter(D.sourceElement);
      var i = {
        dropZone: this.$container,
        fileInput: this.$fileInput
      };
      p.kind && (i.allowedKinds = p.kind), i.canAddMoreFiles = !0, i.events = {}, i.events.fileuploadstart = this._onUploadStart.bind(this), i.events.fileuploadprogressall = this._onUploadProgress.bind(this), i.events.fileuploaddone = this._onUploadComplete.bind(this), i.events.fileuploadfail = this._onUploadFailure.bind(this), this.uploader = Craft.createUploader(
        p.volumeType,
        this.$container,
        i
      ), delete p.volumeId, delete p.volumeType, this.uploader.setParams(p), D.editing.view.document.on(
        "drop",
        async (l, u) => {
          D.editing.view, D.model;
          const r = D.editing.mapper, _ = u.dropRange;
          if (_) {
            const m = _.start, b = r.toModelPosition(m);
            D.model.change((y) => {
              y.setSelection(b, 0);
            });
          }
        },
        { priority: "high" }
      );
    }
  }
  /**
   * On upload start.
   */
  _onUploadStart() {
    this.progressBar.$progressBar.css({
      top: Math.round(this.$container.outerHeight() / 2) - 6
    }), this.$container.addClass("uploading"), this.progressBar.resetProgressBar(), this.progressBar.showProgressBar();
  }
  /**
   * On upload progress.
   */
  _onUploadProgress(D, p = null) {
    p = D instanceof CustomEvent ? D.detail : p;
    var i = parseInt(Math.min(p.loaded / p.total, 1) * 100, 10);
    this.progressBar.setProgressPercentage(i);
  }
  /**
   * On a file being uploaded.
   */
  _onUploadComplete(D, p = null) {
    const i = D instanceof CustomEvent ? D.detail : p.result;
    this.progressBar.hideProgressBar(), this.$container.removeClass("uploading");
    const l = this.editor.config.get("defaultTransform"), u = new Craft.Queue(), r = [];
    u.on("afterRun", () => {
      this.editor.execute("insertImage", { source: r, breakBlock: !0 });
    }), u.push(
      () => new Promise((_) => {
        const m = this._isTransformUrl(i.url);
        if (!m && l)
          this._getTransformUrl(i.assetId, l, (b) => {
            r.push(b), _();
          });
        else {
          const b = this._buildAssetUrl(
            i.assetId,
            i.url,
            m ? transform : l
          );
          r.push(b), _();
        }
      })
    );
  }
  /**
   * On Upload Failure.
   */
  _onUploadFailure(D, p = null) {
    var m, b;
    const i = D instanceof CustomEvent ? D.detail : (m = p == null ? void 0 : p.jqXHR) == null ? void 0 : m.responseJSON;
    let { message: l, filename: u, errors: r } = i || {};
    u = u || ((b = p == null ? void 0 : p.files) == null ? void 0 : b[0].name);
    let _ = r ? Object.values(r).flat() : [];
    l || (_.length ? l = _.join(`
`) : u ? l = Craft.t("app", "Upload failed for “{filename}”.", { filename: u }) : l = Craft.t("app", "Upload failed.")), Craft.cp.displayError(l), this.progressBar.hideProgressBar(), this.$container.removeClass("uploading");
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class iu extends Os {
  refresh() {
    const D = this._element(), p = this._srcInfo(D);
    this.isEnabled = !!p, p ? this.value = {
      transform: p.transform
    } : this.value = null;
  }
  _element() {
    const D = this.editor;
    return D.plugins.get("ImageUtils").getClosestSelectedImageElement(
      D.model.document.selection
    );
  }
  _srcInfo(D) {
    if (!D || !D.hasAttribute("src"))
      return null;
    const p = D.getAttribute("src"), i = p.match(
      /#asset:(\d+)(?::transform:([a-zA-Z][a-zA-Z0-9_]*))?/
    );
    return i ? {
      src: p,
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
  execute(D) {
    const i = this.editor.model, l = this._element(), u = this._srcInfo(l);
    if (this.value = {
      transform: D.transform
    }, u) {
      const r = `#asset:${u.assetId}` + (D.transform ? `:transform:${D.transform}` : "");
      i.change((_) => {
        const m = u.src.replace(/#.*/, "") + r;
        _.setAttribute("src", m, l);
      }), Craft.sendActionRequest("post", "ckeditor/ckeditor/image-url", {
        data: {
          assetId: u.assetId,
          transform: D.transform
        }
      }).then(({ data: _ }) => {
        i.change((m) => {
          const b = _.url + r;
          m.setAttribute("src", b, l), _.width && m.setAttribute("width", _.width, l), _.height && m.setAttribute("height", _.height, l);
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
class nc extends Vn {
  static get requires() {
    return [Jl];
  }
  static get pluginName() {
    return "ImageTransformEditing";
  }
  constructor(D) {
    super(D), D.config.define("transforms", []);
  }
  init() {
    const D = this.editor, p = new iu(D);
    D.commands.add("transformImage", p);
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
const au = $c;
class su extends Vn {
  static get requires() {
    return [nc];
  }
  static get pluginName() {
    return "ImageTransformUI";
  }
  init() {
    const D = this.editor, p = D.config.get("transforms"), i = D.commands.get("transformImage");
    this.bind("isEnabled").to(i), this._registerImageTransformDropdown(p);
  }
  /**
   * A helper function that creates a dropdown component for the plugin containing all the transform options defined in
   * the editor configuration.
   *
   * @param transforms An array of the available image transforms.
   */
  _registerImageTransformDropdown(D) {
    const p = this.editor, i = p.t, l = {
      name: "transformImage:original",
      value: null
    }, u = [
      l,
      ...D.map((_) => ({
        label: _.name,
        name: `transformImage:${_.handle}`,
        value: _.handle
      }))
    ], r = (_) => {
      const m = p.commands.get("transformImage"), b = ki(_, Wc), y = b.buttonView;
      return y.set({
        tooltip: i("Resize image"),
        commandValue: null,
        icon: au,
        isToggleable: !0,
        label: this._getOptionLabelValue(l),
        withText: !0,
        class: "ck-resize-image-button"
      }), y.bind("label").to(m, "value", (v) => {
        if (!v || !v.transform)
          return this._getOptionLabelValue(l);
        const C = D.find(
          (x) => x.handle === v.transform
        );
        return C ? C.name : v.transform;
      }), b.bind("isEnabled").to(this), Ei(
        b,
        () => this._getTransformDropdownListItemDefinitions(u, m),
        {
          ariaLabel: i("Image resize list")
        }
      ), this.listenTo(b, "execute", (v) => {
        p.execute(v.source.commandName, {
          transform: v.source.commandValue
        }), p.editing.view.focus();
      }), b;
    };
    p.ui.componentFactory.add("transformImage", r);
  }
  /**
   * A helper function for creating an option label value string.
   *
   * @param option A transform option object.
   * @returns The option label.
   */
  _getOptionLabelValue(D) {
    return D.label || D.value || this.editor.t("Original");
  }
  /**
   * A helper function that parses the transform options and returns list item definitions ready for use in the dropdown.
   *
   * @param options The transform options.
   * @param command The transform image command.
   * @returns Dropdown item definitions.
   */
  _getTransformDropdownListItemDefinitions(D, p) {
    const i = new Yo();
    return D.map((l) => {
      const u = {
        type: "button",
        model: new Ko({
          commandName: "transformImage",
          commandValue: l.value,
          label: this._getOptionLabelValue(l),
          withText: !0,
          icon: null
        })
      };
      u.model.bind("isOn").to(p, "value", lu(l.value)), i.add(u);
    }), i;
  }
}
function lu(xe) {
  return (D) => {
    const p = D;
    return xe === null && p === xe ? !0 : p !== null && p.transform === xe;
  };
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class Du extends Vn {
  static get requires() {
    return [nc, su];
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
class cu extends Os {
  refresh() {
    const D = this._element(), p = this._srcInfo(D);
    if (this.isEnabled = !!p, this.isEnabled) {
      let i = {
        assetId: p.assetId
      };
      Craft.sendActionRequest("POST", "ckeditor/ckeditor/image-permissions", {
        data: i
      }).then((l) => {
        l.data.editable === !1 && (this.isEnabled = !1);
      });
    }
  }
  /**
   * Returns the selected image element.
   */
  _element() {
    const D = this.editor;
    return D.plugins.get("ImageUtils").getClosestSelectedImageElement(
      D.model.document.selection
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
  _srcInfo(D) {
    if (!D || !D.hasAttribute("src"))
      return null;
    const p = D.getAttribute("src"), i = p.match(
      /(.*)#asset:(\d+)(?::transform:([a-zA-Z][a-zA-Z0-9_]*))?/
    );
    return i ? {
      src: p,
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
    const p = this._element(), i = this._srcInfo(p);
    if (i) {
      let l = {
        allowSavingAsNew: !1,
        // todo: we might want to change that, but currently we're doing the same functionality as in Redactor
        onSave: (u) => {
          this._reloadImage(i.assetId, u);
        },
        allowDegreeFractions: Craft.isImagick
      };
      new Craft.AssetImageEditor(i.assetId, l);
    }
  }
  /**
   * Reloads the matching images after save was triggered from the Image Editor.
   *
   * @param data
   */
  _reloadImage(D, p) {
    let l = this.editor.model;
    this._getAllImageAssets().forEach((r) => {
      if (r.srcInfo.assetId == D)
        if (r.srcInfo.transform) {
          let _ = {
            assetId: r.srcInfo.assetId,
            handle: r.srcInfo.transform
          };
          Craft.sendActionRequest("POST", "assets/generate-transform", {
            data: _
          }).then((m) => {
            let b = m.data.url + "?" + (/* @__PURE__ */ new Date()).getTime() + "#asset:" + r.srcInfo.assetId + ":transform:" + r.srcInfo.transform;
            l.change((y) => {
              y.setAttribute("src", b, r.element);
            });
          });
        } else {
          let _ = r.srcInfo.baseSrc + "?" + (/* @__PURE__ */ new Date()).getTime() + "#asset:" + r.srcInfo.assetId;
          l.change((m) => {
            m.setAttribute("src", _, r.element);
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
    const p = this.editor.model, i = p.createRangeIn(p.document.getRoot());
    let l = [];
    for (const u of i.getWalker({ ignoreElementEnd: !0 }))
      if (u.item.is("element") && u.item.name === "imageBlock") {
        let r = this._srcInfo(u.item);
        r && l.push({
          element: u.item,
          srcInfo: r
        });
      }
    return l;
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class rc extends Vn {
  static get requires() {
    return [Jl];
  }
  static get pluginName() {
    return "ImageEditorEditing";
  }
  init() {
    const D = this.editor, p = new cu(D);
    D.commands.add("imageEditor", p);
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class uu extends Vn {
  static get requires() {
    return [rc];
  }
  static get pluginName() {
    return "ImageEditorUI";
  }
  init() {
    const p = this.editor.commands.get("imageEditor");
    this.bind("isEnabled").to(p), this._registerImageEditorButton();
  }
  /**
   * A helper function that creates a button component for the plugin that triggers launch of the Image Editor.
   */
  _registerImageEditorButton() {
    const D = this.editor, p = D.t, i = D.commands.get("imageEditor"), l = () => {
      const u = new qo();
      return u.set({
        label: p("Edit Image"),
        withText: !0
      }), u.bind("isEnabled").to(i), this.listenTo(u, "execute", (r) => {
        D.execute("imageEditor"), D.editing.view.focus();
      }), u;
    };
    D.ui.componentFactory.add("imageEditor", l);
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class Ru extends Vn {
  static get requires() {
    return [rc, uu];
  }
  static get pluginName() {
    return "ImageEditor";
  }
}
class du extends Os {
  execute(D) {
    const p = this.editor, i = p.model.document.selection;
    p.model.change((l) => {
      const u = l.createElement("craftEntryModel", {
        ...Object.fromEntries(i.getAttributes()),
        cardHtml: D.cardHtml,
        entryId: D.entryId,
        siteId: D.siteId
      });
      p.model.insertObject(u, null, null, {
        setSelection: "on"
      });
    });
  }
  refresh() {
    const p = this.editor.model.document.selection, i = !p.isCollapsed && p.getFirstRange();
    this.isEnabled = !i;
  }
}
class fu extends Vn {
  /**
   * @inheritDoc
   */
  static get requires() {
    return [qc];
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
    const D = this.editor;
    D.commands.add("insertEntry", new du(D)), D.editing.mapper.on(
      "viewToModelPosition",
      Yc(D.model, (p) => {
        p.hasClass("cke-entry-card");
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
    const D = this.editor.conversion;
    D.for("upcast").elementToElement({
      view: {
        name: "craft-entry"
        // has to be lower case
      },
      model: (i, { writer: l }) => {
        const u = i.getAttribute("data-card-html"), r = i.getAttribute("data-entry-id"), _ = i.getAttribute("data-site-id") ?? null;
        return l.createElement("craftEntryModel", {
          cardHtml: u,
          entryId: r,
          siteId: _
        });
      }
    }), D.for("editingDowncast").elementToElement({
      model: "craftEntryModel",
      view: (i, { writer: l }) => {
        const u = i.getAttribute("entryId") ?? null, r = i.getAttribute("siteId") ?? null, _ = l.createContainerElement("div", {
          class: "cke-entry-card",
          "data-entry-id": u,
          "data-site-id": r
        });
        return p(i, l, _), Kc(_, l);
      }
    }), D.for("dataDowncast").elementToElement({
      model: "craftEntryModel",
      view: (i, { writer: l }) => {
        const u = i.getAttribute("entryId") ?? null, r = i.getAttribute("siteId") ?? null;
        return l.createContainerElement("craft-entry", {
          "data-entry-id": u,
          "data-site-id": r
        });
      }
    });
    const p = (i, l, u) => {
      this._getCardHtml(i).then((r) => {
        const _ = l.createRawElement(
          "div",
          null,
          function(b) {
            b.innerHTML = r.cardHtml, Craft.appendHeadHtml(r.headHtml), Craft.appendBodyHtml(r.bodyHtml);
          }
        );
        l.insert(l.createPositionAt(u, 0), _);
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
  async _getCardHtml(D) {
    var _, m, b;
    let p = D.getAttribute("cardHtml") ?? null, i = $(this.editor.sourceElement).parents(".field");
    const l = $(i[0]).data("layout-element");
    if (p)
      return { cardHtml: p };
    const u = D.getAttribute("entryId") ?? null, r = D.getAttribute("siteId") ?? null;
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
            entryId: u,
            siteId: r,
            layoutElementUid: l
          }
        }
      );
      return x;
    } catch (y) {
      return console.error((_ = y == null ? void 0 : y.response) == null ? void 0 : _.data), { cardHtml: '<div class="element card"><div class="card-content"><div class="card-heading"><div class="label error"><span>' + (((b = (m = y == null ? void 0 : y.response) == null ? void 0 : m.data) == null ? void 0 : b.message) || "An unknown error occurred.") + "</span></div></div></div></div>" };
    }
  }
}
class pu extends Qc {
  constructor(D) {
    super(D), this.domEventType = "dblclick";
  }
  onDomEvent(D) {
    this.fire(D.type, D);
  }
}
class hu extends Gr {
  constructor(D, p = {}) {
    super(D), this.bindTemplate, this.set("isFocused", !1), this.entriesUi = p.entriesUi, this.editor = this.entriesUi.editor;
    const i = this.editor.commands.get("insertEntry");
    let l = new Yo(), u = new Yo();
    if (this.entriesUi._getEntryTypeButtonsCollection(p.entryTypeOptions ?? []).forEach((r, _) => {
      let m = new qo();
      if (r.model.icon) {
        let b = ["btn", "icon", "cp-icon", "ck-reset_all-excluded"];
        r.model.color && b.push([r.model.color]), m.set({
          commandValue: r.model.commandValue,
          //entry type id
          label: r.model.label,
          icon: r.model.icon,
          withText: !1,
          tooltip: Craft.t("ckeditor", "New {type}", {
            type: r.model.label
          }),
          class: b.join(" ")
        }), l.add(m);
      } else
        u.add(r);
      this.listenTo(m, "execute", (b) => {
        this.entriesUi._showCreateEntrySlideout(b.source.commandValue);
      }), m.bind("isEnabled").to(i);
    }), u.length > 0) {
      const r = ki(D);
      r.buttonView.set({
        label: Craft.t("ckeditor", "Add nested content"),
        icon: ec,
        tooltip: !0,
        withText: !1
      }), r.bind("isEnabled").to(i), r.id = Craft.uuid(), Ei(r, () => u, {
        ariaLabel: Craft.t("ckeditor", "Entry types list")
      }), this.listenTo(r, "execute", (_) => {
        this.entriesUi._showCreateEntrySlideout(_.source.commandValue);
      }), l.add(r);
    }
    this.setTemplate({
      tag: "div",
      attributes: {
        // ck-reset_all-excluded class is needed so that CKE doesn't mess with the styles we already have
        class: ["entry-type-buttons"],
        tabindex: -1
      },
      children: l
    });
  }
}
class mu extends Vn {
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
    this._createToolbarEntriesButtons(), this.editor.ui.componentFactory.add("editEntryBtn", (D) => this._createEditEntryBtn(D)), this._listenToEvents();
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
      getRelatedElement: (p) => {
        const i = p.getSelectedElement();
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
    const D = this.editor.editing.view, p = D.document;
    D.addObserver(pu), this.editor.listenTo(p, "dblclick", (i, l) => {
      if (!this.editor.isReadOnly) {
        const u = this.editor.editing.mapper.toModelElement(
          l.target.parent
        );
        u.name === "craftEntryModel" && this._initEditEntrySlideout(l, u);
      }
    });
  }
  _initEditEntrySlideout(D = null, p = null) {
    if (this.editor.isReadOnly)
      return;
    p === null && (p = this.editor.model.document.selection.getSelectedElement());
    const i = p.getAttribute("entryId"), l = p.getAttribute("siteId") ?? null;
    this._showEditEntrySlideout(i, l, p);
  }
  /**
   * Creates a single toolbar button that allows for an entry to be inserted into the editor
   *
   * @param locale
   * @private
   */
  _createSingleToolbarEntriesButton(D) {
    const p = this.editor, i = p.config.get("entryTypeOptions"), l = p.commands.get("insertEntry");
    if (!i || !i.length)
      return;
    const u = ki(D);
    return u.buttonView.set({
      label: Craft.t("ckeditor", "Add nested content"),
      icon: ec,
      tooltip: !0,
      withText: !1
    }), u.bind("isEnabled").to(l), Ei(
      u,
      () => this._getEntryTypeButtonsCollection(
        i,
        l
      ),
      {
        ariaLabel: Craft.t("ckeditor", "Entry types list")
      }
    ), this.listenTo(u, "execute", (r) => {
      this._showCreateEntrySlideout(r.source.commandValue);
    }), u;
  }
  /**
   * Creates toolbar buttons that allow for an entry of given type to be inserted into the editor.
   * If the entry type has an icon, it'll get its own button. Entry types without an icon are grouped in a dropdown.
   *
   * @private
   */
  _createToolbarEntriesButtons() {
    const D = this.editor, p = D.config.get("entryTypeOptions");
    if (!p || !p.length)
      return;
    D.config.get("expandEntryButtons") ? this.editor.ui.componentFactory.add(
      "createEntry",
      (l) => new hu(l, {
        entriesUi: this,
        entryTypeOptions: p
      })
    ) : this.editor.ui.componentFactory.add("createEntry", (l) => this._createSingleToolbarEntriesButton(l));
  }
  /**
   * Creates a list of entry type options that go into the insert entry button
   *
   * @param options
   * @returns {Collection<Record<string, any>>}
   * @private
   */
  _getEntryTypeButtonsCollection(D) {
    const p = new Yo();
    return D.map((i) => {
      const l = {
        type: "button",
        model: new Ko({
          commandValue: i.value,
          //entry type id
          label: i.label || i.value,
          icon: i.icon,
          color: i.color,
          withText: !0
        })
      };
      p.add(l);
    }), p;
  }
  /**
   * Creates an edit entry button that shows in the contextual balloon for each craft entry widget
   * @param locale
   * @returns {ButtonView}
   * @private
   */
  _createEditEntryBtn(D) {
    if (this.editor.isReadOnly)
      return;
    const p = new qo(D);
    return p.set({
      isEnabled: !0,
      label: Craft.t("app", "Edit {type}", {
        type: Craft.elementTypeNames["craft\\elements\\Entry"][2]
      }),
      tooltip: !0,
      withText: !0
    }), this.listenTo(p, "execute", (i) => {
      this._initEditEntrySlideout();
    }), p;
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
  _getCardElement(D) {
    return $(this.editor.ui.element).find('.element.card[data-id="' + D + '"]');
  }
  /**
   * Opens an element editor for existing entry
   *
   * @param entryId
   * @private
   */
  _showEditEntrySlideout(D, p, i) {
    const l = this.editor, u = l.model, r = this.getElementEditor();
    let _ = this._getCardElement(D);
    const m = _.data("owner-id"), b = Craft.createElementEditor(this.elementType, null, {
      elementId: D,
      params: {
        siteId: p
      },
      onLoad: () => {
        b.elementEditor.on("update", () => {
          Craft.Preview.refresh();
        });
      },
      onBeforeSubmit: async () => {
        if (_ !== null && Garnish.hasAttr(_, "data-owner-is-canonical") && (!r || !r.settings.isUnpublishedDraft)) {
          await b.elementEditor.checkForm(!0, !0);
          let y = $(l.sourceElement).attr("name");
          r && y && await r.setFormValue(y, "*"), r && r.settings.draftId && b.elementEditor.settings.draftId && (b.elementEditor.settings.saveParams || (b.elementEditor.settings.saveParams = {}), b.elementEditor.settings.saveParams.action = "elements/save-nested-element-for-derivative", b.elementEditor.settings.saveParams.newOwnerId = r.getDraftElementId(m));
        }
      },
      onSubmit: (y) => {
        let v = this._getCardElement(D);
        v !== null && y.data.id != v.data("id") && (v.attr("data-id", y.data.id).data("id", y.data.id).data("owner-id", y.data.ownerId), l.editing.model.change((C) => {
          C.setAttribute("entryId", y.data.id, i), l.ui.update();
        }), Craft.refreshElementInstances(y.data.id));
      }
    });
    b.on("beforeClose", () => {
      u.change((y) => {
        y.setSelection(y.createPositionAfter(i)), l.editing.view.focus();
      });
    }), b.on("close", () => {
      l.editing.view.focus();
    });
  }
  /**
   * Creates new entry and opens the element editor for it
   *
   * @param entryTypeId
   * @private
   */
  async _showCreateEntrySlideout(D) {
    var v, C;
    const p = this.editor, i = p.model, u = i.document.selection.getFirstRange(), r = p.config.get(
      "nestedElementAttributes"
    ), _ = Object.assign({}, r, {
      typeId: D
    }), m = this.getElementEditor();
    m && (await m.markDeltaNameAsModified(p.sourceElement.name), _.ownerId = m.getDraftElementId(
      r.ownerId
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
        p.commands.execute("insertEntry", {
          entryId: x.data.id,
          siteId: x.data.siteId
        });
      }
    });
    y.on("beforeClose", () => {
      y.$triggerElement = null, i.change((x) => {
        x.setSelection(
          x.createPositionAt(
            p.model.document.getRoot(),
            u.end.path[0]
          )
        );
      }), p.editing.view.focus();
    });
  }
}
class gu extends Vn {
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
class bu extends Vn {
  static get pluginName() {
    return "CraftLinkEditing";
  }
  constructor() {
    super(...arguments), this.conversionData = [], this.editor.config.define("advancedLinkFields", []);
  }
  init() {
    const p = this.editor.config.get("advancedLinkFields");
    this.conversionData = p.map((i) => i.conversion ?? null).filter((i) => i), this._defineSchema(), this._defineConverters(), this._adjustLinkCommand(), this._adjustUnlinkCommand();
  }
  _defineSchema() {
    const D = this.editor.model.schema;
    let p = this.conversionData.map((i) => i.model);
    D.extend("$text", {
      allowAttributes: p
    });
  }
  _defineConverters() {
    const D = this.editor.conversion;
    for (let p = 0; p < this.conversionData.length; p++)
      D.for("downcast").attributeToElement({
        model: this.conversionData[p].model,
        view: (i, { writer: l }) => {
          const u = l.createAttributeElement(
            "a",
            { [this.conversionData[p].view]: i },
            { priority: 5 }
          );
          return l.setCustomProperty("link", !0, u), u;
        }
      }), D.for("upcast").attributeToAttribute({
        view: {
          name: "a",
          key: this.conversionData[p].view
        },
        model: {
          key: this.conversionData[p].model,
          value: (i, l) => i.getAttribute(this.conversionData[p].view)
        }
      });
  }
  _adjustLinkCommand() {
    const D = this.editor, p = D.commands.get("link");
    let i = !1;
    p.on(
      "execute",
      (l, u) => {
        if (i) {
          i = !1;
          return;
        }
        l.stop(), i = !0;
        const r = u[u.length - 1], _ = D.model.document.selection;
        D.model.change((m) => {
          D.execute("link", ...u);
          const b = _.getFirstPosition();
          this.conversionData.forEach((y) => {
            if (_.isCollapsed) {
              const v = b.textNode || b.nodeBefore;
              r[y.model] ? m.setAttribute(
                y.model,
                r[y.model],
                m.createRangeOn(v)
              ) : m.removeAttribute(y.model, m.createRangeOn(v));
            } else {
              const v = D.model.schema.getValidRanges(
                _.getRanges(),
                y.model
              );
              for (const C of v)
                r[y.model] ? m.setAttribute(
                  y.model,
                  r[y.model],
                  C
                ) : m.removeAttribute(y.model, C);
            }
          });
        });
      },
      { priority: "high" }
    );
  }
  _adjustUnlinkCommand() {
    const D = this.editor, p = D.commands.get("unlink"), { model: i } = D, { selection: l } = i.document;
    let u = !1;
    p.on(
      "execute",
      (r) => {
        u || (r.stop(), i.change(() => {
          u = !0, D.execute("unlink"), u = !1, i.change((_) => {
            let m;
            this.conversionData.forEach((b) => {
              l.isCollapsed ? m = [
                Xc(
                  l.getFirstPosition(),
                  b.model,
                  l.getAttribute(b.model),
                  i
                )
              ] : m = i.schema.getValidRanges(
                l.getRanges(),
                b.model
              );
              for (const y of m)
                _.removeAttribute(b.model, y);
            });
          });
        }));
      },
      { priority: "high" }
    );
  }
}
class yu extends Gr {
  constructor(D, p = {}) {
    super(D), this.bindTemplate, this.set("isFocused", !1), this.linkUi = p.linkUi, this.editor = this.linkUi.editor, this.elementId = this.linkUi._getLinkElementId(), this.siteId = this.linkUi._getLinkSiteId(), this.linkOption = p.linkOption;
    const i = this.linkUi._getLinkElementRefHandle();
    if (this.button = null, i) {
      const l = this.linkUi.linkTypeDropdownItemModels[i];
      this.linkUi.linkTypeDropdownView.buttonView.label == l.label && (this.button = Craft.t("app", "Loading"));
    }
    this.button == null && (this.button = new qo(), this.button.set({
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
    const D = this.linkUi, p = D._linkUI, i = this.linkOption;
    this.element.addEventListener("click", function(l) {
      (this.children[0].classList.contains("add") || l.target.classList.contains("ck-button__label")) && (p._hideUI(), D._showElementSelectorModal(i));
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
    ).then((l) => {
      var u;
      if (Object.keys(l.data.elements).length > 0) {
        for (const [m, b] of Object.entries(
          this.linkUi.sitesView.siteDropdownItemModels
        ))
          l.data.siteIds.includes(parseInt(m)) || m == "current" ? b.set("isEnabled", !0) : b.set("isEnabled", !1);
        this.element.innerHTML = l.data.elements[this.elementId][0], Craft.appendHeadHtml(l.data.headHtml), Craft.appendBodyHtml(l.data.bodyHtml);
        let r = this.element.firstChild;
        const _ = [
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
        Craft.addActionsToChip(r, _), D._alignFocus();
      } else if (((u = this.linkUi.previousLinkValue) == null ? void 0 : u.length) > 0) {
        const { formView: r } = this.linkUi._linkUI;
        r.urlInputView.fieldView.set(
          "value",
          this.linkUi.previousLinkValue
        );
      } else
        this.button = new qo(), this.button.set({
          label: Craft.t("app", "Choose"),
          withText: !0,
          class: "btn add icon dashed"
        }), this.button.render(), this.element.innerHTML = this.button.element.outerHTML;
    }).catch((l) => {
      var u, r, _, m;
      throw Craft.cp.displayError((r = (u = l == null ? void 0 : l.response) == null ? void 0 : u.data) == null ? void 0 : r.message), ((m = (_ = l == null ? void 0 : l.response) == null ? void 0 : _.data) == null ? void 0 : m.message) ?? l;
    });
  }
}
class vu extends Gr {
  constructor(D, p = {}) {
    super(D), this.bindTemplate, this.set("isFocused", !1), this.linkUi = p.linkUi, this.editor = this.linkUi.editor, this.elementId = this.linkUi._getLinkElementId(), this.siteId = this.linkUi._getLinkSiteId(), this.linkOption = p.linkOption, this.linkUi._getLinkElementRefHandle(), this.siteDropdownView = ki(this.linkUi._linkUI.formView.locale), this.siteDropdownItemModels = null, this.localizedRefHandleRE = null;
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
    super.render(), this._sitesDropdown();
  }
  _sitesDropdown() {
    const { formView: D } = this.linkUi._linkUI, { urlInputView: p } = D, { fieldView: i } = p;
    this.siteDropdownView.buttonView.set({
      label: "",
      withText: !0,
      isVisible: !0
    }), this.siteDropdownItemModels = Object.fromEntries(
      Craft.sites.map((l) => [
        l.id,
        new Ko({
          label: l.name,
          siteId: l.id,
          withText: !0
        })
      ])
    ), this.siteDropdownItemModels.current = new Ko({
      label: Craft.t("ckeditor", "Link to the current site"),
      siteId: null,
      withText: !0
    }), Ei(
      this.siteDropdownView,
      new Yo([
        ...Craft.sites.map((l) => ({
          type: "button",
          model: this.siteDropdownItemModels[l.id]
        })),
        {
          type: "button",
          model: this.siteDropdownItemModels.current
        }
      ])
    ), this.siteDropdownView.on("execute", (l) => {
      const u = this.linkUi._urlInputRefMatch(this.localizedRefHandleRE);
      if (!u) {
        console.warn(
          `No reference tag hash present in URL: ${this.linkUi._urlInputValue()}`
        );
        return;
      }
      const { siteId: r } = l.source;
      let _ = u[1];
      r && (_ += `@${r}`), this.linkUi.previousLinkValue = this.linkUi._urlInputValue();
      const m = this.linkUi._urlInputValue().replace(u[0], _);
      D.urlInputView.fieldView.set("value", m), this._toggleSiteDropdownView();
    }), this.listenTo(i, "change:value", () => {
      this._toggleSiteDropdownView();
    }), this.listenTo(i, "input", () => {
      this._toggleSiteDropdownView();
    });
  }
  _toggleSiteDropdownView() {
    const D = this.linkUi._urlInputRefMatch(this.localizedRefHandleRE);
    if (D) {
      this.siteDropdownView.buttonView.set("isVisible", !0);
      let p = D[2] ? parseInt(D[2], 10) : null;
      p && typeof this.siteDropdownItemModels[p] > "u" && (p = null), this._selectSiteDropdownItem(p), this.siteDropdownView.buttonView.set("isVisible", !0);
    } else
      this.siteDropdownView.buttonView.set("isVisible", !1);
  }
  _selectSiteDropdownItem(D) {
    const p = this.siteDropdownItemModels[D ?? "current"], i = D ? Craft.t("ckeditor", "Site: {name}", { name: p.label }) : p.label;
    this.siteDropdownView.buttonView.set("label", i), Object.values(this.siteDropdownItemModels).forEach((l) => {
      l.set("isOn", l.siteId === p.siteId);
    });
  }
}
class wu extends Gr {
  constructor(D, p = {}) {
    super(D);
    const i = this.bindTemplate;
    this.set("label", Craft.t("app", "Advanced")), this.linkUi = p.linkUi, this.editor = this.linkUi.editor, this.children = this.createCollection(), this.advancedChildren = this.createCollection(), this.setTemplate({
      tag: "details",
      attributes: {
        class: ["ck", "ck-form__details", "link-type-advanced"]
      },
      children: this.children
    }), this.summary = new Gr(D), this.summary.setTemplate({
      tag: "summary",
      attributes: {
        class: ["ck", "ck-form__details__summary"]
      },
      children: [{ text: i.to("label") }]
    }), this.children.add(this.summary), this.advancedFieldsContainer = new Gr(D), this.advancedFieldsContainer.setTemplate({
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
  onToggle(D) {
    const { formView: p } = this.linkUi._linkUI;
    if (D.target.open) {
      const i = p._focusables.getIndex(this);
      this.advancedChildren._items.forEach((l, u) => {
        p._focusables.add(l, i + u + 1), p.focusTracker.add(l.element, i + u + 1);
      });
    } else
      this.advancedChildren._items.forEach((i, l) => {
        p._focusables.remove(i), p.focusTracker.remove(i.element);
      });
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class ku extends Vn {
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
    const D = this.editor;
    this._linkUI = D.plugins.get(Xl), this._balloon = D.plugins.get(Zc), this.linkOptions = D.config.get("linkOptions"), this.advancedLinkFields = D.config.get("advancedLinkFields"), this.conversionData = this.advancedLinkFields.map((i) => i.conversion ?? null).filter((i) => i);
    const p = CKE_LOCALIZED_REF_HANDLES.join("|");
    this.elementTypeRefHandleRE = new RegExp(
      `(#((?:${p})):\\d+)`
    ), this.urlWithRefHandleRE = new RegExp(
      `(.+)(#((?:${p})):(\\d+))(?:@(\\d+))?`
    ), this._modifyFormViewTemplate(), this._balloon.on(
      "set:visibleView",
      (i, l, u, r) => {
        const { formView: _ } = this._linkUI;
        u === r || u !== _ || this._alignFocus();
      }
    );
  }
  /**
   * Reset focus order of the extra fields we're adding to the link form view
   */
  _alignFocus() {
    const { formView: D } = this._linkUI;
    let p = 0;
    this.linkTypeWrapperView && (this.linkTypeWrapperView._unboundChildren._items.forEach((i) => {
      D._focusables.has(i) && D._focusables.remove(i), D.focusTracker.remove(i.element), D._focusables.add(i, p), D.focusTracker.add(i.element, p), p++;
    }), this.advancedView !== null && (D._focusables.has(this.advancedView) && D._focusables.remove(this.advancedView), D.focusTracker.remove(this.advancedView), D._focusables.add(this.advancedView, p), D.focusTracker.add(this.advancedView.element, p)));
  }
  /**
   * Add all our custom fields (for element linking and advanced fields) to the link form view.
   */
  _modifyFormViewTemplate() {
    this._linkUI.formView || this._linkUI._createViews();
    const { formView: D } = this._linkUI;
    D.template.attributes.class.push(
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
  _urlInputRefMatch(D) {
    return this._urlInputValue().match(D);
  }
  ////////////////////// Link Options Dropdown (link types) //////////////////////
  /**
   * Create a link type dropdown.
   */
  _linkOptionsDropdown() {
    const { formView: D } = this._linkUI, { urlInputView: p } = D, { fieldView: i } = p;
    this.linkTypeDropdownView = ki(D.locale), this.linkTypeDropdownView.buttonView.set({
      label: "",
      withText: !0,
      isVisible: !0
    }), this.linkTypeDropdownItemModels = Object.fromEntries(
      this._getLinkListItemDefinitions().map((l) => [l.handle, l])
    ), Ei(
      this.linkTypeDropdownView,
      new Yo([
        ...this._getLinkListItemDefinitions().map((l) => ({
          type: "button",
          model: this.linkTypeDropdownItemModels[l.handle]
        }))
      ])
    ), i.isEmpty && this._showLinkTypeForm("default"), this.linkTypeDropdownView.on("execute", (l) => {
      if (l.source.linkOption) {
        const u = l.source.linkOption;
        this._selectLinkTypeDropdownItem(u.refHandle), this._showLinkTypeForm(u, D);
      } else
        this._selectLinkTypeDropdownItem("default"), this._showLinkTypeForm("default");
    }), this.listenTo(i, "change:value", () => {
      this._toggleLinkTypeDropdownView();
      const l = this._getLinkElementRefHandle();
      l ? this._showLinkTypeForm(
        this.linkTypeDropdownItemModels[l].linkOption
      ) : this._showLinkTypeForm("default");
    }), this.listenTo(i, "input", () => {
      this._toggleLinkTypeDropdownView();
    });
  }
  /**
   * Get the refHandle from the URL field value.
   */
  _getLinkElementRefHandle() {
    let D = null;
    const p = this._urlInputValue().match(this.elementTypeRefHandleRE);
    return p && (D = p[2], D && typeof this.linkTypeDropdownItemModels[D] > "u" && (D = null)), D;
  }
  /**
   * Get element ID from the URL field value.
   */
  _getLinkElementId() {
    let D = null;
    const p = this._urlInputRefMatch(this.urlWithRefHandleRE);
    return p && (D = p[4] ? parseInt(p[4], 10) : null), D;
  }
  /**
   * Get site ID from the URL field value.
   */
  _getLinkSiteId() {
    let D = null;
    const p = this._urlInputRefMatch(this.urlWithRefHandleRE);
    return p && (D = p[5] ? parseInt(p[5], 10) : null), D;
  }
  /**
   * Toggle between element link and default URL link fields.
   */
  _toggleLinkTypeDropdownView() {
    let D = this._getLinkElementRefHandle();
    D ? (this.linkTypeDropdownView.buttonView.set("isVisible", !0), this._selectLinkTypeDropdownItem(D)) : this._selectLinkTypeDropdownItem("default");
  }
  /**
   * Select link type from the dropdown.
   */
  _selectLinkTypeDropdownItem(D) {
    const p = this.linkTypeDropdownItemModels[D], i = D ? Craft.t("app", "{name}", { name: p.label }) : p.label;
    this.linkTypeDropdownView.buttonView.set("label", i), Object.values(this.linkTypeDropdownItemModels).forEach((l) => {
      l.set("isOn", l.handle === p.handle);
    });
  }
  /**
   * Get a list of all the options that should be shown in the link type dropdown.
   */
  _getLinkListItemDefinitions() {
    const D = [];
    for (const p of this.linkOptions)
      D.push(
        new Ko({
          label: p.label,
          handle: p.refHandle,
          linkOption: p,
          withText: !0
        })
      );
    return D.push(
      new Ko({
        label: Craft.t("app", "URL"),
        handle: "default",
        withText: !0
      })
    ), D;
  }
  /**
   * Place the link type fields in the form.
   */
  _showLinkTypeForm(D) {
    var _, m, b, y;
    const { formView: p } = this._linkUI, { children: i } = p, { urlInputView: l } = p, { displayedTextInputView: u } = p;
    u.focus(), this.linkTypeWrapperView !== null && i.remove(this.linkTypeWrapperView), D === "default" ? (this.elementInputView = l, this.sitesView !== null && (m = (_ = this.sitesView) == null ? void 0 : _.siteDropdownView) != null && m.buttonView && this.sitesView.siteDropdownView.buttonView.set("isVisible", !1)) : (this.elementInputView = new yu(p.locale, {
      linkUi: this,
      linkOption: D,
      value: this._urlInputValue()
    }), this.sitesView !== null && (y = (b = this.sitesView) == null ? void 0 : b.siteDropdownView) != null && y.buttonView && this.sitesView.siteDropdownView.buttonView.set("isVisible", !0)), Craft.isMultiSite && this.sitesView == null && (this.sitesView = new vu(p.locale, {
      linkUi: this,
      linkOption: D
    }));
    let r = new Gr();
    r.setTemplate({
      tag: "span",
      attributes: {
        class: ["break"]
      }
    }), this.linkTypeWrapperView = new Gr(), this.linkTypeWrapperView.setTemplate({
      tag: "div",
      children: [
        this.linkTypeDropdownView,
        this.elementInputView,
        r,
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
  _showElementSelectorModal(D) {
    const p = this.editor, i = p.model, l = i.document.selection, u = l.isCollapsed, r = l.getFirstRange(), _ = this._linkUI._getSelectedLinkElement(), m = () => {
      p.editing.view.focus(), !u && r && i.change((b) => {
        b.setSelection(r);
      }), this._linkUI._hideFakeVisualSelection();
    };
    _ || this._linkUI._showFakeVisualSelection(), Craft.createElementSelectorModal(D.elementType, {
      storageKey: `ckeditor:${this.pluginName}:${D.elementType}`,
      sources: D.sources,
      criteria: D.criteria,
      defaultSiteId: p.config.get("elementSiteId"),
      autoFocusSearchBox: !1,
      onSelect: (b) => {
        if (b.length) {
          const y = b[0], v = `${y.url}#${D.refHandle}:${y.id}@${y.siteId}`;
          if (p.editing.view.focus(), (!u || _) && r) {
            i.change((N) => {
              N.setSelection(r);
            });
            const C = p.commands.get("link");
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
                l.getFirstPosition(),
                x
              ), r instanceof Jc)
                try {
                  const N = r.clone();
                  N.end.path[1] += y.label.length, C.setSelection(N);
                } catch {
                }
            });
          setTimeout(() => {
            this._linkUI._addToolbarView(), this._linkUI._balloon.showStack("main"), this._linkUI._addFormView(), this._linkUI._startUpdatingUI();
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
    var l;
    const D = this.editor.commands.get("link"), { formView: p } = this._linkUI, { children: i } = p;
    this.advancedView = new wu(p.locale, {
      linkUi: this
    }), i.add(this.advancedView, 3);
    for (const u of this.advancedLinkFields) {
      let r = (l = u.conversion) == null ? void 0 : l.model;
      if (r && typeof p[r] > "u")
        if (u.conversion.type === "bool") {
          const _ = new eu();
          _.set({
            withText: !0,
            label: u.label,
            isToggleable: !0
          }), u.tooltip && (_.tooltip = u.tooltip), this.advancedView.advancedChildren.add(_), p[r] = _, p[r].bind("isOn").to(D, r, (m) => m === void 0 ? (p[r].element.value = "", !1) : (p[r].element.value = u.conversion.value, !0)), _.on("execute", () => {
            _.isOn ? (_.isOn = !1, p[r].element.value = "") : (_.isOn = !0, p[r].element.value = u.conversion.value);
          });
        } else {
          let _ = this._addLabeledField(u);
          p[r] = _, p[r].fieldView.bind("value").to(D, r), p[r].fieldView.element.value = D[r] || "";
        }
      else if (u.value === "urlSuffix") {
        let _ = this._addLabeledField(u);
        this.listenTo(
          _.fieldView,
          "change:isFocused",
          (m, b, y, v) => {
            if (y !== v && !y) {
              let C = m.source.element.value, x = null;
              const N = this._urlInputRefMatch(this.urlWithRefHandleRE);
              N ? x = N[1] : x = this._urlInputValue();
              try {
                let G = new URL(x), K = G.search, j = G.hash, V = x.replace(j, "").replace(K, "");
                const P = this._urlInputValue().replace(
                  x,
                  V + C
                );
                p.urlInputView.fieldView.set("value", P);
              } catch {
                let [K, j] = x.split("#"), [V, P] = K.split("?");
                const M = this._urlInputValue().replace(
                  x,
                  V + C
                );
                p.urlInputView.fieldView.set("value", M);
              }
            }
          }
        ), this.listenTo(p.urlInputView.fieldView, "change:value", (m) => {
          this._toggleUrlSuffixInputView(_, m.source.isEmpty);
        }), this.listenTo(
          p.urlInputView.fieldView,
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
  _addLabeledField(D) {
    const { formView: p } = this._linkUI;
    let i = new tu(
      p.locale,
      nu
    );
    return i.label = D.label, D.tooltip && (i.infoText = D.tooltip), this.advancedView.advancedChildren.add(i), i;
  }
  /**
   * Populate URL suffix advanced field with content.
   * e.g. if a query string was added directly to the default URL input field,
   * ensure the value is also showing in the URL Suffix advanced field.
   */
  _toggleUrlSuffixInputView(D, p) {
    if (p)
      D.fieldView.set("value", "");
    else {
      const i = this._urlInputRefMatch(this.urlWithRefHandleRE);
      let l = null;
      i ? l = i[1] : l = this._urlInputValue();
      try {
        let u = new URL(l), r = u.search, _ = u.hash;
        D.fieldView.set("value", r + _);
      } catch {
        let [r, _] = l.split("#"), [m, b] = r.split("?");
        _ = _ ? "#" + _ : "", b = b ? "?" + b : "", D.fieldView.set("value", b + _);
      }
    }
  }
  /**
   * When link form is submitted, pass the advanced field values the link command.
   */
  _handleAdvancedLinkFieldsFormSubmit() {
    const p = this.editor.commands.get("link"), { formView: i } = this._linkUI;
    i.on(
      "submit",
      () => {
        let l = this._getAdvancedFieldValues();
        p.once(
          "execute",
          (u, r) => {
            r.length === 4 ? Object.assign(r[3], l) : r.push(l);
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
    const D = this.editor, p = D.commands.get("link"), i = D.model.document.selection;
    this.conversionData.forEach((l) => {
      p.set(l.model, null), D.model.document.on("change", () => {
        p[l.model] = i.getAttribute(l.model);
      });
    });
  }
  /**
   * Get the values of all the advanced fields.
   */
  _getAdvancedFieldValues() {
    const { formView: D } = this._linkUI;
    let p = {};
    return this.conversionData.forEach((i) => {
      let l = [];
      i.type === "bool" ? l[i.model] = D[i.model].element.value : l[i.model] = D[i.model].fieldView.element.value, Object.assign(p, l);
    }), p;
  }
}
class Iu extends Vn {
  static get requires() {
    return [bu, ku];
  }
  static get pluginName() {
    return "CraftLink";
  }
}
function Eu(xe) {
  return xe && xe.__esModule && Object.prototype.hasOwnProperty.call(xe, "default") ? xe.default : xe;
}
var Ts = { exports: {} };
/*! For license information please see inspector.js.LICENSE.txt */
var Zl;
function _u() {
  return Zl || (Zl = 1, function(xe, D) {
    (function(p, i) {
      xe.exports = i();
    })(window, function() {
      return function(p) {
        var i = {};
        function l(u) {
          if (i[u]) return i[u].exports;
          var r = i[u] = { i: u, l: !1, exports: {} };
          return p[u].call(r.exports, r, r.exports, l), r.l = !0, r.exports;
        }
        return l.m = p, l.c = i, l.d = function(u, r, _) {
          l.o(u, r) || Object.defineProperty(u, r, { enumerable: !0, get: _ });
        }, l.r = function(u) {
          typeof Symbol < "u" && Symbol.toStringTag && Object.defineProperty(u, Symbol.toStringTag, { value: "Module" }), Object.defineProperty(u, "__esModule", { value: !0 });
        }, l.t = function(u, r) {
          if (1 & r && (u = l(u)), 8 & r || 4 & r && typeof u == "object" && u && u.__esModule) return u;
          var _ = /* @__PURE__ */ Object.create(null);
          if (l.r(_), Object.defineProperty(_, "default", { enumerable: !0, value: u }), 2 & r && typeof u != "string") for (var m in u) l.d(_, m, (function(b) {
            return u[b];
          }).bind(null, m));
          return _;
        }, l.n = function(u) {
          var r = u && u.__esModule ? function() {
            return u.default;
          } : function() {
            return u;
          };
          return l.d(r, "a", r), r;
        }, l.o = function(u, r) {
          return Object.prototype.hasOwnProperty.call(u, r);
        }, l.p = "", l(l.s = 94);
      }([function(p, i, l) {
        p.exports = l(21);
      }, function(p, i, l) {
        l.d(i, "a", function() {
          return r;
        }), l.d(i, "b", function() {
          return _;
        }), l.d(i, "c", function() {
          return m;
        });
        var u = l(19);
        function r(y, v = !0) {
          if (y === void 0) return "undefined";
          if (typeof y == "function") return "function() {…}";
          const C = Object(u.stringify)(y, b, null, { maxDepth: 2 });
          return v ? C : C.replace(/(^"|"$)/g, "");
        }
        function _(y) {
          const v = {};
          for (const C in y) v[C] = y[C], v[C].value = r(v[C].value);
          return v;
        }
        function m(y, v) {
          return y.length > v ? y.substr(0, v) + `… [${y.length - v} characters left]` : y;
        }
        function b(y, v, C) {
          return typeof y == "string" ? `"${y.replace("'", '"')}"` : C(y);
        }
      }, function(p, i, l) {
        function u(N) {
          return N && N.name;
        }
        function r(N) {
          return N && u(N) && N.is("attributeElement");
        }
        function _(N) {
          return N && u(N) && N.is("emptyElement");
        }
        function m(N) {
          return N && u(N) && N.is("uiElement");
        }
        function b(N) {
          return N && u(N) && N.is("rawElement");
        }
        function y(N) {
          return N && u(N) && N.is("editableElement");
        }
        function v(N) {
          return N && N.is("rootElement");
        }
        function C(N) {
          return { path: [...N.parent.getPath(), N.offset], offset: N.offset, isAtEnd: N.isAtEnd, isAtStart: N.isAtStart, parent: x(N.parent) };
        }
        function x(N) {
          return u(N) ? r(N) ? "attribute:" + N.name : v(N) ? "root:" + N.name : "container:" + N.name : N.data;
        }
        l.d(i, "d", function() {
          return u;
        }), l.d(i, "b", function() {
          return r;
        }), l.d(i, "e", function() {
          return _;
        }), l.d(i, "h", function() {
          return m;
        }), l.d(i, "f", function() {
          return b;
        }), l.d(i, "c", function() {
          return y;
        }), l.d(i, "g", function() {
          return v;
        }), l.d(i, "a", function() {
          return C;
        });
      }, function(p, i, l) {
        l.d(i, "a", function() {
          return u;
        });
        class u {
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
      }, function(p, i, l) {
        function u(b) {
          return b && b.is("element");
        }
        function r(b) {
          return b && b.is("rootElement");
        }
        function _(b) {
          return b.getPath ? b.getPath() : b.path;
        }
        function m(b) {
          return { path: _(b), stickiness: b.stickiness, index: b.index, isAtEnd: b.isAtEnd, isAtStart: b.isAtStart, offset: b.offset, textNode: b.textNode && b.textNode.data };
        }
        l.d(i, "c", function() {
          return u;
        }), l.d(i, "d", function() {
          return r;
        }), l.d(i, "b", function() {
          return _;
        }), l.d(i, "a", function() {
          return m;
        });
      }, function(p, i, l) {
        (function(u, r) {
          var _ = "[object Arguments]", m = "[object Map]", b = "[object Object]", y = "[object Set]", v = /^\[object .+?Constructor\]$/, C = /^(?:0|[1-9]\d*)$/, x = {};
          x["[object Float32Array]"] = x["[object Float64Array]"] = x["[object Int8Array]"] = x["[object Int16Array]"] = x["[object Int32Array]"] = x["[object Uint8Array]"] = x["[object Uint8ClampedArray]"] = x["[object Uint16Array]"] = x["[object Uint32Array]"] = !0, x[_] = x["[object Array]"] = x["[object ArrayBuffer]"] = x["[object Boolean]"] = x["[object DataView]"] = x["[object Date]"] = x["[object Error]"] = x["[object Function]"] = x[m] = x["[object Number]"] = x[b] = x["[object RegExp]"] = x[y] = x["[object String]"] = x["[object WeakMap]"] = !1;
          var N = typeof u == "object" && u && u.Object === Object && u, G = typeof self == "object" && self && self.Object === Object && self, K = N || G || Function("return this")(), j = i && !i.nodeType && i, V = j && typeof r == "object" && r && !r.nodeType && r, P = V && V.exports === j, M = P && N.process, B = function() {
            try {
              return M && M.binding && M.binding("util");
            } catch {
            }
          }(), I = B && B.isTypedArray;
          function J(W, se) {
            for (var we = -1, Ce = W == null ? 0 : W.length; ++we < Ce; ) if (se(W[we], we, W)) return !0;
            return !1;
          }
          function Q(W) {
            var se = -1, we = Array(W.size);
            return W.forEach(function(Ce, it) {
              we[++se] = [it, Ce];
            }), we;
          }
          function z(W) {
            var se = -1, we = Array(W.size);
            return W.forEach(function(Ce) {
              we[++se] = Ce;
            }), we;
          }
          var A, ae, le, ne = Array.prototype, ce = Function.prototype, ye = Object.prototype, ee = K["__core-js_shared__"], de = ce.toString, R = ye.hasOwnProperty, ie = (A = /[^.]+$/.exec(ee && ee.keys && ee.keys.IE_PROTO || "")) ? "Symbol(src)_1." + A : "", be = ye.toString, Te = RegExp("^" + de.call(R).replace(/[\\^$.*+?()[\]{}|]/g, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"), ke = P ? K.Buffer : void 0, Pe = K.Symbol, Se = K.Uint8Array, ze = ye.propertyIsEnumerable, Je = ne.splice, X = Pe ? Pe.toStringTag : void 0, q = Object.getOwnPropertySymbols, me = ke ? ke.isBuffer : void 0, c = (ae = Object.keys, le = Object, function(W) {
            return ae(le(W));
          }), f = gn(K, "DataView"), k = gn(K, "Map"), U = gn(K, "Promise"), F = gn(K, "Set"), H = gn(K, "WeakMap"), he = gn(Object, "create"), je = bn(f), Re = bn(k), Xe = bn(U), We = bn(F), It = bn(H), wt = Pe ? Pe.prototype : void 0, Jt = wt ? wt.valueOf : void 0;
          function kt(W) {
            var se = -1, we = W == null ? 0 : W.length;
            for (this.clear(); ++se < we; ) {
              var Ce = W[se];
              this.set(Ce[0], Ce[1]);
            }
          }
          function gt(W) {
            var se = -1, we = W == null ? 0 : W.length;
            for (this.clear(); ++se < we; ) {
              var Ce = W[se];
              this.set(Ce[0], Ce[1]);
            }
          }
          function cn(W) {
            var se = -1, we = W == null ? 0 : W.length;
            for (this.clear(); ++se < we; ) {
              var Ce = W[se];
              this.set(Ce[0], Ce[1]);
            }
          }
          function Er(W) {
            var se = -1, we = W == null ? 0 : W.length;
            for (this.__data__ = new cn(); ++se < we; ) this.add(W[se]);
          }
          function Tt(W) {
            var se = this.__data__ = new gt(W);
            this.size = se.size;
          }
          function pt(W, se) {
            var we = ar(W), Ce = !we && ir(W), it = !we && !Ce && Cn(W), Ye = !we && !Ce && !it && Xr(W), st = we || Ce || it || Ye, tt = st ? function(bt, Pt) {
              for (var tn = -1, ht = Array(bt); ++tn < bt; ) ht[tn] = Pt(tn);
              return ht;
            }(W.length, String) : [], Ot = tt.length;
            for (var nt in W) !R.call(W, nt) || st && (nt == "length" || it && (nt == "offset" || nt == "parent") || Ye && (nt == "buffer" || nt == "byteLength" || nt == "byteOffset") || Cr(nt, Ot)) || tt.push(nt);
            return tt;
          }
          function qn(W, se) {
            for (var we = W.length; we--; ) if (Tr(W[we][0], se)) return we;
            return -1;
          }
          function Sn(W) {
            return W == null ? W === void 0 ? "[object Undefined]" : "[object Null]" : X && X in Object(W) ? function(se) {
              var we = R.call(se, X), Ce = se[X];
              try {
                se[X] = void 0;
                var it = !0;
              } catch {
              }
              var Ye = be.call(se);
              return it && (we ? se[X] = Ce : delete se[X]), Ye;
            }(W) : function(se) {
              return be.call(se);
            }(W);
          }
          function or(W) {
            return On(W) && Sn(W) == _;
          }
          function _r(W, se, we, Ce, it) {
            return W === se || (W == null || se == null || !On(W) && !On(se) ? W != W && se != se : function(Ye, st, tt, Ot, nt, bt) {
              var Pt = ar(Ye), tn = ar(st), ht = Pt ? "[object Array]" : ut(Ye), Bt = tn ? "[object Array]" : ut(st), Pn = (ht = ht == _ ? b : ht) == b, ct = (Bt = Bt == _ ? b : Bt) == b, yn = ht == Bt;
              if (yn && Cn(Ye)) {
                if (!Cn(st)) return !1;
                Pt = !0, Pn = !1;
              }
              if (yn && !Pn) return bt || (bt = new Tt()), Pt || Xr(Ye) ? qt(Ye, st, tt, Ot, nt, bt) : function(rt, Ue, Yn, Kt, Or, At, nn) {
                switch (Yn) {
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
                  case m:
                    var Ht = Q;
                  case y:
                    var Qt = 1 & Kt;
                    if (Ht || (Ht = z), rt.size != Ue.size && !Qt) return !1;
                    var cr = nn.get(rt);
                    if (cr) return cr == Ue;
                    Kt |= 2, nn.set(rt, Ue);
                    var Dn = qt(Ht(rt), Ht(Ue), Kt, Or, At, nn);
                    return nn.delete(rt), Dn;
                  case "[object Symbol]":
                    if (Jt) return Jt.call(rt) == Jt.call(Ue);
                }
                return !1;
              }(Ye, st, ht, tt, Ot, nt, bt);
              if (!(1 & tt)) {
                var un = Pn && R.call(Ye, "__wrapped__"), Nn = ct && R.call(st, "__wrapped__");
                if (un || Nn) {
                  var _o = un ? Ye.value() : Ye, xo = Nn ? st.value() : st;
                  return bt || (bt = new Tt()), nt(_o, xo, tt, Ot, bt);
                }
              }
              return yn ? (bt || (bt = new Tt()), function(rt, Ue, Yn, Kt, Or, At) {
                var nn = 1 & Yn, Ht = xr(rt), Qt = Ht.length, cr = xr(Ue).length;
                if (Qt != cr && !nn) return !1;
                for (var Dn = Qt; Dn--; ) {
                  var rn = Ht[Dn];
                  if (!(nn ? rn in Ue : R.call(Ue, rn))) return !1;
                }
                var yt = At.get(rt);
                if (yt && At.get(Ue)) return yt == Ue;
                var Et = !0;
                At.set(rt, Ue), At.set(Ue, rt);
                for (var ur = nn; ++Dn < Qt; ) {
                  rn = Ht[Dn];
                  var dr = rt[rn], vn = Ue[rn];
                  if (Kt) var Ut = nn ? Kt(vn, dr, rn, Ue, rt, At) : Kt(dr, vn, rn, rt, Ue, At);
                  if (!(Ut === void 0 ? dr === vn || Or(dr, vn, Yn, Kt, At) : Ut)) {
                    Et = !1;
                    break;
                  }
                  ur || (ur = rn == "constructor");
                }
                if (Et && !ur) {
                  var Wt = rt.constructor, on = Ue.constructor;
                  Wt == on || !("constructor" in rt) || !("constructor" in Ue) || typeof Wt == "function" && Wt instanceof Wt && typeof on == "function" && on instanceof on || (Et = !1);
                }
                return At.delete(rt), At.delete(Ue), Et;
              }(Ye, st, tt, Ot, nt, bt)) : !1;
            }(W, se, we, Ce, _r, it));
          }
          function Eo(W) {
            return !(!lr(W) || function(se) {
              return !!ie && ie in se;
            }(W)) && (sr(W) ? Te : v).test(bn(W));
          }
          function en(W) {
            if (we = (se = W) && se.constructor, Ce = typeof we == "function" && we.prototype || ye, se !== Ce) return c(W);
            var se, we, Ce, it = [];
            for (var Ye in Object(W)) R.call(W, Ye) && Ye != "constructor" && it.push(Ye);
            return it;
          }
          function qt(W, se, we, Ce, it, Ye) {
            var st = 1 & we, tt = W.length, Ot = se.length;
            if (tt != Ot && !(st && Ot > tt)) return !1;
            var nt = Ye.get(W);
            if (nt && Ye.get(se)) return nt == se;
            var bt = -1, Pt = !0, tn = 2 & we ? new Er() : void 0;
            for (Ye.set(W, se), Ye.set(se, W); ++bt < tt; ) {
              var ht = W[bt], Bt = se[bt];
              if (Ce) var Pn = st ? Ce(Bt, ht, bt, se, W, Ye) : Ce(ht, Bt, bt, W, se, Ye);
              if (Pn !== void 0) {
                if (Pn) continue;
                Pt = !1;
                break;
              }
              if (tn) {
                if (!J(se, function(ct, yn) {
                  if (un = yn, !tn.has(un) && (ht === ct || it(ht, ct, we, Ce, Ye))) return tn.push(yn);
                  var un;
                })) {
                  Pt = !1;
                  break;
                }
              } else if (ht !== Bt && !it(ht, Bt, we, Ce, Ye)) {
                Pt = !1;
                break;
              }
            }
            return Ye.delete(W), Ye.delete(se), Pt;
          }
          function xr(W) {
            return function(se, we, Ce) {
              var it = we(se);
              return ar(se) ? it : function(Ye, st) {
                for (var tt = -1, Ot = st.length, nt = Ye.length; ++tt < Ot; ) Ye[nt + tt] = st[tt];
                return Ye;
              }(it, Ce(se));
            }(W, Zr, Sr);
          }
          function Yt(W, se) {
            var we, Ce, it = W.__data__;
            return ((Ce = typeof (we = se)) == "string" || Ce == "number" || Ce == "symbol" || Ce == "boolean" ? we !== "__proto__" : we === null) ? it[typeof se == "string" ? "string" : "hash"] : it.map;
          }
          function gn(W, se) {
            var we = function(Ce, it) {
              return Ce == null ? void 0 : Ce[it];
            }(W, se);
            return Eo(we) ? we : void 0;
          }
          kt.prototype.clear = function() {
            this.__data__ = he ? he(null) : {}, this.size = 0;
          }, kt.prototype.delete = function(W) {
            var se = this.has(W) && delete this.__data__[W];
            return this.size -= se ? 1 : 0, se;
          }, kt.prototype.get = function(W) {
            var se = this.__data__;
            if (he) {
              var we = se[W];
              return we === "__lodash_hash_undefined__" ? void 0 : we;
            }
            return R.call(se, W) ? se[W] : void 0;
          }, kt.prototype.has = function(W) {
            var se = this.__data__;
            return he ? se[W] !== void 0 : R.call(se, W);
          }, kt.prototype.set = function(W, se) {
            var we = this.__data__;
            return this.size += this.has(W) ? 0 : 1, we[W] = he && se === void 0 ? "__lodash_hash_undefined__" : se, this;
          }, gt.prototype.clear = function() {
            this.__data__ = [], this.size = 0;
          }, gt.prototype.delete = function(W) {
            var se = this.__data__, we = qn(se, W);
            return !(we < 0) && (we == se.length - 1 ? se.pop() : Je.call(se, we, 1), --this.size, !0);
          }, gt.prototype.get = function(W) {
            var se = this.__data__, we = qn(se, W);
            return we < 0 ? void 0 : se[we][1];
          }, gt.prototype.has = function(W) {
            return qn(this.__data__, W) > -1;
          }, gt.prototype.set = function(W, se) {
            var we = this.__data__, Ce = qn(we, W);
            return Ce < 0 ? (++this.size, we.push([W, se])) : we[Ce][1] = se, this;
          }, cn.prototype.clear = function() {
            this.size = 0, this.__data__ = { hash: new kt(), map: new (k || gt)(), string: new kt() };
          }, cn.prototype.delete = function(W) {
            var se = Yt(this, W).delete(W);
            return this.size -= se ? 1 : 0, se;
          }, cn.prototype.get = function(W) {
            return Yt(this, W).get(W);
          }, cn.prototype.has = function(W) {
            return Yt(this, W).has(W);
          }, cn.prototype.set = function(W, se) {
            var we = Yt(this, W), Ce = we.size;
            return we.set(W, se), this.size += we.size == Ce ? 0 : 1, this;
          }, Er.prototype.add = Er.prototype.push = function(W) {
            return this.__data__.set(W, "__lodash_hash_undefined__"), this;
          }, Er.prototype.has = function(W) {
            return this.__data__.has(W);
          }, Tt.prototype.clear = function() {
            this.__data__ = new gt(), this.size = 0;
          }, Tt.prototype.delete = function(W) {
            var se = this.__data__, we = se.delete(W);
            return this.size = se.size, we;
          }, Tt.prototype.get = function(W) {
            return this.__data__.get(W);
          }, Tt.prototype.has = function(W) {
            return this.__data__.has(W);
          }, Tt.prototype.set = function(W, se) {
            var we = this.__data__;
            if (we instanceof gt) {
              var Ce = we.__data__;
              if (!k || Ce.length < 199) return Ce.push([W, se]), this.size = ++we.size, this;
              we = this.__data__ = new cn(Ce);
            }
            return we.set(W, se), this.size = we.size, this;
          };
          var Sr = q ? function(W) {
            return W == null ? [] : (W = Object(W), function(se, we) {
              for (var Ce = -1, it = se == null ? 0 : se.length, Ye = 0, st = []; ++Ce < it; ) {
                var tt = se[Ce];
                we(tt, Ce, se) && (st[Ye++] = tt);
              }
              return st;
            }(q(W), function(se) {
              return ze.call(W, se);
            }));
          } : function() {
            return [];
          }, ut = Sn;
          function Cr(W, se) {
            return !!(se = se ?? 9007199254740991) && (typeof W == "number" || C.test(W)) && W > -1 && W % 1 == 0 && W < se;
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
          function Tr(W, se) {
            return W === se || W != W && se != se;
          }
          (f && ut(new f(new ArrayBuffer(1))) != "[object DataView]" || k && ut(new k()) != m || U && ut(U.resolve()) != "[object Promise]" || F && ut(new F()) != y || H && ut(new H()) != "[object WeakMap]") && (ut = function(W) {
            var se = Sn(W), we = se == b ? W.constructor : void 0, Ce = we ? bn(we) : "";
            if (Ce) switch (Ce) {
              case je:
                return "[object DataView]";
              case Re:
                return m;
              case Xe:
                return "[object Promise]";
              case We:
                return y;
              case It:
                return "[object WeakMap]";
            }
            return se;
          });
          var ir = or(/* @__PURE__ */ function() {
            return arguments;
          }()) ? or : function(W) {
            return On(W) && R.call(W, "callee") && !ze.call(W, "callee");
          }, ar = Array.isArray, Cn = me || function() {
            return !1;
          };
          function sr(W) {
            if (!lr(W)) return !1;
            var se = Sn(W);
            return se == "[object Function]" || se == "[object GeneratorFunction]" || se == "[object AsyncFunction]" || se == "[object Proxy]";
          }
          function Tn(W) {
            return typeof W == "number" && W > -1 && W % 1 == 0 && W <= 9007199254740991;
          }
          function lr(W) {
            var se = typeof W;
            return W != null && (se == "object" || se == "function");
          }
          function On(W) {
            return W != null && typeof W == "object";
          }
          var Xr = I ? /* @__PURE__ */ function(W) {
            return function(se) {
              return W(se);
            };
          }(I) : function(W) {
            return On(W) && Tn(W.length) && !!x[Sn(W)];
          };
          function Zr(W) {
            return (se = W) != null && Tn(se.length) && !sr(se) ? pt(W) : en(W);
            var se;
          }
          r.exports = function(W, se) {
            return _r(W, se);
          };
        }).call(this, l(15), l(33)(p));
      }, function(p, i, l) {
        var u, r = function() {
          return u === void 0 && (u = !!(window && document && document.all && !window.atob)), u;
        }, _ = /* @__PURE__ */ function() {
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
        }(), m = [];
        function b(P) {
          for (var M = -1, B = 0; B < m.length; B++) if (m[B].identifier === P) {
            M = B;
            break;
          }
          return M;
        }
        function y(P, M) {
          for (var B = {}, I = [], J = 0; J < P.length; J++) {
            var Q = P[J], z = M.base ? Q[0] + M.base : Q[0], A = B[z] || 0, ae = "".concat(z, " ").concat(A);
            B[z] = A + 1;
            var le = b(ae), ne = { css: Q[1], media: Q[2], sourceMap: Q[3] };
            le !== -1 ? (m[le].references++, m[le].updater(ne)) : m.push({ identifier: ae, updater: V(ne, M), references: 1 }), I.push(ae);
          }
          return I;
        }
        function v(P) {
          var M = document.createElement("style"), B = P.attributes || {};
          if (B.nonce === void 0) {
            var I = l.nc;
            I && (B.nonce = I);
          }
          if (Object.keys(B).forEach(function(Q) {
            M.setAttribute(Q, B[Q]);
          }), typeof P.insert == "function") P.insert(M);
          else {
            var J = _(P.insert || "head");
            if (!J) throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");
            J.appendChild(M);
          }
          return M;
        }
        var C, x = (C = [], function(P, M) {
          return C[P] = M, C.filter(Boolean).join(`
`);
        });
        function N(P, M, B, I) {
          var J = B ? "" : I.media ? "@media ".concat(I.media, " {").concat(I.css, "}") : I.css;
          if (P.styleSheet) P.styleSheet.cssText = x(M, J);
          else {
            var Q = document.createTextNode(J), z = P.childNodes;
            z[M] && P.removeChild(z[M]), z.length ? P.insertBefore(Q, z[M]) : P.appendChild(Q);
          }
        }
        function G(P, M, B) {
          var I = B.css, J = B.media, Q = B.sourceMap;
          if (J ? P.setAttribute("media", J) : P.removeAttribute("media"), Q && typeof btoa < "u" && (I += `
/*# sourceMappingURL=data:application/json;base64,`.concat(btoa(unescape(encodeURIComponent(JSON.stringify(Q)))), " */")), P.styleSheet) P.styleSheet.cssText = I;
          else {
            for (; P.firstChild; ) P.removeChild(P.firstChild);
            P.appendChild(document.createTextNode(I));
          }
        }
        var K = null, j = 0;
        function V(P, M) {
          var B, I, J;
          if (M.singleton) {
            var Q = j++;
            B = K || (K = v(M)), I = N.bind(null, B, Q, !1), J = N.bind(null, B, Q, !0);
          } else B = v(M), I = G.bind(null, B, M), J = function() {
            (function(z) {
              if (z.parentNode === null) return !1;
              z.parentNode.removeChild(z);
            })(B);
          };
          return I(P), function(z) {
            if (z) {
              if (z.css === P.css && z.media === P.media && z.sourceMap === P.sourceMap) return;
              I(P = z);
            } else J();
          };
        }
        p.exports = function(P, M) {
          (M = M || {}).singleton || typeof M.singleton == "boolean" || (M.singleton = r());
          var B = y(P = P || [], M);
          return function(I) {
            if (I = I || [], Object.prototype.toString.call(I) === "[object Array]") {
              for (var J = 0; J < B.length; J++) {
                var Q = b(B[J]);
                m[Q].references--;
              }
              for (var z = y(I, M), A = 0; A < B.length; A++) {
                var ae = b(B[A]);
                m[ae].references === 0 && (m[ae].updater(), m.splice(ae, 1));
              }
              B = z;
            }
          };
        };
      }, function(p, i, l) {
        p.exports = function(u) {
          var r = [];
          return r.toString = function() {
            return this.map(function(_) {
              var m = function(b, y) {
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
              }(_, u);
              return _[2] ? "@media " + _[2] + "{" + m + "}" : m;
            }).join("");
          }, r.i = function(_, m) {
            typeof _ == "string" && (_ = [[null, _, ""]]);
            for (var b = {}, y = 0; y < this.length; y++) {
              var v = this[y][0];
              v != null && (b[v] = !0);
            }
            for (y = 0; y < _.length; y++) {
              var C = _[y];
              C[0] != null && b[C[0]] || (m && !C[2] ? C[2] = m : m && (C[2] = "(" + C[2] + ") and (" + m + ")"), r.push(C));
            }
          }, r;
        };
      }, function(p, i, l) {
        l.d(i, "c", function() {
          return _;
        }), l.d(i, "b", function() {
          return m;
        }), l.d(i, "a", function() {
          return b;
        });
        var u = l(3);
        let r = 0;
        function _(y) {
          const v = { editors: {}, options: {} };
          if (typeof y[0] == "string") u.a.warn(`[CKEditorInspector] The CKEditorInspector.attach( '${y[0]}', editor ) syntax has been deprecated and will be removed in the near future. To pass a name of an editor instance, use CKEditorInspector.attach( { '${y[0]}': editor } ) instead. Learn more in https://github.com/ckeditor/ckeditor5-inspector/blob/master/README.md.`), v.editors[y[0]] = y[1];
          else {
            if ((C = y[0]).model && C.editing) v.editors["editor-" + ++r] = y[0];
            else for (const x in y[0]) v.editors[x] = y[0][x];
            v.options = y[1] || v.options;
          }
          var C;
          return v;
        }
        function m(y) {
          return [...y][0][0] || "";
        }
        function b(y, v) {
          const C = Math.min(y.length, v.length);
          for (let x = 0; x < C; x++) if (y[x] != v[x]) return x;
          return y.length == v.length ? "same" : y.length < v.length ? "prefix" : "extension";
        }
      }, function(p, i, l) {
        l.d(i, "a", function() {
          return m;
        }), l.d(i, "d", function() {
          return v;
        }), l.d(i, "c", function() {
          return C;
        }), l.d(i, "e", function() {
          return x;
        }), l.d(i, "b", function() {
          return N;
        });
        var u = l(2), r = l(8), _ = l(1);
        const m = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_view", b = `&lt;!--The View UI element content has been skipped. <a href="${m}_uielement-UIElement.html" target="_blank">Find out why</a>. --&gt;`, y = `&lt;!--The View raw element content has been skipped. <a href="${m}_rawelement-RawElement.html" target="_blank">Find out why</a>. --&gt;`;
        function v(P) {
          return P ? [...P.editing.view.document.roots] : [];
        }
        function C(P, M) {
          if (!P) return [];
          const B = [], I = P.editing.view.document.selection;
          for (const J of I.getRanges()) J.root.rootName === M && B.push({ type: "selection", start: Object(u.a)(J.start), end: Object(u.a)(J.end) });
          return B;
        }
        function x({ currentEditor: P, currentRootName: M, ranges: B }) {
          return !P || !M ? null : [G(P.editing.view.document.getRoot(M), [...B])];
        }
        function N(P) {
          const M = { editorNode: P, properties: {}, attributes: {}, customProperties: {} };
          if (Object(u.d)(P)) {
            Object(u.g)(P) ? (M.type = "RootEditableElement", M.name = P.rootName, M.url = m + "_rooteditableelement-RootEditableElement.html") : (M.name = P.name, Object(u.b)(P) ? (M.type = "AttributeElement", M.url = m + "_attributeelement-AttributeElement.html") : Object(u.e)(P) ? (M.type = "EmptyElement", M.url = m + "_emptyelement-EmptyElement.html") : Object(u.h)(P) ? (M.type = "UIElement", M.url = m + "_uielement-UIElement.html") : Object(u.f)(P) ? (M.type = "RawElement", M.url = m + "_rawelement-RawElement.html") : Object(u.c)(P) ? (M.type = "EditableElement", M.url = m + "_editableelement-EditableElement.html") : (M.type = "ContainerElement", M.url = m + "_containerelement-ContainerElement.html")), V(P).forEach(([B, I]) => {
              M.attributes[B] = { value: I };
            }), M.properties = { index: { value: P.index }, isEmpty: { value: P.isEmpty }, childCount: { value: P.childCount } };
            for (let [B, I] of P.getCustomProperties()) typeof B == "symbol" && (B = B.toString()), M.customProperties[B] = { value: I };
          } else M.name = P.data, M.type = "Text", M.url = m + "_text-Text.html", M.properties = { index: { value: P.index } };
          return M.properties = Object(_.b)(M.properties), M.customProperties = Object(_.b)(M.customProperties), M.attributes = Object(_.b)(M.attributes), M;
        }
        function G(P, M) {
          const B = {};
          return Object.assign(B, { index: P.index, path: P.getPath(), node: P, positionsBefore: [], positionsAfter: [] }), Object(u.d)(P) ? function(I, J) {
            const Q = I.node;
            Object.assign(I, { type: "element", children: [], positions: [] }), I.name = Q.name, Object(u.b)(Q) ? I.elementType = "attribute" : Object(u.g)(Q) ? I.elementType = "root" : Object(u.e)(Q) ? I.elementType = "empty" : Object(u.h)(Q) ? I.elementType = "ui" : Object(u.f)(Q) ? I.elementType = "raw" : I.elementType = "container", Object(u.e)(Q) ? I.presentation = { isEmpty: !0 } : Object(u.h)(Q) ? I.children.push({ type: "comment", text: b }) : Object(u.f)(Q) && I.children.push({ type: "comment", text: y });
            for (const z of Q.getChildren()) I.children.push(G(z, J));
            (function(z, A) {
              for (const ae of A) {
                const le = K(z, ae);
                for (const ne of le) {
                  const ce = ne.offset;
                  if (ce === 0) {
                    const ye = z.children[0];
                    ye ? ye.positionsBefore.push(ne) : z.positions.push(ne);
                  } else if (ce === z.children.length) {
                    const ye = z.children[z.children.length - 1];
                    ye ? ye.positionsAfter.push(ne) : z.positions.push(ne);
                  } else {
                    let ye = ne.isEnd ? 0 : z.children.length - 1, ee = z.children[ye];
                    for (; ee; ) {
                      if (ee.index === ce) {
                        ee.positionsBefore.push(ne);
                        break;
                      }
                      if (ee.index + 1 === ce) {
                        ee.positionsAfter.push(ne);
                        break;
                      }
                      ye += ne.isEnd ? 1 : -1, ee = z.children[ye];
                    }
                  }
                }
              }
            })(I, J), I.attributes = function(z) {
              const A = V(z).map(([ae, le]) => [ae, Object(_.a)(le, !1)]);
              return new Map(A);
            }(Q);
          }(B, M) : function(I, J) {
            Object.assign(I, { type: "text", startOffset: 0, text: I.node.data, positions: [] });
            for (const Q of J) {
              const z = K(I, Q);
              I.positions.push(...z);
            }
          }(B, M), B;
        }
        function K(P, M) {
          const B = P.path, I = M.start.path, J = M.end.path, Q = [];
          return j(B, I) && Q.push({ offset: I[I.length - 1], isEnd: !1, presentation: M.presentation || null, type: M.type, name: M.name || null }), j(B, J) && Q.push({ offset: J[J.length - 1], isEnd: !0, presentation: M.presentation || null, type: M.type, name: M.name || null }), Q;
        }
        function j(P, M) {
          return P.length === M.length - 1 && Object(r.a)(P, M) === "prefix";
        }
        function V(P) {
          return [...P.getAttributes()].sort(([M], [B]) => M.toUpperCase() < B.toUpperCase() ? -1 : 1);
        }
      }, function(p, i, l) {
        l.d(i, "d", function() {
          return y;
        }), l.d(i, "c", function() {
          return v;
        }), l.d(i, "a", function() {
          return C;
        }), l.d(i, "e", function() {
          return x;
        }), l.d(i, "b", function() {
          return N;
        });
        var u = l(4), r = l(8), _ = l(1);
        const m = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_", b = ["#03a9f4", "#fb8c00", "#009688", "#e91e63", "#4caf50", "#00bcd4", "#607d8b", "#cddc39", "#9c27b0", "#f44336", "#6d4c41", "#8bc34a", "#3f51b5", "#2196f3", "#f4511e", "#673ab7", "#ffb300"];
        function y(M) {
          if (!M) return [];
          const B = [...M.model.document.roots];
          return B.filter(({ rootName: I }) => I !== "$graveyard").concat(B.filter(({ rootName: I }) => I === "$graveyard"));
        }
        function v(M, B) {
          if (!M) return [];
          const I = [], J = M.model;
          for (const Q of J.document.selection.getRanges()) Q.root.rootName === B && I.push({ type: "selection", start: Object(u.a)(Q.start), end: Object(u.a)(Q.end) });
          return I;
        }
        function C(M, B) {
          if (!M) return [];
          const I = [], J = M.model;
          let Q = 0;
          for (const z of J.markers) {
            const { name: A, affectsData: ae, managedUsingOperations: le } = z, ne = z.getStart(), ce = z.getEnd();
            ne.root.rootName === B && I.push({ type: "marker", marker: z, name: A, affectsData: ae, managedUsingOperations: le, presentation: { color: b[Q++ % (b.length - 1)] }, start: Object(u.a)(ne), end: Object(u.a)(ce) });
          }
          return I;
        }
        function x({ currentEditor: M, currentRootName: B, ranges: I, markers: J }) {
          return M ? [G(M.model.document.getRoot(B), [...I, ...J])] : [];
        }
        function N(M, B) {
          const I = { editorNode: B, properties: {}, attributes: {} };
          Object(u.c)(B) ? (Object(u.d)(B) ? (I.type = "RootElement", I.name = B.rootName, I.url = m + "rootelement-RootElement.html") : (I.type = "Element", I.name = B.name, I.url = m + "element-Element.html"), I.properties = { childCount: { value: B.childCount }, startOffset: { value: B.startOffset }, endOffset: { value: B.endOffset }, maxOffset: { value: B.maxOffset } }) : (I.name = B.data, I.type = "Text", I.url = m + "text-Text.html", I.properties = { startOffset: { value: B.startOffset }, endOffset: { value: B.endOffset }, offsetSize: { value: B.offsetSize } }), I.properties.path = { value: Object(u.b)(B) }, j(B).forEach(([J, Q]) => {
            I.attributes[J] = { value: Q };
          }), I.properties = Object(_.b)(I.properties), I.attributes = Object(_.b)(I.attributes);
          for (const J in I.attributes) {
            const Q = {}, z = M.model.schema.getAttributeProperties(J);
            for (const A in z) Q[A] = { value: z[A] };
            I.attributes[J].subProperties = Object(_.b)(Q);
          }
          return I;
        }
        function G(M, B) {
          const I = {}, { startOffset: J, endOffset: Q } = M;
          return Object.assign(I, { startOffset: J, endOffset: Q, node: M, path: M.getPath(), positionsBefore: [], positionsAfter: [] }), Object(u.c)(M) ? function(z, A) {
            const ae = z.node;
            Object.assign(z, { type: "element", name: ae.name, children: [], maxOffset: ae.maxOffset, positions: [] });
            for (const le of ae.getChildren()) z.children.push(G(le, A));
            (function(le, ne) {
              for (const ce of ne) {
                const ye = V(le, ce);
                for (const ee of ye) {
                  const de = ee.offset;
                  if (de === 0) {
                    const R = le.children[0];
                    R ? R.positionsBefore.push(ee) : le.positions.push(ee);
                  } else if (de === le.maxOffset) {
                    const R = le.children[le.children.length - 1];
                    R ? R.positionsAfter.push(ee) : le.positions.push(ee);
                  } else {
                    let R = ee.isEnd ? 0 : le.children.length - 1, ie = le.children[R];
                    for (; ie; ) {
                      if (ie.startOffset === de) {
                        ie.positionsBefore.push(ee);
                        break;
                      }
                      if (ie.endOffset === de) {
                        const be = le.children[R + 1], Te = ie.type === "text" && be && be.type === "element", ke = ie.type === "element" && be && be.type === "text", Pe = ie.type === "text" && be && be.type === "text";
                        ee.isEnd && (Te || ke || Pe) ? be.positionsBefore.push(ee) : ie.positionsAfter.push(ee);
                        break;
                      }
                      if (ie.startOffset < de && ie.endOffset > de) {
                        ie.positions.push(ee);
                        break;
                      }
                      R += ee.isEnd ? 1 : -1, ie = le.children[R];
                    }
                  }
                }
              }
            })(z, A), z.attributes = K(ae);
          }(I, B) : function(z) {
            const A = z.node;
            Object.assign(z, { type: "text", text: A.data, positions: [], presentation: { dontRenderAttributeValue: !0 } }), z.attributes = K(A);
          }(I), I;
        }
        function K(M) {
          const B = j(M).map(([I, J]) => [I, Object(_.a)(J, !1)]);
          return new Map(B);
        }
        function j(M) {
          return [...M.getAttributes()].sort(([B], [I]) => B < I ? -1 : 1);
        }
        function V(M, B) {
          const I = M.path, J = B.start.path, Q = B.end.path, z = [];
          return P(I, J) && z.push({ offset: J[J.length - 1], isEnd: !1, presentation: B.presentation || null, type: B.type, name: B.name || null }), P(I, Q) && z.push({ offset: Q[Q.length - 1], isEnd: !0, presentation: B.presentation || null, type: B.type, name: B.name || null }), z;
        }
        function P(M, B) {
          return M.length === B.length - 1 && Object(r.a)(M, B) === "prefix";
        }
      }, function(p, i, l) {
        l.d(i, "a", function() {
          return j;
        });
        var u = l(0), r = l.n(u), _ = l(5), m = l.n(_);
        class b extends u.Component {
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
            return !m()(this.props, P);
          }
        }
        var y = l(1);
        class v extends u.PureComponent {
          render() {
            let P;
            const M = Object(y.c)(this.props.value, 500);
            return this.props.dontRenderValue || (P = r.a.createElement("span", { className: "ck-inspector-tree-node__attribute__value" }, M)), r.a.createElement("span", { className: "ck-inspector-tree-node__attribute" }, r.a.createElement("span", { className: "ck-inspector-tree-node__attribute__name", title: M }, this.props.name), P);
          }
        }
        class C extends u.Component {
          render() {
            const P = this.props.definition, M = { className: ["ck-inspector-tree__position", P.type === "selection" ? "ck-inspector-tree__position_selection" : "", P.type === "marker" ? "ck-inspector-tree__position_marker" : "", P.isEnd ? "ck-inspector-tree__position_end" : ""].join(" "), style: {} };
            return P.presentation && P.presentation.color && (M.style["--ck-inspector-color-tree-position"] = P.presentation.color), P.type === "marker" && (M["data-marker-name"] = P.name), r.a.createElement("span", M, "​");
          }
          shouldComponentUpdate(P) {
            return !m()(this.props, P);
          }
        }
        class x extends b {
          render() {
            const P = this.definition, M = P.presentation, B = M && M.isEmpty, I = M && M.cssClass, J = this.getChildren(), Q = ["ck-inspector-code", "ck-inspector-tree-node", this.isActive ? "ck-inspector-tree-node_active" : "", B ? "ck-inspector-tree-node_empty" : "", I], z = [], A = [];
            P.positionsBefore && P.positionsBefore.forEach((le, ne) => {
              z.push(r.a.createElement(C, { key: "position-before:" + ne, definition: le }));
            }), P.positionsAfter && P.positionsAfter.forEach((le, ne) => {
              A.push(r.a.createElement(C, { key: "position-after:" + ne, definition: le }));
            }), P.positions && P.positions.forEach((le, ne) => {
              J.push(r.a.createElement(C, { key: "position" + ne, definition: le }));
            });
            let ae = P.name;
            return this.globalTreeProps.showElementTypes && (ae = P.elementType + ":" + ae), r.a.createElement("div", { className: Q.join(" "), onClick: this.handleClick }, z, r.a.createElement("span", { className: "ck-inspector-tree-node__name" }, r.a.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_open" }), ae, this.getAttributes(), B ? "" : r.a.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_close" })), r.a.createElement("div", { className: "ck-inspector-tree-node__content" }, J), B ? "" : r.a.createElement("span", { className: "ck-inspector-tree-node__name ck-inspector-tree-node__name_close" }, r.a.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_open" }), "/", ae, r.a.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_close" }), A));
          }
          getAttributes() {
            const P = [], M = this.definition;
            for (const [B, I] of M.attributes) P.push(r.a.createElement(v, { key: B, name: B, value: I }));
            return P;
          }
          shouldComponentUpdate(P) {
            return !m()(this.props, P);
          }
        }
        class N extends b {
          render() {
            const P = this.definition, M = ["ck-inspector-tree-text", this.isActive ? "ck-inspector-tree-node_active" : ""].join(" ");
            let B = this.definition.text;
            P.positions && P.positions.length && (B = B.split(""), Array.from(P.positions).sort((J, Q) => J.offset < Q.offset ? -1 : J.offset === Q.offset ? 0 : 1).reverse().forEach((J, Q) => {
              B.splice(J.offset - P.startOffset, 0, r.a.createElement(C, { key: "position" + Q, definition: J }));
            }));
            const I = [B];
            return P.positionsBefore && P.positionsBefore.length && P.positionsBefore.forEach((J, Q) => {
              I.unshift(r.a.createElement(C, { key: "position-before:" + Q, definition: J }));
            }), P.positionsAfter && P.positionsAfter.length && P.positionsAfter.forEach((J, Q) => {
              I.push(r.a.createElement(C, { key: "position-after:" + Q, definition: J }));
            }), r.a.createElement("span", { className: M, onClick: this.handleClick }, r.a.createElement("span", { className: "ck-inspector-tree-node__content" }, this.globalTreeProps.showCompactText ? "" : this.getAttributes(), this.globalTreeProps.showCompactText ? "" : '"', I, this.globalTreeProps.showCompactText ? "" : '"'));
          }
          getAttributes() {
            const P = [], M = this.definition, B = M.presentation, I = B && B.dontRenderAttributeValue;
            for (const [J, Q] of M.attributes) P.push(r.a.createElement(v, { key: J, name: J, value: Q, dontRenderValue: I }));
            return r.a.createElement("span", { className: "ck-inspector-tree-text__attributes" }, P);
          }
          shouldComponentUpdate(P) {
            return !m()(this.props, P);
          }
        }
        class G extends u.Component {
          render() {
            return r.a.createElement("span", { className: "ck-inspector-tree-comment", dangerouslySetInnerHTML: { __html: this.props.definition.text } });
          }
        }
        function K(V, P, M) {
          return V.type === "element" ? r.a.createElement(x, { key: P, definition: V, globalTreeProps: M }) : V.type === "text" ? r.a.createElement(N, { key: P, definition: V, globalTreeProps: M }) : V.type === "comment" ? r.a.createElement(G, { key: P, definition: V }) : void 0;
        }
        l(34);
        class j extends u.Component {
          render() {
            let P;
            return P = this.props.definition ? this.props.definition.map((M, B) => K(M, B, { onClick: this.props.onClick, showCompactText: this.props.showCompactText, showElementTypes: this.props.showElementTypes, activeNode: this.props.activeNode })) : "Nothing to show.", r.a.createElement("div", { className: ["ck-inspector-tree", ...this.props.className || [], this.props.textDirection ? "ck-inspector-tree_text-direction_" + this.props.textDirection : "", this.props.showCompactText ? "ck-inspector-tree_compact-text" : ""].join(" ") }, P);
          }
        }
      }, function(p, i, l) {
        (function u() {
          if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE == "function")
            try {
              __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(u);
            } catch (r) {
              console.error(r);
            }
        })(), p.exports = l(22);
      }, function(p, i, l) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.stringifyPath = i.quoteKey = i.isValidVariableName = i.IS_VALID_IDENTIFIER = i.quoteString = void 0;
        const u = /[\\\'\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, r = /* @__PURE__ */ new Map([["\b", "\\b"], ["	", "\\t"], [`
`, "\\n"], ["\f", "\\f"], ["\r", "\\r"], ["'", "\\'"], ['"', '\\"'], ["\\", "\\\\"]]);
        function _(y) {
          return r.get(y) || "\\u" + ("0000" + y.charCodeAt(0).toString(16)).slice(-4);
        }
        i.quoteString = function(y) {
          return `'${y.replace(u, _)}'`;
        };
        const m = new Set("break else new var case finally return void catch for switch while continue function this with default if throw delete in try do instanceof typeof abstract enum int short boolean export interface static byte extends long super char final native synchronized class float package throws const goto private transient debugger implements protected volatile double import public let yield".split(" "));
        function b(y) {
          return typeof y == "string" && !m.has(y) && i.IS_VALID_IDENTIFIER.test(y);
        }
        i.IS_VALID_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/, i.isValidVariableName = b, i.quoteKey = function(y, v) {
          return b(y) ? y : v(y);
        }, i.stringifyPath = function(y, v) {
          let C = "";
          for (const x of y) b(x) ? C += "." + x : C += `[${v(x)}]`;
          return C;
        };
      }, function(p, i) {
        function l(v, C, x, N) {
          var G, K = (G = N) == null || typeof G == "number" || typeof G == "boolean" ? N : x(N), j = C.get(K);
          return j === void 0 && (j = v.call(this, N), C.set(K, j)), j;
        }
        function u(v, C, x) {
          var N = Array.prototype.slice.call(arguments, 3), G = x(N), K = C.get(G);
          return K === void 0 && (K = v.apply(this, N), C.set(G, K)), K;
        }
        function r(v, C, x, N, G) {
          return x.bind(C, v, N, G);
        }
        function _(v, C) {
          return r(v, this, v.length === 1 ? l : u, C.cache.create(), C.serializer);
        }
        function m() {
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
        p.exports = function(v, C) {
          var x = C && C.cache ? C.cache : y, N = C && C.serializer ? C.serializer : m;
          return (C && C.strategy ? C.strategy : _)(v, { cache: x, serializer: N });
        }, p.exports.strategies = { variadic: function(v, C) {
          return r(v, this, u, C.cache.create(), C.serializer);
        }, monadic: function(v, C) {
          return r(v, this, l, C.cache.create(), C.serializer);
        } };
      }, function(p, i) {
        var l;
        l = /* @__PURE__ */ function() {
          return this;
        }();
        try {
          l = l || new Function("return this")();
        } catch {
          typeof window == "object" && (l = window);
        }
        p.exports = l;
      }, function(p, i, l) {
        var u = Object.getOwnPropertySymbols, r = Object.prototype.hasOwnProperty, _ = Object.prototype.propertyIsEnumerable;
        function m(b) {
          if (b == null) throw new TypeError("Object.assign cannot be called with null or undefined");
          return Object(b);
        }
        p.exports = function() {
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
          for (var v, C, x = m(b), N = 1; N < arguments.length; N++) {
            for (var G in v = Object(arguments[N])) r.call(v, G) && (x[G] = v[G]);
            if (u) {
              C = u(v);
              for (var K = 0; K < C.length; K++) _.call(v, C[K]) && (x[C[K]] = v[C[K]]);
            }
          }
          return x;
        };
      }, function(p, i, l) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.FunctionParser = i.dedentFunction = i.functionToString = i.USED_METHOD_KEY = void 0;
        const u = l(13), r = { " "() {
        } }[" "].toString().charAt(0) === '"', _ = { Function: "function ", GeneratorFunction: "function* ", AsyncFunction: "async function ", AsyncGeneratorFunction: "async function* " }, m = { Function: "", GeneratorFunction: "*", AsyncFunction: "async ", AsyncGeneratorFunction: "async *" }, b = new Set("case delete else in instanceof new return throw typeof void , ; : + - ! ~ & | ^ * / % < > ? =".split(" "));
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
            this.fn = x, this.indent = N, this.next = G, this.key = K, this.pos = 0, this.hadKeyword = !1, this.fnString = Function.prototype.toString.call(x), this.fnType = x.constructor.name, this.keyQuote = K === void 0 ? "" : u.quoteKey(K, G), this.keyPrefix = K === void 0 ? "" : `${this.keyQuote}:${N ? " " : ""}`, this.isMethodCandidate = K !== void 0 && (this.fn.name === "" || this.fn.name === K);
          }
          stringify() {
            const x = this.tryParse();
            return x ? y(x) : `${this.keyPrefix}void ${this.next(this.fnString)}`;
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
            if (r) return;
            let x = this.pos;
            const N = this.fnString.substr(this.pos, this.fn.name.length);
            if (N === this.fn.name && (this.pos += N.length, this.consumeSyntax() === "()" && this.consumeSyntax() === "{}" && this.pos === this.fnString.length)) return !this.isMethodCandidate && u.isValidVariableName(N) || (x += N.length), this.getPrefix() + this.fnString.substr(x);
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
      }, function(p, i, l) {
        p.exports = l(53)();
      }, function(p, i, l) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.stringify = void 0;
        const u = l(25), r = l(13), _ = Symbol("root");
        i.stringify = function(m, b, y, v = {}) {
          const C = typeof y == "string" ? y : " ".repeat(y || 0), x = [], N = /* @__PURE__ */ new Set(), G = /* @__PURE__ */ new Map(), K = /* @__PURE__ */ new Map();
          let j = 0;
          const { maxDepth: V = 100, references: P = !1, skipUndefinedProperties: M = !1, maxValues: B = 1e5 } = v, I = function(A) {
            return A ? (ae, le, ne, ce) => A(ae, le, (ye) => u.toString(ye, le, ne, ce), ce) : u.toString;
          }(b), J = (A, ae) => {
            if (++j > B || M && A === void 0 || x.length > V) return;
            if (ae === void 0) return I(A, C, J, ae);
            x.push(ae);
            const le = Q(A, ae === _ ? void 0 : ae);
            return x.pop(), le;
          }, Q = P ? (A, ae) => {
            if (A !== null && (typeof A == "object" || typeof A == "function" || typeof A == "symbol")) {
              if (G.has(A)) return K.set(x.slice(1), G.get(A)), I(void 0, C, J, ae);
              G.set(A, x.slice(1));
            }
            return I(A, C, J, ae);
          } : (A, ae) => {
            if (N.has(A)) return;
            N.add(A);
            const le = I(A, C, J, ae);
            return N.delete(A), le;
          }, z = J(m, _);
          if (K.size) {
            const A = C ? " " : "", ae = C ? `
` : "";
            let le = `var x${A}=${A}${z};${ae}`;
            for (const [ne, ce] of K.entries())
              le += `x${r.stringifyPath(ne, J)}${A}=${A}x${r.stringifyPath(ce, J)};${ae}`;
            return `(function${A}()${A}{${ae}${le}return x;${ae}}())`;
          }
          return z;
        };
      }, function(p, i, l) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.findInArray = function(u, r) {
          for (var _ = 0, m = u.length; _ < m; _++) if (r.apply(r, [u[_], _, u])) return u[_];
        }, i.isFunction = function(u) {
          return typeof u == "function" || Object.prototype.toString.call(u) === "[object Function]";
        }, i.isNum = function(u) {
          return typeof u == "number" && !isNaN(u);
        }, i.int = function(u) {
          return parseInt(u, 10);
        }, i.dontSetMe = function(u, r, _) {
          if (u[r]) return new Error("Invalid prop ".concat(r, " passed to ").concat(_, " - do not set this, set it on the child."));
        };
      }, function(p, i, l) {
        var u = l(16), r = typeof Symbol == "function" && Symbol.for, _ = r ? Symbol.for("react.element") : 60103, m = r ? Symbol.for("react.portal") : 60106, b = r ? Symbol.for("react.fragment") : 60107, y = r ? Symbol.for("react.strict_mode") : 60108, v = r ? Symbol.for("react.profiler") : 60114, C = r ? Symbol.for("react.provider") : 60109, x = r ? Symbol.for("react.context") : 60110, N = r ? Symbol.for("react.forward_ref") : 60112, G = r ? Symbol.for("react.suspense") : 60113, K = r ? Symbol.for("react.memo") : 60115, j = r ? Symbol.for("react.lazy") : 60116, V = typeof Symbol == "function" && Symbol.iterator;
        function P(X) {
          for (var q = "https://reactjs.org/docs/error-decoder.html?invariant=" + X, me = 1; me < arguments.length; me++) q += "&args[]=" + encodeURIComponent(arguments[me]);
          return "Minified React error #" + X + "; visit " + q + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
        }
        var M = { isMounted: function() {
          return !1;
        }, enqueueForceUpdate: function() {
        }, enqueueReplaceState: function() {
        }, enqueueSetState: function() {
        } }, B = {};
        function I(X, q, me) {
          this.props = X, this.context = q, this.refs = B, this.updater = me || M;
        }
        function J() {
        }
        function Q(X, q, me) {
          this.props = X, this.context = q, this.refs = B, this.updater = me || M;
        }
        I.prototype.isReactComponent = {}, I.prototype.setState = function(X, q) {
          if (typeof X != "object" && typeof X != "function" && X != null) throw Error(P(85));
          this.updater.enqueueSetState(this, X, q, "setState");
        }, I.prototype.forceUpdate = function(X) {
          this.updater.enqueueForceUpdate(this, X, "forceUpdate");
        }, J.prototype = I.prototype;
        var z = Q.prototype = new J();
        z.constructor = Q, u(z, I.prototype), z.isPureReactComponent = !0;
        var A = { current: null }, ae = Object.prototype.hasOwnProperty, le = { key: !0, ref: !0, __self: !0, __source: !0 };
        function ne(X, q, me) {
          var c, f = {}, k = null, U = null;
          if (q != null) for (c in q.ref !== void 0 && (U = q.ref), q.key !== void 0 && (k = "" + q.key), q) ae.call(q, c) && !le.hasOwnProperty(c) && (f[c] = q[c]);
          var F = arguments.length - 2;
          if (F === 1) f.children = me;
          else if (1 < F) {
            for (var H = Array(F), he = 0; he < F; he++) H[he] = arguments[he + 2];
            f.children = H;
          }
          if (X && X.defaultProps) for (c in F = X.defaultProps) f[c] === void 0 && (f[c] = F[c]);
          return { $$typeof: _, type: X, key: k, ref: U, props: f, _owner: A.current };
        }
        function ce(X) {
          return typeof X == "object" && X !== null && X.$$typeof === _;
        }
        var ye = /\/+/g, ee = [];
        function de(X, q, me, c) {
          if (ee.length) {
            var f = ee.pop();
            return f.result = X, f.keyPrefix = q, f.func = me, f.context = c, f.count = 0, f;
          }
          return { result: X, keyPrefix: q, func: me, context: c, count: 0 };
        }
        function R(X) {
          X.result = null, X.keyPrefix = null, X.func = null, X.context = null, X.count = 0, 10 > ee.length && ee.push(X);
        }
        function ie(X, q, me) {
          return X == null ? 0 : function c(f, k, U, F) {
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
                  case _:
                  case m:
                    he = !0;
                }
            }
            if (he) return U(F, f, k === "" ? "." + be(f, 0) : k), 1;
            if (he = 0, k = k === "" ? "." : k + ":", Array.isArray(f)) for (var je = 0; je < f.length; je++) {
              var Re = k + be(H = f[je], je);
              he += c(H, Re, U, F);
            }
            else if (f === null || typeof f != "object" ? Re = null : Re = typeof (Re = V && f[V] || f["@@iterator"]) == "function" ? Re : null, typeof Re == "function") for (f = Re.call(f), je = 0; !(H = f.next()).done; ) he += c(H = H.value, Re = k + be(H, je++), U, F);
            else if (H === "object") throw U = "" + f, Error(P(31, U === "[object Object]" ? "object with keys {" + Object.keys(f).join(", ") + "}" : U, ""));
            return he;
          }(X, "", q, me);
        }
        function be(X, q) {
          return typeof X == "object" && X !== null && X.key != null ? function(me) {
            var c = { "=": "=0", ":": "=2" };
            return "$" + ("" + me).replace(/[=:]/g, function(f) {
              return c[f];
            });
          }(X.key) : q.toString(36);
        }
        function Te(X, q) {
          X.func.call(X.context, q, X.count++);
        }
        function ke(X, q, me) {
          var c = X.result, f = X.keyPrefix;
          X = X.func.call(X.context, q, X.count++), Array.isArray(X) ? Pe(X, c, me, function(k) {
            return k;
          }) : X != null && (ce(X) && (X = function(k, U) {
            return { $$typeof: _, type: k.type, key: U, ref: k.ref, props: k.props, _owner: k._owner };
          }(X, f + (!X.key || q && q.key === X.key ? "" : ("" + X.key).replace(ye, "$&/") + "/") + me)), c.push(X));
        }
        function Pe(X, q, me, c, f) {
          var k = "";
          me != null && (k = ("" + me).replace(ye, "$&/") + "/"), ie(X, ke, q = de(q, k, c, f)), R(q);
        }
        var Se = { current: null };
        function ze() {
          var X = Se.current;
          if (X === null) throw Error(P(321));
          return X;
        }
        var Je = { ReactCurrentDispatcher: Se, ReactCurrentBatchConfig: { suspense: null }, ReactCurrentOwner: A, IsSomeRendererActing: { current: !1 }, assign: u };
        i.Children = { map: function(X, q, me) {
          if (X == null) return X;
          var c = [];
          return Pe(X, c, null, q, me), c;
        }, forEach: function(X, q, me) {
          if (X == null) return X;
          ie(X, Te, q = de(null, null, q, me)), R(q);
        }, count: function(X) {
          return ie(X, function() {
            return null;
          }, null);
        }, toArray: function(X) {
          var q = [];
          return Pe(X, q, null, function(me) {
            return me;
          }), q;
        }, only: function(X) {
          if (!ce(X)) throw Error(P(143));
          return X;
        } }, i.Component = I, i.Fragment = b, i.Profiler = v, i.PureComponent = Q, i.StrictMode = y, i.Suspense = G, i.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Je, i.cloneElement = function(X, q, me) {
          if (X == null) throw Error(P(267, X));
          var c = u({}, X.props), f = X.key, k = X.ref, U = X._owner;
          if (q != null) {
            if (q.ref !== void 0 && (k = q.ref, U = A.current), q.key !== void 0 && (f = "" + q.key), X.type && X.type.defaultProps) var F = X.type.defaultProps;
            for (H in q) ae.call(q, H) && !le.hasOwnProperty(H) && (c[H] = q[H] === void 0 && F !== void 0 ? F[H] : q[H]);
          }
          var H = arguments.length - 2;
          if (H === 1) c.children = me;
          else if (1 < H) {
            F = Array(H);
            for (var he = 0; he < H; he++) F[he] = arguments[he + 2];
            c.children = F;
          }
          return { $$typeof: _, type: X.type, key: f, ref: k, props: c, _owner: U };
        }, i.createContext = function(X, q) {
          return q === void 0 && (q = null), (X = { $$typeof: x, _calculateChangedBits: q, _currentValue: X, _currentValue2: X, _threadCount: 0, Provider: null, Consumer: null }).Provider = { $$typeof: C, _context: X }, X.Consumer = X;
        }, i.createElement = ne, i.createFactory = function(X) {
          var q = ne.bind(null, X);
          return q.type = X, q;
        }, i.createRef = function() {
          return { current: null };
        }, i.forwardRef = function(X) {
          return { $$typeof: N, render: X };
        }, i.isValidElement = ce, i.lazy = function(X) {
          return { $$typeof: j, _ctor: X, _status: -1, _result: null };
        }, i.memo = function(X, q) {
          return { $$typeof: K, type: X, compare: q === void 0 ? null : q };
        }, i.useCallback = function(X, q) {
          return ze().useCallback(X, q);
        }, i.useContext = function(X, q) {
          return ze().useContext(X, q);
        }, i.useDebugValue = function() {
        }, i.useEffect = function(X, q) {
          return ze().useEffect(X, q);
        }, i.useImperativeHandle = function(X, q, me) {
          return ze().useImperativeHandle(X, q, me);
        }, i.useLayoutEffect = function(X, q) {
          return ze().useLayoutEffect(X, q);
        }, i.useMemo = function(X, q) {
          return ze().useMemo(X, q);
        }, i.useReducer = function(X, q, me) {
          return ze().useReducer(X, q, me);
        }, i.useRef = function(X) {
          return ze().useRef(X);
        }, i.useState = function(X) {
          return ze().useState(X);
        }, i.version = "16.14.0";
      }, function(p, i, l) {
        var u = l(0), r = l(16), _ = l(23);
        function m(e) {
          for (var t = "https://reactjs.org/docs/error-decoder.html?invariant=" + e, n = 1; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
          return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
        }
        if (!u) throw Error(m(227));
        function b(e, t, n, o, a, h, w, T, Z) {
          var Y = Array.prototype.slice.call(arguments, 3);
          try {
            t.apply(n, Y);
          } catch (ge) {
            this.onError(ge);
          }
        }
        var y = !1, v = null, C = !1, x = null, N = { onError: function(e) {
          y = !0, v = e;
        } };
        function G(e, t, n, o, a, h, w, T, Z) {
          y = !1, v = null, b.apply(N, arguments);
        }
        var K = null, j = null, V = null;
        function P(e, t, n) {
          var o = e.type || "unknown-event";
          e.currentTarget = V(n), function(a, h, w, T, Z, Y, ge, De, He) {
            if (G.apply(this, arguments), y) {
              if (!y) throw Error(m(198));
              var ot = v;
              y = !1, v = null, C || (C = !0, x = ot);
            }
          }(o, t, void 0, e), e.currentTarget = null;
        }
        var M = null, B = {};
        function I() {
          if (M) for (var e in B) {
            var t = B[e], n = M.indexOf(e);
            if (!(-1 < n)) throw Error(m(96, e));
            if (!Q[n]) {
              if (!t.extractEvents) throw Error(m(97, e));
              for (var o in Q[n] = t, n = t.eventTypes) {
                var a = void 0, h = n[o], w = t, T = o;
                if (z.hasOwnProperty(T)) throw Error(m(99, T));
                z[T] = h;
                var Z = h.phasedRegistrationNames;
                if (Z) {
                  for (a in Z) Z.hasOwnProperty(a) && J(Z[a], w, T);
                  a = !0;
                } else h.registrationName ? (J(h.registrationName, w, T), a = !0) : a = !1;
                if (!a) throw Error(m(98, o, e));
              }
            }
          }
        }
        function J(e, t, n) {
          if (A[e]) throw Error(m(100, e));
          A[e] = t, ae[e] = t.eventTypes[n].dependencies;
        }
        var Q = [], z = {}, A = {}, ae = {};
        function le(e) {
          var t, n = !1;
          for (t in e) if (e.hasOwnProperty(t)) {
            var o = e[t];
            if (!B.hasOwnProperty(t) || B[t] !== o) {
              if (B[t]) throw Error(m(102, t));
              B[t] = o, n = !0;
            }
          }
          n && I();
        }
        var ne = !(typeof window > "u" || window.document === void 0 || window.document.createElement === void 0), ce = null, ye = null, ee = null;
        function de(e) {
          if (e = j(e)) {
            if (typeof ce != "function") throw Error(m(280));
            var t = e.stateNode;
            t && (t = K(t), ce(e.stateNode, e.type, t));
          }
        }
        function R(e) {
          ye ? ee ? ee.push(e) : ee = [e] : ye = e;
        }
        function ie() {
          if (ye) {
            var e = ye, t = ee;
            if (ee = ye = null, de(e), t) for (e = 0; e < t.length; e++) de(t[e]);
          }
        }
        function be(e, t) {
          return e(t);
        }
        function Te(e, t, n, o, a) {
          return e(t, n, o, a);
        }
        function ke() {
        }
        var Pe = be, Se = !1, ze = !1;
        function Je() {
          ye === null && ee === null || (ke(), ie());
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
        var q = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, me = Object.prototype.hasOwnProperty, c = {}, f = {};
        function k(e, t, n, o, a, h) {
          this.acceptsBooleans = t === 2 || t === 3 || t === 4, this.attributeName = o, this.attributeNamespace = a, this.mustUseProperty = n, this.propertyName = e, this.type = t, this.sanitizeURL = h;
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
        var he = u.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
        function je(e, t, n, o) {
          var a = U.hasOwnProperty(t) ? U[t] : null;
          (a !== null ? a.type === 0 : !o && 2 < t.length && (t[0] === "o" || t[0] === "O") && (t[1] === "n" || t[1] === "N")) || (function(h, w, T, Z) {
            if (w == null || function(Y, ge, De, He) {
              if (De !== null && De.type === 0) return !1;
              switch (typeof ge) {
                case "function":
                case "symbol":
                  return !0;
                case "boolean":
                  return !He && (De !== null ? !De.acceptsBooleans : (Y = Y.toLowerCase().slice(0, 5)) !== "data-" && Y !== "aria-");
                default:
                  return !1;
              }
            }(h, w, T, Z)) return !0;
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
          }(t, n, a, o) && (n = null), o || a === null ? function(h) {
            return !!me.call(f, h) || !me.call(c, h) && (q.test(h) ? f[h] = !0 : (c[h] = !0, !1));
          }(t) && (n === null ? e.removeAttribute(t) : e.setAttribute(t, "" + n)) : a.mustUseProperty ? e[a.propertyName] = n === null ? a.type !== 3 && "" : n : (t = a.attributeName, o = a.attributeNamespace, n === null ? e.removeAttribute(t) : (n = (a = a.type) === 3 || a === 4 && n === !0 ? "" : "" + n, o ? e.setAttributeNS(o, t, n) : e.setAttribute(t, n))));
        }
        he.hasOwnProperty("ReactCurrentDispatcher") || (he.ReactCurrentDispatcher = { current: null }), he.hasOwnProperty("ReactCurrentBatchConfig") || (he.ReactCurrentBatchConfig = { suspense: null });
        var Re = /^(.*)[\\\/]/, Xe = typeof Symbol == "function" && Symbol.for, We = Xe ? Symbol.for("react.element") : 60103, It = Xe ? Symbol.for("react.portal") : 60106, wt = Xe ? Symbol.for("react.fragment") : 60107, Jt = Xe ? Symbol.for("react.strict_mode") : 60108, kt = Xe ? Symbol.for("react.profiler") : 60114, gt = Xe ? Symbol.for("react.provider") : 60109, cn = Xe ? Symbol.for("react.context") : 60110, Er = Xe ? Symbol.for("react.concurrent_mode") : 60111, Tt = Xe ? Symbol.for("react.forward_ref") : 60112, pt = Xe ? Symbol.for("react.suspense") : 60113, qn = Xe ? Symbol.for("react.suspense_list") : 60120, Sn = Xe ? Symbol.for("react.memo") : 60115, or = Xe ? Symbol.for("react.lazy") : 60116, _r = Xe ? Symbol.for("react.block") : 60121, Eo = typeof Symbol == "function" && Symbol.iterator;
        function en(e) {
          return e === null || typeof e != "object" ? null : typeof (e = Eo && e[Eo] || e["@@iterator"]) == "function" ? e : null;
        }
        function qt(e) {
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
            case qn:
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
              return qt(e.type);
            case _r:
              return qt(e.render);
            case or:
              if (e = e._status === 1 ? e._result : null) return qt(e);
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
                var o = e._debugOwner, a = e._debugSource, h = qt(e.type);
                n = null, o && (n = qt(o.type)), o = h, h = "", a ? h = " (at " + a.fileName.replace(Re, "") + ":" + a.lineNumber + ")" : n && (h = " (created by " + n + ")"), n = `
    in ` + (o || "Unknown") + h;
            }
            t += n, e = e.return;
          } while (e);
          return t;
        }
        function Yt(e) {
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
            var n = gn(t) ? "checked" : "value", o = Object.getOwnPropertyDescriptor(t.constructor.prototype, n), a = "" + t[n];
            if (!t.hasOwnProperty(n) && o !== void 0 && typeof o.get == "function" && typeof o.set == "function") {
              var h = o.get, w = o.set;
              return Object.defineProperty(t, n, { configurable: !0, get: function() {
                return h.call(this);
              }, set: function(T) {
                a = "" + T, w.call(this, T);
              } }), Object.defineProperty(t, n, { enumerable: o.enumerable }), { getValue: function() {
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
          var n = t.getValue(), o = "";
          return e && (o = gn(e) ? e.checked ? "true" : "false" : e.value), (e = o) !== n && (t.setValue(e), !0);
        }
        function Cr(e, t) {
          var n = t.checked;
          return r({}, t, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: n ?? e._wrapperState.initialChecked });
        }
        function bn(e, t) {
          var n = t.defaultValue == null ? "" : t.defaultValue, o = t.checked != null ? t.checked : t.defaultChecked;
          n = Yt(t.value != null ? t.value : n), e._wrapperState = { initialChecked: o, initialValue: n, controlled: t.type === "checkbox" || t.type === "radio" ? t.checked != null : t.value != null };
        }
        function Tr(e, t) {
          (t = t.checked) != null && je(e, "checked", t, !1);
        }
        function ir(e, t) {
          Tr(e, t);
          var n = Yt(t.value), o = t.type;
          if (n != null) o === "number" ? (n === 0 && e.value === "" || e.value != n) && (e.value = "" + n) : e.value !== "" + n && (e.value = "" + n);
          else if (o === "submit" || o === "reset") return void e.removeAttribute("value");
          t.hasOwnProperty("value") ? Cn(e, t.type, n) : t.hasOwnProperty("defaultValue") && Cn(e, t.type, Yt(t.defaultValue)), t.checked == null && t.defaultChecked != null && (e.defaultChecked = !!t.defaultChecked);
        }
        function ar(e, t, n) {
          if (t.hasOwnProperty("value") || t.hasOwnProperty("defaultValue")) {
            var o = t.type;
            if (!(o !== "submit" && o !== "reset" || t.value !== void 0 && t.value !== null)) return;
            t = "" + e._wrapperState.initialValue, n || t === e.value || (e.value = t), e.defaultValue = t;
          }
          (n = e.name) !== "" && (e.name = ""), e.defaultChecked = !!e._wrapperState.initialChecked, n !== "" && (e.name = n);
        }
        function Cn(e, t, n) {
          t === "number" && e.ownerDocument.activeElement === e || (n == null ? e.defaultValue = "" + e._wrapperState.initialValue : e.defaultValue !== "" + n && (e.defaultValue = "" + n));
        }
        function sr(e, t) {
          return e = r({ children: void 0 }, t), (t = function(n) {
            var o = "";
            return u.Children.forEach(n, function(a) {
              a != null && (o += a);
            }), o;
          }(t.children)) && (e.children = t), e;
        }
        function Tn(e, t, n, o) {
          if (e = e.options, t) {
            t = {};
            for (var a = 0; a < n.length; a++) t["$" + n[a]] = !0;
            for (n = 0; n < e.length; n++) a = t.hasOwnProperty("$" + e[n].value), e[n].selected !== a && (e[n].selected = a), a && o && (e[n].defaultSelected = !0);
          } else {
            for (n = "" + Yt(n), t = null, a = 0; a < e.length; a++) {
              if (e[a].value === n) return e[a].selected = !0, void (o && (e[a].defaultSelected = !0));
              t !== null || e[a].disabled || (t = e[a]);
            }
            t !== null && (t.selected = !0);
          }
        }
        function lr(e, t) {
          if (t.dangerouslySetInnerHTML != null) throw Error(m(91));
          return r({}, t, { value: void 0, defaultValue: void 0, children: "" + e._wrapperState.initialValue });
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
          e._wrapperState = { initialValue: Yt(n) };
        }
        function Xr(e, t) {
          var n = Yt(t.value), o = Yt(t.defaultValue);
          n != null && ((n = "" + n) !== e.value && (e.value = n), t.defaultValue == null && e.defaultValue !== n && (e.defaultValue = n)), o != null && (e.defaultValue = "" + o);
        }
        function Zr(e) {
          var t = e.textContent;
          t === e._wrapperState.initialValue && t !== "" && t !== null && (e.value = t);
        }
        var W = "http://www.w3.org/1999/xhtml", se = "http://www.w3.org/2000/svg";
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
        var it, Ye = function(e) {
          return typeof MSApp < "u" && MSApp.execUnsafeLocalFunction ? function(t, n, o, a) {
            MSApp.execUnsafeLocalFunction(function() {
              return e(t, n);
            });
          } : e;
        }(function(e, t) {
          if (e.namespaceURI !== se || "innerHTML" in e) e.innerHTML = t;
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
        ne && (bt = document.createElement("div").style, "AnimationEvent" in window || (delete Ot.animationend.animation, delete Ot.animationiteration.animation, delete Ot.animationstart.animation), "TransitionEvent" in window || delete Ot.transitionend.transition);
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
        function _o(e) {
          if (e.tag === 13) {
            var t = e.memoizedState;
            if (t === null && (e = e.alternate) !== null && (t = e.memoizedState), t !== null) return t.dehydrated;
          }
          return null;
        }
        function xo(e) {
          if (Nn(e) !== e) throw Error(m(188));
        }
        function rt(e) {
          if (!(e = function(n) {
            var o = n.alternate;
            if (!o) {
              if ((o = Nn(n)) === null) throw Error(m(188));
              return o !== n ? null : n;
            }
            for (var a = n, h = o; ; ) {
              var w = a.return;
              if (w === null) break;
              var T = w.alternate;
              if (T === null) {
                if ((h = w.return) !== null) {
                  a = h;
                  continue;
                }
                break;
              }
              if (w.child === T.child) {
                for (T = w.child; T; ) {
                  if (T === a) return xo(w), n;
                  if (T === h) return xo(w), o;
                  T = T.sibling;
                }
                throw Error(m(188));
              }
              if (a.return !== h.return) a = w, h = T;
              else {
                for (var Z = !1, Y = w.child; Y; ) {
                  if (Y === a) {
                    Z = !0, a = w, h = T;
                    break;
                  }
                  if (Y === h) {
                    Z = !0, h = w, a = T;
                    break;
                  }
                  Y = Y.sibling;
                }
                if (!Z) {
                  for (Y = T.child; Y; ) {
                    if (Y === a) {
                      Z = !0, a = T, h = w;
                      break;
                    }
                    if (Y === h) {
                      Z = !0, h = T, a = w;
                      break;
                    }
                    Y = Y.sibling;
                  }
                  if (!Z) throw Error(m(189));
                }
              }
              if (a.alternate !== h) throw Error(m(190));
            }
            if (a.tag !== 3) throw Error(m(188));
            return a.stateNode.current === a ? n : o;
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
            if (Array.isArray(t)) for (var o = 0; o < t.length && !e.isPropagationStopped(); o++) P(e, t[o], n[o]);
            else t && P(e, t, n);
            e._dispatchListeners = null, e._dispatchInstances = null, e.isPersistent() || e.constructor.release(e);
          }
        }
        function At(e) {
          if (e !== null && (Kt = Ue(Kt, e)), e = Kt, Kt = null, e) {
            if (Yn(e, Or), Kt) throw Error(m(95));
            if (C) throw e = x, C = !1, x = null, e;
          }
        }
        function nn(e) {
          return (e = e.target || e.srcElement || window).correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
        }
        function Ht(e) {
          if (!ne) return !1;
          var t = (e = "on" + e) in document;
          return t || ((t = document.createElement("div")).setAttribute(e, "return;"), t = typeof t[e] == "function"), t;
        }
        var Qt = [];
        function cr(e) {
          e.topLevelType = null, e.nativeEvent = null, e.targetInst = null, e.ancestors.length = 0, 10 > Qt.length && Qt.push(e);
        }
        function Dn(e, t, n, o) {
          if (Qt.length) {
            var a = Qt.pop();
            return a.topLevelType = e, a.eventSystemFlags = o, a.nativeEvent = t, a.targetInst = n, a;
          }
          return { topLevelType: e, eventSystemFlags: o, nativeEvent: t, targetInst: n, ancestors: [] };
        }
        function rn(e) {
          var t = e.targetInst, n = t;
          do {
            if (!n) {
              e.ancestors.push(n);
              break;
            }
            var o = n;
            if (o.tag === 3) o = o.stateNode.containerInfo;
            else {
              for (; o.return; ) o = o.return;
              o = o.tag !== 3 ? null : o.stateNode.containerInfo;
            }
            if (!o) break;
            (t = n.tag) !== 5 && t !== 6 || e.ancestors.push(n), n = Mr(o);
          } while (n);
          for (n = 0; n < e.ancestors.length; n++) {
            t = e.ancestors[n];
            var a = nn(e.nativeEvent);
            o = e.topLevelType;
            var h = e.nativeEvent, w = e.eventSystemFlags;
            n === 0 && (w |= 64);
            for (var T = null, Z = 0; Z < Q.length; Z++) {
              var Y = Q[Z];
              Y && (Y = Y.extractEvents(o, t, h, a, w)) && (T = Ue(T, Y));
            }
            At(T);
          }
        }
        function yt(e, t, n) {
          if (!n.has(e)) {
            switch (e) {
              case "scroll":
                eo(t, "scroll", !0);
                break;
              case "focus":
              case "blur":
                eo(t, "focus", !0), eo(t, "blur", !0), n.set("blur", null), n.set("focus", null);
                break;
              case "cancel":
              case "close":
                Ht(e) && eo(t, e, !0);
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
        var Et, ur, dr, vn = !1, Ut = [], Wt = null, on = null, Kn = null, fr = /* @__PURE__ */ new Map(), Jr = /* @__PURE__ */ new Map(), Pr = [], Bn = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput close cancel copy cut paste click change contextmenu reset submit".split(" "), Nt = "focus blur dragenter dragleave mouseover mouseout pointerover pointerout gotpointercapture lostpointercapture".split(" ");
        function So(e, t, n, o, a) {
          return { blockedOn: e, topLevelType: t, eventSystemFlags: 32 | n, nativeEvent: a, container: o };
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
              Jr.delete(t.pointerId);
          }
        }
        function Nr(e, t, n, o, a, h) {
          return e === null || e.nativeEvent !== h ? (e = So(t, n, o, a, h), t !== null && (t = io(t)) !== null && ur(t), e) : (e.eventSystemFlags |= o, e);
        }
        function Oa(e) {
          var t = Mr(e.target);
          if (t !== null) {
            var n = Nn(t);
            if (n !== null) {
              if ((t = n.tag) === 13) {
                if ((t = _o(n)) !== null) return e.blockedOn = t, void _.unstable_runWithPriority(e.priority, function() {
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
            var n = io(t);
            return n !== null && ur(n), e.blockedOn = t, !1;
          }
          return !0;
        }
        function _i(e, t, n) {
          Co(e) && n.delete(t);
        }
        function xi() {
          for (vn = !1; 0 < Ut.length; ) {
            var e = Ut[0];
            if (e.blockedOn !== null) {
              (e = io(e.blockedOn)) !== null && Et(e);
              break;
            }
            var t = Ir(e.topLevelType, e.eventSystemFlags, e.container, e.nativeEvent);
            t !== null ? e.blockedOn = t : Ut.shift();
          }
          Wt !== null && Co(Wt) && (Wt = null), on !== null && Co(on) && (on = null), Kn !== null && Co(Kn) && (Kn = null), fr.forEach(_i), Jr.forEach(_i);
        }
        function Dr(e, t) {
          e.blockedOn === t && (e.blockedOn = null, vn || (vn = !0, _.unstable_scheduleCallback(_.unstable_NormalPriority, xi)));
        }
        function pr(e) {
          function t(a) {
            return Dr(a, e);
          }
          if (0 < Ut.length) {
            Dr(Ut[0], e);
            for (var n = 1; n < Ut.length; n++) {
              var o = Ut[n];
              o.blockedOn === e && (o.blockedOn = null);
            }
          }
          for (Wt !== null && Dr(Wt, e), on !== null && Dr(on, e), Kn !== null && Dr(Kn, e), fr.forEach(t), Jr.forEach(t), n = 0; n < Pr.length; n++) (o = Pr[n]).blockedOn === e && (o.blockedOn = null);
          for (; 0 < Pr.length && (n = Pr[0]).blockedOn === null; ) Oa(n), n.blockedOn === null && Pr.shift();
        }
        var Si = {}, Ci = /* @__PURE__ */ new Map(), Rr = /* @__PURE__ */ new Map(), Pa = ["abort", "abort", tn, "animationEnd", ht, "animationIteration", Bt, "animationStart", "canplay", "canPlay", "canplaythrough", "canPlayThrough", "durationchange", "durationChange", "emptied", "emptied", "encrypted", "encrypted", "ended", "ended", "error", "error", "gotpointercapture", "gotPointerCapture", "load", "load", "loadeddata", "loadedData", "loadedmetadata", "loadedMetadata", "loadstart", "loadStart", "lostpointercapture", "lostPointerCapture", "playing", "playing", "progress", "progress", "seeking", "seeking", "stalled", "stalled", "suspend", "suspend", "timeupdate", "timeUpdate", Pn, "transitionEnd", "waiting", "waiting"];
        function Qo(e, t) {
          for (var n = 0; n < e.length; n += 2) {
            var o = e[n], a = e[n + 1], h = "on" + (a[0].toUpperCase() + a.slice(1));
            h = { phasedRegistrationNames: { bubbled: h, captured: h + "Capture" }, dependencies: [o], eventPriority: t }, Rr.set(o, t), Ci.set(o, h), Si[a] = h;
          }
        }
        Qo("blur blur cancel cancel click click close close contextmenu contextMenu copy copy cut cut auxclick auxClick dblclick doubleClick dragend dragEnd dragstart dragStart drop drop focus focus input input invalid invalid keydown keyDown keypress keyPress keyup keyUp mousedown mouseDown mouseup mouseUp paste paste pause pause play play pointercancel pointerCancel pointerdown pointerDown pointerup pointerUp ratechange rateChange reset reset seeked seeked submit submit touchcancel touchCancel touchend touchEnd touchstart touchStart volumechange volumeChange".split(" "), 0), Qo("drag drag dragenter dragEnter dragexit dragExit dragleave dragLeave dragover dragOver mousemove mouseMove mouseout mouseOut mouseover mouseOver pointermove pointerMove pointerout pointerOut pointerover pointerOver scroll scroll toggle toggle touchmove touchMove wheel wheel".split(" "), 1), Qo(Pa, 2);
        for (var Ti = "change selectionchange textInput compositionstart compositionend compositionupdate".split(" "), Go = 0; Go < Ti.length; Go++) Rr.set(Ti[Go], 0);
        var Na = _.unstable_UserBlockingPriority, Da = _.unstable_runWithPriority, To = !0;
        function mt(e, t) {
          eo(t, e, !1);
        }
        function eo(e, t, n) {
          var o = Rr.get(t);
          switch (o === void 0 ? 2 : o) {
            case 0:
              o = to.bind(null, t, 1, e);
              break;
            case 1:
              o = Ra.bind(null, t, 1, e);
              break;
            default:
              o = Oo.bind(null, t, 1, e);
          }
          n ? e.addEventListener(t, o, !0) : e.addEventListener(t, o, !1);
        }
        function to(e, t, n, o) {
          Se || ke();
          var a = Oo, h = Se;
          Se = !0;
          try {
            Te(a, e, t, n, o);
          } finally {
            (Se = h) || Je();
          }
        }
        function Ra(e, t, n, o) {
          Da(Na, Oo.bind(null, e, t, n, o));
        }
        function Oo(e, t, n, o) {
          if (To) if (0 < Ut.length && -1 < Bn.indexOf(e)) e = So(null, e, t, n, o), Ut.push(e);
          else {
            var a = Ir(e, t, n, o);
            if (a === null) wn(e, o);
            else if (-1 < Bn.indexOf(e)) e = So(a, e, t, n, o), Ut.push(e);
            else if (!function(h, w, T, Z, Y) {
              switch (w) {
                case "focus":
                  return Wt = Nr(Wt, h, w, T, Z, Y), !0;
                case "dragenter":
                  return on = Nr(on, h, w, T, Z, Y), !0;
                case "mouseover":
                  return Kn = Nr(Kn, h, w, T, Z, Y), !0;
                case "pointerover":
                  var ge = Y.pointerId;
                  return fr.set(ge, Nr(fr.get(ge) || null, h, w, T, Z, Y)), !0;
                case "gotpointercapture":
                  return ge = Y.pointerId, Jr.set(ge, Nr(Jr.get(ge) || null, h, w, T, Z, Y)), !0;
              }
              return !1;
            }(a, e, t, n, o)) {
              wn(e, o), e = Dn(e, o, null, t);
              try {
                X(rn, e);
              } finally {
                cr(e);
              }
            }
          }
        }
        function Ir(e, t, n, o) {
          if ((n = Mr(n = nn(o))) !== null) {
            var a = Nn(n);
            if (a === null) n = null;
            else {
              var h = a.tag;
              if (h === 13) {
                if ((n = _o(a)) !== null) return n;
                n = null;
              } else if (h === 3) {
                if (a.stateNode.hydrate) return a.tag === 3 ? a.stateNode.containerInfo : null;
                n = null;
              } else a !== n && (n = null);
            }
          }
          e = Dn(e, o, n, t);
          try {
            X(rn, e);
          } finally {
            cr(e);
          }
          return null;
        }
        var no = { animationIterationCount: !0, borderImageOutset: !0, borderImageSlice: !0, borderImageWidth: !0, boxFlex: !0, boxFlexGroup: !0, boxOrdinalGroup: !0, columnCount: !0, columns: !0, flex: !0, flexGrow: !0, flexPositive: !0, flexShrink: !0, flexNegative: !0, flexOrder: !0, gridArea: !0, gridRow: !0, gridRowEnd: !0, gridRowSpan: !0, gridRowStart: !0, gridColumn: !0, gridColumnEnd: !0, gridColumnSpan: !0, gridColumnStart: !0, fontWeight: !0, lineClamp: !0, lineHeight: !0, opacity: !0, order: !0, orphans: !0, tabSize: !0, widows: !0, zIndex: !0, zoom: !0, fillOpacity: !0, floodOpacity: !0, stopOpacity: !0, strokeDasharray: !0, strokeDashoffset: !0, strokeMiterlimit: !0, strokeOpacity: !0, strokeWidth: !0 }, Ia = ["Webkit", "ms", "Moz", "O"];
        function Oi(e, t, n) {
          return t == null || typeof t == "boolean" || t === "" ? "" : n || typeof t != "number" || t === 0 || no.hasOwnProperty(e) && no[e] ? ("" + t).trim() : t + "px";
        }
        function Pi(e, t) {
          for (var n in e = e.style, t) if (t.hasOwnProperty(n)) {
            var o = n.indexOf("--") === 0, a = Oi(n, t[n], o);
            n === "float" && (n = "cssFloat"), o ? e.setProperty(n, a) : e[n] = a;
          }
        }
        Object.keys(no).forEach(function(e) {
          Ia.forEach(function(t) {
            t = t + e.charAt(0).toUpperCase() + e.substring(1), no[t] = no[e];
          });
        });
        var Ni = r({ menuitem: !0 }, { area: !0, base: !0, br: !0, col: !0, embed: !0, hr: !0, img: !0, input: !0, keygen: !0, link: !0, meta: !0, param: !0, source: !0, track: !0, wbr: !0 });
        function Xo(e, t) {
          if (t) {
            if (Ni[e] && (t.children != null || t.dangerouslySetInnerHTML != null)) throw Error(m(137, e, ""));
            if (t.dangerouslySetInnerHTML != null) {
              if (t.children != null) throw Error(m(60));
              if (typeof t.dangerouslySetInnerHTML != "object" || !("__html" in t.dangerouslySetInnerHTML)) throw Error(m(61));
            }
            if (t.style != null && typeof t.style != "object") throw Error(m(62, ""));
          }
        }
        function Zo(e, t) {
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
        var Di = W;
        function Hn(e, t) {
          var n = un(e = e.nodeType === 9 || e.nodeType === 11 ? e : e.ownerDocument);
          t = ae[t];
          for (var o = 0; o < t.length; o++) yt(t[o], e, n);
        }
        function Po() {
        }
        function Jo(e) {
          if ((e = e || (typeof document < "u" ? document : void 0)) === void 0) return null;
          try {
            return e.activeElement || e.body;
          } catch {
            return e.body;
          }
        }
        function Ri(e) {
          for (; e && e.firstChild; ) e = e.firstChild;
          return e;
        }
        function Ii(e, t) {
          var n, o = Ri(e);
          for (e = 0; o; ) {
            if (o.nodeType === 3) {
              if (n = e + o.textContent.length, e <= t && n >= t) return { node: o, offset: t - e };
              e = n;
            }
            e: {
              for (; o; ) {
                if (o.nextSibling) {
                  o = o.nextSibling;
                  break e;
                }
                o = o.parentNode;
              }
              o = void 0;
            }
            o = Ri(o);
          }
        }
        function Ai() {
          for (var e = window, t = Jo(); t instanceof e.HTMLIFrameElement; ) {
            try {
              var n = typeof t.contentWindow.location.href == "string";
            } catch {
              n = !1;
            }
            if (!n) break;
            t = Jo((e = t.contentWindow).document);
          }
          return t;
        }
        function ei(e) {
          var t = e && e.nodeName && e.nodeName.toLowerCase();
          return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
        }
        var ti = null, ni = null;
        function Mi(e, t) {
          switch (e) {
            case "button":
            case "input":
            case "select":
            case "textarea":
              return !!t.autoFocus;
          }
          return !1;
        }
        function ri(e, t) {
          return e === "textarea" || e === "option" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
        }
        var oi = typeof setTimeout == "function" ? setTimeout : void 0, ji = typeof clearTimeout == "function" ? clearTimeout : void 0;
        function Ar(e) {
          for (; e != null; e = e.nextSibling) {
            var t = e.nodeType;
            if (t === 1 || t === 3) break;
          }
          return e;
        }
        function zi(e) {
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
        var No = Math.random().toString(36).slice(2), Qn = "__reactInternalInstance$" + No, ro = "__reactEventHandlers$" + No, oo = "__reactContainere$" + No;
        function Mr(e) {
          var t = e[Qn];
          if (t) return t;
          for (var n = e.parentNode; n; ) {
            if (t = n[oo] || n[Qn]) {
              if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = zi(e); e !== null; ) {
                if (n = e[Qn]) return n;
                e = zi(e);
              }
              return t;
            }
            n = (e = n).parentNode;
          }
          return null;
        }
        function io(e) {
          return !(e = e[Qn] || e[oo]) || e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3 ? null : e;
        }
        function Gn(e) {
          if (e.tag === 5 || e.tag === 6) return e.stateNode;
          throw Error(m(33));
        }
        function ii(e) {
          return e[ro] || null;
        }
        function Rn(e) {
          do
            e = e.return;
          while (e && e.tag !== 5);
          return e || null;
        }
        function Li(e, t) {
          var n = e.stateNode;
          if (!n) return null;
          var o = K(n);
          if (!o) return null;
          n = o[t];
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
              (o = !o.disabled) || (o = !((e = e.type) === "button" || e === "input" || e === "select" || e === "textarea")), e = !o;
              break e;
            default:
              e = !1;
          }
          if (e) return null;
          if (n && typeof n != "function") throw Error(m(231, t, typeof n));
          return n;
        }
        function Ui(e, t, n) {
          (t = Li(e, n.dispatchConfig.phasedRegistrationNames[t])) && (n._dispatchListeners = Ue(n._dispatchListeners, t), n._dispatchInstances = Ue(n._dispatchInstances, e));
        }
        function Aa(e) {
          if (e && e.dispatchConfig.phasedRegistrationNames) {
            for (var t = e._targetInst, n = []; t; ) n.push(t), t = Rn(t);
            for (t = n.length; 0 < t--; ) Ui(n[t], "captured", e);
            for (t = 0; t < n.length; t++) Ui(n[t], "bubbled", e);
          }
        }
        function Do(e, t, n) {
          e && n && n.dispatchConfig.registrationName && (t = Li(e, n.dispatchConfig.registrationName)) && (n._dispatchListeners = Ue(n._dispatchListeners, t), n._dispatchInstances = Ue(n._dispatchInstances, e));
        }
        function Ma(e) {
          e && e.dispatchConfig.registrationName && Do(e._targetInst, null, e);
        }
        function jr(e) {
          Yn(e, Aa);
        }
        var hr = null, ai = null, Ro = null;
        function Fi() {
          if (Ro) return Ro;
          var e, t, n = ai, o = n.length, a = "value" in hr ? hr.value : hr.textContent, h = a.length;
          for (e = 0; e < o && n[e] === a[e]; e++) ;
          var w = o - e;
          for (t = 1; t <= w && n[o - t] === a[h - t]; t++) ;
          return Ro = a.slice(e, 1 < t ? 1 - t : void 0);
        }
        function Io() {
          return !0;
        }
        function Ao() {
          return !1;
        }
        function an(e, t, n, o) {
          for (var a in this.dispatchConfig = e, this._targetInst = t, this.nativeEvent = n, e = this.constructor.Interface) e.hasOwnProperty(a) && ((t = e[a]) ? this[a] = t(n) : a === "target" ? this.target = o : this[a] = n[a]);
          return this.isDefaultPrevented = (n.defaultPrevented != null ? n.defaultPrevented : n.returnValue === !1) ? Io : Ao, this.isPropagationStopped = Ao, this;
        }
        function Vi(e, t, n, o) {
          if (this.eventPool.length) {
            var a = this.eventPool.pop();
            return this.call(a, e, t, n, o), a;
          }
          return new this(e, t, n, o);
        }
        function $e(e) {
          if (!(e instanceof this)) throw Error(m(279));
          e.destructor(), 10 > this.eventPool.length && this.eventPool.push(e);
        }
        function E(e) {
          e.eventPool = [], e.getPooled = Vi, e.release = $e;
        }
        r(an.prototype, { preventDefault: function() {
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
            return o.apply(this, arguments);
          }
          var o = this;
          t.prototype = o.prototype;
          var a = new t();
          return r(a, n.prototype), n.prototype = a, n.prototype.constructor = n, n.Interface = r({}, o.Interface, e), n.extend = o.extend, E(n), n;
        }, E(an);
        var s = an.extend({ data: null }), d = an.extend({ data: null }), g = [9, 13, 27, 32], S = ne && "CompositionEvent" in window, O = null;
        ne && "documentMode" in document && (O = document.documentMode);
        var L = ne && "TextEvent" in window && !O, re = ne && (!S || O && 8 < O && 11 >= O), fe = " ", pe = { beforeInput: { phasedRegistrationNames: { bubbled: "onBeforeInput", captured: "onBeforeInputCapture" }, dependencies: ["compositionend", "keypress", "textInput", "paste"] }, compositionEnd: { phasedRegistrationNames: { bubbled: "onCompositionEnd", captured: "onCompositionEndCapture" }, dependencies: "blur compositionend keydown keypress keyup mousedown".split(" ") }, compositionStart: { phasedRegistrationNames: { bubbled: "onCompositionStart", captured: "onCompositionStartCapture" }, dependencies: "blur compositionstart keydown keypress keyup mousedown".split(" ") }, compositionUpdate: { phasedRegistrationNames: { bubbled: "onCompositionUpdate", captured: "onCompositionUpdateCapture" }, dependencies: "blur compositionupdate keydown keypress keyup mousedown".split(" ") } }, Ee = !1;
        function Ne(e, t) {
          switch (e) {
            case "keyup":
              return g.indexOf(t.keyCode) !== -1;
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
        var Ie = !1, Ke = { eventTypes: pe, extractEvents: function(e, t, n, o) {
          var a;
          if (S) e: {
            switch (e) {
              case "compositionstart":
                var h = pe.compositionStart;
                break e;
              case "compositionend":
                h = pe.compositionEnd;
                break e;
              case "compositionupdate":
                h = pe.compositionUpdate;
                break e;
            }
            h = void 0;
          }
          else Ie ? Ne(e, n) && (h = pe.compositionEnd) : e === "keydown" && n.keyCode === 229 && (h = pe.compositionStart);
          return h ? (re && n.locale !== "ko" && (Ie || h !== pe.compositionStart ? h === pe.compositionEnd && Ie && (a = Fi()) : (ai = "value" in (hr = o) ? hr.value : hr.textContent, Ie = !0)), h = s.getPooled(h, t, n, o), (a || (a = Be(n)) !== null) && (h.data = a), jr(h), a = h) : a = null, (e = L ? function(w, T) {
            switch (w) {
              case "compositionend":
                return Be(T);
              case "keypress":
                return T.which !== 32 ? null : (Ee = !0, fe);
              case "textInput":
                return (w = T.data) === fe && Ee ? null : w;
              default:
                return null;
            }
          }(e, n) : function(w, T) {
            if (Ie) return w === "compositionend" || !S && Ne(w, T) ? (w = Fi(), Ro = ai = hr = null, Ie = !1, w) : null;
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
                return re && T.locale !== "ko" ? null : T.data;
              default:
                return null;
            }
          }(e, n)) ? ((t = d.getPooled(pe.beforeInput, t, n, o)).data = e, jr(t)) : t = null, a === null ? t : t === null ? a : [a, t];
        } }, Me = { color: !0, date: !0, datetime: !0, "datetime-local": !0, email: !0, month: !0, number: !0, password: !0, range: !0, search: !0, tel: !0, text: !0, time: !0, url: !0, week: !0 };
        function Fe(e) {
          var t = e && e.nodeName && e.nodeName.toLowerCase();
          return t === "input" ? !!Me[e.type] : t === "textarea";
        }
        var et = { change: { phasedRegistrationNames: { bubbled: "onChange", captured: "onChangeCapture" }, dependencies: "blur change click focus input keydown keyup selectionchange".split(" ") } };
        function qe(e, t, n) {
          return (e = an.getPooled(et.change, e, t, n)).type = "change", R(n), jr(e), e;
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
        var _t = !1;
        function zt() {
          Le && (Le.detachEvent("onpropertychange", ft), dt = Le = null);
        }
        function ft(e) {
          if (e.propertyName === "value" && Mt(dt)) if (e = qe(dt, e, nn(e)), Se) At(e);
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
        ne && (_t = Ht("input") && (!document.documentMode || 9 < document.documentMode));
        var zr = { eventTypes: et, _isInputEventSupported: _t, extractEvents: function(e, t, n, o) {
          var a = t ? Gn(t) : window, h = a.nodeName && a.nodeName.toLowerCase();
          if (h === "select" || h === "input" && a.type === "file") var w = jt;
          else if (Fe(a)) if (_t) w = Wn;
          else {
            w = lt;
            var T = In;
          }
          else (h = a.nodeName) && h.toLowerCase() === "input" && (a.type === "checkbox" || a.type === "radio") && (w = An);
          if (w && (w = w(e, t))) return qe(w, n, o);
          T && T(e, a, t), e === "blur" && (e = a._wrapperState) && e.controlled && a.type === "number" && Cn(a, "number", a.value);
        } }, xt = an.extend({ view: null, detail: null }), ao = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
        function Mn(e) {
          var t = this.nativeEvent;
          return t.getModifierState ? t.getModifierState(e) : !!(e = ao[e]) && !!t[e];
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
        } }), si = Lr.extend({ pointerId: null, width: null, height: null, pressure: null, tangentialPressure: null, tiltX: null, tiltY: null, twist: null, pointerType: null, isPrimary: null }), Ur = { mouseEnter: { registrationName: "onMouseEnter", dependencies: ["mouseout", "mouseover"] }, mouseLeave: { registrationName: "onMouseLeave", dependencies: ["mouseout", "mouseover"] }, pointerEnter: { registrationName: "onPointerEnter", dependencies: ["pointerout", "pointerover"] }, pointerLeave: { registrationName: "onPointerLeave", dependencies: ["pointerout", "pointerover"] } }, Mo = { eventTypes: Ur, extractEvents: function(e, t, n, o, a) {
          var h = e === "mouseover" || e === "pointerover", w = e === "mouseout" || e === "pointerout";
          if (h && (32 & a) == 0 && (n.relatedTarget || n.fromElement) || !w && !h || (h = o.window === o ? o : (h = o.ownerDocument) ? h.defaultView || h.parentWindow : window, w ? (w = t, (t = (t = n.relatedTarget || n.toElement) ? Mr(t) : null) !== null && (t !== Nn(t) || t.tag !== 5 && t.tag !== 6) && (t = null)) : w = null, w === t)) return null;
          if (e === "mouseout" || e === "mouseover") var T = Lr, Z = Ur.mouseLeave, Y = Ur.mouseEnter, ge = "mouse";
          else e !== "pointerout" && e !== "pointerover" || (T = si, Z = Ur.pointerLeave, Y = Ur.pointerEnter, ge = "pointer");
          if (e = w == null ? h : Gn(w), h = t == null ? h : Gn(t), (Z = T.getPooled(Z, w, n, o)).type = ge + "leave", Z.target = e, Z.relatedTarget = h, (n = T.getPooled(Y, t, n, o)).type = ge + "enter", n.target = h, n.relatedTarget = e, ge = t, (o = w) && ge) e: {
            for (Y = ge, w = 0, e = T = o; e; e = Rn(e)) w++;
            for (e = 0, t = Y; t; t = Rn(t)) e++;
            for (; 0 < w - e; ) T = Rn(T), w--;
            for (; 0 < e - w; ) Y = Rn(Y), e--;
            for (; w--; ) {
              if (T === Y || T === Y.alternate) break e;
              T = Rn(T), Y = Rn(Y);
            }
            T = null;
          }
          else T = null;
          for (Y = T, T = []; o && o !== Y && ((w = o.alternate) === null || w !== Y); ) T.push(o), o = Rn(o);
          for (o = []; ge && ge !== Y && ((w = ge.alternate) === null || w !== Y); ) o.push(ge), ge = Rn(ge);
          for (ge = 0; ge < T.length; ge++) Do(T[ge], "bubbled", Z);
          for (ge = o.length; 0 < ge--; ) Do(o[ge], "captured", n);
          return (64 & a) == 0 ? [Z] : [Z, n];
        } }, mr = typeof Object.is == "function" ? Object.is : function(e, t) {
          return e === t && (e !== 0 || 1 / e == 1 / t) || e != e && t != t;
        }, Bi = Object.prototype.hasOwnProperty;
        function gr(e, t) {
          if (mr(e, t)) return !0;
          if (typeof e != "object" || e === null || typeof t != "object" || t === null) return !1;
          var n = Object.keys(e), o = Object.keys(t);
          if (n.length !== o.length) return !1;
          for (o = 0; o < n.length; o++) if (!Bi.call(t, n[o]) || !mr(e[n[o]], t[n[o]])) return !1;
          return !0;
        }
        var jo = ne && "documentMode" in document && 11 >= document.documentMode, li = { select: { phasedRegistrationNames: { bubbled: "onSelect", captured: "onSelectCapture" }, dependencies: "blur contextmenu dragend focus keydown keyup mousedown mouseup selectionchange".split(" ") } }, Zn = null, so = null, kn = null, lo = !1;
        function Ps(e, t) {
          var n = t.window === t ? t.document : t.nodeType === 9 ? t : t.ownerDocument;
          return lo || Zn == null || Zn !== Jo(n) ? null : ("selectionStart" in (n = Zn) && ei(n) ? n = { start: n.selectionStart, end: n.selectionEnd } : n = { anchorNode: (n = (n.ownerDocument && n.ownerDocument.defaultView || window).getSelection()).anchorNode, anchorOffset: n.anchorOffset, focusNode: n.focusNode, focusOffset: n.focusOffset }, kn && gr(kn, n) ? null : (kn = n, (e = an.getPooled(li.select, so, e, t)).type = "select", e.target = Zn, jr(e), e));
        }
        var oc = { eventTypes: li, extractEvents: function(e, t, n, o, a, h) {
          if (!(h = !(a = h || (o.window === o ? o.document : o.nodeType === 9 ? o : o.ownerDocument)))) {
            e: {
              a = un(a), h = ae.onSelect;
              for (var w = 0; w < h.length; w++) if (!a.has(h[w])) {
                a = !1;
                break e;
              }
              a = !0;
            }
            h = !a;
          }
          if (h) return null;
          switch (a = t ? Gn(t) : window, e) {
            case "focus":
              (Fe(a) || a.contentEditable === "true") && (Zn = a, so = t, kn = null);
              break;
            case "blur":
              kn = so = Zn = null;
              break;
            case "mousedown":
              lo = !0;
              break;
            case "contextmenu":
            case "mouseup":
            case "dragend":
              return lo = !1, Ps(n, o);
            case "selectionchange":
              if (jo) break;
            case "keydown":
            case "keyup":
              return Ps(n, o);
          }
          return null;
        } }, ic = an.extend({ animationName: null, elapsedTime: null, pseudoElement: null }), ac = an.extend({ clipboardData: function(e) {
          return "clipboardData" in e ? e.clipboardData : window.clipboardData;
        } }), sc = xt.extend({ relatedTarget: null });
        function Hi(e) {
          var t = e.keyCode;
          return "charCode" in e ? (e = e.charCode) === 0 && t === 13 && (e = 13) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
        }
        var lc = { Esc: "Escape", Spacebar: " ", Left: "ArrowLeft", Up: "ArrowUp", Right: "ArrowRight", Down: "ArrowDown", Del: "Delete", Win: "OS", Menu: "ContextMenu", Apps: "ContextMenu", Scroll: "ScrollLock", MozPrintableKey: "Unidentified" }, cc = { 8: "Backspace", 9: "Tab", 12: "Clear", 13: "Enter", 16: "Shift", 17: "Control", 18: "Alt", 19: "Pause", 20: "CapsLock", 27: "Escape", 32: " ", 33: "PageUp", 34: "PageDown", 35: "End", 36: "Home", 37: "ArrowLeft", 38: "ArrowUp", 39: "ArrowRight", 40: "ArrowDown", 45: "Insert", 46: "Delete", 112: "F1", 113: "F2", 114: "F3", 115: "F4", 116: "F5", 117: "F6", 118: "F7", 119: "F8", 120: "F9", 121: "F10", 122: "F11", 123: "F12", 144: "NumLock", 145: "ScrollLock", 224: "Meta" }, uc = xt.extend({ key: function(e) {
          if (e.key) {
            var t = lc[e.key] || e.key;
            if (t !== "Unidentified") return t;
          }
          return e.type === "keypress" ? (e = Hi(e)) === 13 ? "Enter" : String.fromCharCode(e) : e.type === "keydown" || e.type === "keyup" ? cc[e.keyCode] || "Unidentified" : "";
        }, location: null, ctrlKey: null, shiftKey: null, altKey: null, metaKey: null, repeat: null, locale: null, getModifierState: $t, charCode: function(e) {
          return e.type === "keypress" ? Hi(e) : 0;
        }, keyCode: function(e) {
          return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
        }, which: function(e) {
          return e.type === "keypress" ? Hi(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
        } }), dc = Lr.extend({ dataTransfer: null }), fc = xt.extend({ touches: null, targetTouches: null, changedTouches: null, altKey: null, metaKey: null, ctrlKey: null, shiftKey: null, getModifierState: $t }), pc = an.extend({ propertyName: null, elapsedTime: null, pseudoElement: null }), hc = Lr.extend({ deltaX: function(e) {
          return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
        }, deltaY: function(e) {
          return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
        }, deltaZ: null, deltaMode: null }), mc = { eventTypes: Si, extractEvents: function(e, t, n, o) {
          var a = Ci.get(e);
          if (!a) return null;
          switch (e) {
            case "keypress":
              if (Hi(n) === 0) return null;
            case "keydown":
            case "keyup":
              e = uc;
              break;
            case "blur":
            case "focus":
              e = sc;
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
              e = dc;
              break;
            case "touchcancel":
            case "touchend":
            case "touchmove":
            case "touchstart":
              e = fc;
              break;
            case tn:
            case ht:
            case Bt:
              e = ic;
              break;
            case Pn:
              e = pc;
              break;
            case "scroll":
              e = xt;
              break;
            case "wheel":
              e = hc;
              break;
            case "copy":
            case "cut":
            case "paste":
              e = ac;
              break;
            case "gotpointercapture":
            case "lostpointercapture":
            case "pointercancel":
            case "pointerdown":
            case "pointermove":
            case "pointerout":
            case "pointerover":
            case "pointerup":
              e = si;
              break;
            default:
              e = an;
          }
          return jr(t = e.getPooled(a, t, n, o)), t;
        } };
        if (M) throw Error(m(101));
        M = Array.prototype.slice.call("ResponderEventPlugin SimpleEventPlugin EnterLeaveEventPlugin ChangeEventPlugin SelectEventPlugin BeforeInputEventPlugin".split(" ")), I(), K = ii, j = io, V = Gn, le({ SimpleEventPlugin: mc, EnterLeaveEventPlugin: Mo, ChangeEventPlugin: zr, SelectEventPlugin: oc, BeforeInputEventPlugin: Ke });
        var ja = [], zo = -1;
        function vt(e) {
          0 > zo || (e.current = ja[zo], ja[zo] = null, zo--);
        }
        function St(e, t) {
          zo++, ja[zo] = e.current, e.current = t;
        }
        var Fr = {}, Xt = { current: Fr }, pn = { current: !1 }, co = Fr;
        function Lo(e, t) {
          var n = e.type.contextTypes;
          if (!n) return Fr;
          var o = e.stateNode;
          if (o && o.__reactInternalMemoizedUnmaskedChildContext === t) return o.__reactInternalMemoizedMaskedChildContext;
          var a, h = {};
          for (a in n) h[a] = t[a];
          return o && ((e = e.stateNode).__reactInternalMemoizedUnmaskedChildContext = t, e.__reactInternalMemoizedMaskedChildContext = h), h;
        }
        function hn(e) {
          return (e = e.childContextTypes) != null;
        }
        function Wi() {
          vt(pn), vt(Xt);
        }
        function Ns(e, t, n) {
          if (Xt.current !== Fr) throw Error(m(168));
          St(Xt, t), St(pn, n);
        }
        function Ds(e, t, n) {
          var o = e.stateNode;
          if (e = t.childContextTypes, typeof o.getChildContext != "function") return n;
          for (var a in o = o.getChildContext()) if (!(a in e)) throw Error(m(108, qt(t) || "Unknown", a));
          return r({}, n, {}, o);
        }
        function $i(e) {
          return e = (e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext || Fr, co = Xt.current, St(Xt, e), St(pn, pn.current), !0;
        }
        function Rs(e, t, n) {
          var o = e.stateNode;
          if (!o) throw Error(m(169));
          n ? (e = Ds(e, t, co), o.__reactInternalMemoizedMergedChildContext = e, vt(pn), vt(Xt), St(Xt, e)) : vt(pn), St(pn, n);
        }
        var gc = _.unstable_runWithPriority, za = _.unstable_scheduleCallback, Is = _.unstable_cancelCallback, As = _.unstable_requestPaint, La = _.unstable_now, bc = _.unstable_getCurrentPriorityLevel, qi = _.unstable_ImmediatePriority, Ms = _.unstable_UserBlockingPriority, js = _.unstable_NormalPriority, zs = _.unstable_LowPriority, Ls = _.unstable_IdlePriority, Us = {}, yc = _.unstable_shouldYield, vc = As !== void 0 ? As : function() {
        }, br = null, Yi = null, Ua = !1, Fs = La(), jn = 1e4 > Fs ? La : function() {
          return La() - Fs;
        };
        function Ki() {
          switch (bc()) {
            case qi:
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
              throw Error(m(332));
          }
        }
        function Vs(e) {
          switch (e) {
            case 99:
              return qi;
            case 98:
              return Ms;
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
        function Vr(e, t) {
          return e = Vs(e), gc(e, t);
        }
        function Bs(e, t, n) {
          return e = Vs(e), za(e, t, n);
        }
        function Hs(e) {
          return br === null ? (br = [e], Yi = za(qi, Ws)) : br.push(e), Us;
        }
        function Jn() {
          if (Yi !== null) {
            var e = Yi;
            Yi = null, Is(e);
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
              throw br !== null && (br = br.slice(e + 1)), za(qi, Jn), n;
            } finally {
              Ua = !1;
            }
          }
        }
        function Qi(e, t, n) {
          return 1073741821 - (1 + ((1073741821 - e + t / 10) / (n /= 10) | 0)) * n;
        }
        function $n(e, t) {
          if (e && e.defaultProps) for (var n in t = r({}, t), e = e.defaultProps) t[n] === void 0 && (t[n] = e[n]);
          return t;
        }
        var Gi = { current: null }, Xi = null, Uo = null, Zi = null;
        function Fa() {
          Zi = Uo = Xi = null;
        }
        function Va(e) {
          var t = Gi.current;
          vt(Gi), e.type._context._currentValue = t;
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
          Xi = e, Zi = Uo = null, (e = e.dependencies) !== null && e.firstContext !== null && (e.expirationTime >= t && (tr = !0), e.firstContext = null);
        }
        function zn(e, t) {
          if (Zi !== e && t !== !1 && t !== 0) if (typeof t == "number" && t !== 1073741823 || (Zi = e, t = 1073741823), t = { context: e, observedBits: t, next: null }, Uo === null) {
            if (Xi === null) throw Error(m(308));
            Uo = t, Xi.dependencies = { expirationTime: 0, firstContext: t, responders: null };
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
        function qs(e, t) {
          var n = e.alternate;
          n !== null && Ha(n, e), (n = (e = e.updateQueue).baseQueue) === null ? (e.baseQueue = t.next = t, t.next = t) : (t.next = n.next, n.next = t);
        }
        function ci(e, t, n, o) {
          var a = e.updateQueue;
          Br = !1;
          var h = a.baseQueue, w = a.shared.pending;
          if (w !== null) {
            if (h !== null) {
              var T = h.next;
              h.next = w.next, w.next = T;
            }
            h = w, a.shared.pending = null, (T = e.alternate) !== null && (T = T.updateQueue) !== null && (T.baseQueue = w);
          }
          if (h !== null) {
            T = h.next;
            var Z = a.baseState, Y = 0, ge = null, De = null, He = null;
            if (T !== null) for (var ot = T; ; ) {
              if ((w = ot.expirationTime) < o) {
                var Fn = { expirationTime: ot.expirationTime, suspenseConfig: ot.suspenseConfig, tag: ot.tag, payload: ot.payload, callback: ot.callback, next: null };
                He === null ? (De = He = Fn, ge = Z) : He = He.next = Fn, w > Y && (Y = w);
              } else {
                He !== null && (He = He.next = { expirationTime: 1073741823, suspenseConfig: ot.suspenseConfig, tag: ot.tag, payload: ot.payload, callback: ot.callback, next: null }), Vl(w, ot.suspenseConfig);
                e: {
                  var ln = e, oe = ot;
                  switch (w = t, Fn = n, oe.tag) {
                    case 1:
                      if (typeof (ln = oe.payload) == "function") {
                        Z = ln.call(Fn, Z, w);
                        break e;
                      }
                      Z = ln;
                      break e;
                    case 3:
                      ln.effectTag = -4097 & ln.effectTag | 64;
                    case 0:
                      if ((w = typeof (ln = oe.payload) == "function" ? ln.call(Fn, Z, w) : ln) == null) break e;
                      Z = r({}, Z, w);
                      break e;
                    case 2:
                      Br = !0;
                  }
                }
                ot.callback !== null && (e.effectTag |= 32, (w = a.effects) === null ? a.effects = [ot] : w.push(ot));
              }
              if ((ot = ot.next) === null || ot === T) {
                if ((w = a.shared.pending) === null) break;
                ot = h.next = w.next, w.next = T, a.baseQueue = h = w, a.shared.pending = null;
              }
            }
            He === null ? ge = Z : He.next = De, a.baseState = ge, a.baseQueue = He, xa(Y), e.expirationTime = Y, e.memoizedState = Z;
          }
        }
        function Ys(e, t, n) {
          if (e = t.effects, t.effects = null, e !== null) for (t = 0; t < e.length; t++) {
            var o = e[t], a = o.callback;
            if (a !== null) {
              if (o.callback = null, o = a, a = n, typeof o != "function") throw Error(m(191, o));
              o.call(a);
            }
          }
        }
        var ui = he.ReactCurrentBatchConfig, Ks = new u.Component().refs;
        function Ji(e, t, n, o) {
          n = (n = n(o, t = e.memoizedState)) == null ? t : r({}, t, n), e.memoizedState = n, e.expirationTime === 0 && (e.updateQueue.baseState = n);
        }
        var ea = { isMounted: function(e) {
          return !!(e = e._reactInternalFiber) && Nn(e) === e;
        }, enqueueSetState: function(e, t, n) {
          e = e._reactInternalFiber;
          var o = nr(), a = ui.suspense;
          (a = Hr(o = go(o, e, a), a)).payload = t, n != null && (a.callback = n), Wr(e, a), Kr(e, o);
        }, enqueueReplaceState: function(e, t, n) {
          e = e._reactInternalFiber;
          var o = nr(), a = ui.suspense;
          (a = Hr(o = go(o, e, a), a)).tag = 1, a.payload = t, n != null && (a.callback = n), Wr(e, a), Kr(e, o);
        }, enqueueForceUpdate: function(e, t) {
          e = e._reactInternalFiber;
          var n = nr(), o = ui.suspense;
          (o = Hr(n = go(n, e, o), o)).tag = 2, t != null && (o.callback = t), Wr(e, o), Kr(e, n);
        } };
        function Qs(e, t, n, o, a, h, w) {
          return typeof (e = e.stateNode).shouldComponentUpdate == "function" ? e.shouldComponentUpdate(o, h, w) : !t.prototype || !t.prototype.isPureReactComponent || !gr(n, o) || !gr(a, h);
        }
        function Gs(e, t, n) {
          var o = !1, a = Fr, h = t.contextType;
          return typeof h == "object" && h !== null ? h = zn(h) : (a = hn(t) ? co : Xt.current, h = (o = (o = t.contextTypes) != null) ? Lo(e, a) : Fr), t = new t(n, h), e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null, t.updater = ea, e.stateNode = t, t._reactInternalFiber = e, o && ((e = e.stateNode).__reactInternalMemoizedUnmaskedChildContext = a, e.__reactInternalMemoizedMaskedChildContext = h), t;
        }
        function Xs(e, t, n, o) {
          e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, o), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, o), t.state !== e && ea.enqueueReplaceState(t, t.state, null);
        }
        function Wa(e, t, n, o) {
          var a = e.stateNode;
          a.props = n, a.state = e.memoizedState, a.refs = Ks, Ba(e);
          var h = t.contextType;
          typeof h == "object" && h !== null ? a.context = zn(h) : (h = hn(t) ? co : Xt.current, a.context = Lo(e, h)), ci(e, n, a, o), a.state = e.memoizedState, typeof (h = t.getDerivedStateFromProps) == "function" && (Ji(e, t, h, n), a.state = e.memoizedState), typeof t.getDerivedStateFromProps == "function" || typeof a.getSnapshotBeforeUpdate == "function" || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (t = a.state, typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount(), t !== a.state && ea.enqueueReplaceState(a, a.state, null), ci(e, n, a, o), a.state = e.memoizedState), typeof a.componentDidMount == "function" && (e.effectTag |= 4);
        }
        var ta = Array.isArray;
        function di(e, t, n) {
          if ((e = n.ref) !== null && typeof e != "function" && typeof e != "object") {
            if (n._owner) {
              if (n = n._owner) {
                if (n.tag !== 1) throw Error(m(309));
                var o = n.stateNode;
              }
              if (!o) throw Error(m(147, e));
              var a = "" + e;
              return t !== null && t.ref !== null && typeof t.ref == "function" && t.ref._stringRef === a ? t.ref : ((t = function(h) {
                var w = o.refs;
                w === Ks && (w = o.refs = {}), h === null ? delete w[a] : w[a] = h;
              })._stringRef = a, t);
            }
            if (typeof e != "string") throw Error(m(284));
            if (!n._owner) throw Error(m(290, e));
          }
          return e;
        }
        function na(e, t) {
          if (e.type !== "textarea") throw Error(m(31, Object.prototype.toString.call(t) === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : t, ""));
        }
        function Zs(e) {
          function t(oe, te) {
            if (e) {
              var ue = oe.lastEffect;
              ue !== null ? (ue.nextEffect = te, oe.lastEffect = te) : oe.firstEffect = oe.lastEffect = te, te.nextEffect = null, te.effectTag = 8;
            }
          }
          function n(oe, te) {
            if (!e) return null;
            for (; te !== null; ) t(oe, te), te = te.sibling;
            return null;
          }
          function o(oe, te) {
            for (oe = /* @__PURE__ */ new Map(); te !== null; ) te.key !== null ? oe.set(te.key, te) : oe.set(te.index, te), te = te.sibling;
            return oe;
          }
          function a(oe, te) {
            return (oe = wo(oe, te)).index = 0, oe.sibling = null, oe;
          }
          function h(oe, te, ue) {
            return oe.index = ue, e ? (ue = oe.alternate) !== null ? (ue = ue.index) < te ? (oe.effectTag = 2, te) : ue : (oe.effectTag = 2, te) : te;
          }
          function w(oe) {
            return e && oe.alternate === null && (oe.effectTag = 2), oe;
          }
          function T(oe, te, ue, ve) {
            return te === null || te.tag !== 6 ? ((te = ws(ue, oe.mode, ve)).return = oe, te) : ((te = a(te, ue)).return = oe, te);
          }
          function Z(oe, te, ue, ve) {
            return te !== null && te.elementType === ue.type ? ((ve = a(te, ue.props)).ref = di(oe, te, ue), ve.return = oe, ve) : ((ve = Sa(ue.type, ue.key, ue.props, null, oe.mode, ve)).ref = di(oe, te, ue), ve.return = oe, ve);
          }
          function Y(oe, te, ue, ve) {
            return te === null || te.tag !== 4 || te.stateNode.containerInfo !== ue.containerInfo || te.stateNode.implementation !== ue.implementation ? ((te = ks(ue, oe.mode, ve)).return = oe, te) : ((te = a(te, ue.children || [])).return = oe, te);
          }
          function ge(oe, te, ue, ve, _e) {
            return te === null || te.tag !== 7 ? ((te = Qr(ue, oe.mode, ve, _e)).return = oe, te) : ((te = a(te, ue)).return = oe, te);
          }
          function De(oe, te, ue) {
            if (typeof te == "string" || typeof te == "number") return (te = ws("" + te, oe.mode, ue)).return = oe, te;
            if (typeof te == "object" && te !== null) {
              switch (te.$$typeof) {
                case We:
                  return (ue = Sa(te.type, te.key, te.props, null, oe.mode, ue)).ref = di(oe, null, te), ue.return = oe, ue;
                case It:
                  return (te = ks(te, oe.mode, ue)).return = oe, te;
              }
              if (ta(te) || en(te)) return (te = Qr(te, oe.mode, ue, null)).return = oe, te;
              na(oe, te);
            }
            return null;
          }
          function He(oe, te, ue, ve) {
            var _e = te !== null ? te.key : null;
            if (typeof ue == "string" || typeof ue == "number") return _e !== null ? null : T(oe, te, "" + ue, ve);
            if (typeof ue == "object" && ue !== null) {
              switch (ue.$$typeof) {
                case We:
                  return ue.key === _e ? ue.type === wt ? ge(oe, te, ue.props.children, ve, _e) : Z(oe, te, ue, ve) : null;
                case It:
                  return ue.key === _e ? Y(oe, te, ue, ve) : null;
              }
              if (ta(ue) || en(ue)) return _e !== null ? null : ge(oe, te, ue, ve, null);
              na(oe, ue);
            }
            return null;
          }
          function ot(oe, te, ue, ve, _e) {
            if (typeof ve == "string" || typeof ve == "number") return T(te, oe = oe.get(ue) || null, "" + ve, _e);
            if (typeof ve == "object" && ve !== null) {
              switch (ve.$$typeof) {
                case We:
                  return oe = oe.get(ve.key === null ? ue : ve.key) || null, ve.type === wt ? ge(te, oe, ve.props.children, _e, ve.key) : Z(te, oe, ve, _e);
                case It:
                  return Y(te, oe = oe.get(ve.key === null ? ue : ve.key) || null, ve, _e);
              }
              if (ta(ve) || en(ve)) return ge(te, oe = oe.get(ue) || null, ve, _e, null);
              na(te, ve);
            }
            return null;
          }
          function Fn(oe, te, ue, ve) {
            for (var _e = null, Oe = null, Ve = te, at = te = 0, Rt = null; Ve !== null && at < ue.length; at++) {
              Ve.index > at ? (Rt = Ve, Ve = null) : Rt = Ve.sibling;
              var Ze = He(oe, Ve, ue[at], ve);
              if (Ze === null) {
                Ve === null && (Ve = Rt);
                break;
              }
              e && Ve && Ze.alternate === null && t(oe, Ve), te = h(Ze, te, at), Oe === null ? _e = Ze : Oe.sibling = Ze, Oe = Ze, Ve = Rt;
            }
            if (at === ue.length) return n(oe, Ve), _e;
            if (Ve === null) {
              for (; at < ue.length; at++) (Ve = De(oe, ue[at], ve)) !== null && (te = h(Ve, te, at), Oe === null ? _e = Ve : Oe.sibling = Ve, Oe = Ve);
              return _e;
            }
            for (Ve = o(oe, Ve); at < ue.length; at++) (Rt = ot(Ve, oe, at, ue[at], ve)) !== null && (e && Rt.alternate !== null && Ve.delete(Rt.key === null ? at : Rt.key), te = h(Rt, te, at), Oe === null ? _e = Rt : Oe.sibling = Rt, Oe = Rt);
            return e && Ve.forEach(function(Vt) {
              return t(oe, Vt);
            }), _e;
          }
          function ln(oe, te, ue, ve) {
            var _e = en(ue);
            if (typeof _e != "function") throw Error(m(150));
            if ((ue = _e.call(ue)) == null) throw Error(m(151));
            for (var Oe = _e = null, Ve = te, at = te = 0, Rt = null, Ze = ue.next(); Ve !== null && !Ze.done; at++, Ze = ue.next()) {
              Ve.index > at ? (Rt = Ve, Ve = null) : Rt = Ve.sibling;
              var Vt = He(oe, Ve, Ze.value, ve);
              if (Vt === null) {
                Ve === null && (Ve = Rt);
                break;
              }
              e && Ve && Vt.alternate === null && t(oe, Ve), te = h(Vt, te, at), Oe === null ? _e = Vt : Oe.sibling = Vt, Oe = Vt, Ve = Rt;
            }
            if (Ze.done) return n(oe, Ve), _e;
            if (Ve === null) {
              for (; !Ze.done; at++, Ze = ue.next()) (Ze = De(oe, Ze.value, ve)) !== null && (te = h(Ze, te, at), Oe === null ? _e = Ze : Oe.sibling = Ze, Oe = Ze);
              return _e;
            }
            for (Ve = o(oe, Ve); !Ze.done; at++, Ze = ue.next()) (Ze = ot(Ve, oe, at, Ze.value, ve)) !== null && (e && Ze.alternate !== null && Ve.delete(Ze.key === null ? at : Ze.key), te = h(Ze, te, at), Oe === null ? _e = Ze : Oe.sibling = Ze, Oe = Ze);
            return e && Ve.forEach(function(kr) {
              return t(oe, kr);
            }), _e;
          }
          return function(oe, te, ue, ve) {
            var _e = typeof ue == "object" && ue !== null && ue.type === wt && ue.key === null;
            _e && (ue = ue.props.children);
            var Oe = typeof ue == "object" && ue !== null;
            if (Oe) switch (ue.$$typeof) {
              case We:
                e: {
                  for (Oe = ue.key, _e = te; _e !== null; ) {
                    if (_e.key === Oe) {
                      switch (_e.tag) {
                        case 7:
                          if (ue.type === wt) {
                            n(oe, _e.sibling), (te = a(_e, ue.props.children)).return = oe, oe = te;
                            break e;
                          }
                          break;
                        default:
                          if (_e.elementType === ue.type) {
                            n(oe, _e.sibling), (te = a(_e, ue.props)).ref = di(oe, _e, ue), te.return = oe, oe = te;
                            break e;
                          }
                      }
                      n(oe, _e);
                      break;
                    }
                    t(oe, _e), _e = _e.sibling;
                  }
                  ue.type === wt ? ((te = Qr(ue.props.children, oe.mode, ve, ue.key)).return = oe, oe = te) : ((ve = Sa(ue.type, ue.key, ue.props, null, oe.mode, ve)).ref = di(oe, te, ue), ve.return = oe, oe = ve);
                }
                return w(oe);
              case It:
                e: {
                  for (_e = ue.key; te !== null; ) {
                    if (te.key === _e) {
                      if (te.tag === 4 && te.stateNode.containerInfo === ue.containerInfo && te.stateNode.implementation === ue.implementation) {
                        n(oe, te.sibling), (te = a(te, ue.children || [])).return = oe, oe = te;
                        break e;
                      }
                      n(oe, te);
                      break;
                    }
                    t(oe, te), te = te.sibling;
                  }
                  (te = ks(ue, oe.mode, ve)).return = oe, oe = te;
                }
                return w(oe);
            }
            if (typeof ue == "string" || typeof ue == "number") return ue = "" + ue, te !== null && te.tag === 6 ? (n(oe, te.sibling), (te = a(te, ue)).return = oe, oe = te) : (n(oe, te), (te = ws(ue, oe.mode, ve)).return = oe, oe = te), w(oe);
            if (ta(ue)) return Fn(oe, te, ue, ve);
            if (en(ue)) return ln(oe, te, ue, ve);
            if (Oe && na(oe, ue), ue === void 0 && !_e) switch (oe.tag) {
              case 1:
              case 0:
                throw oe = oe.type, Error(m(152, oe.displayName || oe.name || "Component"));
            }
            return n(oe, te);
          };
        }
        var Vo = Zs(!0), $a = Zs(!1), fi = {}, er = { current: fi }, pi = { current: fi }, hi = { current: fi };
        function uo(e) {
          if (e === fi) throw Error(m(174));
          return e;
        }
        function qa(e, t) {
          switch (St(hi, t), St(pi, e), St(er, fi), e = t.nodeType) {
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
          vt(er), vt(pi), vt(hi);
        }
        function Js(e) {
          uo(hi.current);
          var t = uo(er.current), n = Ce(t, e.type);
          t !== n && (St(pi, e), St(er, n));
        }
        function Ya(e) {
          pi.current === e && (vt(er), vt(pi));
        }
        var Ct = { current: 0 };
        function ra(e) {
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
        var oa = he.ReactCurrentDispatcher, Ln = he.ReactCurrentBatchConfig, $r = 0, Lt = null, sn = null, Zt = null, ia = !1;
        function En() {
          throw Error(m(321));
        }
        function Qa(e, t) {
          if (t === null) return !1;
          for (var n = 0; n < t.length && n < e.length; n++) if (!mr(e[n], t[n])) return !1;
          return !0;
        }
        function Ga(e, t, n, o, a, h) {
          if ($r = h, Lt = t, t.memoizedState = null, t.updateQueue = null, t.expirationTime = 0, oa.current = e === null || e.memoizedState === null ? wc : kc, e = n(o, a), t.expirationTime === $r) {
            h = 0;
            do {
              if (t.expirationTime = 0, !(25 > h)) throw Error(m(301));
              h += 1, Zt = sn = null, t.updateQueue = null, oa.current = Ec, e = n(o, a);
            } while (t.expirationTime === $r);
          }
          if (oa.current = ua, t = sn !== null && sn.next !== null, $r = 0, Zt = sn = Lt = null, ia = !1, t) throw Error(m(300));
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
            if (e === null) throw Error(m(310));
            e = { memoizedState: (sn = e).memoizedState, baseState: sn.baseState, baseQueue: sn.baseQueue, queue: sn.queue, next: null }, Zt === null ? Lt.memoizedState = Zt = e : Zt = Zt.next = e;
          }
          return Zt;
        }
        function fo(e, t) {
          return typeof t == "function" ? t(e) : t;
        }
        function aa(e) {
          var t = Wo(), n = t.queue;
          if (n === null) throw Error(m(311));
          n.lastRenderedReducer = e;
          var o = sn, a = o.baseQueue, h = n.pending;
          if (h !== null) {
            if (a !== null) {
              var w = a.next;
              a.next = h.next, h.next = w;
            }
            o.baseQueue = a = h, n.pending = null;
          }
          if (a !== null) {
            a = a.next, o = o.baseState;
            var T = w = h = null, Z = a;
            do {
              var Y = Z.expirationTime;
              if (Y < $r) {
                var ge = { expirationTime: Z.expirationTime, suspenseConfig: Z.suspenseConfig, action: Z.action, eagerReducer: Z.eagerReducer, eagerState: Z.eagerState, next: null };
                T === null ? (w = T = ge, h = o) : T = T.next = ge, Y > Lt.expirationTime && (Lt.expirationTime = Y, xa(Y));
              } else T !== null && (T = T.next = { expirationTime: 1073741823, suspenseConfig: Z.suspenseConfig, action: Z.action, eagerReducer: Z.eagerReducer, eagerState: Z.eagerState, next: null }), Vl(Y, Z.suspenseConfig), o = Z.eagerReducer === e ? Z.eagerState : e(o, Z.action);
              Z = Z.next;
            } while (Z !== null && Z !== a);
            T === null ? h = o : T.next = w, mr(o, t.memoizedState) || (tr = !0), t.memoizedState = o, t.baseState = h, t.baseQueue = T, n.lastRenderedState = o;
          }
          return [t.memoizedState, n.dispatch];
        }
        function sa(e) {
          var t = Wo(), n = t.queue;
          if (n === null) throw Error(m(311));
          n.lastRenderedReducer = e;
          var o = n.dispatch, a = n.pending, h = t.memoizedState;
          if (a !== null) {
            n.pending = null;
            var w = a = a.next;
            do
              h = e(h, w.action), w = w.next;
            while (w !== a);
            mr(h, t.memoizedState) || (tr = !0), t.memoizedState = h, t.baseQueue === null && (t.baseState = h), n.lastRenderedState = h;
          }
          return [h, o];
        }
        function Xa(e) {
          var t = Ho();
          return typeof e == "function" && (e = e()), t.memoizedState = t.baseState = e, e = (e = t.queue = { pending: null, dispatch: null, lastRenderedReducer: fo, lastRenderedState: e }).dispatch = sl.bind(null, Lt, e), [t.memoizedState, e];
        }
        function Za(e, t, n, o) {
          return e = { tag: e, create: t, destroy: n, deps: o, next: null }, (t = Lt.updateQueue) === null ? (t = { lastEffect: null }, Lt.updateQueue = t, t.lastEffect = e.next = e) : (n = t.lastEffect) === null ? t.lastEffect = e.next = e : (o = n.next, n.next = e, e.next = o, t.lastEffect = e), e;
        }
        function el() {
          return Wo().memoizedState;
        }
        function Ja(e, t, n, o) {
          var a = Ho();
          Lt.effectTag |= e, a.memoizedState = Za(1 | t, n, void 0, o === void 0 ? null : o);
        }
        function es(e, t, n, o) {
          var a = Wo();
          o = o === void 0 ? null : o;
          var h = void 0;
          if (sn !== null) {
            var w = sn.memoizedState;
            if (h = w.destroy, o !== null && Qa(o, w.deps)) return void Za(t, n, h, o);
          }
          Lt.effectTag |= e, a.memoizedState = Za(1 | t, n, h, o);
        }
        function tl(e, t) {
          return Ja(516, 4, e, t);
        }
        function la(e, t) {
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
        function ca(e, t) {
          var n = Wo();
          t = t === void 0 ? null : t;
          var o = n.memoizedState;
          return o !== null && t !== null && Qa(t, o[1]) ? o[0] : (n.memoizedState = [e, t], e);
        }
        function al(e, t) {
          var n = Wo();
          t = t === void 0 ? null : t;
          var o = n.memoizedState;
          return o !== null && t !== null && Qa(t, o[1]) ? o[0] : (e = e(), n.memoizedState = [e, t], e);
        }
        function ns(e, t, n) {
          var o = Ki();
          Vr(98 > o ? 98 : o, function() {
            e(!0);
          }), Vr(97 < o ? 97 : o, function() {
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
          var o = nr(), a = ui.suspense;
          a = { expirationTime: o = go(o, e, a), suspenseConfig: a, action: n, eagerReducer: null, eagerState: null, next: null };
          var h = t.pending;
          if (h === null ? a.next = a : (a.next = h.next, h.next = a), t.pending = a, h = e.alternate, e === Lt || h !== null && h === Lt) ia = !0, a.expirationTime = $r, Lt.expirationTime = $r;
          else {
            if (e.expirationTime === 0 && (h === null || h.expirationTime === 0) && (h = t.lastRenderedReducer) !== null) try {
              var w = t.lastRenderedState, T = h(w, n);
              if (a.eagerReducer = h, a.eagerState = T, mr(T, w)) return;
            } catch {
            }
            Kr(e, o);
          }
        }
        var ua = { readContext: zn, useCallback: En, useContext: En, useEffect: En, useImperativeHandle: En, useLayoutEffect: En, useMemo: En, useReducer: En, useRef: En, useState: En, useDebugValue: En, useResponder: En, useDeferredValue: En, useTransition: En }, wc = { readContext: zn, useCallback: il, useContext: zn, useEffect: tl, useImperativeHandle: function(e, t, n) {
          return n = n != null ? n.concat([e]) : null, Ja(4, 2, rl.bind(null, t, e), n);
        }, useLayoutEffect: function(e, t) {
          return Ja(4, 2, e, t);
        }, useMemo: function(e, t) {
          var n = Ho();
          return t = t === void 0 ? null : t, e = e(), n.memoizedState = [e, t], e;
        }, useReducer: function(e, t, n) {
          var o = Ho();
          return t = n !== void 0 ? n(t) : t, o.memoizedState = o.baseState = t, e = (e = o.queue = { pending: null, dispatch: null, lastRenderedReducer: e, lastRenderedState: t }).dispatch = sl.bind(null, Lt, e), [o.memoizedState, e];
        }, useRef: function(e) {
          return e = { current: e }, Ho().memoizedState = e;
        }, useState: Xa, useDebugValue: ts, useResponder: Ka, useDeferredValue: function(e, t) {
          var n = Xa(e), o = n[0], a = n[1];
          return tl(function() {
            var h = Ln.suspense;
            Ln.suspense = t === void 0 ? null : t;
            try {
              a(e);
            } finally {
              Ln.suspense = h;
            }
          }, [e, t]), o;
        }, useTransition: function(e) {
          var t = Xa(!1), n = t[0];
          return t = t[1], [il(ns.bind(null, t, e), [t, e]), n];
        } }, kc = { readContext: zn, useCallback: ca, useContext: zn, useEffect: la, useImperativeHandle: ol, useLayoutEffect: nl, useMemo: al, useReducer: aa, useRef: el, useState: function() {
          return aa(fo);
        }, useDebugValue: ts, useResponder: Ka, useDeferredValue: function(e, t) {
          var n = aa(fo), o = n[0], a = n[1];
          return la(function() {
            var h = Ln.suspense;
            Ln.suspense = t === void 0 ? null : t;
            try {
              a(e);
            } finally {
              Ln.suspense = h;
            }
          }, [e, t]), o;
        }, useTransition: function(e) {
          var t = aa(fo), n = t[0];
          return t = t[1], [ca(ns.bind(null, t, e), [t, e]), n];
        } }, Ec = { readContext: zn, useCallback: ca, useContext: zn, useEffect: la, useImperativeHandle: ol, useLayoutEffect: nl, useMemo: al, useReducer: sa, useRef: el, useState: function() {
          return sa(fo);
        }, useDebugValue: ts, useResponder: Ka, useDeferredValue: function(e, t) {
          var n = sa(fo), o = n[0], a = n[1];
          return la(function() {
            var h = Ln.suspense;
            Ln.suspense = t === void 0 ? null : t;
            try {
              a(e);
            } finally {
              Ln.suspense = h;
            }
          }, [e, t]), o;
        }, useTransition: function(e) {
          var t = sa(fo), n = t[0];
          return t = t[1], [ca(ns.bind(null, t, e), [t, e]), n];
        } }, yr = null, qr = null, po = !1;
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
          if (po) {
            var t = qr;
            if (t) {
              var n = t;
              if (!cl(e, t)) {
                if (!(t = Ar(n.nextSibling)) || !cl(e, t)) return e.effectTag = -1025 & e.effectTag | 2, po = !1, void (yr = e);
                ll(yr, n);
              }
              yr = e, qr = Ar(t.firstChild);
            } else e.effectTag = -1025 & e.effectTag | 2, po = !1, yr = e;
          }
        }
        function ul(e) {
          for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13; ) e = e.return;
          yr = e;
        }
        function da(e) {
          if (e !== yr) return !1;
          if (!po) return ul(e), po = !0, !1;
          var t = e.type;
          if (e.tag !== 5 || t !== "head" && t !== "body" && !ri(t, e.memoizedProps)) for (t = qr; t; ) ll(e, t), t = Ar(t.nextSibling);
          if (ul(e), e.tag === 13) {
            if (!(e = (e = e.memoizedState) !== null ? e.dehydrated : null)) throw Error(m(317));
            e: {
              for (e = e.nextSibling, t = 0; e; ) {
                if (e.nodeType === 8) {
                  var n = e.data;
                  if (n === "/$") {
                    if (t === 0) {
                      qr = Ar(e.nextSibling);
                      break e;
                    }
                    t--;
                  } else n !== "$" && n !== "$!" && n !== "$?" || t++;
                }
                e = e.nextSibling;
              }
              qr = null;
            }
          } else qr = yr ? Ar(e.stateNode.nextSibling) : null;
          return !0;
        }
        function os() {
          qr = yr = null, po = !1;
        }
        var _c = he.ReactCurrentOwner, tr = !1;
        function Un(e, t, n, o) {
          t.child = e === null ? $a(t, null, n, o) : Vo(t, e.child, n, o);
        }
        function dl(e, t, n, o, a) {
          n = n.render;
          var h = t.ref;
          return Fo(t, a), o = Ga(e, t, n, o, h, a), e === null || tr ? (t.effectTag |= 1, Un(e, t, o, a), t.child) : (t.updateQueue = e.updateQueue, t.effectTag &= -517, e.expirationTime <= a && (e.expirationTime = 0), vr(e, t, a));
        }
        function fl(e, t, n, o, a, h) {
          if (e === null) {
            var w = n.type;
            return typeof w != "function" || vs(w) || w.defaultProps !== void 0 || n.compare !== null || n.defaultProps !== void 0 ? ((e = Sa(n.type, null, o, null, t.mode, h)).ref = t.ref, e.return = t, t.child = e) : (t.tag = 15, t.type = w, pl(e, t, w, o, a, h));
          }
          return w = e.child, a < h && (a = w.memoizedProps, (n = (n = n.compare) !== null ? n : gr)(a, o) && e.ref === t.ref) ? vr(e, t, h) : (t.effectTag |= 1, (e = wo(w, o)).ref = t.ref, e.return = t, t.child = e);
        }
        function pl(e, t, n, o, a, h) {
          return e !== null && gr(e.memoizedProps, o) && e.ref === t.ref && (tr = !1, a < h) ? (t.expirationTime = e.expirationTime, vr(e, t, h)) : is(e, t, n, o, h);
        }
        function hl(e, t) {
          var n = t.ref;
          (e === null && n !== null || e !== null && e.ref !== n) && (t.effectTag |= 128);
        }
        function is(e, t, n, o, a) {
          var h = hn(n) ? co : Xt.current;
          return h = Lo(t, h), Fo(t, a), n = Ga(e, t, n, o, h, a), e === null || tr ? (t.effectTag |= 1, Un(e, t, n, a), t.child) : (t.updateQueue = e.updateQueue, t.effectTag &= -517, e.expirationTime <= a && (e.expirationTime = 0), vr(e, t, a));
        }
        function ml(e, t, n, o, a) {
          if (hn(n)) {
            var h = !0;
            $i(t);
          } else h = !1;
          if (Fo(t, a), t.stateNode === null) e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= 2), Gs(t, n, o), Wa(t, n, o, a), o = !0;
          else if (e === null) {
            var w = t.stateNode, T = t.memoizedProps;
            w.props = T;
            var Z = w.context, Y = n.contextType;
            typeof Y == "object" && Y !== null ? Y = zn(Y) : Y = Lo(t, Y = hn(n) ? co : Xt.current);
            var ge = n.getDerivedStateFromProps, De = typeof ge == "function" || typeof w.getSnapshotBeforeUpdate == "function";
            De || typeof w.UNSAFE_componentWillReceiveProps != "function" && typeof w.componentWillReceiveProps != "function" || (T !== o || Z !== Y) && Xs(t, w, o, Y), Br = !1;
            var He = t.memoizedState;
            w.state = He, ci(t, o, w, a), Z = t.memoizedState, T !== o || He !== Z || pn.current || Br ? (typeof ge == "function" && (Ji(t, n, ge, o), Z = t.memoizedState), (T = Br || Qs(t, n, T, o, He, Z, Y)) ? (De || typeof w.UNSAFE_componentWillMount != "function" && typeof w.componentWillMount != "function" || (typeof w.componentWillMount == "function" && w.componentWillMount(), typeof w.UNSAFE_componentWillMount == "function" && w.UNSAFE_componentWillMount()), typeof w.componentDidMount == "function" && (t.effectTag |= 4)) : (typeof w.componentDidMount == "function" && (t.effectTag |= 4), t.memoizedProps = o, t.memoizedState = Z), w.props = o, w.state = Z, w.context = Y, o = T) : (typeof w.componentDidMount == "function" && (t.effectTag |= 4), o = !1);
          } else w = t.stateNode, Ha(e, t), T = t.memoizedProps, w.props = t.type === t.elementType ? T : $n(t.type, T), Z = w.context, typeof (Y = n.contextType) == "object" && Y !== null ? Y = zn(Y) : Y = Lo(t, Y = hn(n) ? co : Xt.current), (De = typeof (ge = n.getDerivedStateFromProps) == "function" || typeof w.getSnapshotBeforeUpdate == "function") || typeof w.UNSAFE_componentWillReceiveProps != "function" && typeof w.componentWillReceiveProps != "function" || (T !== o || Z !== Y) && Xs(t, w, o, Y), Br = !1, Z = t.memoizedState, w.state = Z, ci(t, o, w, a), He = t.memoizedState, T !== o || Z !== He || pn.current || Br ? (typeof ge == "function" && (Ji(t, n, ge, o), He = t.memoizedState), (ge = Br || Qs(t, n, T, o, Z, He, Y)) ? (De || typeof w.UNSAFE_componentWillUpdate != "function" && typeof w.componentWillUpdate != "function" || (typeof w.componentWillUpdate == "function" && w.componentWillUpdate(o, He, Y), typeof w.UNSAFE_componentWillUpdate == "function" && w.UNSAFE_componentWillUpdate(o, He, Y)), typeof w.componentDidUpdate == "function" && (t.effectTag |= 4), typeof w.getSnapshotBeforeUpdate == "function" && (t.effectTag |= 256)) : (typeof w.componentDidUpdate != "function" || T === e.memoizedProps && Z === e.memoizedState || (t.effectTag |= 4), typeof w.getSnapshotBeforeUpdate != "function" || T === e.memoizedProps && Z === e.memoizedState || (t.effectTag |= 256), t.memoizedProps = o, t.memoizedState = He), w.props = o, w.state = He, w.context = Y, o = ge) : (typeof w.componentDidUpdate != "function" || T === e.memoizedProps && Z === e.memoizedState || (t.effectTag |= 4), typeof w.getSnapshotBeforeUpdate != "function" || T === e.memoizedProps && Z === e.memoizedState || (t.effectTag |= 256), o = !1);
          return as(e, t, n, o, h, a);
        }
        function as(e, t, n, o, a, h) {
          hl(e, t);
          var w = (64 & t.effectTag) != 0;
          if (!o && !w) return a && Rs(t, n, !1), vr(e, t, h);
          o = t.stateNode, _c.current = t;
          var T = w && typeof n.getDerivedStateFromError != "function" ? null : o.render();
          return t.effectTag |= 1, e !== null && w ? (t.child = Vo(t, e.child, null, h), t.child = Vo(t, null, T, h)) : Un(e, t, T, h), t.memoizedState = o.state, a && Rs(t, n, !0), t.child;
        }
        function gl(e) {
          var t = e.stateNode;
          t.pendingContext ? Ns(0, t.pendingContext, t.pendingContext !== t.context) : t.context && Ns(0, t.context, !1), qa(e, t.containerInfo);
        }
        var bl, yl, vl, ss = { dehydrated: null, retryTime: 0 };
        function wl(e, t, n) {
          var o, a = t.mode, h = t.pendingProps, w = Ct.current, T = !1;
          if ((o = (64 & t.effectTag) != 0) || (o = (2 & w) != 0 && (e === null || e.memoizedState !== null)), o ? (T = !0, t.effectTag &= -65) : e !== null && e.memoizedState === null || h.fallback === void 0 || h.unstable_avoidThisFallback === !0 || (w |= 1), St(Ct, 1 & w), e === null) {
            if (h.fallback !== void 0 && rs(t), T) {
              if (T = h.fallback, (h = Qr(null, a, 0, null)).return = t, (2 & t.mode) == 0) for (e = t.memoizedState !== null ? t.child.child : t.child, h.child = e; e !== null; ) e.return = h, e = e.sibling;
              return (n = Qr(T, a, n, null)).return = t, h.sibling = n, t.memoizedState = ss, t.child = h, n;
            }
            return a = h.children, t.memoizedState = null, t.child = $a(t, null, a, n);
          }
          if (e.memoizedState !== null) {
            if (a = (e = e.child).sibling, T) {
              if (h = h.fallback, (n = wo(e, e.pendingProps)).return = t, (2 & t.mode) == 0 && (T = t.memoizedState !== null ? t.child.child : t.child) !== e.child) for (n.child = T; T !== null; ) T.return = n, T = T.sibling;
              return (a = wo(a, h)).return = t, n.sibling = a, n.childExpirationTime = 0, t.memoizedState = ss, t.child = n, a;
            }
            return n = Vo(t, e.child, h.children, n), t.memoizedState = null, t.child = n;
          }
          if (e = e.child, T) {
            if (T = h.fallback, (h = Qr(null, a, 0, null)).return = t, h.child = e, e !== null && (e.return = h), (2 & t.mode) == 0) for (e = t.memoizedState !== null ? t.child.child : t.child, h.child = e; e !== null; ) e.return = h, e = e.sibling;
            return (n = Qr(T, a, n, null)).return = t, h.sibling = n, n.effectTag |= 2, h.childExpirationTime = 0, t.memoizedState = ss, t.child = h, n;
          }
          return t.memoizedState = null, t.child = Vo(t, e, h.children, n);
        }
        function kl(e, t) {
          e.expirationTime < t && (e.expirationTime = t);
          var n = e.alternate;
          n !== null && n.expirationTime < t && (n.expirationTime = t), $s(e.return, t);
        }
        function ls(e, t, n, o, a, h) {
          var w = e.memoizedState;
          w === null ? e.memoizedState = { isBackwards: t, rendering: null, renderingStartTime: 0, last: o, tail: n, tailExpiration: 0, tailMode: a, lastEffect: h } : (w.isBackwards = t, w.rendering = null, w.renderingStartTime = 0, w.last = o, w.tail = n, w.tailExpiration = 0, w.tailMode = a, w.lastEffect = h);
        }
        function El(e, t, n) {
          var o = t.pendingProps, a = o.revealOrder, h = o.tail;
          if (Un(e, t, o.children, n), (2 & (o = Ct.current)) != 0) o = 1 & o | 2, t.effectTag |= 64;
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
            o &= 1;
          }
          if (St(Ct, o), (2 & t.mode) == 0) t.memoizedState = null;
          else switch (a) {
            case "forwards":
              for (n = t.child, a = null; n !== null; ) (e = n.alternate) !== null && ra(e) === null && (a = n), n = n.sibling;
              (n = a) === null ? (a = t.child, t.child = null) : (a = n.sibling, n.sibling = null), ls(t, !1, a, n, h, t.lastEffect);
              break;
            case "backwards":
              for (n = null, a = t.child, t.child = null; a !== null; ) {
                if ((e = a.alternate) !== null && ra(e) === null) {
                  t.child = a;
                  break;
                }
                e = a.sibling, a.sibling = n, n = a, a = e;
              }
              ls(t, !0, n, null, h, t.lastEffect);
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
          var o = t.expirationTime;
          if (o !== 0 && xa(o), t.childExpirationTime < n) return null;
          if (e !== null && t.child !== e.child) throw Error(m(153));
          if (t.child !== null) {
            for (n = wo(e = t.child, e.pendingProps), t.child = n, n.return = t; e.sibling !== null; ) e = e.sibling, (n = n.sibling = wo(e, e.pendingProps)).return = t;
            n.sibling = null;
          }
          return t.child;
        }
        function fa(e, t) {
          switch (e.tailMode) {
            case "hidden":
              t = e.tail;
              for (var n = null; t !== null; ) t.alternate !== null && (n = t), t = t.sibling;
              n === null ? e.tail = null : n.sibling = null;
              break;
            case "collapsed":
              n = e.tail;
              for (var o = null; n !== null; ) n.alternate !== null && (o = n), n = n.sibling;
              o === null ? t || e.tail === null ? e.tail = null : e.tail.sibling = null : o.sibling = null;
          }
        }
        function xc(e, t, n) {
          var o = t.pendingProps;
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
              return hn(t.type) && Wi(), null;
            case 3:
              return Bo(), vt(pn), vt(Xt), (n = t.stateNode).pendingContext && (n.context = n.pendingContext, n.pendingContext = null), e !== null && e.child !== null || !da(t) || (t.effectTag |= 4), null;
            case 5:
              Ya(t), n = uo(hi.current);
              var a = t.type;
              if (e !== null && t.stateNode != null) yl(e, t, a, o, n), e.ref !== t.ref && (t.effectTag |= 128);
              else {
                if (!o) {
                  if (t.stateNode === null) throw Error(m(166));
                  return null;
                }
                if (e = uo(er.current), da(t)) {
                  o = t.stateNode, a = t.type;
                  var h = t.memoizedProps;
                  switch (o[Qn] = t, o[ro] = h, a) {
                    case "iframe":
                    case "object":
                    case "embed":
                      mt("load", o);
                      break;
                    case "video":
                    case "audio":
                      for (e = 0; e < ct.length; e++) mt(ct[e], o);
                      break;
                    case "source":
                      mt("error", o);
                      break;
                    case "img":
                    case "image":
                    case "link":
                      mt("error", o), mt("load", o);
                      break;
                    case "form":
                      mt("reset", o), mt("submit", o);
                      break;
                    case "details":
                      mt("toggle", o);
                      break;
                    case "input":
                      bn(o, h), mt("invalid", o), Hn(n, "onChange");
                      break;
                    case "select":
                      o._wrapperState = { wasMultiple: !!h.multiple }, mt("invalid", o), Hn(n, "onChange");
                      break;
                    case "textarea":
                      On(o, h), mt("invalid", o), Hn(n, "onChange");
                  }
                  for (var w in Xo(a, h), e = null, h) if (h.hasOwnProperty(w)) {
                    var T = h[w];
                    w === "children" ? typeof T == "string" ? o.textContent !== T && (e = ["children", T]) : typeof T == "number" && o.textContent !== "" + T && (e = ["children", "" + T]) : A.hasOwnProperty(w) && T != null && Hn(n, w);
                  }
                  switch (a) {
                    case "input":
                      Sr(o), ar(o, h, !0);
                      break;
                    case "textarea":
                      Sr(o), Zr(o);
                      break;
                    case "select":
                    case "option":
                      break;
                    default:
                      typeof h.onClick == "function" && (o.onclick = Po);
                  }
                  n = e, t.updateQueue = n, n !== null && (t.effectTag |= 4);
                } else {
                  switch (w = n.nodeType === 9 ? n : n.ownerDocument, e === Di && (e = we(a)), e === Di ? a === "script" ? ((e = w.createElement("div")).innerHTML = "<script><\/script>", e = e.removeChild(e.firstChild)) : typeof o.is == "string" ? e = w.createElement(a, { is: o.is }) : (e = w.createElement(a), a === "select" && (w = e, o.multiple ? w.multiple = !0 : o.size && (w.size = o.size))) : e = w.createElementNS(e, a), e[Qn] = t, e[ro] = o, bl(e, t), t.stateNode = e, w = Zo(a, o), a) {
                    case "iframe":
                    case "object":
                    case "embed":
                      mt("load", e), T = o;
                      break;
                    case "video":
                    case "audio":
                      for (T = 0; T < ct.length; T++) mt(ct[T], e);
                      T = o;
                      break;
                    case "source":
                      mt("error", e), T = o;
                      break;
                    case "img":
                    case "image":
                    case "link":
                      mt("error", e), mt("load", e), T = o;
                      break;
                    case "form":
                      mt("reset", e), mt("submit", e), T = o;
                      break;
                    case "details":
                      mt("toggle", e), T = o;
                      break;
                    case "input":
                      bn(e, o), T = Cr(e, o), mt("invalid", e), Hn(n, "onChange");
                      break;
                    case "option":
                      T = sr(e, o);
                      break;
                    case "select":
                      e._wrapperState = { wasMultiple: !!o.multiple }, T = r({}, o, { value: void 0 }), mt("invalid", e), Hn(n, "onChange");
                      break;
                    case "textarea":
                      On(e, o), T = lr(e, o), mt("invalid", e), Hn(n, "onChange");
                      break;
                    default:
                      T = o;
                  }
                  Xo(a, T);
                  var Z = T;
                  for (h in Z) if (Z.hasOwnProperty(h)) {
                    var Y = Z[h];
                    h === "style" ? Pi(e, Y) : h === "dangerouslySetInnerHTML" ? (Y = Y ? Y.__html : void 0) != null && Ye(e, Y) : h === "children" ? typeof Y == "string" ? (a !== "textarea" || Y !== "") && st(e, Y) : typeof Y == "number" && st(e, "" + Y) : h !== "suppressContentEditableWarning" && h !== "suppressHydrationWarning" && h !== "autoFocus" && (A.hasOwnProperty(h) ? Y != null && Hn(n, h) : Y != null && je(e, h, Y, w));
                  }
                  switch (a) {
                    case "input":
                      Sr(e), ar(e, o, !1);
                      break;
                    case "textarea":
                      Sr(e), Zr(e);
                      break;
                    case "option":
                      o.value != null && e.setAttribute("value", "" + Yt(o.value));
                      break;
                    case "select":
                      e.multiple = !!o.multiple, (n = o.value) != null ? Tn(e, !!o.multiple, n, !1) : o.defaultValue != null && Tn(e, !!o.multiple, o.defaultValue, !0);
                      break;
                    default:
                      typeof T.onClick == "function" && (e.onclick = Po);
                  }
                  Mi(a, o) && (t.effectTag |= 4);
                }
                t.ref !== null && (t.effectTag |= 128);
              }
              return null;
            case 6:
              if (e && t.stateNode != null) vl(0, t, e.memoizedProps, o);
              else {
                if (typeof o != "string" && t.stateNode === null) throw Error(m(166));
                n = uo(hi.current), uo(er.current), da(t) ? (n = t.stateNode, o = t.memoizedProps, n[Qn] = t, n.nodeValue !== o && (t.effectTag |= 4)) : ((n = (n.nodeType === 9 ? n : n.ownerDocument).createTextNode(o))[Qn] = t, t.stateNode = n);
              }
              return null;
            case 13:
              return vt(Ct), o = t.memoizedState, (64 & t.effectTag) != 0 ? (t.expirationTime = n, t) : (n = o !== null, o = !1, e === null ? t.memoizedProps.fallback !== void 0 && da(t) : (o = (a = e.memoizedState) !== null, n || a === null || (a = e.child.sibling) !== null && ((h = t.firstEffect) !== null ? (t.firstEffect = a, a.nextEffect = h) : (t.firstEffect = t.lastEffect = a, a.nextEffect = null), a.effectTag = 8)), n && !o && (2 & t.mode) != 0 && (e === null && t.memoizedProps.unstable_avoidThisFallback !== !0 || (1 & Ct.current) != 0 ? Ft === ho && (Ft = ha) : (Ft !== ho && Ft !== ha || (Ft = ma), gi !== 0 && _n !== null && (ko(_n, mn), ql(_n, gi)))), (n || o) && (t.effectTag |= 4), null);
            case 4:
              return Bo(), null;
            case 10:
              return Va(t), null;
            case 17:
              return hn(t.type) && Wi(), null;
            case 19:
              if (vt(Ct), (o = t.memoizedState) === null) return null;
              if (a = (64 & t.effectTag) != 0, (h = o.rendering) === null) {
                if (a) fa(o, !1);
                else if (Ft !== ho || e !== null && (64 & e.effectTag) != 0) for (h = t.child; h !== null; ) {
                  if ((e = ra(h)) !== null) {
                    for (t.effectTag |= 64, fa(o, !1), (a = e.updateQueue) !== null && (t.updateQueue = a, t.effectTag |= 4), o.lastEffect === null && (t.firstEffect = null), t.lastEffect = o.lastEffect, o = t.child; o !== null; ) h = n, (a = o).effectTag &= 2, a.nextEffect = null, a.firstEffect = null, a.lastEffect = null, (e = a.alternate) === null ? (a.childExpirationTime = 0, a.expirationTime = h, a.child = null, a.memoizedProps = null, a.memoizedState = null, a.updateQueue = null, a.dependencies = null) : (a.childExpirationTime = e.childExpirationTime, a.expirationTime = e.expirationTime, a.child = e.child, a.memoizedProps = e.memoizedProps, a.memoizedState = e.memoizedState, a.updateQueue = e.updateQueue, h = e.dependencies, a.dependencies = h === null ? null : { expirationTime: h.expirationTime, firstContext: h.firstContext, responders: h.responders }), o = o.sibling;
                    return St(Ct, 1 & Ct.current | 2), t.child;
                  }
                  h = h.sibling;
                }
              } else {
                if (!a) if ((e = ra(h)) !== null) {
                  if (t.effectTag |= 64, a = !0, (n = e.updateQueue) !== null && (t.updateQueue = n, t.effectTag |= 4), fa(o, !0), o.tail === null && o.tailMode === "hidden" && !h.alternate) return (t = t.lastEffect = o.lastEffect) !== null && (t.nextEffect = null), null;
                } else 2 * jn() - o.renderingStartTime > o.tailExpiration && 1 < n && (t.effectTag |= 64, a = !0, fa(o, !1), t.expirationTime = t.childExpirationTime = n - 1);
                o.isBackwards ? (h.sibling = t.child, t.child = h) : ((n = o.last) !== null ? n.sibling = h : t.child = h, o.last = h);
              }
              return o.tail !== null ? (o.tailExpiration === 0 && (o.tailExpiration = jn() + 500), n = o.tail, o.rendering = n, o.tail = n.sibling, o.lastEffect = t.lastEffect, o.renderingStartTime = jn(), n.sibling = null, t = Ct.current, St(Ct, a ? 1 & t | 2 : 1 & t), n) : null;
          }
          throw Error(m(156, t.tag));
        }
        function Sc(e) {
          switch (e.tag) {
            case 1:
              hn(e.type) && Wi();
              var t = e.effectTag;
              return 4096 & t ? (e.effectTag = -4097 & t | 64, e) : null;
            case 3:
              if (Bo(), vt(pn), vt(Xt), (64 & (t = e.effectTag)) != 0) throw Error(m(285));
              return e.effectTag = -4097 & t | 64, e;
            case 5:
              return Ya(e), null;
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
        }, yl = function(e, t, n, o, a) {
          var h = e.memoizedProps;
          if (h !== o) {
            var w, T, Z = t.stateNode;
            switch (uo(er.current), e = null, n) {
              case "input":
                h = Cr(Z, h), o = Cr(Z, o), e = [];
                break;
              case "option":
                h = sr(Z, h), o = sr(Z, o), e = [];
                break;
              case "select":
                h = r({}, h, { value: void 0 }), o = r({}, o, { value: void 0 }), e = [];
                break;
              case "textarea":
                h = lr(Z, h), o = lr(Z, o), e = [];
                break;
              default:
                typeof h.onClick != "function" && typeof o.onClick == "function" && (Z.onclick = Po);
            }
            for (w in Xo(n, o), n = null, h) if (!o.hasOwnProperty(w) && h.hasOwnProperty(w) && h[w] != null) if (w === "style") for (T in Z = h[w]) Z.hasOwnProperty(T) && (n || (n = {}), n[T] = "");
            else w !== "dangerouslySetInnerHTML" && w !== "children" && w !== "suppressContentEditableWarning" && w !== "suppressHydrationWarning" && w !== "autoFocus" && (A.hasOwnProperty(w) ? e || (e = []) : (e = e || []).push(w, null));
            for (w in o) {
              var Y = o[w];
              if (Z = h != null ? h[w] : void 0, o.hasOwnProperty(w) && Y !== Z && (Y != null || Z != null)) if (w === "style") if (Z) {
                for (T in Z) !Z.hasOwnProperty(T) || Y && Y.hasOwnProperty(T) || (n || (n = {}), n[T] = "");
                for (T in Y) Y.hasOwnProperty(T) && Z[T] !== Y[T] && (n || (n = {}), n[T] = Y[T]);
              } else n || (e || (e = []), e.push(w, n)), n = Y;
              else w === "dangerouslySetInnerHTML" ? (Y = Y ? Y.__html : void 0, Z = Z ? Z.__html : void 0, Y != null && Z !== Y && (e = e || []).push(w, Y)) : w === "children" ? Z === Y || typeof Y != "string" && typeof Y != "number" || (e = e || []).push(w, "" + Y) : w !== "suppressContentEditableWarning" && w !== "suppressHydrationWarning" && (A.hasOwnProperty(w) ? (Y != null && Hn(a, w), e || Z === Y || (e = [])) : (e = e || []).push(w, Y));
            }
            n && (e = e || []).push("style", n), a = e, (t.updateQueue = a) && (t.effectTag |= 4);
          }
        }, vl = function(e, t, n, o) {
          n !== o && (t.effectTag |= 4);
        };
        var Cc = typeof WeakSet == "function" ? WeakSet : Set;
        function us(e, t) {
          var n = t.source, o = t.stack;
          o === null && n !== null && (o = xr(n)), n !== null && qt(n.type), t = t.value, e !== null && e.tag === 1 && qt(e.type);
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
            vo(e, n);
          }
          else t.current = null;
        }
        function Tc(e, t) {
          switch (t.tag) {
            case 0:
            case 11:
            case 15:
            case 22:
              return;
            case 1:
              if (256 & t.effectTag && e !== null) {
                var n = e.memoizedProps, o = e.memoizedState;
                t = (e = t.stateNode).getSnapshotBeforeUpdate(t.elementType === t.type ? n : $n(t.type, n), o), e.__reactInternalSnapshotBeforeUpdate = t;
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
                var o = n.destroy;
                n.destroy = void 0, o !== void 0 && o();
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
                var o = n.create;
                n.destroy = o();
              }
              n = n.next;
            } while (n !== t);
          }
        }
        function Oc(e, t, n) {
          switch (n.tag) {
            case 0:
            case 11:
            case 15:
            case 22:
              return void Sl(3, n);
            case 1:
              if (e = n.stateNode, 4 & n.effectTag) if (t === null) e.componentDidMount();
              else {
                var o = n.elementType === n.type ? t.memoizedProps : $n(n.type, t.memoizedProps);
                e.componentDidUpdate(o, t.memoizedState, e.__reactInternalSnapshotBeforeUpdate);
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
              return e = n.stateNode, void (t === null && 4 & n.effectTag && Mi(n.type, n.memoizedProps) && e.focus());
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
          switch (typeof ys == "function" && ys(t), t.tag) {
            case 0:
            case 11:
            case 14:
            case 15:
            case 22:
              if ((e = t.updateQueue) !== null && (e = e.lastEffect) !== null) {
                var o = e.next;
                Vr(97 < n ? 97 : n, function() {
                  var a = o;
                  do {
                    var h = a.destroy;
                    if (h !== void 0) {
                      var w = t;
                      try {
                        h();
                      } catch (T) {
                        vo(w, T);
                      }
                    }
                    a = a.next;
                  } while (a !== o);
                });
              }
              break;
            case 1:
              _l(t), typeof (n = t.stateNode).componentWillUnmount == "function" && function(a, h) {
                try {
                  h.props = a.memoizedProps, h.state = a.memoizedState, h.componentWillUnmount();
                } catch (w) {
                  vo(a, w);
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
              var o = !1;
              break;
            case 3:
            case 4:
              t = t.containerInfo, o = !0;
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
          o ? function a(h, w, T) {
            var Z = h.tag, Y = Z === 5 || Z === 6;
            if (Y) h = Y ? h.stateNode : h.stateNode.instance, w ? T.nodeType === 8 ? T.parentNode.insertBefore(h, w) : T.insertBefore(h, w) : (T.nodeType === 8 ? (w = T.parentNode).insertBefore(h, T) : (w = T).appendChild(h), (T = T._reactRootContainer) !== null && T !== void 0 || w.onclick !== null || (w.onclick = Po));
            else if (Z !== 4 && (h = h.child) !== null) for (a(h, w, T), h = h.sibling; h !== null; ) a(h, w, T), h = h.sibling;
          }(e, n, t) : function a(h, w, T) {
            var Z = h.tag, Y = Z === 5 || Z === 6;
            if (Y) h = Y ? h.stateNode : h.stateNode.instance, w ? T.insertBefore(h, w) : T.appendChild(h);
            else if (Z !== 4 && (h = h.child) !== null) for (a(h, w, T), h = h.sibling; h !== null; ) a(h, w, T), h = h.sibling;
          }(e, n, t);
        }
        function Nl(e, t, n) {
          for (var o, a, h = t, w = !1; ; ) {
            if (!w) {
              w = h.return;
              e: for (; ; ) {
                if (w === null) throw Error(m(160));
                switch (o = w.stateNode, w.tag) {
                  case 5:
                    a = !1;
                    break e;
                  case 3:
                  case 4:
                    o = o.containerInfo, a = !0;
                    break e;
                }
                w = w.return;
              }
              w = !0;
            }
            if (h.tag === 5 || h.tag === 6) {
              e: for (var T = e, Z = h, Y = n, ge = Z; ; ) if (Cl(T, ge, Y), ge.child !== null && ge.tag !== 4) ge.child.return = ge, ge = ge.child;
              else {
                if (ge === Z) break e;
                for (; ge.sibling === null; ) {
                  if (ge.return === null || ge.return === Z) break e;
                  ge = ge.return;
                }
                ge.sibling.return = ge.return, ge = ge.sibling;
              }
              a ? (T = o, Z = h.stateNode, T.nodeType === 8 ? T.parentNode.removeChild(Z) : T.removeChild(Z)) : o.removeChild(h.stateNode);
            } else if (h.tag === 4) {
              if (h.child !== null) {
                o = h.stateNode.containerInfo, a = !0, h.child.return = h, h = h.child;
                continue;
              }
            } else if (Cl(e, h, n), h.child !== null) {
              h.child.return = h, h = h.child;
              continue;
            }
            if (h === t) break;
            for (; h.sibling === null; ) {
              if (h.return === null || h.return === t) return;
              (h = h.return).tag === 4 && (w = !1);
            }
            h.sibling.return = h.return, h = h.sibling;
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
                var o = t.memoizedProps, a = e !== null ? e.memoizedProps : o;
                e = t.type;
                var h = t.updateQueue;
                if (t.updateQueue = null, h !== null) {
                  for (n[ro] = o, e === "input" && o.type === "radio" && o.name != null && Tr(n, o), Zo(e, a), t = Zo(e, o), a = 0; a < h.length; a += 2) {
                    var w = h[a], T = h[a + 1];
                    w === "style" ? Pi(n, T) : w === "dangerouslySetInnerHTML" ? Ye(n, T) : w === "children" ? st(n, T) : je(n, w, T, t);
                  }
                  switch (e) {
                    case "input":
                      ir(n, o);
                      break;
                    case "textarea":
                      Xr(n, o);
                      break;
                    case "select":
                      t = n._wrapperState.wasMultiple, n._wrapperState.wasMultiple = !!o.multiple, (e = o.value) != null ? Tn(n, !!o.multiple, e, !1) : t !== !!o.multiple && (o.defaultValue != null ? Tn(n, !!o.multiple, o.defaultValue, !0) : Tn(n, !!o.multiple, o.multiple ? [] : "", !1));
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
              if (n = t, t.memoizedState === null ? o = !1 : (o = !0, n = t.child, fs = jn()), n !== null) e: for (e = n; ; ) {
                if (e.tag === 5) h = e.stateNode, o ? typeof (h = h.style).setProperty == "function" ? h.setProperty("display", "none", "important") : h.display = "none" : (h = e.stateNode, a = (a = e.memoizedProps.style) != null && a.hasOwnProperty("display") ? a.display : null, h.style.display = Oi("display", a));
                else if (e.tag === 6) e.stateNode.nodeValue = o ? "" : e.memoizedProps;
                else {
                  if (e.tag === 13 && e.memoizedState !== null && e.memoizedState.dehydrated === null) {
                    (h = e.child.sibling).return = e, e = h;
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
            n === null && (n = e.stateNode = new Cc()), t.forEach(function(o) {
              var a = zc.bind(null, e, o);
              n.has(o) || (n.add(o), o.then(a, a));
            });
          }
        }
        var Pc = typeof WeakMap == "function" ? WeakMap : Map;
        function Rl(e, t, n) {
          (n = Hr(n, null)).tag = 3, n.payload = { element: null };
          var o = t.value;
          return n.callback = function() {
            va || (va = !0, ps = o), us(e, t);
          }, n;
        }
        function Il(e, t, n) {
          (n = Hr(n, null)).tag = 3;
          var o = e.type.getDerivedStateFromError;
          if (typeof o == "function") {
            var a = t.value;
            n.payload = function() {
              return us(e, t), o(a);
            };
          }
          var h = e.stateNode;
          return h !== null && typeof h.componentDidCatch == "function" && (n.callback = function() {
            typeof o != "function" && (Yr === null ? Yr = /* @__PURE__ */ new Set([this]) : Yr.add(this), us(e, t));
            var w = t.stack;
            this.componentDidCatch(t.value, { componentStack: w !== null ? w : "" });
          }), n;
        }
        var Al, Nc = Math.ceil, pa = he.ReactCurrentDispatcher, Ml = he.ReactCurrentOwner, ho = 0, ha = 3, ma = 4, Qe = 0, _n = null, Ge = null, mn = 0, Ft = ho, ga = null, wr = 1073741823, mi = 1073741823, ba = null, gi = 0, ya = !1, fs = 0, Ae = null, va = !1, ps = null, Yr = null, wa = !1, bi = null, yi = 90, mo = null, vi = 0, hs = null, ka = 0;
        function nr() {
          return (48 & Qe) != 0 ? 1073741821 - (jn() / 10 | 0) : ka !== 0 ? ka : ka = 1073741821 - (jn() / 10 | 0);
        }
        function go(e, t, n) {
          if ((2 & (t = t.mode)) == 0) return 1073741823;
          var o = Ki();
          if ((4 & t) == 0) return o === 99 ? 1073741823 : 1073741822;
          if ((16 & Qe) != 0) return mn;
          if (n !== null) e = Qi(e, 0 | n.timeoutMs || 5e3, 250);
          else switch (o) {
            case 99:
              e = 1073741823;
              break;
            case 98:
              e = Qi(e, 150, 100);
              break;
            case 97:
            case 96:
              e = Qi(e, 5e3, 250);
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
          if (50 < vi) throw vi = 0, hs = null, Error(m(185));
          if ((e = Ea(e, t)) !== null) {
            var n = Ki();
            t === 1073741823 ? (8 & Qe) != 0 && (48 & Qe) == 0 ? ms(e) : (xn(e), Qe === 0 && Jn()) : xn(e), (4 & Qe) == 0 || n !== 98 && n !== 99 || (mo === null ? mo = /* @__PURE__ */ new Map([[e, t]]) : ((n = mo.get(e)) === void 0 || n > t) && mo.set(e, t));
          }
        }
        function Ea(e, t) {
          e.expirationTime < t && (e.expirationTime = t);
          var n = e.alternate;
          n !== null && n.expirationTime < t && (n.expirationTime = t);
          var o = e.return, a = null;
          if (o === null && e.tag === 3) a = e.stateNode;
          else for (; o !== null; ) {
            if (n = o.alternate, o.childExpirationTime < t && (o.childExpirationTime = t), n !== null && n.childExpirationTime < t && (n.childExpirationTime = t), o.return === null && o.tag === 3) {
              a = o.stateNode;
              break;
            }
            o = o.return;
          }
          return a !== null && (_n === a && (xa(t), Ft === ma && ko(a, mn)), ql(a, t)), a;
        }
        function _a(e) {
          var t = e.lastExpiredTime;
          if (t !== 0 || !$l(e, t = e.firstPendingTime)) return t;
          var n = e.lastPingedTime;
          return 2 >= (e = n > (e = e.nextKnownPendingLevel) ? n : e) && t !== e ? 0 : e;
        }
        function xn(e) {
          if (e.lastExpiredTime !== 0) e.callbackExpirationTime = 1073741823, e.callbackPriority = 99, e.callbackNode = Hs(ms.bind(null, e));
          else {
            var t = _a(e), n = e.callbackNode;
            if (t === 0) n !== null && (e.callbackNode = null, e.callbackExpirationTime = 0, e.callbackPriority = 90);
            else {
              var o = nr();
              if (t === 1073741823 ? o = 99 : t === 1 || t === 2 ? o = 95 : o = 0 >= (o = 10 * (1073741821 - t) - 10 * (1073741821 - o)) ? 99 : 250 >= o ? 98 : 5250 >= o ? 97 : 95, n !== null) {
                var a = e.callbackPriority;
                if (e.callbackExpirationTime === t && a >= o) return;
                n !== Us && Is(n);
              }
              e.callbackExpirationTime = t, e.callbackPriority = o, t = t === 1073741823 ? Hs(ms.bind(null, e)) : Bs(o, jl.bind(null, e), { timeout: 10 * (1073741821 - t) - jn() }), e.callbackNode = t;
            }
          }
        }
        function jl(e, t) {
          if (ka = 0, t) return Es(e, t = nr()), xn(e), null;
          var n = _a(e);
          if (n !== 0) {
            if (t = e.callbackNode, (48 & Qe) != 0) throw Error(m(327));
            if ($o(), e === _n && n === mn || bo(e, n), Ge !== null) {
              var o = Qe;
              Qe |= 16;
              for (var a = Fl(); ; ) try {
                Rc();
                break;
              } catch (T) {
                Ul(e, T);
              }
              if (Fa(), Qe = o, pa.current = a, Ft === 1) throw t = ga, bo(e, n), ko(e, n), xn(e), t;
              if (Ge === null) switch (a = e.finishedWork = e.current.alternate, e.finishedExpirationTime = n, o = Ft, _n = null, o) {
                case ho:
                case 1:
                  throw Error(m(345));
                case 2:
                  Es(e, 2 < n ? 2 : n);
                  break;
                case ha:
                  if (ko(e, n), n === (o = e.lastSuspendedTime) && (e.nextKnownPendingLevel = gs(a)), wr === 1073741823 && 10 < (a = fs + 500 - jn())) {
                    if (ya) {
                      var h = e.lastPingedTime;
                      if (h === 0 || h >= n) {
                        e.lastPingedTime = n, bo(e, n);
                        break;
                      }
                    }
                    if ((h = _a(e)) !== 0 && h !== n) break;
                    if (o !== 0 && o !== n) {
                      e.lastPingedTime = o;
                      break;
                    }
                    e.timeoutHandle = oi(yo.bind(null, e), a);
                    break;
                  }
                  yo(e);
                  break;
                case ma:
                  if (ko(e, n), n === (o = e.lastSuspendedTime) && (e.nextKnownPendingLevel = gs(a)), ya && ((a = e.lastPingedTime) === 0 || a >= n)) {
                    e.lastPingedTime = n, bo(e, n);
                    break;
                  }
                  if ((a = _a(e)) !== 0 && a !== n) break;
                  if (o !== 0 && o !== n) {
                    e.lastPingedTime = o;
                    break;
                  }
                  if (mi !== 1073741823 ? o = 10 * (1073741821 - mi) - jn() : wr === 1073741823 ? o = 0 : (o = 10 * (1073741821 - wr) - 5e3, 0 > (o = (a = jn()) - o) && (o = 0), (n = 10 * (1073741821 - n) - a) < (o = (120 > o ? 120 : 480 > o ? 480 : 1080 > o ? 1080 : 1920 > o ? 1920 : 3e3 > o ? 3e3 : 4320 > o ? 4320 : 1960 * Nc(o / 1960)) - o) && (o = n)), 10 < o) {
                    e.timeoutHandle = oi(yo.bind(null, e), o);
                    break;
                  }
                  yo(e);
                  break;
                case 5:
                  if (wr !== 1073741823 && ba !== null) {
                    h = wr;
                    var w = ba;
                    if (0 >= (o = 0 | w.busyMinDurationMs) ? o = 0 : (a = 0 | w.busyDelayMs, o = (h = jn() - (10 * (1073741821 - h) - (0 | w.timeoutMs || 5e3))) <= a ? 0 : a + o - h), 10 < o) {
                      ko(e, n), e.timeoutHandle = oi(yo.bind(null, e), o);
                      break;
                    }
                  }
                  yo(e);
                  break;
                default:
                  throw Error(m(329));
              }
              if (xn(e), e.callbackNode === t) return jl.bind(null, e);
            }
          }
          return null;
        }
        function ms(e) {
          var t = e.lastExpiredTime;
          if (t = t !== 0 ? t : 1073741823, (48 & Qe) != 0) throw Error(m(327));
          if ($o(), e === _n && t === mn || bo(e, t), Ge !== null) {
            var n = Qe;
            Qe |= 16;
            for (var o = Fl(); ; ) try {
              Dc();
              break;
            } catch (a) {
              Ul(e, a);
            }
            if (Fa(), Qe = n, pa.current = o, Ft === 1) throw n = ga, bo(e, t), ko(e, t), xn(e), n;
            if (Ge !== null) throw Error(m(261));
            e.finishedWork = e.current.alternate, e.finishedExpirationTime = t, _n = null, yo(e), xn(e);
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
        function bo(e, t) {
          e.finishedWork = null, e.finishedExpirationTime = 0;
          var n = e.timeoutHandle;
          if (n !== -1 && (e.timeoutHandle = -1, ji(n)), Ge !== null) for (n = Ge.return; n !== null; ) {
            var o = n;
            switch (o.tag) {
              case 1:
                (o = o.type.childContextTypes) != null && Wi();
                break;
              case 3:
                Bo(), vt(pn), vt(Xt);
                break;
              case 5:
                Ya(o);
                break;
              case 4:
                Bo();
                break;
              case 13:
              case 19:
                vt(Ct);
                break;
              case 10:
                Va(o);
            }
            n = n.return;
          }
          _n = e, Ge = wo(e.current, null), mn = t, Ft = ho, ga = null, mi = wr = 1073741823, ba = null, gi = 0, ya = !1;
        }
        function Ul(e, t) {
          for (; ; ) {
            try {
              if (Fa(), oa.current = ua, ia) for (var n = Lt.memoizedState; n !== null; ) {
                var o = n.queue;
                o !== null && (o.pending = null), n = n.next;
              }
              if ($r = 0, Zt = sn = Lt = null, ia = !1, Ge === null || Ge.return === null) return Ft = 1, ga = t, Ge = null;
              e: {
                var a = e, h = Ge.return, w = Ge, T = t;
                if (t = mn, w.effectTag |= 2048, w.firstEffect = w.lastEffect = null, T !== null && typeof T == "object" && typeof T.then == "function") {
                  var Z = T;
                  if ((2 & w.mode) == 0) {
                    var Y = w.alternate;
                    Y ? (w.updateQueue = Y.updateQueue, w.memoizedState = Y.memoizedState, w.expirationTime = Y.expirationTime) : (w.updateQueue = null, w.memoizedState = null);
                  }
                  var ge = (1 & Ct.current) != 0, De = h;
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
                        var oe = /* @__PURE__ */ new Set();
                        oe.add(Z), De.updateQueue = oe;
                      } else ln.add(Z);
                      if ((2 & De.mode) == 0) {
                        if (De.effectTag |= 64, w.effectTag &= -2981, w.tag === 1) if (w.alternate === null) w.tag = 17;
                        else {
                          var te = Hr(1073741823, null);
                          te.tag = 2, Wr(w, te);
                        }
                        w.expirationTime = 1073741823;
                        break e;
                      }
                      T = void 0, w = t;
                      var ue = a.pingCache;
                      if (ue === null ? (ue = a.pingCache = new Pc(), T = /* @__PURE__ */ new Set(), ue.set(Z, T)) : (T = ue.get(Z)) === void 0 && (T = /* @__PURE__ */ new Set(), ue.set(Z, T)), !T.has(w)) {
                        T.add(w);
                        var ve = jc.bind(null, a, Z, w);
                        Z.then(ve, ve);
                      }
                      De.effectTag |= 4096, De.expirationTime = t;
                      break e;
                    }
                    De = De.return;
                  } while (De !== null);
                  T = Error((qt(w.type) || "A React component") + ` suspended while rendering, but no fallback UI was specified.

Add a <Suspense fallback=...> component higher in the tree to provide a loading indicator or placeholder to display.` + xr(w));
                }
                Ft !== 5 && (Ft = 2), T = cs(T, w), De = h;
                do {
                  switch (De.tag) {
                    case 3:
                      Z = T, De.effectTag |= 4096, De.expirationTime = t, qs(De, Rl(De, Z, t));
                      break e;
                    case 1:
                      Z = T;
                      var _e = De.type, Oe = De.stateNode;
                      if ((64 & De.effectTag) == 0 && (typeof _e.getDerivedStateFromError == "function" || Oe !== null && typeof Oe.componentDidCatch == "function" && (Yr === null || !Yr.has(Oe)))) {
                        De.effectTag |= 4096, De.expirationTime = t, qs(De, Il(De, Z, t));
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
          var e = pa.current;
          return pa.current = ua, e === null ? ua : e;
        }
        function Vl(e, t) {
          e < wr && 2 < e && (wr = e), t !== null && e < mi && 2 < e && (mi = e, ba = t);
        }
        function xa(e) {
          e > gi && (gi = e);
        }
        function Dc() {
          for (; Ge !== null; ) Ge = Bl(Ge);
        }
        function Rc() {
          for (; Ge !== null && !yc(); ) Ge = Bl(Ge);
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
              if (t = xc(t, Ge, mn), mn === 1 || Ge.childExpirationTime !== 1) {
                for (var n = 0, o = Ge.child; o !== null; ) {
                  var a = o.expirationTime, h = o.childExpirationTime;
                  a > n && (n = a), h > n && (n = h), o = o.sibling;
                }
                Ge.childExpirationTime = n;
              }
              if (t !== null) return t;
              e !== null && (2048 & e.effectTag) == 0 && (e.firstEffect === null && (e.firstEffect = Ge.firstEffect), Ge.lastEffect !== null && (e.lastEffect !== null && (e.lastEffect.nextEffect = Ge.firstEffect), e.lastEffect = Ge.lastEffect), 1 < Ge.effectTag && (e.lastEffect !== null ? e.lastEffect.nextEffect = Ge : e.firstEffect = Ge, e.lastEffect = Ge));
            } else {
              if ((t = Sc(Ge)) !== null) return t.effectTag &= 2047, t;
              e !== null && (e.firstEffect = e.lastEffect = null, e.effectTag |= 2048);
            }
            if ((t = Ge.sibling) !== null) return t;
            Ge = e;
          } while (Ge !== null);
          return Ft === ho && (Ft = 5), null;
        }
        function gs(e) {
          var t = e.expirationTime;
          return t > (e = e.childExpirationTime) ? t : e;
        }
        function yo(e) {
          var t = Ki();
          return Vr(99, Ic.bind(null, e, t)), null;
        }
        function Ic(e, t) {
          do
            $o();
          while (bi !== null);
          if ((48 & Qe) != 0) throw Error(m(327));
          var n = e.finishedWork, o = e.finishedExpirationTime;
          if (n === null) return null;
          if (e.finishedWork = null, e.finishedExpirationTime = 0, n === e.current) throw Error(m(177));
          e.callbackNode = null, e.callbackExpirationTime = 0, e.callbackPriority = 90, e.nextKnownPendingLevel = 0;
          var a = gs(n);
          if (e.firstPendingTime = a, o <= e.lastSuspendedTime ? e.firstSuspendedTime = e.lastSuspendedTime = e.nextKnownPendingLevel = 0 : o <= e.firstSuspendedTime && (e.firstSuspendedTime = o - 1), o <= e.lastPingedTime && (e.lastPingedTime = 0), o <= e.lastExpiredTime && (e.lastExpiredTime = 0), e === _n && (Ge = _n = null, mn = 0), 1 < n.effectTag ? n.lastEffect !== null ? (n.lastEffect.nextEffect = n, a = n.firstEffect) : a = n : a = n.firstEffect, a !== null) {
            var h = Qe;
            Qe |= 32, Ml.current = null, ti = To;
            var w = Ai();
            if (ei(w)) {
              if ("selectionStart" in w) var T = { start: w.selectionStart, end: w.selectionEnd };
              else e: {
                var Z = (T = (T = w.ownerDocument) && T.defaultView || window).getSelection && T.getSelection();
                if (Z && Z.rangeCount !== 0) {
                  T = Z.anchorNode;
                  var Y = Z.anchorOffset, ge = Z.focusNode;
                  Z = Z.focusOffset;
                  try {
                    T.nodeType, ge.nodeType;
                  } catch {
                    T = null;
                    break e;
                  }
                  var De = 0, He = -1, ot = -1, Fn = 0, ln = 0, oe = w, te = null;
                  t: for (; ; ) {
                    for (var ue; oe !== T || Y !== 0 && oe.nodeType !== 3 || (He = De + Y), oe !== ge || Z !== 0 && oe.nodeType !== 3 || (ot = De + Z), oe.nodeType === 3 && (De += oe.nodeValue.length), (ue = oe.firstChild) !== null; ) te = oe, oe = ue;
                    for (; ; ) {
                      if (oe === w) break t;
                      if (te === T && ++Fn === Y && (He = De), te === ge && ++ln === Z && (ot = De), (ue = oe.nextSibling) !== null) break;
                      te = (oe = te).parentNode;
                    }
                    oe = ue;
                  }
                  T = He === -1 || ot === -1 ? null : { start: He, end: ot };
                } else T = null;
              }
              T = T || { start: 0, end: 0 };
            } else T = null;
            ni = { activeElementDetached: null, focusedElem: w, selectionRange: T }, To = !1, Ae = a;
            do
              try {
                Ac();
              } catch (Ze) {
                if (Ae === null) throw Error(m(330));
                vo(Ae, Ze), Ae = Ae.nextEffect;
              }
            while (Ae !== null);
            Ae = a;
            do
              try {
                for (w = e, T = t; Ae !== null; ) {
                  var ve = Ae.effectTag;
                  if (16 & ve && st(Ae.stateNode, ""), 128 & ve) {
                    var _e = Ae.alternate;
                    if (_e !== null) {
                      var Oe = _e.ref;
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
                      Nl(w, Y = Ae, T), Tl(Y);
                  }
                  Ae = Ae.nextEffect;
                }
              } catch (Ze) {
                if (Ae === null) throw Error(m(330));
                vo(Ae, Ze), Ae = Ae.nextEffect;
              }
            while (Ae !== null);
            if (Oe = ni, _e = Ai(), ve = Oe.focusedElem, T = Oe.selectionRange, _e !== ve && ve && ve.ownerDocument && function Ze(Vt, kr) {
              return !(!Vt || !kr) && (Vt === kr || (!Vt || Vt.nodeType !== 3) && (kr && kr.nodeType === 3 ? Ze(Vt, kr.parentNode) : "contains" in Vt ? Vt.contains(kr) : !!Vt.compareDocumentPosition && !!(16 & Vt.compareDocumentPosition(kr))));
            }(ve.ownerDocument.documentElement, ve)) {
              for (T !== null && ei(ve) && (_e = T.start, (Oe = T.end) === void 0 && (Oe = _e), "selectionStart" in ve ? (ve.selectionStart = _e, ve.selectionEnd = Math.min(Oe, ve.value.length)) : (Oe = (_e = ve.ownerDocument || document) && _e.defaultView || window).getSelection && (Oe = Oe.getSelection(), Y = ve.textContent.length, w = Math.min(T.start, Y), T = T.end === void 0 ? w : Math.min(T.end, Y), !Oe.extend && w > T && (Y = T, T = w, w = Y), Y = Ii(ve, w), ge = Ii(ve, T), Y && ge && (Oe.rangeCount !== 1 || Oe.anchorNode !== Y.node || Oe.anchorOffset !== Y.offset || Oe.focusNode !== ge.node || Oe.focusOffset !== ge.offset) && ((_e = _e.createRange()).setStart(Y.node, Y.offset), Oe.removeAllRanges(), w > T ? (Oe.addRange(_e), Oe.extend(ge.node, ge.offset)) : (_e.setEnd(ge.node, ge.offset), Oe.addRange(_e))))), _e = [], Oe = ve; Oe = Oe.parentNode; ) Oe.nodeType === 1 && _e.push({ element: Oe, left: Oe.scrollLeft, top: Oe.scrollTop });
              for (typeof ve.focus == "function" && ve.focus(), ve = 0; ve < _e.length; ve++) (Oe = _e[ve]).element.scrollLeft = Oe.left, Oe.element.scrollTop = Oe.top;
            }
            To = !!ti, ni = ti = null, e.current = n, Ae = a;
            do
              try {
                for (ve = e; Ae !== null; ) {
                  var Ve = Ae.effectTag;
                  if (36 & Ve && Oc(ve, Ae.alternate, Ae), 128 & Ve) {
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
                vo(Ae, Ze), Ae = Ae.nextEffect;
              }
            while (Ae !== null);
            Ae = null, vc(), Qe = h;
          } else e.current = n;
          if (wa) wa = !1, bi = e, yi = t;
          else for (Ae = a; Ae !== null; ) t = Ae.nextEffect, Ae.nextEffect = null, Ae = t;
          if ((t = e.firstPendingTime) === 0 && (Yr = null), t === 1073741823 ? e === hs ? vi++ : (vi = 0, hs = e) : vi = 0, typeof bs == "function" && bs(n.stateNode, o), xn(e), va) throw va = !1, e = ps, ps = null, e;
          return (8 & Qe) != 0 || Jn(), null;
        }
        function Ac() {
          for (; Ae !== null; ) {
            var e = Ae.effectTag;
            (256 & e) != 0 && Tc(Ae.alternate, Ae), (512 & e) == 0 || wa || (wa = !0, Bs(97, function() {
              return $o(), null;
            })), Ae = Ae.nextEffect;
          }
        }
        function $o() {
          if (yi !== 90) {
            var e = 97 < yi ? 97 : yi;
            return yi = 90, Vr(e, Mc);
          }
        }
        function Mc() {
          if (bi === null) return !1;
          var e = bi;
          if (bi = null, (48 & Qe) != 0) throw Error(m(331));
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
            } catch (o) {
              if (e === null) throw Error(m(330));
              vo(e, o);
            }
            n = e.nextEffect, e.nextEffect = null, e = n;
          }
          return Qe = t, Jn(), !0;
        }
        function Wl(e, t, n) {
          Wr(e, t = Rl(e, t = cs(n, t), 1073741823)), (e = Ea(e, 1073741823)) !== null && xn(e);
        }
        function vo(e, t) {
          if (e.tag === 3) Wl(e, e, t);
          else for (var n = e.return; n !== null; ) {
            if (n.tag === 3) {
              Wl(n, e, t);
              break;
            }
            if (n.tag === 1) {
              var o = n.stateNode;
              if (typeof n.type.getDerivedStateFromError == "function" || typeof o.componentDidCatch == "function" && (Yr === null || !Yr.has(o))) {
                Wr(n, e = Il(n, e = cs(t, e), 1073741823)), (n = Ea(n, 1073741823)) !== null && xn(n);
                break;
              }
            }
            n = n.return;
          }
        }
        function jc(e, t, n) {
          var o = e.pingCache;
          o !== null && o.delete(t), _n === e && mn === n ? Ft === ma || Ft === ha && wr === 1073741823 && jn() - fs < 500 ? bo(e, mn) : ya = !0 : $l(e, n) && ((t = e.lastPingedTime) !== 0 && t < n || (e.lastPingedTime = n, xn(e)));
        }
        function zc(e, t) {
          var n = e.stateNode;
          n !== null && n.delete(t), (t = 0) == 0 && (t = go(t = nr(), e, null)), (e = Ea(e, t)) !== null && xn(e);
        }
        Al = function(e, t, n) {
          var o = t.expirationTime;
          if (e !== null) {
            var a = t.pendingProps;
            if (e.memoizedProps !== a || pn.current) tr = !0;
            else {
              if (o < n) {
                switch (tr = !1, t.tag) {
                  case 3:
                    gl(t), os();
                    break;
                  case 5:
                    if (Js(t), 4 & t.mode && n !== 1 && a.hidden) return t.expirationTime = t.childExpirationTime = 1, null;
                    break;
                  case 1:
                    hn(t.type) && $i(t);
                    break;
                  case 4:
                    qa(t, t.stateNode.containerInfo);
                    break;
                  case 10:
                    o = t.memoizedProps.value, a = t.type._context, St(Gi, a._currentValue), a._currentValue = o;
                    break;
                  case 13:
                    if (t.memoizedState !== null) return (o = t.child.childExpirationTime) !== 0 && o >= n ? wl(e, t, n) : (St(Ct, 1 & Ct.current), (t = vr(e, t, n)) !== null ? t.sibling : null);
                    St(Ct, 1 & Ct.current);
                    break;
                  case 19:
                    if (o = t.childExpirationTime >= n, (64 & e.effectTag) != 0) {
                      if (o) return El(e, t, n);
                      t.effectTag |= 64;
                    }
                    if ((a = t.memoizedState) !== null && (a.rendering = null, a.tail = null), St(Ct, Ct.current), !o) return null;
                }
                return vr(e, t, n);
              }
              tr = !1;
            }
          } else tr = !1;
          switch (t.expirationTime = 0, t.tag) {
            case 2:
              if (o = t.type, e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= 2), e = t.pendingProps, a = Lo(t, Xt.current), Fo(t, n), a = Ga(null, t, o, e, a, n), t.effectTag |= 1, typeof a == "object" && a !== null && typeof a.render == "function" && a.$$typeof === void 0) {
                if (t.tag = 1, t.memoizedState = null, t.updateQueue = null, hn(o)) {
                  var h = !0;
                  $i(t);
                } else h = !1;
                t.memoizedState = a.state !== null && a.state !== void 0 ? a.state : null, Ba(t);
                var w = o.getDerivedStateFromProps;
                typeof w == "function" && Ji(t, o, w, e), a.updater = ea, t.stateNode = a, a._reactInternalFiber = t, Wa(t, o, e, n), t = as(null, t, o, !0, h, n);
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
                switch (a = a._result, t.type = a, h = t.tag = function(ge) {
                  if (typeof ge == "function") return vs(ge) ? 1 : 0;
                  if (ge != null) {
                    if ((ge = ge.$$typeof) === Tt) return 11;
                    if (ge === Sn) return 14;
                  }
                  return 2;
                }(a), e = $n(a, e), h) {
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
                    t = fl(null, t, a, $n(a.type, e), o, n);
                    break e;
                }
                throw Error(m(306, a, ""));
              }
              return t;
            case 0:
              return o = t.type, a = t.pendingProps, is(e, t, o, a = t.elementType === o ? a : $n(o, a), n);
            case 1:
              return o = t.type, a = t.pendingProps, ml(e, t, o, a = t.elementType === o ? a : $n(o, a), n);
            case 3:
              if (gl(t), o = t.updateQueue, e === null || o === null) throw Error(m(282));
              if (o = t.pendingProps, a = (a = t.memoizedState) !== null ? a.element : null, Ha(e, t), ci(t, o, null, n), (o = t.memoizedState.element) === a) os(), t = vr(e, t, n);
              else {
                if ((a = t.stateNode.hydrate) && (qr = Ar(t.stateNode.containerInfo.firstChild), yr = t, a = po = !0), a) for (n = $a(t, null, o, n), t.child = n; n; ) n.effectTag = -3 & n.effectTag | 1024, n = n.sibling;
                else Un(e, t, o, n), os();
                t = t.child;
              }
              return t;
            case 5:
              return Js(t), e === null && rs(t), o = t.type, a = t.pendingProps, h = e !== null ? e.memoizedProps : null, w = a.children, ri(o, a) ? w = null : h !== null && ri(o, h) && (t.effectTag |= 16), hl(e, t), 4 & t.mode && n !== 1 && a.hidden ? (t.expirationTime = t.childExpirationTime = 1, t = null) : (Un(e, t, w, n), t = t.child), t;
            case 6:
              return e === null && rs(t), null;
            case 13:
              return wl(e, t, n);
            case 4:
              return qa(t, t.stateNode.containerInfo), o = t.pendingProps, e === null ? t.child = Vo(t, null, o, n) : Un(e, t, o, n), t.child;
            case 11:
              return o = t.type, a = t.pendingProps, dl(e, t, o, a = t.elementType === o ? a : $n(o, a), n);
            case 7:
              return Un(e, t, t.pendingProps, n), t.child;
            case 8:
            case 12:
              return Un(e, t, t.pendingProps.children, n), t.child;
            case 10:
              e: {
                o = t.type._context, a = t.pendingProps, w = t.memoizedProps, h = a.value;
                var T = t.type._context;
                if (St(Gi, T._currentValue), T._currentValue = h, w !== null) if (T = w.value, (h = mr(T, h) ? 0 : 0 | (typeof o._calculateChangedBits == "function" ? o._calculateChangedBits(T, h) : 1073741823)) === 0) {
                  if (w.children === a.children && !pn.current) {
                    t = vr(e, t, n);
                    break e;
                  }
                } else for ((T = t.child) !== null && (T.return = t); T !== null; ) {
                  var Z = T.dependencies;
                  if (Z !== null) {
                    w = T.child;
                    for (var Y = Z.firstContext; Y !== null; ) {
                      if (Y.context === o && (Y.observedBits & h) != 0) {
                        T.tag === 1 && ((Y = Hr(n, null)).tag = 2, Wr(T, Y)), T.expirationTime < n && (T.expirationTime = n), (Y = T.alternate) !== null && Y.expirationTime < n && (Y.expirationTime = n), $s(T.return, n), Z.expirationTime < n && (Z.expirationTime = n);
                        break;
                      }
                      Y = Y.next;
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
              return a = t.type, o = (h = t.pendingProps).children, Fo(t, n), o = o(a = zn(a, h.unstable_observedBits)), t.effectTag |= 1, Un(e, t, o, n), t.child;
            case 14:
              return h = $n(a = t.type, t.pendingProps), fl(e, t, a, h = $n(a.type, h), o, n);
            case 15:
              return pl(e, t, t.type, t.pendingProps, o, n);
            case 17:
              return o = t.type, a = t.pendingProps, a = t.elementType === o ? a : $n(o, a), e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= 2), t.tag = 1, hn(o) ? (e = !0, $i(t)) : e = !1, Fo(t, n), Gs(t, o, a), Wa(t, o, a, n), as(null, t, o, !0, e, n);
            case 19:
              return El(e, t, n);
          }
          throw Error(m(156, t.tag));
        };
        var bs = null, ys = null;
        function Lc(e, t, n, o) {
          this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = o, this.effectTag = 0, this.lastEffect = this.firstEffect = this.nextEffect = null, this.childExpirationTime = this.expirationTime = 0, this.alternate = null;
        }
        function rr(e, t, n, o) {
          return new Lc(e, t, n, o);
        }
        function vs(e) {
          return !(!(e = e.prototype) || !e.isReactComponent);
        }
        function wo(e, t) {
          var n = e.alternate;
          return n === null ? ((n = rr(e.tag, t, e.key, e.mode)).elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.effectTag = 0, n.nextEffect = null, n.firstEffect = null, n.lastEffect = null), n.childExpirationTime = e.childExpirationTime, n.expirationTime = e.expirationTime, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : { expirationTime: t.expirationTime, firstContext: t.firstContext, responders: t.responders }, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n;
        }
        function Sa(e, t, n, o, a, h) {
          var w = 2;
          if (o = e, typeof e == "function") vs(e) && (w = 1);
          else if (typeof e == "string") w = 5;
          else e: switch (e) {
            case wt:
              return Qr(n.children, a, h, t);
            case Er:
              w = 8, a |= 7;
              break;
            case Jt:
              w = 8, a |= 1;
              break;
            case kt:
              return (e = rr(12, n, t, 8 | a)).elementType = kt, e.type = kt, e.expirationTime = h, e;
            case pt:
              return (e = rr(13, n, t, a)).type = pt, e.elementType = pt, e.expirationTime = h, e;
            case qn:
              return (e = rr(19, n, t, a)).elementType = qn, e.expirationTime = h, e;
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
                  w = 16, o = null;
                  break e;
                case _r:
                  w = 22;
                  break e;
              }
              throw Error(m(130, e == null ? e : typeof e, ""));
          }
          return (t = rr(w, n, t, a)).elementType = e, t.type = o, t.expirationTime = h, t;
        }
        function Qr(e, t, n, o) {
          return (e = rr(7, e, o, t)).expirationTime = n, e;
        }
        function ws(e, t, n) {
          return (e = rr(6, e, null, t)).expirationTime = n, e;
        }
        function ks(e, t, n) {
          return (t = rr(4, e.children !== null ? e.children : [], e.key, t)).expirationTime = n, t.stateNode = { containerInfo: e.containerInfo, pendingChildren: null, implementation: e.implementation }, t;
        }
        function Uc(e, t, n) {
          this.tag = t, this.current = null, this.containerInfo = e, this.pingCache = this.pendingChildren = null, this.finishedExpirationTime = 0, this.finishedWork = null, this.timeoutHandle = -1, this.pendingContext = this.context = null, this.hydrate = n, this.callbackNode = null, this.callbackPriority = 90, this.lastExpiredTime = this.lastPingedTime = this.nextKnownPendingLevel = this.lastSuspendedTime = this.firstSuspendedTime = this.firstPendingTime = 0;
        }
        function $l(e, t) {
          var n = e.firstSuspendedTime;
          return e = e.lastSuspendedTime, n !== 0 && n >= t && e <= t;
        }
        function ko(e, t) {
          var n = e.firstSuspendedTime, o = e.lastSuspendedTime;
          n < t && (e.firstSuspendedTime = t), (o > t || n === 0) && (e.lastSuspendedTime = t), t <= e.lastPingedTime && (e.lastPingedTime = 0), t <= e.lastExpiredTime && (e.lastExpiredTime = 0);
        }
        function ql(e, t) {
          t > e.firstPendingTime && (e.firstPendingTime = t);
          var n = e.firstSuspendedTime;
          n !== 0 && (t >= n ? e.firstSuspendedTime = e.lastSuspendedTime = e.nextKnownPendingLevel = 0 : t >= e.lastSuspendedTime && (e.lastSuspendedTime = t + 1), t > e.nextKnownPendingLevel && (e.nextKnownPendingLevel = t));
        }
        function Es(e, t) {
          var n = e.lastExpiredTime;
          (n === 0 || n > t) && (e.lastExpiredTime = t);
        }
        function Ca(e, t, n, o) {
          var a = t.current, h = nr(), w = ui.suspense;
          h = go(h, a, w);
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
          return t.context === null ? t.context = n : t.pendingContext = n, (t = Hr(h, w)).payload = { element: e }, (o = o === void 0 ? null : o) !== null && (t.callback = o), Wr(a, t), Kr(a, h), h;
        }
        function _s(e) {
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
        function xs(e, t) {
          Yl(e, t), (e = e.alternate) && Yl(e, t);
        }
        function Ss(e, t, n) {
          var o = new Uc(e, t, n = n != null && n.hydrate === !0), a = rr(3, null, null, t === 2 ? 7 : t === 1 ? 3 : 0);
          o.current = a, a.stateNode = o, Ba(a), e[oo] = o.current, n && t !== 0 && function(h, w) {
            var T = un(w);
            Bn.forEach(function(Z) {
              yt(Z, w, T);
            }), Nt.forEach(function(Z) {
              yt(Z, w, T);
            });
          }(0, e.nodeType === 9 ? e : e.ownerDocument), this._internalRoot = o;
        }
        function wi(e) {
          return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11 && (e.nodeType !== 8 || e.nodeValue !== " react-mount-point-unstable "));
        }
        function Ta(e, t, n, o, a) {
          var h = n._reactRootContainer;
          if (h) {
            var w = h._internalRoot;
            if (typeof a == "function") {
              var T = a;
              a = function() {
                var Y = _s(w);
                T.call(Y);
              };
            }
            Ca(t, w, e, a);
          } else {
            if (h = n._reactRootContainer = function(Y, ge) {
              if (ge || (ge = !(!(ge = Y ? Y.nodeType === 9 ? Y.documentElement : Y.firstChild : null) || ge.nodeType !== 1 || !ge.hasAttribute("data-reactroot"))), !ge) for (var De; De = Y.lastChild; ) Y.removeChild(De);
              return new Ss(Y, 0, ge ? { hydrate: !0 } : void 0);
            }(n, o), w = h._internalRoot, typeof a == "function") {
              var Z = a;
              a = function() {
                var Y = _s(w);
                Z.call(Y);
              };
            }
            Ll(function() {
              Ca(t, w, e, a);
            });
          }
          return _s(w);
        }
        function Fc(e, t, n) {
          var o = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
          return { $$typeof: It, key: o == null ? null : "" + o, children: e, containerInfo: t, implementation: n };
        }
        function Kl(e, t) {
          var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
          if (!wi(t)) throw Error(m(200));
          return Fc(e, t, null, n);
        }
        Ss.prototype.render = function(e) {
          Ca(e, this._internalRoot, null, null);
        }, Ss.prototype.unmount = function() {
          var e = this._internalRoot, t = e.containerInfo;
          Ca(null, e, null, function() {
            t[oo] = null;
          });
        }, Et = function(e) {
          if (e.tag === 13) {
            var t = Qi(nr(), 150, 100);
            Kr(e, t), xs(e, t);
          }
        }, ur = function(e) {
          e.tag === 13 && (Kr(e, 3), xs(e, 3));
        }, dr = function(e) {
          if (e.tag === 13) {
            var t = nr();
            Kr(e, t = go(t, e, null)), xs(e, t);
          }
        }, ce = function(e, t, n) {
          switch (t) {
            case "input":
              if (ir(e, n), t = n.name, n.type === "radio" && t != null) {
                for (n = e; n.parentNode; ) n = n.parentNode;
                for (n = n.querySelectorAll("input[name=" + JSON.stringify("" + t) + '][type="radio"]'), t = 0; t < n.length; t++) {
                  var o = n[t];
                  if (o !== e && o.form === e.form) {
                    var a = ii(o);
                    if (!a) throw Error(m(90));
                    ut(o), ir(o, a);
                  }
                }
              }
              break;
            case "textarea":
              Xr(e, n);
              break;
            case "select":
              (t = n.value) != null && Tn(e, !!n.multiple, t, !1);
          }
        }, be = zl, Te = function(e, t, n, o, a) {
          var h = Qe;
          Qe |= 4;
          try {
            return Vr(98, e.bind(null, t, n, o, a));
          } finally {
            (Qe = h) === 0 && Jn();
          }
        }, ke = function() {
          (49 & Qe) == 0 && (function() {
            if (mo !== null) {
              var e = mo;
              mo = null, e.forEach(function(t, n) {
                Es(n, t), xn(n);
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
        var Ql, Cs, Vc = { Events: [io, Gn, ii, le, z, jr, function(e) {
          Yn(e, Ma);
        }, R, ie, Oo, At, $o, { current: !1 }] };
        Cs = (Ql = { findFiberByHostInstance: Mr, bundleType: 0, version: "16.14.0", rendererPackageName: "react-dom" }).findFiberByHostInstance, function(e) {
          if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u") return !1;
          var t = __REACT_DEVTOOLS_GLOBAL_HOOK__;
          if (t.isDisabled || !t.supportsFiber) return !0;
          try {
            var n = t.inject(e);
            bs = function(o) {
              try {
                t.onCommitFiberRoot(n, o, void 0, (64 & o.current.effectTag) == 64);
              } catch {
              }
            }, ys = function(o) {
              try {
                t.onCommitFiberUnmount(n, o);
              } catch {
              }
            };
          } catch {
          }
        }(r({}, Ql, { overrideHookState: null, overrideProps: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: he.ReactCurrentDispatcher, findHostInstanceByFiber: function(e) {
          return (e = rt(e)) === null ? null : e.stateNode;
        }, findFiberByHostInstance: function(e) {
          return Cs ? Cs(e) : null;
        }, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null })), i.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Vc, i.createPortal = Kl, i.findDOMNode = function(e) {
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
            return Vr(99, e.bind(null, t));
          } finally {
            Qe = n, Jn();
          }
        }, i.hydrate = function(e, t, n) {
          if (!wi(t)) throw Error(m(200));
          return Ta(null, e, t, !0, n);
        }, i.render = function(e, t, n) {
          if (!wi(t)) throw Error(m(200));
          return Ta(null, e, t, !1, n);
        }, i.unmountComponentAtNode = function(e) {
          if (!wi(e)) throw Error(m(40));
          return !!e._reactRootContainer && (Ll(function() {
            Ta(null, null, e, !1, function() {
              e._reactRootContainer = null, e[oo] = null;
            });
          }), !0);
        }, i.unstable_batchedUpdates = zl, i.unstable_createPortal = function(e, t) {
          return Kl(e, t, 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null);
        }, i.unstable_renderSubtreeIntoContainer = function(e, t, n, o) {
          if (!wi(n)) throw Error(m(200));
          if (e == null || e._reactInternalFiber === void 0) throw Error(m(38));
          return Ta(e, t, n, !1, o);
        }, i.version = "16.14.0";
      }, function(p, i, l) {
        p.exports = l(24);
      }, function(p, i, l) {
        var u, r, _, m, b;
        if (typeof window > "u" || typeof MessageChannel != "function") {
          var y = null, v = null, C = function() {
            if (y !== null) try {
              var q = i.unstable_now();
              y(!0, q), y = null;
            } catch (me) {
              throw setTimeout(C, 0), me;
            }
          }, x = Date.now();
          i.unstable_now = function() {
            return Date.now() - x;
          }, u = function(q) {
            y !== null ? setTimeout(u, 0, q) : (y = q, setTimeout(C, 0));
          }, r = function(q, me) {
            v = setTimeout(q, me);
          }, _ = function() {
            clearTimeout(v);
          }, m = function() {
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
          var M = !1, B = null, I = -1, J = 5, Q = 0;
          m = function() {
            return i.unstable_now() >= Q;
          }, b = function() {
          }, i.unstable_forceFrameRate = function(q) {
            0 > q || 125 < q ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing framerates higher than 125 fps is not unsupported") : J = 0 < q ? Math.floor(1e3 / q) : 5;
          };
          var z = new MessageChannel(), A = z.port2;
          z.port1.onmessage = function() {
            if (B !== null) {
              var q = i.unstable_now();
              Q = q + J;
              try {
                B(!0, q) ? A.postMessage(null) : (M = !1, B = null);
              } catch (me) {
                throw A.postMessage(null), me;
              }
            } else M = !1;
          }, u = function(q) {
            B = q, M || (M = !0, A.postMessage(null));
          }, r = function(q, me) {
            I = K(function() {
              q(i.unstable_now());
            }, me);
          }, _ = function() {
            j(I), I = -1;
          };
        }
        function ae(q, me) {
          var c = q.length;
          q.push(me);
          e: for (; ; ) {
            var f = c - 1 >>> 1, k = q[f];
            if (!(k !== void 0 && 0 < ce(k, me))) break e;
            q[f] = me, q[c] = k, c = f;
          }
        }
        function le(q) {
          return (q = q[0]) === void 0 ? null : q;
        }
        function ne(q) {
          var me = q[0];
          if (me !== void 0) {
            var c = q.pop();
            if (c !== me) {
              q[0] = c;
              e: for (var f = 0, k = q.length; f < k; ) {
                var U = 2 * (f + 1) - 1, F = q[U], H = U + 1, he = q[H];
                if (F !== void 0 && 0 > ce(F, c)) he !== void 0 && 0 > ce(he, F) ? (q[f] = he, q[H] = c, f = H) : (q[f] = F, q[U] = c, f = U);
                else {
                  if (!(he !== void 0 && 0 > ce(he, c))) break e;
                  q[f] = he, q[H] = c, f = H;
                }
              }
            }
            return me;
          }
          return null;
        }
        function ce(q, me) {
          var c = q.sortIndex - me.sortIndex;
          return c !== 0 ? c : q.id - me.id;
        }
        var ye = [], ee = [], de = 1, R = null, ie = 3, be = !1, Te = !1, ke = !1;
        function Pe(q) {
          for (var me = le(ee); me !== null; ) {
            if (me.callback === null) ne(ee);
            else {
              if (!(me.startTime <= q)) break;
              ne(ee), me.sortIndex = me.expirationTime, ae(ye, me);
            }
            me = le(ee);
          }
        }
        function Se(q) {
          if (ke = !1, Pe(q), !Te) if (le(ye) !== null) Te = !0, u(ze);
          else {
            var me = le(ee);
            me !== null && r(Se, me.startTime - q);
          }
        }
        function ze(q, me) {
          Te = !1, ke && (ke = !1, _()), be = !0;
          var c = ie;
          try {
            for (Pe(me), R = le(ye); R !== null && (!(R.expirationTime > me) || q && !m()); ) {
              var f = R.callback;
              if (f !== null) {
                R.callback = null, ie = R.priorityLevel;
                var k = f(R.expirationTime <= me);
                me = i.unstable_now(), typeof k == "function" ? R.callback = k : R === le(ye) && ne(ye), Pe(me);
              } else ne(ye);
              R = le(ye);
            }
            if (R !== null) var U = !0;
            else {
              var F = le(ee);
              F !== null && r(Se, F.startTime - me), U = !1;
            }
            return U;
          } finally {
            R = null, ie = c, be = !1;
          }
        }
        function Je(q) {
          switch (q) {
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
        i.unstable_IdlePriority = 5, i.unstable_ImmediatePriority = 1, i.unstable_LowPriority = 4, i.unstable_NormalPriority = 3, i.unstable_Profiling = null, i.unstable_UserBlockingPriority = 2, i.unstable_cancelCallback = function(q) {
          q.callback = null;
        }, i.unstable_continueExecution = function() {
          Te || be || (Te = !0, u(ze));
        }, i.unstable_getCurrentPriorityLevel = function() {
          return ie;
        }, i.unstable_getFirstCallbackNode = function() {
          return le(ye);
        }, i.unstable_next = function(q) {
          switch (ie) {
            case 1:
            case 2:
            case 3:
              var me = 3;
              break;
            default:
              me = ie;
          }
          var c = ie;
          ie = me;
          try {
            return q();
          } finally {
            ie = c;
          }
        }, i.unstable_pauseExecution = function() {
        }, i.unstable_requestPaint = X, i.unstable_runWithPriority = function(q, me) {
          switch (q) {
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
              break;
            default:
              q = 3;
          }
          var c = ie;
          ie = q;
          try {
            return me();
          } finally {
            ie = c;
          }
        }, i.unstable_scheduleCallback = function(q, me, c) {
          var f = i.unstable_now();
          if (typeof c == "object" && c !== null) {
            var k = c.delay;
            k = typeof k == "number" && 0 < k ? f + k : f, c = typeof c.timeout == "number" ? c.timeout : Je(q);
          } else c = Je(q), k = f;
          return q = { id: de++, callback: me, priorityLevel: q, startTime: k, expirationTime: c = k + c, sortIndex: -1 }, k > f ? (q.sortIndex = k, ae(ee, q), le(ye) === null && q === le(ee) && (ke ? _() : ke = !0, r(Se, k - f))) : (q.sortIndex = c, ae(ye, q), Te || be || (Te = !0, u(ze))), q;
        }, i.unstable_shouldYield = function() {
          var q = i.unstable_now();
          Pe(q);
          var me = le(ye);
          return me !== R && R !== null && me !== null && me.callback !== null && me.startTime <= q && me.expirationTime < R.expirationTime || m();
        }, i.unstable_wrapCallback = function(q) {
          var me = ie;
          return function() {
            var c = ie;
            ie = me;
            try {
              return q.apply(this, arguments);
            } finally {
              ie = c;
            }
          };
        };
      }, function(p, i, l) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.toString = void 0;
        const u = l(13), r = l(26), _ = l(17), m = { string: u.quoteString, number: (b) => Object.is(b, -0) ? "-0" : String(b), boolean: String, symbol: (b, y, v) => {
          const C = Symbol.keyFor(b);
          return C !== void 0 ? `Symbol.for(${v(C)})` : `Symbol(${v(b.description)})`;
        }, bigint: (b, y, v) => `BigInt(${v(String(b))})`, undefined: String, object: r.objectToString, function: _.functionToString };
        i.toString = (b, y, v, C) => b === null ? "null" : m[typeof b](b, y, v, C);
      }, function(p, i, l) {
        (function(u, r) {
          Object.defineProperty(i, "__esModule", { value: !0 }), i.objectToString = void 0;
          const _ = l(13), m = l(17), b = l(31);
          i.objectToString = (C, x, N, G) => {
            if (typeof u == "function" && u.isBuffer(C)) return `Buffer.from(${N(C.toString("base64"))}, 'base64')`;
            if (typeof r == "object" && C === r) return y(C, x, N);
            const K = v[Object.prototype.toString.call(C)];
            return K ? K(C, x, N, G) : void 0;
          };
          const y = (C, x, N) => `Function(${N("return this")})()`, v = { "[object Array]": b.arrayToString, "[object Object]": (C, x, N, G) => {
            const K = x ? `
` : "", j = x ? " " : "", V = Object.keys(C).reduce(function(P, M) {
              const B = C[M], I = N(B, M);
              if (I === void 0) return P;
              const J = I.split(`
`).join(`
` + x);
              return m.USED_METHOD_KEY.has(B) ? (P.push(`${x}${J}`), P) : (P.push(`${x}${_.quoteKey(M, N)}:${j}${J}`), P);
            }, []).join("," + K);
            return V === "" ? "{}" : `{${K}${V}${K}}`;
          }, "[object Error]": (C, x, N) => `new Error(${N(C.message)})`, "[object Date]": (C) => `new Date(${C.getTime()})`, "[object String]": (C, x, N) => `new String(${N(C.toString())})`, "[object Number]": (C) => `new Number(${C})`, "[object Boolean]": (C) => `new Boolean(${C})`, "[object Set]": (C, x, N) => `new Set(${N(Array.from(C))})`, "[object Map]": (C, x, N) => `new Map(${N(Array.from(C))})`, "[object RegExp]": String, "[object global]": y, "[object Window]": y };
        }).call(this, l(27).Buffer, l(15));
      }, function(p, i, l) {
        (function(u) {
          var r = l(28), _ = l(29), m = l(30);
          function b() {
            return v.TYPED_ARRAY_SUPPORT ? 2147483647 : 1073741823;
          }
          function y(c, f) {
            if (b() < f) throw new RangeError("Invalid typed array length");
            return v.TYPED_ARRAY_SUPPORT ? (c = new Uint8Array(f)).__proto__ = v.prototype : (c === null && (c = new v(f)), c.length = f), c;
          }
          function v(c, f, k) {
            if (!(v.TYPED_ARRAY_SUPPORT || this instanceof v)) return new v(c, f, k);
            if (typeof c == "number") {
              if (typeof f == "string") throw new Error("If encoding is specified then the first argument must be a string");
              return N(this, c);
            }
            return C(this, c, f, k);
          }
          function C(c, f, k, U) {
            if (typeof f == "number") throw new TypeError('"value" argument must not be a number');
            return typeof ArrayBuffer < "u" && f instanceof ArrayBuffer ? function(F, H, he, je) {
              if (H.byteLength, he < 0 || H.byteLength < he) throw new RangeError("'offset' is out of bounds");
              if (H.byteLength < he + (je || 0)) throw new RangeError("'length' is out of bounds");
              return H = he === void 0 && je === void 0 ? new Uint8Array(H) : je === void 0 ? new Uint8Array(H, he) : new Uint8Array(H, he, je), v.TYPED_ARRAY_SUPPORT ? (F = H).__proto__ = v.prototype : F = G(F, H), F;
            }(c, f, k, U) : typeof f == "string" ? function(F, H, he) {
              if (typeof he == "string" && he !== "" || (he = "utf8"), !v.isEncoding(he)) throw new TypeError('"encoding" must be a valid string encoding');
              var je = 0 | j(H, he), Re = (F = y(F, je)).write(H, he);
              return Re !== je && (F = F.slice(0, Re)), F;
            }(c, f, k) : function(F, H) {
              if (v.isBuffer(H)) {
                var he = 0 | K(H.length);
                return (F = y(F, he)).length === 0 || H.copy(F, 0, 0, he), F;
              }
              if (H) {
                if (typeof ArrayBuffer < "u" && H.buffer instanceof ArrayBuffer || "length" in H) return typeof H.length != "number" || (je = H.length) != je ? y(F, 0) : G(F, H);
                if (H.type === "Buffer" && m(H.data)) return G(F, H.data);
              }
              var je;
              throw new TypeError("First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.");
            }(c, f);
          }
          function x(c) {
            if (typeof c != "number") throw new TypeError('"size" argument must be a number');
            if (c < 0) throw new RangeError('"size" argument must not be negative');
          }
          function N(c, f) {
            if (x(f), c = y(c, f < 0 ? 0 : 0 | K(f)), !v.TYPED_ARRAY_SUPPORT) for (var k = 0; k < f; ++k) c[k] = 0;
            return c;
          }
          function G(c, f) {
            var k = f.length < 0 ? 0 : 0 | K(f.length);
            c = y(c, k);
            for (var U = 0; U < k; U += 1) c[U] = 255 & f[U];
            return c;
          }
          function K(c) {
            if (c >= b()) throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + b().toString(16) + " bytes");
            return 0 | c;
          }
          function j(c, f) {
            if (v.isBuffer(c)) return c.length;
            if (typeof ArrayBuffer < "u" && typeof ArrayBuffer.isView == "function" && (ArrayBuffer.isView(c) || c instanceof ArrayBuffer)) return c.byteLength;
            typeof c != "string" && (c = "" + c);
            var k = c.length;
            if (k === 0) return 0;
            for (var U = !1; ; ) switch (f) {
              case "ascii":
              case "latin1":
              case "binary":
                return k;
              case "utf8":
              case "utf-8":
              case void 0:
                return X(c).length;
              case "ucs2":
              case "ucs-2":
              case "utf16le":
              case "utf-16le":
                return 2 * k;
              case "hex":
                return k >>> 1;
              case "base64":
                return q(c).length;
              default:
                if (U) return X(c).length;
                f = ("" + f).toLowerCase(), U = !0;
            }
          }
          function V(c, f, k) {
            var U = !1;
            if ((f === void 0 || f < 0) && (f = 0), f > this.length || ((k === void 0 || k > this.length) && (k = this.length), k <= 0) || (k >>>= 0) <= (f >>>= 0)) return "";
            for (c || (c = "utf8"); ; ) switch (c) {
              case "hex":
                return ee(this, f, k);
              case "utf8":
              case "utf-8":
                return ne(this, f, k);
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
                if (U) throw new TypeError("Unknown encoding: " + c);
                c = (c + "").toLowerCase(), U = !0;
            }
          }
          function P(c, f, k) {
            var U = c[f];
            c[f] = c[k], c[k] = U;
          }
          function M(c, f, k, U, F) {
            if (c.length === 0) return -1;
            if (typeof k == "string" ? (U = k, k = 0) : k > 2147483647 ? k = 2147483647 : k < -2147483648 && (k = -2147483648), k = +k, isNaN(k) && (k = F ? 0 : c.length - 1), k < 0 && (k = c.length + k), k >= c.length) {
              if (F) return -1;
              k = c.length - 1;
            } else if (k < 0) {
              if (!F) return -1;
              k = 0;
            }
            if (typeof f == "string" && (f = v.from(f, U)), v.isBuffer(f)) return f.length === 0 ? -1 : B(c, f, k, U, F);
            if (typeof f == "number") return f &= 255, v.TYPED_ARRAY_SUPPORT && typeof Uint8Array.prototype.indexOf == "function" ? F ? Uint8Array.prototype.indexOf.call(c, f, k) : Uint8Array.prototype.lastIndexOf.call(c, f, k) : B(c, [f], k, U, F);
            throw new TypeError("val must be string, number or Buffer");
          }
          function B(c, f, k, U, F) {
            var H, he = 1, je = c.length, Re = f.length;
            if (U !== void 0 && ((U = String(U).toLowerCase()) === "ucs2" || U === "ucs-2" || U === "utf16le" || U === "utf-16le")) {
              if (c.length < 2 || f.length < 2) return -1;
              he = 2, je /= 2, Re /= 2, k /= 2;
            }
            function Xe(Jt, kt) {
              return he === 1 ? Jt[kt] : Jt.readUInt16BE(kt * he);
            }
            if (F) {
              var We = -1;
              for (H = k; H < je; H++) if (Xe(c, H) === Xe(f, We === -1 ? 0 : H - We)) {
                if (We === -1 && (We = H), H - We + 1 === Re) return We * he;
              } else We !== -1 && (H -= H - We), We = -1;
            } else for (k + Re > je && (k = je - Re), H = k; H >= 0; H--) {
              for (var It = !0, wt = 0; wt < Re; wt++) if (Xe(c, H + wt) !== Xe(f, wt)) {
                It = !1;
                break;
              }
              if (It) return H;
            }
            return -1;
          }
          function I(c, f, k, U) {
            k = Number(k) || 0;
            var F = c.length - k;
            U ? (U = Number(U)) > F && (U = F) : U = F;
            var H = f.length;
            if (H % 2 != 0) throw new TypeError("Invalid hex string");
            U > H / 2 && (U = H / 2);
            for (var he = 0; he < U; ++he) {
              var je = parseInt(f.substr(2 * he, 2), 16);
              if (isNaN(je)) return he;
              c[k + he] = je;
            }
            return he;
          }
          function J(c, f, k, U) {
            return me(X(f, c.length - k), c, k, U);
          }
          function Q(c, f, k, U) {
            return me(function(F) {
              for (var H = [], he = 0; he < F.length; ++he) H.push(255 & F.charCodeAt(he));
              return H;
            }(f), c, k, U);
          }
          function z(c, f, k, U) {
            return Q(c, f, k, U);
          }
          function A(c, f, k, U) {
            return me(q(f), c, k, U);
          }
          function ae(c, f, k, U) {
            return me(function(F, H) {
              for (var he, je, Re, Xe = [], We = 0; We < F.length && !((H -= 2) < 0); ++We) he = F.charCodeAt(We), je = he >> 8, Re = he % 256, Xe.push(Re), Xe.push(je);
              return Xe;
            }(f, c.length - k), c, k, U);
          }
          function le(c, f, k) {
            return f === 0 && k === c.length ? r.fromByteArray(c) : r.fromByteArray(c.slice(f, k));
          }
          function ne(c, f, k) {
            k = Math.min(c.length, k);
            for (var U = [], F = f; F < k; ) {
              var H, he, je, Re, Xe = c[F], We = null, It = Xe > 239 ? 4 : Xe > 223 ? 3 : Xe > 191 ? 2 : 1;
              if (F + It <= k) switch (It) {
                case 1:
                  Xe < 128 && (We = Xe);
                  break;
                case 2:
                  (192 & (H = c[F + 1])) == 128 && (Re = (31 & Xe) << 6 | 63 & H) > 127 && (We = Re);
                  break;
                case 3:
                  H = c[F + 1], he = c[F + 2], (192 & H) == 128 && (192 & he) == 128 && (Re = (15 & Xe) << 12 | (63 & H) << 6 | 63 & he) > 2047 && (Re < 55296 || Re > 57343) && (We = Re);
                  break;
                case 4:
                  H = c[F + 1], he = c[F + 2], je = c[F + 3], (192 & H) == 128 && (192 & he) == 128 && (192 & je) == 128 && (Re = (15 & Xe) << 18 | (63 & H) << 12 | (63 & he) << 6 | 63 & je) > 65535 && Re < 1114112 && (We = Re);
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
          i.Buffer = v, i.SlowBuffer = function(c) {
            return +c != c && (c = 0), v.alloc(+c);
          }, i.INSPECT_MAX_BYTES = 50, v.TYPED_ARRAY_SUPPORT = u.TYPED_ARRAY_SUPPORT !== void 0 ? u.TYPED_ARRAY_SUPPORT : function() {
            try {
              var c = new Uint8Array(1);
              return c.__proto__ = { __proto__: Uint8Array.prototype, foo: function() {
                return 42;
              } }, c.foo() === 42 && typeof c.subarray == "function" && c.subarray(1, 1).byteLength === 0;
            } catch {
              return !1;
            }
          }(), i.kMaxLength = b(), v.poolSize = 8192, v._augment = function(c) {
            return c.__proto__ = v.prototype, c;
          }, v.from = function(c, f, k) {
            return C(null, c, f, k);
          }, v.TYPED_ARRAY_SUPPORT && (v.prototype.__proto__ = Uint8Array.prototype, v.__proto__ = Uint8Array, typeof Symbol < "u" && Symbol.species && v[Symbol.species] === v && Object.defineProperty(v, Symbol.species, { value: null, configurable: !0 })), v.alloc = function(c, f, k) {
            return function(U, F, H, he) {
              return x(F), F <= 0 ? y(U, F) : H !== void 0 ? typeof he == "string" ? y(U, F).fill(H, he) : y(U, F).fill(H) : y(U, F);
            }(null, c, f, k);
          }, v.allocUnsafe = function(c) {
            return N(null, c);
          }, v.allocUnsafeSlow = function(c) {
            return N(null, c);
          }, v.isBuffer = function(c) {
            return !(c == null || !c._isBuffer);
          }, v.compare = function(c, f) {
            if (!v.isBuffer(c) || !v.isBuffer(f)) throw new TypeError("Arguments must be Buffers");
            if (c === f) return 0;
            for (var k = c.length, U = f.length, F = 0, H = Math.min(k, U); F < H; ++F) if (c[F] !== f[F]) {
              k = c[F], U = f[F];
              break;
            }
            return k < U ? -1 : U < k ? 1 : 0;
          }, v.isEncoding = function(c) {
            switch (String(c).toLowerCase()) {
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
          }, v.concat = function(c, f) {
            if (!m(c)) throw new TypeError('"list" argument must be an Array of Buffers');
            if (c.length === 0) return v.alloc(0);
            var k;
            if (f === void 0) for (f = 0, k = 0; k < c.length; ++k) f += c[k].length;
            var U = v.allocUnsafe(f), F = 0;
            for (k = 0; k < c.length; ++k) {
              var H = c[k];
              if (!v.isBuffer(H)) throw new TypeError('"list" argument must be an Array of Buffers');
              H.copy(U, F), F += H.length;
            }
            return U;
          }, v.byteLength = j, v.prototype._isBuffer = !0, v.prototype.swap16 = function() {
            var c = this.length;
            if (c % 2 != 0) throw new RangeError("Buffer size must be a multiple of 16-bits");
            for (var f = 0; f < c; f += 2) P(this, f, f + 1);
            return this;
          }, v.prototype.swap32 = function() {
            var c = this.length;
            if (c % 4 != 0) throw new RangeError("Buffer size must be a multiple of 32-bits");
            for (var f = 0; f < c; f += 4) P(this, f, f + 3), P(this, f + 1, f + 2);
            return this;
          }, v.prototype.swap64 = function() {
            var c = this.length;
            if (c % 8 != 0) throw new RangeError("Buffer size must be a multiple of 64-bits");
            for (var f = 0; f < c; f += 8) P(this, f, f + 7), P(this, f + 1, f + 6), P(this, f + 2, f + 5), P(this, f + 3, f + 4);
            return this;
          }, v.prototype.toString = function() {
            var c = 0 | this.length;
            return c === 0 ? "" : arguments.length === 0 ? ne(this, 0, c) : V.apply(this, arguments);
          }, v.prototype.equals = function(c) {
            if (!v.isBuffer(c)) throw new TypeError("Argument must be a Buffer");
            return this === c || v.compare(this, c) === 0;
          }, v.prototype.inspect = function() {
            var c = "", f = i.INSPECT_MAX_BYTES;
            return this.length > 0 && (c = this.toString("hex", 0, f).match(/.{2}/g).join(" "), this.length > f && (c += " ... ")), "<Buffer " + c + ">";
          }, v.prototype.compare = function(c, f, k, U, F) {
            if (!v.isBuffer(c)) throw new TypeError("Argument must be a Buffer");
            if (f === void 0 && (f = 0), k === void 0 && (k = c ? c.length : 0), U === void 0 && (U = 0), F === void 0 && (F = this.length), f < 0 || k > c.length || U < 0 || F > this.length) throw new RangeError("out of range index");
            if (U >= F && f >= k) return 0;
            if (U >= F) return -1;
            if (f >= k) return 1;
            if (this === c) return 0;
            for (var H = (F >>>= 0) - (U >>>= 0), he = (k >>>= 0) - (f >>>= 0), je = Math.min(H, he), Re = this.slice(U, F), Xe = c.slice(f, k), We = 0; We < je; ++We) if (Re[We] !== Xe[We]) {
              H = Re[We], he = Xe[We];
              break;
            }
            return H < he ? -1 : he < H ? 1 : 0;
          }, v.prototype.includes = function(c, f, k) {
            return this.indexOf(c, f, k) !== -1;
          }, v.prototype.indexOf = function(c, f, k) {
            return M(this, c, f, k, !0);
          }, v.prototype.lastIndexOf = function(c, f, k) {
            return M(this, c, f, k, !1);
          }, v.prototype.write = function(c, f, k, U) {
            if (f === void 0) U = "utf8", k = this.length, f = 0;
            else if (k === void 0 && typeof f == "string") U = f, k = this.length, f = 0;
            else {
              if (!isFinite(f)) throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
              f |= 0, isFinite(k) ? (k |= 0, U === void 0 && (U = "utf8")) : (U = k, k = void 0);
            }
            var F = this.length - f;
            if ((k === void 0 || k > F) && (k = F), c.length > 0 && (k < 0 || f < 0) || f > this.length) throw new RangeError("Attempt to write outside buffer bounds");
            U || (U = "utf8");
            for (var H = !1; ; ) switch (U) {
              case "hex":
                return I(this, c, f, k);
              case "utf8":
              case "utf-8":
                return J(this, c, f, k);
              case "ascii":
                return Q(this, c, f, k);
              case "latin1":
              case "binary":
                return z(this, c, f, k);
              case "base64":
                return A(this, c, f, k);
              case "ucs2":
              case "ucs-2":
              case "utf16le":
              case "utf-16le":
                return ae(this, c, f, k);
              default:
                if (H) throw new TypeError("Unknown encoding: " + U);
                U = ("" + U).toLowerCase(), H = !0;
            }
          }, v.prototype.toJSON = function() {
            return { type: "Buffer", data: Array.prototype.slice.call(this._arr || this, 0) };
          };
          function ce(c, f, k) {
            var U = "";
            k = Math.min(c.length, k);
            for (var F = f; F < k; ++F) U += String.fromCharCode(127 & c[F]);
            return U;
          }
          function ye(c, f, k) {
            var U = "";
            k = Math.min(c.length, k);
            for (var F = f; F < k; ++F) U += String.fromCharCode(c[F]);
            return U;
          }
          function ee(c, f, k) {
            var U = c.length;
            (!f || f < 0) && (f = 0), (!k || k < 0 || k > U) && (k = U);
            for (var F = "", H = f; H < k; ++H) F += Je(c[H]);
            return F;
          }
          function de(c, f, k) {
            for (var U = c.slice(f, k), F = "", H = 0; H < U.length; H += 2) F += String.fromCharCode(U[H] + 256 * U[H + 1]);
            return F;
          }
          function R(c, f, k) {
            if (c % 1 != 0 || c < 0) throw new RangeError("offset is not uint");
            if (c + f > k) throw new RangeError("Trying to access beyond buffer length");
          }
          function ie(c, f, k, U, F, H) {
            if (!v.isBuffer(c)) throw new TypeError('"buffer" argument must be a Buffer instance');
            if (f > F || f < H) throw new RangeError('"value" argument is out of bounds');
            if (k + U > c.length) throw new RangeError("Index out of range");
          }
          function be(c, f, k, U) {
            f < 0 && (f = 65535 + f + 1);
            for (var F = 0, H = Math.min(c.length - k, 2); F < H; ++F) c[k + F] = (f & 255 << 8 * (U ? F : 1 - F)) >>> 8 * (U ? F : 1 - F);
          }
          function Te(c, f, k, U) {
            f < 0 && (f = 4294967295 + f + 1);
            for (var F = 0, H = Math.min(c.length - k, 4); F < H; ++F) c[k + F] = f >>> 8 * (U ? F : 3 - F) & 255;
          }
          function ke(c, f, k, U, F, H) {
            if (k + U > c.length) throw new RangeError("Index out of range");
            if (k < 0) throw new RangeError("Index out of range");
          }
          function Pe(c, f, k, U, F) {
            return F || ke(c, 0, k, 4), _.write(c, f, k, U, 23, 4), k + 4;
          }
          function Se(c, f, k, U, F) {
            return F || ke(c, 0, k, 8), _.write(c, f, k, U, 52, 8), k + 8;
          }
          v.prototype.slice = function(c, f) {
            var k, U = this.length;
            if ((c = ~~c) < 0 ? (c += U) < 0 && (c = 0) : c > U && (c = U), (f = f === void 0 ? U : ~~f) < 0 ? (f += U) < 0 && (f = 0) : f > U && (f = U), f < c && (f = c), v.TYPED_ARRAY_SUPPORT) (k = this.subarray(c, f)).__proto__ = v.prototype;
            else {
              var F = f - c;
              k = new v(F, void 0);
              for (var H = 0; H < F; ++H) k[H] = this[H + c];
            }
            return k;
          }, v.prototype.readUIntLE = function(c, f, k) {
            c |= 0, f |= 0, k || R(c, f, this.length);
            for (var U = this[c], F = 1, H = 0; ++H < f && (F *= 256); ) U += this[c + H] * F;
            return U;
          }, v.prototype.readUIntBE = function(c, f, k) {
            c |= 0, f |= 0, k || R(c, f, this.length);
            for (var U = this[c + --f], F = 1; f > 0 && (F *= 256); ) U += this[c + --f] * F;
            return U;
          }, v.prototype.readUInt8 = function(c, f) {
            return f || R(c, 1, this.length), this[c];
          }, v.prototype.readUInt16LE = function(c, f) {
            return f || R(c, 2, this.length), this[c] | this[c + 1] << 8;
          }, v.prototype.readUInt16BE = function(c, f) {
            return f || R(c, 2, this.length), this[c] << 8 | this[c + 1];
          }, v.prototype.readUInt32LE = function(c, f) {
            return f || R(c, 4, this.length), (this[c] | this[c + 1] << 8 | this[c + 2] << 16) + 16777216 * this[c + 3];
          }, v.prototype.readUInt32BE = function(c, f) {
            return f || R(c, 4, this.length), 16777216 * this[c] + (this[c + 1] << 16 | this[c + 2] << 8 | this[c + 3]);
          }, v.prototype.readIntLE = function(c, f, k) {
            c |= 0, f |= 0, k || R(c, f, this.length);
            for (var U = this[c], F = 1, H = 0; ++H < f && (F *= 256); ) U += this[c + H] * F;
            return U >= (F *= 128) && (U -= Math.pow(2, 8 * f)), U;
          }, v.prototype.readIntBE = function(c, f, k) {
            c |= 0, f |= 0, k || R(c, f, this.length);
            for (var U = f, F = 1, H = this[c + --U]; U > 0 && (F *= 256); ) H += this[c + --U] * F;
            return H >= (F *= 128) && (H -= Math.pow(2, 8 * f)), H;
          }, v.prototype.readInt8 = function(c, f) {
            return f || R(c, 1, this.length), 128 & this[c] ? -1 * (255 - this[c] + 1) : this[c];
          }, v.prototype.readInt16LE = function(c, f) {
            f || R(c, 2, this.length);
            var k = this[c] | this[c + 1] << 8;
            return 32768 & k ? 4294901760 | k : k;
          }, v.prototype.readInt16BE = function(c, f) {
            f || R(c, 2, this.length);
            var k = this[c + 1] | this[c] << 8;
            return 32768 & k ? 4294901760 | k : k;
          }, v.prototype.readInt32LE = function(c, f) {
            return f || R(c, 4, this.length), this[c] | this[c + 1] << 8 | this[c + 2] << 16 | this[c + 3] << 24;
          }, v.prototype.readInt32BE = function(c, f) {
            return f || R(c, 4, this.length), this[c] << 24 | this[c + 1] << 16 | this[c + 2] << 8 | this[c + 3];
          }, v.prototype.readFloatLE = function(c, f) {
            return f || R(c, 4, this.length), _.read(this, c, !0, 23, 4);
          }, v.prototype.readFloatBE = function(c, f) {
            return f || R(c, 4, this.length), _.read(this, c, !1, 23, 4);
          }, v.prototype.readDoubleLE = function(c, f) {
            return f || R(c, 8, this.length), _.read(this, c, !0, 52, 8);
          }, v.prototype.readDoubleBE = function(c, f) {
            return f || R(c, 8, this.length), _.read(this, c, !1, 52, 8);
          }, v.prototype.writeUIntLE = function(c, f, k, U) {
            c = +c, f |= 0, k |= 0, U || ie(this, c, f, k, Math.pow(2, 8 * k) - 1, 0);
            var F = 1, H = 0;
            for (this[f] = 255 & c; ++H < k && (F *= 256); ) this[f + H] = c / F & 255;
            return f + k;
          }, v.prototype.writeUIntBE = function(c, f, k, U) {
            c = +c, f |= 0, k |= 0, U || ie(this, c, f, k, Math.pow(2, 8 * k) - 1, 0);
            var F = k - 1, H = 1;
            for (this[f + F] = 255 & c; --F >= 0 && (H *= 256); ) this[f + F] = c / H & 255;
            return f + k;
          }, v.prototype.writeUInt8 = function(c, f, k) {
            return c = +c, f |= 0, k || ie(this, c, f, 1, 255, 0), v.TYPED_ARRAY_SUPPORT || (c = Math.floor(c)), this[f] = 255 & c, f + 1;
          }, v.prototype.writeUInt16LE = function(c, f, k) {
            return c = +c, f |= 0, k || ie(this, c, f, 2, 65535, 0), v.TYPED_ARRAY_SUPPORT ? (this[f] = 255 & c, this[f + 1] = c >>> 8) : be(this, c, f, !0), f + 2;
          }, v.prototype.writeUInt16BE = function(c, f, k) {
            return c = +c, f |= 0, k || ie(this, c, f, 2, 65535, 0), v.TYPED_ARRAY_SUPPORT ? (this[f] = c >>> 8, this[f + 1] = 255 & c) : be(this, c, f, !1), f + 2;
          }, v.prototype.writeUInt32LE = function(c, f, k) {
            return c = +c, f |= 0, k || ie(this, c, f, 4, 4294967295, 0), v.TYPED_ARRAY_SUPPORT ? (this[f + 3] = c >>> 24, this[f + 2] = c >>> 16, this[f + 1] = c >>> 8, this[f] = 255 & c) : Te(this, c, f, !0), f + 4;
          }, v.prototype.writeUInt32BE = function(c, f, k) {
            return c = +c, f |= 0, k || ie(this, c, f, 4, 4294967295, 0), v.TYPED_ARRAY_SUPPORT ? (this[f] = c >>> 24, this[f + 1] = c >>> 16, this[f + 2] = c >>> 8, this[f + 3] = 255 & c) : Te(this, c, f, !1), f + 4;
          }, v.prototype.writeIntLE = function(c, f, k, U) {
            if (c = +c, f |= 0, !U) {
              var F = Math.pow(2, 8 * k - 1);
              ie(this, c, f, k, F - 1, -F);
            }
            var H = 0, he = 1, je = 0;
            for (this[f] = 255 & c; ++H < k && (he *= 256); ) c < 0 && je === 0 && this[f + H - 1] !== 0 && (je = 1), this[f + H] = (c / he >> 0) - je & 255;
            return f + k;
          }, v.prototype.writeIntBE = function(c, f, k, U) {
            if (c = +c, f |= 0, !U) {
              var F = Math.pow(2, 8 * k - 1);
              ie(this, c, f, k, F - 1, -F);
            }
            var H = k - 1, he = 1, je = 0;
            for (this[f + H] = 255 & c; --H >= 0 && (he *= 256); ) c < 0 && je === 0 && this[f + H + 1] !== 0 && (je = 1), this[f + H] = (c / he >> 0) - je & 255;
            return f + k;
          }, v.prototype.writeInt8 = function(c, f, k) {
            return c = +c, f |= 0, k || ie(this, c, f, 1, 127, -128), v.TYPED_ARRAY_SUPPORT || (c = Math.floor(c)), c < 0 && (c = 255 + c + 1), this[f] = 255 & c, f + 1;
          }, v.prototype.writeInt16LE = function(c, f, k) {
            return c = +c, f |= 0, k || ie(this, c, f, 2, 32767, -32768), v.TYPED_ARRAY_SUPPORT ? (this[f] = 255 & c, this[f + 1] = c >>> 8) : be(this, c, f, !0), f + 2;
          }, v.prototype.writeInt16BE = function(c, f, k) {
            return c = +c, f |= 0, k || ie(this, c, f, 2, 32767, -32768), v.TYPED_ARRAY_SUPPORT ? (this[f] = c >>> 8, this[f + 1] = 255 & c) : be(this, c, f, !1), f + 2;
          }, v.prototype.writeInt32LE = function(c, f, k) {
            return c = +c, f |= 0, k || ie(this, c, f, 4, 2147483647, -2147483648), v.TYPED_ARRAY_SUPPORT ? (this[f] = 255 & c, this[f + 1] = c >>> 8, this[f + 2] = c >>> 16, this[f + 3] = c >>> 24) : Te(this, c, f, !0), f + 4;
          }, v.prototype.writeInt32BE = function(c, f, k) {
            return c = +c, f |= 0, k || ie(this, c, f, 4, 2147483647, -2147483648), c < 0 && (c = 4294967295 + c + 1), v.TYPED_ARRAY_SUPPORT ? (this[f] = c >>> 24, this[f + 1] = c >>> 16, this[f + 2] = c >>> 8, this[f + 3] = 255 & c) : Te(this, c, f, !1), f + 4;
          }, v.prototype.writeFloatLE = function(c, f, k) {
            return Pe(this, c, f, !0, k);
          }, v.prototype.writeFloatBE = function(c, f, k) {
            return Pe(this, c, f, !1, k);
          }, v.prototype.writeDoubleLE = function(c, f, k) {
            return Se(this, c, f, !0, k);
          }, v.prototype.writeDoubleBE = function(c, f, k) {
            return Se(this, c, f, !1, k);
          }, v.prototype.copy = function(c, f, k, U) {
            if (k || (k = 0), U || U === 0 || (U = this.length), f >= c.length && (f = c.length), f || (f = 0), U > 0 && U < k && (U = k), U === k || c.length === 0 || this.length === 0) return 0;
            if (f < 0) throw new RangeError("targetStart out of bounds");
            if (k < 0 || k >= this.length) throw new RangeError("sourceStart out of bounds");
            if (U < 0) throw new RangeError("sourceEnd out of bounds");
            U > this.length && (U = this.length), c.length - f < U - k && (U = c.length - f + k);
            var F, H = U - k;
            if (this === c && k < f && f < U) for (F = H - 1; F >= 0; --F) c[F + f] = this[F + k];
            else if (H < 1e3 || !v.TYPED_ARRAY_SUPPORT) for (F = 0; F < H; ++F) c[F + f] = this[F + k];
            else Uint8Array.prototype.set.call(c, this.subarray(k, k + H), f);
            return H;
          }, v.prototype.fill = function(c, f, k, U) {
            if (typeof c == "string") {
              if (typeof f == "string" ? (U = f, f = 0, k = this.length) : typeof k == "string" && (U = k, k = this.length), c.length === 1) {
                var F = c.charCodeAt(0);
                F < 256 && (c = F);
              }
              if (U !== void 0 && typeof U != "string") throw new TypeError("encoding must be a string");
              if (typeof U == "string" && !v.isEncoding(U)) throw new TypeError("Unknown encoding: " + U);
            } else typeof c == "number" && (c &= 255);
            if (f < 0 || this.length < f || this.length < k) throw new RangeError("Out of range index");
            if (k <= f) return this;
            var H;
            if (f >>>= 0, k = k === void 0 ? this.length : k >>> 0, c || (c = 0), typeof c == "number") for (H = f; H < k; ++H) this[H] = c;
            else {
              var he = v.isBuffer(c) ? c : X(new v(c, U).toString()), je = he.length;
              for (H = 0; H < k - f; ++H) this[H + f] = he[H % je];
            }
            return this;
          };
          var ze = /[^+\/0-9A-Za-z-_]/g;
          function Je(c) {
            return c < 16 ? "0" + c.toString(16) : c.toString(16);
          }
          function X(c, f) {
            var k;
            f = f || 1 / 0;
            for (var U = c.length, F = null, H = [], he = 0; he < U; ++he) {
              if ((k = c.charCodeAt(he)) > 55295 && k < 57344) {
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
          function q(c) {
            return r.toByteArray(function(f) {
              if ((f = function(k) {
                return k.trim ? k.trim() : k.replace(/^\s+|\s+$/g, "");
              }(f).replace(ze, "")).length < 2) return "";
              for (; f.length % 4 != 0; ) f += "=";
              return f;
            }(c));
          }
          function me(c, f, k, U) {
            for (var F = 0; F < U && !(F + k >= f.length || F >= c.length); ++F) f[F + k] = c[F];
            return F;
          }
        }).call(this, l(15));
      }, function(p, i, l) {
        i.byteLength = function(x) {
          var N = v(x), G = N[0], K = N[1];
          return 3 * (G + K) / 4 - K;
        }, i.toByteArray = function(x) {
          var N, G, K = v(x), j = K[0], V = K[1], P = new _(function(I, J, Q) {
            return 3 * (J + Q) / 4 - Q;
          }(0, j, V)), M = 0, B = V > 0 ? j - 4 : j;
          for (G = 0; G < B; G += 4) N = r[x.charCodeAt(G)] << 18 | r[x.charCodeAt(G + 1)] << 12 | r[x.charCodeAt(G + 2)] << 6 | r[x.charCodeAt(G + 3)], P[M++] = N >> 16 & 255, P[M++] = N >> 8 & 255, P[M++] = 255 & N;
          return V === 2 && (N = r[x.charCodeAt(G)] << 2 | r[x.charCodeAt(G + 1)] >> 4, P[M++] = 255 & N), V === 1 && (N = r[x.charCodeAt(G)] << 10 | r[x.charCodeAt(G + 1)] << 4 | r[x.charCodeAt(G + 2)] >> 2, P[M++] = N >> 8 & 255, P[M++] = 255 & N), P;
        }, i.fromByteArray = function(x) {
          for (var N, G = x.length, K = G % 3, j = [], V = 0, P = G - K; V < P; V += 16383) j.push(C(x, V, V + 16383 > P ? P : V + 16383));
          return K === 1 ? (N = x[G - 1], j.push(u[N >> 2] + u[N << 4 & 63] + "==")) : K === 2 && (N = (x[G - 2] << 8) + x[G - 1], j.push(u[N >> 10] + u[N >> 4 & 63] + u[N << 2 & 63] + "=")), j.join("");
        };
        for (var u = [], r = [], _ = typeof Uint8Array < "u" ? Uint8Array : Array, m = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", b = 0, y = m.length; b < y; ++b) u[b] = m[b], r[m.charCodeAt(b)] = b;
        function v(x) {
          var N = x.length;
          if (N % 4 > 0) throw new Error("Invalid string. Length must be a multiple of 4");
          var G = x.indexOf("=");
          return G === -1 && (G = N), [G, G === N ? 0 : 4 - G % 4];
        }
        function C(x, N, G) {
          for (var K, j, V = [], P = N; P < G; P += 3) K = (x[P] << 16 & 16711680) + (x[P + 1] << 8 & 65280) + (255 & x[P + 2]), V.push(u[(j = K) >> 18 & 63] + u[j >> 12 & 63] + u[j >> 6 & 63] + u[63 & j]);
          return V.join("");
        }
        r[45] = 62, r[95] = 63;
      }, function(p, i) {
        i.read = function(l, u, r, _, m) {
          var b, y, v = 8 * m - _ - 1, C = (1 << v) - 1, x = C >> 1, N = -7, G = r ? m - 1 : 0, K = r ? -1 : 1, j = l[u + G];
          for (G += K, b = j & (1 << -N) - 1, j >>= -N, N += v; N > 0; b = 256 * b + l[u + G], G += K, N -= 8) ;
          for (y = b & (1 << -N) - 1, b >>= -N, N += _; N > 0; y = 256 * y + l[u + G], G += K, N -= 8) ;
          if (b === 0) b = 1 - x;
          else {
            if (b === C) return y ? NaN : 1 / 0 * (j ? -1 : 1);
            y += Math.pow(2, _), b -= x;
          }
          return (j ? -1 : 1) * y * Math.pow(2, b - _);
        }, i.write = function(l, u, r, _, m, b) {
          var y, v, C, x = 8 * b - m - 1, N = (1 << x) - 1, G = N >> 1, K = m === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0, j = _ ? 0 : b - 1, V = _ ? 1 : -1, P = u < 0 || u === 0 && 1 / u < 0 ? 1 : 0;
          for (u = Math.abs(u), isNaN(u) || u === 1 / 0 ? (v = isNaN(u) ? 1 : 0, y = N) : (y = Math.floor(Math.log(u) / Math.LN2), u * (C = Math.pow(2, -y)) < 1 && (y--, C *= 2), (u += y + G >= 1 ? K / C : K * Math.pow(2, 1 - G)) * C >= 2 && (y++, C /= 2), y + G >= N ? (v = 0, y = N) : y + G >= 1 ? (v = (u * C - 1) * Math.pow(2, m), y += G) : (v = u * Math.pow(2, G - 1) * Math.pow(2, m), y = 0)); m >= 8; l[r + j] = 255 & v, j += V, v /= 256, m -= 8) ;
          for (y = y << m | v, x += m; x > 0; l[r + j] = 255 & y, j += V, y /= 256, x -= 8) ;
          l[r + j - V] |= 128 * P;
        };
      }, function(p, i) {
        var l = {}.toString;
        p.exports = Array.isArray || function(u) {
          return l.call(u) == "[object Array]";
        };
      }, function(p, i, l) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.arrayToString = void 0, i.arrayToString = (u, r, _) => {
          const m = u.map(function(y, v) {
            const C = _(y, v);
            return C === void 0 ? String(C) : r + C.split(`
`).join(`
` + r);
          }).join(r ? `,
` : ","), b = r && m ? `
` : "";
          return `[${b}${m}${b}]`;
        };
      }, function(p, i, l) {
        function u(j) {
          return (u = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(V) {
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
          return V += (0, r.int)(P.borderTopWidth), V += (0, r.int)(P.borderBottomWidth);
        }, i.outerWidth = function(j) {
          var V = j.clientWidth, P = j.ownerDocument.defaultView.getComputedStyle(j);
          return V += (0, r.int)(P.borderLeftWidth), V += (0, r.int)(P.borderRightWidth);
        }, i.innerHeight = function(j) {
          var V = j.clientHeight, P = j.ownerDocument.defaultView.getComputedStyle(j);
          return V -= (0, r.int)(P.paddingTop), V -= (0, r.int)(P.paddingBottom);
        }, i.innerWidth = function(j) {
          var V = j.clientWidth, P = j.ownerDocument.defaultView.getComputedStyle(j);
          return V -= (0, r.int)(P.paddingLeft), V -= (0, r.int)(P.paddingRight);
        }, i.offsetXYFromParent = function(j, V, P) {
          var M = V === V.ownerDocument.body ? { left: 0, top: 0 } : V.getBoundingClientRect(), B = (j.clientX + V.scrollLeft - M.left) / P, I = (j.clientY + V.scrollTop - M.top) / P;
          return { x: B, y: I };
        }, i.createCSSTransform = function(j, V) {
          var P = N(j, V, "px");
          return v({}, (0, _.browserPrefixToKey)("transform", _.default), P);
        }, i.createSVGTransform = function(j, V) {
          return N(j, V, "");
        }, i.getTranslation = N, i.getTouch = function(j, V) {
          return j.targetTouches && (0, r.findInArray)(j.targetTouches, function(P) {
            return V === P.identifier;
          }) || j.changedTouches && (0, r.findInArray)(j.changedTouches, function(P) {
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
        var r = l(20), _ = function(j) {
          if (j && j.__esModule) return j;
          if (j === null || u(j) !== "object" && typeof j != "function") return { default: j };
          var V = m();
          if (V && V.has(j)) return V.get(j);
          var P = {}, M = Object.defineProperty && Object.getOwnPropertyDescriptor;
          for (var B in j) if (Object.prototype.hasOwnProperty.call(j, B)) {
            var I = M ? Object.getOwnPropertyDescriptor(j, B) : null;
            I && (I.get || I.set) ? Object.defineProperty(P, B, I) : P[B] = j[B];
          }
          return P.default = j, V && V.set(j, P), P;
        }(l(56));
        function m() {
          if (typeof WeakMap != "function") return null;
          var j = /* @__PURE__ */ new WeakMap();
          return m = function() {
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
          return C || (C = (0, r.findInArray)(["matches", "webkitMatchesSelector", "mozMatchesSelector", "msMatchesSelector", "oMatchesSelector"], function(P) {
            return (0, r.isFunction)(j[P]);
          })), !!(0, r.isFunction)(j[C]) && j[C](V);
        }
        function N(j, V, P) {
          var M = j.x, B = j.y, I = "translate(".concat(M).concat(P, ",").concat(B).concat(P, ")");
          if (V) {
            var J = "".concat(typeof V.x == "string" ? V.x : V.x + P), Q = "".concat(typeof V.y == "string" ? V.y : V.y + P);
            I = "translate(".concat(J, ", ").concat(Q, ")") + I;
          }
          return I;
        }
        function G(j, V) {
          j.classList ? j.classList.add(V) : j.className.match(new RegExp("(?:^|\\s)".concat(V, "(?!\\S)"))) || (j.className += " ".concat(V));
        }
        function K(j, V) {
          j.classList ? j.classList.remove(V) : j.className = j.className.replace(new RegExp("(?:^|\\s)".concat(V, "(?!\\S)"), "g"), "");
        }
      }, function(p, i) {
        p.exports = function(l) {
          return l.webpackPolyfill || (l.deprecate = function() {
          }, l.paths = [], l.children || (l.children = []), Object.defineProperty(l, "loaded", { enumerable: !0, get: function() {
            return l.l;
          } }), Object.defineProperty(l, "id", { enumerable: !0, get: function() {
            return l.i;
          } }), l.webpackPolyfill = 1), l;
        };
      }, function(p, i, l) {
        var u = l(6), r = l(35);
        typeof (r = r.__esModule ? r.default : r) == "string" && (r = [[p.i, r, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        u(r, _), p.exports = r.locals || {};
      }, function(p, i, l) {
        (p.exports = l(7)(!1)).push([p.i, `.ck-inspector{--ck-inspector-color-tree-node-hover:#eaf2fb;--ck-inspector-color-tree-node-name:#882680;--ck-inspector-color-tree-node-attribute-name:#8a8a8a;--ck-inspector-color-tree-node-tag:#aaa;--ck-inspector-color-tree-node-attribute:#9a4819;--ck-inspector-color-tree-node-attribute-value:#2a43ac;--ck-inspector-color-tree-text-border:#b7b7b7;--ck-inspector-color-tree-node-border-hover:#b0c6e0;--ck-inspector-color-tree-content-delimiter:#ddd;--ck-inspector-color-tree-node-active-bg:#f5faff;--ck-inspector-color-tree-node-name-active-bg:#2b98f0;--ck-inspector-color-tree-node-inactive:#8a8a8a;--ck-inspector-color-tree-selection:#ff1744;--ck-inspector-color-tree-position:#000;--ck-inspector-color-comment:green}.ck-inspector .ck-inspector-tree{background:var(--ck-inspector-color-white);padding:1em;width:100%;height:100%;overflow:auto;user-select:none}.ck-inspector-tree .ck-inspector-tree-node__attribute{font:inherit;margin-left:.4em;color:var(--ck-inspector-color-tree-node-tag)}.ck-inspector-tree .ck-inspector-tree-node__attribute .ck-inspector-tree-node__attribute__name{color:var(--ck-inspector-color-tree-node-attribute)}.ck-inspector-tree .ck-inspector-tree-node__attribute .ck-inspector-tree-node__attribute__value{color:var(--ck-inspector-color-tree-node-attribute-value)}.ck-inspector-tree .ck-inspector-tree-node__attribute .ck-inspector-tree-node__attribute__value:before{content:'="'}.ck-inspector-tree .ck-inspector-tree-node__attribute .ck-inspector-tree-node__attribute__value:after{content:'"'}.ck-inspector-tree .ck-inspector-tree-node .ck-inspector-tree-node__name{color:var(--ck-inspector-color-tree-node-name);display:inline-block;width:100%;padding:0 .1em;border-left:1px solid transparent}.ck-inspector-tree .ck-inspector-tree-node .ck-inspector-tree-node__name:hover{background:var(--ck-inspector-color-tree-node-hover)}.ck-inspector-tree .ck-inspector-tree-node .ck-inspector-tree-node__content{padding:1px .5em 1px 1.5em;border-left:1px solid var(--ck-inspector-color-tree-content-delimiter);white-space:pre-wrap}.ck-inspector-tree .ck-inspector-tree-node:not(.ck-inspector-tree-node_tagless) .ck-inspector-tree-node__name>.ck-inspector-tree-node__name__bracket_open:after{content:"<";color:var(--ck-inspector-color-tree-node-tag)}.ck-inspector-tree .ck-inspector-tree-node:not(.ck-inspector-tree-node_tagless) .ck-inspector-tree-node__name .ck-inspector-tree-node__name__bracket_close:after{content:">";color:var(--ck-inspector-color-tree-node-tag)}.ck-inspector-tree .ck-inspector-tree-node:not(.ck-inspector-tree-node_tagless).ck-inspector-tree-node_empty .ck-inspector-tree-node__name:after{content:" />"}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_tagless .ck-inspector-tree-node__content{display:none}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name:not(.ck-inspector-tree-node__name_close),.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name:not(.ck-inspector-tree-node__name_close) :not(.ck-inspector-tree__position),.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name:not(.ck-inspector-tree-node__name_close)>.ck-inspector-tree-node__name__bracket:after{background:var(--ck-inspector-color-tree-node-name-active-bg);color:var(--ck-inspector-color-white)}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__content,.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name_close{background:var(--ck-inspector-color-tree-node-active-bg)}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__content{border-left-color:var(--ck-inspector-color-tree-node-name-active-bg)}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name{border-left:1px solid var(--ck-inspector-color-tree-node-name-active-bg)}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_disabled{opacity:.8}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_disabled .ck-inspector-tree-node__name,.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_disabled .ck-inspector-tree-node__name *{color:var(--ck-inspector-color-tree-node-inactive)}.ck-inspector-tree .ck-inspector-tree-text{display:block;margin-bottom:1px}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-node__content{border:1px dotted var(--ck-inspector-color-tree-text-border);border-radius:2px;padding:0 1px;margin-right:1px;display:inline-block;word-break:break-all}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes:not(:empty){margin-right:.5em}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes .ck-inspector-tree-node__attribute{background:var(--ck-inspector-color-tree-node-attribute-name);border-radius:2px;padding:0 .5em}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes .ck-inspector-tree-node__attribute+.ck-inspector-tree-node__attribute{margin-left:.2em}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes .ck-inspector-tree-node__attribute>*{color:var(--ck-inspector-color-white)}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes .ck-inspector-tree-node__attribute:first-child{margin-left:0}.ck-inspector-tree .ck-inspector-tree-text.ck-inspector-tree-node_active .ck-inspector-tree-node__content{border-style:solid;border-color:var(--ck-inspector-color-tree-node-name-active-bg)}.ck-inspector-tree .ck-inspector-tree-text.ck-inspector-tree-node_active .ck-inspector-tree-node__attribute{background:var(--ck-inspector-color-white)}.ck-inspector-tree .ck-inspector-tree-text.ck-inspector-tree-node_active .ck-inspector-tree-node__attribute>*{color:var(--ck-inspector-color-tree-node-name-active-bg)}.ck-inspector-tree .ck-inspector-tree-text.ck-inspector-tree-node_active>.ck-inspector-tree-node__content{background:var(--ck-inspector-color-tree-node-name-active-bg);color:var(--ck-inspector-color-white)}.ck-inspector-tree .ck-inspector-tree-text:not(.ck-inspector-tree-node_active) .ck-inspector-tree-node__content:hover{background:var(--ck-inspector-color-tree-node-hover);border-style:solid;border-color:var(--ck-inspector-color-tree-node-border-hover)}.ck-inspector-tree.ck-inspector-tree_text-direction_ltr .ck-inspector-tree-node__content{direction:ltr}.ck-inspector-tree.ck-inspector-tree_text-direction_rtl .ck-inspector-tree-node__content{direction:rtl}.ck-inspector-tree.ck-inspector-tree_text-direction_rtl .ck-inspector-tree-node__content .ck-inspector-tree-node__name{direction:ltr}.ck-inspector-tree.ck-inspector-tree_text-direction_rtl .ck-inspector-tree__position{transform:rotate(180deg)}.ck-inspector-tree .ck-inspector-tree-comment{color:var(--ck-inspector-color-comment);font-style:italic}.ck-inspector-tree .ck-inspector-tree-comment a{color:inherit;text-decoration:underline}.ck-inspector-tree_compact-text .ck-inspector-tree-text,.ck-inspector-tree_compact-text .ck-inspector-tree-text .ck-inspector-tree-node__content{display:inline}.ck-inspector .ck-inspector__tree__navigation{padding:.5em 1em;border-bottom:1px solid var(--ck-inspector-color-border)}.ck-inspector .ck-inspector__tree__navigation label{margin-right:.5em}.ck-inspector-tree .ck-inspector-tree__position{display:inline-block;position:relative;cursor:default;height:100%;pointer-events:none;vertical-align:top}.ck-inspector-tree .ck-inspector-tree__position:after{content:"";position:absolute;border:1px solid var(--ck-inspector-color-tree-position);width:0;top:0;bottom:0;margin-left:-1px}.ck-inspector-tree .ck-inspector-tree__position:before{margin-left:-1px}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_selection{z-index:2;--ck-inspector-color-tree-position:var(--ck-inspector-color-tree-selection)}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_selection:before{content:"";position:absolute;top:-1px;bottom:-1px;left:0;border-top:2px solid var(--ck-inspector-color-tree-position);border-bottom:2px solid var(--ck-inspector-color-tree-position);width:8px}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_selection.ck-inspector-tree__position_end:before{right:-1px;left:auto}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_marker{z-index:1}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_marker:before{content:"";display:block;position:absolute;left:0;top:-1px;cursor:default;width:0;height:0;border-left:0 solid transparent;border-bottom:0 solid transparent;border-right:7px solid transparent;border-top:7px solid var(--ck-inspector-color-tree-position)}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_marker.ck-inspector-tree__position_end:before{border-width:0 7px 7px 0;border-left-color:transparent;border-bottom-color:transparent;border-right-color:var(--ck-inspector-color-tree-position);border-top-color:transparent;left:-5px}`, ""]);
      }, function(p, i, l) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.canUseDOM = i.SafeNodeList = i.SafeHTMLCollection = void 0;
        var u, r = l(82), _ = ((u = r) && u.__esModule ? u : { default: u }).default, m = _.canUseDOM ? window.HTMLElement : {};
        i.SafeHTMLCollection = _.canUseDOM ? window.HTMLCollection : {}, i.SafeNodeList = _.canUseDOM ? window.NodeList : {}, i.canUseDOM = _.canUseDOM, i.default = m;
      }, function(p, i, l) {
        var u = l(6), r = l(38);
        typeof (r = r.__esModule ? r.default : r) == "string" && (r = [[p.i, r, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        u(r, _), p.exports = r.locals || {};
      }, function(p, i, l) {
        (p.exports = l(7)(!1)).push([p.i, `.ck-inspector,.ck-inspector-portal{--ck-inspector-color-white:#fff;--ck-inspector-color-black:#000;--ck-inspector-color-background:#f3f3f3;--ck-inspector-color-link:#005cc6;--ck-inspector-code-font-size:11px;--ck-inspector-code-font-family:monaco,Consolas,Lucida Console,monospace;--ck-inspector-color-border:#d0d0d0}.ck-inspector,.ck-inspector-portal,.ck-inspector-portal :not(select),.ck-inspector :not(select){box-sizing:border-box;width:auto;height:auto;position:static;margin:0;padding:0;border:0;background:transparent;text-decoration:none;transition:none;word-wrap:break-word;font-family:Arial,Helvetica Neue,Helvetica,sans-serif;font-size:12px;line-height:17px;font-weight:400;-webkit-font-smoothing:auto}.ck-inspector{overflow:hidden;border-collapse:collapse;color:var(--ck-inspector-color-black);text-align:left;white-space:normal;cursor:auto;float:none;background:var(--ck-inspector-color-background);border-top:1px solid var(--ck-inspector-color-border);z-index:9999}.ck-inspector.ck-inspector_collapsed>.ck-inspector-navbox>.ck-inspector-navbox__navigation .ck-inspector-horizontal-nav{display:none}.ck-inspector .ck-inspector-navbox__navigation__logo{background-size:contain;background-repeat:no-repeat;background-position:50%;display:block;overflow:hidden;text-indent:100px;align-self:center;white-space:nowrap;margin-right:1em;background-image:url("data:image/svg+xml;charset=utf-8,%3Csvg width='68' height='64' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M43.71 11.025a11.508 11.508 0 00-1.213 5.159c0 6.42 5.244 11.625 11.713 11.625.083 0 .167 0 .25-.002v16.282a5.464 5.464 0 01-2.756 4.739L30.986 60.7a5.548 5.548 0 01-5.512 0L4.756 48.828A5.464 5.464 0 012 44.089V20.344c0-1.955 1.05-3.76 2.756-4.738L25.474 3.733a5.548 5.548 0 015.512 0l12.724 7.292z' fill='%23FFF'/%3E%3Cpath d='M45.684 8.79a12.604 12.604 0 00-1.329 5.65c0 7.032 5.744 12.733 12.829 12.733.091 0 .183-.001.274-.003v17.834a5.987 5.987 0 01-3.019 5.19L31.747 63.196a6.076 6.076 0 01-6.037 0L3.02 50.193A5.984 5.984 0 010 45.003V18.997c0-2.14 1.15-4.119 3.019-5.19L25.71.804a6.076 6.076 0 016.037 0L45.684 8.79zm-29.44 11.89c-.834 0-1.51.671-1.51 1.498v.715c0 .828.676 1.498 1.51 1.498h25.489c.833 0 1.51-.67 1.51-1.498v-.715c0-.827-.677-1.498-1.51-1.498h-25.49zm0 9.227c-.834 0-1.51.671-1.51 1.498v.715c0 .828.676 1.498 1.51 1.498h18.479c.833 0 1.509-.67 1.509-1.498v-.715c0-.827-.676-1.498-1.51-1.498H16.244zm0 9.227c-.834 0-1.51.671-1.51 1.498v.715c0 .828.676 1.498 1.51 1.498h25.489c.833 0 1.51-.67 1.51-1.498v-.715c0-.827-.677-1.498-1.51-1.498h-25.49zm41.191-14.459c-5.835 0-10.565-4.695-10.565-10.486 0-5.792 4.73-10.487 10.565-10.487C63.27 3.703 68 8.398 68 14.19c0 5.791-4.73 10.486-10.565 10.486zm3.422-8.68c0-.467-.084-.875-.251-1.225a2.547 2.547 0 00-.686-.88 2.888 2.888 0 00-1.026-.531 4.418 4.418 0 00-1.259-.175c-.134 0-.283.006-.447.018a2.72 2.72 0 00-.446.07l.075-1.4h3.587v-1.8h-5.462l-.214 5.06c.319-.116.682-.21 1.089-.28.406-.071.77-.107 1.088-.107.218 0 .437.021.655.063.218.041.413.114.585.218s.313.244.422.419c.109.175.163.391.163.65 0 .424-.132.745-.396.961a1.434 1.434 0 01-.938.325c-.352 0-.656-.1-.912-.3-.256-.2-.43-.453-.523-.762l-1.925.588c.1.35.258.664.472.943.214.279.47.514.767.706.298.191.63.339.995.443.365.104.749.156 1.151.156.437 0 .86-.064 1.272-.193.41-.13.778-.323 1.1-.581a2.8 2.8 0 00.775-.981c.193-.396.29-.864.29-1.405z' fill='%231EBC61' fill-rule='nonzero'/%3E%3C/g%3E%3C/svg%3E");width:1.8em;height:1.8em;margin-left:1em}.ck-inspector .ck-inspector-navbox__navigation__toggle{margin-right:1em}.ck-inspector .ck-inspector-navbox__navigation__toggle.ck-inspector-navbox__navigation__toggle_up{transform:rotate(180deg)}.ck-inspector .ck-inspector-editor-selector{margin-left:auto;margin-right:.3em}@media screen and (max-width:680px){.ck-inspector .ck-inspector-editor-selector label{display:none}}.ck-inspector .ck-inspector-editor-selector select{margin-left:.5em}.ck-inspector .ck-inspector-code,.ck-inspector .ck-inspector-code *{font-size:var(--ck-inspector-code-font-size);font-family:var(--ck-inspector-code-font-family);cursor:default}.ck-inspector a{color:var(--ck-inspector-color-link);text-decoration:none}.ck-inspector a:hover{text-decoration:underline;cursor:pointer}.ck-inspector button{outline:0}.ck-inspector .ck-inspector-separator{border-right:1px solid var(--ck-inspector-color-border);display:inline-block;width:0;height:20px;margin:0 .5em;vertical-align:middle}`, ""]);
      }, function(p, i, l) {
        var u = l(49), r = { childContextTypes: !0, contextType: !0, contextTypes: !0, defaultProps: !0, displayName: !0, getDefaultProps: !0, getDerivedStateFromError: !0, getDerivedStateFromProps: !0, mixins: !0, propTypes: !0, type: !0 }, _ = { name: !0, length: !0, prototype: !0, caller: !0, callee: !0, arguments: !0, arity: !0 }, m = { $$typeof: !0, compare: !0, defaultProps: !0, displayName: !0, propTypes: !0, type: !0 }, b = {};
        function y(j) {
          return u.isMemo(j) ? m : b[j.$$typeof] || r;
        }
        b[u.ForwardRef] = { $$typeof: !0, render: !0, defaultProps: !0, displayName: !0, propTypes: !0 }, b[u.Memo] = m;
        var v = Object.defineProperty, C = Object.getOwnPropertyNames, x = Object.getOwnPropertySymbols, N = Object.getOwnPropertyDescriptor, G = Object.getPrototypeOf, K = Object.prototype;
        p.exports = function j(V, P, M) {
          if (typeof P != "string") {
            if (K) {
              var B = G(P);
              B && B !== K && j(V, B, M);
            }
            var I = C(P);
            x && (I = I.concat(x(P)));
            for (var J = y(V), Q = y(P), z = 0; z < I.length; ++z) {
              var A = I[z];
              if (!(_[A] || M && M[A] || Q && Q[A] || J && J[A])) {
                var ae = N(P, A);
                try {
                  v(V, A, ae);
                } catch {
                }
              }
            }
          }
          return V;
        };
      }, function(p, i, l) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.getBoundPosition = function(m, b, y) {
          if (!m.props.bounds) return [b, y];
          var v = m.props.bounds;
          v = typeof v == "string" ? v : function(V) {
            return { left: V.left, top: V.top, right: V.right, bottom: V.bottom };
          }(v);
          var C = _(m);
          if (typeof v == "string") {
            var x, N = C.ownerDocument, G = N.defaultView;
            if (!((x = v === "parent" ? C.parentNode : N.querySelector(v)) instanceof G.HTMLElement)) throw new Error('Bounds selector "' + v + '" could not find an element.');
            var K = G.getComputedStyle(C), j = G.getComputedStyle(x);
            v = { left: -C.offsetLeft + (0, u.int)(j.paddingLeft) + (0, u.int)(K.marginLeft), top: -C.offsetTop + (0, u.int)(j.paddingTop) + (0, u.int)(K.marginTop), right: (0, r.innerWidth)(x) - (0, r.outerWidth)(C) - C.offsetLeft + (0, u.int)(j.paddingRight) - (0, u.int)(K.marginRight), bottom: (0, r.innerHeight)(x) - (0, r.outerHeight)(C) - C.offsetTop + (0, u.int)(j.paddingBottom) - (0, u.int)(K.marginBottom) };
          }
          return (0, u.isNum)(v.right) && (b = Math.min(b, v.right)), (0, u.isNum)(v.bottom) && (y = Math.min(y, v.bottom)), (0, u.isNum)(v.left) && (b = Math.max(b, v.left)), (0, u.isNum)(v.top) && (y = Math.max(y, v.top)), [b, y];
        }, i.snapToGrid = function(m, b, y) {
          var v = Math.round(b / m[0]) * m[0], C = Math.round(y / m[1]) * m[1];
          return [v, C];
        }, i.canDragX = function(m) {
          return m.props.axis === "both" || m.props.axis === "x";
        }, i.canDragY = function(m) {
          return m.props.axis === "both" || m.props.axis === "y";
        }, i.getControlPosition = function(m, b, y) {
          var v = typeof b == "number" ? (0, r.getTouch)(m, b) : null;
          if (typeof b == "number" && !v) return null;
          var C = _(y), x = y.props.offsetParent || C.offsetParent || C.ownerDocument.body;
          return (0, r.offsetXYFromParent)(v || m, x, y.props.scale);
        }, i.createCoreData = function(m, b, y) {
          var v = m.state, C = !(0, u.isNum)(v.lastX), x = _(m);
          return C ? { node: x, deltaX: 0, deltaY: 0, lastX: b, lastY: y, x: b, y } : { node: x, deltaX: b - v.lastX, deltaY: y - v.lastY, lastX: v.lastX, lastY: v.lastY, x: b, y };
        }, i.createDraggableData = function(m, b) {
          var y = m.props.scale;
          return { node: b.node, x: m.state.x + b.deltaX / y, y: m.state.y + b.deltaY / y, deltaX: b.deltaX / y, deltaY: b.deltaY / y, lastX: m.state.x, lastY: m.state.y };
        };
        var u = l(20), r = l(32);
        function _(m) {
          var b = m.findDOMNode();
          if (!b) throw new Error("<DraggableCore>: Unmounted during event!");
          return b;
        }
      }, function(p, i, l) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.default = function() {
        };
      }, function(p, i, l) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.default = function b(y) {
          return [].slice.call(y.querySelectorAll("*"), 0).reduce(function(v, C) {
            return v.concat(C.shadowRoot ? b(C.shadowRoot) : [C]);
          }, []).filter(m);
        };
        var u = /input|select|textarea|button|object|iframe/;
        function r(b) {
          var y = b.offsetWidth <= 0 && b.offsetHeight <= 0;
          if (y && !b.innerHTML) return !0;
          try {
            var v = window.getComputedStyle(b);
            return y ? v.getPropertyValue("overflow") !== "visible" || b.scrollWidth <= 0 && b.scrollHeight <= 0 : v.getPropertyValue("display") == "none";
          } catch {
            return console.warn("Failed to inspect element style"), !1;
          }
        }
        function _(b, y) {
          var v = b.nodeName.toLowerCase();
          return (u.test(v) && !b.disabled || v === "a" && b.href || y) && function(C) {
            for (var x = C, N = C.getRootNode && C.getRootNode(); x && x !== document.body; ) {
              if (N && x === N && (x = N.host.parentNode), r(x)) return !1;
              x = x.parentNode;
            }
            return !0;
          }(b);
        }
        function m(b) {
          var y = b.getAttribute("tabindex");
          y === null && (y = void 0);
          var v = isNaN(y);
          return (v || y >= 0) && _(b, !v);
        }
        p.exports = i.default;
      }, function(p, i, l) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.resetState = function() {
          b && (b.removeAttribute ? b.removeAttribute("aria-hidden") : b.length != null ? b.forEach(function(C) {
            return C.removeAttribute("aria-hidden");
          }) : document.querySelectorAll(b).forEach(function(C) {
            return C.removeAttribute("aria-hidden");
          })), b = null;
        }, i.log = function() {
        }, i.assertNodeList = y, i.setElement = function(C) {
          var x = C;
          if (typeof x == "string" && m.canUseDOM) {
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
        var u, r = l(81), _ = (u = r) && u.__esModule ? u : { default: u }, m = l(36), b = null;
        function y(C, x) {
          if (!C || !C.length) throw new Error("react-modal: No elements were found for selector " + x + ".");
        }
        function v(C) {
          var x = C || b;
          return x ? Array.isArray(x) || x instanceof HTMLCollection || x instanceof NodeList ? x : [x] : ((0, _.default)(!1, ["react-modal: App element is not defined.", "Please use `Modal.setAppElement(el)` or set `appElement={el}`.", "This is needed so screen readers don't see main content", "when modal is opened. It is not recommended, but you can opt-out", "by setting `ariaHideApp={false}`."].join(" ")), []);
        }
      }, function(p, i, l) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.log = function() {
          console.log("portalOpenInstances ----------"), console.log(r.openInstances.length), r.openInstances.forEach(function(_) {
            return console.log(_);
          }), console.log("end portalOpenInstances ----------");
        }, i.resetState = function() {
          r = new u();
        };
        var u = function _() {
          var m = this;
          (function(b, y) {
            if (!(b instanceof y)) throw new TypeError("Cannot call a class as a function");
          })(this, _), this.register = function(b) {
            m.openInstances.indexOf(b) === -1 && (m.openInstances.push(b), m.emit("register"));
          }, this.deregister = function(b) {
            var y = m.openInstances.indexOf(b);
            y !== -1 && (m.openInstances.splice(y, 1), m.emit("deregister"));
          }, this.subscribe = function(b) {
            m.subscribers.push(b);
          }, this.emit = function(b) {
            m.subscribers.forEach(function(y) {
              return y(b, m.openInstances.slice());
            });
          }, this.openInstances = [], this.subscribers = [];
        }, r = new u();
        i.default = r;
      }, function(p, i, l) {
        p.exports = l(51);
      }, function(p, i, l) {
        var u = l(52), r = u.default, _ = u.DraggableCore;
        p.exports = r, p.exports.default = r, p.exports.DraggableCore = _;
      }, function(p, i, l) {
        var u = l(76), r = { "text/plain": "Text", "text/html": "Url", default: "Text" };
        p.exports = function(_, m) {
          var b, y, v, C, x, N, G = !1;
          m || (m = {}), b = m.debug || !1;
          try {
            if (v = u(), C = document.createRange(), x = document.getSelection(), (N = document.createElement("span")).textContent = _, N.style.all = "unset", N.style.position = "fixed", N.style.top = 0, N.style.clip = "rect(0, 0, 0, 0)", N.style.whiteSpace = "pre", N.style.webkitUserSelect = "text", N.style.MozUserSelect = "text", N.style.msUserSelect = "text", N.style.userSelect = "text", N.addEventListener("copy", function(K) {
              if (K.stopPropagation(), m.format) if (K.preventDefault(), K.clipboardData === void 0) {
                b && console.warn("unable to use e.clipboardData"), b && console.warn("trying IE specific stuff"), window.clipboardData.clearData();
                var j = r[m.format] || r.default;
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
              b && console.error("unable to copy using clipboardData: ", j), b && console.error("falling back to prompt"), y = function(V) {
                var P = (/mac os x/i.test(navigator.userAgent) ? "⌘" : "Ctrl") + "+C";
                return V.replace(/#{\s*key\s*}/g, P);
              }("message" in m ? m.message : "Copy to clipboard: #{key}, Enter"), window.prompt(y, _);
            }
          } finally {
            x && (typeof x.removeRange == "function" ? x.removeRange(C) : x.removeAllRanges()), N && document.body.removeChild(N), v();
          }
          return G;
        };
      }, function(p, i, l) {
        Object.defineProperty(i, "__esModule", { value: !0 });
        var u, r = l(77), _ = (u = r) && u.__esModule ? u : { default: u };
        i.default = _.default, p.exports = i.default;
      }, function(p, i, l) {
        p.exports = l(50);
      }, function(p, i, l) {
        var u = typeof Symbol == "function" && Symbol.for, r = u ? Symbol.for("react.element") : 60103, _ = u ? Symbol.for("react.portal") : 60106, m = u ? Symbol.for("react.fragment") : 60107, b = u ? Symbol.for("react.strict_mode") : 60108, y = u ? Symbol.for("react.profiler") : 60114, v = u ? Symbol.for("react.provider") : 60109, C = u ? Symbol.for("react.context") : 60110, x = u ? Symbol.for("react.async_mode") : 60111, N = u ? Symbol.for("react.concurrent_mode") : 60111, G = u ? Symbol.for("react.forward_ref") : 60112, K = u ? Symbol.for("react.suspense") : 60113, j = u ? Symbol.for("react.suspense_list") : 60120, V = u ? Symbol.for("react.memo") : 60115, P = u ? Symbol.for("react.lazy") : 60116, M = u ? Symbol.for("react.block") : 60121, B = u ? Symbol.for("react.fundamental") : 60117, I = u ? Symbol.for("react.responder") : 60118, J = u ? Symbol.for("react.scope") : 60119;
        function Q(A) {
          if (typeof A == "object" && A !== null) {
            var ae = A.$$typeof;
            switch (ae) {
              case r:
                switch (A = A.type) {
                  case x:
                  case N:
                  case m:
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
                        return ae;
                    }
                }
              case _:
                return ae;
            }
          }
        }
        function z(A) {
          return Q(A) === N;
        }
        i.AsyncMode = x, i.ConcurrentMode = N, i.ContextConsumer = C, i.ContextProvider = v, i.Element = r, i.ForwardRef = G, i.Fragment = m, i.Lazy = P, i.Memo = V, i.Portal = _, i.Profiler = y, i.StrictMode = b, i.Suspense = K, i.isAsyncMode = function(A) {
          return z(A) || Q(A) === x;
        }, i.isConcurrentMode = z, i.isContextConsumer = function(A) {
          return Q(A) === C;
        }, i.isContextProvider = function(A) {
          return Q(A) === v;
        }, i.isElement = function(A) {
          return typeof A == "object" && A !== null && A.$$typeof === r;
        }, i.isForwardRef = function(A) {
          return Q(A) === G;
        }, i.isFragment = function(A) {
          return Q(A) === m;
        }, i.isLazy = function(A) {
          return Q(A) === P;
        }, i.isMemo = function(A) {
          return Q(A) === V;
        }, i.isPortal = function(A) {
          return Q(A) === _;
        }, i.isProfiler = function(A) {
          return Q(A) === y;
        }, i.isStrictMode = function(A) {
          return Q(A) === b;
        }, i.isSuspense = function(A) {
          return Q(A) === K;
        }, i.isValidElementType = function(A) {
          return typeof A == "string" || typeof A == "function" || A === m || A === N || A === y || A === b || A === K || A === j || typeof A == "object" && A !== null && (A.$$typeof === P || A.$$typeof === V || A.$$typeof === v || A.$$typeof === C || A.$$typeof === G || A.$$typeof === B || A.$$typeof === I || A.$$typeof === J || A.$$typeof === M);
        }, i.typeOf = Q;
      }, function(p, i, l) {
        var u = 60103, r = 60106, _ = 60107, m = 60108, b = 60114, y = 60109, v = 60110, C = 60112, x = 60113, N = 60120, G = 60115, K = 60116, j = 60121, V = 60122, P = 60117, M = 60129, B = 60131;
        if (typeof Symbol == "function" && Symbol.for) {
          var I = Symbol.for;
          u = I("react.element"), r = I("react.portal"), _ = I("react.fragment"), m = I("react.strict_mode"), b = I("react.profiler"), y = I("react.provider"), v = I("react.context"), C = I("react.forward_ref"), x = I("react.suspense"), N = I("react.suspense_list"), G = I("react.memo"), K = I("react.lazy"), j = I("react.block"), V = I("react.server.block"), P = I("react.fundamental"), M = I("react.debug_trace_mode"), B = I("react.legacy_hidden");
        }
        function J(R) {
          if (typeof R == "object" && R !== null) {
            var ie = R.$$typeof;
            switch (ie) {
              case u:
                switch (R = R.type) {
                  case _:
                  case b:
                  case m:
                  case x:
                  case N:
                    return R;
                  default:
                    switch (R = R && R.$$typeof) {
                      case v:
                      case C:
                      case K:
                      case G:
                      case y:
                        return R;
                      default:
                        return ie;
                    }
                }
              case r:
                return ie;
            }
          }
        }
        var Q = y, z = u, A = C, ae = _, le = K, ne = G, ce = r, ye = b, ee = m, de = x;
        i.ContextConsumer = v, i.ContextProvider = Q, i.Element = z, i.ForwardRef = A, i.Fragment = ae, i.Lazy = le, i.Memo = ne, i.Portal = ce, i.Profiler = ye, i.StrictMode = ee, i.Suspense = de, i.isAsyncMode = function() {
          return !1;
        }, i.isConcurrentMode = function() {
          return !1;
        }, i.isContextConsumer = function(R) {
          return J(R) === v;
        }, i.isContextProvider = function(R) {
          return J(R) === y;
        }, i.isElement = function(R) {
          return typeof R == "object" && R !== null && R.$$typeof === u;
        }, i.isForwardRef = function(R) {
          return J(R) === C;
        }, i.isFragment = function(R) {
          return J(R) === _;
        }, i.isLazy = function(R) {
          return J(R) === K;
        }, i.isMemo = function(R) {
          return J(R) === G;
        }, i.isPortal = function(R) {
          return J(R) === r;
        }, i.isProfiler = function(R) {
          return J(R) === b;
        }, i.isStrictMode = function(R) {
          return J(R) === m;
        }, i.isSuspense = function(R) {
          return J(R) === x;
        }, i.isValidElementType = function(R) {
          return typeof R == "string" || typeof R == "function" || R === _ || R === b || R === M || R === m || R === x || R === N || R === B || typeof R == "object" && R !== null && (R.$$typeof === K || R.$$typeof === G || R.$$typeof === y || R.$$typeof === v || R.$$typeof === C || R.$$typeof === P || R.$$typeof === j || R[0] === V);
        }, i.typeOf = J;
      }, function(p, i, l) {
        Object.defineProperty(i, "__esModule", { value: !0 }), Object.defineProperty(i, "DraggableCore", { enumerable: !0, get: function() {
          return C.default;
        } }), i.default = void 0;
        var u = function(ee) {
          if (ee && ee.__esModule) return ee;
          if (ee === null || K(ee) !== "object" && typeof ee != "function") return { default: ee };
          var de = G();
          if (de && de.has(ee)) return de.get(ee);
          var R = {}, ie = Object.defineProperty && Object.getOwnPropertyDescriptor;
          for (var be in ee) if (Object.prototype.hasOwnProperty.call(ee, be)) {
            var Te = ie ? Object.getOwnPropertyDescriptor(ee, be) : null;
            Te && (Te.get || Te.set) ? Object.defineProperty(R, be, Te) : R[be] = ee[be];
          }
          return R.default = ee, de && de.set(ee, R), R;
        }(l(0)), r = N(l(18)), _ = N(l(12)), m = N(l(55)), b = l(32), y = l(40), v = l(20), C = N(l(57)), x = N(l(41));
        function N(ee) {
          return ee && ee.__esModule ? ee : { default: ee };
        }
        function G() {
          if (typeof WeakMap != "function") return null;
          var ee = /* @__PURE__ */ new WeakMap();
          return G = function() {
            return ee;
          }, ee;
        }
        function K(ee) {
          return (K = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(de) {
            return typeof de;
          } : function(de) {
            return de && typeof Symbol == "function" && de.constructor === Symbol && de !== Symbol.prototype ? "symbol" : typeof de;
          })(ee);
        }
        function j() {
          return (j = Object.assign || function(ee) {
            for (var de = 1; de < arguments.length; de++) {
              var R = arguments[de];
              for (var ie in R) Object.prototype.hasOwnProperty.call(R, ie) && (ee[ie] = R[ie]);
            }
            return ee;
          }).apply(this, arguments);
        }
        function V(ee, de) {
          if (ee == null) return {};
          var R, ie, be = function(ke, Pe) {
            if (ke == null) return {};
            var Se, ze, Je = {}, X = Object.keys(ke);
            for (ze = 0; ze < X.length; ze++) Se = X[ze], Pe.indexOf(Se) >= 0 || (Je[Se] = ke[Se]);
            return Je;
          }(ee, de);
          if (Object.getOwnPropertySymbols) {
            var Te = Object.getOwnPropertySymbols(ee);
            for (ie = 0; ie < Te.length; ie++) R = Te[ie], de.indexOf(R) >= 0 || Object.prototype.propertyIsEnumerable.call(ee, R) && (be[R] = ee[R]);
          }
          return be;
        }
        function P(ee, de) {
          return function(R) {
            if (Array.isArray(R)) return R;
          }(ee) || function(R, ie) {
            if (!(typeof Symbol > "u" || !(Symbol.iterator in Object(R)))) {
              var be = [], Te = !0, ke = !1, Pe = void 0;
              try {
                for (var Se, ze = R[Symbol.iterator](); !(Te = (Se = ze.next()).done) && (be.push(Se.value), !ie || be.length !== ie); Te = !0) ;
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
          }(ee, de) || function(R, ie) {
            if (R) {
              if (typeof R == "string") return M(R, ie);
              var be = Object.prototype.toString.call(R).slice(8, -1);
              if (be === "Object" && R.constructor && (be = R.constructor.name), be === "Map" || be === "Set") return Array.from(R);
              if (be === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(be)) return M(R, ie);
            }
          }(ee, de) || function() {
            throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
          }();
        }
        function M(ee, de) {
          (de == null || de > ee.length) && (de = ee.length);
          for (var R = 0, ie = new Array(de); R < de; R++) ie[R] = ee[R];
          return ie;
        }
        function B(ee, de) {
          var R = Object.keys(ee);
          if (Object.getOwnPropertySymbols) {
            var ie = Object.getOwnPropertySymbols(ee);
            de && (ie = ie.filter(function(be) {
              return Object.getOwnPropertyDescriptor(ee, be).enumerable;
            })), R.push.apply(R, ie);
          }
          return R;
        }
        function I(ee) {
          for (var de = 1; de < arguments.length; de++) {
            var R = arguments[de] != null ? arguments[de] : {};
            de % 2 ? B(Object(R), !0).forEach(function(ie) {
              ce(ee, ie, R[ie]);
            }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(ee, Object.getOwnPropertyDescriptors(R)) : B(Object(R)).forEach(function(ie) {
              Object.defineProperty(ee, ie, Object.getOwnPropertyDescriptor(R, ie));
            });
          }
          return ee;
        }
        function J(ee, de) {
          for (var R = 0; R < de.length; R++) {
            var ie = de[R];
            ie.enumerable = ie.enumerable || !1, ie.configurable = !0, "value" in ie && (ie.writable = !0), Object.defineProperty(ee, ie.key, ie);
          }
        }
        function Q(ee, de, R) {
          return de && J(ee.prototype, de), R && J(ee, R), ee;
        }
        function z(ee, de) {
          return (z = Object.setPrototypeOf || function(R, ie) {
            return R.__proto__ = ie, R;
          })(ee, de);
        }
        function A(ee) {
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
            var R, ie = ne(ee);
            if (de) {
              var be = ne(this).constructor;
              R = Reflect.construct(ie, arguments, be);
            } else R = ie.apply(this, arguments);
            return ae(this, R);
          };
        }
        function ae(ee, de) {
          return !de || K(de) !== "object" && typeof de != "function" ? le(ee) : de;
        }
        function le(ee) {
          if (ee === void 0) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
          return ee;
        }
        function ne(ee) {
          return (ne = Object.setPrototypeOf ? Object.getPrototypeOf : function(de) {
            return de.__proto__ || Object.getPrototypeOf(de);
          })(ee);
        }
        function ce(ee, de, R) {
          return de in ee ? Object.defineProperty(ee, de, { value: R, enumerable: !0, configurable: !0, writable: !0 }) : ee[de] = R, ee;
        }
        var ye = function(ee) {
          (function(ie, be) {
            if (typeof be != "function" && be !== null) throw new TypeError("Super expression must either be null or a function");
            ie.prototype = Object.create(be && be.prototype, { constructor: { value: ie, writable: !0, configurable: !0 } }), be && z(ie, be);
          })(R, ee);
          var de = A(R);
          function R(ie) {
            var be;
            return function(Te, ke) {
              if (!(Te instanceof ke)) throw new TypeError("Cannot call a class as a function");
            }(this, R), ce(le(be = de.call(this, ie)), "onDragStart", function(Te, ke) {
              if ((0, x.default)("Draggable: onDragStart: %j", ke), be.props.onStart(Te, (0, y.createDraggableData)(le(be), ke)) === !1) return !1;
              be.setState({ dragging: !0, dragged: !0 });
            }), ce(le(be), "onDrag", function(Te, ke) {
              if (!be.state.dragging) return !1;
              (0, x.default)("Draggable: onDrag: %j", ke);
              var Pe = (0, y.createDraggableData)(le(be), ke), Se = { x: Pe.x, y: Pe.y };
              if (be.props.bounds) {
                var ze = Se.x, Je = Se.y;
                Se.x += be.state.slackX, Se.y += be.state.slackY;
                var X = P((0, y.getBoundPosition)(le(be), Se.x, Se.y), 2), q = X[0], me = X[1];
                Se.x = q, Se.y = me, Se.slackX = be.state.slackX + (ze - Se.x), Se.slackY = be.state.slackY + (Je - Se.y), Pe.x = Se.x, Pe.y = Se.y, Pe.deltaX = Se.x - be.state.x, Pe.deltaY = Se.y - be.state.y;
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
          return Q(R, null, [{ key: "getDerivedStateFromProps", value: function(ie, be) {
            var Te = ie.position, ke = be.prevPropsPosition;
            return !Te || ke && Te.x === ke.x && Te.y === ke.y ? null : ((0, x.default)("Draggable: getDerivedStateFromProps %j", { position: Te, prevPropsPosition: ke }), { x: Te.x, y: Te.y, prevPropsPosition: I({}, Te) });
          } }]), Q(R, [{ key: "componentDidMount", value: function() {
            window.SVGElement !== void 0 && this.findDOMNode() instanceof window.SVGElement && this.setState({ isElementSVG: !0 });
          } }, { key: "componentWillUnmount", value: function() {
            this.setState({ dragging: !1 });
          } }, { key: "findDOMNode", value: function() {
            return this.props.nodeRef ? this.props.nodeRef.current : _.default.findDOMNode(this);
          } }, { key: "render", value: function() {
            var ie, be = this.props, Te = (be.axis, be.bounds, be.children), ke = be.defaultPosition, Pe = be.defaultClassName, Se = be.defaultClassNameDragging, ze = be.defaultClassNameDragged, Je = be.position, X = be.positionOffset, q = (be.scale, V(be, ["axis", "bounds", "children", "defaultPosition", "defaultClassName", "defaultClassNameDragging", "defaultClassNameDragged", "position", "positionOffset", "scale"])), me = {}, c = null, f = !Je || this.state.dragging, k = Je || ke, U = { x: (0, y.canDragX)(this) && f ? this.state.x : k.x, y: (0, y.canDragY)(this) && f ? this.state.y : k.y };
            this.state.isElementSVG ? c = (0, b.createSVGTransform)(U, X) : me = (0, b.createCSSTransform)(U, X);
            var F = (0, m.default)(Te.props.className || "", Pe, (ce(ie = {}, Se, this.state.dragging), ce(ie, ze, this.state.dragged), ie));
            return u.createElement(C.default, j({}, q, { onStart: this.onDragStart, onDrag: this.onDrag, onStop: this.onDragStop }), u.cloneElement(u.Children.only(Te), { className: F, style: I(I({}, Te.props.style), me), transform: c }));
          } }]), R;
        }(u.Component);
        i.default = ye, ce(ye, "displayName", "Draggable"), ce(ye, "propTypes", I(I({}, C.default.propTypes), {}, { axis: r.default.oneOf(["both", "x", "y", "none"]), bounds: r.default.oneOfType([r.default.shape({ left: r.default.number, right: r.default.number, top: r.default.number, bottom: r.default.number }), r.default.string, r.default.oneOf([!1])]), defaultClassName: r.default.string, defaultClassNameDragging: r.default.string, defaultClassNameDragged: r.default.string, defaultPosition: r.default.shape({ x: r.default.number, y: r.default.number }), positionOffset: r.default.shape({ x: r.default.oneOfType([r.default.number, r.default.string]), y: r.default.oneOfType([r.default.number, r.default.string]) }), position: r.default.shape({ x: r.default.number, y: r.default.number }), className: v.dontSetMe, style: v.dontSetMe, transform: v.dontSetMe })), ce(ye, "defaultProps", I(I({}, C.default.defaultProps), {}, { axis: "both", bounds: !1, defaultClassName: "react-draggable", defaultClassNameDragging: "react-draggable-dragging", defaultClassNameDragged: "react-draggable-dragged", defaultPosition: { x: 0, y: 0 }, position: null, scale: 1 }));
      }, function(p, i, l) {
        var u = l(54);
        function r() {
        }
        function _() {
        }
        _.resetWarningCache = r, p.exports = function() {
          function m(v, C, x, N, G, K) {
            if (K !== u) {
              var j = new Error("Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types");
              throw j.name = "Invariant Violation", j;
            }
          }
          function b() {
            return m;
          }
          m.isRequired = m;
          var y = { array: m, bigint: m, bool: m, func: m, number: m, object: m, string: m, symbol: m, any: m, arrayOf: b, element: m, elementType: m, instanceOf: b, node: m, objectOf: b, oneOf: b, oneOfType: b, shape: b, exact: b, checkPropTypes: _, resetWarningCache: r };
          return y.PropTypes = y, y;
        };
      }, function(p, i, l) {
        p.exports = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
      }, function(p, i, l) {
        var u;
        (function() {
          var r = {}.hasOwnProperty;
          function _() {
            for (var m = [], b = 0; b < arguments.length; b++) {
              var y = arguments[b];
              if (y) {
                var v = typeof y;
                if (v === "string" || v === "number") m.push(y);
                else if (Array.isArray(y)) {
                  if (y.length) {
                    var C = _.apply(null, y);
                    C && m.push(C);
                  }
                } else if (v === "object") if (y.toString === Object.prototype.toString) for (var x in y) r.call(y, x) && y[x] && m.push(x);
                else m.push(y.toString());
              }
            }
            return m.join(" ");
          }
          p.exports ? (_.default = _, p.exports = _) : (u = (function() {
            return _;
          }).apply(i, [])) === void 0 || (p.exports = u);
        })();
      }, function(p, i, l) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.getPrefix = r, i.browserPrefixToKey = _, i.browserPrefixToStyle = function(b, y) {
          return y ? "-".concat(y.toLowerCase(), "-").concat(b) : b;
        }, i.default = void 0;
        var u = ["Moz", "Webkit", "O", "ms"];
        function r() {
          var b = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "transform";
          if (typeof window > "u" || window.document === void 0) return "";
          var y = window.document.documentElement.style;
          if (b in y) return "";
          for (var v = 0; v < u.length; v++) if (_(b, u[v]) in y) return u[v];
          return "";
        }
        function _(b, y) {
          return y ? "".concat(y).concat(function(v) {
            for (var C = "", x = !0, N = 0; N < v.length; N++) x ? (C += v[N].toUpperCase(), x = !1) : v[N] === "-" ? x = !0 : C += v[N];
            return C;
          }(b)) : b;
        }
        var m = r();
        i.default = m;
      }, function(p, i, l) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.default = void 0;
        var u = function(ne) {
          if (ne && ne.__esModule) return ne;
          if (ne === null || N(ne) !== "object" && typeof ne != "function") return { default: ne };
          var ce = x();
          if (ce && ce.has(ne)) return ce.get(ne);
          var ye = {}, ee = Object.defineProperty && Object.getOwnPropertyDescriptor;
          for (var de in ne) if (Object.prototype.hasOwnProperty.call(ne, de)) {
            var R = ee ? Object.getOwnPropertyDescriptor(ne, de) : null;
            R && (R.get || R.set) ? Object.defineProperty(ye, de, R) : ye[de] = ne[de];
          }
          return ye.default = ne, ce && ce.set(ne, ye), ye;
        }(l(0)), r = C(l(18)), _ = C(l(12)), m = l(32), b = l(40), y = l(20), v = C(l(41));
        function C(ne) {
          return ne && ne.__esModule ? ne : { default: ne };
        }
        function x() {
          if (typeof WeakMap != "function") return null;
          var ne = /* @__PURE__ */ new WeakMap();
          return x = function() {
            return ne;
          }, ne;
        }
        function N(ne) {
          return (N = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(ce) {
            return typeof ce;
          } : function(ce) {
            return ce && typeof Symbol == "function" && ce.constructor === Symbol && ce !== Symbol.prototype ? "symbol" : typeof ce;
          })(ne);
        }
        function G(ne, ce) {
          return function(ye) {
            if (Array.isArray(ye)) return ye;
          }(ne) || function(ye, ee) {
            if (!(typeof Symbol > "u" || !(Symbol.iterator in Object(ye)))) {
              var de = [], R = !0, ie = !1, be = void 0;
              try {
                for (var Te, ke = ye[Symbol.iterator](); !(R = (Te = ke.next()).done) && (de.push(Te.value), !ee || de.length !== ee); R = !0) ;
              } catch (Pe) {
                ie = !0, be = Pe;
              } finally {
                try {
                  R || ke.return == null || ke.return();
                } finally {
                  if (ie) throw be;
                }
              }
              return de;
            }
          }(ne, ce) || function(ye, ee) {
            if (ye) {
              if (typeof ye == "string") return K(ye, ee);
              var de = Object.prototype.toString.call(ye).slice(8, -1);
              if (de === "Object" && ye.constructor && (de = ye.constructor.name), de === "Map" || de === "Set") return Array.from(ye);
              if (de === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(de)) return K(ye, ee);
            }
          }(ne, ce) || function() {
            throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
          }();
        }
        function K(ne, ce) {
          (ce == null || ce > ne.length) && (ce = ne.length);
          for (var ye = 0, ee = new Array(ce); ye < ce; ye++) ee[ye] = ne[ye];
          return ee;
        }
        function j(ne, ce) {
          if (!(ne instanceof ce)) throw new TypeError("Cannot call a class as a function");
        }
        function V(ne, ce) {
          for (var ye = 0; ye < ce.length; ye++) {
            var ee = ce[ye];
            ee.enumerable = ee.enumerable || !1, ee.configurable = !0, "value" in ee && (ee.writable = !0), Object.defineProperty(ne, ee.key, ee);
          }
        }
        function P(ne, ce) {
          return (P = Object.setPrototypeOf || function(ye, ee) {
            return ye.__proto__ = ee, ye;
          })(ne, ce);
        }
        function M(ne) {
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
            var ye, ee = J(ne);
            if (ce) {
              var de = J(this).constructor;
              ye = Reflect.construct(ee, arguments, de);
            } else ye = ee.apply(this, arguments);
            return B(this, ye);
          };
        }
        function B(ne, ce) {
          return !ce || N(ce) !== "object" && typeof ce != "function" ? I(ne) : ce;
        }
        function I(ne) {
          if (ne === void 0) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
          return ne;
        }
        function J(ne) {
          return (J = Object.setPrototypeOf ? Object.getPrototypeOf : function(ce) {
            return ce.__proto__ || Object.getPrototypeOf(ce);
          })(ne);
        }
        function Q(ne, ce, ye) {
          return ce in ne ? Object.defineProperty(ne, ce, { value: ye, enumerable: !0, configurable: !0, writable: !0 }) : ne[ce] = ye, ne;
        }
        var z = { start: "touchstart", move: "touchmove", stop: "touchend" }, A = { start: "mousedown", move: "mousemove", stop: "mouseup" }, ae = A, le = function(ne) {
          (function(R, ie) {
            if (typeof ie != "function" && ie !== null) throw new TypeError("Super expression must either be null or a function");
            R.prototype = Object.create(ie && ie.prototype, { constructor: { value: R, writable: !0, configurable: !0 } }), ie && P(R, ie);
          })(de, ne);
          var ce, ye, ee = M(de);
          function de() {
            var R;
            j(this, de);
            for (var ie = arguments.length, be = new Array(ie), Te = 0; Te < ie; Te++) be[Te] = arguments[Te];
            return Q(I(R = ee.call.apply(ee, [this].concat(be))), "state", { dragging: !1, lastX: NaN, lastY: NaN, touchIdentifier: null }), Q(I(R), "mounted", !1), Q(I(R), "handleDragStart", function(ke) {
              if (R.props.onMouseDown(ke), !R.props.allowAnyClick && typeof ke.button == "number" && ke.button !== 0) return !1;
              var Pe = R.findDOMNode();
              if (!Pe || !Pe.ownerDocument || !Pe.ownerDocument.body) throw new Error("<DraggableCore> not mounted on DragStart!");
              var Se = Pe.ownerDocument;
              if (!(R.props.disabled || !(ke.target instanceof Se.defaultView.Node) || R.props.handle && !(0, m.matchesSelectorAndParentsTo)(ke.target, R.props.handle, Pe) || R.props.cancel && (0, m.matchesSelectorAndParentsTo)(ke.target, R.props.cancel, Pe))) {
                ke.type === "touchstart" && ke.preventDefault();
                var ze = (0, m.getTouchIdentifier)(ke);
                R.setState({ touchIdentifier: ze });
                var Je = (0, b.getControlPosition)(ke, ze, I(R));
                if (Je != null) {
                  var X = Je.x, q = Je.y, me = (0, b.createCoreData)(I(R), X, q);
                  (0, v.default)("DraggableCore: handleDragStart: %j", me), (0, v.default)("calling", R.props.onStart), R.props.onStart(ke, me) !== !1 && R.mounted !== !1 && (R.props.enableUserSelectHack && (0, m.addUserSelectStyles)(Se), R.setState({ dragging: !0, lastX: X, lastY: q }), (0, m.addEvent)(Se, ae.move, R.handleDrag), (0, m.addEvent)(Se, ae.stop, R.handleDragStop));
                }
              }
            }), Q(I(R), "handleDrag", function(ke) {
              var Pe = (0, b.getControlPosition)(ke, R.state.touchIdentifier, I(R));
              if (Pe != null) {
                var Se = Pe.x, ze = Pe.y;
                if (Array.isArray(R.props.grid)) {
                  var Je = Se - R.state.lastX, X = ze - R.state.lastY, q = G((0, b.snapToGrid)(R.props.grid, Je, X), 2);
                  if (Je = q[0], X = q[1], !Je && !X) return;
                  Se = R.state.lastX + Je, ze = R.state.lastY + X;
                }
                var me = (0, b.createCoreData)(I(R), Se, ze);
                if ((0, v.default)("DraggableCore: handleDrag: %j", me), R.props.onDrag(ke, me) !== !1 && R.mounted !== !1) R.setState({ lastX: Se, lastY: ze });
                else try {
                  R.handleDragStop(new MouseEvent("mouseup"));
                } catch {
                  var c = document.createEvent("MouseEvents");
                  c.initMouseEvent("mouseup", !0, !0, window, 0, 0, 0, 0, 0, !1, !1, !1, !1, 0, null), R.handleDragStop(c);
                }
              }
            }), Q(I(R), "handleDragStop", function(ke) {
              if (R.state.dragging) {
                var Pe = (0, b.getControlPosition)(ke, R.state.touchIdentifier, I(R));
                if (Pe != null) {
                  var Se = Pe.x, ze = Pe.y, Je = (0, b.createCoreData)(I(R), Se, ze);
                  if (R.props.onStop(ke, Je) === !1 || R.mounted === !1) return !1;
                  var X = R.findDOMNode();
                  X && R.props.enableUserSelectHack && (0, m.removeUserSelectStyles)(X.ownerDocument), (0, v.default)("DraggableCore: handleDragStop: %j", Je), R.setState({ dragging: !1, lastX: NaN, lastY: NaN }), X && ((0, v.default)("DraggableCore: Removing handlers"), (0, m.removeEvent)(X.ownerDocument, ae.move, R.handleDrag), (0, m.removeEvent)(X.ownerDocument, ae.stop, R.handleDragStop));
                }
              }
            }), Q(I(R), "onMouseDown", function(ke) {
              return ae = A, R.handleDragStart(ke);
            }), Q(I(R), "onMouseUp", function(ke) {
              return ae = A, R.handleDragStop(ke);
            }), Q(I(R), "onTouchStart", function(ke) {
              return ae = z, R.handleDragStart(ke);
            }), Q(I(R), "onTouchEnd", function(ke) {
              return ae = z, R.handleDragStop(ke);
            }), R;
          }
          return ce = de, (ye = [{ key: "componentDidMount", value: function() {
            this.mounted = !0;
            var R = this.findDOMNode();
            R && (0, m.addEvent)(R, z.start, this.onTouchStart, { passive: !1 });
          } }, { key: "componentWillUnmount", value: function() {
            this.mounted = !1;
            var R = this.findDOMNode();
            if (R) {
              var ie = R.ownerDocument;
              (0, m.removeEvent)(ie, A.move, this.handleDrag), (0, m.removeEvent)(ie, z.move, this.handleDrag), (0, m.removeEvent)(ie, A.stop, this.handleDragStop), (0, m.removeEvent)(ie, z.stop, this.handleDragStop), (0, m.removeEvent)(R, z.start, this.onTouchStart, { passive: !1 }), this.props.enableUserSelectHack && (0, m.removeUserSelectStyles)(ie);
            }
          } }, { key: "findDOMNode", value: function() {
            return this.props.nodeRef ? this.props.nodeRef.current : _.default.findDOMNode(this);
          } }, { key: "render", value: function() {
            return u.cloneElement(u.Children.only(this.props.children), { onMouseDown: this.onMouseDown, onMouseUp: this.onMouseUp, onTouchEnd: this.onTouchEnd });
          } }]) && V(ce.prototype, ye), de;
        }(u.Component);
        i.default = le, Q(le, "displayName", "DraggableCore"), Q(le, "propTypes", { allowAnyClick: r.default.bool, disabled: r.default.bool, enableUserSelectHack: r.default.bool, offsetParent: function(ne, ce) {
          if (ne[ce] && ne[ce].nodeType !== 1) throw new Error("Draggable's offsetParent must be a DOM Node.");
        }, grid: r.default.arrayOf(r.default.number), handle: r.default.string, cancel: r.default.string, nodeRef: r.default.object, onStart: r.default.func, onDrag: r.default.func, onStop: r.default.func, onMouseDown: r.default.func, scale: r.default.number, className: y.dontSetMe, style: y.dontSetMe, transform: y.dontSetMe }), Q(le, "defaultProps", { allowAnyClick: !1, cancel: null, disabled: !1, enableUserSelectHack: !0, offsetParent: null, handle: null, grid: null, transform: null, onStart: function() {
        }, onDrag: function() {
        }, onStop: function() {
        }, onMouseDown: function() {
        }, scale: 1 });
      }, function(p, i, l) {
        var u = l(6), r = l(59);
        typeof (r = r.__esModule ? r.default : r) == "string" && (r = [[p.i, r, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        u(r, _), p.exports = r.locals || {};
      }, function(p, i, l) {
        (p.exports = l(7)(!1)).push([p.i, ".ck-inspector{--ck-inspector-color-tab-background-hover:rgba(0,0,0,0.07);--ck-inspector-color-tab-active-border:#0dacef }.ck-inspector .ck-inspector-horizontal-nav{display:flex;flex-direction:row;user-select:none;align-self:stretch}.ck-inspector .ck-inspector-horizontal-nav .ck-inspector-horizontal-nav__item{-webkit-appearance:none;background:none;border:0;border-bottom:2px solid transparent;padding:.5em 1em;align-self:stretch}.ck-inspector .ck-inspector-horizontal-nav .ck-inspector-horizontal-nav__item:hover{background:var(--ck-inspector-color-tab-background-hover)}.ck-inspector .ck-inspector-horizontal-nav .ck-inspector-horizontal-nav__item.ck-inspector-horizontal-nav__item_active{border-bottom-color:var(--ck-inspector-color-tab-active-border)}", ""]);
      }, function(p, i, l) {
        var u = l(6), r = l(61);
        typeof (r = r.__esModule ? r.default : r) == "string" && (r = [[p.i, r, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        u(r, _), p.exports = r.locals || {};
      }, function(p, i, l) {
        (p.exports = l(7)(!1)).push([p.i, ".ck-inspector{--ck-inspector-navbox-empty-background:#fafafa}.ck-inspector .ck-inspector-navbox{display:flex;flex-direction:column;height:100%;align-items:stretch}.ck-inspector .ck-inspector-navbox .ck-inspector-navbox__navigation{display:flex;flex-direction:row;flex-wrap:nowrap;align-items:stretch;min-height:30px;max-height:30px;border-bottom:1px solid var(--ck-inspector-color-border);width:100%;user-select:none;align-items:center}.ck-inspector .ck-inspector-navbox .ck-inspector-navbox__content{display:flex;flex-direction:row;height:100%;overflow:hidden}", ""]);
      }, function(p, i, l) {
        var u = l(6), r = l(63);
        typeof (r = r.__esModule ? r.default : r) == "string" && (r = [[p.i, r, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        u(r, _), p.exports = r.locals || {};
      }, function(p, i, l) {
        (p.exports = l(7)(!1)).push([p.i, ".ck-inspector{--ck-inspector-icon-size:19px;--ck-inspector-button-size:calc(4px + var(--ck-inspector-icon-size));--ck-inspector-color-button:#777;--ck-inspector-color-button-hover:#222;--ck-inspector-color-button-on:#0f79e2}.ck-inspector .ck-inspector-button{width:var(--ck-inspector-button-size);height:var(--ck-inspector-button-size);border:0;overflow:hidden;border-radius:2px;padding:2px;color:var(--ck-inspector-color-button)}.ck-inspector .ck-inspector-button.ck-inspector-button_on,.ck-inspector .ck-inspector-button.ck-inspector-button_on:hover{color:var(--ck-inspector-color-button-on);opacity:1}.ck-inspector .ck-inspector-button.ck-inspector-button_disabled{opacity:.3}.ck-inspector .ck-inspector-button>span{display:none}.ck-inspector .ck-inspector-button:hover{color:var(--ck-inspector-color-button-hover)}.ck-inspector .ck-inspector-button svg{width:var(--ck-inspector-icon-size);height:var(--ck-inspector-icon-size)}.ck-inspector .ck-inspector-button svg,.ck-inspector .ck-inspector-button svg *{fill:currentColor}", ""]);
      }, function(p, i, l) {
        var u = l(6), r = l(65);
        typeof (r = r.__esModule ? r.default : r) == "string" && (r = [[p.i, r, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        u(r, _), p.exports = r.locals || {};
      }, function(p, i, l) {
        (p.exports = l(7)(!1)).push([p.i, ".ck-inspector{--ck-inspector-explorer-width:300px}.ck-inspector .ck-inspector-pane{display:flex;width:100%}.ck-inspector .ck-inspector-pane.ck-inspector-pane_empty{align-items:center;justify-content:center;padding:1em;background:var(--ck-inspector-navbox-empty-background)}.ck-inspector .ck-inspector-pane.ck-inspector-pane_empty p{align-self:center;width:100%;text-align:center}.ck-inspector .ck-inspector-pane>.ck-inspector-navbox:last-child{min-width:var(--ck-inspector-explorer-width);width:var(--ck-inspector-explorer-width)}.ck-inspector .ck-inspector-pane.ck-inspector-pane_vsplit>.ck-inspector-navbox:first-child{border-right:1px solid var(--ck-inspector-color-border);flex:1 1 auto;overflow:hidden}.ck-inspector .ck-inspector-pane.ck-inspector-pane_vsplit>.ck-inspector-navbox:first-child .ck-inspector-navbox__navigation{align-items:center}.ck-inspector .ck-inspector-pane.ck-inspector-pane_vsplit>.ck-inspector-navbox:first-child .ck-inspector-tree__config label{margin:0 .5em}.ck-inspector .ck-inspector-pane.ck-inspector-pane_vsplit>.ck-inspector-navbox:first-child .ck-inspector-tree__config input+label{margin-right:1em}", ""]);
      }, function(p, i, l) {
        var u = l(6), r = l(67);
        typeof (r = r.__esModule ? r.default : r) == "string" && (r = [[p.i, r, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        u(r, _), p.exports = r.locals || {};
      }, function(p, i, l) {
        (p.exports = l(7)(!1)).push([p.i, ".ck-inspector-side-pane{position:relative}", ""]);
      }, function(p, i, l) {
        var u = l(6), r = l(69);
        typeof (r = r.__esModule ? r.default : r) == "string" && (r = [[p.i, r, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        u(r, _), p.exports = r.locals || {};
      }, function(p, i, l) {
        (p.exports = l(7)(!1)).push([p.i, ".ck-inspector .ck-inspector-checkbox{vertical-align:middle}", ""]);
      }, function(p, i, l) {
        var u = l(6), r = l(71);
        typeof (r = r.__esModule ? r.default : r) == "string" && (r = [[p.i, r, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        u(r, _), p.exports = r.locals || {};
      }, function(p, i, l) {
        (p.exports = l(7)(!1)).push([p.i, '.ck-inspector{--ck-inspector-color-property-list-property-name:#d0363f;--ck-inspector-color-property-list-property-value-true:green;--ck-inspector-color-property-list-property-value-false:red;--ck-inspector-color-property-list-property-value-unknown:#888;--ck-inspector-color-property-list-background:#f5f5f5;--ck-inspector-color-property-list-title-collapser:#727272}.ck-inspector .ck-inspector-property-list{display:grid;grid-template-columns:auto 1fr;background:var(--ck-inspector-color-white)}.ck-inspector .ck-inspector-property-list>:nth-of-type(odd){background:var(--ck-inspector-color-property-list-background)}.ck-inspector .ck-inspector-property-list>:nth-of-type(2n){background:var(--ck-inspector-color-white)}.ck-inspector .ck-inspector-property-list dt{padding:0 .7em 0 1.2em;min-width:15em}.ck-inspector .ck-inspector-property-list dt.ck-inspector-property-list__title_collapsible button{display:inline-block;overflow:hidden;vertical-align:middle;margin-left:-9px;margin-right:.3em;width:0;height:0;border-left:6px solid var(--ck-inspector-color-property-list-title-collapser);border-bottom:3.5px solid transparent;border-right:0 solid transparent;border-top:3.5px solid transparent;transition:transform .2s ease-in-out;transform:rotate(0deg)}.ck-inspector .ck-inspector-property-list dt.ck-inspector-property-list__title_expanded button{transform:rotate(90deg)}.ck-inspector .ck-inspector-property-list dt.ck-inspector-property-list__title_collapsed+dd+.ck-inspector-property-list{display:none}.ck-inspector .ck-inspector-property-list dt .ck-inspector-property-list__title__color-box{width:12px;height:12px;vertical-align:text-top;display:inline-block;margin-right:3px;border-radius:2px;border:1px solid #000}.ck-inspector .ck-inspector-property-list dt.ck-inspector-property-list__title_clickable label:hover{text-decoration:underline;cursor:pointer}.ck-inspector .ck-inspector-property-list dt label{color:var(--ck-inspector-color-property-list-property-name)}.ck-inspector .ck-inspector-property-list dd{padding-right:.7em}.ck-inspector .ck-inspector-property-list dd input{width:100%}.ck-inspector .ck-inspector-property-list dd input[value=false]{color:var(--ck-inspector-color-property-list-property-value-false)}.ck-inspector .ck-inspector-property-list dd input[value=true]{color:var(--ck-inspector-color-property-list-property-value-true)}.ck-inspector .ck-inspector-property-list dd input[value="function() {…}"],.ck-inspector .ck-inspector-property-list dd input[value=undefined]{color:var(--ck-inspector-color-property-list-property-value-unknown)}.ck-inspector .ck-inspector-property-list dd input[value="function() {…}"]{font-style:italic}.ck-inspector .ck-inspector-property-list .ck-inspector-property-list{grid-column:1/-1;margin-left:1em;background:transparent}.ck-inspector .ck-inspector-property-list .ck-inspector-property-list>:nth-of-type(2n),.ck-inspector .ck-inspector-property-list .ck-inspector-property-list>:nth-of-type(odd){background:transparent}', ""]);
      }, function(p, i, l) {
        var u = l(6), r = l(73);
        typeof (r = r.__esModule ? r.default : r) == "string" && (r = [[p.i, r, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        u(r, _), p.exports = r.locals || {};
      }, function(p, i, l) {
        (p.exports = l(7)(!1)).push([p.i, `.ck-inspector .ck-inspector__object-inspector{width:100%;background:var(--ck-inspector-color-white);overflow:auto}.ck-inspector .ck-inspector__object-inspector h2,.ck-inspector .ck-inspector__object-inspector h3{display:flex;flex-direction:row;flex-wrap:nowrap}.ck-inspector .ck-inspector__object-inspector h2{display:flex;align-items:center;padding:1em;overflow:hidden;text-overflow:ellipsis}.ck-inspector .ck-inspector__object-inspector h2>span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;margin-right:auto}.ck-inspector .ck-inspector__object-inspector h2>.ck-inspector-button{flex-shrink:0;margin-left:.5em}.ck-inspector .ck-inspector__object-inspector h2 a{font-weight:700;color:var(--ck-inspector-color-tree-node-name)}.ck-inspector .ck-inspector__object-inspector h2 a,.ck-inspector .ck-inspector__object-inspector h2 a>*{cursor:pointer}.ck-inspector .ck-inspector__object-inspector h2 em:after,.ck-inspector .ck-inspector__object-inspector h2 em:before{content:'"'}.ck-inspector .ck-inspector__object-inspector h3{display:flex;align-items:center;font-size:12px;padding:.4em .7em}.ck-inspector .ck-inspector__object-inspector h3 a{color:inherit;font-weight:700;margin-right:auto}.ck-inspector .ck-inspector__object-inspector h3 .ck-inspector-button{visibility:hidden}.ck-inspector .ck-inspector__object-inspector h3:hover .ck-inspector-button{visibility:visible}.ck-inspector .ck-inspector__object-inspector hr{border-top:1px solid var(--ck-inspector-color-border)}`, ""]);
      }, function(p, i, l) {
        var u = l(6), r = l(75);
        typeof (r = r.__esModule ? r.default : r) == "string" && (r = [[p.i, r, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        u(r, _), p.exports = r.locals || {};
      }, function(p, i, l) {
        (p.exports = l(7)(!1)).push([p.i, ".ck-inspector-model-tree__hide-markers .ck-inspector-tree__position.ck-inspector-tree__position_marker{display:none}", ""]);
      }, function(p, i) {
        p.exports = function() {
          var l = document.getSelection();
          if (!l.rangeCount) return function() {
          };
          for (var u = document.activeElement, r = [], _ = 0; _ < l.rangeCount; _++) r.push(l.getRangeAt(_));
          switch (u.tagName.toUpperCase()) {
            case "INPUT":
            case "TEXTAREA":
              u.blur();
              break;
            default:
              u = null;
          }
          return l.removeAllRanges(), function() {
            l.type === "Caret" && l.removeAllRanges(), l.rangeCount || r.forEach(function(m) {
              l.addRange(m);
            }), u && u.focus();
          };
        };
      }, function(p, i, l) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.bodyOpenClassName = i.portalClassName = void 0;
        var u = Object.assign || function(A) {
          for (var ae = 1; ae < arguments.length; ae++) {
            var le = arguments[ae];
            for (var ne in le) Object.prototype.hasOwnProperty.call(le, ne) && (A[ne] = le[ne]);
          }
          return A;
        }, r = /* @__PURE__ */ function() {
          function A(ae, le) {
            for (var ne = 0; ne < le.length; ne++) {
              var ce = le[ne];
              ce.enumerable = ce.enumerable || !1, ce.configurable = !0, "value" in ce && (ce.writable = !0), Object.defineProperty(ae, ce.key, ce);
            }
          }
          return function(ae, le, ne) {
            return le && A(ae.prototype, le), ne && A(ae, ne), ae;
          };
        }(), _ = l(0), m = K(_), b = K(l(12)), y = K(l(18)), v = K(l(78)), C = function(A) {
          if (A && A.__esModule) return A;
          var ae = {};
          if (A != null) for (var le in A) Object.prototype.hasOwnProperty.call(A, le) && (ae[le] = A[le]);
          return ae.default = A, ae;
        }(l(43)), x = l(36), N = K(x), G = l(85);
        function K(A) {
          return A && A.__esModule ? A : { default: A };
        }
        function j(A, ae) {
          if (!(A instanceof ae)) throw new TypeError("Cannot call a class as a function");
        }
        function V(A, ae) {
          if (!A) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
          return !ae || typeof ae != "object" && typeof ae != "function" ? A : ae;
        }
        var P = i.portalClassName = "ReactModalPortal", M = i.bodyOpenClassName = "ReactModal__Body--open", B = x.canUseDOM && b.default.createPortal !== void 0, I = function(A) {
          return document.createElement(A);
        }, J = function() {
          return B ? b.default.createPortal : b.default.unstable_renderSubtreeIntoContainer;
        };
        function Q(A) {
          return A();
        }
        var z = function(A) {
          function ae() {
            var le, ne, ce;
            j(this, ae);
            for (var ye = arguments.length, ee = Array(ye), de = 0; de < ye; de++) ee[de] = arguments[de];
            return ne = ce = V(this, (le = ae.__proto__ || Object.getPrototypeOf(ae)).call.apply(le, [this].concat(ee))), ce.removePortal = function() {
              !B && b.default.unmountComponentAtNode(ce.node);
              var R = Q(ce.props.parentSelector);
              R && R.contains(ce.node) ? R.removeChild(ce.node) : console.warn('React-Modal: "parentSelector" prop did not returned any DOM element. Make sure that the parent element is unmounted to avoid any memory leaks.');
            }, ce.portalRef = function(R) {
              ce.portal = R;
            }, ce.renderPortal = function(R) {
              var ie = J()(ce, m.default.createElement(v.default, u({ defaultStyles: ae.defaultStyles }, R)), ce.node);
              ce.portalRef(ie);
            }, V(ce, ne);
          }
          return function(le, ne) {
            if (typeof ne != "function" && ne !== null) throw new TypeError("Super expression must either be null or a function, not " + typeof ne);
            le.prototype = Object.create(ne && ne.prototype, { constructor: { value: le, enumerable: !1, writable: !0, configurable: !0 } }), ne && (Object.setPrototypeOf ? Object.setPrototypeOf(le, ne) : le.__proto__ = ne);
          }(ae, A), r(ae, [{ key: "componentDidMount", value: function() {
            x.canUseDOM && (B || (this.node = I("div")), this.node.className = this.props.portalClassName, Q(this.props.parentSelector).appendChild(this.node), !B && this.renderPortal(this.props));
          } }, { key: "getSnapshotBeforeUpdate", value: function(le) {
            return { prevParent: Q(le.parentSelector), nextParent: Q(this.props.parentSelector) };
          } }, { key: "componentDidUpdate", value: function(le, ne, ce) {
            if (x.canUseDOM) {
              var ye = this.props, ee = ye.isOpen, de = ye.portalClassName;
              le.portalClassName !== de && (this.node.className = de);
              var R = ce.prevParent, ie = ce.nextParent;
              ie !== R && (R.removeChild(this.node), ie.appendChild(this.node)), (le.isOpen || ee) && !B && this.renderPortal(this.props);
            }
          } }, { key: "componentWillUnmount", value: function() {
            if (x.canUseDOM && this.node && this.portal) {
              var le = this.portal.state, ne = Date.now(), ce = le.isOpen && this.props.closeTimeoutMS && (le.closesAt || ne + this.props.closeTimeoutMS);
              ce ? (le.beforeClose || this.portal.closeWithTimeout(), setTimeout(this.removePortal, ce - ne)) : this.removePortal();
            }
          } }, { key: "render", value: function() {
            return x.canUseDOM && B ? (!this.node && B && (this.node = I("div")), J()(m.default.createElement(v.default, u({ ref: this.portalRef, defaultStyles: ae.defaultStyles }, this.props)), this.node)) : null;
          } }], [{ key: "setAppElement", value: function(le) {
            C.setElement(le);
          } }]), ae;
        }(_.Component);
        z.propTypes = { isOpen: y.default.bool.isRequired, style: y.default.shape({ content: y.default.object, overlay: y.default.object }), portalClassName: y.default.string, bodyOpenClassName: y.default.string, htmlOpenClassName: y.default.string, className: y.default.oneOfType([y.default.string, y.default.shape({ base: y.default.string.isRequired, afterOpen: y.default.string.isRequired, beforeClose: y.default.string.isRequired })]), overlayClassName: y.default.oneOfType([y.default.string, y.default.shape({ base: y.default.string.isRequired, afterOpen: y.default.string.isRequired, beforeClose: y.default.string.isRequired })]), appElement: y.default.oneOfType([y.default.instanceOf(N.default), y.default.instanceOf(x.SafeHTMLCollection), y.default.instanceOf(x.SafeNodeList), y.default.arrayOf(y.default.instanceOf(N.default))]), onAfterOpen: y.default.func, onRequestClose: y.default.func, closeTimeoutMS: y.default.number, ariaHideApp: y.default.bool, shouldFocusAfterRender: y.default.bool, shouldCloseOnOverlayClick: y.default.bool, shouldReturnFocusAfterClose: y.default.bool, preventScroll: y.default.bool, parentSelector: y.default.func, aria: y.default.object, data: y.default.object, role: y.default.string, contentLabel: y.default.string, shouldCloseOnEsc: y.default.bool, overlayRef: y.default.func, contentRef: y.default.func, id: y.default.string, overlayElement: y.default.func, contentElement: y.default.func }, z.defaultProps = { isOpen: !1, portalClassName: P, bodyOpenClassName: M, role: "dialog", ariaHideApp: !0, closeTimeoutMS: 0, shouldFocusAfterRender: !0, shouldCloseOnEsc: !0, shouldCloseOnOverlayClick: !0, shouldReturnFocusAfterClose: !0, preventScroll: !1, parentSelector: function() {
          return document.body;
        }, overlayElement: function(A, ae) {
          return m.default.createElement("div", A, ae);
        }, contentElement: function(A, ae) {
          return m.default.createElement("div", A, ae);
        } }, z.defaultStyles = { overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(255, 255, 255, 0.75)" }, content: { position: "absolute", top: "40px", left: "40px", right: "40px", bottom: "40px", border: "1px solid #ccc", background: "#fff", overflow: "auto", WebkitOverflowScrolling: "touch", borderRadius: "4px", outline: "none", padding: "20px" } }, (0, G.polyfill)(z), i.default = z;
      }, function(p, i, l) {
        Object.defineProperty(i, "__esModule", { value: !0 });
        var u = Object.assign || function(I) {
          for (var J = 1; J < arguments.length; J++) {
            var Q = arguments[J];
            for (var z in Q) Object.prototype.hasOwnProperty.call(Q, z) && (I[z] = Q[z]);
          }
          return I;
        }, r = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(I) {
          return typeof I;
        } : function(I) {
          return I && typeof Symbol == "function" && I.constructor === Symbol && I !== Symbol.prototype ? "symbol" : typeof I;
        }, _ = /* @__PURE__ */ function() {
          function I(J, Q) {
            for (var z = 0; z < Q.length; z++) {
              var A = Q[z];
              A.enumerable = A.enumerable || !1, A.configurable = !0, "value" in A && (A.writable = !0), Object.defineProperty(J, A.key, A);
            }
          }
          return function(J, Q, z) {
            return Q && I(J.prototype, Q), z && I(J, z), J;
          };
        }(), m = l(0), b = V(l(18)), y = j(l(79)), v = V(l(80)), C = j(l(43)), x = j(l(83)), N = l(36), G = V(N), K = V(l(44));
        function j(I) {
          if (I && I.__esModule) return I;
          var J = {};
          if (I != null) for (var Q in I) Object.prototype.hasOwnProperty.call(I, Q) && (J[Q] = I[Q]);
          return J.default = I, J;
        }
        function V(I) {
          return I && I.__esModule ? I : { default: I };
        }
        l(84);
        var P = { overlay: "ReactModal__Overlay", content: "ReactModal__Content" }, M = 0, B = function(I) {
          function J(Q) {
            (function(A, ae) {
              if (!(A instanceof ae)) throw new TypeError("Cannot call a class as a function");
            })(this, J);
            var z = function(A, ae) {
              if (!A) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
              return !ae || typeof ae != "object" && typeof ae != "function" ? A : ae;
            }(this, (J.__proto__ || Object.getPrototypeOf(J)).call(this, Q));
            return z.setOverlayRef = function(A) {
              z.overlay = A, z.props.overlayRef && z.props.overlayRef(A);
            }, z.setContentRef = function(A) {
              z.content = A, z.props.contentRef && z.props.contentRef(A);
            }, z.afterClose = function() {
              var A = z.props, ae = A.appElement, le = A.ariaHideApp, ne = A.htmlOpenClassName, ce = A.bodyOpenClassName;
              ce && x.remove(document.body, ce), ne && x.remove(document.getElementsByTagName("html")[0], ne), le && M > 0 && (M -= 1) === 0 && C.show(ae), z.props.shouldFocusAfterRender && (z.props.shouldReturnFocusAfterClose ? (y.returnFocus(z.props.preventScroll), y.teardownScopedFocus()) : y.popWithoutFocus()), z.props.onAfterClose && z.props.onAfterClose(), K.default.deregister(z);
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
            }, z.buildClassName = function(A, ae) {
              var le = (ae === void 0 ? "undefined" : r(ae)) === "object" ? ae : { base: P[A], afterOpen: P[A] + "--after-open", beforeClose: P[A] + "--before-close" }, ne = le.base;
              return z.state.afterOpen && (ne = ne + " " + le.afterOpen), z.state.beforeClose && (ne = ne + " " + le.beforeClose), typeof ae == "string" && ae ? ne + " " + ae : ne;
            }, z.attributesFromObject = function(A, ae) {
              return Object.keys(ae).reduce(function(le, ne) {
                return le[A + "-" + ne] = ae[ne], le;
              }, {});
            }, z.state = { afterOpen: !1, beforeClose: !1 }, z.shouldClose = null, z.moveFromContentToOverlay = null, z;
          }
          return function(Q, z) {
            if (typeof z != "function" && z !== null) throw new TypeError("Super expression must either be null or a function, not " + typeof z);
            Q.prototype = Object.create(z && z.prototype, { constructor: { value: Q, enumerable: !1, writable: !0, configurable: !0 } }), z && (Object.setPrototypeOf ? Object.setPrototypeOf(Q, z) : Q.__proto__ = z);
          }(J, I), _(J, [{ key: "componentDidMount", value: function() {
            this.props.isOpen && this.open();
          } }, { key: "componentDidUpdate", value: function(Q, z) {
            this.props.isOpen && !Q.isOpen ? this.open() : !this.props.isOpen && Q.isOpen && this.close(), this.props.shouldFocusAfterRender && this.state.isOpen && !z.isOpen && this.focusContent();
          } }, { key: "componentWillUnmount", value: function() {
            this.state.isOpen && this.afterClose(), clearTimeout(this.closeTimer), cancelAnimationFrame(this.openAnimationFrame);
          } }, { key: "beforeOpen", value: function() {
            var Q = this.props, z = Q.appElement, A = Q.ariaHideApp, ae = Q.htmlOpenClassName, le = Q.bodyOpenClassName;
            le && x.add(document.body, le), ae && x.add(document.getElementsByTagName("html")[0], ae), A && (M += 1, C.hide(z)), K.default.register(this);
          } }, { key: "render", value: function() {
            var Q = this.props, z = Q.id, A = Q.className, ae = Q.overlayClassName, le = Q.defaultStyles, ne = Q.children, ce = A ? {} : le.content, ye = ae ? {} : le.overlay;
            if (this.shouldBeClosed()) return null;
            var ee = { ref: this.setOverlayRef, className: this.buildClassName("overlay", ae), style: u({}, ye, this.props.style.overlay), onClick: this.handleOverlayOnClick, onMouseDown: this.handleOverlayOnMouseDown }, de = u({ id: z, ref: this.setContentRef, style: u({}, ce, this.props.style.content), className: this.buildClassName("content", A), tabIndex: "-1", onKeyDown: this.handleKeyDown, onMouseDown: this.handleContentOnMouseDown, onMouseUp: this.handleContentOnMouseUp, onClick: this.handleContentOnClick, role: this.props.role, "aria-label": this.props.contentLabel }, this.attributesFromObject("aria", u({ modal: !0 }, this.props.aria)), this.attributesFromObject("data", this.props.data || {}), { "data-testid": this.props.testId }), R = this.props.contentElement(de, ne);
            return this.props.overlayElement(ee, R);
          } }]), J;
        }(m.Component);
        B.defaultProps = { style: { overlay: {}, content: {} }, defaultStyles: {} }, B.propTypes = { isOpen: b.default.bool.isRequired, defaultStyles: b.default.shape({ content: b.default.object, overlay: b.default.object }), style: b.default.shape({ content: b.default.object, overlay: b.default.object }), className: b.default.oneOfType([b.default.string, b.default.object]), overlayClassName: b.default.oneOfType([b.default.string, b.default.object]), bodyOpenClassName: b.default.string, htmlOpenClassName: b.default.string, ariaHideApp: b.default.bool, appElement: b.default.oneOfType([b.default.instanceOf(G.default), b.default.instanceOf(N.SafeHTMLCollection), b.default.instanceOf(N.SafeNodeList), b.default.arrayOf(b.default.instanceOf(G.default))]), onAfterOpen: b.default.func, onAfterClose: b.default.func, onRequestClose: b.default.func, closeTimeoutMS: b.default.number, shouldFocusAfterRender: b.default.bool, shouldCloseOnOverlayClick: b.default.bool, shouldReturnFocusAfterClose: b.default.bool, preventScroll: b.default.bool, role: b.default.string, contentLabel: b.default.string, aria: b.default.object, data: b.default.object, children: b.default.node, shouldCloseOnEsc: b.default.bool, overlayRef: b.default.func, contentRef: b.default.func, id: b.default.string, overlayElement: b.default.func, contentElement: b.default.func, testId: b.default.string }, i.default = B, p.exports = i.default;
      }, function(p, i, l) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.resetState = function() {
          m = [];
        }, i.log = function() {
        }, i.handleBlur = v, i.handleFocus = C, i.markForFocusLater = function() {
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
          b = x, window.addEventListener ? (window.addEventListener("blur", v, !1), document.addEventListener("focus", C, !0)) : (window.attachEvent("onBlur", v), document.attachEvent("onFocus", C));
        }, i.teardownScopedFocus = function() {
          b = null, window.addEventListener ? (window.removeEventListener("blur", v), document.removeEventListener("focus", C)) : (window.detachEvent("onBlur", v), document.detachEvent("onFocus", C));
        };
        var u, r = l(42), _ = (u = r) && u.__esModule ? u : { default: u }, m = [], b = null, y = !1;
        function v() {
          y = !0;
        }
        function C() {
          if (y) {
            if (y = !1, !b) return;
            setTimeout(function() {
              b.contains(document.activeElement) || ((0, _.default)(b)[0] || b).focus();
            }, 0);
          }
        }
      }, function(p, i, l) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.default = function(m, b) {
          var y = (0, _.default)(m);
          if (!y.length) return void b.preventDefault();
          var v = void 0, C = b.shiftKey, x = y[0], N = y[y.length - 1], G = function V() {
            var P = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : document;
            return P.activeElement.shadowRoot ? V(P.activeElement.shadowRoot) : P.activeElement;
          }();
          if (m === G) {
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
        var u, r = l(42), _ = (u = r) && u.__esModule ? u : { default: u };
        p.exports = i.default;
      }, function(p, i, l) {
        var u = function() {
        };
        p.exports = u;
      }, function(p, i, l) {
        var u;
        (function() {
          var r = !(typeof window > "u" || !window.document || !window.document.createElement), _ = { canUseDOM: r, canUseWorkers: typeof Worker < "u", canUseEventListeners: r && !(!window.addEventListener && !window.attachEvent), canUseViewport: r && !!window.screen };
          (u = (function() {
            return _;
          }).call(i, l, i, p)) === void 0 || (p.exports = u);
        })();
      }, function(p, i, l) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.resetState = function() {
          var m = document.getElementsByTagName("html")[0];
          for (var b in u) _(m, u[b]);
          var y = document.body;
          for (var v in r) _(y, r[v]);
          u = {}, r = {};
        }, i.log = function() {
        };
        var u = {}, r = {};
        function _(m, b) {
          m.classList.remove(b);
        }
        i.add = function(m, b) {
          return y = m.classList, v = m.nodeName.toLowerCase() == "html" ? u : r, void b.split(" ").forEach(function(C) {
            (function(x, N) {
              x[N] || (x[N] = 0), x[N] += 1;
            })(v, C), y.add(C);
          });
          var y, v;
        }, i.remove = function(m, b) {
          return y = m.classList, v = m.nodeName.toLowerCase() == "html" ? u : r, void b.split(" ").forEach(function(C) {
            (function(x, N) {
              x[N] && (x[N] -= 1);
            })(v, C), v[C] === 0 && y.remove(C);
          });
          var y, v;
        };
      }, function(p, i, l) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.resetState = function() {
          for (var C = [m, b], x = 0; x < C.length; x++) {
            var N = C[x];
            N && N.parentNode && N.parentNode.removeChild(N);
          }
          m = b = null, y = [];
        }, i.log = function() {
          console.log("bodyTrap ----------"), console.log(y.length);
          for (var C = [m, b], x = 0; x < C.length; x++) {
            var N = C[x] || {};
            console.log(N.nodeName, N.className, N.id);
          }
          console.log("edn bodyTrap ----------");
        };
        var u, r = l(44), _ = (u = r) && u.__esModule ? u : { default: u }, m = void 0, b = void 0, y = [];
        function v() {
          y.length !== 0 && y[y.length - 1].focusContent();
        }
        _.default.subscribe(function(C, x) {
          m || b || ((m = document.createElement("div")).setAttribute("data-react-modal-body-trap", ""), m.style.position = "absolute", m.style.opacity = "0", m.setAttribute("tabindex", "0"), m.addEventListener("focus", v), (b = m.cloneNode()).addEventListener("focus", v)), (y = x).length > 0 ? (document.body.firstChild !== m && document.body.insertBefore(m, document.body.firstChild), document.body.lastChild !== b && document.body.appendChild(b)) : (m.parentElement && m.parentElement.removeChild(m), b.parentElement && b.parentElement.removeChild(b));
        });
      }, function(p, i, l) {
        function u() {
          var b = this.constructor.getDerivedStateFromProps(this.props, this.state);
          b != null && this.setState(b);
        }
        function r(b) {
          this.setState((function(y) {
            var v = this.constructor.getDerivedStateFromProps(b, y);
            return v ?? null;
          }).bind(this));
        }
        function _(b, y) {
          try {
            var v = this.props, C = this.state;
            this.props = b, this.state = y, this.__reactInternalSnapshotFlag = !0, this.__reactInternalSnapshot = this.getSnapshotBeforeUpdate(v, C);
          } finally {
            this.props = v, this.state = C;
          }
        }
        function m(b) {
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
          if (typeof b.getDerivedStateFromProps == "function" && (y.componentWillMount = u, y.componentWillReceiveProps = r), typeof y.getSnapshotBeforeUpdate == "function") {
            if (typeof y.componentDidUpdate != "function") throw new Error("Cannot polyfill getSnapshotBeforeUpdate() for components that do not define componentDidUpdate() on the prototype");
            y.componentWillUpdate = _;
            var K = y.componentDidUpdate;
            y.componentDidUpdate = function(j, V, P) {
              var M = this.__reactInternalSnapshotFlag ? this.__reactInternalSnapshot : P;
              K.call(this, j, V, M);
            };
          }
          return b;
        }
        l.r(i), l.d(i, "polyfill", function() {
          return m;
        }), u.__suppressDeprecationWarning = !0, r.__suppressDeprecationWarning = !0, _.__suppressDeprecationWarning = !0;
      }, function(p, i, l) {
        var u = l(6), r = l(87);
        typeof (r = r.__esModule ? r.default : r) == "string" && (r = [[p.i, r, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        u(r, _), p.exports = r.locals || {};
      }, function(p, i, l) {
        (p.exports = l(7)(!1)).push([p.i, ".ck-inspector-modal{--ck-inspector-set-data-modal-overlay:rgba(0,0,0,0.5);--ck-inspector-set-data-modal-shadow:rgba(0,0,0,0.06);--ck-inspector-set-data-modal-button-background:#eee;--ck-inspector-set-data-modal-button-background-hover:#ddd;--ck-inspector-set-data-modal-save-button-background:#1976d2;--ck-inspector-set-data-modal-save-button-background-hover:#0b60b5}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal{z-index:999999;position:fixed;inset:0;background-color:var(--ck-inspector-set-data-modal-overlay)}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content{position:absolute;border:1px solid var(--ck-inspector-color-border);background:var(--ck-inspector-color-white);overflow:auto;border-radius:2px;outline:none;box-shadow:0 1px 1px var(--ck-inspector-set-data-modal-shadow),0 2px 2px var(--ck-inspector-set-data-modal-shadow),0 4px 4px var(--ck-inspector-set-data-modal-shadow),0 8px 8px var(--ck-inspector-set-data-modal-shadow),0 16px 16px var(--ck-inspector-set-data-modal-shadow);max-height:calc(100vh - 160px);max-width:calc(100vw - 160px);width:100%;height:100%;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;justify-content:space-between}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content h2{font-size:14px;font-weight:700;margin:0;padding:12px 20px;background:var(--ck-inspector-color-background);border-bottom:1px solid var(--ck-inspector-color-border)}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content textarea{flex-grow:1;margin:20px;border:1px solid var(--ck-inspector-color-border);border-radius:2px;resize:none;padding:10px;font-family:monospace;font-size:14px}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content button{padding:10px 20px;border-radius:2px;font-size:14px;white-space:nowrap;border:1px solid var(--ck-inspector-color-border)}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content button:hover{background:var(--ck-inspector-set-data-modal-button-background-hover)}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons{margin:0 20px 20px;display:flex;justify-content:center}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button+button{margin-left:20px}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button:first-child{margin-right:auto}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button:not(:first-child){flex-basis:20%}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button:last-child{background:var(--ck-inspector-set-data-modal-save-button-background);border-color:var(--ck-inspector-set-data-modal-save-button-background);color:#fff;font-weight:700}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button:last-child:hover{background:var(--ck-inspector-set-data-modal-save-button-background-hover)}", ""]);
      }, function(p, i, l) {
        var u = l(6), r = l(89);
        typeof (r = r.__esModule ? r.default : r) == "string" && (r = [[p.i, r, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        u(r, _), p.exports = r.locals || {};
      }, function(p, i, l) {
        (p.exports = l(7)(!1)).push([p.i, ".ck-inspector .ck-inspector-editor-quick-actions{display:flex;align-content:center;justify-content:center;align-items:center;flex-direction:row;flex-wrap:nowrap}.ck-inspector .ck-inspector-editor-quick-actions>.ck-inspector-button{margin-left:.3em}.ck-inspector .ck-inspector-editor-quick-actions>.ck-inspector-button.ck-inspector-button_data-copied{animation-duration:.5s;animation-name:ck-inspector-bounce-in;color:green}@keyframes ck-inspector-bounce-in{0%{opacity:0;transform:scale3d(.5,.5,.5)}20%{transform:scale3d(1.1,1.1,1.1)}40%{transform:scale3d(.8,.8,.8)}60%{opacity:1;transform:scale3d(1.05,1.05,1.05)}to{opacity:1;transform:scaleX(1)}}", ""]);
      }, function(p, i, l) {
        var u = l(6), r = l(91);
        typeof (r = r.__esModule ? r.default : r) == "string" && (r = [[p.i, r, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        u(r, _), p.exports = r.locals || {};
      }, function(p, i, l) {
        (p.exports = l(7)(!1)).push([p.i, "html body.ck-inspector-body-expanded{margin-bottom:var(--ck-inspector-height)}html body.ck-inspector-body-collapsed{margin-bottom:var(--ck-inspector-collapsed-height)}.ck-inspector-wrapper *{box-sizing:border-box}", ""]);
      }, , , function(p, i, l) {
        l.r(i), l.d(i, "default", function() {
          return $e;
        });
        var u = l(0), r = l.n(u), _ = l(12), m = l.n(_);
        function b(E) {
          return "Minified Redux error #" + E + "; visit https://redux.js.org/Errors?code=" + E + " for the full message or use the non-minified dev environment for full errors. ";
        }
        var y = typeof Symbol == "function" && Symbol.observable || "@@observable", v = function() {
          return Math.random().toString(36).substring(7).split("").join(".");
        }, C = { INIT: "@@redux/INIT" + v(), REPLACE: "@@redux/REPLACE" + v() };
        function x(E) {
          if (typeof E != "object" || E === null) return !1;
          for (var s = E; Object.getPrototypeOf(s) !== null; ) s = Object.getPrototypeOf(s);
          return Object.getPrototypeOf(E) === s;
        }
        function N(E, s, d) {
          var g;
          if (typeof s == "function" && typeof d == "function" || typeof d == "function" && typeof arguments[3] == "function") throw new Error(b(0));
          if (typeof s == "function" && d === void 0 && (d = s, s = void 0), d !== void 0) {
            if (typeof d != "function") throw new Error(b(1));
            return d(N)(E, s);
          }
          if (typeof E != "function") throw new Error(b(2));
          var S = E, O = s, L = [], re = L, fe = !1;
          function pe() {
            re === L && (re = L.slice());
          }
          function Ee() {
            if (fe) throw new Error(b(3));
            return O;
          }
          function Ne(Me) {
            if (typeof Me != "function") throw new Error(b(4));
            if (fe) throw new Error(b(5));
            var Fe = !0;
            return pe(), re.push(Me), function() {
              if (Fe) {
                if (fe) throw new Error(b(6));
                Fe = !1, pe();
                var et = re.indexOf(Me);
                re.splice(et, 1), L = null;
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
            for (var Fe = L = re, et = 0; et < Fe.length; et++)
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
              function qe() {
                et.next && et.next(Ee());
              }
              return qe(), { unsubscribe: Fe(qe) };
            } })[y] = function() {
              return this;
            }, Me;
          }
          return Be({ type: C.INIT }), (g = { dispatch: Be, subscribe: Ne, getState: Ee, replaceReducer: Ie })[y] = Ke, g;
        }
        var G = r.a.createContext(null), K = function(E) {
          E();
        };
        function j() {
          var E = K, s = null, d = null;
          return { clear: function() {
            s = null, d = null;
          }, notify: function() {
            E(function() {
              for (var g = s; g; ) g.callback(), g = g.next;
            });
          }, get: function() {
            for (var g = [], S = s; S; ) g.push(S), S = S.next;
            return g;
          }, subscribe: function(g) {
            var S = !0, O = d = { callback: g, next: null, prev: d };
            return O.prev ? O.prev.next = O : s = O, function() {
              S && s !== null && (S = !1, O.next ? O.next.prev = O.prev : d = O.prev, O.prev ? O.prev.next = O.next : s = O.next);
            };
          } };
        }
        var V = { notify: function() {
        }, get: function() {
          return [];
        } };
        function P(E, s) {
          var d, g = V;
          function S() {
            L.onStateChange && L.onStateChange();
          }
          function O() {
            d || (d = s ? s.addNestedSub(S) : E.subscribe(S), g = j());
          }
          var L = { addNestedSub: function(re) {
            return O(), g.subscribe(re);
          }, notifyNestedSubs: function() {
            g.notify();
          }, handleChangeWrapper: S, isSubscribed: function() {
            return !!d;
          }, trySubscribe: O, tryUnsubscribe: function() {
            d && (d(), d = void 0, g.clear(), g = V);
          }, getListeners: function() {
            return g;
          } };
          return L;
        }
        var M = typeof window < "u" && window.document !== void 0 && window.document.createElement !== void 0 ? u.useLayoutEffect : u.useEffect, B = function(E) {
          var s = E.store, d = E.context, g = E.children, S = Object(u.useMemo)(function() {
            var re = P(s);
            return { store: s, subscription: re };
          }, [s]), O = Object(u.useMemo)(function() {
            return s.getState();
          }, [s]);
          M(function() {
            var re = S.subscription;
            return re.onStateChange = re.notifyNestedSubs, re.trySubscribe(), O !== s.getState() && re.notifyNestedSubs(), function() {
              re.tryUnsubscribe(), re.onStateChange = null;
            };
          }, [S, O]);
          var L = d || G;
          return r.a.createElement(L.Provider, { value: S }, g);
        };
        function I() {
          return (I = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var g in d) Object.prototype.hasOwnProperty.call(d, g) && (E[g] = d[g]);
            }
            return E;
          }).apply(this, arguments);
        }
        function J(E, s) {
          if (E == null) return {};
          var d, g, S = {}, O = Object.keys(E);
          for (g = 0; g < O.length; g++) d = O[g], s.indexOf(d) >= 0 || (S[d] = E[d]);
          return S;
        }
        var Q = l(39), z = l.n(Q), A = l(45), ae = ["getDisplayName", "methodName", "renderCountProp", "shouldHandleStateChanges", "storeKey", "withRef", "forwardRef", "context"], le = ["reactReduxForwardedRef"], ne = [], ce = [null, null];
        function ye(E, s) {
          var d = E[1];
          return [s.payload, d + 1];
        }
        function ee(E, s, d) {
          M(function() {
            return E.apply(void 0, s);
          }, d);
        }
        function de(E, s, d, g, S, O, L) {
          E.current = g, s.current = S, d.current = !1, O.current && (O.current = null, L());
        }
        function R(E, s, d, g, S, O, L, re, fe, pe) {
          if (E) {
            var Ee = !1, Ne = null, Be = function() {
              if (!Ee) {
                var Ie, Ke, Me = s.getState();
                try {
                  Ie = g(Me, S.current);
                } catch (Fe) {
                  Ke = Fe, Ne = Fe;
                }
                Ke || (Ne = null), Ie === O.current ? L.current || fe() : (O.current = Ie, re.current = Ie, L.current = !0, pe({ type: "STORE_UPDATED", payload: { error: Ke } }));
              }
            };
            return d.onStateChange = Be, d.trySubscribe(), Be(), function() {
              if (Ee = !0, d.tryUnsubscribe(), d.onStateChange = null, Ne) throw Ne;
            };
          }
        }
        var ie = function() {
          return [null, 0];
        };
        function be(E, s) {
          s === void 0 && (s = {});
          var d = s, g = d.getDisplayName, S = g === void 0 ? function(Le) {
            return "ConnectAdvanced(" + Le + ")";
          } : g, O = d.methodName, L = O === void 0 ? "connectAdvanced" : O, re = d.renderCountProp, fe = re === void 0 ? void 0 : re, pe = d.shouldHandleStateChanges, Ee = pe === void 0 || pe, Ne = d.storeKey, Be = Ne === void 0 ? "store" : Ne, Ie = (d.withRef, d.forwardRef), Ke = Ie !== void 0 && Ie, Me = d.context, Fe = Me === void 0 ? G : Me, et = J(d, ae), qe = Fe;
          return function(Le) {
            var dt = Le.displayName || Le.name || "Component", Dt = S(dt), Mt = I({}, et, { getDisplayName: S, methodName: L, renderCountProp: fe, shouldHandleStateChanges: Ee, storeKey: Be, displayName: Dt, wrappedComponentName: dt, WrappedComponent: Le }), jt = et.pure, _t = jt ? u.useMemo : function(lt) {
              return lt();
            };
            function zt(lt) {
              var An = Object(u.useMemo)(function() {
                var kn = lt.reactReduxForwardedRef, lo = J(lt, le);
                return [lt.context, kn, lo];
              }, [lt]), Wn = An[0], zr = An[1], xt = An[2], ao = Object(u.useMemo)(function() {
                return Wn && Wn.Consumer && Object(A.isContextConsumer)(r.a.createElement(Wn.Consumer, null)) ? Wn : qe;
              }, [Wn, qe]), Mn = Object(u.useContext)(ao), $t = !!lt.store && !!lt.store.getState && !!lt.store.dispatch;
              Mn && Mn.store;
              var dn = $t ? lt.store : Mn.store, Xn = Object(u.useMemo)(function() {
                return function(kn) {
                  return E(kn.dispatch, Mt);
                }(dn);
              }, [dn]), Gt = Object(u.useMemo)(function() {
                if (!Ee) return ce;
                var kn = P(dn, $t ? null : Mn.subscription), lo = kn.notifyNestedSubs.bind(kn);
                return [kn, lo];
              }, [dn, $t, Mn]), fn = Gt[0], Lr = Gt[1], si = Object(u.useMemo)(function() {
                return $t ? Mn : I({}, Mn, { subscription: fn });
              }, [$t, Mn, fn]), Ur = Object(u.useReducer)(ye, ne, ie), Mo = Ur[0][0], mr = Ur[1];
              if (Mo && Mo.error) throw Mo.error;
              var Bi = Object(u.useRef)(), gr = Object(u.useRef)(xt), jo = Object(u.useRef)(), li = Object(u.useRef)(!1), Zn = _t(function() {
                return jo.current && xt === gr.current ? jo.current : Xn(dn.getState(), xt);
              }, [dn, Mo, xt]);
              ee(de, [gr, Bi, li, xt, Zn, jo, Lr]), ee(R, [Ee, dn, fn, Xn, gr, Bi, li, jo, Lr, mr], [dn, fn, Xn]);
              var so = Object(u.useMemo)(function() {
                return r.a.createElement(Le, I({}, Zn, { ref: zr }));
              }, [zr, Le, Zn]);
              return Object(u.useMemo)(function() {
                return Ee ? r.a.createElement(ao.Provider, { value: si }, so) : so;
              }, [ao, so, si]);
            }
            var ft = jt ? r.a.memo(zt) : zt;
            if (ft.WrappedComponent = Le, ft.displayName = zt.displayName = Dt, Ke) {
              var In = r.a.forwardRef(function(lt, An) {
                return r.a.createElement(ft, I({}, lt, { reactReduxForwardedRef: An }));
              });
              return In.displayName = Dt, In.WrappedComponent = Le, z()(In, Le);
            }
            return z()(ft, Le);
          };
        }
        function Te(E, s) {
          return E === s ? E !== 0 || s !== 0 || 1 / E == 1 / s : E != E && s != s;
        }
        function ke(E, s) {
          if (Te(E, s)) return !0;
          if (typeof E != "object" || E === null || typeof s != "object" || s === null) return !1;
          var d = Object.keys(E), g = Object.keys(s);
          if (d.length !== g.length) return !1;
          for (var S = 0; S < d.length; S++) if (!Object.prototype.hasOwnProperty.call(s, d[S]) || !Te(E[d[S]], s[d[S]])) return !1;
          return !0;
        }
        function Pe(E) {
          return function(s, d) {
            var g = E(s, d);
            function S() {
              return g;
            }
            return S.dependsOnOwnProps = !1, S;
          };
        }
        function Se(E) {
          return E.dependsOnOwnProps !== null && E.dependsOnOwnProps !== void 0 ? !!E.dependsOnOwnProps : E.length !== 1;
        }
        function ze(E, s) {
          return function(d, g) {
            g.displayName;
            var S = function(O, L) {
              return S.dependsOnOwnProps ? S.mapToProps(O, L) : S.mapToProps(O);
            };
            return S.dependsOnOwnProps = !0, S.mapToProps = function(O, L) {
              S.mapToProps = E, S.dependsOnOwnProps = Se(E);
              var re = S(O, L);
              return typeof re == "function" && (S.mapToProps = re, S.dependsOnOwnProps = Se(re), re = S(O, L)), re;
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
            return function(d, g) {
              var S = {}, O = function(re) {
                var fe = d[re];
                typeof fe == "function" && (S[re] = function() {
                  return g(fe.apply(void 0, arguments));
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
        function q(E, s, d) {
          return I({}, d, E, s);
        }
        var me = [function(E) {
          return typeof E == "function" ? /* @__PURE__ */ function(s) {
            return function(d, g) {
              g.displayName;
              var S, O = g.pure, L = g.areMergedPropsEqual, re = !1;
              return function(fe, pe, Ee) {
                var Ne = s(fe, pe, Ee);
                return re ? O && L(Ne, S) || (S = Ne) : (re = !0, S = Ne), S;
              };
            };
          }(E) : void 0;
        }, function(E) {
          return E ? void 0 : function() {
            return q;
          };
        }], c = ["initMapStateToProps", "initMapDispatchToProps", "initMergeProps"];
        function f(E, s, d, g) {
          return function(S, O) {
            return d(E(S, O), s(g, O), O);
          };
        }
        function k(E, s, d, g, S) {
          var O, L, re, fe, pe, Ee = S.areStatesEqual, Ne = S.areOwnPropsEqual, Be = S.areStatePropsEqual, Ie = !1;
          function Ke(Me, Fe) {
            var et, qe, Le = !Ne(Fe, L), dt = !Ee(Me, O);
            return O = Me, L = Fe, Le && dt ? (re = E(O, L), s.dependsOnOwnProps && (fe = s(g, L)), pe = d(re, fe, L)) : Le ? (E.dependsOnOwnProps && (re = E(O, L)), s.dependsOnOwnProps && (fe = s(g, L)), pe = d(re, fe, L)) : (dt && (et = E(O, L), qe = !Be(et, re), re = et, qe && (pe = d(re, fe, L))), pe);
          }
          return function(Me, Fe) {
            return Ie ? Ke(Me, Fe) : (re = E(O = Me, L = Fe), fe = s(g, L), pe = d(re, fe, L), Ie = !0, pe);
          };
        }
        function U(E, s) {
          var d = s.initMapStateToProps, g = s.initMapDispatchToProps, S = s.initMergeProps, O = J(s, c), L = d(E, O), re = g(E, O), fe = S(E, O);
          return (O.pure ? k : f)(L, re, fe, E, O);
        }
        var F = ["pure", "areStatesEqual", "areOwnPropsEqual", "areStatePropsEqual", "areMergedPropsEqual"];
        function H(E, s, d) {
          for (var g = s.length - 1; g >= 0; g--) {
            var S = s[g](E);
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
          var s = {}, d = s.connectHOC, g = d === void 0 ? be : d, S = s.mapStateToPropsFactories, O = S === void 0 ? X : S, L = s.mapDispatchToPropsFactories, re = L === void 0 ? Je : L, fe = s.mergePropsFactories, pe = fe === void 0 ? me : fe, Ee = s.selectorFactory, Ne = Ee === void 0 ? U : Ee;
          return function(Be, Ie, Ke, Me) {
            Me === void 0 && (Me = {});
            var Fe = Me, et = Fe.pure, qe = et === void 0 || et, Le = Fe.areStatesEqual, dt = Le === void 0 ? he : Le, Dt = Fe.areOwnPropsEqual, Mt = Dt === void 0 ? ke : Dt, jt = Fe.areStatePropsEqual, _t = jt === void 0 ? ke : jt, zt = Fe.areMergedPropsEqual, ft = zt === void 0 ? ke : zt, In = J(Fe, F), lt = H(Be, O, "mapStateToProps"), An = H(Ie, re, "mapDispatchToProps"), Wn = H(Ke, pe, "mergeProps");
            return g(Ne, I({ methodName: "connect", getDisplayName: function(zr) {
              return "Connect(" + zr + ")";
            }, shouldHandleStateChanges: !!Be, initMapStateToProps: lt, initMapDispatchToProps: An, initMergeProps: Wn, pure: qe, areStatesEqual: dt, areOwnPropsEqual: Mt, areStatePropsEqual: _t, areMergedPropsEqual: ft }, In));
          };
        }
        var Re = je(), Xe;
        Xe = _.unstable_batchedUpdates, K = Xe;
        function We(E) {
          return { type: "SET_MODEL_ACTIVE_TAB", tabName: E };
        }
        function It() {
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
        var gt = l(10), cn = l(4);
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
        function qn(E, s, d) {
          const g = function(S, O, L) {
            if (S.ui.activeTab !== "Model") return O;
            if (!O) return Sn(S, O);
            switch (L.type) {
              case "SET_MODEL_CURRENT_ROOT_NAME":
                return function(re, fe, pe) {
                  const Ee = pe.currentRootName;
                  return { ...fe, ...or(re, fe, { currentRootName: Ee }), currentNode: null, currentNodeDefinition: null, currentRootName: Ee };
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
          return g && (g.ui = function(S, O) {
            if (!S) return { activeTab: pt.get("active-model-tab-name") || "Inspect", showMarkers: pt.get("model-show-markers") === "true", showCompactText: pt.get("model-compact-text") === "true" };
            switch (O.type) {
              case "SET_MODEL_ACTIVE_TAB":
                return function(L, re) {
                  return pt.set("active-model-tab-name", re.tabName), { ...L, activeTab: re.tabName };
                }(S, O);
              case "TOGGLE_MODEL_SHOW_MARKERS":
                return function(L) {
                  const re = !L.showMarkers;
                  return pt.set("model-show-markers", re), { ...L, showMarkers: re };
                }(S);
              case "TOGGLE_MODEL_SHOW_COMPACT_TEXT":
                return function(L) {
                  const re = !L.showCompactText;
                  return pt.set("model-compact-text", re), { ...L, showCompactText: re };
                }(S);
              default:
                return S;
            }
          }(g.ui, d)), g;
        }
        function Sn(E, s = {}) {
          const d = Tt(E);
          if (!d) return { ui: s.ui };
          const g = Object(gt.d)(d)[0].rootName;
          return { ...s, ...or(E, s, { currentRootName: g }), currentRootName: g, currentNode: null, currentNodeDefinition: null };
        }
        function or(E, s, d) {
          const g = Tt(E), S = { ...s, ...d }, O = S.currentRootName, L = Object(gt.c)(g, O), re = Object(gt.a)(g, O), fe = Object(gt.e)({ currentEditor: g, currentRootName: S.currentRootName, ranges: L, markers: re });
          let pe = S.currentNode, Ee = S.currentNodeDefinition;
          return pe ? pe.root.rootName !== O || !Object(cn.d)(pe) && !pe.parent ? (pe = null, Ee = null) : Ee = Object(gt.b)(g, pe) : Ee = null, { treeDefinition: fe, currentNode: pe, currentNodeDefinition: Ee, ranges: L, markers: re };
        }
        function _r(E) {
          return { type: "SET_VIEW_ACTIVE_TAB", tabName: E };
        }
        function Eo() {
          return { type: "UPDATE_VIEW_STATE" };
        }
        var en = l(9), qt = l(2);
        function xr(E, s, d) {
          const g = function(S, O, L) {
            if (S.ui.activeTab !== "View") return O;
            if (!O) return Yt(S, O);
            switch (L.type) {
              case "SET_VIEW_CURRENT_ROOT_NAME":
                return function(re, fe, pe) {
                  const Ee = pe.currentRootName;
                  return { ...fe, ...gn(re, fe, { currentRootName: Ee }), currentNode: null, currentNodeDefinition: null, currentRootName: Ee };
                }(S, O, L);
              case "SET_VIEW_CURRENT_NODE":
                return { ...O, currentNode: L.currentNode, currentNodeDefinition: Object(en.b)(L.currentNode) };
              case "SET_ACTIVE_INSPECTOR_TAB":
              case "UPDATE_VIEW_STATE":
                return { ...O, ...gn(S, O) };
              case "SET_EDITORS":
              case "SET_CURRENT_EDITOR_NAME":
                return Yt(S, O);
              default:
                return O;
            }
          }(E, s, d);
          return g && (g.ui = function(S, O, L) {
            if (!O) return { activeTab: pt.get("active-view-tab-name") || "Inspect", showElementTypes: pt.get("view-element-types") === "true" };
            switch (L.type) {
              case "SET_VIEW_ACTIVE_TAB":
                return function(re, fe) {
                  return pt.set("active-view-tab-name", fe.tabName), { ...re, activeTab: fe.tabName };
                }(O, L);
              case "TOGGLE_VIEW_SHOW_ELEMENT_TYPES":
                return function(re, fe) {
                  const pe = !fe.showElementTypes;
                  return pt.set("view-element-types", pe), { ...fe, showElementTypes: pe };
                }(0, O);
              default:
                return O;
            }
          }(0, g.ui, d)), g;
        }
        function Yt(E, s = {}) {
          const d = Tt(E), g = Object(en.d)(d), S = g[0] ? g[0].rootName : null;
          return { ...s, ...gn(E, s, { currentRootName: S }), currentRootName: S, currentNode: null, currentNodeDefinition: null };
        }
        function gn(E, s, d) {
          const g = { ...s, ...d }, S = g.currentRootName, O = Object(en.c)(Tt(E), S), L = Object(en.e)({ currentEditor: Tt(E), currentRootName: S, ranges: O });
          let re = g.currentNode, fe = g.currentNodeDefinition;
          return re ? re.root.rootName !== S || !Object(qt.g)(re) && !re.parent ? (re = null, fe = null) : fe = Object(en.b)(re) : fe = null, { treeDefinition: L, currentNode: re, currentNodeDefinition: fe, ranges: O };
        }
        function Sr() {
          return { type: "UPDATE_COMMANDS_STATE" };
        }
        var ut = l(1);
        function Cr({ editors: E, currentEditorName: s }, d) {
          if (!d) return null;
          const g = E.get(s).commands.get(d);
          return { currentCommandName: d, type: "Command", url: "https://ckeditor.com/docs/ckeditor5/latest/api/module_core_command-Command.html", properties: Object(ut.b)({ isEnabled: { value: g.isEnabled }, value: { value: g.value } }), command: g };
        }
        function bn({ editors: E, currentEditorName: s }) {
          if (!E.get(s)) return [];
          const d = [];
          for (const [g, S] of E.get(s).commands) {
            const O = [];
            S.value !== void 0 && O.push(["value", Object(ut.a)(S.value, !1)]), d.push({ name: g, type: "element", children: [], node: g, attributes: O, presentation: { isEmpty: !0, cssClass: ["ck-inspector-tree-node_tagless", S.isEnabled ? "" : "ck-inspector-tree-node_disabled"].join(" ") } });
          }
          return d.sort((g, S) => g.name > S.name ? 1 : -1);
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
          const g = E.get(s).model.schema, S = g.getDefinitions()[d], O = {}, L = {}, re = {};
          let fe = {};
          for (const pe of ar) S[pe] && (O[pe] = { value: S[pe] });
          for (const pe of S.allowChildren.sort()) L[pe] = { value: !0, title: "Click to see the definition of " + pe };
          for (const pe of S.allowIn.sort()) re[pe] = { value: !0, title: "Click to see the definition of " + pe };
          for (const pe of S.allowAttributes.sort()) fe[pe] = { value: !0 };
          fe = Object(ut.b)(fe);
          for (const pe in fe) {
            const Ee = g.getAttributeProperties(pe), Ne = {};
            for (const Be in Ee) Ne[Be] = { value: Ee[Be] };
            fe[pe].subProperties = Object(ut.b)(Ne);
          }
          return { currentSchemaDefinitionName: d, type: "SchemaCompiledItemDefinition", urls: { general: Cn + "module_engine_model_schema-SchemaCompiledItemDefinition.html", allowAttributes: Cn + "module_engine_model_schema-SchemaItemDefinition.html#member-allowAttributes", allowChildren: Cn + "module_engine_model_schema-SchemaItemDefinition.html#member-allowChildren", allowIn: Cn + "module_engine_model_schema-SchemaItemDefinition.html#member-allowIn" }, properties: Object(ut.b)(O), allowChildren: Object(ut.b)(L), allowIn: Object(ut.b)(re), allowAttributes: fe, definition: S };
        }
        function Tn({ editors: E, currentEditorName: s }) {
          if (!E.get(s)) return [];
          const d = [], g = E.get(s).model.schema.getDefinitions();
          for (const S in g) d.push({ name: S, type: "element", children: [], node: S, attributes: [], presentation: { isEmpty: !0, cssClass: "ck-inspector-tree-node_tagless" } });
          return d.sort((S, O) => S.name > O.name ? 1 : -1);
        }
        function lr(E, s = {}) {
          return { ...s, currentSchemaDefinitionName: null, currentSchemaDefinition: null, treeDefinition: Tn(E) };
        }
        var On = l(8);
        function Xr(E, s) {
          const d = function(g, S) {
            switch (S.type) {
              case "SET_EDITORS":
                return function(O, L) {
                  const re = { editors: new Map(L.editors) };
                  return L.editors.size ? L.editors.has(O.currentEditorName) || (re.currentEditorName = Object(On.b)(L.editors)) : re.currentEditorName = null, { ...O, ...re };
                }(g, S);
              case "SET_CURRENT_EDITOR_NAME":
                return function(O, L) {
                  return { ...O, currentEditorName: L.editorName };
                }(g, S);
              default:
                return g;
            }
          }(E, s);
          return d.currentEditorGlobals = function(g, S, O) {
            switch (O.type) {
              case "SET_EDITORS":
              case "SET_CURRENT_EDITOR_NAME":
                return { ...Zr(g, {}) };
              case "UPDATE_CURRENT_EDITOR_IS_READ_ONLY":
                return Zr(g, S);
              default:
                return S;
            }
          }(d, d.currentEditorGlobals, s), d.ui = function(g, S) {
            if (!g.activeTab) {
              let O;
              return O = g.isCollapsed !== void 0 ? g.isCollapsed : pt.get("is-collapsed") === "true", { ...g, isCollapsed: O, activeTab: pt.get("active-tab-name") || "Model", height: pt.get("height") || "400px", sidePaneWidth: pt.get("side-pane-width") || "500px" };
            }
            switch (S.type) {
              case "TOGGLE_IS_COLLAPSED":
                return function(O) {
                  const L = !O.isCollapsed;
                  return pt.set("is-collapsed", L), { ...O, isCollapsed: L };
                }(g);
              case "SET_HEIGHT":
                return function(O, L) {
                  return pt.set("height", L.newHeight), { ...O, height: L.newHeight };
                }(g, S);
              case "SET_SIDE_PANE_WIDTH":
                return function(O, L) {
                  return pt.set("side-pane-width", L.newWidth), { ...O, sidePaneWidth: L.newWidth };
                }(g, S);
              case "SET_ACTIVE_INSPECTOR_TAB":
                return function(O, L) {
                  return pt.set("active-tab-name", L.tabName), { ...O, activeTab: L.tabName };
                }(g, S);
              default:
                return g;
            }
          }(d.ui, s), d.model = qn(d, d.model, s), d.view = xr(d, d.view, s), d.commands = function(g, S, O) {
            if (g.ui.activeTab !== "Commands") return S;
            if (!S) return Tr(g, S);
            switch (O.type) {
              case "SET_COMMANDS_CURRENT_COMMAND_NAME":
                return { ...S, currentCommandDefinition: Cr(g, O.currentCommandName), currentCommandName: O.currentCommandName };
              case "SET_ACTIVE_INSPECTOR_TAB":
              case "UPDATE_COMMANDS_STATE":
                return { ...S, currentCommandDefinition: Cr(g, S.currentCommandName), treeDefinition: bn(g) };
              case "SET_EDITORS":
              case "SET_CURRENT_EDITOR_NAME":
                return Tr(g, S);
              default:
                return S;
            }
          }(d, d.commands, s), d.schema = function(g, S, O) {
            if (g.ui.activeTab !== "Schema") return S;
            if (!S) return lr(g, S);
            switch (O.type) {
              case "SET_SCHEMA_CURRENT_DEFINITION_NAME":
                return { ...S, currentSchemaDefinition: sr(g, O.currentSchemaDefinitionName), currentSchemaDefinitionName: O.currentSchemaDefinitionName };
              case "SET_ACTIVE_INSPECTOR_TAB":
                return { ...S, currentSchemaDefinition: sr(g, S.currentSchemaDefinitionName), treeDefinition: Tn(g) };
              case "SET_EDITORS":
              case "SET_CURRENT_EDITOR_NAME":
                return lr(g, S);
              default:
                return S;
            }
          }(d, d.schema, s), { ...E, ...d };
        }
        function Zr(E, s) {
          const d = Tt(E);
          return { ...s, isReadOnly: !!d && d.isReadOnly };
        }
        var W = l(46), se = l.n(W), we = /* @__PURE__ */ function() {
          var E = function(s, d) {
            return (E = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(g, S) {
              g.__proto__ = S;
            } || function(g, S) {
              for (var O in S) S.hasOwnProperty(O) && (g[O] = S[O]);
            })(s, d);
          };
          return function(s, d) {
            function g() {
              this.constructor = s;
            }
            E(s, d), s.prototype = d === null ? Object.create(d) : (g.prototype = d.prototype, new g());
          };
        }(), Ce = function() {
          return (Ce = Object.assign || function(E) {
            for (var s, d = 1, g = arguments.length; d < g; d++) for (var S in s = arguments[d]) Object.prototype.hasOwnProperty.call(s, S) && (E[S] = s[S]);
            return E;
          }).apply(this, arguments);
        }, it = { top: { width: "100%", height: "10px", top: "-5px", left: "0px", cursor: "row-resize" }, right: { width: "10px", height: "100%", top: "0px", right: "-5px", cursor: "col-resize" }, bottom: { width: "100%", height: "10px", bottom: "-5px", left: "0px", cursor: "row-resize" }, left: { width: "10px", height: "100%", top: "0px", left: "-5px", cursor: "col-resize" }, topRight: { width: "20px", height: "20px", position: "absolute", right: "-10px", top: "-10px", cursor: "ne-resize" }, bottomRight: { width: "20px", height: "20px", position: "absolute", right: "-10px", bottom: "-10px", cursor: "se-resize" }, bottomLeft: { width: "20px", height: "20px", position: "absolute", left: "-10px", bottom: "-10px", cursor: "sw-resize" }, topLeft: { width: "20px", height: "20px", position: "absolute", left: "-10px", top: "-10px", cursor: "nw-resize" } }, Ye = function(E) {
          function s() {
            var d = E !== null && E.apply(this, arguments) || this;
            return d.onMouseDown = function(g) {
              d.props.onResizeStart(g, d.props.direction);
            }, d.onTouchStart = function(g) {
              d.props.onResizeStart(g, d.props.direction);
            }, d;
          }
          return we(s, E), s.prototype.render = function() {
            return u.createElement("div", { className: this.props.className || "", style: Ce(Ce({ position: "absolute", userSelect: "none" }, it[this.props.direction]), this.props.replaceStyles || {}), onMouseDown: this.onMouseDown, onTouchStart: this.onTouchStart }, this.props.children);
          }, s;
        }(u.PureComponent), st = l(14), tt = l.n(st), Ot = /* @__PURE__ */ function() {
          var E = function(s, d) {
            return (E = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(g, S) {
              g.__proto__ = S;
            } || function(g, S) {
              for (var O in S) S.hasOwnProperty(O) && (g[O] = S[O]);
            })(s, d);
          };
          return function(s, d) {
            function g() {
              this.constructor = s;
            }
            E(s, d), s.prototype = d === null ? Object.create(d) : (g.prototype = d.prototype, new g());
          };
        }(), nt = function() {
          return (nt = Object.assign || function(E) {
            for (var s, d = 1, g = arguments.length; d < g; d++) for (var S in s = arguments[d]) Object.prototype.hasOwnProperty.call(s, S) && (E[S] = s[S]);
            return E;
          }).apply(this, arguments);
        }, bt = { width: "auto", height: "auto" }, Pt = tt()(function(E, s, d) {
          return Math.max(Math.min(E, d), s);
        }), tn = tt()(function(E, s) {
          return Math.round(E / s) * s;
        }), ht = tt()(function(E, s) {
          return new RegExp(E, "i").test(s);
        }), Bt = function(E) {
          return !!(E.touches && E.touches.length);
        }, Pn = tt()(function(E, s, d) {
          d === void 0 && (d = 0);
          var g = s.reduce(function(O, L, re) {
            return Math.abs(L - E) < Math.abs(s[O] - E) ? re : O;
          }, 0), S = Math.abs(s[g] - E);
          return d === 0 || S < d ? s[g] : E;
        }), ct = tt()(function(E, s) {
          return E.substr(E.length - s.length, s.length) === s;
        }), yn = tt()(function(E) {
          return (E = E.toString()) === "auto" || ct(E, "px") || ct(E, "%") || ct(E, "vh") || ct(E, "vw") || ct(E, "vmax") || ct(E, "vmin") ? E : E + "px";
        }), un = function(E, s, d, g) {
          if (E && typeof E == "string") {
            if (ct(E, "px")) return Number(E.replace("px", ""));
            if (ct(E, "%")) return s * (Number(E.replace("%", "")) / 100);
            if (ct(E, "vw")) return d * (Number(E.replace("vw", "")) / 100);
            if (ct(E, "vh")) return g * (Number(E.replace("vh", "")) / 100);
          }
          return E;
        }, Nn = tt()(function(E, s, d, g, S, O, L) {
          return g = un(g, E.width, s, d), S = un(S, E.height, s, d), O = un(O, E.width, s, d), L = un(L, E.height, s, d), { maxWidth: g === void 0 ? void 0 : Number(g), maxHeight: S === void 0 ? void 0 : Number(S), minWidth: O === void 0 ? void 0 : Number(O), minHeight: L === void 0 ? void 0 : Number(L) };
        }), _o = ["as", "style", "className", "grid", "snap", "bounds", "boundsByDirection", "size", "defaultSize", "minWidth", "minHeight", "maxWidth", "maxHeight", "lockAspectRatio", "lockAspectRatioExtraWidth", "lockAspectRatioExtraHeight", "enable", "handleStyles", "handleClasses", "handleWrapperStyle", "handleWrapperClass", "children", "onResizeStart", "onResize", "onResizeStop", "handleComponent", "scale", "resizeRatio", "snapGap"], xo = function(E) {
          function s(d) {
            var g = E.call(this, d) || this;
            return g.ratio = 1, g.resizable = null, g.parentLeft = 0, g.parentTop = 0, g.resizableLeft = 0, g.resizableRight = 0, g.resizableTop = 0, g.resizableBottom = 0, g.targetLeft = 0, g.targetTop = 0, g.appendBase = function() {
              if (!g.resizable || !g.window) return null;
              var S = g.parentNode;
              if (!S) return null;
              var O = g.window.document.createElement("div");
              return O.style.width = "100%", O.style.height = "100%", O.style.position = "absolute", O.style.transform = "scale(0, 0)", O.style.left = "0", O.style.flex = "0", O.classList ? O.classList.add("__resizable_base__") : O.className += "__resizable_base__", S.appendChild(O), O;
            }, g.removeBase = function(S) {
              var O = g.parentNode;
              O && O.removeChild(S);
            }, g.ref = function(S) {
              S && (g.resizable = S);
            }, g.state = { isResizing: !1, width: (g.propsSize && g.propsSize.width) === void 0 ? "auto" : g.propsSize && g.propsSize.width, height: (g.propsSize && g.propsSize.height) === void 0 ? "auto" : g.propsSize && g.propsSize.height, direction: "right", original: { x: 0, y: 0, width: 0, height: 0 }, backgroundStyle: { height: "100%", width: "100%", backgroundColor: "rgba(0,0,0,0)", cursor: "auto", opacity: 0, position: "fixed", zIndex: 9999, top: "0", left: "0", bottom: "0", right: "0" }, flexBasis: void 0 }, g.onResizeStart = g.onResizeStart.bind(g), g.onMouseMove = g.onMouseMove.bind(g), g.onMouseUp = g.onMouseUp.bind(g), g;
          }
          return Ot(s, E), Object.defineProperty(s.prototype, "parentNode", { get: function() {
            return this.resizable ? this.resizable.parentNode : null;
          }, enumerable: !1, configurable: !0 }), Object.defineProperty(s.prototype, "window", { get: function() {
            return this.resizable && this.resizable.ownerDocument ? this.resizable.ownerDocument.defaultView : null;
          }, enumerable: !1, configurable: !0 }), Object.defineProperty(s.prototype, "propsSize", { get: function() {
            return this.props.size || this.props.defaultSize || bt;
          }, enumerable: !1, configurable: !0 }), Object.defineProperty(s.prototype, "size", { get: function() {
            var d = 0, g = 0;
            if (this.resizable && this.window) {
              var S = this.resizable.offsetWidth, O = this.resizable.offsetHeight, L = this.resizable.style.position;
              L !== "relative" && (this.resizable.style.position = "relative"), d = this.resizable.style.width !== "auto" ? this.resizable.offsetWidth : S, g = this.resizable.style.height !== "auto" ? this.resizable.offsetHeight : O, this.resizable.style.position = L;
            }
            return { width: d, height: g };
          }, enumerable: !1, configurable: !0 }), Object.defineProperty(s.prototype, "sizeStyle", { get: function() {
            var d = this, g = this.props.size, S = function(O) {
              if (d.state[O] === void 0 || d.state[O] === "auto") return "auto";
              if (d.propsSize && d.propsSize[O] && ct(d.propsSize[O].toString(), "%")) {
                if (ct(d.state[O].toString(), "%")) return d.state[O].toString();
                var L = d.getParentSize();
                return Number(d.state[O].toString().replace("px", "")) / L[O] * 100 + "%";
              }
              return yn(d.state[O]);
            };
            return { width: g && g.width !== void 0 && !this.state.isResizing ? yn(g.width) : S("width"), height: g && g.height !== void 0 && !this.state.isResizing ? yn(g.height) : S("height") };
          }, enumerable: !1, configurable: !0 }), s.prototype.getParentSize = function() {
            if (!this.parentNode) return this.window ? { width: this.window.innerWidth, height: this.window.innerHeight } : { width: 0, height: 0 };
            var d = this.appendBase();
            if (!d) return { width: 0, height: 0 };
            var g = !1, S = this.parentNode.style.flexWrap;
            S !== "wrap" && (g = !0, this.parentNode.style.flexWrap = "wrap"), d.style.position = "relative", d.style.minWidth = "100%";
            var O = { width: d.offsetWidth, height: d.offsetHeight };
            return g && (this.parentNode.style.flexWrap = S), this.removeBase(d), O;
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
          }, s.prototype.createSizeForCssProperty = function(d, g) {
            var S = this.propsSize && this.propsSize[g];
            return this.state[g] !== "auto" || this.state.original[g] !== d || S !== void 0 && S !== "auto" ? d : "auto";
          }, s.prototype.calculateNewMaxFromBoundary = function(d, g) {
            var S, O, L = this.props.boundsByDirection, re = this.state.direction, fe = L && ht("left", re), pe = L && ht("top", re);
            if (this.props.bounds === "parent") {
              var Ee = this.parentNode;
              Ee && (S = fe ? this.resizableRight - this.parentLeft : Ee.offsetWidth + (this.parentLeft - this.resizableLeft), O = pe ? this.resizableBottom - this.parentTop : Ee.offsetHeight + (this.parentTop - this.resizableTop));
            } else this.props.bounds === "window" ? this.window && (S = fe ? this.resizableRight : this.window.innerWidth - this.resizableLeft, O = pe ? this.resizableBottom : this.window.innerHeight - this.resizableTop) : this.props.bounds && (S = fe ? this.resizableRight - this.targetLeft : this.props.bounds.offsetWidth + (this.targetLeft - this.resizableLeft), O = pe ? this.resizableBottom - this.targetTop : this.props.bounds.offsetHeight + (this.targetTop - this.resizableTop));
            return S && Number.isFinite(S) && (d = d && d < S ? d : S), O && Number.isFinite(O) && (g = g && g < O ? g : O), { maxWidth: d, maxHeight: g };
          }, s.prototype.calculateNewSizeFromDirection = function(d, g) {
            var S = this.props.scale || 1, O = this.props.resizeRatio || 1, L = this.state, re = L.direction, fe = L.original, pe = this.props, Ee = pe.lockAspectRatio, Ne = pe.lockAspectRatioExtraHeight, Be = pe.lockAspectRatioExtraWidth, Ie = fe.width, Ke = fe.height, Me = Ne || 0, Fe = Be || 0;
            return ht("right", re) && (Ie = fe.width + (d - fe.x) * O / S, Ee && (Ke = (Ie - Fe) / this.ratio + Me)), ht("left", re) && (Ie = fe.width - (d - fe.x) * O / S, Ee && (Ke = (Ie - Fe) / this.ratio + Me)), ht("bottom", re) && (Ke = fe.height + (g - fe.y) * O / S, Ee && (Ie = (Ke - Me) * this.ratio + Fe)), ht("top", re) && (Ke = fe.height - (g - fe.y) * O / S, Ee && (Ie = (Ke - Me) * this.ratio + Fe)), { newWidth: Ie, newHeight: Ke };
          }, s.prototype.calculateNewSizeFromAspectRatio = function(d, g, S, O) {
            var L = this.props, re = L.lockAspectRatio, fe = L.lockAspectRatioExtraHeight, pe = L.lockAspectRatioExtraWidth, Ee = O.width === void 0 ? 10 : O.width, Ne = S.width === void 0 || S.width < 0 ? d : S.width, Be = O.height === void 0 ? 10 : O.height, Ie = S.height === void 0 || S.height < 0 ? g : S.height, Ke = fe || 0, Me = pe || 0;
            if (re) {
              var Fe = (Be - Ke) * this.ratio + Me, et = (Ie - Ke) * this.ratio + Me, qe = (Ee - Me) / this.ratio + Ke, Le = (Ne - Me) / this.ratio + Ke, dt = Math.max(Ee, Fe), Dt = Math.min(Ne, et), Mt = Math.max(Be, qe), jt = Math.min(Ie, Le);
              d = Pt(d, dt, Dt), g = Pt(g, Mt, jt);
            } else d = Pt(d, Ee, Ne), g = Pt(g, Be, Ie);
            return { newWidth: d, newHeight: g };
          }, s.prototype.setBoundingClientRect = function() {
            if (this.props.bounds === "parent") {
              var d = this.parentNode;
              if (d) {
                var g = d.getBoundingClientRect();
                this.parentLeft = g.left, this.parentTop = g.top;
              }
            }
            if (this.props.bounds && typeof this.props.bounds != "string") {
              var S = this.props.bounds.getBoundingClientRect();
              this.targetLeft = S.left, this.targetTop = S.top;
            }
            if (this.resizable) {
              var O = this.resizable.getBoundingClientRect(), L = O.left, re = O.top, fe = O.right, pe = O.bottom;
              this.resizableLeft = L, this.resizableRight = fe, this.resizableTop = re, this.resizableBottom = pe;
            }
          }, s.prototype.onResizeStart = function(d, g) {
            if (this.resizable && this.window) {
              var S, O = 0, L = 0;
              if (d.nativeEvent && function(Ne) {
                return !!((Ne.clientX || Ne.clientX === 0) && (Ne.clientY || Ne.clientY === 0));
              }(d.nativeEvent)) {
                if (O = d.nativeEvent.clientX, L = d.nativeEvent.clientY, d.nativeEvent.which === 3) return;
              } else d.nativeEvent && Bt(d.nativeEvent) && (O = d.nativeEvent.touches[0].clientX, L = d.nativeEvent.touches[0].clientY);
              if (this.props.onResizeStart && this.resizable && this.props.onResizeStart(d, g, this.resizable) === !1) return;
              this.props.size && (this.props.size.height !== void 0 && this.props.size.height !== this.state.height && this.setState({ height: this.props.size.height }), this.props.size.width !== void 0 && this.props.size.width !== this.state.width && this.setState({ width: this.props.size.width })), this.ratio = typeof this.props.lockAspectRatio == "number" ? this.props.lockAspectRatio : this.size.width / this.size.height;
              var re = this.window.getComputedStyle(this.resizable);
              if (re.flexBasis !== "auto") {
                var fe = this.parentNode;
                if (fe) {
                  var pe = this.window.getComputedStyle(fe).flexDirection;
                  this.flexDir = pe.startsWith("row") ? "row" : "column", S = re.flexBasis;
                }
              }
              this.setBoundingClientRect(), this.bindEvents();
              var Ee = { original: { x: O, y: L, width: this.size.width, height: this.size.height }, isResizing: !0, backgroundStyle: nt(nt({}, this.state.backgroundStyle), { cursor: this.window.getComputedStyle(d.target).cursor || "auto" }), direction: g, flexBasis: S };
              this.setState(Ee);
            }
          }, s.prototype.onMouseMove = function(d) {
            if (this.state.isResizing && this.resizable && this.window) {
              if (this.window.TouchEvent && Bt(d)) try {
                d.preventDefault(), d.stopPropagation();
              } catch {
              }
              var g = this.props, S = g.maxWidth, O = g.maxHeight, L = g.minWidth, re = g.minHeight, fe = Bt(d) ? d.touches[0].clientX : d.clientX, pe = Bt(d) ? d.touches[0].clientY : d.clientY, Ee = this.state, Ne = Ee.direction, Be = Ee.original, Ie = Ee.width, Ke = Ee.height, Me = this.getParentSize(), Fe = Nn(Me, this.window.innerWidth, this.window.innerHeight, S, O, L, re);
              S = Fe.maxWidth, O = Fe.maxHeight, L = Fe.minWidth, re = Fe.minHeight;
              var et = this.calculateNewSizeFromDirection(fe, pe), qe = et.newHeight, Le = et.newWidth, dt = this.calculateNewMaxFromBoundary(S, O), Dt = this.calculateNewSizeFromAspectRatio(Le, qe, { width: dt.maxWidth, height: dt.maxHeight }, { width: L, height: re });
              if (Le = Dt.newWidth, qe = Dt.newHeight, this.props.grid) {
                var Mt = tn(Le, this.props.grid[0]), jt = tn(qe, this.props.grid[1]), _t = this.props.snapGap || 0;
                Le = _t === 0 || Math.abs(Mt - Le) <= _t ? Mt : Le, qe = _t === 0 || Math.abs(jt - qe) <= _t ? jt : qe;
              }
              this.props.snap && this.props.snap.x && (Le = Pn(Le, this.props.snap.x, this.props.snapGap)), this.props.snap && this.props.snap.y && (qe = Pn(qe, this.props.snap.y, this.props.snapGap));
              var zt = { width: Le - Be.width, height: qe - Be.height };
              Ie && typeof Ie == "string" && (ct(Ie, "%") ? Le = Le / Me.width * 100 + "%" : ct(Ie, "vw") ? Le = Le / this.window.innerWidth * 100 + "vw" : ct(Ie, "vh") && (Le = Le / this.window.innerHeight * 100 + "vh")), Ke && typeof Ke == "string" && (ct(Ke, "%") ? qe = qe / Me.height * 100 + "%" : ct(Ke, "vw") ? qe = qe / this.window.innerWidth * 100 + "vw" : ct(Ke, "vh") && (qe = qe / this.window.innerHeight * 100 + "vh"));
              var ft = { width: this.createSizeForCssProperty(Le, "width"), height: this.createSizeForCssProperty(qe, "height") };
              this.flexDir === "row" ? ft.flexBasis = ft.width : this.flexDir === "column" && (ft.flexBasis = ft.height), this.setState(ft), this.props.onResize && this.props.onResize(d, Ne, this.resizable, zt);
            }
          }, s.prototype.onMouseUp = function(d) {
            var g = this.state, S = g.isResizing, O = g.direction, L = g.original;
            if (S && this.resizable) {
              var re = { width: this.size.width - L.width, height: this.size.height - L.height };
              this.props.onResizeStop && this.props.onResizeStop(d, O, this.resizable, re), this.props.size && this.setState(this.props.size), this.unbindEvents(), this.setState({ isResizing: !1, backgroundStyle: nt(nt({}, this.state.backgroundStyle), { cursor: "auto" }) });
            }
          }, s.prototype.updateSize = function(d) {
            this.setState({ width: d.width, height: d.height });
          }, s.prototype.renderResizer = function() {
            var d = this, g = this.props, S = g.enable, O = g.handleStyles, L = g.handleClasses, re = g.handleWrapperStyle, fe = g.handleWrapperClass, pe = g.handleComponent;
            if (!S) return null;
            var Ee = Object.keys(S).map(function(Ne) {
              return S[Ne] !== !1 ? u.createElement(Ye, { key: Ne, direction: Ne, onResizeStart: d.onResizeStart, replaceStyles: O && O[Ne], className: L && L[Ne] }, pe && pe[Ne] ? pe[Ne] : null) : null;
            });
            return u.createElement("div", { className: fe, style: re }, Ee);
          }, s.prototype.render = function() {
            var d = this, g = Object.keys(this.props).reduce(function(L, re) {
              return _o.indexOf(re) !== -1 || (L[re] = d.props[re]), L;
            }, {}), S = nt(nt(nt({ position: "relative", userSelect: this.state.isResizing ? "none" : "auto" }, this.props.style), this.sizeStyle), { maxWidth: this.props.maxWidth, maxHeight: this.props.maxHeight, minWidth: this.props.minWidth, minHeight: this.props.minHeight, boxSizing: "border-box", flexShrink: 0 });
            this.state.flexBasis && (S.flexBasis = this.state.flexBasis);
            var O = this.props.as || "div";
            return u.createElement(O, nt({ ref: this.ref, style: S, className: this.props.className }, g), this.state.isResizing && u.createElement("div", { style: this.state.backgroundStyle }), this.props.children, this.renderResizer());
          }, s.defaultProps = { as: "div", onResizeStart: function() {
          }, onResize: function() {
          }, onResizeStop: function() {
          }, enable: { top: !0, right: !0, bottom: !0, left: !0, topRight: !0, bottomRight: !0, bottomLeft: !0, topLeft: !0 }, style: {}, grid: [1, 1], lockAspectRatio: !1, lockAspectRatioExtraWidth: 0, lockAspectRatioExtraHeight: 0, scale: 1, resizeRatio: 1, snapGap: 0 }, s;
        }(u.PureComponent), rt = function(E, s) {
          return (rt = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d, g) {
            d.__proto__ = g;
          } || function(d, g) {
            for (var S in g) g.hasOwnProperty(S) && (d[S] = g[S]);
          })(E, s);
        }, Ue = function() {
          return (Ue = Object.assign || function(E) {
            for (var s, d = 1, g = arguments.length; d < g; d++) for (var S in s = arguments[d]) Object.prototype.hasOwnProperty.call(s, S) && (E[S] = s[S]);
            return E;
          }).apply(this, arguments);
        }, Yn = se.a, Kt = { width: "auto", height: "auto", display: "inline-block", position: "absolute", top: 0, left: 0 }, Or = function(E) {
          function s(d) {
            var g = E.call(this, d) || this;
            return g.resizing = !1, g.resizingPosition = { x: 0, y: 0 }, g.offsetFromParent = { left: 0, top: 0 }, g.resizableElement = { current: null }, g.refDraggable = function(S) {
              S && (g.draggable = S);
            }, g.refResizable = function(S) {
              S && (g.resizable = S, g.resizableElement.current = S.resizable);
            }, g.state = { original: { x: 0, y: 0 }, bounds: { top: 0, right: 0, bottom: 0, left: 0 }, maxWidth: d.maxWidth, maxHeight: d.maxHeight }, g.onResizeStart = g.onResizeStart.bind(g), g.onResize = g.onResize.bind(g), g.onResizeStop = g.onResizeStop.bind(g), g.onDragStart = g.onDragStart.bind(g), g.onDrag = g.onDrag.bind(g), g.onDragStop = g.onDragStop.bind(g), g.getMaxSizesFromProps = g.getMaxSizesFromProps.bind(g), g;
          }
          return function(d, g) {
            function S() {
              this.constructor = d;
            }
            rt(d, g), d.prototype = g === null ? Object.create(g) : (S.prototype = g.prototype, new S());
          }(s, E), s.prototype.componentDidMount = function() {
            this.updateOffsetFromParent();
            var d = this.offsetFromParent, g = d.left, S = d.top, O = this.getDraggablePosition(), L = O.x, re = O.y;
            this.draggable.setState({ x: L - g, y: re - S }), this.forceUpdate();
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
            var g = this.props.scale;
            switch (this.props.bounds) {
              case "window":
                return window.innerHeight / g;
              case "body":
                return document.body.offsetHeight / g;
              default:
                return d.offsetHeight;
            }
          }, s.prototype.getOffsetWidth = function(d) {
            var g = this.props.scale;
            switch (this.props.bounds) {
              case "window":
                return window.innerWidth / g;
              case "body":
                return document.body.offsetWidth / g;
              default:
                return d.offsetWidth;
            }
          }, s.prototype.onDragStart = function(d, g) {
            if (this.props.onDragStart && this.props.onDragStart(d, g), this.props.bounds) {
              var S, O = this.getParent(), L = this.props.scale;
              if (this.props.bounds === "parent") S = O;
              else {
                if (this.props.bounds === "body") {
                  var re = O.getBoundingClientRect(), fe = re.left, pe = re.top, Ee = document.body.getBoundingClientRect(), Ne = -(fe - O.offsetLeft * L - Ee.left) / L, Be = -(pe - O.offsetTop * L - Ee.top) / L, Ie = (document.body.offsetWidth - this.resizable.size.width * L) / L + Ne, Ke = (document.body.offsetHeight - this.resizable.size.height * L) / L + Be;
                  return this.setState({ bounds: { top: Be, right: Ie, bottom: Ke, left: Ne } });
                }
                if (this.props.bounds === "window") {
                  if (!this.resizable) return;
                  var Me = O.getBoundingClientRect(), Fe = Me.left, et = Me.top, qe = -(Fe - O.offsetLeft * L) / L, Le = -(et - O.offsetTop * L) / L;
                  return Ie = (window.innerWidth - this.resizable.size.width * L) / L + qe, Ke = (window.innerHeight - this.resizable.size.height * L) / L + Le, this.setState({ bounds: { top: Le, right: Ie, bottom: Ke, left: qe } });
                }
                S = document.querySelector(this.props.bounds);
              }
              if (S instanceof HTMLElement && O instanceof HTMLElement) {
                var dt = S.getBoundingClientRect(), Dt = dt.left, Mt = dt.top, jt = O.getBoundingClientRect(), _t = (Dt - jt.left) / L, zt = Mt - jt.top;
                if (this.resizable) {
                  this.updateOffsetFromParent();
                  var ft = this.offsetFromParent;
                  this.setState({ bounds: { top: zt - ft.top, right: _t + (S.offsetWidth - this.resizable.size.width) - ft.left / L, bottom: zt + (S.offsetHeight - this.resizable.size.height) - ft.top, left: _t - ft.left / L } });
                }
              }
            }
          }, s.prototype.onDrag = function(d, g) {
            if (this.props.onDrag) {
              var S = this.offsetFromParent;
              return this.props.onDrag(d, Ue(Ue({}, g), { x: g.x - S.left, y: g.y - S.top }));
            }
          }, s.prototype.onDragStop = function(d, g) {
            if (this.props.onDragStop) {
              var S = this.offsetFromParent, O = S.left, L = S.top;
              return this.props.onDragStop(d, Ue(Ue({}, g), { x: g.x + O, y: g.y + L }));
            }
          }, s.prototype.onResizeStart = function(d, g, S) {
            d.stopPropagation(), this.resizing = !0;
            var O = this.props.scale, L = this.offsetFromParent, re = this.getDraggablePosition();
            if (this.resizingPosition = { x: re.x + L.left, y: re.y + L.top }, this.setState({ original: re }), this.props.bounds) {
              var fe = this.getParent(), pe = void 0;
              pe = this.props.bounds === "parent" ? fe : this.props.bounds === "body" ? document.body : this.props.bounds === "window" ? window : document.querySelector(this.props.bounds);
              var Ee = this.getSelfElement();
              if (Ee instanceof Element && (pe instanceof HTMLElement || pe === window) && fe instanceof HTMLElement) {
                var Ne = this.getMaxSizesFromProps(), Be = Ne.maxWidth, Ie = Ne.maxHeight, Ke = this.getParentSize();
                if (Be && typeof Be == "string") if (Be.endsWith("%")) {
                  var Me = Number(Be.replace("%", "")) / 100;
                  Be = Ke.width * Me;
                } else Be.endsWith("px") && (Be = Number(Be.replace("px", "")));
                Ie && typeof Ie == "string" && (Ie.endsWith("%") ? (Me = Number(Ie.replace("%", "")) / 100, Ie = Ke.width * Me) : Ie.endsWith("px") && (Ie = Number(Ie.replace("px", ""))));
                var Fe = Ee.getBoundingClientRect(), et = Fe.left, qe = Fe.top, Le = this.props.bounds === "window" ? { left: 0, top: 0 } : pe.getBoundingClientRect(), dt = Le.left, Dt = Le.top, Mt = this.getOffsetWidth(pe), jt = this.getOffsetHeight(pe), _t = g.toLowerCase().endsWith("left"), zt = g.toLowerCase().endsWith("right"), ft = g.startsWith("top"), In = g.startsWith("bottom");
                if (_t && this.resizable) {
                  var lt = (et - dt) / O + this.resizable.size.width;
                  this.setState({ maxWidth: lt > Number(Be) ? Be : lt });
                }
                (zt || this.props.lockAspectRatio && !_t) && (lt = Mt + (dt - et) / O, this.setState({ maxWidth: lt > Number(Be) ? Be : lt })), ft && this.resizable && (lt = (qe - Dt) / O + this.resizable.size.height, this.setState({ maxHeight: lt > Number(Ie) ? Ie : lt })), (In || this.props.lockAspectRatio && !ft) && (lt = jt + (Dt - qe) / O, this.setState({ maxHeight: lt > Number(Ie) ? Ie : lt }));
              }
            } else this.setState({ maxWidth: this.props.maxWidth, maxHeight: this.props.maxHeight });
            this.props.onResizeStart && this.props.onResizeStart(d, g, S);
          }, s.prototype.onResize = function(d, g, S, O) {
            var L = { x: this.state.original.x, y: this.state.original.y }, re = -O.width, fe = -O.height;
            ["top", "left", "topLeft", "bottomLeft", "topRight"].indexOf(g) !== -1 && (g === "bottomLeft" ? L.x += re : (g === "topRight" || (L.x += re), L.y += fe)), L.x === this.draggable.state.x && L.y === this.draggable.state.y || this.draggable.setState(L), this.updateOffsetFromParent();
            var pe = this.offsetFromParent, Ee = this.getDraggablePosition().x + pe.left, Ne = this.getDraggablePosition().y + pe.top;
            this.resizingPosition = { x: Ee, y: Ne }, this.props.onResize && this.props.onResize(d, g, S, O, { x: Ee, y: Ne });
          }, s.prototype.onResizeStop = function(d, g, S, O) {
            this.resizing = !1;
            var L = this.getMaxSizesFromProps(), re = L.maxWidth, fe = L.maxHeight;
            this.setState({ maxWidth: re, maxHeight: fe }), this.props.onResizeStop && this.props.onResizeStop(d, g, S, O, this.resizingPosition);
          }, s.prototype.updateSize = function(d) {
            this.resizable && this.resizable.updateSize({ width: d.width, height: d.height });
          }, s.prototype.updatePosition = function(d) {
            this.draggable.setState(d);
          }, s.prototype.updateOffsetFromParent = function() {
            var d = this.props.scale, g = this.getParent(), S = this.getSelfElement();
            if (!g || S === null) return { top: 0, left: 0 };
            var O = g.getBoundingClientRect(), L = O.left, re = O.top, fe = S.getBoundingClientRect(), pe = this.getDraggablePosition();
            this.offsetFromParent = { left: fe.left - L - pe.x * d, top: fe.top - re - pe.y * d };
          }, s.prototype.render = function() {
            var d = this.props, g = d.disableDragging, S = d.style, O = d.dragHandleClassName, L = d.position, re = d.onMouseDown, fe = d.onMouseUp, pe = d.dragAxis, Ee = d.dragGrid, Ne = d.bounds, Be = d.enableUserSelectHack, Ie = d.cancel, Ke = d.children, Me = (d.onResizeStart, d.onResize, d.onResizeStop, d.onDragStart, d.onDrag, d.onDragStop, d.resizeHandleStyles), Fe = d.resizeHandleClasses, et = d.resizeHandleComponent, qe = d.enableResizing, Le = d.resizeGrid, dt = d.resizeHandleWrapperClass, Dt = d.resizeHandleWrapperStyle, Mt = d.scale, jt = d.allowAnyClick, _t = function($t, dn) {
              var Xn = {};
              for (var Gt in $t) Object.prototype.hasOwnProperty.call($t, Gt) && dn.indexOf(Gt) < 0 && (Xn[Gt] = $t[Gt]);
              if ($t != null && typeof Object.getOwnPropertySymbols == "function") {
                var fn = 0;
                for (Gt = Object.getOwnPropertySymbols($t); fn < Gt.length; fn++) dn.indexOf(Gt[fn]) < 0 && Object.prototype.propertyIsEnumerable.call($t, Gt[fn]) && (Xn[Gt[fn]] = $t[Gt[fn]]);
              }
              return Xn;
            }(d, ["disableDragging", "style", "dragHandleClassName", "position", "onMouseDown", "onMouseUp", "dragAxis", "dragGrid", "bounds", "enableUserSelectHack", "cancel", "children", "onResizeStart", "onResize", "onResizeStop", "onDragStart", "onDrag", "onDragStop", "resizeHandleStyles", "resizeHandleClasses", "resizeHandleComponent", "enableResizing", "resizeGrid", "resizeHandleWrapperClass", "resizeHandleWrapperStyle", "scale", "allowAnyClick"]), zt = this.props.default ? Ue({}, this.props.default) : void 0;
            delete _t.default;
            var ft, In = g || O ? { cursor: "auto" } : { cursor: "move" }, lt = Ue(Ue(Ue({}, Kt), In), S), An = this.offsetFromParent, Wn = An.left, zr = An.top;
            L && (ft = { x: L.x - Wn, y: L.y - zr });
            var xt, ao = this.resizing ? void 0 : ft, Mn = this.resizing ? "both" : pe;
            return Object(u.createElement)(Yn, { ref: this.refDraggable, handle: O ? "." + O : void 0, defaultPosition: zt, onMouseDown: re, onMouseUp: fe, onStart: this.onDragStart, onDrag: this.onDrag, onStop: this.onDragStop, axis: Mn, disabled: g, grid: Ee, bounds: Ne ? this.state.bounds : void 0, position: ao, enableUserSelectHack: Be, cancel: Ie, scale: Mt, allowAnyClick: jt, nodeRef: this.resizableElement }, Object(u.createElement)(xo, Ue({}, _t, { ref: this.refResizable, defaultSize: zt, size: this.props.size, enable: typeof qe == "boolean" ? (xt = qe, { bottom: xt, bottomLeft: xt, bottomRight: xt, left: xt, right: xt, top: xt, topLeft: xt, topRight: xt }) : qe, onResizeStart: this.onResizeStart, onResize: this.onResize, onResizeStop: this.onResizeStop, style: lt, minWidth: this.props.minWidth, minHeight: this.props.minHeight, maxWidth: this.resizing ? this.state.maxWidth : this.props.maxWidth, maxHeight: this.resizing ? this.state.maxHeight : this.props.maxHeight, grid: Le, handleWrapperClass: dt, handleWrapperStyle: Dt, lockAspectRatio: this.props.lockAspectRatio, lockAspectRatioExtraWidth: this.props.lockAspectRatioExtraWidth, lockAspectRatioExtraHeight: this.props.lockAspectRatioExtraHeight, handleStyles: Me, handleClasses: Fe, handleComponent: et, scale: this.props.scale }), Ke));
          }, s.defaultProps = { maxWidth: Number.MAX_SAFE_INTEGER, maxHeight: Number.MAX_SAFE_INTEGER, scale: 1, onResizeStart: function() {
          }, onResize: function() {
          }, onResizeStop: function() {
          }, onDragStart: function() {
          }, onDrag: function() {
          }, onDragStop: function() {
          } }, s;
        }(u.PureComponent);
        l(58);
        class At extends u.Component {
          constructor(s) {
            super(s), this.handleTabClick = this.handleTabClick.bind(this);
          }
          handleTabClick(s) {
            this.setState({ activeTab: s }, () => {
              this.props.onClick(s);
            });
          }
          render() {
            return r.a.createElement("div", { className: "ck-inspector-horizontal-nav" }, this.props.definitions.map((s) => r.a.createElement(nn, { key: s, label: s, isActive: this.props.activeTab === s, onClick: () => this.handleTabClick(s) })));
          }
        }
        class nn extends u.Component {
          render() {
            return r.a.createElement("button", { className: ["ck-inspector-horizontal-nav__item", this.props.isActive ? " ck-inspector-horizontal-nav__item_active" : ""].join(" "), key: this.props.label, onClick: this.props.onClick, type: "button" }, this.props.label);
          }
        }
        l(60);
        class Ht extends u.Component {
          render() {
            const s = Array.isArray(this.props.children) ? this.props.children : [this.props.children];
            return r.a.createElement("div", { className: "ck-inspector-navbox" }, s.length > 1 ? r.a.createElement("div", { className: "ck-inspector-navbox__navigation" }, s[0]) : "", r.a.createElement("div", { className: "ck-inspector-navbox__content" }, s[s.length - 1]));
          }
        }
        class Qt extends u.Component {
          constructor(s) {
            super(s), this.handleTabClick = this.handleTabClick.bind(this);
          }
          handleTabClick(s) {
            this.props.onTabChange(s);
          }
          render() {
            const s = Array.isArray(this.props.children) ? this.props.children : [this.props.children];
            return r.a.createElement(Ht, null, [this.props.contentBefore, r.a.createElement(At, { key: "navigation", definitions: s.map((d) => d.props.label), activeTab: this.props.activeTab, onClick: this.handleTabClick }), this.props.contentAfter], s.filter((d) => d.props.label === this.props.activeTab));
          }
        }
        var cr = l(5), Dn = l.n(cr);
        class rn extends u.Component {
          render() {
            return [r.a.createElement("label", { htmlFor: this.props.id, key: "label" }, this.props.label, ":"), r.a.createElement("select", { id: this.props.id, value: this.props.value, onChange: this.props.onChange, key: "select" }, this.props.options.map((s) => r.a.createElement("option", { value: s, key: s }, s)))];
          }
          shouldComponentUpdate(s) {
            return !Dn()(this.props, s);
          }
        }
        l(62);
        class yt extends u.PureComponent {
          render() {
            const s = ["ck-inspector-button", this.props.className || "", this.props.isOn ? "ck-inspector-button_on" : "", this.props.isEnabled === !1 ? "ck-inspector-button_disabled" : ""].filter((d) => d).join(" ");
            return r.a.createElement("button", { className: s, type: "button", onClick: this.props.isEnabled === !1 ? () => {
            } : this.props.onClick, title: this.props.title || this.props.text }, r.a.createElement("span", null, this.props.text), this.props.icon);
          }
        }
        l(64);
        class Et extends u.Component {
          render() {
            return r.a.createElement("div", { className: ["ck-inspector-pane", this.props.splitVertically ? "ck-inspector-pane_vsplit" : "", this.props.isEmpty ? "ck-inspector-pane_empty" : ""].join(" ") }, this.props.children);
          }
        }
        l(66);
        const ur = { position: "relative" };
        class dr extends u.Component {
          get maxSidePaneWidth() {
            return Math.min(window.innerWidth - 400, 0.8 * window.innerWidth);
          }
          render() {
            return r.a.createElement("div", { className: "ck-inspector-side-pane" }, r.a.createElement(Or, { enableResizing: { left: !0 }, disableDragging: !0, minWidth: 200, maxWidth: this.maxSidePaneWidth, style: ur, position: { x: "100%", y: "100%" }, size: { width: this.props.sidePaneWidth, height: "100%" }, onResizeStop: (s, d, g) => this.props.setSidePaneWidth(g.style.width) }, this.props.children));
          }
        }
        var vn = Re(({ ui: { sidePaneWidth: E } }) => ({ sidePaneWidth: E }), { setSidePaneWidth: function(E) {
          return { type: "SET_SIDE_PANE_WIDTH", newWidth: E };
        } })(dr), Ut = l(11);
        l(68);
        class Wt extends u.PureComponent {
          render() {
            return [r.a.createElement("input", { type: "checkbox", className: "ck-inspector-checkbox", id: this.props.id, key: "input", checked: this.props.isChecked, onChange: this.props.onChange }), r.a.createElement("label", { htmlFor: this.props.id, key: "label" }, this.props.label)];
          }
        }
        class on extends u.Component {
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
            return r.a.createElement(Ht, null, [r.a.createElement("div", { className: "ck-inspector-tree__config", key: "root-cfg" }, r.a.createElement(rn, { id: "view-root-select", label: "Root", value: this.props.currentRootName, options: Object(gt.d)(s).map((d) => d.rootName), onChange: this.handleRootChange })), r.a.createElement("span", { className: "ck-inspector-separator", key: "separator" }), r.a.createElement("div", { className: "ck-inspector-tree__config", key: "text-cfg" }, r.a.createElement(Wt, { label: "Compact text", id: "model-compact-text", isChecked: this.props.showCompactText, onChange: this.props.toggleModelShowCompactText }), r.a.createElement(Wt, { label: "Show markers", id: "model-show-markers", isChecked: this.props.showMarkers, onChange: this.props.toggleModelShowMarkers }))], r.a.createElement(Ut.a, { className: [this.props.showMarkers ? "" : "ck-inspector-model-tree__hide-markers"], definition: this.props.treeDefinition, textDirection: s.locale.contentLanguageDirection, onClick: this.handleTreeClick, showCompactText: this.props.showCompactText, activeNode: this.props.currentNode }));
          }
        }
        var Kn = Re(({ editors: E, currentEditorName: s, model: { treeDefinition: d, currentRootName: g, currentNode: S, ui: { showMarkers: O, showCompactText: L } } }) => ({ treeDefinition: d, editors: E, currentEditorName: s, currentRootName: g, currentNode: S, showMarkers: O, showCompactText: L }), { toggleModelShowCompactText: function() {
          return { type: "TOGGLE_MODEL_SHOW_COMPACT_TEXT" };
        }, setModelCurrentRootName: function(E) {
          return { type: "SET_MODEL_CURRENT_ROOT_NAME", currentRootName: E };
        }, toggleModelShowMarkers: function() {
          return { type: "TOGGLE_MODEL_SHOW_MARKERS" };
        }, setModelCurrentNode: function(E) {
          return { type: "SET_MODEL_CURRENT_NODE", currentNode: E };
        }, setModelActiveTab: We })(on);
        l(70);
        class fr extends u.Component {
          render() {
            const s = this.props.presentation && this.props.presentation.expandCollapsibles, d = [];
            for (const g in this.props.itemDefinitions) {
              const S = this.props.itemDefinitions[g], { subProperties: O, presentation: L = {} } = S, re = O && Object.keys(O).length, fe = Object(ut.c)(String(S.value), 2e3), pe = [r.a.createElement(Jr, { key: `${this.props.name}-${g}-name`, name: g, listUid: this.props.name, canCollapse: re, colorBox: L.colorBox, expandCollapsibles: s, onClick: this.props.onPropertyTitleClick, title: S.title }), r.a.createElement("dd", { key: `${this.props.name}-${g}-value` }, r.a.createElement("input", { id: `${this.props.name}-${g}-value-input`, type: "text", value: fe, readOnly: !0 }))];
              re && pe.push(r.a.createElement(fr, { name: `${this.props.name}-${g}`, key: `${this.props.name}-${g}`, itemDefinitions: O, presentation: this.props.presentation })), d.push(pe);
            }
            return r.a.createElement("dl", { className: "ck-inspector-property-list ck-inspector-code" }, d);
          }
          shouldComponentUpdate(s) {
            return !Dn()(this.props, s);
          }
        }
        class Jr extends u.PureComponent {
          constructor(s) {
            super(s), this.state = { isCollapsed: !this.props.expandCollapsibles }, this.handleCollapsedChange = this.handleCollapsedChange.bind(this);
          }
          handleCollapsedChange() {
            this.setState({ isCollapsed: !this.state.isCollapsed });
          }
          render() {
            const s = ["ck-inspector-property-list__title"];
            let d, g;
            return this.props.canCollapse && (s.push("ck-inspector-property-list__title_collapsible"), s.push("ck-inspector-property-list__title_" + (this.state.isCollapsed ? "collapsed" : "expanded")), d = r.a.createElement("button", { type: "button", onClick: this.handleCollapsedChange }, "Toggle")), this.props.colorBox && (g = r.a.createElement("span", { className: "ck-inspector-property-list__title__color-box", style: { background: this.props.colorBox } })), this.props.onClick && s.push("ck-inspector-property-list__title_clickable"), r.a.createElement("dt", { className: s.join(" ").trim() }, d, g, r.a.createElement("label", { htmlFor: `${this.props.listUid}-${this.props.name}-value-input`, onClick: this.props.onClick ? () => this.props.onClick(this.props.name) : null, title: this.props.title }, this.props.name), ":");
          }
        }
        l(72);
        function Pr() {
          return (Pr = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var g in d) Object.prototype.hasOwnProperty.call(d, g) && (E[g] = d[g]);
            }
            return E;
          }).apply(this, arguments);
        }
        class Bn extends u.PureComponent {
          render() {
            const s = [];
            for (const d of this.props.lists) Object.keys(d.itemDefinitions).length && s.push(r.a.createElement("hr", { key: d.name + "-separator" }), r.a.createElement("h3", { key: d.name + "-header" }, r.a.createElement("a", { href: d.url, target: "_blank", rel: "noopener noreferrer" }, d.name), d.buttons && d.buttons.map((g, S) => r.a.createElement(yt, Pr({ key: "button" + S }, g)))), r.a.createElement(fr, { key: d.name + "-list", name: d.name, itemDefinitions: d.itemDefinitions, presentation: d.presentation, onPropertyTitleClick: d.onPropertyTitleClick }));
            return r.a.createElement("div", { className: "ck-inspector__object-inspector" }, r.a.createElement("h2", { className: "ck-inspector-code" }, this.props.header), s);
          }
        }
        var Nt = l(3);
        function So() {
          return (So = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var g in d) Object.prototype.hasOwnProperty.call(d, g) && (E[g] = d[g]);
            }
            return E;
          }).apply(this, arguments);
        }
        var wn = ({ styles: E = {}, ...s }) => r.a.createElement("svg", So({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, s), r.a.createElement("path", { d: "M17 15.75a.75.75 0 01.102 1.493L17 17.25H9a.75.75 0 01-.102-1.493L9 15.75h8zM2.156 2.947l.095.058 7.58 5.401a.75.75 0 01.084 1.152l-.083.069-7.58 5.425a.75.75 0 01-.958-1.148l.086-.071 6.724-4.815-6.723-4.792a.75.75 0 01-.233-.95l.057-.096a.75.75 0 01.951-.233z" }));
        function Nr() {
          return (Nr = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var g in d) Object.prototype.hasOwnProperty.call(d, g) && (E[g] = d[g]);
            }
            return E;
          }).apply(this, arguments);
        }
        var Oa = ({ styles: E = {}, ...s }) => r.a.createElement("svg", Nr({ fill: "none", xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 19 19" }, s), r.a.createElement("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M6 1a1 1 0 011-1h5a1 1 0 011 1v5a1 1 0 01-1 1h-2v2h5a1 1 0 011 1v3h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3a1 1 0 011-1h1v-2.5a.5.5 0 00-.5-.5H10v3h1a1 1 0 011 1v3a1 1 0 01-1 1H8a1 1 0 01-1-1v-3a1 1 0 011-1h1v-3H4.5a.5.5 0 00-.5.5V13h1a1 1 0 011 1v3a1 1 0 01-1 1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1v-3a1 1 0 011-1h5V7H7a1 1 0 01-1-1V1zm1.5 4.5v-4h4v4h-4zm-5 11v-2h2v2h-2zm6-2v2h2v-2h-2zm6 2v-2h2v2h-2z", fill: "#000" }));
        class Co extends u.Component {
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
            return s ? r.a.createElement(Bn, { header: [r.a.createElement("span", { key: "link" }, r.a.createElement("a", { href: s.url, target: "_blank", rel: "noopener noreferrer" }, r.a.createElement("b", null, s.type)), ":", s.type === "Text" ? r.a.createElement("em", null, s.name) : s.name), r.a.createElement(yt, { key: "log", icon: r.a.createElement(wn, null), text: "Log in console", onClick: this.handleNodeLogButtonClick }), r.a.createElement(yt, { key: "schema", icon: r.a.createElement(Oa, null), text: "Show in schema", onClick: this.handleNodeSchemaButtonClick })], lists: [{ name: "Attributes", url: s.url, itemDefinitions: s.attributes }, { name: "Properties", url: s.url, itemDefinitions: s.properties }] }) : r.a.createElement(Et, { isEmpty: "true" }, r.a.createElement("p", null, "Select a node in the tree to inspect"));
          }
        }
        var _i = Re(({ editors: E, currentEditorName: s, model: { currentNodeDefinition: d } }) => ({ editors: E, currentEditorName: s, currentNodeDefinition: d }), { setActiveTab: kt, setSchemaCurrentDefinitionName: ir })(Co);
        function xi() {
          return (xi = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var g in d) Object.prototype.hasOwnProperty.call(d, g) && (E[g] = d[g]);
            }
            return E;
          }).apply(this, arguments);
        }
        var Dr = ({ styles: E = {}, ...s }) => r.a.createElement("svg", xi({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, s), r.a.createElement("path", { d: "M9.5 4.5c1.85 0 3.667.561 5.199 1.519C16.363 7.059 17.5 8.4 17.5 9.5s-1.137 2.441-2.801 3.481c-1.532.958-3.35 1.519-5.199 1.519-1.85 0-3.667-.561-5.199-1.519C2.637 11.941 1.5 10.6 1.5 9.5s1.137-2.441 2.801-3.481C5.833 5.06 7.651 4.5 9.5 4.5zm0 1a4 4 0 11-.2.005l.2-.005c-1.655 0-3.29.505-4.669 1.367C3.431 7.742 2.5 8.84 2.5 9.5c0 .66.931 1.758 2.331 2.633C6.21 12.995 7.845 13.5 9.5 13.5c1.655 0 3.29-.505 4.669-1.367 1.4-.875 2.331-1.974 2.331-2.633 0-.66-.931-1.758-2.331-2.633C12.79 6.005 11.155 5.5 9.5 5.5zM8 6.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" }));
        const pr = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_selection-Selection.html";
        class Si extends u.Component {
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
            return r.a.createElement(Bn, { header: [r.a.createElement("span", { key: "link" }, r.a.createElement("a", { href: pr, target: "_blank", rel: "noopener noreferrer" }, r.a.createElement("b", null, "Selection"))), r.a.createElement(yt, { key: "log", icon: r.a.createElement(wn, null), text: "Log in console", onClick: this.handleSelectionLogButtonClick }), r.a.createElement(yt, { key: "scroll", icon: r.a.createElement(Dr, null), text: "Scroll to selection", onClick: this.handleScrollToSelectionButtonClick })], lists: [{ name: "Attributes", url: pr + "#function-getAttributes", itemDefinitions: d.attributes }, { name: "Properties", url: "" + pr, itemDefinitions: d.properties }, { name: "Anchor", url: pr + "#member-anchor", buttons: [{ icon: r.a.createElement(wn, null), text: "Log in console", onClick: () => Nt.a.log(s.model.document.selection.anchor) }], itemDefinitions: d.anchor }, { name: "Focus", url: pr + "#member-focus", buttons: [{ icon: r.a.createElement(wn, null), text: "Log in console", onClick: () => Nt.a.log(s.model.document.selection.focus) }], itemDefinitions: d.focus }, { name: "Ranges", url: pr + "#function-getRanges", buttons: [{ icon: r.a.createElement(wn, null), text: "Log in console", onClick: () => Nt.a.log(...s.model.document.selection.getRanges()) }], itemDefinitions: d.ranges, presentation: { expandCollapsibles: !0 } }] });
          }
        }
        var Ci = Re(({ editors: E, currentEditorName: s, model: { ranges: d } }) => {
          const g = E.get(s);
          return { editor: g, currentEditorName: s, info: function(S, O) {
            const L = S.model.document.selection, re = L.anchor, fe = L.focus, pe = { properties: { isCollapsed: { value: L.isCollapsed }, isBackward: { value: L.isBackward }, isGravityOverridden: { value: L.isGravityOverridden }, rangeCount: { value: L.rangeCount } }, attributes: {}, anchor: Rr(Object(cn.a)(re)), focus: Rr(Object(cn.a)(fe)), ranges: {} };
            for (const [Ee, Ne] of L.getAttributes()) pe.attributes[Ee] = { value: Ne };
            O.forEach((Ee, Ne) => {
              pe.ranges[Ne] = { value: "", subProperties: { start: { value: "", subProperties: Object(ut.b)(Rr(Ee.start)) }, end: { value: "", subProperties: Object(ut.b)(Rr(Ee.end)) } } };
            });
            for (const Ee in pe) Ee !== "ranges" && (pe[Ee] = Object(ut.b)(pe[Ee]));
            return pe;
          }(g, d) };
        }, {})(Si);
        function Rr({ path: E, stickiness: s, index: d, isAtEnd: g, isAtStart: S, offset: O, textNode: L }) {
          return { path: { value: E }, stickiness: { value: s }, index: { value: d }, isAtEnd: { value: g }, isAtStart: { value: S }, offset: { value: O }, textNode: { value: L } };
        }
        class Pa extends u.Component {
          render() {
            const s = function(S) {
              const O = {};
              for (const L of S) {
                const re = L.name.split(":");
                let fe = O;
                for (const pe of re) {
                  const Ee = pe === re[re.length - 1];
                  fe = fe[pe] ? fe[pe] : fe[pe] = Ee ? L : {};
                }
              }
              return O;
            }(this.props.markers), d = function S(O) {
              const L = {};
              for (const re in O) {
                const fe = O[re];
                if (fe.name) {
                  const pe = Object(ut.b)(Ti(fe));
                  L[re] = { value: "", presentation: { colorBox: fe.presentation.color }, subProperties: pe };
                } else {
                  const pe = Object.keys(fe).length;
                  L[re] = { value: pe + " marker" + (pe > 1 ? "s" : ""), subProperties: S(fe) };
                }
              }
              return L;
            }(s), g = this.props.editors.get(this.props.currentEditorName);
            return Object.keys(s).length ? r.a.createElement(Bn, { header: [r.a.createElement("span", { key: "link" }, r.a.createElement("a", { href: "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_markercollection-Marker.html", target: "_blank", rel: "noopener noreferrer" }, r.a.createElement("b", null, "Markers"))), r.a.createElement(yt, { key: "log", icon: r.a.createElement(wn, null), text: "Log in console", onClick: () => Nt.a.log([...g.model.markers]) })], lists: [{ name: "Markers tree", itemDefinitions: d, presentation: { expandCollapsibles: !0 } }] }) : r.a.createElement(Et, { isEmpty: "true" }, r.a.createElement("p", null, "No markers in the document."));
          }
        }
        var Qo = Re(({ editors: E, currentEditorName: s, model: { markers: d } }) => ({ editors: E, currentEditorName: s, markers: d }), {})(Pa);
        function Ti({ name: E, start: s, end: d, affectsData: g, managedUsingOperations: S }) {
          return { name: { value: E }, start: { value: s.path }, end: { value: d.path }, affectsData: { value: g }, managedUsingOperations: { value: S } };
        }
        l(74);
        class Go extends u.Component {
          render() {
            return this.props.currentEditorName ? r.a.createElement(Et, { splitVertically: "true" }, r.a.createElement(Kn, null), r.a.createElement(vn, null, r.a.createElement(Qt, { onTabChange: this.props.setModelActiveTab, activeTab: this.props.activeTab }, r.a.createElement(_i, { label: "Inspect" }), r.a.createElement(Ci, { label: "Selection" }), r.a.createElement(Qo, { label: "Markers" })))) : r.a.createElement(Et, { isEmpty: "true" }, r.a.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
          }
        }
        var Na = Re(({ currentEditorName: E, model: { ui: { activeTab: s } } }) => ({ currentEditorName: E, activeTab: s }), { setModelActiveTab: We })(Go);
        class Da extends u.Component {
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
            return r.a.createElement(Ht, null, [r.a.createElement("div", { className: "ck-inspector-tree__config", key: "root-cfg" }, r.a.createElement(rn, { id: "view-root-select", label: "Root", value: this.props.currentRootName, options: Object(en.d)(s).map((d) => d.rootName), onChange: this.handleRootChange })), r.a.createElement("span", { className: "ck-inspector-separator", key: "separator" }), r.a.createElement("div", { className: "ck-inspector-tree__config", key: "types-cfg" }, r.a.createElement(Wt, { label: "Show element types", id: "view-show-types", isChecked: this.props.showElementTypes, onChange: this.props.toggleViewShowElementTypes }))], r.a.createElement(Ut.a, { definition: this.props.treeDefinition, textDirection: s.locale.contentLanguageDirection, onClick: this.handleTreeClick, showCompactText: "true", showElementTypes: this.props.showElementTypes, activeNode: this.props.currentNode }));
          }
        }
        var To = Re(({ editors: E, currentEditorName: s, view: { treeDefinition: d, currentRootName: g, currentNode: S, ui: { showElementTypes: O } } }) => ({ treeDefinition: d, editors: E, currentEditorName: s, currentRootName: g, currentNode: S, showElementTypes: O }), { setViewCurrentRootName: function(E) {
          return { type: "SET_VIEW_CURRENT_ROOT_NAME", currentRootName: E };
        }, toggleViewShowElementTypes: function() {
          return { type: "TOGGLE_VIEW_SHOW_ELEMENT_TYPES" };
        }, setViewCurrentNode: function(E) {
          return { type: "SET_VIEW_CURRENT_NODE", currentNode: E };
        }, setViewActiveTab: _r })(Da);
        class mt extends u.Component {
          constructor(s) {
            super(s), this.handleNodeLogButtonClick = this.handleNodeLogButtonClick.bind(this);
          }
          handleNodeLogButtonClick() {
            Nt.a.log(this.props.currentNodeDefinition.editorNode);
          }
          render() {
            const s = this.props.currentNodeDefinition;
            return s ? r.a.createElement(Bn, { header: [r.a.createElement("span", { key: "link" }, r.a.createElement("a", { href: s.url, target: "_blank", rel: "noopener noreferrer" }, r.a.createElement("b", null, s.type), ":"), s.type === "Text" ? r.a.createElement("em", null, s.name) : s.name), r.a.createElement(yt, { key: "log", icon: r.a.createElement(wn, null), text: "Log in console", onClick: this.handleNodeLogButtonClick })], lists: [{ name: "Attributes", url: s.url, itemDefinitions: s.attributes }, { name: "Properties", url: s.url, itemDefinitions: s.properties }, { name: "Custom Properties", url: en.a + "_element-Element.html#function-getCustomProperty", itemDefinitions: s.customProperties }] }) : r.a.createElement(Et, { isEmpty: "true" }, r.a.createElement("p", null, "Select a node in the tree to inspect"));
          }
        }
        var eo = Re(({ view: { currentNodeDefinition: E } }) => ({ currentNodeDefinition: E }), {})(mt);
        const to = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_view_selection-Selection.html";
        class Ra extends u.Component {
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
            return r.a.createElement(Bn, { header: [r.a.createElement("span", { key: "link" }, r.a.createElement("a", { href: to, target: "_blank", rel: "noopener noreferrer" }, r.a.createElement("b", null, "Selection"))), r.a.createElement(yt, { key: "log", icon: r.a.createElement(wn, null), text: "Log in console", onClick: this.handleSelectionLogButtonClick }), r.a.createElement(yt, { key: "scroll", icon: r.a.createElement(Dr, null), text: "Scroll to selection", onClick: this.handleScrollToSelectionButtonClick })], lists: [{ name: "Properties", url: "" + to, itemDefinitions: d.properties }, { name: "Anchor", url: to + "#member-anchor", buttons: [{ type: "log", text: "Log in console", onClick: () => Nt.a.log(s.editing.view.document.selection.anchor) }], itemDefinitions: d.anchor }, { name: "Focus", url: to + "#member-focus", buttons: [{ type: "log", text: "Log in console", onClick: () => Nt.a.log(s.editing.view.document.selection.focus) }], itemDefinitions: d.focus }, { name: "Ranges", url: to + "#function-getRanges", buttons: [{ type: "log", text: "Log in console", onClick: () => Nt.a.log(...s.editing.view.document.selection.getRanges()) }], itemDefinitions: d.ranges, presentation: { expandCollapsibles: !0 } }] });
          }
        }
        var Oo = Re(({ editors: E, currentEditorName: s, view: { ranges: d } }) => {
          const g = E.get(s);
          return { editor: g, currentEditorName: s, info: function(S, O) {
            const L = S.editing.view.document.selection, re = { properties: { isCollapsed: { value: L.isCollapsed }, isBackward: { value: L.isBackward }, isFake: { value: L.isFake }, rangeCount: { value: L.rangeCount } }, anchor: Ir(Object(qt.a)(L.anchor)), focus: Ir(Object(qt.a)(L.focus)), ranges: {} };
            O.forEach((fe, pe) => {
              re.ranges[pe] = { value: "", subProperties: { start: { value: "", subProperties: Object(ut.b)(Ir(fe.start)) }, end: { value: "", subProperties: Object(ut.b)(Ir(fe.end)) } } };
            });
            for (const fe in re) fe !== "ranges" && (re[fe] = Object(ut.b)(re[fe]));
            return re;
          }(g, d) };
        }, {})(Ra);
        function Ir({ offset: E, isAtEnd: s, isAtStart: d, parent: g }) {
          return { offset: { value: E }, isAtEnd: { value: s }, isAtStart: { value: d }, parent: { value: g } };
        }
        class no extends u.Component {
          render() {
            return this.props.currentEditorName ? r.a.createElement(Et, { splitVertically: "true" }, r.a.createElement(To, null), r.a.createElement(vn, null, r.a.createElement(Qt, { onTabChange: this.props.setViewActiveTab, activeTab: this.props.activeTab }, r.a.createElement(eo, { label: "Inspect" }), r.a.createElement(Oo, { label: "Selection" })))) : r.a.createElement(Et, { isEmpty: "true" }, r.a.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
          }
        }
        var Ia = Re(({ currentEditorName: E, view: { ui: { activeTab: s } } }) => ({ currentEditorName: E, activeTab: s }), { setViewActiveTab: _r, updateViewState: Eo })(no);
        class Oi extends u.Component {
          constructor(s) {
            super(s), this.handleTreeClick = this.handleTreeClick.bind(this);
          }
          handleTreeClick(s, d) {
            s.persist(), s.stopPropagation(), this.props.setCommandsCurrentCommandName(d);
          }
          render() {
            return r.a.createElement(Ht, null, r.a.createElement(Ut.a, { definition: this.props.treeDefinition, onClick: this.handleTreeClick, activeNode: this.props.currentCommandName }));
          }
        }
        var Pi = Re(({ commands: { treeDefinition: E, currentCommandName: s } }) => ({ treeDefinition: E, currentCommandName: s }), { setCommandsCurrentCommandName: function(E) {
          return { type: "SET_COMMANDS_CURRENT_COMMAND_NAME", currentCommandName: E };
        } })(Oi);
        function Ni() {
          return (Ni = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var g in d) Object.prototype.hasOwnProperty.call(d, g) && (E[g] = d[g]);
            }
            return E;
          }).apply(this, arguments);
        }
        var Xo = ({ styles: E = {}, ...s }) => r.a.createElement("svg", Ni({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, s), r.a.createElement("path", { d: "M9.25 1.25a8 8 0 110 16 8 8 0 010-16zm0 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM7.344 6.485l4.98 2.765-4.98 3.018V6.485z" }));
        class Zo extends u.Component {
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
            return s ? r.a.createElement(Bn, { header: [r.a.createElement("span", { key: "link" }, r.a.createElement("a", { href: s.url, target: "_blank", rel: "noopener noreferrer" }, r.a.createElement("b", null, s.type)), ":", this.props.currentCommandName), r.a.createElement(yt, { key: "exec", icon: r.a.createElement(Xo, null), text: "Execute command", onClick: this.handleCommandExecuteButtonClick }), r.a.createElement(yt, { key: "log", icon: r.a.createElement(wn, null), text: "Log in console", onClick: this.handleCommandLogButtonClick })], lists: [{ name: "Properties", url: s.url, itemDefinitions: s.properties }] }) : r.a.createElement(Et, { isEmpty: "true" }, r.a.createElement("p", null, "Select a command to inspect"));
          }
        }
        var Di = Re(({ editors: E, currentEditorName: s, commands: { currentCommandName: d, currentCommandDefinition: g } }) => ({ editors: E, currentEditorName: s, currentCommandName: d, currentCommandDefinition: g }), {})(Zo);
        class Hn extends u.Component {
          render() {
            return this.props.currentEditorName ? r.a.createElement(Et, { splitVertically: "true" }, r.a.createElement(Pi, null), r.a.createElement(vn, null, r.a.createElement(Qt, { activeTab: "Inspect" }, r.a.createElement(Di, { label: "Inspect" })))) : r.a.createElement(Et, { isEmpty: "true" }, r.a.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
          }
        }
        var Po = Re(({ currentEditorName: E }) => ({ currentEditorName: E }), { updateCommandsState: Sr })(Hn);
        class Jo extends u.Component {
          constructor(s) {
            super(s), this.handleTreeClick = this.handleTreeClick.bind(this);
          }
          handleTreeClick(s, d) {
            s.persist(), s.stopPropagation(), this.props.setSchemaCurrentDefinitionName(d);
          }
          render() {
            return r.a.createElement(Ht, null, r.a.createElement(Ut.a, { definition: this.props.treeDefinition, onClick: this.handleTreeClick, activeNode: this.props.currentSchemaDefinitionName }));
          }
        }
        var Ri = Re(({ schema: { treeDefinition: E, currentSchemaDefinitionName: s } }) => ({ treeDefinition: E, currentSchemaDefinitionName: s }), { setSchemaCurrentDefinitionName: ir })(Jo);
        class Ii extends u.Component {
          render() {
            const s = this.props.currentSchemaDefinition;
            return s ? r.a.createElement(Bn, { header: [r.a.createElement("span", { key: "link" }, r.a.createElement("a", { href: s.urls.general, target: "_blank", rel: "noopener noreferrer" }, r.a.createElement("b", null, s.type)), ":", this.props.currentSchemaDefinitionName)], lists: [{ name: "Properties", url: s.urls.general, itemDefinitions: s.properties }, { name: "Allowed attributes", url: s.urls.allowAttributes, itemDefinitions: s.allowAttributes }, { name: "Allowed children", url: s.urls.allowChildren, itemDefinitions: s.allowChildren, onPropertyTitleClick: (d) => {
              this.props.setSchemaCurrentDefinitionName(d);
            } }, { name: "Allowed in", url: s.urls.allowIn, itemDefinitions: s.allowIn, onPropertyTitleClick: (d) => {
              this.props.setSchemaCurrentDefinitionName(d);
            } }] }) : r.a.createElement(Et, { isEmpty: "true" }, r.a.createElement("p", null, "Select a schema definition to inspect"));
          }
        }
        var Ai = Re(({ editors: E, currentEditorName: s, schema: { currentSchemaDefinitionName: d, currentSchemaDefinition: g } }) => ({ editors: E, currentEditorName: s, currentSchemaDefinitionName: d, currentSchemaDefinition: g }), { setSchemaCurrentDefinitionName: ir })(Ii);
        class ei extends u.Component {
          render() {
            return this.props.currentEditorName ? r.a.createElement(Et, { splitVertically: "true" }, r.a.createElement(Ri, null), r.a.createElement(vn, null, r.a.createElement(Qt, { activeTab: "Inspect" }, r.a.createElement(Ai, { label: "Inspect" })))) : r.a.createElement(Et, { isEmpty: "true" }, r.a.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
          }
        }
        var ti = Re(({ currentEditorName: E }) => ({ currentEditorName: E }))(ei), ni = l(47), Mi = l.n(ni), ri = l(48), oi = l.n(ri);
        function ji() {
          return (ji = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var g in d) Object.prototype.hasOwnProperty.call(d, g) && (E[g] = d[g]);
            }
            return E;
          }).apply(this, arguments);
        }
        var Ar = ({ styles: E = {}, ...s }) => r.a.createElement("svg", ji({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, s), r.a.createElement("path", { d: "M12.936 0l5 4.5v12.502l-1.504-.001v.003h1.504v1.499h-5v-1.501l3.496-.001V5.208L12.21 1.516 3.436 1.5v15.504l3.5-.001v1.5h-5V0h11z" }), r.a.createElement("path", { d: "M10.374 9.463l.085.072.477.464L11 10v.06l3.545 3.453-1.047 1.075L11 12.155V19H9v-6.9l-2.424 2.476-1.072-1.05L9.4 9.547a.75.75 0 01.974-.084zM12.799 1.5l-.001 2.774h3.645v1.5h-5.144V1.5z" }));
        l(86);
        class zi extends u.Component {
          constructor(s) {
            super(s), this.state = { isModalOpen: !1, editorDataValue: "" }, this.textarea = r.a.createRef();
          }
          render() {
            return [r.a.createElement(yt, { text: "Set editor data", icon: r.a.createElement(Ar, null), isEnabled: !!this.props.editor, onClick: () => this.setState({ isModalOpen: !0 }), key: "button" }), r.a.createElement(oi.a, { isOpen: this.state.isModalOpen, appElement: document.querySelector(".ck-inspector-wrapper"), onAfterOpen: this._handleModalAfterOpen.bind(this), overlayClassName: "ck-inspector-modal ck-inspector-quick-actions__set-data-modal", className: "ck-inspector-quick-actions__set-data-modal__content", onRequestClose: this._closeModal.bind(this), portalClassName: "ck-inspector-portal", shouldCloseOnEsc: !0, shouldCloseOnOverlayClick: !0, key: "modal" }, r.a.createElement("h2", null, "Set editor data"), r.a.createElement("textarea", { autoFocus: !0, ref: this.textarea, value: this.state.editorDataValue, placeholder: "Paste HTML here...", onChange: this._handlDataChange.bind(this), onKeyPress: (s) => {
              s.key == "Enter" && s.shiftKey && this._setEditorDataAndCloseModal();
            } }), r.a.createElement("div", { className: "ck-inspector-quick-actions__set-data-modal__buttons" }, r.a.createElement("button", { type: "button", onClick: () => {
              this.setState({ editorDataValue: this.props.editor.getData() }), this.textarea.current.focus();
            } }, "Load data"), r.a.createElement("button", { type: "button", title: "Cancel (Esc)", onClick: this._closeModal.bind(this) }, "Cancel"), r.a.createElement("button", { type: "button", title: "Set editor data (⇧+Enter)", onClick: this._setEditorDataAndCloseModal.bind(this) }, "Set data")))];
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
              var d = arguments[s];
              for (var g in d) Object.prototype.hasOwnProperty.call(d, g) && (E[g] = d[g]);
            }
            return E;
          }).apply(this, arguments);
        }
        var Qn = ({ styles: E = {}, ...s }) => r.a.createElement("svg", No({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, s), r.a.createElement("path", { d: "M12.936 0l5 4.5v14.003h-4.503L14.936 17h-10l1.503 1.503H1.936V0h11zm-9.5 1.5v15.504h12.996V5.208L12.21 1.516 3.436 1.5z" }), r.a.createElement("path", { d: "M12.799 1.5l-.001 2.774h3.645v1.5h-5.144V1.5zM9.675 18.859l-.085-.072-4.086-3.978 1.047-1.075L9 16.119V9h2v7.273l2.473-2.526 1.072 1.049-3.896 3.979a.75.75 0 01-.974.084z" }));
        function ro() {
          return (ro = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var g in d) Object.prototype.hasOwnProperty.call(d, g) && (E[g] = d[g]);
            }
            return E;
          }).apply(this, arguments);
        }
        var oo = ({ styles: E = {}, ...s }) => r.a.createElement("svg", ro({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, s), r.a.createElement("path", { d: "M3.144 15.748l2.002 1.402-1.976.516-.026-1.918zM2.438 3.391l15.346 11.023-.875 1.218-5.202-3.736-2.877 4.286.006.005-3.055.797-2.646-1.852-.04-2.95-.006-.005.006-.008v-.025l.01.008L6.02 7.81l-4.457-3.2.876-1.22zM7.25 8.695l-2.13 3.198 3.277 2.294 2.104-3.158-3.25-2.334zM14.002 0l2.16 1.512-.856 1.222c.828.967 1.144 2.141.432 3.158l-2.416 3.599-1.214-.873 2.396-3.593.005.003c.317-.452-.16-1.332-1.064-1.966-.891-.624-1.865-.776-2.197-.349l-.006-.004-2.384 3.575-1.224-.879 2.376-3.539c.674-.932 1.706-1.155 3.096-.668l.046.018.85-1.216z" }));
        function Mr() {
          return (Mr = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var g in d) Object.prototype.hasOwnProperty.call(d, g) && (E[g] = d[g]);
            }
            return E;
          }).apply(this, arguments);
        }
        var io = ({ styles: E = {}, ...s }) => r.a.createElement("svg", Mr({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, s), r.a.createElement("path", { d: "M11.28 1a1 1 0 01.948.684l.333 1 .018.066H16a.75.75 0 01.102 1.493L16 4.25h-.5V16a2 2 0 01-2 2h-8a2 2 0 01-2-2V4.25H3a.75.75 0 01-.102-1.493L3 2.75h3.42a1 1 0 01.019-.066l.333-1A1 1 0 017.721 1h3.558zM14 4.5H5V16a.5.5 0 00.41.492l.09.008h8a.5.5 0 00.492-.41L14 16V4.5zM7.527 6.06v8.951h-1V6.06h1zm5 0v8.951h-1V6.06h1zM10 6.06v8.951H9V6.06h1z" }));
        function Gn() {
          return (Gn = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var g in d) Object.prototype.hasOwnProperty.call(d, g) && (E[g] = d[g]);
            }
            return E;
          }).apply(this, arguments);
        }
        var ii = ({ styles: E = {}, ...s }) => r.a.createElement("svg", Gn({ viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg" }, s), r.a.createElement("path", { d: "M2.284 2.498c-.239.266-.184.617-.184 1.002V4H2a.5.5 0 00-.492.41L1.5 4.5V17a1 1 0 00.883.993L2.5 18h10a1 1 0 00.97-.752l-.081-.062c.438.368.976.54 1.507.526a2.5 2.5 0 01-2.232 1.783l-.164.005h-10a2.5 2.5 0 01-2.495-2.336L0 17V4.5a2 2 0 011.85-1.995L2 2.5l.284-.002zm10.532 0L13 2.5a2 2 0 011.995 1.85L15 4.5v2.28a2.243 2.243 0 00-1.5.404V4.5a.5.5 0 00-.41-.492L13 4v-.5l-.007-.144c-.031-.329.032-.626-.177-.858z" }), r.a.createElement("path", { d: "M6 .49l-.144.006a1.75 1.75 0 00-1.41.94l-.029.058.083-.004c-.69 0-1.25.56-1.25 1.25v1c0 .69.56 1.25 1.25 1.25h6c.69 0 1.25-.56 1.25-1.25v-1l-.006-.128a1.25 1.25 0 00-1.116-1.116l-.046-.002-.027-.058A1.75 1.75 0 009 .49H6zm0 1.5h3a.25.25 0 01.25.25l.007.102A.75.75 0 0010 2.99h.25v.5h-5.5v-.5H5a.75.75 0 00.743-.648l.007-.102A.25.25 0 016 1.99zm9.374 6.55a.75.75 0 01-.093 1.056l-2.33 1.954h6.127a.75.75 0 010 1.501h-5.949l2.19 1.837a.75.75 0 11-.966 1.15l-3.788-3.18a.747.747 0 01-.21-.285.75.75 0 01.17-.945l3.792-3.182a.75.75 0 011.057.093z" }));
        function Rn() {
          return (Rn = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var g in d) Object.prototype.hasOwnProperty.call(d, g) && (E[g] = d[g]);
            }
            return E;
          }).apply(this, arguments);
        }
        var Li = ({ styles: E = {}, ...s }) => r.a.createElement("svg", Rn({ viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg" }, s), r.a.createElement("path", { fill: "#4fa800", d: "M6.972 16.615a.997.997 0 01-.744-.292l-4.596-4.596a1 1 0 111.414-1.414l3.926 3.926 9.937-9.937a1 1 0 011.414 1.415L7.717 16.323a.997.997 0 01-.745.292z" }));
        l(88);
        class Ui extends u.Component {
          constructor(s) {
            super(s), this.state = { isShiftKeyPressed: !1, wasEditorDataJustCopied: !1 }, this._keyDownHandler = this._handleKeyDown.bind(this), this._keyUpHandler = this._handleKeyUp.bind(this), this._readOnlyHandler = this._handleReadOnly.bind(this), this._editorDataJustCopiedTimeout = null;
          }
          render() {
            return r.a.createElement("div", { className: "ck-inspector-editor-quick-actions" }, r.a.createElement(yt, { text: "Log editor", icon: r.a.createElement(wn, null), isEnabled: !!this.props.editor, onClick: () => console.log(this.props.editor) }), this._getLogButton(), r.a.createElement(zi, { editor: this.props.editor }), r.a.createElement(yt, { text: "Toggle read only", icon: r.a.createElement(oo, null), isOn: this.props.isReadOnly, isEnabled: !!this.props.editor, onClick: this._readOnlyHandler }), r.a.createElement(yt, { text: "Destroy editor", icon: r.a.createElement(io, null), isEnabled: !!this.props.editor, onClick: () => {
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
            return this.state.wasEditorDataJustCopied ? (s = r.a.createElement(Li, null), d = "Data copied to clipboard.") : (s = this.state.isShiftKeyPressed ? r.a.createElement(ii, null) : r.a.createElement(Qn, null), d = "Log editor data (press with Shift to copy)"), r.a.createElement(yt, { text: d, icon: s, className: this.state.wasEditorDataJustCopied ? "ck-inspector-button_data-copied" : "", isEnabled: !!this.props.editor, onClick: this._handleLogEditorDataClick.bind(this) });
          }
          _handleLogEditorDataClick({ shiftKey: s }) {
            s ? (Mi()(this.props.editor.getData()), this.setState({ wasEditorDataJustCopied: !0 }), clearTimeout(this._editorDataJustCopiedTimeout), this._editorDataJustCopiedTimeout = setTimeout(() => {
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
        var Aa = Re(({ editors: E, currentEditorName: s, currentEditorGlobals: { isReadOnly: d } }) => ({ editor: E.get(s), isReadOnly: d }), {})(Ui);
        function Do() {
          return (Do = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var g in d) Object.prototype.hasOwnProperty.call(d, g) && (E[g] = d[g]);
            }
            return E;
          }).apply(this, arguments);
        }
        var Ma = ({ styles: E = {}, ...s }) => r.a.createElement("svg", Do({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, s), r.a.createElement("path", { d: "M17.03 6.47a.75.75 0 01.073.976l-.072.084-6.984 7a.75.75 0 01-.977.073l-.084-.072-7.016-7a.75.75 0 01.976-1.134l.084.072 6.485 6.47 6.454-6.469a.75.75 0 01.977-.073l.084.072z" }));
        l(37);
        const jr = { position: "fixed", bottom: "0", left: "0", right: "0", top: "auto" };
        class hr extends u.Component {
          constructor(s) {
            super(s), Vi(this.props.height), document.body.style.setProperty("--ck-inspector-collapsed-height", "30px"), this.handleInspectorResize = this.handleInspectorResize.bind(this);
          }
          handleInspectorResize(s, d, g) {
            const S = g.style.height;
            this.props.setHeight(S), Vi(S);
          }
          render() {
            return this.props.isCollapsed ? (document.body.classList.remove("ck-inspector-body-expanded"), document.body.classList.add("ck-inspector-body-collapsed")) : (document.body.classList.remove("ck-inspector-body-collapsed"), document.body.classList.add("ck-inspector-body-expanded")), r.a.createElement(Or, { bounds: "window", enableResizing: { top: !this.props.isCollapsed }, disableDragging: !0, minHeight: "100", maxHeight: "100%", style: jr, className: ["ck-inspector", this.props.isCollapsed ? "ck-inspector_collapsed" : ""].join(" "), position: { x: 0, y: "100%" }, size: { width: "100%", height: this.props.isCollapsed ? 30 : this.props.height }, onResizeStop: this.handleInspectorResize }, r.a.createElement(Qt, { onTabChange: this.props.setActiveTab, contentBefore: r.a.createElement(Ro, { key: "docs" }), activeTab: this.props.activeTab, contentAfter: [r.a.createElement(an, { key: "selector" }), r.a.createElement("span", { className: "ck-inspector-separator", key: "separator-a" }), r.a.createElement(Aa, { key: "quick-actions" }), r.a.createElement("span", { className: "ck-inspector-separator", key: "separator-b" }), r.a.createElement(Io, { key: "inspector-toggle" })] }, r.a.createElement(Na, { label: "Model" }), r.a.createElement(Ia, { label: "View" }), r.a.createElement(Po, { label: "Commands" }), r.a.createElement(ti, { label: "Schema" })));
          }
          componentWillUnmount() {
            document.body.classList.remove("ck-inspector-body-expanded"), document.body.classList.remove("ck-inspector-body-collapsed");
          }
        }
        var ai = Re(({ editors: E, currentEditorName: s, ui: { isCollapsed: d, height: g, activeTab: S } }) => ({ isCollapsed: d, height: g, editors: E, currentEditorName: s, activeTab: S }), { toggleIsCollapsed: It, setHeight: function(E) {
          return { type: "SET_HEIGHT", newHeight: E };
        }, setEditors: wt, setCurrentEditorName: Jt, setActiveTab: kt })(hr);
        class Ro extends u.Component {
          render() {
            return r.a.createElement("a", { className: "ck-inspector-navbox__navigation__logo", title: "Go to the documentation", href: "https://ckeditor.com/docs/ckeditor5/latest/", target: "_blank", rel: "noopener noreferrer" }, "CKEditor documentation");
          }
        }
        class Fi extends u.Component {
          constructor(s) {
            super(s), this.handleShortcut = this.handleShortcut.bind(this);
          }
          render() {
            return r.a.createElement(yt, { text: "Toggle inspector", icon: r.a.createElement(Ma, null), onClick: this.props.toggleIsCollapsed, title: "Toggle inspector (Alt+F12)", className: ["ck-inspector-navbox__navigation__toggle", this.props.isCollapsed ? " ck-inspector-navbox__navigation__toggle_up" : ""].join(" ") });
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
        const Io = Re(({ ui: { isCollapsed: E } }) => ({ isCollapsed: E }), { toggleIsCollapsed: It })(Fi);
        class Ao extends u.Component {
          render() {
            return r.a.createElement("div", { className: "ck-inspector-editor-selector", key: "editor-selector" }, this.props.currentEditorName ? r.a.createElement(rn, { id: "inspector-editor-selector", label: "Instance", value: this.props.currentEditorName, options: [...this.props.editors].map(([s]) => s), onChange: (s) => this.props.setCurrentEditorName(s.target.value) }) : "");
          }
        }
        const an = Re(({ currentEditorName: E, editors: s }) => ({ currentEditorName: E, editors: s }), { setCurrentEditorName: Jt })(Ao);
        function Vi(E) {
          document.body.style.setProperty("--ck-inspector-height", E);
        }
        l(90), window.CKEDITOR_INSPECTOR_VERSION = "4.1.0";
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
            const { editors: g, options: S } = Object(On.c)(s);
            for (const O in g) {
              const L = g[O];
              Nt.a.group("%cAttached the inspector to a CKEditor 5 instance. To learn more, visit https://ckeditor.com/docs/ckeditor5.", "font-weight: bold;"), Nt.a.log(`Editor instance "${O}"`, L), Nt.a.groupEnd(), $e._editors.set(O, L), L.on("destroy", () => {
                $e.detach(O);
              }), $e._mount(S), $e._updateEditorsState();
            }
            return Object.keys(g);
          }
          static attachToAll(s) {
            const d = document.querySelectorAll(".ck.ck-content.ck-editor__editable"), g = [];
            for (const S of d) {
              const O = S.ckeditorInstance;
              O && !$e._isAttachedTo(O) && g.push(...$e.attach(O, s));
            }
            return g;
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
            $e._store.dispatch(wt($e._editors));
          }
          static _mount(s) {
            if ($e._wrapper) return;
            const d = $e._wrapper = document.createElement("div");
            let g, S;
            d.className = "ck-inspector-wrapper", document.body.appendChild(d), $e._editorListener = new Er({ onModelChange() {
              const O = $e._store;
              O.getState().ui.isCollapsed || (O.dispatch({ type: "UPDATE_MODEL_STATE" }), O.dispatch({ type: "UPDATE_COMMANDS_STATE" }));
            }, onViewRender() {
              const O = $e._store;
              O.getState().ui.isCollapsed || O.dispatch({ type: "UPDATE_VIEW_STATE" });
            }, onReadOnlyChange() {
              $e._store.dispatch({ type: "UPDATE_CURRENT_EDITOR_IS_READ_ONLY" });
            } }), $e._store = N(Xr, { editors: $e._editors, currentEditorName: Object(On.b)($e._editors), currentEditorGlobals: {}, ui: { isCollapsed: s.isCollapsed } }), $e._store.subscribe(() => {
              const O = $e._store.getState(), L = O.editors.get(O.currentEditorName);
              g !== L && (g && $e._editorListener.stopListening(g), L && $e._editorListener.startListening(L), g = L);
            }), $e._store.subscribe(() => {
              const O = $e._store, L = O.getState().ui.isCollapsed, re = S && !L;
              S = L, re && (O.dispatch({ type: "UPDATE_MODEL_STATE" }), O.dispatch({ type: "UPDATE_COMMANDS_STATE" }), O.dispatch({ type: "UPDATE_VIEW_STATE" }));
            }), m.a.render(r.a.createElement(B, { store: $e._store }, r.a.createElement(ai, null)), d);
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
var xu = _u();
const Su = /* @__PURE__ */ Eu(xu);
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
const Cu = function(xe) {
  const D = xe.plugins.get(tc), p = $(xe.ui.view.element), i = $(xe.sourceElement), l = `ckeditor${Math.floor(Math.random() * 1e9)}`, u = [
    "keypress",
    "keyup",
    "change",
    "focus",
    "blur",
    "click",
    "mousedown",
    "mouseup"
  ].map((r) => `${r}.${l}`).join(" ");
  D.on("change:isSourceEditingMode", () => {
    const r = p.find(
      ".ck-source-editing-area"
    );
    if (D.isSourceEditingMode) {
      let _ = r.attr("data-value");
      r.on(u, () => {
        _ !== (_ = r.attr("data-value")) && i.val(_);
      });
    } else
      r.off(`.${l}`);
  });
}, Tu = function(xe, D) {
  if (D.heading !== void 0) {
    var p = D.heading.options;
    p.find((i) => i.view === "h1") !== void 0 && xe.keystrokes.set(
      "Ctrl+Alt+1",
      () => xe.execute("heading", { value: "heading1" })
    ), p.find((i) => i.view === "h2") !== void 0 && xe.keystrokes.set(
      "Ctrl+Alt+2",
      () => xe.execute("heading", { value: "heading2" })
    ), p.find((i) => i.view === "h3") !== void 0 && xe.keystrokes.set(
      "Ctrl+Alt+3",
      () => xe.execute("heading", { value: "heading3" })
    ), p.find((i) => i.view === "h4") !== void 0 && xe.keystrokes.set(
      "Ctrl+Alt+4",
      () => xe.execute("heading", { value: "heading4" })
    ), p.find((i) => i.view === "h5") !== void 0 && xe.keystrokes.set(
      "Ctrl+Alt+5",
      () => xe.execute("heading", { value: "heading5" })
    ), p.find((i) => i.view === "h6") !== void 0 && xe.keystrokes.set(
      "Ctrl+Alt+6",
      () => xe.execute("heading", { value: "heading6" })
    ), p.find((i) => i.model === "paragraph") !== void 0 && xe.keystrokes.set("Ctrl+Alt+p", "paragraph");
  }
}, Ou = function(xe, D) {
  let p = null;
  const i = xe.editing.view.document, l = xe.plugins.get("ClipboardPipeline");
  i.on("clipboardOutput", (u, r) => {
    p = xe.id;
  }), i.on("clipboardInput", async (u, r) => {
    let _ = r.dataTransfer.getData("text/html");
    if (_ && _.includes("<craft-entry") && !(r.method == "drop" && p === xe.id)) {
      if (r.method == "paste" || r.method == "drop" && p !== xe.id) {
        let m = _, b = !1;
        const y = Craft.siteId;
        let v = null, C = null;
        const x = xe.getData(), N = [..._.matchAll(/data-entry-id="([0-9]+)/g)];
        u.stop();
        const G = $(xe.ui.view.element);
        let j = G.parents("form").data("elementEditor");
        await j.ensureIsDraftOrRevision();
        let V = G.parents(".input");
        if (V.length > 0) {
          let P = $(V[0]).find("div[data-config]");
          P.length > 0 && (v = $(P[0]).data("element-id"));
        }
        v == null && (v = j.settings.elementId), C = G.parents(".field").data("layoutElement");
        for (let P = 0; P < N.length; P++) {
          let M = null;
          if (N[P][1] && (M = N[P][1]), M !== null) {
            const B = new RegExp('data-entry-id="' + M + '"');
            if (!(p === xe.id && !B.test(x))) {
              let I = null;
              p !== xe.id && (D.includes(gu) ? I = xe.config.get("entryTypeOptions").map((J) => J.value) : (Craft.cp.displayError(
                Craft.t(
                  "ckeditor",
                  "This field doesn’t allow nested entries."
                )
              ), b = !0)), await Craft.sendActionRequest(
                "POST",
                "ckeditor/ckeditor/duplicate-nested-entry",
                {
                  data: {
                    entryId: M,
                    siteId: y,
                    targetEntryTypeIds: I,
                    targetOwnerId: v,
                    targetLayoutElementUid: C
                  }
                }
              ).then((J) => {
                J.data.newEntryId && (m = m.replace(
                  M,
                  J.data.newEntryId
                ));
              }).catch((J) => {
                var Q, z, A, ae;
                b = !0, Craft.cp.displayError((z = (Q = J == null ? void 0 : J.response) == null ? void 0 : Q.data) == null ? void 0 : z.message), console.error((ae = (A = J == null ? void 0 : J.response) == null ? void 0 : A.data) == null ? void 0 : ae.additionalMessage);
              });
            }
          }
        }
        b || (r.content = xe.data.htmlProcessor.toView(m), l.fire("inputTransformation", r));
      }
    }
  });
}, Au = async function(xe, D) {
  typeof xe == "string" && (xe = document.querySelector(`#${xe}`)), D.licenseKey = "GPL";
  const p = await ru.create(xe, D);
  return Craft.showCkeditorInspector && Craft.userIsAdmin && Su.attach(p), p.editing.view.change((i) => {
    const l = p.editing.view.document.getRoot();
    if (typeof D.accessibleFieldName < "u" && D.accessibleFieldName.length) {
      let u = l.getAttribute("aria-label");
      i.setAttribute(
        "aria-label",
        D.accessibleFieldName + ", " + u,
        l
      );
    }
    typeof D.describedBy < "u" && D.describedBy.length && i.setAttribute(
      "aria-describedby",
      D.describedBy,
      l
    );
  }), p.updateSourceElement(), p.model.document.on("change:data", () => {
    p.updateSourceElement();
  }), D.plugins.includes(tc) && Cu(p), D.plugins.includes(ou) && Tu(p, D), Ou(p, D.plugins), p;
};
export {
  gu as CraftEntries,
  Nu as CraftImageInsertUI,
  Iu as CraftLink,
  Ru as ImageEditor,
  Du as ImageTransform,
  Au as create
};
