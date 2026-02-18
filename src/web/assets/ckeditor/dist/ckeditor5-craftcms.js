import { ImageInsertUI as au, ButtonView as ea, IconImage as su, Command as _l, Plugin as Bn, ImageUtils as Mc, Collection as ns, ViewModel as ts, createDropdown as rs, DropdownButtonView as lu, IconObjectSizeMedium as cu, addListToDropdown as El, Widget as uu, viewToModelPositionOutsideModelElement as du, toWidget as pu, DomEventObserver as fu, View as vo, IconPlus as Ic, WidgetToolbarRepository as Pc, isWidget as hu, findAttributeRange as mu, LinkUI as Dc, ContextualBalloon as gu, ModelRange as yu, SwitchButtonView as bu, LabeledFieldView as vu, createLabeledInputText as ku, ClassicEditor as wu, SourceEditing as zc, Heading as _u } from "ckeditor5";
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class Yu extends au {
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
    const E = this.editor.ui.componentFactory, _ = (T) => this._createToolbarImageButton(T);
    E.add("insertImage", _), E.add("imageInsert", _), this._attachUploader();
  }
  get _assetSources() {
    return this.editor.config.get("assetSources");
  }
  _createToolbarImageButton(E) {
    const _ = this.editor, T = _.t, O = new ea(E);
    O.isEnabled = !0, O.label = T("Insert image"), O.icon = su, O.tooltip = !0;
    const te = _.commands.get("insertImage");
    return O.bind("isEnabled").to(te), this.listenTo(O, "execute", () => this._showImageSelectModal()), O;
  }
  _showImageSelectModal() {
    const E = this._assetSources, _ = this.editor, T = _.config, O = Object.assign({}, T.get("assetSelectionCriteria"), {
      kind: "image"
    });
    Craft.createElementSelectorModal("craft\\elements\\Asset", {
      storageKey: `ckeditor:${this.pluginName}:'craft\\elements\\Asset'`,
      sources: E,
      criteria: O,
      defaultSiteId: T.get("elementSiteId"),
      transforms: T.get("transforms"),
      multiSelect: !0,
      autoFocusSearchBox: !1,
      onSelect: (te, i) => {
        this._processAssetUrls(te, i).then(() => {
          _.editing.view.focus();
        });
      },
      onHide: () => {
        _.editing.view.focus();
      },
      closeOtherModals: !1
    });
  }
  _processAssetUrls(E, _) {
    return new Promise((T) => {
      if (!E.length) {
        T();
        return;
      }
      const O = this.editor, te = O.config.get("defaultTransform"), i = new Craft.Queue(), u = [];
      i.on("afterRun", () => {
        O.execute("insertImage", { source: u }), T();
      });
      for (const f of E)
        i.push(
          () => new Promise((k) => {
            const d = this._isTransformUrl(f.url);
            if (!d && te)
              this._getTransformUrl(f.id, te, (C) => {
                u.push(C), k();
              });
            else {
              const C = this._buildAssetUrl(
                f.id,
                f.url,
                d ? _ : te
              );
              u.push(C), k();
            }
          })
        );
    });
  }
  _buildAssetUrl(E, _, T) {
    return `${_}#asset:${E}:${T ? "transform:" + T : "url"}`;
  }
  _removeTransformFromUrl(E) {
    return E.replace(/(^|\/)(_[^\/]+\/)([^\/]+)$/, "$1$3");
  }
  _isTransformUrl(E) {
    return /(^|\/)_[^\/]+\/[^\/]+$/.test(E);
  }
  _getTransformUrl(E, _, T) {
    Craft.sendActionRequest("POST", "ckeditor/ckeditor/image-url", {
      data: {
        assetId: E,
        transform: _
      }
    }).then(({ data: O }) => {
      T(this._buildAssetUrl(E, O.url, _));
    }).catch(() => {
      alert("There was an error generating the transform URL.");
    });
  }
  _getAssetUrlComponents(E) {
    const _ = E.match(
      /(.*)#asset:(\d+):(url|transform):?([a-zA-Z][a-zA-Z0-9_]*)?/
    );
    return _ ? {
      url: _[1],
      assetId: _[2],
      transform: _[3] !== "url" ? _[4] : null
    } : null;
  }
  /**
   * Attach the uploader with drag event handler
   */
  _attachUploader() {
    let E = this.editor, _ = E.config.get("assetUploadParams") ?? null;
    if (!(!_ || !_.folderId)) {
      this.$container = $(E.sourceElement).parents(".input"), this.progressBar = new Craft.ProgressBar(
        $('<div class="progress-shade"></div>').appendTo(this.$container)
      ), this.$fileInput = $("<input/>", {
        type: "file",
        class: "hidden",
        multiple: !1
      }).insertAfter(E.sourceElement);
      var T = {
        dropZone: this.$container,
        fileInput: this.$fileInput
      };
      _.kind && (T.allowedKinds = _.kind), T.canAddMoreFiles = !0, T.events = {}, T.events.fileuploadstart = this._onUploadStart.bind(this), T.events.fileuploadprogressall = this._onUploadProgress.bind(this), T.events.fileuploaddone = this._onUploadComplete.bind(this), T.events.fileuploadfail = this._onUploadFailure.bind(this), this.uploader = Craft.createUploader(
        _.volumeType,
        this.$container,
        T
      ), delete _.volumeId, delete _.volumeType, this.uploader.setParams(_), E.editing.view.document.on(
        "drop",
        async (O, te) => {
          E.editing.view, E.model;
          const i = E.editing.mapper, u = te.dropRange;
          if (u) {
            const f = u.start, k = i.toModelPosition(f);
            E.model.change((d) => {
              d.setSelection(k, 0);
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
  _onUploadProgress(E, _ = null) {
    _ = E instanceof CustomEvent ? E.detail : _;
    var T = parseInt(Math.min(_.loaded / _.total, 1) * 100, 10);
    this.progressBar.setProgressPercentage(T);
  }
  /**
   * On a file being uploaded.
   */
  _onUploadComplete(E, _ = null) {
    const T = E instanceof CustomEvent ? E.detail : _.result;
    this.progressBar.hideProgressBar(), this.$container.removeClass("uploading");
    const O = this.editor.config.get("defaultTransform"), te = new Craft.Queue(), i = [];
    te.on("afterRun", () => {
      this.editor.execute("insertImage", { source: i, breakBlock: !0 });
    }), te.push(
      () => new Promise((u) => {
        const f = this._isTransformUrl(T.url);
        if (!f && O)
          this._getTransformUrl(T.assetId, O, (k) => {
            i.push(k), u();
          });
        else {
          const k = this._buildAssetUrl(
            T.assetId,
            T.url,
            f ? transform : O
          );
          i.push(k), u();
        }
      })
    );
  }
  /**
   * On Upload Failure.
   */
  _onUploadFailure(E, _ = null) {
    var f, k;
    const T = E instanceof CustomEvent ? E.detail : (f = _ == null ? void 0 : _.jqXHR) == null ? void 0 : f.responseJSON;
    let { message: O, filename: te, errors: i } = T || {};
    te = te || ((k = _ == null ? void 0 : _.files) == null ? void 0 : k[0].name);
    let u = i ? Object.values(i).flat() : [];
    O || (u.length ? O = u.join(`
`) : te ? O = Craft.t("app", "Upload failed for “{filename}”.", { filename: te }) : O = Craft.t("app", "Upload failed.")), Craft.cp.displayError(O), this.progressBar.hideProgressBar(), this.$container.removeClass("uploading");
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class Eu extends _l {
  refresh() {
    const E = this._element(), _ = this._srcInfo(E);
    this.isEnabled = !!_, _ ? this.value = {
      transform: _.transform
    } : this.value = null;
  }
  _element() {
    const E = this.editor;
    return E.plugins.get("ImageUtils").getClosestSelectedImageElement(
      E.model.document.selection
    );
  }
  _srcInfo(E) {
    if (!E || !E.hasAttribute("src"))
      return null;
    const _ = E.getAttribute("src"), T = _.match(
      /#asset:(\d+)(?::transform:([a-zA-Z][a-zA-Z0-9_]*))?/
    );
    return T ? {
      src: _,
      assetId: T[1],
      transform: T[2]
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
  execute(E) {
    const T = this.editor.model, O = this._element(), te = this._srcInfo(O);
    if (this.value = {
      transform: E.transform
    }, te) {
      const i = `#asset:${te.assetId}` + (E.transform ? `:transform:${E.transform}` : "");
      T.change((u) => {
        const f = te.src.replace(/#.*/, "") + i;
        u.setAttribute("src", f, O);
      }), Craft.sendActionRequest("post", "ckeditor/ckeditor/image-url", {
        data: {
          assetId: te.assetId,
          transform: E.transform
        }
      }).then(({ data: u }) => {
        T.change((f) => {
          const k = u.url + i;
          f.setAttribute("src", k, O), u.width && f.setAttribute("width", u.width, O), u.height && f.setAttribute("height", u.height, O);
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
class Ac extends Bn {
  static get requires() {
    return [Mc];
  }
  static get pluginName() {
    return "ImageTransformEditing";
  }
  constructor(E) {
    super(E), E.config.define("transforms", []);
  }
  init() {
    const E = this.editor, _ = new Eu(E);
    E.commands.add("transformImage", _);
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
const xu = cu;
class Su extends Bn {
  static get requires() {
    return [Ac];
  }
  static get pluginName() {
    return "ImageTransformUI";
  }
  init() {
    const E = this.editor, _ = E.config.get("transforms"), T = E.commands.get("transformImage");
    this.bind("isEnabled").to(T), this._registerImageTransformDropdown(_);
  }
  /**
   * A helper function that creates a dropdown component for the plugin containing all the transform options defined in
   * the editor configuration.
   *
   * @param transforms An array of the available image transforms.
   */
  _registerImageTransformDropdown(E) {
    const _ = this.editor, T = _.t, O = {
      name: "transformImage:original",
      value: null
    }, te = [
      O,
      ...E.map((u) => ({
        label: u.name,
        name: `transformImage:${u.handle}`,
        value: u.handle
      }))
    ], i = (u) => {
      const f = _.commands.get("transformImage"), k = rs(u, lu), d = k.buttonView;
      return d.set({
        tooltip: T("Resize image"),
        commandValue: null,
        icon: xu,
        isToggleable: !0,
        label: this._getOptionLabelValue(O),
        withText: !0,
        class: "ck-resize-image-button"
      }), d.bind("label").to(f, "value", (C) => {
        if (!C || !C.transform)
          return this._getOptionLabelValue(O);
        const m = E.find(
          (b) => b.handle === C.transform
        );
        return m ? m.name : C.transform;
      }), k.bind("isEnabled").to(this), El(
        k,
        () => this._getTransformDropdownListItemDefinitions(te, f),
        {
          ariaLabel: T("Image resize list")
        }
      ), this.listenTo(k, "execute", (C) => {
        _.execute(C.source.commandName, {
          transform: C.source.commandValue
        }), _.editing.view.focus();
      }), k;
    };
    _.ui.componentFactory.add("transformImage", i);
  }
  /**
   * A helper function for creating an option label value string.
   *
   * @param option A transform option object.
   * @returns The option label.
   */
  _getOptionLabelValue(E) {
    return E.label || E.value || this.editor.t("Original");
  }
  /**
   * A helper function that parses the transform options and returns list item definitions ready for use in the dropdown.
   *
   * @param options The transform options.
   * @param command The transform image command.
   * @returns Dropdown item definitions.
   */
  _getTransformDropdownListItemDefinitions(E, _) {
    const T = new ns();
    return E.map((O) => {
      const te = {
        type: "button",
        model: new ts({
          commandName: "transformImage",
          commandValue: O.value,
          label: this._getOptionLabelValue(O),
          withText: !0,
          icon: null
        })
      };
      te.model.bind("isOn").to(_, "value", Cu(O.value)), T.add(te);
    }), T;
  }
}
function Cu(Te) {
  return (E) => {
    const _ = E;
    return Te === null && _ === Te ? !0 : _ !== null && _.transform === Te;
  };
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class Xu extends Bn {
  static get requires() {
    return [Ac, Su];
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
class Tu extends _l {
  refresh() {
    const E = this._element(), _ = this._srcInfo(E);
    if (this.isEnabled = !!_, this.isEnabled) {
      let T = {
        assetId: _.assetId
      };
      Craft.sendActionRequest("POST", "ckeditor/ckeditor/image-permissions", {
        data: T
      }).then((O) => {
        O.data.editable === !1 && (this.isEnabled = !1);
      });
    }
  }
  /**
   * Returns the selected image element.
   */
  _element() {
    const E = this.editor;
    return E.plugins.get("ImageUtils").getClosestSelectedImageElement(
      E.model.document.selection
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
  _srcInfo(E) {
    if (!E || !E.hasAttribute("src"))
      return null;
    const _ = E.getAttribute("src"), T = _.match(
      /(.*)#asset:(\d+)(?::transform:([a-zA-Z][a-zA-Z0-9_]*))?/
    );
    return T ? {
      src: _,
      baseSrc: T[1],
      assetId: T[2],
      transform: T[3]
    } : null;
  }
  /**
   * Executes the command.
   *
   * @fires execute
   */
  execute() {
    this.editor.model;
    const _ = this._element(), T = this._srcInfo(_);
    if (T) {
      let O = {
        allowSavingAsNew: !1,
        // todo: we might want to change that, but currently we're doing the same functionality as in Redactor
        onSave: (te) => {
          this._reloadImage(T.assetId, te);
        },
        allowDegreeFractions: Craft.isImagick
      };
      new Craft.AssetImageEditor(T.assetId, O);
    }
  }
  /**
   * Reloads the matching images after save was triggered from the Image Editor.
   *
   * @param data
   */
  _reloadImage(E, _) {
    let O = this.editor.model;
    this._getAllImageAssets().forEach((i) => {
      if (i.srcInfo.assetId == E)
        if (i.srcInfo.transform) {
          let u = {
            assetId: i.srcInfo.assetId,
            handle: i.srcInfo.transform
          };
          Craft.sendActionRequest("POST", "assets/generate-transform", {
            data: u
          }).then((f) => {
            let k = f.data.url + "?" + (/* @__PURE__ */ new Date()).getTime() + "#asset:" + i.srcInfo.assetId + ":transform:" + i.srcInfo.transform;
            O.change((d) => {
              d.setAttribute("src", k, i.element);
            });
          });
        } else {
          let u = i.srcInfo.baseSrc + "?" + (/* @__PURE__ */ new Date()).getTime() + "#asset:" + i.srcInfo.assetId;
          O.change((f) => {
            f.setAttribute("src", u, i.element);
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
    const _ = this.editor.model, T = _.createRangeIn(_.document.getRoot());
    let O = [];
    for (const te of T.getWalker({ ignoreElementEnd: !0 }))
      if (te.item.is("element") && te.item.name === "imageBlock") {
        let i = this._srcInfo(te.item);
        i && O.push({
          element: te.item,
          srcInfo: i
        });
      }
    return O;
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class jc extends Bn {
  static get requires() {
    return [Mc];
  }
  static get pluginName() {
    return "ImageEditorEditing";
  }
  init() {
    const E = this.editor, _ = new Tu(E);
    E.commands.add("imageEditor", _);
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class Ou extends Bn {
  static get requires() {
    return [jc];
  }
  static get pluginName() {
    return "ImageEditorUI";
  }
  init() {
    const _ = this.editor.commands.get("imageEditor");
    this.bind("isEnabled").to(_), this._registerImageEditorButton();
  }
  /**
   * A helper function that creates a button component for the plugin that triggers launch of the Image Editor.
   */
  _registerImageEditorButton() {
    const E = this.editor, _ = E.t, T = E.commands.get("imageEditor"), O = () => {
      const te = new ea();
      return te.set({
        label: _("Edit Image"),
        withText: !0
      }), te.bind("isEnabled").to(T), this.listenTo(te, "execute", (i) => {
        E.execute("imageEditor"), E.editing.view.focus();
      }), te;
    };
    E.ui.componentFactory.add("imageEditor", O);
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class Gu extends Bn {
  static get requires() {
    return [jc, Ou];
  }
  static get pluginName() {
    return "ImageEditor";
  }
}
class Nu extends _l {
  execute(E) {
    const _ = this.editor, T = _.model.document.selection;
    _.model.change((O) => {
      const te = O.createElement("craftEntryModel", {
        ...Object.fromEntries(T.getAttributes()),
        cardHtml: E.cardHtml,
        entryId: E.entryId,
        siteId: E.siteId
      });
      _.model.insertObject(te, null, null, {
        setSelection: "on"
      });
    });
  }
  refresh() {
    const _ = this.editor.model.document.selection, T = !_.isCollapsed && _.getFirstRange();
    this.isEnabled = !T;
  }
}
class Pu extends Bn {
  /**
   * @inheritDoc
   */
  static get requires() {
    return [uu];
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
    const E = this.editor;
    E.commands.add("insertEntry", new Nu(E)), E.editing.mapper.on(
      "viewToModelPosition",
      du(E.model, (_) => {
        _.hasClass("cke-entry-card");
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
    const E = this.editor.conversion;
    E.for("upcast").elementToElement({
      view: {
        name: "craft-entry"
        // has to be lower case
      },
      model: (T, { writer: O }) => {
        const te = T.getAttribute("data-card-html"), i = T.getAttribute("data-entry-id"), u = T.getAttribute("data-site-id") ?? null;
        return O.createElement("craftEntryModel", {
          cardHtml: te,
          entryId: i,
          siteId: u
        });
      }
    }), E.for("editingDowncast").elementToElement({
      model: "craftEntryModel",
      view: (T, { writer: O }) => {
        const te = T.getAttribute("entryId") ?? null, i = T.getAttribute("siteId") ?? null, u = O.createContainerElement("div", {
          class: "cke-entry-card",
          "data-entry-id": te,
          "data-site-id": i
        });
        return _(T, O, u), pu(u, O);
      }
    }), E.for("dataDowncast").elementToElement({
      model: "craftEntryModel",
      view: (T, { writer: O }) => {
        const te = T.getAttribute("entryId") ?? null, i = T.getAttribute("siteId") ?? null;
        return O.createContainerElement("craft-entry", {
          "data-entry-id": te,
          "data-site-id": i
        });
      }
    });
    const _ = (T, O, te) => {
      this._getCardHtml(T).then((i) => {
        const u = O.createRawElement(
          "div",
          null,
          function(k) {
            k.innerHTML = i.cardHtml, Craft.appendHeadHtml(i.headHtml), Craft.appendBodyHtml(i.bodyHtml);
          }
        );
        O.insert(O.createPositionAt(te, 0), u);
        const f = this.editor;
        f.editing.view.focus(), setTimeout(() => {
          Craft.cp.elementThumbLoader.load($(f.ui.element));
        }, 100), f.model.change((k) => {
          f.ui.update(), $(f.sourceElement).trigger("keyup");
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
  async _getCardHtml(E) {
    var u, f, k;
    let _ = E.getAttribute("cardHtml") ?? null, T = $(this.editor.sourceElement).parents(".field");
    const O = $(T[0]).data("layout-element");
    if (_)
      return { cardHtml: _ };
    const te = E.getAttribute("entryId") ?? null, i = E.getAttribute("siteId") ?? null;
    try {
      const d = this.editor, m = $(d.ui.view.element).closest(
        "form,.lp-editor-container"
      ).data("elementEditor");
      m && await m.checkForm();
      const { data: b } = await Craft.sendActionRequest(
        "POST",
        "ckeditor/ckeditor/entry-card-html",
        {
          data: {
            entryId: te,
            siteId: i,
            layoutElementUid: O
          }
        }
      );
      return b;
    } catch (d) {
      return console.error((u = d == null ? void 0 : d.response) == null ? void 0 : u.data), { cardHtml: '<div class="element card"><div class="card-content"><div class="card-heading"><div class="label error"><span>' + (((k = (f = d == null ? void 0 : d.response) == null ? void 0 : f.data) == null ? void 0 : k.message) || "An unknown error occurred.") + "</span></div></div></div></div>" };
    }
  }
}
class Du extends fu {
  constructor(E) {
    super(E), this.domEventType = "dblclick";
  }
  onDomEvent(E) {
    this.fire(E.type, E);
  }
}
class Ru extends vo {
  constructor(E, _ = {}) {
    super(E), this.bindTemplate, this.set("isFocused", !1), this.entriesUi = _.entriesUi, this.editor = this.entriesUi.editor, this.entryType = _.entryType;
    const T = this.editor.commands.get("insertEntry");
    let O = new ea(), te = {
      commandValue: this.entryType.model.commandValue,
      //entry type id
      label: this.entryType.model.label,
      withText: !this.entryType.model.icon,
      tooltip: Craft.t("app", "New {type}", {
        type: this.entryType.model.label
      })
    }, i = ["btn", "ck-reset_all-excluded"];
    this.entryType.model.icon && i.push(["icon", "cp-icon"]), te.class = i.join(" "), this.entryType.model.withIcon && (te.icon = this.entryType.model.icon), O.set(te), this.listenTo(O, "execute", (u) => {
      this.entriesUi._showCreateEntrySlideout(u.source.commandValue);
    }), O.bind("isEnabled").to(T), this.setTemplate({
      tag: "div",
      attributes: {
        // ck-reset_all-excluded class is needed so that CKE doesn't mess with the styles we already have
        class: ["entry-type-button"]
      },
      children: [O]
    });
  }
  // this is needed so that the button is focusable
  focus() {
    this.element.children[0].focus();
  }
}
class Mu extends vo {
  constructor(E, _ = {}) {
    super(E), this.bindTemplate, this.set("isFocused", !1), this.entriesUi = _.entriesUi, this.editor = this.entriesUi.editor;
    const T = _.entryTypes, O = this.editor.commands.get("insertEntry");
    let te = new ns();
    T.forEach((u) => {
      te.add(u);
    });
    const i = rs(E);
    i.buttonView.set({
      label: Craft.t("ckeditor", "Add nested content"),
      icon: Ic,
      tooltip: !0,
      withText: !1
    }), i.bind("isEnabled").to(O), i.id = Craft.uuid(), El(i, () => te, {
      ariaLabel: Craft.t("ckeditor", "Entry types list")
    }), this.listenTo(i, "execute", (u) => {
      this.entriesUi._showCreateEntrySlideout(u.source.commandValue);
    }), this.setTemplate({
      tag: "div",
      attributes: {
        // ck-reset_all-excluded class is needed so that CKE doesn't mess with the styles we already have
        class: ["entry-type-button"]
      },
      children: [i]
    });
  }
  // this is needed so that the dropdown button is focusable
  focus() {
    this.element.children[0].children[0].focus();
  }
}
class Iu extends vo {
  constructor(E, _ = {}) {
    super(E), this.bindTemplate, this.set("isFocused", !1), this.entriesUi = _.entriesUi, this.editor = this.entriesUi.editor;
    const T = this.editor.commands.get("insertEntry"), O = rs(E);
    O.buttonView.set({
      label: Craft.t("ckeditor", "Add nested content"),
      icon: Ic,
      tooltip: !0,
      withText: !1
    }), O.bind("isEnabled").to(T), O.id = Craft.uuid(), this.listenTo(O, "execute", (te) => {
      this.entriesUi._showCreateEntrySlideout(te.source.commandValue);
    }), this.setTemplate({
      tag: "div",
      attributes: {
        // ck-reset_all-excluded class is needed so that CKE doesn't mess with the styles we already have
        class: ["entry-type-button"],
        tabindex: -1
      },
      children: [O]
    });
  }
  // this is needed so that the button is focusable
  focus() {
    this.element.focus();
  }
}
class zu extends Bn {
  /**
   * @inheritDoc
   */
  static get requires() {
    return [Pc];
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
    this._createToolbarEntriesButtons(), this.editor.ui.componentFactory.add("editEntryBtn", (E) => this._createEditEntryBtn(E)), this._listenToEvents();
  }
  /**
   * @inheritDoc
   */
  afterInit() {
    this.editor.plugins.get(
      Pc
    ).register("entriesBalloon", {
      ariaLabel: Craft.t("ckeditor", "Entry toolbar"),
      // Toolbar Buttons
      items: ["editEntryBtn"],
      // If a related element is returned the toolbar is attached
      getRelatedElement: (_) => {
        const T = _.getSelectedElement();
        return T && hu(T) && T.hasClass("cke-entry-card") ? T : null;
      }
    });
  }
  /**
   * Hook up event listeners
   *
   * @private
   */
  _listenToEvents() {
    const E = this.editor.editing.view, _ = E.document;
    E.addObserver(Du), this.editor.listenTo(_, "dblclick", (T, O) => {
      if (!this.editor.isReadOnly) {
        const te = this.editor.editing.mapper.toModelElement(
          O.target.parent
        );
        te.name === "craftEntryModel" && this._initEditEntrySlideout(O, te);
      }
    });
  }
  _initEditEntrySlideout(E = null, _ = null) {
    if (this.editor.isReadOnly)
      return;
    _ === null && (_ = this.editor.model.document.selection.getSelectedElement());
    const T = _.getAttribute("entryId"), O = _.getAttribute("siteId") ?? null;
    this._showEditEntrySlideout(T, O, _);
  }
  /**
   * Creates toolbar buttons that allow for an entry of given type to be inserted into the editor
   *
   * @private
   */
  _createToolbarEntriesButtons() {
    const _ = this.editor.config.get("entryTypeOptions");
    if (!(!_ || !_.length))
      if (_.length == 1 && _[0].value == "fake")
        this.editor.ui.componentFactory.add(
          "createEntry",
          (T) => new Iu(this.editor.locale, {
            entriesUi: this
          })
        );
      else {
        let T = this._getEntryTypeButtonsCollection(
          _ ?? []
        ), O = T.filter((i) => i.model.expanded), te = T.filter((i) => !i.model.expanded);
        O.forEach((i, u) => {
          this.editor.ui.componentFactory.add(
            `createEntry-${i.model.uid}`,
            (f) => new Ru(this.editor.locale, {
              entriesUi: this,
              entryType: i
            })
          );
        }), te.length && this.editor.ui.componentFactory.add(
          "createEntry",
          (i) => new Mu(this.editor.locale, {
            entriesUi: this,
            entryTypes: te
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
  _getEntryTypeButtonsCollection(E) {
    const _ = new ns();
    return E.map((T) => {
      const O = {
        type: "button",
        model: new ts({
          commandValue: T.value,
          //entry type id
          color: T.color,
          expanded: T.expanded,
          icon: T.icon,
          label: T.label || T.value,
          uid: T.uid,
          withIcon: T.icon,
          withText: T.expanded ? !T.icon : !0
          // items in a dropdown should always have text
        })
      };
      _.add(O);
    }), _;
  }
  /**
   * Creates an edit entry button that shows in the contextual balloon for each craft entry widget
   * @param locale
   * @returns {ButtonView}
   * @private
   */
  _createEditEntryBtn(E) {
    if (this.editor.isReadOnly)
      return;
    const _ = new ea(E);
    return _.set({
      isEnabled: !0,
      label: Craft.t("app", "Edit {type}", {
        type: Craft.elementTypeNames["craft\\elements\\Entry"][2]
      }),
      tooltip: !0,
      withText: !0
    }), this.listenTo(_, "execute", (T) => {
      this._initEditEntrySlideout();
    }), _;
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
  _getCardElement(E) {
    return $(this.editor.ui.element).find('.element.card[data-id="' + E + '"]');
  }
  /**
   * Opens an element editor for existing entry
   *
   * @param entryId
   * @private
   */
  _showEditEntrySlideout(E, _, T) {
    const O = this.editor, te = O.model, i = this.getElementEditor();
    let u = this._getCardElement(E);
    const f = u.data("owner-id"), k = Craft.createElementEditor(this.elementType, null, {
      elementId: E,
      params: {
        siteId: _
      },
      onLoad: () => {
        k.elementEditor.on("update", () => {
          Craft.Preview.refresh();
        });
      },
      onBeforeSubmit: async () => {
        if (u !== null && Garnish.hasAttr(u, "data-owner-is-canonical") && (!i || !i.settings.isUnpublishedDraft)) {
          await k.elementEditor.checkForm(!0, !0);
          let d = $(O.sourceElement).attr("name");
          i && d && await i.setFormValue(d, "*"), i && i.settings.draftId && k.elementEditor.settings.draftId && (k.elementEditor.settings.saveParams || (k.elementEditor.settings.saveParams = {}), k.elementEditor.settings.saveParams.action = "elements/save-nested-element-for-derivative", k.elementEditor.settings.saveParams.newOwnerId = i.getDraftElementId(f));
        }
      },
      onSubmit: (d) => {
        let C = this._getCardElement(E);
        C !== null && d.data.id != C.data("id") && (C.attr("data-id", d.data.id).data("id", d.data.id).data("owner-id", d.data.ownerId), O.editing.model.change((m) => {
          m.setAttribute("entryId", d.data.id, T), O.ui.update();
        }), Craft.refreshElementInstances(d.data.id));
      }
    });
    k.on("beforeClose", () => {
      te.change((d) => {
        d.setSelection(d.createPositionAfter(T)), O.editing.view.focus();
      });
    }), k.on("close", () => {
      O.editing.view.focus();
    });
  }
  /**
   * Creates new entry and opens the element editor for it
   *
   * @param entryTypeId
   * @private
   */
  async _showCreateEntrySlideout(E) {
    var C, m;
    const _ = this.editor, T = _.model, te = T.document.selection.getFirstRange(), i = _.config.get(
      "nestedElementAttributes"
    ), u = Object.assign({}, i, {
      typeId: E
    }), f = this.getElementEditor();
    f && (await f.markDeltaNameAsModified(_.sourceElement.name), u.ownerId = f.getDraftElementId(
      i.ownerId
    ));
    let k;
    try {
      k = (await Craft.sendActionRequest(
        "POST",
        "elements/create",
        {
          data: u
        }
      )).data;
    } catch (b) {
      throw Craft.cp.displayError((m = (C = b == null ? void 0 : b.response) == null ? void 0 : C.data) == null ? void 0 : m.error), b;
    }
    const d = Craft.createElementEditor(this.elementType, {
      elementId: k.element.id,
      draftId: k.element.draftId,
      params: {
        fresh: 1,
        siteId: k.element.siteId
      },
      onSubmit: (b) => {
        _.commands.execute("insertEntry", {
          entryId: b.data.id,
          siteId: b.data.siteId
        });
      }
    });
    d.on("beforeClose", () => {
      d.$triggerElement = null, T.change((b) => {
        b.setSelection(
          b.createPositionAt(
            _.model.document.getRoot(),
            te.end.path[0]
          )
        );
      }), _.editing.view.focus();
    });
  }
}
class Au extends Bn {
  static get requires() {
    return [Pu, zu];
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
class ju extends Bn {
  static get pluginName() {
    return "CraftLinkEditing";
  }
  constructor() {
    super(...arguments), this.conversionData = [], this.editor.config.define("advancedLinkFields", []);
  }
  init() {
    const _ = this.editor.config.get("advancedLinkFields");
    this.conversionData = _.map((T) => T.conversion ?? null).filter((T) => T), this._defineSchema(), this._defineConverters(), this._adjustLinkCommand(), this._adjustUnlinkCommand();
  }
  _defineSchema() {
    const E = this.editor.model.schema;
    let _ = this.conversionData.map((T) => T.model);
    E.extend("$text", {
      allowAttributes: _
    });
  }
  _defineConverters() {
    const E = this.editor.conversion;
    for (let _ = 0; _ < this.conversionData.length; _++)
      E.for("downcast").attributeToElement({
        model: this.conversionData[_].model,
        view: (T, { writer: O }) => {
          const te = O.createAttributeElement(
            "a",
            { [this.conversionData[_].view]: T },
            { priority: 5 }
          );
          return O.setCustomProperty("link", !0, te), te;
        }
      }), E.for("upcast").attributeToAttribute({
        view: {
          name: "a",
          key: this.conversionData[_].view
        },
        model: {
          key: this.conversionData[_].model,
          value: (T, O) => T.getAttribute(this.conversionData[_].view)
        }
      });
  }
  _adjustLinkCommand() {
    const E = this.editor, _ = E.commands.get("link");
    let T = !1;
    _.on(
      "execute",
      (O, te) => {
        if (T) {
          T = !1;
          return;
        }
        O.stop(), T = !0;
        const i = te[te.length - 1], u = E.model.document.selection;
        E.model.change((f) => {
          E.execute("link", ...te);
          const k = u.getFirstPosition();
          this.conversionData.forEach((d) => {
            if (u.isCollapsed) {
              const C = k.textNode || k.nodeBefore;
              i[d.model] ? f.setAttribute(
                d.model,
                i[d.model],
                f.createRangeOn(C)
              ) : f.removeAttribute(d.model, f.createRangeOn(C));
            } else {
              const C = E.model.schema.getValidRanges(
                u.getRanges(),
                d.model
              );
              for (const m of C)
                i[d.model] ? f.setAttribute(
                  d.model,
                  i[d.model],
                  m
                ) : f.removeAttribute(d.model, m);
            }
          });
        });
      },
      { priority: "high" }
    );
  }
  _adjustUnlinkCommand() {
    const E = this.editor, _ = E.commands.get("unlink"), { model: T } = E, { selection: O } = T.document;
    let te = !1;
    _.on(
      "execute",
      (i) => {
        te || (i.stop(), T.change(() => {
          te = !0, E.execute("unlink"), te = !1, T.change((u) => {
            let f;
            this.conversionData.forEach((k) => {
              O.isCollapsed ? f = [
                mu(
                  O.getFirstPosition(),
                  k.model,
                  O.getAttribute(k.model),
                  T
                )
              ] : f = T.schema.getValidRanges(
                O.getRanges(),
                k.model
              );
              for (const d of f)
                u.removeAttribute(k.model, d);
            });
          });
        }));
      },
      { priority: "high" }
    );
  }
}
class Lu extends vo {
  constructor(E, _ = {}) {
    super(E), this.bindTemplate, this.set("isFocused", !1), this.linkUi = _.linkUi, this.editor = this.linkUi.editor, this.elementId = this.linkUi._getLinkElementId(), this.siteId = this.linkUi._getLinkSiteId(), this.linkOption = _.linkOption;
    const T = this.linkUi._getLinkElementRefHandle();
    if (this.button = null, T) {
      const O = this.linkUi.linkTypeDropdownItemModels[T];
      this.linkUi.linkTypeDropdownView.buttonView.label == O.label && (this.button = Craft.t("app", "Loading"));
    }
    this.button == null && (this.button = new ea(), this.button.set({
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
    const E = this.linkUi, _ = E._linkUI, T = this.linkOption;
    this.element.addEventListener("click", function(O) {
      (this.children[0].classList.contains("add") || O.target.classList.contains("ck-button__label")) && (_._hideUI(), E._showElementSelectorModal(T));
    }), this.element.children.length == 0 && Craft.sendActionRequest("POST", "app/render-elements", {
      data: {
        elements: [
          {
            type: T.elementType,
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
    }).then((O) => {
      if (Object.keys(O.data.elements).length > 0) {
        this.element.innerHTML = O.data.elements[this.elementId][0], Craft.appendHeadHtml(O.data.headHtml), Craft.appendBodyHtml(O.data.bodyHtml);
        let te = this.element.firstChild;
        const i = [
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
        Craft.addActionsToChip(te, i), E._alignFocus();
      }
    }).catch((O) => {
      var te, i, u, f;
      throw Craft.cp.displayError((i = (te = O == null ? void 0 : O.response) == null ? void 0 : te.data) == null ? void 0 : i.message), ((f = (u = O == null ? void 0 : O.response) == null ? void 0 : u.data) == null ? void 0 : f.message) ?? O;
    });
  }
}
class Fu extends vo {
  constructor(E, _ = {}) {
    super(E);
    const T = this.bindTemplate;
    this.set("label", Craft.t("app", "Advanced")), this.linkUi = _.linkUi, this.editor = this.linkUi.editor, this.children = this.createCollection(), this.advancedChildren = this.createCollection(), this.setTemplate({
      tag: "details",
      attributes: {
        class: ["ck", "ck-form__details", "link-type-advanced"]
      },
      children: this.children
    }), this.summary = new vo(E), this.summary.setTemplate({
      tag: "summary",
      attributes: {
        class: ["ck", "ck-form__details__summary"]
      },
      children: [{ text: T.to("label") }]
    }), this.children.add(this.summary), this.advancedFieldsContainer = new vo(E), this.advancedFieldsContainer.setTemplate({
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
  onToggle(E) {
    const { formView: _ } = this.linkUi._linkUI;
    if (E.target.open) {
      const T = _._focusables.getIndex(this);
      this.advancedChildren._items.forEach((O, te) => {
        _._focusables.add(O, T + te + 1), _.focusTracker.add(O.element, T + te + 1);
      });
    } else
      this.advancedChildren._items.forEach((T, O) => {
        _._focusables.remove(T), _.focusTracker.remove(T.element);
      });
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class Uu extends Bn {
  static get requires() {
    return [Dc];
  }
  static get pluginName() {
    return "CraftLinkUI";
  }
  constructor() {
    super(...arguments), this.linkTypeWrapperView = null, this.advancedView = null, this.linkTypeDropdownView = null, this.linkTypeDropdownItemModels = [], this.elementTypeRefHandleRE = null, this.urlWithRefHandleRE = null, this.conversionData = [], this.linkOptions = [], this.advancedLinkFields = [], this.editor.config.define("linkOptions", []), this.editor.config.define("advancedLinkFields", []);
  }
  init() {
    const E = this.editor;
    this._linkUI = E.plugins.get(Dc), this._balloon = E.plugins.get(gu), this.linkOptions = E.config.get("linkOptions"), this.advancedLinkFields = E.config.get("advancedLinkFields"), this.conversionData = this.advancedLinkFields.map((T) => T.conversion ?? null).filter((T) => T);
    const _ = CKE_LOCALIZED_REF_HANDLES.join("|");
    this.elementTypeRefHandleRE = new RegExp(
      `(#((?:${_})):\\d+)`
    ), this.urlWithRefHandleRE = new RegExp(
      `(.+)(#((?:${_})):(\\d+))(?:@(\\d+))?`
    ), this._modifyFormViewTemplate(), this._balloon.on(
      "set:visibleView",
      (T, O, te, i) => {
        const { formView: u } = this._linkUI;
        te === i || te !== u || this._alignFocus();
      }
    );
  }
  /**
   * Reset focus order of the extra fields we're adding to the link form view
   */
  _alignFocus() {
    const { formView: E } = this._linkUI;
    let _ = 0;
    this.linkTypeWrapperView && (this.linkTypeWrapperView._unboundChildren._items.forEach((T) => {
      E._focusables.has(T) && E._focusables.remove(T), E.focusTracker.remove(T.element), E._focusables.add(T, _), E.focusTracker.add(T.element, _), _++;
    }), this.advancedView !== null && (E._focusables.has(this.advancedView) && E._focusables.remove(this.advancedView), E.focusTracker.remove(this.advancedView), E._focusables.add(this.advancedView, _), E.focusTracker.add(this.advancedView.element, _)));
  }
  /**
   * Add all our custom fields (for element linking and advanced fields) to the link form view.
   */
  _modifyFormViewTemplate() {
    this._linkUI.formView || this._linkUI._createViews();
    const { formView: E } = this._linkUI;
    E.template.attributes.class.push(
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
  _urlInputRefMatch(E) {
    return this._urlInputValue().match(E);
  }
  ////////////////////// Link Options Dropdown (link types) //////////////////////
  /**
   * Create a link type dropdown.
   */
  _linkOptionsDropdown() {
    const { formView: E } = this._linkUI, { urlInputView: _ } = E, { fieldView: T } = _;
    this.linkTypeDropdownView = rs(E.locale), this.linkTypeDropdownView.buttonView.set({
      label: "",
      withText: !0,
      isVisible: !0
    }), this.linkTypeDropdownItemModels = Object.fromEntries(
      this._getLinkListItemDefinitions().map((O) => [O.handle, O])
    ), El(
      this.linkTypeDropdownView,
      new ns([
        ...this._getLinkListItemDefinitions().map((O) => ({
          type: "button",
          model: this.linkTypeDropdownItemModels[O.handle]
        }))
      ])
    ), T.isEmpty && this._showLinkTypeForm("default"), this.linkTypeDropdownView.on("execute", (O) => {
      if (O.source.linkOption) {
        const te = O.source.linkOption;
        this._selectLinkTypeDropdownItem(te.refHandle), this._showLinkTypeForm(te, E);
      } else
        this._selectLinkTypeDropdownItem("default"), this._showLinkTypeForm("default");
    }), this.listenTo(T, "change:value", () => {
      this._toggleLinkTypeDropdownView();
      const O = this._getLinkElementRefHandle();
      O ? this._showLinkTypeForm(
        this.linkTypeDropdownItemModels[O].linkOption
      ) : this._showLinkTypeForm("default");
    }), this.listenTo(T, "input", () => {
      this._toggleLinkTypeDropdownView();
    });
  }
  /**
   * Get the refHandle from the URL field value.
   */
  _getLinkElementRefHandle() {
    let E = null;
    const _ = this._urlInputValue().match(this.elementTypeRefHandleRE);
    return _ && (E = _[2], E && typeof this.linkTypeDropdownItemModels[E] > "u" && (E = null)), E;
  }
  /**
   * Get element ID from the URL field value.
   */
  _getLinkElementId() {
    let E = null;
    const _ = this._urlInputRefMatch(this.urlWithRefHandleRE);
    return _ && (E = _[4] ? parseInt(_[4], 10) : null), E;
  }
  /**
   * Get site ID from the URL field value.
   */
  _getLinkSiteId() {
    let E = null;
    const _ = this._urlInputRefMatch(this.urlWithRefHandleRE);
    return _ && (E = _[5] ? parseInt(_[5], 10) : null), E;
  }
  /**
   * Toggle between element link and default URL link fields.
   */
  _toggleLinkTypeDropdownView() {
    let E = this._getLinkElementRefHandle();
    E ? (this.linkTypeDropdownView.buttonView.set("isVisible", !0), this._selectLinkTypeDropdownItem(E)) : this._selectLinkTypeDropdownItem("default");
  }
  /**
   * Select link type from the dropdown.
   */
  _selectLinkTypeDropdownItem(E) {
    const _ = this.linkTypeDropdownItemModels[E], T = E ? Craft.t("app", "{name}", { name: _.label }) : _.label;
    this.linkTypeDropdownView.buttonView.set("label", T), Object.values(this.linkTypeDropdownItemModels).forEach((O) => {
      O.set("isOn", O.handle === _.handle);
    });
  }
  /**
   * Get a list of all the options that should be shown in the link type dropdown.
   */
  _getLinkListItemDefinitions() {
    const E = [];
    for (const _ of this.linkOptions)
      E.push(
        new ts({
          label: _.label,
          handle: _.refHandle,
          linkOption: _,
          withText: !0
        })
      );
    return E.push(
      new ts({
        label: Craft.t("app", "URL"),
        handle: "default",
        withText: !0
      })
    ), E;
  }
  /**
   * Place the link type fields in the form.
   */
  _showLinkTypeForm(E) {
    let _ = null;
    const { formView: T } = this._linkUI, { children: O } = T, { urlInputView: te } = T, { displayedTextInputView: i } = T;
    i.focus(), this.linkTypeWrapperView !== null && O.remove(this.linkTypeWrapperView), E === "default" ? _ = te : (this._getLinkSiteId(), this._getLinkElementId(), _ = new Lu(T.locale, {
      linkUi: this,
      linkOption: E,
      value: this._urlInputValue()
    })), this.linkTypeWrapperView = new vo(), this.linkTypeWrapperView.setTemplate({
      tag: "div",
      children: [this.linkTypeDropdownView, _],
      attributes: {
        class: [
          "ck",
          "ck-form__row",
          "ck-form__row_large-top-padding",
          "link-type-group",
          "flex"
        ]
      }
    }), O.add(this.linkTypeWrapperView, 2);
  }
  /**
   * Show element selector modal for given element type (link option).
   */
  _showElementSelectorModal(E) {
    const _ = this.editor, T = _.model, O = T.document.selection, te = O.isCollapsed, i = O.getFirstRange(), u = this._linkUI._getSelectedLinkElement(), f = () => {
      _.editing.view.focus(), !te && i && T.change((k) => {
        k.setSelection(i);
      }), this._linkUI._hideFakeVisualSelection();
    };
    u || this._linkUI._showFakeVisualSelection(), Craft.createElementSelectorModal(E.elementType, {
      storageKey: `ckeditor:${this.pluginName}:${E.elementType}`,
      sources: E.sources,
      criteria: E.criteria,
      defaultSiteId: _.config.get("elementSiteId"),
      autoFocusSearchBox: !1,
      onSelect: (k) => {
        if (k.length) {
          const d = k[0], C = `${d.url}#${E.refHandle}:${d.id}@${d.siteId}`;
          if (_.editing.view.focus(), (!te || u) && i) {
            T.change((v) => {
              v.setSelection(i);
            });
            const m = _.commands.get("link");
            let b = this._getAdvancedFieldValues();
            m.execute(C, b);
          } else
            T.change((m) => {
              let b = this._getAdvancedFieldValues();
              if (m.insertText(
                d.label,
                {
                  linkHref: C
                },
                O.getFirstPosition(),
                b
              ), i instanceof yu)
                try {
                  const v = i.clone();
                  v.end.path[1] += d.label.length, m.setSelection(v);
                } catch {
                }
            });
          this._linkUI._hideFakeVisualSelection(), setTimeout(() => {
            this._linkUI._showUI(!0);
          }, 100);
        } else
          f();
      },
      onCancel: () => {
        f();
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
    var O;
    const E = this.editor.commands.get("link"), { formView: _ } = this._linkUI, { children: T } = _;
    this.advancedView = new Fu(_.locale, {
      linkUi: this
    }), T.add(this.advancedView, 3);
    for (const te of this.advancedLinkFields) {
      let i = (O = te.conversion) == null ? void 0 : O.model;
      if (i && typeof _[i] > "u")
        if (te.conversion.type === "bool") {
          const u = new bu();
          u.set({
            withText: !0,
            label: te.label,
            isToggleable: !0
          }), te.tooltip && (u.tooltip = te.tooltip), this.advancedView.advancedChildren.add(u), _[i] = u, _[i].bind("isOn").to(E, i, (f) => f === void 0 ? (_[i].element.value = "", !1) : (_[i].element.value = te.conversion.value, !0)), u.on("execute", () => {
            u.isOn ? (u.isOn = !1, _[i].element.value = "") : (u.isOn = !0, _[i].element.value = te.conversion.value);
          });
        } else {
          let u = this._addLabeledField(te);
          _[i] = u, _[i].fieldView.bind("value").to(E, i), _[i].fieldView.element.value = E[i] || "";
        }
      else if (te.value === "urlSuffix") {
        let u = this._addLabeledField(te);
        this.listenTo(
          u.fieldView,
          "change:isFocused",
          (f, k, d, C) => {
            if (d !== C && !d) {
              let m = f.source.element.value, b = null;
              const v = this._urlInputRefMatch(this.urlWithRefHandleRE);
              v ? b = v[1] : b = this._urlInputValue();
              try {
                let N = new URL(b), R = N.search, D = N.hash, L = b.replace(D, "").replace(R, "");
                const se = this._urlInputValue().replace(
                  b,
                  L + m
                );
                _.urlInputView.fieldView.set("value", se);
              } catch {
                let [R, D] = b.split("#"), [L, se] = R.split("?");
                const J = this._urlInputValue().replace(
                  b,
                  L + m
                );
                _.urlInputView.fieldView.set("value", J);
              }
            }
          }
        ), this.listenTo(_.urlInputView.fieldView, "change:value", (f) => {
          this._toggleUrlSuffixInputView(u, f.source.isEmpty);
        }), this.listenTo(
          _.urlInputView.fieldView,
          "change:isFocused",
          (f) => {
            this._toggleUrlSuffixInputView(u, f.source.isEmpty);
          }
        );
      }
    }
  }
  /**
   * Create a labeled field for given advanced field.
   */
  _addLabeledField(E) {
    const { formView: _ } = this._linkUI;
    let T = new vu(
      _.locale,
      ku
    );
    return T.label = E.label, E.tooltip && (T.infoText = E.tooltip), this.advancedView.advancedChildren.add(T), T;
  }
  /**
   * Populate URL suffix advanced field with content.
   * e.g. if a query string was added directly to the default URL input field,
   * ensure the value is also showing in the URL Suffix advanced field.
   */
  _toggleUrlSuffixInputView(E, _) {
    if (_)
      E.fieldView.set("value", "");
    else {
      const T = this._urlInputRefMatch(this.urlWithRefHandleRE);
      let O = null;
      T ? O = T[1] : O = this._urlInputValue();
      try {
        let te = new URL(O), i = te.search, u = te.hash;
        E.fieldView.set("value", i + u);
      } catch {
        let [i, u] = O.split("#"), [f, k] = i.split("?");
        u = u ? "#" + u : "", k = k ? "?" + k : "", E.fieldView.set("value", k + u);
      }
    }
  }
  /**
   * When link form is submitted, pass the advanced field values the link command.
   */
  _handleAdvancedLinkFieldsFormSubmit() {
    const _ = this.editor.commands.get("link"), { formView: T } = this._linkUI;
    T.on(
      "submit",
      () => {
        let O = this._getAdvancedFieldValues();
        _.once(
          "execute",
          (te, i) => {
            i.length === 4 ? Object.assign(i[3], O) : i.push(O);
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
    const E = this.editor, _ = E.commands.get("link"), T = E.model.document.selection;
    this.conversionData.forEach((O) => {
      _.set(O.model, null), E.model.document.on("change", () => {
        _[O.model] = T.getAttribute(O.model);
      });
    });
  }
  /**
   * Get the values of all the advanced fields.
   */
  _getAdvancedFieldValues() {
    const { formView: E } = this._linkUI;
    let _ = {};
    return this.conversionData.forEach((T) => {
      let O = [];
      T.type === "bool" ? O[T.model] = E[T.model].element.value : O[T.model] = E[T.model].fieldView.element.value, Object.assign(_, O);
    }), _;
  }
}
class Zu extends Bn {
  static get requires() {
    return [ju, Uu];
  }
  static get pluginName() {
    return "CraftLink";
  }
}
function Vu(Te) {
  return Te && Te.__esModule && Object.prototype.hasOwnProperty.call(Te, "default") ? Te.default : Te;
}
var wl = { exports: {} };
/*! For license information please see inspector.js.LICENSE.txt */
var Rc;
function Bu() {
  return Rc || (Rc = 1, (function(Te, E) {
    (function(_, T) {
      Te.exports = T();
    })(self, () => (() => {
      var _ = { 0: (i, u, f) => {
        var k = f(5072), d = f(7195);
        typeof (d = d.__esModule ? d.default : d) == "string" && (d = [[i.id, d, ""]]);
        var C = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        k(d, C), i.exports = d.locals || {};
      }, 42: (i, u, f) => {
        Object.defineProperty(u, "__esModule", { value: !0 }), u.toString = void 0;
        const k = f(1099), d = f(7860), C = f(5180), m = { string: k.quoteString, number: (b) => Object.is(b, -0) ? "-0" : String(b), boolean: String, symbol: (b, v, N) => {
          const R = Symbol.keyFor(b);
          return R !== void 0 ? `Symbol.for(${N(R)})` : `Symbol(${N(b.description)})`;
        }, bigint: (b, v, N) => `BigInt(${N(String(b))})`, undefined: String, object: d.objectToString, function: C.functionToString };
        u.toString = (b, v, N, R) => b === null ? "null" : m[typeof b](b, v, N, R);
      }, 312: (i, u, f) => {
        Object.defineProperty(u, "__esModule", { value: !0 });
        var k, d = f(1720), C = (k = d) && k.__esModule ? k : { default: k };
        u.default = C.default, i.exports = u.default;
      }, 411: (i, u, f) => {
        var k;
        (function() {
          var d = !(typeof window > "u" || !window.document || !window.document.createElement), C = { canUseDOM: d, canUseWorkers: typeof Worker < "u", canUseEventListeners: d && !(!window.addEventListener && !window.attachEvent), canUseViewport: d && !!window.screen };
          (k = (function() {
            return C;
          }).call(u, f, u, i)) === void 0 || (i.exports = k);
        })();
      }, 834: (i, u, f) => {
        Object.defineProperty(u, "__esModule", { value: !0 }), u.canUseDOM = u.SafeNodeList = u.SafeHTMLCollection = void 0;
        var k, d = f(411), C = ((k = d) && k.__esModule ? k : { default: k }).default, m = C.canUseDOM ? window.HTMLElement : {};
        u.SafeHTMLCollection = C.canUseDOM ? window.HTMLCollection : {}, u.SafeNodeList = C.canUseDOM ? window.NodeList : {}, u.canUseDOM = C.canUseDOM, u.default = m;
      }, 961: (i, u, f) => {
        (function k() {
          if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE == "function") try {
            __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(k);
          } catch (d) {
            console.error(d);
          }
        })(), i.exports = f(2551);
      }, 1062: (i, u, f) => {
        f.r(u), f.d(u, { default: () => C });
        var k = f(6314), d = f.n(k)()(function(m) {
          return m[1];
        });
        d.push([i.id, ".ck-inspector{--ck-inspector-icon-size:19px;--ck-inspector-button-size:calc(4px + var(--ck-inspector-icon-size));--ck-inspector-color-button:#777;--ck-inspector-color-button-hover:#222;--ck-inspector-color-button-on:#0f79e2}.ck-inspector .ck-inspector-button{border:0;border-radius:2px;color:var(--ck-inspector-color-button);height:var(--ck-inspector-button-size);overflow:hidden;padding:2px;width:var(--ck-inspector-button-size)}.ck-inspector .ck-inspector-button.ck-inspector-button_on,.ck-inspector .ck-inspector-button.ck-inspector-button_on:hover{color:var(--ck-inspector-color-button-on);opacity:1}.ck-inspector .ck-inspector-button.ck-inspector-button_disabled{opacity:.3}.ck-inspector .ck-inspector-button>span{display:none}.ck-inspector .ck-inspector-button:hover{color:var(--ck-inspector-color-button-hover)}.ck-inspector .ck-inspector-button svg{height:var(--ck-inspector-icon-size);width:var(--ck-inspector-icon-size)}.ck-inspector .ck-inspector-button svg,.ck-inspector .ck-inspector-button svg *{fill:currentColor}", ""]);
        const C = d;
      }, 1089: (i, u, f) => {
        function k(M) {
          return k = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(F) {
            return typeof F;
          } : function(F) {
            return F && typeof Symbol == "function" && F.constructor === Symbol && F !== Symbol.prototype ? "symbol" : typeof F;
          }, k(M);
        }
        Object.defineProperty(u, "__esModule", { value: !0 }), u.matchesSelector = D, u.matchesSelectorAndParentsTo = function(M, F, B) {
          var ne = M;
          do {
            if (D(ne, F)) return !0;
            if (ne === B) return !1;
            ne = ne.parentNode;
          } while (ne);
          return !1;
        }, u.addEvent = function(M, F, B, ne) {
          if (M) {
            var pe = v({ capture: !0 }, ne);
            M.addEventListener ? M.addEventListener(F, B, pe) : M.attachEvent ? M.attachEvent("on" + F, B) : M["on" + F] = B;
          }
        }, u.removeEvent = function(M, F, B, ne) {
          if (M) {
            var pe = v({ capture: !0 }, ne);
            M.removeEventListener ? M.removeEventListener(F, B, pe) : M.detachEvent ? M.detachEvent("on" + F, B) : M["on" + F] = null;
          }
        }, u.outerHeight = function(M) {
          var F = M.clientHeight, B = M.ownerDocument.defaultView.getComputedStyle(M);
          return F += (0, d.int)(B.borderTopWidth), F += (0, d.int)(B.borderBottomWidth);
        }, u.outerWidth = function(M) {
          var F = M.clientWidth, B = M.ownerDocument.defaultView.getComputedStyle(M);
          return F += (0, d.int)(B.borderLeftWidth), F += (0, d.int)(B.borderRightWidth);
        }, u.innerHeight = function(M) {
          var F = M.clientHeight, B = M.ownerDocument.defaultView.getComputedStyle(M);
          return F -= (0, d.int)(B.paddingTop), F -= (0, d.int)(B.paddingBottom);
        }, u.innerWidth = function(M) {
          var F = M.clientWidth, B = M.ownerDocument.defaultView.getComputedStyle(M);
          return F -= (0, d.int)(B.paddingLeft), F -= (0, d.int)(B.paddingRight);
        }, u.offsetXYFromParent = function(M, F, B) {
          var ne = F === F.ownerDocument.body ? { left: 0, top: 0 } : F.getBoundingClientRect(), pe = (M.clientX + F.scrollLeft - ne.left) / B, oe = (M.clientY + F.scrollTop - ne.top) / B;
          return { x: pe, y: oe };
        }, u.createCSSTransform = function(M, F) {
          var B = L(M, F, "px");
          return N({}, (0, C.browserPrefixToKey)("transform", C.default), B);
        }, u.createSVGTransform = function(M, F) {
          return L(M, F, "");
        }, u.getTranslation = L, u.getTouch = function(M, F) {
          return M.targetTouches && (0, d.findInArray)(M.targetTouches, function(B) {
            return F === B.identifier;
          }) || M.changedTouches && (0, d.findInArray)(M.changedTouches, function(B) {
            return F === B.identifier;
          });
        }, u.getTouchIdentifier = function(M) {
          if (M.targetTouches && M.targetTouches[0]) return M.targetTouches[0].identifier;
          if (M.changedTouches && M.changedTouches[0]) return M.changedTouches[0].identifier;
        }, u.addUserSelectStyles = function(M) {
          if (M) {
            var F = M.getElementById("react-draggable-style-el");
            F || ((F = M.createElement("style")).type = "text/css", F.id = "react-draggable-style-el", F.innerHTML = `.react-draggable-transparent-selection *::-moz-selection {all: inherit;}
`, F.innerHTML += `.react-draggable-transparent-selection *::selection {all: inherit;}
`, M.getElementsByTagName("head")[0].appendChild(F)), M.body && se(M.body, "react-draggable-transparent-selection");
          }
        }, u.removeUserSelectStyles = function(M) {
          if (M)
            try {
              if (M.body && J(M.body, "react-draggable-transparent-selection"), M.selection) M.selection.empty();
              else {
                var F = (M.defaultView || window).getSelection();
                F && F.type !== "Caret" && F.removeAllRanges();
              }
            } catch {
            }
        }, u.addClassName = se, u.removeClassName = J;
        var d = f(7056), C = (function(M) {
          if (M && M.__esModule) return M;
          if (M === null || k(M) !== "object" && typeof M != "function") return { default: M };
          var F = m();
          if (F && F.has(M)) return F.get(M);
          var B = {}, ne = Object.defineProperty && Object.getOwnPropertyDescriptor;
          for (var pe in M) if (Object.prototype.hasOwnProperty.call(M, pe)) {
            var oe = ne ? Object.getOwnPropertyDescriptor(M, pe) : null;
            oe && (oe.get || oe.set) ? Object.defineProperty(B, pe, oe) : B[pe] = M[pe];
          }
          return B.default = M, F && F.set(M, B), B;
        })(f(3514));
        function m() {
          if (typeof WeakMap != "function") return null;
          var M = /* @__PURE__ */ new WeakMap();
          return m = function() {
            return M;
          }, M;
        }
        function b(M, F) {
          var B = Object.keys(M);
          if (Object.getOwnPropertySymbols) {
            var ne = Object.getOwnPropertySymbols(M);
            F && (ne = ne.filter(function(pe) {
              return Object.getOwnPropertyDescriptor(M, pe).enumerable;
            })), B.push.apply(B, ne);
          }
          return B;
        }
        function v(M) {
          for (var F = 1; F < arguments.length; F++) {
            var B = arguments[F] != null ? arguments[F] : {};
            F % 2 ? b(Object(B), !0).forEach(function(ne) {
              N(M, ne, B[ne]);
            }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(M, Object.getOwnPropertyDescriptors(B)) : b(Object(B)).forEach(function(ne) {
              Object.defineProperty(M, ne, Object.getOwnPropertyDescriptor(B, ne));
            });
          }
          return M;
        }
        function N(M, F, B) {
          return F in M ? Object.defineProperty(M, F, { value: B, enumerable: !0, configurable: !0, writable: !0 }) : M[F] = B, M;
        }
        var R = "";
        function D(M, F) {
          return R || (R = (0, d.findInArray)(["matches", "webkitMatchesSelector", "mozMatchesSelector", "msMatchesSelector", "oMatchesSelector"], function(B) {
            return (0, d.isFunction)(M[B]);
          })), !!(0, d.isFunction)(M[R]) && M[R](F);
        }
        function L(M, F, B) {
          var ne = M.x, pe = M.y, oe = "translate(".concat(ne).concat(B, ",").concat(pe).concat(B, ")");
          if (F) {
            var fe = "".concat(typeof F.x == "string" ? F.x : F.x + B), ge = "".concat(typeof F.y == "string" ? F.y : F.y + B);
            oe = "translate(".concat(fe, ", ").concat(ge, ")") + oe;
          }
          return oe;
        }
        function se(M, F) {
          M.classList ? M.classList.add(F) : M.className.match(new RegExp("(?:^|\\s)".concat(F, "(?!\\S)"))) || (M.className += " ".concat(F));
        }
        function J(M, F) {
          M.classList ? M.classList.remove(F) : M.className = M.className.replace(new RegExp("(?:^|\\s)".concat(F, "(?!\\S)"), "g"), "");
        }
      }, 1099: (i, u) => {
        Object.defineProperty(u, "__esModule", { value: !0 }), u.stringifyPath = u.quoteKey = u.isValidVariableName = u.IS_VALID_IDENTIFIER = u.quoteString = void 0;
        const f = /[\\\'\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, k = /* @__PURE__ */ new Map([["\b", "\\b"], ["	", "\\t"], [`
`, "\\n"], ["\f", "\\f"], ["\r", "\\r"], ["'", "\\'"], ['"', '\\"'], ["\\", "\\\\"]]);
        function d(b) {
          return k.get(b) || `\\u${`0000${b.charCodeAt(0).toString(16)}`.slice(-4)}`;
        }
        u.quoteString = function(b) {
          return `'${b.replace(f, d)}'`;
        };
        const C = new Set("break else new var case finally return void catch for switch while continue function this with default if throw delete in try do instanceof typeof abstract enum int short boolean export interface static byte extends long super char final native synchronized class float package throws const goto private transient debugger implements protected volatile double import public let yield".split(" "));
        function m(b) {
          return typeof b == "string" && !C.has(b) && u.IS_VALID_IDENTIFIER.test(b);
        }
        u.IS_VALID_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/, u.isValidVariableName = m, u.quoteKey = function(b, v) {
          return m(b) ? b : v(b);
        }, u.stringifyPath = function(b, v) {
          let N = "";
          for (const R of b) m(R) ? N += `.${R}` : N += `[${v(R)}]`;
          return N;
        };
      }, 1197: (i, u, f) => {
        var k = f(5072), d = f(9740);
        typeof (d = d.__esModule ? d.default : d) == "string" && (d = [[i.id, d, ""]]);
        var C = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        k(d, C), i.exports = d.locals || {};
      }, 1256: (i, u, f) => {
        var k = f(5072), d = f(8535);
        typeof (d = d.__esModule ? d.default : d) == "string" && (d = [[i.id, d, ""]]);
        var C = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        k(d, C), i.exports = d.locals || {};
      }, 1345: (i, u, f) => {
        function k() {
          var b = this.constructor.getDerivedStateFromProps(this.props, this.state);
          b != null && this.setState(b);
        }
        function d(b) {
          this.setState((function(v) {
            var N = this.constructor.getDerivedStateFromProps(b, v);
            return N ?? null;
          }).bind(this));
        }
        function C(b, v) {
          try {
            var N = this.props, R = this.state;
            this.props = b, this.state = v, this.__reactInternalSnapshotFlag = !0, this.__reactInternalSnapshot = this.getSnapshotBeforeUpdate(N, R);
          } finally {
            this.props = N, this.state = R;
          }
        }
        function m(b) {
          var v = b.prototype;
          if (!v || !v.isReactComponent) throw new Error("Can only polyfill class components");
          if (typeof b.getDerivedStateFromProps != "function" && typeof v.getSnapshotBeforeUpdate != "function") return b;
          var N = null, R = null, D = null;
          if (typeof v.componentWillMount == "function" ? N = "componentWillMount" : typeof v.UNSAFE_componentWillMount == "function" && (N = "UNSAFE_componentWillMount"), typeof v.componentWillReceiveProps == "function" ? R = "componentWillReceiveProps" : typeof v.UNSAFE_componentWillReceiveProps == "function" && (R = "UNSAFE_componentWillReceiveProps"), typeof v.componentWillUpdate == "function" ? D = "componentWillUpdate" : typeof v.UNSAFE_componentWillUpdate == "function" && (D = "UNSAFE_componentWillUpdate"), N !== null || R !== null || D !== null) {
            var L = b.displayName || b.name, se = typeof b.getDerivedStateFromProps == "function" ? "getDerivedStateFromProps()" : "getSnapshotBeforeUpdate()";
            throw Error(`Unsafe legacy lifecycles will not be called for components using new component APIs.

` + L + " uses " + se + " but also contains the following legacy lifecycles:" + (N !== null ? `
  ` + N : "") + (R !== null ? `
  ` + R : "") + (D !== null ? `
  ` + D : "") + `

The above lifecycles should be removed. Learn more about this warning here:
https://fb.me/react-async-component-lifecycle-hooks`);
          }
          if (typeof b.getDerivedStateFromProps == "function" && (v.componentWillMount = k, v.componentWillReceiveProps = d), typeof v.getSnapshotBeforeUpdate == "function") {
            if (typeof v.componentDidUpdate != "function") throw new Error("Cannot polyfill getSnapshotBeforeUpdate() for components that do not define componentDidUpdate() on the prototype");
            v.componentWillUpdate = C;
            var J = v.componentDidUpdate;
            v.componentDidUpdate = function(M, F, B) {
              var ne = this.__reactInternalSnapshotFlag ? this.__reactInternalSnapshot : B;
              J.call(this, M, F, ne);
            };
          }
          return b;
        }
        f.r(u), f.d(u, { polyfill: () => m }), k.__suppressDeprecationWarning = !0, d.__suppressDeprecationWarning = !0, C.__suppressDeprecationWarning = !0;
      }, 1720: (i, u, f) => {
        Object.defineProperty(u, "__esModule", { value: !0 }), u.bodyOpenClassName = u.portalClassName = void 0;
        var k = Object.assign || function(S) {
          for (var j = 1; j < arguments.length; j++) {
            var A = arguments[j];
            for (var ae in A) Object.prototype.hasOwnProperty.call(A, ae) && (S[ae] = A[ae]);
          }
          return S;
        }, d = /* @__PURE__ */ (function() {
          function S(j, A) {
            for (var ae = 0; ae < A.length; ae++) {
              var G = A[ae];
              G.enumerable = G.enumerable || !1, G.configurable = !0, "value" in G && (G.writable = !0), Object.defineProperty(j, G.key, G);
            }
          }
          return function(j, A, ae) {
            return A && S(j.prototype, A), ae && S(j, ae), j;
          };
        })(), C = f(6540), m = J(C), b = J(f(961)), v = J(f(5556)), N = J(f(9090)), R = (function(S) {
          if (S && S.__esModule) return S;
          var j = {};
          if (S != null) for (var A in S) Object.prototype.hasOwnProperty.call(S, A) && (j[A] = S[A]);
          return j.default = S, j;
        })(f(6462)), D = f(834), L = J(D), se = f(1345);
        function J(S) {
          return S && S.__esModule ? S : { default: S };
        }
        function M(S, j) {
          if (!S) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
          return !j || typeof j != "object" && typeof j != "function" ? S : j;
        }
        var F = u.portalClassName = "ReactModalPortal", B = u.bodyOpenClassName = "ReactModal__Body--open", ne = D.canUseDOM && b.default.createPortal !== void 0, pe = function(S) {
          return document.createElement(S);
        }, oe = function() {
          return ne ? b.default.createPortal : b.default.unstable_renderSubtreeIntoContainer;
        };
        function fe(S) {
          return S();
        }
        var ge = (function(S) {
          function j() {
            var A, ae, G;
            (function(X, le) {
              if (!(X instanceof le)) throw new TypeError("Cannot call a class as a function");
            })(this, j);
            for (var Ee = arguments.length, Z = Array(Ee), U = 0; U < Ee; U++) Z[U] = arguments[U];
            return ae = G = M(this, (A = j.__proto__ || Object.getPrototypeOf(j)).call.apply(A, [this].concat(Z))), G.removePortal = function() {
              !ne && b.default.unmountComponentAtNode(G.node);
              var X = fe(G.props.parentSelector);
              X && X.contains(G.node) ? X.removeChild(G.node) : console.warn('React-Modal: "parentSelector" prop did not returned any DOM element. Make sure that the parent element is unmounted to avoid any memory leaks.');
            }, G.portalRef = function(X) {
              G.portal = X;
            }, G.renderPortal = function(X) {
              var le = oe()(G, m.default.createElement(N.default, k({ defaultStyles: j.defaultStyles }, X)), G.node);
              G.portalRef(le);
            }, M(G, ae);
          }
          return (function(A, ae) {
            if (typeof ae != "function" && ae !== null) throw new TypeError("Super expression must either be null or a function, not " + typeof ae);
            A.prototype = Object.create(ae && ae.prototype, { constructor: { value: A, enumerable: !1, writable: !0, configurable: !0 } }), ae && (Object.setPrototypeOf ? Object.setPrototypeOf(A, ae) : A.__proto__ = ae);
          })(j, S), d(j, [{ key: "componentDidMount", value: function() {
            D.canUseDOM && (ne || (this.node = pe("div")), this.node.className = this.props.portalClassName, fe(this.props.parentSelector).appendChild(this.node), !ne && this.renderPortal(this.props));
          } }, { key: "getSnapshotBeforeUpdate", value: function(A) {
            return { prevParent: fe(A.parentSelector), nextParent: fe(this.props.parentSelector) };
          } }, { key: "componentDidUpdate", value: function(A, ae, G) {
            if (D.canUseDOM) {
              var Ee = this.props, Z = Ee.isOpen, U = Ee.portalClassName;
              A.portalClassName !== U && (this.node.className = U);
              var X = G.prevParent, le = G.nextParent;
              le !== X && (X.removeChild(this.node), le.appendChild(this.node)), (A.isOpen || Z) && !ne && this.renderPortal(this.props);
            }
          } }, { key: "componentWillUnmount", value: function() {
            if (D.canUseDOM && this.node && this.portal) {
              var A = this.portal.state, ae = Date.now(), G = A.isOpen && this.props.closeTimeoutMS && (A.closesAt || ae + this.props.closeTimeoutMS);
              G ? (A.beforeClose || this.portal.closeWithTimeout(), setTimeout(this.removePortal, G - ae)) : this.removePortal();
            }
          } }, { key: "render", value: function() {
            return D.canUseDOM && ne ? (!this.node && ne && (this.node = pe("div")), oe()(m.default.createElement(N.default, k({ ref: this.portalRef, defaultStyles: j.defaultStyles }, this.props)), this.node)) : null;
          } }], [{ key: "setAppElement", value: function(A) {
            R.setElement(A);
          } }]), j;
        })(C.Component);
        ge.propTypes = { isOpen: v.default.bool.isRequired, style: v.default.shape({ content: v.default.object, overlay: v.default.object }), portalClassName: v.default.string, bodyOpenClassName: v.default.string, htmlOpenClassName: v.default.string, className: v.default.oneOfType([v.default.string, v.default.shape({ base: v.default.string.isRequired, afterOpen: v.default.string.isRequired, beforeClose: v.default.string.isRequired })]), overlayClassName: v.default.oneOfType([v.default.string, v.default.shape({ base: v.default.string.isRequired, afterOpen: v.default.string.isRequired, beforeClose: v.default.string.isRequired })]), appElement: v.default.oneOfType([v.default.instanceOf(L.default), v.default.instanceOf(D.SafeHTMLCollection), v.default.instanceOf(D.SafeNodeList), v.default.arrayOf(v.default.instanceOf(L.default))]), onAfterOpen: v.default.func, onRequestClose: v.default.func, closeTimeoutMS: v.default.number, ariaHideApp: v.default.bool, shouldFocusAfterRender: v.default.bool, shouldCloseOnOverlayClick: v.default.bool, shouldReturnFocusAfterClose: v.default.bool, preventScroll: v.default.bool, parentSelector: v.default.func, aria: v.default.object, data: v.default.object, role: v.default.string, contentLabel: v.default.string, shouldCloseOnEsc: v.default.bool, overlayRef: v.default.func, contentRef: v.default.func, id: v.default.string, overlayElement: v.default.func, contentElement: v.default.func }, ge.defaultProps = { isOpen: !1, portalClassName: F, bodyOpenClassName: B, role: "dialog", ariaHideApp: !0, closeTimeoutMS: 0, shouldFocusAfterRender: !0, shouldCloseOnEsc: !0, shouldCloseOnOverlayClick: !0, shouldReturnFocusAfterClose: !0, preventScroll: !1, parentSelector: function() {
          return document.body;
        }, overlayElement: function(S, j) {
          return m.default.createElement("div", S, j);
        }, contentElement: function(S, j) {
          return m.default.createElement("div", S, j);
        } }, ge.defaultStyles = { overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(255, 255, 255, 0.75)" }, content: { position: "absolute", top: "40px", left: "40px", right: "40px", bottom: "40px", border: "1px solid #ccc", background: "#fff", overflow: "auto", WebkitOverflowScrolling: "touch", borderRadius: "4px", outline: "none", padding: "20px" } }, (0, se.polyfill)(ge), u.default = ge;
      }, 1726: (i, u, f) => {
        Object.defineProperty(u, "__esModule", { value: !0 }), u.getBoundPosition = function(m, b, v) {
          if (!m.props.bounds) return [b, v];
          var N = m.props.bounds;
          N = typeof N == "string" ? N : (function(F) {
            return { left: F.left, top: F.top, right: F.right, bottom: F.bottom };
          })(N);
          var R = C(m);
          if (typeof N == "string") {
            var D, L = R.ownerDocument, se = L.defaultView;
            if (!((D = N === "parent" ? R.parentNode : L.querySelector(N)) instanceof se.HTMLElement)) throw new Error('Bounds selector "' + N + '" could not find an element.');
            var J = se.getComputedStyle(R), M = se.getComputedStyle(D);
            N = { left: -R.offsetLeft + (0, k.int)(M.paddingLeft) + (0, k.int)(J.marginLeft), top: -R.offsetTop + (0, k.int)(M.paddingTop) + (0, k.int)(J.marginTop), right: (0, d.innerWidth)(D) - (0, d.outerWidth)(R) - R.offsetLeft + (0, k.int)(M.paddingRight) - (0, k.int)(J.marginRight), bottom: (0, d.innerHeight)(D) - (0, d.outerHeight)(R) - R.offsetTop + (0, k.int)(M.paddingBottom) - (0, k.int)(J.marginBottom) };
          }
          return (0, k.isNum)(N.right) && (b = Math.min(b, N.right)), (0, k.isNum)(N.bottom) && (v = Math.min(v, N.bottom)), (0, k.isNum)(N.left) && (b = Math.max(b, N.left)), (0, k.isNum)(N.top) && (v = Math.max(v, N.top)), [b, v];
        }, u.snapToGrid = function(m, b, v) {
          var N = Math.round(b / m[0]) * m[0], R = Math.round(v / m[1]) * m[1];
          return [N, R];
        }, u.canDragX = function(m) {
          return m.props.axis === "both" || m.props.axis === "x";
        }, u.canDragY = function(m) {
          return m.props.axis === "both" || m.props.axis === "y";
        }, u.getControlPosition = function(m, b, v) {
          var N = typeof b == "number" ? (0, d.getTouch)(m, b) : null;
          if (typeof b == "number" && !N) return null;
          var R = C(v), D = v.props.offsetParent || R.offsetParent || R.ownerDocument.body;
          return (0, d.offsetXYFromParent)(N || m, D, v.props.scale);
        }, u.createCoreData = function(m, b, v) {
          var N = m.state, R = !(0, k.isNum)(N.lastX), D = C(m);
          return R ? { node: D, deltaX: 0, deltaY: 0, lastX: b, lastY: v, x: b, y: v } : { node: D, deltaX: b - N.lastX, deltaY: v - N.lastY, lastX: N.lastX, lastY: N.lastY, x: b, y: v };
        }, u.createDraggableData = function(m, b) {
          var v = m.props.scale;
          return { node: b.node, x: m.state.x + b.deltaX / v, y: m.state.y + b.deltaY / v, deltaX: b.deltaX / v, deltaY: b.deltaY / v, lastX: m.state.x, lastY: m.state.y };
        };
        var k = f(7056), d = f(1089);
        function C(m) {
          var b = m.findDOMNode();
          if (!b) throw new Error("<DraggableCore>: Unmounted during event!");
          return b;
        }
      }, 2411: (i, u) => {
        Object.defineProperty(u, "__esModule", { value: !0 }), u.default = function v(N) {
          var R = [].slice.call(N.querySelectorAll("*"), 0).reduce(function(D, L) {
            return D.concat(L.shadowRoot ? v(L.shadowRoot) : [L]);
          }, []);
          return R.filter(b);
        };
        var f = "none", k = "contents", d = /^(input|select|textarea|button|object|iframe)$/;
        function C(v) {
          var N = v.offsetWidth <= 0 && v.offsetHeight <= 0;
          if (N && !v.innerHTML) return !0;
          try {
            var R = window.getComputedStyle(v), D = R.getPropertyValue("display");
            return N ? D !== k && (function(L, se) {
              return se.getPropertyValue("overflow") !== "visible" || L.scrollWidth <= 0 && L.scrollHeight <= 0;
            })(v, R) : D === f;
          } catch {
            return console.warn("Failed to inspect element style"), !1;
          }
        }
        function m(v, N) {
          var R = v.nodeName.toLowerCase();
          return (d.test(R) && !v.disabled || R === "a" && v.href || N) && (function(D) {
            for (var L = D, se = D.getRootNode && D.getRootNode(); L && L !== document.body; ) {
              if (se && L === se && (L = se.host.parentNode), C(L)) return !1;
              L = L.parentNode;
            }
            return !0;
          })(v);
        }
        function b(v) {
          var N = v.getAttribute("tabindex");
          N === null && (N = void 0);
          var R = isNaN(N);
          return (R || N >= 0) && m(v, !R);
        }
        i.exports = u.default;
      }, 2444: (i, u, f) => {
        f.r(u), f.d(u, { default: () => C });
        var k = f(6314), d = f.n(k)()(function(m) {
          return m[1];
        });
        d.push([i.id, ".ck-inspector{--ck-inspector-explorer-width:300px}.ck-inspector .ck-inspector-pane{display:flex;width:100%}.ck-inspector .ck-inspector-pane.ck-inspector-pane_empty{align-items:center;background:var(--ck-inspector-navbox-empty-background);justify-content:center;padding:1em}.ck-inspector .ck-inspector-pane.ck-inspector-pane_empty p{align-self:center;text-align:center;width:100%}.ck-inspector .ck-inspector-pane>.ck-inspector-navbox:last-child{min-width:var(--ck-inspector-explorer-width);width:var(--ck-inspector-explorer-width)}.ck-inspector .ck-inspector-pane.ck-inspector-pane_vsplit>.ck-inspector-navbox:first-child{border-right:1px solid var(--ck-inspector-color-border);flex:1 1 auto;overflow:hidden}.ck-inspector .ck-inspector-pane.ck-inspector-pane_vsplit>.ck-inspector-navbox:first-child .ck-inspector-navbox__navigation{align-items:center}.ck-inspector .ck-inspector-pane.ck-inspector-pane_vsplit>.ck-inspector-navbox:first-child .ck-inspector-tree__config label{margin:0 .5em}:is(.ck-inspector .ck-inspector-pane.ck-inspector-pane_vsplit>.ck-inspector-navbox:first-child .ck-inspector-tree__config) input+label{margin-right:1em}", ""]);
        const C = d;
      }, 2551: (i, u, f) => {
        var k = f(6540), d = f(5228), C = f(9982);
        function m(e) {
          for (var t = "https://reactjs.org/docs/error-decoder.html?invariant=" + e, n = 1; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
          return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
        }
        if (!k) throw Error(m(227));
        function b(e, t, n, r, a, p, h, w, W) {
          var V = Array.prototype.slice.call(arguments, 3);
          try {
            t.apply(n, V);
          } catch (ce) {
            this.onError(ce);
          }
        }
        var v = !1, N = null, R = !1, D = null, L = { onError: function(e) {
          v = !0, N = e;
        } };
        function se(e, t, n, r, a, p, h, w, W) {
          v = !1, N = null, b.apply(L, arguments);
        }
        var J = null, M = null, F = null;
        function B(e, t, n) {
          var r = e.type || "unknown-event";
          e.currentTarget = F(n), (function(a, p, h, w, W, V, ce, Me, Ve) {
            if (se.apply(this, arguments), v) {
              if (!v) throw Error(m(198));
              var ot = N;
              v = !1, N = null, R || (R = !0, D = ot);
            }
          })(r, t, void 0, e), e.currentTarget = null;
        }
        var ne = null, pe = {};
        function oe() {
          if (ne) for (var e in pe) {
            var t = pe[e], n = ne.indexOf(e);
            if (!(-1 < n)) throw Error(m(96, e));
            if (!ge[n]) {
              if (!t.extractEvents) throw Error(m(97, e));
              for (var r in ge[n] = t, n = t.eventTypes) {
                var a = void 0, p = n[r], h = t, w = r;
                if (S.hasOwnProperty(w)) throw Error(m(99, w));
                S[w] = p;
                var W = p.phasedRegistrationNames;
                if (W) {
                  for (a in W) W.hasOwnProperty(a) && fe(W[a], h, w);
                  a = !0;
                } else p.registrationName ? (fe(p.registrationName, h, w), a = !0) : a = !1;
                if (!a) throw Error(m(98, r, e));
              }
            }
          }
        }
        function fe(e, t, n) {
          if (j[e]) throw Error(m(100, e));
          j[e] = t, A[e] = t.eventTypes[n].dependencies;
        }
        var ge = [], S = {}, j = {}, A = {};
        function ae(e) {
          var t, n = !1;
          for (t in e) if (e.hasOwnProperty(t)) {
            var r = e[t];
            if (!pe.hasOwnProperty(t) || pe[t] !== r) {
              if (pe[t]) throw Error(m(102, t));
              pe[t] = r, n = !0;
            }
          }
          n && oe();
        }
        var G = !(typeof window > "u" || window.document === void 0 || window.document.createElement === void 0), Ee = null, Z = null, U = null;
        function X(e) {
          if (e = M(e)) {
            if (typeof Ee != "function") throw Error(m(280));
            var t = e.stateNode;
            t && (t = J(t), Ee(e.stateNode, e.type, t));
          }
        }
        function le(e) {
          Z ? U ? U.push(e) : U = [e] : Z = e;
        }
        function me() {
          if (Z) {
            var e = Z, t = U;
            if (U = Z = null, X(e), t) for (e = 0; e < t.length; e++) X(t[e]);
          }
        }
        function ke(e, t) {
          return e(t);
        }
        function Ne(e, t, n, r, a) {
          return e(t, n, r, a);
        }
        function Ue() {
        }
        var Ae = ke, Le = !1, Ke = !1;
        function Je() {
          Z === null && U === null || (Ue(), me());
        }
        function ye(e, t, n) {
          if (Ke) return e(t, n);
          Ke = !0;
          try {
            return Ae(e, t, n);
          } finally {
            Ke = !1, Je();
          }
        }
        var P = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, ee = Object.prototype.hasOwnProperty, we = {}, Se = {};
        function Pe(e, t, n, r, a, p) {
          this.acceptsBooleans = t === 2 || t === 3 || t === 4, this.attributeName = r, this.attributeNamespace = a, this.mustUseProperty = n, this.propertyName = e, this.type = t, this.sanitizeURL = p;
        }
        var _e = {};
        "children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(e) {
          _e[e] = new Pe(e, 0, !1, e, null, !1);
        }), [["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(e) {
          var t = e[0];
          _e[t] = new Pe(t, 1, !1, e[1], null, !1);
        }), ["contentEditable", "draggable", "spellCheck", "value"].forEach(function(e) {
          _e[e] = new Pe(e, 2, !1, e.toLowerCase(), null, !1);
        }), ["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(e) {
          _e[e] = new Pe(e, 2, !1, e, null, !1);
        }), "allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(e) {
          _e[e] = new Pe(e, 3, !1, e.toLowerCase(), null, !1);
        }), ["checked", "multiple", "muted", "selected"].forEach(function(e) {
          _e[e] = new Pe(e, 3, !0, e, null, !1);
        }), ["capture", "download"].forEach(function(e) {
          _e[e] = new Pe(e, 4, !1, e, null, !1);
        }), ["cols", "rows", "size", "span"].forEach(function(e) {
          _e[e] = new Pe(e, 6, !1, e, null, !1);
        }), ["rowSpan", "start"].forEach(function(e) {
          _e[e] = new Pe(e, 5, !1, e.toLowerCase(), null, !1);
        });
        var lt = /[\-:]([a-z])/g;
        function Qe(e) {
          return e[1].toUpperCase();
        }
        "accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e) {
          var t = e.replace(lt, Qe);
          _e[t] = new Pe(t, 1, !1, e, null, !1);
        }), "xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e) {
          var t = e.replace(lt, Qe);
          _e[t] = new Pe(t, 1, !1, e, "http://www.w3.org/1999/xlink", !1);
        }), ["xml:base", "xml:lang", "xml:space"].forEach(function(e) {
          var t = e.replace(lt, Qe);
          _e[t] = new Pe(t, 1, !1, e, "http://www.w3.org/XML/1998/namespace", !1);
        }), ["tabIndex", "crossOrigin"].forEach(function(e) {
          _e[e] = new Pe(e, 1, !1, e.toLowerCase(), null, !1);
        }), _e.xlinkHref = new Pe("xlinkHref", 1, !1, "xlink:href", "http://www.w3.org/1999/xlink", !0), ["src", "href", "action", "formAction"].forEach(function(e) {
          _e[e] = new Pe(e, 1, !1, e.toLowerCase(), null, !0);
        });
        var et = k.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
        function Pt(e, t, n, r) {
          var a = _e.hasOwnProperty(t) ? _e[t] : null;
          (a !== null ? a.type === 0 : !r && 2 < t.length && (t[0] === "o" || t[0] === "O") && (t[1] === "n" || t[1] === "N")) || ((function(p, h, w, W) {
            if (h == null || (function(V, ce, Me, Ve) {
              if (Me !== null && Me.type === 0) return !1;
              switch (typeof ce) {
                case "function":
                case "symbol":
                  return !0;
                case "boolean":
                  return !Ve && (Me !== null ? !Me.acceptsBooleans : (V = V.toLowerCase().slice(0, 5)) !== "data-" && V !== "aria-");
                default:
                  return !1;
              }
            })(p, h, w, W)) return !0;
            if (W) return !1;
            if (w !== null) switch (w.type) {
              case 3:
                return !h;
              case 4:
                return h === !1;
              case 5:
                return isNaN(h);
              case 6:
                return isNaN(h) || 1 > h;
            }
            return !1;
          })(t, n, a, r) && (n = null), r || a === null ? (function(p) {
            return !!ee.call(Se, p) || !ee.call(we, p) && (P.test(p) ? Se[p] = !0 : (we[p] = !0, !1));
          })(t) && (n === null ? e.removeAttribute(t) : e.setAttribute(t, "" + n)) : a.mustUseProperty ? e[a.propertyName] = n === null ? a.type !== 3 && "" : n : (t = a.attributeName, r = a.attributeNamespace, n === null ? e.removeAttribute(t) : (n = (a = a.type) === 3 || a === 4 && n === !0 ? "" : "" + n, r ? e.setAttributeNS(r, t, n) : e.setAttribute(t, n))));
        }
        et.hasOwnProperty("ReactCurrentDispatcher") || (et.ReactCurrentDispatcher = { current: null }), et.hasOwnProperty("ReactCurrentBatchConfig") || (et.ReactCurrentBatchConfig = { suspense: null });
        var ko = /^(.*)[\\\/]/, Dt = typeof Symbol == "function" && Symbol.for, Gt = Dt ? Symbol.for("react.element") : 60103, On = Dt ? Symbol.for("react.portal") : 60106, Nn = Dt ? Symbol.for("react.fragment") : 60107, wo = Dt ? Symbol.for("react.strict_mode") : 60108, Hn = Dt ? Symbol.for("react.profiler") : 60114, $n = Dt ? Symbol.for("react.provider") : 60109, an = Dt ? Symbol.for("react.context") : 60110, pn = Dt ? Symbol.for("react.concurrent_mode") : 60111, sr = Dt ? Symbol.for("react.forward_ref") : 60112, Bt = Dt ? Symbol.for("react.suspense") : 60113, $r = Dt ? Symbol.for("react.suspense_list") : 60120, Wr = Dt ? Symbol.for("react.memo") : 60115, _o = Dt ? Symbol.for("react.lazy") : 60116, Eo = Dt ? Symbol.for("react.block") : 60121, xo = typeof Symbol == "function" && Symbol.iterator;
        function Wn(e) {
          return e === null || typeof e != "object" ? null : typeof (e = xo && e[xo] || e["@@iterator"]) == "function" ? e : null;
        }
        function Kt(e) {
          if (e == null) return null;
          if (typeof e == "function") return e.displayName || e.name || null;
          if (typeof e == "string") return e;
          switch (e) {
            case Nn:
              return "Fragment";
            case On:
              return "Portal";
            case Hn:
              return "Profiler";
            case wo:
              return "StrictMode";
            case Bt:
              return "Suspense";
            case $r:
              return "SuspenseList";
          }
          if (typeof e == "object") switch (e.$$typeof) {
            case an:
              return "Context.Consumer";
            case $n:
              return "Context.Provider";
            case sr:
              var t = e.render;
              return t = t.displayName || t.name || "", e.displayName || (t !== "" ? "ForwardRef(" + t + ")" : "ForwardRef");
            case Wr:
              return Kt(e.type);
            case Eo:
              return Kt(e.render);
            case _o:
              if (e = e._status === 1 ? e._result : null) return Kt(e);
          }
          return null;
        }
        function zt(e) {
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
                var r = e._debugOwner, a = e._debugSource, p = Kt(e.type);
                n = null, r && (n = Kt(r.type)), r = p, p = "", a ? p = " (at " + a.fileName.replace(ko, "") + ":" + a.lineNumber + ")" : n && (p = " (created by " + n + ")"), n = `
    in ` + (r || "Unknown") + p;
            }
            t += n, e = e.return;
          } while (e);
          return t;
        }
        function Ye(e) {
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
        function Pn(e) {
          var t = e.type;
          return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
        }
        function qn(e) {
          e._valueTracker || (e._valueTracker = (function(t) {
            var n = Pn(t) ? "checked" : "value", r = Object.getOwnPropertyDescriptor(t.constructor.prototype, n), a = "" + t[n];
            if (!t.hasOwnProperty(n) && r !== void 0 && typeof r.get == "function" && typeof r.set == "function") {
              var p = r.get, h = r.set;
              return Object.defineProperty(t, n, { configurable: !0, get: function() {
                return p.call(this);
              }, set: function(w) {
                a = "" + w, h.call(this, w);
              } }), Object.defineProperty(t, n, { enumerable: r.enumerable }), { getValue: function() {
                return a;
              }, setValue: function(w) {
                a = "" + w;
              }, stopTracking: function() {
                t._valueTracker = null, delete t[n];
              } };
            }
          })(e));
        }
        function sn(e) {
          if (!e) return !1;
          var t = e._valueTracker;
          if (!t) return !0;
          var n = t.getValue(), r = "";
          return e && (r = Pn(e) ? e.checked ? "true" : "false" : e.value), (e = r) !== n && (t.setValue(e), !0);
        }
        function qr(e, t) {
          var n = t.checked;
          return d({}, t, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: n ?? e._wrapperState.initialChecked });
        }
        function Tr(e, t) {
          var n = t.defaultValue == null ? "" : t.defaultValue, r = t.checked != null ? t.checked : t.defaultChecked;
          n = Ye(t.value != null ? t.value : n), e._wrapperState = { initialChecked: r, initialValue: n, controlled: t.type === "checkbox" || t.type === "radio" ? t.checked != null : t.value != null };
        }
        function fn(e, t) {
          (t = t.checked) != null && Pt(e, "checked", t, !1);
        }
        function pt(e, t) {
          fn(e, t);
          var n = Ye(t.value), r = t.type;
          if (n != null) r === "number" ? (n === 0 && e.value === "" || e.value != n) && (e.value = "" + n) : e.value !== "" + n && (e.value = "" + n);
          else if (r === "submit" || r === "reset") return void e.removeAttribute("value");
          t.hasOwnProperty("value") ? So(e, t.type, n) : t.hasOwnProperty("defaultValue") && So(e, t.type, Ye(t.defaultValue)), t.checked == null && t.defaultChecked != null && (e.defaultChecked = !!t.defaultChecked);
        }
        function Kr(e, t, n) {
          if (t.hasOwnProperty("value") || t.hasOwnProperty("defaultValue")) {
            var r = t.type;
            if (!(r !== "submit" && r !== "reset" || t.value !== void 0 && t.value !== null)) return;
            t = "" + e._wrapperState.initialValue, n || t === e.value || (e.value = t), e.defaultValue = t;
          }
          (n = e.name) !== "" && (e.name = ""), e.defaultChecked = !!e._wrapperState.initialChecked, n !== "" && (e.name = n);
        }
        function So(e, t, n) {
          t === "number" && e.ownerDocument.activeElement === e || (n == null ? e.defaultValue = "" + e._wrapperState.initialValue : e.defaultValue !== "" + n && (e.defaultValue = "" + n));
        }
        function Or(e, t) {
          return e = d({ children: void 0 }, t), (t = (function(n) {
            var r = "";
            return k.Children.forEach(n, function(a) {
              a != null && (r += a);
            }), r;
          })(t.children)) && (e.children = t), e;
        }
        function Dn(e, t, n, r) {
          if (e = e.options, t) {
            t = {};
            for (var a = 0; a < n.length; a++) t["$" + n[a]] = !0;
            for (n = 0; n < e.length; n++) a = t.hasOwnProperty("$" + e[n].value), e[n].selected !== a && (e[n].selected = a), a && r && (e[n].defaultSelected = !0);
          } else {
            for (n = "" + Ye(n), t = null, a = 0; a < e.length; a++) {
              if (e[a].value === n) return e[a].selected = !0, void (r && (e[a].defaultSelected = !0));
              t !== null || e[a].disabled || (t = e[a]);
            }
            t !== null && (t.selected = !0);
          }
        }
        function Nr(e, t) {
          if (t.dangerouslySetInnerHTML != null) throw Error(m(91));
          return d({}, t, { value: void 0, defaultValue: void 0, children: "" + e._wrapperState.initialValue });
        }
        function lr(e, t) {
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
          e._wrapperState = { initialValue: Ye(n) };
        }
        function Rn(e, t) {
          var n = Ye(t.value), r = Ye(t.defaultValue);
          n != null && ((n = "" + n) !== e.value && (e.value = n), t.defaultValue == null && e.defaultValue !== n && (e.defaultValue = n)), r != null && (e.defaultValue = "" + r);
        }
        function Co(e) {
          var t = e.textContent;
          t === e._wrapperState.initialValue && t !== "" && t !== null && (e.value = t);
        }
        var hn = "http://www.w3.org/1999/xhtml", gi = "http://www.w3.org/2000/svg";
        function mn(e) {
          switch (e) {
            case "svg":
              return "http://www.w3.org/2000/svg";
            case "math":
              return "http://www.w3.org/1998/Math/MathML";
            default:
              return "http://www.w3.org/1999/xhtml";
          }
        }
        function Qr(e, t) {
          return e == null || e === "http://www.w3.org/1999/xhtml" ? mn(t) : e === "http://www.w3.org/2000/svg" && t === "foreignObject" ? "http://www.w3.org/1999/xhtml" : e;
        }
        var gn, ct, Pr = (ct = function(e, t) {
          if (e.namespaceURI !== gi || "innerHTML" in e) e.innerHTML = t;
          else {
            for ((gn = gn || document.createElement("div")).innerHTML = "<svg>" + t.valueOf().toString() + "</svg>", t = gn.firstChild; e.firstChild; ) e.removeChild(e.firstChild);
            for (; t.firstChild; ) e.appendChild(t.firstChild);
          }
        }, typeof MSApp < "u" && MSApp.execUnsafeLocalFunction ? function(e, t, n, r) {
          MSApp.execUnsafeLocalFunction(function() {
            return ct(e, t);
          });
        } : ct);
        function Kn(e, t) {
          if (t) {
            var n = e.firstChild;
            if (n && n === e.lastChild && n.nodeType === 3) return void (n.nodeValue = t);
          }
          e.textContent = t;
        }
        function cr(e, t) {
          var n = {};
          return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
        }
        var Qn = { animationend: cr("Animation", "AnimationEnd"), animationiteration: cr("Animation", "AnimationIteration"), animationstart: cr("Animation", "AnimationStart"), transitionend: cr("Transition", "TransitionEnd") }, Mn = {}, Dr = {};
        function Rr(e) {
          if (Mn[e]) return Mn[e];
          if (!Qn[e]) return e;
          var t, n = Qn[e];
          for (t in n) if (n.hasOwnProperty(t) && t in Dr) return Mn[e] = n[t];
          return e;
        }
        G && (Dr = document.createElement("div").style, "AnimationEvent" in window || (delete Qn.animationend.animation, delete Qn.animationiteration.animation, delete Qn.animationstart.animation), "TransitionEvent" in window || delete Qn.transitionend.transition);
        var I = Rr("animationend"), Q = Rr("animationiteration"), be = Rr("animationstart"), De = Rr("transitionend"), tt = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), Be = new (typeof WeakMap == "function" ? WeakMap : Map)();
        function Ge(e) {
          var t = Be.get(e);
          return t === void 0 && (t = /* @__PURE__ */ new Map(), Be.set(e, t)), t;
        }
        function rt(e) {
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
        function At(e) {
          if (e.tag === 13) {
            var t = e.memoizedState;
            if (t === null && (e = e.alternate) !== null && (t = e.memoizedState), t !== null) return t.dehydrated;
          }
          return null;
        }
        function ft(e) {
          if (rt(e) !== e) throw Error(m(188));
        }
        function ht(e) {
          if (e = (function(n) {
            var r = n.alternate;
            if (!r) {
              if ((r = rt(n)) === null) throw Error(m(188));
              return r !== n ? null : n;
            }
            for (var a = n, p = r; ; ) {
              var h = a.return;
              if (h === null) break;
              var w = h.alternate;
              if (w === null) {
                if ((p = h.return) !== null) {
                  a = p;
                  continue;
                }
                break;
              }
              if (h.child === w.child) {
                for (w = h.child; w; ) {
                  if (w === a) return ft(h), n;
                  if (w === p) return ft(h), r;
                  w = w.sibling;
                }
                throw Error(m(188));
              }
              if (a.return !== p.return) a = h, p = w;
              else {
                for (var W = !1, V = h.child; V; ) {
                  if (V === a) {
                    W = !0, a = h, p = w;
                    break;
                  }
                  if (V === p) {
                    W = !0, p = h, a = w;
                    break;
                  }
                  V = V.sibling;
                }
                if (!W) {
                  for (V = w.child; V; ) {
                    if (V === a) {
                      W = !0, a = w, p = h;
                      break;
                    }
                    if (V === p) {
                      W = !0, p = w, a = h;
                      break;
                    }
                    V = V.sibling;
                  }
                  if (!W) throw Error(m(189));
                }
              }
              if (a.alternate !== p) throw Error(m(190));
            }
            if (a.tag !== 3) throw Error(m(188));
            return a.stateNode.current === a ? n : r;
          })(e), !e) return null;
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
        function kt(e, t) {
          if (t == null) throw Error(m(30));
          return e == null ? t : Array.isArray(e) ? Array.isArray(t) ? (e.push.apply(e, t), e) : (e.push(t), e) : Array.isArray(t) ? [e].concat(t) : [e, t];
        }
        function jt(e, t, n) {
          Array.isArray(e) ? e.forEach(t, n) : e && t.call(n, e);
        }
        var yt = null;
        function bt(e) {
          if (e) {
            var t = e._dispatchListeners, n = e._dispatchInstances;
            if (Array.isArray(t)) for (var r = 0; r < t.length && !e.isPropagationStopped(); r++) B(e, t[r], n[r]);
            else t && B(e, t, n);
            e._dispatchListeners = null, e._dispatchInstances = null, e.isPersistent() || e.constructor.release(e);
          }
        }
        function yn(e) {
          if (e !== null && (yt = kt(yt, e)), e = yt, yt = null, e) {
            if (jt(e, bt), yt) throw Error(m(95));
            if (R) throw e = D, R = !1, D = null, e;
          }
        }
        function ur(e) {
          return (e = e.target || e.srcElement || window).correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
        }
        function In(e) {
          if (!G) return !1;
          var t = (e = "on" + e) in document;
          return t || ((t = document.createElement("div")).setAttribute(e, "return;"), t = typeof t[e] == "function"), t;
        }
        var bn = [];
        function Yr(e) {
          e.topLevelType = null, e.nativeEvent = null, e.targetInst = null, e.ancestors.length = 0, 10 > bn.length && bn.push(e);
        }
        function To(e, t, n, r) {
          if (bn.length) {
            var a = bn.pop();
            return a.topLevelType = e, a.eventSystemFlags = r, a.nativeEvent = t, a.targetInst = n, a;
          }
          return { topLevelType: e, eventSystemFlags: r, nativeEvent: t, targetInst: n, ancestors: [] };
        }
        function Oo(e) {
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
            (t = n.tag) !== 5 && t !== 6 || e.ancestors.push(n), n = to(r);
          } while (n);
          for (n = 0; n < e.ancestors.length; n++) {
            t = e.ancestors[n];
            var a = ur(e.nativeEvent);
            r = e.topLevelType;
            var p = e.nativeEvent, h = e.eventSystemFlags;
            n === 0 && (h |= 64);
            for (var w = null, W = 0; W < ge.length; W++) {
              var V = ge[W];
              V && (V = V.extractEvents(r, t, p, a, h)) && (w = kt(w, V));
            }
            yn(w);
          }
        }
        function nt(e, t, n) {
          if (!n.has(e)) {
            switch (e) {
              case "scroll":
                Qt(t, "scroll", !0);
                break;
              case "focus":
              case "blur":
                Qt(t, "focus", !0), Qt(t, "blur", !0), n.set("blur", null), n.set("focus", null);
                break;
              case "cancel":
              case "close":
                In(e) && Qt(t, e, !0);
                break;
              case "invalid":
              case "submit":
              case "reset":
                break;
              default:
                tt.indexOf(e) === -1 && gt(e, t);
            }
            n.set(e, null);
          }
        }
        var Ze, Yn, vn, dr = !1, ut = [], wt = null, Tt = null, Lt = null, kn = /* @__PURE__ */ new Map(), zn = /* @__PURE__ */ new Map(), wn = [], ln = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput close cancel copy cut paste click change contextmenu reset submit".split(" "), Xr = "focus blur dragenter dragleave mouseover mouseout pointerover pointerout gotpointercapture lostpointercapture".split(" ");
        function pr(e, t, n, r, a) {
          return { blockedOn: e, topLevelType: t, eventSystemFlags: 32 | n, nativeEvent: a, container: r };
        }
        function Xn(e, t) {
          switch (e) {
            case "focus":
            case "blur":
              wt = null;
              break;
            case "dragenter":
            case "dragleave":
              Tt = null;
              break;
            case "mouseover":
            case "mouseout":
              Lt = null;
              break;
            case "pointerover":
            case "pointerout":
              kn.delete(t.pointerId);
              break;
            case "gotpointercapture":
            case "lostpointercapture":
              zn.delete(t.pointerId);
          }
        }
        function _n(e, t, n, r, a, p) {
          return e === null || e.nativeEvent !== p ? (e = pr(t, n, r, a, p), t !== null && (t = kr(t)) !== null && Yn(t), e) : (e.eventSystemFlags |= r, e);
        }
        function Mr(e) {
          var t = to(e.target);
          if (t !== null) {
            var n = rt(t);
            if (n !== null) {
              if ((t = n.tag) === 13) {
                if ((t = At(n)) !== null) return e.blockedOn = t, void C.unstable_runWithPriority(e.priority, function() {
                  vn(n);
                });
              } else if (t === 3 && n.stateNode.hydrate) return void (e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null);
            }
          }
          e.blockedOn = null;
        }
        function fr(e) {
          if (e.blockedOn !== null) return !1;
          var t = mr(e.topLevelType, e.eventSystemFlags, e.container, e.nativeEvent);
          if (t !== null) {
            var n = kr(t);
            return n !== null && Yn(n), e.blockedOn = t, !1;
          }
          return !0;
        }
        function hr(e, t, n) {
          fr(e) && n.delete(t);
        }
        function Ir() {
          for (dr = !1; 0 < ut.length; ) {
            var e = ut[0];
            if (e.blockedOn !== null) {
              (e = kr(e.blockedOn)) !== null && Ze(e);
              break;
            }
            var t = mr(e.topLevelType, e.eventSystemFlags, e.container, e.nativeEvent);
            t !== null ? e.blockedOn = t : ut.shift();
          }
          wt !== null && fr(wt) && (wt = null), Tt !== null && fr(Tt) && (Tt = null), Lt !== null && fr(Lt) && (Lt = null), kn.forEach(hr), zn.forEach(hr);
        }
        function Gr(e, t) {
          e.blockedOn === t && (e.blockedOn = null, dr || (dr = !0, C.unstable_scheduleCallback(C.unstable_NormalPriority, Ir)));
        }
        function yi(e) {
          function t(a) {
            return Gr(a, e);
          }
          if (0 < ut.length) {
            Gr(ut[0], e);
            for (var n = 1; n < ut.length; n++) {
              var r = ut[n];
              r.blockedOn === e && (r.blockedOn = null);
            }
          }
          for (wt !== null && Gr(wt, e), Tt !== null && Gr(Tt, e), Lt !== null && Gr(Lt, e), kn.forEach(t), zn.forEach(t), n = 0; n < wn.length; n++) (r = wn[n]).blockedOn === e && (r.blockedOn = null);
          for (; 0 < wn.length && (n = wn[0]).blockedOn === null; ) Mr(n), n.blockedOn === null && wn.shift();
        }
        var ta = {}, bi = /* @__PURE__ */ new Map(), vi = /* @__PURE__ */ new Map(), os = ["abort", "abort", I, "animationEnd", Q, "animationIteration", be, "animationStart", "canplay", "canPlay", "canplaythrough", "canPlayThrough", "durationchange", "durationChange", "emptied", "emptied", "encrypted", "encrypted", "ended", "ended", "error", "error", "gotpointercapture", "gotPointerCapture", "load", "load", "loadeddata", "loadedData", "loadedmetadata", "loadedMetadata", "loadstart", "loadStart", "lostpointercapture", "lostPointerCapture", "playing", "playing", "progress", "progress", "seeking", "seeking", "stalled", "stalled", "suspend", "suspend", "timeupdate", "timeUpdate", De, "transitionEnd", "waiting", "waiting"];
        function ki(e, t) {
          for (var n = 0; n < e.length; n += 2) {
            var r = e[n], a = e[n + 1], p = "on" + (a[0].toUpperCase() + a.slice(1));
            p = { phasedRegistrationNames: { bubbled: p, captured: p + "Capture" }, dependencies: [r], eventPriority: t }, vi.set(r, t), bi.set(r, p), ta[a] = p;
          }
        }
        ki("blur blur cancel cancel click click close close contextmenu contextMenu copy copy cut cut auxclick auxClick dblclick doubleClick dragend dragEnd dragstart dragStart drop drop focus focus input input invalid invalid keydown keyDown keypress keyPress keyup keyUp mousedown mouseDown mouseup mouseUp paste paste pause pause play play pointercancel pointerCancel pointerdown pointerDown pointerup pointerUp ratechange rateChange reset reset seeked seeked submit submit touchcancel touchCancel touchend touchEnd touchstart touchStart volumechange volumeChange".split(" "), 0), ki("drag drag dragenter dragEnter dragexit dragExit dragleave dragLeave dragover dragOver mousemove mouseMove mouseout mouseOut mouseover mouseOver pointermove pointerMove pointerout pointerOut pointerover pointerOver scroll scroll toggle toggle touchmove touchMove wheel wheel".split(" "), 1), ki(os, 2);
        for (var No = "change selectionchange textInput compositionstart compositionend compositionupdate".split(" "), wi = 0; wi < No.length; wi++) vi.set(No[wi], 0);
        var is = C.unstable_UserBlockingPriority, as = C.unstable_runWithPriority, An = !0;
        function gt(e, t) {
          Qt(t, e, !1);
        }
        function Qt(e, t, n) {
          var r = vi.get(t);
          switch (r === void 0 ? 2 : r) {
            case 0:
              r = ss.bind(null, t, 1, e);
              break;
            case 1:
              r = Jo.bind(null, t, 1, e);
              break;
            default:
              r = Po.bind(null, t, 1, e);
          }
          n ? e.addEventListener(t, r, !0) : e.addEventListener(t, r, !1);
        }
        function ss(e, t, n, r) {
          Le || Ue();
          var a = Po, p = Le;
          Le = !0;
          try {
            Ne(a, e, t, n, r);
          } finally {
            (Le = p) || Je();
          }
        }
        function Jo(e, t, n, r) {
          as(is, Po.bind(null, e, t, n, r));
        }
        function Po(e, t, n, r) {
          if (An) if (0 < ut.length && -1 < ln.indexOf(e)) e = pr(null, e, t, n, r), ut.push(e);
          else {
            var a = mr(e, t, n, r);
            if (a === null) Xn(e, r);
            else if (-1 < ln.indexOf(e)) e = pr(a, e, t, n, r), ut.push(e);
            else if (!(function(p, h, w, W, V) {
              switch (h) {
                case "focus":
                  return wt = _n(wt, p, h, w, W, V), !0;
                case "dragenter":
                  return Tt = _n(Tt, p, h, w, W, V), !0;
                case "mouseover":
                  return Lt = _n(Lt, p, h, w, W, V), !0;
                case "pointerover":
                  var ce = V.pointerId;
                  return kn.set(ce, _n(kn.get(ce) || null, p, h, w, W, V)), !0;
                case "gotpointercapture":
                  return ce = V.pointerId, zn.set(ce, _n(zn.get(ce) || null, p, h, w, W, V)), !0;
              }
              return !1;
            })(a, e, t, n, r)) {
              Xn(e, r), e = To(e, r, null, t);
              try {
                ye(Oo, e);
              } finally {
                Yr(e);
              }
            }
          }
        }
        function mr(e, t, n, r) {
          if ((n = to(n = ur(r))) !== null) {
            var a = rt(n);
            if (a === null) n = null;
            else {
              var p = a.tag;
              if (p === 13) {
                if ((n = At(a)) !== null) return n;
                n = null;
              } else if (p === 3) {
                if (a.stateNode.hydrate) return a.tag === 3 ? a.stateNode.containerInfo : null;
                n = null;
              } else a !== n && (n = null);
            }
          }
          e = To(e, r, n, t);
          try {
            ye(Oo, e);
          } finally {
            Yr(e);
          }
          return null;
        }
        var gr = { animationIterationCount: !0, borderImageOutset: !0, borderImageSlice: !0, borderImageWidth: !0, boxFlex: !0, boxFlexGroup: !0, boxOrdinalGroup: !0, columnCount: !0, columns: !0, flex: !0, flexGrow: !0, flexPositive: !0, flexShrink: !0, flexNegative: !0, flexOrder: !0, gridArea: !0, gridRow: !0, gridRowEnd: !0, gridRowSpan: !0, gridRowStart: !0, gridColumn: !0, gridColumnEnd: !0, gridColumnSpan: !0, gridColumnStart: !0, fontWeight: !0, lineClamp: !0, lineHeight: !0, opacity: !0, order: !0, orphans: !0, tabSize: !0, widows: !0, zIndex: !0, zoom: !0, fillOpacity: !0, floodOpacity: !0, stopOpacity: !0, strokeDasharray: !0, strokeDashoffset: !0, strokeMiterlimit: !0, strokeOpacity: !0, strokeWidth: !0 }, na = ["Webkit", "ms", "Moz", "O"];
        function _t(e, t, n) {
          return t == null || typeof t == "boolean" || t === "" ? "" : n || typeof t != "number" || t === 0 || gr.hasOwnProperty(e) && gr[e] ? ("" + t).trim() : t + "px";
        }
        function ei(e, t) {
          for (var n in e = e.style, t) if (t.hasOwnProperty(n)) {
            var r = n.indexOf("--") === 0, a = _t(n, t[n], r);
            n === "float" && (n = "cssFloat"), r ? e.setProperty(n, a) : e[n] = a;
          }
        }
        Object.keys(gr).forEach(function(e) {
          na.forEach(function(t) {
            t = t + e.charAt(0).toUpperCase() + e.substring(1), gr[t] = gr[e];
          });
        });
        var ti = d({ menuitem: !0 }, { area: !0, base: !0, br: !0, col: !0, embed: !0, hr: !0, img: !0, input: !0, keygen: !0, link: !0, meta: !0, param: !0, source: !0, track: !0, wbr: !0 });
        function _i(e, t) {
          if (t) {
            if (ti[e] && (t.children != null || t.dangerouslySetInnerHTML != null)) throw Error(m(137, e, ""));
            if (t.dangerouslySetInnerHTML != null) {
              if (t.children != null) throw Error(m(60));
              if (typeof t.dangerouslySetInnerHTML != "object" || !("__html" in t.dangerouslySetInnerHTML)) throw Error(m(61));
            }
            if (t.style != null && typeof t.style != "object") throw Error(m(62, ""));
          }
        }
        function Ei(e, t) {
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
        var xi = hn;
        function Gn(e, t) {
          var n = Ge(e = e.nodeType === 9 || e.nodeType === 11 ? e : e.ownerDocument);
          t = A[t];
          for (var r = 0; r < t.length; r++) nt(t[r], e, n);
        }
        function Zr() {
        }
        function Zt(e) {
          if ((e = e || (typeof document < "u" ? document : void 0)) === void 0) return null;
          try {
            return e.activeElement || e.body;
          } catch {
            return e.body;
          }
        }
        function ra(e) {
          for (; e && e.firstChild; ) e = e.firstChild;
          return e;
        }
        function oa(e, t) {
          var n, r = ra(e);
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
            r = ra(r);
          }
        }
        function Si(e, t) {
          return !(!e || !t) && (e === t || (!e || e.nodeType !== 3) && (t && t.nodeType === 3 ? Si(e, t.parentNode) : "contains" in e ? e.contains(t) : !!e.compareDocumentPosition && !!(16 & e.compareDocumentPosition(t))));
        }
        function ia() {
          for (var e = window, t = Zt(); t instanceof e.HTMLIFrameElement; ) {
            try {
              var n = typeof t.contentWindow.location.href == "string";
            } catch {
              n = !1;
            }
            if (!n) break;
            t = Zt((e = t.contentWindow).document);
          }
          return t;
        }
        function Ci(e) {
          var t = e && e.nodeName && e.nodeName.toLowerCase();
          return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
        }
        var Jr = "$", eo = "/$", Ti = "$?", yr = "$!", Do = null, Et = null;
        function Yt(e, t) {
          switch (e) {
            case "button":
            case "input":
            case "select":
            case "textarea":
              return !!t.autoFocus;
          }
          return !1;
        }
        function Oi(e, t) {
          return e === "textarea" || e === "option" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
        }
        var Ni = typeof setTimeout == "function" ? setTimeout : void 0, ni = typeof clearTimeout == "function" ? clearTimeout : void 0;
        function zr(e) {
          for (; e != null; e = e.nextSibling) {
            var t = e.nodeType;
            if (t === 1 || t === 3) break;
          }
          return e;
        }
        function Pi(e) {
          e = e.previousSibling;
          for (var t = 0; e; ) {
            if (e.nodeType === 8) {
              var n = e.data;
              if (n === Jr || n === yr || n === Ti) {
                if (t === 0) return e;
                t--;
              } else n === eo && t++;
            }
            e = e.previousSibling;
          }
          return null;
        }
        var br = Math.random().toString(36).slice(2), vr = "__reactInternalInstance$" + br, ri = "__reactEventHandlers$" + br, Ro = "__reactContainere$" + br;
        function to(e) {
          var t = e[vr];
          if (t) return t;
          for (var n = e.parentNode; n; ) {
            if (t = n[Ro] || n[vr]) {
              if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = Pi(e); e !== null; ) {
                if (n = e[vr]) return n;
                e = Pi(e);
              }
              return t;
            }
            n = (e = n).parentNode;
          }
          return null;
        }
        function kr(e) {
          return !(e = e[vr] || e[Ro]) || e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3 ? null : e;
        }
        function Zn(e) {
          if (e.tag === 5 || e.tag === 6) return e.stateNode;
          throw Error(m(33));
        }
        function Di(e) {
          return e[ri] || null;
        }
        function Jn(e) {
          do
            e = e.return;
          while (e && e.tag !== 5);
          return e || null;
        }
        function oi(e, t) {
          var n = e.stateNode;
          if (!n) return null;
          var r = J(n);
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
        function aa(e, t, n) {
          (t = oi(e, n.dispatchConfig.phasedRegistrationNames[t])) && (n._dispatchListeners = kt(n._dispatchListeners, t), n._dispatchInstances = kt(n._dispatchInstances, e));
        }
        function Ri(e) {
          if (e && e.dispatchConfig.phasedRegistrationNames) {
            for (var t = e._targetInst, n = []; t; ) n.push(t), t = Jn(t);
            for (t = n.length; 0 < t--; ) aa(n[t], "captured", e);
            for (t = 0; t < n.length; t++) aa(n[t], "bubbled", e);
          }
        }
        function er(e, t, n) {
          e && n && n.dispatchConfig.registrationName && (t = oi(e, n.dispatchConfig.registrationName)) && (n._dispatchListeners = kt(n._dispatchListeners, t), n._dispatchInstances = kt(n._dispatchInstances, e));
        }
        function Mi(e) {
          e && e.dispatchConfig.registrationName && er(e._targetInst, null, e);
        }
        function Ht(e) {
          jt(e, Ri);
        }
        var tr = null, Ii = null, ii = null;
        function sa() {
          if (ii) return ii;
          var e, t, n = Ii, r = n.length, a = "value" in tr ? tr.value : tr.textContent, p = a.length;
          for (e = 0; e < r && n[e] === a[e]; e++) ;
          var h = r - e;
          for (t = 1; t <= h && n[r - t] === a[p - t]; t++) ;
          return ii = a.slice(e, 1 < t ? 1 - t : void 0);
        }
        function no() {
          return !0;
        }
        function Mo() {
          return !1;
        }
        function Ot(e, t, n, r) {
          for (var a in this.dispatchConfig = e, this._targetInst = t, this.nativeEvent = n, e = this.constructor.Interface) e.hasOwnProperty(a) && ((t = e[a]) ? this[a] = t(n) : a === "target" ? this.target = r : this[a] = n[a]);
          return this.isDefaultPrevented = (n.defaultPrevented != null ? n.defaultPrevented : n.returnValue === !1) ? no : Mo, this.isPropagationStopped = Mo, this;
        }
        function ls(e, t, n, r) {
          if (this.eventPool.length) {
            var a = this.eventPool.pop();
            return this.call(a, e, t, n, r), a;
          }
          return new this(e, t, n, r);
        }
        function cs(e) {
          if (!(e instanceof this)) throw Error(m(279));
          e.destructor(), 10 > this.eventPool.length && this.eventPool.push(e);
        }
        function Io(e) {
          e.eventPool = [], e.getPooled = ls, e.release = cs;
        }
        d(Ot.prototype, { preventDefault: function() {
          this.defaultPrevented = !0;
          var e = this.nativeEvent;
          e && (e.preventDefault ? e.preventDefault() : typeof e.returnValue != "unknown" && (e.returnValue = !1), this.isDefaultPrevented = no);
        }, stopPropagation: function() {
          var e = this.nativeEvent;
          e && (e.stopPropagation ? e.stopPropagation() : typeof e.cancelBubble != "unknown" && (e.cancelBubble = !0), this.isPropagationStopped = no);
        }, persist: function() {
          this.isPersistent = no;
        }, isPersistent: Mo, destructor: function() {
          var e, t = this.constructor.Interface;
          for (e in t) this[e] = null;
          this.nativeEvent = this._targetInst = this.dispatchConfig = null, this.isPropagationStopped = this.isDefaultPrevented = Mo, this._dispatchInstances = this._dispatchListeners = null;
        } }), Ot.Interface = { type: null, target: null, currentTarget: function() {
          return null;
        }, eventPhase: null, bubbles: null, cancelable: null, timeStamp: function(e) {
          return e.timeStamp || Date.now();
        }, defaultPrevented: null, isTrusted: null }, Ot.extend = function(e) {
          function t() {
          }
          function n() {
            return r.apply(this, arguments);
          }
          var r = this;
          t.prototype = r.prototype;
          var a = new t();
          return d(a, n.prototype), n.prototype = a, n.prototype.constructor = n, n.Interface = d({}, r.Interface, e), n.extend = r.extend, Io(n), n;
        }, Io(Ot);
        var us = Ot.extend({ data: null }), ds = Ot.extend({ data: null }), la = [9, 13, 27, 32], zi = G && "CompositionEvent" in window, zo = null;
        G && "documentMode" in document && (zo = document.documentMode);
        var ps = G && "TextEvent" in window && !zo, ca = G && (!zi || zo && 8 < zo && 11 >= zo), ua = " ", nr = { beforeInput: { phasedRegistrationNames: { bubbled: "onBeforeInput", captured: "onBeforeInputCapture" }, dependencies: ["compositionend", "keypress", "textInput", "paste"] }, compositionEnd: { phasedRegistrationNames: { bubbled: "onCompositionEnd", captured: "onCompositionEndCapture" }, dependencies: "blur compositionend keydown keypress keyup mousedown".split(" ") }, compositionStart: { phasedRegistrationNames: { bubbled: "onCompositionStart", captured: "onCompositionStartCapture" }, dependencies: "blur compositionstart keydown keypress keyup mousedown".split(" ") }, compositionUpdate: { phasedRegistrationNames: { bubbled: "onCompositionUpdate", captured: "onCompositionUpdateCapture" }, dependencies: "blur compositionupdate keydown keypress keyup mousedown".split(" ") } }, da = !1;
        function ro(e, t) {
          switch (e) {
            case "keyup":
              return la.indexOf(t.keyCode) !== -1;
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
        function pa(e) {
          return typeof (e = e.detail) == "object" && "data" in e ? e.data : null;
        }
        var oo = !1, ai = { eventTypes: nr, extractEvents: function(e, t, n, r) {
          var a;
          if (zi) e: {
            switch (e) {
              case "compositionstart":
                var p = nr.compositionStart;
                break e;
              case "compositionend":
                p = nr.compositionEnd;
                break e;
              case "compositionupdate":
                p = nr.compositionUpdate;
                break e;
            }
            p = void 0;
          }
          else oo ? ro(e, n) && (p = nr.compositionEnd) : e === "keydown" && n.keyCode === 229 && (p = nr.compositionStart);
          return p ? (ca && n.locale !== "ko" && (oo || p !== nr.compositionStart ? p === nr.compositionEnd && oo && (a = sa()) : (Ii = "value" in (tr = r) ? tr.value : tr.textContent, oo = !0)), p = us.getPooled(p, t, n, r), (a || (a = pa(n)) !== null) && (p.data = a), Ht(p), a = p) : a = null, (e = ps ? (function(h, w) {
            switch (h) {
              case "compositionend":
                return pa(w);
              case "keypress":
                return w.which !== 32 ? null : (da = !0, ua);
              case "textInput":
                return (h = w.data) === ua && da ? null : h;
              default:
                return null;
            }
          })(e, n) : (function(h, w) {
            if (oo) return h === "compositionend" || !zi && ro(h, w) ? (h = sa(), ii = Ii = tr = null, oo = !1, h) : null;
            switch (h) {
              case "paste":
              default:
                return null;
              case "keypress":
                if (!(w.ctrlKey || w.altKey || w.metaKey) || w.ctrlKey && w.altKey) {
                  if (w.char && 1 < w.char.length) return w.char;
                  if (w.which) return String.fromCharCode(w.which);
                }
                return null;
              case "compositionend":
                return ca && w.locale !== "ko" ? null : w.data;
            }
          })(e, n)) ? ((t = ds.getPooled(nr.beforeInput, t, n, r)).data = e, Ht(t)) : t = null, a === null ? t : t === null ? a : [a, t];
        } }, fs = { color: !0, date: !0, datetime: !0, "datetime-local": !0, email: !0, month: !0, number: !0, password: !0, range: !0, search: !0, tel: !0, text: !0, time: !0, url: !0, week: !0 };
        function fa(e) {
          var t = e && e.nodeName && e.nodeName.toLowerCase();
          return t === "input" ? !!fs[e.type] : t === "textarea";
        }
        var ha = { change: { phasedRegistrationNames: { bubbled: "onChange", captured: "onChangeCapture" }, dependencies: "blur change click focus input keydown keyup selectionchange".split(" ") } };
        function ma(e, t, n) {
          return (e = Ot.getPooled(ha.change, e, t, n)).type = "change", le(n), Ht(e), e;
        }
        var io = null, Ao = null;
        function hs(e) {
          yn(e);
        }
        function si(e) {
          if (sn(Zn(e))) return e;
        }
        function ms(e, t) {
          if (e === "change") return t;
        }
        var Ai = !1;
        function ga() {
          io && (io.detachEvent("onpropertychange", ya), Ao = io = null);
        }
        function ya(e) {
          if (e.propertyName === "value" && si(Ao)) if (e = ma(Ao, e, ur(e)), Le) yn(e);
          else {
            Le = !0;
            try {
              ke(hs, e);
            } finally {
              Le = !1, Je();
            }
          }
        }
        function gs(e, t, n) {
          e === "focus" ? (ga(), Ao = n, (io = t).attachEvent("onpropertychange", ya)) : e === "blur" && ga();
        }
        function ys(e) {
          if (e === "selectionchange" || e === "keyup" || e === "keydown") return si(Ao);
        }
        function bs(e, t) {
          if (e === "click") return si(t);
        }
        function vs(e, t) {
          if (e === "input" || e === "change") return si(t);
        }
        G && (Ai = In("input") && (!document.documentMode || 9 < document.documentMode));
        var ks = { eventTypes: ha, _isInputEventSupported: Ai, extractEvents: function(e, t, n, r) {
          var a = t ? Zn(t) : window, p = a.nodeName && a.nodeName.toLowerCase();
          if (p === "select" || p === "input" && a.type === "file") var h = ms;
          else if (fa(a)) if (Ai) h = vs;
          else {
            h = ys;
            var w = gs;
          }
          else (p = a.nodeName) && p.toLowerCase() === "input" && (a.type === "checkbox" || a.type === "radio") && (h = bs);
          if (h && (h = h(e, t))) return ma(h, n, r);
          w && w(e, a, t), e === "blur" && (e = a._wrapperState) && e.controlled && a.type === "number" && So(a, "number", a.value);
        } }, jo = Ot.extend({ view: null, detail: null }), ws = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
        function _s(e) {
          var t = this.nativeEvent;
          return t.getModifierState ? t.getModifierState(e) : !!(e = ws[e]) && !!t[e];
        }
        function Lo() {
          return _s;
        }
        var ba = 0, va = 0, li = !1, ka = !1, Ar = jo.extend({ screenX: null, screenY: null, clientX: null, clientY: null, pageX: null, pageY: null, ctrlKey: null, shiftKey: null, altKey: null, metaKey: null, getModifierState: Lo, button: null, buttons: null, relatedTarget: function(e) {
          return e.relatedTarget || (e.fromElement === e.srcElement ? e.toElement : e.fromElement);
        }, movementX: function(e) {
          if ("movementX" in e) return e.movementX;
          var t = ba;
          return ba = e.screenX, li ? e.type === "mousemove" ? e.screenX - t : 0 : (li = !0, 0);
        }, movementY: function(e) {
          if ("movementY" in e) return e.movementY;
          var t = va;
          return va = e.screenY, ka ? e.type === "mousemove" ? e.screenY - t : 0 : (ka = !0, 0);
        } }), wa = Ar.extend({ pointerId: null, width: null, height: null, pressure: null, tangentialPressure: null, tiltX: null, tiltY: null, twist: null, pointerType: null, isPrimary: null }), jr = { mouseEnter: { registrationName: "onMouseEnter", dependencies: ["mouseout", "mouseover"] }, mouseLeave: { registrationName: "onMouseLeave", dependencies: ["mouseout", "mouseover"] }, pointerEnter: { registrationName: "onPointerEnter", dependencies: ["pointerout", "pointerover"] }, pointerLeave: { registrationName: "onPointerLeave", dependencies: ["pointerout", "pointerover"] } }, Es = { eventTypes: jr, extractEvents: function(e, t, n, r, a) {
          var p = e === "mouseover" || e === "pointerover", h = e === "mouseout" || e === "pointerout";
          if (p && !(32 & a) && (n.relatedTarget || n.fromElement) || !h && !p || (p = r.window === r ? r : (p = r.ownerDocument) ? p.defaultView || p.parentWindow : window, h ? (h = t, (t = (t = n.relatedTarget || n.toElement) ? to(t) : null) !== null && (t !== rt(t) || t.tag !== 5 && t.tag !== 6) && (t = null)) : h = null, h === t)) return null;
          if (e === "mouseout" || e === "mouseover") var w = Ar, W = jr.mouseLeave, V = jr.mouseEnter, ce = "mouse";
          else e !== "pointerout" && e !== "pointerover" || (w = wa, W = jr.pointerLeave, V = jr.pointerEnter, ce = "pointer");
          if (e = h == null ? p : Zn(h), p = t == null ? p : Zn(t), (W = w.getPooled(W, h, n, r)).type = ce + "leave", W.target = e, W.relatedTarget = p, (n = w.getPooled(V, t, n, r)).type = ce + "enter", n.target = p, n.relatedTarget = e, ce = t, (r = h) && ce) e: {
            for (V = ce, h = 0, e = w = r; e; e = Jn(e)) h++;
            for (e = 0, t = V; t; t = Jn(t)) e++;
            for (; 0 < h - e; ) w = Jn(w), h--;
            for (; 0 < e - h; ) V = Jn(V), e--;
            for (; h--; ) {
              if (w === V || w === V.alternate) break e;
              w = Jn(w), V = Jn(V);
            }
            w = null;
          }
          else w = null;
          for (V = w, w = []; r && r !== V && ((h = r.alternate) === null || h !== V); ) w.push(r), r = Jn(r);
          for (r = []; ce && ce !== V && ((h = ce.alternate) === null || h !== V); ) r.push(ce), ce = Jn(ce);
          for (ce = 0; ce < w.length; ce++) er(w[ce], "bubbled", W);
          for (ce = r.length; 0 < ce--; ) er(r[ce], "captured", n);
          return 64 & a ? [W, n] : [W];
        } }, rr = typeof Object.is == "function" ? Object.is : function(e, t) {
          return e === t && (e !== 0 || 1 / e == 1 / t) || e != e && t != t;
        }, xs = Object.prototype.hasOwnProperty;
        function Lr(e, t) {
          if (rr(e, t)) return !0;
          if (typeof e != "object" || e === null || typeof t != "object" || t === null) return !1;
          var n = Object.keys(e), r = Object.keys(t);
          if (n.length !== r.length) return !1;
          for (r = 0; r < n.length; r++) if (!xs.call(t, n[r]) || !rr(e[n[r]], t[n[r]])) return !1;
          return !0;
        }
        var Ss = G && "documentMode" in document && 11 >= document.documentMode, ji = { select: { phasedRegistrationNames: { bubbled: "onSelect", captured: "onSelectCapture" }, dependencies: "blur contextmenu dragend focus keydown keyup mousedown mouseup selectionchange".split(" ") } }, ao = null, Li = null, Fr = null, Fi = !1;
        function _a(e, t) {
          var n = t.window === t ? t.document : t.nodeType === 9 ? t : t.ownerDocument;
          return Fi || ao == null || ao !== Zt(n) ? null : ("selectionStart" in (n = ao) && Ci(n) ? n = { start: n.selectionStart, end: n.selectionEnd } : n = { anchorNode: (n = (n.ownerDocument && n.ownerDocument.defaultView || window).getSelection()).anchorNode, anchorOffset: n.anchorOffset, focusNode: n.focusNode, focusOffset: n.focusOffset }, Fr && Lr(Fr, n) ? null : (Fr = n, (e = Ot.getPooled(ji.select, Li, e, t)).type = "select", e.target = ao, Ht(e), e));
        }
        var Cs = { eventTypes: ji, extractEvents: function(e, t, n, r, a, p) {
          if (!(p = !(a = p || (r.window === r ? r.document : r.nodeType === 9 ? r : r.ownerDocument)))) {
            e: {
              a = Ge(a), p = A.onSelect;
              for (var h = 0; h < p.length; h++) if (!a.has(p[h])) {
                a = !1;
                break e;
              }
              a = !0;
            }
            p = !a;
          }
          if (p) return null;
          switch (a = t ? Zn(t) : window, e) {
            case "focus":
              (fa(a) || a.contentEditable === "true") && (ao = a, Li = t, Fr = null);
              break;
            case "blur":
              Fr = Li = ao = null;
              break;
            case "mousedown":
              Fi = !0;
              break;
            case "contextmenu":
            case "mouseup":
            case "dragend":
              return Fi = !1, _a(n, r);
            case "selectionchange":
              if (Ss) break;
            case "keydown":
            case "keyup":
              return _a(n, r);
          }
          return null;
        } }, Ts = Ot.extend({ animationName: null, elapsedTime: null, pseudoElement: null }), Os = Ot.extend({ clipboardData: function(e) {
          return "clipboardData" in e ? e.clipboardData : window.clipboardData;
        } }), Ns = jo.extend({ relatedTarget: null });
        function ci(e) {
          var t = e.keyCode;
          return "charCode" in e ? (e = e.charCode) === 0 && t === 13 && (e = 13) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
        }
        var Ps = { Esc: "Escape", Spacebar: " ", Left: "ArrowLeft", Up: "ArrowUp", Right: "ArrowRight", Down: "ArrowDown", Del: "Delete", Win: "OS", Menu: "ContextMenu", Apps: "ContextMenu", Scroll: "ScrollLock", MozPrintableKey: "Unidentified" }, Ds = { 8: "Backspace", 9: "Tab", 12: "Clear", 13: "Enter", 16: "Shift", 17: "Control", 18: "Alt", 19: "Pause", 20: "CapsLock", 27: "Escape", 32: " ", 33: "PageUp", 34: "PageDown", 35: "End", 36: "Home", 37: "ArrowLeft", 38: "ArrowUp", 39: "ArrowRight", 40: "ArrowDown", 45: "Insert", 46: "Delete", 112: "F1", 113: "F2", 114: "F3", 115: "F4", 116: "F5", 117: "F6", 118: "F7", 119: "F8", 120: "F9", 121: "F10", 122: "F11", 123: "F12", 144: "NumLock", 145: "ScrollLock", 224: "Meta" }, Ea = jo.extend({ key: function(e) {
          if (e.key) {
            var t = Ps[e.key] || e.key;
            if (t !== "Unidentified") return t;
          }
          return e.type === "keypress" ? (e = ci(e)) === 13 ? "Enter" : String.fromCharCode(e) : e.type === "keydown" || e.type === "keyup" ? Ds[e.keyCode] || "Unidentified" : "";
        }, location: null, ctrlKey: null, shiftKey: null, altKey: null, metaKey: null, repeat: null, locale: null, getModifierState: Lo, charCode: function(e) {
          return e.type === "keypress" ? ci(e) : 0;
        }, keyCode: function(e) {
          return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
        }, which: function(e) {
          return e.type === "keypress" ? ci(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
        } }), He = Ar.extend({ dataTransfer: null }), l = jo.extend({ touches: null, targetTouches: null, changedTouches: null, altKey: null, metaKey: null, ctrlKey: null, shiftKey: null, getModifierState: Lo }), o = Ot.extend({ propertyName: null, elapsedTime: null, pseudoElement: null }), s = Ar.extend({ deltaX: function(e) {
          return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
        }, deltaY: function(e) {
          return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
        }, deltaZ: null, deltaMode: null }), c = { eventTypes: ta, extractEvents: function(e, t, n, r) {
          var a = bi.get(e);
          if (!a) return null;
          switch (e) {
            case "keypress":
              if (ci(n) === 0) return null;
            case "keydown":
            case "keyup":
              e = Ea;
              break;
            case "blur":
            case "focus":
              e = Ns;
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
              e = Ar;
              break;
            case "drag":
            case "dragend":
            case "dragenter":
            case "dragexit":
            case "dragleave":
            case "dragover":
            case "dragstart":
            case "drop":
              e = He;
              break;
            case "touchcancel":
            case "touchend":
            case "touchmove":
            case "touchstart":
              e = l;
              break;
            case I:
            case Q:
            case be:
              e = Ts;
              break;
            case De:
              e = o;
              break;
            case "scroll":
              e = jo;
              break;
            case "wheel":
              e = s;
              break;
            case "copy":
            case "cut":
            case "paste":
              e = Os;
              break;
            case "gotpointercapture":
            case "lostpointercapture":
            case "pointercancel":
            case "pointerdown":
            case "pointermove":
            case "pointerout":
            case "pointerover":
            case "pointerup":
              e = wa;
              break;
            default:
              e = Ot;
          }
          return Ht(t = e.getPooled(a, t, n, r)), t;
        } };
        if (ne) throw Error(m(101));
        ne = Array.prototype.slice.call("ResponderEventPlugin SimpleEventPlugin EnterLeaveEventPlugin ChangeEventPlugin SelectEventPlugin BeforeInputEventPlugin".split(" ")), oe(), J = Di, M = kr, F = Zn, ae({ SimpleEventPlugin: c, EnterLeaveEventPlugin: Es, ChangeEventPlugin: ks, SelectEventPlugin: Cs, BeforeInputEventPlugin: ai });
        var g = [], y = -1;
        function x(e) {
          0 > y || (e.current = g[y], g[y] = null, y--);
        }
        function z(e, t) {
          y++, g[y] = e.current, e.current = t;
        }
        var K = {}, Y = { current: K }, ie = { current: !1 }, ue = K;
        function he(e, t) {
          var n = e.type.contextTypes;
          if (!n) return K;
          var r = e.stateNode;
          if (r && r.__reactInternalMemoizedUnmaskedChildContext === t) return r.__reactInternalMemoizedMaskedChildContext;
          var a, p = {};
          for (a in n) p[a] = t[a];
          return r && ((e = e.stateNode).__reactInternalMemoizedUnmaskedChildContext = t, e.__reactInternalMemoizedMaskedChildContext = p), p;
        }
        function de(e) {
          return (e = e.childContextTypes) != null;
        }
        function Oe() {
          x(ie), x(Y);
        }
        function Ce(e, t, n) {
          if (Y.current !== K) throw Error(m(168));
          z(Y, t), z(ie, n);
        }
        function ze(e, t, n) {
          var r = e.stateNode;
          if (e = t.childContextTypes, typeof r.getChildContext != "function") return n;
          for (var a in r = r.getChildContext()) if (!(a in e)) throw Error(m(108, Kt(t) || "Unknown", a));
          return d({}, n, {}, r);
        }
        function st(e) {
          return e = (e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext || K, ue = Y.current, z(Y, e), z(ie, ie.current), !0;
        }
        function $e(e, t, n) {
          var r = e.stateNode;
          if (!r) throw Error(m(169));
          n ? (e = ze(e, t, ue), r.__reactInternalMemoizedMergedChildContext = e, x(ie), x(Y), z(Y, e)) : x(ie), z(ie, n);
        }
        var je = C.unstable_runWithPriority, dt = C.unstable_scheduleCallback, vt = C.unstable_cancelCallback, $t = C.unstable_requestPaint, xt = C.unstable_now, Rt = C.unstable_getCurrentPriorityLevel, St = C.unstable_ImmediatePriority, mt = C.unstable_UserBlockingPriority, En = C.unstable_NormalPriority, it = C.unstable_LowPriority, xn = C.unstable_IdlePriority, jn = {}, so = C.unstable_shouldYield, Wt = $t !== void 0 ? $t : function() {
        }, Jt = null, en = null, qt = !1, cn = xt(), Nt = 1e4 > cn ? xt : function() {
          return xt() - cn;
        };
        function Ft() {
          switch (Rt()) {
            case St:
              return 99;
            case mt:
              return 98;
            case En:
              return 97;
            case it:
              return 96;
            case xn:
              return 95;
            default:
              throw Error(m(332));
          }
        }
        function un(e) {
          switch (e) {
            case 99:
              return St;
            case 98:
              return mt;
            case 97:
              return En;
            case 96:
              return it;
            case 95:
              return xn;
            default:
              throw Error(m(332));
          }
        }
        function or(e, t) {
          return e = un(e), je(e, t);
        }
        function Ui(e, t, n) {
          return e = un(e), dt(e, t, n);
        }
        function Vi(e) {
          return Jt === null ? (Jt = [e], en = dt(St, xa)) : Jt.push(e), jn;
        }
        function tn() {
          if (en !== null) {
            var e = en;
            en = null, vt(e);
          }
          xa();
        }
        function xa() {
          if (!qt && Jt !== null) {
            qt = !0;
            var e = 0;
            try {
              var t = Jt;
              or(99, function() {
                for (; e < t.length; e++) {
                  var n = t[e];
                  do
                    n = n(!0);
                  while (n !== null);
                }
              }), Jt = null;
            } catch (n) {
              throw Jt !== null && (Jt = Jt.slice(e + 1)), dt(St, tn), n;
            } finally {
              qt = !1;
            }
          }
        }
        function Fo(e, t, n) {
          return 1073741821 - (1 + ((1073741821 - e + t / 10) / (n /= 10) | 0)) * n;
        }
        function nn(e, t) {
          if (e && e.defaultProps) for (var n in t = d({}, t), e = e.defaultProps) t[n] === void 0 && (t[n] = e[n]);
          return t;
        }
        var Ur = { current: null }, Uo = null, wr = null, lo = null;
        function ir() {
          lo = wr = Uo = null;
        }
        function Vo(e) {
          var t = Ur.current;
          x(Ur), e.type._context._currentValue = t;
        }
        function xl(e, t) {
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
        function ui(e, t) {
          Uo = e, lo = wr = null, (e = e.dependencies) !== null && e.firstContext !== null && (e.expirationTime >= t && (Er = !0), e.firstContext = null);
        }
        function Ln(e, t) {
          if (lo !== e && t !== !1 && t !== 0) if (typeof t == "number" && t !== 1073741823 || (lo = e, t = 1073741823), t = { context: e, observedBits: t, next: null }, wr === null) {
            if (Uo === null) throw Error(m(308));
            wr = t, Uo.dependencies = { expirationTime: 0, firstContext: t, responders: null };
          } else wr = wr.next = t;
          return e._currentValue;
        }
        var co = !1;
        function Rs(e) {
          e.updateQueue = { baseState: e.memoizedState, baseQueue: null, shared: { pending: null }, effects: null };
        }
        function Ms(e, t) {
          e = e.updateQueue, t.updateQueue === e && (t.updateQueue = { baseState: e.baseState, baseQueue: e.baseQueue, shared: e.shared, effects: e.effects });
        }
        function uo(e, t) {
          return (e = { expirationTime: e, suspenseConfig: t, tag: 0, payload: null, callback: null, next: null }).next = e;
        }
        function po(e, t) {
          if ((e = e.updateQueue) !== null) {
            var n = (e = e.shared).pending;
            n === null ? t.next = t : (t.next = n.next, n.next = t), e.pending = t;
          }
        }
        function Sl(e, t) {
          var n = e.alternate;
          n !== null && Ms(n, e), (n = (e = e.updateQueue).baseQueue) === null ? (e.baseQueue = t.next = t, t.next = t) : (t.next = n.next, n.next = t);
        }
        function Bi(e, t, n, r) {
          var a = e.updateQueue;
          co = !1;
          var p = a.baseQueue, h = a.shared.pending;
          if (h !== null) {
            if (p !== null) {
              var w = p.next;
              p.next = h.next, h.next = w;
            }
            p = h, a.shared.pending = null, (w = e.alternate) !== null && (w = w.updateQueue) !== null && (w.baseQueue = h);
          }
          if (p !== null) {
            w = p.next;
            var W = a.baseState, V = 0, ce = null, Me = null, Ve = null;
            if (w !== null) for (var ot = w; ; ) {
              if ((h = ot.expirationTime) < r) {
                var Vn = { expirationTime: ot.expirationTime, suspenseConfig: ot.suspenseConfig, tag: ot.tag, payload: ot.payload, callback: ot.callback, next: null };
                Ve === null ? (Me = Ve = Vn, ce = W) : Ve = Ve.next = Vn, h > V && (V = h);
              } else {
                Ve !== null && (Ve = Ve.next = { expirationTime: 1073741823, suspenseConfig: ot.suspenseConfig, tag: ot.tag, payload: ot.payload, callback: ot.callback, next: null }), _c(h, ot.suspenseConfig);
                e: {
                  var on = e, q = ot;
                  switch (h = t, Vn = n, q.tag) {
                    case 1:
                      if (typeof (on = q.payload) == "function") {
                        W = on.call(Vn, W, h);
                        break e;
                      }
                      W = on;
                      break e;
                    case 3:
                      on.effectTag = -4097 & on.effectTag | 64;
                    case 0:
                      if ((h = typeof (on = q.payload) == "function" ? on.call(Vn, W, h) : on) == null) break e;
                      W = d({}, W, h);
                      break e;
                    case 2:
                      co = !0;
                  }
                }
                ot.callback !== null && (e.effectTag |= 32, (h = a.effects) === null ? a.effects = [ot] : h.push(ot));
              }
              if ((ot = ot.next) === null || ot === w) {
                if ((h = a.shared.pending) === null) break;
                ot = p.next = h.next, h.next = w, a.baseQueue = p = h, a.shared.pending = null;
              }
            }
            Ve === null ? ce = W : Ve.next = Me, a.baseState = ce, a.baseQueue = Ve, Ga(V), e.expirationTime = V, e.memoizedState = W;
          }
        }
        function Cl(e, t, n) {
          if (e = t.effects, t.effects = null, e !== null) for (t = 0; t < e.length; t++) {
            var r = e[t], a = r.callback;
            if (a !== null) {
              if (r.callback = null, r = a, a = n, typeof r != "function") throw Error(m(191, r));
              r.call(a);
            }
          }
        }
        var Hi = et.ReactCurrentBatchConfig, Tl = new k.Component().refs;
        function Sa(e, t, n, r) {
          n = (n = n(r, t = e.memoizedState)) == null ? t : d({}, t, n), e.memoizedState = n, e.expirationTime === 0 && (e.updateQueue.baseState = n);
        }
        var Ca = { isMounted: function(e) {
          return !!(e = e._reactInternalFiber) && rt(e) === e;
        }, enqueueSetState: function(e, t, n) {
          e = e._reactInternalFiber;
          var r = Sr(), a = Hi.suspense;
          (a = uo(r = Ko(r, e, a), a)).payload = t, n != null && (a.callback = n), po(e, a), go(e, r);
        }, enqueueReplaceState: function(e, t, n) {
          e = e._reactInternalFiber;
          var r = Sr(), a = Hi.suspense;
          (a = uo(r = Ko(r, e, a), a)).tag = 1, a.payload = t, n != null && (a.callback = n), po(e, a), go(e, r);
        }, enqueueForceUpdate: function(e, t) {
          e = e._reactInternalFiber;
          var n = Sr(), r = Hi.suspense;
          (r = uo(n = Ko(n, e, r), r)).tag = 2, t != null && (r.callback = t), po(e, r), go(e, n);
        } };
        function Ol(e, t, n, r, a, p, h) {
          return typeof (e = e.stateNode).shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, p, h) : !t.prototype || !t.prototype.isPureReactComponent || !Lr(n, r) || !Lr(a, p);
        }
        function Nl(e, t, n) {
          var r = !1, a = K, p = t.contextType;
          return typeof p == "object" && p !== null ? p = Ln(p) : (a = de(t) ? ue : Y.current, p = (r = (r = t.contextTypes) != null) ? he(e, a) : K), t = new t(n, p), e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null, t.updater = Ca, e.stateNode = t, t._reactInternalFiber = e, r && ((e = e.stateNode).__reactInternalMemoizedUnmaskedChildContext = a, e.__reactInternalMemoizedMaskedChildContext = p), t;
        }
        function Pl(e, t, n, r) {
          e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, r), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, r), t.state !== e && Ca.enqueueReplaceState(t, t.state, null);
        }
        function Is(e, t, n, r) {
          var a = e.stateNode;
          a.props = n, a.state = e.memoizedState, a.refs = Tl, Rs(e);
          var p = t.contextType;
          typeof p == "object" && p !== null ? a.context = Ln(p) : (p = de(t) ? ue : Y.current, a.context = he(e, p)), Bi(e, n, a, r), a.state = e.memoizedState, typeof (p = t.getDerivedStateFromProps) == "function" && (Sa(e, t, p, n), a.state = e.memoizedState), typeof t.getDerivedStateFromProps == "function" || typeof a.getSnapshotBeforeUpdate == "function" || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (t = a.state, typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount(), t !== a.state && Ca.enqueueReplaceState(a, a.state, null), Bi(e, n, a, r), a.state = e.memoizedState), typeof a.componentDidMount == "function" && (e.effectTag |= 4);
        }
        var Ta = Array.isArray;
        function $i(e, t, n) {
          if ((e = n.ref) !== null && typeof e != "function" && typeof e != "object") {
            if (n._owner) {
              if (n = n._owner) {
                if (n.tag !== 1) throw Error(m(309));
                var r = n.stateNode;
              }
              if (!r) throw Error(m(147, e));
              var a = "" + e;
              return t !== null && t.ref !== null && typeof t.ref == "function" && t.ref._stringRef === a ? t.ref : (t = function(p) {
                var h = r.refs;
                h === Tl && (h = r.refs = {}), p === null ? delete h[a] : h[a] = p;
              }, t._stringRef = a, t);
            }
            if (typeof e != "string") throw Error(m(284));
            if (!n._owner) throw Error(m(290, e));
          }
          return e;
        }
        function Oa(e, t) {
          if (e.type !== "textarea") throw Error(m(31, Object.prototype.toString.call(t) === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : t, ""));
        }
        function Dl(e) {
          function t(q, H) {
            if (e) {
              var re = q.lastEffect;
              re !== null ? (re.nextEffect = H, q.lastEffect = H) : q.firstEffect = q.lastEffect = H, H.nextEffect = null, H.effectTag = 8;
            }
          }
          function n(q, H) {
            if (!e) return null;
            for (; H !== null; ) t(q, H), H = H.sibling;
            return null;
          }
          function r(q, H) {
            for (q = /* @__PURE__ */ new Map(); H !== null; ) H.key !== null ? q.set(H.key, H) : q.set(H.index, H), H = H.sibling;
            return q;
          }
          function a(q, H) {
            return (q = Go(q, H)).index = 0, q.sibling = null, q;
          }
          function p(q, H, re) {
            return q.index = re, e ? (re = q.alternate) !== null ? (re = re.index) < H ? (q.effectTag = 2, H) : re : (q.effectTag = 2, H) : H;
          }
          function h(q) {
            return e && q.alternate === null && (q.effectTag = 2), q;
          }
          function w(q, H, re, ve) {
            return H === null || H.tag !== 6 ? ((H = ml(re, q.mode, ve)).return = q, H) : ((H = a(H, re)).return = q, H);
          }
          function W(q, H, re, ve) {
            return H !== null && H.elementType === re.type ? ((ve = a(H, re.props)).ref = $i(q, H, re), ve.return = q, ve) : ((ve = Za(re.type, re.key, re.props, null, q.mode, ve)).ref = $i(q, H, re), ve.return = q, ve);
          }
          function V(q, H, re, ve) {
            return H === null || H.tag !== 4 || H.stateNode.containerInfo !== re.containerInfo || H.stateNode.implementation !== re.implementation ? ((H = gl(re, q.mode, ve)).return = q, H) : ((H = a(H, re.children || [])).return = q, H);
          }
          function ce(q, H, re, ve, xe) {
            return H === null || H.tag !== 7 ? ((H = yo(re, q.mode, ve, xe)).return = q, H) : ((H = a(H, re)).return = q, H);
          }
          function Me(q, H, re) {
            if (typeof H == "string" || typeof H == "number") return (H = ml("" + H, q.mode, re)).return = q, H;
            if (typeof H == "object" && H !== null) {
              switch (H.$$typeof) {
                case Gt:
                  return (re = Za(H.type, H.key, H.props, null, q.mode, re)).ref = $i(q, null, H), re.return = q, re;
                case On:
                  return (H = gl(H, q.mode, re)).return = q, H;
              }
              if (Ta(H) || Wn(H)) return (H = yo(H, q.mode, re, null)).return = q, H;
              Oa(q, H);
            }
            return null;
          }
          function Ve(q, H, re, ve) {
            var xe = H !== null ? H.key : null;
            if (typeof re == "string" || typeof re == "number") return xe !== null ? null : w(q, H, "" + re, ve);
            if (typeof re == "object" && re !== null) {
              switch (re.$$typeof) {
                case Gt:
                  return re.key === xe ? re.type === Nn ? ce(q, H, re.props.children, ve, xe) : W(q, H, re, ve) : null;
                case On:
                  return re.key === xe ? V(q, H, re, ve) : null;
              }
              if (Ta(re) || Wn(re)) return xe !== null ? null : ce(q, H, re, ve, null);
              Oa(q, re);
            }
            return null;
          }
          function ot(q, H, re, ve, xe) {
            if (typeof ve == "string" || typeof ve == "number") return w(H, q = q.get(re) || null, "" + ve, xe);
            if (typeof ve == "object" && ve !== null) {
              switch (ve.$$typeof) {
                case Gt:
                  return q = q.get(ve.key === null ? re : ve.key) || null, ve.type === Nn ? ce(H, q, ve.props.children, xe, ve.key) : W(H, q, ve, xe);
                case On:
                  return V(H, q = q.get(ve.key === null ? re : ve.key) || null, ve, xe);
              }
              if (Ta(ve) || Wn(ve)) return ce(H, q = q.get(re) || null, ve, xe, null);
              Oa(H, ve);
            }
            return null;
          }
          function Vn(q, H, re, ve) {
            for (var xe = null, Re = null, Fe = H, at = H = 0, It = null; Fe !== null && at < re.length; at++) {
              Fe.index > at ? (It = Fe, Fe = null) : It = Fe.sibling;
              var Xe = Ve(q, Fe, re[at], ve);
              if (Xe === null) {
                Fe === null && (Fe = It);
                break;
              }
              e && Fe && Xe.alternate === null && t(q, Fe), H = p(Xe, H, at), Re === null ? xe = Xe : Re.sibling = Xe, Re = Xe, Fe = It;
            }
            if (at === re.length) return n(q, Fe), xe;
            if (Fe === null) {
              for (; at < re.length; at++) (Fe = Me(q, re[at], ve)) !== null && (H = p(Fe, H, at), Re === null ? xe = Fe : Re.sibling = Fe, Re = Fe);
              return xe;
            }
            for (Fe = r(q, Fe); at < re.length; at++) (It = ot(Fe, q, at, re[at], ve)) !== null && (e && It.alternate !== null && Fe.delete(It.key === null ? at : It.key), H = p(It, H, at), Re === null ? xe = It : Re.sibling = It, Re = It);
            return e && Fe.forEach(function(bo) {
              return t(q, bo);
            }), xe;
          }
          function on(q, H, re, ve) {
            var xe = Wn(re);
            if (typeof xe != "function") throw Error(m(150));
            if ((re = xe.call(re)) == null) throw Error(m(151));
            for (var Re = xe = null, Fe = H, at = H = 0, It = null, Xe = re.next(); Fe !== null && !Xe.done; at++, Xe = re.next()) {
              Fe.index > at ? (It = Fe, Fe = null) : It = Fe.sibling;
              var bo = Ve(q, Fe, Xe.value, ve);
              if (bo === null) {
                Fe === null && (Fe = It);
                break;
              }
              e && Fe && bo.alternate === null && t(q, Fe), H = p(bo, H, at), Re === null ? xe = bo : Re.sibling = bo, Re = bo, Fe = It;
            }
            if (Xe.done) return n(q, Fe), xe;
            if (Fe === null) {
              for (; !Xe.done; at++, Xe = re.next()) (Xe = Me(q, Xe.value, ve)) !== null && (H = p(Xe, H, at), Re === null ? xe = Xe : Re.sibling = Xe, Re = Xe);
              return xe;
            }
            for (Fe = r(q, Fe); !Xe.done; at++, Xe = re.next()) (Xe = ot(Fe, q, at, Xe.value, ve)) !== null && (e && Xe.alternate !== null && Fe.delete(Xe.key === null ? at : Xe.key), H = p(Xe, H, at), Re === null ? xe = Xe : Re.sibling = Xe, Re = Xe);
            return e && Fe.forEach(function(iu) {
              return t(q, iu);
            }), xe;
          }
          return function(q, H, re, ve) {
            var xe = typeof re == "object" && re !== null && re.type === Nn && re.key === null;
            xe && (re = re.props.children);
            var Re = typeof re == "object" && re !== null;
            if (Re) switch (re.$$typeof) {
              case Gt:
                e: {
                  for (Re = re.key, xe = H; xe !== null; ) {
                    if (xe.key === Re) {
                      if (xe.tag === 7) {
                        if (re.type === Nn) {
                          n(q, xe.sibling), (H = a(xe, re.props.children)).return = q, q = H;
                          break e;
                        }
                      } else if (xe.elementType === re.type) {
                        n(q, xe.sibling), (H = a(xe, re.props)).ref = $i(q, xe, re), H.return = q, q = H;
                        break e;
                      }
                      n(q, xe);
                      break;
                    }
                    t(q, xe), xe = xe.sibling;
                  }
                  re.type === Nn ? ((H = yo(re.props.children, q.mode, ve, re.key)).return = q, q = H) : ((ve = Za(re.type, re.key, re.props, null, q.mode, ve)).ref = $i(q, H, re), ve.return = q, q = ve);
                }
                return h(q);
              case On:
                e: {
                  for (xe = re.key; H !== null; ) {
                    if (H.key === xe) {
                      if (H.tag === 4 && H.stateNode.containerInfo === re.containerInfo && H.stateNode.implementation === re.implementation) {
                        n(q, H.sibling), (H = a(H, re.children || [])).return = q, q = H;
                        break e;
                      }
                      n(q, H);
                      break;
                    }
                    t(q, H), H = H.sibling;
                  }
                  (H = gl(re, q.mode, ve)).return = q, q = H;
                }
                return h(q);
            }
            if (typeof re == "string" || typeof re == "number") return re = "" + re, H !== null && H.tag === 6 ? (n(q, H.sibling), (H = a(H, re)).return = q, q = H) : (n(q, H), (H = ml(re, q.mode, ve)).return = q, q = H), h(q);
            if (Ta(re)) return Vn(q, H, re, ve);
            if (Wn(re)) return on(q, H, re, ve);
            if (Re && Oa(q, re), re === void 0 && !xe) switch (q.tag) {
              case 1:
              case 0:
                throw q = q.type, Error(m(152, q.displayName || q.name || "Component"));
            }
            return n(q, H);
          };
        }
        var di = Dl(!0), zs = Dl(!1), Wi = {}, _r = { current: Wi }, qi = { current: Wi }, Ki = { current: Wi };
        function Bo(e) {
          if (e === Wi) throw Error(m(174));
          return e;
        }
        function As(e, t) {
          switch (z(Ki, t), z(qi, e), z(_r, Wi), e = t.nodeType) {
            case 9:
            case 11:
              t = (t = t.documentElement) ? t.namespaceURI : Qr(null, "");
              break;
            default:
              t = Qr(t = (e = e === 8 ? t.parentNode : t).namespaceURI || null, e = e.tagName);
          }
          x(_r), z(_r, t);
        }
        function pi() {
          x(_r), x(qi), x(Ki);
        }
        function Rl(e) {
          Bo(Ki.current);
          var t = Bo(_r.current), n = Qr(t, e.type);
          t !== n && (z(qi, e), z(_r, n));
        }
        function js(e) {
          qi.current === e && (x(_r), x(qi));
        }
        var Ct = { current: 0 };
        function Na(e) {
          for (var t = e; t !== null; ) {
            if (t.tag === 13) {
              var n = t.memoizedState;
              if (n !== null && ((n = n.dehydrated) === null || n.data === Ti || n.data === yr)) return t;
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
        function Ls(e, t) {
          return { responder: e, props: t };
        }
        var Pa = et.ReactCurrentDispatcher, Fn = et.ReactCurrentBatchConfig, fo = 0, Mt = null, rn = null, Xt = null, Da = !1;
        function Sn() {
          throw Error(m(321));
        }
        function Fs(e, t) {
          if (t === null) return !1;
          for (var n = 0; n < t.length && n < e.length; n++) if (!rr(e[n], t[n])) return !1;
          return !0;
        }
        function Us(e, t, n, r, a, p) {
          if (fo = p, Mt = t, t.memoizedState = null, t.updateQueue = null, t.expirationTime = 0, Pa.current = e === null || e.memoizedState === null ? Lc : Fc, e = n(r, a), t.expirationTime === fo) {
            p = 0;
            do {
              if (t.expirationTime = 0, !(25 > p)) throw Error(m(301));
              p += 1, Xt = rn = null, t.updateQueue = null, Pa.current = Uc, e = n(r, a);
            } while (t.expirationTime === fo);
          }
          if (Pa.current = Aa, t = rn !== null && rn.next !== null, fo = 0, Xt = rn = Mt = null, Da = !1, t) throw Error(m(300));
          return e;
        }
        function fi() {
          var e = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
          return Xt === null ? Mt.memoizedState = Xt = e : Xt = Xt.next = e, Xt;
        }
        function hi() {
          if (rn === null) {
            var e = Mt.alternate;
            e = e !== null ? e.memoizedState : null;
          } else e = rn.next;
          var t = Xt === null ? Mt.memoizedState : Xt.next;
          if (t !== null) Xt = t, rn = e;
          else {
            if (e === null) throw Error(m(310));
            e = { memoizedState: (rn = e).memoizedState, baseState: rn.baseState, baseQueue: rn.baseQueue, queue: rn.queue, next: null }, Xt === null ? Mt.memoizedState = Xt = e : Xt = Xt.next = e;
          }
          return Xt;
        }
        function Ho(e, t) {
          return typeof t == "function" ? t(e) : t;
        }
        function Ra(e) {
          var t = hi(), n = t.queue;
          if (n === null) throw Error(m(311));
          n.lastRenderedReducer = e;
          var r = rn, a = r.baseQueue, p = n.pending;
          if (p !== null) {
            if (a !== null) {
              var h = a.next;
              a.next = p.next, p.next = h;
            }
            r.baseQueue = a = p, n.pending = null;
          }
          if (a !== null) {
            a = a.next, r = r.baseState;
            var w = h = p = null, W = a;
            do {
              var V = W.expirationTime;
              if (V < fo) {
                var ce = { expirationTime: W.expirationTime, suspenseConfig: W.suspenseConfig, action: W.action, eagerReducer: W.eagerReducer, eagerState: W.eagerState, next: null };
                w === null ? (h = w = ce, p = r) : w = w.next = ce, V > Mt.expirationTime && (Mt.expirationTime = V, Ga(V));
              } else w !== null && (w = w.next = { expirationTime: 1073741823, suspenseConfig: W.suspenseConfig, action: W.action, eagerReducer: W.eagerReducer, eagerState: W.eagerState, next: null }), _c(V, W.suspenseConfig), r = W.eagerReducer === e ? W.eagerState : e(r, W.action);
              W = W.next;
            } while (W !== null && W !== a);
            w === null ? p = r : w.next = h, rr(r, t.memoizedState) || (Er = !0), t.memoizedState = r, t.baseState = p, t.baseQueue = w, n.lastRenderedState = r;
          }
          return [t.memoizedState, n.dispatch];
        }
        function Ma(e) {
          var t = hi(), n = t.queue;
          if (n === null) throw Error(m(311));
          n.lastRenderedReducer = e;
          var r = n.dispatch, a = n.pending, p = t.memoizedState;
          if (a !== null) {
            n.pending = null;
            var h = a = a.next;
            do
              p = e(p, h.action), h = h.next;
            while (h !== a);
            rr(p, t.memoizedState) || (Er = !0), t.memoizedState = p, t.baseQueue === null && (t.baseState = p), n.lastRenderedState = p;
          }
          return [p, r];
        }
        function Vs(e) {
          var t = fi();
          return typeof e == "function" && (e = e()), t.memoizedState = t.baseState = e, e = (e = t.queue = { pending: null, dispatch: null, lastRenderedReducer: Ho, lastRenderedState: e }).dispatch = Ul.bind(null, Mt, e), [t.memoizedState, e];
        }
        function Bs(e, t, n, r) {
          return e = { tag: e, create: t, destroy: n, deps: r, next: null }, (t = Mt.updateQueue) === null ? (t = { lastEffect: null }, Mt.updateQueue = t, t.lastEffect = e.next = e) : (n = t.lastEffect) === null ? t.lastEffect = e.next = e : (r = n.next, n.next = e, e.next = r, t.lastEffect = e), e;
        }
        function Ml() {
          return hi().memoizedState;
        }
        function Hs(e, t, n, r) {
          var a = fi();
          Mt.effectTag |= e, a.memoizedState = Bs(1 | t, n, void 0, r === void 0 ? null : r);
        }
        function $s(e, t, n, r) {
          var a = hi();
          r = r === void 0 ? null : r;
          var p = void 0;
          if (rn !== null) {
            var h = rn.memoizedState;
            if (p = h.destroy, r !== null && Fs(r, h.deps)) return void Bs(t, n, p, r);
          }
          Mt.effectTag |= e, a.memoizedState = Bs(1 | t, n, p, r);
        }
        function Il(e, t) {
          return Hs(516, 4, e, t);
        }
        function Ia(e, t) {
          return $s(516, 4, e, t);
        }
        function zl(e, t) {
          return $s(4, 2, e, t);
        }
        function Al(e, t) {
          return typeof t == "function" ? (e = e(), t(e), function() {
            t(null);
          }) : t != null ? (e = e(), t.current = e, function() {
            t.current = null;
          }) : void 0;
        }
        function jl(e, t, n) {
          return n = n != null ? n.concat([e]) : null, $s(4, 2, Al.bind(null, t, e), n);
        }
        function Ws() {
        }
        function Ll(e, t) {
          return fi().memoizedState = [e, t === void 0 ? null : t], e;
        }
        function za(e, t) {
          var n = hi();
          t = t === void 0 ? null : t;
          var r = n.memoizedState;
          return r !== null && t !== null && Fs(t, r[1]) ? r[0] : (n.memoizedState = [e, t], e);
        }
        function Fl(e, t) {
          var n = hi();
          t = t === void 0 ? null : t;
          var r = n.memoizedState;
          return r !== null && t !== null && Fs(t, r[1]) ? r[0] : (e = e(), n.memoizedState = [e, t], e);
        }
        function qs(e, t, n) {
          var r = Ft();
          or(98 > r ? 98 : r, function() {
            e(!0);
          }), or(97 < r ? 97 : r, function() {
            var a = Fn.suspense;
            Fn.suspense = t === void 0 ? null : t;
            try {
              e(!1), n();
            } finally {
              Fn.suspense = a;
            }
          });
        }
        function Ul(e, t, n) {
          var r = Sr(), a = Hi.suspense;
          a = { expirationTime: r = Ko(r, e, a), suspenseConfig: a, action: n, eagerReducer: null, eagerState: null, next: null };
          var p = t.pending;
          if (p === null ? a.next = a : (a.next = p.next, p.next = a), t.pending = a, p = e.alternate, e === Mt || p !== null && p === Mt) Da = !0, a.expirationTime = fo, Mt.expirationTime = fo;
          else {
            if (e.expirationTime === 0 && (p === null || p.expirationTime === 0) && (p = t.lastRenderedReducer) !== null) try {
              var h = t.lastRenderedState, w = p(h, n);
              if (a.eagerReducer = p, a.eagerState = w, rr(w, h)) return;
            } catch {
            }
            go(e, r);
          }
        }
        var Aa = { readContext: Ln, useCallback: Sn, useContext: Sn, useEffect: Sn, useImperativeHandle: Sn, useLayoutEffect: Sn, useMemo: Sn, useReducer: Sn, useRef: Sn, useState: Sn, useDebugValue: Sn, useResponder: Sn, useDeferredValue: Sn, useTransition: Sn }, Lc = { readContext: Ln, useCallback: Ll, useContext: Ln, useEffect: Il, useImperativeHandle: function(e, t, n) {
          return n = n != null ? n.concat([e]) : null, Hs(4, 2, Al.bind(null, t, e), n);
        }, useLayoutEffect: function(e, t) {
          return Hs(4, 2, e, t);
        }, useMemo: function(e, t) {
          var n = fi();
          return t = t === void 0 ? null : t, e = e(), n.memoizedState = [e, t], e;
        }, useReducer: function(e, t, n) {
          var r = fi();
          return t = n !== void 0 ? n(t) : t, r.memoizedState = r.baseState = t, e = (e = r.queue = { pending: null, dispatch: null, lastRenderedReducer: e, lastRenderedState: t }).dispatch = Ul.bind(null, Mt, e), [r.memoizedState, e];
        }, useRef: function(e) {
          return e = { current: e }, fi().memoizedState = e;
        }, useState: Vs, useDebugValue: Ws, useResponder: Ls, useDeferredValue: function(e, t) {
          var n = Vs(e), r = n[0], a = n[1];
          return Il(function() {
            var p = Fn.suspense;
            Fn.suspense = t === void 0 ? null : t;
            try {
              a(e);
            } finally {
              Fn.suspense = p;
            }
          }, [e, t]), r;
        }, useTransition: function(e) {
          var t = Vs(!1), n = t[0];
          return t = t[1], [Ll(qs.bind(null, t, e), [t, e]), n];
        } }, Fc = { readContext: Ln, useCallback: za, useContext: Ln, useEffect: Ia, useImperativeHandle: jl, useLayoutEffect: zl, useMemo: Fl, useReducer: Ra, useRef: Ml, useState: function() {
          return Ra(Ho);
        }, useDebugValue: Ws, useResponder: Ls, useDeferredValue: function(e, t) {
          var n = Ra(Ho), r = n[0], a = n[1];
          return Ia(function() {
            var p = Fn.suspense;
            Fn.suspense = t === void 0 ? null : t;
            try {
              a(e);
            } finally {
              Fn.suspense = p;
            }
          }, [e, t]), r;
        }, useTransition: function(e) {
          var t = Ra(Ho), n = t[0];
          return t = t[1], [za(qs.bind(null, t, e), [t, e]), n];
        } }, Uc = { readContext: Ln, useCallback: za, useContext: Ln, useEffect: Ia, useImperativeHandle: jl, useLayoutEffect: zl, useMemo: Fl, useReducer: Ma, useRef: Ml, useState: function() {
          return Ma(Ho);
        }, useDebugValue: Ws, useResponder: Ls, useDeferredValue: function(e, t) {
          var n = Ma(Ho), r = n[0], a = n[1];
          return Ia(function() {
            var p = Fn.suspense;
            Fn.suspense = t === void 0 ? null : t;
            try {
              a(e);
            } finally {
              Fn.suspense = p;
            }
          }, [e, t]), r;
        }, useTransition: function(e) {
          var t = Ma(Ho), n = t[0];
          return t = t[1], [za(qs.bind(null, t, e), [t, e]), n];
        } }, Vr = null, ho = null, $o = !1;
        function Vl(e, t) {
          var n = Cr(5, null, null, 0);
          n.elementType = "DELETED", n.type = "DELETED", n.stateNode = t, n.return = e, n.effectTag = 8, e.lastEffect !== null ? (e.lastEffect.nextEffect = n, e.lastEffect = n) : e.firstEffect = e.lastEffect = n;
        }
        function Bl(e, t) {
          switch (e.tag) {
            case 5:
              var n = e.type;
              return (t = t.nodeType !== 1 || n.toLowerCase() !== t.nodeName.toLowerCase() ? null : t) !== null && (e.stateNode = t, !0);
            case 6:
              return (t = e.pendingProps === "" || t.nodeType !== 3 ? null : t) !== null && (e.stateNode = t, !0);
            default:
              return !1;
          }
        }
        function Ks(e) {
          if ($o) {
            var t = ho;
            if (t) {
              var n = t;
              if (!Bl(e, t)) {
                if (!(t = zr(n.nextSibling)) || !Bl(e, t)) return e.effectTag = -1025 & e.effectTag | 2, $o = !1, void (Vr = e);
                Vl(Vr, n);
              }
              Vr = e, ho = zr(t.firstChild);
            } else e.effectTag = -1025 & e.effectTag | 2, $o = !1, Vr = e;
          }
        }
        function Hl(e) {
          for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13; ) e = e.return;
          Vr = e;
        }
        function ja(e) {
          if (e !== Vr) return !1;
          if (!$o) return Hl(e), $o = !0, !1;
          var t = e.type;
          if (e.tag !== 5 || t !== "head" && t !== "body" && !Oi(t, e.memoizedProps)) for (t = ho; t; ) Vl(e, t), t = zr(t.nextSibling);
          if (Hl(e), e.tag === 13) {
            if (!(e = (e = e.memoizedState) !== null ? e.dehydrated : null)) throw Error(m(317));
            e: {
              for (e = e.nextSibling, t = 0; e; ) {
                if (e.nodeType === 8) {
                  var n = e.data;
                  if (n === eo) {
                    if (t === 0) {
                      ho = zr(e.nextSibling);
                      break e;
                    }
                    t--;
                  } else n !== Jr && n !== yr && n !== Ti || t++;
                }
                e = e.nextSibling;
              }
              ho = null;
            }
          } else ho = Vr ? zr(e.stateNode.nextSibling) : null;
          return !0;
        }
        function Qs() {
          ho = Vr = null, $o = !1;
        }
        var Vc = et.ReactCurrentOwner, Er = !1;
        function Un(e, t, n, r) {
          t.child = e === null ? zs(t, null, n, r) : di(t, e.child, n, r);
        }
        function $l(e, t, n, r, a) {
          n = n.render;
          var p = t.ref;
          return ui(t, a), r = Us(e, t, n, r, p, a), e === null || Er ? (t.effectTag |= 1, Un(e, t, r, a), t.child) : (t.updateQueue = e.updateQueue, t.effectTag &= -517, e.expirationTime <= a && (e.expirationTime = 0), Br(e, t, a));
        }
        function Wl(e, t, n, r, a, p) {
          if (e === null) {
            var h = n.type;
            return typeof h != "function" || hl(h) || h.defaultProps !== void 0 || n.compare !== null || n.defaultProps !== void 0 ? ((e = Za(n.type, null, r, null, t.mode, p)).ref = t.ref, e.return = t, t.child = e) : (t.tag = 15, t.type = h, ql(e, t, h, r, a, p));
          }
          return h = e.child, a < p && (a = h.memoizedProps, (n = (n = n.compare) !== null ? n : Lr)(a, r) && e.ref === t.ref) ? Br(e, t, p) : (t.effectTag |= 1, (e = Go(h, r)).ref = t.ref, e.return = t, t.child = e);
        }
        function ql(e, t, n, r, a, p) {
          return e !== null && Lr(e.memoizedProps, r) && e.ref === t.ref && (Er = !1, a < p) ? (t.expirationTime = e.expirationTime, Br(e, t, p)) : Ys(e, t, n, r, p);
        }
        function Kl(e, t) {
          var n = t.ref;
          (e === null && n !== null || e !== null && e.ref !== n) && (t.effectTag |= 128);
        }
        function Ys(e, t, n, r, a) {
          var p = de(n) ? ue : Y.current;
          return p = he(t, p), ui(t, a), n = Us(e, t, n, r, p, a), e === null || Er ? (t.effectTag |= 1, Un(e, t, n, a), t.child) : (t.updateQueue = e.updateQueue, t.effectTag &= -517, e.expirationTime <= a && (e.expirationTime = 0), Br(e, t, a));
        }
        function Ql(e, t, n, r, a) {
          if (de(n)) {
            var p = !0;
            st(t);
          } else p = !1;
          if (ui(t, a), t.stateNode === null) e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= 2), Nl(t, n, r), Is(t, n, r, a), r = !0;
          else if (e === null) {
            var h = t.stateNode, w = t.memoizedProps;
            h.props = w;
            var W = h.context, V = n.contextType;
            typeof V == "object" && V !== null ? V = Ln(V) : V = he(t, V = de(n) ? ue : Y.current);
            var ce = n.getDerivedStateFromProps, Me = typeof ce == "function" || typeof h.getSnapshotBeforeUpdate == "function";
            Me || typeof h.UNSAFE_componentWillReceiveProps != "function" && typeof h.componentWillReceiveProps != "function" || (w !== r || W !== V) && Pl(t, h, r, V), co = !1;
            var Ve = t.memoizedState;
            h.state = Ve, Bi(t, r, h, a), W = t.memoizedState, w !== r || Ve !== W || ie.current || co ? (typeof ce == "function" && (Sa(t, n, ce, r), W = t.memoizedState), (w = co || Ol(t, n, w, r, Ve, W, V)) ? (Me || typeof h.UNSAFE_componentWillMount != "function" && typeof h.componentWillMount != "function" || (typeof h.componentWillMount == "function" && h.componentWillMount(), typeof h.UNSAFE_componentWillMount == "function" && h.UNSAFE_componentWillMount()), typeof h.componentDidMount == "function" && (t.effectTag |= 4)) : (typeof h.componentDidMount == "function" && (t.effectTag |= 4), t.memoizedProps = r, t.memoizedState = W), h.props = r, h.state = W, h.context = V, r = w) : (typeof h.componentDidMount == "function" && (t.effectTag |= 4), r = !1);
          } else h = t.stateNode, Ms(e, t), w = t.memoizedProps, h.props = t.type === t.elementType ? w : nn(t.type, w), W = h.context, typeof (V = n.contextType) == "object" && V !== null ? V = Ln(V) : V = he(t, V = de(n) ? ue : Y.current), (Me = typeof (ce = n.getDerivedStateFromProps) == "function" || typeof h.getSnapshotBeforeUpdate == "function") || typeof h.UNSAFE_componentWillReceiveProps != "function" && typeof h.componentWillReceiveProps != "function" || (w !== r || W !== V) && Pl(t, h, r, V), co = !1, W = t.memoizedState, h.state = W, Bi(t, r, h, a), Ve = t.memoizedState, w !== r || W !== Ve || ie.current || co ? (typeof ce == "function" && (Sa(t, n, ce, r), Ve = t.memoizedState), (ce = co || Ol(t, n, w, r, W, Ve, V)) ? (Me || typeof h.UNSAFE_componentWillUpdate != "function" && typeof h.componentWillUpdate != "function" || (typeof h.componentWillUpdate == "function" && h.componentWillUpdate(r, Ve, V), typeof h.UNSAFE_componentWillUpdate == "function" && h.UNSAFE_componentWillUpdate(r, Ve, V)), typeof h.componentDidUpdate == "function" && (t.effectTag |= 4), typeof h.getSnapshotBeforeUpdate == "function" && (t.effectTag |= 256)) : (typeof h.componentDidUpdate != "function" || w === e.memoizedProps && W === e.memoizedState || (t.effectTag |= 4), typeof h.getSnapshotBeforeUpdate != "function" || w === e.memoizedProps && W === e.memoizedState || (t.effectTag |= 256), t.memoizedProps = r, t.memoizedState = Ve), h.props = r, h.state = Ve, h.context = V, r = ce) : (typeof h.componentDidUpdate != "function" || w === e.memoizedProps && W === e.memoizedState || (t.effectTag |= 4), typeof h.getSnapshotBeforeUpdate != "function" || w === e.memoizedProps && W === e.memoizedState || (t.effectTag |= 256), r = !1);
          return Xs(e, t, n, r, p, a);
        }
        function Xs(e, t, n, r, a, p) {
          Kl(e, t);
          var h = !!(64 & t.effectTag);
          if (!r && !h) return a && $e(t, n, !1), Br(e, t, p);
          r = t.stateNode, Vc.current = t;
          var w = h && typeof n.getDerivedStateFromError != "function" ? null : r.render();
          return t.effectTag |= 1, e !== null && h ? (t.child = di(t, e.child, null, p), t.child = di(t, null, w, p)) : Un(e, t, w, p), t.memoizedState = r.state, a && $e(t, n, !0), t.child;
        }
        function Yl(e) {
          var t = e.stateNode;
          t.pendingContext ? Ce(0, t.pendingContext, t.pendingContext !== t.context) : t.context && Ce(0, t.context, !1), As(e, t.containerInfo);
        }
        var Xl, Gs, Gl, Zl, Zs = { dehydrated: null, retryTime: 0 };
        function Jl(e, t, n) {
          var r, a = t.mode, p = t.pendingProps, h = Ct.current, w = !1;
          if ((r = !!(64 & t.effectTag)) || (r = !!(2 & h) && (e === null || e.memoizedState !== null)), r ? (w = !0, t.effectTag &= -65) : e !== null && e.memoizedState === null || p.fallback === void 0 || p.unstable_avoidThisFallback === !0 || (h |= 1), z(Ct, 1 & h), e === null) {
            if (p.fallback !== void 0 && Ks(t), w) {
              if (w = p.fallback, (p = yo(null, a, 0, null)).return = t, !(2 & t.mode)) for (e = t.memoizedState !== null ? t.child.child : t.child, p.child = e; e !== null; ) e.return = p, e = e.sibling;
              return (n = yo(w, a, n, null)).return = t, p.sibling = n, t.memoizedState = Zs, t.child = p, n;
            }
            return a = p.children, t.memoizedState = null, t.child = zs(t, null, a, n);
          }
          if (e.memoizedState !== null) {
            if (a = (e = e.child).sibling, w) {
              if (p = p.fallback, (n = Go(e, e.pendingProps)).return = t, !(2 & t.mode) && (w = t.memoizedState !== null ? t.child.child : t.child) !== e.child) for (n.child = w; w !== null; ) w.return = n, w = w.sibling;
              return (a = Go(a, p)).return = t, n.sibling = a, n.childExpirationTime = 0, t.memoizedState = Zs, t.child = n, a;
            }
            return n = di(t, e.child, p.children, n), t.memoizedState = null, t.child = n;
          }
          if (e = e.child, w) {
            if (w = p.fallback, (p = yo(null, a, 0, null)).return = t, p.child = e, e !== null && (e.return = p), !(2 & t.mode)) for (e = t.memoizedState !== null ? t.child.child : t.child, p.child = e; e !== null; ) e.return = p, e = e.sibling;
            return (n = yo(w, a, n, null)).return = t, p.sibling = n, n.effectTag |= 2, p.childExpirationTime = 0, t.memoizedState = Zs, t.child = p, n;
          }
          return t.memoizedState = null, t.child = di(t, e, p.children, n);
        }
        function ec(e, t) {
          e.expirationTime < t && (e.expirationTime = t);
          var n = e.alternate;
          n !== null && n.expirationTime < t && (n.expirationTime = t), xl(e.return, t);
        }
        function Js(e, t, n, r, a, p) {
          var h = e.memoizedState;
          h === null ? e.memoizedState = { isBackwards: t, rendering: null, renderingStartTime: 0, last: r, tail: n, tailExpiration: 0, tailMode: a, lastEffect: p } : (h.isBackwards = t, h.rendering = null, h.renderingStartTime = 0, h.last = r, h.tail = n, h.tailExpiration = 0, h.tailMode = a, h.lastEffect = p);
        }
        function tc(e, t, n) {
          var r = t.pendingProps, a = r.revealOrder, p = r.tail;
          if (Un(e, t, r.children, n), 2 & (r = Ct.current)) r = 1 & r | 2, t.effectTag |= 64;
          else {
            if (e !== null && 64 & e.effectTag) e: for (e = t.child; e !== null; ) {
              if (e.tag === 13) e.memoizedState !== null && ec(e, n);
              else if (e.tag === 19) ec(e, n);
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
          if (z(Ct, r), 2 & t.mode) switch (a) {
            case "forwards":
              for (n = t.child, a = null; n !== null; ) (e = n.alternate) !== null && Na(e) === null && (a = n), n = n.sibling;
              (n = a) === null ? (a = t.child, t.child = null) : (a = n.sibling, n.sibling = null), Js(t, !1, a, n, p, t.lastEffect);
              break;
            case "backwards":
              for (n = null, a = t.child, t.child = null; a !== null; ) {
                if ((e = a.alternate) !== null && Na(e) === null) {
                  t.child = a;
                  break;
                }
                e = a.sibling, a.sibling = n, n = a, a = e;
              }
              Js(t, !0, n, null, p, t.lastEffect);
              break;
            case "together":
              Js(t, !1, null, null, void 0, t.lastEffect);
              break;
            default:
              t.memoizedState = null;
          }
          else t.memoizedState = null;
          return t.child;
        }
        function Br(e, t, n) {
          e !== null && (t.dependencies = e.dependencies);
          var r = t.expirationTime;
          if (r !== 0 && Ga(r), t.childExpirationTime < n) return null;
          if (e !== null && t.child !== e.child) throw Error(m(153));
          if (t.child !== null) {
            for (n = Go(e = t.child, e.pendingProps), t.child = n, n.return = t; e.sibling !== null; ) e = e.sibling, (n = n.sibling = Go(e, e.pendingProps)).return = t;
            n.sibling = null;
          }
          return t.child;
        }
        function La(e, t) {
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
        function Bc(e, t, n) {
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
            case 17:
              return de(t.type) && Oe(), null;
            case 3:
              return pi(), x(ie), x(Y), (n = t.stateNode).pendingContext && (n.context = n.pendingContext, n.pendingContext = null), e !== null && e.child !== null || !ja(t) || (t.effectTag |= 4), Gs(t), null;
            case 5:
              js(t), n = Bo(Ki.current);
              var a = t.type;
              if (e !== null && t.stateNode != null) Gl(e, t, a, r, n), e.ref !== t.ref && (t.effectTag |= 128);
              else {
                if (!r) {
                  if (t.stateNode === null) throw Error(m(166));
                  return null;
                }
                if (e = Bo(_r.current), ja(t)) {
                  r = t.stateNode, a = t.type;
                  var p = t.memoizedProps;
                  switch (r[vr] = t, r[ri] = p, a) {
                    case "iframe":
                    case "object":
                    case "embed":
                      gt("load", r);
                      break;
                    case "video":
                    case "audio":
                      for (e = 0; e < tt.length; e++) gt(tt[e], r);
                      break;
                    case "source":
                      gt("error", r);
                      break;
                    case "img":
                    case "image":
                    case "link":
                      gt("error", r), gt("load", r);
                      break;
                    case "form":
                      gt("reset", r), gt("submit", r);
                      break;
                    case "details":
                      gt("toggle", r);
                      break;
                    case "input":
                      Tr(r, p), gt("invalid", r), Gn(n, "onChange");
                      break;
                    case "select":
                      r._wrapperState = { wasMultiple: !!p.multiple }, gt("invalid", r), Gn(n, "onChange");
                      break;
                    case "textarea":
                      lr(r, p), gt("invalid", r), Gn(n, "onChange");
                  }
                  for (var h in _i(a, p), e = null, p) if (p.hasOwnProperty(h)) {
                    var w = p[h];
                    h === "children" ? typeof w == "string" ? r.textContent !== w && (e = ["children", w]) : typeof w == "number" && r.textContent !== "" + w && (e = ["children", "" + w]) : j.hasOwnProperty(h) && w != null && Gn(n, h);
                  }
                  switch (a) {
                    case "input":
                      qn(r), Kr(r, p, !0);
                      break;
                    case "textarea":
                      qn(r), Co(r);
                      break;
                    case "select":
                    case "option":
                      break;
                    default:
                      typeof p.onClick == "function" && (r.onclick = Zr);
                  }
                  n = e, t.updateQueue = n, n !== null && (t.effectTag |= 4);
                } else {
                  switch (h = n.nodeType === 9 ? n : n.ownerDocument, e === xi && (e = mn(a)), e === xi ? a === "script" ? ((e = h.createElement("div")).innerHTML = "<script><\/script>", e = e.removeChild(e.firstChild)) : typeof r.is == "string" ? e = h.createElement(a, { is: r.is }) : (e = h.createElement(a), a === "select" && (h = e, r.multiple ? h.multiple = !0 : r.size && (h.size = r.size))) : e = h.createElementNS(e, a), e[vr] = t, e[ri] = r, Xl(e, t, !1, !1), t.stateNode = e, h = Ei(a, r), a) {
                    case "iframe":
                    case "object":
                    case "embed":
                      gt("load", e), w = r;
                      break;
                    case "video":
                    case "audio":
                      for (w = 0; w < tt.length; w++) gt(tt[w], e);
                      w = r;
                      break;
                    case "source":
                      gt("error", e), w = r;
                      break;
                    case "img":
                    case "image":
                    case "link":
                      gt("error", e), gt("load", e), w = r;
                      break;
                    case "form":
                      gt("reset", e), gt("submit", e), w = r;
                      break;
                    case "details":
                      gt("toggle", e), w = r;
                      break;
                    case "input":
                      Tr(e, r), w = qr(e, r), gt("invalid", e), Gn(n, "onChange");
                      break;
                    case "option":
                      w = Or(e, r);
                      break;
                    case "select":
                      e._wrapperState = { wasMultiple: !!r.multiple }, w = d({}, r, { value: void 0 }), gt("invalid", e), Gn(n, "onChange");
                      break;
                    case "textarea":
                      lr(e, r), w = Nr(e, r), gt("invalid", e), Gn(n, "onChange");
                      break;
                    default:
                      w = r;
                  }
                  _i(a, w);
                  var W = w;
                  for (p in W) if (W.hasOwnProperty(p)) {
                    var V = W[p];
                    p === "style" ? ei(e, V) : p === "dangerouslySetInnerHTML" ? (V = V ? V.__html : void 0) != null && Pr(e, V) : p === "children" ? typeof V == "string" ? (a !== "textarea" || V !== "") && Kn(e, V) : typeof V == "number" && Kn(e, "" + V) : p !== "suppressContentEditableWarning" && p !== "suppressHydrationWarning" && p !== "autoFocus" && (j.hasOwnProperty(p) ? V != null && Gn(n, p) : V != null && Pt(e, p, V, h));
                  }
                  switch (a) {
                    case "input":
                      qn(e), Kr(e, r, !1);
                      break;
                    case "textarea":
                      qn(e), Co(e);
                      break;
                    case "option":
                      r.value != null && e.setAttribute("value", "" + Ye(r.value));
                      break;
                    case "select":
                      e.multiple = !!r.multiple, (n = r.value) != null ? Dn(e, !!r.multiple, n, !1) : r.defaultValue != null && Dn(e, !!r.multiple, r.defaultValue, !0);
                      break;
                    default:
                      typeof w.onClick == "function" && (e.onclick = Zr);
                  }
                  Yt(a, r) && (t.effectTag |= 4);
                }
                t.ref !== null && (t.effectTag |= 128);
              }
              return null;
            case 6:
              if (e && t.stateNode != null) Zl(e, t, e.memoizedProps, r);
              else {
                if (typeof r != "string" && t.stateNode === null) throw Error(m(166));
                n = Bo(Ki.current), Bo(_r.current), ja(t) ? (n = t.stateNode, r = t.memoizedProps, n[vr] = t, n.nodeValue !== r && (t.effectTag |= 4)) : ((n = (n.nodeType === 9 ? n : n.ownerDocument).createTextNode(r))[vr] = t, t.stateNode = n);
              }
              return null;
            case 13:
              return x(Ct), r = t.memoizedState, 64 & t.effectTag ? (t.expirationTime = n, t) : (n = r !== null, r = !1, e === null ? t.memoizedProps.fallback !== void 0 && ja(t) : (r = (a = e.memoizedState) !== null, n || a === null || (a = e.child.sibling) !== null && ((p = t.firstEffect) !== null ? (t.firstEffect = a, a.nextEffect = p) : (t.firstEffect = t.lastEffect = a, a.nextEffect = null), a.effectTag = 8)), n && !r && 2 & t.mode && (e === null && t.memoizedProps.unstable_avoidThisFallback !== !0 || 1 & Ct.current ? Vt === Wo && (Vt = Va) : (Vt !== Wo && Vt !== Va || (Vt = Ba), Yi !== 0 && Cn !== null && (Zo(Cn, dn), Tc(Cn, Yi)))), (n || r) && (t.effectTag |= 4), null);
            case 4:
              return pi(), Gs(t), null;
            case 10:
              return Vo(t), null;
            case 19:
              if (x(Ct), (r = t.memoizedState) === null) return null;
              if (a = !!(64 & t.effectTag), (p = r.rendering) === null) {
                if (a) La(r, !1);
                else if (Vt !== Wo || e !== null && 64 & e.effectTag) for (p = t.child; p !== null; ) {
                  if ((e = Na(p)) !== null) {
                    for (t.effectTag |= 64, La(r, !1), (a = e.updateQueue) !== null && (t.updateQueue = a, t.effectTag |= 4), r.lastEffect === null && (t.firstEffect = null), t.lastEffect = r.lastEffect, r = t.child; r !== null; ) p = n, (a = r).effectTag &= 2, a.nextEffect = null, a.firstEffect = null, a.lastEffect = null, (e = a.alternate) === null ? (a.childExpirationTime = 0, a.expirationTime = p, a.child = null, a.memoizedProps = null, a.memoizedState = null, a.updateQueue = null, a.dependencies = null) : (a.childExpirationTime = e.childExpirationTime, a.expirationTime = e.expirationTime, a.child = e.child, a.memoizedProps = e.memoizedProps, a.memoizedState = e.memoizedState, a.updateQueue = e.updateQueue, p = e.dependencies, a.dependencies = p === null ? null : { expirationTime: p.expirationTime, firstContext: p.firstContext, responders: p.responders }), r = r.sibling;
                    return z(Ct, 1 & Ct.current | 2), t.child;
                  }
                  p = p.sibling;
                }
              } else {
                if (!a) if ((e = Na(p)) !== null) {
                  if (t.effectTag |= 64, a = !0, (n = e.updateQueue) !== null && (t.updateQueue = n, t.effectTag |= 4), La(r, !0), r.tail === null && r.tailMode === "hidden" && !p.alternate) return (t = t.lastEffect = r.lastEffect) !== null && (t.nextEffect = null), null;
                } else 2 * Nt() - r.renderingStartTime > r.tailExpiration && 1 < n && (t.effectTag |= 64, a = !0, La(r, !1), t.expirationTime = t.childExpirationTime = n - 1);
                r.isBackwards ? (p.sibling = t.child, t.child = p) : ((n = r.last) !== null ? n.sibling = p : t.child = p, r.last = p);
              }
              return r.tail !== null ? (r.tailExpiration === 0 && (r.tailExpiration = Nt() + 500), n = r.tail, r.rendering = n, r.tail = n.sibling, r.lastEffect = t.lastEffect, r.renderingStartTime = Nt(), n.sibling = null, t = Ct.current, z(Ct, a ? 1 & t | 2 : 1 & t), n) : null;
          }
          throw Error(m(156, t.tag));
        }
        function Hc(e) {
          switch (e.tag) {
            case 1:
              de(e.type) && Oe();
              var t = e.effectTag;
              return 4096 & t ? (e.effectTag = -4097 & t | 64, e) : null;
            case 3:
              if (pi(), x(ie), x(Y), 64 & (t = e.effectTag)) throw Error(m(285));
              return e.effectTag = -4097 & t | 64, e;
            case 5:
              return js(e), null;
            case 13:
              return x(Ct), 4096 & (t = e.effectTag) ? (e.effectTag = -4097 & t | 64, e) : null;
            case 19:
              return x(Ct), null;
            case 4:
              return pi(), null;
            case 10:
              return Vo(e), null;
            default:
              return null;
          }
        }
        function el(e, t) {
          return { value: e, source: t, stack: zt(t) };
        }
        Xl = function(e, t) {
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
        }, Gs = function() {
        }, Gl = function(e, t, n, r, a) {
          var p = e.memoizedProps;
          if (p !== r) {
            var h, w, W = t.stateNode;
            switch (Bo(_r.current), e = null, n) {
              case "input":
                p = qr(W, p), r = qr(W, r), e = [];
                break;
              case "option":
                p = Or(W, p), r = Or(W, r), e = [];
                break;
              case "select":
                p = d({}, p, { value: void 0 }), r = d({}, r, { value: void 0 }), e = [];
                break;
              case "textarea":
                p = Nr(W, p), r = Nr(W, r), e = [];
                break;
              default:
                typeof p.onClick != "function" && typeof r.onClick == "function" && (W.onclick = Zr);
            }
            for (h in _i(n, r), n = null, p) if (!r.hasOwnProperty(h) && p.hasOwnProperty(h) && p[h] != null) if (h === "style") for (w in W = p[h]) W.hasOwnProperty(w) && (n || (n = {}), n[w] = "");
            else h !== "dangerouslySetInnerHTML" && h !== "children" && h !== "suppressContentEditableWarning" && h !== "suppressHydrationWarning" && h !== "autoFocus" && (j.hasOwnProperty(h) ? e || (e = []) : (e = e || []).push(h, null));
            for (h in r) {
              var V = r[h];
              if (W = p != null ? p[h] : void 0, r.hasOwnProperty(h) && V !== W && (V != null || W != null)) if (h === "style") if (W) {
                for (w in W) !W.hasOwnProperty(w) || V && V.hasOwnProperty(w) || (n || (n = {}), n[w] = "");
                for (w in V) V.hasOwnProperty(w) && W[w] !== V[w] && (n || (n = {}), n[w] = V[w]);
              } else n || (e || (e = []), e.push(h, n)), n = V;
              else h === "dangerouslySetInnerHTML" ? (V = V ? V.__html : void 0, W = W ? W.__html : void 0, V != null && W !== V && (e = e || []).push(h, V)) : h === "children" ? W === V || typeof V != "string" && typeof V != "number" || (e = e || []).push(h, "" + V) : h !== "suppressContentEditableWarning" && h !== "suppressHydrationWarning" && (j.hasOwnProperty(h) ? (V != null && Gn(a, h), e || W === V || (e = [])) : (e = e || []).push(h, V));
            }
            n && (e = e || []).push("style", n), a = e, (t.updateQueue = a) && (t.effectTag |= 4);
          }
        }, Zl = function(e, t, n, r) {
          n !== r && (t.effectTag |= 4);
        };
        var $c = typeof WeakSet == "function" ? WeakSet : Set;
        function tl(e, t) {
          var n = t.source, r = t.stack;
          r === null && n !== null && (r = zt(n)), n !== null && Kt(n.type), t = t.value, e !== null && e.tag === 1 && Kt(e.type);
          try {
            console.error(t);
          } catch (a) {
            setTimeout(function() {
              throw a;
            });
          }
        }
        function nc(e) {
          var t = e.ref;
          if (t !== null) if (typeof t == "function") try {
            t(null);
          } catch (n) {
            Xo(e, n);
          }
          else t.current = null;
        }
        function Wc(e, t) {
          switch (t.tag) {
            case 0:
            case 11:
            case 15:
            case 22:
            case 3:
            case 5:
            case 6:
            case 4:
            case 17:
              return;
            case 1:
              if (256 & t.effectTag && e !== null) {
                var n = e.memoizedProps, r = e.memoizedState;
                t = (e = t.stateNode).getSnapshotBeforeUpdate(t.elementType === t.type ? n : nn(t.type, n), r), e.__reactInternalSnapshotBeforeUpdate = t;
              }
              return;
          }
          throw Error(m(163));
        }
        function rc(e, t) {
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
        function oc(e, t) {
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
        function qc(e, t, n) {
          switch (n.tag) {
            case 0:
            case 11:
            case 15:
            case 22:
              return void oc(3, n);
            case 1:
              if (e = n.stateNode, 4 & n.effectTag) if (t === null) e.componentDidMount();
              else {
                var r = n.elementType === n.type ? t.memoizedProps : nn(n.type, t.memoizedProps);
                e.componentDidUpdate(r, t.memoizedState, e.__reactInternalSnapshotBeforeUpdate);
              }
              return void ((t = n.updateQueue) !== null && Cl(n, t, e));
            case 3:
              if ((t = n.updateQueue) !== null) {
                if (e = null, n.child !== null) switch (n.child.tag) {
                  case 5:
                  case 1:
                    e = n.child.stateNode;
                }
                Cl(n, t, e);
              }
              return;
            case 5:
              return e = n.stateNode, void (t === null && 4 & n.effectTag && Yt(n.type, n.memoizedProps) && e.focus());
            case 6:
            case 4:
            case 12:
            case 19:
            case 17:
            case 20:
            case 21:
              return;
            case 13:
              return void (n.memoizedState === null && (n = n.alternate, n !== null && (n = n.memoizedState, n !== null && (n = n.dehydrated, n !== null && yi(n)))));
          }
          throw Error(m(163));
        }
        function ic(e, t, n) {
          switch (typeof fl == "function" && fl(t), t.tag) {
            case 0:
            case 11:
            case 14:
            case 15:
            case 22:
              if ((e = t.updateQueue) !== null && (e = e.lastEffect) !== null) {
                var r = e.next;
                or(97 < n ? 97 : n, function() {
                  var a = r;
                  do {
                    var p = a.destroy;
                    if (p !== void 0) {
                      var h = t;
                      try {
                        p();
                      } catch (w) {
                        Xo(h, w);
                      }
                    }
                    a = a.next;
                  } while (a !== r);
                });
              }
              break;
            case 1:
              nc(t), typeof (n = t.stateNode).componentWillUnmount == "function" && (function(a, p) {
                try {
                  p.props = a.memoizedProps, p.state = a.memoizedState, p.componentWillUnmount();
                } catch (h) {
                  Xo(a, h);
                }
              })(t, n);
              break;
            case 5:
              nc(t);
              break;
            case 4:
              cc(e, t, n);
          }
        }
        function ac(e) {
          var t = e.alternate;
          e.return = null, e.child = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.alternate = null, e.firstEffect = null, e.lastEffect = null, e.pendingProps = null, e.memoizedProps = null, e.stateNode = null, t !== null && ac(t);
        }
        function sc(e) {
          return e.tag === 5 || e.tag === 3 || e.tag === 4;
        }
        function lc(e) {
          e: {
            for (var t = e.return; t !== null; ) {
              if (sc(t)) {
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
          16 & n.effectTag && (Kn(t, ""), n.effectTag &= -17);
          e: t: for (n = e; ; ) {
            for (; n.sibling === null; ) {
              if (n.return === null || sc(n.return)) {
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
          r ? nl(e, n, t) : rl(e, n, t);
        }
        function nl(e, t, n) {
          var r = e.tag, a = r === 5 || r === 6;
          if (a) e = a ? e.stateNode : e.stateNode.instance, t ? n.nodeType === 8 ? n.parentNode.insertBefore(e, t) : n.insertBefore(e, t) : (n.nodeType === 8 ? (t = n.parentNode).insertBefore(e, n) : (t = n).appendChild(e), (n = n._reactRootContainer) != null || t.onclick !== null || (t.onclick = Zr));
          else if (r !== 4 && (e = e.child) !== null) for (nl(e, t, n), e = e.sibling; e !== null; ) nl(e, t, n), e = e.sibling;
        }
        function rl(e, t, n) {
          var r = e.tag, a = r === 5 || r === 6;
          if (a) e = a ? e.stateNode : e.stateNode.instance, t ? n.insertBefore(e, t) : n.appendChild(e);
          else if (r !== 4 && (e = e.child) !== null) for (rl(e, t, n), e = e.sibling; e !== null; ) rl(e, t, n), e = e.sibling;
        }
        function cc(e, t, n) {
          for (var r, a, p = t, h = !1; ; ) {
            if (!h) {
              h = p.return;
              e: for (; ; ) {
                if (h === null) throw Error(m(160));
                switch (r = h.stateNode, h.tag) {
                  case 5:
                    a = !1;
                    break e;
                  case 3:
                  case 4:
                    r = r.containerInfo, a = !0;
                    break e;
                }
                h = h.return;
              }
              h = !0;
            }
            if (p.tag === 5 || p.tag === 6) {
              e: for (var w = e, W = p, V = n, ce = W; ; ) if (ic(w, ce, V), ce.child !== null && ce.tag !== 4) ce.child.return = ce, ce = ce.child;
              else {
                if (ce === W) break e;
                for (; ce.sibling === null; ) {
                  if (ce.return === null || ce.return === W) break e;
                  ce = ce.return;
                }
                ce.sibling.return = ce.return, ce = ce.sibling;
              }
              a ? (w = r, W = p.stateNode, w.nodeType === 8 ? w.parentNode.removeChild(W) : w.removeChild(W)) : r.removeChild(p.stateNode);
            } else if (p.tag === 4) {
              if (p.child !== null) {
                r = p.stateNode.containerInfo, a = !0, p.child.return = p, p = p.child;
                continue;
              }
            } else if (ic(e, p, n), p.child !== null) {
              p.child.return = p, p = p.child;
              continue;
            }
            if (p === t) break;
            for (; p.sibling === null; ) {
              if (p.return === null || p.return === t) return;
              (p = p.return).tag === 4 && (h = !1);
            }
            p.sibling.return = p.return, p = p.sibling;
          }
        }
        function ol(e, t) {
          switch (t.tag) {
            case 0:
            case 11:
            case 14:
            case 15:
            case 22:
              return void rc(3, t);
            case 1:
            case 12:
            case 17:
              return;
            case 5:
              var n = t.stateNode;
              if (n != null) {
                var r = t.memoizedProps, a = e !== null ? e.memoizedProps : r;
                e = t.type;
                var p = t.updateQueue;
                if (t.updateQueue = null, p !== null) {
                  for (n[ri] = r, e === "input" && r.type === "radio" && r.name != null && fn(n, r), Ei(e, a), t = Ei(e, r), a = 0; a < p.length; a += 2) {
                    var h = p[a], w = p[a + 1];
                    h === "style" ? ei(n, w) : h === "dangerouslySetInnerHTML" ? Pr(n, w) : h === "children" ? Kn(n, w) : Pt(n, h, w, t);
                  }
                  switch (e) {
                    case "input":
                      pt(n, r);
                      break;
                    case "textarea":
                      Rn(n, r);
                      break;
                    case "select":
                      t = n._wrapperState.wasMultiple, n._wrapperState.wasMultiple = !!r.multiple, (e = r.value) != null ? Dn(n, !!r.multiple, e, !1) : t !== !!r.multiple && (r.defaultValue != null ? Dn(n, !!r.multiple, r.defaultValue, !0) : Dn(n, !!r.multiple, r.multiple ? [] : "", !1));
                  }
                }
              }
              return;
            case 6:
              if (t.stateNode === null) throw Error(m(162));
              return void (t.stateNode.nodeValue = t.memoizedProps);
            case 3:
              return void ((t = t.stateNode).hydrate && (t.hydrate = !1, yi(t.containerInfo)));
            case 13:
              if (n = t, t.memoizedState === null ? r = !1 : (r = !0, n = t.child, sl = Nt()), n !== null) e: for (e = n; ; ) {
                if (e.tag === 5) p = e.stateNode, r ? typeof (p = p.style).setProperty == "function" ? p.setProperty("display", "none", "important") : p.display = "none" : (p = e.stateNode, a = (a = e.memoizedProps.style) != null && a.hasOwnProperty("display") ? a.display : null, p.style.display = _t("display", a));
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
              return void uc(t);
            case 19:
              return void uc(t);
          }
          throw Error(m(163));
        }
        function uc(e) {
          var t = e.updateQueue;
          if (t !== null) {
            e.updateQueue = null;
            var n = e.stateNode;
            n === null && (n = e.stateNode = new $c()), t.forEach(function(r) {
              var a = tu.bind(null, e, r);
              n.has(r) || (n.add(r), r.then(a, a));
            });
          }
        }
        var Kc = typeof WeakMap == "function" ? WeakMap : Map;
        function dc(e, t, n) {
          (n = uo(n, null)).tag = 3, n.payload = { element: null };
          var r = t.value;
          return n.callback = function() {
            qa || (qa = !0, ll = r), tl(e, t);
          }, n;
        }
        function pc(e, t, n) {
          (n = uo(n, null)).tag = 3;
          var r = e.type.getDerivedStateFromError;
          if (typeof r == "function") {
            var a = t.value;
            n.payload = function() {
              return tl(e, t), r(a);
            };
          }
          var p = e.stateNode;
          return p !== null && typeof p.componentDidCatch == "function" && (n.callback = function() {
            typeof r != "function" && (mo === null ? mo = /* @__PURE__ */ new Set([this]) : mo.add(this), tl(e, t));
            var h = t.stack;
            this.componentDidCatch(t.value, { componentStack: h !== null ? h : "" });
          }), n;
        }
        var fc, Qc = Math.ceil, Fa = et.ReactCurrentDispatcher, hc = et.ReactCurrentOwner, Ut = 0, il = 8, ar = 16, xr = 32, Wo = 0, Ua = 1, mc = 2, Va = 3, Ba = 4, al = 5, We = Ut, Cn = null, qe = null, dn = 0, Vt = Wo, Ha = null, Hr = 1073741823, Qi = 1073741823, $a = null, Yi = 0, Wa = !1, sl = 0, gc = 500, Ie = null, qa = !1, ll = null, mo = null, Ka = !1, Xi = null, Gi = 90, qo = null, Zi = 0, cl = null, Qa = 0;
        function Sr() {
          return (We & (ar | xr)) !== Ut ? 1073741821 - (Nt() / 10 | 0) : Qa !== 0 ? Qa : Qa = 1073741821 - (Nt() / 10 | 0);
        }
        function Ko(e, t, n) {
          if (!(2 & (t = t.mode))) return 1073741823;
          var r = Ft();
          if (!(4 & t)) return r === 99 ? 1073741823 : 1073741822;
          if ((We & ar) !== Ut) return dn;
          if (n !== null) e = Fo(e, 0 | n.timeoutMs || 5e3, 250);
          else switch (r) {
            case 99:
              e = 1073741823;
              break;
            case 98:
              e = Fo(e, 150, 100);
              break;
            case 97:
            case 96:
              e = Fo(e, 5e3, 250);
              break;
            case 95:
              e = 2;
              break;
            default:
              throw Error(m(326));
          }
          return Cn !== null && e === dn && --e, e;
        }
        function go(e, t) {
          if (50 < Zi) throw Zi = 0, cl = null, Error(m(185));
          if ((e = Ya(e, t)) !== null) {
            var n = Ft();
            t === 1073741823 ? (We & il) !== Ut && (We & (ar | xr)) === Ut ? ul(e) : (Tn(e), We === Ut && tn()) : Tn(e), (4 & We) === Ut || n !== 98 && n !== 99 || (qo === null ? qo = /* @__PURE__ */ new Map([[e, t]]) : ((n = qo.get(e)) === void 0 || n > t) && qo.set(e, t));
          }
        }
        function Ya(e, t) {
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
          return a !== null && (Cn === a && (Ga(t), Vt === Ba && Zo(a, dn)), Tc(a, t)), a;
        }
        function Xa(e) {
          var t = e.lastExpiredTime;
          if (t !== 0 || !Cc(e, t = e.firstPendingTime)) return t;
          var n = e.lastPingedTime;
          return 2 >= (e = n > (e = e.nextKnownPendingLevel) ? n : e) && t !== e ? 0 : e;
        }
        function Tn(e) {
          if (e.lastExpiredTime !== 0) e.callbackExpirationTime = 1073741823, e.callbackPriority = 99, e.callbackNode = Vi(ul.bind(null, e));
          else {
            var t = Xa(e), n = e.callbackNode;
            if (t === 0) n !== null && (e.callbackNode = null, e.callbackExpirationTime = 0, e.callbackPriority = 90);
            else {
              var r = Sr();
              if (t === 1073741823 ? r = 99 : t === 1 || t === 2 ? r = 95 : r = 0 >= (r = 10 * (1073741821 - t) - 10 * (1073741821 - r)) ? 99 : 250 >= r ? 98 : 5250 >= r ? 97 : 95, n !== null) {
                var a = e.callbackPriority;
                if (e.callbackExpirationTime === t && a >= r) return;
                n !== jn && vt(n);
              }
              e.callbackExpirationTime = t, e.callbackPriority = r, t = t === 1073741823 ? Vi(ul.bind(null, e)) : Ui(r, yc.bind(null, e), { timeout: 10 * (1073741821 - t) - Nt() }), e.callbackNode = t;
            }
          }
        }
        function yc(e, t) {
          if (Qa = 0, t) return yl(e, t = Sr()), Tn(e), null;
          var n = Xa(e);
          if (n !== 0) {
            if (t = e.callbackNode, (We & (ar | xr)) !== Ut) throw Error(m(327));
            if (mi(), e === Cn && n === dn || Qo(e, n), qe !== null) {
              var r = We;
              We |= ar;
              for (var a = wc(); ; ) try {
                Xc();
                break;
              } catch (w) {
                kc(e, w);
              }
              if (ir(), We = r, Fa.current = a, Vt === Ua) throw t = Ha, Qo(e, n), Zo(e, n), Tn(e), t;
              if (qe === null) switch (a = e.finishedWork = e.current.alternate, e.finishedExpirationTime = n, r = Vt, Cn = null, r) {
                case Wo:
                case Ua:
                  throw Error(m(345));
                case mc:
                  yl(e, 2 < n ? 2 : n);
                  break;
                case Va:
                  if (Zo(e, n), n === (r = e.lastSuspendedTime) && (e.nextKnownPendingLevel = dl(a)), Hr === 1073741823 && 10 < (a = sl + gc - Nt())) {
                    if (Wa) {
                      var p = e.lastPingedTime;
                      if (p === 0 || p >= n) {
                        e.lastPingedTime = n, Qo(e, n);
                        break;
                      }
                    }
                    if ((p = Xa(e)) !== 0 && p !== n) break;
                    if (r !== 0 && r !== n) {
                      e.lastPingedTime = r;
                      break;
                    }
                    e.timeoutHandle = Ni(Yo.bind(null, e), a);
                    break;
                  }
                  Yo(e);
                  break;
                case Ba:
                  if (Zo(e, n), n === (r = e.lastSuspendedTime) && (e.nextKnownPendingLevel = dl(a)), Wa && ((a = e.lastPingedTime) === 0 || a >= n)) {
                    e.lastPingedTime = n, Qo(e, n);
                    break;
                  }
                  if ((a = Xa(e)) !== 0 && a !== n) break;
                  if (r !== 0 && r !== n) {
                    e.lastPingedTime = r;
                    break;
                  }
                  if (Qi !== 1073741823 ? r = 10 * (1073741821 - Qi) - Nt() : Hr === 1073741823 ? r = 0 : (r = 10 * (1073741821 - Hr) - 5e3, 0 > (r = (a = Nt()) - r) && (r = 0), (n = 10 * (1073741821 - n) - a) < (r = (120 > r ? 120 : 480 > r ? 480 : 1080 > r ? 1080 : 1920 > r ? 1920 : 3e3 > r ? 3e3 : 4320 > r ? 4320 : 1960 * Qc(r / 1960)) - r) && (r = n)), 10 < r) {
                    e.timeoutHandle = Ni(Yo.bind(null, e), r);
                    break;
                  }
                  Yo(e);
                  break;
                case al:
                  if (Hr !== 1073741823 && $a !== null) {
                    p = Hr;
                    var h = $a;
                    if (0 >= (r = 0 | h.busyMinDurationMs) ? r = 0 : (a = 0 | h.busyDelayMs, r = (p = Nt() - (10 * (1073741821 - p) - (0 | h.timeoutMs || 5e3))) <= a ? 0 : a + r - p), 10 < r) {
                      Zo(e, n), e.timeoutHandle = Ni(Yo.bind(null, e), r);
                      break;
                    }
                  }
                  Yo(e);
                  break;
                default:
                  throw Error(m(329));
              }
              if (Tn(e), e.callbackNode === t) return yc.bind(null, e);
            }
          }
          return null;
        }
        function ul(e) {
          var t = e.lastExpiredTime;
          if (t = t !== 0 ? t : 1073741823, (We & (ar | xr)) !== Ut) throw Error(m(327));
          if (mi(), e === Cn && t === dn || Qo(e, t), qe !== null) {
            var n = We;
            We |= ar;
            for (var r = wc(); ; ) try {
              Yc();
              break;
            } catch (a) {
              kc(e, a);
            }
            if (ir(), We = n, Fa.current = r, Vt === Ua) throw n = Ha, Qo(e, t), Zo(e, t), Tn(e), n;
            if (qe !== null) throw Error(m(261));
            e.finishedWork = e.current.alternate, e.finishedExpirationTime = t, Cn = null, Yo(e), Tn(e);
          }
          return null;
        }
        function bc(e, t) {
          var n = We;
          We |= 1;
          try {
            return e(t);
          } finally {
            (We = n) === Ut && tn();
          }
        }
        function vc(e, t) {
          var n = We;
          We &= -2, We |= il;
          try {
            return e(t);
          } finally {
            (We = n) === Ut && tn();
          }
        }
        function Qo(e, t) {
          e.finishedWork = null, e.finishedExpirationTime = 0;
          var n = e.timeoutHandle;
          if (n !== -1 && (e.timeoutHandle = -1, ni(n)), qe !== null) for (n = qe.return; n !== null; ) {
            var r = n;
            switch (r.tag) {
              case 1:
                (r = r.type.childContextTypes) != null && Oe();
                break;
              case 3:
                pi(), x(ie), x(Y);
                break;
              case 5:
                js(r);
                break;
              case 4:
                pi();
                break;
              case 13:
              case 19:
                x(Ct);
                break;
              case 10:
                Vo(r);
            }
            n = n.return;
          }
          Cn = e, qe = Go(e.current, null), dn = t, Vt = Wo, Ha = null, Qi = Hr = 1073741823, $a = null, Yi = 0, Wa = !1;
        }
        function kc(e, t) {
          for (; ; ) {
            try {
              if (ir(), Pa.current = Aa, Da) for (var n = Mt.memoizedState; n !== null; ) {
                var r = n.queue;
                r !== null && (r.pending = null), n = n.next;
              }
              if (fo = 0, Xt = rn = Mt = null, Da = !1, qe === null || qe.return === null) return Vt = Ua, Ha = t, qe = null;
              e: {
                var a = e, p = qe.return, h = qe, w = t;
                if (t = dn, h.effectTag |= 2048, h.firstEffect = h.lastEffect = null, w !== null && typeof w == "object" && typeof w.then == "function") {
                  var W = w;
                  if (!(2 & h.mode)) {
                    var V = h.alternate;
                    V ? (h.updateQueue = V.updateQueue, h.memoizedState = V.memoizedState, h.expirationTime = V.expirationTime) : (h.updateQueue = null, h.memoizedState = null);
                  }
                  var ce = !!(1 & Ct.current), Me = p;
                  do {
                    var Ve;
                    if (Ve = Me.tag === 13) {
                      var ot = Me.memoizedState;
                      if (ot !== null) Ve = ot.dehydrated !== null;
                      else {
                        var Vn = Me.memoizedProps;
                        Ve = Vn.fallback !== void 0 && (Vn.unstable_avoidThisFallback !== !0 || !ce);
                      }
                    }
                    if (Ve) {
                      var on = Me.updateQueue;
                      if (on === null) {
                        var q = /* @__PURE__ */ new Set();
                        q.add(W), Me.updateQueue = q;
                      } else on.add(W);
                      if (!(2 & Me.mode)) {
                        if (Me.effectTag |= 64, h.effectTag &= -2981, h.tag === 1) if (h.alternate === null) h.tag = 17;
                        else {
                          var H = uo(1073741823, null);
                          H.tag = 2, po(h, H);
                        }
                        h.expirationTime = 1073741823;
                        break e;
                      }
                      w = void 0, h = t;
                      var re = a.pingCache;
                      if (re === null ? (re = a.pingCache = new Kc(), w = /* @__PURE__ */ new Set(), re.set(W, w)) : (w = re.get(W)) === void 0 && (w = /* @__PURE__ */ new Set(), re.set(W, w)), !w.has(h)) {
                        w.add(h);
                        var ve = eu.bind(null, a, W, h);
                        W.then(ve, ve);
                      }
                      Me.effectTag |= 4096, Me.expirationTime = t;
                      break e;
                    }
                    Me = Me.return;
                  } while (Me !== null);
                  w = Error((Kt(h.type) || "A React component") + ` suspended while rendering, but no fallback UI was specified.

Add a <Suspense fallback=...> component higher in the tree to provide a loading indicator or placeholder to display.` + zt(h));
                }
                Vt !== al && (Vt = mc), w = el(w, h), Me = p;
                do {
                  switch (Me.tag) {
                    case 3:
                      W = w, Me.effectTag |= 4096, Me.expirationTime = t, Sl(Me, dc(Me, W, t));
                      break e;
                    case 1:
                      W = w;
                      var xe = Me.type, Re = Me.stateNode;
                      if (!(64 & Me.effectTag || typeof xe.getDerivedStateFromError != "function" && (Re === null || typeof Re.componentDidCatch != "function" || mo !== null && mo.has(Re)))) {
                        Me.effectTag |= 4096, Me.expirationTime = t, Sl(Me, pc(Me, W, t));
                        break e;
                      }
                  }
                  Me = Me.return;
                } while (Me !== null);
              }
              qe = xc(qe);
            } catch (Fe) {
              t = Fe;
              continue;
            }
            break;
          }
        }
        function wc() {
          var e = Fa.current;
          return Fa.current = Aa, e === null ? Aa : e;
        }
        function _c(e, t) {
          e < Hr && 2 < e && (Hr = e), t !== null && e < Qi && 2 < e && (Qi = e, $a = t);
        }
        function Ga(e) {
          e > Yi && (Yi = e);
        }
        function Yc() {
          for (; qe !== null; ) qe = Ec(qe);
        }
        function Xc() {
          for (; qe !== null && !so(); ) qe = Ec(qe);
        }
        function Ec(e) {
          var t = fc(e.alternate, e, dn);
          return e.memoizedProps = e.pendingProps, t === null && (t = xc(e)), hc.current = null, t;
        }
        function xc(e) {
          qe = e;
          do {
            var t = qe.alternate;
            if (e = qe.return, 2048 & qe.effectTag) {
              if ((t = Hc(qe)) !== null) return t.effectTag &= 2047, t;
              e !== null && (e.firstEffect = e.lastEffect = null, e.effectTag |= 2048);
            } else {
              if (t = Bc(t, qe, dn), dn === 1 || qe.childExpirationTime !== 1) {
                for (var n = 0, r = qe.child; r !== null; ) {
                  var a = r.expirationTime, p = r.childExpirationTime;
                  a > n && (n = a), p > n && (n = p), r = r.sibling;
                }
                qe.childExpirationTime = n;
              }
              if (t !== null) return t;
              e !== null && !(2048 & e.effectTag) && (e.firstEffect === null && (e.firstEffect = qe.firstEffect), qe.lastEffect !== null && (e.lastEffect !== null && (e.lastEffect.nextEffect = qe.firstEffect), e.lastEffect = qe.lastEffect), 1 < qe.effectTag && (e.lastEffect !== null ? e.lastEffect.nextEffect = qe : e.firstEffect = qe, e.lastEffect = qe));
            }
            if ((t = qe.sibling) !== null) return t;
            qe = e;
          } while (qe !== null);
          return Vt === Wo && (Vt = al), null;
        }
        function dl(e) {
          var t = e.expirationTime;
          return t > (e = e.childExpirationTime) ? t : e;
        }
        function Yo(e) {
          var t = Ft();
          return or(99, Gc.bind(null, e, t)), null;
        }
        function Gc(e, t) {
          do
            mi();
          while (Xi !== null);
          if ((We & (ar | xr)) !== Ut) throw Error(m(327));
          var n = e.finishedWork, r = e.finishedExpirationTime;
          if (n === null) return null;
          if (e.finishedWork = null, e.finishedExpirationTime = 0, n === e.current) throw Error(m(177));
          e.callbackNode = null, e.callbackExpirationTime = 0, e.callbackPriority = 90, e.nextKnownPendingLevel = 0;
          var a = dl(n);
          if (e.firstPendingTime = a, r <= e.lastSuspendedTime ? e.firstSuspendedTime = e.lastSuspendedTime = e.nextKnownPendingLevel = 0 : r <= e.firstSuspendedTime && (e.firstSuspendedTime = r - 1), r <= e.lastPingedTime && (e.lastPingedTime = 0), r <= e.lastExpiredTime && (e.lastExpiredTime = 0), e === Cn && (qe = Cn = null, dn = 0), 1 < n.effectTag ? n.lastEffect !== null ? (n.lastEffect.nextEffect = n, a = n.firstEffect) : a = n : a = n.firstEffect, a !== null) {
            var p = We;
            We |= xr, hc.current = null, Do = An;
            var h = ia();
            if (Ci(h)) {
              if ("selectionStart" in h) var w = { start: h.selectionStart, end: h.selectionEnd };
              else e: {
                var W = (w = (w = h.ownerDocument) && w.defaultView || window).getSelection && w.getSelection();
                if (W && W.rangeCount !== 0) {
                  w = W.anchorNode;
                  var V = W.anchorOffset, ce = W.focusNode;
                  W = W.focusOffset;
                  try {
                    w.nodeType, ce.nodeType;
                  } catch {
                    w = null;
                    break e;
                  }
                  var Me = 0, Ve = -1, ot = -1, Vn = 0, on = 0, q = h, H = null;
                  t: for (; ; ) {
                    for (var re; q !== w || V !== 0 && q.nodeType !== 3 || (Ve = Me + V), q !== ce || W !== 0 && q.nodeType !== 3 || (ot = Me + W), q.nodeType === 3 && (Me += q.nodeValue.length), (re = q.firstChild) !== null; ) H = q, q = re;
                    for (; ; ) {
                      if (q === h) break t;
                      if (H === w && ++Vn === V && (Ve = Me), H === ce && ++on === W && (ot = Me), (re = q.nextSibling) !== null) break;
                      H = (q = H).parentNode;
                    }
                    q = re;
                  }
                  w = Ve === -1 || ot === -1 ? null : { start: Ve, end: ot };
                } else w = null;
              }
              w = w || { start: 0, end: 0 };
            } else w = null;
            Et = { activeElementDetached: null, focusedElem: h, selectionRange: w }, An = !1, Ie = a;
            do
              try {
                Zc();
              } catch (Xe) {
                if (Ie === null) throw Error(m(330));
                Xo(Ie, Xe), Ie = Ie.nextEffect;
              }
            while (Ie !== null);
            Ie = a;
            do
              try {
                for (h = e, w = t; Ie !== null; ) {
                  var ve = Ie.effectTag;
                  if (16 & ve && Kn(Ie.stateNode, ""), 128 & ve) {
                    var xe = Ie.alternate;
                    if (xe !== null) {
                      var Re = xe.ref;
                      Re !== null && (typeof Re == "function" ? Re(null) : Re.current = null);
                    }
                  }
                  switch (1038 & ve) {
                    case 2:
                      lc(Ie), Ie.effectTag &= -3;
                      break;
                    case 6:
                      lc(Ie), Ie.effectTag &= -3, ol(Ie.alternate, Ie);
                      break;
                    case 1024:
                      Ie.effectTag &= -1025;
                      break;
                    case 1028:
                      Ie.effectTag &= -1025, ol(Ie.alternate, Ie);
                      break;
                    case 4:
                      ol(Ie.alternate, Ie);
                      break;
                    case 8:
                      cc(h, V = Ie, w), ac(V);
                  }
                  Ie = Ie.nextEffect;
                }
              } catch (Xe) {
                if (Ie === null) throw Error(m(330));
                Xo(Ie, Xe), Ie = Ie.nextEffect;
              }
            while (Ie !== null);
            if (Re = Et, xe = ia(), ve = Re.focusedElem, w = Re.selectionRange, xe !== ve && ve && ve.ownerDocument && Si(ve.ownerDocument.documentElement, ve)) {
              for (w !== null && Ci(ve) && (xe = w.start, (Re = w.end) === void 0 && (Re = xe), "selectionStart" in ve ? (ve.selectionStart = xe, ve.selectionEnd = Math.min(Re, ve.value.length)) : (Re = (xe = ve.ownerDocument || document) && xe.defaultView || window).getSelection && (Re = Re.getSelection(), V = ve.textContent.length, h = Math.min(w.start, V), w = w.end === void 0 ? h : Math.min(w.end, V), !Re.extend && h > w && (V = w, w = h, h = V), V = oa(ve, h), ce = oa(ve, w), V && ce && (Re.rangeCount !== 1 || Re.anchorNode !== V.node || Re.anchorOffset !== V.offset || Re.focusNode !== ce.node || Re.focusOffset !== ce.offset) && ((xe = xe.createRange()).setStart(V.node, V.offset), Re.removeAllRanges(), h > w ? (Re.addRange(xe), Re.extend(ce.node, ce.offset)) : (xe.setEnd(ce.node, ce.offset), Re.addRange(xe))))), xe = [], Re = ve; Re = Re.parentNode; ) Re.nodeType === 1 && xe.push({ element: Re, left: Re.scrollLeft, top: Re.scrollTop });
              for (typeof ve.focus == "function" && ve.focus(), ve = 0; ve < xe.length; ve++) (Re = xe[ve]).element.scrollLeft = Re.left, Re.element.scrollTop = Re.top;
            }
            An = !!Do, Et = Do = null, e.current = n, Ie = a;
            do
              try {
                for (ve = e; Ie !== null; ) {
                  var Fe = Ie.effectTag;
                  if (36 & Fe && qc(ve, Ie.alternate, Ie), 128 & Fe) {
                    xe = void 0;
                    var at = Ie.ref;
                    if (at !== null) {
                      var It = Ie.stateNode;
                      Ie.tag, xe = It, typeof at == "function" ? at(xe) : at.current = xe;
                    }
                  }
                  Ie = Ie.nextEffect;
                }
              } catch (Xe) {
                if (Ie === null) throw Error(m(330));
                Xo(Ie, Xe), Ie = Ie.nextEffect;
              }
            while (Ie !== null);
            Ie = null, Wt(), We = p;
          } else e.current = n;
          if (Ka) Ka = !1, Xi = e, Gi = t;
          else for (Ie = a; Ie !== null; ) t = Ie.nextEffect, Ie.nextEffect = null, Ie = t;
          if ((t = e.firstPendingTime) === 0 && (mo = null), t === 1073741823 ? e === cl ? Zi++ : (Zi = 0, cl = e) : Zi = 0, typeof pl == "function" && pl(n.stateNode, r), Tn(e), qa) throw qa = !1, e = ll, ll = null, e;
          return (We & il) !== Ut || tn(), null;
        }
        function Zc() {
          for (; Ie !== null; ) {
            var e = Ie.effectTag;
            256 & e && Wc(Ie.alternate, Ie), !(512 & e) || Ka || (Ka = !0, Ui(97, function() {
              return mi(), null;
            })), Ie = Ie.nextEffect;
          }
        }
        function mi() {
          if (Gi !== 90) {
            var e = 97 < Gi ? 97 : Gi;
            return Gi = 90, or(e, Jc);
          }
        }
        function Jc() {
          if (Xi === null) return !1;
          var e = Xi;
          if (Xi = null, (We & (ar | xr)) !== Ut) throw Error(m(331));
          var t = We;
          for (We |= xr, e = e.current.firstEffect; e !== null; ) {
            try {
              var n = e;
              if (512 & n.effectTag) switch (n.tag) {
                case 0:
                case 11:
                case 15:
                case 22:
                  rc(5, n), oc(5, n);
              }
            } catch (r) {
              if (e === null) throw Error(m(330));
              Xo(e, r);
            }
            n = e.nextEffect, e.nextEffect = null, e = n;
          }
          return We = t, tn(), !0;
        }
        function Sc(e, t, n) {
          po(e, t = dc(e, t = el(n, t), 1073741823)), (e = Ya(e, 1073741823)) !== null && Tn(e);
        }
        function Xo(e, t) {
          if (e.tag === 3) Sc(e, e, t);
          else for (var n = e.return; n !== null; ) {
            if (n.tag === 3) {
              Sc(n, e, t);
              break;
            }
            if (n.tag === 1) {
              var r = n.stateNode;
              if (typeof n.type.getDerivedStateFromError == "function" || typeof r.componentDidCatch == "function" && (mo === null || !mo.has(r))) {
                po(n, e = pc(n, e = el(t, e), 1073741823)), (n = Ya(n, 1073741823)) !== null && Tn(n);
                break;
              }
            }
            n = n.return;
          }
        }
        function eu(e, t, n) {
          var r = e.pingCache;
          r !== null && r.delete(t), Cn === e && dn === n ? Vt === Ba || Vt === Va && Hr === 1073741823 && Nt() - sl < gc ? Qo(e, dn) : Wa = !0 : Cc(e, n) && ((t = e.lastPingedTime) !== 0 && t < n || (e.lastPingedTime = n, Tn(e)));
        }
        function tu(e, t) {
          var n = e.stateNode;
          n !== null && n.delete(t), (t = 0) == 0 && (t = Ko(t = Sr(), e, null)), (e = Ya(e, t)) !== null && Tn(e);
        }
        fc = function(e, t, n) {
          var r = t.expirationTime;
          if (e !== null) {
            var a = t.pendingProps;
            if (e.memoizedProps !== a || ie.current) Er = !0;
            else {
              if (r < n) {
                switch (Er = !1, t.tag) {
                  case 3:
                    Yl(t), Qs();
                    break;
                  case 5:
                    if (Rl(t), 4 & t.mode && n !== 1 && a.hidden) return t.expirationTime = t.childExpirationTime = 1, null;
                    break;
                  case 1:
                    de(t.type) && st(t);
                    break;
                  case 4:
                    As(t, t.stateNode.containerInfo);
                    break;
                  case 10:
                    r = t.memoizedProps.value, a = t.type._context, z(Ur, a._currentValue), a._currentValue = r;
                    break;
                  case 13:
                    if (t.memoizedState !== null) return (r = t.child.childExpirationTime) !== 0 && r >= n ? Jl(e, t, n) : (z(Ct, 1 & Ct.current), (t = Br(e, t, n)) !== null ? t.sibling : null);
                    z(Ct, 1 & Ct.current);
                    break;
                  case 19:
                    if (r = t.childExpirationTime >= n, 64 & e.effectTag) {
                      if (r) return tc(e, t, n);
                      t.effectTag |= 64;
                    }
                    if ((a = t.memoizedState) !== null && (a.rendering = null, a.tail = null), z(Ct, Ct.current), !r) return null;
                }
                return Br(e, t, n);
              }
              Er = !1;
            }
          } else Er = !1;
          switch (t.expirationTime = 0, t.tag) {
            case 2:
              if (r = t.type, e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= 2), e = t.pendingProps, a = he(t, Y.current), ui(t, n), a = Us(null, t, r, e, a, n), t.effectTag |= 1, typeof a == "object" && a !== null && typeof a.render == "function" && a.$$typeof === void 0) {
                if (t.tag = 1, t.memoizedState = null, t.updateQueue = null, de(r)) {
                  var p = !0;
                  st(t);
                } else p = !1;
                t.memoizedState = a.state !== null && a.state !== void 0 ? a.state : null, Rs(t);
                var h = r.getDerivedStateFromProps;
                typeof h == "function" && Sa(t, r, h, e), a.updater = Ca, t.stateNode = a, a._reactInternalFiber = t, Is(t, r, e, n), t = Xs(null, t, r, !0, p, n);
              } else t.tag = 0, Un(null, t, a, n), t = t.child;
              return t;
            case 16:
              e: {
                if (a = t.elementType, e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= 2), e = t.pendingProps, (function(ce) {
                  if (ce._status === -1) {
                    ce._status = 0;
                    var Me = ce._ctor;
                    Me = Me(), ce._result = Me, Me.then(function(Ve) {
                      ce._status === 0 && (Ve = Ve.default, ce._status = 1, ce._result = Ve);
                    }, function(Ve) {
                      ce._status === 0 && (ce._status = 2, ce._result = Ve);
                    });
                  }
                })(a), a._status !== 1) throw a._result;
                switch (a = a._result, t.type = a, p = t.tag = (function(ce) {
                  if (typeof ce == "function") return hl(ce) ? 1 : 0;
                  if (ce != null) {
                    if ((ce = ce.$$typeof) === sr) return 11;
                    if (ce === Wr) return 14;
                  }
                  return 2;
                })(a), e = nn(a, e), p) {
                  case 0:
                    t = Ys(null, t, a, e, n);
                    break e;
                  case 1:
                    t = Ql(null, t, a, e, n);
                    break e;
                  case 11:
                    t = $l(null, t, a, e, n);
                    break e;
                  case 14:
                    t = Wl(null, t, a, nn(a.type, e), r, n);
                    break e;
                }
                throw Error(m(306, a, ""));
              }
              return t;
            case 0:
              return r = t.type, a = t.pendingProps, Ys(e, t, r, a = t.elementType === r ? a : nn(r, a), n);
            case 1:
              return r = t.type, a = t.pendingProps, Ql(e, t, r, a = t.elementType === r ? a : nn(r, a), n);
            case 3:
              if (Yl(t), r = t.updateQueue, e === null || r === null) throw Error(m(282));
              if (r = t.pendingProps, a = (a = t.memoizedState) !== null ? a.element : null, Ms(e, t), Bi(t, r, null, n), (r = t.memoizedState.element) === a) Qs(), t = Br(e, t, n);
              else {
                if ((a = t.stateNode.hydrate) && (ho = zr(t.stateNode.containerInfo.firstChild), Vr = t, a = $o = !0), a) for (n = zs(t, null, r, n), t.child = n; n; ) n.effectTag = -3 & n.effectTag | 1024, n = n.sibling;
                else Un(e, t, r, n), Qs();
                t = t.child;
              }
              return t;
            case 5:
              return Rl(t), e === null && Ks(t), r = t.type, a = t.pendingProps, p = e !== null ? e.memoizedProps : null, h = a.children, Oi(r, a) ? h = null : p !== null && Oi(r, p) && (t.effectTag |= 16), Kl(e, t), 4 & t.mode && n !== 1 && a.hidden ? (t.expirationTime = t.childExpirationTime = 1, t = null) : (Un(e, t, h, n), t = t.child), t;
            case 6:
              return e === null && Ks(t), null;
            case 13:
              return Jl(e, t, n);
            case 4:
              return As(t, t.stateNode.containerInfo), r = t.pendingProps, e === null ? t.child = di(t, null, r, n) : Un(e, t, r, n), t.child;
            case 11:
              return r = t.type, a = t.pendingProps, $l(e, t, r, a = t.elementType === r ? a : nn(r, a), n);
            case 7:
              return Un(e, t, t.pendingProps, n), t.child;
            case 8:
            case 12:
              return Un(e, t, t.pendingProps.children, n), t.child;
            case 10:
              e: {
                r = t.type._context, a = t.pendingProps, h = t.memoizedProps, p = a.value;
                var w = t.type._context;
                if (z(Ur, w._currentValue), w._currentValue = p, h !== null) if (w = h.value, (p = rr(w, p) ? 0 : 0 | (typeof r._calculateChangedBits == "function" ? r._calculateChangedBits(w, p) : 1073741823)) === 0) {
                  if (h.children === a.children && !ie.current) {
                    t = Br(e, t, n);
                    break e;
                  }
                } else for ((w = t.child) !== null && (w.return = t); w !== null; ) {
                  var W = w.dependencies;
                  if (W !== null) {
                    h = w.child;
                    for (var V = W.firstContext; V !== null; ) {
                      if (V.context === r && (V.observedBits & p) !== 0) {
                        w.tag === 1 && ((V = uo(n, null)).tag = 2, po(w, V)), w.expirationTime < n && (w.expirationTime = n), (V = w.alternate) !== null && V.expirationTime < n && (V.expirationTime = n), xl(w.return, n), W.expirationTime < n && (W.expirationTime = n);
                        break;
                      }
                      V = V.next;
                    }
                  } else h = w.tag === 10 && w.type === t.type ? null : w.child;
                  if (h !== null) h.return = w;
                  else for (h = w; h !== null; ) {
                    if (h === t) {
                      h = null;
                      break;
                    }
                    if ((w = h.sibling) !== null) {
                      w.return = h.return, h = w;
                      break;
                    }
                    h = h.return;
                  }
                  w = h;
                }
                Un(e, t, a.children, n), t = t.child;
              }
              return t;
            case 9:
              return a = t.type, r = (p = t.pendingProps).children, ui(t, n), r = r(a = Ln(a, p.unstable_observedBits)), t.effectTag |= 1, Un(e, t, r, n), t.child;
            case 14:
              return p = nn(a = t.type, t.pendingProps), Wl(e, t, a, p = nn(a.type, p), r, n);
            case 15:
              return ql(e, t, t.type, t.pendingProps, r, n);
            case 17:
              return r = t.type, a = t.pendingProps, a = t.elementType === r ? a : nn(r, a), e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= 2), t.tag = 1, de(r) ? (e = !0, st(t)) : e = !1, ui(t, n), Nl(t, r, a), Is(t, r, a, n), Xs(null, t, r, !0, e, n);
            case 19:
              return tc(e, t, n);
          }
          throw Error(m(156, t.tag));
        };
        var pl = null, fl = null;
        function nu(e, t, n, r) {
          this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = r, this.effectTag = 0, this.lastEffect = this.firstEffect = this.nextEffect = null, this.childExpirationTime = this.expirationTime = 0, this.alternate = null;
        }
        function Cr(e, t, n, r) {
          return new nu(e, t, n, r);
        }
        function hl(e) {
          return !(!(e = e.prototype) || !e.isReactComponent);
        }
        function Go(e, t) {
          var n = e.alternate;
          return n === null ? ((n = Cr(e.tag, t, e.key, e.mode)).elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.effectTag = 0, n.nextEffect = null, n.firstEffect = null, n.lastEffect = null), n.childExpirationTime = e.childExpirationTime, n.expirationTime = e.expirationTime, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : { expirationTime: t.expirationTime, firstContext: t.firstContext, responders: t.responders }, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n;
        }
        function Za(e, t, n, r, a, p) {
          var h = 2;
          if (r = e, typeof e == "function") hl(e) && (h = 1);
          else if (typeof e == "string") h = 5;
          else e: switch (e) {
            case Nn:
              return yo(n.children, a, p, t);
            case pn:
              h = 8, a |= 7;
              break;
            case wo:
              h = 8, a |= 1;
              break;
            case Hn:
              return (e = Cr(12, n, t, 8 | a)).elementType = Hn, e.type = Hn, e.expirationTime = p, e;
            case Bt:
              return (e = Cr(13, n, t, a)).type = Bt, e.elementType = Bt, e.expirationTime = p, e;
            case $r:
              return (e = Cr(19, n, t, a)).elementType = $r, e.expirationTime = p, e;
            default:
              if (typeof e == "object" && e !== null) switch (e.$$typeof) {
                case $n:
                  h = 10;
                  break e;
                case an:
                  h = 9;
                  break e;
                case sr:
                  h = 11;
                  break e;
                case Wr:
                  h = 14;
                  break e;
                case _o:
                  h = 16, r = null;
                  break e;
                case Eo:
                  h = 22;
                  break e;
              }
              throw Error(m(130, e == null ? e : typeof e, ""));
          }
          return (t = Cr(h, n, t, a)).elementType = e, t.type = r, t.expirationTime = p, t;
        }
        function yo(e, t, n, r) {
          return (e = Cr(7, e, r, t)).expirationTime = n, e;
        }
        function ml(e, t, n) {
          return (e = Cr(6, e, null, t)).expirationTime = n, e;
        }
        function gl(e, t, n) {
          return (t = Cr(4, e.children !== null ? e.children : [], e.key, t)).expirationTime = n, t.stateNode = { containerInfo: e.containerInfo, pendingChildren: null, implementation: e.implementation }, t;
        }
        function ru(e, t, n) {
          this.tag = t, this.current = null, this.containerInfo = e, this.pingCache = this.pendingChildren = null, this.finishedExpirationTime = 0, this.finishedWork = null, this.timeoutHandle = -1, this.pendingContext = this.context = null, this.hydrate = n, this.callbackNode = null, this.callbackPriority = 90, this.lastExpiredTime = this.lastPingedTime = this.nextKnownPendingLevel = this.lastSuspendedTime = this.firstSuspendedTime = this.firstPendingTime = 0;
        }
        function Cc(e, t) {
          var n = e.firstSuspendedTime;
          return e = e.lastSuspendedTime, n !== 0 && n >= t && e <= t;
        }
        function Zo(e, t) {
          var n = e.firstSuspendedTime, r = e.lastSuspendedTime;
          n < t && (e.firstSuspendedTime = t), (r > t || n === 0) && (e.lastSuspendedTime = t), t <= e.lastPingedTime && (e.lastPingedTime = 0), t <= e.lastExpiredTime && (e.lastExpiredTime = 0);
        }
        function Tc(e, t) {
          t > e.firstPendingTime && (e.firstPendingTime = t);
          var n = e.firstSuspendedTime;
          n !== 0 && (t >= n ? e.firstSuspendedTime = e.lastSuspendedTime = e.nextKnownPendingLevel = 0 : t >= e.lastSuspendedTime && (e.lastSuspendedTime = t + 1), t > e.nextKnownPendingLevel && (e.nextKnownPendingLevel = t));
        }
        function yl(e, t) {
          var n = e.lastExpiredTime;
          (n === 0 || n > t) && (e.lastExpiredTime = t);
        }
        function Ja(e, t, n, r) {
          var a = t.current, p = Sr(), h = Hi.suspense;
          p = Ko(p, a, h);
          e: if (n) {
            t: {
              if (rt(n = n._reactInternalFiber) !== n || n.tag !== 1) throw Error(m(170));
              var w = n;
              do {
                switch (w.tag) {
                  case 3:
                    w = w.stateNode.context;
                    break t;
                  case 1:
                    if (de(w.type)) {
                      w = w.stateNode.__reactInternalMemoizedMergedChildContext;
                      break t;
                    }
                }
                w = w.return;
              } while (w !== null);
              throw Error(m(171));
            }
            if (n.tag === 1) {
              var W = n.type;
              if (de(W)) {
                n = ze(n, W, w);
                break e;
              }
            }
            n = w;
          } else n = K;
          return t.context === null ? t.context = n : t.pendingContext = n, (t = uo(p, h)).payload = { element: e }, (r = r === void 0 ? null : r) !== null && (t.callback = r), po(a, t), go(a, p), p;
        }
        function bl(e) {
          return (e = e.current).child ? (e.child.tag, e.child.stateNode) : null;
        }
        function Oc(e, t) {
          (e = e.memoizedState) !== null && e.dehydrated !== null && e.retryTime < t && (e.retryTime = t);
        }
        function vl(e, t) {
          Oc(e, t), (e = e.alternate) && Oc(e, t);
        }
        function kl(e, t, n) {
          var r = new ru(e, t, n = n != null && n.hydrate === !0), a = Cr(3, null, null, t === 2 ? 7 : t === 1 ? 3 : 0);
          r.current = a, a.stateNode = r, Rs(a), e[Ro] = r.current, n && t !== 0 && (function(p, h) {
            var w = Ge(h);
            ln.forEach(function(W) {
              nt(W, h, w);
            }), Xr.forEach(function(W) {
              nt(W, h, w);
            });
          })(0, e.nodeType === 9 ? e : e.ownerDocument), this._internalRoot = r;
        }
        function Ji(e) {
          return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11 && (e.nodeType !== 8 || e.nodeValue !== " react-mount-point-unstable "));
        }
        function es(e, t, n, r, a) {
          var p = n._reactRootContainer;
          if (p) {
            var h = p._internalRoot;
            if (typeof a == "function") {
              var w = a;
              a = function() {
                var V = bl(h);
                w.call(V);
              };
            }
            Ja(t, h, e, a);
          } else {
            if (p = n._reactRootContainer = (function(V, ce) {
              if (ce || (ce = !(!(ce = V ? V.nodeType === 9 ? V.documentElement : V.firstChild : null) || ce.nodeType !== 1 || !ce.hasAttribute("data-reactroot"))), !ce) for (var Me; Me = V.lastChild; ) V.removeChild(Me);
              return new kl(V, 0, ce ? { hydrate: !0 } : void 0);
            })(n, r), h = p._internalRoot, typeof a == "function") {
              var W = a;
              a = function() {
                var V = bl(h);
                W.call(V);
              };
            }
            vc(function() {
              Ja(t, h, e, a);
            });
          }
          return bl(h);
        }
        function Nc(e, t) {
          var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
          if (!Ji(t)) throw Error(m(200));
          return (function(r, a, p) {
            var h = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
            return { $$typeof: On, key: h == null ? null : "" + h, children: r, containerInfo: a, implementation: p };
          })(e, t, null, n);
        }
        kl.prototype.render = function(e) {
          Ja(e, this._internalRoot, null, null);
        }, kl.prototype.unmount = function() {
          var e = this._internalRoot, t = e.containerInfo;
          Ja(null, e, null, function() {
            t[Ro] = null;
          });
        }, Ze = function(e) {
          if (e.tag === 13) {
            var t = Fo(Sr(), 150, 100);
            go(e, t), vl(e, t);
          }
        }, Yn = function(e) {
          e.tag === 13 && (go(e, 3), vl(e, 3));
        }, vn = function(e) {
          if (e.tag === 13) {
            var t = Sr();
            go(e, t = Ko(t, e, null)), vl(e, t);
          }
        }, Ee = function(e, t, n) {
          switch (t) {
            case "input":
              if (pt(e, n), t = n.name, n.type === "radio" && t != null) {
                for (n = e; n.parentNode; ) n = n.parentNode;
                for (n = n.querySelectorAll("input[name=" + JSON.stringify("" + t) + '][type="radio"]'), t = 0; t < n.length; t++) {
                  var r = n[t];
                  if (r !== e && r.form === e.form) {
                    var a = Di(r);
                    if (!a) throw Error(m(90));
                    sn(r), pt(r, a);
                  }
                }
              }
              break;
            case "textarea":
              Rn(e, n);
              break;
            case "select":
              (t = n.value) != null && Dn(e, !!n.multiple, t, !1);
          }
        }, ke = bc, Ne = function(e, t, n, r, a) {
          var p = We;
          We |= 4;
          try {
            return or(98, e.bind(null, t, n, r, a));
          } finally {
            (We = p) === Ut && tn();
          }
        }, Ue = function() {
          (We & (1 | ar | xr)) === Ut && ((function() {
            if (qo !== null) {
              var e = qo;
              qo = null, e.forEach(function(t, n) {
                yl(n, t), Tn(n);
              }), tn();
            }
          })(), mi());
        }, Ae = function(e, t) {
          var n = We;
          We |= 2;
          try {
            return e(t);
          } finally {
            (We = n) === Ut && tn();
          }
        };
        var ou = { Events: [kr, Zn, Di, ae, S, Ht, function(e) {
          jt(e, Mi);
        }, le, me, Po, yn, mi, { current: !1 }] };
        (function(e) {
          var t = e.findFiberByHostInstance;
          (function(n) {
            if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u") return !1;
            var r = __REACT_DEVTOOLS_GLOBAL_HOOK__;
            if (r.isDisabled || !r.supportsFiber) return !0;
            try {
              var a = r.inject(n);
              pl = function(p) {
                try {
                  r.onCommitFiberRoot(a, p, void 0, !(64 & ~p.current.effectTag));
                } catch {
                }
              }, fl = function(p) {
                try {
                  r.onCommitFiberUnmount(a, p);
                } catch {
                }
              };
            } catch {
            }
          })(d({}, e, { overrideHookState: null, overrideProps: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: et.ReactCurrentDispatcher, findHostInstanceByFiber: function(n) {
            return (n = ht(n)) === null ? null : n.stateNode;
          }, findFiberByHostInstance: function(n) {
            return t ? t(n) : null;
          }, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null }));
        })({ findFiberByHostInstance: to, bundleType: 0, version: "16.14.0", rendererPackageName: "react-dom" }), u.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = ou, u.createPortal = Nc, u.findDOMNode = function(e) {
          if (e == null) return null;
          if (e.nodeType === 1) return e;
          var t = e._reactInternalFiber;
          if (t === void 0)
            throw typeof e.render == "function" ? Error(m(188)) : Error(m(268, Object.keys(e)));
          return e = (e = ht(t)) === null ? null : e.stateNode;
        }, u.flushSync = function(e, t) {
          if ((We & (ar | xr)) !== Ut) throw Error(m(187));
          var n = We;
          We |= 1;
          try {
            return or(99, e.bind(null, t));
          } finally {
            We = n, tn();
          }
        }, u.hydrate = function(e, t, n) {
          if (!Ji(t)) throw Error(m(200));
          return es(null, e, t, !0, n);
        }, u.render = function(e, t, n) {
          if (!Ji(t)) throw Error(m(200));
          return es(null, e, t, !1, n);
        }, u.unmountComponentAtNode = function(e) {
          if (!Ji(e)) throw Error(m(40));
          return !!e._reactRootContainer && (vc(function() {
            es(null, null, e, !1, function() {
              e._reactRootContainer = null, e[Ro] = null;
            });
          }), !0);
        }, u.unstable_batchedUpdates = bc, u.unstable_createPortal = function(e, t) {
          return Nc(e, t, 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null);
        }, u.unstable_renderSubtreeIntoContainer = function(e, t, n, r) {
          if (!Ji(n)) throw Error(m(200));
          if (e == null || e._reactInternalFiber === void 0) throw Error(m(38));
          return es(e, t, n, !1, r);
        }, u.version = "16.14.0";
      }, 2584: (i, u, f) => {
        var k = f(5072), d = f(5371);
        typeof (d = d.__esModule ? d.default : d) == "string" && (d = [[i.id, d, ""]]);
        var C = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        k(d, C), i.exports = d.locals || {};
      }, 2632: (i, u, f) => {
        f.r(u), f.d(u, { default: () => C });
        var k = f(6314), d = f.n(k)()(function(m) {
          return m[1];
        });
        d.push([i.id, `.ck-inspector .ck-inspector__object-inspector{background:var(--ck-inspector-color-white);overflow:auto;width:100%}.ck-inspector .ck-inspector__object-inspector h2,.ck-inspector .ck-inspector__object-inspector h3{display:flex;flex-direction:row;flex-wrap:nowrap}.ck-inspector .ck-inspector__object-inspector h2{align-items:center;display:flex;overflow:hidden;padding:1em;text-overflow:ellipsis}.ck-inspector .ck-inspector__object-inspector h2>span{display:block;margin-right:auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ck-inspector .ck-inspector__object-inspector h2>.ck-inspector-button{flex-shrink:0;margin-left:.5em}.ck-inspector .ck-inspector__object-inspector h2 a{color:var(--ck-inspector-color-tree-node-name);font-weight:700}.ck-inspector .ck-inspector__object-inspector h2 a,.ck-inspector .ck-inspector__object-inspector h2 a>*{cursor:pointer}.ck-inspector .ck-inspector__object-inspector h2 em:after,.ck-inspector .ck-inspector__object-inspector h2 em:before{content:'"'}.ck-inspector .ck-inspector__object-inspector h3{align-items:center;display:flex;font-size:12px;padding:.4em .7em}.ck-inspector .ck-inspector__object-inspector h3 a{color:inherit;font-weight:700;margin-right:auto}.ck-inspector .ck-inspector__object-inspector h3 .ck-inspector-button{visibility:hidden}.ck-inspector .ck-inspector__object-inspector h3:hover .ck-inspector-button{visibility:visible}.ck-inspector .ck-inspector__object-inspector hr{border-top:1px solid var(--ck-inspector-color-border)}`, ""]);
        const C = d;
      }, 2694: (i, u, f) => {
        var k = f(6925);
        function d() {
        }
        function C() {
        }
        C.resetWarningCache = d, i.exports = function() {
          function m(N, R, D, L, se, J) {
            if (J !== k) {
              var M = new Error("Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types");
              throw M.name = "Invariant Violation", M;
            }
          }
          function b() {
            return m;
          }
          m.isRequired = m;
          var v = { array: m, bigint: m, bool: m, func: m, number: m, object: m, string: m, symbol: m, any: m, arrayOf: b, element: m, elementType: m, instanceOf: b, node: m, objectOf: b, oneOf: b, oneOfType: b, shape: b, exact: b, checkPropTypes: C, resetWarningCache: d };
          return v.PropTypes = v, v;
        };
      }, 2799: (i, u) => {
        var f = typeof Symbol == "function" && Symbol.for, k = f ? Symbol.for("react.element") : 60103, d = f ? Symbol.for("react.portal") : 60106, C = f ? Symbol.for("react.fragment") : 60107, m = f ? Symbol.for("react.strict_mode") : 60108, b = f ? Symbol.for("react.profiler") : 60114, v = f ? Symbol.for("react.provider") : 60109, N = f ? Symbol.for("react.context") : 60110, R = f ? Symbol.for("react.async_mode") : 60111, D = f ? Symbol.for("react.concurrent_mode") : 60111, L = f ? Symbol.for("react.forward_ref") : 60112, se = f ? Symbol.for("react.suspense") : 60113, J = f ? Symbol.for("react.suspense_list") : 60120, M = f ? Symbol.for("react.memo") : 60115, F = f ? Symbol.for("react.lazy") : 60116, B = f ? Symbol.for("react.block") : 60121, ne = f ? Symbol.for("react.fundamental") : 60117, pe = f ? Symbol.for("react.responder") : 60118, oe = f ? Symbol.for("react.scope") : 60119;
        function fe(S) {
          if (typeof S == "object" && S !== null) {
            var j = S.$$typeof;
            switch (j) {
              case k:
                switch (S = S.type) {
                  case R:
                  case D:
                  case C:
                  case b:
                  case m:
                  case se:
                    return S;
                  default:
                    switch (S = S && S.$$typeof) {
                      case N:
                      case L:
                      case F:
                      case M:
                      case v:
                        return S;
                      default:
                        return j;
                    }
                }
              case d:
                return j;
            }
          }
        }
        function ge(S) {
          return fe(S) === D;
        }
        u.AsyncMode = R, u.ConcurrentMode = D, u.ContextConsumer = N, u.ContextProvider = v, u.Element = k, u.ForwardRef = L, u.Fragment = C, u.Lazy = F, u.Memo = M, u.Portal = d, u.Profiler = b, u.StrictMode = m, u.Suspense = se, u.isAsyncMode = function(S) {
          return ge(S) || fe(S) === R;
        }, u.isConcurrentMode = ge, u.isContextConsumer = function(S) {
          return fe(S) === N;
        }, u.isContextProvider = function(S) {
          return fe(S) === v;
        }, u.isElement = function(S) {
          return typeof S == "object" && S !== null && S.$$typeof === k;
        }, u.isForwardRef = function(S) {
          return fe(S) === L;
        }, u.isFragment = function(S) {
          return fe(S) === C;
        }, u.isLazy = function(S) {
          return fe(S) === F;
        }, u.isMemo = function(S) {
          return fe(S) === M;
        }, u.isPortal = function(S) {
          return fe(S) === d;
        }, u.isProfiler = function(S) {
          return fe(S) === b;
        }, u.isStrictMode = function(S) {
          return fe(S) === m;
        }, u.isSuspense = function(S) {
          return fe(S) === se;
        }, u.isValidElementType = function(S) {
          return typeof S == "string" || typeof S == "function" || S === C || S === D || S === b || S === m || S === se || S === J || typeof S == "object" && S !== null && (S.$$typeof === F || S.$$typeof === M || S.$$typeof === v || S.$$typeof === N || S.$$typeof === L || S.$$typeof === ne || S.$$typeof === pe || S.$$typeof === oe || S.$$typeof === B);
        }, u.typeOf = fe;
      }, 2841: (i, u, f) => {
        f.r(u), f.d(u, { default: () => C });
        var k = f(6314), d = f.n(k)()(function(m) {
          return m[1];
        });
        d.push([i.id, ".ck-inspector .ck-inspector-checkbox{vertical-align:middle}", ""]);
        const C = d;
      }, 3514: (i, u) => {
        Object.defineProperty(u, "__esModule", { value: !0 }), u.getPrefix = k, u.browserPrefixToKey = d, u.browserPrefixToStyle = function(m, b) {
          return b ? "-".concat(b.toLowerCase(), "-").concat(m) : m;
        }, u.default = void 0;
        var f = ["Moz", "Webkit", "O", "ms"];
        function k() {
          var m = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "transform";
          if (typeof window > "u" || window.document === void 0) return "";
          var b = window.document.documentElement.style;
          if (m in b) return "";
          for (var v = 0; v < f.length; v++) if (d(m, f[v]) in b) return f[v];
          return "";
        }
        function d(m, b) {
          return b ? "".concat(b).concat((function(v) {
            for (var N = "", R = !0, D = 0; D < v.length; D++) R ? (N += v[D].toUpperCase(), R = !1) : v[D] === "-" ? R = !0 : N += v[D];
            return N;
          })(m)) : m;
        }
        var C = k();
        u.default = C;
      }, 3780: (i, u, f) => {
        var k = f(5072), d = f(2841);
        typeof (d = d.__esModule ? d.default : d) == "string" && (d = [[i.id, d, ""]]);
        var C = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        k(d, C), i.exports = d.locals || {};
      }, 3797: (i, u, f) => {
        f.r(u), f.d(u, { default: () => C });
        var k = f(6314), d = f.n(k)()(function(m) {
          return m[1];
        });
        d.push([i.id, ".ck-inspector-side-pane{position:relative}", ""]);
        const C = d;
      }, 4146: (i, u, f) => {
        var k = f(4363), d = { childContextTypes: !0, contextType: !0, contextTypes: !0, defaultProps: !0, displayName: !0, getDefaultProps: !0, getDerivedStateFromError: !0, getDerivedStateFromProps: !0, mixins: !0, propTypes: !0, type: !0 }, C = { name: !0, length: !0, prototype: !0, caller: !0, callee: !0, arguments: !0, arity: !0 }, m = { $$typeof: !0, compare: !0, defaultProps: !0, displayName: !0, propTypes: !0, type: !0 }, b = {};
        function v(M) {
          return k.isMemo(M) ? m : b[M.$$typeof] || d;
        }
        b[k.ForwardRef] = { $$typeof: !0, render: !0, defaultProps: !0, displayName: !0, propTypes: !0 }, b[k.Memo] = m;
        var N = Object.defineProperty, R = Object.getOwnPropertyNames, D = Object.getOwnPropertySymbols, L = Object.getOwnPropertyDescriptor, se = Object.getPrototypeOf, J = Object.prototype;
        i.exports = function M(F, B, ne) {
          if (typeof B != "string") {
            if (J) {
              var pe = se(B);
              pe && pe !== J && M(F, pe, ne);
            }
            var oe = R(B);
            D && (oe = oe.concat(D(B)));
            for (var fe = v(F), ge = v(B), S = 0; S < oe.length; ++S) {
              var j = oe[S];
              if (!(C[j] || ne && ne[j] || ge && ge[j] || fe && fe[j])) {
                var A = L(B, j);
                try {
                  N(F, j, A);
                } catch {
                }
              }
            }
          }
          return F;
        };
      }, 4343: (i, u, f) => {
        var k = f(5072), d = f(7260);
        typeof (d = d.__esModule ? d.default : d) == "string" && (d = [[i.id, d, ""]]);
        var C = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        k(d, C), i.exports = d.locals || {};
      }, 4363: (i, u, f) => {
        i.exports = f(2799);
      }, 4737: (i, u, f) => {
        i.exports = f(8989);
      }, 4838: (i, u) => {
        Object.defineProperty(u, "__esModule", { value: !0 }), u.resetState = function() {
          var C = document.getElementsByTagName("html")[0];
          for (var m in f) d(C, f[m]);
          var b = document.body;
          for (var v in k) d(b, k[v]);
          f = {}, k = {};
        }, u.log = function() {
        };
        var f = {}, k = {};
        function d(C, m) {
          C.classList.remove(m);
        }
        u.add = function(C, m) {
          return b = C.classList, v = C.nodeName.toLowerCase() == "html" ? f : k, void m.split(" ").forEach(function(N) {
            (function(R, D) {
              R[D] || (R[D] = 0), R[D] += 1;
            })(v, N), b.add(N);
          });
          var b, v;
        }, u.remove = function(C, m) {
          return b = C.classList, v = C.nodeName.toLowerCase() == "html" ? f : k, void m.split(" ").forEach(function(N) {
            (function(R, D) {
              R[D] && (R[D] -= 1);
            })(v, N), v[N] === 0 && b.remove(N);
          });
          var b, v;
        };
      }, 4987: (i) => {
        function u(v, N, R, D) {
          var L, se = (L = D) == null || typeof L == "number" || typeof L == "boolean" ? D : R(D), J = N.get(se);
          return J === void 0 && (J = v.call(this, D), N.set(se, J)), J;
        }
        function f(v, N, R) {
          var D = Array.prototype.slice.call(arguments, 3), L = R(D), se = N.get(L);
          return se === void 0 && (se = v.apply(this, D), N.set(L, se)), se;
        }
        function k(v, N, R, D, L) {
          return R.bind(N, v, D, L);
        }
        function d(v, N) {
          return k(v, this, v.length === 1 ? u : f, N.cache.create(), N.serializer);
        }
        function C() {
          return JSON.stringify(arguments);
        }
        function m() {
          this.cache = /* @__PURE__ */ Object.create(null);
        }
        m.prototype.has = function(v) {
          return v in this.cache;
        }, m.prototype.get = function(v) {
          return this.cache[v];
        }, m.prototype.set = function(v, N) {
          this.cache[v] = N;
        };
        var b = { create: function() {
          return new m();
        } };
        i.exports = function(v, N) {
          var R = N && N.cache ? N.cache : b, D = N && N.serializer ? N.serializer : C;
          return (N && N.strategy ? N.strategy : d)(v, { cache: R, serializer: D });
        }, i.exports.strategies = { variadic: function(v, N) {
          return k(v, this, f, N.cache.create(), N.serializer);
        }, monadic: function(v, N) {
          return k(v, this, u, N.cache.create(), N.serializer);
        } };
      }, 5072: (i, u, f) => {
        var k, d = function() {
          return k === void 0 && (k = !!(window && document && document.all && !window.atob)), k;
        }, C = /* @__PURE__ */ (function() {
          var B = {};
          return function(ne) {
            if (B[ne] === void 0) {
              var pe = document.querySelector(ne);
              if (window.HTMLIFrameElement && pe instanceof window.HTMLIFrameElement) try {
                pe = pe.contentDocument.head;
              } catch {
                pe = null;
              }
              B[ne] = pe;
            }
            return B[ne];
          };
        })(), m = [];
        function b(B) {
          for (var ne = -1, pe = 0; pe < m.length; pe++) if (m[pe].identifier === B) {
            ne = pe;
            break;
          }
          return ne;
        }
        function v(B, ne) {
          for (var pe = {}, oe = [], fe = 0; fe < B.length; fe++) {
            var ge = B[fe], S = ne.base ? ge[0] + ne.base : ge[0], j = pe[S] || 0, A = "".concat(S, " ").concat(j);
            pe[S] = j + 1;
            var ae = b(A), G = { css: ge[1], media: ge[2], sourceMap: ge[3] };
            ae !== -1 ? (m[ae].references++, m[ae].updater(G)) : m.push({ identifier: A, updater: F(G, ne), references: 1 }), oe.push(A);
          }
          return oe;
        }
        function N(B) {
          var ne = document.createElement("style"), pe = B.attributes || {};
          if (pe.nonce === void 0) {
            var oe = f.nc;
            oe && (pe.nonce = oe);
          }
          if (Object.keys(pe).forEach(function(ge) {
            ne.setAttribute(ge, pe[ge]);
          }), typeof B.insert == "function") B.insert(ne);
          else {
            var fe = C(B.insert || "head");
            if (!fe) throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");
            fe.appendChild(ne);
          }
          return ne;
        }
        var R, D = (R = [], function(B, ne) {
          return R[B] = ne, R.filter(Boolean).join(`
`);
        });
        function L(B, ne, pe, oe) {
          var fe = pe ? "" : oe.media ? "@media ".concat(oe.media, " {").concat(oe.css, "}") : oe.css;
          if (B.styleSheet) B.styleSheet.cssText = D(ne, fe);
          else {
            var ge = document.createTextNode(fe), S = B.childNodes;
            S[ne] && B.removeChild(S[ne]), S.length ? B.insertBefore(ge, S[ne]) : B.appendChild(ge);
          }
        }
        function se(B, ne, pe) {
          var oe = pe.css, fe = pe.media, ge = pe.sourceMap;
          if (fe ? B.setAttribute("media", fe) : B.removeAttribute("media"), ge && typeof btoa < "u" && (oe += `
/*# sourceMappingURL=data:application/json;base64,`.concat(btoa(unescape(encodeURIComponent(JSON.stringify(ge)))), " */")), B.styleSheet) B.styleSheet.cssText = oe;
          else {
            for (; B.firstChild; ) B.removeChild(B.firstChild);
            B.appendChild(document.createTextNode(oe));
          }
        }
        var J = null, M = 0;
        function F(B, ne) {
          var pe, oe, fe;
          if (ne.singleton) {
            var ge = M++;
            pe = J || (J = N(ne)), oe = L.bind(null, pe, ge, !1), fe = L.bind(null, pe, ge, !0);
          } else pe = N(ne), oe = se.bind(null, pe, ne), fe = function() {
            (function(S) {
              if (S.parentNode === null) return !1;
              S.parentNode.removeChild(S);
            })(pe);
          };
          return oe(B), function(S) {
            if (S) {
              if (S.css === B.css && S.media === B.media && S.sourceMap === B.sourceMap) return;
              oe(B = S);
            } else fe();
          };
        }
        i.exports = function(B, ne) {
          (ne = ne || {}).singleton || typeof ne.singleton == "boolean" || (ne.singleton = d());
          var pe = v(B = B || [], ne);
          return function(oe) {
            if (oe = oe || [], Object.prototype.toString.call(oe) === "[object Array]") {
              for (var fe = 0; fe < pe.length; fe++) {
                var ge = b(pe[fe]);
                m[ge].references--;
              }
              for (var S = v(oe, ne), j = 0; j < pe.length; j++) {
                var A = b(pe[j]);
                m[A].references === 0 && (m[A].updater(), m.splice(A, 1));
              }
              pe = S;
            }
          };
        };
      }, 5180: (i, u, f) => {
        Object.defineProperty(u, "__esModule", { value: !0 }), u.FunctionParser = u.dedentFunction = u.functionToString = u.USED_METHOD_KEY = void 0;
        const k = f(1099), d = { " "() {
        } }[" "].toString().charAt(0) === '"', C = { Function: "function ", GeneratorFunction: "function* ", AsyncFunction: "async function ", AsyncGeneratorFunction: "async function* " }, m = { Function: "", GeneratorFunction: "*", AsyncFunction: "async ", AsyncGeneratorFunction: "async *" }, b = new Set("case delete else in instanceof new return throw typeof void , ; : + - ! ~ & | ^ * / % < > ? =".split(" "));
        u.USED_METHOD_KEY = /* @__PURE__ */ new WeakSet();
        function v(R) {
          let D;
          for (const L of R.split(`
`).slice(1)) {
            const se = /^[\s\t]+/.exec(L);
            if (!se) return R;
            const [J] = se;
            (D === void 0 || J.length < D.length) && (D = J);
          }
          return D ? R.split(`
${D}`).join(`
`) : R;
        }
        u.functionToString = (R, D, L, se) => {
          const J = typeof se == "string" ? se : void 0;
          return J !== void 0 && u.USED_METHOD_KEY.add(R), new N(R, D, L, J).stringify();
        }, u.dedentFunction = v;
        class N {
          constructor(D, L, se, J) {
            this.fn = D, this.indent = L, this.next = se, this.key = J, this.pos = 0, this.hadKeyword = !1, this.fnString = Function.prototype.toString.call(D), this.fnType = D.constructor.name, this.keyQuote = J === void 0 ? "" : k.quoteKey(J, se), this.keyPrefix = J === void 0 ? "" : `${this.keyQuote}:${L ? " " : ""}`, this.isMethodCandidate = J !== void 0 && (this.fn.name === "" || this.fn.name === J);
          }
          stringify() {
            const D = this.tryParse();
            return D ? v(D) : `${this.keyPrefix}void ${this.next(this.fnString)}`;
          }
          getPrefix() {
            return this.isMethodCandidate && !this.hadKeyword ? m[this.fnType] + this.keyQuote : this.keyPrefix + C[this.fnType];
          }
          tryParse() {
            if (this.fnString[this.fnString.length - 1] !== "}") return this.keyPrefix + this.fnString;
            if (this.fn.name) {
              const L = this.tryStrippingName();
              if (L) return L;
            }
            const D = this.pos;
            if (this.consumeSyntax() === "class") return this.fnString;
            if (this.pos = D, this.tryParsePrefixTokens()) {
              const L = this.tryStrippingName();
              if (L) return L;
              let se = this.pos;
              switch (this.consumeSyntax("WORD_LIKE")) {
                case "WORD_LIKE":
                  this.isMethodCandidate && !this.hadKeyword && (se = this.pos);
                case "()":
                  if (this.fnString.substr(this.pos, 2) === "=>") return this.keyPrefix + this.fnString;
                  this.pos = se;
                case '"':
                case "'":
                case "[]":
                  return this.getPrefix() + this.fnString.substr(this.pos);
              }
            }
          }
          tryStrippingName() {
            if (d) return;
            let D = this.pos;
            const L = this.fnString.substr(this.pos, this.fn.name.length);
            if (L === this.fn.name && (this.pos += L.length, this.consumeSyntax() === "()" && this.consumeSyntax() === "{}" && this.pos === this.fnString.length)) return !this.isMethodCandidate && k.isValidVariableName(L) || (D += L.length), this.getPrefix() + this.fnString.substr(D);
            this.pos = D;
          }
          tryParsePrefixTokens() {
            let D = this.pos;
            switch (this.hadKeyword = !1, this.fnType) {
              case "AsyncFunction":
                if (this.consumeSyntax() !== "async") return !1;
                D = this.pos;
              case "Function":
                return this.consumeSyntax() === "function" ? this.hadKeyword = !0 : this.pos = D, !0;
              case "AsyncGeneratorFunction":
                if (this.consumeSyntax() !== "async") return !1;
              case "GeneratorFunction":
                let L = this.consumeSyntax();
                return L === "function" && (L = this.consumeSyntax(), this.hadKeyword = !0), L === "*";
            }
          }
          consumeSyntax(D) {
            const L = this.consumeMatch(/^(?:([A-Za-z_0-9$\xA0-\uFFFF]+)|=>|\+\+|\-\-|.)/);
            if (!L) return;
            const [se, J] = L;
            if (this.consumeWhitespace(), J) return D || J;
            switch (se) {
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
            return se;
          }
          consumeSyntaxUntil(D, L) {
            let se = !0;
            for (; ; ) {
              const J = this.consumeSyntax();
              if (J === L) return D + L;
              if (!J || J === ")" || J === "]" || J === "}") return;
              J === "/" && se && this.consumeMatch(/^(?:\\.|[^\\\/\n[]|\[(?:\\.|[^\]])*\])+\/[a-z]*/) ? (se = !1, this.consumeWhitespace()) : se = b.has(J);
            }
          }
          consumeMatch(D) {
            const L = D.exec(this.fnString.substr(this.pos));
            return L && (this.pos += L[0].length), L;
          }
          consumeRegExp(D, L) {
            const se = D.exec(this.fnString.substr(this.pos));
            if (se) return this.pos += se[0].length, this.consumeWhitespace(), L;
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
        u.FunctionParser = N;
      }, 5228: (i) => {
        var u = Object.getOwnPropertySymbols, f = Object.prototype.hasOwnProperty, k = Object.prototype.propertyIsEnumerable;
        i.exports = (function() {
          try {
            if (!Object.assign) return !1;
            var d = new String("abc");
            if (d[5] = "de", Object.getOwnPropertyNames(d)[0] === "5") return !1;
            for (var C = {}, m = 0; m < 10; m++) C["_" + String.fromCharCode(m)] = m;
            if (Object.getOwnPropertyNames(C).map(function(v) {
              return C[v];
            }).join("") !== "0123456789") return !1;
            var b = {};
            return "abcdefghijklmnopqrst".split("").forEach(function(v) {
              b[v] = v;
            }), Object.keys(Object.assign({}, b)).join("") === "abcdefghijklmnopqrst";
          } catch {
            return !1;
          }
        })() ? Object.assign : function(d, C) {
          for (var m, b, v = (function(L) {
            if (L == null) throw new TypeError("Object.assign cannot be called with null or undefined");
            return Object(L);
          })(d), N = 1; N < arguments.length; N++) {
            for (var R in m = Object(arguments[N])) f.call(m, R) && (v[R] = m[R]);
            if (u) {
              b = u(m);
              for (var D = 0; D < b.length; D++) k.call(m, b[D]) && (v[b[D]] = m[b[D]]);
            }
          }
          return v;
        };
      }, 5287: (i, u, f) => {
        var k = f(5228), d = typeof Symbol == "function" && Symbol.for, C = d ? Symbol.for("react.element") : 60103, m = d ? Symbol.for("react.portal") : 60106, b = d ? Symbol.for("react.fragment") : 60107, v = d ? Symbol.for("react.strict_mode") : 60108, N = d ? Symbol.for("react.profiler") : 60114, R = d ? Symbol.for("react.provider") : 60109, D = d ? Symbol.for("react.context") : 60110, L = d ? Symbol.for("react.forward_ref") : 60112, se = d ? Symbol.for("react.suspense") : 60113, J = d ? Symbol.for("react.memo") : 60115, M = d ? Symbol.for("react.lazy") : 60116, F = typeof Symbol == "function" && Symbol.iterator;
        function B(P) {
          for (var ee = "https://reactjs.org/docs/error-decoder.html?invariant=" + P, we = 1; we < arguments.length; we++) ee += "&args[]=" + encodeURIComponent(arguments[we]);
          return "Minified React error #" + P + "; visit " + ee + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
        }
        var ne = { isMounted: function() {
          return !1;
        }, enqueueForceUpdate: function() {
        }, enqueueReplaceState: function() {
        }, enqueueSetState: function() {
        } }, pe = {};
        function oe(P, ee, we) {
          this.props = P, this.context = ee, this.refs = pe, this.updater = we || ne;
        }
        function fe() {
        }
        function ge(P, ee, we) {
          this.props = P, this.context = ee, this.refs = pe, this.updater = we || ne;
        }
        oe.prototype.isReactComponent = {}, oe.prototype.setState = function(P, ee) {
          if (typeof P != "object" && typeof P != "function" && P != null) throw Error(B(85));
          this.updater.enqueueSetState(this, P, ee, "setState");
        }, oe.prototype.forceUpdate = function(P) {
          this.updater.enqueueForceUpdate(this, P, "forceUpdate");
        }, fe.prototype = oe.prototype;
        var S = ge.prototype = new fe();
        S.constructor = ge, k(S, oe.prototype), S.isPureReactComponent = !0;
        var j = { current: null }, A = Object.prototype.hasOwnProperty, ae = { key: !0, ref: !0, __self: !0, __source: !0 };
        function G(P, ee, we) {
          var Se, Pe = {}, _e = null, lt = null;
          if (ee != null) for (Se in ee.ref !== void 0 && (lt = ee.ref), ee.key !== void 0 && (_e = "" + ee.key), ee) A.call(ee, Se) && !ae.hasOwnProperty(Se) && (Pe[Se] = ee[Se]);
          var Qe = arguments.length - 2;
          if (Qe === 1) Pe.children = we;
          else if (1 < Qe) {
            for (var et = Array(Qe), Pt = 0; Pt < Qe; Pt++) et[Pt] = arguments[Pt + 2];
            Pe.children = et;
          }
          if (P && P.defaultProps) for (Se in Qe = P.defaultProps) Pe[Se] === void 0 && (Pe[Se] = Qe[Se]);
          return { $$typeof: C, type: P, key: _e, ref: lt, props: Pe, _owner: j.current };
        }
        function Ee(P) {
          return typeof P == "object" && P !== null && P.$$typeof === C;
        }
        var Z = /\/+/g, U = [];
        function X(P, ee, we, Se) {
          if (U.length) {
            var Pe = U.pop();
            return Pe.result = P, Pe.keyPrefix = ee, Pe.func = we, Pe.context = Se, Pe.count = 0, Pe;
          }
          return { result: P, keyPrefix: ee, func: we, context: Se, count: 0 };
        }
        function le(P) {
          P.result = null, P.keyPrefix = null, P.func = null, P.context = null, P.count = 0, 10 > U.length && U.push(P);
        }
        function me(P, ee, we, Se) {
          var Pe = typeof P;
          Pe !== "undefined" && Pe !== "boolean" || (P = null);
          var _e = !1;
          if (P === null) _e = !0;
          else switch (Pe) {
            case "string":
            case "number":
              _e = !0;
              break;
            case "object":
              switch (P.$$typeof) {
                case C:
                case m:
                  _e = !0;
              }
          }
          if (_e) return we(Se, P, ee === "" ? "." + Ne(P, 0) : ee), 1;
          if (_e = 0, ee = ee === "" ? "." : ee + ":", Array.isArray(P)) for (var lt = 0; lt < P.length; lt++) {
            var Qe = ee + Ne(Pe = P[lt], lt);
            _e += me(Pe, Qe, we, Se);
          }
          else if (P === null || typeof P != "object" ? Qe = null : Qe = typeof (Qe = F && P[F] || P["@@iterator"]) == "function" ? Qe : null, typeof Qe == "function") for (P = Qe.call(P), lt = 0; !(Pe = P.next()).done; ) _e += me(Pe = Pe.value, Qe = ee + Ne(Pe, lt++), we, Se);
          else if (Pe === "object") throw we = "" + P, Error(B(31, we === "[object Object]" ? "object with keys {" + Object.keys(P).join(", ") + "}" : we, ""));
          return _e;
        }
        function ke(P, ee, we) {
          return P == null ? 0 : me(P, "", ee, we);
        }
        function Ne(P, ee) {
          return typeof P == "object" && P !== null && P.key != null ? (function(we) {
            var Se = { "=": "=0", ":": "=2" };
            return "$" + ("" + we).replace(/[=:]/g, function(Pe) {
              return Se[Pe];
            });
          })(P.key) : ee.toString(36);
        }
        function Ue(P, ee) {
          P.func.call(P.context, ee, P.count++);
        }
        function Ae(P, ee, we) {
          var Se = P.result, Pe = P.keyPrefix;
          P = P.func.call(P.context, ee, P.count++), Array.isArray(P) ? Le(P, Se, we, function(_e) {
            return _e;
          }) : P != null && (Ee(P) && (P = (function(_e, lt) {
            return { $$typeof: C, type: _e.type, key: lt, ref: _e.ref, props: _e.props, _owner: _e._owner };
          })(P, Pe + (!P.key || ee && ee.key === P.key ? "" : ("" + P.key).replace(Z, "$&/") + "/") + we)), Se.push(P));
        }
        function Le(P, ee, we, Se, Pe) {
          var _e = "";
          we != null && (_e = ("" + we).replace(Z, "$&/") + "/"), ke(P, Ae, ee = X(ee, _e, Se, Pe)), le(ee);
        }
        var Ke = { current: null };
        function Je() {
          var P = Ke.current;
          if (P === null) throw Error(B(321));
          return P;
        }
        var ye = { ReactCurrentDispatcher: Ke, ReactCurrentBatchConfig: { suspense: null }, ReactCurrentOwner: j, IsSomeRendererActing: { current: !1 }, assign: k };
        u.Children = { map: function(P, ee, we) {
          if (P == null) return P;
          var Se = [];
          return Le(P, Se, null, ee, we), Se;
        }, forEach: function(P, ee, we) {
          if (P == null) return P;
          ke(P, Ue, ee = X(null, null, ee, we)), le(ee);
        }, count: function(P) {
          return ke(P, function() {
            return null;
          }, null);
        }, toArray: function(P) {
          var ee = [];
          return Le(P, ee, null, function(we) {
            return we;
          }), ee;
        }, only: function(P) {
          if (!Ee(P)) throw Error(B(143));
          return P;
        } }, u.Component = oe, u.Fragment = b, u.Profiler = N, u.PureComponent = ge, u.StrictMode = v, u.Suspense = se, u.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = ye, u.cloneElement = function(P, ee, we) {
          if (P == null) throw Error(B(267, P));
          var Se = k({}, P.props), Pe = P.key, _e = P.ref, lt = P._owner;
          if (ee != null) {
            if (ee.ref !== void 0 && (_e = ee.ref, lt = j.current), ee.key !== void 0 && (Pe = "" + ee.key), P.type && P.type.defaultProps) var Qe = P.type.defaultProps;
            for (et in ee) A.call(ee, et) && !ae.hasOwnProperty(et) && (Se[et] = ee[et] === void 0 && Qe !== void 0 ? Qe[et] : ee[et]);
          }
          var et = arguments.length - 2;
          if (et === 1) Se.children = we;
          else if (1 < et) {
            Qe = Array(et);
            for (var Pt = 0; Pt < et; Pt++) Qe[Pt] = arguments[Pt + 2];
            Se.children = Qe;
          }
          return { $$typeof: C, type: P.type, key: Pe, ref: _e, props: Se, _owner: lt };
        }, u.createContext = function(P, ee) {
          return ee === void 0 && (ee = null), (P = { $$typeof: D, _calculateChangedBits: ee, _currentValue: P, _currentValue2: P, _threadCount: 0, Provider: null, Consumer: null }).Provider = { $$typeof: R, _context: P }, P.Consumer = P;
        }, u.createElement = G, u.createFactory = function(P) {
          var ee = G.bind(null, P);
          return ee.type = P, ee;
        }, u.createRef = function() {
          return { current: null };
        }, u.forwardRef = function(P) {
          return { $$typeof: L, render: P };
        }, u.isValidElement = Ee, u.lazy = function(P) {
          return { $$typeof: M, _ctor: P, _status: -1, _result: null };
        }, u.memo = function(P, ee) {
          return { $$typeof: J, type: P, compare: ee === void 0 ? null : ee };
        }, u.useCallback = function(P, ee) {
          return Je().useCallback(P, ee);
        }, u.useContext = function(P, ee) {
          return Je().useContext(P, ee);
        }, u.useDebugValue = function() {
        }, u.useEffect = function(P, ee) {
          return Je().useEffect(P, ee);
        }, u.useImperativeHandle = function(P, ee, we) {
          return Je().useImperativeHandle(P, ee, we);
        }, u.useLayoutEffect = function(P, ee) {
          return Je().useLayoutEffect(P, ee);
        }, u.useMemo = function(P, ee) {
          return Je().useMemo(P, ee);
        }, u.useReducer = function(P, ee, we) {
          return Je().useReducer(P, ee, we);
        }, u.useRef = function(P) {
          return Je().useRef(P);
        }, u.useState = function(P) {
          return Je().useState(P);
        }, u.version = "16.14.0";
      }, 5323: (i, u, f) => {
        u.A = void 0;
        const k = f(42), d = f(1099), C = Symbol("root");
        u.A = function(m, b, v, N = {}) {
          const R = typeof v == "string" ? v : " ".repeat(v || 0), D = [], L = /* @__PURE__ */ new Set(), se = /* @__PURE__ */ new Map(), J = /* @__PURE__ */ new Map();
          let M = 0;
          const { maxDepth: F = 100, references: B = !1, skipUndefinedProperties: ne = !1, maxValues: pe = 1e5 } = N, oe = (function(j) {
            return j ? (A, ae, G, Ee) => j(A, ae, (Z) => k.toString(Z, ae, G, Ee), Ee) : k.toString;
          })(b), fe = (j, A) => {
            if (++M > pe || ne && j === void 0 || D.length > F) return;
            if (A === void 0) return oe(j, R, fe, A);
            D.push(A);
            const ae = ge(j, A === C ? void 0 : A);
            return D.pop(), ae;
          }, ge = B ? (j, A) => {
            if (j !== null && (typeof j == "object" || typeof j == "function" || typeof j == "symbol")) {
              if (se.has(j)) return J.set(D.slice(1), se.get(j)), oe(void 0, R, fe, A);
              se.set(j, D.slice(1));
            }
            return oe(j, R, fe, A);
          } : (j, A) => {
            if (L.has(j)) return;
            L.add(j);
            const ae = oe(j, R, fe, A);
            return L.delete(j), ae;
          }, S = fe(m, C);
          if (J.size) {
            const j = R ? " " : "", A = R ? `
` : "";
            let ae = `var x${j}=${j}${S};${A}`;
            for (const [G, Ee] of J.entries())
              ae += `x${d.stringifyPath(G, fe)}${j}=${j}x${d.stringifyPath(Ee, fe)};${A}`;
            return `(function${j}()${j}{${A}${ae}return x;${A}}())`;
          }
          return S;
        };
      }, 5371: (i, u, f) => {
        f.r(u), f.d(u, { default: () => C });
        var k = f(6314), d = f.n(k)()(function(m) {
          return m[1];
        });
        d.push([i.id, `.ck-inspector{--ck-inspector-color-tree-node-hover:#eaf2fb;--ck-inspector-color-tree-node-name:#882680;--ck-inspector-color-tree-node-attribute-name:#8a8a8a;--ck-inspector-color-tree-node-tag:#aaa;--ck-inspector-color-tree-node-attribute:#9a4819;--ck-inspector-color-tree-node-attribute-value:#2a43ac;--ck-inspector-color-tree-text-border:#b7b7b7;--ck-inspector-color-tree-node-border-hover:#b0c6e0;--ck-inspector-color-tree-content-delimiter:#ddd;--ck-inspector-color-tree-node-active-bg:#f5faff;--ck-inspector-color-tree-node-name-active-bg:#2b98f0;--ck-inspector-color-tree-node-inactive:#8a8a8a;--ck-inspector-color-tree-selection:#ff1744;--ck-inspector-color-tree-position:#000;--ck-inspector-color-comment:green}.ck-inspector .ck-inspector-tree{background:var(--ck-inspector-color-white);height:100%;overflow:auto;padding:1em;user-select:none;width:100%}.ck-inspector-tree .ck-inspector-tree-node__attribute{color:var(--ck-inspector-color-tree-node-tag);font:inherit;margin-left:.4em}.ck-inspector-tree .ck-inspector-tree-node__attribute .ck-inspector-tree-node__attribute__name{color:var(--ck-inspector-color-tree-node-attribute)}.ck-inspector-tree .ck-inspector-tree-node__attribute .ck-inspector-tree-node__attribute__value{color:var(--ck-inspector-color-tree-node-attribute-value)}.ck-inspector-tree .ck-inspector-tree-node__attribute .ck-inspector-tree-node__attribute__value:before{content:'="'}.ck-inspector-tree .ck-inspector-tree-node__attribute .ck-inspector-tree-node__attribute__value:after{content:'"'}.ck-inspector-tree .ck-inspector-tree-node .ck-inspector-tree-node__name{border-left:1px solid transparent;color:var(--ck-inspector-color-tree-node-name);display:inline-block;padding:0 .1em;width:100%}.ck-inspector-tree .ck-inspector-tree-node .ck-inspector-tree-node__name:hover{background:var(--ck-inspector-color-tree-node-hover)}.ck-inspector-tree .ck-inspector-tree-node .ck-inspector-tree-node__content{border-left:1px solid var(--ck-inspector-color-tree-content-delimiter);padding:1px .5em 1px 1.5em;white-space:pre-wrap}.ck-inspector-tree .ck-inspector-tree-node:not(.ck-inspector-tree-node_tagless) .ck-inspector-tree-node__name>.ck-inspector-tree-node__name__bracket_open:after{color:var(--ck-inspector-color-tree-node-tag);content:"<"}.ck-inspector-tree .ck-inspector-tree-node:not(.ck-inspector-tree-node_tagless) .ck-inspector-tree-node__name .ck-inspector-tree-node__name__bracket_close:after{color:var(--ck-inspector-color-tree-node-tag);content:">"}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_empty:not(.ck-inspector-tree-node_tagless) .ck-inspector-tree-node__name:after{content:" />"}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_tagless .ck-inspector-tree-node__content{display:none}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name:not(.ck-inspector-tree-node__name_close),.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name:not(.ck-inspector-tree-node__name_close) :not(.ck-inspector-tree__position),.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name:not(.ck-inspector-tree-node__name_close)>.ck-inspector-tree-node__name__bracket:after{background:var(--ck-inspector-color-tree-node-name-active-bg);color:var(--ck-inspector-color-white)}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__content,.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name_close{background:var(--ck-inspector-color-tree-node-active-bg)}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__content{border-left-color:var(--ck-inspector-color-tree-node-name-active-bg)}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name{border-left:1px solid var(--ck-inspector-color-tree-node-name-active-bg)}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_disabled{opacity:.8}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_disabled .ck-inspector-tree-node__name,.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_disabled .ck-inspector-tree-node__name *{color:var(--ck-inspector-color-tree-node-inactive)}.ck-inspector-tree .ck-inspector-tree-text{display:block;margin-bottom:1px}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-node__content{border:1px dotted var(--ck-inspector-color-tree-text-border);border-radius:2px;display:inline-block;margin-right:1px;padding:0 1px;word-break:break-all}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes:not(:empty){margin-right:.5em}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes .ck-inspector-tree-node__attribute{background:var(--ck-inspector-color-tree-node-attribute-name);border-radius:2px;padding:0 .5em}:is(.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes .ck-inspector-tree-node__attribute)+.ck-inspector-tree-node__attribute{margin-left:.2em}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes .ck-inspector-tree-node__attribute>*{color:var(--ck-inspector-color-white)}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes .ck-inspector-tree-node__attribute:first-child{margin-left:0}.ck-inspector-tree .ck-inspector-tree-text.ck-inspector-tree-node_active .ck-inspector-tree-node__content{border-color:var(--ck-inspector-color-tree-node-name-active-bg);border-style:solid}.ck-inspector-tree .ck-inspector-tree-text.ck-inspector-tree-node_active .ck-inspector-tree-node__attribute{background:var(--ck-inspector-color-white)}.ck-inspector-tree .ck-inspector-tree-text.ck-inspector-tree-node_active .ck-inspector-tree-node__attribute>*{color:var(--ck-inspector-color-tree-node-name-active-bg)}.ck-inspector-tree .ck-inspector-tree-text.ck-inspector-tree-node_active>.ck-inspector-tree-node__content{background:var(--ck-inspector-color-tree-node-name-active-bg);color:var(--ck-inspector-color-white)}.ck-inspector-tree .ck-inspector-tree-text:not(.ck-inspector-tree-node_active) .ck-inspector-tree-node__content:hover{background:var(--ck-inspector-color-tree-node-hover);border-color:var(--ck-inspector-color-tree-node-border-hover);border-style:solid}.ck-inspector-tree.ck-inspector-tree_text-direction_ltr .ck-inspector-tree-node__content{direction:ltr}.ck-inspector-tree.ck-inspector-tree_text-direction_rtl .ck-inspector-tree-node__content{direction:rtl}.ck-inspector-tree.ck-inspector-tree_text-direction_rtl .ck-inspector-tree-node__content .ck-inspector-tree-node__name{direction:ltr}.ck-inspector-tree.ck-inspector-tree_text-direction_rtl .ck-inspector-tree__position{transform:rotate(180deg)}.ck-inspector-tree .ck-inspector-tree-comment{color:var(--ck-inspector-color-comment);font-style:italic}.ck-inspector-tree .ck-inspector-tree-comment a{color:inherit;text-decoration:underline}.ck-inspector-tree_compact-text .ck-inspector-tree-text,.ck-inspector-tree_compact-text .ck-inspector-tree-text .ck-inspector-tree-node__content{display:inline}.ck-inspector .ck-inspector__tree__navigation{border-bottom:1px solid var(--ck-inspector-color-border);padding:.5em 1em}.ck-inspector .ck-inspector__tree__navigation label{margin-right:.5em}.ck-inspector-tree .ck-inspector-tree__position{cursor:default;display:inline-block;height:100%;pointer-events:none;position:relative;vertical-align:top}.ck-inspector-tree .ck-inspector-tree__position:after{border:1px solid var(--ck-inspector-color-tree-position);bottom:0;content:"";margin-left:-1px;position:absolute;top:0;width:0}.ck-inspector-tree .ck-inspector-tree__position:before{margin-left:-1px}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_selection{--ck-inspector-color-tree-position:var(--ck-inspector-color-tree-selection);z-index:2}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_selection:before{border-bottom:2px solid var(--ck-inspector-color-tree-position);border-top:2px solid var(--ck-inspector-color-tree-position);bottom:-1px;content:"";left:0;position:absolute;top:-1px;width:8px}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_selection.ck-inspector-tree__position_end:before{left:auto;right:-1px}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_marker{z-index:1}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_marker:before{border-color:var(--ck-inspector-color-tree-position) transparent transparent transparent;border-style:solid;border-width:7px 7px 0 0;content:"";cursor:default;display:block;height:0;left:0;position:absolute;top:-1px;width:0}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_marker.ck-inspector-tree__position_end:before{border-color:transparent var(--ck-inspector-color-tree-position) transparent transparent;border-width:0 7px 7px 0;left:-5px}`, ""]);
        const C = d;
      }, 5556: (i, u, f) => {
        i.exports = f(2694)();
      }, 5627: (i, u, f) => {
        var k = f(5072), d = f(1062);
        typeof (d = d.__esModule ? d.default : d) == "string" && (d = [[i.id, d, ""]]);
        var C = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        k(d, C), i.exports = d.locals || {};
      }, 5794: (i, u, f) => {
        var k = f(6027), d = k.default, C = k.DraggableCore;
        i.exports = d, i.exports.default = d, i.exports.DraggableCore = C;
      }, 6027: (i, u, f) => {
        Object.defineProperty(u, "__esModule", { value: !0 }), Object.defineProperty(u, "DraggableCore", { enumerable: !0, get: function() {
          return R.default;
        } }), u.default = void 0;
        var k = (function(Z) {
          if (Z && Z.__esModule) return Z;
          if (Z === null || J(Z) !== "object" && typeof Z != "function") return { default: Z };
          var U = se();
          if (U && U.has(Z)) return U.get(Z);
          var X = {}, le = Object.defineProperty && Object.getOwnPropertyDescriptor;
          for (var me in Z) if (Object.prototype.hasOwnProperty.call(Z, me)) {
            var ke = le ? Object.getOwnPropertyDescriptor(Z, me) : null;
            ke && (ke.get || ke.set) ? Object.defineProperty(X, me, ke) : X[me] = Z[me];
          }
          return X.default = Z, U && U.set(Z, X), X;
        })(f(6540)), d = L(f(5556)), C = L(f(961)), m = L(f(6942)), b = f(1089), v = f(1726), N = f(7056), R = L(f(6888)), D = L(f(8696));
        function L(Z) {
          return Z && Z.__esModule ? Z : { default: Z };
        }
        function se() {
          if (typeof WeakMap != "function") return null;
          var Z = /* @__PURE__ */ new WeakMap();
          return se = function() {
            return Z;
          }, Z;
        }
        function J(Z) {
          return J = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(U) {
            return typeof U;
          } : function(U) {
            return U && typeof Symbol == "function" && U.constructor === Symbol && U !== Symbol.prototype ? "symbol" : typeof U;
          }, J(Z);
        }
        function M() {
          return M = Object.assign || function(Z) {
            for (var U = 1; U < arguments.length; U++) {
              var X = arguments[U];
              for (var le in X) Object.prototype.hasOwnProperty.call(X, le) && (Z[le] = X[le]);
            }
            return Z;
          }, M.apply(this, arguments);
        }
        function F(Z, U) {
          if (Z == null) return {};
          var X, le, me = (function(Ne, Ue) {
            if (Ne == null) return {};
            var Ae, Le, Ke = {}, Je = Object.keys(Ne);
            for (Le = 0; Le < Je.length; Le++) Ae = Je[Le], Ue.indexOf(Ae) >= 0 || (Ke[Ae] = Ne[Ae]);
            return Ke;
          })(Z, U);
          if (Object.getOwnPropertySymbols) {
            var ke = Object.getOwnPropertySymbols(Z);
            for (le = 0; le < ke.length; le++) X = ke[le], U.indexOf(X) >= 0 || Object.prototype.propertyIsEnumerable.call(Z, X) && (me[X] = Z[X]);
          }
          return me;
        }
        function B(Z, U) {
          return (function(X) {
            if (Array.isArray(X)) return X;
          })(Z) || (function(X, le) {
            if (!(typeof Symbol > "u" || !(Symbol.iterator in Object(X)))) {
              var me = [], ke = !0, Ne = !1, Ue = void 0;
              try {
                for (var Ae, Le = X[Symbol.iterator](); !(ke = (Ae = Le.next()).done) && (me.push(Ae.value), !le || me.length !== le); ke = !0) ;
              } catch (Ke) {
                Ne = !0, Ue = Ke;
              } finally {
                try {
                  ke || Le.return == null || Le.return();
                } finally {
                  if (Ne) throw Ue;
                }
              }
              return me;
            }
          })(Z, U) || (function(X, le) {
            if (X) {
              if (typeof X == "string") return ne(X, le);
              var me = Object.prototype.toString.call(X).slice(8, -1);
              if (me === "Object" && X.constructor && (me = X.constructor.name), me === "Map" || me === "Set") return Array.from(X);
              if (me === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(me)) return ne(X, le);
            }
          })(Z, U) || (function() {
            throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
          })();
        }
        function ne(Z, U) {
          (U == null || U > Z.length) && (U = Z.length);
          for (var X = 0, le = new Array(U); X < U; X++) le[X] = Z[X];
          return le;
        }
        function pe(Z, U) {
          var X = Object.keys(Z);
          if (Object.getOwnPropertySymbols) {
            var le = Object.getOwnPropertySymbols(Z);
            U && (le = le.filter(function(me) {
              return Object.getOwnPropertyDescriptor(Z, me).enumerable;
            })), X.push.apply(X, le);
          }
          return X;
        }
        function oe(Z) {
          for (var U = 1; U < arguments.length; U++) {
            var X = arguments[U] != null ? arguments[U] : {};
            U % 2 ? pe(Object(X), !0).forEach(function(le) {
              G(Z, le, X[le]);
            }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(Z, Object.getOwnPropertyDescriptors(X)) : pe(Object(X)).forEach(function(le) {
              Object.defineProperty(Z, le, Object.getOwnPropertyDescriptor(X, le));
            });
          }
          return Z;
        }
        function fe(Z, U) {
          for (var X = 0; X < U.length; X++) {
            var le = U[X];
            le.enumerable = le.enumerable || !1, le.configurable = !0, "value" in le && (le.writable = !0), Object.defineProperty(Z, le.key, le);
          }
        }
        function ge(Z, U, X) {
          return U && fe(Z.prototype, U), X && fe(Z, X), Z;
        }
        function S(Z, U) {
          return S = Object.setPrototypeOf || function(X, le) {
            return X.__proto__ = le, X;
          }, S(Z, U);
        }
        function j(Z) {
          var U = (function() {
            if (typeof Reflect > "u" || !Reflect.construct || Reflect.construct.sham) return !1;
            if (typeof Proxy == "function") return !0;
            try {
              return Date.prototype.toString.call(Reflect.construct(Date, [], function() {
              })), !0;
            } catch {
              return !1;
            }
          })();
          return function() {
            var X, le = ae(Z);
            if (U) {
              var me = ae(this).constructor;
              X = Reflect.construct(le, arguments, me);
            } else X = le.apply(this, arguments);
            return (function(ke, Ne) {
              return Ne && (J(Ne) === "object" || typeof Ne == "function") ? Ne : A(ke);
            })(this, X);
          };
        }
        function A(Z) {
          if (Z === void 0) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
          return Z;
        }
        function ae(Z) {
          return ae = Object.setPrototypeOf ? Object.getPrototypeOf : function(U) {
            return U.__proto__ || Object.getPrototypeOf(U);
          }, ae(Z);
        }
        function G(Z, U, X) {
          return U in Z ? Object.defineProperty(Z, U, { value: X, enumerable: !0, configurable: !0, writable: !0 }) : Z[U] = X, Z;
        }
        var Ee = (function(Z) {
          (function(le, me) {
            if (typeof me != "function" && me !== null) throw new TypeError("Super expression must either be null or a function");
            le.prototype = Object.create(me && me.prototype, { constructor: { value: le, writable: !0, configurable: !0 } }), me && S(le, me);
          })(X, Z);
          var U = j(X);
          function X(le) {
            var me;
            return (function(ke, Ne) {
              if (!(ke instanceof Ne)) throw new TypeError("Cannot call a class as a function");
            })(this, X), G(A(me = U.call(this, le)), "onDragStart", function(ke, Ne) {
              if ((0, D.default)("Draggable: onDragStart: %j", Ne), me.props.onStart(ke, (0, v.createDraggableData)(A(me), Ne)) === !1) return !1;
              me.setState({ dragging: !0, dragged: !0 });
            }), G(A(me), "onDrag", function(ke, Ne) {
              if (!me.state.dragging) return !1;
              (0, D.default)("Draggable: onDrag: %j", Ne);
              var Ue = (0, v.createDraggableData)(A(me), Ne), Ae = { x: Ue.x, y: Ue.y };
              if (me.props.bounds) {
                var Le = Ae.x, Ke = Ae.y;
                Ae.x += me.state.slackX, Ae.y += me.state.slackY;
                var Je = B((0, v.getBoundPosition)(A(me), Ae.x, Ae.y), 2), ye = Je[0], P = Je[1];
                Ae.x = ye, Ae.y = P, Ae.slackX = me.state.slackX + (Le - Ae.x), Ae.slackY = me.state.slackY + (Ke - Ae.y), Ue.x = Ae.x, Ue.y = Ae.y, Ue.deltaX = Ae.x - me.state.x, Ue.deltaY = Ae.y - me.state.y;
              }
              if (me.props.onDrag(ke, Ue) === !1) return !1;
              me.setState(Ae);
            }), G(A(me), "onDragStop", function(ke, Ne) {
              if (!me.state.dragging || me.props.onStop(ke, (0, v.createDraggableData)(A(me), Ne)) === !1) return !1;
              (0, D.default)("Draggable: onDragStop: %j", Ne);
              var Ue = { dragging: !1, slackX: 0, slackY: 0 };
              if (me.props.position) {
                var Ae = me.props.position, Le = Ae.x, Ke = Ae.y;
                Ue.x = Le, Ue.y = Ke;
              }
              me.setState(Ue);
            }), me.state = { dragging: !1, dragged: !1, x: le.position ? le.position.x : le.defaultPosition.x, y: le.position ? le.position.y : le.defaultPosition.y, prevPropsPosition: oe({}, le.position), slackX: 0, slackY: 0, isElementSVG: !1 }, !le.position || le.onDrag || le.onStop || console.warn("A `position` was applied to this <Draggable>, without drag handlers. This will make this component effectively undraggable. Please attach `onDrag` or `onStop` handlers so you can adjust the `position` of this element."), me;
          }
          return ge(X, null, [{ key: "getDerivedStateFromProps", value: function(le, me) {
            var ke = le.position, Ne = me.prevPropsPosition;
            return !ke || Ne && ke.x === Ne.x && ke.y === Ne.y ? null : ((0, D.default)("Draggable: getDerivedStateFromProps %j", { position: ke, prevPropsPosition: Ne }), { x: ke.x, y: ke.y, prevPropsPosition: oe({}, ke) });
          } }]), ge(X, [{ key: "componentDidMount", value: function() {
            window.SVGElement !== void 0 && this.findDOMNode() instanceof window.SVGElement && this.setState({ isElementSVG: !0 });
          } }, { key: "componentWillUnmount", value: function() {
            this.setState({ dragging: !1 });
          } }, { key: "findDOMNode", value: function() {
            return this.props.nodeRef ? this.props.nodeRef.current : C.default.findDOMNode(this);
          } }, { key: "render", value: function() {
            var le, me = this.props, ke = (me.axis, me.bounds, me.children), Ne = me.defaultPosition, Ue = me.defaultClassName, Ae = me.defaultClassNameDragging, Le = me.defaultClassNameDragged, Ke = me.position, Je = me.positionOffset, ye = (me.scale, F(me, ["axis", "bounds", "children", "defaultPosition", "defaultClassName", "defaultClassNameDragging", "defaultClassNameDragged", "position", "positionOffset", "scale"])), P = {}, ee = null, we = !Ke || this.state.dragging, Se = Ke || Ne, Pe = { x: (0, v.canDragX)(this) && we ? this.state.x : Se.x, y: (0, v.canDragY)(this) && we ? this.state.y : Se.y };
            this.state.isElementSVG ? ee = (0, b.createSVGTransform)(Pe, Je) : P = (0, b.createCSSTransform)(Pe, Je);
            var _e = (0, m.default)(ke.props.className || "", Ue, (G(le = {}, Ae, this.state.dragging), G(le, Le, this.state.dragged), le));
            return k.createElement(R.default, M({}, ye, { onStart: this.onDragStart, onDrag: this.onDrag, onStop: this.onDragStop }), k.cloneElement(k.Children.only(ke), { className: _e, style: oe(oe({}, ke.props.style), P), transform: ee }));
          } }]), X;
        })(k.Component);
        u.default = Ee, G(Ee, "displayName", "Draggable"), G(Ee, "propTypes", oe(oe({}, R.default.propTypes), {}, { axis: d.default.oneOf(["both", "x", "y", "none"]), bounds: d.default.oneOfType([d.default.shape({ left: d.default.number, right: d.default.number, top: d.default.number, bottom: d.default.number }), d.default.string, d.default.oneOf([!1])]), defaultClassName: d.default.string, defaultClassNameDragging: d.default.string, defaultClassNameDragged: d.default.string, defaultPosition: d.default.shape({ x: d.default.number, y: d.default.number }), positionOffset: d.default.shape({ x: d.default.oneOfType([d.default.number, d.default.string]), y: d.default.oneOfType([d.default.number, d.default.string]) }), position: d.default.shape({ x: d.default.number, y: d.default.number }), className: N.dontSetMe, style: N.dontSetMe, transform: N.dontSetMe })), G(Ee, "defaultProps", oe(oe({}, R.default.defaultProps), {}, { axis: "both", bounds: !1, defaultClassName: "react-draggable", defaultClassNameDragging: "react-draggable-dragging", defaultClassNameDragged: "react-draggable-dragged", defaultPosition: { x: 0, y: 0 }, position: null, scale: 1 }));
      }, 6314: (i) => {
        i.exports = function(u) {
          var f = [];
          return f.toString = function() {
            return this.map(function(k) {
              var d = u(k);
              return k[2] ? "@media ".concat(k[2], " {").concat(d, "}") : d;
            }).join("");
          }, f.i = function(k, d, C) {
            typeof k == "string" && (k = [[null, k, ""]]);
            var m = {};
            if (C) for (var b = 0; b < this.length; b++) {
              var v = this[b][0];
              v != null && (m[v] = !0);
            }
            for (var N = 0; N < k.length; N++) {
              var R = [].concat(k[N]);
              C && m[R[0]] || (d && (R[2] ? R[2] = "".concat(d, " and ").concat(R[2]) : R[2] = d), f.push(R));
            }
          }, f;
        };
      }, 6412: (i, u, f) => {
        f.r(u), f.d(u, { default: () => C });
        var k = f(6314), d = f.n(k)()(function(m) {
          return m[1];
        });
        d.push([i.id, ".ck-inspector-model-tree__hide-markers .ck-inspector-tree__position.ck-inspector-tree__position_marker{display:none}", ""]);
        const C = d;
      }, 6426: (i) => {
        i.exports = function() {
          var u = document.getSelection();
          if (!u.rangeCount) return function() {
          };
          for (var f = document.activeElement, k = [], d = 0; d < u.rangeCount; d++) k.push(u.getRangeAt(d));
          switch (f.tagName.toUpperCase()) {
            case "INPUT":
            case "TEXTAREA":
              f.blur();
              break;
            default:
              f = null;
          }
          return u.removeAllRanges(), function() {
            u.type === "Caret" && u.removeAllRanges(), u.rangeCount || k.forEach(function(C) {
              u.addRange(C);
            }), f && f.focus();
          };
        };
      }, 6462: (i, u, f) => {
        Object.defineProperty(u, "__esModule", { value: !0 }), u.resetState = function() {
          b && (b.removeAttribute ? b.removeAttribute("aria-hidden") : b.length != null ? b.forEach(function(R) {
            return R.removeAttribute("aria-hidden");
          }) : document.querySelectorAll(b).forEach(function(R) {
            return R.removeAttribute("aria-hidden");
          })), b = null;
        }, u.log = function() {
        }, u.assertNodeList = v, u.setElement = function(R) {
          var D = R;
          if (typeof D == "string" && m.canUseDOM) {
            var L = document.querySelectorAll(D);
            v(L, D), D = L;
          }
          return b = D || b;
        }, u.validateElement = N, u.hide = function(R) {
          var D = !0, L = !1, se = void 0;
          try {
            for (var J, M = N(R)[Symbol.iterator](); !(D = (J = M.next()).done); D = !0)
              J.value.setAttribute("aria-hidden", "true");
          } catch (F) {
            L = !0, se = F;
          } finally {
            try {
              !D && M.return && M.return();
            } finally {
              if (L) throw se;
            }
          }
        }, u.show = function(R) {
          var D = !0, L = !1, se = void 0;
          try {
            for (var J, M = N(R)[Symbol.iterator](); !(D = (J = M.next()).done); D = !0)
              J.value.removeAttribute("aria-hidden");
          } catch (F) {
            L = !0, se = F;
          } finally {
            try {
              !D && M.return && M.return();
            } finally {
              if (L) throw se;
            }
          }
        }, u.documentNotReadyOrSSRTesting = function() {
          b = null;
        };
        var k, d = f(9771), C = (k = d) && k.__esModule ? k : { default: k }, m = f(834), b = null;
        function v(R, D) {
          if (!R || !R.length) throw new Error("react-modal: No elements were found for selector " + D + ".");
        }
        function N(R) {
          var D = R || b;
          return D ? Array.isArray(D) || D instanceof HTMLCollection || D instanceof NodeList ? D : [D] : ((0, C.default)(!1, ["react-modal: App element is not defined.", "Please use `Modal.setAppElement(el)` or set `appElement={el}`.", "This is needed so screen readers don't see main content", "when modal is opened. It is not recommended, but you can opt-out", "by setting `ariaHideApp={false}`."].join(" ")), []);
        }
      }, 6540: (i, u, f) => {
        i.exports = f(5287);
      }, 6709: (i, u, f) => {
        var k = f(5072), d = f(6412);
        typeof (d = d.__esModule ? d.default : d) == "string" && (d = [[i.id, d, ""]]);
        var C = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        k(d, C), i.exports = d.locals || {};
      }, 6888: (i, u, f) => {
        Object.defineProperty(u, "__esModule", { value: !0 }), u.default = void 0;
        var k = (function(A) {
          if (A && A.__esModule) return A;
          if (A === null || L(A) !== "object" && typeof A != "function") return { default: A };
          var ae = D();
          if (ae && ae.has(A)) return ae.get(A);
          var G = {}, Ee = Object.defineProperty && Object.getOwnPropertyDescriptor;
          for (var Z in A) if (Object.prototype.hasOwnProperty.call(A, Z)) {
            var U = Ee ? Object.getOwnPropertyDescriptor(A, Z) : null;
            U && (U.get || U.set) ? Object.defineProperty(G, Z, U) : G[Z] = A[Z];
          }
          return G.default = A, ae && ae.set(A, G), G;
        })(f(6540)), d = R(f(5556)), C = R(f(961)), m = f(1089), b = f(1726), v = f(7056), N = R(f(8696));
        function R(A) {
          return A && A.__esModule ? A : { default: A };
        }
        function D() {
          if (typeof WeakMap != "function") return null;
          var A = /* @__PURE__ */ new WeakMap();
          return D = function() {
            return A;
          }, A;
        }
        function L(A) {
          return L = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(ae) {
            return typeof ae;
          } : function(ae) {
            return ae && typeof Symbol == "function" && ae.constructor === Symbol && ae !== Symbol.prototype ? "symbol" : typeof ae;
          }, L(A);
        }
        function se(A, ae) {
          return (function(G) {
            if (Array.isArray(G)) return G;
          })(A) || (function(G, Ee) {
            if (!(typeof Symbol > "u" || !(Symbol.iterator in Object(G)))) {
              var Z = [], U = !0, X = !1, le = void 0;
              try {
                for (var me, ke = G[Symbol.iterator](); !(U = (me = ke.next()).done) && (Z.push(me.value), !Ee || Z.length !== Ee); U = !0) ;
              } catch (Ne) {
                X = !0, le = Ne;
              } finally {
                try {
                  U || ke.return == null || ke.return();
                } finally {
                  if (X) throw le;
                }
              }
              return Z;
            }
          })(A, ae) || (function(G, Ee) {
            if (G) {
              if (typeof G == "string") return J(G, Ee);
              var Z = Object.prototype.toString.call(G).slice(8, -1);
              if (Z === "Object" && G.constructor && (Z = G.constructor.name), Z === "Map" || Z === "Set") return Array.from(G);
              if (Z === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(Z)) return J(G, Ee);
            }
          })(A, ae) || (function() {
            throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
          })();
        }
        function J(A, ae) {
          (ae == null || ae > A.length) && (ae = A.length);
          for (var G = 0, Ee = new Array(ae); G < ae; G++) Ee[G] = A[G];
          return Ee;
        }
        function M(A, ae) {
          for (var G = 0; G < ae.length; G++) {
            var Ee = ae[G];
            Ee.enumerable = Ee.enumerable || !1, Ee.configurable = !0, "value" in Ee && (Ee.writable = !0), Object.defineProperty(A, Ee.key, Ee);
          }
        }
        function F(A, ae) {
          return F = Object.setPrototypeOf || function(G, Ee) {
            return G.__proto__ = Ee, G;
          }, F(A, ae);
        }
        function B(A) {
          var ae = (function() {
            if (typeof Reflect > "u" || !Reflect.construct || Reflect.construct.sham) return !1;
            if (typeof Proxy == "function") return !0;
            try {
              return Date.prototype.toString.call(Reflect.construct(Date, [], function() {
              })), !0;
            } catch {
              return !1;
            }
          })();
          return function() {
            var G, Ee = pe(A);
            if (ae) {
              var Z = pe(this).constructor;
              G = Reflect.construct(Ee, arguments, Z);
            } else G = Ee.apply(this, arguments);
            return (function(U, X) {
              return X && (L(X) === "object" || typeof X == "function") ? X : ne(U);
            })(this, G);
          };
        }
        function ne(A) {
          if (A === void 0) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
          return A;
        }
        function pe(A) {
          return pe = Object.setPrototypeOf ? Object.getPrototypeOf : function(ae) {
            return ae.__proto__ || Object.getPrototypeOf(ae);
          }, pe(A);
        }
        function oe(A, ae, G) {
          return ae in A ? Object.defineProperty(A, ae, { value: G, enumerable: !0, configurable: !0, writable: !0 }) : A[ae] = G, A;
        }
        var fe = { start: "touchstart", move: "touchmove", stop: "touchend" }, ge = { start: "mousedown", move: "mousemove", stop: "mouseup" }, S = ge, j = (function(A) {
          (function(U, X) {
            if (typeof X != "function" && X !== null) throw new TypeError("Super expression must either be null or a function");
            U.prototype = Object.create(X && X.prototype, { constructor: { value: U, writable: !0, configurable: !0 } }), X && F(U, X);
          })(Z, A);
          var ae, G, Ee = B(Z);
          function Z() {
            var U;
            (function(ke, Ne) {
              if (!(ke instanceof Ne)) throw new TypeError("Cannot call a class as a function");
            })(this, Z);
            for (var X = arguments.length, le = new Array(X), me = 0; me < X; me++) le[me] = arguments[me];
            return oe(ne(U = Ee.call.apply(Ee, [this].concat(le))), "state", { dragging: !1, lastX: NaN, lastY: NaN, touchIdentifier: null }), oe(ne(U), "mounted", !1), oe(ne(U), "handleDragStart", function(ke) {
              if (U.props.onMouseDown(ke), !U.props.allowAnyClick && typeof ke.button == "number" && ke.button !== 0) return !1;
              var Ne = U.findDOMNode();
              if (!Ne || !Ne.ownerDocument || !Ne.ownerDocument.body) throw new Error("<DraggableCore> not mounted on DragStart!");
              var Ue = Ne.ownerDocument;
              if (!(U.props.disabled || !(ke.target instanceof Ue.defaultView.Node) || U.props.handle && !(0, m.matchesSelectorAndParentsTo)(ke.target, U.props.handle, Ne) || U.props.cancel && (0, m.matchesSelectorAndParentsTo)(ke.target, U.props.cancel, Ne))) {
                ke.type === "touchstart" && ke.preventDefault();
                var Ae = (0, m.getTouchIdentifier)(ke);
                U.setState({ touchIdentifier: Ae });
                var Le = (0, b.getControlPosition)(ke, Ae, ne(U));
                if (Le != null) {
                  var Ke = Le.x, Je = Le.y, ye = (0, b.createCoreData)(ne(U), Ke, Je);
                  (0, N.default)("DraggableCore: handleDragStart: %j", ye), (0, N.default)("calling", U.props.onStart), U.props.onStart(ke, ye) !== !1 && U.mounted !== !1 && (U.props.enableUserSelectHack && (0, m.addUserSelectStyles)(Ue), U.setState({ dragging: !0, lastX: Ke, lastY: Je }), (0, m.addEvent)(Ue, S.move, U.handleDrag), (0, m.addEvent)(Ue, S.stop, U.handleDragStop));
                }
              }
            }), oe(ne(U), "handleDrag", function(ke) {
              var Ne = (0, b.getControlPosition)(ke, U.state.touchIdentifier, ne(U));
              if (Ne != null) {
                var Ue = Ne.x, Ae = Ne.y;
                if (Array.isArray(U.props.grid)) {
                  var Le = Ue - U.state.lastX, Ke = Ae - U.state.lastY, Je = se((0, b.snapToGrid)(U.props.grid, Le, Ke), 2);
                  if (Le = Je[0], Ke = Je[1], !Le && !Ke) return;
                  Ue = U.state.lastX + Le, Ae = U.state.lastY + Ke;
                }
                var ye = (0, b.createCoreData)(ne(U), Ue, Ae);
                if ((0, N.default)("DraggableCore: handleDrag: %j", ye), U.props.onDrag(ke, ye) !== !1 && U.mounted !== !1) U.setState({ lastX: Ue, lastY: Ae });
                else try {
                  U.handleDragStop(new MouseEvent("mouseup"));
                } catch {
                  var P = document.createEvent("MouseEvents");
                  P.initMouseEvent("mouseup", !0, !0, window, 0, 0, 0, 0, 0, !1, !1, !1, !1, 0, null), U.handleDragStop(P);
                }
              }
            }), oe(ne(U), "handleDragStop", function(ke) {
              if (U.state.dragging) {
                var Ne = (0, b.getControlPosition)(ke, U.state.touchIdentifier, ne(U));
                if (Ne != null) {
                  var Ue = Ne.x, Ae = Ne.y, Le = (0, b.createCoreData)(ne(U), Ue, Ae);
                  if (U.props.onStop(ke, Le) === !1 || U.mounted === !1) return !1;
                  var Ke = U.findDOMNode();
                  Ke && U.props.enableUserSelectHack && (0, m.removeUserSelectStyles)(Ke.ownerDocument), (0, N.default)("DraggableCore: handleDragStop: %j", Le), U.setState({ dragging: !1, lastX: NaN, lastY: NaN }), Ke && ((0, N.default)("DraggableCore: Removing handlers"), (0, m.removeEvent)(Ke.ownerDocument, S.move, U.handleDrag), (0, m.removeEvent)(Ke.ownerDocument, S.stop, U.handleDragStop));
                }
              }
            }), oe(ne(U), "onMouseDown", function(ke) {
              return S = ge, U.handleDragStart(ke);
            }), oe(ne(U), "onMouseUp", function(ke) {
              return S = ge, U.handleDragStop(ke);
            }), oe(ne(U), "onTouchStart", function(ke) {
              return S = fe, U.handleDragStart(ke);
            }), oe(ne(U), "onTouchEnd", function(ke) {
              return S = fe, U.handleDragStop(ke);
            }), U;
          }
          return ae = Z, (G = [{ key: "componentDidMount", value: function() {
            this.mounted = !0;
            var U = this.findDOMNode();
            U && (0, m.addEvent)(U, fe.start, this.onTouchStart, { passive: !1 });
          } }, { key: "componentWillUnmount", value: function() {
            this.mounted = !1;
            var U = this.findDOMNode();
            if (U) {
              var X = U.ownerDocument;
              (0, m.removeEvent)(X, ge.move, this.handleDrag), (0, m.removeEvent)(X, fe.move, this.handleDrag), (0, m.removeEvent)(X, ge.stop, this.handleDragStop), (0, m.removeEvent)(X, fe.stop, this.handleDragStop), (0, m.removeEvent)(U, fe.start, this.onTouchStart, { passive: !1 }), this.props.enableUserSelectHack && (0, m.removeUserSelectStyles)(X);
            }
          } }, { key: "findDOMNode", value: function() {
            return this.props.nodeRef ? this.props.nodeRef.current : C.default.findDOMNode(this);
          } }, { key: "render", value: function() {
            return k.cloneElement(k.Children.only(this.props.children), { onMouseDown: this.onMouseDown, onMouseUp: this.onMouseUp, onTouchEnd: this.onTouchEnd });
          } }]) && M(ae.prototype, G), Z;
        })(k.Component);
        u.default = j, oe(j, "displayName", "DraggableCore"), oe(j, "propTypes", { allowAnyClick: d.default.bool, disabled: d.default.bool, enableUserSelectHack: d.default.bool, offsetParent: function(A, ae) {
          if (A[ae] && A[ae].nodeType !== 1) throw new Error("Draggable's offsetParent must be a DOM Node.");
        }, grid: d.default.arrayOf(d.default.number), handle: d.default.string, cancel: d.default.string, nodeRef: d.default.object, onStart: d.default.func, onDrag: d.default.func, onStop: d.default.func, onMouseDown: d.default.func, scale: d.default.number, className: v.dontSetMe, style: v.dontSetMe, transform: v.dontSetMe }), oe(j, "defaultProps", { allowAnyClick: !1, cancel: null, disabled: !1, enableUserSelectHack: !0, offsetParent: null, handle: null, grid: null, transform: null, onStart: function() {
        }, onDrag: function() {
        }, onStop: function() {
        }, onMouseDown: function() {
        }, scale: 1 });
      }, 6925: (i) => {
        i.exports = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
      }, 6942: (i, u) => {
        var f;
        (function() {
          var k = {}.hasOwnProperty;
          function d() {
            for (var b = "", v = 0; v < arguments.length; v++) {
              var N = arguments[v];
              N && (b = m(b, C(N)));
            }
            return b;
          }
          function C(b) {
            if (typeof b == "string" || typeof b == "number") return b;
            if (typeof b != "object") return "";
            if (Array.isArray(b)) return d.apply(null, b);
            if (b.toString !== Object.prototype.toString && !b.toString.toString().includes("[native code]")) return b.toString();
            var v = "";
            for (var N in b) k.call(b, N) && b[N] && (v = m(v, N));
            return v;
          }
          function m(b, v) {
            return v ? b ? b + " " + v : b + v : b;
          }
          i.exports ? (d.default = d, i.exports = d) : (f = (function() {
            return d;
          }).apply(u, [])) === void 0 || (i.exports = f);
        })();
      }, 7024: (i, u, f) => {
        var k = f(5072), d = f(8845);
        typeof (d = d.__esModule ? d.default : d) == "string" && (d = [[i.id, d, ""]]);
        var C = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        k(d, C), i.exports = d.locals || {};
      }, 7056: (i, u) => {
        Object.defineProperty(u, "__esModule", { value: !0 }), u.findInArray = function(f, k) {
          for (var d = 0, C = f.length; d < C; d++) if (k.apply(k, [f[d], d, f])) return f[d];
        }, u.isFunction = function(f) {
          return typeof f == "function" || Object.prototype.toString.call(f) === "[object Function]";
        }, u.isNum = function(f) {
          return typeof f == "number" && !isNaN(f);
        }, u.int = function(f) {
          return parseInt(f, 10);
        }, u.dontSetMe = function(f, k, d) {
          if (f[k]) return new Error("Invalid prop ".concat(k, " passed to ").concat(d, " - do not set this, set it on the child."));
        };
      }, 7067: (i, u, f) => {
        Object.defineProperty(u, "__esModule", { value: !0 }), u.default = function(b, v) {
          var N = (0, C.default)(b);
          if (!N.length) return void v.preventDefault();
          var R = void 0, D = v.shiftKey, L = N[0], se = N[N.length - 1], J = m();
          if (b === J) {
            if (!D) return;
            R = se;
          }
          if (se !== J || D || (R = L), L === J && D && (R = se), R) return v.preventDefault(), void R.focus();
          var M = /(\bChrome\b|\bSafari\b)\//.exec(navigator.userAgent);
          if (!(M == null || M[1] == "Chrome" || /\biPod\b|\biPad\b/g.exec(navigator.userAgent) != null)) {
            var F = N.indexOf(J);
            if (F > -1 && (F += D ? -1 : 1), (R = N[F]) === void 0) return v.preventDefault(), void (R = D ? se : L).focus();
            v.preventDefault(), R.focus();
          }
        };
        var k, d = f(2411), C = (k = d) && k.__esModule ? k : { default: k };
        function m() {
          var b = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : document;
          return b.activeElement.shadowRoot ? m(b.activeElement.shadowRoot) : b.activeElement;
        }
        i.exports = u.default;
      }, 7195: (i, u, f) => {
        f.r(u), f.d(u, { default: () => C });
        var k = f(6314), d = f.n(k)()(function(m) {
          return m[1];
        });
        d.push([i.id, ".ck-inspector-modal{--ck-inspector-set-data-modal-overlay:rgba(0,0,0,.5);--ck-inspector-set-data-modal-shadow:rgba(0,0,0,.06);--ck-inspector-set-data-modal-button-background:#eee;--ck-inspector-set-data-modal-button-background-hover:#ddd;--ck-inspector-set-data-modal-save-button-background:#1976d2;--ck-inspector-set-data-modal-save-button-background-hover:#0b60b5}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal{background-color:var(--ck-inspector-set-data-modal-overlay);inset:0;position:fixed;z-index:999999}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content{background:var(--ck-inspector-color-white);border:1px solid var(--ck-inspector-color-border);border-radius:2px;box-shadow:0 1px 1px var(--ck-inspector-set-data-modal-shadow),0 2px 2px var(--ck-inspector-set-data-modal-shadow),0 4px 4px var(--ck-inspector-set-data-modal-shadow),0 8px 8px var(--ck-inspector-set-data-modal-shadow),0 16px 16px var(--ck-inspector-set-data-modal-shadow);display:flex;flex-direction:column;height:100%;justify-content:space-between;left:50%;max-height:calc(100vh - 160px);max-width:calc(100vw - 160px);outline:none;overflow:auto;position:absolute;top:50%;transform:translate(-50%,-50%);width:100%}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content h2{background:var(--ck-inspector-color-background);border-bottom:1px solid var(--ck-inspector-color-border);font-size:14px;font-weight:700;margin:0;padding:12px 20px}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content textarea{border:1px solid var(--ck-inspector-color-border);border-radius:2px;flex-grow:1;font-family:monospace;font-size:14px;margin:20px;padding:10px;resize:none}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content button{border:1px solid var(--ck-inspector-color-border);border-radius:2px;font-size:14px;padding:10px 20px;white-space:nowrap}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content button:hover{background:var(--ck-inspector-set-data-modal-button-background-hover)}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons{display:flex;justify-content:center;margin:0 20px 20px}:is(.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button)+button{margin-left:20px}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button:first-child{margin-right:auto}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button:not(:first-child){flex-basis:20%}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button:last-child{background:var(--ck-inspector-set-data-modal-save-button-background);border-color:var(--ck-inspector-set-data-modal-save-button-background);color:#fff;font-weight:700}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button:last-child:hover{background:var(--ck-inspector-set-data-modal-save-button-background-hover)}", ""]);
        const C = d;
      }, 7260: (i, u, f) => {
        f.r(u), f.d(u, { default: () => C });
        var k = f(6314), d = f.n(k)()(function(m) {
          return m[1];
        });
        d.push([i.id, ".ck-inspector .ck-inspector-editor-quick-actions{align-content:center;align-items:center;display:flex;flex-direction:row;flex-wrap:nowrap;justify-content:center}.ck-inspector .ck-inspector-editor-quick-actions>.ck-inspector-button{margin-left:.3em}.ck-inspector .ck-inspector-editor-quick-actions>.ck-inspector-button.ck-inspector-button_data-copied{animation-duration:.5s;animation-name:ck-inspector-bounce-in;color:green}@keyframes ck-inspector-bounce-in{0%{opacity:0;transform:scale3d(.5,.5,.5)}20%{transform:scale3d(1.1,1.1,1.1)}40%{transform:scale3d(.8,.8,.8)}60%{opacity:1;transform:scale3d(1.05,1.05,1.05)}to{opacity:1;transform:scaleX(1)}}", ""]);
        const C = d;
      }, 7463: (i, u) => {
        var f, k, d, C, m;
        if (typeof window > "u" || typeof MessageChannel != "function") {
          var b = null, v = null, N = function() {
            if (b !== null) try {
              var ye = u.unstable_now();
              b(!0, ye), b = null;
            } catch (P) {
              throw setTimeout(N, 0), P;
            }
          }, R = Date.now();
          u.unstable_now = function() {
            return Date.now() - R;
          }, f = function(ye) {
            b !== null ? setTimeout(f, 0, ye) : (b = ye, setTimeout(N, 0));
          }, k = function(ye, P) {
            v = setTimeout(ye, P);
          }, d = function() {
            clearTimeout(v);
          }, C = function() {
            return !1;
          }, m = u.unstable_forceFrameRate = function() {
          };
        } else {
          var D = window.performance, L = window.Date, se = window.setTimeout, J = window.clearTimeout;
          if (typeof console < "u") {
            var M = window.cancelAnimationFrame;
            typeof window.requestAnimationFrame != "function" && console.error("This browser doesn't support requestAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills"), typeof M != "function" && console.error("This browser doesn't support cancelAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills");
          }
          if (typeof D == "object" && typeof D.now == "function") u.unstable_now = function() {
            return D.now();
          };
          else {
            var F = L.now();
            u.unstable_now = function() {
              return L.now() - F;
            };
          }
          var B = !1, ne = null, pe = -1, oe = 5, fe = 0;
          C = function() {
            return u.unstable_now() >= fe;
          }, m = function() {
          }, u.unstable_forceFrameRate = function(ye) {
            0 > ye || 125 < ye ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing framerates higher than 125 fps is not unsupported") : oe = 0 < ye ? Math.floor(1e3 / ye) : 5;
          };
          var ge = new MessageChannel(), S = ge.port2;
          ge.port1.onmessage = function() {
            if (ne !== null) {
              var ye = u.unstable_now();
              fe = ye + oe;
              try {
                ne(!0, ye) ? S.postMessage(null) : (B = !1, ne = null);
              } catch (P) {
                throw S.postMessage(null), P;
              }
            } else B = !1;
          }, f = function(ye) {
            ne = ye, B || (B = !0, S.postMessage(null));
          }, k = function(ye, P) {
            pe = se(function() {
              ye(u.unstable_now());
            }, P);
          }, d = function() {
            J(pe), pe = -1;
          };
        }
        function j(ye, P) {
          var ee = ye.length;
          ye.push(P);
          e: for (; ; ) {
            var we = ee - 1 >>> 1, Se = ye[we];
            if (!(Se !== void 0 && 0 < G(Se, P))) break e;
            ye[we] = P, ye[ee] = Se, ee = we;
          }
        }
        function A(ye) {
          return (ye = ye[0]) === void 0 ? null : ye;
        }
        function ae(ye) {
          var P = ye[0];
          if (P !== void 0) {
            var ee = ye.pop();
            if (ee !== P) {
              ye[0] = ee;
              e: for (var we = 0, Se = ye.length; we < Se; ) {
                var Pe = 2 * (we + 1) - 1, _e = ye[Pe], lt = Pe + 1, Qe = ye[lt];
                if (_e !== void 0 && 0 > G(_e, ee)) Qe !== void 0 && 0 > G(Qe, _e) ? (ye[we] = Qe, ye[lt] = ee, we = lt) : (ye[we] = _e, ye[Pe] = ee, we = Pe);
                else {
                  if (!(Qe !== void 0 && 0 > G(Qe, ee))) break e;
                  ye[we] = Qe, ye[lt] = ee, we = lt;
                }
              }
            }
            return P;
          }
          return null;
        }
        function G(ye, P) {
          var ee = ye.sortIndex - P.sortIndex;
          return ee !== 0 ? ee : ye.id - P.id;
        }
        var Ee = [], Z = [], U = 1, X = null, le = 3, me = !1, ke = !1, Ne = !1;
        function Ue(ye) {
          for (var P = A(Z); P !== null; ) {
            if (P.callback === null) ae(Z);
            else {
              if (!(P.startTime <= ye)) break;
              ae(Z), P.sortIndex = P.expirationTime, j(Ee, P);
            }
            P = A(Z);
          }
        }
        function Ae(ye) {
          if (Ne = !1, Ue(ye), !ke) if (A(Ee) !== null) ke = !0, f(Le);
          else {
            var P = A(Z);
            P !== null && k(Ae, P.startTime - ye);
          }
        }
        function Le(ye, P) {
          ke = !1, Ne && (Ne = !1, d()), me = !0;
          var ee = le;
          try {
            for (Ue(P), X = A(Ee); X !== null && (!(X.expirationTime > P) || ye && !C()); ) {
              var we = X.callback;
              if (we !== null) {
                X.callback = null, le = X.priorityLevel;
                var Se = we(X.expirationTime <= P);
                P = u.unstable_now(), typeof Se == "function" ? X.callback = Se : X === A(Ee) && ae(Ee), Ue(P);
              } else ae(Ee);
              X = A(Ee);
            }
            if (X !== null) var Pe = !0;
            else {
              var _e = A(Z);
              _e !== null && k(Ae, _e.startTime - P), Pe = !1;
            }
            return Pe;
          } finally {
            X = null, le = ee, me = !1;
          }
        }
        function Ke(ye) {
          switch (ye) {
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
        var Je = m;
        u.unstable_IdlePriority = 5, u.unstable_ImmediatePriority = 1, u.unstable_LowPriority = 4, u.unstable_NormalPriority = 3, u.unstable_Profiling = null, u.unstable_UserBlockingPriority = 2, u.unstable_cancelCallback = function(ye) {
          ye.callback = null;
        }, u.unstable_continueExecution = function() {
          ke || me || (ke = !0, f(Le));
        }, u.unstable_getCurrentPriorityLevel = function() {
          return le;
        }, u.unstable_getFirstCallbackNode = function() {
          return A(Ee);
        }, u.unstable_next = function(ye) {
          switch (le) {
            case 1:
            case 2:
            case 3:
              var P = 3;
              break;
            default:
              P = le;
          }
          var ee = le;
          le = P;
          try {
            return ye();
          } finally {
            le = ee;
          }
        }, u.unstable_pauseExecution = function() {
        }, u.unstable_requestPaint = Je, u.unstable_runWithPriority = function(ye, P) {
          switch (ye) {
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
              break;
            default:
              ye = 3;
          }
          var ee = le;
          le = ye;
          try {
            return P();
          } finally {
            le = ee;
          }
        }, u.unstable_scheduleCallback = function(ye, P, ee) {
          var we = u.unstable_now();
          if (typeof ee == "object" && ee !== null) {
            var Se = ee.delay;
            Se = typeof Se == "number" && 0 < Se ? we + Se : we, ee = typeof ee.timeout == "number" ? ee.timeout : Ke(ye);
          } else ee = Ke(ye), Se = we;
          return ye = { id: U++, callback: P, priorityLevel: ye, startTime: Se, expirationTime: ee = Se + ee, sortIndex: -1 }, Se > we ? (ye.sortIndex = Se, j(Z, ye), A(Ee) === null && ye === A(Z) && (Ne ? d() : Ne = !0, k(Ae, Se - we))) : (ye.sortIndex = ee, j(Ee, ye), ke || me || (ke = !0, f(Le))), ye;
        }, u.unstable_shouldYield = function() {
          var ye = u.unstable_now();
          Ue(ye);
          var P = A(Ee);
          return P !== X && X !== null && P !== null && P.callback !== null && P.startTime <= ye && P.expirationTime < X.expirationTime || C();
        }, u.unstable_wrapCallback = function(ye) {
          var P = le;
          return function() {
            var ee = le;
            le = P;
            try {
              return ye.apply(this, arguments);
            } finally {
              le = ee;
            }
          };
        };
      }, 7727: (i, u, f) => {
        Object.defineProperty(u, "__esModule", { value: !0 }), u.resetState = function() {
          for (var R = [m, b], D = 0; D < R.length; D++) {
            var L = R[D];
            L && L.parentNode && L.parentNode.removeChild(L);
          }
          m = b = null, v = [];
        }, u.log = function() {
          console.log("bodyTrap ----------"), console.log(v.length);
          for (var R = [m, b], D = 0; D < R.length; D++) {
            var L = R[D] || {};
            console.log(L.nodeName, L.className, L.id);
          }
          console.log("edn bodyTrap ----------");
        };
        var k, d = f(9628), C = (k = d) && k.__esModule ? k : { default: k }, m = void 0, b = void 0, v = [];
        function N() {
          v.length !== 0 && v[v.length - 1].focusContent();
        }
        C.default.subscribe(function(R, D) {
          m || b || ((m = document.createElement("div")).setAttribute("data-react-modal-body-trap", ""), m.style.position = "absolute", m.style.opacity = "0", m.setAttribute("tabindex", "0"), m.addEventListener("focus", N), (b = m.cloneNode()).addEventListener("focus", N)), (v = D).length > 0 ? (document.body.firstChild !== m && document.body.insertBefore(m, document.body.firstChild), document.body.lastChild !== b && document.body.appendChild(b)) : (m.parentElement && m.parentElement.removeChild(m), b.parentElement && b.parentElement.removeChild(b));
        });
      }, 7785: (i, u, f) => {
        var k = f(5072), d = f(2444);
        typeof (d = d.__esModule ? d.default : d) == "string" && (d = [[i.id, d, ""]]);
        var C = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        k(d, C), i.exports = d.locals || {};
      }, 7791: (i, u, f) => {
        Object.defineProperty(u, "__esModule", { value: !0 }), u.resetState = function() {
          m = [];
        }, u.log = function() {
        }, u.handleBlur = N, u.handleFocus = R, u.markForFocusLater = function() {
          m.push(document.activeElement);
        }, u.returnFocus = function() {
          var D = arguments.length > 0 && arguments[0] !== void 0 && arguments[0], L = null;
          try {
            return void (m.length !== 0 && (L = m.pop()).focus({ preventScroll: D }));
          } catch {
            console.warn(["You tried to return focus to", L, "but it is not in the DOM anymore"].join(" "));
          }
        }, u.popWithoutFocus = function() {
          m.length > 0 && m.pop();
        }, u.setupScopedFocus = function(D) {
          b = D, window.addEventListener ? (window.addEventListener("blur", N, !1), document.addEventListener("focus", R, !0)) : (window.attachEvent("onBlur", N), document.attachEvent("onFocus", R));
        }, u.teardownScopedFocus = function() {
          b = null, window.addEventListener ? (window.removeEventListener("blur", N), document.removeEventListener("focus", R)) : (window.detachEvent("onBlur", N), document.detachEvent("onFocus", R));
        };
        var k, d = f(2411), C = (k = d) && k.__esModule ? k : { default: k }, m = [], b = null, v = !1;
        function N() {
          v = !0;
        }
        function R() {
          if (v) {
            if (v = !1, !b) return;
            setTimeout(function() {
              b.contains(document.activeElement) || ((0, C.default)(b)[0] || b).focus();
            }, 0);
          }
        }
      }, 7860: (i, u, f) => {
        Object.defineProperty(u, "__esModule", { value: !0 }), u.objectToString = void 0;
        const k = f(1099), d = f(5180), C = f(8814);
        u.objectToString = (v, N, R, D) => {
          if (typeof Buffer == "function" && Buffer.isBuffer(v)) return `Buffer.from(${R(v.toString("base64"))}, 'base64')`;
          if (typeof f.g == "object" && v === f.g) return m(v, N, R);
          const L = b[Object.prototype.toString.call(v)];
          return L ? L(v, N, R, D) : void 0;
        };
        const m = (v, N, R) => `Function(${R("return this")})()`, b = { "[object Array]": C.arrayToString, "[object Object]": (v, N, R, D) => {
          const L = N ? `
` : "", se = N ? " " : "", J = Object.keys(v).reduce(function(M, F) {
            const B = v[F], ne = R(B, F);
            if (ne === void 0) return M;
            const pe = ne.split(`
`).join(`
${N}`);
            return d.USED_METHOD_KEY.has(B) ? (M.push(`${N}${pe}`), M) : (M.push(`${N}${k.quoteKey(F, R)}:${se}${pe}`), M);
          }, []).join(`,${L}`);
          return J === "" ? "{}" : `{${L}${J}${L}}`;
        }, "[object Error]": (v, N, R) => `new Error(${R(v.message)})`, "[object Date]": (v) => `new Date(${v.getTime()})`, "[object String]": (v, N, R) => `new String(${R(v.toString())})`, "[object Number]": (v) => `new Number(${v})`, "[object Boolean]": (v) => `new Boolean(${v})`, "[object Set]": (v, N, R) => `new Set(${R(Array.from(v))})`, "[object Map]": (v, N, R) => `new Map(${R(Array.from(v))})`, "[object RegExp]": String, "[object global]": m, "[object Window]": m };
      }, 7965: (i, u, f) => {
        var k = f(6426), d = { "text/plain": "Text", "text/html": "Url", default: "Text" };
        i.exports = function(C, m) {
          var b, v, N, R, D, L, se = !1;
          m || (m = {}), b = m.debug || !1;
          try {
            if (N = k(), R = document.createRange(), D = document.getSelection(), (L = document.createElement("span")).textContent = C, L.ariaHidden = "true", L.style.all = "unset", L.style.position = "fixed", L.style.top = 0, L.style.clip = "rect(0, 0, 0, 0)", L.style.whiteSpace = "pre", L.style.webkitUserSelect = "text", L.style.MozUserSelect = "text", L.style.msUserSelect = "text", L.style.userSelect = "text", L.addEventListener("copy", function(J) {
              if (J.stopPropagation(), m.format) if (J.preventDefault(), J.clipboardData === void 0) {
                b && console.warn("unable to use e.clipboardData"), b && console.warn("trying IE specific stuff"), window.clipboardData.clearData();
                var M = d[m.format] || d.default;
                window.clipboardData.setData(M, C);
              } else J.clipboardData.clearData(), J.clipboardData.setData(m.format, C);
              m.onCopy && (J.preventDefault(), m.onCopy(J.clipboardData));
            }), document.body.appendChild(L), R.selectNodeContents(L), D.addRange(R), !document.execCommand("copy")) throw new Error("copy command was unsuccessful");
            se = !0;
          } catch (J) {
            b && console.error("unable to copy using execCommand: ", J), b && console.warn("trying IE specific stuff");
            try {
              window.clipboardData.setData(m.format || "text", C), m.onCopy && m.onCopy(window.clipboardData), se = !0;
            } catch (M) {
              b && console.error("unable to copy using clipboardData: ", M), b && console.error("falling back to prompt"), v = (function(F) {
                var B = (/mac os x/i.test(navigator.userAgent) ? "⌘" : "Ctrl") + "+C";
                return F.replace(/#{\s*key\s*}/g, B);
              })("message" in m ? m.message : "Copy to clipboard: #{key}, Enter"), window.prompt(v, C);
            }
          } finally {
            D && (typeof D.removeRange == "function" ? D.removeRange(R) : D.removeAllRanges()), L && document.body.removeChild(L), N();
          }
          return se;
        };
      }, 8142: (i, u, f) => {
        i = f.nmd(i);
        var k = "__lodash_hash_undefined__", d = 9007199254740991, C = "[object Arguments]", m = "[object Array]", b = "[object Boolean]", v = "[object Date]", N = "[object Error]", R = "[object Function]", D = "[object Map]", L = "[object Number]", se = "[object Object]", J = "[object Promise]", M = "[object RegExp]", F = "[object Set]", B = "[object String]", ne = "[object Symbol]", pe = "[object WeakMap]", oe = "[object ArrayBuffer]", fe = "[object DataView]", ge = /^\[object .+?Constructor\]$/, S = /^(?:0|[1-9]\d*)$/, j = {};
        j["[object Float32Array]"] = j["[object Float64Array]"] = j["[object Int8Array]"] = j["[object Int16Array]"] = j["[object Int32Array]"] = j["[object Uint8Array]"] = j["[object Uint8ClampedArray]"] = j["[object Uint16Array]"] = j["[object Uint32Array]"] = !0, j[C] = j[m] = j[oe] = j[b] = j[fe] = j[v] = j[N] = j[R] = j[D] = j[L] = j[se] = j[M] = j[F] = j[B] = j[pe] = !1;
        var A = typeof f.g == "object" && f.g && f.g.Object === Object && f.g, ae = typeof self == "object" && self && self.Object === Object && self, G = A || ae || Function("return this")(), Ee = u && !u.nodeType && u, Z = Ee && i && !i.nodeType && i, U = Z && Z.exports === Ee, X = U && A.process, le = (function() {
          try {
            return X && X.binding && X.binding("util");
          } catch {
          }
        })(), me = le && le.isTypedArray;
        function ke(I, Q) {
          for (var be = -1, De = I == null ? 0 : I.length; ++be < De; ) if (Q(I[be], be, I)) return !0;
          return !1;
        }
        function Ne(I) {
          var Q = -1, be = Array(I.size);
          return I.forEach(function(De, tt) {
            be[++Q] = [tt, De];
          }), be;
        }
        function Ue(I) {
          var Q = -1, be = Array(I.size);
          return I.forEach(function(De) {
            be[++Q] = De;
          }), be;
        }
        var Ae, Le, Ke, Je = Array.prototype, ye = Function.prototype, P = Object.prototype, ee = G["__core-js_shared__"], we = ye.toString, Se = P.hasOwnProperty, Pe = (Ae = /[^.]+$/.exec(ee && ee.keys && ee.keys.IE_PROTO || "")) ? "Symbol(src)_1." + Ae : "", _e = P.toString, lt = RegExp("^" + we.call(Se).replace(/[\\^$.*+?()[\]{}|]/g, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"), Qe = U ? G.Buffer : void 0, et = G.Symbol, Pt = G.Uint8Array, ko = P.propertyIsEnumerable, Dt = Je.splice, Gt = et ? et.toStringTag : void 0, On = Object.getOwnPropertySymbols, Nn = Qe ? Qe.isBuffer : void 0, wo = (Le = Object.keys, Ke = Object, function(I) {
          return Le(Ke(I));
        }), Hn = Rn(G, "DataView"), $n = Rn(G, "Map"), an = Rn(G, "Promise"), pn = Rn(G, "Set"), sr = Rn(G, "WeakMap"), Bt = Rn(Object, "create"), $r = mn(Hn), Wr = mn($n), _o = mn(an), Eo = mn(pn), xo = mn(sr), Wn = et ? et.prototype : void 0, Kt = Wn ? Wn.valueOf : void 0;
        function zt(I) {
          var Q = -1, be = I == null ? 0 : I.length;
          for (this.clear(); ++Q < be; ) {
            var De = I[Q];
            this.set(De[0], De[1]);
          }
        }
        function Ye(I) {
          var Q = -1, be = I == null ? 0 : I.length;
          for (this.clear(); ++Q < be; ) {
            var De = I[Q];
            this.set(De[0], De[1]);
          }
        }
        function Pn(I) {
          var Q = -1, be = I == null ? 0 : I.length;
          for (this.clear(); ++Q < be; ) {
            var De = I[Q];
            this.set(De[0], De[1]);
          }
        }
        function qn(I) {
          var Q = -1, be = I == null ? 0 : I.length;
          for (this.__data__ = new Pn(); ++Q < be; ) this.add(I[Q]);
        }
        function sn(I) {
          var Q = this.__data__ = new Ye(I);
          this.size = Q.size;
        }
        function qr(I, Q) {
          var be = ct(I), De = !be && gn(I), tt = !be && !De && Pr(I), Be = !be && !De && !tt && Dr(I), Ge = be || De || tt || Be, rt = Ge ? (function(ht, kt) {
            for (var jt = -1, yt = Array(ht); ++jt < ht; ) yt[jt] = kt(jt);
            return yt;
          })(I.length, String) : [], At = rt.length;
          for (var ft in I) !Se.call(I, ft) || Ge && (ft == "length" || tt && (ft == "offset" || ft == "parent") || Be && (ft == "buffer" || ft == "byteLength" || ft == "byteOffset") || gi(ft, At)) || rt.push(ft);
          return rt;
        }
        function Tr(I, Q) {
          for (var be = I.length; be--; ) if (Qr(I[be][0], Q)) return be;
          return -1;
        }
        function fn(I) {
          return I == null ? I === void 0 ? "[object Undefined]" : "[object Null]" : Gt && Gt in Object(I) ? (function(Q) {
            var be = Se.call(Q, Gt), De = Q[Gt];
            try {
              Q[Gt] = void 0;
              var tt = !0;
            } catch {
            }
            var Be = _e.call(Q);
            return tt && (be ? Q[Gt] = De : delete Q[Gt]), Be;
          })(I) : (function(Q) {
            return _e.call(Q);
          })(I);
        }
        function pt(I) {
          return Mn(I) && fn(I) == C;
        }
        function Kr(I, Q, be, De, tt) {
          return I === Q || (I == null || Q == null || !Mn(I) && !Mn(Q) ? I != I && Q != Q : (function(Be, Ge, rt, At, ft, ht) {
            var kt = ct(Be), jt = ct(Ge), yt = kt ? m : hn(Be), bt = jt ? m : hn(Ge), yn = (yt = yt == C ? se : yt) == se, ur = (bt = bt == C ? se : bt) == se, In = yt == bt;
            if (In && Pr(Be)) {
              if (!Pr(Ge)) return !1;
              kt = !0, yn = !1;
            }
            if (In && !yn) return ht || (ht = new sn()), kt || Dr(Be) ? Dn(Be, Ge, rt, At, ft, ht) : (function(nt, Ze, Yn, vn, dr, ut, wt) {
              switch (Yn) {
                case fe:
                  if (nt.byteLength != Ze.byteLength || nt.byteOffset != Ze.byteOffset) return !1;
                  nt = nt.buffer, Ze = Ze.buffer;
                case oe:
                  return !(nt.byteLength != Ze.byteLength || !ut(new Pt(nt), new Pt(Ze)));
                case b:
                case v:
                case L:
                  return Qr(+nt, +Ze);
                case N:
                  return nt.name == Ze.name && nt.message == Ze.message;
                case M:
                case B:
                  return nt == Ze + "";
                case D:
                  var Tt = Ne;
                case F:
                  var Lt = 1 & vn;
                  if (Tt || (Tt = Ue), nt.size != Ze.size && !Lt) return !1;
                  var kn = wt.get(nt);
                  if (kn) return kn == Ze;
                  vn |= 2, wt.set(nt, Ze);
                  var zn = Dn(Tt(nt), Tt(Ze), vn, dr, ut, wt);
                  return wt.delete(nt), zn;
                case ne:
                  if (Kt) return Kt.call(nt) == Kt.call(Ze);
              }
              return !1;
            })(Be, Ge, yt, rt, At, ft, ht);
            if (!(1 & rt)) {
              var bn = yn && Se.call(Be, "__wrapped__"), Yr = ur && Se.call(Ge, "__wrapped__");
              if (bn || Yr) {
                var To = bn ? Be.value() : Be, Oo = Yr ? Ge.value() : Ge;
                return ht || (ht = new sn()), ft(To, Oo, rt, At, ht);
              }
            }
            return In ? (ht || (ht = new sn()), (function(nt, Ze, Yn, vn, dr, ut) {
              var wt = 1 & Yn, Tt = Nr(nt), Lt = Tt.length, kn = Nr(Ze), zn = kn.length;
              if (Lt != zn && !wt) return !1;
              for (var wn = Lt; wn--; ) {
                var ln = Tt[wn];
                if (!(wt ? ln in Ze : Se.call(Ze, ln))) return !1;
              }
              var Xr = ut.get(nt);
              if (Xr && ut.get(Ze)) return Xr == Ze;
              var pr = !0;
              ut.set(nt, Ze), ut.set(Ze, nt);
              for (var Xn = wt; ++wn < Lt; ) {
                var _n = nt[ln = Tt[wn]], Mr = Ze[ln];
                if (vn) var fr = wt ? vn(Mr, _n, ln, Ze, nt, ut) : vn(_n, Mr, ln, nt, Ze, ut);
                if (!(fr === void 0 ? _n === Mr || dr(_n, Mr, Yn, vn, ut) : fr)) {
                  pr = !1;
                  break;
                }
                Xn || (Xn = ln == "constructor");
              }
              if (pr && !Xn) {
                var hr = nt.constructor, Ir = Ze.constructor;
                hr == Ir || !("constructor" in nt) || !("constructor" in Ze) || typeof hr == "function" && hr instanceof hr && typeof Ir == "function" && Ir instanceof Ir || (pr = !1);
              }
              return ut.delete(nt), ut.delete(Ze), pr;
            })(Be, Ge, rt, At, ft, ht)) : !1;
          })(I, Q, be, De, Kr, tt));
        }
        function So(I) {
          return !(!Qn(I) || (function(Q) {
            return !!Pe && Pe in Q;
          })(I)) && (Kn(I) ? lt : ge).test(mn(I));
        }
        function Or(I) {
          if (be = (Q = I) && Q.constructor, De = typeof be == "function" && be.prototype || P, Q !== De) return wo(I);
          var Q, be, De, tt = [];
          for (var Be in Object(I)) Se.call(I, Be) && Be != "constructor" && tt.push(Be);
          return tt;
        }
        function Dn(I, Q, be, De, tt, Be) {
          var Ge = 1 & be, rt = I.length, At = Q.length;
          if (rt != At && !(Ge && At > rt)) return !1;
          var ft = Be.get(I);
          if (ft && Be.get(Q)) return ft == Q;
          var ht = -1, kt = !0, jt = 2 & be ? new qn() : void 0;
          for (Be.set(I, Q), Be.set(Q, I); ++ht < rt; ) {
            var yt = I[ht], bt = Q[ht];
            if (De) var yn = Ge ? De(bt, yt, ht, Q, I, Be) : De(yt, bt, ht, I, Q, Be);
            if (yn !== void 0) {
              if (yn) continue;
              kt = !1;
              break;
            }
            if (jt) {
              if (!ke(Q, function(ur, In) {
                if (bn = In, !jt.has(bn) && (yt === ur || tt(yt, ur, be, De, Be))) return jt.push(In);
                var bn;
              })) {
                kt = !1;
                break;
              }
            } else if (yt !== bt && !tt(yt, bt, be, De, Be)) {
              kt = !1;
              break;
            }
          }
          return Be.delete(I), Be.delete(Q), kt;
        }
        function Nr(I) {
          return (function(Q, be, De) {
            var tt = be(Q);
            return ct(Q) ? tt : (function(Be, Ge) {
              for (var rt = -1, At = Ge.length, ft = Be.length; ++rt < At; ) Be[ft + rt] = Ge[rt];
              return Be;
            })(tt, De(Q));
          })(I, Rr, Co);
        }
        function lr(I, Q) {
          var be, De, tt = I.__data__;
          return ((De = typeof (be = Q)) == "string" || De == "number" || De == "symbol" || De == "boolean" ? be !== "__proto__" : be === null) ? tt[typeof Q == "string" ? "string" : "hash"] : tt.map;
        }
        function Rn(I, Q) {
          var be = (function(De, tt) {
            return De == null ? void 0 : De[tt];
          })(I, Q);
          return So(be) ? be : void 0;
        }
        zt.prototype.clear = function() {
          this.__data__ = Bt ? Bt(null) : {}, this.size = 0;
        }, zt.prototype.delete = function(I) {
          var Q = this.has(I) && delete this.__data__[I];
          return this.size -= Q ? 1 : 0, Q;
        }, zt.prototype.get = function(I) {
          var Q = this.__data__;
          if (Bt) {
            var be = Q[I];
            return be === k ? void 0 : be;
          }
          return Se.call(Q, I) ? Q[I] : void 0;
        }, zt.prototype.has = function(I) {
          var Q = this.__data__;
          return Bt ? Q[I] !== void 0 : Se.call(Q, I);
        }, zt.prototype.set = function(I, Q) {
          var be = this.__data__;
          return this.size += this.has(I) ? 0 : 1, be[I] = Bt && Q === void 0 ? k : Q, this;
        }, Ye.prototype.clear = function() {
          this.__data__ = [], this.size = 0;
        }, Ye.prototype.delete = function(I) {
          var Q = this.__data__, be = Tr(Q, I);
          return !(be < 0) && (be == Q.length - 1 ? Q.pop() : Dt.call(Q, be, 1), --this.size, !0);
        }, Ye.prototype.get = function(I) {
          var Q = this.__data__, be = Tr(Q, I);
          return be < 0 ? void 0 : Q[be][1];
        }, Ye.prototype.has = function(I) {
          return Tr(this.__data__, I) > -1;
        }, Ye.prototype.set = function(I, Q) {
          var be = this.__data__, De = Tr(be, I);
          return De < 0 ? (++this.size, be.push([I, Q])) : be[De][1] = Q, this;
        }, Pn.prototype.clear = function() {
          this.size = 0, this.__data__ = { hash: new zt(), map: new ($n || Ye)(), string: new zt() };
        }, Pn.prototype.delete = function(I) {
          var Q = lr(this, I).delete(I);
          return this.size -= Q ? 1 : 0, Q;
        }, Pn.prototype.get = function(I) {
          return lr(this, I).get(I);
        }, Pn.prototype.has = function(I) {
          return lr(this, I).has(I);
        }, Pn.prototype.set = function(I, Q) {
          var be = lr(this, I), De = be.size;
          return be.set(I, Q), this.size += be.size == De ? 0 : 1, this;
        }, qn.prototype.add = qn.prototype.push = function(I) {
          return this.__data__.set(I, k), this;
        }, qn.prototype.has = function(I) {
          return this.__data__.has(I);
        }, sn.prototype.clear = function() {
          this.__data__ = new Ye(), this.size = 0;
        }, sn.prototype.delete = function(I) {
          var Q = this.__data__, be = Q.delete(I);
          return this.size = Q.size, be;
        }, sn.prototype.get = function(I) {
          return this.__data__.get(I);
        }, sn.prototype.has = function(I) {
          return this.__data__.has(I);
        }, sn.prototype.set = function(I, Q) {
          var be = this.__data__;
          if (be instanceof Ye) {
            var De = be.__data__;
            if (!$n || De.length < 199) return De.push([I, Q]), this.size = ++be.size, this;
            be = this.__data__ = new Pn(De);
          }
          return be.set(I, Q), this.size = be.size, this;
        };
        var Co = On ? function(I) {
          return I == null ? [] : (I = Object(I), (function(Q, be) {
            for (var De = -1, tt = Q == null ? 0 : Q.length, Be = 0, Ge = []; ++De < tt; ) {
              var rt = Q[De];
              be(rt, De, Q) && (Ge[Be++] = rt);
            }
            return Ge;
          })(On(I), function(Q) {
            return ko.call(I, Q);
          }));
        } : function() {
          return [];
        }, hn = fn;
        function gi(I, Q) {
          return !!(Q = Q ?? d) && (typeof I == "number" || S.test(I)) && I > -1 && I % 1 == 0 && I < Q;
        }
        function mn(I) {
          if (I != null) {
            try {
              return we.call(I);
            } catch {
            }
            try {
              return I + "";
            } catch {
            }
          }
          return "";
        }
        function Qr(I, Q) {
          return I === Q || I != I && Q != Q;
        }
        (Hn && hn(new Hn(new ArrayBuffer(1))) != fe || $n && hn(new $n()) != D || an && hn(an.resolve()) != J || pn && hn(new pn()) != F || sr && hn(new sr()) != pe) && (hn = function(I) {
          var Q = fn(I), be = Q == se ? I.constructor : void 0, De = be ? mn(be) : "";
          if (De) switch (De) {
            case $r:
              return fe;
            case Wr:
              return D;
            case _o:
              return J;
            case Eo:
              return F;
            case xo:
              return pe;
          }
          return Q;
        });
        var gn = pt(/* @__PURE__ */ (function() {
          return arguments;
        })()) ? pt : function(I) {
          return Mn(I) && Se.call(I, "callee") && !ko.call(I, "callee");
        }, ct = Array.isArray, Pr = Nn || function() {
          return !1;
        };
        function Kn(I) {
          if (!Qn(I)) return !1;
          var Q = fn(I);
          return Q == R || Q == "[object GeneratorFunction]" || Q == "[object AsyncFunction]" || Q == "[object Proxy]";
        }
        function cr(I) {
          return typeof I == "number" && I > -1 && I % 1 == 0 && I <= d;
        }
        function Qn(I) {
          var Q = typeof I;
          return I != null && (Q == "object" || Q == "function");
        }
        function Mn(I) {
          return I != null && typeof I == "object";
        }
        var Dr = me ? /* @__PURE__ */ (function(I) {
          return function(Q) {
            return I(Q);
          };
        })(me) : function(I) {
          return Mn(I) && cr(I.length) && !!j[fn(I)];
        };
        function Rr(I) {
          return (Q = I) != null && cr(Q.length) && !Kn(Q) ? qr(I) : Or(I);
          var Q;
        }
        i.exports = function(I, Q) {
          return Kr(I, Q);
        };
      }, 8351: (i, u, f) => {
        f.r(u), f.d(u, { default: () => C });
        var k = f(6314), d = f.n(k)()(function(m) {
          return m[1];
        });
        d.push([i.id, `.ck-inspector,.ck-inspector-portal{--ck-inspector-color-white:#fff;--ck-inspector-color-black:#000;--ck-inspector-color-background:#f3f3f3;--ck-inspector-color-link:#005cc6;--ck-inspector-code-font-size:11px;--ck-inspector-code-font-family:monaco,Consolas,Lucida Console,monospace;--ck-inspector-color-border:#d0d0d0}.ck-inspector,.ck-inspector :not(select),.ck-inspector-portal,.ck-inspector-portal :not(select){word-wrap:break-word;-webkit-font-smoothing:auto;background:transparent;border:0;box-sizing:border-box;font-family:Arial,Helvetica Neue,Helvetica,sans-serif;font-size:12px;font-weight:400;height:auto;line-height:17px;margin:0;padding:0;position:static;text-decoration:none;transition:none;width:auto}.ck-inspector{background:var(--ck-inspector-color-background);border-collapse:collapse;border-top:1px solid var(--ck-inspector-color-border);color:var(--ck-inspector-color-black);cursor:auto;float:none;overflow:hidden;text-align:left;white-space:normal;z-index:9999}.ck-inspector.ck-inspector_collapsed>.ck-inspector-navbox>.ck-inspector-navbox__navigation .ck-inspector-horizontal-nav{display:none}.ck-inspector .ck-inspector-navbox__navigation__logo{align-self:center;background-image:url("data:image/svg+xml;charset=utf-8,%3Csvg width='68' height='64' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M43.71 11.025a11.508 11.508 0 0 0-1.213 5.159c0 6.42 5.244 11.625 11.713 11.625.083 0 .167 0 .25-.002v16.282a5.464 5.464 0 0 1-2.756 4.739L30.986 60.7a5.548 5.548 0 0 1-5.512 0L4.756 48.828A5.464 5.464 0 0 1 2 44.089V20.344c0-1.955 1.05-3.76 2.756-4.738L25.474 3.733a5.548 5.548 0 0 1 5.512 0l12.724 7.292z' fill='%23FFF'/%3E%3Cpath d='M45.684 8.79a12.604 12.604 0 0 0-1.329 5.65c0 7.032 5.744 12.733 12.829 12.733.091 0 .183-.001.274-.003v17.834a5.987 5.987 0 0 1-3.019 5.19L31.747 63.196a6.076 6.076 0 0 1-6.037 0L3.02 50.193A5.984 5.984 0 0 1 0 45.003V18.997c0-2.14 1.15-4.119 3.019-5.19L25.71.804a6.076 6.076 0 0 1 6.037 0L45.684 8.79zm-29.44 11.89c-.834 0-1.51.671-1.51 1.498v.715c0 .828.676 1.498 1.51 1.498h25.489c.833 0 1.51-.67 1.51-1.498v-.715c0-.827-.677-1.498-1.51-1.498h-25.49zm0 9.227c-.834 0-1.51.671-1.51 1.498v.715c0 .828.676 1.498 1.51 1.498h18.479c.833 0 1.509-.67 1.509-1.498v-.715c0-.827-.676-1.498-1.51-1.498H16.244zm0 9.227c-.834 0-1.51.671-1.51 1.498v.715c0 .828.676 1.498 1.51 1.498h25.489c.833 0 1.51-.67 1.51-1.498v-.715c0-.827-.677-1.498-1.51-1.498h-25.49zm41.191-14.459c-5.835 0-10.565-4.695-10.565-10.486 0-5.792 4.73-10.487 10.565-10.487C63.27 3.703 68 8.398 68 14.19c0 5.791-4.73 10.486-10.565 10.486zm3.422-8.68c0-.467-.084-.875-.251-1.225a2.547 2.547 0 0 0-.686-.88 2.888 2.888 0 0 0-1.026-.531 4.418 4.418 0 0 0-1.259-.175c-.134 0-.283.006-.447.018a2.72 2.72 0 0 0-.446.07l.075-1.4h3.587v-1.8h-5.462l-.214 5.06c.319-.116.682-.21 1.089-.28.406-.071.77-.107 1.088-.107.218 0 .437.021.655.063.218.041.413.114.585.218s.313.244.422.419c.109.175.163.391.163.65 0 .424-.132.745-.396.961a1.434 1.434 0 0 1-.938.325c-.352 0-.656-.1-.912-.3-.256-.2-.43-.453-.523-.762l-1.925.588c.1.35.258.664.472.943.214.279.47.514.767.706.298.191.63.339.995.443.365.104.749.156 1.151.156.437 0 .86-.064 1.272-.193.41-.13.778-.323 1.1-.581a2.8 2.8 0 0 0 .775-.981c.193-.396.29-.864.29-1.405z' fill='%231EBC61' fill-rule='nonzero'/%3E%3C/g%3E%3C/svg%3E");background-position:50%;background-repeat:no-repeat;background-size:contain;display:block;height:1.8em;margin-left:1em;margin-right:1em;overflow:hidden;text-indent:100px;white-space:nowrap;width:1.8em}.ck-inspector .ck-inspector-navbox__navigation__toggle{margin-right:1em}.ck-inspector .ck-inspector-navbox__navigation__toggle.ck-inspector-navbox__navigation__toggle_up{transform:rotate(180deg)}.ck-inspector .ck-inspector-editor-selector{margin-left:auto;margin-right:.3em}@media screen and (max-width:680px){.ck-inspector .ck-inspector-editor-selector label{display:none}}.ck-inspector .ck-inspector-editor-selector select{margin-left:.5em}.ck-inspector .ck-inspector-code,.ck-inspector .ck-inspector-code *{cursor:default;font-family:var(--ck-inspector-code-font-family);font-size:var(--ck-inspector-code-font-size)}.ck-inspector a{color:var(--ck-inspector-color-link);text-decoration:none}.ck-inspector a:hover{cursor:pointer;text-decoration:underline}.ck-inspector button{outline:0}.ck-inspector .ck-inspector-separator{border-right:1px solid var(--ck-inspector-color-border);display:inline-block;height:20px;margin:0 .5em;vertical-align:middle;width:0}`, ""]);
        const C = d;
      }, 8535: (i, u, f) => {
        f.r(u), f.d(u, { default: () => C });
        var k = f(6314), d = f.n(k)()(function(m) {
          return m[1];
        });
        d.push([i.id, ".ck-inspector{--ck-inspector-color-tab-background-hover:rgba(0,0,0,.07);--ck-inspector-color-tab-active-border:#0dacef}.ck-inspector .ck-inspector-horizontal-nav{align-self:stretch;display:flex;flex-direction:row;user-select:none}.ck-inspector .ck-inspector-horizontal-nav .ck-inspector-horizontal-nav__item{align-self:stretch;-webkit-appearance:none;background:none;border:0;border-bottom:2px solid transparent;padding:.5em 1em}.ck-inspector .ck-inspector-horizontal-nav .ck-inspector-horizontal-nav__item:hover{background:var(--ck-inspector-color-tab-background-hover)}.ck-inspector .ck-inspector-horizontal-nav .ck-inspector-horizontal-nav__item.ck-inspector-horizontal-nav__item_active{border-bottom-color:var(--ck-inspector-color-tab-active-border)}", ""]);
        const C = d;
      }, 8696: (i, u) => {
        Object.defineProperty(u, "__esModule", { value: !0 }), u.default = function() {
        };
      }, 8704: (i, u, f) => {
        var k = f(5072), d = f(8737);
        typeof (d = d.__esModule ? d.default : d) == "string" && (d = [[i.id, d, ""]]);
        var C = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        k(d, C), i.exports = d.locals || {};
      }, 8737: (i, u, f) => {
        f.r(u), f.d(u, { default: () => C });
        var k = f(6314), d = f.n(k)()(function(m) {
          return m[1];
        });
        d.push([i.id, "html body.ck-inspector-body-expanded{margin-bottom:var(--ck-inspector-height)}html body.ck-inspector-body-collapsed{margin-bottom:var(--ck-inspector-collapsed-height)}.ck-inspector-wrapper *{box-sizing:border-box}", ""]);
        const C = d;
      }, 8814: (i, u) => {
        Object.defineProperty(u, "__esModule", { value: !0 }), u.arrayToString = void 0, u.arrayToString = (f, k, d) => {
          const C = f.map(function(b, v) {
            const N = d(b, v);
            return N === void 0 ? String(N) : k + N.split(`
`).join(`
${k}`);
          }).join(k ? `,
` : ","), m = k && C ? `
` : "";
          return `[${m}${C}${m}]`;
        };
      }, 8845: (i, u, f) => {
        f.r(u), f.d(u, { default: () => C });
        var k = f(6314), d = f.n(k)()(function(m) {
          return m[1];
        });
        d.push([i.id, '.ck-inspector{--ck-inspector-color-property-list-property-name:#d0363f;--ck-inspector-color-property-list-property-value-true:green;--ck-inspector-color-property-list-property-value-false:red;--ck-inspector-color-property-list-property-value-unknown:#888;--ck-inspector-color-property-list-background:#f5f5f5;--ck-inspector-color-property-list-title-collapser:#727272}.ck-inspector .ck-inspector-property-list{background:var(--ck-inspector-color-white);display:grid;grid-template-columns:auto 1fr}.ck-inspector .ck-inspector-property-list>:nth-of-type(odd){background:var(--ck-inspector-color-property-list-background)}.ck-inspector .ck-inspector-property-list>:nth-of-type(2n){background:var(--ck-inspector-color-white)}.ck-inspector .ck-inspector-property-list dt{min-width:15em;padding:0 .7em 0 1.2em}.ck-inspector .ck-inspector-property-list dt.ck-inspector-property-list__title_collapsible button{border-color:transparent transparent transparent var(--ck-inspector-color-property-list-title-collapser);border-style:solid;border-width:3.5px 0 3.5px 6px;display:inline-block;height:0;margin-left:-9px;margin-right:.3em;overflow:hidden;transform:rotate(0deg);transition:transform .2s ease-in-out;vertical-align:middle;width:0}.ck-inspector .ck-inspector-property-list dt.ck-inspector-property-list__title_expanded button{transform:rotate(90deg)}.ck-inspector-property-list__title_collapsed:is(.ck-inspector .ck-inspector-property-list dt)+dd+.ck-inspector-property-list{display:none}.ck-inspector .ck-inspector-property-list dt .ck-inspector-property-list__title__color-box{border:1px solid #000;border-radius:2px;display:inline-block;height:12px;margin-right:3px;vertical-align:text-top;width:12px}.ck-inspector .ck-inspector-property-list dt.ck-inspector-property-list__title_clickable label:hover{cursor:pointer;text-decoration:underline}.ck-inspector .ck-inspector-property-list dt label{color:var(--ck-inspector-color-property-list-property-name)}.ck-inspector .ck-inspector-property-list dd{padding-right:.7em}.ck-inspector .ck-inspector-property-list dd input{width:100%}.ck-inspector .ck-inspector-property-list dd input[value=false]{color:var(--ck-inspector-color-property-list-property-value-false)}.ck-inspector .ck-inspector-property-list dd input[value=true]{color:var(--ck-inspector-color-property-list-property-value-true)}.ck-inspector .ck-inspector-property-list dd input[value="function() {…}"],.ck-inspector .ck-inspector-property-list dd input[value=undefined]{color:var(--ck-inspector-color-property-list-property-value-unknown)}.ck-inspector .ck-inspector-property-list dd input[value="function() {…}"]{font-style:italic}.ck-inspector .ck-inspector-property-list .ck-inspector-property-list{background:transparent;grid-column:1/-1;margin-left:1em}.ck-inspector .ck-inspector-property-list .ck-inspector-property-list>:nth-of-type(2n),.ck-inspector .ck-inspector-property-list .ck-inspector-property-list>:nth-of-type(odd){background:transparent}', ""]);
        const C = d;
      }, 8967: (i, u, f) => {
        var k = f(5072), d = f(2632);
        typeof (d = d.__esModule ? d.default : d) == "string" && (d = [[i.id, d, ""]]);
        var C = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        k(d, C), i.exports = d.locals || {};
      }, 8989: (i, u) => {
        var f = 60103, k = 60106, d = 60107, C = 60108, m = 60114, b = 60109, v = 60110, N = 60112, R = 60113, D = 60120, L = 60115, se = 60116;
        if (typeof Symbol == "function" && Symbol.for) {
          var J = Symbol.for;
          f = J("react.element"), k = J("react.portal"), d = J("react.fragment"), C = J("react.strict_mode"), m = J("react.profiler"), b = J("react.provider"), v = J("react.context"), N = J("react.forward_ref"), R = J("react.suspense"), D = J("react.suspense_list"), L = J("react.memo"), se = J("react.lazy"), J("react.block"), J("react.server.block"), J("react.fundamental"), J("react.debug_trace_mode"), J("react.legacy_hidden");
        }
        function M(F) {
          if (typeof F == "object" && F !== null) {
            var B = F.$$typeof;
            switch (B) {
              case f:
                switch (F = F.type) {
                  case d:
                  case m:
                  case C:
                  case R:
                  case D:
                    return F;
                  default:
                    switch (F = F && F.$$typeof) {
                      case v:
                      case N:
                      case se:
                      case L:
                      case b:
                        return F;
                      default:
                        return B;
                    }
                }
              case k:
                return B;
            }
          }
        }
        u.isContextConsumer = function(F) {
          return M(F) === v;
        };
      }, 9090: (i, u, f) => {
        Object.defineProperty(u, "__esModule", { value: !0 });
        var k = Object.assign || function(oe) {
          for (var fe = 1; fe < arguments.length; fe++) {
            var ge = arguments[fe];
            for (var S in ge) Object.prototype.hasOwnProperty.call(ge, S) && (oe[S] = ge[S]);
          }
          return oe;
        }, d = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(oe) {
          return typeof oe;
        } : function(oe) {
          return oe && typeof Symbol == "function" && oe.constructor === Symbol && oe !== Symbol.prototype ? "symbol" : typeof oe;
        }, C = /* @__PURE__ */ (function() {
          function oe(fe, ge) {
            for (var S = 0; S < ge.length; S++) {
              var j = ge[S];
              j.enumerable = j.enumerable || !1, j.configurable = !0, "value" in j && (j.writable = !0), Object.defineProperty(fe, j.key, j);
            }
          }
          return function(fe, ge, S) {
            return ge && oe(fe.prototype, ge), S && oe(fe, S), fe;
          };
        })(), m = f(6540), b = F(f(5556)), v = M(f(7791)), N = F(f(7067)), R = M(f(6462)), D = M(f(4838)), L = f(834), se = F(L), J = F(f(9628));
        function M(oe) {
          if (oe && oe.__esModule) return oe;
          var fe = {};
          if (oe != null) for (var ge in oe) Object.prototype.hasOwnProperty.call(oe, ge) && (fe[ge] = oe[ge]);
          return fe.default = oe, fe;
        }
        function F(oe) {
          return oe && oe.__esModule ? oe : { default: oe };
        }
        f(7727);
        var B = { overlay: "ReactModal__Overlay", content: "ReactModal__Content" }, ne = 0, pe = (function(oe) {
          function fe(ge) {
            (function(j, A) {
              if (!(j instanceof A)) throw new TypeError("Cannot call a class as a function");
            })(this, fe);
            var S = (function(j, A) {
              if (!j) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
              return !A || typeof A != "object" && typeof A != "function" ? j : A;
            })(this, (fe.__proto__ || Object.getPrototypeOf(fe)).call(this, ge));
            return S.setOverlayRef = function(j) {
              S.overlay = j, S.props.overlayRef && S.props.overlayRef(j);
            }, S.setContentRef = function(j) {
              S.content = j, S.props.contentRef && S.props.contentRef(j);
            }, S.afterClose = function() {
              var j = S.props, A = j.appElement, ae = j.ariaHideApp, G = j.htmlOpenClassName, Ee = j.bodyOpenClassName, Z = j.parentSelector, U = Z && Z().ownerDocument || document;
              Ee && D.remove(U.body, Ee), G && D.remove(U.getElementsByTagName("html")[0], G), ae && ne > 0 && (ne -= 1) === 0 && R.show(A), S.props.shouldFocusAfterRender && (S.props.shouldReturnFocusAfterClose ? (v.returnFocus(S.props.preventScroll), v.teardownScopedFocus()) : v.popWithoutFocus()), S.props.onAfterClose && S.props.onAfterClose(), J.default.deregister(S);
            }, S.open = function() {
              S.beforeOpen(), S.state.afterOpen && S.state.beforeClose ? (clearTimeout(S.closeTimer), S.setState({ beforeClose: !1 })) : (S.props.shouldFocusAfterRender && (v.setupScopedFocus(S.node), v.markForFocusLater()), S.setState({ isOpen: !0 }, function() {
                S.openAnimationFrame = requestAnimationFrame(function() {
                  S.setState({ afterOpen: !0 }), S.props.isOpen && S.props.onAfterOpen && S.props.onAfterOpen({ overlayEl: S.overlay, contentEl: S.content });
                });
              }));
            }, S.close = function() {
              S.props.closeTimeoutMS > 0 ? S.closeWithTimeout() : S.closeWithoutTimeout();
            }, S.focusContent = function() {
              return S.content && !S.contentHasFocus() && S.content.focus({ preventScroll: !0 });
            }, S.closeWithTimeout = function() {
              var j = Date.now() + S.props.closeTimeoutMS;
              S.setState({ beforeClose: !0, closesAt: j }, function() {
                S.closeTimer = setTimeout(S.closeWithoutTimeout, S.state.closesAt - Date.now());
              });
            }, S.closeWithoutTimeout = function() {
              S.setState({ beforeClose: !1, isOpen: !1, afterOpen: !1, closesAt: null }, S.afterClose);
            }, S.handleKeyDown = function(j) {
              (function(A) {
                return A.code === "Tab" || A.keyCode === 9;
              })(j) && (0, N.default)(S.content, j), S.props.shouldCloseOnEsc && (function(A) {
                return A.code === "Escape" || A.keyCode === 27;
              })(j) && (j.stopPropagation(), S.requestClose(j));
            }, S.handleOverlayOnClick = function(j) {
              S.shouldClose === null && (S.shouldClose = !0), S.shouldClose && S.props.shouldCloseOnOverlayClick && (S.ownerHandlesClose() ? S.requestClose(j) : S.focusContent()), S.shouldClose = null;
            }, S.handleContentOnMouseUp = function() {
              S.shouldClose = !1;
            }, S.handleOverlayOnMouseDown = function(j) {
              S.props.shouldCloseOnOverlayClick || j.target != S.overlay || j.preventDefault();
            }, S.handleContentOnClick = function() {
              S.shouldClose = !1;
            }, S.handleContentOnMouseDown = function() {
              S.shouldClose = !1;
            }, S.requestClose = function(j) {
              return S.ownerHandlesClose() && S.props.onRequestClose(j);
            }, S.ownerHandlesClose = function() {
              return S.props.onRequestClose;
            }, S.shouldBeClosed = function() {
              return !S.state.isOpen && !S.state.beforeClose;
            }, S.contentHasFocus = function() {
              return document.activeElement === S.content || S.content.contains(document.activeElement);
            }, S.buildClassName = function(j, A) {
              var ae = (A === void 0 ? "undefined" : d(A)) === "object" ? A : { base: B[j], afterOpen: B[j] + "--after-open", beforeClose: B[j] + "--before-close" }, G = ae.base;
              return S.state.afterOpen && (G = G + " " + ae.afterOpen), S.state.beforeClose && (G = G + " " + ae.beforeClose), typeof A == "string" && A ? G + " " + A : G;
            }, S.attributesFromObject = function(j, A) {
              return Object.keys(A).reduce(function(ae, G) {
                return ae[j + "-" + G] = A[G], ae;
              }, {});
            }, S.state = { afterOpen: !1, beforeClose: !1 }, S.shouldClose = null, S.moveFromContentToOverlay = null, S;
          }
          return (function(ge, S) {
            if (typeof S != "function" && S !== null) throw new TypeError("Super expression must either be null or a function, not " + typeof S);
            ge.prototype = Object.create(S && S.prototype, { constructor: { value: ge, enumerable: !1, writable: !0, configurable: !0 } }), S && (Object.setPrototypeOf ? Object.setPrototypeOf(ge, S) : ge.__proto__ = S);
          })(fe, oe), C(fe, [{ key: "componentDidMount", value: function() {
            this.props.isOpen && this.open();
          } }, { key: "componentDidUpdate", value: function(ge, S) {
            this.props.isOpen && !ge.isOpen ? this.open() : !this.props.isOpen && ge.isOpen && this.close(), this.props.shouldFocusAfterRender && this.state.isOpen && !S.isOpen && this.focusContent();
          } }, { key: "componentWillUnmount", value: function() {
            this.state.isOpen && this.afterClose(), clearTimeout(this.closeTimer), cancelAnimationFrame(this.openAnimationFrame);
          } }, { key: "beforeOpen", value: function() {
            var ge = this.props, S = ge.appElement, j = ge.ariaHideApp, A = ge.htmlOpenClassName, ae = ge.bodyOpenClassName, G = ge.parentSelector, Ee = G && G().ownerDocument || document;
            ae && D.add(Ee.body, ae), A && D.add(Ee.getElementsByTagName("html")[0], A), j && (ne += 1, R.hide(S)), J.default.register(this);
          } }, { key: "render", value: function() {
            var ge = this.props, S = ge.id, j = ge.className, A = ge.overlayClassName, ae = ge.defaultStyles, G = ge.children, Ee = j ? {} : ae.content, Z = A ? {} : ae.overlay;
            if (this.shouldBeClosed()) return null;
            var U = { ref: this.setOverlayRef, className: this.buildClassName("overlay", A), style: k({}, Z, this.props.style.overlay), onClick: this.handleOverlayOnClick, onMouseDown: this.handleOverlayOnMouseDown }, X = k({ id: S, ref: this.setContentRef, style: k({}, Ee, this.props.style.content), className: this.buildClassName("content", j), tabIndex: "-1", onKeyDown: this.handleKeyDown, onMouseDown: this.handleContentOnMouseDown, onMouseUp: this.handleContentOnMouseUp, onClick: this.handleContentOnClick, role: this.props.role, "aria-label": this.props.contentLabel }, this.attributesFromObject("aria", k({ modal: !0 }, this.props.aria)), this.attributesFromObject("data", this.props.data || {}), { "data-testid": this.props.testId }), le = this.props.contentElement(X, G);
            return this.props.overlayElement(U, le);
          } }]), fe;
        })(m.Component);
        pe.defaultProps = { style: { overlay: {}, content: {} }, defaultStyles: {} }, pe.propTypes = { isOpen: b.default.bool.isRequired, defaultStyles: b.default.shape({ content: b.default.object, overlay: b.default.object }), style: b.default.shape({ content: b.default.object, overlay: b.default.object }), className: b.default.oneOfType([b.default.string, b.default.object]), overlayClassName: b.default.oneOfType([b.default.string, b.default.object]), parentSelector: b.default.func, bodyOpenClassName: b.default.string, htmlOpenClassName: b.default.string, ariaHideApp: b.default.bool, appElement: b.default.oneOfType([b.default.instanceOf(se.default), b.default.instanceOf(L.SafeHTMLCollection), b.default.instanceOf(L.SafeNodeList), b.default.arrayOf(b.default.instanceOf(se.default))]), onAfterOpen: b.default.func, onAfterClose: b.default.func, onRequestClose: b.default.func, closeTimeoutMS: b.default.number, shouldFocusAfterRender: b.default.bool, shouldCloseOnOverlayClick: b.default.bool, shouldReturnFocusAfterClose: b.default.bool, preventScroll: b.default.bool, role: b.default.string, contentLabel: b.default.string, aria: b.default.object, data: b.default.object, children: b.default.node, shouldCloseOnEsc: b.default.bool, overlayRef: b.default.func, contentRef: b.default.func, id: b.default.string, overlayElement: b.default.func, contentElement: b.default.func, testId: b.default.string }, u.default = pe, i.exports = u.default;
      }, 9628: (i, u) => {
        Object.defineProperty(u, "__esModule", { value: !0 }), u.log = function() {
          console.log("portalOpenInstances ----------"), console.log(k.openInstances.length), k.openInstances.forEach(function(d) {
            return console.log(d);
          }), console.log("end portalOpenInstances ----------");
        }, u.resetState = function() {
          k = new f();
        };
        var f = function d() {
          var C = this;
          (function(m, b) {
            if (!(m instanceof b)) throw new TypeError("Cannot call a class as a function");
          })(this, d), this.register = function(m) {
            C.openInstances.indexOf(m) === -1 && (C.openInstances.push(m), C.emit("register"));
          }, this.deregister = function(m) {
            var b = C.openInstances.indexOf(m);
            b !== -1 && (C.openInstances.splice(b, 1), C.emit("deregister"));
          }, this.subscribe = function(m) {
            C.subscribers.push(m);
          }, this.emit = function(m) {
            C.subscribers.forEach(function(b) {
              return b(m, C.openInstances.slice());
            });
          }, this.openInstances = [], this.subscribers = [];
        }, k = new f();
        u.default = k;
      }, 9740: (i, u, f) => {
        f.r(u), f.d(u, { default: () => C });
        var k = f(6314), d = f.n(k)()(function(m) {
          return m[1];
        });
        d.push([i.id, ".ck-inspector{--ck-inspector-navbox-empty-background:#fafafa}.ck-inspector .ck-inspector-navbox{align-items:stretch;display:flex;flex-direction:column;height:100%}.ck-inspector .ck-inspector-navbox .ck-inspector-navbox__navigation{align-items:stretch;align-items:center;border-bottom:1px solid var(--ck-inspector-color-border);display:flex;flex-direction:row;flex-wrap:nowrap;max-height:30px;min-height:30px;user-select:none;width:100%}.ck-inspector .ck-inspector-navbox .ck-inspector-navbox__content{display:flex;flex-direction:row;height:100%;overflow:hidden}", ""]);
        const C = d;
      }, 9771: (i) => {
        var u = function() {
        };
        i.exports = u;
      }, 9936: (i, u, f) => {
        var k = f(5072), d = f(3797);
        typeof (d = d.__esModule ? d.default : d) == "string" && (d = [[i.id, d, ""]]);
        var C = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        k(d, C), i.exports = d.locals || {};
      }, 9938: (i, u, f) => {
        var k = f(5072), d = f(8351);
        typeof (d = d.__esModule ? d.default : d) == "string" && (d = [[i.id, d, ""]]);
        var C = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": !0 }, insert: "head", singleton: !0 };
        k(d, C), i.exports = d.locals || {};
      }, 9982: (i, u, f) => {
        i.exports = f(7463);
      } }, T = {};
      function O(i) {
        var u = T[i];
        if (u !== void 0) return u.exports;
        var f = T[i] = { id: i, loaded: !1, exports: {} };
        return _[i](f, f.exports, O), f.loaded = !0, f.exports;
      }
      O.n = (i) => {
        var u = i && i.__esModule ? () => i.default : () => i;
        return O.d(u, { a: u }), u;
      }, O.d = (i, u) => {
        for (var f in u) O.o(u, f) && !O.o(i, f) && Object.defineProperty(i, f, { enumerable: !0, get: u[f] });
      }, O.g = (function() {
        if (typeof globalThis == "object") return globalThis;
        try {
          return this || new Function("return this")();
        } catch {
          if (typeof window == "object") return window;
        }
      })(), O.o = (i, u) => Object.prototype.hasOwnProperty.call(i, u), O.r = (i) => {
        typeof Symbol < "u" && Symbol.toStringTag && Object.defineProperty(i, Symbol.toStringTag, { value: "Module" }), Object.defineProperty(i, "__esModule", { value: !0 });
      }, O.nmd = (i) => (i.paths = [], i.children || (i.children = []), i), O.nc = void 0;
      var te = {};
      return (() => {
        O.d(te, { default: () => He });
        var i = O(6540), u = O(961);
        function f(l) {
          return "Minified Redux error #" + l + "; visit https://redux.js.org/Errors?code=" + l + " for the full message or use the non-minified dev environment for full errors. ";
        }
        var k = typeof Symbol == "function" && Symbol.observable || "@@observable", d = function() {
          return Math.random().toString(36).substring(7).split("").join(".");
        }, C = { INIT: "@@redux/INIT" + d(), REPLACE: "@@redux/REPLACE" + d() };
        function m(l) {
          if (typeof l != "object" || l === null) return !1;
          for (var o = l; Object.getPrototypeOf(o) !== null; ) o = Object.getPrototypeOf(o);
          return Object.getPrototypeOf(l) === o;
        }
        function b(l, o, s) {
          var c;
          if (typeof o == "function" && typeof s == "function" || typeof s == "function" && typeof arguments[3] == "function") throw new Error(f(0));
          if (typeof o == "function" && s === void 0 && (s = o, o = void 0), s !== void 0) {
            if (typeof s != "function") throw new Error(f(1));
            return s(b)(l, o);
          }
          if (typeof l != "function") throw new Error(f(2));
          var g = l, y = o, x = [], z = x, K = !1;
          function Y() {
            z === x && (z = x.slice());
          }
          function ie() {
            if (K) throw new Error(f(3));
            return y;
          }
          function ue(de) {
            if (typeof de != "function") throw new Error(f(4));
            if (K) throw new Error(f(5));
            var Oe = !0;
            return Y(), z.push(de), function() {
              if (Oe) {
                if (K) throw new Error(f(6));
                Oe = !1, Y();
                var Ce = z.indexOf(de);
                z.splice(Ce, 1), x = null;
              }
            };
          }
          function he(de) {
            if (!m(de)) throw new Error(f(7));
            if (de.type === void 0) throw new Error(f(8));
            if (K) throw new Error(f(9));
            try {
              K = !0, y = g(y, de);
            } finally {
              K = !1;
            }
            for (var Oe = x = z, Ce = 0; Ce < Oe.length; Ce++)
              (0, Oe[Ce])();
            return de;
          }
          return he({ type: C.INIT }), (c = { dispatch: he, subscribe: ue, getState: ie, replaceReducer: function(de) {
            if (typeof de != "function") throw new Error(f(10));
            g = de, he({ type: C.REPLACE });
          } })[k] = function() {
            var de, Oe = ue;
            return (de = { subscribe: function(Ce) {
              if (typeof Ce != "object" || Ce === null) throw new Error(f(11));
              function ze() {
                Ce.next && Ce.next(ie());
              }
              return ze(), { unsubscribe: Oe(ze) };
            } })[k] = function() {
              return this;
            }, de;
          }, c;
        }
        var v = i.createContext(null), N = function(l) {
          l();
        }, R = function() {
          return N;
        }, D = { notify: function() {
        }, get: function() {
          return [];
        } };
        function L(l, o) {
          var s, c = D;
          function g() {
            x.onStateChange && x.onStateChange();
          }
          function y() {
            s || (s = o ? o.addNestedSub(g) : l.subscribe(g), c = (function() {
              var z = R(), K = null, Y = null;
              return { clear: function() {
                K = null, Y = null;
              }, notify: function() {
                z(function() {
                  for (var ie = K; ie; ) ie.callback(), ie = ie.next;
                });
              }, get: function() {
                for (var ie = [], ue = K; ue; ) ie.push(ue), ue = ue.next;
                return ie;
              }, subscribe: function(ie) {
                var ue = !0, he = Y = { callback: ie, next: null, prev: Y };
                return he.prev ? he.prev.next = he : K = he, function() {
                  ue && K !== null && (ue = !1, he.next ? he.next.prev = he.prev : Y = he.prev, he.prev ? he.prev.next = he.next : K = he.next);
                };
              } };
            })());
          }
          var x = { addNestedSub: function(z) {
            return y(), c.subscribe(z);
          }, notifyNestedSubs: function() {
            c.notify();
          }, handleChangeWrapper: g, isSubscribed: function() {
            return !!s;
          }, trySubscribe: y, tryUnsubscribe: function() {
            s && (s(), s = void 0, c.clear(), c = D);
          }, getListeners: function() {
            return c;
          } };
          return x;
        }
        var se = typeof window < "u" && window.document !== void 0 && window.document.createElement !== void 0 ? i.useLayoutEffect : i.useEffect;
        const J = function(l) {
          var o = l.store, s = l.context, c = l.children, g = (0, i.useMemo)(function() {
            var z = L(o);
            return { store: o, subscription: z };
          }, [o]), y = (0, i.useMemo)(function() {
            return o.getState();
          }, [o]);
          se(function() {
            var z = g.subscription;
            return z.onStateChange = z.notifyNestedSubs, z.trySubscribe(), y !== o.getState() && z.notifyNestedSubs(), function() {
              z.tryUnsubscribe(), z.onStateChange = null;
            };
          }, [g, y]);
          var x = s || v;
          return i.createElement(x.Provider, { value: g }, c);
        };
        function M() {
          return M = Object.assign ? Object.assign.bind() : function(l) {
            for (var o = 1; o < arguments.length; o++) {
              var s = arguments[o];
              for (var c in s) ({}).hasOwnProperty.call(s, c) && (l[c] = s[c]);
            }
            return l;
          }, M.apply(null, arguments);
        }
        function F(l, o) {
          if (l == null) return {};
          var s = {};
          for (var c in l) if ({}.hasOwnProperty.call(l, c)) {
            if (o.indexOf(c) !== -1) continue;
            s[c] = l[c];
          }
          return s;
        }
        var B = O(4146), ne = O.n(B), pe = O(4737), oe = ["getDisplayName", "methodName", "renderCountProp", "shouldHandleStateChanges", "storeKey", "withRef", "forwardRef", "context"], fe = ["reactReduxForwardedRef"], ge = [], S = [null, null];
        function j(l, o) {
          var s = l[1];
          return [o.payload, s + 1];
        }
        function A(l, o, s) {
          se(function() {
            return l.apply(void 0, o);
          }, s);
        }
        function ae(l, o, s, c, g, y, x) {
          l.current = c, o.current = g, s.current = !1, y.current && (y.current = null, x());
        }
        function G(l, o, s, c, g, y, x, z, K, Y) {
          if (l) {
            var ie = !1, ue = null, he = function() {
              if (!ie) {
                var de, Oe, Ce = o.getState();
                try {
                  de = c(Ce, g.current);
                } catch (ze) {
                  Oe = ze, ue = ze;
                }
                Oe || (ue = null), de === y.current ? x.current || K() : (y.current = de, z.current = de, x.current = !0, Y({ type: "STORE_UPDATED", payload: { error: Oe } }));
              }
            };
            return s.onStateChange = he, s.trySubscribe(), he(), function() {
              if (ie = !0, s.tryUnsubscribe(), s.onStateChange = null, ue) throw ue;
            };
          }
        }
        var Ee = function() {
          return [null, 0];
        };
        function Z(l, o) {
          o === void 0 && (o = {});
          var s = o, c = s.getDisplayName, g = c === void 0 ? function(je) {
            return "ConnectAdvanced(" + je + ")";
          } : c, y = s.methodName, x = y === void 0 ? "connectAdvanced" : y, z = s.renderCountProp, K = z === void 0 ? void 0 : z, Y = s.shouldHandleStateChanges, ie = Y === void 0 || Y, ue = s.storeKey, he = ue === void 0 ? "store" : ue, de = (s.withRef, s.forwardRef), Oe = de !== void 0 && de, Ce = s.context, ze = Ce === void 0 ? v : Ce, st = F(s, oe), $e = ze;
          return function(je) {
            var dt = je.displayName || je.name || "Component", vt = g(dt), $t = M({}, st, { getDisplayName: g, methodName: x, renderCountProp: K, shouldHandleStateChanges: ie, storeKey: he, displayName: vt, wrappedComponentName: dt, WrappedComponent: je }), xt = st.pure, Rt = xt ? i.useMemo : function(it) {
              return it();
            };
            function St(it) {
              var xn = (0, i.useMemo)(function() {
                var ir = it.reactReduxForwardedRef, Vo = F(it, fe);
                return [it.context, ir, Vo];
              }, [it]), jn = xn[0], so = xn[1], Wt = xn[2], Jt = (0, i.useMemo)(function() {
                return jn && jn.Consumer && (0, pe.isContextConsumer)(i.createElement(jn.Consumer, null)) ? jn : $e;
              }, [jn, $e]), en = (0, i.useContext)(Jt), qt = !!it.store && !!it.store.getState && !!it.store.dispatch;
              en && en.store;
              var cn = qt ? it.store : en.store, Nt = (0, i.useMemo)(function() {
                return (function(ir) {
                  return l(ir.dispatch, $t);
                })(cn);
              }, [cn]), Ft = (0, i.useMemo)(function() {
                if (!ie) return S;
                var ir = L(cn, qt ? null : en.subscription), Vo = ir.notifyNestedSubs.bind(ir);
                return [ir, Vo];
              }, [cn, qt, en]), un = Ft[0], or = Ft[1], Ui = (0, i.useMemo)(function() {
                return qt ? en : M({}, en, { subscription: un });
              }, [qt, en, un]), Vi = (0, i.useReducer)(j, ge, Ee), tn = Vi[0][0], xa = Vi[1];
              if (tn && tn.error) throw tn.error;
              var Fo = (0, i.useRef)(), nn = (0, i.useRef)(Wt), Ur = (0, i.useRef)(), Uo = (0, i.useRef)(!1), wr = Rt(function() {
                return Ur.current && Wt === nn.current ? Ur.current : Nt(cn.getState(), Wt);
              }, [cn, tn, Wt]);
              A(ae, [nn, Fo, Uo, Wt, wr, Ur, or]), A(G, [ie, cn, un, Nt, nn, Fo, Uo, Ur, or, xa], [cn, un, Nt]);
              var lo = (0, i.useMemo)(function() {
                return i.createElement(je, M({}, wr, { ref: so }));
              }, [so, je, wr]);
              return (0, i.useMemo)(function() {
                return ie ? i.createElement(Jt.Provider, { value: Ui }, lo) : lo;
              }, [Jt, lo, Ui]);
            }
            var mt = xt ? i.memo(St) : St;
            if (mt.WrappedComponent = je, mt.displayName = St.displayName = vt, Oe) {
              var En = i.forwardRef(function(it, xn) {
                return i.createElement(mt, M({}, it, { reactReduxForwardedRef: xn }));
              });
              return En.displayName = vt, En.WrappedComponent = je, ne()(En, je);
            }
            return ne()(mt, je);
          };
        }
        function U(l, o) {
          return l === o ? l !== 0 || o !== 0 || 1 / l == 1 / o : l != l && o != o;
        }
        function X(l, o) {
          if (U(l, o)) return !0;
          if (typeof l != "object" || l === null || typeof o != "object" || o === null) return !1;
          var s = Object.keys(l), c = Object.keys(o);
          if (s.length !== c.length) return !1;
          for (var g = 0; g < s.length; g++) if (!Object.prototype.hasOwnProperty.call(o, s[g]) || !U(l[s[g]], o[s[g]])) return !1;
          return !0;
        }
        function le(l) {
          return function(o, s) {
            var c = l(o, s);
            function g() {
              return c;
            }
            return g.dependsOnOwnProps = !1, g;
          };
        }
        function me(l) {
          return l.dependsOnOwnProps !== null && l.dependsOnOwnProps !== void 0 ? !!l.dependsOnOwnProps : l.length !== 1;
        }
        function ke(l, o) {
          return function(s, c) {
            c.displayName;
            var g = function(y, x) {
              return g.dependsOnOwnProps ? g.mapToProps(y, x) : g.mapToProps(y);
            };
            return g.dependsOnOwnProps = !0, g.mapToProps = function(y, x) {
              g.mapToProps = l, g.dependsOnOwnProps = me(l);
              var z = g(y, x);
              return typeof z == "function" && (g.mapToProps = z, g.dependsOnOwnProps = me(z), z = g(y, x)), z;
            }, g;
          };
        }
        const Ne = [function(l) {
          return typeof l == "function" ? ke(l) : void 0;
        }, function(l) {
          return l ? void 0 : le(function(o) {
            return { dispatch: o };
          });
        }, function(l) {
          return l && typeof l == "object" ? le(function(o) {
            return (function(s, c) {
              var g = {}, y = function(z) {
                var K = s[z];
                typeof K == "function" && (g[z] = function() {
                  return c(K.apply(void 0, arguments));
                });
              };
              for (var x in s) y(x);
              return g;
            })(l, o);
          }) : void 0;
        }], Ue = [function(l) {
          return typeof l == "function" ? ke(l) : void 0;
        }, function(l) {
          return l ? void 0 : le(function() {
            return {};
          });
        }];
        function Ae(l, o, s) {
          return M({}, s, l, o);
        }
        const Le = [function(l) {
          return typeof l == "function" ? /* @__PURE__ */ (function(o) {
            return function(s, c) {
              c.displayName;
              var g, y = c.pure, x = c.areMergedPropsEqual, z = !1;
              return function(K, Y, ie) {
                var ue = o(K, Y, ie);
                return z ? y && x(ue, g) || (g = ue) : (z = !0, g = ue), g;
              };
            };
          })(l) : void 0;
        }, function(l) {
          return l ? void 0 : function() {
            return Ae;
          };
        }];
        var Ke = ["initMapStateToProps", "initMapDispatchToProps", "initMergeProps"];
        function Je(l, o, s, c) {
          return function(g, y) {
            return s(l(g, y), o(c, y), y);
          };
        }
        function ye(l, o, s, c, g) {
          var y, x, z, K, Y, ie = g.areStatesEqual, ue = g.areOwnPropsEqual, he = g.areStatePropsEqual, de = !1;
          function Oe(Ce, ze) {
            var st, $e, je = !ue(ze, x), dt = !ie(Ce, y, ze, x);
            return y = Ce, x = ze, je && dt ? (z = l(y, x), o.dependsOnOwnProps && (K = o(c, x)), Y = s(z, K, x)) : je ? (l.dependsOnOwnProps && (z = l(y, x)), o.dependsOnOwnProps && (K = o(c, x)), Y = s(z, K, x)) : (dt && (st = l(y, x), $e = !he(st, z), z = st, $e && (Y = s(z, K, x))), Y);
          }
          return function(Ce, ze) {
            return de ? Oe(Ce, ze) : (z = l(y = Ce, x = ze), K = o(c, x), Y = s(z, K, x), de = !0, Y);
          };
        }
        function P(l, o) {
          var s = o.initMapStateToProps, c = o.initMapDispatchToProps, g = o.initMergeProps, y = F(o, Ke), x = s(l, y), z = c(l, y), K = g(l, y);
          return (y.pure ? ye : Je)(x, z, K, l, y);
        }
        var ee = ["pure", "areStatesEqual", "areOwnPropsEqual", "areStatePropsEqual", "areMergedPropsEqual"];
        function we(l, o, s) {
          for (var c = o.length - 1; c >= 0; c--) {
            var g = o[c](l);
            if (g) return g;
          }
          return function(y, x) {
            throw new Error("Invalid value of type " + typeof l + " for " + s + " argument when connecting component " + x.wrappedComponentName + ".");
          };
        }
        function Se(l, o) {
          return l === o;
        }
        function Pe(l) {
          var o = {}, s = o.connectHOC, c = s === void 0 ? Z : s, g = o.mapStateToPropsFactories, y = g === void 0 ? Ue : g, x = o.mapDispatchToPropsFactories, z = x === void 0 ? Ne : x, K = o.mergePropsFactories, Y = K === void 0 ? Le : K, ie = o.selectorFactory, ue = ie === void 0 ? P : ie;
          return function(he, de, Oe, Ce) {
            Ce === void 0 && (Ce = {});
            var ze = Ce, st = ze.pure, $e = st === void 0 || st, je = ze.areStatesEqual, dt = je === void 0 ? Se : je, vt = ze.areOwnPropsEqual, $t = vt === void 0 ? X : vt, xt = ze.areStatePropsEqual, Rt = xt === void 0 ? X : xt, St = ze.areMergedPropsEqual, mt = St === void 0 ? X : St, En = F(ze, ee), it = we(he, y, "mapStateToProps"), xn = we(de, z, "mapDispatchToProps"), jn = we(Oe, Y, "mergeProps");
            return c(ue, M({ methodName: "connect", getDisplayName: function(so) {
              return "Connect(" + so + ")";
            }, shouldHandleStateChanges: !!he, initMapStateToProps: it, initMapDispatchToProps: xn, initMergeProps: jn, pure: $e, areStatesEqual: dt, areOwnPropsEqual: $t, areStatePropsEqual: Rt, areMergedPropsEqual: mt }, En));
          };
        }
        const _e = Pe();
        var lt;
        lt = u.unstable_batchedUpdates, N = lt;
        const Qe = "SET_MODEL_CURRENT_ROOT_NAME", et = "SET_MODEL_CURRENT_NODE", Pt = "SET_MODEL_ACTIVE_TAB", ko = "TOGGLE_MODEL_SHOW_MARKERS", Dt = "TOGGLE_MODEL_SHOW_COMPACT_TEXT", Gt = "UPDATE_MODEL_STATE";
        function On(l) {
          return { type: Pt, tabName: l };
        }
        function Nn() {
          return { type: Gt };
        }
        const wo = "TOGGLE_IS_COLLAPSED", Hn = "SET_HEIGHT", $n = "SET_SIDE_PANE_WIDTH", an = "SET_EDITORS", pn = "SET_CURRENT_EDITOR_NAME", sr = "UPDATE_CURRENT_EDITOR_IS_READ_ONLY", Bt = "SET_ACTIVE_INSPECTOR_TAB";
        function $r() {
          return { type: wo };
        }
        function Wr(l) {
          return { type: an, editors: l };
        }
        function _o(l) {
          return { type: pn, editorName: l };
        }
        function Eo(l) {
          return { type: Bt, tabName: l };
        }
        function xo(l) {
          return l && l.is("element");
        }
        function Wn(l) {
          return l && l.is("rootElement");
        }
        function Kt(l) {
          return l.getPath ? l.getPath() : l.path;
        }
        function zt(l) {
          return { path: Kt(l), stickiness: l.stickiness, index: l.index, isAtEnd: l.isAtEnd, isAtStart: l.isAtStart, offset: l.offset, textNode: l.textNode && l.textNode.data };
        }
        class Ye {
          static group(...o) {
            console.group(...o);
          }
          static groupEnd(...o) {
            console.groupEnd(...o);
          }
          static log(...o) {
            console.log(...o);
          }
          static warn(...o) {
            console.warn(...o);
          }
        }
        let Pn = 0;
        function qn(l) {
          const o = { editors: {}, options: {} };
          if (typeof l[0] == "string") Ye.warn(`[CKEditorInspector] The CKEditorInspector.attach( '${l[0]}', editor ) syntax has been deprecated and will be removed in the near future. To pass a name of an editor instance, use CKEditorInspector.attach( { '${l[0]}': editor } ) instead. Learn more in https://github.com/ckeditor/ckeditor5-inspector/blob/master/README.md.`), o.editors[l[0]] = l[1];
          else {
            if ((s = l[0]).model && s.editing) o.editors["editor-" + ++Pn] = l[0];
            else for (const c in l[0]) o.editors[c] = l[0][c];
            o.options = l[1] || o.options;
          }
          var s;
          return o;
        }
        function sn(l) {
          return [...l][0][0] || "";
        }
        function qr(l, o) {
          const s = Math.min(l.length, o.length);
          for (let c = 0; c < s; c++) if (l[c] != o[c]) return c;
          return l.length == o.length ? "same" : l.length < o.length ? "prefix" : "extension";
        }
        var Tr = O(5323);
        function fn(l, o = !0) {
          if (l === void 0) return "undefined";
          if (typeof l == "function") return "function() {…}";
          const s = (0, Tr.A)(l, So, null, { maxDepth: 2 });
          return o ? s : s.replace(/(^"|"$)/g, "");
        }
        function pt(l) {
          const o = {};
          for (const s in l) o[s] = l[s], o[s].value = fn(o[s].value);
          return o;
        }
        function Kr(l, o) {
          return l.length > o ? l.substr(0, o) + `… [${l.length - o} characters left]` : l;
        }
        function So(l, o, s) {
          return typeof l == "string" ? `"${l.replaceAll("'", '\\"')}"` : s(l);
        }
        const Or = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_", Dn = ["#03a9f4", "#fb8c00", "#009688", "#e91e63", "#4caf50", "#00bcd4", "#607d8b", "#cddc39", "#9c27b0", "#f44336", "#6d4c41", "#8bc34a", "#3f51b5", "#2196f3", "#f4511e", "#673ab7", "#ffb300"];
        function Nr(l) {
          if (!l) return [];
          const o = [...l.model.document.roots];
          return o.filter(({ rootName: s }) => s !== "$graveyard").concat(o.filter(({ rootName: s }) => s === "$graveyard"));
        }
        function lr(l, o) {
          const s = { editorNode: o, properties: {}, attributes: {} };
          xo(o) ? (Wn(o) ? (s.type = "RootElement", s.name = o.rootName, s.url = `${Or}rootelement-RootElement.html`) : (s.type = "Element", s.name = o.name, s.url = `${Or}element-Element.html`), s.properties = { childCount: { value: o.childCount }, startOffset: { value: o.startOffset }, endOffset: { value: o.endOffset }, maxOffset: { value: o.maxOffset } }) : (s.name = o.data, s.type = "Text", s.url = `${Or}text-Text.html`, s.properties = { startOffset: { value: o.startOffset }, endOffset: { value: o.endOffset }, offsetSize: { value: o.offsetSize } }), s.properties.path = { value: Kt(o) }, hn(o).forEach(([c, g]) => {
            s.attributes[c] = { value: g };
          }), s.properties = pt(s.properties), s.attributes = pt(s.attributes);
          for (const c in s.attributes) {
            const g = {}, y = l.model.schema.getAttributeProperties(c);
            for (const x in y) g[x] = { value: y[x] };
            s.attributes[c].subProperties = pt(g);
          }
          return s;
        }
        function Rn(l, o) {
          const s = {}, { startOffset: c, endOffset: g } = l;
          return Object.assign(s, { startOffset: c, endOffset: g, node: l, path: l.getPath(), positionsBefore: [], positionsAfter: [] }), xo(l) ? (function(y, x) {
            const z = y.node;
            Object.assign(y, { type: "element", name: z.name, children: [], maxOffset: z.maxOffset, positions: [] });
            for (const K of z.getChildren()) y.children.push(Rn(K, x));
            (function(K, Y) {
              for (const ie of Y) {
                const ue = gi(K, ie);
                for (const he of ue) {
                  const de = he.offset;
                  if (de === 0) {
                    const Oe = K.children[0];
                    Oe ? Oe.positionsBefore.push(he) : K.positions.push(he);
                  } else if (de === K.maxOffset) {
                    const Oe = K.children[K.children.length - 1];
                    Oe ? Oe.positionsAfter.push(he) : K.positions.push(he);
                  } else {
                    let Oe = he.isEnd ? 0 : K.children.length - 1, Ce = K.children[Oe];
                    for (; Ce; ) {
                      if (Ce.startOffset === de) {
                        Ce.positionsBefore.push(he);
                        break;
                      }
                      if (Ce.endOffset === de) {
                        const ze = K.children[Oe + 1], st = Ce.type === "text" && ze && ze.type === "element", $e = Ce.type === "element" && ze && ze.type === "text", je = Ce.type === "text" && ze && ze.type === "text";
                        he.isEnd && (st || $e || je) ? ze.positionsBefore.push(he) : Ce.positionsAfter.push(he);
                        break;
                      }
                      if (Ce.startOffset < de && Ce.endOffset > de) {
                        Ce.positions.push(he);
                        break;
                      }
                      Oe += he.isEnd ? 1 : -1, Ce = K.children[Oe];
                    }
                  }
                }
              }
            })(y, x), y.attributes = Co(z);
          })(s, o) : (function(y) {
            const x = y.node;
            Object.assign(y, { type: "text", text: x.data, positions: [], presentation: { dontRenderAttributeValue: !0 } }), y.attributes = Co(x);
          })(s), s;
        }
        function Co(l) {
          const o = hn(l).map(([s, c]) => [s, fn(c, !1)]);
          return new Map(o);
        }
        function hn(l) {
          return [...l.getAttributes()].sort(([o], [s]) => o < s ? -1 : 1);
        }
        function gi(l, o) {
          const s = l.path, c = o.start.path, g = o.end.path, y = [];
          return mn(s, c) && y.push({ offset: c[c.length - 1], isEnd: !1, presentation: o.presentation || null, type: o.type, name: o.name || null }), mn(s, g) && y.push({ offset: g[g.length - 1], isEnd: !0, presentation: o.presentation || null, type: o.type, name: o.name || null }), y;
        }
        function mn(l, o) {
          return l.length === o.length - 1 && qr(l, o) === "prefix";
        }
        class Qr {
          constructor(o) {
            this._config = o;
          }
          startListening(o) {
            o.model.document.on("change", this._config.onModelChange), o.editing.view.on("render", this._config.onViewRender), o.on("change:isReadOnly", this._config.onReadOnlyChange);
          }
          stopListening(o) {
            o.model.document.off("change", this._config.onModelChange), o.editing.view.off("render", this._config.onViewRender), o.off("change:isReadOnly", this._config.onReadOnlyChange);
          }
        }
        function gn(l) {
          return l.editors.get(l.currentEditorName);
        }
        class ct {
          static set(o, s) {
            window.localStorage.setItem("ck5-inspector-" + o, s);
          }
          static get(o) {
            return window.localStorage.getItem("ck5-inspector-" + o);
          }
        }
        const Pr = "active-model-tab-name", Kn = "model-show-markers", cr = "model-compact-text";
        function Qn(l, o, s) {
          const c = (function(g, y, x) {
            if (g.ui.activeTab !== "Model") return y;
            if (!y) return Mn(g, y);
            switch (x.type) {
              case Qe:
                return (function(z, K, Y) {
                  const ie = Y.currentRootName;
                  return { ...K, ...Dr(z, K, { currentRootName: ie }), currentNode: null, currentNodeDefinition: null, currentRootName: ie };
                })(g, y, x);
              case et:
                return { ...y, currentNode: x.currentNode, currentNodeDefinition: lr(gn(g), x.currentNode) };
              case Bt:
              case Gt:
                return { ...y, ...Dr(g, y) };
              case an:
              case pn:
                return Mn(g, y);
              default:
                return y;
            }
          })(l, o, s);
          return c && (c.ui = (function(g, y) {
            if (!g) return { activeTab: ct.get(Pr) || "Inspect", showMarkers: ct.get(Kn) === "true", showCompactText: ct.get(cr) === "true" };
            switch (y.type) {
              case Pt:
                return (function(x, z) {
                  return ct.set(Pr, z.tabName), { ...x, activeTab: z.tabName };
                })(g, y);
              case ko:
                return (function(x) {
                  const z = !x.showMarkers;
                  return ct.set(Kn, z), { ...x, showMarkers: z };
                })(g);
              case Dt:
                return (function(x) {
                  const z = !x.showCompactText;
                  return ct.set(cr, z), { ...x, showCompactText: z };
                })(g);
              default:
                return g;
            }
          })(c.ui, s)), c;
        }
        function Mn(l, o = {}) {
          const s = gn(l);
          if (!s) return { ui: o.ui };
          const c = Nr(s)[0].rootName;
          return { ...o, ...Dr(l, o, { currentRootName: c }), currentRootName: c, currentNode: null, currentNodeDefinition: null };
        }
        function Dr(l, o, s) {
          const c = gn(l), g = { ...o, ...s }, y = g.currentRootName, x = (function(ue, he) {
            if (!ue) return [];
            const de = [], Oe = ue.model;
            for (const Ce of Oe.document.selection.getRanges()) Ce.root.rootName === he && de.push({ type: "selection", start: zt(Ce.start), end: zt(Ce.end) });
            return de;
          })(c, y), z = (function(ue, he) {
            if (!ue) return [];
            const de = [], Oe = ue.model;
            let Ce = 0;
            for (const ze of Oe.markers) {
              const { name: st, affectsData: $e, managedUsingOperations: je } = ze, dt = ze.getStart(), vt = ze.getEnd();
              dt.root.rootName === he && de.push({ type: "marker", marker: ze, name: st, affectsData: $e, managedUsingOperations: je, presentation: { color: Dn[Ce++ % (Dn.length - 1)] }, start: zt(dt), end: zt(vt) });
            }
            return de;
          })(c, y), K = (function({ currentEditor: ue, currentRootName: he, ranges: de, markers: Oe }) {
            return ue ? [Rn(ue.model.document.getRoot(he), [...de, ...Oe])] : [];
          })({ currentEditor: c, currentRootName: g.currentRootName, ranges: x, markers: z });
          let Y = g.currentNode, ie = g.currentNodeDefinition;
          return Y ? Y.root.rootName !== y || !Wn(Y) && !Y.parent ? (Y = null, ie = null) : ie = lr(c, Y) : ie = null, { treeDefinition: K, currentNode: Y, currentNodeDefinition: ie, ranges: x, markers: z };
        }
        const Rr = "SET_VIEW_CURRENT_ROOT_NAME", I = "SET_VIEW_CURRENT_NODE", Q = "SET_VIEW_ACTIVE_TAB", be = "TOGGLE_VIEW_SHOW_ELEMENT_TYPES", De = "UPDATE_VIEW_STATE";
        function tt(l) {
          return { type: Q, tabName: l };
        }
        function Be() {
          return { type: De };
        }
        function Ge(l) {
          return l && l.name;
        }
        function rt(l) {
          return l && Ge(l) && l.is("attributeElement");
        }
        function At(l) {
          return l && Ge(l) && l.is("emptyElement");
        }
        function ft(l) {
          return l && Ge(l) && l.is("uiElement");
        }
        function ht(l) {
          return l && Ge(l) && l.is("rawElement");
        }
        function kt(l) {
          return l && l.is("rootElement");
        }
        function jt(l) {
          return { path: [...l.parent.getPath(), l.offset], offset: l.offset, isAtEnd: l.isAtEnd, isAtStart: l.isAtStart, parent: yt(l.parent) };
        }
        function yt(l) {
          return Ge(l) ? rt(l) ? "attribute:" + l.name : kt(l) ? "root:" + l.name : "container:" + l.name : l.data;
        }
        const bt = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_view", yn = `&lt;!--The View UI element content has been skipped. <a href="${bt}_uielement-UIElement.html" target="_blank">Find out why</a>. --&gt;`, ur = `&lt;!--The View raw element content has been skipped. <a href="${bt}_rawelement-RawElement.html" target="_blank">Find out why</a>. --&gt;`;
        function In(l) {
          return l ? [...l.editing.view.document.roots] : [];
        }
        function bn(l) {
          const o = { editorNode: l, properties: {}, attributes: {}, customProperties: {} };
          if (Ge(l)) {
            kt(l) ? (o.type = "RootEditableElement", o.name = l.rootName, o.url = `${bt}_rooteditableelement-RootEditableElement.html`) : (o.name = l.name, rt(l) ? (o.type = "AttributeElement", o.url = `${bt}_attributeelement-AttributeElement.html`) : At(l) ? (o.type = "EmptyElement", o.url = `${bt}_emptyelement-EmptyElement.html`) : ft(l) ? (o.type = "UIElement", o.url = `${bt}_uielement-UIElement.html`) : ht(l) ? (o.type = "RawElement", o.url = `${bt}_rawelement-RawElement.html`) : (function(s) {
              return s && Ge(s) && s.is("editableElement");
            })(l) ? (o.type = "EditableElement", o.url = `${bt}_editableelement-EditableElement.html`) : (o.type = "ContainerElement", o.url = `${bt}_containerelement-ContainerElement.html`)), nt(l).forEach(([s, c]) => {
              o.attributes[s] = { value: c };
            }), o.properties = { index: { value: l.index }, isEmpty: { value: l.isEmpty }, childCount: { value: l.childCount } };
            for (let [s, c] of l.getCustomProperties()) typeof s == "symbol" && (s = s.toString()), o.customProperties[s] = { value: c };
          } else o.name = l.data, o.type = "Text", o.url = `${bt}_text-Text.html`, o.properties = { index: { value: l.index } };
          return o.properties = pt(o.properties), o.customProperties = pt(o.customProperties), o.attributes = pt(o.attributes), o;
        }
        function Yr(l, o) {
          const s = {};
          return Object.assign(s, { index: l.index, path: l.getPath(), node: l, positionsBefore: [], positionsAfter: [] }), Ge(l) ? (function(c, g) {
            const y = c.node;
            Object.assign(c, { type: "element", children: [], positions: [] }), c.name = y.name, rt(y) ? c.elementType = "attribute" : kt(y) ? c.elementType = "root" : At(y) ? c.elementType = "empty" : ft(y) ? c.elementType = "ui" : ht(y) ? c.elementType = "raw" : c.elementType = "container", At(y) ? c.presentation = { isEmpty: !0 } : ft(y) ? c.children.push({ type: "comment", text: yn }) : ht(y) && c.children.push({ type: "comment", text: ur });
            for (const x of y.getChildren()) c.children.push(Yr(x, g));
            (function(x, z) {
              for (const K of z) {
                const Y = To(x, K);
                for (const ie of Y) {
                  const ue = ie.offset;
                  if (ue === 0) {
                    const he = x.children[0];
                    he ? he.positionsBefore.push(ie) : x.positions.push(ie);
                  } else if (ue === x.children.length) {
                    const he = x.children[x.children.length - 1];
                    he ? he.positionsAfter.push(ie) : x.positions.push(ie);
                  } else {
                    let he = ie.isEnd ? 0 : x.children.length - 1, de = x.children[he];
                    for (; de; ) {
                      if (de.index === ue) {
                        de.positionsBefore.push(ie);
                        break;
                      }
                      if (de.index + 1 === ue) {
                        de.positionsAfter.push(ie);
                        break;
                      }
                      he += ie.isEnd ? 1 : -1, de = x.children[he];
                    }
                  }
                }
              }
            })(c, g), c.attributes = (function(x) {
              const z = nt(x).map(([K, Y]) => [K, fn(Y, !1)]);
              return new Map(z);
            })(y);
          })(s, o) : (function(c, g) {
            Object.assign(c, { type: "text", startOffset: 0, text: c.node.data, positions: [] });
            for (const y of g) {
              const x = To(c, y);
              c.positions.push(...x);
            }
          })(s, o), s;
        }
        function To(l, o) {
          const s = l.path, c = o.start.path, g = o.end.path, y = [];
          return Oo(s, c) && y.push({ offset: c[c.length - 1], isEnd: !1, presentation: o.presentation || null, type: o.type, name: o.name || null }), Oo(s, g) && y.push({ offset: g[g.length - 1], isEnd: !0, presentation: o.presentation || null, type: o.type, name: o.name || null }), y;
        }
        function Oo(l, o) {
          return l.length === o.length - 1 && qr(l, o) === "prefix";
        }
        function nt(l) {
          return [...l.getAttributes()].sort(([o], [s]) => o.toUpperCase() < s.toUpperCase() ? -1 : 1);
        }
        const Ze = "active-view-tab-name", Yn = "view-element-types";
        function vn(l, o, s) {
          const c = (function(g, y, x) {
            if (g.ui.activeTab !== "View") return y;
            if (!y) return dr(g, y);
            switch (x.type) {
              case Rr:
                return (function(z, K, Y) {
                  const ie = Y.currentRootName;
                  return { ...K, ...ut(z, K, { currentRootName: ie }), currentNode: null, currentNodeDefinition: null, currentRootName: ie };
                })(g, y, x);
              case I:
                return { ...y, currentNode: x.currentNode, currentNodeDefinition: bn(x.currentNode) };
              case Bt:
              case De:
                return { ...y, ...ut(g, y) };
              case an:
              case pn:
                return dr(g, y);
              default:
                return y;
            }
          })(l, o, s);
          return c && (c.ui = (function(g, y, x) {
            if (!y) return { activeTab: ct.get(Ze) || "Inspect", showElementTypes: ct.get(Yn) === "true" };
            switch (x.type) {
              case Q:
                return (function(z, K) {
                  return ct.set(Ze, K.tabName), { ...z, activeTab: K.tabName };
                })(y, x);
              case be:
                return (function(z, K) {
                  const Y = !K.showElementTypes;
                  return ct.set(Yn, Y), { ...K, showElementTypes: Y };
                })(0, y);
              default:
                return y;
            }
          })(0, c.ui, s)), c;
        }
        function dr(l, o = {}) {
          const s = In(gn(l)), c = s[0] ? s[0].rootName : null;
          return { ...o, ...ut(l, o, { currentRootName: c }), currentRootName: c, currentNode: null, currentNodeDefinition: null };
        }
        function ut(l, o, s) {
          const c = { ...o, ...s }, g = c.currentRootName, y = (function(Y, ie) {
            if (!Y) return [];
            const ue = [], he = Y.editing.view.document.selection;
            for (const de of he.getRanges()) de.root.rootName === ie && ue.push({ type: "selection", start: jt(de.start), end: jt(de.end) });
            return ue;
          })(gn(l), g), x = (function({ currentEditor: Y, currentRootName: ie, ranges: ue }) {
            return Y && ie ? [Yr(Y.editing.view.document.getRoot(ie), [...ue])] : null;
          })({ currentEditor: gn(l), currentRootName: g, ranges: y });
          let z = c.currentNode, K = c.currentNodeDefinition;
          return z ? z.root.rootName !== g || !kt(z) && !z.parent ? (z = null, K = null) : K = bn(z) : K = null, { treeDefinition: x, currentNode: z, currentNodeDefinition: K, ranges: y };
        }
        const wt = "SET_COMMANDS_CURRENT_COMMAND_NAME", Tt = "UPDATE_COMMANDS_STATE";
        function Lt() {
          return { type: Tt };
        }
        function kn({ editors: l, currentEditorName: o }, s) {
          if (!s) return null;
          const c = l.get(o).commands.get(s);
          return { currentCommandName: s, type: "Command", url: "https://ckeditor.com/docs/ckeditor5/latest/api/module_core_command-Command.html", properties: pt({ isEnabled: { value: c.isEnabled }, value: { value: c.value } }), command: c };
        }
        function zn({ editors: l, currentEditorName: o }) {
          if (!l.get(o)) return [];
          const s = [];
          for (const [c, g] of l.get(o).commands) {
            const y = [];
            g.value !== void 0 && y.push(["value", fn(g.value, !1)]), s.push({ name: c, type: "element", children: [], node: c, attributes: y, presentation: { isEmpty: !0, cssClass: ["ck-inspector-tree-node_tagless", g.isEnabled ? "" : "ck-inspector-tree-node_disabled"].join(" ") } });
          }
          return s.sort((c, g) => c.name > g.name ? 1 : -1);
        }
        function wn(l, o = {}) {
          return { ...o, currentCommandName: null, currentCommandDefinition: null, treeDefinition: zn(l) };
        }
        const ln = "SET_SCHEMA_CURRENT_DEFINITION_NAME";
        function Xr(l) {
          return { type: ln, currentSchemaDefinitionName: l };
        }
        const pr = ["isBlock", "isInline", "isObject", "isContent", "isLimit", "isSelectable"], Xn = "https://ckeditor.com/docs/ckeditor5/latest/api/";
        function _n({ editors: l, currentEditorName: o }, s) {
          if (!s) return null;
          const c = l.get(o).model.schema, g = c.getDefinitions()[s], y = {}, x = {}, z = {};
          let K = {};
          for (const Y of pr) g[Y] && (y[Y] = { value: g[Y] });
          for (const Y of g.allowChildren.sort()) x[Y] = { value: !0, title: `Click to see the definition of ${Y}` };
          for (const Y of g.allowIn.sort()) z[Y] = { value: !0, title: `Click to see the definition of ${Y}` };
          for (const Y of g.allowAttributes.sort()) K[Y] = { value: !0 };
          K = pt(K);
          for (const Y in K) {
            const ie = c.getAttributeProperties(Y), ue = {};
            for (const he in ie) ue[he] = { value: ie[he] };
            K[Y].subProperties = pt(ue);
          }
          return { currentSchemaDefinitionName: s, type: "SchemaCompiledItemDefinition", urls: { general: Xn + "module_engine_model_schema-SchemaCompiledItemDefinition.html", allowAttributes: Xn + "module_engine_model_schema-SchemaItemDefinition.html#member-allowAttributes", allowChildren: Xn + "module_engine_model_schema-SchemaItemDefinition.html#member-allowChildren", allowIn: Xn + "module_engine_model_schema-SchemaItemDefinition.html#member-allowIn" }, properties: pt(y), allowChildren: pt(x), allowIn: pt(z), allowAttributes: K, definition: g };
        }
        function Mr({ editors: l, currentEditorName: o }) {
          if (!l.get(o)) return [];
          const s = [], c = l.get(o).model.schema.getDefinitions();
          for (const g in c) s.push({ name: g, type: "element", children: [], node: g, attributes: [], presentation: { isEmpty: !0, cssClass: "ck-inspector-tree-node_tagless" } });
          return s.sort((g, y) => g.name > y.name ? 1 : -1);
        }
        function fr(l, o = {}) {
          return { ...o, currentSchemaDefinitionName: null, currentSchemaDefinition: null, treeDefinition: Mr(l) };
        }
        const hr = "active-tab-name", Ir = "is-collapsed", Gr = "height", yi = "side-pane-width";
        function ta(l, o) {
          const s = (function(c, g) {
            switch (g.type) {
              case an:
                return (function(y, x) {
                  const z = { editors: new Map(x.editors) };
                  return x.editors.size ? x.editors.has(y.currentEditorName) || (z.currentEditorName = sn(x.editors)) : z.currentEditorName = null, { ...y, ...z };
                })(c, g);
              case pn:
                return (function(y, x) {
                  return { ...y, currentEditorName: x.editorName };
                })(c, g);
              default:
                return c;
            }
          })(l, o);
          return s.currentEditorGlobals = (function(c, g, y) {
            switch (y.type) {
              case an:
              case pn:
                return { ...bi(c, {}) };
              case sr:
                return bi(c, g);
              default:
                return g;
            }
          })(s, s.currentEditorGlobals, o), s.ui = (function(c, g) {
            if (!c.activeTab) {
              let y;
              return y = c.isCollapsed !== void 0 ? c.isCollapsed : ct.get(Ir) === "true", { ...c, isCollapsed: y, activeTab: ct.get(hr) || "Model", height: ct.get(Gr) || "400px", sidePaneWidth: ct.get(yi) || "500px" };
            }
            switch (g.type) {
              case wo:
                return (function(y) {
                  const x = !y.isCollapsed;
                  return ct.set(Ir, x), { ...y, isCollapsed: x };
                })(c);
              case Hn:
                return (function(y, x) {
                  return ct.set(Gr, x.newHeight), { ...y, height: x.newHeight };
                })(c, g);
              case $n:
                return (function(y, x) {
                  return ct.set(yi, x.newWidth), { ...y, sidePaneWidth: x.newWidth };
                })(c, g);
              case Bt:
                return (function(y, x) {
                  return ct.set(hr, x.tabName), { ...y, activeTab: x.tabName };
                })(c, g);
              default:
                return c;
            }
          })(s.ui, o), s.model = Qn(s, s.model, o), s.view = vn(s, s.view, o), s.commands = (function(c, g, y) {
            if (c.ui.activeTab !== "Commands") return g;
            if (!g) return wn(c, g);
            switch (y.type) {
              case wt:
                return { ...g, currentCommandDefinition: kn(c, y.currentCommandName), currentCommandName: y.currentCommandName };
              case Bt:
              case Tt:
                return { ...g, currentCommandDefinition: kn(c, g.currentCommandName), treeDefinition: zn(c) };
              case an:
              case pn:
                return wn(c, g);
              default:
                return g;
            }
          })(s, s.commands, o), s.schema = (function(c, g, y) {
            if (c.ui.activeTab !== "Schema") return g;
            if (!g) return fr(c, g);
            switch (y.type) {
              case ln:
                return { ...g, currentSchemaDefinition: _n(c, y.currentSchemaDefinitionName), currentSchemaDefinitionName: y.currentSchemaDefinitionName };
              case Bt:
                return { ...g, currentSchemaDefinition: _n(c, g.currentSchemaDefinitionName), treeDefinition: Mr(c) };
              case an:
              case pn:
                return fr(c, g);
              default:
                return g;
            }
          })(s, s.schema, o), { ...l, ...s };
        }
        function bi(l, o) {
          const s = gn(l);
          return { ...o, isReadOnly: !!s && s.isReadOnly };
        }
        var vi = O(5794), os = O.n(vi), ki = /* @__PURE__ */ (function() {
          var l = function(o, s) {
            return l = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(c, g) {
              c.__proto__ = g;
            } || function(c, g) {
              for (var y in g) g.hasOwnProperty(y) && (c[y] = g[y]);
            }, l(o, s);
          };
          return function(o, s) {
            function c() {
              this.constructor = o;
            }
            l(o, s), o.prototype = s === null ? Object.create(s) : (c.prototype = s.prototype, new c());
          };
        })(), No = function() {
          return No = Object.assign || function(l) {
            for (var o, s = 1, c = arguments.length; s < c; s++) for (var g in o = arguments[s]) Object.prototype.hasOwnProperty.call(o, g) && (l[g] = o[g]);
            return l;
          }, No.apply(this, arguments);
        }, wi = { top: { width: "100%", height: "10px", top: "-5px", left: "0px", cursor: "row-resize" }, right: { width: "10px", height: "100%", top: "0px", right: "-5px", cursor: "col-resize" }, bottom: { width: "100%", height: "10px", bottom: "-5px", left: "0px", cursor: "row-resize" }, left: { width: "10px", height: "100%", top: "0px", left: "-5px", cursor: "col-resize" }, topRight: { width: "20px", height: "20px", position: "absolute", right: "-10px", top: "-10px", cursor: "ne-resize" }, bottomRight: { width: "20px", height: "20px", position: "absolute", right: "-10px", bottom: "-10px", cursor: "se-resize" }, bottomLeft: { width: "20px", height: "20px", position: "absolute", left: "-10px", bottom: "-10px", cursor: "sw-resize" }, topLeft: { width: "20px", height: "20px", position: "absolute", left: "-10px", top: "-10px", cursor: "nw-resize" } }, is = (function(l) {
          function o() {
            var s = l !== null && l.apply(this, arguments) || this;
            return s.onMouseDown = function(c) {
              s.props.onResizeStart(c, s.props.direction);
            }, s.onTouchStart = function(c) {
              s.props.onResizeStart(c, s.props.direction);
            }, s;
          }
          return ki(o, l), o.prototype.render = function() {
            return i.createElement("div", { className: this.props.className || "", style: No(No({ position: "absolute", userSelect: "none" }, wi[this.props.direction]), this.props.replaceStyles || {}), onMouseDown: this.onMouseDown, onTouchStart: this.onTouchStart }, this.props.children);
          }, o;
        })(i.PureComponent), as = O(4987), An = O.n(as), gt = /* @__PURE__ */ (function() {
          var l = function(o, s) {
            return l = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(c, g) {
              c.__proto__ = g;
            } || function(c, g) {
              for (var y in g) g.hasOwnProperty(y) && (c[y] = g[y]);
            }, l(o, s);
          };
          return function(o, s) {
            function c() {
              this.constructor = o;
            }
            l(o, s), o.prototype = s === null ? Object.create(s) : (c.prototype = s.prototype, new c());
          };
        })(), Qt = function() {
          return Qt = Object.assign || function(l) {
            for (var o, s = 1, c = arguments.length; s < c; s++) for (var g in o = arguments[s]) Object.prototype.hasOwnProperty.call(o, g) && (l[g] = o[g]);
            return l;
          }, Qt.apply(this, arguments);
        }, ss = { width: "auto", height: "auto" }, Jo = An()(function(l, o, s) {
          return Math.max(Math.min(l, s), o);
        }), Po = An()(function(l, o) {
          return Math.round(l / o) * o;
        }), mr = An()(function(l, o) {
          return new RegExp(l, "i").test(o);
        }), gr = function(l) {
          return !!(l.touches && l.touches.length);
        }, na = An()(function(l, o, s) {
          s === void 0 && (s = 0);
          var c = o.reduce(function(y, x, z) {
            return Math.abs(x - l) < Math.abs(o[y] - l) ? z : y;
          }, 0), g = Math.abs(o[c] - l);
          return s === 0 || g < s ? o[c] : l;
        }), _t = An()(function(l, o) {
          return l.substr(l.length - o.length, o.length) === o;
        }), ei = An()(function(l) {
          return (l = l.toString()) === "auto" || _t(l, "px") || _t(l, "%") || _t(l, "vh") || _t(l, "vw") || _t(l, "vmax") || _t(l, "vmin") ? l : l + "px";
        }), ti = function(l, o, s, c) {
          if (l && typeof l == "string") {
            if (_t(l, "px")) return Number(l.replace("px", ""));
            if (_t(l, "%")) return o * (Number(l.replace("%", "")) / 100);
            if (_t(l, "vw")) return s * (Number(l.replace("vw", "")) / 100);
            if (_t(l, "vh")) return c * (Number(l.replace("vh", "")) / 100);
          }
          return l;
        }, _i = An()(function(l, o, s, c, g, y, x) {
          return c = ti(c, l.width, o, s), g = ti(g, l.height, o, s), y = ti(y, l.width, o, s), x = ti(x, l.height, o, s), { maxWidth: c === void 0 ? void 0 : Number(c), maxHeight: g === void 0 ? void 0 : Number(g), minWidth: y === void 0 ? void 0 : Number(y), minHeight: x === void 0 ? void 0 : Number(x) };
        }), Ei = ["as", "style", "className", "grid", "snap", "bounds", "boundsByDirection", "size", "defaultSize", "minWidth", "minHeight", "maxWidth", "maxHeight", "lockAspectRatio", "lockAspectRatioExtraWidth", "lockAspectRatioExtraHeight", "enable", "handleStyles", "handleClasses", "handleWrapperStyle", "handleWrapperClass", "children", "onResizeStart", "onResize", "onResizeStop", "handleComponent", "scale", "resizeRatio", "snapGap"], xi = "__resizable_base__", Gn = (function(l) {
          function o(s) {
            var c = l.call(this, s) || this;
            return c.ratio = 1, c.resizable = null, c.parentLeft = 0, c.parentTop = 0, c.resizableLeft = 0, c.resizableRight = 0, c.resizableTop = 0, c.resizableBottom = 0, c.targetLeft = 0, c.targetTop = 0, c.appendBase = function() {
              if (!c.resizable || !c.window) return null;
              var g = c.parentNode;
              if (!g) return null;
              var y = c.window.document.createElement("div");
              return y.style.width = "100%", y.style.height = "100%", y.style.position = "absolute", y.style.transform = "scale(0, 0)", y.style.left = "0", y.style.flex = "0", y.classList ? y.classList.add(xi) : y.className += xi, g.appendChild(y), y;
            }, c.removeBase = function(g) {
              var y = c.parentNode;
              y && y.removeChild(g);
            }, c.ref = function(g) {
              g && (c.resizable = g);
            }, c.state = { isResizing: !1, width: (c.propsSize && c.propsSize.width) === void 0 ? "auto" : c.propsSize && c.propsSize.width, height: (c.propsSize && c.propsSize.height) === void 0 ? "auto" : c.propsSize && c.propsSize.height, direction: "right", original: { x: 0, y: 0, width: 0, height: 0 }, backgroundStyle: { height: "100%", width: "100%", backgroundColor: "rgba(0,0,0,0)", cursor: "auto", opacity: 0, position: "fixed", zIndex: 9999, top: "0", left: "0", bottom: "0", right: "0" }, flexBasis: void 0 }, c.onResizeStart = c.onResizeStart.bind(c), c.onMouseMove = c.onMouseMove.bind(c), c.onMouseUp = c.onMouseUp.bind(c), c;
          }
          return gt(o, l), Object.defineProperty(o.prototype, "parentNode", { get: function() {
            return this.resizable ? this.resizable.parentNode : null;
          }, enumerable: !1, configurable: !0 }), Object.defineProperty(o.prototype, "window", { get: function() {
            return this.resizable && this.resizable.ownerDocument ? this.resizable.ownerDocument.defaultView : null;
          }, enumerable: !1, configurable: !0 }), Object.defineProperty(o.prototype, "propsSize", { get: function() {
            return this.props.size || this.props.defaultSize || ss;
          }, enumerable: !1, configurable: !0 }), Object.defineProperty(o.prototype, "size", { get: function() {
            var s = 0, c = 0;
            if (this.resizable && this.window) {
              var g = this.resizable.offsetWidth, y = this.resizable.offsetHeight, x = this.resizable.style.position;
              x !== "relative" && (this.resizable.style.position = "relative"), s = this.resizable.style.width !== "auto" ? this.resizable.offsetWidth : g, c = this.resizable.style.height !== "auto" ? this.resizable.offsetHeight : y, this.resizable.style.position = x;
            }
            return { width: s, height: c };
          }, enumerable: !1, configurable: !0 }), Object.defineProperty(o.prototype, "sizeStyle", { get: function() {
            var s = this, c = this.props.size, g = function(y) {
              if (s.state[y] === void 0 || s.state[y] === "auto") return "auto";
              if (s.propsSize && s.propsSize[y] && _t(s.propsSize[y].toString(), "%")) {
                if (_t(s.state[y].toString(), "%")) return s.state[y].toString();
                var x = s.getParentSize();
                return Number(s.state[y].toString().replace("px", "")) / x[y] * 100 + "%";
              }
              return ei(s.state[y]);
            };
            return { width: c && c.width !== void 0 && !this.state.isResizing ? ei(c.width) : g("width"), height: c && c.height !== void 0 && !this.state.isResizing ? ei(c.height) : g("height") };
          }, enumerable: !1, configurable: !0 }), o.prototype.getParentSize = function() {
            if (!this.parentNode) return this.window ? { width: this.window.innerWidth, height: this.window.innerHeight } : { width: 0, height: 0 };
            var s = this.appendBase();
            if (!s) return { width: 0, height: 0 };
            var c = !1, g = this.parentNode.style.flexWrap;
            g !== "wrap" && (c = !0, this.parentNode.style.flexWrap = "wrap"), s.style.position = "relative", s.style.minWidth = "100%";
            var y = { width: s.offsetWidth, height: s.offsetHeight };
            return c && (this.parentNode.style.flexWrap = g), this.removeBase(s), y;
          }, o.prototype.bindEvents = function() {
            this.window && (this.window.addEventListener("mouseup", this.onMouseUp), this.window.addEventListener("mousemove", this.onMouseMove), this.window.addEventListener("mouseleave", this.onMouseUp), this.window.addEventListener("touchmove", this.onMouseMove, { capture: !0, passive: !1 }), this.window.addEventListener("touchend", this.onMouseUp));
          }, o.prototype.unbindEvents = function() {
            this.window && (this.window.removeEventListener("mouseup", this.onMouseUp), this.window.removeEventListener("mousemove", this.onMouseMove), this.window.removeEventListener("mouseleave", this.onMouseUp), this.window.removeEventListener("touchmove", this.onMouseMove, !0), this.window.removeEventListener("touchend", this.onMouseUp));
          }, o.prototype.componentDidMount = function() {
            if (this.resizable && this.window) {
              var s = this.window.getComputedStyle(this.resizable);
              this.setState({ width: this.state.width || this.size.width, height: this.state.height || this.size.height, flexBasis: s.flexBasis !== "auto" ? s.flexBasis : void 0 });
            }
          }, o.prototype.componentWillUnmount = function() {
            this.window && this.unbindEvents();
          }, o.prototype.createSizeForCssProperty = function(s, c) {
            var g = this.propsSize && this.propsSize[c];
            return this.state[c] !== "auto" || this.state.original[c] !== s || g !== void 0 && g !== "auto" ? s : "auto";
          }, o.prototype.calculateNewMaxFromBoundary = function(s, c) {
            var g, y, x = this.props.boundsByDirection, z = this.state.direction, K = x && mr("left", z), Y = x && mr("top", z);
            if (this.props.bounds === "parent") {
              var ie = this.parentNode;
              ie && (g = K ? this.resizableRight - this.parentLeft : ie.offsetWidth + (this.parentLeft - this.resizableLeft), y = Y ? this.resizableBottom - this.parentTop : ie.offsetHeight + (this.parentTop - this.resizableTop));
            } else this.props.bounds === "window" ? this.window && (g = K ? this.resizableRight : this.window.innerWidth - this.resizableLeft, y = Y ? this.resizableBottom : this.window.innerHeight - this.resizableTop) : this.props.bounds && (g = K ? this.resizableRight - this.targetLeft : this.props.bounds.offsetWidth + (this.targetLeft - this.resizableLeft), y = Y ? this.resizableBottom - this.targetTop : this.props.bounds.offsetHeight + (this.targetTop - this.resizableTop));
            return g && Number.isFinite(g) && (s = s && s < g ? s : g), y && Number.isFinite(y) && (c = c && c < y ? c : y), { maxWidth: s, maxHeight: c };
          }, o.prototype.calculateNewSizeFromDirection = function(s, c) {
            var g = this.props.scale || 1, y = this.props.resizeRatio || 1, x = this.state, z = x.direction, K = x.original, Y = this.props, ie = Y.lockAspectRatio, ue = Y.lockAspectRatioExtraHeight, he = Y.lockAspectRatioExtraWidth, de = K.width, Oe = K.height, Ce = ue || 0, ze = he || 0;
            return mr("right", z) && (de = K.width + (s - K.x) * y / g, ie && (Oe = (de - ze) / this.ratio + Ce)), mr("left", z) && (de = K.width - (s - K.x) * y / g, ie && (Oe = (de - ze) / this.ratio + Ce)), mr("bottom", z) && (Oe = K.height + (c - K.y) * y / g, ie && (de = (Oe - Ce) * this.ratio + ze)), mr("top", z) && (Oe = K.height - (c - K.y) * y / g, ie && (de = (Oe - Ce) * this.ratio + ze)), { newWidth: de, newHeight: Oe };
          }, o.prototype.calculateNewSizeFromAspectRatio = function(s, c, g, y) {
            var x = this.props, z = x.lockAspectRatio, K = x.lockAspectRatioExtraHeight, Y = x.lockAspectRatioExtraWidth, ie = y.width === void 0 ? 10 : y.width, ue = g.width === void 0 || g.width < 0 ? s : g.width, he = y.height === void 0 ? 10 : y.height, de = g.height === void 0 || g.height < 0 ? c : g.height, Oe = K || 0, Ce = Y || 0;
            if (z) {
              var ze = (he - Oe) * this.ratio + Ce, st = (de - Oe) * this.ratio + Ce, $e = (ie - Ce) / this.ratio + Oe, je = (ue - Ce) / this.ratio + Oe, dt = Math.max(ie, ze), vt = Math.min(ue, st), $t = Math.max(he, $e), xt = Math.min(de, je);
              s = Jo(s, dt, vt), c = Jo(c, $t, xt);
            } else s = Jo(s, ie, ue), c = Jo(c, he, de);
            return { newWidth: s, newHeight: c };
          }, o.prototype.setBoundingClientRect = function() {
            if (this.props.bounds === "parent") {
              var s = this.parentNode;
              if (s) {
                var c = s.getBoundingClientRect();
                this.parentLeft = c.left, this.parentTop = c.top;
              }
            }
            if (this.props.bounds && typeof this.props.bounds != "string") {
              var g = this.props.bounds.getBoundingClientRect();
              this.targetLeft = g.left, this.targetTop = g.top;
            }
            if (this.resizable) {
              var y = this.resizable.getBoundingClientRect(), x = y.left, z = y.top, K = y.right, Y = y.bottom;
              this.resizableLeft = x, this.resizableRight = K, this.resizableTop = z, this.resizableBottom = Y;
            }
          }, o.prototype.onResizeStart = function(s, c) {
            if (this.resizable && this.window) {
              var g, y = 0, x = 0;
              if (s.nativeEvent && (function(ue) {
                return !!((ue.clientX || ue.clientX === 0) && (ue.clientY || ue.clientY === 0));
              })(s.nativeEvent)) {
                if (y = s.nativeEvent.clientX, x = s.nativeEvent.clientY, s.nativeEvent.which === 3) return;
              } else s.nativeEvent && gr(s.nativeEvent) && (y = s.nativeEvent.touches[0].clientX, x = s.nativeEvent.touches[0].clientY);
              if (this.props.onResizeStart && this.resizable && this.props.onResizeStart(s, c, this.resizable) === !1) return;
              this.props.size && (this.props.size.height !== void 0 && this.props.size.height !== this.state.height && this.setState({ height: this.props.size.height }), this.props.size.width !== void 0 && this.props.size.width !== this.state.width && this.setState({ width: this.props.size.width })), this.ratio = typeof this.props.lockAspectRatio == "number" ? this.props.lockAspectRatio : this.size.width / this.size.height;
              var z = this.window.getComputedStyle(this.resizable);
              if (z.flexBasis !== "auto") {
                var K = this.parentNode;
                if (K) {
                  var Y = this.window.getComputedStyle(K).flexDirection;
                  this.flexDir = Y.startsWith("row") ? "row" : "column", g = z.flexBasis;
                }
              }
              this.setBoundingClientRect(), this.bindEvents();
              var ie = { original: { x: y, y: x, width: this.size.width, height: this.size.height }, isResizing: !0, backgroundStyle: Qt(Qt({}, this.state.backgroundStyle), { cursor: this.window.getComputedStyle(s.target).cursor || "auto" }), direction: c, flexBasis: g };
              this.setState(ie);
            }
          }, o.prototype.onMouseMove = function(s) {
            if (this.state.isResizing && this.resizable && this.window) {
              if (this.window.TouchEvent && gr(s)) try {
                s.preventDefault(), s.stopPropagation();
              } catch {
              }
              var c = this.props, g = c.maxWidth, y = c.maxHeight, x = c.minWidth, z = c.minHeight, K = gr(s) ? s.touches[0].clientX : s.clientX, Y = gr(s) ? s.touches[0].clientY : s.clientY, ie = this.state, ue = ie.direction, he = ie.original, de = ie.width, Oe = ie.height, Ce = this.getParentSize(), ze = _i(Ce, this.window.innerWidth, this.window.innerHeight, g, y, x, z);
              g = ze.maxWidth, y = ze.maxHeight, x = ze.minWidth, z = ze.minHeight;
              var st = this.calculateNewSizeFromDirection(K, Y), $e = st.newHeight, je = st.newWidth, dt = this.calculateNewMaxFromBoundary(g, y), vt = this.calculateNewSizeFromAspectRatio(je, $e, { width: dt.maxWidth, height: dt.maxHeight }, { width: x, height: z });
              if (je = vt.newWidth, $e = vt.newHeight, this.props.grid) {
                var $t = Po(je, this.props.grid[0]), xt = Po($e, this.props.grid[1]), Rt = this.props.snapGap || 0;
                je = Rt === 0 || Math.abs($t - je) <= Rt ? $t : je, $e = Rt === 0 || Math.abs(xt - $e) <= Rt ? xt : $e;
              }
              this.props.snap && this.props.snap.x && (je = na(je, this.props.snap.x, this.props.snapGap)), this.props.snap && this.props.snap.y && ($e = na($e, this.props.snap.y, this.props.snapGap));
              var St = { width: je - he.width, height: $e - he.height };
              de && typeof de == "string" && (_t(de, "%") ? je = je / Ce.width * 100 + "%" : _t(de, "vw") ? je = je / this.window.innerWidth * 100 + "vw" : _t(de, "vh") && (je = je / this.window.innerHeight * 100 + "vh")), Oe && typeof Oe == "string" && (_t(Oe, "%") ? $e = $e / Ce.height * 100 + "%" : _t(Oe, "vw") ? $e = $e / this.window.innerWidth * 100 + "vw" : _t(Oe, "vh") && ($e = $e / this.window.innerHeight * 100 + "vh"));
              var mt = { width: this.createSizeForCssProperty(je, "width"), height: this.createSizeForCssProperty($e, "height") };
              this.flexDir === "row" ? mt.flexBasis = mt.width : this.flexDir === "column" && (mt.flexBasis = mt.height), this.setState(mt), this.props.onResize && this.props.onResize(s, ue, this.resizable, St);
            }
          }, o.prototype.onMouseUp = function(s) {
            var c = this.state, g = c.isResizing, y = c.direction, x = c.original;
            if (g && this.resizable) {
              var z = { width: this.size.width - x.width, height: this.size.height - x.height };
              this.props.onResizeStop && this.props.onResizeStop(s, y, this.resizable, z), this.props.size && this.setState(this.props.size), this.unbindEvents(), this.setState({ isResizing: !1, backgroundStyle: Qt(Qt({}, this.state.backgroundStyle), { cursor: "auto" }) });
            }
          }, o.prototype.updateSize = function(s) {
            this.setState({ width: s.width, height: s.height });
          }, o.prototype.renderResizer = function() {
            var s = this, c = this.props, g = c.enable, y = c.handleStyles, x = c.handleClasses, z = c.handleWrapperStyle, K = c.handleWrapperClass, Y = c.handleComponent;
            if (!g) return null;
            var ie = Object.keys(g).map(function(ue) {
              return g[ue] !== !1 ? i.createElement(is, { key: ue, direction: ue, onResizeStart: s.onResizeStart, replaceStyles: y && y[ue], className: x && x[ue] }, Y && Y[ue] ? Y[ue] : null) : null;
            });
            return i.createElement("div", { className: K, style: z }, ie);
          }, o.prototype.render = function() {
            var s = this, c = Object.keys(this.props).reduce(function(x, z) {
              return Ei.indexOf(z) !== -1 || (x[z] = s.props[z]), x;
            }, {}), g = Qt(Qt(Qt({ position: "relative", userSelect: this.state.isResizing ? "none" : "auto" }, this.props.style), this.sizeStyle), { maxWidth: this.props.maxWidth, maxHeight: this.props.maxHeight, minWidth: this.props.minWidth, minHeight: this.props.minHeight, boxSizing: "border-box", flexShrink: 0 });
            this.state.flexBasis && (g.flexBasis = this.state.flexBasis);
            var y = this.props.as || "div";
            return i.createElement(y, Qt({ ref: this.ref, style: g, className: this.props.className }, c), this.state.isResizing && i.createElement("div", { style: this.state.backgroundStyle }), this.props.children, this.renderResizer());
          }, o.defaultProps = { as: "div", onResizeStart: function() {
          }, onResize: function() {
          }, onResizeStop: function() {
          }, enable: { top: !0, right: !0, bottom: !0, left: !0, topRight: !0, bottomRight: !0, bottomLeft: !0, topLeft: !0 }, style: {}, grid: [1, 1], lockAspectRatio: !1, lockAspectRatioExtraWidth: 0, lockAspectRatioExtraHeight: 0, scale: 1, resizeRatio: 1, snapGap: 0 }, o;
        })(i.PureComponent), Zr = function(l, o) {
          return Zr = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(s, c) {
            s.__proto__ = c;
          } || function(s, c) {
            for (var g in c) c.hasOwnProperty(g) && (s[g] = c[g]);
          }, Zr(l, o);
        }, Zt = function() {
          return Zt = Object.assign || function(l) {
            for (var o, s = 1, c = arguments.length; s < c; s++) for (var g in o = arguments[s]) Object.prototype.hasOwnProperty.call(o, g) && (l[g] = o[g]);
            return l;
          }, Zt.apply(this, arguments);
        }, ra = os(), oa = { width: "auto", height: "auto", display: "inline-block", position: "absolute", top: 0, left: 0 }, Si = (function(l) {
          function o(s) {
            var c = l.call(this, s) || this;
            return c.resizing = !1, c.resizingPosition = { x: 0, y: 0 }, c.offsetFromParent = { left: 0, top: 0 }, c.resizableElement = { current: null }, c.refDraggable = function(g) {
              g && (c.draggable = g);
            }, c.refResizable = function(g) {
              g && (c.resizable = g, c.resizableElement.current = g.resizable);
            }, c.state = { original: { x: 0, y: 0 }, bounds: { top: 0, right: 0, bottom: 0, left: 0 }, maxWidth: s.maxWidth, maxHeight: s.maxHeight }, c.onResizeStart = c.onResizeStart.bind(c), c.onResize = c.onResize.bind(c), c.onResizeStop = c.onResizeStop.bind(c), c.onDragStart = c.onDragStart.bind(c), c.onDrag = c.onDrag.bind(c), c.onDragStop = c.onDragStop.bind(c), c.getMaxSizesFromProps = c.getMaxSizesFromProps.bind(c), c;
          }
          return (function(s, c) {
            function g() {
              this.constructor = s;
            }
            Zr(s, c), s.prototype = c === null ? Object.create(c) : (g.prototype = c.prototype, new g());
          })(o, l), o.prototype.componentDidMount = function() {
            this.updateOffsetFromParent();
            var s = this.offsetFromParent, c = s.left, g = s.top, y = this.getDraggablePosition(), x = y.x, z = y.y;
            this.draggable.setState({ x: x - c, y: z - g }), this.forceUpdate();
          }, o.prototype.getDraggablePosition = function() {
            var s = this.draggable.state;
            return { x: s.x, y: s.y };
          }, o.prototype.getParent = function() {
            return this.resizable && this.resizable.parentNode;
          }, o.prototype.getParentSize = function() {
            return this.resizable.getParentSize();
          }, o.prototype.getMaxSizesFromProps = function() {
            return { maxWidth: this.props.maxWidth === void 0 ? Number.MAX_SAFE_INTEGER : this.props.maxWidth, maxHeight: this.props.maxHeight === void 0 ? Number.MAX_SAFE_INTEGER : this.props.maxHeight };
          }, o.prototype.getSelfElement = function() {
            return this.resizable && this.resizable.resizable;
          }, o.prototype.getOffsetHeight = function(s) {
            var c = this.props.scale;
            switch (this.props.bounds) {
              case "window":
                return window.innerHeight / c;
              case "body":
                return document.body.offsetHeight / c;
              default:
                return s.offsetHeight;
            }
          }, o.prototype.getOffsetWidth = function(s) {
            var c = this.props.scale;
            switch (this.props.bounds) {
              case "window":
                return window.innerWidth / c;
              case "body":
                return document.body.offsetWidth / c;
              default:
                return s.offsetWidth;
            }
          }, o.prototype.onDragStart = function(s, c) {
            if (this.props.onDragStart && this.props.onDragStart(s, c), this.props.bounds) {
              var g, y = this.getParent(), x = this.props.scale;
              if (this.props.bounds === "parent") g = y;
              else {
                if (this.props.bounds === "body") {
                  var z = y.getBoundingClientRect(), K = z.left, Y = z.top, ie = document.body.getBoundingClientRect(), ue = -(K - y.offsetLeft * x - ie.left) / x, he = -(Y - y.offsetTop * x - ie.top) / x, de = (document.body.offsetWidth - this.resizable.size.width * x) / x + ue, Oe = (document.body.offsetHeight - this.resizable.size.height * x) / x + he;
                  return this.setState({ bounds: { top: he, right: de, bottom: Oe, left: ue } });
                }
                if (this.props.bounds === "window") {
                  if (!this.resizable) return;
                  var Ce = y.getBoundingClientRect(), ze = Ce.left, st = Ce.top, $e = -(ze - y.offsetLeft * x) / x, je = -(st - y.offsetTop * x) / x;
                  return de = (window.innerWidth - this.resizable.size.width * x) / x + $e, Oe = (window.innerHeight - this.resizable.size.height * x) / x + je, this.setState({ bounds: { top: je, right: de, bottom: Oe, left: $e } });
                }
                g = document.querySelector(this.props.bounds);
              }
              if (g instanceof HTMLElement && y instanceof HTMLElement) {
                var dt = g.getBoundingClientRect(), vt = dt.left, $t = dt.top, xt = y.getBoundingClientRect(), Rt = (vt - xt.left) / x, St = $t - xt.top;
                if (this.resizable) {
                  this.updateOffsetFromParent();
                  var mt = this.offsetFromParent;
                  this.setState({ bounds: { top: St - mt.top, right: Rt + (g.offsetWidth - this.resizable.size.width) - mt.left / x, bottom: St + (g.offsetHeight - this.resizable.size.height) - mt.top, left: Rt - mt.left / x } });
                }
              }
            }
          }, o.prototype.onDrag = function(s, c) {
            if (this.props.onDrag) {
              var g = this.offsetFromParent;
              return this.props.onDrag(s, Zt(Zt({}, c), { x: c.x - g.left, y: c.y - g.top }));
            }
          }, o.prototype.onDragStop = function(s, c) {
            if (this.props.onDragStop) {
              var g = this.offsetFromParent, y = g.left, x = g.top;
              return this.props.onDragStop(s, Zt(Zt({}, c), { x: c.x + y, y: c.y + x }));
            }
          }, o.prototype.onResizeStart = function(s, c, g) {
            s.stopPropagation(), this.resizing = !0;
            var y = this.props.scale, x = this.offsetFromParent, z = this.getDraggablePosition();
            if (this.resizingPosition = { x: z.x + x.left, y: z.y + x.top }, this.setState({ original: z }), this.props.bounds) {
              var K = this.getParent(), Y = void 0;
              Y = this.props.bounds === "parent" ? K : this.props.bounds === "body" ? document.body : this.props.bounds === "window" ? window : document.querySelector(this.props.bounds);
              var ie = this.getSelfElement();
              if (ie instanceof Element && (Y instanceof HTMLElement || Y === window) && K instanceof HTMLElement) {
                var ue = this.getMaxSizesFromProps(), he = ue.maxWidth, de = ue.maxHeight, Oe = this.getParentSize();
                if (he && typeof he == "string") if (he.endsWith("%")) {
                  var Ce = Number(he.replace("%", "")) / 100;
                  he = Oe.width * Ce;
                } else he.endsWith("px") && (he = Number(he.replace("px", "")));
                de && typeof de == "string" && (de.endsWith("%") ? (Ce = Number(de.replace("%", "")) / 100, de = Oe.width * Ce) : de.endsWith("px") && (de = Number(de.replace("px", ""))));
                var ze = ie.getBoundingClientRect(), st = ze.left, $e = ze.top, je = this.props.bounds === "window" ? { left: 0, top: 0 } : Y.getBoundingClientRect(), dt = je.left, vt = je.top, $t = this.getOffsetWidth(Y), xt = this.getOffsetHeight(Y), Rt = c.toLowerCase().endsWith("left"), St = c.toLowerCase().endsWith("right"), mt = c.startsWith("top"), En = c.startsWith("bottom");
                if (Rt && this.resizable) {
                  var it = (st - dt) / y + this.resizable.size.width;
                  this.setState({ maxWidth: it > Number(he) ? he : it });
                }
                (St || this.props.lockAspectRatio && !Rt) && (it = $t + (dt - st) / y, this.setState({ maxWidth: it > Number(he) ? he : it })), mt && this.resizable && (it = ($e - vt) / y + this.resizable.size.height, this.setState({ maxHeight: it > Number(de) ? de : it })), (En || this.props.lockAspectRatio && !mt) && (it = xt + (vt - $e) / y, this.setState({ maxHeight: it > Number(de) ? de : it }));
              }
            } else this.setState({ maxWidth: this.props.maxWidth, maxHeight: this.props.maxHeight });
            this.props.onResizeStart && this.props.onResizeStart(s, c, g);
          }, o.prototype.onResize = function(s, c, g, y) {
            var x = { x: this.state.original.x, y: this.state.original.y }, z = -y.width, K = -y.height;
            ["top", "left", "topLeft", "bottomLeft", "topRight"].indexOf(c) !== -1 && (c === "bottomLeft" ? x.x += z : (c === "topRight" || (x.x += z), x.y += K)), x.x === this.draggable.state.x && x.y === this.draggable.state.y || this.draggable.setState(x), this.updateOffsetFromParent();
            var Y = this.offsetFromParent, ie = this.getDraggablePosition().x + Y.left, ue = this.getDraggablePosition().y + Y.top;
            this.resizingPosition = { x: ie, y: ue }, this.props.onResize && this.props.onResize(s, c, g, y, { x: ie, y: ue });
          }, o.prototype.onResizeStop = function(s, c, g, y) {
            this.resizing = !1;
            var x = this.getMaxSizesFromProps(), z = x.maxWidth, K = x.maxHeight;
            this.setState({ maxWidth: z, maxHeight: K }), this.props.onResizeStop && this.props.onResizeStop(s, c, g, y, this.resizingPosition);
          }, o.prototype.updateSize = function(s) {
            this.resizable && this.resizable.updateSize({ width: s.width, height: s.height });
          }, o.prototype.updatePosition = function(s) {
            this.draggable.setState(s);
          }, o.prototype.updateOffsetFromParent = function() {
            var s = this.props.scale, c = this.getParent(), g = this.getSelfElement();
            if (!c || g === null) return { top: 0, left: 0 };
            var y = c.getBoundingClientRect(), x = y.left, z = y.top, K = g.getBoundingClientRect(), Y = this.getDraggablePosition();
            this.offsetFromParent = { left: K.left - x - Y.x * s, top: K.top - z - Y.y * s };
          }, o.prototype.render = function() {
            var s = this.props, c = s.disableDragging, g = s.style, y = s.dragHandleClassName, x = s.position, z = s.onMouseDown, K = s.onMouseUp, Y = s.dragAxis, ie = s.dragGrid, ue = s.bounds, he = s.enableUserSelectHack, de = s.cancel, Oe = s.children, Ce = (s.onResizeStart, s.onResize, s.onResizeStop, s.onDragStart, s.onDrag, s.onDragStop, s.resizeHandleStyles), ze = s.resizeHandleClasses, st = s.resizeHandleComponent, $e = s.enableResizing, je = s.resizeGrid, dt = s.resizeHandleWrapperClass, vt = s.resizeHandleWrapperStyle, $t = s.scale, xt = s.allowAnyClick, Rt = (function(qt, cn) {
              var Nt = {};
              for (var Ft in qt) Object.prototype.hasOwnProperty.call(qt, Ft) && cn.indexOf(Ft) < 0 && (Nt[Ft] = qt[Ft]);
              if (qt != null && typeof Object.getOwnPropertySymbols == "function") {
                var un = 0;
                for (Ft = Object.getOwnPropertySymbols(qt); un < Ft.length; un++) cn.indexOf(Ft[un]) < 0 && Object.prototype.propertyIsEnumerable.call(qt, Ft[un]) && (Nt[Ft[un]] = qt[Ft[un]]);
              }
              return Nt;
            })(s, ["disableDragging", "style", "dragHandleClassName", "position", "onMouseDown", "onMouseUp", "dragAxis", "dragGrid", "bounds", "enableUserSelectHack", "cancel", "children", "onResizeStart", "onResize", "onResizeStop", "onDragStart", "onDrag", "onDragStop", "resizeHandleStyles", "resizeHandleClasses", "resizeHandleComponent", "enableResizing", "resizeGrid", "resizeHandleWrapperClass", "resizeHandleWrapperStyle", "scale", "allowAnyClick"]), St = this.props.default ? Zt({}, this.props.default) : void 0;
            delete Rt.default;
            var mt, En = c || y ? { cursor: "auto" } : { cursor: "move" }, it = Zt(Zt(Zt({}, oa), En), g), xn = this.offsetFromParent, jn = xn.left, so = xn.top;
            x && (mt = { x: x.x - jn, y: x.y - so });
            var Wt, Jt = this.resizing ? void 0 : mt, en = this.resizing ? "both" : Y;
            return (0, i.createElement)(ra, { ref: this.refDraggable, handle: y ? "." + y : void 0, defaultPosition: St, onMouseDown: z, onMouseUp: K, onStart: this.onDragStart, onDrag: this.onDrag, onStop: this.onDragStop, axis: en, disabled: c, grid: ie, bounds: ue ? this.state.bounds : void 0, position: Jt, enableUserSelectHack: he, cancel: de, scale: $t, allowAnyClick: xt, nodeRef: this.resizableElement }, (0, i.createElement)(Gn, Zt({}, Rt, { ref: this.refResizable, defaultSize: St, size: this.props.size, enable: typeof $e == "boolean" ? (Wt = $e, { bottom: Wt, bottomLeft: Wt, bottomRight: Wt, left: Wt, right: Wt, top: Wt, topLeft: Wt, topRight: Wt }) : $e, onResizeStart: this.onResizeStart, onResize: this.onResize, onResizeStop: this.onResizeStop, style: it, minWidth: this.props.minWidth, minHeight: this.props.minHeight, maxWidth: this.resizing ? this.state.maxWidth : this.props.maxWidth, maxHeight: this.resizing ? this.state.maxHeight : this.props.maxHeight, grid: je, handleWrapperClass: dt, handleWrapperStyle: vt, lockAspectRatio: this.props.lockAspectRatio, lockAspectRatioExtraWidth: this.props.lockAspectRatioExtraWidth, lockAspectRatioExtraHeight: this.props.lockAspectRatioExtraHeight, handleStyles: Ce, handleClasses: ze, handleComponent: st, scale: this.props.scale }), Oe));
          }, o.defaultProps = { maxWidth: Number.MAX_SAFE_INTEGER, maxHeight: Number.MAX_SAFE_INTEGER, scale: 1, onResizeStart: function() {
          }, onResize: function() {
          }, onResizeStop: function() {
          }, onDragStart: function() {
          }, onDrag: function() {
          }, onDragStop: function() {
          } }, o;
        })(i.PureComponent);
        O(1256);
        class ia extends i.Component {
          constructor(o) {
            super(o), this.handleTabClick = this.handleTabClick.bind(this);
          }
          handleTabClick(o) {
            this.setState({ activeTab: o }, () => {
              this.props.onClick(o);
            });
          }
          render() {
            return i.createElement("div", { className: "ck-inspector-horizontal-nav" }, this.props.definitions.map((o) => i.createElement(Ci, { key: o, label: o, isActive: this.props.activeTab === o, onClick: () => this.handleTabClick(o) })));
          }
        }
        class Ci extends i.Component {
          render() {
            return i.createElement("button", { className: ["ck-inspector-horizontal-nav__item", this.props.isActive ? " ck-inspector-horizontal-nav__item_active" : ""].join(" "), key: this.props.label, onClick: this.props.onClick, type: "button" }, this.props.label);
          }
        }
        O(1197);
        class Jr extends i.Component {
          render() {
            const o = Array.isArray(this.props.children) ? this.props.children : [this.props.children];
            return i.createElement("div", { className: "ck-inspector-navbox" }, o.length > 1 ? i.createElement("div", { className: "ck-inspector-navbox__navigation" }, o[0]) : "", i.createElement("div", { className: "ck-inspector-navbox__content" }, o[o.length - 1]));
          }
        }
        class eo extends i.Component {
          constructor(o) {
            super(o), this.handleTabClick = this.handleTabClick.bind(this);
          }
          handleTabClick(o) {
            this.props.onTabChange(o);
          }
          render() {
            const o = Array.isArray(this.props.children) ? this.props.children : [this.props.children];
            return i.createElement(Jr, null, [this.props.contentBefore, i.createElement(ia, { key: "navigation", definitions: o.map((s) => s.props.label), activeTab: this.props.activeTab, onClick: this.handleTabClick }), this.props.contentAfter], o.filter((s) => s.props.label === this.props.activeTab));
          }
        }
        var Ti = O(8142), yr = O.n(Ti);
        class Do extends i.Component {
          render() {
            return [i.createElement("label", { htmlFor: this.props.id, key: "label" }, this.props.label, ":"), i.createElement("select", { id: this.props.id, value: this.props.value, onChange: this.props.onChange, key: "select" }, this.props.options.map((o) => i.createElement("option", { value: o, key: o }, o)))];
          }
          shouldComponentUpdate(o) {
            return !yr()(this.props, o);
          }
        }
        O(5627);
        class Et extends i.PureComponent {
          render() {
            const o = ["ck-inspector-button", this.props.className || "", this.props.isOn ? "ck-inspector-button_on" : "", this.props.isEnabled === !1 ? "ck-inspector-button_disabled" : ""].filter((s) => s).join(" ");
            return i.createElement("button", { className: o, type: "button", onClick: this.props.isEnabled === !1 ? () => {
            } : this.props.onClick, title: this.props.title || this.props.text }, i.createElement("span", null, this.props.text), this.props.icon);
          }
        }
        O(7785);
        class Yt extends i.Component {
          render() {
            return i.createElement("div", { className: ["ck-inspector-pane", this.props.splitVertically ? "ck-inspector-pane_vsplit" : "", this.props.isEmpty ? "ck-inspector-pane_empty" : ""].join(" ") }, this.props.children);
          }
        }
        O(9936);
        const Oi = { position: "relative" };
        class Ni extends i.Component {
          get maxSidePaneWidth() {
            return Math.min(window.innerWidth - 400, 0.8 * window.innerWidth);
          }
          render() {
            return i.createElement("div", { className: "ck-inspector-side-pane" }, i.createElement(Si, { enableResizing: { left: !0 }, disableDragging: !0, minWidth: 200, maxWidth: this.maxSidePaneWidth, style: Oi, position: { x: "100%", y: "100%" }, size: { width: this.props.sidePaneWidth, height: "100%" }, onResizeStop: (o, s, c) => this.props.setSidePaneWidth(c.style.width) }, this.props.children));
          }
        }
        const ni = _e(({ ui: { sidePaneWidth: l } }) => ({ sidePaneWidth: l }), { setSidePaneWidth: function(l) {
          return { type: $n, newWidth: l };
        } })(Ni);
        class zr extends i.Component {
          constructor(o) {
            super(o), this.handleClick = this.handleClick.bind(this);
          }
          handleClick(o) {
            this.globalTreeProps.onClick(o, this.definition.node);
          }
          getChildren() {
            return this.definition.children.map((o, s) => to(o, s, this.props.globalTreeProps));
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
          shouldComponentUpdate(o) {
            return !yr()(this.props, o);
          }
        }
        class Pi extends i.PureComponent {
          render() {
            let o;
            const s = Kr(this.props.value, 500);
            return this.props.dontRenderValue || (o = i.createElement("span", { className: "ck-inspector-tree-node__attribute__value" }, s)), i.createElement("span", { className: "ck-inspector-tree-node__attribute" }, i.createElement("span", { className: "ck-inspector-tree-node__attribute__name", title: s }, this.props.name), o);
          }
        }
        class br extends i.Component {
          render() {
            const o = this.props.definition, s = { className: ["ck-inspector-tree__position", o.type === "selection" ? "ck-inspector-tree__position_selection" : "", o.type === "marker" ? "ck-inspector-tree__position_marker" : "", o.isEnd ? "ck-inspector-tree__position_end" : ""].join(" "), style: {} };
            return o.presentation && o.presentation.color && (s.style["--ck-inspector-color-tree-position"] = o.presentation.color), o.type === "marker" && (s["data-marker-name"] = o.name), i.createElement("span", s, "​");
          }
          shouldComponentUpdate(o) {
            return !yr()(this.props, o);
          }
        }
        class vr extends zr {
          render() {
            const o = this.definition, s = o.presentation, c = s && s.isEmpty, g = s && s.cssClass, y = this.getChildren(), x = ["ck-inspector-code", "ck-inspector-tree-node", this.isActive ? "ck-inspector-tree-node_active" : "", c ? "ck-inspector-tree-node_empty" : "", g], z = [], K = [];
            o.positionsBefore && o.positionsBefore.forEach((ie, ue) => {
              z.push(i.createElement(br, { key: "position-before:" + ue, definition: ie }));
            }), o.positionsAfter && o.positionsAfter.forEach((ie, ue) => {
              K.push(i.createElement(br, { key: "position-after:" + ue, definition: ie }));
            }), o.positions && o.positions.forEach((ie, ue) => {
              y.push(i.createElement(br, { key: "position" + ue, definition: ie }));
            });
            let Y = o.name;
            return this.globalTreeProps.showElementTypes && (Y = o.elementType + ":" + Y), i.createElement("div", { className: x.join(" "), onClick: this.handleClick }, z, i.createElement("span", { className: "ck-inspector-tree-node__name" }, i.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_open" }), Y, this.getAttributes(), c ? "" : i.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_close" })), i.createElement("div", { className: "ck-inspector-tree-node__content" }, y), c ? "" : i.createElement("span", { className: "ck-inspector-tree-node__name ck-inspector-tree-node__name_close" }, i.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_open" }), "/", Y, i.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_close" }), K));
          }
          getAttributes() {
            const o = [], s = this.definition;
            for (const [c, g] of s.attributes) o.push(i.createElement(Pi, { key: c, name: c, value: g }));
            return o;
          }
          shouldComponentUpdate(o) {
            return !yr()(this.props, o);
          }
        }
        class ri extends zr {
          render() {
            const o = this.definition, s = ["ck-inspector-tree-text", this.isActive ? "ck-inspector-tree-node_active" : ""].join(" ");
            let c = this.definition.text;
            o.positions && o.positions.length && (c = c.split(""), Array.from(o.positions).sort((y, x) => y.offset < x.offset ? -1 : y.offset === x.offset ? 0 : 1).reverse().forEach((y, x) => {
              c.splice(y.offset - o.startOffset, 0, i.createElement(br, { key: "position" + x, definition: y }));
            }));
            const g = [c];
            return o.positionsBefore && o.positionsBefore.length && o.positionsBefore.forEach((y, x) => {
              g.unshift(i.createElement(br, { key: "position-before:" + x, definition: y }));
            }), o.positionsAfter && o.positionsAfter.length && o.positionsAfter.forEach((y, x) => {
              g.push(i.createElement(br, { key: "position-after:" + x, definition: y }));
            }), i.createElement("span", { className: s, onClick: this.handleClick }, i.createElement("span", { className: "ck-inspector-tree-node__content" }, this.globalTreeProps.showCompactText ? "" : this.getAttributes(), this.globalTreeProps.showCompactText ? "" : '"', g, this.globalTreeProps.showCompactText ? "" : '"'));
          }
          getAttributes() {
            const o = [], s = this.definition, c = s.presentation, g = c && c.dontRenderAttributeValue;
            for (const [y, x] of s.attributes) o.push(i.createElement(Pi, { key: y, name: y, value: x, dontRenderValue: g }));
            return i.createElement("span", { className: "ck-inspector-tree-text__attributes" }, o);
          }
          shouldComponentUpdate(o) {
            return !yr()(this.props, o);
          }
        }
        class Ro extends i.Component {
          render() {
            return i.createElement("span", { className: "ck-inspector-tree-comment", dangerouslySetInnerHTML: { __html: this.props.definition.text } });
          }
        }
        function to(l, o, s) {
          return l.type === "element" ? i.createElement(vr, { key: o, definition: l, globalTreeProps: s }) : l.type === "text" ? i.createElement(ri, { key: o, definition: l, globalTreeProps: s }) : l.type === "comment" ? i.createElement(Ro, { key: o, definition: l }) : void 0;
        }
        O(2584);
        class kr extends i.Component {
          render() {
            let o;
            return o = this.props.definition ? this.props.definition.map((s, c) => to(s, c, { onClick: this.props.onClick, showCompactText: this.props.showCompactText, showElementTypes: this.props.showElementTypes, activeNode: this.props.activeNode })) : "Nothing to show.", i.createElement("div", { className: ["ck-inspector-tree", ...this.props.className || [], this.props.textDirection ? "ck-inspector-tree_text-direction_" + this.props.textDirection : "", this.props.showCompactText ? "ck-inspector-tree_compact-text" : ""].join(" ") }, o);
          }
        }
        O(3780);
        class Zn extends i.PureComponent {
          render() {
            return [i.createElement("input", { type: "checkbox", className: "ck-inspector-checkbox", id: this.props.id, key: "input", checked: this.props.isChecked, onChange: this.props.onChange }), i.createElement("label", { htmlFor: this.props.id, key: "label" }, this.props.label)];
          }
        }
        class Di extends i.Component {
          constructor(o) {
            super(o), this.handleTreeClick = this.handleTreeClick.bind(this), this.handleRootChange = this.handleRootChange.bind(this);
          }
          handleTreeClick(o, s) {
            o.persist(), o.stopPropagation(), this.props.setModelCurrentNode(s), o.detail === 2 && this.props.setModelActiveTab("Inspect");
          }
          handleRootChange(o) {
            this.props.setModelCurrentRootName(o.target.value);
          }
          render() {
            const o = this.props.editors.get(this.props.currentEditorName);
            return i.createElement(Jr, null, [i.createElement("div", { className: "ck-inspector-tree__config", key: "root-cfg" }, i.createElement(Do, { id: "view-root-select", label: "Root", value: this.props.currentRootName, options: Nr(o).map((s) => s.rootName), onChange: this.handleRootChange })), i.createElement("span", { className: "ck-inspector-separator", key: "separator" }), i.createElement("div", { className: "ck-inspector-tree__config", key: "text-cfg" }, i.createElement(Zn, { label: "Compact text", id: "model-compact-text", isChecked: this.props.showCompactText, onChange: this.props.toggleModelShowCompactText }), i.createElement(Zn, { label: "Show markers", id: "model-show-markers", isChecked: this.props.showMarkers, onChange: this.props.toggleModelShowMarkers }))], i.createElement(kr, { className: [this.props.showMarkers ? "" : "ck-inspector-model-tree__hide-markers"], definition: this.props.treeDefinition, textDirection: o.locale.contentLanguageDirection, onClick: this.handleTreeClick, showCompactText: this.props.showCompactText, activeNode: this.props.currentNode }));
          }
        }
        const Jn = _e(({ editors: l, currentEditorName: o, model: { treeDefinition: s, currentRootName: c, currentNode: g, ui: { showMarkers: y, showCompactText: x } } }) => ({ treeDefinition: s, editors: l, currentEditorName: o, currentRootName: c, currentNode: g, showMarkers: y, showCompactText: x }), { toggleModelShowCompactText: function() {
          return { type: Dt };
        }, setModelCurrentRootName: function(l) {
          return { type: Qe, currentRootName: l };
        }, toggleModelShowMarkers: function() {
          return { type: ko };
        }, setModelCurrentNode: function(l) {
          return { type: et, currentNode: l };
        }, setModelActiveTab: On })(Di);
        O(7024);
        class oi extends i.Component {
          render() {
            const o = this.props.presentation && this.props.presentation.expandCollapsibles, s = [];
            for (const c in this.props.itemDefinitions) {
              const g = this.props.itemDefinitions[c], { subProperties: y, presentation: x = {} } = g, z = y && Object.keys(y).length, K = Kr(String(g.value), 2e3), Y = [i.createElement(aa, { key: `${this.props.name}-${c}-name`, name: c, listUid: this.props.name, canCollapse: z, colorBox: x.colorBox, expandCollapsibles: o, onClick: this.props.onPropertyTitleClick, title: g.title }), i.createElement("dd", { key: `${this.props.name}-${c}-value` }, i.createElement("input", { id: `${this.props.name}-${c}-value-input`, type: "text", value: K, readOnly: !0 }))];
              z && Y.push(i.createElement(oi, { name: `${this.props.name}-${c}`, key: `${this.props.name}-${c}`, itemDefinitions: y, presentation: this.props.presentation })), s.push(Y);
            }
            return i.createElement("dl", { className: "ck-inspector-property-list ck-inspector-code" }, s);
          }
          shouldComponentUpdate(o) {
            return !yr()(this.props, o);
          }
        }
        class aa extends i.PureComponent {
          constructor(o) {
            super(o), this.state = { isCollapsed: !this.props.expandCollapsibles }, this.handleCollapsedChange = this.handleCollapsedChange.bind(this);
          }
          handleCollapsedChange() {
            this.setState({ isCollapsed: !this.state.isCollapsed });
          }
          render() {
            const o = ["ck-inspector-property-list__title"];
            let s, c;
            return this.props.canCollapse && (o.push("ck-inspector-property-list__title_collapsible"), o.push("ck-inspector-property-list__title_" + (this.state.isCollapsed ? "collapsed" : "expanded")), s = i.createElement("button", { type: "button", onClick: this.handleCollapsedChange }, "Toggle")), this.props.colorBox && (c = i.createElement("span", { className: "ck-inspector-property-list__title__color-box", style: { background: this.props.colorBox } })), this.props.onClick && o.push("ck-inspector-property-list__title_clickable"), i.createElement("dt", { className: o.join(" ").trim() }, s, c, i.createElement("label", { htmlFor: `${this.props.listUid}-${this.props.name}-value-input`, onClick: this.props.onClick ? () => this.props.onClick(this.props.name) : null, title: this.props.title }, this.props.name), ":");
          }
        }
        O(8967);
        function Ri() {
          return Ri = Object.assign ? Object.assign.bind() : function(l) {
            for (var o = 1; o < arguments.length; o++) {
              var s = arguments[o];
              for (var c in s) ({}).hasOwnProperty.call(s, c) && (l[c] = s[c]);
            }
            return l;
          }, Ri.apply(null, arguments);
        }
        class er extends i.PureComponent {
          render() {
            const o = [];
            for (const s of this.props.lists) Object.keys(s.itemDefinitions).length && o.push(i.createElement("hr", { key: `${s.name}-separator` }), i.createElement("h3", { key: `${s.name}-header` }, i.createElement("a", { href: s.url, target: "_blank", rel: "noopener noreferrer" }, s.name), s.buttons && s.buttons.map((c, g) => i.createElement(Et, Ri({ key: "button" + g }, c)))), i.createElement(oi, { key: `${s.name}-list`, name: s.name, itemDefinitions: s.itemDefinitions, presentation: s.presentation, onPropertyTitleClick: s.onPropertyTitleClick }));
            return i.createElement("div", { className: "ck-inspector__object-inspector" }, i.createElement("h2", { className: "ck-inspector-code" }, this.props.header), o);
          }
        }
        function Mi() {
          return Mi = Object.assign ? Object.assign.bind() : function(l) {
            for (var o = 1; o < arguments.length; o++) {
              var s = arguments[o];
              for (var c in s) ({}).hasOwnProperty.call(s, c) && (l[c] = s[c]);
            }
            return l;
          }, Mi.apply(null, arguments);
        }
        const Ht = ({ styles: l = {}, ...o }) => i.createElement("svg", Mi({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, o), i.createElement("path", { d: "M17 15.75a.75.75 0 01.102 1.493L17 17.25H9a.75.75 0 01-.102-1.493L9 15.75h8zM2.156 2.947l.095.058 7.58 5.401a.75.75 0 01.084 1.152l-.083.069-7.58 5.425a.75.75 0 01-.958-1.148l.086-.071 6.724-4.815-6.723-4.792a.75.75 0 01-.233-.95l.057-.096a.75.75 0 01.951-.233z" }));
        function tr() {
          return tr = Object.assign ? Object.assign.bind() : function(l) {
            for (var o = 1; o < arguments.length; o++) {
              var s = arguments[o];
              for (var c in s) ({}).hasOwnProperty.call(s, c) && (l[c] = s[c]);
            }
            return l;
          }, tr.apply(null, arguments);
        }
        const Ii = ({ styles: l = {}, ...o }) => i.createElement("svg", tr({ fill: "none", xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 19 19" }, o), i.createElement("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M6 1a1 1 0 011-1h5a1 1 0 011 1v5a1 1 0 01-1 1h-2v2h5a1 1 0 011 1v3h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3a1 1 0 011-1h1v-2.5a.5.5 0 00-.5-.5H10v3h1a1 1 0 011 1v3a1 1 0 01-1 1H8a1 1 0 01-1-1v-3a1 1 0 011-1h1v-3H4.5a.5.5 0 00-.5.5V13h1a1 1 0 011 1v3a1 1 0 01-1 1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1v-3a1 1 0 011-1h5V7H7a1 1 0 01-1-1V1zm1.5 4.5v-4h4v4h-4zm-5 11v-2h2v2h-2zm6-2v2h2v-2h-2zm6 2v-2h2v2h-2z", fill: "#000" }));
        class ii extends i.Component {
          constructor(o) {
            super(o), this.handleNodeLogButtonClick = this.handleNodeLogButtonClick.bind(this), this.handleNodeSchemaButtonClick = this.handleNodeSchemaButtonClick.bind(this);
          }
          handleNodeLogButtonClick() {
            Ye.log(this.props.currentNodeDefinition.editorNode);
          }
          handleNodeSchemaButtonClick() {
            const o = this.props.editors.get(this.props.currentEditorName).model.schema.getDefinition(this.props.currentNodeDefinition.editorNode);
            this.props.setActiveTab("Schema"), this.props.setSchemaCurrentDefinitionName(o.name);
          }
          render() {
            const o = this.props.currentNodeDefinition;
            return o ? i.createElement(er, { header: [i.createElement("span", { key: "link" }, i.createElement("a", { href: o.url, target: "_blank", rel: "noopener noreferrer" }, i.createElement("b", null, o.type)), ":", o.type === "Text" ? i.createElement("em", null, o.name) : o.name), i.createElement(Et, { key: "log", icon: i.createElement(Ht, null), text: "Log in console", onClick: this.handleNodeLogButtonClick }), i.createElement(Et, { key: "schema", icon: i.createElement(Ii, null), text: "Show in schema", onClick: this.handleNodeSchemaButtonClick })], lists: [{ name: "Attributes", url: o.url, itemDefinitions: o.attributes }, { name: "Properties", url: o.url, itemDefinitions: o.properties }] }) : i.createElement(Yt, { isEmpty: "true" }, i.createElement("p", null, "Select a node in the tree to inspect"));
          }
        }
        const sa = _e(({ editors: l, currentEditorName: o, model: { currentNodeDefinition: s } }) => ({ editors: l, currentEditorName: o, currentNodeDefinition: s }), { setActiveTab: Eo, setSchemaCurrentDefinitionName: Xr })(ii);
        function no() {
          return no = Object.assign ? Object.assign.bind() : function(l) {
            for (var o = 1; o < arguments.length; o++) {
              var s = arguments[o];
              for (var c in s) ({}).hasOwnProperty.call(s, c) && (l[c] = s[c]);
            }
            return l;
          }, no.apply(null, arguments);
        }
        const Mo = ({ styles: l = {}, ...o }) => i.createElement("svg", no({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, o), i.createElement("path", { d: "M9.5 4.5c1.85 0 3.667.561 5.199 1.519C16.363 7.059 17.5 8.4 17.5 9.5s-1.137 2.441-2.801 3.481c-1.532.958-3.35 1.519-5.199 1.519-1.85 0-3.667-.561-5.199-1.519C2.637 11.941 1.5 10.6 1.5 9.5s1.137-2.441 2.801-3.481C5.833 5.06 7.651 4.5 9.5 4.5zm0 1a4 4 0 11-.2.005l.2-.005c-1.655 0-3.29.505-4.669 1.367C3.431 7.742 2.5 8.84 2.5 9.5c0 .66.931 1.758 2.331 2.633C6.21 12.995 7.845 13.5 9.5 13.5c1.655 0 3.29-.505 4.669-1.367 1.4-.875 2.331-1.974 2.331-2.633 0-.66-.931-1.758-2.331-2.633C12.79 6.005 11.155 5.5 9.5 5.5zM8 6.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" })), Ot = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_selection-Selection.html";
        class ls extends i.Component {
          constructor(o) {
            super(o), this.handleSelectionLogButtonClick = this.handleSelectionLogButtonClick.bind(this), this.handleScrollToSelectionButtonClick = this.handleScrollToSelectionButtonClick.bind(this);
          }
          handleSelectionLogButtonClick() {
            const o = this.props.editor;
            Ye.log(o.model.document.selection);
          }
          handleScrollToSelectionButtonClick() {
            const o = document.querySelector(".ck-inspector-tree__position.ck-inspector-tree__position_selection");
            o && o.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          render() {
            const o = this.props.editor, s = this.props.info;
            return i.createElement(er, { header: [i.createElement("span", { key: "link" }, i.createElement("a", { href: Ot, target: "_blank", rel: "noopener noreferrer" }, i.createElement("b", null, "Selection"))), i.createElement(Et, { key: "log", icon: i.createElement(Ht, null), text: "Log in console", onClick: this.handleSelectionLogButtonClick }), i.createElement(Et, { key: "scroll", icon: i.createElement(Mo, null), text: "Scroll to selection", onClick: this.handleScrollToSelectionButtonClick })], lists: [{ name: "Attributes", url: `${Ot}#function-getAttributes`, itemDefinitions: s.attributes }, { name: "Properties", url: `${Ot}`, itemDefinitions: s.properties }, { name: "Anchor", url: `${Ot}#member-anchor`, buttons: [{ icon: i.createElement(Ht, null), text: "Log in console", onClick: () => Ye.log(o.model.document.selection.anchor) }], itemDefinitions: s.anchor }, { name: "Focus", url: `${Ot}#member-focus`, buttons: [{ icon: i.createElement(Ht, null), text: "Log in console", onClick: () => Ye.log(o.model.document.selection.focus) }], itemDefinitions: s.focus }, { name: "Ranges", url: `${Ot}#function-getRanges`, buttons: [{ icon: i.createElement(Ht, null), text: "Log in console", onClick: () => Ye.log(...o.model.document.selection.getRanges()) }], itemDefinitions: s.ranges, presentation: { expandCollapsibles: !0 } }] });
          }
        }
        const cs = _e(({ editors: l, currentEditorName: o, model: { ranges: s } }) => {
          const c = l.get(o), g = (function(y, x) {
            const z = y.model.document.selection, K = z.anchor, Y = z.focus, ie = { properties: { isCollapsed: { value: z.isCollapsed }, isBackward: { value: z.isBackward }, isGravityOverridden: { value: z.isGravityOverridden }, rangeCount: { value: z.rangeCount } }, attributes: {}, anchor: Io(zt(K)), focus: Io(zt(Y)), ranges: {} };
            for (const [ue, he] of z.getAttributes()) ie.attributes[ue] = { value: he };
            x.forEach((ue, he) => {
              ie.ranges[he] = { value: "", subProperties: { start: { value: "", subProperties: pt(Io(ue.start)) }, end: { value: "", subProperties: pt(Io(ue.end)) } } };
            });
            for (const ue in ie) ue !== "ranges" && (ie[ue] = pt(ie[ue]));
            return ie;
          })(c, s);
          return { editor: c, currentEditorName: o, info: g };
        }, {})(ls);
        function Io({ path: l, stickiness: o, index: s, isAtEnd: c, isAtStart: g, offset: y, textNode: x }) {
          return { path: { value: l }, stickiness: { value: o }, index: { value: s }, isAtEnd: { value: c }, isAtStart: { value: g }, offset: { value: y }, textNode: { value: x } };
        }
        class us extends i.Component {
          render() {
            const o = (function(g) {
              const y = {};
              for (const x of g) {
                const z = x.name.split(":");
                let K = y;
                for (const Y of z) {
                  const ie = Y === z[z.length - 1];
                  K = K[Y] ? K[Y] : K[Y] = ie ? x : {};
                }
              }
              return y;
            })(this.props.markers), s = la(o), c = this.props.editors.get(this.props.currentEditorName);
            return Object.keys(o).length ? i.createElement(er, { header: [i.createElement("span", { key: "link" }, i.createElement("a", { href: "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_markercollection-Marker.html", target: "_blank", rel: "noopener noreferrer" }, i.createElement("b", null, "Markers"))), i.createElement(Et, { key: "log", icon: i.createElement(Ht, null), text: "Log in console", onClick: () => Ye.log([...c.model.markers]) })], lists: [{ name: "Markers tree", itemDefinitions: s, presentation: { expandCollapsibles: !0 } }] }) : i.createElement(Yt, { isEmpty: "true" }, i.createElement("p", null, "No markers in the document."));
          }
        }
        const ds = _e(({ editors: l, currentEditorName: o, model: { markers: s } }) => ({ editors: l, currentEditorName: o, markers: s }), {})(us);
        function la(l) {
          const o = {};
          for (const s in l) {
            const c = l[s];
            if (c.name) {
              const g = pt(zi(c));
              o[s] = { value: "", presentation: { colorBox: c.presentation.color }, subProperties: g };
            } else {
              const g = Object.keys(c).length;
              o[s] = { value: g + " marker" + (g > 1 ? "s" : ""), subProperties: la(c) };
            }
          }
          return o;
        }
        function zi({ name: l, start: o, end: s, affectsData: c, managedUsingOperations: g }) {
          return { name: { value: l }, start: { value: o.path }, end: { value: s.path }, affectsData: { value: c }, managedUsingOperations: { value: g } };
        }
        O(6709);
        class zo extends i.Component {
          render() {
            return this.props.currentEditorName ? i.createElement(Yt, { splitVertically: "true" }, i.createElement(Jn, null), i.createElement(ni, null, i.createElement(eo, { onTabChange: this.props.setModelActiveTab, activeTab: this.props.activeTab }, i.createElement(sa, { label: "Inspect" }), i.createElement(cs, { label: "Selection" }), i.createElement(ds, { label: "Markers" })))) : i.createElement(Yt, { isEmpty: "true" }, i.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
          }
        }
        const ps = _e(({ currentEditorName: l, model: { ui: { activeTab: o } } }) => ({ currentEditorName: l, activeTab: o }), { setModelActiveTab: On })(zo);
        class ca extends i.Component {
          constructor(o) {
            super(o), this.handleTreeClick = this.handleTreeClick.bind(this), this.handleRootChange = this.handleRootChange.bind(this);
          }
          handleTreeClick(o, s) {
            o.persist(), o.stopPropagation(), this.props.setViewCurrentNode(s), o.detail === 2 && this.props.setViewActiveTab("Inspect");
          }
          handleRootChange(o) {
            this.props.setViewCurrentRootName(o.target.value);
          }
          render() {
            const o = this.props.editors.get(this.props.currentEditorName);
            return i.createElement(Jr, null, [i.createElement("div", { className: "ck-inspector-tree__config", key: "root-cfg" }, i.createElement(Do, { id: "view-root-select", label: "Root", value: this.props.currentRootName, options: In(o).map((s) => s.rootName), onChange: this.handleRootChange })), i.createElement("span", { className: "ck-inspector-separator", key: "separator" }), i.createElement("div", { className: "ck-inspector-tree__config", key: "types-cfg" }, i.createElement(Zn, { label: "Show element types", id: "view-show-types", isChecked: this.props.showElementTypes, onChange: this.props.toggleViewShowElementTypes }))], i.createElement(kr, { definition: this.props.treeDefinition, textDirection: o.locale.contentLanguageDirection, onClick: this.handleTreeClick, showCompactText: "true", showElementTypes: this.props.showElementTypes, activeNode: this.props.currentNode }));
          }
        }
        const ua = _e(({ editors: l, currentEditorName: o, view: { treeDefinition: s, currentRootName: c, currentNode: g, ui: { showElementTypes: y } } }) => ({ treeDefinition: s, editors: l, currentEditorName: o, currentRootName: c, currentNode: g, showElementTypes: y }), { setViewCurrentRootName: function(l) {
          return { type: Rr, currentRootName: l };
        }, toggleViewShowElementTypes: function() {
          return { type: be };
        }, setViewCurrentNode: function(l) {
          return { type: I, currentNode: l };
        }, setViewActiveTab: tt })(ca);
        class nr extends i.Component {
          constructor(o) {
            super(o), this.handleNodeLogButtonClick = this.handleNodeLogButtonClick.bind(this);
          }
          handleNodeLogButtonClick() {
            Ye.log(this.props.currentNodeDefinition.editorNode);
          }
          render() {
            const o = this.props.currentNodeDefinition;
            return o ? i.createElement(er, { header: [i.createElement("span", { key: "link" }, i.createElement("a", { href: o.url, target: "_blank", rel: "noopener noreferrer" }, i.createElement("b", null, o.type), ":"), o.type === "Text" ? i.createElement("em", null, o.name) : o.name), i.createElement(Et, { key: "log", icon: i.createElement(Ht, null), text: "Log in console", onClick: this.handleNodeLogButtonClick })], lists: [{ name: "Attributes", url: o.url, itemDefinitions: o.attributes }, { name: "Properties", url: o.url, itemDefinitions: o.properties }, { name: "Custom Properties", url: `${bt}_element-Element.html#function-getCustomProperty`, itemDefinitions: o.customProperties }] }) : i.createElement(Yt, { isEmpty: "true" }, i.createElement("p", null, "Select a node in the tree to inspect"));
          }
        }
        const da = _e(({ view: { currentNodeDefinition: l } }) => ({ currentNodeDefinition: l }), {})(nr), ro = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_view_selection-Selection.html";
        class pa extends i.Component {
          constructor(o) {
            super(o), this.handleSelectionLogButtonClick = this.handleSelectionLogButtonClick.bind(this), this.handleScrollToSelectionButtonClick = this.handleScrollToSelectionButtonClick.bind(this);
          }
          handleSelectionLogButtonClick() {
            const o = this.props.editor;
            Ye.log(o.editing.view.document.selection);
          }
          handleScrollToSelectionButtonClick() {
            const o = document.querySelector(".ck-inspector-tree__position.ck-inspector-tree__position_selection");
            o && o.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          render() {
            const o = this.props.editor, s = this.props.info;
            return i.createElement(er, { header: [i.createElement("span", { key: "link" }, i.createElement("a", { href: ro, target: "_blank", rel: "noopener noreferrer" }, i.createElement("b", null, "Selection"))), i.createElement(Et, { key: "log", icon: i.createElement(Ht, null), text: "Log in console", onClick: this.handleSelectionLogButtonClick }), i.createElement(Et, { key: "scroll", icon: i.createElement(Mo, null), text: "Scroll to selection", onClick: this.handleScrollToSelectionButtonClick })], lists: [{ name: "Properties", url: `${ro}`, itemDefinitions: s.properties }, { name: "Anchor", url: `${ro}#member-anchor`, buttons: [{ type: "log", text: "Log in console", onClick: () => Ye.log(o.editing.view.document.selection.anchor) }], itemDefinitions: s.anchor }, { name: "Focus", url: `${ro}#member-focus`, buttons: [{ type: "log", text: "Log in console", onClick: () => Ye.log(o.editing.view.document.selection.focus) }], itemDefinitions: s.focus }, { name: "Ranges", url: `${ro}#function-getRanges`, buttons: [{ type: "log", text: "Log in console", onClick: () => Ye.log(...o.editing.view.document.selection.getRanges()) }], itemDefinitions: s.ranges, presentation: { expandCollapsibles: !0 } }] });
          }
        }
        const oo = _e(({ editors: l, currentEditorName: o, view: { ranges: s } }) => {
          const c = l.get(o), g = (function(y, x) {
            const z = y.editing.view.document.selection, K = { properties: { isCollapsed: { value: z.isCollapsed }, isBackward: { value: z.isBackward }, isFake: { value: z.isFake }, rangeCount: { value: z.rangeCount } }, anchor: ai(jt(z.anchor)), focus: ai(jt(z.focus)), ranges: {} };
            x.forEach((Y, ie) => {
              K.ranges[ie] = { value: "", subProperties: { start: { value: "", subProperties: pt(ai(Y.start)) }, end: { value: "", subProperties: pt(ai(Y.end)) } } };
            });
            for (const Y in K) Y !== "ranges" && (K[Y] = pt(K[Y]));
            return K;
          })(c, s);
          return { editor: c, currentEditorName: o, info: g };
        }, {})(pa);
        function ai({ offset: l, isAtEnd: o, isAtStart: s, parent: c }) {
          return { offset: { value: l }, isAtEnd: { value: o }, isAtStart: { value: s }, parent: { value: c } };
        }
        class fs extends i.Component {
          render() {
            return this.props.currentEditorName ? i.createElement(Yt, { splitVertically: "true" }, i.createElement(ua, null), i.createElement(ni, null, i.createElement(eo, { onTabChange: this.props.setViewActiveTab, activeTab: this.props.activeTab }, i.createElement(da, { label: "Inspect" }), i.createElement(oo, { label: "Selection" })))) : i.createElement(Yt, { isEmpty: "true" }, i.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
          }
        }
        const fa = _e(({ currentEditorName: l, view: { ui: { activeTab: o } } }) => ({ currentEditorName: l, activeTab: o }), { setViewActiveTab: tt, updateViewState: Be })(fs);
        class ha extends i.Component {
          constructor(o) {
            super(o), this.handleTreeClick = this.handleTreeClick.bind(this);
          }
          handleTreeClick(o, s) {
            o.persist(), o.stopPropagation(), this.props.setCommandsCurrentCommandName(s);
          }
          render() {
            return i.createElement(Jr, null, i.createElement(kr, { definition: this.props.treeDefinition, onClick: this.handleTreeClick, activeNode: this.props.currentCommandName }));
          }
        }
        const ma = _e(({ commands: { treeDefinition: l, currentCommandName: o } }) => ({ treeDefinition: l, currentCommandName: o }), { setCommandsCurrentCommandName: function(l) {
          return { type: wt, currentCommandName: l };
        } })(ha);
        function io() {
          return io = Object.assign ? Object.assign.bind() : function(l) {
            for (var o = 1; o < arguments.length; o++) {
              var s = arguments[o];
              for (var c in s) ({}).hasOwnProperty.call(s, c) && (l[c] = s[c]);
            }
            return l;
          }, io.apply(null, arguments);
        }
        const Ao = ({ styles: l = {}, ...o }) => i.createElement("svg", io({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, o), i.createElement("path", { d: "M9.25 1.25a8 8 0 110 16 8 8 0 010-16zm0 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM7.344 6.485l4.98 2.765-4.98 3.018V6.485z" }));
        class hs extends i.Component {
          constructor(o) {
            super(o), this.handleCommandLogButtonClick = this.handleCommandLogButtonClick.bind(this), this.handleCommandExecuteButtonClick = this.handleCommandExecuteButtonClick.bind(this);
          }
          handleCommandLogButtonClick() {
            Ye.log(this.props.currentCommandDefinition.command);
          }
          handleCommandExecuteButtonClick() {
            this.props.editors.get(this.props.currentEditorName).execute(this.props.currentCommandName);
          }
          render() {
            const o = this.props.currentCommandDefinition;
            return o ? i.createElement(er, { header: [i.createElement("span", { key: "link" }, i.createElement("a", { href: o.url, target: "_blank", rel: "noopener noreferrer" }, i.createElement("b", null, o.type)), ":", this.props.currentCommandName), i.createElement(Et, { key: "exec", icon: i.createElement(Ao, null), text: "Execute command", onClick: this.handleCommandExecuteButtonClick }), i.createElement(Et, { key: "log", icon: i.createElement(Ht, null), text: "Log in console", onClick: this.handleCommandLogButtonClick })], lists: [{ name: "Properties", url: o.url, itemDefinitions: o.properties }] }) : i.createElement(Yt, { isEmpty: "true" }, i.createElement("p", null, "Select a command to inspect"));
          }
        }
        const si = _e(({ editors: l, currentEditorName: o, commands: { currentCommandName: s, currentCommandDefinition: c } }) => ({ editors: l, currentEditorName: o, currentCommandName: s, currentCommandDefinition: c }), {})(hs);
        class ms extends i.Component {
          render() {
            return this.props.currentEditorName ? i.createElement(Yt, { splitVertically: "true" }, i.createElement(ma, null), i.createElement(ni, null, i.createElement(eo, { activeTab: "Inspect" }, i.createElement(si, { label: "Inspect" })))) : i.createElement(Yt, { isEmpty: "true" }, i.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
          }
        }
        const Ai = _e(({ currentEditorName: l }) => ({ currentEditorName: l }), { updateCommandsState: Lt })(ms);
        class ga extends i.Component {
          constructor(o) {
            super(o), this.handleTreeClick = this.handleTreeClick.bind(this);
          }
          handleTreeClick(o, s) {
            o.persist(), o.stopPropagation(), this.props.setSchemaCurrentDefinitionName(s);
          }
          render() {
            return i.createElement(Jr, null, i.createElement(kr, { definition: this.props.treeDefinition, onClick: this.handleTreeClick, activeNode: this.props.currentSchemaDefinitionName }));
          }
        }
        const ya = _e(({ schema: { treeDefinition: l, currentSchemaDefinitionName: o } }) => ({ treeDefinition: l, currentSchemaDefinitionName: o }), { setSchemaCurrentDefinitionName: Xr })(ga);
        class gs extends i.Component {
          render() {
            const o = this.props.currentSchemaDefinition;
            return o ? i.createElement(er, { header: [i.createElement("span", { key: "link" }, i.createElement("a", { href: o.urls.general, target: "_blank", rel: "noopener noreferrer" }, i.createElement("b", null, o.type)), ":", this.props.currentSchemaDefinitionName)], lists: [{ name: "Properties", url: o.urls.general, itemDefinitions: o.properties }, { name: "Allowed attributes", url: o.urls.allowAttributes, itemDefinitions: o.allowAttributes }, { name: "Allowed children", url: o.urls.allowChildren, itemDefinitions: o.allowChildren, onPropertyTitleClick: (s) => {
              this.props.setSchemaCurrentDefinitionName(s);
            } }, { name: "Allowed in", url: o.urls.allowIn, itemDefinitions: o.allowIn, onPropertyTitleClick: (s) => {
              this.props.setSchemaCurrentDefinitionName(s);
            } }] }) : i.createElement(Yt, { isEmpty: "true" }, i.createElement("p", null, "Select a schema definition to inspect"));
          }
        }
        const ys = _e(({ editors: l, currentEditorName: o, schema: { currentSchemaDefinitionName: s, currentSchemaDefinition: c } }) => ({ editors: l, currentEditorName: o, currentSchemaDefinitionName: s, currentSchemaDefinition: c }), { setSchemaCurrentDefinitionName: Xr })(gs);
        class bs extends i.Component {
          render() {
            return this.props.currentEditorName ? i.createElement(Yt, { splitVertically: "true" }, i.createElement(ya, null), i.createElement(ni, null, i.createElement(eo, { activeTab: "Inspect" }, i.createElement(ys, { label: "Inspect" })))) : i.createElement(Yt, { isEmpty: "true" }, i.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
          }
        }
        const vs = _e(({ currentEditorName: l }) => ({ currentEditorName: l }))(bs);
        var ks = O(7965), jo = O.n(ks), ws = O(312), _s = O.n(ws);
        function Lo() {
          return Lo = Object.assign ? Object.assign.bind() : function(l) {
            for (var o = 1; o < arguments.length; o++) {
              var s = arguments[o];
              for (var c in s) ({}).hasOwnProperty.call(s, c) && (l[c] = s[c]);
            }
            return l;
          }, Lo.apply(null, arguments);
        }
        const ba = ({ styles: l = {}, ...o }) => i.createElement("svg", Lo({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, o), i.createElement("path", { d: "M12.936 0l5 4.5v12.502l-1.504-.001v.003h1.504v1.499h-5v-1.501l3.496-.001V5.208L12.21 1.516 3.436 1.5v15.504l3.5-.001v1.5h-5V0h11z" }), i.createElement("path", { d: "M10.374 9.463l.085.072.477.464L11 10v.06l3.545 3.453-1.047 1.075L11 12.155V19H9v-6.9l-2.424 2.476-1.072-1.05L9.4 9.547a.75.75 0 01.974-.084zM12.799 1.5l-.001 2.774h3.645v1.5h-5.144V1.5z" }));
        O(0);
        class va extends i.Component {
          constructor(o) {
            super(o), this.state = { isModalOpen: !1, editorDataValue: "" }, this.textarea = i.createRef();
          }
          render() {
            return [i.createElement(Et, { text: "Set editor data", icon: i.createElement(ba, null), isEnabled: !!this.props.editor, onClick: () => this.setState({ isModalOpen: !0 }), key: "button" }), i.createElement(_s(), { isOpen: this.state.isModalOpen, appElement: document.querySelector(".ck-inspector-wrapper"), onAfterOpen: this._handleModalAfterOpen.bind(this), overlayClassName: "ck-inspector-modal ck-inspector-quick-actions__set-data-modal", className: "ck-inspector-quick-actions__set-data-modal__content", onRequestClose: this._closeModal.bind(this), portalClassName: "ck-inspector-portal", shouldCloseOnEsc: !0, shouldCloseOnOverlayClick: !0, key: "modal" }, i.createElement("h2", null, "Set editor data"), i.createElement("textarea", { autoFocus: !0, ref: this.textarea, value: this.state.editorDataValue, placeholder: "Paste HTML here...", onChange: this._handlDataChange.bind(this), onKeyPress: (o) => {
              o.key == "Enter" && o.shiftKey && this._setEditorDataAndCloseModal();
            } }), i.createElement("div", { className: "ck-inspector-quick-actions__set-data-modal__buttons" }, i.createElement("button", { type: "button", onClick: () => {
              this.setState({ editorDataValue: this.props.editor.getData() }), this.textarea.current.focus();
            } }, "Load data"), i.createElement("button", { type: "button", title: "Cancel (Esc)", onClick: this._closeModal.bind(this) }, "Cancel"), i.createElement("button", { type: "button", title: "Set editor data (⇧+Enter)", onClick: this._setEditorDataAndCloseModal.bind(this) }, "Set data")))];
          }
          _setEditorDataAndCloseModal() {
            this.props.editor.setData(this.state.editorDataValue), this._closeModal();
          }
          _closeModal() {
            this.setState({ isModalOpen: !1 });
          }
          _handlDataChange(o) {
            this.setState({ editorDataValue: o.target.value });
          }
          _handleModalAfterOpen() {
            this.setState({ editorDataValue: this.props.editor.getData() }), this.textarea.current.select();
          }
        }
        function li() {
          return li = Object.assign ? Object.assign.bind() : function(l) {
            for (var o = 1; o < arguments.length; o++) {
              var s = arguments[o];
              for (var c in s) ({}).hasOwnProperty.call(s, c) && (l[c] = s[c]);
            }
            return l;
          }, li.apply(null, arguments);
        }
        const ka = ({ styles: l = {}, ...o }) => i.createElement("svg", li({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, o), i.createElement("path", { d: "M12.936 0l5 4.5v14.003h-4.503L14.936 17h-10l1.503 1.503H1.936V0h11zm-9.5 1.5v15.504h12.996V5.208L12.21 1.516 3.436 1.5z" }), i.createElement("path", { d: "M12.799 1.5l-.001 2.774h3.645v1.5h-5.144V1.5zM9.675 18.859l-.085-.072-4.086-3.978 1.047-1.075L9 16.119V9h2v7.273l2.473-2.526 1.072 1.049-3.896 3.979a.75.75 0 01-.974.084z" }));
        function Ar() {
          return Ar = Object.assign ? Object.assign.bind() : function(l) {
            for (var o = 1; o < arguments.length; o++) {
              var s = arguments[o];
              for (var c in s) ({}).hasOwnProperty.call(s, c) && (l[c] = s[c]);
            }
            return l;
          }, Ar.apply(null, arguments);
        }
        const wa = ({ styles: l = {}, ...o }) => i.createElement("svg", Ar({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, o), i.createElement("path", { d: "M3.144 15.748l2.002 1.402-1.976.516-.026-1.918zM2.438 3.391l15.346 11.023-.875 1.218-5.202-3.736-2.877 4.286.006.005-3.055.797-2.646-1.852-.04-2.95-.006-.005.006-.008v-.025l.01.008L6.02 7.81l-4.457-3.2.876-1.22zM7.25 8.695l-2.13 3.198 3.277 2.294 2.104-3.158-3.25-2.334zM14.002 0l2.16 1.512-.856 1.222c.828.967 1.144 2.141.432 3.158l-2.416 3.599-1.214-.873 2.396-3.593.005.003c.317-.452-.16-1.332-1.064-1.966-.891-.624-1.865-.776-2.197-.349l-.006-.004-2.384 3.575-1.224-.879 2.376-3.539c.674-.932 1.706-1.155 3.096-.668l.046.018.85-1.216z" }));
        function jr() {
          return jr = Object.assign ? Object.assign.bind() : function(l) {
            for (var o = 1; o < arguments.length; o++) {
              var s = arguments[o];
              for (var c in s) ({}).hasOwnProperty.call(s, c) && (l[c] = s[c]);
            }
            return l;
          }, jr.apply(null, arguments);
        }
        const Es = ({ styles: l = {}, ...o }) => i.createElement("svg", jr({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, o), i.createElement("path", { d: "M11.28 1a1 1 0 01.948.684l.333 1 .018.066H16a.75.75 0 01.102 1.493L16 4.25h-.5V16a2 2 0 01-2 2h-8a2 2 0 01-2-2V4.25H3a.75.75 0 01-.102-1.493L3 2.75h3.42a1 1 0 01.019-.066l.333-1A1 1 0 017.721 1h3.558zM14 4.5H5V16a.5.5 0 00.41.492l.09.008h8a.5.5 0 00.492-.41L14 16V4.5zM7.527 6.06v8.951h-1V6.06h1zm5 0v8.951h-1V6.06h1zM10 6.06v8.951H9V6.06h1z" }));
        function rr() {
          return rr = Object.assign ? Object.assign.bind() : function(l) {
            for (var o = 1; o < arguments.length; o++) {
              var s = arguments[o];
              for (var c in s) ({}).hasOwnProperty.call(s, c) && (l[c] = s[c]);
            }
            return l;
          }, rr.apply(null, arguments);
        }
        const xs = ({ styles: l = {}, ...o }) => i.createElement("svg", rr({ viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg" }, o), i.createElement("path", { d: "M2.284 2.498c-.239.266-.184.617-.184 1.002V4H2a.5.5 0 00-.492.41L1.5 4.5V17a1 1 0 00.883.993L2.5 18h10a1 1 0 00.97-.752l-.081-.062c.438.368.976.54 1.507.526a2.5 2.5 0 01-2.232 1.783l-.164.005h-10a2.5 2.5 0 01-2.495-2.336L0 17V4.5a2 2 0 011.85-1.995L2 2.5l.284-.002zm10.532 0L13 2.5a2 2 0 011.995 1.85L15 4.5v2.28a2.243 2.243 0 00-1.5.404V4.5a.5.5 0 00-.41-.492L13 4v-.5l-.007-.144c-.031-.329.032-.626-.177-.858z" }), i.createElement("path", { d: "M6 .49l-.144.006a1.75 1.75 0 00-1.41.94l-.029.058.083-.004c-.69 0-1.25.56-1.25 1.25v1c0 .69.56 1.25 1.25 1.25h6c.69 0 1.25-.56 1.25-1.25v-1l-.006-.128a1.25 1.25 0 00-1.116-1.116l-.046-.002-.027-.058A1.75 1.75 0 009 .49H6zm0 1.5h3a.25.25 0 01.25.25l.007.102A.75.75 0 0010 2.99h.25v.5h-5.5v-.5H5a.75.75 0 00.743-.648l.007-.102A.25.25 0 016 1.99zm9.374 6.55a.75.75 0 01-.093 1.056l-2.33 1.954h6.127a.75.75 0 010 1.501h-5.949l2.19 1.837a.75.75 0 11-.966 1.15l-3.788-3.18a.747.747 0 01-.21-.285.75.75 0 01.17-.945l3.792-3.182a.75.75 0 011.057.093z" }));
        function Lr() {
          return Lr = Object.assign ? Object.assign.bind() : function(l) {
            for (var o = 1; o < arguments.length; o++) {
              var s = arguments[o];
              for (var c in s) ({}).hasOwnProperty.call(s, c) && (l[c] = s[c]);
            }
            return l;
          }, Lr.apply(null, arguments);
        }
        const Ss = ({ styles: l = {}, ...o }) => i.createElement("svg", Lr({ viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg" }, o), i.createElement("path", { fill: "#4fa800", d: "M6.972 16.615a.997.997 0 01-.744-.292l-4.596-4.596a1 1 0 111.414-1.414l3.926 3.926 9.937-9.937a1 1 0 011.414 1.415L7.717 16.323a.997.997 0 01-.745.292z" }));
        O(4343);
        const ji = "Lock from Inspector (@ckeditor/ckeditor5-inspector)";
        class ao extends i.Component {
          constructor(o) {
            super(o), this.state = { isShiftKeyPressed: !1, wasEditorDataJustCopied: !1 }, this._keyDownHandler = this._handleKeyDown.bind(this), this._keyUpHandler = this._handleKeyUp.bind(this), this._readOnlyHandler = this._handleReadOnly.bind(this), this._editorDataJustCopiedTimeout = null;
          }
          render() {
            return i.createElement("div", { className: "ck-inspector-editor-quick-actions" }, i.createElement(Et, { text: "Log editor", icon: i.createElement(Ht, null), isEnabled: !!this.props.editor, onClick: () => console.log(this.props.editor) }), this._getLogButton(), i.createElement(va, { editor: this.props.editor }), i.createElement(Et, { text: "Toggle read only", icon: i.createElement(wa, null), isOn: this.props.isReadOnly, isEnabled: !!this.props.editor, onClick: this._readOnlyHandler }), i.createElement(Et, { text: "Destroy editor", icon: i.createElement(Es, null), isEnabled: !!this.props.editor, onClick: () => {
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
            let o, s;
            return this.state.wasEditorDataJustCopied ? (o = i.createElement(Ss, null), s = "Data copied to clipboard.") : (o = this.state.isShiftKeyPressed ? i.createElement(xs, null) : i.createElement(ka, null), s = "Log editor data (press with Shift to copy)"), i.createElement(Et, { text: s, icon: o, className: this.state.wasEditorDataJustCopied ? "ck-inspector-button_data-copied" : "", isEnabled: !!this.props.editor, onClick: this._handleLogEditorDataClick.bind(this) });
          }
          _handleLogEditorDataClick({ shiftKey: o }) {
            o ? (jo()(this.props.editor.getData()), this.setState({ wasEditorDataJustCopied: !0 }), clearTimeout(this._editorDataJustCopiedTimeout), this._editorDataJustCopiedTimeout = setTimeout(() => {
              this.setState({ wasEditorDataJustCopied: !1 });
            }, 3e3)) : console.log(this.props.editor.getData());
          }
          _handleKeyDown({ key: o }) {
            this.setState({ isShiftKeyPressed: o === "Shift" });
          }
          _handleKeyUp() {
            this.setState({ isShiftKeyPressed: !1 });
          }
          _handleReadOnly() {
            this.props.editor.isReadOnly ? this.props.editor.disableReadOnlyMode(ji) : this.props.editor.enableReadOnlyMode(ji);
          }
        }
        const Li = _e(({ editors: l, currentEditorName: o, currentEditorGlobals: { isReadOnly: s } }) => ({ editor: l.get(o), isReadOnly: s }), {})(ao);
        function Fr() {
          return Fr = Object.assign ? Object.assign.bind() : function(l) {
            for (var o = 1; o < arguments.length; o++) {
              var s = arguments[o];
              for (var c in s) ({}).hasOwnProperty.call(s, c) && (l[c] = s[c]);
            }
            return l;
          }, Fr.apply(null, arguments);
        }
        const Fi = ({ styles: l = {}, ...o }) => i.createElement("svg", Fr({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, o), i.createElement("path", { d: "M17.03 6.47a.75.75 0 01.073.976l-.072.084-6.984 7a.75.75 0 01-.977.073l-.084-.072-7.016-7a.75.75 0 01.976-1.134l.084.072 6.485 6.47 6.454-6.469a.75.75 0 01.977-.073l.084.072z" }));
        O(9938);
        const _a = { position: "fixed", bottom: "0", left: "0", right: "0", top: "auto" };
        class Cs extends i.Component {
          constructor(o) {
            super(o), Ea(this.props.height), document.body.style.setProperty("--ck-inspector-collapsed-height", "30px"), this.handleInspectorResize = this.handleInspectorResize.bind(this);
          }
          handleInspectorResize(o, s, c) {
            const g = c.style.height;
            this.props.setHeight(g), Ea(g);
          }
          render() {
            return this.props.isCollapsed ? (document.body.classList.remove("ck-inspector-body-expanded"), document.body.classList.add("ck-inspector-body-collapsed")) : (document.body.classList.remove("ck-inspector-body-collapsed"), document.body.classList.add("ck-inspector-body-expanded")), i.createElement(Si, { bounds: "window", enableResizing: { top: !this.props.isCollapsed }, disableDragging: !0, minHeight: "100", maxHeight: "100%", style: _a, className: ["ck-inspector", this.props.isCollapsed ? "ck-inspector_collapsed" : ""].join(" "), position: { x: 0, y: "100%" }, size: { width: "100%", height: this.props.isCollapsed ? 30 : this.props.height }, onResizeStop: this.handleInspectorResize }, i.createElement(eo, { onTabChange: this.props.setActiveTab, contentBefore: i.createElement(Os, { key: "docs" }), activeTab: this.props.activeTab, contentAfter: [i.createElement(Ds, { key: "selector" }), i.createElement("span", { className: "ck-inspector-separator", key: "separator-a" }), i.createElement(Li, { key: "quick-actions" }), i.createElement("span", { className: "ck-inspector-separator", key: "separator-b" }), i.createElement(ci, { key: "inspector-toggle" })] }, i.createElement(ps, { label: "Model" }), i.createElement(fa, { label: "View" }), i.createElement(Ai, { label: "Commands" }), i.createElement(vs, { label: "Schema" })));
          }
          componentWillUnmount() {
            document.body.classList.remove("ck-inspector-body-expanded"), document.body.classList.remove("ck-inspector-body-collapsed");
          }
        }
        const Ts = _e(({ editors: l, currentEditorName: o, ui: { isCollapsed: s, height: c, activeTab: g } }) => ({ isCollapsed: s, height: c, editors: l, currentEditorName: o, activeTab: g }), { toggleIsCollapsed: $r, setHeight: function(l) {
          return { type: Hn, newHeight: l };
        }, setEditors: Wr, setCurrentEditorName: _o, setActiveTab: Eo })(Cs);
        class Os extends i.Component {
          render() {
            return i.createElement("a", { className: "ck-inspector-navbox__navigation__logo", title: "Go to the documentation", href: "https://ckeditor.com/docs/ckeditor5/latest/", target: "_blank", rel: "noopener noreferrer" }, "CKEditor documentation");
          }
        }
        class Ns extends i.Component {
          constructor(o) {
            super(o), this.handleShortcut = this.handleShortcut.bind(this);
          }
          render() {
            return i.createElement(Et, { text: "Toggle inspector", icon: i.createElement(Fi, null), onClick: this.props.toggleIsCollapsed, title: "Toggle inspector (Alt+F12)", className: ["ck-inspector-navbox__navigation__toggle", this.props.isCollapsed ? " ck-inspector-navbox__navigation__toggle_up" : ""].join(" ") });
          }
          componentDidMount() {
            window.addEventListener("keydown", this.handleShortcut);
          }
          componentWillUnmount() {
            window.removeEventListener("keydown", this.handleShortcut);
          }
          handleShortcut(o) {
            (function(s) {
              return s.altKey && !s.shiftKey && !s.ctrlKey && s.key === "F12";
            })(o) && this.props.toggleIsCollapsed();
          }
        }
        const ci = _e(({ ui: { isCollapsed: l } }) => ({ isCollapsed: l }), { toggleIsCollapsed: $r })(Ns);
        class Ps extends i.Component {
          render() {
            return i.createElement("div", { className: "ck-inspector-editor-selector", key: "editor-selector" }, this.props.currentEditorName ? i.createElement(Do, { id: "inspector-editor-selector", label: "Instance", value: this.props.currentEditorName, options: [...this.props.editors].map(([o]) => o), onChange: (o) => this.props.setCurrentEditorName(o.target.value) }) : "");
          }
        }
        const Ds = _e(({ currentEditorName: l, editors: o }) => ({ currentEditorName: l, editors: o }), { setCurrentEditorName: _o })(Ps);
        function Ea(l) {
          document.body.style.setProperty("--ck-inspector-height", l);
        }
        O(8704), window.CKEDITOR_INSPECTOR_VERSION = "5.0.0";
        class He {
          constructor() {
            Ye.warn("[CKEditorInspector] Whoops! Looks like you tried to create an instance of the CKEditorInspector class. To attach the inspector, use the static CKEditorInspector.attach( editor ) method instead. For the latest API, please refer to https://github.com/ckeditor/ckeditor5-inspector/blob/master/README.md. ");
          }
          static attach(...o) {
            const { CKEDITOR_VERSION: s } = window;
            if (s) {
              const [y] = s.split(".").map(Number);
              y < 34 && Ye.warn("[CKEditorInspector] The inspector requires using CKEditor 5 in version 34 or higher. If you cannot update CKEditor 5, consider downgrading the major version of the inspector to version 3.");
            } else Ye.warn("[CKEditorInspector] Could not determine a version of CKEditor 5. Some of the functionalities may not work as expected.");
            const { editors: c, options: g } = qn(o);
            for (const y in c) {
              const x = c[y];
              Ye.group("%cAttached the inspector to a CKEditor 5 instance. To learn more, visit https://ckeditor.com/docs/ckeditor5.", "font-weight: bold;"), Ye.log(`Editor instance "${y}"`, x), Ye.groupEnd(), He._editors.set(y, x), x.on("destroy", () => {
                He.detach(y);
              }), He._mount(g), He._updateEditorsState();
            }
            return Object.keys(c);
          }
          static attachToAll(o) {
            const s = document.querySelectorAll(".ck.ck-content.ck-editor__editable"), c = [];
            for (const g of s) {
              const y = g.ckeditorInstance;
              y && !He._isAttachedTo(y) && c.push(...He.attach(y, o));
            }
            return c;
          }
          static detach(o) {
            He._wrapper && (He._editors.delete(o), He._updateEditorsState());
          }
          static destroy() {
            if (!He._wrapper) return;
            u.unmountComponentAtNode(He._wrapper), He._editors.clear(), He._wrapper.remove();
            const o = He._store.getState(), s = o.editors.get(o.currentEditorName);
            s && He._editorListener.stopListening(s), He._editorListener = null, He._wrapper = null, He._store = null;
          }
          static _updateEditorsState() {
            He._store.dispatch(Wr(He._editors));
          }
          static _mount(o) {
            if (He._wrapper) return;
            const s = He._wrapper = document.createElement("div");
            let c, g;
            s.className = "ck-inspector-wrapper", document.body.appendChild(s), He._editorListener = new Qr({ onModelChange() {
              const y = He._store;
              y.getState().ui.isCollapsed || (y.dispatch(Nn()), y.dispatch(Lt()));
            }, onViewRender() {
              const y = He._store;
              y.getState().ui.isCollapsed || y.dispatch(Be());
            }, onReadOnlyChange() {
              He._store.dispatch({ type: sr });
            } }), He._store = b(ta, { editors: He._editors, currentEditorName: sn(He._editors), currentEditorGlobals: {}, ui: { isCollapsed: o.isCollapsed } }), He._store.subscribe(() => {
              const y = He._store.getState(), x = y.editors.get(y.currentEditorName);
              c !== x && (c && He._editorListener.stopListening(c), x && He._editorListener.startListening(x), c = x);
            }), He._store.subscribe(() => {
              const y = He._store, x = y.getState().ui.isCollapsed, z = g && !x;
              g = x, z && (y.dispatch(Nn()), y.dispatch(Lt()), y.dispatch(Be()));
            }), u.render(i.createElement(J, { store: He._store }, i.createElement(Ts, null)), s);
          }
          static _isAttachedTo(o) {
            return [...He._editors.values()].includes(o);
          }
        }
        He._editors = /* @__PURE__ */ new Map(), He._wrapper = null;
      })(), te = te.default;
    })());
  })(wl)), wl.exports;
}
var Hu = Bu();
const $u = /* @__PURE__ */ Vu(Hu);
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
const Wu = function(Te) {
  const E = Te.plugins.get(zc), _ = $(Te.ui.view.element), T = $(Te.sourceElement), O = `ckeditor${Math.floor(Math.random() * 1e9)}`, te = [
    "keypress",
    "keyup",
    "change",
    "focus",
    "blur",
    "click",
    "mousedown",
    "mouseup"
  ].map((i) => `${i}.${O}`).join(" ");
  E.on("change:isSourceEditingMode", () => {
    const i = _.find(
      ".ck-source-editing-area"
    );
    if (E.isSourceEditingMode) {
      let u = i.attr("data-value");
      i.on(te, () => {
        u !== (u = i.attr("data-value")) && T.val(u);
      });
    } else
      i.off(`.${O}`);
  });
}, qu = function(Te, E) {
  if (E.heading !== void 0) {
    var _ = E.heading.options;
    _.find((T) => T.view === "h1") !== void 0 && Te.keystrokes.set(
      "Ctrl+Alt+1",
      () => Te.execute("heading", { value: "heading1" })
    ), _.find((T) => T.view === "h2") !== void 0 && Te.keystrokes.set(
      "Ctrl+Alt+2",
      () => Te.execute("heading", { value: "heading2" })
    ), _.find((T) => T.view === "h3") !== void 0 && Te.keystrokes.set(
      "Ctrl+Alt+3",
      () => Te.execute("heading", { value: "heading3" })
    ), _.find((T) => T.view === "h4") !== void 0 && Te.keystrokes.set(
      "Ctrl+Alt+4",
      () => Te.execute("heading", { value: "heading4" })
    ), _.find((T) => T.view === "h5") !== void 0 && Te.keystrokes.set(
      "Ctrl+Alt+5",
      () => Te.execute("heading", { value: "heading5" })
    ), _.find((T) => T.view === "h6") !== void 0 && Te.keystrokes.set(
      "Ctrl+Alt+6",
      () => Te.execute("heading", { value: "heading6" })
    ), _.find((T) => T.model === "paragraph") !== void 0 && Te.keystrokes.set("Ctrl+Alt+p", "paragraph");
  }
}, Ku = function(Te, E) {
  let _ = null;
  const T = Te.editing.view.document, O = Te.plugins.get("ClipboardPipeline");
  T.on("clipboardOutput", (te, i) => {
    _ = Te.id;
  }), T.on("clipboardInput", async (te, i) => {
    let u = i.dataTransfer.getData("text/html");
    if (u && u.includes("<craft-entry") && !(i.method == "drop" && _ === Te.id)) {
      if (i.method == "paste" || i.method == "drop" && _ !== Te.id) {
        let f = u, k = !1;
        const d = Craft.siteId;
        let C = null, m = null;
        const b = Te.getData(), v = [...u.matchAll(/data-entry-id="([0-9]+)/g)];
        te.stop();
        const N = $(Te.ui.view.element);
        let D = N.parents("form").data("elementEditor");
        await D.ensureIsDraftOrRevision();
        let L = N.parents(".input");
        if (L.length > 0) {
          let se = $(L[0]).find("div[data-config]");
          se.length > 0 && (C = $(se[0]).data("element-id"));
        }
        C == null && (C = D.settings.elementId), m = N.parents(".field").data("layoutElement");
        for (let se = 0; se < v.length; se++) {
          let J = null;
          if (v[se][1] && (J = v[se][1]), J !== null) {
            const M = new RegExp('data-entry-id="' + J + '"');
            if (!(_ === Te.id && !M.test(b))) {
              let F = null;
              _ !== Te.id && (E.includes(Au) ? F = Te.config.get("entryTypeOptions").map((B) => B.value) : (Craft.cp.displayError(
                Craft.t(
                  "ckeditor",
                  "This field doesn’t allow nested entries."
                )
              ), k = !0)), await Craft.sendActionRequest(
                "POST",
                "ckeditor/ckeditor/duplicate-nested-entry",
                {
                  data: {
                    entryId: J,
                    siteId: d,
                    targetEntryTypeIds: F,
                    targetOwnerId: C,
                    targetLayoutElementUid: m
                  }
                }
              ).then((B) => {
                B.data.newEntryId && (f = f.replace(
                  J,
                  B.data.newEntryId
                ));
              }).catch((B) => {
                var ne, pe, oe, fe;
                k = !0, Craft.cp.displayError((pe = (ne = B == null ? void 0 : B.response) == null ? void 0 : ne.data) == null ? void 0 : pe.message), console.error((fe = (oe = B == null ? void 0 : B.response) == null ? void 0 : oe.data) == null ? void 0 : fe.additionalMessage);
              });
            }
          }
        }
        k || (i.content = Te.data.htmlProcessor.toView(f), O.fire("inputTransformation", i));
      }
    }
  });
}, Ju = async function(Te, E) {
  typeof Te == "string" && (Te = document.querySelector(`#${Te}`)), E.licenseKey = "GPL";
  const _ = await wu.create(Te, E);
  return Craft.showCkeditorInspector && Craft.userIsAdmin && $u.attach(_), _.editing.view.change((T) => {
    const O = _.editing.view.document.getRoot();
    if (typeof E.accessibleFieldName < "u" && E.accessibleFieldName.length) {
      let te = O.getAttribute("aria-label");
      T.setAttribute(
        "aria-label",
        E.accessibleFieldName + ", " + te,
        O
      );
    }
    typeof E.describedBy < "u" && E.describedBy.length && T.setAttribute(
      "aria-describedby",
      E.describedBy,
      O
    );
  }), _.updateSourceElement(), _.model.document.on("change:data", () => {
    _.updateSourceElement();
  }), E.plugins.includes(zc) && Wu(_), E.plugins.includes(_u) && qu(_, E), Ku(_, E.plugins), _;
};
export {
  Au as CraftEntries,
  Yu as CraftImageInsertUI,
  Zu as CraftLink,
  Gu as ImageEditor,
  Xu as ImageTransform,
  Ju as create
};
