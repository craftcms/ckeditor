var Nb = Object.defineProperty;
var Pb = (de, h, m) => h in de ? Nb(de, h, { enumerable: !0, configurable: !0, writable: !0, value: m }) : de[h] = m;
var kn = (de, h, m) => Pb(de, typeof h != "symbol" ? h + "" : h, m);
import { ImageTextAlternativeUI as Db, ButtonView as Hn, FormRowView as Ib, ImageInsertUI as Rb, IconImage as Mb, Command as Us, Plugin as Tt, ImageUtils as lp, Collection as ro, ViewModel as fr, createDropdown as oo, DropdownButtonView as Ab, IconObjectSizeMedium as zb, addListToDropdown as Ti, Widget as jb, viewToModelPositionOutsideModelElement as Lb, toWidget as Ub, DomEventObserver as Vb, View as $t, IconPlus as cp, WidgetToolbarRepository as np, isWidget as Fb, findAttributeRange as rp, LinkUI as op, ContextualBalloon as $b, ModelRange as Hb, SwitchButtonView as Bb, LabeledFieldView as Wb, createLabeledInputText as qb, ClassicEditor as Kb, SourceEditing as up, Heading as Qb } from "ckeditor5";
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
const ip = /#asset:\d+(?:@\d+)?:alt$/, Yb = /#asset:(\d+)(?:@(\d+))?/;
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
        const h = this._form.labeledInput.fieldView, m = this.editor.commands.get("imageTextAlternative").value || "";
        ip.test(m) && h.element.value === this._visibleAltText(m) && (h.value = h.element.value = m);
      },
      { priority: "high" }
    );
  }
  _showForm() {
    super._showForm();
    const h = this._form.labeledInput.fieldView, m = this._visibleAltText(h.element.value);
    h.value = h.element.value = m, this._syncButton.isEnabled = !!this._srcInfo(this._selectedImage()), h.select();
  }
  _visibleAltText(h) {
    return h.replace(ip, "");
  }
  _selectedImage() {
    return this.editor.plugins.get("ImageUtils").getClosestSelectedImageElement(
      this.editor.model.document.selection
    );
  }
  _srcInfo(h) {
    if (!h || !h.hasAttribute("src"))
      return null;
    const m = h.getAttribute("src").match(Yb);
    return m ? {
      assetId: m[1],
      siteId: m[2] ?? null
    } : null;
  }
  _createSyncButton() {
    const h = this.editor, m = new Hn(h.locale);
    m.set({
      label: Craft.t("ckeditor", "Sync from asset"),
      withText: !0,
      class: "btn"
    }), m.render(), this.listenTo(m, "execute", () => this._syncFromAsset());
    const k = new Ib(h.locale, {
      children: [m]
    });
    this._form.children.add(k), this._form.focusTracker.add(m.element), this._form._focusables.add(m), this._syncButton = m, this._syncButtonRow = k;
  }
  async _syncFromAsset() {
    var ue, Z;
    const h = this._selectedImage(), m = this._srcInfo(h);
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
    } catch (xe) {
      throw Craft.cp.displayError((Z = (ue = xe == null ? void 0 : xe.response) == null ? void 0 : ue.data) == null ? void 0 : Z.message), xe;
    }
    const T = k.data.siteId ?? m.siteId, L = k.data.alt ?? "", z = `${L}#asset:${m.assetId}${T ? `@${T}` : ""}:alt`, K = this._form.labeledInput.fieldView;
    if (K.value == L) {
      Craft.cp.displaySuccess(
        Craft.t("ckeditor", "The alternative text was already in sync.")
      );
      return;
    }
    K.value = K.element.value = L, this.editor.execute("imageTextAlternative", {
      newValue: z
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
    const h = this.editor.ui.componentFactory, m = (k) => this._createToolbarImageButton(k);
    h.add("insertImage", m), h.add("imageInsert", m), this._attachUploader();
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
  _createToolbarImageButton(h) {
    const m = this.editor, k = m.t, T = new Hn(h);
    T.isEnabled = !0, T.label = k("Insert image"), T.icon = Mb, T.tooltip = !0;
    const L = m.commands.get("insertImage");
    return T.bind("isEnabled").to(L), this.listenTo(T, "execute", () => this._showImageSelectModal()), T;
  }
  _showImageSelectModal() {
    const h = this._imageSources, m = this.editor, k = m.config, T = Object.assign({}, k.get("assetSelectionCriteria"), {
      kind: "image"
    });
    Craft.createElementSelectorModal("craft\\elements\\Asset", {
      ...this._imageModalSettings,
      storageKey: `ckeditor:${this.pluginName}:'craft\\elements\\Asset'`,
      sources: h,
      criteria: T,
      defaultSiteId: k.get("elementSiteId"),
      transforms: k.get("transforms"),
      autoFocusSearchBox: !1,
      multiSelect: !0,
      onSelect: (L, z) => {
        this._processSelectedAssets(L, z).then(() => {
          m.editing.view.focus();
        });
      },
      onHide: () => {
        m.editing.view.focus();
      },
      closeOtherModals: !1
    });
  }
  async _processSelectedAssets(h, m) {
    if (!h.length)
      return;
    if (this._imageMode === "entries") {
      for (const z of h)
        await this._createImageEntry(z.id);
      return;
    }
    const k = this.editor, T = k.config.get("defaultTransform"), L = [];
    for (const z of h) {
      const K = z.siteId ?? k.config.get("elementSiteId"), ue = `${z.$element.data("alt") ?? ""}#asset:${z.id}${K ? `@${K}` : ""}:alt`, Z = this._isTransformUrl(z.url);
      if (!Z && T) {
        const xe = await this._getTransformUrl(z.id, T);
        L.push({ src: xe, alt: ue });
      } else {
        const xe = this._buildAssetUrl(
          z.id,
          z.url,
          Z ? m : T
        );
        L.push({ src: xe, alt: ue });
      }
    }
    k.execute("insertImage", { source: L });
  }
  async _createImageEntry(h) {
    const m = this.editor, k = this._elementEditor, T = $(m.sourceElement).attr("name");
    k && T && await k.setFormValue(T, "*");
    const L = m.config.get(
      "nestedElementAttributes"
    ), z = {
      ...L
    };
    k && (await k.markDeltaNameAsModified(m.sourceElement.name), z.ownerId = k.getDraftElementId(
      L.ownerId
    ));
    let K;
    try {
      K = await Craft.sendActionRequest(
        "POST",
        "ckeditor/ckeditor/create-image-entry",
        {
          data: {
            ...z,
            assetIds: [h]
          }
        }
      );
    } catch (ue) {
      throw Craft.cp.displayError(), ue;
    }
    m.commands.execute("insertEntry", {
      entryId: K.data.entryId,
      siteId: K.data.siteId
    });
  }
  _buildAssetUrl(h, m, k) {
    return `${m}#asset:${h}:${k ? "transform:" + k : "url"}`;
  }
  _removeTransformFromUrl(h) {
    return h.replace(/(^|\/)_[^\/]+(\/\d+)?\/([^\/]+)$/, "$1$3");
  }
  _isTransformUrl(h) {
    return /(^|\/)_[^\/]+(\/\d+)?(\/[^\/]+)$/.test(h);
  }
  async _getTransformUrl(h, m) {
    let k;
    try {
      k = await Craft.sendActionRequest(
        "POST",
        "ckeditor/ckeditor/image-url",
        {
          data: {
            assetId: h,
            transform: m
          }
        }
      );
    } catch {
      alert("There was an error generating the transform URL.");
    }
    return this._buildAssetUrl(h, k.data.url, m);
  }
  _getAssetUrlComponents(h) {
    const m = h.match(
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
    const h = this.editor, m = h.config.get("defaultUploadFolderId");
    m && (this.$container = $(h.sourceElement).closest(".input"), this.progressBar = new Craft.ProgressBar(
      $('<div class="progress-shade"></div>').appendTo(this.$container)
    ), this.$fileInput = $("<input/>", {
      type: "file",
      class: "hidden",
      multiple: !0
    }).insertAfter(h.sourceElement), this.uploader = Craft.createUploader(null, this.$container, {
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
      siteId: h.config.get("elementSiteId")
    }), h.editing.view.document.on(
      "drop",
      async (k, T) => {
        h.editing.view, h.model;
        const L = h.editing.mapper, z = T.dropRange;
        if (z) {
          const K = z.start, ue = L.toModelPosition(K);
          h.model.change((Z) => {
            Z.setSelection(ue, 0);
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
  _onUploadProgress(h, m = null) {
    m = h instanceof CustomEvent ? h.detail : m;
    var k = parseInt(Math.min(m.loaded / m.total, 1) * 100, 10);
    this.progressBar.setProgressPercentage(k);
  }
  /**
   * On a file being uploaded.
   */
  async _onUploadComplete(h, m = null) {
    const k = h instanceof CustomEvent ? h.detail : m.result;
    if (this.progressBar.hideProgressBar(), this.$container.removeClass("uploading"), this._imageMode === "entries") {
      await this._createImageEntry(k.assetId);
      return;
    }
    const T = this.editor.config.get("defaultTransform"), L = this._isTransformUrl(k.url);
    let z;
    !k.url || !L && T ? z = await this._getTransformUrl(k.assetId, T) : z = this._buildAssetUrl(
      k.assetId,
      k.url,
      L ? transform : T
    ), this.editor.execute("insertImage", { source: z, breakBlock: !0 });
  }
  /**
   * On Upload Failure.
   */
  _onUploadFailure(h, m = null) {
    var ue, Z;
    const k = h instanceof CustomEvent ? h.detail : (ue = m == null ? void 0 : m.jqXHR) == null ? void 0 : ue.responseJSON;
    let { message: T, filename: L, errors: z } = k || {};
    L = L || ((Z = m == null ? void 0 : m.files) == null ? void 0 : Z[0].name);
    let K = z ? Object.values(z).flat() : [];
    T || (K.length ? T = K.join(`
`) : L ? T = Craft.t("app", "Upload failed for “{filename}”.", { filename: L }) : T = Craft.t("app", "Upload failed.")), Craft.cp.displayError(T), this.progressBar.hideProgressBar(), this.$container.removeClass("uploading");
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class Gb extends Us {
  refresh() {
    const h = this._element(), m = this._srcInfo(h);
    this.isEnabled = !!m, m ? this.value = {
      transform: m.transform
    } : this.value = null;
  }
  _element() {
    const h = this.editor;
    return h.plugins.get("ImageUtils").getClosestSelectedImageElement(
      h.model.document.selection
    );
  }
  _srcInfo(h) {
    if (!h || !h.hasAttribute("src"))
      return null;
    const m = h.getAttribute("src"), k = m.match(
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
  execute(h) {
    const k = this.editor.model, T = this._element(), L = this._srcInfo(T);
    if (this.value = {
      transform: h.transform
    }, L) {
      const z = `#asset:${L.assetId}` + (h.transform ? `:transform:${h.transform}` : "");
      k.change((K) => {
        const ue = L.src.replace(/#.*/, "") + z;
        K.setAttribute("src", ue, T);
      }), Craft.sendActionRequest("post", "ckeditor/ckeditor/image-url", {
        data: {
          assetId: L.assetId,
          transform: h.transform
        }
      }).then(({ data: K }) => {
        k.change((ue) => {
          const Z = K.url + z;
          ue.setAttribute("src", Z, T), K.width && ue.setAttribute("width", K.width, T), K.height && ue.setAttribute("height", K.height, T);
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
class dp extends Tt {
  static get requires() {
    return [lp];
  }
  static get pluginName() {
    return "ImageTransformEditing";
  }
  constructor(h) {
    super(h), h.config.define("transforms", []);
  }
  init() {
    const h = this.editor, m = new Gb(h);
    h.commands.add("transformImage", m);
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
    return [dp];
  }
  static get pluginName() {
    return "ImageTransformUI";
  }
  init() {
    const h = this.editor, m = h.config.get("transforms"), k = h.commands.get("transformImage");
    this.bind("isEnabled").to(k), this._registerImageTransformDropdown(m);
  }
  /**
   * A helper function that creates a dropdown component for the plugin containing all the transform options defined in
   * the editor configuration.
   *
   * @param transforms An array of the available image transforms.
   */
  _registerImageTransformDropdown(h) {
    const m = this.editor, k = m.t, T = {
      name: "transformImage:original",
      value: null
    }, L = [
      T,
      ...h.map((K) => ({
        label: K.name,
        name: `transformImage:${K.handle}`,
        value: K.handle
      }))
    ], z = (K) => {
      const ue = m.commands.get("transformImage"), Z = oo(K, Ab), xe = Z.buttonView;
      return xe.set({
        tooltip: k("Resize image"),
        commandValue: null,
        icon: Xb,
        isToggleable: !0,
        label: this._getOptionLabelValue(T),
        withText: !0,
        class: "ck-resize-image-button"
      }), xe.bind("label").to(ue, "value", (ke) => {
        if (!ke || !ke.transform)
          return this._getOptionLabelValue(T);
        const Te = h.find(
          (Le) => Le.handle === ke.transform
        );
        return Te ? Te.name : ke.transform;
      }), Z.bind("isEnabled").to(this), Ti(
        Z,
        () => this._getTransformDropdownListItemDefinitions(L, ue),
        {
          ariaLabel: k("Image resize list")
        }
      ), this.listenTo(Z, "execute", (ke) => {
        m.execute(ke.source.commandName, {
          transform: ke.source.commandValue
        }), m.editing.view.focus();
      }), Z;
    };
    m.ui.componentFactory.add("transformImage", z);
  }
  /**
   * A helper function for creating an option label value string.
   *
   * @param option A transform option object.
   * @returns The option label.
   */
  _getOptionLabelValue(h) {
    return h.label || h.value || this.editor.t("Original");
  }
  /**
   * A helper function that parses the transform options and returns list item definitions ready for use in the dropdown.
   *
   * @param options The transform options.
   * @param command The transform image command.
   * @returns Dropdown item definitions.
   */
  _getTransformDropdownListItemDefinitions(h, m) {
    const k = new ro();
    return h.map((T) => {
      const L = {
        type: "button",
        model: new fr({
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
  return (h) => {
    const m = h;
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
    return [dp, Zb];
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
class ev extends Us {
  refresh() {
    const h = this._element(), m = this._srcInfo(h);
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
    const h = this.editor;
    return h.plugins.get("ImageUtils").getClosestSelectedImageElement(
      h.model.document.selection
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
  _srcInfo(h) {
    if (!h || !h.hasAttribute("src"))
      return null;
    const m = h.getAttribute("src"), k = m.match(
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
  _reloadImage(h, m) {
    let T = this.editor.model;
    this._getAllImageAssets().forEach((z) => {
      if (z.srcInfo.assetId == h)
        if (z.srcInfo.transform) {
          let K = {
            assetId: z.srcInfo.assetId,
            handle: z.srcInfo.transform
          };
          Craft.sendActionRequest("POST", "assets/generate-transform", {
            data: K
          }).then((ue) => {
            let Z = this._getNewSrc(ue.data, z);
            T.change((xe) => {
              xe.setAttribute("src", Z, z.element);
            });
          });
        } else {
          let K = {
            assetId: z.srcInfo.assetId
          };
          Craft.sendActionRequest("POST", "ckeditor/ckeditor/image-url", {
            data: K
          }).then((ue) => {
            let Z = this._getNewSrc(ue.data, z);
            T.change((xe) => {
              xe.setAttribute("src", Z, z.element);
            });
          });
        }
    });
  }
  _getNewSrc(h, m) {
    let k = h.url;
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
        let z = this._srcInfo(L.item);
        z && T.push({
          element: L.item,
          srcInfo: z
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
class pp extends Tt {
  static get requires() {
    return [lp];
  }
  static get pluginName() {
    return "ImageEditorEditing";
  }
  init() {
    const h = this.editor, m = new ev(h);
    h.commands.add("imageEditor", m);
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class tv extends Tt {
  static get requires() {
    return [pp];
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
    const h = this.editor, m = h.t, k = h.commands.get("imageEditor"), T = () => {
      const L = new Hn();
      return L.set({
        label: m("Edit Image"),
        withText: !0
      }), L.bind("isEnabled").to(k), this.listenTo(L, "execute", (z) => {
        h.execute("imageEditor"), h.editing.view.focus();
      }), L;
    };
    h.ui.componentFactory.add("imageEditor", T);
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class Ov extends Tt {
  static get requires() {
    return [pp, tv];
  }
  static get pluginName() {
    return "ImageEditor";
  }
}
class nv extends Us {
  execute(h) {
    const m = this.editor, k = m.model.document.selection;
    if (!k.isCollapsed && k.getFirstRange()) {
      const L = k.getSelectedElement();
      m.execute("insertParagraph", {
        position: m.model.createPositionAfter(L)
      });
    }
    m.model.change((L) => {
      const z = L.createElement("craftEntryModel", {
        ...Object.fromEntries(k.getAttributes()),
        cardHtml: h.cardHtml,
        entryId: h.entryId,
        siteId: h.siteId
      });
      m.model.insertObject(z, null, null, {
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
    const h = this.editor;
    h.commands.add("insertEntry", new nv(h)), h.editing.mapper.on(
      "viewToModelPosition",
      Lb(h.model, (m) => {
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
    const h = this.editor.conversion;
    h.for("upcast").elementToElement({
      view: {
        name: "craft-entry"
        // has to be lower case
      },
      model: (k, { writer: T }) => {
        const L = k.getAttribute("data-card-html"), z = k.getAttribute("data-entry-id"), K = k.getAttribute("data-site-id") ?? null;
        return T.createElement("craftEntryModel", {
          cardHtml: L,
          entryId: z,
          siteId: K
        });
      }
    }), h.for("editingDowncast").elementToElement({
      model: "craftEntryModel",
      view: (k, { writer: T }) => {
        const L = k.getAttribute("entryId") ?? null, z = k.getAttribute("siteId") ?? null, K = T.createContainerElement("div", {
          class: "cke-entry-card",
          "data-entry-id": L,
          "data-site-id": z
        });
        return m(k, T, K), Ub(K, T);
      }
    }), h.for("dataDowncast").elementToElement({
      model: "craftEntryModel",
      view: (k, { writer: T }) => {
        const L = k.getAttribute("entryId") ?? null, z = k.getAttribute("siteId") ?? null;
        return T.createContainerElement("craft-entry", {
          "data-entry-id": L,
          "data-site-id": z
        });
      }
    });
    const m = (k, T, L) => {
      this._getCardHtml(k).then((z) => {
        const K = T.createRawElement(
          "div",
          null,
          function(Z) {
            Z.innerHTML = z.cardHtml, Craft.appendHeadHtml(z.headHtml), Craft.appendBodyHtml(z.bodyHtml);
          }
        );
        T.insert(T.createPositionAt(L, 0), K);
        const ue = this.editor;
        ue.editing.view.focus(), setTimeout(() => {
          Craft.cp.elementThumbLoader.load($(ue.ui.element));
        }, 100), ue.model.change((Z) => {
          ue.ui.update(), $(ue.sourceElement).trigger("keyup");
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
  async _getCardHtml(h) {
    var K, ue, Z;
    let m = h.getAttribute("cardHtml") ?? null;
    if (m)
      return { cardHtml: m };
    let k = $(this.editor.sourceElement).parents(".field");
    const T = $(k[0]).data("layout-element"), L = h.getAttribute("entryId") ?? null, z = h.getAttribute("siteId") ?? null;
    try {
      const xe = this.editor, Te = $(xe.ui.view.element).closest(
        "form,.lp-editor-container"
      ).data("elementEditor");
      Te && await Te.checkForm();
      const { data: Le } = await Craft.sendActionRequest(
        "POST",
        "ckeditor/ckeditor/entry-card-html",
        {
          data: {
            entryId: L,
            siteId: z,
            layoutElementUid: T
          }
        }
      );
      return Le;
    } catch (xe) {
      return console.error((K = xe == null ? void 0 : xe.response) == null ? void 0 : K.data), { cardHtml: '<div class="element card"><div class="card-content"><div class="card-heading"><div class="label error"><span>' + (((Z = (ue = xe == null ? void 0 : xe.response) == null ? void 0 : ue.data) == null ? void 0 : Z.message) || "An unknown error occurred.") + "</span></div></div></div></div>" };
    }
  }
}
class ov extends Vb {
  constructor(h) {
    super(h), this.domEventType = "dblclick";
  }
  onDomEvent(h) {
    this.fire(h.type, h);
  }
}
class iv extends $t {
  constructor(h, m = {}) {
    super(h), this.set("isFocused", !1), this.entriesUi = m.entriesUi, this.editor = this.entriesUi.editor, this.entryType = m.entryType;
    const k = this.editor.commands.get("insertEntry");
    let T = new Hn(), L = {
      commandValue: this.entryType.model.commandValue,
      //entry type id
      label: this.entryType.model.label,
      withText: !this.entryType.model.icon,
      tooltip: Craft.t("app", "New {type}", {
        type: this.entryType.model.label
      })
    }, z = ["btn", "ck-reset_all-excluded"];
    this.entryType.model.icon && z.push(["icon", "cp-icon"]), L.class = z.join(" "), this.entryType.model.withIcon && (L.icon = this.entryType.model.icon), T.set(L), this.listenTo(T, "execute", (K) => {
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
  constructor(h, m = {}) {
    super(h), this.bindTemplate, this.set("isFocused", !1), this.entriesUi = m.entriesUi, this.editor = this.entriesUi.editor;
    const k = m.entryTypes, T = this.editor.commands.get("insertEntry");
    let L = new ro();
    k.forEach((K) => {
      K.model.color && (K.model.class || (K.model.class = ""), K.model.class += "icon " + K.model.color), L.add(K);
    });
    const z = oo(h);
    z.buttonView.set({
      label: Craft.t("ckeditor", "Add nested content"),
      icon: cp,
      tooltip: !0,
      withText: !1
    }), z.bind("isEnabled").to(T), z.id = Craft.uuid(), Ti(z, () => L, {
      ariaLabel: Craft.t("ckeditor", "Entry types list")
    }), this.listenTo(z, "execute", (K) => {
      this.entriesUi._showCreateEntrySlideout(K.source.commandValue);
    }), this.setTemplate({
      tag: "div",
      attributes: {
        // ck-reset_all-excluded class is needed so that CKE doesn't mess with the styles we already have
        class: ["entry-type-button"]
      },
      children: [z]
    });
  }
  // this is needed so that the dropdown button is focusable
  focus() {
    this.element.children[0].children[0].focus();
  }
}
class sv extends $t {
  constructor(h, m = {}) {
    super(h), this.bindTemplate, this.set("isFocused", !1), this.entriesUi = m.entriesUi, this.editor = this.entriesUi.editor;
    const k = this.editor.commands.get("insertEntry"), T = oo(h);
    T.buttonView.set({
      label: Craft.t("ckeditor", "Add nested content"),
      icon: cp,
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
    return [np];
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
    this._createToolbarEntriesButtons(), this.editor.ui.componentFactory.add("editEntryBtn", (h) => this._createEditEntryBtn(h)), this._listenToEvents();
  }
  /**
   * @inheritDoc
   */
  afterInit() {
    this.editor.plugins.get(
      np
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
    const h = this.editor.editing.view, m = h.document;
    h.addObserver(ov), this.editor.listenTo(m, "dblclick", (k, T) => {
      if (!this.editor.isReadOnly) {
        const L = this.editor.editing.mapper.toModelElement(
          T.target.parent
        );
        L.name === "craftEntryModel" && this._initEditEntrySlideout(T, L);
      }
    });
  }
  _initEditEntrySlideout(h = null, m = null) {
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
        ), T = k.filter((z) => z.model.expanded), L = k.filter((z) => !z.model.expanded);
        T.forEach((z, K) => {
          this.editor.ui.componentFactory.add(
            `createEntry-${z.model.uid}`,
            (ue) => new iv(this.editor.locale, {
              entriesUi: this,
              entryType: z
            })
          );
        }), L.length && this.editor.ui.componentFactory.add(
          "createEntry",
          (z) => new av(this.editor.locale, {
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
  _getEntryTypeButtonsCollection(h) {
    const m = new ro();
    return h.map((k) => {
      const T = {
        type: "button",
        model: new fr({
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
  _createEditEntryBtn(h) {
    if (this.editor.isReadOnly)
      return;
    const m = new Hn(h);
    return m.set({
      isEnabled: !0,
      label: Craft.t("app", "Edit {type}", {
        type: Craft.elementTypeNames["craft\\elements\\Entry"][2]
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
  _getCardElement(h) {
    return $(this.editor.ui.element).find('.element.card[data-id="' + h + '"]');
  }
  /**
   * Opens an element editor for existing entry
   *
   * @param entryId
   * @private
   */
  _showEditEntrySlideout(h, m, k) {
    const T = this.editor, L = T.model, z = this.getElementEditor();
    let K = this._getCardElement(h);
    const ue = K.data("owner-id");
    let Z = {
      siteId: m
    }, xe = K.parents(".field");
    xe.length && $(xe[0]).hasClass("has-errors") && (Z.prevalidate = !0);
    const ke = Craft.createElementEditor(this.elementType, null, {
      elementId: h,
      params: Z,
      onLoad: () => {
        ke.elementEditor.on("update", () => {
          Craft.Preview.refresh();
        });
      },
      onBeforeSubmit: async () => {
        if (K !== null && Garnish.hasAttr(K, "data-owner-is-canonical") && (!z || !z.settings.isUnpublishedDraft)) {
          await ke.elementEditor.checkForm(!0, !0);
          let Te = $(T.sourceElement).attr("name");
          z && Te && await z.setFormValue(Te, "*"), z && z.settings.draftId && ke.elementEditor.settings.draftId && (ke.elementEditor.settings.saveParams || (ke.elementEditor.settings.saveParams = {}), ke.elementEditor.settings.saveParams.action = "elements/save-nested-element-for-derivative", ke.elementEditor.settings.saveParams.newOwnerId = z.getDraftElementId(ue));
        }
      },
      onSubmit: (Te) => {
        let Le = this._getCardElement(h);
        Le !== null && Te.data.id != Le.data("id") && (Le.attr("data-id", Te.data.id).data("id", Te.data.id).data("owner-id", Te.data.ownerId), T.editing.model.change((it) => {
          it.setAttribute("entryId", Te.data.id, k), T.ui.update();
        }), Craft.refreshElementInstances(Te.data.id));
      }
    });
    ke.on("beforeClose", () => {
      L.change((Te) => {
        Te.setSelection(Te.createPositionAfter(k)), T.editing.view.focus();
      });
    }), ke.on("close", () => {
      T.editing.view.focus();
    });
  }
  /**
   * Creates new entry and opens the element editor for it
   *
   * @param entryTypeId
   * @private
   */
  async _showCreateEntrySlideout(h) {
    var ke, Te;
    const m = this.editor, k = m.model, L = k.document.selection.getFirstRange(), z = m.config.get(
      "nestedElementAttributes"
    ), K = Object.assign({}, z, {
      typeId: h
    }), ue = this.getElementEditor();
    ue && (await ue.markDeltaNameAsModified(m.sourceElement.name), K.ownerId = ue.getDraftElementId(
      z.ownerId
    ));
    let Z;
    try {
      Z = (await Craft.sendActionRequest(
        "POST",
        "elements/create",
        {
          data: K
        }
      )).data;
    } catch (Le) {
      throw Craft.cp.displayError((Te = (ke = Le == null ? void 0 : Le.response) == null ? void 0 : ke.data) == null ? void 0 : Te.error), Le;
    }
    const xe = Craft.createElementEditor(this.elementType, {
      elementId: Z.element.id,
      draftId: Z.element.draftId,
      params: {
        fresh: 1,
        siteId: Z.element.siteId
      },
      onSubmit: (Le) => {
        m.commands.execute("insertEntry", {
          entryId: Le.data.id,
          siteId: Le.data.siteId
        });
      }
    });
    xe.on("beforeClose", () => {
      xe.$triggerElement = null, k.change((Le) => {
        Le.setSelection(
          Le.createPositionAt(
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
function fp(de, h) {
  if (h)
    return de.type === "bool" && de.value == !0 ? "" : h;
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
    const h = this.editor.model.schema;
    let m = this.conversionData.map((k) => k.model);
    h.extend("$text", {
      allowAttributes: m
    });
  }
  _defineConverters() {
    const h = this.editor.conversion;
    for (let m = 0; m < this.conversionData.length; m++)
      h.for("downcast").attributeToElement({
        model: this.conversionData[m].model,
        view: (k, { writer: T }) => {
          const L = T.createAttributeElement(
            "a",
            { [this.conversionData[m].view]: k },
            { priority: 5 }
          );
          return T.setCustomProperty("link", !0, L), L;
        }
      }), h.for("upcast").attributeToAttribute({
        view: {
          name: "a",
          key: this.conversionData[m].view
        },
        model: {
          key: this.conversionData[m].model,
          value: (k, T) => k.getAttribute(this.conversionData[m].view)
        }
      });
    h.for("editingDowncast").add((m) => {
      m.on(
        "attribute:linkHref",
        (k, T, { mapper: L, writer: z }) => {
          if (!T.attributeNewValue || !T.item.is("$textProxy"))
            return;
          const K = L.toViewRange(T.range);
          for (const ue of K.getItems())
            for (const Z of ue.getAncestors())
              Z.is("attributeElement", "a") && Z.hasAttribute("href") && !Z.getCustomProperty("link") && z.setCustomProperty("link", !0, Z);
        },
        { priority: "low" }
      );
    });
  }
  _adjustLinkCommand() {
    const h = this.editor, m = h.commands.get("link");
    let k = !1;
    m.on(
      "execute",
      (T, L) => {
        if (k) {
          k = !1;
          return;
        }
        T.stop(), k = !0;
        const z = L[3] || {}, K = h.model.document.selection;
        h.model.change((ue) => {
          h.execute("link", ...L);
          const Z = K.getFirstPosition();
          let xe = null;
          if (K.isCollapsed) {
            const ke = Z.textNode || Z.nodeBefore;
            xe = ke != null && ke.hasAttribute("linkHref") ? rp(
              Z,
              "linkHref",
              ke.getAttribute("linkHref"),
              h.model
            ) : ue.createRangeOn(ke);
          }
          this.conversionData.forEach((ke) => {
            const Te = fp(
              ke,
              z[ke.model]
            );
            if (K.isCollapsed)
              Te !== void 0 ? ue.setAttribute(ke.model, Te, xe) : ue.removeAttribute(ke.model, xe);
            else {
              const Le = h.model.schema.getValidRanges(
                K.getRanges(),
                ke.model
              );
              for (const it of Le)
                Te !== void 0 ? ue.setAttribute(ke.model, Te, it) : ue.removeAttribute(ke.model, it);
            }
          });
        });
      },
      { priority: "high" }
    );
  }
  _adjustUnlinkCommand() {
    const h = this.editor, m = h.commands.get("unlink"), { model: k } = h, { selection: T } = k.document;
    let L = !1;
    m.on(
      "execute",
      (z) => {
        L || (z.stop(), k.change(() => {
          L = !0, h.execute("unlink"), L = !1, k.change((K) => {
            let ue;
            this.conversionData.forEach((Z) => {
              T.isCollapsed ? ue = [
                rp(
                  T.getFirstPosition(),
                  Z.model,
                  T.getAttribute(Z.model),
                  k
                )
              ] : ue = k.schema.getValidRanges(
                T.getRanges(),
                Z.model
              );
              for (const xe of ue)
                K.removeAttribute(Z.model, xe);
            });
          });
        }));
      },
      { priority: "high" }
    );
  }
}
class dv extends $t {
  constructor(h, m = {}) {
    super(h), this.bindTemplate, this.set("isFocused", !1), this.linkUi = m.linkUi, this.editor = this.linkUi.editor, this.elementId = this.linkUi._getLinkElementId(), this.siteId = this.linkUi._getLinkSiteId(), this.linkOption = m.linkOption;
    const k = this.linkUi._getLinkElementRefHandle();
    if (this.button = null, k) {
      const T = this.linkUi.linkTypeDropdownItemModels[k];
      this.linkUi.linkTypeDropdownView.buttonView.label == T.label && (this.button = Craft.t("app", "Loading"));
    }
    this.button == null && (this.button = new Hn(), this.button.set({
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
    const h = this.linkUi, m = h._linkUI, k = this.linkOption;
    this.element.addEventListener("click", function(T) {
      if (this.children[0].classList.contains("add") || T.target.classList.contains("ck-button__label")) {
        const L = m.formView.displayedTextInputView.fieldView.element.value;
        m._hideUI(!1), h._showElementSelectorModal(k, L);
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
      var L, z, K, ue;
      if (Object.keys(T.data.elements).length > 0) {
        if (Craft.isMultiSite && this.linkUi.sitesView != null)
          for (const [ke, Te] of Object.entries(
            this.linkUi.sitesView.siteDropdownItemModels
          ))
            T.data.siteIds.includes(parseInt(ke)) || ke == "current" ? Te.set("isEnabled", !0) : Te.set("isEnabled", !1);
        this.element.innerHTML = T.data.elements[this.elementId][0], Craft.appendHeadHtml(T.data.headHtml), Craft.appendBodyHtml(T.data.bodyHtml);
        let Z = this.element.firstChild;
        const xe = [
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
        Craft.addActionsToChip(Z, xe), (z = (L = this.linkUi.sitesView) == null ? void 0 : L.siteDropdownView) != null && z.buttonView && ((K = this.linkUi.sitesView) == null || K.siteDropdownView.buttonView.set(
          "isVisible",
          !0
        )), h._alignFocus();
      } else if (((ue = this.linkUi.previousLinkValue) == null ? void 0 : ue.length) > 0) {
        const { formView: Z } = this.linkUi._linkUI;
        Z.urlInputView.fieldView.set(
          "value",
          this.linkUi.previousLinkValue
        );
      } else
        this.button = new Hn(), this.button.set({
          label: Craft.t("app", "Choose"),
          withText: !0,
          class: "btn add icon dashed"
        }), this.button.render(), this.element.innerHTML = this.button.element.outerHTML;
    }).catch((T) => {
      var L, z, K, ue;
      throw Craft.cp.displayError((z = (L = T == null ? void 0 : T.response) == null ? void 0 : L.data) == null ? void 0 : z.message), ((ue = (K = T == null ? void 0 : T.response) == null ? void 0 : K.data) == null ? void 0 : ue.message) ?? T;
    });
  }
}
class pv extends $t {
  constructor(h, m = {}) {
    super(h), this.bindTemplate, this.set("isFocused", !1), this.linkUi = m.linkUi, this.editor = this.linkUi.editor, this.elementId = this.linkUi._getLinkElementId(), this.siteId = this.linkUi._getLinkSiteId(), this.linkOption = m.linkOption, this.linkUi._getLinkElementRefHandle(), this.siteDropdownView = oo(this.linkUi._linkUI.formView.locale), this.siteDropdownItemModels = null, this.localizedRefHandleRE = null;
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
    const { formView: h } = this.linkUi._linkUI, { urlInputView: m } = h, { fieldView: k } = m;
    this.siteDropdownView.buttonView.set({
      label: "",
      withText: !0,
      isVisible: !0
    }), this.siteDropdownItemModels = Object.fromEntries(
      Craft.sites.map((T) => [
        T.id,
        new fr({
          label: T.name,
          siteId: T.id,
          withText: !0
        })
      ])
    ), this.siteDropdownItemModels.current = new fr({
      label: Craft.t("ckeditor", "Link to the current site"),
      siteId: null,
      withText: !0
    }), Ti(
      this.siteDropdownView,
      new ro([
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
      const { siteId: z } = T.source;
      let K = L[1];
      z && (K += `@${z}`), this.linkUi.previousLinkValue = this.linkUi._urlInputValue();
      const ue = this.linkUi._urlInputValue().replace(L[0], K);
      h.urlInputView.fieldView.set("value", ue), this._toggleSiteDropdownView();
    }), this.listenTo(k, "change:value", () => {
      this._toggleSiteDropdownView();
    }), this.listenTo(k, "input", () => {
      this._toggleSiteDropdownView();
    });
  }
  _toggleSiteDropdownView() {
    const h = this.linkUi._urlInputRefMatch(this.localizedRefHandleRE);
    if (h) {
      this.siteDropdownView.buttonView.set("isVisible", !0);
      let m = h[2] ? parseInt(h[2], 10) : null;
      m && typeof this.siteDropdownItemModels[m] > "u" && (m = null), this._selectSiteDropdownItem(m), this.siteDropdownView.buttonView.set("isVisible", !0);
    } else
      this.siteDropdownView.buttonView.set("isVisible", !1);
  }
  _selectSiteDropdownItem(h) {
    const m = this.siteDropdownItemModels[h ?? "current"], k = h ? Craft.t("ckeditor", "Site: {name}", { name: m.label }) : m.label;
    this.siteDropdownView.buttonView.set("label", k), Object.values(this.siteDropdownItemModels).forEach((T) => {
      T.set("isOn", T.siteId === m.siteId);
    });
  }
}
class fv extends $t {
  constructor(h, m = {}) {
    super(h);
    const k = this.bindTemplate;
    this.set("label", Craft.t("app", "Advanced")), this.linkUi = m.linkUi, this.editor = this.linkUi.editor, this.children = this.createCollection(), this.advancedChildren = this.createCollection(), this.setTemplate({
      tag: "details",
      attributes: {
        class: ["ck", "ck-form__details", "link-type-advanced"]
      },
      children: this.children
    }), this.summary = new $t(h), this.summary.setTemplate({
      tag: "summary",
      attributes: {
        class: ["ck", "ck-form__details__summary"]
      },
      children: [{ text: k.to("label") }]
    }), this.children.add(this.summary), this.advancedFieldsContainer = new $t(h), this.advancedFieldsContainer.setTemplate({
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
  onToggle(h) {
    const { formView: m } = this.linkUi._linkUI;
    if (h.target.open) {
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
    return [op];
  }
  static get pluginName() {
    return "CraftLinkUI";
  }
  constructor() {
    super(...arguments), this.linkTypeWrapperView = null, this.advancedView = null, this.elementInputView = null, this.sitesView = null, this.urlSuffixInputView = null, this.previousLinkValue = null, this.linkTypeDropdownView = null, this.linkTypeDropdownItemModels = [], this.elementTypeRefHandleRE = null, this.urlWithRefHandleRE = null, this.conversionData = [], this.linkOptions = [], this.advancedLinkFields = [], this.editor.config.define("linkOptions", []), this.editor.config.define("advancedLinkFields", []);
  }
  init() {
    const h = this.editor;
    this._linkUI = h.plugins.get(op), this._balloon = h.plugins.get($b), this.linkOptions = h.config.get("linkOptions"), this.advancedLinkFields = h.config.get("advancedLinkFields"), this.conversionData = this.advancedLinkFields.map((k) => k.conversion ?? null).filter((k) => k);
    const m = CKE_LOCALIZED_REF_HANDLES.join("|");
    this.elementTypeRefHandleRE = new RegExp(
      `(#((?:${m})):\\d+)`
    ), this.urlWithRefHandleRE = new RegExp(
      `(.+)(#((?:${m})):(\\d+))(?:@(\\d+))?`
    ), this._modifyFormViewTemplate(), this._balloon.on(
      "set:visibleView",
      (k, T, L, z) => {
        const { formView: K } = this._linkUI;
        L === z || L !== K || this._alignFocus();
      }
    );
  }
  /**
   * Reset focus order of the extra fields we're adding to the link form view
   */
  _alignFocus() {
    const { formView: h } = this._linkUI;
    let m = 0;
    this.linkTypeWrapperView && (this.linkTypeWrapperView._unboundChildren._items.forEach((k) => {
      h._focusables.has(k) && h._focusables.remove(k), h.focusTracker.remove(k.element), h._focusables.add(k, m), h.focusTracker.add(k.element, m), m++;
    }), this.advancedView !== null && (h._focusables.has(this.advancedView) && h._focusables.remove(this.advancedView), h.focusTracker.remove(this.advancedView), h._focusables.add(this.advancedView, m), h.focusTracker.add(this.advancedView.element, m)));
  }
  /**
   * Add all our custom fields (for element linking and advanced fields) to the link form view.
   */
  _modifyFormViewTemplate() {
    this._linkUI.formView || this._linkUI._createViews();
    const { formView: h } = this._linkUI;
    h.template.attributes.class.push(
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
  _urlInputRefMatch(h) {
    return this._urlInputValue().match(h);
  }
  ////////////////////// Link Options Dropdown (link types) //////////////////////
  /**
   * Create a link type dropdown.
   */
  _linkOptionsDropdown() {
    const { formView: h } = this._linkUI, { urlInputView: m } = h, { fieldView: k } = m;
    this.linkTypeDropdownView = oo(h.locale), this.linkTypeDropdownView.buttonView.set({
      label: "",
      withText: !0,
      isVisible: !0
    }), this.linkTypeDropdownItemModels = Object.fromEntries(
      this._getLinkListItemDefinitions().map((T) => [T.handle, T])
    ), Ti(
      this.linkTypeDropdownView,
      new ro([
        ...this._getLinkListItemDefinitions().map((T) => ({
          type: "button",
          model: this.linkTypeDropdownItemModels[T.handle]
        }))
      ])
    ), k.isEmpty && this._showLinkTypeForm("default"), this.linkTypeDropdownView.on("execute", (T) => {
      if (T.source.linkOption) {
        const L = T.source.linkOption;
        this._selectLinkTypeDropdownItem(L.refHandle), this._showLinkTypeForm(L, h);
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
    let h = null;
    const m = this._urlInputValue().match(this.elementTypeRefHandleRE);
    return m && (h = m[2], h && typeof this.linkTypeDropdownItemModels[h] > "u" && (h = null)), h;
  }
  /**
   * Get element ID from the URL field value.
   */
  _getLinkElementId() {
    let h = null;
    const m = this._urlInputRefMatch(this.urlWithRefHandleRE);
    return m && (h = m[4] ? parseInt(m[4], 10) : null), h;
  }
  /**
   * Get site ID from the URL field value.
   */
  _getLinkSiteId() {
    let h = null;
    const m = this._urlInputRefMatch(this.urlWithRefHandleRE);
    return m && (h = m[5] ? parseInt(m[5], 10) : null), h;
  }
  /**
   * Toggle between element link and default URL link fields.
   */
  _toggleLinkTypeDropdownView() {
    let h = this._getLinkElementRefHandle();
    h ? (this.linkTypeDropdownView.buttonView.set("isVisible", !0), this._selectLinkTypeDropdownItem(h)) : this._selectLinkTypeDropdownItem("default");
  }
  /**
   * Select link type from the dropdown.
   */
  _selectLinkTypeDropdownItem(h) {
    const m = this.linkTypeDropdownItemModels[h], k = h ? Craft.t("app", "{name}", { name: m.label }) : m.label;
    this.linkTypeDropdownView.buttonView.set("label", k), Object.values(this.linkTypeDropdownItemModels).forEach((T) => {
      T.set("isOn", T.handle === m.handle);
    });
  }
  /**
   * Get a list of all the options that should be shown in the link type dropdown.
   */
  _getLinkListItemDefinitions() {
    const h = [];
    for (const m of this.linkOptions)
      h.push(
        new fr({
          label: m.label,
          handle: m.refHandle,
          linkOption: m,
          withText: !0
        })
      );
    return h.push(
      new fr({
        label: Craft.t("app", "URL"),
        handle: "default",
        withText: !0
      })
    ), h;
  }
  /**
   * Place the link type fields in the form.
   */
  _showLinkTypeForm(h) {
    var K, ue, Z, xe;
    const { formView: m } = this._linkUI, { children: k } = m, { urlInputView: T } = m, { displayedTextInputView: L } = m;
    L.focus(), this.linkTypeWrapperView !== null && k.remove(this.linkTypeWrapperView), h === "default" ? (this.elementInputView = T, this.sitesView !== null && (ue = (K = this.sitesView) == null ? void 0 : K.siteDropdownView) != null && ue.buttonView && this.sitesView.siteDropdownView.buttonView.set("isVisible", !1)) : (this.elementInputView = new dv(m.locale, {
      linkUi: this,
      linkOption: h,
      value: this._urlInputValue()
    }), this.sitesView !== null && (xe = (Z = this.sitesView) == null ? void 0 : Z.siteDropdownView) != null && xe.buttonView && this.sitesView.siteDropdownView.buttonView.set("isVisible", !1));
    let z = [
      this.linkTypeDropdownView,
      this.elementInputView
    ];
    if (Craft.isMultiSite && this.sitesView == null && (this.sitesView = new pv(m.locale, {
      linkUi: this,
      linkOption: h
    })), this.sitesView != null) {
      let ke = new $t();
      ke.setTemplate({
        tag: "span",
        attributes: {
          class: ["break"]
        }
      }), z.push(ke, this.sitesView);
    }
    this.linkTypeWrapperView = new $t(), this.linkTypeWrapperView.setTemplate({
      tag: "div",
      children: z,
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
  _showElementSelectorModal(h, m) {
    const k = this.editor, T = k.model, L = T.document.selection, z = L.isCollapsed, K = L.getFirstRange(), ue = this._linkUI._getSelectedLinkElement(), Z = () => {
      k.editing.view.focus(), !z && K && T.change((xe) => {
        xe.setSelection(K);
      }), this._linkUI._hideFakeVisualSelection();
    };
    ue || this._linkUI._showFakeVisualSelection(), Craft.createElementSelectorModal(h.elementType, {
      storageKey: `ckeditor:${this.pluginName}:${h.elementType}`,
      sources: h.sources,
      criteria: h.criteria,
      defaultSiteId: k.config.get("elementSiteId"),
      autoFocusSearchBox: !1,
      onSelect: (xe) => {
        var ke;
        if (xe.length) {
          const Te = xe[0], Le = ((ke = this.urlSuffixInputView) == null ? void 0 : ke.fieldView.element.value.trim()) ?? "", it = `${Te.url}${Le}#${h.refHandle}:${Te.id}@${Te.siteId}`;
          if (k.editing.view.focus(), (!z || ue) && K) {
            T.change((Ht) => {
              Ht.setSelection(K);
            });
            const It = k.commands.get("link");
            let Et = this._getAdvancedFieldValues();
            It.execute(it, {}, void 0, Et);
          } else
            T.change((It) => {
              let Et = this._getAdvancedFieldValues(), Ht = { linkHref: it };
              this.conversionData.forEach((Ye) => {
                const mt = fp(
                  Ye,
                  Et[Ye.model]
                );
                mt !== void 0 && (Ht[Ye.model] = mt);
              });
              const wn = m || Te.label;
              if (It.insertText(wn, Ht, L.getFirstPosition()), K instanceof Hb)
                try {
                  const Ye = K.clone();
                  Ye.end.path[1] += wn.length, It.setSelection(Ye);
                } catch {
                }
            });
          setTimeout(() => {
            this._linkUI._showUI(!0);
          }, 100);
        } else
          Z();
      },
      onCancel: () => {
        Z();
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
    const h = this.editor.commands.get("link"), { formView: m } = this._linkUI, { children: k } = m;
    this.advancedView = new fv(m.locale, {
      linkUi: this
    }), k.add(this.advancedView, 3);
    for (const L of this.advancedLinkFields) {
      let z = (T = L.conversion) == null ? void 0 : T.model;
      if (z && typeof m[z] > "u")
        if (L.conversion.type === "bool") {
          const K = new Bb();
          K.set({
            withText: !0,
            label: L.label,
            isToggleable: !0
          }), L.tooltip && (K.tooltip = L.tooltip), this.advancedView.advancedChildren.add(K), m[z] = K, m[z].bind("isOn").to(h, z, (ue) => ue === void 0 ? (m[z].element.value = "", !1) : (m[z].element.value = L.conversion.value, !0)), K.on("execute", () => {
            K.isOn ? (K.isOn = !1, m[z].element.value = "") : (K.isOn = !0, m[z].element.value = L.conversion.value);
          });
        } else {
          let K = this._addLabeledField(L);
          m[z] = K, m[z].fieldView.bind("value").to(h, z), m[z].fieldView.element.value = h[z] || "";
        }
      else if (L.value === "urlSuffix") {
        this.urlSuffixInputView = this._addLabeledField(L), this.listenTo(
          this.urlSuffixInputView.fieldView,
          "change:isFocused",
          (ue, Z, xe, ke) => {
            if (xe !== ke && !xe) {
              if (this._urlInputValue().trim() === "")
                return;
              this._applyUrlSuffix(ue.source.element.value);
            }
          }
        ), this.listenTo(m.urlInputView.fieldView, "change:value", (ue) => {
          this._toggleUrlSuffixInputView(
            this.urlSuffixInputView,
            ue.source.isEmpty
          );
        });
        let K = !1;
        this.listenTo(
          m.urlInputView.fieldView,
          "change:isFocused",
          (ue, Z, xe) => {
            var Le;
            const ke = this._urlInputValue().trim() === "";
            if (xe && (K = ke), ke)
              return;
            const Te = (Le = this.urlSuffixInputView) == null ? void 0 : Le.fieldView.element.value.trim();
            if (!xe && K && Te !== "" && this._getUrlSuffix() === "") {
              this._applyUrlSuffix(Te);
              return;
            }
            this._toggleUrlSuffixInputView(
              this.urlSuffixInputView,
              ue.source.isEmpty
            );
          }
        );
      }
    }
  }
  /**
   * Create a labeled field for given advanced field.
   */
  _addLabeledField(h) {
    const { formView: m } = this._linkUI;
    let k = new Wb(
      m.locale,
      qb
    );
    return k.label = h.label, h.tooltip && (k.infoText = h.tooltip), this.advancedView.advancedChildren.add(k), k;
  }
  /**
   * Populate URL suffix advanced field with content.
   * e.g. if a query string was added directly to the default URL input field,
   * ensure the value is also showing in the URL Suffix advanced field.
   */
  _toggleUrlSuffixInputView(h, m) {
    h.fieldView.set(
      "value",
      m ? "" : this._getUrlSuffix()
    );
  }
  /**
   * Get the URL field value without the {refTag} portion.
   */
  _getUrlWithoutRefTag() {
    const h = this._urlInputRefMatch(this.urlWithRefHandleRE);
    return h ? h[1] : this._urlInputValue();
  }
  /**
   * Get the query params and anchor from the URL field value.
   */
  _getUrlSuffix() {
    const h = this._getUrlWithoutRefTag();
    try {
      let m = new URL(h);
      return m.search + m.hash;
    } catch {
      let [k, T] = h.split("#"), [L, z] = k.split("?");
      return T = T ? "#" + T : "", z = z ? "?" + z : "", z + T;
    }
  }
  /**
   * Replace the query params and anchor in the URL field value with given URL suffix.
   */
  _applyUrlSuffix(h) {
    const { formView: m } = this._linkUI, k = this._getUrlWithoutRefTag();
    let T;
    try {
      let z = new URL(k);
      T = k.replace(z.hash, "").replace(z.search, "");
    } catch {
      let [K, ue] = k.split("#"), [Z, xe] = K.split("?");
    }
    const L = this._urlInputValue().replace(
      k,
      T + h
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
          (L, z) => {
            z[3] = z[3] ? Object.assign(z[3], T) : T;
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
    const h = this.editor, m = h.commands.get("link"), k = h.model.document.selection;
    this.conversionData.forEach((T) => {
      m.set(T.model, null), h.model.document.on("change", () => {
        m[T.model] = k.getAttribute(T.model);
      });
    });
  }
  /**
   * Get the values of all the advanced fields.
   */
  _getAdvancedFieldValues() {
    const { formView: h } = this._linkUI;
    let m = {};
    return this.conversionData.forEach((k) => {
      let T = [];
      k.type === "bool" ? T[k.model] = h[k.model].element.value : T[k.model] = h[k.model].fieldView.element.value, Object.assign(m, T);
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
var ap = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function mv(de) {
  return de && de.__esModule && Object.prototype.hasOwnProperty.call(de, "default") ? de.default : de;
}
var Si = { exports: {} }, gv = Si.exports, sp;
function yv() {
  return sp || (sp = 1, (function(de, h) {
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
      var Yi, Gi, Xi, Zi, Ji, ea, ta;
      var m = Object.create, k = Object.defineProperty, T = Object.getOwnPropertyDescriptor, L = Object.getOwnPropertyNames, z = Object.getPrototypeOf, K = Object.prototype.hasOwnProperty, ue = (n, o) => () => (n && (o = n(n = 0)), o), Z = (n, o) => () => (o || (n((o = { exports: {} }).exports, o), n = null), o.exports), xe = (n, o) => {
        let a = {};
        for (var l in n) k(a, l, { get: n[l], enumerable: !0 });
        return k(a, Symbol.toStringTag, { value: "Module" }), a;
      }, ke = (n, o, a, l) => {
        if (o && typeof o == "object" || typeof o == "function") for (var c = L(o), d = 0, u = c.length, y; d < u; d++) y = c[d], !K.call(n, y) && y !== a && k(n, y, { get: ((b) => o[b]).bind(null, y), enumerable: !(l = T(o, y)) || l.enumerable });
        return n;
      }, Te = (n, o, a) => (a = n == null ? {} : m(z(n)), ke(!n || !n.__esModule ? k(a, "default", { value: n, enumerable: !0 }) : a, n)), Le = (n) => K.call(n, "module.exports") ? n["module.exports"] : ke(k({}, "__esModule", { value: !0 }), n), it = Z(((n, o) => {
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
      })), It = Z(((n) => {
        var o = it(), a = typeof Symbol == "function" && Symbol.for, l = a ? Symbol.for("react.element") : 60103, c = a ? Symbol.for("react.portal") : 60106, d = a ? Symbol.for("react.fragment") : 60107, u = a ? Symbol.for("react.strict_mode") : 60108, y = a ? Symbol.for("react.profiler") : 60114, b = a ? Symbol.for("react.provider") : 60109, g = a ? Symbol.for("react.context") : 60110, E = a ? Symbol.for("react.forward_ref") : 60112, x = a ? Symbol.for("react.suspense") : 60113, N = a ? Symbol.for("react.memo") : 60115, S = a ? Symbol.for("react.lazy") : 60116, O = typeof Symbol == "function" && Symbol.iterator;
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
        var ye = pe.prototype = new ae();
        ye.constructor = pe, o(ye, ie.prototype), ye.isPureReactComponent = !0;
        var J = { current: null }, we = Object.prototype.hasOwnProperty, A = { key: !0, ref: !0, __self: !0, __source: !0 };
        function V(C, U, oe) {
          var he, Ee = {}, Ie = null, Oe = null;
          if (U != null) for (he in U.ref !== void 0 && (Oe = U.ref), U.key !== void 0 && (Ie = "" + U.key), U) we.call(U, he) && !A.hasOwnProperty(he) && (Ee[he] = U[he]);
          var Se = arguments.length - 2;
          if (Se === 1) Ee.children = oe;
          else if (1 < Se) {
            for (var Ve = Array(Se), Ke = 0; Ke < Se; Ke++) Ve[Ke] = arguments[Ke + 2];
            Ee.children = Ve;
          }
          if (C && C.defaultProps) for (he in Se = C.defaultProps, Se) Ee[he] === void 0 && (Ee[he] = Se[he]);
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
        var M = /\/+/g, G = [];
        function le(C, U, oe, he) {
          if (G.length) {
            var Ee = G.pop();
            return Ee.result = C, Ee.keyPrefix = U, Ee.func = oe, Ee.context = he, Ee.count = 0, Ee;
          }
          return { result: C, keyPrefix: U, func: oe, context: he, count: 0 };
        }
        function q(C) {
          C.result = null, C.keyPrefix = null, C.func = null, C.context = null, C.count = 0, 10 > G.length && G.push(C);
        }
        function ee(C, U, oe, he) {
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
          if (Ie) return oe(he, C, U === "" ? "." + X(C, 0) : U), 1;
          if (Ie = 0, U = U === "" ? "." : U + ":", Array.isArray(C)) for (var Oe = 0; Oe < C.length; Oe++) {
            Ee = C[Oe];
            var Se = U + X(Ee, Oe);
            Ie += ee(Ee, Se, oe, he);
          }
          else if (typeof C != "object" || !C ? Se = null : (Se = O && C[O] || C["@@iterator"], Se = typeof Se == "function" ? Se : null), typeof Se == "function") for (C = Se.call(C), Oe = 0; !(Ee = C.next()).done; ) Ee = Ee.value, Se = U + X(Ee, Oe++), Ie += ee(Ee, Se, oe, he);
          else if (Ee === "object") throw oe = "" + C, Error(R(31, oe === "[object Object]" ? "object with keys {" + Object.keys(C).join(", ") + "}" : oe, ""));
          return Ie;
        }
        function ge(C, U, oe) {
          return C == null ? 0 : ee(C, "", U, oe);
        }
        function X(C, U) {
          return typeof C == "object" && C && C.key != null ? w(C.key) : U.toString(36);
        }
        function De(C, U) {
          C.func.call(C.context, U, C.count++);
        }
        function W(C, U, oe) {
          var he = C.result, Ee = C.keyPrefix;
          C = C.func.call(C.context, U, C.count++), Array.isArray(C) ? re(C, he, oe, function(Ie) {
            return Ie;
          }) : C != null && (D(C) && (C = te(C, Ee + (!C.key || U && U.key === C.key ? "" : ("" + C.key).replace(M, "$&/") + "/") + oe)), he.push(C));
        }
        function re(C, U, oe, he, Ee) {
          var Ie = "";
          oe != null && (Ie = ("" + oe).replace(M, "$&/") + "/"), U = le(U, Ie, he, Ee), ge(C, W, U), q(U);
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
          var he = [];
          return re(C, he, null, U, oe), he;
        }, forEach: function(C, U, oe) {
          if (C == null) return C;
          U = le(null, null, U, oe), ge(C, De, U), q(U);
        }, count: function(C) {
          return ge(C, function() {
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
          var he = o({}, C.props), Ee = C.key, Ie = C.ref, Oe = C._owner;
          if (U != null) {
            if (U.ref !== void 0 && (Ie = U.ref, Oe = J.current), U.key !== void 0 && (Ee = "" + U.key), C.type && C.type.defaultProps) var Se = C.type.defaultProps;
            for (Ve in U) we.call(U, Ve) && !A.hasOwnProperty(Ve) && (he[Ve] = U[Ve] === void 0 && Se !== void 0 ? Se[Ve] : U[Ve]);
          }
          var Ve = arguments.length - 2;
          if (Ve === 1) he.children = oe;
          else if (1 < Ve) {
            Se = Array(Ve);
            for (var Ke = 0; Ke < Ve; Ke++) Se[Ke] = arguments[Ke + 2];
            he.children = Se;
          }
          return { $$typeof: l, type: C.type, key: Ee, ref: Ie, props: he, _owner: Oe };
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
      })), Et = Z(((n, o) => {
        o.exports = It();
      })), Ht = Z(((n) => {
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
          var ye = new MessageChannel(), J = ye.port2;
          ye.port1.onmessage = function() {
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
        function A(P) {
          return P = P[0], P === void 0 ? null : P;
        }
        function V(P) {
          var B = P[0];
          if (B !== void 0) {
            var C = P.pop();
            if (C !== B) {
              P[0] = C;
              e: for (var U = 0, oe = P.length; U < oe; ) {
                var he = 2 * (U + 1) - 1, Ee = P[he], Ie = he + 1, Oe = P[Ie];
                if (Ee !== void 0 && 0 > te(Ee, C)) Oe !== void 0 && 0 > te(Oe, Ee) ? (P[U] = Oe, P[Ie] = C, U = Ie) : (P[U] = Ee, P[he] = C, U = he);
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
        var D = [], w = [], M = 1, G = null, le = 3, q = !1, ee = !1, ge = !1;
        function X(P) {
          for (var B = A(w); B !== null; ) {
            if (B.callback === null) V(w);
            else if (B.startTime <= P) V(w), B.sortIndex = B.expirationTime, we(D, B);
            else break;
            B = A(w);
          }
        }
        function De(P) {
          if (ge = !1, X(P), !ee) if (A(D) !== null) ee = !0, o(W);
          else {
            var B = A(w);
            B !== null && a(De, B.startTime - P);
          }
        }
        function W(P, B) {
          ee = !1, ge && (ge = !1, l()), q = !0;
          var C = le;
          try {
            for (X(B), G = A(D); G !== null && (!(G.expirationTime > B) || P && !c()); ) {
              var U = G.callback;
              if (U !== null) {
                G.callback = null, le = G.priorityLevel;
                var oe = U(G.expirationTime <= B);
                B = n.unstable_now(), typeof oe == "function" ? G.callback = oe : G === A(D) && V(D), X(B);
              } else V(D);
              G = A(D);
            }
            if (G !== null) var he = !0;
            else {
              var Ee = A(w);
              Ee !== null && a(De, Ee.startTime - B), he = !1;
            }
            return he;
          } finally {
            G = null, le = C, q = !1;
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
          return le;
        }, n.unstable_getFirstCallbackNode = function() {
          return A(D);
        }, n.unstable_next = function(P) {
          switch (le) {
            case 1:
            case 2:
            case 3:
              var B = 3;
              break;
            default:
              B = le;
          }
          var C = le;
          le = B;
          try {
            return P();
          } finally {
            le = C;
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
          var C = le;
          le = P;
          try {
            return B();
          } finally {
            le = C;
          }
        }, n.unstable_scheduleCallback = function(P, B, C) {
          var U = n.unstable_now();
          if (typeof C == "object" && C) {
            var oe = C.delay;
            oe = typeof oe == "number" && 0 < oe ? U + oe : U, C = typeof C.timeout == "number" ? C.timeout : re(P);
          } else C = re(P), oe = U;
          return C = oe + C, P = { id: M++, callback: B, priorityLevel: P, startTime: oe, expirationTime: C, sortIndex: -1 }, oe > U ? (P.sortIndex = oe, we(w, P), A(D) === null && P === A(w) && (ge ? l() : ge = !0, a(De, oe - U))) : (P.sortIndex = C, we(D, P), ee || q || (ee = !0, o(W))), P;
        }, n.unstable_shouldYield = function() {
          var P = n.unstable_now();
          X(P);
          var B = A(D);
          return B !== G && G !== null && B !== null && B.callback !== null && B.startTime <= P && B.expirationTime < G.expirationTime || c();
        }, n.unstable_wrapCallback = function(P) {
          var B = le;
          return function() {
            var C = le;
            le = B;
            try {
              return P.apply(this, arguments);
            } finally {
              le = C;
            }
          };
        };
      })), wn = Z(((n, o) => {
        o.exports = Ht();
      })), Ye = Z(((n) => {
        var o = Et(), a = it(), l = wn();
        function c(e) {
          for (var t = "https://reactjs.org/docs/error-decoder.html?invariant=" + e, r = 1; r < arguments.length; r++) t += "&args[]=" + encodeURIComponent(arguments[r]);
          return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
        }
        if (!o) throw Error(c(227));
        function d(e, t, r, i, s, p, f, _, F) {
          var H = Array.prototype.slice.call(arguments, 3);
          try {
            t.apply(r, H);
          } catch (me) {
            this.onError(me);
          }
        }
        var u = !1, y = null, b = !1, g = null, E = { onError: function(e) {
          u = !0, y = e;
        } };
        function x(e, t, r, i, s, p, f, _, F) {
          u = !1, y = null, d.apply(E, arguments);
        }
        function N(e, t, r, i, s, p, f, _, F) {
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
            if (!ye[r]) {
              if (!t.extractEvents) throw Error(c(97, e));
              for (var i in ye[r] = t, r = t.eventTypes, r) {
                var s = void 0, p = r[i], f = t, _ = i;
                if (J.hasOwnProperty(_)) throw Error(c(99, _));
                J[_] = p;
                var F = p.phasedRegistrationNames;
                if (F) {
                  for (s in F) F.hasOwnProperty(s) && pe(F[s], f, _);
                  s = !0;
                } else p.registrationName ? (pe(p.registrationName, f, _), s = !0) : s = !1;
                if (!s) throw Error(c(98, i, e));
              }
            }
          }
        }
        function pe(e, t, r) {
          if (we[e]) throw Error(c(100, e));
          we[e] = t, A[e] = t.eventTypes[r].dependencies;
        }
        var ye = [], J = {}, we = {}, A = {};
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
        function G(e) {
          if (e = O(e)) {
            if (typeof D != "function") throw Error(c(280));
            var t = e.stateNode;
            t && (t = S(t), D(e.stateNode, e.type, t));
          }
        }
        function le(e) {
          w ? M ? M.push(e) : M = [e] : w = e;
        }
        function q() {
          if (w) {
            var e = w, t = M;
            if (M = w = null, G(e), t) for (e = 0; e < t.length; e++) G(t[e]);
          }
        }
        function ee(e, t) {
          return e(t);
        }
        function ge(e, t, r, i, s) {
          return e(t, r, i, s);
        }
        function X() {
        }
        var De = ee, W = !1, re = !1;
        function ne() {
          (w !== null || M !== null) && (X(), q());
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
        function he(e) {
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
        var Se = {};
        "children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(e) {
          Se[e] = new Oe(e, 0, !1, e, null, !1);
        }), [["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(e) {
          var t = e[0];
          Se[t] = new Oe(t, 1, !1, e[1], null, !1);
        }), ["contentEditable", "draggable", "spellCheck", "value"].forEach(function(e) {
          Se[e] = new Oe(e, 2, !1, e.toLowerCase(), null, !1);
        }), ["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(e) {
          Se[e] = new Oe(e, 2, !1, e, null, !1);
        }), "allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(e) {
          Se[e] = new Oe(e, 3, !1, e.toLowerCase(), null, !1);
        }), ["checked", "multiple", "muted", "selected"].forEach(function(e) {
          Se[e] = new Oe(e, 3, !0, e, null, !1);
        }), ["capture", "download"].forEach(function(e) {
          Se[e] = new Oe(e, 4, !1, e, null, !1);
        }), ["cols", "rows", "size", "span"].forEach(function(e) {
          Se[e] = new Oe(e, 6, !1, e, null, !1);
        }), ["rowSpan", "start"].forEach(function(e) {
          Se[e] = new Oe(e, 5, !1, e.toLowerCase(), null, !1);
        });
        var Ve = /[\-:]([a-z])/g;
        function Ke(e) {
          return e[1].toUpperCase();
        }
        "accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e) {
          var t = e.replace(Ve, Ke);
          Se[t] = new Oe(t, 1, !1, e, null, !1);
        }), "xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e) {
          var t = e.replace(Ve, Ke);
          Se[t] = new Oe(t, 1, !1, e, "http://www.w3.org/1999/xlink", !1);
        }), ["xml:base", "xml:lang", "xml:space"].forEach(function(e) {
          var t = e.replace(Ve, Ke);
          Se[t] = new Oe(t, 1, !1, e, "http://www.w3.org/XML/1998/namespace", !1);
        }), ["tabIndex", "crossOrigin"].forEach(function(e) {
          Se[e] = new Oe(e, 1, !1, e.toLowerCase(), null, !1);
        }), Se.xlinkHref = new Oe("xlinkHref", 1, !1, "xlink:href", "http://www.w3.org/1999/xlink", !0), ["src", "href", "action", "formAction"].forEach(function(e) {
          Se[e] = new Oe(e, 1, !1, e.toLowerCase(), null, !0);
        });
        var Qe = o.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
        Qe.hasOwnProperty("ReactCurrentDispatcher") || (Qe.ReactCurrentDispatcher = { current: null }), Qe.hasOwnProperty("ReactCurrentBatchConfig") || (Qe.ReactCurrentBatchConfig = { suspense: null });
        function tn(e, t, r, i) {
          var s = Se.hasOwnProperty(t) ? Se[t] : null;
          (s === null ? !i && !(!(2 < t.length) || t[0] !== "o" && t[0] !== "O" || t[1] !== "n" && t[1] !== "N") : s.type === 0) || (Ie(t, r, s, i) && (r = null), i || s === null ? he(t) && (r === null ? e.removeAttribute(t) : e.setAttribute(t, "" + r)) : s.mustUseProperty ? e[s.propertyName] = r === null ? s.type === 3 ? !1 : "" : r : (t = s.attributeName, i = s.attributeNamespace, r === null ? e.removeAttribute(t) : (s = s.type, r = s === 3 || s === 4 && r === !0 ? "" : "" + r, i ? e.setAttributeNS(i, t, r) : e.setAttribute(t, r))));
        }
        var Eo = /^(.*)[\\\/]/, st = typeof Symbol == "function" && Symbol.for, _o = st ? Symbol.for("react.element") : 60103, Gn = st ? Symbol.for("react.portal") : 60106, Tn = st ? Symbol.for("react.fragment") : 60107, _c = st ? Symbol.for("react.strict_mode") : 60108, xo = st ? Symbol.for("react.profiler") : 60114, xc = st ? Symbol.for("react.provider") : 60109, Cc = st ? Symbol.for("react.context") : 60110, Bg = st ? Symbol.for("react.concurrent_mode") : 60111, na = st ? Symbol.for("react.forward_ref") : 60112, Co = st ? Symbol.for("react.suspense") : 60113, ra = st ? Symbol.for("react.suspense_list") : 60120, oa = st ? Symbol.for("react.memo") : 60115, Sc = st ? Symbol.for("react.lazy") : 60116, Tc = st ? Symbol.for("react.block") : 60121, Oc = typeof Symbol == "function" && Symbol.iterator;
        function _r(e) {
          return typeof e != "object" || !e ? null : (e = Oc && e[Oc] || e["@@iterator"], typeof e == "function" ? e : null);
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
        function Bt(e) {
          if (e == null) return null;
          if (typeof e == "function") return e.displayName || e.name || null;
          if (typeof e == "string") return e;
          switch (e) {
            case Tn:
              return "Fragment";
            case Gn:
              return "Portal";
            case xo:
              return "Profiler";
            case _c:
              return "StrictMode";
            case Co:
              return "Suspense";
            case ra:
              return "SuspenseList";
          }
          if (typeof e == "object") switch (e.$$typeof) {
            case Cc:
              return "Context.Consumer";
            case xc:
              return "Context.Provider";
            case na:
              var t = e.render;
              return t = t.displayName || t.name || "", e.displayName || (t === "" ? "ForwardRef" : "ForwardRef(" + t + ")");
            case oa:
              return Bt(e.type);
            case Tc:
              return Bt(e.render);
            case Sc:
              if (e = e._status === 1 ? e._result : null) return Bt(e);
          }
          return null;
        }
        function ia(e) {
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
                var i = e._debugOwner, s = e._debugSource, p = Bt(e.type);
                r = null, i && (r = Bt(i.type)), i = p, p = "", s ? p = " (at " + s.fileName.replace(Eo, "") + ":" + s.lineNumber + ")" : r && (p = " (created by " + r + ")"), r = `
    in ` + (i || "Unknown") + p;
            }
            t += r, e = e.return;
          } while (e);
          return t;
        }
        function nn(e) {
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
        function Nc(e) {
          var t = e.type;
          return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
        }
        function qg(e) {
          var t = Nc(e) ? "checked" : "value", r = Object.getOwnPropertyDescriptor(e.constructor.prototype, t), i = "" + e[t];
          if (!e.hasOwnProperty(t) && r !== void 0 && typeof r.get == "function" && typeof r.set == "function") {
            var s = r.get, p = r.set;
            return Object.defineProperty(e, t, { configurable: !0, get: function() {
              return s.call(this);
            }, set: function(f) {
              i = "" + f, p.call(this, f);
            } }), Object.defineProperty(e, t, { enumerable: r.enumerable }), { getValue: function() {
              return i;
            }, setValue: function(f) {
              i = "" + f;
            }, stopTracking: function() {
              e._valueTracker = null, delete e[t];
            } };
          }
        }
        function So(e) {
          e._valueTracker || (e._valueTracker = qg(e));
        }
        function Pc(e) {
          if (!e) return !1;
          var t = e._valueTracker;
          if (!t) return !0;
          var r = t.getValue(), i = "";
          return e && (i = Nc(e) ? e.checked ? "true" : "false" : e.value), e = i, e === r ? !1 : (t.setValue(e), !0);
        }
        function aa(e, t) {
          var r = t.checked;
          return a({}, t, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: r ?? e._wrapperState.initialChecked });
        }
        function Dc(e, t) {
          var r = t.defaultValue == null ? "" : t.defaultValue, i = t.checked == null ? t.defaultChecked : t.checked;
          r = nn(t.value == null ? r : t.value), e._wrapperState = { initialChecked: i, initialValue: r, controlled: t.type === "checkbox" || t.type === "radio" ? t.checked != null : t.value != null };
        }
        function Ic(e, t) {
          t = t.checked, t != null && tn(e, "checked", t, !1);
        }
        function sa(e, t) {
          Ic(e, t);
          var r = nn(t.value), i = t.type;
          if (r != null) i === "number" ? (r === 0 && e.value === "" || e.value != r) && (e.value = "" + r) : e.value !== "" + r && (e.value = "" + r);
          else if (i === "submit" || i === "reset") {
            e.removeAttribute("value");
            return;
          }
          t.hasOwnProperty("value") ? la(e, t.type, r) : t.hasOwnProperty("defaultValue") && la(e, t.type, nn(t.defaultValue)), t.checked == null && t.defaultChecked != null && (e.defaultChecked = !!t.defaultChecked);
        }
        function Rc(e, t, r) {
          if (t.hasOwnProperty("value") || t.hasOwnProperty("defaultValue")) {
            var i = t.type;
            if (!(i !== "submit" && i !== "reset" || t.value !== void 0 && t.value !== null)) return;
            t = "" + e._wrapperState.initialValue, r || t === e.value || (e.value = t), e.defaultValue = t;
          }
          r = e.name, r !== "" && (e.name = ""), e.defaultChecked = !!e._wrapperState.initialChecked, r !== "" && (e.name = r);
        }
        function la(e, t, r) {
          (t !== "number" || e.ownerDocument.activeElement !== e) && (r == null ? e.defaultValue = "" + e._wrapperState.initialValue : e.defaultValue !== "" + r && (e.defaultValue = "" + r));
        }
        function Kg(e) {
          var t = "";
          return o.Children.forEach(e, function(r) {
            r != null && (t += r);
          }), t;
        }
        function ca(e, t) {
          return e = a({ children: void 0 }, t), (t = Kg(t.children)) && (e.children = t), e;
        }
        function Xn(e, t, r, i) {
          if (e = e.options, t) {
            t = {};
            for (var s = 0; s < r.length; s++) t["$" + r[s]] = !0;
            for (r = 0; r < e.length; r++) s = t.hasOwnProperty("$" + e[r].value), e[r].selected !== s && (e[r].selected = s), s && i && (e[r].defaultSelected = !0);
          } else {
            for (r = "" + nn(r), t = null, s = 0; s < e.length; s++) {
              if (e[s].value === r) {
                e[s].selected = !0, i && (e[s].defaultSelected = !0);
                return;
              }
              t !== null || e[s].disabled || (t = e[s]);
            }
            t !== null && (t.selected = !0);
          }
        }
        function ua(e, t) {
          if (t.dangerouslySetInnerHTML != null) throw Error(c(91));
          return a({}, t, { value: void 0, defaultValue: void 0, children: "" + e._wrapperState.initialValue });
        }
        function Mc(e, t) {
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
          e._wrapperState = { initialValue: nn(r) };
        }
        function Ac(e, t) {
          var r = nn(t.value), i = nn(t.defaultValue);
          r != null && (r = "" + r, r !== e.value && (e.value = r), t.defaultValue == null && e.defaultValue !== r && (e.defaultValue = r)), i != null && (e.defaultValue = "" + i);
        }
        function zc(e) {
          var t = e.textContent;
          t === e._wrapperState.initialValue && t !== "" && t !== null && (e.value = t);
        }
        var jc = { html: "http://www.w3.org/1999/xhtml", svg: "http://www.w3.org/2000/svg" };
        function Lc(e) {
          switch (e) {
            case "svg":
              return "http://www.w3.org/2000/svg";
            case "math":
              return "http://www.w3.org/1998/Math/MathML";
            default:
              return "http://www.w3.org/1999/xhtml";
          }
        }
        function da(e, t) {
          return e == null || e === "http://www.w3.org/1999/xhtml" ? Lc(t) : e === "http://www.w3.org/2000/svg" && t === "foreignObject" ? "http://www.w3.org/1999/xhtml" : e;
        }
        var pa, Uc = (function(e) {
          return typeof MSApp < "u" && MSApp.execUnsafeLocalFunction ? function(t, r, i, s) {
            MSApp.execUnsafeLocalFunction(function() {
              return e(t, r, i, s);
            });
          } : e;
        })(function(e, t) {
          if (e.namespaceURI !== jc.svg || "innerHTML" in e) e.innerHTML = t;
          else {
            for (pa || (pa = document.createElement("div")), pa.innerHTML = "<svg>" + t.valueOf().toString() + "</svg>", t = pa.firstChild; e.firstChild; ) e.removeChild(e.firstChild);
            for (; t.firstChild; ) e.appendChild(t.firstChild);
          }
        });
        function xr(e, t) {
          if (t) {
            var r = e.firstChild;
            if (r && r === e.lastChild && r.nodeType === 3) {
              r.nodeValue = t;
              return;
            }
          }
          e.textContent = t;
        }
        function To(e, t) {
          var r = {};
          return r[e.toLowerCase()] = t.toLowerCase(), r["Webkit" + e] = "webkit" + t, r["Moz" + e] = "moz" + t, r;
        }
        var Zn = { animationend: To("Animation", "AnimationEnd"), animationiteration: To("Animation", "AnimationIteration"), animationstart: To("Animation", "AnimationStart"), transitionend: To("Transition", "TransitionEnd") }, fa = {}, Vc = {};
        te && (Vc = document.createElement("div").style, "AnimationEvent" in window || (delete Zn.animationend.animation, delete Zn.animationiteration.animation, delete Zn.animationstart.animation), "TransitionEvent" in window || delete Zn.transitionend.transition);
        function Oo(e) {
          if (fa[e]) return fa[e];
          if (!Zn[e]) return e;
          var t = Zn[e], r;
          for (r in t) if (t.hasOwnProperty(r) && r in Vc) return fa[e] = t[r];
          return e;
        }
        var Fc = Oo("animationend"), $c = Oo("animationiteration"), Hc = Oo("animationstart"), Bc = Oo("transitionend"), Cr = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), Wc = new (typeof WeakMap == "function" ? WeakMap : Map)();
        function ha(e) {
          var t = Wc.get(e);
          return t === void 0 && (t = /* @__PURE__ */ new Map(), Wc.set(e, t)), t;
        }
        function On(e) {
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
        function qc(e) {
          if (e.tag === 13) {
            var t = e.memoizedState;
            if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
          }
          return null;
        }
        function Kc(e) {
          if (On(e) !== e) throw Error(c(188));
        }
        function Qg(e) {
          var t = e.alternate;
          if (!t) {
            if (t = On(e), t === null) throw Error(c(188));
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
                if (p === r) return Kc(s), e;
                if (p === i) return Kc(s), t;
                p = p.sibling;
              }
              throw Error(c(188));
            }
            if (r.return !== i.return) r = s, i = p;
            else {
              for (var f = !1, _ = s.child; _; ) {
                if (_ === r) {
                  f = !0, r = s, i = p;
                  break;
                }
                if (_ === i) {
                  f = !0, i = s, r = p;
                  break;
                }
                _ = _.sibling;
              }
              if (!f) {
                for (_ = p.child; _; ) {
                  if (_ === r) {
                    f = !0, r = p, i = s;
                    break;
                  }
                  if (_ === i) {
                    f = !0, i = p, r = s;
                    break;
                  }
                  _ = _.sibling;
                }
                if (!f) throw Error(c(189));
              }
            }
            if (r.alternate !== i) throw Error(c(190));
          }
          if (r.tag !== 3) throw Error(c(188));
          return r.stateNode.current === r ? e : t;
        }
        function Qc(e) {
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
        function Jn(e, t) {
          if (t == null) throw Error(c(30));
          return e == null ? t : Array.isArray(e) ? Array.isArray(t) ? (e.push.apply(e, t), e) : (e.push(t), e) : Array.isArray(t) ? [e].concat(t) : [e, t];
        }
        function ma(e, t, r) {
          Array.isArray(e) ? e.forEach(t, r) : e && t.call(r, e);
        }
        var Sr = null;
        function Yg(e) {
          if (e) {
            var t = e._dispatchListeners, r = e._dispatchInstances;
            if (Array.isArray(t)) for (var i = 0; i < t.length && !e.isPropagationStopped(); i++) Y(e, t[i], r[i]);
            else t && Y(e, t, r);
            e._dispatchListeners = null, e._dispatchInstances = null, e.isPersistent() || e.constructor.release(e);
          }
        }
        function No(e) {
          if (e !== null && (Sr = Jn(Sr, e)), e = Sr, Sr = null, e) {
            if (ma(e, Yg), Sr) throw Error(c(95));
            if (b) throw e = g, b = !1, g = null, e;
          }
        }
        function ga(e) {
          return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
        }
        function Yc(e) {
          if (!te) return !1;
          e = "on" + e;
          var t = e in document;
          return t || (t = (t = document.createElement("div"), t.setAttribute(e, "return;"), typeof t[e] == "function")), t;
        }
        var Po = [];
        function Gc(e) {
          e.topLevelType = null, e.nativeEvent = null, e.targetInst = null, e.ancestors.length = 0, 10 > Po.length && Po.push(e);
        }
        function Xc(e, t, r, i) {
          if (Po.length) {
            var s = Po.pop();
            return s.topLevelType = e, s.eventSystemFlags = i, s.nativeEvent = t, s.targetInst = r, s;
          }
          return { topLevelType: e, eventSystemFlags: i, nativeEvent: t, targetInst: r, ancestors: [] };
        }
        function Zc(e) {
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
            t = r.tag, t !== 5 && t !== 6 || e.ancestors.push(r), r = Ar(i);
          } while (r);
          for (r = 0; r < e.ancestors.length; r++) {
            t = e.ancestors[r];
            var s = ga(e.nativeEvent);
            i = e.topLevelType;
            var p = e.nativeEvent, f = e.eventSystemFlags;
            r === 0 && (f |= 64);
            for (var _ = null, F = 0; F < ye.length; F++) {
              var H = ye[F];
              H && (H = H.extractEvents(i, t, p, s, f)) && (_ = Jn(_, H));
            }
            No(_);
          }
        }
        function ya(e, t, r) {
          if (!r.has(e)) {
            switch (e) {
              case "scroll":
                Ir(t, "scroll", !0);
                break;
              case "focus":
              case "blur":
                Ir(t, "focus", !0), Ir(t, "blur", !0), r.set("blur", null), r.set("focus", null);
                break;
              case "cancel":
              case "close":
                Yc(e) && Ir(t, e, !0);
                break;
              case "invalid":
              case "submit":
              case "reset":
                break;
              default:
                Cr.indexOf(e) === -1 && $e(e, t);
            }
            r.set(e, null);
          }
        }
        var Jc, ba, eu, va = !1, At = [], rn = null, on = null, an = null, Tr = /* @__PURE__ */ new Map(), Or = /* @__PURE__ */ new Map(), Nr = [], ka = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput close cancel copy cut paste click change contextmenu reset submit".split(" "), Gg = "focus blur dragenter dragleave mouseover mouseout pointerover pointerout gotpointercapture lostpointercapture".split(" ");
        function Xg(e, t) {
          var r = ha(t);
          ka.forEach(function(i) {
            ya(i, t, r);
          }), Gg.forEach(function(i) {
            ya(i, t, r);
          });
        }
        function wa(e, t, r, i, s) {
          return { blockedOn: e, topLevelType: t, eventSystemFlags: r | 32, nativeEvent: s, container: i };
        }
        function tu(e, t) {
          switch (e) {
            case "focus":
            case "blur":
              rn = null;
              break;
            case "dragenter":
            case "dragleave":
              on = null;
              break;
            case "mouseover":
            case "mouseout":
              an = null;
              break;
            case "pointerover":
            case "pointerout":
              Tr.delete(t.pointerId);
              break;
            case "gotpointercapture":
            case "lostpointercapture":
              Or.delete(t.pointerId);
          }
        }
        function Pr(e, t, r, i, s, p) {
          return e === null || e.nativeEvent !== p ? (e = wa(t, r, i, s, p), t !== null && (t = zr(t), t !== null && ba(t)), e) : (e.eventSystemFlags |= i, e);
        }
        function Zg(e, t, r, i, s) {
          switch (t) {
            case "focus":
              return rn = Pr(rn, e, t, r, i, s), !0;
            case "dragenter":
              return on = Pr(on, e, t, r, i, s), !0;
            case "mouseover":
              return an = Pr(an, e, t, r, i, s), !0;
            case "pointerover":
              var p = s.pointerId;
              return Tr.set(p, Pr(Tr.get(p) || null, e, t, r, i, s)), !0;
            case "gotpointercapture":
              return p = s.pointerId, Or.set(p, Pr(Or.get(p) || null, e, t, r, i, s)), !0;
          }
          return !1;
        }
        function Jg(e) {
          var t = Ar(e.target);
          if (t !== null) {
            var r = On(t);
            if (r !== null) {
              if (t = r.tag, t === 13) {
                if (t = qc(r), t !== null) {
                  e.blockedOn = t, l.unstable_runWithPriority(e.priority, function() {
                    eu(r);
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
        function Do(e) {
          if (e.blockedOn !== null) return !1;
          var t = Ca(e.topLevelType, e.eventSystemFlags, e.container, e.nativeEvent);
          if (t !== null) {
            var r = zr(t);
            return r !== null && ba(r), e.blockedOn = t, !1;
          }
          return !0;
        }
        function nu(e, t, r) {
          Do(e) && r.delete(t);
        }
        function ey() {
          for (va = !1; 0 < At.length; ) {
            var e = At[0];
            if (e.blockedOn !== null) {
              e = zr(e.blockedOn), e !== null && Jc(e);
              break;
            }
            var t = Ca(e.topLevelType, e.eventSystemFlags, e.container, e.nativeEvent);
            t === null ? At.shift() : e.blockedOn = t;
          }
          rn !== null && Do(rn) && (rn = null), on !== null && Do(on) && (on = null), an !== null && Do(an) && (an = null), Tr.forEach(nu), Or.forEach(nu);
        }
        function Dr(e, t) {
          e.blockedOn === t && (e.blockedOn = null, va || (va = !0, l.unstable_scheduleCallback(l.unstable_NormalPriority, ey)));
        }
        function ru(e) {
          function t(s) {
            return Dr(s, e);
          }
          if (0 < At.length) {
            Dr(At[0], e);
            for (var r = 1; r < At.length; r++) {
              var i = At[r];
              i.blockedOn === e && (i.blockedOn = null);
            }
          }
          for (rn !== null && Dr(rn, e), on !== null && Dr(on, e), an !== null && Dr(an, e), Tr.forEach(t), Or.forEach(t), r = 0; r < Nr.length; r++) i = Nr[r], i.blockedOn === e && (i.blockedOn = null);
          for (; 0 < Nr.length && (r = Nr[0], r.blockedOn === null); ) Jg(r), r.blockedOn === null && Nr.shift();
        }
        var ou = {}, iu = /* @__PURE__ */ new Map(), Ea = /* @__PURE__ */ new Map(), ty = ["abort", "abort", Fc, "animationEnd", $c, "animationIteration", Hc, "animationStart", "canplay", "canPlay", "canplaythrough", "canPlayThrough", "durationchange", "durationChange", "emptied", "emptied", "encrypted", "encrypted", "ended", "ended", "error", "error", "gotpointercapture", "gotPointerCapture", "load", "load", "loadeddata", "loadedData", "loadedmetadata", "loadedMetadata", "loadstart", "loadStart", "lostpointercapture", "lostPointerCapture", "playing", "playing", "progress", "progress", "seeking", "seeking", "stalled", "stalled", "suspend", "suspend", "timeupdate", "timeUpdate", Bc, "transitionEnd", "waiting", "waiting"];
        function _a(e, t) {
          for (var r = 0; r < e.length; r += 2) {
            var i = e[r], s = e[r + 1], p = "on" + (s[0].toUpperCase() + s.slice(1));
            p = { phasedRegistrationNames: { bubbled: p, captured: p + "Capture" }, dependencies: [i], eventPriority: t }, Ea.set(i, t), iu.set(i, p), ou[s] = p;
          }
        }
        _a("blur blur cancel cancel click click close close contextmenu contextMenu copy copy cut cut auxclick auxClick dblclick doubleClick dragend dragEnd dragstart dragStart drop drop focus focus input input invalid invalid keydown keyDown keypress keyPress keyup keyUp mousedown mouseDown mouseup mouseUp paste paste pause pause play play pointercancel pointerCancel pointerdown pointerDown pointerup pointerUp ratechange rateChange reset reset seeked seeked submit submit touchcancel touchCancel touchend touchEnd touchstart touchStart volumechange volumeChange".split(" "), 0), _a("drag drag dragenter dragEnter dragexit dragExit dragleave dragLeave dragover dragOver mousemove mouseMove mouseout mouseOut mouseover mouseOver pointermove pointerMove pointerout pointerOut pointerover pointerOver scroll scroll toggle toggle touchmove touchMove wheel wheel".split(" "), 1), _a(ty, 2);
        for (var au = "change selectionchange textInput compositionstart compositionend compositionupdate".split(" "), xa = 0; xa < au.length; xa++) Ea.set(au[xa], 0);
        var ny = l.unstable_UserBlockingPriority, ry = l.unstable_runWithPriority, Io = !0;
        function $e(e, t) {
          Ir(t, e, !1);
        }
        function Ir(e, t, r) {
          var i = Ea.get(t);
          switch (i === void 0 ? 2 : i) {
            case 0:
              i = oy.bind(null, t, 1, e);
              break;
            case 1:
              i = iy.bind(null, t, 1, e);
              break;
            default:
              i = Ro.bind(null, t, 1, e);
          }
          r ? e.addEventListener(t, i, !0) : e.addEventListener(t, i, !1);
        }
        function oy(e, t, r, i) {
          W || X();
          var s = Ro, p = W;
          W = !0;
          try {
            ge(s, e, t, r, i);
          } finally {
            (W = p) || ne();
          }
        }
        function iy(e, t, r, i) {
          ry(ny, Ro.bind(null, e, t, r, i));
        }
        function Ro(e, t, r, i) {
          if (Io) if (0 < At.length && -1 < ka.indexOf(e)) e = wa(null, e, t, r, i), At.push(e);
          else {
            var s = Ca(e, t, r, i);
            if (s === null) tu(e, i);
            else if (-1 < ka.indexOf(e)) e = wa(s, e, t, r, i), At.push(e);
            else if (!Zg(s, e, t, r, i)) {
              tu(e, i), e = Xc(e, i, null, t);
              try {
                P(Zc, e);
              } finally {
                Gc(e);
              }
            }
          }
        }
        function Ca(e, t, r, i) {
          if (r = ga(i), r = Ar(r), r !== null) {
            var s = On(r);
            if (s === null) r = null;
            else {
              var p = s.tag;
              if (p === 13) {
                if (r = qc(s), r !== null) return r;
                r = null;
              } else if (p === 3) {
                if (s.stateNode.hydrate) return s.tag === 3 ? s.stateNode.containerInfo : null;
                r = null;
              } else s !== r && (r = null);
            }
          }
          e = Xc(e, i, r, t);
          try {
            P(Zc, e);
          } finally {
            Gc(e);
          }
          return null;
        }
        var Rr = { animationIterationCount: !0, borderImageOutset: !0, borderImageSlice: !0, borderImageWidth: !0, boxFlex: !0, boxFlexGroup: !0, boxOrdinalGroup: !0, columnCount: !0, columns: !0, flex: !0, flexGrow: !0, flexPositive: !0, flexShrink: !0, flexNegative: !0, flexOrder: !0, gridArea: !0, gridRow: !0, gridRowEnd: !0, gridRowSpan: !0, gridRowStart: !0, gridColumn: !0, gridColumnEnd: !0, gridColumnSpan: !0, gridColumnStart: !0, fontWeight: !0, lineClamp: !0, lineHeight: !0, opacity: !0, order: !0, orphans: !0, tabSize: !0, widows: !0, zIndex: !0, zoom: !0, fillOpacity: !0, floodOpacity: !0, stopOpacity: !0, strokeDasharray: !0, strokeDashoffset: !0, strokeMiterlimit: !0, strokeOpacity: !0, strokeWidth: !0 }, ay = ["Webkit", "ms", "Moz", "O"];
        Object.keys(Rr).forEach(function(e) {
          ay.forEach(function(t) {
            t = t + e.charAt(0).toUpperCase() + e.substring(1), Rr[t] = Rr[e];
          });
        });
        function su(e, t, r) {
          return t == null || typeof t == "boolean" || t === "" ? "" : r || typeof t != "number" || t === 0 || Rr.hasOwnProperty(e) && Rr[e] ? ("" + t).trim() : t + "px";
        }
        function lu(e, t) {
          for (var r in e = e.style, t) if (t.hasOwnProperty(r)) {
            var i = r.indexOf("--") === 0, s = su(r, t[r], i);
            r === "float" && (r = "cssFloat"), i ? e.setProperty(r, s) : e[r] = s;
          }
        }
        var sy = a({ menuitem: !0 }, { area: !0, base: !0, br: !0, col: !0, embed: !0, hr: !0, img: !0, input: !0, keygen: !0, link: !0, meta: !0, param: !0, source: !0, track: !0, wbr: !0 });
        function Sa(e, t) {
          if (t) {
            if (sy[e] && (t.children != null || t.dangerouslySetInnerHTML != null)) throw Error(c(137, e, ""));
            if (t.dangerouslySetInnerHTML != null) {
              if (t.children != null) throw Error(c(60));
              if (!(typeof t.dangerouslySetInnerHTML == "object" && "__html" in t.dangerouslySetInnerHTML)) throw Error(c(61));
            }
            if (t.style != null && typeof t.style != "object") throw Error(c(62, ""));
          }
        }
        function Ta(e, t) {
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
        var cu = jc.html;
        function Wt(e, t) {
          e = e.nodeType === 9 || e.nodeType === 11 ? e : e.ownerDocument;
          var r = ha(e);
          t = A[t];
          for (var i = 0; i < t.length; i++) ya(t[i], e, r);
        }
        function Mo() {
        }
        function Oa(e) {
          if (e || (e = typeof document < "u" ? document : void 0), e === void 0) return null;
          try {
            return e.activeElement || e.body;
          } catch {
            return e.body;
          }
        }
        function uu(e) {
          for (; e && e.firstChild; ) e = e.firstChild;
          return e;
        }
        function du(e, t) {
          var r = uu(e);
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
            r = uu(r);
          }
        }
        function pu(e, t) {
          return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? pu(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
        }
        function fu() {
          for (var e = window, t = Oa(); t instanceof e.HTMLIFrameElement; ) {
            try {
              var r = typeof t.contentWindow.location.href == "string";
            } catch {
              r = !1;
            }
            if (r) e = t.contentWindow;
            else break;
            t = Oa(e.document);
          }
          return t;
        }
        function Na(e) {
          var t = e && e.nodeName && e.nodeName.toLowerCase();
          return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
        }
        var hu = "$", mu = "/$", Pa = "$?", Da = "$!", Ia = null, Ra = null;
        function gu(e, t) {
          switch (e) {
            case "button":
            case "input":
            case "select":
            case "textarea":
              return !!t.autoFocus;
          }
          return !1;
        }
        function Ma(e, t) {
          return e === "textarea" || e === "option" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
        }
        var Aa = typeof setTimeout == "function" ? setTimeout : void 0, ly = typeof clearTimeout == "function" ? clearTimeout : void 0;
        function er(e) {
          for (; e != null; e = e.nextSibling) {
            var t = e.nodeType;
            if (t === 1 || t === 3) break;
          }
          return e;
        }
        function yu(e) {
          e = e.previousSibling;
          for (var t = 0; e; ) {
            if (e.nodeType === 8) {
              var r = e.data;
              if (r === hu || r === Da || r === Pa) {
                if (t === 0) return e;
                t--;
              } else r === mu && t++;
            }
            e = e.previousSibling;
          }
          return null;
        }
        var za = Math.random().toString(36).slice(2), sn = "__reactInternalInstance$" + za, Ao = "__reactEventHandlers$" + za, Mr = "__reactContainere$" + za;
        function Ar(e) {
          var t = e[sn];
          if (t) return t;
          for (var r = e.parentNode; r; ) {
            if (t = r[Mr] || r[sn]) {
              if (r = t.alternate, t.child !== null || r !== null && r.child !== null) for (e = yu(e); e !== null; ) {
                if (r = e[sn]) return r;
                e = yu(e);
              }
              return t;
            }
            e = r, r = e.parentNode;
          }
          return null;
        }
        function zr(e) {
          return e = e[sn] || e[Mr], !e || e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3 ? null : e;
        }
        function Nn(e) {
          if (e.tag === 5 || e.tag === 6) return e.stateNode;
          throw Error(c(33));
        }
        function ja(e) {
          return e[Ao] || null;
        }
        function qt(e) {
          do
            e = e.return;
          while (e && e.tag !== 5);
          return e || null;
        }
        function bu(e, t) {
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
        function vu(e, t, r) {
          (t = bu(e, r.dispatchConfig.phasedRegistrationNames[t])) && (r._dispatchListeners = Jn(r._dispatchListeners, t), r._dispatchInstances = Jn(r._dispatchInstances, e));
        }
        function cy(e) {
          if (e && e.dispatchConfig.phasedRegistrationNames) {
            for (var t = e._targetInst, r = []; t; ) r.push(t), t = qt(t);
            for (t = r.length; 0 < t--; ) vu(r[t], "captured", e);
            for (t = 0; t < r.length; t++) vu(r[t], "bubbled", e);
          }
        }
        function La(e, t, r) {
          e && r && r.dispatchConfig.registrationName && (t = bu(e, r.dispatchConfig.registrationName)) && (r._dispatchListeners = Jn(r._dispatchListeners, t), r._dispatchInstances = Jn(r._dispatchInstances, e));
        }
        function uy(e) {
          e && e.dispatchConfig.registrationName && La(e._targetInst, null, e);
        }
        function tr(e) {
          ma(e, cy);
        }
        var ln = null, Ua = null, zo = null;
        function ku() {
          if (zo) return zo;
          var e, t = Ua, r = t.length, i, s = "value" in ln ? ln.value : ln.textContent, p = s.length;
          for (e = 0; e < r && t[e] === s[e]; e++) ;
          var f = r - e;
          for (i = 1; i <= f && t[r - i] === s[p - i]; i++) ;
          return zo = s.slice(e, 1 < i ? 1 - i : void 0);
        }
        function jo() {
          return !0;
        }
        function Lo() {
          return !1;
        }
        function yt(e, t, r, i) {
          for (var s in this.dispatchConfig = e, this._targetInst = t, this.nativeEvent = r, e = this.constructor.Interface, e) e.hasOwnProperty(s) && ((t = e[s]) ? this[s] = t(r) : s === "target" ? this.target = i : this[s] = r[s]);
          return this.isDefaultPrevented = (r.defaultPrevented == null ? r.returnValue === !1 : r.defaultPrevented) ? jo : Lo, this.isPropagationStopped = Lo, this;
        }
        a(yt.prototype, { preventDefault: function() {
          this.defaultPrevented = !0;
          var e = this.nativeEvent;
          e && (e.preventDefault ? e.preventDefault() : typeof e.returnValue != "unknown" && (e.returnValue = !1), this.isDefaultPrevented = jo);
        }, stopPropagation: function() {
          var e = this.nativeEvent;
          e && (e.stopPropagation ? e.stopPropagation() : typeof e.cancelBubble != "unknown" && (e.cancelBubble = !0), this.isPropagationStopped = jo);
        }, persist: function() {
          this.isPersistent = jo;
        }, isPersistent: Lo, destructor: function() {
          var e = this.constructor.Interface, t;
          for (t in e) this[t] = null;
          this.nativeEvent = this._targetInst = this.dispatchConfig = null, this.isPropagationStopped = this.isDefaultPrevented = Lo, this._dispatchInstances = this._dispatchListeners = null;
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
          return a(s, r.prototype), r.prototype = s, r.prototype.constructor = r, r.Interface = a({}, i.Interface, e), r.extend = i.extend, wu(r), r;
        }, wu(yt);
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
        function wu(e) {
          e.eventPool = [], e.getPooled = dy, e.release = py;
        }
        var fy = yt.extend({ data: null }), hy = yt.extend({ data: null }), my = [9, 13, 27, 32], Va = te && "CompositionEvent" in window, jr = null;
        te && "documentMode" in document && (jr = document.documentMode);
        var gy = te && "TextEvent" in window && !jr, Eu = te && (!Va || jr && 8 < jr && 11 >= jr), _u = " ", Kt = { beforeInput: { phasedRegistrationNames: { bubbled: "onBeforeInput", captured: "onBeforeInputCapture" }, dependencies: ["compositionend", "keypress", "textInput", "paste"] }, compositionEnd: { phasedRegistrationNames: { bubbled: "onCompositionEnd", captured: "onCompositionEndCapture" }, dependencies: "blur compositionend keydown keypress keyup mousedown".split(" ") }, compositionStart: { phasedRegistrationNames: { bubbled: "onCompositionStart", captured: "onCompositionStartCapture" }, dependencies: "blur compositionstart keydown keypress keyup mousedown".split(" ") }, compositionUpdate: { phasedRegistrationNames: { bubbled: "onCompositionUpdate", captured: "onCompositionUpdateCapture" }, dependencies: "blur compositionupdate keydown keypress keyup mousedown".split(" ") } }, xu = !1;
        function Cu(e, t) {
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
        function Su(e) {
          return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
        }
        var nr = !1;
        function yy(e, t) {
          switch (e) {
            case "compositionend":
              return Su(t);
            case "keypress":
              return t.which === 32 ? (xu = !0, _u) : null;
            case "textInput":
              return e = t.data, e === _u && xu ? null : e;
            default:
              return null;
          }
        }
        function by(e, t) {
          if (nr) return e === "compositionend" || !Va && Cu(e, t) ? (e = ku(), zo = Ua = ln = null, nr = !1, e) : null;
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
              return Eu && t.locale !== "ko" ? null : t.data;
            default:
              return null;
          }
        }
        var vy = { eventTypes: Kt, extractEvents: function(e, t, r, i) {
          var s;
          if (Va) e: {
            switch (e) {
              case "compositionstart":
                var p = Kt.compositionStart;
                break e;
              case "compositionend":
                p = Kt.compositionEnd;
                break e;
              case "compositionupdate":
                p = Kt.compositionUpdate;
                break e;
            }
            p = void 0;
          }
          else nr ? Cu(e, r) && (p = Kt.compositionEnd) : e === "keydown" && r.keyCode === 229 && (p = Kt.compositionStart);
          return p ? (Eu && r.locale !== "ko" && (nr || p !== Kt.compositionStart ? p === Kt.compositionEnd && nr && (s = ku()) : (ln = i, Ua = "value" in ln ? ln.value : ln.textContent, nr = !0)), p = fy.getPooled(p, t, r, i), s ? p.data = s : (s = Su(r), s !== null && (p.data = s)), tr(p), s = p) : s = null, (e = gy ? yy(e, r) : by(e, r)) ? (t = hy.getPooled(Kt.beforeInput, t, r, i), t.data = e, tr(t)) : t = null, s === null ? t : t === null ? s : [s, t];
        } }, ky = { color: !0, date: !0, datetime: !0, "datetime-local": !0, email: !0, month: !0, number: !0, password: !0, range: !0, search: !0, tel: !0, text: !0, time: !0, url: !0, week: !0 };
        function Tu(e) {
          var t = e && e.nodeName && e.nodeName.toLowerCase();
          return t === "input" ? !!ky[e.type] : t === "textarea";
        }
        var Ou = { change: { phasedRegistrationNames: { bubbled: "onChange", captured: "onChangeCapture" }, dependencies: "blur change click focus input keydown keyup selectionchange".split(" ") } };
        function Nu(e, t, r) {
          return e = yt.getPooled(Ou.change, e, t, r), e.type = "change", le(r), tr(e), e;
        }
        var Lr = null, Ur = null;
        function wy(e) {
          No(e);
        }
        function Uo(e) {
          if (Pc(Nn(e))) return e;
        }
        function Ey(e, t) {
          if (e === "change") return t;
        }
        var Fa = !1;
        te && (Fa = Yc("input") && (!document.documentMode || 9 < document.documentMode));
        function Pu() {
          Lr && (Lr.detachEvent("onpropertychange", Du), Ur = Lr = null);
        }
        function Du(e) {
          if (e.propertyName === "value" && Uo(Ur)) if (e = Nu(Ur, e, ga(e)), W) No(e);
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
          e === "focus" ? (Pu(), Lr = t, Ur = r, Lr.attachEvent("onpropertychange", Du)) : e === "blur" && Pu();
        }
        function xy(e) {
          if (e === "selectionchange" || e === "keyup" || e === "keydown") return Uo(Ur);
        }
        function Cy(e, t) {
          if (e === "click") return Uo(t);
        }
        function Sy(e, t) {
          if (e === "input" || e === "change") return Uo(t);
        }
        var Ty = { eventTypes: Ou, _isInputEventSupported: Fa, extractEvents: function(e, t, r, i) {
          var s = t ? Nn(t) : window, p = s.nodeName && s.nodeName.toLowerCase();
          if (p === "select" || p === "input" && s.type === "file") var f = Ey;
          else if (Tu(s)) if (Fa) f = Sy;
          else {
            f = xy;
            var _ = _y;
          }
          else (p = s.nodeName) && p.toLowerCase() === "input" && (s.type === "checkbox" || s.type === "radio") && (f = Cy);
          if (f && (f = f(e, t))) return Nu(f, r, i);
          _ && _(e, s, t), e === "blur" && (e = s._wrapperState) && e.controlled && s.type === "number" && la(s, "number", s.value);
        } }, Vr = yt.extend({ view: null, detail: null }), Oy = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
        function Ny(e) {
          var t = this.nativeEvent;
          return t.getModifierState ? t.getModifierState(e) : (e = Oy[e]) ? !!t[e] : !1;
        }
        function $a() {
          return Ny;
        }
        var Iu = 0, Ru = 0, Mu = !1, Au = !1, Fr = Vr.extend({ screenX: null, screenY: null, clientX: null, clientY: null, pageX: null, pageY: null, ctrlKey: null, shiftKey: null, altKey: null, metaKey: null, getModifierState: $a, button: null, buttons: null, relatedTarget: function(e) {
          return e.relatedTarget || (e.fromElement === e.srcElement ? e.toElement : e.fromElement);
        }, movementX: function(e) {
          if ("movementX" in e) return e.movementX;
          var t = Iu;
          return Iu = e.screenX, Mu ? e.type === "mousemove" ? e.screenX - t : 0 : (Mu = !0, 0);
        }, movementY: function(e) {
          if ("movementY" in e) return e.movementY;
          var t = Ru;
          return Ru = e.screenY, Au ? e.type === "mousemove" ? e.screenY - t : 0 : (Au = !0, 0);
        } }), zu = Fr.extend({ pointerId: null, width: null, height: null, pressure: null, tangentialPressure: null, tiltX: null, tiltY: null, twist: null, pointerType: null, isPrimary: null }), $r = { mouseEnter: { registrationName: "onMouseEnter", dependencies: ["mouseout", "mouseover"] }, mouseLeave: { registrationName: "onMouseLeave", dependencies: ["mouseout", "mouseover"] }, pointerEnter: { registrationName: "onPointerEnter", dependencies: ["pointerout", "pointerover"] }, pointerLeave: { registrationName: "onPointerLeave", dependencies: ["pointerout", "pointerover"] } }, Py = { eventTypes: $r, extractEvents: function(e, t, r, i, s) {
          var p = e === "mouseover" || e === "pointerover", f = e === "mouseout" || e === "pointerout";
          if (p && !(s & 32) && (r.relatedTarget || r.fromElement) || !f && !p) return null;
          if (p = i.window === i ? i : (p = i.ownerDocument) ? p.defaultView || p.parentWindow : window, f) {
            if (f = t, t = (t = r.relatedTarget || r.toElement) ? Ar(t) : null, t !== null) {
              var _ = On(t);
              (t !== _ || t.tag !== 5 && t.tag !== 6) && (t = null);
            }
          } else f = null;
          if (f === t) return null;
          if (e === "mouseout" || e === "mouseover") var F = Fr, H = $r.mouseLeave, me = $r.mouseEnter, be = "mouse";
          else (e === "pointerout" || e === "pointerover") && (F = zu, H = $r.pointerLeave, me = $r.pointerEnter, be = "pointer");
          if (e = f == null ? p : Nn(f), p = t == null ? p : Nn(t), H = F.getPooled(H, f, r, i), H.type = be + "leave", H.target = e, H.relatedTarget = p, r = F.getPooled(me, t, r, i), r.type = be + "enter", r.target = p, r.relatedTarget = e, i = f, be = t, i && be) e: {
            for (F = i, me = be, f = 0, e = F; e; e = qt(e)) f++;
            for (e = 0, t = me; t; t = qt(t)) e++;
            for (; 0 < f - e; ) F = qt(F), f--;
            for (; 0 < e - f; ) me = qt(me), e--;
            for (; f--; ) {
              if (F === me || F === me.alternate) break e;
              F = qt(F), me = qt(me);
            }
            F = null;
          }
          else F = null;
          for (me = F, F = []; i && i !== me && (f = i.alternate, !(f !== null && f === me)); ) F.push(i), i = qt(i);
          for (i = []; be && be !== me && (f = be.alternate, !(f !== null && f === me)); ) i.push(be), be = qt(be);
          for (be = 0; be < F.length; be++) La(F[be], "bubbled", H);
          for (be = i.length; 0 < be--; ) La(i[be], "captured", r);
          return s & 64 ? [H, r] : [H];
        } };
        function Dy(e, t) {
          return e === t && (e !== 0 || 1 / e == 1 / t) || e !== e && t !== t;
        }
        var Pn = typeof Object.is == "function" ? Object.is : Dy, Iy = Object.prototype.hasOwnProperty;
        function Hr(e, t) {
          if (Pn(e, t)) return !0;
          if (typeof e != "object" || !e || typeof t != "object" || !t) return !1;
          var r = Object.keys(e), i = Object.keys(t);
          if (r.length !== i.length) return !1;
          for (i = 0; i < r.length; i++) if (!Iy.call(t, r[i]) || !Pn(e[r[i]], t[r[i]])) return !1;
          return !0;
        }
        var Ry = te && "documentMode" in document && 11 >= document.documentMode, ju = { select: { phasedRegistrationNames: { bubbled: "onSelect", captured: "onSelectCapture" }, dependencies: "blur contextmenu dragend focus keydown keyup mousedown mouseup selectionchange".split(" ") } }, rr = null, Ha = null, Br = null, Ba = !1;
        function Lu(e, t) {
          var r = t.window === t ? t.document : t.nodeType === 9 ? t : t.ownerDocument;
          return Ba || rr == null || rr !== Oa(r) ? null : (r = rr, "selectionStart" in r && Na(r) ? r = { start: r.selectionStart, end: r.selectionEnd } : (r = (r.ownerDocument && r.ownerDocument.defaultView || window).getSelection(), r = { anchorNode: r.anchorNode, anchorOffset: r.anchorOffset, focusNode: r.focusNode, focusOffset: r.focusOffset }), Br && Hr(Br, r) ? null : (Br = r, e = yt.getPooled(ju.select, Ha, e, t), e.type = "select", e.target = rr, tr(e), e));
        }
        var My = { eventTypes: ju, extractEvents: function(e, t, r, i, s, p) {
          if (s = p || (i.window === i ? i.document : i.nodeType === 9 ? i : i.ownerDocument), !(p = !s)) {
            e: {
              s = ha(s), p = A.onSelect;
              for (var f = 0; f < p.length; f++) if (!s.has(p[f])) {
                s = !1;
                break e;
              }
              s = !0;
            }
            p = !s;
          }
          if (p) return null;
          switch (s = t ? Nn(t) : window, e) {
            case "focus":
              (Tu(s) || s.contentEditable === "true") && (rr = s, Ha = t, Br = null);
              break;
            case "blur":
              Br = Ha = rr = null;
              break;
            case "mousedown":
              Ba = !0;
              break;
            case "contextmenu":
            case "mouseup":
            case "dragend":
              return Ba = !1, Lu(r, i);
            case "selectionchange":
              if (Ry) break;
            case "keydown":
            case "keyup":
              return Lu(r, i);
          }
          return null;
        } }, Ay = yt.extend({ animationName: null, elapsedTime: null, pseudoElement: null }), zy = yt.extend({ clipboardData: function(e) {
          return "clipboardData" in e ? e.clipboardData : window.clipboardData;
        } }), jy = Vr.extend({ relatedTarget: null });
        function Vo(e) {
          var t = e.keyCode;
          return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
        }
        var Ly = { Esc: "Escape", Spacebar: " ", Left: "ArrowLeft", Up: "ArrowUp", Right: "ArrowRight", Down: "ArrowDown", Del: "Delete", Win: "OS", Menu: "ContextMenu", Apps: "ContextMenu", Scroll: "ScrollLock", MozPrintableKey: "Unidentified" }, Uy = { 8: "Backspace", 9: "Tab", 12: "Clear", 13: "Enter", 16: "Shift", 17: "Control", 18: "Alt", 19: "Pause", 20: "CapsLock", 27: "Escape", 32: " ", 33: "PageUp", 34: "PageDown", 35: "End", 36: "Home", 37: "ArrowLeft", 38: "ArrowUp", 39: "ArrowRight", 40: "ArrowDown", 45: "Insert", 46: "Delete", 112: "F1", 113: "F2", 114: "F3", 115: "F4", 116: "F5", 117: "F6", 118: "F7", 119: "F8", 120: "F9", 121: "F10", 122: "F11", 123: "F12", 144: "NumLock", 145: "ScrollLock", 224: "Meta" }, Vy = Vr.extend({ key: function(e) {
          if (e.key) {
            var t = Ly[e.key] || e.key;
            if (t !== "Unidentified") return t;
          }
          return e.type === "keypress" ? (e = Vo(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? Uy[e.keyCode] || "Unidentified" : "";
        }, location: null, ctrlKey: null, shiftKey: null, altKey: null, metaKey: null, repeat: null, locale: null, getModifierState: $a, charCode: function(e) {
          return e.type === "keypress" ? Vo(e) : 0;
        }, keyCode: function(e) {
          return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
        }, which: function(e) {
          return e.type === "keypress" ? Vo(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
        } }), Fy = Fr.extend({ dataTransfer: null }), $y = Vr.extend({ touches: null, targetTouches: null, changedTouches: null, altKey: null, metaKey: null, ctrlKey: null, shiftKey: null, getModifierState: $a }), Hy = yt.extend({ propertyName: null, elapsedTime: null, pseudoElement: null }), By = Fr.extend({ deltaX: function(e) {
          return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
        }, deltaY: function(e) {
          return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
        }, deltaZ: null, deltaMode: null }), Wy = { eventTypes: ou, extractEvents: function(e, t, r, i) {
          var s = iu.get(e);
          if (!s) return null;
          switch (e) {
            case "keypress":
              if (Vo(r) === 0) return null;
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
              e = Fr;
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
            case Fc:
            case $c:
            case Hc:
              e = Ay;
              break;
            case Bc:
              e = Hy;
              break;
            case "scroll":
              e = Vr;
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
              e = zu;
              break;
            default:
              e = yt;
          }
          return t = e.getPooled(s, t, r, i), tr(t), t;
        } };
        if (se) throw Error(c(101));
        se = Array.prototype.slice.call("ResponderEventPlugin SimpleEventPlugin EnterLeaveEventPlugin ChangeEventPlugin SelectEventPlugin BeforeInputEventPlugin".split(" ")), ae();
        var qy = zr;
        S = ja, O = qy, R = Nn, V({ SimpleEventPlugin: Wy, EnterLeaveEventPlugin: Py, ChangeEventPlugin: Ty, SelectEventPlugin: My, BeforeInputEventPlugin: vy });
        var Wa = [], or = -1;
        function Fe(e) {
          0 > or || (e.current = Wa[or], Wa[or] = null, or--);
        }
        function We(e, t) {
          or++, Wa[or] = e.current, e.current = t;
        }
        var cn = {}, lt = { current: cn }, pt = { current: !1 }, Dn = cn;
        function ir(e, t) {
          var r = e.type.contextTypes;
          if (!r) return cn;
          var i = e.stateNode;
          if (i && i.__reactInternalMemoizedUnmaskedChildContext === t) return i.__reactInternalMemoizedMaskedChildContext;
          var s = {}, p;
          for (p in r) s[p] = t[p];
          return i && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = t, e.__reactInternalMemoizedMaskedChildContext = s), s;
        }
        function ft(e) {
          return e = e.childContextTypes, e != null;
        }
        function Fo() {
          Fe(pt), Fe(lt);
        }
        function Uu(e, t, r) {
          if (lt.current !== cn) throw Error(c(168));
          We(lt, t), We(pt, r);
        }
        function Vu(e, t, r) {
          var i = e.stateNode;
          if (e = t.childContextTypes, typeof i.getChildContext != "function") return r;
          for (var s in i = i.getChildContext(), i) if (!(s in e)) throw Error(c(108, Bt(t) || "Unknown", s));
          return a({}, r, {}, i);
        }
        function $o(e) {
          return e = (e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext || cn, Dn = lt.current, We(lt, e), We(pt, pt.current), !0;
        }
        function Fu(e, t, r) {
          var i = e.stateNode;
          if (!i) throw Error(c(169));
          r ? (e = Vu(e, t, Dn), i.__reactInternalMemoizedMergedChildContext = e, Fe(pt), Fe(lt), We(lt, e)) : Fe(pt), We(pt, r);
        }
        var Ky = l.unstable_runWithPriority, qa = l.unstable_scheduleCallback, $u = l.unstable_cancelCallback, Hu = l.unstable_requestPaint, Ka = l.unstable_now, Qy = l.unstable_getCurrentPriorityLevel, Ho = l.unstable_ImmediatePriority, Bu = l.unstable_UserBlockingPriority, Wu = l.unstable_NormalPriority, qu = l.unstable_LowPriority, Ku = l.unstable_IdlePriority, Qu = {}, Yy = l.unstable_shouldYield, Gy = Hu === void 0 ? function() {
        } : Hu, Qt = null, Bo = null, Qa = !1, Yu = Ka(), _t = 1e4 > Yu ? Ka : function() {
          return Ka() - Yu;
        };
        function Wo() {
          switch (Qy()) {
            case Ho:
              return 99;
            case Bu:
              return 98;
            case Wu:
              return 97;
            case qu:
              return 96;
            case Ku:
              return 95;
            default:
              throw Error(c(332));
          }
        }
        function Gu(e) {
          switch (e) {
            case 99:
              return Ho;
            case 98:
              return Bu;
            case 97:
              return Wu;
            case 96:
              return qu;
            case 95:
              return Ku;
            default:
              throw Error(c(332));
          }
        }
        function un(e, t) {
          return e = Gu(e), Ky(e, t);
        }
        function Xu(e, t, r) {
          return e = Gu(e), qa(e, t, r);
        }
        function Zu(e) {
          return Qt === null ? (Qt = [e], Bo = qa(Ho, Ju)) : Qt.push(e), Qu;
        }
        function zt() {
          if (Bo !== null) {
            var e = Bo;
            Bo = null, $u(e);
          }
          Ju();
        }
        function Ju() {
          if (!Qa && Qt !== null) {
            Qa = !0;
            var e = 0;
            try {
              var t = Qt;
              un(99, function() {
                for (; e < t.length; e++) {
                  var r = t[e];
                  do
                    r = r(!0);
                  while (r !== null);
                }
              }), Qt = null;
            } catch (r) {
              throw Qt !== null && (Qt = Qt.slice(e + 1)), qa(Ho, zt), r;
            } finally {
              Qa = !1;
            }
          }
        }
        function qo(e, t, r) {
          return r /= 10, 1073741821 - (((1073741821 - e + t / 10) / r | 0) + 1) * r;
        }
        function Pt(e, t) {
          if (e && e.defaultProps) for (var r in t = a({}, t), e = e.defaultProps, e) t[r] === void 0 && (t[r] = e[r]);
          return t;
        }
        var Ko = { current: null }, Qo = null, ar = null, Yo = null;
        function Ya() {
          Yo = ar = Qo = null;
        }
        function Ga(e) {
          var t = Ko.current;
          Fe(Ko), e.type._context._currentValue = t;
        }
        function ed(e, t) {
          for (; e !== null; ) {
            var r = e.alternate;
            if (e.childExpirationTime < t) e.childExpirationTime = t, r !== null && r.childExpirationTime < t && (r.childExpirationTime = t);
            else if (r !== null && r.childExpirationTime < t) r.childExpirationTime = t;
            else break;
            e = e.return;
          }
        }
        function sr(e, t) {
          Qo = e, Yo = ar = null, e = e.dependencies, e !== null && e.firstContext !== null && (e.expirationTime >= t && (Lt = !0), e.firstContext = null);
        }
        function xt(e, t) {
          if (Yo !== e && t !== !1 && t !== 0) if ((typeof t != "number" || t === 1073741823) && (Yo = e, t = 1073741823), t = { context: e, observedBits: t, next: null }, ar === null) {
            if (Qo === null) throw Error(c(308));
            ar = t, Qo.dependencies = { expirationTime: 0, firstContext: t, responders: null };
          } else ar = ar.next = t;
          return e._currentValue;
        }
        var dn = !1;
        function Xa(e) {
          e.updateQueue = { baseState: e.memoizedState, baseQueue: null, shared: { pending: null }, effects: null };
        }
        function Za(e, t) {
          e = e.updateQueue, t.updateQueue === e && (t.updateQueue = { baseState: e.baseState, baseQueue: e.baseQueue, shared: e.shared, effects: e.effects });
        }
        function pn(e, t) {
          return e = { expirationTime: e, suspenseConfig: t, tag: 0, payload: null, callback: null, next: null }, e.next = e;
        }
        function fn(e, t) {
          if (e = e.updateQueue, e !== null) {
            e = e.shared;
            var r = e.pending;
            r === null ? t.next = t : (t.next = r.next, r.next = t), e.pending = t;
          }
        }
        function td(e, t) {
          var r = e.alternate;
          r !== null && Za(r, e), e = e.updateQueue, r = e.baseQueue, r === null ? (e.baseQueue = t.next = t, t.next = t) : (t.next = r.next, r.next = t);
        }
        function Wr(e, t, r, i) {
          var s = e.updateQueue;
          dn = !1;
          var p = s.baseQueue, f = s.shared.pending;
          if (f !== null) {
            if (p !== null) {
              var _ = p.next;
              p.next = f.next, f.next = _;
            }
            p = f, s.shared.pending = null, _ = e.alternate, _ !== null && (_ = _.updateQueue, _ !== null && (_.baseQueue = f));
          }
          if (p !== null) {
            _ = p.next;
            var F = s.baseState, H = 0, me = null, be = null, Ae = null;
            if (_ !== null) {
              var je = _;
              do {
                if (f = je.expirationTime, f < i) {
                  var St = { expirationTime: je.expirationTime, suspenseConfig: je.suspenseConfig, tag: je.tag, payload: je.payload, callback: je.callback, next: null };
                  Ae === null ? (be = Ae = St, me = F) : Ae = Ae.next = St, f > H && (H = f);
                } else {
                  Ae !== null && (Ae = Ae.next = { expirationTime: 1073741823, suspenseConfig: je.suspenseConfig, tag: je.tag, payload: je.payload, callback: je.callback, next: null }), Qd(f, je.suspenseConfig);
                  e: {
                    var ot = e, j = je;
                    switch (f = t, St = r, j.tag) {
                      case 1:
                        if (ot = j.payload, typeof ot == "function") {
                          F = ot.call(St, F, f);
                          break e;
                        }
                        F = ot;
                        break e;
                      case 3:
                        ot.effectTag = ot.effectTag & -4097 | 64;
                      case 0:
                        if (ot = j.payload, f = typeof ot == "function" ? ot.call(St, F, f) : ot, f == null) break e;
                        F = a({}, F, f);
                        break e;
                      case 2:
                        dn = !0;
                    }
                  }
                  je.callback !== null && (e.effectTag |= 32, f = s.effects, f === null ? s.effects = [je] : f.push(je));
                }
                if (je = je.next, je === null || je === _) {
                  if (f = s.shared.pending, f === null) break;
                  je = p.next = f.next, f.next = _, s.baseQueue = p = f, s.shared.pending = null;
                }
              } while (!0);
            }
            Ae === null ? me = F : Ae.next = be, s.baseState = me, s.baseQueue = Ae, Ei(H), e.expirationTime = H, e.memoizedState = F;
          }
        }
        function nd(e, t, r) {
          if (e = t.effects, t.effects = null, e !== null) for (t = 0; t < e.length; t++) {
            var i = e[t], s = i.callback;
            if (s !== null) {
              if (i.callback = null, i = s, s = r, typeof i != "function") throw Error(c(191, i));
              i.call(s);
            }
          }
        }
        var qr = Qe.ReactCurrentBatchConfig, rd = new o.Component().refs;
        function Go(e, t, r, i) {
          t = e.memoizedState, r = r(i, t), r = r == null ? t : a({}, t, r), e.memoizedState = r, e.expirationTime === 0 && (e.updateQueue.baseState = r);
        }
        var Xo = { isMounted: function(e) {
          return (e = e._reactInternalFiber) ? On(e) === e : !1;
        }, enqueueSetState: function(e, t, r) {
          e = e._reactInternalFiber;
          var i = Vt(), s = qr.suspense;
          i = jn(i, e, s), s = pn(i, s), s.payload = t, r != null && (s.callback = r), fn(e, s), yn(e, i);
        }, enqueueReplaceState: function(e, t, r) {
          e = e._reactInternalFiber;
          var i = Vt(), s = qr.suspense;
          i = jn(i, e, s), s = pn(i, s), s.tag = 1, s.payload = t, r != null && (s.callback = r), fn(e, s), yn(e, i);
        }, enqueueForceUpdate: function(e, t) {
          e = e._reactInternalFiber;
          var r = Vt(), i = qr.suspense;
          r = jn(r, e, i), i = pn(r, i), i.tag = 2, t != null && (i.callback = t), fn(e, i), yn(e, r);
        } };
        function od(e, t, r, i, s, p, f) {
          return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(i, p, f) : t.prototype && t.prototype.isPureReactComponent ? !Hr(r, i) || !Hr(s, p) : !0;
        }
        function id(e, t, r) {
          var i = !1, s = cn, p = t.contextType;
          return typeof p == "object" && p ? p = xt(p) : (s = ft(t) ? Dn : lt.current, i = t.contextTypes, p = (i = i != null) ? ir(e, s) : cn), t = new t(r, p), e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null, t.updater = Xo, e.stateNode = t, t._reactInternalFiber = e, i && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = s, e.__reactInternalMemoizedMaskedChildContext = p), t;
        }
        function ad(e, t, r, i) {
          e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(r, i), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(r, i), t.state !== e && Xo.enqueueReplaceState(t, t.state, null);
        }
        function Ja(e, t, r, i) {
          var s = e.stateNode;
          s.props = r, s.state = e.memoizedState, s.refs = rd, Xa(e);
          var p = t.contextType;
          typeof p == "object" && p ? s.context = xt(p) : (p = ft(t) ? Dn : lt.current, s.context = ir(e, p)), Wr(e, r, s, i), s.state = e.memoizedState, p = t.getDerivedStateFromProps, typeof p == "function" && (Go(e, t, p, r), s.state = e.memoizedState), typeof t.getDerivedStateFromProps == "function" || typeof s.getSnapshotBeforeUpdate == "function" || typeof s.UNSAFE_componentWillMount != "function" && typeof s.componentWillMount != "function" || (t = s.state, typeof s.componentWillMount == "function" && s.componentWillMount(), typeof s.UNSAFE_componentWillMount == "function" && s.UNSAFE_componentWillMount(), t !== s.state && Xo.enqueueReplaceState(s, s.state, null), Wr(e, r, s, i), s.state = e.memoizedState), typeof s.componentDidMount == "function" && (e.effectTag |= 4);
        }
        var Zo = Array.isArray;
        function Kr(e, t, r) {
          if (e = r.ref, e !== null && typeof e != "function" && typeof e != "object") {
            if (r._owner) {
              if (r = r._owner, r) {
                if (r.tag !== 1) throw Error(c(309));
                var i = r.stateNode;
              }
              if (!i) throw Error(c(147, e));
              var s = "" + e;
              return t !== null && t.ref !== null && typeof t.ref == "function" && t.ref._stringRef === s ? t.ref : (t = function(p) {
                var f = i.refs;
                f === rd && (f = i.refs = {}), p === null ? delete f[s] : f[s] = p;
              }, t._stringRef = s, t);
            }
            if (typeof e != "string") throw Error(c(284));
            if (!r._owner) throw Error(c(290, e));
          }
          return e;
        }
        function Jo(e, t) {
          if (e.type !== "textarea") throw Error(c(31, Object.prototype.toString.call(t) === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : t, ""));
        }
        function sd(e) {
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
            return j = Fn(j, I), j.index = 0, j.sibling = null, j;
          }
          function p(j, I, Q) {
            return j.index = Q, e ? (Q = j.alternate, Q === null ? (j.effectTag = 2, I) : (Q = Q.index, Q < I ? (j.effectTag = 2, I) : Q)) : I;
          }
          function f(j) {
            return e && j.alternate === null && (j.effectTag = 2), j;
          }
          function _(j, I, Q, ce) {
            return I === null || I.tag !== 6 ? (I = Rs(Q, j.mode, ce), I.return = j, I) : (I = s(I, Q), I.return = j, I);
          }
          function F(j, I, Q, ce) {
            return I !== null && I.elementType === Q.type ? (ce = s(I, Q.props), ce.ref = Kr(j, I, Q), ce.return = j, ce) : (ce = _i(Q.type, Q.key, Q.props, null, j.mode, ce), ce.ref = Kr(j, I, Q), ce.return = j, ce);
          }
          function H(j, I, Q, ce) {
            return I === null || I.tag !== 4 || I.stateNode.containerInfo !== Q.containerInfo || I.stateNode.implementation !== Q.implementation ? (I = Ms(Q, j.mode, ce), I.return = j, I) : (I = s(I, Q.children || []), I.return = j, I);
          }
          function me(j, I, Q, ce, fe) {
            return I === null || I.tag !== 7 ? (I = bn(Q, j.mode, ce, fe), I.return = j, I) : (I = s(I, Q), I.return = j, I);
          }
          function be(j, I, Q) {
            if (typeof I == "string" || typeof I == "number") return I = Rs("" + I, j.mode, Q), I.return = j, I;
            if (typeof I == "object" && I) {
              switch (I.$$typeof) {
                case _o:
                  return Q = _i(I.type, I.key, I.props, null, j.mode, Q), Q.ref = Kr(j, null, I), Q.return = j, Q;
                case Gn:
                  return I = Ms(I, j.mode, Q), I.return = j, I;
              }
              if (Zo(I) || _r(I)) return I = bn(I, j.mode, Q, null), I.return = j, I;
              Jo(j, I);
            }
            return null;
          }
          function Ae(j, I, Q, ce) {
            var fe = I === null ? null : I.key;
            if (typeof Q == "string" || typeof Q == "number") return fe === null ? _(j, I, "" + Q, ce) : null;
            if (typeof Q == "object" && Q) {
              switch (Q.$$typeof) {
                case _o:
                  return Q.key === fe ? Q.type === Tn ? me(j, I, Q.props.children, ce, fe) : F(j, I, Q, ce) : null;
                case Gn:
                  return Q.key === fe ? H(j, I, Q, ce) : null;
              }
              if (Zo(Q) || _r(Q)) return fe === null ? me(j, I, Q, ce, null) : null;
              Jo(j, Q);
            }
            return null;
          }
          function je(j, I, Q, ce, fe) {
            if (typeof ce == "string" || typeof ce == "number") return j = j.get(Q) || null, _(I, j, "" + ce, fe);
            if (typeof ce == "object" && ce) {
              switch (ce.$$typeof) {
                case _o:
                  return j = j.get(ce.key === null ? Q : ce.key) || null, ce.type === Tn ? me(I, j, ce.props.children, fe, ce.key) : F(I, j, ce, fe);
                case Gn:
                  return j = j.get(ce.key === null ? Q : ce.key) || null, H(I, j, ce, fe);
              }
              if (Zo(ce) || _r(ce)) return j = j.get(Q) || null, me(I, j, ce, fe, null);
              Jo(I, ce);
            }
            return null;
          }
          function St(j, I, Q, ce) {
            for (var fe = null, ve = null, Ce = I, ze = I = 0, He = null; Ce !== null && ze < Q.length; ze++) {
              Ce.index > ze ? (He = Ce, Ce = null) : He = Ce.sibling;
              var Me = Ae(j, Ce, Q[ze], ce);
              if (Me === null) {
                Ce === null && (Ce = He);
                break;
              }
              e && Ce && Me.alternate === null && t(j, Ce), I = p(Me, I, ze), ve === null ? fe = Me : ve.sibling = Me, ve = Me, Ce = He;
            }
            if (ze === Q.length) return r(j, Ce), fe;
            if (Ce === null) {
              for (; ze < Q.length; ze++) Ce = be(j, Q[ze], ce), Ce !== null && (I = p(Ce, I, ze), ve === null ? fe = Ce : ve.sibling = Ce, ve = Ce);
              return fe;
            }
            for (Ce = i(j, Ce); ze < Q.length; ze++) He = je(Ce, j, ze, Q[ze], ce), He !== null && (e && He.alternate !== null && Ce.delete(He.key === null ? ze : He.key), I = p(He, I, ze), ve === null ? fe = He : ve.sibling = He, ve = He);
            return e && Ce.forEach(function(vn) {
              return t(j, vn);
            }), fe;
          }
          function ot(j, I, Q, ce) {
            var fe = _r(Q);
            if (typeof fe != "function") throw Error(c(150));
            if (Q = fe.call(Q), Q == null) throw Error(c(151));
            for (var ve = fe = null, Ce = I, ze = I = 0, He = null, Me = Q.next(); Ce !== null && !Me.done; ze++, Me = Q.next()) {
              Ce.index > ze ? (He = Ce, Ce = null) : He = Ce.sibling;
              var vn = Ae(j, Ce, Me.value, ce);
              if (vn === null) {
                Ce === null && (Ce = He);
                break;
              }
              e && Ce && vn.alternate === null && t(j, Ce), I = p(vn, I, ze), ve === null ? fe = vn : ve.sibling = vn, ve = vn, Ce = He;
            }
            if (Me.done) return r(j, Ce), fe;
            if (Ce === null) {
              for (; !Me.done; ze++, Me = Q.next()) Me = be(j, Me.value, ce), Me !== null && (I = p(Me, I, ze), ve === null ? fe = Me : ve.sibling = Me, ve = Me);
              return fe;
            }
            for (Ce = i(j, Ce); !Me.done; ze++, Me = Q.next()) Me = je(Ce, j, ze, Me.value, ce), Me !== null && (e && Me.alternate !== null && Ce.delete(Me.key === null ? ze : Me.key), I = p(Me, I, ze), ve === null ? fe = Me : ve.sibling = Me, ve = Me);
            return e && Ce.forEach(function(Ob) {
              return t(j, Ob);
            }), fe;
          }
          return function(j, I, Q, ce) {
            var fe = typeof Q == "object" && !!Q && Q.type === Tn && Q.key === null;
            fe && (Q = Q.props.children);
            var ve = typeof Q == "object" && !!Q;
            if (ve) switch (Q.$$typeof) {
              case _o:
                e: {
                  for (ve = Q.key, fe = I; fe !== null; ) {
                    if (fe.key === ve) {
                      switch (fe.tag) {
                        case 7:
                          if (Q.type === Tn) {
                            r(j, fe.sibling), I = s(fe, Q.props.children), I.return = j, j = I;
                            break e;
                          }
                          break;
                        default:
                          if (fe.elementType === Q.type) {
                            r(j, fe.sibling), I = s(fe, Q.props), I.ref = Kr(j, fe, Q), I.return = j, j = I;
                            break e;
                          }
                      }
                      r(j, fe);
                      break;
                    } else t(j, fe);
                    fe = fe.sibling;
                  }
                  Q.type === Tn ? (I = bn(Q.props.children, j.mode, ce, Q.key), I.return = j, j = I) : (ce = _i(Q.type, Q.key, Q.props, null, j.mode, ce), ce.ref = Kr(j, I, Q), ce.return = j, j = ce);
                }
                return f(j);
              case Gn:
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
                  I = Ms(Q, j.mode, ce), I.return = j, j = I;
                }
                return f(j);
            }
            if (typeof Q == "string" || typeof Q == "number") return Q = "" + Q, I !== null && I.tag === 6 ? (r(j, I.sibling), I = s(I, Q), I.return = j, j = I) : (r(j, I), I = Rs(Q, j.mode, ce), I.return = j, j = I), f(j);
            if (Zo(Q)) return St(j, I, Q, ce);
            if (_r(Q)) return ot(j, I, Q, ce);
            if (ve && Jo(j, Q), Q === void 0 && !fe) switch (j.tag) {
              case 1:
              case 0:
                throw j = j.type, Error(c(152, j.displayName || j.name || "Component"));
            }
            return r(j, I);
          };
        }
        var lr = sd(!0), es = sd(!1), Qr = {}, jt = { current: Qr }, Yr = { current: Qr }, Gr = { current: Qr };
        function In(e) {
          if (e === Qr) throw Error(c(174));
          return e;
        }
        function ts(e, t) {
          switch (We(Gr, t), We(Yr, e), We(jt, Qr), e = t.nodeType, e) {
            case 9:
            case 11:
              t = (t = t.documentElement) ? t.namespaceURI : da(null, "");
              break;
            default:
              e = e === 8 ? t.parentNode : t, t = e.namespaceURI || null, e = e.tagName, t = da(t, e);
          }
          Fe(jt), We(jt, t);
        }
        function cr() {
          Fe(jt), Fe(Yr), Fe(Gr);
        }
        function ld(e) {
          In(Gr.current);
          var t = In(jt.current), r = da(t, e.type);
          t !== r && (We(Yr, e), We(jt, r));
        }
        function ns(e) {
          Yr.current === e && (Fe(jt), Fe(Yr));
        }
        var Be = { current: 0 };
        function ei(e) {
          for (var t = e; t !== null; ) {
            if (t.tag === 13) {
              var r = t.memoizedState;
              if (r !== null && (r = r.dehydrated, r === null || r.data === Pa || r.data === Da)) return t;
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
        function rs(e, t) {
          return { responder: e, props: t };
        }
        var ti = Qe.ReactCurrentDispatcher, Ct = Qe.ReactCurrentBatchConfig, hn = 0, Ze = null, ct = null, ut = null, ni = !1;
        function bt() {
          throw Error(c(321));
        }
        function os(e, t) {
          if (t === null) return !1;
          for (var r = 0; r < t.length && r < e.length; r++) if (!Pn(e[r], t[r])) return !1;
          return !0;
        }
        function is(e, t, r, i, s, p) {
          if (hn = p, Ze = t, t.memoizedState = null, t.updateQueue = null, t.expirationTime = 0, ti.current = e === null || e.memoizedState === null ? Xy : Zy, e = r(i, s), t.expirationTime === hn) {
            p = 0;
            do {
              if (t.expirationTime = 0, !(25 > p)) throw Error(c(301));
              p += 1, ut = ct = null, t.updateQueue = null, ti.current = Jy, e = r(i, s);
            } while (t.expirationTime === hn);
          }
          if (ti.current = si, t = ct !== null && ct.next !== null, hn = 0, ut = ct = Ze = null, ni = !1, t) throw Error(c(300));
          return e;
        }
        function ur() {
          var e = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
          return ut === null ? Ze.memoizedState = ut = e : ut = ut.next = e, ut;
        }
        function dr() {
          if (ct === null) {
            var e = Ze.alternate;
            e = e === null ? null : e.memoizedState;
          } else e = ct.next;
          var t = ut === null ? Ze.memoizedState : ut.next;
          if (t !== null) ut = t, ct = e;
          else {
            if (e === null) throw Error(c(310));
            ct = e, e = { memoizedState: ct.memoizedState, baseState: ct.baseState, baseQueue: ct.baseQueue, queue: ct.queue, next: null }, ut === null ? Ze.memoizedState = ut = e : ut = ut.next = e;
          }
          return ut;
        }
        function Rn(e, t) {
          return typeof t == "function" ? t(e) : t;
        }
        function ri(e) {
          var t = dr(), r = t.queue;
          if (r === null) throw Error(c(311));
          r.lastRenderedReducer = e;
          var i = ct, s = i.baseQueue, p = r.pending;
          if (p !== null) {
            if (s !== null) {
              var f = s.next;
              s.next = p.next, p.next = f;
            }
            i.baseQueue = s = p, r.pending = null;
          }
          if (s !== null) {
            s = s.next, i = i.baseState;
            var _ = f = p = null, F = s;
            do {
              var H = F.expirationTime;
              if (H < hn) {
                var me = { expirationTime: F.expirationTime, suspenseConfig: F.suspenseConfig, action: F.action, eagerReducer: F.eagerReducer, eagerState: F.eagerState, next: null };
                _ === null ? (f = _ = me, p = i) : _ = _.next = me, H > Ze.expirationTime && (Ze.expirationTime = H, Ei(H));
              } else _ !== null && (_ = _.next = { expirationTime: 1073741823, suspenseConfig: F.suspenseConfig, action: F.action, eagerReducer: F.eagerReducer, eagerState: F.eagerState, next: null }), Qd(H, F.suspenseConfig), i = F.eagerReducer === e ? F.eagerState : e(i, F.action);
              F = F.next;
            } while (F !== null && F !== s);
            _ === null ? p = i : _.next = f, Pn(i, t.memoizedState) || (Lt = !0), t.memoizedState = i, t.baseState = p, t.baseQueue = _, r.lastRenderedState = i;
          }
          return [t.memoizedState, r.dispatch];
        }
        function oi(e) {
          var t = dr(), r = t.queue;
          if (r === null) throw Error(c(311));
          r.lastRenderedReducer = e;
          var i = r.dispatch, s = r.pending, p = t.memoizedState;
          if (s !== null) {
            r.pending = null;
            var f = s = s.next;
            do
              p = e(p, f.action), f = f.next;
            while (f !== s);
            Pn(p, t.memoizedState) || (Lt = !0), t.memoizedState = p, t.baseQueue === null && (t.baseState = p), r.lastRenderedState = p;
          }
          return [p, i];
        }
        function as(e) {
          var t = ur();
          return typeof e == "function" && (e = e()), t.memoizedState = t.baseState = e, e = t.queue = { pending: null, dispatch: null, lastRenderedReducer: Rn, lastRenderedState: e }, e = e.dispatch = gd.bind(null, Ze, e), [t.memoizedState, e];
        }
        function ss(e, t, r, i) {
          return e = { tag: e, create: t, destroy: r, deps: i, next: null }, t = Ze.updateQueue, t === null ? (t = { lastEffect: null }, Ze.updateQueue = t, t.lastEffect = e.next = e) : (r = t.lastEffect, r === null ? t.lastEffect = e.next = e : (i = r.next, r.next = e, e.next = i, t.lastEffect = e)), e;
        }
        function cd() {
          return dr().memoizedState;
        }
        function ls(e, t, r, i) {
          var s = ur();
          Ze.effectTag |= e, s.memoizedState = ss(1 | t, r, void 0, i === void 0 ? null : i);
        }
        function cs(e, t, r, i) {
          var s = dr();
          i = i === void 0 ? null : i;
          var p = void 0;
          if (ct !== null) {
            var f = ct.memoizedState;
            if (p = f.destroy, i !== null && os(i, f.deps)) {
              ss(t, r, p, i);
              return;
            }
          }
          Ze.effectTag |= e, s.memoizedState = ss(1 | t, r, p, i);
        }
        function ud(e, t) {
          return ls(516, 4, e, t);
        }
        function ii(e, t) {
          return cs(516, 4, e, t);
        }
        function dd(e, t) {
          return cs(4, 2, e, t);
        }
        function pd(e, t) {
          if (typeof t == "function") return e = e(), t(e), function() {
            t(null);
          };
          if (t != null) return e = e(), t.current = e, function() {
            t.current = null;
          };
        }
        function fd(e, t, r) {
          return r = r == null ? null : r.concat([e]), cs(4, 2, pd.bind(null, t, e), r);
        }
        function us() {
        }
        function hd(e, t) {
          return ur().memoizedState = [e, t === void 0 ? null : t], e;
        }
        function ai(e, t) {
          var r = dr();
          t = t === void 0 ? null : t;
          var i = r.memoizedState;
          return i !== null && t !== null && os(t, i[1]) ? i[0] : (r.memoizedState = [e, t], e);
        }
        function md(e, t) {
          var r = dr();
          t = t === void 0 ? null : t;
          var i = r.memoizedState;
          return i !== null && t !== null && os(t, i[1]) ? i[0] : (e = e(), r.memoizedState = [e, t], e);
        }
        function ds(e, t, r) {
          var i = Wo();
          un(98 > i ? 98 : i, function() {
            e(!0);
          }), un(97 < i ? 97 : i, function() {
            var s = Ct.suspense;
            Ct.suspense = t === void 0 ? null : t;
            try {
              e(!1), r();
            } finally {
              Ct.suspense = s;
            }
          });
        }
        function gd(e, t, r) {
          var i = Vt(), s = qr.suspense;
          i = jn(i, e, s), s = { expirationTime: i, suspenseConfig: s, action: r, eagerReducer: null, eagerState: null, next: null };
          var p = t.pending;
          if (p === null ? s.next = s : (s.next = p.next, p.next = s), t.pending = s, p = e.alternate, e === Ze || p !== null && p === Ze) ni = !0, s.expirationTime = hn, Ze.expirationTime = hn;
          else {
            if (e.expirationTime === 0 && (p === null || p.expirationTime === 0) && (p = t.lastRenderedReducer, p !== null)) try {
              var f = t.lastRenderedState, _ = p(f, r);
              if (s.eagerReducer = p, s.eagerState = _, Pn(_, f)) return;
            } catch {
            }
            yn(e, i);
          }
        }
        var si = { readContext: xt, useCallback: bt, useContext: bt, useEffect: bt, useImperativeHandle: bt, useLayoutEffect: bt, useMemo: bt, useReducer: bt, useRef: bt, useState: bt, useDebugValue: bt, useResponder: bt, useDeferredValue: bt, useTransition: bt }, Xy = { readContext: xt, useCallback: hd, useContext: xt, useEffect: ud, useImperativeHandle: function(e, t, r) {
          return r = r == null ? null : r.concat([e]), ls(4, 2, pd.bind(null, t, e), r);
        }, useLayoutEffect: function(e, t) {
          return ls(4, 2, e, t);
        }, useMemo: function(e, t) {
          var r = ur();
          return t = t === void 0 ? null : t, e = e(), r.memoizedState = [e, t], e;
        }, useReducer: function(e, t, r) {
          var i = ur();
          return t = r === void 0 ? t : r(t), i.memoizedState = i.baseState = t, e = i.queue = { pending: null, dispatch: null, lastRenderedReducer: e, lastRenderedState: t }, e = e.dispatch = gd.bind(null, Ze, e), [i.memoizedState, e];
        }, useRef: function(e) {
          var t = ur();
          return e = { current: e }, t.memoizedState = e;
        }, useState: as, useDebugValue: us, useResponder: rs, useDeferredValue: function(e, t) {
          var r = as(e), i = r[0], s = r[1];
          return ud(function() {
            var p = Ct.suspense;
            Ct.suspense = t === void 0 ? null : t;
            try {
              s(e);
            } finally {
              Ct.suspense = p;
            }
          }, [e, t]), i;
        }, useTransition: function(e) {
          var t = as(!1), r = t[0];
          return t = t[1], [hd(ds.bind(null, t, e), [t, e]), r];
        } }, Zy = { readContext: xt, useCallback: ai, useContext: xt, useEffect: ii, useImperativeHandle: fd, useLayoutEffect: dd, useMemo: md, useReducer: ri, useRef: cd, useState: function() {
          return ri(Rn);
        }, useDebugValue: us, useResponder: rs, useDeferredValue: function(e, t) {
          var r = ri(Rn), i = r[0], s = r[1];
          return ii(function() {
            var p = Ct.suspense;
            Ct.suspense = t === void 0 ? null : t;
            try {
              s(e);
            } finally {
              Ct.suspense = p;
            }
          }, [e, t]), i;
        }, useTransition: function(e) {
          var t = ri(Rn), r = t[0];
          return t = t[1], [ai(ds.bind(null, t, e), [t, e]), r];
        } }, Jy = { readContext: xt, useCallback: ai, useContext: xt, useEffect: ii, useImperativeHandle: fd, useLayoutEffect: dd, useMemo: md, useReducer: oi, useRef: cd, useState: function() {
          return oi(Rn);
        }, useDebugValue: us, useResponder: rs, useDeferredValue: function(e, t) {
          var r = oi(Rn), i = r[0], s = r[1];
          return ii(function() {
            var p = Ct.suspense;
            Ct.suspense = t === void 0 ? null : t;
            try {
              s(e);
            } finally {
              Ct.suspense = p;
            }
          }, [e, t]), i;
        }, useTransition: function(e) {
          var t = oi(Rn), r = t[0];
          return t = t[1], [ai(ds.bind(null, t, e), [t, e]), r];
        } }, Yt = null, mn = null, Mn = !1;
        function yd(e, t) {
          var r = Ft(5, null, null, 0);
          r.elementType = "DELETED", r.type = "DELETED", r.stateNode = t, r.return = e, r.effectTag = 8, e.lastEffect === null ? e.firstEffect = e.lastEffect = r : (e.lastEffect.nextEffect = r, e.lastEffect = r);
        }
        function bd(e, t) {
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
        function ps(e) {
          if (Mn) {
            var t = mn;
            if (t) {
              var r = t;
              if (!bd(e, t)) {
                if (t = er(r.nextSibling), !t || !bd(e, t)) {
                  e.effectTag = e.effectTag & -1025 | 2, Mn = !1, Yt = e;
                  return;
                }
                yd(Yt, r);
              }
              Yt = e, mn = er(t.firstChild);
            } else e.effectTag = e.effectTag & -1025 | 2, Mn = !1, Yt = e;
          }
        }
        function vd(e) {
          for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13; ) e = e.return;
          Yt = e;
        }
        function li(e) {
          if (e !== Yt) return !1;
          if (!Mn) return vd(e), Mn = !0, !1;
          var t = e.type;
          if (e.tag !== 5 || t !== "head" && t !== "body" && !Ma(t, e.memoizedProps)) for (t = mn; t; ) yd(e, t), t = er(t.nextSibling);
          if (vd(e), e.tag === 13) {
            if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(c(317));
            e: {
              for (e = e.nextSibling, t = 0; e; ) {
                if (e.nodeType === 8) {
                  var r = e.data;
                  if (r === mu) {
                    if (t === 0) {
                      mn = er(e.nextSibling);
                      break e;
                    }
                    t--;
                  } else r !== hu && r !== Da && r !== Pa || t++;
                }
                e = e.nextSibling;
              }
              mn = null;
            }
          } else mn = Yt ? er(e.stateNode.nextSibling) : null;
          return !0;
        }
        function fs() {
          mn = Yt = null, Mn = !1;
        }
        var eb = Qe.ReactCurrentOwner, Lt = !1;
        function vt(e, t, r, i) {
          t.child = e === null ? es(t, null, r, i) : lr(t, e.child, r, i);
        }
        function kd(e, t, r, i, s) {
          r = r.render;
          var p = t.ref;
          return sr(t, s), i = is(e, t, r, i, p, s), e !== null && !Lt ? (t.updateQueue = e.updateQueue, t.effectTag &= -517, e.expirationTime <= s && (e.expirationTime = 0), Gt(e, t, s)) : (t.effectTag |= 1, vt(e, t, i, s), t.child);
        }
        function wd(e, t, r, i, s, p) {
          if (e === null) {
            var f = r.type;
            return typeof f == "function" && !Is(f) && f.defaultProps === void 0 && r.compare === null && r.defaultProps === void 0 ? (t.tag = 15, t.type = f, Ed(e, t, f, i, s, p)) : (e = _i(r.type, null, i, null, t.mode, p), e.ref = t.ref, e.return = t, t.child = e);
          }
          return f = e.child, s < p && (s = f.memoizedProps, r = r.compare, r = r === null ? Hr : r, r(s, i) && e.ref === t.ref) ? Gt(e, t, p) : (t.effectTag |= 1, e = Fn(f, i), e.ref = t.ref, e.return = t, t.child = e);
        }
        function Ed(e, t, r, i, s, p) {
          return e !== null && Hr(e.memoizedProps, i) && e.ref === t.ref && (Lt = !1, s < p) ? (t.expirationTime = e.expirationTime, Gt(e, t, p)) : hs(e, t, r, i, p);
        }
        function _d(e, t) {
          var r = t.ref;
          (e === null && r !== null || e !== null && e.ref !== r) && (t.effectTag |= 128);
        }
        function hs(e, t, r, i, s) {
          var p = ft(r) ? Dn : lt.current;
          return p = ir(t, p), sr(t, s), r = is(e, t, r, i, p, s), e !== null && !Lt ? (t.updateQueue = e.updateQueue, t.effectTag &= -517, e.expirationTime <= s && (e.expirationTime = 0), Gt(e, t, s)) : (t.effectTag |= 1, vt(e, t, r, s), t.child);
        }
        function xd(e, t, r, i, s) {
          if (ft(r)) {
            var p = !0;
            $o(t);
          } else p = !1;
          if (sr(t, s), t.stateNode === null) e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= 2), id(t, r, i), Ja(t, r, i, s), i = !0;
          else if (e === null) {
            var f = t.stateNode, _ = t.memoizedProps;
            f.props = _;
            var F = f.context, H = r.contextType;
            typeof H == "object" && H ? H = xt(H) : (H = ft(r) ? Dn : lt.current, H = ir(t, H));
            var me = r.getDerivedStateFromProps, be = typeof me == "function" || typeof f.getSnapshotBeforeUpdate == "function";
            be || typeof f.UNSAFE_componentWillReceiveProps != "function" && typeof f.componentWillReceiveProps != "function" || (_ !== i || F !== H) && ad(t, f, i, H), dn = !1;
            var Ae = t.memoizedState;
            f.state = Ae, Wr(t, i, f, s), F = t.memoizedState, _ !== i || Ae !== F || pt.current || dn ? (typeof me == "function" && (Go(t, r, me, i), F = t.memoizedState), (_ = dn || od(t, r, _, i, Ae, F, H)) ? (be || typeof f.UNSAFE_componentWillMount != "function" && typeof f.componentWillMount != "function" || (typeof f.componentWillMount == "function" && f.componentWillMount(), typeof f.UNSAFE_componentWillMount == "function" && f.UNSAFE_componentWillMount()), typeof f.componentDidMount == "function" && (t.effectTag |= 4)) : (typeof f.componentDidMount == "function" && (t.effectTag |= 4), t.memoizedProps = i, t.memoizedState = F), f.props = i, f.state = F, f.context = H, i = _) : (typeof f.componentDidMount == "function" && (t.effectTag |= 4), i = !1);
          } else f = t.stateNode, Za(e, t), _ = t.memoizedProps, f.props = t.type === t.elementType ? _ : Pt(t.type, _), F = f.context, H = r.contextType, typeof H == "object" && H ? H = xt(H) : (H = ft(r) ? Dn : lt.current, H = ir(t, H)), me = r.getDerivedStateFromProps, (be = typeof me == "function" || typeof f.getSnapshotBeforeUpdate == "function") || typeof f.UNSAFE_componentWillReceiveProps != "function" && typeof f.componentWillReceiveProps != "function" || (_ !== i || F !== H) && ad(t, f, i, H), dn = !1, F = t.memoizedState, f.state = F, Wr(t, i, f, s), Ae = t.memoizedState, _ !== i || F !== Ae || pt.current || dn ? (typeof me == "function" && (Go(t, r, me, i), Ae = t.memoizedState), (me = dn || od(t, r, _, i, F, Ae, H)) ? (be || typeof f.UNSAFE_componentWillUpdate != "function" && typeof f.componentWillUpdate != "function" || (typeof f.componentWillUpdate == "function" && f.componentWillUpdate(i, Ae, H), typeof f.UNSAFE_componentWillUpdate == "function" && f.UNSAFE_componentWillUpdate(i, Ae, H)), typeof f.componentDidUpdate == "function" && (t.effectTag |= 4), typeof f.getSnapshotBeforeUpdate == "function" && (t.effectTag |= 256)) : (typeof f.componentDidUpdate != "function" || _ === e.memoizedProps && F === e.memoizedState || (t.effectTag |= 4), typeof f.getSnapshotBeforeUpdate != "function" || _ === e.memoizedProps && F === e.memoizedState || (t.effectTag |= 256), t.memoizedProps = i, t.memoizedState = Ae), f.props = i, f.state = Ae, f.context = H, i = me) : (typeof f.componentDidUpdate != "function" || _ === e.memoizedProps && F === e.memoizedState || (t.effectTag |= 4), typeof f.getSnapshotBeforeUpdate != "function" || _ === e.memoizedProps && F === e.memoizedState || (t.effectTag |= 256), i = !1);
          return ms(e, t, r, i, p, s);
        }
        function ms(e, t, r, i, s, p) {
          _d(e, t);
          var f = (t.effectTag & 64) != 0;
          if (!i && !f) return s && Fu(t, r, !1), Gt(e, t, p);
          i = t.stateNode, eb.current = t;
          var _ = f && typeof r.getDerivedStateFromError != "function" ? null : i.render();
          return t.effectTag |= 1, e !== null && f ? (t.child = lr(t, e.child, null, p), t.child = lr(t, null, _, p)) : vt(e, t, _, p), t.memoizedState = i.state, s && Fu(t, r, !0), t.child;
        }
        function Cd(e) {
          var t = e.stateNode;
          t.pendingContext ? Uu(e, t.pendingContext, t.pendingContext !== t.context) : t.context && Uu(e, t.context, !1), ts(e, t.containerInfo);
        }
        var gs = { dehydrated: null, retryTime: 0 };
        function Sd(e, t, r) {
          var i = t.mode, s = t.pendingProps, p = Be.current, f = !1, _;
          if ((_ = (t.effectTag & 64) != 0) || (_ = (p & 2) != 0 && (e === null || e.memoizedState !== null)), _ ? (f = !0, t.effectTag &= -65) : e !== null && e.memoizedState === null || s.fallback === void 0 || s.unstable_avoidThisFallback === !0 || (p |= 1), We(Be, p & 1), e === null) {
            if (s.fallback !== void 0 && ps(t), f) {
              if (f = s.fallback, s = bn(null, i, 0, null), s.return = t, !(t.mode & 2)) for (e = t.memoizedState === null ? t.child : t.child.child, s.child = e; e !== null; ) e.return = s, e = e.sibling;
              return r = bn(f, i, r, null), r.return = t, s.sibling = r, t.memoizedState = gs, t.child = s, r;
            }
            return i = s.children, t.memoizedState = null, t.child = es(t, null, i, r);
          }
          if (e.memoizedState !== null) {
            if (e = e.child, i = e.sibling, f) {
              if (s = s.fallback, r = Fn(e, e.pendingProps), r.return = t, !(t.mode & 2) && (f = t.memoizedState === null ? t.child : t.child.child, f !== e.child)) for (r.child = f; f !== null; ) f.return = r, f = f.sibling;
              return i = Fn(i, s), i.return = t, r.sibling = i, r.childExpirationTime = 0, t.memoizedState = gs, t.child = r, i;
            }
            return r = lr(t, e.child, s.children, r), t.memoizedState = null, t.child = r;
          }
          if (e = e.child, f) {
            if (f = s.fallback, s = bn(null, i, 0, null), s.return = t, s.child = e, e !== null && (e.return = s), !(t.mode & 2)) for (e = t.memoizedState === null ? t.child : t.child.child, s.child = e; e !== null; ) e.return = s, e = e.sibling;
            return r = bn(f, i, r, null), r.return = t, s.sibling = r, r.effectTag |= 2, s.childExpirationTime = 0, t.memoizedState = gs, t.child = s, r;
          }
          return t.memoizedState = null, t.child = lr(t, e, s.children, r);
        }
        function Td(e, t) {
          e.expirationTime < t && (e.expirationTime = t);
          var r = e.alternate;
          r !== null && r.expirationTime < t && (r.expirationTime = t), ed(e.return, t);
        }
        function ys(e, t, r, i, s, p) {
          var f = e.memoizedState;
          f === null ? e.memoizedState = { isBackwards: t, rendering: null, renderingStartTime: 0, last: i, tail: r, tailExpiration: 0, tailMode: s, lastEffect: p } : (f.isBackwards = t, f.rendering = null, f.renderingStartTime = 0, f.last = i, f.tail = r, f.tailExpiration = 0, f.tailMode = s, f.lastEffect = p);
        }
        function Od(e, t, r) {
          var i = t.pendingProps, s = i.revealOrder, p = i.tail;
          if (vt(e, t, i.children, r), i = Be.current, i & 2) i = i & 1 | 2, t.effectTag |= 64;
          else {
            if (e !== null && e.effectTag & 64) e: for (e = t.child; e !== null; ) {
              if (e.tag === 13) e.memoizedState !== null && Td(e, r);
              else if (e.tag === 19) Td(e, r);
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
          if (We(Be, i), !(t.mode & 2)) t.memoizedState = null;
          else switch (s) {
            case "forwards":
              for (r = t.child, s = null; r !== null; ) e = r.alternate, e !== null && ei(e) === null && (s = r), r = r.sibling;
              r = s, r === null ? (s = t.child, t.child = null) : (s = r.sibling, r.sibling = null), ys(t, !1, s, r, p, t.lastEffect);
              break;
            case "backwards":
              for (r = null, s = t.child, t.child = null; s !== null; ) {
                if (e = s.alternate, e !== null && ei(e) === null) {
                  t.child = s;
                  break;
                }
                e = s.sibling, s.sibling = r, r = s, s = e;
              }
              ys(t, !0, r, null, p, t.lastEffect);
              break;
            case "together":
              ys(t, !1, null, null, void 0, t.lastEffect);
              break;
            default:
              t.memoizedState = null;
          }
          return t.child;
        }
        function Gt(e, t, r) {
          e !== null && (t.dependencies = e.dependencies);
          var i = t.expirationTime;
          if (i !== 0 && Ei(i), t.childExpirationTime < r) return null;
          if (e !== null && t.child !== e.child) throw Error(c(153));
          if (t.child !== null) {
            for (e = t.child, r = Fn(e, e.pendingProps), t.child = r, r.return = t; e.sibling !== null; ) e = e.sibling, r = r.sibling = Fn(e, e.pendingProps), r.return = t;
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
            var f = t.stateNode;
            switch (In(jt.current), e = null, r) {
              case "input":
                p = aa(f, p), i = aa(f, i), e = [];
                break;
              case "option":
                p = ca(f, p), i = ca(f, i), e = [];
                break;
              case "select":
                p = a({}, p, { value: void 0 }), i = a({}, i, { value: void 0 }), e = [];
                break;
              case "textarea":
                p = ua(f, p), i = ua(f, i), e = [];
                break;
              default:
                typeof p.onClick != "function" && typeof i.onClick == "function" && (f.onclick = Mo);
            }
            Sa(r, i);
            var _, F;
            for (_ in r = null, p) if (!i.hasOwnProperty(_) && p.hasOwnProperty(_) && p[_] != null) if (_ === "style") for (F in f = p[_], f) f.hasOwnProperty(F) && (r || (r = {}), r[F] = "");
            else _ !== "dangerouslySetInnerHTML" && _ !== "children" && _ !== "suppressContentEditableWarning" && _ !== "suppressHydrationWarning" && _ !== "autoFocus" && (we.hasOwnProperty(_) ? e || (e = []) : (e || (e = [])).push(_, null));
            for (_ in i) {
              var H = i[_];
              if (f = p == null ? void 0 : p[_], i.hasOwnProperty(_) && H !== f && (H != null || f != null)) if (_ === "style") if (f) {
                for (F in f) !f.hasOwnProperty(F) || H && H.hasOwnProperty(F) || (r || (r = {}), r[F] = "");
                for (F in H) H.hasOwnProperty(F) && f[F] !== H[F] && (r || (r = {}), r[F] = H[F]);
              } else r || (e || (e = []), e.push(_, r)), r = H;
              else _ === "dangerouslySetInnerHTML" ? (H = H ? H.__html : void 0, f = f ? f.__html : void 0, H != null && f !== H && (e || (e = [])).push(_, H)) : _ === "children" ? f === H || typeof H != "string" && typeof H != "number" || (e || (e = [])).push(_, "" + H) : _ !== "suppressContentEditableWarning" && _ !== "suppressHydrationWarning" && (we.hasOwnProperty(_) ? (H != null && Wt(s, _), e || f === H || (e = [])) : (e || (e = [])).push(_, H));
            }
            r && (e || (e = [])).push("style", r), s = e, (t.updateQueue = s) && (t.effectTag |= 4);
          }
        }, rb = function(e, t, r, i) {
          r !== i && (t.effectTag |= 4);
        };
        function ci(e, t) {
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
              return ft(t.type) && Fo(), null;
            case 3:
              return cr(), Fe(pt), Fe(lt), r = t.stateNode, r.pendingContext && (r.context = r.pendingContext, r.pendingContext = null), e !== null && e.child !== null || !li(t) || (t.effectTag |= 4), null;
            case 5:
              ns(t), r = In(Gr.current);
              var s = t.type;
              if (e !== null && t.stateNode != null) nb(e, t, s, i, r), e.ref !== t.ref && (t.effectTag |= 128);
              else {
                if (!i) {
                  if (t.stateNode === null) throw Error(c(166));
                  return null;
                }
                if (e = In(jt.current), li(t)) {
                  i = t.stateNode, s = t.type;
                  var p = t.memoizedProps;
                  switch (i[sn] = t, i[Ao] = p, s) {
                    case "iframe":
                    case "object":
                    case "embed":
                      $e("load", i);
                      break;
                    case "video":
                    case "audio":
                      for (e = 0; e < Cr.length; e++) $e(Cr[e], i);
                      break;
                    case "source":
                      $e("error", i);
                      break;
                    case "img":
                    case "image":
                    case "link":
                      $e("error", i), $e("load", i);
                      break;
                    case "form":
                      $e("reset", i), $e("submit", i);
                      break;
                    case "details":
                      $e("toggle", i);
                      break;
                    case "input":
                      Dc(i, p), $e("invalid", i), Wt(r, "onChange");
                      break;
                    case "select":
                      i._wrapperState = { wasMultiple: !!p.multiple }, $e("invalid", i), Wt(r, "onChange");
                      break;
                    case "textarea":
                      Mc(i, p), $e("invalid", i), Wt(r, "onChange");
                  }
                  for (var f in Sa(s, p), e = null, p) if (p.hasOwnProperty(f)) {
                    var _ = p[f];
                    f === "children" ? typeof _ == "string" ? i.textContent !== _ && (e = ["children", _]) : typeof _ == "number" && i.textContent !== "" + _ && (e = ["children", "" + _]) : we.hasOwnProperty(f) && _ != null && Wt(r, f);
                  }
                  switch (s) {
                    case "input":
                      So(i), Rc(i, p, !0);
                      break;
                    case "textarea":
                      So(i), zc(i);
                      break;
                    case "select":
                    case "option":
                      break;
                    default:
                      typeof p.onClick == "function" && (i.onclick = Mo);
                  }
                  r = e, t.updateQueue = r, r !== null && (t.effectTag |= 4);
                } else {
                  switch (f = r.nodeType === 9 ? r : r.ownerDocument, e === cu && (e = Lc(s)), e === cu ? s === "script" ? (e = f.createElement("div"), e.innerHTML = "<script><\/script>", e = e.removeChild(e.firstChild)) : typeof i.is == "string" ? e = f.createElement(s, { is: i.is }) : (e = f.createElement(s), s === "select" && (f = e, i.multiple ? f.multiple = !0 : i.size && (f.size = i.size))) : e = f.createElementNS(e, s), e[sn] = t, e[Ao] = i, tb(e, t), t.stateNode = e, f = Ta(s, i), s) {
                    case "iframe":
                    case "object":
                    case "embed":
                      $e("load", e), _ = i;
                      break;
                    case "video":
                    case "audio":
                      for (_ = 0; _ < Cr.length; _++) $e(Cr[_], e);
                      _ = i;
                      break;
                    case "source":
                      $e("error", e), _ = i;
                      break;
                    case "img":
                    case "image":
                    case "link":
                      $e("error", e), $e("load", e), _ = i;
                      break;
                    case "form":
                      $e("reset", e), $e("submit", e), _ = i;
                      break;
                    case "details":
                      $e("toggle", e), _ = i;
                      break;
                    case "input":
                      Dc(e, i), _ = aa(e, i), $e("invalid", e), Wt(r, "onChange");
                      break;
                    case "option":
                      _ = ca(e, i);
                      break;
                    case "select":
                      e._wrapperState = { wasMultiple: !!i.multiple }, _ = a({}, i, { value: void 0 }), $e("invalid", e), Wt(r, "onChange");
                      break;
                    case "textarea":
                      Mc(e, i), _ = ua(e, i), $e("invalid", e), Wt(r, "onChange");
                      break;
                    default:
                      _ = i;
                  }
                  Sa(s, _);
                  var F = _;
                  for (p in F) if (F.hasOwnProperty(p)) {
                    var H = F[p];
                    p === "style" ? lu(e, H) : p === "dangerouslySetInnerHTML" ? (H = H ? H.__html : void 0, H != null && Uc(e, H)) : p === "children" ? typeof H == "string" ? (s !== "textarea" || H !== "") && xr(e, H) : typeof H == "number" && xr(e, "" + H) : p !== "suppressContentEditableWarning" && p !== "suppressHydrationWarning" && p !== "autoFocus" && (we.hasOwnProperty(p) ? H != null && Wt(r, p) : H != null && tn(e, p, H, f));
                  }
                  switch (s) {
                    case "input":
                      So(e), Rc(e, i, !1);
                      break;
                    case "textarea":
                      So(e), zc(e);
                      break;
                    case "option":
                      i.value != null && e.setAttribute("value", "" + nn(i.value));
                      break;
                    case "select":
                      e.multiple = !!i.multiple, r = i.value, r == null ? i.defaultValue != null && Xn(e, !!i.multiple, i.defaultValue, !0) : Xn(e, !!i.multiple, r, !1);
                      break;
                    default:
                      typeof _.onClick == "function" && (e.onclick = Mo);
                  }
                  gu(s, i) && (t.effectTag |= 4);
                }
                t.ref !== null && (t.effectTag |= 128);
              }
              return null;
            case 6:
              if (e && t.stateNode != null) rb(e, t, e.memoizedProps, i);
              else {
                if (typeof i != "string" && t.stateNode === null) throw Error(c(166));
                r = In(Gr.current), In(jt.current), li(t) ? (r = t.stateNode, i = t.memoizedProps, r[sn] = t, r.nodeValue !== i && (t.effectTag |= 4)) : (r = (r.nodeType === 9 ? r : r.ownerDocument).createTextNode(i), r[sn] = t, t.stateNode = r);
              }
              return null;
            case 13:
              return Fe(Be), i = t.memoizedState, t.effectTag & 64 ? (t.expirationTime = r, t) : (r = i !== null, i = !1, e === null ? t.memoizedProps.fallback !== void 0 && li(t) : (s = e.memoizedState, i = s !== null, r || s === null || (s = e.child.sibling, s !== null && (p = t.firstEffect, p === null ? (t.firstEffect = t.lastEffect = s, s.nextEffect = null) : (t.firstEffect = s, s.nextEffect = p), s.effectTag = 8))), r && !i && t.mode & 2 && (e === null && t.memoizedProps.unstable_avoidThisFallback !== !0 || Be.current & 1 ? nt === An && (nt = pi) : ((nt === An || nt === pi) && (nt = fi), Zr !== 0 && kt !== null && ($n(kt, ht), Jd(kt, Zr)))), (r || i) && (t.effectTag |= 4), null);
            case 4:
              return cr(), null;
            case 10:
              return Ga(t), null;
            case 17:
              return ft(t.type) && Fo(), null;
            case 19:
              if (Fe(Be), i = t.memoizedState, i === null) return null;
              if (s = (t.effectTag & 64) != 0, p = i.rendering, p === null) {
                if (s) ci(i, !1);
                else if (nt !== An || e !== null && e.effectTag & 64) for (p = t.child; p !== null; ) {
                  if (e = ei(p), e !== null) {
                    for (t.effectTag |= 64, ci(i, !1), s = e.updateQueue, s !== null && (t.updateQueue = s, t.effectTag |= 4), i.lastEffect === null && (t.firstEffect = null), t.lastEffect = i.lastEffect, i = t.child; i !== null; ) s = i, p = r, s.effectTag &= 2, s.nextEffect = null, s.firstEffect = null, s.lastEffect = null, e = s.alternate, e === null ? (s.childExpirationTime = 0, s.expirationTime = p, s.child = null, s.memoizedProps = null, s.memoizedState = null, s.updateQueue = null, s.dependencies = null) : (s.childExpirationTime = e.childExpirationTime, s.expirationTime = e.expirationTime, s.child = e.child, s.memoizedProps = e.memoizedProps, s.memoizedState = e.memoizedState, s.updateQueue = e.updateQueue, p = e.dependencies, s.dependencies = p === null ? null : { expirationTime: p.expirationTime, firstContext: p.firstContext, responders: p.responders }), i = i.sibling;
                    return We(Be, Be.current & 1 | 2), t.child;
                  }
                  p = p.sibling;
                }
              } else {
                if (!s) if (e = ei(p), e !== null) {
                  if (t.effectTag |= 64, s = !0, r = e.updateQueue, r !== null && (t.updateQueue = r, t.effectTag |= 4), ci(i, !0), i.tail === null && i.tailMode === "hidden" && !p.alternate) return t = t.lastEffect = i.lastEffect, t !== null && (t.nextEffect = null), null;
                } else 2 * _t() - i.renderingStartTime > i.tailExpiration && 1 < r && (t.effectTag |= 64, s = !0, ci(i, !1), t.expirationTime = t.childExpirationTime = r - 1);
                i.isBackwards ? (p.sibling = t.child, t.child = p) : (r = i.last, r === null ? t.child = p : r.sibling = p, i.last = p);
              }
              return i.tail === null ? null : (i.tailExpiration === 0 && (i.tailExpiration = _t() + 500), r = i.tail, i.rendering = r, i.tail = r.sibling, i.lastEffect = t.lastEffect, i.renderingStartTime = _t(), r.sibling = null, t = Be.current, We(Be, s ? t & 1 | 2 : t & 1), r);
          }
          throw Error(c(156, t.tag));
        }
        function ib(e) {
          switch (e.tag) {
            case 1:
              ft(e.type) && Fo();
              var t = e.effectTag;
              return t & 4096 ? (e.effectTag = t & -4097 | 64, e) : null;
            case 3:
              if (cr(), Fe(pt), Fe(lt), t = e.effectTag, t & 64) throw Error(c(285));
              return e.effectTag = t & -4097 | 64, e;
            case 5:
              return ns(e), null;
            case 13:
              return Fe(Be), t = e.effectTag, t & 4096 ? (e.effectTag = t & -4097 | 64, e) : null;
            case 19:
              return Fe(Be), null;
            case 4:
              return cr(), null;
            case 10:
              return Ga(e), null;
            default:
              return null;
          }
        }
        function bs(e, t) {
          return { value: e, source: t, stack: ia(t) };
        }
        var ab = typeof WeakSet == "function" ? WeakSet : Set;
        function vs(e, t) {
          var r = t.source, i = t.stack;
          i === null && r !== null && (i = ia(r)), r !== null && Bt(r.type), t = t.value, e !== null && e.tag === 1 && Bt(e.type);
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
            Vn(e, r);
          }
        }
        function Nd(e) {
          var t = e.ref;
          if (t !== null) if (typeof t == "function") try {
            t(null);
          } catch (r) {
            Vn(e, r);
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
        function Pd(e, t) {
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
        function Dd(e, t) {
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
              Dd(3, r);
              return;
            case 1:
              if (e = r.stateNode, r.effectTag & 4) if (t === null) e.componentDidMount();
              else {
                var i = r.elementType === r.type ? t.memoizedProps : Pt(r.type, t.memoizedProps);
                e.componentDidUpdate(i, t.memoizedState, e.__reactInternalSnapshotBeforeUpdate);
              }
              t = r.updateQueue, t !== null && nd(r, t, e);
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
                nd(r, t, e);
              }
              return;
            case 5:
              e = r.stateNode, t === null && r.effectTag & 4 && gu(r.type, r.memoizedProps) && e.focus();
              return;
            case 6:
              return;
            case 4:
              return;
            case 12:
              return;
            case 13:
              r.memoizedState === null && (r = r.alternate, r !== null && (r = r.memoizedState, r !== null && (r = r.dehydrated, r !== null && ru(r))));
              return;
            case 19:
            case 17:
            case 20:
            case 21:
              return;
          }
          throw Error(c(163));
        }
        function Id(e, t, r) {
          switch (typeof Ds == "function" && Ds(t), t.tag) {
            case 0:
            case 11:
            case 14:
            case 15:
            case 22:
              if (e = t.updateQueue, e !== null && (e = e.lastEffect, e !== null)) {
                var i = e.next;
                un(97 < r ? 97 : r, function() {
                  var s = i;
                  do {
                    var p = s.destroy;
                    if (p !== void 0) {
                      var f = t;
                      try {
                        p();
                      } catch (_) {
                        Vn(f, _);
                      }
                    }
                    s = s.next;
                  } while (s !== i);
                });
              }
              break;
            case 1:
              Nd(t), r = t.stateNode, typeof r.componentWillUnmount == "function" && sb(t, r);
              break;
            case 5:
              Nd(t);
              break;
            case 4:
              zd(e, t, r);
          }
        }
        function Rd(e) {
          var t = e.alternate;
          e.return = null, e.child = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.alternate = null, e.firstEffect = null, e.lastEffect = null, e.pendingProps = null, e.memoizedProps = null, e.stateNode = null, t !== null && Rd(t);
        }
        function Md(e) {
          return e.tag === 5 || e.tag === 3 || e.tag === 4;
        }
        function Ad(e) {
          e: {
            for (var t = e.return; t !== null; ) {
              if (Md(t)) {
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
          r.effectTag & 16 && (xr(t, ""), r.effectTag &= -17);
          e: t: for (r = e; ; ) {
            for (; r.sibling === null; ) {
              if (r.return === null || Md(r.return)) {
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
          i ? ks(e, r, t) : ws(e, r, t);
        }
        function ks(e, t, r) {
          var i = e.tag, s = i === 5 || i === 6;
          if (s) e = s ? e.stateNode : e.stateNode.instance, t ? r.nodeType === 8 ? r.parentNode.insertBefore(e, t) : r.insertBefore(e, t) : (r.nodeType === 8 ? (t = r.parentNode, t.insertBefore(e, r)) : (t = r, t.appendChild(e)), r = r._reactRootContainer, r != null || t.onclick !== null || (t.onclick = Mo));
          else if (i !== 4 && (e = e.child, e !== null)) for (ks(e, t, r), e = e.sibling; e !== null; ) ks(e, t, r), e = e.sibling;
        }
        function ws(e, t, r) {
          var i = e.tag, s = i === 5 || i === 6;
          if (s) e = s ? e.stateNode : e.stateNode.instance, t ? r.insertBefore(e, t) : r.appendChild(e);
          else if (i !== 4 && (e = e.child, e !== null)) for (ws(e, t, r), e = e.sibling; e !== null; ) ws(e, t, r), e = e.sibling;
        }
        function zd(e, t, r) {
          for (var i = t, s = !1, p, f; ; ) {
            if (!s) {
              s = i.return;
              e: for (; ; ) {
                if (s === null) throw Error(c(160));
                switch (p = s.stateNode, s.tag) {
                  case 5:
                    f = !1;
                    break e;
                  case 3:
                    p = p.containerInfo, f = !0;
                    break e;
                  case 4:
                    p = p.containerInfo, f = !0;
                    break e;
                }
                s = s.return;
              }
              s = !0;
            }
            if (i.tag === 5 || i.tag === 6) {
              e: for (var _ = e, F = i, H = r, me = F; ; ) if (Id(_, me, H), me.child !== null && me.tag !== 4) me.child.return = me, me = me.child;
              else {
                if (me === F) break e;
                for (; me.sibling === null; ) {
                  if (me.return === null || me.return === F) break e;
                  me = me.return;
                }
                me.sibling.return = me.return, me = me.sibling;
              }
              f ? (_ = p, F = i.stateNode, _.nodeType === 8 ? _.parentNode.removeChild(F) : _.removeChild(F)) : p.removeChild(i.stateNode);
            } else if (i.tag === 4) {
              if (i.child !== null) {
                p = i.stateNode.containerInfo, f = !0, i.child.return = i, i = i.child;
                continue;
              }
            } else if (Id(e, i, r), i.child !== null) {
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
        function Es(e, t) {
          switch (t.tag) {
            case 0:
            case 11:
            case 14:
            case 15:
            case 22:
              Pd(3, t);
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
                  for (r[Ao] = i, e === "input" && i.type === "radio" && i.name != null && Ic(r, i), Ta(e, s), t = Ta(e, i), s = 0; s < p.length; s += 2) {
                    var f = p[s], _ = p[s + 1];
                    f === "style" ? lu(r, _) : f === "dangerouslySetInnerHTML" ? Uc(r, _) : f === "children" ? xr(r, _) : tn(r, f, _, t);
                  }
                  switch (e) {
                    case "input":
                      sa(r, i);
                      break;
                    case "textarea":
                      Ac(r, i);
                      break;
                    case "select":
                      t = r._wrapperState.wasMultiple, r._wrapperState.wasMultiple = !!i.multiple, e = i.value, e == null ? t !== !!i.multiple && (i.defaultValue == null ? Xn(r, !!i.multiple, i.multiple ? [] : "", !1) : Xn(r, !!i.multiple, i.defaultValue, !0)) : Xn(r, !!i.multiple, e, !1);
                  }
                }
              }
              return;
            case 6:
              if (t.stateNode === null) throw Error(c(162));
              t.stateNode.nodeValue = t.memoizedProps;
              return;
            case 3:
              t = t.stateNode, t.hydrate && (t.hydrate = !1, ru(t.containerInfo));
              return;
            case 12:
              return;
            case 13:
              if (r = t, t.memoizedState === null ? i = !1 : (i = !0, r = t.child, Cs = _t()), r !== null) e: for (e = r; ; ) {
                if (e.tag === 5) p = e.stateNode, i ? (p = p.style, typeof p.setProperty == "function" ? p.setProperty("display", "none", "important") : p.display = "none") : (p = e.stateNode, s = e.memoizedProps.style, s = s != null && s.hasOwnProperty("display") ? s.display : null, p.style.display = su("display", s));
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
              jd(t);
              return;
            case 19:
              jd(t);
              return;
            case 17:
              return;
          }
          throw Error(c(163));
        }
        function jd(e) {
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
        function Ld(e, t, r) {
          r = pn(r, null), r.tag = 3, r.payload = { element: null };
          var i = t.value;
          return r.callback = function() {
            yi || (yi = !0, Ss = i), vs(e, t);
          }, r;
        }
        function Ud(e, t, r) {
          r = pn(r, null), r.tag = 3;
          var i = e.type.getDerivedStateFromError;
          if (typeof i == "function") {
            var s = t.value;
            r.payload = function() {
              return vs(e, t), i(s);
            };
          }
          var p = e.stateNode;
          return p !== null && typeof p.componentDidCatch == "function" && (r.callback = function() {
            typeof i != "function" && (gn === null ? gn = /* @__PURE__ */ new Set([this]) : gn.add(this), vs(e, t));
            var f = t.stack;
            this.componentDidCatch(t.value, { componentStack: f === null ? "" : f });
          }), r;
        }
        var db = Math.ceil, ui = Qe.ReactCurrentDispatcher, Vd = Qe.ReactCurrentOwner, tt = 0, _s = 8, Dt = 16, Ut = 32, An = 0, di = 1, Fd = 2, pi = 3, fi = 4, xs = 5, Ne = tt, kt = null, Re = null, ht = 0, nt = An, hi = null, Xt = 1073741823, Xr = 1073741823, mi = null, Zr = 0, gi = !1, Cs = 0, $d = 500, _e = null, yi = !1, Ss = null, gn = null, bi = !1, Jr = null, eo = 90, zn = null, to = 0, Ts = null, vi = 0;
        function Vt() {
          return (Ne & (Dt | Ut)) === tt ? vi === 0 ? vi = 1073741821 - (_t() / 10 | 0) : vi : 1073741821 - (_t() / 10 | 0);
        }
        function jn(e, t, r) {
          if (t = t.mode, !(t & 2)) return 1073741823;
          var i = Wo();
          if (!(t & 4)) return i === 99 ? 1073741823 : 1073741822;
          if ((Ne & Dt) !== tt) return ht;
          if (r !== null) e = qo(e, r.timeoutMs | 0 || 5e3, 250);
          else switch (i) {
            case 99:
              e = 1073741823;
              break;
            case 98:
              e = qo(e, 150, 100);
              break;
            case 97:
            case 96:
              e = qo(e, 5e3, 250);
              break;
            case 95:
              e = 2;
              break;
            default:
              throw Error(c(326));
          }
          return kt !== null && e === ht && --e, e;
        }
        function yn(e, t) {
          if (50 < to) throw to = 0, Ts = null, Error(c(185));
          if (e = ki(e, t), e !== null) {
            var r = Wo();
            t === 1073741823 ? (Ne & _s) !== tt && (Ne & (Dt | Ut)) === tt ? Os(e) : (wt(e), Ne === tt && zt()) : wt(e), (Ne & 4) === tt || r !== 98 && r !== 99 || (zn === null ? zn = /* @__PURE__ */ new Map([[e, t]]) : (r = zn.get(e), (r === void 0 || r > t) && zn.set(e, t)));
          }
        }
        function ki(e, t) {
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
          return s !== null && (kt === s && (Ei(t), nt === fi && $n(s, ht)), Jd(s, t)), s;
        }
        function wi(e) {
          var t = e.lastExpiredTime;
          if (t !== 0 || (t = e.firstPendingTime, !Zd(e, t))) return t;
          var r = e.lastPingedTime;
          return e = e.nextKnownPendingLevel, e = r > e ? r : e, 2 >= e && t !== e ? 0 : e;
        }
        function wt(e) {
          if (e.lastExpiredTime !== 0) e.callbackExpirationTime = 1073741823, e.callbackPriority = 99, e.callbackNode = Zu(Os.bind(null, e));
          else {
            var t = wi(e), r = e.callbackNode;
            if (t === 0) r !== null && (e.callbackNode = null, e.callbackExpirationTime = 0, e.callbackPriority = 90);
            else {
              var i = Vt();
              if (t === 1073741823 ? i = 99 : t === 1 || t === 2 ? i = 95 : (i = 10 * (1073741821 - t) - 10 * (1073741821 - i), i = 0 >= i ? 99 : 250 >= i ? 98 : 5250 >= i ? 97 : 95), r !== null) {
                var s = e.callbackPriority;
                if (e.callbackExpirationTime === t && s >= i) return;
                r !== Qu && $u(r);
              }
              e.callbackExpirationTime = t, e.callbackPriority = i, t = t === 1073741823 ? Zu(Os.bind(null, e)) : Xu(i, Hd.bind(null, e), { timeout: 10 * (1073741821 - t) - _t() }), e.callbackNode = t;
            }
          }
        }
        function Hd(e, t) {
          if (vi = 0, t) return t = Vt(), As(e, t), wt(e), null;
          var r = wi(e);
          if (r !== 0) {
            if (t = e.callbackNode, (Ne & (Dt | Ut)) !== tt) throw Error(c(327));
            if (pr(), e === kt && r === ht || Ln(e, r), Re !== null) {
              var i = Ne;
              Ne |= Dt;
              var s = Kd();
              do
                try {
                  hb();
                  break;
                } catch (_) {
                  qd(e, _);
                }
              while (!0);
              if (Ya(), Ne = i, ui.current = s, nt === di) throw t = hi, Ln(e, r), $n(e, r), wt(e), t;
              if (Re === null) switch (s = e.finishedWork = e.current.alternate, e.finishedExpirationTime = r, i = nt, kt = null, i) {
                case An:
                case di:
                  throw Error(c(345));
                case Fd:
                  As(e, 2 < r ? 2 : r);
                  break;
                case pi:
                  if ($n(e, r), i = e.lastSuspendedTime, r === i && (e.nextKnownPendingLevel = Ns(s)), Xt === 1073741823 && (s = Cs + $d - _t(), 10 < s)) {
                    if (gi) {
                      var p = e.lastPingedTime;
                      if (p === 0 || p >= r) {
                        e.lastPingedTime = r, Ln(e, r);
                        break;
                      }
                    }
                    if (p = wi(e), p !== 0 && p !== r) break;
                    if (i !== 0 && i !== r) {
                      e.lastPingedTime = i;
                      break;
                    }
                    e.timeoutHandle = Aa(Un.bind(null, e), s);
                    break;
                  }
                  Un(e);
                  break;
                case fi:
                  if ($n(e, r), i = e.lastSuspendedTime, r === i && (e.nextKnownPendingLevel = Ns(s)), gi && (s = e.lastPingedTime, s === 0 || s >= r)) {
                    e.lastPingedTime = r, Ln(e, r);
                    break;
                  }
                  if (s = wi(e), s !== 0 && s !== r) break;
                  if (i !== 0 && i !== r) {
                    e.lastPingedTime = i;
                    break;
                  }
                  if (Xr === 1073741823 ? Xt === 1073741823 ? i = 0 : (i = 10 * (1073741821 - Xt) - 5e3, s = _t(), r = 10 * (1073741821 - r) - s, i = s - i, 0 > i && (i = 0), i = (120 > i ? 120 : 480 > i ? 480 : 1080 > i ? 1080 : 1920 > i ? 1920 : 3e3 > i ? 3e3 : 4320 > i ? 4320 : 1960 * db(i / 1960)) - i, r < i && (i = r)) : i = 10 * (1073741821 - Xr) - _t(), 10 < i) {
                    e.timeoutHandle = Aa(Un.bind(null, e), i);
                    break;
                  }
                  Un(e);
                  break;
                case xs:
                  if (Xt !== 1073741823 && mi !== null) {
                    p = Xt;
                    var f = mi;
                    if (i = f.busyMinDurationMs | 0, 0 >= i ? i = 0 : (s = f.busyDelayMs | 0, p = _t() - (10 * (1073741821 - p) - (f.timeoutMs | 0 || 5e3)), i = p <= s ? 0 : s + i - p), 10 < i) {
                      $n(e, r), e.timeoutHandle = Aa(Un.bind(null, e), i);
                      break;
                    }
                  }
                  Un(e);
                  break;
                default:
                  throw Error(c(329));
              }
              if (wt(e), e.callbackNode === t) return Hd.bind(null, e);
            }
          }
          return null;
        }
        function Os(e) {
          var t = e.lastExpiredTime;
          if (t = t === 0 ? 1073741823 : t, (Ne & (Dt | Ut)) !== tt) throw Error(c(327));
          if (pr(), e === kt && t === ht || Ln(e, t), Re !== null) {
            var r = Ne;
            Ne |= Dt;
            var i = Kd();
            do
              try {
                fb();
                break;
              } catch (s) {
                qd(e, s);
              }
            while (!0);
            if (Ya(), Ne = r, ui.current = i, nt === di) throw r = hi, Ln(e, t), $n(e, t), wt(e), r;
            if (Re !== null) throw Error(c(261));
            e.finishedWork = e.current.alternate, e.finishedExpirationTime = t, kt = null, Un(e), wt(e);
          }
          return null;
        }
        function pb() {
          if (zn !== null) {
            var e = zn;
            zn = null, e.forEach(function(t, r) {
              As(r, t), wt(r);
            }), zt();
          }
        }
        function Bd(e, t) {
          var r = Ne;
          Ne |= 1;
          try {
            return e(t);
          } finally {
            Ne = r, Ne === tt && zt();
          }
        }
        function Wd(e, t) {
          var r = Ne;
          Ne &= -2, Ne |= _s;
          try {
            return e(t);
          } finally {
            Ne = r, Ne === tt && zt();
          }
        }
        function Ln(e, t) {
          e.finishedWork = null, e.finishedExpirationTime = 0;
          var r = e.timeoutHandle;
          if (r !== -1 && (e.timeoutHandle = -1, ly(r)), Re !== null) for (r = Re.return; r !== null; ) {
            var i = r;
            switch (i.tag) {
              case 1:
                i = i.type.childContextTypes, i != null && Fo();
                break;
              case 3:
                cr(), Fe(pt), Fe(lt);
                break;
              case 5:
                ns(i);
                break;
              case 4:
                cr();
                break;
              case 13:
                Fe(Be);
                break;
              case 19:
                Fe(Be);
                break;
              case 10:
                Ga(i);
            }
            r = r.return;
          }
          kt = e, Re = Fn(e.current, null), ht = t, nt = An, hi = null, Xr = Xt = 1073741823, mi = null, Zr = 0, gi = !1;
        }
        function qd(e, t) {
          do {
            try {
              if (Ya(), ti.current = si, ni) for (var r = Ze.memoizedState; r !== null; ) {
                var i = r.queue;
                i !== null && (i.pending = null), r = r.next;
              }
              if (hn = 0, ut = ct = Ze = null, ni = !1, Re === null || Re.return === null) return nt = di, hi = t, Re = null;
              e: {
                var s = e, p = Re.return, f = Re, _ = t;
                if (t = ht, f.effectTag |= 2048, f.firstEffect = f.lastEffect = null, typeof _ == "object" && _ && typeof _.then == "function") {
                  var F = _;
                  if (!(f.mode & 2)) {
                    var H = f.alternate;
                    H ? (f.updateQueue = H.updateQueue, f.memoizedState = H.memoizedState, f.expirationTime = H.expirationTime) : (f.updateQueue = null, f.memoizedState = null);
                  }
                  var me = (Be.current & 1) != 0, be = p;
                  do {
                    var Ae;
                    if (Ae = be.tag === 13) {
                      var je = be.memoizedState;
                      if (je !== null) Ae = je.dehydrated !== null;
                      else {
                        var St = be.memoizedProps;
                        Ae = St.fallback === void 0 ? !1 : St.unstable_avoidThisFallback === !0 ? !me : !0;
                      }
                    }
                    if (Ae) {
                      var ot = be.updateQueue;
                      if (ot === null) {
                        var j = /* @__PURE__ */ new Set();
                        j.add(F), be.updateQueue = j;
                      } else ot.add(F);
                      if (!(be.mode & 2)) {
                        if (be.effectTag |= 64, f.effectTag &= -2981, f.tag === 1) if (f.alternate === null) f.tag = 17;
                        else {
                          var I = pn(1073741823, null);
                          I.tag = 2, fn(f, I);
                        }
                        f.expirationTime = 1073741823;
                        break e;
                      }
                      _ = void 0, f = t;
                      var Q = s.pingCache;
                      if (Q === null ? (Q = s.pingCache = new ub(), _ = /* @__PURE__ */ new Set(), Q.set(F, _)) : (_ = Q.get(F), _ === void 0 && (_ = /* @__PURE__ */ new Set(), Q.set(F, _))), !_.has(f)) {
                        _.add(f);
                        var ce = bb.bind(null, s, F, f);
                        F.then(ce, ce);
                      }
                      be.effectTag |= 4096, be.expirationTime = t;
                      break e;
                    }
                    be = be.return;
                  } while (be !== null);
                  _ = Error((Bt(f.type) || "A React component") + ` suspended while rendering, but no fallback UI was specified.

Add a <Suspense fallback=...> component higher in the tree to provide a loading indicator or placeholder to display.` + ia(f));
                }
                nt !== xs && (nt = Fd), _ = bs(_, f), be = p;
                do {
                  switch (be.tag) {
                    case 3:
                      F = _, be.effectTag |= 4096, be.expirationTime = t;
                      var fe = Ld(be, F, t);
                      td(be, fe);
                      break e;
                    case 1:
                      F = _;
                      var ve = be.type, Ce = be.stateNode;
                      if (!(be.effectTag & 64) && (typeof ve.getDerivedStateFromError == "function" || Ce !== null && typeof Ce.componentDidCatch == "function" && (gn === null || !gn.has(Ce)))) {
                        be.effectTag |= 4096, be.expirationTime = t;
                        var ze = Ud(be, F, t);
                        td(be, ze);
                        break e;
                      }
                  }
                  be = be.return;
                } while (be !== null);
              }
              Re = Gd(Re);
            } catch (He) {
              t = He;
              continue;
            }
            break;
          } while (!0);
        }
        function Kd() {
          var e = ui.current;
          return ui.current = si, e === null ? si : e;
        }
        function Qd(e, t) {
          e < Xt && 2 < e && (Xt = e), t !== null && e < Xr && 2 < e && (Xr = e, mi = t);
        }
        function Ei(e) {
          e > Zr && (Zr = e);
        }
        function fb() {
          for (; Re !== null; ) Re = Yd(Re);
        }
        function hb() {
          for (; Re !== null && !Yy(); ) Re = Yd(Re);
        }
        function Yd(e) {
          var t = kb(e.alternate, e, ht);
          return e.memoizedProps = e.pendingProps, t === null && (t = Gd(e)), Vd.current = null, t;
        }
        function Gd(e) {
          Re = e;
          do {
            var t = Re.alternate;
            if (e = Re.return, Re.effectTag & 2048) {
              if (t = ib(Re), t !== null) return t.effectTag &= 2047, t;
              e !== null && (e.firstEffect = e.lastEffect = null, e.effectTag |= 2048);
            } else {
              if (t = ob(t, Re, ht), ht === 1 || Re.childExpirationTime !== 1) {
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
          return nt === An && (nt = xs), null;
        }
        function Ns(e) {
          var t = e.expirationTime;
          return e = e.childExpirationTime, t > e ? t : e;
        }
        function Un(e) {
          var t = Wo();
          return un(99, mb.bind(null, e, t)), null;
        }
        function mb(e, t) {
          do
            pr();
          while (Jr !== null);
          if ((Ne & (Dt | Ut)) !== tt) throw Error(c(327));
          var r = e.finishedWork, i = e.finishedExpirationTime;
          if (r === null) return null;
          if (e.finishedWork = null, e.finishedExpirationTime = 0, r === e.current) throw Error(c(177));
          e.callbackNode = null, e.callbackExpirationTime = 0, e.callbackPriority = 90, e.nextKnownPendingLevel = 0;
          var s = Ns(r);
          if (e.firstPendingTime = s, i <= e.lastSuspendedTime ? e.firstSuspendedTime = e.lastSuspendedTime = e.nextKnownPendingLevel = 0 : i <= e.firstSuspendedTime && (e.firstSuspendedTime = i - 1), i <= e.lastPingedTime && (e.lastPingedTime = 0), i <= e.lastExpiredTime && (e.lastExpiredTime = 0), e === kt && (Re = kt = null, ht = 0), 1 < r.effectTag ? r.lastEffect === null ? s = r : (r.lastEffect.nextEffect = r, s = r.firstEffect) : s = r.firstEffect, s !== null) {
            var p = Ne;
            Ne |= Ut, Vd.current = null, Ia = Io;
            var f = fu();
            if (Na(f)) {
              if ("selectionStart" in f) var _ = { start: f.selectionStart, end: f.selectionEnd };
              else e: {
                _ = (_ = f.ownerDocument) && _.defaultView || window;
                var F = _.getSelection && _.getSelection();
                if (F && F.rangeCount !== 0) {
                  _ = F.anchorNode;
                  var H = F.anchorOffset, me = F.focusNode;
                  F = F.focusOffset;
                  try {
                    _.nodeType, me.nodeType;
                  } catch {
                    _ = null;
                    break e;
                  }
                  var be = 0, Ae = -1, je = -1, St = 0, ot = 0, j = f, I = null;
                  t: for (; ; ) {
                    for (var Q; j !== _ || H !== 0 && j.nodeType !== 3 || (Ae = be + H), j !== me || F !== 0 && j.nodeType !== 3 || (je = be + F), j.nodeType === 3 && (be += j.nodeValue.length), (Q = j.firstChild) !== null; ) I = j, j = Q;
                    for (; ; ) {
                      if (j === f) break t;
                      if (I === _ && ++St === H && (Ae = be), I === me && ++ot === F && (je = be), (Q = j.nextSibling) !== null) break;
                      j = I, I = j.parentNode;
                    }
                    j = Q;
                  }
                  _ = Ae === -1 || je === -1 ? null : { start: Ae, end: je };
                } else _ = null;
              }
              _ || (_ = { start: 0, end: 0 });
            } else _ = null;
            Ra = { activeElementDetached: null, focusedElem: f, selectionRange: _ }, Io = !1, _e = s;
            do
              try {
                gb();
              } catch (Me) {
                if (_e === null) throw Error(c(330));
                Vn(_e, Me), _e = _e.nextEffect;
              }
            while (_e !== null);
            _e = s;
            do
              try {
                for (f = e, _ = t; _e !== null; ) {
                  var ce = _e.effectTag;
                  if (ce & 16 && xr(_e.stateNode, ""), ce & 128) {
                    var fe = _e.alternate;
                    if (fe !== null) {
                      var ve = fe.ref;
                      ve !== null && (typeof ve == "function" ? ve(null) : ve.current = null);
                    }
                  }
                  switch (ce & 1038) {
                    case 2:
                      Ad(_e), _e.effectTag &= -3;
                      break;
                    case 6:
                      Ad(_e), _e.effectTag &= -3, Es(_e.alternate, _e);
                      break;
                    case 1024:
                      _e.effectTag &= -1025;
                      break;
                    case 1028:
                      _e.effectTag &= -1025, Es(_e.alternate, _e);
                      break;
                    case 4:
                      Es(_e.alternate, _e);
                      break;
                    case 8:
                      H = _e, zd(f, H, _), Rd(H);
                  }
                  _e = _e.nextEffect;
                }
              } catch (Me) {
                if (_e === null) throw Error(c(330));
                Vn(_e, Me), _e = _e.nextEffect;
              }
            while (_e !== null);
            if (ve = Ra, fe = fu(), ce = ve.focusedElem, _ = ve.selectionRange, fe !== ce && ce && ce.ownerDocument && pu(ce.ownerDocument.documentElement, ce)) {
              for (_ !== null && Na(ce) && (fe = _.start, ve = _.end, ve === void 0 && (ve = fe), "selectionStart" in ce ? (ce.selectionStart = fe, ce.selectionEnd = Math.min(ve, ce.value.length)) : (ve = (fe = ce.ownerDocument || document) && fe.defaultView || window, ve.getSelection && (ve = ve.getSelection(), H = ce.textContent.length, f = Math.min(_.start, H), _ = _.end === void 0 ? f : Math.min(_.end, H), !ve.extend && f > _ && (H = _, _ = f, f = H), H = du(ce, f), me = du(ce, _), H && me && (ve.rangeCount !== 1 || ve.anchorNode !== H.node || ve.anchorOffset !== H.offset || ve.focusNode !== me.node || ve.focusOffset !== me.offset) && (fe = fe.createRange(), fe.setStart(H.node, H.offset), ve.removeAllRanges(), f > _ ? (ve.addRange(fe), ve.extend(me.node, me.offset)) : (fe.setEnd(me.node, me.offset), ve.addRange(fe)))))), fe = [], ve = ce; ve = ve.parentNode; ) ve.nodeType === 1 && fe.push({ element: ve, left: ve.scrollLeft, top: ve.scrollTop });
              for (typeof ce.focus == "function" && ce.focus(), ce = 0; ce < fe.length; ce++) ve = fe[ce], ve.element.scrollLeft = ve.left, ve.element.scrollTop = ve.top;
            }
            Io = !!Ia, Ra = Ia = null, e.current = r, _e = s;
            do
              try {
                for (ce = e; _e !== null; ) {
                  var Ce = _e.effectTag;
                  if (Ce & 36 && cb(ce, _e.alternate, _e), Ce & 128) {
                    fe = void 0;
                    var ze = _e.ref;
                    if (ze !== null) {
                      var He = _e.stateNode;
                      switch (_e.tag) {
                        case 5:
                          fe = He;
                          break;
                        default:
                          fe = He;
                      }
                      typeof ze == "function" ? ze(fe) : ze.current = fe;
                    }
                  }
                  _e = _e.nextEffect;
                }
              } catch (Me) {
                if (_e === null) throw Error(c(330));
                Vn(_e, Me), _e = _e.nextEffect;
              }
            while (_e !== null);
            _e = null, Gy(), Ne = p;
          } else e.current = r;
          if (bi) bi = !1, Jr = e, eo = t;
          else for (_e = s; _e !== null; ) t = _e.nextEffect, _e.nextEffect = null, _e = t;
          if (t = e.firstPendingTime, t === 0 && (gn = null), t === 1073741823 ? e === Ts ? to++ : (to = 0, Ts = e) : to = 0, typeof Ps == "function" && Ps(r.stateNode, i), wt(e), yi) throw yi = !1, e = Ss, Ss = null, e;
          return (Ne & _s) === tt && zt(), null;
        }
        function gb() {
          for (; _e !== null; ) {
            var e = _e.effectTag;
            e & 256 && lb(_e.alternate, _e), !(e & 512) || bi || (bi = !0, Xu(97, function() {
              return pr(), null;
            })), _e = _e.nextEffect;
          }
        }
        function pr() {
          if (eo !== 90) {
            var e = 97 < eo ? 97 : eo;
            return eo = 90, un(e, yb);
          }
        }
        function yb() {
          if (Jr === null) return !1;
          var e = Jr;
          if (Jr = null, (Ne & (Dt | Ut)) !== tt) throw Error(c(331));
          var t = Ne;
          for (Ne |= Ut, e = e.current.firstEffect; e !== null; ) {
            try {
              var r = e;
              if (r.effectTag & 512) switch (r.tag) {
                case 0:
                case 11:
                case 15:
                case 22:
                  Pd(5, r), Dd(5, r);
              }
            } catch (i) {
              if (e === null) throw Error(c(330));
              Vn(e, i);
            }
            r = e.nextEffect, e.nextEffect = null, e = r;
          }
          return Ne = t, zt(), !0;
        }
        function Xd(e, t, r) {
          t = bs(r, t), t = Ld(e, t, 1073741823), fn(e, t), e = ki(e, 1073741823), e !== null && wt(e);
        }
        function Vn(e, t) {
          if (e.tag === 3) Xd(e, e, t);
          else for (var r = e.return; r !== null; ) {
            if (r.tag === 3) {
              Xd(r, e, t);
              break;
            } else if (r.tag === 1) {
              var i = r.stateNode;
              if (typeof r.type.getDerivedStateFromError == "function" || typeof i.componentDidCatch == "function" && (gn === null || !gn.has(i))) {
                e = bs(t, e), e = Ud(r, e, 1073741823), fn(r, e), r = ki(r, 1073741823), r !== null && wt(r);
                break;
              }
            }
            r = r.return;
          }
        }
        function bb(e, t, r) {
          var i = e.pingCache;
          i !== null && i.delete(t), kt === e && ht === r ? nt === fi || nt === pi && Xt === 1073741823 && _t() - Cs < $d ? Ln(e, ht) : gi = !0 : Zd(e, r) && (t = e.lastPingedTime, t !== 0 && t < r || (e.lastPingedTime = r, wt(e)));
        }
        function vb(e, t) {
          var r = e.stateNode;
          r !== null && r.delete(t), t = 0, t === 0 && (t = Vt(), t = jn(t, e, null)), e = ki(e, t), e !== null && wt(e);
        }
        var kb = function(e, t, r) {
          var i = t.expirationTime;
          if (e !== null) {
            var s = t.pendingProps;
            if (e.memoizedProps !== s || pt.current) Lt = !0;
            else {
              if (i < r) {
                switch (Lt = !1, t.tag) {
                  case 3:
                    Cd(t), fs();
                    break;
                  case 5:
                    if (ld(t), t.mode & 4 && r !== 1 && s.hidden) return t.expirationTime = t.childExpirationTime = 1, null;
                    break;
                  case 1:
                    ft(t.type) && $o(t);
                    break;
                  case 4:
                    ts(t, t.stateNode.containerInfo);
                    break;
                  case 10:
                    i = t.memoizedProps.value, s = t.type._context, We(Ko, s._currentValue), s._currentValue = i;
                    break;
                  case 13:
                    if (t.memoizedState !== null) return i = t.child.childExpirationTime, i !== 0 && i >= r ? Sd(e, t, r) : (We(Be, Be.current & 1), t = Gt(e, t, r), t === null ? null : t.sibling);
                    We(Be, Be.current & 1);
                    break;
                  case 19:
                    if (i = t.childExpirationTime >= r, e.effectTag & 64) {
                      if (i) return Od(e, t, r);
                      t.effectTag |= 64;
                    }
                    if (s = t.memoizedState, s !== null && (s.rendering = null, s.tail = null), We(Be, Be.current), !i) return null;
                }
                return Gt(e, t, r);
              }
              Lt = !1;
            }
          } else Lt = !1;
          switch (t.expirationTime = 0, t.tag) {
            case 2:
              if (i = t.type, e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= 2), e = t.pendingProps, s = ir(t, lt.current), sr(t, r), s = is(null, t, i, e, s, r), t.effectTag |= 1, typeof s == "object" && s && typeof s.render == "function" && s.$$typeof === void 0) {
                if (t.tag = 1, t.memoizedState = null, t.updateQueue = null, ft(i)) {
                  var p = !0;
                  $o(t);
                } else p = !1;
                t.memoizedState = s.state !== null && s.state !== void 0 ? s.state : null, Xa(t);
                var f = i.getDerivedStateFromProps;
                typeof f == "function" && Go(t, i, f, e), s.updater = Xo, t.stateNode = s, s._reactInternalFiber = t, Ja(t, i, e, r), t = ms(null, t, i, !0, p, r);
              } else t.tag = 0, vt(null, t, s, r), t = t.child;
              return t;
            case 16:
              e: {
                if (s = t.elementType, e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= 2), e = t.pendingProps, Wg(s), s._status !== 1) throw s._result;
                switch (s = s._result, t.type = s, p = t.tag = _b(s), e = Pt(s, e), p) {
                  case 0:
                    t = hs(null, t, s, e, r);
                    break e;
                  case 1:
                    t = xd(null, t, s, e, r);
                    break e;
                  case 11:
                    t = kd(null, t, s, e, r);
                    break e;
                  case 14:
                    t = wd(null, t, s, Pt(s.type, e), i, r);
                    break e;
                }
                throw Error(c(306, s, ""));
              }
              return t;
            case 0:
              return i = t.type, s = t.pendingProps, s = t.elementType === i ? s : Pt(i, s), hs(e, t, i, s, r);
            case 1:
              return i = t.type, s = t.pendingProps, s = t.elementType === i ? s : Pt(i, s), xd(e, t, i, s, r);
            case 3:
              if (Cd(t), i = t.updateQueue, e === null || i === null) throw Error(c(282));
              if (i = t.pendingProps, s = t.memoizedState, s = s === null ? null : s.element, Za(e, t), Wr(t, i, null, r), i = t.memoizedState.element, i === s) fs(), t = Gt(e, t, r);
              else {
                if ((s = t.stateNode.hydrate) && (mn = er(t.stateNode.containerInfo.firstChild), Yt = t, s = Mn = !0), s) for (r = es(t, null, i, r), t.child = r; r; ) r.effectTag = r.effectTag & -3 | 1024, r = r.sibling;
                else vt(e, t, i, r), fs();
                t = t.child;
              }
              return t;
            case 5:
              return ld(t), e === null && ps(t), i = t.type, s = t.pendingProps, p = e === null ? null : e.memoizedProps, f = s.children, Ma(i, s) ? f = null : p !== null && Ma(i, p) && (t.effectTag |= 16), _d(e, t), t.mode & 4 && r !== 1 && s.hidden ? (t.expirationTime = t.childExpirationTime = 1, t = null) : (vt(e, t, f, r), t = t.child), t;
            case 6:
              return e === null && ps(t), null;
            case 13:
              return Sd(e, t, r);
            case 4:
              return ts(t, t.stateNode.containerInfo), i = t.pendingProps, e === null ? t.child = lr(t, null, i, r) : vt(e, t, i, r), t.child;
            case 11:
              return i = t.type, s = t.pendingProps, s = t.elementType === i ? s : Pt(i, s), kd(e, t, i, s, r);
            case 7:
              return vt(e, t, t.pendingProps, r), t.child;
            case 8:
              return vt(e, t, t.pendingProps.children, r), t.child;
            case 12:
              return vt(e, t, t.pendingProps.children, r), t.child;
            case 10:
              e: {
                i = t.type._context, s = t.pendingProps, f = t.memoizedProps, p = s.value;
                var _ = t.type._context;
                if (We(Ko, _._currentValue), _._currentValue = p, f !== null) if (_ = f.value, p = Pn(_, p) ? 0 : (typeof i._calculateChangedBits == "function" ? i._calculateChangedBits(_, p) : 1073741823) | 0, p === 0) {
                  if (f.children === s.children && !pt.current) {
                    t = Gt(e, t, r);
                    break e;
                  }
                } else for (_ = t.child, _ !== null && (_.return = t); _ !== null; ) {
                  var F = _.dependencies;
                  if (F !== null) {
                    f = _.child;
                    for (var H = F.firstContext; H !== null; ) {
                      if (H.context === i && (H.observedBits & p) !== 0) {
                        _.tag === 1 && (H = pn(r, null), H.tag = 2, fn(_, H)), _.expirationTime < r && (_.expirationTime = r), H = _.alternate, H !== null && H.expirationTime < r && (H.expirationTime = r), ed(_.return, r), F.expirationTime < r && (F.expirationTime = r);
                        break;
                      }
                      H = H.next;
                    }
                  } else f = _.tag === 10 && _.type === t.type ? null : _.child;
                  if (f !== null) f.return = _;
                  else for (f = _; f !== null; ) {
                    if (f === t) {
                      f = null;
                      break;
                    }
                    if (_ = f.sibling, _ !== null) {
                      _.return = f.return, f = _;
                      break;
                    }
                    f = f.return;
                  }
                  _ = f;
                }
                vt(e, t, s.children, r), t = t.child;
              }
              return t;
            case 9:
              return s = t.type, p = t.pendingProps, i = p.children, sr(t, r), s = xt(s, p.unstable_observedBits), i = i(s), t.effectTag |= 1, vt(e, t, i, r), t.child;
            case 14:
              return s = t.type, p = Pt(s, t.pendingProps), p = Pt(s.type, p), wd(e, t, s, p, i, r);
            case 15:
              return Ed(e, t, t.type, t.pendingProps, i, r);
            case 17:
              return i = t.type, s = t.pendingProps, s = t.elementType === i ? s : Pt(i, s), e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= 2), t.tag = 1, ft(i) ? (e = !0, $o(t)) : e = !1, sr(t, r), id(t, i, s), Ja(t, i, s, r), ms(null, t, i, !0, e, r);
            case 19:
              return Od(e, t, r);
          }
          throw Error(c(156, t.tag));
        }, Ps = null, Ds = null;
        function wb(e) {
          if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u") return !1;
          var t = __REACT_DEVTOOLS_GLOBAL_HOOK__;
          if (t.isDisabled || !t.supportsFiber) return !0;
          try {
            var r = t.inject(e);
            Ps = function(i) {
              try {
                t.onCommitFiberRoot(r, i, void 0, (i.current.effectTag & 64) == 64);
              } catch {
              }
            }, Ds = function(i) {
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
        function Is(e) {
          return e = e.prototype, !(!e || !e.isReactComponent);
        }
        function _b(e) {
          if (typeof e == "function") return +!!Is(e);
          if (e != null) {
            if (e = e.$$typeof, e === na) return 11;
            if (e === oa) return 14;
          }
          return 2;
        }
        function Fn(e, t) {
          var r = e.alternate;
          return r === null ? (r = Ft(e.tag, t, e.key, e.mode), r.elementType = e.elementType, r.type = e.type, r.stateNode = e.stateNode, r.alternate = e, e.alternate = r) : (r.pendingProps = t, r.effectTag = 0, r.nextEffect = null, r.firstEffect = null, r.lastEffect = null), r.childExpirationTime = e.childExpirationTime, r.expirationTime = e.expirationTime, r.child = e.child, r.memoizedProps = e.memoizedProps, r.memoizedState = e.memoizedState, r.updateQueue = e.updateQueue, t = e.dependencies, r.dependencies = t === null ? null : { expirationTime: t.expirationTime, firstContext: t.firstContext, responders: t.responders }, r.sibling = e.sibling, r.index = e.index, r.ref = e.ref, r;
        }
        function _i(e, t, r, i, s, p) {
          var f = 2;
          if (i = e, typeof e == "function") Is(e) && (f = 1);
          else if (typeof e == "string") f = 5;
          else e: switch (e) {
            case Tn:
              return bn(r.children, s, p, t);
            case Bg:
              f = 8, s |= 7;
              break;
            case _c:
              f = 8, s |= 1;
              break;
            case xo:
              return e = Ft(12, r, t, s | 8), e.elementType = xo, e.type = xo, e.expirationTime = p, e;
            case Co:
              return e = Ft(13, r, t, s), e.type = Co, e.elementType = Co, e.expirationTime = p, e;
            case ra:
              return e = Ft(19, r, t, s), e.elementType = ra, e.expirationTime = p, e;
            default:
              if (typeof e == "object" && e) switch (e.$$typeof) {
                case xc:
                  f = 10;
                  break e;
                case Cc:
                  f = 9;
                  break e;
                case na:
                  f = 11;
                  break e;
                case oa:
                  f = 14;
                  break e;
                case Sc:
                  f = 16, i = null;
                  break e;
                case Tc:
                  f = 22;
                  break e;
              }
              throw Error(c(130, e == null ? e : typeof e, ""));
          }
          return t = Ft(f, r, t, s), t.elementType = e, t.type = i, t.expirationTime = p, t;
        }
        function bn(e, t, r, i) {
          return e = Ft(7, e, i, t), e.expirationTime = r, e;
        }
        function Rs(e, t, r) {
          return e = Ft(6, e, null, t), e.expirationTime = r, e;
        }
        function Ms(e, t, r) {
          return t = Ft(4, e.children === null ? [] : e.children, e.key, t), t.expirationTime = r, t.stateNode = { containerInfo: e.containerInfo, pendingChildren: null, implementation: e.implementation }, t;
        }
        function xb(e, t, r) {
          this.tag = t, this.current = null, this.containerInfo = e, this.pingCache = this.pendingChildren = null, this.finishedExpirationTime = 0, this.finishedWork = null, this.timeoutHandle = -1, this.pendingContext = this.context = null, this.hydrate = r, this.callbackNode = null, this.callbackPriority = 90, this.lastExpiredTime = this.lastPingedTime = this.nextKnownPendingLevel = this.lastSuspendedTime = this.firstSuspendedTime = this.firstPendingTime = 0;
        }
        function Zd(e, t) {
          var r = e.firstSuspendedTime;
          return e = e.lastSuspendedTime, r !== 0 && r >= t && e <= t;
        }
        function $n(e, t) {
          var r = e.firstSuspendedTime, i = e.lastSuspendedTime;
          r < t && (e.firstSuspendedTime = t), (i > t || r === 0) && (e.lastSuspendedTime = t), t <= e.lastPingedTime && (e.lastPingedTime = 0), t <= e.lastExpiredTime && (e.lastExpiredTime = 0);
        }
        function Jd(e, t) {
          t > e.firstPendingTime && (e.firstPendingTime = t);
          var r = e.firstSuspendedTime;
          r !== 0 && (t >= r ? e.firstSuspendedTime = e.lastSuspendedTime = e.nextKnownPendingLevel = 0 : t >= e.lastSuspendedTime && (e.lastSuspendedTime = t + 1), t > e.nextKnownPendingLevel && (e.nextKnownPendingLevel = t));
        }
        function As(e, t) {
          var r = e.lastExpiredTime;
          (r === 0 || r > t) && (e.lastExpiredTime = t);
        }
        function xi(e, t, r, i) {
          var s = t.current, p = Vt(), f = qr.suspense;
          p = jn(p, s, f);
          e: if (r) {
            r = r._reactInternalFiber;
            t: {
              if (On(r) !== r || r.tag !== 1) throw Error(c(170));
              var _ = r;
              do {
                switch (_.tag) {
                  case 3:
                    _ = _.stateNode.context;
                    break t;
                  case 1:
                    if (ft(_.type)) {
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
              if (ft(F)) {
                r = Vu(r, F, _);
                break e;
              }
            }
            r = _;
          } else r = cn;
          return t.context === null ? t.context = r : t.pendingContext = r, t = pn(p, f), t.payload = { element: e }, i = i === void 0 ? null : i, i !== null && (t.callback = i), fn(s, t), yn(s, p), p;
        }
        function zs(e) {
          if (e = e.current, !e.child) return null;
          switch (e.child.tag) {
            case 5:
              return e.child.stateNode;
            default:
              return e.child.stateNode;
          }
        }
        function ep(e, t) {
          e = e.memoizedState, e !== null && e.dehydrated !== null && e.retryTime < t && (e.retryTime = t);
        }
        function js(e, t) {
          ep(e, t), (e = e.alternate) && ep(e, t);
        }
        function Ls(e, t, r) {
          r = r != null && r.hydrate === !0;
          var i = new xb(e, t, r), s = Ft(3, null, null, t === 2 ? 7 : t === 1 ? 3 : 0);
          i.current = s, s.stateNode = i, Xa(s), e[Mr] = i.current, r && t !== 0 && Xg(e, e.nodeType === 9 ? e : e.ownerDocument), this._internalRoot = i;
        }
        Ls.prototype.render = function(e) {
          xi(e, this._internalRoot, null, null);
        }, Ls.prototype.unmount = function() {
          var e = this._internalRoot, t = e.containerInfo;
          xi(null, e, null, function() {
            t[Mr] = null;
          });
        };
        function no(e) {
          return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11 && (e.nodeType !== 8 || e.nodeValue !== " react-mount-point-unstable "));
        }
        function Cb(e, t) {
          if (t || (t = (t = e ? e.nodeType === 9 ? e.documentElement : e.firstChild : null, !(!t || t.nodeType !== 1 || !t.hasAttribute("data-reactroot")))), !t) for (var r; r = e.lastChild; ) e.removeChild(r);
          return new Ls(e, 0, t ? { hydrate: !0 } : void 0);
        }
        function Ci(e, t, r, i, s) {
          var p = r._reactRootContainer;
          if (p) {
            var f = p._internalRoot;
            if (typeof s == "function") {
              var _ = s;
              s = function() {
                var H = zs(f);
                _.call(H);
              };
            }
            xi(t, f, e, s);
          } else {
            if (p = r._reactRootContainer = Cb(r, i), f = p._internalRoot, typeof s == "function") {
              var F = s;
              s = function() {
                var H = zs(f);
                F.call(H);
              };
            }
            Wd(function() {
              xi(t, f, e, s);
            });
          }
          return zs(f);
        }
        function Sb(e, t, r) {
          var i = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
          return { $$typeof: Gn, key: i == null ? null : "" + i, children: e, containerInfo: t, implementation: r };
        }
        Jc = function(e) {
          if (e.tag === 13) {
            var t = qo(Vt(), 150, 100);
            yn(e, t), js(e, t);
          }
        }, ba = function(e) {
          e.tag === 13 && (yn(e, 3), js(e, 3));
        }, eu = function(e) {
          if (e.tag === 13) {
            var t = Vt();
            t = jn(t, e, null), yn(e, t), js(e, t);
          }
        }, D = function(e, t, r) {
          switch (t) {
            case "input":
              if (sa(e, r), t = r.name, r.type === "radio" && t != null) {
                for (r = e; r.parentNode; ) r = r.parentNode;
                for (r = r.querySelectorAll("input[name=" + JSON.stringify("" + t) + '][type="radio"]'), t = 0; t < r.length; t++) {
                  var i = r[t];
                  if (i !== e && i.form === e.form) {
                    var s = ja(i);
                    if (!s) throw Error(c(90));
                    Pc(i), sa(i, s);
                  }
                }
              }
              break;
            case "textarea":
              Ac(e, r);
              break;
            case "select":
              t = r.value, t != null && Xn(e, !!r.multiple, t, !1);
          }
        }, ee = Bd, ge = function(e, t, r, i, s) {
          var p = Ne;
          Ne |= 4;
          try {
            return un(98, e.bind(null, t, r, i, s));
          } finally {
            Ne = p, Ne === tt && zt();
          }
        }, X = function() {
          (Ne & (1 | Dt | Ut)) === tt && (pb(), pr());
        }, De = function(e, t) {
          var r = Ne;
          Ne |= 2;
          try {
            return e(t);
          } finally {
            Ne = r, Ne === tt && zt();
          }
        };
        function tp(e, t) {
          var r = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
          if (!no(t)) throw Error(c(200));
          return Sb(e, t, null, r);
        }
        var Tb = { Events: [zr, Nn, ja, V, J, tr, function(e) {
          ma(e, uy);
        }, le, q, Ro, No, pr, { current: !1 }] };
        (function(e) {
          var t = e.findFiberByHostInstance;
          return wb(a({}, e, { overrideHookState: null, overrideProps: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: Qe.ReactCurrentDispatcher, findHostInstanceByFiber: function(r) {
            return r = Qc(r), r === null ? null : r.stateNode;
          }, findFiberByHostInstance: function(r) {
            return t ? t(r) : null;
          }, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null }));
        })({ findFiberByHostInstance: Ar, bundleType: 0, version: "16.14.0", rendererPackageName: "react-dom" }), n.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Tb, n.createPortal = tp, n.findDOMNode = function(e) {
          if (e == null) return null;
          if (e.nodeType === 1) return e;
          var t = e._reactInternalFiber;
          if (t === void 0) throw typeof e.render == "function" ? Error(c(188)) : Error(c(268, Object.keys(e)));
          return e = Qc(t), e = e === null ? null : e.stateNode, e;
        }, n.flushSync = function(e, t) {
          if ((Ne & (Dt | Ut)) !== tt) throw Error(c(187));
          var r = Ne;
          Ne |= 1;
          try {
            return un(99, e.bind(null, t));
          } finally {
            Ne = r, zt();
          }
        }, n.hydrate = function(e, t, r) {
          if (!no(t)) throw Error(c(200));
          return Ci(null, e, t, !0, r);
        }, n.render = function(e, t, r) {
          if (!no(t)) throw Error(c(200));
          return Ci(null, e, t, !1, r);
        }, n.unmountComponentAtNode = function(e) {
          if (!no(e)) throw Error(c(40));
          return e._reactRootContainer ? (Wd(function() {
            Ci(null, null, e, !1, function() {
              e._reactRootContainer = null, e[Mr] = null;
            });
          }), !0) : !1;
        }, n.unstable_batchedUpdates = Bd, n.unstable_createPortal = function(e, t) {
          return tp(e, t, 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null);
        }, n.unstable_renderSubtreeIntoContainer = function(e, t, r, i) {
          if (!no(r)) throw Error(c(200));
          if (e == null || e._reactInternalFiber === void 0) throw Error(c(38));
          return Ci(e, t, r, !1, i);
        }, n.version = "16.14.0";
      })), mt = Z(((n, o) => {
        function a() {
          if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function")) try {
            __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(a);
          } catch (l) {
            console.error(l);
          }
        }
        a(), o.exports = Ye();
      })), v = Te(Et()), hr = Te(mt());
      function dt(n) {
        return "Minified Redux error #" + n + "; visit https://redux.js.org/Errors?code=" + n + " for the full message or use the non-minified dev environment for full errors. ";
      }
      var at = (function() {
        return typeof Symbol == "function" && Symbol.observable || "@@observable";
      })(), mr = function() {
        return Math.random().toString(36).substring(7).split("").join(".");
      }, gr = { INIT: "@@redux/INIT" + mr(), REPLACE: "@@redux/REPLACE" + mr() };
      function io(n) {
        if (typeof n != "object" || !n) return !1;
        for (var o = n; Object.getPrototypeOf(o) !== null; ) o = Object.getPrototypeOf(o);
        return Object.getPrototypeOf(n) === o;
      }
      function yr(n, o, a) {
        var l;
        if (typeof o == "function" && typeof a == "function" || typeof a == "function" && typeof arguments[3] == "function") throw Error(dt(0));
        if (typeof o == "function" && a === void 0 && (a = o, o = void 0), a !== void 0) {
          if (typeof a != "function") throw Error(dt(1));
          return a(yr)(n, o);
        }
        if (typeof n != "function") throw Error(dt(2));
        var c = n, d = o, u = [], y = u, b = !1;
        function g() {
          y === u && (y = u.slice());
        }
        function E() {
          if (b) throw Error(dt(3));
          return d;
        }
        function x(R) {
          if (typeof R != "function") throw Error(dt(4));
          if (b) throw Error(dt(5));
          var Y = !0;
          return g(), y.push(R), function() {
            if (Y) {
              if (b) throw Error(dt(6));
              Y = !1, g();
              var se = y.indexOf(R);
              y.splice(se, 1), u = null;
            }
          };
        }
        function N(R) {
          if (!io(R)) throw Error(dt(7));
          if (R.type === void 0) throw Error(dt(8));
          if (b) throw Error(dt(9));
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
          if (typeof R != "function") throw Error(dt(10));
          c = R, N({ type: gr.REPLACE });
        }
        function O() {
          var R, Y = x;
          return R = { subscribe: function(se) {
            if (typeof se != "object" || !se) throw Error(dt(11));
            function ie() {
              se.next && se.next(E());
            }
            return ie(), { unsubscribe: Y(ie) };
          } }, R[at] = function() {
            return this;
          }, R;
        }
        return N({ type: gr.INIT }), l = { dispatch: N, subscribe: x, getState: E, replaceReducer: S }, l[at] = O, l;
      }
      var mp = Z(((n, o) => {
        o.exports = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
      })), gp = Z(((n, o) => {
        var a = mp();
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
      })), ao = Z(((n, o) => {
        o.exports = gp()();
      })), Vs = v.createContext(null);
      function yp(n) {
        n();
      }
      var Fs = yp, bp = function(n) {
        return Fs = n;
      }, vp = function() {
        return Fs;
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
      var $s = { notify: function() {
      }, get: function() {
        return [];
      } };
      function Hs(n, o) {
        var a, l = $s;
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
          a && (a(), a = void 0, l.clear(), l = $s);
        }
        var E = { addNestedSub: c, notifyNestedSubs: d, handleChangeWrapper: u, isSubscribed: y, trySubscribe: b, tryUnsubscribe: g, getListeners: function() {
          return l;
        } };
        return E;
      }
      var Bs = typeof window < "u" && window.document !== void 0 && window.document.createElement !== void 0 ? v.useLayoutEffect : v.useEffect;
      function wp(n) {
        var o = n.store, a = n.context, l = n.children, c = (0, v.useMemo)(function() {
          return { store: o, subscription: Hs(o) };
        }, [o]), d = (0, v.useMemo)(function() {
          return o.getState();
        }, [o]);
        Bs(function() {
          var y = c.subscription;
          return y.onStateChange = y.notifyNestedSubs, y.trySubscribe(), d !== o.getState() && y.notifyNestedSubs(), function() {
            y.tryUnsubscribe(), y.onStateChange = null;
          };
        }, [c, d]);
        var u = a || Vs;
        return v.createElement(u.Provider, { value: c }, l);
      }
      function Zt() {
        return Zt = Object.assign ? Object.assign.bind() : function(n) {
          for (var o = 1; o < arguments.length; o++) {
            var a = arguments[o];
            for (var l in a) ({}).hasOwnProperty.call(a, l) && (n[l] = a[l]);
          }
          return n;
        }, Zt.apply(null, arguments);
      }
      function so(n, o) {
        if (n == null) return {};
        var a = {};
        for (var l in n) if ({}.hasOwnProperty.call(n, l)) {
          if (o.indexOf(l) !== -1) continue;
          a[l] = n[l];
        }
        return a;
      }
      var Ep = Z(((n) => {
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
        function ye(J) {
          return pe(J) === E;
        }
        n.AsyncMode = g, n.ConcurrentMode = E, n.ContextConsumer = b, n.ContextProvider = y, n.Element = a, n.ForwardRef = x, n.Fragment = c, n.Lazy = R, n.Memo = O, n.Portal = l, n.Profiler = u, n.StrictMode = d, n.Suspense = N, n.isAsyncMode = function(J) {
          return ye(J) || pe(J) === g;
        }, n.isConcurrentMode = ye, n.isContextConsumer = function(J) {
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
      })), _p = Z(((n, o) => {
        o.exports = Ep();
      })), xp = Z(((n, o) => {
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
            for (var ye = b(Y), J = b(se), we = 0; we < pe.length; ++we) {
              var A = pe[we];
              if (!c[A] && !(ie && ie[A]) && !(J && J[A]) && !(ye && ye[A])) {
                var V = N(se, A);
                try {
                  g(Y, A, V);
                } catch {
                }
              }
            }
          }
          return Y;
        }
        o.exports = R;
      })), Cp = Z(((n) => {
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
      })), Sp = Z(((n, o) => {
        o.exports = Cp();
      })), Ws = Te(xp()), Tp = Sp(), Op = ["getDisplayName", "methodName", "renderCountProp", "shouldHandleStateChanges", "storeKey", "withRef", "forwardRef", "context"], Np = ["reactReduxForwardedRef"], Pp = [], Dp = [null, null];
      function Ip(n, o) {
        var a = n[1];
        return [o.payload, a + 1];
      }
      function qs(n, o, a) {
        Bs(function() {
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
        var S = a.forwardRef, O = S === void 0 ? !1 : S, R = a.context, Y = R === void 0 ? Vs : R, se = so(a, Op), ie = Y;
        return function(ae) {
          var pe = ae.displayName || ae.name || "Component", ye = c(pe), J = Zt({}, se, { getDisplayName: c, methodName: u, renderCountProp: b, shouldHandleStateChanges: E, storeKey: N, displayName: ye, wrappedComponentName: pe, WrappedComponent: ae }), we = se.pure;
          function A(M) {
            return n(M.dispatch, J);
          }
          var V = we ? v.useMemo : function(M) {
            return M();
          };
          function te(M) {
            var G = (0, v.useMemo)(function() {
              var Qe = M.reactReduxForwardedRef, tn = so(M, Np);
              return [M.context, Qe, tn];
            }, [M]), le = G[0], q = G[1], ee = G[2], ge = (0, v.useMemo)(function() {
              return le && le.Consumer && (0, Tp.isContextConsumer)(v.createElement(le.Consumer, null)) ? le : ie;
            }, [le, ie]), X = (0, v.useContext)(ge), De = !!M.store && !!M.store.getState && !!M.store.dispatch;
            X && X.store;
            var W = De ? M.store : X.store, re = (0, v.useMemo)(function() {
              return A(W);
            }, [W]), ne = (0, v.useMemo)(function() {
              if (!E) return Dp;
              var Qe = Hs(W, De ? null : X.subscription);
              return [Qe, Qe.notifyNestedSubs.bind(Qe)];
            }, [W, De, X]), P = ne[0], B = ne[1], C = (0, v.useMemo)(function() {
              return De ? X : Zt({}, X, { subscription: P });
            }, [De, X, P]), U = (0, v.useReducer)(Ip, Pp, Ap), oe = U[0][0], he = U[1];
            if (oe && oe.error) throw oe.error;
            var Ee = (0, v.useRef)(), Ie = (0, v.useRef)(ee), Oe = (0, v.useRef)(), Se = (0, v.useRef)(!1), Ve = V(function() {
              return Oe.current && ee === Ie.current ? Oe.current : re(W.getState(), ee);
            }, [W, oe, ee]);
            qs(Rp, [Ie, Ee, Se, ee, Ve, Oe, B]), qs(Mp, [E, W, P, re, Ie, Ee, Se, Oe, B, he], [W, P, re]);
            var Ke = (0, v.useMemo)(function() {
              return v.createElement(ae, Zt({}, Ve, { ref: q }));
            }, [q, ae, Ve]);
            return (0, v.useMemo)(function() {
              return E ? v.createElement(ge.Provider, { value: C }, Ke) : Ke;
            }, [ge, Ke, C]);
          }
          var D = we ? v.memo(te) : te;
          if (D.WrappedComponent = ae, D.displayName = te.displayName = ye, O) {
            var w = v.forwardRef(function(M, G) {
              return v.createElement(D, Zt({}, M, { reactReduxForwardedRef: G }));
            });
            return w.displayName = ye, w.WrappedComponent = ae, (0, Ws.default)(w, ae);
          }
          return (0, Ws.default)(D, ae);
        };
      }
      function Ks(n, o) {
        return n === o ? n !== 0 || o !== 0 || 1 / n == 1 / o : n !== n && o !== o;
      }
      function Oi(n, o) {
        if (Ks(n, o)) return !0;
        if (typeof n != "object" || !n || typeof o != "object" || !o) return !1;
        var a = Object.keys(n), l = Object.keys(o);
        if (a.length !== l.length) return !1;
        for (var c = 0; c < a.length; c++) if (!Object.prototype.hasOwnProperty.call(o, a[c]) || !Ks(n[a[c]], o[a[c]])) return !1;
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
      function Ni(n) {
        return function(o, a) {
          var l = n(o, a);
          function c() {
            return l;
          }
          return c.dependsOnOwnProps = !1, c;
        };
      }
      function Qs(n) {
        return n.dependsOnOwnProps !== null && n.dependsOnOwnProps !== void 0 ? !!n.dependsOnOwnProps : n.length !== 1;
      }
      function Ys(n, o) {
        return function(a, l) {
          l.displayName;
          var c = function(d, u) {
            return c.dependsOnOwnProps ? c.mapToProps(d, u) : c.mapToProps(d);
          };
          return c.dependsOnOwnProps = !0, c.mapToProps = function(d, u) {
            c.mapToProps = n, c.dependsOnOwnProps = Qs(n);
            var y = c(d, u);
            return typeof y == "function" && (c.mapToProps = y, c.dependsOnOwnProps = Qs(y), y = c(d, u)), y;
          }, c;
        };
      }
      function Lp(n) {
        return typeof n == "function" ? Ys(n) : void 0;
      }
      function Up(n) {
        return n ? void 0 : Ni(function(o) {
          return { dispatch: o };
        });
      }
      function Vp(n) {
        return n && typeof n == "object" ? Ni(function(o) {
          return jp(n, o);
        }) : void 0;
      }
      var Fp = [Lp, Up, Vp];
      function $p(n) {
        return typeof n == "function" ? Ys(n) : void 0;
      }
      function Hp(n) {
        return n ? void 0 : Ni(function() {
          return {};
        });
      }
      var Bp = [$p, Hp];
      function Wp(n, o, a) {
        return Zt({}, a, n, o);
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
          var ye = !u(pe, E), J = !d(ae, g, pe, E);
          return g = ae, E = pe, ye && J ? R() : ye ? Y() : J ? se() : S;
        }
        return function(ae, pe) {
          return b ? ie(ae, pe) : O(ae, pe);
        };
      }
      function Jp(n, o) {
        var a = o.initMapStateToProps, l = o.initMapDispatchToProps, c = o.initMergeProps, d = so(o, Gp), u = a(n, d), y = l(n, d), b = c(n, d);
        return (d.pure ? Zp : Xp)(u, y, b, n, d);
      }
      var ef = ["pure", "areStatesEqual", "areOwnPropsEqual", "areStatePropsEqual", "areMergedPropsEqual"];
      function Pi(n, o, a) {
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
          var Y = R, se = Y.pure, ie = se === void 0 ? !0 : se, ae = Y.areStatesEqual, pe = ae === void 0 ? tf : ae, ye = Y.areOwnPropsEqual, J = ye === void 0 ? Oi : ye, we = Y.areStatePropsEqual, A = we === void 0 ? Oi : we, V = Y.areMergedPropsEqual, te = V === void 0 ? Oi : V, D = so(Y, ef), w = Pi(N, d, "mapStateToProps"), M = Pi(S, y, "mapDispatchToProps"), G = Pi(O, g, "mergeProps");
          return l(x, Zt({ methodName: "connect", getDisplayName: function(le) {
            return "Connect(" + le + ")";
          }, shouldHandleStateChanges: !!N, initMapStateToProps: w, initMapDispatchToProps: M, initMergeProps: G, pure: ie, areStatesEqual: pe, areOwnPropsEqual: J, areStatePropsEqual: A, areMergedPropsEqual: te }, D));
        };
      }
      var qe = nf();
      bp(hr.unstable_batchedUpdates);
      var Gs = "SET_MODEL_CURRENT_ROOT_NAME", Xs = "SET_MODEL_CURRENT_NODE", Zs = "SET_MODEL_ACTIVE_TAB", Js = "TOGGLE_MODEL_SHOW_MARKERS", el = "TOGGLE_MODEL_SHOW_COMPACT_TEXT", tl = "UPDATE_MODEL_STATE";
      function rf(n) {
        return { type: Gs, currentRootName: n };
      }
      function of(n) {
        return { type: Xs, currentNode: n };
      }
      function nl(n) {
        return { type: Zs, tabName: n };
      }
      function af() {
        return { type: Js };
      }
      function sf() {
        return { type: el };
      }
      function rl() {
        return { type: tl };
      }
      var ol = "TOGGLE_IS_COLLAPSED", il = "SET_HEIGHT", al = "SET_SIDE_PANE_WIDTH", En = "SET_EDITORS", _n = "SET_CURRENT_EDITOR_NAME", sl = "UPDATE_CURRENT_EDITOR_IS_READ_ONLY", Bn = "SET_ACTIVE_INSPECTOR_TAB";
      function ll() {
        return { type: ol };
      }
      function lf(n) {
        return { type: il, newHeight: n };
      }
      function cf(n) {
        return { type: al, newWidth: n };
      }
      function cl(n) {
        return { type: En, editors: n };
      }
      function ul(n) {
        return { type: _n, editorName: n };
      }
      function dl(n) {
        return { type: Bn, tabName: n };
      }
      function uf() {
        return { type: sl };
      }
      function pl(n) {
        return n && n.is("element");
      }
      function fl(n) {
        return n && n.is("rootElement");
      }
      function hl(n) {
        return n.getPath ? n.getPath() : n.path;
      }
      function Wn(n) {
        return { path: hl(n), stickiness: n.stickiness, index: n.index, isAtEnd: n.isAtEnd, isAtStart: n.isAtStart, offset: n.offset, textNode: n.textNode && n.textNode.data };
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
      function ml(n) {
        return [...n][0][0] || "";
      }
      function hf(n) {
        return !!n.model && !!n.editing;
      }
      function gl(n, o) {
        let a = Math.min(n.length, o.length);
        for (let l = 0; l < a; l++) if (n[l] != o[l]) return l;
        return n.length == o.length ? "same" : n.length < o.length ? "prefix" : "extension";
      }
      var lo = Z(((n) => {
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
      })), yl = Z(((n) => {
        Object.defineProperty(n, "__esModule", { value: !0 }), n.FunctionParser = n.dedentFunction = n.functionToString = n.USED_METHOD_KEY = void 0;
        var o = lo(), a = { " "() {
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
      })), mf = Z(((n) => {
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
      })), gf = Z(((n) => {
        Object.defineProperty(n, "__esModule", { value: !0 }), n.objectToString = void 0;
        var o = lo(), a = yl(), l = mf();
        n.objectToString = (y, b, g, E) => {
          if (typeof Buffer == "function" && Buffer.isBuffer(y)) return `Buffer.from(${g(y.toString("base64"))}, 'base64')`;
          if (typeof ap == "object" && y === ap) return d(y, b, g);
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
      })), yf = Z(((n) => {
        Object.defineProperty(n, "__esModule", { value: !0 }), n.toString = void 0;
        var o = lo(), a = gf(), l = yl(), c = { string: o.quoteString, number: (d) => Object.is(d, -0) ? "-0" : String(d), boolean: String, symbol: (d, u, y) => {
          let b = Symbol.keyFor(d);
          return b === void 0 ? `Symbol(${y(d.description)})` : `Symbol.for(${y(b)})`;
        }, bigint: (d, u, y) => `BigInt(${y(String(d))})`, undefined: String, object: a.objectToString, function: l.functionToString };
        n.toString = (d, u, y, b) => d === null ? "null" : c[typeof d](d, u, y, b);
      })), bf = Z(((n) => {
        Object.defineProperty(n, "__esModule", { value: !0 }), n.stringify = void 0;
        var o = yf(), a = lo(), l = Symbol("root");
        function c(u, y, b, g = {}) {
          let E = typeof b == "string" ? b : " ".repeat(b || 0), x = [], N = /* @__PURE__ */ new Set(), S = /* @__PURE__ */ new Map(), O = /* @__PURE__ */ new Map(), R = 0, { maxDepth: Y = 100, references: se = !1, skipUndefinedProperties: ie = !1, maxValues: ae = 1e5 } = g, pe = d(y), ye = (A, V) => {
            if (++R > ae || ie && A === void 0 || x.length > Y) return;
            if (V === void 0) return pe(A, E, ye, V);
            x.push(V);
            let te = J(A, V === l ? void 0 : V);
            return x.pop(), te;
          }, J = se ? (A, V) => {
            if (A !== null && (typeof A == "object" || typeof A == "function" || typeof A == "symbol")) {
              if (S.has(A)) return O.set(x.slice(1), S.get(A)), pe(void 0, E, ye, V);
              S.set(A, x.slice(1));
            }
            return pe(A, E, ye, V);
          } : (A, V) => {
            if (N.has(A)) return;
            N.add(A);
            let te = pe(A, E, ye, V);
            return N.delete(A), te;
          }, we = ye(u, l);
          if (O.size) {
            let A = E ? " " : "", V = E ? `
` : "", te = `var x${A}=${A}${we};${V}`;
            for (let [D, w] of O.entries()) {
              let M = a.stringifyPath(D, ye), G = a.stringifyPath(w, ye);
              te += `x${M}${A}=${A}x${G};${V}`;
            }
            return `(function${A}()${A}{${V}${te}return x;${V}}())`;
          }
          return we;
        }
        n.stringify = c;
        function d(u) {
          return u ? (y, b, g, E) => u(y, b, (x) => o.toString(x, b, g, E), E) : o.toString;
        }
      }))();
      function co(n, o = !0) {
        if (n === void 0) return "undefined";
        if (typeof n == "function") return "function() {…}";
        let a = (0, bf.stringify)(n, vf, null, { maxDepth: 2 });
        return o ? a : a.replace(/(^"|"$)/g, "");
      }
      function Xe(n) {
        let o = {};
        for (let a in n) o[a] = n[a], o[a].value = co(o[a].value);
        return o;
      }
      function bl(n, o) {
        return n.length > o ? n.substr(0, o) + `… [${n.length - o} characters left]` : n;
      }
      function vf(n, o, a) {
        return typeof n == "string" ? `"${n.replaceAll("'", '\\"')}"` : a(n);
      }
      var Di = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_", vl = ["#03a9f4", "#fb8c00", "#009688", "#e91e63", "#4caf50", "#00bcd4", "#607d8b", "#cddc39", "#9c27b0", "#f44336", "#6d4c41", "#8bc34a", "#3f51b5", "#2196f3", "#f4511e", "#673ab7", "#ffb300"];
      function kl(n) {
        if (!n) return [];
        let o = [...n.model.document.roots];
        return o.filter(({ rootName: a }) => a !== "$graveyard").concat(o.filter(({ rootName: a }) => a === "$graveyard"));
      }
      function kf(n, o) {
        if (!n) return [];
        let a = [], l = n.model;
        for (let c of l.document.selection.getRanges()) c.root.rootName === o && a.push({ type: "selection", start: Wn(c.start), end: Wn(c.end) });
        return a;
      }
      function wf(n, o) {
        if (!n) return [];
        let a = [], l = n.model, c = 0;
        for (let d of l.markers) {
          let { name: u, affectsData: y, managedUsingOperations: b } = d, g = d.getStart(), E = d.getEnd();
          g.root.rootName === o && a.push({ type: "marker", marker: d, name: u, affectsData: y, managedUsingOperations: b, presentation: { color: vl[c++ % (vl.length - 1)] }, start: Wn(g), end: Wn(E) });
        }
        return a;
      }
      function Ef({ currentEditor: n, currentRootName: o, ranges: a, markers: l }) {
        return n ? [El(n.model.document.getRoot(o), [...a, ...l])] : [];
      }
      function wl(n, o) {
        let a = { editorNode: o, properties: {}, attributes: {} };
        pl(o) ? (fl(o) ? (a.type = "RootElement", a.name = o.rootName, a.url = `${Di}rootelement-RootElement.html`) : (a.type = "Element", a.name = o.name, a.url = `${Di}element-Element.html`), a.properties = { childCount: { value: o.childCount }, startOffset: { value: o.startOffset }, endOffset: { value: o.endOffset }, maxOffset: { value: o.maxOffset } }) : (a.name = o.data, a.type = "Text", a.url = `${Di}text-Text.html`, a.properties = { startOffset: { value: o.startOffset }, endOffset: { value: o.endOffset }, offsetSize: { value: o.offsetSize } }), a.properties.path = { value: hl(o) }, xl(o).forEach(([l, c]) => {
          a.attributes[l] = { value: c };
        }), a.properties = Xe(a.properties), a.attributes = Xe(a.attributes);
        for (let l in a.attributes) {
          let c = {}, d = n.model.schema.getAttributeProperties(l);
          for (let u in d) c[u] = { value: d[u] };
          a.attributes[l].subProperties = Xe(c);
        }
        return a;
      }
      function El(n, o) {
        let a = {}, { startOffset: l, endOffset: c } = n;
        return Object.assign(a, { startOffset: l, endOffset: c, node: n, path: n.getPath(), positionsBefore: [], positionsAfter: [] }), pl(n) ? _f(a, o) : Cf(a), a;
      }
      function _f(n, o) {
        let a = n.node;
        Object.assign(n, { type: "element", name: a.name, children: [], maxOffset: a.maxOffset, positions: [] });
        for (let l of a.getChildren()) n.children.push(El(l, o));
        xf(n, o), n.attributes = _l(a);
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
        Object.assign(n, { type: "text", text: o.data, positions: [], presentation: { dontRenderAttributeValue: !0 } }), n.attributes = _l(o);
      }
      function _l(n) {
        let o = xl(n).map(([a, l]) => [a, co(l, !1)]);
        return new Map(o);
      }
      function xl(n) {
        return [...n.getAttributes()].sort(([o], [a]) => o < a ? -1 : 1);
      }
      function Sf(n, o) {
        let a = n.path, l = o.start.path, c = o.end.path, d = [];
        return Cl(a, l) && d.push({ offset: l[l.length - 1], isEnd: !1, presentation: o.presentation || null, type: o.type, name: o.name || null }), Cl(a, c) && d.push({ offset: c[c.length - 1], isEnd: !0, presentation: o.presentation || null, type: o.type, name: o.name || null }), d;
      }
      function Cl(n, o) {
        return n.length === o.length - 1 && gl(n, o) === "prefix";
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
      function xn(n) {
        return n.editors.get(n.currentEditorName);
      }
      var Je = class {
        static set(n, o) {
          window.localStorage.setItem("ck5-inspector-" + n, o);
        }
        static get(n) {
          return window.localStorage.getItem("ck5-inspector-" + n);
        }
      }, Of = "active-model-tab-name", Sl = "model-show-markers", Tl = "model-compact-text";
      function Nf(n, o, a) {
        let l = Pf(n, o, a);
        return l && (l.ui = Df(l.ui, a)), l;
      }
      function Pf(n, o, a) {
        if (n.ui.activeTab !== "Model") return o;
        if (!o) return Ol(n, o);
        switch (a.type) {
          case Gs:
            return If(n, o, a);
          case Xs:
            return { ...o, currentNode: a.currentNode, currentNodeDefinition: wl(xn(n), a.currentNode) };
          case Bn:
          case tl:
            return { ...o, ...Ii(n, o) };
          case En:
          case _n:
            return Ol(n, o);
          default:
            return o;
        }
      }
      function Df(n, o) {
        if (!n) return { activeTab: Je.get("active-model-tab-name") || "Inspect", showMarkers: Je.get(Sl) === "true", showCompactText: Je.get(Tl) === "true" };
        switch (o.type) {
          case Zs:
            return Rf(n, o);
          case Js:
            return Mf(n);
          case el:
            return Af(n);
          default:
            return n;
        }
      }
      function If(n, o, a) {
        let l = a.currentRootName;
        return { ...o, ...Ii(n, o, { currentRootName: l }), currentNode: null, currentNodeDefinition: null, currentRootName: l };
      }
      function Rf(n, o) {
        return Je.set(Of, o.tabName), { ...n, activeTab: o.tabName };
      }
      function Mf(n) {
        let o = !n.showMarkers;
        return Je.set(Sl, o), { ...n, showMarkers: o };
      }
      function Af(n) {
        let o = !n.showCompactText;
        return Je.set(Tl, o), { ...n, showCompactText: o };
      }
      function Ol(n, o = {}) {
        let a = xn(n);
        if (!a) return { ui: o.ui };
        let l = kl(a)[0].rootName;
        return { ...o, ...Ii(n, o, { currentRootName: l }), currentRootName: l, currentNode: null, currentNodeDefinition: null };
      }
      function Ii(n, o, a) {
        let l = xn(n), c = { ...o, ...a }, d = c.currentRootName, u = kf(l, d), y = wf(l, d), b = Ef({ currentEditor: l, currentRootName: c.currentRootName, ranges: u, markers: y }), g = c.currentNode, E = c.currentNodeDefinition;
        return g ? g.root.rootName !== d || !fl(g) && !g.parent ? (g = null, E = null) : E = wl(l, g) : E = null, { treeDefinition: b, currentNode: g, currentNodeDefinition: E, ranges: u, markers: y };
      }
      var Nl = "SET_VIEW_CURRENT_ROOT_NAME", Pl = "SET_VIEW_CURRENT_NODE", Dl = "SET_VIEW_ACTIVE_TAB", Il = "TOGGLE_VIEW_SHOW_ELEMENT_TYPES", Rl = "UPDATE_VIEW_STATE";
      function zf(n) {
        return { type: Nl, currentRootName: n };
      }
      function jf(n) {
        return { type: Pl, currentNode: n };
      }
      function Ml(n) {
        return { type: Dl, tabName: n };
      }
      function Lf() {
        return { type: Il };
      }
      function Ri() {
        return { type: Rl };
      }
      function Jt(n) {
        return n && n.name;
      }
      function Mi(n) {
        return n && Jt(n) && n.is("attributeElement");
      }
      function Ai(n) {
        return n && Jt(n) && n.is("emptyElement");
      }
      function zi(n) {
        return n && Jt(n) && n.is("uiElement");
      }
      function ji(n) {
        return n && Jt(n) && n.is("rawElement");
      }
      function Uf(n) {
        return n && Jt(n) && n.is("editableElement");
      }
      function uo(n) {
        return n && n.is("rootElement");
      }
      function po(n) {
        return { path: [...n.parent.getPath(), n.offset], offset: n.offset, isAtEnd: n.isAtEnd, isAtStart: n.isAtStart, parent: Vf(n.parent) };
      }
      function Vf(n) {
        return Jt(n) ? Mi(n) ? "attribute:" + n.name : uo(n) ? "root:" + n.name : "container:" + n.name : n.data;
      }
      var Ot = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_view", Ff = `&lt;!--The View UI element content has been skipped. <a href="${Ot}_uielement-UIElement.html" target="_blank">Find out why</a>. --&gt;`, $f = `&lt;!--The View raw element content has been skipped. <a href="${Ot}_rawelement-RawElement.html" target="_blank">Find out why</a>. --&gt;`;
      function Al(n) {
        return n ? [...n.editing.view.document.roots] : [];
      }
      function Hf(n, o) {
        if (!n) return [];
        let a = [], l = n.editing.view.document.selection;
        for (let c of l.getRanges()) c.root.rootName === o && a.push({ type: "selection", start: po(c.start), end: po(c.end) });
        return a;
      }
      function Bf({ currentEditor: n, currentRootName: o, ranges: a }) {
        return !n || !o ? null : [jl(n.editing.view.document.getRoot(o), [...a])];
      }
      function zl(n) {
        let o = { editorNode: n, properties: {}, attributes: {}, customProperties: {} };
        if (Jt(n)) {
          uo(n) ? (o.type = "RootEditableElement", o.name = n.rootName, o.url = `${Ot}_rooteditableelement-RootEditableElement.html`) : (o.name = n.name, Mi(n) ? (o.type = "AttributeElement", o.url = `${Ot}_attributeelement-AttributeElement.html`) : Ai(n) ? (o.type = "EmptyElement", o.url = `${Ot}_emptyelement-EmptyElement.html`) : zi(n) ? (o.type = "UIElement", o.url = `${Ot}_uielement-UIElement.html`) : ji(n) ? (o.type = "RawElement", o.url = `${Ot}_rawelement-RawElement.html`) : Uf(n) ? (o.type = "EditableElement", o.url = `${Ot}_editableelement-EditableElement.html`) : (o.type = "ContainerElement", o.url = `${Ot}_containerelement-ContainerElement.html`)), Vl(n).forEach(([a, l]) => {
            o.attributes[a] = { value: l };
          }), o.properties = { index: { value: n.index }, isEmpty: { value: n.isEmpty }, childCount: { value: n.childCount } };
          for (let [a, l] of n.getCustomProperties()) typeof a == "symbol" && (a = a.toString()), o.customProperties[a] = { value: l };
        } else o.name = n.data, o.type = "Text", o.url = `${Ot}_text-Text.html`, o.properties = { index: { value: n.index } };
        return o.properties = Xe(o.properties), o.customProperties = Xe(o.customProperties), o.attributes = Xe(o.attributes), o;
      }
      function jl(n, o) {
        let a = {};
        return Object.assign(a, { index: n.index, path: n.getPath(), node: n, positionsBefore: [], positionsAfter: [] }), Jt(n) ? Wf(a, o) : qf(a, o), a;
      }
      function Wf(n, o) {
        let a = n.node;
        Object.assign(n, { type: "element", children: [], positions: [] }), n.name = a.name, Mi(a) ? n.elementType = "attribute" : uo(a) ? n.elementType = "root" : Ai(a) ? n.elementType = "empty" : zi(a) ? n.elementType = "ui" : ji(a) ? n.elementType = "raw" : n.elementType = "container", Ai(a) ? n.presentation = { isEmpty: !0 } : zi(a) ? n.children.push({ type: "comment", text: Ff }) : ji(a) && n.children.push({ type: "comment", text: $f });
        for (let l of a.getChildren()) n.children.push(jl(l, o));
        Kf(n, o), n.attributes = Qf(a);
      }
      function qf(n, o) {
        Object.assign(n, { type: "text", startOffset: 0, text: n.node.data, positions: [] });
        for (let a of o) {
          let l = Ll(n, a);
          n.positions.push(...l);
        }
      }
      function Kf(n, o) {
        for (let a of o) {
          let l = Ll(n, a);
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
      function Ll(n, o) {
        let a = n.path, l = o.start.path, c = o.end.path, d = [];
        return Ul(a, l) && d.push({ offset: l[l.length - 1], isEnd: !1, presentation: o.presentation || null, type: o.type, name: o.name || null }), Ul(a, c) && d.push({ offset: c[c.length - 1], isEnd: !0, presentation: o.presentation || null, type: o.type, name: o.name || null }), d;
      }
      function Ul(n, o) {
        return n.length === o.length - 1 && gl(n, o) === "prefix";
      }
      function Qf(n) {
        let o = Vl(n).map(([a, l]) => [a, co(l, !1)]);
        return new Map(o);
      }
      function Vl(n) {
        return [...n.getAttributes()].sort(([o], [a]) => o.toUpperCase() < a.toUpperCase() ? -1 : 1);
      }
      var Yf = "active-view-tab-name", Fl = "view-element-types";
      function Gf(n, o, a) {
        let l = Xf(n, o, a);
        return l && (l.ui = Zf(n, l.ui, a)), l;
      }
      function Xf(n, o, a) {
        if (n.ui.activeTab !== "View") return o;
        if (!o) return $l(n, o);
        switch (a.type) {
          case Nl:
            return Jf(n, o, a);
          case Pl:
            return { ...o, currentNode: a.currentNode, currentNodeDefinition: zl(a.currentNode) };
          case Bn:
          case Rl:
            return { ...o, ...Li(n, o) };
          case En:
          case _n:
            return $l(n, o);
          default:
            return o;
        }
      }
      function Zf(n, o, a) {
        if (!o) return { activeTab: Je.get("active-view-tab-name") || "Inspect", showElementTypes: Je.get(Fl) === "true" };
        switch (a.type) {
          case Dl:
            return eh(o, a);
          case Il:
            return th(n, o);
          default:
            return o;
        }
      }
      function Jf(n, o, a) {
        let l = a.currentRootName;
        return { ...o, ...Li(n, o, { currentRootName: l }), currentNode: null, currentNodeDefinition: null, currentRootName: l };
      }
      function eh(n, o) {
        return Je.set(Yf, o.tabName), { ...n, activeTab: o.tabName };
      }
      function th(n, o) {
        let a = !o.showElementTypes;
        return Je.set(Fl, a), { ...o, showElementTypes: a };
      }
      function $l(n, o = {}) {
        let a = Al(xn(n)), l = a[0] ? a[0].rootName : null;
        return { ...o, ...Li(n, o, { currentRootName: l }), currentRootName: l, currentNode: null, currentNodeDefinition: null };
      }
      function Li(n, o, a) {
        let l = { ...o, ...a }, c = l.currentRootName, d = Hf(xn(n), c), u = Bf({ currentEditor: xn(n), currentRootName: c, ranges: d }), y = l.currentNode, b = l.currentNodeDefinition;
        return y ? y.root.rootName !== c || !uo(y) && !y.parent ? (y = null, b = null) : b = zl(y) : b = null, { treeDefinition: u, currentNode: y, currentNodeDefinition: b, ranges: d };
      }
      var Hl = "SET_COMMANDS_CURRENT_COMMAND_NAME", Bl = "UPDATE_COMMANDS_STATE";
      function nh(n) {
        return { type: Hl, currentCommandName: n };
      }
      function Ui() {
        return { type: Bl };
      }
      function Wl({ editors: n, currentEditorName: o }, a) {
        if (!a) return null;
        let l = n.get(o).commands.get(a);
        return { currentCommandName: a, type: "Command", url: "https://ckeditor.com/docs/ckeditor5/latest/api/module_core_command-Command.html", properties: Xe({ isEnabled: { value: l.isEnabled }, value: { value: l.value } }), command: l };
      }
      function ql({ editors: n, currentEditorName: o }) {
        if (!n.get(o)) return [];
        let a = [];
        for (let [l, c] of n.get(o).commands) {
          let d = [];
          c.value !== void 0 && d.push(["value", co(c.value, !1)]), a.push({ name: l, type: "element", children: [], node: l, attributes: d, presentation: { isEmpty: !0, cssClass: ["ck-inspector-tree-node_tagless", c.isEnabled ? "" : "ck-inspector-tree-node_disabled"].join(" ") } });
        }
        return a.sort((l, c) => l.name > c.name ? 1 : -1);
      }
      function rh(n, o, a) {
        if (n.ui.activeTab !== "Commands") return o;
        if (!o) return Kl(n, o);
        switch (a.type) {
          case Hl:
            return { ...o, currentCommandDefinition: Wl(n, a.currentCommandName), currentCommandName: a.currentCommandName };
          case Bn:
          case Bl:
            return { ...o, currentCommandDefinition: Wl(n, o.currentCommandName), treeDefinition: ql(n) };
          case En:
          case _n:
            return Kl(n, o);
          default:
            return o;
        }
      }
      function Kl(n, o = {}) {
        return { ...o, currentCommandName: null, currentCommandDefinition: null, treeDefinition: ql(n) };
      }
      var Ql = "SET_SCHEMA_CURRENT_DEFINITION_NAME";
      function Vi(n) {
        return { type: Ql, currentSchemaDefinitionName: n };
      }
      var oh = ["isBlock", "isInline", "isObject", "isContent", "isLimit", "isSelectable"];
      function Yl({ editors: n, currentEditorName: o }, a) {
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
      function Gl({ editors: n, currentEditorName: o }) {
        if (!n.get(o)) return [];
        let a = [], l = n.get(o).model.schema.getDefinitions();
        for (let c in l) a.push({ name: c, type: "element", children: [], node: c, attributes: [], presentation: { isEmpty: !0, cssClass: "ck-inspector-tree-node_tagless" } });
        return a.sort((c, d) => c.name > d.name ? 1 : -1);
      }
      function ih(n, o, a) {
        if (n.ui.activeTab !== "Schema") return o;
        if (!o) return Xl(n, o);
        switch (a.type) {
          case Ql:
            return { ...o, currentSchemaDefinition: Yl(n, a.currentSchemaDefinitionName), currentSchemaDefinitionName: a.currentSchemaDefinitionName };
          case Bn:
            return { ...o, currentSchemaDefinition: Yl(n, o.currentSchemaDefinitionName), treeDefinition: Gl(n) };
          case En:
          case _n:
            return Xl(n, o);
          default:
            return o;
        }
      }
      function Xl(n, o = {}) {
        return { ...o, currentSchemaDefinitionName: null, currentSchemaDefinition: null, treeDefinition: Gl(n) };
      }
      var ah = "active-tab-name", Zl = "is-collapsed", sh = "height", lh = "side-pane-width";
      function ch(n, o) {
        let a = uh(n, o);
        return a.currentEditorGlobals = dh(a, a.currentEditorGlobals, o), a.ui = ph(a.ui, o), a.model = Nf(a, a.model, o), a.view = Gf(a, a.view, o), a.commands = rh(a, a.commands, o), a.schema = ih(a, a.schema, o), { ...n, ...a };
      }
      function uh(n, o) {
        switch (o.type) {
          case En:
            return mh(n, o);
          case _n:
            return fh(n, o);
          default:
            return n;
        }
      }
      function dh(n, o, a) {
        switch (a.type) {
          case En:
          case _n:
            return hh(n);
          case sl:
            return Jl(n, o);
          default:
            return o;
        }
      }
      function ph(n, o) {
        if (!n.activeTab) {
          let a;
          return a = n.isCollapsed === void 0 ? Je.get(Zl) === "true" : n.isCollapsed, { ...n, isCollapsed: a, activeTab: Je.get("active-tab-name") || "Model", height: Je.get("height") || "400px", sidePaneWidth: Je.get("side-pane-width") || "500px" };
        }
        switch (o.type) {
          case ol:
            return bh(n);
          case il:
            return gh(n, o);
          case al:
            return yh(n, o);
          case Bn:
            return vh(n, o);
          default:
            return n;
        }
      }
      function fh(n, o) {
        return { ...n, currentEditorName: o.editorName };
      }
      function hh(n) {
        return { ...Jl(n, {}) };
      }
      function Jl(n, o) {
        let a = xn(n);
        return { ...o, isReadOnly: a ? a.isReadOnly : !1 };
      }
      function mh(n, o) {
        let a = { editors: new Map(o.editors) };
        return o.editors.size ? o.editors.has(n.currentEditorName) || (a.currentEditorName = ml(o.editors)) : a.currentEditorName = null, { ...n, ...a };
      }
      function gh(n, o) {
        return Je.set(sh, o.newHeight), { ...n, height: o.newHeight };
      }
      function yh(n, o) {
        return Je.set(lh, o.newWidth), { ...n, sidePaneWidth: o.newWidth };
      }
      function bh(n) {
        let o = !n.isCollapsed;
        return Je.set(Zl, o), { ...n, isCollapsed: o };
      }
      function vh(n, o) {
        return Je.set(ah, o.tabName), { ...n, activeTab: o.tabName };
      }
      var kh = Z(((n, o) => {
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
      })), fo = Z(((n) => {
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
      })), wh = Z(((n) => {
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
      })), Fi = Z(((n) => {
        function o(w) {
          "@babel/helpers - typeof";
          return o = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(M) {
            return typeof M;
          } : function(M) {
            return M && typeof Symbol == "function" && M.constructor === Symbol && M !== Symbol.prototype ? "symbol" : typeof M;
          }, o(w);
        }
        Object.defineProperty(n, "__esModule", { value: !0 }), n.matchesSelector = E, n.matchesSelectorAndParentsTo = x, n.addEvent = N, n.removeEvent = S, n.outerHeight = O, n.outerWidth = R, n.innerHeight = Y, n.innerWidth = se, n.offsetXYFromParent = ie, n.createCSSTransform = ae, n.createSVGTransform = pe, n.getTranslation = ye, n.getTouch = J, n.getTouchIdentifier = we, n.addUserSelectStyles = A, n.removeUserSelectStyles = V, n.addClassName = te, n.removeClassName = D;
        var a = fo(), l = d(wh());
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
          var G = {}, le = Object.defineProperty && Object.getOwnPropertyDescriptor;
          for (var q in w) if (Object.prototype.hasOwnProperty.call(w, q)) {
            var ee = le ? Object.getOwnPropertyDescriptor(w, q) : null;
            ee && (ee.get || ee.set) ? Object.defineProperty(G, q, ee) : G[q] = w[q];
          }
          return G.default = w, M && M.set(w, G), G;
        }
        function u(w, M) {
          var G = Object.keys(w);
          if (Object.getOwnPropertySymbols) {
            var le = Object.getOwnPropertySymbols(w);
            M && (le = le.filter(function(q) {
              return Object.getOwnPropertyDescriptor(w, q).enumerable;
            })), G.push.apply(G, le);
          }
          return G;
        }
        function y(w) {
          for (var M = 1; M < arguments.length; M++) {
            var G = arguments[M] == null ? {} : arguments[M];
            M % 2 ? u(Object(G), !0).forEach(function(le) {
              b(w, le, G[le]);
            }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(w, Object.getOwnPropertyDescriptors(G)) : u(Object(G)).forEach(function(le) {
              Object.defineProperty(w, le, Object.getOwnPropertyDescriptor(G, le));
            });
          }
          return w;
        }
        function b(w, M, G) {
          return M in w ? Object.defineProperty(w, M, { value: G, enumerable: !0, configurable: !0, writable: !0 }) : w[M] = G, w;
        }
        var g = "";
        function E(w, M) {
          return g || (g = (0, a.findInArray)(["matches", "webkitMatchesSelector", "mozMatchesSelector", "msMatchesSelector", "oMatchesSelector"], function(G) {
            return (0, a.isFunction)(w[G]);
          })), (0, a.isFunction)(w[g]) ? w[g](M) : !1;
        }
        function x(w, M, G) {
          var le = w;
          do {
            if (E(le, M)) return !0;
            if (le === G) return !1;
            le = le.parentNode;
          } while (le);
          return !1;
        }
        function N(w, M, G, le) {
          if (w) {
            var q = y({ capture: !0 }, le);
            w.addEventListener ? w.addEventListener(M, G, q) : w.attachEvent ? w.attachEvent("on" + M, G) : w["on" + M] = G;
          }
        }
        function S(w, M, G, le) {
          if (w) {
            var q = y({ capture: !0 }, le);
            w.removeEventListener ? w.removeEventListener(M, G, q) : w.detachEvent ? w.detachEvent("on" + M, G) : w["on" + M] = null;
          }
        }
        function O(w) {
          var M = w.clientHeight, G = w.ownerDocument.defaultView.getComputedStyle(w);
          return M += (0, a.int)(G.borderTopWidth), M += (0, a.int)(G.borderBottomWidth), M;
        }
        function R(w) {
          var M = w.clientWidth, G = w.ownerDocument.defaultView.getComputedStyle(w);
          return M += (0, a.int)(G.borderLeftWidth), M += (0, a.int)(G.borderRightWidth), M;
        }
        function Y(w) {
          var M = w.clientHeight, G = w.ownerDocument.defaultView.getComputedStyle(w);
          return M -= (0, a.int)(G.paddingTop), M -= (0, a.int)(G.paddingBottom), M;
        }
        function se(w) {
          var M = w.clientWidth, G = w.ownerDocument.defaultView.getComputedStyle(w);
          return M -= (0, a.int)(G.paddingLeft), M -= (0, a.int)(G.paddingRight), M;
        }
        function ie(w, M, G) {
          var le = M === M.ownerDocument.body ? { left: 0, top: 0 } : M.getBoundingClientRect();
          return { x: (w.clientX + M.scrollLeft - le.left) / G, y: (w.clientY + M.scrollTop - le.top) / G };
        }
        function ae(w, M) {
          var G = ye(w, M, "px");
          return b({}, (0, l.browserPrefixToKey)("transform", l.default), G);
        }
        function pe(w, M) {
          return ye(w, M, "");
        }
        function ye(w, M, G) {
          var le = `translate(${w.x}${G},${w.y}${G})`;
          return M && (le = `translate(${`${typeof M.x == "string" ? M.x : M.x + G}`}, ${`${typeof M.y == "string" ? M.y : M.y + G}`})` + le), le;
        }
        function J(w, M) {
          return w.targetTouches && (0, a.findInArray)(w.targetTouches, function(G) {
            return M === G.identifier;
          }) || w.changedTouches && (0, a.findInArray)(w.changedTouches, function(G) {
            return M === G.identifier;
          });
        }
        function we(w) {
          if (w.targetTouches && w.targetTouches[0]) return w.targetTouches[0].identifier;
          if (w.changedTouches && w.changedTouches[0]) return w.changedTouches[0].identifier;
        }
        function A(w) {
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
      })), ec = Z(((n) => {
        Object.defineProperty(n, "__esModule", { value: !0 }), n.getBoundPosition = l, n.snapToGrid = c, n.canDragX = d, n.canDragY = u, n.getControlPosition = y, n.createCoreData = b, n.createDraggableData = g;
        var o = fo(), a = Fi();
        function l(N, S, O) {
          if (!N.props.bounds) return [S, O];
          var R = N.props.bounds;
          R = typeof R == "string" ? R : E(R);
          var Y = x(N);
          if (typeof R == "string") {
            var se = Y.ownerDocument, ie = se.defaultView, ae = R === "parent" ? Y.parentNode : se.querySelector(R);
            if (!(ae instanceof ie.HTMLElement)) throw Error('Bounds selector "' + R + '" could not find an element.');
            var pe = ie.getComputedStyle(Y), ye = ie.getComputedStyle(ae);
            R = { left: -Y.offsetLeft + (0, o.int)(ye.paddingLeft) + (0, o.int)(pe.marginLeft), top: -Y.offsetTop + (0, o.int)(ye.paddingTop) + (0, o.int)(pe.marginTop), right: (0, a.innerWidth)(ae) - (0, a.outerWidth)(Y) - Y.offsetLeft + (0, o.int)(ye.paddingRight) - (0, o.int)(pe.marginRight), bottom: (0, a.innerHeight)(ae) - (0, a.outerHeight)(Y) - Y.offsetTop + (0, o.int)(ye.paddingBottom) - (0, o.int)(pe.marginBottom) };
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
      })), tc = Z(((n) => {
        Object.defineProperty(n, "__esModule", { value: !0 }), n.default = o;
        function o() {
        }
      })), Eh = Z(((n) => {
        Object.defineProperty(n, "__esModule", { value: !0 }), n.default = void 0;
        var o = E(Et()), a = b(ao()), l = b(mt()), c = Fi(), d = ec(), u = fo(), y = b(tc());
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
          var ge = {}, X = Object.defineProperty && Object.getOwnPropertyDescriptor;
          for (var De in q) if (Object.prototype.hasOwnProperty.call(q, De)) {
            var W = X ? Object.getOwnPropertyDescriptor(q, De) : null;
            W && (W.get || W.set) ? Object.defineProperty(ge, De, W) : ge[De] = q[De];
          }
          return ge.default = q, ee && ee.set(q, ge), ge;
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
            var ge = Object.prototype.toString.call(q).slice(8, -1);
            if (ge === "Object" && q.constructor && (ge = q.constructor.name), ge === "Map" || ge === "Set") return Array.from(q);
            if (ge === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(ge)) return R(q, ee);
          }
        }
        function R(q, ee) {
          (ee == null || ee > q.length) && (ee = q.length);
          for (var ge = 0, X = Array(ee); ge < ee; ge++) X[ge] = q[ge];
          return X;
        }
        function Y(q, ee) {
          if (!(typeof Symbol > "u" || !(Symbol.iterator in Object(q)))) {
            var ge = [], X = !0, De = !1, W = void 0;
            try {
              for (var re = q[Symbol.iterator](), ne; !(X = (ne = re.next()).done) && (ge.push(ne.value), !(ee && ge.length === ee)); X = !0) ;
            } catch (P) {
              De = !0, W = P;
            } finally {
              try {
                !X && re.return != null && re.return();
              } finally {
                if (De) throw W;
              }
            }
            return ge;
          }
        }
        function se(q) {
          if (Array.isArray(q)) return q;
        }
        function ie(q, ee) {
          if (!(q instanceof ee)) throw TypeError("Cannot call a class as a function");
        }
        function ae(q, ee) {
          for (var ge = 0; ge < ee.length; ge++) {
            var X = ee[ge];
            X.enumerable = X.enumerable || !1, X.configurable = !0, "value" in X && (X.writable = !0), Object.defineProperty(q, X.key, X);
          }
        }
        function pe(q, ee, ge) {
          return ee && ae(q.prototype, ee), q;
        }
        function ye(q, ee) {
          if (typeof ee != "function" && ee !== null) throw TypeError("Super expression must either be null or a function");
          q.prototype = Object.create(ee && ee.prototype, { constructor: { value: q, writable: !0, configurable: !0 } }), ee && J(q, ee);
        }
        function J(q, ee) {
          return J = Object.setPrototypeOf || function(ge, X) {
            return ge.__proto__ = X, ge;
          }, J(q, ee);
        }
        function we(q) {
          var ee = te();
          return function() {
            var ge = D(q), X;
            if (ee) {
              var De = D(this).constructor;
              X = Reflect.construct(ge, arguments, De);
            } else X = ge.apply(this, arguments);
            return A(this, X);
          };
        }
        function A(q, ee) {
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
        function w(q, ee, ge) {
          return ee in q ? Object.defineProperty(q, ee, { value: ge, enumerable: !0, configurable: !0, writable: !0 }) : q[ee] = ge, q;
        }
        var M = { touch: { start: "touchstart", move: "touchmove", stop: "touchend" }, mouse: { start: "mousedown", move: "mousemove", stop: "mouseup" } }, G = M.mouse, le = (function(q) {
          ye(ge, q);
          var ee = we(ge);
          function ge() {
            var X;
            ie(this, ge);
            for (var De = arguments.length, W = Array(De), re = 0; re < De; re++) W[re] = arguments[re];
            return X = ee.call.apply(ee, [this].concat(W)), w(V(X), "state", { dragging: !1, lastX: NaN, lastY: NaN, touchIdentifier: null }), w(V(X), "mounted", !1), w(V(X), "handleDragStart", function(ne) {
              if (X.props.onMouseDown(ne), !X.props.allowAnyClick && typeof ne.button == "number" && ne.button !== 0) return !1;
              var P = X.findDOMNode();
              if (!P || !P.ownerDocument || !P.ownerDocument.body) throw Error("<DraggableCore> not mounted on DragStart!");
              var B = P.ownerDocument;
              if (!(X.props.disabled || !(ne.target instanceof B.defaultView.Node) || X.props.handle && !(0, c.matchesSelectorAndParentsTo)(ne.target, X.props.handle, P) || X.props.cancel && (0, c.matchesSelectorAndParentsTo)(ne.target, X.props.cancel, P))) {
                ne.type === "touchstart" && ne.preventDefault();
                var C = (0, c.getTouchIdentifier)(ne);
                X.setState({ touchIdentifier: C });
                var U = (0, d.getControlPosition)(ne, C, V(X));
                if (U != null) {
                  var oe = U.x, he = U.y, Ee = (0, d.createCoreData)(V(X), oe, he);
                  (0, y.default)("DraggableCore: handleDragStart: %j", Ee), (0, y.default)("calling", X.props.onStart), !(X.props.onStart(ne, Ee) === !1 || X.mounted === !1) && (X.props.enableUserSelectHack && (0, c.addUserSelectStyles)(B), X.setState({ dragging: !0, lastX: oe, lastY: he }), (0, c.addEvent)(B, G.move, X.handleDrag), (0, c.addEvent)(B, G.stop, X.handleDragStop));
                }
              }
            }), w(V(X), "handleDrag", function(ne) {
              var P = (0, d.getControlPosition)(ne, X.state.touchIdentifier, V(X));
              if (P != null) {
                var B = P.x, C = P.y;
                if (Array.isArray(X.props.grid)) {
                  var U = B - X.state.lastX, oe = C - X.state.lastY, he = N((0, d.snapToGrid)(X.props.grid, U, oe), 2);
                  if (U = he[0], oe = he[1], !U && !oe) return;
                  B = X.state.lastX + U, C = X.state.lastY + oe;
                }
                var Ee = (0, d.createCoreData)(V(X), B, C);
                if ((0, y.default)("DraggableCore: handleDrag: %j", Ee), X.props.onDrag(ne, Ee) === !1 || X.mounted === !1) {
                  try {
                    X.handleDragStop(new MouseEvent("mouseup"));
                  } catch {
                    var Ie = document.createEvent("MouseEvents");
                    Ie.initMouseEvent("mouseup", !0, !0, window, 0, 0, 0, 0, 0, !1, !1, !1, !1, 0, null), X.handleDragStop(Ie);
                  }
                  return;
                }
                X.setState({ lastX: B, lastY: C });
              }
            }), w(V(X), "handleDragStop", function(ne) {
              if (X.state.dragging) {
                var P = (0, d.getControlPosition)(ne, X.state.touchIdentifier, V(X));
                if (P != null) {
                  var B = P.x, C = P.y, U = (0, d.createCoreData)(V(X), B, C);
                  if (X.props.onStop(ne, U) === !1 || X.mounted === !1) return !1;
                  var oe = X.findDOMNode();
                  oe && X.props.enableUserSelectHack && (0, c.removeUserSelectStyles)(oe.ownerDocument), (0, y.default)("DraggableCore: handleDragStop: %j", U), X.setState({ dragging: !1, lastX: NaN, lastY: NaN }), oe && ((0, y.default)("DraggableCore: Removing handlers"), (0, c.removeEvent)(oe.ownerDocument, G.move, X.handleDrag), (0, c.removeEvent)(oe.ownerDocument, G.stop, X.handleDragStop));
                }
              }
            }), w(V(X), "onMouseDown", function(ne) {
              return G = M.mouse, X.handleDragStart(ne);
            }), w(V(X), "onMouseUp", function(ne) {
              return G = M.mouse, X.handleDragStop(ne);
            }), w(V(X), "onTouchStart", function(ne) {
              return G = M.touch, X.handleDragStart(ne);
            }), w(V(X), "onTouchEnd", function(ne) {
              return G = M.touch, X.handleDragStop(ne);
            }), X;
          }
          return pe(ge, [{ key: "componentDidMount", value: function() {
            this.mounted = !0;
            var X = this.findDOMNode();
            X && (0, c.addEvent)(X, M.touch.start, this.onTouchStart, { passive: !1 });
          } }, { key: "componentWillUnmount", value: function() {
            this.mounted = !1;
            var X = this.findDOMNode();
            if (X) {
              var De = X.ownerDocument;
              (0, c.removeEvent)(De, M.mouse.move, this.handleDrag), (0, c.removeEvent)(De, M.touch.move, this.handleDrag), (0, c.removeEvent)(De, M.mouse.stop, this.handleDragStop), (0, c.removeEvent)(De, M.touch.stop, this.handleDragStop), (0, c.removeEvent)(X, M.touch.start, this.onTouchStart, { passive: !1 }), this.props.enableUserSelectHack && (0, c.removeUserSelectStyles)(De);
            }
          } }, { key: "findDOMNode", value: function() {
            return this.props.nodeRef ? this.props.nodeRef.current : l.default.findDOMNode(this);
          } }, { key: "render", value: function() {
            return o.cloneElement(o.Children.only(this.props.children), { onMouseDown: this.onMouseDown, onMouseUp: this.onMouseUp, onTouchEnd: this.onTouchEnd });
          } }]), ge;
        })(o.Component);
        n.default = le, w(le, "displayName", "DraggableCore"), w(le, "propTypes", { allowAnyClick: a.default.bool, disabled: a.default.bool, enableUserSelectHack: a.default.bool, offsetParent: function(q, ee) {
          if (q[ee] && q[ee].nodeType !== 1) throw Error("Draggable's offsetParent must be a DOM Node.");
        }, grid: a.default.arrayOf(a.default.number), handle: a.default.string, cancel: a.default.string, nodeRef: a.default.object, onStart: a.default.func, onDrag: a.default.func, onStop: a.default.func, onMouseDown: a.default.func, scale: a.default.number, className: u.dontSetMe, style: u.dontSetMe, transform: u.dontSetMe }), w(le, "defaultProps", { allowAnyClick: !1, cancel: null, disabled: !1, enableUserSelectHack: !0, offsetParent: null, handle: null, grid: null, transform: null, onStart: function() {
        }, onDrag: function() {
        }, onStop: function() {
        }, onMouseDown: function() {
        }, scale: 1 });
      })), _h = Z(((n) => {
        Object.defineProperty(n, "__esModule", { value: !0 }), Object.defineProperty(n, "DraggableCore", { enumerable: !0, get: function() {
          return b.default;
        } }), n.default = void 0;
        var o = N(Et()), a = E(ao()), l = E(mt()), c = E(kh()), d = Fi(), u = ec(), y = fo(), b = E(Eh()), g = E(tc());
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
          return J(W) || ye(W, re) || ae(W, re) || ie();
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
        function ye(W, re) {
          if (!(typeof Symbol > "u" || !(Symbol.iterator in Object(W)))) {
            var ne = [], P = !0, B = !1, C = void 0;
            try {
              for (var U = W[Symbol.iterator](), oe; !(P = (oe = U.next()).done) && (ne.push(oe.value), !(re && ne.length === re)); P = !0) ;
            } catch (he) {
              B = !0, C = he;
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
        function A(W) {
          for (var re = 1; re < arguments.length; re++) {
            var ne = arguments[re] == null ? {} : arguments[re];
            re % 2 ? we(Object(ne), !0).forEach(function(P) {
              X(W, P, ne[P]);
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
        function G(W) {
          var re = ee();
          return function() {
            var ne = ge(W), P;
            if (re) {
              var B = ge(this).constructor;
              P = Reflect.construct(ne, arguments, B);
            } else P = ne.apply(this, arguments);
            return le(this, P);
          };
        }
        function le(W, re) {
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
        function ge(W) {
          return ge = Object.setPrototypeOf ? Object.getPrototypeOf : function(re) {
            return re.__proto__ || Object.getPrototypeOf(re);
          }, ge(W);
        }
        function X(W, re, ne) {
          return re in W ? Object.defineProperty(W, re, { value: ne, enumerable: !0, configurable: !0, writable: !0 }) : W[re] = ne, W;
        }
        var De = (function(W) {
          w(ne, W);
          var re = G(ne);
          D(ne, null, [{ key: "getDerivedStateFromProps", value: function(P, B) {
            var C = P.position, U = B.prevPropsPosition;
            return C && (!U || C.x !== U.x || C.y !== U.y) ? ((0, g.default)("Draggable: getDerivedStateFromProps %j", { position: C, prevPropsPosition: U }), { x: C.x, y: C.y, prevPropsPosition: A({}, C) }) : null;
          } }]);
          function ne(P) {
            var B;
            return V(this, ne), B = re.call(this, P), X(q(B), "onDragStart", function(C, U) {
              if ((0, g.default)("Draggable: onDragStart: %j", U), B.props.onStart(C, (0, u.createDraggableData)(q(B), U)) === !1) return !1;
              B.setState({ dragging: !0, dragged: !0 });
            }), X(q(B), "onDrag", function(C, U) {
              if (!B.state.dragging) return !1;
              (0, g.default)("Draggable: onDrag: %j", U);
              var oe = (0, u.createDraggableData)(q(B), U), he = { x: oe.x, y: oe.y };
              if (B.props.bounds) {
                var Ee = he.x, Ie = he.y;
                he.x += B.state.slackX, he.y += B.state.slackY;
                var Oe = se((0, u.getBoundPosition)(q(B), he.x, he.y), 2), Se = Oe[0], Ve = Oe[1];
                he.x = Se, he.y = Ve, he.slackX = B.state.slackX + (Ee - he.x), he.slackY = B.state.slackY + (Ie - he.y), oe.x = he.x, oe.y = he.y, oe.deltaX = he.x - B.state.x, oe.deltaY = he.y - B.state.y;
              }
              if (B.props.onDrag(C, oe) === !1) return !1;
              B.setState(he);
            }), X(q(B), "onDragStop", function(C, U) {
              if (!B.state.dragging || B.props.onStop(C, (0, u.createDraggableData)(q(B), U)) === !1) return !1;
              (0, g.default)("Draggable: onDragStop: %j", U);
              var oe = { dragging: !1, slackX: 0, slackY: 0 };
              if (B.props.position) {
                var he = B.props.position, Ee = he.x, Ie = he.y;
                oe.x = Ee, oe.y = Ie;
              }
              B.setState(oe);
            }), B.state = { dragging: !1, dragged: !1, x: P.position ? P.position.x : P.defaultPosition.x, y: P.position ? P.position.y : P.defaultPosition.y, prevPropsPosition: A({}, P.position), slackX: 0, slackY: 0, isElementSVG: !1 }, P.position && !(P.onDrag || P.onStop) && console.warn("A `position` was applied to this <Draggable>, without drag handlers. This will make this component effectively undraggable. Please attach `onDrag` or `onStop` handlers so you can adjust the `position` of this element."), B;
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
            var C = B.children, U = B.defaultPosition, oe = B.defaultClassName, he = B.defaultClassNameDragging, Ee = B.defaultClassNameDragged, Ie = B.position, Oe = B.positionOffset;
            B.scale;
            var Se = R(B, ["axis", "bounds", "children", "defaultPosition", "defaultClassName", "defaultClassNameDragging", "defaultClassNameDragged", "position", "positionOffset", "scale"]), Ve = {}, Ke = null, Qe = !Ie || this.state.dragging, tn = Ie || U, Eo = { x: (0, u.canDragX)(this) && Qe ? this.state.x : tn.x, y: (0, u.canDragY)(this) && Qe ? this.state.y : tn.y };
            this.state.isElementSVG ? Ke = (0, d.createSVGTransform)(Eo, Oe) : Ve = (0, d.createCSSTransform)(Eo, Oe);
            var st = (0, c.default)(C.props.className || "", oe, (P = {}, X(P, he, this.state.dragging), X(P, Ee, this.state.dragged), P));
            return o.createElement(b.default, O({}, Se, { onStart: this.onDragStart, onDrag: this.onDrag, onStop: this.onDragStop }), o.cloneElement(o.Children.only(C), { className: st, style: A(A({}, C.props.style), Ve), transform: Ke }));
          } }]), ne;
        })(o.Component);
        n.default = De, X(De, "displayName", "Draggable"), X(De, "propTypes", A(A({}, b.default.propTypes), {}, { axis: a.default.oneOf(["both", "x", "y", "none"]), bounds: a.default.oneOfType([a.default.shape({ left: a.default.number, right: a.default.number, top: a.default.number, bottom: a.default.number }), a.default.string, a.default.oneOf([!1])]), defaultClassName: a.default.string, defaultClassNameDragging: a.default.string, defaultClassNameDragged: a.default.string, defaultPosition: a.default.shape({ x: a.default.number, y: a.default.number }), positionOffset: a.default.shape({ x: a.default.oneOfType([a.default.number, a.default.string]), y: a.default.oneOfType([a.default.number, a.default.string]) }), position: a.default.shape({ x: a.default.number, y: a.default.number }), className: y.dontSetMe, style: y.dontSetMe, transform: y.dontSetMe })), X(De, "defaultProps", A(A({}, b.default.defaultProps), {}, { axis: "both", bounds: !1, defaultClassName: "react-draggable", defaultClassNameDragging: "react-draggable-dragging", defaultClassNameDragged: "react-draggable-dragged", defaultPosition: { x: 0, y: 0 }, position: null, scale: 1 }));
      })), xh = Te(Z(((n, o) => {
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
      })(), ho = function() {
        return ho = Object.assign || function(n) {
          for (var o, a = 1, l = arguments.length; a < l; a++) for (var c in o = arguments[a], o) Object.prototype.hasOwnProperty.call(o, c) && (n[c] = o[c]);
          return n;
        }, ho.apply(this, arguments);
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
          return v.createElement("div", { className: this.props.className || "", style: ho(ho({ position: "absolute", userSelect: "none" }, Sh[this.props.direction]), this.props.replaceStyles || {}), onMouseDown: this.onMouseDown, onTouchStart: this.onTouchStart }, this.props.children);
        }, o;
      })(v.PureComponent), Cn = Te(Z(((n, o) => {
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
      }, Nh = { width: "auto", height: "auto" }, mo = (0, Cn.default)(function(n, o, a) {
        return Math.max(Math.min(n, a), o);
      }), nc = (0, Cn.default)(function(n, o) {
        return Math.round(n / o) * o;
      }), qn = (0, Cn.default)(function(n, o) {
        return new RegExp(n, "i").test(o);
      }), go = function(n) {
        return !!(n.touches && n.touches.length);
      }, Ph = function(n) {
        return !!((n.clientX || n.clientX === 0) && (n.clientY || n.clientY === 0));
      }, rc = (0, Cn.default)(function(n, o, a) {
        a === void 0 && (a = 0);
        var l = o.reduce(function(d, u, y) {
          return Math.abs(u - n) < Math.abs(o[d] - n) ? y : d;
        }, 0), c = Math.abs(o[l] - n);
        return a === 0 || c < a ? o[l] : n;
      }), et = (0, Cn.default)(function(n, o) {
        return n.substr(n.length - o.length, o.length) === o;
      }), $i = (0, Cn.default)(function(n) {
        return n = n.toString(), n === "auto" || et(n, "px") || et(n, "%") || et(n, "vh") || et(n, "vw") || et(n, "vmax") || et(n, "vmin") ? n : n + "px";
      }), yo = function(n, o, a, l) {
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
      }, Dh = (0, Cn.default)(function(n, o, a, l, c, d, u) {
        return l = yo(l, n.width, o, a), c = yo(c, n.height, o, a), d = yo(d, n.width, o, a), u = yo(u, n.height, o, a), { maxWidth: l === void 0 ? void 0 : Number(l), maxHeight: c === void 0 ? void 0 : Number(c), minWidth: d === void 0 ? void 0 : Number(d), minHeight: u === void 0 ? void 0 : Number(u) };
      }), Ih = "as.style.className.grid.snap.bounds.boundsByDirection.size.defaultSize.minWidth.minHeight.maxWidth.maxHeight.lockAspectRatio.lockAspectRatioExtraWidth.lockAspectRatioExtraHeight.enable.handleStyles.handleClasses.handleWrapperStyle.handleWrapperClass.children.onResizeStart.onResize.onResizeStop.handleComponent.scale.resizeRatio.snapGap".split("."), oc = "__resizable_base__", Rh = (function(n) {
        Oh(o, n);
        function o(a) {
          var l = n.call(this, a) || this;
          return l.ratio = 1, l.resizable = null, l.parentLeft = 0, l.parentTop = 0, l.resizableLeft = 0, l.resizableRight = 0, l.resizableTop = 0, l.resizableBottom = 0, l.targetLeft = 0, l.targetTop = 0, l.appendBase = function() {
            if (!l.resizable || !l.window) return null;
            var c = l.parentNode;
            if (!c) return null;
            var d = l.window.document.createElement("div");
            return d.style.width = "100%", d.style.height = "100%", d.style.position = "absolute", d.style.transform = "scale(0, 0)", d.style.left = "0", d.style.flex = "0", d.classList ? d.classList.add(oc) : d.className += oc, c.appendChild(d), d;
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
            return $i(a.state[d]);
          };
          return { width: l && l.width !== void 0 && !this.state.isResizing ? $i(l.width) : c("width"), height: l && l.height !== void 0 && !this.state.isResizing ? $i(l.height) : c("height") };
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
          var c = this.props.boundsByDirection, d = this.state.direction, u = c && qn("left", d), y = c && qn("top", d), b, g;
          if (this.props.bounds === "parent") {
            var E = this.parentNode;
            E && (b = u ? this.resizableRight - this.parentLeft : E.offsetWidth + (this.parentLeft - this.resizableLeft), g = y ? this.resizableBottom - this.parentTop : E.offsetHeight + (this.parentTop - this.resizableTop));
          } else this.props.bounds === "window" ? this.window && (b = u ? this.resizableRight : this.window.innerWidth - this.resizableLeft, g = y ? this.resizableBottom : this.window.innerHeight - this.resizableTop) : this.props.bounds && (b = u ? this.resizableRight - this.targetLeft : this.props.bounds.offsetWidth + (this.targetLeft - this.resizableLeft), g = y ? this.resizableBottom - this.targetTop : this.props.bounds.offsetHeight + (this.targetTop - this.resizableTop));
          return b && Number.isFinite(b) && (a = a && a < b ? a : b), g && Number.isFinite(g) && (l = l && l < g ? l : g), { maxWidth: a, maxHeight: l };
        }, o.prototype.calculateNewSizeFromDirection = function(a, l) {
          var c = this.props.scale || 1, d = this.props.resizeRatio || 1, u = this.state, y = u.direction, b = u.original, g = this.props, E = g.lockAspectRatio, x = g.lockAspectRatioExtraHeight, N = g.lockAspectRatioExtraWidth, S = b.width, O = b.height, R = x || 0, Y = N || 0;
          return qn("right", y) && (S = b.width + (a - b.x) * d / c, E && (O = (S - Y) / this.ratio + R)), qn("left", y) && (S = b.width - (a - b.x) * d / c, E && (O = (S - Y) / this.ratio + R)), qn("bottom", y) && (O = b.height + (l - b.y) * d / c, E && (S = (O - R) * this.ratio + Y)), qn("top", y) && (O = b.height - (l - b.y) * d / c, E && (S = (O - R) * this.ratio + Y)), { newWidth: S, newHeight: O };
        }, o.prototype.calculateNewSizeFromAspectRatio = function(a, l, c, d) {
          var u = this.props, y = u.lockAspectRatio, b = u.lockAspectRatioExtraHeight, g = u.lockAspectRatioExtraWidth, E = d.width === void 0 ? 10 : d.width, x = c.width === void 0 || c.width < 0 ? a : c.width, N = d.height === void 0 ? 10 : d.height, S = c.height === void 0 || c.height < 0 ? l : c.height, O = b || 0, R = g || 0;
          if (y) {
            var Y = (N - O) * this.ratio + R, se = (S - O) * this.ratio + R, ie = (E - R) / this.ratio + O, ae = (x - R) / this.ratio + O, pe = Math.max(E, Y), ye = Math.min(x, se), J = Math.max(N, ie), we = Math.min(S, ae);
            a = mo(a, pe, ye), l = mo(l, J, we);
          } else a = mo(a, E, x), l = mo(l, N, S);
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
            } else a.nativeEvent && go(a.nativeEvent) && (c = a.nativeEvent.touches[0].clientX, d = a.nativeEvent.touches[0].clientY);
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
            if (this.window.TouchEvent && go(a)) try {
              a.preventDefault(), a.stopPropagation();
            } catch {
            }
            var l = this.props, c = l.maxWidth, d = l.maxHeight, u = l.minWidth, y = l.minHeight, b = go(a) ? a.touches[0].clientX : a.clientX, g = go(a) ? a.touches[0].clientY : a.clientY, E = this.state, x = E.direction, N = E.original, S = E.width, O = E.height, R = this.getParentSize(), Y = Dh(R, this.window.innerWidth, this.window.innerHeight, c, d, u, y);
            c = Y.maxWidth, d = Y.maxHeight, u = Y.minWidth, y = Y.minHeight;
            var se = this.calculateNewSizeFromDirection(b, g), ie = se.newHeight, ae = se.newWidth, pe = this.calculateNewMaxFromBoundary(c, d), ye = this.calculateNewSizeFromAspectRatio(ae, ie, { width: pe.maxWidth, height: pe.maxHeight }, { width: u, height: y });
            if (ae = ye.newWidth, ie = ye.newHeight, this.props.grid) {
              var J = nc(ae, this.props.grid[0]), we = nc(ie, this.props.grid[1]), A = this.props.snapGap || 0;
              ae = A === 0 || Math.abs(J - ae) <= A ? J : ae, ie = A === 0 || Math.abs(we - ie) <= A ? we : ie;
            }
            this.props.snap && this.props.snap.x && (ae = rc(ae, this.props.snap.x, this.props.snapGap)), this.props.snap && this.props.snap.y && (ie = rc(ie, this.props.snap.y, this.props.snapGap));
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
      })(v.PureComponent), Hi = function(n, o) {
        return Hi = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(a, l) {
          a.__proto__ = l;
        } || function(a, l) {
          for (var c in l) l.hasOwnProperty(c) && (a[c] = l[c]);
        }, Hi(n, o);
      };
      function Mh(n, o) {
        Hi(n, o);
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
      }, ic = (function(n) {
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
              var pe = u.getBoundingClientRect(), ye = pe.left, J = pe.top, we = c.getBoundingClientRect(), A = we.left, V = we.top, te = (ye - A) / d, D = J - V;
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
              var Y = E.getBoundingClientRect(), se = Y.left, ie = Y.top, ae = this.props.bounds === "window" ? { left: 0, top: 0 } : g.getBoundingClientRect(), pe = ae.left, ye = ae.top, J = this.getOffsetWidth(g), we = this.getOffsetHeight(g), A = l.toLowerCase().endsWith("left"), V = l.toLowerCase().endsWith("right"), te = l.startsWith("top"), D = l.startsWith("bottom");
              if (A && this.resizable) {
                var w = (se - pe) / d + this.resizable.size.width;
                this.setState({ maxWidth: w > Number(N) ? N : w });
              }
              if (V || this.props.lockAspectRatio && !A) {
                var w = J + (pe - se) / d;
                this.setState({ maxWidth: w > Number(N) ? N : w });
              }
              if (te && this.resizable) {
                var w = (ie - ye) / d + this.resizable.size.height;
                this.setState({ maxHeight: w > Number(S) ? S : w });
              }
              if (D || this.props.lockAspectRatio && !te) {
                var w = we + (ye - ie) / d;
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
          var R = a.resizeHandleStyles, Y = a.resizeHandleClasses, se = a.resizeHandleComponent, ie = a.enableResizing, ae = a.resizeGrid, pe = a.resizeHandleWrapperClass, ye = a.resizeHandleWrapperStyle, J = a.scale, we = a.allowAnyClick, A = Ah(a, "disableDragging.style.dragHandleClassName.position.onMouseDown.onMouseUp.dragAxis.dragGrid.bounds.enableUserSelectHack.cancel.children.onResizeStart.onResize.onResizeStop.onDragStart.onDrag.onDragStop.resizeHandleStyles.resizeHandleClasses.resizeHandleComponent.enableResizing.resizeGrid.resizeHandleWrapperClass.resizeHandleWrapperStyle.scale.allowAnyClick".split(".")), V = this.props.default ? Nt({}, this.props.default) : void 0;
          delete A.default;
          var te = l || d ? { cursor: "auto" } : { cursor: "move" }, D = Nt(Nt(Nt({}, jh), te), c), w = this.offsetFromParent, M = w.left, G = w.top, le;
          u && (le = { x: u.x - M, y: u.y - G });
          var q = this.resizing ? void 0 : le, ee = this.resizing ? "both" : g;
          return (0, v.createElement)(zh, { ref: this.refDraggable, handle: d ? "." + d : void 0, defaultPosition: V, onMouseDown: y, onMouseUp: b, onStart: this.onDragStart, onDrag: this.onDrag, onStop: this.onDragStop, axis: ee, disabled: l, grid: E, bounds: x ? this.state.bounds : void 0, position: q, enableUserSelectHack: N, cancel: S, scale: J, allowAnyClick: we, nodeRef: this.resizableElement }, (0, v.createElement)(Rh, Nt({}, A, { ref: this.refResizable, defaultSize: V, size: this.props.size, enable: typeof ie == "boolean" ? Lh(ie) : ie, onResizeStart: this.onResizeStart, onResize: this.onResize, onResizeStop: this.onResizeStop, style: D, minWidth: this.props.minWidth, minHeight: this.props.minHeight, maxWidth: this.resizing ? this.state.maxWidth : this.props.maxWidth, maxHeight: this.resizing ? this.state.maxHeight : this.props.maxHeight, grid: ae, handleWrapperClass: pe, handleWrapperStyle: ye, lockAspectRatio: this.props.lockAspectRatio, lockAspectRatioExtraWidth: this.props.lockAspectRatioExtraWidth, lockAspectRatioExtraHeight: this.props.lockAspectRatioExtraHeight, handleStyles: R, handleClasses: Y, handleComponent: se, scale: this.props.scale }), O));
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
      }, br = class extends v.Component {
        render() {
          let n = Array.isArray(this.props.children) ? this.props.children : [this.props.children];
          return v.createElement("div", { className: "ck-inspector-navbox" }, n.length > 1 ? v.createElement("div", { className: "ck-inspector-navbox__navigation" }, n[0]) : "", v.createElement("div", { className: "ck-inspector-navbox__content" }, n[n.length - 1]));
        }
      }, vr = class extends v.Component {
        constructor(n) {
          super(n), this.handleTabClick = this.handleTabClick.bind(this);
        }
        handleTabClick(n) {
          this.props.onTabChange(n);
        }
        render() {
          let n = Array.isArray(this.props.children) ? this.props.children : [this.props.children];
          return v.createElement(br, null, [this.props.contentBefore, v.createElement(Uh, { key: "navigation", definitions: n.map((o) => o.props.label), activeTab: this.props.activeTab, onClick: this.handleTabClick }), this.props.contentAfter], n.filter((o) => o.props.label === this.props.activeTab));
        }
      };
      function Fh(n, o) {
        return n === o || Number.isNaN(n) && Number.isNaN(o);
      }
      function ac(n) {
        return Object.getOwnPropertySymbols(n).filter((o) => Object.prototype.propertyIsEnumerable.call(n, o));
      }
      function sc(n) {
        return n == null ? n === void 0 ? "[object Undefined]" : "[object Null]" : Object.prototype.toString.call(n);
      }
      var $h = "[object RegExp]", Hh = "[object String]", Bh = "[object Number]", Wh = "[object Boolean]", qh = "[object Symbol]", Kh = "[object Date]", Qh = "[object Map]", Yh = "[object Set]", Gh = "[object Array]", Xh = "[object Function]", Zh = "[object ArrayBuffer]", Bi = "[object Object]", Jh = "[object Error]", em = "[object DataView]", tm = "[object Uint8Array]", nm = "[object Uint8ClampedArray]", rm = "[object Uint16Array]", om = "[object Uint32Array]", im = "[object BigUint64Array]", am = "[object Int8Array]", sm = "[object Int16Array]", lm = "[object Int32Array]", cm = "[object BigInt64Array]", um = "[object Float32Array]", dm = "[object Float64Array]";
      function lc(n) {
        if (!n || typeof n != "object") return !1;
        let o = Object.getPrototypeOf(n);
        return o === null || o === Object.prototype || Object.getPrototypeOf(o) === null ? Object.prototype.toString.call(n) === "[object Object]" : !1;
      }
      function pm(n, o, a) {
        return kr(n, o, void 0, void 0, void 0, void 0, a);
      }
      function kr(n, o, a, l, c, d, u) {
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
            return wr(n, o, d, u);
        }
        return wr(n, o, d, u);
      }
      function wr(n, o, a, l) {
        if (Object.is(n, o)) return !0;
        let c = sc(n), d = sc(o);
        if (c === "[object Arguments]" && (c = Bi), d === "[object Arguments]" && (d = Bi), c !== d) return !1;
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
              for (let [b, g] of n.entries()) if (!o.has(b) || !kr(g, o.get(b), b, n, o, a, l)) return !1;
              return !0;
            case Yh: {
              if (n.size !== o.size) return !1;
              let b = Array.from(n.values()), g = Array.from(o.values());
              for (let E = 0; E < b.length; E++) {
                let x = b[E], N = g.findIndex((S) => kr(x, S, void 0, n, o, a, l));
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
              for (let b = 0; b < n.length; b++) if (!kr(n[b], o[b], b, n, o, a, l)) return !1;
              return !0;
            case Zh:
              return n.byteLength === o.byteLength ? wr(new Uint8Array(n), new Uint8Array(o), a, l) : !1;
            case em:
              return n.byteLength !== o.byteLength || n.byteOffset !== o.byteOffset ? !1 : wr(new Uint8Array(n), new Uint8Array(o), a, l);
            case Jh:
              return n.name === o.name && n.message === o.message;
            case Bi: {
              if (!(wr(n.constructor, o.constructor, a, l) || lc(n) && lc(o))) return !1;
              let b = [...Object.keys(n), ...ac(n)], g = [...Object.keys(o), ...ac(o)];
              if (b.length !== g.length) return !1;
              for (let E = 0; E < b.length; E++) {
                let x = b[E], N = n[x];
                if (!Object.hasOwn(o, x)) return !1;
                let S = o[x];
                if (!kr(N, S, x, n, o, a, l)) return !1;
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
      function Kn(n, o) {
        return pm(n, o, fm);
      }
      var Wi = class extends v.Component {
        render() {
          return [v.createElement("label", { htmlFor: this.props.id, key: "label" }, this.props.label, ":"), v.createElement("select", { id: this.props.id, value: this.props.value, onChange: this.props.onChange, key: "select" }, this.props.options.map((n) => v.createElement("option", { value: n, key: n }, n)))];
        }
        shouldComponentUpdate(n) {
          return !Kn(this.props, n);
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
      }, en = v.createContext({ document: typeof document > "u" ? null : document, window: typeof window > "u" ? null : window }), hm = 200, mm = { position: "relative" }, gm = (Yi = class extends v.Component {
        get maxSidePaneWidth() {
          let n = this.context.window;
          return Math.min(n.innerWidth - 400, n.innerWidth * 0.8);
        }
        render() {
          return v.createElement("div", { className: "ck-inspector-side-pane" }, v.createElement(ic, { enableResizing: { left: !0 }, disableDragging: !0, minWidth: hm, maxWidth: this.maxSidePaneWidth, style: mm, position: { x: "100%", y: "100%" }, size: { width: this.props.sidePaneWidth, height: "100%" }, onResizeStop: (n, o, a) => this.props.setSidePaneWidth(a.style.width) }, this.props.children));
        }
      }, kn(Yi, "contextType", en), Yi), bo = qe(({ ui: { sidePaneWidth: n } }) => ({ sidePaneWidth: n }), { setSidePaneWidth: cf })(gm), cc = class extends v.Component {
        constructor(n) {
          super(n), this.handleClick = this.handleClick.bind(this);
        }
        handleClick(n) {
          this.globalTreeProps.onClick(n, this.definition.node);
        }
        getChildren() {
          return this.definition.children.map((n, o) => dc(n, o, this.props.globalTreeProps));
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
          return !Kn(this.props, n);
        }
      }, ym = 500, uc = class extends v.PureComponent {
        render() {
          let n, o = bl(this.props.value, ym);
          return this.props.dontRenderValue || (n = v.createElement("span", { className: "ck-inspector-tree-node__attribute__value" }, o)), v.createElement("span", { className: "ck-inspector-tree-node__attribute" }, v.createElement("span", { className: "ck-inspector-tree-node__attribute__name", title: o }, this.props.name), n);
        }
      }, Qn = class extends v.Component {
        render() {
          let n = this.props.definition, o = { className: ["ck-inspector-tree__position", n.type === "selection" ? "ck-inspector-tree__position_selection" : "", n.type === "marker" ? "ck-inspector-tree__position_marker" : "", n.isEnd ? "ck-inspector-tree__position_end" : ""].join(" "), style: {} };
          return n.presentation && n.presentation.color && (o.style["--ck-inspector-color-tree-position"] = n.presentation.color), n.type === "marker" && (o["data-marker-name"] = n.name), v.createElement("span", o, "​");
        }
        shouldComponentUpdate(n) {
          return !Kn(this.props, n);
        }
      }, bm = class extends cc {
        render() {
          let n = this.definition, o = n.presentation, a = o && o.isEmpty, l = o && o.cssClass, c = this.getChildren(), d = ["ck-inspector-code", "ck-inspector-tree-node", this.isActive ? "ck-inspector-tree-node_active" : "", a ? "ck-inspector-tree-node_empty" : "", l], u = [], y = [];
          n.positionsBefore && n.positionsBefore.forEach((g, E) => {
            u.push(v.createElement(Qn, { key: "position-before:" + E, definition: g }));
          }), n.positionsAfter && n.positionsAfter.forEach((g, E) => {
            y.push(v.createElement(Qn, { key: "position-after:" + E, definition: g }));
          }), n.positions && n.positions.forEach((g, E) => {
            c.push(v.createElement(Qn, { key: "position" + E, definition: g }));
          });
          let b = n.name;
          return this.globalTreeProps.showElementTypes && (b = n.elementType + ":" + b), v.createElement("div", { className: d.join(" "), onClick: this.handleClick }, u, v.createElement("span", { className: "ck-inspector-tree-node__name" }, v.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_open" }), b, this.getAttributes(), a ? "" : v.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_close" })), v.createElement("div", { className: "ck-inspector-tree-node__content" }, c), a ? "" : v.createElement("span", { className: "ck-inspector-tree-node__name ck-inspector-tree-node__name_close" }, v.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_open" }), "/", b, v.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_close" }), y));
        }
        getAttributes() {
          let n = [], o = this.definition;
          for (let [a, l] of o.attributes) n.push(v.createElement(uc, { key: a, name: a, value: l }));
          return n;
        }
        shouldComponentUpdate(n) {
          return !Kn(this.props, n);
        }
      }, vm = class extends cc {
        render() {
          let n = this.definition, o = ["ck-inspector-tree-text", this.isActive ? "ck-inspector-tree-node_active" : ""].join(" "), a = this.definition.text;
          n.positions && n.positions.length && (a = a.split(""), Array.from(n.positions).sort((c, d) => c.offset < d.offset ? -1 : c.offset === d.offset ? 0 : 1).reverse().forEach((c, d) => {
            a.splice(c.offset - n.startOffset, 0, v.createElement(Qn, { key: "position" + d, definition: c }));
          }));
          let l = [a];
          return n.positionsBefore && n.positionsBefore.length && n.positionsBefore.forEach((c, d) => {
            l.unshift(v.createElement(Qn, { key: "position-before:" + d, definition: c }));
          }), n.positionsAfter && n.positionsAfter.length && n.positionsAfter.forEach((c, d) => {
            l.push(v.createElement(Qn, { key: "position-after:" + d, definition: c }));
          }), v.createElement("span", { className: o, onClick: this.handleClick }, v.createElement("span", { className: "ck-inspector-tree-node__content" }, this.globalTreeProps.showCompactText ? "" : this.getAttributes(), this.globalTreeProps.showCompactText ? "" : '"', l, this.globalTreeProps.showCompactText ? "" : '"'));
        }
        getAttributes() {
          let n = [], o = this.definition, a = o.presentation, l = a && a.dontRenderAttributeValue;
          for (let [c, d] of o.attributes) n.push(v.createElement(uc, { key: c, name: c, value: d, dontRenderValue: l }));
          return v.createElement("span", { className: "ck-inspector-tree-text__attributes" }, n);
        }
        shouldComponentUpdate(n) {
          return !Kn(this.props, n);
        }
      }, km = class extends v.Component {
        render() {
          return v.createElement("span", { className: "ck-inspector-tree-comment", dangerouslySetInnerHTML: { __html: this.props.definition.text } });
        }
      };
      function dc(n, o, a) {
        if (n.type === "element") return v.createElement(bm, { key: o, definition: n, globalTreeProps: a });
        if (n.type === "text") return v.createElement(vm, { key: o, definition: n, globalTreeProps: a });
        if (n.type === "comment") return v.createElement(km, { key: o, definition: n });
      }
      var vo = class extends v.Component {
        render() {
          let n;
          return n = this.props.definition ? this.props.definition.map((o, a) => dc(o, a, { onClick: this.props.onClick, showCompactText: this.props.showCompactText, showElementTypes: this.props.showElementTypes, activeNode: this.props.activeNode })) : "Nothing to show.", v.createElement("div", { className: ["ck-inspector-tree", ...this.props.className || [], this.props.textDirection ? "ck-inspector-tree_text-direction_" + this.props.textDirection : "", this.props.showCompactText ? "ck-inspector-tree_compact-text" : ""].join(" ") }, n);
        }
      }, qi = class extends v.PureComponent {
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
          return v.createElement(br, null, [v.createElement("div", { className: "ck-inspector-tree__config", key: "root-cfg" }, v.createElement(Wi, { id: "view-root-select", label: "Root", value: this.props.currentRootName, options: kl(n).map((o) => o.rootName), onChange: this.handleRootChange })), v.createElement("span", { className: "ck-inspector-separator", key: "separator" }), v.createElement("div", { className: "ck-inspector-tree__config", key: "text-cfg" }, v.createElement(qi, { label: "Compact text", id: "model-compact-text", isChecked: this.props.showCompactText, onChange: this.props.toggleModelShowCompactText }), v.createElement(qi, { label: "Show markers", id: "model-show-markers", isChecked: this.props.showMarkers, onChange: this.props.toggleModelShowMarkers }))], v.createElement(vo, { className: [this.props.showMarkers ? "" : "ck-inspector-model-tree__hide-markers"], definition: this.props.treeDefinition, textDirection: n.locale.contentLanguageDirection, onClick: this.handleTreeClick, showCompactText: this.props.showCompactText, activeNode: this.props.currentNode }));
        }
      }, Em = qe(({ editors: n, currentEditorName: o, model: { treeDefinition: a, currentRootName: l, currentNode: c, ui: { showMarkers: d, showCompactText: u } } }) => ({ treeDefinition: a, editors: n, currentEditorName: o, currentRootName: l, currentNode: c, showMarkers: d, showCompactText: u }), { toggleModelShowCompactText: sf, setModelCurrentRootName: rf, toggleModelShowMarkers: af, setModelCurrentNode: of, setModelActiveTab: nl })(wm), _m = 2e3, xm = class hp extends v.Component {
        render() {
          let o = this.props.presentation && this.props.presentation.expandCollapsibles, a = [];
          for (let l in this.props.itemDefinitions) {
            let c = this.props.itemDefinitions[l], { subProperties: d, presentation: u = {} } = c, y = d && Object.keys(d).length, b = bl(String(c.value), _m), g = [v.createElement(Cm, { key: `${this.props.name}-${l}-name`, name: l, listUid: this.props.name, canCollapse: y, colorBox: u.colorBox, expandCollapsibles: o, onClick: this.props.onPropertyTitleClick, title: c.title }), v.createElement("dd", { key: `${this.props.name}-${l}-value` }, v.createElement("input", { id: `${this.props.name}-${l}-value-input`, type: "text", value: b, readOnly: !0 }))];
            y && g.push(v.createElement(hp, { name: `${this.props.name}-${l}`, key: `${this.props.name}-${l}`, itemDefinitions: d, presentation: this.props.presentation })), a.push(g);
          }
          return v.createElement("dl", { className: "ck-inspector-property-list ck-inspector-code" }, a);
        }
        shouldComponentUpdate(o) {
          return !Kn(this.props, o);
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
      }, Sn = class extends v.PureComponent {
        render() {
          let n = [];
          for (let o of this.props.lists) Object.keys(o.itemDefinitions).length && n.push(v.createElement("hr", { key: `${o.name}-separator` }), v.createElement("h3", { key: `${o.name}-header` }, v.createElement("a", { href: o.url, target: "_blank", rel: "noopener noreferrer" }, o.name), o.buttons && o.buttons.map((a, l) => v.createElement(rt, { key: "button" + l, ...a }))), v.createElement(xm, { key: `${o.name}-list`, name: o.name, itemDefinitions: o.itemDefinitions, presentation: o.presentation, onPropertyTitleClick: o.onPropertyTitleClick }));
          return v.createElement("div", { className: "ck-inspector__object-inspector" }, v.createElement("h2", { className: "ck-inspector-code" }, this.props.header), n);
        }
      }, Sm = Z(((n) => {
        var o = Et(), a = 60103;
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
      })), Ue = Z(((n, o) => {
        o.exports = Sm();
      }))(), Mt = (n) => (0, Ue.jsx)("svg", { viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg", ...n, children: (0, Ue.jsx)("path", { d: "M17 15.75a.75.75 0 0 1 .102 1.493L17 17.25H9a.75.75 0 0 1-.102-1.493L9 15.75h8ZM2.156 2.947l.095.058 7.58 5.401a.75.75 0 0 1 .084 1.152l-.083.069-7.58 5.425a.75.75 0 0 1-.958-1.148l.086-.071 6.724-4.815-6.723-4.792a.75.75 0 0 1-.233-.95l.057-.096a.75.75 0 0 1 .951-.233Z" }) }), Tm = (n) => (0, Ue.jsx)("svg", { fill: "none", xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 19 19", ...n, children: (0, Ue.jsx)("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M6 1a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-2v2h5a1 1 0 0 1 1 1v3h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1v-2.5a.5.5 0 0 0-.5-.5H10v3h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1v-3H4.5a.5.5 0 0 0-.5.5V13h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1v-3a1 1 0 0 1 1-1h5V7H7a1 1 0 0 1-1-1V1Zm1.5 4.5v-4h4v4h-4Zm-5 11v-2h2v2h-2Zm6-2v2h2v-2h-2Zm6 2v-2h2v2h-2Z", fill: "#000" }) }), Om = class extends v.Component {
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
          return n ? v.createElement(Sn, { header: [v.createElement("span", { key: "link" }, v.createElement("a", { href: n.url, target: "_blank", rel: "noopener noreferrer" }, v.createElement("b", null, n.type)), ":", n.type === "Text" ? v.createElement("em", null, n.name) : n.name), v.createElement(rt, { key: "log", icon: v.createElement(Mt, null), text: "Log in console", onClick: this.handleNodeLogButtonClick }), v.createElement(rt, { key: "schema", icon: v.createElement(Tm, null), text: "Show in schema", onClick: this.handleNodeSchemaButtonClick })], lists: [{ name: "Attributes", url: n.url, itemDefinitions: n.attributes }, { name: "Properties", url: n.url, itemDefinitions: n.properties }] }) : v.createElement(gt, { isEmpty: "true" }, v.createElement("p", null, "Select a node in the tree to inspect"));
        }
      }, Nm = qe(({ editors: n, currentEditorName: o, model: { currentNodeDefinition: a } }) => ({ editors: n, currentEditorName: o, currentNodeDefinition: a }), { setActiveTab: dl, setSchemaCurrentDefinitionName: Vi })(Om), pc = (n) => (0, Ue.jsx)("svg", { viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg", ...n, children: (0, Ue.jsx)("path", { d: "M9.5 4.5c1.85 0 3.667.561 5.199 1.519C16.363 7.059 17.5 8.4 17.5 9.5s-1.137 2.441-2.801 3.481c-1.532.958-3.35 1.519-5.199 1.519-1.85 0-3.667-.561-5.199-1.519C2.637 11.941 1.5 10.6 1.5 9.5s1.137-2.441 2.801-3.481C5.833 5.06 7.651 4.5 9.5 4.5Zm0 1a4 4 0 1 1-.2.005l.2-.005c-1.655 0-3.29.505-4.669 1.367C3.431 7.742 2.5 8.84 2.5 9.5c0 .66.931 1.758 2.331 2.633C6.21 12.995 7.845 13.5 9.5 13.5c1.655 0 3.29-.505 4.669-1.367 1.4-.875 2.331-1.974 2.331-2.633 0-.66-.931-1.758-2.331-2.633C12.79 6.005 11.155 5.5 9.5 5.5ZM8 6.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" }) }), Yn = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_selection-Selection.html", Pm = (Gi = class extends v.Component {
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
          return v.createElement(Sn, { header: [v.createElement("span", { key: "link" }, v.createElement("a", { href: Yn, target: "_blank", rel: "noopener noreferrer" }, v.createElement("b", null, "Selection"))), v.createElement(rt, { key: "log", icon: v.createElement(Mt, null), text: "Log in console", onClick: this.handleSelectionLogButtonClick }), v.createElement(rt, { key: "scroll", icon: v.createElement(pc, null), text: "Scroll to selection", onClick: this.handleScrollToSelectionButtonClick })], lists: [{ name: "Attributes", url: `${Yn}#function-getAttributes`, itemDefinitions: o.attributes }, { name: "Properties", url: `${Yn}`, itemDefinitions: o.properties }, { name: "Anchor", url: `${Yn}#member-anchor`, buttons: [{ icon: v.createElement(Mt, null), text: "Log in console", onClick: () => Ge.log(n.model.document.selection.anchor) }], itemDefinitions: o.anchor }, { name: "Focus", url: `${Yn}#member-focus`, buttons: [{ icon: v.createElement(Mt, null), text: "Log in console", onClick: () => Ge.log(n.model.document.selection.focus) }], itemDefinitions: o.focus }, { name: "Ranges", url: `${Yn}#function-getRanges`, buttons: [{ icon: v.createElement(Mt, null), text: "Log in console", onClick: () => Ge.log(...n.model.document.selection.getRanges()) }], itemDefinitions: o.ranges, presentation: { expandCollapsibles: !0 } }] });
        }
      }, kn(Gi, "contextType", en), Gi), Dm = qe(({ editors: n, currentEditorName: o, model: { ranges: a } }) => {
        let l = n.get(o);
        return { editor: l, currentEditorName: o, info: Im(l, a) };
      }, {})(Pm);
      function ko({ path: n, stickiness: o, index: a, isAtEnd: l, isAtStart: c, offset: d, textNode: u }) {
        return { path: { value: n }, stickiness: { value: o }, index: { value: a }, isAtEnd: { value: l }, isAtStart: { value: c }, offset: { value: d }, textNode: { value: u } };
      }
      function Im(n, o) {
        let a = n.model.document.selection, l = a.anchor, c = a.focus, d = { properties: { isCollapsed: { value: a.isCollapsed }, isBackward: { value: a.isBackward }, isGravityOverridden: { value: a.isGravityOverridden }, rangeCount: { value: a.rangeCount } }, attributes: {}, anchor: ko(Wn(l)), focus: ko(Wn(c)), ranges: {} };
        for (let [u, y] of a.getAttributes()) d.attributes[u] = { value: y };
        o.forEach((u, y) => {
          d.ranges[y] = { value: "", subProperties: { start: { value: "", subProperties: Xe(ko(u.start)) }, end: { value: "", subProperties: Xe(ko(u.end)) } } };
        });
        for (let u in d) u !== "ranges" && (d[u] = Xe(d[u]));
        return d;
      }
      var Rm = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_markercollection-Marker.html", Mm = class extends v.Component {
        render() {
          let n = zm(this.props.markers), o = fc(n), a = this.props.editors.get(this.props.currentEditorName);
          return Object.keys(n).length ? v.createElement(Sn, { header: [v.createElement("span", { key: "link" }, v.createElement("a", { href: Rm, target: "_blank", rel: "noopener noreferrer" }, v.createElement("b", null, "Markers"))), v.createElement(rt, { key: "log", icon: v.createElement(Mt, null), text: "Log in console", onClick: () => Ge.log([...a.model.markers]) })], lists: [{ name: "Markers tree", itemDefinitions: o, presentation: { expandCollapsibles: !0 } }] }) : v.createElement(gt, { isEmpty: "true" }, v.createElement("p", null, "No markers in the document."));
        }
      }, Am = qe(({ editors: n, currentEditorName: o, model: { markers: a } }) => ({ editors: n, currentEditorName: o, markers: a }), {})(Mm);
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
      function fc(n) {
        let o = {};
        for (let a in n) {
          let l = n[a];
          if (l.name) {
            let c = Xe(jm(l));
            o[a] = { value: "", presentation: { colorBox: l.presentation.color }, subProperties: c };
          } else {
            let c = Object.keys(l).length;
            o[a] = { value: c + " marker" + (c > 1 ? "s" : ""), subProperties: fc(l) };
          }
        }
        return o;
      }
      function jm({ name: n, start: o, end: a, affectsData: l, managedUsingOperations: c }) {
        return { name: { value: n }, start: { value: o.path }, end: { value: a.path }, affectsData: { value: l }, managedUsingOperations: { value: c } };
      }
      var Lm = class extends v.Component {
        render() {
          return this.props.currentEditorName ? v.createElement(gt, { splitVertically: "true" }, v.createElement(Em, null), v.createElement(bo, null, v.createElement(vr, { onTabChange: this.props.setModelActiveTab, activeTab: this.props.activeTab }, v.createElement(Nm, { label: "Inspect" }), v.createElement(Dm, { label: "Selection" }), v.createElement(Am, { label: "Markers" })))) : v.createElement(gt, { isEmpty: "true" }, v.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
        }
      }, Um = qe(({ currentEditorName: n, model: { ui: { activeTab: o } } }) => ({ currentEditorName: n, activeTab: o }), { setModelActiveTab: nl })(Lm), Vm = class extends v.Component {
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
          return v.createElement(br, null, [v.createElement("div", { className: "ck-inspector-tree__config", key: "root-cfg" }, v.createElement(Wi, { id: "view-root-select", label: "Root", value: this.props.currentRootName, options: Al(n).map((o) => o.rootName), onChange: this.handleRootChange })), v.createElement("span", { className: "ck-inspector-separator", key: "separator" }), v.createElement("div", { className: "ck-inspector-tree__config", key: "types-cfg" }, v.createElement(qi, { label: "Show element types", id: "view-show-types", isChecked: this.props.showElementTypes, onChange: this.props.toggleViewShowElementTypes }))], v.createElement(vo, { definition: this.props.treeDefinition, textDirection: n.locale.contentLanguageDirection, onClick: this.handleTreeClick, showCompactText: "true", showElementTypes: this.props.showElementTypes, activeNode: this.props.currentNode }));
        }
      }, Fm = qe(({ editors: n, currentEditorName: o, view: { treeDefinition: a, currentRootName: l, currentNode: c, ui: { showElementTypes: d } } }) => ({ treeDefinition: a, editors: n, currentEditorName: o, currentRootName: l, currentNode: c, showElementTypes: d }), { setViewCurrentRootName: zf, toggleViewShowElementTypes: Lf, setViewCurrentNode: jf, setViewActiveTab: Ml })(Vm), $m = class extends v.Component {
        constructor(n) {
          super(n), this.handleNodeLogButtonClick = this.handleNodeLogButtonClick.bind(this);
        }
        handleNodeLogButtonClick() {
          Ge.log(this.props.currentNodeDefinition.editorNode);
        }
        render() {
          let n = this.props.currentNodeDefinition;
          return n ? v.createElement(Sn, { header: [v.createElement("span", { key: "link" }, v.createElement("a", { href: n.url, target: "_blank", rel: "noopener noreferrer" }, v.createElement("b", null, n.type), ":"), n.type === "Text" ? v.createElement("em", null, n.name) : n.name), v.createElement(rt, { key: "log", icon: v.createElement(Mt, null), text: "Log in console", onClick: this.handleNodeLogButtonClick })], lists: [{ name: "Attributes", url: n.url, itemDefinitions: n.attributes }, { name: "Properties", url: n.url, itemDefinitions: n.properties }, { name: "Custom Properties", url: `${Ot}_element-Element.html#function-getCustomProperty`, itemDefinitions: n.customProperties }] }) : v.createElement(gt, { isEmpty: "true" }, v.createElement("p", null, "Select a node in the tree to inspect"));
        }
      }, Hm = qe(({ view: { currentNodeDefinition: n } }) => ({ currentNodeDefinition: n }), {})($m), Er = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_view_selection-Selection.html", Bm = (Xi = class extends v.Component {
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
          return v.createElement(Sn, { header: [v.createElement("span", { key: "link" }, v.createElement("a", { href: Er, target: "_blank", rel: "noopener noreferrer" }, v.createElement("b", null, "Selection"))), v.createElement(rt, { key: "log", icon: v.createElement(Mt, null), text: "Log in console", onClick: this.handleSelectionLogButtonClick }), v.createElement(rt, { key: "scroll", icon: v.createElement(pc, null), text: "Scroll to selection", onClick: this.handleScrollToSelectionButtonClick })], lists: [{ name: "Properties", url: `${Er}`, itemDefinitions: o.properties }, { name: "Anchor", url: `${Er}#member-anchor`, buttons: [{ type: "log", text: "Log in console", onClick: () => Ge.log(n.editing.view.document.selection.anchor) }], itemDefinitions: o.anchor }, { name: "Focus", url: `${Er}#member-focus`, buttons: [{ type: "log", text: "Log in console", onClick: () => Ge.log(n.editing.view.document.selection.focus) }], itemDefinitions: o.focus }, { name: "Ranges", url: `${Er}#function-getRanges`, buttons: [{ type: "log", text: "Log in console", onClick: () => Ge.log(...n.editing.view.document.selection.getRanges()) }], itemDefinitions: o.ranges, presentation: { expandCollapsibles: !0 } }] });
        }
      }, kn(Xi, "contextType", en), Xi), Wm = qe(({ editors: n, currentEditorName: o, view: { ranges: a } }) => {
        let l = n.get(o);
        return { editor: l, currentEditorName: o, info: qm(l, a) };
      }, {})(Bm);
      function wo({ offset: n, isAtEnd: o, isAtStart: a, parent: l }) {
        return { offset: { value: n }, isAtEnd: { value: o }, isAtStart: { value: a }, parent: { value: l } };
      }
      function qm(n, o) {
        let a = n.editing.view.document.selection, l = { properties: { isCollapsed: { value: a.isCollapsed }, isBackward: { value: a.isBackward }, isFake: { value: a.isFake }, rangeCount: { value: a.rangeCount } }, anchor: wo(po(a.anchor)), focus: wo(po(a.focus)), ranges: {} };
        o.forEach((c, d) => {
          l.ranges[d] = { value: "", subProperties: { start: { value: "", subProperties: Xe(wo(c.start)) }, end: { value: "", subProperties: Xe(wo(c.end)) } } };
        });
        for (let c in l) c !== "ranges" && (l[c] = Xe(l[c]));
        return l;
      }
      var Km = class extends v.Component {
        render() {
          return this.props.currentEditorName ? v.createElement(gt, { splitVertically: "true" }, v.createElement(Fm, null), v.createElement(bo, null, v.createElement(vr, { onTabChange: this.props.setViewActiveTab, activeTab: this.props.activeTab }, v.createElement(Hm, { label: "Inspect" }), v.createElement(Wm, { label: "Selection" })))) : v.createElement(gt, { isEmpty: "true" }, v.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
        }
      }, Qm = qe(({ currentEditorName: n, view: { ui: { activeTab: o } } }) => ({ currentEditorName: n, activeTab: o }), { setViewActiveTab: Ml, updateViewState: Ri })(Km), Ym = class extends v.Component {
        constructor(n) {
          super(n), this.handleTreeClick = this.handleTreeClick.bind(this);
        }
        handleTreeClick(n, o) {
          n.persist(), n.stopPropagation(), this.props.setCommandsCurrentCommandName(o);
        }
        render() {
          return v.createElement(br, null, v.createElement(vo, { definition: this.props.treeDefinition, onClick: this.handleTreeClick, activeNode: this.props.currentCommandName }));
        }
      }, Gm = qe(({ commands: { treeDefinition: n, currentCommandName: o } }) => ({ treeDefinition: n, currentCommandName: o }), { setCommandsCurrentCommandName: nh })(Ym), Xm = (n) => (0, Ue.jsx)("svg", { viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg", ...n, children: (0, Ue.jsx)("path", { d: "M9.25 1.25a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm0 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM7.344 6.485l4.98 2.765-4.98 3.018V6.485Z" }) }), Zm = class extends v.Component {
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
          return n ? v.createElement(Sn, { header: [v.createElement("span", { key: "link" }, v.createElement("a", { href: n.url, target: "_blank", rel: "noopener noreferrer" }, v.createElement("b", null, n.type)), ":", this.props.currentCommandName), v.createElement(rt, { key: "exec", icon: v.createElement(Xm, null), text: "Execute command", onClick: this.handleCommandExecuteButtonClick }), v.createElement(rt, { key: "log", icon: v.createElement(Mt, null), text: "Log in console", onClick: this.handleCommandLogButtonClick })], lists: [{ name: "Properties", url: n.url, itemDefinitions: n.properties }] }) : v.createElement(gt, { isEmpty: "true" }, v.createElement("p", null, "Select a command to inspect"));
        }
      }, Jm = qe(({ editors: n, currentEditorName: o, commands: { currentCommandName: a, currentCommandDefinition: l } }) => ({ editors: n, currentEditorName: o, currentCommandName: a, currentCommandDefinition: l }), {})(Zm), eg = class extends v.Component {
        render() {
          return this.props.currentEditorName ? v.createElement(gt, { splitVertically: "true" }, v.createElement(Gm, null), v.createElement(bo, null, v.createElement(vr, { activeTab: "Inspect" }, v.createElement(Jm, { label: "Inspect" })))) : v.createElement(gt, { isEmpty: "true" }, v.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
        }
      }, tg = qe(({ currentEditorName: n }) => ({ currentEditorName: n }), { updateCommandsState: Ui })(eg), ng = class extends v.Component {
        constructor(n) {
          super(n), this.handleTreeClick = this.handleTreeClick.bind(this);
        }
        handleTreeClick(n, o) {
          n.persist(), n.stopPropagation(), this.props.setSchemaCurrentDefinitionName(o);
        }
        render() {
          return v.createElement(br, null, v.createElement(vo, { definition: this.props.treeDefinition, onClick: this.handleTreeClick, activeNode: this.props.currentSchemaDefinitionName }));
        }
      }, rg = qe(({ schema: { treeDefinition: n, currentSchemaDefinitionName: o } }) => ({ treeDefinition: n, currentSchemaDefinitionName: o }), { setSchemaCurrentDefinitionName: Vi })(ng), og = class extends v.Component {
        render() {
          let n = this.props.currentSchemaDefinition;
          return n ? v.createElement(Sn, { header: [v.createElement("span", { key: "link" }, v.createElement("a", { href: n.urls.general, target: "_blank", rel: "noopener noreferrer" }, v.createElement("b", null, n.type)), ":", this.props.currentSchemaDefinitionName)], lists: [{ name: "Properties", url: n.urls.general, itemDefinitions: n.properties }, { name: "Allowed attributes", url: n.urls.allowAttributes, itemDefinitions: n.allowAttributes }, { name: "Allowed children", url: n.urls.allowChildren, itemDefinitions: n.allowChildren, onPropertyTitleClick: (o) => {
            this.props.setSchemaCurrentDefinitionName(o);
          } }, { name: "Allowed in", url: n.urls.allowIn, itemDefinitions: n.allowIn, onPropertyTitleClick: (o) => {
            this.props.setSchemaCurrentDefinitionName(o);
          } }] }) : v.createElement(gt, { isEmpty: "true" }, v.createElement("p", null, "Select a schema definition to inspect"));
        }
      }, ig = qe(({ editors: n, currentEditorName: o, schema: { currentSchemaDefinitionName: a, currentSchemaDefinition: l } }) => ({ editors: n, currentEditorName: o, currentSchemaDefinitionName: a, currentSchemaDefinition: l }), { setSchemaCurrentDefinitionName: Vi })(og), ag = class extends v.Component {
        render() {
          return this.props.currentEditorName ? v.createElement(gt, { splitVertically: "true" }, v.createElement(rg, null), v.createElement(bo, null, v.createElement(vr, { activeTab: "Inspect" }, v.createElement(ig, { label: "Inspect" })))) : v.createElement(gt, { isEmpty: "true" }, v.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
        }
      }, sg = qe(({ currentEditorName: n }) => ({ currentEditorName: n }))(ag), lg = Z(((n, o) => {
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
      })), cg = Z(((n, o) => {
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
      })), hc = Z(((n, o) => {
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
      })), ug = Z(((n) => {
        Object.defineProperty(n, "__esModule", { value: !0 }), n.resetState = u, n.log = y, n.handleBlur = b, n.handleFocus = g, n.markForFocusLater = E, n.returnFocus = x, n.popWithoutFocus = N, n.setupScopedFocus = S, n.teardownScopedFocus = O;
        var o = a(hc());
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
      })), dg = Z(((n, o) => {
        Object.defineProperty(n, "__esModule", { value: !0 }), n.default = d;
        var a = l(hc());
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
      })), pg = Z(((n, o) => {
        var a = function() {
        };
        o.exports = a;
      })), fg = Z(((n, o) => {
        (function() {
          var a = !!(typeof window < "u" && window.document && window.document.createElement), l = { canUseDOM: a, canUseWorkers: typeof Worker < "u", canUseEventListeners: a && !!(window.addEventListener || window.attachEvent), canUseViewport: a && !!window.screen };
          o !== void 0 && o.exports ? o.exports = l : window.ExecutionEnvironment = l;
        })();
      })), Ki = Z(((n) => {
        Object.defineProperty(n, "__esModule", { value: !0 }), n.canUseDOM = n.SafeNodeList = n.SafeHTMLCollection = void 0;
        var o = a(fg());
        function a(d) {
          return d && d.__esModule ? d : { default: d };
        }
        var l = o.default, c = l.canUseDOM ? window.HTMLElement : {};
        n.SafeHTMLCollection = l.canUseDOM ? window.HTMLCollection : {}, n.SafeNodeList = l.canUseDOM ? window.NodeList : {}, n.canUseDOM = l.canUseDOM, n.default = c;
      })), mc = Z(((n) => {
        Object.defineProperty(n, "__esModule", { value: !0 }), n.resetState = d, n.log = u, n.assertNodeList = y, n.setElement = b, n.validateElement = g, n.hide = E, n.show = x, n.documentNotReadyOrSSRTesting = N;
        var o = l(pg()), a = Ki();
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
      })), hg = Z(((n) => {
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
      })), gc = Z(((n) => {
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
      })), mg = Z(((n) => {
        Object.defineProperty(n, "__esModule", { value: !0 }), n.resetState = u, n.log = y;
        var o = a(gc());
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
      })), gg = Z(((n, o) => {
        Object.defineProperty(n, "__esModule", { value: !0 });
        var a = Object.assign || function(A) {
          for (var V = 1; V < arguments.length; V++) {
            var te = arguments[V];
            for (var D in te) Object.prototype.hasOwnProperty.call(te, D) && (A[D] = te[D]);
          }
          return A;
        }, l = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(A) {
          return typeof A;
        } : function(A) {
          return A && typeof Symbol == "function" && A.constructor === Symbol && A !== Symbol.prototype ? "symbol" : typeof A;
        }, c = /* @__PURE__ */ (function() {
          function A(V, te) {
            for (var D = 0; D < te.length; D++) {
              var w = te[D];
              w.enumerable = w.enumerable || !1, w.configurable = !0, "value" in w && (w.writable = !0), Object.defineProperty(V, w.key, w);
            }
          }
          return function(V, te, D) {
            return te && A(V.prototype, te), D && A(V, D), V;
          };
        })(), d = Et(), u = R(ao()), y = O(ug()), b = R(dg()), g = O(mc()), E = O(hg()), x = Ki(), N = R(x), S = R(gc());
        mg();
        function O(A) {
          if (A && A.__esModule) return A;
          var V = {};
          if (A != null) for (var te in A) Object.prototype.hasOwnProperty.call(A, te) && (V[te] = A[te]);
          return V.default = A, V;
        }
        function R(A) {
          return A && A.__esModule ? A : { default: A };
        }
        function Y(A, V) {
          if (!(A instanceof V)) throw TypeError("Cannot call a class as a function");
        }
        function se(A, V) {
          if (!A) throw ReferenceError("this hasn't been initialised - super() hasn't been called");
          return V && (typeof V == "object" || typeof V == "function") ? V : A;
        }
        function ie(A, V) {
          if (typeof V != "function" && V !== null) throw TypeError("Super expression must either be null or a function, not " + typeof V);
          A.prototype = Object.create(V && V.prototype, { constructor: { value: A, enumerable: !1, writable: !0, configurable: !0 } }), V && (Object.setPrototypeOf ? Object.setPrototypeOf(A, V) : A.__proto__ = V);
        }
        var ae = { overlay: "ReactModal__Overlay", content: "ReactModal__Content" }, pe = function(A) {
          return A.code === "Tab" || A.keyCode === 9;
        }, ye = function(A) {
          return A.code === "Escape" || A.keyCode === 27;
        }, J = 0, we = (function(A) {
          ie(V, A);
          function V(te) {
            Y(this, V);
            var D = se(this, (V.__proto__ || Object.getPrototypeOf(V)).call(this, te));
            return D.setOverlayRef = function(w) {
              D.overlay = w, D.props.overlayRef && D.props.overlayRef(w);
            }, D.setContentRef = function(w) {
              D.content = w, D.props.contentRef && D.props.contentRef(w);
            }, D.afterClose = function() {
              var w = D.props, M = w.appElement, G = w.ariaHideApp, le = w.htmlOpenClassName, q = w.bodyOpenClassName, ee = w.parentSelector, ge = ee && ee().ownerDocument || document;
              q && E.remove(ge.body, q), le && E.remove(ge.getElementsByTagName("html")[0], le), G && J > 0 && (--J, J === 0 && g.show(M)), D.props.shouldFocusAfterRender && (D.props.shouldReturnFocusAfterClose ? (y.returnFocus(D.props.preventScroll), y.teardownScopedFocus()) : y.popWithoutFocus()), D.props.onAfterClose && D.props.onAfterClose(), S.default.deregister(D);
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
              pe(w) && (0, b.default)(D.content, w), D.props.shouldCloseOnEsc && ye(w) && (w.stopPropagation(), D.requestClose(w));
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
              var G = (M === void 0 ? "undefined" : l(M)) === "object" ? M : { base: ae[w], afterOpen: ae[w] + "--after-open", beforeClose: ae[w] + "--before-close" }, le = G.base;
              return D.state.afterOpen && (le = le + " " + G.afterOpen), D.state.beforeClose && (le = le + " " + G.beforeClose), typeof M == "string" && M ? le + " " + M : le;
            }, D.attributesFromObject = function(w, M) {
              return Object.keys(M).reduce(function(G, le) {
                return G[w + "-" + le] = M[le], G;
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
            var te = this.props, D = te.appElement, w = te.ariaHideApp, M = te.htmlOpenClassName, G = te.bodyOpenClassName, le = te.parentSelector, q = le && le().ownerDocument || document;
            G && E.add(q.body, G), M && E.add(q.getElementsByTagName("html")[0], M), w && (J += 1, g.hide(D)), S.default.register(this);
          } }, { key: "render", value: function() {
            var te = this.props, D = te.id, w = te.className, M = te.overlayClassName, G = te.defaultStyles, le = te.children, q = w ? {} : G.content, ee = M ? {} : G.overlay;
            if (this.shouldBeClosed()) return null;
            var ge = { ref: this.setOverlayRef, className: this.buildClassName("overlay", M), style: a({}, ee, this.props.style.overlay), onClick: this.handleOverlayOnClick, onMouseDown: this.handleOverlayOnMouseDown }, X = a({ id: D, ref: this.setContentRef, style: a({}, q, this.props.style.content), className: this.buildClassName("content", w), tabIndex: "-1", onKeyDown: this.handleKeyDown, onMouseDown: this.handleContentOnMouseDown, onMouseUp: this.handleContentOnMouseUp, onClick: this.handleContentOnClick, role: this.props.role, "aria-label": this.props.contentLabel }, this.attributesFromObject("aria", a({ modal: !0 }, this.props.aria)), this.attributesFromObject("data", this.props.data || {}), { "data-testid": this.props.testId }), De = this.props.contentElement(X, le);
            return this.props.overlayElement(ge, De);
          } }]), V;
        })(d.Component);
        we.defaultProps = { style: { overlay: {}, content: {} }, defaultStyles: {} }, we.propTypes = { isOpen: u.default.bool.isRequired, defaultStyles: u.default.shape({ content: u.default.object, overlay: u.default.object }), style: u.default.shape({ content: u.default.object, overlay: u.default.object }), className: u.default.oneOfType([u.default.string, u.default.object]), overlayClassName: u.default.oneOfType([u.default.string, u.default.object]), parentSelector: u.default.func, bodyOpenClassName: u.default.string, htmlOpenClassName: u.default.string, ariaHideApp: u.default.bool, appElement: u.default.oneOfType([u.default.instanceOf(N.default), u.default.instanceOf(x.SafeHTMLCollection), u.default.instanceOf(x.SafeNodeList), u.default.arrayOf(u.default.instanceOf(N.default))]), onAfterOpen: u.default.func, onAfterClose: u.default.func, onRequestClose: u.default.func, closeTimeoutMS: u.default.number, shouldFocusAfterRender: u.default.bool, shouldCloseOnOverlayClick: u.default.bool, shouldReturnFocusAfterClose: u.default.bool, preventScroll: u.default.bool, role: u.default.string, contentLabel: u.default.string, aria: u.default.object, data: u.default.object, children: u.default.node, shouldCloseOnEsc: u.default.bool, overlayRef: u.default.func, contentRef: u.default.func, id: u.default.string, overlayElement: u.default.func, contentElement: u.default.func, testId: u.default.string }, n.default = we, o.exports = n.default;
      })), yg = xe({ polyfill: () => bg });
      function yc() {
        var n = this.constructor.getDerivedStateFromProps(this.props, this.state);
        n != null && this.setState(n);
      }
      function bc(n) {
        function o(a) {
          return this.constructor.getDerivedStateFromProps(n, a) ?? null;
        }
        this.setState(o.bind(this));
      }
      function vc(n, o) {
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
        if (typeof n.getDerivedStateFromProps == "function" && (o.componentWillMount = yc, o.componentWillReceiveProps = bc), typeof o.getSnapshotBeforeUpdate == "function") {
          if (typeof o.componentDidUpdate != "function") throw Error("Cannot polyfill getSnapshotBeforeUpdate() for components that do not define componentDidUpdate() on the prototype");
          o.componentWillUpdate = vc;
          var y = o.componentDidUpdate;
          o.componentDidUpdate = function(b, g, E) {
            var x = this.__reactInternalSnapshotFlag ? this.__reactInternalSnapshot : E;
            y.call(this, b, g, x);
          };
        }
        return n;
      }
      var vg = ue((() => {
        yc.__suppressDeprecationWarning = !0, bc.__suppressDeprecationWarning = !0, vc.__suppressDeprecationWarning = !0;
      })), kg = Z(((n) => {
        Object.defineProperty(n, "__esModule", { value: !0 }), n.bodyOpenClassName = n.portalClassName = void 0;
        var o = Object.assign || function(A) {
          for (var V = 1; V < arguments.length; V++) {
            var te = arguments[V];
            for (var D in te) Object.prototype.hasOwnProperty.call(te, D) && (A[D] = te[D]);
          }
          return A;
        }, a = /* @__PURE__ */ (function() {
          function A(V, te) {
            for (var D = 0; D < te.length; D++) {
              var w = te[D];
              w.enumerable = w.enumerable || !1, w.configurable = !0, "value" in w && (w.writable = !0), Object.defineProperty(V, w.key, w);
            }
          }
          return function(V, te, D) {
            return te && A(V.prototype, te), D && A(V, D), V;
          };
        })(), l = Et(), c = S(l), d = S(mt()), u = S(ao()), y = S(gg()), b = N(mc()), g = Ki(), E = S(g), x = (vg(), Le(yg));
        function N(A) {
          if (A && A.__esModule) return A;
          var V = {};
          if (A != null) for (var te in A) Object.prototype.hasOwnProperty.call(A, te) && (V[te] = A[te]);
          return V.default = A, V;
        }
        function S(A) {
          return A && A.__esModule ? A : { default: A };
        }
        function O(A, V) {
          if (!(A instanceof V)) throw TypeError("Cannot call a class as a function");
        }
        function R(A, V) {
          if (!A) throw ReferenceError("this hasn't been initialised - super() hasn't been called");
          return V && (typeof V == "object" || typeof V == "function") ? V : A;
        }
        function Y(A, V) {
          if (typeof V != "function" && V !== null) throw TypeError("Super expression must either be null or a function, not " + typeof V);
          A.prototype = Object.create(V && V.prototype, { constructor: { value: A, enumerable: !1, writable: !0, configurable: !0 } }), V && (Object.setPrototypeOf ? Object.setPrototypeOf(A, V) : A.__proto__ = V);
        }
        var se = n.portalClassName = "ReactModalPortal", ie = n.bodyOpenClassName = "ReactModal__Body--open", ae = g.canUseDOM && d.default.createPortal !== void 0, pe = function(A) {
          return document.createElement(A);
        }, ye = function() {
          return ae ? d.default.createPortal : d.default.unstable_renderSubtreeIntoContainer;
        };
        function J(A) {
          return A();
        }
        var we = (function(A) {
          Y(V, A);
          function V() {
            var te, D, w, M;
            O(this, V);
            for (var G = arguments.length, le = Array(G), q = 0; q < G; q++) le[q] = arguments[q];
            return M = (D = (w = R(this, (te = V.__proto__ || Object.getPrototypeOf(V)).call.apply(te, [this].concat(le))), w), w.removePortal = function() {
              !ae && d.default.unmountComponentAtNode(w.node);
              var ee = J(w.props.parentSelector);
              ee && ee.contains(w.node) ? ee.removeChild(w.node) : console.warn('React-Modal: "parentSelector" prop did not returned any DOM element. Make sure that the parent element is unmounted to avoid any memory leaks.');
            }, w.portalRef = function(ee) {
              w.portal = ee;
            }, w.renderPortal = function(ee) {
              var ge = ye()(w, c.default.createElement(y.default, o({ defaultStyles: V.defaultStyles }, ee)), w.node);
              w.portalRef(ge);
            }, D), R(w, M);
          }
          return a(V, [{ key: "componentDidMount", value: function() {
            g.canUseDOM && (ae || (this.node = pe("div")), this.node.className = this.props.portalClassName, J(this.props.parentSelector).appendChild(this.node), !ae && this.renderPortal(this.props));
          } }, { key: "getSnapshotBeforeUpdate", value: function(te) {
            return { prevParent: J(te.parentSelector), nextParent: J(this.props.parentSelector) };
          } }, { key: "componentDidUpdate", value: function(te, D, w) {
            if (g.canUseDOM) {
              var M = this.props, G = M.isOpen, le = M.portalClassName;
              te.portalClassName !== le && (this.node.className = le);
              var q = w.prevParent, ee = w.nextParent;
              ee !== q && (q.removeChild(this.node), ee.appendChild(this.node)), !(!te.isOpen && !G) && !ae && this.renderPortal(this.props);
            }
          } }, { key: "componentWillUnmount", value: function() {
            if (!(!g.canUseDOM || !this.node || !this.portal)) {
              var te = this.portal.state, D = Date.now(), w = te.isOpen && this.props.closeTimeoutMS && (te.closesAt || D + this.props.closeTimeoutMS);
              w ? (te.beforeClose || this.portal.closeWithTimeout(), setTimeout(this.removePortal, w - D)) : this.removePortal();
            }
          } }, { key: "render", value: function() {
            return !g.canUseDOM || !ae ? null : (!this.node && ae && (this.node = pe("div")), ye()(c.default.createElement(y.default, o({ ref: this.portalRef, defaultStyles: V.defaultStyles }, this.props)), this.node));
          } }], [{ key: "setAppElement", value: function(te) {
            b.setElement(te);
          } }]), V;
        })(l.Component);
        we.propTypes = { isOpen: u.default.bool.isRequired, style: u.default.shape({ content: u.default.object, overlay: u.default.object }), portalClassName: u.default.string, bodyOpenClassName: u.default.string, htmlOpenClassName: u.default.string, className: u.default.oneOfType([u.default.string, u.default.shape({ base: u.default.string.isRequired, afterOpen: u.default.string.isRequired, beforeClose: u.default.string.isRequired })]), overlayClassName: u.default.oneOfType([u.default.string, u.default.shape({ base: u.default.string.isRequired, afterOpen: u.default.string.isRequired, beforeClose: u.default.string.isRequired })]), appElement: u.default.oneOfType([u.default.instanceOf(E.default), u.default.instanceOf(g.SafeHTMLCollection), u.default.instanceOf(g.SafeNodeList), u.default.arrayOf(u.default.instanceOf(E.default))]), onAfterOpen: u.default.func, onRequestClose: u.default.func, closeTimeoutMS: u.default.number, ariaHideApp: u.default.bool, shouldFocusAfterRender: u.default.bool, shouldCloseOnOverlayClick: u.default.bool, shouldReturnFocusAfterClose: u.default.bool, preventScroll: u.default.bool, parentSelector: u.default.func, aria: u.default.object, data: u.default.object, role: u.default.string, contentLabel: u.default.string, shouldCloseOnEsc: u.default.bool, overlayRef: u.default.func, contentRef: u.default.func, id: u.default.string, overlayElement: u.default.func, contentElement: u.default.func }, we.defaultProps = { isOpen: !1, portalClassName: se, bodyOpenClassName: ie, role: "dialog", ariaHideApp: !0, closeTimeoutMS: 0, shouldFocusAfterRender: !0, shouldCloseOnEsc: !0, shouldCloseOnOverlayClick: !0, shouldReturnFocusAfterClose: !0, preventScroll: !1, parentSelector: function() {
          return document.body;
        }, overlayElement: function(A, V) {
          return c.default.createElement("div", A, V);
        }, contentElement: function(A, V) {
          return c.default.createElement("div", A, V);
        } }, we.defaultStyles = { overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(255, 255, 255, 0.75)" }, content: { position: "absolute", top: "40px", left: "40px", right: "40px", bottom: "40px", border: "1px solid #ccc", background: "#fff", overflow: "auto", WebkitOverflowScrolling: "touch", borderRadius: "4px", outline: "none", padding: "20px" } }, (0, x.polyfill)(we), n.default = we;
      })), wg = Z(((n, o) => {
        Object.defineProperty(n, "__esModule", { value: !0 });
        var a = l(kg());
        function l(c) {
          return c && c.__esModule ? c : { default: c };
        }
        n.default = a.default, o.exports = n.default;
      })), Eg = Te(cg()), _g = Te(wg()), xg = (n) => (0, Ue.jsx)("svg", { viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg", ...n, children: (0, Ue.jsxs)("g", { children: [(0, Ue.jsx)("path", { d: "m12.936 0 5 4.5v12.502l-1.504-.001v.003h1.504v1.499h-5v-1.501l3.496-.001V5.208L12.21 1.516 3.436 1.5v15.504l3.5-.001v1.5h-5V0h11Z" }), (0, Ue.jsx)("path", { d: "m10.374 9.463.085.072.477.464L11 10v.06l3.545 3.453-1.047 1.075L11 12.155 11 19H9v-6.9l-2.424 2.476-1.072-1.05L9.4 9.547a.75.75 0 0 1 .974-.084ZM12.799 1.5l-.001 2.774h3.645v1.5h-5.144V1.5z" })] }) }), Cg = (Zi = class extends v.Component {
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
      }, kn(Zi, "contextType", en), Zi), Sg = (n) => (0, Ue.jsx)("svg", { viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg", ...n, children: (0, Ue.jsxs)("g", { children: [(0, Ue.jsx)("path", { d: "m12.936 0 5 4.5v14.003h-4.503L14.936 17h-10l1.503 1.503H1.936V0h11Zm-9.5 1.5v15.504h12.996V5.208L12.21 1.516 3.436 1.5Z" }), (0, Ue.jsx)("path", { d: "m12.799 1.5-.001 2.774h3.645v1.5h-5.144V1.5zM9.675 18.859l-.085-.072-4.086-3.978 1.047-1.075L9 16.119 9 9h2v7.273l2.473-2.526 1.072 1.049-3.896 3.979a.75.75 0 0 1-.974.084Z" })] }) }), Tg = (n) => (0, Ue.jsx)("svg", { viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg", ...n, children: (0, Ue.jsx)("path", { d: "m3.144 15.748 2.002 1.402-1.976.516-.026-1.918ZM2.438 3.391l15.346 11.023-.875 1.218-5.202-3.736-2.877 4.286.006.005-3.055.797-2.646-1.852-.04-2.95-.006-.005.006-.008v-.025l.01.008L6.02 7.81l-4.457-3.2.876-1.22ZM7.25 8.695l-2.13 3.198 3.277 2.294 2.104-3.158-3.25-2.334ZM14.002 0l2.16 1.512-.856 1.222c.828.967 1.144 2.141.432 3.158l-2.416 3.599-1.214-.873 2.396-3.593.005.003c.317-.452-.16-1.332-1.064-1.966-.891-.624-1.865-.776-2.197-.349l-.006-.004-2.384 3.575-1.224-.879 2.376-3.539c.674-.932 1.706-1.155 3.096-.668l.046.018.85-1.216Z" }) }), Og = (n) => (0, Ue.jsx)("svg", { viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg", ...n, children: (0, Ue.jsx)("path", { d: "M11.28 1a1 1 0 0 1 .948.684l.333 1 .018.066H16a.75.75 0 0 1 .102 1.493L16 4.25h-.5V16a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2V4.25H3a.75.75 0 0 1-.102-1.493L3 2.75h3.42a1 1 0 0 1 .019-.066l.333-1A1 1 0 0 1 7.721 1h3.558ZM14 4.5H5V16a.5.5 0 0 0 .41.492l.09.008h8a.5.5 0 0 0 .492-.41L14 16V4.5ZM7.527 6.06v8.951h-1V6.06h1Zm5 0v8.951h-1V6.06h1ZM10 6.06v8.951H9V6.06h1Z" }) }), Ng = (n) => (0, Ue.jsx)("svg", { viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", ...n, children: (0, Ue.jsxs)("g", { children: [(0, Ue.jsx)("path", { d: "M2.284 2.498c-.239.266-.184.617-.184 1.002V4H2a.5.5 0 0 0-.492.41L1.5 4.5V17a1 1 0 0 0 .883.993L2.5 18h10a1 1 0 0 0 .97-.752l-.081-.062c.438.368.976.54 1.507.526a2.5 2.5 0 0 1-2.232 1.783l-.164.005h-10a2.5 2.5 0 0 1-2.495-2.336L0 17V4.5a2 2 0 0 1 1.85-1.995L2 2.5l.284-.002zm10.532 0L13 2.5a2 2 0 0 1 1.995 1.85L15 4.5v2.28a2.243 2.243 0 0 0-1.5.404V4.5a.5.5 0 0 0-.41-.492L13 4v-.5l-.007-.144c-.031-.329.032-.626-.177-.858z" }), (0, Ue.jsx)("path", { d: "m6 .49-.144.006a1.75 1.75 0 0 0-1.41.94l-.029.058.083-.004c-.69 0-1.25.56-1.25 1.25v1c0 .69.56 1.25 1.25 1.25h6c.69 0 1.25-.56 1.25-1.25v-1l-.006-.128a1.25 1.25 0 0 0-1.116-1.116l-.046-.002-.027-.058A1.75 1.75 0 0 0 9 .49H6zm0 1.5h3a.25.25 0 0 1 .25.25l.007.102A.75.75 0 0 0 10 2.99h.25v.5h-5.5v-.5H5a.75.75 0 0 0 .743-.648l.007-.102A.25.25 0 0 1 6 1.99zM15.374 8.54a.75.75 0 0 1-.093 1.056l-2.33 1.954h6.127a.75.75 0 0 1 0 1.501h-5.949l2.19 1.837a.75.75 0 1 1-.966 1.15l-3.788-3.18a.747.747 0 0 1-.21-.285.75.75 0 0 1 .17-.945l3.792-3.182a.75.75 0 0 1 1.057.093z" })] }) }), Pg = (n) => (0, Ue.jsx)("svg", { viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", ...n, children: (0, Ue.jsx)("path", { fill: "#4fa800", d: "M6.972 16.615a.997.997 0 0 1-.744-.292l-4.596-4.596a1 1 0 1 1 1.414-1.414l3.926 3.926 9.937-9.937a1 1 0 0 1 1.414 1.415L7.717 16.323a.997.997 0 0 1-.745.292z" }) }), kc = "Lock from Inspector (@ckeditor/ckeditor5-inspector)", Dg = (Ji = class extends v.Component {
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
          this.props.editor.isReadOnly ? this.props.editor.disableReadOnlyMode(kc) : this.props.editor.enableReadOnlyMode(kc);
        }
      }, kn(Ji, "contextType", en), Ji), Ig = qe(({ editors: n, currentEditorName: o, currentEditorGlobals: { isReadOnly: a } }) => ({ editor: n.get(o), isReadOnly: a }), {})(Dg), Rg = (n) => (0, Ue.jsx)("svg", { viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg", ...n, children: (0, Ue.jsx)("path", { d: "M17.03 6.47a.75.75 0 0 1 .073.976l-.072.084-6.984 7a.75.75 0 0 1-.977.073l-.084-.072-7.016-7a.75.75 0 0 1 .976-1.134l.084.072 6.485 6.47 6.454-6.469a.75.75 0 0 1 .977-.073l.084.072Z" }) }), Mg = "100", wc = 30, Ag = { position: "fixed", bottom: "0", left: "0", right: "0", top: "auto" }, zg = (ea = class extends v.Component {
        constructor(n) {
          super(n), this.handleInspectorResize = this.handleInspectorResize.bind(this);
        }
        componentDidMount() {
          Ec(this.context.document, this.props.height), this.context.document.body.style.setProperty("--ck-inspector-collapsed-height", `${wc}px`);
        }
        handleInspectorResize(n, o, a) {
          let l = a.style.height;
          this.props.setHeight(l), Ec(this.context.document, l);
        }
        render() {
          let n = this.context.document.body;
          return this.props.isCollapsed ? (n.classList.remove("ck-inspector-body-expanded"), n.classList.add("ck-inspector-body-collapsed")) : (n.classList.remove("ck-inspector-body-collapsed"), n.classList.add("ck-inspector-body-expanded")), v.createElement(ic, { bounds: "window", enableResizing: { top: !this.props.isCollapsed }, disableDragging: !0, minHeight: Mg, maxHeight: "100%", style: Ag, className: ["ck-inspector", this.props.isCollapsed ? "ck-inspector_collapsed" : ""].join(" "), position: { x: 0, y: "100%" }, size: { width: "100%", height: this.props.isCollapsed ? wc : this.props.height }, onResizeStop: this.handleInspectorResize }, v.createElement(vr, { onTabChange: this.props.setActiveTab, contentBefore: v.createElement(Lg, { key: "docs" }), activeTab: this.props.activeTab, contentAfter: [v.createElement($g, { key: "selector" }), v.createElement("span", { className: "ck-inspector-separator", key: "separator-a" }), v.createElement(Ig, { key: "quick-actions" }), v.createElement("span", { className: "ck-inspector-separator", key: "separator-b" }), v.createElement(Vg, { key: "inspector-toggle" })] }, v.createElement(Um, { label: "Model" }), v.createElement(Qm, { label: "View" }), v.createElement(tg, { label: "Commands" }), v.createElement(sg, { label: "Schema" })));
        }
        componentWillUnmount() {
          let n = this.context.document.body;
          n.classList.remove("ck-inspector-body-expanded"), n.classList.remove("ck-inspector-body-collapsed");
        }
      }, kn(ea, "contextType", en), ea), jg = qe(({ editors: n, currentEditorName: o, ui: { isCollapsed: a, height: l, activeTab: c } }) => ({ isCollapsed: a, height: l, editors: n, currentEditorName: o, activeTab: c }), { toggleIsCollapsed: ll, setHeight: lf, setEditors: cl, setCurrentEditorName: ul, setActiveTab: dl })(zg), Lg = class extends v.Component {
        render() {
          return v.createElement("a", { className: "ck-inspector-navbox__navigation__logo", title: "Go to the documentation", href: "https://ckeditor.com/docs/ckeditor5/latest/", target: "_blank", rel: "noopener noreferrer" }, "CKEditor documentation");
        }
      }, Ug = (ta = class extends v.Component {
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
      }, kn(ta, "contextType", en), ta), Vg = qe(({ ui: { isCollapsed: n } }) => ({ isCollapsed: n }), { toggleIsCollapsed: ll })(Ug), Fg = class extends v.Component {
        render() {
          return v.createElement("div", { className: "ck-inspector-editor-selector", key: "editor-selector" }, this.props.currentEditorName ? v.createElement(Wi, { id: "inspector-editor-selector", label: "Instance", value: this.props.currentEditorName, options: [...this.props.editors].map(([n]) => n), onChange: (n) => this.props.setCurrentEditorName(n.target.value) }) : "");
        }
      }, $g = qe(({ currentEditorName: n, editors: o }) => ({ currentEditorName: n, editors: o }), { setCurrentEditorName: ul })(Fg);
      function Ec(n, o) {
        n.body.style.setProperty("--ck-inspector-height", o);
      }
      function Hg(n) {
        return n.altKey && !n.shiftKey && !n.ctrlKey && n.key === "F12";
      }
      window.CKEDITOR_INSPECTOR_VERSION = "5.0.3";
      var Qi = class Pe {
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
          hr.unmountComponentAtNode(Pe._wrapper), Pe._editors.clear(), Pe._wrapper.remove();
          let o = Pe._store.getState(), a = o.editors.get(o.currentEditorName);
          a && Pe._editorListener.stopListening(a), Pe._editorListener = null, Pe._wrapper = null, Pe._store = null, (l = Pe._teardown) == null || l.call(Pe), Pe._teardown = null;
        }
        static _updateEditorsState() {
          Pe._store.dispatch(cl(Pe._editors));
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
            g.getState().ui.isCollapsed || (g.dispatch(rl()), g.dispatch(Ui()));
          }, onViewRender() {
            let g = Pe._store;
            g.getState().ui.isCollapsed || g.dispatch(Ri());
          }, onReadOnlyChange() {
            Pe._store.dispatch(uf());
          } }), Pe._store = yr(ch, { editors: Pe._editors, currentEditorName: ml(Pe._editors), currentEditorGlobals: {}, ui: { isCollapsed: o.isCollapsed } }), Pe._store.subscribe(() => {
            let g = Pe._store.getState(), E = g.editors.get(g.currentEditorName);
            u !== E && (u && Pe._editorListener.stopListening(u), E && Pe._editorListener.startListening(E), u = E);
          }), Pe._store.subscribe(() => {
            let g = Pe._store, E = g.getState().ui.isCollapsed, x = y && !E;
            y = E, x && (g.dispatch(rl()), g.dispatch(Ui()), g.dispatch(Ri()));
          }), hr.render(v.createElement(en.Provider, { value: { document: l, window: c } }, v.createElement(wp, { store: Pe._store }, v.createElement(jg, null))), d);
        }
        static _isAttachedTo(o) {
          return [...Pe._editors.values()].includes(o);
        }
      };
      return Qi._editors = /* @__PURE__ */ new Map(), Qi._wrapper = null, Qi;
    });
  })(Si)), Si.exports;
}
var bv = yv();
const vv = /* @__PURE__ */ mv(bv);
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
const kv = function(de) {
  const h = de.plugins.get(up), m = $(de.ui.view.element), k = $(de.sourceElement), T = `ckeditor${Math.floor(Math.random() * 1e9)}`, L = [
    "keypress",
    "keyup",
    "change",
    "focus",
    "blur",
    "click",
    "mousedown",
    "mouseup"
  ].map((z) => `${z}.${T}`).join(" ");
  h.on("change:isSourceEditingMode", () => {
    const z = m.find(
      ".ck-source-editing-area"
    );
    if (h.isSourceEditingMode) {
      let K = z.attr("data-value");
      z.on(L, () => {
        K !== (K = z.attr("data-value")) && k.val(K);
      });
    } else
      z.off(`.${T}`);
  });
}, wv = function(de, h) {
  if (h.heading !== void 0) {
    var m = h.heading.options;
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
}, Ev = function(de, h) {
  let m = null;
  const k = de.editing.view.document, T = de.plugins.get("ClipboardPipeline");
  k.on("clipboardOutput", (L, z) => {
    m = de.id;
  }), k.on("clipboardInput", async (L, z) => {
    let K = z.dataTransfer.getData("text/html");
    if (K && K.includes("<craft-entry") && !(z.method == "drop" && m === de.id)) {
      if (z.method == "paste" || z.method == "drop" && m !== de.id) {
        let ue = K, Z = !1;
        const xe = Craft.siteId;
        let ke = null, Te = null;
        const Le = de.getData(), it = [
          ...K.matchAll(
            /data-entry-id="([0-9]+)[^>]*data-site-id="([0-9]+)/g
          )
        ];
        L.stop();
        const It = $(de.ui.view.element);
        let Ht = It.parents("form").data("elementEditor");
        await Ht.ensureIsDraftOrRevision();
        let wn = It.parents(".input");
        if (wn.length > 0) {
          let Ye = $(wn[0]).find("div.ckeditor-container");
          Ye.length > 0 && (ke = $(Ye[0]).data("element-id"));
        }
        ke == null && (ke = Ht.settings.elementId), Te = It.parents(".field").data("layoutElement");
        for (let Ye = 0; Ye < it.length; Ye++) {
          let mt = null;
          it[Ye][1] && (mt = it[Ye][1]);
          let v = null;
          if (it[Ye][2] && (v = it[Ye][2]), mt !== null) {
            const hr = new RegExp('data-entry-id="' + mt + '"');
            if (!(m === de.id && !hr.test(Le))) {
              let dt = null;
              m !== de.id && (h.includes(cv) ? dt = de.config.get("entryTypeOptions").map((at) => at.value) : (Craft.cp.displayError(
                Craft.t(
                  "ckeditor",
                  "This field doesn’t allow nested entries."
                )
              ), Z = !0)), await Craft.sendActionRequest(
                "POST",
                "ckeditor/ckeditor/duplicate-nested-entry",
                {
                  data: {
                    entryId: mt,
                    targetSiteId: xe,
                    sourceSiteId: v,
                    targetEntryTypeIds: dt,
                    targetOwnerId: ke,
                    targetLayoutElementUid: Te
                  }
                }
              ).then((at) => {
                at.data.newEntryId && (ue = ue.replace(
                  'data-entry-id="' + mt + '"',
                  'data-entry-id="' + at.data.newEntryId + '"'
                )), at.data.newSiteId && (ue = ue.replace(
                  'data-site-id="' + v + '"',
                  'data-site-id="' + at.data.newSiteId + '"'
                ));
              }).catch((at) => {
                var mr, gr, io, yr;
                Z = !0, Craft.cp.displayError((gr = (mr = at == null ? void 0 : at.response) == null ? void 0 : mr.data) == null ? void 0 : gr.message), console.error((yr = (io = at == null ? void 0 : at.response) == null ? void 0 : io.data) == null ? void 0 : yr.additionalMessage);
              });
            }
          }
        }
        Z || (z.content = de.data.htmlProcessor.toView(ue), T.fire("inputTransformation", z));
      }
    }
  });
}, Pv = async function(de, h) {
  typeof de == "string" && (de = document.querySelector(`#${de}`)), h.licenseKey = "GPL", h.attachTo = de;
  const m = await Kb.create(h);
  Craft.showCkeditorInspector && Craft.userIsAdmin && vv.attach(m), m.editing.view.change((z) => {
    const K = m.editing.view.document.getRoot();
    if (typeof h.accessibleFieldName < "u" && h.accessibleFieldName.length) {
      let ue = K.getAttribute("aria-label");
      z.setAttribute(
        "aria-label",
        h.accessibleFieldName + ", " + ue,
        K
      );
    }
    typeof h.describedBy < "u" && h.describedBy.length && z.setAttribute(
      "aria-describedby",
      h.describedBy,
      K
    );
  });
  let L = $(m.ui.view.element).parents("form").data("elementEditor");
  if (!L)
    m.updateSourceElement();
  else {
    const z = m.sourceElement.name, K = $(m.sourceElement).val();
    L.pause(), m.updateSourceElement();
    const ue = $(m.sourceElement).val();
    if (K !== ue) {
      const Z = L.$container.data(
        "initialSerializedValue"
      );
      typeof Z == "string" && L.$container.data(
        "initialSerializedValue",
        Z.replace(
          $.param({ [z]: K }),
          $.param({ [z]: ue })
        )
      );
    }
    L.resume();
  }
  return m.model.document.on("change:data", () => {
    m.updateSourceElement();
  }), h.plugins.includes(up) && kv(m), h.plugins.includes(Qb) && wv(m, h), Ev(m, h.plugins), m;
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
