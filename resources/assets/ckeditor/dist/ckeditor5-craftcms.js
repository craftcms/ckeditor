var Nb = Object.defineProperty;
var Pb = (de, f, m) => f in de ? Nb(de, f, { enumerable: !0, configurable: !0, writable: !0, value: m }) : de[f] = m;
var wn = (de, f, m) => Pb(de, typeof f != "symbol" ? f + "" : f, m);
import { ImageTextAlternativeUI as Db, ButtonView as Bn, FormRowView as Ib, ImageInsertUI as Rb, IconImage as Mb, Command as Fs, Plugin as Tt, ImageUtils as up, Collection as no, ViewModel as hr, createDropdown as ro, DropdownButtonView as Ab, IconObjectSizeMedium as zb, addListToDropdown as Ni, Widget as jb, viewToModelPositionOutsideModelElement as Lb, toWidget as Ub, DomEventObserver as Vb, View as $t, IconPlus as dp, WidgetToolbarRepository as op, isWidget as Fb, findAttributeRange as ip, LinkUI as ap, ContextualBalloon as $b, ModelRange as Hb, SwitchButtonView as Bb, LabeledFieldView as Wb, createLabeledInputText as qb, ClassicEditor as Kb, SourceEditing as pp, Heading as Qb } from "ckeditor5";
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
const sp = /#asset:\d+(?:@\d+)?:alt$/, Yb = /#asset:(\d+)(?:@(\d+))?/;
class Cv extends Db {
  static get pluginName() {
    return "CraftImageTextAlternativeUI";
  }
  constructor() {
    super(...arguments), this._syncButton = null, this._syncButtonRow = null;
  }
  _createForm() {
    super._createForm(), this._createSyncButton(), this.listenTo(
      this._form,
      "submit",
      () => {
        const f = this._form.labeledInput.fieldView, m = this.editor.commands.get("imageTextAlternative").value || "";
        sp.test(m) && f.element.value === this._visibleAltText(m) && (f.value = f.element.value = m);
      },
      { priority: "high" }
    );
  }
  _showForm() {
    super._showForm();
    const f = this._form.labeledInput.fieldView, m = this._visibleAltText(f.element.value);
    f.value = f.element.value = m, this._syncButton.isEnabled = !!this._srcInfo(this._selectedImage()), f.select();
  }
  _visibleAltText(f) {
    return f.replace(sp, "");
  }
  _selectedImage() {
    return this.editor.plugins.get("ImageUtils").getClosestSelectedImageElement(
      this.editor.model.document.selection
    );
  }
  _srcInfo(f) {
    if (!f || !f.hasAttribute("src"))
      return null;
    const m = f.getAttribute("src").match(Yb);
    return m ? {
      assetId: m[1],
      siteId: m[2] ?? null
    } : null;
  }
  _createSyncButton() {
    const f = this.editor, m = new Bn(f.locale);
    m.set({
      label: Craft.t("ckeditor", "Sync from asset"),
      withText: !0,
      class: "btn"
    }), m.render(), this.listenTo(m, "execute", () => this._syncFromAsset());
    const k = new Ib(f.locale, {
      children: [m]
    });
    this._form.children.add(k), this._form.focusTracker.add(m.element), this._form._focusables.add(m), this._syncButton = m, this._syncButtonRow = k;
  }
  async _syncFromAsset() {
    var le, G;
    const f = this._selectedImage(), m = this._srcInfo(f);
    if (!m)
      return;
    let k;
    try {
      k = await Craft.sendActionRequest(
        "POST",
        "ckeditor/ckeditor/image-alt",
        {
          data: {
            assetId: m.assetId,
            siteId: m.siteId ?? this.editor.config.get("elementSiteId")
          }
        }
      );
    } catch (he) {
      throw Craft.cp.displayError((G = (le = he == null ? void 0 : he.response) == null ? void 0 : le.data) == null ? void 0 : G.message), he;
    }
    const T = k.data.siteId ?? m.siteId, L = k.data.alt ?? "", A = `${L}#asset:${m.assetId}${T ? `@${T}` : ""}:alt`, K = this._form.labeledInput.fieldView;
    if (K.value == L) {
      Craft.cp.displaySuccess(
        Craft.t("ckeditor", "The alternative text was already in sync.")
      );
      return;
    }
    K.value = K.element.value = L, this.editor.execute("imageTextAlternative", {
      newValue: A
    }), Craft.cp.displaySuccess(
      Craft.t("ckeditor", "The alternative text was synced from the asset.")
    );
  }
  destroy() {
    this._syncButton && this._syncButton.destroy(), super.destroy();
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class Sv extends Rb {
  static get pluginName() {
    return "CraftImageInsertUI";
  }
  constructor() {
    super(...arguments), this.$container = null, this.progressBar = null, this.$fileInput = null, this.uploader = null;
  }
  init() {
    if (!this._imageSources) {
      console.warn(
        'Omitting the "image" CKEditor toolbar button, because there aren’t any permitted volumes.'
      );
      return;
    }
    if (this._imageMode === "entries" && !this._imageFieldHandle) {
      console.warn(
        'Omitting the "image" CKEditor toolbar button, because no image field was selected.'
      );
      return;
    }
    const f = this.editor.ui.componentFactory, m = (k) => this._createToolbarImageButton(k);
    f.add("insertImage", m), f.add("imageInsert", m), this._attachUploader();
  }
  get _imageMode() {
    return this.editor.config.get("imageMode");
  }
  get _imageSources() {
    return this.editor.config.get("imageSources");
  }
  get _imageModalSettings() {
    return this.editor.config.get("imageModalSettings") ?? {};
  }
  get _imageFieldHandle() {
    return this.editor.config.get("imageFieldHandle");
  }
  /**
   * Returns Craft.ElementEditor instance that the CKEditor field belongs to.
   *
   * @returns {*}
   */
  get _elementEditor() {
    return $(this.editor.ui.view.element).closest(
      "form,.lp-editor-container"
    ).data("elementEditor");
  }
  _createToolbarImageButton(f) {
    const m = this.editor, k = m.t, T = new Bn(f);
    T.isEnabled = !0, T.label = k("Insert image"), T.icon = Mb, T.tooltip = !0;
    const L = m.commands.get("insertImage");
    return T.bind("isEnabled").to(L), this.listenTo(T, "execute", () => this._showImageSelectModal()), T;
  }
  _showImageSelectModal() {
    const f = this._imageSources, m = this.editor, k = m.config, T = Object.assign({}, k.get("assetSelectionCriteria"), {
      kind: "image"
    });
    Craft.createElementSelectorModal("CraftCms\\Cms\\Asset\\Elements\\Asset", {
      ...this._imageModalSettings,
      storageKey: `ckeditor:${this.pluginName}:'CraftCms\\Cms\\Asset\\Elements\\Asset'`,
      sources: f,
      criteria: T,
      defaultSiteId: k.get("elementSiteId"),
      transforms: k.get("transforms"),
      autoFocusSearchBox: !1,
      multiSelect: !0,
      onSelect: (L, A) => {
        this._processSelectedAssets(L, A).then(() => {
          m.editing.view.focus();
        });
      },
      onHide: () => {
        m.editing.view.focus();
      },
      closeOtherModals: !1
    });
  }
  async _processSelectedAssets(f, m) {
    if (!f.length)
      return;
    if (this._imageMode === "entries") {
      for (const A of f)
        await this._createImageEntry(A.id);
      return;
    }
    const k = this.editor, T = k.config.get("defaultTransform"), L = [];
    for (const A of f) {
      const K = A.siteId ?? k.config.get("elementSiteId"), le = `${A.$element.data("alt") ?? ""}#asset:${A.id}${K ? `@${K}` : ""}:alt`, G = this._isTransformUrl(A.url);
      if (!G && T) {
        const he = await this._getTransformUrl(A.id, T);
        L.push({ src: he, alt: le });
      } else {
        const he = this._buildAssetUrl(
          A.id,
          A.url,
          G ? m : T
        );
        L.push({ src: he, alt: le });
      }
    }
    k.execute("insertImage", { source: L });
  }
  async _createImageEntry(f) {
    const m = this.editor, k = this._elementEditor, T = $(m.sourceElement).attr("name");
    k && T && await k.setFormValue(T, "*");
    const L = m.config.get(
      "nestedElementAttributes"
    ), A = {
      ...L
    }, K = m.config.get("craftOwner");
    k ? (await k.markDeltaNameAsModified(m.sourceElement.name), A.ownerId = k.getDraftElementId(
      L.ownerId
    )) : K && (A.ownerId = await K.prepare());
    let le;
    try {
      le = await Craft.sendActionRequest(
        "POST",
        "ckeditor/ckeditor/create-image-entry",
        {
          data: {
            ...A,
            assetIds: [f]
          }
        }
      );
    } catch (G) {
      throw Craft.cp.displayError(), G;
    }
    m.commands.execute("insertEntry", {
      entryId: le.data.entryId,
      siteId: le.data.siteId
    });
  }
  _buildAssetUrl(f, m, k) {
    return `${m}#asset:${f}:${k ? "transform:" + k : "url"}`;
  }
  _removeTransformFromUrl(f) {
    return f.replace(/(^|\/)_[^\/]+(\/\d+)?\/([^\/]+)$/, "$1$3");
  }
  _isTransformUrl(f) {
    return /(^|\/)_[^\/]+(\/\d+)?(\/[^\/]+)$/.test(f);
  }
  async _getTransformUrl(f, m) {
    let k;
    try {
      k = await Craft.sendActionRequest(
        "POST",
        "ckeditor/ckeditor/image-url",
        {
          data: {
            assetId: f,
            transform: m
          }
        }
      );
    } catch {
      alert("There was an error generating the transform URL.");
    }
    return this._buildAssetUrl(f, k.data.url, m);
  }
  _getAssetUrlComponents(f) {
    const m = f.match(
      /(.*)#asset:(\d+):(url|transform):?([a-zA-Z][a-zA-Z0-9_]*)?/
    );
    return m ? {
      url: m[1],
      assetId: m[2],
      transform: m[3] !== "url" ? m[4] : null
    } : null;
  }
  /**
   * Attach the uploader with drag event handler
   */
  _attachUploader() {
    const f = this.editor, m = f.config.get("defaultUploadFolderId");
    m && (this.$container = $(f.sourceElement).closest(".input"), this.progressBar = new Craft.ProgressBar(
      $('<div class="progress-shade"></div>').appendTo(this.$container)
    ), this.$fileInput = $("<input/>", {
      type: "file",
      class: "hidden",
      multiple: !0
    }).insertAfter(f.sourceElement), this.uploader = Craft.createUploader(null, this.$container, {
      dropZone: this.$container,
      fileInput: this.$fileInput,
      allowedKinds: ["image"],
      canAddMoreFiles: !0,
      events: {
        fileuploadstart: this._onUploadStart.bind(this),
        fileuploadprogressall: this._onUploadProgress.bind(this),
        fileuploaddone: this._onUploadComplete.bind(this),
        fileuploadfail: this._onUploadFailure.bind(this)
      }
    }), this.uploader.setParams({
      folderId: m,
      siteId: f.config.get("elementSiteId")
    }), f.editing.view.document.on(
      "drop",
      async (k, T) => {
        f.editing.view, f.model;
        const L = f.editing.mapper, A = T.dropRange;
        if (A) {
          const K = A.start, le = L.toModelPosition(K);
          f.model.change((G) => {
            G.setSelection(le, 0);
          });
        }
      },
      { priority: "high" }
    ));
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
  _onUploadProgress(f, m = null) {
    m = f instanceof CustomEvent ? f.detail : m;
    var k = parseInt(Math.min(m.loaded / m.total, 1) * 100, 10);
    this.progressBar.setProgressPercentage(k);
  }
  /**
   * On a file being uploaded.
   */
  async _onUploadComplete(f, m = null) {
    const k = f instanceof CustomEvent ? f.detail : m.result;
    if (this.progressBar.hideProgressBar(), this.$container.removeClass("uploading"), this._imageMode === "entries") {
      await this._createImageEntry(k.assetId);
      return;
    }
    const T = this.editor.config.get("defaultTransform"), L = this._isTransformUrl(k.url);
    let A;
    !k.url || !L && T ? A = await this._getTransformUrl(k.assetId, T) : A = this._buildAssetUrl(
      k.assetId,
      k.url,
      L ? transform : T
    ), this.editor.execute("insertImage", { source: A, breakBlock: !0 });
  }
  /**
   * On Upload Failure.
   */
  _onUploadFailure(f, m = null) {
    var le, G;
    const k = f instanceof CustomEvent ? f.detail : (le = m == null ? void 0 : m.jqXHR) == null ? void 0 : le.responseJSON;
    let { message: T, filename: L, errors: A } = k || {};
    L = L || ((G = m == null ? void 0 : m.files) == null ? void 0 : G[0].name);
    let K = A ? Object.values(A).flat() : [];
    T || (K.length ? T = K.join(`
`) : L ? T = Craft.t("app", "Upload failed for “{filename}”.", { filename: L }) : T = Craft.t("app", "Upload failed.")), Craft.cp.displayError(T), this.progressBar.hideProgressBar(), this.$container.removeClass("uploading");
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class Gb extends Fs {
  refresh() {
    const f = this._element(), m = this._srcInfo(f);
    this.isEnabled = !!m, m ? this.value = {
      transform: m.transform
    } : this.value = null;
  }
  _element() {
    const f = this.editor;
    return f.plugins.get("ImageUtils").getClosestSelectedImageElement(
      f.model.document.selection
    );
  }
  _srcInfo(f) {
    if (!f || !f.hasAttribute("src"))
      return null;
    const m = f.getAttribute("src"), k = m.match(
      /#asset:(\d+)(?::transform:([a-zA-Z][a-zA-Z0-9_]*))?/
    );
    return k ? {
      src: m,
      assetId: k[1],
      transform: k[2]
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
  execute(f) {
    const k = this.editor.model, T = this._element(), L = this._srcInfo(T);
    if (this.value = {
      transform: f.transform
    }, L) {
      const A = `#asset:${L.assetId}` + (f.transform ? `:transform:${f.transform}` : "");
      k.change((K) => {
        const le = L.src.replace(/#.*/, "") + A;
        K.setAttribute("src", le, T);
      }), Craft.sendActionRequest("post", "ckeditor/ckeditor/image-url", {
        data: {
          assetId: L.assetId,
          transform: f.transform
        }
      }).then(({ data: K }) => {
        k.change((le) => {
          const G = K.url + A;
          le.setAttribute("src", G, T), K.width && le.setAttribute("width", K.width, T), K.height && le.setAttribute("height", K.height, T);
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
class fp extends Tt {
  static get requires() {
    return [up];
  }
  static get pluginName() {
    return "ImageTransformEditing";
  }
  constructor(f) {
    super(f), f.config.define("transforms", []);
  }
  init() {
    const f = this.editor, m = new Gb(f);
    f.commands.add("transformImage", m);
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
const Xb = zb;
class Zb extends Tt {
  static get requires() {
    return [fp];
  }
  static get pluginName() {
    return "ImageTransformUI";
  }
  init() {
    const f = this.editor, m = f.config.get("transforms"), k = f.commands.get("transformImage");
    this.bind("isEnabled").to(k), this._registerImageTransformDropdown(m);
  }
  /**
   * A helper function that creates a dropdown component for the plugin containing all the transform options defined in
   * the editor configuration.
   *
   * @param transforms An array of the available image transforms.
   */
  _registerImageTransformDropdown(f) {
    const m = this.editor, k = m.t, T = {
      name: "transformImage:original",
      value: null
    }, L = [
      T,
      ...f.map((K) => ({
        label: K.name,
        name: `transformImage:${K.handle}`,
        value: K.handle
      }))
    ], A = (K) => {
      const le = m.commands.get("transformImage"), G = ro(K, Ab), he = G.buttonView;
      return he.set({
        tooltip: k("Resize image"),
        commandValue: null,
        icon: Xb,
        isToggleable: !0,
        label: this._getOptionLabelValue(T),
        withText: !0,
        class: "ck-resize-image-button"
      }), he.bind("label").to(le, "value", (xe) => {
        if (!xe || !xe.transform)
          return this._getOptionLabelValue(T);
        const Ce = f.find(
          (ze) => ze.handle === xe.transform
        );
        return Ce ? Ce.name : xe.transform;
      }), G.bind("isEnabled").to(this), Ni(
        G,
        () => this._getTransformDropdownListItemDefinitions(L, le),
        {
          ariaLabel: k("Image resize list")
        }
      ), this.listenTo(G, "execute", (xe) => {
        m.execute(xe.source.commandName, {
          transform: xe.source.commandValue
        }), m.editing.view.focus();
      }), G;
    };
    m.ui.componentFactory.add("transformImage", A);
  }
  /**
   * A helper function for creating an option label value string.
   *
   * @param option A transform option object.
   * @returns The option label.
   */
  _getOptionLabelValue(f) {
    return f.label || f.value || this.editor.t("Original");
  }
  /**
   * A helper function that parses the transform options and returns list item definitions ready for use in the dropdown.
   *
   * @param options The transform options.
   * @param command The transform image command.
   * @returns Dropdown item definitions.
   */
  _getTransformDropdownListItemDefinitions(f, m) {
    const k = new no();
    return f.map((T) => {
      const L = {
        type: "button",
        model: new hr({
          commandName: "transformImage",
          commandValue: T.value,
          label: this._getOptionLabelValue(T),
          withText: !0,
          icon: null
        })
      };
      L.model.bind("isOn").to(m, "value", Jb(T.value)), k.add(L);
    }), k;
  }
}
function Jb(de) {
  return (f) => {
    const m = f;
    return de === null && m === de ? !0 : m !== null && m.transform === de;
  };
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class Tv extends Tt {
  static get requires() {
    return [fp, Zb];
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
class ev extends Fs {
  refresh() {
    const f = this._element(), m = this._srcInfo(f);
    if (this.isEnabled = !!m, this.isEnabled) {
      let k = {
        assetId: m.assetId
      };
      Craft.sendActionRequest("POST", "ckeditor/ckeditor/image-permissions", {
        data: k
      }).then((T) => {
        T.data.editable === !1 && (this.isEnabled = !1);
      });
    }
  }
  /**
   * Returns the selected image element.
   */
  _element() {
    const f = this.editor;
    return f.plugins.get("ImageUtils").getClosestSelectedImageElement(
      f.model.document.selection
    );
  }
  /**
   * Checks if element has a src attribute and at least an asset id.
   * Returns null if not and array containing src, asset id and transform (if used).
   *
   * @param element
   * @returns {{transform: *, src: *, assetId: *}|null}
   * @private
   */
  _srcInfo(f) {
    if (!f || !f.hasAttribute("src"))
      return null;
    const m = f.getAttribute("src"), k = m.match(
      /(.*)#asset:(\d+)(?::transform:([a-zA-Z][a-zA-Z0-9_]*))?/
    );
    return k ? {
      src: m,
      assetId: k[2],
      transform: k[3]
    } : null;
  }
  /**
   * Executes the command.
   *
   * @fires execute
   */
  execute() {
    this.editor.model;
    const m = this._element(), k = this._srcInfo(m);
    if (k) {
      let T = {
        allowSavingAsNew: !1,
        // todo: we might want to change that, but currently we're doing the same functionality as in Redactor
        onSave: (L) => {
          this._reloadImage(k.assetId, L);
        },
        allowDegreeFractions: Craft.isImagick
      };
      new Craft.AssetImageEditor(k.assetId, T);
    }
  }
  /**
   * Reloads the matching images after save was triggered from the Image Editor.
   *
   * @param data
   */
  _reloadImage(f, m) {
    let T = this.editor.model;
    this._getAllImageAssets().forEach((A) => {
      if (A.srcInfo.assetId == f)
        if (A.srcInfo.transform) {
          let K = {
            assetId: A.srcInfo.assetId,
            handle: A.srcInfo.transform
          };
          Craft.sendActionRequest("POST", "assets/generate-transform", {
            data: K
          }).then((le) => {
            let G = this._getNewSrc(le.data, A);
            T.change((he) => {
              he.setAttribute("src", G, A.element);
            });
          });
        } else {
          let K = {
            assetId: A.srcInfo.assetId
          };
          Craft.sendActionRequest("POST", "ckeditor/ckeditor/image-url", {
            data: K
          }).then((le) => {
            let G = this._getNewSrc(le.data, A);
            T.change((he) => {
              he.setAttribute("src", G, A.element);
            });
          });
        }
    });
  }
  _getNewSrc(f, m) {
    let k = f.url;
    return Craft.revAssetUrls || (k += (k.includes("?") ? "&" : "?") + (/* @__PURE__ */ new Date()).getTime()), k += "#asset:" + m.srcInfo.assetId, m.srcInfo.transform && (k += ":transform:" + m.srcInfo.transform), k;
  }
  /**
   * Returns all images present in the editor that are Craft Assets.
   *
   * @returns {*[]}
   * @private
   */
  _getAllImageAssets() {
    const m = this.editor.model, k = m.createRangeIn(m.document.getRoot());
    let T = [];
    for (const L of k.getWalker({ ignoreElementEnd: !0 }))
      if (L.item.is("element") && L.item.name === "imageBlock") {
        let A = this._srcInfo(L.item);
        A && T.push({
          element: L.item,
          srcInfo: A
        });
      }
    return T;
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class hp extends Tt {
  static get requires() {
    return [up];
  }
  static get pluginName() {
    return "ImageEditorEditing";
  }
  init() {
    const f = this.editor, m = new ev(f);
    f.commands.add("imageEditor", m);
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class tv extends Tt {
  static get requires() {
    return [hp];
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
    const f = this.editor, m = f.t, k = f.commands.get("imageEditor"), T = () => {
      const L = new Bn();
      return L.set({
        label: m("Edit Image"),
        withText: !0
      }), L.bind("isEnabled").to(k), this.listenTo(L, "execute", (A) => {
        f.execute("imageEditor"), f.editing.view.focus();
      }), L;
    };
    f.ui.componentFactory.add("imageEditor", T);
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class Ov extends Tt {
  static get requires() {
    return [hp, tv];
  }
  static get pluginName() {
    return "ImageEditor";
  }
}
class nv extends Fs {
  execute(f) {
    const m = this.editor, k = m.model.document.selection;
    if (!k.isCollapsed && k.getFirstRange()) {
      const L = k.getSelectedElement();
      m.execute("insertParagraph", {
        position: m.model.createPositionAfter(L)
      });
    }
    m.model.change((L) => {
      const A = L.createElement("craftEntryModel", {
        ...Object.fromEntries(k.getAttributes()),
        cardHtml: f.cardHtml,
        entryId: f.entryId,
        siteId: f.siteId
      });
      m.model.insertObject(A, null, null, {
        setSelection: "on"
      });
    });
  }
  refresh() {
    this.isEnabled = !0;
  }
}
class rv extends Tt {
  /**
   * @inheritDoc
   */
  static get requires() {
    return [jb];
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
    const f = this.editor;
    f.commands.add("insertEntry", new nv(f)), f.editing.mapper.on(
      "viewToModelPosition",
      Lb(f.model, (m) => {
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
    const f = this.editor.conversion;
    f.for("upcast").elementToElement({
      view: {
        name: "craft-entry"
        // has to be lower case
      },
      model: (k, { writer: T }) => {
        const L = k.getAttribute("data-card-html"), A = k.getAttribute("data-entry-id"), K = k.getAttribute("data-site-id") ?? null;
        return T.createElement("craftEntryModel", {
          cardHtml: L,
          entryId: A,
          siteId: K
        });
      }
    }), f.for("editingDowncast").elementToElement({
      model: "craftEntryModel",
      view: (k, { writer: T }) => {
        const L = k.getAttribute("entryId") ?? null, A = k.getAttribute("siteId") ?? null, K = T.createContainerElement("div", {
          class: "cke-entry-card",
          "data-entry-id": L,
          "data-site-id": A
        });
        return m(k, T, K), Ub(K, T);
      }
    }), f.for("dataDowncast").elementToElement({
      model: "craftEntryModel",
      view: (k, { writer: T }) => {
        const L = k.getAttribute("entryId") ?? null, A = k.getAttribute("siteId") ?? null;
        return T.createContainerElement("craft-entry", {
          "data-entry-id": L,
          "data-site-id": A
        });
      }
    });
    const m = (k, T, L) => {
      this._getCardHtml(k).then((A) => {
        const K = T.createRawElement(
          "div",
          null,
          function(G) {
            G.innerHTML = A.cardHtml, Craft.appendHeadHtml(A.headHtml), Craft.appendBodyHtml(A.bodyHtml);
          }
        );
        T.insert(T.createPositionAt(L, 0), K);
        const le = this.editor;
        le.editing.view.focus(), setTimeout(() => {
          Craft.cp.elementThumbLoader.load($(le.ui.element));
        }, 100), le.model.change((G) => {
          le.ui.update(), $(le.sourceElement).trigger("keyup");
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
  async _getCardHtml(f) {
    var K, le, G;
    let m = f.getAttribute("cardHtml") ?? null;
    if (m)
      return { cardHtml: m };
    let k = $(this.editor.sourceElement).parents(".field");
    const T = this.editor.config.get("layoutElementUid") ?? $(k[0]).data("layout-element"), L = f.getAttribute("entryId") ?? null, A = f.getAttribute("siteId") ?? null;
    try {
      const he = this.editor, Ce = $(he.ui.view.element).closest(
        "form,.lp-editor-container"
      ).data("elementEditor");
      Ce && await Ce.checkForm();
      const { data: ze } = await Craft.sendActionRequest(
        "POST",
        "ckeditor/ckeditor/entry-card-html",
        {
          data: {
            entryId: L,
            siteId: A,
            layoutElementUid: T
          }
        }
      );
      return ze;
    } catch (he) {
      return console.error((K = he == null ? void 0 : he.response) == null ? void 0 : K.data), { cardHtml: '<div class="element card"><div class="card-content"><div class="card-heading"><div class="label error"><span>' + (((G = (le = he == null ? void 0 : he.response) == null ? void 0 : le.data) == null ? void 0 : G.message) || "An unknown error occurred.") + "</span></div></div></div></div>" };
    }
  }
}
class ov extends Vb {
  constructor(f) {
    super(f), this.domEventType = "dblclick";
  }
  onDomEvent(f) {
    this.fire(f.type, f);
  }
}
class iv extends $t {
  constructor(f, m = {}) {
    super(f), this.set("isFocused", !1), this.entriesUi = m.entriesUi, this.editor = this.entriesUi.editor, this.entryType = m.entryType;
    const k = this.editor.commands.get("insertEntry");
    let T = new Bn(), L = {
      commandValue: this.entryType.model.commandValue,
      //entry type id
      label: this.entryType.model.label,
      withText: !this.entryType.model.icon,
      tooltip: Craft.t("app", "New {type}", {
        type: this.entryType.model.label
      })
    }, A = ["btn", "ck-reset_all-excluded"];
    this.entryType.model.icon && A.push(["icon", "cp-icon"]), L.class = A.join(" "), this.entryType.model.withIcon && (L.icon = this.entryType.model.icon), T.set(L), this.listenTo(T, "execute", (K) => {
      this.entriesUi._showCreateEntrySlideout(K.source.commandValue);
    }), T.bind("isEnabled").to(k), this.setTemplate({
      tag: "div",
      attributes: {
        // ck-reset_all-excluded class is needed so that CKE doesn't mess with the styles we already have
        class: ["entry-type-button"]
      },
      children: [T]
    });
  }
  // this is needed so that the button is focusable
  focus() {
    this.element.children[0].focus();
  }
}
class av extends $t {
  constructor(f, m = {}) {
    super(f), this.bindTemplate, this.set("isFocused", !1), this.entriesUi = m.entriesUi, this.editor = this.entriesUi.editor;
    const k = m.entryTypes, T = this.editor.commands.get("insertEntry");
    let L = new no();
    k.forEach((K) => {
      K.model.color && (K.model.class || (K.model.class = ""), K.model.class += "icon " + K.model.color), L.add(K);
    });
    const A = ro(f);
    A.buttonView.set({
      label: Craft.t("ckeditor", "Add nested content"),
      icon: dp,
      tooltip: !0,
      withText: !1
    }), A.bind("isEnabled").to(T), A.id = Craft.uuid(), Ni(A, () => L, {
      ariaLabel: Craft.t("ckeditor", "Entry types list")
    }), this.listenTo(A, "execute", (K) => {
      this.entriesUi._showCreateEntrySlideout(K.source.commandValue);
    }), this.setTemplate({
      tag: "div",
      attributes: {
        // ck-reset_all-excluded class is needed so that CKE doesn't mess with the styles we already have
        class: ["entry-type-button"]
      },
      children: [A]
    });
  }
  // this is needed so that the dropdown button is focusable
  focus() {
    this.element.children[0].children[0].focus();
  }
}
class sv extends $t {
  constructor(f, m = {}) {
    super(f), this.bindTemplate, this.set("isFocused", !1), this.entriesUi = m.entriesUi, this.editor = this.entriesUi.editor;
    const k = this.editor.commands.get("insertEntry"), T = ro(f);
    T.buttonView.set({
      label: Craft.t("ckeditor", "Add nested content"),
      icon: dp,
      tooltip: !0,
      withText: !1
    }), T.bind("isEnabled").to(k), T.id = Craft.uuid(), this.listenTo(T, "execute", (L) => {
      this.entriesUi._showCreateEntrySlideout(L.source.commandValue);
    }), this.setTemplate({
      tag: "div",
      attributes: {
        // ck-reset_all-excluded class is needed so that CKE doesn't mess with the styles we already have
        class: ["entry-type-button"],
        tabindex: -1
      },
      children: [T]
    });
  }
  // this is needed so that the button is focusable
  focus() {
    this.element.focus();
  }
}
class lv extends Tt {
  /**
   * @inheritDoc
   */
  static get requires() {
    return [op];
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
    this._createToolbarEntriesButtons(), this.editor.ui.componentFactory.add("editEntryBtn", (f) => this._createEditEntryBtn(f)), this._listenToEvents();
  }
  /**
   * @inheritDoc
   */
  afterInit() {
    this.editor.plugins.get(
      op
    ).register("entriesBalloon", {
      ariaLabel: Craft.t("ckeditor", "Entry toolbar"),
      // Toolbar Buttons
      items: ["editEntryBtn"],
      // If a related element is returned the toolbar is attached
      getRelatedElement: (m) => {
        const k = m.getSelectedElement();
        return k && Fb(k) && k.hasClass("cke-entry-card") ? k : null;
      }
    });
  }
  /**
   * Hook up event listeners
   *
   * @private
   */
  _listenToEvents() {
    const f = this.editor.editing.view, m = f.document;
    f.addObserver(ov), this.editor.listenTo(m, "dblclick", (k, T) => {
      if (!this.editor.isReadOnly) {
        const L = this.editor.editing.mapper.toModelElement(
          T.target.parent
        );
        L.name === "craftEntryModel" && this._initEditEntrySlideout(T, L);
      }
    });
  }
  _initEditEntrySlideout(f = null, m = null) {
    if (this.editor.isReadOnly)
      return;
    m === null && (m = this.editor.model.document.selection.getSelectedElement());
    const k = m.getAttribute("entryId"), T = m.getAttribute("siteId") ?? null;
    this._showEditEntrySlideout(k, T, m);
  }
  /**
   * Creates toolbar buttons that allow for an entry of given type to be inserted into the editor
   *
   * @private
   */
  _createToolbarEntriesButtons() {
    const m = this.editor.config.get("entryTypeOptions");
    if (!(!m || !m.length))
      if (m.length == 1 && m[0].value == "fake")
        this.editor.ui.componentFactory.add(
          "createEntry",
          (k) => new sv(this.editor.locale, {
            entriesUi: this
          })
        );
      else {
        let k = this._getEntryTypeButtonsCollection(
          m ?? []
        ), T = k.filter((A) => A.model.expanded), L = k.filter((A) => !A.model.expanded);
        T.forEach((A, K) => {
          this.editor.ui.componentFactory.add(
            `createEntry-${A.model.uid}`,
            (le) => new iv(this.editor.locale, {
              entriesUi: this,
              entryType: A
            })
          );
        }), L.length && this.editor.ui.componentFactory.add(
          "createEntry",
          (A) => new av(this.editor.locale, {
            entriesUi: this,
            entryTypes: L
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
  _getEntryTypeButtonsCollection(f) {
    const m = new no();
    return f.map((k) => {
      const T = {
        type: "button",
        model: new hr({
          commandValue: k.value,
          //entry type id
          color: k.expanded ? null : k.color,
          expanded: k.expanded,
          icon: k.icon,
          label: k.label || k.value,
          uid: k.uid,
          withIcon: k.icon,
          withText: k.expanded ? !k.icon : !0
          // items in a dropdown should always have text
        })
      };
      m.add(T);
    }), m;
  }
  /**
   * Creates an edit entry button that shows in the contextual balloon for each craft entry widget
   * @param locale
   * @returns {ButtonView}
   * @private
   */
  _createEditEntryBtn(f) {
    if (this.editor.isReadOnly)
      return;
    const m = new Bn(f);
    return m.set({
      isEnabled: !0,
      label: Craft.t("app", "Edit {type}", {
        type: (Craft.elementTypeNames["CraftCms\\Cms\\Entry\\Elements\\Entry"] ?? Craft.elementTypeNames["craft\\elements\\Entry"])[2]
      }),
      tooltip: !0,
      withText: !0
    }), this.listenTo(m, "execute", (k) => {
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
  _getCardElement(f) {
    return $(this.editor.ui.element).find('.element.card[data-id="' + f + '"]');
  }
  /**
   * Opens an element editor for existing entry
   *
   * @param entryId
   * @private
   */
  _showEditEntrySlideout(f, m, k) {
    const T = this.editor, L = T.model, A = this.getElementEditor(), K = T.config.get("craftOwner");
    if (!A && K && Craft.openSlideout) {
      this._openNativeEditEntrySlideout(f, m, k, K);
      return;
    }
    let le = this._getCardElement(f);
    const G = le.data("owner-id");
    let he = {
      siteId: m
    }, xe = le.parents(".field");
    xe.length && $(xe[0]).hasClass("has-errors") && (he.prevalidate = !0);
    const Ce = Craft.createElementEditor(this.elementType, null, {
      elementId: f,
      params: he,
      onLoad: () => {
        Ce.elementEditor.on("update", () => {
          Craft.Preview.refresh();
        });
      },
      onBeforeSubmit: async () => {
        if (le !== null && Garnish.hasAttr(le, "data-owner-is-canonical") && (!A || !A.settings.isUnpublishedDraft)) {
          await Ce.elementEditor.checkForm(!0, !0);
          let ze = $(T.sourceElement).attr("name");
          A && ze && await A.setFormValue(ze, "*"), A && A.settings.draftId && Ce.elementEditor.settings.draftId && (Ce.elementEditor.settings.saveParams || (Ce.elementEditor.settings.saveParams = {}), Ce.elementEditor.settings.saveParams.action = "elements/save-nested-element-for-derivative", Ce.elementEditor.settings.saveParams.newOwnerId = A.getDraftElementId(G));
        }
      },
      onSubmit: (ze) => {
        let Ue = this._getCardElement(f);
        Ue !== null && ze.data.id != Ue.data("id") && (Ue.attr("data-id", ze.data.id).data("id", ze.data.id).data("owner-id", ze.data.ownerId), T.editing.model.change((it) => {
          it.setAttribute("entryId", ze.data.id, k), T.ui.update();
        }), Craft.refreshElementInstances(ze.data.id));
      }
    });
    Ce.on("beforeClose", () => {
      L.change((ze) => {
        ze.setSelection(ze.createPositionAfter(k)), T.editing.view.focus();
      });
    }), Ce.on("close", () => {
      T.editing.view.focus();
    });
  }
  /**
   * Opens a native (Craft 6) slideout for an existing entry.
   *
   * Changes are saved into the owner’s draft, via the owner bridge’s `prepare()`.
   *
   * @private
   */
  _openNativeEditEntrySlideout(f, m, k, T) {
    const L = this.editor, A = L.model, K = this._getCardElement(f), le = {
      elementId: f,
      siteId: m
    }, G = K.parents(".field");
    G.length && $(G[0]).hasClass("has-errors") && (le.prevalidate = 1), Craft.openSlideout(Craft.getActionUrl("elements/edit", le), {
      opener: K[0] ?? null,
      prepareNestedOwner: () => T.prepare(),
      onSaved: (he) => {
        var Ce, ze, Ue;
        if (he != null && he.draft)
          return;
        const xe = parseInt(
          ((ze = (Ce = he == null ? void 0 : he.data) == null ? void 0 : Ce.element) == null ? void 0 : ze.id) ?? ((Ue = he == null ? void 0 : he.data) == null ? void 0 : Ue.id) ?? f,
          10
        );
        xe && xe != f && L.editing.model.change((it) => {
          it.setAttribute("entryId", xe, k);
        }), Craft.refreshElementInstances(xe || f), T.refresh();
      },
      onClosed: () => {
        A.change((he) => {
          he.setSelection(he.createPositionAfter(k));
        }), L.editing.view.focus();
      }
    });
  }
  /**
   * Creates new entry and opens the element editor for it
   *
   * @param entryTypeId
   * @private
   */
  async _showCreateEntrySlideout(f) {
    var Ce, ze;
    const m = this.editor, k = m.model, L = k.document.selection.getFirstRange(), A = m.config.get(
      "nestedElementAttributes"
    ), K = Object.assign({}, A, {
      typeId: f
    }), le = this.getElementEditor(), G = m.config.get("craftOwner");
    le ? (await le.markDeltaNameAsModified(m.sourceElement.name), K.ownerId = le.getDraftElementId(
      A.ownerId
    )) : G && (K.ownerId = await G.prepare());
    let he;
    try {
      he = (await Craft.sendActionRequest(
        "POST",
        "elements/create",
        {
          data: K
        }
      )).data;
    } catch (Ue) {
      throw Craft.cp.displayError((ze = (Ce = Ue == null ? void 0 : Ue.response) == null ? void 0 : Ce.data) == null ? void 0 : ze.error), Ue;
    }
    const xe = Craft.createElementEditor(this.elementType, {
      elementId: he.element.id,
      draftId: he.element.draftId,
      params: {
        fresh: 1,
        siteId: he.element.siteId
      },
      onSubmit: (Ue) => {
        m.commands.execute("insertEntry", {
          entryId: Ue.data.id,
          siteId: Ue.data.siteId
        });
      }
    });
    xe.on("beforeClose", () => {
      xe.$triggerElement = null, k.change((Ue) => {
        Ue.setSelection(
          Ue.createPositionAt(
            m.model.document.getRoot(),
            L.end.path[0]
          )
        );
      }), m.editing.view.focus();
    });
  }
}
class cv extends Tt {
  static get requires() {
    return [rv, lv];
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
function mp(de, f) {
  if (f)
    return de.type === "bool" && de.value == !0 ? "" : f;
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class uv extends Tt {
  static get pluginName() {
    return "CraftLinkEditing";
  }
  constructor() {
    super(...arguments), this.conversionData = [], this.editor.config.define("advancedLinkFields", []);
  }
  init() {
    const m = this.editor.config.get("advancedLinkFields");
    this.conversionData = m.map((k) => k.conversion ?? null).filter((k) => k), this._defineSchema(), this._defineConverters(), this._adjustLinkCommand(), this._adjustUnlinkCommand();
  }
  _defineSchema() {
    const f = this.editor.model.schema;
    let m = this.conversionData.map((k) => k.model);
    f.extend("$text", {
      allowAttributes: m
    });
  }
  _defineConverters() {
    const f = this.editor.conversion;
    for (let m = 0; m < this.conversionData.length; m++)
      f.for("downcast").attributeToElement({
        model: this.conversionData[m].model,
        view: (k, { writer: T }) => {
          const L = T.createAttributeElement(
            "a",
            { [this.conversionData[m].view]: k },
            { priority: 5 }
          );
          return T.setCustomProperty("link", !0, L), L;
        }
      }), f.for("upcast").attributeToAttribute({
        view: {
          name: "a",
          key: this.conversionData[m].view
        },
        model: {
          key: this.conversionData[m].model,
          value: (k, T) => k.getAttribute(this.conversionData[m].view)
        }
      });
    f.for("editingDowncast").add((m) => {
      m.on(
        "attribute:linkHref",
        (k, T, { mapper: L, writer: A }) => {
          if (!T.attributeNewValue || !T.item.is("$textProxy"))
            return;
          const K = L.toViewRange(T.range);
          for (const le of K.getItems())
            for (const G of le.getAncestors())
              G.is("attributeElement", "a") && G.hasAttribute("href") && !G.getCustomProperty("link") && A.setCustomProperty("link", !0, G);
        },
        { priority: "low" }
      );
    });
  }
  _adjustLinkCommand() {
    const f = this.editor, m = f.commands.get("link");
    let k = !1;
    m.on(
      "execute",
      (T, L) => {
        if (k) {
          k = !1;
          return;
        }
        T.stop(), k = !0;
        const A = L[3] || {}, K = f.model.document.selection;
        f.model.change((le) => {
          f.execute("link", ...L);
          const G = K.getFirstPosition();
          let he = null;
          if (K.isCollapsed) {
            const xe = G.textNode || G.nodeBefore;
            he = xe != null && xe.hasAttribute("linkHref") ? ip(
              G,
              "linkHref",
              xe.getAttribute("linkHref"),
              f.model
            ) : le.createRangeOn(xe);
          }
          this.conversionData.forEach((xe) => {
            const Ce = mp(
              xe,
              A[xe.model]
            );
            if (K.isCollapsed)
              Ce !== void 0 ? le.setAttribute(xe.model, Ce, he) : le.removeAttribute(xe.model, he);
            else {
              const ze = f.model.schema.getValidRanges(
                K.getRanges(),
                xe.model
              );
              for (const Ue of ze)
                Ce !== void 0 ? le.setAttribute(xe.model, Ce, Ue) : le.removeAttribute(xe.model, Ue);
            }
          });
        });
      },
      { priority: "high" }
    );
  }
  _adjustUnlinkCommand() {
    const f = this.editor, m = f.commands.get("unlink"), { model: k } = f, { selection: T } = k.document;
    let L = !1;
    m.on(
      "execute",
      (A) => {
        L || (A.stop(), k.change(() => {
          L = !0, f.execute("unlink"), L = !1, k.change((K) => {
            let le;
            this.conversionData.forEach((G) => {
              T.isCollapsed ? le = [
                ip(
                  T.getFirstPosition(),
                  G.model,
                  T.getAttribute(G.model),
                  k
                )
              ] : le = k.schema.getValidRanges(
                T.getRanges(),
                G.model
              );
              for (const he of le)
                K.removeAttribute(G.model, he);
            });
          });
        }));
      },
      { priority: "high" }
    );
  }
}
class dv extends $t {
  constructor(f, m = {}) {
    super(f), this.bindTemplate, this.set("isFocused", !1), this.linkUi = m.linkUi, this.editor = this.linkUi.editor, this.elementId = this.linkUi._getLinkElementId(), this.siteId = this.linkUi._getLinkSiteId(), this.linkOption = m.linkOption;
    const k = this.linkUi._getLinkElementRefHandle();
    if (this.button = null, k) {
      const T = this.linkUi.linkTypeDropdownItemModels[k];
      this.linkUi.linkTypeDropdownView.buttonView.label == T.label && (this.button = Craft.t("app", "Loading"));
    }
    this.button == null && (this.button = new Bn(), this.button.set({
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
    const f = this.linkUi, m = f._linkUI, k = this.linkOption;
    this.element.addEventListener("click", function(T) {
      if (this.children[0].classList.contains("add") || T.target.classList.contains("ck-button__label")) {
        const L = m.formView.displayedTextInputView.fieldView.element.value;
        m._hideUI(!1), f._showElementSelectorModal(k, L);
      }
    }), this.element.children.length == 0 && Craft.sendActionRequest(
      "POST",
      "ckeditor/ckeditor/render-element-with-supported-sites",
      {
        data: {
          elements: [
            {
              type: k.elementType,
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
    ).then((T) => {
      var L, A, K, le;
      if (Object.keys(T.data.elements).length > 0) {
        if (Craft.isMultiSite && this.linkUi.sitesView != null)
          for (const [xe, Ce] of Object.entries(
            this.linkUi.sitesView.siteDropdownItemModels
          ))
            T.data.siteIds.includes(parseInt(xe)) || xe == "current" ? Ce.set("isEnabled", !0) : Ce.set("isEnabled", !1);
        this.element.innerHTML = T.data.elements[this.elementId][0], Craft.appendHeadHtml(T.data.headHtml), Craft.appendBodyHtml(T.data.bodyHtml);
        let G = this.element.firstChild;
        const he = [
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
        Craft.addActionsToChip(G, he), (A = (L = this.linkUi.sitesView) == null ? void 0 : L.siteDropdownView) != null && A.buttonView && ((K = this.linkUi.sitesView) == null || K.siteDropdownView.buttonView.set(
          "isVisible",
          !0
        )), f._alignFocus();
      } else if (((le = this.linkUi.previousLinkValue) == null ? void 0 : le.length) > 0) {
        const { formView: G } = this.linkUi._linkUI;
        G.urlInputView.fieldView.set(
          "value",
          this.linkUi.previousLinkValue
        );
      } else
        this.button = new Bn(), this.button.set({
          label: Craft.t("app", "Choose"),
          withText: !0,
          class: "btn add icon dashed"
        }), this.button.render(), this.element.innerHTML = this.button.element.outerHTML;
    }).catch((T) => {
      var L, A, K, le;
      throw Craft.cp.displayError((A = (L = T == null ? void 0 : T.response) == null ? void 0 : L.data) == null ? void 0 : A.message), ((le = (K = T == null ? void 0 : T.response) == null ? void 0 : K.data) == null ? void 0 : le.message) ?? T;
    });
  }
}
class pv extends $t {
  constructor(f, m = {}) {
    super(f), this.bindTemplate, this.set("isFocused", !1), this.linkUi = m.linkUi, this.editor = this.linkUi.editor, this.elementId = this.linkUi._getLinkElementId(), this.siteId = this.linkUi._getLinkSiteId(), this.linkOption = m.linkOption, this.linkUi._getLinkElementRefHandle(), this.siteDropdownView = ro(this.linkUi._linkUI.formView.locale), this.siteDropdownItemModels = null, this.localizedRefHandleRE = null;
    const k = CKE_LOCALIZED_REF_HANDLES.join("|");
    this.localizedRefHandleRE = new RegExp(
      `(#(?:${k}):\\d+)(?:@(\\d+))?`
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
    const { formView: f } = this.linkUi._linkUI, { urlInputView: m } = f, { fieldView: k } = m;
    this.siteDropdownView.buttonView.set({
      label: "",
      withText: !0,
      isVisible: !0
    }), this.siteDropdownItemModels = Object.fromEntries(
      Craft.sites.map((T) => [
        T.id,
        new hr({
          label: T.name,
          siteId: T.id,
          withText: !0
        })
      ])
    ), this.siteDropdownItemModels.current = new hr({
      label: Craft.t("ckeditor", "Link to the current site"),
      siteId: null,
      withText: !0
    }), Ni(
      this.siteDropdownView,
      new no([
        ...Craft.sites.map((T) => ({
          type: "button",
          model: this.siteDropdownItemModels[T.id]
        })),
        {
          type: "button",
          model: this.siteDropdownItemModels.current
        }
      ])
    ), this.siteDropdownView.on("execute", (T) => {
      const L = this.linkUi._urlInputRefMatch(this.localizedRefHandleRE);
      if (!L) {
        console.warn(
          `No reference tag hash present in URL: ${this.linkUi._urlInputValue()}`
        );
        return;
      }
      const { siteId: A } = T.source;
      let K = L[1];
      A && (K += `@${A}`), this.linkUi.previousLinkValue = this.linkUi._urlInputValue();
      const le = this.linkUi._urlInputValue().replace(L[0], K);
      f.urlInputView.fieldView.set("value", le), this._toggleSiteDropdownView();
    }), this.listenTo(k, "change:value", () => {
      this._toggleSiteDropdownView();
    }), this.listenTo(k, "input", () => {
      this._toggleSiteDropdownView();
    });
  }
  _toggleSiteDropdownView() {
    const f = this.linkUi._urlInputRefMatch(this.localizedRefHandleRE);
    if (f) {
      this.siteDropdownView.buttonView.set("isVisible", !0);
      let m = f[2] ? parseInt(f[2], 10) : null;
      m && typeof this.siteDropdownItemModels[m] > "u" && (m = null), this._selectSiteDropdownItem(m), this.siteDropdownView.buttonView.set("isVisible", !0);
    } else
      this.siteDropdownView.buttonView.set("isVisible", !1);
  }
  _selectSiteDropdownItem(f) {
    const m = this.siteDropdownItemModels[f ?? "current"], k = f ? Craft.t("ckeditor", "Site: {name}", { name: m.label }) : m.label;
    this.siteDropdownView.buttonView.set("label", k), Object.values(this.siteDropdownItemModels).forEach((T) => {
      T.set("isOn", T.siteId === m.siteId);
    });
  }
}
class fv extends $t {
  constructor(f, m = {}) {
    super(f);
    const k = this.bindTemplate;
    this.set("label", Craft.t("app", "Advanced")), this.linkUi = m.linkUi, this.editor = this.linkUi.editor, this.children = this.createCollection(), this.advancedChildren = this.createCollection(), this.setTemplate({
      tag: "details",
      attributes: {
        class: ["ck", "ck-form__details", "link-type-advanced"]
      },
      children: this.children
    }), this.summary = new $t(f), this.summary.setTemplate({
      tag: "summary",
      attributes: {
        class: ["ck", "ck-form__details__summary"]
      },
      children: [{ text: k.to("label") }]
    }), this.children.add(this.summary), this.advancedFieldsContainer = new $t(f), this.advancedFieldsContainer.setTemplate({
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
  onToggle(f) {
    const { formView: m } = this.linkUi._linkUI;
    if (f.target.open) {
      const k = m._focusables.getIndex(this);
      this.advancedChildren._items.forEach((T, L) => {
        m._focusables.add(T, k + L + 1), m.focusTracker.add(T.element, k + L + 1);
      });
    } else
      this.advancedChildren._items.forEach((k, T) => {
        m._focusables.remove(k), m.focusTracker.remove(k.element);
      });
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class hv extends Tt {
  static get requires() {
    return [ap];
  }
  static get pluginName() {
    return "CraftLinkUI";
  }
  constructor() {
    super(...arguments), this.linkTypeWrapperView = null, this.advancedView = null, this.elementInputView = null, this.sitesView = null, this.urlSuffixInputView = null, this.previousLinkValue = null, this.linkTypeDropdownView = null, this.linkTypeDropdownItemModels = [], this.elementTypeRefHandleRE = null, this.urlWithRefHandleRE = null, this.conversionData = [], this.linkOptions = [], this.advancedLinkFields = [], this.editor.config.define("linkOptions", []), this.editor.config.define("advancedLinkFields", []);
  }
  init() {
    const f = this.editor;
    this._linkUI = f.plugins.get(ap), this._balloon = f.plugins.get($b), this.linkOptions = f.config.get("linkOptions"), this.advancedLinkFields = f.config.get("advancedLinkFields"), this.conversionData = this.advancedLinkFields.map((k) => k.conversion ?? null).filter((k) => k);
    const m = CKE_LOCALIZED_REF_HANDLES.join("|");
    this.elementTypeRefHandleRE = new RegExp(
      `(#((?:${m})):\\d+)`
    ), this.urlWithRefHandleRE = new RegExp(
      `(.+)(#((?:${m})):(\\d+))(?:@(\\d+))?`
    ), this._modifyFormViewTemplate(), this._balloon.on(
      "set:visibleView",
      (k, T, L, A) => {
        const { formView: K } = this._linkUI;
        L === A || L !== K || this._alignFocus();
      }
    );
  }
  /**
   * Reset focus order of the extra fields we're adding to the link form view
   */
  _alignFocus() {
    const { formView: f } = this._linkUI;
    let m = 0;
    this.linkTypeWrapperView && (this.linkTypeWrapperView._unboundChildren._items.forEach((k) => {
      f._focusables.has(k) && f._focusables.remove(k), f.focusTracker.remove(k.element), f._focusables.add(k, m), f.focusTracker.add(k.element, m), m++;
    }), this.advancedView !== null && (f._focusables.has(this.advancedView) && f._focusables.remove(this.advancedView), f.focusTracker.remove(this.advancedView), f._focusables.add(this.advancedView, m), f.focusTracker.add(this.advancedView.element, m)));
  }
  /**
   * Add all our custom fields (for element linking and advanced fields) to the link form view.
   */
  _modifyFormViewTemplate() {
    this._linkUI.formView || this._linkUI._createViews();
    const { formView: f } = this._linkUI;
    f.template.attributes.class.push(
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
  _urlInputRefMatch(f) {
    return this._urlInputValue().match(f);
  }
  ////////////////////// Link Options Dropdown (link types) //////////////////////
  /**
   * Create a link type dropdown.
   */
  _linkOptionsDropdown() {
    const { formView: f } = this._linkUI, { urlInputView: m } = f, { fieldView: k } = m;
    this.linkTypeDropdownView = ro(f.locale), this.linkTypeDropdownView.buttonView.set({
      label: "",
      withText: !0,
      isVisible: !0
    }), this.linkTypeDropdownItemModels = Object.fromEntries(
      this._getLinkListItemDefinitions().map((T) => [T.handle, T])
    ), Ni(
      this.linkTypeDropdownView,
      new no([
        ...this._getLinkListItemDefinitions().map((T) => ({
          type: "button",
          model: this.linkTypeDropdownItemModels[T.handle]
        }))
      ])
    ), k.isEmpty && this._showLinkTypeForm("default"), this.linkTypeDropdownView.on("execute", (T) => {
      if (T.source.linkOption) {
        const L = T.source.linkOption;
        this._selectLinkTypeDropdownItem(L.refHandle), this._showLinkTypeForm(L, f);
      } else
        this._selectLinkTypeDropdownItem("default"), this._showLinkTypeForm("default");
    }), this.listenTo(k, "change:value", () => {
      this._toggleLinkTypeDropdownView();
      const T = this._getLinkElementRefHandle();
      T ? this._showLinkTypeForm(
        this.linkTypeDropdownItemModels[T].linkOption
      ) : this._urlInputValue().length == 0 ? (this._selectLinkTypeDropdownItem(this.linkOptions[0].refHandle), this._showLinkTypeForm(this.linkOptions[0])) : this._showLinkTypeForm("default");
    }), this.listenTo(k, "input", () => {
      this._toggleLinkTypeDropdownView();
    });
  }
  /**
   * Get the refHandle from the URL field value.
   */
  _getLinkElementRefHandle() {
    let f = null;
    const m = this._urlInputValue().match(this.elementTypeRefHandleRE);
    return m && (f = m[2], f && typeof this.linkTypeDropdownItemModels[f] > "u" && (f = null)), f;
  }
  /**
   * Get element ID from the URL field value.
   */
  _getLinkElementId() {
    let f = null;
    const m = this._urlInputRefMatch(this.urlWithRefHandleRE);
    return m && (f = m[4] ? parseInt(m[4], 10) : null), f;
  }
  /**
   * Get site ID from the URL field value.
   */
  _getLinkSiteId() {
    let f = null;
    const m = this._urlInputRefMatch(this.urlWithRefHandleRE);
    return m && (f = m[5] ? parseInt(m[5], 10) : null), f;
  }
  /**
   * Toggle between element link and default URL link fields.
   */
  _toggleLinkTypeDropdownView() {
    let f = this._getLinkElementRefHandle();
    f ? (this.linkTypeDropdownView.buttonView.set("isVisible", !0), this._selectLinkTypeDropdownItem(f)) : this._selectLinkTypeDropdownItem("default");
  }
  /**
   * Select link type from the dropdown.
   */
  _selectLinkTypeDropdownItem(f) {
    const m = this.linkTypeDropdownItemModels[f], k = f ? Craft.t("app", "{name}", { name: m.label }) : m.label;
    this.linkTypeDropdownView.buttonView.set("label", k), Object.values(this.linkTypeDropdownItemModels).forEach((T) => {
      T.set("isOn", T.handle === m.handle);
    });
  }
  /**
   * Get a list of all the options that should be shown in the link type dropdown.
   */
  _getLinkListItemDefinitions() {
    const f = [];
    for (const m of this.linkOptions)
      f.push(
        new hr({
          label: m.label,
          handle: m.refHandle,
          linkOption: m,
          withText: !0
        })
      );
    return f.push(
      new hr({
        label: Craft.t("app", "URL"),
        handle: "default",
        withText: !0
      })
    ), f;
  }
  /**
   * Place the link type fields in the form.
   */
  _showLinkTypeForm(f) {
    var K, le, G, he;
    const { formView: m } = this._linkUI, { children: k } = m, { urlInputView: T } = m, { displayedTextInputView: L } = m;
    L.focus(), this.linkTypeWrapperView !== null && k.remove(this.linkTypeWrapperView), f === "default" ? (this.elementInputView = T, this.sitesView !== null && (le = (K = this.sitesView) == null ? void 0 : K.siteDropdownView) != null && le.buttonView && this.sitesView.siteDropdownView.buttonView.set("isVisible", !1)) : (this.elementInputView = new dv(m.locale, {
      linkUi: this,
      linkOption: f,
      value: this._urlInputValue()
    }), this.sitesView !== null && (he = (G = this.sitesView) == null ? void 0 : G.siteDropdownView) != null && he.buttonView && this.sitesView.siteDropdownView.buttonView.set("isVisible", !1));
    let A = [
      this.linkTypeDropdownView,
      this.elementInputView
    ];
    if (Craft.isMultiSite && this.sitesView == null && (this.sitesView = new pv(m.locale, {
      linkUi: this,
      linkOption: f
    })), this.sitesView != null) {
      let xe = new $t();
      xe.setTemplate({
        tag: "span",
        attributes: {
          class: ["break"]
        }
      }), A.push(xe, this.sitesView);
    }
    this.linkTypeWrapperView = new $t(), this.linkTypeWrapperView.setTemplate({
      tag: "div",
      children: A,
      attributes: {
        class: [
          "ck",
          "ck-form__row",
          "ck-form__row_large-top-padding",
          "link-type-group",
          "flex"
        ]
      }
    }), k.add(this.linkTypeWrapperView, 2);
  }
  /**
   * Show element selector modal for given element type (link option).
   */
  _showElementSelectorModal(f, m) {
    const k = this.editor, T = k.model, L = T.document.selection, A = L.isCollapsed, K = L.getFirstRange(), le = this._linkUI._getSelectedLinkElement(), G = () => {
      k.editing.view.focus(), !A && K && T.change((he) => {
        he.setSelection(K);
      }), this._linkUI._hideFakeVisualSelection();
    };
    le || this._linkUI._showFakeVisualSelection(), Craft.createElementSelectorModal(f.elementType, {
      storageKey: `ckeditor:${this.pluginName}:${f.elementType}`,
      sources: f.sources,
      criteria: f.criteria,
      defaultSiteId: k.config.get("elementSiteId"),
      autoFocusSearchBox: !1,
      onSelect: (he) => {
        var xe;
        if (he.length) {
          const Ce = he[0], ze = ((xe = this.urlSuffixInputView) == null ? void 0 : xe.fieldView.element.value.trim()) ?? "", Ue = `${Ce.url}${ze}#${f.refHandle}:${Ce.id}@${Ce.siteId}`;
          if (k.editing.view.focus(), (!A || le) && K) {
            T.change((En) => {
              En.setSelection(K);
            });
            const it = k.commands.get("link");
            let pt = this._getAdvancedFieldValues();
            it.execute(Ue, {}, void 0, pt);
          } else
            T.change((it) => {
              let pt = this._getAdvancedFieldValues(), En = { linkHref: Ue };
              this.conversionData.forEach((Et) => {
                const It = mp(
                  Et,
                  pt[Et.model]
                );
                It !== void 0 && (En[Et.model] = It);
              });
              const Ht = m || Ce.label;
              if (it.insertText(Ht, En, L.getFirstPosition()), K instanceof Hb)
                try {
                  const Et = K.clone();
                  Et.end.path[1] += Ht.length, it.setSelection(Et);
                } catch {
                }
            });
          setTimeout(() => {
            this._linkUI._showUI(!0);
          }, 100);
        } else
          G();
      },
      onCancel: () => {
        G();
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
    var T;
    const f = this.editor.commands.get("link"), { formView: m } = this._linkUI, { children: k } = m;
    this.advancedView = new fv(m.locale, {
      linkUi: this
    }), k.add(this.advancedView, 3);
    for (const L of this.advancedLinkFields) {
      let A = (T = L.conversion) == null ? void 0 : T.model;
      if (A && typeof m[A] > "u")
        if (L.conversion.type === "bool") {
          const K = new Bb();
          K.set({
            withText: !0,
            label: L.label,
            isToggleable: !0
          }), L.tooltip && (K.tooltip = L.tooltip), this.advancedView.advancedChildren.add(K), m[A] = K, m[A].bind("isOn").to(f, A, (le) => le === void 0 ? (m[A].element.value = "", !1) : (m[A].element.value = L.conversion.value, !0)), K.on("execute", () => {
            K.isOn ? (K.isOn = !1, m[A].element.value = "") : (K.isOn = !0, m[A].element.value = L.conversion.value);
          });
        } else {
          let K = this._addLabeledField(L);
          m[A] = K, m[A].fieldView.bind("value").to(f, A), m[A].fieldView.element.value = f[A] || "";
        }
      else if (L.value === "urlSuffix") {
        this.urlSuffixInputView = this._addLabeledField(L), this.listenTo(
          this.urlSuffixInputView.fieldView,
          "change:isFocused",
          (le, G, he, xe) => {
            if (he !== xe && !he) {
              if (this._urlInputValue().trim() === "")
                return;
              this._applyUrlSuffix(le.source.element.value);
            }
          }
        ), this.listenTo(m.urlInputView.fieldView, "change:value", (le) => {
          this._toggleUrlSuffixInputView(
            this.urlSuffixInputView,
            le.source.isEmpty
          );
        });
        let K = !1;
        this.listenTo(
          m.urlInputView.fieldView,
          "change:isFocused",
          (le, G, he) => {
            var ze;
            const xe = this._urlInputValue().trim() === "";
            if (he && (K = xe), xe)
              return;
            const Ce = (ze = this.urlSuffixInputView) == null ? void 0 : ze.fieldView.element.value.trim();
            if (!he && K && Ce !== "" && this._getUrlSuffix() === "") {
              this._applyUrlSuffix(Ce);
              return;
            }
            this._toggleUrlSuffixInputView(
              this.urlSuffixInputView,
              le.source.isEmpty
            );
          }
        );
      }
    }
  }
  /**
   * Create a labeled field for given advanced field.
   */
  _addLabeledField(f) {
    const { formView: m } = this._linkUI;
    let k = new Wb(
      m.locale,
      qb
    );
    return k.label = f.label, f.tooltip && (k.infoText = f.tooltip), this.advancedView.advancedChildren.add(k), k;
  }
  /**
   * Populate URL suffix advanced field with content.
   * e.g. if a query string was added directly to the default URL input field,
   * ensure the value is also showing in the URL Suffix advanced field.
   */
  _toggleUrlSuffixInputView(f, m) {
    f.fieldView.set(
      "value",
      m ? "" : this._getUrlSuffix()
    );
  }
  /**
   * Get the URL field value without the {refTag} portion.
   */
  _getUrlWithoutRefTag() {
    const f = this._urlInputRefMatch(this.urlWithRefHandleRE);
    return f ? f[1] : this._urlInputValue();
  }
  /**
   * Get the query params and anchor from the URL field value.
   */
  _getUrlSuffix() {
    const f = this._getUrlWithoutRefTag();
    try {
      let m = new URL(f);
      return m.search + m.hash;
    } catch {
      let [k, T] = f.split("#"), [L, A] = k.split("?");
      return T = T ? "#" + T : "", A = A ? "?" + A : "", A + T;
    }
  }
  /**
   * Replace the query params and anchor in the URL field value with given URL suffix.
   */
  _applyUrlSuffix(f) {
    const { formView: m } = this._linkUI, k = this._getUrlWithoutRefTag();
    let T;
    try {
      let A = new URL(k);
      T = k.replace(A.hash, "").replace(A.search, "");
    } catch {
      let [K, le] = k.split("#"), [G, he] = K.split("?");
    }
    const L = this._urlInputValue().replace(
      k,
      T + f
    );
    m.urlInputView.fieldView.set("value", L);
  }
  /**
   * When link form is submitted, pass the advanced field values the link command.
   */
  _handleAdvancedLinkFieldsFormSubmit() {
    const m = this.editor.commands.get("link"), { formView: k } = this._linkUI;
    k.on(
      "submit",
      () => {
        if (!k.isValid())
          return;
        let T = this._getAdvancedFieldValues();
        m.once(
          "execute",
          (L, A) => {
            A[3] = A[3] ? Object.assign(A[3], T) : T;
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
    const f = this.editor, m = f.commands.get("link"), k = f.model.document.selection;
    this.conversionData.forEach((T) => {
      m.set(T.model, null), f.model.document.on("change", () => {
        m[T.model] = k.getAttribute(T.model);
      });
    });
  }
  /**
   * Get the values of all the advanced fields.
   */
  _getAdvancedFieldValues() {
    const { formView: f } = this._linkUI;
    let m = {};
    return this.conversionData.forEach((k) => {
      let T = [];
      k.type === "bool" ? T[k.model] = f[k.model].element.value : T[k.model] = f[k.model].fieldView.element.value, Object.assign(m, T);
    }), m;
  }
}
class Nv extends Tt {
  static get requires() {
    return [uv, hv];
  }
  static get pluginName() {
    return "CraftLink";
  }
}
var lp = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function mv(de) {
  return de && de.__esModule && Object.prototype.hasOwnProperty.call(de, "default") ? de.default : de;
}
var Oi = { exports: {} }, gv = Oi.exports, cp;
function yv() {
  return cp || (cp = 1, (function(de, f) {
    (function() {
      ((m, k = {}) => {
        if (typeof document > "u") return;
        let T = document.createElement("style");
        k.styleId && (T.id = k.styleId);
        for (let L of Object.keys(k.attributes || {})) T.setAttribute(L, k.attributes[L]);
        T.setAttribute("data-cke-inspector", "true"), T.appendChild(document.createTextNode(m)), document.head.appendChild(T);
      })(`.ck-inspector{--ck-inspector-color-tab-background-hover:#00000012;--ck-inspector-color-tab-active-border:#0dacef}.ck-inspector .ck-inspector-horizontal-nav{-webkit-user-select:none;user-select:none;flex-direction:row;align-self:stretch;display:flex}.ck-inspector .ck-inspector-horizontal-nav .ck-inspector-horizontal-nav__item{-webkit-appearance:none;background:0 0;border:0;border-bottom:2px solid #0000;align-self:stretch;padding:.5em 1em}.ck-inspector .ck-inspector-horizontal-nav .ck-inspector-horizontal-nav__item:hover{background:var(--ck-inspector-color-tab-background-hover)}.ck-inspector .ck-inspector-horizontal-nav .ck-inspector-horizontal-nav__item.ck-inspector-horizontal-nav__item_active{border-bottom-color:var(--ck-inspector-color-tab-active-border)}.ck-inspector{--ck-inspector-navbox-empty-background:#fafafa}.ck-inspector .ck-inspector-navbox{flex-direction:column;align-items:stretch;height:100%;display:flex}.ck-inspector .ck-inspector-navbox .ck-inspector-navbox__navigation{border-bottom:1px solid var(--ck-inspector-color-border);-webkit-user-select:none;user-select:none;flex-flow:row;align-items:center;width:100%;min-height:30px;max-height:30px;display:flex}.ck-inspector .ck-inspector-navbox .ck-inspector-navbox__content{flex-direction:row;height:100%;display:flex;overflow:hidden}.ck-inspector{--ck-inspector-icon-size:19px;--ck-inspector-button-size:calc(4px + var(--ck-inspector-icon-size));--ck-inspector-color-button:#777;--ck-inspector-color-button-hover:#222;--ck-inspector-color-button-on:#0f79e2}.ck-inspector .ck-inspector-button{width:var(--ck-inspector-button-size);height:var(--ck-inspector-button-size);color:var(--ck-inspector-color-button);border:0;border-radius:2px;padding:2px;overflow:hidden}.ck-inspector .ck-inspector-button.ck-inspector-button_on,.ck-inspector .ck-inspector-button.ck-inspector-button_on:hover{color:var(--ck-inspector-color-button-on);opacity:1}.ck-inspector .ck-inspector-button.ck-inspector-button_disabled{opacity:.3}.ck-inspector .ck-inspector-button>span{display:none}.ck-inspector .ck-inspector-button:hover{color:var(--ck-inspector-color-button-hover)}.ck-inspector .ck-inspector-button svg{width:var(--ck-inspector-icon-size);height:var(--ck-inspector-icon-size)}.ck-inspector .ck-inspector-button svg,.ck-inspector .ck-inspector-button svg *{fill:currentColor}.ck-inspector{--ck-inspector-explorer-width:300px}.ck-inspector .ck-inspector-pane{width:100%;display:flex}.ck-inspector .ck-inspector-pane.ck-inspector-pane_empty{background:var(--ck-inspector-navbox-empty-background);justify-content:center;align-items:center;padding:1em}.ck-inspector .ck-inspector-pane.ck-inspector-pane_empty p{text-align:center;align-self:center;width:100%}.ck-inspector .ck-inspector-pane>.ck-inspector-navbox:last-child{min-width:var(--ck-inspector-explorer-width);width:var(--ck-inspector-explorer-width)}.ck-inspector .ck-inspector-pane.ck-inspector-pane_vsplit>.ck-inspector-navbox:first-child{border-right:1px solid var(--ck-inspector-color-border);flex:auto;overflow:hidden}.ck-inspector .ck-inspector-pane.ck-inspector-pane_vsplit>.ck-inspector-navbox:first-child .ck-inspector-navbox__navigation{align-items:center}.ck-inspector .ck-inspector-pane.ck-inspector-pane_vsplit>.ck-inspector-navbox:first-child .ck-inspector-tree__config label{margin:0 .5em}.ck-inspector .ck-inspector-pane.ck-inspector-pane_vsplit>.ck-inspector-navbox:first-child .ck-inspector-tree__config input+label{margin-right:1em}.ck-inspector-side-pane{position:relative}.ck-inspector{--ck-inspector-color-tree-node-hover:#eaf2fb;--ck-inspector-color-tree-node-name:#882680;--ck-inspector-color-tree-node-attribute-name:#8a8a8a;--ck-inspector-color-tree-node-tag:#aaa;--ck-inspector-color-tree-node-attribute:#9a4819;--ck-inspector-color-tree-node-attribute-value:#2a43ac;--ck-inspector-color-tree-text-border:#b7b7b7;--ck-inspector-color-tree-node-border-hover:#b0c6e0;--ck-inspector-color-tree-content-delimiter:#ddd;--ck-inspector-color-tree-node-active-bg:#f5faff;--ck-inspector-color-tree-node-name-active-bg:#2b98f0;--ck-inspector-color-tree-node-inactive:#8a8a8a;--ck-inspector-color-tree-selection:#ff1744;--ck-inspector-color-tree-position:black;--ck-inspector-color-comment:green}.ck-inspector .ck-inspector-tree{background:var(--ck-inspector-color-white);-webkit-user-select:none;user-select:none;width:100%;height:100%;padding:1em;overflow:auto}.ck-inspector-tree .ck-inspector-tree-node__attribute{font:inherit;color:var(--ck-inspector-color-tree-node-tag);margin-left:.4em}.ck-inspector-tree .ck-inspector-tree-node__attribute .ck-inspector-tree-node__attribute__name{color:var(--ck-inspector-color-tree-node-attribute)}.ck-inspector-tree .ck-inspector-tree-node__attribute .ck-inspector-tree-node__attribute__value{color:var(--ck-inspector-color-tree-node-attribute-value)}.ck-inspector-tree .ck-inspector-tree-node__attribute .ck-inspector-tree-node__attribute__value:before{content:"=\\""}.ck-inspector-tree .ck-inspector-tree-node__attribute .ck-inspector-tree-node__attribute__value:after{content:"\\""}.ck-inspector-tree .ck-inspector-tree-node .ck-inspector-tree-node__name{color:var(--ck-inspector-color-tree-node-name);border-left:1px solid #0000;width:100%;padding:0 .1em;display:inline-block}.ck-inspector-tree .ck-inspector-tree-node .ck-inspector-tree-node__name:hover{background:var(--ck-inspector-color-tree-node-hover)}.ck-inspector-tree .ck-inspector-tree-node .ck-inspector-tree-node__content{border-left:1px solid var(--ck-inspector-color-tree-content-delimiter);white-space:pre-wrap;padding:1px .5em 1px 1.5em}.ck-inspector-tree .ck-inspector-tree-node:not(.ck-inspector-tree-node_tagless) .ck-inspector-tree-node__name>.ck-inspector-tree-node__name__bracket_open:after{content:"<";color:var(--ck-inspector-color-tree-node-tag)}.ck-inspector-tree .ck-inspector-tree-node:not(.ck-inspector-tree-node_tagless) .ck-inspector-tree-node__name .ck-inspector-tree-node__name__bracket_close:after{content:">";color:var(--ck-inspector-color-tree-node-tag)}.ck-inspector-tree .ck-inspector-tree-node:not(.ck-inspector-tree-node_tagless).ck-inspector-tree-node_empty .ck-inspector-tree-node__name:after{content:" />"}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_tagless .ck-inspector-tree-node__content{display:none}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name:not(.ck-inspector-tree-node__name_close),.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name:not(.ck-inspector-tree-node__name_close) :not(.ck-inspector-tree__position),.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name:not(.ck-inspector-tree-node__name_close)>.ck-inspector-tree-node__name__bracket:after{background:var(--ck-inspector-color-tree-node-name-active-bg);color:var(--ck-inspector-color-white)}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__content,.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name_close{background:var(--ck-inspector-color-tree-node-active-bg)}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__content{border-left-color:var(--ck-inspector-color-tree-node-name-active-bg)}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name{border-left:1px solid var(--ck-inspector-color-tree-node-name-active-bg)}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_disabled{opacity:.8}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_disabled .ck-inspector-tree-node__name,.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_disabled .ck-inspector-tree-node__name *{color:var(--ck-inspector-color-tree-node-inactive)}.ck-inspector-tree .ck-inspector-tree-text{margin-bottom:1px;display:block}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-node__content{border:1px dotted var(--ck-inspector-color-tree-text-border);word-break:break-all;border-radius:2px;margin-right:1px;padding:0 1px;display:inline-block}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes:not(:empty){margin-right:.5em}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes .ck-inspector-tree-node__attribute{background:var(--ck-inspector-color-tree-node-attribute-name);border-radius:2px;padding:0 .5em}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes .ck-inspector-tree-node__attribute+.ck-inspector-tree-node__attribute{margin-left:.2em}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes .ck-inspector-tree-node__attribute>*{color:var(--ck-inspector-color-white)}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes .ck-inspector-tree-node__attribute:first-child{margin-left:0}.ck-inspector-tree .ck-inspector-tree-text.ck-inspector-tree-node_active .ck-inspector-tree-node__content{border-style:solid;border-color:var(--ck-inspector-color-tree-node-name-active-bg)}.ck-inspector-tree .ck-inspector-tree-text.ck-inspector-tree-node_active .ck-inspector-tree-node__attribute{background:var(--ck-inspector-color-white)}.ck-inspector-tree .ck-inspector-tree-text.ck-inspector-tree-node_active .ck-inspector-tree-node__attribute>*{color:var(--ck-inspector-color-tree-node-name-active-bg)}.ck-inspector-tree .ck-inspector-tree-text.ck-inspector-tree-node_active>.ck-inspector-tree-node__content{background:var(--ck-inspector-color-tree-node-name-active-bg);color:var(--ck-inspector-color-white)}.ck-inspector-tree .ck-inspector-tree-text:not(.ck-inspector-tree-node_active) .ck-inspector-tree-node__content:hover{background:var(--ck-inspector-color-tree-node-hover);border-style:solid;border-color:var(--ck-inspector-color-tree-node-border-hover)}.ck-inspector-tree.ck-inspector-tree_text-direction_ltr .ck-inspector-tree-node__content{direction:ltr}.ck-inspector-tree.ck-inspector-tree_text-direction_rtl .ck-inspector-tree-node__content{direction:rtl}.ck-inspector-tree.ck-inspector-tree_text-direction_rtl .ck-inspector-tree-node__content .ck-inspector-tree-node__name{direction:ltr}.ck-inspector-tree.ck-inspector-tree_text-direction_rtl .ck-inspector-tree__position{transform:rotate(180deg)}.ck-inspector-tree .ck-inspector-tree-comment{color:var(--ck-inspector-color-comment);font-style:italic}.ck-inspector-tree .ck-inspector-tree-comment a{color:inherit;text-decoration:underline}.ck-inspector-tree_compact-text .ck-inspector-tree-text,.ck-inspector-tree_compact-text .ck-inspector-tree-text .ck-inspector-tree-node__content{display:inline}.ck-inspector .ck-inspector__tree__navigation{border-bottom:1px solid var(--ck-inspector-color-border);padding:.5em 1em}.ck-inspector .ck-inspector__tree__navigation label{margin-right:.5em}.ck-inspector-tree .ck-inspector-tree__position{cursor:default;pointer-events:none;vertical-align:top;height:100%;display:inline-block;position:relative}.ck-inspector-tree .ck-inspector-tree__position:after{content:"";border:1px solid var(--ck-inspector-color-tree-position);width:0;margin-left:-1px;position:absolute;top:0;bottom:0}.ck-inspector-tree .ck-inspector-tree__position:before{margin-left:-1px}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_selection{z-index:2;--ck-inspector-color-tree-position:var(--ck-inspector-color-tree-selection)}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_selection:before{content:"";border-top:2px solid var(--ck-inspector-color-tree-position);border-bottom:2px solid var(--ck-inspector-color-tree-position);width:8px;position:absolute;top:-1px;bottom:-1px;left:0}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_selection.ck-inspector-tree__position_end:before{left:auto;right:-1px}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_marker{z-index:1}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_marker:before{content:"";cursor:default;border-style:solid;border-width:7px 7px 0 0;border-color:var(--ck-inspector-color-tree-position) transparent transparent transparent;width:0;height:0;display:block;position:absolute;top:-1px;left:0}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_marker.ck-inspector-tree__position_end:before{border-width:0 7px 7px 0;border-color:transparent var(--ck-inspector-color-tree-position) transparent transparent;left:-5px}.ck-inspector .ck-inspector-checkbox{vertical-align:middle}.ck-inspector{--ck-inspector-color-property-list-property-name:#d0363f;--ck-inspector-color-property-list-property-value-true:green;--ck-inspector-color-property-list-property-value-false:red;--ck-inspector-color-property-list-property-value-unknown:#888;--ck-inspector-color-property-list-background:#f5f5f5;--ck-inspector-color-property-list-title-collapser:#727272}.ck-inspector .ck-inspector-property-list{background:var(--ck-inspector-color-white);grid-template-columns:auto 1fr;display:grid}.ck-inspector .ck-inspector-property-list>:nth-of-type(odd){background:var(--ck-inspector-color-property-list-background)}.ck-inspector .ck-inspector-property-list>:nth-of-type(2n){background:var(--ck-inspector-color-white)}.ck-inspector .ck-inspector-property-list dt{min-width:15em;padding:0 .7em 0 1.2em}.ck-inspector .ck-inspector-property-list dt.ck-inspector-property-list__title_collapsible button{vertical-align:middle;border-style:solid;border-width:3.5px 0 3.5px 6px;border-color:transparent transparent transparent var(--ck-inspector-color-property-list-title-collapser);width:0;height:0;margin-left:-9px;margin-right:.3em;transition:transform .2s ease-in-out;display:inline-block;overflow:hidden;transform:rotate(0)}.ck-inspector .ck-inspector-property-list dt.ck-inspector-property-list__title_expanded button{transform:rotate(90deg)}.ck-inspector .ck-inspector-property-list dt.ck-inspector-property-list__title_collapsed+dd+.ck-inspector-property-list{display:none}.ck-inspector .ck-inspector-property-list dt .ck-inspector-property-list__title__color-box{vertical-align:text-top;border:1px solid #000;border-radius:2px;width:12px;height:12px;margin-right:3px;display:inline-block}.ck-inspector .ck-inspector-property-list dt.ck-inspector-property-list__title_clickable label:hover{cursor:pointer;text-decoration:underline}.ck-inspector .ck-inspector-property-list dt label{color:var(--ck-inspector-color-property-list-property-name)}.ck-inspector .ck-inspector-property-list dd{padding-right:.7em}.ck-inspector .ck-inspector-property-list dd input{width:100%}.ck-inspector .ck-inspector-property-list dd input[value=false]{color:var(--ck-inspector-color-property-list-property-value-false)}.ck-inspector .ck-inspector-property-list dd input[value=true]{color:var(--ck-inspector-color-property-list-property-value-true)}.ck-inspector .ck-inspector-property-list dd input[value=undefined],.ck-inspector .ck-inspector-property-list dd input[value="function() {…}"]{color:var(--ck-inspector-color-property-list-property-value-unknown)}.ck-inspector .ck-inspector-property-list dd input[value="function() {…}"]{font-style:italic}.ck-inspector .ck-inspector-property-list .ck-inspector-property-list{background:0 0;grid-column:1/-1;margin-left:1em}.ck-inspector .ck-inspector-property-list .ck-inspector-property-list>:nth-of-type(odd),.ck-inspector .ck-inspector-property-list .ck-inspector-property-list>:nth-of-type(2n){background:0 0}.ck-inspector .ck-inspector__object-inspector{background:var(--ck-inspector-color-white);width:100%;overflow:auto}.ck-inspector .ck-inspector__object-inspector h2,.ck-inspector .ck-inspector__object-inspector h3{flex-flow:row;display:flex}.ck-inspector .ck-inspector__object-inspector h2{text-overflow:ellipsis;align-items:center;padding:1em;display:flex;overflow:hidden}.ck-inspector .ck-inspector__object-inspector h2>span{white-space:nowrap;text-overflow:ellipsis;margin-right:auto;display:block;overflow:hidden}.ck-inspector .ck-inspector__object-inspector h2>.ck-inspector-button{flex-shrink:0;margin-left:.5em}.ck-inspector .ck-inspector__object-inspector h2 a{color:var(--ck-inspector-color-tree-node-name);font-weight:700}.ck-inspector .ck-inspector__object-inspector h2 a,.ck-inspector .ck-inspector__object-inspector h2 a>*{cursor:pointer}.ck-inspector .ck-inspector__object-inspector h2 em:before,.ck-inspector .ck-inspector__object-inspector h2 em:after{content:"\\""}.ck-inspector .ck-inspector__object-inspector h3{align-items:center;padding:.4em .7em;font-size:12px;display:flex}.ck-inspector .ck-inspector__object-inspector h3 a{color:inherit;margin-right:auto;font-weight:700}.ck-inspector .ck-inspector__object-inspector h3 .ck-inspector-button{visibility:hidden}.ck-inspector .ck-inspector__object-inspector h3:hover .ck-inspector-button{visibility:visible}.ck-inspector .ck-inspector__object-inspector hr{border-top:1px solid var(--ck-inspector-color-border)}.ck-inspector-model-tree__hide-markers .ck-inspector-tree__position.ck-inspector-tree__position_marker{display:none}.ck-inspector-modal{--ck-inspector-set-data-modal-overlay:#00000080;--ck-inspector-set-data-modal-shadow:#0000000f;--ck-inspector-set-data-modal-button-background:#eee;--ck-inspector-set-data-modal-button-background-hover:#ddd;--ck-inspector-set-data-modal-save-button-background:#1976d2;--ck-inspector-set-data-modal-save-button-background-hover:#0b60b5}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal{z-index:999999;background-color:var(--ck-inspector-set-data-modal-overlay);position:fixed;inset:0}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content{border:1px solid var(--ck-inspector-color-border);background:var(--ck-inspector-color-white);box-shadow:0 1px 1px var(--ck-inspector-set-data-modal-shadow), 0 2px 2px var(--ck-inspector-set-data-modal-shadow), 0 4px 4px var(--ck-inspector-set-data-modal-shadow), 0 8px 8px var(--ck-inspector-set-data-modal-shadow), 0 16px 16px var(--ck-inspector-set-data-modal-shadow);border-radius:2px;outline:none;flex-direction:column;justify-content:space-between;width:100%;max-width:calc(100vw - 160px);height:100%;max-height:calc(100vh - 160px);display:flex;position:absolute;top:50%;left:50%;overflow:auto;transform:translate(-50%,-50%)}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content h2{background:var(--ck-inspector-color-background);border-bottom:1px solid var(--ck-inspector-color-border);margin:0;padding:12px 20px;font-size:14px;font-weight:700}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content textarea{border:1px solid var(--ck-inspector-color-border);resize:none;border-radius:2px;flex-grow:1;margin:20px;padding:10px;font-family:monospace;font-size:14px}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content button{white-space:nowrap;border:1px solid var(--ck-inspector-color-border);border-radius:2px;padding:10px 20px;font-size:14px}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content button:hover{background:var(--ck-inspector-set-data-modal-button-background-hover)}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons{justify-content:center;margin:0 20px 20px;display:flex}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button+button{margin-left:20px}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button:first-child{margin-right:auto}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button:not(:first-child){flex-basis:20%}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button:last-child{background:var(--ck-inspector-set-data-modal-save-button-background);border-color:var(--ck-inspector-set-data-modal-save-button-background);color:#fff;font-weight:700}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button:last-child:hover{background:var(--ck-inspector-set-data-modal-save-button-background-hover)}.ck-inspector .ck-inspector-editor-quick-actions{flex-flow:row;place-content:center;align-items:center;display:flex}.ck-inspector .ck-inspector-editor-quick-actions>.ck-inspector-button{margin-left:.3em}.ck-inspector .ck-inspector-editor-quick-actions>.ck-inspector-button.ck-inspector-button_data-copied{color:green;animation-name:ck-inspector-bounce-in;animation-duration:.5s}@keyframes ck-inspector-bounce-in{0%{opacity:0;transform:scale3d(.5,.5,.5)}20%{transform:scale3d(1.1,1.1,1.1)}40%{transform:scale3d(.8,.8,.8)}60%{opacity:1;transform:scale3d(1.05,1.05,1.05)}to{opacity:1;transform:scale(1)}}.ck-inspector,.ck-inspector-portal{--ck-inspector-color-white:#fff;--ck-inspector-color-black:#000;--ck-inspector-color-background:#f3f3f3;--ck-inspector-color-link:#005cc6;--ck-inspector-code-font-size:11px;--ck-inspector-code-font-family:monaco,Consolas,Lucida Console,monospace;--ck-inspector-color-border:#d0d0d0}.ck-inspector,.ck-inspector :not(select),.ck-inspector-portal,.ck-inspector-portal :not(select){box-sizing:border-box;word-wrap:break-word;-webkit-font-smoothing:auto;background:0 0;border:0;width:auto;height:auto;margin:0;padding:0;font-family:Arial,Helvetica Neue,Helvetica,sans-serif;font-size:12px;font-weight:400;line-height:17px;text-decoration:none;transition:none;position:static}.ck-inspector{border-collapse:collapse;color:var(--ck-inspector-color-black);text-align:left;white-space:normal;cursor:auto;float:none;background:var(--ck-inspector-color-background);border-top:1px solid var(--ck-inspector-color-border);z-index:9999;overflow:hidden}.ck-inspector.ck-inspector_collapsed>.ck-inspector-navbox>.ck-inspector-navbox__navigation .ck-inspector-horizontal-nav{display:none}.ck-inspector .ck-inspector-navbox__navigation__logo{text-indent:100px;white-space:nowrap;background-image:url("data:image/svg+xml;charset=UTF-8,%3csvg width='68' height='64' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='none' fill-rule='evenodd'%3e%3cpath d='M43.71 11.025a11.508 11.508 0 0 0-1.213 5.159c0 6.42 5.244 11.625 11.713 11.625.083 0 .167 0 .25-.002v16.282c0 1.955-1.05 3.761-2.756 4.739L30.986 60.7a5.548 5.548 0 0 1-5.512 0L4.756 48.828A5.464 5.464 0 0 1 2 44.089V20.344c0-1.955 1.05-3.76 2.756-4.738L25.474 3.733a5.548 5.548 0 0 1 5.512 0l12.724 7.292z' fill='%23FFF'/%3e%3cpath d='M45.684 8.79a12.604 12.604 0 0 0-1.329 5.65c0 7.032 5.744 12.733 12.829 12.733.091 0 .183-.001.274-.003v17.834c0 2.14-1.151 4.119-3.019 5.19L31.747 63.196a6.076 6.076 0 0 1-6.037 0L3.02 50.193A5.984 5.984 0 0 1 0 45.003V18.997c0-2.14 1.15-4.119 3.019-5.19L25.71.804a6.076 6.076 0 0 1 6.037 0l13.937 7.986zM16.244 20.68c-.834 0-1.51.671-1.51 1.498v.715c0 .828.676 1.498 1.51 1.498h25.489c.833 0 1.51-.67 1.51-1.498v-.715c0-.827-.677-1.498-1.51-1.498h-25.49zm0 9.227c-.834 0-1.51.671-1.51 1.498v.715c0 .828.676 1.498 1.51 1.498h18.479c.833 0 1.509-.67 1.509-1.498v-.715c0-.827-.676-1.498-1.51-1.498H16.244zm0 9.227c-.834 0-1.51.671-1.51 1.498v.715c0 .828.676 1.498 1.51 1.498h25.489c.833 0 1.51-.67 1.51-1.498v-.715c0-.827-.677-1.498-1.51-1.498h-25.49zm41.191-14.459c-5.835 0-10.565-4.695-10.565-10.486 0-5.792 4.73-10.487 10.565-10.487C63.27 3.703 68 8.398 68 14.19c0 5.791-4.73 10.486-10.565 10.486zm3.422-8.68c0-.467-.084-.875-.251-1.225a2.547 2.547 0 0 0-.686-.88 2.888 2.888 0 0 0-1.026-.531 4.418 4.418 0 0 0-1.259-.175c-.134 0-.283.006-.447.018a2.72 2.72 0 0 0-.446.07l.075-1.4h3.587v-1.8h-5.462l-.214 5.06c.319-.116.682-.21 1.089-.28.406-.071.77-.107 1.088-.107.218 0 .437.021.655.063.218.041.413.114.585.218s.313.244.422.419c.109.175.163.391.163.65 0 .424-.132.745-.396.961a1.434 1.434 0 0 1-.938.325c-.352 0-.656-.1-.912-.3-.256-.2-.43-.453-.523-.762l-1.925.588c.1.35.258.664.472.943.214.279.47.514.767.706.298.191.63.339.995.443.365.104.749.156 1.151.156.437 0 .86-.064 1.272-.193.41-.13.778-.323 1.1-.581.324-.258.582-.585.775-.981.193-.396.29-.864.29-1.405z' fill='%231EBC61' fill-rule='nonzero'/%3e%3c/g%3e%3c/svg%3e");background-position:50%;background-repeat:no-repeat;background-size:contain;align-self:center;width:1.8em;height:1.8em;margin-left:1em;margin-right:1em;display:block;overflow:hidden}.ck-inspector .ck-inspector-navbox__navigation__toggle{margin-right:1em}.ck-inspector .ck-inspector-navbox__navigation__toggle.ck-inspector-navbox__navigation__toggle_up{transform:rotate(180deg)}.ck-inspector .ck-inspector-editor-selector{margin-left:auto;margin-right:.3em}@media screen and (width<=680px){.ck-inspector .ck-inspector-editor-selector label{display:none}}.ck-inspector .ck-inspector-editor-selector select{margin-left:.5em}.ck-inspector .ck-inspector-code,.ck-inspector .ck-inspector-code *{font-size:var(--ck-inspector-code-font-size);font-family:var(--ck-inspector-code-font-family);cursor:default}.ck-inspector a{color:var(--ck-inspector-color-link);text-decoration:none}.ck-inspector a:hover{cursor:pointer;text-decoration:underline}.ck-inspector button{outline:0}.ck-inspector .ck-inspector-separator{border-right:1px solid var(--ck-inspector-color-border);vertical-align:middle;width:0;height:20px;margin:0 .5em;display:inline-block}html body.ck-inspector-body-expanded{margin-bottom:var(--ck-inspector-height)}html body.ck-inspector-body-collapsed{margin-bottom:var(--ck-inspector-collapsed-height)}.ck-inspector-wrapper *{box-sizing:border-box}
/*$vite$:1*/`, {});
    })(), (function(m, k) {
      de.exports = k();
    })(gv, function() {
      var Xi, Zi, Ji, ea, ta, na, ra;
      var m = Object.create, k = Object.defineProperty, T = Object.getOwnPropertyDescriptor, L = Object.getOwnPropertyNames, A = Object.getPrototypeOf, K = Object.prototype.hasOwnProperty, le = (n, o) => () => (n && (o = n(n = 0)), o), G = (n, o) => () => (o || (n((o = { exports: {} }).exports, o), n = null), o.exports), he = (n, o) => {
        let a = {};
        for (var l in n) k(a, l, { get: n[l], enumerable: !0 });
        return k(a, Symbol.toStringTag, { value: "Module" }), a;
      }, xe = (n, o, a, l) => {
        if (o && typeof o == "object" || typeof o == "function") for (var c = L(o), d = 0, u = c.length, y; d < u; d++) y = c[d], !K.call(n, y) && y !== a && k(n, y, { get: ((b) => o[b]).bind(null, y), enumerable: !(l = T(o, y)) || l.enumerable });
        return n;
      }, Ce = (n, o, a) => (a = n == null ? {} : m(A(n)), xe(!n || !n.__esModule ? k(a, "default", { value: n, enumerable: !0 }) : a, n)), ze = (n) => K.call(n, "module.exports") ? n["module.exports"] : xe(k({}, "__esModule", { value: !0 }), n), Ue = G(((n, o) => {
        var a = Object.getOwnPropertySymbols, l = Object.prototype.hasOwnProperty, c = Object.prototype.propertyIsEnumerable;
        function d(y) {
          if (y == null) throw TypeError("Object.assign cannot be called with null or undefined");
          return Object(y);
        }
        function u() {
          try {
            if (!Object.assign) return !1;
            var y = new String("abc");
            if (y[5] = "de", Object.getOwnPropertyNames(y)[0] === "5") return !1;
            for (var b = {}, g = 0; g < 10; g++) b["_" + String.fromCharCode(g)] = g;
            if (Object.getOwnPropertyNames(b).map(function(x) {
              return b[x];
            }).join("") !== "0123456789") return !1;
            var E = {};
            return "abcdefghijklmnopqrst".split("").forEach(function(x) {
              E[x] = x;
            }), Object.keys(Object.assign({}, E)).join("") === "abcdefghijklmnopqrst";
          } catch {
            return !1;
          }
        }
        o.exports = u() ? Object.assign : function(y, b) {
          for (var g, E = d(y), x, N = 1; N < arguments.length; N++) {
            for (var S in g = Object(arguments[N]), g) l.call(g, S) && (E[S] = g[S]);
            if (a) {
              x = a(g);
              for (var O = 0; O < x.length; O++) c.call(g, x[O]) && (E[x[O]] = g[x[O]]);
            }
          }
          return E;
        };
      })), it = G(((n) => {
        var o = Ue(), a = typeof Symbol == "function" && Symbol.for, l = a ? Symbol.for("react.element") : 60103, c = a ? Symbol.for("react.portal") : 60106, d = a ? Symbol.for("react.fragment") : 60107, u = a ? Symbol.for("react.strict_mode") : 60108, y = a ? Symbol.for("react.profiler") : 60114, b = a ? Symbol.for("react.provider") : 60109, g = a ? Symbol.for("react.context") : 60110, E = a ? Symbol.for("react.forward_ref") : 60112, x = a ? Symbol.for("react.suspense") : 60113, N = a ? Symbol.for("react.memo") : 60115, S = a ? Symbol.for("react.lazy") : 60116, O = typeof Symbol == "function" && Symbol.iterator;
        function R(C) {
          for (var U = "https://reactjs.org/docs/error-decoder.html?invariant=" + C, oe = 1; oe < arguments.length; oe++) U += "&args[]=" + encodeURIComponent(arguments[oe]);
          return "Minified React error #" + C + "; visit " + U + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
        }
        var Y = { isMounted: function() {
          return !1;
        }, enqueueForceUpdate: function() {
        }, enqueueReplaceState: function() {
        }, enqueueSetState: function() {
        } }, se = {};
        function ie(C, U, oe) {
          this.props = C, this.context = U, this.refs = se, this.updater = oe || Y;
        }
        ie.prototype.isReactComponent = {}, ie.prototype.setState = function(C, U) {
          if (typeof C != "object" && typeof C != "function" && C != null) throw Error(R(85));
          this.updater.enqueueSetState(this, C, U, "setState");
        }, ie.prototype.forceUpdate = function(C) {
          this.updater.enqueueForceUpdate(this, C, "forceUpdate");
        };
        function ae() {
        }
        ae.prototype = ie.prototype;
        function pe(C, U, oe) {
          this.props = C, this.context = U, this.refs = se, this.updater = oe || Y;
        }
        var be = pe.prototype = new ae();
        be.constructor = pe, o(be, ie.prototype), be.isPureReactComponent = !0;
        var J = { current: null }, we = Object.prototype.hasOwnProperty, z = { key: !0, ref: !0, __self: !0, __source: !0 };
        function V(C, U, oe) {
          var me, Ee = {}, Ie = null, Oe = null;
          if (U != null) for (me in U.ref !== void 0 && (Oe = U.ref), U.key !== void 0 && (Ie = "" + U.key), U) we.call(U, me) && !z.hasOwnProperty(me) && (Ee[me] = U[me]);
          var Te = arguments.length - 2;
          if (Te === 1) Ee.children = oe;
          else if (1 < Te) {
            for (var Fe = Array(Te), Qe = 0; Qe < Te; Qe++) Fe[Qe] = arguments[Qe + 2];
            Ee.children = Fe;
          }
          if (C && C.defaultProps) for (me in Te = C.defaultProps, Te) Ee[me] === void 0 && (Ee[me] = Te[me]);
          return { $$typeof: l, type: C, key: Ie, ref: Oe, props: Ee, _owner: J.current };
        }
        function te(C, U) {
          return { $$typeof: l, type: C.type, key: U, ref: C.ref, props: C.props, _owner: C._owner };
        }
        function D(C) {
          return typeof C == "object" && !!C && C.$$typeof === l;
        }
        function w(C) {
          var U = { "=": "=0", ":": "=2" };
          return "$" + ("" + C).replace(/[=:]/g, function(oe) {
            return U[oe];
          });
        }
        var M = /\/+/g, X = [];
        function ce(C, U, oe, me) {
          if (X.length) {
            var Ee = X.pop();
            return Ee.result = C, Ee.keyPrefix = U, Ee.func = oe, Ee.context = me, Ee.count = 0, Ee;
          }
          return { result: C, keyPrefix: U, func: oe, context: me, count: 0 };
        }
        function q(C) {
          C.result = null, C.keyPrefix = null, C.func = null, C.context = null, C.count = 0, 10 > X.length && X.push(C);
        }
        function ee(C, U, oe, me) {
          var Ee = typeof C;
          (Ee === "undefined" || Ee === "boolean") && (C = null);
          var Ie = !1;
          if (C === null) Ie = !0;
          else switch (Ee) {
            case "string":
            case "number":
              Ie = !0;
              break;
            case "object":
              switch (C.$$typeof) {
                case l:
                case c:
                  Ie = !0;
              }
          }
          if (Ie) return oe(me, C, U === "" ? "." + Z(C, 0) : U), 1;
          if (Ie = 0, U = U === "" ? "." : U + ":", Array.isArray(C)) for (var Oe = 0; Oe < C.length; Oe++) {
            Ee = C[Oe];
            var Te = U + Z(Ee, Oe);
            Ie += ee(Ee, Te, oe, me);
          }
          else if (typeof C != "object" || !C ? Te = null : (Te = O && C[O] || C["@@iterator"], Te = typeof Te == "function" ? Te : null), typeof Te == "function") for (C = Te.call(C), Oe = 0; !(Ee = C.next()).done; ) Ee = Ee.value, Te = U + Z(Ee, Oe++), Ie += ee(Ee, Te, oe, me);
          else if (Ee === "object") throw oe = "" + C, Error(R(31, oe === "[object Object]" ? "object with keys {" + Object.keys(C).join(", ") + "}" : oe, ""));
          return Ie;
        }
        function ye(C, U, oe) {
          return C == null ? 0 : ee(C, "", U, oe);
        }
        function Z(C, U) {
          return typeof C == "object" && C && C.key != null ? w(C.key) : U.toString(36);
        }
        function De(C, U) {
          C.func.call(C.context, U, C.count++);
        }
        function W(C, U, oe) {
          var me = C.result, Ee = C.keyPrefix;
          C = C.func.call(C.context, U, C.count++), Array.isArray(C) ? re(C, me, oe, function(Ie) {
            return Ie;
          }) : C != null && (D(C) && (C = te(C, Ee + (!C.key || U && U.key === C.key ? "" : ("" + C.key).replace(M, "$&/") + "/") + oe)), me.push(C));
        }
        function re(C, U, oe, me, Ee) {
          var Ie = "";
          oe != null && (Ie = ("" + oe).replace(M, "$&/") + "/"), U = ce(U, Ie, me, Ee), ye(C, W, U), q(U);
        }
        var ne = { current: null };
        function P() {
          var C = ne.current;
          if (C === null) throw Error(R(321));
          return C;
        }
        var B = { ReactCurrentDispatcher: ne, ReactCurrentBatchConfig: { suspense: null }, ReactCurrentOwner: J, IsSomeRendererActing: { current: !1 }, assign: o };
        n.Children = { map: function(C, U, oe) {
          if (C == null) return C;
          var me = [];
          return re(C, me, null, U, oe), me;
        }, forEach: function(C, U, oe) {
          if (C == null) return C;
          U = ce(null, null, U, oe), ye(C, De, U), q(U);
        }, count: function(C) {
          return ye(C, function() {
            return null;
          }, null);
        }, toArray: function(C) {
          var U = [];
          return re(C, U, null, function(oe) {
            return oe;
          }), U;
        }, only: function(C) {
          if (!D(C)) throw Error(R(143));
          return C;
        } }, n.Component = ie, n.Fragment = d, n.Profiler = y, n.PureComponent = pe, n.StrictMode = u, n.Suspense = x, n.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = B, n.cloneElement = function(C, U, oe) {
          if (C == null) throw Error(R(267, C));
          var me = o({}, C.props), Ee = C.key, Ie = C.ref, Oe = C._owner;
          if (U != null) {
            if (U.ref !== void 0 && (Ie = U.ref, Oe = J.current), U.key !== void 0 && (Ee = "" + U.key), C.type && C.type.defaultProps) var Te = C.type.defaultProps;
            for (Fe in U) we.call(U, Fe) && !z.hasOwnProperty(Fe) && (me[Fe] = U[Fe] === void 0 && Te !== void 0 ? Te[Fe] : U[Fe]);
          }
          var Fe = arguments.length - 2;
          if (Fe === 1) me.children = oe;
          else if (1 < Fe) {
            Te = Array(Fe);
            for (var Qe = 0; Qe < Fe; Qe++) Te[Qe] = arguments[Qe + 2];
            me.children = Te;
          }
          return { $$typeof: l, type: C.type, key: Ee, ref: Ie, props: me, _owner: Oe };
        }, n.createContext = function(C, U) {
          return U === void 0 && (U = null), C = { $$typeof: g, _calculateChangedBits: U, _currentValue: C, _currentValue2: C, _threadCount: 0, Provider: null, Consumer: null }, C.Provider = { $$typeof: b, _context: C }, C.Consumer = C;
        }, n.createElement = V, n.createFactory = function(C) {
          var U = V.bind(null, C);
          return U.type = C, U;
        }, n.createRef = function() {
          return { current: null };
        }, n.forwardRef = function(C) {
          return { $$typeof: E, render: C };
        }, n.isValidElement = D, n.lazy = function(C) {
          return { $$typeof: S, _ctor: C, _status: -1, _result: null };
        }, n.memo = function(C, U) {
          return { $$typeof: N, type: C, compare: U === void 0 ? null : U };
        }, n.useCallback = function(C, U) {
          return P().useCallback(C, U);
        }, n.useContext = function(C, U) {
          return P().useContext(C, U);
        }, n.useDebugValue = function() {
        }, n.useEffect = function(C, U) {
          return P().useEffect(C, U);
        }, n.useImperativeHandle = function(C, U, oe) {
          return P().useImperativeHandle(C, U, oe);
        }, n.useLayoutEffect = function(C, U) {
          return P().useLayoutEffect(C, U);
        }, n.useMemo = function(C, U) {
          return P().useMemo(C, U);
        }, n.useReducer = function(C, U, oe) {
          return P().useReducer(C, U, oe);
        }, n.useRef = function(C) {
          return P().useRef(C);
        }, n.useState = function(C) {
          return P().useState(C);
        }, n.version = "16.14.0";
      })), pt = G(((n, o) => {
        o.exports = it();
      })), En = G(((n) => {
        var o, a, l, c, d;
        if (typeof window > "u" || typeof MessageChannel != "function") {
          var u = null, y = null, b = function() {
            if (u !== null) try {
              var P = n.unstable_now();
              u(!0, P), u = null;
            } catch (B) {
              throw setTimeout(b, 0), B;
            }
          }, g = Date.now();
          n.unstable_now = function() {
            return Date.now() - g;
          }, o = function(P) {
            u === null ? (u = P, setTimeout(b, 0)) : setTimeout(o, 0, P);
          }, a = function(P, B) {
            y = setTimeout(P, B);
          }, l = function() {
            clearTimeout(y);
          }, c = function() {
            return !1;
          }, d = n.unstable_forceFrameRate = function() {
          };
        } else {
          var E = window.performance, x = window.Date, N = window.setTimeout, S = window.clearTimeout;
          if (typeof console < "u") {
            var O = window.cancelAnimationFrame;
            typeof window.requestAnimationFrame != "function" && console.error("This browser doesn't support requestAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills"), typeof O != "function" && console.error("This browser doesn't support cancelAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills");
          }
          if (typeof E == "object" && typeof E.now == "function") n.unstable_now = function() {
            return E.now();
          };
          else {
            var R = x.now();
            n.unstable_now = function() {
              return x.now() - R;
            };
          }
          var Y = !1, se = null, ie = -1, ae = 5, pe = 0;
          c = function() {
            return n.unstable_now() >= pe;
          }, d = function() {
          }, n.unstable_forceFrameRate = function(P) {
            0 > P || 125 < P ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing framerates higher than 125 fps is not unsupported") : ae = 0 < P ? Math.floor(1e3 / P) : 5;
          };
          var be = new MessageChannel(), J = be.port2;
          be.port1.onmessage = function() {
            if (se !== null) {
              var P = n.unstable_now();
              pe = P + ae;
              try {
                se(!0, P) ? J.postMessage(null) : (Y = !1, se = null);
              } catch (B) {
                throw J.postMessage(null), B;
              }
            } else Y = !1;
          }, o = function(P) {
            se = P, Y || (Y = !0, J.postMessage(null));
          }, a = function(P, B) {
            ie = N(function() {
              P(n.unstable_now());
            }, B);
          }, l = function() {
            S(ie), ie = -1;
          };
        }
        function we(P, B) {
          var C = P.length;
          P.push(B);
          e: for (; ; ) {
            var U = C - 1 >>> 1, oe = P[U];
            if (oe !== void 0 && 0 < te(oe, B)) P[U] = B, P[C] = oe, C = U;
            else break e;
          }
        }
        function z(P) {
          return P = P[0], P === void 0 ? null : P;
        }
        function V(P) {
          var B = P[0];
          if (B !== void 0) {
            var C = P.pop();
            if (C !== B) {
              P[0] = C;
              e: for (var U = 0, oe = P.length; U < oe; ) {
                var me = 2 * (U + 1) - 1, Ee = P[me], Ie = me + 1, Oe = P[Ie];
                if (Ee !== void 0 && 0 > te(Ee, C)) Oe !== void 0 && 0 > te(Oe, Ee) ? (P[U] = Oe, P[Ie] = C, U = Ie) : (P[U] = Ee, P[me] = C, U = me);
                else if (Oe !== void 0 && 0 > te(Oe, C)) P[U] = Oe, P[Ie] = C, U = Ie;
                else break e;
              }
            }
            return B;
          }
          return null;
        }
        function te(P, B) {
          var C = P.sortIndex - B.sortIndex;
          return C === 0 ? P.id - B.id : C;
        }
        var D = [], w = [], M = 1, X = null, ce = 3, q = !1, ee = !1, ye = !1;
        function Z(P) {
          for (var B = z(w); B !== null; ) {
            if (B.callback === null) V(w);
            else if (B.startTime <= P) V(w), B.sortIndex = B.expirationTime, we(D, B);
            else break;
            B = z(w);
          }
        }
        function De(P) {
          if (ye = !1, Z(P), !ee) if (z(D) !== null) ee = !0, o(W);
          else {
            var B = z(w);
            B !== null && a(De, B.startTime - P);
          }
        }
        function W(P, B) {
          ee = !1, ye && (ye = !1, l()), q = !0;
          var C = ce;
          try {
            for (Z(B), X = z(D); X !== null && (!(X.expirationTime > B) || P && !c()); ) {
              var U = X.callback;
              if (U !== null) {
                X.callback = null, ce = X.priorityLevel;
                var oe = U(X.expirationTime <= B);
                B = n.unstable_now(), typeof oe == "function" ? X.callback = oe : X === z(D) && V(D), Z(B);
              } else V(D);
              X = z(D);
            }
            if (X !== null) var me = !0;
            else {
              var Ee = z(w);
              Ee !== null && a(De, Ee.startTime - B), me = !1;
            }
            return me;
          } finally {
            X = null, ce = C, q = !1;
          }
        }
        function re(P) {
          switch (P) {
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
        var ne = d;
        n.unstable_IdlePriority = 5, n.unstable_ImmediatePriority = 1, n.unstable_LowPriority = 4, n.unstable_NormalPriority = 3, n.unstable_Profiling = null, n.unstable_UserBlockingPriority = 2, n.unstable_cancelCallback = function(P) {
          P.callback = null;
        }, n.unstable_continueExecution = function() {
          ee || q || (ee = !0, o(W));
        }, n.unstable_getCurrentPriorityLevel = function() {
          return ce;
        }, n.unstable_getFirstCallbackNode = function() {
          return z(D);
        }, n.unstable_next = function(P) {
          switch (ce) {
            case 1:
            case 2:
            case 3:
              var B = 3;
              break;
            default:
              B = ce;
          }
          var C = ce;
          ce = B;
          try {
            return P();
          } finally {
            ce = C;
          }
        }, n.unstable_pauseExecution = function() {
        }, n.unstable_requestPaint = ne, n.unstable_runWithPriority = function(P, B) {
          switch (P) {
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
              break;
            default:
              P = 3;
          }
          var C = ce;
          ce = P;
          try {
            return B();
          } finally {
            ce = C;
          }
        }, n.unstable_scheduleCallback = function(P, B, C) {
          var U = n.unstable_now();
          if (typeof C == "object" && C) {
            var oe = C.delay;
            oe = typeof oe == "number" && 0 < oe ? U + oe : U, C = typeof C.timeout == "number" ? C.timeout : re(P);
          } else C = re(P), oe = U;
          return C = oe + C, P = { id: M++, callback: B, priorityLevel: P, startTime: oe, expirationTime: C, sortIndex: -1 }, oe > U ? (P.sortIndex = oe, we(w, P), z(D) === null && P === z(w) && (ye ? l() : ye = !0, a(De, oe - U))) : (P.sortIndex = C, we(D, P), ee || q || (ee = !0, o(W))), P;
        }, n.unstable_shouldYield = function() {
          var P = n.unstable_now();
          Z(P);
          var B = z(D);
          return B !== X && X !== null && B !== null && B.callback !== null && B.startTime <= P && B.expirationTime < X.expirationTime || c();
        }, n.unstable_wrapCallback = function(P) {
          var B = ce;
          return function() {
            var C = ce;
            ce = B;
            try {
              return P.apply(this, arguments);
            } finally {
              ce = C;
            }
          };
        };
      })), Ht = G(((n, o) => {
        o.exports = En();
      })), Et = G(((n) => {
        var o = pt(), a = Ue(), l = Ht();
        function c(e) {
          for (var t = "https://reactjs.org/docs/error-decoder.html?invariant=" + e, r = 1; r < arguments.length; r++) t += "&args[]=" + encodeURIComponent(arguments[r]);
          return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
        }
        if (!o) throw Error(c(227));
        function d(e, t, r, i, s, p, h, _, F) {
          var H = Array.prototype.slice.call(arguments, 3);
          try {
            t.apply(r, H);
          } catch (ge) {
            this.onError(ge);
          }
        }
        var u = !1, y = null, b = !1, g = null, E = { onError: function(e) {
          u = !0, y = e;
        } };
        function x(e, t, r, i, s, p, h, _, F) {
          u = !1, y = null, d.apply(E, arguments);
        }
        function N(e, t, r, i, s, p, h, _, F) {
          if (x.apply(this, arguments), u) {
            if (u) {
              var H = y;
              u = !1, y = null;
            } else throw Error(c(198));
            b || (b = !0, g = H);
          }
        }
        var S = null, O = null, R = null;
        function Y(e, t, r) {
          var i = e.type || "unknown-event";
          e.currentTarget = R(r), N(i, t, void 0, e), e.currentTarget = null;
        }
        var se = null, ie = {};
        function ae() {
          if (se) for (var e in ie) {
            var t = ie[e], r = se.indexOf(e);
            if (!(-1 < r)) throw Error(c(96, e));
            if (!be[r]) {
              if (!t.extractEvents) throw Error(c(97, e));
              for (var i in be[r] = t, r = t.eventTypes, r) {
                var s = void 0, p = r[i], h = t, _ = i;
                if (J.hasOwnProperty(_)) throw Error(c(99, _));
                J[_] = p;
                var F = p.phasedRegistrationNames;
                if (F) {
                  for (s in F) F.hasOwnProperty(s) && pe(F[s], h, _);
                  s = !0;
                } else p.registrationName ? (pe(p.registrationName, h, _), s = !0) : s = !1;
                if (!s) throw Error(c(98, i, e));
              }
            }
          }
        }
        function pe(e, t, r) {
          if (we[e]) throw Error(c(100, e));
          we[e] = t, z[e] = t.eventTypes[r].dependencies;
        }
        var be = [], J = {}, we = {}, z = {};
        function V(e) {
          var t = !1, r;
          for (r in e) if (e.hasOwnProperty(r)) {
            var i = e[r];
            if (!ie.hasOwnProperty(r) || ie[r] !== i) {
              if (ie[r]) throw Error(c(102, r));
              ie[r] = i, t = !0;
            }
          }
          t && ae();
        }
        var te = !(typeof window > "u" || window.document === void 0 || window.document.createElement === void 0), D = null, w = null, M = null;
        function X(e) {
          if (e = O(e)) {
            if (typeof D != "function") throw Error(c(280));
            var t = e.stateNode;
            t && (t = S(t), D(e.stateNode, e.type, t));
          }
        }
        function ce(e) {
          w ? M ? M.push(e) : M = [e] : w = e;
        }
        function q() {
          if (w) {
            var e = w, t = M;
            if (M = w = null, X(e), t) for (e = 0; e < t.length; e++) X(t[e]);
          }
        }
        function ee(e, t) {
          return e(t);
        }
        function ye(e, t, r, i, s) {
          return e(t, r, i, s);
        }
        function Z() {
        }
        var De = ee, W = !1, re = !1;
        function ne() {
          (w !== null || M !== null) && (Z(), q());
        }
        function P(e, t, r) {
          if (re) return e(t, r);
          re = !0;
          try {
            return De(e, t, r);
          } finally {
            re = !1, ne();
          }
        }
        var B = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, C = Object.prototype.hasOwnProperty, U = {}, oe = {};
        function me(e) {
          return C.call(oe, e) ? !0 : C.call(U, e) ? !1 : B.test(e) ? oe[e] = !0 : (U[e] = !0, !1);
        }
        function Ee(e, t, r, i) {
          if (r !== null && r.type === 0) return !1;
          switch (typeof t) {
            case "function":
            case "symbol":
              return !0;
            case "boolean":
              return i ? !1 : r === null ? (e = e.toLowerCase().slice(0, 5), e !== "data-" && e !== "aria-") : !r.acceptsBooleans;
            default:
              return !1;
          }
        }
        function Ie(e, t, r, i) {
          if (t == null || Ee(e, t, r, i)) return !0;
          if (i) return !1;
          if (r !== null) switch (r.type) {
            case 3:
              return !t;
            case 4:
              return t === !1;
            case 5:
              return isNaN(t);
            case 6:
              return isNaN(t) || 1 > t;
          }
          return !1;
        }
        function Oe(e, t, r, i, s, p) {
          this.acceptsBooleans = t === 2 || t === 3 || t === 4, this.attributeName = i, this.attributeNamespace = s, this.mustUseProperty = r, this.propertyName = e, this.type = t, this.sanitizeURL = p;
        }
        var Te = {};
        "children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(e) {
          Te[e] = new Oe(e, 0, !1, e, null, !1);
        }), [["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(e) {
          var t = e[0];
          Te[t] = new Oe(t, 1, !1, e[1], null, !1);
        }), ["contentEditable", "draggable", "spellCheck", "value"].forEach(function(e) {
          Te[e] = new Oe(e, 2, !1, e.toLowerCase(), null, !1);
        }), ["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(e) {
          Te[e] = new Oe(e, 2, !1, e, null, !1);
        }), "allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(e) {
          Te[e] = new Oe(e, 3, !1, e.toLowerCase(), null, !1);
        }), ["checked", "multiple", "muted", "selected"].forEach(function(e) {
          Te[e] = new Oe(e, 3, !0, e, null, !1);
        }), ["capture", "download"].forEach(function(e) {
          Te[e] = new Oe(e, 4, !1, e, null, !1);
        }), ["cols", "rows", "size", "span"].forEach(function(e) {
          Te[e] = new Oe(e, 6, !1, e, null, !1);
        }), ["rowSpan", "start"].forEach(function(e) {
          Te[e] = new Oe(e, 5, !1, e.toLowerCase(), null, !1);
        });
        var Fe = /[\-:]([a-z])/g;
        function Qe(e) {
          return e[1].toUpperCase();
        }
        "accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e) {
          var t = e.replace(Fe, Qe);
          Te[t] = new Oe(t, 1, !1, e, null, !1);
        }), "xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e) {
          var t = e.replace(Fe, Qe);
          Te[t] = new Oe(t, 1, !1, e, "http://www.w3.org/1999/xlink", !1);
        }), ["xml:base", "xml:lang", "xml:space"].forEach(function(e) {
          var t = e.replace(Fe, Qe);
          Te[t] = new Oe(t, 1, !1, e, "http://www.w3.org/XML/1998/namespace", !1);
        }), ["tabIndex", "crossOrigin"].forEach(function(e) {
          Te[e] = new Oe(e, 1, !1, e.toLowerCase(), null, !1);
        }), Te.xlinkHref = new Oe("xlinkHref", 1, !1, "xlink:href", "http://www.w3.org/1999/xlink", !0), ["src", "href", "action", "formAction"].forEach(function(e) {
          Te[e] = new Oe(e, 1, !1, e.toLowerCase(), null, !0);
        });
        var Ye = o.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
        Ye.hasOwnProperty("ReactCurrentDispatcher") || (Ye.ReactCurrentDispatcher = { current: null }), Ye.hasOwnProperty("ReactCurrentBatchConfig") || (Ye.ReactCurrentBatchConfig = { suspense: null });
        function nn(e, t, r, i) {
          var s = Te.hasOwnProperty(t) ? Te[t] : null;
          (s === null ? !i && !(!(2 < t.length) || t[0] !== "o" && t[0] !== "O" || t[1] !== "n" && t[1] !== "N") : s.type === 0) || (Ie(t, r, s, i) && (r = null), i || s === null ? me(t) && (r === null ? e.removeAttribute(t) : e.setAttribute(t, "" + r)) : s.mustUseProperty ? e[s.propertyName] = r === null ? s.type === 3 ? !1 : "" : r : (t = s.attributeName, i = s.attributeNamespace, r === null ? e.removeAttribute(t) : (s = s.type, r = s === 3 || s === 4 && r === !0 ? "" : "" + r, i ? e.setAttributeNS(i, t, r) : e.setAttribute(t, r))));
        }
        var xo = /^(.*)[\\\/]/, lt = typeof Symbol == "function" && Symbol.for, Co = lt ? Symbol.for("react.element") : 60103, Xn = lt ? Symbol.for("react.portal") : 60106, On = lt ? Symbol.for("react.fragment") : 60107, Cc = lt ? Symbol.for("react.strict_mode") : 60108, So = lt ? Symbol.for("react.profiler") : 60114, Sc = lt ? Symbol.for("react.provider") : 60109, Tc = lt ? Symbol.for("react.context") : 60110, Bg = lt ? Symbol.for("react.concurrent_mode") : 60111, oa = lt ? Symbol.for("react.forward_ref") : 60112, To = lt ? Symbol.for("react.suspense") : 60113, ia = lt ? Symbol.for("react.suspense_list") : 60120, aa = lt ? Symbol.for("react.memo") : 60115, Oc = lt ? Symbol.for("react.lazy") : 60116, Nc = lt ? Symbol.for("react.block") : 60121, Pc = typeof Symbol == "function" && Symbol.iterator;
        function Er(e) {
          return typeof e != "object" || !e ? null : (e = Pc && e[Pc] || e["@@iterator"], typeof e == "function" ? e : null);
        }
        function Wg(e) {
          if (e._status === -1) {
            e._status = 0;
            var t = e._ctor;
            t = t(), e._result = t, t.then(function(r) {
              e._status === 0 && (r = r.default, e._status = 1, e._result = r);
            }, function(r) {
              e._status === 0 && (e._status = 2, e._result = r);
            });
          }
        }
        function Wt(e) {
          if (e == null) return null;
          if (typeof e == "function") return e.displayName || e.name || null;
          if (typeof e == "string") return e;
          switch (e) {
            case On:
              return "Fragment";
            case Xn:
              return "Portal";
            case So:
              return "Profiler";
            case Cc:
              return "StrictMode";
            case To:
              return "Suspense";
            case ia:
              return "SuspenseList";
          }
          if (typeof e == "object") switch (e.$$typeof) {
            case Tc:
              return "Context.Consumer";
            case Sc:
              return "Context.Provider";
            case oa:
              var t = e.render;
              return t = t.displayName || t.name || "", e.displayName || (t === "" ? "ForwardRef" : "ForwardRef(" + t + ")");
            case aa:
              return Wt(e.type);
            case Nc:
              return Wt(e.render);
            case Oc:
              if (e = e._status === 1 ? e._result : null) return Wt(e);
          }
          return null;
        }
        function sa(e) {
          var t = "";
          do {
            e: switch (e.tag) {
              case 3:
              case 4:
              case 6:
              case 7:
              case 10:
              case 9:
                var r = "";
                break e;
              default:
                var i = e._debugOwner, s = e._debugSource, p = Wt(e.type);
                r = null, i && (r = Wt(i.type)), i = p, p = "", s ? p = " (at " + s.fileName.replace(xo, "") + ":" + s.lineNumber + ")" : r && (p = " (created by " + r + ")"), r = `
    in ` + (i || "Unknown") + p;
            }
            t += r, e = e.return;
          } while (e);
          return t;
        }
        function rn(e) {
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
        function Dc(e) {
          var t = e.type;
          return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
        }
        function qg(e) {
          var t = Dc(e) ? "checked" : "value", r = Object.getOwnPropertyDescriptor(e.constructor.prototype, t), i = "" + e[t];
          if (!e.hasOwnProperty(t) && r !== void 0 && typeof r.get == "function" && typeof r.set == "function") {
            var s = r.get, p = r.set;
            return Object.defineProperty(e, t, { configurable: !0, get: function() {
              return s.call(this);
            }, set: function(h) {
              i = "" + h, p.call(this, h);
            } }), Object.defineProperty(e, t, { enumerable: r.enumerable }), { getValue: function() {
              return i;
            }, setValue: function(h) {
              i = "" + h;
            }, stopTracking: function() {
              e._valueTracker = null, delete e[t];
            } };
          }
        }
        function Oo(e) {
          e._valueTracker || (e._valueTracker = qg(e));
        }
        function Ic(e) {
          if (!e) return !1;
          var t = e._valueTracker;
          if (!t) return !0;
          var r = t.getValue(), i = "";
          return e && (i = Dc(e) ? e.checked ? "true" : "false" : e.value), e = i, e === r ? !1 : (t.setValue(e), !0);
        }
        function la(e, t) {
          var r = t.checked;
          return a({}, t, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: r ?? e._wrapperState.initialChecked });
        }
        function Rc(e, t) {
          var r = t.defaultValue == null ? "" : t.defaultValue, i = t.checked == null ? t.defaultChecked : t.checked;
          r = rn(t.value == null ? r : t.value), e._wrapperState = { initialChecked: i, initialValue: r, controlled: t.type === "checkbox" || t.type === "radio" ? t.checked != null : t.value != null };
        }
        function Mc(e, t) {
          t = t.checked, t != null && nn(e, "checked", t, !1);
        }
        function ca(e, t) {
          Mc(e, t);
          var r = rn(t.value), i = t.type;
          if (r != null) i === "number" ? (r === 0 && e.value === "" || e.value != r) && (e.value = "" + r) : e.value !== "" + r && (e.value = "" + r);
          else if (i === "submit" || i === "reset") {
            e.removeAttribute("value");
            return;
          }
          t.hasOwnProperty("value") ? ua(e, t.type, r) : t.hasOwnProperty("defaultValue") && ua(e, t.type, rn(t.defaultValue)), t.checked == null && t.defaultChecked != null && (e.defaultChecked = !!t.defaultChecked);
        }
        function Ac(e, t, r) {
          if (t.hasOwnProperty("value") || t.hasOwnProperty("defaultValue")) {
            var i = t.type;
            if (!(i !== "submit" && i !== "reset" || t.value !== void 0 && t.value !== null)) return;
            t = "" + e._wrapperState.initialValue, r || t === e.value || (e.value = t), e.defaultValue = t;
          }
          r = e.name, r !== "" && (e.name = ""), e.defaultChecked = !!e._wrapperState.initialChecked, r !== "" && (e.name = r);
        }
        function ua(e, t, r) {
          (t !== "number" || e.ownerDocument.activeElement !== e) && (r == null ? e.defaultValue = "" + e._wrapperState.initialValue : e.defaultValue !== "" + r && (e.defaultValue = "" + r));
        }
        function Kg(e) {
          var t = "";
          return o.Children.forEach(e, function(r) {
            r != null && (t += r);
          }), t;
        }
        function da(e, t) {
          return e = a({ children: void 0 }, t), (t = Kg(t.children)) && (e.children = t), e;
        }
        function Zn(e, t, r, i) {
          if (e = e.options, t) {
            t = {};
            for (var s = 0; s < r.length; s++) t["$" + r[s]] = !0;
            for (r = 0; r < e.length; r++) s = t.hasOwnProperty("$" + e[r].value), e[r].selected !== s && (e[r].selected = s), s && i && (e[r].defaultSelected = !0);
          } else {
            for (r = "" + rn(r), t = null, s = 0; s < e.length; s++) {
              if (e[s].value === r) {
                e[s].selected = !0, i && (e[s].defaultSelected = !0);
                return;
              }
              t !== null || e[s].disabled || (t = e[s]);
            }
            t !== null && (t.selected = !0);
          }
        }
        function pa(e, t) {
          if (t.dangerouslySetInnerHTML != null) throw Error(c(91));
          return a({}, t, { value: void 0, defaultValue: void 0, children: "" + e._wrapperState.initialValue });
        }
        function zc(e, t) {
          var r = t.value;
          if (r == null) {
            if (r = t.children, t = t.defaultValue, r != null) {
              if (t != null) throw Error(c(92));
              if (Array.isArray(r)) {
                if (!(1 >= r.length)) throw Error(c(93));
                r = r[0];
              }
              t = r;
            }
            t ?? (t = ""), r = t;
          }
          e._wrapperState = { initialValue: rn(r) };
        }
        function jc(e, t) {
          var r = rn(t.value), i = rn(t.defaultValue);
          r != null && (r = "" + r, r !== e.value && (e.value = r), t.defaultValue == null && e.defaultValue !== r && (e.defaultValue = r)), i != null && (e.defaultValue = "" + i);
        }
        function Lc(e) {
          var t = e.textContent;
          t === e._wrapperState.initialValue && t !== "" && t !== null && (e.value = t);
        }
        var Uc = { html: "http://www.w3.org/1999/xhtml", svg: "http://www.w3.org/2000/svg" };
        function Vc(e) {
          switch (e) {
            case "svg":
              return "http://www.w3.org/2000/svg";
            case "math":
              return "http://www.w3.org/1998/Math/MathML";
            default:
              return "http://www.w3.org/1999/xhtml";
          }
        }
        function fa(e, t) {
          return e == null || e === "http://www.w3.org/1999/xhtml" ? Vc(t) : e === "http://www.w3.org/2000/svg" && t === "foreignObject" ? "http://www.w3.org/1999/xhtml" : e;
        }
        var ha, Fc = (function(e) {
          return typeof MSApp < "u" && MSApp.execUnsafeLocalFunction ? function(t, r, i, s) {
            MSApp.execUnsafeLocalFunction(function() {
              return e(t, r, i, s);
            });
          } : e;
        })(function(e, t) {
          if (e.namespaceURI !== Uc.svg || "innerHTML" in e) e.innerHTML = t;
          else {
            for (ha || (ha = document.createElement("div")), ha.innerHTML = "<svg>" + t.valueOf().toString() + "</svg>", t = ha.firstChild; e.firstChild; ) e.removeChild(e.firstChild);
            for (; t.firstChild; ) e.appendChild(t.firstChild);
          }
        });
        function _r(e, t) {
          if (t) {
            var r = e.firstChild;
            if (r && r === e.lastChild && r.nodeType === 3) {
              r.nodeValue = t;
              return;
            }
          }
          e.textContent = t;
        }
        function No(e, t) {
          var r = {};
          return r[e.toLowerCase()] = t.toLowerCase(), r["Webkit" + e] = "webkit" + t, r["Moz" + e] = "moz" + t, r;
        }
        var Jn = { animationend: No("Animation", "AnimationEnd"), animationiteration: No("Animation", "AnimationIteration"), animationstart: No("Animation", "AnimationStart"), transitionend: No("Transition", "TransitionEnd") }, ma = {}, $c = {};
        te && ($c = document.createElement("div").style, "AnimationEvent" in window || (delete Jn.animationend.animation, delete Jn.animationiteration.animation, delete Jn.animationstart.animation), "TransitionEvent" in window || delete Jn.transitionend.transition);
        function Po(e) {
          if (ma[e]) return ma[e];
          if (!Jn[e]) return e;
          var t = Jn[e], r;
          for (r in t) if (t.hasOwnProperty(r) && r in $c) return ma[e] = t[r];
          return e;
        }
        var Hc = Po("animationend"), Bc = Po("animationiteration"), Wc = Po("animationstart"), qc = Po("transitionend"), xr = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), Kc = new (typeof WeakMap == "function" ? WeakMap : Map)();
        function ga(e) {
          var t = Kc.get(e);
          return t === void 0 && (t = /* @__PURE__ */ new Map(), Kc.set(e, t)), t;
        }
        function Nn(e) {
          var t = e, r = e;
          if (e.alternate) for (; t.return; ) t = t.return;
          else {
            e = t;
            do
              t = e, t.effectTag & 1026 && (r = t.return), e = t.return;
            while (e);
          }
          return t.tag === 3 ? r : null;
        }
        function Qc(e) {
          if (e.tag === 13) {
            var t = e.memoizedState;
            if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
          }
          return null;
        }
        function Yc(e) {
          if (Nn(e) !== e) throw Error(c(188));
        }
        function Qg(e) {
          var t = e.alternate;
          if (!t) {
            if (t = Nn(e), t === null) throw Error(c(188));
            return t === e ? e : null;
          }
          for (var r = e, i = t; ; ) {
            var s = r.return;
            if (s === null) break;
            var p = s.alternate;
            if (p === null) {
              if (i = s.return, i !== null) {
                r = i;
                continue;
              }
              break;
            }
            if (s.child === p.child) {
              for (p = s.child; p; ) {
                if (p === r) return Yc(s), e;
                if (p === i) return Yc(s), t;
                p = p.sibling;
              }
              throw Error(c(188));
            }
            if (r.return !== i.return) r = s, i = p;
            else {
              for (var h = !1, _ = s.child; _; ) {
                if (_ === r) {
                  h = !0, r = s, i = p;
                  break;
                }
                if (_ === i) {
                  h = !0, i = s, r = p;
                  break;
                }
                _ = _.sibling;
              }
              if (!h) {
                for (_ = p.child; _; ) {
                  if (_ === r) {
                    h = !0, r = p, i = s;
                    break;
                  }
                  if (_ === i) {
                    h = !0, i = p, r = s;
                    break;
                  }
                  _ = _.sibling;
                }
                if (!h) throw Error(c(189));
              }
            }
            if (r.alternate !== i) throw Error(c(190));
          }
          if (r.tag !== 3) throw Error(c(188));
          return r.stateNode.current === r ? e : t;
        }
        function Gc(e) {
          if (e = Qg(e), !e) return null;
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
        function er(e, t) {
          if (t == null) throw Error(c(30));
          return e == null ? t : Array.isArray(e) ? Array.isArray(t) ? (e.push.apply(e, t), e) : (e.push(t), e) : Array.isArray(t) ? [e].concat(t) : [e, t];
        }
        function ya(e, t, r) {
          Array.isArray(e) ? e.forEach(t, r) : e && t.call(r, e);
        }
        var Cr = null;
        function Yg(e) {
          if (e) {
            var t = e._dispatchListeners, r = e._dispatchInstances;
            if (Array.isArray(t)) for (var i = 0; i < t.length && !e.isPropagationStopped(); i++) Y(e, t[i], r[i]);
            else t && Y(e, t, r);
            e._dispatchListeners = null, e._dispatchInstances = null, e.isPersistent() || e.constructor.release(e);
          }
        }
        function Do(e) {
          if (e !== null && (Cr = er(Cr, e)), e = Cr, Cr = null, e) {
            if (ya(e, Yg), Cr) throw Error(c(95));
            if (b) throw e = g, b = !1, g = null, e;
          }
        }
        function ba(e) {
          return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
        }
        function Xc(e) {
          if (!te) return !1;
          e = "on" + e;
          var t = e in document;
          return t || (t = (t = document.createElement("div"), t.setAttribute(e, "return;"), typeof t[e] == "function")), t;
        }
        var Io = [];
        function Zc(e) {
          e.topLevelType = null, e.nativeEvent = null, e.targetInst = null, e.ancestors.length = 0, 10 > Io.length && Io.push(e);
        }
        function Jc(e, t, r, i) {
          if (Io.length) {
            var s = Io.pop();
            return s.topLevelType = e, s.eventSystemFlags = i, s.nativeEvent = t, s.targetInst = r, s;
          }
          return { topLevelType: e, eventSystemFlags: i, nativeEvent: t, targetInst: r, ancestors: [] };
        }
        function eu(e) {
          var t = e.targetInst, r = t;
          do {
            if (!r) {
              e.ancestors.push(r);
              break;
            }
            var i = r;
            if (i.tag === 3) i = i.stateNode.containerInfo;
            else {
              for (; i.return; ) i = i.return;
              i = i.tag === 3 ? i.stateNode.containerInfo : null;
            }
            if (!i) break;
            t = r.tag, t !== 5 && t !== 6 || e.ancestors.push(r), r = Mr(i);
          } while (r);
          for (r = 0; r < e.ancestors.length; r++) {
            t = e.ancestors[r];
            var s = ba(e.nativeEvent);
            i = e.topLevelType;
            var p = e.nativeEvent, h = e.eventSystemFlags;
            r === 0 && (h |= 64);
            for (var _ = null, F = 0; F < be.length; F++) {
              var H = be[F];
              H && (H = H.extractEvents(i, t, p, s, h)) && (_ = er(_, H));
            }
            Do(_);
          }
        }
        function va(e, t, r) {
          if (!r.has(e)) {
            switch (e) {
              case "scroll":
                Dr(t, "scroll", !0);
                break;
              case "focus":
              case "blur":
                Dr(t, "focus", !0), Dr(t, "blur", !0), r.set("blur", null), r.set("focus", null);
                break;
              case "cancel":
              case "close":
                Xc(e) && Dr(t, e, !0);
                break;
              case "invalid":
              case "submit":
              case "reset":
                break;
              default:
                xr.indexOf(e) === -1 && He(e, t);
            }
            r.set(e, null);
          }
        }
        var tu, ka, nu, wa = !1, At = [], on = null, an = null, sn = null, Sr = /* @__PURE__ */ new Map(), Tr = /* @__PURE__ */ new Map(), Or = [], Ea = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput close cancel copy cut paste click change contextmenu reset submit".split(" "), Gg = "focus blur dragenter dragleave mouseover mouseout pointerover pointerout gotpointercapture lostpointercapture".split(" ");
        function Xg(e, t) {
          var r = ga(t);
          Ea.forEach(function(i) {
            va(i, t, r);
          }), Gg.forEach(function(i) {
            va(i, t, r);
          });
        }
        function _a(e, t, r, i, s) {
          return { blockedOn: e, topLevelType: t, eventSystemFlags: r | 32, nativeEvent: s, container: i };
        }
        function ru(e, t) {
          switch (e) {
            case "focus":
            case "blur":
              on = null;
              break;
            case "dragenter":
            case "dragleave":
              an = null;
              break;
            case "mouseover":
            case "mouseout":
              sn = null;
              break;
            case "pointerover":
            case "pointerout":
              Sr.delete(t.pointerId);
              break;
            case "gotpointercapture":
            case "lostpointercapture":
              Tr.delete(t.pointerId);
          }
        }
        function Nr(e, t, r, i, s, p) {
          return e === null || e.nativeEvent !== p ? (e = _a(t, r, i, s, p), t !== null && (t = Ar(t), t !== null && ka(t)), e) : (e.eventSystemFlags |= i, e);
        }
        function Zg(e, t, r, i, s) {
          switch (t) {
            case "focus":
              return on = Nr(on, e, t, r, i, s), !0;
            case "dragenter":
              return an = Nr(an, e, t, r, i, s), !0;
            case "mouseover":
              return sn = Nr(sn, e, t, r, i, s), !0;
            case "pointerover":
              var p = s.pointerId;
              return Sr.set(p, Nr(Sr.get(p) || null, e, t, r, i, s)), !0;
            case "gotpointercapture":
              return p = s.pointerId, Tr.set(p, Nr(Tr.get(p) || null, e, t, r, i, s)), !0;
          }
          return !1;
        }
        function Jg(e) {
          var t = Mr(e.target);
          if (t !== null) {
            var r = Nn(t);
            if (r !== null) {
              if (t = r.tag, t === 13) {
                if (t = Qc(r), t !== null) {
                  e.blockedOn = t, l.unstable_runWithPriority(e.priority, function() {
                    nu(r);
                  });
                  return;
                }
              } else if (t === 3 && r.stateNode.hydrate) {
                e.blockedOn = r.tag === 3 ? r.stateNode.containerInfo : null;
                return;
              }
            }
          }
          e.blockedOn = null;
        }
        function Ro(e) {
          if (e.blockedOn !== null) return !1;
          var t = Ta(e.topLevelType, e.eventSystemFlags, e.container, e.nativeEvent);
          if (t !== null) {
            var r = Ar(t);
            return r !== null && ka(r), e.blockedOn = t, !1;
          }
          return !0;
        }
        function ou(e, t, r) {
          Ro(e) && r.delete(t);
        }
        function ey() {
          for (wa = !1; 0 < At.length; ) {
            var e = At[0];
            if (e.blockedOn !== null) {
              e = Ar(e.blockedOn), e !== null && tu(e);
              break;
            }
            var t = Ta(e.topLevelType, e.eventSystemFlags, e.container, e.nativeEvent);
            t === null ? At.shift() : e.blockedOn = t;
          }
          on !== null && Ro(on) && (on = null), an !== null && Ro(an) && (an = null), sn !== null && Ro(sn) && (sn = null), Sr.forEach(ou), Tr.forEach(ou);
        }
        function Pr(e, t) {
          e.blockedOn === t && (e.blockedOn = null, wa || (wa = !0, l.unstable_scheduleCallback(l.unstable_NormalPriority, ey)));
        }
        function iu(e) {
          function t(s) {
            return Pr(s, e);
          }
          if (0 < At.length) {
            Pr(At[0], e);
            for (var r = 1; r < At.length; r++) {
              var i = At[r];
              i.blockedOn === e && (i.blockedOn = null);
            }
          }
          for (on !== null && Pr(on, e), an !== null && Pr(an, e), sn !== null && Pr(sn, e), Sr.forEach(t), Tr.forEach(t), r = 0; r < Or.length; r++) i = Or[r], i.blockedOn === e && (i.blockedOn = null);
          for (; 0 < Or.length && (r = Or[0], r.blockedOn === null); ) Jg(r), r.blockedOn === null && Or.shift();
        }
        var au = {}, su = /* @__PURE__ */ new Map(), xa = /* @__PURE__ */ new Map(), ty = ["abort", "abort", Hc, "animationEnd", Bc, "animationIteration", Wc, "animationStart", "canplay", "canPlay", "canplaythrough", "canPlayThrough", "durationchange", "durationChange", "emptied", "emptied", "encrypted", "encrypted", "ended", "ended", "error", "error", "gotpointercapture", "gotPointerCapture", "load", "load", "loadeddata", "loadedData", "loadedmetadata", "loadedMetadata", "loadstart", "loadStart", "lostpointercapture", "lostPointerCapture", "playing", "playing", "progress", "progress", "seeking", "seeking", "stalled", "stalled", "suspend", "suspend", "timeupdate", "timeUpdate", qc, "transitionEnd", "waiting", "waiting"];
        function Ca(e, t) {
          for (var r = 0; r < e.length; r += 2) {
            var i = e[r], s = e[r + 1], p = "on" + (s[0].toUpperCase() + s.slice(1));
            p = { phasedRegistrationNames: { bubbled: p, captured: p + "Capture" }, dependencies: [i], eventPriority: t }, xa.set(i, t), su.set(i, p), au[s] = p;
          }
        }
        Ca("blur blur cancel cancel click click close close contextmenu contextMenu copy copy cut cut auxclick auxClick dblclick doubleClick dragend dragEnd dragstart dragStart drop drop focus focus input input invalid invalid keydown keyDown keypress keyPress keyup keyUp mousedown mouseDown mouseup mouseUp paste paste pause pause play play pointercancel pointerCancel pointerdown pointerDown pointerup pointerUp ratechange rateChange reset reset seeked seeked submit submit touchcancel touchCancel touchend touchEnd touchstart touchStart volumechange volumeChange".split(" "), 0), Ca("drag drag dragenter dragEnter dragexit dragExit dragleave dragLeave dragover dragOver mousemove mouseMove mouseout mouseOut mouseover mouseOver pointermove pointerMove pointerout pointerOut pointerover pointerOver scroll scroll toggle toggle touchmove touchMove wheel wheel".split(" "), 1), Ca(ty, 2);
        for (var lu = "change selectionchange textInput compositionstart compositionend compositionupdate".split(" "), Sa = 0; Sa < lu.length; Sa++) xa.set(lu[Sa], 0);
        var ny = l.unstable_UserBlockingPriority, ry = l.unstable_runWithPriority, Mo = !0;
        function He(e, t) {
          Dr(t, e, !1);
        }
        function Dr(e, t, r) {
          var i = xa.get(t);
          switch (i === void 0 ? 2 : i) {
            case 0:
              i = oy.bind(null, t, 1, e);
              break;
            case 1:
              i = iy.bind(null, t, 1, e);
              break;
            default:
              i = Ao.bind(null, t, 1, e);
          }
          r ? e.addEventListener(t, i, !0) : e.addEventListener(t, i, !1);
        }
        function oy(e, t, r, i) {
          W || Z();
          var s = Ao, p = W;
          W = !0;
          try {
            ye(s, e, t, r, i);
          } finally {
            (W = p) || ne();
          }
        }
        function iy(e, t, r, i) {
          ry(ny, Ao.bind(null, e, t, r, i));
        }
        function Ao(e, t, r, i) {
          if (Mo) if (0 < At.length && -1 < Ea.indexOf(e)) e = _a(null, e, t, r, i), At.push(e);
          else {
            var s = Ta(e, t, r, i);
            if (s === null) ru(e, i);
            else if (-1 < Ea.indexOf(e)) e = _a(s, e, t, r, i), At.push(e);
            else if (!Zg(s, e, t, r, i)) {
              ru(e, i), e = Jc(e, i, null, t);
              try {
                P(eu, e);
              } finally {
                Zc(e);
              }
            }
          }
        }
        function Ta(e, t, r, i) {
          if (r = ba(i), r = Mr(r), r !== null) {
            var s = Nn(r);
            if (s === null) r = null;
            else {
              var p = s.tag;
              if (p === 13) {
                if (r = Qc(s), r !== null) return r;
                r = null;
              } else if (p === 3) {
                if (s.stateNode.hydrate) return s.tag === 3 ? s.stateNode.containerInfo : null;
                r = null;
              } else s !== r && (r = null);
            }
          }
          e = Jc(e, i, r, t);
          try {
            P(eu, e);
          } finally {
            Zc(e);
          }
          return null;
        }
        var Ir = { animationIterationCount: !0, borderImageOutset: !0, borderImageSlice: !0, borderImageWidth: !0, boxFlex: !0, boxFlexGroup: !0, boxOrdinalGroup: !0, columnCount: !0, columns: !0, flex: !0, flexGrow: !0, flexPositive: !0, flexShrink: !0, flexNegative: !0, flexOrder: !0, gridArea: !0, gridRow: !0, gridRowEnd: !0, gridRowSpan: !0, gridRowStart: !0, gridColumn: !0, gridColumnEnd: !0, gridColumnSpan: !0, gridColumnStart: !0, fontWeight: !0, lineClamp: !0, lineHeight: !0, opacity: !0, order: !0, orphans: !0, tabSize: !0, widows: !0, zIndex: !0, zoom: !0, fillOpacity: !0, floodOpacity: !0, stopOpacity: !0, strokeDasharray: !0, strokeDashoffset: !0, strokeMiterlimit: !0, strokeOpacity: !0, strokeWidth: !0 }, ay = ["Webkit", "ms", "Moz", "O"];
        Object.keys(Ir).forEach(function(e) {
          ay.forEach(function(t) {
            t = t + e.charAt(0).toUpperCase() + e.substring(1), Ir[t] = Ir[e];
          });
        });
        function cu(e, t, r) {
          return t == null || typeof t == "boolean" || t === "" ? "" : r || typeof t != "number" || t === 0 || Ir.hasOwnProperty(e) && Ir[e] ? ("" + t).trim() : t + "px";
        }
        function uu(e, t) {
          for (var r in e = e.style, t) if (t.hasOwnProperty(r)) {
            var i = r.indexOf("--") === 0, s = cu(r, t[r], i);
            r === "float" && (r = "cssFloat"), i ? e.setProperty(r, s) : e[r] = s;
          }
        }
        var sy = a({ menuitem: !0 }, { area: !0, base: !0, br: !0, col: !0, embed: !0, hr: !0, img: !0, input: !0, keygen: !0, link: !0, meta: !0, param: !0, source: !0, track: !0, wbr: !0 });
        function Oa(e, t) {
          if (t) {
            if (sy[e] && (t.children != null || t.dangerouslySetInnerHTML != null)) throw Error(c(137, e, ""));
            if (t.dangerouslySetInnerHTML != null) {
              if (t.children != null) throw Error(c(60));
              if (!(typeof t.dangerouslySetInnerHTML == "object" && "__html" in t.dangerouslySetInnerHTML)) throw Error(c(61));
            }
            if (t.style != null && typeof t.style != "object") throw Error(c(62, ""));
          }
        }
        function Na(e, t) {
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
        var du = Uc.html;
        function qt(e, t) {
          e = e.nodeType === 9 || e.nodeType === 11 ? e : e.ownerDocument;
          var r = ga(e);
          t = z[t];
          for (var i = 0; i < t.length; i++) va(t[i], e, r);
        }
        function zo() {
        }
        function Pa(e) {
          if (e || (e = typeof document < "u" ? document : void 0), e === void 0) return null;
          try {
            return e.activeElement || e.body;
          } catch {
            return e.body;
          }
        }
        function pu(e) {
          for (; e && e.firstChild; ) e = e.firstChild;
          return e;
        }
        function fu(e, t) {
          var r = pu(e);
          e = 0;
          for (var i; r; ) {
            if (r.nodeType === 3) {
              if (i = e + r.textContent.length, e <= t && i >= t) return { node: r, offset: t - e };
              e = i;
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
            r = pu(r);
          }
        }
        function hu(e, t) {
          return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? hu(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
        }
        function mu() {
          for (var e = window, t = Pa(); t instanceof e.HTMLIFrameElement; ) {
            try {
              var r = typeof t.contentWindow.location.href == "string";
            } catch {
              r = !1;
            }
            if (r) e = t.contentWindow;
            else break;
            t = Pa(e.document);
          }
          return t;
        }
        function Da(e) {
          var t = e && e.nodeName && e.nodeName.toLowerCase();
          return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
        }
        var gu = "$", yu = "/$", Ia = "$?", Ra = "$!", Ma = null, Aa = null;
        function bu(e, t) {
          switch (e) {
            case "button":
            case "input":
            case "select":
            case "textarea":
              return !!t.autoFocus;
          }
          return !1;
        }
        function za(e, t) {
          return e === "textarea" || e === "option" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
        }
        var ja = typeof setTimeout == "function" ? setTimeout : void 0, ly = typeof clearTimeout == "function" ? clearTimeout : void 0;
        function tr(e) {
          for (; e != null; e = e.nextSibling) {
            var t = e.nodeType;
            if (t === 1 || t === 3) break;
          }
          return e;
        }
        function vu(e) {
          e = e.previousSibling;
          for (var t = 0; e; ) {
            if (e.nodeType === 8) {
              var r = e.data;
              if (r === gu || r === Ra || r === Ia) {
                if (t === 0) return e;
                t--;
              } else r === yu && t++;
            }
            e = e.previousSibling;
          }
          return null;
        }
        var La = Math.random().toString(36).slice(2), ln = "__reactInternalInstance$" + La, jo = "__reactEventHandlers$" + La, Rr = "__reactContainere$" + La;
        function Mr(e) {
          var t = e[ln];
          if (t) return t;
          for (var r = e.parentNode; r; ) {
            if (t = r[Rr] || r[ln]) {
              if (r = t.alternate, t.child !== null || r !== null && r.child !== null) for (e = vu(e); e !== null; ) {
                if (r = e[ln]) return r;
                e = vu(e);
              }
              return t;
            }
            e = r, r = e.parentNode;
          }
          return null;
        }
        function Ar(e) {
          return e = e[ln] || e[Rr], !e || e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3 ? null : e;
        }
        function Pn(e) {
          if (e.tag === 5 || e.tag === 6) return e.stateNode;
          throw Error(c(33));
        }
        function Ua(e) {
          return e[jo] || null;
        }
        function Kt(e) {
          do
            e = e.return;
          while (e && e.tag !== 5);
          return e || null;
        }
        function ku(e, t) {
          var r = e.stateNode;
          if (!r) return null;
          var i = S(r);
          if (!i) return null;
          r = i[t];
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
              (i = !i.disabled) || (e = e.type, i = !(e === "button" || e === "input" || e === "select" || e === "textarea")), e = !i;
              break e;
            default:
              e = !1;
          }
          if (e) return null;
          if (r && typeof r != "function") throw Error(c(231, t, typeof r));
          return r;
        }
        function wu(e, t, r) {
          (t = ku(e, r.dispatchConfig.phasedRegistrationNames[t])) && (r._dispatchListeners = er(r._dispatchListeners, t), r._dispatchInstances = er(r._dispatchInstances, e));
        }
        function cy(e) {
          if (e && e.dispatchConfig.phasedRegistrationNames) {
            for (var t = e._targetInst, r = []; t; ) r.push(t), t = Kt(t);
            for (t = r.length; 0 < t--; ) wu(r[t], "captured", e);
            for (t = 0; t < r.length; t++) wu(r[t], "bubbled", e);
          }
        }
        function Va(e, t, r) {
          e && r && r.dispatchConfig.registrationName && (t = ku(e, r.dispatchConfig.registrationName)) && (r._dispatchListeners = er(r._dispatchListeners, t), r._dispatchInstances = er(r._dispatchInstances, e));
        }
        function uy(e) {
          e && e.dispatchConfig.registrationName && Va(e._targetInst, null, e);
        }
        function nr(e) {
          ya(e, cy);
        }
        var cn = null, Fa = null, Lo = null;
        function Eu() {
          if (Lo) return Lo;
          var e, t = Fa, r = t.length, i, s = "value" in cn ? cn.value : cn.textContent, p = s.length;
          for (e = 0; e < r && t[e] === s[e]; e++) ;
          var h = r - e;
          for (i = 1; i <= h && t[r - i] === s[p - i]; i++) ;
          return Lo = s.slice(e, 1 < i ? 1 - i : void 0);
        }
        function Uo() {
          return !0;
        }
        function Vo() {
          return !1;
        }
        function yt(e, t, r, i) {
          for (var s in this.dispatchConfig = e, this._targetInst = t, this.nativeEvent = r, e = this.constructor.Interface, e) e.hasOwnProperty(s) && ((t = e[s]) ? this[s] = t(r) : s === "target" ? this.target = i : this[s] = r[s]);
          return this.isDefaultPrevented = (r.defaultPrevented == null ? r.returnValue === !1 : r.defaultPrevented) ? Uo : Vo, this.isPropagationStopped = Vo, this;
        }
        a(yt.prototype, { preventDefault: function() {
          this.defaultPrevented = !0;
          var e = this.nativeEvent;
          e && (e.preventDefault ? e.preventDefault() : typeof e.returnValue != "unknown" && (e.returnValue = !1), this.isDefaultPrevented = Uo);
        }, stopPropagation: function() {
          var e = this.nativeEvent;
          e && (e.stopPropagation ? e.stopPropagation() : typeof e.cancelBubble != "unknown" && (e.cancelBubble = !0), this.isPropagationStopped = Uo);
        }, persist: function() {
          this.isPersistent = Uo;
        }, isPersistent: Vo, destructor: function() {
          var e = this.constructor.Interface, t;
          for (t in e) this[t] = null;
          this.nativeEvent = this._targetInst = this.dispatchConfig = null, this.isPropagationStopped = this.isDefaultPrevented = Vo, this._dispatchInstances = this._dispatchListeners = null;
        } }), yt.Interface = { type: null, target: null, currentTarget: function() {
          return null;
        }, eventPhase: null, bubbles: null, cancelable: null, timeStamp: function(e) {
          return e.timeStamp || Date.now();
        }, defaultPrevented: null, isTrusted: null }, yt.extend = function(e) {
          function t() {
          }
          function r() {
            return i.apply(this, arguments);
          }
          var i = this;
          t.prototype = i.prototype;
          var s = new t();
          return a(s, r.prototype), r.prototype = s, r.prototype.constructor = r, r.Interface = a({}, i.Interface, e), r.extend = i.extend, _u(r), r;
        }, _u(yt);
        function dy(e, t, r, i) {
          if (this.eventPool.length) {
            var s = this.eventPool.pop();
            return this.call(s, e, t, r, i), s;
          }
          return new this(e, t, r, i);
        }
        function py(e) {
          if (!(e instanceof this)) throw Error(c(279));
          e.destructor(), 10 > this.eventPool.length && this.eventPool.push(e);
        }
        function _u(e) {
          e.eventPool = [], e.getPooled = dy, e.release = py;
        }
        var fy = yt.extend({ data: null }), hy = yt.extend({ data: null }), my = [9, 13, 27, 32], $a = te && "CompositionEvent" in window, zr = null;
        te && "documentMode" in document && (zr = document.documentMode);
        var gy = te && "TextEvent" in window && !zr, xu = te && (!$a || zr && 8 < zr && 11 >= zr), Cu = " ", Qt = { beforeInput: { phasedRegistrationNames: { bubbled: "onBeforeInput", captured: "onBeforeInputCapture" }, dependencies: ["compositionend", "keypress", "textInput", "paste"] }, compositionEnd: { phasedRegistrationNames: { bubbled: "onCompositionEnd", captured: "onCompositionEndCapture" }, dependencies: "blur compositionend keydown keypress keyup mousedown".split(" ") }, compositionStart: { phasedRegistrationNames: { bubbled: "onCompositionStart", captured: "onCompositionStartCapture" }, dependencies: "blur compositionstart keydown keypress keyup mousedown".split(" ") }, compositionUpdate: { phasedRegistrationNames: { bubbled: "onCompositionUpdate", captured: "onCompositionUpdateCapture" }, dependencies: "blur compositionupdate keydown keypress keyup mousedown".split(" ") } }, Su = !1;
        function Tu(e, t) {
          switch (e) {
            case "keyup":
              return my.indexOf(t.keyCode) !== -1;
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
        function Ou(e) {
          return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
        }
        var rr = !1;
        function yy(e, t) {
          switch (e) {
            case "compositionend":
              return Ou(t);
            case "keypress":
              return t.which === 32 ? (Su = !0, Cu) : null;
            case "textInput":
              return e = t.data, e === Cu && Su ? null : e;
            default:
              return null;
          }
        }
        function by(e, t) {
          if (rr) return e === "compositionend" || !$a && Tu(e, t) ? (e = Eu(), Lo = Fa = cn = null, rr = !1, e) : null;
          switch (e) {
            case "paste":
              return null;
            case "keypress":
              if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
                if (t.char && 1 < t.char.length) return t.char;
                if (t.which) return String.fromCharCode(t.which);
              }
              return null;
            case "compositionend":
              return xu && t.locale !== "ko" ? null : t.data;
            default:
              return null;
          }
        }
        var vy = { eventTypes: Qt, extractEvents: function(e, t, r, i) {
          var s;
          if ($a) e: {
            switch (e) {
              case "compositionstart":
                var p = Qt.compositionStart;
                break e;
              case "compositionend":
                p = Qt.compositionEnd;
                break e;
              case "compositionupdate":
                p = Qt.compositionUpdate;
                break e;
            }
            p = void 0;
          }
          else rr ? Tu(e, r) && (p = Qt.compositionEnd) : e === "keydown" && r.keyCode === 229 && (p = Qt.compositionStart);
          return p ? (xu && r.locale !== "ko" && (rr || p !== Qt.compositionStart ? p === Qt.compositionEnd && rr && (s = Eu()) : (cn = i, Fa = "value" in cn ? cn.value : cn.textContent, rr = !0)), p = fy.getPooled(p, t, r, i), s ? p.data = s : (s = Ou(r), s !== null && (p.data = s)), nr(p), s = p) : s = null, (e = gy ? yy(e, r) : by(e, r)) ? (t = hy.getPooled(Qt.beforeInput, t, r, i), t.data = e, nr(t)) : t = null, s === null ? t : t === null ? s : [s, t];
        } }, ky = { color: !0, date: !0, datetime: !0, "datetime-local": !0, email: !0, month: !0, number: !0, password: !0, range: !0, search: !0, tel: !0, text: !0, time: !0, url: !0, week: !0 };
        function Nu(e) {
          var t = e && e.nodeName && e.nodeName.toLowerCase();
          return t === "input" ? !!ky[e.type] : t === "textarea";
        }
        var Pu = { change: { phasedRegistrationNames: { bubbled: "onChange", captured: "onChangeCapture" }, dependencies: "blur change click focus input keydown keyup selectionchange".split(" ") } };
        function Du(e, t, r) {
          return e = yt.getPooled(Pu.change, e, t, r), e.type = "change", ce(r), nr(e), e;
        }
        var jr = null, Lr = null;
        function wy(e) {
          Do(e);
        }
        function Fo(e) {
          if (Ic(Pn(e))) return e;
        }
        function Ey(e, t) {
          if (e === "change") return t;
        }
        var Ha = !1;
        te && (Ha = Xc("input") && (!document.documentMode || 9 < document.documentMode));
        function Iu() {
          jr && (jr.detachEvent("onpropertychange", Ru), Lr = jr = null);
        }
        function Ru(e) {
          if (e.propertyName === "value" && Fo(Lr)) if (e = Du(Lr, e, ba(e)), W) Do(e);
          else {
            W = !0;
            try {
              ee(wy, e);
            } finally {
              W = !1, ne();
            }
          }
        }
        function _y(e, t, r) {
          e === "focus" ? (Iu(), jr = t, Lr = r, jr.attachEvent("onpropertychange", Ru)) : e === "blur" && Iu();
        }
        function xy(e) {
          if (e === "selectionchange" || e === "keyup" || e === "keydown") return Fo(Lr);
        }
        function Cy(e, t) {
          if (e === "click") return Fo(t);
        }
        function Sy(e, t) {
          if (e === "input" || e === "change") return Fo(t);
        }
        var Ty = { eventTypes: Pu, _isInputEventSupported: Ha, extractEvents: function(e, t, r, i) {
          var s = t ? Pn(t) : window, p = s.nodeName && s.nodeName.toLowerCase();
          if (p === "select" || p === "input" && s.type === "file") var h = Ey;
          else if (Nu(s)) if (Ha) h = Sy;
          else {
            h = xy;
            var _ = _y;
          }
          else (p = s.nodeName) && p.toLowerCase() === "input" && (s.type === "checkbox" || s.type === "radio") && (h = Cy);
          if (h && (h = h(e, t))) return Du(h, r, i);
          _ && _(e, s, t), e === "blur" && (e = s._wrapperState) && e.controlled && s.type === "number" && ua(s, "number", s.value);
        } }, Ur = yt.extend({ view: null, detail: null }), Oy = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
        function Ny(e) {
          var t = this.nativeEvent;
          return t.getModifierState ? t.getModifierState(e) : (e = Oy[e]) ? !!t[e] : !1;
        }
        function Ba() {
          return Ny;
        }
        var Mu = 0, Au = 0, zu = !1, ju = !1, Vr = Ur.extend({ screenX: null, screenY: null, clientX: null, clientY: null, pageX: null, pageY: null, ctrlKey: null, shiftKey: null, altKey: null, metaKey: null, getModifierState: Ba, button: null, buttons: null, relatedTarget: function(e) {
          return e.relatedTarget || (e.fromElement === e.srcElement ? e.toElement : e.fromElement);
        }, movementX: function(e) {
          if ("movementX" in e) return e.movementX;
          var t = Mu;
          return Mu = e.screenX, zu ? e.type === "mousemove" ? e.screenX - t : 0 : (zu = !0, 0);
        }, movementY: function(e) {
          if ("movementY" in e) return e.movementY;
          var t = Au;
          return Au = e.screenY, ju ? e.type === "mousemove" ? e.screenY - t : 0 : (ju = !0, 0);
        } }), Lu = Vr.extend({ pointerId: null, width: null, height: null, pressure: null, tangentialPressure: null, tiltX: null, tiltY: null, twist: null, pointerType: null, isPrimary: null }), Fr = { mouseEnter: { registrationName: "onMouseEnter", dependencies: ["mouseout", "mouseover"] }, mouseLeave: { registrationName: "onMouseLeave", dependencies: ["mouseout", "mouseover"] }, pointerEnter: { registrationName: "onPointerEnter", dependencies: ["pointerout", "pointerover"] }, pointerLeave: { registrationName: "onPointerLeave", dependencies: ["pointerout", "pointerover"] } }, Py = { eventTypes: Fr, extractEvents: function(e, t, r, i, s) {
          var p = e === "mouseover" || e === "pointerover", h = e === "mouseout" || e === "pointerout";
          if (p && !(s & 32) && (r.relatedTarget || r.fromElement) || !h && !p) return null;
          if (p = i.window === i ? i : (p = i.ownerDocument) ? p.defaultView || p.parentWindow : window, h) {
            if (h = t, t = (t = r.relatedTarget || r.toElement) ? Mr(t) : null, t !== null) {
              var _ = Nn(t);
              (t !== _ || t.tag !== 5 && t.tag !== 6) && (t = null);
            }
          } else h = null;
          if (h === t) return null;
          if (e === "mouseout" || e === "mouseover") var F = Vr, H = Fr.mouseLeave, ge = Fr.mouseEnter, ve = "mouse";
          else (e === "pointerout" || e === "pointerover") && (F = Lu, H = Fr.pointerLeave, ge = Fr.pointerEnter, ve = "pointer");
          if (e = h == null ? p : Pn(h), p = t == null ? p : Pn(t), H = F.getPooled(H, h, r, i), H.type = ve + "leave", H.target = e, H.relatedTarget = p, r = F.getPooled(ge, t, r, i), r.type = ve + "enter", r.target = p, r.relatedTarget = e, i = h, ve = t, i && ve) e: {
            for (F = i, ge = ve, h = 0, e = F; e; e = Kt(e)) h++;
            for (e = 0, t = ge; t; t = Kt(t)) e++;
            for (; 0 < h - e; ) F = Kt(F), h--;
            for (; 0 < e - h; ) ge = Kt(ge), e--;
            for (; h--; ) {
              if (F === ge || F === ge.alternate) break e;
              F = Kt(F), ge = Kt(ge);
            }
            F = null;
          }
          else F = null;
          for (ge = F, F = []; i && i !== ge && (h = i.alternate, !(h !== null && h === ge)); ) F.push(i), i = Kt(i);
          for (i = []; ve && ve !== ge && (h = ve.alternate, !(h !== null && h === ge)); ) i.push(ve), ve = Kt(ve);
          for (ve = 0; ve < F.length; ve++) Va(F[ve], "bubbled", H);
          for (ve = i.length; 0 < ve--; ) Va(i[ve], "captured", r);
          return s & 64 ? [H, r] : [H];
        } };
        function Dy(e, t) {
          return e === t && (e !== 0 || 1 / e == 1 / t) || e !== e && t !== t;
        }
        var Dn = typeof Object.is == "function" ? Object.is : Dy, Iy = Object.prototype.hasOwnProperty;
        function $r(e, t) {
          if (Dn(e, t)) return !0;
          if (typeof e != "object" || !e || typeof t != "object" || !t) return !1;
          var r = Object.keys(e), i = Object.keys(t);
          if (r.length !== i.length) return !1;
          for (i = 0; i < r.length; i++) if (!Iy.call(t, r[i]) || !Dn(e[r[i]], t[r[i]])) return !1;
          return !0;
        }
        var Ry = te && "documentMode" in document && 11 >= document.documentMode, Uu = { select: { phasedRegistrationNames: { bubbled: "onSelect", captured: "onSelectCapture" }, dependencies: "blur contextmenu dragend focus keydown keyup mousedown mouseup selectionchange".split(" ") } }, or = null, Wa = null, Hr = null, qa = !1;
        function Vu(e, t) {
          var r = t.window === t ? t.document : t.nodeType === 9 ? t : t.ownerDocument;
          return qa || or == null || or !== Pa(r) ? null : (r = or, "selectionStart" in r && Da(r) ? r = { start: r.selectionStart, end: r.selectionEnd } : (r = (r.ownerDocument && r.ownerDocument.defaultView || window).getSelection(), r = { anchorNode: r.anchorNode, anchorOffset: r.anchorOffset, focusNode: r.focusNode, focusOffset: r.focusOffset }), Hr && $r(Hr, r) ? null : (Hr = r, e = yt.getPooled(Uu.select, Wa, e, t), e.type = "select", e.target = or, nr(e), e));
        }
        var My = { eventTypes: Uu, extractEvents: function(e, t, r, i, s, p) {
          if (s = p || (i.window === i ? i.document : i.nodeType === 9 ? i : i.ownerDocument), !(p = !s)) {
            e: {
              s = ga(s), p = z.onSelect;
              for (var h = 0; h < p.length; h++) if (!s.has(p[h])) {
                s = !1;
                break e;
              }
              s = !0;
            }
            p = !s;
          }
          if (p) return null;
          switch (s = t ? Pn(t) : window, e) {
            case "focus":
              (Nu(s) || s.contentEditable === "true") && (or = s, Wa = t, Hr = null);
              break;
            case "blur":
              Hr = Wa = or = null;
              break;
            case "mousedown":
              qa = !0;
              break;
            case "contextmenu":
            case "mouseup":
            case "dragend":
              return qa = !1, Vu(r, i);
            case "selectionchange":
              if (Ry) break;
            case "keydown":
            case "keyup":
              return Vu(r, i);
          }
          return null;
        } }, Ay = yt.extend({ animationName: null, elapsedTime: null, pseudoElement: null }), zy = yt.extend({ clipboardData: function(e) {
          return "clipboardData" in e ? e.clipboardData : window.clipboardData;
        } }), jy = Ur.extend({ relatedTarget: null });
        function $o(e) {
          var t = e.keyCode;
          return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
        }
        var Ly = { Esc: "Escape", Spacebar: " ", Left: "ArrowLeft", Up: "ArrowUp", Right: "ArrowRight", Down: "ArrowDown", Del: "Delete", Win: "OS", Menu: "ContextMenu", Apps: "ContextMenu", Scroll: "ScrollLock", MozPrintableKey: "Unidentified" }, Uy = { 8: "Backspace", 9: "Tab", 12: "Clear", 13: "Enter", 16: "Shift", 17: "Control", 18: "Alt", 19: "Pause", 20: "CapsLock", 27: "Escape", 32: " ", 33: "PageUp", 34: "PageDown", 35: "End", 36: "Home", 37: "ArrowLeft", 38: "ArrowUp", 39: "ArrowRight", 40: "ArrowDown", 45: "Insert", 46: "Delete", 112: "F1", 113: "F2", 114: "F3", 115: "F4", 116: "F5", 117: "F6", 118: "F7", 119: "F8", 120: "F9", 121: "F10", 122: "F11", 123: "F12", 144: "NumLock", 145: "ScrollLock", 224: "Meta" }, Vy = Ur.extend({ key: function(e) {
          if (e.key) {
            var t = Ly[e.key] || e.key;
            if (t !== "Unidentified") return t;
          }
          return e.type === "keypress" ? (e = $o(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? Uy[e.keyCode] || "Unidentified" : "";
        }, location: null, ctrlKey: null, shiftKey: null, altKey: null, metaKey: null, repeat: null, locale: null, getModifierState: Ba, charCode: function(e) {
          return e.type === "keypress" ? $o(e) : 0;
        }, keyCode: function(e) {
          return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
        }, which: function(e) {
          return e.type === "keypress" ? $o(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
        } }), Fy = Vr.extend({ dataTransfer: null }), $y = Ur.extend({ touches: null, targetTouches: null, changedTouches: null, altKey: null, metaKey: null, ctrlKey: null, shiftKey: null, getModifierState: Ba }), Hy = yt.extend({ propertyName: null, elapsedTime: null, pseudoElement: null }), By = Vr.extend({ deltaX: function(e) {
          return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
        }, deltaY: function(e) {
          return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
        }, deltaZ: null, deltaMode: null }), Wy = { eventTypes: au, extractEvents: function(e, t, r, i) {
          var s = su.get(e);
          if (!s) return null;
          switch (e) {
            case "keypress":
              if ($o(r) === 0) return null;
            case "keydown":
            case "keyup":
              e = Vy;
              break;
            case "blur":
            case "focus":
              e = jy;
              break;
            case "click":
              if (r.button === 2) return null;
            case "auxclick":
            case "dblclick":
            case "mousedown":
            case "mousemove":
            case "mouseup":
            case "mouseout":
            case "mouseover":
            case "contextmenu":
              e = Vr;
              break;
            case "drag":
            case "dragend":
            case "dragenter":
            case "dragexit":
            case "dragleave":
            case "dragover":
            case "dragstart":
            case "drop":
              e = Fy;
              break;
            case "touchcancel":
            case "touchend":
            case "touchmove":
            case "touchstart":
              e = $y;
              break;
            case Hc:
            case Bc:
            case Wc:
              e = Ay;
              break;
            case qc:
              e = Hy;
              break;
            case "scroll":
              e = Ur;
              break;
            case "wheel":
              e = By;
              break;
            case "copy":
            case "cut":
            case "paste":
              e = zy;
              break;
            case "gotpointercapture":
            case "lostpointercapture":
            case "pointercancel":
            case "pointerdown":
            case "pointermove":
            case "pointerout":
            case "pointerover":
            case "pointerup":
              e = Lu;
              break;
            default:
              e = yt;
          }
          return t = e.getPooled(s, t, r, i), nr(t), t;
        } };
        if (se) throw Error(c(101));
        se = Array.prototype.slice.call("ResponderEventPlugin SimpleEventPlugin EnterLeaveEventPlugin ChangeEventPlugin SelectEventPlugin BeforeInputEventPlugin".split(" ")), ae();
        var qy = Ar;
        S = Ua, O = qy, R = Pn, V({ SimpleEventPlugin: Wy, EnterLeaveEventPlugin: Py, ChangeEventPlugin: Ty, SelectEventPlugin: My, BeforeInputEventPlugin: vy });
        var Ka = [], ir = -1;
        function $e(e) {
          0 > ir || (e.current = Ka[ir], Ka[ir] = null, ir--);
        }
        function qe(e, t) {
          ir++, Ka[ir] = e.current, e.current = t;
        }
        var un = {}, ct = { current: un }, ft = { current: !1 }, In = un;
        function ar(e, t) {
          var r = e.type.contextTypes;
          if (!r) return un;
          var i = e.stateNode;
          if (i && i.__reactInternalMemoizedUnmaskedChildContext === t) return i.__reactInternalMemoizedMaskedChildContext;
          var s = {}, p;
          for (p in r) s[p] = t[p];
          return i && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = t, e.__reactInternalMemoizedMaskedChildContext = s), s;
        }
        function ht(e) {
          return e = e.childContextTypes, e != null;
        }
        function Ho() {
          $e(ft), $e(ct);
        }
        function Fu(e, t, r) {
          if (ct.current !== un) throw Error(c(168));
          qe(ct, t), qe(ft, r);
        }
        function $u(e, t, r) {
          var i = e.stateNode;
          if (e = t.childContextTypes, typeof i.getChildContext != "function") return r;
          for (var s in i = i.getChildContext(), i) if (!(s in e)) throw Error(c(108, Wt(t) || "Unknown", s));
          return a({}, r, {}, i);
        }
        function Bo(e) {
          return e = (e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext || un, In = ct.current, qe(ct, e), qe(ft, ft.current), !0;
        }
        function Hu(e, t, r) {
          var i = e.stateNode;
          if (!i) throw Error(c(169));
          r ? (e = $u(e, t, In), i.__reactInternalMemoizedMergedChildContext = e, $e(ft), $e(ct), qe(ct, e)) : $e(ft), qe(ft, r);
        }
        var Ky = l.unstable_runWithPriority, Qa = l.unstable_scheduleCallback, Bu = l.unstable_cancelCallback, Wu = l.unstable_requestPaint, Ya = l.unstable_now, Qy = l.unstable_getCurrentPriorityLevel, Wo = l.unstable_ImmediatePriority, qu = l.unstable_UserBlockingPriority, Ku = l.unstable_NormalPriority, Qu = l.unstable_LowPriority, Yu = l.unstable_IdlePriority, Gu = {}, Yy = l.unstable_shouldYield, Gy = Wu === void 0 ? function() {
        } : Wu, Yt = null, qo = null, Ga = !1, Xu = Ya(), _t = 1e4 > Xu ? Ya : function() {
          return Ya() - Xu;
        };
        function Ko() {
          switch (Qy()) {
            case Wo:
              return 99;
            case qu:
              return 98;
            case Ku:
              return 97;
            case Qu:
              return 96;
            case Yu:
              return 95;
            default:
              throw Error(c(332));
          }
        }
        function Zu(e) {
          switch (e) {
            case 99:
              return Wo;
            case 98:
              return qu;
            case 97:
              return Ku;
            case 96:
              return Qu;
            case 95:
              return Yu;
            default:
              throw Error(c(332));
          }
        }
        function dn(e, t) {
          return e = Zu(e), Ky(e, t);
        }
        function Ju(e, t, r) {
          return e = Zu(e), Qa(e, t, r);
        }
        function ed(e) {
          return Yt === null ? (Yt = [e], qo = Qa(Wo, td)) : Yt.push(e), Gu;
        }
        function zt() {
          if (qo !== null) {
            var e = qo;
            qo = null, Bu(e);
          }
          td();
        }
        function td() {
          if (!Ga && Yt !== null) {
            Ga = !0;
            var e = 0;
            try {
              var t = Yt;
              dn(99, function() {
                for (; e < t.length; e++) {
                  var r = t[e];
                  do
                    r = r(!0);
                  while (r !== null);
                }
              }), Yt = null;
            } catch (r) {
              throw Yt !== null && (Yt = Yt.slice(e + 1)), Qa(Wo, zt), r;
            } finally {
              Ga = !1;
            }
          }
        }
        function Qo(e, t, r) {
          return r /= 10, 1073741821 - (((1073741821 - e + t / 10) / r | 0) + 1) * r;
        }
        function Pt(e, t) {
          if (e && e.defaultProps) for (var r in t = a({}, t), e = e.defaultProps, e) t[r] === void 0 && (t[r] = e[r]);
          return t;
        }
        var Yo = { current: null }, Go = null, sr = null, Xo = null;
        function Xa() {
          Xo = sr = Go = null;
        }
        function Za(e) {
          var t = Yo.current;
          $e(Yo), e.type._context._currentValue = t;
        }
        function nd(e, t) {
          for (; e !== null; ) {
            var r = e.alternate;
            if (e.childExpirationTime < t) e.childExpirationTime = t, r !== null && r.childExpirationTime < t && (r.childExpirationTime = t);
            else if (r !== null && r.childExpirationTime < t) r.childExpirationTime = t;
            else break;
            e = e.return;
          }
        }
        function lr(e, t) {
          Go = e, Xo = sr = null, e = e.dependencies, e !== null && e.firstContext !== null && (e.expirationTime >= t && (Lt = !0), e.firstContext = null);
        }
        function xt(e, t) {
          if (Xo !== e && t !== !1 && t !== 0) if ((typeof t != "number" || t === 1073741823) && (Xo = e, t = 1073741823), t = { context: e, observedBits: t, next: null }, sr === null) {
            if (Go === null) throw Error(c(308));
            sr = t, Go.dependencies = { expirationTime: 0, firstContext: t, responders: null };
          } else sr = sr.next = t;
          return e._currentValue;
        }
        var pn = !1;
        function Ja(e) {
          e.updateQueue = { baseState: e.memoizedState, baseQueue: null, shared: { pending: null }, effects: null };
        }
        function es(e, t) {
          e = e.updateQueue, t.updateQueue === e && (t.updateQueue = { baseState: e.baseState, baseQueue: e.baseQueue, shared: e.shared, effects: e.effects });
        }
        function fn(e, t) {
          return e = { expirationTime: e, suspenseConfig: t, tag: 0, payload: null, callback: null, next: null }, e.next = e;
        }
        function hn(e, t) {
          if (e = e.updateQueue, e !== null) {
            e = e.shared;
            var r = e.pending;
            r === null ? t.next = t : (t.next = r.next, r.next = t), e.pending = t;
          }
        }
        function rd(e, t) {
          var r = e.alternate;
          r !== null && es(r, e), e = e.updateQueue, r = e.baseQueue, r === null ? (e.baseQueue = t.next = t, t.next = t) : (t.next = r.next, r.next = t);
        }
        function Br(e, t, r, i) {
          var s = e.updateQueue;
          pn = !1;
          var p = s.baseQueue, h = s.shared.pending;
          if (h !== null) {
            if (p !== null) {
              var _ = p.next;
              p.next = h.next, h.next = _;
            }
            p = h, s.shared.pending = null, _ = e.alternate, _ !== null && (_ = _.updateQueue, _ !== null && (_.baseQueue = h));
          }
          if (p !== null) {
            _ = p.next;
            var F = s.baseState, H = 0, ge = null, ve = null, Ae = null;
            if (_ !== null) {
              var Le = _;
              do {
                if (h = Le.expirationTime, h < i) {
                  var St = { expirationTime: Le.expirationTime, suspenseConfig: Le.suspenseConfig, tag: Le.tag, payload: Le.payload, callback: Le.callback, next: null };
                  Ae === null ? (ve = Ae = St, ge = F) : Ae = Ae.next = St, h > H && (H = h);
                } else {
                  Ae !== null && (Ae = Ae.next = { expirationTime: 1073741823, suspenseConfig: Le.suspenseConfig, tag: Le.tag, payload: Le.payload, callback: Le.callback, next: null }), Gd(h, Le.suspenseConfig);
                  e: {
                    var ot = e, j = Le;
                    switch (h = t, St = r, j.tag) {
                      case 1:
                        if (ot = j.payload, typeof ot == "function") {
                          F = ot.call(St, F, h);
                          break e;
                        }
                        F = ot;
                        break e;
                      case 3:
                        ot.effectTag = ot.effectTag & -4097 | 64;
                      case 0:
                        if (ot = j.payload, h = typeof ot == "function" ? ot.call(St, F, h) : ot, h == null) break e;
                        F = a({}, F, h);
                        break e;
                      case 2:
                        pn = !0;
                    }
                  }
                  Le.callback !== null && (e.effectTag |= 32, h = s.effects, h === null ? s.effects = [Le] : h.push(Le));
                }
                if (Le = Le.next, Le === null || Le === _) {
                  if (h = s.shared.pending, h === null) break;
                  Le = p.next = h.next, h.next = _, s.baseQueue = p = h, s.shared.pending = null;
                }
              } while (!0);
            }
            Ae === null ? ge = F : Ae.next = ve, s.baseState = ge, s.baseQueue = Ae, xi(H), e.expirationTime = H, e.memoizedState = F;
          }
        }
        function od(e, t, r) {
          if (e = t.effects, t.effects = null, e !== null) for (t = 0; t < e.length; t++) {
            var i = e[t], s = i.callback;
            if (s !== null) {
              if (i.callback = null, i = s, s = r, typeof i != "function") throw Error(c(191, i));
              i.call(s);
            }
          }
        }
        var Wr = Ye.ReactCurrentBatchConfig, id = new o.Component().refs;
        function Zo(e, t, r, i) {
          t = e.memoizedState, r = r(i, t), r = r == null ? t : a({}, t, r), e.memoizedState = r, e.expirationTime === 0 && (e.updateQueue.baseState = r);
        }
        var Jo = { isMounted: function(e) {
          return (e = e._reactInternalFiber) ? Nn(e) === e : !1;
        }, enqueueSetState: function(e, t, r) {
          e = e._reactInternalFiber;
          var i = Vt(), s = Wr.suspense;
          i = Ln(i, e, s), s = fn(i, s), s.payload = t, r != null && (s.callback = r), hn(e, s), bn(e, i);
        }, enqueueReplaceState: function(e, t, r) {
          e = e._reactInternalFiber;
          var i = Vt(), s = Wr.suspense;
          i = Ln(i, e, s), s = fn(i, s), s.tag = 1, s.payload = t, r != null && (s.callback = r), hn(e, s), bn(e, i);
        }, enqueueForceUpdate: function(e, t) {
          e = e._reactInternalFiber;
          var r = Vt(), i = Wr.suspense;
          r = Ln(r, e, i), i = fn(r, i), i.tag = 2, t != null && (i.callback = t), hn(e, i), bn(e, r);
        } };
        function ad(e, t, r, i, s, p, h) {
          return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(i, p, h) : t.prototype && t.prototype.isPureReactComponent ? !$r(r, i) || !$r(s, p) : !0;
        }
        function sd(e, t, r) {
          var i = !1, s = un, p = t.contextType;
          return typeof p == "object" && p ? p = xt(p) : (s = ht(t) ? In : ct.current, i = t.contextTypes, p = (i = i != null) ? ar(e, s) : un), t = new t(r, p), e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null, t.updater = Jo, e.stateNode = t, t._reactInternalFiber = e, i && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = s, e.__reactInternalMemoizedMaskedChildContext = p), t;
        }
        function ld(e, t, r, i) {
          e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(r, i), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(r, i), t.state !== e && Jo.enqueueReplaceState(t, t.state, null);
        }
        function ts(e, t, r, i) {
          var s = e.stateNode;
          s.props = r, s.state = e.memoizedState, s.refs = id, Ja(e);
          var p = t.contextType;
          typeof p == "object" && p ? s.context = xt(p) : (p = ht(t) ? In : ct.current, s.context = ar(e, p)), Br(e, r, s, i), s.state = e.memoizedState, p = t.getDerivedStateFromProps, typeof p == "function" && (Zo(e, t, p, r), s.state = e.memoizedState), typeof t.getDerivedStateFromProps == "function" || typeof s.getSnapshotBeforeUpdate == "function" || typeof s.UNSAFE_componentWillMount != "function" && typeof s.componentWillMount != "function" || (t = s.state, typeof s.componentWillMount == "function" && s.componentWillMount(), typeof s.UNSAFE_componentWillMount == "function" && s.UNSAFE_componentWillMount(), t !== s.state && Jo.enqueueReplaceState(s, s.state, null), Br(e, r, s, i), s.state = e.memoizedState), typeof s.componentDidMount == "function" && (e.effectTag |= 4);
        }
        var ei = Array.isArray;
        function qr(e, t, r) {
          if (e = r.ref, e !== null && typeof e != "function" && typeof e != "object") {
            if (r._owner) {
              if (r = r._owner, r) {
                if (r.tag !== 1) throw Error(c(309));
                var i = r.stateNode;
              }
              if (!i) throw Error(c(147, e));
              var s = "" + e;
              return t !== null && t.ref !== null && typeof t.ref == "function" && t.ref._stringRef === s ? t.ref : (t = function(p) {
                var h = i.refs;
                h === id && (h = i.refs = {}), p === null ? delete h[s] : h[s] = p;
              }, t._stringRef = s, t);
            }
            if (typeof e != "string") throw Error(c(284));
            if (!r._owner) throw Error(c(290, e));
          }
          return e;
        }
        function ti(e, t) {
          if (e.type !== "textarea") throw Error(c(31, Object.prototype.toString.call(t) === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : t, ""));
        }
        function cd(e) {
          function t(j, I) {
            if (e) {
              var Q = j.lastEffect;
              Q === null ? j.firstEffect = j.lastEffect = I : (Q.nextEffect = I, j.lastEffect = I), I.nextEffect = null, I.effectTag = 8;
            }
          }
          function r(j, I) {
            if (!e) return null;
            for (; I !== null; ) t(j, I), I = I.sibling;
            return null;
          }
          function i(j, I) {
            for (j = /* @__PURE__ */ new Map(); I !== null; ) I.key === null ? j.set(I.index, I) : j.set(I.key, I), I = I.sibling;
            return j;
          }
          function s(j, I) {
            return j = $n(j, I), j.index = 0, j.sibling = null, j;
          }
          function p(j, I, Q) {
            return j.index = Q, e ? (Q = j.alternate, Q === null ? (j.effectTag = 2, I) : (Q = Q.index, Q < I ? (j.effectTag = 2, I) : Q)) : I;
          }
          function h(j) {
            return e && j.alternate === null && (j.effectTag = 2), j;
          }
          function _(j, I, Q, ue) {
            return I === null || I.tag !== 6 ? (I = As(Q, j.mode, ue), I.return = j, I) : (I = s(I, Q), I.return = j, I);
          }
          function F(j, I, Q, ue) {
            return I !== null && I.elementType === Q.type ? (ue = s(I, Q.props), ue.ref = qr(j, I, Q), ue.return = j, ue) : (ue = Ci(Q.type, Q.key, Q.props, null, j.mode, ue), ue.ref = qr(j, I, Q), ue.return = j, ue);
          }
          function H(j, I, Q, ue) {
            return I === null || I.tag !== 4 || I.stateNode.containerInfo !== Q.containerInfo || I.stateNode.implementation !== Q.implementation ? (I = zs(Q, j.mode, ue), I.return = j, I) : (I = s(I, Q.children || []), I.return = j, I);
          }
          function ge(j, I, Q, ue, fe) {
            return I === null || I.tag !== 7 ? (I = vn(Q, j.mode, ue, fe), I.return = j, I) : (I = s(I, Q), I.return = j, I);
          }
          function ve(j, I, Q) {
            if (typeof I == "string" || typeof I == "number") return I = As("" + I, j.mode, Q), I.return = j, I;
            if (typeof I == "object" && I) {
              switch (I.$$typeof) {
                case Co:
                  return Q = Ci(I.type, I.key, I.props, null, j.mode, Q), Q.ref = qr(j, null, I), Q.return = j, Q;
                case Xn:
                  return I = zs(I, j.mode, Q), I.return = j, I;
              }
              if (ei(I) || Er(I)) return I = vn(I, j.mode, Q, null), I.return = j, I;
              ti(j, I);
            }
            return null;
          }
          function Ae(j, I, Q, ue) {
            var fe = I === null ? null : I.key;
            if (typeof Q == "string" || typeof Q == "number") return fe === null ? _(j, I, "" + Q, ue) : null;
            if (typeof Q == "object" && Q) {
              switch (Q.$$typeof) {
                case Co:
                  return Q.key === fe ? Q.type === On ? ge(j, I, Q.props.children, ue, fe) : F(j, I, Q, ue) : null;
                case Xn:
                  return Q.key === fe ? H(j, I, Q, ue) : null;
              }
              if (ei(Q) || Er(Q)) return fe === null ? ge(j, I, Q, ue, null) : null;
              ti(j, Q);
            }
            return null;
          }
          function Le(j, I, Q, ue, fe) {
            if (typeof ue == "string" || typeof ue == "number") return j = j.get(Q) || null, _(I, j, "" + ue, fe);
            if (typeof ue == "object" && ue) {
              switch (ue.$$typeof) {
                case Co:
                  return j = j.get(ue.key === null ? Q : ue.key) || null, ue.type === On ? ge(I, j, ue.props.children, fe, ue.key) : F(I, j, ue, fe);
                case Xn:
                  return j = j.get(ue.key === null ? Q : ue.key) || null, H(I, j, ue, fe);
              }
              if (ei(ue) || Er(ue)) return j = j.get(Q) || null, ge(I, j, ue, fe, null);
              ti(I, ue);
            }
            return null;
          }
          function St(j, I, Q, ue) {
            for (var fe = null, ke = null, Se = I, je = I = 0, Be = null; Se !== null && je < Q.length; je++) {
              Se.index > je ? (Be = Se, Se = null) : Be = Se.sibling;
              var Me = Ae(j, Se, Q[je], ue);
              if (Me === null) {
                Se === null && (Se = Be);
                break;
              }
              e && Se && Me.alternate === null && t(j, Se), I = p(Me, I, je), ke === null ? fe = Me : ke.sibling = Me, ke = Me, Se = Be;
            }
            if (je === Q.length) return r(j, Se), fe;
            if (Se === null) {
              for (; je < Q.length; je++) Se = ve(j, Q[je], ue), Se !== null && (I = p(Se, I, je), ke === null ? fe = Se : ke.sibling = Se, ke = Se);
              return fe;
            }
            for (Se = i(j, Se); je < Q.length; je++) Be = Le(Se, j, je, Q[je], ue), Be !== null && (e && Be.alternate !== null && Se.delete(Be.key === null ? je : Be.key), I = p(Be, I, je), ke === null ? fe = Be : ke.sibling = Be, ke = Be);
            return e && Se.forEach(function(kn) {
              return t(j, kn);
            }), fe;
          }
          function ot(j, I, Q, ue) {
            var fe = Er(Q);
            if (typeof fe != "function") throw Error(c(150));
            if (Q = fe.call(Q), Q == null) throw Error(c(151));
            for (var ke = fe = null, Se = I, je = I = 0, Be = null, Me = Q.next(); Se !== null && !Me.done; je++, Me = Q.next()) {
              Se.index > je ? (Be = Se, Se = null) : Be = Se.sibling;
              var kn = Ae(j, Se, Me.value, ue);
              if (kn === null) {
                Se === null && (Se = Be);
                break;
              }
              e && Se && kn.alternate === null && t(j, Se), I = p(kn, I, je), ke === null ? fe = kn : ke.sibling = kn, ke = kn, Se = Be;
            }
            if (Me.done) return r(j, Se), fe;
            if (Se === null) {
              for (; !Me.done; je++, Me = Q.next()) Me = ve(j, Me.value, ue), Me !== null && (I = p(Me, I, je), ke === null ? fe = Me : ke.sibling = Me, ke = Me);
              return fe;
            }
            for (Se = i(j, Se); !Me.done; je++, Me = Q.next()) Me = Le(Se, j, je, Me.value, ue), Me !== null && (e && Me.alternate !== null && Se.delete(Me.key === null ? je : Me.key), I = p(Me, I, je), ke === null ? fe = Me : ke.sibling = Me, ke = Me);
            return e && Se.forEach(function(Ob) {
              return t(j, Ob);
            }), fe;
          }
          return function(j, I, Q, ue) {
            var fe = typeof Q == "object" && !!Q && Q.type === On && Q.key === null;
            fe && (Q = Q.props.children);
            var ke = typeof Q == "object" && !!Q;
            if (ke) switch (Q.$$typeof) {
              case Co:
                e: {
                  for (ke = Q.key, fe = I; fe !== null; ) {
                    if (fe.key === ke) {
                      switch (fe.tag) {
                        case 7:
                          if (Q.type === On) {
                            r(j, fe.sibling), I = s(fe, Q.props.children), I.return = j, j = I;
                            break e;
                          }
                          break;
                        default:
                          if (fe.elementType === Q.type) {
                            r(j, fe.sibling), I = s(fe, Q.props), I.ref = qr(j, fe, Q), I.return = j, j = I;
                            break e;
                          }
                      }
                      r(j, fe);
                      break;
                    } else t(j, fe);
                    fe = fe.sibling;
                  }
                  Q.type === On ? (I = vn(Q.props.children, j.mode, ue, Q.key), I.return = j, j = I) : (ue = Ci(Q.type, Q.key, Q.props, null, j.mode, ue), ue.ref = qr(j, I, Q), ue.return = j, j = ue);
                }
                return h(j);
              case Xn:
                e: {
                  for (fe = Q.key; I !== null; ) {
                    if (I.key === fe) if (I.tag === 4 && I.stateNode.containerInfo === Q.containerInfo && I.stateNode.implementation === Q.implementation) {
                      r(j, I.sibling), I = s(I, Q.children || []), I.return = j, j = I;
                      break e;
                    } else {
                      r(j, I);
                      break;
                    }
                    else t(j, I);
                    I = I.sibling;
                  }
                  I = zs(Q, j.mode, ue), I.return = j, j = I;
                }
                return h(j);
            }
            if (typeof Q == "string" || typeof Q == "number") return Q = "" + Q, I !== null && I.tag === 6 ? (r(j, I.sibling), I = s(I, Q), I.return = j, j = I) : (r(j, I), I = As(Q, j.mode, ue), I.return = j, j = I), h(j);
            if (ei(Q)) return St(j, I, Q, ue);
            if (Er(Q)) return ot(j, I, Q, ue);
            if (ke && ti(j, Q), Q === void 0 && !fe) switch (j.tag) {
              case 1:
              case 0:
                throw j = j.type, Error(c(152, j.displayName || j.name || "Component"));
            }
            return r(j, I);
          };
        }
        var cr = cd(!0), ns = cd(!1), Kr = {}, jt = { current: Kr }, Qr = { current: Kr }, Yr = { current: Kr };
        function Rn(e) {
          if (e === Kr) throw Error(c(174));
          return e;
        }
        function rs(e, t) {
          switch (qe(Yr, t), qe(Qr, e), qe(jt, Kr), e = t.nodeType, e) {
            case 9:
            case 11:
              t = (t = t.documentElement) ? t.namespaceURI : fa(null, "");
              break;
            default:
              e = e === 8 ? t.parentNode : t, t = e.namespaceURI || null, e = e.tagName, t = fa(t, e);
          }
          $e(jt), qe(jt, t);
        }
        function ur() {
          $e(jt), $e(Qr), $e(Yr);
        }
        function ud(e) {
          Rn(Yr.current);
          var t = Rn(jt.current), r = fa(t, e.type);
          t !== r && (qe(Qr, e), qe(jt, r));
        }
        function os(e) {
          Qr.current === e && ($e(jt), $e(Qr));
        }
        var We = { current: 0 };
        function ni(e) {
          for (var t = e; t !== null; ) {
            if (t.tag === 13) {
              var r = t.memoizedState;
              if (r !== null && (r = r.dehydrated, r === null || r.data === Ia || r.data === Ra)) return t;
            } else if (t.tag === 19 && t.memoizedProps.revealOrder !== void 0) {
              if (t.effectTag & 64) return t;
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
        function is(e, t) {
          return { responder: e, props: t };
        }
        var ri = Ye.ReactCurrentDispatcher, Ct = Ye.ReactCurrentBatchConfig, mn = 0, Ze = null, ut = null, dt = null, oi = !1;
        function bt() {
          throw Error(c(321));
        }
        function as(e, t) {
          if (t === null) return !1;
          for (var r = 0; r < t.length && r < e.length; r++) if (!Dn(e[r], t[r])) return !1;
          return !0;
        }
        function ss(e, t, r, i, s, p) {
          if (mn = p, Ze = t, t.memoizedState = null, t.updateQueue = null, t.expirationTime = 0, ri.current = e === null || e.memoizedState === null ? Xy : Zy, e = r(i, s), t.expirationTime === mn) {
            p = 0;
            do {
              if (t.expirationTime = 0, !(25 > p)) throw Error(c(301));
              p += 1, dt = ut = null, t.updateQueue = null, ri.current = Jy, e = r(i, s);
            } while (t.expirationTime === mn);
          }
          if (ri.current = ci, t = ut !== null && ut.next !== null, mn = 0, dt = ut = Ze = null, oi = !1, t) throw Error(c(300));
          return e;
        }
        function dr() {
          var e = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
          return dt === null ? Ze.memoizedState = dt = e : dt = dt.next = e, dt;
        }
        function pr() {
          if (ut === null) {
            var e = Ze.alternate;
            e = e === null ? null : e.memoizedState;
          } else e = ut.next;
          var t = dt === null ? Ze.memoizedState : dt.next;
          if (t !== null) dt = t, ut = e;
          else {
            if (e === null) throw Error(c(310));
            ut = e, e = { memoizedState: ut.memoizedState, baseState: ut.baseState, baseQueue: ut.baseQueue, queue: ut.queue, next: null }, dt === null ? Ze.memoizedState = dt = e : dt = dt.next = e;
          }
          return dt;
        }
        function Mn(e, t) {
          return typeof t == "function" ? t(e) : t;
        }
        function ii(e) {
          var t = pr(), r = t.queue;
          if (r === null) throw Error(c(311));
          r.lastRenderedReducer = e;
          var i = ut, s = i.baseQueue, p = r.pending;
          if (p !== null) {
            if (s !== null) {
              var h = s.next;
              s.next = p.next, p.next = h;
            }
            i.baseQueue = s = p, r.pending = null;
          }
          if (s !== null) {
            s = s.next, i = i.baseState;
            var _ = h = p = null, F = s;
            do {
              var H = F.expirationTime;
              if (H < mn) {
                var ge = { expirationTime: F.expirationTime, suspenseConfig: F.suspenseConfig, action: F.action, eagerReducer: F.eagerReducer, eagerState: F.eagerState, next: null };
                _ === null ? (h = _ = ge, p = i) : _ = _.next = ge, H > Ze.expirationTime && (Ze.expirationTime = H, xi(H));
              } else _ !== null && (_ = _.next = { expirationTime: 1073741823, suspenseConfig: F.suspenseConfig, action: F.action, eagerReducer: F.eagerReducer, eagerState: F.eagerState, next: null }), Gd(H, F.suspenseConfig), i = F.eagerReducer === e ? F.eagerState : e(i, F.action);
              F = F.next;
            } while (F !== null && F !== s);
            _ === null ? p = i : _.next = h, Dn(i, t.memoizedState) || (Lt = !0), t.memoizedState = i, t.baseState = p, t.baseQueue = _, r.lastRenderedState = i;
          }
          return [t.memoizedState, r.dispatch];
        }
        function ai(e) {
          var t = pr(), r = t.queue;
          if (r === null) throw Error(c(311));
          r.lastRenderedReducer = e;
          var i = r.dispatch, s = r.pending, p = t.memoizedState;
          if (s !== null) {
            r.pending = null;
            var h = s = s.next;
            do
              p = e(p, h.action), h = h.next;
            while (h !== s);
            Dn(p, t.memoizedState) || (Lt = !0), t.memoizedState = p, t.baseQueue === null && (t.baseState = p), r.lastRenderedState = p;
          }
          return [p, i];
        }
        function ls(e) {
          var t = dr();
          return typeof e == "function" && (e = e()), t.memoizedState = t.baseState = e, e = t.queue = { pending: null, dispatch: null, lastRenderedReducer: Mn, lastRenderedState: e }, e = e.dispatch = bd.bind(null, Ze, e), [t.memoizedState, e];
        }
        function cs(e, t, r, i) {
          return e = { tag: e, create: t, destroy: r, deps: i, next: null }, t = Ze.updateQueue, t === null ? (t = { lastEffect: null }, Ze.updateQueue = t, t.lastEffect = e.next = e) : (r = t.lastEffect, r === null ? t.lastEffect = e.next = e : (i = r.next, r.next = e, e.next = i, t.lastEffect = e)), e;
        }
        function dd() {
          return pr().memoizedState;
        }
        function us(e, t, r, i) {
          var s = dr();
          Ze.effectTag |= e, s.memoizedState = cs(1 | t, r, void 0, i === void 0 ? null : i);
        }
        function ds(e, t, r, i) {
          var s = pr();
          i = i === void 0 ? null : i;
          var p = void 0;
          if (ut !== null) {
            var h = ut.memoizedState;
            if (p = h.destroy, i !== null && as(i, h.deps)) {
              cs(t, r, p, i);
              return;
            }
          }
          Ze.effectTag |= e, s.memoizedState = cs(1 | t, r, p, i);
        }
        function pd(e, t) {
          return us(516, 4, e, t);
        }
        function si(e, t) {
          return ds(516, 4, e, t);
        }
        function fd(e, t) {
          return ds(4, 2, e, t);
        }
        function hd(e, t) {
          if (typeof t == "function") return e = e(), t(e), function() {
            t(null);
          };
          if (t != null) return e = e(), t.current = e, function() {
            t.current = null;
          };
        }
        function md(e, t, r) {
          return r = r == null ? null : r.concat([e]), ds(4, 2, hd.bind(null, t, e), r);
        }
        function ps() {
        }
        function gd(e, t) {
          return dr().memoizedState = [e, t === void 0 ? null : t], e;
        }
        function li(e, t) {
          var r = pr();
          t = t === void 0 ? null : t;
          var i = r.memoizedState;
          return i !== null && t !== null && as(t, i[1]) ? i[0] : (r.memoizedState = [e, t], e);
        }
        function yd(e, t) {
          var r = pr();
          t = t === void 0 ? null : t;
          var i = r.memoizedState;
          return i !== null && t !== null && as(t, i[1]) ? i[0] : (e = e(), r.memoizedState = [e, t], e);
        }
        function fs(e, t, r) {
          var i = Ko();
          dn(98 > i ? 98 : i, function() {
            e(!0);
          }), dn(97 < i ? 97 : i, function() {
            var s = Ct.suspense;
            Ct.suspense = t === void 0 ? null : t;
            try {
              e(!1), r();
            } finally {
              Ct.suspense = s;
            }
          });
        }
        function bd(e, t, r) {
          var i = Vt(), s = Wr.suspense;
          i = Ln(i, e, s), s = { expirationTime: i, suspenseConfig: s, action: r, eagerReducer: null, eagerState: null, next: null };
          var p = t.pending;
          if (p === null ? s.next = s : (s.next = p.next, p.next = s), t.pending = s, p = e.alternate, e === Ze || p !== null && p === Ze) oi = !0, s.expirationTime = mn, Ze.expirationTime = mn;
          else {
            if (e.expirationTime === 0 && (p === null || p.expirationTime === 0) && (p = t.lastRenderedReducer, p !== null)) try {
              var h = t.lastRenderedState, _ = p(h, r);
              if (s.eagerReducer = p, s.eagerState = _, Dn(_, h)) return;
            } catch {
            }
            bn(e, i);
          }
        }
        var ci = { readContext: xt, useCallback: bt, useContext: bt, useEffect: bt, useImperativeHandle: bt, useLayoutEffect: bt, useMemo: bt, useReducer: bt, useRef: bt, useState: bt, useDebugValue: bt, useResponder: bt, useDeferredValue: bt, useTransition: bt }, Xy = { readContext: xt, useCallback: gd, useContext: xt, useEffect: pd, useImperativeHandle: function(e, t, r) {
          return r = r == null ? null : r.concat([e]), us(4, 2, hd.bind(null, t, e), r);
        }, useLayoutEffect: function(e, t) {
          return us(4, 2, e, t);
        }, useMemo: function(e, t) {
          var r = dr();
          return t = t === void 0 ? null : t, e = e(), r.memoizedState = [e, t], e;
        }, useReducer: function(e, t, r) {
          var i = dr();
          return t = r === void 0 ? t : r(t), i.memoizedState = i.baseState = t, e = i.queue = { pending: null, dispatch: null, lastRenderedReducer: e, lastRenderedState: t }, e = e.dispatch = bd.bind(null, Ze, e), [i.memoizedState, e];
        }, useRef: function(e) {
          var t = dr();
          return e = { current: e }, t.memoizedState = e;
        }, useState: ls, useDebugValue: ps, useResponder: is, useDeferredValue: function(e, t) {
          var r = ls(e), i = r[0], s = r[1];
          return pd(function() {
            var p = Ct.suspense;
            Ct.suspense = t === void 0 ? null : t;
            try {
              s(e);
            } finally {
              Ct.suspense = p;
            }
          }, [e, t]), i;
        }, useTransition: function(e) {
          var t = ls(!1), r = t[0];
          return t = t[1], [gd(fs.bind(null, t, e), [t, e]), r];
        } }, Zy = { readContext: xt, useCallback: li, useContext: xt, useEffect: si, useImperativeHandle: md, useLayoutEffect: fd, useMemo: yd, useReducer: ii, useRef: dd, useState: function() {
          return ii(Mn);
        }, useDebugValue: ps, useResponder: is, useDeferredValue: function(e, t) {
          var r = ii(Mn), i = r[0], s = r[1];
          return si(function() {
            var p = Ct.suspense;
            Ct.suspense = t === void 0 ? null : t;
            try {
              s(e);
            } finally {
              Ct.suspense = p;
            }
          }, [e, t]), i;
        }, useTransition: function(e) {
          var t = ii(Mn), r = t[0];
          return t = t[1], [li(fs.bind(null, t, e), [t, e]), r];
        } }, Jy = { readContext: xt, useCallback: li, useContext: xt, useEffect: si, useImperativeHandle: md, useLayoutEffect: fd, useMemo: yd, useReducer: ai, useRef: dd, useState: function() {
          return ai(Mn);
        }, useDebugValue: ps, useResponder: is, useDeferredValue: function(e, t) {
          var r = ai(Mn), i = r[0], s = r[1];
          return si(function() {
            var p = Ct.suspense;
            Ct.suspense = t === void 0 ? null : t;
            try {
              s(e);
            } finally {
              Ct.suspense = p;
            }
          }, [e, t]), i;
        }, useTransition: function(e) {
          var t = ai(Mn), r = t[0];
          return t = t[1], [li(fs.bind(null, t, e), [t, e]), r];
        } }, Gt = null, gn = null, An = !1;
        function vd(e, t) {
          var r = Ft(5, null, null, 0);
          r.elementType = "DELETED", r.type = "DELETED", r.stateNode = t, r.return = e, r.effectTag = 8, e.lastEffect === null ? e.firstEffect = e.lastEffect = r : (e.lastEffect.nextEffect = r, e.lastEffect = r);
        }
        function kd(e, t) {
          switch (e.tag) {
            case 5:
              var r = e.type;
              return t = t.nodeType !== 1 || r.toLowerCase() !== t.nodeName.toLowerCase() ? null : t, t === null ? !1 : (e.stateNode = t, !0);
            case 6:
              return t = e.pendingProps === "" || t.nodeType !== 3 ? null : t, t === null ? !1 : (e.stateNode = t, !0);
            case 13:
              return !1;
            default:
              return !1;
          }
        }
        function hs(e) {
          if (An) {
            var t = gn;
            if (t) {
              var r = t;
              if (!kd(e, t)) {
                if (t = tr(r.nextSibling), !t || !kd(e, t)) {
                  e.effectTag = e.effectTag & -1025 | 2, An = !1, Gt = e;
                  return;
                }
                vd(Gt, r);
              }
              Gt = e, gn = tr(t.firstChild);
            } else e.effectTag = e.effectTag & -1025 | 2, An = !1, Gt = e;
          }
        }
        function wd(e) {
          for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13; ) e = e.return;
          Gt = e;
        }
        function ui(e) {
          if (e !== Gt) return !1;
          if (!An) return wd(e), An = !0, !1;
          var t = e.type;
          if (e.tag !== 5 || t !== "head" && t !== "body" && !za(t, e.memoizedProps)) for (t = gn; t; ) vd(e, t), t = tr(t.nextSibling);
          if (wd(e), e.tag === 13) {
            if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(c(317));
            e: {
              for (e = e.nextSibling, t = 0; e; ) {
                if (e.nodeType === 8) {
                  var r = e.data;
                  if (r === yu) {
                    if (t === 0) {
                      gn = tr(e.nextSibling);
                      break e;
                    }
                    t--;
                  } else r !== gu && r !== Ra && r !== Ia || t++;
                }
                e = e.nextSibling;
              }
              gn = null;
            }
          } else gn = Gt ? tr(e.stateNode.nextSibling) : null;
          return !0;
        }
        function ms() {
          gn = Gt = null, An = !1;
        }
        var eb = Ye.ReactCurrentOwner, Lt = !1;
        function vt(e, t, r, i) {
          t.child = e === null ? ns(t, null, r, i) : cr(t, e.child, r, i);
        }
        function Ed(e, t, r, i, s) {
          r = r.render;
          var p = t.ref;
          return lr(t, s), i = ss(e, t, r, i, p, s), e !== null && !Lt ? (t.updateQueue = e.updateQueue, t.effectTag &= -517, e.expirationTime <= s && (e.expirationTime = 0), Xt(e, t, s)) : (t.effectTag |= 1, vt(e, t, i, s), t.child);
        }
        function _d(e, t, r, i, s, p) {
          if (e === null) {
            var h = r.type;
            return typeof h == "function" && !Ms(h) && h.defaultProps === void 0 && r.compare === null && r.defaultProps === void 0 ? (t.tag = 15, t.type = h, xd(e, t, h, i, s, p)) : (e = Ci(r.type, null, i, null, t.mode, p), e.ref = t.ref, e.return = t, t.child = e);
          }
          return h = e.child, s < p && (s = h.memoizedProps, r = r.compare, r = r === null ? $r : r, r(s, i) && e.ref === t.ref) ? Xt(e, t, p) : (t.effectTag |= 1, e = $n(h, i), e.ref = t.ref, e.return = t, t.child = e);
        }
        function xd(e, t, r, i, s, p) {
          return e !== null && $r(e.memoizedProps, i) && e.ref === t.ref && (Lt = !1, s < p) ? (t.expirationTime = e.expirationTime, Xt(e, t, p)) : gs(e, t, r, i, p);
        }
        function Cd(e, t) {
          var r = t.ref;
          (e === null && r !== null || e !== null && e.ref !== r) && (t.effectTag |= 128);
        }
        function gs(e, t, r, i, s) {
          var p = ht(r) ? In : ct.current;
          return p = ar(t, p), lr(t, s), r = ss(e, t, r, i, p, s), e !== null && !Lt ? (t.updateQueue = e.updateQueue, t.effectTag &= -517, e.expirationTime <= s && (e.expirationTime = 0), Xt(e, t, s)) : (t.effectTag |= 1, vt(e, t, r, s), t.child);
        }
        function Sd(e, t, r, i, s) {
          if (ht(r)) {
            var p = !0;
            Bo(t);
          } else p = !1;
          if (lr(t, s), t.stateNode === null) e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= 2), sd(t, r, i), ts(t, r, i, s), i = !0;
          else if (e === null) {
            var h = t.stateNode, _ = t.memoizedProps;
            h.props = _;
            var F = h.context, H = r.contextType;
            typeof H == "object" && H ? H = xt(H) : (H = ht(r) ? In : ct.current, H = ar(t, H));
            var ge = r.getDerivedStateFromProps, ve = typeof ge == "function" || typeof h.getSnapshotBeforeUpdate == "function";
            ve || typeof h.UNSAFE_componentWillReceiveProps != "function" && typeof h.componentWillReceiveProps != "function" || (_ !== i || F !== H) && ld(t, h, i, H), pn = !1;
            var Ae = t.memoizedState;
            h.state = Ae, Br(t, i, h, s), F = t.memoizedState, _ !== i || Ae !== F || ft.current || pn ? (typeof ge == "function" && (Zo(t, r, ge, i), F = t.memoizedState), (_ = pn || ad(t, r, _, i, Ae, F, H)) ? (ve || typeof h.UNSAFE_componentWillMount != "function" && typeof h.componentWillMount != "function" || (typeof h.componentWillMount == "function" && h.componentWillMount(), typeof h.UNSAFE_componentWillMount == "function" && h.UNSAFE_componentWillMount()), typeof h.componentDidMount == "function" && (t.effectTag |= 4)) : (typeof h.componentDidMount == "function" && (t.effectTag |= 4), t.memoizedProps = i, t.memoizedState = F), h.props = i, h.state = F, h.context = H, i = _) : (typeof h.componentDidMount == "function" && (t.effectTag |= 4), i = !1);
          } else h = t.stateNode, es(e, t), _ = t.memoizedProps, h.props = t.type === t.elementType ? _ : Pt(t.type, _), F = h.context, H = r.contextType, typeof H == "object" && H ? H = xt(H) : (H = ht(r) ? In : ct.current, H = ar(t, H)), ge = r.getDerivedStateFromProps, (ve = typeof ge == "function" || typeof h.getSnapshotBeforeUpdate == "function") || typeof h.UNSAFE_componentWillReceiveProps != "function" && typeof h.componentWillReceiveProps != "function" || (_ !== i || F !== H) && ld(t, h, i, H), pn = !1, F = t.memoizedState, h.state = F, Br(t, i, h, s), Ae = t.memoizedState, _ !== i || F !== Ae || ft.current || pn ? (typeof ge == "function" && (Zo(t, r, ge, i), Ae = t.memoizedState), (ge = pn || ad(t, r, _, i, F, Ae, H)) ? (ve || typeof h.UNSAFE_componentWillUpdate != "function" && typeof h.componentWillUpdate != "function" || (typeof h.componentWillUpdate == "function" && h.componentWillUpdate(i, Ae, H), typeof h.UNSAFE_componentWillUpdate == "function" && h.UNSAFE_componentWillUpdate(i, Ae, H)), typeof h.componentDidUpdate == "function" && (t.effectTag |= 4), typeof h.getSnapshotBeforeUpdate == "function" && (t.effectTag |= 256)) : (typeof h.componentDidUpdate != "function" || _ === e.memoizedProps && F === e.memoizedState || (t.effectTag |= 4), typeof h.getSnapshotBeforeUpdate != "function" || _ === e.memoizedProps && F === e.memoizedState || (t.effectTag |= 256), t.memoizedProps = i, t.memoizedState = Ae), h.props = i, h.state = Ae, h.context = H, i = ge) : (typeof h.componentDidUpdate != "function" || _ === e.memoizedProps && F === e.memoizedState || (t.effectTag |= 4), typeof h.getSnapshotBeforeUpdate != "function" || _ === e.memoizedProps && F === e.memoizedState || (t.effectTag |= 256), i = !1);
          return ys(e, t, r, i, p, s);
        }
        function ys(e, t, r, i, s, p) {
          Cd(e, t);
          var h = (t.effectTag & 64) != 0;
          if (!i && !h) return s && Hu(t, r, !1), Xt(e, t, p);
          i = t.stateNode, eb.current = t;
          var _ = h && typeof r.getDerivedStateFromError != "function" ? null : i.render();
          return t.effectTag |= 1, e !== null && h ? (t.child = cr(t, e.child, null, p), t.child = cr(t, null, _, p)) : vt(e, t, _, p), t.memoizedState = i.state, s && Hu(t, r, !0), t.child;
        }
        function Td(e) {
          var t = e.stateNode;
          t.pendingContext ? Fu(e, t.pendingContext, t.pendingContext !== t.context) : t.context && Fu(e, t.context, !1), rs(e, t.containerInfo);
        }
        var bs = { dehydrated: null, retryTime: 0 };
        function Od(e, t, r) {
          var i = t.mode, s = t.pendingProps, p = We.current, h = !1, _;
          if ((_ = (t.effectTag & 64) != 0) || (_ = (p & 2) != 0 && (e === null || e.memoizedState !== null)), _ ? (h = !0, t.effectTag &= -65) : e !== null && e.memoizedState === null || s.fallback === void 0 || s.unstable_avoidThisFallback === !0 || (p |= 1), qe(We, p & 1), e === null) {
            if (s.fallback !== void 0 && hs(t), h) {
              if (h = s.fallback, s = vn(null, i, 0, null), s.return = t, !(t.mode & 2)) for (e = t.memoizedState === null ? t.child : t.child.child, s.child = e; e !== null; ) e.return = s, e = e.sibling;
              return r = vn(h, i, r, null), r.return = t, s.sibling = r, t.memoizedState = bs, t.child = s, r;
            }
            return i = s.children, t.memoizedState = null, t.child = ns(t, null, i, r);
          }
          if (e.memoizedState !== null) {
            if (e = e.child, i = e.sibling, h) {
              if (s = s.fallback, r = $n(e, e.pendingProps), r.return = t, !(t.mode & 2) && (h = t.memoizedState === null ? t.child : t.child.child, h !== e.child)) for (r.child = h; h !== null; ) h.return = r, h = h.sibling;
              return i = $n(i, s), i.return = t, r.sibling = i, r.childExpirationTime = 0, t.memoizedState = bs, t.child = r, i;
            }
            return r = cr(t, e.child, s.children, r), t.memoizedState = null, t.child = r;
          }
          if (e = e.child, h) {
            if (h = s.fallback, s = vn(null, i, 0, null), s.return = t, s.child = e, e !== null && (e.return = s), !(t.mode & 2)) for (e = t.memoizedState === null ? t.child : t.child.child, s.child = e; e !== null; ) e.return = s, e = e.sibling;
            return r = vn(h, i, r, null), r.return = t, s.sibling = r, r.effectTag |= 2, s.childExpirationTime = 0, t.memoizedState = bs, t.child = s, r;
          }
          return t.memoizedState = null, t.child = cr(t, e, s.children, r);
        }
        function Nd(e, t) {
          e.expirationTime < t && (e.expirationTime = t);
          var r = e.alternate;
          r !== null && r.expirationTime < t && (r.expirationTime = t), nd(e.return, t);
        }
        function vs(e, t, r, i, s, p) {
          var h = e.memoizedState;
          h === null ? e.memoizedState = { isBackwards: t, rendering: null, renderingStartTime: 0, last: i, tail: r, tailExpiration: 0, tailMode: s, lastEffect: p } : (h.isBackwards = t, h.rendering = null, h.renderingStartTime = 0, h.last = i, h.tail = r, h.tailExpiration = 0, h.tailMode = s, h.lastEffect = p);
        }
        function Pd(e, t, r) {
          var i = t.pendingProps, s = i.revealOrder, p = i.tail;
          if (vt(e, t, i.children, r), i = We.current, i & 2) i = i & 1 | 2, t.effectTag |= 64;
          else {
            if (e !== null && e.effectTag & 64) e: for (e = t.child; e !== null; ) {
              if (e.tag === 13) e.memoizedState !== null && Nd(e, r);
              else if (e.tag === 19) Nd(e, r);
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
            i &= 1;
          }
          if (qe(We, i), !(t.mode & 2)) t.memoizedState = null;
          else switch (s) {
            case "forwards":
              for (r = t.child, s = null; r !== null; ) e = r.alternate, e !== null && ni(e) === null && (s = r), r = r.sibling;
              r = s, r === null ? (s = t.child, t.child = null) : (s = r.sibling, r.sibling = null), vs(t, !1, s, r, p, t.lastEffect);
              break;
            case "backwards":
              for (r = null, s = t.child, t.child = null; s !== null; ) {
                if (e = s.alternate, e !== null && ni(e) === null) {
                  t.child = s;
                  break;
                }
                e = s.sibling, s.sibling = r, r = s, s = e;
              }
              vs(t, !0, r, null, p, t.lastEffect);
              break;
            case "together":
              vs(t, !1, null, null, void 0, t.lastEffect);
              break;
            default:
              t.memoizedState = null;
          }
          return t.child;
        }
        function Xt(e, t, r) {
          e !== null && (t.dependencies = e.dependencies);
          var i = t.expirationTime;
          if (i !== 0 && xi(i), t.childExpirationTime < r) return null;
          if (e !== null && t.child !== e.child) throw Error(c(153));
          if (t.child !== null) {
            for (e = t.child, r = $n(e, e.pendingProps), t.child = r, r.return = t; e.sibling !== null; ) e = e.sibling, r = r.sibling = $n(e, e.pendingProps), r.return = t;
            r.sibling = null;
          }
          return t.child;
        }
        var tb = function(e, t) {
          for (var r = t.child; r !== null; ) {
            if (r.tag === 5 || r.tag === 6) e.appendChild(r.stateNode);
            else if (r.tag !== 4 && r.child !== null) {
              r.child.return = r, r = r.child;
              continue;
            }
            if (r === t) break;
            for (; r.sibling === null; ) {
              if (r.return === null || r.return === t) return;
              r = r.return;
            }
            r.sibling.return = r.return, r = r.sibling;
          }
        }, nb = function(e, t, r, i, s) {
          var p = e.memoizedProps;
          if (p !== i) {
            var h = t.stateNode;
            switch (Rn(jt.current), e = null, r) {
              case "input":
                p = la(h, p), i = la(h, i), e = [];
                break;
              case "option":
                p = da(h, p), i = da(h, i), e = [];
                break;
              case "select":
                p = a({}, p, { value: void 0 }), i = a({}, i, { value: void 0 }), e = [];
                break;
              case "textarea":
                p = pa(h, p), i = pa(h, i), e = [];
                break;
              default:
                typeof p.onClick != "function" && typeof i.onClick == "function" && (h.onclick = zo);
            }
            Oa(r, i);
            var _, F;
            for (_ in r = null, p) if (!i.hasOwnProperty(_) && p.hasOwnProperty(_) && p[_] != null) if (_ === "style") for (F in h = p[_], h) h.hasOwnProperty(F) && (r || (r = {}), r[F] = "");
            else _ !== "dangerouslySetInnerHTML" && _ !== "children" && _ !== "suppressContentEditableWarning" && _ !== "suppressHydrationWarning" && _ !== "autoFocus" && (we.hasOwnProperty(_) ? e || (e = []) : (e || (e = [])).push(_, null));
            for (_ in i) {
              var H = i[_];
              if (h = p == null ? void 0 : p[_], i.hasOwnProperty(_) && H !== h && (H != null || h != null)) if (_ === "style") if (h) {
                for (F in h) !h.hasOwnProperty(F) || H && H.hasOwnProperty(F) || (r || (r = {}), r[F] = "");
                for (F in H) H.hasOwnProperty(F) && h[F] !== H[F] && (r || (r = {}), r[F] = H[F]);
              } else r || (e || (e = []), e.push(_, r)), r = H;
              else _ === "dangerouslySetInnerHTML" ? (H = H ? H.__html : void 0, h = h ? h.__html : void 0, H != null && h !== H && (e || (e = [])).push(_, H)) : _ === "children" ? h === H || typeof H != "string" && typeof H != "number" || (e || (e = [])).push(_, "" + H) : _ !== "suppressContentEditableWarning" && _ !== "suppressHydrationWarning" && (we.hasOwnProperty(_) ? (H != null && qt(s, _), e || h === H || (e = [])) : (e || (e = [])).push(_, H));
            }
            r && (e || (e = [])).push("style", r), s = e, (t.updateQueue = s) && (t.effectTag |= 4);
          }
        }, rb = function(e, t, r, i) {
          r !== i && (t.effectTag |= 4);
        };
        function di(e, t) {
          switch (e.tailMode) {
            case "hidden":
              t = e.tail;
              for (var r = null; t !== null; ) t.alternate !== null && (r = t), t = t.sibling;
              r === null ? e.tail = null : r.sibling = null;
              break;
            case "collapsed":
              r = e.tail;
              for (var i = null; r !== null; ) r.alternate !== null && (i = r), r = r.sibling;
              i === null ? t || e.tail === null ? e.tail = null : e.tail.sibling = null : i.sibling = null;
          }
        }
        function ob(e, t, r) {
          var i = t.pendingProps;
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
              return ht(t.type) && Ho(), null;
            case 3:
              return ur(), $e(ft), $e(ct), r = t.stateNode, r.pendingContext && (r.context = r.pendingContext, r.pendingContext = null), e !== null && e.child !== null || !ui(t) || (t.effectTag |= 4), null;
            case 5:
              os(t), r = Rn(Yr.current);
              var s = t.type;
              if (e !== null && t.stateNode != null) nb(e, t, s, i, r), e.ref !== t.ref && (t.effectTag |= 128);
              else {
                if (!i) {
                  if (t.stateNode === null) throw Error(c(166));
                  return null;
                }
                if (e = Rn(jt.current), ui(t)) {
                  i = t.stateNode, s = t.type;
                  var p = t.memoizedProps;
                  switch (i[ln] = t, i[jo] = p, s) {
                    case "iframe":
                    case "object":
                    case "embed":
                      He("load", i);
                      break;
                    case "video":
                    case "audio":
                      for (e = 0; e < xr.length; e++) He(xr[e], i);
                      break;
                    case "source":
                      He("error", i);
                      break;
                    case "img":
                    case "image":
                    case "link":
                      He("error", i), He("load", i);
                      break;
                    case "form":
                      He("reset", i), He("submit", i);
                      break;
                    case "details":
                      He("toggle", i);
                      break;
                    case "input":
                      Rc(i, p), He("invalid", i), qt(r, "onChange");
                      break;
                    case "select":
                      i._wrapperState = { wasMultiple: !!p.multiple }, He("invalid", i), qt(r, "onChange");
                      break;
                    case "textarea":
                      zc(i, p), He("invalid", i), qt(r, "onChange");
                  }
                  for (var h in Oa(s, p), e = null, p) if (p.hasOwnProperty(h)) {
                    var _ = p[h];
                    h === "children" ? typeof _ == "string" ? i.textContent !== _ && (e = ["children", _]) : typeof _ == "number" && i.textContent !== "" + _ && (e = ["children", "" + _]) : we.hasOwnProperty(h) && _ != null && qt(r, h);
                  }
                  switch (s) {
                    case "input":
                      Oo(i), Ac(i, p, !0);
                      break;
                    case "textarea":
                      Oo(i), Lc(i);
                      break;
                    case "select":
                    case "option":
                      break;
                    default:
                      typeof p.onClick == "function" && (i.onclick = zo);
                  }
                  r = e, t.updateQueue = r, r !== null && (t.effectTag |= 4);
                } else {
                  switch (h = r.nodeType === 9 ? r : r.ownerDocument, e === du && (e = Vc(s)), e === du ? s === "script" ? (e = h.createElement("div"), e.innerHTML = "<script><\/script>", e = e.removeChild(e.firstChild)) : typeof i.is == "string" ? e = h.createElement(s, { is: i.is }) : (e = h.createElement(s), s === "select" && (h = e, i.multiple ? h.multiple = !0 : i.size && (h.size = i.size))) : e = h.createElementNS(e, s), e[ln] = t, e[jo] = i, tb(e, t), t.stateNode = e, h = Na(s, i), s) {
                    case "iframe":
                    case "object":
                    case "embed":
                      He("load", e), _ = i;
                      break;
                    case "video":
                    case "audio":
                      for (_ = 0; _ < xr.length; _++) He(xr[_], e);
                      _ = i;
                      break;
                    case "source":
                      He("error", e), _ = i;
                      break;
                    case "img":
                    case "image":
                    case "link":
                      He("error", e), He("load", e), _ = i;
                      break;
                    case "form":
                      He("reset", e), He("submit", e), _ = i;
                      break;
                    case "details":
                      He("toggle", e), _ = i;
                      break;
                    case "input":
                      Rc(e, i), _ = la(e, i), He("invalid", e), qt(r, "onChange");
                      break;
                    case "option":
                      _ = da(e, i);
                      break;
                    case "select":
                      e._wrapperState = { wasMultiple: !!i.multiple }, _ = a({}, i, { value: void 0 }), He("invalid", e), qt(r, "onChange");
                      break;
                    case "textarea":
                      zc(e, i), _ = pa(e, i), He("invalid", e), qt(r, "onChange");
                      break;
                    default:
                      _ = i;
                  }
                  Oa(s, _);
                  var F = _;
                  for (p in F) if (F.hasOwnProperty(p)) {
                    var H = F[p];
                    p === "style" ? uu(e, H) : p === "dangerouslySetInnerHTML" ? (H = H ? H.__html : void 0, H != null && Fc(e, H)) : p === "children" ? typeof H == "string" ? (s !== "textarea" || H !== "") && _r(e, H) : typeof H == "number" && _r(e, "" + H) : p !== "suppressContentEditableWarning" && p !== "suppressHydrationWarning" && p !== "autoFocus" && (we.hasOwnProperty(p) ? H != null && qt(r, p) : H != null && nn(e, p, H, h));
                  }
                  switch (s) {
                    case "input":
                      Oo(e), Ac(e, i, !1);
                      break;
                    case "textarea":
                      Oo(e), Lc(e);
                      break;
                    case "option":
                      i.value != null && e.setAttribute("value", "" + rn(i.value));
                      break;
                    case "select":
                      e.multiple = !!i.multiple, r = i.value, r == null ? i.defaultValue != null && Zn(e, !!i.multiple, i.defaultValue, !0) : Zn(e, !!i.multiple, r, !1);
                      break;
                    default:
                      typeof _.onClick == "function" && (e.onclick = zo);
                  }
                  bu(s, i) && (t.effectTag |= 4);
                }
                t.ref !== null && (t.effectTag |= 128);
              }
              return null;
            case 6:
              if (e && t.stateNode != null) rb(e, t, e.memoizedProps, i);
              else {
                if (typeof i != "string" && t.stateNode === null) throw Error(c(166));
                r = Rn(Yr.current), Rn(jt.current), ui(t) ? (r = t.stateNode, i = t.memoizedProps, r[ln] = t, r.nodeValue !== i && (t.effectTag |= 4)) : (r = (r.nodeType === 9 ? r : r.ownerDocument).createTextNode(i), r[ln] = t, t.stateNode = r);
              }
              return null;
            case 13:
              return $e(We), i = t.memoizedState, t.effectTag & 64 ? (t.expirationTime = r, t) : (r = i !== null, i = !1, e === null ? t.memoizedProps.fallback !== void 0 && ui(t) : (s = e.memoizedState, i = s !== null, r || s === null || (s = e.child.sibling, s !== null && (p = t.firstEffect, p === null ? (t.firstEffect = t.lastEffect = s, s.nextEffect = null) : (t.firstEffect = s, s.nextEffect = p), s.effectTag = 8))), r && !i && t.mode & 2 && (e === null && t.memoizedProps.unstable_avoidThisFallback !== !0 || We.current & 1 ? nt === zn && (nt = hi) : ((nt === zn || nt === hi) && (nt = mi), Xr !== 0 && kt !== null && (Hn(kt, mt), tp(kt, Xr)))), (r || i) && (t.effectTag |= 4), null);
            case 4:
              return ur(), null;
            case 10:
              return Za(t), null;
            case 17:
              return ht(t.type) && Ho(), null;
            case 19:
              if ($e(We), i = t.memoizedState, i === null) return null;
              if (s = (t.effectTag & 64) != 0, p = i.rendering, p === null) {
                if (s) di(i, !1);
                else if (nt !== zn || e !== null && e.effectTag & 64) for (p = t.child; p !== null; ) {
                  if (e = ni(p), e !== null) {
                    for (t.effectTag |= 64, di(i, !1), s = e.updateQueue, s !== null && (t.updateQueue = s, t.effectTag |= 4), i.lastEffect === null && (t.firstEffect = null), t.lastEffect = i.lastEffect, i = t.child; i !== null; ) s = i, p = r, s.effectTag &= 2, s.nextEffect = null, s.firstEffect = null, s.lastEffect = null, e = s.alternate, e === null ? (s.childExpirationTime = 0, s.expirationTime = p, s.child = null, s.memoizedProps = null, s.memoizedState = null, s.updateQueue = null, s.dependencies = null) : (s.childExpirationTime = e.childExpirationTime, s.expirationTime = e.expirationTime, s.child = e.child, s.memoizedProps = e.memoizedProps, s.memoizedState = e.memoizedState, s.updateQueue = e.updateQueue, p = e.dependencies, s.dependencies = p === null ? null : { expirationTime: p.expirationTime, firstContext: p.firstContext, responders: p.responders }), i = i.sibling;
                    return qe(We, We.current & 1 | 2), t.child;
                  }
                  p = p.sibling;
                }
              } else {
                if (!s) if (e = ni(p), e !== null) {
                  if (t.effectTag |= 64, s = !0, r = e.updateQueue, r !== null && (t.updateQueue = r, t.effectTag |= 4), di(i, !0), i.tail === null && i.tailMode === "hidden" && !p.alternate) return t = t.lastEffect = i.lastEffect, t !== null && (t.nextEffect = null), null;
                } else 2 * _t() - i.renderingStartTime > i.tailExpiration && 1 < r && (t.effectTag |= 64, s = !0, di(i, !1), t.expirationTime = t.childExpirationTime = r - 1);
                i.isBackwards ? (p.sibling = t.child, t.child = p) : (r = i.last, r === null ? t.child = p : r.sibling = p, i.last = p);
              }
              return i.tail === null ? null : (i.tailExpiration === 0 && (i.tailExpiration = _t() + 500), r = i.tail, i.rendering = r, i.tail = r.sibling, i.lastEffect = t.lastEffect, i.renderingStartTime = _t(), r.sibling = null, t = We.current, qe(We, s ? t & 1 | 2 : t & 1), r);
          }
          throw Error(c(156, t.tag));
        }
        function ib(e) {
          switch (e.tag) {
            case 1:
              ht(e.type) && Ho();
              var t = e.effectTag;
              return t & 4096 ? (e.effectTag = t & -4097 | 64, e) : null;
            case 3:
              if (ur(), $e(ft), $e(ct), t = e.effectTag, t & 64) throw Error(c(285));
              return e.effectTag = t & -4097 | 64, e;
            case 5:
              return os(e), null;
            case 13:
              return $e(We), t = e.effectTag, t & 4096 ? (e.effectTag = t & -4097 | 64, e) : null;
            case 19:
              return $e(We), null;
            case 4:
              return ur(), null;
            case 10:
              return Za(e), null;
            default:
              return null;
          }
        }
        function ks(e, t) {
          return { value: e, source: t, stack: sa(t) };
        }
        var ab = typeof WeakSet == "function" ? WeakSet : Set;
        function ws(e, t) {
          var r = t.source, i = t.stack;
          i === null && r !== null && (i = sa(r)), r !== null && Wt(r.type), t = t.value, e !== null && e.tag === 1 && Wt(e.type);
          try {
            console.error(t);
          } catch (s) {
            setTimeout(function() {
              throw s;
            });
          }
        }
        function sb(e, t) {
          try {
            t.props = e.memoizedProps, t.state = e.memoizedState, t.componentWillUnmount();
          } catch (r) {
            Fn(e, r);
          }
        }
        function Dd(e) {
          var t = e.ref;
          if (t !== null) if (typeof t == "function") try {
            t(null);
          } catch (r) {
            Fn(e, r);
          }
          else t.current = null;
        }
        function lb(e, t) {
          switch (t.tag) {
            case 0:
            case 11:
            case 15:
            case 22:
              return;
            case 1:
              if (t.effectTag & 256 && e !== null) {
                var r = e.memoizedProps, i = e.memoizedState;
                e = t.stateNode, t = e.getSnapshotBeforeUpdate(t.elementType === t.type ? r : Pt(t.type, r), i), e.__reactInternalSnapshotBeforeUpdate = t;
              }
              return;
            case 3:
            case 5:
            case 6:
            case 4:
            case 17:
              return;
          }
          throw Error(c(163));
        }
        function Id(e, t) {
          if (t = t.updateQueue, t = t === null ? null : t.lastEffect, t !== null) {
            var r = t = t.next;
            do {
              if ((r.tag & e) === e) {
                var i = r.destroy;
                r.destroy = void 0, i !== void 0 && i();
              }
              r = r.next;
            } while (r !== t);
          }
        }
        function Rd(e, t) {
          if (t = t.updateQueue, t = t === null ? null : t.lastEffect, t !== null) {
            var r = t = t.next;
            do {
              if ((r.tag & e) === e) {
                var i = r.create;
                r.destroy = i();
              }
              r = r.next;
            } while (r !== t);
          }
        }
        function cb(e, t, r) {
          switch (r.tag) {
            case 0:
            case 11:
            case 15:
            case 22:
              Rd(3, r);
              return;
            case 1:
              if (e = r.stateNode, r.effectTag & 4) if (t === null) e.componentDidMount();
              else {
                var i = r.elementType === r.type ? t.memoizedProps : Pt(r.type, t.memoizedProps);
                e.componentDidUpdate(i, t.memoizedState, e.__reactInternalSnapshotBeforeUpdate);
              }
              t = r.updateQueue, t !== null && od(r, t, e);
              return;
            case 3:
              if (t = r.updateQueue, t !== null) {
                if (e = null, r.child !== null) switch (r.child.tag) {
                  case 5:
                    e = r.child.stateNode;
                    break;
                  case 1:
                    e = r.child.stateNode;
                }
                od(r, t, e);
              }
              return;
            case 5:
              e = r.stateNode, t === null && r.effectTag & 4 && bu(r.type, r.memoizedProps) && e.focus();
              return;
            case 6:
              return;
            case 4:
              return;
            case 12:
              return;
            case 13:
              r.memoizedState === null && (r = r.alternate, r !== null && (r = r.memoizedState, r !== null && (r = r.dehydrated, r !== null && iu(r))));
              return;
            case 19:
            case 17:
            case 20:
            case 21:
              return;
          }
          throw Error(c(163));
        }
        function Md(e, t, r) {
          switch (typeof Rs == "function" && Rs(t), t.tag) {
            case 0:
            case 11:
            case 14:
            case 15:
            case 22:
              if (e = t.updateQueue, e !== null && (e = e.lastEffect, e !== null)) {
                var i = e.next;
                dn(97 < r ? 97 : r, function() {
                  var s = i;
                  do {
                    var p = s.destroy;
                    if (p !== void 0) {
                      var h = t;
                      try {
                        p();
                      } catch (_) {
                        Fn(h, _);
                      }
                    }
                    s = s.next;
                  } while (s !== i);
                });
              }
              break;
            case 1:
              Dd(t), r = t.stateNode, typeof r.componentWillUnmount == "function" && sb(t, r);
              break;
            case 5:
              Dd(t);
              break;
            case 4:
              Ld(e, t, r);
          }
        }
        function Ad(e) {
          var t = e.alternate;
          e.return = null, e.child = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.alternate = null, e.firstEffect = null, e.lastEffect = null, e.pendingProps = null, e.memoizedProps = null, e.stateNode = null, t !== null && Ad(t);
        }
        function zd(e) {
          return e.tag === 5 || e.tag === 3 || e.tag === 4;
        }
        function jd(e) {
          e: {
            for (var t = e.return; t !== null; ) {
              if (zd(t)) {
                var r = t;
                break e;
              }
              t = t.return;
            }
            throw Error(c(160));
          }
          switch (t = r.stateNode, r.tag) {
            case 5:
              var i = !1;
              break;
            case 3:
              t = t.containerInfo, i = !0;
              break;
            case 4:
              t = t.containerInfo, i = !0;
              break;
            default:
              throw Error(c(161));
          }
          r.effectTag & 16 && (_r(t, ""), r.effectTag &= -17);
          e: t: for (r = e; ; ) {
            for (; r.sibling === null; ) {
              if (r.return === null || zd(r.return)) {
                r = null;
                break e;
              }
              r = r.return;
            }
            for (r.sibling.return = r.return, r = r.sibling; r.tag !== 5 && r.tag !== 6 && r.tag !== 18; ) {
              if (r.effectTag & 2 || r.child === null || r.tag === 4) continue t;
              r.child.return = r, r = r.child;
            }
            if (!(r.effectTag & 2)) {
              r = r.stateNode;
              break e;
            }
          }
          i ? Es(e, r, t) : _s(e, r, t);
        }
        function Es(e, t, r) {
          var i = e.tag, s = i === 5 || i === 6;
          if (s) e = s ? e.stateNode : e.stateNode.instance, t ? r.nodeType === 8 ? r.parentNode.insertBefore(e, t) : r.insertBefore(e, t) : (r.nodeType === 8 ? (t = r.parentNode, t.insertBefore(e, r)) : (t = r, t.appendChild(e)), r = r._reactRootContainer, r != null || t.onclick !== null || (t.onclick = zo));
          else if (i !== 4 && (e = e.child, e !== null)) for (Es(e, t, r), e = e.sibling; e !== null; ) Es(e, t, r), e = e.sibling;
        }
        function _s(e, t, r) {
          var i = e.tag, s = i === 5 || i === 6;
          if (s) e = s ? e.stateNode : e.stateNode.instance, t ? r.insertBefore(e, t) : r.appendChild(e);
          else if (i !== 4 && (e = e.child, e !== null)) for (_s(e, t, r), e = e.sibling; e !== null; ) _s(e, t, r), e = e.sibling;
        }
        function Ld(e, t, r) {
          for (var i = t, s = !1, p, h; ; ) {
            if (!s) {
              s = i.return;
              e: for (; ; ) {
                if (s === null) throw Error(c(160));
                switch (p = s.stateNode, s.tag) {
                  case 5:
                    h = !1;
                    break e;
                  case 3:
                    p = p.containerInfo, h = !0;
                    break e;
                  case 4:
                    p = p.containerInfo, h = !0;
                    break e;
                }
                s = s.return;
              }
              s = !0;
            }
            if (i.tag === 5 || i.tag === 6) {
              e: for (var _ = e, F = i, H = r, ge = F; ; ) if (Md(_, ge, H), ge.child !== null && ge.tag !== 4) ge.child.return = ge, ge = ge.child;
              else {
                if (ge === F) break e;
                for (; ge.sibling === null; ) {
                  if (ge.return === null || ge.return === F) break e;
                  ge = ge.return;
                }
                ge.sibling.return = ge.return, ge = ge.sibling;
              }
              h ? (_ = p, F = i.stateNode, _.nodeType === 8 ? _.parentNode.removeChild(F) : _.removeChild(F)) : p.removeChild(i.stateNode);
            } else if (i.tag === 4) {
              if (i.child !== null) {
                p = i.stateNode.containerInfo, h = !0, i.child.return = i, i = i.child;
                continue;
              }
            } else if (Md(e, i, r), i.child !== null) {
              i.child.return = i, i = i.child;
              continue;
            }
            if (i === t) break;
            for (; i.sibling === null; ) {
              if (i.return === null || i.return === t) return;
              i = i.return, i.tag === 4 && (s = !1);
            }
            i.sibling.return = i.return, i = i.sibling;
          }
        }
        function xs(e, t) {
          switch (t.tag) {
            case 0:
            case 11:
            case 14:
            case 15:
            case 22:
              Id(3, t);
              return;
            case 1:
              return;
            case 5:
              var r = t.stateNode;
              if (r != null) {
                var i = t.memoizedProps, s = e === null ? i : e.memoizedProps;
                e = t.type;
                var p = t.updateQueue;
                if (t.updateQueue = null, p !== null) {
                  for (r[jo] = i, e === "input" && i.type === "radio" && i.name != null && Mc(r, i), Na(e, s), t = Na(e, i), s = 0; s < p.length; s += 2) {
                    var h = p[s], _ = p[s + 1];
                    h === "style" ? uu(r, _) : h === "dangerouslySetInnerHTML" ? Fc(r, _) : h === "children" ? _r(r, _) : nn(r, h, _, t);
                  }
                  switch (e) {
                    case "input":
                      ca(r, i);
                      break;
                    case "textarea":
                      jc(r, i);
                      break;
                    case "select":
                      t = r._wrapperState.wasMultiple, r._wrapperState.wasMultiple = !!i.multiple, e = i.value, e == null ? t !== !!i.multiple && (i.defaultValue == null ? Zn(r, !!i.multiple, i.multiple ? [] : "", !1) : Zn(r, !!i.multiple, i.defaultValue, !0)) : Zn(r, !!i.multiple, e, !1);
                  }
                }
              }
              return;
            case 6:
              if (t.stateNode === null) throw Error(c(162));
              t.stateNode.nodeValue = t.memoizedProps;
              return;
            case 3:
              t = t.stateNode, t.hydrate && (t.hydrate = !1, iu(t.containerInfo));
              return;
            case 12:
              return;
            case 13:
              if (r = t, t.memoizedState === null ? i = !1 : (i = !0, r = t.child, Ts = _t()), r !== null) e: for (e = r; ; ) {
                if (e.tag === 5) p = e.stateNode, i ? (p = p.style, typeof p.setProperty == "function" ? p.setProperty("display", "none", "important") : p.display = "none") : (p = e.stateNode, s = e.memoizedProps.style, s = s != null && s.hasOwnProperty("display") ? s.display : null, p.style.display = cu("display", s));
                else if (e.tag === 6) e.stateNode.nodeValue = i ? "" : e.memoizedProps;
                else if (e.tag === 13 && e.memoizedState !== null && e.memoizedState.dehydrated === null) {
                  p = e.child.sibling, p.return = e, e = p;
                  continue;
                } else if (e.child !== null) {
                  e.child.return = e, e = e.child;
                  continue;
                }
                if (e === r) break;
                for (; e.sibling === null; ) {
                  if (e.return === null || e.return === r) break e;
                  e = e.return;
                }
                e.sibling.return = e.return, e = e.sibling;
              }
              Ud(t);
              return;
            case 19:
              Ud(t);
              return;
            case 17:
              return;
          }
          throw Error(c(163));
        }
        function Ud(e) {
          var t = e.updateQueue;
          if (t !== null) {
            e.updateQueue = null;
            var r = e.stateNode;
            r === null && (r = e.stateNode = new ab()), t.forEach(function(i) {
              var s = vb.bind(null, e, i);
              r.has(i) || (r.add(i), i.then(s, s));
            });
          }
        }
        var ub = typeof WeakMap == "function" ? WeakMap : Map;
        function Vd(e, t, r) {
          r = fn(r, null), r.tag = 3, r.payload = { element: null };
          var i = t.value;
          return r.callback = function() {
            vi || (vi = !0, Os = i), ws(e, t);
          }, r;
        }
        function Fd(e, t, r) {
          r = fn(r, null), r.tag = 3;
          var i = e.type.getDerivedStateFromError;
          if (typeof i == "function") {
            var s = t.value;
            r.payload = function() {
              return ws(e, t), i(s);
            };
          }
          var p = e.stateNode;
          return p !== null && typeof p.componentDidCatch == "function" && (r.callback = function() {
            typeof i != "function" && (yn === null ? yn = /* @__PURE__ */ new Set([this]) : yn.add(this), ws(e, t));
            var h = t.stack;
            this.componentDidCatch(t.value, { componentStack: h === null ? "" : h });
          }), r;
        }
        var db = Math.ceil, pi = Ye.ReactCurrentDispatcher, $d = Ye.ReactCurrentOwner, tt = 0, Cs = 8, Dt = 16, Ut = 32, zn = 0, fi = 1, Hd = 2, hi = 3, mi = 4, Ss = 5, Ne = tt, kt = null, Re = null, mt = 0, nt = zn, gi = null, Zt = 1073741823, Gr = 1073741823, yi = null, Xr = 0, bi = !1, Ts = 0, Bd = 500, _e = null, vi = !1, Os = null, yn = null, ki = !1, Zr = null, Jr = 90, jn = null, eo = 0, Ns = null, wi = 0;
        function Vt() {
          return (Ne & (Dt | Ut)) === tt ? wi === 0 ? wi = 1073741821 - (_t() / 10 | 0) : wi : 1073741821 - (_t() / 10 | 0);
        }
        function Ln(e, t, r) {
          if (t = t.mode, !(t & 2)) return 1073741823;
          var i = Ko();
          if (!(t & 4)) return i === 99 ? 1073741823 : 1073741822;
          if ((Ne & Dt) !== tt) return mt;
          if (r !== null) e = Qo(e, r.timeoutMs | 0 || 5e3, 250);
          else switch (i) {
            case 99:
              e = 1073741823;
              break;
            case 98:
              e = Qo(e, 150, 100);
              break;
            case 97:
            case 96:
              e = Qo(e, 5e3, 250);
              break;
            case 95:
              e = 2;
              break;
            default:
              throw Error(c(326));
          }
          return kt !== null && e === mt && --e, e;
        }
        function bn(e, t) {
          if (50 < eo) throw eo = 0, Ns = null, Error(c(185));
          if (e = Ei(e, t), e !== null) {
            var r = Ko();
            t === 1073741823 ? (Ne & Cs) !== tt && (Ne & (Dt | Ut)) === tt ? Ps(e) : (wt(e), Ne === tt && zt()) : wt(e), (Ne & 4) === tt || r !== 98 && r !== 99 || (jn === null ? jn = /* @__PURE__ */ new Map([[e, t]]) : (r = jn.get(e), (r === void 0 || r > t) && jn.set(e, t)));
          }
        }
        function Ei(e, t) {
          e.expirationTime < t && (e.expirationTime = t);
          var r = e.alternate;
          r !== null && r.expirationTime < t && (r.expirationTime = t);
          var i = e.return, s = null;
          if (i === null && e.tag === 3) s = e.stateNode;
          else for (; i !== null; ) {
            if (r = i.alternate, i.childExpirationTime < t && (i.childExpirationTime = t), r !== null && r.childExpirationTime < t && (r.childExpirationTime = t), i.return === null && i.tag === 3) {
              s = i.stateNode;
              break;
            }
            i = i.return;
          }
          return s !== null && (kt === s && (xi(t), nt === mi && Hn(s, mt)), tp(s, t)), s;
        }
        function _i(e) {
          var t = e.lastExpiredTime;
          if (t !== 0 || (t = e.firstPendingTime, !ep(e, t))) return t;
          var r = e.lastPingedTime;
          return e = e.nextKnownPendingLevel, e = r > e ? r : e, 2 >= e && t !== e ? 0 : e;
        }
        function wt(e) {
          if (e.lastExpiredTime !== 0) e.callbackExpirationTime = 1073741823, e.callbackPriority = 99, e.callbackNode = ed(Ps.bind(null, e));
          else {
            var t = _i(e), r = e.callbackNode;
            if (t === 0) r !== null && (e.callbackNode = null, e.callbackExpirationTime = 0, e.callbackPriority = 90);
            else {
              var i = Vt();
              if (t === 1073741823 ? i = 99 : t === 1 || t === 2 ? i = 95 : (i = 10 * (1073741821 - t) - 10 * (1073741821 - i), i = 0 >= i ? 99 : 250 >= i ? 98 : 5250 >= i ? 97 : 95), r !== null) {
                var s = e.callbackPriority;
                if (e.callbackExpirationTime === t && s >= i) return;
                r !== Gu && Bu(r);
              }
              e.callbackExpirationTime = t, e.callbackPriority = i, t = t === 1073741823 ? ed(Ps.bind(null, e)) : Ju(i, Wd.bind(null, e), { timeout: 10 * (1073741821 - t) - _t() }), e.callbackNode = t;
            }
          }
        }
        function Wd(e, t) {
          if (wi = 0, t) return t = Vt(), js(e, t), wt(e), null;
          var r = _i(e);
          if (r !== 0) {
            if (t = e.callbackNode, (Ne & (Dt | Ut)) !== tt) throw Error(c(327));
            if (fr(), e === kt && r === mt || Un(e, r), Re !== null) {
              var i = Ne;
              Ne |= Dt;
              var s = Yd();
              do
                try {
                  hb();
                  break;
                } catch (_) {
                  Qd(e, _);
                }
              while (!0);
              if (Xa(), Ne = i, pi.current = s, nt === fi) throw t = gi, Un(e, r), Hn(e, r), wt(e), t;
              if (Re === null) switch (s = e.finishedWork = e.current.alternate, e.finishedExpirationTime = r, i = nt, kt = null, i) {
                case zn:
                case fi:
                  throw Error(c(345));
                case Hd:
                  js(e, 2 < r ? 2 : r);
                  break;
                case hi:
                  if (Hn(e, r), i = e.lastSuspendedTime, r === i && (e.nextKnownPendingLevel = Ds(s)), Zt === 1073741823 && (s = Ts + Bd - _t(), 10 < s)) {
                    if (bi) {
                      var p = e.lastPingedTime;
                      if (p === 0 || p >= r) {
                        e.lastPingedTime = r, Un(e, r);
                        break;
                      }
                    }
                    if (p = _i(e), p !== 0 && p !== r) break;
                    if (i !== 0 && i !== r) {
                      e.lastPingedTime = i;
                      break;
                    }
                    e.timeoutHandle = ja(Vn.bind(null, e), s);
                    break;
                  }
                  Vn(e);
                  break;
                case mi:
                  if (Hn(e, r), i = e.lastSuspendedTime, r === i && (e.nextKnownPendingLevel = Ds(s)), bi && (s = e.lastPingedTime, s === 0 || s >= r)) {
                    e.lastPingedTime = r, Un(e, r);
                    break;
                  }
                  if (s = _i(e), s !== 0 && s !== r) break;
                  if (i !== 0 && i !== r) {
                    e.lastPingedTime = i;
                    break;
                  }
                  if (Gr === 1073741823 ? Zt === 1073741823 ? i = 0 : (i = 10 * (1073741821 - Zt) - 5e3, s = _t(), r = 10 * (1073741821 - r) - s, i = s - i, 0 > i && (i = 0), i = (120 > i ? 120 : 480 > i ? 480 : 1080 > i ? 1080 : 1920 > i ? 1920 : 3e3 > i ? 3e3 : 4320 > i ? 4320 : 1960 * db(i / 1960)) - i, r < i && (i = r)) : i = 10 * (1073741821 - Gr) - _t(), 10 < i) {
                    e.timeoutHandle = ja(Vn.bind(null, e), i);
                    break;
                  }
                  Vn(e);
                  break;
                case Ss:
                  if (Zt !== 1073741823 && yi !== null) {
                    p = Zt;
                    var h = yi;
                    if (i = h.busyMinDurationMs | 0, 0 >= i ? i = 0 : (s = h.busyDelayMs | 0, p = _t() - (10 * (1073741821 - p) - (h.timeoutMs | 0 || 5e3)), i = p <= s ? 0 : s + i - p), 10 < i) {
                      Hn(e, r), e.timeoutHandle = ja(Vn.bind(null, e), i);
                      break;
                    }
                  }
                  Vn(e);
                  break;
                default:
                  throw Error(c(329));
              }
              if (wt(e), e.callbackNode === t) return Wd.bind(null, e);
            }
          }
          return null;
        }
        function Ps(e) {
          var t = e.lastExpiredTime;
          if (t = t === 0 ? 1073741823 : t, (Ne & (Dt | Ut)) !== tt) throw Error(c(327));
          if (fr(), e === kt && t === mt || Un(e, t), Re !== null) {
            var r = Ne;
            Ne |= Dt;
            var i = Yd();
            do
              try {
                fb();
                break;
              } catch (s) {
                Qd(e, s);
              }
            while (!0);
            if (Xa(), Ne = r, pi.current = i, nt === fi) throw r = gi, Un(e, t), Hn(e, t), wt(e), r;
            if (Re !== null) throw Error(c(261));
            e.finishedWork = e.current.alternate, e.finishedExpirationTime = t, kt = null, Vn(e), wt(e);
          }
          return null;
        }
        function pb() {
          if (jn !== null) {
            var e = jn;
            jn = null, e.forEach(function(t, r) {
              js(r, t), wt(r);
            }), zt();
          }
        }
        function qd(e, t) {
          var r = Ne;
          Ne |= 1;
          try {
            return e(t);
          } finally {
            Ne = r, Ne === tt && zt();
          }
        }
        function Kd(e, t) {
          var r = Ne;
          Ne &= -2, Ne |= Cs;
          try {
            return e(t);
          } finally {
            Ne = r, Ne === tt && zt();
          }
        }
        function Un(e, t) {
          e.finishedWork = null, e.finishedExpirationTime = 0;
          var r = e.timeoutHandle;
          if (r !== -1 && (e.timeoutHandle = -1, ly(r)), Re !== null) for (r = Re.return; r !== null; ) {
            var i = r;
            switch (i.tag) {
              case 1:
                i = i.type.childContextTypes, i != null && Ho();
                break;
              case 3:
                ur(), $e(ft), $e(ct);
                break;
              case 5:
                os(i);
                break;
              case 4:
                ur();
                break;
              case 13:
                $e(We);
                break;
              case 19:
                $e(We);
                break;
              case 10:
                Za(i);
            }
            r = r.return;
          }
          kt = e, Re = $n(e.current, null), mt = t, nt = zn, gi = null, Gr = Zt = 1073741823, yi = null, Xr = 0, bi = !1;
        }
        function Qd(e, t) {
          do {
            try {
              if (Xa(), ri.current = ci, oi) for (var r = Ze.memoizedState; r !== null; ) {
                var i = r.queue;
                i !== null && (i.pending = null), r = r.next;
              }
              if (mn = 0, dt = ut = Ze = null, oi = !1, Re === null || Re.return === null) return nt = fi, gi = t, Re = null;
              e: {
                var s = e, p = Re.return, h = Re, _ = t;
                if (t = mt, h.effectTag |= 2048, h.firstEffect = h.lastEffect = null, typeof _ == "object" && _ && typeof _.then == "function") {
                  var F = _;
                  if (!(h.mode & 2)) {
                    var H = h.alternate;
                    H ? (h.updateQueue = H.updateQueue, h.memoizedState = H.memoizedState, h.expirationTime = H.expirationTime) : (h.updateQueue = null, h.memoizedState = null);
                  }
                  var ge = (We.current & 1) != 0, ve = p;
                  do {
                    var Ae;
                    if (Ae = ve.tag === 13) {
                      var Le = ve.memoizedState;
                      if (Le !== null) Ae = Le.dehydrated !== null;
                      else {
                        var St = ve.memoizedProps;
                        Ae = St.fallback === void 0 ? !1 : St.unstable_avoidThisFallback === !0 ? !ge : !0;
                      }
                    }
                    if (Ae) {
                      var ot = ve.updateQueue;
                      if (ot === null) {
                        var j = /* @__PURE__ */ new Set();
                        j.add(F), ve.updateQueue = j;
                      } else ot.add(F);
                      if (!(ve.mode & 2)) {
                        if (ve.effectTag |= 64, h.effectTag &= -2981, h.tag === 1) if (h.alternate === null) h.tag = 17;
                        else {
                          var I = fn(1073741823, null);
                          I.tag = 2, hn(h, I);
                        }
                        h.expirationTime = 1073741823;
                        break e;
                      }
                      _ = void 0, h = t;
                      var Q = s.pingCache;
                      if (Q === null ? (Q = s.pingCache = new ub(), _ = /* @__PURE__ */ new Set(), Q.set(F, _)) : (_ = Q.get(F), _ === void 0 && (_ = /* @__PURE__ */ new Set(), Q.set(F, _))), !_.has(h)) {
                        _.add(h);
                        var ue = bb.bind(null, s, F, h);
                        F.then(ue, ue);
                      }
                      ve.effectTag |= 4096, ve.expirationTime = t;
                      break e;
                    }
                    ve = ve.return;
                  } while (ve !== null);
                  _ = Error((Wt(h.type) || "A React component") + ` suspended while rendering, but no fallback UI was specified.

Add a <Suspense fallback=...> component higher in the tree to provide a loading indicator or placeholder to display.` + sa(h));
                }
                nt !== Ss && (nt = Hd), _ = ks(_, h), ve = p;
                do {
                  switch (ve.tag) {
                    case 3:
                      F = _, ve.effectTag |= 4096, ve.expirationTime = t;
                      var fe = Vd(ve, F, t);
                      rd(ve, fe);
                      break e;
                    case 1:
                      F = _;
                      var ke = ve.type, Se = ve.stateNode;
                      if (!(ve.effectTag & 64) && (typeof ke.getDerivedStateFromError == "function" || Se !== null && typeof Se.componentDidCatch == "function" && (yn === null || !yn.has(Se)))) {
                        ve.effectTag |= 4096, ve.expirationTime = t;
                        var je = Fd(ve, F, t);
                        rd(ve, je);
                        break e;
                      }
                  }
                  ve = ve.return;
                } while (ve !== null);
              }
              Re = Zd(Re);
            } catch (Be) {
              t = Be;
              continue;
            }
            break;
          } while (!0);
        }
        function Yd() {
          var e = pi.current;
          return pi.current = ci, e === null ? ci : e;
        }
        function Gd(e, t) {
          e < Zt && 2 < e && (Zt = e), t !== null && e < Gr && 2 < e && (Gr = e, yi = t);
        }
        function xi(e) {
          e > Xr && (Xr = e);
        }
        function fb() {
          for (; Re !== null; ) Re = Xd(Re);
        }
        function hb() {
          for (; Re !== null && !Yy(); ) Re = Xd(Re);
        }
        function Xd(e) {
          var t = kb(e.alternate, e, mt);
          return e.memoizedProps = e.pendingProps, t === null && (t = Zd(e)), $d.current = null, t;
        }
        function Zd(e) {
          Re = e;
          do {
            var t = Re.alternate;
            if (e = Re.return, Re.effectTag & 2048) {
              if (t = ib(Re), t !== null) return t.effectTag &= 2047, t;
              e !== null && (e.firstEffect = e.lastEffect = null, e.effectTag |= 2048);
            } else {
              if (t = ob(t, Re, mt), mt === 1 || Re.childExpirationTime !== 1) {
                for (var r = 0, i = Re.child; i !== null; ) {
                  var s = i.expirationTime, p = i.childExpirationTime;
                  s > r && (r = s), p > r && (r = p), i = i.sibling;
                }
                Re.childExpirationTime = r;
              }
              if (t !== null) return t;
              e !== null && !(e.effectTag & 2048) && (e.firstEffect === null && (e.firstEffect = Re.firstEffect), Re.lastEffect !== null && (e.lastEffect !== null && (e.lastEffect.nextEffect = Re.firstEffect), e.lastEffect = Re.lastEffect), 1 < Re.effectTag && (e.lastEffect === null ? e.firstEffect = Re : e.lastEffect.nextEffect = Re, e.lastEffect = Re));
            }
            if (t = Re.sibling, t !== null) return t;
            Re = e;
          } while (Re !== null);
          return nt === zn && (nt = Ss), null;
        }
        function Ds(e) {
          var t = e.expirationTime;
          return e = e.childExpirationTime, t > e ? t : e;
        }
        function Vn(e) {
          var t = Ko();
          return dn(99, mb.bind(null, e, t)), null;
        }
        function mb(e, t) {
          do
            fr();
          while (Zr !== null);
          if ((Ne & (Dt | Ut)) !== tt) throw Error(c(327));
          var r = e.finishedWork, i = e.finishedExpirationTime;
          if (r === null) return null;
          if (e.finishedWork = null, e.finishedExpirationTime = 0, r === e.current) throw Error(c(177));
          e.callbackNode = null, e.callbackExpirationTime = 0, e.callbackPriority = 90, e.nextKnownPendingLevel = 0;
          var s = Ds(r);
          if (e.firstPendingTime = s, i <= e.lastSuspendedTime ? e.firstSuspendedTime = e.lastSuspendedTime = e.nextKnownPendingLevel = 0 : i <= e.firstSuspendedTime && (e.firstSuspendedTime = i - 1), i <= e.lastPingedTime && (e.lastPingedTime = 0), i <= e.lastExpiredTime && (e.lastExpiredTime = 0), e === kt && (Re = kt = null, mt = 0), 1 < r.effectTag ? r.lastEffect === null ? s = r : (r.lastEffect.nextEffect = r, s = r.firstEffect) : s = r.firstEffect, s !== null) {
            var p = Ne;
            Ne |= Ut, $d.current = null, Ma = Mo;
            var h = mu();
            if (Da(h)) {
              if ("selectionStart" in h) var _ = { start: h.selectionStart, end: h.selectionEnd };
              else e: {
                _ = (_ = h.ownerDocument) && _.defaultView || window;
                var F = _.getSelection && _.getSelection();
                if (F && F.rangeCount !== 0) {
                  _ = F.anchorNode;
                  var H = F.anchorOffset, ge = F.focusNode;
                  F = F.focusOffset;
                  try {
                    _.nodeType, ge.nodeType;
                  } catch {
                    _ = null;
                    break e;
                  }
                  var ve = 0, Ae = -1, Le = -1, St = 0, ot = 0, j = h, I = null;
                  t: for (; ; ) {
                    for (var Q; j !== _ || H !== 0 && j.nodeType !== 3 || (Ae = ve + H), j !== ge || F !== 0 && j.nodeType !== 3 || (Le = ve + F), j.nodeType === 3 && (ve += j.nodeValue.length), (Q = j.firstChild) !== null; ) I = j, j = Q;
                    for (; ; ) {
                      if (j === h) break t;
                      if (I === _ && ++St === H && (Ae = ve), I === ge && ++ot === F && (Le = ve), (Q = j.nextSibling) !== null) break;
                      j = I, I = j.parentNode;
                    }
                    j = Q;
                  }
                  _ = Ae === -1 || Le === -1 ? null : { start: Ae, end: Le };
                } else _ = null;
              }
              _ || (_ = { start: 0, end: 0 });
            } else _ = null;
            Aa = { activeElementDetached: null, focusedElem: h, selectionRange: _ }, Mo = !1, _e = s;
            do
              try {
                gb();
              } catch (Me) {
                if (_e === null) throw Error(c(330));
                Fn(_e, Me), _e = _e.nextEffect;
              }
            while (_e !== null);
            _e = s;
            do
              try {
                for (h = e, _ = t; _e !== null; ) {
                  var ue = _e.effectTag;
                  if (ue & 16 && _r(_e.stateNode, ""), ue & 128) {
                    var fe = _e.alternate;
                    if (fe !== null) {
                      var ke = fe.ref;
                      ke !== null && (typeof ke == "function" ? ke(null) : ke.current = null);
                    }
                  }
                  switch (ue & 1038) {
                    case 2:
                      jd(_e), _e.effectTag &= -3;
                      break;
                    case 6:
                      jd(_e), _e.effectTag &= -3, xs(_e.alternate, _e);
                      break;
                    case 1024:
                      _e.effectTag &= -1025;
                      break;
                    case 1028:
                      _e.effectTag &= -1025, xs(_e.alternate, _e);
                      break;
                    case 4:
                      xs(_e.alternate, _e);
                      break;
                    case 8:
                      H = _e, Ld(h, H, _), Ad(H);
                  }
                  _e = _e.nextEffect;
                }
              } catch (Me) {
                if (_e === null) throw Error(c(330));
                Fn(_e, Me), _e = _e.nextEffect;
              }
            while (_e !== null);
            if (ke = Aa, fe = mu(), ue = ke.focusedElem, _ = ke.selectionRange, fe !== ue && ue && ue.ownerDocument && hu(ue.ownerDocument.documentElement, ue)) {
              for (_ !== null && Da(ue) && (fe = _.start, ke = _.end, ke === void 0 && (ke = fe), "selectionStart" in ue ? (ue.selectionStart = fe, ue.selectionEnd = Math.min(ke, ue.value.length)) : (ke = (fe = ue.ownerDocument || document) && fe.defaultView || window, ke.getSelection && (ke = ke.getSelection(), H = ue.textContent.length, h = Math.min(_.start, H), _ = _.end === void 0 ? h : Math.min(_.end, H), !ke.extend && h > _ && (H = _, _ = h, h = H), H = fu(ue, h), ge = fu(ue, _), H && ge && (ke.rangeCount !== 1 || ke.anchorNode !== H.node || ke.anchorOffset !== H.offset || ke.focusNode !== ge.node || ke.focusOffset !== ge.offset) && (fe = fe.createRange(), fe.setStart(H.node, H.offset), ke.removeAllRanges(), h > _ ? (ke.addRange(fe), ke.extend(ge.node, ge.offset)) : (fe.setEnd(ge.node, ge.offset), ke.addRange(fe)))))), fe = [], ke = ue; ke = ke.parentNode; ) ke.nodeType === 1 && fe.push({ element: ke, left: ke.scrollLeft, top: ke.scrollTop });
              for (typeof ue.focus == "function" && ue.focus(), ue = 0; ue < fe.length; ue++) ke = fe[ue], ke.element.scrollLeft = ke.left, ke.element.scrollTop = ke.top;
            }
            Mo = !!Ma, Aa = Ma = null, e.current = r, _e = s;
            do
              try {
                for (ue = e; _e !== null; ) {
                  var Se = _e.effectTag;
                  if (Se & 36 && cb(ue, _e.alternate, _e), Se & 128) {
                    fe = void 0;
                    var je = _e.ref;
                    if (je !== null) {
                      var Be = _e.stateNode;
                      switch (_e.tag) {
                        case 5:
                          fe = Be;
                          break;
                        default:
                          fe = Be;
                      }
                      typeof je == "function" ? je(fe) : je.current = fe;
                    }
                  }
                  _e = _e.nextEffect;
                }
              } catch (Me) {
                if (_e === null) throw Error(c(330));
                Fn(_e, Me), _e = _e.nextEffect;
              }
            while (_e !== null);
            _e = null, Gy(), Ne = p;
          } else e.current = r;
          if (ki) ki = !1, Zr = e, Jr = t;
          else for (_e = s; _e !== null; ) t = _e.nextEffect, _e.nextEffect = null, _e = t;
          if (t = e.firstPendingTime, t === 0 && (yn = null), t === 1073741823 ? e === Ns ? eo++ : (eo = 0, Ns = e) : eo = 0, typeof Is == "function" && Is(r.stateNode, i), wt(e), vi) throw vi = !1, e = Os, Os = null, e;
          return (Ne & Cs) === tt && zt(), null;
        }
        function gb() {
          for (; _e !== null; ) {
            var e = _e.effectTag;
            e & 256 && lb(_e.alternate, _e), !(e & 512) || ki || (ki = !0, Ju(97, function() {
              return fr(), null;
            })), _e = _e.nextEffect;
          }
        }
        function fr() {
          if (Jr !== 90) {
            var e = 97 < Jr ? 97 : Jr;
            return Jr = 90, dn(e, yb);
          }
        }
        function yb() {
          if (Zr === null) return !1;
          var e = Zr;
          if (Zr = null, (Ne & (Dt | Ut)) !== tt) throw Error(c(331));
          var t = Ne;
          for (Ne |= Ut, e = e.current.firstEffect; e !== null; ) {
            try {
              var r = e;
              if (r.effectTag & 512) switch (r.tag) {
                case 0:
                case 11:
                case 15:
                case 22:
                  Id(5, r), Rd(5, r);
              }
            } catch (i) {
              if (e === null) throw Error(c(330));
              Fn(e, i);
            }
            r = e.nextEffect, e.nextEffect = null, e = r;
          }
          return Ne = t, zt(), !0;
        }
        function Jd(e, t, r) {
          t = ks(r, t), t = Vd(e, t, 1073741823), hn(e, t), e = Ei(e, 1073741823), e !== null && wt(e);
        }
        function Fn(e, t) {
          if (e.tag === 3) Jd(e, e, t);
          else for (var r = e.return; r !== null; ) {
            if (r.tag === 3) {
              Jd(r, e, t);
              break;
            } else if (r.tag === 1) {
              var i = r.stateNode;
              if (typeof r.type.getDerivedStateFromError == "function" || typeof i.componentDidCatch == "function" && (yn === null || !yn.has(i))) {
                e = ks(t, e), e = Fd(r, e, 1073741823), hn(r, e), r = Ei(r, 1073741823), r !== null && wt(r);
                break;
              }
            }
            r = r.return;
          }
        }
        function bb(e, t, r) {
          var i = e.pingCache;
          i !== null && i.delete(t), kt === e && mt === r ? nt === mi || nt === hi && Zt === 1073741823 && _t() - Ts < Bd ? Un(e, mt) : bi = !0 : ep(e, r) && (t = e.lastPingedTime, t !== 0 && t < r || (e.lastPingedTime = r, wt(e)));
        }
        function vb(e, t) {
          var r = e.stateNode;
          r !== null && r.delete(t), t = 0, t === 0 && (t = Vt(), t = Ln(t, e, null)), e = Ei(e, t), e !== null && wt(e);
        }
        var kb = function(e, t, r) {
          var i = t.expirationTime;
          if (e !== null) {
            var s = t.pendingProps;
            if (e.memoizedProps !== s || ft.current) Lt = !0;
            else {
              if (i < r) {
                switch (Lt = !1, t.tag) {
                  case 3:
                    Td(t), ms();
                    break;
                  case 5:
                    if (ud(t), t.mode & 4 && r !== 1 && s.hidden) return t.expirationTime = t.childExpirationTime = 1, null;
                    break;
                  case 1:
                    ht(t.type) && Bo(t);
                    break;
                  case 4:
                    rs(t, t.stateNode.containerInfo);
                    break;
                  case 10:
                    i = t.memoizedProps.value, s = t.type._context, qe(Yo, s._currentValue), s._currentValue = i;
                    break;
                  case 13:
                    if (t.memoizedState !== null) return i = t.child.childExpirationTime, i !== 0 && i >= r ? Od(e, t, r) : (qe(We, We.current & 1), t = Xt(e, t, r), t === null ? null : t.sibling);
                    qe(We, We.current & 1);
                    break;
                  case 19:
                    if (i = t.childExpirationTime >= r, e.effectTag & 64) {
                      if (i) return Pd(e, t, r);
                      t.effectTag |= 64;
                    }
                    if (s = t.memoizedState, s !== null && (s.rendering = null, s.tail = null), qe(We, We.current), !i) return null;
                }
                return Xt(e, t, r);
              }
              Lt = !1;
            }
          } else Lt = !1;
          switch (t.expirationTime = 0, t.tag) {
            case 2:
              if (i = t.type, e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= 2), e = t.pendingProps, s = ar(t, ct.current), lr(t, r), s = ss(null, t, i, e, s, r), t.effectTag |= 1, typeof s == "object" && s && typeof s.render == "function" && s.$$typeof === void 0) {
                if (t.tag = 1, t.memoizedState = null, t.updateQueue = null, ht(i)) {
                  var p = !0;
                  Bo(t);
                } else p = !1;
                t.memoizedState = s.state !== null && s.state !== void 0 ? s.state : null, Ja(t);
                var h = i.getDerivedStateFromProps;
                typeof h == "function" && Zo(t, i, h, e), s.updater = Jo, t.stateNode = s, s._reactInternalFiber = t, ts(t, i, e, r), t = ys(null, t, i, !0, p, r);
              } else t.tag = 0, vt(null, t, s, r), t = t.child;
              return t;
            case 16:
              e: {
                if (s = t.elementType, e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= 2), e = t.pendingProps, Wg(s), s._status !== 1) throw s._result;
                switch (s = s._result, t.type = s, p = t.tag = _b(s), e = Pt(s, e), p) {
                  case 0:
                    t = gs(null, t, s, e, r);
                    break e;
                  case 1:
                    t = Sd(null, t, s, e, r);
                    break e;
                  case 11:
                    t = Ed(null, t, s, e, r);
                    break e;
                  case 14:
                    t = _d(null, t, s, Pt(s.type, e), i, r);
                    break e;
                }
                throw Error(c(306, s, ""));
              }
              return t;
            case 0:
              return i = t.type, s = t.pendingProps, s = t.elementType === i ? s : Pt(i, s), gs(e, t, i, s, r);
            case 1:
              return i = t.type, s = t.pendingProps, s = t.elementType === i ? s : Pt(i, s), Sd(e, t, i, s, r);
            case 3:
              if (Td(t), i = t.updateQueue, e === null || i === null) throw Error(c(282));
              if (i = t.pendingProps, s = t.memoizedState, s = s === null ? null : s.element, es(e, t), Br(t, i, null, r), i = t.memoizedState.element, i === s) ms(), t = Xt(e, t, r);
              else {
                if ((s = t.stateNode.hydrate) && (gn = tr(t.stateNode.containerInfo.firstChild), Gt = t, s = An = !0), s) for (r = ns(t, null, i, r), t.child = r; r; ) r.effectTag = r.effectTag & -3 | 1024, r = r.sibling;
                else vt(e, t, i, r), ms();
                t = t.child;
              }
              return t;
            case 5:
              return ud(t), e === null && hs(t), i = t.type, s = t.pendingProps, p = e === null ? null : e.memoizedProps, h = s.children, za(i, s) ? h = null : p !== null && za(i, p) && (t.effectTag |= 16), Cd(e, t), t.mode & 4 && r !== 1 && s.hidden ? (t.expirationTime = t.childExpirationTime = 1, t = null) : (vt(e, t, h, r), t = t.child), t;
            case 6:
              return e === null && hs(t), null;
            case 13:
              return Od(e, t, r);
            case 4:
              return rs(t, t.stateNode.containerInfo), i = t.pendingProps, e === null ? t.child = cr(t, null, i, r) : vt(e, t, i, r), t.child;
            case 11:
              return i = t.type, s = t.pendingProps, s = t.elementType === i ? s : Pt(i, s), Ed(e, t, i, s, r);
            case 7:
              return vt(e, t, t.pendingProps, r), t.child;
            case 8:
              return vt(e, t, t.pendingProps.children, r), t.child;
            case 12:
              return vt(e, t, t.pendingProps.children, r), t.child;
            case 10:
              e: {
                i = t.type._context, s = t.pendingProps, h = t.memoizedProps, p = s.value;
                var _ = t.type._context;
                if (qe(Yo, _._currentValue), _._currentValue = p, h !== null) if (_ = h.value, p = Dn(_, p) ? 0 : (typeof i._calculateChangedBits == "function" ? i._calculateChangedBits(_, p) : 1073741823) | 0, p === 0) {
                  if (h.children === s.children && !ft.current) {
                    t = Xt(e, t, r);
                    break e;
                  }
                } else for (_ = t.child, _ !== null && (_.return = t); _ !== null; ) {
                  var F = _.dependencies;
                  if (F !== null) {
                    h = _.child;
                    for (var H = F.firstContext; H !== null; ) {
                      if (H.context === i && (H.observedBits & p) !== 0) {
                        _.tag === 1 && (H = fn(r, null), H.tag = 2, hn(_, H)), _.expirationTime < r && (_.expirationTime = r), H = _.alternate, H !== null && H.expirationTime < r && (H.expirationTime = r), nd(_.return, r), F.expirationTime < r && (F.expirationTime = r);
                        break;
                      }
                      H = H.next;
                    }
                  } else h = _.tag === 10 && _.type === t.type ? null : _.child;
                  if (h !== null) h.return = _;
                  else for (h = _; h !== null; ) {
                    if (h === t) {
                      h = null;
                      break;
                    }
                    if (_ = h.sibling, _ !== null) {
                      _.return = h.return, h = _;
                      break;
                    }
                    h = h.return;
                  }
                  _ = h;
                }
                vt(e, t, s.children, r), t = t.child;
              }
              return t;
            case 9:
              return s = t.type, p = t.pendingProps, i = p.children, lr(t, r), s = xt(s, p.unstable_observedBits), i = i(s), t.effectTag |= 1, vt(e, t, i, r), t.child;
            case 14:
              return s = t.type, p = Pt(s, t.pendingProps), p = Pt(s.type, p), _d(e, t, s, p, i, r);
            case 15:
              return xd(e, t, t.type, t.pendingProps, i, r);
            case 17:
              return i = t.type, s = t.pendingProps, s = t.elementType === i ? s : Pt(i, s), e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= 2), t.tag = 1, ht(i) ? (e = !0, Bo(t)) : e = !1, lr(t, r), sd(t, i, s), ts(t, i, s, r), ys(null, t, i, !0, e, r);
            case 19:
              return Pd(e, t, r);
          }
          throw Error(c(156, t.tag));
        }, Is = null, Rs = null;
        function wb(e) {
          if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u") return !1;
          var t = __REACT_DEVTOOLS_GLOBAL_HOOK__;
          if (t.isDisabled || !t.supportsFiber) return !0;
          try {
            var r = t.inject(e);
            Is = function(i) {
              try {
                t.onCommitFiberRoot(r, i, void 0, (i.current.effectTag & 64) == 64);
              } catch {
              }
            }, Rs = function(i) {
              try {
                t.onCommitFiberUnmount(r, i);
              } catch {
              }
            };
          } catch {
          }
          return !0;
        }
        function Eb(e, t, r, i) {
          this.tag = e, this.key = r, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = i, this.effectTag = 0, this.lastEffect = this.firstEffect = this.nextEffect = null, this.childExpirationTime = this.expirationTime = 0, this.alternate = null;
        }
        function Ft(e, t, r, i) {
          return new Eb(e, t, r, i);
        }
        function Ms(e) {
          return e = e.prototype, !(!e || !e.isReactComponent);
        }
        function _b(e) {
          if (typeof e == "function") return +!!Ms(e);
          if (e != null) {
            if (e = e.$$typeof, e === oa) return 11;
            if (e === aa) return 14;
          }
          return 2;
        }
        function $n(e, t) {
          var r = e.alternate;
          return r === null ? (r = Ft(e.tag, t, e.key, e.mode), r.elementType = e.elementType, r.type = e.type, r.stateNode = e.stateNode, r.alternate = e, e.alternate = r) : (r.pendingProps = t, r.effectTag = 0, r.nextEffect = null, r.firstEffect = null, r.lastEffect = null), r.childExpirationTime = e.childExpirationTime, r.expirationTime = e.expirationTime, r.child = e.child, r.memoizedProps = e.memoizedProps, r.memoizedState = e.memoizedState, r.updateQueue = e.updateQueue, t = e.dependencies, r.dependencies = t === null ? null : { expirationTime: t.expirationTime, firstContext: t.firstContext, responders: t.responders }, r.sibling = e.sibling, r.index = e.index, r.ref = e.ref, r;
        }
        function Ci(e, t, r, i, s, p) {
          var h = 2;
          if (i = e, typeof e == "function") Ms(e) && (h = 1);
          else if (typeof e == "string") h = 5;
          else e: switch (e) {
            case On:
              return vn(r.children, s, p, t);
            case Bg:
              h = 8, s |= 7;
              break;
            case Cc:
              h = 8, s |= 1;
              break;
            case So:
              return e = Ft(12, r, t, s | 8), e.elementType = So, e.type = So, e.expirationTime = p, e;
            case To:
              return e = Ft(13, r, t, s), e.type = To, e.elementType = To, e.expirationTime = p, e;
            case ia:
              return e = Ft(19, r, t, s), e.elementType = ia, e.expirationTime = p, e;
            default:
              if (typeof e == "object" && e) switch (e.$$typeof) {
                case Sc:
                  h = 10;
                  break e;
                case Tc:
                  h = 9;
                  break e;
                case oa:
                  h = 11;
                  break e;
                case aa:
                  h = 14;
                  break e;
                case Oc:
                  h = 16, i = null;
                  break e;
                case Nc:
                  h = 22;
                  break e;
              }
              throw Error(c(130, e == null ? e : typeof e, ""));
          }
          return t = Ft(h, r, t, s), t.elementType = e, t.type = i, t.expirationTime = p, t;
        }
        function vn(e, t, r, i) {
          return e = Ft(7, e, i, t), e.expirationTime = r, e;
        }
        function As(e, t, r) {
          return e = Ft(6, e, null, t), e.expirationTime = r, e;
        }
        function zs(e, t, r) {
          return t = Ft(4, e.children === null ? [] : e.children, e.key, t), t.expirationTime = r, t.stateNode = { containerInfo: e.containerInfo, pendingChildren: null, implementation: e.implementation }, t;
        }
        function xb(e, t, r) {
          this.tag = t, this.current = null, this.containerInfo = e, this.pingCache = this.pendingChildren = null, this.finishedExpirationTime = 0, this.finishedWork = null, this.timeoutHandle = -1, this.pendingContext = this.context = null, this.hydrate = r, this.callbackNode = null, this.callbackPriority = 90, this.lastExpiredTime = this.lastPingedTime = this.nextKnownPendingLevel = this.lastSuspendedTime = this.firstSuspendedTime = this.firstPendingTime = 0;
        }
        function ep(e, t) {
          var r = e.firstSuspendedTime;
          return e = e.lastSuspendedTime, r !== 0 && r >= t && e <= t;
        }
        function Hn(e, t) {
          var r = e.firstSuspendedTime, i = e.lastSuspendedTime;
          r < t && (e.firstSuspendedTime = t), (i > t || r === 0) && (e.lastSuspendedTime = t), t <= e.lastPingedTime && (e.lastPingedTime = 0), t <= e.lastExpiredTime && (e.lastExpiredTime = 0);
        }
        function tp(e, t) {
          t > e.firstPendingTime && (e.firstPendingTime = t);
          var r = e.firstSuspendedTime;
          r !== 0 && (t >= r ? e.firstSuspendedTime = e.lastSuspendedTime = e.nextKnownPendingLevel = 0 : t >= e.lastSuspendedTime && (e.lastSuspendedTime = t + 1), t > e.nextKnownPendingLevel && (e.nextKnownPendingLevel = t));
        }
        function js(e, t) {
          var r = e.lastExpiredTime;
          (r === 0 || r > t) && (e.lastExpiredTime = t);
        }
        function Si(e, t, r, i) {
          var s = t.current, p = Vt(), h = Wr.suspense;
          p = Ln(p, s, h);
          e: if (r) {
            r = r._reactInternalFiber;
            t: {
              if (Nn(r) !== r || r.tag !== 1) throw Error(c(170));
              var _ = r;
              do {
                switch (_.tag) {
                  case 3:
                    _ = _.stateNode.context;
                    break t;
                  case 1:
                    if (ht(_.type)) {
                      _ = _.stateNode.__reactInternalMemoizedMergedChildContext;
                      break t;
                    }
                }
                _ = _.return;
              } while (_ !== null);
              throw Error(c(171));
            }
            if (r.tag === 1) {
              var F = r.type;
              if (ht(F)) {
                r = $u(r, F, _);
                break e;
              }
            }
            r = _;
          } else r = un;
          return t.context === null ? t.context = r : t.pendingContext = r, t = fn(p, h), t.payload = { element: e }, i = i === void 0 ? null : i, i !== null && (t.callback = i), hn(s, t), bn(s, p), p;
        }
        function Ls(e) {
          if (e = e.current, !e.child) return null;
          switch (e.child.tag) {
            case 5:
              return e.child.stateNode;
            default:
              return e.child.stateNode;
          }
        }
        function np(e, t) {
          e = e.memoizedState, e !== null && e.dehydrated !== null && e.retryTime < t && (e.retryTime = t);
        }
        function Us(e, t) {
          np(e, t), (e = e.alternate) && np(e, t);
        }
        function Vs(e, t, r) {
          r = r != null && r.hydrate === !0;
          var i = new xb(e, t, r), s = Ft(3, null, null, t === 2 ? 7 : t === 1 ? 3 : 0);
          i.current = s, s.stateNode = i, Ja(s), e[Rr] = i.current, r && t !== 0 && Xg(e, e.nodeType === 9 ? e : e.ownerDocument), this._internalRoot = i;
        }
        Vs.prototype.render = function(e) {
          Si(e, this._internalRoot, null, null);
        }, Vs.prototype.unmount = function() {
          var e = this._internalRoot, t = e.containerInfo;
          Si(null, e, null, function() {
            t[Rr] = null;
          });
        };
        function to(e) {
          return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11 && (e.nodeType !== 8 || e.nodeValue !== " react-mount-point-unstable "));
        }
        function Cb(e, t) {
          if (t || (t = (t = e ? e.nodeType === 9 ? e.documentElement : e.firstChild : null, !(!t || t.nodeType !== 1 || !t.hasAttribute("data-reactroot")))), !t) for (var r; r = e.lastChild; ) e.removeChild(r);
          return new Vs(e, 0, t ? { hydrate: !0 } : void 0);
        }
        function Ti(e, t, r, i, s) {
          var p = r._reactRootContainer;
          if (p) {
            var h = p._internalRoot;
            if (typeof s == "function") {
              var _ = s;
              s = function() {
                var H = Ls(h);
                _.call(H);
              };
            }
            Si(t, h, e, s);
          } else {
            if (p = r._reactRootContainer = Cb(r, i), h = p._internalRoot, typeof s == "function") {
              var F = s;
              s = function() {
                var H = Ls(h);
                F.call(H);
              };
            }
            Kd(function() {
              Si(t, h, e, s);
            });
          }
          return Ls(h);
        }
        function Sb(e, t, r) {
          var i = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
          return { $$typeof: Xn, key: i == null ? null : "" + i, children: e, containerInfo: t, implementation: r };
        }
        tu = function(e) {
          if (e.tag === 13) {
            var t = Qo(Vt(), 150, 100);
            bn(e, t), Us(e, t);
          }
        }, ka = function(e) {
          e.tag === 13 && (bn(e, 3), Us(e, 3));
        }, nu = function(e) {
          if (e.tag === 13) {
            var t = Vt();
            t = Ln(t, e, null), bn(e, t), Us(e, t);
          }
        }, D = function(e, t, r) {
          switch (t) {
            case "input":
              if (ca(e, r), t = r.name, r.type === "radio" && t != null) {
                for (r = e; r.parentNode; ) r = r.parentNode;
                for (r = r.querySelectorAll("input[name=" + JSON.stringify("" + t) + '][type="radio"]'), t = 0; t < r.length; t++) {
                  var i = r[t];
                  if (i !== e && i.form === e.form) {
                    var s = Ua(i);
                    if (!s) throw Error(c(90));
                    Ic(i), ca(i, s);
                  }
                }
              }
              break;
            case "textarea":
              jc(e, r);
              break;
            case "select":
              t = r.value, t != null && Zn(e, !!r.multiple, t, !1);
          }
        }, ee = qd, ye = function(e, t, r, i, s) {
          var p = Ne;
          Ne |= 4;
          try {
            return dn(98, e.bind(null, t, r, i, s));
          } finally {
            Ne = p, Ne === tt && zt();
          }
        }, Z = function() {
          (Ne & (1 | Dt | Ut)) === tt && (pb(), fr());
        }, De = function(e, t) {
          var r = Ne;
          Ne |= 2;
          try {
            return e(t);
          } finally {
            Ne = r, Ne === tt && zt();
          }
        };
        function rp(e, t) {
          var r = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
          if (!to(t)) throw Error(c(200));
          return Sb(e, t, null, r);
        }
        var Tb = { Events: [Ar, Pn, Ua, V, J, nr, function(e) {
          ya(e, uy);
        }, ce, q, Ao, Do, fr, { current: !1 }] };
        (function(e) {
          var t = e.findFiberByHostInstance;
          return wb(a({}, e, { overrideHookState: null, overrideProps: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: Ye.ReactCurrentDispatcher, findHostInstanceByFiber: function(r) {
            return r = Gc(r), r === null ? null : r.stateNode;
          }, findFiberByHostInstance: function(r) {
            return t ? t(r) : null;
          }, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null }));
        })({ findFiberByHostInstance: Mr, bundleType: 0, version: "16.14.0", rendererPackageName: "react-dom" }), n.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Tb, n.createPortal = rp, n.findDOMNode = function(e) {
          if (e == null) return null;
          if (e.nodeType === 1) return e;
          var t = e._reactInternalFiber;
          if (t === void 0) throw typeof e.render == "function" ? Error(c(188)) : Error(c(268, Object.keys(e)));
          return e = Gc(t), e = e === null ? null : e.stateNode, e;
        }, n.flushSync = function(e, t) {
          if ((Ne & (Dt | Ut)) !== tt) throw Error(c(187));
          var r = Ne;
          Ne |= 1;
          try {
            return dn(99, e.bind(null, t));
          } finally {
            Ne = r, zt();
          }
        }, n.hydrate = function(e, t, r) {
          if (!to(t)) throw Error(c(200));
          return Ti(null, e, t, !0, r);
        }, n.render = function(e, t, r) {
          if (!to(t)) throw Error(c(200));
          return Ti(null, e, t, !1, r);
        }, n.unmountComponentAtNode = function(e) {
          if (!to(e)) throw Error(c(40));
          return e._reactRootContainer ? (Kd(function() {
            Ti(null, null, e, !1, function() {
              e._reactRootContainer = null, e[Rr] = null;
            });
          }), !0) : !1;
        }, n.unstable_batchedUpdates = qd, n.unstable_createPortal = function(e, t) {
          return rp(e, t, 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null);
        }, n.unstable_renderSubtreeIntoContainer = function(e, t, r, i) {
          if (!to(r)) throw Error(c(200));
          if (e == null || e._reactInternalFiber === void 0) throw Error(c(38));
          return Ti(e, t, r, !1, i);
        }, n.version = "16.14.0";
      })), It = G(((n, o) => {
        function a() {
          if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function")) try {
            __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(a);
          } catch (l) {
            console.error(l);
          }
        }
        a(), o.exports = Et();
      })), v = Ce(pt()), Bt = Ce(It());
      function at(n) {
        return "Minified Redux error #" + n + "; visit https://redux.js.org/Errors?code=" + n + " for the full message or use the non-minified dev environment for full errors. ";
      }
      var oo = (function() {
        return typeof Symbol == "function" && Symbol.observable || "@@observable";
      })(), mr = function() {
        return Math.random().toString(36).substring(7).split("").join(".");
      }, st = { INIT: "@@redux/INIT" + mr(), REPLACE: "@@redux/REPLACE" + mr() };
      function io(n) {
        if (typeof n != "object" || !n) return !1;
        for (var o = n; Object.getPrototypeOf(o) !== null; ) o = Object.getPrototypeOf(o);
        return Object.getPrototypeOf(n) === o;
      }
      function gr(n, o, a) {
        var l;
        if (typeof o == "function" && typeof a == "function" || typeof a == "function" && typeof arguments[3] == "function") throw Error(at(0));
        if (typeof o == "function" && a === void 0 && (a = o, o = void 0), a !== void 0) {
          if (typeof a != "function") throw Error(at(1));
          return a(gr)(n, o);
        }
        if (typeof n != "function") throw Error(at(2));
        var c = n, d = o, u = [], y = u, b = !1;
        function g() {
          y === u && (y = u.slice());
        }
        function E() {
          if (b) throw Error(at(3));
          return d;
        }
        function x(R) {
          if (typeof R != "function") throw Error(at(4));
          if (b) throw Error(at(5));
          var Y = !0;
          return g(), y.push(R), function() {
            if (Y) {
              if (b) throw Error(at(6));
              Y = !1, g();
              var se = y.indexOf(R);
              y.splice(se, 1), u = null;
            }
          };
        }
        function N(R) {
          if (!io(R)) throw Error(at(7));
          if (R.type === void 0) throw Error(at(8));
          if (b) throw Error(at(9));
          try {
            b = !0, d = c(d, R);
          } finally {
            b = !1;
          }
          for (var Y = u = y, se = 0; se < Y.length; se++) {
            var ie = Y[se];
            ie();
          }
          return R;
        }
        function S(R) {
          if (typeof R != "function") throw Error(at(10));
          c = R, N({ type: st.REPLACE });
        }
        function O() {
          var R, Y = x;
          return R = { subscribe: function(se) {
            if (typeof se != "object" || !se) throw Error(at(11));
            function ie() {
              se.next && se.next(E());
            }
            return ie(), { unsubscribe: Y(ie) };
          } }, R[oo] = function() {
            return this;
          }, R;
        }
        return N({ type: st.INIT }), l = { dispatch: N, subscribe: x, getState: E, replaceReducer: S }, l[oo] = O, l;
      }
      var ao = G(((n, o) => {
        o.exports = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
      })), so = G(((n, o) => {
        var a = ao();
        function l() {
        }
        function c() {
        }
        c.resetWarningCache = l, o.exports = function() {
          function d(b, g, E, x, N, S) {
            if (S !== a) {
              var O = Error("Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types");
              throw O.name = "Invariant Violation", O;
            }
          }
          d.isRequired = d;
          function u() {
            return d;
          }
          var y = { array: d, bigint: d, bool: d, func: d, number: d, object: d, string: d, symbol: d, any: d, arrayOf: u, element: d, elementType: d, instanceOf: u, node: d, objectOf: u, oneOf: u, oneOfType: u, shape: u, exact: u, checkPropTypes: c, resetWarningCache: l };
          return y.PropTypes = y, y;
        };
      })), lo = G(((n, o) => {
        o.exports = so()();
      })), $s = v.createContext(null);
      function yp(n) {
        n();
      }
      var Hs = yp, bp = function(n) {
        return Hs = n;
      }, vp = function() {
        return Hs;
      };
      function kp() {
        var n = vp(), o = null, a = null;
        return { clear: function() {
          o = null, a = null;
        }, notify: function() {
          n(function() {
            for (var l = o; l; ) l.callback(), l = l.next;
          });
        }, get: function() {
          for (var l = [], c = o; c; ) l.push(c), c = c.next;
          return l;
        }, subscribe: function(l) {
          var c = !0, d = a = { callback: l, next: null, prev: a };
          return d.prev ? d.prev.next = d : o = d, function() {
            !c || o === null || (c = !1, d.next ? d.next.prev = d.prev : a = d.prev, d.prev ? d.prev.next = d.next : o = d.next);
          };
        } };
      }
      var Bs = { notify: function() {
      }, get: function() {
        return [];
      } };
      function Ws(n, o) {
        var a, l = Bs;
        function c(x) {
          return b(), l.subscribe(x);
        }
        function d() {
          l.notify();
        }
        function u() {
          E.onStateChange && E.onStateChange();
        }
        function y() {
          return !!a;
        }
        function b() {
          a || (a = o ? o.addNestedSub(u) : n.subscribe(u), l = kp());
        }
        function g() {
          a && (a(), a = void 0, l.clear(), l = Bs);
        }
        var E = { addNestedSub: c, notifyNestedSubs: d, handleChangeWrapper: u, isSubscribed: y, trySubscribe: b, tryUnsubscribe: g, getListeners: function() {
          return l;
        } };
        return E;
      }
      var qs = typeof window < "u" && window.document !== void 0 && window.document.createElement !== void 0 ? v.useLayoutEffect : v.useEffect;
      function wp(n) {
        var o = n.store, a = n.context, l = n.children, c = (0, v.useMemo)(function() {
          return { store: o, subscription: Ws(o) };
        }, [o]), d = (0, v.useMemo)(function() {
          return o.getState();
        }, [o]);
        qs(function() {
          var y = c.subscription;
          return y.onStateChange = y.notifyNestedSubs, y.trySubscribe(), d !== o.getState() && y.notifyNestedSubs(), function() {
            y.tryUnsubscribe(), y.onStateChange = null;
          };
        }, [c, d]);
        var u = a || $s;
        return v.createElement(u.Provider, { value: c }, l);
      }
      function Jt() {
        return Jt = Object.assign ? Object.assign.bind() : function(n) {
          for (var o = 1; o < arguments.length; o++) {
            var a = arguments[o];
            for (var l in a) ({}).hasOwnProperty.call(a, l) && (n[l] = a[l]);
          }
          return n;
        }, Jt.apply(null, arguments);
      }
      function co(n, o) {
        if (n == null) return {};
        var a = {};
        for (var l in n) if ({}.hasOwnProperty.call(n, l)) {
          if (o.indexOf(l) !== -1) continue;
          a[l] = n[l];
        }
        return a;
      }
      var Ep = G(((n) => {
        var o = typeof Symbol == "function" && Symbol.for, a = o ? Symbol.for("react.element") : 60103, l = o ? Symbol.for("react.portal") : 60106, c = o ? Symbol.for("react.fragment") : 60107, d = o ? Symbol.for("react.strict_mode") : 60108, u = o ? Symbol.for("react.profiler") : 60114, y = o ? Symbol.for("react.provider") : 60109, b = o ? Symbol.for("react.context") : 60110, g = o ? Symbol.for("react.async_mode") : 60111, E = o ? Symbol.for("react.concurrent_mode") : 60111, x = o ? Symbol.for("react.forward_ref") : 60112, N = o ? Symbol.for("react.suspense") : 60113, S = o ? Symbol.for("react.suspense_list") : 60120, O = o ? Symbol.for("react.memo") : 60115, R = o ? Symbol.for("react.lazy") : 60116, Y = o ? Symbol.for("react.block") : 60121, se = o ? Symbol.for("react.fundamental") : 60117, ie = o ? Symbol.for("react.responder") : 60118, ae = o ? Symbol.for("react.scope") : 60119;
        function pe(J) {
          if (typeof J == "object" && J) {
            var we = J.$$typeof;
            switch (we) {
              case a:
                switch (J = J.type, J) {
                  case g:
                  case E:
                  case c:
                  case u:
                  case d:
                  case N:
                    return J;
                  default:
                    switch (J && (J = J.$$typeof), J) {
                      case b:
                      case x:
                      case R:
                      case O:
                      case y:
                        return J;
                      default:
                        return we;
                    }
                }
              case l:
                return we;
            }
          }
        }
        function be(J) {
          return pe(J) === E;
        }
        n.AsyncMode = g, n.ConcurrentMode = E, n.ContextConsumer = b, n.ContextProvider = y, n.Element = a, n.ForwardRef = x, n.Fragment = c, n.Lazy = R, n.Memo = O, n.Portal = l, n.Profiler = u, n.StrictMode = d, n.Suspense = N, n.isAsyncMode = function(J) {
          return be(J) || pe(J) === g;
        }, n.isConcurrentMode = be, n.isContextConsumer = function(J) {
          return pe(J) === b;
        }, n.isContextProvider = function(J) {
          return pe(J) === y;
        }, n.isElement = function(J) {
          return typeof J == "object" && !!J && J.$$typeof === a;
        }, n.isForwardRef = function(J) {
          return pe(J) === x;
        }, n.isFragment = function(J) {
          return pe(J) === c;
        }, n.isLazy = function(J) {
          return pe(J) === R;
        }, n.isMemo = function(J) {
          return pe(J) === O;
        }, n.isPortal = function(J) {
          return pe(J) === l;
        }, n.isProfiler = function(J) {
          return pe(J) === u;
        }, n.isStrictMode = function(J) {
          return pe(J) === d;
        }, n.isSuspense = function(J) {
          return pe(J) === N;
        }, n.isValidElementType = function(J) {
          return typeof J == "string" || typeof J == "function" || J === c || J === E || J === u || J === d || J === N || J === S || typeof J == "object" && !!J && (J.$$typeof === R || J.$$typeof === O || J.$$typeof === y || J.$$typeof === b || J.$$typeof === x || J.$$typeof === se || J.$$typeof === ie || J.$$typeof === ae || J.$$typeof === Y);
        }, n.typeOf = pe;
      })), _p = G(((n, o) => {
        o.exports = Ep();
      })), xp = G(((n, o) => {
        var a = _p(), l = { childContextTypes: !0, contextType: !0, contextTypes: !0, defaultProps: !0, displayName: !0, getDefaultProps: !0, getDerivedStateFromError: !0, getDerivedStateFromProps: !0, mixins: !0, propTypes: !0, type: !0 }, c = { name: !0, length: !0, prototype: !0, caller: !0, callee: !0, arguments: !0, arity: !0 }, d = { $$typeof: !0, render: !0, defaultProps: !0, displayName: !0, propTypes: !0 }, u = { $$typeof: !0, compare: !0, defaultProps: !0, displayName: !0, propTypes: !0, type: !0 }, y = {};
        y[a.ForwardRef] = d, y[a.Memo] = u;
        function b(Y) {
          return a.isMemo(Y) ? u : y[Y.$$typeof] || l;
        }
        var g = Object.defineProperty, E = Object.getOwnPropertyNames, x = Object.getOwnPropertySymbols, N = Object.getOwnPropertyDescriptor, S = Object.getPrototypeOf, O = Object.prototype;
        function R(Y, se, ie) {
          if (typeof se != "string") {
            if (O) {
              var ae = S(se);
              ae && ae !== O && R(Y, ae, ie);
            }
            var pe = E(se);
            x && (pe = pe.concat(x(se)));
            for (var be = b(Y), J = b(se), we = 0; we < pe.length; ++we) {
              var z = pe[we];
              if (!c[z] && !(ie && ie[z]) && !(J && J[z]) && !(be && be[z])) {
                var V = N(se, z);
                try {
                  g(Y, z, V);
                } catch {
                }
              }
            }
          }
          return Y;
        }
        o.exports = R;
      })), Cp = G(((n) => {
        var o = 60103, a = 60106, l = 60107, c = 60108, d = 60114, u = 60109, y = 60110, b = 60112, g = 60113, E = 60120, x = 60115, N = 60116;
        if (typeof Symbol == "function" && Symbol.for) {
          var S = Symbol.for;
          o = S("react.element"), a = S("react.portal"), l = S("react.fragment"), c = S("react.strict_mode"), d = S("react.profiler"), u = S("react.provider"), y = S("react.context"), b = S("react.forward_ref"), g = S("react.suspense"), E = S("react.suspense_list"), x = S("react.memo"), N = S("react.lazy"), S("react.block"), S("react.server.block"), S("react.fundamental"), S("react.debug_trace_mode"), S("react.legacy_hidden");
        }
        function O(R) {
          if (typeof R == "object" && R) {
            var Y = R.$$typeof;
            switch (Y) {
              case o:
                switch (R = R.type, R) {
                  case l:
                  case d:
                  case c:
                  case g:
                  case E:
                    return R;
                  default:
                    switch (R && (R = R.$$typeof), R) {
                      case y:
                      case b:
                      case N:
                      case x:
                      case u:
                        return R;
                      default:
                        return Y;
                    }
                }
              case a:
                return Y;
            }
          }
        }
        n.isContextConsumer = function(R) {
          return O(R) === y;
        };
      })), Sp = G(((n, o) => {
        o.exports = Cp();
      })), Ks = Ce(xp()), Tp = Sp(), Op = ["getDisplayName", "methodName", "renderCountProp", "shouldHandleStateChanges", "storeKey", "withRef", "forwardRef", "context"], Np = ["reactReduxForwardedRef"], Pp = [], Dp = [null, null];
      function Ip(n, o) {
        var a = n[1];
        return [o.payload, a + 1];
      }
      function Qs(n, o, a) {
        qs(function() {
          return n.apply(void 0, o);
        }, a);
      }
      function Rp(n, o, a, l, c, d, u) {
        n.current = l, o.current = c, a.current = !1, d.current && (d.current = null, u());
      }
      function Mp(n, o, a, l, c, d, u, y, b, g) {
        if (n) {
          var E = !1, x = null, N = function() {
            if (!E) {
              var S = o.getState(), O, R;
              try {
                O = l(S, c.current);
              } catch (Y) {
                R = Y, x = Y;
              }
              R || (x = null), O === d.current ? u.current || b() : (d.current = O, y.current = O, u.current = !0, g({ type: "STORE_UPDATED", payload: { error: R } }));
            }
          };
          return a.onStateChange = N, a.trySubscribe(), N(), function() {
            if (E = !0, a.tryUnsubscribe(), a.onStateChange = null, x) throw x;
          };
        }
      }
      var Ap = function() {
        return [null, 0];
      };
      function zp(n, o) {
        o === void 0 && (o = {});
        var a = o, l = a.getDisplayName, c = l === void 0 ? function(ae) {
          return "ConnectAdvanced(" + ae + ")";
        } : l, d = a.methodName, u = d === void 0 ? "connectAdvanced" : d, y = a.renderCountProp, b = y === void 0 ? void 0 : y, g = a.shouldHandleStateChanges, E = g === void 0 ? !0 : g, x = a.storeKey, N = x === void 0 ? "store" : x;
        a.withRef;
        var S = a.forwardRef, O = S === void 0 ? !1 : S, R = a.context, Y = R === void 0 ? $s : R, se = co(a, Op), ie = Y;
        return function(ae) {
          var pe = ae.displayName || ae.name || "Component", be = c(pe), J = Jt({}, se, { getDisplayName: c, methodName: u, renderCountProp: b, shouldHandleStateChanges: E, storeKey: N, displayName: be, wrappedComponentName: pe, WrappedComponent: ae }), we = se.pure;
          function z(M) {
            return n(M.dispatch, J);
          }
          var V = we ? v.useMemo : function(M) {
            return M();
          };
          function te(M) {
            var X = (0, v.useMemo)(function() {
              var Ye = M.reactReduxForwardedRef, nn = co(M, Np);
              return [M.context, Ye, nn];
            }, [M]), ce = X[0], q = X[1], ee = X[2], ye = (0, v.useMemo)(function() {
              return ce && ce.Consumer && (0, Tp.isContextConsumer)(v.createElement(ce.Consumer, null)) ? ce : ie;
            }, [ce, ie]), Z = (0, v.useContext)(ye), De = !!M.store && !!M.store.getState && !!M.store.dispatch;
            Z && Z.store;
            var W = De ? M.store : Z.store, re = (0, v.useMemo)(function() {
              return z(W);
            }, [W]), ne = (0, v.useMemo)(function() {
              if (!E) return Dp;
              var Ye = Ws(W, De ? null : Z.subscription);
              return [Ye, Ye.notifyNestedSubs.bind(Ye)];
            }, [W, De, Z]), P = ne[0], B = ne[1], C = (0, v.useMemo)(function() {
              return De ? Z : Jt({}, Z, { subscription: P });
            }, [De, Z, P]), U = (0, v.useReducer)(Ip, Pp, Ap), oe = U[0][0], me = U[1];
            if (oe && oe.error) throw oe.error;
            var Ee = (0, v.useRef)(), Ie = (0, v.useRef)(ee), Oe = (0, v.useRef)(), Te = (0, v.useRef)(!1), Fe = V(function() {
              return Oe.current && ee === Ie.current ? Oe.current : re(W.getState(), ee);
            }, [W, oe, ee]);
            Qs(Rp, [Ie, Ee, Te, ee, Fe, Oe, B]), Qs(Mp, [E, W, P, re, Ie, Ee, Te, Oe, B, me], [W, P, re]);
            var Qe = (0, v.useMemo)(function() {
              return v.createElement(ae, Jt({}, Fe, { ref: q }));
            }, [q, ae, Fe]);
            return (0, v.useMemo)(function() {
              return E ? v.createElement(ye.Provider, { value: C }, Qe) : Qe;
            }, [ye, Qe, C]);
          }
          var D = we ? v.memo(te) : te;
          if (D.WrappedComponent = ae, D.displayName = te.displayName = be, O) {
            var w = v.forwardRef(function(M, X) {
              return v.createElement(D, Jt({}, M, { reactReduxForwardedRef: X }));
            });
            return w.displayName = be, w.WrappedComponent = ae, (0, Ks.default)(w, ae);
          }
          return (0, Ks.default)(D, ae);
        };
      }
      function Ys(n, o) {
        return n === o ? n !== 0 || o !== 0 || 1 / n == 1 / o : n !== n && o !== o;
      }
      function Pi(n, o) {
        if (Ys(n, o)) return !0;
        if (typeof n != "object" || !n || typeof o != "object" || !o) return !1;
        var a = Object.keys(n), l = Object.keys(o);
        if (a.length !== l.length) return !1;
        for (var c = 0; c < a.length; c++) if (!Object.prototype.hasOwnProperty.call(o, a[c]) || !Ys(n[a[c]], o[a[c]])) return !1;
        return !0;
      }
      function jp(n, o) {
        var a = {}, l = function(d) {
          var u = n[d];
          typeof u == "function" && (a[d] = function() {
            return o(u.apply(void 0, arguments));
          });
        };
        for (var c in n) l(c);
        return a;
      }
      function Di(n) {
        return function(o, a) {
          var l = n(o, a);
          function c() {
            return l;
          }
          return c.dependsOnOwnProps = !1, c;
        };
      }
      function Gs(n) {
        return n.dependsOnOwnProps !== null && n.dependsOnOwnProps !== void 0 ? !!n.dependsOnOwnProps : n.length !== 1;
      }
      function Xs(n, o) {
        return function(a, l) {
          l.displayName;
          var c = function(d, u) {
            return c.dependsOnOwnProps ? c.mapToProps(d, u) : c.mapToProps(d);
          };
          return c.dependsOnOwnProps = !0, c.mapToProps = function(d, u) {
            c.mapToProps = n, c.dependsOnOwnProps = Gs(n);
            var y = c(d, u);
            return typeof y == "function" && (c.mapToProps = y, c.dependsOnOwnProps = Gs(y), y = c(d, u)), y;
          }, c;
        };
      }
      function Lp(n) {
        return typeof n == "function" ? Xs(n) : void 0;
      }
      function Up(n) {
        return n ? void 0 : Di(function(o) {
          return { dispatch: o };
        });
      }
      function Vp(n) {
        return n && typeof n == "object" ? Di(function(o) {
          return jp(n, o);
        }) : void 0;
      }
      var Fp = [Lp, Up, Vp];
      function $p(n) {
        return typeof n == "function" ? Xs(n) : void 0;
      }
      function Hp(n) {
        return n ? void 0 : Di(function() {
          return {};
        });
      }
      var Bp = [$p, Hp];
      function Wp(n, o, a) {
        return Jt({}, a, n, o);
      }
      function qp(n) {
        return function(o, a) {
          a.displayName;
          var l = a.pure, c = a.areMergedPropsEqual, d = !1, u;
          return function(y, b, g) {
            var E = n(y, b, g);
            return d ? (!l || !c(E, u)) && (u = E) : (d = !0, u = E), u;
          };
        };
      }
      function Kp(n) {
        return typeof n == "function" ? qp(n) : void 0;
      }
      function Qp(n) {
        return n ? void 0 : function() {
          return Wp;
        };
      }
      var Yp = [Kp, Qp], Gp = ["initMapStateToProps", "initMapDispatchToProps", "initMergeProps"];
      function Xp(n, o, a, l) {
        return function(c, d) {
          return a(n(c, d), o(l, d), d);
        };
      }
      function Zp(n, o, a, l, c) {
        var d = c.areStatesEqual, u = c.areOwnPropsEqual, y = c.areStatePropsEqual, b = !1, g, E, x, N, S;
        function O(ae, pe) {
          return g = ae, E = pe, x = n(g, E), N = o(l, E), S = a(x, N, E), b = !0, S;
        }
        function R() {
          return x = n(g, E), o.dependsOnOwnProps && (N = o(l, E)), S = a(x, N, E), S;
        }
        function Y() {
          return n.dependsOnOwnProps && (x = n(g, E)), o.dependsOnOwnProps && (N = o(l, E)), S = a(x, N, E), S;
        }
        function se() {
          var ae = n(g, E), pe = !y(ae, x);
          return x = ae, pe && (S = a(x, N, E)), S;
        }
        function ie(ae, pe) {
          var be = !u(pe, E), J = !d(ae, g, pe, E);
          return g = ae, E = pe, be && J ? R() : be ? Y() : J ? se() : S;
        }
        return function(ae, pe) {
          return b ? ie(ae, pe) : O(ae, pe);
        };
      }
      function Jp(n, o) {
        var a = o.initMapStateToProps, l = o.initMapDispatchToProps, c = o.initMergeProps, d = co(o, Gp), u = a(n, d), y = l(n, d), b = c(n, d);
        return (d.pure ? Zp : Xp)(u, y, b, n, d);
      }
      var ef = ["pure", "areStatesEqual", "areOwnPropsEqual", "areStatePropsEqual", "areMergedPropsEqual"];
      function Ii(n, o, a) {
        for (var l = o.length - 1; l >= 0; l--) {
          var c = o[l](n);
          if (c) return c;
        }
        return function(d, u) {
          throw Error("Invalid value of type " + typeof n + " for " + a + " argument when connecting component " + u.wrappedComponentName + ".");
        };
      }
      function tf(n, o) {
        return n === o;
      }
      function nf(n) {
        var o = {}, a = o.connectHOC, l = a === void 0 ? zp : a, c = o.mapStateToPropsFactories, d = c === void 0 ? Bp : c, u = o.mapDispatchToPropsFactories, y = u === void 0 ? Fp : u, b = o.mergePropsFactories, g = b === void 0 ? Yp : b, E = o.selectorFactory, x = E === void 0 ? Jp : E;
        return function(N, S, O, R) {
          R === void 0 && (R = {});
          var Y = R, se = Y.pure, ie = se === void 0 ? !0 : se, ae = Y.areStatesEqual, pe = ae === void 0 ? tf : ae, be = Y.areOwnPropsEqual, J = be === void 0 ? Pi : be, we = Y.areStatePropsEqual, z = we === void 0 ? Pi : we, V = Y.areMergedPropsEqual, te = V === void 0 ? Pi : V, D = co(Y, ef), w = Ii(N, d, "mapStateToProps"), M = Ii(S, y, "mapDispatchToProps"), X = Ii(O, g, "mergeProps");
          return l(x, Jt({ methodName: "connect", getDisplayName: function(ce) {
            return "Connect(" + ce + ")";
          }, shouldHandleStateChanges: !!N, initMapStateToProps: w, initMapDispatchToProps: M, initMergeProps: X, pure: ie, areStatesEqual: pe, areOwnPropsEqual: J, areStatePropsEqual: z, areMergedPropsEqual: te }, D));
        };
      }
      var Ke = nf();
      bp(Bt.unstable_batchedUpdates);
      var Zs = "SET_MODEL_CURRENT_ROOT_NAME", Js = "SET_MODEL_CURRENT_NODE", el = "SET_MODEL_ACTIVE_TAB", tl = "TOGGLE_MODEL_SHOW_MARKERS", nl = "TOGGLE_MODEL_SHOW_COMPACT_TEXT", rl = "UPDATE_MODEL_STATE";
      function rf(n) {
        return { type: Zs, currentRootName: n };
      }
      function of(n) {
        return { type: Js, currentNode: n };
      }
      function ol(n) {
        return { type: el, tabName: n };
      }
      function af() {
        return { type: tl };
      }
      function sf() {
        return { type: nl };
      }
      function il() {
        return { type: rl };
      }
      var al = "TOGGLE_IS_COLLAPSED", sl = "SET_HEIGHT", ll = "SET_SIDE_PANE_WIDTH", _n = "SET_EDITORS", xn = "SET_CURRENT_EDITOR_NAME", cl = "UPDATE_CURRENT_EDITOR_IS_READ_ONLY", Wn = "SET_ACTIVE_INSPECTOR_TAB";
      function ul() {
        return { type: al };
      }
      function lf(n) {
        return { type: sl, newHeight: n };
      }
      function cf(n) {
        return { type: ll, newWidth: n };
      }
      function dl(n) {
        return { type: _n, editors: n };
      }
      function pl(n) {
        return { type: xn, editorName: n };
      }
      function fl(n) {
        return { type: Wn, tabName: n };
      }
      function uf() {
        return { type: cl };
      }
      function hl(n) {
        return n && n.is("element");
      }
      function ml(n) {
        return n && n.is("rootElement");
      }
      function gl(n) {
        return n.getPath ? n.getPath() : n.path;
      }
      function qn(n) {
        return { path: gl(n), stickiness: n.stickiness, index: n.index, isAtEnd: n.isAtEnd, isAtStart: n.isAtStart, offset: n.offset, textNode: n.textNode && n.textNode.data };
      }
      var Ge = class {
        static group(...n) {
          console.group(...n);
        }
        static groupEnd(...n) {
          console.groupEnd(...n);
        }
        static log(...n) {
          console.log(...n);
        }
        static warn(...n) {
          console.warn(...n);
        }
      }, df = 0;
      function pf(n) {
        let o = { editors: {}, options: {} };
        if (typeof n[0] == "string") Ge.warn(`[CKEditorInspector] The CKEditorInspector.attach( '${n[0]}', editor ) syntax has been deprecated and will be removed in the near future. To pass a name of an editor instance, use CKEditorInspector.attach( { '${n[0]}': editor } ) instead. Learn more in https://github.com/ckeditor/ckeditor5-inspector/blob/master/README.md.`), o.editors[n[0]] = n[1];
        else {
          if (hf(n[0])) o.editors[ff()] = n[0];
          else for (let a in n[0]) o.editors[a] = n[0][a];
          o.options = n[1] || o.options;
        }
        return o;
      }
      function ff() {
        return `editor-${++df}`;
      }
      function yl(n) {
        return [...n][0][0] || "";
      }
      function hf(n) {
        return !!n.model && !!n.editing;
      }
      function bl(n, o) {
        let a = Math.min(n.length, o.length);
        for (let l = 0; l < a; l++) if (n[l] != o[l]) return l;
        return n.length == o.length ? "same" : n.length < o.length ? "prefix" : "extension";
      }
      var uo = G(((n) => {
        Object.defineProperty(n, "__esModule", { value: !0 }), n.stringifyPath = n.quoteKey = n.isValidVariableName = n.IS_VALID_IDENTIFIER = n.quoteString = void 0;
        var o = /[\\\'\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, a = /* @__PURE__ */ new Map([["\b", "\\b"], ["	", "\\t"], [`
`, "\\n"], ["\f", "\\f"], ["\r", "\\r"], ["'", "\\'"], ['"', '\\"'], ["\\", "\\\\"]]);
        function l(g) {
          return a.get(g) || `\\u${`0000${g.charCodeAt(0).toString(16)}`.slice(-4)}`;
        }
        function c(g) {
          return `'${g.replace(o, l)}'`;
        }
        n.quoteString = c;
        var d = new Set("break else new var case finally return void catch for switch while continue function this with default if throw delete in try do instanceof typeof abstract enum int short boolean export interface static byte extends long super char final native synchronized class float package throws const goto private transient debugger implements protected volatile double import public let yield".split(" "));
        n.IS_VALID_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
        function u(g) {
          return typeof g == "string" && !d.has(g) && n.IS_VALID_IDENTIFIER.test(g);
        }
        n.isValidVariableName = u;
        function y(g, E) {
          return u(g) ? g : E(g);
        }
        n.quoteKey = y;
        function b(g, E) {
          let x = "";
          for (let N of g) u(N) ? x += `.${N}` : x += `[${E(N)}]`;
          return x;
        }
        n.stringifyPath = b;
      })), vl = G(((n) => {
        Object.defineProperty(n, "__esModule", { value: !0 }), n.FunctionParser = n.dedentFunction = n.functionToString = n.USED_METHOD_KEY = void 0;
        var o = uo(), a = { " "() {
        } }[" "].toString().charAt(0) === '"', l = { Function: "function ", GeneratorFunction: "function* ", AsyncFunction: "async function ", AsyncGeneratorFunction: "async function* " }, c = { Function: "", GeneratorFunction: "*", AsyncFunction: "async ", AsyncGeneratorFunction: "async *" }, d = new Set("case delete else in instanceof new return throw typeof void , ; : + - ! ~ & | ^ * / % < > ? =".split(" "));
        n.USED_METHOD_KEY = /* @__PURE__ */ new WeakSet(), n.functionToString = (b, g, E, x) => {
          let N = typeof x == "string" ? x : void 0;
          return N !== void 0 && n.USED_METHOD_KEY.add(b), new y(b, g, E, N).stringify();
        };
        function u(b) {
          let g;
          for (let E of b.split(`
`).slice(1)) {
            let x = /^[\s\t]+/.exec(E);
            if (!x) return b;
            let [N] = x;
            (g === void 0 || N.length < g.length) && (g = N);
          }
          return g ? b.split(`
${g}`).join(`
`) : b;
        }
        n.dedentFunction = u;
        var y = class {
          constructor(b, g, E, x) {
            this.fn = b, this.indent = g, this.next = E, this.key = x, this.pos = 0, this.hadKeyword = !1, this.fnString = Function.prototype.toString.call(b), this.fnType = b.constructor.name, this.keyQuote = x === void 0 ? "" : o.quoteKey(x, E), this.keyPrefix = x === void 0 ? "" : `${this.keyQuote}:${g ? " " : ""}`, this.isMethodCandidate = x === void 0 ? !1 : this.fn.name === "" || this.fn.name === x;
          }
          stringify() {
            let b = this.tryParse();
            return b ? u(b) : `${this.keyPrefix}void ${this.next(this.fnString)}`;
          }
          getPrefix() {
            return this.isMethodCandidate && !this.hadKeyword ? c[this.fnType] + this.keyQuote : this.keyPrefix + l[this.fnType];
          }
          tryParse() {
            if (this.fnString[this.fnString.length - 1] !== "}") return this.keyPrefix + this.fnString;
            if (this.fn.name) {
              let g = this.tryStrippingName();
              if (g) return g;
            }
            let b = this.pos;
            if (this.consumeSyntax() === "class") return this.fnString;
            if (this.pos = b, this.tryParsePrefixTokens()) {
              let g = this.tryStrippingName();
              if (g) return g;
              let E = this.pos;
              switch (this.consumeSyntax("WORD_LIKE")) {
                case "WORD_LIKE":
                  this.isMethodCandidate && !this.hadKeyword && (E = this.pos);
                case "()":
                  if (this.fnString.substr(this.pos, 2) === "=>") return this.keyPrefix + this.fnString;
                  this.pos = E;
                case '"':
                case "'":
                case "[]":
                  return this.getPrefix() + this.fnString.substr(this.pos);
              }
            }
          }
          tryStrippingName() {
            if (a) return;
            let b = this.pos, g = this.fnString.substr(this.pos, this.fn.name.length);
            if (g === this.fn.name && (this.pos += g.length, this.consumeSyntax() === "()" && this.consumeSyntax() === "{}" && this.pos === this.fnString.length)) return (this.isMethodCandidate || !o.isValidVariableName(g)) && (b += g.length), this.getPrefix() + this.fnString.substr(b);
            this.pos = b;
          }
          tryParsePrefixTokens() {
            let b = this.pos;
            switch (this.hadKeyword = !1, this.fnType) {
              case "AsyncFunction":
                if (this.consumeSyntax() !== "async") return !1;
                b = this.pos;
              case "Function":
                return this.consumeSyntax() === "function" ? this.hadKeyword = !0 : this.pos = b, !0;
              case "AsyncGeneratorFunction":
                if (this.consumeSyntax() !== "async") return !1;
              case "GeneratorFunction":
                let g = this.consumeSyntax();
                return g === "function" && (g = this.consumeSyntax(), this.hadKeyword = !0), g === "*";
            }
          }
          consumeSyntax(b) {
            let g = this.consumeMatch(/^(?:([A-Za-z_0-9$\xA0-\uFFFF]+)|=>|\+\+|\-\-|.)/);
            if (!g) return;
            let [E, x] = g;
            if (this.consumeWhitespace(), x) return b || x;
            switch (E) {
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
            return E;
          }
          consumeSyntaxUntil(b, g) {
            let E = !0;
            for (; ; ) {
              let x = this.consumeSyntax();
              if (x === g) return b + g;
              if (!x || x === ")" || x === "]" || x === "}") return;
              x === "/" && E && this.consumeMatch(/^(?:\\.|[^\\\/\n[]|\[(?:\\.|[^\]])*\])+\/[a-z]*/) ? (E = !1, this.consumeWhitespace()) : E = d.has(x);
            }
          }
          consumeMatch(b) {
            let g = b.exec(this.fnString.substr(this.pos));
            return g && (this.pos += g[0].length), g;
          }
          consumeRegExp(b, g) {
            let E = b.exec(this.fnString.substr(this.pos));
            if (E) return this.pos += E[0].length, this.consumeWhitespace(), g;
          }
          consumeTemplate() {
            for (; ; ) {
              if (this.consumeMatch(/^(?:[^`$\\]|\\.|\$(?!{))*/), this.fnString[this.pos] === "`") return this.pos++, this.consumeWhitespace(), "`";
              if (!(this.fnString.substr(this.pos, 2) === "${" && (this.pos += 2, this.consumeWhitespace(), this.consumeSyntaxUntil("{", "}")))) return;
            }
          }
          consumeWhitespace() {
            this.consumeMatch(/^(?:\s|\/\/.*|\/\*[^]*?\*\/)*/);
          }
        };
        n.FunctionParser = y;
      })), mf = G(((n) => {
        Object.defineProperty(n, "__esModule", { value: !0 }), n.arrayToString = void 0, n.arrayToString = (o, a, l) => {
          let c = o.map(function(u, y) {
            let b = l(u, y);
            return b === void 0 ? String(b) : a + b.split(`
`).join(`
${a}`);
          }).join(a ? `,
` : ","), d = a && c ? `
` : "";
          return `[${d}${c}${d}]`;
        };
      })), gf = G(((n) => {
        Object.defineProperty(n, "__esModule", { value: !0 }), n.objectToString = void 0;
        var o = uo(), a = vl(), l = mf();
        n.objectToString = (y, b, g, E) => {
          if (typeof Buffer == "function" && Buffer.isBuffer(y)) return `Buffer.from(${g(y.toString("base64"))}, 'base64')`;
          if (typeof lp == "object" && y === lp) return d(y, b, g);
          let x = u[Object.prototype.toString.call(y)];
          return x ? x(y, b, g, E) : void 0;
        };
        var c = (y, b, g, E) => {
          let x = b ? `
` : "", N = b ? " " : "", S = Object.keys(y).reduce(function(O, R) {
            let Y = y[R], se = g(Y, R);
            if (se === void 0) return O;
            let ie = se.split(`
`).join(`
${b}`);
            return a.USED_METHOD_KEY.has(Y) ? (O.push(`${b}${ie}`), O) : (O.push(`${b}${o.quoteKey(R, g)}:${N}${ie}`), O);
          }, []).join(`,${x}`);
          return S === "" ? "{}" : `{${x}${S}${x}}`;
        }, d = (y, b, g) => `Function(${g("return this")})()`, u = { "[object Array]": l.arrayToString, "[object Object]": c, "[object Error]": (y, b, g) => `new Error(${g(y.message)})`, "[object Date]": (y) => `new Date(${y.getTime()})`, "[object String]": (y, b, g) => `new String(${g(y.toString())})`, "[object Number]": (y) => `new Number(${y})`, "[object Boolean]": (y) => `new Boolean(${y})`, "[object Set]": (y, b, g) => `new Set(${g(Array.from(y))})`, "[object Map]": (y, b, g) => `new Map(${g(Array.from(y))})`, "[object RegExp]": String, "[object global]": d, "[object Window]": d };
      })), yf = G(((n) => {
        Object.defineProperty(n, "__esModule", { value: !0 }), n.toString = void 0;
        var o = uo(), a = gf(), l = vl(), c = { string: o.quoteString, number: (d) => Object.is(d, -0) ? "-0" : String(d), boolean: String, symbol: (d, u, y) => {
          let b = Symbol.keyFor(d);
          return b === void 0 ? `Symbol(${y(d.description)})` : `Symbol.for(${y(b)})`;
        }, bigint: (d, u, y) => `BigInt(${y(String(d))})`, undefined: String, object: a.objectToString, function: l.functionToString };
        n.toString = (d, u, y, b) => d === null ? "null" : c[typeof d](d, u, y, b);
      })), bf = G(((n) => {
        Object.defineProperty(n, "__esModule", { value: !0 }), n.stringify = void 0;
        var o = yf(), a = uo(), l = Symbol("root");
        function c(u, y, b, g = {}) {
          let E = typeof b == "string" ? b : " ".repeat(b || 0), x = [], N = /* @__PURE__ */ new Set(), S = /* @__PURE__ */ new Map(), O = /* @__PURE__ */ new Map(), R = 0, { maxDepth: Y = 100, references: se = !1, skipUndefinedProperties: ie = !1, maxValues: ae = 1e5 } = g, pe = d(y), be = (z, V) => {
            if (++R > ae || ie && z === void 0 || x.length > Y) return;
            if (V === void 0) return pe(z, E, be, V);
            x.push(V);
            let te = J(z, V === l ? void 0 : V);
            return x.pop(), te;
          }, J = se ? (z, V) => {
            if (z !== null && (typeof z == "object" || typeof z == "function" || typeof z == "symbol")) {
              if (S.has(z)) return O.set(x.slice(1), S.get(z)), pe(void 0, E, be, V);
              S.set(z, x.slice(1));
            }
            return pe(z, E, be, V);
          } : (z, V) => {
            if (N.has(z)) return;
            N.add(z);
            let te = pe(z, E, be, V);
            return N.delete(z), te;
          }, we = be(u, l);
          if (O.size) {
            let z = E ? " " : "", V = E ? `
` : "", te = `var x${z}=${z}${we};${V}`;
            for (let [D, w] of O.entries()) {
              let M = a.stringifyPath(D, be), X = a.stringifyPath(w, be);
              te += `x${M}${z}=${z}x${X};${V}`;
            }
            return `(function${z}()${z}{${V}${te}return x;${V}}())`;
          }
          return we;
        }
        n.stringify = c;
        function d(u) {
          return u ? (y, b, g, E) => u(y, b, (x) => o.toString(x, b, g, E), E) : o.toString;
        }
      }))();
      function po(n, o = !0) {
        if (n === void 0) return "undefined";
        if (typeof n == "function") return "function() {…}";
        let a = (0, bf.stringify)(n, vf, null, { maxDepth: 2 });
        return o ? a : a.replace(/(^"|"$)/g, "");
      }
      function Xe(n) {
        let o = {};
        for (let a in n) o[a] = n[a], o[a].value = po(o[a].value);
        return o;
      }
      function kl(n, o) {
        return n.length > o ? n.substr(0, o) + `… [${n.length - o} characters left]` : n;
      }
      function vf(n, o, a) {
        return typeof n == "string" ? `"${n.replaceAll("'", '\\"')}"` : a(n);
      }
      var Ri = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_", wl = ["#03a9f4", "#fb8c00", "#009688", "#e91e63", "#4caf50", "#00bcd4", "#607d8b", "#cddc39", "#9c27b0", "#f44336", "#6d4c41", "#8bc34a", "#3f51b5", "#2196f3", "#f4511e", "#673ab7", "#ffb300"];
      function El(n) {
        if (!n) return [];
        let o = [...n.model.document.roots];
        return o.filter(({ rootName: a }) => a !== "$graveyard").concat(o.filter(({ rootName: a }) => a === "$graveyard"));
      }
      function kf(n, o) {
        if (!n) return [];
        let a = [], l = n.model;
        for (let c of l.document.selection.getRanges()) c.root.rootName === o && a.push({ type: "selection", start: qn(c.start), end: qn(c.end) });
        return a;
      }
      function wf(n, o) {
        if (!n) return [];
        let a = [], l = n.model, c = 0;
        for (let d of l.markers) {
          let { name: u, affectsData: y, managedUsingOperations: b } = d, g = d.getStart(), E = d.getEnd();
          g.root.rootName === o && a.push({ type: "marker", marker: d, name: u, affectsData: y, managedUsingOperations: b, presentation: { color: wl[c++ % (wl.length - 1)] }, start: qn(g), end: qn(E) });
        }
        return a;
      }
      function Ef({ currentEditor: n, currentRootName: o, ranges: a, markers: l }) {
        return n ? [xl(n.model.document.getRoot(o), [...a, ...l])] : [];
      }
      function _l(n, o) {
        let a = { editorNode: o, properties: {}, attributes: {} };
        hl(o) ? (ml(o) ? (a.type = "RootElement", a.name = o.rootName, a.url = `${Ri}rootelement-RootElement.html`) : (a.type = "Element", a.name = o.name, a.url = `${Ri}element-Element.html`), a.properties = { childCount: { value: o.childCount }, startOffset: { value: o.startOffset }, endOffset: { value: o.endOffset }, maxOffset: { value: o.maxOffset } }) : (a.name = o.data, a.type = "Text", a.url = `${Ri}text-Text.html`, a.properties = { startOffset: { value: o.startOffset }, endOffset: { value: o.endOffset }, offsetSize: { value: o.offsetSize } }), a.properties.path = { value: gl(o) }, Sl(o).forEach(([l, c]) => {
          a.attributes[l] = { value: c };
        }), a.properties = Xe(a.properties), a.attributes = Xe(a.attributes);
        for (let l in a.attributes) {
          let c = {}, d = n.model.schema.getAttributeProperties(l);
          for (let u in d) c[u] = { value: d[u] };
          a.attributes[l].subProperties = Xe(c);
        }
        return a;
      }
      function xl(n, o) {
        let a = {}, { startOffset: l, endOffset: c } = n;
        return Object.assign(a, { startOffset: l, endOffset: c, node: n, path: n.getPath(), positionsBefore: [], positionsAfter: [] }), hl(n) ? _f(a, o) : Cf(a), a;
      }
      function _f(n, o) {
        let a = n.node;
        Object.assign(n, { type: "element", name: a.name, children: [], maxOffset: a.maxOffset, positions: [] });
        for (let l of a.getChildren()) n.children.push(xl(l, o));
        xf(n, o), n.attributes = Cl(a);
      }
      function xf(n, o) {
        for (let a of o) {
          let l = Sf(n, a);
          for (let c of l) {
            let d = c.offset;
            if (d === 0) {
              let u = n.children[0];
              u ? u.positionsBefore.push(c) : n.positions.push(c);
            } else if (d === n.maxOffset) {
              let u = n.children[n.children.length - 1];
              u ? u.positionsAfter.push(c) : n.positions.push(c);
            } else {
              let u = c.isEnd ? 0 : n.children.length - 1, y = n.children[u];
              for (; y; ) {
                if (y.startOffset === d) {
                  y.positionsBefore.push(c);
                  break;
                }
                if (y.endOffset === d) {
                  let b = n.children[u + 1], g = y.type === "text" && b && b.type === "element", E = y.type === "element" && b && b.type === "text", x = y.type === "text" && b && b.type === "text";
                  c.isEnd && (g || E || x) ? b.positionsBefore.push(c) : y.positionsAfter.push(c);
                  break;
                }
                if (y.startOffset < d && y.endOffset > d) {
                  y.positions.push(c);
                  break;
                }
                u += c.isEnd ? 1 : -1, y = n.children[u];
              }
            }
          }
        }
      }
      function Cf(n) {
        let o = n.node;
        Object.assign(n, { type: "text", text: o.data, positions: [], presentation: { dontRenderAttributeValue: !0 } }), n.attributes = Cl(o);
      }
      function Cl(n) {
        let o = Sl(n).map(([a, l]) => [a, po(l, !1)]);
        return new Map(o);
      }
      function Sl(n) {
        return [...n.getAttributes()].sort(([o], [a]) => o < a ? -1 : 1);
      }
      function Sf(n, o) {
        let a = n.path, l = o.start.path, c = o.end.path, d = [];
        return Tl(a, l) && d.push({ offset: l[l.length - 1], isEnd: !1, presentation: o.presentation || null, type: o.type, name: o.name || null }), Tl(a, c) && d.push({ offset: c[c.length - 1], isEnd: !0, presentation: o.presentation || null, type: o.type, name: o.name || null }), d;
      }
      function Tl(n, o) {
        return n.length === o.length - 1 && bl(n, o) === "prefix";
      }
      var Tf = class {
        constructor(n) {
          this._config = n;
        }
        startListening(n) {
          n.model.document.on("change", this._config.onModelChange), n.editing.view.on("render", this._config.onViewRender), n.on("change:isReadOnly", this._config.onReadOnlyChange);
        }
        stopListening(n) {
          n.model.document.off("change", this._config.onModelChange), n.editing.view.off("render", this._config.onViewRender), n.off("change:isReadOnly", this._config.onReadOnlyChange);
        }
      };
      function Cn(n) {
        return n.editors.get(n.currentEditorName);
      }
      var Je = class {
        static set(n, o) {
          window.localStorage.setItem("ck5-inspector-" + n, o);
        }
        static get(n) {
          return window.localStorage.getItem("ck5-inspector-" + n);
        }
      }, Of = "active-model-tab-name", Ol = "model-show-markers", Nl = "model-compact-text";
      function Nf(n, o, a) {
        let l = Pf(n, o, a);
        return l && (l.ui = Df(l.ui, a)), l;
      }
      function Pf(n, o, a) {
        if (n.ui.activeTab !== "Model") return o;
        if (!o) return Pl(n, o);
        switch (a.type) {
          case Zs:
            return If(n, o, a);
          case Js:
            return { ...o, currentNode: a.currentNode, currentNodeDefinition: _l(Cn(n), a.currentNode) };
          case Wn:
          case rl:
            return { ...o, ...Mi(n, o) };
          case _n:
          case xn:
            return Pl(n, o);
          default:
            return o;
        }
      }
      function Df(n, o) {
        if (!n) return { activeTab: Je.get("active-model-tab-name") || "Inspect", showMarkers: Je.get(Ol) === "true", showCompactText: Je.get(Nl) === "true" };
        switch (o.type) {
          case el:
            return Rf(n, o);
          case tl:
            return Mf(n);
          case nl:
            return Af(n);
          default:
            return n;
        }
      }
      function If(n, o, a) {
        let l = a.currentRootName;
        return { ...o, ...Mi(n, o, { currentRootName: l }), currentNode: null, currentNodeDefinition: null, currentRootName: l };
      }
      function Rf(n, o) {
        return Je.set(Of, o.tabName), { ...n, activeTab: o.tabName };
      }
      function Mf(n) {
        let o = !n.showMarkers;
        return Je.set(Ol, o), { ...n, showMarkers: o };
      }
      function Af(n) {
        let o = !n.showCompactText;
        return Je.set(Nl, o), { ...n, showCompactText: o };
      }
      function Pl(n, o = {}) {
        let a = Cn(n);
        if (!a) return { ui: o.ui };
        let l = El(a)[0].rootName;
        return { ...o, ...Mi(n, o, { currentRootName: l }), currentRootName: l, currentNode: null, currentNodeDefinition: null };
      }
      function Mi(n, o, a) {
        let l = Cn(n), c = { ...o, ...a }, d = c.currentRootName, u = kf(l, d), y = wf(l, d), b = Ef({ currentEditor: l, currentRootName: c.currentRootName, ranges: u, markers: y }), g = c.currentNode, E = c.currentNodeDefinition;
        return g ? g.root.rootName !== d || !ml(g) && !g.parent ? (g = null, E = null) : E = _l(l, g) : E = null, { treeDefinition: b, currentNode: g, currentNodeDefinition: E, ranges: u, markers: y };
      }
      var Dl = "SET_VIEW_CURRENT_ROOT_NAME", Il = "SET_VIEW_CURRENT_NODE", Rl = "SET_VIEW_ACTIVE_TAB", Ml = "TOGGLE_VIEW_SHOW_ELEMENT_TYPES", Al = "UPDATE_VIEW_STATE";
      function zf(n) {
        return { type: Dl, currentRootName: n };
      }
      function jf(n) {
        return { type: Il, currentNode: n };
      }
      function zl(n) {
        return { type: Rl, tabName: n };
      }
      function Lf() {
        return { type: Ml };
      }
      function Ai() {
        return { type: Al };
      }
      function en(n) {
        return n && n.name;
      }
      function zi(n) {
        return n && en(n) && n.is("attributeElement");
      }
      function ji(n) {
        return n && en(n) && n.is("emptyElement");
      }
      function Li(n) {
        return n && en(n) && n.is("uiElement");
      }
      function Ui(n) {
        return n && en(n) && n.is("rawElement");
      }
      function Uf(n) {
        return n && en(n) && n.is("editableElement");
      }
      function fo(n) {
        return n && n.is("rootElement");
      }
      function ho(n) {
        return { path: [...n.parent.getPath(), n.offset], offset: n.offset, isAtEnd: n.isAtEnd, isAtStart: n.isAtStart, parent: Vf(n.parent) };
      }
      function Vf(n) {
        return en(n) ? zi(n) ? "attribute:" + n.name : fo(n) ? "root:" + n.name : "container:" + n.name : n.data;
      }
      var Ot = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_view", Ff = `&lt;!--The View UI element content has been skipped. <a href="${Ot}_uielement-UIElement.html" target="_blank">Find out why</a>. --&gt;`, $f = `&lt;!--The View raw element content has been skipped. <a href="${Ot}_rawelement-RawElement.html" target="_blank">Find out why</a>. --&gt;`;
      function jl(n) {
        return n ? [...n.editing.view.document.roots] : [];
      }
      function Hf(n, o) {
        if (!n) return [];
        let a = [], l = n.editing.view.document.selection;
        for (let c of l.getRanges()) c.root.rootName === o && a.push({ type: "selection", start: ho(c.start), end: ho(c.end) });
        return a;
      }
      function Bf({ currentEditor: n, currentRootName: o, ranges: a }) {
        return !n || !o ? null : [Ul(n.editing.view.document.getRoot(o), [...a])];
      }
      function Ll(n) {
        let o = { editorNode: n, properties: {}, attributes: {}, customProperties: {} };
        if (en(n)) {
          fo(n) ? (o.type = "RootEditableElement", o.name = n.rootName, o.url = `${Ot}_rooteditableelement-RootEditableElement.html`) : (o.name = n.name, zi(n) ? (o.type = "AttributeElement", o.url = `${Ot}_attributeelement-AttributeElement.html`) : ji(n) ? (o.type = "EmptyElement", o.url = `${Ot}_emptyelement-EmptyElement.html`) : Li(n) ? (o.type = "UIElement", o.url = `${Ot}_uielement-UIElement.html`) : Ui(n) ? (o.type = "RawElement", o.url = `${Ot}_rawelement-RawElement.html`) : Uf(n) ? (o.type = "EditableElement", o.url = `${Ot}_editableelement-EditableElement.html`) : (o.type = "ContainerElement", o.url = `${Ot}_containerelement-ContainerElement.html`)), $l(n).forEach(([a, l]) => {
            o.attributes[a] = { value: l };
          }), o.properties = { index: { value: n.index }, isEmpty: { value: n.isEmpty }, childCount: { value: n.childCount } };
          for (let [a, l] of n.getCustomProperties()) typeof a == "symbol" && (a = a.toString()), o.customProperties[a] = { value: l };
        } else o.name = n.data, o.type = "Text", o.url = `${Ot}_text-Text.html`, o.properties = { index: { value: n.index } };
        return o.properties = Xe(o.properties), o.customProperties = Xe(o.customProperties), o.attributes = Xe(o.attributes), o;
      }
      function Ul(n, o) {
        let a = {};
        return Object.assign(a, { index: n.index, path: n.getPath(), node: n, positionsBefore: [], positionsAfter: [] }), en(n) ? Wf(a, o) : qf(a, o), a;
      }
      function Wf(n, o) {
        let a = n.node;
        Object.assign(n, { type: "element", children: [], positions: [] }), n.name = a.name, zi(a) ? n.elementType = "attribute" : fo(a) ? n.elementType = "root" : ji(a) ? n.elementType = "empty" : Li(a) ? n.elementType = "ui" : Ui(a) ? n.elementType = "raw" : n.elementType = "container", ji(a) ? n.presentation = { isEmpty: !0 } : Li(a) ? n.children.push({ type: "comment", text: Ff }) : Ui(a) && n.children.push({ type: "comment", text: $f });
        for (let l of a.getChildren()) n.children.push(Ul(l, o));
        Kf(n, o), n.attributes = Qf(a);
      }
      function qf(n, o) {
        Object.assign(n, { type: "text", startOffset: 0, text: n.node.data, positions: [] });
        for (let a of o) {
          let l = Vl(n, a);
          n.positions.push(...l);
        }
      }
      function Kf(n, o) {
        for (let a of o) {
          let l = Vl(n, a);
          for (let c of l) {
            let d = c.offset;
            if (d === 0) {
              let u = n.children[0];
              u ? u.positionsBefore.push(c) : n.positions.push(c);
            } else if (d === n.children.length) {
              let u = n.children[n.children.length - 1];
              u ? u.positionsAfter.push(c) : n.positions.push(c);
            } else {
              let u = c.isEnd ? 0 : n.children.length - 1, y = n.children[u];
              for (; y; ) {
                if (y.index === d) {
                  y.positionsBefore.push(c);
                  break;
                }
                if (y.index + 1 === d) {
                  y.positionsAfter.push(c);
                  break;
                }
                u += c.isEnd ? 1 : -1, y = n.children[u];
              }
            }
          }
        }
      }
      function Vl(n, o) {
        let a = n.path, l = o.start.path, c = o.end.path, d = [];
        return Fl(a, l) && d.push({ offset: l[l.length - 1], isEnd: !1, presentation: o.presentation || null, type: o.type, name: o.name || null }), Fl(a, c) && d.push({ offset: c[c.length - 1], isEnd: !0, presentation: o.presentation || null, type: o.type, name: o.name || null }), d;
      }
      function Fl(n, o) {
        return n.length === o.length - 1 && bl(n, o) === "prefix";
      }
      function Qf(n) {
        let o = $l(n).map(([a, l]) => [a, po(l, !1)]);
        return new Map(o);
      }
      function $l(n) {
        return [...n.getAttributes()].sort(([o], [a]) => o.toUpperCase() < a.toUpperCase() ? -1 : 1);
      }
      var Yf = "active-view-tab-name", Hl = "view-element-types";
      function Gf(n, o, a) {
        let l = Xf(n, o, a);
        return l && (l.ui = Zf(n, l.ui, a)), l;
      }
      function Xf(n, o, a) {
        if (n.ui.activeTab !== "View") return o;
        if (!o) return Bl(n, o);
        switch (a.type) {
          case Dl:
            return Jf(n, o, a);
          case Il:
            return { ...o, currentNode: a.currentNode, currentNodeDefinition: Ll(a.currentNode) };
          case Wn:
          case Al:
            return { ...o, ...Vi(n, o) };
          case _n:
          case xn:
            return Bl(n, o);
          default:
            return o;
        }
      }
      function Zf(n, o, a) {
        if (!o) return { activeTab: Je.get("active-view-tab-name") || "Inspect", showElementTypes: Je.get(Hl) === "true" };
        switch (a.type) {
          case Rl:
            return eh(o, a);
          case Ml:
            return th(n, o);
          default:
            return o;
        }
      }
      function Jf(n, o, a) {
        let l = a.currentRootName;
        return { ...o, ...Vi(n, o, { currentRootName: l }), currentNode: null, currentNodeDefinition: null, currentRootName: l };
      }
      function eh(n, o) {
        return Je.set(Yf, o.tabName), { ...n, activeTab: o.tabName };
      }
      function th(n, o) {
        let a = !o.showElementTypes;
        return Je.set(Hl, a), { ...o, showElementTypes: a };
      }
      function Bl(n, o = {}) {
        let a = jl(Cn(n)), l = a[0] ? a[0].rootName : null;
        return { ...o, ...Vi(n, o, { currentRootName: l }), currentRootName: l, currentNode: null, currentNodeDefinition: null };
      }
      function Vi(n, o, a) {
        let l = { ...o, ...a }, c = l.currentRootName, d = Hf(Cn(n), c), u = Bf({ currentEditor: Cn(n), currentRootName: c, ranges: d }), y = l.currentNode, b = l.currentNodeDefinition;
        return y ? y.root.rootName !== c || !fo(y) && !y.parent ? (y = null, b = null) : b = Ll(y) : b = null, { treeDefinition: u, currentNode: y, currentNodeDefinition: b, ranges: d };
      }
      var Wl = "SET_COMMANDS_CURRENT_COMMAND_NAME", ql = "UPDATE_COMMANDS_STATE";
      function nh(n) {
        return { type: Wl, currentCommandName: n };
      }
      function Fi() {
        return { type: ql };
      }
      function Kl({ editors: n, currentEditorName: o }, a) {
        if (!a) return null;
        let l = n.get(o).commands.get(a);
        return { currentCommandName: a, type: "Command", url: "https://ckeditor.com/docs/ckeditor5/latest/api/module_core_command-Command.html", properties: Xe({ isEnabled: { value: l.isEnabled }, value: { value: l.value } }), command: l };
      }
      function Ql({ editors: n, currentEditorName: o }) {
        if (!n.get(o)) return [];
        let a = [];
        for (let [l, c] of n.get(o).commands) {
          let d = [];
          c.value !== void 0 && d.push(["value", po(c.value, !1)]), a.push({ name: l, type: "element", children: [], node: l, attributes: d, presentation: { isEmpty: !0, cssClass: ["ck-inspector-tree-node_tagless", c.isEnabled ? "" : "ck-inspector-tree-node_disabled"].join(" ") } });
        }
        return a.sort((l, c) => l.name > c.name ? 1 : -1);
      }
      function rh(n, o, a) {
        if (n.ui.activeTab !== "Commands") return o;
        if (!o) return Yl(n, o);
        switch (a.type) {
          case Wl:
            return { ...o, currentCommandDefinition: Kl(n, a.currentCommandName), currentCommandName: a.currentCommandName };
          case Wn:
          case ql:
            return { ...o, currentCommandDefinition: Kl(n, o.currentCommandName), treeDefinition: Ql(n) };
          case _n:
          case xn:
            return Yl(n, o);
          default:
            return o;
        }
      }
      function Yl(n, o = {}) {
        return { ...o, currentCommandName: null, currentCommandDefinition: null, treeDefinition: Ql(n) };
      }
      var Gl = "SET_SCHEMA_CURRENT_DEFINITION_NAME";
      function $i(n) {
        return { type: Gl, currentSchemaDefinitionName: n };
      }
      var oh = ["isBlock", "isInline", "isObject", "isContent", "isLimit", "isSelectable"];
      function Xl({ editors: n, currentEditorName: o }, a) {
        if (!a) return null;
        let l = n.get(o).model.schema, c = l.getDefinitions()[a], d = {}, u = {}, y = {}, b = {};
        for (let g of oh) c[g] && (d[g] = { value: c[g] });
        for (let g of c.allowChildren.sort()) u[g] = { value: !0, title: `Click to see the definition of ${g}` };
        for (let g of c.allowIn.sort()) y[g] = { value: !0, title: `Click to see the definition of ${g}` };
        for (let g of c.allowAttributes.sort()) b[g] = { value: !0 };
        b = Xe(b);
        for (let g in b) {
          let E = l.getAttributeProperties(g), x = {};
          for (let N in E) x[N] = { value: E[N] };
          b[g].subProperties = Xe(x);
        }
        return { currentSchemaDefinitionName: a, type: "SchemaCompiledItemDefinition", urls: { general: "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_schema-SchemaCompiledItemDefinition.html", allowAttributes: "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_schema-SchemaItemDefinition.html#member-allowAttributes", allowChildren: "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_schema-SchemaItemDefinition.html#member-allowChildren", allowIn: "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_schema-SchemaItemDefinition.html#member-allowIn" }, properties: Xe(d), allowChildren: Xe(u), allowIn: Xe(y), allowAttributes: b, definition: c };
      }
      function Zl({ editors: n, currentEditorName: o }) {
        if (!n.get(o)) return [];
        let a = [], l = n.get(o).model.schema.getDefinitions();
        for (let c in l) a.push({ name: c, type: "element", children: [], node: c, attributes: [], presentation: { isEmpty: !0, cssClass: "ck-inspector-tree-node_tagless" } });
        return a.sort((c, d) => c.name > d.name ? 1 : -1);
      }
      function ih(n, o, a) {
        if (n.ui.activeTab !== "Schema") return o;
        if (!o) return Jl(n, o);
        switch (a.type) {
          case Gl:
            return { ...o, currentSchemaDefinition: Xl(n, a.currentSchemaDefinitionName), currentSchemaDefinitionName: a.currentSchemaDefinitionName };
          case Wn:
            return { ...o, currentSchemaDefinition: Xl(n, o.currentSchemaDefinitionName), treeDefinition: Zl(n) };
          case _n:
          case xn:
            return Jl(n, o);
          default:
            return o;
        }
      }
      function Jl(n, o = {}) {
        return { ...o, currentSchemaDefinitionName: null, currentSchemaDefinition: null, treeDefinition: Zl(n) };
      }
      var ah = "active-tab-name", ec = "is-collapsed", sh = "height", lh = "side-pane-width";
      function ch(n, o) {
        let a = uh(n, o);
        return a.currentEditorGlobals = dh(a, a.currentEditorGlobals, o), a.ui = ph(a.ui, o), a.model = Nf(a, a.model, o), a.view = Gf(a, a.view, o), a.commands = rh(a, a.commands, o), a.schema = ih(a, a.schema, o), { ...n, ...a };
      }
      function uh(n, o) {
        switch (o.type) {
          case _n:
            return mh(n, o);
          case xn:
            return fh(n, o);
          default:
            return n;
        }
      }
      function dh(n, o, a) {
        switch (a.type) {
          case _n:
          case xn:
            return hh(n);
          case cl:
            return tc(n, o);
          default:
            return o;
        }
      }
      function ph(n, o) {
        if (!n.activeTab) {
          let a;
          return a = n.isCollapsed === void 0 ? Je.get(ec) === "true" : n.isCollapsed, { ...n, isCollapsed: a, activeTab: Je.get("active-tab-name") || "Model", height: Je.get("height") || "400px", sidePaneWidth: Je.get("side-pane-width") || "500px" };
        }
        switch (o.type) {
          case al:
            return bh(n);
          case sl:
            return gh(n, o);
          case ll:
            return yh(n, o);
          case Wn:
            return vh(n, o);
          default:
            return n;
        }
      }
      function fh(n, o) {
        return { ...n, currentEditorName: o.editorName };
      }
      function hh(n) {
        return { ...tc(n, {}) };
      }
      function tc(n, o) {
        let a = Cn(n);
        return { ...o, isReadOnly: a ? a.isReadOnly : !1 };
      }
      function mh(n, o) {
        let a = { editors: new Map(o.editors) };
        return o.editors.size ? o.editors.has(n.currentEditorName) || (a.currentEditorName = yl(o.editors)) : a.currentEditorName = null, { ...n, ...a };
      }
      function gh(n, o) {
        return Je.set(sh, o.newHeight), { ...n, height: o.newHeight };
      }
      function yh(n, o) {
        return Je.set(lh, o.newWidth), { ...n, sidePaneWidth: o.newWidth };
      }
      function bh(n) {
        let o = !n.isCollapsed;
        return Je.set(ec, o), { ...n, isCollapsed: o };
      }
      function vh(n, o) {
        return Je.set(ah, o.tabName), { ...n, activeTab: o.tabName };
      }
      var kh = G(((n, o) => {
        (function() {
          var a = {}.hasOwnProperty;
          function l() {
            for (var u = "", y = 0; y < arguments.length; y++) {
              var b = arguments[y];
              b && (u = d(u, c(b)));
            }
            return u;
          }
          function c(u) {
            if (typeof u == "string" || typeof u == "number") return u;
            if (typeof u != "object") return "";
            if (Array.isArray(u)) return l.apply(null, u);
            if (u.toString !== Object.prototype.toString && !u.toString.toString().includes("[native code]")) return u.toString();
            var y = "";
            for (var b in u) a.call(u, b) && u[b] && (y = d(y, b));
            return y;
          }
          function d(u, y) {
            return y ? u ? u + " " + y : u + y : u;
          }
          o !== void 0 && o.exports ? (l.default = l, o.exports = l) : window.classNames = l;
        })();
      })), mo = G(((n) => {
        Object.defineProperty(n, "__esModule", { value: !0 }), n.findInArray = o, n.isFunction = a, n.isNum = l, n.int = c, n.dontSetMe = d;
        function o(u, y) {
          for (var b = 0, g = u.length; b < g; b++) if (y.apply(y, [u[b], b, u])) return u[b];
        }
        function a(u) {
          return typeof u == "function" || Object.prototype.toString.call(u) === "[object Function]";
        }
        function l(u) {
          return typeof u == "number" && !isNaN(u);
        }
        function c(u) {
          return parseInt(u, 10);
        }
        function d(u, y, b) {
          if (u[y]) return Error(`Invalid prop ${y} passed to ${b} - do not set this, set it on the child.`);
        }
      })), wh = G(((n) => {
        Object.defineProperty(n, "__esModule", { value: !0 }), n.getPrefix = a, n.browserPrefixToKey = l, n.browserPrefixToStyle = c, n.default = void 0;
        var o = ["Moz", "Webkit", "O", "ms"];
        function a() {
          var u = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "transform";
          if (typeof window > "u" || window.document === void 0) return "";
          var y = window.document.documentElement.style;
          if (u in y) return "";
          for (var b = 0; b < o.length; b++) if (l(u, o[b]) in y) return o[b];
          return "";
        }
        function l(u, y) {
          return y ? `${y}${d(u)}` : u;
        }
        function c(u, y) {
          return y ? `-${y.toLowerCase()}-${u}` : u;
        }
        function d(u) {
          for (var y = "", b = !0, g = 0; g < u.length; g++) b ? (y += u[g].toUpperCase(), b = !1) : u[g] === "-" ? b = !0 : y += u[g];
          return y;
        }
        n.default = a();
      })), Hi = G(((n) => {
        function o(w) {
          "@babel/helpers - typeof";
          return o = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(M) {
            return typeof M;
          } : function(M) {
            return M && typeof Symbol == "function" && M.constructor === Symbol && M !== Symbol.prototype ? "symbol" : typeof M;
          }, o(w);
        }
        Object.defineProperty(n, "__esModule", { value: !0 }), n.matchesSelector = E, n.matchesSelectorAndParentsTo = x, n.addEvent = N, n.removeEvent = S, n.outerHeight = O, n.outerWidth = R, n.innerHeight = Y, n.innerWidth = se, n.offsetXYFromParent = ie, n.createCSSTransform = ae, n.createSVGTransform = pe, n.getTranslation = be, n.getTouch = J, n.getTouchIdentifier = we, n.addUserSelectStyles = z, n.removeUserSelectStyles = V, n.addClassName = te, n.removeClassName = D;
        var a = mo(), l = d(wh());
        function c() {
          if (typeof WeakMap != "function") return null;
          var w = /* @__PURE__ */ new WeakMap();
          return c = function() {
            return w;
          }, w;
        }
        function d(w) {
          if (w && w.__esModule) return w;
          if (w === null || o(w) !== "object" && typeof w != "function") return { default: w };
          var M = c();
          if (M && M.has(w)) return M.get(w);
          var X = {}, ce = Object.defineProperty && Object.getOwnPropertyDescriptor;
          for (var q in w) if (Object.prototype.hasOwnProperty.call(w, q)) {
            var ee = ce ? Object.getOwnPropertyDescriptor(w, q) : null;
            ee && (ee.get || ee.set) ? Object.defineProperty(X, q, ee) : X[q] = w[q];
          }
          return X.default = w, M && M.set(w, X), X;
        }
        function u(w, M) {
          var X = Object.keys(w);
          if (Object.getOwnPropertySymbols) {
            var ce = Object.getOwnPropertySymbols(w);
            M && (ce = ce.filter(function(q) {
              return Object.getOwnPropertyDescriptor(w, q).enumerable;
            })), X.push.apply(X, ce);
          }
          return X;
        }
        function y(w) {
          for (var M = 1; M < arguments.length; M++) {
            var X = arguments[M] == null ? {} : arguments[M];
            M % 2 ? u(Object(X), !0).forEach(function(ce) {
              b(w, ce, X[ce]);
            }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(w, Object.getOwnPropertyDescriptors(X)) : u(Object(X)).forEach(function(ce) {
              Object.defineProperty(w, ce, Object.getOwnPropertyDescriptor(X, ce));
            });
          }
          return w;
        }
        function b(w, M, X) {
          return M in w ? Object.defineProperty(w, M, { value: X, enumerable: !0, configurable: !0, writable: !0 }) : w[M] = X, w;
        }
        var g = "";
        function E(w, M) {
          return g || (g = (0, a.findInArray)(["matches", "webkitMatchesSelector", "mozMatchesSelector", "msMatchesSelector", "oMatchesSelector"], function(X) {
            return (0, a.isFunction)(w[X]);
          })), (0, a.isFunction)(w[g]) ? w[g](M) : !1;
        }
        function x(w, M, X) {
          var ce = w;
          do {
            if (E(ce, M)) return !0;
            if (ce === X) return !1;
            ce = ce.parentNode;
          } while (ce);
          return !1;
        }
        function N(w, M, X, ce) {
          if (w) {
            var q = y({ capture: !0 }, ce);
            w.addEventListener ? w.addEventListener(M, X, q) : w.attachEvent ? w.attachEvent("on" + M, X) : w["on" + M] = X;
          }
        }
        function S(w, M, X, ce) {
          if (w) {
            var q = y({ capture: !0 }, ce);
            w.removeEventListener ? w.removeEventListener(M, X, q) : w.detachEvent ? w.detachEvent("on" + M, X) : w["on" + M] = null;
          }
        }
        function O(w) {
          var M = w.clientHeight, X = w.ownerDocument.defaultView.getComputedStyle(w);
          return M += (0, a.int)(X.borderTopWidth), M += (0, a.int)(X.borderBottomWidth), M;
        }
        function R(w) {
          var M = w.clientWidth, X = w.ownerDocument.defaultView.getComputedStyle(w);
          return M += (0, a.int)(X.borderLeftWidth), M += (0, a.int)(X.borderRightWidth), M;
        }
        function Y(w) {
          var M = w.clientHeight, X = w.ownerDocument.defaultView.getComputedStyle(w);
          return M -= (0, a.int)(X.paddingTop), M -= (0, a.int)(X.paddingBottom), M;
        }
        function se(w) {
          var M = w.clientWidth, X = w.ownerDocument.defaultView.getComputedStyle(w);
          return M -= (0, a.int)(X.paddingLeft), M -= (0, a.int)(X.paddingRight), M;
        }
        function ie(w, M, X) {
          var ce = M === M.ownerDocument.body ? { left: 0, top: 0 } : M.getBoundingClientRect();
          return { x: (w.clientX + M.scrollLeft - ce.left) / X, y: (w.clientY + M.scrollTop - ce.top) / X };
        }
        function ae(w, M) {
          var X = be(w, M, "px");
          return b({}, (0, l.browserPrefixToKey)("transform", l.default), X);
        }
        function pe(w, M) {
          return be(w, M, "");
        }
        function be(w, M, X) {
          var ce = `translate(${w.x}${X},${w.y}${X})`;
          return M && (ce = `translate(${`${typeof M.x == "string" ? M.x : M.x + X}`}, ${`${typeof M.y == "string" ? M.y : M.y + X}`})` + ce), ce;
        }
        function J(w, M) {
          return w.targetTouches && (0, a.findInArray)(w.targetTouches, function(X) {
            return M === X.identifier;
          }) || w.changedTouches && (0, a.findInArray)(w.changedTouches, function(X) {
            return M === X.identifier;
          });
        }
        function we(w) {
          if (w.targetTouches && w.targetTouches[0]) return w.targetTouches[0].identifier;
          if (w.changedTouches && w.changedTouches[0]) return w.changedTouches[0].identifier;
        }
        function z(w) {
          if (w) {
            var M = w.getElementById("react-draggable-style-el");
            M || (M = w.createElement("style"), M.type = "text/css", M.id = "react-draggable-style-el", M.innerHTML = `.react-draggable-transparent-selection *::-moz-selection {all: inherit;}
`, M.innerHTML += `.react-draggable-transparent-selection *::selection {all: inherit;}
`, w.getElementsByTagName("head")[0].appendChild(M)), w.body && te(w.body, "react-draggable-transparent-selection");
          }
        }
        function V(w) {
          if (w) try {
            if (w.body && D(w.body, "react-draggable-transparent-selection"), w.selection) w.selection.empty();
            else {
              var M = (w.defaultView || window).getSelection();
              M && M.type !== "Caret" && M.removeAllRanges();
            }
          } catch {
          }
        }
        function te(w, M) {
          w.classList ? w.classList.add(M) : w.className.match(RegExp(`(?:^|\\s)${M}(?!\\S)`)) || (w.className += ` ${M}`);
        }
        function D(w, M) {
          w.classList ? w.classList.remove(M) : w.className = w.className.replace(RegExp(`(?:^|\\s)${M}(?!\\S)`, "g"), "");
        }
      })), nc = G(((n) => {
        Object.defineProperty(n, "__esModule", { value: !0 }), n.getBoundPosition = l, n.snapToGrid = c, n.canDragX = d, n.canDragY = u, n.getControlPosition = y, n.createCoreData = b, n.createDraggableData = g;
        var o = mo(), a = Hi();
        function l(N, S, O) {
          if (!N.props.bounds) return [S, O];
          var R = N.props.bounds;
          R = typeof R == "string" ? R : E(R);
          var Y = x(N);
          if (typeof R == "string") {
            var se = Y.ownerDocument, ie = se.defaultView, ae = R === "parent" ? Y.parentNode : se.querySelector(R);
            if (!(ae instanceof ie.HTMLElement)) throw Error('Bounds selector "' + R + '" could not find an element.');
            var pe = ie.getComputedStyle(Y), be = ie.getComputedStyle(ae);
            R = { left: -Y.offsetLeft + (0, o.int)(be.paddingLeft) + (0, o.int)(pe.marginLeft), top: -Y.offsetTop + (0, o.int)(be.paddingTop) + (0, o.int)(pe.marginTop), right: (0, a.innerWidth)(ae) - (0, a.outerWidth)(Y) - Y.offsetLeft + (0, o.int)(be.paddingRight) - (0, o.int)(pe.marginRight), bottom: (0, a.innerHeight)(ae) - (0, a.outerHeight)(Y) - Y.offsetTop + (0, o.int)(be.paddingBottom) - (0, o.int)(pe.marginBottom) };
          }
          return (0, o.isNum)(R.right) && (S = Math.min(S, R.right)), (0, o.isNum)(R.bottom) && (O = Math.min(O, R.bottom)), (0, o.isNum)(R.left) && (S = Math.max(S, R.left)), (0, o.isNum)(R.top) && (O = Math.max(O, R.top)), [S, O];
        }
        function c(N, S, O) {
          return [Math.round(S / N[0]) * N[0], Math.round(O / N[1]) * N[1]];
        }
        function d(N) {
          return N.props.axis === "both" || N.props.axis === "x";
        }
        function u(N) {
          return N.props.axis === "both" || N.props.axis === "y";
        }
        function y(N, S, O) {
          var R = typeof S == "number" ? (0, a.getTouch)(N, S) : null;
          if (typeof S == "number" && !R) return null;
          var Y = x(O), se = O.props.offsetParent || Y.offsetParent || Y.ownerDocument.body;
          return (0, a.offsetXYFromParent)(R || N, se, O.props.scale);
        }
        function b(N, S, O) {
          var R = N.state, Y = !(0, o.isNum)(R.lastX), se = x(N);
          return Y ? { node: se, deltaX: 0, deltaY: 0, lastX: S, lastY: O, x: S, y: O } : { node: se, deltaX: S - R.lastX, deltaY: O - R.lastY, lastX: R.lastX, lastY: R.lastY, x: S, y: O };
        }
        function g(N, S) {
          var O = N.props.scale;
          return { node: S.node, x: N.state.x + S.deltaX / O, y: N.state.y + S.deltaY / O, deltaX: S.deltaX / O, deltaY: S.deltaY / O, lastX: N.state.x, lastY: N.state.y };
        }
        function E(N) {
          return { left: N.left, top: N.top, right: N.right, bottom: N.bottom };
        }
        function x(N) {
          var S = N.findDOMNode();
          if (!S) throw Error("<DraggableCore>: Unmounted during event!");
          return S;
        }
      })), rc = G(((n) => {
        Object.defineProperty(n, "__esModule", { value: !0 }), n.default = o;
        function o() {
        }
      })), Eh = G(((n) => {
        Object.defineProperty(n, "__esModule", { value: !0 }), n.default = void 0;
        var o = E(pt()), a = b(lo()), l = b(It()), c = Hi(), d = nc(), u = mo(), y = b(rc());
        function b(q) {
          return q && q.__esModule ? q : { default: q };
        }
        function g() {
          if (typeof WeakMap != "function") return null;
          var q = /* @__PURE__ */ new WeakMap();
          return g = function() {
            return q;
          }, q;
        }
        function E(q) {
          if (q && q.__esModule) return q;
          if (q === null || x(q) !== "object" && typeof q != "function") return { default: q };
          var ee = g();
          if (ee && ee.has(q)) return ee.get(q);
          var ye = {}, Z = Object.defineProperty && Object.getOwnPropertyDescriptor;
          for (var De in q) if (Object.prototype.hasOwnProperty.call(q, De)) {
            var W = Z ? Object.getOwnPropertyDescriptor(q, De) : null;
            W && (W.get || W.set) ? Object.defineProperty(ye, De, W) : ye[De] = q[De];
          }
          return ye.default = q, ee && ee.set(q, ye), ye;
        }
        function x(q) {
          "@babel/helpers - typeof";
          return x = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(ee) {
            return typeof ee;
          } : function(ee) {
            return ee && typeof Symbol == "function" && ee.constructor === Symbol && ee !== Symbol.prototype ? "symbol" : typeof ee;
          }, x(q);
        }
        function N(q, ee) {
          return se(q) || Y(q, ee) || O(q, ee) || S();
        }
        function S() {
          throw TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
        }
        function O(q, ee) {
          if (q) {
            if (typeof q == "string") return R(q, ee);
            var ye = Object.prototype.toString.call(q).slice(8, -1);
            if (ye === "Object" && q.constructor && (ye = q.constructor.name), ye === "Map" || ye === "Set") return Array.from(q);
            if (ye === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(ye)) return R(q, ee);
          }
        }
        function R(q, ee) {
          (ee == null || ee > q.length) && (ee = q.length);
          for (var ye = 0, Z = Array(ee); ye < ee; ye++) Z[ye] = q[ye];
          return Z;
        }
        function Y(q, ee) {
          if (!(typeof Symbol > "u" || !(Symbol.iterator in Object(q)))) {
            var ye = [], Z = !0, De = !1, W = void 0;
            try {
              for (var re = q[Symbol.iterator](), ne; !(Z = (ne = re.next()).done) && (ye.push(ne.value), !(ee && ye.length === ee)); Z = !0) ;
            } catch (P) {
              De = !0, W = P;
            } finally {
              try {
                !Z && re.return != null && re.return();
              } finally {
                if (De) throw W;
              }
            }
            return ye;
          }
        }
        function se(q) {
          if (Array.isArray(q)) return q;
        }
        function ie(q, ee) {
          if (!(q instanceof ee)) throw TypeError("Cannot call a class as a function");
        }
        function ae(q, ee) {
          for (var ye = 0; ye < ee.length; ye++) {
            var Z = ee[ye];
            Z.enumerable = Z.enumerable || !1, Z.configurable = !0, "value" in Z && (Z.writable = !0), Object.defineProperty(q, Z.key, Z);
          }
        }
        function pe(q, ee, ye) {
          return ee && ae(q.prototype, ee), q;
        }
        function be(q, ee) {
          if (typeof ee != "function" && ee !== null) throw TypeError("Super expression must either be null or a function");
          q.prototype = Object.create(ee && ee.prototype, { constructor: { value: q, writable: !0, configurable: !0 } }), ee && J(q, ee);
        }
        function J(q, ee) {
          return J = Object.setPrototypeOf || function(ye, Z) {
            return ye.__proto__ = Z, ye;
          }, J(q, ee);
        }
        function we(q) {
          var ee = te();
          return function() {
            var ye = D(q), Z;
            if (ee) {
              var De = D(this).constructor;
              Z = Reflect.construct(ye, arguments, De);
            } else Z = ye.apply(this, arguments);
            return z(this, Z);
          };
        }
        function z(q, ee) {
          return ee && (x(ee) === "object" || typeof ee == "function") ? ee : V(q);
        }
        function V(q) {
          if (q === void 0) throw ReferenceError("this hasn't been initialised - super() hasn't been called");
          return q;
        }
        function te() {
          if (typeof Reflect > "u" || !Reflect.construct || Reflect.construct.sham) return !1;
          if (typeof Proxy == "function") return !0;
          try {
            return Date.prototype.toString.call(Reflect.construct(Date, [], function() {
            })), !0;
          } catch {
            return !1;
          }
        }
        function D(q) {
          return D = Object.setPrototypeOf ? Object.getPrototypeOf : function(ee) {
            return ee.__proto__ || Object.getPrototypeOf(ee);
          }, D(q);
        }
        function w(q, ee, ye) {
          return ee in q ? Object.defineProperty(q, ee, { value: ye, enumerable: !0, configurable: !0, writable: !0 }) : q[ee] = ye, q;
        }
        var M = { touch: { start: "touchstart", move: "touchmove", stop: "touchend" }, mouse: { start: "mousedown", move: "mousemove", stop: "mouseup" } }, X = M.mouse, ce = (function(q) {
          be(ye, q);
          var ee = we(ye);
          function ye() {
            var Z;
            ie(this, ye);
            for (var De = arguments.length, W = Array(De), re = 0; re < De; re++) W[re] = arguments[re];
            return Z = ee.call.apply(ee, [this].concat(W)), w(V(Z), "state", { dragging: !1, lastX: NaN, lastY: NaN, touchIdentifier: null }), w(V(Z), "mounted", !1), w(V(Z), "handleDragStart", function(ne) {
              if (Z.props.onMouseDown(ne), !Z.props.allowAnyClick && typeof ne.button == "number" && ne.button !== 0) return !1;
              var P = Z.findDOMNode();
              if (!P || !P.ownerDocument || !P.ownerDocument.body) throw Error("<DraggableCore> not mounted on DragStart!");
              var B = P.ownerDocument;
              if (!(Z.props.disabled || !(ne.target instanceof B.defaultView.Node) || Z.props.handle && !(0, c.matchesSelectorAndParentsTo)(ne.target, Z.props.handle, P) || Z.props.cancel && (0, c.matchesSelectorAndParentsTo)(ne.target, Z.props.cancel, P))) {
                ne.type === "touchstart" && ne.preventDefault();
                var C = (0, c.getTouchIdentifier)(ne);
                Z.setState({ touchIdentifier: C });
                var U = (0, d.getControlPosition)(ne, C, V(Z));
                if (U != null) {
                  var oe = U.x, me = U.y, Ee = (0, d.createCoreData)(V(Z), oe, me);
                  (0, y.default)("DraggableCore: handleDragStart: %j", Ee), (0, y.default)("calling", Z.props.onStart), !(Z.props.onStart(ne, Ee) === !1 || Z.mounted === !1) && (Z.props.enableUserSelectHack && (0, c.addUserSelectStyles)(B), Z.setState({ dragging: !0, lastX: oe, lastY: me }), (0, c.addEvent)(B, X.move, Z.handleDrag), (0, c.addEvent)(B, X.stop, Z.handleDragStop));
                }
              }
            }), w(V(Z), "handleDrag", function(ne) {
              var P = (0, d.getControlPosition)(ne, Z.state.touchIdentifier, V(Z));
              if (P != null) {
                var B = P.x, C = P.y;
                if (Array.isArray(Z.props.grid)) {
                  var U = B - Z.state.lastX, oe = C - Z.state.lastY, me = N((0, d.snapToGrid)(Z.props.grid, U, oe), 2);
                  if (U = me[0], oe = me[1], !U && !oe) return;
                  B = Z.state.lastX + U, C = Z.state.lastY + oe;
                }
                var Ee = (0, d.createCoreData)(V(Z), B, C);
                if ((0, y.default)("DraggableCore: handleDrag: %j", Ee), Z.props.onDrag(ne, Ee) === !1 || Z.mounted === !1) {
                  try {
                    Z.handleDragStop(new MouseEvent("mouseup"));
                  } catch {
                    var Ie = document.createEvent("MouseEvents");
                    Ie.initMouseEvent("mouseup", !0, !0, window, 0, 0, 0, 0, 0, !1, !1, !1, !1, 0, null), Z.handleDragStop(Ie);
                  }
                  return;
                }
                Z.setState({ lastX: B, lastY: C });
              }
            }), w(V(Z), "handleDragStop", function(ne) {
              if (Z.state.dragging) {
                var P = (0, d.getControlPosition)(ne, Z.state.touchIdentifier, V(Z));
                if (P != null) {
                  var B = P.x, C = P.y, U = (0, d.createCoreData)(V(Z), B, C);
                  if (Z.props.onStop(ne, U) === !1 || Z.mounted === !1) return !1;
                  var oe = Z.findDOMNode();
                  oe && Z.props.enableUserSelectHack && (0, c.removeUserSelectStyles)(oe.ownerDocument), (0, y.default)("DraggableCore: handleDragStop: %j", U), Z.setState({ dragging: !1, lastX: NaN, lastY: NaN }), oe && ((0, y.default)("DraggableCore: Removing handlers"), (0, c.removeEvent)(oe.ownerDocument, X.move, Z.handleDrag), (0, c.removeEvent)(oe.ownerDocument, X.stop, Z.handleDragStop));
                }
              }
            }), w(V(Z), "onMouseDown", function(ne) {
              return X = M.mouse, Z.handleDragStart(ne);
            }), w(V(Z), "onMouseUp", function(ne) {
              return X = M.mouse, Z.handleDragStop(ne);
            }), w(V(Z), "onTouchStart", function(ne) {
              return X = M.touch, Z.handleDragStart(ne);
            }), w(V(Z), "onTouchEnd", function(ne) {
              return X = M.touch, Z.handleDragStop(ne);
            }), Z;
          }
          return pe(ye, [{ key: "componentDidMount", value: function() {
            this.mounted = !0;
            var Z = this.findDOMNode();
            Z && (0, c.addEvent)(Z, M.touch.start, this.onTouchStart, { passive: !1 });
          } }, { key: "componentWillUnmount", value: function() {
            this.mounted = !1;
            var Z = this.findDOMNode();
            if (Z) {
              var De = Z.ownerDocument;
              (0, c.removeEvent)(De, M.mouse.move, this.handleDrag), (0, c.removeEvent)(De, M.touch.move, this.handleDrag), (0, c.removeEvent)(De, M.mouse.stop, this.handleDragStop), (0, c.removeEvent)(De, M.touch.stop, this.handleDragStop), (0, c.removeEvent)(Z, M.touch.start, this.onTouchStart, { passive: !1 }), this.props.enableUserSelectHack && (0, c.removeUserSelectStyles)(De);
            }
          } }, { key: "findDOMNode", value: function() {
            return this.props.nodeRef ? this.props.nodeRef.current : l.default.findDOMNode(this);
          } }, { key: "render", value: function() {
            return o.cloneElement(o.Children.only(this.props.children), { onMouseDown: this.onMouseDown, onMouseUp: this.onMouseUp, onTouchEnd: this.onTouchEnd });
          } }]), ye;
        })(o.Component);
        n.default = ce, w(ce, "displayName", "DraggableCore"), w(ce, "propTypes", { allowAnyClick: a.default.bool, disabled: a.default.bool, enableUserSelectHack: a.default.bool, offsetParent: function(q, ee) {
          if (q[ee] && q[ee].nodeType !== 1) throw Error("Draggable's offsetParent must be a DOM Node.");
        }, grid: a.default.arrayOf(a.default.number), handle: a.default.string, cancel: a.default.string, nodeRef: a.default.object, onStart: a.default.func, onDrag: a.default.func, onStop: a.default.func, onMouseDown: a.default.func, scale: a.default.number, className: u.dontSetMe, style: u.dontSetMe, transform: u.dontSetMe }), w(ce, "defaultProps", { allowAnyClick: !1, cancel: null, disabled: !1, enableUserSelectHack: !0, offsetParent: null, handle: null, grid: null, transform: null, onStart: function() {
        }, onDrag: function() {
        }, onStop: function() {
        }, onMouseDown: function() {
        }, scale: 1 });
      })), _h = G(((n) => {
        Object.defineProperty(n, "__esModule", { value: !0 }), Object.defineProperty(n, "DraggableCore", { enumerable: !0, get: function() {
          return b.default;
        } }), n.default = void 0;
        var o = N(pt()), a = E(lo()), l = E(It()), c = E(kh()), d = Hi(), u = nc(), y = mo(), b = E(Eh()), g = E(rc());
        function E(W) {
          return W && W.__esModule ? W : { default: W };
        }
        function x() {
          if (typeof WeakMap != "function") return null;
          var W = /* @__PURE__ */ new WeakMap();
          return x = function() {
            return W;
          }, W;
        }
        function N(W) {
          if (W && W.__esModule) return W;
          if (W === null || S(W) !== "object" && typeof W != "function") return { default: W };
          var re = x();
          if (re && re.has(W)) return re.get(W);
          var ne = {}, P = Object.defineProperty && Object.getOwnPropertyDescriptor;
          for (var B in W) if (Object.prototype.hasOwnProperty.call(W, B)) {
            var C = P ? Object.getOwnPropertyDescriptor(W, B) : null;
            C && (C.get || C.set) ? Object.defineProperty(ne, B, C) : ne[B] = W[B];
          }
          return ne.default = W, re && re.set(W, ne), ne;
        }
        function S(W) {
          "@babel/helpers - typeof";
          return S = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(re) {
            return typeof re;
          } : function(re) {
            return re && typeof Symbol == "function" && re.constructor === Symbol && re !== Symbol.prototype ? "symbol" : typeof re;
          }, S(W);
        }
        function O() {
          return O = Object.assign || function(W) {
            for (var re = 1; re < arguments.length; re++) {
              var ne = arguments[re];
              for (var P in ne) Object.prototype.hasOwnProperty.call(ne, P) && (W[P] = ne[P]);
            }
            return W;
          }, O.apply(this, arguments);
        }
        function R(W, re) {
          if (W == null) return {};
          var ne = Y(W, re), P, B;
          if (Object.getOwnPropertySymbols) {
            var C = Object.getOwnPropertySymbols(W);
            for (B = 0; B < C.length; B++) P = C[B], !(re.indexOf(P) >= 0) && Object.prototype.propertyIsEnumerable.call(W, P) && (ne[P] = W[P]);
          }
          return ne;
        }
        function Y(W, re) {
          if (W == null) return {};
          var ne = {}, P = Object.keys(W), B, C;
          for (C = 0; C < P.length; C++) B = P[C], !(re.indexOf(B) >= 0) && (ne[B] = W[B]);
          return ne;
        }
        function se(W, re) {
          return J(W) || be(W, re) || ae(W, re) || ie();
        }
        function ie() {
          throw TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
        }
        function ae(W, re) {
          if (W) {
            if (typeof W == "string") return pe(W, re);
            var ne = Object.prototype.toString.call(W).slice(8, -1);
            if (ne === "Object" && W.constructor && (ne = W.constructor.name), ne === "Map" || ne === "Set") return Array.from(W);
            if (ne === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(ne)) return pe(W, re);
          }
        }
        function pe(W, re) {
          (re == null || re > W.length) && (re = W.length);
          for (var ne = 0, P = Array(re); ne < re; ne++) P[ne] = W[ne];
          return P;
        }
        function be(W, re) {
          if (!(typeof Symbol > "u" || !(Symbol.iterator in Object(W)))) {
            var ne = [], P = !0, B = !1, C = void 0;
            try {
              for (var U = W[Symbol.iterator](), oe; !(P = (oe = U.next()).done) && (ne.push(oe.value), !(re && ne.length === re)); P = !0) ;
            } catch (me) {
              B = !0, C = me;
            } finally {
              try {
                !P && U.return != null && U.return();
              } finally {
                if (B) throw C;
              }
            }
            return ne;
          }
        }
        function J(W) {
          if (Array.isArray(W)) return W;
        }
        function we(W, re) {
          var ne = Object.keys(W);
          if (Object.getOwnPropertySymbols) {
            var P = Object.getOwnPropertySymbols(W);
            re && (P = P.filter(function(B) {
              return Object.getOwnPropertyDescriptor(W, B).enumerable;
            })), ne.push.apply(ne, P);
          }
          return ne;
        }
        function z(W) {
          for (var re = 1; re < arguments.length; re++) {
            var ne = arguments[re] == null ? {} : arguments[re];
            re % 2 ? we(Object(ne), !0).forEach(function(P) {
              Z(W, P, ne[P]);
            }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(W, Object.getOwnPropertyDescriptors(ne)) : we(Object(ne)).forEach(function(P) {
              Object.defineProperty(W, P, Object.getOwnPropertyDescriptor(ne, P));
            });
          }
          return W;
        }
        function V(W, re) {
          if (!(W instanceof re)) throw TypeError("Cannot call a class as a function");
        }
        function te(W, re) {
          for (var ne = 0; ne < re.length; ne++) {
            var P = re[ne];
            P.enumerable = P.enumerable || !1, P.configurable = !0, "value" in P && (P.writable = !0), Object.defineProperty(W, P.key, P);
          }
        }
        function D(W, re, ne) {
          return re && te(W.prototype, re), ne && te(W, ne), W;
        }
        function w(W, re) {
          if (typeof re != "function" && re !== null) throw TypeError("Super expression must either be null or a function");
          W.prototype = Object.create(re && re.prototype, { constructor: { value: W, writable: !0, configurable: !0 } }), re && M(W, re);
        }
        function M(W, re) {
          return M = Object.setPrototypeOf || function(ne, P) {
            return ne.__proto__ = P, ne;
          }, M(W, re);
        }
        function X(W) {
          var re = ee();
          return function() {
            var ne = ye(W), P;
            if (re) {
              var B = ye(this).constructor;
              P = Reflect.construct(ne, arguments, B);
            } else P = ne.apply(this, arguments);
            return ce(this, P);
          };
        }
        function ce(W, re) {
          return re && (S(re) === "object" || typeof re == "function") ? re : q(W);
        }
        function q(W) {
          if (W === void 0) throw ReferenceError("this hasn't been initialised - super() hasn't been called");
          return W;
        }
        function ee() {
          if (typeof Reflect > "u" || !Reflect.construct || Reflect.construct.sham) return !1;
          if (typeof Proxy == "function") return !0;
          try {
            return Date.prototype.toString.call(Reflect.construct(Date, [], function() {
            })), !0;
          } catch {
            return !1;
          }
        }
        function ye(W) {
          return ye = Object.setPrototypeOf ? Object.getPrototypeOf : function(re) {
            return re.__proto__ || Object.getPrototypeOf(re);
          }, ye(W);
        }
        function Z(W, re, ne) {
          return re in W ? Object.defineProperty(W, re, { value: ne, enumerable: !0, configurable: !0, writable: !0 }) : W[re] = ne, W;
        }
        var De = (function(W) {
          w(ne, W);
          var re = X(ne);
          D(ne, null, [{ key: "getDerivedStateFromProps", value: function(P, B) {
            var C = P.position, U = B.prevPropsPosition;
            return C && (!U || C.x !== U.x || C.y !== U.y) ? ((0, g.default)("Draggable: getDerivedStateFromProps %j", { position: C, prevPropsPosition: U }), { x: C.x, y: C.y, prevPropsPosition: z({}, C) }) : null;
          } }]);
          function ne(P) {
            var B;
            return V(this, ne), B = re.call(this, P), Z(q(B), "onDragStart", function(C, U) {
              if ((0, g.default)("Draggable: onDragStart: %j", U), B.props.onStart(C, (0, u.createDraggableData)(q(B), U)) === !1) return !1;
              B.setState({ dragging: !0, dragged: !0 });
            }), Z(q(B), "onDrag", function(C, U) {
              if (!B.state.dragging) return !1;
              (0, g.default)("Draggable: onDrag: %j", U);
              var oe = (0, u.createDraggableData)(q(B), U), me = { x: oe.x, y: oe.y };
              if (B.props.bounds) {
                var Ee = me.x, Ie = me.y;
                me.x += B.state.slackX, me.y += B.state.slackY;
                var Oe = se((0, u.getBoundPosition)(q(B), me.x, me.y), 2), Te = Oe[0], Fe = Oe[1];
                me.x = Te, me.y = Fe, me.slackX = B.state.slackX + (Ee - me.x), me.slackY = B.state.slackY + (Ie - me.y), oe.x = me.x, oe.y = me.y, oe.deltaX = me.x - B.state.x, oe.deltaY = me.y - B.state.y;
              }
              if (B.props.onDrag(C, oe) === !1) return !1;
              B.setState(me);
            }), Z(q(B), "onDragStop", function(C, U) {
              if (!B.state.dragging || B.props.onStop(C, (0, u.createDraggableData)(q(B), U)) === !1) return !1;
              (0, g.default)("Draggable: onDragStop: %j", U);
              var oe = { dragging: !1, slackX: 0, slackY: 0 };
              if (B.props.position) {
                var me = B.props.position, Ee = me.x, Ie = me.y;
                oe.x = Ee, oe.y = Ie;
              }
              B.setState(oe);
            }), B.state = { dragging: !1, dragged: !1, x: P.position ? P.position.x : P.defaultPosition.x, y: P.position ? P.position.y : P.defaultPosition.y, prevPropsPosition: z({}, P.position), slackX: 0, slackY: 0, isElementSVG: !1 }, P.position && !(P.onDrag || P.onStop) && console.warn("A `position` was applied to this <Draggable>, without drag handlers. This will make this component effectively undraggable. Please attach `onDrag` or `onStop` handlers so you can adjust the `position` of this element."), B;
          }
          return D(ne, [{ key: "componentDidMount", value: function() {
            window.SVGElement !== void 0 && this.findDOMNode() instanceof window.SVGElement && this.setState({ isElementSVG: !0 });
          } }, { key: "componentWillUnmount", value: function() {
            this.setState({ dragging: !1 });
          } }, { key: "findDOMNode", value: function() {
            return this.props.nodeRef ? this.props.nodeRef.current : l.default.findDOMNode(this);
          } }, { key: "render", value: function() {
            var P, B = this.props;
            B.axis, B.bounds;
            var C = B.children, U = B.defaultPosition, oe = B.defaultClassName, me = B.defaultClassNameDragging, Ee = B.defaultClassNameDragged, Ie = B.position, Oe = B.positionOffset;
            B.scale;
            var Te = R(B, ["axis", "bounds", "children", "defaultPosition", "defaultClassName", "defaultClassNameDragging", "defaultClassNameDragged", "position", "positionOffset", "scale"]), Fe = {}, Qe = null, Ye = !Ie || this.state.dragging, nn = Ie || U, xo = { x: (0, u.canDragX)(this) && Ye ? this.state.x : nn.x, y: (0, u.canDragY)(this) && Ye ? this.state.y : nn.y };
            this.state.isElementSVG ? Qe = (0, d.createSVGTransform)(xo, Oe) : Fe = (0, d.createCSSTransform)(xo, Oe);
            var lt = (0, c.default)(C.props.className || "", oe, (P = {}, Z(P, me, this.state.dragging), Z(P, Ee, this.state.dragged), P));
            return o.createElement(b.default, O({}, Te, { onStart: this.onDragStart, onDrag: this.onDrag, onStop: this.onDragStop }), o.cloneElement(o.Children.only(C), { className: lt, style: z(z({}, C.props.style), Fe), transform: Qe }));
          } }]), ne;
        })(o.Component);
        n.default = De, Z(De, "displayName", "Draggable"), Z(De, "propTypes", z(z({}, b.default.propTypes), {}, { axis: a.default.oneOf(["both", "x", "y", "none"]), bounds: a.default.oneOfType([a.default.shape({ left: a.default.number, right: a.default.number, top: a.default.number, bottom: a.default.number }), a.default.string, a.default.oneOf([!1])]), defaultClassName: a.default.string, defaultClassNameDragging: a.default.string, defaultClassNameDragged: a.default.string, defaultPosition: a.default.shape({ x: a.default.number, y: a.default.number }), positionOffset: a.default.shape({ x: a.default.oneOfType([a.default.number, a.default.string]), y: a.default.oneOfType([a.default.number, a.default.string]) }), position: a.default.shape({ x: a.default.number, y: a.default.number }), className: y.dontSetMe, style: y.dontSetMe, transform: y.dontSetMe })), Z(De, "defaultProps", z(z({}, b.default.defaultProps), {}, { axis: "both", bounds: !1, defaultClassName: "react-draggable", defaultClassNameDragging: "react-draggable-dragging", defaultClassNameDragged: "react-draggable-dragged", defaultPosition: { x: 0, y: 0 }, position: null, scale: 1 }));
      })), xh = Ce(G(((n, o) => {
        var a = _h(), l = a.default, c = a.DraggableCore;
        o.exports = l, o.exports.default = l, o.exports.DraggableCore = c;
      }))()), Ch = /* @__PURE__ */ (function() {
        var n = function(o, a) {
          return n = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(l, c) {
            l.__proto__ = c;
          } || function(l, c) {
            for (var d in c) c.hasOwnProperty(d) && (l[d] = c[d]);
          }, n(o, a);
        };
        return function(o, a) {
          n(o, a);
          function l() {
            this.constructor = o;
          }
          o.prototype = a === null ? Object.create(a) : (l.prototype = a.prototype, new l());
        };
      })(), go = function() {
        return go = Object.assign || function(n) {
          for (var o, a = 1, l = arguments.length; a < l; a++) for (var c in o = arguments[a], o) Object.prototype.hasOwnProperty.call(o, c) && (n[c] = o[c]);
          return n;
        }, go.apply(this, arguments);
      }, Sh = { top: { width: "100%", height: "10px", top: "-5px", left: "0px", cursor: "row-resize" }, right: { width: "10px", height: "100%", top: "0px", right: "-5px", cursor: "col-resize" }, bottom: { width: "100%", height: "10px", bottom: "-5px", left: "0px", cursor: "row-resize" }, left: { width: "10px", height: "100%", top: "0px", left: "-5px", cursor: "col-resize" }, topRight: { width: "20px", height: "20px", position: "absolute", right: "-10px", top: "-10px", cursor: "ne-resize" }, bottomRight: { width: "20px", height: "20px", position: "absolute", right: "-10px", bottom: "-10px", cursor: "se-resize" }, bottomLeft: { width: "20px", height: "20px", position: "absolute", left: "-10px", bottom: "-10px", cursor: "sw-resize" }, topLeft: { width: "20px", height: "20px", position: "absolute", left: "-10px", top: "-10px", cursor: "nw-resize" } }, Th = (function(n) {
        Ch(o, n);
        function o() {
          var a = n !== null && n.apply(this, arguments) || this;
          return a.onMouseDown = function(l) {
            a.props.onResizeStart(l, a.props.direction);
          }, a.onTouchStart = function(l) {
            a.props.onResizeStart(l, a.props.direction);
          }, a;
        }
        return o.prototype.render = function() {
          return v.createElement("div", { className: this.props.className || "", style: go(go({ position: "absolute", userSelect: "none" }, Sh[this.props.direction]), this.props.replaceStyles || {}), onMouseDown: this.onMouseDown, onTouchStart: this.onTouchStart }, this.props.children);
        }, o;
      })(v.PureComponent), Sn = Ce(G(((n, o) => {
        function a(S, O) {
          var R = O && O.cache ? O.cache : N, Y = O && O.serializer ? O.serializer : E;
          return (O && O.strategy ? O.strategy : y)(S, { cache: R, serializer: Y });
        }
        function l(S) {
          return S == null || typeof S == "number" || typeof S == "boolean";
        }
        function c(S, O, R, Y) {
          var se = l(Y) ? Y : R(Y), ie = O.get(se);
          return ie === void 0 && (ie = S.call(this, Y), O.set(se, ie)), ie;
        }
        function d(S, O, R) {
          var Y = Array.prototype.slice.call(arguments, 3), se = R(Y), ie = O.get(se);
          return ie === void 0 && (ie = S.apply(this, Y), O.set(se, ie)), ie;
        }
        function u(S, O, R, Y, se) {
          return R.bind(O, S, Y, se);
        }
        function y(S, O) {
          var R = S.length === 1 ? c : d;
          return u(S, this, R, O.cache.create(), O.serializer);
        }
        function b(S, O) {
          var R = d;
          return u(S, this, R, O.cache.create(), O.serializer);
        }
        function g(S, O) {
          var R = c;
          return u(S, this, R, O.cache.create(), O.serializer);
        }
        function E() {
          return JSON.stringify(arguments);
        }
        function x() {
          this.cache = /* @__PURE__ */ Object.create(null);
        }
        x.prototype.has = function(S) {
          return S in this.cache;
        }, x.prototype.get = function(S) {
          return this.cache[S];
        }, x.prototype.set = function(S, O) {
          this.cache[S] = O;
        };
        var N = { create: function() {
          return new x();
        } };
        o.exports = a, o.exports.strategies = { variadic: b, monadic: g };
      }))()), Oh = /* @__PURE__ */ (function() {
        var n = function(o, a) {
          return n = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(l, c) {
            l.__proto__ = c;
          } || function(l, c) {
            for (var d in c) c.hasOwnProperty(d) && (l[d] = c[d]);
          }, n(o, a);
        };
        return function(o, a) {
          n(o, a);
          function l() {
            this.constructor = o;
          }
          o.prototype = a === null ? Object.create(a) : (l.prototype = a.prototype, new l());
        };
      })(), Rt = function() {
        return Rt = Object.assign || function(n) {
          for (var o, a = 1, l = arguments.length; a < l; a++) for (var c in o = arguments[a], o) Object.prototype.hasOwnProperty.call(o, c) && (n[c] = o[c]);
          return n;
        }, Rt.apply(this, arguments);
      }, Nh = { width: "auto", height: "auto" }, yo = (0, Sn.default)(function(n, o, a) {
        return Math.max(Math.min(n, a), o);
      }), oc = (0, Sn.default)(function(n, o) {
        return Math.round(n / o) * o;
      }), Kn = (0, Sn.default)(function(n, o) {
        return new RegExp(n, "i").test(o);
      }), bo = function(n) {
        return !!(n.touches && n.touches.length);
      }, Ph = function(n) {
        return !!((n.clientX || n.clientX === 0) && (n.clientY || n.clientY === 0));
      }, ic = (0, Sn.default)(function(n, o, a) {
        a === void 0 && (a = 0);
        var l = o.reduce(function(d, u, y) {
          return Math.abs(u - n) < Math.abs(o[d] - n) ? y : d;
        }, 0), c = Math.abs(o[l] - n);
        return a === 0 || c < a ? o[l] : n;
      }), et = (0, Sn.default)(function(n, o) {
        return n.substr(n.length - o.length, o.length) === o;
      }), Bi = (0, Sn.default)(function(n) {
        return n = n.toString(), n === "auto" || et(n, "px") || et(n, "%") || et(n, "vh") || et(n, "vw") || et(n, "vmax") || et(n, "vmin") ? n : n + "px";
      }), vo = function(n, o, a, l) {
        if (n && typeof n == "string") {
          if (et(n, "px")) return Number(n.replace("px", ""));
          if (et(n, "%")) {
            var c = Number(n.replace("%", "")) / 100;
            return o * c;
          }
          if (et(n, "vw")) {
            var c = Number(n.replace("vw", "")) / 100;
            return a * c;
          }
          if (et(n, "vh")) {
            var c = Number(n.replace("vh", "")) / 100;
            return l * c;
          }
        }
        return n;
      }, Dh = (0, Sn.default)(function(n, o, a, l, c, d, u) {
        return l = vo(l, n.width, o, a), c = vo(c, n.height, o, a), d = vo(d, n.width, o, a), u = vo(u, n.height, o, a), { maxWidth: l === void 0 ? void 0 : Number(l), maxHeight: c === void 0 ? void 0 : Number(c), minWidth: d === void 0 ? void 0 : Number(d), minHeight: u === void 0 ? void 0 : Number(u) };
      }), Ih = "as.style.className.grid.snap.bounds.boundsByDirection.size.defaultSize.minWidth.minHeight.maxWidth.maxHeight.lockAspectRatio.lockAspectRatioExtraWidth.lockAspectRatioExtraHeight.enable.handleStyles.handleClasses.handleWrapperStyle.handleWrapperClass.children.onResizeStart.onResize.onResizeStop.handleComponent.scale.resizeRatio.snapGap".split("."), ac = "__resizable_base__", Rh = (function(n) {
        Oh(o, n);
        function o(a) {
          var l = n.call(this, a) || this;
          return l.ratio = 1, l.resizable = null, l.parentLeft = 0, l.parentTop = 0, l.resizableLeft = 0, l.resizableRight = 0, l.resizableTop = 0, l.resizableBottom = 0, l.targetLeft = 0, l.targetTop = 0, l.appendBase = function() {
            if (!l.resizable || !l.window) return null;
            var c = l.parentNode;
            if (!c) return null;
            var d = l.window.document.createElement("div");
            return d.style.width = "100%", d.style.height = "100%", d.style.position = "absolute", d.style.transform = "scale(0, 0)", d.style.left = "0", d.style.flex = "0", d.classList ? d.classList.add(ac) : d.className += ac, c.appendChild(d), d;
          }, l.removeBase = function(c) {
            var d = l.parentNode;
            d && d.removeChild(c);
          }, l.ref = function(c) {
            c && (l.resizable = c);
          }, l.state = { isResizing: !1, width: (l.propsSize && l.propsSize.width) === void 0 ? "auto" : l.propsSize && l.propsSize.width, height: (l.propsSize && l.propsSize.height) === void 0 ? "auto" : l.propsSize && l.propsSize.height, direction: "right", original: { x: 0, y: 0, width: 0, height: 0 }, backgroundStyle: { height: "100%", width: "100%", backgroundColor: "rgba(0,0,0,0)", cursor: "auto", opacity: 0, position: "fixed", zIndex: 9999, top: "0", left: "0", bottom: "0", right: "0" }, flexBasis: void 0 }, l.onResizeStart = l.onResizeStart.bind(l), l.onMouseMove = l.onMouseMove.bind(l), l.onMouseUp = l.onMouseUp.bind(l), l;
        }
        return Object.defineProperty(o.prototype, "parentNode", { get: function() {
          return this.resizable ? this.resizable.parentNode : null;
        }, enumerable: !1, configurable: !0 }), Object.defineProperty(o.prototype, "window", { get: function() {
          return !this.resizable || !this.resizable.ownerDocument ? null : this.resizable.ownerDocument.defaultView;
        }, enumerable: !1, configurable: !0 }), Object.defineProperty(o.prototype, "propsSize", { get: function() {
          return this.props.size || this.props.defaultSize || Nh;
        }, enumerable: !1, configurable: !0 }), Object.defineProperty(o.prototype, "size", { get: function() {
          var a = 0, l = 0;
          if (this.resizable && this.window) {
            var c = this.resizable.offsetWidth, d = this.resizable.offsetHeight, u = this.resizable.style.position;
            u !== "relative" && (this.resizable.style.position = "relative"), a = this.resizable.style.width === "auto" ? c : this.resizable.offsetWidth, l = this.resizable.style.height === "auto" ? d : this.resizable.offsetHeight, this.resizable.style.position = u;
          }
          return { width: a, height: l };
        }, enumerable: !1, configurable: !0 }), Object.defineProperty(o.prototype, "sizeStyle", { get: function() {
          var a = this, l = this.props.size, c = function(d) {
            if (a.state[d] === void 0 || a.state[d] === "auto") return "auto";
            if (a.propsSize && a.propsSize[d] && et(a.propsSize[d].toString(), "%")) {
              if (et(a.state[d].toString(), "%")) return a.state[d].toString();
              var u = a.getParentSize();
              return Number(a.state[d].toString().replace("px", "")) / u[d] * 100 + "%";
            }
            return Bi(a.state[d]);
          };
          return { width: l && l.width !== void 0 && !this.state.isResizing ? Bi(l.width) : c("width"), height: l && l.height !== void 0 && !this.state.isResizing ? Bi(l.height) : c("height") };
        }, enumerable: !1, configurable: !0 }), o.prototype.getParentSize = function() {
          if (!this.parentNode) return this.window ? { width: this.window.innerWidth, height: this.window.innerHeight } : { width: 0, height: 0 };
          var a = this.appendBase();
          if (!a) return { width: 0, height: 0 };
          var l = !1, c = this.parentNode.style.flexWrap;
          c !== "wrap" && (l = !0, this.parentNode.style.flexWrap = "wrap"), a.style.position = "relative", a.style.minWidth = "100%";
          var d = { width: a.offsetWidth, height: a.offsetHeight };
          return l && (this.parentNode.style.flexWrap = c), this.removeBase(a), d;
        }, o.prototype.bindEvents = function() {
          this.window && (this.window.addEventListener("mouseup", this.onMouseUp), this.window.addEventListener("mousemove", this.onMouseMove), this.window.addEventListener("mouseleave", this.onMouseUp), this.window.addEventListener("touchmove", this.onMouseMove, { capture: !0, passive: !1 }), this.window.addEventListener("touchend", this.onMouseUp));
        }, o.prototype.unbindEvents = function() {
          this.window && (this.window.removeEventListener("mouseup", this.onMouseUp), this.window.removeEventListener("mousemove", this.onMouseMove), this.window.removeEventListener("mouseleave", this.onMouseUp), this.window.removeEventListener("touchmove", this.onMouseMove, !0), this.window.removeEventListener("touchend", this.onMouseUp));
        }, o.prototype.componentDidMount = function() {
          if (!(!this.resizable || !this.window)) {
            var a = this.window.getComputedStyle(this.resizable);
            this.setState({ width: this.state.width || this.size.width, height: this.state.height || this.size.height, flexBasis: a.flexBasis === "auto" ? void 0 : a.flexBasis });
          }
        }, o.prototype.componentWillUnmount = function() {
          this.window && this.unbindEvents();
        }, o.prototype.createSizeForCssProperty = function(a, l) {
          var c = this.propsSize && this.propsSize[l];
          return this.state[l] === "auto" && this.state.original[l] === a && (c === void 0 || c === "auto") ? "auto" : a;
        }, o.prototype.calculateNewMaxFromBoundary = function(a, l) {
          var c = this.props.boundsByDirection, d = this.state.direction, u = c && Kn("left", d), y = c && Kn("top", d), b, g;
          if (this.props.bounds === "parent") {
            var E = this.parentNode;
            E && (b = u ? this.resizableRight - this.parentLeft : E.offsetWidth + (this.parentLeft - this.resizableLeft), g = y ? this.resizableBottom - this.parentTop : E.offsetHeight + (this.parentTop - this.resizableTop));
          } else this.props.bounds === "window" ? this.window && (b = u ? this.resizableRight : this.window.innerWidth - this.resizableLeft, g = y ? this.resizableBottom : this.window.innerHeight - this.resizableTop) : this.props.bounds && (b = u ? this.resizableRight - this.targetLeft : this.props.bounds.offsetWidth + (this.targetLeft - this.resizableLeft), g = y ? this.resizableBottom - this.targetTop : this.props.bounds.offsetHeight + (this.targetTop - this.resizableTop));
          return b && Number.isFinite(b) && (a = a && a < b ? a : b), g && Number.isFinite(g) && (l = l && l < g ? l : g), { maxWidth: a, maxHeight: l };
        }, o.prototype.calculateNewSizeFromDirection = function(a, l) {
          var c = this.props.scale || 1, d = this.props.resizeRatio || 1, u = this.state, y = u.direction, b = u.original, g = this.props, E = g.lockAspectRatio, x = g.lockAspectRatioExtraHeight, N = g.lockAspectRatioExtraWidth, S = b.width, O = b.height, R = x || 0, Y = N || 0;
          return Kn("right", y) && (S = b.width + (a - b.x) * d / c, E && (O = (S - Y) / this.ratio + R)), Kn("left", y) && (S = b.width - (a - b.x) * d / c, E && (O = (S - Y) / this.ratio + R)), Kn("bottom", y) && (O = b.height + (l - b.y) * d / c, E && (S = (O - R) * this.ratio + Y)), Kn("top", y) && (O = b.height - (l - b.y) * d / c, E && (S = (O - R) * this.ratio + Y)), { newWidth: S, newHeight: O };
        }, o.prototype.calculateNewSizeFromAspectRatio = function(a, l, c, d) {
          var u = this.props, y = u.lockAspectRatio, b = u.lockAspectRatioExtraHeight, g = u.lockAspectRatioExtraWidth, E = d.width === void 0 ? 10 : d.width, x = c.width === void 0 || c.width < 0 ? a : c.width, N = d.height === void 0 ? 10 : d.height, S = c.height === void 0 || c.height < 0 ? l : c.height, O = b || 0, R = g || 0;
          if (y) {
            var Y = (N - O) * this.ratio + R, se = (S - O) * this.ratio + R, ie = (E - R) / this.ratio + O, ae = (x - R) / this.ratio + O, pe = Math.max(E, Y), be = Math.min(x, se), J = Math.max(N, ie), we = Math.min(S, ae);
            a = yo(a, pe, be), l = yo(l, J, we);
          } else a = yo(a, E, x), l = yo(l, N, S);
          return { newWidth: a, newHeight: l };
        }, o.prototype.setBoundingClientRect = function() {
          if (this.props.bounds === "parent") {
            var a = this.parentNode;
            if (a) {
              var l = a.getBoundingClientRect();
              this.parentLeft = l.left, this.parentTop = l.top;
            }
          }
          if (this.props.bounds && typeof this.props.bounds != "string") {
            var c = this.props.bounds.getBoundingClientRect();
            this.targetLeft = c.left, this.targetTop = c.top;
          }
          if (this.resizable) {
            var d = this.resizable.getBoundingClientRect(), u = d.left, y = d.top, b = d.right, g = d.bottom;
            this.resizableLeft = u, this.resizableRight = b, this.resizableTop = y, this.resizableBottom = g;
          }
        }, o.prototype.onResizeStart = function(a, l) {
          if (!(!this.resizable || !this.window)) {
            var c = 0, d = 0;
            if (a.nativeEvent && Ph(a.nativeEvent)) {
              if (c = a.nativeEvent.clientX, d = a.nativeEvent.clientY, a.nativeEvent.which === 3) return;
            } else a.nativeEvent && bo(a.nativeEvent) && (c = a.nativeEvent.touches[0].clientX, d = a.nativeEvent.touches[0].clientY);
            if (!(this.props.onResizeStart && this.resizable && this.props.onResizeStart(a, l, this.resizable) === !1)) {
              this.props.size && (this.props.size.height !== void 0 && this.props.size.height !== this.state.height && this.setState({ height: this.props.size.height }), this.props.size.width !== void 0 && this.props.size.width !== this.state.width && this.setState({ width: this.props.size.width })), this.ratio = typeof this.props.lockAspectRatio == "number" ? this.props.lockAspectRatio : this.size.width / this.size.height;
              var u, y = this.window.getComputedStyle(this.resizable);
              if (y.flexBasis !== "auto") {
                var b = this.parentNode;
                if (b) {
                  var g = this.window.getComputedStyle(b).flexDirection;
                  this.flexDir = g.startsWith("row") ? "row" : "column", u = y.flexBasis;
                }
              }
              this.setBoundingClientRect(), this.bindEvents();
              var E = { original: { x: c, y: d, width: this.size.width, height: this.size.height }, isResizing: !0, backgroundStyle: Rt(Rt({}, this.state.backgroundStyle), { cursor: this.window.getComputedStyle(a.target).cursor || "auto" }), direction: l, flexBasis: u };
              this.setState(E);
            }
          }
        }, o.prototype.onMouseMove = function(a) {
          if (!(!this.state.isResizing || !this.resizable || !this.window)) {
            if (this.window.TouchEvent && bo(a)) try {
              a.preventDefault(), a.stopPropagation();
            } catch {
            }
            var l = this.props, c = l.maxWidth, d = l.maxHeight, u = l.minWidth, y = l.minHeight, b = bo(a) ? a.touches[0].clientX : a.clientX, g = bo(a) ? a.touches[0].clientY : a.clientY, E = this.state, x = E.direction, N = E.original, S = E.width, O = E.height, R = this.getParentSize(), Y = Dh(R, this.window.innerWidth, this.window.innerHeight, c, d, u, y);
            c = Y.maxWidth, d = Y.maxHeight, u = Y.minWidth, y = Y.minHeight;
            var se = this.calculateNewSizeFromDirection(b, g), ie = se.newHeight, ae = se.newWidth, pe = this.calculateNewMaxFromBoundary(c, d), be = this.calculateNewSizeFromAspectRatio(ae, ie, { width: pe.maxWidth, height: pe.maxHeight }, { width: u, height: y });
            if (ae = be.newWidth, ie = be.newHeight, this.props.grid) {
              var J = oc(ae, this.props.grid[0]), we = oc(ie, this.props.grid[1]), z = this.props.snapGap || 0;
              ae = z === 0 || Math.abs(J - ae) <= z ? J : ae, ie = z === 0 || Math.abs(we - ie) <= z ? we : ie;
            }
            this.props.snap && this.props.snap.x && (ae = ic(ae, this.props.snap.x, this.props.snapGap)), this.props.snap && this.props.snap.y && (ie = ic(ie, this.props.snap.y, this.props.snapGap));
            var V = { width: ae - N.width, height: ie - N.height };
            if (S && typeof S == "string") {
              if (et(S, "%")) {
                var te = ae / R.width * 100;
                ae = te + "%";
              } else if (et(S, "vw")) {
                var D = ae / this.window.innerWidth * 100;
                ae = D + "vw";
              } else if (et(S, "vh")) {
                var w = ae / this.window.innerHeight * 100;
                ae = w + "vh";
              }
            }
            if (O && typeof O == "string") {
              if (et(O, "%")) {
                var te = ie / R.height * 100;
                ie = te + "%";
              } else if (et(O, "vw")) {
                var D = ie / this.window.innerWidth * 100;
                ie = D + "vw";
              } else if (et(O, "vh")) {
                var w = ie / this.window.innerHeight * 100;
                ie = w + "vh";
              }
            }
            var M = { width: this.createSizeForCssProperty(ae, "width"), height: this.createSizeForCssProperty(ie, "height") };
            this.flexDir === "row" ? M.flexBasis = M.width : this.flexDir === "column" && (M.flexBasis = M.height), this.setState(M), this.props.onResize && this.props.onResize(a, x, this.resizable, V);
          }
        }, o.prototype.onMouseUp = function(a) {
          var l = this.state, c = l.isResizing, d = l.direction, u = l.original;
          if (!(!c || !this.resizable)) {
            var y = { width: this.size.width - u.width, height: this.size.height - u.height };
            this.props.onResizeStop && this.props.onResizeStop(a, d, this.resizable, y), this.props.size && this.setState(this.props.size), this.unbindEvents(), this.setState({ isResizing: !1, backgroundStyle: Rt(Rt({}, this.state.backgroundStyle), { cursor: "auto" }) });
          }
        }, o.prototype.updateSize = function(a) {
          this.setState({ width: a.width, height: a.height });
        }, o.prototype.renderResizer = function() {
          var a = this, l = this.props, c = l.enable, d = l.handleStyles, u = l.handleClasses, y = l.handleWrapperStyle, b = l.handleWrapperClass, g = l.handleComponent;
          if (!c) return null;
          var E = Object.keys(c).map(function(x) {
            return c[x] === !1 ? null : v.createElement(Th, { key: x, direction: x, onResizeStart: a.onResizeStart, replaceStyles: d && d[x], className: u && u[x] }, g && g[x] ? g[x] : null);
          });
          return v.createElement("div", { className: b, style: y }, E);
        }, o.prototype.render = function() {
          var a = this, l = Object.keys(this.props).reduce(function(u, y) {
            return Ih.indexOf(y) === -1 && (u[y] = a.props[y]), u;
          }, {}), c = Rt(Rt(Rt({ position: "relative", userSelect: this.state.isResizing ? "none" : "auto" }, this.props.style), this.sizeStyle), { maxWidth: this.props.maxWidth, maxHeight: this.props.maxHeight, minWidth: this.props.minWidth, minHeight: this.props.minHeight, boxSizing: "border-box", flexShrink: 0 });
          this.state.flexBasis && (c.flexBasis = this.state.flexBasis);
          var d = this.props.as || "div";
          return v.createElement(d, Rt({ ref: this.ref, style: c, className: this.props.className }, l), this.state.isResizing && v.createElement("div", { style: this.state.backgroundStyle }), this.props.children, this.renderResizer());
        }, o.defaultProps = { as: "div", onResizeStart: function() {
        }, onResize: function() {
        }, onResizeStop: function() {
        }, enable: { top: !0, right: !0, bottom: !0, left: !0, topRight: !0, bottomRight: !0, bottomLeft: !0, topLeft: !0 }, style: {}, grid: [1, 1], lockAspectRatio: !1, lockAspectRatioExtraWidth: 0, lockAspectRatioExtraHeight: 0, scale: 1, resizeRatio: 1, snapGap: 0 }, o;
      })(v.PureComponent), Wi = function(n, o) {
        return Wi = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(a, l) {
          a.__proto__ = l;
        } || function(a, l) {
          for (var c in l) l.hasOwnProperty(c) && (a[c] = l[c]);
        }, Wi(n, o);
      };
      function Mh(n, o) {
        Wi(n, o);
        function a() {
          this.constructor = n;
        }
        n.prototype = o === null ? Object.create(o) : (a.prototype = o.prototype, new a());
      }
      var Nt = function() {
        return Nt = Object.assign || function(n) {
          for (var o, a = 1, l = arguments.length; a < l; a++) for (var c in o = arguments[a], o) Object.prototype.hasOwnProperty.call(o, c) && (n[c] = o[c]);
          return n;
        }, Nt.apply(this, arguments);
      };
      function Ah(n, o) {
        var a = {};
        for (var l in n) Object.prototype.hasOwnProperty.call(n, l) && o.indexOf(l) < 0 && (a[l] = n[l]);
        if (n != null && typeof Object.getOwnPropertySymbols == "function") for (var c = 0, l = Object.getOwnPropertySymbols(n); c < l.length; c++) o.indexOf(l[c]) < 0 && Object.prototype.propertyIsEnumerable.call(n, l[c]) && (a[l[c]] = n[l[c]]);
        return a;
      }
      var zh = xh.default, jh = { width: "auto", height: "auto", display: "inline-block", position: "absolute", top: 0, left: 0 }, Lh = function(n) {
        return { bottom: n, bottomLeft: n, bottomRight: n, left: n, right: n, top: n, topLeft: n, topRight: n };
      }, sc = (function(n) {
        Mh(o, n);
        function o(a) {
          var l = n.call(this, a) || this;
          return l.resizing = !1, l.resizingPosition = { x: 0, y: 0 }, l.offsetFromParent = { left: 0, top: 0 }, l.resizableElement = { current: null }, l.refDraggable = function(c) {
            c && (l.draggable = c);
          }, l.refResizable = function(c) {
            c && (l.resizable = c, l.resizableElement.current = c.resizable);
          }, l.state = { original: { x: 0, y: 0 }, bounds: { top: 0, right: 0, bottom: 0, left: 0 }, maxWidth: a.maxWidth, maxHeight: a.maxHeight }, l.onResizeStart = l.onResizeStart.bind(l), l.onResize = l.onResize.bind(l), l.onResizeStop = l.onResizeStop.bind(l), l.onDragStart = l.onDragStart.bind(l), l.onDrag = l.onDrag.bind(l), l.onDragStop = l.onDragStop.bind(l), l.getMaxSizesFromProps = l.getMaxSizesFromProps.bind(l), l;
        }
        return o.prototype.componentDidMount = function() {
          this.updateOffsetFromParent();
          var a = this.offsetFromParent, l = a.left, c = a.top, d = this.getDraggablePosition(), u = d.x, y = d.y;
          this.draggable.setState({ x: u - l, y: y - c }), this.forceUpdate();
        }, o.prototype.getDraggablePosition = function() {
          var a = this.draggable.state;
          return { x: a.x, y: a.y };
        }, o.prototype.getParent = function() {
          return this.resizable && this.resizable.parentNode;
        }, o.prototype.getParentSize = function() {
          return this.resizable.getParentSize();
        }, o.prototype.getMaxSizesFromProps = function() {
          return { maxWidth: this.props.maxWidth === void 0 ? 2 ** 53 - 1 : this.props.maxWidth, maxHeight: this.props.maxHeight === void 0 ? 2 ** 53 - 1 : this.props.maxHeight };
        }, o.prototype.getSelfElement = function() {
          return this.resizable && this.resizable.resizable;
        }, o.prototype.getOffsetHeight = function(a) {
          var l = this.props.scale;
          switch (this.props.bounds) {
            case "window":
              return window.innerHeight / l;
            case "body":
              return document.body.offsetHeight / l;
            default:
              return a.offsetHeight;
          }
        }, o.prototype.getOffsetWidth = function(a) {
          var l = this.props.scale;
          switch (this.props.bounds) {
            case "window":
              return window.innerWidth / l;
            case "body":
              return document.body.offsetWidth / l;
            default:
              return a.offsetWidth;
          }
        }, o.prototype.onDragStart = function(a, l) {
          if (this.props.onDragStart && this.props.onDragStart(a, l), this.props.bounds) {
            var c = this.getParent(), d = this.props.scale, u;
            if (this.props.bounds === "parent") u = c;
            else if (this.props.bounds === "body") {
              var y = c.getBoundingClientRect(), b = y.left, g = y.top, E = document.body.getBoundingClientRect(), x = -(b - c.offsetLeft * d - E.left) / d, N = -(g - c.offsetTop * d - E.top) / d, S = (document.body.offsetWidth - this.resizable.size.width * d) / d + x, O = (document.body.offsetHeight - this.resizable.size.height * d) / d + N;
              return this.setState({ bounds: { top: N, right: S, bottom: O, left: x } });
            } else if (this.props.bounds === "window") {
              if (!this.resizable) return;
              var R = c.getBoundingClientRect(), Y = R.left, se = R.top, ie = -(Y - c.offsetLeft * d) / d, ae = -(se - c.offsetTop * d) / d, S = (window.innerWidth - this.resizable.size.width * d) / d + ie, O = (window.innerHeight - this.resizable.size.height * d) / d + ae;
              return this.setState({ bounds: { top: ae, right: S, bottom: O, left: ie } });
            } else u = document.querySelector(this.props.bounds);
            if (!(!(u instanceof HTMLElement) || !(c instanceof HTMLElement))) {
              var pe = u.getBoundingClientRect(), be = pe.left, J = pe.top, we = c.getBoundingClientRect(), z = we.left, V = we.top, te = (be - z) / d, D = J - V;
              if (this.resizable) {
                this.updateOffsetFromParent();
                var w = this.offsetFromParent;
                this.setState({ bounds: { top: D - w.top, right: te + (u.offsetWidth - this.resizable.size.width) - w.left / d, bottom: D + (u.offsetHeight - this.resizable.size.height) - w.top, left: te - w.left / d } });
              }
            }
          }
        }, o.prototype.onDrag = function(a, l) {
          if (this.props.onDrag) {
            var c = this.offsetFromParent;
            return this.props.onDrag(a, Nt(Nt({}, l), { x: l.x - c.left, y: l.y - c.top }));
          }
        }, o.prototype.onDragStop = function(a, l) {
          if (this.props.onDragStop) {
            var c = this.offsetFromParent, d = c.left, u = c.top;
            return this.props.onDragStop(a, Nt(Nt({}, l), { x: l.x + d, y: l.y + u }));
          }
        }, o.prototype.onResizeStart = function(a, l, c) {
          a.stopPropagation(), this.resizing = !0;
          var d = this.props.scale, u = this.offsetFromParent, y = this.getDraggablePosition();
          if (this.resizingPosition = { x: y.x + u.left, y: y.y + u.top }, this.setState({ original: y }), this.props.bounds) {
            var b = this.getParent(), g = void 0;
            g = this.props.bounds === "parent" ? b : this.props.bounds === "body" ? document.body : this.props.bounds === "window" ? window : document.querySelector(this.props.bounds);
            var E = this.getSelfElement();
            if (E instanceof Element && (g instanceof HTMLElement || g === window) && b instanceof HTMLElement) {
              var x = this.getMaxSizesFromProps(), N = x.maxWidth, S = x.maxHeight, O = this.getParentSize();
              if (N && typeof N == "string") if (N.endsWith("%")) {
                var R = Number(N.replace("%", "")) / 100;
                N = O.width * R;
              } else N.endsWith("px") && (N = Number(N.replace("px", "")));
              if (S && typeof S == "string") if (S.endsWith("%")) {
                var R = Number(S.replace("%", "")) / 100;
                S = O.width * R;
              } else S.endsWith("px") && (S = Number(S.replace("px", "")));
              var Y = E.getBoundingClientRect(), se = Y.left, ie = Y.top, ae = this.props.bounds === "window" ? { left: 0, top: 0 } : g.getBoundingClientRect(), pe = ae.left, be = ae.top, J = this.getOffsetWidth(g), we = this.getOffsetHeight(g), z = l.toLowerCase().endsWith("left"), V = l.toLowerCase().endsWith("right"), te = l.startsWith("top"), D = l.startsWith("bottom");
              if (z && this.resizable) {
                var w = (se - pe) / d + this.resizable.size.width;
                this.setState({ maxWidth: w > Number(N) ? N : w });
              }
              if (V || this.props.lockAspectRatio && !z) {
                var w = J + (pe - se) / d;
                this.setState({ maxWidth: w > Number(N) ? N : w });
              }
              if (te && this.resizable) {
                var w = (ie - be) / d + this.resizable.size.height;
                this.setState({ maxHeight: w > Number(S) ? S : w });
              }
              if (D || this.props.lockAspectRatio && !te) {
                var w = we + (be - ie) / d;
                this.setState({ maxHeight: w > Number(S) ? S : w });
              }
            }
          } else this.setState({ maxWidth: this.props.maxWidth, maxHeight: this.props.maxHeight });
          this.props.onResizeStart && this.props.onResizeStart(a, l, c);
        }, o.prototype.onResize = function(a, l, c, d) {
          var u = { x: this.state.original.x, y: this.state.original.y }, y = -d.width, b = -d.height;
          ["top", "left", "topLeft", "bottomLeft", "topRight"].indexOf(l) !== -1 && (l === "bottomLeft" ? u.x += y : (l === "topRight" || (u.x += y), u.y += b)), (u.x !== this.draggable.state.x || u.y !== this.draggable.state.y) && this.draggable.setState(u), this.updateOffsetFromParent();
          var g = this.offsetFromParent, E = this.getDraggablePosition().x + g.left, x = this.getDraggablePosition().y + g.top;
          this.resizingPosition = { x: E, y: x }, this.props.onResize && this.props.onResize(a, l, c, d, { x: E, y: x });
        }, o.prototype.onResizeStop = function(a, l, c, d) {
          this.resizing = !1;
          var u = this.getMaxSizesFromProps(), y = u.maxWidth, b = u.maxHeight;
          this.setState({ maxWidth: y, maxHeight: b }), this.props.onResizeStop && this.props.onResizeStop(a, l, c, d, this.resizingPosition);
        }, o.prototype.updateSize = function(a) {
          this.resizable && this.resizable.updateSize({ width: a.width, height: a.height });
        }, o.prototype.updatePosition = function(a) {
          this.draggable.setState(a);
        }, o.prototype.updateOffsetFromParent = function() {
          var a = this.props.scale, l = this.getParent(), c = this.getSelfElement();
          if (!l || c === null) return { top: 0, left: 0 };
          var d = l.getBoundingClientRect(), u = d.left, y = d.top, b = c.getBoundingClientRect(), g = this.getDraggablePosition();
          this.offsetFromParent = { left: b.left - u - g.x * a, top: b.top - y - g.y * a };
        }, o.prototype.render = function() {
          var a = this.props, l = a.disableDragging, c = a.style, d = a.dragHandleClassName, u = a.position, y = a.onMouseDown, b = a.onMouseUp, g = a.dragAxis, E = a.dragGrid, x = a.bounds, N = a.enableUserSelectHack, S = a.cancel, O = a.children;
          a.onResizeStart, a.onResize, a.onResizeStop, a.onDragStart, a.onDrag, a.onDragStop;
          var R = a.resizeHandleStyles, Y = a.resizeHandleClasses, se = a.resizeHandleComponent, ie = a.enableResizing, ae = a.resizeGrid, pe = a.resizeHandleWrapperClass, be = a.resizeHandleWrapperStyle, J = a.scale, we = a.allowAnyClick, z = Ah(a, "disableDragging.style.dragHandleClassName.position.onMouseDown.onMouseUp.dragAxis.dragGrid.bounds.enableUserSelectHack.cancel.children.onResizeStart.onResize.onResizeStop.onDragStart.onDrag.onDragStop.resizeHandleStyles.resizeHandleClasses.resizeHandleComponent.enableResizing.resizeGrid.resizeHandleWrapperClass.resizeHandleWrapperStyle.scale.allowAnyClick".split(".")), V = this.props.default ? Nt({}, this.props.default) : void 0;
          delete z.default;
          var te = l || d ? { cursor: "auto" } : { cursor: "move" }, D = Nt(Nt(Nt({}, jh), te), c), w = this.offsetFromParent, M = w.left, X = w.top, ce;
          u && (ce = { x: u.x - M, y: u.y - X });
          var q = this.resizing ? void 0 : ce, ee = this.resizing ? "both" : g;
          return (0, v.createElement)(zh, { ref: this.refDraggable, handle: d ? "." + d : void 0, defaultPosition: V, onMouseDown: y, onMouseUp: b, onStart: this.onDragStart, onDrag: this.onDrag, onStop: this.onDragStop, axis: ee, disabled: l, grid: E, bounds: x ? this.state.bounds : void 0, position: q, enableUserSelectHack: N, cancel: S, scale: J, allowAnyClick: we, nodeRef: this.resizableElement }, (0, v.createElement)(Rh, Nt({}, z, { ref: this.refResizable, defaultSize: V, size: this.props.size, enable: typeof ie == "boolean" ? Lh(ie) : ie, onResizeStart: this.onResizeStart, onResize: this.onResize, onResizeStop: this.onResizeStop, style: D, minWidth: this.props.minWidth, minHeight: this.props.minHeight, maxWidth: this.resizing ? this.state.maxWidth : this.props.maxWidth, maxHeight: this.resizing ? this.state.maxHeight : this.props.maxHeight, grid: ae, handleWrapperClass: pe, handleWrapperStyle: be, lockAspectRatio: this.props.lockAspectRatio, lockAspectRatioExtraWidth: this.props.lockAspectRatioExtraWidth, lockAspectRatioExtraHeight: this.props.lockAspectRatioExtraHeight, handleStyles: R, handleClasses: Y, handleComponent: se, scale: this.props.scale }), O));
        }, o.defaultProps = { maxWidth: 2 ** 53 - 1, maxHeight: 2 ** 53 - 1, scale: 1, onResizeStart: function() {
        }, onResize: function() {
        }, onResizeStop: function() {
        }, onDragStart: function() {
        }, onDrag: function() {
        }, onDragStop: function() {
        } }, o;
      })(v.PureComponent), Uh = class extends v.Component {
        constructor(n) {
          super(n), this.handleTabClick = this.handleTabClick.bind(this);
        }
        handleTabClick(n) {
          this.setState({ activeTab: n }, () => {
            this.props.onClick(n);
          });
        }
        render() {
          return v.createElement("div", { className: "ck-inspector-horizontal-nav" }, this.props.definitions.map((n) => v.createElement(Vh, { key: n, label: n, isActive: this.props.activeTab === n, onClick: () => this.handleTabClick(n) })));
        }
      }, Vh = class extends v.Component {
        render() {
          return v.createElement("button", { className: ["ck-inspector-horizontal-nav__item", this.props.isActive ? " ck-inspector-horizontal-nav__item_active" : ""].join(" "), key: this.props.label, onClick: this.props.onClick, type: "button" }, this.props.label);
        }
      }, yr = class extends v.Component {
        render() {
          let n = Array.isArray(this.props.children) ? this.props.children : [this.props.children];
          return v.createElement("div", { className: "ck-inspector-navbox" }, n.length > 1 ? v.createElement("div", { className: "ck-inspector-navbox__navigation" }, n[0]) : "", v.createElement("div", { className: "ck-inspector-navbox__content" }, n[n.length - 1]));
        }
      }, br = class extends v.Component {
        constructor(n) {
          super(n), this.handleTabClick = this.handleTabClick.bind(this);
        }
        handleTabClick(n) {
          this.props.onTabChange(n);
        }
        render() {
          let n = Array.isArray(this.props.children) ? this.props.children : [this.props.children];
          return v.createElement(yr, null, [this.props.contentBefore, v.createElement(Uh, { key: "navigation", definitions: n.map((o) => o.props.label), activeTab: this.props.activeTab, onClick: this.handleTabClick }), this.props.contentAfter], n.filter((o) => o.props.label === this.props.activeTab));
        }
      };
      function Fh(n, o) {
        return n === o || Number.isNaN(n) && Number.isNaN(o);
      }
      function lc(n) {
        return Object.getOwnPropertySymbols(n).filter((o) => Object.prototype.propertyIsEnumerable.call(n, o));
      }
      function cc(n) {
        return n == null ? n === void 0 ? "[object Undefined]" : "[object Null]" : Object.prototype.toString.call(n);
      }
      var $h = "[object RegExp]", Hh = "[object String]", Bh = "[object Number]", Wh = "[object Boolean]", qh = "[object Symbol]", Kh = "[object Date]", Qh = "[object Map]", Yh = "[object Set]", Gh = "[object Array]", Xh = "[object Function]", Zh = "[object ArrayBuffer]", qi = "[object Object]", Jh = "[object Error]", em = "[object DataView]", tm = "[object Uint8Array]", nm = "[object Uint8ClampedArray]", rm = "[object Uint16Array]", om = "[object Uint32Array]", im = "[object BigUint64Array]", am = "[object Int8Array]", sm = "[object Int16Array]", lm = "[object Int32Array]", cm = "[object BigInt64Array]", um = "[object Float32Array]", dm = "[object Float64Array]";
      function uc(n) {
        if (!n || typeof n != "object") return !1;
        let o = Object.getPrototypeOf(n);
        return o === null || o === Object.prototype || Object.getPrototypeOf(o) === null ? Object.prototype.toString.call(n) === "[object Object]" : !1;
      }
      function pm(n, o, a) {
        return vr(n, o, void 0, void 0, void 0, void 0, a);
      }
      function vr(n, o, a, l, c, d, u) {
        let y = u(n, o, a, l, c, d);
        if (y !== void 0) return y;
        if (typeof n == typeof o) switch (typeof n) {
          case "bigint":
          case "string":
          case "boolean":
          case "symbol":
          case "undefined":
            return n === o;
          case "number":
            return n === o || Object.is(n, o);
          case "function":
            return n === o;
          case "object":
            return kr(n, o, d, u);
        }
        return kr(n, o, d, u);
      }
      function kr(n, o, a, l) {
        if (Object.is(n, o)) return !0;
        let c = cc(n), d = cc(o);
        if (c === "[object Arguments]" && (c = qi), d === "[object Arguments]" && (d = qi), c !== d) return !1;
        switch (c) {
          case Hh:
            return n.toString() === o.toString();
          case Bh:
            return Fh(n.valueOf(), o.valueOf());
          case Wh:
          case Kh:
          case qh:
            return Object.is(n.valueOf(), o.valueOf());
          case $h:
            return n.source === o.source && n.flags === o.flags;
          case Xh:
            return n === o;
        }
        a ?? (a = /* @__PURE__ */ new Map());
        let u = a.get(n), y = a.get(o);
        if (u != null && y != null) return u === o;
        a.set(n, o), a.set(o, n);
        try {
          switch (c) {
            case Qh:
              if (n.size !== o.size) return !1;
              for (let [b, g] of n.entries()) if (!o.has(b) || !vr(g, o.get(b), b, n, o, a, l)) return !1;
              return !0;
            case Yh: {
              if (n.size !== o.size) return !1;
              let b = Array.from(n.values()), g = Array.from(o.values());
              for (let E = 0; E < b.length; E++) {
                let x = b[E], N = g.findIndex((S) => vr(x, S, void 0, n, o, a, l));
                if (N === -1) return !1;
                g.splice(N, 1);
              }
              return !0;
            }
            case Gh:
            case tm:
            case nm:
            case rm:
            case om:
            case im:
            case am:
            case sm:
            case lm:
            case cm:
            case um:
            case dm:
              if (typeof Buffer < "u" && Buffer.isBuffer(n) !== Buffer.isBuffer(o) || n.length !== o.length) return !1;
              for (let b = 0; b < n.length; b++) if (!vr(n[b], o[b], b, n, o, a, l)) return !1;
              return !0;
            case Zh:
              return n.byteLength === o.byteLength ? kr(new Uint8Array(n), new Uint8Array(o), a, l) : !1;
            case em:
              return n.byteLength !== o.byteLength || n.byteOffset !== o.byteOffset ? !1 : kr(new Uint8Array(n), new Uint8Array(o), a, l);
            case Jh:
              return n.name === o.name && n.message === o.message;
            case qi: {
              if (!(kr(n.constructor, o.constructor, a, l) || uc(n) && uc(o))) return !1;
              let b = [...Object.keys(n), ...lc(n)], g = [...Object.keys(o), ...lc(o)];
              if (b.length !== g.length) return !1;
              for (let E = 0; E < b.length; E++) {
                let x = b[E], N = n[x];
                if (!Object.hasOwn(o, x)) return !1;
                let S = o[x];
                if (!vr(N, S, x, n, o, a, l)) return !1;
              }
              return !0;
            }
            default:
              return !1;
          }
        } finally {
          a.delete(n), a.delete(o);
        }
      }
      function fm() {
      }
      function Qn(n, o) {
        return pm(n, o, fm);
      }
      var Ki = class extends v.Component {
        render() {
          return [v.createElement("label", { htmlFor: this.props.id, key: "label" }, this.props.label, ":"), v.createElement("select", { id: this.props.id, value: this.props.value, onChange: this.props.onChange, key: "select" }, this.props.options.map((n) => v.createElement("option", { value: n, key: n }, n)))];
        }
        shouldComponentUpdate(n) {
          return !Qn(this.props, n);
        }
      }, rt = class extends v.PureComponent {
        render() {
          let n = ["ck-inspector-button", this.props.className || "", this.props.isOn ? "ck-inspector-button_on" : "", this.props.isEnabled === !1 ? "ck-inspector-button_disabled" : ""].filter((o) => o).join(" ");
          return v.createElement("button", { className: n, type: "button", onClick: this.props.isEnabled === !1 ? () => {
          } : this.props.onClick, title: this.props.title || this.props.text }, v.createElement("span", null, this.props.text), this.props.icon);
        }
      }, gt = class extends v.Component {
        render() {
          return v.createElement("div", { className: ["ck-inspector-pane", this.props.splitVertically ? "ck-inspector-pane_vsplit" : "", this.props.isEmpty ? "ck-inspector-pane_empty" : ""].join(" ") }, this.props.children);
        }
      }, tn = v.createContext({ document: typeof document > "u" ? null : document, window: typeof window > "u" ? null : window }), hm = 200, mm = { position: "relative" }, gm = (Xi = class extends v.Component {
        get maxSidePaneWidth() {
          let n = this.context.window;
          return Math.min(n.innerWidth - 400, n.innerWidth * 0.8);
        }
        render() {
          return v.createElement("div", { className: "ck-inspector-side-pane" }, v.createElement(sc, { enableResizing: { left: !0 }, disableDragging: !0, minWidth: hm, maxWidth: this.maxSidePaneWidth, style: mm, position: { x: "100%", y: "100%" }, size: { width: this.props.sidePaneWidth, height: "100%" }, onResizeStop: (n, o, a) => this.props.setSidePaneWidth(a.style.width) }, this.props.children));
        }
      }, wn(Xi, "contextType", tn), Xi), ko = Ke(({ ui: { sidePaneWidth: n } }) => ({ sidePaneWidth: n }), { setSidePaneWidth: cf })(gm), dc = class extends v.Component {
        constructor(n) {
          super(n), this.handleClick = this.handleClick.bind(this);
        }
        handleClick(n) {
          this.globalTreeProps.onClick(n, this.definition.node);
        }
        getChildren() {
          return this.definition.children.map((n, o) => fc(n, o, this.props.globalTreeProps));
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
        shouldComponentUpdate(n) {
          return !Qn(this.props, n);
        }
      }, ym = 500, pc = class extends v.PureComponent {
        render() {
          let n, o = kl(this.props.value, ym);
          return this.props.dontRenderValue || (n = v.createElement("span", { className: "ck-inspector-tree-node__attribute__value" }, o)), v.createElement("span", { className: "ck-inspector-tree-node__attribute" }, v.createElement("span", { className: "ck-inspector-tree-node__attribute__name", title: o }, this.props.name), n);
        }
      }, Yn = class extends v.Component {
        render() {
          let n = this.props.definition, o = { className: ["ck-inspector-tree__position", n.type === "selection" ? "ck-inspector-tree__position_selection" : "", n.type === "marker" ? "ck-inspector-tree__position_marker" : "", n.isEnd ? "ck-inspector-tree__position_end" : ""].join(" "), style: {} };
          return n.presentation && n.presentation.color && (o.style["--ck-inspector-color-tree-position"] = n.presentation.color), n.type === "marker" && (o["data-marker-name"] = n.name), v.createElement("span", o, "​");
        }
        shouldComponentUpdate(n) {
          return !Qn(this.props, n);
        }
      }, bm = class extends dc {
        render() {
          let n = this.definition, o = n.presentation, a = o && o.isEmpty, l = o && o.cssClass, c = this.getChildren(), d = ["ck-inspector-code", "ck-inspector-tree-node", this.isActive ? "ck-inspector-tree-node_active" : "", a ? "ck-inspector-tree-node_empty" : "", l], u = [], y = [];
          n.positionsBefore && n.positionsBefore.forEach((g, E) => {
            u.push(v.createElement(Yn, { key: "position-before:" + E, definition: g }));
          }), n.positionsAfter && n.positionsAfter.forEach((g, E) => {
            y.push(v.createElement(Yn, { key: "position-after:" + E, definition: g }));
          }), n.positions && n.positions.forEach((g, E) => {
            c.push(v.createElement(Yn, { key: "position" + E, definition: g }));
          });
          let b = n.name;
          return this.globalTreeProps.showElementTypes && (b = n.elementType + ":" + b), v.createElement("div", { className: d.join(" "), onClick: this.handleClick }, u, v.createElement("span", { className: "ck-inspector-tree-node__name" }, v.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_open" }), b, this.getAttributes(), a ? "" : v.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_close" })), v.createElement("div", { className: "ck-inspector-tree-node__content" }, c), a ? "" : v.createElement("span", { className: "ck-inspector-tree-node__name ck-inspector-tree-node__name_close" }, v.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_open" }), "/", b, v.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_close" }), y));
        }
        getAttributes() {
          let n = [], o = this.definition;
          for (let [a, l] of o.attributes) n.push(v.createElement(pc, { key: a, name: a, value: l }));
          return n;
        }
        shouldComponentUpdate(n) {
          return !Qn(this.props, n);
        }
      }, vm = class extends dc {
        render() {
          let n = this.definition, o = ["ck-inspector-tree-text", this.isActive ? "ck-inspector-tree-node_active" : ""].join(" "), a = this.definition.text;
          n.positions && n.positions.length && (a = a.split(""), Array.from(n.positions).sort((c, d) => c.offset < d.offset ? -1 : c.offset === d.offset ? 0 : 1).reverse().forEach((c, d) => {
            a.splice(c.offset - n.startOffset, 0, v.createElement(Yn, { key: "position" + d, definition: c }));
          }));
          let l = [a];
          return n.positionsBefore && n.positionsBefore.length && n.positionsBefore.forEach((c, d) => {
            l.unshift(v.createElement(Yn, { key: "position-before:" + d, definition: c }));
          }), n.positionsAfter && n.positionsAfter.length && n.positionsAfter.forEach((c, d) => {
            l.push(v.createElement(Yn, { key: "position-after:" + d, definition: c }));
          }), v.createElement("span", { className: o, onClick: this.handleClick }, v.createElement("span", { className: "ck-inspector-tree-node__content" }, this.globalTreeProps.showCompactText ? "" : this.getAttributes(), this.globalTreeProps.showCompactText ? "" : '"', l, this.globalTreeProps.showCompactText ? "" : '"'));
        }
        getAttributes() {
          let n = [], o = this.definition, a = o.presentation, l = a && a.dontRenderAttributeValue;
          for (let [c, d] of o.attributes) n.push(v.createElement(pc, { key: c, name: c, value: d, dontRenderValue: l }));
          return v.createElement("span", { className: "ck-inspector-tree-text__attributes" }, n);
        }
        shouldComponentUpdate(n) {
          return !Qn(this.props, n);
        }
      }, km = class extends v.Component {
        render() {
          return v.createElement("span", { className: "ck-inspector-tree-comment", dangerouslySetInnerHTML: { __html: this.props.definition.text } });
        }
      };
      function fc(n, o, a) {
        if (n.type === "element") return v.createElement(bm, { key: o, definition: n, globalTreeProps: a });
        if (n.type === "text") return v.createElement(vm, { key: o, definition: n, globalTreeProps: a });
        if (n.type === "comment") return v.createElement(km, { key: o, definition: n });
      }
      var wo = class extends v.Component {
        render() {
          let n;
          return n = this.props.definition ? this.props.definition.map((o, a) => fc(o, a, { onClick: this.props.onClick, showCompactText: this.props.showCompactText, showElementTypes: this.props.showElementTypes, activeNode: this.props.activeNode })) : "Nothing to show.", v.createElement("div", { className: ["ck-inspector-tree", ...this.props.className || [], this.props.textDirection ? "ck-inspector-tree_text-direction_" + this.props.textDirection : "", this.props.showCompactText ? "ck-inspector-tree_compact-text" : ""].join(" ") }, n);
        }
      }, Qi = class extends v.PureComponent {
        render() {
          return [v.createElement("input", { type: "checkbox", className: "ck-inspector-checkbox", id: this.props.id, key: "input", checked: this.props.isChecked, onChange: this.props.onChange }), v.createElement("label", { htmlFor: this.props.id, key: "label" }, this.props.label)];
        }
      }, wm = class extends v.Component {
        constructor(n) {
          super(n), this.handleTreeClick = this.handleTreeClick.bind(this), this.handleRootChange = this.handleRootChange.bind(this);
        }
        handleTreeClick(n, o) {
          n.persist(), n.stopPropagation(), this.props.setModelCurrentNode(o), n.detail === 2 && this.props.setModelActiveTab("Inspect");
        }
        handleRootChange(n) {
          this.props.setModelCurrentRootName(n.target.value);
        }
        render() {
          let n = this.props.editors.get(this.props.currentEditorName);
          return v.createElement(yr, null, [v.createElement("div", { className: "ck-inspector-tree__config", key: "root-cfg" }, v.createElement(Ki, { id: "view-root-select", label: "Root", value: this.props.currentRootName, options: El(n).map((o) => o.rootName), onChange: this.handleRootChange })), v.createElement("span", { className: "ck-inspector-separator", key: "separator" }), v.createElement("div", { className: "ck-inspector-tree__config", key: "text-cfg" }, v.createElement(Qi, { label: "Compact text", id: "model-compact-text", isChecked: this.props.showCompactText, onChange: this.props.toggleModelShowCompactText }), v.createElement(Qi, { label: "Show markers", id: "model-show-markers", isChecked: this.props.showMarkers, onChange: this.props.toggleModelShowMarkers }))], v.createElement(wo, { className: [this.props.showMarkers ? "" : "ck-inspector-model-tree__hide-markers"], definition: this.props.treeDefinition, textDirection: n.locale.contentLanguageDirection, onClick: this.handleTreeClick, showCompactText: this.props.showCompactText, activeNode: this.props.currentNode }));
        }
      }, Em = Ke(({ editors: n, currentEditorName: o, model: { treeDefinition: a, currentRootName: l, currentNode: c, ui: { showMarkers: d, showCompactText: u } } }) => ({ treeDefinition: a, editors: n, currentEditorName: o, currentRootName: l, currentNode: c, showMarkers: d, showCompactText: u }), { toggleModelShowCompactText: sf, setModelCurrentRootName: rf, toggleModelShowMarkers: af, setModelCurrentNode: of, setModelActiveTab: ol })(wm), _m = 2e3, xm = class gp extends v.Component {
        render() {
          let o = this.props.presentation && this.props.presentation.expandCollapsibles, a = [];
          for (let l in this.props.itemDefinitions) {
            let c = this.props.itemDefinitions[l], { subProperties: d, presentation: u = {} } = c, y = d && Object.keys(d).length, b = kl(String(c.value), _m), g = [v.createElement(Cm, { key: `${this.props.name}-${l}-name`, name: l, listUid: this.props.name, canCollapse: y, colorBox: u.colorBox, expandCollapsibles: o, onClick: this.props.onPropertyTitleClick, title: c.title }), v.createElement("dd", { key: `${this.props.name}-${l}-value` }, v.createElement("input", { id: `${this.props.name}-${l}-value-input`, type: "text", value: b, readOnly: !0 }))];
            y && g.push(v.createElement(gp, { name: `${this.props.name}-${l}`, key: `${this.props.name}-${l}`, itemDefinitions: d, presentation: this.props.presentation })), a.push(g);
          }
          return v.createElement("dl", { className: "ck-inspector-property-list ck-inspector-code" }, a);
        }
        shouldComponentUpdate(o) {
          return !Qn(this.props, o);
        }
      }, Cm = class extends v.PureComponent {
        constructor(n) {
          super(n), this.state = { isCollapsed: !this.props.expandCollapsibles }, this.handleCollapsedChange = this.handleCollapsedChange.bind(this);
        }
        handleCollapsedChange() {
          this.setState({ isCollapsed: !this.state.isCollapsed });
        }
        render() {
          let n = ["ck-inspector-property-list__title"], o, a;
          return this.props.canCollapse && (n.push("ck-inspector-property-list__title_collapsible"), n.push("ck-inspector-property-list__title_" + (this.state.isCollapsed ? "collapsed" : "expanded")), o = v.createElement("button", { type: "button", onClick: this.handleCollapsedChange }, "Toggle")), this.props.colorBox && (a = v.createElement("span", { className: "ck-inspector-property-list__title__color-box", style: { background: this.props.colorBox } })), this.props.onClick && n.push("ck-inspector-property-list__title_clickable"), v.createElement("dt", { className: n.join(" ").trim() }, o, a, v.createElement("label", { htmlFor: `${this.props.listUid}-${this.props.name}-value-input`, onClick: this.props.onClick ? () => this.props.onClick(this.props.name) : null, title: this.props.title }, this.props.name), ":");
        }
      }, Tn = class extends v.PureComponent {
        render() {
          let n = [];
          for (let o of this.props.lists) Object.keys(o.itemDefinitions).length && n.push(v.createElement("hr", { key: `${o.name}-separator` }), v.createElement("h3", { key: `${o.name}-header` }, v.createElement("a", { href: o.url, target: "_blank", rel: "noopener noreferrer" }, o.name), o.buttons && o.buttons.map((a, l) => v.createElement(rt, { key: "button" + l, ...a }))), v.createElement(xm, { key: `${o.name}-list`, name: o.name, itemDefinitions: o.itemDefinitions, presentation: o.presentation, onPropertyTitleClick: o.onPropertyTitleClick }));
          return v.createElement("div", { className: "ck-inspector__object-inspector" }, v.createElement("h2", { className: "ck-inspector-code" }, this.props.header), n);
        }
      }, Sm = G(((n) => {
        var o = pt(), a = 60103;
        if (n.Fragment = 60107, typeof Symbol == "function" && Symbol.for) {
          var l = Symbol.for;
          a = l("react.element"), n.Fragment = l("react.fragment");
        }
        var c = o.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, d = Object.prototype.hasOwnProperty, u = { key: !0, ref: !0, __self: !0, __source: !0 };
        function y(b, g, E) {
          var x, N = {}, S = null, O = null;
          for (x in E !== void 0 && (S = "" + E), g.key !== void 0 && (S = "" + g.key), g.ref !== void 0 && (O = g.ref), g) d.call(g, x) && !u.hasOwnProperty(x) && (N[x] = g[x]);
          if (b && b.defaultProps) for (x in g = b.defaultProps, g) N[x] === void 0 && (N[x] = g[x]);
          return { $$typeof: a, type: b, key: S, ref: O, props: N, _owner: c.current };
        }
        n.jsx = y, n.jsxs = y;
      })), Ve = G(((n, o) => {
        o.exports = Sm();
      }))(), Mt = (n) => (0, Ve.jsx)("svg", { viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg", ...n, children: (0, Ve.jsx)("path", { d: "M17 15.75a.75.75 0 0 1 .102 1.493L17 17.25H9a.75.75 0 0 1-.102-1.493L9 15.75h8ZM2.156 2.947l.095.058 7.58 5.401a.75.75 0 0 1 .084 1.152l-.083.069-7.58 5.425a.75.75 0 0 1-.958-1.148l.086-.071 6.724-4.815-6.723-4.792a.75.75 0 0 1-.233-.95l.057-.096a.75.75 0 0 1 .951-.233Z" }) }), Tm = (n) => (0, Ve.jsx)("svg", { fill: "none", xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 19 19", ...n, children: (0, Ve.jsx)("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M6 1a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-2v2h5a1 1 0 0 1 1 1v3h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1v-2.5a.5.5 0 0 0-.5-.5H10v3h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1v-3H4.5a.5.5 0 0 0-.5.5V13h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1v-3a1 1 0 0 1 1-1h5V7H7a1 1 0 0 1-1-1V1Zm1.5 4.5v-4h4v4h-4Zm-5 11v-2h2v2h-2Zm6-2v2h2v-2h-2Zm6 2v-2h2v2h-2Z", fill: "#000" }) }), Om = class extends v.Component {
        constructor(n) {
          super(n), this.handleNodeLogButtonClick = this.handleNodeLogButtonClick.bind(this), this.handleNodeSchemaButtonClick = this.handleNodeSchemaButtonClick.bind(this);
        }
        handleNodeLogButtonClick() {
          Ge.log(this.props.currentNodeDefinition.editorNode);
        }
        handleNodeSchemaButtonClick() {
          let n = this.props.editors.get(this.props.currentEditorName).model.schema.getDefinition(this.props.currentNodeDefinition.editorNode);
          this.props.setActiveTab("Schema"), this.props.setSchemaCurrentDefinitionName(n.name);
        }
        render() {
          let n = this.props.currentNodeDefinition;
          return n ? v.createElement(Tn, { header: [v.createElement("span", { key: "link" }, v.createElement("a", { href: n.url, target: "_blank", rel: "noopener noreferrer" }, v.createElement("b", null, n.type)), ":", n.type === "Text" ? v.createElement("em", null, n.name) : n.name), v.createElement(rt, { key: "log", icon: v.createElement(Mt, null), text: "Log in console", onClick: this.handleNodeLogButtonClick }), v.createElement(rt, { key: "schema", icon: v.createElement(Tm, null), text: "Show in schema", onClick: this.handleNodeSchemaButtonClick })], lists: [{ name: "Attributes", url: n.url, itemDefinitions: n.attributes }, { name: "Properties", url: n.url, itemDefinitions: n.properties }] }) : v.createElement(gt, { isEmpty: "true" }, v.createElement("p", null, "Select a node in the tree to inspect"));
        }
      }, Nm = Ke(({ editors: n, currentEditorName: o, model: { currentNodeDefinition: a } }) => ({ editors: n, currentEditorName: o, currentNodeDefinition: a }), { setActiveTab: fl, setSchemaCurrentDefinitionName: $i })(Om), hc = (n) => (0, Ve.jsx)("svg", { viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg", ...n, children: (0, Ve.jsx)("path", { d: "M9.5 4.5c1.85 0 3.667.561 5.199 1.519C16.363 7.059 17.5 8.4 17.5 9.5s-1.137 2.441-2.801 3.481c-1.532.958-3.35 1.519-5.199 1.519-1.85 0-3.667-.561-5.199-1.519C2.637 11.941 1.5 10.6 1.5 9.5s1.137-2.441 2.801-3.481C5.833 5.06 7.651 4.5 9.5 4.5Zm0 1a4 4 0 1 1-.2.005l.2-.005c-1.655 0-3.29.505-4.669 1.367C3.431 7.742 2.5 8.84 2.5 9.5c0 .66.931 1.758 2.331 2.633C6.21 12.995 7.845 13.5 9.5 13.5c1.655 0 3.29-.505 4.669-1.367 1.4-.875 2.331-1.974 2.331-2.633 0-.66-.931-1.758-2.331-2.633C12.79 6.005 11.155 5.5 9.5 5.5ZM8 6.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" }) }), Gn = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_selection-Selection.html", Pm = (Zi = class extends v.Component {
        constructor(n) {
          super(n), this.handleSelectionLogButtonClick = this.handleSelectionLogButtonClick.bind(this), this.handleScrollToSelectionButtonClick = this.handleScrollToSelectionButtonClick.bind(this);
        }
        handleSelectionLogButtonClick() {
          let n = this.props.editor;
          Ge.log(n.model.document.selection);
        }
        handleScrollToSelectionButtonClick() {
          let n = this.context.document.querySelector(".ck-inspector-tree__position.ck-inspector-tree__position_selection");
          n && n.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        render() {
          let n = this.props.editor, o = this.props.info;
          return v.createElement(Tn, { header: [v.createElement("span", { key: "link" }, v.createElement("a", { href: Gn, target: "_blank", rel: "noopener noreferrer" }, v.createElement("b", null, "Selection"))), v.createElement(rt, { key: "log", icon: v.createElement(Mt, null), text: "Log in console", onClick: this.handleSelectionLogButtonClick }), v.createElement(rt, { key: "scroll", icon: v.createElement(hc, null), text: "Scroll to selection", onClick: this.handleScrollToSelectionButtonClick })], lists: [{ name: "Attributes", url: `${Gn}#function-getAttributes`, itemDefinitions: o.attributes }, { name: "Properties", url: `${Gn}`, itemDefinitions: o.properties }, { name: "Anchor", url: `${Gn}#member-anchor`, buttons: [{ icon: v.createElement(Mt, null), text: "Log in console", onClick: () => Ge.log(n.model.document.selection.anchor) }], itemDefinitions: o.anchor }, { name: "Focus", url: `${Gn}#member-focus`, buttons: [{ icon: v.createElement(Mt, null), text: "Log in console", onClick: () => Ge.log(n.model.document.selection.focus) }], itemDefinitions: o.focus }, { name: "Ranges", url: `${Gn}#function-getRanges`, buttons: [{ icon: v.createElement(Mt, null), text: "Log in console", onClick: () => Ge.log(...n.model.document.selection.getRanges()) }], itemDefinitions: o.ranges, presentation: { expandCollapsibles: !0 } }] });
        }
      }, wn(Zi, "contextType", tn), Zi), Dm = Ke(({ editors: n, currentEditorName: o, model: { ranges: a } }) => {
        let l = n.get(o);
        return { editor: l, currentEditorName: o, info: Im(l, a) };
      }, {})(Pm);
      function Eo({ path: n, stickiness: o, index: a, isAtEnd: l, isAtStart: c, offset: d, textNode: u }) {
        return { path: { value: n }, stickiness: { value: o }, index: { value: a }, isAtEnd: { value: l }, isAtStart: { value: c }, offset: { value: d }, textNode: { value: u } };
      }
      function Im(n, o) {
        let a = n.model.document.selection, l = a.anchor, c = a.focus, d = { properties: { isCollapsed: { value: a.isCollapsed }, isBackward: { value: a.isBackward }, isGravityOverridden: { value: a.isGravityOverridden }, rangeCount: { value: a.rangeCount } }, attributes: {}, anchor: Eo(qn(l)), focus: Eo(qn(c)), ranges: {} };
        for (let [u, y] of a.getAttributes()) d.attributes[u] = { value: y };
        o.forEach((u, y) => {
          d.ranges[y] = { value: "", subProperties: { start: { value: "", subProperties: Xe(Eo(u.start)) }, end: { value: "", subProperties: Xe(Eo(u.end)) } } };
        });
        for (let u in d) u !== "ranges" && (d[u] = Xe(d[u]));
        return d;
      }
      var Rm = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_markercollection-Marker.html", Mm = class extends v.Component {
        render() {
          let n = zm(this.props.markers), o = mc(n), a = this.props.editors.get(this.props.currentEditorName);
          return Object.keys(n).length ? v.createElement(Tn, { header: [v.createElement("span", { key: "link" }, v.createElement("a", { href: Rm, target: "_blank", rel: "noopener noreferrer" }, v.createElement("b", null, "Markers"))), v.createElement(rt, { key: "log", icon: v.createElement(Mt, null), text: "Log in console", onClick: () => Ge.log([...a.model.markers]) })], lists: [{ name: "Markers tree", itemDefinitions: o, presentation: { expandCollapsibles: !0 } }] }) : v.createElement(gt, { isEmpty: "true" }, v.createElement("p", null, "No markers in the document."));
        }
      }, Am = Ke(({ editors: n, currentEditorName: o, model: { markers: a } }) => ({ editors: n, currentEditorName: o, markers: a }), {})(Mm);
      function zm(n) {
        let o = {};
        for (let a of n) {
          let l = a.name.split(":"), c = o;
          for (let d of l) {
            let u = d === l[l.length - 1];
            c = c[d] ? c[d] : c[d] = u ? a : {};
          }
        }
        return o;
      }
      function mc(n) {
        let o = {};
        for (let a in n) {
          let l = n[a];
          if (l.name) {
            let c = Xe(jm(l));
            o[a] = { value: "", presentation: { colorBox: l.presentation.color }, subProperties: c };
          } else {
            let c = Object.keys(l).length;
            o[a] = { value: c + " marker" + (c > 1 ? "s" : ""), subProperties: mc(l) };
          }
        }
        return o;
      }
      function jm({ name: n, start: o, end: a, affectsData: l, managedUsingOperations: c }) {
        return { name: { value: n }, start: { value: o.path }, end: { value: a.path }, affectsData: { value: l }, managedUsingOperations: { value: c } };
      }
      var Lm = class extends v.Component {
        render() {
          return this.props.currentEditorName ? v.createElement(gt, { splitVertically: "true" }, v.createElement(Em, null), v.createElement(ko, null, v.createElement(br, { onTabChange: this.props.setModelActiveTab, activeTab: this.props.activeTab }, v.createElement(Nm, { label: "Inspect" }), v.createElement(Dm, { label: "Selection" }), v.createElement(Am, { label: "Markers" })))) : v.createElement(gt, { isEmpty: "true" }, v.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
        }
      }, Um = Ke(({ currentEditorName: n, model: { ui: { activeTab: o } } }) => ({ currentEditorName: n, activeTab: o }), { setModelActiveTab: ol })(Lm), Vm = class extends v.Component {
        constructor(n) {
          super(n), this.handleTreeClick = this.handleTreeClick.bind(this), this.handleRootChange = this.handleRootChange.bind(this);
        }
        handleTreeClick(n, o) {
          n.persist(), n.stopPropagation(), this.props.setViewCurrentNode(o), n.detail === 2 && this.props.setViewActiveTab("Inspect");
        }
        handleRootChange(n) {
          this.props.setViewCurrentRootName(n.target.value);
        }
        render() {
          let n = this.props.editors.get(this.props.currentEditorName);
          return v.createElement(yr, null, [v.createElement("div", { className: "ck-inspector-tree__config", key: "root-cfg" }, v.createElement(Ki, { id: "view-root-select", label: "Root", value: this.props.currentRootName, options: jl(n).map((o) => o.rootName), onChange: this.handleRootChange })), v.createElement("span", { className: "ck-inspector-separator", key: "separator" }), v.createElement("div", { className: "ck-inspector-tree__config", key: "types-cfg" }, v.createElement(Qi, { label: "Show element types", id: "view-show-types", isChecked: this.props.showElementTypes, onChange: this.props.toggleViewShowElementTypes }))], v.createElement(wo, { definition: this.props.treeDefinition, textDirection: n.locale.contentLanguageDirection, onClick: this.handleTreeClick, showCompactText: "true", showElementTypes: this.props.showElementTypes, activeNode: this.props.currentNode }));
        }
      }, Fm = Ke(({ editors: n, currentEditorName: o, view: { treeDefinition: a, currentRootName: l, currentNode: c, ui: { showElementTypes: d } } }) => ({ treeDefinition: a, editors: n, currentEditorName: o, currentRootName: l, currentNode: c, showElementTypes: d }), { setViewCurrentRootName: zf, toggleViewShowElementTypes: Lf, setViewCurrentNode: jf, setViewActiveTab: zl })(Vm), $m = class extends v.Component {
        constructor(n) {
          super(n), this.handleNodeLogButtonClick = this.handleNodeLogButtonClick.bind(this);
        }
        handleNodeLogButtonClick() {
          Ge.log(this.props.currentNodeDefinition.editorNode);
        }
        render() {
          let n = this.props.currentNodeDefinition;
          return n ? v.createElement(Tn, { header: [v.createElement("span", { key: "link" }, v.createElement("a", { href: n.url, target: "_blank", rel: "noopener noreferrer" }, v.createElement("b", null, n.type), ":"), n.type === "Text" ? v.createElement("em", null, n.name) : n.name), v.createElement(rt, { key: "log", icon: v.createElement(Mt, null), text: "Log in console", onClick: this.handleNodeLogButtonClick })], lists: [{ name: "Attributes", url: n.url, itemDefinitions: n.attributes }, { name: "Properties", url: n.url, itemDefinitions: n.properties }, { name: "Custom Properties", url: `${Ot}_element-Element.html#function-getCustomProperty`, itemDefinitions: n.customProperties }] }) : v.createElement(gt, { isEmpty: "true" }, v.createElement("p", null, "Select a node in the tree to inspect"));
        }
      }, Hm = Ke(({ view: { currentNodeDefinition: n } }) => ({ currentNodeDefinition: n }), {})($m), wr = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_view_selection-Selection.html", Bm = (Ji = class extends v.Component {
        constructor(n) {
          super(n), this.handleSelectionLogButtonClick = this.handleSelectionLogButtonClick.bind(this), this.handleScrollToSelectionButtonClick = this.handleScrollToSelectionButtonClick.bind(this);
        }
        handleSelectionLogButtonClick() {
          let n = this.props.editor;
          Ge.log(n.editing.view.document.selection);
        }
        handleScrollToSelectionButtonClick() {
          let n = this.context.document.querySelector(".ck-inspector-tree__position.ck-inspector-tree__position_selection");
          n && n.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        render() {
          let n = this.props.editor, o = this.props.info;
          return v.createElement(Tn, { header: [v.createElement("span", { key: "link" }, v.createElement("a", { href: wr, target: "_blank", rel: "noopener noreferrer" }, v.createElement("b", null, "Selection"))), v.createElement(rt, { key: "log", icon: v.createElement(Mt, null), text: "Log in console", onClick: this.handleSelectionLogButtonClick }), v.createElement(rt, { key: "scroll", icon: v.createElement(hc, null), text: "Scroll to selection", onClick: this.handleScrollToSelectionButtonClick })], lists: [{ name: "Properties", url: `${wr}`, itemDefinitions: o.properties }, { name: "Anchor", url: `${wr}#member-anchor`, buttons: [{ type: "log", text: "Log in console", onClick: () => Ge.log(n.editing.view.document.selection.anchor) }], itemDefinitions: o.anchor }, { name: "Focus", url: `${wr}#member-focus`, buttons: [{ type: "log", text: "Log in console", onClick: () => Ge.log(n.editing.view.document.selection.focus) }], itemDefinitions: o.focus }, { name: "Ranges", url: `${wr}#function-getRanges`, buttons: [{ type: "log", text: "Log in console", onClick: () => Ge.log(...n.editing.view.document.selection.getRanges()) }], itemDefinitions: o.ranges, presentation: { expandCollapsibles: !0 } }] });
        }
      }, wn(Ji, "contextType", tn), Ji), Wm = Ke(({ editors: n, currentEditorName: o, view: { ranges: a } }) => {
        let l = n.get(o);
        return { editor: l, currentEditorName: o, info: qm(l, a) };
      }, {})(Bm);
      function _o({ offset: n, isAtEnd: o, isAtStart: a, parent: l }) {
        return { offset: { value: n }, isAtEnd: { value: o }, isAtStart: { value: a }, parent: { value: l } };
      }
      function qm(n, o) {
        let a = n.editing.view.document.selection, l = { properties: { isCollapsed: { value: a.isCollapsed }, isBackward: { value: a.isBackward }, isFake: { value: a.isFake }, rangeCount: { value: a.rangeCount } }, anchor: _o(ho(a.anchor)), focus: _o(ho(a.focus)), ranges: {} };
        o.forEach((c, d) => {
          l.ranges[d] = { value: "", subProperties: { start: { value: "", subProperties: Xe(_o(c.start)) }, end: { value: "", subProperties: Xe(_o(c.end)) } } };
        });
        for (let c in l) c !== "ranges" && (l[c] = Xe(l[c]));
        return l;
      }
      var Km = class extends v.Component {
        render() {
          return this.props.currentEditorName ? v.createElement(gt, { splitVertically: "true" }, v.createElement(Fm, null), v.createElement(ko, null, v.createElement(br, { onTabChange: this.props.setViewActiveTab, activeTab: this.props.activeTab }, v.createElement(Hm, { label: "Inspect" }), v.createElement(Wm, { label: "Selection" })))) : v.createElement(gt, { isEmpty: "true" }, v.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
        }
      }, Qm = Ke(({ currentEditorName: n, view: { ui: { activeTab: o } } }) => ({ currentEditorName: n, activeTab: o }), { setViewActiveTab: zl, updateViewState: Ai })(Km), Ym = class extends v.Component {
        constructor(n) {
          super(n), this.handleTreeClick = this.handleTreeClick.bind(this);
        }
        handleTreeClick(n, o) {
          n.persist(), n.stopPropagation(), this.props.setCommandsCurrentCommandName(o);
        }
        render() {
          return v.createElement(yr, null, v.createElement(wo, { definition: this.props.treeDefinition, onClick: this.handleTreeClick, activeNode: this.props.currentCommandName }));
        }
      }, Gm = Ke(({ commands: { treeDefinition: n, currentCommandName: o } }) => ({ treeDefinition: n, currentCommandName: o }), { setCommandsCurrentCommandName: nh })(Ym), Xm = (n) => (0, Ve.jsx)("svg", { viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg", ...n, children: (0, Ve.jsx)("path", { d: "M9.25 1.25a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm0 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM7.344 6.485l4.98 2.765-4.98 3.018V6.485Z" }) }), Zm = class extends v.Component {
        constructor(n) {
          super(n), this.handleCommandLogButtonClick = this.handleCommandLogButtonClick.bind(this), this.handleCommandExecuteButtonClick = this.handleCommandExecuteButtonClick.bind(this);
        }
        handleCommandLogButtonClick() {
          Ge.log(this.props.currentCommandDefinition.command);
        }
        handleCommandExecuteButtonClick() {
          this.props.editors.get(this.props.currentEditorName).execute(this.props.currentCommandName);
        }
        render() {
          let n = this.props.currentCommandDefinition;
          return n ? v.createElement(Tn, { header: [v.createElement("span", { key: "link" }, v.createElement("a", { href: n.url, target: "_blank", rel: "noopener noreferrer" }, v.createElement("b", null, n.type)), ":", this.props.currentCommandName), v.createElement(rt, { key: "exec", icon: v.createElement(Xm, null), text: "Execute command", onClick: this.handleCommandExecuteButtonClick }), v.createElement(rt, { key: "log", icon: v.createElement(Mt, null), text: "Log in console", onClick: this.handleCommandLogButtonClick })], lists: [{ name: "Properties", url: n.url, itemDefinitions: n.properties }] }) : v.createElement(gt, { isEmpty: "true" }, v.createElement("p", null, "Select a command to inspect"));
        }
      }, Jm = Ke(({ editors: n, currentEditorName: o, commands: { currentCommandName: a, currentCommandDefinition: l } }) => ({ editors: n, currentEditorName: o, currentCommandName: a, currentCommandDefinition: l }), {})(Zm), eg = class extends v.Component {
        render() {
          return this.props.currentEditorName ? v.createElement(gt, { splitVertically: "true" }, v.createElement(Gm, null), v.createElement(ko, null, v.createElement(br, { activeTab: "Inspect" }, v.createElement(Jm, { label: "Inspect" })))) : v.createElement(gt, { isEmpty: "true" }, v.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
        }
      }, tg = Ke(({ currentEditorName: n }) => ({ currentEditorName: n }), { updateCommandsState: Fi })(eg), ng = class extends v.Component {
        constructor(n) {
          super(n), this.handleTreeClick = this.handleTreeClick.bind(this);
        }
        handleTreeClick(n, o) {
          n.persist(), n.stopPropagation(), this.props.setSchemaCurrentDefinitionName(o);
        }
        render() {
          return v.createElement(yr, null, v.createElement(wo, { definition: this.props.treeDefinition, onClick: this.handleTreeClick, activeNode: this.props.currentSchemaDefinitionName }));
        }
      }, rg = Ke(({ schema: { treeDefinition: n, currentSchemaDefinitionName: o } }) => ({ treeDefinition: n, currentSchemaDefinitionName: o }), { setSchemaCurrentDefinitionName: $i })(ng), og = class extends v.Component {
        render() {
          let n = this.props.currentSchemaDefinition;
          return n ? v.createElement(Tn, { header: [v.createElement("span", { key: "link" }, v.createElement("a", { href: n.urls.general, target: "_blank", rel: "noopener noreferrer" }, v.createElement("b", null, n.type)), ":", this.props.currentSchemaDefinitionName)], lists: [{ name: "Properties", url: n.urls.general, itemDefinitions: n.properties }, { name: "Allowed attributes", url: n.urls.allowAttributes, itemDefinitions: n.allowAttributes }, { name: "Allowed children", url: n.urls.allowChildren, itemDefinitions: n.allowChildren, onPropertyTitleClick: (o) => {
            this.props.setSchemaCurrentDefinitionName(o);
          } }, { name: "Allowed in", url: n.urls.allowIn, itemDefinitions: n.allowIn, onPropertyTitleClick: (o) => {
            this.props.setSchemaCurrentDefinitionName(o);
          } }] }) : v.createElement(gt, { isEmpty: "true" }, v.createElement("p", null, "Select a schema definition to inspect"));
        }
      }, ig = Ke(({ editors: n, currentEditorName: o, schema: { currentSchemaDefinitionName: a, currentSchemaDefinition: l } }) => ({ editors: n, currentEditorName: o, currentSchemaDefinitionName: a, currentSchemaDefinition: l }), { setSchemaCurrentDefinitionName: $i })(og), ag = class extends v.Component {
        render() {
          return this.props.currentEditorName ? v.createElement(gt, { splitVertically: "true" }, v.createElement(rg, null), v.createElement(ko, null, v.createElement(br, { activeTab: "Inspect" }, v.createElement(ig, { label: "Inspect" })))) : v.createElement(gt, { isEmpty: "true" }, v.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
        }
      }, sg = Ke(({ currentEditorName: n }) => ({ currentEditorName: n }))(ag), lg = G(((n, o) => {
        o.exports = function() {
          var a = document.getSelection();
          if (!a.rangeCount) return function() {
          };
          for (var l = document.activeElement, c = [], d = 0; d < a.rangeCount; d++) c.push(a.getRangeAt(d));
          switch (l.tagName.toUpperCase()) {
            case "INPUT":
            case "TEXTAREA":
              l.blur();
              break;
            default:
              l = null;
              break;
          }
          return a.removeAllRanges(), function() {
            a.type === "Caret" && a.removeAllRanges(), a.rangeCount || c.forEach(function(u) {
              a.addRange(u);
            }), l && l.focus();
          };
        };
      })), cg = G(((n, o) => {
        var a = lg(), l = { "text/plain": "Text", "text/html": "Url", default: "Text" }, c = "Copy to clipboard: #{key}, Enter";
        function d(y) {
          var b = (/mac os x/i.test(navigator.userAgent) ? "⌘" : "Ctrl") + "+C";
          return y.replace(/#{\s*key\s*}/g, b);
        }
        function u(y, b) {
          var g, E, x, N, S, O, R = !1;
          b || (b = {}), g = b.debug || !1;
          try {
            if (x = a(), N = document.createRange(), S = document.getSelection(), O = document.createElement("span"), O.textContent = y, O.ariaHidden = "true", O.style.all = "unset", O.style.position = "fixed", O.style.top = 0, O.style.clip = "rect(0, 0, 0, 0)", O.style.whiteSpace = "pre", O.style.webkitUserSelect = "text", O.style.MozUserSelect = "text", O.style.msUserSelect = "text", O.style.userSelect = "text", O.addEventListener("copy", function(Y) {
              if (Y.stopPropagation(), b.format) if (Y.preventDefault(), Y.clipboardData === void 0) {
                g && console.warn("unable to use e.clipboardData"), g && console.warn("trying IE specific stuff"), window.clipboardData.clearData();
                var se = l[b.format] || l.default;
                window.clipboardData.setData(se, y);
              } else Y.clipboardData.clearData(), Y.clipboardData.setData(b.format, y);
              b.onCopy && (Y.preventDefault(), b.onCopy(Y.clipboardData));
            }), document.body.appendChild(O), N.selectNodeContents(O), S.addRange(N), !document.execCommand("copy")) throw Error("copy command was unsuccessful");
            R = !0;
          } catch (Y) {
            g && console.error("unable to copy using execCommand: ", Y), g && console.warn("trying IE specific stuff");
            try {
              window.clipboardData.setData(b.format || "text", y), b.onCopy && b.onCopy(window.clipboardData), R = !0;
            } catch (se) {
              g && console.error("unable to copy using clipboardData: ", se), g && console.error("falling back to prompt"), E = d("message" in b ? b.message : c), window.prompt(E, y);
            }
          } finally {
            S && (typeof S.removeRange == "function" ? S.removeRange(N) : S.removeAllRanges()), O && document.body.removeChild(O), x();
          }
          return R;
        }
        o.exports = u;
      })), gc = G(((n, o) => {
        Object.defineProperty(n, "__esModule", { value: !0 }), n.default = E;
        var a = "none", l = "contents", c = /^(input|select|textarea|button|object|iframe)$/;
        function d(x, N) {
          return N.getPropertyValue("overflow") !== "visible" || x.scrollWidth <= 0 && x.scrollHeight <= 0;
        }
        function u(x) {
          var N = x.offsetWidth <= 0 && x.offsetHeight <= 0;
          if (N && !x.innerHTML) return !0;
          try {
            var S = window.getComputedStyle(x), O = S.getPropertyValue("display");
            return N ? O !== l && d(x, S) : O === a;
          } catch {
            return console.warn("Failed to inspect element style"), !1;
          }
        }
        function y(x) {
          for (var N = x, S = x.getRootNode && x.getRootNode(); N && N !== document.body; ) {
            if (S && N === S && (N = S.host.parentNode), u(N)) return !1;
            N = N.parentNode;
          }
          return !0;
        }
        function b(x, N) {
          var S = x.nodeName.toLowerCase();
          return (c.test(S) && !x.disabled || S === "a" && x.href || N) && y(x);
        }
        function g(x) {
          var N = x.getAttribute("tabindex");
          N === null && (N = void 0);
          var S = isNaN(N);
          return (S || N >= 0) && b(x, !S);
        }
        function E(x) {
          return [].slice.call(x.querySelectorAll("*"), 0).reduce(function(N, S) {
            return N.concat(S.shadowRoot ? E(S.shadowRoot) : [S]);
          }, []).filter(g);
        }
        o.exports = n.default;
      })), ug = G(((n) => {
        Object.defineProperty(n, "__esModule", { value: !0 }), n.resetState = u, n.log = y, n.handleBlur = b, n.handleFocus = g, n.markForFocusLater = E, n.returnFocus = x, n.popWithoutFocus = N, n.setupScopedFocus = S, n.teardownScopedFocus = O;
        var o = a(gc());
        function a(R) {
          return R && R.__esModule ? R : { default: R };
        }
        var l = [], c = null, d = !1;
        function u() {
          l = [];
        }
        function y() {
        }
        function b() {
          d = !0;
        }
        function g() {
          if (d) {
            if (d = !1, !c) return;
            setTimeout(function() {
              c.contains(document.activeElement) || ((0, o.default)(c)[0] || c).focus();
            }, 0);
          }
        }
        function E() {
          l.push(document.activeElement);
        }
        function x() {
          var R = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : !1, Y = null;
          try {
            l.length !== 0 && (Y = l.pop(), Y.focus({ preventScroll: R }));
            return;
          } catch {
            console.warn(["You tried to return focus to", Y, "but it is not in the DOM anymore"].join(" "));
          }
        }
        function N() {
          l.length > 0 && l.pop();
        }
        function S(R) {
          c = R, window.addEventListener ? (window.addEventListener("blur", b, !1), document.addEventListener("focus", g, !0)) : (window.attachEvent("onBlur", b), document.attachEvent("onFocus", g));
        }
        function O() {
          c = null, window.addEventListener ? (window.removeEventListener("blur", b), document.removeEventListener("focus", g)) : (window.detachEvent("onBlur", b), document.detachEvent("onFocus", g));
        }
      })), dg = G(((n, o) => {
        Object.defineProperty(n, "__esModule", { value: !0 }), n.default = d;
        var a = l(gc());
        function l(u) {
          return u && u.__esModule ? u : { default: u };
        }
        function c() {
          var u = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : document;
          return u.activeElement.shadowRoot ? c(u.activeElement.shadowRoot) : u.activeElement;
        }
        function d(u, y) {
          var b = (0, a.default)(u);
          if (!b.length) {
            y.preventDefault();
            return;
          }
          var g = void 0, E = y.shiftKey, x = b[0], N = b[b.length - 1], S = c();
          if (u === S) {
            if (!E) return;
            g = N;
          }
          if (N === S && !E && (g = x), x === S && E && (g = N), g) {
            y.preventDefault(), g.focus();
            return;
          }
          var O = /(\bChrome\b|\bSafari\b)\//.exec(navigator.userAgent);
          if (O != null && O[1] != "Chrome" && /\biPod\b|\biPad\b/g.exec(navigator.userAgent) == null) {
            var R = b.indexOf(S);
            if (R > -1 && (R += E ? -1 : 1), g = b[R], g === void 0) {
              y.preventDefault(), g = E ? N : x, g.focus();
              return;
            }
            y.preventDefault(), g.focus();
          }
        }
        o.exports = n.default;
      })), pg = G(((n, o) => {
        var a = function() {
        };
        o.exports = a;
      })), fg = G(((n, o) => {
        (function() {
          var a = !!(typeof window < "u" && window.document && window.document.createElement), l = { canUseDOM: a, canUseWorkers: typeof Worker < "u", canUseEventListeners: a && !!(window.addEventListener || window.attachEvent), canUseViewport: a && !!window.screen };
          o !== void 0 && o.exports ? o.exports = l : window.ExecutionEnvironment = l;
        })();
      })), Yi = G(((n) => {
        Object.defineProperty(n, "__esModule", { value: !0 }), n.canUseDOM = n.SafeNodeList = n.SafeHTMLCollection = void 0;
        var o = a(fg());
        function a(d) {
          return d && d.__esModule ? d : { default: d };
        }
        var l = o.default, c = l.canUseDOM ? window.HTMLElement : {};
        n.SafeHTMLCollection = l.canUseDOM ? window.HTMLCollection : {}, n.SafeNodeList = l.canUseDOM ? window.NodeList : {}, n.canUseDOM = l.canUseDOM, n.default = c;
      })), yc = G(((n) => {
        Object.defineProperty(n, "__esModule", { value: !0 }), n.resetState = d, n.log = u, n.assertNodeList = y, n.setElement = b, n.validateElement = g, n.hide = E, n.show = x, n.documentNotReadyOrSSRTesting = N;
        var o = l(pg()), a = Yi();
        function l(S) {
          return S && S.__esModule ? S : { default: S };
        }
        var c = null;
        function d() {
          c && (c.removeAttribute ? c.removeAttribute("aria-hidden") : c.length == null ? document.querySelectorAll(c).forEach(function(S) {
            return S.removeAttribute("aria-hidden");
          }) : c.forEach(function(S) {
            return S.removeAttribute("aria-hidden");
          })), c = null;
        }
        function u() {
        }
        function y(S, O) {
          if (!S || !S.length) throw Error("react-modal: No elements were found for selector " + O + ".");
        }
        function b(S) {
          var O = S;
          if (typeof O == "string" && a.canUseDOM) {
            var R = document.querySelectorAll(O);
            y(R, O), O = R;
          }
          return c = O || c, c;
        }
        function g(S) {
          var O = S || c;
          return O ? Array.isArray(O) || O instanceof HTMLCollection || O instanceof NodeList ? O : [O] : ((0, o.default)(!1, ["react-modal: App element is not defined.", "Please use `Modal.setAppElement(el)` or set `appElement={el}`.", "This is needed so screen readers don't see main content", "when modal is opened. It is not recommended, but you can opt-out", "by setting `ariaHideApp={false}`."].join(" ")), []);
        }
        function E(S) {
          var O = !0, R = !1, Y = void 0;
          try {
            for (var se = g(S)[Symbol.iterator](), ie; !(O = (ie = se.next()).done); O = !0) ie.value.setAttribute("aria-hidden", "true");
          } catch (ae) {
            R = !0, Y = ae;
          } finally {
            try {
              !O && se.return && se.return();
            } finally {
              if (R) throw Y;
            }
          }
        }
        function x(S) {
          var O = !0, R = !1, Y = void 0;
          try {
            for (var se = g(S)[Symbol.iterator](), ie; !(O = (ie = se.next()).done); O = !0) ie.value.removeAttribute("aria-hidden");
          } catch (ae) {
            R = !0, Y = ae;
          } finally {
            try {
              !O && se.return && se.return();
            } finally {
              if (R) throw Y;
            }
          }
        }
        function N() {
          c = null;
        }
      })), hg = G(((n) => {
        Object.defineProperty(n, "__esModule", { value: !0 }), n.resetState = c, n.log = d;
        var o = {}, a = {};
        function l(E, x) {
          E.classList.remove(x);
        }
        function c() {
          var E = document.getElementsByTagName("html")[0];
          for (var x in o) l(E, o[x]);
          var N = document.body;
          for (var S in a) l(N, a[S]);
          o = {}, a = {};
        }
        function d() {
        }
        var u = function(E, x) {
          return E[x] || (E[x] = 0), E[x] += 1, x;
        }, y = function(E, x) {
          return E[x] && --E[x], x;
        }, b = function(E, x, N) {
          N.forEach(function(S) {
            u(x, S), E.add(S);
          });
        }, g = function(E, x, N) {
          N.forEach(function(S) {
            y(x, S), x[S] === 0 && E.remove(S);
          });
        };
        n.add = function(E, x) {
          return b(E.classList, E.nodeName.toLowerCase() == "html" ? o : a, x.split(" "));
        }, n.remove = function(E, x) {
          return g(E.classList, E.nodeName.toLowerCase() == "html" ? o : a, x.split(" "));
        };
      })), bc = G(((n) => {
        Object.defineProperty(n, "__esModule", { value: !0 }), n.log = c, n.resetState = d;
        function o(u, y) {
          if (!(u instanceof y)) throw TypeError("Cannot call a class as a function");
        }
        var a = function u() {
          var y = this;
          o(this, u), this.register = function(b) {
            y.openInstances.indexOf(b) === -1 && (y.openInstances.push(b), y.emit("register"));
          }, this.deregister = function(b) {
            var g = y.openInstances.indexOf(b);
            g !== -1 && (y.openInstances.splice(g, 1), y.emit("deregister"));
          }, this.subscribe = function(b) {
            y.subscribers.push(b);
          }, this.emit = function(b) {
            y.subscribers.forEach(function(g) {
              return g(b, y.openInstances.slice());
            });
          }, this.openInstances = [], this.subscribers = [];
        }, l = new a();
        function c() {
          console.log("portalOpenInstances ----------"), console.log(l.openInstances.length), l.openInstances.forEach(function(u) {
            return console.log(u);
          }), console.log("end portalOpenInstances ----------");
        }
        function d() {
          l = new a();
        }
        n.default = l;
      })), mg = G(((n) => {
        Object.defineProperty(n, "__esModule", { value: !0 }), n.resetState = u, n.log = y;
        var o = a(bc());
        function a(E) {
          return E && E.__esModule ? E : { default: E };
        }
        var l = void 0, c = void 0, d = [];
        function u() {
          for (var E = [l, c], x = 0; x < E.length; x++) {
            var N = E[x];
            N && N.parentNode && N.parentNode.removeChild(N);
          }
          l = c = null, d = [];
        }
        function y() {
          console.log("bodyTrap ----------"), console.log(d.length);
          for (var E = [l, c], x = 0; x < E.length; x++) {
            var N = E[x] || {};
            console.log(N.nodeName, N.className, N.id);
          }
          console.log("edn bodyTrap ----------");
        }
        function b() {
          d.length !== 0 && d[d.length - 1].focusContent();
        }
        function g(E, x) {
          !l && !c && (l = document.createElement("div"), l.setAttribute("data-react-modal-body-trap", ""), l.style.position = "absolute", l.style.opacity = "0", l.setAttribute("tabindex", "0"), l.addEventListener("focus", b), c = l.cloneNode(), c.addEventListener("focus", b)), d = x, d.length > 0 ? (document.body.firstChild !== l && document.body.insertBefore(l, document.body.firstChild), document.body.lastChild !== c && document.body.appendChild(c)) : (l.parentElement && l.parentElement.removeChild(l), c.parentElement && c.parentElement.removeChild(c));
        }
        o.default.subscribe(g);
      })), gg = G(((n, o) => {
        Object.defineProperty(n, "__esModule", { value: !0 });
        var a = Object.assign || function(z) {
          for (var V = 1; V < arguments.length; V++) {
            var te = arguments[V];
            for (var D in te) Object.prototype.hasOwnProperty.call(te, D) && (z[D] = te[D]);
          }
          return z;
        }, l = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(z) {
          return typeof z;
        } : function(z) {
          return z && typeof Symbol == "function" && z.constructor === Symbol && z !== Symbol.prototype ? "symbol" : typeof z;
        }, c = /* @__PURE__ */ (function() {
          function z(V, te) {
            for (var D = 0; D < te.length; D++) {
              var w = te[D];
              w.enumerable = w.enumerable || !1, w.configurable = !0, "value" in w && (w.writable = !0), Object.defineProperty(V, w.key, w);
            }
          }
          return function(V, te, D) {
            return te && z(V.prototype, te), D && z(V, D), V;
          };
        })(), d = pt(), u = R(lo()), y = O(ug()), b = R(dg()), g = O(yc()), E = O(hg()), x = Yi(), N = R(x), S = R(bc());
        mg();
        function O(z) {
          if (z && z.__esModule) return z;
          var V = {};
          if (z != null) for (var te in z) Object.prototype.hasOwnProperty.call(z, te) && (V[te] = z[te]);
          return V.default = z, V;
        }
        function R(z) {
          return z && z.__esModule ? z : { default: z };
        }
        function Y(z, V) {
          if (!(z instanceof V)) throw TypeError("Cannot call a class as a function");
        }
        function se(z, V) {
          if (!z) throw ReferenceError("this hasn't been initialised - super() hasn't been called");
          return V && (typeof V == "object" || typeof V == "function") ? V : z;
        }
        function ie(z, V) {
          if (typeof V != "function" && V !== null) throw TypeError("Super expression must either be null or a function, not " + typeof V);
          z.prototype = Object.create(V && V.prototype, { constructor: { value: z, enumerable: !1, writable: !0, configurable: !0 } }), V && (Object.setPrototypeOf ? Object.setPrototypeOf(z, V) : z.__proto__ = V);
        }
        var ae = { overlay: "ReactModal__Overlay", content: "ReactModal__Content" }, pe = function(z) {
          return z.code === "Tab" || z.keyCode === 9;
        }, be = function(z) {
          return z.code === "Escape" || z.keyCode === 27;
        }, J = 0, we = (function(z) {
          ie(V, z);
          function V(te) {
            Y(this, V);
            var D = se(this, (V.__proto__ || Object.getPrototypeOf(V)).call(this, te));
            return D.setOverlayRef = function(w) {
              D.overlay = w, D.props.overlayRef && D.props.overlayRef(w);
            }, D.setContentRef = function(w) {
              D.content = w, D.props.contentRef && D.props.contentRef(w);
            }, D.afterClose = function() {
              var w = D.props, M = w.appElement, X = w.ariaHideApp, ce = w.htmlOpenClassName, q = w.bodyOpenClassName, ee = w.parentSelector, ye = ee && ee().ownerDocument || document;
              q && E.remove(ye.body, q), ce && E.remove(ye.getElementsByTagName("html")[0], ce), X && J > 0 && (--J, J === 0 && g.show(M)), D.props.shouldFocusAfterRender && (D.props.shouldReturnFocusAfterClose ? (y.returnFocus(D.props.preventScroll), y.teardownScopedFocus()) : y.popWithoutFocus()), D.props.onAfterClose && D.props.onAfterClose(), S.default.deregister(D);
            }, D.open = function() {
              D.beforeOpen(), D.state.afterOpen && D.state.beforeClose ? (clearTimeout(D.closeTimer), D.setState({ beforeClose: !1 })) : (D.props.shouldFocusAfterRender && (y.setupScopedFocus(D.node), y.markForFocusLater()), D.setState({ isOpen: !0 }, function() {
                D.openAnimationFrame = requestAnimationFrame(function() {
                  D.setState({ afterOpen: !0 }), D.props.isOpen && D.props.onAfterOpen && D.props.onAfterOpen({ overlayEl: D.overlay, contentEl: D.content });
                });
              }));
            }, D.close = function() {
              D.props.closeTimeoutMS > 0 ? D.closeWithTimeout() : D.closeWithoutTimeout();
            }, D.focusContent = function() {
              return D.content && !D.contentHasFocus() && D.content.focus({ preventScroll: !0 });
            }, D.closeWithTimeout = function() {
              var w = Date.now() + D.props.closeTimeoutMS;
              D.setState({ beforeClose: !0, closesAt: w }, function() {
                D.closeTimer = setTimeout(D.closeWithoutTimeout, D.state.closesAt - Date.now());
              });
            }, D.closeWithoutTimeout = function() {
              D.setState({ beforeClose: !1, isOpen: !1, afterOpen: !1, closesAt: null }, D.afterClose);
            }, D.handleKeyDown = function(w) {
              pe(w) && (0, b.default)(D.content, w), D.props.shouldCloseOnEsc && be(w) && (w.stopPropagation(), D.requestClose(w));
            }, D.handleOverlayOnClick = function(w) {
              D.shouldClose === null && (D.shouldClose = !0), D.shouldClose && D.props.shouldCloseOnOverlayClick && (D.ownerHandlesClose() ? D.requestClose(w) : D.focusContent()), D.shouldClose = null;
            }, D.handleContentOnMouseUp = function() {
              D.shouldClose = !1;
            }, D.handleOverlayOnMouseDown = function(w) {
              !D.props.shouldCloseOnOverlayClick && w.target == D.overlay && w.preventDefault();
            }, D.handleContentOnClick = function() {
              D.shouldClose = !1;
            }, D.handleContentOnMouseDown = function() {
              D.shouldClose = !1;
            }, D.requestClose = function(w) {
              return D.ownerHandlesClose() && D.props.onRequestClose(w);
            }, D.ownerHandlesClose = function() {
              return D.props.onRequestClose;
            }, D.shouldBeClosed = function() {
              return !D.state.isOpen && !D.state.beforeClose;
            }, D.contentHasFocus = function() {
              return document.activeElement === D.content || D.content.contains(document.activeElement);
            }, D.buildClassName = function(w, M) {
              var X = (M === void 0 ? "undefined" : l(M)) === "object" ? M : { base: ae[w], afterOpen: ae[w] + "--after-open", beforeClose: ae[w] + "--before-close" }, ce = X.base;
              return D.state.afterOpen && (ce = ce + " " + X.afterOpen), D.state.beforeClose && (ce = ce + " " + X.beforeClose), typeof M == "string" && M ? ce + " " + M : ce;
            }, D.attributesFromObject = function(w, M) {
              return Object.keys(M).reduce(function(X, ce) {
                return X[w + "-" + ce] = M[ce], X;
              }, {});
            }, D.state = { afterOpen: !1, beforeClose: !1 }, D.shouldClose = null, D.moveFromContentToOverlay = null, D;
          }
          return c(V, [{ key: "componentDidMount", value: function() {
            this.props.isOpen && this.open();
          } }, { key: "componentDidUpdate", value: function(te, D) {
            this.props.isOpen && !te.isOpen ? this.open() : !this.props.isOpen && te.isOpen && this.close(), this.props.shouldFocusAfterRender && this.state.isOpen && !D.isOpen && this.focusContent();
          } }, { key: "componentWillUnmount", value: function() {
            this.state.isOpen && this.afterClose(), clearTimeout(this.closeTimer), cancelAnimationFrame(this.openAnimationFrame);
          } }, { key: "beforeOpen", value: function() {
            var te = this.props, D = te.appElement, w = te.ariaHideApp, M = te.htmlOpenClassName, X = te.bodyOpenClassName, ce = te.parentSelector, q = ce && ce().ownerDocument || document;
            X && E.add(q.body, X), M && E.add(q.getElementsByTagName("html")[0], M), w && (J += 1, g.hide(D)), S.default.register(this);
          } }, { key: "render", value: function() {
            var te = this.props, D = te.id, w = te.className, M = te.overlayClassName, X = te.defaultStyles, ce = te.children, q = w ? {} : X.content, ee = M ? {} : X.overlay;
            if (this.shouldBeClosed()) return null;
            var ye = { ref: this.setOverlayRef, className: this.buildClassName("overlay", M), style: a({}, ee, this.props.style.overlay), onClick: this.handleOverlayOnClick, onMouseDown: this.handleOverlayOnMouseDown }, Z = a({ id: D, ref: this.setContentRef, style: a({}, q, this.props.style.content), className: this.buildClassName("content", w), tabIndex: "-1", onKeyDown: this.handleKeyDown, onMouseDown: this.handleContentOnMouseDown, onMouseUp: this.handleContentOnMouseUp, onClick: this.handleContentOnClick, role: this.props.role, "aria-label": this.props.contentLabel }, this.attributesFromObject("aria", a({ modal: !0 }, this.props.aria)), this.attributesFromObject("data", this.props.data || {}), { "data-testid": this.props.testId }), De = this.props.contentElement(Z, ce);
            return this.props.overlayElement(ye, De);
          } }]), V;
        })(d.Component);
        we.defaultProps = { style: { overlay: {}, content: {} }, defaultStyles: {} }, we.propTypes = { isOpen: u.default.bool.isRequired, defaultStyles: u.default.shape({ content: u.default.object, overlay: u.default.object }), style: u.default.shape({ content: u.default.object, overlay: u.default.object }), className: u.default.oneOfType([u.default.string, u.default.object]), overlayClassName: u.default.oneOfType([u.default.string, u.default.object]), parentSelector: u.default.func, bodyOpenClassName: u.default.string, htmlOpenClassName: u.default.string, ariaHideApp: u.default.bool, appElement: u.default.oneOfType([u.default.instanceOf(N.default), u.default.instanceOf(x.SafeHTMLCollection), u.default.instanceOf(x.SafeNodeList), u.default.arrayOf(u.default.instanceOf(N.default))]), onAfterOpen: u.default.func, onAfterClose: u.default.func, onRequestClose: u.default.func, closeTimeoutMS: u.default.number, shouldFocusAfterRender: u.default.bool, shouldCloseOnOverlayClick: u.default.bool, shouldReturnFocusAfterClose: u.default.bool, preventScroll: u.default.bool, role: u.default.string, contentLabel: u.default.string, aria: u.default.object, data: u.default.object, children: u.default.node, shouldCloseOnEsc: u.default.bool, overlayRef: u.default.func, contentRef: u.default.func, id: u.default.string, overlayElement: u.default.func, contentElement: u.default.func, testId: u.default.string }, n.default = we, o.exports = n.default;
      })), yg = he({ polyfill: () => bg });
      function vc() {
        var n = this.constructor.getDerivedStateFromProps(this.props, this.state);
        n != null && this.setState(n);
      }
      function kc(n) {
        function o(a) {
          return this.constructor.getDerivedStateFromProps(n, a) ?? null;
        }
        this.setState(o.bind(this));
      }
      function wc(n, o) {
        try {
          var a = this.props, l = this.state;
          this.props = n, this.state = o, this.__reactInternalSnapshotFlag = !0, this.__reactInternalSnapshot = this.getSnapshotBeforeUpdate(a, l);
        } finally {
          this.props = a, this.state = l;
        }
      }
      function bg(n) {
        var o = n.prototype;
        if (!o || !o.isReactComponent) throw Error("Can only polyfill class components");
        if (typeof n.getDerivedStateFromProps != "function" && typeof o.getSnapshotBeforeUpdate != "function") return n;
        var a = null, l = null, c = null;
        if (typeof o.componentWillMount == "function" ? a = "componentWillMount" : typeof o.UNSAFE_componentWillMount == "function" && (a = "UNSAFE_componentWillMount"), typeof o.componentWillReceiveProps == "function" ? l = "componentWillReceiveProps" : typeof o.UNSAFE_componentWillReceiveProps == "function" && (l = "UNSAFE_componentWillReceiveProps"), typeof o.componentWillUpdate == "function" ? c = "componentWillUpdate" : typeof o.UNSAFE_componentWillUpdate == "function" && (c = "UNSAFE_componentWillUpdate"), a !== null || l !== null || c !== null) {
          var d = n.displayName || n.name, u = typeof n.getDerivedStateFromProps == "function" ? "getDerivedStateFromProps()" : "getSnapshotBeforeUpdate()";
          throw Error(`Unsafe legacy lifecycles will not be called for components using new component APIs.

` + d + " uses " + u + " but also contains the following legacy lifecycles:" + (a === null ? "" : `
  ` + a) + (l === null ? "" : `
  ` + l) + (c === null ? "" : `
  ` + c) + `

The above lifecycles should be removed. Learn more about this warning here:
https://fb.me/react-async-component-lifecycle-hooks`);
        }
        if (typeof n.getDerivedStateFromProps == "function" && (o.componentWillMount = vc, o.componentWillReceiveProps = kc), typeof o.getSnapshotBeforeUpdate == "function") {
          if (typeof o.componentDidUpdate != "function") throw Error("Cannot polyfill getSnapshotBeforeUpdate() for components that do not define componentDidUpdate() on the prototype");
          o.componentWillUpdate = wc;
          var y = o.componentDidUpdate;
          o.componentDidUpdate = function(b, g, E) {
            var x = this.__reactInternalSnapshotFlag ? this.__reactInternalSnapshot : E;
            y.call(this, b, g, x);
          };
        }
        return n;
      }
      var vg = le((() => {
        vc.__suppressDeprecationWarning = !0, kc.__suppressDeprecationWarning = !0, wc.__suppressDeprecationWarning = !0;
      })), kg = G(((n) => {
        Object.defineProperty(n, "__esModule", { value: !0 }), n.bodyOpenClassName = n.portalClassName = void 0;
        var o = Object.assign || function(z) {
          for (var V = 1; V < arguments.length; V++) {
            var te = arguments[V];
            for (var D in te) Object.prototype.hasOwnProperty.call(te, D) && (z[D] = te[D]);
          }
          return z;
        }, a = /* @__PURE__ */ (function() {
          function z(V, te) {
            for (var D = 0; D < te.length; D++) {
              var w = te[D];
              w.enumerable = w.enumerable || !1, w.configurable = !0, "value" in w && (w.writable = !0), Object.defineProperty(V, w.key, w);
            }
          }
          return function(V, te, D) {
            return te && z(V.prototype, te), D && z(V, D), V;
          };
        })(), l = pt(), c = S(l), d = S(It()), u = S(lo()), y = S(gg()), b = N(yc()), g = Yi(), E = S(g), x = (vg(), ze(yg));
        function N(z) {
          if (z && z.__esModule) return z;
          var V = {};
          if (z != null) for (var te in z) Object.prototype.hasOwnProperty.call(z, te) && (V[te] = z[te]);
          return V.default = z, V;
        }
        function S(z) {
          return z && z.__esModule ? z : { default: z };
        }
        function O(z, V) {
          if (!(z instanceof V)) throw TypeError("Cannot call a class as a function");
        }
        function R(z, V) {
          if (!z) throw ReferenceError("this hasn't been initialised - super() hasn't been called");
          return V && (typeof V == "object" || typeof V == "function") ? V : z;
        }
        function Y(z, V) {
          if (typeof V != "function" && V !== null) throw TypeError("Super expression must either be null or a function, not " + typeof V);
          z.prototype = Object.create(V && V.prototype, { constructor: { value: z, enumerable: !1, writable: !0, configurable: !0 } }), V && (Object.setPrototypeOf ? Object.setPrototypeOf(z, V) : z.__proto__ = V);
        }
        var se = n.portalClassName = "ReactModalPortal", ie = n.bodyOpenClassName = "ReactModal__Body--open", ae = g.canUseDOM && d.default.createPortal !== void 0, pe = function(z) {
          return document.createElement(z);
        }, be = function() {
          return ae ? d.default.createPortal : d.default.unstable_renderSubtreeIntoContainer;
        };
        function J(z) {
          return z();
        }
        var we = (function(z) {
          Y(V, z);
          function V() {
            var te, D, w, M;
            O(this, V);
            for (var X = arguments.length, ce = Array(X), q = 0; q < X; q++) ce[q] = arguments[q];
            return M = (D = (w = R(this, (te = V.__proto__ || Object.getPrototypeOf(V)).call.apply(te, [this].concat(ce))), w), w.removePortal = function() {
              !ae && d.default.unmountComponentAtNode(w.node);
              var ee = J(w.props.parentSelector);
              ee && ee.contains(w.node) ? ee.removeChild(w.node) : console.warn('React-Modal: "parentSelector" prop did not returned any DOM element. Make sure that the parent element is unmounted to avoid any memory leaks.');
            }, w.portalRef = function(ee) {
              w.portal = ee;
            }, w.renderPortal = function(ee) {
              var ye = be()(w, c.default.createElement(y.default, o({ defaultStyles: V.defaultStyles }, ee)), w.node);
              w.portalRef(ye);
            }, D), R(w, M);
          }
          return a(V, [{ key: "componentDidMount", value: function() {
            g.canUseDOM && (ae || (this.node = pe("div")), this.node.className = this.props.portalClassName, J(this.props.parentSelector).appendChild(this.node), !ae && this.renderPortal(this.props));
          } }, { key: "getSnapshotBeforeUpdate", value: function(te) {
            return { prevParent: J(te.parentSelector), nextParent: J(this.props.parentSelector) };
          } }, { key: "componentDidUpdate", value: function(te, D, w) {
            if (g.canUseDOM) {
              var M = this.props, X = M.isOpen, ce = M.portalClassName;
              te.portalClassName !== ce && (this.node.className = ce);
              var q = w.prevParent, ee = w.nextParent;
              ee !== q && (q.removeChild(this.node), ee.appendChild(this.node)), !(!te.isOpen && !X) && !ae && this.renderPortal(this.props);
            }
          } }, { key: "componentWillUnmount", value: function() {
            if (!(!g.canUseDOM || !this.node || !this.portal)) {
              var te = this.portal.state, D = Date.now(), w = te.isOpen && this.props.closeTimeoutMS && (te.closesAt || D + this.props.closeTimeoutMS);
              w ? (te.beforeClose || this.portal.closeWithTimeout(), setTimeout(this.removePortal, w - D)) : this.removePortal();
            }
          } }, { key: "render", value: function() {
            return !g.canUseDOM || !ae ? null : (!this.node && ae && (this.node = pe("div")), be()(c.default.createElement(y.default, o({ ref: this.portalRef, defaultStyles: V.defaultStyles }, this.props)), this.node));
          } }], [{ key: "setAppElement", value: function(te) {
            b.setElement(te);
          } }]), V;
        })(l.Component);
        we.propTypes = { isOpen: u.default.bool.isRequired, style: u.default.shape({ content: u.default.object, overlay: u.default.object }), portalClassName: u.default.string, bodyOpenClassName: u.default.string, htmlOpenClassName: u.default.string, className: u.default.oneOfType([u.default.string, u.default.shape({ base: u.default.string.isRequired, afterOpen: u.default.string.isRequired, beforeClose: u.default.string.isRequired })]), overlayClassName: u.default.oneOfType([u.default.string, u.default.shape({ base: u.default.string.isRequired, afterOpen: u.default.string.isRequired, beforeClose: u.default.string.isRequired })]), appElement: u.default.oneOfType([u.default.instanceOf(E.default), u.default.instanceOf(g.SafeHTMLCollection), u.default.instanceOf(g.SafeNodeList), u.default.arrayOf(u.default.instanceOf(E.default))]), onAfterOpen: u.default.func, onRequestClose: u.default.func, closeTimeoutMS: u.default.number, ariaHideApp: u.default.bool, shouldFocusAfterRender: u.default.bool, shouldCloseOnOverlayClick: u.default.bool, shouldReturnFocusAfterClose: u.default.bool, preventScroll: u.default.bool, parentSelector: u.default.func, aria: u.default.object, data: u.default.object, role: u.default.string, contentLabel: u.default.string, shouldCloseOnEsc: u.default.bool, overlayRef: u.default.func, contentRef: u.default.func, id: u.default.string, overlayElement: u.default.func, contentElement: u.default.func }, we.defaultProps = { isOpen: !1, portalClassName: se, bodyOpenClassName: ie, role: "dialog", ariaHideApp: !0, closeTimeoutMS: 0, shouldFocusAfterRender: !0, shouldCloseOnEsc: !0, shouldCloseOnOverlayClick: !0, shouldReturnFocusAfterClose: !0, preventScroll: !1, parentSelector: function() {
          return document.body;
        }, overlayElement: function(z, V) {
          return c.default.createElement("div", z, V);
        }, contentElement: function(z, V) {
          return c.default.createElement("div", z, V);
        } }, we.defaultStyles = { overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(255, 255, 255, 0.75)" }, content: { position: "absolute", top: "40px", left: "40px", right: "40px", bottom: "40px", border: "1px solid #ccc", background: "#fff", overflow: "auto", WebkitOverflowScrolling: "touch", borderRadius: "4px", outline: "none", padding: "20px" } }, (0, x.polyfill)(we), n.default = we;
      })), wg = G(((n, o) => {
        Object.defineProperty(n, "__esModule", { value: !0 });
        var a = l(kg());
        function l(c) {
          return c && c.__esModule ? c : { default: c };
        }
        n.default = a.default, o.exports = n.default;
      })), Eg = Ce(cg()), _g = Ce(wg()), xg = (n) => (0, Ve.jsx)("svg", { viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg", ...n, children: (0, Ve.jsxs)("g", { children: [(0, Ve.jsx)("path", { d: "m12.936 0 5 4.5v12.502l-1.504-.001v.003h1.504v1.499h-5v-1.501l3.496-.001V5.208L12.21 1.516 3.436 1.5v15.504l3.5-.001v1.5h-5V0h11Z" }), (0, Ve.jsx)("path", { d: "m10.374 9.463.085.072.477.464L11 10v.06l3.545 3.453-1.047 1.075L11 12.155 11 19H9v-6.9l-2.424 2.476-1.072-1.05L9.4 9.547a.75.75 0 0 1 .974-.084ZM12.799 1.5l-.001 2.774h3.645v1.5h-5.144V1.5z" })] }) }), Cg = (ea = class extends v.Component {
        constructor(n) {
          super(n), this.state = { isModalOpen: !1, editorDataValue: "" }, this.textarea = v.createRef();
        }
        render() {
          return [v.createElement(rt, { text: "Set editor data", icon: v.createElement(xg, null), isEnabled: !!this.props.editor, onClick: () => this.setState({ isModalOpen: !0 }), key: "button" }), v.createElement(_g.default, { isOpen: this.state.isModalOpen, appElement: this.context.document.querySelector(".ck-inspector-wrapper"), onAfterOpen: this._handleModalAfterOpen.bind(this), overlayClassName: "ck-inspector-modal ck-inspector-quick-actions__set-data-modal", className: "ck-inspector-quick-actions__set-data-modal__content", onRequestClose: this._closeModal.bind(this), portalClassName: "ck-inspector-portal", shouldCloseOnEsc: !0, shouldCloseOnOverlayClick: !0, key: "modal" }, v.createElement("h2", null, "Set editor data"), v.createElement("textarea", { autoFocus: !0, ref: this.textarea, value: this.state.editorDataValue, placeholder: "Paste HTML here...", onChange: this._handlDataChange.bind(this), onKeyPress: (n) => {
            n.key == "Enter" && n.shiftKey && this._setEditorDataAndCloseModal();
          } }), v.createElement("div", { className: "ck-inspector-quick-actions__set-data-modal__buttons" }, v.createElement("button", { type: "button", onClick: () => {
            this.setState({ editorDataValue: this.props.editor.getData() }), this.textarea.current.focus();
          } }, "Load data"), v.createElement("button", { type: "button", title: "Cancel (Esc)", onClick: this._closeModal.bind(this) }, "Cancel"), v.createElement("button", { type: "button", title: "Set editor data (⇧+Enter)", onClick: this._setEditorDataAndCloseModal.bind(this) }, "Set data")))];
        }
        _setEditorDataAndCloseModal() {
          this.props.editor.setData(this.state.editorDataValue), this._closeModal();
        }
        _closeModal() {
          this.setState({ isModalOpen: !1 });
        }
        _handlDataChange(n) {
          this.setState({ editorDataValue: n.target.value });
        }
        _handleModalAfterOpen() {
          this.setState({ editorDataValue: this.props.editor.getData() }), this.textarea.current.select();
        }
      }, wn(ea, "contextType", tn), ea), Sg = (n) => (0, Ve.jsx)("svg", { viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg", ...n, children: (0, Ve.jsxs)("g", { children: [(0, Ve.jsx)("path", { d: "m12.936 0 5 4.5v14.003h-4.503L14.936 17h-10l1.503 1.503H1.936V0h11Zm-9.5 1.5v15.504h12.996V5.208L12.21 1.516 3.436 1.5Z" }), (0, Ve.jsx)("path", { d: "m12.799 1.5-.001 2.774h3.645v1.5h-5.144V1.5zM9.675 18.859l-.085-.072-4.086-3.978 1.047-1.075L9 16.119 9 9h2v7.273l2.473-2.526 1.072 1.049-3.896 3.979a.75.75 0 0 1-.974.084Z" })] }) }), Tg = (n) => (0, Ve.jsx)("svg", { viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg", ...n, children: (0, Ve.jsx)("path", { d: "m3.144 15.748 2.002 1.402-1.976.516-.026-1.918ZM2.438 3.391l15.346 11.023-.875 1.218-5.202-3.736-2.877 4.286.006.005-3.055.797-2.646-1.852-.04-2.95-.006-.005.006-.008v-.025l.01.008L6.02 7.81l-4.457-3.2.876-1.22ZM7.25 8.695l-2.13 3.198 3.277 2.294 2.104-3.158-3.25-2.334ZM14.002 0l2.16 1.512-.856 1.222c.828.967 1.144 2.141.432 3.158l-2.416 3.599-1.214-.873 2.396-3.593.005.003c.317-.452-.16-1.332-1.064-1.966-.891-.624-1.865-.776-2.197-.349l-.006-.004-2.384 3.575-1.224-.879 2.376-3.539c.674-.932 1.706-1.155 3.096-.668l.046.018.85-1.216Z" }) }), Og = (n) => (0, Ve.jsx)("svg", { viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg", ...n, children: (0, Ve.jsx)("path", { d: "M11.28 1a1 1 0 0 1 .948.684l.333 1 .018.066H16a.75.75 0 0 1 .102 1.493L16 4.25h-.5V16a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2V4.25H3a.75.75 0 0 1-.102-1.493L3 2.75h3.42a1 1 0 0 1 .019-.066l.333-1A1 1 0 0 1 7.721 1h3.558ZM14 4.5H5V16a.5.5 0 0 0 .41.492l.09.008h8a.5.5 0 0 0 .492-.41L14 16V4.5ZM7.527 6.06v8.951h-1V6.06h1Zm5 0v8.951h-1V6.06h1ZM10 6.06v8.951H9V6.06h1Z" }) }), Ng = (n) => (0, Ve.jsx)("svg", { viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", ...n, children: (0, Ve.jsxs)("g", { children: [(0, Ve.jsx)("path", { d: "M2.284 2.498c-.239.266-.184.617-.184 1.002V4H2a.5.5 0 0 0-.492.41L1.5 4.5V17a1 1 0 0 0 .883.993L2.5 18h10a1 1 0 0 0 .97-.752l-.081-.062c.438.368.976.54 1.507.526a2.5 2.5 0 0 1-2.232 1.783l-.164.005h-10a2.5 2.5 0 0 1-2.495-2.336L0 17V4.5a2 2 0 0 1 1.85-1.995L2 2.5l.284-.002zm10.532 0L13 2.5a2 2 0 0 1 1.995 1.85L15 4.5v2.28a2.243 2.243 0 0 0-1.5.404V4.5a.5.5 0 0 0-.41-.492L13 4v-.5l-.007-.144c-.031-.329.032-.626-.177-.858z" }), (0, Ve.jsx)("path", { d: "m6 .49-.144.006a1.75 1.75 0 0 0-1.41.94l-.029.058.083-.004c-.69 0-1.25.56-1.25 1.25v1c0 .69.56 1.25 1.25 1.25h6c.69 0 1.25-.56 1.25-1.25v-1l-.006-.128a1.25 1.25 0 0 0-1.116-1.116l-.046-.002-.027-.058A1.75 1.75 0 0 0 9 .49H6zm0 1.5h3a.25.25 0 0 1 .25.25l.007.102A.75.75 0 0 0 10 2.99h.25v.5h-5.5v-.5H5a.75.75 0 0 0 .743-.648l.007-.102A.25.25 0 0 1 6 1.99zM15.374 8.54a.75.75 0 0 1-.093 1.056l-2.33 1.954h6.127a.75.75 0 0 1 0 1.501h-5.949l2.19 1.837a.75.75 0 1 1-.966 1.15l-3.788-3.18a.747.747 0 0 1-.21-.285.75.75 0 0 1 .17-.945l3.792-3.182a.75.75 0 0 1 1.057.093z" })] }) }), Pg = (n) => (0, Ve.jsx)("svg", { viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", ...n, children: (0, Ve.jsx)("path", { fill: "#4fa800", d: "M6.972 16.615a.997.997 0 0 1-.744-.292l-4.596-4.596a1 1 0 1 1 1.414-1.414l3.926 3.926 9.937-9.937a1 1 0 0 1 1.414 1.415L7.717 16.323a.997.997 0 0 1-.745.292z" }) }), Ec = "Lock from Inspector (@ckeditor/ckeditor5-inspector)", Dg = (ta = class extends v.Component {
        constructor(n) {
          super(n), this.state = { isShiftKeyPressed: !1, wasEditorDataJustCopied: !1 }, this._keyDownHandler = this._handleKeyDown.bind(this), this._keyUpHandler = this._handleKeyUp.bind(this), this._readOnlyHandler = this._handleReadOnly.bind(this), this._editorDataJustCopiedTimeout = null;
        }
        render() {
          return v.createElement("div", { className: "ck-inspector-editor-quick-actions" }, v.createElement(rt, { text: "Log editor", icon: v.createElement(Mt, null), isEnabled: !!this.props.editor, onClick: () => console.log(this.props.editor) }), this._getLogButton(), v.createElement(Cg, { editor: this.props.editor }), v.createElement(rt, { text: "Toggle read only", icon: v.createElement(Tg, null), isOn: this.props.isReadOnly, isEnabled: !!this.props.editor, onClick: this._readOnlyHandler }), v.createElement(rt, { text: "Destroy editor", icon: v.createElement(Og, null), isEnabled: !!this.props.editor, onClick: () => {
            this.props.editor.destroy();
          } }));
        }
        componentDidMount() {
          this.context.document.addEventListener("keydown", this._keyDownHandler), this.context.document.addEventListener("keyup", this._keyUpHandler);
        }
        componentWillUnmount() {
          this.context.document.removeEventListener("keydown", this._keyDownHandler), this.context.document.removeEventListener("keyup", this._keyUpHandler), clearTimeout(this._editorDataJustCopiedTimeout);
        }
        _getLogButton() {
          let n, o;
          return this.state.wasEditorDataJustCopied ? (n = v.createElement(Pg, null), o = "Data copied to clipboard.") : (n = this.state.isShiftKeyPressed ? v.createElement(Ng, null) : v.createElement(Sg, null), o = "Log editor data (press with Shift to copy)"), v.createElement(rt, { text: o, icon: n, className: this.state.wasEditorDataJustCopied ? "ck-inspector-button_data-copied" : "", isEnabled: !!this.props.editor, onClick: this._handleLogEditorDataClick.bind(this) });
        }
        _handleLogEditorDataClick({ shiftKey: n }) {
          n ? ((0, Eg.default)(this.props.editor.getData()), this.setState({ wasEditorDataJustCopied: !0 }), clearTimeout(this._editorDataJustCopiedTimeout), this._editorDataJustCopiedTimeout = setTimeout(() => {
            this.setState({ wasEditorDataJustCopied: !1 });
          }, 3e3)) : console.log(this.props.editor.getData());
        }
        _handleKeyDown({ key: n }) {
          this.setState({ isShiftKeyPressed: n === "Shift" });
        }
        _handleKeyUp() {
          this.setState({ isShiftKeyPressed: !1 });
        }
        _handleReadOnly() {
          this.props.editor.isReadOnly ? this.props.editor.disableReadOnlyMode(Ec) : this.props.editor.enableReadOnlyMode(Ec);
        }
      }, wn(ta, "contextType", tn), ta), Ig = Ke(({ editors: n, currentEditorName: o, currentEditorGlobals: { isReadOnly: a } }) => ({ editor: n.get(o), isReadOnly: a }), {})(Dg), Rg = (n) => (0, Ve.jsx)("svg", { viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg", ...n, children: (0, Ve.jsx)("path", { d: "M17.03 6.47a.75.75 0 0 1 .073.976l-.072.084-6.984 7a.75.75 0 0 1-.977.073l-.084-.072-7.016-7a.75.75 0 0 1 .976-1.134l.084.072 6.485 6.47 6.454-6.469a.75.75 0 0 1 .977-.073l.084.072Z" }) }), Mg = "100", _c = 30, Ag = { position: "fixed", bottom: "0", left: "0", right: "0", top: "auto" }, zg = (na = class extends v.Component {
        constructor(n) {
          super(n), this.handleInspectorResize = this.handleInspectorResize.bind(this);
        }
        componentDidMount() {
          xc(this.context.document, this.props.height), this.context.document.body.style.setProperty("--ck-inspector-collapsed-height", `${_c}px`);
        }
        handleInspectorResize(n, o, a) {
          let l = a.style.height;
          this.props.setHeight(l), xc(this.context.document, l);
        }
        render() {
          let n = this.context.document.body;
          return this.props.isCollapsed ? (n.classList.remove("ck-inspector-body-expanded"), n.classList.add("ck-inspector-body-collapsed")) : (n.classList.remove("ck-inspector-body-collapsed"), n.classList.add("ck-inspector-body-expanded")), v.createElement(sc, { bounds: "window", enableResizing: { top: !this.props.isCollapsed }, disableDragging: !0, minHeight: Mg, maxHeight: "100%", style: Ag, className: ["ck-inspector", this.props.isCollapsed ? "ck-inspector_collapsed" : ""].join(" "), position: { x: 0, y: "100%" }, size: { width: "100%", height: this.props.isCollapsed ? _c : this.props.height }, onResizeStop: this.handleInspectorResize }, v.createElement(br, { onTabChange: this.props.setActiveTab, contentBefore: v.createElement(Lg, { key: "docs" }), activeTab: this.props.activeTab, contentAfter: [v.createElement($g, { key: "selector" }), v.createElement("span", { className: "ck-inspector-separator", key: "separator-a" }), v.createElement(Ig, { key: "quick-actions" }), v.createElement("span", { className: "ck-inspector-separator", key: "separator-b" }), v.createElement(Vg, { key: "inspector-toggle" })] }, v.createElement(Um, { label: "Model" }), v.createElement(Qm, { label: "View" }), v.createElement(tg, { label: "Commands" }), v.createElement(sg, { label: "Schema" })));
        }
        componentWillUnmount() {
          let n = this.context.document.body;
          n.classList.remove("ck-inspector-body-expanded"), n.classList.remove("ck-inspector-body-collapsed");
        }
      }, wn(na, "contextType", tn), na), jg = Ke(({ editors: n, currentEditorName: o, ui: { isCollapsed: a, height: l, activeTab: c } }) => ({ isCollapsed: a, height: l, editors: n, currentEditorName: o, activeTab: c }), { toggleIsCollapsed: ul, setHeight: lf, setEditors: dl, setCurrentEditorName: pl, setActiveTab: fl })(zg), Lg = class extends v.Component {
        render() {
          return v.createElement("a", { className: "ck-inspector-navbox__navigation__logo", title: "Go to the documentation", href: "https://ckeditor.com/docs/ckeditor5/latest/", target: "_blank", rel: "noopener noreferrer" }, "CKEditor documentation");
        }
      }, Ug = (ra = class extends v.Component {
        constructor(n) {
          super(n), this.handleShortcut = this.handleShortcut.bind(this);
        }
        render() {
          return v.createElement(rt, { text: "Toggle inspector", icon: v.createElement(Rg, null), onClick: this.props.toggleIsCollapsed, title: "Toggle inspector (Alt+F12)", className: ["ck-inspector-navbox__navigation__toggle", this.props.isCollapsed ? " ck-inspector-navbox__navigation__toggle_up" : ""].join(" ") });
        }
        componentDidMount() {
          this.context.window.addEventListener("keydown", this.handleShortcut);
        }
        componentWillUnmount() {
          this.context.window.removeEventListener("keydown", this.handleShortcut);
        }
        handleShortcut(n) {
          Hg(n) && this.props.toggleIsCollapsed();
        }
      }, wn(ra, "contextType", tn), ra), Vg = Ke(({ ui: { isCollapsed: n } }) => ({ isCollapsed: n }), { toggleIsCollapsed: ul })(Ug), Fg = class extends v.Component {
        render() {
          return v.createElement("div", { className: "ck-inspector-editor-selector", key: "editor-selector" }, this.props.currentEditorName ? v.createElement(Ki, { id: "inspector-editor-selector", label: "Instance", value: this.props.currentEditorName, options: [...this.props.editors].map(([n]) => n), onChange: (n) => this.props.setCurrentEditorName(n.target.value) }) : "");
        }
      }, $g = Ke(({ currentEditorName: n, editors: o }) => ({ currentEditorName: n, editors: o }), { setCurrentEditorName: pl })(Fg);
      function xc(n, o) {
        n.body.style.setProperty("--ck-inspector-height", o);
      }
      function Hg(n) {
        return n.altKey && !n.shiftKey && !n.ctrlKey && n.key === "F12";
      }
      window.CKEDITOR_INSPECTOR_VERSION = "5.0.3";
      var Gi = class Pe {
        constructor() {
          Ge.warn("[CKEditorInspector] Whoops! Looks like you tried to create an instance of the CKEditorInspector class. To attach the inspector, use the static CKEditorInspector.attach( editor ) method instead. For the latest API, please refer to https://github.com/ckeditor/ckeditor5-inspector/blob/master/README.md. ");
        }
        static attach(...o) {
          let { CKEDITOR_VERSION: a } = window;
          if (a) {
            let [d] = a.split(".").map(Number);
            d < 34 && Ge.warn("[CKEditorInspector] The inspector requires using CKEditor 5 in version 34 or higher. If you cannot update CKEditor 5, consider downgrading the major version of the inspector to version 3.");
          } else Ge.warn("[CKEditorInspector] Could not determine a version of CKEditor 5. Some of the functionalities may not work as expected.");
          let { editors: l, options: c } = pf(o);
          for (let d in l) {
            let u = l[d];
            Ge.group("%cAttached the inspector to a CKEditor 5 instance. To learn more, visit https://ckeditor.com/docs/ckeditor5.", "font-weight: bold;"), Ge.log(`Editor instance "${d}"`, u), Ge.groupEnd(), Pe._editors.set(d, u), u.on("destroy", () => {
              Pe.detach(d);
            }), Pe._mount(c), Pe._updateEditorsState();
          }
          return Object.keys(l);
        }
        static attachToAll(o) {
          let a = document.querySelectorAll(".ck.ck-content.ck-editor__editable"), l = [];
          for (let c of a) {
            let d = c.ckeditorInstance;
            d && !Pe._isAttachedTo(d) && l.push(...Pe.attach(d, o));
          }
          return l;
        }
        static detach(o) {
          Pe._wrapper && (Pe._editors.delete(o), Pe._updateEditorsState());
        }
        static destroy() {
          var l;
          if (!Pe._wrapper) return;
          Bt.unmountComponentAtNode(Pe._wrapper), Pe._editors.clear(), Pe._wrapper.remove();
          let o = Pe._store.getState(), a = o.editors.get(o.currentEditorName);
          a && Pe._editorListener.stopListening(a), Pe._editorListener = null, Pe._wrapper = null, Pe._store = null, (l = Pe._teardown) == null || l.call(Pe), Pe._teardown = null;
        }
        static _updateEditorsState() {
          Pe._store.dispatch(dl(Pe._editors));
        }
        static _mount(o) {
          if (Pe._wrapper) return;
          let a = o.container || document.body, l = a.ownerDocument, c = l.defaultView || window, d = Pe._wrapper = l.createElement("div"), u, y;
          d.className = "ck-inspector-wrapper", a.appendChild(d);
          let b = [];
          if (l !== document) {
            for (let g of document.querySelectorAll("style")) if (g.textContent && g.textContent.includes("ck-inspector")) {
              let E = g.cloneNode(!0);
              E.dataset.ckInspectorClone = "true", l.head.appendChild(E), b.push(E);
            }
          }
          Pe._teardown = () => {
            for (let g of b) g.remove();
          }, Pe._editorListener = new Tf({ onModelChange() {
            let g = Pe._store;
            g.getState().ui.isCollapsed || (g.dispatch(il()), g.dispatch(Fi()));
          }, onViewRender() {
            let g = Pe._store;
            g.getState().ui.isCollapsed || g.dispatch(Ai());
          }, onReadOnlyChange() {
            Pe._store.dispatch(uf());
          } }), Pe._store = gr(ch, { editors: Pe._editors, currentEditorName: yl(Pe._editors), currentEditorGlobals: {}, ui: { isCollapsed: o.isCollapsed } }), Pe._store.subscribe(() => {
            let g = Pe._store.getState(), E = g.editors.get(g.currentEditorName);
            u !== E && (u && Pe._editorListener.stopListening(u), E && Pe._editorListener.startListening(E), u = E);
          }), Pe._store.subscribe(() => {
            let g = Pe._store, E = g.getState().ui.isCollapsed, x = y && !E;
            y = E, x && (g.dispatch(il()), g.dispatch(Fi()), g.dispatch(Ai()));
          }), Bt.render(v.createElement(tn.Provider, { value: { document: l, window: c } }, v.createElement(wp, { store: Pe._store }, v.createElement(jg, null))), d);
        }
        static _isAttachedTo(o) {
          return [...Pe._editors.values()].includes(o);
        }
      };
      return Gi._editors = /* @__PURE__ */ new Map(), Gi._wrapper = null, Gi;
    });
  })(Oi)), Oi.exports;
}
var bv = yv();
const vv = /* @__PURE__ */ mv(bv);
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
const kv = function(de) {
  const f = de.plugins.get(pp), m = $(de.ui.view.element), k = $(de.sourceElement), T = `ckeditor${Math.floor(Math.random() * 1e9)}`, L = [
    "keypress",
    "keyup",
    "change",
    "focus",
    "blur",
    "click",
    "mousedown",
    "mouseup"
  ].map((A) => `${A}.${T}`).join(" ");
  f.on("change:isSourceEditingMode", () => {
    const A = m.find(
      ".ck-source-editing-area"
    );
    if (f.isSourceEditingMode) {
      let K = A.attr("data-value");
      A.on(L, () => {
        K !== (K = A.attr("data-value")) && k.val(K);
      });
    } else
      A.off(`.${T}`);
  });
}, wv = function(de, f) {
  if (f.heading !== void 0) {
    var m = f.heading.options;
    m.find((k) => k.view === "h1") !== void 0 && de.keystrokes.set(
      "Ctrl+Alt+1",
      () => de.execute("heading", { value: "heading1" })
    ), m.find((k) => k.view === "h2") !== void 0 && de.keystrokes.set(
      "Ctrl+Alt+2",
      () => de.execute("heading", { value: "heading2" })
    ), m.find((k) => k.view === "h3") !== void 0 && de.keystrokes.set(
      "Ctrl+Alt+3",
      () => de.execute("heading", { value: "heading3" })
    ), m.find((k) => k.view === "h4") !== void 0 && de.keystrokes.set(
      "Ctrl+Alt+4",
      () => de.execute("heading", { value: "heading4" })
    ), m.find((k) => k.view === "h5") !== void 0 && de.keystrokes.set(
      "Ctrl+Alt+5",
      () => de.execute("heading", { value: "heading5" })
    ), m.find((k) => k.view === "h6") !== void 0 && de.keystrokes.set(
      "Ctrl+Alt+6",
      () => de.execute("heading", { value: "heading6" })
    ), m.find((k) => k.model === "paragraph") !== void 0 && de.keystrokes.set("Ctrl+Alt+p", "paragraph");
  }
}, Ev = function(de, f) {
  let m = null;
  const k = de.editing.view.document, T = de.plugins.get("ClipboardPipeline");
  k.on("clipboardOutput", (L, A) => {
    m = de.id;
  }), k.on("clipboardInput", async (L, A) => {
    var le;
    let K = A.dataTransfer.getData("text/html");
    if (K && K.includes("<craft-entry") && !(A.method == "drop" && m === de.id)) {
      if (A.method == "paste" || A.method == "drop" && m !== de.id) {
        let G = K, he = !1;
        const xe = Craft.siteId;
        let Ce = null, ze = null;
        const Ue = de.getData(), it = [
          ...K.matchAll(
            /data-entry-id="([0-9]+)[^>]*data-site-id="([0-9]+)/g
          )
        ];
        L.stop();
        const pt = $(de.ui.view.element);
        let Ht = pt.parents("form").data("elementEditor");
        const Et = de.config.get("craftOwner");
        Ht ? await Ht.ensureIsDraftOrRevision() : Et && (Ce = await Et.prepare());
        let It = pt.parents(".input");
        if (It.length > 0) {
          let v = $(It[0]).find("div.ckeditor-container");
          v.length > 0 && (Ce = $(v[0]).data("element-id"));
        }
        Ce == null && (Ce = Ht ? Ht.settings.elementId : (le = de.config.get("nestedElementAttributes")) == null ? void 0 : le.ownerId), ze = de.config.get("layoutElementUid") ?? pt.parents(".field").data("layoutElement");
        for (let v = 0; v < it.length; v++) {
          let Bt = null;
          it[v][1] && (Bt = it[v][1]);
          let at = null;
          if (it[v][2] && (at = it[v][2]), Bt !== null) {
            const oo = new RegExp('data-entry-id="' + Bt + '"');
            if (!(m === de.id && !oo.test(Ue))) {
              let mr = null;
              m !== de.id && (f.includes(cv) ? mr = de.config.get("entryTypeOptions").map((st) => st.value) : (Craft.cp.displayError(
                Craft.t(
                  "ckeditor",
                  "This field doesn’t allow nested entries."
                )
              ), he = !0)), await Craft.sendActionRequest(
                "POST",
                "ckeditor/ckeditor/duplicate-nested-entry",
                {
                  data: {
                    entryId: Bt,
                    targetSiteId: xe,
                    sourceSiteId: at,
                    targetEntryTypeIds: mr,
                    targetOwnerId: Ce,
                    targetLayoutElementUid: ze
                  }
                }
              ).then((st) => {
                st.data.newEntryId && (G = G.replace(
                  'data-entry-id="' + Bt + '"',
                  'data-entry-id="' + st.data.newEntryId + '"'
                )), st.data.newSiteId && (G = G.replace(
                  'data-site-id="' + at + '"',
                  'data-site-id="' + st.data.newSiteId + '"'
                ));
              }).catch((st) => {
                var io, gr, ao, so;
                he = !0, Craft.cp.displayError((gr = (io = st == null ? void 0 : st.response) == null ? void 0 : io.data) == null ? void 0 : gr.message), console.error((so = (ao = st == null ? void 0 : st.response) == null ? void 0 : ao.data) == null ? void 0 : so.additionalMessage);
              });
            }
          }
        }
        he || (A.content = de.data.htmlProcessor.toView(G), T.fire("inputTransformation", A));
      }
    }
  });
}, Pv = async function(de, f) {
  typeof de == "string" && (de = document.querySelector(`#${de}`)), f.licenseKey = f.licenseKey || "GPL", f.attachTo = de;
  const m = await Kb.create(f);
  Craft.showCkeditorInspector && Craft.userIsAdmin && vv.attach(m), m.editing.view.change((A) => {
    const K = m.editing.view.document.getRoot();
    if (typeof f.accessibleFieldName < "u" && f.accessibleFieldName.length) {
      let le = K.getAttribute("aria-label");
      A.setAttribute(
        "aria-label",
        f.accessibleFieldName + ", " + le,
        K
      );
    }
    typeof f.describedBy < "u" && f.describedBy.length && A.setAttribute(
      "aria-describedby",
      f.describedBy,
      K
    );
  });
  let L = $(m.ui.view.element).parents("form").data("elementEditor");
  if (!L)
    m.updateSourceElement();
  else {
    const A = m.sourceElement.name, K = $(m.sourceElement).val();
    L.pause(), m.updateSourceElement();
    const le = $(m.sourceElement).val();
    if (K !== le) {
      const G = L.$container.data(
        "initialSerializedValue"
      );
      typeof G == "string" && L.$container.data(
        "initialSerializedValue",
        G.replace(
          $.param({ [A]: K }),
          $.param({ [A]: le })
        )
      );
    }
    L.resume();
  }
  return m.model.document.on("change:data", () => {
    m.updateSourceElement();
  }), f.plugins.includes(pp) && kv(m), f.plugins.includes(Qb) && wv(m, f), Ev(m, f.plugins), m;
};
export {
  cv as CraftEntries,
  Sv as CraftImageInsertUI,
  Cv as CraftImageTextAlternativeUI,
  Nv as CraftLink,
  Ov as ImageEditor,
  Tv as ImageTransform,
  Pv as create
};
