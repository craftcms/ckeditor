import { ImageInsertUI as Vc, ButtonView as bi, IconImage as Wc, Command as Ts, Plugin as Bn, ImageUtils as Jl, Collection as Sa, ViewModel as xa, createDropdown as Ca, DropdownButtonView as Hc, IconObjectSizeMedium as $c, addListToDropdown as Os, Widget as qc, viewToModelPositionOutsideModelElement as Yc, toWidget as Kc, DomEventObserver as Qc, View as Gr, IconPlus as ec, WidgetToolbarRepository as Gl, isWidget as Gc, findAttributeRange as Xc, LinkUI as Xl, ContextualBalloon as Zc, Range as Jc, SwitchButtonView as eu, LabeledFieldView as tu, createLabeledInputText as nu, ClassicEditor as ru, SourceEditing as tc, Heading as ou } from "ckeditor5";
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class Ru extends Vc {
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
    const p = this.editor, i = p.t, u = new bi(D);
    u.isEnabled = !0, u.label = i("Insert image"), u.icon = Wc, u.tooltip = !0;
    const c = p.commands.get("insertImage");
    return u.bind("isEnabled").to(c), this.listenTo(u, "execute", () => this._showImageSelectModal()), u;
  }
  _showImageSelectModal() {
    const D = this._assetSources, p = this.editor, i = p.config, u = Object.assign({}, i.get("assetSelectionCriteria"), {
      kind: "image"
    });
    Craft.createElementSelectorModal("craft\\elements\\Asset", {
      storageKey: `ckeditor:${this.pluginName}:'craft\\elements\\Asset'`,
      sources: D,
      criteria: u,
      defaultSiteId: i.get("elementSiteId"),
      transforms: i.get("transforms"),
      multiSelect: !0,
      autoFocusSearchBox: !1,
      onSelect: (c, r) => {
        this._processAssetUrls(c, r).then(() => {
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
      const u = this.editor, c = u.config.get("defaultTransform"), r = new Craft.Queue(), _ = [];
      r.on("afterRun", () => {
        u.execute("insertImage", { source: _ }), i();
      });
      for (const g of D)
        r.push(
          () => new Promise((y) => {
            const v = this._isTransformUrl(g.url);
            if (!v && c)
              this._getTransformUrl(g.id, c, (b) => {
                _.push(b), y();
              });
            else {
              const b = this._buildAssetUrl(
                g.id,
                g.url,
                v ? p : c
              );
              _.push(b), y();
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
    }).then(({ data: u }) => {
      i(this._buildAssetUrl(D, u.url, p));
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
        async (u, c) => {
          D.editing.view, D.model;
          const r = D.editing.mapper, _ = c.dropRange;
          if (_) {
            const g = _.start, y = r.toModelPosition(g);
            D.model.change((v) => {
              v.setSelection(y, 0);
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
    const u = this.editor.config.get("defaultTransform"), c = new Craft.Queue(), r = [];
    c.on("afterRun", () => {
      this.editor.execute("insertImage", { source: r, breakBlock: !0 });
    }), c.push(
      () => new Promise((_) => {
        const g = this._isTransformUrl(i.url);
        if (!g && u)
          this._getTransformUrl(i.assetId, u, (y) => {
            r.push(y), _();
          });
        else {
          const y = this._buildAssetUrl(
            i.assetId,
            i.url,
            g ? transform : u
          );
          r.push(y), _();
        }
      })
    );
  }
  /**
   * On Upload Failure.
   */
  _onUploadFailure(D, p = null) {
    var g, y;
    const i = D instanceof CustomEvent ? D.detail : (g = p == null ? void 0 : p.jqXHR) == null ? void 0 : g.responseJSON;
    let { message: u, filename: c, errors: r } = i || {};
    c = c || ((y = p == null ? void 0 : p.files) == null ? void 0 : y[0].name);
    let _ = r ? Object.values(r).flat() : [];
    u || (_.length ? u = _.join(`
`) : c ? u = Craft.t("app", "Upload failed for “{filename}”.", { filename: c }) : u = Craft.t("app", "Upload failed.")), Craft.cp.displayError(u), this.progressBar.hideProgressBar(), this.$container.removeClass("uploading");
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class iu extends Ts {
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
    const i = this.editor.model, u = this._element(), c = this._srcInfo(u);
    if (this.value = {
      transform: D.transform
    }, c) {
      const r = `#asset:${c.assetId}` + (D.transform ? `:transform:${D.transform}` : "");
      i.change((_) => {
        const g = c.src.replace(/#.*/, "") + r;
        _.setAttribute("src", g, u);
      }), Craft.sendActionRequest("post", "ckeditor/ckeditor/image-url", {
        data: {
          assetId: c.assetId,
          transform: D.transform
        }
      }).then(({ data: _ }) => {
        i.change((g) => {
          const y = _.url + r;
          g.setAttribute("src", y, u), _.width && g.setAttribute("width", _.width, u), _.height && g.setAttribute("height", _.height, u);
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
class nc extends Bn {
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
class su extends Bn {
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
    const p = this.editor, i = p.t, u = {
      name: "transformImage:original",
      value: null
    }, c = [
      u,
      ...D.map((_) => ({
        label: _.name,
        name: `transformImage:${_.handle}`,
        value: _.handle
      }))
    ], r = (_) => {
      const g = p.commands.get("transformImage"), y = Ca(_, Hc), v = y.buttonView;
      return v.set({
        tooltip: i("Resize image"),
        commandValue: null,
        icon: au,
        isToggleable: !0,
        label: this._getOptionLabelValue(u),
        withText: !0,
        class: "ck-resize-image-button"
      }), v.bind("label").to(g, "value", (b) => {
        if (!b || !b.transform)
          return this._getOptionLabelValue(u);
        const C = D.find(
          (x) => x.handle === b.transform
        );
        return C ? C.name : b.transform;
      }), y.bind("isEnabled").to(this), Os(
        y,
        () => this._getTransformDropdownListItemDefinitions(c, g),
        {
          ariaLabel: i("Image resize list")
        }
      ), this.listenTo(y, "execute", (b) => {
        p.execute(b.source.commandName, {
          transform: b.source.commandValue
        }), p.editing.view.focus();
      }), y;
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
    const i = new Sa();
    return D.map((u) => {
      const c = {
        type: "button",
        model: new xa({
          commandName: "transformImage",
          commandValue: u.value,
          label: this._getOptionLabelValue(u),
          withText: !0,
          icon: null
        })
      };
      c.model.bind("isOn").to(p, "value", lu(u.value)), i.add(c);
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
class Du extends Bn {
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
class cu extends Ts {
  refresh() {
    const D = this._element(), p = this._srcInfo(D);
    if (this.isEnabled = !!p, this.isEnabled) {
      let i = {
        assetId: p.assetId
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
  _reloadImage(D, p) {
    let u = this.editor.model;
    this._getAllImageAssets().forEach((r) => {
      if (r.srcInfo.assetId == D)
        if (r.srcInfo.transform) {
          let _ = {
            assetId: r.srcInfo.assetId,
            handle: r.srcInfo.transform
          };
          Craft.sendActionRequest("POST", "assets/generate-transform", {
            data: _
          }).then((g) => {
            let y = g.data.url + "?" + (/* @__PURE__ */ new Date()).getTime() + "#asset:" + r.srcInfo.assetId + ":transform:" + r.srcInfo.transform;
            u.change((v) => {
              v.setAttribute("src", y, r.element);
            });
          });
        } else {
          let _ = r.srcInfo.baseSrc + "?" + (/* @__PURE__ */ new Date()).getTime() + "#asset:" + r.srcInfo.assetId;
          u.change((g) => {
            g.setAttribute("src", _, r.element);
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
    let u = [];
    for (const c of i.getWalker({ ignoreElementEnd: !0 }))
      if (c.item.is("element") && c.item.name === "imageBlock") {
        let r = this._srcInfo(c.item);
        r && u.push({
          element: c.item,
          srcInfo: r
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
class rc extends Bn {
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
class uu extends Bn {
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
    const D = this.editor, p = D.t, i = D.commands.get("imageEditor"), u = () => {
      const c = new bi();
      return c.set({
        label: p("Edit Image"),
        withText: !0
      }), c.bind("isEnabled").to(i), this.listenTo(c, "execute", (r) => {
        D.execute("imageEditor"), D.editing.view.focus();
      }), c;
    };
    D.ui.componentFactory.add("imageEditor", u);
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class Au extends Bn {
  static get requires() {
    return [rc, uu];
  }
  static get pluginName() {
    return "ImageEditor";
  }
}
class du extends Ts {
  execute(D) {
    const p = this.editor, i = p.model.document.selection;
    p.model.change((u) => {
      const c = u.createElement("craftEntryModel", {
        ...Object.fromEntries(i.getAttributes()),
        cardHtml: D.cardHtml,
        entryId: D.entryId,
        siteId: D.siteId
      });
      p.model.insertObject(c, null, null, {
        setSelection: "on"
      });
    });
  }
  refresh() {
    const p = this.editor.model.document.selection, i = !p.isCollapsed && p.getFirstRange();
    this.isEnabled = !i;
  }
}
class fu extends Bn {
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
      model: (i, { writer: u }) => {
        const c = i.getAttribute("data-card-html"), r = i.getAttribute("data-entry-id"), _ = i.getAttribute("data-site-id") ?? null;
        return u.createElement("craftEntryModel", {
          cardHtml: c,
          entryId: r,
          siteId: _
        });
      }
    }), D.for("editingDowncast").elementToElement({
      model: "craftEntryModel",
      view: (i, { writer: u }) => {
        const c = i.getAttribute("entryId") ?? null, r = i.getAttribute("siteId") ?? null, _ = u.createContainerElement("div", {
          class: "cke-entry-card",
          "data-entry-id": c,
          "data-site-id": r
        });
        return p(i, u, _), Kc(_, u);
      }
    }), D.for("dataDowncast").elementToElement({
      model: "craftEntryModel",
      view: (i, { writer: u }) => {
        const c = i.getAttribute("entryId") ?? null, r = i.getAttribute("siteId") ?? null;
        return u.createContainerElement("craft-entry", {
          "data-entry-id": c,
          "data-site-id": r
        });
      }
    });
    const p = (i, u, c) => {
      this._getCardHtml(i).then((r) => {
        const _ = u.createRawElement(
          "div",
          null,
          function(y) {
            y.innerHTML = r.cardHtml, Craft.appendHeadHtml(r.headHtml), Craft.appendBodyHtml(r.bodyHtml);
          }
        );
        u.insert(u.createPositionAt(c, 0), _);
        const g = this.editor;
        g.editing.view.focus(), setTimeout(() => {
          Craft.cp.elementThumbLoader.load($(g.ui.element));
        }, 100), g.model.change((y) => {
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
  async _getCardHtml(D) {
    var _, g, y;
    let p = D.getAttribute("cardHtml") ?? null, i = $(this.editor.sourceElement).parents(".field");
    const u = $(i[0]).data("layout-element");
    if (p)
      return { cardHtml: p };
    const c = D.getAttribute("entryId") ?? null, r = D.getAttribute("siteId") ?? null;
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
            siteId: r,
            layoutElementUid: u
          }
        }
      );
      return x;
    } catch (v) {
      return console.error((_ = v == null ? void 0 : v.response) == null ? void 0 : _.data), { cardHtml: '<div class="element card"><div class="card-content"><div class="card-heading"><div class="label error"><span>' + (((y = (g = v == null ? void 0 : v.response) == null ? void 0 : g.data) == null ? void 0 : y.message) || "An unknown error occurred.") + "</span></div></div></div></div>" };
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
    super(D), this.bindTemplate, this.set("isFocused", !1), this.entriesUi = p.entriesUi, this.editor = this.entriesUi.editor, this.entryType = p.entryType;
    const i = this.editor.commands.get("insertEntry");
    let u = new bi(), c = {
      commandValue: this.entryType.model.commandValue,
      //entry type id
      label: this.entryType.model.label,
      withText: this.entryType.model.withText,
      tooltip: Craft.t("app", "New {type}", {
        type: this.entryType.model.label
      })
    }, r = ["btn", "ck-reset_all-excluded"];
    this.entryType.model.icon && r.push(["icon"]), this.entryType.model.icon && this.entryType.model.withIcon && !this.entryType.model.withText && r.push(["cp-icon"]), this.entryType.model.color && this.entryType.model.withColor && r.push([this.entryType.model.color]), c.class = r.join(" "), this.entryType.model.withIcon && (c.icon = this.entryType.model.icon), u.set(c), this.listenTo(u, "execute", (_) => {
      this.entriesUi._showCreateEntrySlideout(_.source.commandValue);
    }), u.bind("isEnabled").to(i), this.setTemplate({
      tag: "div",
      attributes: {
        // ck-reset_all-excluded class is needed so that CKE doesn't mess with the styles we already have
        class: ["entry-type-button"]
      },
      children: [u]
    });
  }
  // this is needed so that the button is focusable
  focus() {
    this.element.children[0].focus();
  }
}
class mu extends Gr {
  constructor(D, p = {}) {
    super(D), this.bindTemplate, this.set("isFocused", !1), this.entriesUi = p.entriesUi, this.editor = this.entriesUi.editor;
    const i = p.entryTypes, u = this.editor.commands.get("insertEntry");
    let c = new Sa();
    i.forEach((_) => {
      _.model.color && _.model.withColor && (_.model.class || (_.model.class = ""), _.model.class += "icon " + _.model.color), c.add(_);
    });
    const r = Ca(D);
    r.buttonView.set({
      label: Craft.t("ckeditor", "Add nested content"),
      icon: ec,
      tooltip: !0,
      withText: !1
    }), r.bind("isEnabled").to(u), r.id = Craft.uuid(), Os(r, () => c, {
      ariaLabel: Craft.t("ckeditor", "Entry types list")
    }), this.listenTo(r, "execute", (_) => {
      this.entriesUi._showCreateEntrySlideout(_.source.commandValue);
    }), this.setTemplate({
      tag: "div",
      attributes: {
        // ck-reset_all-excluded class is needed so that CKE doesn't mess with the styles we already have
        class: ["entry-type-button"]
      },
      children: [r]
    });
  }
  // this is needed so that the dropdown button is focusable
  focus() {
    this.element.children[0].children[0].focus();
  }
}
class gu extends Gr {
  constructor(D, p = {}) {
    super(D), this.bindTemplate, this.set("isFocused", !1), this.entriesUi = p.entriesUi, this.editor = this.entriesUi.editor;
    const i = this.editor.commands.get("insertEntry"), u = Ca(D);
    u.buttonView.set({
      label: Craft.t("ckeditor", "Add nested content"),
      icon: ec,
      tooltip: !0,
      withText: !1
    }), u.bind("isEnabled").to(i), u.id = Craft.uuid(), this.listenTo(u, "execute", (c) => {
      this.entriesUi._showCreateEntrySlideout(c.source.commandValue);
    }), this.setTemplate({
      tag: "div",
      attributes: {
        // ck-reset_all-excluded class is needed so that CKE doesn't mess with the styles we already have
        class: ["entry-type-button"],
        tabindex: -1
      },
      children: [u]
    });
  }
  // this is needed so that the button is focusable
  focus() {
    this.element.focus();
  }
}
class yu extends Bn {
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
    D.addObserver(pu), this.editor.listenTo(p, "dblclick", (i, u) => {
      if (!this.editor.isReadOnly) {
        const c = this.editor.editing.mapper.toModelElement(
          u.target.parent
        );
        c.name === "craftEntryModel" && this._initEditEntrySlideout(u, c);
      }
    });
  }
  _initEditEntrySlideout(D = null, p = null) {
    if (this.editor.isReadOnly)
      return;
    p === null && (p = this.editor.model.document.selection.getSelectedElement());
    const i = p.getAttribute("entryId"), u = p.getAttribute("siteId") ?? null;
    this._showEditEntrySlideout(i, u, p);
  }
  /**
   * Creates toolbar buttons that allow for an entry of given type to be inserted into the editor
   *
   * @private
   */
  _createToolbarEntriesButtons() {
    const p = this.editor.config.get("entryTypeOptions");
    if (!(!p || !p.length))
      if (p.length == 1 && p[0].value == "fake")
        this.editor.ui.componentFactory.add(
          "createEntry",
          (i) => new gu(this.editor.locale, {
            entriesUi: this
          })
        );
      else {
        let i = this._getEntryTypeButtonsCollection(
          p ?? []
        ), u = i.filter((r) => r.model.expanded), c = i.filter((r) => !r.model.expanded);
        u.forEach((r, _) => {
          this.editor.ui.componentFactory.add(
            `createEntry-${r.model.uid}`,
            (g) => new hu(this.editor.locale, {
              entriesUi: this,
              entryType: r
            })
          );
        }), this.editor.ui.componentFactory.add(
          "createEntry",
          (r) => new mu(this.editor.locale, {
            entriesUi: this,
            entryTypes: c
          })
        );
      }
  }
  /**
   * Creates a list of entry type options that go into the insert entry button
   *
   * @param options
   * @returns {Collection<Record<string, any>>}
   * @private
   */
  _getEntryTypeButtonsCollection(D) {
    const p = new Sa();
    return D.map((i) => {
      const u = {
        type: "button",
        model: new xa({
          commandValue: i.value,
          //entry type id
          color: i.color,
          expanded: i.expanded,
          icon: i.icon,
          label: i.label || i.value,
          uid: i.uid,
          withColor: i.withColor,
          withIcon: i.withIcon,
          withText: i.expanded ? i.withText : !0
          // items in a dropdown should always have text
        })
      };
      p.add(u);
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
    const p = new bi(D);
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
    const u = this.editor, c = u.model, r = this.getElementEditor();
    let _ = this._getCardElement(D);
    const g = _.data("owner-id"), y = Craft.createElementEditor(this.elementType, null, {
      elementId: D,
      params: {
        siteId: p
      },
      onLoad: () => {
        y.elementEditor.on("update", () => {
          Craft.Preview.refresh();
        });
      },
      onBeforeSubmit: async () => {
        if (_ !== null && Garnish.hasAttr(_, "data-owner-is-canonical") && (!r || !r.settings.isUnpublishedDraft)) {
          await y.elementEditor.checkForm(!0, !0);
          let v = $(u.sourceElement).attr("name");
          r && v && await r.setFormValue(v, "*"), r && r.settings.draftId && y.elementEditor.settings.draftId && (y.elementEditor.settings.saveParams || (y.elementEditor.settings.saveParams = {}), y.elementEditor.settings.saveParams.action = "elements/save-nested-element-for-derivative", y.elementEditor.settings.saveParams.newOwnerId = r.getDraftElementId(g));
        }
      },
      onSubmit: (v) => {
        let b = this._getCardElement(D);
        b !== null && v.data.id != b.data("id") && (b.attr("data-id", v.data.id).data("id", v.data.id).data("owner-id", v.data.ownerId), u.editing.model.change((C) => {
          C.setAttribute("entryId", v.data.id, i), u.ui.update();
        }), Craft.refreshElementInstances(v.data.id));
      }
    });
    y.on("beforeClose", () => {
      c.change((v) => {
        v.setSelection(v.createPositionAfter(i)), u.editing.view.focus();
      });
    }), y.on("close", () => {
      u.editing.view.focus();
    });
  }
  /**
   * Creates new entry and opens the element editor for it
   *
   * @param entryTypeId
   * @private
   */
  async _showCreateEntrySlideout(D) {
    var b, C;
    const p = this.editor, i = p.model, c = i.document.selection.getFirstRange(), r = p.config.get(
      "nestedElementAttributes"
    ), _ = Object.assign({}, r, {
      typeId: D
    }), g = this.getElementEditor();
    g && (await g.markDeltaNameAsModified(p.sourceElement.name), _.ownerId = g.getDraftElementId(
      r.ownerId
    ));
    let y;
    try {
      y = (await Craft.sendActionRequest(
        "POST",
        "elements/create",
        {
          data: _
        }
      )).data;
    } catch (x) {
      throw Craft.cp.displayError((C = (b = x == null ? void 0 : x.response) == null ? void 0 : b.data) == null ? void 0 : C.error), x;
    }
    const v = Craft.createElementEditor(this.elementType, {
      elementId: y.element.id,
      draftId: y.element.draftId,
      params: {
        fresh: 1,
        siteId: y.element.siteId
      },
      onSubmit: (x) => {
        p.commands.execute("insertEntry", {
          entryId: x.data.id,
          siteId: x.data.siteId
        });
      }
    });
    v.on("beforeClose", () => {
      v.$triggerElement = null, i.change((x) => {
        x.setSelection(
          x.createPositionAt(
            p.model.document.getRoot(),
            c.end.path[0]
          )
        );
      }), p.editing.view.focus();
    });
  }
}
class bu extends Bn {
  static get requires() {
    return [fu, yu];
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
class vu extends Bn {
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
        view: (i, { writer: u }) => {
          const c = u.createAttributeElement(
            "a",
            { [this.conversionData[p].view]: i },
            { priority: 5 }
          );
          return u.setCustomProperty("link", !0, c), c;
        }
      }), D.for("upcast").attributeToAttribute({
        view: {
          name: "a",
          key: this.conversionData[p].view
        },
        model: {
          key: this.conversionData[p].model,
          value: (i, u) => i.getAttribute(this.conversionData[p].view)
        }
      });
  }
  _adjustLinkCommand() {
    const D = this.editor, p = D.commands.get("link");
    let i = !1;
    p.on(
      "execute",
      (u, c) => {
        if (i) {
          i = !1;
          return;
        }
        u.stop(), i = !0;
        const r = c[c.length - 1], _ = D.model.document.selection;
        D.model.change((g) => {
          D.execute("link", ...c);
          const y = _.getFirstPosition();
          this.conversionData.forEach((v) => {
            if (_.isCollapsed) {
              const b = y.textNode || y.nodeBefore;
              r[v.model] ? g.setAttribute(
                v.model,
                r[v.model],
                g.createRangeOn(b)
              ) : g.removeAttribute(v.model, g.createRangeOn(b));
            } else {
              const b = D.model.schema.getValidRanges(
                _.getRanges(),
                v.model
              );
              for (const C of b)
                r[v.model] ? g.setAttribute(
                  v.model,
                  r[v.model],
                  C
                ) : g.removeAttribute(v.model, C);
            }
          });
        });
      },
      { priority: "high" }
    );
  }
  _adjustUnlinkCommand() {
    const D = this.editor, p = D.commands.get("unlink"), { model: i } = D, { selection: u } = i.document;
    let c = !1;
    p.on(
      "execute",
      (r) => {
        c || (r.stop(), i.change(() => {
          c = !0, D.execute("unlink"), c = !1, i.change((_) => {
            let g;
            this.conversionData.forEach((y) => {
              u.isCollapsed ? g = [
                Xc(
                  u.getFirstPosition(),
                  y.model,
                  u.getAttribute(y.model),
                  i
                )
              ] : g = i.schema.getValidRanges(
                u.getRanges(),
                y.model
              );
              for (const v of g)
                _.removeAttribute(y.model, v);
            });
          });
        }));
      },
      { priority: "high" }
    );
  }
}
class ku extends Gr {
  constructor(D, p = {}) {
    super(D), this.bindTemplate, this.set("isFocused", !1), this.linkUi = p.linkUi, this.editor = this.linkUi.editor, this.elementId = this.linkUi._getLinkElementId(), this.siteId = this.linkUi._getLinkSiteId(), this.linkOption = p.linkOption;
    const i = this.linkUi._getLinkElementRefHandle();
    if (this.button = null, i) {
      const u = this.linkUi.linkTypeDropdownItemModels[i];
      this.linkUi.linkTypeDropdownView.buttonView.label == u.label && (this.button = Craft.t("app", "Loading"));
    }
    this.button == null && (this.button = new bi(), this.button.set({
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
    this.element.addEventListener("click", function(u) {
      (this.children[0].classList.contains("add") || u.target.classList.contains("ck-button__label")) && (p._hideUI(), D._showElementSelectorModal(i));
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
        const r = [
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
        Craft.addActionsToChip(c, r), D._alignFocus();
      }
    }).catch((u) => {
      var c, r, _, g;
      throw Craft.cp.displayError((r = (c = u == null ? void 0 : u.response) == null ? void 0 : c.data) == null ? void 0 : r.message), ((g = (_ = u == null ? void 0 : u.response) == null ? void 0 : _.data) == null ? void 0 : g.message) ?? u;
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
      this.advancedChildren._items.forEach((u, c) => {
        p._focusables.add(u, i + c + 1), p.focusTracker.add(u.element, i + c + 1);
      });
    } else
      this.advancedChildren._items.forEach((i, u) => {
        p._focusables.remove(i), p.focusTracker.remove(i.element);
      });
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class Eu extends Bn {
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
    const D = this.editor;
    this._linkUI = D.plugins.get(Xl), this._balloon = D.plugins.get(Zc), this.linkOptions = D.config.get("linkOptions"), this.advancedLinkFields = D.config.get("advancedLinkFields"), this.conversionData = this.advancedLinkFields.map((i) => i.conversion ?? null).filter((i) => i);
    const p = CKE_LOCALIZED_REF_HANDLES.join("|");
    this.elementTypeRefHandleRE = new RegExp(
      `(#((?:${p})):\\d+)`
    ), this.urlWithRefHandleRE = new RegExp(
      `(.+)(#((?:${p})):(\\d+))(?:@(\\d+))?`
    ), this._modifyFormViewTemplate(), this._balloon.on(
      "set:visibleView",
      (i, u, c, r) => {
        const { formView: _ } = this._linkUI;
        c === r || c !== _ || this._alignFocus();
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
    this.linkTypeDropdownView = Ca(D.locale), this.linkTypeDropdownView.buttonView.set({
      label: "",
      withText: !0,
      isVisible: !0
    }), this.linkTypeDropdownItemModels = Object.fromEntries(
      this._getLinkListItemDefinitions().map((u) => [u.handle, u])
    ), Os(
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
        this._selectLinkTypeDropdownItem(c.refHandle), this._showLinkTypeForm(c, D);
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
    this.linkTypeDropdownView.buttonView.set("label", i), Object.values(this.linkTypeDropdownItemModels).forEach((u) => {
      u.set("isOn", u.handle === p.handle);
    });
  }
  /**
   * Get a list of all the options that should be shown in the link type dropdown.
   */
  _getLinkListItemDefinitions() {
    const D = [];
    for (const p of this.linkOptions)
      D.push(
        new xa({
          label: p.label,
          handle: p.refHandle,
          linkOption: p,
          withText: !0
        })
      );
    return D.push(
      new xa({
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
    let p = null;
    const { formView: i } = this._linkUI, { children: u } = i, { urlInputView: c } = i, { displayedTextInputView: r } = i;
    r.focus(), this.linkTypeWrapperView !== null && u.remove(this.linkTypeWrapperView), D === "default" ? p = c : (this._getLinkSiteId(), this._getLinkElementId(), p = new ku(i.locale, {
      linkUi: this,
      linkOption: D,
      value: this._urlInputValue()
    })), this.linkTypeWrapperView = new Gr(), this.linkTypeWrapperView.setTemplate({
      tag: "div",
      children: [this.linkTypeDropdownView, p],
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
  _showElementSelectorModal(D) {
    const p = this.editor, i = p.model, u = i.document.selection, c = u.isCollapsed, r = u.getFirstRange(), _ = this._linkUI._getSelectedLinkElement(), g = () => {
      p.editing.view.focus(), !c && r && i.change((y) => {
        y.setSelection(r);
      }), this._linkUI._hideFakeVisualSelection();
    };
    _ || this._linkUI._showFakeVisualSelection(), Craft.createElementSelectorModal(D.elementType, {
      storageKey: `ckeditor:${this.pluginName}:${D.elementType}`,
      sources: D.sources,
      criteria: D.criteria,
      defaultSiteId: p.config.get("elementSiteId"),
      autoFocusSearchBox: !1,
      onSelect: (y) => {
        if (y.length) {
          const v = y[0], b = `${v.url}#${D.refHandle}:${v.id}@${v.siteId}`;
          if (p.editing.view.focus(), (!c || _) && r) {
            i.change((N) => {
              N.setSelection(r);
            });
            const C = p.commands.get("link");
            let x = this._getAdvancedFieldValues();
            C.execute(b, x);
          } else
            i.change((C) => {
              let x = this._getAdvancedFieldValues();
              if (C.insertText(
                v.label,
                {
                  linkHref: b
                },
                u.getFirstPosition(),
                x
              ), r instanceof Jc)
                try {
                  const N = r.clone();
                  N.end.path[1] += v.label.length, C.setSelection(N);
                } catch {
                }
            });
          this._linkUI._hideFakeVisualSelection(), setTimeout(() => {
            this._linkUI._showUI(!0);
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
    const D = this.editor.commands.get("link"), { formView: p } = this._linkUI, { children: i } = p;
    this.advancedView = new wu(p.locale, {
      linkUi: this
    }), i.add(this.advancedView, 3);
    for (const c of this.advancedLinkFields) {
      let r = (u = c.conversion) == null ? void 0 : u.model;
      if (r && typeof p[r] > "u")
        if (c.conversion.type === "bool") {
          const _ = new eu();
          _.set({
            withText: !0,
            label: c.label,
            isToggleable: !0
          }), c.tooltip && (_.tooltip = c.tooltip), this.advancedView.advancedChildren.add(_), p[r] = _, p[r].bind("isOn").to(D, r, (g) => g === void 0 ? (p[r].element.value = "", !1) : (p[r].element.value = c.conversion.value, !0)), _.on("execute", () => {
            _.isOn ? (_.isOn = !1, p[r].element.value = "") : (_.isOn = !0, p[r].element.value = c.conversion.value);
          });
        } else {
          let _ = this._addLabeledField(c);
          p[r] = _, p[r].fieldView.bind("value").to(D, r), p[r].fieldView.element.value = D[r] || "";
        }
      else if (c.value === "urlSuffix") {
        let _ = this._addLabeledField(c);
        this.listenTo(
          _.fieldView,
          "change:isFocused",
          (g, y, v, b) => {
            if (v !== b && !v) {
              let C = g.source.element.value, x = null;
              const N = this._urlInputRefMatch(this.urlWithRefHandleRE);
              N ? x = N[1] : x = this._urlInputValue();
              try {
                let G = new URL(x), K = G.search, j = G.hash, B = x.replace(j, "").replace(K, "");
                const P = this._urlInputValue().replace(
                  x,
                  B + C
                );
                p.urlInputView.fieldView.set("value", P);
              } catch {
                let [K, j] = x.split("#"), [B, P] = K.split("?");
                const M = this._urlInputValue().replace(
                  x,
                  B + C
                );
                p.urlInputView.fieldView.set("value", M);
              }
            }
          }
        ), this.listenTo(p.urlInputView.fieldView, "change:value", (g) => {
          this._toggleUrlSuffixInputView(_, g.source.isEmpty);
        }), this.listenTo(
          p.urlInputView.fieldView,
          "change:isFocused",
          (g) => {
            this._toggleUrlSuffixInputView(_, g.source.isEmpty);
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
      let u = null;
      i ? u = i[1] : u = this._urlInputValue();
      try {
        let c = new URL(u), r = c.search, _ = c.hash;
        D.fieldView.set("value", r + _);
      } catch {
        let [r, _] = u.split("#"), [g, y] = r.split("?");
        _ = _ ? "#" + _ : "", y = y ? "?" + y : "", D.fieldView.set("value", y + _);
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
        let u = this._getAdvancedFieldValues();
        p.once(
          "execute",
          (c, r) => {
            r.length === 4 ? Object.assign(r[3], u) : r.push(u);
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
    this.conversionData.forEach((u) => {
      p.set(u.model, null), D.model.document.on("change", () => {
        p[u.model] = i.getAttribute(u.model);
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
      let u = [];
      i.type === "bool" ? u[i.model] = D[i.model].element.value : u[i.model] = D[i.model].fieldView.element.value, Object.assign(p, u);
    }), p;
  }
}
class Iu extends Bn {
  static get requires() {
    return [vu, Eu];
  }
  static get pluginName() {
    return "CraftLink";
  }
}
function _u(xe) {
  return xe && xe.__esModule && Object.prototype.hasOwnProperty.call(xe, "default") ? xe.default : xe;
}
var Cs = { exports: {} };
/*! For license information please see inspector.js.LICENSE.txt */
var Zl;
function xu() {
  return Zl || (Zl = 1, function(xe, D) {
    (function(p, i) {
      xe.exports = i();
    })(window, function() {
      return function(p) {
        var i = {};
        function u(c) {
          if (i[c]) return i[c].exports;
          var r = i[c] = { i: c, l: !1, exports: {} };
          return p[c].call(r.exports, r, r.exports, u), r.l = !0, r.exports;
        }
        return u.m = p, u.c = i, u.d = function(c, r, _) {
          u.o(c, r) || Object.defineProperty(c, r, { enumerable: !0, get: _ });
        }, u.r = function(c) {
          typeof Symbol < "u" && Symbol.toStringTag && Object.defineProperty(c, Symbol.toStringTag, { value: "Module" }), Object.defineProperty(c, "__esModule", { value: !0 });
        }, u.t = function(c, r) {
          if (1 & r && (c = u(c)), 8 & r || 4 & r && typeof c == "object" && c && c.__esModule) return c;
          var _ = /* @__PURE__ */ Object.create(null);
          if (u.r(_), Object.defineProperty(_, "default", { enumerable: !0, value: c }), 2 & r && typeof c != "string") for (var g in c) u.d(_, g, (function(y) {
            return c[y];
          }).bind(null, g));
          return _;
        }, u.n = function(c) {
          var r = c && c.__esModule ? function() {
            return c.default;
          } : function() {
            return c;
          };
          return u.d(r, "a", r), r;
        }, u.o = function(c, r) {
          return Object.prototype.hasOwnProperty.call(c, r);
        }, u.p = "", u(u.s = 94);
      }([function(p, i, u) {
        p.exports = u(21);
      }, function(p, i, u) {
        u.d(i, "a", function() {
          return r;
        }), u.d(i, "b", function() {
          return _;
        }), u.d(i, "c", function() {
          return g;
        });
        var c = u(19);
        function r(v, b = !0) {
          if (v === void 0) return "undefined";
          if (typeof v == "function") return "function() {…}";
          const C = Object(c.stringify)(v, y, null, { maxDepth: 2 });
          return b ? C : C.replace(/(^"|"$)/g, "");
        }
        function _(v) {
          const b = {};
          for (const C in v) b[C] = v[C], b[C].value = r(b[C].value);
          return b;
        }
        function g(v, b) {
          return v.length > b ? v.substr(0, b) + `… [${v.length - b} characters left]` : v;
        }
        function y(v, b, C) {
          return typeof v == "string" ? `"${v.replace("'", '"')}"` : C(v);
        }
      }, function(p, i, u) {
        function c(N) {
          return N && N.name;
        }
        function r(N) {
          return N && c(N) && N.is("attributeElement");
        }
        function _(N) {
          return N && c(N) && N.is("emptyElement");
        }
        function g(N) {
          return N && c(N) && N.is("uiElement");
        }
        function y(N) {
          return N && c(N) && N.is("rawElement");
        }
        function v(N) {
          return N && c(N) && N.is("editableElement");
        }
        function b(N) {
          return N && N.is("rootElement");
        }
        function C(N) {
          return { path: [...N.parent.getPath(), N.offset], offset: N.offset, isAtEnd: N.isAtEnd, isAtStart: N.isAtStart, parent: x(N.parent) };
        }
        function x(N) {
          return c(N) ? r(N) ? "attribute:" + N.name : b(N) ? "root:" + N.name : "container:" + N.name : N.data;
        }
        u.d(i, "d", function() {
          return c;
        }), u.d(i, "b", function() {
          return r;
        }), u.d(i, "e", function() {
          return _;
        }), u.d(i, "h", function() {
          return g;
        }), u.d(i, "f", function() {
          return y;
        }), u.d(i, "c", function() {
          return v;
        }), u.d(i, "g", function() {
          return b;
        }), u.d(i, "a", function() {
          return C;
        });
      }, function(p, i, u) {
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
      }, function(p, i, u) {
        function c(y) {
          return y && y.is("element");
        }
        function r(y) {
          return y && y.is("rootElement");
        }
        function _(y) {
          return y.getPath ? y.getPath() : y.path;
        }
        function g(y) {
          return { path: _(y), stickiness: y.stickiness, index: y.index, isAtEnd: y.isAtEnd, isAtStart: y.isAtStart, offset: y.offset, textNode: y.textNode && y.textNode.data };
        }
        u.d(i, "c", function() {
          return c;
        }), u.d(i, "d", function() {
          return r;
        }), u.d(i, "b", function() {
          return _;
        }), u.d(i, "a", function() {
          return g;
        });
      }, function(p, i, u) {
        (function(c, r) {
          var _ = "[object Arguments]", g = "[object Map]", y = "[object Object]", v = "[object Set]", b = /^\[object .+?Constructor\]$/, C = /^(?:0|[1-9]\d*)$/, x = {};
          x["[object Float32Array]"] = x["[object Float64Array]"] = x["[object Int8Array]"] = x["[object Int16Array]"] = x["[object Int32Array]"] = x["[object Uint8Array]"] = x["[object Uint8ClampedArray]"] = x["[object Uint16Array]"] = x["[object Uint32Array]"] = !0, x[_] = x["[object Array]"] = x["[object ArrayBuffer]"] = x["[object Boolean]"] = x["[object DataView]"] = x["[object Date]"] = x["[object Error]"] = x["[object Function]"] = x[g] = x["[object Number]"] = x[y] = x["[object RegExp]"] = x[v] = x["[object String]"] = x["[object WeakMap]"] = !1;
          var N = typeof c == "object" && c && c.Object === Object && c, G = typeof self == "object" && self && self.Object === Object && self, K = N || G || Function("return this")(), j = i && !i.nodeType && i, B = j && typeof r == "object" && r && !r.nodeType && r, P = B && B.exports === j, M = P && N.process, V = function() {
            try {
              return M && M.binding && M.binding("util");
            } catch {
            }
          }(), A = V && V.isTypedArray;
          function J(H, se) {
            for (var ke = -1, Ce = H == null ? 0 : H.length; ++ke < Ce; ) if (se(H[ke], ke, H)) return !0;
            return !1;
          }
          function Q(H) {
            var se = -1, ke = Array(H.size);
            return H.forEach(function(Ce, it) {
              ke[++se] = [it, Ce];
            }), ke;
          }
          function z(H) {
            var se = -1, ke = Array(H.size);
            return H.forEach(function(Ce) {
              ke[++se] = Ce;
            }), ke;
          }
          var I, ae, le, ne = Array.prototype, ce = Function.prototype, be = Object.prototype, ee = K["__core-js_shared__"], de = ce.toString, R = be.hasOwnProperty, ie = (I = /[^.]+$/.exec(ee && ee.keys && ee.keys.IE_PROTO || "")) ? "Symbol(src)_1." + I : "", ye = be.toString, Te = RegExp("^" + de.call(R).replace(/[\\^$.*+?()[\]{}|]/g, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"), we = P ? K.Buffer : void 0, Pe = K.Symbol, Se = K.Uint8Array, ze = be.propertyIsEnumerable, Je = ne.splice, X = Pe ? Pe.toStringTag : void 0, q = Object.getOwnPropertySymbols, me = we ? we.isBuffer : void 0, l = (ae = Object.keys, le = Object, function(H) {
            return ae(le(H));
          }), f = gn(K, "DataView"), w = gn(K, "Map"), U = gn(K, "Promise"), F = gn(K, "Set"), W = gn(K, "WeakMap"), he = gn(Object, "create"), je = yn(f), De = yn(w), Xe = yn(U), He = yn(F), At = yn(W), kt = Pe ? Pe.prototype : void 0, Jt = kt ? kt.valueOf : void 0;
          function wt(H) {
            var se = -1, ke = H == null ? 0 : H.length;
            for (this.clear(); ++se < ke; ) {
              var Ce = H[se];
              this.set(Ce[0], Ce[1]);
            }
          }
          function gt(H) {
            var se = -1, ke = H == null ? 0 : H.length;
            for (this.clear(); ++se < ke; ) {
              var Ce = H[se];
              this.set(Ce[0], Ce[1]);
            }
          }
          function cn(H) {
            var se = -1, ke = H == null ? 0 : H.length;
            for (this.clear(); ++se < ke; ) {
              var Ce = H[se];
              this.set(Ce[0], Ce[1]);
            }
          }
          function Er(H) {
            var se = -1, ke = H == null ? 0 : H.length;
            for (this.__data__ = new cn(); ++se < ke; ) this.add(H[se]);
          }
          function Tt(H) {
            var se = this.__data__ = new gt(H);
            this.size = se.size;
          }
          function pt(H, se) {
            var ke = ar(H), Ce = !ke && ir(H), it = !ke && !Ce && Cn(H), Ye = !ke && !Ce && !it && Xr(H), st = ke || Ce || it || Ye, tt = st ? function(yt, Pt) {
              for (var tn = -1, ht = Array(yt); ++tn < yt; ) ht[tn] = Pt(tn);
              return ht;
            }(H.length, String) : [], Ot = tt.length;
            for (var nt in H) !R.call(H, nt) || st && (nt == "length" || it && (nt == "offset" || nt == "parent") || Ye && (nt == "buffer" || nt == "byteLength" || nt == "byteOffset") || Cr(nt, Ot)) || tt.push(nt);
            return tt;
          }
          function qn(H, se) {
            for (var ke = H.length; ke--; ) if (Tr(H[ke][0], se)) return ke;
            return -1;
          }
          function Sn(H) {
            return H == null ? H === void 0 ? "[object Undefined]" : "[object Null]" : X && X in Object(H) ? function(se) {
              var ke = R.call(se, X), Ce = se[X];
              try {
                se[X] = void 0;
                var it = !0;
              } catch {
              }
              var Ye = ye.call(se);
              return it && (ke ? se[X] = Ce : delete se[X]), Ye;
            }(H) : function(se) {
              return ye.call(se);
            }(H);
          }
          function or(H) {
            return On(H) && Sn(H) == _;
          }
          function _r(H, se, ke, Ce, it) {
            return H === se || (H == null || se == null || !On(H) && !On(se) ? H != H && se != se : function(Ye, st, tt, Ot, nt, yt) {
              var Pt = ar(Ye), tn = ar(st), ht = Pt ? "[object Array]" : ut(Ye), Vt = tn ? "[object Array]" : ut(st), Pn = (ht = ht == _ ? y : ht) == y, ct = (Vt = Vt == _ ? y : Vt) == y, bn = ht == Vt;
              if (bn && Cn(Ye)) {
                if (!Cn(st)) return !1;
                Pt = !0, Pn = !1;
              }
              if (bn && !Pn) return yt || (yt = new Tt()), Pt || Xr(Ye) ? qt(Ye, st, tt, Ot, nt, yt) : function(rt, Ue, Yn, Kt, Or, It, nn) {
                switch (Yn) {
                  case "[object DataView]":
                    if (rt.byteLength != Ue.byteLength || rt.byteOffset != Ue.byteOffset) return !1;
                    rt = rt.buffer, Ue = Ue.buffer;
                  case "[object ArrayBuffer]":
                    return !(rt.byteLength != Ue.byteLength || !It(new Se(rt), new Se(Ue)));
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
                    var Wt = Q;
                  case v:
                    var Qt = 1 & Kt;
                    if (Wt || (Wt = z), rt.size != Ue.size && !Qt) return !1;
                    var cr = nn.get(rt);
                    if (cr) return cr == Ue;
                    Kt |= 2, nn.set(rt, Ue);
                    var Rn = qt(Wt(rt), Wt(Ue), Kt, Or, It, nn);
                    return nn.delete(rt), Rn;
                  case "[object Symbol]":
                    if (Jt) return Jt.call(rt) == Jt.call(Ue);
                }
                return !1;
              }(Ye, st, ht, tt, Ot, nt, yt);
              if (!(1 & tt)) {
                var un = Pn && R.call(Ye, "__wrapped__"), Nn = ct && R.call(st, "__wrapped__");
                if (un || Nn) {
                  var _o = un ? Ye.value() : Ye, xo = Nn ? st.value() : st;
                  return yt || (yt = new Tt()), nt(_o, xo, tt, Ot, yt);
                }
              }
              return bn ? (yt || (yt = new Tt()), function(rt, Ue, Yn, Kt, Or, It) {
                var nn = 1 & Yn, Wt = xr(rt), Qt = Wt.length, cr = xr(Ue).length;
                if (Qt != cr && !nn) return !1;
                for (var Rn = Qt; Rn--; ) {
                  var rn = Wt[Rn];
                  if (!(nn ? rn in Ue : R.call(Ue, rn))) return !1;
                }
                var bt = It.get(rt);
                if (bt && It.get(Ue)) return bt == Ue;
                var Et = !0;
                It.set(rt, Ue), It.set(Ue, rt);
                for (var ur = nn; ++Rn < Qt; ) {
                  rn = Wt[Rn];
                  var dr = rt[rn], vn = Ue[rn];
                  if (Kt) var Ut = nn ? Kt(vn, dr, rn, Ue, rt, It) : Kt(dr, vn, rn, rt, Ue, It);
                  if (!(Ut === void 0 ? dr === vn || Or(dr, vn, Yn, Kt, It) : Ut)) {
                    Et = !1;
                    break;
                  }
                  ur || (ur = rn == "constructor");
                }
                if (Et && !ur) {
                  var Ht = rt.constructor, on = Ue.constructor;
                  Ht == on || !("constructor" in rt) || !("constructor" in Ue) || typeof Ht == "function" && Ht instanceof Ht && typeof on == "function" && on instanceof on || (Et = !1);
                }
                return It.delete(rt), It.delete(Ue), Et;
              }(Ye, st, tt, Ot, nt, yt)) : !1;
            }(H, se, ke, Ce, _r, it));
          }
          function Eo(H) {
            return !(!lr(H) || function(se) {
              return !!ie && ie in se;
            }(H)) && (sr(H) ? Te : b).test(yn(H));
          }
          function en(H) {
            if (ke = (se = H) && se.constructor, Ce = typeof ke == "function" && ke.prototype || be, se !== Ce) return l(H);
            var se, ke, Ce, it = [];
            for (var Ye in Object(H)) R.call(H, Ye) && Ye != "constructor" && it.push(Ye);
            return it;
          }
          function qt(H, se, ke, Ce, it, Ye) {
            var st = 1 & ke, tt = H.length, Ot = se.length;
            if (tt != Ot && !(st && Ot > tt)) return !1;
            var nt = Ye.get(H);
            if (nt && Ye.get(se)) return nt == se;
            var yt = -1, Pt = !0, tn = 2 & ke ? new Er() : void 0;
            for (Ye.set(H, se), Ye.set(se, H); ++yt < tt; ) {
              var ht = H[yt], Vt = se[yt];
              if (Ce) var Pn = st ? Ce(Vt, ht, yt, se, H, Ye) : Ce(ht, Vt, yt, H, se, Ye);
              if (Pn !== void 0) {
                if (Pn) continue;
                Pt = !1;
                break;
              }
              if (tn) {
                if (!J(se, function(ct, bn) {
                  if (un = bn, !tn.has(un) && (ht === ct || it(ht, ct, ke, Ce, Ye))) return tn.push(bn);
                  var un;
                })) {
                  Pt = !1;
                  break;
                }
              } else if (ht !== Vt && !it(ht, Vt, ke, Ce, Ye)) {
                Pt = !1;
                break;
              }
            }
            return Ye.delete(H), Ye.delete(se), Pt;
          }
          function xr(H) {
            return function(se, ke, Ce) {
              var it = ke(se);
              return ar(se) ? it : function(Ye, st) {
                for (var tt = -1, Ot = st.length, nt = Ye.length; ++tt < Ot; ) Ye[nt + tt] = st[tt];
                return Ye;
              }(it, Ce(se));
            }(H, Zr, Sr);
          }
          function Yt(H, se) {
            var ke, Ce, it = H.__data__;
            return ((Ce = typeof (ke = se)) == "string" || Ce == "number" || Ce == "symbol" || Ce == "boolean" ? ke !== "__proto__" : ke === null) ? it[typeof se == "string" ? "string" : "hash"] : it.map;
          }
          function gn(H, se) {
            var ke = function(Ce, it) {
              return Ce == null ? void 0 : Ce[it];
            }(H, se);
            return Eo(ke) ? ke : void 0;
          }
          wt.prototype.clear = function() {
            this.__data__ = he ? he(null) : {}, this.size = 0;
          }, wt.prototype.delete = function(H) {
            var se = this.has(H) && delete this.__data__[H];
            return this.size -= se ? 1 : 0, se;
          }, wt.prototype.get = function(H) {
            var se = this.__data__;
            if (he) {
              var ke = se[H];
              return ke === "__lodash_hash_undefined__" ? void 0 : ke;
            }
            return R.call(se, H) ? se[H] : void 0;
          }, wt.prototype.has = function(H) {
            var se = this.__data__;
            return he ? se[H] !== void 0 : R.call(se, H);
          }, wt.prototype.set = function(H, se) {
            var ke = this.__data__;
            return this.size += this.has(H) ? 0 : 1, ke[H] = he && se === void 0 ? "__lodash_hash_undefined__" : se, this;
          }, gt.prototype.clear = function() {
            this.__data__ = [], this.size = 0;
          }, gt.prototype.delete = function(H) {
            var se = this.__data__, ke = qn(se, H);
            return !(ke < 0) && (ke == se.length - 1 ? se.pop() : Je.call(se, ke, 1), --this.size, !0);
          }, gt.prototype.get = function(H) {
            var se = this.__data__, ke = qn(se, H);
            return ke < 0 ? void 0 : se[ke][1];
          }, gt.prototype.has = function(H) {
            return qn(this.__data__, H) > -1;
          }, gt.prototype.set = function(H, se) {
            var ke = this.__data__, Ce = qn(ke, H);
            return Ce < 0 ? (++this.size, ke.push([H, se])) : ke[Ce][1] = se, this;
          }, cn.prototype.clear = function() {
            this.size = 0, this.__data__ = { hash: new wt(), map: new (w || gt)(), string: new wt() };
          }, cn.prototype.delete = function(H) {
            var se = Yt(this, H).delete(H);
            return this.size -= se ? 1 : 0, se;
          }, cn.prototype.get = function(H) {
            return Yt(this, H).get(H);
          }, cn.prototype.has = function(H) {
            return Yt(this, H).has(H);
          }, cn.prototype.set = function(H, se) {
            var ke = Yt(this, H), Ce = ke.size;
            return ke.set(H, se), this.size += ke.size == Ce ? 0 : 1, this;
          }, Er.prototype.add = Er.prototype.push = function(H) {
            return this.__data__.set(H, "__lodash_hash_undefined__"), this;
          }, Er.prototype.has = function(H) {
            return this.__data__.has(H);
          }, Tt.prototype.clear = function() {
            this.__data__ = new gt(), this.size = 0;
          }, Tt.prototype.delete = function(H) {
            var se = this.__data__, ke = se.delete(H);
            return this.size = se.size, ke;
          }, Tt.prototype.get = function(H) {
            return this.__data__.get(H);
          }, Tt.prototype.has = function(H) {
            return this.__data__.has(H);
          }, Tt.prototype.set = function(H, se) {
            var ke = this.__data__;
            if (ke instanceof gt) {
              var Ce = ke.__data__;
              if (!w || Ce.length < 199) return Ce.push([H, se]), this.size = ++ke.size, this;
              ke = this.__data__ = new cn(Ce);
            }
            return ke.set(H, se), this.size = ke.size, this;
          };
          var Sr = q ? function(H) {
            return H == null ? [] : (H = Object(H), function(se, ke) {
              for (var Ce = -1, it = se == null ? 0 : se.length, Ye = 0, st = []; ++Ce < it; ) {
                var tt = se[Ce];
                ke(tt, Ce, se) && (st[Ye++] = tt);
              }
              return st;
            }(q(H), function(se) {
              return ze.call(H, se);
            }));
          } : function() {
            return [];
          }, ut = Sn;
          function Cr(H, se) {
            return !!(se = se ?? 9007199254740991) && (typeof H == "number" || C.test(H)) && H > -1 && H % 1 == 0 && H < se;
          }
          function yn(H) {
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
          function Tr(H, se) {
            return H === se || H != H && se != se;
          }
          (f && ut(new f(new ArrayBuffer(1))) != "[object DataView]" || w && ut(new w()) != g || U && ut(U.resolve()) != "[object Promise]" || F && ut(new F()) != v || W && ut(new W()) != "[object WeakMap]") && (ut = function(H) {
            var se = Sn(H), ke = se == y ? H.constructor : void 0, Ce = ke ? yn(ke) : "";
            if (Ce) switch (Ce) {
              case je:
                return "[object DataView]";
              case De:
                return g;
              case Xe:
                return "[object Promise]";
              case He:
                return v;
              case At:
                return "[object WeakMap]";
            }
            return se;
          });
          var ir = or(/* @__PURE__ */ function() {
            return arguments;
          }()) ? or : function(H) {
            return On(H) && R.call(H, "callee") && !ze.call(H, "callee");
          }, ar = Array.isArray, Cn = me || function() {
            return !1;
          };
          function sr(H) {
            if (!lr(H)) return !1;
            var se = Sn(H);
            return se == "[object Function]" || se == "[object GeneratorFunction]" || se == "[object AsyncFunction]" || se == "[object Proxy]";
          }
          function Tn(H) {
            return typeof H == "number" && H > -1 && H % 1 == 0 && H <= 9007199254740991;
          }
          function lr(H) {
            var se = typeof H;
            return H != null && (se == "object" || se == "function");
          }
          function On(H) {
            return H != null && typeof H == "object";
          }
          var Xr = A ? /* @__PURE__ */ function(H) {
            return function(se) {
              return H(se);
            };
          }(A) : function(H) {
            return On(H) && Tn(H.length) && !!x[Sn(H)];
          };
          function Zr(H) {
            return (se = H) != null && Tn(se.length) && !sr(se) ? pt(H) : en(H);
            var se;
          }
          r.exports = function(H, se) {
            return _r(H, se);
          };
        }).call(this, u(15), u(33)(p));
      }, function(p, i, u) {
        var c, r = function() {
          return c === void 0 && (c = !!(window && document && document.all && !window.atob)), c;
        }, _ = /* @__PURE__ */ function() {
          var P = {};
          return function(M) {
            if (P[M] === void 0) {
              var V = document.querySelector(M);
              if (window.HTMLIFrameElement && V instanceof window.HTMLIFrameElement) try {
                V = V.contentDocument.head;
              } catch {
                V = null;
              }
              P[M] = V;
            }
            return P[M];
          };
        }(), g = [];
        function y(P) {
          for (var M = -1, V = 0; V < g.length; V++) if (g[V].identifier === P) {
            M = V;
            break;
          }
          return M;
        }
        function v(P, M) {
          for (var V = {}, A = [], J = 0; J < P.length; J++) {
            var Q = P[J], z = M.base ? Q[0] + M.base : Q[0], I = V[z] || 0, ae = "".concat(z, " ").concat(I);
            V[z] = I + 1;
            var le = y(ae), ne = { css: Q[1], media: Q[2], sourceMap: Q[3] };
            le !== -1 ? (g[le].references++, g[le].updater(ne)) : g.push({ identifier: ae, updater: B(ne, M), references: 1 }), A.push(ae);
          }
          return A;
        }
        function b(P) {
          var M = document.createElement("style"), V = P.attributes || {};
          if (V.nonce === void 0) {
            var A = u.nc;
            A && (V.nonce = A);
          }
          if (Object.keys(V).forEach(function(Q) {
            M.setAttribute(Q, V[Q]);
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
        function N(P, M, V, A) {
          var J = V ? "" : A.media ? "@media ".concat(A.media, " {").concat(A.css, "}") : A.css;
          if (P.styleSheet) P.styleSheet.cssText = x(M, J);
          else {
            var Q = document.createTextNode(J), z = P.childNodes;
            z[M] && P.removeChild(z[M]), z.length ? P.insertBefore(Q, z[M]) : P.appendChild(Q);
          }
        }
        function G(P, M, V) {
          var A = V.css, J = V.media, Q = V.sourceMap;
          if (J ? P.setAttribute("media", J) : P.removeAttribute("media"), Q && typeof btoa < "u" && (A += `
/*# sourceMappingURL=data:application/json;base64,`.concat(btoa(unescape(encodeURIComponent(JSON.stringify(Q)))), " */")), P.styleSheet) P.styleSheet.cssText = A;
          else {
            for (; P.firstChild; ) P.removeChild(P.firstChild);
            P.appendChild(document.createTextNode(A));
          }
        }
        var K = null, j = 0;
        function B(P, M) {
          var V, A, J;
          if (M.singleton) {
            var Q = j++;
            V = K || (K = b(M)), A = N.bind(null, V, Q, !1), J = N.bind(null, V, Q, !0);
          } else V = b(M), A = G.bind(null, V, M), J = function() {
            (function(z) {
              if (z.parentNode === null) return !1;
              z.parentNode.removeChild(z);
            })(V);
          };
          return A(P), function(z) {
            if (z) {
              if (z.css === P.css && z.media === P.media && z.sourceMap === P.sourceMap) return;
              A(P = z);
            } else J();
          };
        }
        p.exports = function(P, M) {
          (M = M || {}).singleton || typeof M.singleton == "boolean" || (M.singleton = r());
          var V = v(P = P || [], M);
          return function(A) {
            if (A = A || [], Object.prototype.toString.call(A) === "[object Array]") {
              for (var J = 0; J < V.length; J++) {
                var Q = y(V[J]);
                g[Q].references--;
              }
              for (var z = v(A, M), I = 0; I < V.length; I++) {
                var ae = y(V[I]);
                g[ae].references === 0 && (g[ae].updater(), g.splice(ae, 1));
              }
              V = z;
            }
          };
        };
      }, function(p, i, u) {
        p.exports = function(c) {
          var r = [];
          return r.toString = function() {
            return this.map(function(_) {
              var g = function(y, v) {
                var b = y[1] || "", C = y[3];
                if (!C) return b;
                if (v && typeof btoa == "function") {
                  var x = (G = C, "/*# sourceMappingURL=data:application/json;charset=utf-8;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(G)))) + " */"), N = C.sources.map(function(K) {
                    return "/*# sourceURL=" + C.sourceRoot + K + " */";
                  });
                  return [b].concat(N).concat([x]).join(`
`);
                }
                var G;
                return [b].join(`
`);
              }(_, c);
              return _[2] ? "@media " + _[2] + "{" + g + "}" : g;
            }).join("");
          }, r.i = function(_, g) {
            typeof _ == "string" && (_ = [[null, _, ""]]);
            for (var y = {}, v = 0; v < this.length; v++) {
              var b = this[v][0];
              b != null && (y[b] = !0);
            }
            for (v = 0; v < _.length; v++) {
              var C = _[v];
              C[0] != null && y[C[0]] || (g && !C[2] ? C[2] = g : g && (C[2] = "(" + C[2] + ") and (" + g + ")"), r.push(C));
            }
          }, r;
        };
      }, function(p, i, u) {
        u.d(i, "c", function() {
          return _;
        }), u.d(i, "b", function() {
          return g;
        }), u.d(i, "a", function() {
          return y;
        });
        var c = u(3);
        let r = 0;
        function _(v) {
          const b = { editors: {}, options: {} };
          if (typeof v[0] == "string") c.a.warn(`[CKEditorInspector] The CKEditorInspector.attach( '${v[0]}', editor ) syntax has been deprecated and will be removed in the near future. To pass a name of an editor instance, use CKEditorInspector.attach( { '${v[0]}': editor } ) instead. Learn more in https://github.com/ckeditor/ckeditor5-inspector/blob/master/README.md.`), b.editors[v[0]] = v[1];
          else {
            if ((C = v[0]).model && C.editing) b.editors["editor-" + ++r] = v[0];
            else for (const x in v[0]) b.editors[x] = v[0][x];
            b.options = v[1] || b.options;
          }
          var C;
          return b;
        }
        function g(v) {
          return [...v][0][0] || "";
        }
        function y(v, b) {
          const C = Math.min(v.length, b.length);
          for (let x = 0; x < C; x++) if (v[x] != b[x]) return x;
          return v.length == b.length ? "same" : v.length < b.length ? "prefix" : "extension";
        }
      }, function(p, i, u) {
        u.d(i, "a", function() {
          return g;
        }), u.d(i, "d", function() {
          return b;
        }), u.d(i, "c", function() {
          return C;
        }), u.d(i, "e", function() {
          return x;
        }), u.d(i, "b", function() {
          return N;
        });
        var c = u(2), r = u(8), _ = u(1);
        const g = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_view", y = `&lt;!--The View UI element content has been skipped. <a href="${g}_uielement-UIElement.html" target="_blank">Find out why</a>. --&gt;`, v = `&lt;!--The View raw element content has been skipped. <a href="${g}_rawelement-RawElement.html" target="_blank">Find out why</a>. --&gt;`;
        function b(P) {
          return P ? [...P.editing.view.document.roots] : [];
        }
        function C(P, M) {
          if (!P) return [];
          const V = [], A = P.editing.view.document.selection;
          for (const J of A.getRanges()) J.root.rootName === M && V.push({ type: "selection", start: Object(c.a)(J.start), end: Object(c.a)(J.end) });
          return V;
        }
        function x({ currentEditor: P, currentRootName: M, ranges: V }) {
          return !P || !M ? null : [G(P.editing.view.document.getRoot(M), [...V])];
        }
        function N(P) {
          const M = { editorNode: P, properties: {}, attributes: {}, customProperties: {} };
          if (Object(c.d)(P)) {
            Object(c.g)(P) ? (M.type = "RootEditableElement", M.name = P.rootName, M.url = g + "_rooteditableelement-RootEditableElement.html") : (M.name = P.name, Object(c.b)(P) ? (M.type = "AttributeElement", M.url = g + "_attributeelement-AttributeElement.html") : Object(c.e)(P) ? (M.type = "EmptyElement", M.url = g + "_emptyelement-EmptyElement.html") : Object(c.h)(P) ? (M.type = "UIElement", M.url = g + "_uielement-UIElement.html") : Object(c.f)(P) ? (M.type = "RawElement", M.url = g + "_rawelement-RawElement.html") : Object(c.c)(P) ? (M.type = "EditableElement", M.url = g + "_editableelement-EditableElement.html") : (M.type = "ContainerElement", M.url = g + "_containerelement-ContainerElement.html")), B(P).forEach(([V, A]) => {
              M.attributes[V] = { value: A };
            }), M.properties = { index: { value: P.index }, isEmpty: { value: P.isEmpty }, childCount: { value: P.childCount } };
            for (let [V, A] of P.getCustomProperties()) typeof V == "symbol" && (V = V.toString()), M.customProperties[V] = { value: A };
          } else M.name = P.data, M.type = "Text", M.url = g + "_text-Text.html", M.properties = { index: { value: P.index } };
          return M.properties = Object(_.b)(M.properties), M.customProperties = Object(_.b)(M.customProperties), M.attributes = Object(_.b)(M.attributes), M;
        }
        function G(P, M) {
          const V = {};
          return Object.assign(V, { index: P.index, path: P.getPath(), node: P, positionsBefore: [], positionsAfter: [] }), Object(c.d)(P) ? function(A, J) {
            const Q = A.node;
            Object.assign(A, { type: "element", children: [], positions: [] }), A.name = Q.name, Object(c.b)(Q) ? A.elementType = "attribute" : Object(c.g)(Q) ? A.elementType = "root" : Object(c.e)(Q) ? A.elementType = "empty" : Object(c.h)(Q) ? A.elementType = "ui" : Object(c.f)(Q) ? A.elementType = "raw" : A.elementType = "container", Object(c.e)(Q) ? A.presentation = { isEmpty: !0 } : Object(c.h)(Q) ? A.children.push({ type: "comment", text: y }) : Object(c.f)(Q) && A.children.push({ type: "comment", text: v });
            for (const z of Q.getChildren()) A.children.push(G(z, J));
            (function(z, I) {
              for (const ae of I) {
                const le = K(z, ae);
                for (const ne of le) {
                  const ce = ne.offset;
                  if (ce === 0) {
                    const be = z.children[0];
                    be ? be.positionsBefore.push(ne) : z.positions.push(ne);
                  } else if (ce === z.children.length) {
                    const be = z.children[z.children.length - 1];
                    be ? be.positionsAfter.push(ne) : z.positions.push(ne);
                  } else {
                    let be = ne.isEnd ? 0 : z.children.length - 1, ee = z.children[be];
                    for (; ee; ) {
                      if (ee.index === ce) {
                        ee.positionsBefore.push(ne);
                        break;
                      }
                      if (ee.index + 1 === ce) {
                        ee.positionsAfter.push(ne);
                        break;
                      }
                      be += ne.isEnd ? 1 : -1, ee = z.children[be];
                    }
                  }
                }
              }
            })(A, J), A.attributes = function(z) {
              const I = B(z).map(([ae, le]) => [ae, Object(_.a)(le, !1)]);
              return new Map(I);
            }(Q);
          }(V, M) : function(A, J) {
            Object.assign(A, { type: "text", startOffset: 0, text: A.node.data, positions: [] });
            for (const Q of J) {
              const z = K(A, Q);
              A.positions.push(...z);
            }
          }(V, M), V;
        }
        function K(P, M) {
          const V = P.path, A = M.start.path, J = M.end.path, Q = [];
          return j(V, A) && Q.push({ offset: A[A.length - 1], isEnd: !1, presentation: M.presentation || null, type: M.type, name: M.name || null }), j(V, J) && Q.push({ offset: J[J.length - 1], isEnd: !0, presentation: M.presentation || null, type: M.type, name: M.name || null }), Q;
        }
        function j(P, M) {
          return P.length === M.length - 1 && Object(r.a)(P, M) === "prefix";
        }
        function B(P) {
          return [...P.getAttributes()].sort(([M], [V]) => M.toUpperCase() < V.toUpperCase() ? -1 : 1);
        }
      }, function(p, i, u) {
        u.d(i, "d", function() {
          return v;
        }), u.d(i, "c", function() {
          return b;
        }), u.d(i, "a", function() {
          return C;
        }), u.d(i, "e", function() {
          return x;
        }), u.d(i, "b", function() {
          return N;
        });
        var c = u(4), r = u(8), _ = u(1);
        const g = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_", y = ["#03a9f4", "#fb8c00", "#009688", "#e91e63", "#4caf50", "#00bcd4", "#607d8b", "#cddc39", "#9c27b0", "#f44336", "#6d4c41", "#8bc34a", "#3f51b5", "#2196f3", "#f4511e", "#673ab7", "#ffb300"];
        function v(M) {
          if (!M) return [];
          const V = [...M.model.document.roots];
          return V.filter(({ rootName: A }) => A !== "$graveyard").concat(V.filter(({ rootName: A }) => A === "$graveyard"));
        }
        function b(M, V) {
          if (!M) return [];
          const A = [], J = M.model;
          for (const Q of J.document.selection.getRanges()) Q.root.rootName === V && A.push({ type: "selection", start: Object(c.a)(Q.start), end: Object(c.a)(Q.end) });
          return A;
        }
        function C(M, V) {
          if (!M) return [];
          const A = [], J = M.model;
          let Q = 0;
          for (const z of J.markers) {
            const { name: I, affectsData: ae, managedUsingOperations: le } = z, ne = z.getStart(), ce = z.getEnd();
            ne.root.rootName === V && A.push({ type: "marker", marker: z, name: I, affectsData: ae, managedUsingOperations: le, presentation: { color: y[Q++ % (y.length - 1)] }, start: Object(c.a)(ne), end: Object(c.a)(ce) });
          }
          return A;
        }
        function x({ currentEditor: M, currentRootName: V, ranges: A, markers: J }) {
          return M ? [G(M.model.document.getRoot(V), [...A, ...J])] : [];
        }
        function N(M, V) {
          const A = { editorNode: V, properties: {}, attributes: {} };
          Object(c.c)(V) ? (Object(c.d)(V) ? (A.type = "RootElement", A.name = V.rootName, A.url = g + "rootelement-RootElement.html") : (A.type = "Element", A.name = V.name, A.url = g + "element-Element.html"), A.properties = { childCount: { value: V.childCount }, startOffset: { value: V.startOffset }, endOffset: { value: V.endOffset }, maxOffset: { value: V.maxOffset } }) : (A.name = V.data, A.type = "Text", A.url = g + "text-Text.html", A.properties = { startOffset: { value: V.startOffset }, endOffset: { value: V.endOffset }, offsetSize: { value: V.offsetSize } }), A.properties.path = { value: Object(c.b)(V) }, j(V).forEach(([J, Q]) => {
            A.attributes[J] = { value: Q };
          }), A.properties = Object(_.b)(A.properties), A.attributes = Object(_.b)(A.attributes);
          for (const J in A.attributes) {
            const Q = {}, z = M.model.schema.getAttributeProperties(J);
            for (const I in z) Q[I] = { value: z[I] };
            A.attributes[J].subProperties = Object(_.b)(Q);
          }
          return A;
        }
        function G(M, V) {
          const A = {}, { startOffset: J, endOffset: Q } = M;
          return Object.assign(A, { startOffset: J, endOffset: Q, node: M, path: M.getPath(), positionsBefore: [], positionsAfter: [] }), Object(c.c)(M) ? function(z, I) {
            const ae = z.node;
            Object.assign(z, { type: "element", name: ae.name, children: [], maxOffset: ae.maxOffset, positions: [] });
            for (const le of ae.getChildren()) z.children.push(G(le, I));
            (function(le, ne) {
              for (const ce of ne) {
                const be = B(le, ce);
                for (const ee of be) {
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
                        const ye = le.children[R + 1], Te = ie.type === "text" && ye && ye.type === "element", we = ie.type === "element" && ye && ye.type === "text", Pe = ie.type === "text" && ye && ye.type === "text";
                        ee.isEnd && (Te || we || Pe) ? ye.positionsBefore.push(ee) : ie.positionsAfter.push(ee);
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
            })(z, I), z.attributes = K(ae);
          }(A, V) : function(z) {
            const I = z.node;
            Object.assign(z, { type: "text", text: I.data, positions: [], presentation: { dontRenderAttributeValue: !0 } }), z.attributes = K(I);
          }(A), A;
        }
        function K(M) {
          const V = j(M).map(([A, J]) => [A, Object(_.a)(J, !1)]);
          return new Map(V);
        }
        function j(M) {
          return [...M.getAttributes()].sort(([V], [A]) => V < A ? -1 : 1);
        }
        function B(M, V) {
          const A = M.path, J = V.start.path, Q = V.end.path, z = [];
          return P(A, J) && z.push({ offset: J[J.length - 1], isEnd: !1, presentation: V.presentation || null, type: V.type, name: V.name || null }), P(A, Q) && z.push({ offset: Q[Q.length - 1], isEnd: !0, presentation: V.presentation || null, type: V.type, name: V.name || null }), z;
        }
        function P(M, V) {
          return M.length === V.length - 1 && Object(r.a)(M, V) === "prefix";
        }
      }, function(p, i, u) {
        u.d(i, "a", function() {
          return j;
        });
        var c = u(0), r = u.n(c), _ = u(5), g = u.n(_);
        class y extends c.Component {
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
        var v = u(1);
        class b extends c.PureComponent {
          render() {
            let P;
            const M = Object(v.c)(this.props.value, 500);
            return this.props.dontRenderValue || (P = r.a.createElement("span", { className: "ck-inspector-tree-node__attribute__value" }, M)), r.a.createElement("span", { className: "ck-inspector-tree-node__attribute" }, r.a.createElement("span", { className: "ck-inspector-tree-node__attribute__name", title: M }, this.props.name), P);
          }
        }
        class C extends c.Component {
          render() {
            const P = this.props.definition, M = { className: ["ck-inspector-tree__position", P.type === "selection" ? "ck-inspector-tree__position_selection" : "", P.type === "marker" ? "ck-inspector-tree__position_marker" : "", P.isEnd ? "ck-inspector-tree__position_end" : ""].join(" "), style: {} };
            return P.presentation && P.presentation.color && (M.style["--ck-inspector-color-tree-position"] = P.presentation.color), P.type === "marker" && (M["data-marker-name"] = P.name), r.a.createElement("span", M, "​");
          }
          shouldComponentUpdate(P) {
            return !g()(this.props, P);
          }
        }
        class x extends y {
          render() {
            const P = this.definition, M = P.presentation, V = M && M.isEmpty, A = M && M.cssClass, J = this.getChildren(), Q = ["ck-inspector-code", "ck-inspector-tree-node", this.isActive ? "ck-inspector-tree-node_active" : "", V ? "ck-inspector-tree-node_empty" : "", A], z = [], I = [];
            P.positionsBefore && P.positionsBefore.forEach((le, ne) => {
              z.push(r.a.createElement(C, { key: "position-before:" + ne, definition: le }));
            }), P.positionsAfter && P.positionsAfter.forEach((le, ne) => {
              I.push(r.a.createElement(C, { key: "position-after:" + ne, definition: le }));
            }), P.positions && P.positions.forEach((le, ne) => {
              J.push(r.a.createElement(C, { key: "position" + ne, definition: le }));
            });
            let ae = P.name;
            return this.globalTreeProps.showElementTypes && (ae = P.elementType + ":" + ae), r.a.createElement("div", { className: Q.join(" "), onClick: this.handleClick }, z, r.a.createElement("span", { className: "ck-inspector-tree-node__name" }, r.a.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_open" }), ae, this.getAttributes(), V ? "" : r.a.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_close" })), r.a.createElement("div", { className: "ck-inspector-tree-node__content" }, J), V ? "" : r.a.createElement("span", { className: "ck-inspector-tree-node__name ck-inspector-tree-node__name_close" }, r.a.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_open" }), "/", ae, r.a.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_close" }), I));
          }
          getAttributes() {
            const P = [], M = this.definition;
            for (const [V, A] of M.attributes) P.push(r.a.createElement(b, { key: V, name: V, value: A }));
            return P;
          }
          shouldComponentUpdate(P) {
            return !g()(this.props, P);
          }
        }
        class N extends y {
          render() {
            const P = this.definition, M = ["ck-inspector-tree-text", this.isActive ? "ck-inspector-tree-node_active" : ""].join(" ");
            let V = this.definition.text;
            P.positions && P.positions.length && (V = V.split(""), Array.from(P.positions).sort((J, Q) => J.offset < Q.offset ? -1 : J.offset === Q.offset ? 0 : 1).reverse().forEach((J, Q) => {
              V.splice(J.offset - P.startOffset, 0, r.a.createElement(C, { key: "position" + Q, definition: J }));
            }));
            const A = [V];
            return P.positionsBefore && P.positionsBefore.length && P.positionsBefore.forEach((J, Q) => {
              A.unshift(r.a.createElement(C, { key: "position-before:" + Q, definition: J }));
            }), P.positionsAfter && P.positionsAfter.length && P.positionsAfter.forEach((J, Q) => {
              A.push(r.a.createElement(C, { key: "position-after:" + Q, definition: J }));
            }), r.a.createElement("span", { className: M, onClick: this.handleClick }, r.a.createElement("span", { className: "ck-inspector-tree-node__content" }, this.globalTreeProps.showCompactText ? "" : this.getAttributes(), this.globalTreeProps.showCompactText ? "" : '"', A, this.globalTreeProps.showCompactText ? "" : '"'));
          }
          getAttributes() {
            const P = [], M = this.definition, V = M.presentation, A = V && V.dontRenderAttributeValue;
            for (const [J, Q] of M.attributes) P.push(r.a.createElement(b, { key: J, name: J, value: Q, dontRenderValue: A }));
            return r.a.createElement("span", { className: "ck-inspector-tree-text__attributes" }, P);
          }
          shouldComponentUpdate(P) {
            return !g()(this.props, P);
          }
        }
        class G extends c.Component {
          render() {
            return r.a.createElement("span", { className: "ck-inspector-tree-comment", dangerouslySetInnerHTML: { __html: this.props.definition.text } });
          }
        }
        function K(B, P, M) {
          return B.type === "element" ? r.a.createElement(x, { key: P, definition: B, globalTreeProps: M }) : B.type === "text" ? r.a.createElement(N, { key: P, definition: B, globalTreeProps: M }) : B.type === "comment" ? r.a.createElement(G, { key: P, definition: B }) : void 0;
        }
        u(34);
        class j extends c.Component {
          render() {
            let P;
            return P = this.props.definition ? this.props.definition.map((M, V) => K(M, V, { onClick: this.props.onClick, showCompactText: this.props.showCompactText, showElementTypes: this.props.showElementTypes, activeNode: this.props.activeNode })) : "Nothing to show.", r.a.createElement("div", { className: ["ck-inspector-tree", ...this.props.className || [], this.props.textDirection ? "ck-inspector-tree_text-direction_" + this.props.textDirection : "", this.props.showCompactText ? "ck-inspector-tree_compact-text" : ""].join(" ") }, P);
          }
        }
      }, function(p, i, u) {
        (function c() {
          if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE == "function")
            try {
              __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(c);
            } catch (r) {
              console.error(r);
            }
        })(), p.exports = u(22);
      }, function(p, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.stringifyPath = i.quoteKey = i.isValidVariableName = i.IS_VALID_IDENTIFIER = i.quoteString = void 0;
        const c = /[\\\'\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, r = /* @__PURE__ */ new Map([["\b", "\\b"], ["	", "\\t"], [`
`, "\\n"], ["\f", "\\f"], ["\r", "\\r"], ["'", "\\'"], ['"', '\\"'], ["\\", "\\\\"]]);
        function _(v) {
          return r.get(v) || "\\u" + ("0000" + v.charCodeAt(0).toString(16)).slice(-4);
        }
        i.quoteString = function(v) {
          return `'${v.replace(c, _)}'`;
        };
        const g = new Set("break else new var case finally return void catch for switch while continue function this with default if throw delete in try do instanceof typeof abstract enum int short boolean export interface static byte extends long super char final native synchronized class float package throws const goto private transient debugger implements protected volatile double import public let yield".split(" "));
        function y(v) {
          return typeof v == "string" && !g.has(v) && i.IS_VALID_IDENTIFIER.test(v);
        }
        i.IS_VALID_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/, i.isValidVariableName = y, i.quoteKey = function(v, b) {
          return y(v) ? v : b(v);
        }, i.stringifyPath = function(v, b) {
          let C = "";
          for (const x of v) y(x) ? C += "." + x : C += `[${b(x)}]`;
          return C;
        };
      }, function(p, i) {
        function u(b, C, x, N) {
          var G, K = (G = N) == null || typeof G == "number" || typeof G == "boolean" ? N : x(N), j = C.get(K);
          return j === void 0 && (j = b.call(this, N), C.set(K, j)), j;
        }
        function c(b, C, x) {
          var N = Array.prototype.slice.call(arguments, 3), G = x(N), K = C.get(G);
          return K === void 0 && (K = b.apply(this, N), C.set(G, K)), K;
        }
        function r(b, C, x, N, G) {
          return x.bind(C, b, N, G);
        }
        function _(b, C) {
          return r(b, this, b.length === 1 ? u : c, C.cache.create(), C.serializer);
        }
        function g() {
          return JSON.stringify(arguments);
        }
        function y() {
          this.cache = /* @__PURE__ */ Object.create(null);
        }
        y.prototype.has = function(b) {
          return b in this.cache;
        }, y.prototype.get = function(b) {
          return this.cache[b];
        }, y.prototype.set = function(b, C) {
          this.cache[b] = C;
        };
        var v = { create: function() {
          return new y();
        } };
        p.exports = function(b, C) {
          var x = C && C.cache ? C.cache : v, N = C && C.serializer ? C.serializer : g;
          return (C && C.strategy ? C.strategy : _)(b, { cache: x, serializer: N });
        }, p.exports.strategies = { variadic: function(b, C) {
          return r(b, this, c, C.cache.create(), C.serializer);
        }, monadic: function(b, C) {
          return r(b, this, u, C.cache.create(), C.serializer);
        } };
      }, function(p, i) {
        var u;
        u = /* @__PURE__ */ function() {
          return this;
        }();
        try {
          u = u || new Function("return this")();
        } catch {
          typeof window == "object" && (u = window);
        }
        p.exports = u;
      }, function(p, i, u) {
        var c = Object.getOwnPropertySymbols, r = Object.prototype.hasOwnProperty, _ = Object.prototype.propertyIsEnumerable;
        function g(y) {
          if (y == null) throw new TypeError("Object.assign cannot be called with null or undefined");
          return Object(y);
        }
        p.exports = function() {
          try {
            if (!Object.assign) return !1;
            var y = new String("abc");
            if (y[5] = "de", Object.getOwnPropertyNames(y)[0] === "5") return !1;
            for (var v = {}, b = 0; b < 10; b++) v["_" + String.fromCharCode(b)] = b;
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
        }() ? Object.assign : function(y, v) {
          for (var b, C, x = g(y), N = 1; N < arguments.length; N++) {
            for (var G in b = Object(arguments[N])) r.call(b, G) && (x[G] = b[G]);
            if (c) {
              C = c(b);
              for (var K = 0; K < C.length; K++) _.call(b, C[K]) && (x[C[K]] = b[C[K]]);
            }
          }
          return x;
        };
      }, function(p, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.FunctionParser = i.dedentFunction = i.functionToString = i.USED_METHOD_KEY = void 0;
        const c = u(13), r = { " "() {
        } }[" "].toString().charAt(0) === '"', _ = { Function: "function ", GeneratorFunction: "function* ", AsyncFunction: "async function ", AsyncGeneratorFunction: "async function* " }, g = { Function: "", GeneratorFunction: "*", AsyncFunction: "async ", AsyncGeneratorFunction: "async *" }, y = new Set("case delete else in instanceof new return throw typeof void , ; : + - ! ~ & | ^ * / % < > ? =".split(" "));
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
          return K !== void 0 && i.USED_METHOD_KEY.add(C), new b(C, x, N, K).stringify();
        }, i.dedentFunction = v;
        class b {
          constructor(x, N, G, K) {
            this.fn = x, this.indent = N, this.next = G, this.key = K, this.pos = 0, this.hadKeyword = !1, this.fnString = Function.prototype.toString.call(x), this.fnType = x.constructor.name, this.keyQuote = K === void 0 ? "" : c.quoteKey(K, G), this.keyPrefix = K === void 0 ? "" : `${this.keyQuote}:${N ? " " : ""}`, this.isMethodCandidate = K !== void 0 && (this.fn.name === "" || this.fn.name === K);
          }
          stringify() {
            const x = this.tryParse();
            return x ? v(x) : `${this.keyPrefix}void ${this.next(this.fnString)}`;
          }
          getPrefix() {
            return this.isMethodCandidate && !this.hadKeyword ? g[this.fnType] + this.keyQuote : this.keyPrefix + _[this.fnType];
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
              K === "/" && G && this.consumeMatch(/^(?:\\.|[^\\\/\n[]|\[(?:\\.|[^\]])*\])+\/[a-z]*/) ? (G = !1, this.consumeWhitespace()) : G = y.has(K);
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
        i.FunctionParser = b;
      }, function(p, i, u) {
        p.exports = u(53)();
      }, function(p, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.stringify = void 0;
        const c = u(25), r = u(13), _ = Symbol("root");
        i.stringify = function(g, y, v, b = {}) {
          const C = typeof v == "string" ? v : " ".repeat(v || 0), x = [], N = /* @__PURE__ */ new Set(), G = /* @__PURE__ */ new Map(), K = /* @__PURE__ */ new Map();
          let j = 0;
          const { maxDepth: B = 100, references: P = !1, skipUndefinedProperties: M = !1, maxValues: V = 1e5 } = b, A = function(I) {
            return I ? (ae, le, ne, ce) => I(ae, le, (be) => c.toString(be, le, ne, ce), ce) : c.toString;
          }(y), J = (I, ae) => {
            if (++j > V || M && I === void 0 || x.length > B) return;
            if (ae === void 0) return A(I, C, J, ae);
            x.push(ae);
            const le = Q(I, ae === _ ? void 0 : ae);
            return x.pop(), le;
          }, Q = P ? (I, ae) => {
            if (I !== null && (typeof I == "object" || typeof I == "function" || typeof I == "symbol")) {
              if (G.has(I)) return K.set(x.slice(1), G.get(I)), A(void 0, C, J, ae);
              G.set(I, x.slice(1));
            }
            return A(I, C, J, ae);
          } : (I, ae) => {
            if (N.has(I)) return;
            N.add(I);
            const le = A(I, C, J, ae);
            return N.delete(I), le;
          }, z = J(g, _);
          if (K.size) {
            const I = C ? " " : "", ae = C ? `
` : "";
            let le = `var x${I}=${I}${z};${ae}`;
            for (const [ne, ce] of K.entries())
              le += `x${r.stringifyPath(ne, J)}${I}=${I}x${r.stringifyPath(ce, J)};${ae}`;
            return `(function${I}()${I}{${ae}${le}return x;${ae}}())`;
          }
          return z;
        };
      }, function(p, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.findInArray = function(c, r) {
          for (var _ = 0, g = c.length; _ < g; _++) if (r.apply(r, [c[_], _, c])) return c[_];
        }, i.isFunction = function(c) {
          return typeof c == "function" || Object.prototype.toString.call(c) === "[object Function]";
        }, i.isNum = function(c) {
          return typeof c == "number" && !isNaN(c);
        }, i.int = function(c) {
          return parseInt(c, 10);
        }, i.dontSetMe = function(c, r, _) {
          if (c[r]) return new Error("Invalid prop ".concat(r, " passed to ").concat(_, " - do not set this, set it on the child."));
        };
      }, function(p, i, u) {
        var c = u(16), r = typeof Symbol == "function" && Symbol.for, _ = r ? Symbol.for("react.element") : 60103, g = r ? Symbol.for("react.portal") : 60106, y = r ? Symbol.for("react.fragment") : 60107, v = r ? Symbol.for("react.strict_mode") : 60108, b = r ? Symbol.for("react.profiler") : 60114, C = r ? Symbol.for("react.provider") : 60109, x = r ? Symbol.for("react.context") : 60110, N = r ? Symbol.for("react.forward_ref") : 60112, G = r ? Symbol.for("react.suspense") : 60113, K = r ? Symbol.for("react.memo") : 60115, j = r ? Symbol.for("react.lazy") : 60116, B = typeof Symbol == "function" && Symbol.iterator;
        function P(X) {
          for (var q = "https://reactjs.org/docs/error-decoder.html?invariant=" + X, me = 1; me < arguments.length; me++) q += "&args[]=" + encodeURIComponent(arguments[me]);
          return "Minified React error #" + X + "; visit " + q + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
        }
        var M = { isMounted: function() {
          return !1;
        }, enqueueForceUpdate: function() {
        }, enqueueReplaceState: function() {
        }, enqueueSetState: function() {
        } }, V = {};
        function A(X, q, me) {
          this.props = X, this.context = q, this.refs = V, this.updater = me || M;
        }
        function J() {
        }
        function Q(X, q, me) {
          this.props = X, this.context = q, this.refs = V, this.updater = me || M;
        }
        A.prototype.isReactComponent = {}, A.prototype.setState = function(X, q) {
          if (typeof X != "object" && typeof X != "function" && X != null) throw Error(P(85));
          this.updater.enqueueSetState(this, X, q, "setState");
        }, A.prototype.forceUpdate = function(X) {
          this.updater.enqueueForceUpdate(this, X, "forceUpdate");
        }, J.prototype = A.prototype;
        var z = Q.prototype = new J();
        z.constructor = Q, c(z, A.prototype), z.isPureReactComponent = !0;
        var I = { current: null }, ae = Object.prototype.hasOwnProperty, le = { key: !0, ref: !0, __self: !0, __source: !0 };
        function ne(X, q, me) {
          var l, f = {}, w = null, U = null;
          if (q != null) for (l in q.ref !== void 0 && (U = q.ref), q.key !== void 0 && (w = "" + q.key), q) ae.call(q, l) && !le.hasOwnProperty(l) && (f[l] = q[l]);
          var F = arguments.length - 2;
          if (F === 1) f.children = me;
          else if (1 < F) {
            for (var W = Array(F), he = 0; he < F; he++) W[he] = arguments[he + 2];
            f.children = W;
          }
          if (X && X.defaultProps) for (l in F = X.defaultProps) f[l] === void 0 && (f[l] = F[l]);
          return { $$typeof: _, type: X, key: w, ref: U, props: f, _owner: I.current };
        }
        function ce(X) {
          return typeof X == "object" && X !== null && X.$$typeof === _;
        }
        var be = /\/+/g, ee = [];
        function de(X, q, me, l) {
          if (ee.length) {
            var f = ee.pop();
            return f.result = X, f.keyPrefix = q, f.func = me, f.context = l, f.count = 0, f;
          }
          return { result: X, keyPrefix: q, func: me, context: l, count: 0 };
        }
        function R(X) {
          X.result = null, X.keyPrefix = null, X.func = null, X.context = null, X.count = 0, 10 > ee.length && ee.push(X);
        }
        function ie(X, q, me) {
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
                  case g:
                    he = !0;
                }
            }
            if (he) return U(F, f, w === "" ? "." + ye(f, 0) : w), 1;
            if (he = 0, w = w === "" ? "." : w + ":", Array.isArray(f)) for (var je = 0; je < f.length; je++) {
              var De = w + ye(W = f[je], je);
              he += l(W, De, U, F);
            }
            else if (f === null || typeof f != "object" ? De = null : De = typeof (De = B && f[B] || f["@@iterator"]) == "function" ? De : null, typeof De == "function") for (f = De.call(f), je = 0; !(W = f.next()).done; ) he += l(W = W.value, De = w + ye(W, je++), U, F);
            else if (W === "object") throw U = "" + f, Error(P(31, U === "[object Object]" ? "object with keys {" + Object.keys(f).join(", ") + "}" : U, ""));
            return he;
          }(X, "", q, me);
        }
        function ye(X, q) {
          return typeof X == "object" && X !== null && X.key != null ? function(me) {
            var l = { "=": "=0", ":": "=2" };
            return "$" + ("" + me).replace(/[=:]/g, function(f) {
              return l[f];
            });
          }(X.key) : q.toString(36);
        }
        function Te(X, q) {
          X.func.call(X.context, q, X.count++);
        }
        function we(X, q, me) {
          var l = X.result, f = X.keyPrefix;
          X = X.func.call(X.context, q, X.count++), Array.isArray(X) ? Pe(X, l, me, function(w) {
            return w;
          }) : X != null && (ce(X) && (X = function(w, U) {
            return { $$typeof: _, type: w.type, key: U, ref: w.ref, props: w.props, _owner: w._owner };
          }(X, f + (!X.key || q && q.key === X.key ? "" : ("" + X.key).replace(be, "$&/") + "/") + me)), l.push(X));
        }
        function Pe(X, q, me, l, f) {
          var w = "";
          me != null && (w = ("" + me).replace(be, "$&/") + "/"), ie(X, we, q = de(q, w, l, f)), R(q);
        }
        var Se = { current: null };
        function ze() {
          var X = Se.current;
          if (X === null) throw Error(P(321));
          return X;
        }
        var Je = { ReactCurrentDispatcher: Se, ReactCurrentBatchConfig: { suspense: null }, ReactCurrentOwner: I, IsSomeRendererActing: { current: !1 }, assign: c };
        i.Children = { map: function(X, q, me) {
          if (X == null) return X;
          var l = [];
          return Pe(X, l, null, q, me), l;
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
        } }, i.Component = A, i.Fragment = y, i.Profiler = b, i.PureComponent = Q, i.StrictMode = v, i.Suspense = G, i.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Je, i.cloneElement = function(X, q, me) {
          if (X == null) throw Error(P(267, X));
          var l = c({}, X.props), f = X.key, w = X.ref, U = X._owner;
          if (q != null) {
            if (q.ref !== void 0 && (w = q.ref, U = I.current), q.key !== void 0 && (f = "" + q.key), X.type && X.type.defaultProps) var F = X.type.defaultProps;
            for (W in q) ae.call(q, W) && !le.hasOwnProperty(W) && (l[W] = q[W] === void 0 && F !== void 0 ? F[W] : q[W]);
          }
          var W = arguments.length - 2;
          if (W === 1) l.children = me;
          else if (1 < W) {
            F = Array(W);
            for (var he = 0; he < W; he++) F[he] = arguments[he + 2];
            l.children = F;
          }
          return { $$typeof: _, type: X.type, key: f, ref: w, props: l, _owner: U };
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
      }, function(p, i, u) {
        var c = u(0), r = u(16), _ = u(23);
        function g(e) {
          for (var t = "https://reactjs.org/docs/error-decoder.html?invariant=" + e, n = 1; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
          return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
        }
        if (!c) throw Error(g(227));
        function y(e, t, n, o, a, h, k, T, Z) {
          var Y = Array.prototype.slice.call(arguments, 3);
          try {
            t.apply(n, Y);
          } catch (ge) {
            this.onError(ge);
          }
        }
        var v = !1, b = null, C = !1, x = null, N = { onError: function(e) {
          v = !0, b = e;
        } };
        function G(e, t, n, o, a, h, k, T, Z) {
          v = !1, b = null, y.apply(N, arguments);
        }
        var K = null, j = null, B = null;
        function P(e, t, n) {
          var o = e.type || "unknown-event";
          e.currentTarget = B(n), function(a, h, k, T, Z, Y, ge, Re, We) {
            if (G.apply(this, arguments), v) {
              if (!v) throw Error(g(198));
              var ot = b;
              v = !1, b = null, C || (C = !0, x = ot);
            }
          }(o, t, void 0, e), e.currentTarget = null;
        }
        var M = null, V = {};
        function A() {
          if (M) for (var e in V) {
            var t = V[e], n = M.indexOf(e);
            if (!(-1 < n)) throw Error(g(96, e));
            if (!Q[n]) {
              if (!t.extractEvents) throw Error(g(97, e));
              for (var o in Q[n] = t, n = t.eventTypes) {
                var a = void 0, h = n[o], k = t, T = o;
                if (z.hasOwnProperty(T)) throw Error(g(99, T));
                z[T] = h;
                var Z = h.phasedRegistrationNames;
                if (Z) {
                  for (a in Z) Z.hasOwnProperty(a) && J(Z[a], k, T);
                  a = !0;
                } else h.registrationName ? (J(h.registrationName, k, T), a = !0) : a = !1;
                if (!a) throw Error(g(98, o, e));
              }
            }
          }
        }
        function J(e, t, n) {
          if (I[e]) throw Error(g(100, e));
          I[e] = t, ae[e] = t.eventTypes[n].dependencies;
        }
        var Q = [], z = {}, I = {}, ae = {};
        function le(e) {
          var t, n = !1;
          for (t in e) if (e.hasOwnProperty(t)) {
            var o = e[t];
            if (!V.hasOwnProperty(t) || V[t] !== o) {
              if (V[t]) throw Error(g(102, t));
              V[t] = o, n = !0;
            }
          }
          n && A();
        }
        var ne = !(typeof window > "u" || window.document === void 0 || window.document.createElement === void 0), ce = null, be = null, ee = null;
        function de(e) {
          if (e = j(e)) {
            if (typeof ce != "function") throw Error(g(280));
            var t = e.stateNode;
            t && (t = K(t), ce(e.stateNode, e.type, t));
          }
        }
        function R(e) {
          be ? ee ? ee.push(e) : ee = [e] : be = e;
        }
        function ie() {
          if (be) {
            var e = be, t = ee;
            if (ee = be = null, de(e), t) for (e = 0; e < t.length; e++) de(t[e]);
          }
        }
        function ye(e, t) {
          return e(t);
        }
        function Te(e, t, n, o, a) {
          return e(t, n, o, a);
        }
        function we() {
        }
        var Pe = ye, Se = !1, ze = !1;
        function Je() {
          be === null && ee === null || (we(), ie());
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
        var q = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, me = Object.prototype.hasOwnProperty, l = {}, f = {};
        function w(e, t, n, o, a, h) {
          this.acceptsBooleans = t === 2 || t === 3 || t === 4, this.attributeName = o, this.attributeNamespace = a, this.mustUseProperty = n, this.propertyName = e, this.type = t, this.sanitizeURL = h;
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
        function je(e, t, n, o) {
          var a = U.hasOwnProperty(t) ? U[t] : null;
          (a !== null ? a.type === 0 : !o && 2 < t.length && (t[0] === "o" || t[0] === "O") && (t[1] === "n" || t[1] === "N")) || (function(h, k, T, Z) {
            if (k == null || function(Y, ge, Re, We) {
              if (Re !== null && Re.type === 0) return !1;
              switch (typeof ge) {
                case "function":
                case "symbol":
                  return !0;
                case "boolean":
                  return !We && (Re !== null ? !Re.acceptsBooleans : (Y = Y.toLowerCase().slice(0, 5)) !== "data-" && Y !== "aria-");
                default:
                  return !1;
              }
            }(h, k, T, Z)) return !0;
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
          }(t, n, a, o) && (n = null), o || a === null ? function(h) {
            return !!me.call(f, h) || !me.call(l, h) && (q.test(h) ? f[h] = !0 : (l[h] = !0, !1));
          }(t) && (n === null ? e.removeAttribute(t) : e.setAttribute(t, "" + n)) : a.mustUseProperty ? e[a.propertyName] = n === null ? a.type !== 3 && "" : n : (t = a.attributeName, o = a.attributeNamespace, n === null ? e.removeAttribute(t) : (n = (a = a.type) === 3 || a === 4 && n === !0 ? "" : "" + n, o ? e.setAttributeNS(o, t, n) : e.setAttribute(t, n))));
        }
        he.hasOwnProperty("ReactCurrentDispatcher") || (he.ReactCurrentDispatcher = { current: null }), he.hasOwnProperty("ReactCurrentBatchConfig") || (he.ReactCurrentBatchConfig = { suspense: null });
        var De = /^(.*)[\\\/]/, Xe = typeof Symbol == "function" && Symbol.for, He = Xe ? Symbol.for("react.element") : 60103, At = Xe ? Symbol.for("react.portal") : 60106, kt = Xe ? Symbol.for("react.fragment") : 60107, Jt = Xe ? Symbol.for("react.strict_mode") : 60108, wt = Xe ? Symbol.for("react.profiler") : 60114, gt = Xe ? Symbol.for("react.provider") : 60109, cn = Xe ? Symbol.for("react.context") : 60110, Er = Xe ? Symbol.for("react.concurrent_mode") : 60111, Tt = Xe ? Symbol.for("react.forward_ref") : 60112, pt = Xe ? Symbol.for("react.suspense") : 60113, qn = Xe ? Symbol.for("react.suspense_list") : 60120, Sn = Xe ? Symbol.for("react.memo") : 60115, or = Xe ? Symbol.for("react.lazy") : 60116, _r = Xe ? Symbol.for("react.block") : 60121, Eo = typeof Symbol == "function" && Symbol.iterator;
        function en(e) {
          return e === null || typeof e != "object" ? null : typeof (e = Eo && e[Eo] || e["@@iterator"]) == "function" ? e : null;
        }
        function qt(e) {
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
                n = null, o && (n = qt(o.type)), o = h, h = "", a ? h = " (at " + a.fileName.replace(De, "") + ":" + a.lineNumber + ")" : n && (h = " (created by " + n + ")"), n = `
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
              var h = o.get, k = o.set;
              return Object.defineProperty(t, n, { configurable: !0, get: function() {
                return h.call(this);
              }, set: function(T) {
                a = "" + T, k.call(this, T);
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
        function yn(e, t) {
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
            return c.Children.forEach(n, function(a) {
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
          if (t.dangerouslySetInnerHTML != null) throw Error(g(91));
          return r({}, t, { value: void 0, defaultValue: void 0, children: "" + e._wrapperState.initialValue });
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
        var H = "http://www.w3.org/1999/xhtml", se = "http://www.w3.org/2000/svg";
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
        var Ot = { animationend: tt("Animation", "AnimationEnd"), animationiteration: tt("Animation", "AnimationIteration"), animationstart: tt("Animation", "AnimationStart"), transitionend: tt("Transition", "TransitionEnd") }, nt = {}, yt = {};
        function Pt(e) {
          if (nt[e]) return nt[e];
          if (!Ot[e]) return e;
          var t, n = Ot[e];
          for (t in n) if (n.hasOwnProperty(t) && t in yt) return nt[e] = n[t];
          return e;
        }
        ne && (yt = document.createElement("div").style, "AnimationEvent" in window || (delete Ot.animationend.animation, delete Ot.animationiteration.animation, delete Ot.animationstart.animation), "TransitionEvent" in window || delete Ot.transitionend.transition);
        var tn = Pt("animationend"), ht = Pt("animationiteration"), Vt = Pt("animationstart"), Pn = Pt("transitionend"), ct = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), bn = new (typeof WeakMap == "function" ? WeakMap : Map)();
        function un(e) {
          var t = bn.get(e);
          return t === void 0 && (t = /* @__PURE__ */ new Map(), bn.set(e, t)), t;
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
          if (Nn(e) !== e) throw Error(g(188));
        }
        function rt(e) {
          if (!(e = function(n) {
            var o = n.alternate;
            if (!o) {
              if ((o = Nn(n)) === null) throw Error(g(188));
              return o !== n ? null : n;
            }
            for (var a = n, h = o; ; ) {
              var k = a.return;
              if (k === null) break;
              var T = k.alternate;
              if (T === null) {
                if ((h = k.return) !== null) {
                  a = h;
                  continue;
                }
                break;
              }
              if (k.child === T.child) {
                for (T = k.child; T; ) {
                  if (T === a) return xo(k), n;
                  if (T === h) return xo(k), o;
                  T = T.sibling;
                }
                throw Error(g(188));
              }
              if (a.return !== h.return) a = k, h = T;
              else {
                for (var Z = !1, Y = k.child; Y; ) {
                  if (Y === a) {
                    Z = !0, a = k, h = T;
                    break;
                  }
                  if (Y === h) {
                    Z = !0, h = k, a = T;
                    break;
                  }
                  Y = Y.sibling;
                }
                if (!Z) {
                  for (Y = T.child; Y; ) {
                    if (Y === a) {
                      Z = !0, a = T, h = k;
                      break;
                    }
                    if (Y === h) {
                      Z = !0, h = T, a = k;
                      break;
                    }
                    Y = Y.sibling;
                  }
                  if (!Z) throw Error(g(189));
                }
              }
              if (a.alternate !== h) throw Error(g(190));
            }
            if (a.tag !== 3) throw Error(g(188));
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
          if (t == null) throw Error(g(30));
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
        function It(e) {
          if (e !== null && (Kt = Ue(Kt, e)), e = Kt, Kt = null, e) {
            if (Yn(e, Or), Kt) throw Error(g(95));
            if (C) throw e = x, C = !1, x = null, e;
          }
        }
        function nn(e) {
          return (e = e.target || e.srcElement || window).correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
        }
        function Wt(e) {
          if (!ne) return !1;
          var t = (e = "on" + e) in document;
          return t || ((t = document.createElement("div")).setAttribute(e, "return;"), t = typeof t[e] == "function"), t;
        }
        var Qt = [];
        function cr(e) {
          e.topLevelType = null, e.nativeEvent = null, e.targetInst = null, e.ancestors.length = 0, 10 > Qt.length && Qt.push(e);
        }
        function Rn(e, t, n, o) {
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
            var h = e.nativeEvent, k = e.eventSystemFlags;
            n === 0 && (k |= 64);
            for (var T = null, Z = 0; Z < Q.length; Z++) {
              var Y = Q[Z];
              Y && (Y = Y.extractEvents(o, t, h, a, k)) && (T = Ue(T, Y));
            }
            It(T);
          }
        }
        function bt(e, t, n) {
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
                Wt(e) && eo(t, e, !0);
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
        var Et, ur, dr, vn = !1, Ut = [], Ht = null, on = null, Kn = null, fr = /* @__PURE__ */ new Map(), Jr = /* @__PURE__ */ new Map(), Pr = [], Vn = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput close cancel copy cut paste click change contextmenu reset submit".split(" "), Nt = "focus blur dragenter dragleave mouseover mouseout pointerover pointerout gotpointercapture lostpointercapture".split(" ");
        function So(e, t, n, o, a) {
          return { blockedOn: e, topLevelType: t, eventSystemFlags: 32 | n, nativeEvent: a, container: o };
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
              Jr.delete(t.pointerId);
          }
        }
        function Nr(e, t, n, o, a, h) {
          return e === null || e.nativeEvent !== h ? (e = So(t, n, o, a, h), t !== null && (t = io(t)) !== null && ur(t), e) : (e.eventSystemFlags |= o, e);
        }
        function Ta(e) {
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
          var t = Ar(e.topLevelType, e.eventSystemFlags, e.container, e.nativeEvent);
          if (t !== null) {
            var n = io(t);
            return n !== null && ur(n), e.blockedOn = t, !1;
          }
          return !0;
        }
        function vi(e, t, n) {
          Co(e) && n.delete(t);
        }
        function ki() {
          for (vn = !1; 0 < Ut.length; ) {
            var e = Ut[0];
            if (e.blockedOn !== null) {
              (e = io(e.blockedOn)) !== null && Et(e);
              break;
            }
            var t = Ar(e.topLevelType, e.eventSystemFlags, e.container, e.nativeEvent);
            t !== null ? e.blockedOn = t : Ut.shift();
          }
          Ht !== null && Co(Ht) && (Ht = null), on !== null && Co(on) && (on = null), Kn !== null && Co(Kn) && (Kn = null), fr.forEach(vi), Jr.forEach(vi);
        }
        function Rr(e, t) {
          e.blockedOn === t && (e.blockedOn = null, vn || (vn = !0, _.unstable_scheduleCallback(_.unstable_NormalPriority, ki)));
        }
        function pr(e) {
          function t(a) {
            return Rr(a, e);
          }
          if (0 < Ut.length) {
            Rr(Ut[0], e);
            for (var n = 1; n < Ut.length; n++) {
              var o = Ut[n];
              o.blockedOn === e && (o.blockedOn = null);
            }
          }
          for (Ht !== null && Rr(Ht, e), on !== null && Rr(on, e), Kn !== null && Rr(Kn, e), fr.forEach(t), Jr.forEach(t), n = 0; n < Pr.length; n++) (o = Pr[n]).blockedOn === e && (o.blockedOn = null);
          for (; 0 < Pr.length && (n = Pr[0]).blockedOn === null; ) Ta(n), n.blockedOn === null && Pr.shift();
        }
        var wi = {}, Ei = /* @__PURE__ */ new Map(), Dr = /* @__PURE__ */ new Map(), Oa = ["abort", "abort", tn, "animationEnd", ht, "animationIteration", Vt, "animationStart", "canplay", "canPlay", "canplaythrough", "canPlayThrough", "durationchange", "durationChange", "emptied", "emptied", "encrypted", "encrypted", "ended", "ended", "error", "error", "gotpointercapture", "gotPointerCapture", "load", "load", "loadeddata", "loadedData", "loadedmetadata", "loadedMetadata", "loadstart", "loadStart", "lostpointercapture", "lostPointerCapture", "playing", "playing", "progress", "progress", "seeking", "seeking", "stalled", "stalled", "suspend", "suspend", "timeupdate", "timeUpdate", Pn, "transitionEnd", "waiting", "waiting"];
        function qo(e, t) {
          for (var n = 0; n < e.length; n += 2) {
            var o = e[n], a = e[n + 1], h = "on" + (a[0].toUpperCase() + a.slice(1));
            h = { phasedRegistrationNames: { bubbled: h, captured: h + "Capture" }, dependencies: [o], eventPriority: t }, Dr.set(o, t), Ei.set(o, h), wi[a] = h;
          }
        }
        qo("blur blur cancel cancel click click close close contextmenu contextMenu copy copy cut cut auxclick auxClick dblclick doubleClick dragend dragEnd dragstart dragStart drop drop focus focus input input invalid invalid keydown keyDown keypress keyPress keyup keyUp mousedown mouseDown mouseup mouseUp paste paste pause pause play play pointercancel pointerCancel pointerdown pointerDown pointerup pointerUp ratechange rateChange reset reset seeked seeked submit submit touchcancel touchCancel touchend touchEnd touchstart touchStart volumechange volumeChange".split(" "), 0), qo("drag drag dragenter dragEnter dragexit dragExit dragleave dragLeave dragover dragOver mousemove mouseMove mouseout mouseOut mouseover mouseOver pointermove pointerMove pointerout pointerOut pointerover pointerOver scroll scroll toggle toggle touchmove touchMove wheel wheel".split(" "), 1), qo(Oa, 2);
        for (var _i = "change selectionchange textInput compositionstart compositionend compositionupdate".split(" "), Yo = 0; Yo < _i.length; Yo++) Dr.set(_i[Yo], 0);
        var Pa = _.unstable_UserBlockingPriority, Na = _.unstable_runWithPriority, To = !0;
        function mt(e, t) {
          eo(t, e, !1);
        }
        function eo(e, t, n) {
          var o = Dr.get(t);
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
          Se || we();
          var a = Oo, h = Se;
          Se = !0;
          try {
            Te(a, e, t, n, o);
          } finally {
            (Se = h) || Je();
          }
        }
        function Ra(e, t, n, o) {
          Na(Pa, Oo.bind(null, e, t, n, o));
        }
        function Oo(e, t, n, o) {
          if (To) if (0 < Ut.length && -1 < Vn.indexOf(e)) e = So(null, e, t, n, o), Ut.push(e);
          else {
            var a = Ar(e, t, n, o);
            if (a === null) kn(e, o);
            else if (-1 < Vn.indexOf(e)) e = So(a, e, t, n, o), Ut.push(e);
            else if (!function(h, k, T, Z, Y) {
              switch (k) {
                case "focus":
                  return Ht = Nr(Ht, h, k, T, Z, Y), !0;
                case "dragenter":
                  return on = Nr(on, h, k, T, Z, Y), !0;
                case "mouseover":
                  return Kn = Nr(Kn, h, k, T, Z, Y), !0;
                case "pointerover":
                  var ge = Y.pointerId;
                  return fr.set(ge, Nr(fr.get(ge) || null, h, k, T, Z, Y)), !0;
                case "gotpointercapture":
                  return ge = Y.pointerId, Jr.set(ge, Nr(Jr.get(ge) || null, h, k, T, Z, Y)), !0;
              }
              return !1;
            }(a, e, t, n, o)) {
              kn(e, o), e = Rn(e, o, null, t);
              try {
                X(rn, e);
              } finally {
                cr(e);
              }
            }
          }
        }
        function Ar(e, t, n, o) {
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
          e = Rn(e, o, n, t);
          try {
            X(rn, e);
          } finally {
            cr(e);
          }
          return null;
        }
        var no = { animationIterationCount: !0, borderImageOutset: !0, borderImageSlice: !0, borderImageWidth: !0, boxFlex: !0, boxFlexGroup: !0, boxOrdinalGroup: !0, columnCount: !0, columns: !0, flex: !0, flexGrow: !0, flexPositive: !0, flexShrink: !0, flexNegative: !0, flexOrder: !0, gridArea: !0, gridRow: !0, gridRowEnd: !0, gridRowSpan: !0, gridRowStart: !0, gridColumn: !0, gridColumnEnd: !0, gridColumnSpan: !0, gridColumnStart: !0, fontWeight: !0, lineClamp: !0, lineHeight: !0, opacity: !0, order: !0, orphans: !0, tabSize: !0, widows: !0, zIndex: !0, zoom: !0, fillOpacity: !0, floodOpacity: !0, stopOpacity: !0, strokeDasharray: !0, strokeDashoffset: !0, strokeMiterlimit: !0, strokeOpacity: !0, strokeWidth: !0 }, Da = ["Webkit", "ms", "Moz", "O"];
        function xi(e, t, n) {
          return t == null || typeof t == "boolean" || t === "" ? "" : n || typeof t != "number" || t === 0 || no.hasOwnProperty(e) && no[e] ? ("" + t).trim() : t + "px";
        }
        function Si(e, t) {
          for (var n in e = e.style, t) if (t.hasOwnProperty(n)) {
            var o = n.indexOf("--") === 0, a = xi(n, t[n], o);
            n === "float" && (n = "cssFloat"), o ? e.setProperty(n, a) : e[n] = a;
          }
        }
        Object.keys(no).forEach(function(e) {
          Da.forEach(function(t) {
            t = t + e.charAt(0).toUpperCase() + e.substring(1), no[t] = no[e];
          });
        });
        var Ci = r({ menuitem: !0 }, { area: !0, base: !0, br: !0, col: !0, embed: !0, hr: !0, img: !0, input: !0, keygen: !0, link: !0, meta: !0, param: !0, source: !0, track: !0, wbr: !0 });
        function Ko(e, t) {
          if (t) {
            if (Ci[e] && (t.children != null || t.dangerouslySetInnerHTML != null)) throw Error(g(137, e, ""));
            if (t.dangerouslySetInnerHTML != null) {
              if (t.children != null) throw Error(g(60));
              if (typeof t.dangerouslySetInnerHTML != "object" || !("__html" in t.dangerouslySetInnerHTML)) throw Error(g(61));
            }
            if (t.style != null && typeof t.style != "object") throw Error(g(62, ""));
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
        var Ti = H;
        function Wn(e, t) {
          var n = un(e = e.nodeType === 9 || e.nodeType === 11 ? e : e.ownerDocument);
          t = ae[t];
          for (var o = 0; o < t.length; o++) bt(t[o], e, n);
        }
        function Po() {
        }
        function Go(e) {
          if ((e = e || (typeof document < "u" ? document : void 0)) === void 0) return null;
          try {
            return e.activeElement || e.body;
          } catch {
            return e.body;
          }
        }
        function Oi(e) {
          for (; e && e.firstChild; ) e = e.firstChild;
          return e;
        }
        function Pi(e, t) {
          var n, o = Oi(e);
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
            o = Oi(o);
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
        var ti = typeof setTimeout == "function" ? setTimeout : void 0, Di = typeof clearTimeout == "function" ? clearTimeout : void 0;
        function Ir(e) {
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
        var No = Math.random().toString(36).slice(2), Qn = "__reactInternalInstance$" + No, ro = "__reactEventHandlers$" + No, oo = "__reactContainere$" + No;
        function Mr(e) {
          var t = e[Qn];
          if (t) return t;
          for (var n = e.parentNode; n; ) {
            if (t = n[oo] || n[Qn]) {
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
        function io(e) {
          return !(e = e[Qn] || e[oo]) || e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3 ? null : e;
        }
        function Gn(e) {
          if (e.tag === 5 || e.tag === 6) return e.stateNode;
          throw Error(g(33));
        }
        function ni(e) {
          return e[ro] || null;
        }
        function Dn(e) {
          do
            e = e.return;
          while (e && e.tag !== 5);
          return e || null;
        }
        function Ii(e, t) {
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
          if (n && typeof n != "function") throw Error(g(231, t, typeof n));
          return n;
        }
        function Mi(e, t, n) {
          (t = Ii(e, n.dispatchConfig.phasedRegistrationNames[t])) && (n._dispatchListeners = Ue(n._dispatchListeners, t), n._dispatchInstances = Ue(n._dispatchInstances, e));
        }
        function Aa(e) {
          if (e && e.dispatchConfig.phasedRegistrationNames) {
            for (var t = e._targetInst, n = []; t; ) n.push(t), t = Dn(t);
            for (t = n.length; 0 < t--; ) Mi(n[t], "captured", e);
            for (t = 0; t < n.length; t++) Mi(n[t], "bubbled", e);
          }
        }
        function Ro(e, t, n) {
          e && n && n.dispatchConfig.registrationName && (t = Ii(e, n.dispatchConfig.registrationName)) && (n._dispatchListeners = Ue(n._dispatchListeners, t), n._dispatchInstances = Ue(n._dispatchInstances, e));
        }
        function Ia(e) {
          e && e.dispatchConfig.registrationName && Ro(e._targetInst, null, e);
        }
        function jr(e) {
          Yn(e, Aa);
        }
        var hr = null, ri = null, Do = null;
        function ji() {
          if (Do) return Do;
          var e, t, n = ri, o = n.length, a = "value" in hr ? hr.value : hr.textContent, h = a.length;
          for (e = 0; e < o && n[e] === a[e]; e++) ;
          var k = o - e;
          for (t = 1; t <= k && n[o - t] === a[h - t]; t++) ;
          return Do = a.slice(e, 1 < t ? 1 - t : void 0);
        }
        function Ao() {
          return !0;
        }
        function Io() {
          return !1;
        }
        function an(e, t, n, o) {
          for (var a in this.dispatchConfig = e, this._targetInst = t, this.nativeEvent = n, e = this.constructor.Interface) e.hasOwnProperty(a) && ((t = e[a]) ? this[a] = t(n) : a === "target" ? this.target = o : this[a] = n[a]);
          return this.isDefaultPrevented = (n.defaultPrevented != null ? n.defaultPrevented : n.returnValue === !1) ? Ao : Io, this.isPropagationStopped = Io, this;
        }
        function zi(e, t, n, o) {
          if (this.eventPool.length) {
            var a = this.eventPool.pop();
            return this.call(a, e, t, n, o), a;
          }
          return new this(e, t, n, o);
        }
        function $e(e) {
          if (!(e instanceof this)) throw Error(g(279));
          e.destructor(), 10 > this.eventPool.length && this.eventPool.push(e);
        }
        function E(e) {
          e.eventPool = [], e.getPooled = zi, e.release = $e;
        }
        r(an.prototype, { preventDefault: function() {
          this.defaultPrevented = !0;
          var e = this.nativeEvent;
          e && (e.preventDefault ? e.preventDefault() : typeof e.returnValue != "unknown" && (e.returnValue = !1), this.isDefaultPrevented = Ao);
        }, stopPropagation: function() {
          var e = this.nativeEvent;
          e && (e.stopPropagation ? e.stopPropagation() : typeof e.cancelBubble != "unknown" && (e.cancelBubble = !0), this.isPropagationStopped = Ao);
        }, persist: function() {
          this.isPersistent = Ao;
        }, isPersistent: Io, destructor: function() {
          var e, t = this.constructor.Interface;
          for (e in t) this[e] = null;
          this.nativeEvent = this._targetInst = this.dispatchConfig = null, this.isPropagationStopped = this.isDefaultPrevented = Io, this._dispatchInstances = this._dispatchListeners = null;
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
        var s = an.extend({ data: null }), d = an.extend({ data: null }), m = [9, 13, 27, 32], S = ne && "CompositionEvent" in window, O = null;
        ne && "documentMode" in document && (O = document.documentMode);
        var L = ne && "TextEvent" in window && !O, re = ne && (!S || O && 8 < O && 11 >= O), fe = " ", pe = { beforeInput: { phasedRegistrationNames: { bubbled: "onBeforeInput", captured: "onBeforeInputCapture" }, dependencies: ["compositionend", "keypress", "textInput", "paste"] }, compositionEnd: { phasedRegistrationNames: { bubbled: "onCompositionEnd", captured: "onCompositionEndCapture" }, dependencies: "blur compositionend keydown keypress keyup mousedown".split(" ") }, compositionStart: { phasedRegistrationNames: { bubbled: "onCompositionStart", captured: "onCompositionStartCapture" }, dependencies: "blur compositionstart keydown keypress keyup mousedown".split(" ") }, compositionUpdate: { phasedRegistrationNames: { bubbled: "onCompositionUpdate", captured: "onCompositionUpdateCapture" }, dependencies: "blur compositionupdate keydown keypress keyup mousedown".split(" ") } }, Ee = !1;
        function Ne(e, t) {
          switch (e) {
            case "keyup":
              return m.indexOf(t.keyCode) !== -1;
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
        var Ae = !1, Ke = { eventTypes: pe, extractEvents: function(e, t, n, o) {
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
          else Ae ? Ne(e, n) && (h = pe.compositionEnd) : e === "keydown" && n.keyCode === 229 && (h = pe.compositionStart);
          return h ? (re && n.locale !== "ko" && (Ae || h !== pe.compositionStart ? h === pe.compositionEnd && Ae && (a = ji()) : (ri = "value" in (hr = o) ? hr.value : hr.textContent, Ae = !0)), h = s.getPooled(h, t, n, o), (a || (a = Ve(n)) !== null) && (h.data = a), jr(h), a = h) : a = null, (e = L ? function(k, T) {
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
            if (Ae) return k === "compositionend" || !S && Ne(k, T) ? (k = ji(), Do = ri = hr = null, Ae = !1, k) : null;
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
        function Rt(e) {
          It(e);
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
          if (e.propertyName === "value" && Mt(dt)) if (e = qe(dt, e, nn(e)), Se) It(e);
          else {
            Se = !0;
            try {
              ye(Rt, e);
            } finally {
              Se = !1, Je();
            }
          }
        }
        function An(e, t, n) {
          e === "focus" ? (zt(), dt = n, (Le = t).attachEvent("onpropertychange", ft)) : e === "blur" && zt();
        }
        function lt(e) {
          if (e === "selectionchange" || e === "keyup" || e === "keydown") return Mt(dt);
        }
        function In(e, t) {
          if (e === "click") return Mt(t);
        }
        function Hn(e, t) {
          if (e === "input" || e === "change") return Mt(t);
        }
        ne && (_t = Wt("input") && (!document.documentMode || 9 < document.documentMode));
        var zr = { eventTypes: et, _isInputEventSupported: _t, extractEvents: function(e, t, n, o) {
          var a = t ? Gn(t) : window, h = a.nodeName && a.nodeName.toLowerCase();
          if (h === "select" || h === "input" && a.type === "file") var k = jt;
          else if (Fe(a)) if (_t) k = Hn;
          else {
            k = lt;
            var T = An;
          }
          else (h = a.nodeName) && h.toLowerCase() === "input" && (a.type === "checkbox" || a.type === "radio") && (k = In);
          if (k && (k = k(e, t))) return qe(k, n, o);
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
        } }), oi = Lr.extend({ pointerId: null, width: null, height: null, pressure: null, tangentialPressure: null, tiltX: null, tiltY: null, twist: null, pointerType: null, isPrimary: null }), Ur = { mouseEnter: { registrationName: "onMouseEnter", dependencies: ["mouseout", "mouseover"] }, mouseLeave: { registrationName: "onMouseLeave", dependencies: ["mouseout", "mouseover"] }, pointerEnter: { registrationName: "onPointerEnter", dependencies: ["pointerout", "pointerover"] }, pointerLeave: { registrationName: "onPointerLeave", dependencies: ["pointerout", "pointerover"] } }, Mo = { eventTypes: Ur, extractEvents: function(e, t, n, o, a) {
          var h = e === "mouseover" || e === "pointerover", k = e === "mouseout" || e === "pointerout";
          if (h && (32 & a) == 0 && (n.relatedTarget || n.fromElement) || !k && !h || (h = o.window === o ? o : (h = o.ownerDocument) ? h.defaultView || h.parentWindow : window, k ? (k = t, (t = (t = n.relatedTarget || n.toElement) ? Mr(t) : null) !== null && (t !== Nn(t) || t.tag !== 5 && t.tag !== 6) && (t = null)) : k = null, k === t)) return null;
          if (e === "mouseout" || e === "mouseover") var T = Lr, Z = Ur.mouseLeave, Y = Ur.mouseEnter, ge = "mouse";
          else e !== "pointerout" && e !== "pointerover" || (T = oi, Z = Ur.pointerLeave, Y = Ur.pointerEnter, ge = "pointer");
          if (e = k == null ? h : Gn(k), h = t == null ? h : Gn(t), (Z = T.getPooled(Z, k, n, o)).type = ge + "leave", Z.target = e, Z.relatedTarget = h, (n = T.getPooled(Y, t, n, o)).type = ge + "enter", n.target = h, n.relatedTarget = e, ge = t, (o = k) && ge) e: {
            for (Y = ge, k = 0, e = T = o; e; e = Dn(e)) k++;
            for (e = 0, t = Y; t; t = Dn(t)) e++;
            for (; 0 < k - e; ) T = Dn(T), k--;
            for (; 0 < e - k; ) Y = Dn(Y), e--;
            for (; k--; ) {
              if (T === Y || T === Y.alternate) break e;
              T = Dn(T), Y = Dn(Y);
            }
            T = null;
          }
          else T = null;
          for (Y = T, T = []; o && o !== Y && ((k = o.alternate) === null || k !== Y); ) T.push(o), o = Dn(o);
          for (o = []; ge && ge !== Y && ((k = ge.alternate) === null || k !== Y); ) o.push(ge), ge = Dn(ge);
          for (ge = 0; ge < T.length; ge++) Ro(T[ge], "bubbled", Z);
          for (ge = o.length; 0 < ge--; ) Ro(o[ge], "captured", n);
          return (64 & a) == 0 ? [Z] : [Z, n];
        } }, mr = typeof Object.is == "function" ? Object.is : function(e, t) {
          return e === t && (e !== 0 || 1 / e == 1 / t) || e != e && t != t;
        }, Li = Object.prototype.hasOwnProperty;
        function gr(e, t) {
          if (mr(e, t)) return !0;
          if (typeof e != "object" || e === null || typeof t != "object" || t === null) return !1;
          var n = Object.keys(e), o = Object.keys(t);
          if (n.length !== o.length) return !1;
          for (o = 0; o < n.length; o++) if (!Li.call(t, n[o]) || !mr(e[n[o]], t[n[o]])) return !1;
          return !0;
        }
        var jo = ne && "documentMode" in document && 11 >= document.documentMode, ii = { select: { phasedRegistrationNames: { bubbled: "onSelect", captured: "onSelectCapture" }, dependencies: "blur contextmenu dragend focus keydown keyup mousedown mouseup selectionchange".split(" ") } }, Zn = null, so = null, wn = null, lo = !1;
        function Ps(e, t) {
          var n = t.window === t ? t.document : t.nodeType === 9 ? t : t.ownerDocument;
          return lo || Zn == null || Zn !== Go(n) ? null : ("selectionStart" in (n = Zn) && Xo(n) ? n = { start: n.selectionStart, end: n.selectionEnd } : n = { anchorNode: (n = (n.ownerDocument && n.ownerDocument.defaultView || window).getSelection()).anchorNode, anchorOffset: n.anchorOffset, focusNode: n.focusNode, focusOffset: n.focusOffset }, wn && gr(wn, n) ? null : (wn = n, (e = an.getPooled(ii.select, so, e, t)).type = "select", e.target = Zn, jr(e), e));
        }
        var oc = { eventTypes: ii, extractEvents: function(e, t, n, o, a, h) {
          if (!(h = !(a = h || (o.window === o ? o.document : o.nodeType === 9 ? o : o.ownerDocument)))) {
            e: {
              a = un(a), h = ae.onSelect;
              for (var k = 0; k < h.length; k++) if (!a.has(h[k])) {
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
              (Fe(a) || a.contentEditable === "true") && (Zn = a, so = t, wn = null);
              break;
            case "blur":
              wn = so = Zn = null;
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
        function Ui(e) {
          var t = e.keyCode;
          return "charCode" in e ? (e = e.charCode) === 0 && t === 13 && (e = 13) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
        }
        var lc = { Esc: "Escape", Spacebar: " ", Left: "ArrowLeft", Up: "ArrowUp", Right: "ArrowRight", Down: "ArrowDown", Del: "Delete", Win: "OS", Menu: "ContextMenu", Apps: "ContextMenu", Scroll: "ScrollLock", MozPrintableKey: "Unidentified" }, cc = { 8: "Backspace", 9: "Tab", 12: "Clear", 13: "Enter", 16: "Shift", 17: "Control", 18: "Alt", 19: "Pause", 20: "CapsLock", 27: "Escape", 32: " ", 33: "PageUp", 34: "PageDown", 35: "End", 36: "Home", 37: "ArrowLeft", 38: "ArrowUp", 39: "ArrowRight", 40: "ArrowDown", 45: "Insert", 46: "Delete", 112: "F1", 113: "F2", 114: "F3", 115: "F4", 116: "F5", 117: "F6", 118: "F7", 119: "F8", 120: "F9", 121: "F10", 122: "F11", 123: "F12", 144: "NumLock", 145: "ScrollLock", 224: "Meta" }, uc = xt.extend({ key: function(e) {
          if (e.key) {
            var t = lc[e.key] || e.key;
            if (t !== "Unidentified") return t;
          }
          return e.type === "keypress" ? (e = Ui(e)) === 13 ? "Enter" : String.fromCharCode(e) : e.type === "keydown" || e.type === "keyup" ? cc[e.keyCode] || "Unidentified" : "";
        }, location: null, ctrlKey: null, shiftKey: null, altKey: null, metaKey: null, repeat: null, locale: null, getModifierState: $t, charCode: function(e) {
          return e.type === "keypress" ? Ui(e) : 0;
        }, keyCode: function(e) {
          return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
        }, which: function(e) {
          return e.type === "keypress" ? Ui(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
        } }), dc = Lr.extend({ dataTransfer: null }), fc = xt.extend({ touches: null, targetTouches: null, changedTouches: null, altKey: null, metaKey: null, ctrlKey: null, shiftKey: null, getModifierState: $t }), pc = an.extend({ propertyName: null, elapsedTime: null, pseudoElement: null }), hc = Lr.extend({ deltaX: function(e) {
          return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
        }, deltaY: function(e) {
          return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
        }, deltaZ: null, deltaMode: null }), mc = { eventTypes: wi, extractEvents: function(e, t, n, o) {
          var a = Ei.get(e);
          if (!a) return null;
          switch (e) {
            case "keypress":
              if (Ui(n) === 0) return null;
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
            case Vt:
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
              e = oi;
              break;
            default:
              e = an;
          }
          return jr(t = e.getPooled(a, t, n, o)), t;
        } };
        if (M) throw Error(g(101));
        M = Array.prototype.slice.call("ResponderEventPlugin SimpleEventPlugin EnterLeaveEventPlugin ChangeEventPlugin SelectEventPlugin BeforeInputEventPlugin".split(" ")), A(), K = ni, j = io, B = Gn, le({ SimpleEventPlugin: mc, EnterLeaveEventPlugin: Mo, ChangeEventPlugin: zr, SelectEventPlugin: oc, BeforeInputEventPlugin: Ke });
        var Ma = [], zo = -1;
        function vt(e) {
          0 > zo || (e.current = Ma[zo], Ma[zo] = null, zo--);
        }
        function St(e, t) {
          zo++, Ma[zo] = e.current, e.current = t;
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
        function Fi() {
          vt(pn), vt(Xt);
        }
        function Ns(e, t, n) {
          if (Xt.current !== Fr) throw Error(g(168));
          St(Xt, t), St(pn, n);
        }
        function Rs(e, t, n) {
          var o = e.stateNode;
          if (e = t.childContextTypes, typeof o.getChildContext != "function") return n;
          for (var a in o = o.getChildContext()) if (!(a in e)) throw Error(g(108, qt(t) || "Unknown", a));
          return r({}, n, {}, o);
        }
        function Bi(e) {
          return e = (e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext || Fr, co = Xt.current, St(Xt, e), St(pn, pn.current), !0;
        }
        function Ds(e, t, n) {
          var o = e.stateNode;
          if (!o) throw Error(g(169));
          n ? (e = Rs(e, t, co), o.__reactInternalMemoizedMergedChildContext = e, vt(pn), vt(Xt), St(Xt, e)) : vt(pn), St(pn, n);
        }
        var gc = _.unstable_runWithPriority, ja = _.unstable_scheduleCallback, As = _.unstable_cancelCallback, Is = _.unstable_requestPaint, za = _.unstable_now, yc = _.unstable_getCurrentPriorityLevel, Vi = _.unstable_ImmediatePriority, Ms = _.unstable_UserBlockingPriority, js = _.unstable_NormalPriority, zs = _.unstable_LowPriority, Ls = _.unstable_IdlePriority, Us = {}, bc = _.unstable_shouldYield, vc = Is !== void 0 ? Is : function() {
        }, yr = null, Wi = null, La = !1, Fs = za(), jn = 1e4 > Fs ? za : function() {
          return za() - Fs;
        };
        function Hi() {
          switch (yc()) {
            case Vi:
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
        function Bs(e) {
          switch (e) {
            case 99:
              return Vi;
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
        function Br(e, t) {
          return e = Bs(e), gc(e, t);
        }
        function Vs(e, t, n) {
          return e = Bs(e), ja(e, t, n);
        }
        function Ws(e) {
          return yr === null ? (yr = [e], Wi = ja(Vi, Hs)) : yr.push(e), Us;
        }
        function Jn() {
          if (Wi !== null) {
            var e = Wi;
            Wi = null, As(e);
          }
          Hs();
        }
        function Hs() {
          if (!La && yr !== null) {
            La = !0;
            var e = 0;
            try {
              var t = yr;
              Br(99, function() {
                for (; e < t.length; e++) {
                  var n = t[e];
                  do
                    n = n(!0);
                  while (n !== null);
                }
              }), yr = null;
            } catch (n) {
              throw yr !== null && (yr = yr.slice(e + 1)), ja(Vi, Jn), n;
            } finally {
              La = !1;
            }
          }
        }
        function $i(e, t, n) {
          return 1073741821 - (1 + ((1073741821 - e + t / 10) / (n /= 10) | 0)) * n;
        }
        function $n(e, t) {
          if (e && e.defaultProps) for (var n in t = r({}, t), e = e.defaultProps) t[n] === void 0 && (t[n] = e[n]);
          return t;
        }
        var qi = { current: null }, Yi = null, Uo = null, Ki = null;
        function Ua() {
          Ki = Uo = Yi = null;
        }
        function Fa(e) {
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
          Yi = e, Ki = Uo = null, (e = e.dependencies) !== null && e.firstContext !== null && (e.expirationTime >= t && (tr = !0), e.firstContext = null);
        }
        function zn(e, t) {
          if (Ki !== e && t !== !1 && t !== 0) if (typeof t == "number" && t !== 1073741823 || (Ki = e, t = 1073741823), t = { context: e, observedBits: t, next: null }, Uo === null) {
            if (Yi === null) throw Error(g(308));
            Uo = t, Yi.dependencies = { expirationTime: 0, firstContext: t, responders: null };
          } else Uo = Uo.next = t;
          return e._currentValue;
        }
        var Vr = !1;
        function Ba(e) {
          e.updateQueue = { baseState: e.memoizedState, baseQueue: null, shared: { pending: null }, effects: null };
        }
        function Va(e, t) {
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
        function qs(e, t) {
          var n = e.alternate;
          n !== null && Va(n, e), (n = (e = e.updateQueue).baseQueue) === null ? (e.baseQueue = t.next = t, t.next = t) : (t.next = n.next, n.next = t);
        }
        function ai(e, t, n, o) {
          var a = e.updateQueue;
          Vr = !1;
          var h = a.baseQueue, k = a.shared.pending;
          if (k !== null) {
            if (h !== null) {
              var T = h.next;
              h.next = k.next, k.next = T;
            }
            h = k, a.shared.pending = null, (T = e.alternate) !== null && (T = T.updateQueue) !== null && (T.baseQueue = k);
          }
          if (h !== null) {
            T = h.next;
            var Z = a.baseState, Y = 0, ge = null, Re = null, We = null;
            if (T !== null) for (var ot = T; ; ) {
              if ((k = ot.expirationTime) < o) {
                var Fn = { expirationTime: ot.expirationTime, suspenseConfig: ot.suspenseConfig, tag: ot.tag, payload: ot.payload, callback: ot.callback, next: null };
                We === null ? (Re = We = Fn, ge = Z) : We = We.next = Fn, k > Y && (Y = k);
              } else {
                We !== null && (We = We.next = { expirationTime: 1073741823, suspenseConfig: ot.suspenseConfig, tag: ot.tag, payload: ot.payload, callback: ot.callback, next: null }), Bl(k, ot.suspenseConfig);
                e: {
                  var ln = e, oe = ot;
                  switch (k = t, Fn = n, oe.tag) {
                    case 1:
                      if (typeof (ln = oe.payload) == "function") {
                        Z = ln.call(Fn, Z, k);
                        break e;
                      }
                      Z = ln;
                      break e;
                    case 3:
                      ln.effectTag = -4097 & ln.effectTag | 64;
                    case 0:
                      if ((k = typeof (ln = oe.payload) == "function" ? ln.call(Fn, Z, k) : ln) == null) break e;
                      Z = r({}, Z, k);
                      break e;
                    case 2:
                      Vr = !0;
                  }
                }
                ot.callback !== null && (e.effectTag |= 32, (k = a.effects) === null ? a.effects = [ot] : k.push(ot));
              }
              if ((ot = ot.next) === null || ot === T) {
                if ((k = a.shared.pending) === null) break;
                ot = h.next = k.next, k.next = T, a.baseQueue = h = k, a.shared.pending = null;
              }
            }
            We === null ? ge = Z : We.next = Re, a.baseState = ge, a.baseQueue = We, ka(Y), e.expirationTime = Y, e.memoizedState = Z;
          }
        }
        function Ys(e, t, n) {
          if (e = t.effects, t.effects = null, e !== null) for (t = 0; t < e.length; t++) {
            var o = e[t], a = o.callback;
            if (a !== null) {
              if (o.callback = null, o = a, a = n, typeof o != "function") throw Error(g(191, o));
              o.call(a);
            }
          }
        }
        var si = he.ReactCurrentBatchConfig, Ks = new c.Component().refs;
        function Qi(e, t, n, o) {
          n = (n = n(o, t = e.memoizedState)) == null ? t : r({}, t, n), e.memoizedState = n, e.expirationTime === 0 && (e.updateQueue.baseState = n);
        }
        var Gi = { isMounted: function(e) {
          return !!(e = e._reactInternalFiber) && Nn(e) === e;
        }, enqueueSetState: function(e, t, n) {
          e = e._reactInternalFiber;
          var o = nr(), a = si.suspense;
          (a = Wr(o = go(o, e, a), a)).payload = t, n != null && (a.callback = n), Hr(e, a), Kr(e, o);
        }, enqueueReplaceState: function(e, t, n) {
          e = e._reactInternalFiber;
          var o = nr(), a = si.suspense;
          (a = Wr(o = go(o, e, a), a)).tag = 1, a.payload = t, n != null && (a.callback = n), Hr(e, a), Kr(e, o);
        }, enqueueForceUpdate: function(e, t) {
          e = e._reactInternalFiber;
          var n = nr(), o = si.suspense;
          (o = Wr(n = go(n, e, o), o)).tag = 2, t != null && (o.callback = t), Hr(e, o), Kr(e, n);
        } };
        function Qs(e, t, n, o, a, h, k) {
          return typeof (e = e.stateNode).shouldComponentUpdate == "function" ? e.shouldComponentUpdate(o, h, k) : !t.prototype || !t.prototype.isPureReactComponent || !gr(n, o) || !gr(a, h);
        }
        function Gs(e, t, n) {
          var o = !1, a = Fr, h = t.contextType;
          return typeof h == "object" && h !== null ? h = zn(h) : (a = hn(t) ? co : Xt.current, h = (o = (o = t.contextTypes) != null) ? Lo(e, a) : Fr), t = new t(n, h), e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null, t.updater = Gi, e.stateNode = t, t._reactInternalFiber = e, o && ((e = e.stateNode).__reactInternalMemoizedUnmaskedChildContext = a, e.__reactInternalMemoizedMaskedChildContext = h), t;
        }
        function Xs(e, t, n, o) {
          e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, o), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, o), t.state !== e && Gi.enqueueReplaceState(t, t.state, null);
        }
        function Wa(e, t, n, o) {
          var a = e.stateNode;
          a.props = n, a.state = e.memoizedState, a.refs = Ks, Ba(e);
          var h = t.contextType;
          typeof h == "object" && h !== null ? a.context = zn(h) : (h = hn(t) ? co : Xt.current, a.context = Lo(e, h)), ai(e, n, a, o), a.state = e.memoizedState, typeof (h = t.getDerivedStateFromProps) == "function" && (Qi(e, t, h, n), a.state = e.memoizedState), typeof t.getDerivedStateFromProps == "function" || typeof a.getSnapshotBeforeUpdate == "function" || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (t = a.state, typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount(), t !== a.state && Gi.enqueueReplaceState(a, a.state, null), ai(e, n, a, o), a.state = e.memoizedState), typeof a.componentDidMount == "function" && (e.effectTag |= 4);
        }
        var Xi = Array.isArray;
        function li(e, t, n) {
          if ((e = n.ref) !== null && typeof e != "function" && typeof e != "object") {
            if (n._owner) {
              if (n = n._owner) {
                if (n.tag !== 1) throw Error(g(309));
                var o = n.stateNode;
              }
              if (!o) throw Error(g(147, e));
              var a = "" + e;
              return t !== null && t.ref !== null && typeof t.ref == "function" && t.ref._stringRef === a ? t.ref : ((t = function(h) {
                var k = o.refs;
                k === Ks && (k = o.refs = {}), h === null ? delete k[a] : k[a] = h;
              })._stringRef = a, t);
            }
            if (typeof e != "string") throw Error(g(284));
            if (!n._owner) throw Error(g(290, e));
          }
          return e;
        }
        function Zi(e, t) {
          if (e.type !== "textarea") throw Error(g(31, Object.prototype.toString.call(t) === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : t, ""));
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
            return (oe = ko(oe, te)).index = 0, oe.sibling = null, oe;
          }
          function h(oe, te, ue) {
            return oe.index = ue, e ? (ue = oe.alternate) !== null ? (ue = ue.index) < te ? (oe.effectTag = 2, te) : ue : (oe.effectTag = 2, te) : te;
          }
          function k(oe) {
            return e && oe.alternate === null && (oe.effectTag = 2), oe;
          }
          function T(oe, te, ue, ve) {
            return te === null || te.tag !== 6 ? ((te = vs(ue, oe.mode, ve)).return = oe, te) : ((te = a(te, ue)).return = oe, te);
          }
          function Z(oe, te, ue, ve) {
            return te !== null && te.elementType === ue.type ? ((ve = a(te, ue.props)).ref = li(oe, te, ue), ve.return = oe, ve) : ((ve = wa(ue.type, ue.key, ue.props, null, oe.mode, ve)).ref = li(oe, te, ue), ve.return = oe, ve);
          }
          function Y(oe, te, ue, ve) {
            return te === null || te.tag !== 4 || te.stateNode.containerInfo !== ue.containerInfo || te.stateNode.implementation !== ue.implementation ? ((te = ks(ue, oe.mode, ve)).return = oe, te) : ((te = a(te, ue.children || [])).return = oe, te);
          }
          function ge(oe, te, ue, ve, _e) {
            return te === null || te.tag !== 7 ? ((te = Qr(ue, oe.mode, ve, _e)).return = oe, te) : ((te = a(te, ue)).return = oe, te);
          }
          function Re(oe, te, ue) {
            if (typeof te == "string" || typeof te == "number") return (te = vs("" + te, oe.mode, ue)).return = oe, te;
            if (typeof te == "object" && te !== null) {
              switch (te.$$typeof) {
                case He:
                  return (ue = wa(te.type, te.key, te.props, null, oe.mode, ue)).ref = li(oe, null, te), ue.return = oe, ue;
                case At:
                  return (te = ks(te, oe.mode, ue)).return = oe, te;
              }
              if (Xi(te) || en(te)) return (te = Qr(te, oe.mode, ue, null)).return = oe, te;
              Zi(oe, te);
            }
            return null;
          }
          function We(oe, te, ue, ve) {
            var _e = te !== null ? te.key : null;
            if (typeof ue == "string" || typeof ue == "number") return _e !== null ? null : T(oe, te, "" + ue, ve);
            if (typeof ue == "object" && ue !== null) {
              switch (ue.$$typeof) {
                case He:
                  return ue.key === _e ? ue.type === kt ? ge(oe, te, ue.props.children, ve, _e) : Z(oe, te, ue, ve) : null;
                case At:
                  return ue.key === _e ? Y(oe, te, ue, ve) : null;
              }
              if (Xi(ue) || en(ue)) return _e !== null ? null : ge(oe, te, ue, ve, null);
              Zi(oe, ue);
            }
            return null;
          }
          function ot(oe, te, ue, ve, _e) {
            if (typeof ve == "string" || typeof ve == "number") return T(te, oe = oe.get(ue) || null, "" + ve, _e);
            if (typeof ve == "object" && ve !== null) {
              switch (ve.$$typeof) {
                case He:
                  return oe = oe.get(ve.key === null ? ue : ve.key) || null, ve.type === kt ? ge(te, oe, ve.props.children, _e, ve.key) : Z(te, oe, ve, _e);
                case At:
                  return Y(te, oe = oe.get(ve.key === null ? ue : ve.key) || null, ve, _e);
              }
              if (Xi(ve) || en(ve)) return ge(te, oe = oe.get(ue) || null, ve, _e, null);
              Zi(te, ve);
            }
            return null;
          }
          function Fn(oe, te, ue, ve) {
            for (var _e = null, Oe = null, Be = te, at = te = 0, Dt = null; Be !== null && at < ue.length; at++) {
              Be.index > at ? (Dt = Be, Be = null) : Dt = Be.sibling;
              var Ze = We(oe, Be, ue[at], ve);
              if (Ze === null) {
                Be === null && (Be = Dt);
                break;
              }
              e && Be && Ze.alternate === null && t(oe, Be), te = h(Ze, te, at), Oe === null ? _e = Ze : Oe.sibling = Ze, Oe = Ze, Be = Dt;
            }
            if (at === ue.length) return n(oe, Be), _e;
            if (Be === null) {
              for (; at < ue.length; at++) (Be = Re(oe, ue[at], ve)) !== null && (te = h(Be, te, at), Oe === null ? _e = Be : Oe.sibling = Be, Oe = Be);
              return _e;
            }
            for (Be = o(oe, Be); at < ue.length; at++) (Dt = ot(Be, oe, at, ue[at], ve)) !== null && (e && Dt.alternate !== null && Be.delete(Dt.key === null ? at : Dt.key), te = h(Dt, te, at), Oe === null ? _e = Dt : Oe.sibling = Dt, Oe = Dt);
            return e && Be.forEach(function(Bt) {
              return t(oe, Bt);
            }), _e;
          }
          function ln(oe, te, ue, ve) {
            var _e = en(ue);
            if (typeof _e != "function") throw Error(g(150));
            if ((ue = _e.call(ue)) == null) throw Error(g(151));
            for (var Oe = _e = null, Be = te, at = te = 0, Dt = null, Ze = ue.next(); Be !== null && !Ze.done; at++, Ze = ue.next()) {
              Be.index > at ? (Dt = Be, Be = null) : Dt = Be.sibling;
              var Bt = We(oe, Be, Ze.value, ve);
              if (Bt === null) {
                Be === null && (Be = Dt);
                break;
              }
              e && Be && Bt.alternate === null && t(oe, Be), te = h(Bt, te, at), Oe === null ? _e = Bt : Oe.sibling = Bt, Oe = Bt, Be = Dt;
            }
            if (Ze.done) return n(oe, Be), _e;
            if (Be === null) {
              for (; !Ze.done; at++, Ze = ue.next()) (Ze = Re(oe, Ze.value, ve)) !== null && (te = h(Ze, te, at), Oe === null ? _e = Ze : Oe.sibling = Ze, Oe = Ze);
              return _e;
            }
            for (Be = o(oe, Be); !Ze.done; at++, Ze = ue.next()) (Ze = ot(Be, oe, at, Ze.value, ve)) !== null && (e && Ze.alternate !== null && Be.delete(Ze.key === null ? at : Ze.key), te = h(Ze, te, at), Oe === null ? _e = Ze : Oe.sibling = Ze, Oe = Ze);
            return e && Be.forEach(function(wr) {
              return t(oe, wr);
            }), _e;
          }
          return function(oe, te, ue, ve) {
            var _e = typeof ue == "object" && ue !== null && ue.type === kt && ue.key === null;
            _e && (ue = ue.props.children);
            var Oe = typeof ue == "object" && ue !== null;
            if (Oe) switch (ue.$$typeof) {
              case He:
                e: {
                  for (Oe = ue.key, _e = te; _e !== null; ) {
                    if (_e.key === Oe) {
                      switch (_e.tag) {
                        case 7:
                          if (ue.type === kt) {
                            n(oe, _e.sibling), (te = a(_e, ue.props.children)).return = oe, oe = te;
                            break e;
                          }
                          break;
                        default:
                          if (_e.elementType === ue.type) {
                            n(oe, _e.sibling), (te = a(_e, ue.props)).ref = li(oe, _e, ue), te.return = oe, oe = te;
                            break e;
                          }
                      }
                      n(oe, _e);
                      break;
                    }
                    t(oe, _e), _e = _e.sibling;
                  }
                  ue.type === kt ? ((te = Qr(ue.props.children, oe.mode, ve, ue.key)).return = oe, oe = te) : ((ve = wa(ue.type, ue.key, ue.props, null, oe.mode, ve)).ref = li(oe, te, ue), ve.return = oe, oe = ve);
                }
                return k(oe);
              case At:
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
                return k(oe);
            }
            if (typeof ue == "string" || typeof ue == "number") return ue = "" + ue, te !== null && te.tag === 6 ? (n(oe, te.sibling), (te = a(te, ue)).return = oe, oe = te) : (n(oe, te), (te = vs(ue, oe.mode, ve)).return = oe, oe = te), k(oe);
            if (Xi(ue)) return Fn(oe, te, ue, ve);
            if (en(ue)) return ln(oe, te, ue, ve);
            if (Oe && Zi(oe, ue), ue === void 0 && !_e) switch (oe.tag) {
              case 1:
              case 0:
                throw oe = oe.type, Error(g(152, oe.displayName || oe.name || "Component"));
            }
            return n(oe, te);
          };
        }
        var Bo = Zs(!0), Ha = Zs(!1), ci = {}, er = { current: ci }, ui = { current: ci }, di = { current: ci };
        function uo(e) {
          if (e === ci) throw Error(g(174));
          return e;
        }
        function $a(e, t) {
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
        function Vo() {
          vt(er), vt(ui), vt(di);
        }
        function Js(e) {
          uo(di.current);
          var t = uo(er.current), n = Ce(t, e.type);
          t !== n && (St(ui, e), St(er, n));
        }
        function qa(e) {
          ui.current === e && (vt(er), vt(ui));
        }
        var Ct = { current: 0 };
        function Ji(e) {
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
        var ea = he.ReactCurrentDispatcher, Ln = he.ReactCurrentBatchConfig, $r = 0, Lt = null, sn = null, Zt = null, ta = !1;
        function En() {
          throw Error(g(321));
        }
        function Ka(e, t) {
          if (t === null) return !1;
          for (var n = 0; n < t.length && n < e.length; n++) if (!mr(e[n], t[n])) return !1;
          return !0;
        }
        function Qa(e, t, n, o, a, h) {
          if ($r = h, Lt = t, t.memoizedState = null, t.updateQueue = null, t.expirationTime = 0, ea.current = e === null || e.memoizedState === null ? kc : wc, e = n(o, a), t.expirationTime === $r) {
            h = 0;
            do {
              if (t.expirationTime = 0, !(25 > h)) throw Error(g(301));
              h += 1, Zt = sn = null, t.updateQueue = null, ea.current = Ec, e = n(o, a);
            } while (t.expirationTime === $r);
          }
          if (ea.current = aa, t = sn !== null && sn.next !== null, $r = 0, Zt = sn = Lt = null, ta = !1, t) throw Error(g(300));
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
            if (e === null) throw Error(g(310));
            e = { memoizedState: (sn = e).memoizedState, baseState: sn.baseState, baseQueue: sn.baseQueue, queue: sn.queue, next: null }, Zt === null ? Lt.memoizedState = Zt = e : Zt = Zt.next = e;
          }
          return Zt;
        }
        function fo(e, t) {
          return typeof t == "function" ? t(e) : t;
        }
        function na(e) {
          var t = Ho(), n = t.queue;
          if (n === null) throw Error(g(311));
          n.lastRenderedReducer = e;
          var o = sn, a = o.baseQueue, h = n.pending;
          if (h !== null) {
            if (a !== null) {
              var k = a.next;
              a.next = h.next, h.next = k;
            }
            o.baseQueue = a = h, n.pending = null;
          }
          if (a !== null) {
            a = a.next, o = o.baseState;
            var T = k = h = null, Z = a;
            do {
              var Y = Z.expirationTime;
              if (Y < $r) {
                var ge = { expirationTime: Z.expirationTime, suspenseConfig: Z.suspenseConfig, action: Z.action, eagerReducer: Z.eagerReducer, eagerState: Z.eagerState, next: null };
                T === null ? (k = T = ge, h = o) : T = T.next = ge, Y > Lt.expirationTime && (Lt.expirationTime = Y, ka(Y));
              } else T !== null && (T = T.next = { expirationTime: 1073741823, suspenseConfig: Z.suspenseConfig, action: Z.action, eagerReducer: Z.eagerReducer, eagerState: Z.eagerState, next: null }), Bl(Y, Z.suspenseConfig), o = Z.eagerReducer === e ? Z.eagerState : e(o, Z.action);
              Z = Z.next;
            } while (Z !== null && Z !== a);
            T === null ? h = o : T.next = k, mr(o, t.memoizedState) || (tr = !0), t.memoizedState = o, t.baseState = h, t.baseQueue = T, n.lastRenderedState = o;
          }
          return [t.memoizedState, n.dispatch];
        }
        function ra(e) {
          var t = Ho(), n = t.queue;
          if (n === null) throw Error(g(311));
          n.lastRenderedReducer = e;
          var o = n.dispatch, a = n.pending, h = t.memoizedState;
          if (a !== null) {
            n.pending = null;
            var k = a = a.next;
            do
              h = e(h, k.action), k = k.next;
            while (k !== a);
            mr(h, t.memoizedState) || (tr = !0), t.memoizedState = h, t.baseQueue === null && (t.baseState = h), n.lastRenderedState = h;
          }
          return [h, o];
        }
        function Ga(e) {
          var t = Wo();
          return typeof e == "function" && (e = e()), t.memoizedState = t.baseState = e, e = (e = t.queue = { pending: null, dispatch: null, lastRenderedReducer: fo, lastRenderedState: e }).dispatch = sl.bind(null, Lt, e), [t.memoizedState, e];
        }
        function Xa(e, t, n, o) {
          return e = { tag: e, create: t, destroy: n, deps: o, next: null }, (t = Lt.updateQueue) === null ? (t = { lastEffect: null }, Lt.updateQueue = t, t.lastEffect = e.next = e) : (n = t.lastEffect) === null ? t.lastEffect = e.next = e : (o = n.next, n.next = e, e.next = o, t.lastEffect = e), e;
        }
        function el() {
          return Ho().memoizedState;
        }
        function Za(e, t, n, o) {
          var a = Wo();
          Lt.effectTag |= e, a.memoizedState = Xa(1 | t, n, void 0, o === void 0 ? null : o);
        }
        function Ja(e, t, n, o) {
          var a = Ho();
          o = o === void 0 ? null : o;
          var h = void 0;
          if (sn !== null) {
            var k = sn.memoizedState;
            if (h = k.destroy, o !== null && Ka(o, k.deps)) return void Xa(t, n, h, o);
          }
          Lt.effectTag |= e, a.memoizedState = Xa(1 | t, n, h, o);
        }
        function tl(e, t) {
          return Za(516, 4, e, t);
        }
        function oa(e, t) {
          return Ja(516, 4, e, t);
        }
        function nl(e, t) {
          return Ja(4, 2, e, t);
        }
        function rl(e, t) {
          return typeof t == "function" ? (e = e(), t(e), function() {
            t(null);
          }) : t != null ? (e = e(), t.current = e, function() {
            t.current = null;
          }) : void 0;
        }
        function ol(e, t, n) {
          return n = n != null ? n.concat([e]) : null, Ja(4, 2, rl.bind(null, t, e), n);
        }
        function es() {
        }
        function il(e, t) {
          return Wo().memoizedState = [e, t === void 0 ? null : t], e;
        }
        function ia(e, t) {
          var n = Ho();
          t = t === void 0 ? null : t;
          var o = n.memoizedState;
          return o !== null && t !== null && Ka(t, o[1]) ? o[0] : (n.memoizedState = [e, t], e);
        }
        function al(e, t) {
          var n = Ho();
          t = t === void 0 ? null : t;
          var o = n.memoizedState;
          return o !== null && t !== null && Ka(t, o[1]) ? o[0] : (e = e(), n.memoizedState = [e, t], e);
        }
        function ts(e, t, n) {
          var o = Hi();
          Br(98 > o ? 98 : o, function() {
            e(!0);
          }), Br(97 < o ? 97 : o, function() {
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
          var o = nr(), a = si.suspense;
          a = { expirationTime: o = go(o, e, a), suspenseConfig: a, action: n, eagerReducer: null, eagerState: null, next: null };
          var h = t.pending;
          if (h === null ? a.next = a : (a.next = h.next, h.next = a), t.pending = a, h = e.alternate, e === Lt || h !== null && h === Lt) ta = !0, a.expirationTime = $r, Lt.expirationTime = $r;
          else {
            if (e.expirationTime === 0 && (h === null || h.expirationTime === 0) && (h = t.lastRenderedReducer) !== null) try {
              var k = t.lastRenderedState, T = h(k, n);
              if (a.eagerReducer = h, a.eagerState = T, mr(T, k)) return;
            } catch {
            }
            Kr(e, o);
          }
        }
        var aa = { readContext: zn, useCallback: En, useContext: En, useEffect: En, useImperativeHandle: En, useLayoutEffect: En, useMemo: En, useReducer: En, useRef: En, useState: En, useDebugValue: En, useResponder: En, useDeferredValue: En, useTransition: En }, kc = { readContext: zn, useCallback: il, useContext: zn, useEffect: tl, useImperativeHandle: function(e, t, n) {
          return n = n != null ? n.concat([e]) : null, Za(4, 2, rl.bind(null, t, e), n);
        }, useLayoutEffect: function(e, t) {
          return Za(4, 2, e, t);
        }, useMemo: function(e, t) {
          var n = Wo();
          return t = t === void 0 ? null : t, e = e(), n.memoizedState = [e, t], e;
        }, useReducer: function(e, t, n) {
          var o = Wo();
          return t = n !== void 0 ? n(t) : t, o.memoizedState = o.baseState = t, e = (e = o.queue = { pending: null, dispatch: null, lastRenderedReducer: e, lastRenderedState: t }).dispatch = sl.bind(null, Lt, e), [o.memoizedState, e];
        }, useRef: function(e) {
          return e = { current: e }, Wo().memoizedState = e;
        }, useState: Ga, useDebugValue: es, useResponder: Ya, useDeferredValue: function(e, t) {
          var n = Ga(e), o = n[0], a = n[1];
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
          var t = Ga(!1), n = t[0];
          return t = t[1], [il(ts.bind(null, t, e), [t, e]), n];
        } }, wc = { readContext: zn, useCallback: ia, useContext: zn, useEffect: oa, useImperativeHandle: ol, useLayoutEffect: nl, useMemo: al, useReducer: na, useRef: el, useState: function() {
          return na(fo);
        }, useDebugValue: es, useResponder: Ya, useDeferredValue: function(e, t) {
          var n = na(fo), o = n[0], a = n[1];
          return oa(function() {
            var h = Ln.suspense;
            Ln.suspense = t === void 0 ? null : t;
            try {
              a(e);
            } finally {
              Ln.suspense = h;
            }
          }, [e, t]), o;
        }, useTransition: function(e) {
          var t = na(fo), n = t[0];
          return t = t[1], [ia(ts.bind(null, t, e), [t, e]), n];
        } }, Ec = { readContext: zn, useCallback: ia, useContext: zn, useEffect: oa, useImperativeHandle: ol, useLayoutEffect: nl, useMemo: al, useReducer: ra, useRef: el, useState: function() {
          return ra(fo);
        }, useDebugValue: es, useResponder: Ya, useDeferredValue: function(e, t) {
          var n = ra(fo), o = n[0], a = n[1];
          return oa(function() {
            var h = Ln.suspense;
            Ln.suspense = t === void 0 ? null : t;
            try {
              a(e);
            } finally {
              Ln.suspense = h;
            }
          }, [e, t]), o;
        }, useTransition: function(e) {
          var t = ra(fo), n = t[0];
          return t = t[1], [ia(ts.bind(null, t, e), [t, e]), n];
        } }, br = null, qr = null, po = !1;
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
        function ns(e) {
          if (po) {
            var t = qr;
            if (t) {
              var n = t;
              if (!cl(e, t)) {
                if (!(t = Ir(n.nextSibling)) || !cl(e, t)) return e.effectTag = -1025 & e.effectTag | 2, po = !1, void (br = e);
                ll(br, n);
              }
              br = e, qr = Ir(t.firstChild);
            } else e.effectTag = -1025 & e.effectTag | 2, po = !1, br = e;
          }
        }
        function ul(e) {
          for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13; ) e = e.return;
          br = e;
        }
        function sa(e) {
          if (e !== br) return !1;
          if (!po) return ul(e), po = !0, !1;
          var t = e.type;
          if (e.tag !== 5 || t !== "head" && t !== "body" && !ei(t, e.memoizedProps)) for (t = qr; t; ) ll(e, t), t = Ir(t.nextSibling);
          if (ul(e), e.tag === 13) {
            if (!(e = (e = e.memoizedState) !== null ? e.dehydrated : null)) throw Error(g(317));
            e: {
              for (e = e.nextSibling, t = 0; e; ) {
                if (e.nodeType === 8) {
                  var n = e.data;
                  if (n === "/$") {
                    if (t === 0) {
                      qr = Ir(e.nextSibling);
                      break e;
                    }
                    t--;
                  } else n !== "$" && n !== "$!" && n !== "$?" || t++;
                }
                e = e.nextSibling;
              }
              qr = null;
            }
          } else qr = br ? Ir(e.stateNode.nextSibling) : null;
          return !0;
        }
        function rs() {
          qr = br = null, po = !1;
        }
        var _c = he.ReactCurrentOwner, tr = !1;
        function Un(e, t, n, o) {
          t.child = e === null ? Ha(t, null, n, o) : Bo(t, e.child, n, o);
        }
        function dl(e, t, n, o, a) {
          n = n.render;
          var h = t.ref;
          return Fo(t, a), o = Qa(e, t, n, o, h, a), e === null || tr ? (t.effectTag |= 1, Un(e, t, o, a), t.child) : (t.updateQueue = e.updateQueue, t.effectTag &= -517, e.expirationTime <= a && (e.expirationTime = 0), vr(e, t, a));
        }
        function fl(e, t, n, o, a, h) {
          if (e === null) {
            var k = n.type;
            return typeof k != "function" || bs(k) || k.defaultProps !== void 0 || n.compare !== null || n.defaultProps !== void 0 ? ((e = wa(n.type, null, o, null, t.mode, h)).ref = t.ref, e.return = t, t.child = e) : (t.tag = 15, t.type = k, pl(e, t, k, o, a, h));
          }
          return k = e.child, a < h && (a = k.memoizedProps, (n = (n = n.compare) !== null ? n : gr)(a, o) && e.ref === t.ref) ? vr(e, t, h) : (t.effectTag |= 1, (e = ko(k, o)).ref = t.ref, e.return = t, t.child = e);
        }
        function pl(e, t, n, o, a, h) {
          return e !== null && gr(e.memoizedProps, o) && e.ref === t.ref && (tr = !1, a < h) ? (t.expirationTime = e.expirationTime, vr(e, t, h)) : os(e, t, n, o, h);
        }
        function hl(e, t) {
          var n = t.ref;
          (e === null && n !== null || e !== null && e.ref !== n) && (t.effectTag |= 128);
        }
        function os(e, t, n, o, a) {
          var h = hn(n) ? co : Xt.current;
          return h = Lo(t, h), Fo(t, a), n = Qa(e, t, n, o, h, a), e === null || tr ? (t.effectTag |= 1, Un(e, t, n, a), t.child) : (t.updateQueue = e.updateQueue, t.effectTag &= -517, e.expirationTime <= a && (e.expirationTime = 0), vr(e, t, a));
        }
        function ml(e, t, n, o, a) {
          if (hn(n)) {
            var h = !0;
            Bi(t);
          } else h = !1;
          if (Fo(t, a), t.stateNode === null) e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= 2), Gs(t, n, o), Wa(t, n, o, a), o = !0;
          else if (e === null) {
            var k = t.stateNode, T = t.memoizedProps;
            k.props = T;
            var Z = k.context, Y = n.contextType;
            typeof Y == "object" && Y !== null ? Y = zn(Y) : Y = Lo(t, Y = hn(n) ? co : Xt.current);
            var ge = n.getDerivedStateFromProps, Re = typeof ge == "function" || typeof k.getSnapshotBeforeUpdate == "function";
            Re || typeof k.UNSAFE_componentWillReceiveProps != "function" && typeof k.componentWillReceiveProps != "function" || (T !== o || Z !== Y) && Xs(t, k, o, Y), Vr = !1;
            var We = t.memoizedState;
            k.state = We, ai(t, o, k, a), Z = t.memoizedState, T !== o || We !== Z || pn.current || Vr ? (typeof ge == "function" && (Qi(t, n, ge, o), Z = t.memoizedState), (T = Vr || Qs(t, n, T, o, We, Z, Y)) ? (Re || typeof k.UNSAFE_componentWillMount != "function" && typeof k.componentWillMount != "function" || (typeof k.componentWillMount == "function" && k.componentWillMount(), typeof k.UNSAFE_componentWillMount == "function" && k.UNSAFE_componentWillMount()), typeof k.componentDidMount == "function" && (t.effectTag |= 4)) : (typeof k.componentDidMount == "function" && (t.effectTag |= 4), t.memoizedProps = o, t.memoizedState = Z), k.props = o, k.state = Z, k.context = Y, o = T) : (typeof k.componentDidMount == "function" && (t.effectTag |= 4), o = !1);
          } else k = t.stateNode, Va(e, t), T = t.memoizedProps, k.props = t.type === t.elementType ? T : $n(t.type, T), Z = k.context, typeof (Y = n.contextType) == "object" && Y !== null ? Y = zn(Y) : Y = Lo(t, Y = hn(n) ? co : Xt.current), (Re = typeof (ge = n.getDerivedStateFromProps) == "function" || typeof k.getSnapshotBeforeUpdate == "function") || typeof k.UNSAFE_componentWillReceiveProps != "function" && typeof k.componentWillReceiveProps != "function" || (T !== o || Z !== Y) && Xs(t, k, o, Y), Vr = !1, Z = t.memoizedState, k.state = Z, ai(t, o, k, a), We = t.memoizedState, T !== o || Z !== We || pn.current || Vr ? (typeof ge == "function" && (Qi(t, n, ge, o), We = t.memoizedState), (ge = Vr || Qs(t, n, T, o, Z, We, Y)) ? (Re || typeof k.UNSAFE_componentWillUpdate != "function" && typeof k.componentWillUpdate != "function" || (typeof k.componentWillUpdate == "function" && k.componentWillUpdate(o, We, Y), typeof k.UNSAFE_componentWillUpdate == "function" && k.UNSAFE_componentWillUpdate(o, We, Y)), typeof k.componentDidUpdate == "function" && (t.effectTag |= 4), typeof k.getSnapshotBeforeUpdate == "function" && (t.effectTag |= 256)) : (typeof k.componentDidUpdate != "function" || T === e.memoizedProps && Z === e.memoizedState || (t.effectTag |= 4), typeof k.getSnapshotBeforeUpdate != "function" || T === e.memoizedProps && Z === e.memoizedState || (t.effectTag |= 256), t.memoizedProps = o, t.memoizedState = We), k.props = o, k.state = We, k.context = Y, o = ge) : (typeof k.componentDidUpdate != "function" || T === e.memoizedProps && Z === e.memoizedState || (t.effectTag |= 4), typeof k.getSnapshotBeforeUpdate != "function" || T === e.memoizedProps && Z === e.memoizedState || (t.effectTag |= 256), o = !1);
          return is(e, t, n, o, h, a);
        }
        function is(e, t, n, o, a, h) {
          hl(e, t);
          var k = (64 & t.effectTag) != 0;
          if (!o && !k) return a && Ds(t, n, !1), vr(e, t, h);
          o = t.stateNode, _c.current = t;
          var T = k && typeof n.getDerivedStateFromError != "function" ? null : o.render();
          return t.effectTag |= 1, e !== null && k ? (t.child = Bo(t, e.child, null, h), t.child = Bo(t, null, T, h)) : Un(e, t, T, h), t.memoizedState = o.state, a && Ds(t, n, !0), t.child;
        }
        function gl(e) {
          var t = e.stateNode;
          t.pendingContext ? Ns(0, t.pendingContext, t.pendingContext !== t.context) : t.context && Ns(0, t.context, !1), $a(e, t.containerInfo);
        }
        var yl, bl, vl, as = { dehydrated: null, retryTime: 0 };
        function kl(e, t, n) {
          var o, a = t.mode, h = t.pendingProps, k = Ct.current, T = !1;
          if ((o = (64 & t.effectTag) != 0) || (o = (2 & k) != 0 && (e === null || e.memoizedState !== null)), o ? (T = !0, t.effectTag &= -65) : e !== null && e.memoizedState === null || h.fallback === void 0 || h.unstable_avoidThisFallback === !0 || (k |= 1), St(Ct, 1 & k), e === null) {
            if (h.fallback !== void 0 && ns(t), T) {
              if (T = h.fallback, (h = Qr(null, a, 0, null)).return = t, (2 & t.mode) == 0) for (e = t.memoizedState !== null ? t.child.child : t.child, h.child = e; e !== null; ) e.return = h, e = e.sibling;
              return (n = Qr(T, a, n, null)).return = t, h.sibling = n, t.memoizedState = as, t.child = h, n;
            }
            return a = h.children, t.memoizedState = null, t.child = Ha(t, null, a, n);
          }
          if (e.memoizedState !== null) {
            if (a = (e = e.child).sibling, T) {
              if (h = h.fallback, (n = ko(e, e.pendingProps)).return = t, (2 & t.mode) == 0 && (T = t.memoizedState !== null ? t.child.child : t.child) !== e.child) for (n.child = T; T !== null; ) T.return = n, T = T.sibling;
              return (a = ko(a, h)).return = t, n.sibling = a, n.childExpirationTime = 0, t.memoizedState = as, t.child = n, a;
            }
            return n = Bo(t, e.child, h.children, n), t.memoizedState = null, t.child = n;
          }
          if (e = e.child, T) {
            if (T = h.fallback, (h = Qr(null, a, 0, null)).return = t, h.child = e, e !== null && (e.return = h), (2 & t.mode) == 0) for (e = t.memoizedState !== null ? t.child.child : t.child, h.child = e; e !== null; ) e.return = h, e = e.sibling;
            return (n = Qr(T, a, n, null)).return = t, h.sibling = n, n.effectTag |= 2, h.childExpirationTime = 0, t.memoizedState = as, t.child = h, n;
          }
          return t.memoizedState = null, t.child = Bo(t, e, h.children, n);
        }
        function wl(e, t) {
          e.expirationTime < t && (e.expirationTime = t);
          var n = e.alternate;
          n !== null && n.expirationTime < t && (n.expirationTime = t), $s(e.return, t);
        }
        function ss(e, t, n, o, a, h) {
          var k = e.memoizedState;
          k === null ? e.memoizedState = { isBackwards: t, rendering: null, renderingStartTime: 0, last: o, tail: n, tailExpiration: 0, tailMode: a, lastEffect: h } : (k.isBackwards = t, k.rendering = null, k.renderingStartTime = 0, k.last = o, k.tail = n, k.tailExpiration = 0, k.tailMode = a, k.lastEffect = h);
        }
        function El(e, t, n) {
          var o = t.pendingProps, a = o.revealOrder, h = o.tail;
          if (Un(e, t, o.children, n), (2 & (o = Ct.current)) != 0) o = 1 & o | 2, t.effectTag |= 64;
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
            o &= 1;
          }
          if (St(Ct, o), (2 & t.mode) == 0) t.memoizedState = null;
          else switch (a) {
            case "forwards":
              for (n = t.child, a = null; n !== null; ) (e = n.alternate) !== null && Ji(e) === null && (a = n), n = n.sibling;
              (n = a) === null ? (a = t.child, t.child = null) : (a = n.sibling, n.sibling = null), ss(t, !1, a, n, h, t.lastEffect);
              break;
            case "backwards":
              for (n = null, a = t.child, t.child = null; a !== null; ) {
                if ((e = a.alternate) !== null && Ji(e) === null) {
                  t.child = a;
                  break;
                }
                e = a.sibling, a.sibling = n, n = a, a = e;
              }
              ss(t, !0, n, null, h, t.lastEffect);
              break;
            case "together":
              ss(t, !1, null, null, void 0, t.lastEffect);
              break;
            default:
              t.memoizedState = null;
          }
          return t.child;
        }
        function vr(e, t, n) {
          e !== null && (t.dependencies = e.dependencies);
          var o = t.expirationTime;
          if (o !== 0 && ka(o), t.childExpirationTime < n) return null;
          if (e !== null && t.child !== e.child) throw Error(g(153));
          if (t.child !== null) {
            for (n = ko(e = t.child, e.pendingProps), t.child = n, n.return = t; e.sibling !== null; ) e = e.sibling, (n = n.sibling = ko(e, e.pendingProps)).return = t;
            n.sibling = null;
          }
          return t.child;
        }
        function la(e, t) {
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
              return hn(t.type) && Fi(), null;
            case 3:
              return Vo(), vt(pn), vt(Xt), (n = t.stateNode).pendingContext && (n.context = n.pendingContext, n.pendingContext = null), e !== null && e.child !== null || !sa(t) || (t.effectTag |= 4), null;
            case 5:
              qa(t), n = uo(di.current);
              var a = t.type;
              if (e !== null && t.stateNode != null) bl(e, t, a, o, n), e.ref !== t.ref && (t.effectTag |= 128);
              else {
                if (!o) {
                  if (t.stateNode === null) throw Error(g(166));
                  return null;
                }
                if (e = uo(er.current), sa(t)) {
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
                      yn(o, h), mt("invalid", o), Wn(n, "onChange");
                      break;
                    case "select":
                      o._wrapperState = { wasMultiple: !!h.multiple }, mt("invalid", o), Wn(n, "onChange");
                      break;
                    case "textarea":
                      On(o, h), mt("invalid", o), Wn(n, "onChange");
                  }
                  for (var k in Ko(a, h), e = null, h) if (h.hasOwnProperty(k)) {
                    var T = h[k];
                    k === "children" ? typeof T == "string" ? o.textContent !== T && (e = ["children", T]) : typeof T == "number" && o.textContent !== "" + T && (e = ["children", "" + T]) : I.hasOwnProperty(k) && T != null && Wn(n, k);
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
                  switch (k = n.nodeType === 9 ? n : n.ownerDocument, e === Ti && (e = ke(a)), e === Ti ? a === "script" ? ((e = k.createElement("div")).innerHTML = "<script><\/script>", e = e.removeChild(e.firstChild)) : typeof o.is == "string" ? e = k.createElement(a, { is: o.is }) : (e = k.createElement(a), a === "select" && (k = e, o.multiple ? k.multiple = !0 : o.size && (k.size = o.size))) : e = k.createElementNS(e, a), e[Qn] = t, e[ro] = o, yl(e, t), t.stateNode = e, k = Qo(a, o), a) {
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
                      yn(e, o), T = Cr(e, o), mt("invalid", e), Wn(n, "onChange");
                      break;
                    case "option":
                      T = sr(e, o);
                      break;
                    case "select":
                      e._wrapperState = { wasMultiple: !!o.multiple }, T = r({}, o, { value: void 0 }), mt("invalid", e), Wn(n, "onChange");
                      break;
                    case "textarea":
                      On(e, o), T = lr(e, o), mt("invalid", e), Wn(n, "onChange");
                      break;
                    default:
                      T = o;
                  }
                  Ko(a, T);
                  var Z = T;
                  for (h in Z) if (Z.hasOwnProperty(h)) {
                    var Y = Z[h];
                    h === "style" ? Si(e, Y) : h === "dangerouslySetInnerHTML" ? (Y = Y ? Y.__html : void 0) != null && Ye(e, Y) : h === "children" ? typeof Y == "string" ? (a !== "textarea" || Y !== "") && st(e, Y) : typeof Y == "number" && st(e, "" + Y) : h !== "suppressContentEditableWarning" && h !== "suppressHydrationWarning" && h !== "autoFocus" && (I.hasOwnProperty(h) ? Y != null && Wn(n, h) : Y != null && je(e, h, Y, k));
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
                  Ri(a, o) && (t.effectTag |= 4);
                }
                t.ref !== null && (t.effectTag |= 128);
              }
              return null;
            case 6:
              if (e && t.stateNode != null) vl(0, t, e.memoizedProps, o);
              else {
                if (typeof o != "string" && t.stateNode === null) throw Error(g(166));
                n = uo(di.current), uo(er.current), sa(t) ? (n = t.stateNode, o = t.memoizedProps, n[Qn] = t, n.nodeValue !== o && (t.effectTag |= 4)) : ((n = (n.nodeType === 9 ? n : n.ownerDocument).createTextNode(o))[Qn] = t, t.stateNode = n);
              }
              return null;
            case 13:
              return vt(Ct), o = t.memoizedState, (64 & t.effectTag) != 0 ? (t.expirationTime = n, t) : (n = o !== null, o = !1, e === null ? t.memoizedProps.fallback !== void 0 && sa(t) : (o = (a = e.memoizedState) !== null, n || a === null || (a = e.child.sibling) !== null && ((h = t.firstEffect) !== null ? (t.firstEffect = a, a.nextEffect = h) : (t.firstEffect = t.lastEffect = a, a.nextEffect = null), a.effectTag = 8)), n && !o && (2 & t.mode) != 0 && (e === null && t.memoizedProps.unstable_avoidThisFallback !== !0 || (1 & Ct.current) != 0 ? Ft === ho && (Ft = ua) : (Ft !== ho && Ft !== ua || (Ft = da), pi !== 0 && _n !== null && (wo(_n, mn), ql(_n, pi)))), (n || o) && (t.effectTag |= 4), null);
            case 4:
              return Vo(), null;
            case 10:
              return Fa(t), null;
            case 17:
              return hn(t.type) && Fi(), null;
            case 19:
              if (vt(Ct), (o = t.memoizedState) === null) return null;
              if (a = (64 & t.effectTag) != 0, (h = o.rendering) === null) {
                if (a) la(o, !1);
                else if (Ft !== ho || e !== null && (64 & e.effectTag) != 0) for (h = t.child; h !== null; ) {
                  if ((e = Ji(h)) !== null) {
                    for (t.effectTag |= 64, la(o, !1), (a = e.updateQueue) !== null && (t.updateQueue = a, t.effectTag |= 4), o.lastEffect === null && (t.firstEffect = null), t.lastEffect = o.lastEffect, o = t.child; o !== null; ) h = n, (a = o).effectTag &= 2, a.nextEffect = null, a.firstEffect = null, a.lastEffect = null, (e = a.alternate) === null ? (a.childExpirationTime = 0, a.expirationTime = h, a.child = null, a.memoizedProps = null, a.memoizedState = null, a.updateQueue = null, a.dependencies = null) : (a.childExpirationTime = e.childExpirationTime, a.expirationTime = e.expirationTime, a.child = e.child, a.memoizedProps = e.memoizedProps, a.memoizedState = e.memoizedState, a.updateQueue = e.updateQueue, h = e.dependencies, a.dependencies = h === null ? null : { expirationTime: h.expirationTime, firstContext: h.firstContext, responders: h.responders }), o = o.sibling;
                    return St(Ct, 1 & Ct.current | 2), t.child;
                  }
                  h = h.sibling;
                }
              } else {
                if (!a) if ((e = Ji(h)) !== null) {
                  if (t.effectTag |= 64, a = !0, (n = e.updateQueue) !== null && (t.updateQueue = n, t.effectTag |= 4), la(o, !0), o.tail === null && o.tailMode === "hidden" && !h.alternate) return (t = t.lastEffect = o.lastEffect) !== null && (t.nextEffect = null), null;
                } else 2 * jn() - o.renderingStartTime > o.tailExpiration && 1 < n && (t.effectTag |= 64, a = !0, la(o, !1), t.expirationTime = t.childExpirationTime = n - 1);
                o.isBackwards ? (h.sibling = t.child, t.child = h) : ((n = o.last) !== null ? n.sibling = h : t.child = h, o.last = h);
              }
              return o.tail !== null ? (o.tailExpiration === 0 && (o.tailExpiration = jn() + 500), n = o.tail, o.rendering = n, o.tail = n.sibling, o.lastEffect = t.lastEffect, o.renderingStartTime = jn(), n.sibling = null, t = Ct.current, St(Ct, a ? 1 & t | 2 : 1 & t), n) : null;
          }
          throw Error(g(156, t.tag));
        }
        function Sc(e) {
          switch (e.tag) {
            case 1:
              hn(e.type) && Fi();
              var t = e.effectTag;
              return 4096 & t ? (e.effectTag = -4097 & t | 64, e) : null;
            case 3:
              if (Vo(), vt(pn), vt(Xt), (64 & (t = e.effectTag)) != 0) throw Error(g(285));
              return e.effectTag = -4097 & t | 64, e;
            case 5:
              return qa(e), null;
            case 13:
              return vt(Ct), 4096 & (t = e.effectTag) ? (e.effectTag = -4097 & t | 64, e) : null;
            case 19:
              return vt(Ct), null;
            case 4:
              return Vo(), null;
            case 10:
              return Fa(e), null;
            default:
              return null;
          }
        }
        function ls(e, t) {
          return { value: e, source: t, stack: xr(t) };
        }
        yl = function(e, t) {
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
        }, bl = function(e, t, n, o, a) {
          var h = e.memoizedProps;
          if (h !== o) {
            var k, T, Z = t.stateNode;
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
            for (k in Ko(n, o), n = null, h) if (!o.hasOwnProperty(k) && h.hasOwnProperty(k) && h[k] != null) if (k === "style") for (T in Z = h[k]) Z.hasOwnProperty(T) && (n || (n = {}), n[T] = "");
            else k !== "dangerouslySetInnerHTML" && k !== "children" && k !== "suppressContentEditableWarning" && k !== "suppressHydrationWarning" && k !== "autoFocus" && (I.hasOwnProperty(k) ? e || (e = []) : (e = e || []).push(k, null));
            for (k in o) {
              var Y = o[k];
              if (Z = h != null ? h[k] : void 0, o.hasOwnProperty(k) && Y !== Z && (Y != null || Z != null)) if (k === "style") if (Z) {
                for (T in Z) !Z.hasOwnProperty(T) || Y && Y.hasOwnProperty(T) || (n || (n = {}), n[T] = "");
                for (T in Y) Y.hasOwnProperty(T) && Z[T] !== Y[T] && (n || (n = {}), n[T] = Y[T]);
              } else n || (e || (e = []), e.push(k, n)), n = Y;
              else k === "dangerouslySetInnerHTML" ? (Y = Y ? Y.__html : void 0, Z = Z ? Z.__html : void 0, Y != null && Z !== Y && (e = e || []).push(k, Y)) : k === "children" ? Z === Y || typeof Y != "string" && typeof Y != "number" || (e = e || []).push(k, "" + Y) : k !== "suppressContentEditableWarning" && k !== "suppressHydrationWarning" && (I.hasOwnProperty(k) ? (Y != null && Wn(a, k), e || Z === Y || (e = [])) : (e = e || []).push(k, Y));
            }
            n && (e = e || []).push("style", n), a = e, (t.updateQueue = a) && (t.effectTag |= 4);
          }
        }, vl = function(e, t, n, o) {
          n !== o && (t.effectTag |= 4);
        };
        var Cc = typeof WeakSet == "function" ? WeakSet : Set;
        function cs(e, t) {
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
          throw Error(g(163));
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
                var o = e.next;
                Br(97 < n ? 97 : n, function() {
                  var a = o;
                  do {
                    var h = a.destroy;
                    if (h !== void 0) {
                      var k = t;
                      try {
                        h();
                      } catch (T) {
                        vo(k, T);
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
                } catch (k) {
                  vo(a, k);
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
            throw Error(g(160));
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
          o ? function a(h, k, T) {
            var Z = h.tag, Y = Z === 5 || Z === 6;
            if (Y) h = Y ? h.stateNode : h.stateNode.instance, k ? T.nodeType === 8 ? T.parentNode.insertBefore(h, k) : T.insertBefore(h, k) : (T.nodeType === 8 ? (k = T.parentNode).insertBefore(h, T) : (k = T).appendChild(h), (T = T._reactRootContainer) !== null && T !== void 0 || k.onclick !== null || (k.onclick = Po));
            else if (Z !== 4 && (h = h.child) !== null) for (a(h, k, T), h = h.sibling; h !== null; ) a(h, k, T), h = h.sibling;
          }(e, n, t) : function a(h, k, T) {
            var Z = h.tag, Y = Z === 5 || Z === 6;
            if (Y) h = Y ? h.stateNode : h.stateNode.instance, k ? T.insertBefore(h, k) : T.appendChild(h);
            else if (Z !== 4 && (h = h.child) !== null) for (a(h, k, T), h = h.sibling; h !== null; ) a(h, k, T), h = h.sibling;
          }(e, n, t);
        }
        function Nl(e, t, n) {
          for (var o, a, h = t, k = !1; ; ) {
            if (!k) {
              k = h.return;
              e: for (; ; ) {
                if (k === null) throw Error(g(160));
                switch (o = k.stateNode, k.tag) {
                  case 5:
                    a = !1;
                    break e;
                  case 3:
                  case 4:
                    o = o.containerInfo, a = !0;
                    break e;
                }
                k = k.return;
              }
              k = !0;
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
              (h = h.return).tag === 4 && (k = !1);
            }
            h.sibling.return = h.return, h = h.sibling;
          }
        }
        function us(e, t) {
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
                  for (n[ro] = o, e === "input" && o.type === "radio" && o.name != null && Tr(n, o), Qo(e, a), t = Qo(e, o), a = 0; a < h.length; a += 2) {
                    var k = h[a], T = h[a + 1];
                    k === "style" ? Si(n, T) : k === "dangerouslySetInnerHTML" ? Ye(n, T) : k === "children" ? st(n, T) : je(n, k, T, t);
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
              if (t.stateNode === null) throw Error(g(162));
              return void (t.stateNode.nodeValue = t.memoizedProps);
            case 3:
              return void ((t = t.stateNode).hydrate && (t.hydrate = !1, pr(t.containerInfo)));
            case 12:
              return;
            case 13:
              if (n = t, t.memoizedState === null ? o = !1 : (o = !0, n = t.child, ds = jn()), n !== null) e: for (e = n; ; ) {
                if (e.tag === 5) h = e.stateNode, o ? typeof (h = h.style).setProperty == "function" ? h.setProperty("display", "none", "important") : h.display = "none" : (h = e.stateNode, a = (a = e.memoizedProps.style) != null && a.hasOwnProperty("display") ? a.display : null, h.style.display = xi("display", a));
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
              return void Rl(t);
            case 19:
              return void Rl(t);
            case 17:
              return;
          }
          throw Error(g(163));
        }
        function Rl(e) {
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
        function Dl(e, t, n) {
          (n = Wr(n, null)).tag = 3, n.payload = { element: null };
          var o = t.value;
          return n.callback = function() {
            ma || (ma = !0, fs = o), cs(e, t);
          }, n;
        }
        function Al(e, t, n) {
          (n = Wr(n, null)).tag = 3;
          var o = e.type.getDerivedStateFromError;
          if (typeof o == "function") {
            var a = t.value;
            n.payload = function() {
              return cs(e, t), o(a);
            };
          }
          var h = e.stateNode;
          return h !== null && typeof h.componentDidCatch == "function" && (n.callback = function() {
            typeof o != "function" && (Yr === null ? Yr = /* @__PURE__ */ new Set([this]) : Yr.add(this), cs(e, t));
            var k = t.stack;
            this.componentDidCatch(t.value, { componentStack: k !== null ? k : "" });
          }), n;
        }
        var Il, Nc = Math.ceil, ca = he.ReactCurrentDispatcher, Ml = he.ReactCurrentOwner, ho = 0, ua = 3, da = 4, Qe = 0, _n = null, Ge = null, mn = 0, Ft = ho, fa = null, kr = 1073741823, fi = 1073741823, pa = null, pi = 0, ha = !1, ds = 0, Ie = null, ma = !1, fs = null, Yr = null, ga = !1, hi = null, mi = 90, mo = null, gi = 0, ps = null, ya = 0;
        function nr() {
          return (48 & Qe) != 0 ? 1073741821 - (jn() / 10 | 0) : ya !== 0 ? ya : ya = 1073741821 - (jn() / 10 | 0);
        }
        function go(e, t, n) {
          if ((2 & (t = t.mode)) == 0) return 1073741823;
          var o = Hi();
          if ((4 & t) == 0) return o === 99 ? 1073741823 : 1073741822;
          if ((16 & Qe) != 0) return mn;
          if (n !== null) e = $i(e, 0 | n.timeoutMs || 5e3, 250);
          else switch (o) {
            case 99:
              e = 1073741823;
              break;
            case 98:
              e = $i(e, 150, 100);
              break;
            case 97:
            case 96:
              e = $i(e, 5e3, 250);
              break;
            case 95:
              e = 2;
              break;
            default:
              throw Error(g(326));
          }
          return _n !== null && e === mn && --e, e;
        }
        function Kr(e, t) {
          if (50 < gi) throw gi = 0, ps = null, Error(g(185));
          if ((e = ba(e, t)) !== null) {
            var n = Hi();
            t === 1073741823 ? (8 & Qe) != 0 && (48 & Qe) == 0 ? hs(e) : (xn(e), Qe === 0 && Jn()) : xn(e), (4 & Qe) == 0 || n !== 98 && n !== 99 || (mo === null ? mo = /* @__PURE__ */ new Map([[e, t]]) : ((n = mo.get(e)) === void 0 || n > t) && mo.set(e, t));
          }
        }
        function ba(e, t) {
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
          return a !== null && (_n === a && (ka(t), Ft === da && wo(a, mn)), ql(a, t)), a;
        }
        function va(e) {
          var t = e.lastExpiredTime;
          if (t !== 0 || !$l(e, t = e.firstPendingTime)) return t;
          var n = e.lastPingedTime;
          return 2 >= (e = n > (e = e.nextKnownPendingLevel) ? n : e) && t !== e ? 0 : e;
        }
        function xn(e) {
          if (e.lastExpiredTime !== 0) e.callbackExpirationTime = 1073741823, e.callbackPriority = 99, e.callbackNode = Ws(hs.bind(null, e));
          else {
            var t = va(e), n = e.callbackNode;
            if (t === 0) n !== null && (e.callbackNode = null, e.callbackExpirationTime = 0, e.callbackPriority = 90);
            else {
              var o = nr();
              if (t === 1073741823 ? o = 99 : t === 1 || t === 2 ? o = 95 : o = 0 >= (o = 10 * (1073741821 - t) - 10 * (1073741821 - o)) ? 99 : 250 >= o ? 98 : 5250 >= o ? 97 : 95, n !== null) {
                var a = e.callbackPriority;
                if (e.callbackExpirationTime === t && a >= o) return;
                n !== Us && As(n);
              }
              e.callbackExpirationTime = t, e.callbackPriority = o, t = t === 1073741823 ? Ws(hs.bind(null, e)) : Vs(o, jl.bind(null, e), { timeout: 10 * (1073741821 - t) - jn() }), e.callbackNode = t;
            }
          }
        }
        function jl(e, t) {
          if (ya = 0, t) return ws(e, t = nr()), xn(e), null;
          var n = va(e);
          if (n !== 0) {
            if (t = e.callbackNode, (48 & Qe) != 0) throw Error(g(327));
            if ($o(), e === _n && n === mn || yo(e, n), Ge !== null) {
              var o = Qe;
              Qe |= 16;
              for (var a = Fl(); ; ) try {
                Dc();
                break;
              } catch (T) {
                Ul(e, T);
              }
              if (Ua(), Qe = o, ca.current = a, Ft === 1) throw t = fa, yo(e, n), wo(e, n), xn(e), t;
              if (Ge === null) switch (a = e.finishedWork = e.current.alternate, e.finishedExpirationTime = n, o = Ft, _n = null, o) {
                case ho:
                case 1:
                  throw Error(g(345));
                case 2:
                  ws(e, 2 < n ? 2 : n);
                  break;
                case ua:
                  if (wo(e, n), n === (o = e.lastSuspendedTime) && (e.nextKnownPendingLevel = ms(a)), kr === 1073741823 && 10 < (a = ds + 500 - jn())) {
                    if (ha) {
                      var h = e.lastPingedTime;
                      if (h === 0 || h >= n) {
                        e.lastPingedTime = n, yo(e, n);
                        break;
                      }
                    }
                    if ((h = va(e)) !== 0 && h !== n) break;
                    if (o !== 0 && o !== n) {
                      e.lastPingedTime = o;
                      break;
                    }
                    e.timeoutHandle = ti(bo.bind(null, e), a);
                    break;
                  }
                  bo(e);
                  break;
                case da:
                  if (wo(e, n), n === (o = e.lastSuspendedTime) && (e.nextKnownPendingLevel = ms(a)), ha && ((a = e.lastPingedTime) === 0 || a >= n)) {
                    e.lastPingedTime = n, yo(e, n);
                    break;
                  }
                  if ((a = va(e)) !== 0 && a !== n) break;
                  if (o !== 0 && o !== n) {
                    e.lastPingedTime = o;
                    break;
                  }
                  if (fi !== 1073741823 ? o = 10 * (1073741821 - fi) - jn() : kr === 1073741823 ? o = 0 : (o = 10 * (1073741821 - kr) - 5e3, 0 > (o = (a = jn()) - o) && (o = 0), (n = 10 * (1073741821 - n) - a) < (o = (120 > o ? 120 : 480 > o ? 480 : 1080 > o ? 1080 : 1920 > o ? 1920 : 3e3 > o ? 3e3 : 4320 > o ? 4320 : 1960 * Nc(o / 1960)) - o) && (o = n)), 10 < o) {
                    e.timeoutHandle = ti(bo.bind(null, e), o);
                    break;
                  }
                  bo(e);
                  break;
                case 5:
                  if (kr !== 1073741823 && pa !== null) {
                    h = kr;
                    var k = pa;
                    if (0 >= (o = 0 | k.busyMinDurationMs) ? o = 0 : (a = 0 | k.busyDelayMs, o = (h = jn() - (10 * (1073741821 - h) - (0 | k.timeoutMs || 5e3))) <= a ? 0 : a + o - h), 10 < o) {
                      wo(e, n), e.timeoutHandle = ti(bo.bind(null, e), o);
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
        function hs(e) {
          var t = e.lastExpiredTime;
          if (t = t !== 0 ? t : 1073741823, (48 & Qe) != 0) throw Error(g(327));
          if ($o(), e === _n && t === mn || yo(e, t), Ge !== null) {
            var n = Qe;
            Qe |= 16;
            for (var o = Fl(); ; ) try {
              Rc();
              break;
            } catch (a) {
              Ul(e, a);
            }
            if (Ua(), Qe = n, ca.current = o, Ft === 1) throw n = fa, yo(e, t), wo(e, t), xn(e), n;
            if (Ge !== null) throw Error(g(261));
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
        function yo(e, t) {
          e.finishedWork = null, e.finishedExpirationTime = 0;
          var n = e.timeoutHandle;
          if (n !== -1 && (e.timeoutHandle = -1, Di(n)), Ge !== null) for (n = Ge.return; n !== null; ) {
            var o = n;
            switch (o.tag) {
              case 1:
                (o = o.type.childContextTypes) != null && Fi();
                break;
              case 3:
                Vo(), vt(pn), vt(Xt);
                break;
              case 5:
                qa(o);
                break;
              case 4:
                Vo();
                break;
              case 13:
              case 19:
                vt(Ct);
                break;
              case 10:
                Fa(o);
            }
            n = n.return;
          }
          _n = e, Ge = ko(e.current, null), mn = t, Ft = ho, fa = null, fi = kr = 1073741823, pa = null, pi = 0, ha = !1;
        }
        function Ul(e, t) {
          for (; ; ) {
            try {
              if (Ua(), ea.current = aa, ta) for (var n = Lt.memoizedState; n !== null; ) {
                var o = n.queue;
                o !== null && (o.pending = null), n = n.next;
              }
              if ($r = 0, Zt = sn = Lt = null, ta = !1, Ge === null || Ge.return === null) return Ft = 1, fa = t, Ge = null;
              e: {
                var a = e, h = Ge.return, k = Ge, T = t;
                if (t = mn, k.effectTag |= 2048, k.firstEffect = k.lastEffect = null, T !== null && typeof T == "object" && typeof T.then == "function") {
                  var Z = T;
                  if ((2 & k.mode) == 0) {
                    var Y = k.alternate;
                    Y ? (k.updateQueue = Y.updateQueue, k.memoizedState = Y.memoizedState, k.expirationTime = Y.expirationTime) : (k.updateQueue = null, k.memoizedState = null);
                  }
                  var ge = (1 & Ct.current) != 0, Re = h;
                  do {
                    var We;
                    if (We = Re.tag === 13) {
                      var ot = Re.memoizedState;
                      if (ot !== null) We = ot.dehydrated !== null;
                      else {
                        var Fn = Re.memoizedProps;
                        We = Fn.fallback !== void 0 && (Fn.unstable_avoidThisFallback !== !0 || !ge);
                      }
                    }
                    if (We) {
                      var ln = Re.updateQueue;
                      if (ln === null) {
                        var oe = /* @__PURE__ */ new Set();
                        oe.add(Z), Re.updateQueue = oe;
                      } else ln.add(Z);
                      if ((2 & Re.mode) == 0) {
                        if (Re.effectTag |= 64, k.effectTag &= -2981, k.tag === 1) if (k.alternate === null) k.tag = 17;
                        else {
                          var te = Wr(1073741823, null);
                          te.tag = 2, Hr(k, te);
                        }
                        k.expirationTime = 1073741823;
                        break e;
                      }
                      T = void 0, k = t;
                      var ue = a.pingCache;
                      if (ue === null ? (ue = a.pingCache = new Pc(), T = /* @__PURE__ */ new Set(), ue.set(Z, T)) : (T = ue.get(Z)) === void 0 && (T = /* @__PURE__ */ new Set(), ue.set(Z, T)), !T.has(k)) {
                        T.add(k);
                        var ve = jc.bind(null, a, Z, k);
                        Z.then(ve, ve);
                      }
                      Re.effectTag |= 4096, Re.expirationTime = t;
                      break e;
                    }
                    Re = Re.return;
                  } while (Re !== null);
                  T = Error((qt(k.type) || "A React component") + ` suspended while rendering, but no fallback UI was specified.

Add a <Suspense fallback=...> component higher in the tree to provide a loading indicator or placeholder to display.` + xr(k));
                }
                Ft !== 5 && (Ft = 2), T = ls(T, k), Re = h;
                do {
                  switch (Re.tag) {
                    case 3:
                      Z = T, Re.effectTag |= 4096, Re.expirationTime = t, qs(Re, Dl(Re, Z, t));
                      break e;
                    case 1:
                      Z = T;
                      var _e = Re.type, Oe = Re.stateNode;
                      if ((64 & Re.effectTag) == 0 && (typeof _e.getDerivedStateFromError == "function" || Oe !== null && typeof Oe.componentDidCatch == "function" && (Yr === null || !Yr.has(Oe)))) {
                        Re.effectTag |= 4096, Re.expirationTime = t, qs(Re, Al(Re, Z, t));
                        break e;
                      }
                  }
                  Re = Re.return;
                } while (Re !== null);
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
          var e = ca.current;
          return ca.current = aa, e === null ? aa : e;
        }
        function Bl(e, t) {
          e < kr && 2 < e && (kr = e), t !== null && e < fi && 2 < e && (fi = e, pa = t);
        }
        function ka(e) {
          e > pi && (pi = e);
        }
        function Rc() {
          for (; Ge !== null; ) Ge = Vl(Ge);
        }
        function Dc() {
          for (; Ge !== null && !bc(); ) Ge = Vl(Ge);
        }
        function Vl(e) {
          var t = Il(e.alternate, e, mn);
          return e.memoizedProps = e.pendingProps, t === null && (t = Wl(e)), Ml.current = null, t;
        }
        function Wl(e) {
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
        function ms(e) {
          var t = e.expirationTime;
          return t > (e = e.childExpirationTime) ? t : e;
        }
        function bo(e) {
          var t = Hi();
          return Br(99, Ac.bind(null, e, t)), null;
        }
        function Ac(e, t) {
          do
            $o();
          while (hi !== null);
          if ((48 & Qe) != 0) throw Error(g(327));
          var n = e.finishedWork, o = e.finishedExpirationTime;
          if (n === null) return null;
          if (e.finishedWork = null, e.finishedExpirationTime = 0, n === e.current) throw Error(g(177));
          e.callbackNode = null, e.callbackExpirationTime = 0, e.callbackPriority = 90, e.nextKnownPendingLevel = 0;
          var a = ms(n);
          if (e.firstPendingTime = a, o <= e.lastSuspendedTime ? e.firstSuspendedTime = e.lastSuspendedTime = e.nextKnownPendingLevel = 0 : o <= e.firstSuspendedTime && (e.firstSuspendedTime = o - 1), o <= e.lastPingedTime && (e.lastPingedTime = 0), o <= e.lastExpiredTime && (e.lastExpiredTime = 0), e === _n && (Ge = _n = null, mn = 0), 1 < n.effectTag ? n.lastEffect !== null ? (n.lastEffect.nextEffect = n, a = n.firstEffect) : a = n : a = n.firstEffect, a !== null) {
            var h = Qe;
            Qe |= 32, Ml.current = null, Zo = To;
            var k = Ni();
            if (Xo(k)) {
              if ("selectionStart" in k) var T = { start: k.selectionStart, end: k.selectionEnd };
              else e: {
                var Z = (T = (T = k.ownerDocument) && T.defaultView || window).getSelection && T.getSelection();
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
                  var Re = 0, We = -1, ot = -1, Fn = 0, ln = 0, oe = k, te = null;
                  t: for (; ; ) {
                    for (var ue; oe !== T || Y !== 0 && oe.nodeType !== 3 || (We = Re + Y), oe !== ge || Z !== 0 && oe.nodeType !== 3 || (ot = Re + Z), oe.nodeType === 3 && (Re += oe.nodeValue.length), (ue = oe.firstChild) !== null; ) te = oe, oe = ue;
                    for (; ; ) {
                      if (oe === k) break t;
                      if (te === T && ++Fn === Y && (We = Re), te === ge && ++ln === Z && (ot = Re), (ue = oe.nextSibling) !== null) break;
                      te = (oe = te).parentNode;
                    }
                    oe = ue;
                  }
                  T = We === -1 || ot === -1 ? null : { start: We, end: ot };
                } else T = null;
              }
              T = T || { start: 0, end: 0 };
            } else T = null;
            Jo = { activeElementDetached: null, focusedElem: k, selectionRange: T }, To = !1, Ie = a;
            do
              try {
                Ic();
              } catch (Ze) {
                if (Ie === null) throw Error(g(330));
                vo(Ie, Ze), Ie = Ie.nextEffect;
              }
            while (Ie !== null);
            Ie = a;
            do
              try {
                for (k = e, T = t; Ie !== null; ) {
                  var ve = Ie.effectTag;
                  if (16 & ve && st(Ie.stateNode, ""), 128 & ve) {
                    var _e = Ie.alternate;
                    if (_e !== null) {
                      var Oe = _e.ref;
                      Oe !== null && (typeof Oe == "function" ? Oe(null) : Oe.current = null);
                    }
                  }
                  switch (1038 & ve) {
                    case 2:
                      Pl(Ie), Ie.effectTag &= -3;
                      break;
                    case 6:
                      Pl(Ie), Ie.effectTag &= -3, us(Ie.alternate, Ie);
                      break;
                    case 1024:
                      Ie.effectTag &= -1025;
                      break;
                    case 1028:
                      Ie.effectTag &= -1025, us(Ie.alternate, Ie);
                      break;
                    case 4:
                      us(Ie.alternate, Ie);
                      break;
                    case 8:
                      Nl(k, Y = Ie, T), Tl(Y);
                  }
                  Ie = Ie.nextEffect;
                }
              } catch (Ze) {
                if (Ie === null) throw Error(g(330));
                vo(Ie, Ze), Ie = Ie.nextEffect;
              }
            while (Ie !== null);
            if (Oe = Jo, _e = Ni(), ve = Oe.focusedElem, T = Oe.selectionRange, _e !== ve && ve && ve.ownerDocument && function Ze(Bt, wr) {
              return !(!Bt || !wr) && (Bt === wr || (!Bt || Bt.nodeType !== 3) && (wr && wr.nodeType === 3 ? Ze(Bt, wr.parentNode) : "contains" in Bt ? Bt.contains(wr) : !!Bt.compareDocumentPosition && !!(16 & Bt.compareDocumentPosition(wr))));
            }(ve.ownerDocument.documentElement, ve)) {
              for (T !== null && Xo(ve) && (_e = T.start, (Oe = T.end) === void 0 && (Oe = _e), "selectionStart" in ve ? (ve.selectionStart = _e, ve.selectionEnd = Math.min(Oe, ve.value.length)) : (Oe = (_e = ve.ownerDocument || document) && _e.defaultView || window).getSelection && (Oe = Oe.getSelection(), Y = ve.textContent.length, k = Math.min(T.start, Y), T = T.end === void 0 ? k : Math.min(T.end, Y), !Oe.extend && k > T && (Y = T, T = k, k = Y), Y = Pi(ve, k), ge = Pi(ve, T), Y && ge && (Oe.rangeCount !== 1 || Oe.anchorNode !== Y.node || Oe.anchorOffset !== Y.offset || Oe.focusNode !== ge.node || Oe.focusOffset !== ge.offset) && ((_e = _e.createRange()).setStart(Y.node, Y.offset), Oe.removeAllRanges(), k > T ? (Oe.addRange(_e), Oe.extend(ge.node, ge.offset)) : (_e.setEnd(ge.node, ge.offset), Oe.addRange(_e))))), _e = [], Oe = ve; Oe = Oe.parentNode; ) Oe.nodeType === 1 && _e.push({ element: Oe, left: Oe.scrollLeft, top: Oe.scrollTop });
              for (typeof ve.focus == "function" && ve.focus(), ve = 0; ve < _e.length; ve++) (Oe = _e[ve]).element.scrollLeft = Oe.left, Oe.element.scrollTop = Oe.top;
            }
            To = !!Zo, Jo = Zo = null, e.current = n, Ie = a;
            do
              try {
                for (ve = e; Ie !== null; ) {
                  var Be = Ie.effectTag;
                  if (36 & Be && Oc(ve, Ie.alternate, Ie), 128 & Be) {
                    _e = void 0;
                    var at = Ie.ref;
                    if (at !== null) {
                      var Dt = Ie.stateNode;
                      switch (Ie.tag) {
                        case 5:
                          _e = Dt;
                          break;
                        default:
                          _e = Dt;
                      }
                      typeof at == "function" ? at(_e) : at.current = _e;
                    }
                  }
                  Ie = Ie.nextEffect;
                }
              } catch (Ze) {
                if (Ie === null) throw Error(g(330));
                vo(Ie, Ze), Ie = Ie.nextEffect;
              }
            while (Ie !== null);
            Ie = null, vc(), Qe = h;
          } else e.current = n;
          if (ga) ga = !1, hi = e, mi = t;
          else for (Ie = a; Ie !== null; ) t = Ie.nextEffect, Ie.nextEffect = null, Ie = t;
          if ((t = e.firstPendingTime) === 0 && (Yr = null), t === 1073741823 ? e === ps ? gi++ : (gi = 0, ps = e) : gi = 0, typeof gs == "function" && gs(n.stateNode, o), xn(e), ma) throw ma = !1, e = fs, fs = null, e;
          return (8 & Qe) != 0 || Jn(), null;
        }
        function Ic() {
          for (; Ie !== null; ) {
            var e = Ie.effectTag;
            (256 & e) != 0 && Tc(Ie.alternate, Ie), (512 & e) == 0 || ga || (ga = !0, Vs(97, function() {
              return $o(), null;
            })), Ie = Ie.nextEffect;
          }
        }
        function $o() {
          if (mi !== 90) {
            var e = 97 < mi ? 97 : mi;
            return mi = 90, Br(e, Mc);
          }
        }
        function Mc() {
          if (hi === null) return !1;
          var e = hi;
          if (hi = null, (48 & Qe) != 0) throw Error(g(331));
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
              if (e === null) throw Error(g(330));
              vo(e, o);
            }
            n = e.nextEffect, e.nextEffect = null, e = n;
          }
          return Qe = t, Jn(), !0;
        }
        function Hl(e, t, n) {
          Hr(e, t = Dl(e, t = ls(n, t), 1073741823)), (e = ba(e, 1073741823)) !== null && xn(e);
        }
        function vo(e, t) {
          if (e.tag === 3) Hl(e, e, t);
          else for (var n = e.return; n !== null; ) {
            if (n.tag === 3) {
              Hl(n, e, t);
              break;
            }
            if (n.tag === 1) {
              var o = n.stateNode;
              if (typeof n.type.getDerivedStateFromError == "function" || typeof o.componentDidCatch == "function" && (Yr === null || !Yr.has(o))) {
                Hr(n, e = Al(n, e = ls(t, e), 1073741823)), (n = ba(n, 1073741823)) !== null && xn(n);
                break;
              }
            }
            n = n.return;
          }
        }
        function jc(e, t, n) {
          var o = e.pingCache;
          o !== null && o.delete(t), _n === e && mn === n ? Ft === da || Ft === ua && kr === 1073741823 && jn() - ds < 500 ? yo(e, mn) : ha = !0 : $l(e, n) && ((t = e.lastPingedTime) !== 0 && t < n || (e.lastPingedTime = n, xn(e)));
        }
        function zc(e, t) {
          var n = e.stateNode;
          n !== null && n.delete(t), (t = 0) == 0 && (t = go(t = nr(), e, null)), (e = ba(e, t)) !== null && xn(e);
        }
        Il = function(e, t, n) {
          var o = t.expirationTime;
          if (e !== null) {
            var a = t.pendingProps;
            if (e.memoizedProps !== a || pn.current) tr = !0;
            else {
              if (o < n) {
                switch (tr = !1, t.tag) {
                  case 3:
                    gl(t), rs();
                    break;
                  case 5:
                    if (Js(t), 4 & t.mode && n !== 1 && a.hidden) return t.expirationTime = t.childExpirationTime = 1, null;
                    break;
                  case 1:
                    hn(t.type) && Bi(t);
                    break;
                  case 4:
                    $a(t, t.stateNode.containerInfo);
                    break;
                  case 10:
                    o = t.memoizedProps.value, a = t.type._context, St(qi, a._currentValue), a._currentValue = o;
                    break;
                  case 13:
                    if (t.memoizedState !== null) return (o = t.child.childExpirationTime) !== 0 && o >= n ? kl(e, t, n) : (St(Ct, 1 & Ct.current), (t = vr(e, t, n)) !== null ? t.sibling : null);
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
              if (o = t.type, e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= 2), e = t.pendingProps, a = Lo(t, Xt.current), Fo(t, n), a = Qa(null, t, o, e, a, n), t.effectTag |= 1, typeof a == "object" && a !== null && typeof a.render == "function" && a.$$typeof === void 0) {
                if (t.tag = 1, t.memoizedState = null, t.updateQueue = null, hn(o)) {
                  var h = !0;
                  Bi(t);
                } else h = !1;
                t.memoizedState = a.state !== null && a.state !== void 0 ? a.state : null, Ba(t);
                var k = o.getDerivedStateFromProps;
                typeof k == "function" && Qi(t, o, k, e), a.updater = Gi, t.stateNode = a, a._reactInternalFiber = t, Wa(t, o, e, n), t = is(null, t, o, !0, h, n);
              } else t.tag = 0, Un(null, t, a, n), t = t.child;
              return t;
            case 16:
              e: {
                if (a = t.elementType, e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= 2), e = t.pendingProps, function(ge) {
                  if (ge._status === -1) {
                    ge._status = 0;
                    var Re = ge._ctor;
                    Re = Re(), ge._result = Re, Re.then(function(We) {
                      ge._status === 0 && (We = We.default, ge._status = 1, ge._result = We);
                    }, function(We) {
                      ge._status === 0 && (ge._status = 2, ge._result = We);
                    });
                  }
                }(a), a._status !== 1) throw a._result;
                switch (a = a._result, t.type = a, h = t.tag = function(ge) {
                  if (typeof ge == "function") return bs(ge) ? 1 : 0;
                  if (ge != null) {
                    if ((ge = ge.$$typeof) === Tt) return 11;
                    if (ge === Sn) return 14;
                  }
                  return 2;
                }(a), e = $n(a, e), h) {
                  case 0:
                    t = os(null, t, a, e, n);
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
                throw Error(g(306, a, ""));
              }
              return t;
            case 0:
              return o = t.type, a = t.pendingProps, os(e, t, o, a = t.elementType === o ? a : $n(o, a), n);
            case 1:
              return o = t.type, a = t.pendingProps, ml(e, t, o, a = t.elementType === o ? a : $n(o, a), n);
            case 3:
              if (gl(t), o = t.updateQueue, e === null || o === null) throw Error(g(282));
              if (o = t.pendingProps, a = (a = t.memoizedState) !== null ? a.element : null, Va(e, t), ai(t, o, null, n), (o = t.memoizedState.element) === a) rs(), t = vr(e, t, n);
              else {
                if ((a = t.stateNode.hydrate) && (qr = Ir(t.stateNode.containerInfo.firstChild), br = t, a = po = !0), a) for (n = Ha(t, null, o, n), t.child = n; n; ) n.effectTag = -3 & n.effectTag | 1024, n = n.sibling;
                else Un(e, t, o, n), rs();
                t = t.child;
              }
              return t;
            case 5:
              return Js(t), e === null && ns(t), o = t.type, a = t.pendingProps, h = e !== null ? e.memoizedProps : null, k = a.children, ei(o, a) ? k = null : h !== null && ei(o, h) && (t.effectTag |= 16), hl(e, t), 4 & t.mode && n !== 1 && a.hidden ? (t.expirationTime = t.childExpirationTime = 1, t = null) : (Un(e, t, k, n), t = t.child), t;
            case 6:
              return e === null && ns(t), null;
            case 13:
              return kl(e, t, n);
            case 4:
              return $a(t, t.stateNode.containerInfo), o = t.pendingProps, e === null ? t.child = Bo(t, null, o, n) : Un(e, t, o, n), t.child;
            case 11:
              return o = t.type, a = t.pendingProps, dl(e, t, o, a = t.elementType === o ? a : $n(o, a), n);
            case 7:
              return Un(e, t, t.pendingProps, n), t.child;
            case 8:
            case 12:
              return Un(e, t, t.pendingProps.children, n), t.child;
            case 10:
              e: {
                o = t.type._context, a = t.pendingProps, k = t.memoizedProps, h = a.value;
                var T = t.type._context;
                if (St(qi, T._currentValue), T._currentValue = h, k !== null) if (T = k.value, (h = mr(T, h) ? 0 : 0 | (typeof o._calculateChangedBits == "function" ? o._calculateChangedBits(T, h) : 1073741823)) === 0) {
                  if (k.children === a.children && !pn.current) {
                    t = vr(e, t, n);
                    break e;
                  }
                } else for ((T = t.child) !== null && (T.return = t); T !== null; ) {
                  var Z = T.dependencies;
                  if (Z !== null) {
                    k = T.child;
                    for (var Y = Z.firstContext; Y !== null; ) {
                      if (Y.context === o && (Y.observedBits & h) != 0) {
                        T.tag === 1 && ((Y = Wr(n, null)).tag = 2, Hr(T, Y)), T.expirationTime < n && (T.expirationTime = n), (Y = T.alternate) !== null && Y.expirationTime < n && (Y.expirationTime = n), $s(T.return, n), Z.expirationTime < n && (Z.expirationTime = n);
                        break;
                      }
                      Y = Y.next;
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
              return a = t.type, o = (h = t.pendingProps).children, Fo(t, n), o = o(a = zn(a, h.unstable_observedBits)), t.effectTag |= 1, Un(e, t, o, n), t.child;
            case 14:
              return h = $n(a = t.type, t.pendingProps), fl(e, t, a, h = $n(a.type, h), o, n);
            case 15:
              return pl(e, t, t.type, t.pendingProps, o, n);
            case 17:
              return o = t.type, a = t.pendingProps, a = t.elementType === o ? a : $n(o, a), e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= 2), t.tag = 1, hn(o) ? (e = !0, Bi(t)) : e = !1, Fo(t, n), Gs(t, o, a), Wa(t, o, a, n), is(null, t, o, !0, e, n);
            case 19:
              return El(e, t, n);
          }
          throw Error(g(156, t.tag));
        };
        var gs = null, ys = null;
        function Lc(e, t, n, o) {
          this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = o, this.effectTag = 0, this.lastEffect = this.firstEffect = this.nextEffect = null, this.childExpirationTime = this.expirationTime = 0, this.alternate = null;
        }
        function rr(e, t, n, o) {
          return new Lc(e, t, n, o);
        }
        function bs(e) {
          return !(!(e = e.prototype) || !e.isReactComponent);
        }
        function ko(e, t) {
          var n = e.alternate;
          return n === null ? ((n = rr(e.tag, t, e.key, e.mode)).elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.effectTag = 0, n.nextEffect = null, n.firstEffect = null, n.lastEffect = null), n.childExpirationTime = e.childExpirationTime, n.expirationTime = e.expirationTime, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : { expirationTime: t.expirationTime, firstContext: t.firstContext, responders: t.responders }, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n;
        }
        function wa(e, t, n, o, a, h) {
          var k = 2;
          if (o = e, typeof e == "function") bs(e) && (k = 1);
          else if (typeof e == "string") k = 5;
          else e: switch (e) {
            case kt:
              return Qr(n.children, a, h, t);
            case Er:
              k = 8, a |= 7;
              break;
            case Jt:
              k = 8, a |= 1;
              break;
            case wt:
              return (e = rr(12, n, t, 8 | a)).elementType = wt, e.type = wt, e.expirationTime = h, e;
            case pt:
              return (e = rr(13, n, t, a)).type = pt, e.elementType = pt, e.expirationTime = h, e;
            case qn:
              return (e = rr(19, n, t, a)).elementType = qn, e.expirationTime = h, e;
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
                  k = 16, o = null;
                  break e;
                case _r:
                  k = 22;
                  break e;
              }
              throw Error(g(130, e == null ? e : typeof e, ""));
          }
          return (t = rr(k, n, t, a)).elementType = e, t.type = o, t.expirationTime = h, t;
        }
        function Qr(e, t, n, o) {
          return (e = rr(7, e, o, t)).expirationTime = n, e;
        }
        function vs(e, t, n) {
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
        function wo(e, t) {
          var n = e.firstSuspendedTime, o = e.lastSuspendedTime;
          n < t && (e.firstSuspendedTime = t), (o > t || n === 0) && (e.lastSuspendedTime = t), t <= e.lastPingedTime && (e.lastPingedTime = 0), t <= e.lastExpiredTime && (e.lastExpiredTime = 0);
        }
        function ql(e, t) {
          t > e.firstPendingTime && (e.firstPendingTime = t);
          var n = e.firstSuspendedTime;
          n !== 0 && (t >= n ? e.firstSuspendedTime = e.lastSuspendedTime = e.nextKnownPendingLevel = 0 : t >= e.lastSuspendedTime && (e.lastSuspendedTime = t + 1), t > e.nextKnownPendingLevel && (e.nextKnownPendingLevel = t));
        }
        function ws(e, t) {
          var n = e.lastExpiredTime;
          (n === 0 || n > t) && (e.lastExpiredTime = t);
        }
        function Ea(e, t, n, o) {
          var a = t.current, h = nr(), k = si.suspense;
          h = go(h, a, k);
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
                n = Rs(n, Z, T);
                break e;
              }
            }
            n = T;
          } else n = Fr;
          return t.context === null ? t.context = n : t.pendingContext = n, (t = Wr(h, k)).payload = { element: e }, (o = o === void 0 ? null : o) !== null && (t.callback = o), Hr(a, t), Kr(a, h), h;
        }
        function Es(e) {
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
        function _s(e, t) {
          Yl(e, t), (e = e.alternate) && Yl(e, t);
        }
        function xs(e, t, n) {
          var o = new Uc(e, t, n = n != null && n.hydrate === !0), a = rr(3, null, null, t === 2 ? 7 : t === 1 ? 3 : 0);
          o.current = a, a.stateNode = o, Ba(a), e[oo] = o.current, n && t !== 0 && function(h, k) {
            var T = un(k);
            Vn.forEach(function(Z) {
              bt(Z, k, T);
            }), Nt.forEach(function(Z) {
              bt(Z, k, T);
            });
          }(0, e.nodeType === 9 ? e : e.ownerDocument), this._internalRoot = o;
        }
        function yi(e) {
          return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11 && (e.nodeType !== 8 || e.nodeValue !== " react-mount-point-unstable "));
        }
        function _a(e, t, n, o, a) {
          var h = n._reactRootContainer;
          if (h) {
            var k = h._internalRoot;
            if (typeof a == "function") {
              var T = a;
              a = function() {
                var Y = Es(k);
                T.call(Y);
              };
            }
            Ea(t, k, e, a);
          } else {
            if (h = n._reactRootContainer = function(Y, ge) {
              if (ge || (ge = !(!(ge = Y ? Y.nodeType === 9 ? Y.documentElement : Y.firstChild : null) || ge.nodeType !== 1 || !ge.hasAttribute("data-reactroot"))), !ge) for (var Re; Re = Y.lastChild; ) Y.removeChild(Re);
              return new xs(Y, 0, ge ? { hydrate: !0 } : void 0);
            }(n, o), k = h._internalRoot, typeof a == "function") {
              var Z = a;
              a = function() {
                var Y = Es(k);
                Z.call(Y);
              };
            }
            Ll(function() {
              Ea(t, k, e, a);
            });
          }
          return Es(k);
        }
        function Fc(e, t, n) {
          var o = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
          return { $$typeof: At, key: o == null ? null : "" + o, children: e, containerInfo: t, implementation: n };
        }
        function Kl(e, t) {
          var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
          if (!yi(t)) throw Error(g(200));
          return Fc(e, t, null, n);
        }
        xs.prototype.render = function(e) {
          Ea(e, this._internalRoot, null, null);
        }, xs.prototype.unmount = function() {
          var e = this._internalRoot, t = e.containerInfo;
          Ea(null, e, null, function() {
            t[oo] = null;
          });
        }, Et = function(e) {
          if (e.tag === 13) {
            var t = $i(nr(), 150, 100);
            Kr(e, t), _s(e, t);
          }
        }, ur = function(e) {
          e.tag === 13 && (Kr(e, 3), _s(e, 3));
        }, dr = function(e) {
          if (e.tag === 13) {
            var t = nr();
            Kr(e, t = go(t, e, null)), _s(e, t);
          }
        }, ce = function(e, t, n) {
          switch (t) {
            case "input":
              if (ir(e, n), t = n.name, n.type === "radio" && t != null) {
                for (n = e; n.parentNode; ) n = n.parentNode;
                for (n = n.querySelectorAll("input[name=" + JSON.stringify("" + t) + '][type="radio"]'), t = 0; t < n.length; t++) {
                  var o = n[t];
                  if (o !== e && o.form === e.form) {
                    var a = ni(o);
                    if (!a) throw Error(g(90));
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
        }, ye = zl, Te = function(e, t, n, o, a) {
          var h = Qe;
          Qe |= 4;
          try {
            return Br(98, e.bind(null, t, n, o, a));
          } finally {
            (Qe = h) === 0 && Jn();
          }
        }, we = function() {
          (49 & Qe) == 0 && (function() {
            if (mo !== null) {
              var e = mo;
              mo = null, e.forEach(function(t, n) {
                ws(n, t), xn(n);
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
        var Ql, Ss, Bc = { Events: [io, Gn, ni, le, z, jr, function(e) {
          Yn(e, Ia);
        }, R, ie, Oo, It, $o, { current: !1 }] };
        Ss = (Ql = { findFiberByHostInstance: Mr, bundleType: 0, version: "16.14.0", rendererPackageName: "react-dom" }).findFiberByHostInstance, function(e) {
          if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u") return !1;
          var t = __REACT_DEVTOOLS_GLOBAL_HOOK__;
          if (t.isDisabled || !t.supportsFiber) return !0;
          try {
            var n = t.inject(e);
            gs = function(o) {
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
          return Ss ? Ss(e) : null;
        }, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null })), i.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Bc, i.createPortal = Kl, i.findDOMNode = function(e) {
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
            return Br(99, e.bind(null, t));
          } finally {
            Qe = n, Jn();
          }
        }, i.hydrate = function(e, t, n) {
          if (!yi(t)) throw Error(g(200));
          return _a(null, e, t, !0, n);
        }, i.render = function(e, t, n) {
          if (!yi(t)) throw Error(g(200));
          return _a(null, e, t, !1, n);
        }, i.unmountComponentAtNode = function(e) {
          if (!yi(e)) throw Error(g(40));
          return !!e._reactRootContainer && (Ll(function() {
            _a(null, null, e, !1, function() {
              e._reactRootContainer = null, e[oo] = null;
            });
          }), !0);
        }, i.unstable_batchedUpdates = zl, i.unstable_createPortal = function(e, t) {
          return Kl(e, t, 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null);
        }, i.unstable_renderSubtreeIntoContainer = function(e, t, n, o) {
          if (!yi(n)) throw Error(g(200));
          if (e == null || e._reactInternalFiber === void 0) throw Error(g(38));
          return _a(e, t, n, !1, o);
        }, i.version = "16.14.0";
      }, function(p, i, u) {
        p.exports = u(24);
      }, function(p, i, u) {
        var c, r, _, g, y;
        if (typeof window > "u" || typeof MessageChannel != "function") {
          var v = null, b = null, C = function() {
            if (v !== null) try {
              var q = i.unstable_now();
              v(!0, q), v = null;
            } catch (me) {
              throw setTimeout(C, 0), me;
            }
          }, x = Date.now();
          i.unstable_now = function() {
            return Date.now() - x;
          }, c = function(q) {
            v !== null ? setTimeout(c, 0, q) : (v = q, setTimeout(C, 0));
          }, r = function(q, me) {
            b = setTimeout(q, me);
          }, _ = function() {
            clearTimeout(b);
          }, g = function() {
            return !1;
          }, y = i.unstable_forceFrameRate = function() {
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
          var M = !1, V = null, A = -1, J = 5, Q = 0;
          g = function() {
            return i.unstable_now() >= Q;
          }, y = function() {
          }, i.unstable_forceFrameRate = function(q) {
            0 > q || 125 < q ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing framerates higher than 125 fps is not unsupported") : J = 0 < q ? Math.floor(1e3 / q) : 5;
          };
          var z = new MessageChannel(), I = z.port2;
          z.port1.onmessage = function() {
            if (V !== null) {
              var q = i.unstable_now();
              Q = q + J;
              try {
                V(!0, q) ? I.postMessage(null) : (M = !1, V = null);
              } catch (me) {
                throw I.postMessage(null), me;
              }
            } else M = !1;
          }, c = function(q) {
            V = q, M || (M = !0, I.postMessage(null));
          }, r = function(q, me) {
            A = K(function() {
              q(i.unstable_now());
            }, me);
          }, _ = function() {
            j(A), A = -1;
          };
        }
        function ae(q, me) {
          var l = q.length;
          q.push(me);
          e: for (; ; ) {
            var f = l - 1 >>> 1, w = q[f];
            if (!(w !== void 0 && 0 < ce(w, me))) break e;
            q[f] = me, q[l] = w, l = f;
          }
        }
        function le(q) {
          return (q = q[0]) === void 0 ? null : q;
        }
        function ne(q) {
          var me = q[0];
          if (me !== void 0) {
            var l = q.pop();
            if (l !== me) {
              q[0] = l;
              e: for (var f = 0, w = q.length; f < w; ) {
                var U = 2 * (f + 1) - 1, F = q[U], W = U + 1, he = q[W];
                if (F !== void 0 && 0 > ce(F, l)) he !== void 0 && 0 > ce(he, F) ? (q[f] = he, q[W] = l, f = W) : (q[f] = F, q[U] = l, f = U);
                else {
                  if (!(he !== void 0 && 0 > ce(he, l))) break e;
                  q[f] = he, q[W] = l, f = W;
                }
              }
            }
            return me;
          }
          return null;
        }
        function ce(q, me) {
          var l = q.sortIndex - me.sortIndex;
          return l !== 0 ? l : q.id - me.id;
        }
        var be = [], ee = [], de = 1, R = null, ie = 3, ye = !1, Te = !1, we = !1;
        function Pe(q) {
          for (var me = le(ee); me !== null; ) {
            if (me.callback === null) ne(ee);
            else {
              if (!(me.startTime <= q)) break;
              ne(ee), me.sortIndex = me.expirationTime, ae(be, me);
            }
            me = le(ee);
          }
        }
        function Se(q) {
          if (we = !1, Pe(q), !Te) if (le(be) !== null) Te = !0, c(ze);
          else {
            var me = le(ee);
            me !== null && r(Se, me.startTime - q);
          }
        }
        function ze(q, me) {
          Te = !1, we && (we = !1, _()), ye = !0;
          var l = ie;
          try {
            for (Pe(me), R = le(be); R !== null && (!(R.expirationTime > me) || q && !g()); ) {
              var f = R.callback;
              if (f !== null) {
                R.callback = null, ie = R.priorityLevel;
                var w = f(R.expirationTime <= me);
                me = i.unstable_now(), typeof w == "function" ? R.callback = w : R === le(be) && ne(be), Pe(me);
              } else ne(be);
              R = le(be);
            }
            if (R !== null) var U = !0;
            else {
              var F = le(ee);
              F !== null && r(Se, F.startTime - me), U = !1;
            }
            return U;
          } finally {
            R = null, ie = l, ye = !1;
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
        var X = y;
        i.unstable_IdlePriority = 5, i.unstable_ImmediatePriority = 1, i.unstable_LowPriority = 4, i.unstable_NormalPriority = 3, i.unstable_Profiling = null, i.unstable_UserBlockingPriority = 2, i.unstable_cancelCallback = function(q) {
          q.callback = null;
        }, i.unstable_continueExecution = function() {
          Te || ye || (Te = !0, c(ze));
        }, i.unstable_getCurrentPriorityLevel = function() {
          return ie;
        }, i.unstable_getFirstCallbackNode = function() {
          return le(be);
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
          var l = ie;
          ie = me;
          try {
            return q();
          } finally {
            ie = l;
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
          var l = ie;
          ie = q;
          try {
            return me();
          } finally {
            ie = l;
          }
        }, i.unstable_scheduleCallback = function(q, me, l) {
          var f = i.unstable_now();
          if (typeof l == "object" && l !== null) {
            var w = l.delay;
            w = typeof w == "number" && 0 < w ? f + w : f, l = typeof l.timeout == "number" ? l.timeout : Je(q);
          } else l = Je(q), w = f;
          return q = { id: de++, callback: me, priorityLevel: q, startTime: w, expirationTime: l = w + l, sortIndex: -1 }, w > f ? (q.sortIndex = w, ae(ee, q), le(be) === null && q === le(ee) && (we ? _() : we = !0, r(Se, w - f))) : (q.sortIndex = l, ae(be, q), Te || ye || (Te = !0, c(ze))), q;
        }, i.unstable_shouldYield = function() {
          var q = i.unstable_now();
          Pe(q);
          var me = le(be);
          return me !== R && R !== null && me !== null && me.callback !== null && me.startTime <= q && me.expirationTime < R.expirationTime || g();
        }, i.unstable_wrapCallback = function(q) {
          var me = ie;
          return function() {
            var l = ie;
            ie = me;
            try {
              return q.apply(this, arguments);
            } finally {
              ie = l;
            }
          };
        };
      }, function(p, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.toString = void 0;
        const c = u(13), r = u(26), _ = u(17), g = { string: c.quoteString, number: (y) => Object.is(y, -0) ? "-0" : String(y), boolean: String, symbol: (y, v, b) => {
          const C = Symbol.keyFor(y);
          return C !== void 0 ? `Symbol.for(${b(C)})` : `Symbol(${b(y.description)})`;
        }, bigint: (y, v, b) => `BigInt(${b(String(y))})`, undefined: String, object: r.objectToString, function: _.functionToString };
        i.toString = (y, v, b, C) => y === null ? "null" : g[typeof y](y, v, b, C);
      }, function(p, i, u) {
        (function(c, r) {
          Object.defineProperty(i, "__esModule", { value: !0 }), i.objectToString = void 0;
          const _ = u(13), g = u(17), y = u(31);
          i.objectToString = (C, x, N, G) => {
            if (typeof c == "function" && c.isBuffer(C)) return `Buffer.from(${N(C.toString("base64"))}, 'base64')`;
            if (typeof r == "object" && C === r) return v(C, x, N);
            const K = b[Object.prototype.toString.call(C)];
            return K ? K(C, x, N, G) : void 0;
          };
          const v = (C, x, N) => `Function(${N("return this")})()`, b = { "[object Array]": y.arrayToString, "[object Object]": (C, x, N, G) => {
            const K = x ? `
` : "", j = x ? " " : "", B = Object.keys(C).reduce(function(P, M) {
              const V = C[M], A = N(V, M);
              if (A === void 0) return P;
              const J = A.split(`
`).join(`
` + x);
              return g.USED_METHOD_KEY.has(V) ? (P.push(`${x}${J}`), P) : (P.push(`${x}${_.quoteKey(M, N)}:${j}${J}`), P);
            }, []).join("," + K);
            return B === "" ? "{}" : `{${K}${B}${K}}`;
          }, "[object Error]": (C, x, N) => `new Error(${N(C.message)})`, "[object Date]": (C) => `new Date(${C.getTime()})`, "[object String]": (C, x, N) => `new String(${N(C.toString())})`, "[object Number]": (C) => `new Number(${C})`, "[object Boolean]": (C) => `new Boolean(${C})`, "[object Set]": (C, x, N) => `new Set(${N(Array.from(C))})`, "[object Map]": (C, x, N) => `new Map(${N(Array.from(C))})`, "[object RegExp]": String, "[object global]": v, "[object Window]": v };
        }).call(this, u(27).Buffer, u(15));
      }, function(p, i, u) {
        (function(c) {
          var r = u(28), _ = u(29), g = u(30);
          function y() {
            return b.TYPED_ARRAY_SUPPORT ? 2147483647 : 1073741823;
          }
          function v(l, f) {
            if (y() < f) throw new RangeError("Invalid typed array length");
            return b.TYPED_ARRAY_SUPPORT ? (l = new Uint8Array(f)).__proto__ = b.prototype : (l === null && (l = new b(f)), l.length = f), l;
          }
          function b(l, f, w) {
            if (!(b.TYPED_ARRAY_SUPPORT || this instanceof b)) return new b(l, f, w);
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
              return W = he === void 0 && je === void 0 ? new Uint8Array(W) : je === void 0 ? new Uint8Array(W, he) : new Uint8Array(W, he, je), b.TYPED_ARRAY_SUPPORT ? (F = W).__proto__ = b.prototype : F = G(F, W), F;
            }(l, f, w, U) : typeof f == "string" ? function(F, W, he) {
              if (typeof he == "string" && he !== "" || (he = "utf8"), !b.isEncoding(he)) throw new TypeError('"encoding" must be a valid string encoding');
              var je = 0 | j(W, he), De = (F = v(F, je)).write(W, he);
              return De !== je && (F = F.slice(0, De)), F;
            }(l, f, w) : function(F, W) {
              if (b.isBuffer(W)) {
                var he = 0 | K(W.length);
                return (F = v(F, he)).length === 0 || W.copy(F, 0, 0, he), F;
              }
              if (W) {
                if (typeof ArrayBuffer < "u" && W.buffer instanceof ArrayBuffer || "length" in W) return typeof W.length != "number" || (je = W.length) != je ? v(F, 0) : G(F, W);
                if (W.type === "Buffer" && g(W.data)) return G(F, W.data);
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
            if (x(f), l = v(l, f < 0 ? 0 : 0 | K(f)), !b.TYPED_ARRAY_SUPPORT) for (var w = 0; w < f; ++w) l[w] = 0;
            return l;
          }
          function G(l, f) {
            var w = f.length < 0 ? 0 : 0 | K(f.length);
            l = v(l, w);
            for (var U = 0; U < w; U += 1) l[U] = 255 & f[U];
            return l;
          }
          function K(l) {
            if (l >= y()) throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + y().toString(16) + " bytes");
            return 0 | l;
          }
          function j(l, f) {
            if (b.isBuffer(l)) return l.length;
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
                return q(l).length;
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
                return ee(this, f, w);
              case "utf8":
              case "utf-8":
                return ne(this, f, w);
              case "ascii":
                return ce(this, f, w);
              case "latin1":
              case "binary":
                return be(this, f, w);
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
          function M(l, f, w, U, F) {
            if (l.length === 0) return -1;
            if (typeof w == "string" ? (U = w, w = 0) : w > 2147483647 ? w = 2147483647 : w < -2147483648 && (w = -2147483648), w = +w, isNaN(w) && (w = F ? 0 : l.length - 1), w < 0 && (w = l.length + w), w >= l.length) {
              if (F) return -1;
              w = l.length - 1;
            } else if (w < 0) {
              if (!F) return -1;
              w = 0;
            }
            if (typeof f == "string" && (f = b.from(f, U)), b.isBuffer(f)) return f.length === 0 ? -1 : V(l, f, w, U, F);
            if (typeof f == "number") return f &= 255, b.TYPED_ARRAY_SUPPORT && typeof Uint8Array.prototype.indexOf == "function" ? F ? Uint8Array.prototype.indexOf.call(l, f, w) : Uint8Array.prototype.lastIndexOf.call(l, f, w) : V(l, [f], w, U, F);
            throw new TypeError("val must be string, number or Buffer");
          }
          function V(l, f, w, U, F) {
            var W, he = 1, je = l.length, De = f.length;
            if (U !== void 0 && ((U = String(U).toLowerCase()) === "ucs2" || U === "ucs-2" || U === "utf16le" || U === "utf-16le")) {
              if (l.length < 2 || f.length < 2) return -1;
              he = 2, je /= 2, De /= 2, w /= 2;
            }
            function Xe(Jt, wt) {
              return he === 1 ? Jt[wt] : Jt.readUInt16BE(wt * he);
            }
            if (F) {
              var He = -1;
              for (W = w; W < je; W++) if (Xe(l, W) === Xe(f, He === -1 ? 0 : W - He)) {
                if (He === -1 && (He = W), W - He + 1 === De) return He * he;
              } else He !== -1 && (W -= W - He), He = -1;
            } else for (w + De > je && (w = je - De), W = w; W >= 0; W--) {
              for (var At = !0, kt = 0; kt < De; kt++) if (Xe(l, W + kt) !== Xe(f, kt)) {
                At = !1;
                break;
              }
              if (At) return W;
            }
            return -1;
          }
          function A(l, f, w, U) {
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
          function J(l, f, w, U) {
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
          function I(l, f, w, U) {
            return me(q(f), l, w, U);
          }
          function ae(l, f, w, U) {
            return me(function(F, W) {
              for (var he, je, De, Xe = [], He = 0; He < F.length && !((W -= 2) < 0); ++He) he = F.charCodeAt(He), je = he >> 8, De = he % 256, Xe.push(De), Xe.push(je);
              return Xe;
            }(f, l.length - w), l, w, U);
          }
          function le(l, f, w) {
            return f === 0 && w === l.length ? r.fromByteArray(l) : r.fromByteArray(l.slice(f, w));
          }
          function ne(l, f, w) {
            w = Math.min(l.length, w);
            for (var U = [], F = f; F < w; ) {
              var W, he, je, De, Xe = l[F], He = null, At = Xe > 239 ? 4 : Xe > 223 ? 3 : Xe > 191 ? 2 : 1;
              if (F + At <= w) switch (At) {
                case 1:
                  Xe < 128 && (He = Xe);
                  break;
                case 2:
                  (192 & (W = l[F + 1])) == 128 && (De = (31 & Xe) << 6 | 63 & W) > 127 && (He = De);
                  break;
                case 3:
                  W = l[F + 1], he = l[F + 2], (192 & W) == 128 && (192 & he) == 128 && (De = (15 & Xe) << 12 | (63 & W) << 6 | 63 & he) > 2047 && (De < 55296 || De > 57343) && (He = De);
                  break;
                case 4:
                  W = l[F + 1], he = l[F + 2], je = l[F + 3], (192 & W) == 128 && (192 & he) == 128 && (192 & je) == 128 && (De = (15 & Xe) << 18 | (63 & W) << 12 | (63 & he) << 6 | 63 & je) > 65535 && De < 1114112 && (He = De);
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
          i.Buffer = b, i.SlowBuffer = function(l) {
            return +l != l && (l = 0), b.alloc(+l);
          }, i.INSPECT_MAX_BYTES = 50, b.TYPED_ARRAY_SUPPORT = c.TYPED_ARRAY_SUPPORT !== void 0 ? c.TYPED_ARRAY_SUPPORT : function() {
            try {
              var l = new Uint8Array(1);
              return l.__proto__ = { __proto__: Uint8Array.prototype, foo: function() {
                return 42;
              } }, l.foo() === 42 && typeof l.subarray == "function" && l.subarray(1, 1).byteLength === 0;
            } catch {
              return !1;
            }
          }(), i.kMaxLength = y(), b.poolSize = 8192, b._augment = function(l) {
            return l.__proto__ = b.prototype, l;
          }, b.from = function(l, f, w) {
            return C(null, l, f, w);
          }, b.TYPED_ARRAY_SUPPORT && (b.prototype.__proto__ = Uint8Array.prototype, b.__proto__ = Uint8Array, typeof Symbol < "u" && Symbol.species && b[Symbol.species] === b && Object.defineProperty(b, Symbol.species, { value: null, configurable: !0 })), b.alloc = function(l, f, w) {
            return function(U, F, W, he) {
              return x(F), F <= 0 ? v(U, F) : W !== void 0 ? typeof he == "string" ? v(U, F).fill(W, he) : v(U, F).fill(W) : v(U, F);
            }(null, l, f, w);
          }, b.allocUnsafe = function(l) {
            return N(null, l);
          }, b.allocUnsafeSlow = function(l) {
            return N(null, l);
          }, b.isBuffer = function(l) {
            return !(l == null || !l._isBuffer);
          }, b.compare = function(l, f) {
            if (!b.isBuffer(l) || !b.isBuffer(f)) throw new TypeError("Arguments must be Buffers");
            if (l === f) return 0;
            for (var w = l.length, U = f.length, F = 0, W = Math.min(w, U); F < W; ++F) if (l[F] !== f[F]) {
              w = l[F], U = f[F];
              break;
            }
            return w < U ? -1 : U < w ? 1 : 0;
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
            if (!g(l)) throw new TypeError('"list" argument must be an Array of Buffers');
            if (l.length === 0) return b.alloc(0);
            var w;
            if (f === void 0) for (f = 0, w = 0; w < l.length; ++w) f += l[w].length;
            var U = b.allocUnsafe(f), F = 0;
            for (w = 0; w < l.length; ++w) {
              var W = l[w];
              if (!b.isBuffer(W)) throw new TypeError('"list" argument must be an Array of Buffers');
              W.copy(U, F), F += W.length;
            }
            return U;
          }, b.byteLength = j, b.prototype._isBuffer = !0, b.prototype.swap16 = function() {
            var l = this.length;
            if (l % 2 != 0) throw new RangeError("Buffer size must be a multiple of 16-bits");
            for (var f = 0; f < l; f += 2) P(this, f, f + 1);
            return this;
          }, b.prototype.swap32 = function() {
            var l = this.length;
            if (l % 4 != 0) throw new RangeError("Buffer size must be a multiple of 32-bits");
            for (var f = 0; f < l; f += 4) P(this, f, f + 3), P(this, f + 1, f + 2);
            return this;
          }, b.prototype.swap64 = function() {
            var l = this.length;
            if (l % 8 != 0) throw new RangeError("Buffer size must be a multiple of 64-bits");
            for (var f = 0; f < l; f += 8) P(this, f, f + 7), P(this, f + 1, f + 6), P(this, f + 2, f + 5), P(this, f + 3, f + 4);
            return this;
          }, b.prototype.toString = function() {
            var l = 0 | this.length;
            return l === 0 ? "" : arguments.length === 0 ? ne(this, 0, l) : B.apply(this, arguments);
          }, b.prototype.equals = function(l) {
            if (!b.isBuffer(l)) throw new TypeError("Argument must be a Buffer");
            return this === l || b.compare(this, l) === 0;
          }, b.prototype.inspect = function() {
            var l = "", f = i.INSPECT_MAX_BYTES;
            return this.length > 0 && (l = this.toString("hex", 0, f).match(/.{2}/g).join(" "), this.length > f && (l += " ... ")), "<Buffer " + l + ">";
          }, b.prototype.compare = function(l, f, w, U, F) {
            if (!b.isBuffer(l)) throw new TypeError("Argument must be a Buffer");
            if (f === void 0 && (f = 0), w === void 0 && (w = l ? l.length : 0), U === void 0 && (U = 0), F === void 0 && (F = this.length), f < 0 || w > l.length || U < 0 || F > this.length) throw new RangeError("out of range index");
            if (U >= F && f >= w) return 0;
            if (U >= F) return -1;
            if (f >= w) return 1;
            if (this === l) return 0;
            for (var W = (F >>>= 0) - (U >>>= 0), he = (w >>>= 0) - (f >>>= 0), je = Math.min(W, he), De = this.slice(U, F), Xe = l.slice(f, w), He = 0; He < je; ++He) if (De[He] !== Xe[He]) {
              W = De[He], he = Xe[He];
              break;
            }
            return W < he ? -1 : he < W ? 1 : 0;
          }, b.prototype.includes = function(l, f, w) {
            return this.indexOf(l, f, w) !== -1;
          }, b.prototype.indexOf = function(l, f, w) {
            return M(this, l, f, w, !0);
          }, b.prototype.lastIndexOf = function(l, f, w) {
            return M(this, l, f, w, !1);
          }, b.prototype.write = function(l, f, w, U) {
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
                return A(this, l, f, w);
              case "utf8":
              case "utf-8":
                return J(this, l, f, w);
              case "ascii":
                return Q(this, l, f, w);
              case "latin1":
              case "binary":
                return z(this, l, f, w);
              case "base64":
                return I(this, l, f, w);
              case "ucs2":
              case "ucs-2":
              case "utf16le":
              case "utf-16le":
                return ae(this, l, f, w);
              default:
                if (W) throw new TypeError("Unknown encoding: " + U);
                U = ("" + U).toLowerCase(), W = !0;
            }
          }, b.prototype.toJSON = function() {
            return { type: "Buffer", data: Array.prototype.slice.call(this._arr || this, 0) };
          };
          function ce(l, f, w) {
            var U = "";
            w = Math.min(l.length, w);
            for (var F = f; F < w; ++F) U += String.fromCharCode(127 & l[F]);
            return U;
          }
          function be(l, f, w) {
            var U = "";
            w = Math.min(l.length, w);
            for (var F = f; F < w; ++F) U += String.fromCharCode(l[F]);
            return U;
          }
          function ee(l, f, w) {
            var U = l.length;
            (!f || f < 0) && (f = 0), (!w || w < 0 || w > U) && (w = U);
            for (var F = "", W = f; W < w; ++W) F += Je(l[W]);
            return F;
          }
          function de(l, f, w) {
            for (var U = l.slice(f, w), F = "", W = 0; W < U.length; W += 2) F += String.fromCharCode(U[W] + 256 * U[W + 1]);
            return F;
          }
          function R(l, f, w) {
            if (l % 1 != 0 || l < 0) throw new RangeError("offset is not uint");
            if (l + f > w) throw new RangeError("Trying to access beyond buffer length");
          }
          function ie(l, f, w, U, F, W) {
            if (!b.isBuffer(l)) throw new TypeError('"buffer" argument must be a Buffer instance');
            if (f > F || f < W) throw new RangeError('"value" argument is out of bounds');
            if (w + U > l.length) throw new RangeError("Index out of range");
          }
          function ye(l, f, w, U) {
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
          b.prototype.slice = function(l, f) {
            var w, U = this.length;
            if ((l = ~~l) < 0 ? (l += U) < 0 && (l = 0) : l > U && (l = U), (f = f === void 0 ? U : ~~f) < 0 ? (f += U) < 0 && (f = 0) : f > U && (f = U), f < l && (f = l), b.TYPED_ARRAY_SUPPORT) (w = this.subarray(l, f)).__proto__ = b.prototype;
            else {
              var F = f - l;
              w = new b(F, void 0);
              for (var W = 0; W < F; ++W) w[W] = this[W + l];
            }
            return w;
          }, b.prototype.readUIntLE = function(l, f, w) {
            l |= 0, f |= 0, w || R(l, f, this.length);
            for (var U = this[l], F = 1, W = 0; ++W < f && (F *= 256); ) U += this[l + W] * F;
            return U;
          }, b.prototype.readUIntBE = function(l, f, w) {
            l |= 0, f |= 0, w || R(l, f, this.length);
            for (var U = this[l + --f], F = 1; f > 0 && (F *= 256); ) U += this[l + --f] * F;
            return U;
          }, b.prototype.readUInt8 = function(l, f) {
            return f || R(l, 1, this.length), this[l];
          }, b.prototype.readUInt16LE = function(l, f) {
            return f || R(l, 2, this.length), this[l] | this[l + 1] << 8;
          }, b.prototype.readUInt16BE = function(l, f) {
            return f || R(l, 2, this.length), this[l] << 8 | this[l + 1];
          }, b.prototype.readUInt32LE = function(l, f) {
            return f || R(l, 4, this.length), (this[l] | this[l + 1] << 8 | this[l + 2] << 16) + 16777216 * this[l + 3];
          }, b.prototype.readUInt32BE = function(l, f) {
            return f || R(l, 4, this.length), 16777216 * this[l] + (this[l + 1] << 16 | this[l + 2] << 8 | this[l + 3]);
          }, b.prototype.readIntLE = function(l, f, w) {
            l |= 0, f |= 0, w || R(l, f, this.length);
            for (var U = this[l], F = 1, W = 0; ++W < f && (F *= 256); ) U += this[l + W] * F;
            return U >= (F *= 128) && (U -= Math.pow(2, 8 * f)), U;
          }, b.prototype.readIntBE = function(l, f, w) {
            l |= 0, f |= 0, w || R(l, f, this.length);
            for (var U = f, F = 1, W = this[l + --U]; U > 0 && (F *= 256); ) W += this[l + --U] * F;
            return W >= (F *= 128) && (W -= Math.pow(2, 8 * f)), W;
          }, b.prototype.readInt8 = function(l, f) {
            return f || R(l, 1, this.length), 128 & this[l] ? -1 * (255 - this[l] + 1) : this[l];
          }, b.prototype.readInt16LE = function(l, f) {
            f || R(l, 2, this.length);
            var w = this[l] | this[l + 1] << 8;
            return 32768 & w ? 4294901760 | w : w;
          }, b.prototype.readInt16BE = function(l, f) {
            f || R(l, 2, this.length);
            var w = this[l + 1] | this[l] << 8;
            return 32768 & w ? 4294901760 | w : w;
          }, b.prototype.readInt32LE = function(l, f) {
            return f || R(l, 4, this.length), this[l] | this[l + 1] << 8 | this[l + 2] << 16 | this[l + 3] << 24;
          }, b.prototype.readInt32BE = function(l, f) {
            return f || R(l, 4, this.length), this[l] << 24 | this[l + 1] << 16 | this[l + 2] << 8 | this[l + 3];
          }, b.prototype.readFloatLE = function(l, f) {
            return f || R(l, 4, this.length), _.read(this, l, !0, 23, 4);
          }, b.prototype.readFloatBE = function(l, f) {
            return f || R(l, 4, this.length), _.read(this, l, !1, 23, 4);
          }, b.prototype.readDoubleLE = function(l, f) {
            return f || R(l, 8, this.length), _.read(this, l, !0, 52, 8);
          }, b.prototype.readDoubleBE = function(l, f) {
            return f || R(l, 8, this.length), _.read(this, l, !1, 52, 8);
          }, b.prototype.writeUIntLE = function(l, f, w, U) {
            l = +l, f |= 0, w |= 0, U || ie(this, l, f, w, Math.pow(2, 8 * w) - 1, 0);
            var F = 1, W = 0;
            for (this[f] = 255 & l; ++W < w && (F *= 256); ) this[f + W] = l / F & 255;
            return f + w;
          }, b.prototype.writeUIntBE = function(l, f, w, U) {
            l = +l, f |= 0, w |= 0, U || ie(this, l, f, w, Math.pow(2, 8 * w) - 1, 0);
            var F = w - 1, W = 1;
            for (this[f + F] = 255 & l; --F >= 0 && (W *= 256); ) this[f + F] = l / W & 255;
            return f + w;
          }, b.prototype.writeUInt8 = function(l, f, w) {
            return l = +l, f |= 0, w || ie(this, l, f, 1, 255, 0), b.TYPED_ARRAY_SUPPORT || (l = Math.floor(l)), this[f] = 255 & l, f + 1;
          }, b.prototype.writeUInt16LE = function(l, f, w) {
            return l = +l, f |= 0, w || ie(this, l, f, 2, 65535, 0), b.TYPED_ARRAY_SUPPORT ? (this[f] = 255 & l, this[f + 1] = l >>> 8) : ye(this, l, f, !0), f + 2;
          }, b.prototype.writeUInt16BE = function(l, f, w) {
            return l = +l, f |= 0, w || ie(this, l, f, 2, 65535, 0), b.TYPED_ARRAY_SUPPORT ? (this[f] = l >>> 8, this[f + 1] = 255 & l) : ye(this, l, f, !1), f + 2;
          }, b.prototype.writeUInt32LE = function(l, f, w) {
            return l = +l, f |= 0, w || ie(this, l, f, 4, 4294967295, 0), b.TYPED_ARRAY_SUPPORT ? (this[f + 3] = l >>> 24, this[f + 2] = l >>> 16, this[f + 1] = l >>> 8, this[f] = 255 & l) : Te(this, l, f, !0), f + 4;
          }, b.prototype.writeUInt32BE = function(l, f, w) {
            return l = +l, f |= 0, w || ie(this, l, f, 4, 4294967295, 0), b.TYPED_ARRAY_SUPPORT ? (this[f] = l >>> 24, this[f + 1] = l >>> 16, this[f + 2] = l >>> 8, this[f + 3] = 255 & l) : Te(this, l, f, !1), f + 4;
          }, b.prototype.writeIntLE = function(l, f, w, U) {
            if (l = +l, f |= 0, !U) {
              var F = Math.pow(2, 8 * w - 1);
              ie(this, l, f, w, F - 1, -F);
            }
            var W = 0, he = 1, je = 0;
            for (this[f] = 255 & l; ++W < w && (he *= 256); ) l < 0 && je === 0 && this[f + W - 1] !== 0 && (je = 1), this[f + W] = (l / he >> 0) - je & 255;
            return f + w;
          }, b.prototype.writeIntBE = function(l, f, w, U) {
            if (l = +l, f |= 0, !U) {
              var F = Math.pow(2, 8 * w - 1);
              ie(this, l, f, w, F - 1, -F);
            }
            var W = w - 1, he = 1, je = 0;
            for (this[f + W] = 255 & l; --W >= 0 && (he *= 256); ) l < 0 && je === 0 && this[f + W + 1] !== 0 && (je = 1), this[f + W] = (l / he >> 0) - je & 255;
            return f + w;
          }, b.prototype.writeInt8 = function(l, f, w) {
            return l = +l, f |= 0, w || ie(this, l, f, 1, 127, -128), b.TYPED_ARRAY_SUPPORT || (l = Math.floor(l)), l < 0 && (l = 255 + l + 1), this[f] = 255 & l, f + 1;
          }, b.prototype.writeInt16LE = function(l, f, w) {
            return l = +l, f |= 0, w || ie(this, l, f, 2, 32767, -32768), b.TYPED_ARRAY_SUPPORT ? (this[f] = 255 & l, this[f + 1] = l >>> 8) : ye(this, l, f, !0), f + 2;
          }, b.prototype.writeInt16BE = function(l, f, w) {
            return l = +l, f |= 0, w || ie(this, l, f, 2, 32767, -32768), b.TYPED_ARRAY_SUPPORT ? (this[f] = l >>> 8, this[f + 1] = 255 & l) : ye(this, l, f, !1), f + 2;
          }, b.prototype.writeInt32LE = function(l, f, w) {
            return l = +l, f |= 0, w || ie(this, l, f, 4, 2147483647, -2147483648), b.TYPED_ARRAY_SUPPORT ? (this[f] = 255 & l, this[f + 1] = l >>> 8, this[f + 2] = l >>> 16, this[f + 3] = l >>> 24) : Te(this, l, f, !0), f + 4;
          }, b.prototype.writeInt32BE = function(l, f, w) {
            return l = +l, f |= 0, w || ie(this, l, f, 4, 2147483647, -2147483648), l < 0 && (l = 4294967295 + l + 1), b.TYPED_ARRAY_SUPPORT ? (this[f] = l >>> 24, this[f + 1] = l >>> 16, this[f + 2] = l >>> 8, this[f + 3] = 255 & l) : Te(this, l, f, !1), f + 4;
          }, b.prototype.writeFloatLE = function(l, f, w) {
            return Pe(this, l, f, !0, w);
          }, b.prototype.writeFloatBE = function(l, f, w) {
            return Pe(this, l, f, !1, w);
          }, b.prototype.writeDoubleLE = function(l, f, w) {
            return Se(this, l, f, !0, w);
          }, b.prototype.writeDoubleBE = function(l, f, w) {
            return Se(this, l, f, !1, w);
          }, b.prototype.copy = function(l, f, w, U) {
            if (w || (w = 0), U || U === 0 || (U = this.length), f >= l.length && (f = l.length), f || (f = 0), U > 0 && U < w && (U = w), U === w || l.length === 0 || this.length === 0) return 0;
            if (f < 0) throw new RangeError("targetStart out of bounds");
            if (w < 0 || w >= this.length) throw new RangeError("sourceStart out of bounds");
            if (U < 0) throw new RangeError("sourceEnd out of bounds");
            U > this.length && (U = this.length), l.length - f < U - w && (U = l.length - f + w);
            var F, W = U - w;
            if (this === l && w < f && f < U) for (F = W - 1; F >= 0; --F) l[F + f] = this[F + w];
            else if (W < 1e3 || !b.TYPED_ARRAY_SUPPORT) for (F = 0; F < W; ++F) l[F + f] = this[F + w];
            else Uint8Array.prototype.set.call(l, this.subarray(w, w + W), f);
            return W;
          }, b.prototype.fill = function(l, f, w, U) {
            if (typeof l == "string") {
              if (typeof f == "string" ? (U = f, f = 0, w = this.length) : typeof w == "string" && (U = w, w = this.length), l.length === 1) {
                var F = l.charCodeAt(0);
                F < 256 && (l = F);
              }
              if (U !== void 0 && typeof U != "string") throw new TypeError("encoding must be a string");
              if (typeof U == "string" && !b.isEncoding(U)) throw new TypeError("Unknown encoding: " + U);
            } else typeof l == "number" && (l &= 255);
            if (f < 0 || this.length < f || this.length < w) throw new RangeError("Out of range index");
            if (w <= f) return this;
            var W;
            if (f >>>= 0, w = w === void 0 ? this.length : w >>> 0, l || (l = 0), typeof l == "number") for (W = f; W < w; ++W) this[W] = l;
            else {
              var he = b.isBuffer(l) ? l : X(new b(l, U).toString()), je = he.length;
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
          function q(l) {
            return r.toByteArray(function(f) {
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
      }, function(p, i, u) {
        i.byteLength = function(x) {
          var N = b(x), G = N[0], K = N[1];
          return 3 * (G + K) / 4 - K;
        }, i.toByteArray = function(x) {
          var N, G, K = b(x), j = K[0], B = K[1], P = new _(function(A, J, Q) {
            return 3 * (J + Q) / 4 - Q;
          }(0, j, B)), M = 0, V = B > 0 ? j - 4 : j;
          for (G = 0; G < V; G += 4) N = r[x.charCodeAt(G)] << 18 | r[x.charCodeAt(G + 1)] << 12 | r[x.charCodeAt(G + 2)] << 6 | r[x.charCodeAt(G + 3)], P[M++] = N >> 16 & 255, P[M++] = N >> 8 & 255, P[M++] = 255 & N;
          return B === 2 && (N = r[x.charCodeAt(G)] << 2 | r[x.charCodeAt(G + 1)] >> 4, P[M++] = 255 & N), B === 1 && (N = r[x.charCodeAt(G)] << 10 | r[x.charCodeAt(G + 1)] << 4 | r[x.charCodeAt(G + 2)] >> 2, P[M++] = N >> 8 & 255, P[M++] = 255 & N), P;
        }, i.fromByteArray = function(x) {
          for (var N, G = x.length, K = G % 3, j = [], B = 0, P = G - K; B < P; B += 16383) j.push(C(x, B, B + 16383 > P ? P : B + 16383));
          return K === 1 ? (N = x[G - 1], j.push(c[N >> 2] + c[N << 4 & 63] + "==")) : K === 2 && (N = (x[G - 2] << 8) + x[G - 1], j.push(c[N >> 10] + c[N >> 4 & 63] + c[N << 2 & 63] + "=")), j.join("");
        };
        for (var c = [], r = [], _ = typeof Uint8Array < "u" ? Uint8Array : Array, g = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", y = 0, v = g.length; y < v; ++y) c[y] = g[y], r[g.charCodeAt(y)] = y;
        function b(x) {
          var N = x.length;
          if (N % 4 > 0) throw new Error("Invalid string. Length must be a multiple of 4");
          var G = x.indexOf("=");
          return G === -1 && (G = N), [G, G === N ? 0 : 4 - G % 4];
        }
        function C(x, N, G) {
          for (var K, j, B = [], P = N; P < G; P += 3) K = (x[P] << 16 & 16711680) + (x[P + 1] << 8 & 65280) + (255 & x[P + 2]), B.push(c[(j = K) >> 18 & 63] + c[j >> 12 & 63] + c[j >> 6 & 63] + c[63 & j]);
          return B.join("");
        }
        r[45] = 62, r[95] = 63;
      }, function(p, i) {
        i.read = function(u, c, r, _, g) {
          var y, v, b = 8 * g - _ - 1, C = (1 << b) - 1, x = C >> 1, N = -7, G = r ? g - 1 : 0, K = r ? -1 : 1, j = u[c + G];
          for (G += K, y = j & (1 << -N) - 1, j >>= -N, N += b; N > 0; y = 256 * y + u[c + G], G += K, N -= 8) ;
          for (v = y & (1 << -N) - 1, y >>= -N, N += _; N > 0; v = 256 * v + u[c + G], G += K, N -= 8) ;
          if (y === 0) y = 1 - x;
          else {
            if (y === C) return v ? NaN : 1 / 0 * (j ? -1 : 1);
            v += Math.pow(2, _), y -= x;
          }
          return (j ? -1 : 1) * v * Math.pow(2, y - _);
        }, i.write = function(u, c, r, _, g, y) {
          var v, b, C, x = 8 * y - g - 1, N = (1 << x) - 1, G = N >> 1, K = g === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0, j = _ ? 0 : y - 1, B = _ ? 1 : -1, P = c < 0 || c === 0 && 1 / c < 0 ? 1 : 0;
          for (c = Math.abs(c), isNaN(c) || c === 1 / 0 ? (b = isNaN(c) ? 1 : 0, v = N) : (v = Math.floor(Math.log(c) / Math.LN2), c * (C = Math.pow(2, -v)) < 1 && (v--, C *= 2), (c += v + G >= 1 ? K / C : K * Math.pow(2, 1 - G)) * C >= 2 && (v++, C /= 2), v + G >= N ? (b = 0, v = N) : v + G >= 1 ? (b = (c * C - 1) * Math.pow(2, g), v += G) : (b = c * Math.pow(2, G - 1) * Math.pow(2, g), v = 0)); g >= 8; u[r + j] = 255 & b, j += B, b /= 256, g -= 8) ;
          for (v = v << g | b, x += g; x > 0; u[r + j] = 255 & v, j += B, v /= 256, x -= 8) ;
          u[r + j - B] |= 128 * P;
        };
      }, function(p, i) {
        var u = {}.toString;
        p.exports = Array.isArray || function(c) {
          return u.call(c) == "[object Array]";
        };
      }, function(p, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.arrayToString = void 0, i.arrayToString = (c, r, _) => {
          const g = c.map(function(v, b) {
            const C = _(v, b);
            return C === void 0 ? String(C) : r + C.split(`
`).join(`
` + r);
          }).join(r ? `,
` : ","), y = r && g ? `
` : "";
          return `[${y}${g}${y}]`;
        };
      }, function(p, i, u) {
        function c(j) {
          return (c = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(B) {
            return typeof B;
          } : function(B) {
            return B && typeof Symbol == "function" && B.constructor === Symbol && B !== Symbol.prototype ? "symbol" : typeof B;
          })(j);
        }
        Object.defineProperty(i, "__esModule", { value: !0 }), i.matchesSelector = x, i.matchesSelectorAndParentsTo = function(j, B, P) {
          var M = j;
          do {
            if (x(M, B)) return !0;
            if (M === P) return !1;
            M = M.parentNode;
          } while (M);
          return !1;
        }, i.addEvent = function(j, B, P, M) {
          if (j) {
            var V = v({ capture: !0 }, M);
            j.addEventListener ? j.addEventListener(B, P, V) : j.attachEvent ? j.attachEvent("on" + B, P) : j["on" + B] = P;
          }
        }, i.removeEvent = function(j, B, P, M) {
          if (j) {
            var V = v({ capture: !0 }, M);
            j.removeEventListener ? j.removeEventListener(B, P, V) : j.detachEvent ? j.detachEvent("on" + B, P) : j["on" + B] = null;
          }
        }, i.outerHeight = function(j) {
          var B = j.clientHeight, P = j.ownerDocument.defaultView.getComputedStyle(j);
          return B += (0, r.int)(P.borderTopWidth), B += (0, r.int)(P.borderBottomWidth);
        }, i.outerWidth = function(j) {
          var B = j.clientWidth, P = j.ownerDocument.defaultView.getComputedStyle(j);
          return B += (0, r.int)(P.borderLeftWidth), B += (0, r.int)(P.borderRightWidth);
        }, i.innerHeight = function(j) {
          var B = j.clientHeight, P = j.ownerDocument.defaultView.getComputedStyle(j);
          return B -= (0, r.int)(P.paddingTop), B -= (0, r.int)(P.paddingBottom);
        }, i.innerWidth = function(j) {
          var B = j.clientWidth, P = j.ownerDocument.defaultView.getComputedStyle(j);
          return B -= (0, r.int)(P.paddingLeft), B -= (0, r.int)(P.paddingRight);
        }, i.offsetXYFromParent = function(j, B, P) {
          var M = B === B.ownerDocument.body ? { left: 0, top: 0 } : B.getBoundingClientRect(), V = (j.clientX + B.scrollLeft - M.left) / P, A = (j.clientY + B.scrollTop - M.top) / P;
          return { x: V, y: A };
        }, i.createCSSTransform = function(j, B) {
          var P = N(j, B, "px");
          return b({}, (0, _.browserPrefixToKey)("transform", _.default), P);
        }, i.createSVGTransform = function(j, B) {
          return N(j, B, "");
        }, i.getTranslation = N, i.getTouch = function(j, B) {
          return j.targetTouches && (0, r.findInArray)(j.targetTouches, function(P) {
            return B === P.identifier;
          }) || j.changedTouches && (0, r.findInArray)(j.changedTouches, function(P) {
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
        var r = u(20), _ = function(j) {
          if (j && j.__esModule) return j;
          if (j === null || c(j) !== "object" && typeof j != "function") return { default: j };
          var B = g();
          if (B && B.has(j)) return B.get(j);
          var P = {}, M = Object.defineProperty && Object.getOwnPropertyDescriptor;
          for (var V in j) if (Object.prototype.hasOwnProperty.call(j, V)) {
            var A = M ? Object.getOwnPropertyDescriptor(j, V) : null;
            A && (A.get || A.set) ? Object.defineProperty(P, V, A) : P[V] = j[V];
          }
          return P.default = j, B && B.set(j, P), P;
        }(u(56));
        function g() {
          if (typeof WeakMap != "function") return null;
          var j = /* @__PURE__ */ new WeakMap();
          return g = function() {
            return j;
          }, j;
        }
        function y(j, B) {
          var P = Object.keys(j);
          if (Object.getOwnPropertySymbols) {
            var M = Object.getOwnPropertySymbols(j);
            B && (M = M.filter(function(V) {
              return Object.getOwnPropertyDescriptor(j, V).enumerable;
            })), P.push.apply(P, M);
          }
          return P;
        }
        function v(j) {
          for (var B = 1; B < arguments.length; B++) {
            var P = arguments[B] != null ? arguments[B] : {};
            B % 2 ? y(Object(P), !0).forEach(function(M) {
              b(j, M, P[M]);
            }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(j, Object.getOwnPropertyDescriptors(P)) : y(Object(P)).forEach(function(M) {
              Object.defineProperty(j, M, Object.getOwnPropertyDescriptor(P, M));
            });
          }
          return j;
        }
        function b(j, B, P) {
          return B in j ? Object.defineProperty(j, B, { value: P, enumerable: !0, configurable: !0, writable: !0 }) : j[B] = P, j;
        }
        var C = "";
        function x(j, B) {
          return C || (C = (0, r.findInArray)(["matches", "webkitMatchesSelector", "mozMatchesSelector", "msMatchesSelector", "oMatchesSelector"], function(P) {
            return (0, r.isFunction)(j[P]);
          })), !!(0, r.isFunction)(j[C]) && j[C](B);
        }
        function N(j, B, P) {
          var M = j.x, V = j.y, A = "translate(".concat(M).concat(P, ",").concat(V).concat(P, ")");
          if (B) {
            var J = "".concat(typeof B.x == "string" ? B.x : B.x + P), Q = "".concat(typeof B.y == "string" ? B.y : B.y + P);
            A = "translate(".concat(J, ", ").concat(Q, ")") + A;
          }
          return A;
        }
        function G(j, B) {
          j.classList ? j.classList.add(B) : j.className.match(new RegExp("(?:^|\\s)".concat(B, "(?!\\S)"))) || (j.className += " ".concat(B));
        }
        function K(j, B) {
          j.classList ? j.classList.remove(B) : j.className = j.className.replace(new RegExp("(?:^|\\s)".concat(B, "(?!\\S)"), "g"), "");
        }
      }, function(p, i) {
        p.exports = function(u) {
          return u.webpackPolyfill || (u.deprecate = function() {
          }, u.paths = [], u.children || (u.children = []), Object.defineProperty(u, "loaded", { enumerable: !0, get: function() {
            return u.l;
          } }), Object.defineProperty(u, "id", { enumerable: !0, get: function() {
            return u.i;
          } }), u.webpackPolyfill = 1), u;
        };
      }, function(p, i, u) {
        var c = u(6), r = u(35);
        typeof (r = r.__esModule ? r.default : r) == "string" && (r = [[p.i, r, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(r, _), p.exports = r.locals || {};
      }, function(p, i, u) {
        (p.exports = u(7)(!1)).push([p.i, `.ck-inspector{--ck-inspector-color-tree-node-hover:#eaf2fb;--ck-inspector-color-tree-node-name:#882680;--ck-inspector-color-tree-node-attribute-name:#8a8a8a;--ck-inspector-color-tree-node-tag:#aaa;--ck-inspector-color-tree-node-attribute:#9a4819;--ck-inspector-color-tree-node-attribute-value:#2a43ac;--ck-inspector-color-tree-text-border:#b7b7b7;--ck-inspector-color-tree-node-border-hover:#b0c6e0;--ck-inspector-color-tree-content-delimiter:#ddd;--ck-inspector-color-tree-node-active-bg:#f5faff;--ck-inspector-color-tree-node-name-active-bg:#2b98f0;--ck-inspector-color-tree-node-inactive:#8a8a8a;--ck-inspector-color-tree-selection:#ff1744;--ck-inspector-color-tree-position:#000;--ck-inspector-color-comment:green}.ck-inspector .ck-inspector-tree{background:var(--ck-inspector-color-white);padding:1em;width:100%;height:100%;overflow:auto;user-select:none}.ck-inspector-tree .ck-inspector-tree-node__attribute{font:inherit;margin-left:.4em;color:var(--ck-inspector-color-tree-node-tag)}.ck-inspector-tree .ck-inspector-tree-node__attribute .ck-inspector-tree-node__attribute__name{color:var(--ck-inspector-color-tree-node-attribute)}.ck-inspector-tree .ck-inspector-tree-node__attribute .ck-inspector-tree-node__attribute__value{color:var(--ck-inspector-color-tree-node-attribute-value)}.ck-inspector-tree .ck-inspector-tree-node__attribute .ck-inspector-tree-node__attribute__value:before{content:'="'}.ck-inspector-tree .ck-inspector-tree-node__attribute .ck-inspector-tree-node__attribute__value:after{content:'"'}.ck-inspector-tree .ck-inspector-tree-node .ck-inspector-tree-node__name{color:var(--ck-inspector-color-tree-node-name);display:inline-block;width:100%;padding:0 .1em;border-left:1px solid transparent}.ck-inspector-tree .ck-inspector-tree-node .ck-inspector-tree-node__name:hover{background:var(--ck-inspector-color-tree-node-hover)}.ck-inspector-tree .ck-inspector-tree-node .ck-inspector-tree-node__content{padding:1px .5em 1px 1.5em;border-left:1px solid var(--ck-inspector-color-tree-content-delimiter);white-space:pre-wrap}.ck-inspector-tree .ck-inspector-tree-node:not(.ck-inspector-tree-node_tagless) .ck-inspector-tree-node__name>.ck-inspector-tree-node__name__bracket_open:after{content:"<";color:var(--ck-inspector-color-tree-node-tag)}.ck-inspector-tree .ck-inspector-tree-node:not(.ck-inspector-tree-node_tagless) .ck-inspector-tree-node__name .ck-inspector-tree-node__name__bracket_close:after{content:">";color:var(--ck-inspector-color-tree-node-tag)}.ck-inspector-tree .ck-inspector-tree-node:not(.ck-inspector-tree-node_tagless).ck-inspector-tree-node_empty .ck-inspector-tree-node__name:after{content:" />"}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_tagless .ck-inspector-tree-node__content{display:none}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name:not(.ck-inspector-tree-node__name_close),.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name:not(.ck-inspector-tree-node__name_close) :not(.ck-inspector-tree__position),.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name:not(.ck-inspector-tree-node__name_close)>.ck-inspector-tree-node__name__bracket:after{background:var(--ck-inspector-color-tree-node-name-active-bg);color:var(--ck-inspector-color-white)}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__content,.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name_close{background:var(--ck-inspector-color-tree-node-active-bg)}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__content{border-left-color:var(--ck-inspector-color-tree-node-name-active-bg)}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name{border-left:1px solid var(--ck-inspector-color-tree-node-name-active-bg)}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_disabled{opacity:.8}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_disabled .ck-inspector-tree-node__name,.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_disabled .ck-inspector-tree-node__name *{color:var(--ck-inspector-color-tree-node-inactive)}.ck-inspector-tree .ck-inspector-tree-text{display:block;margin-bottom:1px}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-node__content{border:1px dotted var(--ck-inspector-color-tree-text-border);border-radius:2px;padding:0 1px;margin-right:1px;display:inline-block;word-break:break-all}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes:not(:empty){margin-right:.5em}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes .ck-inspector-tree-node__attribute{background:var(--ck-inspector-color-tree-node-attribute-name);border-radius:2px;padding:0 .5em}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes .ck-inspector-tree-node__attribute+.ck-inspector-tree-node__attribute{margin-left:.2em}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes .ck-inspector-tree-node__attribute>*{color:var(--ck-inspector-color-white)}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes .ck-inspector-tree-node__attribute:first-child{margin-left:0}.ck-inspector-tree .ck-inspector-tree-text.ck-inspector-tree-node_active .ck-inspector-tree-node__content{border-style:solid;border-color:var(--ck-inspector-color-tree-node-name-active-bg)}.ck-inspector-tree .ck-inspector-tree-text.ck-inspector-tree-node_active .ck-inspector-tree-node__attribute{background:var(--ck-inspector-color-white)}.ck-inspector-tree .ck-inspector-tree-text.ck-inspector-tree-node_active .ck-inspector-tree-node__attribute>*{color:var(--ck-inspector-color-tree-node-name-active-bg)}.ck-inspector-tree .ck-inspector-tree-text.ck-inspector-tree-node_active>.ck-inspector-tree-node__content{background:var(--ck-inspector-color-tree-node-name-active-bg);color:var(--ck-inspector-color-white)}.ck-inspector-tree .ck-inspector-tree-text:not(.ck-inspector-tree-node_active) .ck-inspector-tree-node__content:hover{background:var(--ck-inspector-color-tree-node-hover);border-style:solid;border-color:var(--ck-inspector-color-tree-node-border-hover)}.ck-inspector-tree.ck-inspector-tree_text-direction_ltr .ck-inspector-tree-node__content{direction:ltr}.ck-inspector-tree.ck-inspector-tree_text-direction_rtl .ck-inspector-tree-node__content{direction:rtl}.ck-inspector-tree.ck-inspector-tree_text-direction_rtl .ck-inspector-tree-node__content .ck-inspector-tree-node__name{direction:ltr}.ck-inspector-tree.ck-inspector-tree_text-direction_rtl .ck-inspector-tree__position{transform:rotate(180deg)}.ck-inspector-tree .ck-inspector-tree-comment{color:var(--ck-inspector-color-comment);font-style:italic}.ck-inspector-tree .ck-inspector-tree-comment a{color:inherit;text-decoration:underline}.ck-inspector-tree_compact-text .ck-inspector-tree-text,.ck-inspector-tree_compact-text .ck-inspector-tree-text .ck-inspector-tree-node__content{display:inline}.ck-inspector .ck-inspector__tree__navigation{padding:.5em 1em;border-bottom:1px solid var(--ck-inspector-color-border)}.ck-inspector .ck-inspector__tree__navigation label{margin-right:.5em}.ck-inspector-tree .ck-inspector-tree__position{display:inline-block;position:relative;cursor:default;height:100%;pointer-events:none;vertical-align:top}.ck-inspector-tree .ck-inspector-tree__position:after{content:"";position:absolute;border:1px solid var(--ck-inspector-color-tree-position);width:0;top:0;bottom:0;margin-left:-1px}.ck-inspector-tree .ck-inspector-tree__position:before{margin-left:-1px}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_selection{z-index:2;--ck-inspector-color-tree-position:var(--ck-inspector-color-tree-selection)}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_selection:before{content:"";position:absolute;top:-1px;bottom:-1px;left:0;border-top:2px solid var(--ck-inspector-color-tree-position);border-bottom:2px solid var(--ck-inspector-color-tree-position);width:8px}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_selection.ck-inspector-tree__position_end:before{right:-1px;left:auto}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_marker{z-index:1}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_marker:before{content:"";display:block;position:absolute;left:0;top:-1px;cursor:default;width:0;height:0;border-left:0 solid transparent;border-bottom:0 solid transparent;border-right:7px solid transparent;border-top:7px solid var(--ck-inspector-color-tree-position)}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_marker.ck-inspector-tree__position_end:before{border-width:0 7px 7px 0;border-left-color:transparent;border-bottom-color:transparent;border-right-color:var(--ck-inspector-color-tree-position);border-top-color:transparent;left:-5px}`, ""]);
      }, function(p, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.canUseDOM = i.SafeNodeList = i.SafeHTMLCollection = void 0;
        var c, r = u(82), _ = ((c = r) && c.__esModule ? c : { default: c }).default, g = _.canUseDOM ? window.HTMLElement : {};
        i.SafeHTMLCollection = _.canUseDOM ? window.HTMLCollection : {}, i.SafeNodeList = _.canUseDOM ? window.NodeList : {}, i.canUseDOM = _.canUseDOM, i.default = g;
      }, function(p, i, u) {
        var c = u(6), r = u(38);
        typeof (r = r.__esModule ? r.default : r) == "string" && (r = [[p.i, r, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(r, _), p.exports = r.locals || {};
      }, function(p, i, u) {
        (p.exports = u(7)(!1)).push([p.i, `.ck-inspector,.ck-inspector-portal{--ck-inspector-color-white:#fff;--ck-inspector-color-black:#000;--ck-inspector-color-background:#f3f3f3;--ck-inspector-color-link:#005cc6;--ck-inspector-code-font-size:11px;--ck-inspector-code-font-family:monaco,Consolas,Lucida Console,monospace;--ck-inspector-color-border:#d0d0d0}.ck-inspector,.ck-inspector-portal,.ck-inspector-portal :not(select),.ck-inspector :not(select){box-sizing:border-box;width:auto;height:auto;position:static;margin:0;padding:0;border:0;background:transparent;text-decoration:none;transition:none;word-wrap:break-word;font-family:Arial,Helvetica Neue,Helvetica,sans-serif;font-size:12px;line-height:17px;font-weight:400;-webkit-font-smoothing:auto}.ck-inspector{overflow:hidden;border-collapse:collapse;color:var(--ck-inspector-color-black);text-align:left;white-space:normal;cursor:auto;float:none;background:var(--ck-inspector-color-background);border-top:1px solid var(--ck-inspector-color-border);z-index:9999}.ck-inspector.ck-inspector_collapsed>.ck-inspector-navbox>.ck-inspector-navbox__navigation .ck-inspector-horizontal-nav{display:none}.ck-inspector .ck-inspector-navbox__navigation__logo{background-size:contain;background-repeat:no-repeat;background-position:50%;display:block;overflow:hidden;text-indent:100px;align-self:center;white-space:nowrap;margin-right:1em;background-image:url("data:image/svg+xml;charset=utf-8,%3Csvg width='68' height='64' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M43.71 11.025a11.508 11.508 0 00-1.213 5.159c0 6.42 5.244 11.625 11.713 11.625.083 0 .167 0 .25-.002v16.282a5.464 5.464 0 01-2.756 4.739L30.986 60.7a5.548 5.548 0 01-5.512 0L4.756 48.828A5.464 5.464 0 012 44.089V20.344c0-1.955 1.05-3.76 2.756-4.738L25.474 3.733a5.548 5.548 0 015.512 0l12.724 7.292z' fill='%23FFF'/%3E%3Cpath d='M45.684 8.79a12.604 12.604 0 00-1.329 5.65c0 7.032 5.744 12.733 12.829 12.733.091 0 .183-.001.274-.003v17.834a5.987 5.987 0 01-3.019 5.19L31.747 63.196a6.076 6.076 0 01-6.037 0L3.02 50.193A5.984 5.984 0 010 45.003V18.997c0-2.14 1.15-4.119 3.019-5.19L25.71.804a6.076 6.076 0 016.037 0L45.684 8.79zm-29.44 11.89c-.834 0-1.51.671-1.51 1.498v.715c0 .828.676 1.498 1.51 1.498h25.489c.833 0 1.51-.67 1.51-1.498v-.715c0-.827-.677-1.498-1.51-1.498h-25.49zm0 9.227c-.834 0-1.51.671-1.51 1.498v.715c0 .828.676 1.498 1.51 1.498h18.479c.833 0 1.509-.67 1.509-1.498v-.715c0-.827-.676-1.498-1.51-1.498H16.244zm0 9.227c-.834 0-1.51.671-1.51 1.498v.715c0 .828.676 1.498 1.51 1.498h25.489c.833 0 1.51-.67 1.51-1.498v-.715c0-.827-.677-1.498-1.51-1.498h-25.49zm41.191-14.459c-5.835 0-10.565-4.695-10.565-10.486 0-5.792 4.73-10.487 10.565-10.487C63.27 3.703 68 8.398 68 14.19c0 5.791-4.73 10.486-10.565 10.486zm3.422-8.68c0-.467-.084-.875-.251-1.225a2.547 2.547 0 00-.686-.88 2.888 2.888 0 00-1.026-.531 4.418 4.418 0 00-1.259-.175c-.134 0-.283.006-.447.018a2.72 2.72 0 00-.446.07l.075-1.4h3.587v-1.8h-5.462l-.214 5.06c.319-.116.682-.21 1.089-.28.406-.071.77-.107 1.088-.107.218 0 .437.021.655.063.218.041.413.114.585.218s.313.244.422.419c.109.175.163.391.163.65 0 .424-.132.745-.396.961a1.434 1.434 0 01-.938.325c-.352 0-.656-.1-.912-.3-.256-.2-.43-.453-.523-.762l-1.925.588c.1.35.258.664.472.943.214.279.47.514.767.706.298.191.63.339.995.443.365.104.749.156 1.151.156.437 0 .86-.064 1.272-.193.41-.13.778-.323 1.1-.581a2.8 2.8 0 00.775-.981c.193-.396.29-.864.29-1.405z' fill='%231EBC61' fill-rule='nonzero'/%3E%3C/g%3E%3C/svg%3E");width:1.8em;height:1.8em;margin-left:1em}.ck-inspector .ck-inspector-navbox__navigation__toggle{margin-right:1em}.ck-inspector .ck-inspector-navbox__navigation__toggle.ck-inspector-navbox__navigation__toggle_up{transform:rotate(180deg)}.ck-inspector .ck-inspector-editor-selector{margin-left:auto;margin-right:.3em}@media screen and (max-width:680px){.ck-inspector .ck-inspector-editor-selector label{display:none}}.ck-inspector .ck-inspector-editor-selector select{margin-left:.5em}.ck-inspector .ck-inspector-code,.ck-inspector .ck-inspector-code *{font-size:var(--ck-inspector-code-font-size);font-family:var(--ck-inspector-code-font-family);cursor:default}.ck-inspector a{color:var(--ck-inspector-color-link);text-decoration:none}.ck-inspector a:hover{text-decoration:underline;cursor:pointer}.ck-inspector button{outline:0}.ck-inspector .ck-inspector-separator{border-right:1px solid var(--ck-inspector-color-border);display:inline-block;width:0;height:20px;margin:0 .5em;vertical-align:middle}`, ""]);
      }, function(p, i, u) {
        var c = u(49), r = { childContextTypes: !0, contextType: !0, contextTypes: !0, defaultProps: !0, displayName: !0, getDefaultProps: !0, getDerivedStateFromError: !0, getDerivedStateFromProps: !0, mixins: !0, propTypes: !0, type: !0 }, _ = { name: !0, length: !0, prototype: !0, caller: !0, callee: !0, arguments: !0, arity: !0 }, g = { $$typeof: !0, compare: !0, defaultProps: !0, displayName: !0, propTypes: !0, type: !0 }, y = {};
        function v(j) {
          return c.isMemo(j) ? g : y[j.$$typeof] || r;
        }
        y[c.ForwardRef] = { $$typeof: !0, render: !0, defaultProps: !0, displayName: !0, propTypes: !0 }, y[c.Memo] = g;
        var b = Object.defineProperty, C = Object.getOwnPropertyNames, x = Object.getOwnPropertySymbols, N = Object.getOwnPropertyDescriptor, G = Object.getPrototypeOf, K = Object.prototype;
        p.exports = function j(B, P, M) {
          if (typeof P != "string") {
            if (K) {
              var V = G(P);
              V && V !== K && j(B, V, M);
            }
            var A = C(P);
            x && (A = A.concat(x(P)));
            for (var J = v(B), Q = v(P), z = 0; z < A.length; ++z) {
              var I = A[z];
              if (!(_[I] || M && M[I] || Q && Q[I] || J && J[I])) {
                var ae = N(P, I);
                try {
                  b(B, I, ae);
                } catch {
                }
              }
            }
          }
          return B;
        };
      }, function(p, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.getBoundPosition = function(g, y, v) {
          if (!g.props.bounds) return [y, v];
          var b = g.props.bounds;
          b = typeof b == "string" ? b : function(B) {
            return { left: B.left, top: B.top, right: B.right, bottom: B.bottom };
          }(b);
          var C = _(g);
          if (typeof b == "string") {
            var x, N = C.ownerDocument, G = N.defaultView;
            if (!((x = b === "parent" ? C.parentNode : N.querySelector(b)) instanceof G.HTMLElement)) throw new Error('Bounds selector "' + b + '" could not find an element.');
            var K = G.getComputedStyle(C), j = G.getComputedStyle(x);
            b = { left: -C.offsetLeft + (0, c.int)(j.paddingLeft) + (0, c.int)(K.marginLeft), top: -C.offsetTop + (0, c.int)(j.paddingTop) + (0, c.int)(K.marginTop), right: (0, r.innerWidth)(x) - (0, r.outerWidth)(C) - C.offsetLeft + (0, c.int)(j.paddingRight) - (0, c.int)(K.marginRight), bottom: (0, r.innerHeight)(x) - (0, r.outerHeight)(C) - C.offsetTop + (0, c.int)(j.paddingBottom) - (0, c.int)(K.marginBottom) };
          }
          return (0, c.isNum)(b.right) && (y = Math.min(y, b.right)), (0, c.isNum)(b.bottom) && (v = Math.min(v, b.bottom)), (0, c.isNum)(b.left) && (y = Math.max(y, b.left)), (0, c.isNum)(b.top) && (v = Math.max(v, b.top)), [y, v];
        }, i.snapToGrid = function(g, y, v) {
          var b = Math.round(y / g[0]) * g[0], C = Math.round(v / g[1]) * g[1];
          return [b, C];
        }, i.canDragX = function(g) {
          return g.props.axis === "both" || g.props.axis === "x";
        }, i.canDragY = function(g) {
          return g.props.axis === "both" || g.props.axis === "y";
        }, i.getControlPosition = function(g, y, v) {
          var b = typeof y == "number" ? (0, r.getTouch)(g, y) : null;
          if (typeof y == "number" && !b) return null;
          var C = _(v), x = v.props.offsetParent || C.offsetParent || C.ownerDocument.body;
          return (0, r.offsetXYFromParent)(b || g, x, v.props.scale);
        }, i.createCoreData = function(g, y, v) {
          var b = g.state, C = !(0, c.isNum)(b.lastX), x = _(g);
          return C ? { node: x, deltaX: 0, deltaY: 0, lastX: y, lastY: v, x: y, y: v } : { node: x, deltaX: y - b.lastX, deltaY: v - b.lastY, lastX: b.lastX, lastY: b.lastY, x: y, y: v };
        }, i.createDraggableData = function(g, y) {
          var v = g.props.scale;
          return { node: y.node, x: g.state.x + y.deltaX / v, y: g.state.y + y.deltaY / v, deltaX: y.deltaX / v, deltaY: y.deltaY / v, lastX: g.state.x, lastY: g.state.y };
        };
        var c = u(20), r = u(32);
        function _(g) {
          var y = g.findDOMNode();
          if (!y) throw new Error("<DraggableCore>: Unmounted during event!");
          return y;
        }
      }, function(p, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.default = function() {
        };
      }, function(p, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.default = function y(v) {
          return [].slice.call(v.querySelectorAll("*"), 0).reduce(function(b, C) {
            return b.concat(C.shadowRoot ? y(C.shadowRoot) : [C]);
          }, []).filter(g);
        };
        var c = /input|select|textarea|button|object|iframe/;
        function r(y) {
          var v = y.offsetWidth <= 0 && y.offsetHeight <= 0;
          if (v && !y.innerHTML) return !0;
          try {
            var b = window.getComputedStyle(y);
            return v ? b.getPropertyValue("overflow") !== "visible" || y.scrollWidth <= 0 && y.scrollHeight <= 0 : b.getPropertyValue("display") == "none";
          } catch {
            return console.warn("Failed to inspect element style"), !1;
          }
        }
        function _(y, v) {
          var b = y.nodeName.toLowerCase();
          return (c.test(b) && !y.disabled || b === "a" && y.href || v) && function(C) {
            for (var x = C, N = C.getRootNode && C.getRootNode(); x && x !== document.body; ) {
              if (N && x === N && (x = N.host.parentNode), r(x)) return !1;
              x = x.parentNode;
            }
            return !0;
          }(y);
        }
        function g(y) {
          var v = y.getAttribute("tabindex");
          v === null && (v = void 0);
          var b = isNaN(v);
          return (b || v >= 0) && _(y, !b);
        }
        p.exports = i.default;
      }, function(p, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.resetState = function() {
          y && (y.removeAttribute ? y.removeAttribute("aria-hidden") : y.length != null ? y.forEach(function(C) {
            return C.removeAttribute("aria-hidden");
          }) : document.querySelectorAll(y).forEach(function(C) {
            return C.removeAttribute("aria-hidden");
          })), y = null;
        }, i.log = function() {
        }, i.assertNodeList = v, i.setElement = function(C) {
          var x = C;
          if (typeof x == "string" && g.canUseDOM) {
            var N = document.querySelectorAll(x);
            v(N, x), x = N;
          }
          return y = x || y;
        }, i.validateElement = b, i.hide = function(C) {
          var x = !0, N = !1, G = void 0;
          try {
            for (var K, j = b(C)[Symbol.iterator](); !(x = (K = j.next()).done); x = !0)
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
            for (var K, j = b(C)[Symbol.iterator](); !(x = (K = j.next()).done); x = !0)
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
          y = null;
        };
        var c, r = u(81), _ = (c = r) && c.__esModule ? c : { default: c }, g = u(36), y = null;
        function v(C, x) {
          if (!C || !C.length) throw new Error("react-modal: No elements were found for selector " + x + ".");
        }
        function b(C) {
          var x = C || y;
          return x ? Array.isArray(x) || x instanceof HTMLCollection || x instanceof NodeList ? x : [x] : ((0, _.default)(!1, ["react-modal: App element is not defined.", "Please use `Modal.setAppElement(el)` or set `appElement={el}`.", "This is needed so screen readers don't see main content", "when modal is opened. It is not recommended, but you can opt-out", "by setting `ariaHideApp={false}`."].join(" ")), []);
        }
      }, function(p, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.log = function() {
          console.log("portalOpenInstances ----------"), console.log(r.openInstances.length), r.openInstances.forEach(function(_) {
            return console.log(_);
          }), console.log("end portalOpenInstances ----------");
        }, i.resetState = function() {
          r = new c();
        };
        var c = function _() {
          var g = this;
          (function(y, v) {
            if (!(y instanceof v)) throw new TypeError("Cannot call a class as a function");
          })(this, _), this.register = function(y) {
            g.openInstances.indexOf(y) === -1 && (g.openInstances.push(y), g.emit("register"));
          }, this.deregister = function(y) {
            var v = g.openInstances.indexOf(y);
            v !== -1 && (g.openInstances.splice(v, 1), g.emit("deregister"));
          }, this.subscribe = function(y) {
            g.subscribers.push(y);
          }, this.emit = function(y) {
            g.subscribers.forEach(function(v) {
              return v(y, g.openInstances.slice());
            });
          }, this.openInstances = [], this.subscribers = [];
        }, r = new c();
        i.default = r;
      }, function(p, i, u) {
        p.exports = u(51);
      }, function(p, i, u) {
        var c = u(52), r = c.default, _ = c.DraggableCore;
        p.exports = r, p.exports.default = r, p.exports.DraggableCore = _;
      }, function(p, i, u) {
        var c = u(76), r = { "text/plain": "Text", "text/html": "Url", default: "Text" };
        p.exports = function(_, g) {
          var y, v, b, C, x, N, G = !1;
          g || (g = {}), y = g.debug || !1;
          try {
            if (b = c(), C = document.createRange(), x = document.getSelection(), (N = document.createElement("span")).textContent = _, N.style.all = "unset", N.style.position = "fixed", N.style.top = 0, N.style.clip = "rect(0, 0, 0, 0)", N.style.whiteSpace = "pre", N.style.webkitUserSelect = "text", N.style.MozUserSelect = "text", N.style.msUserSelect = "text", N.style.userSelect = "text", N.addEventListener("copy", function(K) {
              if (K.stopPropagation(), g.format) if (K.preventDefault(), K.clipboardData === void 0) {
                y && console.warn("unable to use e.clipboardData"), y && console.warn("trying IE specific stuff"), window.clipboardData.clearData();
                var j = r[g.format] || r.default;
                window.clipboardData.setData(j, _);
              } else K.clipboardData.clearData(), K.clipboardData.setData(g.format, _);
              g.onCopy && (K.preventDefault(), g.onCopy(K.clipboardData));
            }), document.body.appendChild(N), C.selectNodeContents(N), x.addRange(C), !document.execCommand("copy")) throw new Error("copy command was unsuccessful");
            G = !0;
          } catch (K) {
            y && console.error("unable to copy using execCommand: ", K), y && console.warn("trying IE specific stuff");
            try {
              window.clipboardData.setData(g.format || "text", _), g.onCopy && g.onCopy(window.clipboardData), G = !0;
            } catch (j) {
              y && console.error("unable to copy using clipboardData: ", j), y && console.error("falling back to prompt"), v = function(B) {
                var P = (/mac os x/i.test(navigator.userAgent) ? "⌘" : "Ctrl") + "+C";
                return B.replace(/#{\s*key\s*}/g, P);
              }("message" in g ? g.message : "Copy to clipboard: #{key}, Enter"), window.prompt(v, _);
            }
          } finally {
            x && (typeof x.removeRange == "function" ? x.removeRange(C) : x.removeAllRanges()), N && document.body.removeChild(N), b();
          }
          return G;
        };
      }, function(p, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 });
        var c, r = u(77), _ = (c = r) && c.__esModule ? c : { default: c };
        i.default = _.default, p.exports = i.default;
      }, function(p, i, u) {
        p.exports = u(50);
      }, function(p, i, u) {
        var c = typeof Symbol == "function" && Symbol.for, r = c ? Symbol.for("react.element") : 60103, _ = c ? Symbol.for("react.portal") : 60106, g = c ? Symbol.for("react.fragment") : 60107, y = c ? Symbol.for("react.strict_mode") : 60108, v = c ? Symbol.for("react.profiler") : 60114, b = c ? Symbol.for("react.provider") : 60109, C = c ? Symbol.for("react.context") : 60110, x = c ? Symbol.for("react.async_mode") : 60111, N = c ? Symbol.for("react.concurrent_mode") : 60111, G = c ? Symbol.for("react.forward_ref") : 60112, K = c ? Symbol.for("react.suspense") : 60113, j = c ? Symbol.for("react.suspense_list") : 60120, B = c ? Symbol.for("react.memo") : 60115, P = c ? Symbol.for("react.lazy") : 60116, M = c ? Symbol.for("react.block") : 60121, V = c ? Symbol.for("react.fundamental") : 60117, A = c ? Symbol.for("react.responder") : 60118, J = c ? Symbol.for("react.scope") : 60119;
        function Q(I) {
          if (typeof I == "object" && I !== null) {
            var ae = I.$$typeof;
            switch (ae) {
              case r:
                switch (I = I.type) {
                  case x:
                  case N:
                  case g:
                  case v:
                  case y:
                  case K:
                    return I;
                  default:
                    switch (I = I && I.$$typeof) {
                      case C:
                      case G:
                      case P:
                      case B:
                      case b:
                        return I;
                      default:
                        return ae;
                    }
                }
              case _:
                return ae;
            }
          }
        }
        function z(I) {
          return Q(I) === N;
        }
        i.AsyncMode = x, i.ConcurrentMode = N, i.ContextConsumer = C, i.ContextProvider = b, i.Element = r, i.ForwardRef = G, i.Fragment = g, i.Lazy = P, i.Memo = B, i.Portal = _, i.Profiler = v, i.StrictMode = y, i.Suspense = K, i.isAsyncMode = function(I) {
          return z(I) || Q(I) === x;
        }, i.isConcurrentMode = z, i.isContextConsumer = function(I) {
          return Q(I) === C;
        }, i.isContextProvider = function(I) {
          return Q(I) === b;
        }, i.isElement = function(I) {
          return typeof I == "object" && I !== null && I.$$typeof === r;
        }, i.isForwardRef = function(I) {
          return Q(I) === G;
        }, i.isFragment = function(I) {
          return Q(I) === g;
        }, i.isLazy = function(I) {
          return Q(I) === P;
        }, i.isMemo = function(I) {
          return Q(I) === B;
        }, i.isPortal = function(I) {
          return Q(I) === _;
        }, i.isProfiler = function(I) {
          return Q(I) === v;
        }, i.isStrictMode = function(I) {
          return Q(I) === y;
        }, i.isSuspense = function(I) {
          return Q(I) === K;
        }, i.isValidElementType = function(I) {
          return typeof I == "string" || typeof I == "function" || I === g || I === N || I === v || I === y || I === K || I === j || typeof I == "object" && I !== null && (I.$$typeof === P || I.$$typeof === B || I.$$typeof === b || I.$$typeof === C || I.$$typeof === G || I.$$typeof === V || I.$$typeof === A || I.$$typeof === J || I.$$typeof === M);
        }, i.typeOf = Q;
      }, function(p, i, u) {
        var c = 60103, r = 60106, _ = 60107, g = 60108, y = 60114, v = 60109, b = 60110, C = 60112, x = 60113, N = 60120, G = 60115, K = 60116, j = 60121, B = 60122, P = 60117, M = 60129, V = 60131;
        if (typeof Symbol == "function" && Symbol.for) {
          var A = Symbol.for;
          c = A("react.element"), r = A("react.portal"), _ = A("react.fragment"), g = A("react.strict_mode"), y = A("react.profiler"), v = A("react.provider"), b = A("react.context"), C = A("react.forward_ref"), x = A("react.suspense"), N = A("react.suspense_list"), G = A("react.memo"), K = A("react.lazy"), j = A("react.block"), B = A("react.server.block"), P = A("react.fundamental"), M = A("react.debug_trace_mode"), V = A("react.legacy_hidden");
        }
        function J(R) {
          if (typeof R == "object" && R !== null) {
            var ie = R.$$typeof;
            switch (ie) {
              case c:
                switch (R = R.type) {
                  case _:
                  case y:
                  case g:
                  case x:
                  case N:
                    return R;
                  default:
                    switch (R = R && R.$$typeof) {
                      case b:
                      case C:
                      case K:
                      case G:
                      case v:
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
        var Q = v, z = c, I = C, ae = _, le = K, ne = G, ce = r, be = y, ee = g, de = x;
        i.ContextConsumer = b, i.ContextProvider = Q, i.Element = z, i.ForwardRef = I, i.Fragment = ae, i.Lazy = le, i.Memo = ne, i.Portal = ce, i.Profiler = be, i.StrictMode = ee, i.Suspense = de, i.isAsyncMode = function() {
          return !1;
        }, i.isConcurrentMode = function() {
          return !1;
        }, i.isContextConsumer = function(R) {
          return J(R) === b;
        }, i.isContextProvider = function(R) {
          return J(R) === v;
        }, i.isElement = function(R) {
          return typeof R == "object" && R !== null && R.$$typeof === c;
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
          return J(R) === y;
        }, i.isStrictMode = function(R) {
          return J(R) === g;
        }, i.isSuspense = function(R) {
          return J(R) === x;
        }, i.isValidElementType = function(R) {
          return typeof R == "string" || typeof R == "function" || R === _ || R === y || R === M || R === g || R === x || R === N || R === V || typeof R == "object" && R !== null && (R.$$typeof === K || R.$$typeof === G || R.$$typeof === v || R.$$typeof === b || R.$$typeof === C || R.$$typeof === P || R.$$typeof === j || R[0] === B);
        }, i.typeOf = J;
      }, function(p, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), Object.defineProperty(i, "DraggableCore", { enumerable: !0, get: function() {
          return C.default;
        } }), i.default = void 0;
        var c = function(ee) {
          if (ee && ee.__esModule) return ee;
          if (ee === null || K(ee) !== "object" && typeof ee != "function") return { default: ee };
          var de = G();
          if (de && de.has(ee)) return de.get(ee);
          var R = {}, ie = Object.defineProperty && Object.getOwnPropertyDescriptor;
          for (var ye in ee) if (Object.prototype.hasOwnProperty.call(ee, ye)) {
            var Te = ie ? Object.getOwnPropertyDescriptor(ee, ye) : null;
            Te && (Te.get || Te.set) ? Object.defineProperty(R, ye, Te) : R[ye] = ee[ye];
          }
          return R.default = ee, de && de.set(ee, R), R;
        }(u(0)), r = N(u(18)), _ = N(u(12)), g = N(u(55)), y = u(32), v = u(40), b = u(20), C = N(u(57)), x = N(u(41));
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
        function B(ee, de) {
          if (ee == null) return {};
          var R, ie, ye = function(we, Pe) {
            if (we == null) return {};
            var Se, ze, Je = {}, X = Object.keys(we);
            for (ze = 0; ze < X.length; ze++) Se = X[ze], Pe.indexOf(Se) >= 0 || (Je[Se] = we[Se]);
            return Je;
          }(ee, de);
          if (Object.getOwnPropertySymbols) {
            var Te = Object.getOwnPropertySymbols(ee);
            for (ie = 0; ie < Te.length; ie++) R = Te[ie], de.indexOf(R) >= 0 || Object.prototype.propertyIsEnumerable.call(ee, R) && (ye[R] = ee[R]);
          }
          return ye;
        }
        function P(ee, de) {
          return function(R) {
            if (Array.isArray(R)) return R;
          }(ee) || function(R, ie) {
            if (!(typeof Symbol > "u" || !(Symbol.iterator in Object(R)))) {
              var ye = [], Te = !0, we = !1, Pe = void 0;
              try {
                for (var Se, ze = R[Symbol.iterator](); !(Te = (Se = ze.next()).done) && (ye.push(Se.value), !ie || ye.length !== ie); Te = !0) ;
              } catch (Je) {
                we = !0, Pe = Je;
              } finally {
                try {
                  Te || ze.return == null || ze.return();
                } finally {
                  if (we) throw Pe;
                }
              }
              return ye;
            }
          }(ee, de) || function(R, ie) {
            if (R) {
              if (typeof R == "string") return M(R, ie);
              var ye = Object.prototype.toString.call(R).slice(8, -1);
              if (ye === "Object" && R.constructor && (ye = R.constructor.name), ye === "Map" || ye === "Set") return Array.from(R);
              if (ye === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(ye)) return M(R, ie);
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
        function V(ee, de) {
          var R = Object.keys(ee);
          if (Object.getOwnPropertySymbols) {
            var ie = Object.getOwnPropertySymbols(ee);
            de && (ie = ie.filter(function(ye) {
              return Object.getOwnPropertyDescriptor(ee, ye).enumerable;
            })), R.push.apply(R, ie);
          }
          return R;
        }
        function A(ee) {
          for (var de = 1; de < arguments.length; de++) {
            var R = arguments[de] != null ? arguments[de] : {};
            de % 2 ? V(Object(R), !0).forEach(function(ie) {
              ce(ee, ie, R[ie]);
            }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(ee, Object.getOwnPropertyDescriptors(R)) : V(Object(R)).forEach(function(ie) {
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
        function I(ee) {
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
              var ye = ne(this).constructor;
              R = Reflect.construct(ie, arguments, ye);
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
        var be = function(ee) {
          (function(ie, ye) {
            if (typeof ye != "function" && ye !== null) throw new TypeError("Super expression must either be null or a function");
            ie.prototype = Object.create(ye && ye.prototype, { constructor: { value: ie, writable: !0, configurable: !0 } }), ye && z(ie, ye);
          })(R, ee);
          var de = I(R);
          function R(ie) {
            var ye;
            return function(Te, we) {
              if (!(Te instanceof we)) throw new TypeError("Cannot call a class as a function");
            }(this, R), ce(le(ye = de.call(this, ie)), "onDragStart", function(Te, we) {
              if ((0, x.default)("Draggable: onDragStart: %j", we), ye.props.onStart(Te, (0, v.createDraggableData)(le(ye), we)) === !1) return !1;
              ye.setState({ dragging: !0, dragged: !0 });
            }), ce(le(ye), "onDrag", function(Te, we) {
              if (!ye.state.dragging) return !1;
              (0, x.default)("Draggable: onDrag: %j", we);
              var Pe = (0, v.createDraggableData)(le(ye), we), Se = { x: Pe.x, y: Pe.y };
              if (ye.props.bounds) {
                var ze = Se.x, Je = Se.y;
                Se.x += ye.state.slackX, Se.y += ye.state.slackY;
                var X = P((0, v.getBoundPosition)(le(ye), Se.x, Se.y), 2), q = X[0], me = X[1];
                Se.x = q, Se.y = me, Se.slackX = ye.state.slackX + (ze - Se.x), Se.slackY = ye.state.slackY + (Je - Se.y), Pe.x = Se.x, Pe.y = Se.y, Pe.deltaX = Se.x - ye.state.x, Pe.deltaY = Se.y - ye.state.y;
              }
              if (ye.props.onDrag(Te, Pe) === !1) return !1;
              ye.setState(Se);
            }), ce(le(ye), "onDragStop", function(Te, we) {
              if (!ye.state.dragging || ye.props.onStop(Te, (0, v.createDraggableData)(le(ye), we)) === !1) return !1;
              (0, x.default)("Draggable: onDragStop: %j", we);
              var Pe = { dragging: !1, slackX: 0, slackY: 0 };
              if (ye.props.position) {
                var Se = ye.props.position, ze = Se.x, Je = Se.y;
                Pe.x = ze, Pe.y = Je;
              }
              ye.setState(Pe);
            }), ye.state = { dragging: !1, dragged: !1, x: ie.position ? ie.position.x : ie.defaultPosition.x, y: ie.position ? ie.position.y : ie.defaultPosition.y, prevPropsPosition: A({}, ie.position), slackX: 0, slackY: 0, isElementSVG: !1 }, !ie.position || ie.onDrag || ie.onStop || console.warn("A `position` was applied to this <Draggable>, without drag handlers. This will make this component effectively undraggable. Please attach `onDrag` or `onStop` handlers so you can adjust the `position` of this element."), ye;
          }
          return Q(R, null, [{ key: "getDerivedStateFromProps", value: function(ie, ye) {
            var Te = ie.position, we = ye.prevPropsPosition;
            return !Te || we && Te.x === we.x && Te.y === we.y ? null : ((0, x.default)("Draggable: getDerivedStateFromProps %j", { position: Te, prevPropsPosition: we }), { x: Te.x, y: Te.y, prevPropsPosition: A({}, Te) });
          } }]), Q(R, [{ key: "componentDidMount", value: function() {
            window.SVGElement !== void 0 && this.findDOMNode() instanceof window.SVGElement && this.setState({ isElementSVG: !0 });
          } }, { key: "componentWillUnmount", value: function() {
            this.setState({ dragging: !1 });
          } }, { key: "findDOMNode", value: function() {
            return this.props.nodeRef ? this.props.nodeRef.current : _.default.findDOMNode(this);
          } }, { key: "render", value: function() {
            var ie, ye = this.props, Te = (ye.axis, ye.bounds, ye.children), we = ye.defaultPosition, Pe = ye.defaultClassName, Se = ye.defaultClassNameDragging, ze = ye.defaultClassNameDragged, Je = ye.position, X = ye.positionOffset, q = (ye.scale, B(ye, ["axis", "bounds", "children", "defaultPosition", "defaultClassName", "defaultClassNameDragging", "defaultClassNameDragged", "position", "positionOffset", "scale"])), me = {}, l = null, f = !Je || this.state.dragging, w = Je || we, U = { x: (0, v.canDragX)(this) && f ? this.state.x : w.x, y: (0, v.canDragY)(this) && f ? this.state.y : w.y };
            this.state.isElementSVG ? l = (0, y.createSVGTransform)(U, X) : me = (0, y.createCSSTransform)(U, X);
            var F = (0, g.default)(Te.props.className || "", Pe, (ce(ie = {}, Se, this.state.dragging), ce(ie, ze, this.state.dragged), ie));
            return c.createElement(C.default, j({}, q, { onStart: this.onDragStart, onDrag: this.onDrag, onStop: this.onDragStop }), c.cloneElement(c.Children.only(Te), { className: F, style: A(A({}, Te.props.style), me), transform: l }));
          } }]), R;
        }(c.Component);
        i.default = be, ce(be, "displayName", "Draggable"), ce(be, "propTypes", A(A({}, C.default.propTypes), {}, { axis: r.default.oneOf(["both", "x", "y", "none"]), bounds: r.default.oneOfType([r.default.shape({ left: r.default.number, right: r.default.number, top: r.default.number, bottom: r.default.number }), r.default.string, r.default.oneOf([!1])]), defaultClassName: r.default.string, defaultClassNameDragging: r.default.string, defaultClassNameDragged: r.default.string, defaultPosition: r.default.shape({ x: r.default.number, y: r.default.number }), positionOffset: r.default.shape({ x: r.default.oneOfType([r.default.number, r.default.string]), y: r.default.oneOfType([r.default.number, r.default.string]) }), position: r.default.shape({ x: r.default.number, y: r.default.number }), className: b.dontSetMe, style: b.dontSetMe, transform: b.dontSetMe })), ce(be, "defaultProps", A(A({}, C.default.defaultProps), {}, { axis: "both", bounds: !1, defaultClassName: "react-draggable", defaultClassNameDragging: "react-draggable-dragging", defaultClassNameDragged: "react-draggable-dragged", defaultPosition: { x: 0, y: 0 }, position: null, scale: 1 }));
      }, function(p, i, u) {
        var c = u(54);
        function r() {
        }
        function _() {
        }
        _.resetWarningCache = r, p.exports = function() {
          function g(b, C, x, N, G, K) {
            if (K !== c) {
              var j = new Error("Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types");
              throw j.name = "Invariant Violation", j;
            }
          }
          function y() {
            return g;
          }
          g.isRequired = g;
          var v = { array: g, bigint: g, bool: g, func: g, number: g, object: g, string: g, symbol: g, any: g, arrayOf: y, element: g, elementType: g, instanceOf: y, node: g, objectOf: y, oneOf: y, oneOfType: y, shape: y, exact: y, checkPropTypes: _, resetWarningCache: r };
          return v.PropTypes = v, v;
        };
      }, function(p, i, u) {
        p.exports = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
      }, function(p, i, u) {
        var c;
        (function() {
          var r = {}.hasOwnProperty;
          function _() {
            for (var g = [], y = 0; y < arguments.length; y++) {
              var v = arguments[y];
              if (v) {
                var b = typeof v;
                if (b === "string" || b === "number") g.push(v);
                else if (Array.isArray(v)) {
                  if (v.length) {
                    var C = _.apply(null, v);
                    C && g.push(C);
                  }
                } else if (b === "object") if (v.toString === Object.prototype.toString) for (var x in v) r.call(v, x) && v[x] && g.push(x);
                else g.push(v.toString());
              }
            }
            return g.join(" ");
          }
          p.exports ? (_.default = _, p.exports = _) : (c = (function() {
            return _;
          }).apply(i, [])) === void 0 || (p.exports = c);
        })();
      }, function(p, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.getPrefix = r, i.browserPrefixToKey = _, i.browserPrefixToStyle = function(y, v) {
          return v ? "-".concat(v.toLowerCase(), "-").concat(y) : y;
        }, i.default = void 0;
        var c = ["Moz", "Webkit", "O", "ms"];
        function r() {
          var y = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "transform";
          if (typeof window > "u" || window.document === void 0) return "";
          var v = window.document.documentElement.style;
          if (y in v) return "";
          for (var b = 0; b < c.length; b++) if (_(y, c[b]) in v) return c[b];
          return "";
        }
        function _(y, v) {
          return v ? "".concat(v).concat(function(b) {
            for (var C = "", x = !0, N = 0; N < b.length; N++) x ? (C += b[N].toUpperCase(), x = !1) : b[N] === "-" ? x = !0 : C += b[N];
            return C;
          }(y)) : y;
        }
        var g = r();
        i.default = g;
      }, function(p, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.default = void 0;
        var c = function(ne) {
          if (ne && ne.__esModule) return ne;
          if (ne === null || N(ne) !== "object" && typeof ne != "function") return { default: ne };
          var ce = x();
          if (ce && ce.has(ne)) return ce.get(ne);
          var be = {}, ee = Object.defineProperty && Object.getOwnPropertyDescriptor;
          for (var de in ne) if (Object.prototype.hasOwnProperty.call(ne, de)) {
            var R = ee ? Object.getOwnPropertyDescriptor(ne, de) : null;
            R && (R.get || R.set) ? Object.defineProperty(be, de, R) : be[de] = ne[de];
          }
          return be.default = ne, ce && ce.set(ne, be), be;
        }(u(0)), r = C(u(18)), _ = C(u(12)), g = u(32), y = u(40), v = u(20), b = C(u(41));
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
          return function(be) {
            if (Array.isArray(be)) return be;
          }(ne) || function(be, ee) {
            if (!(typeof Symbol > "u" || !(Symbol.iterator in Object(be)))) {
              var de = [], R = !0, ie = !1, ye = void 0;
              try {
                for (var Te, we = be[Symbol.iterator](); !(R = (Te = we.next()).done) && (de.push(Te.value), !ee || de.length !== ee); R = !0) ;
              } catch (Pe) {
                ie = !0, ye = Pe;
              } finally {
                try {
                  R || we.return == null || we.return();
                } finally {
                  if (ie) throw ye;
                }
              }
              return de;
            }
          }(ne, ce) || function(be, ee) {
            if (be) {
              if (typeof be == "string") return K(be, ee);
              var de = Object.prototype.toString.call(be).slice(8, -1);
              if (de === "Object" && be.constructor && (de = be.constructor.name), de === "Map" || de === "Set") return Array.from(be);
              if (de === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(de)) return K(be, ee);
            }
          }(ne, ce) || function() {
            throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
          }();
        }
        function K(ne, ce) {
          (ce == null || ce > ne.length) && (ce = ne.length);
          for (var be = 0, ee = new Array(ce); be < ce; be++) ee[be] = ne[be];
          return ee;
        }
        function j(ne, ce) {
          if (!(ne instanceof ce)) throw new TypeError("Cannot call a class as a function");
        }
        function B(ne, ce) {
          for (var be = 0; be < ce.length; be++) {
            var ee = ce[be];
            ee.enumerable = ee.enumerable || !1, ee.configurable = !0, "value" in ee && (ee.writable = !0), Object.defineProperty(ne, ee.key, ee);
          }
        }
        function P(ne, ce) {
          return (P = Object.setPrototypeOf || function(be, ee) {
            return be.__proto__ = ee, be;
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
            var be, ee = J(ne);
            if (ce) {
              var de = J(this).constructor;
              be = Reflect.construct(ee, arguments, de);
            } else be = ee.apply(this, arguments);
            return V(this, be);
          };
        }
        function V(ne, ce) {
          return !ce || N(ce) !== "object" && typeof ce != "function" ? A(ne) : ce;
        }
        function A(ne) {
          if (ne === void 0) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
          return ne;
        }
        function J(ne) {
          return (J = Object.setPrototypeOf ? Object.getPrototypeOf : function(ce) {
            return ce.__proto__ || Object.getPrototypeOf(ce);
          })(ne);
        }
        function Q(ne, ce, be) {
          return ce in ne ? Object.defineProperty(ne, ce, { value: be, enumerable: !0, configurable: !0, writable: !0 }) : ne[ce] = be, ne;
        }
        var z = { start: "touchstart", move: "touchmove", stop: "touchend" }, I = { start: "mousedown", move: "mousemove", stop: "mouseup" }, ae = I, le = function(ne) {
          (function(R, ie) {
            if (typeof ie != "function" && ie !== null) throw new TypeError("Super expression must either be null or a function");
            R.prototype = Object.create(ie && ie.prototype, { constructor: { value: R, writable: !0, configurable: !0 } }), ie && P(R, ie);
          })(de, ne);
          var ce, be, ee = M(de);
          function de() {
            var R;
            j(this, de);
            for (var ie = arguments.length, ye = new Array(ie), Te = 0; Te < ie; Te++) ye[Te] = arguments[Te];
            return Q(A(R = ee.call.apply(ee, [this].concat(ye))), "state", { dragging: !1, lastX: NaN, lastY: NaN, touchIdentifier: null }), Q(A(R), "mounted", !1), Q(A(R), "handleDragStart", function(we) {
              if (R.props.onMouseDown(we), !R.props.allowAnyClick && typeof we.button == "number" && we.button !== 0) return !1;
              var Pe = R.findDOMNode();
              if (!Pe || !Pe.ownerDocument || !Pe.ownerDocument.body) throw new Error("<DraggableCore> not mounted on DragStart!");
              var Se = Pe.ownerDocument;
              if (!(R.props.disabled || !(we.target instanceof Se.defaultView.Node) || R.props.handle && !(0, g.matchesSelectorAndParentsTo)(we.target, R.props.handle, Pe) || R.props.cancel && (0, g.matchesSelectorAndParentsTo)(we.target, R.props.cancel, Pe))) {
                we.type === "touchstart" && we.preventDefault();
                var ze = (0, g.getTouchIdentifier)(we);
                R.setState({ touchIdentifier: ze });
                var Je = (0, y.getControlPosition)(we, ze, A(R));
                if (Je != null) {
                  var X = Je.x, q = Je.y, me = (0, y.createCoreData)(A(R), X, q);
                  (0, b.default)("DraggableCore: handleDragStart: %j", me), (0, b.default)("calling", R.props.onStart), R.props.onStart(we, me) !== !1 && R.mounted !== !1 && (R.props.enableUserSelectHack && (0, g.addUserSelectStyles)(Se), R.setState({ dragging: !0, lastX: X, lastY: q }), (0, g.addEvent)(Se, ae.move, R.handleDrag), (0, g.addEvent)(Se, ae.stop, R.handleDragStop));
                }
              }
            }), Q(A(R), "handleDrag", function(we) {
              var Pe = (0, y.getControlPosition)(we, R.state.touchIdentifier, A(R));
              if (Pe != null) {
                var Se = Pe.x, ze = Pe.y;
                if (Array.isArray(R.props.grid)) {
                  var Je = Se - R.state.lastX, X = ze - R.state.lastY, q = G((0, y.snapToGrid)(R.props.grid, Je, X), 2);
                  if (Je = q[0], X = q[1], !Je && !X) return;
                  Se = R.state.lastX + Je, ze = R.state.lastY + X;
                }
                var me = (0, y.createCoreData)(A(R), Se, ze);
                if ((0, b.default)("DraggableCore: handleDrag: %j", me), R.props.onDrag(we, me) !== !1 && R.mounted !== !1) R.setState({ lastX: Se, lastY: ze });
                else try {
                  R.handleDragStop(new MouseEvent("mouseup"));
                } catch {
                  var l = document.createEvent("MouseEvents");
                  l.initMouseEvent("mouseup", !0, !0, window, 0, 0, 0, 0, 0, !1, !1, !1, !1, 0, null), R.handleDragStop(l);
                }
              }
            }), Q(A(R), "handleDragStop", function(we) {
              if (R.state.dragging) {
                var Pe = (0, y.getControlPosition)(we, R.state.touchIdentifier, A(R));
                if (Pe != null) {
                  var Se = Pe.x, ze = Pe.y, Je = (0, y.createCoreData)(A(R), Se, ze);
                  if (R.props.onStop(we, Je) === !1 || R.mounted === !1) return !1;
                  var X = R.findDOMNode();
                  X && R.props.enableUserSelectHack && (0, g.removeUserSelectStyles)(X.ownerDocument), (0, b.default)("DraggableCore: handleDragStop: %j", Je), R.setState({ dragging: !1, lastX: NaN, lastY: NaN }), X && ((0, b.default)("DraggableCore: Removing handlers"), (0, g.removeEvent)(X.ownerDocument, ae.move, R.handleDrag), (0, g.removeEvent)(X.ownerDocument, ae.stop, R.handleDragStop));
                }
              }
            }), Q(A(R), "onMouseDown", function(we) {
              return ae = I, R.handleDragStart(we);
            }), Q(A(R), "onMouseUp", function(we) {
              return ae = I, R.handleDragStop(we);
            }), Q(A(R), "onTouchStart", function(we) {
              return ae = z, R.handleDragStart(we);
            }), Q(A(R), "onTouchEnd", function(we) {
              return ae = z, R.handleDragStop(we);
            }), R;
          }
          return ce = de, (be = [{ key: "componentDidMount", value: function() {
            this.mounted = !0;
            var R = this.findDOMNode();
            R && (0, g.addEvent)(R, z.start, this.onTouchStart, { passive: !1 });
          } }, { key: "componentWillUnmount", value: function() {
            this.mounted = !1;
            var R = this.findDOMNode();
            if (R) {
              var ie = R.ownerDocument;
              (0, g.removeEvent)(ie, I.move, this.handleDrag), (0, g.removeEvent)(ie, z.move, this.handleDrag), (0, g.removeEvent)(ie, I.stop, this.handleDragStop), (0, g.removeEvent)(ie, z.stop, this.handleDragStop), (0, g.removeEvent)(R, z.start, this.onTouchStart, { passive: !1 }), this.props.enableUserSelectHack && (0, g.removeUserSelectStyles)(ie);
            }
          } }, { key: "findDOMNode", value: function() {
            return this.props.nodeRef ? this.props.nodeRef.current : _.default.findDOMNode(this);
          } }, { key: "render", value: function() {
            return c.cloneElement(c.Children.only(this.props.children), { onMouseDown: this.onMouseDown, onMouseUp: this.onMouseUp, onTouchEnd: this.onTouchEnd });
          } }]) && B(ce.prototype, be), de;
        }(c.Component);
        i.default = le, Q(le, "displayName", "DraggableCore"), Q(le, "propTypes", { allowAnyClick: r.default.bool, disabled: r.default.bool, enableUserSelectHack: r.default.bool, offsetParent: function(ne, ce) {
          if (ne[ce] && ne[ce].nodeType !== 1) throw new Error("Draggable's offsetParent must be a DOM Node.");
        }, grid: r.default.arrayOf(r.default.number), handle: r.default.string, cancel: r.default.string, nodeRef: r.default.object, onStart: r.default.func, onDrag: r.default.func, onStop: r.default.func, onMouseDown: r.default.func, scale: r.default.number, className: v.dontSetMe, style: v.dontSetMe, transform: v.dontSetMe }), Q(le, "defaultProps", { allowAnyClick: !1, cancel: null, disabled: !1, enableUserSelectHack: !0, offsetParent: null, handle: null, grid: null, transform: null, onStart: function() {
        }, onDrag: function() {
        }, onStop: function() {
        }, onMouseDown: function() {
        }, scale: 1 });
      }, function(p, i, u) {
        var c = u(6), r = u(59);
        typeof (r = r.__esModule ? r.default : r) == "string" && (r = [[p.i, r, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(r, _), p.exports = r.locals || {};
      }, function(p, i, u) {
        (p.exports = u(7)(!1)).push([p.i, ".ck-inspector{--ck-inspector-color-tab-background-hover:rgba(0,0,0,0.07);--ck-inspector-color-tab-active-border:#0dacef }.ck-inspector .ck-inspector-horizontal-nav{display:flex;flex-direction:row;user-select:none;align-self:stretch}.ck-inspector .ck-inspector-horizontal-nav .ck-inspector-horizontal-nav__item{-webkit-appearance:none;background:none;border:0;border-bottom:2px solid transparent;padding:.5em 1em;align-self:stretch}.ck-inspector .ck-inspector-horizontal-nav .ck-inspector-horizontal-nav__item:hover{background:var(--ck-inspector-color-tab-background-hover)}.ck-inspector .ck-inspector-horizontal-nav .ck-inspector-horizontal-nav__item.ck-inspector-horizontal-nav__item_active{border-bottom-color:var(--ck-inspector-color-tab-active-border)}", ""]);
      }, function(p, i, u) {
        var c = u(6), r = u(61);
        typeof (r = r.__esModule ? r.default : r) == "string" && (r = [[p.i, r, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(r, _), p.exports = r.locals || {};
      }, function(p, i, u) {
        (p.exports = u(7)(!1)).push([p.i, ".ck-inspector{--ck-inspector-navbox-empty-background:#fafafa}.ck-inspector .ck-inspector-navbox{display:flex;flex-direction:column;height:100%;align-items:stretch}.ck-inspector .ck-inspector-navbox .ck-inspector-navbox__navigation{display:flex;flex-direction:row;flex-wrap:nowrap;align-items:stretch;min-height:30px;max-height:30px;border-bottom:1px solid var(--ck-inspector-color-border);width:100%;user-select:none;align-items:center}.ck-inspector .ck-inspector-navbox .ck-inspector-navbox__content{display:flex;flex-direction:row;height:100%;overflow:hidden}", ""]);
      }, function(p, i, u) {
        var c = u(6), r = u(63);
        typeof (r = r.__esModule ? r.default : r) == "string" && (r = [[p.i, r, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(r, _), p.exports = r.locals || {};
      }, function(p, i, u) {
        (p.exports = u(7)(!1)).push([p.i, ".ck-inspector{--ck-inspector-icon-size:19px;--ck-inspector-button-size:calc(4px + var(--ck-inspector-icon-size));--ck-inspector-color-button:#777;--ck-inspector-color-button-hover:#222;--ck-inspector-color-button-on:#0f79e2}.ck-inspector .ck-inspector-button{width:var(--ck-inspector-button-size);height:var(--ck-inspector-button-size);border:0;overflow:hidden;border-radius:2px;padding:2px;color:var(--ck-inspector-color-button)}.ck-inspector .ck-inspector-button.ck-inspector-button_on,.ck-inspector .ck-inspector-button.ck-inspector-button_on:hover{color:var(--ck-inspector-color-button-on);opacity:1}.ck-inspector .ck-inspector-button.ck-inspector-button_disabled{opacity:.3}.ck-inspector .ck-inspector-button>span{display:none}.ck-inspector .ck-inspector-button:hover{color:var(--ck-inspector-color-button-hover)}.ck-inspector .ck-inspector-button svg{width:var(--ck-inspector-icon-size);height:var(--ck-inspector-icon-size)}.ck-inspector .ck-inspector-button svg,.ck-inspector .ck-inspector-button svg *{fill:currentColor}", ""]);
      }, function(p, i, u) {
        var c = u(6), r = u(65);
        typeof (r = r.__esModule ? r.default : r) == "string" && (r = [[p.i, r, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(r, _), p.exports = r.locals || {};
      }, function(p, i, u) {
        (p.exports = u(7)(!1)).push([p.i, ".ck-inspector{--ck-inspector-explorer-width:300px}.ck-inspector .ck-inspector-pane{display:flex;width:100%}.ck-inspector .ck-inspector-pane.ck-inspector-pane_empty{align-items:center;justify-content:center;padding:1em;background:var(--ck-inspector-navbox-empty-background)}.ck-inspector .ck-inspector-pane.ck-inspector-pane_empty p{align-self:center;width:100%;text-align:center}.ck-inspector .ck-inspector-pane>.ck-inspector-navbox:last-child{min-width:var(--ck-inspector-explorer-width);width:var(--ck-inspector-explorer-width)}.ck-inspector .ck-inspector-pane.ck-inspector-pane_vsplit>.ck-inspector-navbox:first-child{border-right:1px solid var(--ck-inspector-color-border);flex:1 1 auto;overflow:hidden}.ck-inspector .ck-inspector-pane.ck-inspector-pane_vsplit>.ck-inspector-navbox:first-child .ck-inspector-navbox__navigation{align-items:center}.ck-inspector .ck-inspector-pane.ck-inspector-pane_vsplit>.ck-inspector-navbox:first-child .ck-inspector-tree__config label{margin:0 .5em}.ck-inspector .ck-inspector-pane.ck-inspector-pane_vsplit>.ck-inspector-navbox:first-child .ck-inspector-tree__config input+label{margin-right:1em}", ""]);
      }, function(p, i, u) {
        var c = u(6), r = u(67);
        typeof (r = r.__esModule ? r.default : r) == "string" && (r = [[p.i, r, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(r, _), p.exports = r.locals || {};
      }, function(p, i, u) {
        (p.exports = u(7)(!1)).push([p.i, ".ck-inspector-side-pane{position:relative}", ""]);
      }, function(p, i, u) {
        var c = u(6), r = u(69);
        typeof (r = r.__esModule ? r.default : r) == "string" && (r = [[p.i, r, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(r, _), p.exports = r.locals || {};
      }, function(p, i, u) {
        (p.exports = u(7)(!1)).push([p.i, ".ck-inspector .ck-inspector-checkbox{vertical-align:middle}", ""]);
      }, function(p, i, u) {
        var c = u(6), r = u(71);
        typeof (r = r.__esModule ? r.default : r) == "string" && (r = [[p.i, r, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(r, _), p.exports = r.locals || {};
      }, function(p, i, u) {
        (p.exports = u(7)(!1)).push([p.i, '.ck-inspector{--ck-inspector-color-property-list-property-name:#d0363f;--ck-inspector-color-property-list-property-value-true:green;--ck-inspector-color-property-list-property-value-false:red;--ck-inspector-color-property-list-property-value-unknown:#888;--ck-inspector-color-property-list-background:#f5f5f5;--ck-inspector-color-property-list-title-collapser:#727272}.ck-inspector .ck-inspector-property-list{display:grid;grid-template-columns:auto 1fr;background:var(--ck-inspector-color-white)}.ck-inspector .ck-inspector-property-list>:nth-of-type(odd){background:var(--ck-inspector-color-property-list-background)}.ck-inspector .ck-inspector-property-list>:nth-of-type(2n){background:var(--ck-inspector-color-white)}.ck-inspector .ck-inspector-property-list dt{padding:0 .7em 0 1.2em;min-width:15em}.ck-inspector .ck-inspector-property-list dt.ck-inspector-property-list__title_collapsible button{display:inline-block;overflow:hidden;vertical-align:middle;margin-left:-9px;margin-right:.3em;width:0;height:0;border-left:6px solid var(--ck-inspector-color-property-list-title-collapser);border-bottom:3.5px solid transparent;border-right:0 solid transparent;border-top:3.5px solid transparent;transition:transform .2s ease-in-out;transform:rotate(0deg)}.ck-inspector .ck-inspector-property-list dt.ck-inspector-property-list__title_expanded button{transform:rotate(90deg)}.ck-inspector .ck-inspector-property-list dt.ck-inspector-property-list__title_collapsed+dd+.ck-inspector-property-list{display:none}.ck-inspector .ck-inspector-property-list dt .ck-inspector-property-list__title__color-box{width:12px;height:12px;vertical-align:text-top;display:inline-block;margin-right:3px;border-radius:2px;border:1px solid #000}.ck-inspector .ck-inspector-property-list dt.ck-inspector-property-list__title_clickable label:hover{text-decoration:underline;cursor:pointer}.ck-inspector .ck-inspector-property-list dt label{color:var(--ck-inspector-color-property-list-property-name)}.ck-inspector .ck-inspector-property-list dd{padding-right:.7em}.ck-inspector .ck-inspector-property-list dd input{width:100%}.ck-inspector .ck-inspector-property-list dd input[value=false]{color:var(--ck-inspector-color-property-list-property-value-false)}.ck-inspector .ck-inspector-property-list dd input[value=true]{color:var(--ck-inspector-color-property-list-property-value-true)}.ck-inspector .ck-inspector-property-list dd input[value="function() {…}"],.ck-inspector .ck-inspector-property-list dd input[value=undefined]{color:var(--ck-inspector-color-property-list-property-value-unknown)}.ck-inspector .ck-inspector-property-list dd input[value="function() {…}"]{font-style:italic}.ck-inspector .ck-inspector-property-list .ck-inspector-property-list{grid-column:1/-1;margin-left:1em;background:transparent}.ck-inspector .ck-inspector-property-list .ck-inspector-property-list>:nth-of-type(2n),.ck-inspector .ck-inspector-property-list .ck-inspector-property-list>:nth-of-type(odd){background:transparent}', ""]);
      }, function(p, i, u) {
        var c = u(6), r = u(73);
        typeof (r = r.__esModule ? r.default : r) == "string" && (r = [[p.i, r, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(r, _), p.exports = r.locals || {};
      }, function(p, i, u) {
        (p.exports = u(7)(!1)).push([p.i, `.ck-inspector .ck-inspector__object-inspector{width:100%;background:var(--ck-inspector-color-white);overflow:auto}.ck-inspector .ck-inspector__object-inspector h2,.ck-inspector .ck-inspector__object-inspector h3{display:flex;flex-direction:row;flex-wrap:nowrap}.ck-inspector .ck-inspector__object-inspector h2{display:flex;align-items:center;padding:1em;overflow:hidden;text-overflow:ellipsis}.ck-inspector .ck-inspector__object-inspector h2>span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;margin-right:auto}.ck-inspector .ck-inspector__object-inspector h2>.ck-inspector-button{flex-shrink:0;margin-left:.5em}.ck-inspector .ck-inspector__object-inspector h2 a{font-weight:700;color:var(--ck-inspector-color-tree-node-name)}.ck-inspector .ck-inspector__object-inspector h2 a,.ck-inspector .ck-inspector__object-inspector h2 a>*{cursor:pointer}.ck-inspector .ck-inspector__object-inspector h2 em:after,.ck-inspector .ck-inspector__object-inspector h2 em:before{content:'"'}.ck-inspector .ck-inspector__object-inspector h3{display:flex;align-items:center;font-size:12px;padding:.4em .7em}.ck-inspector .ck-inspector__object-inspector h3 a{color:inherit;font-weight:700;margin-right:auto}.ck-inspector .ck-inspector__object-inspector h3 .ck-inspector-button{visibility:hidden}.ck-inspector .ck-inspector__object-inspector h3:hover .ck-inspector-button{visibility:visible}.ck-inspector .ck-inspector__object-inspector hr{border-top:1px solid var(--ck-inspector-color-border)}`, ""]);
      }, function(p, i, u) {
        var c = u(6), r = u(75);
        typeof (r = r.__esModule ? r.default : r) == "string" && (r = [[p.i, r, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(r, _), p.exports = r.locals || {};
      }, function(p, i, u) {
        (p.exports = u(7)(!1)).push([p.i, ".ck-inspector-model-tree__hide-markers .ck-inspector-tree__position.ck-inspector-tree__position_marker{display:none}", ""]);
      }, function(p, i) {
        p.exports = function() {
          var u = document.getSelection();
          if (!u.rangeCount) return function() {
          };
          for (var c = document.activeElement, r = [], _ = 0; _ < u.rangeCount; _++) r.push(u.getRangeAt(_));
          switch (c.tagName.toUpperCase()) {
            case "INPUT":
            case "TEXTAREA":
              c.blur();
              break;
            default:
              c = null;
          }
          return u.removeAllRanges(), function() {
            u.type === "Caret" && u.removeAllRanges(), u.rangeCount || r.forEach(function(g) {
              u.addRange(g);
            }), c && c.focus();
          };
        };
      }, function(p, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.bodyOpenClassName = i.portalClassName = void 0;
        var c = Object.assign || function(I) {
          for (var ae = 1; ae < arguments.length; ae++) {
            var le = arguments[ae];
            for (var ne in le) Object.prototype.hasOwnProperty.call(le, ne) && (I[ne] = le[ne]);
          }
          return I;
        }, r = /* @__PURE__ */ function() {
          function I(ae, le) {
            for (var ne = 0; ne < le.length; ne++) {
              var ce = le[ne];
              ce.enumerable = ce.enumerable || !1, ce.configurable = !0, "value" in ce && (ce.writable = !0), Object.defineProperty(ae, ce.key, ce);
            }
          }
          return function(ae, le, ne) {
            return le && I(ae.prototype, le), ne && I(ae, ne), ae;
          };
        }(), _ = u(0), g = K(_), y = K(u(12)), v = K(u(18)), b = K(u(78)), C = function(I) {
          if (I && I.__esModule) return I;
          var ae = {};
          if (I != null) for (var le in I) Object.prototype.hasOwnProperty.call(I, le) && (ae[le] = I[le]);
          return ae.default = I, ae;
        }(u(43)), x = u(36), N = K(x), G = u(85);
        function K(I) {
          return I && I.__esModule ? I : { default: I };
        }
        function j(I, ae) {
          if (!(I instanceof ae)) throw new TypeError("Cannot call a class as a function");
        }
        function B(I, ae) {
          if (!I) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
          return !ae || typeof ae != "object" && typeof ae != "function" ? I : ae;
        }
        var P = i.portalClassName = "ReactModalPortal", M = i.bodyOpenClassName = "ReactModal__Body--open", V = x.canUseDOM && y.default.createPortal !== void 0, A = function(I) {
          return document.createElement(I);
        }, J = function() {
          return V ? y.default.createPortal : y.default.unstable_renderSubtreeIntoContainer;
        };
        function Q(I) {
          return I();
        }
        var z = function(I) {
          function ae() {
            var le, ne, ce;
            j(this, ae);
            for (var be = arguments.length, ee = Array(be), de = 0; de < be; de++) ee[de] = arguments[de];
            return ne = ce = B(this, (le = ae.__proto__ || Object.getPrototypeOf(ae)).call.apply(le, [this].concat(ee))), ce.removePortal = function() {
              !V && y.default.unmountComponentAtNode(ce.node);
              var R = Q(ce.props.parentSelector);
              R && R.contains(ce.node) ? R.removeChild(ce.node) : console.warn('React-Modal: "parentSelector" prop did not returned any DOM element. Make sure that the parent element is unmounted to avoid any memory leaks.');
            }, ce.portalRef = function(R) {
              ce.portal = R;
            }, ce.renderPortal = function(R) {
              var ie = J()(ce, g.default.createElement(b.default, c({ defaultStyles: ae.defaultStyles }, R)), ce.node);
              ce.portalRef(ie);
            }, B(ce, ne);
          }
          return function(le, ne) {
            if (typeof ne != "function" && ne !== null) throw new TypeError("Super expression must either be null or a function, not " + typeof ne);
            le.prototype = Object.create(ne && ne.prototype, { constructor: { value: le, enumerable: !1, writable: !0, configurable: !0 } }), ne && (Object.setPrototypeOf ? Object.setPrototypeOf(le, ne) : le.__proto__ = ne);
          }(ae, I), r(ae, [{ key: "componentDidMount", value: function() {
            x.canUseDOM && (V || (this.node = A("div")), this.node.className = this.props.portalClassName, Q(this.props.parentSelector).appendChild(this.node), !V && this.renderPortal(this.props));
          } }, { key: "getSnapshotBeforeUpdate", value: function(le) {
            return { prevParent: Q(le.parentSelector), nextParent: Q(this.props.parentSelector) };
          } }, { key: "componentDidUpdate", value: function(le, ne, ce) {
            if (x.canUseDOM) {
              var be = this.props, ee = be.isOpen, de = be.portalClassName;
              le.portalClassName !== de && (this.node.className = de);
              var R = ce.prevParent, ie = ce.nextParent;
              ie !== R && (R.removeChild(this.node), ie.appendChild(this.node)), (le.isOpen || ee) && !V && this.renderPortal(this.props);
            }
          } }, { key: "componentWillUnmount", value: function() {
            if (x.canUseDOM && this.node && this.portal) {
              var le = this.portal.state, ne = Date.now(), ce = le.isOpen && this.props.closeTimeoutMS && (le.closesAt || ne + this.props.closeTimeoutMS);
              ce ? (le.beforeClose || this.portal.closeWithTimeout(), setTimeout(this.removePortal, ce - ne)) : this.removePortal();
            }
          } }, { key: "render", value: function() {
            return x.canUseDOM && V ? (!this.node && V && (this.node = A("div")), J()(g.default.createElement(b.default, c({ ref: this.portalRef, defaultStyles: ae.defaultStyles }, this.props)), this.node)) : null;
          } }], [{ key: "setAppElement", value: function(le) {
            C.setElement(le);
          } }]), ae;
        }(_.Component);
        z.propTypes = { isOpen: v.default.bool.isRequired, style: v.default.shape({ content: v.default.object, overlay: v.default.object }), portalClassName: v.default.string, bodyOpenClassName: v.default.string, htmlOpenClassName: v.default.string, className: v.default.oneOfType([v.default.string, v.default.shape({ base: v.default.string.isRequired, afterOpen: v.default.string.isRequired, beforeClose: v.default.string.isRequired })]), overlayClassName: v.default.oneOfType([v.default.string, v.default.shape({ base: v.default.string.isRequired, afterOpen: v.default.string.isRequired, beforeClose: v.default.string.isRequired })]), appElement: v.default.oneOfType([v.default.instanceOf(N.default), v.default.instanceOf(x.SafeHTMLCollection), v.default.instanceOf(x.SafeNodeList), v.default.arrayOf(v.default.instanceOf(N.default))]), onAfterOpen: v.default.func, onRequestClose: v.default.func, closeTimeoutMS: v.default.number, ariaHideApp: v.default.bool, shouldFocusAfterRender: v.default.bool, shouldCloseOnOverlayClick: v.default.bool, shouldReturnFocusAfterClose: v.default.bool, preventScroll: v.default.bool, parentSelector: v.default.func, aria: v.default.object, data: v.default.object, role: v.default.string, contentLabel: v.default.string, shouldCloseOnEsc: v.default.bool, overlayRef: v.default.func, contentRef: v.default.func, id: v.default.string, overlayElement: v.default.func, contentElement: v.default.func }, z.defaultProps = { isOpen: !1, portalClassName: P, bodyOpenClassName: M, role: "dialog", ariaHideApp: !0, closeTimeoutMS: 0, shouldFocusAfterRender: !0, shouldCloseOnEsc: !0, shouldCloseOnOverlayClick: !0, shouldReturnFocusAfterClose: !0, preventScroll: !1, parentSelector: function() {
          return document.body;
        }, overlayElement: function(I, ae) {
          return g.default.createElement("div", I, ae);
        }, contentElement: function(I, ae) {
          return g.default.createElement("div", I, ae);
        } }, z.defaultStyles = { overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(255, 255, 255, 0.75)" }, content: { position: "absolute", top: "40px", left: "40px", right: "40px", bottom: "40px", border: "1px solid #ccc", background: "#fff", overflow: "auto", WebkitOverflowScrolling: "touch", borderRadius: "4px", outline: "none", padding: "20px" } }, (0, G.polyfill)(z), i.default = z;
      }, function(p, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 });
        var c = Object.assign || function(A) {
          for (var J = 1; J < arguments.length; J++) {
            var Q = arguments[J];
            for (var z in Q) Object.prototype.hasOwnProperty.call(Q, z) && (A[z] = Q[z]);
          }
          return A;
        }, r = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(A) {
          return typeof A;
        } : function(A) {
          return A && typeof Symbol == "function" && A.constructor === Symbol && A !== Symbol.prototype ? "symbol" : typeof A;
        }, _ = /* @__PURE__ */ function() {
          function A(J, Q) {
            for (var z = 0; z < Q.length; z++) {
              var I = Q[z];
              I.enumerable = I.enumerable || !1, I.configurable = !0, "value" in I && (I.writable = !0), Object.defineProperty(J, I.key, I);
            }
          }
          return function(J, Q, z) {
            return Q && A(J.prototype, Q), z && A(J, z), J;
          };
        }(), g = u(0), y = B(u(18)), v = j(u(79)), b = B(u(80)), C = j(u(43)), x = j(u(83)), N = u(36), G = B(N), K = B(u(44));
        function j(A) {
          if (A && A.__esModule) return A;
          var J = {};
          if (A != null) for (var Q in A) Object.prototype.hasOwnProperty.call(A, Q) && (J[Q] = A[Q]);
          return J.default = A, J;
        }
        function B(A) {
          return A && A.__esModule ? A : { default: A };
        }
        u(84);
        var P = { overlay: "ReactModal__Overlay", content: "ReactModal__Content" }, M = 0, V = function(A) {
          function J(Q) {
            (function(I, ae) {
              if (!(I instanceof ae)) throw new TypeError("Cannot call a class as a function");
            })(this, J);
            var z = function(I, ae) {
              if (!I) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
              return !ae || typeof ae != "object" && typeof ae != "function" ? I : ae;
            }(this, (J.__proto__ || Object.getPrototypeOf(J)).call(this, Q));
            return z.setOverlayRef = function(I) {
              z.overlay = I, z.props.overlayRef && z.props.overlayRef(I);
            }, z.setContentRef = function(I) {
              z.content = I, z.props.contentRef && z.props.contentRef(I);
            }, z.afterClose = function() {
              var I = z.props, ae = I.appElement, le = I.ariaHideApp, ne = I.htmlOpenClassName, ce = I.bodyOpenClassName;
              ce && x.remove(document.body, ce), ne && x.remove(document.getElementsByTagName("html")[0], ne), le && M > 0 && (M -= 1) === 0 && C.show(ae), z.props.shouldFocusAfterRender && (z.props.shouldReturnFocusAfterClose ? (v.returnFocus(z.props.preventScroll), v.teardownScopedFocus()) : v.popWithoutFocus()), z.props.onAfterClose && z.props.onAfterClose(), K.default.deregister(z);
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
              var I = Date.now() + z.props.closeTimeoutMS;
              z.setState({ beforeClose: !0, closesAt: I }, function() {
                z.closeTimer = setTimeout(z.closeWithoutTimeout, z.state.closesAt - Date.now());
              });
            }, z.closeWithoutTimeout = function() {
              z.setState({ beforeClose: !1, isOpen: !1, afterOpen: !1, closesAt: null }, z.afterClose);
            }, z.handleKeyDown = function(I) {
              I.keyCode === 9 && (0, b.default)(z.content, I), z.props.shouldCloseOnEsc && I.keyCode === 27 && (I.stopPropagation(), z.requestClose(I));
            }, z.handleOverlayOnClick = function(I) {
              z.shouldClose === null && (z.shouldClose = !0), z.shouldClose && z.props.shouldCloseOnOverlayClick && (z.ownerHandlesClose() ? z.requestClose(I) : z.focusContent()), z.shouldClose = null;
            }, z.handleContentOnMouseUp = function() {
              z.shouldClose = !1;
            }, z.handleOverlayOnMouseDown = function(I) {
              z.props.shouldCloseOnOverlayClick || I.target != z.overlay || I.preventDefault();
            }, z.handleContentOnClick = function() {
              z.shouldClose = !1;
            }, z.handleContentOnMouseDown = function() {
              z.shouldClose = !1;
            }, z.requestClose = function(I) {
              return z.ownerHandlesClose() && z.props.onRequestClose(I);
            }, z.ownerHandlesClose = function() {
              return z.props.onRequestClose;
            }, z.shouldBeClosed = function() {
              return !z.state.isOpen && !z.state.beforeClose;
            }, z.contentHasFocus = function() {
              return document.activeElement === z.content || z.content.contains(document.activeElement);
            }, z.buildClassName = function(I, ae) {
              var le = (ae === void 0 ? "undefined" : r(ae)) === "object" ? ae : { base: P[I], afterOpen: P[I] + "--after-open", beforeClose: P[I] + "--before-close" }, ne = le.base;
              return z.state.afterOpen && (ne = ne + " " + le.afterOpen), z.state.beforeClose && (ne = ne + " " + le.beforeClose), typeof ae == "string" && ae ? ne + " " + ae : ne;
            }, z.attributesFromObject = function(I, ae) {
              return Object.keys(ae).reduce(function(le, ne) {
                return le[I + "-" + ne] = ae[ne], le;
              }, {});
            }, z.state = { afterOpen: !1, beforeClose: !1 }, z.shouldClose = null, z.moveFromContentToOverlay = null, z;
          }
          return function(Q, z) {
            if (typeof z != "function" && z !== null) throw new TypeError("Super expression must either be null or a function, not " + typeof z);
            Q.prototype = Object.create(z && z.prototype, { constructor: { value: Q, enumerable: !1, writable: !0, configurable: !0 } }), z && (Object.setPrototypeOf ? Object.setPrototypeOf(Q, z) : Q.__proto__ = z);
          }(J, A), _(J, [{ key: "componentDidMount", value: function() {
            this.props.isOpen && this.open();
          } }, { key: "componentDidUpdate", value: function(Q, z) {
            this.props.isOpen && !Q.isOpen ? this.open() : !this.props.isOpen && Q.isOpen && this.close(), this.props.shouldFocusAfterRender && this.state.isOpen && !z.isOpen && this.focusContent();
          } }, { key: "componentWillUnmount", value: function() {
            this.state.isOpen && this.afterClose(), clearTimeout(this.closeTimer), cancelAnimationFrame(this.openAnimationFrame);
          } }, { key: "beforeOpen", value: function() {
            var Q = this.props, z = Q.appElement, I = Q.ariaHideApp, ae = Q.htmlOpenClassName, le = Q.bodyOpenClassName;
            le && x.add(document.body, le), ae && x.add(document.getElementsByTagName("html")[0], ae), I && (M += 1, C.hide(z)), K.default.register(this);
          } }, { key: "render", value: function() {
            var Q = this.props, z = Q.id, I = Q.className, ae = Q.overlayClassName, le = Q.defaultStyles, ne = Q.children, ce = I ? {} : le.content, be = ae ? {} : le.overlay;
            if (this.shouldBeClosed()) return null;
            var ee = { ref: this.setOverlayRef, className: this.buildClassName("overlay", ae), style: c({}, be, this.props.style.overlay), onClick: this.handleOverlayOnClick, onMouseDown: this.handleOverlayOnMouseDown }, de = c({ id: z, ref: this.setContentRef, style: c({}, ce, this.props.style.content), className: this.buildClassName("content", I), tabIndex: "-1", onKeyDown: this.handleKeyDown, onMouseDown: this.handleContentOnMouseDown, onMouseUp: this.handleContentOnMouseUp, onClick: this.handleContentOnClick, role: this.props.role, "aria-label": this.props.contentLabel }, this.attributesFromObject("aria", c({ modal: !0 }, this.props.aria)), this.attributesFromObject("data", this.props.data || {}), { "data-testid": this.props.testId }), R = this.props.contentElement(de, ne);
            return this.props.overlayElement(ee, R);
          } }]), J;
        }(g.Component);
        V.defaultProps = { style: { overlay: {}, content: {} }, defaultStyles: {} }, V.propTypes = { isOpen: y.default.bool.isRequired, defaultStyles: y.default.shape({ content: y.default.object, overlay: y.default.object }), style: y.default.shape({ content: y.default.object, overlay: y.default.object }), className: y.default.oneOfType([y.default.string, y.default.object]), overlayClassName: y.default.oneOfType([y.default.string, y.default.object]), bodyOpenClassName: y.default.string, htmlOpenClassName: y.default.string, ariaHideApp: y.default.bool, appElement: y.default.oneOfType([y.default.instanceOf(G.default), y.default.instanceOf(N.SafeHTMLCollection), y.default.instanceOf(N.SafeNodeList), y.default.arrayOf(y.default.instanceOf(G.default))]), onAfterOpen: y.default.func, onAfterClose: y.default.func, onRequestClose: y.default.func, closeTimeoutMS: y.default.number, shouldFocusAfterRender: y.default.bool, shouldCloseOnOverlayClick: y.default.bool, shouldReturnFocusAfterClose: y.default.bool, preventScroll: y.default.bool, role: y.default.string, contentLabel: y.default.string, aria: y.default.object, data: y.default.object, children: y.default.node, shouldCloseOnEsc: y.default.bool, overlayRef: y.default.func, contentRef: y.default.func, id: y.default.string, overlayElement: y.default.func, contentElement: y.default.func, testId: y.default.string }, i.default = V, p.exports = i.default;
      }, function(p, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.resetState = function() {
          g = [];
        }, i.log = function() {
        }, i.handleBlur = b, i.handleFocus = C, i.markForFocusLater = function() {
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
          y = x, window.addEventListener ? (window.addEventListener("blur", b, !1), document.addEventListener("focus", C, !0)) : (window.attachEvent("onBlur", b), document.attachEvent("onFocus", C));
        }, i.teardownScopedFocus = function() {
          y = null, window.addEventListener ? (window.removeEventListener("blur", b), document.removeEventListener("focus", C)) : (window.detachEvent("onBlur", b), document.detachEvent("onFocus", C));
        };
        var c, r = u(42), _ = (c = r) && c.__esModule ? c : { default: c }, g = [], y = null, v = !1;
        function b() {
          v = !0;
        }
        function C() {
          if (v) {
            if (v = !1, !y) return;
            setTimeout(function() {
              y.contains(document.activeElement) || ((0, _.default)(y)[0] || y).focus();
            }, 0);
          }
        }
      }, function(p, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.default = function(g, y) {
          var v = (0, _.default)(g);
          if (!v.length) return void y.preventDefault();
          var b = void 0, C = y.shiftKey, x = v[0], N = v[v.length - 1], G = function B() {
            var P = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : document;
            return P.activeElement.shadowRoot ? B(P.activeElement.shadowRoot) : P.activeElement;
          }();
          if (g === G) {
            if (!C) return;
            b = N;
          }
          if (N !== G || C || (b = x), x === G && C && (b = N), b) return y.preventDefault(), void b.focus();
          var K = /(\bChrome\b|\bSafari\b)\//.exec(navigator.userAgent);
          if (!(K == null || K[1] == "Chrome" || /\biPod\b|\biPad\b/g.exec(navigator.userAgent) != null)) {
            var j = v.indexOf(G);
            if (j > -1 && (j += C ? -1 : 1), (b = v[j]) === void 0) return y.preventDefault(), void (b = C ? N : x).focus();
            y.preventDefault(), b.focus();
          }
        };
        var c, r = u(42), _ = (c = r) && c.__esModule ? c : { default: c };
        p.exports = i.default;
      }, function(p, i, u) {
        var c = function() {
        };
        p.exports = c;
      }, function(p, i, u) {
        var c;
        (function() {
          var r = !(typeof window > "u" || !window.document || !window.document.createElement), _ = { canUseDOM: r, canUseWorkers: typeof Worker < "u", canUseEventListeners: r && !(!window.addEventListener && !window.attachEvent), canUseViewport: r && !!window.screen };
          (c = (function() {
            return _;
          }).call(i, u, i, p)) === void 0 || (p.exports = c);
        })();
      }, function(p, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.resetState = function() {
          var g = document.getElementsByTagName("html")[0];
          for (var y in c) _(g, c[y]);
          var v = document.body;
          for (var b in r) _(v, r[b]);
          c = {}, r = {};
        }, i.log = function() {
        };
        var c = {}, r = {};
        function _(g, y) {
          g.classList.remove(y);
        }
        i.add = function(g, y) {
          return v = g.classList, b = g.nodeName.toLowerCase() == "html" ? c : r, void y.split(" ").forEach(function(C) {
            (function(x, N) {
              x[N] || (x[N] = 0), x[N] += 1;
            })(b, C), v.add(C);
          });
          var v, b;
        }, i.remove = function(g, y) {
          return v = g.classList, b = g.nodeName.toLowerCase() == "html" ? c : r, void y.split(" ").forEach(function(C) {
            (function(x, N) {
              x[N] && (x[N] -= 1);
            })(b, C), b[C] === 0 && v.remove(C);
          });
          var v, b;
        };
      }, function(p, i, u) {
        Object.defineProperty(i, "__esModule", { value: !0 }), i.resetState = function() {
          for (var C = [g, y], x = 0; x < C.length; x++) {
            var N = C[x];
            N && N.parentNode && N.parentNode.removeChild(N);
          }
          g = y = null, v = [];
        }, i.log = function() {
          console.log("bodyTrap ----------"), console.log(v.length);
          for (var C = [g, y], x = 0; x < C.length; x++) {
            var N = C[x] || {};
            console.log(N.nodeName, N.className, N.id);
          }
          console.log("edn bodyTrap ----------");
        };
        var c, r = u(44), _ = (c = r) && c.__esModule ? c : { default: c }, g = void 0, y = void 0, v = [];
        function b() {
          v.length !== 0 && v[v.length - 1].focusContent();
        }
        _.default.subscribe(function(C, x) {
          g || y || ((g = document.createElement("div")).setAttribute("data-react-modal-body-trap", ""), g.style.position = "absolute", g.style.opacity = "0", g.setAttribute("tabindex", "0"), g.addEventListener("focus", b), (y = g.cloneNode()).addEventListener("focus", b)), (v = x).length > 0 ? (document.body.firstChild !== g && document.body.insertBefore(g, document.body.firstChild), document.body.lastChild !== y && document.body.appendChild(y)) : (g.parentElement && g.parentElement.removeChild(g), y.parentElement && y.parentElement.removeChild(y));
        });
      }, function(p, i, u) {
        function c() {
          var y = this.constructor.getDerivedStateFromProps(this.props, this.state);
          y != null && this.setState(y);
        }
        function r(y) {
          this.setState((function(v) {
            var b = this.constructor.getDerivedStateFromProps(y, v);
            return b ?? null;
          }).bind(this));
        }
        function _(y, v) {
          try {
            var b = this.props, C = this.state;
            this.props = y, this.state = v, this.__reactInternalSnapshotFlag = !0, this.__reactInternalSnapshot = this.getSnapshotBeforeUpdate(b, C);
          } finally {
            this.props = b, this.state = C;
          }
        }
        function g(y) {
          var v = y.prototype;
          if (!v || !v.isReactComponent) throw new Error("Can only polyfill class components");
          if (typeof y.getDerivedStateFromProps != "function" && typeof v.getSnapshotBeforeUpdate != "function") return y;
          var b = null, C = null, x = null;
          if (typeof v.componentWillMount == "function" ? b = "componentWillMount" : typeof v.UNSAFE_componentWillMount == "function" && (b = "UNSAFE_componentWillMount"), typeof v.componentWillReceiveProps == "function" ? C = "componentWillReceiveProps" : typeof v.UNSAFE_componentWillReceiveProps == "function" && (C = "UNSAFE_componentWillReceiveProps"), typeof v.componentWillUpdate == "function" ? x = "componentWillUpdate" : typeof v.UNSAFE_componentWillUpdate == "function" && (x = "UNSAFE_componentWillUpdate"), b !== null || C !== null || x !== null) {
            var N = y.displayName || y.name, G = typeof y.getDerivedStateFromProps == "function" ? "getDerivedStateFromProps()" : "getSnapshotBeforeUpdate()";
            throw Error(`Unsafe legacy lifecycles will not be called for components using new component APIs.

` + N + " uses " + G + " but also contains the following legacy lifecycles:" + (b !== null ? `
  ` + b : "") + (C !== null ? `
  ` + C : "") + (x !== null ? `
  ` + x : "") + `

The above lifecycles should be removed. Learn more about this warning here:
https://fb.me/react-async-component-lifecycle-hooks`);
          }
          if (typeof y.getDerivedStateFromProps == "function" && (v.componentWillMount = c, v.componentWillReceiveProps = r), typeof v.getSnapshotBeforeUpdate == "function") {
            if (typeof v.componentDidUpdate != "function") throw new Error("Cannot polyfill getSnapshotBeforeUpdate() for components that do not define componentDidUpdate() on the prototype");
            v.componentWillUpdate = _;
            var K = v.componentDidUpdate;
            v.componentDidUpdate = function(j, B, P) {
              var M = this.__reactInternalSnapshotFlag ? this.__reactInternalSnapshot : P;
              K.call(this, j, B, M);
            };
          }
          return y;
        }
        u.r(i), u.d(i, "polyfill", function() {
          return g;
        }), c.__suppressDeprecationWarning = !0, r.__suppressDeprecationWarning = !0, _.__suppressDeprecationWarning = !0;
      }, function(p, i, u) {
        var c = u(6), r = u(87);
        typeof (r = r.__esModule ? r.default : r) == "string" && (r = [[p.i, r, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(r, _), p.exports = r.locals || {};
      }, function(p, i, u) {
        (p.exports = u(7)(!1)).push([p.i, ".ck-inspector-modal{--ck-inspector-set-data-modal-overlay:rgba(0,0,0,0.5);--ck-inspector-set-data-modal-shadow:rgba(0,0,0,0.06);--ck-inspector-set-data-modal-button-background:#eee;--ck-inspector-set-data-modal-button-background-hover:#ddd;--ck-inspector-set-data-modal-save-button-background:#1976d2;--ck-inspector-set-data-modal-save-button-background-hover:#0b60b5}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal{z-index:999999;position:fixed;inset:0;background-color:var(--ck-inspector-set-data-modal-overlay)}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content{position:absolute;border:1px solid var(--ck-inspector-color-border);background:var(--ck-inspector-color-white);overflow:auto;border-radius:2px;outline:none;box-shadow:0 1px 1px var(--ck-inspector-set-data-modal-shadow),0 2px 2px var(--ck-inspector-set-data-modal-shadow),0 4px 4px var(--ck-inspector-set-data-modal-shadow),0 8px 8px var(--ck-inspector-set-data-modal-shadow),0 16px 16px var(--ck-inspector-set-data-modal-shadow);max-height:calc(100vh - 160px);max-width:calc(100vw - 160px);width:100%;height:100%;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;justify-content:space-between}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content h2{font-size:14px;font-weight:700;margin:0;padding:12px 20px;background:var(--ck-inspector-color-background);border-bottom:1px solid var(--ck-inspector-color-border)}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content textarea{flex-grow:1;margin:20px;border:1px solid var(--ck-inspector-color-border);border-radius:2px;resize:none;padding:10px;font-family:monospace;font-size:14px}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content button{padding:10px 20px;border-radius:2px;font-size:14px;white-space:nowrap;border:1px solid var(--ck-inspector-color-border)}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content button:hover{background:var(--ck-inspector-set-data-modal-button-background-hover)}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons{margin:0 20px 20px;display:flex;justify-content:center}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button+button{margin-left:20px}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button:first-child{margin-right:auto}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button:not(:first-child){flex-basis:20%}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button:last-child{background:var(--ck-inspector-set-data-modal-save-button-background);border-color:var(--ck-inspector-set-data-modal-save-button-background);color:#fff;font-weight:700}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button:last-child:hover{background:var(--ck-inspector-set-data-modal-save-button-background-hover)}", ""]);
      }, function(p, i, u) {
        var c = u(6), r = u(89);
        typeof (r = r.__esModule ? r.default : r) == "string" && (r = [[p.i, r, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(r, _), p.exports = r.locals || {};
      }, function(p, i, u) {
        (p.exports = u(7)(!1)).push([p.i, ".ck-inspector .ck-inspector-editor-quick-actions{display:flex;align-content:center;justify-content:center;align-items:center;flex-direction:row;flex-wrap:nowrap}.ck-inspector .ck-inspector-editor-quick-actions>.ck-inspector-button{margin-left:.3em}.ck-inspector .ck-inspector-editor-quick-actions>.ck-inspector-button.ck-inspector-button_data-copied{animation-duration:.5s;animation-name:ck-inspector-bounce-in;color:green}@keyframes ck-inspector-bounce-in{0%{opacity:0;transform:scale3d(.5,.5,.5)}20%{transform:scale3d(1.1,1.1,1.1)}40%{transform:scale3d(.8,.8,.8)}60%{opacity:1;transform:scale3d(1.05,1.05,1.05)}to{opacity:1;transform:scaleX(1)}}", ""]);
      }, function(p, i, u) {
        var c = u(6), r = u(91);
        typeof (r = r.__esModule ? r.default : r) == "string" && (r = [[p.i, r, ""]]);
        var _ = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        c(r, _), p.exports = r.locals || {};
      }, function(p, i, u) {
        (p.exports = u(7)(!1)).push([p.i, "html body.ck-inspector-body-expanded{margin-bottom:var(--ck-inspector-height)}html body.ck-inspector-body-collapsed{margin-bottom:var(--ck-inspector-collapsed-height)}.ck-inspector-wrapper *{box-sizing:border-box}", ""]);
      }, , , function(p, i, u) {
        u.r(i), u.d(i, "default", function() {
          return $e;
        });
        var c = u(0), r = u.n(c), _ = u(12), g = u.n(_);
        function y(E) {
          return "Minified Redux error #" + E + "; visit https://redux.js.org/Errors?code=" + E + " for the full message or use the non-minified dev environment for full errors. ";
        }
        var v = typeof Symbol == "function" && Symbol.observable || "@@observable", b = function() {
          return Math.random().toString(36).substring(7).split("").join(".");
        }, C = { INIT: "@@redux/INIT" + b(), REPLACE: "@@redux/REPLACE" + b() };
        function x(E) {
          if (typeof E != "object" || E === null) return !1;
          for (var s = E; Object.getPrototypeOf(s) !== null; ) s = Object.getPrototypeOf(s);
          return Object.getPrototypeOf(E) === s;
        }
        function N(E, s, d) {
          var m;
          if (typeof s == "function" && typeof d == "function" || typeof d == "function" && typeof arguments[3] == "function") throw new Error(y(0));
          if (typeof s == "function" && d === void 0 && (d = s, s = void 0), d !== void 0) {
            if (typeof d != "function") throw new Error(y(1));
            return d(N)(E, s);
          }
          if (typeof E != "function") throw new Error(y(2));
          var S = E, O = s, L = [], re = L, fe = !1;
          function pe() {
            re === L && (re = L.slice());
          }
          function Ee() {
            if (fe) throw new Error(y(3));
            return O;
          }
          function Ne(Me) {
            if (typeof Me != "function") throw new Error(y(4));
            if (fe) throw new Error(y(5));
            var Fe = !0;
            return pe(), re.push(Me), function() {
              if (Fe) {
                if (fe) throw new Error(y(6));
                Fe = !1, pe();
                var et = re.indexOf(Me);
                re.splice(et, 1), L = null;
              }
            };
          }
          function Ve(Me) {
            if (!x(Me)) throw new Error(y(7));
            if (Me.type === void 0) throw new Error(y(8));
            if (fe) throw new Error(y(9));
            try {
              fe = !0, O = S(O, Me);
            } finally {
              fe = !1;
            }
            for (var Fe = L = re, et = 0; et < Fe.length; et++)
              (0, Fe[et])();
            return Me;
          }
          function Ae(Me) {
            if (typeof Me != "function") throw new Error(y(10));
            S = Me, Ve({ type: C.REPLACE });
          }
          function Ke() {
            var Me, Fe = Ne;
            return (Me = { subscribe: function(et) {
              if (typeof et != "object" || et === null) throw new Error(y(11));
              function qe() {
                et.next && et.next(Ee());
              }
              return qe(), { unsubscribe: Fe(qe) };
            } })[v] = function() {
              return this;
            }, Me;
          }
          return Ve({ type: C.INIT }), (m = { dispatch: Ve, subscribe: Ne, getState: Ee, replaceReducer: Ae })[v] = Ke, m;
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
              for (var m = s; m; ) m.callback(), m = m.next;
            });
          }, get: function() {
            for (var m = [], S = s; S; ) m.push(S), S = S.next;
            return m;
          }, subscribe: function(m) {
            var S = !0, O = d = { callback: m, next: null, prev: d };
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
          var d, m = B;
          function S() {
            L.onStateChange && L.onStateChange();
          }
          function O() {
            d || (d = s ? s.addNestedSub(S) : E.subscribe(S), m = j());
          }
          var L = { addNestedSub: function(re) {
            return O(), m.subscribe(re);
          }, notifyNestedSubs: function() {
            m.notify();
          }, handleChangeWrapper: S, isSubscribed: function() {
            return !!d;
          }, trySubscribe: O, tryUnsubscribe: function() {
            d && (d(), d = void 0, m.clear(), m = B);
          }, getListeners: function() {
            return m;
          } };
          return L;
        }
        var M = typeof window < "u" && window.document !== void 0 && window.document.createElement !== void 0 ? c.useLayoutEffect : c.useEffect, V = function(E) {
          var s = E.store, d = E.context, m = E.children, S = Object(c.useMemo)(function() {
            var re = P(s);
            return { store: s, subscription: re };
          }, [s]), O = Object(c.useMemo)(function() {
            return s.getState();
          }, [s]);
          M(function() {
            var re = S.subscription;
            return re.onStateChange = re.notifyNestedSubs, re.trySubscribe(), O !== s.getState() && re.notifyNestedSubs(), function() {
              re.tryUnsubscribe(), re.onStateChange = null;
            };
          }, [S, O]);
          var L = d || G;
          return r.a.createElement(L.Provider, { value: S }, m);
        };
        function A() {
          return (A = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var m in d) Object.prototype.hasOwnProperty.call(d, m) && (E[m] = d[m]);
            }
            return E;
          }).apply(this, arguments);
        }
        function J(E, s) {
          if (E == null) return {};
          var d, m, S = {}, O = Object.keys(E);
          for (m = 0; m < O.length; m++) d = O[m], s.indexOf(d) >= 0 || (S[d] = E[d]);
          return S;
        }
        var Q = u(39), z = u.n(Q), I = u(45), ae = ["getDisplayName", "methodName", "renderCountProp", "shouldHandleStateChanges", "storeKey", "withRef", "forwardRef", "context"], le = ["reactReduxForwardedRef"], ne = [], ce = [null, null];
        function be(E, s) {
          var d = E[1];
          return [s.payload, d + 1];
        }
        function ee(E, s, d) {
          M(function() {
            return E.apply(void 0, s);
          }, d);
        }
        function de(E, s, d, m, S, O, L) {
          E.current = m, s.current = S, d.current = !1, O.current && (O.current = null, L());
        }
        function R(E, s, d, m, S, O, L, re, fe, pe) {
          if (E) {
            var Ee = !1, Ne = null, Ve = function() {
              if (!Ee) {
                var Ae, Ke, Me = s.getState();
                try {
                  Ae = m(Me, S.current);
                } catch (Fe) {
                  Ke = Fe, Ne = Fe;
                }
                Ke || (Ne = null), Ae === O.current ? L.current || fe() : (O.current = Ae, re.current = Ae, L.current = !0, pe({ type: "STORE_UPDATED", payload: { error: Ke } }));
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
        function ye(E, s) {
          s === void 0 && (s = {});
          var d = s, m = d.getDisplayName, S = m === void 0 ? function(Le) {
            return "ConnectAdvanced(" + Le + ")";
          } : m, O = d.methodName, L = O === void 0 ? "connectAdvanced" : O, re = d.renderCountProp, fe = re === void 0 ? void 0 : re, pe = d.shouldHandleStateChanges, Ee = pe === void 0 || pe, Ne = d.storeKey, Ve = Ne === void 0 ? "store" : Ne, Ae = (d.withRef, d.forwardRef), Ke = Ae !== void 0 && Ae, Me = d.context, Fe = Me === void 0 ? G : Me, et = J(d, ae), qe = Fe;
          return function(Le) {
            var dt = Le.displayName || Le.name || "Component", Rt = S(dt), Mt = A({}, et, { getDisplayName: S, methodName: L, renderCountProp: fe, shouldHandleStateChanges: Ee, storeKey: Ve, displayName: Rt, wrappedComponentName: dt, WrappedComponent: Le }), jt = et.pure, _t = jt ? c.useMemo : function(lt) {
              return lt();
            };
            function zt(lt) {
              var In = Object(c.useMemo)(function() {
                var wn = lt.reactReduxForwardedRef, lo = J(lt, le);
                return [lt.context, wn, lo];
              }, [lt]), Hn = In[0], zr = In[1], xt = In[2], ao = Object(c.useMemo)(function() {
                return Hn && Hn.Consumer && Object(I.isContextConsumer)(r.a.createElement(Hn.Consumer, null)) ? Hn : qe;
              }, [Hn, qe]), Mn = Object(c.useContext)(ao), $t = !!lt.store && !!lt.store.getState && !!lt.store.dispatch;
              Mn && Mn.store;
              var dn = $t ? lt.store : Mn.store, Xn = Object(c.useMemo)(function() {
                return function(wn) {
                  return E(wn.dispatch, Mt);
                }(dn);
              }, [dn]), Gt = Object(c.useMemo)(function() {
                if (!Ee) return ce;
                var wn = P(dn, $t ? null : Mn.subscription), lo = wn.notifyNestedSubs.bind(wn);
                return [wn, lo];
              }, [dn, $t, Mn]), fn = Gt[0], Lr = Gt[1], oi = Object(c.useMemo)(function() {
                return $t ? Mn : A({}, Mn, { subscription: fn });
              }, [$t, Mn, fn]), Ur = Object(c.useReducer)(be, ne, ie), Mo = Ur[0][0], mr = Ur[1];
              if (Mo && Mo.error) throw Mo.error;
              var Li = Object(c.useRef)(), gr = Object(c.useRef)(xt), jo = Object(c.useRef)(), ii = Object(c.useRef)(!1), Zn = _t(function() {
                return jo.current && xt === gr.current ? jo.current : Xn(dn.getState(), xt);
              }, [dn, Mo, xt]);
              ee(de, [gr, Li, ii, xt, Zn, jo, Lr]), ee(R, [Ee, dn, fn, Xn, gr, Li, ii, jo, Lr, mr], [dn, fn, Xn]);
              var so = Object(c.useMemo)(function() {
                return r.a.createElement(Le, A({}, Zn, { ref: zr }));
              }, [zr, Le, Zn]);
              return Object(c.useMemo)(function() {
                return Ee ? r.a.createElement(ao.Provider, { value: oi }, so) : so;
              }, [ao, so, oi]);
            }
            var ft = jt ? r.a.memo(zt) : zt;
            if (ft.WrappedComponent = Le, ft.displayName = zt.displayName = Rt, Ke) {
              var An = r.a.forwardRef(function(lt, In) {
                return r.a.createElement(ft, A({}, lt, { reactReduxForwardedRef: In }));
              });
              return An.displayName = Rt, An.WrappedComponent = Le, z()(An, Le);
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
          var d = Object.keys(E), m = Object.keys(s);
          if (d.length !== m.length) return !1;
          for (var S = 0; S < d.length; S++) if (!Object.prototype.hasOwnProperty.call(s, d[S]) || !Te(E[d[S]], s[d[S]])) return !1;
          return !0;
        }
        function Pe(E) {
          return function(s, d) {
            var m = E(s, d);
            function S() {
              return m;
            }
            return S.dependsOnOwnProps = !1, S;
          };
        }
        function Se(E) {
          return E.dependsOnOwnProps !== null && E.dependsOnOwnProps !== void 0 ? !!E.dependsOnOwnProps : E.length !== 1;
        }
        function ze(E, s) {
          return function(d, m) {
            m.displayName;
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
            return function(d, m) {
              var S = {}, O = function(re) {
                var fe = d[re];
                typeof fe == "function" && (S[re] = function() {
                  return m(fe.apply(void 0, arguments));
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
          return A({}, d, E, s);
        }
        var me = [function(E) {
          return typeof E == "function" ? /* @__PURE__ */ function(s) {
            return function(d, m) {
              m.displayName;
              var S, O = m.pure, L = m.areMergedPropsEqual, re = !1;
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
        }], l = ["initMapStateToProps", "initMapDispatchToProps", "initMergeProps"];
        function f(E, s, d, m) {
          return function(S, O) {
            return d(E(S, O), s(m, O), O);
          };
        }
        function w(E, s, d, m, S) {
          var O, L, re, fe, pe, Ee = S.areStatesEqual, Ne = S.areOwnPropsEqual, Ve = S.areStatePropsEqual, Ae = !1;
          function Ke(Me, Fe) {
            var et, qe, Le = !Ne(Fe, L), dt = !Ee(Me, O);
            return O = Me, L = Fe, Le && dt ? (re = E(O, L), s.dependsOnOwnProps && (fe = s(m, L)), pe = d(re, fe, L)) : Le ? (E.dependsOnOwnProps && (re = E(O, L)), s.dependsOnOwnProps && (fe = s(m, L)), pe = d(re, fe, L)) : (dt && (et = E(O, L), qe = !Ve(et, re), re = et, qe && (pe = d(re, fe, L))), pe);
          }
          return function(Me, Fe) {
            return Ae ? Ke(Me, Fe) : (re = E(O = Me, L = Fe), fe = s(m, L), pe = d(re, fe, L), Ae = !0, pe);
          };
        }
        function U(E, s) {
          var d = s.initMapStateToProps, m = s.initMapDispatchToProps, S = s.initMergeProps, O = J(s, l), L = d(E, O), re = m(E, O), fe = S(E, O);
          return (O.pure ? w : f)(L, re, fe, E, O);
        }
        var F = ["pure", "areStatesEqual", "areOwnPropsEqual", "areStatePropsEqual", "areMergedPropsEqual"];
        function W(E, s, d) {
          for (var m = s.length - 1; m >= 0; m--) {
            var S = s[m](E);
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
          var s = {}, d = s.connectHOC, m = d === void 0 ? ye : d, S = s.mapStateToPropsFactories, O = S === void 0 ? X : S, L = s.mapDispatchToPropsFactories, re = L === void 0 ? Je : L, fe = s.mergePropsFactories, pe = fe === void 0 ? me : fe, Ee = s.selectorFactory, Ne = Ee === void 0 ? U : Ee;
          return function(Ve, Ae, Ke, Me) {
            Me === void 0 && (Me = {});
            var Fe = Me, et = Fe.pure, qe = et === void 0 || et, Le = Fe.areStatesEqual, dt = Le === void 0 ? he : Le, Rt = Fe.areOwnPropsEqual, Mt = Rt === void 0 ? we : Rt, jt = Fe.areStatePropsEqual, _t = jt === void 0 ? we : jt, zt = Fe.areMergedPropsEqual, ft = zt === void 0 ? we : zt, An = J(Fe, F), lt = W(Ve, O, "mapStateToProps"), In = W(Ae, re, "mapDispatchToProps"), Hn = W(Ke, pe, "mergeProps");
            return m(Ne, A({ methodName: "connect", getDisplayName: function(zr) {
              return "Connect(" + zr + ")";
            }, shouldHandleStateChanges: !!Ve, initMapStateToProps: lt, initMapDispatchToProps: In, initMergeProps: Hn, pure: qe, areStatesEqual: dt, areOwnPropsEqual: Mt, areStatePropsEqual: _t, areMergedPropsEqual: ft }, An));
          };
        }
        var De = je(), Xe;
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
        function qn(E, s, d) {
          const m = function(S, O, L) {
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
          return m && (m.ui = function(S, O) {
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
          }(m.ui, d)), m;
        }
        function Sn(E, s = {}) {
          const d = Tt(E);
          if (!d) return { ui: s.ui };
          const m = Object(gt.d)(d)[0].rootName;
          return { ...s, ...or(E, s, { currentRootName: m }), currentRootName: m, currentNode: null, currentNodeDefinition: null };
        }
        function or(E, s, d) {
          const m = Tt(E), S = { ...s, ...d }, O = S.currentRootName, L = Object(gt.c)(m, O), re = Object(gt.a)(m, O), fe = Object(gt.e)({ currentEditor: m, currentRootName: S.currentRootName, ranges: L, markers: re });
          let pe = S.currentNode, Ee = S.currentNodeDefinition;
          return pe ? pe.root.rootName !== O || !Object(cn.d)(pe) && !pe.parent ? (pe = null, Ee = null) : Ee = Object(gt.b)(m, pe) : Ee = null, { treeDefinition: fe, currentNode: pe, currentNodeDefinition: Ee, ranges: L, markers: re };
        }
        function _r(E) {
          return { type: "SET_VIEW_ACTIVE_TAB", tabName: E };
        }
        function Eo() {
          return { type: "UPDATE_VIEW_STATE" };
        }
        var en = u(9), qt = u(2);
        function xr(E, s, d) {
          const m = function(S, O, L) {
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
          return m && (m.ui = function(S, O, L) {
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
          }(0, m.ui, d)), m;
        }
        function Yt(E, s = {}) {
          const d = Tt(E), m = Object(en.d)(d), S = m[0] ? m[0].rootName : null;
          return { ...s, ...gn(E, s, { currentRootName: S }), currentRootName: S, currentNode: null, currentNodeDefinition: null };
        }
        function gn(E, s, d) {
          const m = { ...s, ...d }, S = m.currentRootName, O = Object(en.c)(Tt(E), S), L = Object(en.e)({ currentEditor: Tt(E), currentRootName: S, ranges: O });
          let re = m.currentNode, fe = m.currentNodeDefinition;
          return re ? re.root.rootName !== S || !Object(qt.g)(re) && !re.parent ? (re = null, fe = null) : fe = Object(en.b)(re) : fe = null, { treeDefinition: L, currentNode: re, currentNodeDefinition: fe, ranges: O };
        }
        function Sr() {
          return { type: "UPDATE_COMMANDS_STATE" };
        }
        var ut = u(1);
        function Cr({ editors: E, currentEditorName: s }, d) {
          if (!d) return null;
          const m = E.get(s).commands.get(d);
          return { currentCommandName: d, type: "Command", url: "https://ckeditor.com/docs/ckeditor5/latest/api/module_core_command-Command.html", properties: Object(ut.b)({ isEnabled: { value: m.isEnabled }, value: { value: m.value } }), command: m };
        }
        function yn({ editors: E, currentEditorName: s }) {
          if (!E.get(s)) return [];
          const d = [];
          for (const [m, S] of E.get(s).commands) {
            const O = [];
            S.value !== void 0 && O.push(["value", Object(ut.a)(S.value, !1)]), d.push({ name: m, type: "element", children: [], node: m, attributes: O, presentation: { isEmpty: !0, cssClass: ["ck-inspector-tree-node_tagless", S.isEnabled ? "" : "ck-inspector-tree-node_disabled"].join(" ") } });
          }
          return d.sort((m, S) => m.name > S.name ? 1 : -1);
        }
        function Tr(E, s = {}) {
          return { ...s, currentCommandName: null, currentCommandDefinition: null, treeDefinition: yn(E) };
        }
        function ir(E) {
          return { type: "SET_SCHEMA_CURRENT_DEFINITION_NAME", currentSchemaDefinitionName: E };
        }
        const ar = ["isBlock", "isInline", "isObject", "isContent", "isLimit", "isSelectable"], Cn = "https://ckeditor.com/docs/ckeditor5/latest/api/";
        function sr({ editors: E, currentEditorName: s }, d) {
          if (!d) return null;
          const m = E.get(s).model.schema, S = m.getDefinitions()[d], O = {}, L = {}, re = {};
          let fe = {};
          for (const pe of ar) S[pe] && (O[pe] = { value: S[pe] });
          for (const pe of S.allowChildren.sort()) L[pe] = { value: !0, title: "Click to see the definition of " + pe };
          for (const pe of S.allowIn.sort()) re[pe] = { value: !0, title: "Click to see the definition of " + pe };
          for (const pe of S.allowAttributes.sort()) fe[pe] = { value: !0 };
          fe = Object(ut.b)(fe);
          for (const pe in fe) {
            const Ee = m.getAttributeProperties(pe), Ne = {};
            for (const Ve in Ee) Ne[Ve] = { value: Ee[Ve] };
            fe[pe].subProperties = Object(ut.b)(Ne);
          }
          return { currentSchemaDefinitionName: d, type: "SchemaCompiledItemDefinition", urls: { general: Cn + "module_engine_model_schema-SchemaCompiledItemDefinition.html", allowAttributes: Cn + "module_engine_model_schema-SchemaItemDefinition.html#member-allowAttributes", allowChildren: Cn + "module_engine_model_schema-SchemaItemDefinition.html#member-allowChildren", allowIn: Cn + "module_engine_model_schema-SchemaItemDefinition.html#member-allowIn" }, properties: Object(ut.b)(O), allowChildren: Object(ut.b)(L), allowIn: Object(ut.b)(re), allowAttributes: fe, definition: S };
        }
        function Tn({ editors: E, currentEditorName: s }) {
          if (!E.get(s)) return [];
          const d = [], m = E.get(s).model.schema.getDefinitions();
          for (const S in m) d.push({ name: S, type: "element", children: [], node: S, attributes: [], presentation: { isEmpty: !0, cssClass: "ck-inspector-tree-node_tagless" } });
          return d.sort((S, O) => S.name > O.name ? 1 : -1);
        }
        function lr(E, s = {}) {
          return { ...s, currentSchemaDefinitionName: null, currentSchemaDefinition: null, treeDefinition: Tn(E) };
        }
        var On = u(8);
        function Xr(E, s) {
          const d = function(m, S) {
            switch (S.type) {
              case "SET_EDITORS":
                return function(O, L) {
                  const re = { editors: new Map(L.editors) };
                  return L.editors.size ? L.editors.has(O.currentEditorName) || (re.currentEditorName = Object(On.b)(L.editors)) : re.currentEditorName = null, { ...O, ...re };
                }(m, S);
              case "SET_CURRENT_EDITOR_NAME":
                return function(O, L) {
                  return { ...O, currentEditorName: L.editorName };
                }(m, S);
              default:
                return m;
            }
          }(E, s);
          return d.currentEditorGlobals = function(m, S, O) {
            switch (O.type) {
              case "SET_EDITORS":
              case "SET_CURRENT_EDITOR_NAME":
                return { ...Zr(m, {}) };
              case "UPDATE_CURRENT_EDITOR_IS_READ_ONLY":
                return Zr(m, S);
              default:
                return S;
            }
          }(d, d.currentEditorGlobals, s), d.ui = function(m, S) {
            if (!m.activeTab) {
              let O;
              return O = m.isCollapsed !== void 0 ? m.isCollapsed : pt.get("is-collapsed") === "true", { ...m, isCollapsed: O, activeTab: pt.get("active-tab-name") || "Model", height: pt.get("height") || "400px", sidePaneWidth: pt.get("side-pane-width") || "500px" };
            }
            switch (S.type) {
              case "TOGGLE_IS_COLLAPSED":
                return function(O) {
                  const L = !O.isCollapsed;
                  return pt.set("is-collapsed", L), { ...O, isCollapsed: L };
                }(m);
              case "SET_HEIGHT":
                return function(O, L) {
                  return pt.set("height", L.newHeight), { ...O, height: L.newHeight };
                }(m, S);
              case "SET_SIDE_PANE_WIDTH":
                return function(O, L) {
                  return pt.set("side-pane-width", L.newWidth), { ...O, sidePaneWidth: L.newWidth };
                }(m, S);
              case "SET_ACTIVE_INSPECTOR_TAB":
                return function(O, L) {
                  return pt.set("active-tab-name", L.tabName), { ...O, activeTab: L.tabName };
                }(m, S);
              default:
                return m;
            }
          }(d.ui, s), d.model = qn(d, d.model, s), d.view = xr(d, d.view, s), d.commands = function(m, S, O) {
            if (m.ui.activeTab !== "Commands") return S;
            if (!S) return Tr(m, S);
            switch (O.type) {
              case "SET_COMMANDS_CURRENT_COMMAND_NAME":
                return { ...S, currentCommandDefinition: Cr(m, O.currentCommandName), currentCommandName: O.currentCommandName };
              case "SET_ACTIVE_INSPECTOR_TAB":
              case "UPDATE_COMMANDS_STATE":
                return { ...S, currentCommandDefinition: Cr(m, S.currentCommandName), treeDefinition: yn(m) };
              case "SET_EDITORS":
              case "SET_CURRENT_EDITOR_NAME":
                return Tr(m, S);
              default:
                return S;
            }
          }(d, d.commands, s), d.schema = function(m, S, O) {
            if (m.ui.activeTab !== "Schema") return S;
            if (!S) return lr(m, S);
            switch (O.type) {
              case "SET_SCHEMA_CURRENT_DEFINITION_NAME":
                return { ...S, currentSchemaDefinition: sr(m, O.currentSchemaDefinitionName), currentSchemaDefinitionName: O.currentSchemaDefinitionName };
              case "SET_ACTIVE_INSPECTOR_TAB":
                return { ...S, currentSchemaDefinition: sr(m, S.currentSchemaDefinitionName), treeDefinition: Tn(m) };
              case "SET_EDITORS":
              case "SET_CURRENT_EDITOR_NAME":
                return lr(m, S);
              default:
                return S;
            }
          }(d, d.schema, s), { ...E, ...d };
        }
        function Zr(E, s) {
          const d = Tt(E);
          return { ...s, isReadOnly: !!d && d.isReadOnly };
        }
        var H = u(46), se = u.n(H), ke = /* @__PURE__ */ function() {
          var E = function(s, d) {
            return (E = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(m, S) {
              m.__proto__ = S;
            } || function(m, S) {
              for (var O in S) S.hasOwnProperty(O) && (m[O] = S[O]);
            })(s, d);
          };
          return function(s, d) {
            function m() {
              this.constructor = s;
            }
            E(s, d), s.prototype = d === null ? Object.create(d) : (m.prototype = d.prototype, new m());
          };
        }(), Ce = function() {
          return (Ce = Object.assign || function(E) {
            for (var s, d = 1, m = arguments.length; d < m; d++) for (var S in s = arguments[d]) Object.prototype.hasOwnProperty.call(s, S) && (E[S] = s[S]);
            return E;
          }).apply(this, arguments);
        }, it = { top: { width: "100%", height: "10px", top: "-5px", left: "0px", cursor: "row-resize" }, right: { width: "10px", height: "100%", top: "0px", right: "-5px", cursor: "col-resize" }, bottom: { width: "100%", height: "10px", bottom: "-5px", left: "0px", cursor: "row-resize" }, left: { width: "10px", height: "100%", top: "0px", left: "-5px", cursor: "col-resize" }, topRight: { width: "20px", height: "20px", position: "absolute", right: "-10px", top: "-10px", cursor: "ne-resize" }, bottomRight: { width: "20px", height: "20px", position: "absolute", right: "-10px", bottom: "-10px", cursor: "se-resize" }, bottomLeft: { width: "20px", height: "20px", position: "absolute", left: "-10px", bottom: "-10px", cursor: "sw-resize" }, topLeft: { width: "20px", height: "20px", position: "absolute", left: "-10px", top: "-10px", cursor: "nw-resize" } }, Ye = function(E) {
          function s() {
            var d = E !== null && E.apply(this, arguments) || this;
            return d.onMouseDown = function(m) {
              d.props.onResizeStart(m, d.props.direction);
            }, d.onTouchStart = function(m) {
              d.props.onResizeStart(m, d.props.direction);
            }, d;
          }
          return ke(s, E), s.prototype.render = function() {
            return c.createElement("div", { className: this.props.className || "", style: Ce(Ce({ position: "absolute", userSelect: "none" }, it[this.props.direction]), this.props.replaceStyles || {}), onMouseDown: this.onMouseDown, onTouchStart: this.onTouchStart }, this.props.children);
          }, s;
        }(c.PureComponent), st = u(14), tt = u.n(st), Ot = /* @__PURE__ */ function() {
          var E = function(s, d) {
            return (E = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(m, S) {
              m.__proto__ = S;
            } || function(m, S) {
              for (var O in S) S.hasOwnProperty(O) && (m[O] = S[O]);
            })(s, d);
          };
          return function(s, d) {
            function m() {
              this.constructor = s;
            }
            E(s, d), s.prototype = d === null ? Object.create(d) : (m.prototype = d.prototype, new m());
          };
        }(), nt = function() {
          return (nt = Object.assign || function(E) {
            for (var s, d = 1, m = arguments.length; d < m; d++) for (var S in s = arguments[d]) Object.prototype.hasOwnProperty.call(s, S) && (E[S] = s[S]);
            return E;
          }).apply(this, arguments);
        }, yt = { width: "auto", height: "auto" }, Pt = tt()(function(E, s, d) {
          return Math.max(Math.min(E, d), s);
        }), tn = tt()(function(E, s) {
          return Math.round(E / s) * s;
        }), ht = tt()(function(E, s) {
          return new RegExp(E, "i").test(s);
        }), Vt = function(E) {
          return !!(E.touches && E.touches.length);
        }, Pn = tt()(function(E, s, d) {
          d === void 0 && (d = 0);
          var m = s.reduce(function(O, L, re) {
            return Math.abs(L - E) < Math.abs(s[O] - E) ? re : O;
          }, 0), S = Math.abs(s[m] - E);
          return d === 0 || S < d ? s[m] : E;
        }), ct = tt()(function(E, s) {
          return E.substr(E.length - s.length, s.length) === s;
        }), bn = tt()(function(E) {
          return (E = E.toString()) === "auto" || ct(E, "px") || ct(E, "%") || ct(E, "vh") || ct(E, "vw") || ct(E, "vmax") || ct(E, "vmin") ? E : E + "px";
        }), un = function(E, s, d, m) {
          if (E && typeof E == "string") {
            if (ct(E, "px")) return Number(E.replace("px", ""));
            if (ct(E, "%")) return s * (Number(E.replace("%", "")) / 100);
            if (ct(E, "vw")) return d * (Number(E.replace("vw", "")) / 100);
            if (ct(E, "vh")) return m * (Number(E.replace("vh", "")) / 100);
          }
          return E;
        }, Nn = tt()(function(E, s, d, m, S, O, L) {
          return m = un(m, E.width, s, d), S = un(S, E.height, s, d), O = un(O, E.width, s, d), L = un(L, E.height, s, d), { maxWidth: m === void 0 ? void 0 : Number(m), maxHeight: S === void 0 ? void 0 : Number(S), minWidth: O === void 0 ? void 0 : Number(O), minHeight: L === void 0 ? void 0 : Number(L) };
        }), _o = ["as", "style", "className", "grid", "snap", "bounds", "boundsByDirection", "size", "defaultSize", "minWidth", "minHeight", "maxWidth", "maxHeight", "lockAspectRatio", "lockAspectRatioExtraWidth", "lockAspectRatioExtraHeight", "enable", "handleStyles", "handleClasses", "handleWrapperStyle", "handleWrapperClass", "children", "onResizeStart", "onResize", "onResizeStop", "handleComponent", "scale", "resizeRatio", "snapGap"], xo = function(E) {
          function s(d) {
            var m = E.call(this, d) || this;
            return m.ratio = 1, m.resizable = null, m.parentLeft = 0, m.parentTop = 0, m.resizableLeft = 0, m.resizableRight = 0, m.resizableTop = 0, m.resizableBottom = 0, m.targetLeft = 0, m.targetTop = 0, m.appendBase = function() {
              if (!m.resizable || !m.window) return null;
              var S = m.parentNode;
              if (!S) return null;
              var O = m.window.document.createElement("div");
              return O.style.width = "100%", O.style.height = "100%", O.style.position = "absolute", O.style.transform = "scale(0, 0)", O.style.left = "0", O.style.flex = "0", O.classList ? O.classList.add("__resizable_base__") : O.className += "__resizable_base__", S.appendChild(O), O;
            }, m.removeBase = function(S) {
              var O = m.parentNode;
              O && O.removeChild(S);
            }, m.ref = function(S) {
              S && (m.resizable = S);
            }, m.state = { isResizing: !1, width: (m.propsSize && m.propsSize.width) === void 0 ? "auto" : m.propsSize && m.propsSize.width, height: (m.propsSize && m.propsSize.height) === void 0 ? "auto" : m.propsSize && m.propsSize.height, direction: "right", original: { x: 0, y: 0, width: 0, height: 0 }, backgroundStyle: { height: "100%", width: "100%", backgroundColor: "rgba(0,0,0,0)", cursor: "auto", opacity: 0, position: "fixed", zIndex: 9999, top: "0", left: "0", bottom: "0", right: "0" }, flexBasis: void 0 }, m.onResizeStart = m.onResizeStart.bind(m), m.onMouseMove = m.onMouseMove.bind(m), m.onMouseUp = m.onMouseUp.bind(m), m;
          }
          return Ot(s, E), Object.defineProperty(s.prototype, "parentNode", { get: function() {
            return this.resizable ? this.resizable.parentNode : null;
          }, enumerable: !1, configurable: !0 }), Object.defineProperty(s.prototype, "window", { get: function() {
            return this.resizable && this.resizable.ownerDocument ? this.resizable.ownerDocument.defaultView : null;
          }, enumerable: !1, configurable: !0 }), Object.defineProperty(s.prototype, "propsSize", { get: function() {
            return this.props.size || this.props.defaultSize || yt;
          }, enumerable: !1, configurable: !0 }), Object.defineProperty(s.prototype, "size", { get: function() {
            var d = 0, m = 0;
            if (this.resizable && this.window) {
              var S = this.resizable.offsetWidth, O = this.resizable.offsetHeight, L = this.resizable.style.position;
              L !== "relative" && (this.resizable.style.position = "relative"), d = this.resizable.style.width !== "auto" ? this.resizable.offsetWidth : S, m = this.resizable.style.height !== "auto" ? this.resizable.offsetHeight : O, this.resizable.style.position = L;
            }
            return { width: d, height: m };
          }, enumerable: !1, configurable: !0 }), Object.defineProperty(s.prototype, "sizeStyle", { get: function() {
            var d = this, m = this.props.size, S = function(O) {
              if (d.state[O] === void 0 || d.state[O] === "auto") return "auto";
              if (d.propsSize && d.propsSize[O] && ct(d.propsSize[O].toString(), "%")) {
                if (ct(d.state[O].toString(), "%")) return d.state[O].toString();
                var L = d.getParentSize();
                return Number(d.state[O].toString().replace("px", "")) / L[O] * 100 + "%";
              }
              return bn(d.state[O]);
            };
            return { width: m && m.width !== void 0 && !this.state.isResizing ? bn(m.width) : S("width"), height: m && m.height !== void 0 && !this.state.isResizing ? bn(m.height) : S("height") };
          }, enumerable: !1, configurable: !0 }), s.prototype.getParentSize = function() {
            if (!this.parentNode) return this.window ? { width: this.window.innerWidth, height: this.window.innerHeight } : { width: 0, height: 0 };
            var d = this.appendBase();
            if (!d) return { width: 0, height: 0 };
            var m = !1, S = this.parentNode.style.flexWrap;
            S !== "wrap" && (m = !0, this.parentNode.style.flexWrap = "wrap"), d.style.position = "relative", d.style.minWidth = "100%";
            var O = { width: d.offsetWidth, height: d.offsetHeight };
            return m && (this.parentNode.style.flexWrap = S), this.removeBase(d), O;
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
          }, s.prototype.createSizeForCssProperty = function(d, m) {
            var S = this.propsSize && this.propsSize[m];
            return this.state[m] !== "auto" || this.state.original[m] !== d || S !== void 0 && S !== "auto" ? d : "auto";
          }, s.prototype.calculateNewMaxFromBoundary = function(d, m) {
            var S, O, L = this.props.boundsByDirection, re = this.state.direction, fe = L && ht("left", re), pe = L && ht("top", re);
            if (this.props.bounds === "parent") {
              var Ee = this.parentNode;
              Ee && (S = fe ? this.resizableRight - this.parentLeft : Ee.offsetWidth + (this.parentLeft - this.resizableLeft), O = pe ? this.resizableBottom - this.parentTop : Ee.offsetHeight + (this.parentTop - this.resizableTop));
            } else this.props.bounds === "window" ? this.window && (S = fe ? this.resizableRight : this.window.innerWidth - this.resizableLeft, O = pe ? this.resizableBottom : this.window.innerHeight - this.resizableTop) : this.props.bounds && (S = fe ? this.resizableRight - this.targetLeft : this.props.bounds.offsetWidth + (this.targetLeft - this.resizableLeft), O = pe ? this.resizableBottom - this.targetTop : this.props.bounds.offsetHeight + (this.targetTop - this.resizableTop));
            return S && Number.isFinite(S) && (d = d && d < S ? d : S), O && Number.isFinite(O) && (m = m && m < O ? m : O), { maxWidth: d, maxHeight: m };
          }, s.prototype.calculateNewSizeFromDirection = function(d, m) {
            var S = this.props.scale || 1, O = this.props.resizeRatio || 1, L = this.state, re = L.direction, fe = L.original, pe = this.props, Ee = pe.lockAspectRatio, Ne = pe.lockAspectRatioExtraHeight, Ve = pe.lockAspectRatioExtraWidth, Ae = fe.width, Ke = fe.height, Me = Ne || 0, Fe = Ve || 0;
            return ht("right", re) && (Ae = fe.width + (d - fe.x) * O / S, Ee && (Ke = (Ae - Fe) / this.ratio + Me)), ht("left", re) && (Ae = fe.width - (d - fe.x) * O / S, Ee && (Ke = (Ae - Fe) / this.ratio + Me)), ht("bottom", re) && (Ke = fe.height + (m - fe.y) * O / S, Ee && (Ae = (Ke - Me) * this.ratio + Fe)), ht("top", re) && (Ke = fe.height - (m - fe.y) * O / S, Ee && (Ae = (Ke - Me) * this.ratio + Fe)), { newWidth: Ae, newHeight: Ke };
          }, s.prototype.calculateNewSizeFromAspectRatio = function(d, m, S, O) {
            var L = this.props, re = L.lockAspectRatio, fe = L.lockAspectRatioExtraHeight, pe = L.lockAspectRatioExtraWidth, Ee = O.width === void 0 ? 10 : O.width, Ne = S.width === void 0 || S.width < 0 ? d : S.width, Ve = O.height === void 0 ? 10 : O.height, Ae = S.height === void 0 || S.height < 0 ? m : S.height, Ke = fe || 0, Me = pe || 0;
            if (re) {
              var Fe = (Ve - Ke) * this.ratio + Me, et = (Ae - Ke) * this.ratio + Me, qe = (Ee - Me) / this.ratio + Ke, Le = (Ne - Me) / this.ratio + Ke, dt = Math.max(Ee, Fe), Rt = Math.min(Ne, et), Mt = Math.max(Ve, qe), jt = Math.min(Ae, Le);
              d = Pt(d, dt, Rt), m = Pt(m, Mt, jt);
            } else d = Pt(d, Ee, Ne), m = Pt(m, Ve, Ae);
            return { newWidth: d, newHeight: m };
          }, s.prototype.setBoundingClientRect = function() {
            if (this.props.bounds === "parent") {
              var d = this.parentNode;
              if (d) {
                var m = d.getBoundingClientRect();
                this.parentLeft = m.left, this.parentTop = m.top;
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
          }, s.prototype.onResizeStart = function(d, m) {
            if (this.resizable && this.window) {
              var S, O = 0, L = 0;
              if (d.nativeEvent && function(Ne) {
                return !!((Ne.clientX || Ne.clientX === 0) && (Ne.clientY || Ne.clientY === 0));
              }(d.nativeEvent)) {
                if (O = d.nativeEvent.clientX, L = d.nativeEvent.clientY, d.nativeEvent.which === 3) return;
              } else d.nativeEvent && Vt(d.nativeEvent) && (O = d.nativeEvent.touches[0].clientX, L = d.nativeEvent.touches[0].clientY);
              if (this.props.onResizeStart && this.resizable && this.props.onResizeStart(d, m, this.resizable) === !1) return;
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
              var Ee = { original: { x: O, y: L, width: this.size.width, height: this.size.height }, isResizing: !0, backgroundStyle: nt(nt({}, this.state.backgroundStyle), { cursor: this.window.getComputedStyle(d.target).cursor || "auto" }), direction: m, flexBasis: S };
              this.setState(Ee);
            }
          }, s.prototype.onMouseMove = function(d) {
            if (this.state.isResizing && this.resizable && this.window) {
              if (this.window.TouchEvent && Vt(d)) try {
                d.preventDefault(), d.stopPropagation();
              } catch {
              }
              var m = this.props, S = m.maxWidth, O = m.maxHeight, L = m.minWidth, re = m.minHeight, fe = Vt(d) ? d.touches[0].clientX : d.clientX, pe = Vt(d) ? d.touches[0].clientY : d.clientY, Ee = this.state, Ne = Ee.direction, Ve = Ee.original, Ae = Ee.width, Ke = Ee.height, Me = this.getParentSize(), Fe = Nn(Me, this.window.innerWidth, this.window.innerHeight, S, O, L, re);
              S = Fe.maxWidth, O = Fe.maxHeight, L = Fe.minWidth, re = Fe.minHeight;
              var et = this.calculateNewSizeFromDirection(fe, pe), qe = et.newHeight, Le = et.newWidth, dt = this.calculateNewMaxFromBoundary(S, O), Rt = this.calculateNewSizeFromAspectRatio(Le, qe, { width: dt.maxWidth, height: dt.maxHeight }, { width: L, height: re });
              if (Le = Rt.newWidth, qe = Rt.newHeight, this.props.grid) {
                var Mt = tn(Le, this.props.grid[0]), jt = tn(qe, this.props.grid[1]), _t = this.props.snapGap || 0;
                Le = _t === 0 || Math.abs(Mt - Le) <= _t ? Mt : Le, qe = _t === 0 || Math.abs(jt - qe) <= _t ? jt : qe;
              }
              this.props.snap && this.props.snap.x && (Le = Pn(Le, this.props.snap.x, this.props.snapGap)), this.props.snap && this.props.snap.y && (qe = Pn(qe, this.props.snap.y, this.props.snapGap));
              var zt = { width: Le - Ve.width, height: qe - Ve.height };
              Ae && typeof Ae == "string" && (ct(Ae, "%") ? Le = Le / Me.width * 100 + "%" : ct(Ae, "vw") ? Le = Le / this.window.innerWidth * 100 + "vw" : ct(Ae, "vh") && (Le = Le / this.window.innerHeight * 100 + "vh")), Ke && typeof Ke == "string" && (ct(Ke, "%") ? qe = qe / Me.height * 100 + "%" : ct(Ke, "vw") ? qe = qe / this.window.innerWidth * 100 + "vw" : ct(Ke, "vh") && (qe = qe / this.window.innerHeight * 100 + "vh"));
              var ft = { width: this.createSizeForCssProperty(Le, "width"), height: this.createSizeForCssProperty(qe, "height") };
              this.flexDir === "row" ? ft.flexBasis = ft.width : this.flexDir === "column" && (ft.flexBasis = ft.height), this.setState(ft), this.props.onResize && this.props.onResize(d, Ne, this.resizable, zt);
            }
          }, s.prototype.onMouseUp = function(d) {
            var m = this.state, S = m.isResizing, O = m.direction, L = m.original;
            if (S && this.resizable) {
              var re = { width: this.size.width - L.width, height: this.size.height - L.height };
              this.props.onResizeStop && this.props.onResizeStop(d, O, this.resizable, re), this.props.size && this.setState(this.props.size), this.unbindEvents(), this.setState({ isResizing: !1, backgroundStyle: nt(nt({}, this.state.backgroundStyle), { cursor: "auto" }) });
            }
          }, s.prototype.updateSize = function(d) {
            this.setState({ width: d.width, height: d.height });
          }, s.prototype.renderResizer = function() {
            var d = this, m = this.props, S = m.enable, O = m.handleStyles, L = m.handleClasses, re = m.handleWrapperStyle, fe = m.handleWrapperClass, pe = m.handleComponent;
            if (!S) return null;
            var Ee = Object.keys(S).map(function(Ne) {
              return S[Ne] !== !1 ? c.createElement(Ye, { key: Ne, direction: Ne, onResizeStart: d.onResizeStart, replaceStyles: O && O[Ne], className: L && L[Ne] }, pe && pe[Ne] ? pe[Ne] : null) : null;
            });
            return c.createElement("div", { className: fe, style: re }, Ee);
          }, s.prototype.render = function() {
            var d = this, m = Object.keys(this.props).reduce(function(L, re) {
              return _o.indexOf(re) !== -1 || (L[re] = d.props[re]), L;
            }, {}), S = nt(nt(nt({ position: "relative", userSelect: this.state.isResizing ? "none" : "auto" }, this.props.style), this.sizeStyle), { maxWidth: this.props.maxWidth, maxHeight: this.props.maxHeight, minWidth: this.props.minWidth, minHeight: this.props.minHeight, boxSizing: "border-box", flexShrink: 0 });
            this.state.flexBasis && (S.flexBasis = this.state.flexBasis);
            var O = this.props.as || "div";
            return c.createElement(O, nt({ ref: this.ref, style: S, className: this.props.className }, m), this.state.isResizing && c.createElement("div", { style: this.state.backgroundStyle }), this.props.children, this.renderResizer());
          }, s.defaultProps = { as: "div", onResizeStart: function() {
          }, onResize: function() {
          }, onResizeStop: function() {
          }, enable: { top: !0, right: !0, bottom: !0, left: !0, topRight: !0, bottomRight: !0, bottomLeft: !0, topLeft: !0 }, style: {}, grid: [1, 1], lockAspectRatio: !1, lockAspectRatioExtraWidth: 0, lockAspectRatioExtraHeight: 0, scale: 1, resizeRatio: 1, snapGap: 0 }, s;
        }(c.PureComponent), rt = function(E, s) {
          return (rt = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d, m) {
            d.__proto__ = m;
          } || function(d, m) {
            for (var S in m) m.hasOwnProperty(S) && (d[S] = m[S]);
          })(E, s);
        }, Ue = function() {
          return (Ue = Object.assign || function(E) {
            for (var s, d = 1, m = arguments.length; d < m; d++) for (var S in s = arguments[d]) Object.prototype.hasOwnProperty.call(s, S) && (E[S] = s[S]);
            return E;
          }).apply(this, arguments);
        }, Yn = se.a, Kt = { width: "auto", height: "auto", display: "inline-block", position: "absolute", top: 0, left: 0 }, Or = function(E) {
          function s(d) {
            var m = E.call(this, d) || this;
            return m.resizing = !1, m.resizingPosition = { x: 0, y: 0 }, m.offsetFromParent = { left: 0, top: 0 }, m.resizableElement = { current: null }, m.refDraggable = function(S) {
              S && (m.draggable = S);
            }, m.refResizable = function(S) {
              S && (m.resizable = S, m.resizableElement.current = S.resizable);
            }, m.state = { original: { x: 0, y: 0 }, bounds: { top: 0, right: 0, bottom: 0, left: 0 }, maxWidth: d.maxWidth, maxHeight: d.maxHeight }, m.onResizeStart = m.onResizeStart.bind(m), m.onResize = m.onResize.bind(m), m.onResizeStop = m.onResizeStop.bind(m), m.onDragStart = m.onDragStart.bind(m), m.onDrag = m.onDrag.bind(m), m.onDragStop = m.onDragStop.bind(m), m.getMaxSizesFromProps = m.getMaxSizesFromProps.bind(m), m;
          }
          return function(d, m) {
            function S() {
              this.constructor = d;
            }
            rt(d, m), d.prototype = m === null ? Object.create(m) : (S.prototype = m.prototype, new S());
          }(s, E), s.prototype.componentDidMount = function() {
            this.updateOffsetFromParent();
            var d = this.offsetFromParent, m = d.left, S = d.top, O = this.getDraggablePosition(), L = O.x, re = O.y;
            this.draggable.setState({ x: L - m, y: re - S }), this.forceUpdate();
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
            var m = this.props.scale;
            switch (this.props.bounds) {
              case "window":
                return window.innerHeight / m;
              case "body":
                return document.body.offsetHeight / m;
              default:
                return d.offsetHeight;
            }
          }, s.prototype.getOffsetWidth = function(d) {
            var m = this.props.scale;
            switch (this.props.bounds) {
              case "window":
                return window.innerWidth / m;
              case "body":
                return document.body.offsetWidth / m;
              default:
                return d.offsetWidth;
            }
          }, s.prototype.onDragStart = function(d, m) {
            if (this.props.onDragStart && this.props.onDragStart(d, m), this.props.bounds) {
              var S, O = this.getParent(), L = this.props.scale;
              if (this.props.bounds === "parent") S = O;
              else {
                if (this.props.bounds === "body") {
                  var re = O.getBoundingClientRect(), fe = re.left, pe = re.top, Ee = document.body.getBoundingClientRect(), Ne = -(fe - O.offsetLeft * L - Ee.left) / L, Ve = -(pe - O.offsetTop * L - Ee.top) / L, Ae = (document.body.offsetWidth - this.resizable.size.width * L) / L + Ne, Ke = (document.body.offsetHeight - this.resizable.size.height * L) / L + Ve;
                  return this.setState({ bounds: { top: Ve, right: Ae, bottom: Ke, left: Ne } });
                }
                if (this.props.bounds === "window") {
                  if (!this.resizable) return;
                  var Me = O.getBoundingClientRect(), Fe = Me.left, et = Me.top, qe = -(Fe - O.offsetLeft * L) / L, Le = -(et - O.offsetTop * L) / L;
                  return Ae = (window.innerWidth - this.resizable.size.width * L) / L + qe, Ke = (window.innerHeight - this.resizable.size.height * L) / L + Le, this.setState({ bounds: { top: Le, right: Ae, bottom: Ke, left: qe } });
                }
                S = document.querySelector(this.props.bounds);
              }
              if (S instanceof HTMLElement && O instanceof HTMLElement) {
                var dt = S.getBoundingClientRect(), Rt = dt.left, Mt = dt.top, jt = O.getBoundingClientRect(), _t = (Rt - jt.left) / L, zt = Mt - jt.top;
                if (this.resizable) {
                  this.updateOffsetFromParent();
                  var ft = this.offsetFromParent;
                  this.setState({ bounds: { top: zt - ft.top, right: _t + (S.offsetWidth - this.resizable.size.width) - ft.left / L, bottom: zt + (S.offsetHeight - this.resizable.size.height) - ft.top, left: _t - ft.left / L } });
                }
              }
            }
          }, s.prototype.onDrag = function(d, m) {
            if (this.props.onDrag) {
              var S = this.offsetFromParent;
              return this.props.onDrag(d, Ue(Ue({}, m), { x: m.x - S.left, y: m.y - S.top }));
            }
          }, s.prototype.onDragStop = function(d, m) {
            if (this.props.onDragStop) {
              var S = this.offsetFromParent, O = S.left, L = S.top;
              return this.props.onDragStop(d, Ue(Ue({}, m), { x: m.x + O, y: m.y + L }));
            }
          }, s.prototype.onResizeStart = function(d, m, S) {
            d.stopPropagation(), this.resizing = !0;
            var O = this.props.scale, L = this.offsetFromParent, re = this.getDraggablePosition();
            if (this.resizingPosition = { x: re.x + L.left, y: re.y + L.top }, this.setState({ original: re }), this.props.bounds) {
              var fe = this.getParent(), pe = void 0;
              pe = this.props.bounds === "parent" ? fe : this.props.bounds === "body" ? document.body : this.props.bounds === "window" ? window : document.querySelector(this.props.bounds);
              var Ee = this.getSelfElement();
              if (Ee instanceof Element && (pe instanceof HTMLElement || pe === window) && fe instanceof HTMLElement) {
                var Ne = this.getMaxSizesFromProps(), Ve = Ne.maxWidth, Ae = Ne.maxHeight, Ke = this.getParentSize();
                if (Ve && typeof Ve == "string") if (Ve.endsWith("%")) {
                  var Me = Number(Ve.replace("%", "")) / 100;
                  Ve = Ke.width * Me;
                } else Ve.endsWith("px") && (Ve = Number(Ve.replace("px", "")));
                Ae && typeof Ae == "string" && (Ae.endsWith("%") ? (Me = Number(Ae.replace("%", "")) / 100, Ae = Ke.width * Me) : Ae.endsWith("px") && (Ae = Number(Ae.replace("px", ""))));
                var Fe = Ee.getBoundingClientRect(), et = Fe.left, qe = Fe.top, Le = this.props.bounds === "window" ? { left: 0, top: 0 } : pe.getBoundingClientRect(), dt = Le.left, Rt = Le.top, Mt = this.getOffsetWidth(pe), jt = this.getOffsetHeight(pe), _t = m.toLowerCase().endsWith("left"), zt = m.toLowerCase().endsWith("right"), ft = m.startsWith("top"), An = m.startsWith("bottom");
                if (_t && this.resizable) {
                  var lt = (et - dt) / O + this.resizable.size.width;
                  this.setState({ maxWidth: lt > Number(Ve) ? Ve : lt });
                }
                (zt || this.props.lockAspectRatio && !_t) && (lt = Mt + (dt - et) / O, this.setState({ maxWidth: lt > Number(Ve) ? Ve : lt })), ft && this.resizable && (lt = (qe - Rt) / O + this.resizable.size.height, this.setState({ maxHeight: lt > Number(Ae) ? Ae : lt })), (An || this.props.lockAspectRatio && !ft) && (lt = jt + (Rt - qe) / O, this.setState({ maxHeight: lt > Number(Ae) ? Ae : lt }));
              }
            } else this.setState({ maxWidth: this.props.maxWidth, maxHeight: this.props.maxHeight });
            this.props.onResizeStart && this.props.onResizeStart(d, m, S);
          }, s.prototype.onResize = function(d, m, S, O) {
            var L = { x: this.state.original.x, y: this.state.original.y }, re = -O.width, fe = -O.height;
            ["top", "left", "topLeft", "bottomLeft", "topRight"].indexOf(m) !== -1 && (m === "bottomLeft" ? L.x += re : (m === "topRight" || (L.x += re), L.y += fe)), L.x === this.draggable.state.x && L.y === this.draggable.state.y || this.draggable.setState(L), this.updateOffsetFromParent();
            var pe = this.offsetFromParent, Ee = this.getDraggablePosition().x + pe.left, Ne = this.getDraggablePosition().y + pe.top;
            this.resizingPosition = { x: Ee, y: Ne }, this.props.onResize && this.props.onResize(d, m, S, O, { x: Ee, y: Ne });
          }, s.prototype.onResizeStop = function(d, m, S, O) {
            this.resizing = !1;
            var L = this.getMaxSizesFromProps(), re = L.maxWidth, fe = L.maxHeight;
            this.setState({ maxWidth: re, maxHeight: fe }), this.props.onResizeStop && this.props.onResizeStop(d, m, S, O, this.resizingPosition);
          }, s.prototype.updateSize = function(d) {
            this.resizable && this.resizable.updateSize({ width: d.width, height: d.height });
          }, s.prototype.updatePosition = function(d) {
            this.draggable.setState(d);
          }, s.prototype.updateOffsetFromParent = function() {
            var d = this.props.scale, m = this.getParent(), S = this.getSelfElement();
            if (!m || S === null) return { top: 0, left: 0 };
            var O = m.getBoundingClientRect(), L = O.left, re = O.top, fe = S.getBoundingClientRect(), pe = this.getDraggablePosition();
            this.offsetFromParent = { left: fe.left - L - pe.x * d, top: fe.top - re - pe.y * d };
          }, s.prototype.render = function() {
            var d = this.props, m = d.disableDragging, S = d.style, O = d.dragHandleClassName, L = d.position, re = d.onMouseDown, fe = d.onMouseUp, pe = d.dragAxis, Ee = d.dragGrid, Ne = d.bounds, Ve = d.enableUserSelectHack, Ae = d.cancel, Ke = d.children, Me = (d.onResizeStart, d.onResize, d.onResizeStop, d.onDragStart, d.onDrag, d.onDragStop, d.resizeHandleStyles), Fe = d.resizeHandleClasses, et = d.resizeHandleComponent, qe = d.enableResizing, Le = d.resizeGrid, dt = d.resizeHandleWrapperClass, Rt = d.resizeHandleWrapperStyle, Mt = d.scale, jt = d.allowAnyClick, _t = function($t, dn) {
              var Xn = {};
              for (var Gt in $t) Object.prototype.hasOwnProperty.call($t, Gt) && dn.indexOf(Gt) < 0 && (Xn[Gt] = $t[Gt]);
              if ($t != null && typeof Object.getOwnPropertySymbols == "function") {
                var fn = 0;
                for (Gt = Object.getOwnPropertySymbols($t); fn < Gt.length; fn++) dn.indexOf(Gt[fn]) < 0 && Object.prototype.propertyIsEnumerable.call($t, Gt[fn]) && (Xn[Gt[fn]] = $t[Gt[fn]]);
              }
              return Xn;
            }(d, ["disableDragging", "style", "dragHandleClassName", "position", "onMouseDown", "onMouseUp", "dragAxis", "dragGrid", "bounds", "enableUserSelectHack", "cancel", "children", "onResizeStart", "onResize", "onResizeStop", "onDragStart", "onDrag", "onDragStop", "resizeHandleStyles", "resizeHandleClasses", "resizeHandleComponent", "enableResizing", "resizeGrid", "resizeHandleWrapperClass", "resizeHandleWrapperStyle", "scale", "allowAnyClick"]), zt = this.props.default ? Ue({}, this.props.default) : void 0;
            delete _t.default;
            var ft, An = m || O ? { cursor: "auto" } : { cursor: "move" }, lt = Ue(Ue(Ue({}, Kt), An), S), In = this.offsetFromParent, Hn = In.left, zr = In.top;
            L && (ft = { x: L.x - Hn, y: L.y - zr });
            var xt, ao = this.resizing ? void 0 : ft, Mn = this.resizing ? "both" : pe;
            return Object(c.createElement)(Yn, { ref: this.refDraggable, handle: O ? "." + O : void 0, defaultPosition: zt, onMouseDown: re, onMouseUp: fe, onStart: this.onDragStart, onDrag: this.onDrag, onStop: this.onDragStop, axis: Mn, disabled: m, grid: Ee, bounds: Ne ? this.state.bounds : void 0, position: ao, enableUserSelectHack: Ve, cancel: Ae, scale: Mt, allowAnyClick: jt, nodeRef: this.resizableElement }, Object(c.createElement)(xo, Ue({}, _t, { ref: this.refResizable, defaultSize: zt, size: this.props.size, enable: typeof qe == "boolean" ? (xt = qe, { bottom: xt, bottomLeft: xt, bottomRight: xt, left: xt, right: xt, top: xt, topLeft: xt, topRight: xt }) : qe, onResizeStart: this.onResizeStart, onResize: this.onResize, onResizeStop: this.onResizeStop, style: lt, minWidth: this.props.minWidth, minHeight: this.props.minHeight, maxWidth: this.resizing ? this.state.maxWidth : this.props.maxWidth, maxHeight: this.resizing ? this.state.maxHeight : this.props.maxHeight, grid: Le, handleWrapperClass: dt, handleWrapperStyle: Rt, lockAspectRatio: this.props.lockAspectRatio, lockAspectRatioExtraWidth: this.props.lockAspectRatioExtraWidth, lockAspectRatioExtraHeight: this.props.lockAspectRatioExtraHeight, handleStyles: Me, handleClasses: Fe, handleComponent: et, scale: this.props.scale }), Ke));
          }, s.defaultProps = { maxWidth: Number.MAX_SAFE_INTEGER, maxHeight: Number.MAX_SAFE_INTEGER, scale: 1, onResizeStart: function() {
          }, onResize: function() {
          }, onResizeStop: function() {
          }, onDragStart: function() {
          }, onDrag: function() {
          }, onDragStop: function() {
          } }, s;
        }(c.PureComponent);
        u(58);
        class It extends c.Component {
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
        class nn extends c.Component {
          render() {
            return r.a.createElement("button", { className: ["ck-inspector-horizontal-nav__item", this.props.isActive ? " ck-inspector-horizontal-nav__item_active" : ""].join(" "), key: this.props.label, onClick: this.props.onClick, type: "button" }, this.props.label);
          }
        }
        u(60);
        class Wt extends c.Component {
          render() {
            const s = Array.isArray(this.props.children) ? this.props.children : [this.props.children];
            return r.a.createElement("div", { className: "ck-inspector-navbox" }, s.length > 1 ? r.a.createElement("div", { className: "ck-inspector-navbox__navigation" }, s[0]) : "", r.a.createElement("div", { className: "ck-inspector-navbox__content" }, s[s.length - 1]));
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
            return r.a.createElement(Wt, null, [this.props.contentBefore, r.a.createElement(It, { key: "navigation", definitions: s.map((d) => d.props.label), activeTab: this.props.activeTab, onClick: this.handleTabClick }), this.props.contentAfter], s.filter((d) => d.props.label === this.props.activeTab));
          }
        }
        var cr = u(5), Rn = u.n(cr);
        class rn extends c.Component {
          render() {
            return [r.a.createElement("label", { htmlFor: this.props.id, key: "label" }, this.props.label, ":"), r.a.createElement("select", { id: this.props.id, value: this.props.value, onChange: this.props.onChange, key: "select" }, this.props.options.map((s) => r.a.createElement("option", { value: s, key: s }, s)))];
          }
          shouldComponentUpdate(s) {
            return !Rn()(this.props, s);
          }
        }
        u(62);
        class bt extends c.PureComponent {
          render() {
            const s = ["ck-inspector-button", this.props.className || "", this.props.isOn ? "ck-inspector-button_on" : "", this.props.isEnabled === !1 ? "ck-inspector-button_disabled" : ""].filter((d) => d).join(" ");
            return r.a.createElement("button", { className: s, type: "button", onClick: this.props.isEnabled === !1 ? () => {
            } : this.props.onClick, title: this.props.title || this.props.text }, r.a.createElement("span", null, this.props.text), this.props.icon);
          }
        }
        u(64);
        class Et extends c.Component {
          render() {
            return r.a.createElement("div", { className: ["ck-inspector-pane", this.props.splitVertically ? "ck-inspector-pane_vsplit" : "", this.props.isEmpty ? "ck-inspector-pane_empty" : ""].join(" ") }, this.props.children);
          }
        }
        u(66);
        const ur = { position: "relative" };
        class dr extends c.Component {
          get maxSidePaneWidth() {
            return Math.min(window.innerWidth - 400, 0.8 * window.innerWidth);
          }
          render() {
            return r.a.createElement("div", { className: "ck-inspector-side-pane" }, r.a.createElement(Or, { enableResizing: { left: !0 }, disableDragging: !0, minWidth: 200, maxWidth: this.maxSidePaneWidth, style: ur, position: { x: "100%", y: "100%" }, size: { width: this.props.sidePaneWidth, height: "100%" }, onResizeStop: (s, d, m) => this.props.setSidePaneWidth(m.style.width) }, this.props.children));
          }
        }
        var vn = De(({ ui: { sidePaneWidth: E } }) => ({ sidePaneWidth: E }), { setSidePaneWidth: function(E) {
          return { type: "SET_SIDE_PANE_WIDTH", newWidth: E };
        } })(dr), Ut = u(11);
        u(68);
        class Ht extends c.PureComponent {
          render() {
            return [r.a.createElement("input", { type: "checkbox", className: "ck-inspector-checkbox", id: this.props.id, key: "input", checked: this.props.isChecked, onChange: this.props.onChange }), r.a.createElement("label", { htmlFor: this.props.id, key: "label" }, this.props.label)];
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
            return r.a.createElement(Wt, null, [r.a.createElement("div", { className: "ck-inspector-tree__config", key: "root-cfg" }, r.a.createElement(rn, { id: "view-root-select", label: "Root", value: this.props.currentRootName, options: Object(gt.d)(s).map((d) => d.rootName), onChange: this.handleRootChange })), r.a.createElement("span", { className: "ck-inspector-separator", key: "separator" }), r.a.createElement("div", { className: "ck-inspector-tree__config", key: "text-cfg" }, r.a.createElement(Ht, { label: "Compact text", id: "model-compact-text", isChecked: this.props.showCompactText, onChange: this.props.toggleModelShowCompactText }), r.a.createElement(Ht, { label: "Show markers", id: "model-show-markers", isChecked: this.props.showMarkers, onChange: this.props.toggleModelShowMarkers }))], r.a.createElement(Ut.a, { className: [this.props.showMarkers ? "" : "ck-inspector-model-tree__hide-markers"], definition: this.props.treeDefinition, textDirection: s.locale.contentLanguageDirection, onClick: this.handleTreeClick, showCompactText: this.props.showCompactText, activeNode: this.props.currentNode }));
          }
        }
        var Kn = De(({ editors: E, currentEditorName: s, model: { treeDefinition: d, currentRootName: m, currentNode: S, ui: { showMarkers: O, showCompactText: L } } }) => ({ treeDefinition: d, editors: E, currentEditorName: s, currentRootName: m, currentNode: S, showMarkers: O, showCompactText: L }), { toggleModelShowCompactText: function() {
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
            for (const m in this.props.itemDefinitions) {
              const S = this.props.itemDefinitions[m], { subProperties: O, presentation: L = {} } = S, re = O && Object.keys(O).length, fe = Object(ut.c)(String(S.value), 2e3), pe = [r.a.createElement(Jr, { key: `${this.props.name}-${m}-name`, name: m, listUid: this.props.name, canCollapse: re, colorBox: L.colorBox, expandCollapsibles: s, onClick: this.props.onPropertyTitleClick, title: S.title }), r.a.createElement("dd", { key: `${this.props.name}-${m}-value` }, r.a.createElement("input", { id: `${this.props.name}-${m}-value-input`, type: "text", value: fe, readOnly: !0 }))];
              re && pe.push(r.a.createElement(fr, { name: `${this.props.name}-${m}`, key: `${this.props.name}-${m}`, itemDefinitions: O, presentation: this.props.presentation })), d.push(pe);
            }
            return r.a.createElement("dl", { className: "ck-inspector-property-list ck-inspector-code" }, d);
          }
          shouldComponentUpdate(s) {
            return !Rn()(this.props, s);
          }
        }
        class Jr extends c.PureComponent {
          constructor(s) {
            super(s), this.state = { isCollapsed: !this.props.expandCollapsibles }, this.handleCollapsedChange = this.handleCollapsedChange.bind(this);
          }
          handleCollapsedChange() {
            this.setState({ isCollapsed: !this.state.isCollapsed });
          }
          render() {
            const s = ["ck-inspector-property-list__title"];
            let d, m;
            return this.props.canCollapse && (s.push("ck-inspector-property-list__title_collapsible"), s.push("ck-inspector-property-list__title_" + (this.state.isCollapsed ? "collapsed" : "expanded")), d = r.a.createElement("button", { type: "button", onClick: this.handleCollapsedChange }, "Toggle")), this.props.colorBox && (m = r.a.createElement("span", { className: "ck-inspector-property-list__title__color-box", style: { background: this.props.colorBox } })), this.props.onClick && s.push("ck-inspector-property-list__title_clickable"), r.a.createElement("dt", { className: s.join(" ").trim() }, d, m, r.a.createElement("label", { htmlFor: `${this.props.listUid}-${this.props.name}-value-input`, onClick: this.props.onClick ? () => this.props.onClick(this.props.name) : null, title: this.props.title }, this.props.name), ":");
          }
        }
        u(72);
        function Pr() {
          return (Pr = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var m in d) Object.prototype.hasOwnProperty.call(d, m) && (E[m] = d[m]);
            }
            return E;
          }).apply(this, arguments);
        }
        class Vn extends c.PureComponent {
          render() {
            const s = [];
            for (const d of this.props.lists) Object.keys(d.itemDefinitions).length && s.push(r.a.createElement("hr", { key: d.name + "-separator" }), r.a.createElement("h3", { key: d.name + "-header" }, r.a.createElement("a", { href: d.url, target: "_blank", rel: "noopener noreferrer" }, d.name), d.buttons && d.buttons.map((m, S) => r.a.createElement(bt, Pr({ key: "button" + S }, m)))), r.a.createElement(fr, { key: d.name + "-list", name: d.name, itemDefinitions: d.itemDefinitions, presentation: d.presentation, onPropertyTitleClick: d.onPropertyTitleClick }));
            return r.a.createElement("div", { className: "ck-inspector__object-inspector" }, r.a.createElement("h2", { className: "ck-inspector-code" }, this.props.header), s);
          }
        }
        var Nt = u(3);
        function So() {
          return (So = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var m in d) Object.prototype.hasOwnProperty.call(d, m) && (E[m] = d[m]);
            }
            return E;
          }).apply(this, arguments);
        }
        var kn = ({ styles: E = {}, ...s }) => r.a.createElement("svg", So({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, s), r.a.createElement("path", { d: "M17 15.75a.75.75 0 01.102 1.493L17 17.25H9a.75.75 0 01-.102-1.493L9 15.75h8zM2.156 2.947l.095.058 7.58 5.401a.75.75 0 01.084 1.152l-.083.069-7.58 5.425a.75.75 0 01-.958-1.148l.086-.071 6.724-4.815-6.723-4.792a.75.75 0 01-.233-.95l.057-.096a.75.75 0 01.951-.233z" }));
        function Nr() {
          return (Nr = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var m in d) Object.prototype.hasOwnProperty.call(d, m) && (E[m] = d[m]);
            }
            return E;
          }).apply(this, arguments);
        }
        var Ta = ({ styles: E = {}, ...s }) => r.a.createElement("svg", Nr({ fill: "none", xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 19 19" }, s), r.a.createElement("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M6 1a1 1 0 011-1h5a1 1 0 011 1v5a1 1 0 01-1 1h-2v2h5a1 1 0 011 1v3h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3a1 1 0 011-1h1v-2.5a.5.5 0 00-.5-.5H10v3h1a1 1 0 011 1v3a1 1 0 01-1 1H8a1 1 0 01-1-1v-3a1 1 0 011-1h1v-3H4.5a.5.5 0 00-.5.5V13h1a1 1 0 011 1v3a1 1 0 01-1 1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1v-3a1 1 0 011-1h5V7H7a1 1 0 01-1-1V1zm1.5 4.5v-4h4v4h-4zm-5 11v-2h2v2h-2zm6-2v2h2v-2h-2zm6 2v-2h2v2h-2z", fill: "#000" }));
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
            return s ? r.a.createElement(Vn, { header: [r.a.createElement("span", { key: "link" }, r.a.createElement("a", { href: s.url, target: "_blank", rel: "noopener noreferrer" }, r.a.createElement("b", null, s.type)), ":", s.type === "Text" ? r.a.createElement("em", null, s.name) : s.name), r.a.createElement(bt, { key: "log", icon: r.a.createElement(kn, null), text: "Log in console", onClick: this.handleNodeLogButtonClick }), r.a.createElement(bt, { key: "schema", icon: r.a.createElement(Ta, null), text: "Show in schema", onClick: this.handleNodeSchemaButtonClick })], lists: [{ name: "Attributes", url: s.url, itemDefinitions: s.attributes }, { name: "Properties", url: s.url, itemDefinitions: s.properties }] }) : r.a.createElement(Et, { isEmpty: "true" }, r.a.createElement("p", null, "Select a node in the tree to inspect"));
          }
        }
        var vi = De(({ editors: E, currentEditorName: s, model: { currentNodeDefinition: d } }) => ({ editors: E, currentEditorName: s, currentNodeDefinition: d }), { setActiveTab: wt, setSchemaCurrentDefinitionName: ir })(Co);
        function ki() {
          return (ki = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var m in d) Object.prototype.hasOwnProperty.call(d, m) && (E[m] = d[m]);
            }
            return E;
          }).apply(this, arguments);
        }
        var Rr = ({ styles: E = {}, ...s }) => r.a.createElement("svg", ki({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, s), r.a.createElement("path", { d: "M9.5 4.5c1.85 0 3.667.561 5.199 1.519C16.363 7.059 17.5 8.4 17.5 9.5s-1.137 2.441-2.801 3.481c-1.532.958-3.35 1.519-5.199 1.519-1.85 0-3.667-.561-5.199-1.519C2.637 11.941 1.5 10.6 1.5 9.5s1.137-2.441 2.801-3.481C5.833 5.06 7.651 4.5 9.5 4.5zm0 1a4 4 0 11-.2.005l.2-.005c-1.655 0-3.29.505-4.669 1.367C3.431 7.742 2.5 8.84 2.5 9.5c0 .66.931 1.758 2.331 2.633C6.21 12.995 7.845 13.5 9.5 13.5c1.655 0 3.29-.505 4.669-1.367 1.4-.875 2.331-1.974 2.331-2.633 0-.66-.931-1.758-2.331-2.633C12.79 6.005 11.155 5.5 9.5 5.5zM8 6.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" }));
        const pr = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_selection-Selection.html";
        class wi extends c.Component {
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
            return r.a.createElement(Vn, { header: [r.a.createElement("span", { key: "link" }, r.a.createElement("a", { href: pr, target: "_blank", rel: "noopener noreferrer" }, r.a.createElement("b", null, "Selection"))), r.a.createElement(bt, { key: "log", icon: r.a.createElement(kn, null), text: "Log in console", onClick: this.handleSelectionLogButtonClick }), r.a.createElement(bt, { key: "scroll", icon: r.a.createElement(Rr, null), text: "Scroll to selection", onClick: this.handleScrollToSelectionButtonClick })], lists: [{ name: "Attributes", url: pr + "#function-getAttributes", itemDefinitions: d.attributes }, { name: "Properties", url: "" + pr, itemDefinitions: d.properties }, { name: "Anchor", url: pr + "#member-anchor", buttons: [{ icon: r.a.createElement(kn, null), text: "Log in console", onClick: () => Nt.a.log(s.model.document.selection.anchor) }], itemDefinitions: d.anchor }, { name: "Focus", url: pr + "#member-focus", buttons: [{ icon: r.a.createElement(kn, null), text: "Log in console", onClick: () => Nt.a.log(s.model.document.selection.focus) }], itemDefinitions: d.focus }, { name: "Ranges", url: pr + "#function-getRanges", buttons: [{ icon: r.a.createElement(kn, null), text: "Log in console", onClick: () => Nt.a.log(...s.model.document.selection.getRanges()) }], itemDefinitions: d.ranges, presentation: { expandCollapsibles: !0 } }] });
          }
        }
        var Ei = De(({ editors: E, currentEditorName: s, model: { ranges: d } }) => {
          const m = E.get(s);
          return { editor: m, currentEditorName: s, info: function(S, O) {
            const L = S.model.document.selection, re = L.anchor, fe = L.focus, pe = { properties: { isCollapsed: { value: L.isCollapsed }, isBackward: { value: L.isBackward }, isGravityOverridden: { value: L.isGravityOverridden }, rangeCount: { value: L.rangeCount } }, attributes: {}, anchor: Dr(Object(cn.a)(re)), focus: Dr(Object(cn.a)(fe)), ranges: {} };
            for (const [Ee, Ne] of L.getAttributes()) pe.attributes[Ee] = { value: Ne };
            O.forEach((Ee, Ne) => {
              pe.ranges[Ne] = { value: "", subProperties: { start: { value: "", subProperties: Object(ut.b)(Dr(Ee.start)) }, end: { value: "", subProperties: Object(ut.b)(Dr(Ee.end)) } } };
            });
            for (const Ee in pe) Ee !== "ranges" && (pe[Ee] = Object(ut.b)(pe[Ee]));
            return pe;
          }(m, d) };
        }, {})(wi);
        function Dr({ path: E, stickiness: s, index: d, isAtEnd: m, isAtStart: S, offset: O, textNode: L }) {
          return { path: { value: E }, stickiness: { value: s }, index: { value: d }, isAtEnd: { value: m }, isAtStart: { value: S }, offset: { value: O }, textNode: { value: L } };
        }
        class Oa extends c.Component {
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
                  const pe = Object(ut.b)(_i(fe));
                  L[re] = { value: "", presentation: { colorBox: fe.presentation.color }, subProperties: pe };
                } else {
                  const pe = Object.keys(fe).length;
                  L[re] = { value: pe + " marker" + (pe > 1 ? "s" : ""), subProperties: S(fe) };
                }
              }
              return L;
            }(s), m = this.props.editors.get(this.props.currentEditorName);
            return Object.keys(s).length ? r.a.createElement(Vn, { header: [r.a.createElement("span", { key: "link" }, r.a.createElement("a", { href: "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_markercollection-Marker.html", target: "_blank", rel: "noopener noreferrer" }, r.a.createElement("b", null, "Markers"))), r.a.createElement(bt, { key: "log", icon: r.a.createElement(kn, null), text: "Log in console", onClick: () => Nt.a.log([...m.model.markers]) })], lists: [{ name: "Markers tree", itemDefinitions: d, presentation: { expandCollapsibles: !0 } }] }) : r.a.createElement(Et, { isEmpty: "true" }, r.a.createElement("p", null, "No markers in the document."));
          }
        }
        var qo = De(({ editors: E, currentEditorName: s, model: { markers: d } }) => ({ editors: E, currentEditorName: s, markers: d }), {})(Oa);
        function _i({ name: E, start: s, end: d, affectsData: m, managedUsingOperations: S }) {
          return { name: { value: E }, start: { value: s.path }, end: { value: d.path }, affectsData: { value: m }, managedUsingOperations: { value: S } };
        }
        u(74);
        class Yo extends c.Component {
          render() {
            return this.props.currentEditorName ? r.a.createElement(Et, { splitVertically: "true" }, r.a.createElement(Kn, null), r.a.createElement(vn, null, r.a.createElement(Qt, { onTabChange: this.props.setModelActiveTab, activeTab: this.props.activeTab }, r.a.createElement(vi, { label: "Inspect" }), r.a.createElement(Ei, { label: "Selection" }), r.a.createElement(qo, { label: "Markers" })))) : r.a.createElement(Et, { isEmpty: "true" }, r.a.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
          }
        }
        var Pa = De(({ currentEditorName: E, model: { ui: { activeTab: s } } }) => ({ currentEditorName: E, activeTab: s }), { setModelActiveTab: He })(Yo);
        class Na extends c.Component {
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
            return r.a.createElement(Wt, null, [r.a.createElement("div", { className: "ck-inspector-tree__config", key: "root-cfg" }, r.a.createElement(rn, { id: "view-root-select", label: "Root", value: this.props.currentRootName, options: Object(en.d)(s).map((d) => d.rootName), onChange: this.handleRootChange })), r.a.createElement("span", { className: "ck-inspector-separator", key: "separator" }), r.a.createElement("div", { className: "ck-inspector-tree__config", key: "types-cfg" }, r.a.createElement(Ht, { label: "Show element types", id: "view-show-types", isChecked: this.props.showElementTypes, onChange: this.props.toggleViewShowElementTypes }))], r.a.createElement(Ut.a, { definition: this.props.treeDefinition, textDirection: s.locale.contentLanguageDirection, onClick: this.handleTreeClick, showCompactText: "true", showElementTypes: this.props.showElementTypes, activeNode: this.props.currentNode }));
          }
        }
        var To = De(({ editors: E, currentEditorName: s, view: { treeDefinition: d, currentRootName: m, currentNode: S, ui: { showElementTypes: O } } }) => ({ treeDefinition: d, editors: E, currentEditorName: s, currentRootName: m, currentNode: S, showElementTypes: O }), { setViewCurrentRootName: function(E) {
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
            Nt.a.log(this.props.currentNodeDefinition.editorNode);
          }
          render() {
            const s = this.props.currentNodeDefinition;
            return s ? r.a.createElement(Vn, { header: [r.a.createElement("span", { key: "link" }, r.a.createElement("a", { href: s.url, target: "_blank", rel: "noopener noreferrer" }, r.a.createElement("b", null, s.type), ":"), s.type === "Text" ? r.a.createElement("em", null, s.name) : s.name), r.a.createElement(bt, { key: "log", icon: r.a.createElement(kn, null), text: "Log in console", onClick: this.handleNodeLogButtonClick })], lists: [{ name: "Attributes", url: s.url, itemDefinitions: s.attributes }, { name: "Properties", url: s.url, itemDefinitions: s.properties }, { name: "Custom Properties", url: en.a + "_element-Element.html#function-getCustomProperty", itemDefinitions: s.customProperties }] }) : r.a.createElement(Et, { isEmpty: "true" }, r.a.createElement("p", null, "Select a node in the tree to inspect"));
          }
        }
        var eo = De(({ view: { currentNodeDefinition: E } }) => ({ currentNodeDefinition: E }), {})(mt);
        const to = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_view_selection-Selection.html";
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
            return r.a.createElement(Vn, { header: [r.a.createElement("span", { key: "link" }, r.a.createElement("a", { href: to, target: "_blank", rel: "noopener noreferrer" }, r.a.createElement("b", null, "Selection"))), r.a.createElement(bt, { key: "log", icon: r.a.createElement(kn, null), text: "Log in console", onClick: this.handleSelectionLogButtonClick }), r.a.createElement(bt, { key: "scroll", icon: r.a.createElement(Rr, null), text: "Scroll to selection", onClick: this.handleScrollToSelectionButtonClick })], lists: [{ name: "Properties", url: "" + to, itemDefinitions: d.properties }, { name: "Anchor", url: to + "#member-anchor", buttons: [{ type: "log", text: "Log in console", onClick: () => Nt.a.log(s.editing.view.document.selection.anchor) }], itemDefinitions: d.anchor }, { name: "Focus", url: to + "#member-focus", buttons: [{ type: "log", text: "Log in console", onClick: () => Nt.a.log(s.editing.view.document.selection.focus) }], itemDefinitions: d.focus }, { name: "Ranges", url: to + "#function-getRanges", buttons: [{ type: "log", text: "Log in console", onClick: () => Nt.a.log(...s.editing.view.document.selection.getRanges()) }], itemDefinitions: d.ranges, presentation: { expandCollapsibles: !0 } }] });
          }
        }
        var Oo = De(({ editors: E, currentEditorName: s, view: { ranges: d } }) => {
          const m = E.get(s);
          return { editor: m, currentEditorName: s, info: function(S, O) {
            const L = S.editing.view.document.selection, re = { properties: { isCollapsed: { value: L.isCollapsed }, isBackward: { value: L.isBackward }, isFake: { value: L.isFake }, rangeCount: { value: L.rangeCount } }, anchor: Ar(Object(qt.a)(L.anchor)), focus: Ar(Object(qt.a)(L.focus)), ranges: {} };
            O.forEach((fe, pe) => {
              re.ranges[pe] = { value: "", subProperties: { start: { value: "", subProperties: Object(ut.b)(Ar(fe.start)) }, end: { value: "", subProperties: Object(ut.b)(Ar(fe.end)) } } };
            });
            for (const fe in re) fe !== "ranges" && (re[fe] = Object(ut.b)(re[fe]));
            return re;
          }(m, d) };
        }, {})(Ra);
        function Ar({ offset: E, isAtEnd: s, isAtStart: d, parent: m }) {
          return { offset: { value: E }, isAtEnd: { value: s }, isAtStart: { value: d }, parent: { value: m } };
        }
        class no extends c.Component {
          render() {
            return this.props.currentEditorName ? r.a.createElement(Et, { splitVertically: "true" }, r.a.createElement(To, null), r.a.createElement(vn, null, r.a.createElement(Qt, { onTabChange: this.props.setViewActiveTab, activeTab: this.props.activeTab }, r.a.createElement(eo, { label: "Inspect" }), r.a.createElement(Oo, { label: "Selection" })))) : r.a.createElement(Et, { isEmpty: "true" }, r.a.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
          }
        }
        var Da = De(({ currentEditorName: E, view: { ui: { activeTab: s } } }) => ({ currentEditorName: E, activeTab: s }), { setViewActiveTab: _r, updateViewState: Eo })(no);
        class xi extends c.Component {
          constructor(s) {
            super(s), this.handleTreeClick = this.handleTreeClick.bind(this);
          }
          handleTreeClick(s, d) {
            s.persist(), s.stopPropagation(), this.props.setCommandsCurrentCommandName(d);
          }
          render() {
            return r.a.createElement(Wt, null, r.a.createElement(Ut.a, { definition: this.props.treeDefinition, onClick: this.handleTreeClick, activeNode: this.props.currentCommandName }));
          }
        }
        var Si = De(({ commands: { treeDefinition: E, currentCommandName: s } }) => ({ treeDefinition: E, currentCommandName: s }), { setCommandsCurrentCommandName: function(E) {
          return { type: "SET_COMMANDS_CURRENT_COMMAND_NAME", currentCommandName: E };
        } })(xi);
        function Ci() {
          return (Ci = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var m in d) Object.prototype.hasOwnProperty.call(d, m) && (E[m] = d[m]);
            }
            return E;
          }).apply(this, arguments);
        }
        var Ko = ({ styles: E = {}, ...s }) => r.a.createElement("svg", Ci({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, s), r.a.createElement("path", { d: "M9.25 1.25a8 8 0 110 16 8 8 0 010-16zm0 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM7.344 6.485l4.98 2.765-4.98 3.018V6.485z" }));
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
            return s ? r.a.createElement(Vn, { header: [r.a.createElement("span", { key: "link" }, r.a.createElement("a", { href: s.url, target: "_blank", rel: "noopener noreferrer" }, r.a.createElement("b", null, s.type)), ":", this.props.currentCommandName), r.a.createElement(bt, { key: "exec", icon: r.a.createElement(Ko, null), text: "Execute command", onClick: this.handleCommandExecuteButtonClick }), r.a.createElement(bt, { key: "log", icon: r.a.createElement(kn, null), text: "Log in console", onClick: this.handleCommandLogButtonClick })], lists: [{ name: "Properties", url: s.url, itemDefinitions: s.properties }] }) : r.a.createElement(Et, { isEmpty: "true" }, r.a.createElement("p", null, "Select a command to inspect"));
          }
        }
        var Ti = De(({ editors: E, currentEditorName: s, commands: { currentCommandName: d, currentCommandDefinition: m } }) => ({ editors: E, currentEditorName: s, currentCommandName: d, currentCommandDefinition: m }), {})(Qo);
        class Wn extends c.Component {
          render() {
            return this.props.currentEditorName ? r.a.createElement(Et, { splitVertically: "true" }, r.a.createElement(Si, null), r.a.createElement(vn, null, r.a.createElement(Qt, { activeTab: "Inspect" }, r.a.createElement(Ti, { label: "Inspect" })))) : r.a.createElement(Et, { isEmpty: "true" }, r.a.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
          }
        }
        var Po = De(({ currentEditorName: E }) => ({ currentEditorName: E }), { updateCommandsState: Sr })(Wn);
        class Go extends c.Component {
          constructor(s) {
            super(s), this.handleTreeClick = this.handleTreeClick.bind(this);
          }
          handleTreeClick(s, d) {
            s.persist(), s.stopPropagation(), this.props.setSchemaCurrentDefinitionName(d);
          }
          render() {
            return r.a.createElement(Wt, null, r.a.createElement(Ut.a, { definition: this.props.treeDefinition, onClick: this.handleTreeClick, activeNode: this.props.currentSchemaDefinitionName }));
          }
        }
        var Oi = De(({ schema: { treeDefinition: E, currentSchemaDefinitionName: s } }) => ({ treeDefinition: E, currentSchemaDefinitionName: s }), { setSchemaCurrentDefinitionName: ir })(Go);
        class Pi extends c.Component {
          render() {
            const s = this.props.currentSchemaDefinition;
            return s ? r.a.createElement(Vn, { header: [r.a.createElement("span", { key: "link" }, r.a.createElement("a", { href: s.urls.general, target: "_blank", rel: "noopener noreferrer" }, r.a.createElement("b", null, s.type)), ":", this.props.currentSchemaDefinitionName)], lists: [{ name: "Properties", url: s.urls.general, itemDefinitions: s.properties }, { name: "Allowed attributes", url: s.urls.allowAttributes, itemDefinitions: s.allowAttributes }, { name: "Allowed children", url: s.urls.allowChildren, itemDefinitions: s.allowChildren, onPropertyTitleClick: (d) => {
              this.props.setSchemaCurrentDefinitionName(d);
            } }, { name: "Allowed in", url: s.urls.allowIn, itemDefinitions: s.allowIn, onPropertyTitleClick: (d) => {
              this.props.setSchemaCurrentDefinitionName(d);
            } }] }) : r.a.createElement(Et, { isEmpty: "true" }, r.a.createElement("p", null, "Select a schema definition to inspect"));
          }
        }
        var Ni = De(({ editors: E, currentEditorName: s, schema: { currentSchemaDefinitionName: d, currentSchemaDefinition: m } }) => ({ editors: E, currentEditorName: s, currentSchemaDefinitionName: d, currentSchemaDefinition: m }), { setSchemaCurrentDefinitionName: ir })(Pi);
        class Xo extends c.Component {
          render() {
            return this.props.currentEditorName ? r.a.createElement(Et, { splitVertically: "true" }, r.a.createElement(Oi, null), r.a.createElement(vn, null, r.a.createElement(Qt, { activeTab: "Inspect" }, r.a.createElement(Ni, { label: "Inspect" })))) : r.a.createElement(Et, { isEmpty: "true" }, r.a.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
          }
        }
        var Zo = De(({ currentEditorName: E }) => ({ currentEditorName: E }))(Xo), Jo = u(47), Ri = u.n(Jo), ei = u(48), ti = u.n(ei);
        function Di() {
          return (Di = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var m in d) Object.prototype.hasOwnProperty.call(d, m) && (E[m] = d[m]);
            }
            return E;
          }).apply(this, arguments);
        }
        var Ir = ({ styles: E = {}, ...s }) => r.a.createElement("svg", Di({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, s), r.a.createElement("path", { d: "M12.936 0l5 4.5v12.502l-1.504-.001v.003h1.504v1.499h-5v-1.501l3.496-.001V5.208L12.21 1.516 3.436 1.5v15.504l3.5-.001v1.5h-5V0h11z" }), r.a.createElement("path", { d: "M10.374 9.463l.085.072.477.464L11 10v.06l3.545 3.453-1.047 1.075L11 12.155V19H9v-6.9l-2.424 2.476-1.072-1.05L9.4 9.547a.75.75 0 01.974-.084zM12.799 1.5l-.001 2.774h3.645v1.5h-5.144V1.5z" }));
        u(86);
        class Ai extends c.Component {
          constructor(s) {
            super(s), this.state = { isModalOpen: !1, editorDataValue: "" }, this.textarea = r.a.createRef();
          }
          render() {
            return [r.a.createElement(bt, { text: "Set editor data", icon: r.a.createElement(Ir, null), isEnabled: !!this.props.editor, onClick: () => this.setState({ isModalOpen: !0 }), key: "button" }), r.a.createElement(ti.a, { isOpen: this.state.isModalOpen, appElement: document.querySelector(".ck-inspector-wrapper"), onAfterOpen: this._handleModalAfterOpen.bind(this), overlayClassName: "ck-inspector-modal ck-inspector-quick-actions__set-data-modal", className: "ck-inspector-quick-actions__set-data-modal__content", onRequestClose: this._closeModal.bind(this), portalClassName: "ck-inspector-portal", shouldCloseOnEsc: !0, shouldCloseOnOverlayClick: !0, key: "modal" }, r.a.createElement("h2", null, "Set editor data"), r.a.createElement("textarea", { autoFocus: !0, ref: this.textarea, value: this.state.editorDataValue, placeholder: "Paste HTML here...", onChange: this._handlDataChange.bind(this), onKeyPress: (s) => {
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
              for (var m in d) Object.prototype.hasOwnProperty.call(d, m) && (E[m] = d[m]);
            }
            return E;
          }).apply(this, arguments);
        }
        var Qn = ({ styles: E = {}, ...s }) => r.a.createElement("svg", No({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, s), r.a.createElement("path", { d: "M12.936 0l5 4.5v14.003h-4.503L14.936 17h-10l1.503 1.503H1.936V0h11zm-9.5 1.5v15.504h12.996V5.208L12.21 1.516 3.436 1.5z" }), r.a.createElement("path", { d: "M12.799 1.5l-.001 2.774h3.645v1.5h-5.144V1.5zM9.675 18.859l-.085-.072-4.086-3.978 1.047-1.075L9 16.119V9h2v7.273l2.473-2.526 1.072 1.049-3.896 3.979a.75.75 0 01-.974.084z" }));
        function ro() {
          return (ro = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var m in d) Object.prototype.hasOwnProperty.call(d, m) && (E[m] = d[m]);
            }
            return E;
          }).apply(this, arguments);
        }
        var oo = ({ styles: E = {}, ...s }) => r.a.createElement("svg", ro({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, s), r.a.createElement("path", { d: "M3.144 15.748l2.002 1.402-1.976.516-.026-1.918zM2.438 3.391l15.346 11.023-.875 1.218-5.202-3.736-2.877 4.286.006.005-3.055.797-2.646-1.852-.04-2.95-.006-.005.006-.008v-.025l.01.008L6.02 7.81l-4.457-3.2.876-1.22zM7.25 8.695l-2.13 3.198 3.277 2.294 2.104-3.158-3.25-2.334zM14.002 0l2.16 1.512-.856 1.222c.828.967 1.144 2.141.432 3.158l-2.416 3.599-1.214-.873 2.396-3.593.005.003c.317-.452-.16-1.332-1.064-1.966-.891-.624-1.865-.776-2.197-.349l-.006-.004-2.384 3.575-1.224-.879 2.376-3.539c.674-.932 1.706-1.155 3.096-.668l.046.018.85-1.216z" }));
        function Mr() {
          return (Mr = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var m in d) Object.prototype.hasOwnProperty.call(d, m) && (E[m] = d[m]);
            }
            return E;
          }).apply(this, arguments);
        }
        var io = ({ styles: E = {}, ...s }) => r.a.createElement("svg", Mr({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, s), r.a.createElement("path", { d: "M11.28 1a1 1 0 01.948.684l.333 1 .018.066H16a.75.75 0 01.102 1.493L16 4.25h-.5V16a2 2 0 01-2 2h-8a2 2 0 01-2-2V4.25H3a.75.75 0 01-.102-1.493L3 2.75h3.42a1 1 0 01.019-.066l.333-1A1 1 0 017.721 1h3.558zM14 4.5H5V16a.5.5 0 00.41.492l.09.008h8a.5.5 0 00.492-.41L14 16V4.5zM7.527 6.06v8.951h-1V6.06h1zm5 0v8.951h-1V6.06h1zM10 6.06v8.951H9V6.06h1z" }));
        function Gn() {
          return (Gn = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var m in d) Object.prototype.hasOwnProperty.call(d, m) && (E[m] = d[m]);
            }
            return E;
          }).apply(this, arguments);
        }
        var ni = ({ styles: E = {}, ...s }) => r.a.createElement("svg", Gn({ viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg" }, s), r.a.createElement("path", { d: "M2.284 2.498c-.239.266-.184.617-.184 1.002V4H2a.5.5 0 00-.492.41L1.5 4.5V17a1 1 0 00.883.993L2.5 18h10a1 1 0 00.97-.752l-.081-.062c.438.368.976.54 1.507.526a2.5 2.5 0 01-2.232 1.783l-.164.005h-10a2.5 2.5 0 01-2.495-2.336L0 17V4.5a2 2 0 011.85-1.995L2 2.5l.284-.002zm10.532 0L13 2.5a2 2 0 011.995 1.85L15 4.5v2.28a2.243 2.243 0 00-1.5.404V4.5a.5.5 0 00-.41-.492L13 4v-.5l-.007-.144c-.031-.329.032-.626-.177-.858z" }), r.a.createElement("path", { d: "M6 .49l-.144.006a1.75 1.75 0 00-1.41.94l-.029.058.083-.004c-.69 0-1.25.56-1.25 1.25v1c0 .69.56 1.25 1.25 1.25h6c.69 0 1.25-.56 1.25-1.25v-1l-.006-.128a1.25 1.25 0 00-1.116-1.116l-.046-.002-.027-.058A1.75 1.75 0 009 .49H6zm0 1.5h3a.25.25 0 01.25.25l.007.102A.75.75 0 0010 2.99h.25v.5h-5.5v-.5H5a.75.75 0 00.743-.648l.007-.102A.25.25 0 016 1.99zm9.374 6.55a.75.75 0 01-.093 1.056l-2.33 1.954h6.127a.75.75 0 010 1.501h-5.949l2.19 1.837a.75.75 0 11-.966 1.15l-3.788-3.18a.747.747 0 01-.21-.285.75.75 0 01.17-.945l3.792-3.182a.75.75 0 011.057.093z" }));
        function Dn() {
          return (Dn = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var m in d) Object.prototype.hasOwnProperty.call(d, m) && (E[m] = d[m]);
            }
            return E;
          }).apply(this, arguments);
        }
        var Ii = ({ styles: E = {}, ...s }) => r.a.createElement("svg", Dn({ viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg" }, s), r.a.createElement("path", { fill: "#4fa800", d: "M6.972 16.615a.997.997 0 01-.744-.292l-4.596-4.596a1 1 0 111.414-1.414l3.926 3.926 9.937-9.937a1 1 0 011.414 1.415L7.717 16.323a.997.997 0 01-.745.292z" }));
        u(88);
        class Mi extends c.Component {
          constructor(s) {
            super(s), this.state = { isShiftKeyPressed: !1, wasEditorDataJustCopied: !1 }, this._keyDownHandler = this._handleKeyDown.bind(this), this._keyUpHandler = this._handleKeyUp.bind(this), this._readOnlyHandler = this._handleReadOnly.bind(this), this._editorDataJustCopiedTimeout = null;
          }
          render() {
            return r.a.createElement("div", { className: "ck-inspector-editor-quick-actions" }, r.a.createElement(bt, { text: "Log editor", icon: r.a.createElement(kn, null), isEnabled: !!this.props.editor, onClick: () => console.log(this.props.editor) }), this._getLogButton(), r.a.createElement(Ai, { editor: this.props.editor }), r.a.createElement(bt, { text: "Toggle read only", icon: r.a.createElement(oo, null), isOn: this.props.isReadOnly, isEnabled: !!this.props.editor, onClick: this._readOnlyHandler }), r.a.createElement(bt, { text: "Destroy editor", icon: r.a.createElement(io, null), isEnabled: !!this.props.editor, onClick: () => {
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
            return this.state.wasEditorDataJustCopied ? (s = r.a.createElement(Ii, null), d = "Data copied to clipboard.") : (s = this.state.isShiftKeyPressed ? r.a.createElement(ni, null) : r.a.createElement(Qn, null), d = "Log editor data (press with Shift to copy)"), r.a.createElement(bt, { text: d, icon: s, className: this.state.wasEditorDataJustCopied ? "ck-inspector-button_data-copied" : "", isEnabled: !!this.props.editor, onClick: this._handleLogEditorDataClick.bind(this) });
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
        var Aa = De(({ editors: E, currentEditorName: s, currentEditorGlobals: { isReadOnly: d } }) => ({ editor: E.get(s), isReadOnly: d }), {})(Mi);
        function Ro() {
          return (Ro = Object.assign ? Object.assign.bind() : function(E) {
            for (var s = 1; s < arguments.length; s++) {
              var d = arguments[s];
              for (var m in d) Object.prototype.hasOwnProperty.call(d, m) && (E[m] = d[m]);
            }
            return E;
          }).apply(this, arguments);
        }
        var Ia = ({ styles: E = {}, ...s }) => r.a.createElement("svg", Ro({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, s), r.a.createElement("path", { d: "M17.03 6.47a.75.75 0 01.073.976l-.072.084-6.984 7a.75.75 0 01-.977.073l-.084-.072-7.016-7a.75.75 0 01.976-1.134l.084.072 6.485 6.47 6.454-6.469a.75.75 0 01.977-.073l.084.072z" }));
        u(37);
        const jr = { position: "fixed", bottom: "0", left: "0", right: "0", top: "auto" };
        class hr extends c.Component {
          constructor(s) {
            super(s), zi(this.props.height), document.body.style.setProperty("--ck-inspector-collapsed-height", "30px"), this.handleInspectorResize = this.handleInspectorResize.bind(this);
          }
          handleInspectorResize(s, d, m) {
            const S = m.style.height;
            this.props.setHeight(S), zi(S);
          }
          render() {
            return this.props.isCollapsed ? (document.body.classList.remove("ck-inspector-body-expanded"), document.body.classList.add("ck-inspector-body-collapsed")) : (document.body.classList.remove("ck-inspector-body-collapsed"), document.body.classList.add("ck-inspector-body-expanded")), r.a.createElement(Or, { bounds: "window", enableResizing: { top: !this.props.isCollapsed }, disableDragging: !0, minHeight: "100", maxHeight: "100%", style: jr, className: ["ck-inspector", this.props.isCollapsed ? "ck-inspector_collapsed" : ""].join(" "), position: { x: 0, y: "100%" }, size: { width: "100%", height: this.props.isCollapsed ? 30 : this.props.height }, onResizeStop: this.handleInspectorResize }, r.a.createElement(Qt, { onTabChange: this.props.setActiveTab, contentBefore: r.a.createElement(Do, { key: "docs" }), activeTab: this.props.activeTab, contentAfter: [r.a.createElement(an, { key: "selector" }), r.a.createElement("span", { className: "ck-inspector-separator", key: "separator-a" }), r.a.createElement(Aa, { key: "quick-actions" }), r.a.createElement("span", { className: "ck-inspector-separator", key: "separator-b" }), r.a.createElement(Ao, { key: "inspector-toggle" })] }, r.a.createElement(Pa, { label: "Model" }), r.a.createElement(Da, { label: "View" }), r.a.createElement(Po, { label: "Commands" }), r.a.createElement(Zo, { label: "Schema" })));
          }
          componentWillUnmount() {
            document.body.classList.remove("ck-inspector-body-expanded"), document.body.classList.remove("ck-inspector-body-collapsed");
          }
        }
        var ri = De(({ editors: E, currentEditorName: s, ui: { isCollapsed: d, height: m, activeTab: S } }) => ({ isCollapsed: d, height: m, editors: E, currentEditorName: s, activeTab: S }), { toggleIsCollapsed: At, setHeight: function(E) {
          return { type: "SET_HEIGHT", newHeight: E };
        }, setEditors: kt, setCurrentEditorName: Jt, setActiveTab: wt })(hr);
        class Do extends c.Component {
          render() {
            return r.a.createElement("a", { className: "ck-inspector-navbox__navigation__logo", title: "Go to the documentation", href: "https://ckeditor.com/docs/ckeditor5/latest/", target: "_blank", rel: "noopener noreferrer" }, "CKEditor documentation");
          }
        }
        class ji extends c.Component {
          constructor(s) {
            super(s), this.handleShortcut = this.handleShortcut.bind(this);
          }
          render() {
            return r.a.createElement(bt, { text: "Toggle inspector", icon: r.a.createElement(Ia, null), onClick: this.props.toggleIsCollapsed, title: "Toggle inspector (Alt+F12)", className: ["ck-inspector-navbox__navigation__toggle", this.props.isCollapsed ? " ck-inspector-navbox__navigation__toggle_up" : ""].join(" ") });
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
        const Ao = De(({ ui: { isCollapsed: E } }) => ({ isCollapsed: E }), { toggleIsCollapsed: At })(ji);
        class Io extends c.Component {
          render() {
            return r.a.createElement("div", { className: "ck-inspector-editor-selector", key: "editor-selector" }, this.props.currentEditorName ? r.a.createElement(rn, { id: "inspector-editor-selector", label: "Instance", value: this.props.currentEditorName, options: [...this.props.editors].map(([s]) => s), onChange: (s) => this.props.setCurrentEditorName(s.target.value) }) : "");
          }
        }
        const an = De(({ currentEditorName: E, editors: s }) => ({ currentEditorName: E, editors: s }), { setCurrentEditorName: Jt })(Io);
        function zi(E) {
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
            const { editors: m, options: S } = Object(On.c)(s);
            for (const O in m) {
              const L = m[O];
              Nt.a.group("%cAttached the inspector to a CKEditor 5 instance. To learn more, visit https://ckeditor.com/docs/ckeditor5.", "font-weight: bold;"), Nt.a.log(`Editor instance "${O}"`, L), Nt.a.groupEnd(), $e._editors.set(O, L), L.on("destroy", () => {
                $e.detach(O);
              }), $e._mount(S), $e._updateEditorsState();
            }
            return Object.keys(m);
          }
          static attachToAll(s) {
            const d = document.querySelectorAll(".ck.ck-content.ck-editor__editable"), m = [];
            for (const S of d) {
              const O = S.ckeditorInstance;
              O && !$e._isAttachedTo(O) && m.push(...$e.attach(O, s));
            }
            return m;
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
            $e._store.dispatch(kt($e._editors));
          }
          static _mount(s) {
            if ($e._wrapper) return;
            const d = $e._wrapper = document.createElement("div");
            let m, S;
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
              m !== L && (m && $e._editorListener.stopListening(m), L && $e._editorListener.startListening(L), m = L);
            }), $e._store.subscribe(() => {
              const O = $e._store, L = O.getState().ui.isCollapsed, re = S && !L;
              S = L, re && (O.dispatch({ type: "UPDATE_MODEL_STATE" }), O.dispatch({ type: "UPDATE_COMMANDS_STATE" }), O.dispatch({ type: "UPDATE_VIEW_STATE" }));
            }), g.a.render(r.a.createElement(V, { store: $e._store }, r.a.createElement(ri, null)), d);
          }
          static _isAttachedTo(s) {
            return [...$e._editors.values()].includes(s);
          }
        }
        $e._editors = /* @__PURE__ */ new Map(), $e._wrapper = null;
      }]).default;
    });
  }(Cs)), Cs.exports;
}
var Su = xu();
const Cu = /* @__PURE__ */ _u(Su);
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
const Tu = function(xe) {
  const D = xe.plugins.get(tc), p = $(xe.ui.view.element), i = $(xe.sourceElement), u = `ckeditor${Math.floor(Math.random() * 1e9)}`, c = [
    "keypress",
    "keyup",
    "change",
    "focus",
    "blur",
    "click",
    "mousedown",
    "mouseup"
  ].map((r) => `${r}.${u}`).join(" ");
  D.on("change:isSourceEditingMode", () => {
    const r = p.find(
      ".ck-source-editing-area"
    );
    if (D.isSourceEditingMode) {
      let _ = r.attr("data-value");
      r.on(c, () => {
        _ !== (_ = r.attr("data-value")) && i.val(_);
      });
    } else
      r.off(`.${u}`);
  });
}, Ou = function(xe, D) {
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
}, Pu = function(xe, D) {
  let p = null;
  const i = xe.editing.view.document, u = xe.plugins.get("ClipboardPipeline");
  i.on("clipboardOutput", (c, r) => {
    p = xe.id;
  }), i.on("clipboardInput", async (c, r) => {
    let _ = r.dataTransfer.getData("text/html");
    if (_ && _.includes("<craft-entry") && !(r.method == "drop" && p === xe.id)) {
      if (r.method == "paste" || r.method == "drop" && p !== xe.id) {
        let g = _, y = !1;
        const v = Craft.siteId;
        let b = null, C = null;
        const x = xe.getData(), N = [..._.matchAll(/data-entry-id="([0-9]+)/g)];
        c.stop();
        const G = $(xe.ui.view.element);
        let j = G.parents("form").data("elementEditor");
        await j.ensureIsDraftOrRevision();
        let B = G.parents(".input");
        if (B.length > 0) {
          let P = $(B[0]).find("div[data-config]");
          P.length > 0 && (b = $(P[0]).data("element-id"));
        }
        b == null && (b = j.settings.elementId), C = G.parents(".field").data("layoutElement");
        for (let P = 0; P < N.length; P++) {
          let M = null;
          if (N[P][1] && (M = N[P][1]), M !== null) {
            const V = new RegExp('data-entry-id="' + M + '"');
            if (!(p === xe.id && !V.test(x))) {
              let A = null;
              p !== xe.id && (D.includes(bu) ? A = xe.config.get("entryTypeOptions").map((J) => J.value) : (Craft.cp.displayError(
                Craft.t(
                  "ckeditor",
                  "This field doesn’t allow nested entries."
                )
              ), y = !0)), await Craft.sendActionRequest(
                "POST",
                "ckeditor/ckeditor/duplicate-nested-entry",
                {
                  data: {
                    entryId: M,
                    siteId: v,
                    targetEntryTypeIds: A,
                    targetOwnerId: b,
                    targetLayoutElementUid: C
                  }
                }
              ).then((J) => {
                J.data.newEntryId && (g = g.replace(
                  M,
                  J.data.newEntryId
                ));
              }).catch((J) => {
                var Q, z, I, ae;
                y = !0, Craft.cp.displayError((z = (Q = J == null ? void 0 : J.response) == null ? void 0 : Q.data) == null ? void 0 : z.message), console.error((ae = (I = J == null ? void 0 : J.response) == null ? void 0 : I.data) == null ? void 0 : ae.additionalMessage);
              });
            }
          }
        }
        y || (r.content = xe.data.htmlProcessor.toView(g), u.fire("inputTransformation", r));
      }
    }
  });
}, Mu = async function(xe, D) {
  typeof xe == "string" && (xe = document.querySelector(`#${xe}`)), D.licenseKey = "GPL";
  const p = await ru.create(xe, D);
  return Craft.showCkeditorInspector && Craft.userIsAdmin && Cu.attach(p), p.editing.view.change((i) => {
    const u = p.editing.view.document.getRoot();
    if (typeof D.accessibleFieldName < "u" && D.accessibleFieldName.length) {
      let c = u.getAttribute("aria-label");
      i.setAttribute(
        "aria-label",
        D.accessibleFieldName + ", " + c,
        u
      );
    }
    typeof D.describedBy < "u" && D.describedBy.length && i.setAttribute(
      "aria-describedby",
      D.describedBy,
      u
    );
  }), p.updateSourceElement(), p.model.document.on("change:data", () => {
    p.updateSourceElement();
  }), D.plugins.includes(tc) && Tu(p), D.plugins.includes(ou) && Ou(p, D), Pu(p, D.plugins), p;
};
export {
  bu as CraftEntries,
  Ru as CraftImageInsertUI,
  Iu as CraftLink,
  Au as ImageEditor,
  Du as ImageTransform,
  Mu as create
};
