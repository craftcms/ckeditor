import { ImageInsertUI, ButtonView, icons, Plugin, LinkUI, ContextualBalloon, ViewModel, Range, LabeledFieldView, createLabeledInputText, createDropdown, addListToDropdown, Collection, findAttributeRange, Command, ImageUtils, DropdownButtonView, Widget, viewToModelPositionOutsideModelElement, toWidget, DomEventObserver, WidgetToolbarRepository, isWidget, ClassicEditor, SourceEditing, Heading } from "ckeditor5";
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class CraftImageInsertUI extends ImageInsertUI {
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
    const componentFactory = this.editor.ui.componentFactory;
    const componentCreator = (locale) => {
      return this._createToolbarImageButton(locale);
    };
    componentFactory.add("insertImage", componentCreator);
    componentFactory.add("imageInsert", componentCreator);
  }
  get _assetSources() {
    return this.editor.config.get("assetSources");
  }
  _createToolbarImageButton(locale) {
    const editor = this.editor;
    const t = editor.t;
    const button = new ButtonView(locale);
    button.isEnabled = true;
    button.label = t("Insert image");
    button.icon = icons.image;
    button.tooltip = true;
    const insertImageCommand = editor.commands.get("insertImage");
    button.bind("isEnabled").to(insertImageCommand);
    this.listenTo(button, "execute", () => this._showImageSelectModal());
    return button;
  }
  _showImageSelectModal() {
    const sources = this._assetSources;
    const editor = this.editor;
    const config = editor.config;
    const criteria = Object.assign({}, config.get("assetSelectionCriteria"), {
      kind: "image"
    });
    Craft.createElementSelectorModal("craft\\elements\\Asset", {
      storageKey: `ckeditor:${this.pluginName}:'craft\\elements\\Asset'`,
      sources,
      criteria,
      defaultSiteId: config.get("elementSiteId"),
      transforms: config.get("transforms"),
      multiSelect: true,
      autoFocusSearchBox: false,
      onSelect: (assets, transform) => {
        this._processAssetUrls(assets, transform).then(() => {
          editor.editing.view.focus();
        });
      },
      onHide: () => {
        editor.editing.view.focus();
      },
      closeOtherModals: false
    });
  }
  _processAssetUrls(assets, transform) {
    return new Promise((resolve) => {
      if (!assets.length) {
        resolve();
        return;
      }
      const editor = this.editor;
      const defaultTransform = editor.config.get("defaultTransform");
      const queue = new Craft.Queue();
      const urls = [];
      queue.on("afterRun", () => {
        editor.execute("insertImage", { source: urls });
        resolve();
      });
      for (const asset of assets) {
        queue.push(
          () => new Promise((resolve2) => {
            const hasTransform = this._isTransformUrl(asset.url);
            if (!hasTransform && defaultTransform) {
              this._getTransformUrl(asset.id, defaultTransform, (url) => {
                urls.push(url);
                resolve2();
              });
            } else {
              const url = this._buildAssetUrl(
                asset.id,
                asset.url,
                hasTransform ? transform : defaultTransform
              );
              urls.push(url);
              resolve2();
            }
          })
        );
      }
    });
  }
  _buildAssetUrl(assetId, assetUrl, transform) {
    return `${assetUrl}#asset:${assetId}:${transform ? "transform:" + transform : "url"}`;
  }
  _removeTransformFromUrl(url) {
    return url.replace(/(^|\/)(_[^\/]+\/)([^\/]+)$/, "$1$3");
  }
  _isTransformUrl(url) {
    return /(^|\/)_[^\/]+\/[^\/]+$/.test(url);
  }
  _getTransformUrl(assetId, handle, callback) {
    Craft.sendActionRequest("POST", "ckeditor/ckeditor/image-url", {
      data: {
        assetId,
        transform: handle
      }
    }).then(({ data }) => {
      callback(this._buildAssetUrl(assetId, data.url, handle));
    }).catch(() => {
      alert("There was an error generating the transform URL.");
    });
  }
  _getAssetUrlComponents(url) {
    const matches = url.match(
      /(.*)#asset:(\d+):(url|transform):?([a-zA-Z][a-zA-Z0-9_]*)?/
    );
    return matches ? {
      url: matches[1],
      assetId: matches[2],
      transform: matches[3] !== "url" ? matches[4] : null
    } : null;
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class CraftLinkUI extends Plugin {
  static get requires() {
    return [LinkUI];
  }
  static get pluginName() {
    return "CraftLinkUI";
  }
  constructor() {
    super(...arguments);
    this.siteDropdownView = null;
    this.siteDropdownItemModels = null;
    this.localizedRefHandleRE = null;
    this.linkTypeDropdownView = null;
    this.linkTypeDropdownItemModels = [];
    this.elementTypeRefHandleRE = null;
    this.conversionData = [];
    this.editor.config.define("linkOptions", []);
    this.editor.config.define("advancedLinkFields", []);
  }
  init() {
    const editor = this.editor;
    this._linkUI = editor.plugins.get(LinkUI);
    this._balloon = editor.plugins.get(ContextualBalloon);
    const linkOptions = editor.config.get("linkOptions");
    const advancedLinkFields = editor.config.get("advancedLinkFields");
    this.conversionData = advancedLinkFields.map((field) => field.conversion ?? null).filter((field) => field);
    this._defineSchema();
    this._defineConverters();
    this._adjustLinkCommand();
    this._adjustUnlinkCommand();
    this._modifyFormViewTemplate(linkOptions, advancedLinkFields);
    const refHandlesPattern = CKE_LOCALIZED_REF_HANDLES.join("|");
    if (Craft.isMultiSite) {
      this.localizedRefHandleRE = new RegExp(
        `(#(?:${refHandlesPattern}):\\d+)(?:@(\\d+))?`
      );
    }
    this.elementTypeRefHandleRE = new RegExp(
      `(#((?:${refHandlesPattern})):\\d+)`
    );
  }
  _defineSchema() {
    const schema = this.editor.model.schema;
    let modelAttributes = this.conversionData.map((field) => field.model);
    schema.extend("$text", {
      allowAttributes: modelAttributes
    });
  }
  _defineConverters() {
    const conversion = this.editor.conversion;
    for (let i = 0; i < this.conversionData.length; i++) {
      conversion.for("downcast").attributeToElement({
        model: this.conversionData[i].model,
        view: (value, { writer }) => {
          const linkViewElement = writer.createAttributeElement(
            "a",
            {
              [this.conversionData[i].view]: value
            },
            { priority: 5 }
          );
          writer.setCustomProperty("link", true, linkViewElement);
          return linkViewElement;
        }
      });
      conversion.for("upcast").elementToAttribute({
        view: {
          name: "a",
          attributes: {
            [this.conversionData[i].view]: true
          }
        },
        model: {
          key: this.conversionData[i].model,
          value: (viewElement) => {
            return viewElement.getAttribute(this.conversionData[i].view);
          }
        }
      });
    }
  }
  _getLinkListItemDefinitions(linkOptions) {
    const itemDefinitions = [];
    for (const option of linkOptions) {
      itemDefinitions.push(
        new ViewModel({
          label: option.label,
          handle: option.refHandle,
          linkOption: option,
          withText: true
        })
      );
    }
    itemDefinitions.push(
      new ViewModel({
        label: Craft.t("app", "URL"),
        handle: "default",
        withText: true
      })
    );
    return itemDefinitions;
  }
  _showElementSelectorModal(linkOption) {
    const editor = this.editor;
    const model = editor.model;
    const selection = model.document.selection;
    const isCollapsed = selection.isCollapsed;
    const range = selection.getFirstRange();
    const onCancel = () => {
      editor.editing.view.focus();
      if (!isCollapsed && range) {
        model.change((writer) => {
          writer.setSelection(range);
        });
      }
      this._linkUI._hideFakeVisualSelection();
    };
    if (!this._linkUI._getSelectedLinkElement()) {
      this._linkUI._showFakeVisualSelection();
    }
    Craft.createElementSelectorModal(linkOption.elementType, {
      storageKey: `ckeditor:${this.pluginName}:${linkOption.elementType}`,
      sources: linkOption.sources,
      criteria: linkOption.criteria,
      defaultSiteId: editor.config.get("elementSiteId"),
      autoFocusSearchBox: false,
      onSelect: (elements) => {
        if (elements.length) {
          const element = elements[0];
          const url = `${element.url}#${linkOption.refHandle}:${element.id}@${element.siteId}`;
          editor.editing.view.focus();
          if (!isCollapsed && range) {
            model.change((writer) => {
              writer.setSelection(range);
            });
            const linkCommand = editor.commands.get("link");
            linkCommand.execute(url);
          } else {
            model.change((writer) => {
              writer.insertText(
                element.label,
                {
                  linkHref: url
                },
                selection.getFirstPosition()
              );
              if (range instanceof Range) {
                try {
                  const newRange = range.clone();
                  newRange.end.path[1] += element.label.length;
                  writer.setSelection(newRange);
                } catch (e) {
                }
              }
            });
          }
          this._linkUI._hideFakeVisualSelection();
          setTimeout(() => {
            editor.editing.view.focus();
            this._linkUI._showUI(true);
          }, 100);
        } else {
          onCancel();
        }
      },
      onCancel: () => {
        onCancel();
      },
      closeOtherModals: false
    });
  }
  _modifyFormViewTemplate(linkOptions, advancedLinkFields) {
    if (!this._linkUI.formView) {
      this._linkUI._createViews();
    }
    const { formView } = this._linkUI;
    const { urlInputView } = formView;
    const { fieldView } = urlInputView;
    formView.template.attributes.class.push(
      "ck-link-form_layout-vertical",
      "ck-vertical-form"
    );
    if (linkOptions && linkOptions.length) {
      this._linkOptionsDropdown(linkOptions, formView, urlInputView, fieldView);
    }
    if (Craft.isMultiSite) {
      this._sitesDropdown(formView, urlInputView, fieldView);
    }
    if (advancedLinkFields && advancedLinkFields.length) {
      this._advancedLinkFields(
        advancedLinkFields,
        formView,
        urlInputView,
        fieldView
      );
    }
  }
  _advancedLinkFields(advancedLinkFields, formView, urlInputView, fieldView) {
    var _a;
    if (advancedLinkFields.length == 0) {
      return;
    }
    const linkCommand = this.editor.commands.get("link");
    for (const advancedField of advancedLinkFields) {
      let labeledInputView = new LabeledFieldView(
        formView.locale,
        createLabeledInputText
      );
      labeledInputView.label = advancedField.label;
      if (advancedField.info) {
        labeledInputView.infoText = advancedField.info;
      }
      const { children } = formView;
      const urlInputIdx = children.getIndex(urlInputView);
      children.add(labeledInputView, urlInputIdx + 3);
      let modelAttribute = (_a = advancedField.conversion) == null ? void 0 : _a.model;
      if (typeof modelAttribute !== "undefined") {
        formView[modelAttribute] = labeledInputView;
        formView[modelAttribute].fieldView.bind("value").to(linkCommand, modelAttribute);
        formView[modelAttribute].fieldView.element.value = linkCommand[modelAttribute] || "";
      }
    }
    const modelAttributes = this.conversionData.map((field) => field.model);
    formView.on(
      "submit",
      () => {
        const values = modelAttributes.reduce((state, modelAttribute) => {
          state[modelAttribute] = formView[modelAttribute].fieldView.element.value;
          return state;
        }, {});
        linkCommand.once(
          "execute",
          (evt, args) => {
            if (args.length === 3) {
              Object.assign(args[2], values);
            }
          },
          { priority: "highest" }
        );
      },
      { priority: "high" }
    );
  }
  _linkOptionsDropdown(linkOptions, formView, urlInputView, fieldView) {
    this.linkTypeDropdownView = createDropdown(formView.locale);
    this.linkTypeDropdownView.buttonView.set({
      label: "",
      withText: true,
      isVisible: true
    });
    this.linkTypeDropdownItemModels = Object.fromEntries(
      this._getLinkListItemDefinitions(linkOptions).map((item) => [
        item.handle,
        item
      ])
    );
    addListToDropdown(
      this.linkTypeDropdownView,
      new Collection([
        ...this._getLinkListItemDefinitions(linkOptions).map((item) => ({
          type: "button",
          model: this.linkTypeDropdownItemModels[item.handle]
        }))
      ])
    );
    this.linkTypeDropdownView.on("execute", (evt) => {
      var _a;
      if (evt.source.linkOption) {
        this._linkUI._hideUI();
        const linkOption = evt.source.linkOption;
        this._showElementSelectorModal(linkOption);
      } else {
        this._selectLinkTypeDropdownItem("default");
        fieldView.set("value", "");
        (_a = this.siteDropdownView) == null ? void 0 : _a.buttonView.set("isVisible", false);
      }
    });
    const { children } = formView;
    const urlInputIdx = children.getIndex(urlInputView);
    children.add(this.linkTypeDropdownView, urlInputIdx + 1);
    formView._focusables.add(this.linkTypeDropdownView);
    formView.focusTracker.add(this.linkTypeDropdownView.element);
    this.listenTo(fieldView, "change:value", () => {
      this._toggleLinkTypeDropdownView();
    });
    this.listenTo(fieldView, "input", () => {
      this._toggleLinkTypeDropdownView();
    });
  }
  _toggleLinkTypeDropdownView() {
    const match = this._urlInputValue().match(this.elementTypeRefHandleRE);
    if (match) {
      this.linkTypeDropdownView.buttonView.set("isVisible", true);
      let elementType = match[2];
      if (elementType && typeof this.linkTypeDropdownItemModels[elementType] === "undefined") {
        elementType = null;
      }
      this._selectLinkTypeDropdownItem(elementType);
    }
  }
  _selectLinkTypeDropdownItem(elementType) {
    const itemModel = this.linkTypeDropdownItemModels[elementType];
    const label = elementType ? Craft.t("app", "{name}", { name: itemModel.label }) : itemModel.label;
    this.linkTypeDropdownView.buttonView.set("label", label);
    Object.values(this.linkTypeDropdownItemModels).forEach((model) => {
      model.set("isOn", model.handle === itemModel.handle);
    });
  }
  _sitesDropdown(formView, urlInputView, fieldView) {
    this.siteDropdownView = createDropdown(formView.locale);
    this.siteDropdownView.buttonView.set({
      label: "",
      withText: true,
      isVisible: false
    });
    this.siteDropdownItemModels = Object.fromEntries(
      Craft.sites.map((site) => [
        site.id,
        new ViewModel({
          label: site.name,
          siteId: site.id,
          withText: true
        })
      ])
    );
    this.siteDropdownItemModels.current = new ViewModel({
      label: Craft.t("ckeditor", "Link to the current site"),
      siteId: null,
      withText: true
    });
    addListToDropdown(
      this.siteDropdownView,
      new Collection([
        ...Craft.sites.map((site) => ({
          type: "button",
          model: this.siteDropdownItemModels[site.id]
        })),
        {
          type: "button",
          model: this.siteDropdownItemModels.current
        }
      ])
    );
    this.siteDropdownView.on("execute", (evt) => {
      const match = this._urlInputRefMatch(this.localizedRefHandleRE);
      if (!match) {
        console.warn(
          `No reference tag hash present in URL: ${this._urlInputValue()}`
        );
        return;
      }
      const { siteId } = evt.source;
      let ref = match[1];
      if (siteId) {
        ref += `@${siteId}`;
      }
      const newUrl = this._urlInputValue().replace(match[0], ref);
      fieldView.set("value", newUrl);
    });
    const { children } = formView;
    const urlInputIdx = children.getIndex(urlInputView);
    children.add(this.siteDropdownView, urlInputIdx + 2);
    formView._focusables.add(this.siteDropdownView);
    formView.focusTracker.add(this.siteDropdownView.element);
    this.listenTo(fieldView, "change:value", () => {
      this._toggleSiteDropdownView();
    });
    this.listenTo(fieldView, "input", () => {
      this._toggleSiteDropdownView();
    });
  }
  _urlInputValue() {
    return this._linkUI.formView.urlInputView.fieldView.element.value;
  }
  _urlInputRefMatch(regEx) {
    return this._urlInputValue().match(regEx);
  }
  _toggleSiteDropdownView() {
    const match = this._urlInputRefMatch(this.localizedRefHandleRE);
    if (match) {
      this.siteDropdownView.buttonView.set("isVisible", true);
      let siteId = match[2] ? parseInt(match[2], 10) : null;
      if (siteId && typeof this.siteDropdownItemModels[siteId] === "undefined") {
        siteId = null;
      }
      this._selectSiteDropdownItem(siteId);
    }
  }
  _selectSiteDropdownItem(siteId) {
    const itemModel = this.siteDropdownItemModels[siteId ?? "current"];
    const label = siteId ? Craft.t("ckeditor", "Site: {name}", { name: itemModel.label }) : itemModel.label;
    this.siteDropdownView.buttonView.set("label", label);
    Object.values(this.siteDropdownItemModels).forEach((model) => {
      model.set("isOn", model === itemModel);
    });
  }
  _adjustLinkCommand() {
    const editor = this.editor;
    const linkCommand = editor.commands.get("link");
    let linking = false;
    linkCommand.on(
      "execute",
      (evt, args) => {
        if (linking) {
          linking = false;
          return;
        }
        evt.stop();
        linking = true;
        const extraAttributeValues = args[args.length - 1];
        const { model } = editor;
        const { selection } = model.document;
        model.change((writer) => {
          this.editor.execute("link", ...args);
          const firstPosition = selection.getFirstPosition();
          this.conversionData.forEach((item) => {
            if (selection.isCollapsed) {
              const node = firstPosition.textNode || firstPosition.nodeBefore;
              if (extraAttributeValues[item.model]) {
                writer.setAttribute(
                  item.model,
                  extraAttributeValues[item.model],
                  writer.createRangeOn(node)
                );
              } else {
                writer.removeAttribute(item.model, writer.createRangeOn(node));
              }
              writer.removeSelectionAttribute(item.model);
            } else {
              const ranges = model.schema.getValidRanges(
                selection.getRanges(),
                item.model
              );
              for (const range of ranges) {
                if (extraAttributeValues[item.model]) {
                  writer.setAttribute(
                    item.model,
                    extraAttributeValues[item.model],
                    range
                  );
                } else {
                  writer.removeAttribute(item.model, range);
                }
              }
            }
          });
        });
      },
      { priority: "high" }
    );
  }
  _adjustUnlinkCommand() {
    const editor = this.editor;
    const unlinkCommand = editor.commands.get("unlink");
    const { model } = editor;
    const { selection } = model.document;
    let unlinking = false;
    unlinkCommand.on(
      "execute",
      (evt) => {
        if (unlinking) {
          return;
        }
        evt.stop();
        model.change(() => {
          unlinking = true;
          editor.execute("unlink");
          unlinking = false;
          model.change((writer) => {
            let ranges;
            this.conversionData.forEach((item) => {
              if (selection.isCollapsed) {
                ranges = [
                  findAttributeRange(
                    selection.getFirstPosition(),
                    item.model,
                    selection.getAttribute(item.model),
                    model
                  )
                ];
              } else {
                ranges = model.schema.getValidRanges(
                  selection.getRanges(),
                  item.model
                );
              }
              for (const range of ranges) {
                writer.removeAttribute(item.model, range);
              }
            });
          });
        });
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
class TransformImageCommand extends Command {
  refresh() {
    const element = this._element();
    const srcInfo = this._srcInfo(element);
    this.isEnabled = !!srcInfo;
    if (!srcInfo) {
      this.value = null;
    } else {
      this.value = {
        transform: srcInfo.transform
      };
    }
  }
  _element() {
    const editor = this.editor;
    const imageUtils = editor.plugins.get("ImageUtils");
    return imageUtils.getClosestSelectedImageElement(
      editor.model.document.selection
    );
  }
  _srcInfo(element) {
    if (!element || !element.hasAttribute("src")) {
      return null;
    }
    const src = element.getAttribute("src");
    const match = src.match(
      /#asset:(\d+)(?::transform:([a-zA-Z][a-zA-Z0-9_]*))?/
    );
    if (!match) {
      return null;
    }
    return {
      src,
      assetId: match[1],
      transform: match[2]
    };
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
  execute(options) {
    const editor = this.editor;
    const model = editor.model;
    const element = this._element();
    const srcInfo = this._srcInfo(element);
    this.value = {
      transform: options.transform
    };
    if (srcInfo) {
      const hash = `#asset:${srcInfo.assetId}` + (options.transform ? `:transform:${options.transform}` : "");
      model.change((writer) => {
        const src = srcInfo.src.replace(/#.*/, "") + hash;
        writer.setAttribute("src", src, element);
      });
      Craft.sendActionRequest("post", "ckeditor/ckeditor/image-url", {
        data: {
          assetId: srcInfo.assetId,
          transform: options.transform
        }
      }).then(({ data }) => {
        model.change((writer) => {
          const src = data.url + hash;
          writer.setAttribute("src", src, element);
          if (data.width) {
            writer.setAttribute("width", data.width, element);
          }
          if (data.height) {
            writer.setAttribute("height", data.height, element);
          }
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
class ImageTransformEditing extends Plugin {
  static get requires() {
    return [ImageUtils];
  }
  static get pluginName() {
    return "ImageTransformEditing";
  }
  constructor(editor) {
    super(editor);
    editor.config.define("transforms", []);
  }
  init() {
    const editor = this.editor;
    const transformImageCommand = new TransformImageCommand(editor);
    editor.commands.add("transformImage", transformImageCommand);
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
const RESIZE_ICON = icons.objectSizeMedium;
class ImageTransformUI extends Plugin {
  static get requires() {
    return [ImageTransformEditing];
  }
  static get pluginName() {
    return "ImageTransformUI";
  }
  init() {
    const editor = this.editor;
    const transforms = editor.config.get("transforms");
    const command = editor.commands.get("transformImage");
    this.bind("isEnabled").to(command);
    this._registerImageTransformDropdown(transforms);
  }
  /**
   * A helper function that creates a dropdown component for the plugin containing all the transform options defined in
   * the editor configuration.
   *
   * @param transforms An array of the available image transforms.
   */
  _registerImageTransformDropdown(transforms) {
    const editor = this.editor;
    const t = editor.t;
    const originalSizeOption = {
      name: "transformImage:original",
      value: null
    };
    const options = [
      originalSizeOption,
      ...transforms.map((transform) => ({
        label: transform.name,
        name: `transformImage:${transform.handle}`,
        value: transform.handle
      }))
    ];
    const componentCreator = (locale) => {
      const command = editor.commands.get("transformImage");
      const dropdownView = createDropdown(locale, DropdownButtonView);
      const dropdownButton = dropdownView.buttonView;
      dropdownButton.set({
        tooltip: t("Resize image"),
        commandValue: null,
        icon: RESIZE_ICON,
        isToggleable: true,
        label: this._getOptionLabelValue(originalSizeOption),
        withText: true,
        class: "ck-resize-image-button"
      });
      dropdownButton.bind("label").to(command, "value", (commandValue) => {
        if (!commandValue || !commandValue.transform) {
          return this._getOptionLabelValue(originalSizeOption);
        }
        const transform = transforms.find(
          (t2) => t2.handle === commandValue.transform
        );
        if (transform) {
          return transform.name;
        }
        return commandValue.transform;
      });
      dropdownView.bind("isEnabled").to(this);
      addListToDropdown(
        dropdownView,
        () => this._getTransformDropdownListItemDefinitions(options, command),
        {
          ariaLabel: t("Image resize list")
        }
      );
      this.listenTo(dropdownView, "execute", (evt) => {
        editor.execute(evt.source.commandName, {
          transform: evt.source.commandValue
        });
        editor.editing.view.focus();
      });
      return dropdownView;
    };
    editor.ui.componentFactory.add("transformImage", componentCreator);
  }
  /**
   * A helper function for creating an option label value string.
   *
   * @param option A transform option object.
   * @returns The option label.
   */
  _getOptionLabelValue(option) {
    return option.label || option.value || this.editor.t("Original");
  }
  /**
   * A helper function that parses the transform options and returns list item definitions ready for use in the dropdown.
   *
   * @param options The transform options.
   * @param command The transform image command.
   * @returns Dropdown item definitions.
   */
  _getTransformDropdownListItemDefinitions(options, command) {
    const itemDefinitions = new Collection();
    options.map((option) => {
      const definition = {
        type: "button",
        model: new ViewModel({
          commandName: "transformImage",
          commandValue: option.value,
          label: this._getOptionLabelValue(option),
          withText: true,
          icon: null
        })
      };
      definition.model.bind("isOn").to(command, "value", getIsOnButtonCallback(option.value));
      itemDefinitions.add(definition);
    });
    return itemDefinitions;
  }
}
function getIsOnButtonCallback(value) {
  return (commandValue) => {
    const objectCommandValue = commandValue;
    if (value === null && objectCommandValue === value) {
      return true;
    }
    return objectCommandValue !== null && objectCommandValue.transform === value;
  };
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class ImageTransform extends Plugin {
  static get requires() {
    return [ImageTransformEditing, ImageTransformUI];
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
class ImageEditorCommand extends Command {
  refresh() {
    const element = this._element();
    const srcInfo = this._srcInfo(element);
    this.isEnabled = !!srcInfo;
    if (this.isEnabled) {
      let data = {
        assetId: srcInfo.assetId
      };
      Craft.sendActionRequest("POST", "ckeditor/ckeditor/image-permissions", {
        data
      }).then((response) => {
        if (response.data.editable === false) {
          this.isEnabled = false;
        }
      });
    }
  }
  /**
   * Returns the selected image element.
   */
  _element() {
    const editor = this.editor;
    const imageUtils = editor.plugins.get("ImageUtils");
    return imageUtils.getClosestSelectedImageElement(
      editor.model.document.selection
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
  _srcInfo(element) {
    if (!element || !element.hasAttribute("src")) {
      return null;
    }
    const src = element.getAttribute("src");
    const match = src.match(
      /(.*)#asset:(\d+)(?::transform:([a-zA-Z][a-zA-Z0-9_]*))?/
    );
    if (!match) {
      return null;
    }
    return {
      src,
      baseSrc: match[1],
      assetId: match[2],
      transform: match[3]
    };
  }
  /**
   * Executes the command.
   *
   * @fires execute
   */
  execute() {
    const editor = this.editor;
    editor.model;
    const element = this._element();
    const srcInfo = this._srcInfo(element);
    if (srcInfo) {
      let settings = {
        allowSavingAsNew: false,
        // todo: we might want to change that, but currently we're doing the same functionality as in Redactor
        onSave: (data) => {
          this._reloadImage(srcInfo.assetId, data);
        },
        allowDegreeFractions: Craft.isImagick
      };
      new Craft.AssetImageEditor(srcInfo.assetId, settings);
    }
  }
  /**
   * Reloads the matching images after save was triggered from the Image Editor.
   *
   * @param data
   */
  _reloadImage(assetId, data) {
    let editor = this.editor;
    let model = editor.model;
    let images = this._getAllImageAssets();
    images.forEach((image) => {
      if (image.srcInfo.assetId == assetId) {
        if (!image.srcInfo.transform) {
          let newSrc = image.srcInfo.baseSrc + "?" + (/* @__PURE__ */ new Date()).getTime() + "#asset:" + image.srcInfo.assetId;
          model.change((writer) => {
            writer.setAttribute("src", newSrc, image.element);
          });
        } else {
          let data2 = {
            assetId: image.srcInfo.assetId,
            handle: image.srcInfo.transform
          };
          Craft.sendActionRequest("POST", "assets/generate-transform", {
            data: data2
          }).then((response) => {
            let newSrc = response.data.url + "?" + (/* @__PURE__ */ new Date()).getTime() + "#asset:" + image.srcInfo.assetId + ":transform:" + image.srcInfo.transform;
            model.change((writer) => {
              writer.setAttribute("src", newSrc, image.element);
            });
          });
        }
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
    const editor = this.editor;
    const model = editor.model;
    const range = model.createRangeIn(model.document.getRoot());
    let images = [];
    for (const value of range.getWalker({ ignoreElementEnd: true })) {
      if (value.item.is("element") && value.item.name === "imageBlock") {
        let srcInfo = this._srcInfo(value.item);
        if (srcInfo) {
          images.push({
            element: value.item,
            srcInfo
          });
        }
      }
    }
    return images;
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class ImageEditorEditing extends Plugin {
  static get requires() {
    return [ImageUtils];
  }
  static get pluginName() {
    return "ImageEditorEditing";
  }
  init() {
    const editor = this.editor;
    const imageEditorCommand = new ImageEditorCommand(editor);
    editor.commands.add("imageEditor", imageEditorCommand);
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class ImageEditorUI extends Plugin {
  static get requires() {
    return [ImageEditorEditing];
  }
  static get pluginName() {
    return "ImageEditorUI";
  }
  init() {
    const editor = this.editor;
    const command = editor.commands.get("imageEditor");
    this.bind("isEnabled").to(command);
    this._registerImageEditorButton();
  }
  /**
   * A helper function that creates a button component for the plugin that triggers launch of the Image Editor.
   */
  _registerImageEditorButton() {
    const editor = this.editor;
    const t = editor.t;
    const command = editor.commands.get("imageEditor");
    const componentCreator = () => {
      const buttonView = new ButtonView();
      buttonView.set({
        label: t("Edit Image"),
        withText: true
      });
      buttonView.bind("isEnabled").to(command);
      this.listenTo(buttonView, "execute", (evt) => {
        editor.execute("imageEditor");
        editor.editing.view.focus();
      });
      return buttonView;
    };
    editor.ui.componentFactory.add("imageEditor", componentCreator);
  }
}
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
class ImageEditor extends Plugin {
  static get requires() {
    return [ImageEditorEditing, ImageEditorUI];
  }
  static get pluginName() {
    return "ImageEditor";
  }
}
class CraftEntriesCommand extends Command {
  execute(options) {
    const editor = this.editor;
    const selection = editor.model.document.selection;
    editor.model.change((writer) => {
      const craftEntries = writer.createElement("craftEntryModel", {
        ...Object.fromEntries(selection.getAttributes()),
        cardHtml: options.cardHtml,
        entryId: options.entryId,
        siteId: options.siteId
      });
      editor.model.insertObject(craftEntries, null, null, {
        setSelection: "after"
      });
    });
  }
  refresh() {
    const model = this.editor.model;
    const selection = model.document.selection;
    const hasSelection = !selection.isCollapsed && selection.getFirstRange();
    this.isEnabled = !hasSelection;
  }
}
class CraftEntriesEditing extends Plugin {
  /**
   * @inheritDoc
   */
  static get requires() {
    return [Widget];
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
    this._defineSchema();
    this._defineConverters();
    const editor = this.editor;
    editor.commands.add("insertEntry", new CraftEntriesCommand(editor));
    editor.editing.mapper.on(
      "viewToModelPosition",
      viewToModelPositionOutsideModelElement(editor.model, (viewElement) => {
        viewElement.hasClass("cke-entry-card");
      })
    );
  }
  /**
   * Defines model schema for our widget.
   * @private
   */
  _defineSchema() {
    const schema = this.editor.model.schema;
    schema.register("craftEntryModel", {
      inheritAllFrom: "$blockObject",
      allowAttributes: ["cardHtml", "entryId", "siteId"],
      allowChildren: false
    });
  }
  /**
   * Defines conversion methods for model and both editing and data views.
   * @private
   */
  _defineConverters() {
    const conversion = this.editor.conversion;
    conversion.for("upcast").elementToElement({
      view: {
        name: "craft-entry"
        // has to be lower case
      },
      model: (viewElement, { writer: modelWriter }) => {
        const cardHtml = viewElement.getAttribute("data-card-html");
        const entryId = viewElement.getAttribute("data-entry-id");
        const siteId = viewElement.getAttribute("data-site-id") ?? null;
        return modelWriter.createElement("craftEntryModel", {
          cardHtml,
          entryId,
          siteId
        });
      }
    });
    conversion.for("editingDowncast").elementToElement({
      model: "craftEntryModel",
      view: (modelItem, { writer: viewWriter }) => {
        const entryId = modelItem.getAttribute("entryId") ?? null;
        const siteId = modelItem.getAttribute("siteId") ?? null;
        const cardContainer = viewWriter.createContainerElement("div", {
          class: "cke-entry-card",
          "data-entry-id": entryId,
          "data-site-id": siteId
        });
        addCardHtmlToContainer(modelItem, viewWriter, cardContainer);
        return toWidget(cardContainer, viewWriter);
      }
    });
    conversion.for("dataDowncast").elementToElement({
      model: "craftEntryModel",
      view: (modelItem, { writer: viewWriter }) => {
        const entryId = modelItem.getAttribute("entryId") ?? null;
        const siteId = modelItem.getAttribute("siteId") ?? null;
        return viewWriter.createContainerElement("craft-entry", {
          "data-entry-id": entryId,
          "data-site-id": siteId
        });
      }
    });
    const addCardHtmlToContainer = (modelItem, viewWriter, cardContainer) => {
      this._getCardHtml(modelItem).then((data) => {
        const card = viewWriter.createRawElement(
          "div",
          null,
          function(domElement) {
            domElement.innerHTML = data.cardHtml;
            Craft.appendHeadHtml(data.headHtml);
            Craft.appendBodyHtml(data.bodyHtml);
          }
        );
        viewWriter.insert(viewWriter.createPositionAt(cardContainer, 0), card);
        const editor = this.editor;
        editor.editing.view.focus();
        setTimeout(() => {
          Craft.cp.elementThumbLoader.load($(editor.ui.element));
        }, 100);
        editor.model.change((writer) => {
          editor.ui.update();
          $(editor.sourceElement).trigger("keyup");
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
  async _getCardHtml(modelItem) {
    var _a, _b, _c;
    let cardHtml = modelItem.getAttribute("cardHtml") ?? null;
    let parents = $(this.editor.sourceElement).parents(".field");
    const layoutElementUid = $(parents[0]).data("layout-element");
    if (cardHtml) {
      return { cardHtml };
    }
    const entryId = modelItem.getAttribute("entryId") ?? null;
    const siteId = modelItem.getAttribute("siteId") ?? null;
    try {
      const editor = this.editor;
      const $editorContainer = $(editor.ui.view.element).closest(
        "form,.lp-editor-container"
      );
      const elementEditor = $editorContainer.data("elementEditor");
      if (elementEditor) {
        await elementEditor.checkForm();
      }
      const { data } = await Craft.sendActionRequest(
        "POST",
        "ckeditor/ckeditor/entry-card-html",
        {
          data: {
            entryId,
            siteId,
            layoutElementUid
          }
        }
      );
      return data;
    } catch (e) {
      console.error((_a = e == null ? void 0 : e.response) == null ? void 0 : _a.data);
      const cardHtml2 = '<div class="element card"><div class="card-content"><div class="card-heading"><div class="label error"><span>' + (((_c = (_b = e == null ? void 0 : e.response) == null ? void 0 : _b.data) == null ? void 0 : _c.message) || "An unknown error occurred.") + "</span></div></div></div></div>";
      return { cardHtml: cardHtml2 };
    }
  }
}
class DoubleClickObserver extends DomEventObserver {
  constructor(view) {
    super(view);
    this.domEventType = "dblclick";
  }
  onDomEvent(domEvent) {
    this.fire(domEvent.type, domEvent);
  }
}
class CraftEntriesUI extends Plugin {
  /**
   * @inheritDoc
   */
  static get requires() {
    return [WidgetToolbarRepository];
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
    this.editor.ui.componentFactory.add("createEntry", (locale) => {
      return this._createToolbarEntriesButton(locale);
    });
    this.editor.ui.componentFactory.add("editEntryBtn", (locale) => {
      return this._createEditEntryBtn(locale);
    });
    this._listenToEvents();
  }
  /**
   * @inheritDoc
   */
  afterInit() {
    const widgetToolbarRepository = this.editor.plugins.get(
      WidgetToolbarRepository
    );
    widgetToolbarRepository.register("entriesBalloon", {
      ariaLabel: Craft.t("ckeditor", "Entry toolbar"),
      // Toolbar Buttons
      items: ["editEntryBtn"],
      // If a related element is returned the toolbar is attached
      getRelatedElement: (selection) => {
        const viewElement = selection.getSelectedElement();
        if (viewElement && isWidget(viewElement) && viewElement.hasClass("cke-entry-card")) {
          return viewElement;
        }
        return null;
      }
    });
  }
  /**
   * Hook up event listeners
   *
   * @private
   */
  _listenToEvents() {
    const view = this.editor.editing.view;
    const viewDocument = view.document;
    view.addObserver(DoubleClickObserver);
    this.editor.listenTo(viewDocument, "dblclick", (evt, data) => {
      const modelElement = this.editor.editing.mapper.toModelElement(
        data.target.parent
      );
      if (modelElement.name === "craftEntryModel") {
        this._initEditEntrySlideout(data, modelElement);
      }
    });
  }
  _initEditEntrySlideout(data = null, modelElement = null) {
    if (modelElement === null) {
      const selection = this.editor.model.document.selection;
      modelElement = selection.getSelectedElement();
    }
    const entryId = modelElement.getAttribute("entryId");
    const siteId = modelElement.getAttribute("siteId") ?? null;
    this._showEditEntrySlideout(entryId, siteId, modelElement);
  }
  /**
   * Creates a toolbar button that allows for an entry to be inserted into the editor
   *
   * @param locale
   * @private
   */
  _createToolbarEntriesButton(locale) {
    const editor = this.editor;
    const entryTypeOptions = editor.config.get("entryTypeOptions");
    const insertEntryCommand = editor.commands.get("insertEntry");
    if (!entryTypeOptions || !entryTypeOptions.length) {
      return;
    }
    const dropdownView = createDropdown(locale);
    dropdownView.buttonView.set({
      label: editor.config.get("createButtonLabel") || Craft.t("app", "New {type}", {
        type: Craft.t("app", "entry")
      }),
      tooltip: true,
      withText: true
      //commandValue: null,
    });
    dropdownView.bind("isEnabled").to(insertEntryCommand);
    addListToDropdown(
      dropdownView,
      () => this._getDropdownItemsDefinitions(entryTypeOptions, insertEntryCommand),
      {
        ariaLabel: Craft.t("ckeditor", "Entry types list")
      }
    );
    this.listenTo(dropdownView, "execute", (evt) => {
      this._showCreateEntrySlideout(evt.source.commandValue);
    });
    return dropdownView;
  }
  /**
   * Creates a list of entry type options that go into the insert entry button
   *
   * @param options
   * @param command
   * @returns {Collection<Record<string, any>>}
   * @private
   */
  _getDropdownItemsDefinitions(options, command) {
    const itemDefinitions = new Collection();
    options.map((option) => {
      const definition = {
        type: "button",
        model: new ViewModel({
          commandValue: option.value,
          //entry type id
          label: option.label || option.value,
          icon: option.icon,
          withText: true
        })
      };
      itemDefinitions.add(definition);
    });
    return itemDefinitions;
  }
  /**
   * Creates an edit entry button that shows in the contextual balloon for each craft entry widget
   * @param locale
   * @returns {ButtonView}
   * @private
   */
  _createEditEntryBtn(locale) {
    const button = new ButtonView(locale);
    button.set({
      isEnabled: true,
      label: Craft.t("app", "Edit {type}", {
        type: Craft.elementTypeNames["craft\\elements\\Entry"][2]
      }),
      tooltip: true,
      withText: true
    });
    this.listenTo(button, "execute", (evt) => {
      this._initEditEntrySlideout();
    });
    return button;
  }
  /**
   * Returns Craft.ElementEditor instance that the CKEditor field belongs to.
   *
   * @returns {*}
   */
  getElementEditor() {
    const $editorContainer = $(this.editor.ui.view.element).closest(
      "form,.lp-editor-container"
    );
    const elementEditor = $editorContainer.data("elementEditor");
    return elementEditor;
  }
  /**
   * Returns HTML of the card by the entry ID.
   *
   * @param entryId
   * @returns {*}
   * @private
   */
  _getCardElement(entryId) {
    let $container = $(this.editor.ui.element);
    return $container.find('.element.card[data-id="' + entryId + '"]');
  }
  /**
   * Opens an element editor for existing entry
   *
   * @param entryId
   * @private
   */
  _showEditEntrySlideout(entryId, siteId, modelElement) {
    const editor = this.editor;
    const elementEditor = this.getElementEditor();
    let $element = this._getCardElement(entryId);
    const ownerId = $element.data("owner-id");
    const slideout = Craft.createElementEditor(this.elementType, null, {
      elementId: entryId,
      params: {
        siteId
      },
      onBeforeSubmit: async () => {
        if ($element !== null && Garnish.hasAttr($element, "data-owner-is-canonical") && !elementEditor.settings.isUnpublishedDraft) {
          await slideout.elementEditor.checkForm(true, true);
          let baseInputName = $(editor.sourceElement).attr("name");
          if (elementEditor && baseInputName) {
            await elementEditor.setFormValue(baseInputName, "*");
          }
          if (elementEditor.settings.draftId && slideout.elementEditor.settings.draftId) {
            if (!slideout.elementEditor.settings.saveParams) {
              slideout.elementEditor.settings.saveParams = {};
            }
            slideout.elementEditor.settings.saveParams.action = "elements/save-nested-element-for-derivative";
            slideout.elementEditor.settings.saveParams.newOwnerId = elementEditor.getDraftElementId(ownerId);
          }
        }
      },
      onSubmit: (ev) => {
        let $element2 = this._getCardElement(entryId);
        if ($element2 !== null && ev.data.id != $element2.data("id")) {
          $element2.attr("data-id", ev.data.id).data("id", ev.data.id).data("owner-id", ev.data.ownerId);
          editor.editing.model.change((writer) => {
            writer.setAttribute("entryId", ev.data.id, modelElement);
            editor.ui.update();
          });
          Craft.refreshElementInstances(ev.data.id);
        }
      }
    });
  }
  /**
   * Creates new entry and opens the element editor for it
   *
   * @param entryTypeId
   * @private
   */
  async _showCreateEntrySlideout(entryTypeId) {
    var _a, _b;
    const editor = this.editor;
    const nestedElementAttributes = editor.config.get(
      "nestedElementAttributes"
    );
    const params = Object.assign({}, nestedElementAttributes, {
      typeId: entryTypeId
    });
    const elementEditor = this.getElementEditor();
    if (elementEditor) {
      await elementEditor.markDeltaNameAsModified(editor.sourceElement.name);
      params.ownerId = elementEditor.getDraftElementId(
        nestedElementAttributes.ownerId
      );
    }
    let data;
    try {
      const response = await Craft.sendActionRequest(
        "POST",
        "elements/create",
        {
          data: params
        }
      );
      data = response.data;
    } catch (e) {
      Craft.cp.displayError((_b = (_a = e == null ? void 0 : e.response) == null ? void 0 : _a.data) == null ? void 0 : _b.error);
      throw e;
    }
    const slideout = Craft.createElementEditor(this.elementType, {
      elementId: data.element.id,
      draftId: data.element.draftId,
      params: {
        fresh: 1,
        siteId: data.element.siteId
      }
    });
    slideout.on("submit", (ev) => {
      editor.commands.execute("insertEntry", {
        entryId: ev.data.id,
        siteId: ev.data.siteId
      });
    });
  }
}
class CraftEntries extends Plugin {
  static get requires() {
    return [CraftEntriesEditing, CraftEntriesUI];
  }
  static get pluginName() {
    return "CraftEntries";
  }
}
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var inspector = { exports: {} };
/*! For license information please see inspector.js.LICENSE.txt */
var hasRequiredInspector;
function requireInspector() {
  if (hasRequiredInspector) return inspector.exports;
  hasRequiredInspector = 1;
  (function(module, exports) {
    !function(e, t) {
      module.exports = t();
    }(window, function() {
      return function(e) {
        var t = {};
        function n(r) {
          if (t[r]) return t[r].exports;
          var o = t[r] = { i: r, l: false, exports: {} };
          return e[r].call(o.exports, o, o.exports, n), o.l = true, o.exports;
        }
        return n.m = e, n.c = t, n.d = function(e2, t2, r) {
          n.o(e2, t2) || Object.defineProperty(e2, t2, { enumerable: true, get: r });
        }, n.r = function(e2) {
          "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(e2, Symbol.toStringTag, { value: "Module" }), Object.defineProperty(e2, "__esModule", { value: true });
        }, n.t = function(e2, t2) {
          if (1 & t2 && (e2 = n(e2)), 8 & t2) return e2;
          if (4 & t2 && "object" == typeof e2 && e2 && e2.__esModule) return e2;
          var r = /* @__PURE__ */ Object.create(null);
          if (n.r(r), Object.defineProperty(r, "default", { enumerable: true, value: e2 }), 2 & t2 && "string" != typeof e2) for (var o in e2) n.d(r, o, (function(t3) {
            return e2[t3];
          }).bind(null, o));
          return r;
        }, n.n = function(e2) {
          var t2 = e2 && e2.__esModule ? function() {
            return e2.default;
          } : function() {
            return e2;
          };
          return n.d(t2, "a", t2), t2;
        }, n.o = function(e2, t2) {
          return Object.prototype.hasOwnProperty.call(e2, t2);
        }, n.p = "", n(n.s = 94);
      }([function(e, t, n) {
        e.exports = n(21);
      }, function(e, t, n) {
        n.d(t, "a", function() {
          return o;
        }), n.d(t, "b", function() {
          return i;
        }), n.d(t, "c", function() {
          return a;
        });
        var r = n(19);
        function o(e2, t2 = true) {
          if (void 0 === e2) return "undefined";
          if ("function" == typeof e2) return "function() {…}";
          const n2 = Object(r.stringify)(e2, s, null, { maxDepth: 2 });
          return t2 ? n2 : n2.replace(/(^"|"$)/g, "");
        }
        function i(e2) {
          const t2 = {};
          for (const n2 in e2) t2[n2] = e2[n2], t2[n2].value = o(t2[n2].value);
          return t2;
        }
        function a(e2, t2) {
          return e2.length > t2 ? e2.substr(0, t2) + `… [${e2.length - t2} characters left]` : e2;
        }
        function s(e2, t2, n2) {
          return "string" == typeof e2 ? `"${e2.replace("'", '"')}"` : n2(e2);
        }
      }, function(e, t, n) {
        function r(e2) {
          return e2 && e2.name;
        }
        function o(e2) {
          return e2 && r(e2) && e2.is("attributeElement");
        }
        function i(e2) {
          return e2 && r(e2) && e2.is("emptyElement");
        }
        function a(e2) {
          return e2 && r(e2) && e2.is("uiElement");
        }
        function s(e2) {
          return e2 && r(e2) && e2.is("rawElement");
        }
        function l(e2) {
          return e2 && r(e2) && e2.is("editableElement");
        }
        function c(e2) {
          return e2 && e2.is("rootElement");
        }
        function u(e2) {
          return { path: [...e2.parent.getPath(), e2.offset], offset: e2.offset, isAtEnd: e2.isAtEnd, isAtStart: e2.isAtStart, parent: p(e2.parent) };
        }
        function p(e2) {
          return r(e2) ? o(e2) ? "attribute:" + e2.name : c(e2) ? "root:" + e2.name : "container:" + e2.name : e2.data;
        }
        n.d(t, "d", function() {
          return r;
        }), n.d(t, "b", function() {
          return o;
        }), n.d(t, "e", function() {
          return i;
        }), n.d(t, "h", function() {
          return a;
        }), n.d(t, "f", function() {
          return s;
        }), n.d(t, "c", function() {
          return l;
        }), n.d(t, "g", function() {
          return c;
        }), n.d(t, "a", function() {
          return u;
        });
      }, function(e, t, n) {
        n.d(t, "a", function() {
          return r;
        });
        class r {
          static group(...e2) {
            console.group(...e2);
          }
          static groupEnd(...e2) {
            console.groupEnd(...e2);
          }
          static log(...e2) {
            console.log(...e2);
          }
          static warn(...e2) {
            console.warn(...e2);
          }
        }
      }, function(e, t, n) {
        function r(e2) {
          return e2 && e2.is("element");
        }
        function o(e2) {
          return e2 && e2.is("rootElement");
        }
        function i(e2) {
          return e2.getPath ? e2.getPath() : e2.path;
        }
        function a(e2) {
          return { path: i(e2), stickiness: e2.stickiness, index: e2.index, isAtEnd: e2.isAtEnd, isAtStart: e2.isAtStart, offset: e2.offset, textNode: e2.textNode && e2.textNode.data };
        }
        n.d(t, "c", function() {
          return r;
        }), n.d(t, "d", function() {
          return o;
        }), n.d(t, "b", function() {
          return i;
        }), n.d(t, "a", function() {
          return a;
        });
      }, function(e, t, n) {
        (function(e2, n2) {
          var r = "[object Arguments]", o = "[object Map]", i = "[object Object]", a = "[object Set]", s = /^\[object .+?Constructor\]$/, l = /^(?:0|[1-9]\d*)$/, c = {};
          c["[object Float32Array]"] = c["[object Float64Array]"] = c["[object Int8Array]"] = c["[object Int16Array]"] = c["[object Int32Array]"] = c["[object Uint8Array]"] = c["[object Uint8ClampedArray]"] = c["[object Uint16Array]"] = c["[object Uint32Array]"] = true, c[r] = c["[object Array]"] = c["[object ArrayBuffer]"] = c["[object Boolean]"] = c["[object DataView]"] = c["[object Date]"] = c["[object Error]"] = c["[object Function]"] = c[o] = c["[object Number]"] = c[i] = c["[object RegExp]"] = c[a] = c["[object String]"] = c["[object WeakMap]"] = false;
          var u = "object" == typeof e2 && e2 && e2.Object === Object && e2, p = "object" == typeof self && self && self.Object === Object && self, f = u || p || Function("return this")(), d = t && !t.nodeType && t, h = d && "object" == typeof n2 && n2 && !n2.nodeType && n2, m = h && h.exports === d, g = m && u.process, y = function() {
            try {
              return g && g.binding && g.binding("util");
            } catch (e3) {
            }
          }(), b = y && y.isTypedArray;
          function v(e3, t2) {
            for (var n3 = -1, r2 = null == e3 ? 0 : e3.length; ++n3 < r2; ) if (t2(e3[n3], n3, e3)) return true;
            return false;
          }
          function k(e3) {
            var t2 = -1, n3 = Array(e3.size);
            return e3.forEach(function(e4, r2) {
              n3[++t2] = [r2, e4];
            }), n3;
          }
          function w(e3) {
            var t2 = -1, n3 = Array(e3.size);
            return e3.forEach(function(e4) {
              n3[++t2] = e4;
            }), n3;
          }
          var _, E, x, S = Array.prototype, C = Function.prototype, T = Object.prototype, O = f["__core-js_shared__"], N = C.toString, P = T.hasOwnProperty, D = (_ = /[^.]+$/.exec(O && O.keys && O.keys.IE_PROTO || "")) ? "Symbol(src)_1." + _ : "", R = T.toString, M = RegExp("^" + N.call(P).replace(/[\\^$.*+?()[\]{}|]/g, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"), j = m ? f.Buffer : void 0, A = f.Symbol, z = f.Uint8Array, L = T.propertyIsEnumerable, I = S.splice, U = A ? A.toStringTag : void 0, F = Object.getOwnPropertySymbols, B = j ? j.isBuffer : void 0, W = (E = Object.keys, x = Object, function(e3) {
            return E(x(e3));
          }), H = ye(f, "DataView"), V = ye(f, "Map"), $2 = ye(f, "Promise"), q = ye(f, "Set"), Y = ye(f, "WeakMap"), K = ye(Object, "create"), Q = we(H), G = we(V), X = we($2), J = we(q), Z = we(Y), ee = A ? A.prototype : void 0, te = ee ? ee.valueOf : void 0;
          function ne(e3) {
            var t2 = -1, n3 = null == e3 ? 0 : e3.length;
            for (this.clear(); ++t2 < n3; ) {
              var r2 = e3[t2];
              this.set(r2[0], r2[1]);
            }
          }
          function re(e3) {
            var t2 = -1, n3 = null == e3 ? 0 : e3.length;
            for (this.clear(); ++t2 < n3; ) {
              var r2 = e3[t2];
              this.set(r2[0], r2[1]);
            }
          }
          function oe(e3) {
            var t2 = -1, n3 = null == e3 ? 0 : e3.length;
            for (this.clear(); ++t2 < n3; ) {
              var r2 = e3[t2];
              this.set(r2[0], r2[1]);
            }
          }
          function ie(e3) {
            var t2 = -1, n3 = null == e3 ? 0 : e3.length;
            for (this.__data__ = new oe(); ++t2 < n3; ) this.add(e3[t2]);
          }
          function ae(e3) {
            var t2 = this.__data__ = new re(e3);
            this.size = t2.size;
          }
          function se(e3, t2) {
            var n3 = xe(e3), r2 = !n3 && Ee(e3), o2 = !n3 && !r2 && Se(e3), i2 = !n3 && !r2 && !o2 && Pe(e3), a2 = n3 || r2 || o2 || i2, s2 = a2 ? function(e4, t3) {
              for (var n4 = -1, r3 = Array(e4); ++n4 < e4; ) r3[n4] = t3(n4);
              return r3;
            }(e3.length, String) : [], l2 = s2.length;
            for (var c2 in e3) !P.call(e3, c2) || a2 && ("length" == c2 || o2 && ("offset" == c2 || "parent" == c2) || i2 && ("buffer" == c2 || "byteLength" == c2 || "byteOffset" == c2) || ke(c2, l2)) || s2.push(c2);
            return s2;
          }
          function le(e3, t2) {
            for (var n3 = e3.length; n3--; ) if (_e(e3[n3][0], t2)) return n3;
            return -1;
          }
          function ce(e3) {
            return null == e3 ? void 0 === e3 ? "[object Undefined]" : "[object Null]" : U && U in Object(e3) ? function(e4) {
              var t2 = P.call(e4, U), n3 = e4[U];
              try {
                e4[U] = void 0;
                var r2 = true;
              } catch (e5) {
              }
              var o2 = R.call(e4);
              r2 && (t2 ? e4[U] = n3 : delete e4[U]);
              return o2;
            }(e3) : function(e4) {
              return R.call(e4);
            }(e3);
          }
          function ue(e3) {
            return Ne(e3) && ce(e3) == r;
          }
          function pe(e3, t2, n3, s2, l2) {
            return e3 === t2 || (null == e3 || null == t2 || !Ne(e3) && !Ne(t2) ? e3 != e3 && t2 != t2 : function(e4, t3, n4, s3, l3, c2) {
              var u2 = xe(e4), p2 = xe(t3), f2 = u2 ? "[object Array]" : ve(e4), d2 = p2 ? "[object Array]" : ve(t3), h2 = (f2 = f2 == r ? i : f2) == i, m2 = (d2 = d2 == r ? i : d2) == i, g2 = f2 == d2;
              if (g2 && Se(e4)) {
                if (!Se(t3)) return false;
                u2 = true, h2 = false;
              }
              if (g2 && !h2) return c2 || (c2 = new ae()), u2 || Pe(e4) ? he(e4, t3, n4, s3, l3, c2) : function(e5, t4, n5, r2, i2, s4, l4) {
                switch (n5) {
                  case "[object DataView]":
                    if (e5.byteLength != t4.byteLength || e5.byteOffset != t4.byteOffset) return false;
                    e5 = e5.buffer, t4 = t4.buffer;
                  case "[object ArrayBuffer]":
                    return !(e5.byteLength != t4.byteLength || !s4(new z(e5), new z(t4)));
                  case "[object Boolean]":
                  case "[object Date]":
                  case "[object Number]":
                    return _e(+e5, +t4);
                  case "[object Error]":
                    return e5.name == t4.name && e5.message == t4.message;
                  case "[object RegExp]":
                  case "[object String]":
                    return e5 == t4 + "";
                  case o:
                    var c3 = k;
                  case a:
                    var u3 = 1 & r2;
                    if (c3 || (c3 = w), e5.size != t4.size && !u3) return false;
                    var p3 = l4.get(e5);
                    if (p3) return p3 == t4;
                    r2 |= 2, l4.set(e5, t4);
                    var f3 = he(c3(e5), c3(t4), r2, i2, s4, l4);
                    return l4.delete(e5), f3;
                  case "[object Symbol]":
                    if (te) return te.call(e5) == te.call(t4);
                }
                return false;
              }(e4, t3, f2, n4, s3, l3, c2);
              if (!(1 & n4)) {
                var y2 = h2 && P.call(e4, "__wrapped__"), b2 = m2 && P.call(t3, "__wrapped__");
                if (y2 || b2) {
                  var v2 = y2 ? e4.value() : e4, _2 = b2 ? t3.value() : t3;
                  return c2 || (c2 = new ae()), l3(v2, _2, n4, s3, c2);
                }
              }
              if (!g2) return false;
              return c2 || (c2 = new ae()), function(e5, t4, n5, r2, o2, i2) {
                var a2 = 1 & n5, s4 = me(e5), l4 = s4.length, c3 = me(t4).length;
                if (l4 != c3 && !a2) return false;
                var u3 = l4;
                for (; u3--; ) {
                  var p3 = s4[u3];
                  if (!(a2 ? p3 in t4 : P.call(t4, p3))) return false;
                }
                var f3 = i2.get(e5);
                if (f3 && i2.get(t4)) return f3 == t4;
                var d3 = true;
                i2.set(e5, t4), i2.set(t4, e5);
                var h3 = a2;
                for (; ++u3 < l4; ) {
                  p3 = s4[u3];
                  var m3 = e5[p3], g3 = t4[p3];
                  if (r2) var y3 = a2 ? r2(g3, m3, p3, t4, e5, i2) : r2(m3, g3, p3, e5, t4, i2);
                  if (!(void 0 === y3 ? m3 === g3 || o2(m3, g3, n5, r2, i2) : y3)) {
                    d3 = false;
                    break;
                  }
                  h3 || (h3 = "constructor" == p3);
                }
                if (d3 && !h3) {
                  var b3 = e5.constructor, v3 = t4.constructor;
                  b3 == v3 || !("constructor" in e5) || !("constructor" in t4) || "function" == typeof b3 && b3 instanceof b3 && "function" == typeof v3 && v3 instanceof v3 || (d3 = false);
                }
                return i2.delete(e5), i2.delete(t4), d3;
              }(e4, t3, n4, s3, l3, c2);
            }(e3, t2, n3, s2, pe, l2));
          }
          function fe(e3) {
            return !(!Oe(e3) || function(e4) {
              return !!D && D in e4;
            }(e3)) && (Ce(e3) ? M : s).test(we(e3));
          }
          function de(e3) {
            if (n3 = (t2 = e3) && t2.constructor, r2 = "function" == typeof n3 && n3.prototype || T, t2 !== r2) return W(e3);
            var t2, n3, r2, o2 = [];
            for (var i2 in Object(e3)) P.call(e3, i2) && "constructor" != i2 && o2.push(i2);
            return o2;
          }
          function he(e3, t2, n3, r2, o2, i2) {
            var a2 = 1 & n3, s2 = e3.length, l2 = t2.length;
            if (s2 != l2 && !(a2 && l2 > s2)) return false;
            var c2 = i2.get(e3);
            if (c2 && i2.get(t2)) return c2 == t2;
            var u2 = -1, p2 = true, f2 = 2 & n3 ? new ie() : void 0;
            for (i2.set(e3, t2), i2.set(t2, e3); ++u2 < s2; ) {
              var d2 = e3[u2], h2 = t2[u2];
              if (r2) var m2 = a2 ? r2(h2, d2, u2, t2, e3, i2) : r2(d2, h2, u2, e3, t2, i2);
              if (void 0 !== m2) {
                if (m2) continue;
                p2 = false;
                break;
              }
              if (f2) {
                if (!v(t2, function(e4, t3) {
                  if (a3 = t3, !f2.has(a3) && (d2 === e4 || o2(d2, e4, n3, r2, i2))) return f2.push(t3);
                  var a3;
                })) {
                  p2 = false;
                  break;
                }
              } else if (d2 !== h2 && !o2(d2, h2, n3, r2, i2)) {
                p2 = false;
                break;
              }
            }
            return i2.delete(e3), i2.delete(t2), p2;
          }
          function me(e3) {
            return function(e4, t2, n3) {
              var r2 = t2(e4);
              return xe(e4) ? r2 : function(e5, t3) {
                for (var n4 = -1, r3 = t3.length, o2 = e5.length; ++n4 < r3; ) e5[o2 + n4] = t3[n4];
                return e5;
              }(r2, n3(e4));
            }(e3, De, be);
          }
          function ge(e3, t2) {
            var n3, r2, o2 = e3.__data__;
            return ("string" == (r2 = typeof (n3 = t2)) || "number" == r2 || "symbol" == r2 || "boolean" == r2 ? "__proto__" !== n3 : null === n3) ? o2["string" == typeof t2 ? "string" : "hash"] : o2.map;
          }
          function ye(e3, t2) {
            var n3 = function(e4, t3) {
              return null == e4 ? void 0 : e4[t3];
            }(e3, t2);
            return fe(n3) ? n3 : void 0;
          }
          ne.prototype.clear = function() {
            this.__data__ = K ? K(null) : {}, this.size = 0;
          }, ne.prototype.delete = function(e3) {
            var t2 = this.has(e3) && delete this.__data__[e3];
            return this.size -= t2 ? 1 : 0, t2;
          }, ne.prototype.get = function(e3) {
            var t2 = this.__data__;
            if (K) {
              var n3 = t2[e3];
              return "__lodash_hash_undefined__" === n3 ? void 0 : n3;
            }
            return P.call(t2, e3) ? t2[e3] : void 0;
          }, ne.prototype.has = function(e3) {
            var t2 = this.__data__;
            return K ? void 0 !== t2[e3] : P.call(t2, e3);
          }, ne.prototype.set = function(e3, t2) {
            var n3 = this.__data__;
            return this.size += this.has(e3) ? 0 : 1, n3[e3] = K && void 0 === t2 ? "__lodash_hash_undefined__" : t2, this;
          }, re.prototype.clear = function() {
            this.__data__ = [], this.size = 0;
          }, re.prototype.delete = function(e3) {
            var t2 = this.__data__, n3 = le(t2, e3);
            return !(n3 < 0) && (n3 == t2.length - 1 ? t2.pop() : I.call(t2, n3, 1), --this.size, true);
          }, re.prototype.get = function(e3) {
            var t2 = this.__data__, n3 = le(t2, e3);
            return n3 < 0 ? void 0 : t2[n3][1];
          }, re.prototype.has = function(e3) {
            return le(this.__data__, e3) > -1;
          }, re.prototype.set = function(e3, t2) {
            var n3 = this.__data__, r2 = le(n3, e3);
            return r2 < 0 ? (++this.size, n3.push([e3, t2])) : n3[r2][1] = t2, this;
          }, oe.prototype.clear = function() {
            this.size = 0, this.__data__ = { hash: new ne(), map: new (V || re)(), string: new ne() };
          }, oe.prototype.delete = function(e3) {
            var t2 = ge(this, e3).delete(e3);
            return this.size -= t2 ? 1 : 0, t2;
          }, oe.prototype.get = function(e3) {
            return ge(this, e3).get(e3);
          }, oe.prototype.has = function(e3) {
            return ge(this, e3).has(e3);
          }, oe.prototype.set = function(e3, t2) {
            var n3 = ge(this, e3), r2 = n3.size;
            return n3.set(e3, t2), this.size += n3.size == r2 ? 0 : 1, this;
          }, ie.prototype.add = ie.prototype.push = function(e3) {
            return this.__data__.set(e3, "__lodash_hash_undefined__"), this;
          }, ie.prototype.has = function(e3) {
            return this.__data__.has(e3);
          }, ae.prototype.clear = function() {
            this.__data__ = new re(), this.size = 0;
          }, ae.prototype.delete = function(e3) {
            var t2 = this.__data__, n3 = t2.delete(e3);
            return this.size = t2.size, n3;
          }, ae.prototype.get = function(e3) {
            return this.__data__.get(e3);
          }, ae.prototype.has = function(e3) {
            return this.__data__.has(e3);
          }, ae.prototype.set = function(e3, t2) {
            var n3 = this.__data__;
            if (n3 instanceof re) {
              var r2 = n3.__data__;
              if (!V || r2.length < 199) return r2.push([e3, t2]), this.size = ++n3.size, this;
              n3 = this.__data__ = new oe(r2);
            }
            return n3.set(e3, t2), this.size = n3.size, this;
          };
          var be = F ? function(e3) {
            return null == e3 ? [] : (e3 = Object(e3), function(e4, t2) {
              for (var n3 = -1, r2 = null == e4 ? 0 : e4.length, o2 = 0, i2 = []; ++n3 < r2; ) {
                var a2 = e4[n3];
                t2(a2, n3, e4) && (i2[o2++] = a2);
              }
              return i2;
            }(F(e3), function(t2) {
              return L.call(e3, t2);
            }));
          } : function() {
            return [];
          }, ve = ce;
          function ke(e3, t2) {
            return !!(t2 = null == t2 ? 9007199254740991 : t2) && ("number" == typeof e3 || l.test(e3)) && e3 > -1 && e3 % 1 == 0 && e3 < t2;
          }
          function we(e3) {
            if (null != e3) {
              try {
                return N.call(e3);
              } catch (e4) {
              }
              try {
                return e3 + "";
              } catch (e4) {
              }
            }
            return "";
          }
          function _e(e3, t2) {
            return e3 === t2 || e3 != e3 && t2 != t2;
          }
          (H && "[object DataView]" != ve(new H(new ArrayBuffer(1))) || V && ve(new V()) != o || $2 && "[object Promise]" != ve($2.resolve()) || q && ve(new q()) != a || Y && "[object WeakMap]" != ve(new Y())) && (ve = function(e3) {
            var t2 = ce(e3), n3 = t2 == i ? e3.constructor : void 0, r2 = n3 ? we(n3) : "";
            if (r2) switch (r2) {
              case Q:
                return "[object DataView]";
              case G:
                return o;
              case X:
                return "[object Promise]";
              case J:
                return a;
              case Z:
                return "[object WeakMap]";
            }
            return t2;
          });
          var Ee = ue(/* @__PURE__ */ function() {
            return arguments;
          }()) ? ue : function(e3) {
            return Ne(e3) && P.call(e3, "callee") && !L.call(e3, "callee");
          }, xe = Array.isArray;
          var Se = B || function() {
            return false;
          };
          function Ce(e3) {
            if (!Oe(e3)) return false;
            var t2 = ce(e3);
            return "[object Function]" == t2 || "[object GeneratorFunction]" == t2 || "[object AsyncFunction]" == t2 || "[object Proxy]" == t2;
          }
          function Te(e3) {
            return "number" == typeof e3 && e3 > -1 && e3 % 1 == 0 && e3 <= 9007199254740991;
          }
          function Oe(e3) {
            var t2 = typeof e3;
            return null != e3 && ("object" == t2 || "function" == t2);
          }
          function Ne(e3) {
            return null != e3 && "object" == typeof e3;
          }
          var Pe = b ? /* @__PURE__ */ function(e3) {
            return function(t2) {
              return e3(t2);
            };
          }(b) : function(e3) {
            return Ne(e3) && Te(e3.length) && !!c[ce(e3)];
          };
          function De(e3) {
            return null != (t2 = e3) && Te(t2.length) && !Ce(t2) ? se(e3) : de(e3);
            var t2;
          }
          n2.exports = function(e3, t2) {
            return pe(e3, t2);
          };
        }).call(this, n(15), n(33)(e));
      }, function(e, t, n) {
        var r, o = function() {
          return void 0 === r && (r = Boolean(window && document && document.all && !window.atob)), r;
        }, i = /* @__PURE__ */ function() {
          var e2 = {};
          return function(t2) {
            if (void 0 === e2[t2]) {
              var n2 = document.querySelector(t2);
              if (window.HTMLIFrameElement && n2 instanceof window.HTMLIFrameElement) try {
                n2 = n2.contentDocument.head;
              } catch (e3) {
                n2 = null;
              }
              e2[t2] = n2;
            }
            return e2[t2];
          };
        }(), a = [];
        function s(e2) {
          for (var t2 = -1, n2 = 0; n2 < a.length; n2++) if (a[n2].identifier === e2) {
            t2 = n2;
            break;
          }
          return t2;
        }
        function l(e2, t2) {
          for (var n2 = {}, r2 = [], o2 = 0; o2 < e2.length; o2++) {
            var i2 = e2[o2], l2 = t2.base ? i2[0] + t2.base : i2[0], c2 = n2[l2] || 0, u2 = "".concat(l2, " ").concat(c2);
            n2[l2] = c2 + 1;
            var p2 = s(u2), f2 = { css: i2[1], media: i2[2], sourceMap: i2[3] };
            -1 !== p2 ? (a[p2].references++, a[p2].updater(f2)) : a.push({ identifier: u2, updater: g(f2, t2), references: 1 }), r2.push(u2);
          }
          return r2;
        }
        function c(e2) {
          var t2 = document.createElement("style"), r2 = e2.attributes || {};
          if (void 0 === r2.nonce) {
            var o2 = n.nc;
            o2 && (r2.nonce = o2);
          }
          if (Object.keys(r2).forEach(function(e3) {
            t2.setAttribute(e3, r2[e3]);
          }), "function" == typeof e2.insert) e2.insert(t2);
          else {
            var a2 = i(e2.insert || "head");
            if (!a2) throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");
            a2.appendChild(t2);
          }
          return t2;
        }
        var u, p = (u = [], function(e2, t2) {
          return u[e2] = t2, u.filter(Boolean).join("\n");
        });
        function f(e2, t2, n2, r2) {
          var o2 = n2 ? "" : r2.media ? "@media ".concat(r2.media, " {").concat(r2.css, "}") : r2.css;
          if (e2.styleSheet) e2.styleSheet.cssText = p(t2, o2);
          else {
            var i2 = document.createTextNode(o2), a2 = e2.childNodes;
            a2[t2] && e2.removeChild(a2[t2]), a2.length ? e2.insertBefore(i2, a2[t2]) : e2.appendChild(i2);
          }
        }
        function d(e2, t2, n2) {
          var r2 = n2.css, o2 = n2.media, i2 = n2.sourceMap;
          if (o2 ? e2.setAttribute("media", o2) : e2.removeAttribute("media"), i2 && "undefined" != typeof btoa && (r2 += "\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(i2)))), " */")), e2.styleSheet) e2.styleSheet.cssText = r2;
          else {
            for (; e2.firstChild; ) e2.removeChild(e2.firstChild);
            e2.appendChild(document.createTextNode(r2));
          }
        }
        var h = null, m = 0;
        function g(e2, t2) {
          var n2, r2, o2;
          if (t2.singleton) {
            var i2 = m++;
            n2 = h || (h = c(t2)), r2 = f.bind(null, n2, i2, false), o2 = f.bind(null, n2, i2, true);
          } else n2 = c(t2), r2 = d.bind(null, n2, t2), o2 = function() {
            !function(e3) {
              if (null === e3.parentNode) return false;
              e3.parentNode.removeChild(e3);
            }(n2);
          };
          return r2(e2), function(t3) {
            if (t3) {
              if (t3.css === e2.css && t3.media === e2.media && t3.sourceMap === e2.sourceMap) return;
              r2(e2 = t3);
            } else o2();
          };
        }
        e.exports = function(e2, t2) {
          (t2 = t2 || {}).singleton || "boolean" == typeof t2.singleton || (t2.singleton = o());
          var n2 = l(e2 = e2 || [], t2);
          return function(e3) {
            if (e3 = e3 || [], "[object Array]" === Object.prototype.toString.call(e3)) {
              for (var r2 = 0; r2 < n2.length; r2++) {
                var o2 = s(n2[r2]);
                a[o2].references--;
              }
              for (var i2 = l(e3, t2), c2 = 0; c2 < n2.length; c2++) {
                var u2 = s(n2[c2]);
                0 === a[u2].references && (a[u2].updater(), a.splice(u2, 1));
              }
              n2 = i2;
            }
          };
        };
      }, function(e, t, n) {
        e.exports = function(e2) {
          var t2 = [];
          return t2.toString = function() {
            return this.map(function(t3) {
              var n2 = function(e3, t4) {
                var n3 = e3[1] || "", r = e3[3];
                if (!r) return n3;
                if (t4 && "function" == typeof btoa) {
                  var o = (a = r, "/*# sourceMappingURL=data:application/json;charset=utf-8;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(a)))) + " */"), i = r.sources.map(function(e4) {
                    return "/*# sourceURL=" + r.sourceRoot + e4 + " */";
                  });
                  return [n3].concat(i).concat([o]).join("\n");
                }
                var a;
                return [n3].join("\n");
              }(t3, e2);
              return t3[2] ? "@media " + t3[2] + "{" + n2 + "}" : n2;
            }).join("");
          }, t2.i = function(e3, n2) {
            "string" == typeof e3 && (e3 = [[null, e3, ""]]);
            for (var r = {}, o = 0; o < this.length; o++) {
              var i = this[o][0];
              null != i && (r[i] = true);
            }
            for (o = 0; o < e3.length; o++) {
              var a = e3[o];
              null != a[0] && r[a[0]] || (n2 && !a[2] ? a[2] = n2 : n2 && (a[2] = "(" + a[2] + ") and (" + n2 + ")"), t2.push(a));
            }
          }, t2;
        };
      }, function(e, t, n) {
        n.d(t, "c", function() {
          return i;
        }), n.d(t, "b", function() {
          return a;
        }), n.d(t, "a", function() {
          return s;
        });
        var r = n(3);
        let o = 0;
        function i(e2) {
          const t2 = { editors: {}, options: {} };
          if ("string" == typeof e2[0]) r.a.warn(`[CKEditorInspector] The CKEditorInspector.attach( '${e2[0]}', editor ) syntax has been deprecated and will be removed in the near future. To pass a name of an editor instance, use CKEditorInspector.attach( { '${e2[0]}': editor } ) instead. Learn more in https://github.com/ckeditor/ckeditor5-inspector/blob/master/README.md.`), t2.editors[e2[0]] = e2[1];
          else {
            if ((n2 = e2[0]).model && n2.editing) t2.editors["editor-" + ++o] = e2[0];
            else for (const n3 in e2[0]) t2.editors[n3] = e2[0][n3];
            t2.options = e2[1] || t2.options;
          }
          var n2;
          return t2;
        }
        function a(e2) {
          return [...e2][0][0] || "";
        }
        function s(e2, t2) {
          const n2 = Math.min(e2.length, t2.length);
          for (let r2 = 0; r2 < n2; r2++) if (e2[r2] != t2[r2]) return r2;
          return e2.length == t2.length ? "same" : e2.length < t2.length ? "prefix" : "extension";
        }
      }, function(e, t, n) {
        n.d(t, "a", function() {
          return a;
        }), n.d(t, "d", function() {
          return c;
        }), n.d(t, "c", function() {
          return u;
        }), n.d(t, "e", function() {
          return p;
        }), n.d(t, "b", function() {
          return f;
        });
        var r = n(2), o = n(8), i = n(1);
        const a = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_view", s = `&lt;!--The View UI element content has been skipped. <a href="${a}_uielement-UIElement.html" target="_blank">Find out why</a>. --&gt;`, l = `&lt;!--The View raw element content has been skipped. <a href="${a}_rawelement-RawElement.html" target="_blank">Find out why</a>. --&gt;`;
        function c(e2) {
          return e2 ? [...e2.editing.view.document.roots] : [];
        }
        function u(e2, t2) {
          if (!e2) return [];
          const n2 = [], o2 = e2.editing.view.document.selection;
          for (const e3 of o2.getRanges()) e3.root.rootName === t2 && n2.push({ type: "selection", start: Object(r.a)(e3.start), end: Object(r.a)(e3.end) });
          return n2;
        }
        function p({ currentEditor: e2, currentRootName: t2, ranges: n2 }) {
          if (!e2 || !t2) return null;
          return [d(e2.editing.view.document.getRoot(t2), [...n2])];
        }
        function f(e2) {
          const t2 = { editorNode: e2, properties: {}, attributes: {}, customProperties: {} };
          if (Object(r.d)(e2)) {
            Object(r.g)(e2) ? (t2.type = "RootEditableElement", t2.name = e2.rootName, t2.url = a + "_rooteditableelement-RootEditableElement.html") : (t2.name = e2.name, Object(r.b)(e2) ? (t2.type = "AttributeElement", t2.url = a + "_attributeelement-AttributeElement.html") : Object(r.e)(e2) ? (t2.type = "EmptyElement", t2.url = a + "_emptyelement-EmptyElement.html") : Object(r.h)(e2) ? (t2.type = "UIElement", t2.url = a + "_uielement-UIElement.html") : Object(r.f)(e2) ? (t2.type = "RawElement", t2.url = a + "_rawelement-RawElement.html") : Object(r.c)(e2) ? (t2.type = "EditableElement", t2.url = a + "_editableelement-EditableElement.html") : (t2.type = "ContainerElement", t2.url = a + "_containerelement-ContainerElement.html")), g(e2).forEach(([e3, n2]) => {
              t2.attributes[e3] = { value: n2 };
            }), t2.properties = { index: { value: e2.index }, isEmpty: { value: e2.isEmpty }, childCount: { value: e2.childCount } };
            for (let [n2, r2] of e2.getCustomProperties()) "symbol" == typeof n2 && (n2 = n2.toString()), t2.customProperties[n2] = { value: r2 };
          } else t2.name = e2.data, t2.type = "Text", t2.url = a + "_text-Text.html", t2.properties = { index: { value: e2.index } };
          return t2.properties = Object(i.b)(t2.properties), t2.customProperties = Object(i.b)(t2.customProperties), t2.attributes = Object(i.b)(t2.attributes), t2;
        }
        function d(e2, t2) {
          const n2 = {};
          return Object.assign(n2, { index: e2.index, path: e2.getPath(), node: e2, positionsBefore: [], positionsAfter: [] }), Object(r.d)(e2) ? function(e3, t3) {
            const n3 = e3.node;
            Object.assign(e3, { type: "element", children: [], positions: [] }), e3.name = n3.name, Object(r.b)(n3) ? e3.elementType = "attribute" : Object(r.g)(n3) ? e3.elementType = "root" : Object(r.e)(n3) ? e3.elementType = "empty" : Object(r.h)(n3) ? e3.elementType = "ui" : Object(r.f)(n3) ? e3.elementType = "raw" : e3.elementType = "container";
            Object(r.e)(n3) ? e3.presentation = { isEmpty: true } : Object(r.h)(n3) ? e3.children.push({ type: "comment", text: s }) : Object(r.f)(n3) && e3.children.push({ type: "comment", text: l });
            for (const r2 of n3.getChildren()) e3.children.push(d(r2, t3));
            (function(e4, t4) {
              for (const n4 of t4) {
                const t5 = h(e4, n4);
                for (const n5 of t5) {
                  const t6 = n5.offset;
                  if (0 === t6) {
                    const t7 = e4.children[0];
                    t7 ? t7.positionsBefore.push(n5) : e4.positions.push(n5);
                  } else if (t6 === e4.children.length) {
                    const t7 = e4.children[e4.children.length - 1];
                    t7 ? t7.positionsAfter.push(n5) : e4.positions.push(n5);
                  } else {
                    let r2 = n5.isEnd ? 0 : e4.children.length - 1, o2 = e4.children[r2];
                    for (; o2; ) {
                      if (o2.index === t6) {
                        o2.positionsBefore.push(n5);
                        break;
                      }
                      if (o2.index + 1 === t6) {
                        o2.positionsAfter.push(n5);
                        break;
                      }
                      r2 += n5.isEnd ? 1 : -1, o2 = e4.children[r2];
                    }
                  }
                }
              }
            })(e3, t3), e3.attributes = function(e4) {
              const t4 = g(e4).map(([e5, t5]) => [e5, Object(i.a)(t5, false)]);
              return new Map(t4);
            }(n3);
          }(n2, t2) : function(e3, t3) {
            Object.assign(e3, { type: "text", startOffset: 0, text: e3.node.data, positions: [] });
            for (const n3 of t3) {
              const t4 = h(e3, n3);
              e3.positions.push(...t4);
            }
          }(n2, t2), n2;
        }
        function h(e2, t2) {
          const n2 = e2.path, r2 = t2.start.path, o2 = t2.end.path, i2 = [];
          return m(n2, r2) && i2.push({ offset: r2[r2.length - 1], isEnd: false, presentation: t2.presentation || null, type: t2.type, name: t2.name || null }), m(n2, o2) && i2.push({ offset: o2[o2.length - 1], isEnd: true, presentation: t2.presentation || null, type: t2.type, name: t2.name || null }), i2;
        }
        function m(e2, t2) {
          if (e2.length === t2.length - 1) {
            if ("prefix" === Object(o.a)(e2, t2)) return true;
          }
          return false;
        }
        function g(e2) {
          return [...e2.getAttributes()].sort(([e3], [t2]) => e3.toUpperCase() < t2.toUpperCase() ? -1 : 1);
        }
      }, function(e, t, n) {
        n.d(t, "d", function() {
          return l;
        }), n.d(t, "c", function() {
          return c;
        }), n.d(t, "a", function() {
          return u;
        }), n.d(t, "e", function() {
          return p;
        }), n.d(t, "b", function() {
          return f;
        });
        var r = n(4), o = n(8), i = n(1);
        const a = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_", s = ["#03a9f4", "#fb8c00", "#009688", "#e91e63", "#4caf50", "#00bcd4", "#607d8b", "#cddc39", "#9c27b0", "#f44336", "#6d4c41", "#8bc34a", "#3f51b5", "#2196f3", "#f4511e", "#673ab7", "#ffb300"];
        function l(e2) {
          if (!e2) return [];
          const t2 = [...e2.model.document.roots];
          return t2.filter(({ rootName: e3 }) => "$graveyard" !== e3).concat(t2.filter(({ rootName: e3 }) => "$graveyard" === e3));
        }
        function c(e2, t2) {
          if (!e2) return [];
          const n2 = [], o2 = e2.model;
          for (const e3 of o2.document.selection.getRanges()) e3.root.rootName === t2 && n2.push({ type: "selection", start: Object(r.a)(e3.start), end: Object(r.a)(e3.end) });
          return n2;
        }
        function u(e2, t2) {
          if (!e2) return [];
          const n2 = [], o2 = e2.model;
          let i2 = 0;
          for (const e3 of o2.markers) {
            const { name: o3, affectsData: a2, managedUsingOperations: l2 } = e3, c2 = e3.getStart(), u2 = e3.getEnd();
            c2.root.rootName === t2 && n2.push({ type: "marker", marker: e3, name: o3, affectsData: a2, managedUsingOperations: l2, presentation: { color: s[i2++ % (s.length - 1)] }, start: Object(r.a)(c2), end: Object(r.a)(u2) });
          }
          return n2;
        }
        function p({ currentEditor: e2, currentRootName: t2, ranges: n2, markers: r2 }) {
          if (!e2) return [];
          return [d(e2.model.document.getRoot(t2), [...n2, ...r2])];
        }
        function f(e2, t2) {
          const n2 = { editorNode: t2, properties: {}, attributes: {} };
          Object(r.c)(t2) ? (Object(r.d)(t2) ? (n2.type = "RootElement", n2.name = t2.rootName, n2.url = a + "rootelement-RootElement.html") : (n2.type = "Element", n2.name = t2.name, n2.url = a + "element-Element.html"), n2.properties = { childCount: { value: t2.childCount }, startOffset: { value: t2.startOffset }, endOffset: { value: t2.endOffset }, maxOffset: { value: t2.maxOffset } }) : (n2.name = t2.data, n2.type = "Text", n2.url = a + "text-Text.html", n2.properties = { startOffset: { value: t2.startOffset }, endOffset: { value: t2.endOffset }, offsetSize: { value: t2.offsetSize } }), n2.properties.path = { value: Object(r.b)(t2) }, m(t2).forEach(([e3, t3]) => {
            n2.attributes[e3] = { value: t3 };
          }), n2.properties = Object(i.b)(n2.properties), n2.attributes = Object(i.b)(n2.attributes);
          for (const t3 in n2.attributes) {
            const r2 = {}, o2 = e2.model.schema.getAttributeProperties(t3);
            for (const e3 in o2) r2[e3] = { value: o2[e3] };
            n2.attributes[t3].subProperties = Object(i.b)(r2);
          }
          return n2;
        }
        function d(e2, t2) {
          const n2 = {}, { startOffset: o2, endOffset: i2 } = e2;
          return Object.assign(n2, { startOffset: o2, endOffset: i2, node: e2, path: e2.getPath(), positionsBefore: [], positionsAfter: [] }), Object(r.c)(e2) ? function(e3, t3) {
            const n3 = e3.node;
            Object.assign(e3, { type: "element", name: n3.name, children: [], maxOffset: n3.maxOffset, positions: [] });
            for (const r2 of n3.getChildren()) e3.children.push(d(r2, t3));
            (function(e4, t4) {
              for (const n4 of t4) {
                const t5 = g(e4, n4);
                for (const n5 of t5) {
                  const t6 = n5.offset;
                  if (0 === t6) {
                    const t7 = e4.children[0];
                    t7 ? t7.positionsBefore.push(n5) : e4.positions.push(n5);
                  } else if (t6 === e4.maxOffset) {
                    const t7 = e4.children[e4.children.length - 1];
                    t7 ? t7.positionsAfter.push(n5) : e4.positions.push(n5);
                  } else {
                    let r2 = n5.isEnd ? 0 : e4.children.length - 1, o3 = e4.children[r2];
                    for (; o3; ) {
                      if (o3.startOffset === t6) {
                        o3.positionsBefore.push(n5);
                        break;
                      }
                      if (o3.endOffset === t6) {
                        const t7 = e4.children[r2 + 1], i3 = "text" === o3.type && t7 && "element" === t7.type, a2 = "element" === o3.type && t7 && "text" === t7.type, s2 = "text" === o3.type && t7 && "text" === t7.type;
                        n5.isEnd && (i3 || a2 || s2) ? t7.positionsBefore.push(n5) : o3.positionsAfter.push(n5);
                        break;
                      }
                      if (o3.startOffset < t6 && o3.endOffset > t6) {
                        o3.positions.push(n5);
                        break;
                      }
                      r2 += n5.isEnd ? 1 : -1, o3 = e4.children[r2];
                    }
                  }
                }
              }
            })(e3, t3), e3.attributes = h(n3);
          }(n2, t2) : function(e3) {
            const t3 = e3.node;
            Object.assign(e3, { type: "text", text: t3.data, positions: [], presentation: { dontRenderAttributeValue: true } }), e3.attributes = h(t3);
          }(n2), n2;
        }
        function h(e2) {
          const t2 = m(e2).map(([e3, t3]) => [e3, Object(i.a)(t3, false)]);
          return new Map(t2);
        }
        function m(e2) {
          return [...e2.getAttributes()].sort(([e3], [t2]) => e3 < t2 ? -1 : 1);
        }
        function g(e2, t2) {
          const n2 = e2.path, r2 = t2.start.path, o2 = t2.end.path, i2 = [];
          return y(n2, r2) && i2.push({ offset: r2[r2.length - 1], isEnd: false, presentation: t2.presentation || null, type: t2.type, name: t2.name || null }), y(n2, o2) && i2.push({ offset: o2[o2.length - 1], isEnd: true, presentation: t2.presentation || null, type: t2.type, name: t2.name || null }), i2;
        }
        function y(e2, t2) {
          if (e2.length === t2.length - 1) {
            if ("prefix" === Object(o.a)(e2, t2)) return true;
          }
          return false;
        }
      }, function(e, t, n) {
        n.d(t, "a", function() {
          return m;
        });
        var r = n(0), o = n.n(r), i = n(5), a = n.n(i);
        class s extends r.Component {
          constructor(e2) {
            super(e2), this.handleClick = this.handleClick.bind(this);
          }
          handleClick(e2) {
            this.globalTreeProps.onClick(e2, this.definition.node);
          }
          getChildren() {
            return this.definition.children.map((e2, t2) => h(e2, t2, this.props.globalTreeProps));
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
          shouldComponentUpdate(e2) {
            return !a()(this.props, e2);
          }
        }
        var l = n(1);
        class c extends r.PureComponent {
          render() {
            let e2;
            const t2 = Object(l.c)(this.props.value, 500);
            return this.props.dontRenderValue || (e2 = o.a.createElement("span", { className: "ck-inspector-tree-node__attribute__value" }, t2)), o.a.createElement("span", { className: "ck-inspector-tree-node__attribute" }, o.a.createElement("span", { className: "ck-inspector-tree-node__attribute__name", title: t2 }, this.props.name), e2);
          }
        }
        class u extends r.Component {
          render() {
            const e2 = this.props.definition, t2 = { className: ["ck-inspector-tree__position", "selection" === e2.type ? "ck-inspector-tree__position_selection" : "", "marker" === e2.type ? "ck-inspector-tree__position_marker" : "", e2.isEnd ? "ck-inspector-tree__position_end" : ""].join(" "), style: {} };
            return e2.presentation && e2.presentation.color && (t2.style["--ck-inspector-color-tree-position"] = e2.presentation.color), "marker" === e2.type && (t2["data-marker-name"] = e2.name), o.a.createElement("span", t2, "​");
          }
          shouldComponentUpdate(e2) {
            return !a()(this.props, e2);
          }
        }
        class p extends s {
          render() {
            const e2 = this.definition, t2 = e2.presentation, n2 = t2 && t2.isEmpty, r2 = t2 && t2.cssClass, i2 = this.getChildren(), a2 = ["ck-inspector-code", "ck-inspector-tree-node", this.isActive ? "ck-inspector-tree-node_active" : "", n2 ? "ck-inspector-tree-node_empty" : "", r2], s2 = [], l2 = [];
            e2.positionsBefore && e2.positionsBefore.forEach((e3, t3) => {
              s2.push(o.a.createElement(u, { key: "position-before:" + t3, definition: e3 }));
            }), e2.positionsAfter && e2.positionsAfter.forEach((e3, t3) => {
              l2.push(o.a.createElement(u, { key: "position-after:" + t3, definition: e3 }));
            }), e2.positions && e2.positions.forEach((e3, t3) => {
              i2.push(o.a.createElement(u, { key: "position" + t3, definition: e3 }));
            });
            let c2 = e2.name;
            return this.globalTreeProps.showElementTypes && (c2 = e2.elementType + ":" + c2), o.a.createElement("div", { className: a2.join(" "), onClick: this.handleClick }, s2, o.a.createElement("span", { className: "ck-inspector-tree-node__name" }, o.a.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_open" }), c2, this.getAttributes(), n2 ? "" : o.a.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_close" })), o.a.createElement("div", { className: "ck-inspector-tree-node__content" }, i2), n2 ? "" : o.a.createElement("span", { className: "ck-inspector-tree-node__name ck-inspector-tree-node__name_close" }, o.a.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_open" }), "/", c2, o.a.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_close" }), l2));
          }
          getAttributes() {
            const e2 = [], t2 = this.definition;
            for (const [n2, r2] of t2.attributes) e2.push(o.a.createElement(c, { key: n2, name: n2, value: r2 }));
            return e2;
          }
          shouldComponentUpdate(e2) {
            return !a()(this.props, e2);
          }
        }
        class f extends s {
          render() {
            const e2 = this.definition, t2 = ["ck-inspector-tree-text", this.isActive ? "ck-inspector-tree-node_active" : ""].join(" ");
            let n2 = this.definition.text;
            e2.positions && e2.positions.length && (n2 = n2.split(""), Array.from(e2.positions).sort((e3, t3) => e3.offset < t3.offset ? -1 : e3.offset === t3.offset ? 0 : 1).reverse().forEach((t3, r3) => {
              n2.splice(t3.offset - e2.startOffset, 0, o.a.createElement(u, { key: "position" + r3, definition: t3 }));
            }));
            const r2 = [n2];
            return e2.positionsBefore && e2.positionsBefore.length && e2.positionsBefore.forEach((e3, t3) => {
              r2.unshift(o.a.createElement(u, { key: "position-before:" + t3, definition: e3 }));
            }), e2.positionsAfter && e2.positionsAfter.length && e2.positionsAfter.forEach((e3, t3) => {
              r2.push(o.a.createElement(u, { key: "position-after:" + t3, definition: e3 }));
            }), o.a.createElement("span", { className: t2, onClick: this.handleClick }, o.a.createElement("span", { className: "ck-inspector-tree-node__content" }, this.globalTreeProps.showCompactText ? "" : this.getAttributes(), this.globalTreeProps.showCompactText ? "" : '"', r2, this.globalTreeProps.showCompactText ? "" : '"'));
          }
          getAttributes() {
            const e2 = [], t2 = this.definition, n2 = t2.presentation, r2 = n2 && n2.dontRenderAttributeValue;
            for (const [n3, i2] of t2.attributes) e2.push(o.a.createElement(c, { key: n3, name: n3, value: i2, dontRenderValue: r2 }));
            return o.a.createElement("span", { className: "ck-inspector-tree-text__attributes" }, e2);
          }
          shouldComponentUpdate(e2) {
            return !a()(this.props, e2);
          }
        }
        class d extends r.Component {
          render() {
            return o.a.createElement("span", { className: "ck-inspector-tree-comment", dangerouslySetInnerHTML: { __html: this.props.definition.text } });
          }
        }
        function h(e2, t2, n2) {
          return "element" === e2.type ? o.a.createElement(p, { key: t2, definition: e2, globalTreeProps: n2 }) : "text" === e2.type ? o.a.createElement(f, { key: t2, definition: e2, globalTreeProps: n2 }) : "comment" === e2.type ? o.a.createElement(d, { key: t2, definition: e2 }) : void 0;
        }
        n(34);
        class m extends r.Component {
          render() {
            let e2;
            return e2 = this.props.definition ? this.props.definition.map((e3, t2) => h(e3, t2, { onClick: this.props.onClick, showCompactText: this.props.showCompactText, showElementTypes: this.props.showElementTypes, activeNode: this.props.activeNode })) : "Nothing to show.", o.a.createElement("div", { className: ["ck-inspector-tree", ...this.props.className || [], this.props.textDirection ? "ck-inspector-tree_text-direction_" + this.props.textDirection : "", this.props.showCompactText ? "ck-inspector-tree_compact-text" : ""].join(" ") }, e2);
          }
        }
      }, function(e, t, n) {
        !function e2() {
          if ("undefined" != typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" == typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE) {
            try {
              __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(e2);
            } catch (e3) {
              console.error(e3);
            }
          }
        }(), e.exports = n(22);
      }, function(e, t, n) {
        Object.defineProperty(t, "__esModule", { value: true }), t.stringifyPath = t.quoteKey = t.isValidVariableName = t.IS_VALID_IDENTIFIER = t.quoteString = void 0;
        const r = /[\\\'\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, o = /* @__PURE__ */ new Map([["\b", "\\b"], ["	", "\\t"], ["\n", "\\n"], ["\f", "\\f"], ["\r", "\\r"], ["'", "\\'"], ['"', '\\"'], ["\\", "\\\\"]]);
        function i(e2) {
          return o.get(e2) || "\\u" + ("0000" + e2.charCodeAt(0).toString(16)).slice(-4);
        }
        t.quoteString = function(e2) {
          return `'${e2.replace(r, i)}'`;
        };
        const a = new Set("break else new var case finally return void catch for switch while continue function this with default if throw delete in try do instanceof typeof abstract enum int short boolean export interface static byte extends long super char final native synchronized class float package throws const goto private transient debugger implements protected volatile double import public let yield".split(" "));
        function s(e2) {
          return "string" == typeof e2 && !a.has(e2) && t.IS_VALID_IDENTIFIER.test(e2);
        }
        t.IS_VALID_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/, t.isValidVariableName = s, t.quoteKey = function(e2, t2) {
          return s(e2) ? e2 : t2(e2);
        }, t.stringifyPath = function(e2, t2) {
          let n2 = "";
          for (const r2 of e2) s(r2) ? n2 += "." + r2 : n2 += `[${t2(r2)}]`;
          return n2;
        };
      }, function(e, t) {
        function n(e2, t2, n2, r2) {
          var o2, i2 = null == (o2 = r2) || "number" == typeof o2 || "boolean" == typeof o2 ? r2 : n2(r2), a2 = t2.get(i2);
          return void 0 === a2 && (a2 = e2.call(this, r2), t2.set(i2, a2)), a2;
        }
        function r(e2, t2, n2) {
          var r2 = Array.prototype.slice.call(arguments, 3), o2 = n2(r2), i2 = t2.get(o2);
          return void 0 === i2 && (i2 = e2.apply(this, r2), t2.set(o2, i2)), i2;
        }
        function o(e2, t2, n2, r2, o2) {
          return n2.bind(t2, e2, r2, o2);
        }
        function i(e2, t2) {
          return o(e2, this, 1 === e2.length ? n : r, t2.cache.create(), t2.serializer);
        }
        function a() {
          return JSON.stringify(arguments);
        }
        function s() {
          this.cache = /* @__PURE__ */ Object.create(null);
        }
        s.prototype.has = function(e2) {
          return e2 in this.cache;
        }, s.prototype.get = function(e2) {
          return this.cache[e2];
        }, s.prototype.set = function(e2, t2) {
          this.cache[e2] = t2;
        };
        var l = { create: function() {
          return new s();
        } };
        e.exports = function(e2, t2) {
          var n2 = t2 && t2.cache ? t2.cache : l, r2 = t2 && t2.serializer ? t2.serializer : a;
          return (t2 && t2.strategy ? t2.strategy : i)(e2, { cache: n2, serializer: r2 });
        }, e.exports.strategies = { variadic: function(e2, t2) {
          return o(e2, this, r, t2.cache.create(), t2.serializer);
        }, monadic: function(e2, t2) {
          return o(e2, this, n, t2.cache.create(), t2.serializer);
        } };
      }, function(e, t) {
        var n;
        n = /* @__PURE__ */ function() {
          return this;
        }();
        try {
          n = n || new Function("return this")();
        } catch (e2) {
          "object" == typeof window && (n = window);
        }
        e.exports = n;
      }, function(e, t, n) {
        var r = Object.getOwnPropertySymbols, o = Object.prototype.hasOwnProperty, i = Object.prototype.propertyIsEnumerable;
        function a(e2) {
          if (null == e2) throw new TypeError("Object.assign cannot be called with null or undefined");
          return Object(e2);
        }
        e.exports = function() {
          try {
            if (!Object.assign) return false;
            var e2 = new String("abc");
            if (e2[5] = "de", "5" === Object.getOwnPropertyNames(e2)[0]) return false;
            for (var t2 = {}, n2 = 0; n2 < 10; n2++) t2["_" + String.fromCharCode(n2)] = n2;
            if ("0123456789" !== Object.getOwnPropertyNames(t2).map(function(e3) {
              return t2[e3];
            }).join("")) return false;
            var r2 = {};
            return "abcdefghijklmnopqrst".split("").forEach(function(e3) {
              r2[e3] = e3;
            }), "abcdefghijklmnopqrst" === Object.keys(Object.assign({}, r2)).join("");
          } catch (e3) {
            return false;
          }
        }() ? Object.assign : function(e2, t2) {
          for (var n2, s, l = a(e2), c = 1; c < arguments.length; c++) {
            for (var u in n2 = Object(arguments[c])) o.call(n2, u) && (l[u] = n2[u]);
            if (r) {
              s = r(n2);
              for (var p = 0; p < s.length; p++) i.call(n2, s[p]) && (l[s[p]] = n2[s[p]]);
            }
          }
          return l;
        };
      }, function(e, t, n) {
        Object.defineProperty(t, "__esModule", { value: true }), t.FunctionParser = t.dedentFunction = t.functionToString = t.USED_METHOD_KEY = void 0;
        const r = n(13), o = '"' === { " "() {
        } }[" "].toString().charAt(0), i = { Function: "function ", GeneratorFunction: "function* ", AsyncFunction: "async function ", AsyncGeneratorFunction: "async function* " }, a = { Function: "", GeneratorFunction: "*", AsyncFunction: "async ", AsyncGeneratorFunction: "async *" }, s = new Set("case delete else in instanceof new return throw typeof void , ; : + - ! ~ & | ^ * / % < > ? =".split(" "));
        t.USED_METHOD_KEY = /* @__PURE__ */ new WeakSet();
        function l(e2) {
          let t2;
          for (const n2 of e2.split("\n").slice(1)) {
            const r2 = /^[\s\t]+/.exec(n2);
            if (!r2) return e2;
            const [o2] = r2;
            (void 0 === t2 || o2.length < t2.length) && (t2 = o2);
          }
          return t2 ? e2.split("\n" + t2).join("\n") : e2;
        }
        t.functionToString = (e2, n2, r2, o2) => {
          const i2 = "string" == typeof o2 ? o2 : void 0;
          return void 0 !== i2 && t.USED_METHOD_KEY.add(e2), new c(e2, n2, r2, i2).stringify();
        }, t.dedentFunction = l;
        class c {
          constructor(e2, t2, n2, o2) {
            this.fn = e2, this.indent = t2, this.next = n2, this.key = o2, this.pos = 0, this.hadKeyword = false, this.fnString = Function.prototype.toString.call(e2), this.fnType = e2.constructor.name, this.keyQuote = void 0 === o2 ? "" : r.quoteKey(o2, n2), this.keyPrefix = void 0 === o2 ? "" : `${this.keyQuote}:${t2 ? " " : ""}`, this.isMethodCandidate = void 0 !== o2 && ("" === this.fn.name || this.fn.name === o2);
          }
          stringify() {
            const e2 = this.tryParse();
            return e2 ? l(e2) : `${this.keyPrefix}void ${this.next(this.fnString)}`;
          }
          getPrefix() {
            return this.isMethodCandidate && !this.hadKeyword ? a[this.fnType] + this.keyQuote : this.keyPrefix + i[this.fnType];
          }
          tryParse() {
            if ("}" !== this.fnString[this.fnString.length - 1]) return this.keyPrefix + this.fnString;
            if (this.fn.name) {
              const e3 = this.tryStrippingName();
              if (e3) return e3;
            }
            const e2 = this.pos;
            if ("class" === this.consumeSyntax()) return this.fnString;
            if (this.pos = e2, this.tryParsePrefixTokens()) {
              const e3 = this.tryStrippingName();
              if (e3) return e3;
              let t2 = this.pos;
              switch (this.consumeSyntax("WORD_LIKE")) {
                case "WORD_LIKE":
                  this.isMethodCandidate && !this.hadKeyword && (t2 = this.pos);
                case "()":
                  if ("=>" === this.fnString.substr(this.pos, 2)) return this.keyPrefix + this.fnString;
                  this.pos = t2;
                case '"':
                case "'":
                case "[]":
                  return this.getPrefix() + this.fnString.substr(this.pos);
              }
            }
          }
          tryStrippingName() {
            if (o) return;
            let e2 = this.pos;
            const t2 = this.fnString.substr(this.pos, this.fn.name.length);
            if (t2 === this.fn.name && (this.pos += t2.length, "()" === this.consumeSyntax() && "{}" === this.consumeSyntax() && this.pos === this.fnString.length)) return !this.isMethodCandidate && r.isValidVariableName(t2) || (e2 += t2.length), this.getPrefix() + this.fnString.substr(e2);
            this.pos = e2;
          }
          tryParsePrefixTokens() {
            let e2 = this.pos;
            switch (this.hadKeyword = false, this.fnType) {
              case "AsyncFunction":
                if ("async" !== this.consumeSyntax()) return false;
                e2 = this.pos;
              case "Function":
                return "function" === this.consumeSyntax() ? this.hadKeyword = true : this.pos = e2, true;
              case "AsyncGeneratorFunction":
                if ("async" !== this.consumeSyntax()) return false;
              case "GeneratorFunction":
                let t2 = this.consumeSyntax();
                return "function" === t2 && (t2 = this.consumeSyntax(), this.hadKeyword = true), "*" === t2;
            }
          }
          consumeSyntax(e2) {
            const t2 = this.consumeMatch(/^(?:([A-Za-z_0-9$\xA0-\uFFFF]+)|=>|\+\+|\-\-|.)/);
            if (!t2) return;
            const [n2, r2] = t2;
            if (this.consumeWhitespace(), r2) return e2 || r2;
            switch (n2) {
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
            return n2;
          }
          consumeSyntaxUntil(e2, t2) {
            let n2 = true;
            for (; ; ) {
              const r2 = this.consumeSyntax();
              if (r2 === t2) return e2 + t2;
              if (!r2 || ")" === r2 || "]" === r2 || "}" === r2) return;
              "/" === r2 && n2 && this.consumeMatch(/^(?:\\.|[^\\\/\n[]|\[(?:\\.|[^\]])*\])+\/[a-z]*/) ? (n2 = false, this.consumeWhitespace()) : n2 = s.has(r2);
            }
          }
          consumeMatch(e2) {
            const t2 = e2.exec(this.fnString.substr(this.pos));
            return t2 && (this.pos += t2[0].length), t2;
          }
          consumeRegExp(e2, t2) {
            const n2 = e2.exec(this.fnString.substr(this.pos));
            if (n2) return this.pos += n2[0].length, this.consumeWhitespace(), t2;
          }
          consumeTemplate() {
            for (; ; ) {
              if (this.consumeMatch(/^(?:[^`$\\]|\\.|\$(?!{))*/), "`" === this.fnString[this.pos]) return this.pos++, this.consumeWhitespace(), "`";
              if ("${" !== this.fnString.substr(this.pos, 2) || (this.pos += 2, this.consumeWhitespace(), !this.consumeSyntaxUntil("{", "}"))) return;
            }
          }
          consumeWhitespace() {
            this.consumeMatch(/^(?:\s|\/\/.*|\/\*[^]*?\*\/)*/);
          }
        }
        t.FunctionParser = c;
      }, function(e, t, n) {
        e.exports = n(53)();
      }, function(e, t, n) {
        Object.defineProperty(t, "__esModule", { value: true }), t.stringify = void 0;
        const r = n(25), o = n(13), i = Symbol("root");
        t.stringify = function(e2, t2, n2, a = {}) {
          const s = "string" == typeof n2 ? n2 : " ".repeat(n2 || 0), l = [], c = /* @__PURE__ */ new Set(), u = /* @__PURE__ */ new Map(), p = /* @__PURE__ */ new Map();
          let f = 0;
          const { maxDepth: d = 100, references: h = false, skipUndefinedProperties: m = false, maxValues: g = 1e5 } = a, y = function(e3) {
            return e3 ? (t3, n3, o2, i2) => e3(t3, n3, (e4) => r.toString(e4, n3, o2, i2), i2) : r.toString;
          }(t2), b = (e3, t3) => {
            if (++f > g) return;
            if (m && void 0 === e3) return;
            if (l.length > d) return;
            if (void 0 === t3) return y(e3, s, b, t3);
            l.push(t3);
            const n3 = v(e3, t3 === i ? void 0 : t3);
            return l.pop(), n3;
          }, v = h ? (e3, t3) => {
            if (null !== e3 && ("object" == typeof e3 || "function" == typeof e3 || "symbol" == typeof e3)) {
              if (u.has(e3)) return p.set(l.slice(1), u.get(e3)), y(void 0, s, b, t3);
              u.set(e3, l.slice(1));
            }
            return y(e3, s, b, t3);
          } : (e3, t3) => {
            if (c.has(e3)) return;
            c.add(e3);
            const n3 = y(e3, s, b, t3);
            return c.delete(e3), n3;
          }, k = b(e2, i);
          if (p.size) {
            const e3 = s ? " " : "", t3 = s ? "\n" : "";
            let n3 = `var x${e3}=${e3}${k};${t3}`;
            for (const [r2, i2] of p.entries()) {
              n3 += `x${o.stringifyPath(r2, b)}${e3}=${e3}x${o.stringifyPath(i2, b)};${t3}`;
            }
            return `(function${e3}()${e3}{${t3}${n3}return x;${t3}}())`;
          }
          return k;
        };
      }, function(e, t, n) {
        Object.defineProperty(t, "__esModule", { value: true }), t.findInArray = function(e2, t2) {
          for (var n2 = 0, r = e2.length; n2 < r; n2++) if (t2.apply(t2, [e2[n2], n2, e2])) return e2[n2];
        }, t.isFunction = function(e2) {
          return "function" == typeof e2 || "[object Function]" === Object.prototype.toString.call(e2);
        }, t.isNum = function(e2) {
          return "number" == typeof e2 && !isNaN(e2);
        }, t.int = function(e2) {
          return parseInt(e2, 10);
        }, t.dontSetMe = function(e2, t2, n2) {
          if (e2[t2]) return new Error("Invalid prop ".concat(t2, " passed to ").concat(n2, " - do not set this, set it on the child."));
        };
      }, function(e, t, n) {
        var r = n(16), o = "function" == typeof Symbol && Symbol.for, i = o ? Symbol.for("react.element") : 60103, a = o ? Symbol.for("react.portal") : 60106, s = o ? Symbol.for("react.fragment") : 60107, l = o ? Symbol.for("react.strict_mode") : 60108, c = o ? Symbol.for("react.profiler") : 60114, u = o ? Symbol.for("react.provider") : 60109, p = o ? Symbol.for("react.context") : 60110, f = o ? Symbol.for("react.forward_ref") : 60112, d = o ? Symbol.for("react.suspense") : 60113, h = o ? Symbol.for("react.memo") : 60115, m = o ? Symbol.for("react.lazy") : 60116, g = "function" == typeof Symbol && Symbol.iterator;
        function y(e2) {
          for (var t2 = "https://reactjs.org/docs/error-decoder.html?invariant=" + e2, n2 = 1; n2 < arguments.length; n2++) t2 += "&args[]=" + encodeURIComponent(arguments[n2]);
          return "Minified React error #" + e2 + "; visit " + t2 + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
        }
        var b = { isMounted: function() {
          return false;
        }, enqueueForceUpdate: function() {
        }, enqueueReplaceState: function() {
        }, enqueueSetState: function() {
        } }, v = {};
        function k(e2, t2, n2) {
          this.props = e2, this.context = t2, this.refs = v, this.updater = n2 || b;
        }
        function w() {
        }
        function _(e2, t2, n2) {
          this.props = e2, this.context = t2, this.refs = v, this.updater = n2 || b;
        }
        k.prototype.isReactComponent = {}, k.prototype.setState = function(e2, t2) {
          if ("object" != typeof e2 && "function" != typeof e2 && null != e2) throw Error(y(85));
          this.updater.enqueueSetState(this, e2, t2, "setState");
        }, k.prototype.forceUpdate = function(e2) {
          this.updater.enqueueForceUpdate(this, e2, "forceUpdate");
        }, w.prototype = k.prototype;
        var E = _.prototype = new w();
        E.constructor = _, r(E, k.prototype), E.isPureReactComponent = true;
        var x = { current: null }, S = Object.prototype.hasOwnProperty, C = { key: true, ref: true, __self: true, __source: true };
        function T(e2, t2, n2) {
          var r2, o2 = {}, a2 = null, s2 = null;
          if (null != t2) for (r2 in void 0 !== t2.ref && (s2 = t2.ref), void 0 !== t2.key && (a2 = "" + t2.key), t2) S.call(t2, r2) && !C.hasOwnProperty(r2) && (o2[r2] = t2[r2]);
          var l2 = arguments.length - 2;
          if (1 === l2) o2.children = n2;
          else if (1 < l2) {
            for (var c2 = Array(l2), u2 = 0; u2 < l2; u2++) c2[u2] = arguments[u2 + 2];
            o2.children = c2;
          }
          if (e2 && e2.defaultProps) for (r2 in l2 = e2.defaultProps) void 0 === o2[r2] && (o2[r2] = l2[r2]);
          return { $$typeof: i, type: e2, key: a2, ref: s2, props: o2, _owner: x.current };
        }
        function O(e2) {
          return "object" == typeof e2 && null !== e2 && e2.$$typeof === i;
        }
        var N = /\/+/g, P = [];
        function D(e2, t2, n2, r2) {
          if (P.length) {
            var o2 = P.pop();
            return o2.result = e2, o2.keyPrefix = t2, o2.func = n2, o2.context = r2, o2.count = 0, o2;
          }
          return { result: e2, keyPrefix: t2, func: n2, context: r2, count: 0 };
        }
        function R(e2) {
          e2.result = null, e2.keyPrefix = null, e2.func = null, e2.context = null, e2.count = 0, 10 > P.length && P.push(e2);
        }
        function M(e2, t2, n2) {
          return null == e2 ? 0 : function e3(t3, n3, r2, o2) {
            var s2 = typeof t3;
            "undefined" !== s2 && "boolean" !== s2 || (t3 = null);
            var l2 = false;
            if (null === t3) l2 = true;
            else switch (s2) {
              case "string":
              case "number":
                l2 = true;
                break;
              case "object":
                switch (t3.$$typeof) {
                  case i:
                  case a:
                    l2 = true;
                }
            }
            if (l2) return r2(o2, t3, "" === n3 ? "." + j(t3, 0) : n3), 1;
            if (l2 = 0, n3 = "" === n3 ? "." : n3 + ":", Array.isArray(t3)) for (var c2 = 0; c2 < t3.length; c2++) {
              var u2 = n3 + j(s2 = t3[c2], c2);
              l2 += e3(s2, u2, r2, o2);
            }
            else if (null === t3 || "object" != typeof t3 ? u2 = null : u2 = "function" == typeof (u2 = g && t3[g] || t3["@@iterator"]) ? u2 : null, "function" == typeof u2) for (t3 = u2.call(t3), c2 = 0; !(s2 = t3.next()).done; ) l2 += e3(s2 = s2.value, u2 = n3 + j(s2, c2++), r2, o2);
            else if ("object" === s2) throw r2 = "" + t3, Error(y(31, "[object Object]" === r2 ? "object with keys {" + Object.keys(t3).join(", ") + "}" : r2, ""));
            return l2;
          }(e2, "", t2, n2);
        }
        function j(e2, t2) {
          return "object" == typeof e2 && null !== e2 && null != e2.key ? function(e3) {
            var t3 = { "=": "=0", ":": "=2" };
            return "$" + ("" + e3).replace(/[=:]/g, function(e4) {
              return t3[e4];
            });
          }(e2.key) : t2.toString(36);
        }
        function A(e2, t2) {
          e2.func.call(e2.context, t2, e2.count++);
        }
        function z(e2, t2, n2) {
          var r2 = e2.result, o2 = e2.keyPrefix;
          e2 = e2.func.call(e2.context, t2, e2.count++), Array.isArray(e2) ? L(e2, r2, n2, function(e3) {
            return e3;
          }) : null != e2 && (O(e2) && (e2 = function(e3, t3) {
            return { $$typeof: i, type: e3.type, key: t3, ref: e3.ref, props: e3.props, _owner: e3._owner };
          }(e2, o2 + (!e2.key || t2 && t2.key === e2.key ? "" : ("" + e2.key).replace(N, "$&/") + "/") + n2)), r2.push(e2));
        }
        function L(e2, t2, n2, r2, o2) {
          var i2 = "";
          null != n2 && (i2 = ("" + n2).replace(N, "$&/") + "/"), M(e2, z, t2 = D(t2, i2, r2, o2)), R(t2);
        }
        var I = { current: null };
        function U() {
          var e2 = I.current;
          if (null === e2) throw Error(y(321));
          return e2;
        }
        var F = { ReactCurrentDispatcher: I, ReactCurrentBatchConfig: { suspense: null }, ReactCurrentOwner: x, IsSomeRendererActing: { current: false }, assign: r };
        t.Children = { map: function(e2, t2, n2) {
          if (null == e2) return e2;
          var r2 = [];
          return L(e2, r2, null, t2, n2), r2;
        }, forEach: function(e2, t2, n2) {
          if (null == e2) return e2;
          M(e2, A, t2 = D(null, null, t2, n2)), R(t2);
        }, count: function(e2) {
          return M(e2, function() {
            return null;
          }, null);
        }, toArray: function(e2) {
          var t2 = [];
          return L(e2, t2, null, function(e3) {
            return e3;
          }), t2;
        }, only: function(e2) {
          if (!O(e2)) throw Error(y(143));
          return e2;
        } }, t.Component = k, t.Fragment = s, t.Profiler = c, t.PureComponent = _, t.StrictMode = l, t.Suspense = d, t.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = F, t.cloneElement = function(e2, t2, n2) {
          if (null == e2) throw Error(y(267, e2));
          var o2 = r({}, e2.props), a2 = e2.key, s2 = e2.ref, l2 = e2._owner;
          if (null != t2) {
            if (void 0 !== t2.ref && (s2 = t2.ref, l2 = x.current), void 0 !== t2.key && (a2 = "" + t2.key), e2.type && e2.type.defaultProps) var c2 = e2.type.defaultProps;
            for (u2 in t2) S.call(t2, u2) && !C.hasOwnProperty(u2) && (o2[u2] = void 0 === t2[u2] && void 0 !== c2 ? c2[u2] : t2[u2]);
          }
          var u2 = arguments.length - 2;
          if (1 === u2) o2.children = n2;
          else if (1 < u2) {
            c2 = Array(u2);
            for (var p2 = 0; p2 < u2; p2++) c2[p2] = arguments[p2 + 2];
            o2.children = c2;
          }
          return { $$typeof: i, type: e2.type, key: a2, ref: s2, props: o2, _owner: l2 };
        }, t.createContext = function(e2, t2) {
          return void 0 === t2 && (t2 = null), (e2 = { $$typeof: p, _calculateChangedBits: t2, _currentValue: e2, _currentValue2: e2, _threadCount: 0, Provider: null, Consumer: null }).Provider = { $$typeof: u, _context: e2 }, e2.Consumer = e2;
        }, t.createElement = T, t.createFactory = function(e2) {
          var t2 = T.bind(null, e2);
          return t2.type = e2, t2;
        }, t.createRef = function() {
          return { current: null };
        }, t.forwardRef = function(e2) {
          return { $$typeof: f, render: e2 };
        }, t.isValidElement = O, t.lazy = function(e2) {
          return { $$typeof: m, _ctor: e2, _status: -1, _result: null };
        }, t.memo = function(e2, t2) {
          return { $$typeof: h, type: e2, compare: void 0 === t2 ? null : t2 };
        }, t.useCallback = function(e2, t2) {
          return U().useCallback(e2, t2);
        }, t.useContext = function(e2, t2) {
          return U().useContext(e2, t2);
        }, t.useDebugValue = function() {
        }, t.useEffect = function(e2, t2) {
          return U().useEffect(e2, t2);
        }, t.useImperativeHandle = function(e2, t2, n2) {
          return U().useImperativeHandle(e2, t2, n2);
        }, t.useLayoutEffect = function(e2, t2) {
          return U().useLayoutEffect(e2, t2);
        }, t.useMemo = function(e2, t2) {
          return U().useMemo(e2, t2);
        }, t.useReducer = function(e2, t2, n2) {
          return U().useReducer(e2, t2, n2);
        }, t.useRef = function(e2) {
          return U().useRef(e2);
        }, t.useState = function(e2) {
          return U().useState(e2);
        }, t.version = "16.14.0";
      }, function(e, t, n) {
        var r = n(0), o = n(16), i = n(23);
        function a(e2) {
          for (var t2 = "https://reactjs.org/docs/error-decoder.html?invariant=" + e2, n2 = 1; n2 < arguments.length; n2++) t2 += "&args[]=" + encodeURIComponent(arguments[n2]);
          return "Minified React error #" + e2 + "; visit " + t2 + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
        }
        if (!r) throw Error(a(227));
        function s(e2, t2, n2, r2, o2, i2, a2, s2, l2) {
          var c2 = Array.prototype.slice.call(arguments, 3);
          try {
            t2.apply(n2, c2);
          } catch (e3) {
            this.onError(e3);
          }
        }
        var l = false, c = null, u = false, p = null, f = { onError: function(e2) {
          l = true, c = e2;
        } };
        function d(e2, t2, n2, r2, o2, i2, a2, u2, p2) {
          l = false, c = null, s.apply(f, arguments);
        }
        var h = null, m = null, g = null;
        function y(e2, t2, n2) {
          var r2 = e2.type || "unknown-event";
          e2.currentTarget = g(n2), function(e3, t3, n3, r3, o2, i2, s2, f2, h2) {
            if (d.apply(this, arguments), l) {
              if (!l) throw Error(a(198));
              var m2 = c;
              l = false, c = null, u || (u = true, p = m2);
            }
          }(r2, t2, void 0, e2), e2.currentTarget = null;
        }
        var b = null, v = {};
        function k() {
          if (b) for (var e2 in v) {
            var t2 = v[e2], n2 = b.indexOf(e2);
            if (!(-1 < n2)) throw Error(a(96, e2));
            if (!_[n2]) {
              if (!t2.extractEvents) throw Error(a(97, e2));
              for (var r2 in _[n2] = t2, n2 = t2.eventTypes) {
                var o2 = void 0, i2 = n2[r2], s2 = t2, l2 = r2;
                if (E.hasOwnProperty(l2)) throw Error(a(99, l2));
                E[l2] = i2;
                var c2 = i2.phasedRegistrationNames;
                if (c2) {
                  for (o2 in c2) c2.hasOwnProperty(o2) && w(c2[o2], s2, l2);
                  o2 = true;
                } else i2.registrationName ? (w(i2.registrationName, s2, l2), o2 = true) : o2 = false;
                if (!o2) throw Error(a(98, r2, e2));
              }
            }
          }
        }
        function w(e2, t2, n2) {
          if (x[e2]) throw Error(a(100, e2));
          x[e2] = t2, S[e2] = t2.eventTypes[n2].dependencies;
        }
        var _ = [], E = {}, x = {}, S = {};
        function C(e2) {
          var t2, n2 = false;
          for (t2 in e2) if (e2.hasOwnProperty(t2)) {
            var r2 = e2[t2];
            if (!v.hasOwnProperty(t2) || v[t2] !== r2) {
              if (v[t2]) throw Error(a(102, t2));
              v[t2] = r2, n2 = true;
            }
          }
          n2 && k();
        }
        var T = !("undefined" == typeof window || void 0 === window.document || void 0 === window.document.createElement), O = null, N = null, P = null;
        function D(e2) {
          if (e2 = m(e2)) {
            if ("function" != typeof O) throw Error(a(280));
            var t2 = e2.stateNode;
            t2 && (t2 = h(t2), O(e2.stateNode, e2.type, t2));
          }
        }
        function R(e2) {
          N ? P ? P.push(e2) : P = [e2] : N = e2;
        }
        function M() {
          if (N) {
            var e2 = N, t2 = P;
            if (P = N = null, D(e2), t2) for (e2 = 0; e2 < t2.length; e2++) D(t2[e2]);
          }
        }
        function j(e2, t2) {
          return e2(t2);
        }
        function A(e2, t2, n2, r2, o2) {
          return e2(t2, n2, r2, o2);
        }
        function z() {
        }
        var L = j, I = false, U = false;
        function F() {
          null === N && null === P || (z(), M());
        }
        function B(e2, t2, n2) {
          if (U) return e2(t2, n2);
          U = true;
          try {
            return L(e2, t2, n2);
          } finally {
            U = false, F();
          }
        }
        var W = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, H = Object.prototype.hasOwnProperty, V = {}, $2 = {};
        function q(e2, t2, n2, r2, o2, i2) {
          this.acceptsBooleans = 2 === t2 || 3 === t2 || 4 === t2, this.attributeName = r2, this.attributeNamespace = o2, this.mustUseProperty = n2, this.propertyName = e2, this.type = t2, this.sanitizeURL = i2;
        }
        var Y = {};
        "children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(e2) {
          Y[e2] = new q(e2, 0, false, e2, null, false);
        }), [["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(e2) {
          var t2 = e2[0];
          Y[t2] = new q(t2, 1, false, e2[1], null, false);
        }), ["contentEditable", "draggable", "spellCheck", "value"].forEach(function(e2) {
          Y[e2] = new q(e2, 2, false, e2.toLowerCase(), null, false);
        }), ["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(e2) {
          Y[e2] = new q(e2, 2, false, e2, null, false);
        }), "allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(e2) {
          Y[e2] = new q(e2, 3, false, e2.toLowerCase(), null, false);
        }), ["checked", "multiple", "muted", "selected"].forEach(function(e2) {
          Y[e2] = new q(e2, 3, true, e2, null, false);
        }), ["capture", "download"].forEach(function(e2) {
          Y[e2] = new q(e2, 4, false, e2, null, false);
        }), ["cols", "rows", "size", "span"].forEach(function(e2) {
          Y[e2] = new q(e2, 6, false, e2, null, false);
        }), ["rowSpan", "start"].forEach(function(e2) {
          Y[e2] = new q(e2, 5, false, e2.toLowerCase(), null, false);
        });
        var K = /[\-:]([a-z])/g;
        function Q(e2) {
          return e2[1].toUpperCase();
        }
        "accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e2) {
          var t2 = e2.replace(K, Q);
          Y[t2] = new q(t2, 1, false, e2, null, false);
        }), "xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e2) {
          var t2 = e2.replace(K, Q);
          Y[t2] = new q(t2, 1, false, e2, "http://www.w3.org/1999/xlink", false);
        }), ["xml:base", "xml:lang", "xml:space"].forEach(function(e2) {
          var t2 = e2.replace(K, Q);
          Y[t2] = new q(t2, 1, false, e2, "http://www.w3.org/XML/1998/namespace", false);
        }), ["tabIndex", "crossOrigin"].forEach(function(e2) {
          Y[e2] = new q(e2, 1, false, e2.toLowerCase(), null, false);
        }), Y.xlinkHref = new q("xlinkHref", 1, false, "xlink:href", "http://www.w3.org/1999/xlink", true), ["src", "href", "action", "formAction"].forEach(function(e2) {
          Y[e2] = new q(e2, 1, false, e2.toLowerCase(), null, true);
        });
        var G = r.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
        function X(e2, t2, n2, r2) {
          var o2 = Y.hasOwnProperty(t2) ? Y[t2] : null;
          (null !== o2 ? 0 === o2.type : !r2 && (2 < t2.length && ("o" === t2[0] || "O" === t2[0]) && ("n" === t2[1] || "N" === t2[1]))) || (function(e3, t3, n3, r3) {
            if (null == t3 || function(e4, t4, n4, r4) {
              if (null !== n4 && 0 === n4.type) return false;
              switch (typeof t4) {
                case "function":
                case "symbol":
                  return true;
                case "boolean":
                  return !r4 && (null !== n4 ? !n4.acceptsBooleans : "data-" !== (e4 = e4.toLowerCase().slice(0, 5)) && "aria-" !== e4);
                default:
                  return false;
              }
            }(e3, t3, n3, r3)) return true;
            if (r3) return false;
            if (null !== n3) switch (n3.type) {
              case 3:
                return !t3;
              case 4:
                return false === t3;
              case 5:
                return isNaN(t3);
              case 6:
                return isNaN(t3) || 1 > t3;
            }
            return false;
          }(t2, n2, o2, r2) && (n2 = null), r2 || null === o2 ? function(e3) {
            return !!H.call($2, e3) || !H.call(V, e3) && (W.test(e3) ? $2[e3] = true : (V[e3] = true, false));
          }(t2) && (null === n2 ? e2.removeAttribute(t2) : e2.setAttribute(t2, "" + n2)) : o2.mustUseProperty ? e2[o2.propertyName] = null === n2 ? 3 !== o2.type && "" : n2 : (t2 = o2.attributeName, r2 = o2.attributeNamespace, null === n2 ? e2.removeAttribute(t2) : (n2 = 3 === (o2 = o2.type) || 4 === o2 && true === n2 ? "" : "" + n2, r2 ? e2.setAttributeNS(r2, t2, n2) : e2.setAttribute(t2, n2))));
        }
        G.hasOwnProperty("ReactCurrentDispatcher") || (G.ReactCurrentDispatcher = { current: null }), G.hasOwnProperty("ReactCurrentBatchConfig") || (G.ReactCurrentBatchConfig = { suspense: null });
        var J = /^(.*)[\\\/]/, Z = "function" == typeof Symbol && Symbol.for, ee = Z ? Symbol.for("react.element") : 60103, te = Z ? Symbol.for("react.portal") : 60106, ne = Z ? Symbol.for("react.fragment") : 60107, re = Z ? Symbol.for("react.strict_mode") : 60108, oe = Z ? Symbol.for("react.profiler") : 60114, ie = Z ? Symbol.for("react.provider") : 60109, ae = Z ? Symbol.for("react.context") : 60110, se = Z ? Symbol.for("react.concurrent_mode") : 60111, le = Z ? Symbol.for("react.forward_ref") : 60112, ce = Z ? Symbol.for("react.suspense") : 60113, ue = Z ? Symbol.for("react.suspense_list") : 60120, pe = Z ? Symbol.for("react.memo") : 60115, fe = Z ? Symbol.for("react.lazy") : 60116, de = Z ? Symbol.for("react.block") : 60121, he = "function" == typeof Symbol && Symbol.iterator;
        function me(e2) {
          return null === e2 || "object" != typeof e2 ? null : "function" == typeof (e2 = he && e2[he] || e2["@@iterator"]) ? e2 : null;
        }
        function ge(e2) {
          if (null == e2) return null;
          if ("function" == typeof e2) return e2.displayName || e2.name || null;
          if ("string" == typeof e2) return e2;
          switch (e2) {
            case ne:
              return "Fragment";
            case te:
              return "Portal";
            case oe:
              return "Profiler";
            case re:
              return "StrictMode";
            case ce:
              return "Suspense";
            case ue:
              return "SuspenseList";
          }
          if ("object" == typeof e2) switch (e2.$$typeof) {
            case ae:
              return "Context.Consumer";
            case ie:
              return "Context.Provider";
            case le:
              var t2 = e2.render;
              return t2 = t2.displayName || t2.name || "", e2.displayName || ("" !== t2 ? "ForwardRef(" + t2 + ")" : "ForwardRef");
            case pe:
              return ge(e2.type);
            case de:
              return ge(e2.render);
            case fe:
              if (e2 = 1 === e2._status ? e2._result : null) return ge(e2);
          }
          return null;
        }
        function ye(e2) {
          var t2 = "";
          do {
            e: switch (e2.tag) {
              case 3:
              case 4:
              case 6:
              case 7:
              case 10:
              case 9:
                var n2 = "";
                break e;
              default:
                var r2 = e2._debugOwner, o2 = e2._debugSource, i2 = ge(e2.type);
                n2 = null, r2 && (n2 = ge(r2.type)), r2 = i2, i2 = "", o2 ? i2 = " (at " + o2.fileName.replace(J, "") + ":" + o2.lineNumber + ")" : n2 && (i2 = " (created by " + n2 + ")"), n2 = "\n    in " + (r2 || "Unknown") + i2;
            }
            t2 += n2, e2 = e2.return;
          } while (e2);
          return t2;
        }
        function be(e2) {
          switch (typeof e2) {
            case "boolean":
            case "number":
            case "object":
            case "string":
            case "undefined":
              return e2;
            default:
              return "";
          }
        }
        function ve(e2) {
          var t2 = e2.type;
          return (e2 = e2.nodeName) && "input" === e2.toLowerCase() && ("checkbox" === t2 || "radio" === t2);
        }
        function ke(e2) {
          e2._valueTracker || (e2._valueTracker = function(e3) {
            var t2 = ve(e3) ? "checked" : "value", n2 = Object.getOwnPropertyDescriptor(e3.constructor.prototype, t2), r2 = "" + e3[t2];
            if (!e3.hasOwnProperty(t2) && void 0 !== n2 && "function" == typeof n2.get && "function" == typeof n2.set) {
              var o2 = n2.get, i2 = n2.set;
              return Object.defineProperty(e3, t2, { configurable: true, get: function() {
                return o2.call(this);
              }, set: function(e4) {
                r2 = "" + e4, i2.call(this, e4);
              } }), Object.defineProperty(e3, t2, { enumerable: n2.enumerable }), { getValue: function() {
                return r2;
              }, setValue: function(e4) {
                r2 = "" + e4;
              }, stopTracking: function() {
                e3._valueTracker = null, delete e3[t2];
              } };
            }
          }(e2));
        }
        function we(e2) {
          if (!e2) return false;
          var t2 = e2._valueTracker;
          if (!t2) return true;
          var n2 = t2.getValue(), r2 = "";
          return e2 && (r2 = ve(e2) ? e2.checked ? "true" : "false" : e2.value), (e2 = r2) !== n2 && (t2.setValue(e2), true);
        }
        function _e(e2, t2) {
          var n2 = t2.checked;
          return o({}, t2, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: null != n2 ? n2 : e2._wrapperState.initialChecked });
        }
        function Ee(e2, t2) {
          var n2 = null == t2.defaultValue ? "" : t2.defaultValue, r2 = null != t2.checked ? t2.checked : t2.defaultChecked;
          n2 = be(null != t2.value ? t2.value : n2), e2._wrapperState = { initialChecked: r2, initialValue: n2, controlled: "checkbox" === t2.type || "radio" === t2.type ? null != t2.checked : null != t2.value };
        }
        function xe(e2, t2) {
          null != (t2 = t2.checked) && X(e2, "checked", t2, false);
        }
        function Se(e2, t2) {
          xe(e2, t2);
          var n2 = be(t2.value), r2 = t2.type;
          if (null != n2) "number" === r2 ? (0 === n2 && "" === e2.value || e2.value != n2) && (e2.value = "" + n2) : e2.value !== "" + n2 && (e2.value = "" + n2);
          else if ("submit" === r2 || "reset" === r2) return void e2.removeAttribute("value");
          t2.hasOwnProperty("value") ? Te(e2, t2.type, n2) : t2.hasOwnProperty("defaultValue") && Te(e2, t2.type, be(t2.defaultValue)), null == t2.checked && null != t2.defaultChecked && (e2.defaultChecked = !!t2.defaultChecked);
        }
        function Ce(e2, t2, n2) {
          if (t2.hasOwnProperty("value") || t2.hasOwnProperty("defaultValue")) {
            var r2 = t2.type;
            if (!("submit" !== r2 && "reset" !== r2 || void 0 !== t2.value && null !== t2.value)) return;
            t2 = "" + e2._wrapperState.initialValue, n2 || t2 === e2.value || (e2.value = t2), e2.defaultValue = t2;
          }
          "" !== (n2 = e2.name) && (e2.name = ""), e2.defaultChecked = !!e2._wrapperState.initialChecked, "" !== n2 && (e2.name = n2);
        }
        function Te(e2, t2, n2) {
          "number" === t2 && e2.ownerDocument.activeElement === e2 || (null == n2 ? e2.defaultValue = "" + e2._wrapperState.initialValue : e2.defaultValue !== "" + n2 && (e2.defaultValue = "" + n2));
        }
        function Oe(e2, t2) {
          return e2 = o({ children: void 0 }, t2), (t2 = function(e3) {
            var t3 = "";
            return r.Children.forEach(e3, function(e4) {
              null != e4 && (t3 += e4);
            }), t3;
          }(t2.children)) && (e2.children = t2), e2;
        }
        function Ne(e2, t2, n2, r2) {
          if (e2 = e2.options, t2) {
            t2 = {};
            for (var o2 = 0; o2 < n2.length; o2++) t2["$" + n2[o2]] = true;
            for (n2 = 0; n2 < e2.length; n2++) o2 = t2.hasOwnProperty("$" + e2[n2].value), e2[n2].selected !== o2 && (e2[n2].selected = o2), o2 && r2 && (e2[n2].defaultSelected = true);
          } else {
            for (n2 = "" + be(n2), t2 = null, o2 = 0; o2 < e2.length; o2++) {
              if (e2[o2].value === n2) return e2[o2].selected = true, void (r2 && (e2[o2].defaultSelected = true));
              null !== t2 || e2[o2].disabled || (t2 = e2[o2]);
            }
            null !== t2 && (t2.selected = true);
          }
        }
        function Pe(e2, t2) {
          if (null != t2.dangerouslySetInnerHTML) throw Error(a(91));
          return o({}, t2, { value: void 0, defaultValue: void 0, children: "" + e2._wrapperState.initialValue });
        }
        function De(e2, t2) {
          var n2 = t2.value;
          if (null == n2) {
            if (n2 = t2.children, t2 = t2.defaultValue, null != n2) {
              if (null != t2) throw Error(a(92));
              if (Array.isArray(n2)) {
                if (!(1 >= n2.length)) throw Error(a(93));
                n2 = n2[0];
              }
              t2 = n2;
            }
            null == t2 && (t2 = ""), n2 = t2;
          }
          e2._wrapperState = { initialValue: be(n2) };
        }
        function Re(e2, t2) {
          var n2 = be(t2.value), r2 = be(t2.defaultValue);
          null != n2 && ((n2 = "" + n2) !== e2.value && (e2.value = n2), null == t2.defaultValue && e2.defaultValue !== n2 && (e2.defaultValue = n2)), null != r2 && (e2.defaultValue = "" + r2);
        }
        function Me(e2) {
          var t2 = e2.textContent;
          t2 === e2._wrapperState.initialValue && "" !== t2 && null !== t2 && (e2.value = t2);
        }
        var je = "http://www.w3.org/1999/xhtml", Ae = "http://www.w3.org/2000/svg";
        function ze(e2) {
          switch (e2) {
            case "svg":
              return "http://www.w3.org/2000/svg";
            case "math":
              return "http://www.w3.org/1998/Math/MathML";
            default:
              return "http://www.w3.org/1999/xhtml";
          }
        }
        function Le(e2, t2) {
          return null == e2 || "http://www.w3.org/1999/xhtml" === e2 ? ze(t2) : "http://www.w3.org/2000/svg" === e2 && "foreignObject" === t2 ? "http://www.w3.org/1999/xhtml" : e2;
        }
        var Ie, Ue = function(e2) {
          return "undefined" != typeof MSApp && MSApp.execUnsafeLocalFunction ? function(t2, n2, r2, o2) {
            MSApp.execUnsafeLocalFunction(function() {
              return e2(t2, n2);
            });
          } : e2;
        }(function(e2, t2) {
          if (e2.namespaceURI !== Ae || "innerHTML" in e2) e2.innerHTML = t2;
          else {
            for ((Ie = Ie || document.createElement("div")).innerHTML = "<svg>" + t2.valueOf().toString() + "</svg>", t2 = Ie.firstChild; e2.firstChild; ) e2.removeChild(e2.firstChild);
            for (; t2.firstChild; ) e2.appendChild(t2.firstChild);
          }
        });
        function Fe(e2, t2) {
          if (t2) {
            var n2 = e2.firstChild;
            if (n2 && n2 === e2.lastChild && 3 === n2.nodeType) return void (n2.nodeValue = t2);
          }
          e2.textContent = t2;
        }
        function Be(e2, t2) {
          var n2 = {};
          return n2[e2.toLowerCase()] = t2.toLowerCase(), n2["Webkit" + e2] = "webkit" + t2, n2["Moz" + e2] = "moz" + t2, n2;
        }
        var We = { animationend: Be("Animation", "AnimationEnd"), animationiteration: Be("Animation", "AnimationIteration"), animationstart: Be("Animation", "AnimationStart"), transitionend: Be("Transition", "TransitionEnd") }, He = {}, Ve = {};
        function $e(e2) {
          if (He[e2]) return He[e2];
          if (!We[e2]) return e2;
          var t2, n2 = We[e2];
          for (t2 in n2) if (n2.hasOwnProperty(t2) && t2 in Ve) return He[e2] = n2[t2];
          return e2;
        }
        T && (Ve = document.createElement("div").style, "AnimationEvent" in window || (delete We.animationend.animation, delete We.animationiteration.animation, delete We.animationstart.animation), "TransitionEvent" in window || delete We.transitionend.transition);
        var qe = $e("animationend"), Ye = $e("animationiteration"), Ke = $e("animationstart"), Qe = $e("transitionend"), Ge = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), Xe = new ("function" == typeof WeakMap ? WeakMap : Map)();
        function Je(e2) {
          var t2 = Xe.get(e2);
          return void 0 === t2 && (t2 = /* @__PURE__ */ new Map(), Xe.set(e2, t2)), t2;
        }
        function Ze(e2) {
          var t2 = e2, n2 = e2;
          if (e2.alternate) for (; t2.return; ) t2 = t2.return;
          else {
            e2 = t2;
            do {
              0 != (1026 & (t2 = e2).effectTag) && (n2 = t2.return), e2 = t2.return;
            } while (e2);
          }
          return 3 === t2.tag ? n2 : null;
        }
        function et(e2) {
          if (13 === e2.tag) {
            var t2 = e2.memoizedState;
            if (null === t2 && (null !== (e2 = e2.alternate) && (t2 = e2.memoizedState)), null !== t2) return t2.dehydrated;
          }
          return null;
        }
        function tt(e2) {
          if (Ze(e2) !== e2) throw Error(a(188));
        }
        function nt(e2) {
          if (!(e2 = function(e3) {
            var t3 = e3.alternate;
            if (!t3) {
              if (null === (t3 = Ze(e3))) throw Error(a(188));
              return t3 !== e3 ? null : e3;
            }
            for (var n2 = e3, r2 = t3; ; ) {
              var o2 = n2.return;
              if (null === o2) break;
              var i2 = o2.alternate;
              if (null === i2) {
                if (null !== (r2 = o2.return)) {
                  n2 = r2;
                  continue;
                }
                break;
              }
              if (o2.child === i2.child) {
                for (i2 = o2.child; i2; ) {
                  if (i2 === n2) return tt(o2), e3;
                  if (i2 === r2) return tt(o2), t3;
                  i2 = i2.sibling;
                }
                throw Error(a(188));
              }
              if (n2.return !== r2.return) n2 = o2, r2 = i2;
              else {
                for (var s2 = false, l2 = o2.child; l2; ) {
                  if (l2 === n2) {
                    s2 = true, n2 = o2, r2 = i2;
                    break;
                  }
                  if (l2 === r2) {
                    s2 = true, r2 = o2, n2 = i2;
                    break;
                  }
                  l2 = l2.sibling;
                }
                if (!s2) {
                  for (l2 = i2.child; l2; ) {
                    if (l2 === n2) {
                      s2 = true, n2 = i2, r2 = o2;
                      break;
                    }
                    if (l2 === r2) {
                      s2 = true, r2 = i2, n2 = o2;
                      break;
                    }
                    l2 = l2.sibling;
                  }
                  if (!s2) throw Error(a(189));
                }
              }
              if (n2.alternate !== r2) throw Error(a(190));
            }
            if (3 !== n2.tag) throw Error(a(188));
            return n2.stateNode.current === n2 ? e3 : t3;
          }(e2))) return null;
          for (var t2 = e2; ; ) {
            if (5 === t2.tag || 6 === t2.tag) return t2;
            if (t2.child) t2.child.return = t2, t2 = t2.child;
            else {
              if (t2 === e2) break;
              for (; !t2.sibling; ) {
                if (!t2.return || t2.return === e2) return null;
                t2 = t2.return;
              }
              t2.sibling.return = t2.return, t2 = t2.sibling;
            }
          }
          return null;
        }
        function rt(e2, t2) {
          if (null == t2) throw Error(a(30));
          return null == e2 ? t2 : Array.isArray(e2) ? Array.isArray(t2) ? (e2.push.apply(e2, t2), e2) : (e2.push(t2), e2) : Array.isArray(t2) ? [e2].concat(t2) : [e2, t2];
        }
        function ot(e2, t2, n2) {
          Array.isArray(e2) ? e2.forEach(t2, n2) : e2 && t2.call(n2, e2);
        }
        var it = null;
        function at(e2) {
          if (e2) {
            var t2 = e2._dispatchListeners, n2 = e2._dispatchInstances;
            if (Array.isArray(t2)) for (var r2 = 0; r2 < t2.length && !e2.isPropagationStopped(); r2++) y(e2, t2[r2], n2[r2]);
            else t2 && y(e2, t2, n2);
            e2._dispatchListeners = null, e2._dispatchInstances = null, e2.isPersistent() || e2.constructor.release(e2);
          }
        }
        function st(e2) {
          if (null !== e2 && (it = rt(it, e2)), e2 = it, it = null, e2) {
            if (ot(e2, at), it) throw Error(a(95));
            if (u) throw e2 = p, u = false, p = null, e2;
          }
        }
        function lt(e2) {
          return (e2 = e2.target || e2.srcElement || window).correspondingUseElement && (e2 = e2.correspondingUseElement), 3 === e2.nodeType ? e2.parentNode : e2;
        }
        function ct(e2) {
          if (!T) return false;
          var t2 = (e2 = "on" + e2) in document;
          return t2 || ((t2 = document.createElement("div")).setAttribute(e2, "return;"), t2 = "function" == typeof t2[e2]), t2;
        }
        var ut = [];
        function pt(e2) {
          e2.topLevelType = null, e2.nativeEvent = null, e2.targetInst = null, e2.ancestors.length = 0, 10 > ut.length && ut.push(e2);
        }
        function ft(e2, t2, n2, r2) {
          if (ut.length) {
            var o2 = ut.pop();
            return o2.topLevelType = e2, o2.eventSystemFlags = r2, o2.nativeEvent = t2, o2.targetInst = n2, o2;
          }
          return { topLevelType: e2, eventSystemFlags: r2, nativeEvent: t2, targetInst: n2, ancestors: [] };
        }
        function dt(e2) {
          var t2 = e2.targetInst, n2 = t2;
          do {
            if (!n2) {
              e2.ancestors.push(n2);
              break;
            }
            var r2 = n2;
            if (3 === r2.tag) r2 = r2.stateNode.containerInfo;
            else {
              for (; r2.return; ) r2 = r2.return;
              r2 = 3 !== r2.tag ? null : r2.stateNode.containerInfo;
            }
            if (!r2) break;
            5 !== (t2 = n2.tag) && 6 !== t2 || e2.ancestors.push(n2), n2 = Tn(r2);
          } while (n2);
          for (n2 = 0; n2 < e2.ancestors.length; n2++) {
            t2 = e2.ancestors[n2];
            var o2 = lt(e2.nativeEvent);
            r2 = e2.topLevelType;
            var i2 = e2.nativeEvent, a2 = e2.eventSystemFlags;
            0 === n2 && (a2 |= 64);
            for (var s2 = null, l2 = 0; l2 < _.length; l2++) {
              var c2 = _[l2];
              c2 && (c2 = c2.extractEvents(r2, t2, i2, o2, a2)) && (s2 = rt(s2, c2));
            }
            st(s2);
          }
        }
        function ht(e2, t2, n2) {
          if (!n2.has(e2)) {
            switch (e2) {
              case "scroll":
                Kt(t2, "scroll", true);
                break;
              case "focus":
              case "blur":
                Kt(t2, "focus", true), Kt(t2, "blur", true), n2.set("blur", null), n2.set("focus", null);
                break;
              case "cancel":
              case "close":
                ct(e2) && Kt(t2, e2, true);
                break;
              case "invalid":
              case "submit":
              case "reset":
                break;
              default:
                -1 === Ge.indexOf(e2) && Yt(e2, t2);
            }
            n2.set(e2, null);
          }
        }
        var mt, gt, yt, bt = false, vt = [], kt = null, wt = null, _t = null, Et = /* @__PURE__ */ new Map(), xt = /* @__PURE__ */ new Map(), St = [], Ct = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput close cancel copy cut paste click change contextmenu reset submit".split(" "), Tt = "focus blur dragenter dragleave mouseover mouseout pointerover pointerout gotpointercapture lostpointercapture".split(" ");
        function Ot(e2, t2, n2, r2, o2) {
          return { blockedOn: e2, topLevelType: t2, eventSystemFlags: 32 | n2, nativeEvent: o2, container: r2 };
        }
        function Nt(e2, t2) {
          switch (e2) {
            case "focus":
            case "blur":
              kt = null;
              break;
            case "dragenter":
            case "dragleave":
              wt = null;
              break;
            case "mouseover":
            case "mouseout":
              _t = null;
              break;
            case "pointerover":
            case "pointerout":
              Et.delete(t2.pointerId);
              break;
            case "gotpointercapture":
            case "lostpointercapture":
              xt.delete(t2.pointerId);
          }
        }
        function Pt(e2, t2, n2, r2, o2, i2) {
          return null === e2 || e2.nativeEvent !== i2 ? (e2 = Ot(t2, n2, r2, o2, i2), null !== t2 && (null !== (t2 = On(t2)) && gt(t2)), e2) : (e2.eventSystemFlags |= r2, e2);
        }
        function Dt(e2) {
          var t2 = Tn(e2.target);
          if (null !== t2) {
            var n2 = Ze(t2);
            if (null !== n2) {
              if (13 === (t2 = n2.tag)) {
                if (null !== (t2 = et(n2))) return e2.blockedOn = t2, void i.unstable_runWithPriority(e2.priority, function() {
                  yt(n2);
                });
              } else if (3 === t2 && n2.stateNode.hydrate) return void (e2.blockedOn = 3 === n2.tag ? n2.stateNode.containerInfo : null);
            }
          }
          e2.blockedOn = null;
        }
        function Rt(e2) {
          if (null !== e2.blockedOn) return false;
          var t2 = Jt(e2.topLevelType, e2.eventSystemFlags, e2.container, e2.nativeEvent);
          if (null !== t2) {
            var n2 = On(t2);
            return null !== n2 && gt(n2), e2.blockedOn = t2, false;
          }
          return true;
        }
        function Mt(e2, t2, n2) {
          Rt(e2) && n2.delete(t2);
        }
        function jt() {
          for (bt = false; 0 < vt.length; ) {
            var e2 = vt[0];
            if (null !== e2.blockedOn) {
              null !== (e2 = On(e2.blockedOn)) && mt(e2);
              break;
            }
            var t2 = Jt(e2.topLevelType, e2.eventSystemFlags, e2.container, e2.nativeEvent);
            null !== t2 ? e2.blockedOn = t2 : vt.shift();
          }
          null !== kt && Rt(kt) && (kt = null), null !== wt && Rt(wt) && (wt = null), null !== _t && Rt(_t) && (_t = null), Et.forEach(Mt), xt.forEach(Mt);
        }
        function At(e2, t2) {
          e2.blockedOn === t2 && (e2.blockedOn = null, bt || (bt = true, i.unstable_scheduleCallback(i.unstable_NormalPriority, jt)));
        }
        function zt(e2) {
          function t2(t3) {
            return At(t3, e2);
          }
          if (0 < vt.length) {
            At(vt[0], e2);
            for (var n2 = 1; n2 < vt.length; n2++) {
              var r2 = vt[n2];
              r2.blockedOn === e2 && (r2.blockedOn = null);
            }
          }
          for (null !== kt && At(kt, e2), null !== wt && At(wt, e2), null !== _t && At(_t, e2), Et.forEach(t2), xt.forEach(t2), n2 = 0; n2 < St.length; n2++) (r2 = St[n2]).blockedOn === e2 && (r2.blockedOn = null);
          for (; 0 < St.length && null === (n2 = St[0]).blockedOn; ) Dt(n2), null === n2.blockedOn && St.shift();
        }
        var Lt = {}, It = /* @__PURE__ */ new Map(), Ut = /* @__PURE__ */ new Map(), Ft = ["abort", "abort", qe, "animationEnd", Ye, "animationIteration", Ke, "animationStart", "canplay", "canPlay", "canplaythrough", "canPlayThrough", "durationchange", "durationChange", "emptied", "emptied", "encrypted", "encrypted", "ended", "ended", "error", "error", "gotpointercapture", "gotPointerCapture", "load", "load", "loadeddata", "loadedData", "loadedmetadata", "loadedMetadata", "loadstart", "loadStart", "lostpointercapture", "lostPointerCapture", "playing", "playing", "progress", "progress", "seeking", "seeking", "stalled", "stalled", "suspend", "suspend", "timeupdate", "timeUpdate", Qe, "transitionEnd", "waiting", "waiting"];
        function Bt(e2, t2) {
          for (var n2 = 0; n2 < e2.length; n2 += 2) {
            var r2 = e2[n2], o2 = e2[n2 + 1], i2 = "on" + (o2[0].toUpperCase() + o2.slice(1));
            i2 = { phasedRegistrationNames: { bubbled: i2, captured: i2 + "Capture" }, dependencies: [r2], eventPriority: t2 }, Ut.set(r2, t2), It.set(r2, i2), Lt[o2] = i2;
          }
        }
        Bt("blur blur cancel cancel click click close close contextmenu contextMenu copy copy cut cut auxclick auxClick dblclick doubleClick dragend dragEnd dragstart dragStart drop drop focus focus input input invalid invalid keydown keyDown keypress keyPress keyup keyUp mousedown mouseDown mouseup mouseUp paste paste pause pause play play pointercancel pointerCancel pointerdown pointerDown pointerup pointerUp ratechange rateChange reset reset seeked seeked submit submit touchcancel touchCancel touchend touchEnd touchstart touchStart volumechange volumeChange".split(" "), 0), Bt("drag drag dragenter dragEnter dragexit dragExit dragleave dragLeave dragover dragOver mousemove mouseMove mouseout mouseOut mouseover mouseOver pointermove pointerMove pointerout pointerOut pointerover pointerOver scroll scroll toggle toggle touchmove touchMove wheel wheel".split(" "), 1), Bt(Ft, 2);
        for (var Wt = "change selectionchange textInput compositionstart compositionend compositionupdate".split(" "), Ht = 0; Ht < Wt.length; Ht++) Ut.set(Wt[Ht], 0);
        var Vt = i.unstable_UserBlockingPriority, $t = i.unstable_runWithPriority, qt = true;
        function Yt(e2, t2) {
          Kt(t2, e2, false);
        }
        function Kt(e2, t2, n2) {
          var r2 = Ut.get(t2);
          switch (void 0 === r2 ? 2 : r2) {
            case 0:
              r2 = Qt.bind(null, t2, 1, e2);
              break;
            case 1:
              r2 = Gt.bind(null, t2, 1, e2);
              break;
            default:
              r2 = Xt.bind(null, t2, 1, e2);
          }
          n2 ? e2.addEventListener(t2, r2, true) : e2.addEventListener(t2, r2, false);
        }
        function Qt(e2, t2, n2, r2) {
          I || z();
          var o2 = Xt, i2 = I;
          I = true;
          try {
            A(o2, e2, t2, n2, r2);
          } finally {
            (I = i2) || F();
          }
        }
        function Gt(e2, t2, n2, r2) {
          $t(Vt, Xt.bind(null, e2, t2, n2, r2));
        }
        function Xt(e2, t2, n2, r2) {
          if (qt) if (0 < vt.length && -1 < Ct.indexOf(e2)) e2 = Ot(null, e2, t2, n2, r2), vt.push(e2);
          else {
            var o2 = Jt(e2, t2, n2, r2);
            if (null === o2) Nt(e2, r2);
            else if (-1 < Ct.indexOf(e2)) e2 = Ot(o2, e2, t2, n2, r2), vt.push(e2);
            else if (!function(e3, t3, n3, r3, o3) {
              switch (t3) {
                case "focus":
                  return kt = Pt(kt, e3, t3, n3, r3, o3), true;
                case "dragenter":
                  return wt = Pt(wt, e3, t3, n3, r3, o3), true;
                case "mouseover":
                  return _t = Pt(_t, e3, t3, n3, r3, o3), true;
                case "pointerover":
                  var i2 = o3.pointerId;
                  return Et.set(i2, Pt(Et.get(i2) || null, e3, t3, n3, r3, o3)), true;
                case "gotpointercapture":
                  return i2 = o3.pointerId, xt.set(i2, Pt(xt.get(i2) || null, e3, t3, n3, r3, o3)), true;
              }
              return false;
            }(o2, e2, t2, n2, r2)) {
              Nt(e2, r2), e2 = ft(e2, r2, null, t2);
              try {
                B(dt, e2);
              } finally {
                pt(e2);
              }
            }
          }
        }
        function Jt(e2, t2, n2, r2) {
          if (null !== (n2 = Tn(n2 = lt(r2)))) {
            var o2 = Ze(n2);
            if (null === o2) n2 = null;
            else {
              var i2 = o2.tag;
              if (13 === i2) {
                if (null !== (n2 = et(o2))) return n2;
                n2 = null;
              } else if (3 === i2) {
                if (o2.stateNode.hydrate) return 3 === o2.tag ? o2.stateNode.containerInfo : null;
                n2 = null;
              } else o2 !== n2 && (n2 = null);
            }
          }
          e2 = ft(e2, r2, n2, t2);
          try {
            B(dt, e2);
          } finally {
            pt(e2);
          }
          return null;
        }
        var Zt = { animationIterationCount: true, borderImageOutset: true, borderImageSlice: true, borderImageWidth: true, boxFlex: true, boxFlexGroup: true, boxOrdinalGroup: true, columnCount: true, columns: true, flex: true, flexGrow: true, flexPositive: true, flexShrink: true, flexNegative: true, flexOrder: true, gridArea: true, gridRow: true, gridRowEnd: true, gridRowSpan: true, gridRowStart: true, gridColumn: true, gridColumnEnd: true, gridColumnSpan: true, gridColumnStart: true, fontWeight: true, lineClamp: true, lineHeight: true, opacity: true, order: true, orphans: true, tabSize: true, widows: true, zIndex: true, zoom: true, fillOpacity: true, floodOpacity: true, stopOpacity: true, strokeDasharray: true, strokeDashoffset: true, strokeMiterlimit: true, strokeOpacity: true, strokeWidth: true }, en = ["Webkit", "ms", "Moz", "O"];
        function tn(e2, t2, n2) {
          return null == t2 || "boolean" == typeof t2 || "" === t2 ? "" : n2 || "number" != typeof t2 || 0 === t2 || Zt.hasOwnProperty(e2) && Zt[e2] ? ("" + t2).trim() : t2 + "px";
        }
        function nn(e2, t2) {
          for (var n2 in e2 = e2.style, t2) if (t2.hasOwnProperty(n2)) {
            var r2 = 0 === n2.indexOf("--"), o2 = tn(n2, t2[n2], r2);
            "float" === n2 && (n2 = "cssFloat"), r2 ? e2.setProperty(n2, o2) : e2[n2] = o2;
          }
        }
        Object.keys(Zt).forEach(function(e2) {
          en.forEach(function(t2) {
            t2 = t2 + e2.charAt(0).toUpperCase() + e2.substring(1), Zt[t2] = Zt[e2];
          });
        });
        var rn = o({ menuitem: true }, { area: true, base: true, br: true, col: true, embed: true, hr: true, img: true, input: true, keygen: true, link: true, meta: true, param: true, source: true, track: true, wbr: true });
        function on(e2, t2) {
          if (t2) {
            if (rn[e2] && (null != t2.children || null != t2.dangerouslySetInnerHTML)) throw Error(a(137, e2, ""));
            if (null != t2.dangerouslySetInnerHTML) {
              if (null != t2.children) throw Error(a(60));
              if ("object" != typeof t2.dangerouslySetInnerHTML || !("__html" in t2.dangerouslySetInnerHTML)) throw Error(a(61));
            }
            if (null != t2.style && "object" != typeof t2.style) throw Error(a(62, ""));
          }
        }
        function an(e2, t2) {
          if (-1 === e2.indexOf("-")) return "string" == typeof t2.is;
          switch (e2) {
            case "annotation-xml":
            case "color-profile":
            case "font-face":
            case "font-face-src":
            case "font-face-uri":
            case "font-face-format":
            case "font-face-name":
            case "missing-glyph":
              return false;
            default:
              return true;
          }
        }
        var sn = je;
        function ln(e2, t2) {
          var n2 = Je(e2 = 9 === e2.nodeType || 11 === e2.nodeType ? e2 : e2.ownerDocument);
          t2 = S[t2];
          for (var r2 = 0; r2 < t2.length; r2++) ht(t2[r2], e2, n2);
        }
        function cn() {
        }
        function un(e2) {
          if (void 0 === (e2 = e2 || ("undefined" != typeof document ? document : void 0))) return null;
          try {
            return e2.activeElement || e2.body;
          } catch (t2) {
            return e2.body;
          }
        }
        function pn(e2) {
          for (; e2 && e2.firstChild; ) e2 = e2.firstChild;
          return e2;
        }
        function fn(e2, t2) {
          var n2, r2 = pn(e2);
          for (e2 = 0; r2; ) {
            if (3 === r2.nodeType) {
              if (n2 = e2 + r2.textContent.length, e2 <= t2 && n2 >= t2) return { node: r2, offset: t2 - e2 };
              e2 = n2;
            }
            e: {
              for (; r2; ) {
                if (r2.nextSibling) {
                  r2 = r2.nextSibling;
                  break e;
                }
                r2 = r2.parentNode;
              }
              r2 = void 0;
            }
            r2 = pn(r2);
          }
        }
        function dn() {
          for (var e2 = window, t2 = un(); t2 instanceof e2.HTMLIFrameElement; ) {
            try {
              var n2 = "string" == typeof t2.contentWindow.location.href;
            } catch (e3) {
              n2 = false;
            }
            if (!n2) break;
            t2 = un((e2 = t2.contentWindow).document);
          }
          return t2;
        }
        function hn(e2) {
          var t2 = e2 && e2.nodeName && e2.nodeName.toLowerCase();
          return t2 && ("input" === t2 && ("text" === e2.type || "search" === e2.type || "tel" === e2.type || "url" === e2.type || "password" === e2.type) || "textarea" === t2 || "true" === e2.contentEditable);
        }
        var mn = null, gn = null;
        function yn(e2, t2) {
          switch (e2) {
            case "button":
            case "input":
            case "select":
            case "textarea":
              return !!t2.autoFocus;
          }
          return false;
        }
        function bn(e2, t2) {
          return "textarea" === e2 || "option" === e2 || "noscript" === e2 || "string" == typeof t2.children || "number" == typeof t2.children || "object" == typeof t2.dangerouslySetInnerHTML && null !== t2.dangerouslySetInnerHTML && null != t2.dangerouslySetInnerHTML.__html;
        }
        var vn = "function" == typeof setTimeout ? setTimeout : void 0, kn = "function" == typeof clearTimeout ? clearTimeout : void 0;
        function wn(e2) {
          for (; null != e2; e2 = e2.nextSibling) {
            var t2 = e2.nodeType;
            if (1 === t2 || 3 === t2) break;
          }
          return e2;
        }
        function _n(e2) {
          e2 = e2.previousSibling;
          for (var t2 = 0; e2; ) {
            if (8 === e2.nodeType) {
              var n2 = e2.data;
              if ("$" === n2 || "$!" === n2 || "$?" === n2) {
                if (0 === t2) return e2;
                t2--;
              } else "/$" === n2 && t2++;
            }
            e2 = e2.previousSibling;
          }
          return null;
        }
        var En = Math.random().toString(36).slice(2), xn = "__reactInternalInstance$" + En, Sn = "__reactEventHandlers$" + En, Cn = "__reactContainere$" + En;
        function Tn(e2) {
          var t2 = e2[xn];
          if (t2) return t2;
          for (var n2 = e2.parentNode; n2; ) {
            if (t2 = n2[Cn] || n2[xn]) {
              if (n2 = t2.alternate, null !== t2.child || null !== n2 && null !== n2.child) for (e2 = _n(e2); null !== e2; ) {
                if (n2 = e2[xn]) return n2;
                e2 = _n(e2);
              }
              return t2;
            }
            n2 = (e2 = n2).parentNode;
          }
          return null;
        }
        function On(e2) {
          return !(e2 = e2[xn] || e2[Cn]) || 5 !== e2.tag && 6 !== e2.tag && 13 !== e2.tag && 3 !== e2.tag ? null : e2;
        }
        function Nn(e2) {
          if (5 === e2.tag || 6 === e2.tag) return e2.stateNode;
          throw Error(a(33));
        }
        function Pn(e2) {
          return e2[Sn] || null;
        }
        function Dn(e2) {
          do {
            e2 = e2.return;
          } while (e2 && 5 !== e2.tag);
          return e2 || null;
        }
        function Rn(e2, t2) {
          var n2 = e2.stateNode;
          if (!n2) return null;
          var r2 = h(n2);
          if (!r2) return null;
          n2 = r2[t2];
          e: switch (t2) {
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
              (r2 = !r2.disabled) || (r2 = !("button" === (e2 = e2.type) || "input" === e2 || "select" === e2 || "textarea" === e2)), e2 = !r2;
              break e;
            default:
              e2 = false;
          }
          if (e2) return null;
          if (n2 && "function" != typeof n2) throw Error(a(231, t2, typeof n2));
          return n2;
        }
        function Mn(e2, t2, n2) {
          (t2 = Rn(e2, n2.dispatchConfig.phasedRegistrationNames[t2])) && (n2._dispatchListeners = rt(n2._dispatchListeners, t2), n2._dispatchInstances = rt(n2._dispatchInstances, e2));
        }
        function jn(e2) {
          if (e2 && e2.dispatchConfig.phasedRegistrationNames) {
            for (var t2 = e2._targetInst, n2 = []; t2; ) n2.push(t2), t2 = Dn(t2);
            for (t2 = n2.length; 0 < t2--; ) Mn(n2[t2], "captured", e2);
            for (t2 = 0; t2 < n2.length; t2++) Mn(n2[t2], "bubbled", e2);
          }
        }
        function An(e2, t2, n2) {
          e2 && n2 && n2.dispatchConfig.registrationName && (t2 = Rn(e2, n2.dispatchConfig.registrationName)) && (n2._dispatchListeners = rt(n2._dispatchListeners, t2), n2._dispatchInstances = rt(n2._dispatchInstances, e2));
        }
        function zn(e2) {
          e2 && e2.dispatchConfig.registrationName && An(e2._targetInst, null, e2);
        }
        function Ln(e2) {
          ot(e2, jn);
        }
        var In = null, Un = null, Fn = null;
        function Bn() {
          if (Fn) return Fn;
          var e2, t2, n2 = Un, r2 = n2.length, o2 = "value" in In ? In.value : In.textContent, i2 = o2.length;
          for (e2 = 0; e2 < r2 && n2[e2] === o2[e2]; e2++) ;
          var a2 = r2 - e2;
          for (t2 = 1; t2 <= a2 && n2[r2 - t2] === o2[i2 - t2]; t2++) ;
          return Fn = o2.slice(e2, 1 < t2 ? 1 - t2 : void 0);
        }
        function Wn() {
          return true;
        }
        function Hn() {
          return false;
        }
        function Vn(e2, t2, n2, r2) {
          for (var o2 in this.dispatchConfig = e2, this._targetInst = t2, this.nativeEvent = n2, e2 = this.constructor.Interface) e2.hasOwnProperty(o2) && ((t2 = e2[o2]) ? this[o2] = t2(n2) : "target" === o2 ? this.target = r2 : this[o2] = n2[o2]);
          return this.isDefaultPrevented = (null != n2.defaultPrevented ? n2.defaultPrevented : false === n2.returnValue) ? Wn : Hn, this.isPropagationStopped = Hn, this;
        }
        function $n(e2, t2, n2, r2) {
          if (this.eventPool.length) {
            var o2 = this.eventPool.pop();
            return this.call(o2, e2, t2, n2, r2), o2;
          }
          return new this(e2, t2, n2, r2);
        }
        function qn(e2) {
          if (!(e2 instanceof this)) throw Error(a(279));
          e2.destructor(), 10 > this.eventPool.length && this.eventPool.push(e2);
        }
        function Yn(e2) {
          e2.eventPool = [], e2.getPooled = $n, e2.release = qn;
        }
        o(Vn.prototype, { preventDefault: function() {
          this.defaultPrevented = true;
          var e2 = this.nativeEvent;
          e2 && (e2.preventDefault ? e2.preventDefault() : "unknown" != typeof e2.returnValue && (e2.returnValue = false), this.isDefaultPrevented = Wn);
        }, stopPropagation: function() {
          var e2 = this.nativeEvent;
          e2 && (e2.stopPropagation ? e2.stopPropagation() : "unknown" != typeof e2.cancelBubble && (e2.cancelBubble = true), this.isPropagationStopped = Wn);
        }, persist: function() {
          this.isPersistent = Wn;
        }, isPersistent: Hn, destructor: function() {
          var e2, t2 = this.constructor.Interface;
          for (e2 in t2) this[e2] = null;
          this.nativeEvent = this._targetInst = this.dispatchConfig = null, this.isPropagationStopped = this.isDefaultPrevented = Hn, this._dispatchInstances = this._dispatchListeners = null;
        } }), Vn.Interface = { type: null, target: null, currentTarget: function() {
          return null;
        }, eventPhase: null, bubbles: null, cancelable: null, timeStamp: function(e2) {
          return e2.timeStamp || Date.now();
        }, defaultPrevented: null, isTrusted: null }, Vn.extend = function(e2) {
          function t2() {
          }
          function n2() {
            return r2.apply(this, arguments);
          }
          var r2 = this;
          t2.prototype = r2.prototype;
          var i2 = new t2();
          return o(i2, n2.prototype), n2.prototype = i2, n2.prototype.constructor = n2, n2.Interface = o({}, r2.Interface, e2), n2.extend = r2.extend, Yn(n2), n2;
        }, Yn(Vn);
        var Kn = Vn.extend({ data: null }), Qn = Vn.extend({ data: null }), Gn = [9, 13, 27, 32], Xn = T && "CompositionEvent" in window, Jn = null;
        T && "documentMode" in document && (Jn = document.documentMode);
        var Zn = T && "TextEvent" in window && !Jn, er = T && (!Xn || Jn && 8 < Jn && 11 >= Jn), tr = String.fromCharCode(32), nr = { beforeInput: { phasedRegistrationNames: { bubbled: "onBeforeInput", captured: "onBeforeInputCapture" }, dependencies: ["compositionend", "keypress", "textInput", "paste"] }, compositionEnd: { phasedRegistrationNames: { bubbled: "onCompositionEnd", captured: "onCompositionEndCapture" }, dependencies: "blur compositionend keydown keypress keyup mousedown".split(" ") }, compositionStart: { phasedRegistrationNames: { bubbled: "onCompositionStart", captured: "onCompositionStartCapture" }, dependencies: "blur compositionstart keydown keypress keyup mousedown".split(" ") }, compositionUpdate: { phasedRegistrationNames: { bubbled: "onCompositionUpdate", captured: "onCompositionUpdateCapture" }, dependencies: "blur compositionupdate keydown keypress keyup mousedown".split(" ") } }, rr = false;
        function or(e2, t2) {
          switch (e2) {
            case "keyup":
              return -1 !== Gn.indexOf(t2.keyCode);
            case "keydown":
              return 229 !== t2.keyCode;
            case "keypress":
            case "mousedown":
            case "blur":
              return true;
            default:
              return false;
          }
        }
        function ir(e2) {
          return "object" == typeof (e2 = e2.detail) && "data" in e2 ? e2.data : null;
        }
        var ar = false;
        var sr = { eventTypes: nr, extractEvents: function(e2, t2, n2, r2) {
          var o2;
          if (Xn) e: {
            switch (e2) {
              case "compositionstart":
                var i2 = nr.compositionStart;
                break e;
              case "compositionend":
                i2 = nr.compositionEnd;
                break e;
              case "compositionupdate":
                i2 = nr.compositionUpdate;
                break e;
            }
            i2 = void 0;
          }
          else ar ? or(e2, n2) && (i2 = nr.compositionEnd) : "keydown" === e2 && 229 === n2.keyCode && (i2 = nr.compositionStart);
          return i2 ? (er && "ko" !== n2.locale && (ar || i2 !== nr.compositionStart ? i2 === nr.compositionEnd && ar && (o2 = Bn()) : (Un = "value" in (In = r2) ? In.value : In.textContent, ar = true)), i2 = Kn.getPooled(i2, t2, n2, r2), o2 ? i2.data = o2 : null !== (o2 = ir(n2)) && (i2.data = o2), Ln(i2), o2 = i2) : o2 = null, (e2 = Zn ? function(e3, t3) {
            switch (e3) {
              case "compositionend":
                return ir(t3);
              case "keypress":
                return 32 !== t3.which ? null : (rr = true, tr);
              case "textInput":
                return (e3 = t3.data) === tr && rr ? null : e3;
              default:
                return null;
            }
          }(e2, n2) : function(e3, t3) {
            if (ar) return "compositionend" === e3 || !Xn && or(e3, t3) ? (e3 = Bn(), Fn = Un = In = null, ar = false, e3) : null;
            switch (e3) {
              case "paste":
                return null;
              case "keypress":
                if (!(t3.ctrlKey || t3.altKey || t3.metaKey) || t3.ctrlKey && t3.altKey) {
                  if (t3.char && 1 < t3.char.length) return t3.char;
                  if (t3.which) return String.fromCharCode(t3.which);
                }
                return null;
              case "compositionend":
                return er && "ko" !== t3.locale ? null : t3.data;
              default:
                return null;
            }
          }(e2, n2)) ? ((t2 = Qn.getPooled(nr.beforeInput, t2, n2, r2)).data = e2, Ln(t2)) : t2 = null, null === o2 ? t2 : null === t2 ? o2 : [o2, t2];
        } }, lr = { color: true, date: true, datetime: true, "datetime-local": true, email: true, month: true, number: true, password: true, range: true, search: true, tel: true, text: true, time: true, url: true, week: true };
        function cr(e2) {
          var t2 = e2 && e2.nodeName && e2.nodeName.toLowerCase();
          return "input" === t2 ? !!lr[e2.type] : "textarea" === t2;
        }
        var ur = { change: { phasedRegistrationNames: { bubbled: "onChange", captured: "onChangeCapture" }, dependencies: "blur change click focus input keydown keyup selectionchange".split(" ") } };
        function pr(e2, t2, n2) {
          return (e2 = Vn.getPooled(ur.change, e2, t2, n2)).type = "change", R(n2), Ln(e2), e2;
        }
        var fr = null, dr = null;
        function hr(e2) {
          st(e2);
        }
        function mr(e2) {
          if (we(Nn(e2))) return e2;
        }
        function gr(e2, t2) {
          if ("change" === e2) return t2;
        }
        var yr = false;
        function br() {
          fr && (fr.detachEvent("onpropertychange", vr), dr = fr = null);
        }
        function vr(e2) {
          if ("value" === e2.propertyName && mr(dr)) if (e2 = pr(dr, e2, lt(e2)), I) st(e2);
          else {
            I = true;
            try {
              j(hr, e2);
            } finally {
              I = false, F();
            }
          }
        }
        function kr(e2, t2, n2) {
          "focus" === e2 ? (br(), dr = n2, (fr = t2).attachEvent("onpropertychange", vr)) : "blur" === e2 && br();
        }
        function wr(e2) {
          if ("selectionchange" === e2 || "keyup" === e2 || "keydown" === e2) return mr(dr);
        }
        function _r(e2, t2) {
          if ("click" === e2) return mr(t2);
        }
        function Er(e2, t2) {
          if ("input" === e2 || "change" === e2) return mr(t2);
        }
        T && (yr = ct("input") && (!document.documentMode || 9 < document.documentMode));
        var xr = { eventTypes: ur, _isInputEventSupported: yr, extractEvents: function(e2, t2, n2, r2) {
          var o2 = t2 ? Nn(t2) : window, i2 = o2.nodeName && o2.nodeName.toLowerCase();
          if ("select" === i2 || "input" === i2 && "file" === o2.type) var a2 = gr;
          else if (cr(o2)) if (yr) a2 = Er;
          else {
            a2 = wr;
            var s2 = kr;
          }
          else (i2 = o2.nodeName) && "input" === i2.toLowerCase() && ("checkbox" === o2.type || "radio" === o2.type) && (a2 = _r);
          if (a2 && (a2 = a2(e2, t2))) return pr(a2, n2, r2);
          s2 && s2(e2, o2, t2), "blur" === e2 && (e2 = o2._wrapperState) && e2.controlled && "number" === o2.type && Te(o2, "number", o2.value);
        } }, Sr = Vn.extend({ view: null, detail: null }), Cr = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
        function Tr(e2) {
          var t2 = this.nativeEvent;
          return t2.getModifierState ? t2.getModifierState(e2) : !!(e2 = Cr[e2]) && !!t2[e2];
        }
        function Or() {
          return Tr;
        }
        var Nr = 0, Pr = 0, Dr = false, Rr = false, Mr = Sr.extend({ screenX: null, screenY: null, clientX: null, clientY: null, pageX: null, pageY: null, ctrlKey: null, shiftKey: null, altKey: null, metaKey: null, getModifierState: Or, button: null, buttons: null, relatedTarget: function(e2) {
          return e2.relatedTarget || (e2.fromElement === e2.srcElement ? e2.toElement : e2.fromElement);
        }, movementX: function(e2) {
          if ("movementX" in e2) return e2.movementX;
          var t2 = Nr;
          return Nr = e2.screenX, Dr ? "mousemove" === e2.type ? e2.screenX - t2 : 0 : (Dr = true, 0);
        }, movementY: function(e2) {
          if ("movementY" in e2) return e2.movementY;
          var t2 = Pr;
          return Pr = e2.screenY, Rr ? "mousemove" === e2.type ? e2.screenY - t2 : 0 : (Rr = true, 0);
        } }), jr = Mr.extend({ pointerId: null, width: null, height: null, pressure: null, tangentialPressure: null, tiltX: null, tiltY: null, twist: null, pointerType: null, isPrimary: null }), Ar = { mouseEnter: { registrationName: "onMouseEnter", dependencies: ["mouseout", "mouseover"] }, mouseLeave: { registrationName: "onMouseLeave", dependencies: ["mouseout", "mouseover"] }, pointerEnter: { registrationName: "onPointerEnter", dependencies: ["pointerout", "pointerover"] }, pointerLeave: { registrationName: "onPointerLeave", dependencies: ["pointerout", "pointerover"] } }, zr = { eventTypes: Ar, extractEvents: function(e2, t2, n2, r2, o2) {
          var i2 = "mouseover" === e2 || "pointerover" === e2, a2 = "mouseout" === e2 || "pointerout" === e2;
          if (i2 && 0 == (32 & o2) && (n2.relatedTarget || n2.fromElement) || !a2 && !i2) return null;
          (i2 = r2.window === r2 ? r2 : (i2 = r2.ownerDocument) ? i2.defaultView || i2.parentWindow : window, a2) ? (a2 = t2, null !== (t2 = (t2 = n2.relatedTarget || n2.toElement) ? Tn(t2) : null) && (t2 !== Ze(t2) || 5 !== t2.tag && 6 !== t2.tag) && (t2 = null)) : a2 = null;
          if (a2 === t2) return null;
          if ("mouseout" === e2 || "mouseover" === e2) var s2 = Mr, l2 = Ar.mouseLeave, c2 = Ar.mouseEnter, u2 = "mouse";
          else "pointerout" !== e2 && "pointerover" !== e2 || (s2 = jr, l2 = Ar.pointerLeave, c2 = Ar.pointerEnter, u2 = "pointer");
          if (e2 = null == a2 ? i2 : Nn(a2), i2 = null == t2 ? i2 : Nn(t2), (l2 = s2.getPooled(l2, a2, n2, r2)).type = u2 + "leave", l2.target = e2, l2.relatedTarget = i2, (n2 = s2.getPooled(c2, t2, n2, r2)).type = u2 + "enter", n2.target = i2, n2.relatedTarget = e2, u2 = t2, (r2 = a2) && u2) e: {
            for (c2 = u2, a2 = 0, e2 = s2 = r2; e2; e2 = Dn(e2)) a2++;
            for (e2 = 0, t2 = c2; t2; t2 = Dn(t2)) e2++;
            for (; 0 < a2 - e2; ) s2 = Dn(s2), a2--;
            for (; 0 < e2 - a2; ) c2 = Dn(c2), e2--;
            for (; a2--; ) {
              if (s2 === c2 || s2 === c2.alternate) break e;
              s2 = Dn(s2), c2 = Dn(c2);
            }
            s2 = null;
          }
          else s2 = null;
          for (c2 = s2, s2 = []; r2 && r2 !== c2 && (null === (a2 = r2.alternate) || a2 !== c2); ) s2.push(r2), r2 = Dn(r2);
          for (r2 = []; u2 && u2 !== c2 && (null === (a2 = u2.alternate) || a2 !== c2); ) r2.push(u2), u2 = Dn(u2);
          for (u2 = 0; u2 < s2.length; u2++) An(s2[u2], "bubbled", l2);
          for (u2 = r2.length; 0 < u2--; ) An(r2[u2], "captured", n2);
          return 0 == (64 & o2) ? [l2] : [l2, n2];
        } };
        var Lr = "function" == typeof Object.is ? Object.is : function(e2, t2) {
          return e2 === t2 && (0 !== e2 || 1 / e2 == 1 / t2) || e2 != e2 && t2 != t2;
        }, Ir = Object.prototype.hasOwnProperty;
        function Ur(e2, t2) {
          if (Lr(e2, t2)) return true;
          if ("object" != typeof e2 || null === e2 || "object" != typeof t2 || null === t2) return false;
          var n2 = Object.keys(e2), r2 = Object.keys(t2);
          if (n2.length !== r2.length) return false;
          for (r2 = 0; r2 < n2.length; r2++) if (!Ir.call(t2, n2[r2]) || !Lr(e2[n2[r2]], t2[n2[r2]])) return false;
          return true;
        }
        var Fr = T && "documentMode" in document && 11 >= document.documentMode, Br = { select: { phasedRegistrationNames: { bubbled: "onSelect", captured: "onSelectCapture" }, dependencies: "blur contextmenu dragend focus keydown keyup mousedown mouseup selectionchange".split(" ") } }, Wr = null, Hr = null, Vr = null, $r = false;
        function qr(e2, t2) {
          var n2 = t2.window === t2 ? t2.document : 9 === t2.nodeType ? t2 : t2.ownerDocument;
          return $r || null == Wr || Wr !== un(n2) ? null : ("selectionStart" in (n2 = Wr) && hn(n2) ? n2 = { start: n2.selectionStart, end: n2.selectionEnd } : n2 = { anchorNode: (n2 = (n2.ownerDocument && n2.ownerDocument.defaultView || window).getSelection()).anchorNode, anchorOffset: n2.anchorOffset, focusNode: n2.focusNode, focusOffset: n2.focusOffset }, Vr && Ur(Vr, n2) ? null : (Vr = n2, (e2 = Vn.getPooled(Br.select, Hr, e2, t2)).type = "select", e2.target = Wr, Ln(e2), e2));
        }
        var Yr = { eventTypes: Br, extractEvents: function(e2, t2, n2, r2, o2, i2) {
          if (!(i2 = !(o2 = i2 || (r2.window === r2 ? r2.document : 9 === r2.nodeType ? r2 : r2.ownerDocument)))) {
            e: {
              o2 = Je(o2), i2 = S.onSelect;
              for (var a2 = 0; a2 < i2.length; a2++) if (!o2.has(i2[a2])) {
                o2 = false;
                break e;
              }
              o2 = true;
            }
            i2 = !o2;
          }
          if (i2) return null;
          switch (o2 = t2 ? Nn(t2) : window, e2) {
            case "focus":
              (cr(o2) || "true" === o2.contentEditable) && (Wr = o2, Hr = t2, Vr = null);
              break;
            case "blur":
              Vr = Hr = Wr = null;
              break;
            case "mousedown":
              $r = true;
              break;
            case "contextmenu":
            case "mouseup":
            case "dragend":
              return $r = false, qr(n2, r2);
            case "selectionchange":
              if (Fr) break;
            case "keydown":
            case "keyup":
              return qr(n2, r2);
          }
          return null;
        } }, Kr = Vn.extend({ animationName: null, elapsedTime: null, pseudoElement: null }), Qr = Vn.extend({ clipboardData: function(e2) {
          return "clipboardData" in e2 ? e2.clipboardData : window.clipboardData;
        } }), Gr = Sr.extend({ relatedTarget: null });
        function Xr(e2) {
          var t2 = e2.keyCode;
          return "charCode" in e2 ? 0 === (e2 = e2.charCode) && 13 === t2 && (e2 = 13) : e2 = t2, 10 === e2 && (e2 = 13), 32 <= e2 || 13 === e2 ? e2 : 0;
        }
        var Jr = { Esc: "Escape", Spacebar: " ", Left: "ArrowLeft", Up: "ArrowUp", Right: "ArrowRight", Down: "ArrowDown", Del: "Delete", Win: "OS", Menu: "ContextMenu", Apps: "ContextMenu", Scroll: "ScrollLock", MozPrintableKey: "Unidentified" }, Zr = { 8: "Backspace", 9: "Tab", 12: "Clear", 13: "Enter", 16: "Shift", 17: "Control", 18: "Alt", 19: "Pause", 20: "CapsLock", 27: "Escape", 32: " ", 33: "PageUp", 34: "PageDown", 35: "End", 36: "Home", 37: "ArrowLeft", 38: "ArrowUp", 39: "ArrowRight", 40: "ArrowDown", 45: "Insert", 46: "Delete", 112: "F1", 113: "F2", 114: "F3", 115: "F4", 116: "F5", 117: "F6", 118: "F7", 119: "F8", 120: "F9", 121: "F10", 122: "F11", 123: "F12", 144: "NumLock", 145: "ScrollLock", 224: "Meta" }, eo = Sr.extend({ key: function(e2) {
          if (e2.key) {
            var t2 = Jr[e2.key] || e2.key;
            if ("Unidentified" !== t2) return t2;
          }
          return "keypress" === e2.type ? 13 === (e2 = Xr(e2)) ? "Enter" : String.fromCharCode(e2) : "keydown" === e2.type || "keyup" === e2.type ? Zr[e2.keyCode] || "Unidentified" : "";
        }, location: null, ctrlKey: null, shiftKey: null, altKey: null, metaKey: null, repeat: null, locale: null, getModifierState: Or, charCode: function(e2) {
          return "keypress" === e2.type ? Xr(e2) : 0;
        }, keyCode: function(e2) {
          return "keydown" === e2.type || "keyup" === e2.type ? e2.keyCode : 0;
        }, which: function(e2) {
          return "keypress" === e2.type ? Xr(e2) : "keydown" === e2.type || "keyup" === e2.type ? e2.keyCode : 0;
        } }), to = Mr.extend({ dataTransfer: null }), no = Sr.extend({ touches: null, targetTouches: null, changedTouches: null, altKey: null, metaKey: null, ctrlKey: null, shiftKey: null, getModifierState: Or }), ro = Vn.extend({ propertyName: null, elapsedTime: null, pseudoElement: null }), oo = Mr.extend({ deltaX: function(e2) {
          return "deltaX" in e2 ? e2.deltaX : "wheelDeltaX" in e2 ? -e2.wheelDeltaX : 0;
        }, deltaY: function(e2) {
          return "deltaY" in e2 ? e2.deltaY : "wheelDeltaY" in e2 ? -e2.wheelDeltaY : "wheelDelta" in e2 ? -e2.wheelDelta : 0;
        }, deltaZ: null, deltaMode: null }), io = { eventTypes: Lt, extractEvents: function(e2, t2, n2, r2) {
          var o2 = It.get(e2);
          if (!o2) return null;
          switch (e2) {
            case "keypress":
              if (0 === Xr(n2)) return null;
            case "keydown":
            case "keyup":
              e2 = eo;
              break;
            case "blur":
            case "focus":
              e2 = Gr;
              break;
            case "click":
              if (2 === n2.button) return null;
            case "auxclick":
            case "dblclick":
            case "mousedown":
            case "mousemove":
            case "mouseup":
            case "mouseout":
            case "mouseover":
            case "contextmenu":
              e2 = Mr;
              break;
            case "drag":
            case "dragend":
            case "dragenter":
            case "dragexit":
            case "dragleave":
            case "dragover":
            case "dragstart":
            case "drop":
              e2 = to;
              break;
            case "touchcancel":
            case "touchend":
            case "touchmove":
            case "touchstart":
              e2 = no;
              break;
            case qe:
            case Ye:
            case Ke:
              e2 = Kr;
              break;
            case Qe:
              e2 = ro;
              break;
            case "scroll":
              e2 = Sr;
              break;
            case "wheel":
              e2 = oo;
              break;
            case "copy":
            case "cut":
            case "paste":
              e2 = Qr;
              break;
            case "gotpointercapture":
            case "lostpointercapture":
            case "pointercancel":
            case "pointerdown":
            case "pointermove":
            case "pointerout":
            case "pointerover":
            case "pointerup":
              e2 = jr;
              break;
            default:
              e2 = Vn;
          }
          return Ln(t2 = e2.getPooled(o2, t2, n2, r2)), t2;
        } };
        if (b) throw Error(a(101));
        b = Array.prototype.slice.call("ResponderEventPlugin SimpleEventPlugin EnterLeaveEventPlugin ChangeEventPlugin SelectEventPlugin BeforeInputEventPlugin".split(" ")), k(), h = Pn, m = On, g = Nn, C({ SimpleEventPlugin: io, EnterLeaveEventPlugin: zr, ChangeEventPlugin: xr, SelectEventPlugin: Yr, BeforeInputEventPlugin: sr });
        var ao = [], so = -1;
        function lo(e2) {
          0 > so || (e2.current = ao[so], ao[so] = null, so--);
        }
        function co(e2, t2) {
          so++, ao[so] = e2.current, e2.current = t2;
        }
        var uo = {}, po = { current: uo }, fo = { current: false }, ho = uo;
        function mo(e2, t2) {
          var n2 = e2.type.contextTypes;
          if (!n2) return uo;
          var r2 = e2.stateNode;
          if (r2 && r2.__reactInternalMemoizedUnmaskedChildContext === t2) return r2.__reactInternalMemoizedMaskedChildContext;
          var o2, i2 = {};
          for (o2 in n2) i2[o2] = t2[o2];
          return r2 && ((e2 = e2.stateNode).__reactInternalMemoizedUnmaskedChildContext = t2, e2.__reactInternalMemoizedMaskedChildContext = i2), i2;
        }
        function go(e2) {
          return null != (e2 = e2.childContextTypes);
        }
        function yo() {
          lo(fo), lo(po);
        }
        function bo(e2, t2, n2) {
          if (po.current !== uo) throw Error(a(168));
          co(po, t2), co(fo, n2);
        }
        function vo(e2, t2, n2) {
          var r2 = e2.stateNode;
          if (e2 = t2.childContextTypes, "function" != typeof r2.getChildContext) return n2;
          for (var i2 in r2 = r2.getChildContext()) if (!(i2 in e2)) throw Error(a(108, ge(t2) || "Unknown", i2));
          return o({}, n2, {}, r2);
        }
        function ko(e2) {
          return e2 = (e2 = e2.stateNode) && e2.__reactInternalMemoizedMergedChildContext || uo, ho = po.current, co(po, e2), co(fo, fo.current), true;
        }
        function wo(e2, t2, n2) {
          var r2 = e2.stateNode;
          if (!r2) throw Error(a(169));
          n2 ? (e2 = vo(e2, t2, ho), r2.__reactInternalMemoizedMergedChildContext = e2, lo(fo), lo(po), co(po, e2)) : lo(fo), co(fo, n2);
        }
        var _o = i.unstable_runWithPriority, Eo = i.unstable_scheduleCallback, xo = i.unstable_cancelCallback, So = i.unstable_requestPaint, Co = i.unstable_now, To = i.unstable_getCurrentPriorityLevel, Oo = i.unstable_ImmediatePriority, No = i.unstable_UserBlockingPriority, Po = i.unstable_NormalPriority, Do = i.unstable_LowPriority, Ro = i.unstable_IdlePriority, Mo = {}, jo = i.unstable_shouldYield, Ao = void 0 !== So ? So : function() {
        }, zo = null, Lo = null, Io = false, Uo = Co(), Fo = 1e4 > Uo ? Co : function() {
          return Co() - Uo;
        };
        function Bo() {
          switch (To()) {
            case Oo:
              return 99;
            case No:
              return 98;
            case Po:
              return 97;
            case Do:
              return 96;
            case Ro:
              return 95;
            default:
              throw Error(a(332));
          }
        }
        function Wo(e2) {
          switch (e2) {
            case 99:
              return Oo;
            case 98:
              return No;
            case 97:
              return Po;
            case 96:
              return Do;
            case 95:
              return Ro;
            default:
              throw Error(a(332));
          }
        }
        function Ho(e2, t2) {
          return e2 = Wo(e2), _o(e2, t2);
        }
        function Vo(e2, t2, n2) {
          return e2 = Wo(e2), Eo(e2, t2, n2);
        }
        function $o(e2) {
          return null === zo ? (zo = [e2], Lo = Eo(Oo, Yo)) : zo.push(e2), Mo;
        }
        function qo() {
          if (null !== Lo) {
            var e2 = Lo;
            Lo = null, xo(e2);
          }
          Yo();
        }
        function Yo() {
          if (!Io && null !== zo) {
            Io = true;
            var e2 = 0;
            try {
              var t2 = zo;
              Ho(99, function() {
                for (; e2 < t2.length; e2++) {
                  var n2 = t2[e2];
                  do {
                    n2 = n2(true);
                  } while (null !== n2);
                }
              }), zo = null;
            } catch (t3) {
              throw null !== zo && (zo = zo.slice(e2 + 1)), Eo(Oo, qo), t3;
            } finally {
              Io = false;
            }
          }
        }
        function Ko(e2, t2, n2) {
          return 1073741821 - (1 + ((1073741821 - e2 + t2 / 10) / (n2 /= 10) | 0)) * n2;
        }
        function Qo(e2, t2) {
          if (e2 && e2.defaultProps) for (var n2 in t2 = o({}, t2), e2 = e2.defaultProps) void 0 === t2[n2] && (t2[n2] = e2[n2]);
          return t2;
        }
        var Go = { current: null }, Xo = null, Jo = null, Zo = null;
        function ei() {
          Zo = Jo = Xo = null;
        }
        function ti(e2) {
          var t2 = Go.current;
          lo(Go), e2.type._context._currentValue = t2;
        }
        function ni(e2, t2) {
          for (; null !== e2; ) {
            var n2 = e2.alternate;
            if (e2.childExpirationTime < t2) e2.childExpirationTime = t2, null !== n2 && n2.childExpirationTime < t2 && (n2.childExpirationTime = t2);
            else {
              if (!(null !== n2 && n2.childExpirationTime < t2)) break;
              n2.childExpirationTime = t2;
            }
            e2 = e2.return;
          }
        }
        function ri(e2, t2) {
          Xo = e2, Zo = Jo = null, null !== (e2 = e2.dependencies) && null !== e2.firstContext && (e2.expirationTime >= t2 && (Pa = true), e2.firstContext = null);
        }
        function oi(e2, t2) {
          if (Zo !== e2 && false !== t2 && 0 !== t2) if ("number" == typeof t2 && 1073741823 !== t2 || (Zo = e2, t2 = 1073741823), t2 = { context: e2, observedBits: t2, next: null }, null === Jo) {
            if (null === Xo) throw Error(a(308));
            Jo = t2, Xo.dependencies = { expirationTime: 0, firstContext: t2, responders: null };
          } else Jo = Jo.next = t2;
          return e2._currentValue;
        }
        var ii = false;
        function ai(e2) {
          e2.updateQueue = { baseState: e2.memoizedState, baseQueue: null, shared: { pending: null }, effects: null };
        }
        function si(e2, t2) {
          e2 = e2.updateQueue, t2.updateQueue === e2 && (t2.updateQueue = { baseState: e2.baseState, baseQueue: e2.baseQueue, shared: e2.shared, effects: e2.effects });
        }
        function li(e2, t2) {
          return (e2 = { expirationTime: e2, suspenseConfig: t2, tag: 0, payload: null, callback: null, next: null }).next = e2;
        }
        function ci(e2, t2) {
          if (null !== (e2 = e2.updateQueue)) {
            var n2 = (e2 = e2.shared).pending;
            null === n2 ? t2.next = t2 : (t2.next = n2.next, n2.next = t2), e2.pending = t2;
          }
        }
        function ui(e2, t2) {
          var n2 = e2.alternate;
          null !== n2 && si(n2, e2), null === (n2 = (e2 = e2.updateQueue).baseQueue) ? (e2.baseQueue = t2.next = t2, t2.next = t2) : (t2.next = n2.next, n2.next = t2);
        }
        function pi(e2, t2, n2, r2) {
          var i2 = e2.updateQueue;
          ii = false;
          var a2 = i2.baseQueue, s2 = i2.shared.pending;
          if (null !== s2) {
            if (null !== a2) {
              var l2 = a2.next;
              a2.next = s2.next, s2.next = l2;
            }
            a2 = s2, i2.shared.pending = null, null !== (l2 = e2.alternate) && (null !== (l2 = l2.updateQueue) && (l2.baseQueue = s2));
          }
          if (null !== a2) {
            l2 = a2.next;
            var c2 = i2.baseState, u2 = 0, p2 = null, f2 = null, d2 = null;
            if (null !== l2) for (var h2 = l2; ; ) {
              if ((s2 = h2.expirationTime) < r2) {
                var m2 = { expirationTime: h2.expirationTime, suspenseConfig: h2.suspenseConfig, tag: h2.tag, payload: h2.payload, callback: h2.callback, next: null };
                null === d2 ? (f2 = d2 = m2, p2 = c2) : d2 = d2.next = m2, s2 > u2 && (u2 = s2);
              } else {
                null !== d2 && (d2 = d2.next = { expirationTime: 1073741823, suspenseConfig: h2.suspenseConfig, tag: h2.tag, payload: h2.payload, callback: h2.callback, next: null }), il(s2, h2.suspenseConfig);
                e: {
                  var g2 = e2, y2 = h2;
                  switch (s2 = t2, m2 = n2, y2.tag) {
                    case 1:
                      if ("function" == typeof (g2 = y2.payload)) {
                        c2 = g2.call(m2, c2, s2);
                        break e;
                      }
                      c2 = g2;
                      break e;
                    case 3:
                      g2.effectTag = -4097 & g2.effectTag | 64;
                    case 0:
                      if (null == (s2 = "function" == typeof (g2 = y2.payload) ? g2.call(m2, c2, s2) : g2)) break e;
                      c2 = o({}, c2, s2);
                      break e;
                    case 2:
                      ii = true;
                  }
                }
                null !== h2.callback && (e2.effectTag |= 32, null === (s2 = i2.effects) ? i2.effects = [h2] : s2.push(h2));
              }
              if (null === (h2 = h2.next) || h2 === l2) {
                if (null === (s2 = i2.shared.pending)) break;
                h2 = a2.next = s2.next, s2.next = l2, i2.baseQueue = a2 = s2, i2.shared.pending = null;
              }
            }
            null === d2 ? p2 = c2 : d2.next = f2, i2.baseState = p2, i2.baseQueue = d2, al(u2), e2.expirationTime = u2, e2.memoizedState = c2;
          }
        }
        function fi(e2, t2, n2) {
          if (e2 = t2.effects, t2.effects = null, null !== e2) for (t2 = 0; t2 < e2.length; t2++) {
            var r2 = e2[t2], o2 = r2.callback;
            if (null !== o2) {
              if (r2.callback = null, r2 = o2, o2 = n2, "function" != typeof r2) throw Error(a(191, r2));
              r2.call(o2);
            }
          }
        }
        var di = G.ReactCurrentBatchConfig, hi = new r.Component().refs;
        function mi(e2, t2, n2, r2) {
          n2 = null == (n2 = n2(r2, t2 = e2.memoizedState)) ? t2 : o({}, t2, n2), e2.memoizedState = n2, 0 === e2.expirationTime && (e2.updateQueue.baseState = n2);
        }
        var gi = { isMounted: function(e2) {
          return !!(e2 = e2._reactInternalFiber) && Ze(e2) === e2;
        }, enqueueSetState: function(e2, t2, n2) {
          e2 = e2._reactInternalFiber;
          var r2 = qs(), o2 = di.suspense;
          (o2 = li(r2 = Ys(r2, e2, o2), o2)).payload = t2, null != n2 && (o2.callback = n2), ci(e2, o2), Ks(e2, r2);
        }, enqueueReplaceState: function(e2, t2, n2) {
          e2 = e2._reactInternalFiber;
          var r2 = qs(), o2 = di.suspense;
          (o2 = li(r2 = Ys(r2, e2, o2), o2)).tag = 1, o2.payload = t2, null != n2 && (o2.callback = n2), ci(e2, o2), Ks(e2, r2);
        }, enqueueForceUpdate: function(e2, t2) {
          e2 = e2._reactInternalFiber;
          var n2 = qs(), r2 = di.suspense;
          (r2 = li(n2 = Ys(n2, e2, r2), r2)).tag = 2, null != t2 && (r2.callback = t2), ci(e2, r2), Ks(e2, n2);
        } };
        function yi(e2, t2, n2, r2, o2, i2, a2) {
          return "function" == typeof (e2 = e2.stateNode).shouldComponentUpdate ? e2.shouldComponentUpdate(r2, i2, a2) : !t2.prototype || !t2.prototype.isPureReactComponent || (!Ur(n2, r2) || !Ur(o2, i2));
        }
        function bi(e2, t2, n2) {
          var r2 = false, o2 = uo, i2 = t2.contextType;
          return "object" == typeof i2 && null !== i2 ? i2 = oi(i2) : (o2 = go(t2) ? ho : po.current, i2 = (r2 = null != (r2 = t2.contextTypes)) ? mo(e2, o2) : uo), t2 = new t2(n2, i2), e2.memoizedState = null !== t2.state && void 0 !== t2.state ? t2.state : null, t2.updater = gi, e2.stateNode = t2, t2._reactInternalFiber = e2, r2 && ((e2 = e2.stateNode).__reactInternalMemoizedUnmaskedChildContext = o2, e2.__reactInternalMemoizedMaskedChildContext = i2), t2;
        }
        function vi(e2, t2, n2, r2) {
          e2 = t2.state, "function" == typeof t2.componentWillReceiveProps && t2.componentWillReceiveProps(n2, r2), "function" == typeof t2.UNSAFE_componentWillReceiveProps && t2.UNSAFE_componentWillReceiveProps(n2, r2), t2.state !== e2 && gi.enqueueReplaceState(t2, t2.state, null);
        }
        function ki(e2, t2, n2, r2) {
          var o2 = e2.stateNode;
          o2.props = n2, o2.state = e2.memoizedState, o2.refs = hi, ai(e2);
          var i2 = t2.contextType;
          "object" == typeof i2 && null !== i2 ? o2.context = oi(i2) : (i2 = go(t2) ? ho : po.current, o2.context = mo(e2, i2)), pi(e2, n2, o2, r2), o2.state = e2.memoizedState, "function" == typeof (i2 = t2.getDerivedStateFromProps) && (mi(e2, t2, i2, n2), o2.state = e2.memoizedState), "function" == typeof t2.getDerivedStateFromProps || "function" == typeof o2.getSnapshotBeforeUpdate || "function" != typeof o2.UNSAFE_componentWillMount && "function" != typeof o2.componentWillMount || (t2 = o2.state, "function" == typeof o2.componentWillMount && o2.componentWillMount(), "function" == typeof o2.UNSAFE_componentWillMount && o2.UNSAFE_componentWillMount(), t2 !== o2.state && gi.enqueueReplaceState(o2, o2.state, null), pi(e2, n2, o2, r2), o2.state = e2.memoizedState), "function" == typeof o2.componentDidMount && (e2.effectTag |= 4);
        }
        var wi = Array.isArray;
        function _i(e2, t2, n2) {
          if (null !== (e2 = n2.ref) && "function" != typeof e2 && "object" != typeof e2) {
            if (n2._owner) {
              if (n2 = n2._owner) {
                if (1 !== n2.tag) throw Error(a(309));
                var r2 = n2.stateNode;
              }
              if (!r2) throw Error(a(147, e2));
              var o2 = "" + e2;
              return null !== t2 && null !== t2.ref && "function" == typeof t2.ref && t2.ref._stringRef === o2 ? t2.ref : ((t2 = function(e3) {
                var t3 = r2.refs;
                t3 === hi && (t3 = r2.refs = {}), null === e3 ? delete t3[o2] : t3[o2] = e3;
              })._stringRef = o2, t2);
            }
            if ("string" != typeof e2) throw Error(a(284));
            if (!n2._owner) throw Error(a(290, e2));
          }
          return e2;
        }
        function Ei(e2, t2) {
          if ("textarea" !== e2.type) throw Error(a(31, "[object Object]" === Object.prototype.toString.call(t2) ? "object with keys {" + Object.keys(t2).join(", ") + "}" : t2, ""));
        }
        function xi(e2) {
          function t2(t3, n3) {
            if (e2) {
              var r3 = t3.lastEffect;
              null !== r3 ? (r3.nextEffect = n3, t3.lastEffect = n3) : t3.firstEffect = t3.lastEffect = n3, n3.nextEffect = null, n3.effectTag = 8;
            }
          }
          function n2(n3, r3) {
            if (!e2) return null;
            for (; null !== r3; ) t2(n3, r3), r3 = r3.sibling;
            return null;
          }
          function r2(e3, t3) {
            for (e3 = /* @__PURE__ */ new Map(); null !== t3; ) null !== t3.key ? e3.set(t3.key, t3) : e3.set(t3.index, t3), t3 = t3.sibling;
            return e3;
          }
          function o2(e3, t3) {
            return (e3 = Cl(e3, t3)).index = 0, e3.sibling = null, e3;
          }
          function i2(t3, n3, r3) {
            return t3.index = r3, e2 ? null !== (r3 = t3.alternate) ? (r3 = r3.index) < n3 ? (t3.effectTag = 2, n3) : r3 : (t3.effectTag = 2, n3) : n3;
          }
          function s2(t3) {
            return e2 && null === t3.alternate && (t3.effectTag = 2), t3;
          }
          function l2(e3, t3, n3, r3) {
            return null === t3 || 6 !== t3.tag ? ((t3 = Nl(n3, e3.mode, r3)).return = e3, t3) : ((t3 = o2(t3, n3)).return = e3, t3);
          }
          function c2(e3, t3, n3, r3) {
            return null !== t3 && t3.elementType === n3.type ? ((r3 = o2(t3, n3.props)).ref = _i(e3, t3, n3), r3.return = e3, r3) : ((r3 = Tl(n3.type, n3.key, n3.props, null, e3.mode, r3)).ref = _i(e3, t3, n3), r3.return = e3, r3);
          }
          function u2(e3, t3, n3, r3) {
            return null === t3 || 4 !== t3.tag || t3.stateNode.containerInfo !== n3.containerInfo || t3.stateNode.implementation !== n3.implementation ? ((t3 = Pl(n3, e3.mode, r3)).return = e3, t3) : ((t3 = o2(t3, n3.children || [])).return = e3, t3);
          }
          function p2(e3, t3, n3, r3, i3) {
            return null === t3 || 7 !== t3.tag ? ((t3 = Ol(n3, e3.mode, r3, i3)).return = e3, t3) : ((t3 = o2(t3, n3)).return = e3, t3);
          }
          function f2(e3, t3, n3) {
            if ("string" == typeof t3 || "number" == typeof t3) return (t3 = Nl("" + t3, e3.mode, n3)).return = e3, t3;
            if ("object" == typeof t3 && null !== t3) {
              switch (t3.$$typeof) {
                case ee:
                  return (n3 = Tl(t3.type, t3.key, t3.props, null, e3.mode, n3)).ref = _i(e3, null, t3), n3.return = e3, n3;
                case te:
                  return (t3 = Pl(t3, e3.mode, n3)).return = e3, t3;
              }
              if (wi(t3) || me(t3)) return (t3 = Ol(t3, e3.mode, n3, null)).return = e3, t3;
              Ei(e3, t3);
            }
            return null;
          }
          function d2(e3, t3, n3, r3) {
            var o3 = null !== t3 ? t3.key : null;
            if ("string" == typeof n3 || "number" == typeof n3) return null !== o3 ? null : l2(e3, t3, "" + n3, r3);
            if ("object" == typeof n3 && null !== n3) {
              switch (n3.$$typeof) {
                case ee:
                  return n3.key === o3 ? n3.type === ne ? p2(e3, t3, n3.props.children, r3, o3) : c2(e3, t3, n3, r3) : null;
                case te:
                  return n3.key === o3 ? u2(e3, t3, n3, r3) : null;
              }
              if (wi(n3) || me(n3)) return null !== o3 ? null : p2(e3, t3, n3, r3, null);
              Ei(e3, n3);
            }
            return null;
          }
          function h2(e3, t3, n3, r3, o3) {
            if ("string" == typeof r3 || "number" == typeof r3) return l2(t3, e3 = e3.get(n3) || null, "" + r3, o3);
            if ("object" == typeof r3 && null !== r3) {
              switch (r3.$$typeof) {
                case ee:
                  return e3 = e3.get(null === r3.key ? n3 : r3.key) || null, r3.type === ne ? p2(t3, e3, r3.props.children, o3, r3.key) : c2(t3, e3, r3, o3);
                case te:
                  return u2(t3, e3 = e3.get(null === r3.key ? n3 : r3.key) || null, r3, o3);
              }
              if (wi(r3) || me(r3)) return p2(t3, e3 = e3.get(n3) || null, r3, o3, null);
              Ei(t3, r3);
            }
            return null;
          }
          function m2(o3, a2, s3, l3) {
            for (var c3 = null, u3 = null, p3 = a2, m3 = a2 = 0, g3 = null; null !== p3 && m3 < s3.length; m3++) {
              p3.index > m3 ? (g3 = p3, p3 = null) : g3 = p3.sibling;
              var y2 = d2(o3, p3, s3[m3], l3);
              if (null === y2) {
                null === p3 && (p3 = g3);
                break;
              }
              e2 && p3 && null === y2.alternate && t2(o3, p3), a2 = i2(y2, a2, m3), null === u3 ? c3 = y2 : u3.sibling = y2, u3 = y2, p3 = g3;
            }
            if (m3 === s3.length) return n2(o3, p3), c3;
            if (null === p3) {
              for (; m3 < s3.length; m3++) null !== (p3 = f2(o3, s3[m3], l3)) && (a2 = i2(p3, a2, m3), null === u3 ? c3 = p3 : u3.sibling = p3, u3 = p3);
              return c3;
            }
            for (p3 = r2(o3, p3); m3 < s3.length; m3++) null !== (g3 = h2(p3, o3, m3, s3[m3], l3)) && (e2 && null !== g3.alternate && p3.delete(null === g3.key ? m3 : g3.key), a2 = i2(g3, a2, m3), null === u3 ? c3 = g3 : u3.sibling = g3, u3 = g3);
            return e2 && p3.forEach(function(e3) {
              return t2(o3, e3);
            }), c3;
          }
          function g2(o3, s3, l3, c3) {
            var u3 = me(l3);
            if ("function" != typeof u3) throw Error(a(150));
            if (null == (l3 = u3.call(l3))) throw Error(a(151));
            for (var p3 = u3 = null, m3 = s3, g3 = s3 = 0, y2 = null, b2 = l3.next(); null !== m3 && !b2.done; g3++, b2 = l3.next()) {
              m3.index > g3 ? (y2 = m3, m3 = null) : y2 = m3.sibling;
              var v2 = d2(o3, m3, b2.value, c3);
              if (null === v2) {
                null === m3 && (m3 = y2);
                break;
              }
              e2 && m3 && null === v2.alternate && t2(o3, m3), s3 = i2(v2, s3, g3), null === p3 ? u3 = v2 : p3.sibling = v2, p3 = v2, m3 = y2;
            }
            if (b2.done) return n2(o3, m3), u3;
            if (null === m3) {
              for (; !b2.done; g3++, b2 = l3.next()) null !== (b2 = f2(o3, b2.value, c3)) && (s3 = i2(b2, s3, g3), null === p3 ? u3 = b2 : p3.sibling = b2, p3 = b2);
              return u3;
            }
            for (m3 = r2(o3, m3); !b2.done; g3++, b2 = l3.next()) null !== (b2 = h2(m3, o3, g3, b2.value, c3)) && (e2 && null !== b2.alternate && m3.delete(null === b2.key ? g3 : b2.key), s3 = i2(b2, s3, g3), null === p3 ? u3 = b2 : p3.sibling = b2, p3 = b2);
            return e2 && m3.forEach(function(e3) {
              return t2(o3, e3);
            }), u3;
          }
          return function(e3, r3, i3, l3) {
            var c3 = "object" == typeof i3 && null !== i3 && i3.type === ne && null === i3.key;
            c3 && (i3 = i3.props.children);
            var u3 = "object" == typeof i3 && null !== i3;
            if (u3) switch (i3.$$typeof) {
              case ee:
                e: {
                  for (u3 = i3.key, c3 = r3; null !== c3; ) {
                    if (c3.key === u3) {
                      switch (c3.tag) {
                        case 7:
                          if (i3.type === ne) {
                            n2(e3, c3.sibling), (r3 = o2(c3, i3.props.children)).return = e3, e3 = r3;
                            break e;
                          }
                          break;
                        default:
                          if (c3.elementType === i3.type) {
                            n2(e3, c3.sibling), (r3 = o2(c3, i3.props)).ref = _i(e3, c3, i3), r3.return = e3, e3 = r3;
                            break e;
                          }
                      }
                      n2(e3, c3);
                      break;
                    }
                    t2(e3, c3), c3 = c3.sibling;
                  }
                  i3.type === ne ? ((r3 = Ol(i3.props.children, e3.mode, l3, i3.key)).return = e3, e3 = r3) : ((l3 = Tl(i3.type, i3.key, i3.props, null, e3.mode, l3)).ref = _i(e3, r3, i3), l3.return = e3, e3 = l3);
                }
                return s2(e3);
              case te:
                e: {
                  for (c3 = i3.key; null !== r3; ) {
                    if (r3.key === c3) {
                      if (4 === r3.tag && r3.stateNode.containerInfo === i3.containerInfo && r3.stateNode.implementation === i3.implementation) {
                        n2(e3, r3.sibling), (r3 = o2(r3, i3.children || [])).return = e3, e3 = r3;
                        break e;
                      }
                      n2(e3, r3);
                      break;
                    }
                    t2(e3, r3), r3 = r3.sibling;
                  }
                  (r3 = Pl(i3, e3.mode, l3)).return = e3, e3 = r3;
                }
                return s2(e3);
            }
            if ("string" == typeof i3 || "number" == typeof i3) return i3 = "" + i3, null !== r3 && 6 === r3.tag ? (n2(e3, r3.sibling), (r3 = o2(r3, i3)).return = e3, e3 = r3) : (n2(e3, r3), (r3 = Nl(i3, e3.mode, l3)).return = e3, e3 = r3), s2(e3);
            if (wi(i3)) return m2(e3, r3, i3, l3);
            if (me(i3)) return g2(e3, r3, i3, l3);
            if (u3 && Ei(e3, i3), void 0 === i3 && !c3) switch (e3.tag) {
              case 1:
              case 0:
                throw e3 = e3.type, Error(a(152, e3.displayName || e3.name || "Component"));
            }
            return n2(e3, r3);
          };
        }
        var Si = xi(true), Ci = xi(false), Ti = {}, Oi = { current: Ti }, Ni = { current: Ti }, Pi = { current: Ti };
        function Di(e2) {
          if (e2 === Ti) throw Error(a(174));
          return e2;
        }
        function Ri(e2, t2) {
          switch (co(Pi, t2), co(Ni, e2), co(Oi, Ti), e2 = t2.nodeType) {
            case 9:
            case 11:
              t2 = (t2 = t2.documentElement) ? t2.namespaceURI : Le(null, "");
              break;
            default:
              t2 = Le(t2 = (e2 = 8 === e2 ? t2.parentNode : t2).namespaceURI || null, e2 = e2.tagName);
          }
          lo(Oi), co(Oi, t2);
        }
        function Mi() {
          lo(Oi), lo(Ni), lo(Pi);
        }
        function ji(e2) {
          Di(Pi.current);
          var t2 = Di(Oi.current), n2 = Le(t2, e2.type);
          t2 !== n2 && (co(Ni, e2), co(Oi, n2));
        }
        function Ai(e2) {
          Ni.current === e2 && (lo(Oi), lo(Ni));
        }
        var zi = { current: 0 };
        function Li(e2) {
          for (var t2 = e2; null !== t2; ) {
            if (13 === t2.tag) {
              var n2 = t2.memoizedState;
              if (null !== n2 && (null === (n2 = n2.dehydrated) || "$?" === n2.data || "$!" === n2.data)) return t2;
            } else if (19 === t2.tag && void 0 !== t2.memoizedProps.revealOrder) {
              if (0 != (64 & t2.effectTag)) return t2;
            } else if (null !== t2.child) {
              t2.child.return = t2, t2 = t2.child;
              continue;
            }
            if (t2 === e2) break;
            for (; null === t2.sibling; ) {
              if (null === t2.return || t2.return === e2) return null;
              t2 = t2.return;
            }
            t2.sibling.return = t2.return, t2 = t2.sibling;
          }
          return null;
        }
        function Ii(e2, t2) {
          return { responder: e2, props: t2 };
        }
        var Ui = G.ReactCurrentDispatcher, Fi = G.ReactCurrentBatchConfig, Bi = 0, Wi = null, Hi = null, Vi = null, $i = false;
        function qi() {
          throw Error(a(321));
        }
        function Yi(e2, t2) {
          if (null === t2) return false;
          for (var n2 = 0; n2 < t2.length && n2 < e2.length; n2++) if (!Lr(e2[n2], t2[n2])) return false;
          return true;
        }
        function Ki(e2, t2, n2, r2, o2, i2) {
          if (Bi = i2, Wi = t2, t2.memoizedState = null, t2.updateQueue = null, t2.expirationTime = 0, Ui.current = null === e2 || null === e2.memoizedState ? ya : ba, e2 = n2(r2, o2), t2.expirationTime === Bi) {
            i2 = 0;
            do {
              if (t2.expirationTime = 0, !(25 > i2)) throw Error(a(301));
              i2 += 1, Vi = Hi = null, t2.updateQueue = null, Ui.current = va, e2 = n2(r2, o2);
            } while (t2.expirationTime === Bi);
          }
          if (Ui.current = ga, t2 = null !== Hi && null !== Hi.next, Bi = 0, Vi = Hi = Wi = null, $i = false, t2) throw Error(a(300));
          return e2;
        }
        function Qi() {
          var e2 = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
          return null === Vi ? Wi.memoizedState = Vi = e2 : Vi = Vi.next = e2, Vi;
        }
        function Gi() {
          if (null === Hi) {
            var e2 = Wi.alternate;
            e2 = null !== e2 ? e2.memoizedState : null;
          } else e2 = Hi.next;
          var t2 = null === Vi ? Wi.memoizedState : Vi.next;
          if (null !== t2) Vi = t2, Hi = e2;
          else {
            if (null === e2) throw Error(a(310));
            e2 = { memoizedState: (Hi = e2).memoizedState, baseState: Hi.baseState, baseQueue: Hi.baseQueue, queue: Hi.queue, next: null }, null === Vi ? Wi.memoizedState = Vi = e2 : Vi = Vi.next = e2;
          }
          return Vi;
        }
        function Xi(e2, t2) {
          return "function" == typeof t2 ? t2(e2) : t2;
        }
        function Ji(e2) {
          var t2 = Gi(), n2 = t2.queue;
          if (null === n2) throw Error(a(311));
          n2.lastRenderedReducer = e2;
          var r2 = Hi, o2 = r2.baseQueue, i2 = n2.pending;
          if (null !== i2) {
            if (null !== o2) {
              var s2 = o2.next;
              o2.next = i2.next, i2.next = s2;
            }
            r2.baseQueue = o2 = i2, n2.pending = null;
          }
          if (null !== o2) {
            o2 = o2.next, r2 = r2.baseState;
            var l2 = s2 = i2 = null, c2 = o2;
            do {
              var u2 = c2.expirationTime;
              if (u2 < Bi) {
                var p2 = { expirationTime: c2.expirationTime, suspenseConfig: c2.suspenseConfig, action: c2.action, eagerReducer: c2.eagerReducer, eagerState: c2.eagerState, next: null };
                null === l2 ? (s2 = l2 = p2, i2 = r2) : l2 = l2.next = p2, u2 > Wi.expirationTime && (Wi.expirationTime = u2, al(u2));
              } else null !== l2 && (l2 = l2.next = { expirationTime: 1073741823, suspenseConfig: c2.suspenseConfig, action: c2.action, eagerReducer: c2.eagerReducer, eagerState: c2.eagerState, next: null }), il(u2, c2.suspenseConfig), r2 = c2.eagerReducer === e2 ? c2.eagerState : e2(r2, c2.action);
              c2 = c2.next;
            } while (null !== c2 && c2 !== o2);
            null === l2 ? i2 = r2 : l2.next = s2, Lr(r2, t2.memoizedState) || (Pa = true), t2.memoizedState = r2, t2.baseState = i2, t2.baseQueue = l2, n2.lastRenderedState = r2;
          }
          return [t2.memoizedState, n2.dispatch];
        }
        function Zi(e2) {
          var t2 = Gi(), n2 = t2.queue;
          if (null === n2) throw Error(a(311));
          n2.lastRenderedReducer = e2;
          var r2 = n2.dispatch, o2 = n2.pending, i2 = t2.memoizedState;
          if (null !== o2) {
            n2.pending = null;
            var s2 = o2 = o2.next;
            do {
              i2 = e2(i2, s2.action), s2 = s2.next;
            } while (s2 !== o2);
            Lr(i2, t2.memoizedState) || (Pa = true), t2.memoizedState = i2, null === t2.baseQueue && (t2.baseState = i2), n2.lastRenderedState = i2;
          }
          return [i2, r2];
        }
        function ea(e2) {
          var t2 = Qi();
          return "function" == typeof e2 && (e2 = e2()), t2.memoizedState = t2.baseState = e2, e2 = (e2 = t2.queue = { pending: null, dispatch: null, lastRenderedReducer: Xi, lastRenderedState: e2 }).dispatch = ma.bind(null, Wi, e2), [t2.memoizedState, e2];
        }
        function ta(e2, t2, n2, r2) {
          return e2 = { tag: e2, create: t2, destroy: n2, deps: r2, next: null }, null === (t2 = Wi.updateQueue) ? (t2 = { lastEffect: null }, Wi.updateQueue = t2, t2.lastEffect = e2.next = e2) : null === (n2 = t2.lastEffect) ? t2.lastEffect = e2.next = e2 : (r2 = n2.next, n2.next = e2, e2.next = r2, t2.lastEffect = e2), e2;
        }
        function na() {
          return Gi().memoizedState;
        }
        function ra(e2, t2, n2, r2) {
          var o2 = Qi();
          Wi.effectTag |= e2, o2.memoizedState = ta(1 | t2, n2, void 0, void 0 === r2 ? null : r2);
        }
        function oa(e2, t2, n2, r2) {
          var o2 = Gi();
          r2 = void 0 === r2 ? null : r2;
          var i2 = void 0;
          if (null !== Hi) {
            var a2 = Hi.memoizedState;
            if (i2 = a2.destroy, null !== r2 && Yi(r2, a2.deps)) return void ta(t2, n2, i2, r2);
          }
          Wi.effectTag |= e2, o2.memoizedState = ta(1 | t2, n2, i2, r2);
        }
        function ia(e2, t2) {
          return ra(516, 4, e2, t2);
        }
        function aa(e2, t2) {
          return oa(516, 4, e2, t2);
        }
        function sa(e2, t2) {
          return oa(4, 2, e2, t2);
        }
        function la(e2, t2) {
          return "function" == typeof t2 ? (e2 = e2(), t2(e2), function() {
            t2(null);
          }) : null != t2 ? (e2 = e2(), t2.current = e2, function() {
            t2.current = null;
          }) : void 0;
        }
        function ca(e2, t2, n2) {
          return n2 = null != n2 ? n2.concat([e2]) : null, oa(4, 2, la.bind(null, t2, e2), n2);
        }
        function ua() {
        }
        function pa(e2, t2) {
          return Qi().memoizedState = [e2, void 0 === t2 ? null : t2], e2;
        }
        function fa(e2, t2) {
          var n2 = Gi();
          t2 = void 0 === t2 ? null : t2;
          var r2 = n2.memoizedState;
          return null !== r2 && null !== t2 && Yi(t2, r2[1]) ? r2[0] : (n2.memoizedState = [e2, t2], e2);
        }
        function da(e2, t2) {
          var n2 = Gi();
          t2 = void 0 === t2 ? null : t2;
          var r2 = n2.memoizedState;
          return null !== r2 && null !== t2 && Yi(t2, r2[1]) ? r2[0] : (e2 = e2(), n2.memoizedState = [e2, t2], e2);
        }
        function ha(e2, t2, n2) {
          var r2 = Bo();
          Ho(98 > r2 ? 98 : r2, function() {
            e2(true);
          }), Ho(97 < r2 ? 97 : r2, function() {
            var r3 = Fi.suspense;
            Fi.suspense = void 0 === t2 ? null : t2;
            try {
              e2(false), n2();
            } finally {
              Fi.suspense = r3;
            }
          });
        }
        function ma(e2, t2, n2) {
          var r2 = qs(), o2 = di.suspense;
          o2 = { expirationTime: r2 = Ys(r2, e2, o2), suspenseConfig: o2, action: n2, eagerReducer: null, eagerState: null, next: null };
          var i2 = t2.pending;
          if (null === i2 ? o2.next = o2 : (o2.next = i2.next, i2.next = o2), t2.pending = o2, i2 = e2.alternate, e2 === Wi || null !== i2 && i2 === Wi) $i = true, o2.expirationTime = Bi, Wi.expirationTime = Bi;
          else {
            if (0 === e2.expirationTime && (null === i2 || 0 === i2.expirationTime) && null !== (i2 = t2.lastRenderedReducer)) try {
              var a2 = t2.lastRenderedState, s2 = i2(a2, n2);
              if (o2.eagerReducer = i2, o2.eagerState = s2, Lr(s2, a2)) return;
            } catch (e3) {
            }
            Ks(e2, r2);
          }
        }
        var ga = { readContext: oi, useCallback: qi, useContext: qi, useEffect: qi, useImperativeHandle: qi, useLayoutEffect: qi, useMemo: qi, useReducer: qi, useRef: qi, useState: qi, useDebugValue: qi, useResponder: qi, useDeferredValue: qi, useTransition: qi }, ya = { readContext: oi, useCallback: pa, useContext: oi, useEffect: ia, useImperativeHandle: function(e2, t2, n2) {
          return n2 = null != n2 ? n2.concat([e2]) : null, ra(4, 2, la.bind(null, t2, e2), n2);
        }, useLayoutEffect: function(e2, t2) {
          return ra(4, 2, e2, t2);
        }, useMemo: function(e2, t2) {
          var n2 = Qi();
          return t2 = void 0 === t2 ? null : t2, e2 = e2(), n2.memoizedState = [e2, t2], e2;
        }, useReducer: function(e2, t2, n2) {
          var r2 = Qi();
          return t2 = void 0 !== n2 ? n2(t2) : t2, r2.memoizedState = r2.baseState = t2, e2 = (e2 = r2.queue = { pending: null, dispatch: null, lastRenderedReducer: e2, lastRenderedState: t2 }).dispatch = ma.bind(null, Wi, e2), [r2.memoizedState, e2];
        }, useRef: function(e2) {
          return e2 = { current: e2 }, Qi().memoizedState = e2;
        }, useState: ea, useDebugValue: ua, useResponder: Ii, useDeferredValue: function(e2, t2) {
          var n2 = ea(e2), r2 = n2[0], o2 = n2[1];
          return ia(function() {
            var n3 = Fi.suspense;
            Fi.suspense = void 0 === t2 ? null : t2;
            try {
              o2(e2);
            } finally {
              Fi.suspense = n3;
            }
          }, [e2, t2]), r2;
        }, useTransition: function(e2) {
          var t2 = ea(false), n2 = t2[0];
          return t2 = t2[1], [pa(ha.bind(null, t2, e2), [t2, e2]), n2];
        } }, ba = { readContext: oi, useCallback: fa, useContext: oi, useEffect: aa, useImperativeHandle: ca, useLayoutEffect: sa, useMemo: da, useReducer: Ji, useRef: na, useState: function() {
          return Ji(Xi);
        }, useDebugValue: ua, useResponder: Ii, useDeferredValue: function(e2, t2) {
          var n2 = Ji(Xi), r2 = n2[0], o2 = n2[1];
          return aa(function() {
            var n3 = Fi.suspense;
            Fi.suspense = void 0 === t2 ? null : t2;
            try {
              o2(e2);
            } finally {
              Fi.suspense = n3;
            }
          }, [e2, t2]), r2;
        }, useTransition: function(e2) {
          var t2 = Ji(Xi), n2 = t2[0];
          return t2 = t2[1], [fa(ha.bind(null, t2, e2), [t2, e2]), n2];
        } }, va = { readContext: oi, useCallback: fa, useContext: oi, useEffect: aa, useImperativeHandle: ca, useLayoutEffect: sa, useMemo: da, useReducer: Zi, useRef: na, useState: function() {
          return Zi(Xi);
        }, useDebugValue: ua, useResponder: Ii, useDeferredValue: function(e2, t2) {
          var n2 = Zi(Xi), r2 = n2[0], o2 = n2[1];
          return aa(function() {
            var n3 = Fi.suspense;
            Fi.suspense = void 0 === t2 ? null : t2;
            try {
              o2(e2);
            } finally {
              Fi.suspense = n3;
            }
          }, [e2, t2]), r2;
        }, useTransition: function(e2) {
          var t2 = Zi(Xi), n2 = t2[0];
          return t2 = t2[1], [fa(ha.bind(null, t2, e2), [t2, e2]), n2];
        } }, ka = null, wa = null, _a = false;
        function Ea(e2, t2) {
          var n2 = xl(5, null, null, 0);
          n2.elementType = "DELETED", n2.type = "DELETED", n2.stateNode = t2, n2.return = e2, n2.effectTag = 8, null !== e2.lastEffect ? (e2.lastEffect.nextEffect = n2, e2.lastEffect = n2) : e2.firstEffect = e2.lastEffect = n2;
        }
        function xa(e2, t2) {
          switch (e2.tag) {
            case 5:
              var n2 = e2.type;
              return null !== (t2 = 1 !== t2.nodeType || n2.toLowerCase() !== t2.nodeName.toLowerCase() ? null : t2) && (e2.stateNode = t2, true);
            case 6:
              return null !== (t2 = "" === e2.pendingProps || 3 !== t2.nodeType ? null : t2) && (e2.stateNode = t2, true);
            case 13:
            default:
              return false;
          }
        }
        function Sa(e2) {
          if (_a) {
            var t2 = wa;
            if (t2) {
              var n2 = t2;
              if (!xa(e2, t2)) {
                if (!(t2 = wn(n2.nextSibling)) || !xa(e2, t2)) return e2.effectTag = -1025 & e2.effectTag | 2, _a = false, void (ka = e2);
                Ea(ka, n2);
              }
              ka = e2, wa = wn(t2.firstChild);
            } else e2.effectTag = -1025 & e2.effectTag | 2, _a = false, ka = e2;
          }
        }
        function Ca(e2) {
          for (e2 = e2.return; null !== e2 && 5 !== e2.tag && 3 !== e2.tag && 13 !== e2.tag; ) e2 = e2.return;
          ka = e2;
        }
        function Ta(e2) {
          if (e2 !== ka) return false;
          if (!_a) return Ca(e2), _a = true, false;
          var t2 = e2.type;
          if (5 !== e2.tag || "head" !== t2 && "body" !== t2 && !bn(t2, e2.memoizedProps)) for (t2 = wa; t2; ) Ea(e2, t2), t2 = wn(t2.nextSibling);
          if (Ca(e2), 13 === e2.tag) {
            if (!(e2 = null !== (e2 = e2.memoizedState) ? e2.dehydrated : null)) throw Error(a(317));
            e: {
              for (e2 = e2.nextSibling, t2 = 0; e2; ) {
                if (8 === e2.nodeType) {
                  var n2 = e2.data;
                  if ("/$" === n2) {
                    if (0 === t2) {
                      wa = wn(e2.nextSibling);
                      break e;
                    }
                    t2--;
                  } else "$" !== n2 && "$!" !== n2 && "$?" !== n2 || t2++;
                }
                e2 = e2.nextSibling;
              }
              wa = null;
            }
          } else wa = ka ? wn(e2.stateNode.nextSibling) : null;
          return true;
        }
        function Oa() {
          wa = ka = null, _a = false;
        }
        var Na = G.ReactCurrentOwner, Pa = false;
        function Da(e2, t2, n2, r2) {
          t2.child = null === e2 ? Ci(t2, null, n2, r2) : Si(t2, e2.child, n2, r2);
        }
        function Ra(e2, t2, n2, r2, o2) {
          n2 = n2.render;
          var i2 = t2.ref;
          return ri(t2, o2), r2 = Ki(e2, t2, n2, r2, i2, o2), null === e2 || Pa ? (t2.effectTag |= 1, Da(e2, t2, r2, o2), t2.child) : (t2.updateQueue = e2.updateQueue, t2.effectTag &= -517, e2.expirationTime <= o2 && (e2.expirationTime = 0), Ka(e2, t2, o2));
        }
        function Ma(e2, t2, n2, r2, o2, i2) {
          if (null === e2) {
            var a2 = n2.type;
            return "function" != typeof a2 || Sl(a2) || void 0 !== a2.defaultProps || null !== n2.compare || void 0 !== n2.defaultProps ? ((e2 = Tl(n2.type, null, r2, null, t2.mode, i2)).ref = t2.ref, e2.return = t2, t2.child = e2) : (t2.tag = 15, t2.type = a2, ja(e2, t2, a2, r2, o2, i2));
          }
          return a2 = e2.child, o2 < i2 && (o2 = a2.memoizedProps, (n2 = null !== (n2 = n2.compare) ? n2 : Ur)(o2, r2) && e2.ref === t2.ref) ? Ka(e2, t2, i2) : (t2.effectTag |= 1, (e2 = Cl(a2, r2)).ref = t2.ref, e2.return = t2, t2.child = e2);
        }
        function ja(e2, t2, n2, r2, o2, i2) {
          return null !== e2 && Ur(e2.memoizedProps, r2) && e2.ref === t2.ref && (Pa = false, o2 < i2) ? (t2.expirationTime = e2.expirationTime, Ka(e2, t2, i2)) : za(e2, t2, n2, r2, i2);
        }
        function Aa(e2, t2) {
          var n2 = t2.ref;
          (null === e2 && null !== n2 || null !== e2 && e2.ref !== n2) && (t2.effectTag |= 128);
        }
        function za(e2, t2, n2, r2, o2) {
          var i2 = go(n2) ? ho : po.current;
          return i2 = mo(t2, i2), ri(t2, o2), n2 = Ki(e2, t2, n2, r2, i2, o2), null === e2 || Pa ? (t2.effectTag |= 1, Da(e2, t2, n2, o2), t2.child) : (t2.updateQueue = e2.updateQueue, t2.effectTag &= -517, e2.expirationTime <= o2 && (e2.expirationTime = 0), Ka(e2, t2, o2));
        }
        function La(e2, t2, n2, r2, o2) {
          if (go(n2)) {
            var i2 = true;
            ko(t2);
          } else i2 = false;
          if (ri(t2, o2), null === t2.stateNode) null !== e2 && (e2.alternate = null, t2.alternate = null, t2.effectTag |= 2), bi(t2, n2, r2), ki(t2, n2, r2, o2), r2 = true;
          else if (null === e2) {
            var a2 = t2.stateNode, s2 = t2.memoizedProps;
            a2.props = s2;
            var l2 = a2.context, c2 = n2.contextType;
            "object" == typeof c2 && null !== c2 ? c2 = oi(c2) : c2 = mo(t2, c2 = go(n2) ? ho : po.current);
            var u2 = n2.getDerivedStateFromProps, p2 = "function" == typeof u2 || "function" == typeof a2.getSnapshotBeforeUpdate;
            p2 || "function" != typeof a2.UNSAFE_componentWillReceiveProps && "function" != typeof a2.componentWillReceiveProps || (s2 !== r2 || l2 !== c2) && vi(t2, a2, r2, c2), ii = false;
            var f2 = t2.memoizedState;
            a2.state = f2, pi(t2, r2, a2, o2), l2 = t2.memoizedState, s2 !== r2 || f2 !== l2 || fo.current || ii ? ("function" == typeof u2 && (mi(t2, n2, u2, r2), l2 = t2.memoizedState), (s2 = ii || yi(t2, n2, s2, r2, f2, l2, c2)) ? (p2 || "function" != typeof a2.UNSAFE_componentWillMount && "function" != typeof a2.componentWillMount || ("function" == typeof a2.componentWillMount && a2.componentWillMount(), "function" == typeof a2.UNSAFE_componentWillMount && a2.UNSAFE_componentWillMount()), "function" == typeof a2.componentDidMount && (t2.effectTag |= 4)) : ("function" == typeof a2.componentDidMount && (t2.effectTag |= 4), t2.memoizedProps = r2, t2.memoizedState = l2), a2.props = r2, a2.state = l2, a2.context = c2, r2 = s2) : ("function" == typeof a2.componentDidMount && (t2.effectTag |= 4), r2 = false);
          } else a2 = t2.stateNode, si(e2, t2), s2 = t2.memoizedProps, a2.props = t2.type === t2.elementType ? s2 : Qo(t2.type, s2), l2 = a2.context, "object" == typeof (c2 = n2.contextType) && null !== c2 ? c2 = oi(c2) : c2 = mo(t2, c2 = go(n2) ? ho : po.current), (p2 = "function" == typeof (u2 = n2.getDerivedStateFromProps) || "function" == typeof a2.getSnapshotBeforeUpdate) || "function" != typeof a2.UNSAFE_componentWillReceiveProps && "function" != typeof a2.componentWillReceiveProps || (s2 !== r2 || l2 !== c2) && vi(t2, a2, r2, c2), ii = false, l2 = t2.memoizedState, a2.state = l2, pi(t2, r2, a2, o2), f2 = t2.memoizedState, s2 !== r2 || l2 !== f2 || fo.current || ii ? ("function" == typeof u2 && (mi(t2, n2, u2, r2), f2 = t2.memoizedState), (u2 = ii || yi(t2, n2, s2, r2, l2, f2, c2)) ? (p2 || "function" != typeof a2.UNSAFE_componentWillUpdate && "function" != typeof a2.componentWillUpdate || ("function" == typeof a2.componentWillUpdate && a2.componentWillUpdate(r2, f2, c2), "function" == typeof a2.UNSAFE_componentWillUpdate && a2.UNSAFE_componentWillUpdate(r2, f2, c2)), "function" == typeof a2.componentDidUpdate && (t2.effectTag |= 4), "function" == typeof a2.getSnapshotBeforeUpdate && (t2.effectTag |= 256)) : ("function" != typeof a2.componentDidUpdate || s2 === e2.memoizedProps && l2 === e2.memoizedState || (t2.effectTag |= 4), "function" != typeof a2.getSnapshotBeforeUpdate || s2 === e2.memoizedProps && l2 === e2.memoizedState || (t2.effectTag |= 256), t2.memoizedProps = r2, t2.memoizedState = f2), a2.props = r2, a2.state = f2, a2.context = c2, r2 = u2) : ("function" != typeof a2.componentDidUpdate || s2 === e2.memoizedProps && l2 === e2.memoizedState || (t2.effectTag |= 4), "function" != typeof a2.getSnapshotBeforeUpdate || s2 === e2.memoizedProps && l2 === e2.memoizedState || (t2.effectTag |= 256), r2 = false);
          return Ia(e2, t2, n2, r2, i2, o2);
        }
        function Ia(e2, t2, n2, r2, o2, i2) {
          Aa(e2, t2);
          var a2 = 0 != (64 & t2.effectTag);
          if (!r2 && !a2) return o2 && wo(t2, n2, false), Ka(e2, t2, i2);
          r2 = t2.stateNode, Na.current = t2;
          var s2 = a2 && "function" != typeof n2.getDerivedStateFromError ? null : r2.render();
          return t2.effectTag |= 1, null !== e2 && a2 ? (t2.child = Si(t2, e2.child, null, i2), t2.child = Si(t2, null, s2, i2)) : Da(e2, t2, s2, i2), t2.memoizedState = r2.state, o2 && wo(t2, n2, true), t2.child;
        }
        function Ua(e2) {
          var t2 = e2.stateNode;
          t2.pendingContext ? bo(0, t2.pendingContext, t2.pendingContext !== t2.context) : t2.context && bo(0, t2.context, false), Ri(e2, t2.containerInfo);
        }
        var Fa, Ba, Wa, Ha = { dehydrated: null, retryTime: 0 };
        function Va(e2, t2, n2) {
          var r2, o2 = t2.mode, i2 = t2.pendingProps, a2 = zi.current, s2 = false;
          if ((r2 = 0 != (64 & t2.effectTag)) || (r2 = 0 != (2 & a2) && (null === e2 || null !== e2.memoizedState)), r2 ? (s2 = true, t2.effectTag &= -65) : null !== e2 && null === e2.memoizedState || void 0 === i2.fallback || true === i2.unstable_avoidThisFallback || (a2 |= 1), co(zi, 1 & a2), null === e2) {
            if (void 0 !== i2.fallback && Sa(t2), s2) {
              if (s2 = i2.fallback, (i2 = Ol(null, o2, 0, null)).return = t2, 0 == (2 & t2.mode)) for (e2 = null !== t2.memoizedState ? t2.child.child : t2.child, i2.child = e2; null !== e2; ) e2.return = i2, e2 = e2.sibling;
              return (n2 = Ol(s2, o2, n2, null)).return = t2, i2.sibling = n2, t2.memoizedState = Ha, t2.child = i2, n2;
            }
            return o2 = i2.children, t2.memoizedState = null, t2.child = Ci(t2, null, o2, n2);
          }
          if (null !== e2.memoizedState) {
            if (o2 = (e2 = e2.child).sibling, s2) {
              if (i2 = i2.fallback, (n2 = Cl(e2, e2.pendingProps)).return = t2, 0 == (2 & t2.mode) && (s2 = null !== t2.memoizedState ? t2.child.child : t2.child) !== e2.child) for (n2.child = s2; null !== s2; ) s2.return = n2, s2 = s2.sibling;
              return (o2 = Cl(o2, i2)).return = t2, n2.sibling = o2, n2.childExpirationTime = 0, t2.memoizedState = Ha, t2.child = n2, o2;
            }
            return n2 = Si(t2, e2.child, i2.children, n2), t2.memoizedState = null, t2.child = n2;
          }
          if (e2 = e2.child, s2) {
            if (s2 = i2.fallback, (i2 = Ol(null, o2, 0, null)).return = t2, i2.child = e2, null !== e2 && (e2.return = i2), 0 == (2 & t2.mode)) for (e2 = null !== t2.memoizedState ? t2.child.child : t2.child, i2.child = e2; null !== e2; ) e2.return = i2, e2 = e2.sibling;
            return (n2 = Ol(s2, o2, n2, null)).return = t2, i2.sibling = n2, n2.effectTag |= 2, i2.childExpirationTime = 0, t2.memoizedState = Ha, t2.child = i2, n2;
          }
          return t2.memoizedState = null, t2.child = Si(t2, e2, i2.children, n2);
        }
        function $a(e2, t2) {
          e2.expirationTime < t2 && (e2.expirationTime = t2);
          var n2 = e2.alternate;
          null !== n2 && n2.expirationTime < t2 && (n2.expirationTime = t2), ni(e2.return, t2);
        }
        function qa(e2, t2, n2, r2, o2, i2) {
          var a2 = e2.memoizedState;
          null === a2 ? e2.memoizedState = { isBackwards: t2, rendering: null, renderingStartTime: 0, last: r2, tail: n2, tailExpiration: 0, tailMode: o2, lastEffect: i2 } : (a2.isBackwards = t2, a2.rendering = null, a2.renderingStartTime = 0, a2.last = r2, a2.tail = n2, a2.tailExpiration = 0, a2.tailMode = o2, a2.lastEffect = i2);
        }
        function Ya(e2, t2, n2) {
          var r2 = t2.pendingProps, o2 = r2.revealOrder, i2 = r2.tail;
          if (Da(e2, t2, r2.children, n2), 0 != (2 & (r2 = zi.current))) r2 = 1 & r2 | 2, t2.effectTag |= 64;
          else {
            if (null !== e2 && 0 != (64 & e2.effectTag)) e: for (e2 = t2.child; null !== e2; ) {
              if (13 === e2.tag) null !== e2.memoizedState && $a(e2, n2);
              else if (19 === e2.tag) $a(e2, n2);
              else if (null !== e2.child) {
                e2.child.return = e2, e2 = e2.child;
                continue;
              }
              if (e2 === t2) break e;
              for (; null === e2.sibling; ) {
                if (null === e2.return || e2.return === t2) break e;
                e2 = e2.return;
              }
              e2.sibling.return = e2.return, e2 = e2.sibling;
            }
            r2 &= 1;
          }
          if (co(zi, r2), 0 == (2 & t2.mode)) t2.memoizedState = null;
          else switch (o2) {
            case "forwards":
              for (n2 = t2.child, o2 = null; null !== n2; ) null !== (e2 = n2.alternate) && null === Li(e2) && (o2 = n2), n2 = n2.sibling;
              null === (n2 = o2) ? (o2 = t2.child, t2.child = null) : (o2 = n2.sibling, n2.sibling = null), qa(t2, false, o2, n2, i2, t2.lastEffect);
              break;
            case "backwards":
              for (n2 = null, o2 = t2.child, t2.child = null; null !== o2; ) {
                if (null !== (e2 = o2.alternate) && null === Li(e2)) {
                  t2.child = o2;
                  break;
                }
                e2 = o2.sibling, o2.sibling = n2, n2 = o2, o2 = e2;
              }
              qa(t2, true, n2, null, i2, t2.lastEffect);
              break;
            case "together":
              qa(t2, false, null, null, void 0, t2.lastEffect);
              break;
            default:
              t2.memoizedState = null;
          }
          return t2.child;
        }
        function Ka(e2, t2, n2) {
          null !== e2 && (t2.dependencies = e2.dependencies);
          var r2 = t2.expirationTime;
          if (0 !== r2 && al(r2), t2.childExpirationTime < n2) return null;
          if (null !== e2 && t2.child !== e2.child) throw Error(a(153));
          if (null !== t2.child) {
            for (n2 = Cl(e2 = t2.child, e2.pendingProps), t2.child = n2, n2.return = t2; null !== e2.sibling; ) e2 = e2.sibling, (n2 = n2.sibling = Cl(e2, e2.pendingProps)).return = t2;
            n2.sibling = null;
          }
          return t2.child;
        }
        function Qa(e2, t2) {
          switch (e2.tailMode) {
            case "hidden":
              t2 = e2.tail;
              for (var n2 = null; null !== t2; ) null !== t2.alternate && (n2 = t2), t2 = t2.sibling;
              null === n2 ? e2.tail = null : n2.sibling = null;
              break;
            case "collapsed":
              n2 = e2.tail;
              for (var r2 = null; null !== n2; ) null !== n2.alternate && (r2 = n2), n2 = n2.sibling;
              null === r2 ? t2 || null === e2.tail ? e2.tail = null : e2.tail.sibling = null : r2.sibling = null;
          }
        }
        function Ga(e2, t2, n2) {
          var r2 = t2.pendingProps;
          switch (t2.tag) {
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
              return go(t2.type) && yo(), null;
            case 3:
              return Mi(), lo(fo), lo(po), (n2 = t2.stateNode).pendingContext && (n2.context = n2.pendingContext, n2.pendingContext = null), null !== e2 && null !== e2.child || !Ta(t2) || (t2.effectTag |= 4), null;
            case 5:
              Ai(t2), n2 = Di(Pi.current);
              var i2 = t2.type;
              if (null !== e2 && null != t2.stateNode) Ba(e2, t2, i2, r2, n2), e2.ref !== t2.ref && (t2.effectTag |= 128);
              else {
                if (!r2) {
                  if (null === t2.stateNode) throw Error(a(166));
                  return null;
                }
                if (e2 = Di(Oi.current), Ta(t2)) {
                  r2 = t2.stateNode, i2 = t2.type;
                  var s2 = t2.memoizedProps;
                  switch (r2[xn] = t2, r2[Sn] = s2, i2) {
                    case "iframe":
                    case "object":
                    case "embed":
                      Yt("load", r2);
                      break;
                    case "video":
                    case "audio":
                      for (e2 = 0; e2 < Ge.length; e2++) Yt(Ge[e2], r2);
                      break;
                    case "source":
                      Yt("error", r2);
                      break;
                    case "img":
                    case "image":
                    case "link":
                      Yt("error", r2), Yt("load", r2);
                      break;
                    case "form":
                      Yt("reset", r2), Yt("submit", r2);
                      break;
                    case "details":
                      Yt("toggle", r2);
                      break;
                    case "input":
                      Ee(r2, s2), Yt("invalid", r2), ln(n2, "onChange");
                      break;
                    case "select":
                      r2._wrapperState = { wasMultiple: !!s2.multiple }, Yt("invalid", r2), ln(n2, "onChange");
                      break;
                    case "textarea":
                      De(r2, s2), Yt("invalid", r2), ln(n2, "onChange");
                  }
                  for (var l2 in on(i2, s2), e2 = null, s2) if (s2.hasOwnProperty(l2)) {
                    var c2 = s2[l2];
                    "children" === l2 ? "string" == typeof c2 ? r2.textContent !== c2 && (e2 = ["children", c2]) : "number" == typeof c2 && r2.textContent !== "" + c2 && (e2 = ["children", "" + c2]) : x.hasOwnProperty(l2) && null != c2 && ln(n2, l2);
                  }
                  switch (i2) {
                    case "input":
                      ke(r2), Ce(r2, s2, true);
                      break;
                    case "textarea":
                      ke(r2), Me(r2);
                      break;
                    case "select":
                    case "option":
                      break;
                    default:
                      "function" == typeof s2.onClick && (r2.onclick = cn);
                  }
                  n2 = e2, t2.updateQueue = n2, null !== n2 && (t2.effectTag |= 4);
                } else {
                  switch (l2 = 9 === n2.nodeType ? n2 : n2.ownerDocument, e2 === sn && (e2 = ze(i2)), e2 === sn ? "script" === i2 ? ((e2 = l2.createElement("div")).innerHTML = "<script><\/script>", e2 = e2.removeChild(e2.firstChild)) : "string" == typeof r2.is ? e2 = l2.createElement(i2, { is: r2.is }) : (e2 = l2.createElement(i2), "select" === i2 && (l2 = e2, r2.multiple ? l2.multiple = true : r2.size && (l2.size = r2.size))) : e2 = l2.createElementNS(e2, i2), e2[xn] = t2, e2[Sn] = r2, Fa(e2, t2), t2.stateNode = e2, l2 = an(i2, r2), i2) {
                    case "iframe":
                    case "object":
                    case "embed":
                      Yt("load", e2), c2 = r2;
                      break;
                    case "video":
                    case "audio":
                      for (c2 = 0; c2 < Ge.length; c2++) Yt(Ge[c2], e2);
                      c2 = r2;
                      break;
                    case "source":
                      Yt("error", e2), c2 = r2;
                      break;
                    case "img":
                    case "image":
                    case "link":
                      Yt("error", e2), Yt("load", e2), c2 = r2;
                      break;
                    case "form":
                      Yt("reset", e2), Yt("submit", e2), c2 = r2;
                      break;
                    case "details":
                      Yt("toggle", e2), c2 = r2;
                      break;
                    case "input":
                      Ee(e2, r2), c2 = _e(e2, r2), Yt("invalid", e2), ln(n2, "onChange");
                      break;
                    case "option":
                      c2 = Oe(e2, r2);
                      break;
                    case "select":
                      e2._wrapperState = { wasMultiple: !!r2.multiple }, c2 = o({}, r2, { value: void 0 }), Yt("invalid", e2), ln(n2, "onChange");
                      break;
                    case "textarea":
                      De(e2, r2), c2 = Pe(e2, r2), Yt("invalid", e2), ln(n2, "onChange");
                      break;
                    default:
                      c2 = r2;
                  }
                  on(i2, c2);
                  var u2 = c2;
                  for (s2 in u2) if (u2.hasOwnProperty(s2)) {
                    var p2 = u2[s2];
                    "style" === s2 ? nn(e2, p2) : "dangerouslySetInnerHTML" === s2 ? null != (p2 = p2 ? p2.__html : void 0) && Ue(e2, p2) : "children" === s2 ? "string" == typeof p2 ? ("textarea" !== i2 || "" !== p2) && Fe(e2, p2) : "number" == typeof p2 && Fe(e2, "" + p2) : "suppressContentEditableWarning" !== s2 && "suppressHydrationWarning" !== s2 && "autoFocus" !== s2 && (x.hasOwnProperty(s2) ? null != p2 && ln(n2, s2) : null != p2 && X(e2, s2, p2, l2));
                  }
                  switch (i2) {
                    case "input":
                      ke(e2), Ce(e2, r2, false);
                      break;
                    case "textarea":
                      ke(e2), Me(e2);
                      break;
                    case "option":
                      null != r2.value && e2.setAttribute("value", "" + be(r2.value));
                      break;
                    case "select":
                      e2.multiple = !!r2.multiple, null != (n2 = r2.value) ? Ne(e2, !!r2.multiple, n2, false) : null != r2.defaultValue && Ne(e2, !!r2.multiple, r2.defaultValue, true);
                      break;
                    default:
                      "function" == typeof c2.onClick && (e2.onclick = cn);
                  }
                  yn(i2, r2) && (t2.effectTag |= 4);
                }
                null !== t2.ref && (t2.effectTag |= 128);
              }
              return null;
            case 6:
              if (e2 && null != t2.stateNode) Wa(0, t2, e2.memoizedProps, r2);
              else {
                if ("string" != typeof r2 && null === t2.stateNode) throw Error(a(166));
                n2 = Di(Pi.current), Di(Oi.current), Ta(t2) ? (n2 = t2.stateNode, r2 = t2.memoizedProps, n2[xn] = t2, n2.nodeValue !== r2 && (t2.effectTag |= 4)) : ((n2 = (9 === n2.nodeType ? n2 : n2.ownerDocument).createTextNode(r2))[xn] = t2, t2.stateNode = n2);
              }
              return null;
            case 13:
              return lo(zi), r2 = t2.memoizedState, 0 != (64 & t2.effectTag) ? (t2.expirationTime = n2, t2) : (n2 = null !== r2, r2 = false, null === e2 ? void 0 !== t2.memoizedProps.fallback && Ta(t2) : (r2 = null !== (i2 = e2.memoizedState), n2 || null === i2 || null !== (i2 = e2.child.sibling) && (null !== (s2 = t2.firstEffect) ? (t2.firstEffect = i2, i2.nextEffect = s2) : (t2.firstEffect = t2.lastEffect = i2, i2.nextEffect = null), i2.effectTag = 8)), n2 && !r2 && 0 != (2 & t2.mode) && (null === e2 && true !== t2.memoizedProps.unstable_avoidThisFallback || 0 != (1 & zi.current) ? Ts === ks && (Ts = ws) : (Ts !== ks && Ts !== ws || (Ts = _s), 0 !== Rs && null !== xs && (Ml(xs, Cs), jl(xs, Rs)))), (n2 || r2) && (t2.effectTag |= 4), null);
            case 4:
              return Mi(), null;
            case 10:
              return ti(t2), null;
            case 17:
              return go(t2.type) && yo(), null;
            case 19:
              if (lo(zi), null === (r2 = t2.memoizedState)) return null;
              if (i2 = 0 != (64 & t2.effectTag), null === (s2 = r2.rendering)) {
                if (i2) Qa(r2, false);
                else if (Ts !== ks || null !== e2 && 0 != (64 & e2.effectTag)) for (s2 = t2.child; null !== s2; ) {
                  if (null !== (e2 = Li(s2))) {
                    for (t2.effectTag |= 64, Qa(r2, false), null !== (i2 = e2.updateQueue) && (t2.updateQueue = i2, t2.effectTag |= 4), null === r2.lastEffect && (t2.firstEffect = null), t2.lastEffect = r2.lastEffect, r2 = t2.child; null !== r2; ) s2 = n2, (i2 = r2).effectTag &= 2, i2.nextEffect = null, i2.firstEffect = null, i2.lastEffect = null, null === (e2 = i2.alternate) ? (i2.childExpirationTime = 0, i2.expirationTime = s2, i2.child = null, i2.memoizedProps = null, i2.memoizedState = null, i2.updateQueue = null, i2.dependencies = null) : (i2.childExpirationTime = e2.childExpirationTime, i2.expirationTime = e2.expirationTime, i2.child = e2.child, i2.memoizedProps = e2.memoizedProps, i2.memoizedState = e2.memoizedState, i2.updateQueue = e2.updateQueue, s2 = e2.dependencies, i2.dependencies = null === s2 ? null : { expirationTime: s2.expirationTime, firstContext: s2.firstContext, responders: s2.responders }), r2 = r2.sibling;
                    return co(zi, 1 & zi.current | 2), t2.child;
                  }
                  s2 = s2.sibling;
                }
              } else {
                if (!i2) if (null !== (e2 = Li(s2))) {
                  if (t2.effectTag |= 64, i2 = true, null !== (n2 = e2.updateQueue) && (t2.updateQueue = n2, t2.effectTag |= 4), Qa(r2, true), null === r2.tail && "hidden" === r2.tailMode && !s2.alternate) return null !== (t2 = t2.lastEffect = r2.lastEffect) && (t2.nextEffect = null), null;
                } else 2 * Fo() - r2.renderingStartTime > r2.tailExpiration && 1 < n2 && (t2.effectTag |= 64, i2 = true, Qa(r2, false), t2.expirationTime = t2.childExpirationTime = n2 - 1);
                r2.isBackwards ? (s2.sibling = t2.child, t2.child = s2) : (null !== (n2 = r2.last) ? n2.sibling = s2 : t2.child = s2, r2.last = s2);
              }
              return null !== r2.tail ? (0 === r2.tailExpiration && (r2.tailExpiration = Fo() + 500), n2 = r2.tail, r2.rendering = n2, r2.tail = n2.sibling, r2.lastEffect = t2.lastEffect, r2.renderingStartTime = Fo(), n2.sibling = null, t2 = zi.current, co(zi, i2 ? 1 & t2 | 2 : 1 & t2), n2) : null;
          }
          throw Error(a(156, t2.tag));
        }
        function Xa(e2) {
          switch (e2.tag) {
            case 1:
              go(e2.type) && yo();
              var t2 = e2.effectTag;
              return 4096 & t2 ? (e2.effectTag = -4097 & t2 | 64, e2) : null;
            case 3:
              if (Mi(), lo(fo), lo(po), 0 != (64 & (t2 = e2.effectTag))) throw Error(a(285));
              return e2.effectTag = -4097 & t2 | 64, e2;
            case 5:
              return Ai(e2), null;
            case 13:
              return lo(zi), 4096 & (t2 = e2.effectTag) ? (e2.effectTag = -4097 & t2 | 64, e2) : null;
            case 19:
              return lo(zi), null;
            case 4:
              return Mi(), null;
            case 10:
              return ti(e2), null;
            default:
              return null;
          }
        }
        function Ja(e2, t2) {
          return { value: e2, source: t2, stack: ye(t2) };
        }
        Fa = function(e2, t2) {
          for (var n2 = t2.child; null !== n2; ) {
            if (5 === n2.tag || 6 === n2.tag) e2.appendChild(n2.stateNode);
            else if (4 !== n2.tag && null !== n2.child) {
              n2.child.return = n2, n2 = n2.child;
              continue;
            }
            if (n2 === t2) break;
            for (; null === n2.sibling; ) {
              if (null === n2.return || n2.return === t2) return;
              n2 = n2.return;
            }
            n2.sibling.return = n2.return, n2 = n2.sibling;
          }
        }, Ba = function(e2, t2, n2, r2, i2) {
          var a2 = e2.memoizedProps;
          if (a2 !== r2) {
            var s2, l2, c2 = t2.stateNode;
            switch (Di(Oi.current), e2 = null, n2) {
              case "input":
                a2 = _e(c2, a2), r2 = _e(c2, r2), e2 = [];
                break;
              case "option":
                a2 = Oe(c2, a2), r2 = Oe(c2, r2), e2 = [];
                break;
              case "select":
                a2 = o({}, a2, { value: void 0 }), r2 = o({}, r2, { value: void 0 }), e2 = [];
                break;
              case "textarea":
                a2 = Pe(c2, a2), r2 = Pe(c2, r2), e2 = [];
                break;
              default:
                "function" != typeof a2.onClick && "function" == typeof r2.onClick && (c2.onclick = cn);
            }
            for (s2 in on(n2, r2), n2 = null, a2) if (!r2.hasOwnProperty(s2) && a2.hasOwnProperty(s2) && null != a2[s2]) if ("style" === s2) for (l2 in c2 = a2[s2]) c2.hasOwnProperty(l2) && (n2 || (n2 = {}), n2[l2] = "");
            else "dangerouslySetInnerHTML" !== s2 && "children" !== s2 && "suppressContentEditableWarning" !== s2 && "suppressHydrationWarning" !== s2 && "autoFocus" !== s2 && (x.hasOwnProperty(s2) ? e2 || (e2 = []) : (e2 = e2 || []).push(s2, null));
            for (s2 in r2) {
              var u2 = r2[s2];
              if (c2 = null != a2 ? a2[s2] : void 0, r2.hasOwnProperty(s2) && u2 !== c2 && (null != u2 || null != c2)) if ("style" === s2) if (c2) {
                for (l2 in c2) !c2.hasOwnProperty(l2) || u2 && u2.hasOwnProperty(l2) || (n2 || (n2 = {}), n2[l2] = "");
                for (l2 in u2) u2.hasOwnProperty(l2) && c2[l2] !== u2[l2] && (n2 || (n2 = {}), n2[l2] = u2[l2]);
              } else n2 || (e2 || (e2 = []), e2.push(s2, n2)), n2 = u2;
              else "dangerouslySetInnerHTML" === s2 ? (u2 = u2 ? u2.__html : void 0, c2 = c2 ? c2.__html : void 0, null != u2 && c2 !== u2 && (e2 = e2 || []).push(s2, u2)) : "children" === s2 ? c2 === u2 || "string" != typeof u2 && "number" != typeof u2 || (e2 = e2 || []).push(s2, "" + u2) : "suppressContentEditableWarning" !== s2 && "suppressHydrationWarning" !== s2 && (x.hasOwnProperty(s2) ? (null != u2 && ln(i2, s2), e2 || c2 === u2 || (e2 = [])) : (e2 = e2 || []).push(s2, u2));
            }
            n2 && (e2 = e2 || []).push("style", n2), i2 = e2, (t2.updateQueue = i2) && (t2.effectTag |= 4);
          }
        }, Wa = function(e2, t2, n2, r2) {
          n2 !== r2 && (t2.effectTag |= 4);
        };
        var Za = "function" == typeof WeakSet ? WeakSet : Set;
        function es(e2, t2) {
          var n2 = t2.source, r2 = t2.stack;
          null === r2 && null !== n2 && (r2 = ye(n2)), null !== n2 && ge(n2.type), t2 = t2.value, null !== e2 && 1 === e2.tag && ge(e2.type);
          try {
            console.error(t2);
          } catch (e3) {
            setTimeout(function() {
              throw e3;
            });
          }
        }
        function ts(e2) {
          var t2 = e2.ref;
          if (null !== t2) if ("function" == typeof t2) try {
            t2(null);
          } catch (t3) {
            bl(e2, t3);
          }
          else t2.current = null;
        }
        function ns(e2, t2) {
          switch (t2.tag) {
            case 0:
            case 11:
            case 15:
            case 22:
              return;
            case 1:
              if (256 & t2.effectTag && null !== e2) {
                var n2 = e2.memoizedProps, r2 = e2.memoizedState;
                t2 = (e2 = t2.stateNode).getSnapshotBeforeUpdate(t2.elementType === t2.type ? n2 : Qo(t2.type, n2), r2), e2.__reactInternalSnapshotBeforeUpdate = t2;
              }
              return;
            case 3:
            case 5:
            case 6:
            case 4:
            case 17:
              return;
          }
          throw Error(a(163));
        }
        function rs(e2, t2) {
          if (null !== (t2 = null !== (t2 = t2.updateQueue) ? t2.lastEffect : null)) {
            var n2 = t2 = t2.next;
            do {
              if ((n2.tag & e2) === e2) {
                var r2 = n2.destroy;
                n2.destroy = void 0, void 0 !== r2 && r2();
              }
              n2 = n2.next;
            } while (n2 !== t2);
          }
        }
        function os(e2, t2) {
          if (null !== (t2 = null !== (t2 = t2.updateQueue) ? t2.lastEffect : null)) {
            var n2 = t2 = t2.next;
            do {
              if ((n2.tag & e2) === e2) {
                var r2 = n2.create;
                n2.destroy = r2();
              }
              n2 = n2.next;
            } while (n2 !== t2);
          }
        }
        function is(e2, t2, n2) {
          switch (n2.tag) {
            case 0:
            case 11:
            case 15:
            case 22:
              return void os(3, n2);
            case 1:
              if (e2 = n2.stateNode, 4 & n2.effectTag) if (null === t2) e2.componentDidMount();
              else {
                var r2 = n2.elementType === n2.type ? t2.memoizedProps : Qo(n2.type, t2.memoizedProps);
                e2.componentDidUpdate(r2, t2.memoizedState, e2.__reactInternalSnapshotBeforeUpdate);
              }
              return void (null !== (t2 = n2.updateQueue) && fi(n2, t2, e2));
            case 3:
              if (null !== (t2 = n2.updateQueue)) {
                if (e2 = null, null !== n2.child) switch (n2.child.tag) {
                  case 5:
                    e2 = n2.child.stateNode;
                    break;
                  case 1:
                    e2 = n2.child.stateNode;
                }
                fi(n2, t2, e2);
              }
              return;
            case 5:
              return e2 = n2.stateNode, void (null === t2 && 4 & n2.effectTag && yn(n2.type, n2.memoizedProps) && e2.focus());
            case 6:
            case 4:
            case 12:
              return;
            case 13:
              return void (null === n2.memoizedState && (n2 = n2.alternate, null !== n2 && (n2 = n2.memoizedState, null !== n2 && (n2 = n2.dehydrated, null !== n2 && zt(n2)))));
            case 19:
            case 17:
            case 20:
            case 21:
              return;
          }
          throw Error(a(163));
        }
        function as(e2, t2, n2) {
          switch ("function" == typeof _l && _l(t2), t2.tag) {
            case 0:
            case 11:
            case 14:
            case 15:
            case 22:
              if (null !== (e2 = t2.updateQueue) && null !== (e2 = e2.lastEffect)) {
                var r2 = e2.next;
                Ho(97 < n2 ? 97 : n2, function() {
                  var e3 = r2;
                  do {
                    var n3 = e3.destroy;
                    if (void 0 !== n3) {
                      var o2 = t2;
                      try {
                        n3();
                      } catch (e4) {
                        bl(o2, e4);
                      }
                    }
                    e3 = e3.next;
                  } while (e3 !== r2);
                });
              }
              break;
            case 1:
              ts(t2), "function" == typeof (n2 = t2.stateNode).componentWillUnmount && function(e3, t3) {
                try {
                  t3.props = e3.memoizedProps, t3.state = e3.memoizedState, t3.componentWillUnmount();
                } catch (t4) {
                  bl(e3, t4);
                }
              }(t2, n2);
              break;
            case 5:
              ts(t2);
              break;
            case 4:
              us(e2, t2, n2);
          }
        }
        function ss(e2) {
          var t2 = e2.alternate;
          e2.return = null, e2.child = null, e2.memoizedState = null, e2.updateQueue = null, e2.dependencies = null, e2.alternate = null, e2.firstEffect = null, e2.lastEffect = null, e2.pendingProps = null, e2.memoizedProps = null, e2.stateNode = null, null !== t2 && ss(t2);
        }
        function ls(e2) {
          return 5 === e2.tag || 3 === e2.tag || 4 === e2.tag;
        }
        function cs(e2) {
          e: {
            for (var t2 = e2.return; null !== t2; ) {
              if (ls(t2)) {
                var n2 = t2;
                break e;
              }
              t2 = t2.return;
            }
            throw Error(a(160));
          }
          switch (t2 = n2.stateNode, n2.tag) {
            case 5:
              var r2 = false;
              break;
            case 3:
            case 4:
              t2 = t2.containerInfo, r2 = true;
              break;
            default:
              throw Error(a(161));
          }
          16 & n2.effectTag && (Fe(t2, ""), n2.effectTag &= -17);
          e: t: for (n2 = e2; ; ) {
            for (; null === n2.sibling; ) {
              if (null === n2.return || ls(n2.return)) {
                n2 = null;
                break e;
              }
              n2 = n2.return;
            }
            for (n2.sibling.return = n2.return, n2 = n2.sibling; 5 !== n2.tag && 6 !== n2.tag && 18 !== n2.tag; ) {
              if (2 & n2.effectTag) continue t;
              if (null === n2.child || 4 === n2.tag) continue t;
              n2.child.return = n2, n2 = n2.child;
            }
            if (!(2 & n2.effectTag)) {
              n2 = n2.stateNode;
              break e;
            }
          }
          r2 ? function e3(t3, n3, r3) {
            var o2 = t3.tag, i2 = 5 === o2 || 6 === o2;
            if (i2) t3 = i2 ? t3.stateNode : t3.stateNode.instance, n3 ? 8 === r3.nodeType ? r3.parentNode.insertBefore(t3, n3) : r3.insertBefore(t3, n3) : (8 === r3.nodeType ? (n3 = r3.parentNode).insertBefore(t3, r3) : (n3 = r3).appendChild(t3), null !== (r3 = r3._reactRootContainer) && void 0 !== r3 || null !== n3.onclick || (n3.onclick = cn));
            else if (4 !== o2 && null !== (t3 = t3.child)) for (e3(t3, n3, r3), t3 = t3.sibling; null !== t3; ) e3(t3, n3, r3), t3 = t3.sibling;
          }(e2, n2, t2) : function e3(t3, n3, r3) {
            var o2 = t3.tag, i2 = 5 === o2 || 6 === o2;
            if (i2) t3 = i2 ? t3.stateNode : t3.stateNode.instance, n3 ? r3.insertBefore(t3, n3) : r3.appendChild(t3);
            else if (4 !== o2 && null !== (t3 = t3.child)) for (e3(t3, n3, r3), t3 = t3.sibling; null !== t3; ) e3(t3, n3, r3), t3 = t3.sibling;
          }(e2, n2, t2);
        }
        function us(e2, t2, n2) {
          for (var r2, o2, i2 = t2, s2 = false; ; ) {
            if (!s2) {
              s2 = i2.return;
              e: for (; ; ) {
                if (null === s2) throw Error(a(160));
                switch (r2 = s2.stateNode, s2.tag) {
                  case 5:
                    o2 = false;
                    break e;
                  case 3:
                  case 4:
                    r2 = r2.containerInfo, o2 = true;
                    break e;
                }
                s2 = s2.return;
              }
              s2 = true;
            }
            if (5 === i2.tag || 6 === i2.tag) {
              e: for (var l2 = e2, c2 = i2, u2 = n2, p2 = c2; ; ) if (as(l2, p2, u2), null !== p2.child && 4 !== p2.tag) p2.child.return = p2, p2 = p2.child;
              else {
                if (p2 === c2) break e;
                for (; null === p2.sibling; ) {
                  if (null === p2.return || p2.return === c2) break e;
                  p2 = p2.return;
                }
                p2.sibling.return = p2.return, p2 = p2.sibling;
              }
              o2 ? (l2 = r2, c2 = i2.stateNode, 8 === l2.nodeType ? l2.parentNode.removeChild(c2) : l2.removeChild(c2)) : r2.removeChild(i2.stateNode);
            } else if (4 === i2.tag) {
              if (null !== i2.child) {
                r2 = i2.stateNode.containerInfo, o2 = true, i2.child.return = i2, i2 = i2.child;
                continue;
              }
            } else if (as(e2, i2, n2), null !== i2.child) {
              i2.child.return = i2, i2 = i2.child;
              continue;
            }
            if (i2 === t2) break;
            for (; null === i2.sibling; ) {
              if (null === i2.return || i2.return === t2) return;
              4 === (i2 = i2.return).tag && (s2 = false);
            }
            i2.sibling.return = i2.return, i2 = i2.sibling;
          }
        }
        function ps(e2, t2) {
          switch (t2.tag) {
            case 0:
            case 11:
            case 14:
            case 15:
            case 22:
              return void rs(3, t2);
            case 1:
              return;
            case 5:
              var n2 = t2.stateNode;
              if (null != n2) {
                var r2 = t2.memoizedProps, o2 = null !== e2 ? e2.memoizedProps : r2;
                e2 = t2.type;
                var i2 = t2.updateQueue;
                if (t2.updateQueue = null, null !== i2) {
                  for (n2[Sn] = r2, "input" === e2 && "radio" === r2.type && null != r2.name && xe(n2, r2), an(e2, o2), t2 = an(e2, r2), o2 = 0; o2 < i2.length; o2 += 2) {
                    var s2 = i2[o2], l2 = i2[o2 + 1];
                    "style" === s2 ? nn(n2, l2) : "dangerouslySetInnerHTML" === s2 ? Ue(n2, l2) : "children" === s2 ? Fe(n2, l2) : X(n2, s2, l2, t2);
                  }
                  switch (e2) {
                    case "input":
                      Se(n2, r2);
                      break;
                    case "textarea":
                      Re(n2, r2);
                      break;
                    case "select":
                      t2 = n2._wrapperState.wasMultiple, n2._wrapperState.wasMultiple = !!r2.multiple, null != (e2 = r2.value) ? Ne(n2, !!r2.multiple, e2, false) : t2 !== !!r2.multiple && (null != r2.defaultValue ? Ne(n2, !!r2.multiple, r2.defaultValue, true) : Ne(n2, !!r2.multiple, r2.multiple ? [] : "", false));
                  }
                }
              }
              return;
            case 6:
              if (null === t2.stateNode) throw Error(a(162));
              return void (t2.stateNode.nodeValue = t2.memoizedProps);
            case 3:
              return void ((t2 = t2.stateNode).hydrate && (t2.hydrate = false, zt(t2.containerInfo)));
            case 12:
              return;
            case 13:
              if (n2 = t2, null === t2.memoizedState ? r2 = false : (r2 = true, n2 = t2.child, js = Fo()), null !== n2) e: for (e2 = n2; ; ) {
                if (5 === e2.tag) i2 = e2.stateNode, r2 ? "function" == typeof (i2 = i2.style).setProperty ? i2.setProperty("display", "none", "important") : i2.display = "none" : (i2 = e2.stateNode, o2 = null != (o2 = e2.memoizedProps.style) && o2.hasOwnProperty("display") ? o2.display : null, i2.style.display = tn("display", o2));
                else if (6 === e2.tag) e2.stateNode.nodeValue = r2 ? "" : e2.memoizedProps;
                else {
                  if (13 === e2.tag && null !== e2.memoizedState && null === e2.memoizedState.dehydrated) {
                    (i2 = e2.child.sibling).return = e2, e2 = i2;
                    continue;
                  }
                  if (null !== e2.child) {
                    e2.child.return = e2, e2 = e2.child;
                    continue;
                  }
                }
                if (e2 === n2) break;
                for (; null === e2.sibling; ) {
                  if (null === e2.return || e2.return === n2) break e;
                  e2 = e2.return;
                }
                e2.sibling.return = e2.return, e2 = e2.sibling;
              }
              return void fs(t2);
            case 19:
              return void fs(t2);
            case 17:
              return;
          }
          throw Error(a(163));
        }
        function fs(e2) {
          var t2 = e2.updateQueue;
          if (null !== t2) {
            e2.updateQueue = null;
            var n2 = e2.stateNode;
            null === n2 && (n2 = e2.stateNode = new Za()), t2.forEach(function(t3) {
              var r2 = kl.bind(null, e2, t3);
              n2.has(t3) || (n2.add(t3), t3.then(r2, r2));
            });
          }
        }
        var ds = "function" == typeof WeakMap ? WeakMap : Map;
        function hs(e2, t2, n2) {
          (n2 = li(n2, null)).tag = 3, n2.payload = { element: null };
          var r2 = t2.value;
          return n2.callback = function() {
            zs || (zs = true, Ls = r2), es(e2, t2);
          }, n2;
        }
        function ms(e2, t2, n2) {
          (n2 = li(n2, null)).tag = 3;
          var r2 = e2.type.getDerivedStateFromError;
          if ("function" == typeof r2) {
            var o2 = t2.value;
            n2.payload = function() {
              return es(e2, t2), r2(o2);
            };
          }
          var i2 = e2.stateNode;
          return null !== i2 && "function" == typeof i2.componentDidCatch && (n2.callback = function() {
            "function" != typeof r2 && (null === Is ? Is = /* @__PURE__ */ new Set([this]) : Is.add(this), es(e2, t2));
            var n3 = t2.stack;
            this.componentDidCatch(t2.value, { componentStack: null !== n3 ? n3 : "" });
          }), n2;
        }
        var gs, ys = Math.ceil, bs = G.ReactCurrentDispatcher, vs = G.ReactCurrentOwner, ks = 0, ws = 3, _s = 4, Es = 0, xs = null, Ss = null, Cs = 0, Ts = ks, Os = null, Ns = 1073741823, Ps = 1073741823, Ds = null, Rs = 0, Ms = false, js = 0, As = null, zs = false, Ls = null, Is = null, Us = false, Fs = null, Bs = 90, Ws = null, Hs = 0, Vs = null, $s = 0;
        function qs() {
          return 0 != (48 & Es) ? 1073741821 - (Fo() / 10 | 0) : 0 !== $s ? $s : $s = 1073741821 - (Fo() / 10 | 0);
        }
        function Ys(e2, t2, n2) {
          if (0 == (2 & (t2 = t2.mode))) return 1073741823;
          var r2 = Bo();
          if (0 == (4 & t2)) return 99 === r2 ? 1073741823 : 1073741822;
          if (0 != (16 & Es)) return Cs;
          if (null !== n2) e2 = Ko(e2, 0 | n2.timeoutMs || 5e3, 250);
          else switch (r2) {
            case 99:
              e2 = 1073741823;
              break;
            case 98:
              e2 = Ko(e2, 150, 100);
              break;
            case 97:
            case 96:
              e2 = Ko(e2, 5e3, 250);
              break;
            case 95:
              e2 = 2;
              break;
            default:
              throw Error(a(326));
          }
          return null !== xs && e2 === Cs && --e2, e2;
        }
        function Ks(e2, t2) {
          if (50 < Hs) throw Hs = 0, Vs = null, Error(a(185));
          if (null !== (e2 = Qs(e2, t2))) {
            var n2 = Bo();
            1073741823 === t2 ? 0 != (8 & Es) && 0 == (48 & Es) ? Zs(e2) : (Xs(e2), 0 === Es && qo()) : Xs(e2), 0 == (4 & Es) || 98 !== n2 && 99 !== n2 || (null === Ws ? Ws = /* @__PURE__ */ new Map([[e2, t2]]) : (void 0 === (n2 = Ws.get(e2)) || n2 > t2) && Ws.set(e2, t2));
          }
        }
        function Qs(e2, t2) {
          e2.expirationTime < t2 && (e2.expirationTime = t2);
          var n2 = e2.alternate;
          null !== n2 && n2.expirationTime < t2 && (n2.expirationTime = t2);
          var r2 = e2.return, o2 = null;
          if (null === r2 && 3 === e2.tag) o2 = e2.stateNode;
          else for (; null !== r2; ) {
            if (n2 = r2.alternate, r2.childExpirationTime < t2 && (r2.childExpirationTime = t2), null !== n2 && n2.childExpirationTime < t2 && (n2.childExpirationTime = t2), null === r2.return && 3 === r2.tag) {
              o2 = r2.stateNode;
              break;
            }
            r2 = r2.return;
          }
          return null !== o2 && (xs === o2 && (al(t2), Ts === _s && Ml(o2, Cs)), jl(o2, t2)), o2;
        }
        function Gs(e2) {
          var t2 = e2.lastExpiredTime;
          if (0 !== t2) return t2;
          if (!Rl(e2, t2 = e2.firstPendingTime)) return t2;
          var n2 = e2.lastPingedTime;
          return 2 >= (e2 = n2 > (e2 = e2.nextKnownPendingLevel) ? n2 : e2) && t2 !== e2 ? 0 : e2;
        }
        function Xs(e2) {
          if (0 !== e2.lastExpiredTime) e2.callbackExpirationTime = 1073741823, e2.callbackPriority = 99, e2.callbackNode = $o(Zs.bind(null, e2));
          else {
            var t2 = Gs(e2), n2 = e2.callbackNode;
            if (0 === t2) null !== n2 && (e2.callbackNode = null, e2.callbackExpirationTime = 0, e2.callbackPriority = 90);
            else {
              var r2 = qs();
              if (1073741823 === t2 ? r2 = 99 : 1 === t2 || 2 === t2 ? r2 = 95 : r2 = 0 >= (r2 = 10 * (1073741821 - t2) - 10 * (1073741821 - r2)) ? 99 : 250 >= r2 ? 98 : 5250 >= r2 ? 97 : 95, null !== n2) {
                var o2 = e2.callbackPriority;
                if (e2.callbackExpirationTime === t2 && o2 >= r2) return;
                n2 !== Mo && xo(n2);
              }
              e2.callbackExpirationTime = t2, e2.callbackPriority = r2, t2 = 1073741823 === t2 ? $o(Zs.bind(null, e2)) : Vo(r2, Js.bind(null, e2), { timeout: 10 * (1073741821 - t2) - Fo() }), e2.callbackNode = t2;
            }
          }
        }
        function Js(e2, t2) {
          if ($s = 0, t2) return Al(e2, t2 = qs()), Xs(e2), null;
          var n2 = Gs(e2);
          if (0 !== n2) {
            if (t2 = e2.callbackNode, 0 != (48 & Es)) throw Error(a(327));
            if (ml(), e2 === xs && n2 === Cs || nl(e2, n2), null !== Ss) {
              var r2 = Es;
              Es |= 16;
              for (var o2 = ol(); ; ) try {
                ll();
                break;
              } catch (t3) {
                rl(e2, t3);
              }
              if (ei(), Es = r2, bs.current = o2, 1 === Ts) throw t2 = Os, nl(e2, n2), Ml(e2, n2), Xs(e2), t2;
              if (null === Ss) switch (o2 = e2.finishedWork = e2.current.alternate, e2.finishedExpirationTime = n2, r2 = Ts, xs = null, r2) {
                case ks:
                case 1:
                  throw Error(a(345));
                case 2:
                  Al(e2, 2 < n2 ? 2 : n2);
                  break;
                case ws:
                  if (Ml(e2, n2), n2 === (r2 = e2.lastSuspendedTime) && (e2.nextKnownPendingLevel = pl(o2)), 1073741823 === Ns && 10 < (o2 = js + 500 - Fo())) {
                    if (Ms) {
                      var i2 = e2.lastPingedTime;
                      if (0 === i2 || i2 >= n2) {
                        e2.lastPingedTime = n2, nl(e2, n2);
                        break;
                      }
                    }
                    if (0 !== (i2 = Gs(e2)) && i2 !== n2) break;
                    if (0 !== r2 && r2 !== n2) {
                      e2.lastPingedTime = r2;
                      break;
                    }
                    e2.timeoutHandle = vn(fl.bind(null, e2), o2);
                    break;
                  }
                  fl(e2);
                  break;
                case _s:
                  if (Ml(e2, n2), n2 === (r2 = e2.lastSuspendedTime) && (e2.nextKnownPendingLevel = pl(o2)), Ms && (0 === (o2 = e2.lastPingedTime) || o2 >= n2)) {
                    e2.lastPingedTime = n2, nl(e2, n2);
                    break;
                  }
                  if (0 !== (o2 = Gs(e2)) && o2 !== n2) break;
                  if (0 !== r2 && r2 !== n2) {
                    e2.lastPingedTime = r2;
                    break;
                  }
                  if (1073741823 !== Ps ? r2 = 10 * (1073741821 - Ps) - Fo() : 1073741823 === Ns ? r2 = 0 : (r2 = 10 * (1073741821 - Ns) - 5e3, 0 > (r2 = (o2 = Fo()) - r2) && (r2 = 0), (n2 = 10 * (1073741821 - n2) - o2) < (r2 = (120 > r2 ? 120 : 480 > r2 ? 480 : 1080 > r2 ? 1080 : 1920 > r2 ? 1920 : 3e3 > r2 ? 3e3 : 4320 > r2 ? 4320 : 1960 * ys(r2 / 1960)) - r2) && (r2 = n2)), 10 < r2) {
                    e2.timeoutHandle = vn(fl.bind(null, e2), r2);
                    break;
                  }
                  fl(e2);
                  break;
                case 5:
                  if (1073741823 !== Ns && null !== Ds) {
                    i2 = Ns;
                    var s2 = Ds;
                    if (0 >= (r2 = 0 | s2.busyMinDurationMs) ? r2 = 0 : (o2 = 0 | s2.busyDelayMs, r2 = (i2 = Fo() - (10 * (1073741821 - i2) - (0 | s2.timeoutMs || 5e3))) <= o2 ? 0 : o2 + r2 - i2), 10 < r2) {
                      Ml(e2, n2), e2.timeoutHandle = vn(fl.bind(null, e2), r2);
                      break;
                    }
                  }
                  fl(e2);
                  break;
                default:
                  throw Error(a(329));
              }
              if (Xs(e2), e2.callbackNode === t2) return Js.bind(null, e2);
            }
          }
          return null;
        }
        function Zs(e2) {
          var t2 = e2.lastExpiredTime;
          if (t2 = 0 !== t2 ? t2 : 1073741823, 0 != (48 & Es)) throw Error(a(327));
          if (ml(), e2 === xs && t2 === Cs || nl(e2, t2), null !== Ss) {
            var n2 = Es;
            Es |= 16;
            for (var r2 = ol(); ; ) try {
              sl();
              break;
            } catch (t3) {
              rl(e2, t3);
            }
            if (ei(), Es = n2, bs.current = r2, 1 === Ts) throw n2 = Os, nl(e2, t2), Ml(e2, t2), Xs(e2), n2;
            if (null !== Ss) throw Error(a(261));
            e2.finishedWork = e2.current.alternate, e2.finishedExpirationTime = t2, xs = null, fl(e2), Xs(e2);
          }
          return null;
        }
        function el(e2, t2) {
          var n2 = Es;
          Es |= 1;
          try {
            return e2(t2);
          } finally {
            0 === (Es = n2) && qo();
          }
        }
        function tl(e2, t2) {
          var n2 = Es;
          Es &= -2, Es |= 8;
          try {
            return e2(t2);
          } finally {
            0 === (Es = n2) && qo();
          }
        }
        function nl(e2, t2) {
          e2.finishedWork = null, e2.finishedExpirationTime = 0;
          var n2 = e2.timeoutHandle;
          if (-1 !== n2 && (e2.timeoutHandle = -1, kn(n2)), null !== Ss) for (n2 = Ss.return; null !== n2; ) {
            var r2 = n2;
            switch (r2.tag) {
              case 1:
                null != (r2 = r2.type.childContextTypes) && yo();
                break;
              case 3:
                Mi(), lo(fo), lo(po);
                break;
              case 5:
                Ai(r2);
                break;
              case 4:
                Mi();
                break;
              case 13:
              case 19:
                lo(zi);
                break;
              case 10:
                ti(r2);
            }
            n2 = n2.return;
          }
          xs = e2, Ss = Cl(e2.current, null), Cs = t2, Ts = ks, Os = null, Ps = Ns = 1073741823, Ds = null, Rs = 0, Ms = false;
        }
        function rl(e2, t2) {
          for (; ; ) {
            try {
              if (ei(), Ui.current = ga, $i) for (var n2 = Wi.memoizedState; null !== n2; ) {
                var r2 = n2.queue;
                null !== r2 && (r2.pending = null), n2 = n2.next;
              }
              if (Bi = 0, Vi = Hi = Wi = null, $i = false, null === Ss || null === Ss.return) return Ts = 1, Os = t2, Ss = null;
              e: {
                var o2 = e2, i2 = Ss.return, a2 = Ss, s2 = t2;
                if (t2 = Cs, a2.effectTag |= 2048, a2.firstEffect = a2.lastEffect = null, null !== s2 && "object" == typeof s2 && "function" == typeof s2.then) {
                  var l2 = s2;
                  if (0 == (2 & a2.mode)) {
                    var c2 = a2.alternate;
                    c2 ? (a2.updateQueue = c2.updateQueue, a2.memoizedState = c2.memoizedState, a2.expirationTime = c2.expirationTime) : (a2.updateQueue = null, a2.memoizedState = null);
                  }
                  var u2 = 0 != (1 & zi.current), p2 = i2;
                  do {
                    var f2;
                    if (f2 = 13 === p2.tag) {
                      var d2 = p2.memoizedState;
                      if (null !== d2) f2 = null !== d2.dehydrated;
                      else {
                        var h2 = p2.memoizedProps;
                        f2 = void 0 !== h2.fallback && (true !== h2.unstable_avoidThisFallback || !u2);
                      }
                    }
                    if (f2) {
                      var m2 = p2.updateQueue;
                      if (null === m2) {
                        var g2 = /* @__PURE__ */ new Set();
                        g2.add(l2), p2.updateQueue = g2;
                      } else m2.add(l2);
                      if (0 == (2 & p2.mode)) {
                        if (p2.effectTag |= 64, a2.effectTag &= -2981, 1 === a2.tag) if (null === a2.alternate) a2.tag = 17;
                        else {
                          var y2 = li(1073741823, null);
                          y2.tag = 2, ci(a2, y2);
                        }
                        a2.expirationTime = 1073741823;
                        break e;
                      }
                      s2 = void 0, a2 = t2;
                      var b2 = o2.pingCache;
                      if (null === b2 ? (b2 = o2.pingCache = new ds(), s2 = /* @__PURE__ */ new Set(), b2.set(l2, s2)) : void 0 === (s2 = b2.get(l2)) && (s2 = /* @__PURE__ */ new Set(), b2.set(l2, s2)), !s2.has(a2)) {
                        s2.add(a2);
                        var v2 = vl.bind(null, o2, l2, a2);
                        l2.then(v2, v2);
                      }
                      p2.effectTag |= 4096, p2.expirationTime = t2;
                      break e;
                    }
                    p2 = p2.return;
                  } while (null !== p2);
                  s2 = Error((ge(a2.type) || "A React component") + " suspended while rendering, but no fallback UI was specified.\n\nAdd a <Suspense fallback=...> component higher in the tree to provide a loading indicator or placeholder to display." + ye(a2));
                }
                5 !== Ts && (Ts = 2), s2 = Ja(s2, a2), p2 = i2;
                do {
                  switch (p2.tag) {
                    case 3:
                      l2 = s2, p2.effectTag |= 4096, p2.expirationTime = t2, ui(p2, hs(p2, l2, t2));
                      break e;
                    case 1:
                      l2 = s2;
                      var k2 = p2.type, w2 = p2.stateNode;
                      if (0 == (64 & p2.effectTag) && ("function" == typeof k2.getDerivedStateFromError || null !== w2 && "function" == typeof w2.componentDidCatch && (null === Is || !Is.has(w2)))) {
                        p2.effectTag |= 4096, p2.expirationTime = t2, ui(p2, ms(p2, l2, t2));
                        break e;
                      }
                  }
                  p2 = p2.return;
                } while (null !== p2);
              }
              Ss = ul(Ss);
            } catch (e3) {
              t2 = e3;
              continue;
            }
            break;
          }
        }
        function ol() {
          var e2 = bs.current;
          return bs.current = ga, null === e2 ? ga : e2;
        }
        function il(e2, t2) {
          e2 < Ns && 2 < e2 && (Ns = e2), null !== t2 && e2 < Ps && 2 < e2 && (Ps = e2, Ds = t2);
        }
        function al(e2) {
          e2 > Rs && (Rs = e2);
        }
        function sl() {
          for (; null !== Ss; ) Ss = cl(Ss);
        }
        function ll() {
          for (; null !== Ss && !jo(); ) Ss = cl(Ss);
        }
        function cl(e2) {
          var t2 = gs(e2.alternate, e2, Cs);
          return e2.memoizedProps = e2.pendingProps, null === t2 && (t2 = ul(e2)), vs.current = null, t2;
        }
        function ul(e2) {
          Ss = e2;
          do {
            var t2 = Ss.alternate;
            if (e2 = Ss.return, 0 == (2048 & Ss.effectTag)) {
              if (t2 = Ga(t2, Ss, Cs), 1 === Cs || 1 !== Ss.childExpirationTime) {
                for (var n2 = 0, r2 = Ss.child; null !== r2; ) {
                  var o2 = r2.expirationTime, i2 = r2.childExpirationTime;
                  o2 > n2 && (n2 = o2), i2 > n2 && (n2 = i2), r2 = r2.sibling;
                }
                Ss.childExpirationTime = n2;
              }
              if (null !== t2) return t2;
              null !== e2 && 0 == (2048 & e2.effectTag) && (null === e2.firstEffect && (e2.firstEffect = Ss.firstEffect), null !== Ss.lastEffect && (null !== e2.lastEffect && (e2.lastEffect.nextEffect = Ss.firstEffect), e2.lastEffect = Ss.lastEffect), 1 < Ss.effectTag && (null !== e2.lastEffect ? e2.lastEffect.nextEffect = Ss : e2.firstEffect = Ss, e2.lastEffect = Ss));
            } else {
              if (null !== (t2 = Xa(Ss))) return t2.effectTag &= 2047, t2;
              null !== e2 && (e2.firstEffect = e2.lastEffect = null, e2.effectTag |= 2048);
            }
            if (null !== (t2 = Ss.sibling)) return t2;
            Ss = e2;
          } while (null !== Ss);
          return Ts === ks && (Ts = 5), null;
        }
        function pl(e2) {
          var t2 = e2.expirationTime;
          return t2 > (e2 = e2.childExpirationTime) ? t2 : e2;
        }
        function fl(e2) {
          var t2 = Bo();
          return Ho(99, dl.bind(null, e2, t2)), null;
        }
        function dl(e2, t2) {
          do {
            ml();
          } while (null !== Fs);
          if (0 != (48 & Es)) throw Error(a(327));
          var n2 = e2.finishedWork, r2 = e2.finishedExpirationTime;
          if (null === n2) return null;
          if (e2.finishedWork = null, e2.finishedExpirationTime = 0, n2 === e2.current) throw Error(a(177));
          e2.callbackNode = null, e2.callbackExpirationTime = 0, e2.callbackPriority = 90, e2.nextKnownPendingLevel = 0;
          var o2 = pl(n2);
          if (e2.firstPendingTime = o2, r2 <= e2.lastSuspendedTime ? e2.firstSuspendedTime = e2.lastSuspendedTime = e2.nextKnownPendingLevel = 0 : r2 <= e2.firstSuspendedTime && (e2.firstSuspendedTime = r2 - 1), r2 <= e2.lastPingedTime && (e2.lastPingedTime = 0), r2 <= e2.lastExpiredTime && (e2.lastExpiredTime = 0), e2 === xs && (Ss = xs = null, Cs = 0), 1 < n2.effectTag ? null !== n2.lastEffect ? (n2.lastEffect.nextEffect = n2, o2 = n2.firstEffect) : o2 = n2 : o2 = n2.firstEffect, null !== o2) {
            var i2 = Es;
            Es |= 32, vs.current = null, mn = qt;
            var s2 = dn();
            if (hn(s2)) {
              if ("selectionStart" in s2) var l2 = { start: s2.selectionStart, end: s2.selectionEnd };
              else e: {
                var c2 = (l2 = (l2 = s2.ownerDocument) && l2.defaultView || window).getSelection && l2.getSelection();
                if (c2 && 0 !== c2.rangeCount) {
                  l2 = c2.anchorNode;
                  var u2 = c2.anchorOffset, p2 = c2.focusNode;
                  c2 = c2.focusOffset;
                  try {
                    l2.nodeType, p2.nodeType;
                  } catch (e3) {
                    l2 = null;
                    break e;
                  }
                  var f2 = 0, d2 = -1, h2 = -1, m2 = 0, g2 = 0, y2 = s2, b2 = null;
                  t: for (; ; ) {
                    for (var v2; y2 !== l2 || 0 !== u2 && 3 !== y2.nodeType || (d2 = f2 + u2), y2 !== p2 || 0 !== c2 && 3 !== y2.nodeType || (h2 = f2 + c2), 3 === y2.nodeType && (f2 += y2.nodeValue.length), null !== (v2 = y2.firstChild); ) b2 = y2, y2 = v2;
                    for (; ; ) {
                      if (y2 === s2) break t;
                      if (b2 === l2 && ++m2 === u2 && (d2 = f2), b2 === p2 && ++g2 === c2 && (h2 = f2), null !== (v2 = y2.nextSibling)) break;
                      b2 = (y2 = b2).parentNode;
                    }
                    y2 = v2;
                  }
                  l2 = -1 === d2 || -1 === h2 ? null : { start: d2, end: h2 };
                } else l2 = null;
              }
              l2 = l2 || { start: 0, end: 0 };
            } else l2 = null;
            gn = { activeElementDetached: null, focusedElem: s2, selectionRange: l2 }, qt = false, As = o2;
            do {
              try {
                hl();
              } catch (e3) {
                if (null === As) throw Error(a(330));
                bl(As, e3), As = As.nextEffect;
              }
            } while (null !== As);
            As = o2;
            do {
              try {
                for (s2 = e2, l2 = t2; null !== As; ) {
                  var k2 = As.effectTag;
                  if (16 & k2 && Fe(As.stateNode, ""), 128 & k2) {
                    var w2 = As.alternate;
                    if (null !== w2) {
                      var _2 = w2.ref;
                      null !== _2 && ("function" == typeof _2 ? _2(null) : _2.current = null);
                    }
                  }
                  switch (1038 & k2) {
                    case 2:
                      cs(As), As.effectTag &= -3;
                      break;
                    case 6:
                      cs(As), As.effectTag &= -3, ps(As.alternate, As);
                      break;
                    case 1024:
                      As.effectTag &= -1025;
                      break;
                    case 1028:
                      As.effectTag &= -1025, ps(As.alternate, As);
                      break;
                    case 4:
                      ps(As.alternate, As);
                      break;
                    case 8:
                      us(s2, u2 = As, l2), ss(u2);
                  }
                  As = As.nextEffect;
                }
              } catch (e3) {
                if (null === As) throw Error(a(330));
                bl(As, e3), As = As.nextEffect;
              }
            } while (null !== As);
            if (_2 = gn, w2 = dn(), k2 = _2.focusedElem, l2 = _2.selectionRange, w2 !== k2 && k2 && k2.ownerDocument && function e3(t3, n3) {
              return !(!t3 || !n3) && (t3 === n3 || (!t3 || 3 !== t3.nodeType) && (n3 && 3 === n3.nodeType ? e3(t3, n3.parentNode) : "contains" in t3 ? t3.contains(n3) : !!t3.compareDocumentPosition && !!(16 & t3.compareDocumentPosition(n3))));
            }(k2.ownerDocument.documentElement, k2)) {
              null !== l2 && hn(k2) && (w2 = l2.start, void 0 === (_2 = l2.end) && (_2 = w2), "selectionStart" in k2 ? (k2.selectionStart = w2, k2.selectionEnd = Math.min(_2, k2.value.length)) : (_2 = (w2 = k2.ownerDocument || document) && w2.defaultView || window).getSelection && (_2 = _2.getSelection(), u2 = k2.textContent.length, s2 = Math.min(l2.start, u2), l2 = void 0 === l2.end ? s2 : Math.min(l2.end, u2), !_2.extend && s2 > l2 && (u2 = l2, l2 = s2, s2 = u2), u2 = fn(k2, s2), p2 = fn(k2, l2), u2 && p2 && (1 !== _2.rangeCount || _2.anchorNode !== u2.node || _2.anchorOffset !== u2.offset || _2.focusNode !== p2.node || _2.focusOffset !== p2.offset) && ((w2 = w2.createRange()).setStart(u2.node, u2.offset), _2.removeAllRanges(), s2 > l2 ? (_2.addRange(w2), _2.extend(p2.node, p2.offset)) : (w2.setEnd(p2.node, p2.offset), _2.addRange(w2))))), w2 = [];
              for (_2 = k2; _2 = _2.parentNode; ) 1 === _2.nodeType && w2.push({ element: _2, left: _2.scrollLeft, top: _2.scrollTop });
              for ("function" == typeof k2.focus && k2.focus(), k2 = 0; k2 < w2.length; k2++) (_2 = w2[k2]).element.scrollLeft = _2.left, _2.element.scrollTop = _2.top;
            }
            qt = !!mn, gn = mn = null, e2.current = n2, As = o2;
            do {
              try {
                for (k2 = e2; null !== As; ) {
                  var E2 = As.effectTag;
                  if (36 & E2 && is(k2, As.alternate, As), 128 & E2) {
                    w2 = void 0;
                    var x2 = As.ref;
                    if (null !== x2) {
                      var S2 = As.stateNode;
                      switch (As.tag) {
                        case 5:
                          w2 = S2;
                          break;
                        default:
                          w2 = S2;
                      }
                      "function" == typeof x2 ? x2(w2) : x2.current = w2;
                    }
                  }
                  As = As.nextEffect;
                }
              } catch (e3) {
                if (null === As) throw Error(a(330));
                bl(As, e3), As = As.nextEffect;
              }
            } while (null !== As);
            As = null, Ao(), Es = i2;
          } else e2.current = n2;
          if (Us) Us = false, Fs = e2, Bs = t2;
          else for (As = o2; null !== As; ) t2 = As.nextEffect, As.nextEffect = null, As = t2;
          if (0 === (t2 = e2.firstPendingTime) && (Is = null), 1073741823 === t2 ? e2 === Vs ? Hs++ : (Hs = 0, Vs = e2) : Hs = 0, "function" == typeof wl && wl(n2.stateNode, r2), Xs(e2), zs) throw zs = false, e2 = Ls, Ls = null, e2;
          return 0 != (8 & Es) || qo(), null;
        }
        function hl() {
          for (; null !== As; ) {
            var e2 = As.effectTag;
            0 != (256 & e2) && ns(As.alternate, As), 0 == (512 & e2) || Us || (Us = true, Vo(97, function() {
              return ml(), null;
            })), As = As.nextEffect;
          }
        }
        function ml() {
          if (90 !== Bs) {
            var e2 = 97 < Bs ? 97 : Bs;
            return Bs = 90, Ho(e2, gl);
          }
        }
        function gl() {
          if (null === Fs) return false;
          var e2 = Fs;
          if (Fs = null, 0 != (48 & Es)) throw Error(a(331));
          var t2 = Es;
          for (Es |= 32, e2 = e2.current.firstEffect; null !== e2; ) {
            try {
              var n2 = e2;
              if (0 != (512 & n2.effectTag)) switch (n2.tag) {
                case 0:
                case 11:
                case 15:
                case 22:
                  rs(5, n2), os(5, n2);
              }
            } catch (t3) {
              if (null === e2) throw Error(a(330));
              bl(e2, t3);
            }
            n2 = e2.nextEffect, e2.nextEffect = null, e2 = n2;
          }
          return Es = t2, qo(), true;
        }
        function yl(e2, t2, n2) {
          ci(e2, t2 = hs(e2, t2 = Ja(n2, t2), 1073741823)), null !== (e2 = Qs(e2, 1073741823)) && Xs(e2);
        }
        function bl(e2, t2) {
          if (3 === e2.tag) yl(e2, e2, t2);
          else for (var n2 = e2.return; null !== n2; ) {
            if (3 === n2.tag) {
              yl(n2, e2, t2);
              break;
            }
            if (1 === n2.tag) {
              var r2 = n2.stateNode;
              if ("function" == typeof n2.type.getDerivedStateFromError || "function" == typeof r2.componentDidCatch && (null === Is || !Is.has(r2))) {
                ci(n2, e2 = ms(n2, e2 = Ja(t2, e2), 1073741823)), null !== (n2 = Qs(n2, 1073741823)) && Xs(n2);
                break;
              }
            }
            n2 = n2.return;
          }
        }
        function vl(e2, t2, n2) {
          var r2 = e2.pingCache;
          null !== r2 && r2.delete(t2), xs === e2 && Cs === n2 ? Ts === _s || Ts === ws && 1073741823 === Ns && Fo() - js < 500 ? nl(e2, Cs) : Ms = true : Rl(e2, n2) && (0 !== (t2 = e2.lastPingedTime) && t2 < n2 || (e2.lastPingedTime = n2, Xs(e2)));
        }
        function kl(e2, t2) {
          var n2 = e2.stateNode;
          null !== n2 && n2.delete(t2), 0 === (t2 = 0) && (t2 = Ys(t2 = qs(), e2, null)), null !== (e2 = Qs(e2, t2)) && Xs(e2);
        }
        gs = function(e2, t2, n2) {
          var r2 = t2.expirationTime;
          if (null !== e2) {
            var o2 = t2.pendingProps;
            if (e2.memoizedProps !== o2 || fo.current) Pa = true;
            else {
              if (r2 < n2) {
                switch (Pa = false, t2.tag) {
                  case 3:
                    Ua(t2), Oa();
                    break;
                  case 5:
                    if (ji(t2), 4 & t2.mode && 1 !== n2 && o2.hidden) return t2.expirationTime = t2.childExpirationTime = 1, null;
                    break;
                  case 1:
                    go(t2.type) && ko(t2);
                    break;
                  case 4:
                    Ri(t2, t2.stateNode.containerInfo);
                    break;
                  case 10:
                    r2 = t2.memoizedProps.value, o2 = t2.type._context, co(Go, o2._currentValue), o2._currentValue = r2;
                    break;
                  case 13:
                    if (null !== t2.memoizedState) return 0 !== (r2 = t2.child.childExpirationTime) && r2 >= n2 ? Va(e2, t2, n2) : (co(zi, 1 & zi.current), null !== (t2 = Ka(e2, t2, n2)) ? t2.sibling : null);
                    co(zi, 1 & zi.current);
                    break;
                  case 19:
                    if (r2 = t2.childExpirationTime >= n2, 0 != (64 & e2.effectTag)) {
                      if (r2) return Ya(e2, t2, n2);
                      t2.effectTag |= 64;
                    }
                    if (null !== (o2 = t2.memoizedState) && (o2.rendering = null, o2.tail = null), co(zi, zi.current), !r2) return null;
                }
                return Ka(e2, t2, n2);
              }
              Pa = false;
            }
          } else Pa = false;
          switch (t2.expirationTime = 0, t2.tag) {
            case 2:
              if (r2 = t2.type, null !== e2 && (e2.alternate = null, t2.alternate = null, t2.effectTag |= 2), e2 = t2.pendingProps, o2 = mo(t2, po.current), ri(t2, n2), o2 = Ki(null, t2, r2, e2, o2, n2), t2.effectTag |= 1, "object" == typeof o2 && null !== o2 && "function" == typeof o2.render && void 0 === o2.$$typeof) {
                if (t2.tag = 1, t2.memoizedState = null, t2.updateQueue = null, go(r2)) {
                  var i2 = true;
                  ko(t2);
                } else i2 = false;
                t2.memoizedState = null !== o2.state && void 0 !== o2.state ? o2.state : null, ai(t2);
                var s2 = r2.getDerivedStateFromProps;
                "function" == typeof s2 && mi(t2, r2, s2, e2), o2.updater = gi, t2.stateNode = o2, o2._reactInternalFiber = t2, ki(t2, r2, e2, n2), t2 = Ia(null, t2, r2, true, i2, n2);
              } else t2.tag = 0, Da(null, t2, o2, n2), t2 = t2.child;
              return t2;
            case 16:
              e: {
                if (o2 = t2.elementType, null !== e2 && (e2.alternate = null, t2.alternate = null, t2.effectTag |= 2), e2 = t2.pendingProps, function(e3) {
                  if (-1 === e3._status) {
                    e3._status = 0;
                    var t3 = e3._ctor;
                    t3 = t3(), e3._result = t3, t3.then(function(t4) {
                      0 === e3._status && (t4 = t4.default, e3._status = 1, e3._result = t4);
                    }, function(t4) {
                      0 === e3._status && (e3._status = 2, e3._result = t4);
                    });
                  }
                }(o2), 1 !== o2._status) throw o2._result;
                switch (o2 = o2._result, t2.type = o2, i2 = t2.tag = function(e3) {
                  if ("function" == typeof e3) return Sl(e3) ? 1 : 0;
                  if (null != e3) {
                    if ((e3 = e3.$$typeof) === le) return 11;
                    if (e3 === pe) return 14;
                  }
                  return 2;
                }(o2), e2 = Qo(o2, e2), i2) {
                  case 0:
                    t2 = za(null, t2, o2, e2, n2);
                    break e;
                  case 1:
                    t2 = La(null, t2, o2, e2, n2);
                    break e;
                  case 11:
                    t2 = Ra(null, t2, o2, e2, n2);
                    break e;
                  case 14:
                    t2 = Ma(null, t2, o2, Qo(o2.type, e2), r2, n2);
                    break e;
                }
                throw Error(a(306, o2, ""));
              }
              return t2;
            case 0:
              return r2 = t2.type, o2 = t2.pendingProps, za(e2, t2, r2, o2 = t2.elementType === r2 ? o2 : Qo(r2, o2), n2);
            case 1:
              return r2 = t2.type, o2 = t2.pendingProps, La(e2, t2, r2, o2 = t2.elementType === r2 ? o2 : Qo(r2, o2), n2);
            case 3:
              if (Ua(t2), r2 = t2.updateQueue, null === e2 || null === r2) throw Error(a(282));
              if (r2 = t2.pendingProps, o2 = null !== (o2 = t2.memoizedState) ? o2.element : null, si(e2, t2), pi(t2, r2, null, n2), (r2 = t2.memoizedState.element) === o2) Oa(), t2 = Ka(e2, t2, n2);
              else {
                if ((o2 = t2.stateNode.hydrate) && (wa = wn(t2.stateNode.containerInfo.firstChild), ka = t2, o2 = _a = true), o2) for (n2 = Ci(t2, null, r2, n2), t2.child = n2; n2; ) n2.effectTag = -3 & n2.effectTag | 1024, n2 = n2.sibling;
                else Da(e2, t2, r2, n2), Oa();
                t2 = t2.child;
              }
              return t2;
            case 5:
              return ji(t2), null === e2 && Sa(t2), r2 = t2.type, o2 = t2.pendingProps, i2 = null !== e2 ? e2.memoizedProps : null, s2 = o2.children, bn(r2, o2) ? s2 = null : null !== i2 && bn(r2, i2) && (t2.effectTag |= 16), Aa(e2, t2), 4 & t2.mode && 1 !== n2 && o2.hidden ? (t2.expirationTime = t2.childExpirationTime = 1, t2 = null) : (Da(e2, t2, s2, n2), t2 = t2.child), t2;
            case 6:
              return null === e2 && Sa(t2), null;
            case 13:
              return Va(e2, t2, n2);
            case 4:
              return Ri(t2, t2.stateNode.containerInfo), r2 = t2.pendingProps, null === e2 ? t2.child = Si(t2, null, r2, n2) : Da(e2, t2, r2, n2), t2.child;
            case 11:
              return r2 = t2.type, o2 = t2.pendingProps, Ra(e2, t2, r2, o2 = t2.elementType === r2 ? o2 : Qo(r2, o2), n2);
            case 7:
              return Da(e2, t2, t2.pendingProps, n2), t2.child;
            case 8:
            case 12:
              return Da(e2, t2, t2.pendingProps.children, n2), t2.child;
            case 10:
              e: {
                r2 = t2.type._context, o2 = t2.pendingProps, s2 = t2.memoizedProps, i2 = o2.value;
                var l2 = t2.type._context;
                if (co(Go, l2._currentValue), l2._currentValue = i2, null !== s2) if (l2 = s2.value, 0 === (i2 = Lr(l2, i2) ? 0 : 0 | ("function" == typeof r2._calculateChangedBits ? r2._calculateChangedBits(l2, i2) : 1073741823))) {
                  if (s2.children === o2.children && !fo.current) {
                    t2 = Ka(e2, t2, n2);
                    break e;
                  }
                } else for (null !== (l2 = t2.child) && (l2.return = t2); null !== l2; ) {
                  var c2 = l2.dependencies;
                  if (null !== c2) {
                    s2 = l2.child;
                    for (var u2 = c2.firstContext; null !== u2; ) {
                      if (u2.context === r2 && 0 != (u2.observedBits & i2)) {
                        1 === l2.tag && ((u2 = li(n2, null)).tag = 2, ci(l2, u2)), l2.expirationTime < n2 && (l2.expirationTime = n2), null !== (u2 = l2.alternate) && u2.expirationTime < n2 && (u2.expirationTime = n2), ni(l2.return, n2), c2.expirationTime < n2 && (c2.expirationTime = n2);
                        break;
                      }
                      u2 = u2.next;
                    }
                  } else s2 = 10 === l2.tag && l2.type === t2.type ? null : l2.child;
                  if (null !== s2) s2.return = l2;
                  else for (s2 = l2; null !== s2; ) {
                    if (s2 === t2) {
                      s2 = null;
                      break;
                    }
                    if (null !== (l2 = s2.sibling)) {
                      l2.return = s2.return, s2 = l2;
                      break;
                    }
                    s2 = s2.return;
                  }
                  l2 = s2;
                }
                Da(e2, t2, o2.children, n2), t2 = t2.child;
              }
              return t2;
            case 9:
              return o2 = t2.type, r2 = (i2 = t2.pendingProps).children, ri(t2, n2), r2 = r2(o2 = oi(o2, i2.unstable_observedBits)), t2.effectTag |= 1, Da(e2, t2, r2, n2), t2.child;
            case 14:
              return i2 = Qo(o2 = t2.type, t2.pendingProps), Ma(e2, t2, o2, i2 = Qo(o2.type, i2), r2, n2);
            case 15:
              return ja(e2, t2, t2.type, t2.pendingProps, r2, n2);
            case 17:
              return r2 = t2.type, o2 = t2.pendingProps, o2 = t2.elementType === r2 ? o2 : Qo(r2, o2), null !== e2 && (e2.alternate = null, t2.alternate = null, t2.effectTag |= 2), t2.tag = 1, go(r2) ? (e2 = true, ko(t2)) : e2 = false, ri(t2, n2), bi(t2, r2, o2), ki(t2, r2, o2, n2), Ia(null, t2, r2, true, e2, n2);
            case 19:
              return Ya(e2, t2, n2);
          }
          throw Error(a(156, t2.tag));
        };
        var wl = null, _l = null;
        function El(e2, t2, n2, r2) {
          this.tag = e2, this.key = n2, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.ref = null, this.pendingProps = t2, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = r2, this.effectTag = 0, this.lastEffect = this.firstEffect = this.nextEffect = null, this.childExpirationTime = this.expirationTime = 0, this.alternate = null;
        }
        function xl(e2, t2, n2, r2) {
          return new El(e2, t2, n2, r2);
        }
        function Sl(e2) {
          return !(!(e2 = e2.prototype) || !e2.isReactComponent);
        }
        function Cl(e2, t2) {
          var n2 = e2.alternate;
          return null === n2 ? ((n2 = xl(e2.tag, t2, e2.key, e2.mode)).elementType = e2.elementType, n2.type = e2.type, n2.stateNode = e2.stateNode, n2.alternate = e2, e2.alternate = n2) : (n2.pendingProps = t2, n2.effectTag = 0, n2.nextEffect = null, n2.firstEffect = null, n2.lastEffect = null), n2.childExpirationTime = e2.childExpirationTime, n2.expirationTime = e2.expirationTime, n2.child = e2.child, n2.memoizedProps = e2.memoizedProps, n2.memoizedState = e2.memoizedState, n2.updateQueue = e2.updateQueue, t2 = e2.dependencies, n2.dependencies = null === t2 ? null : { expirationTime: t2.expirationTime, firstContext: t2.firstContext, responders: t2.responders }, n2.sibling = e2.sibling, n2.index = e2.index, n2.ref = e2.ref, n2;
        }
        function Tl(e2, t2, n2, r2, o2, i2) {
          var s2 = 2;
          if (r2 = e2, "function" == typeof e2) Sl(e2) && (s2 = 1);
          else if ("string" == typeof e2) s2 = 5;
          else e: switch (e2) {
            case ne:
              return Ol(n2.children, o2, i2, t2);
            case se:
              s2 = 8, o2 |= 7;
              break;
            case re:
              s2 = 8, o2 |= 1;
              break;
            case oe:
              return (e2 = xl(12, n2, t2, 8 | o2)).elementType = oe, e2.type = oe, e2.expirationTime = i2, e2;
            case ce:
              return (e2 = xl(13, n2, t2, o2)).type = ce, e2.elementType = ce, e2.expirationTime = i2, e2;
            case ue:
              return (e2 = xl(19, n2, t2, o2)).elementType = ue, e2.expirationTime = i2, e2;
            default:
              if ("object" == typeof e2 && null !== e2) switch (e2.$$typeof) {
                case ie:
                  s2 = 10;
                  break e;
                case ae:
                  s2 = 9;
                  break e;
                case le:
                  s2 = 11;
                  break e;
                case pe:
                  s2 = 14;
                  break e;
                case fe:
                  s2 = 16, r2 = null;
                  break e;
                case de:
                  s2 = 22;
                  break e;
              }
              throw Error(a(130, null == e2 ? e2 : typeof e2, ""));
          }
          return (t2 = xl(s2, n2, t2, o2)).elementType = e2, t2.type = r2, t2.expirationTime = i2, t2;
        }
        function Ol(e2, t2, n2, r2) {
          return (e2 = xl(7, e2, r2, t2)).expirationTime = n2, e2;
        }
        function Nl(e2, t2, n2) {
          return (e2 = xl(6, e2, null, t2)).expirationTime = n2, e2;
        }
        function Pl(e2, t2, n2) {
          return (t2 = xl(4, null !== e2.children ? e2.children : [], e2.key, t2)).expirationTime = n2, t2.stateNode = { containerInfo: e2.containerInfo, pendingChildren: null, implementation: e2.implementation }, t2;
        }
        function Dl(e2, t2, n2) {
          this.tag = t2, this.current = null, this.containerInfo = e2, this.pingCache = this.pendingChildren = null, this.finishedExpirationTime = 0, this.finishedWork = null, this.timeoutHandle = -1, this.pendingContext = this.context = null, this.hydrate = n2, this.callbackNode = null, this.callbackPriority = 90, this.lastExpiredTime = this.lastPingedTime = this.nextKnownPendingLevel = this.lastSuspendedTime = this.firstSuspendedTime = this.firstPendingTime = 0;
        }
        function Rl(e2, t2) {
          var n2 = e2.firstSuspendedTime;
          return e2 = e2.lastSuspendedTime, 0 !== n2 && n2 >= t2 && e2 <= t2;
        }
        function Ml(e2, t2) {
          var n2 = e2.firstSuspendedTime, r2 = e2.lastSuspendedTime;
          n2 < t2 && (e2.firstSuspendedTime = t2), (r2 > t2 || 0 === n2) && (e2.lastSuspendedTime = t2), t2 <= e2.lastPingedTime && (e2.lastPingedTime = 0), t2 <= e2.lastExpiredTime && (e2.lastExpiredTime = 0);
        }
        function jl(e2, t2) {
          t2 > e2.firstPendingTime && (e2.firstPendingTime = t2);
          var n2 = e2.firstSuspendedTime;
          0 !== n2 && (t2 >= n2 ? e2.firstSuspendedTime = e2.lastSuspendedTime = e2.nextKnownPendingLevel = 0 : t2 >= e2.lastSuspendedTime && (e2.lastSuspendedTime = t2 + 1), t2 > e2.nextKnownPendingLevel && (e2.nextKnownPendingLevel = t2));
        }
        function Al(e2, t2) {
          var n2 = e2.lastExpiredTime;
          (0 === n2 || n2 > t2) && (e2.lastExpiredTime = t2);
        }
        function zl(e2, t2, n2, r2) {
          var o2 = t2.current, i2 = qs(), s2 = di.suspense;
          i2 = Ys(i2, o2, s2);
          e: if (n2) {
            t: {
              if (Ze(n2 = n2._reactInternalFiber) !== n2 || 1 !== n2.tag) throw Error(a(170));
              var l2 = n2;
              do {
                switch (l2.tag) {
                  case 3:
                    l2 = l2.stateNode.context;
                    break t;
                  case 1:
                    if (go(l2.type)) {
                      l2 = l2.stateNode.__reactInternalMemoizedMergedChildContext;
                      break t;
                    }
                }
                l2 = l2.return;
              } while (null !== l2);
              throw Error(a(171));
            }
            if (1 === n2.tag) {
              var c2 = n2.type;
              if (go(c2)) {
                n2 = vo(n2, c2, l2);
                break e;
              }
            }
            n2 = l2;
          } else n2 = uo;
          return null === t2.context ? t2.context = n2 : t2.pendingContext = n2, (t2 = li(i2, s2)).payload = { element: e2 }, null !== (r2 = void 0 === r2 ? null : r2) && (t2.callback = r2), ci(o2, t2), Ks(o2, i2), i2;
        }
        function Ll(e2) {
          if (!(e2 = e2.current).child) return null;
          switch (e2.child.tag) {
            case 5:
            default:
              return e2.child.stateNode;
          }
        }
        function Il(e2, t2) {
          null !== (e2 = e2.memoizedState) && null !== e2.dehydrated && e2.retryTime < t2 && (e2.retryTime = t2);
        }
        function Ul(e2, t2) {
          Il(e2, t2), (e2 = e2.alternate) && Il(e2, t2);
        }
        function Fl(e2, t2, n2) {
          var r2 = new Dl(e2, t2, n2 = null != n2 && true === n2.hydrate), o2 = xl(3, null, null, 2 === t2 ? 7 : 1 === t2 ? 3 : 0);
          r2.current = o2, o2.stateNode = r2, ai(o2), e2[Cn] = r2.current, n2 && 0 !== t2 && function(e3, t3) {
            var n3 = Je(t3);
            Ct.forEach(function(e4) {
              ht(e4, t3, n3);
            }), Tt.forEach(function(e4) {
              ht(e4, t3, n3);
            });
          }(0, 9 === e2.nodeType ? e2 : e2.ownerDocument), this._internalRoot = r2;
        }
        function Bl(e2) {
          return !(!e2 || 1 !== e2.nodeType && 9 !== e2.nodeType && 11 !== e2.nodeType && (8 !== e2.nodeType || " react-mount-point-unstable " !== e2.nodeValue));
        }
        function Wl(e2, t2, n2, r2, o2) {
          var i2 = n2._reactRootContainer;
          if (i2) {
            var a2 = i2._internalRoot;
            if ("function" == typeof o2) {
              var s2 = o2;
              o2 = function() {
                var e3 = Ll(a2);
                s2.call(e3);
              };
            }
            zl(t2, a2, e2, o2);
          } else {
            if (i2 = n2._reactRootContainer = function(e3, t3) {
              if (t3 || (t3 = !(!(t3 = e3 ? 9 === e3.nodeType ? e3.documentElement : e3.firstChild : null) || 1 !== t3.nodeType || !t3.hasAttribute("data-reactroot"))), !t3) for (var n3; n3 = e3.lastChild; ) e3.removeChild(n3);
              return new Fl(e3, 0, t3 ? { hydrate: true } : void 0);
            }(n2, r2), a2 = i2._internalRoot, "function" == typeof o2) {
              var l2 = o2;
              o2 = function() {
                var e3 = Ll(a2);
                l2.call(e3);
              };
            }
            tl(function() {
              zl(t2, a2, e2, o2);
            });
          }
          return Ll(a2);
        }
        function Hl(e2, t2, n2) {
          var r2 = 3 < arguments.length && void 0 !== arguments[3] ? arguments[3] : null;
          return { $$typeof: te, key: null == r2 ? null : "" + r2, children: e2, containerInfo: t2, implementation: n2 };
        }
        function Vl(e2, t2) {
          var n2 = 2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : null;
          if (!Bl(t2)) throw Error(a(200));
          return Hl(e2, t2, null, n2);
        }
        Fl.prototype.render = function(e2) {
          zl(e2, this._internalRoot, null, null);
        }, Fl.prototype.unmount = function() {
          var e2 = this._internalRoot, t2 = e2.containerInfo;
          zl(null, e2, null, function() {
            t2[Cn] = null;
          });
        }, mt = function(e2) {
          if (13 === e2.tag) {
            var t2 = Ko(qs(), 150, 100);
            Ks(e2, t2), Ul(e2, t2);
          }
        }, gt = function(e2) {
          13 === e2.tag && (Ks(e2, 3), Ul(e2, 3));
        }, yt = function(e2) {
          if (13 === e2.tag) {
            var t2 = qs();
            Ks(e2, t2 = Ys(t2, e2, null)), Ul(e2, t2);
          }
        }, O = function(e2, t2, n2) {
          switch (t2) {
            case "input":
              if (Se(e2, n2), t2 = n2.name, "radio" === n2.type && null != t2) {
                for (n2 = e2; n2.parentNode; ) n2 = n2.parentNode;
                for (n2 = n2.querySelectorAll("input[name=" + JSON.stringify("" + t2) + '][type="radio"]'), t2 = 0; t2 < n2.length; t2++) {
                  var r2 = n2[t2];
                  if (r2 !== e2 && r2.form === e2.form) {
                    var o2 = Pn(r2);
                    if (!o2) throw Error(a(90));
                    we(r2), Se(r2, o2);
                  }
                }
              }
              break;
            case "textarea":
              Re(e2, n2);
              break;
            case "select":
              null != (t2 = n2.value) && Ne(e2, !!n2.multiple, t2, false);
          }
        }, j = el, A = function(e2, t2, n2, r2, o2) {
          var i2 = Es;
          Es |= 4;
          try {
            return Ho(98, e2.bind(null, t2, n2, r2, o2));
          } finally {
            0 === (Es = i2) && qo();
          }
        }, z = function() {
          0 == (49 & Es) && (function() {
            if (null !== Ws) {
              var e2 = Ws;
              Ws = null, e2.forEach(function(e3, t2) {
                Al(t2, e3), Xs(t2);
              }), qo();
            }
          }(), ml());
        }, L = function(e2, t2) {
          var n2 = Es;
          Es |= 2;
          try {
            return e2(t2);
          } finally {
            0 === (Es = n2) && qo();
          }
        };
        var $l, ql, Yl = { Events: [On, Nn, Pn, C, E, Ln, function(e2) {
          ot(e2, zn);
        }, R, M, Xt, st, ml, { current: false }] };
        ql = ($l = { findFiberByHostInstance: Tn, bundleType: 0, version: "16.14.0", rendererPackageName: "react-dom" }).findFiberByHostInstance, function(e2) {
          if ("undefined" == typeof __REACT_DEVTOOLS_GLOBAL_HOOK__) return false;
          var t2 = __REACT_DEVTOOLS_GLOBAL_HOOK__;
          if (t2.isDisabled || !t2.supportsFiber) return true;
          try {
            var n2 = t2.inject(e2);
            wl = function(e3) {
              try {
                t2.onCommitFiberRoot(n2, e3, void 0, 64 == (64 & e3.current.effectTag));
              } catch (e4) {
              }
            }, _l = function(e3) {
              try {
                t2.onCommitFiberUnmount(n2, e3);
              } catch (e4) {
              }
            };
          } catch (e3) {
          }
        }(o({}, $l, { overrideHookState: null, overrideProps: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: G.ReactCurrentDispatcher, findHostInstanceByFiber: function(e2) {
          return null === (e2 = nt(e2)) ? null : e2.stateNode;
        }, findFiberByHostInstance: function(e2) {
          return ql ? ql(e2) : null;
        }, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null })), t.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Yl, t.createPortal = Vl, t.findDOMNode = function(e2) {
          if (null == e2) return null;
          if (1 === e2.nodeType) return e2;
          var t2 = e2._reactInternalFiber;
          if (void 0 === t2) {
            if ("function" == typeof e2.render) throw Error(a(188));
            throw Error(a(268, Object.keys(e2)));
          }
          return e2 = null === (e2 = nt(t2)) ? null : e2.stateNode;
        }, t.flushSync = function(e2, t2) {
          if (0 != (48 & Es)) throw Error(a(187));
          var n2 = Es;
          Es |= 1;
          try {
            return Ho(99, e2.bind(null, t2));
          } finally {
            Es = n2, qo();
          }
        }, t.hydrate = function(e2, t2, n2) {
          if (!Bl(t2)) throw Error(a(200));
          return Wl(null, e2, t2, true, n2);
        }, t.render = function(e2, t2, n2) {
          if (!Bl(t2)) throw Error(a(200));
          return Wl(null, e2, t2, false, n2);
        }, t.unmountComponentAtNode = function(e2) {
          if (!Bl(e2)) throw Error(a(40));
          return !!e2._reactRootContainer && (tl(function() {
            Wl(null, null, e2, false, function() {
              e2._reactRootContainer = null, e2[Cn] = null;
            });
          }), true);
        }, t.unstable_batchedUpdates = el, t.unstable_createPortal = function(e2, t2) {
          return Vl(e2, t2, 2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : null);
        }, t.unstable_renderSubtreeIntoContainer = function(e2, t2, n2, r2) {
          if (!Bl(n2)) throw Error(a(200));
          if (null == e2 || void 0 === e2._reactInternalFiber) throw Error(a(38));
          return Wl(e2, t2, n2, false, r2);
        }, t.version = "16.14.0";
      }, function(e, t, n) {
        e.exports = n(24);
      }, function(e, t, n) {
        var r, o, i, a, s;
        if ("undefined" == typeof window || "function" != typeof MessageChannel) {
          var l = null, c = null, u = function() {
            if (null !== l) try {
              var e2 = t.unstable_now();
              l(true, e2), l = null;
            } catch (e3) {
              throw setTimeout(u, 0), e3;
            }
          }, p = Date.now();
          t.unstable_now = function() {
            return Date.now() - p;
          }, r = function(e2) {
            null !== l ? setTimeout(r, 0, e2) : (l = e2, setTimeout(u, 0));
          }, o = function(e2, t2) {
            c = setTimeout(e2, t2);
          }, i = function() {
            clearTimeout(c);
          }, a = function() {
            return false;
          }, s = t.unstable_forceFrameRate = function() {
          };
        } else {
          var f = window.performance, d = window.Date, h = window.setTimeout, m = window.clearTimeout;
          if ("undefined" != typeof console) {
            var g = window.cancelAnimationFrame;
            "function" != typeof window.requestAnimationFrame && console.error("This browser doesn't support requestAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills"), "function" != typeof g && console.error("This browser doesn't support cancelAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills");
          }
          if ("object" == typeof f && "function" == typeof f.now) t.unstable_now = function() {
            return f.now();
          };
          else {
            var y = d.now();
            t.unstable_now = function() {
              return d.now() - y;
            };
          }
          var b = false, v = null, k = -1, w = 5, _ = 0;
          a = function() {
            return t.unstable_now() >= _;
          }, s = function() {
          }, t.unstable_forceFrameRate = function(e2) {
            0 > e2 || 125 < e2 ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing framerates higher than 125 fps is not unsupported") : w = 0 < e2 ? Math.floor(1e3 / e2) : 5;
          };
          var E = new MessageChannel(), x = E.port2;
          E.port1.onmessage = function() {
            if (null !== v) {
              var e2 = t.unstable_now();
              _ = e2 + w;
              try {
                v(true, e2) ? x.postMessage(null) : (b = false, v = null);
              } catch (e3) {
                throw x.postMessage(null), e3;
              }
            } else b = false;
          }, r = function(e2) {
            v = e2, b || (b = true, x.postMessage(null));
          }, o = function(e2, n2) {
            k = h(function() {
              e2(t.unstable_now());
            }, n2);
          }, i = function() {
            m(k), k = -1;
          };
        }
        function S(e2, t2) {
          var n2 = e2.length;
          e2.push(t2);
          e: for (; ; ) {
            var r2 = n2 - 1 >>> 1, o2 = e2[r2];
            if (!(void 0 !== o2 && 0 < O(o2, t2))) break e;
            e2[r2] = t2, e2[n2] = o2, n2 = r2;
          }
        }
        function C(e2) {
          return void 0 === (e2 = e2[0]) ? null : e2;
        }
        function T(e2) {
          var t2 = e2[0];
          if (void 0 !== t2) {
            var n2 = e2.pop();
            if (n2 !== t2) {
              e2[0] = n2;
              e: for (var r2 = 0, o2 = e2.length; r2 < o2; ) {
                var i2 = 2 * (r2 + 1) - 1, a2 = e2[i2], s2 = i2 + 1, l2 = e2[s2];
                if (void 0 !== a2 && 0 > O(a2, n2)) void 0 !== l2 && 0 > O(l2, a2) ? (e2[r2] = l2, e2[s2] = n2, r2 = s2) : (e2[r2] = a2, e2[i2] = n2, r2 = i2);
                else {
                  if (!(void 0 !== l2 && 0 > O(l2, n2))) break e;
                  e2[r2] = l2, e2[s2] = n2, r2 = s2;
                }
              }
            }
            return t2;
          }
          return null;
        }
        function O(e2, t2) {
          var n2 = e2.sortIndex - t2.sortIndex;
          return 0 !== n2 ? n2 : e2.id - t2.id;
        }
        var N = [], P = [], D = 1, R = null, M = 3, j = false, A = false, z = false;
        function L(e2) {
          for (var t2 = C(P); null !== t2; ) {
            if (null === t2.callback) T(P);
            else {
              if (!(t2.startTime <= e2)) break;
              T(P), t2.sortIndex = t2.expirationTime, S(N, t2);
            }
            t2 = C(P);
          }
        }
        function I(e2) {
          if (z = false, L(e2), !A) if (null !== C(N)) A = true, r(U);
          else {
            var t2 = C(P);
            null !== t2 && o(I, t2.startTime - e2);
          }
        }
        function U(e2, n2) {
          A = false, z && (z = false, i()), j = true;
          var r2 = M;
          try {
            for (L(n2), R = C(N); null !== R && (!(R.expirationTime > n2) || e2 && !a()); ) {
              var s2 = R.callback;
              if (null !== s2) {
                R.callback = null, M = R.priorityLevel;
                var l2 = s2(R.expirationTime <= n2);
                n2 = t.unstable_now(), "function" == typeof l2 ? R.callback = l2 : R === C(N) && T(N), L(n2);
              } else T(N);
              R = C(N);
            }
            if (null !== R) var c2 = true;
            else {
              var u2 = C(P);
              null !== u2 && o(I, u2.startTime - n2), c2 = false;
            }
            return c2;
          } finally {
            R = null, M = r2, j = false;
          }
        }
        function F(e2) {
          switch (e2) {
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
        var B = s;
        t.unstable_IdlePriority = 5, t.unstable_ImmediatePriority = 1, t.unstable_LowPriority = 4, t.unstable_NormalPriority = 3, t.unstable_Profiling = null, t.unstable_UserBlockingPriority = 2, t.unstable_cancelCallback = function(e2) {
          e2.callback = null;
        }, t.unstable_continueExecution = function() {
          A || j || (A = true, r(U));
        }, t.unstable_getCurrentPriorityLevel = function() {
          return M;
        }, t.unstable_getFirstCallbackNode = function() {
          return C(N);
        }, t.unstable_next = function(e2) {
          switch (M) {
            case 1:
            case 2:
            case 3:
              var t2 = 3;
              break;
            default:
              t2 = M;
          }
          var n2 = M;
          M = t2;
          try {
            return e2();
          } finally {
            M = n2;
          }
        }, t.unstable_pauseExecution = function() {
        }, t.unstable_requestPaint = B, t.unstable_runWithPriority = function(e2, t2) {
          switch (e2) {
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
              break;
            default:
              e2 = 3;
          }
          var n2 = M;
          M = e2;
          try {
            return t2();
          } finally {
            M = n2;
          }
        }, t.unstable_scheduleCallback = function(e2, n2, a2) {
          var s2 = t.unstable_now();
          if ("object" == typeof a2 && null !== a2) {
            var l2 = a2.delay;
            l2 = "number" == typeof l2 && 0 < l2 ? s2 + l2 : s2, a2 = "number" == typeof a2.timeout ? a2.timeout : F(e2);
          } else a2 = F(e2), l2 = s2;
          return e2 = { id: D++, callback: n2, priorityLevel: e2, startTime: l2, expirationTime: a2 = l2 + a2, sortIndex: -1 }, l2 > s2 ? (e2.sortIndex = l2, S(P, e2), null === C(N) && e2 === C(P) && (z ? i() : z = true, o(I, l2 - s2))) : (e2.sortIndex = a2, S(N, e2), A || j || (A = true, r(U))), e2;
        }, t.unstable_shouldYield = function() {
          var e2 = t.unstable_now();
          L(e2);
          var n2 = C(N);
          return n2 !== R && null !== R && null !== n2 && null !== n2.callback && n2.startTime <= e2 && n2.expirationTime < R.expirationTime || a();
        }, t.unstable_wrapCallback = function(e2) {
          var t2 = M;
          return function() {
            var n2 = M;
            M = t2;
            try {
              return e2.apply(this, arguments);
            } finally {
              M = n2;
            }
          };
        };
      }, function(e, t, n) {
        Object.defineProperty(t, "__esModule", { value: true }), t.toString = void 0;
        const r = n(13), o = n(26), i = n(17), a = { string: r.quoteString, number: (e2) => Object.is(e2, -0) ? "-0" : String(e2), boolean: String, symbol: (e2, t2, n2) => {
          const r2 = Symbol.keyFor(e2);
          return void 0 !== r2 ? `Symbol.for(${n2(r2)})` : `Symbol(${n2(e2.description)})`;
        }, bigint: (e2, t2, n2) => `BigInt(${n2(String(e2))})`, undefined: String, object: o.objectToString, function: i.functionToString };
        t.toString = (e2, t2, n2, r2) => null === e2 ? "null" : a[typeof e2](e2, t2, n2, r2);
      }, function(e, t, n) {
        (function(e2, r) {
          Object.defineProperty(t, "__esModule", { value: true }), t.objectToString = void 0;
          const o = n(13), i = n(17), a = n(31);
          t.objectToString = (t2, n2, o2, i2) => {
            if ("function" == typeof e2 && e2.isBuffer(t2)) return `Buffer.from(${o2(t2.toString("base64"))}, 'base64')`;
            if ("object" == typeof r && t2 === r) return s(t2, n2, o2);
            const a2 = l[Object.prototype.toString.call(t2)];
            return a2 ? a2(t2, n2, o2, i2) : void 0;
          };
          const s = (e3, t2, n2) => `Function(${n2("return this")})()`, l = { "[object Array]": a.arrayToString, "[object Object]": (e3, t2, n2, r2) => {
            const a2 = t2 ? "\n" : "", s2 = t2 ? " " : "", l2 = Object.keys(e3).reduce(function(r3, a3) {
              const l3 = e3[a3], c = n2(l3, a3);
              if (void 0 === c) return r3;
              const u = c.split("\n").join("\n" + t2);
              return i.USED_METHOD_KEY.has(l3) ? (r3.push(`${t2}${u}`), r3) : (r3.push(`${t2}${o.quoteKey(a3, n2)}:${s2}${u}`), r3);
            }, []).join("," + a2);
            return "" === l2 ? "{}" : `{${a2}${l2}${a2}}`;
          }, "[object Error]": (e3, t2, n2) => `new Error(${n2(e3.message)})`, "[object Date]": (e3) => `new Date(${e3.getTime()})`, "[object String]": (e3, t2, n2) => `new String(${n2(e3.toString())})`, "[object Number]": (e3) => `new Number(${e3})`, "[object Boolean]": (e3) => `new Boolean(${e3})`, "[object Set]": (e3, t2, n2) => `new Set(${n2(Array.from(e3))})`, "[object Map]": (e3, t2, n2) => `new Map(${n2(Array.from(e3))})`, "[object RegExp]": String, "[object global]": s, "[object Window]": s };
        }).call(this, n(27).Buffer, n(15));
      }, function(e, t, n) {
        (function(e2) {
          var r = n(28), o = n(29), i = n(30);
          function a() {
            return l.TYPED_ARRAY_SUPPORT ? 2147483647 : 1073741823;
          }
          function s(e3, t2) {
            if (a() < t2) throw new RangeError("Invalid typed array length");
            return l.TYPED_ARRAY_SUPPORT ? (e3 = new Uint8Array(t2)).__proto__ = l.prototype : (null === e3 && (e3 = new l(t2)), e3.length = t2), e3;
          }
          function l(e3, t2, n2) {
            if (!(l.TYPED_ARRAY_SUPPORT || this instanceof l)) return new l(e3, t2, n2);
            if ("number" == typeof e3) {
              if ("string" == typeof t2) throw new Error("If encoding is specified then the first argument must be a string");
              return p(this, e3);
            }
            return c(this, e3, t2, n2);
          }
          function c(e3, t2, n2, r2) {
            if ("number" == typeof t2) throw new TypeError('"value" argument must not be a number');
            return "undefined" != typeof ArrayBuffer && t2 instanceof ArrayBuffer ? function(e4, t3, n3, r3) {
              if (t3.byteLength, n3 < 0 || t3.byteLength < n3) throw new RangeError("'offset' is out of bounds");
              if (t3.byteLength < n3 + (r3 || 0)) throw new RangeError("'length' is out of bounds");
              t3 = void 0 === n3 && void 0 === r3 ? new Uint8Array(t3) : void 0 === r3 ? new Uint8Array(t3, n3) : new Uint8Array(t3, n3, r3);
              l.TYPED_ARRAY_SUPPORT ? (e4 = t3).__proto__ = l.prototype : e4 = f(e4, t3);
              return e4;
            }(e3, t2, n2, r2) : "string" == typeof t2 ? function(e4, t3, n3) {
              "string" == typeof n3 && "" !== n3 || (n3 = "utf8");
              if (!l.isEncoding(n3)) throw new TypeError('"encoding" must be a valid string encoding');
              var r3 = 0 | h(t3, n3), o2 = (e4 = s(e4, r3)).write(t3, n3);
              o2 !== r3 && (e4 = e4.slice(0, o2));
              return e4;
            }(e3, t2, n2) : function(e4, t3) {
              if (l.isBuffer(t3)) {
                var n3 = 0 | d(t3.length);
                return 0 === (e4 = s(e4, n3)).length || t3.copy(e4, 0, 0, n3), e4;
              }
              if (t3) {
                if ("undefined" != typeof ArrayBuffer && t3.buffer instanceof ArrayBuffer || "length" in t3) return "number" != typeof t3.length || (r3 = t3.length) != r3 ? s(e4, 0) : f(e4, t3);
                if ("Buffer" === t3.type && i(t3.data)) return f(e4, t3.data);
              }
              var r3;
              throw new TypeError("First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.");
            }(e3, t2);
          }
          function u(e3) {
            if ("number" != typeof e3) throw new TypeError('"size" argument must be a number');
            if (e3 < 0) throw new RangeError('"size" argument must not be negative');
          }
          function p(e3, t2) {
            if (u(t2), e3 = s(e3, t2 < 0 ? 0 : 0 | d(t2)), !l.TYPED_ARRAY_SUPPORT) for (var n2 = 0; n2 < t2; ++n2) e3[n2] = 0;
            return e3;
          }
          function f(e3, t2) {
            var n2 = t2.length < 0 ? 0 : 0 | d(t2.length);
            e3 = s(e3, n2);
            for (var r2 = 0; r2 < n2; r2 += 1) e3[r2] = 255 & t2[r2];
            return e3;
          }
          function d(e3) {
            if (e3 >= a()) throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + a().toString(16) + " bytes");
            return 0 | e3;
          }
          function h(e3, t2) {
            if (l.isBuffer(e3)) return e3.length;
            if ("undefined" != typeof ArrayBuffer && "function" == typeof ArrayBuffer.isView && (ArrayBuffer.isView(e3) || e3 instanceof ArrayBuffer)) return e3.byteLength;
            "string" != typeof e3 && (e3 = "" + e3);
            var n2 = e3.length;
            if (0 === n2) return 0;
            for (var r2 = false; ; ) switch (t2) {
              case "ascii":
              case "latin1":
              case "binary":
                return n2;
              case "utf8":
              case "utf-8":
              case void 0:
                return F(e3).length;
              case "ucs2":
              case "ucs-2":
              case "utf16le":
              case "utf-16le":
                return 2 * n2;
              case "hex":
                return n2 >>> 1;
              case "base64":
                return B(e3).length;
              default:
                if (r2) return F(e3).length;
                t2 = ("" + t2).toLowerCase(), r2 = true;
            }
          }
          function m(e3, t2, n2) {
            var r2 = false;
            if ((void 0 === t2 || t2 < 0) && (t2 = 0), t2 > this.length) return "";
            if ((void 0 === n2 || n2 > this.length) && (n2 = this.length), n2 <= 0) return "";
            if ((n2 >>>= 0) <= (t2 >>>= 0)) return "";
            for (e3 || (e3 = "utf8"); ; ) switch (e3) {
              case "hex":
                return N(this, t2, n2);
              case "utf8":
              case "utf-8":
                return C(this, t2, n2);
              case "ascii":
                return T(this, t2, n2);
              case "latin1":
              case "binary":
                return O(this, t2, n2);
              case "base64":
                return S(this, t2, n2);
              case "ucs2":
              case "ucs-2":
              case "utf16le":
              case "utf-16le":
                return P(this, t2, n2);
              default:
                if (r2) throw new TypeError("Unknown encoding: " + e3);
                e3 = (e3 + "").toLowerCase(), r2 = true;
            }
          }
          function g(e3, t2, n2) {
            var r2 = e3[t2];
            e3[t2] = e3[n2], e3[n2] = r2;
          }
          function y(e3, t2, n2, r2, o2) {
            if (0 === e3.length) return -1;
            if ("string" == typeof n2 ? (r2 = n2, n2 = 0) : n2 > 2147483647 ? n2 = 2147483647 : n2 < -2147483648 && (n2 = -2147483648), n2 = +n2, isNaN(n2) && (n2 = o2 ? 0 : e3.length - 1), n2 < 0 && (n2 = e3.length + n2), n2 >= e3.length) {
              if (o2) return -1;
              n2 = e3.length - 1;
            } else if (n2 < 0) {
              if (!o2) return -1;
              n2 = 0;
            }
            if ("string" == typeof t2 && (t2 = l.from(t2, r2)), l.isBuffer(t2)) return 0 === t2.length ? -1 : b(e3, t2, n2, r2, o2);
            if ("number" == typeof t2) return t2 &= 255, l.TYPED_ARRAY_SUPPORT && "function" == typeof Uint8Array.prototype.indexOf ? o2 ? Uint8Array.prototype.indexOf.call(e3, t2, n2) : Uint8Array.prototype.lastIndexOf.call(e3, t2, n2) : b(e3, [t2], n2, r2, o2);
            throw new TypeError("val must be string, number or Buffer");
          }
          function b(e3, t2, n2, r2, o2) {
            var i2, a2 = 1, s2 = e3.length, l2 = t2.length;
            if (void 0 !== r2 && ("ucs2" === (r2 = String(r2).toLowerCase()) || "ucs-2" === r2 || "utf16le" === r2 || "utf-16le" === r2)) {
              if (e3.length < 2 || t2.length < 2) return -1;
              a2 = 2, s2 /= 2, l2 /= 2, n2 /= 2;
            }
            function c2(e4, t3) {
              return 1 === a2 ? e4[t3] : e4.readUInt16BE(t3 * a2);
            }
            if (o2) {
              var u2 = -1;
              for (i2 = n2; i2 < s2; i2++) if (c2(e3, i2) === c2(t2, -1 === u2 ? 0 : i2 - u2)) {
                if (-1 === u2 && (u2 = i2), i2 - u2 + 1 === l2) return u2 * a2;
              } else -1 !== u2 && (i2 -= i2 - u2), u2 = -1;
            } else for (n2 + l2 > s2 && (n2 = s2 - l2), i2 = n2; i2 >= 0; i2--) {
              for (var p2 = true, f2 = 0; f2 < l2; f2++) if (c2(e3, i2 + f2) !== c2(t2, f2)) {
                p2 = false;
                break;
              }
              if (p2) return i2;
            }
            return -1;
          }
          function v(e3, t2, n2, r2) {
            n2 = Number(n2) || 0;
            var o2 = e3.length - n2;
            r2 ? (r2 = Number(r2)) > o2 && (r2 = o2) : r2 = o2;
            var i2 = t2.length;
            if (i2 % 2 != 0) throw new TypeError("Invalid hex string");
            r2 > i2 / 2 && (r2 = i2 / 2);
            for (var a2 = 0; a2 < r2; ++a2) {
              var s2 = parseInt(t2.substr(2 * a2, 2), 16);
              if (isNaN(s2)) return a2;
              e3[n2 + a2] = s2;
            }
            return a2;
          }
          function k(e3, t2, n2, r2) {
            return W(F(t2, e3.length - n2), e3, n2, r2);
          }
          function w(e3, t2, n2, r2) {
            return W(function(e4) {
              for (var t3 = [], n3 = 0; n3 < e4.length; ++n3) t3.push(255 & e4.charCodeAt(n3));
              return t3;
            }(t2), e3, n2, r2);
          }
          function _(e3, t2, n2, r2) {
            return w(e3, t2, n2, r2);
          }
          function E(e3, t2, n2, r2) {
            return W(B(t2), e3, n2, r2);
          }
          function x(e3, t2, n2, r2) {
            return W(function(e4, t3) {
              for (var n3, r3, o2, i2 = [], a2 = 0; a2 < e4.length && !((t3 -= 2) < 0); ++a2) n3 = e4.charCodeAt(a2), r3 = n3 >> 8, o2 = n3 % 256, i2.push(o2), i2.push(r3);
              return i2;
            }(t2, e3.length - n2), e3, n2, r2);
          }
          function S(e3, t2, n2) {
            return 0 === t2 && n2 === e3.length ? r.fromByteArray(e3) : r.fromByteArray(e3.slice(t2, n2));
          }
          function C(e3, t2, n2) {
            n2 = Math.min(e3.length, n2);
            for (var r2 = [], o2 = t2; o2 < n2; ) {
              var i2, a2, s2, l2, c2 = e3[o2], u2 = null, p2 = c2 > 239 ? 4 : c2 > 223 ? 3 : c2 > 191 ? 2 : 1;
              if (o2 + p2 <= n2) switch (p2) {
                case 1:
                  c2 < 128 && (u2 = c2);
                  break;
                case 2:
                  128 == (192 & (i2 = e3[o2 + 1])) && (l2 = (31 & c2) << 6 | 63 & i2) > 127 && (u2 = l2);
                  break;
                case 3:
                  i2 = e3[o2 + 1], a2 = e3[o2 + 2], 128 == (192 & i2) && 128 == (192 & a2) && (l2 = (15 & c2) << 12 | (63 & i2) << 6 | 63 & a2) > 2047 && (l2 < 55296 || l2 > 57343) && (u2 = l2);
                  break;
                case 4:
                  i2 = e3[o2 + 1], a2 = e3[o2 + 2], s2 = e3[o2 + 3], 128 == (192 & i2) && 128 == (192 & a2) && 128 == (192 & s2) && (l2 = (15 & c2) << 18 | (63 & i2) << 12 | (63 & a2) << 6 | 63 & s2) > 65535 && l2 < 1114112 && (u2 = l2);
              }
              null === u2 ? (u2 = 65533, p2 = 1) : u2 > 65535 && (u2 -= 65536, r2.push(u2 >>> 10 & 1023 | 55296), u2 = 56320 | 1023 & u2), r2.push(u2), o2 += p2;
            }
            return function(e4) {
              var t3 = e4.length;
              if (t3 <= 4096) return String.fromCharCode.apply(String, e4);
              var n3 = "", r3 = 0;
              for (; r3 < t3; ) n3 += String.fromCharCode.apply(String, e4.slice(r3, r3 += 4096));
              return n3;
            }(r2);
          }
          t.Buffer = l, t.SlowBuffer = function(e3) {
            +e3 != e3 && (e3 = 0);
            return l.alloc(+e3);
          }, t.INSPECT_MAX_BYTES = 50, l.TYPED_ARRAY_SUPPORT = void 0 !== e2.TYPED_ARRAY_SUPPORT ? e2.TYPED_ARRAY_SUPPORT : function() {
            try {
              var e3 = new Uint8Array(1);
              return e3.__proto__ = { __proto__: Uint8Array.prototype, foo: function() {
                return 42;
              } }, 42 === e3.foo() && "function" == typeof e3.subarray && 0 === e3.subarray(1, 1).byteLength;
            } catch (e4) {
              return false;
            }
          }(), t.kMaxLength = a(), l.poolSize = 8192, l._augment = function(e3) {
            return e3.__proto__ = l.prototype, e3;
          }, l.from = function(e3, t2, n2) {
            return c(null, e3, t2, n2);
          }, l.TYPED_ARRAY_SUPPORT && (l.prototype.__proto__ = Uint8Array.prototype, l.__proto__ = Uint8Array, "undefined" != typeof Symbol && Symbol.species && l[Symbol.species] === l && Object.defineProperty(l, Symbol.species, { value: null, configurable: true })), l.alloc = function(e3, t2, n2) {
            return function(e4, t3, n3, r2) {
              return u(t3), t3 <= 0 ? s(e4, t3) : void 0 !== n3 ? "string" == typeof r2 ? s(e4, t3).fill(n3, r2) : s(e4, t3).fill(n3) : s(e4, t3);
            }(null, e3, t2, n2);
          }, l.allocUnsafe = function(e3) {
            return p(null, e3);
          }, l.allocUnsafeSlow = function(e3) {
            return p(null, e3);
          }, l.isBuffer = function(e3) {
            return !(null == e3 || !e3._isBuffer);
          }, l.compare = function(e3, t2) {
            if (!l.isBuffer(e3) || !l.isBuffer(t2)) throw new TypeError("Arguments must be Buffers");
            if (e3 === t2) return 0;
            for (var n2 = e3.length, r2 = t2.length, o2 = 0, i2 = Math.min(n2, r2); o2 < i2; ++o2) if (e3[o2] !== t2[o2]) {
              n2 = e3[o2], r2 = t2[o2];
              break;
            }
            return n2 < r2 ? -1 : r2 < n2 ? 1 : 0;
          }, l.isEncoding = function(e3) {
            switch (String(e3).toLowerCase()) {
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
                return true;
              default:
                return false;
            }
          }, l.concat = function(e3, t2) {
            if (!i(e3)) throw new TypeError('"list" argument must be an Array of Buffers');
            if (0 === e3.length) return l.alloc(0);
            var n2;
            if (void 0 === t2) for (t2 = 0, n2 = 0; n2 < e3.length; ++n2) t2 += e3[n2].length;
            var r2 = l.allocUnsafe(t2), o2 = 0;
            for (n2 = 0; n2 < e3.length; ++n2) {
              var a2 = e3[n2];
              if (!l.isBuffer(a2)) throw new TypeError('"list" argument must be an Array of Buffers');
              a2.copy(r2, o2), o2 += a2.length;
            }
            return r2;
          }, l.byteLength = h, l.prototype._isBuffer = true, l.prototype.swap16 = function() {
            var e3 = this.length;
            if (e3 % 2 != 0) throw new RangeError("Buffer size must be a multiple of 16-bits");
            for (var t2 = 0; t2 < e3; t2 += 2) g(this, t2, t2 + 1);
            return this;
          }, l.prototype.swap32 = function() {
            var e3 = this.length;
            if (e3 % 4 != 0) throw new RangeError("Buffer size must be a multiple of 32-bits");
            for (var t2 = 0; t2 < e3; t2 += 4) g(this, t2, t2 + 3), g(this, t2 + 1, t2 + 2);
            return this;
          }, l.prototype.swap64 = function() {
            var e3 = this.length;
            if (e3 % 8 != 0) throw new RangeError("Buffer size must be a multiple of 64-bits");
            for (var t2 = 0; t2 < e3; t2 += 8) g(this, t2, t2 + 7), g(this, t2 + 1, t2 + 6), g(this, t2 + 2, t2 + 5), g(this, t2 + 3, t2 + 4);
            return this;
          }, l.prototype.toString = function() {
            var e3 = 0 | this.length;
            return 0 === e3 ? "" : 0 === arguments.length ? C(this, 0, e3) : m.apply(this, arguments);
          }, l.prototype.equals = function(e3) {
            if (!l.isBuffer(e3)) throw new TypeError("Argument must be a Buffer");
            return this === e3 || 0 === l.compare(this, e3);
          }, l.prototype.inspect = function() {
            var e3 = "", n2 = t.INSPECT_MAX_BYTES;
            return this.length > 0 && (e3 = this.toString("hex", 0, n2).match(/.{2}/g).join(" "), this.length > n2 && (e3 += " ... ")), "<Buffer " + e3 + ">";
          }, l.prototype.compare = function(e3, t2, n2, r2, o2) {
            if (!l.isBuffer(e3)) throw new TypeError("Argument must be a Buffer");
            if (void 0 === t2 && (t2 = 0), void 0 === n2 && (n2 = e3 ? e3.length : 0), void 0 === r2 && (r2 = 0), void 0 === o2 && (o2 = this.length), t2 < 0 || n2 > e3.length || r2 < 0 || o2 > this.length) throw new RangeError("out of range index");
            if (r2 >= o2 && t2 >= n2) return 0;
            if (r2 >= o2) return -1;
            if (t2 >= n2) return 1;
            if (this === e3) return 0;
            for (var i2 = (o2 >>>= 0) - (r2 >>>= 0), a2 = (n2 >>>= 0) - (t2 >>>= 0), s2 = Math.min(i2, a2), c2 = this.slice(r2, o2), u2 = e3.slice(t2, n2), p2 = 0; p2 < s2; ++p2) if (c2[p2] !== u2[p2]) {
              i2 = c2[p2], a2 = u2[p2];
              break;
            }
            return i2 < a2 ? -1 : a2 < i2 ? 1 : 0;
          }, l.prototype.includes = function(e3, t2, n2) {
            return -1 !== this.indexOf(e3, t2, n2);
          }, l.prototype.indexOf = function(e3, t2, n2) {
            return y(this, e3, t2, n2, true);
          }, l.prototype.lastIndexOf = function(e3, t2, n2) {
            return y(this, e3, t2, n2, false);
          }, l.prototype.write = function(e3, t2, n2, r2) {
            if (void 0 === t2) r2 = "utf8", n2 = this.length, t2 = 0;
            else if (void 0 === n2 && "string" == typeof t2) r2 = t2, n2 = this.length, t2 = 0;
            else {
              if (!isFinite(t2)) throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
              t2 |= 0, isFinite(n2) ? (n2 |= 0, void 0 === r2 && (r2 = "utf8")) : (r2 = n2, n2 = void 0);
            }
            var o2 = this.length - t2;
            if ((void 0 === n2 || n2 > o2) && (n2 = o2), e3.length > 0 && (n2 < 0 || t2 < 0) || t2 > this.length) throw new RangeError("Attempt to write outside buffer bounds");
            r2 || (r2 = "utf8");
            for (var i2 = false; ; ) switch (r2) {
              case "hex":
                return v(this, e3, t2, n2);
              case "utf8":
              case "utf-8":
                return k(this, e3, t2, n2);
              case "ascii":
                return w(this, e3, t2, n2);
              case "latin1":
              case "binary":
                return _(this, e3, t2, n2);
              case "base64":
                return E(this, e3, t2, n2);
              case "ucs2":
              case "ucs-2":
              case "utf16le":
              case "utf-16le":
                return x(this, e3, t2, n2);
              default:
                if (i2) throw new TypeError("Unknown encoding: " + r2);
                r2 = ("" + r2).toLowerCase(), i2 = true;
            }
          }, l.prototype.toJSON = function() {
            return { type: "Buffer", data: Array.prototype.slice.call(this._arr || this, 0) };
          };
          function T(e3, t2, n2) {
            var r2 = "";
            n2 = Math.min(e3.length, n2);
            for (var o2 = t2; o2 < n2; ++o2) r2 += String.fromCharCode(127 & e3[o2]);
            return r2;
          }
          function O(e3, t2, n2) {
            var r2 = "";
            n2 = Math.min(e3.length, n2);
            for (var o2 = t2; o2 < n2; ++o2) r2 += String.fromCharCode(e3[o2]);
            return r2;
          }
          function N(e3, t2, n2) {
            var r2 = e3.length;
            (!t2 || t2 < 0) && (t2 = 0), (!n2 || n2 < 0 || n2 > r2) && (n2 = r2);
            for (var o2 = "", i2 = t2; i2 < n2; ++i2) o2 += U(e3[i2]);
            return o2;
          }
          function P(e3, t2, n2) {
            for (var r2 = e3.slice(t2, n2), o2 = "", i2 = 0; i2 < r2.length; i2 += 2) o2 += String.fromCharCode(r2[i2] + 256 * r2[i2 + 1]);
            return o2;
          }
          function D(e3, t2, n2) {
            if (e3 % 1 != 0 || e3 < 0) throw new RangeError("offset is not uint");
            if (e3 + t2 > n2) throw new RangeError("Trying to access beyond buffer length");
          }
          function R(e3, t2, n2, r2, o2, i2) {
            if (!l.isBuffer(e3)) throw new TypeError('"buffer" argument must be a Buffer instance');
            if (t2 > o2 || t2 < i2) throw new RangeError('"value" argument is out of bounds');
            if (n2 + r2 > e3.length) throw new RangeError("Index out of range");
          }
          function M(e3, t2, n2, r2) {
            t2 < 0 && (t2 = 65535 + t2 + 1);
            for (var o2 = 0, i2 = Math.min(e3.length - n2, 2); o2 < i2; ++o2) e3[n2 + o2] = (t2 & 255 << 8 * (r2 ? o2 : 1 - o2)) >>> 8 * (r2 ? o2 : 1 - o2);
          }
          function j(e3, t2, n2, r2) {
            t2 < 0 && (t2 = 4294967295 + t2 + 1);
            for (var o2 = 0, i2 = Math.min(e3.length - n2, 4); o2 < i2; ++o2) e3[n2 + o2] = t2 >>> 8 * (r2 ? o2 : 3 - o2) & 255;
          }
          function A(e3, t2, n2, r2, o2, i2) {
            if (n2 + r2 > e3.length) throw new RangeError("Index out of range");
            if (n2 < 0) throw new RangeError("Index out of range");
          }
          function z(e3, t2, n2, r2, i2) {
            return i2 || A(e3, 0, n2, 4), o.write(e3, t2, n2, r2, 23, 4), n2 + 4;
          }
          function L(e3, t2, n2, r2, i2) {
            return i2 || A(e3, 0, n2, 8), o.write(e3, t2, n2, r2, 52, 8), n2 + 8;
          }
          l.prototype.slice = function(e3, t2) {
            var n2, r2 = this.length;
            if ((e3 = ~~e3) < 0 ? (e3 += r2) < 0 && (e3 = 0) : e3 > r2 && (e3 = r2), (t2 = void 0 === t2 ? r2 : ~~t2) < 0 ? (t2 += r2) < 0 && (t2 = 0) : t2 > r2 && (t2 = r2), t2 < e3 && (t2 = e3), l.TYPED_ARRAY_SUPPORT) (n2 = this.subarray(e3, t2)).__proto__ = l.prototype;
            else {
              var o2 = t2 - e3;
              n2 = new l(o2, void 0);
              for (var i2 = 0; i2 < o2; ++i2) n2[i2] = this[i2 + e3];
            }
            return n2;
          }, l.prototype.readUIntLE = function(e3, t2, n2) {
            e3 |= 0, t2 |= 0, n2 || D(e3, t2, this.length);
            for (var r2 = this[e3], o2 = 1, i2 = 0; ++i2 < t2 && (o2 *= 256); ) r2 += this[e3 + i2] * o2;
            return r2;
          }, l.prototype.readUIntBE = function(e3, t2, n2) {
            e3 |= 0, t2 |= 0, n2 || D(e3, t2, this.length);
            for (var r2 = this[e3 + --t2], o2 = 1; t2 > 0 && (o2 *= 256); ) r2 += this[e3 + --t2] * o2;
            return r2;
          }, l.prototype.readUInt8 = function(e3, t2) {
            return t2 || D(e3, 1, this.length), this[e3];
          }, l.prototype.readUInt16LE = function(e3, t2) {
            return t2 || D(e3, 2, this.length), this[e3] | this[e3 + 1] << 8;
          }, l.prototype.readUInt16BE = function(e3, t2) {
            return t2 || D(e3, 2, this.length), this[e3] << 8 | this[e3 + 1];
          }, l.prototype.readUInt32LE = function(e3, t2) {
            return t2 || D(e3, 4, this.length), (this[e3] | this[e3 + 1] << 8 | this[e3 + 2] << 16) + 16777216 * this[e3 + 3];
          }, l.prototype.readUInt32BE = function(e3, t2) {
            return t2 || D(e3, 4, this.length), 16777216 * this[e3] + (this[e3 + 1] << 16 | this[e3 + 2] << 8 | this[e3 + 3]);
          }, l.prototype.readIntLE = function(e3, t2, n2) {
            e3 |= 0, t2 |= 0, n2 || D(e3, t2, this.length);
            for (var r2 = this[e3], o2 = 1, i2 = 0; ++i2 < t2 && (o2 *= 256); ) r2 += this[e3 + i2] * o2;
            return r2 >= (o2 *= 128) && (r2 -= Math.pow(2, 8 * t2)), r2;
          }, l.prototype.readIntBE = function(e3, t2, n2) {
            e3 |= 0, t2 |= 0, n2 || D(e3, t2, this.length);
            for (var r2 = t2, o2 = 1, i2 = this[e3 + --r2]; r2 > 0 && (o2 *= 256); ) i2 += this[e3 + --r2] * o2;
            return i2 >= (o2 *= 128) && (i2 -= Math.pow(2, 8 * t2)), i2;
          }, l.prototype.readInt8 = function(e3, t2) {
            return t2 || D(e3, 1, this.length), 128 & this[e3] ? -1 * (255 - this[e3] + 1) : this[e3];
          }, l.prototype.readInt16LE = function(e3, t2) {
            t2 || D(e3, 2, this.length);
            var n2 = this[e3] | this[e3 + 1] << 8;
            return 32768 & n2 ? 4294901760 | n2 : n2;
          }, l.prototype.readInt16BE = function(e3, t2) {
            t2 || D(e3, 2, this.length);
            var n2 = this[e3 + 1] | this[e3] << 8;
            return 32768 & n2 ? 4294901760 | n2 : n2;
          }, l.prototype.readInt32LE = function(e3, t2) {
            return t2 || D(e3, 4, this.length), this[e3] | this[e3 + 1] << 8 | this[e3 + 2] << 16 | this[e3 + 3] << 24;
          }, l.prototype.readInt32BE = function(e3, t2) {
            return t2 || D(e3, 4, this.length), this[e3] << 24 | this[e3 + 1] << 16 | this[e3 + 2] << 8 | this[e3 + 3];
          }, l.prototype.readFloatLE = function(e3, t2) {
            return t2 || D(e3, 4, this.length), o.read(this, e3, true, 23, 4);
          }, l.prototype.readFloatBE = function(e3, t2) {
            return t2 || D(e3, 4, this.length), o.read(this, e3, false, 23, 4);
          }, l.prototype.readDoubleLE = function(e3, t2) {
            return t2 || D(e3, 8, this.length), o.read(this, e3, true, 52, 8);
          }, l.prototype.readDoubleBE = function(e3, t2) {
            return t2 || D(e3, 8, this.length), o.read(this, e3, false, 52, 8);
          }, l.prototype.writeUIntLE = function(e3, t2, n2, r2) {
            (e3 = +e3, t2 |= 0, n2 |= 0, r2) || R(this, e3, t2, n2, Math.pow(2, 8 * n2) - 1, 0);
            var o2 = 1, i2 = 0;
            for (this[t2] = 255 & e3; ++i2 < n2 && (o2 *= 256); ) this[t2 + i2] = e3 / o2 & 255;
            return t2 + n2;
          }, l.prototype.writeUIntBE = function(e3, t2, n2, r2) {
            (e3 = +e3, t2 |= 0, n2 |= 0, r2) || R(this, e3, t2, n2, Math.pow(2, 8 * n2) - 1, 0);
            var o2 = n2 - 1, i2 = 1;
            for (this[t2 + o2] = 255 & e3; --o2 >= 0 && (i2 *= 256); ) this[t2 + o2] = e3 / i2 & 255;
            return t2 + n2;
          }, l.prototype.writeUInt8 = function(e3, t2, n2) {
            return e3 = +e3, t2 |= 0, n2 || R(this, e3, t2, 1, 255, 0), l.TYPED_ARRAY_SUPPORT || (e3 = Math.floor(e3)), this[t2] = 255 & e3, t2 + 1;
          }, l.prototype.writeUInt16LE = function(e3, t2, n2) {
            return e3 = +e3, t2 |= 0, n2 || R(this, e3, t2, 2, 65535, 0), l.TYPED_ARRAY_SUPPORT ? (this[t2] = 255 & e3, this[t2 + 1] = e3 >>> 8) : M(this, e3, t2, true), t2 + 2;
          }, l.prototype.writeUInt16BE = function(e3, t2, n2) {
            return e3 = +e3, t2 |= 0, n2 || R(this, e3, t2, 2, 65535, 0), l.TYPED_ARRAY_SUPPORT ? (this[t2] = e3 >>> 8, this[t2 + 1] = 255 & e3) : M(this, e3, t2, false), t2 + 2;
          }, l.prototype.writeUInt32LE = function(e3, t2, n2) {
            return e3 = +e3, t2 |= 0, n2 || R(this, e3, t2, 4, 4294967295, 0), l.TYPED_ARRAY_SUPPORT ? (this[t2 + 3] = e3 >>> 24, this[t2 + 2] = e3 >>> 16, this[t2 + 1] = e3 >>> 8, this[t2] = 255 & e3) : j(this, e3, t2, true), t2 + 4;
          }, l.prototype.writeUInt32BE = function(e3, t2, n2) {
            return e3 = +e3, t2 |= 0, n2 || R(this, e3, t2, 4, 4294967295, 0), l.TYPED_ARRAY_SUPPORT ? (this[t2] = e3 >>> 24, this[t2 + 1] = e3 >>> 16, this[t2 + 2] = e3 >>> 8, this[t2 + 3] = 255 & e3) : j(this, e3, t2, false), t2 + 4;
          }, l.prototype.writeIntLE = function(e3, t2, n2, r2) {
            if (e3 = +e3, t2 |= 0, !r2) {
              var o2 = Math.pow(2, 8 * n2 - 1);
              R(this, e3, t2, n2, o2 - 1, -o2);
            }
            var i2 = 0, a2 = 1, s2 = 0;
            for (this[t2] = 255 & e3; ++i2 < n2 && (a2 *= 256); ) e3 < 0 && 0 === s2 && 0 !== this[t2 + i2 - 1] && (s2 = 1), this[t2 + i2] = (e3 / a2 >> 0) - s2 & 255;
            return t2 + n2;
          }, l.prototype.writeIntBE = function(e3, t2, n2, r2) {
            if (e3 = +e3, t2 |= 0, !r2) {
              var o2 = Math.pow(2, 8 * n2 - 1);
              R(this, e3, t2, n2, o2 - 1, -o2);
            }
            var i2 = n2 - 1, a2 = 1, s2 = 0;
            for (this[t2 + i2] = 255 & e3; --i2 >= 0 && (a2 *= 256); ) e3 < 0 && 0 === s2 && 0 !== this[t2 + i2 + 1] && (s2 = 1), this[t2 + i2] = (e3 / a2 >> 0) - s2 & 255;
            return t2 + n2;
          }, l.prototype.writeInt8 = function(e3, t2, n2) {
            return e3 = +e3, t2 |= 0, n2 || R(this, e3, t2, 1, 127, -128), l.TYPED_ARRAY_SUPPORT || (e3 = Math.floor(e3)), e3 < 0 && (e3 = 255 + e3 + 1), this[t2] = 255 & e3, t2 + 1;
          }, l.prototype.writeInt16LE = function(e3, t2, n2) {
            return e3 = +e3, t2 |= 0, n2 || R(this, e3, t2, 2, 32767, -32768), l.TYPED_ARRAY_SUPPORT ? (this[t2] = 255 & e3, this[t2 + 1] = e3 >>> 8) : M(this, e3, t2, true), t2 + 2;
          }, l.prototype.writeInt16BE = function(e3, t2, n2) {
            return e3 = +e3, t2 |= 0, n2 || R(this, e3, t2, 2, 32767, -32768), l.TYPED_ARRAY_SUPPORT ? (this[t2] = e3 >>> 8, this[t2 + 1] = 255 & e3) : M(this, e3, t2, false), t2 + 2;
          }, l.prototype.writeInt32LE = function(e3, t2, n2) {
            return e3 = +e3, t2 |= 0, n2 || R(this, e3, t2, 4, 2147483647, -2147483648), l.TYPED_ARRAY_SUPPORT ? (this[t2] = 255 & e3, this[t2 + 1] = e3 >>> 8, this[t2 + 2] = e3 >>> 16, this[t2 + 3] = e3 >>> 24) : j(this, e3, t2, true), t2 + 4;
          }, l.prototype.writeInt32BE = function(e3, t2, n2) {
            return e3 = +e3, t2 |= 0, n2 || R(this, e3, t2, 4, 2147483647, -2147483648), e3 < 0 && (e3 = 4294967295 + e3 + 1), l.TYPED_ARRAY_SUPPORT ? (this[t2] = e3 >>> 24, this[t2 + 1] = e3 >>> 16, this[t2 + 2] = e3 >>> 8, this[t2 + 3] = 255 & e3) : j(this, e3, t2, false), t2 + 4;
          }, l.prototype.writeFloatLE = function(e3, t2, n2) {
            return z(this, e3, t2, true, n2);
          }, l.prototype.writeFloatBE = function(e3, t2, n2) {
            return z(this, e3, t2, false, n2);
          }, l.prototype.writeDoubleLE = function(e3, t2, n2) {
            return L(this, e3, t2, true, n2);
          }, l.prototype.writeDoubleBE = function(e3, t2, n2) {
            return L(this, e3, t2, false, n2);
          }, l.prototype.copy = function(e3, t2, n2, r2) {
            if (n2 || (n2 = 0), r2 || 0 === r2 || (r2 = this.length), t2 >= e3.length && (t2 = e3.length), t2 || (t2 = 0), r2 > 0 && r2 < n2 && (r2 = n2), r2 === n2) return 0;
            if (0 === e3.length || 0 === this.length) return 0;
            if (t2 < 0) throw new RangeError("targetStart out of bounds");
            if (n2 < 0 || n2 >= this.length) throw new RangeError("sourceStart out of bounds");
            if (r2 < 0) throw new RangeError("sourceEnd out of bounds");
            r2 > this.length && (r2 = this.length), e3.length - t2 < r2 - n2 && (r2 = e3.length - t2 + n2);
            var o2, i2 = r2 - n2;
            if (this === e3 && n2 < t2 && t2 < r2) for (o2 = i2 - 1; o2 >= 0; --o2) e3[o2 + t2] = this[o2 + n2];
            else if (i2 < 1e3 || !l.TYPED_ARRAY_SUPPORT) for (o2 = 0; o2 < i2; ++o2) e3[o2 + t2] = this[o2 + n2];
            else Uint8Array.prototype.set.call(e3, this.subarray(n2, n2 + i2), t2);
            return i2;
          }, l.prototype.fill = function(e3, t2, n2, r2) {
            if ("string" == typeof e3) {
              if ("string" == typeof t2 ? (r2 = t2, t2 = 0, n2 = this.length) : "string" == typeof n2 && (r2 = n2, n2 = this.length), 1 === e3.length) {
                var o2 = e3.charCodeAt(0);
                o2 < 256 && (e3 = o2);
              }
              if (void 0 !== r2 && "string" != typeof r2) throw new TypeError("encoding must be a string");
              if ("string" == typeof r2 && !l.isEncoding(r2)) throw new TypeError("Unknown encoding: " + r2);
            } else "number" == typeof e3 && (e3 &= 255);
            if (t2 < 0 || this.length < t2 || this.length < n2) throw new RangeError("Out of range index");
            if (n2 <= t2) return this;
            var i2;
            if (t2 >>>= 0, n2 = void 0 === n2 ? this.length : n2 >>> 0, e3 || (e3 = 0), "number" == typeof e3) for (i2 = t2; i2 < n2; ++i2) this[i2] = e3;
            else {
              var a2 = l.isBuffer(e3) ? e3 : F(new l(e3, r2).toString()), s2 = a2.length;
              for (i2 = 0; i2 < n2 - t2; ++i2) this[i2 + t2] = a2[i2 % s2];
            }
            return this;
          };
          var I = /[^+\/0-9A-Za-z-_]/g;
          function U(e3) {
            return e3 < 16 ? "0" + e3.toString(16) : e3.toString(16);
          }
          function F(e3, t2) {
            var n2;
            t2 = t2 || 1 / 0;
            for (var r2 = e3.length, o2 = null, i2 = [], a2 = 0; a2 < r2; ++a2) {
              if ((n2 = e3.charCodeAt(a2)) > 55295 && n2 < 57344) {
                if (!o2) {
                  if (n2 > 56319) {
                    (t2 -= 3) > -1 && i2.push(239, 191, 189);
                    continue;
                  }
                  if (a2 + 1 === r2) {
                    (t2 -= 3) > -1 && i2.push(239, 191, 189);
                    continue;
                  }
                  o2 = n2;
                  continue;
                }
                if (n2 < 56320) {
                  (t2 -= 3) > -1 && i2.push(239, 191, 189), o2 = n2;
                  continue;
                }
                n2 = 65536 + (o2 - 55296 << 10 | n2 - 56320);
              } else o2 && (t2 -= 3) > -1 && i2.push(239, 191, 189);
              if (o2 = null, n2 < 128) {
                if ((t2 -= 1) < 0) break;
                i2.push(n2);
              } else if (n2 < 2048) {
                if ((t2 -= 2) < 0) break;
                i2.push(n2 >> 6 | 192, 63 & n2 | 128);
              } else if (n2 < 65536) {
                if ((t2 -= 3) < 0) break;
                i2.push(n2 >> 12 | 224, n2 >> 6 & 63 | 128, 63 & n2 | 128);
              } else {
                if (!(n2 < 1114112)) throw new Error("Invalid code point");
                if ((t2 -= 4) < 0) break;
                i2.push(n2 >> 18 | 240, n2 >> 12 & 63 | 128, n2 >> 6 & 63 | 128, 63 & n2 | 128);
              }
            }
            return i2;
          }
          function B(e3) {
            return r.toByteArray(function(e4) {
              if ((e4 = function(e5) {
                return e5.trim ? e5.trim() : e5.replace(/^\s+|\s+$/g, "");
              }(e4).replace(I, "")).length < 2) return "";
              for (; e4.length % 4 != 0; ) e4 += "=";
              return e4;
            }(e3));
          }
          function W(e3, t2, n2, r2) {
            for (var o2 = 0; o2 < r2 && !(o2 + n2 >= t2.length || o2 >= e3.length); ++o2) t2[o2 + n2] = e3[o2];
            return o2;
          }
        }).call(this, n(15));
      }, function(e, t, n) {
        t.byteLength = function(e2) {
          var t2 = c(e2), n2 = t2[0], r2 = t2[1];
          return 3 * (n2 + r2) / 4 - r2;
        }, t.toByteArray = function(e2) {
          var t2, n2, r2 = c(e2), a2 = r2[0], s2 = r2[1], l2 = new i(function(e3, t3, n3) {
            return 3 * (t3 + n3) / 4 - n3;
          }(0, a2, s2)), u2 = 0, p = s2 > 0 ? a2 - 4 : a2;
          for (n2 = 0; n2 < p; n2 += 4) t2 = o[e2.charCodeAt(n2)] << 18 | o[e2.charCodeAt(n2 + 1)] << 12 | o[e2.charCodeAt(n2 + 2)] << 6 | o[e2.charCodeAt(n2 + 3)], l2[u2++] = t2 >> 16 & 255, l2[u2++] = t2 >> 8 & 255, l2[u2++] = 255 & t2;
          2 === s2 && (t2 = o[e2.charCodeAt(n2)] << 2 | o[e2.charCodeAt(n2 + 1)] >> 4, l2[u2++] = 255 & t2);
          1 === s2 && (t2 = o[e2.charCodeAt(n2)] << 10 | o[e2.charCodeAt(n2 + 1)] << 4 | o[e2.charCodeAt(n2 + 2)] >> 2, l2[u2++] = t2 >> 8 & 255, l2[u2++] = 255 & t2);
          return l2;
        }, t.fromByteArray = function(e2) {
          for (var t2, n2 = e2.length, o2 = n2 % 3, i2 = [], a2 = 0, s2 = n2 - o2; a2 < s2; a2 += 16383) i2.push(u(e2, a2, a2 + 16383 > s2 ? s2 : a2 + 16383));
          1 === o2 ? (t2 = e2[n2 - 1], i2.push(r[t2 >> 2] + r[t2 << 4 & 63] + "==")) : 2 === o2 && (t2 = (e2[n2 - 2] << 8) + e2[n2 - 1], i2.push(r[t2 >> 10] + r[t2 >> 4 & 63] + r[t2 << 2 & 63] + "="));
          return i2.join("");
        };
        for (var r = [], o = [], i = "undefined" != typeof Uint8Array ? Uint8Array : Array, a = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", s = 0, l = a.length; s < l; ++s) r[s] = a[s], o[a.charCodeAt(s)] = s;
        function c(e2) {
          var t2 = e2.length;
          if (t2 % 4 > 0) throw new Error("Invalid string. Length must be a multiple of 4");
          var n2 = e2.indexOf("=");
          return -1 === n2 && (n2 = t2), [n2, n2 === t2 ? 0 : 4 - n2 % 4];
        }
        function u(e2, t2, n2) {
          for (var o2, i2, a2 = [], s2 = t2; s2 < n2; s2 += 3) o2 = (e2[s2] << 16 & 16711680) + (e2[s2 + 1] << 8 & 65280) + (255 & e2[s2 + 2]), a2.push(r[(i2 = o2) >> 18 & 63] + r[i2 >> 12 & 63] + r[i2 >> 6 & 63] + r[63 & i2]);
          return a2.join("");
        }
        o["-".charCodeAt(0)] = 62, o["_".charCodeAt(0)] = 63;
      }, function(e, t) {
        t.read = function(e2, t2, n, r, o) {
          var i, a, s = 8 * o - r - 1, l = (1 << s) - 1, c = l >> 1, u = -7, p = n ? o - 1 : 0, f = n ? -1 : 1, d = e2[t2 + p];
          for (p += f, i = d & (1 << -u) - 1, d >>= -u, u += s; u > 0; i = 256 * i + e2[t2 + p], p += f, u -= 8) ;
          for (a = i & (1 << -u) - 1, i >>= -u, u += r; u > 0; a = 256 * a + e2[t2 + p], p += f, u -= 8) ;
          if (0 === i) i = 1 - c;
          else {
            if (i === l) return a ? NaN : 1 / 0 * (d ? -1 : 1);
            a += Math.pow(2, r), i -= c;
          }
          return (d ? -1 : 1) * a * Math.pow(2, i - r);
        }, t.write = function(e2, t2, n, r, o, i) {
          var a, s, l, c = 8 * i - o - 1, u = (1 << c) - 1, p = u >> 1, f = 23 === o ? Math.pow(2, -24) - Math.pow(2, -77) : 0, d = r ? 0 : i - 1, h = r ? 1 : -1, m = t2 < 0 || 0 === t2 && 1 / t2 < 0 ? 1 : 0;
          for (t2 = Math.abs(t2), isNaN(t2) || t2 === 1 / 0 ? (s = isNaN(t2) ? 1 : 0, a = u) : (a = Math.floor(Math.log(t2) / Math.LN2), t2 * (l = Math.pow(2, -a)) < 1 && (a--, l *= 2), (t2 += a + p >= 1 ? f / l : f * Math.pow(2, 1 - p)) * l >= 2 && (a++, l /= 2), a + p >= u ? (s = 0, a = u) : a + p >= 1 ? (s = (t2 * l - 1) * Math.pow(2, o), a += p) : (s = t2 * Math.pow(2, p - 1) * Math.pow(2, o), a = 0)); o >= 8; e2[n + d] = 255 & s, d += h, s /= 256, o -= 8) ;
          for (a = a << o | s, c += o; c > 0; e2[n + d] = 255 & a, d += h, a /= 256, c -= 8) ;
          e2[n + d - h] |= 128 * m;
        };
      }, function(e, t) {
        var n = {}.toString;
        e.exports = Array.isArray || function(e2) {
          return "[object Array]" == n.call(e2);
        };
      }, function(e, t, n) {
        Object.defineProperty(t, "__esModule", { value: true }), t.arrayToString = void 0;
        t.arrayToString = (e2, t2, n2) => {
          const r = e2.map(function(e3, r2) {
            const o2 = n2(e3, r2);
            return void 0 === o2 ? String(o2) : t2 + o2.split("\n").join("\n" + t2);
          }).join(t2 ? ",\n" : ","), o = t2 && r ? "\n" : "";
          return `[${o}${r}${o}]`;
        };
      }, function(e, t, n) {
        function r(e2) {
          return (r = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(e3) {
            return typeof e3;
          } : function(e3) {
            return e3 && "function" == typeof Symbol && e3.constructor === Symbol && e3 !== Symbol.prototype ? "symbol" : typeof e3;
          })(e2);
        }
        Object.defineProperty(t, "__esModule", { value: true }), t.matchesSelector = p, t.matchesSelectorAndParentsTo = function(e2, t2, n2) {
          var r2 = e2;
          do {
            if (p(r2, t2)) return true;
            if (r2 === n2) return false;
            r2 = r2.parentNode;
          } while (r2);
          return false;
        }, t.addEvent = function(e2, t2, n2, r2) {
          if (!e2) return;
          var o2 = l({ capture: true }, r2);
          e2.addEventListener ? e2.addEventListener(t2, n2, o2) : e2.attachEvent ? e2.attachEvent("on" + t2, n2) : e2["on" + t2] = n2;
        }, t.removeEvent = function(e2, t2, n2, r2) {
          if (!e2) return;
          var o2 = l({ capture: true }, r2);
          e2.removeEventListener ? e2.removeEventListener(t2, n2, o2) : e2.detachEvent ? e2.detachEvent("on" + t2, n2) : e2["on" + t2] = null;
        }, t.outerHeight = function(e2) {
          var t2 = e2.clientHeight, n2 = e2.ownerDocument.defaultView.getComputedStyle(e2);
          return t2 += (0, o.int)(n2.borderTopWidth), t2 += (0, o.int)(n2.borderBottomWidth);
        }, t.outerWidth = function(e2) {
          var t2 = e2.clientWidth, n2 = e2.ownerDocument.defaultView.getComputedStyle(e2);
          return t2 += (0, o.int)(n2.borderLeftWidth), t2 += (0, o.int)(n2.borderRightWidth);
        }, t.innerHeight = function(e2) {
          var t2 = e2.clientHeight, n2 = e2.ownerDocument.defaultView.getComputedStyle(e2);
          return t2 -= (0, o.int)(n2.paddingTop), t2 -= (0, o.int)(n2.paddingBottom);
        }, t.innerWidth = function(e2) {
          var t2 = e2.clientWidth, n2 = e2.ownerDocument.defaultView.getComputedStyle(e2);
          return t2 -= (0, o.int)(n2.paddingLeft), t2 -= (0, o.int)(n2.paddingRight);
        }, t.offsetXYFromParent = function(e2, t2, n2) {
          var r2 = t2 === t2.ownerDocument.body ? { left: 0, top: 0 } : t2.getBoundingClientRect(), o2 = (e2.clientX + t2.scrollLeft - r2.left) / n2, i2 = (e2.clientY + t2.scrollTop - r2.top) / n2;
          return { x: o2, y: i2 };
        }, t.createCSSTransform = function(e2, t2) {
          var n2 = f(e2, t2, "px");
          return c({}, (0, i.browserPrefixToKey)("transform", i.default), n2);
        }, t.createSVGTransform = function(e2, t2) {
          return f(e2, t2, "");
        }, t.getTranslation = f, t.getTouch = function(e2, t2) {
          return e2.targetTouches && (0, o.findInArray)(e2.targetTouches, function(e3) {
            return t2 === e3.identifier;
          }) || e2.changedTouches && (0, o.findInArray)(e2.changedTouches, function(e3) {
            return t2 === e3.identifier;
          });
        }, t.getTouchIdentifier = function(e2) {
          if (e2.targetTouches && e2.targetTouches[0]) return e2.targetTouches[0].identifier;
          if (e2.changedTouches && e2.changedTouches[0]) return e2.changedTouches[0].identifier;
        }, t.addUserSelectStyles = function(e2) {
          if (!e2) return;
          var t2 = e2.getElementById("react-draggable-style-el");
          t2 || ((t2 = e2.createElement("style")).type = "text/css", t2.id = "react-draggable-style-el", t2.innerHTML = ".react-draggable-transparent-selection *::-moz-selection {all: inherit;}\n", t2.innerHTML += ".react-draggable-transparent-selection *::selection {all: inherit;}\n", e2.getElementsByTagName("head")[0].appendChild(t2));
          e2.body && d(e2.body, "react-draggable-transparent-selection");
        }, t.removeUserSelectStyles = function(e2) {
          if (!e2) return;
          try {
            if (e2.body && h(e2.body, "react-draggable-transparent-selection"), e2.selection) e2.selection.empty();
            else {
              var t2 = (e2.defaultView || window).getSelection();
              t2 && "Caret" !== t2.type && t2.removeAllRanges();
            }
          } catch (e3) {
          }
        }, t.addClassName = d, t.removeClassName = h;
        var o = n(20), i = function(e2) {
          if (e2 && e2.__esModule) return e2;
          if (null === e2 || "object" !== r(e2) && "function" != typeof e2) return { default: e2 };
          var t2 = a();
          if (t2 && t2.has(e2)) return t2.get(e2);
          var n2 = {}, o2 = Object.defineProperty && Object.getOwnPropertyDescriptor;
          for (var i2 in e2) if (Object.prototype.hasOwnProperty.call(e2, i2)) {
            var s2 = o2 ? Object.getOwnPropertyDescriptor(e2, i2) : null;
            s2 && (s2.get || s2.set) ? Object.defineProperty(n2, i2, s2) : n2[i2] = e2[i2];
          }
          n2.default = e2, t2 && t2.set(e2, n2);
          return n2;
        }(n(56));
        function a() {
          if ("function" != typeof WeakMap) return null;
          var e2 = /* @__PURE__ */ new WeakMap();
          return a = function() {
            return e2;
          }, e2;
        }
        function s(e2, t2) {
          var n2 = Object.keys(e2);
          if (Object.getOwnPropertySymbols) {
            var r2 = Object.getOwnPropertySymbols(e2);
            t2 && (r2 = r2.filter(function(t3) {
              return Object.getOwnPropertyDescriptor(e2, t3).enumerable;
            })), n2.push.apply(n2, r2);
          }
          return n2;
        }
        function l(e2) {
          for (var t2 = 1; t2 < arguments.length; t2++) {
            var n2 = null != arguments[t2] ? arguments[t2] : {};
            t2 % 2 ? s(Object(n2), true).forEach(function(t3) {
              c(e2, t3, n2[t3]);
            }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e2, Object.getOwnPropertyDescriptors(n2)) : s(Object(n2)).forEach(function(t3) {
              Object.defineProperty(e2, t3, Object.getOwnPropertyDescriptor(n2, t3));
            });
          }
          return e2;
        }
        function c(e2, t2, n2) {
          return t2 in e2 ? Object.defineProperty(e2, t2, { value: n2, enumerable: true, configurable: true, writable: true }) : e2[t2] = n2, e2;
        }
        var u = "";
        function p(e2, t2) {
          return u || (u = (0, o.findInArray)(["matches", "webkitMatchesSelector", "mozMatchesSelector", "msMatchesSelector", "oMatchesSelector"], function(t3) {
            return (0, o.isFunction)(e2[t3]);
          })), !!(0, o.isFunction)(e2[u]) && e2[u](t2);
        }
        function f(e2, t2, n2) {
          var r2 = e2.x, o2 = e2.y, i2 = "translate(".concat(r2).concat(n2, ",").concat(o2).concat(n2, ")");
          if (t2) {
            var a2 = "".concat("string" == typeof t2.x ? t2.x : t2.x + n2), s2 = "".concat("string" == typeof t2.y ? t2.y : t2.y + n2);
            i2 = "translate(".concat(a2, ", ").concat(s2, ")") + i2;
          }
          return i2;
        }
        function d(e2, t2) {
          e2.classList ? e2.classList.add(t2) : e2.className.match(new RegExp("(?:^|\\s)".concat(t2, "(?!\\S)"))) || (e2.className += " ".concat(t2));
        }
        function h(e2, t2) {
          e2.classList ? e2.classList.remove(t2) : e2.className = e2.className.replace(new RegExp("(?:^|\\s)".concat(t2, "(?!\\S)"), "g"), "");
        }
      }, function(e, t) {
        e.exports = function(e2) {
          return e2.webpackPolyfill || (e2.deprecate = function() {
          }, e2.paths = [], e2.children || (e2.children = []), Object.defineProperty(e2, "loaded", { enumerable: true, get: function() {
            return e2.l;
          } }), Object.defineProperty(e2, "id", { enumerable: true, get: function() {
            return e2.i;
          } }), e2.webpackPolyfill = 1), e2;
        };
      }, function(e, t, n) {
        var r = n(6), o = n(35);
        "string" == typeof (o = o.__esModule ? o.default : o) && (o = [[e.i, o, ""]]);
        var i = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": true }, insert: "head", singleton: true };
        r(o, i);
        e.exports = o.locals || {};
      }, function(e, t, n) {
        (e.exports = n(7)(false)).push([e.i, `.ck-inspector{--ck-inspector-color-tree-node-hover:#eaf2fb;--ck-inspector-color-tree-node-name:#882680;--ck-inspector-color-tree-node-attribute-name:#8a8a8a;--ck-inspector-color-tree-node-tag:#aaa;--ck-inspector-color-tree-node-attribute:#9a4819;--ck-inspector-color-tree-node-attribute-value:#2a43ac;--ck-inspector-color-tree-text-border:#b7b7b7;--ck-inspector-color-tree-node-border-hover:#b0c6e0;--ck-inspector-color-tree-content-delimiter:#ddd;--ck-inspector-color-tree-node-active-bg:#f5faff;--ck-inspector-color-tree-node-name-active-bg:#2b98f0;--ck-inspector-color-tree-node-inactive:#8a8a8a;--ck-inspector-color-tree-selection:#ff1744;--ck-inspector-color-tree-position:#000;--ck-inspector-color-comment:green}.ck-inspector .ck-inspector-tree{background:var(--ck-inspector-color-white);padding:1em;width:100%;height:100%;overflow:auto;user-select:none}.ck-inspector-tree .ck-inspector-tree-node__attribute{font:inherit;margin-left:.4em;color:var(--ck-inspector-color-tree-node-tag)}.ck-inspector-tree .ck-inspector-tree-node__attribute .ck-inspector-tree-node__attribute__name{color:var(--ck-inspector-color-tree-node-attribute)}.ck-inspector-tree .ck-inspector-tree-node__attribute .ck-inspector-tree-node__attribute__value{color:var(--ck-inspector-color-tree-node-attribute-value)}.ck-inspector-tree .ck-inspector-tree-node__attribute .ck-inspector-tree-node__attribute__value:before{content:'="'}.ck-inspector-tree .ck-inspector-tree-node__attribute .ck-inspector-tree-node__attribute__value:after{content:'"'}.ck-inspector-tree .ck-inspector-tree-node .ck-inspector-tree-node__name{color:var(--ck-inspector-color-tree-node-name);display:inline-block;width:100%;padding:0 .1em;border-left:1px solid transparent}.ck-inspector-tree .ck-inspector-tree-node .ck-inspector-tree-node__name:hover{background:var(--ck-inspector-color-tree-node-hover)}.ck-inspector-tree .ck-inspector-tree-node .ck-inspector-tree-node__content{padding:1px .5em 1px 1.5em;border-left:1px solid var(--ck-inspector-color-tree-content-delimiter);white-space:pre-wrap}.ck-inspector-tree .ck-inspector-tree-node:not(.ck-inspector-tree-node_tagless) .ck-inspector-tree-node__name>.ck-inspector-tree-node__name__bracket_open:after{content:"<";color:var(--ck-inspector-color-tree-node-tag)}.ck-inspector-tree .ck-inspector-tree-node:not(.ck-inspector-tree-node_tagless) .ck-inspector-tree-node__name .ck-inspector-tree-node__name__bracket_close:after{content:">";color:var(--ck-inspector-color-tree-node-tag)}.ck-inspector-tree .ck-inspector-tree-node:not(.ck-inspector-tree-node_tagless).ck-inspector-tree-node_empty .ck-inspector-tree-node__name:after{content:" />"}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_tagless .ck-inspector-tree-node__content{display:none}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name:not(.ck-inspector-tree-node__name_close),.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name:not(.ck-inspector-tree-node__name_close) :not(.ck-inspector-tree__position),.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name:not(.ck-inspector-tree-node__name_close)>.ck-inspector-tree-node__name__bracket:after{background:var(--ck-inspector-color-tree-node-name-active-bg);color:var(--ck-inspector-color-white)}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__content,.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name_close{background:var(--ck-inspector-color-tree-node-active-bg)}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__content{border-left-color:var(--ck-inspector-color-tree-node-name-active-bg)}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name{border-left:1px solid var(--ck-inspector-color-tree-node-name-active-bg)}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_disabled{opacity:.8}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_disabled .ck-inspector-tree-node__name,.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_disabled .ck-inspector-tree-node__name *{color:var(--ck-inspector-color-tree-node-inactive)}.ck-inspector-tree .ck-inspector-tree-text{display:block;margin-bottom:1px}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-node__content{border:1px dotted var(--ck-inspector-color-tree-text-border);border-radius:2px;padding:0 1px;margin-right:1px;display:inline-block;word-break:break-all}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes:not(:empty){margin-right:.5em}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes .ck-inspector-tree-node__attribute{background:var(--ck-inspector-color-tree-node-attribute-name);border-radius:2px;padding:0 .5em}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes .ck-inspector-tree-node__attribute+.ck-inspector-tree-node__attribute{margin-left:.2em}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes .ck-inspector-tree-node__attribute>*{color:var(--ck-inspector-color-white)}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes .ck-inspector-tree-node__attribute:first-child{margin-left:0}.ck-inspector-tree .ck-inspector-tree-text.ck-inspector-tree-node_active .ck-inspector-tree-node__content{border-style:solid;border-color:var(--ck-inspector-color-tree-node-name-active-bg)}.ck-inspector-tree .ck-inspector-tree-text.ck-inspector-tree-node_active .ck-inspector-tree-node__attribute{background:var(--ck-inspector-color-white)}.ck-inspector-tree .ck-inspector-tree-text.ck-inspector-tree-node_active .ck-inspector-tree-node__attribute>*{color:var(--ck-inspector-color-tree-node-name-active-bg)}.ck-inspector-tree .ck-inspector-tree-text.ck-inspector-tree-node_active>.ck-inspector-tree-node__content{background:var(--ck-inspector-color-tree-node-name-active-bg);color:var(--ck-inspector-color-white)}.ck-inspector-tree .ck-inspector-tree-text:not(.ck-inspector-tree-node_active) .ck-inspector-tree-node__content:hover{background:var(--ck-inspector-color-tree-node-hover);border-style:solid;border-color:var(--ck-inspector-color-tree-node-border-hover)}.ck-inspector-tree.ck-inspector-tree_text-direction_ltr .ck-inspector-tree-node__content{direction:ltr}.ck-inspector-tree.ck-inspector-tree_text-direction_rtl .ck-inspector-tree-node__content{direction:rtl}.ck-inspector-tree.ck-inspector-tree_text-direction_rtl .ck-inspector-tree-node__content .ck-inspector-tree-node__name{direction:ltr}.ck-inspector-tree.ck-inspector-tree_text-direction_rtl .ck-inspector-tree__position{transform:rotate(180deg)}.ck-inspector-tree .ck-inspector-tree-comment{color:var(--ck-inspector-color-comment);font-style:italic}.ck-inspector-tree .ck-inspector-tree-comment a{color:inherit;text-decoration:underline}.ck-inspector-tree_compact-text .ck-inspector-tree-text,.ck-inspector-tree_compact-text .ck-inspector-tree-text .ck-inspector-tree-node__content{display:inline}.ck-inspector .ck-inspector__tree__navigation{padding:.5em 1em;border-bottom:1px solid var(--ck-inspector-color-border)}.ck-inspector .ck-inspector__tree__navigation label{margin-right:.5em}.ck-inspector-tree .ck-inspector-tree__position{display:inline-block;position:relative;cursor:default;height:100%;pointer-events:none;vertical-align:top}.ck-inspector-tree .ck-inspector-tree__position:after{content:"";position:absolute;border:1px solid var(--ck-inspector-color-tree-position);width:0;top:0;bottom:0;margin-left:-1px}.ck-inspector-tree .ck-inspector-tree__position:before{margin-left:-1px}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_selection{z-index:2;--ck-inspector-color-tree-position:var(--ck-inspector-color-tree-selection)}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_selection:before{content:"";position:absolute;top:-1px;bottom:-1px;left:0;border-top:2px solid var(--ck-inspector-color-tree-position);border-bottom:2px solid var(--ck-inspector-color-tree-position);width:8px}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_selection.ck-inspector-tree__position_end:before{right:-1px;left:auto}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_marker{z-index:1}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_marker:before{content:"";display:block;position:absolute;left:0;top:-1px;cursor:default;width:0;height:0;border-left:0 solid transparent;border-bottom:0 solid transparent;border-right:7px solid transparent;border-top:7px solid var(--ck-inspector-color-tree-position)}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_marker.ck-inspector-tree__position_end:before{border-width:0 7px 7px 0;border-left-color:transparent;border-bottom-color:transparent;border-right-color:var(--ck-inspector-color-tree-position);border-top-color:transparent;left:-5px}`, ""]);
      }, function(e, t, n) {
        Object.defineProperty(t, "__esModule", { value: true }), t.canUseDOM = t.SafeNodeList = t.SafeHTMLCollection = void 0;
        var r, o = n(82);
        var i = ((r = o) && r.__esModule ? r : { default: r }).default, a = i.canUseDOM ? window.HTMLElement : {};
        t.SafeHTMLCollection = i.canUseDOM ? window.HTMLCollection : {}, t.SafeNodeList = i.canUseDOM ? window.NodeList : {}, t.canUseDOM = i.canUseDOM;
        t.default = a;
      }, function(e, t, n) {
        var r = n(6), o = n(38);
        "string" == typeof (o = o.__esModule ? o.default : o) && (o = [[e.i, o, ""]]);
        var i = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": true }, insert: "head", singleton: true };
        r(o, i);
        e.exports = o.locals || {};
      }, function(e, t, n) {
        (e.exports = n(7)(false)).push([e.i, `.ck-inspector,.ck-inspector-portal{--ck-inspector-color-white:#fff;--ck-inspector-color-black:#000;--ck-inspector-color-background:#f3f3f3;--ck-inspector-color-link:#005cc6;--ck-inspector-code-font-size:11px;--ck-inspector-code-font-family:monaco,Consolas,Lucida Console,monospace;--ck-inspector-color-border:#d0d0d0}.ck-inspector,.ck-inspector-portal,.ck-inspector-portal :not(select),.ck-inspector :not(select){box-sizing:border-box;width:auto;height:auto;position:static;margin:0;padding:0;border:0;background:transparent;text-decoration:none;transition:none;word-wrap:break-word;font-family:Arial,Helvetica Neue,Helvetica,sans-serif;font-size:12px;line-height:17px;font-weight:400;-webkit-font-smoothing:auto}.ck-inspector{overflow:hidden;border-collapse:collapse;color:var(--ck-inspector-color-black);text-align:left;white-space:normal;cursor:auto;float:none;background:var(--ck-inspector-color-background);border-top:1px solid var(--ck-inspector-color-border);z-index:9999}.ck-inspector.ck-inspector_collapsed>.ck-inspector-navbox>.ck-inspector-navbox__navigation .ck-inspector-horizontal-nav{display:none}.ck-inspector .ck-inspector-navbox__navigation__logo{background-size:contain;background-repeat:no-repeat;background-position:50%;display:block;overflow:hidden;text-indent:100px;align-self:center;white-space:nowrap;margin-right:1em;background-image:url("data:image/svg+xml;charset=utf-8,%3Csvg width='68' height='64' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M43.71 11.025a11.508 11.508 0 00-1.213 5.159c0 6.42 5.244 11.625 11.713 11.625.083 0 .167 0 .25-.002v16.282a5.464 5.464 0 01-2.756 4.739L30.986 60.7a5.548 5.548 0 01-5.512 0L4.756 48.828A5.464 5.464 0 012 44.089V20.344c0-1.955 1.05-3.76 2.756-4.738L25.474 3.733a5.548 5.548 0 015.512 0l12.724 7.292z' fill='%23FFF'/%3E%3Cpath d='M45.684 8.79a12.604 12.604 0 00-1.329 5.65c0 7.032 5.744 12.733 12.829 12.733.091 0 .183-.001.274-.003v17.834a5.987 5.987 0 01-3.019 5.19L31.747 63.196a6.076 6.076 0 01-6.037 0L3.02 50.193A5.984 5.984 0 010 45.003V18.997c0-2.14 1.15-4.119 3.019-5.19L25.71.804a6.076 6.076 0 016.037 0L45.684 8.79zm-29.44 11.89c-.834 0-1.51.671-1.51 1.498v.715c0 .828.676 1.498 1.51 1.498h25.489c.833 0 1.51-.67 1.51-1.498v-.715c0-.827-.677-1.498-1.51-1.498h-25.49zm0 9.227c-.834 0-1.51.671-1.51 1.498v.715c0 .828.676 1.498 1.51 1.498h18.479c.833 0 1.509-.67 1.509-1.498v-.715c0-.827-.676-1.498-1.51-1.498H16.244zm0 9.227c-.834 0-1.51.671-1.51 1.498v.715c0 .828.676 1.498 1.51 1.498h25.489c.833 0 1.51-.67 1.51-1.498v-.715c0-.827-.677-1.498-1.51-1.498h-25.49zm41.191-14.459c-5.835 0-10.565-4.695-10.565-10.486 0-5.792 4.73-10.487 10.565-10.487C63.27 3.703 68 8.398 68 14.19c0 5.791-4.73 10.486-10.565 10.486zm3.422-8.68c0-.467-.084-.875-.251-1.225a2.547 2.547 0 00-.686-.88 2.888 2.888 0 00-1.026-.531 4.418 4.418 0 00-1.259-.175c-.134 0-.283.006-.447.018a2.72 2.72 0 00-.446.07l.075-1.4h3.587v-1.8h-5.462l-.214 5.06c.319-.116.682-.21 1.089-.28.406-.071.77-.107 1.088-.107.218 0 .437.021.655.063.218.041.413.114.585.218s.313.244.422.419c.109.175.163.391.163.65 0 .424-.132.745-.396.961a1.434 1.434 0 01-.938.325c-.352 0-.656-.1-.912-.3-.256-.2-.43-.453-.523-.762l-1.925.588c.1.35.258.664.472.943.214.279.47.514.767.706.298.191.63.339.995.443.365.104.749.156 1.151.156.437 0 .86-.064 1.272-.193.41-.13.778-.323 1.1-.581a2.8 2.8 0 00.775-.981c.193-.396.29-.864.29-1.405z' fill='%231EBC61' fill-rule='nonzero'/%3E%3C/g%3E%3C/svg%3E");width:1.8em;height:1.8em;margin-left:1em}.ck-inspector .ck-inspector-navbox__navigation__toggle{margin-right:1em}.ck-inspector .ck-inspector-navbox__navigation__toggle.ck-inspector-navbox__navigation__toggle_up{transform:rotate(180deg)}.ck-inspector .ck-inspector-editor-selector{margin-left:auto;margin-right:.3em}@media screen and (max-width:680px){.ck-inspector .ck-inspector-editor-selector label{display:none}}.ck-inspector .ck-inspector-editor-selector select{margin-left:.5em}.ck-inspector .ck-inspector-code,.ck-inspector .ck-inspector-code *{font-size:var(--ck-inspector-code-font-size);font-family:var(--ck-inspector-code-font-family);cursor:default}.ck-inspector a{color:var(--ck-inspector-color-link);text-decoration:none}.ck-inspector a:hover{text-decoration:underline;cursor:pointer}.ck-inspector button{outline:0}.ck-inspector .ck-inspector-separator{border-right:1px solid var(--ck-inspector-color-border);display:inline-block;width:0;height:20px;margin:0 .5em;vertical-align:middle}`, ""]);
      }, function(e, t, n) {
        var r = n(49), o = { childContextTypes: true, contextType: true, contextTypes: true, defaultProps: true, displayName: true, getDefaultProps: true, getDerivedStateFromError: true, getDerivedStateFromProps: true, mixins: true, propTypes: true, type: true }, i = { name: true, length: true, prototype: true, caller: true, callee: true, arguments: true, arity: true }, a = { $$typeof: true, compare: true, defaultProps: true, displayName: true, propTypes: true, type: true }, s = {};
        function l(e2) {
          return r.isMemo(e2) ? a : s[e2.$$typeof] || o;
        }
        s[r.ForwardRef] = { $$typeof: true, render: true, defaultProps: true, displayName: true, propTypes: true }, s[r.Memo] = a;
        var c = Object.defineProperty, u = Object.getOwnPropertyNames, p = Object.getOwnPropertySymbols, f = Object.getOwnPropertyDescriptor, d = Object.getPrototypeOf, h = Object.prototype;
        e.exports = function e2(t2, n2, r2) {
          if ("string" != typeof n2) {
            if (h) {
              var o2 = d(n2);
              o2 && o2 !== h && e2(t2, o2, r2);
            }
            var a2 = u(n2);
            p && (a2 = a2.concat(p(n2)));
            for (var s2 = l(t2), m = l(n2), g = 0; g < a2.length; ++g) {
              var y = a2[g];
              if (!(i[y] || r2 && r2[y] || m && m[y] || s2 && s2[y])) {
                var b = f(n2, y);
                try {
                  c(t2, y, b);
                } catch (e3) {
                }
              }
            }
          }
          return t2;
        };
      }, function(e, t, n) {
        Object.defineProperty(t, "__esModule", { value: true }), t.getBoundPosition = function(e2, t2, n2) {
          if (!e2.props.bounds) return [t2, n2];
          var a = e2.props.bounds;
          a = "string" == typeof a ? a : function(e3) {
            return { left: e3.left, top: e3.top, right: e3.right, bottom: e3.bottom };
          }(a);
          var s = i(e2);
          if ("string" == typeof a) {
            var l, c = s.ownerDocument, u = c.defaultView;
            if (!((l = "parent" === a ? s.parentNode : c.querySelector(a)) instanceof u.HTMLElement)) throw new Error('Bounds selector "' + a + '" could not find an element.');
            var p = u.getComputedStyle(s), f = u.getComputedStyle(l);
            a = { left: -s.offsetLeft + (0, r.int)(f.paddingLeft) + (0, r.int)(p.marginLeft), top: -s.offsetTop + (0, r.int)(f.paddingTop) + (0, r.int)(p.marginTop), right: (0, o.innerWidth)(l) - (0, o.outerWidth)(s) - s.offsetLeft + (0, r.int)(f.paddingRight) - (0, r.int)(p.marginRight), bottom: (0, o.innerHeight)(l) - (0, o.outerHeight)(s) - s.offsetTop + (0, r.int)(f.paddingBottom) - (0, r.int)(p.marginBottom) };
          }
          (0, r.isNum)(a.right) && (t2 = Math.min(t2, a.right));
          (0, r.isNum)(a.bottom) && (n2 = Math.min(n2, a.bottom));
          (0, r.isNum)(a.left) && (t2 = Math.max(t2, a.left));
          (0, r.isNum)(a.top) && (n2 = Math.max(n2, a.top));
          return [t2, n2];
        }, t.snapToGrid = function(e2, t2, n2) {
          var r2 = Math.round(t2 / e2[0]) * e2[0], o2 = Math.round(n2 / e2[1]) * e2[1];
          return [r2, o2];
        }, t.canDragX = function(e2) {
          return "both" === e2.props.axis || "x" === e2.props.axis;
        }, t.canDragY = function(e2) {
          return "both" === e2.props.axis || "y" === e2.props.axis;
        }, t.getControlPosition = function(e2, t2, n2) {
          var r2 = "number" == typeof t2 ? (0, o.getTouch)(e2, t2) : null;
          if ("number" == typeof t2 && !r2) return null;
          var a = i(n2), s = n2.props.offsetParent || a.offsetParent || a.ownerDocument.body;
          return (0, o.offsetXYFromParent)(r2 || e2, s, n2.props.scale);
        }, t.createCoreData = function(e2, t2, n2) {
          var o2 = e2.state, a = !(0, r.isNum)(o2.lastX), s = i(e2);
          return a ? { node: s, deltaX: 0, deltaY: 0, lastX: t2, lastY: n2, x: t2, y: n2 } : { node: s, deltaX: t2 - o2.lastX, deltaY: n2 - o2.lastY, lastX: o2.lastX, lastY: o2.lastY, x: t2, y: n2 };
        }, t.createDraggableData = function(e2, t2) {
          var n2 = e2.props.scale;
          return { node: t2.node, x: e2.state.x + t2.deltaX / n2, y: e2.state.y + t2.deltaY / n2, deltaX: t2.deltaX / n2, deltaY: t2.deltaY / n2, lastX: e2.state.x, lastY: e2.state.y };
        };
        var r = n(20), o = n(32);
        function i(e2) {
          var t2 = e2.findDOMNode();
          if (!t2) throw new Error("<DraggableCore>: Unmounted during event!");
          return t2;
        }
      }, function(e, t, n) {
        Object.defineProperty(t, "__esModule", { value: true }), t.default = function() {
        };
      }, function(e, t, n) {
        Object.defineProperty(t, "__esModule", { value: true }), t.default = function e2(t2) {
          return [].slice.call(t2.querySelectorAll("*"), 0).reduce(function(t3, n2) {
            return t3.concat(n2.shadowRoot ? e2(n2.shadowRoot) : [n2]);
          }, []).filter(a);
        };
        var r = /input|select|textarea|button|object|iframe/;
        function o(e2) {
          var t2 = e2.offsetWidth <= 0 && e2.offsetHeight <= 0;
          if (t2 && !e2.innerHTML) return true;
          try {
            var n2 = window.getComputedStyle(e2);
            return t2 ? "visible" !== n2.getPropertyValue("overflow") || e2.scrollWidth <= 0 && e2.scrollHeight <= 0 : "none" == n2.getPropertyValue("display");
          } catch (e3) {
            return console.warn("Failed to inspect element style"), false;
          }
        }
        function i(e2, t2) {
          var n2 = e2.nodeName.toLowerCase();
          return (r.test(n2) && !e2.disabled || "a" === n2 && e2.href || t2) && function(e3) {
            for (var t3 = e3, n3 = e3.getRootNode && e3.getRootNode(); t3 && t3 !== document.body; ) {
              if (n3 && t3 === n3 && (t3 = n3.host.parentNode), o(t3)) return false;
              t3 = t3.parentNode;
            }
            return true;
          }(e2);
        }
        function a(e2) {
          var t2 = e2.getAttribute("tabindex");
          null === t2 && (t2 = void 0);
          var n2 = isNaN(t2);
          return (n2 || t2 >= 0) && i(e2, !n2);
        }
        e.exports = t.default;
      }, function(e, t, n) {
        Object.defineProperty(t, "__esModule", { value: true }), t.resetState = function() {
          s && (s.removeAttribute ? s.removeAttribute("aria-hidden") : null != s.length ? s.forEach(function(e2) {
            return e2.removeAttribute("aria-hidden");
          }) : document.querySelectorAll(s).forEach(function(e2) {
            return e2.removeAttribute("aria-hidden");
          }));
          s = null;
        }, t.log = function() {
        }, t.assertNodeList = l, t.setElement = function(e2) {
          var t2 = e2;
          if ("string" == typeof t2 && a.canUseDOM) {
            var n2 = document.querySelectorAll(t2);
            l(n2, t2), t2 = n2;
          }
          return s = t2 || s;
        }, t.validateElement = c, t.hide = function(e2) {
          var t2 = true, n2 = false, r2 = void 0;
          try {
            for (var o2, i2 = c(e2)[Symbol.iterator](); !(t2 = (o2 = i2.next()).done); t2 = true) {
              o2.value.setAttribute("aria-hidden", "true");
            }
          } catch (e3) {
            n2 = true, r2 = e3;
          } finally {
            try {
              !t2 && i2.return && i2.return();
            } finally {
              if (n2) throw r2;
            }
          }
        }, t.show = function(e2) {
          var t2 = true, n2 = false, r2 = void 0;
          try {
            for (var o2, i2 = c(e2)[Symbol.iterator](); !(t2 = (o2 = i2.next()).done); t2 = true) {
              o2.value.removeAttribute("aria-hidden");
            }
          } catch (e3) {
            n2 = true, r2 = e3;
          } finally {
            try {
              !t2 && i2.return && i2.return();
            } finally {
              if (n2) throw r2;
            }
          }
        }, t.documentNotReadyOrSSRTesting = function() {
          s = null;
        };
        var r, o = n(81), i = (r = o) && r.__esModule ? r : { default: r }, a = n(36);
        var s = null;
        function l(e2, t2) {
          if (!e2 || !e2.length) throw new Error("react-modal: No elements were found for selector " + t2 + ".");
        }
        function c(e2) {
          var t2 = e2 || s;
          return t2 ? Array.isArray(t2) || t2 instanceof HTMLCollection || t2 instanceof NodeList ? t2 : [t2] : ((0, i.default)(false, ["react-modal: App element is not defined.", "Please use `Modal.setAppElement(el)` or set `appElement={el}`.", "This is needed so screen readers don't see main content", "when modal is opened. It is not recommended, but you can opt-out", "by setting `ariaHideApp={false}`."].join(" ")), []);
        }
      }, function(e, t, n) {
        Object.defineProperty(t, "__esModule", { value: true }), t.log = function() {
          console.log("portalOpenInstances ----------"), console.log(o.openInstances.length), o.openInstances.forEach(function(e2) {
            return console.log(e2);
          }), console.log("end portalOpenInstances ----------");
        }, t.resetState = function() {
          o = new r();
        };
        var r = function e2() {
          var t2 = this;
          !function(e3, t3) {
            if (!(e3 instanceof t3)) throw new TypeError("Cannot call a class as a function");
          }(this, e2), this.register = function(e3) {
            -1 === t2.openInstances.indexOf(e3) && (t2.openInstances.push(e3), t2.emit("register"));
          }, this.deregister = function(e3) {
            var n2 = t2.openInstances.indexOf(e3);
            -1 !== n2 && (t2.openInstances.splice(n2, 1), t2.emit("deregister"));
          }, this.subscribe = function(e3) {
            t2.subscribers.push(e3);
          }, this.emit = function(e3) {
            t2.subscribers.forEach(function(n2) {
              return n2(e3, t2.openInstances.slice());
            });
          }, this.openInstances = [], this.subscribers = [];
        }, o = new r();
        t.default = o;
      }, function(e, t, n) {
        e.exports = n(51);
      }, function(e, t, n) {
        var r = n(52), o = r.default, i = r.DraggableCore;
        e.exports = o, e.exports.default = o, e.exports.DraggableCore = i;
      }, function(e, t, n) {
        var r = n(76), o = { "text/plain": "Text", "text/html": "Url", default: "Text" };
        e.exports = function(e2, t2) {
          var n2, i, a, s, l, c, u = false;
          t2 || (t2 = {}), n2 = t2.debug || false;
          try {
            if (a = r(), s = document.createRange(), l = document.getSelection(), (c = document.createElement("span")).textContent = e2, c.style.all = "unset", c.style.position = "fixed", c.style.top = 0, c.style.clip = "rect(0, 0, 0, 0)", c.style.whiteSpace = "pre", c.style.webkitUserSelect = "text", c.style.MozUserSelect = "text", c.style.msUserSelect = "text", c.style.userSelect = "text", c.addEventListener("copy", function(r2) {
              if (r2.stopPropagation(), t2.format) if (r2.preventDefault(), void 0 === r2.clipboardData) {
                n2 && console.warn("unable to use e.clipboardData"), n2 && console.warn("trying IE specific stuff"), window.clipboardData.clearData();
                var i2 = o[t2.format] || o.default;
                window.clipboardData.setData(i2, e2);
              } else r2.clipboardData.clearData(), r2.clipboardData.setData(t2.format, e2);
              t2.onCopy && (r2.preventDefault(), t2.onCopy(r2.clipboardData));
            }), document.body.appendChild(c), s.selectNodeContents(c), l.addRange(s), !document.execCommand("copy")) throw new Error("copy command was unsuccessful");
            u = true;
          } catch (r2) {
            n2 && console.error("unable to copy using execCommand: ", r2), n2 && console.warn("trying IE specific stuff");
            try {
              window.clipboardData.setData(t2.format || "text", e2), t2.onCopy && t2.onCopy(window.clipboardData), u = true;
            } catch (r3) {
              n2 && console.error("unable to copy using clipboardData: ", r3), n2 && console.error("falling back to prompt"), i = function(e3) {
                var t3 = (/mac os x/i.test(navigator.userAgent) ? "⌘" : "Ctrl") + "+C";
                return e3.replace(/#{\s*key\s*}/g, t3);
              }("message" in t2 ? t2.message : "Copy to clipboard: #{key}, Enter"), window.prompt(i, e2);
            }
          } finally {
            l && ("function" == typeof l.removeRange ? l.removeRange(s) : l.removeAllRanges()), c && document.body.removeChild(c), a();
          }
          return u;
        };
      }, function(e, t, n) {
        Object.defineProperty(t, "__esModule", { value: true });
        var r, o = n(77), i = (r = o) && r.__esModule ? r : { default: r };
        t.default = i.default, e.exports = t.default;
      }, function(e, t, n) {
        e.exports = n(50);
      }, function(e, t, n) {
        var r = "function" == typeof Symbol && Symbol.for, o = r ? Symbol.for("react.element") : 60103, i = r ? Symbol.for("react.portal") : 60106, a = r ? Symbol.for("react.fragment") : 60107, s = r ? Symbol.for("react.strict_mode") : 60108, l = r ? Symbol.for("react.profiler") : 60114, c = r ? Symbol.for("react.provider") : 60109, u = r ? Symbol.for("react.context") : 60110, p = r ? Symbol.for("react.async_mode") : 60111, f = r ? Symbol.for("react.concurrent_mode") : 60111, d = r ? Symbol.for("react.forward_ref") : 60112, h = r ? Symbol.for("react.suspense") : 60113, m = r ? Symbol.for("react.suspense_list") : 60120, g = r ? Symbol.for("react.memo") : 60115, y = r ? Symbol.for("react.lazy") : 60116, b = r ? Symbol.for("react.block") : 60121, v = r ? Symbol.for("react.fundamental") : 60117, k = r ? Symbol.for("react.responder") : 60118, w = r ? Symbol.for("react.scope") : 60119;
        function _(e2) {
          if ("object" == typeof e2 && null !== e2) {
            var t2 = e2.$$typeof;
            switch (t2) {
              case o:
                switch (e2 = e2.type) {
                  case p:
                  case f:
                  case a:
                  case l:
                  case s:
                  case h:
                    return e2;
                  default:
                    switch (e2 = e2 && e2.$$typeof) {
                      case u:
                      case d:
                      case y:
                      case g:
                      case c:
                        return e2;
                      default:
                        return t2;
                    }
                }
              case i:
                return t2;
            }
          }
        }
        function E(e2) {
          return _(e2) === f;
        }
        t.AsyncMode = p, t.ConcurrentMode = f, t.ContextConsumer = u, t.ContextProvider = c, t.Element = o, t.ForwardRef = d, t.Fragment = a, t.Lazy = y, t.Memo = g, t.Portal = i, t.Profiler = l, t.StrictMode = s, t.Suspense = h, t.isAsyncMode = function(e2) {
          return E(e2) || _(e2) === p;
        }, t.isConcurrentMode = E, t.isContextConsumer = function(e2) {
          return _(e2) === u;
        }, t.isContextProvider = function(e2) {
          return _(e2) === c;
        }, t.isElement = function(e2) {
          return "object" == typeof e2 && null !== e2 && e2.$$typeof === o;
        }, t.isForwardRef = function(e2) {
          return _(e2) === d;
        }, t.isFragment = function(e2) {
          return _(e2) === a;
        }, t.isLazy = function(e2) {
          return _(e2) === y;
        }, t.isMemo = function(e2) {
          return _(e2) === g;
        }, t.isPortal = function(e2) {
          return _(e2) === i;
        }, t.isProfiler = function(e2) {
          return _(e2) === l;
        }, t.isStrictMode = function(e2) {
          return _(e2) === s;
        }, t.isSuspense = function(e2) {
          return _(e2) === h;
        }, t.isValidElementType = function(e2) {
          return "string" == typeof e2 || "function" == typeof e2 || e2 === a || e2 === f || e2 === l || e2 === s || e2 === h || e2 === m || "object" == typeof e2 && null !== e2 && (e2.$$typeof === y || e2.$$typeof === g || e2.$$typeof === c || e2.$$typeof === u || e2.$$typeof === d || e2.$$typeof === v || e2.$$typeof === k || e2.$$typeof === w || e2.$$typeof === b);
        }, t.typeOf = _;
      }, function(e, t, n) {
        var r = 60103, o = 60106, i = 60107, a = 60108, s = 60114, l = 60109, c = 60110, u = 60112, p = 60113, f = 60120, d = 60115, h = 60116, m = 60121, g = 60122, y = 60117, b = 60129, v = 60131;
        if ("function" == typeof Symbol && Symbol.for) {
          var k = Symbol.for;
          r = k("react.element"), o = k("react.portal"), i = k("react.fragment"), a = k("react.strict_mode"), s = k("react.profiler"), l = k("react.provider"), c = k("react.context"), u = k("react.forward_ref"), p = k("react.suspense"), f = k("react.suspense_list"), d = k("react.memo"), h = k("react.lazy"), m = k("react.block"), g = k("react.server.block"), y = k("react.fundamental"), b = k("react.debug_trace_mode"), v = k("react.legacy_hidden");
        }
        function w(e2) {
          if ("object" == typeof e2 && null !== e2) {
            var t2 = e2.$$typeof;
            switch (t2) {
              case r:
                switch (e2 = e2.type) {
                  case i:
                  case s:
                  case a:
                  case p:
                  case f:
                    return e2;
                  default:
                    switch (e2 = e2 && e2.$$typeof) {
                      case c:
                      case u:
                      case h:
                      case d:
                      case l:
                        return e2;
                      default:
                        return t2;
                    }
                }
              case o:
                return t2;
            }
          }
        }
        var _ = l, E = r, x = u, S = i, C = h, T = d, O = o, N = s, P = a, D = p;
        t.ContextConsumer = c, t.ContextProvider = _, t.Element = E, t.ForwardRef = x, t.Fragment = S, t.Lazy = C, t.Memo = T, t.Portal = O, t.Profiler = N, t.StrictMode = P, t.Suspense = D, t.isAsyncMode = function() {
          return false;
        }, t.isConcurrentMode = function() {
          return false;
        }, t.isContextConsumer = function(e2) {
          return w(e2) === c;
        }, t.isContextProvider = function(e2) {
          return w(e2) === l;
        }, t.isElement = function(e2) {
          return "object" == typeof e2 && null !== e2 && e2.$$typeof === r;
        }, t.isForwardRef = function(e2) {
          return w(e2) === u;
        }, t.isFragment = function(e2) {
          return w(e2) === i;
        }, t.isLazy = function(e2) {
          return w(e2) === h;
        }, t.isMemo = function(e2) {
          return w(e2) === d;
        }, t.isPortal = function(e2) {
          return w(e2) === o;
        }, t.isProfiler = function(e2) {
          return w(e2) === s;
        }, t.isStrictMode = function(e2) {
          return w(e2) === a;
        }, t.isSuspense = function(e2) {
          return w(e2) === p;
        }, t.isValidElementType = function(e2) {
          return "string" == typeof e2 || "function" == typeof e2 || e2 === i || e2 === s || e2 === b || e2 === a || e2 === p || e2 === f || e2 === v || "object" == typeof e2 && null !== e2 && (e2.$$typeof === h || e2.$$typeof === d || e2.$$typeof === l || e2.$$typeof === c || e2.$$typeof === u || e2.$$typeof === y || e2.$$typeof === m || e2[0] === g);
        }, t.typeOf = w;
      }, function(e, t, n) {
        Object.defineProperty(t, "__esModule", { value: true }), Object.defineProperty(t, "DraggableCore", { enumerable: true, get: function() {
          return u.default;
        } }), t.default = void 0;
        var r = function(e2) {
          if (e2 && e2.__esModule) return e2;
          if (null === e2 || "object" !== h(e2) && "function" != typeof e2) return { default: e2 };
          var t2 = d();
          if (t2 && t2.has(e2)) return t2.get(e2);
          var n2 = {}, r2 = Object.defineProperty && Object.getOwnPropertyDescriptor;
          for (var o2 in e2) if (Object.prototype.hasOwnProperty.call(e2, o2)) {
            var i2 = r2 ? Object.getOwnPropertyDescriptor(e2, o2) : null;
            i2 && (i2.get || i2.set) ? Object.defineProperty(n2, o2, i2) : n2[o2] = e2[o2];
          }
          n2.default = e2, t2 && t2.set(e2, n2);
          return n2;
        }(n(0)), o = f(n(18)), i = f(n(12)), a = f(n(55)), s = n(32), l = n(40), c = n(20), u = f(n(57)), p = f(n(41));
        function f(e2) {
          return e2 && e2.__esModule ? e2 : { default: e2 };
        }
        function d() {
          if ("function" != typeof WeakMap) return null;
          var e2 = /* @__PURE__ */ new WeakMap();
          return d = function() {
            return e2;
          }, e2;
        }
        function h(e2) {
          return (h = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(e3) {
            return typeof e3;
          } : function(e3) {
            return e3 && "function" == typeof Symbol && e3.constructor === Symbol && e3 !== Symbol.prototype ? "symbol" : typeof e3;
          })(e2);
        }
        function m() {
          return (m = Object.assign || function(e2) {
            for (var t2 = 1; t2 < arguments.length; t2++) {
              var n2 = arguments[t2];
              for (var r2 in n2) Object.prototype.hasOwnProperty.call(n2, r2) && (e2[r2] = n2[r2]);
            }
            return e2;
          }).apply(this, arguments);
        }
        function g(e2, t2) {
          if (null == e2) return {};
          var n2, r2, o2 = function(e3, t3) {
            if (null == e3) return {};
            var n3, r3, o3 = {}, i3 = Object.keys(e3);
            for (r3 = 0; r3 < i3.length; r3++) n3 = i3[r3], t3.indexOf(n3) >= 0 || (o3[n3] = e3[n3]);
            return o3;
          }(e2, t2);
          if (Object.getOwnPropertySymbols) {
            var i2 = Object.getOwnPropertySymbols(e2);
            for (r2 = 0; r2 < i2.length; r2++) n2 = i2[r2], t2.indexOf(n2) >= 0 || Object.prototype.propertyIsEnumerable.call(e2, n2) && (o2[n2] = e2[n2]);
          }
          return o2;
        }
        function y(e2, t2) {
          return function(e3) {
            if (Array.isArray(e3)) return e3;
          }(e2) || function(e3, t3) {
            if ("undefined" == typeof Symbol || !(Symbol.iterator in Object(e3))) return;
            var n2 = [], r2 = true, o2 = false, i2 = void 0;
            try {
              for (var a2, s2 = e3[Symbol.iterator](); !(r2 = (a2 = s2.next()).done) && (n2.push(a2.value), !t3 || n2.length !== t3); r2 = true) ;
            } catch (e4) {
              o2 = true, i2 = e4;
            } finally {
              try {
                r2 || null == s2.return || s2.return();
              } finally {
                if (o2) throw i2;
              }
            }
            return n2;
          }(e2, t2) || function(e3, t3) {
            if (!e3) return;
            if ("string" == typeof e3) return b(e3, t3);
            var n2 = Object.prototype.toString.call(e3).slice(8, -1);
            "Object" === n2 && e3.constructor && (n2 = e3.constructor.name);
            if ("Map" === n2 || "Set" === n2) return Array.from(e3);
            if ("Arguments" === n2 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2)) return b(e3, t3);
          }(e2, t2) || function() {
            throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
          }();
        }
        function b(e2, t2) {
          (null == t2 || t2 > e2.length) && (t2 = e2.length);
          for (var n2 = 0, r2 = new Array(t2); n2 < t2; n2++) r2[n2] = e2[n2];
          return r2;
        }
        function v(e2, t2) {
          var n2 = Object.keys(e2);
          if (Object.getOwnPropertySymbols) {
            var r2 = Object.getOwnPropertySymbols(e2);
            t2 && (r2 = r2.filter(function(t3) {
              return Object.getOwnPropertyDescriptor(e2, t3).enumerable;
            })), n2.push.apply(n2, r2);
          }
          return n2;
        }
        function k(e2) {
          for (var t2 = 1; t2 < arguments.length; t2++) {
            var n2 = null != arguments[t2] ? arguments[t2] : {};
            t2 % 2 ? v(Object(n2), true).forEach(function(t3) {
              O(e2, t3, n2[t3]);
            }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e2, Object.getOwnPropertyDescriptors(n2)) : v(Object(n2)).forEach(function(t3) {
              Object.defineProperty(e2, t3, Object.getOwnPropertyDescriptor(n2, t3));
            });
          }
          return e2;
        }
        function w(e2, t2) {
          for (var n2 = 0; n2 < t2.length; n2++) {
            var r2 = t2[n2];
            r2.enumerable = r2.enumerable || false, r2.configurable = true, "value" in r2 && (r2.writable = true), Object.defineProperty(e2, r2.key, r2);
          }
        }
        function _(e2, t2, n2) {
          return t2 && w(e2.prototype, t2), n2 && w(e2, n2), e2;
        }
        function E(e2, t2) {
          return (E = Object.setPrototypeOf || function(e3, t3) {
            return e3.__proto__ = t3, e3;
          })(e2, t2);
        }
        function x(e2) {
          var t2 = function() {
            if ("undefined" == typeof Reflect || !Reflect.construct) return false;
            if (Reflect.construct.sham) return false;
            if ("function" == typeof Proxy) return true;
            try {
              return Date.prototype.toString.call(Reflect.construct(Date, [], function() {
              })), true;
            } catch (e3) {
              return false;
            }
          }();
          return function() {
            var n2, r2 = T(e2);
            if (t2) {
              var o2 = T(this).constructor;
              n2 = Reflect.construct(r2, arguments, o2);
            } else n2 = r2.apply(this, arguments);
            return S(this, n2);
          };
        }
        function S(e2, t2) {
          return !t2 || "object" !== h(t2) && "function" != typeof t2 ? C(e2) : t2;
        }
        function C(e2) {
          if (void 0 === e2) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
          return e2;
        }
        function T(e2) {
          return (T = Object.setPrototypeOf ? Object.getPrototypeOf : function(e3) {
            return e3.__proto__ || Object.getPrototypeOf(e3);
          })(e2);
        }
        function O(e2, t2, n2) {
          return t2 in e2 ? Object.defineProperty(e2, t2, { value: n2, enumerable: true, configurable: true, writable: true }) : e2[t2] = n2, e2;
        }
        var N = function(e2) {
          !function(e3, t3) {
            if ("function" != typeof t3 && null !== t3) throw new TypeError("Super expression must either be null or a function");
            e3.prototype = Object.create(t3 && t3.prototype, { constructor: { value: e3, writable: true, configurable: true } }), t3 && E(e3, t3);
          }(n2, e2);
          var t2 = x(n2);
          function n2(e3) {
            var r2;
            return function(e4, t3) {
              if (!(e4 instanceof t3)) throw new TypeError("Cannot call a class as a function");
            }(this, n2), O(C(r2 = t2.call(this, e3)), "onDragStart", function(e4, t3) {
              if ((0, p.default)("Draggable: onDragStart: %j", t3), false === r2.props.onStart(e4, (0, l.createDraggableData)(C(r2), t3))) return false;
              r2.setState({ dragging: true, dragged: true });
            }), O(C(r2), "onDrag", function(e4, t3) {
              if (!r2.state.dragging) return false;
              (0, p.default)("Draggable: onDrag: %j", t3);
              var n3 = (0, l.createDraggableData)(C(r2), t3), o2 = { x: n3.x, y: n3.y };
              if (r2.props.bounds) {
                var i2 = o2.x, a2 = o2.y;
                o2.x += r2.state.slackX, o2.y += r2.state.slackY;
                var s2 = y((0, l.getBoundPosition)(C(r2), o2.x, o2.y), 2), c2 = s2[0], u2 = s2[1];
                o2.x = c2, o2.y = u2, o2.slackX = r2.state.slackX + (i2 - o2.x), o2.slackY = r2.state.slackY + (a2 - o2.y), n3.x = o2.x, n3.y = o2.y, n3.deltaX = o2.x - r2.state.x, n3.deltaY = o2.y - r2.state.y;
              }
              if (false === r2.props.onDrag(e4, n3)) return false;
              r2.setState(o2);
            }), O(C(r2), "onDragStop", function(e4, t3) {
              if (!r2.state.dragging) return false;
              if (false === r2.props.onStop(e4, (0, l.createDraggableData)(C(r2), t3))) return false;
              (0, p.default)("Draggable: onDragStop: %j", t3);
              var n3 = { dragging: false, slackX: 0, slackY: 0 };
              if (Boolean(r2.props.position)) {
                var o2 = r2.props.position, i2 = o2.x, a2 = o2.y;
                n3.x = i2, n3.y = a2;
              }
              r2.setState(n3);
            }), r2.state = { dragging: false, dragged: false, x: e3.position ? e3.position.x : e3.defaultPosition.x, y: e3.position ? e3.position.y : e3.defaultPosition.y, prevPropsPosition: k({}, e3.position), slackX: 0, slackY: 0, isElementSVG: false }, !e3.position || e3.onDrag || e3.onStop || console.warn("A `position` was applied to this <Draggable>, without drag handlers. This will make this component effectively undraggable. Please attach `onDrag` or `onStop` handlers so you can adjust the `position` of this element."), r2;
          }
          return _(n2, null, [{ key: "getDerivedStateFromProps", value: function(e3, t3) {
            var n3 = e3.position, r2 = t3.prevPropsPosition;
            return !n3 || r2 && n3.x === r2.x && n3.y === r2.y ? null : ((0, p.default)("Draggable: getDerivedStateFromProps %j", { position: n3, prevPropsPosition: r2 }), { x: n3.x, y: n3.y, prevPropsPosition: k({}, n3) });
          } }]), _(n2, [{ key: "componentDidMount", value: function() {
            void 0 !== window.SVGElement && this.findDOMNode() instanceof window.SVGElement && this.setState({ isElementSVG: true });
          } }, { key: "componentWillUnmount", value: function() {
            this.setState({ dragging: false });
          } }, { key: "findDOMNode", value: function() {
            return this.props.nodeRef ? this.props.nodeRef.current : i.default.findDOMNode(this);
          } }, { key: "render", value: function() {
            var e3, t3 = this.props, n3 = (t3.axis, t3.bounds, t3.children), o2 = t3.defaultPosition, i2 = t3.defaultClassName, c2 = t3.defaultClassNameDragging, p2 = t3.defaultClassNameDragged, f2 = t3.position, d2 = t3.positionOffset, h2 = (t3.scale, g(t3, ["axis", "bounds", "children", "defaultPosition", "defaultClassName", "defaultClassNameDragging", "defaultClassNameDragged", "position", "positionOffset", "scale"])), y2 = {}, b2 = null, v2 = !Boolean(f2) || this.state.dragging, w2 = f2 || o2, _2 = { x: (0, l.canDragX)(this) && v2 ? this.state.x : w2.x, y: (0, l.canDragY)(this) && v2 ? this.state.y : w2.y };
            this.state.isElementSVG ? b2 = (0, s.createSVGTransform)(_2, d2) : y2 = (0, s.createCSSTransform)(_2, d2);
            var E2 = (0, a.default)(n3.props.className || "", i2, (O(e3 = {}, c2, this.state.dragging), O(e3, p2, this.state.dragged), e3));
            return r.createElement(u.default, m({}, h2, { onStart: this.onDragStart, onDrag: this.onDrag, onStop: this.onDragStop }), r.cloneElement(r.Children.only(n3), { className: E2, style: k(k({}, n3.props.style), y2), transform: b2 }));
          } }]), n2;
        }(r.Component);
        t.default = N, O(N, "displayName", "Draggable"), O(N, "propTypes", k(k({}, u.default.propTypes), {}, { axis: o.default.oneOf(["both", "x", "y", "none"]), bounds: o.default.oneOfType([o.default.shape({ left: o.default.number, right: o.default.number, top: o.default.number, bottom: o.default.number }), o.default.string, o.default.oneOf([false])]), defaultClassName: o.default.string, defaultClassNameDragging: o.default.string, defaultClassNameDragged: o.default.string, defaultPosition: o.default.shape({ x: o.default.number, y: o.default.number }), positionOffset: o.default.shape({ x: o.default.oneOfType([o.default.number, o.default.string]), y: o.default.oneOfType([o.default.number, o.default.string]) }), position: o.default.shape({ x: o.default.number, y: o.default.number }), className: c.dontSetMe, style: c.dontSetMe, transform: c.dontSetMe })), O(N, "defaultProps", k(k({}, u.default.defaultProps), {}, { axis: "both", bounds: false, defaultClassName: "react-draggable", defaultClassNameDragging: "react-draggable-dragging", defaultClassNameDragged: "react-draggable-dragged", defaultPosition: { x: 0, y: 0 }, position: null, scale: 1 }));
      }, function(e, t, n) {
        var r = n(54);
        function o() {
        }
        function i() {
        }
        i.resetWarningCache = o, e.exports = function() {
          function e2(e3, t3, n3, o2, i2, a) {
            if (a !== r) {
              var s = new Error("Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types");
              throw s.name = "Invariant Violation", s;
            }
          }
          function t2() {
            return e2;
          }
          e2.isRequired = e2;
          var n2 = { array: e2, bigint: e2, bool: e2, func: e2, number: e2, object: e2, string: e2, symbol: e2, any: e2, arrayOf: t2, element: e2, elementType: e2, instanceOf: t2, node: e2, objectOf: t2, oneOf: t2, oneOfType: t2, shape: t2, exact: t2, checkPropTypes: i, resetWarningCache: o };
          return n2.PropTypes = n2, n2;
        };
      }, function(e, t, n) {
        e.exports = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
      }, function(e, t, n) {
        var r;
        !function() {
          var n2 = {}.hasOwnProperty;
          function o() {
            for (var e2 = [], t2 = 0; t2 < arguments.length; t2++) {
              var r2 = arguments[t2];
              if (r2) {
                var i = typeof r2;
                if ("string" === i || "number" === i) e2.push(r2);
                else if (Array.isArray(r2)) {
                  if (r2.length) {
                    var a = o.apply(null, r2);
                    a && e2.push(a);
                  }
                } else if ("object" === i) if (r2.toString === Object.prototype.toString) for (var s in r2) n2.call(r2, s) && r2[s] && e2.push(s);
                else e2.push(r2.toString());
              }
            }
            return e2.join(" ");
          }
          e.exports ? (o.default = o, e.exports = o) : void 0 === (r = (function() {
            return o;
          }).apply(t, [])) || (e.exports = r);
        }();
      }, function(e, t, n) {
        Object.defineProperty(t, "__esModule", { value: true }), t.getPrefix = o, t.browserPrefixToKey = i, t.browserPrefixToStyle = function(e2, t2) {
          return t2 ? "-".concat(t2.toLowerCase(), "-").concat(e2) : e2;
        }, t.default = void 0;
        var r = ["Moz", "Webkit", "O", "ms"];
        function o() {
          var e2 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : "transform";
          if ("undefined" == typeof window || void 0 === window.document) return "";
          var t2 = window.document.documentElement.style;
          if (e2 in t2) return "";
          for (var n2 = 0; n2 < r.length; n2++) if (i(e2, r[n2]) in t2) return r[n2];
          return "";
        }
        function i(e2, t2) {
          return t2 ? "".concat(t2).concat(function(e3) {
            for (var t3 = "", n2 = true, r2 = 0; r2 < e3.length; r2++) n2 ? (t3 += e3[r2].toUpperCase(), n2 = false) : "-" === e3[r2] ? n2 = true : t3 += e3[r2];
            return t3;
          }(e2)) : e2;
        }
        var a = o();
        t.default = a;
      }, function(e, t, n) {
        Object.defineProperty(t, "__esModule", { value: true }), t.default = void 0;
        var r = function(e2) {
          if (e2 && e2.__esModule) return e2;
          if (null === e2 || "object" !== f(e2) && "function" != typeof e2) return { default: e2 };
          var t2 = p();
          if (t2 && t2.has(e2)) return t2.get(e2);
          var n2 = {}, r2 = Object.defineProperty && Object.getOwnPropertyDescriptor;
          for (var o2 in e2) if (Object.prototype.hasOwnProperty.call(e2, o2)) {
            var i2 = r2 ? Object.getOwnPropertyDescriptor(e2, o2) : null;
            i2 && (i2.get || i2.set) ? Object.defineProperty(n2, o2, i2) : n2[o2] = e2[o2];
          }
          n2.default = e2, t2 && t2.set(e2, n2);
          return n2;
        }(n(0)), o = u(n(18)), i = u(n(12)), a = n(32), s = n(40), l = n(20), c = u(n(41));
        function u(e2) {
          return e2 && e2.__esModule ? e2 : { default: e2 };
        }
        function p() {
          if ("function" != typeof WeakMap) return null;
          var e2 = /* @__PURE__ */ new WeakMap();
          return p = function() {
            return e2;
          }, e2;
        }
        function f(e2) {
          return (f = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(e3) {
            return typeof e3;
          } : function(e3) {
            return e3 && "function" == typeof Symbol && e3.constructor === Symbol && e3 !== Symbol.prototype ? "symbol" : typeof e3;
          })(e2);
        }
        function d(e2, t2) {
          return function(e3) {
            if (Array.isArray(e3)) return e3;
          }(e2) || function(e3, t3) {
            if ("undefined" == typeof Symbol || !(Symbol.iterator in Object(e3))) return;
            var n2 = [], r2 = true, o2 = false, i2 = void 0;
            try {
              for (var a2, s2 = e3[Symbol.iterator](); !(r2 = (a2 = s2.next()).done) && (n2.push(a2.value), !t3 || n2.length !== t3); r2 = true) ;
            } catch (e4) {
              o2 = true, i2 = e4;
            } finally {
              try {
                r2 || null == s2.return || s2.return();
              } finally {
                if (o2) throw i2;
              }
            }
            return n2;
          }(e2, t2) || function(e3, t3) {
            if (!e3) return;
            if ("string" == typeof e3) return h(e3, t3);
            var n2 = Object.prototype.toString.call(e3).slice(8, -1);
            "Object" === n2 && e3.constructor && (n2 = e3.constructor.name);
            if ("Map" === n2 || "Set" === n2) return Array.from(e3);
            if ("Arguments" === n2 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2)) return h(e3, t3);
          }(e2, t2) || function() {
            throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
          }();
        }
        function h(e2, t2) {
          (null == t2 || t2 > e2.length) && (t2 = e2.length);
          for (var n2 = 0, r2 = new Array(t2); n2 < t2; n2++) r2[n2] = e2[n2];
          return r2;
        }
        function m(e2, t2) {
          if (!(e2 instanceof t2)) throw new TypeError("Cannot call a class as a function");
        }
        function g(e2, t2) {
          for (var n2 = 0; n2 < t2.length; n2++) {
            var r2 = t2[n2];
            r2.enumerable = r2.enumerable || false, r2.configurable = true, "value" in r2 && (r2.writable = true), Object.defineProperty(e2, r2.key, r2);
          }
        }
        function y(e2, t2) {
          return (y = Object.setPrototypeOf || function(e3, t3) {
            return e3.__proto__ = t3, e3;
          })(e2, t2);
        }
        function b(e2) {
          var t2 = function() {
            if ("undefined" == typeof Reflect || !Reflect.construct) return false;
            if (Reflect.construct.sham) return false;
            if ("function" == typeof Proxy) return true;
            try {
              return Date.prototype.toString.call(Reflect.construct(Date, [], function() {
              })), true;
            } catch (e3) {
              return false;
            }
          }();
          return function() {
            var n2, r2 = w(e2);
            if (t2) {
              var o2 = w(this).constructor;
              n2 = Reflect.construct(r2, arguments, o2);
            } else n2 = r2.apply(this, arguments);
            return v(this, n2);
          };
        }
        function v(e2, t2) {
          return !t2 || "object" !== f(t2) && "function" != typeof t2 ? k(e2) : t2;
        }
        function k(e2) {
          if (void 0 === e2) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
          return e2;
        }
        function w(e2) {
          return (w = Object.setPrototypeOf ? Object.getPrototypeOf : function(e3) {
            return e3.__proto__ || Object.getPrototypeOf(e3);
          })(e2);
        }
        function _(e2, t2, n2) {
          return t2 in e2 ? Object.defineProperty(e2, t2, { value: n2, enumerable: true, configurable: true, writable: true }) : e2[t2] = n2, e2;
        }
        var E = { start: "touchstart", move: "touchmove", stop: "touchend" }, x = { start: "mousedown", move: "mousemove", stop: "mouseup" }, S = x, C = function(e2) {
          !function(e3, t3) {
            if ("function" != typeof t3 && null !== t3) throw new TypeError("Super expression must either be null or a function");
            e3.prototype = Object.create(t3 && t3.prototype, { constructor: { value: e3, writable: true, configurable: true } }), t3 && y(e3, t3);
          }(u2, e2);
          var t2, n2, l2 = b(u2);
          function u2() {
            var e3;
            m(this, u2);
            for (var t3 = arguments.length, n3 = new Array(t3), r2 = 0; r2 < t3; r2++) n3[r2] = arguments[r2];
            return _(k(e3 = l2.call.apply(l2, [this].concat(n3))), "state", { dragging: false, lastX: NaN, lastY: NaN, touchIdentifier: null }), _(k(e3), "mounted", false), _(k(e3), "handleDragStart", function(t4) {
              if (e3.props.onMouseDown(t4), !e3.props.allowAnyClick && "number" == typeof t4.button && 0 !== t4.button) return false;
              var n4 = e3.findDOMNode();
              if (!n4 || !n4.ownerDocument || !n4.ownerDocument.body) throw new Error("<DraggableCore> not mounted on DragStart!");
              var r3 = n4.ownerDocument;
              if (!(e3.props.disabled || !(t4.target instanceof r3.defaultView.Node) || e3.props.handle && !(0, a.matchesSelectorAndParentsTo)(t4.target, e3.props.handle, n4) || e3.props.cancel && (0, a.matchesSelectorAndParentsTo)(t4.target, e3.props.cancel, n4))) {
                "touchstart" === t4.type && t4.preventDefault();
                var o2 = (0, a.getTouchIdentifier)(t4);
                e3.setState({ touchIdentifier: o2 });
                var i2 = (0, s.getControlPosition)(t4, o2, k(e3));
                if (null != i2) {
                  var l3 = i2.x, u3 = i2.y, p2 = (0, s.createCoreData)(k(e3), l3, u3);
                  (0, c.default)("DraggableCore: handleDragStart: %j", p2), (0, c.default)("calling", e3.props.onStart), false !== e3.props.onStart(t4, p2) && false !== e3.mounted && (e3.props.enableUserSelectHack && (0, a.addUserSelectStyles)(r3), e3.setState({ dragging: true, lastX: l3, lastY: u3 }), (0, a.addEvent)(r3, S.move, e3.handleDrag), (0, a.addEvent)(r3, S.stop, e3.handleDragStop));
                }
              }
            }), _(k(e3), "handleDrag", function(t4) {
              var n4 = (0, s.getControlPosition)(t4, e3.state.touchIdentifier, k(e3));
              if (null != n4) {
                var r3 = n4.x, o2 = n4.y;
                if (Array.isArray(e3.props.grid)) {
                  var i2 = r3 - e3.state.lastX, a2 = o2 - e3.state.lastY, l3 = d((0, s.snapToGrid)(e3.props.grid, i2, a2), 2);
                  if (i2 = l3[0], a2 = l3[1], !i2 && !a2) return;
                  r3 = e3.state.lastX + i2, o2 = e3.state.lastY + a2;
                }
                var u3 = (0, s.createCoreData)(k(e3), r3, o2);
                if ((0, c.default)("DraggableCore: handleDrag: %j", u3), false !== e3.props.onDrag(t4, u3) && false !== e3.mounted) e3.setState({ lastX: r3, lastY: o2 });
                else try {
                  e3.handleDragStop(new MouseEvent("mouseup"));
                } catch (t5) {
                  var p2 = document.createEvent("MouseEvents");
                  p2.initMouseEvent("mouseup", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null), e3.handleDragStop(p2);
                }
              }
            }), _(k(e3), "handleDragStop", function(t4) {
              if (e3.state.dragging) {
                var n4 = (0, s.getControlPosition)(t4, e3.state.touchIdentifier, k(e3));
                if (null != n4) {
                  var r3 = n4.x, o2 = n4.y, i2 = (0, s.createCoreData)(k(e3), r3, o2);
                  if (false === e3.props.onStop(t4, i2) || false === e3.mounted) return false;
                  var l3 = e3.findDOMNode();
                  l3 && e3.props.enableUserSelectHack && (0, a.removeUserSelectStyles)(l3.ownerDocument), (0, c.default)("DraggableCore: handleDragStop: %j", i2), e3.setState({ dragging: false, lastX: NaN, lastY: NaN }), l3 && ((0, c.default)("DraggableCore: Removing handlers"), (0, a.removeEvent)(l3.ownerDocument, S.move, e3.handleDrag), (0, a.removeEvent)(l3.ownerDocument, S.stop, e3.handleDragStop));
                }
              }
            }), _(k(e3), "onMouseDown", function(t4) {
              return S = x, e3.handleDragStart(t4);
            }), _(k(e3), "onMouseUp", function(t4) {
              return S = x, e3.handleDragStop(t4);
            }), _(k(e3), "onTouchStart", function(t4) {
              return S = E, e3.handleDragStart(t4);
            }), _(k(e3), "onTouchEnd", function(t4) {
              return S = E, e3.handleDragStop(t4);
            }), e3;
          }
          return t2 = u2, (n2 = [{ key: "componentDidMount", value: function() {
            this.mounted = true;
            var e3 = this.findDOMNode();
            e3 && (0, a.addEvent)(e3, E.start, this.onTouchStart, { passive: false });
          } }, { key: "componentWillUnmount", value: function() {
            this.mounted = false;
            var e3 = this.findDOMNode();
            if (e3) {
              var t3 = e3.ownerDocument;
              (0, a.removeEvent)(t3, x.move, this.handleDrag), (0, a.removeEvent)(t3, E.move, this.handleDrag), (0, a.removeEvent)(t3, x.stop, this.handleDragStop), (0, a.removeEvent)(t3, E.stop, this.handleDragStop), (0, a.removeEvent)(e3, E.start, this.onTouchStart, { passive: false }), this.props.enableUserSelectHack && (0, a.removeUserSelectStyles)(t3);
            }
          } }, { key: "findDOMNode", value: function() {
            return this.props.nodeRef ? this.props.nodeRef.current : i.default.findDOMNode(this);
          } }, { key: "render", value: function() {
            return r.cloneElement(r.Children.only(this.props.children), { onMouseDown: this.onMouseDown, onMouseUp: this.onMouseUp, onTouchEnd: this.onTouchEnd });
          } }]) && g(t2.prototype, n2), u2;
        }(r.Component);
        t.default = C, _(C, "displayName", "DraggableCore"), _(C, "propTypes", { allowAnyClick: o.default.bool, disabled: o.default.bool, enableUserSelectHack: o.default.bool, offsetParent: function(e2, t2) {
          if (e2[t2] && 1 !== e2[t2].nodeType) throw new Error("Draggable's offsetParent must be a DOM Node.");
        }, grid: o.default.arrayOf(o.default.number), handle: o.default.string, cancel: o.default.string, nodeRef: o.default.object, onStart: o.default.func, onDrag: o.default.func, onStop: o.default.func, onMouseDown: o.default.func, scale: o.default.number, className: l.dontSetMe, style: l.dontSetMe, transform: l.dontSetMe }), _(C, "defaultProps", { allowAnyClick: false, cancel: null, disabled: false, enableUserSelectHack: true, offsetParent: null, handle: null, grid: null, transform: null, onStart: function() {
        }, onDrag: function() {
        }, onStop: function() {
        }, onMouseDown: function() {
        }, scale: 1 });
      }, function(e, t, n) {
        var r = n(6), o = n(59);
        "string" == typeof (o = o.__esModule ? o.default : o) && (o = [[e.i, o, ""]]);
        var i = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": true }, insert: "head", singleton: true };
        r(o, i);
        e.exports = o.locals || {};
      }, function(e, t, n) {
        (e.exports = n(7)(false)).push([e.i, ".ck-inspector{--ck-inspector-color-tab-background-hover:rgba(0,0,0,0.07);--ck-inspector-color-tab-active-border:#0dacef }.ck-inspector .ck-inspector-horizontal-nav{display:flex;flex-direction:row;user-select:none;align-self:stretch}.ck-inspector .ck-inspector-horizontal-nav .ck-inspector-horizontal-nav__item{-webkit-appearance:none;background:none;border:0;border-bottom:2px solid transparent;padding:.5em 1em;align-self:stretch}.ck-inspector .ck-inspector-horizontal-nav .ck-inspector-horizontal-nav__item:hover{background:var(--ck-inspector-color-tab-background-hover)}.ck-inspector .ck-inspector-horizontal-nav .ck-inspector-horizontal-nav__item.ck-inspector-horizontal-nav__item_active{border-bottom-color:var(--ck-inspector-color-tab-active-border)}", ""]);
      }, function(e, t, n) {
        var r = n(6), o = n(61);
        "string" == typeof (o = o.__esModule ? o.default : o) && (o = [[e.i, o, ""]]);
        var i = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": true }, insert: "head", singleton: true };
        r(o, i);
        e.exports = o.locals || {};
      }, function(e, t, n) {
        (e.exports = n(7)(false)).push([e.i, ".ck-inspector{--ck-inspector-navbox-empty-background:#fafafa}.ck-inspector .ck-inspector-navbox{display:flex;flex-direction:column;height:100%;align-items:stretch}.ck-inspector .ck-inspector-navbox .ck-inspector-navbox__navigation{display:flex;flex-direction:row;flex-wrap:nowrap;align-items:stretch;min-height:30px;max-height:30px;border-bottom:1px solid var(--ck-inspector-color-border);width:100%;user-select:none;align-items:center}.ck-inspector .ck-inspector-navbox .ck-inspector-navbox__content{display:flex;flex-direction:row;height:100%;overflow:hidden}", ""]);
      }, function(e, t, n) {
        var r = n(6), o = n(63);
        "string" == typeof (o = o.__esModule ? o.default : o) && (o = [[e.i, o, ""]]);
        var i = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": true }, insert: "head", singleton: true };
        r(o, i);
        e.exports = o.locals || {};
      }, function(e, t, n) {
        (e.exports = n(7)(false)).push([e.i, ".ck-inspector{--ck-inspector-icon-size:19px;--ck-inspector-button-size:calc(4px + var(--ck-inspector-icon-size));--ck-inspector-color-button:#777;--ck-inspector-color-button-hover:#222;--ck-inspector-color-button-on:#0f79e2}.ck-inspector .ck-inspector-button{width:var(--ck-inspector-button-size);height:var(--ck-inspector-button-size);border:0;overflow:hidden;border-radius:2px;padding:2px;color:var(--ck-inspector-color-button)}.ck-inspector .ck-inspector-button.ck-inspector-button_on,.ck-inspector .ck-inspector-button.ck-inspector-button_on:hover{color:var(--ck-inspector-color-button-on);opacity:1}.ck-inspector .ck-inspector-button.ck-inspector-button_disabled{opacity:.3}.ck-inspector .ck-inspector-button>span{display:none}.ck-inspector .ck-inspector-button:hover{color:var(--ck-inspector-color-button-hover)}.ck-inspector .ck-inspector-button svg{width:var(--ck-inspector-icon-size);height:var(--ck-inspector-icon-size)}.ck-inspector .ck-inspector-button svg,.ck-inspector .ck-inspector-button svg *{fill:currentColor}", ""]);
      }, function(e, t, n) {
        var r = n(6), o = n(65);
        "string" == typeof (o = o.__esModule ? o.default : o) && (o = [[e.i, o, ""]]);
        var i = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": true }, insert: "head", singleton: true };
        r(o, i);
        e.exports = o.locals || {};
      }, function(e, t, n) {
        (e.exports = n(7)(false)).push([e.i, ".ck-inspector{--ck-inspector-explorer-width:300px}.ck-inspector .ck-inspector-pane{display:flex;width:100%}.ck-inspector .ck-inspector-pane.ck-inspector-pane_empty{align-items:center;justify-content:center;padding:1em;background:var(--ck-inspector-navbox-empty-background)}.ck-inspector .ck-inspector-pane.ck-inspector-pane_empty p{align-self:center;width:100%;text-align:center}.ck-inspector .ck-inspector-pane>.ck-inspector-navbox:last-child{min-width:var(--ck-inspector-explorer-width);width:var(--ck-inspector-explorer-width)}.ck-inspector .ck-inspector-pane.ck-inspector-pane_vsplit>.ck-inspector-navbox:first-child{border-right:1px solid var(--ck-inspector-color-border);flex:1 1 auto;overflow:hidden}.ck-inspector .ck-inspector-pane.ck-inspector-pane_vsplit>.ck-inspector-navbox:first-child .ck-inspector-navbox__navigation{align-items:center}.ck-inspector .ck-inspector-pane.ck-inspector-pane_vsplit>.ck-inspector-navbox:first-child .ck-inspector-tree__config label{margin:0 .5em}.ck-inspector .ck-inspector-pane.ck-inspector-pane_vsplit>.ck-inspector-navbox:first-child .ck-inspector-tree__config input+label{margin-right:1em}", ""]);
      }, function(e, t, n) {
        var r = n(6), o = n(67);
        "string" == typeof (o = o.__esModule ? o.default : o) && (o = [[e.i, o, ""]]);
        var i = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": true }, insert: "head", singleton: true };
        r(o, i);
        e.exports = o.locals || {};
      }, function(e, t, n) {
        (e.exports = n(7)(false)).push([e.i, ".ck-inspector-side-pane{position:relative}", ""]);
      }, function(e, t, n) {
        var r = n(6), o = n(69);
        "string" == typeof (o = o.__esModule ? o.default : o) && (o = [[e.i, o, ""]]);
        var i = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": true }, insert: "head", singleton: true };
        r(o, i);
        e.exports = o.locals || {};
      }, function(e, t, n) {
        (e.exports = n(7)(false)).push([e.i, ".ck-inspector .ck-inspector-checkbox{vertical-align:middle}", ""]);
      }, function(e, t, n) {
        var r = n(6), o = n(71);
        "string" == typeof (o = o.__esModule ? o.default : o) && (o = [[e.i, o, ""]]);
        var i = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": true }, insert: "head", singleton: true };
        r(o, i);
        e.exports = o.locals || {};
      }, function(e, t, n) {
        (e.exports = n(7)(false)).push([e.i, '.ck-inspector{--ck-inspector-color-property-list-property-name:#d0363f;--ck-inspector-color-property-list-property-value-true:green;--ck-inspector-color-property-list-property-value-false:red;--ck-inspector-color-property-list-property-value-unknown:#888;--ck-inspector-color-property-list-background:#f5f5f5;--ck-inspector-color-property-list-title-collapser:#727272}.ck-inspector .ck-inspector-property-list{display:grid;grid-template-columns:auto 1fr;background:var(--ck-inspector-color-white)}.ck-inspector .ck-inspector-property-list>:nth-of-type(odd){background:var(--ck-inspector-color-property-list-background)}.ck-inspector .ck-inspector-property-list>:nth-of-type(2n){background:var(--ck-inspector-color-white)}.ck-inspector .ck-inspector-property-list dt{padding:0 .7em 0 1.2em;min-width:15em}.ck-inspector .ck-inspector-property-list dt.ck-inspector-property-list__title_collapsible button{display:inline-block;overflow:hidden;vertical-align:middle;margin-left:-9px;margin-right:.3em;width:0;height:0;border-left:6px solid var(--ck-inspector-color-property-list-title-collapser);border-bottom:3.5px solid transparent;border-right:0 solid transparent;border-top:3.5px solid transparent;transition:transform .2s ease-in-out;transform:rotate(0deg)}.ck-inspector .ck-inspector-property-list dt.ck-inspector-property-list__title_expanded button{transform:rotate(90deg)}.ck-inspector .ck-inspector-property-list dt.ck-inspector-property-list__title_collapsed+dd+.ck-inspector-property-list{display:none}.ck-inspector .ck-inspector-property-list dt .ck-inspector-property-list__title__color-box{width:12px;height:12px;vertical-align:text-top;display:inline-block;margin-right:3px;border-radius:2px;border:1px solid #000}.ck-inspector .ck-inspector-property-list dt.ck-inspector-property-list__title_clickable label:hover{text-decoration:underline;cursor:pointer}.ck-inspector .ck-inspector-property-list dt label{color:var(--ck-inspector-color-property-list-property-name)}.ck-inspector .ck-inspector-property-list dd{padding-right:.7em}.ck-inspector .ck-inspector-property-list dd input{width:100%}.ck-inspector .ck-inspector-property-list dd input[value=false]{color:var(--ck-inspector-color-property-list-property-value-false)}.ck-inspector .ck-inspector-property-list dd input[value=true]{color:var(--ck-inspector-color-property-list-property-value-true)}.ck-inspector .ck-inspector-property-list dd input[value="function() {…}"],.ck-inspector .ck-inspector-property-list dd input[value=undefined]{color:var(--ck-inspector-color-property-list-property-value-unknown)}.ck-inspector .ck-inspector-property-list dd input[value="function() {…}"]{font-style:italic}.ck-inspector .ck-inspector-property-list .ck-inspector-property-list{grid-column:1/-1;margin-left:1em;background:transparent}.ck-inspector .ck-inspector-property-list .ck-inspector-property-list>:nth-of-type(2n),.ck-inspector .ck-inspector-property-list .ck-inspector-property-list>:nth-of-type(odd){background:transparent}', ""]);
      }, function(e, t, n) {
        var r = n(6), o = n(73);
        "string" == typeof (o = o.__esModule ? o.default : o) && (o = [[e.i, o, ""]]);
        var i = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": true }, insert: "head", singleton: true };
        r(o, i);
        e.exports = o.locals || {};
      }, function(e, t, n) {
        (e.exports = n(7)(false)).push([e.i, `.ck-inspector .ck-inspector__object-inspector{width:100%;background:var(--ck-inspector-color-white);overflow:auto}.ck-inspector .ck-inspector__object-inspector h2,.ck-inspector .ck-inspector__object-inspector h3{display:flex;flex-direction:row;flex-wrap:nowrap}.ck-inspector .ck-inspector__object-inspector h2{display:flex;align-items:center;padding:1em;overflow:hidden;text-overflow:ellipsis}.ck-inspector .ck-inspector__object-inspector h2>span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;margin-right:auto}.ck-inspector .ck-inspector__object-inspector h2>.ck-inspector-button{flex-shrink:0;margin-left:.5em}.ck-inspector .ck-inspector__object-inspector h2 a{font-weight:700;color:var(--ck-inspector-color-tree-node-name)}.ck-inspector .ck-inspector__object-inspector h2 a,.ck-inspector .ck-inspector__object-inspector h2 a>*{cursor:pointer}.ck-inspector .ck-inspector__object-inspector h2 em:after,.ck-inspector .ck-inspector__object-inspector h2 em:before{content:'"'}.ck-inspector .ck-inspector__object-inspector h3{display:flex;align-items:center;font-size:12px;padding:.4em .7em}.ck-inspector .ck-inspector__object-inspector h3 a{color:inherit;font-weight:700;margin-right:auto}.ck-inspector .ck-inspector__object-inspector h3 .ck-inspector-button{visibility:hidden}.ck-inspector .ck-inspector__object-inspector h3:hover .ck-inspector-button{visibility:visible}.ck-inspector .ck-inspector__object-inspector hr{border-top:1px solid var(--ck-inspector-color-border)}`, ""]);
      }, function(e, t, n) {
        var r = n(6), o = n(75);
        "string" == typeof (o = o.__esModule ? o.default : o) && (o = [[e.i, o, ""]]);
        var i = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": true }, insert: "head", singleton: true };
        r(o, i);
        e.exports = o.locals || {};
      }, function(e, t, n) {
        (e.exports = n(7)(false)).push([e.i, ".ck-inspector-model-tree__hide-markers .ck-inspector-tree__position.ck-inspector-tree__position_marker{display:none}", ""]);
      }, function(e, t) {
        e.exports = function() {
          var e2 = document.getSelection();
          if (!e2.rangeCount) return function() {
          };
          for (var t2 = document.activeElement, n = [], r = 0; r < e2.rangeCount; r++) n.push(e2.getRangeAt(r));
          switch (t2.tagName.toUpperCase()) {
            case "INPUT":
            case "TEXTAREA":
              t2.blur();
              break;
            default:
              t2 = null;
          }
          return e2.removeAllRanges(), function() {
            "Caret" === e2.type && e2.removeAllRanges(), e2.rangeCount || n.forEach(function(t3) {
              e2.addRange(t3);
            }), t2 && t2.focus();
          };
        };
      }, function(e, t, n) {
        Object.defineProperty(t, "__esModule", { value: true }), t.bodyOpenClassName = t.portalClassName = void 0;
        var r = Object.assign || function(e2) {
          for (var t2 = 1; t2 < arguments.length; t2++) {
            var n2 = arguments[t2];
            for (var r2 in n2) Object.prototype.hasOwnProperty.call(n2, r2) && (e2[r2] = n2[r2]);
          }
          return e2;
        }, o = /* @__PURE__ */ function() {
          function e2(e3, t2) {
            for (var n2 = 0; n2 < t2.length; n2++) {
              var r2 = t2[n2];
              r2.enumerable = r2.enumerable || false, r2.configurable = true, "value" in r2 && (r2.writable = true), Object.defineProperty(e3, r2.key, r2);
            }
          }
          return function(t2, n2, r2) {
            return n2 && e2(t2.prototype, n2), r2 && e2(t2, r2), t2;
          };
        }(), i = n(0), a = h(i), s = h(n(12)), l = h(n(18)), c = h(n(78)), u = function(e2) {
          if (e2 && e2.__esModule) return e2;
          var t2 = {};
          if (null != e2) for (var n2 in e2) Object.prototype.hasOwnProperty.call(e2, n2) && (t2[n2] = e2[n2]);
          return t2.default = e2, t2;
        }(n(43)), p = n(36), f = h(p), d = n(85);
        function h(e2) {
          return e2 && e2.__esModule ? e2 : { default: e2 };
        }
        function m(e2, t2) {
          if (!(e2 instanceof t2)) throw new TypeError("Cannot call a class as a function");
        }
        function g(e2, t2) {
          if (!e2) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
          return !t2 || "object" != typeof t2 && "function" != typeof t2 ? e2 : t2;
        }
        var y = t.portalClassName = "ReactModalPortal", b = t.bodyOpenClassName = "ReactModal__Body--open", v = p.canUseDOM && void 0 !== s.default.createPortal, k = function(e2) {
          return document.createElement(e2);
        }, w = function() {
          return v ? s.default.createPortal : s.default.unstable_renderSubtreeIntoContainer;
        };
        function _(e2) {
          return e2();
        }
        var E = function(e2) {
          function t2() {
            var e3, n2, o2;
            m(this, t2);
            for (var i2 = arguments.length, l2 = Array(i2), u2 = 0; u2 < i2; u2++) l2[u2] = arguments[u2];
            return n2 = o2 = g(this, (e3 = t2.__proto__ || Object.getPrototypeOf(t2)).call.apply(e3, [this].concat(l2))), o2.removePortal = function() {
              !v && s.default.unmountComponentAtNode(o2.node);
              var e4 = _(o2.props.parentSelector);
              e4 && e4.contains(o2.node) ? e4.removeChild(o2.node) : console.warn('React-Modal: "parentSelector" prop did not returned any DOM element. Make sure that the parent element is unmounted to avoid any memory leaks.');
            }, o2.portalRef = function(e4) {
              o2.portal = e4;
            }, o2.renderPortal = function(e4) {
              var n3 = w()(o2, a.default.createElement(c.default, r({ defaultStyles: t2.defaultStyles }, e4)), o2.node);
              o2.portalRef(n3);
            }, g(o2, n2);
          }
          return function(e3, t3) {
            if ("function" != typeof t3 && null !== t3) throw new TypeError("Super expression must either be null or a function, not " + typeof t3);
            e3.prototype = Object.create(t3 && t3.prototype, { constructor: { value: e3, enumerable: false, writable: true, configurable: true } }), t3 && (Object.setPrototypeOf ? Object.setPrototypeOf(e3, t3) : e3.__proto__ = t3);
          }(t2, e2), o(t2, [{ key: "componentDidMount", value: function() {
            p.canUseDOM && (v || (this.node = k("div")), this.node.className = this.props.portalClassName, _(this.props.parentSelector).appendChild(this.node), !v && this.renderPortal(this.props));
          } }, { key: "getSnapshotBeforeUpdate", value: function(e3) {
            return { prevParent: _(e3.parentSelector), nextParent: _(this.props.parentSelector) };
          } }, { key: "componentDidUpdate", value: function(e3, t3, n2) {
            if (p.canUseDOM) {
              var r2 = this.props, o2 = r2.isOpen, i2 = r2.portalClassName;
              e3.portalClassName !== i2 && (this.node.className = i2);
              var a2 = n2.prevParent, s2 = n2.nextParent;
              s2 !== a2 && (a2.removeChild(this.node), s2.appendChild(this.node)), (e3.isOpen || o2) && !v && this.renderPortal(this.props);
            }
          } }, { key: "componentWillUnmount", value: function() {
            if (p.canUseDOM && this.node && this.portal) {
              var e3 = this.portal.state, t3 = Date.now(), n2 = e3.isOpen && this.props.closeTimeoutMS && (e3.closesAt || t3 + this.props.closeTimeoutMS);
              n2 ? (e3.beforeClose || this.portal.closeWithTimeout(), setTimeout(this.removePortal, n2 - t3)) : this.removePortal();
            }
          } }, { key: "render", value: function() {
            return p.canUseDOM && v ? (!this.node && v && (this.node = k("div")), w()(a.default.createElement(c.default, r({ ref: this.portalRef, defaultStyles: t2.defaultStyles }, this.props)), this.node)) : null;
          } }], [{ key: "setAppElement", value: function(e3) {
            u.setElement(e3);
          } }]), t2;
        }(i.Component);
        E.propTypes = { isOpen: l.default.bool.isRequired, style: l.default.shape({ content: l.default.object, overlay: l.default.object }), portalClassName: l.default.string, bodyOpenClassName: l.default.string, htmlOpenClassName: l.default.string, className: l.default.oneOfType([l.default.string, l.default.shape({ base: l.default.string.isRequired, afterOpen: l.default.string.isRequired, beforeClose: l.default.string.isRequired })]), overlayClassName: l.default.oneOfType([l.default.string, l.default.shape({ base: l.default.string.isRequired, afterOpen: l.default.string.isRequired, beforeClose: l.default.string.isRequired })]), appElement: l.default.oneOfType([l.default.instanceOf(f.default), l.default.instanceOf(p.SafeHTMLCollection), l.default.instanceOf(p.SafeNodeList), l.default.arrayOf(l.default.instanceOf(f.default))]), onAfterOpen: l.default.func, onRequestClose: l.default.func, closeTimeoutMS: l.default.number, ariaHideApp: l.default.bool, shouldFocusAfterRender: l.default.bool, shouldCloseOnOverlayClick: l.default.bool, shouldReturnFocusAfterClose: l.default.bool, preventScroll: l.default.bool, parentSelector: l.default.func, aria: l.default.object, data: l.default.object, role: l.default.string, contentLabel: l.default.string, shouldCloseOnEsc: l.default.bool, overlayRef: l.default.func, contentRef: l.default.func, id: l.default.string, overlayElement: l.default.func, contentElement: l.default.func }, E.defaultProps = { isOpen: false, portalClassName: y, bodyOpenClassName: b, role: "dialog", ariaHideApp: true, closeTimeoutMS: 0, shouldFocusAfterRender: true, shouldCloseOnEsc: true, shouldCloseOnOverlayClick: true, shouldReturnFocusAfterClose: true, preventScroll: false, parentSelector: function() {
          return document.body;
        }, overlayElement: function(e2, t2) {
          return a.default.createElement("div", e2, t2);
        }, contentElement: function(e2, t2) {
          return a.default.createElement("div", e2, t2);
        } }, E.defaultStyles = { overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(255, 255, 255, 0.75)" }, content: { position: "absolute", top: "40px", left: "40px", right: "40px", bottom: "40px", border: "1px solid #ccc", background: "#fff", overflow: "auto", WebkitOverflowScrolling: "touch", borderRadius: "4px", outline: "none", padding: "20px" } }, (0, d.polyfill)(E), t.default = E;
      }, function(e, t, n) {
        Object.defineProperty(t, "__esModule", { value: true });
        var r = Object.assign || function(e2) {
          for (var t2 = 1; t2 < arguments.length; t2++) {
            var n2 = arguments[t2];
            for (var r2 in n2) Object.prototype.hasOwnProperty.call(n2, r2) && (e2[r2] = n2[r2]);
          }
          return e2;
        }, o = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(e2) {
          return typeof e2;
        } : function(e2) {
          return e2 && "function" == typeof Symbol && e2.constructor === Symbol && e2 !== Symbol.prototype ? "symbol" : typeof e2;
        }, i = /* @__PURE__ */ function() {
          function e2(e3, t2) {
            for (var n2 = 0; n2 < t2.length; n2++) {
              var r2 = t2[n2];
              r2.enumerable = r2.enumerable || false, r2.configurable = true, "value" in r2 && (r2.writable = true), Object.defineProperty(e3, r2.key, r2);
            }
          }
          return function(t2, n2, r2) {
            return n2 && e2(t2.prototype, n2), r2 && e2(t2, r2), t2;
          };
        }(), a = n(0), s = g(n(18)), l = m(n(79)), c = g(n(80)), u = m(n(43)), p = m(n(83)), f = n(36), d = g(f), h = g(n(44));
        function m(e2) {
          if (e2 && e2.__esModule) return e2;
          var t2 = {};
          if (null != e2) for (var n2 in e2) Object.prototype.hasOwnProperty.call(e2, n2) && (t2[n2] = e2[n2]);
          return t2.default = e2, t2;
        }
        function g(e2) {
          return e2 && e2.__esModule ? e2 : { default: e2 };
        }
        n(84);
        var y = { overlay: "ReactModal__Overlay", content: "ReactModal__Content" }, b = 0, v = function(e2) {
          function t2(e3) {
            !function(e4, t3) {
              if (!(e4 instanceof t3)) throw new TypeError("Cannot call a class as a function");
            }(this, t2);
            var n2 = function(e4, t3) {
              if (!e4) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
              return !t3 || "object" != typeof t3 && "function" != typeof t3 ? e4 : t3;
            }(this, (t2.__proto__ || Object.getPrototypeOf(t2)).call(this, e3));
            return n2.setOverlayRef = function(e4) {
              n2.overlay = e4, n2.props.overlayRef && n2.props.overlayRef(e4);
            }, n2.setContentRef = function(e4) {
              n2.content = e4, n2.props.contentRef && n2.props.contentRef(e4);
            }, n2.afterClose = function() {
              var e4 = n2.props, t3 = e4.appElement, r2 = e4.ariaHideApp, o2 = e4.htmlOpenClassName, i2 = e4.bodyOpenClassName;
              i2 && p.remove(document.body, i2), o2 && p.remove(document.getElementsByTagName("html")[0], o2), r2 && b > 0 && 0 === (b -= 1) && u.show(t3), n2.props.shouldFocusAfterRender && (n2.props.shouldReturnFocusAfterClose ? (l.returnFocus(n2.props.preventScroll), l.teardownScopedFocus()) : l.popWithoutFocus()), n2.props.onAfterClose && n2.props.onAfterClose(), h.default.deregister(n2);
            }, n2.open = function() {
              n2.beforeOpen(), n2.state.afterOpen && n2.state.beforeClose ? (clearTimeout(n2.closeTimer), n2.setState({ beforeClose: false })) : (n2.props.shouldFocusAfterRender && (l.setupScopedFocus(n2.node), l.markForFocusLater()), n2.setState({ isOpen: true }, function() {
                n2.openAnimationFrame = requestAnimationFrame(function() {
                  n2.setState({ afterOpen: true }), n2.props.isOpen && n2.props.onAfterOpen && n2.props.onAfterOpen({ overlayEl: n2.overlay, contentEl: n2.content });
                });
              }));
            }, n2.close = function() {
              n2.props.closeTimeoutMS > 0 ? n2.closeWithTimeout() : n2.closeWithoutTimeout();
            }, n2.focusContent = function() {
              return n2.content && !n2.contentHasFocus() && n2.content.focus({ preventScroll: true });
            }, n2.closeWithTimeout = function() {
              var e4 = Date.now() + n2.props.closeTimeoutMS;
              n2.setState({ beforeClose: true, closesAt: e4 }, function() {
                n2.closeTimer = setTimeout(n2.closeWithoutTimeout, n2.state.closesAt - Date.now());
              });
            }, n2.closeWithoutTimeout = function() {
              n2.setState({ beforeClose: false, isOpen: false, afterOpen: false, closesAt: null }, n2.afterClose);
            }, n2.handleKeyDown = function(e4) {
              9 === e4.keyCode && (0, c.default)(n2.content, e4), n2.props.shouldCloseOnEsc && 27 === e4.keyCode && (e4.stopPropagation(), n2.requestClose(e4));
            }, n2.handleOverlayOnClick = function(e4) {
              null === n2.shouldClose && (n2.shouldClose = true), n2.shouldClose && n2.props.shouldCloseOnOverlayClick && (n2.ownerHandlesClose() ? n2.requestClose(e4) : n2.focusContent()), n2.shouldClose = null;
            }, n2.handleContentOnMouseUp = function() {
              n2.shouldClose = false;
            }, n2.handleOverlayOnMouseDown = function(e4) {
              n2.props.shouldCloseOnOverlayClick || e4.target != n2.overlay || e4.preventDefault();
            }, n2.handleContentOnClick = function() {
              n2.shouldClose = false;
            }, n2.handleContentOnMouseDown = function() {
              n2.shouldClose = false;
            }, n2.requestClose = function(e4) {
              return n2.ownerHandlesClose() && n2.props.onRequestClose(e4);
            }, n2.ownerHandlesClose = function() {
              return n2.props.onRequestClose;
            }, n2.shouldBeClosed = function() {
              return !n2.state.isOpen && !n2.state.beforeClose;
            }, n2.contentHasFocus = function() {
              return document.activeElement === n2.content || n2.content.contains(document.activeElement);
            }, n2.buildClassName = function(e4, t3) {
              var r2 = "object" === (void 0 === t3 ? "undefined" : o(t3)) ? t3 : { base: y[e4], afterOpen: y[e4] + "--after-open", beforeClose: y[e4] + "--before-close" }, i2 = r2.base;
              return n2.state.afterOpen && (i2 = i2 + " " + r2.afterOpen), n2.state.beforeClose && (i2 = i2 + " " + r2.beforeClose), "string" == typeof t3 && t3 ? i2 + " " + t3 : i2;
            }, n2.attributesFromObject = function(e4, t3) {
              return Object.keys(t3).reduce(function(n3, r2) {
                return n3[e4 + "-" + r2] = t3[r2], n3;
              }, {});
            }, n2.state = { afterOpen: false, beforeClose: false }, n2.shouldClose = null, n2.moveFromContentToOverlay = null, n2;
          }
          return function(e3, t3) {
            if ("function" != typeof t3 && null !== t3) throw new TypeError("Super expression must either be null or a function, not " + typeof t3);
            e3.prototype = Object.create(t3 && t3.prototype, { constructor: { value: e3, enumerable: false, writable: true, configurable: true } }), t3 && (Object.setPrototypeOf ? Object.setPrototypeOf(e3, t3) : e3.__proto__ = t3);
          }(t2, e2), i(t2, [{ key: "componentDidMount", value: function() {
            this.props.isOpen && this.open();
          } }, { key: "componentDidUpdate", value: function(e3, t3) {
            this.props.isOpen && !e3.isOpen ? this.open() : !this.props.isOpen && e3.isOpen && this.close(), this.props.shouldFocusAfterRender && this.state.isOpen && !t3.isOpen && this.focusContent();
          } }, { key: "componentWillUnmount", value: function() {
            this.state.isOpen && this.afterClose(), clearTimeout(this.closeTimer), cancelAnimationFrame(this.openAnimationFrame);
          } }, { key: "beforeOpen", value: function() {
            var e3 = this.props, t3 = e3.appElement, n2 = e3.ariaHideApp, r2 = e3.htmlOpenClassName, o2 = e3.bodyOpenClassName;
            o2 && p.add(document.body, o2), r2 && p.add(document.getElementsByTagName("html")[0], r2), n2 && (b += 1, u.hide(t3)), h.default.register(this);
          } }, { key: "render", value: function() {
            var e3 = this.props, t3 = e3.id, n2 = e3.className, o2 = e3.overlayClassName, i2 = e3.defaultStyles, a2 = e3.children, s2 = n2 ? {} : i2.content, l2 = o2 ? {} : i2.overlay;
            if (this.shouldBeClosed()) return null;
            var c2 = { ref: this.setOverlayRef, className: this.buildClassName("overlay", o2), style: r({}, l2, this.props.style.overlay), onClick: this.handleOverlayOnClick, onMouseDown: this.handleOverlayOnMouseDown }, u2 = r({ id: t3, ref: this.setContentRef, style: r({}, s2, this.props.style.content), className: this.buildClassName("content", n2), tabIndex: "-1", onKeyDown: this.handleKeyDown, onMouseDown: this.handleContentOnMouseDown, onMouseUp: this.handleContentOnMouseUp, onClick: this.handleContentOnClick, role: this.props.role, "aria-label": this.props.contentLabel }, this.attributesFromObject("aria", r({ modal: true }, this.props.aria)), this.attributesFromObject("data", this.props.data || {}), { "data-testid": this.props.testId }), p2 = this.props.contentElement(u2, a2);
            return this.props.overlayElement(c2, p2);
          } }]), t2;
        }(a.Component);
        v.defaultProps = { style: { overlay: {}, content: {} }, defaultStyles: {} }, v.propTypes = { isOpen: s.default.bool.isRequired, defaultStyles: s.default.shape({ content: s.default.object, overlay: s.default.object }), style: s.default.shape({ content: s.default.object, overlay: s.default.object }), className: s.default.oneOfType([s.default.string, s.default.object]), overlayClassName: s.default.oneOfType([s.default.string, s.default.object]), bodyOpenClassName: s.default.string, htmlOpenClassName: s.default.string, ariaHideApp: s.default.bool, appElement: s.default.oneOfType([s.default.instanceOf(d.default), s.default.instanceOf(f.SafeHTMLCollection), s.default.instanceOf(f.SafeNodeList), s.default.arrayOf(s.default.instanceOf(d.default))]), onAfterOpen: s.default.func, onAfterClose: s.default.func, onRequestClose: s.default.func, closeTimeoutMS: s.default.number, shouldFocusAfterRender: s.default.bool, shouldCloseOnOverlayClick: s.default.bool, shouldReturnFocusAfterClose: s.default.bool, preventScroll: s.default.bool, role: s.default.string, contentLabel: s.default.string, aria: s.default.object, data: s.default.object, children: s.default.node, shouldCloseOnEsc: s.default.bool, overlayRef: s.default.func, contentRef: s.default.func, id: s.default.string, overlayElement: s.default.func, contentElement: s.default.func, testId: s.default.string }, t.default = v, e.exports = t.default;
      }, function(e, t, n) {
        Object.defineProperty(t, "__esModule", { value: true }), t.resetState = function() {
          a = [];
        }, t.log = function() {
        }, t.handleBlur = c, t.handleFocus = u, t.markForFocusLater = function() {
          a.push(document.activeElement);
        }, t.returnFocus = function() {
          var e2 = arguments.length > 0 && void 0 !== arguments[0] && arguments[0], t2 = null;
          try {
            return void (0 !== a.length && (t2 = a.pop()).focus({ preventScroll: e2 }));
          } catch (e3) {
            console.warn(["You tried to return focus to", t2, "but it is not in the DOM anymore"].join(" "));
          }
        }, t.popWithoutFocus = function() {
          a.length > 0 && a.pop();
        }, t.setupScopedFocus = function(e2) {
          s = e2, window.addEventListener ? (window.addEventListener("blur", c, false), document.addEventListener("focus", u, true)) : (window.attachEvent("onBlur", c), document.attachEvent("onFocus", u));
        }, t.teardownScopedFocus = function() {
          s = null, window.addEventListener ? (window.removeEventListener("blur", c), document.removeEventListener("focus", u)) : (window.detachEvent("onBlur", c), document.detachEvent("onFocus", u));
        };
        var r, o = n(42), i = (r = o) && r.__esModule ? r : { default: r };
        var a = [], s = null, l = false;
        function c() {
          l = true;
        }
        function u() {
          if (l) {
            if (l = false, !s) return;
            setTimeout(function() {
              s.contains(document.activeElement) || ((0, i.default)(s)[0] || s).focus();
            }, 0);
          }
        }
      }, function(e, t, n) {
        Object.defineProperty(t, "__esModule", { value: true }), t.default = function(e2, t2) {
          var n2 = (0, i.default)(e2);
          if (!n2.length) return void t2.preventDefault();
          var r2 = void 0, o2 = t2.shiftKey, a = n2[0], s = n2[n2.length - 1], l = function e3() {
            var t3 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : document;
            return t3.activeElement.shadowRoot ? e3(t3.activeElement.shadowRoot) : t3.activeElement;
          }();
          if (e2 === l) {
            if (!o2) return;
            r2 = s;
          }
          s !== l || o2 || (r2 = a);
          a === l && o2 && (r2 = s);
          if (r2) return t2.preventDefault(), void r2.focus();
          var c = /(\bChrome\b|\bSafari\b)\//.exec(navigator.userAgent);
          if (null == c || "Chrome" == c[1] || null != /\biPod\b|\biPad\b/g.exec(navigator.userAgent)) return;
          var u = n2.indexOf(l);
          u > -1 && (u += o2 ? -1 : 1);
          if (void 0 === (r2 = n2[u])) return t2.preventDefault(), void (r2 = o2 ? s : a).focus();
          t2.preventDefault(), r2.focus();
        };
        var r, o = n(42), i = (r = o) && r.__esModule ? r : { default: r };
        e.exports = t.default;
      }, function(e, t, n) {
        var r = function() {
        };
        e.exports = r;
      }, function(e, t, n) {
        var r;
        !function() {
          var o = !("undefined" == typeof window || !window.document || !window.document.createElement), i = { canUseDOM: o, canUseWorkers: "undefined" != typeof Worker, canUseEventListeners: o && !(!window.addEventListener && !window.attachEvent), canUseViewport: o && !!window.screen };
          void 0 === (r = (function() {
            return i;
          }).call(t, n, t, e)) || (e.exports = r);
        }();
      }, function(e, t, n) {
        Object.defineProperty(t, "__esModule", { value: true }), t.resetState = function() {
          var e2 = document.getElementsByTagName("html")[0];
          for (var t2 in r) i(e2, r[t2]);
          var n2 = document.body;
          for (var a in o) i(n2, o[a]);
          r = {}, o = {};
        }, t.log = function() {
        };
        var r = {}, o = {};
        function i(e2, t2) {
          e2.classList.remove(t2);
        }
        t.add = function(e2, t2) {
          return n2 = e2.classList, i2 = "html" == e2.nodeName.toLowerCase() ? r : o, void t2.split(" ").forEach(function(e3) {
            !function(e4, t3) {
              e4[t3] || (e4[t3] = 0), e4[t3] += 1;
            }(i2, e3), n2.add(e3);
          });
          var n2, i2;
        }, t.remove = function(e2, t2) {
          return n2 = e2.classList, i2 = "html" == e2.nodeName.toLowerCase() ? r : o, void t2.split(" ").forEach(function(e3) {
            !function(e4, t3) {
              e4[t3] && (e4[t3] -= 1);
            }(i2, e3), 0 === i2[e3] && n2.remove(e3);
          });
          var n2, i2;
        };
      }, function(e, t, n) {
        Object.defineProperty(t, "__esModule", { value: true }), t.resetState = function() {
          for (var e2 = [a, s], t2 = 0; t2 < e2.length; t2++) {
            var n2 = e2[t2];
            n2 && (n2.parentNode && n2.parentNode.removeChild(n2));
          }
          a = s = null, l = [];
        }, t.log = function() {
          console.log("bodyTrap ----------"), console.log(l.length);
          for (var e2 = [a, s], t2 = 0; t2 < e2.length; t2++) {
            var n2 = e2[t2] || {};
            console.log(n2.nodeName, n2.className, n2.id);
          }
          console.log("edn bodyTrap ----------");
        };
        var r, o = n(44), i = (r = o) && r.__esModule ? r : { default: r };
        var a = void 0, s = void 0, l = [];
        function c() {
          0 !== l.length && l[l.length - 1].focusContent();
        }
        i.default.subscribe(function(e2, t2) {
          a || s || ((a = document.createElement("div")).setAttribute("data-react-modal-body-trap", ""), a.style.position = "absolute", a.style.opacity = "0", a.setAttribute("tabindex", "0"), a.addEventListener("focus", c), (s = a.cloneNode()).addEventListener("focus", c)), (l = t2).length > 0 ? (document.body.firstChild !== a && document.body.insertBefore(a, document.body.firstChild), document.body.lastChild !== s && document.body.appendChild(s)) : (a.parentElement && a.parentElement.removeChild(a), s.parentElement && s.parentElement.removeChild(s));
        });
      }, function(e, t, n) {
        function r() {
          var e2 = this.constructor.getDerivedStateFromProps(this.props, this.state);
          null != e2 && this.setState(e2);
        }
        function o(e2) {
          this.setState((function(t2) {
            var n2 = this.constructor.getDerivedStateFromProps(e2, t2);
            return null != n2 ? n2 : null;
          }).bind(this));
        }
        function i(e2, t2) {
          try {
            var n2 = this.props, r2 = this.state;
            this.props = e2, this.state = t2, this.__reactInternalSnapshotFlag = true, this.__reactInternalSnapshot = this.getSnapshotBeforeUpdate(n2, r2);
          } finally {
            this.props = n2, this.state = r2;
          }
        }
        function a(e2) {
          var t2 = e2.prototype;
          if (!t2 || !t2.isReactComponent) throw new Error("Can only polyfill class components");
          if ("function" != typeof e2.getDerivedStateFromProps && "function" != typeof t2.getSnapshotBeforeUpdate) return e2;
          var n2 = null, a2 = null, s = null;
          if ("function" == typeof t2.componentWillMount ? n2 = "componentWillMount" : "function" == typeof t2.UNSAFE_componentWillMount && (n2 = "UNSAFE_componentWillMount"), "function" == typeof t2.componentWillReceiveProps ? a2 = "componentWillReceiveProps" : "function" == typeof t2.UNSAFE_componentWillReceiveProps && (a2 = "UNSAFE_componentWillReceiveProps"), "function" == typeof t2.componentWillUpdate ? s = "componentWillUpdate" : "function" == typeof t2.UNSAFE_componentWillUpdate && (s = "UNSAFE_componentWillUpdate"), null !== n2 || null !== a2 || null !== s) {
            var l = e2.displayName || e2.name, c = "function" == typeof e2.getDerivedStateFromProps ? "getDerivedStateFromProps()" : "getSnapshotBeforeUpdate()";
            throw Error("Unsafe legacy lifecycles will not be called for components using new component APIs.\n\n" + l + " uses " + c + " but also contains the following legacy lifecycles:" + (null !== n2 ? "\n  " + n2 : "") + (null !== a2 ? "\n  " + a2 : "") + (null !== s ? "\n  " + s : "") + "\n\nThe above lifecycles should be removed. Learn more about this warning here:\nhttps://fb.me/react-async-component-lifecycle-hooks");
          }
          if ("function" == typeof e2.getDerivedStateFromProps && (t2.componentWillMount = r, t2.componentWillReceiveProps = o), "function" == typeof t2.getSnapshotBeforeUpdate) {
            if ("function" != typeof t2.componentDidUpdate) throw new Error("Cannot polyfill getSnapshotBeforeUpdate() for components that do not define componentDidUpdate() on the prototype");
            t2.componentWillUpdate = i;
            var u = t2.componentDidUpdate;
            t2.componentDidUpdate = function(e3, t3, n3) {
              var r2 = this.__reactInternalSnapshotFlag ? this.__reactInternalSnapshot : n3;
              u.call(this, e3, t3, r2);
            };
          }
          return e2;
        }
        n.r(t), n.d(t, "polyfill", function() {
          return a;
        }), r.__suppressDeprecationWarning = true, o.__suppressDeprecationWarning = true, i.__suppressDeprecationWarning = true;
      }, function(e, t, n) {
        var r = n(6), o = n(87);
        "string" == typeof (o = o.__esModule ? o.default : o) && (o = [[e.i, o, ""]]);
        var i = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": true }, insert: "head", singleton: true };
        r(o, i);
        e.exports = o.locals || {};
      }, function(e, t, n) {
        (e.exports = n(7)(false)).push([e.i, ".ck-inspector-modal{--ck-inspector-set-data-modal-overlay:rgba(0,0,0,0.5);--ck-inspector-set-data-modal-shadow:rgba(0,0,0,0.06);--ck-inspector-set-data-modal-button-background:#eee;--ck-inspector-set-data-modal-button-background-hover:#ddd;--ck-inspector-set-data-modal-save-button-background:#1976d2;--ck-inspector-set-data-modal-save-button-background-hover:#0b60b5}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal{z-index:999999;position:fixed;inset:0;background-color:var(--ck-inspector-set-data-modal-overlay)}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content{position:absolute;border:1px solid var(--ck-inspector-color-border);background:var(--ck-inspector-color-white);overflow:auto;border-radius:2px;outline:none;box-shadow:0 1px 1px var(--ck-inspector-set-data-modal-shadow),0 2px 2px var(--ck-inspector-set-data-modal-shadow),0 4px 4px var(--ck-inspector-set-data-modal-shadow),0 8px 8px var(--ck-inspector-set-data-modal-shadow),0 16px 16px var(--ck-inspector-set-data-modal-shadow);max-height:calc(100vh - 160px);max-width:calc(100vw - 160px);width:100%;height:100%;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;justify-content:space-between}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content h2{font-size:14px;font-weight:700;margin:0;padding:12px 20px;background:var(--ck-inspector-color-background);border-bottom:1px solid var(--ck-inspector-color-border)}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content textarea{flex-grow:1;margin:20px;border:1px solid var(--ck-inspector-color-border);border-radius:2px;resize:none;padding:10px;font-family:monospace;font-size:14px}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content button{padding:10px 20px;border-radius:2px;font-size:14px;white-space:nowrap;border:1px solid var(--ck-inspector-color-border)}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content button:hover{background:var(--ck-inspector-set-data-modal-button-background-hover)}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons{margin:0 20px 20px;display:flex;justify-content:center}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button+button{margin-left:20px}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button:first-child{margin-right:auto}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button:not(:first-child){flex-basis:20%}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button:last-child{background:var(--ck-inspector-set-data-modal-save-button-background);border-color:var(--ck-inspector-set-data-modal-save-button-background);color:#fff;font-weight:700}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button:last-child:hover{background:var(--ck-inspector-set-data-modal-save-button-background-hover)}", ""]);
      }, function(e, t, n) {
        var r = n(6), o = n(89);
        "string" == typeof (o = o.__esModule ? o.default : o) && (o = [[e.i, o, ""]]);
        var i = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": true }, insert: "head", singleton: true };
        r(o, i);
        e.exports = o.locals || {};
      }, function(e, t, n) {
        (e.exports = n(7)(false)).push([e.i, ".ck-inspector .ck-inspector-editor-quick-actions{display:flex;align-content:center;justify-content:center;align-items:center;flex-direction:row;flex-wrap:nowrap}.ck-inspector .ck-inspector-editor-quick-actions>.ck-inspector-button{margin-left:.3em}.ck-inspector .ck-inspector-editor-quick-actions>.ck-inspector-button.ck-inspector-button_data-copied{animation-duration:.5s;animation-name:ck-inspector-bounce-in;color:green}@keyframes ck-inspector-bounce-in{0%{opacity:0;transform:scale3d(.5,.5,.5)}20%{transform:scale3d(1.1,1.1,1.1)}40%{transform:scale3d(.8,.8,.8)}60%{opacity:1;transform:scale3d(1.05,1.05,1.05)}to{opacity:1;transform:scaleX(1)}}", ""]);
      }, function(e, t, n) {
        var r = n(6), o = n(91);
        "string" == typeof (o = o.__esModule ? o.default : o) && (o = [[e.i, o, ""]]);
        var i = { injectType: "singletonStyleTag", attributes: { "data-cke-inspector": true }, insert: "head", singleton: true };
        r(o, i);
        e.exports = o.locals || {};
      }, function(e, t, n) {
        (e.exports = n(7)(false)).push([e.i, "html body.ck-inspector-body-expanded{margin-bottom:var(--ck-inspector-height)}html body.ck-inspector-body-collapsed{margin-bottom:var(--ck-inspector-collapsed-height)}.ck-inspector-wrapper *{box-sizing:border-box}", ""]);
      }, , , function(e, t, n) {
        n.r(t), n.d(t, "default", function() {
          return qn;
        });
        var r = n(0), o = n.n(r), i = n(12), a = n.n(i);
        function s(e2) {
          return "Minified Redux error #" + e2 + "; visit https://redux.js.org/Errors?code=" + e2 + " for the full message or use the non-minified dev environment for full errors. ";
        }
        var l = "function" == typeof Symbol && Symbol.observable || "@@observable", c = function() {
          return Math.random().toString(36).substring(7).split("").join(".");
        }, u = { INIT: "@@redux/INIT" + c(), REPLACE: "@@redux/REPLACE" + c(), PROBE_UNKNOWN_ACTION: function() {
          return "@@redux/PROBE_UNKNOWN_ACTION" + c();
        } };
        function p(e2) {
          if ("object" != typeof e2 || null === e2) return false;
          for (var t2 = e2; null !== Object.getPrototypeOf(t2); ) t2 = Object.getPrototypeOf(t2);
          return Object.getPrototypeOf(e2) === t2;
        }
        function f(e2, t2, n2) {
          var r2;
          if ("function" == typeof t2 && "function" == typeof n2 || "function" == typeof n2 && "function" == typeof arguments[3]) throw new Error(s(0));
          if ("function" == typeof t2 && void 0 === n2 && (n2 = t2, t2 = void 0), void 0 !== n2) {
            if ("function" != typeof n2) throw new Error(s(1));
            return n2(f)(e2, t2);
          }
          if ("function" != typeof e2) throw new Error(s(2));
          var o2 = e2, i2 = t2, a2 = [], c2 = a2, d2 = false;
          function h2() {
            c2 === a2 && (c2 = a2.slice());
          }
          function m2() {
            if (d2) throw new Error(s(3));
            return i2;
          }
          function g2(e3) {
            if ("function" != typeof e3) throw new Error(s(4));
            if (d2) throw new Error(s(5));
            var t3 = true;
            return h2(), c2.push(e3), function() {
              if (t3) {
                if (d2) throw new Error(s(6));
                t3 = false, h2();
                var n3 = c2.indexOf(e3);
                c2.splice(n3, 1), a2 = null;
              }
            };
          }
          function y2(e3) {
            if (!p(e3)) throw new Error(s(7));
            if (void 0 === e3.type) throw new Error(s(8));
            if (d2) throw new Error(s(9));
            try {
              d2 = true, i2 = o2(i2, e3);
            } finally {
              d2 = false;
            }
            for (var t3 = a2 = c2, n3 = 0; n3 < t3.length; n3++) {
              (0, t3[n3])();
            }
            return e3;
          }
          function b2(e3) {
            if ("function" != typeof e3) throw new Error(s(10));
            o2 = e3, y2({ type: u.REPLACE });
          }
          function v2() {
            var e3, t3 = g2;
            return (e3 = { subscribe: function(e4) {
              if ("object" != typeof e4 || null === e4) throw new Error(s(11));
              function n3() {
                e4.next && e4.next(m2());
              }
              return n3(), { unsubscribe: t3(n3) };
            } })[l] = function() {
              return this;
            }, e3;
          }
          return y2({ type: u.INIT }), (r2 = { dispatch: y2, subscribe: g2, getState: m2, replaceReducer: b2 })[l] = v2, r2;
        }
        var d = o.a.createContext(null);
        var h = function(e2) {
          e2();
        };
        function m() {
          var e2 = h, t2 = null, n2 = null;
          return { clear: function() {
            t2 = null, n2 = null;
          }, notify: function() {
            e2(function() {
              for (var e3 = t2; e3; ) e3.callback(), e3 = e3.next;
            });
          }, get: function() {
            for (var e3 = [], n3 = t2; n3; ) e3.push(n3), n3 = n3.next;
            return e3;
          }, subscribe: function(e3) {
            var r2 = true, o2 = n2 = { callback: e3, next: null, prev: n2 };
            return o2.prev ? o2.prev.next = o2 : t2 = o2, function() {
              r2 && null !== t2 && (r2 = false, o2.next ? o2.next.prev = o2.prev : n2 = o2.prev, o2.prev ? o2.prev.next = o2.next : t2 = o2.next);
            };
          } };
        }
        var g = { notify: function() {
        }, get: function() {
          return [];
        } };
        function y(e2, t2) {
          var n2, r2 = g;
          function o2() {
            a2.onStateChange && a2.onStateChange();
          }
          function i2() {
            n2 || (n2 = t2 ? t2.addNestedSub(o2) : e2.subscribe(o2), r2 = m());
          }
          var a2 = { addNestedSub: function(e3) {
            return i2(), r2.subscribe(e3);
          }, notifyNestedSubs: function() {
            r2.notify();
          }, handleChangeWrapper: o2, isSubscribed: function() {
            return Boolean(n2);
          }, trySubscribe: i2, tryUnsubscribe: function() {
            n2 && (n2(), n2 = void 0, r2.clear(), r2 = g);
          }, getListeners: function() {
            return r2;
          } };
          return a2;
        }
        var b = "undefined" != typeof window && void 0 !== window.document && void 0 !== window.document.createElement ? r.useLayoutEffect : r.useEffect;
        var v = function(e2) {
          var t2 = e2.store, n2 = e2.context, i2 = e2.children, a2 = Object(r.useMemo)(function() {
            var e3 = y(t2);
            return { store: t2, subscription: e3 };
          }, [t2]), s2 = Object(r.useMemo)(function() {
            return t2.getState();
          }, [t2]);
          b(function() {
            var e3 = a2.subscription;
            return e3.onStateChange = e3.notifyNestedSubs, e3.trySubscribe(), s2 !== t2.getState() && e3.notifyNestedSubs(), function() {
              e3.tryUnsubscribe(), e3.onStateChange = null;
            };
          }, [a2, s2]);
          var l2 = n2 || d;
          return o.a.createElement(l2.Provider, { value: a2 }, i2);
        };
        function k() {
          return (k = Object.assign ? Object.assign.bind() : function(e2) {
            for (var t2 = 1; t2 < arguments.length; t2++) {
              var n2 = arguments[t2];
              for (var r2 in n2) Object.prototype.hasOwnProperty.call(n2, r2) && (e2[r2] = n2[r2]);
            }
            return e2;
          }).apply(this, arguments);
        }
        function w(e2, t2) {
          if (null == e2) return {};
          var n2, r2, o2 = {}, i2 = Object.keys(e2);
          for (r2 = 0; r2 < i2.length; r2++) n2 = i2[r2], t2.indexOf(n2) >= 0 || (o2[n2] = e2[n2]);
          return o2;
        }
        var _ = n(39), E = n.n(_), x = n(45), S = ["getDisplayName", "methodName", "renderCountProp", "shouldHandleStateChanges", "storeKey", "withRef", "forwardRef", "context"], C = ["reactReduxForwardedRef"], T = [], O = [null, null];
        function N(e2, t2) {
          var n2 = e2[1];
          return [t2.payload, n2 + 1];
        }
        function P(e2, t2, n2) {
          b(function() {
            return e2.apply(void 0, t2);
          }, n2);
        }
        function D(e2, t2, n2, r2, o2, i2, a2) {
          e2.current = r2, t2.current = o2, n2.current = false, i2.current && (i2.current = null, a2());
        }
        function R(e2, t2, n2, r2, o2, i2, a2, s2, l2, c2) {
          if (e2) {
            var u2 = false, p2 = null, f2 = function() {
              if (!u2) {
                var e3, n3, f3 = t2.getState();
                try {
                  e3 = r2(f3, o2.current);
                } catch (e4) {
                  n3 = e4, p2 = e4;
                }
                n3 || (p2 = null), e3 === i2.current ? a2.current || l2() : (i2.current = e3, s2.current = e3, a2.current = true, c2({ type: "STORE_UPDATED", payload: { error: n3 } }));
              }
            };
            n2.onStateChange = f2, n2.trySubscribe(), f2();
            return function() {
              if (u2 = true, n2.tryUnsubscribe(), n2.onStateChange = null, p2) throw p2;
            };
          }
        }
        var M = function() {
          return [null, 0];
        };
        function j(e2, t2) {
          void 0 === t2 && (t2 = {});
          var n2 = t2, i2 = n2.getDisplayName, a2 = void 0 === i2 ? function(e3) {
            return "ConnectAdvanced(" + e3 + ")";
          } : i2, s2 = n2.methodName, l2 = void 0 === s2 ? "connectAdvanced" : s2, c2 = n2.renderCountProp, u2 = void 0 === c2 ? void 0 : c2, p2 = n2.shouldHandleStateChanges, f2 = void 0 === p2 || p2, h2 = n2.storeKey, m2 = void 0 === h2 ? "store" : h2, g2 = (n2.withRef, n2.forwardRef), b2 = void 0 !== g2 && g2, v2 = n2.context, _2 = void 0 === v2 ? d : v2, j2 = w(n2, S), A2 = _2;
          return function(t3) {
            var n3 = t3.displayName || t3.name || "Component", i3 = a2(n3), s3 = k({}, j2, { getDisplayName: a2, methodName: l2, renderCountProp: u2, shouldHandleStateChanges: f2, storeKey: m2, displayName: i3, wrappedComponentName: n3, WrappedComponent: t3 }), c3 = j2.pure;
            var p3 = c3 ? r.useMemo : function(e3) {
              return e3();
            };
            function d2(n4) {
              var i4 = Object(r.useMemo)(function() {
                var e3 = n4.reactReduxForwardedRef, t4 = w(n4, C);
                return [n4.context, e3, t4];
              }, [n4]), a3 = i4[0], l3 = i4[1], c4 = i4[2], u3 = Object(r.useMemo)(function() {
                return a3 && a3.Consumer && Object(x.isContextConsumer)(o.a.createElement(a3.Consumer, null)) ? a3 : A2;
              }, [a3, A2]), d3 = Object(r.useContext)(u3), h4 = Boolean(n4.store) && Boolean(n4.store.getState) && Boolean(n4.store.dispatch);
              Boolean(d3) && Boolean(d3.store);
              var m3 = h4 ? n4.store : d3.store, g4 = Object(r.useMemo)(function() {
                return function(t4) {
                  return e2(t4.dispatch, s3);
                }(m3);
              }, [m3]), b3 = Object(r.useMemo)(function() {
                if (!f2) return O;
                var e3 = y(m3, h4 ? null : d3.subscription), t4 = e3.notifyNestedSubs.bind(e3);
                return [e3, t4];
              }, [m3, h4, d3]), v3 = b3[0], _3 = b3[1], E2 = Object(r.useMemo)(function() {
                return h4 ? d3 : k({}, d3, { subscription: v3 });
              }, [h4, d3, v3]), S2 = Object(r.useReducer)(N, T, M), j3 = S2[0][0], z2 = S2[1];
              if (j3 && j3.error) throw j3.error;
              var L2 = Object(r.useRef)(), I2 = Object(r.useRef)(c4), U2 = Object(r.useRef)(), F2 = Object(r.useRef)(false), B2 = p3(function() {
                return U2.current && c4 === I2.current ? U2.current : g4(m3.getState(), c4);
              }, [m3, j3, c4]);
              P(D, [I2, L2, F2, c4, B2, U2, _3]), P(R, [f2, m3, v3, g4, I2, L2, F2, U2, _3, z2], [m3, v3, g4]);
              var W2 = Object(r.useMemo)(function() {
                return o.a.createElement(t3, k({}, B2, { ref: l3 }));
              }, [l3, t3, B2]);
              return Object(r.useMemo)(function() {
                return f2 ? o.a.createElement(u3.Provider, { value: E2 }, W2) : W2;
              }, [u3, W2, E2]);
            }
            var h3 = c3 ? o.a.memo(d2) : d2;
            if (h3.WrappedComponent = t3, h3.displayName = d2.displayName = i3, b2) {
              var g3 = o.a.forwardRef(function(e3, t4) {
                return o.a.createElement(h3, k({}, e3, { reactReduxForwardedRef: t4 }));
              });
              return g3.displayName = i3, g3.WrappedComponent = t3, E()(g3, t3);
            }
            return E()(h3, t3);
          };
        }
        function A(e2, t2) {
          return e2 === t2 ? 0 !== e2 || 0 !== t2 || 1 / e2 == 1 / t2 : e2 != e2 && t2 != t2;
        }
        function z(e2, t2) {
          if (A(e2, t2)) return true;
          if ("object" != typeof e2 || null === e2 || "object" != typeof t2 || null === t2) return false;
          var n2 = Object.keys(e2), r2 = Object.keys(t2);
          if (n2.length !== r2.length) return false;
          for (var o2 = 0; o2 < n2.length; o2++) if (!Object.prototype.hasOwnProperty.call(t2, n2[o2]) || !A(e2[n2[o2]], t2[n2[o2]])) return false;
          return true;
        }
        function L(e2) {
          return function(t2, n2) {
            var r2 = e2(t2, n2);
            function o2() {
              return r2;
            }
            return o2.dependsOnOwnProps = false, o2;
          };
        }
        function I(e2) {
          return null !== e2.dependsOnOwnProps && void 0 !== e2.dependsOnOwnProps ? Boolean(e2.dependsOnOwnProps) : 1 !== e2.length;
        }
        function U(e2, t2) {
          return function(t3, n2) {
            n2.displayName;
            var r2 = function(e3, t4) {
              return r2.dependsOnOwnProps ? r2.mapToProps(e3, t4) : r2.mapToProps(e3);
            };
            return r2.dependsOnOwnProps = true, r2.mapToProps = function(t4, n3) {
              r2.mapToProps = e2, r2.dependsOnOwnProps = I(e2);
              var o2 = r2(t4, n3);
              return "function" == typeof o2 && (r2.mapToProps = o2, r2.dependsOnOwnProps = I(o2), o2 = r2(t4, n3)), o2;
            }, r2;
          };
        }
        var F = [function(e2) {
          return "function" == typeof e2 ? U(e2) : void 0;
        }, function(e2) {
          return e2 ? void 0 : L(function(e3) {
            return { dispatch: e3 };
          });
        }, function(e2) {
          return e2 && "object" == typeof e2 ? L(function(t2) {
            return function(e3, t3) {
              var n2 = {}, r2 = function(r3) {
                var o3 = e3[r3];
                "function" == typeof o3 && (n2[r3] = function() {
                  return t3(o3.apply(void 0, arguments));
                });
              };
              for (var o2 in e3) r2(o2);
              return n2;
            }(e2, t2);
          }) : void 0;
        }];
        var B = [function(e2) {
          return "function" == typeof e2 ? U(e2) : void 0;
        }, function(e2) {
          return e2 ? void 0 : L(function() {
            return {};
          });
        }];
        function W(e2, t2, n2) {
          return k({}, n2, e2, t2);
        }
        var H = [function(e2) {
          return "function" == typeof e2 ? /* @__PURE__ */ function(e3) {
            return function(t2, n2) {
              n2.displayName;
              var r2, o2 = n2.pure, i2 = n2.areMergedPropsEqual, a2 = false;
              return function(t3, n3, s2) {
                var l2 = e3(t3, n3, s2);
                return a2 ? o2 && i2(l2, r2) || (r2 = l2) : (a2 = true, r2 = l2), r2;
              };
            };
          }(e2) : void 0;
        }, function(e2) {
          return e2 ? void 0 : function() {
            return W;
          };
        }];
        var V = ["initMapStateToProps", "initMapDispatchToProps", "initMergeProps"];
        function $2(e2, t2, n2, r2) {
          return function(o2, i2) {
            return n2(e2(o2, i2), t2(r2, i2), i2);
          };
        }
        function q(e2, t2, n2, r2, o2) {
          var i2, a2, s2, l2, c2, u2 = o2.areStatesEqual, p2 = o2.areOwnPropsEqual, f2 = o2.areStatePropsEqual, d2 = false;
          function h2(o3, d3) {
            var h3, m2, g2 = !p2(d3, a2), y2 = !u2(o3, i2);
            return i2 = o3, a2 = d3, g2 && y2 ? (s2 = e2(i2, a2), t2.dependsOnOwnProps && (l2 = t2(r2, a2)), c2 = n2(s2, l2, a2)) : g2 ? (e2.dependsOnOwnProps && (s2 = e2(i2, a2)), t2.dependsOnOwnProps && (l2 = t2(r2, a2)), c2 = n2(s2, l2, a2)) : y2 ? (h3 = e2(i2, a2), m2 = !f2(h3, s2), s2 = h3, m2 && (c2 = n2(s2, l2, a2)), c2) : c2;
          }
          return function(o3, u3) {
            return d2 ? h2(o3, u3) : (s2 = e2(i2 = o3, a2 = u3), l2 = t2(r2, a2), c2 = n2(s2, l2, a2), d2 = true, c2);
          };
        }
        function Y(e2, t2) {
          var n2 = t2.initMapStateToProps, r2 = t2.initMapDispatchToProps, o2 = t2.initMergeProps, i2 = w(t2, V), a2 = n2(e2, i2), s2 = r2(e2, i2), l2 = o2(e2, i2);
          return (i2.pure ? q : $2)(a2, s2, l2, e2, i2);
        }
        var K = ["pure", "areStatesEqual", "areOwnPropsEqual", "areStatePropsEqual", "areMergedPropsEqual"];
        function Q(e2, t2, n2) {
          for (var r2 = t2.length - 1; r2 >= 0; r2--) {
            var o2 = t2[r2](e2);
            if (o2) return o2;
          }
          return function(t3, r3) {
            throw new Error("Invalid value of type " + typeof e2 + " for " + n2 + " argument when connecting component " + r3.wrappedComponentName + ".");
          };
        }
        function G(e2, t2) {
          return e2 === t2;
        }
        function X(e2) {
          var t2 = {}, n2 = t2.connectHOC, r2 = void 0 === n2 ? j : n2, o2 = t2.mapStateToPropsFactories, i2 = void 0 === o2 ? B : o2, a2 = t2.mapDispatchToPropsFactories, s2 = void 0 === a2 ? F : a2, l2 = t2.mergePropsFactories, c2 = void 0 === l2 ? H : l2, u2 = t2.selectorFactory, p2 = void 0 === u2 ? Y : u2;
          return function(e3, t3, n3, o3) {
            void 0 === o3 && (o3 = {});
            var a3 = o3, l3 = a3.pure, u3 = void 0 === l3 || l3, f2 = a3.areStatesEqual, d2 = void 0 === f2 ? G : f2, h2 = a3.areOwnPropsEqual, m2 = void 0 === h2 ? z : h2, g2 = a3.areStatePropsEqual, y2 = void 0 === g2 ? z : g2, b2 = a3.areMergedPropsEqual, v2 = void 0 === b2 ? z : b2, _2 = w(a3, K), E2 = Q(e3, i2, "mapStateToProps"), x2 = Q(t3, s2, "mapDispatchToProps"), S2 = Q(n3, c2, "mergeProps");
            return r2(p2, k({ methodName: "connect", getDisplayName: function(e4) {
              return "Connect(" + e4 + ")";
            }, shouldHandleStateChanges: Boolean(e3), initMapStateToProps: E2, initMapDispatchToProps: x2, initMergeProps: S2, pure: u3, areStatesEqual: d2, areOwnPropsEqual: m2, areStatePropsEqual: y2, areMergedPropsEqual: v2 }, _2));
          };
        }
        var J = X();
        var Z;
        Z = i.unstable_batchedUpdates, h = Z;
        function ee(e2) {
          return { type: "SET_MODEL_ACTIVE_TAB", tabName: e2 };
        }
        function te() {
          return { type: "TOGGLE_IS_COLLAPSED" };
        }
        function ne(e2) {
          return { type: "SET_EDITORS", editors: e2 };
        }
        function re(e2) {
          return { type: "SET_CURRENT_EDITOR_NAME", editorName: e2 };
        }
        function oe(e2) {
          return { type: "SET_ACTIVE_INSPECTOR_TAB", tabName: e2 };
        }
        var ie = n(10), ae = n(4);
        class se {
          constructor(e2) {
            this._config = e2;
          }
          startListening(e2) {
            e2.model.document.on("change", this._config.onModelChange), e2.editing.view.on("render", this._config.onViewRender), e2.on("change:isReadOnly", this._config.onReadOnlyChange);
          }
          stopListening(e2) {
            e2.model.document.off("change", this._config.onModelChange), e2.editing.view.off("render", this._config.onViewRender), e2.off("change:isReadOnly", this._config.onReadOnlyChange);
          }
        }
        function le(e2) {
          return e2.editors.get(e2.currentEditorName);
        }
        class ce {
          static set(e2, t2) {
            window.localStorage.setItem("ck5-inspector-" + e2, t2);
          }
          static get(e2) {
            return window.localStorage.getItem("ck5-inspector-" + e2);
          }
        }
        function ue(e2, t2, n2) {
          const r2 = function(e3, t3, n3) {
            if ("Model" !== e3.ui.activeTab) return t3;
            if (!t3) return pe(e3, t3);
            switch (n3.type) {
              case "SET_MODEL_CURRENT_ROOT_NAME":
                return function(e4, t4, n4) {
                  const r3 = n4.currentRootName;
                  return { ...t4, ...fe(e4, t4, { currentRootName: r3 }), currentNode: null, currentNodeDefinition: null, currentRootName: r3 };
                }(e3, t3, n3);
              case "SET_MODEL_CURRENT_NODE":
                return { ...t3, currentNode: n3.currentNode, currentNodeDefinition: Object(ie.b)(le(e3), n3.currentNode) };
              case "SET_ACTIVE_INSPECTOR_TAB":
              case "UPDATE_MODEL_STATE":
                return { ...t3, ...fe(e3, t3) };
              case "SET_EDITORS":
              case "SET_CURRENT_EDITOR_NAME":
                return pe(e3, t3);
              default:
                return t3;
            }
          }(e2, t2, n2);
          return r2 && (r2.ui = function(e3, t3) {
            if (!e3) return { activeTab: ce.get("active-model-tab-name") || "Inspect", showMarkers: "true" === ce.get("model-show-markers"), showCompactText: "true" === ce.get("model-compact-text") };
            switch (t3.type) {
              case "SET_MODEL_ACTIVE_TAB":
                return function(e4, t4) {
                  return ce.set("active-model-tab-name", t4.tabName), { ...e4, activeTab: t4.tabName };
                }(e3, t3);
              case "TOGGLE_MODEL_SHOW_MARKERS":
                return function(e4) {
                  const t4 = !e4.showMarkers;
                  return ce.set("model-show-markers", t4), { ...e4, showMarkers: t4 };
                }(e3);
              case "TOGGLE_MODEL_SHOW_COMPACT_TEXT":
                return function(e4) {
                  const t4 = !e4.showCompactText;
                  return ce.set("model-compact-text", t4), { ...e4, showCompactText: t4 };
                }(e3);
              default:
                return e3;
            }
          }(r2.ui, n2)), r2;
        }
        function pe(e2, t2 = {}) {
          const n2 = le(e2);
          if (!n2) return { ui: t2.ui };
          const r2 = Object(ie.d)(n2)[0].rootName;
          return { ...t2, ...fe(e2, t2, { currentRootName: r2 }), currentRootName: r2, currentNode: null, currentNodeDefinition: null };
        }
        function fe(e2, t2, n2) {
          const r2 = le(e2), o2 = { ...t2, ...n2 }, i2 = o2.currentRootName, a2 = Object(ie.c)(r2, i2), s2 = Object(ie.a)(r2, i2), l2 = Object(ie.e)({ currentEditor: r2, currentRootName: o2.currentRootName, ranges: a2, markers: s2 });
          let c2 = o2.currentNode, u2 = o2.currentNodeDefinition;
          return c2 ? c2.root.rootName !== i2 || !Object(ae.d)(c2) && !c2.parent ? (c2 = null, u2 = null) : u2 = Object(ie.b)(r2, c2) : u2 = null, { treeDefinition: l2, currentNode: c2, currentNodeDefinition: u2, ranges: a2, markers: s2 };
        }
        function de(e2) {
          return { type: "SET_VIEW_ACTIVE_TAB", tabName: e2 };
        }
        function he() {
          return { type: "UPDATE_VIEW_STATE" };
        }
        var me = n(9), ge = n(2);
        function ye(e2, t2, n2) {
          const r2 = function(e3, t3, n3) {
            if ("View" !== e3.ui.activeTab) return t3;
            if (!t3) return be(e3, t3);
            switch (n3.type) {
              case "SET_VIEW_CURRENT_ROOT_NAME":
                return function(e4, t4, n4) {
                  const r3 = n4.currentRootName;
                  return { ...t4, ...ve(e4, t4, { currentRootName: r3 }), currentNode: null, currentNodeDefinition: null, currentRootName: r3 };
                }(e3, t3, n3);
              case "SET_VIEW_CURRENT_NODE":
                return { ...t3, currentNode: n3.currentNode, currentNodeDefinition: Object(me.b)(n3.currentNode) };
              case "SET_ACTIVE_INSPECTOR_TAB":
              case "UPDATE_VIEW_STATE":
                return { ...t3, ...ve(e3, t3) };
              case "SET_EDITORS":
              case "SET_CURRENT_EDITOR_NAME":
                return be(e3, t3);
              default:
                return t3;
            }
          }(e2, t2, n2);
          return r2 && (r2.ui = function(e3, t3, n3) {
            if (!t3) return { activeTab: ce.get("active-view-tab-name") || "Inspect", showElementTypes: "true" === ce.get("view-element-types") };
            switch (n3.type) {
              case "SET_VIEW_ACTIVE_TAB":
                return function(e4, t4) {
                  return ce.set("active-view-tab-name", t4.tabName), { ...e4, activeTab: t4.tabName };
                }(t3, n3);
              case "TOGGLE_VIEW_SHOW_ELEMENT_TYPES":
                return function(e4, t4) {
                  const n4 = !t4.showElementTypes;
                  return ce.set("view-element-types", n4), { ...t4, showElementTypes: n4 };
                }(0, t3);
              default:
                return t3;
            }
          }(0, r2.ui, n2)), r2;
        }
        function be(e2, t2 = {}) {
          const n2 = le(e2), r2 = Object(me.d)(n2), o2 = r2[0] ? r2[0].rootName : null;
          return { ...t2, ...ve(e2, t2, { currentRootName: o2 }), currentRootName: o2, currentNode: null, currentNodeDefinition: null };
        }
        function ve(e2, t2, n2) {
          const r2 = { ...t2, ...n2 }, o2 = r2.currentRootName, i2 = Object(me.c)(le(e2), o2), a2 = Object(me.e)({ currentEditor: le(e2), currentRootName: o2, ranges: i2 });
          let s2 = r2.currentNode, l2 = r2.currentNodeDefinition;
          return s2 ? s2.root.rootName !== o2 || !Object(ge.g)(s2) && !s2.parent ? (s2 = null, l2 = null) : l2 = Object(me.b)(s2) : l2 = null, { treeDefinition: a2, currentNode: s2, currentNodeDefinition: l2, ranges: i2 };
        }
        function ke() {
          return { type: "UPDATE_COMMANDS_STATE" };
        }
        var we = n(1);
        function _e({ editors: e2, currentEditorName: t2 }, n2) {
          if (!n2) return null;
          const r2 = e2.get(t2).commands.get(n2);
          return { currentCommandName: n2, type: "Command", url: "https://ckeditor.com/docs/ckeditor5/latest/api/module_core_command-Command.html", properties: Object(we.b)({ isEnabled: { value: r2.isEnabled }, value: { value: r2.value } }), command: r2 };
        }
        function Ee({ editors: e2, currentEditorName: t2 }) {
          if (!e2.get(t2)) return [];
          const n2 = [];
          for (const [r2, o2] of e2.get(t2).commands) {
            const e3 = [];
            void 0 !== o2.value && e3.push(["value", Object(we.a)(o2.value, false)]), n2.push({ name: r2, type: "element", children: [], node: r2, attributes: e3, presentation: { isEmpty: true, cssClass: ["ck-inspector-tree-node_tagless", o2.isEnabled ? "" : "ck-inspector-tree-node_disabled"].join(" ") } });
          }
          return n2.sort((e3, t3) => e3.name > t3.name ? 1 : -1);
        }
        function xe(e2, t2 = {}) {
          return { ...t2, currentCommandName: null, currentCommandDefinition: null, treeDefinition: Ee(e2) };
        }
        function Se(e2) {
          return { type: "SET_SCHEMA_CURRENT_DEFINITION_NAME", currentSchemaDefinitionName: e2 };
        }
        const Ce = ["isBlock", "isInline", "isObject", "isContent", "isLimit", "isSelectable"], Te = "https://ckeditor.com/docs/ckeditor5/latest/api/";
        function Oe({ editors: e2, currentEditorName: t2 }, n2) {
          if (!n2) return null;
          const r2 = e2.get(t2).model.schema, o2 = r2.getDefinitions()[n2], i2 = {}, a2 = {}, s2 = {};
          let l2 = {};
          for (const e3 of Ce) o2[e3] && (i2[e3] = { value: o2[e3] });
          for (const e3 of o2.allowChildren.sort()) a2[e3] = { value: true, title: "Click to see the definition of " + e3 };
          for (const e3 of o2.allowIn.sort()) s2[e3] = { value: true, title: "Click to see the definition of " + e3 };
          for (const e3 of o2.allowAttributes.sort()) l2[e3] = { value: true };
          l2 = Object(we.b)(l2);
          for (const e3 in l2) {
            const t3 = r2.getAttributeProperties(e3), n3 = {};
            for (const e4 in t3) n3[e4] = { value: t3[e4] };
            l2[e3].subProperties = Object(we.b)(n3);
          }
          return { currentSchemaDefinitionName: n2, type: "SchemaCompiledItemDefinition", urls: { general: Te + "module_engine_model_schema-SchemaCompiledItemDefinition.html", allowAttributes: Te + "module_engine_model_schema-SchemaItemDefinition.html#member-allowAttributes", allowChildren: Te + "module_engine_model_schema-SchemaItemDefinition.html#member-allowChildren", allowIn: Te + "module_engine_model_schema-SchemaItemDefinition.html#member-allowIn" }, properties: Object(we.b)(i2), allowChildren: Object(we.b)(a2), allowIn: Object(we.b)(s2), allowAttributes: l2, definition: o2 };
        }
        function Ne({ editors: e2, currentEditorName: t2 }) {
          if (!e2.get(t2)) return [];
          const n2 = [], r2 = e2.get(t2).model.schema.getDefinitions();
          for (const e3 in r2) n2.push({ name: e3, type: "element", children: [], node: e3, attributes: [], presentation: { isEmpty: true, cssClass: "ck-inspector-tree-node_tagless" } });
          return n2.sort((e3, t3) => e3.name > t3.name ? 1 : -1);
        }
        function Pe(e2, t2 = {}) {
          return { ...t2, currentSchemaDefinitionName: null, currentSchemaDefinition: null, treeDefinition: Ne(e2) };
        }
        var De = n(8);
        function Re(e2, t2) {
          const n2 = function(e3, t3) {
            switch (t3.type) {
              case "SET_EDITORS":
                return function(e4, t4) {
                  const n3 = { editors: new Map(t4.editors) };
                  t4.editors.size ? t4.editors.has(e4.currentEditorName) || (n3.currentEditorName = Object(De.b)(t4.editors)) : n3.currentEditorName = null;
                  return { ...e4, ...n3 };
                }(e3, t3);
              case "SET_CURRENT_EDITOR_NAME":
                return function(e4, t4) {
                  return { ...e4, currentEditorName: t4.editorName };
                }(e3, t3);
              default:
                return e3;
            }
          }(e2, t2);
          return n2.currentEditorGlobals = function(e3, t3, n3) {
            switch (n3.type) {
              case "SET_EDITORS":
              case "SET_CURRENT_EDITOR_NAME":
                return { ...Me(e3, {}) };
              case "UPDATE_CURRENT_EDITOR_IS_READ_ONLY":
                return Me(e3, t3);
              default:
                return t3;
            }
          }(n2, n2.currentEditorGlobals, t2), n2.ui = function(e3, t3) {
            if (!e3.activeTab) {
              let t4;
              return t4 = void 0 !== e3.isCollapsed ? e3.isCollapsed : "true" === ce.get("is-collapsed"), { ...e3, isCollapsed: t4, activeTab: ce.get("active-tab-name") || "Model", height: ce.get("height") || "400px", sidePaneWidth: ce.get("side-pane-width") || "500px" };
            }
            switch (t3.type) {
              case "TOGGLE_IS_COLLAPSED":
                return function(e4) {
                  const t4 = !e4.isCollapsed;
                  return ce.set("is-collapsed", t4), { ...e4, isCollapsed: t4 };
                }(e3);
              case "SET_HEIGHT":
                return function(e4, t4) {
                  return ce.set("height", t4.newHeight), { ...e4, height: t4.newHeight };
                }(e3, t3);
              case "SET_SIDE_PANE_WIDTH":
                return function(e4, t4) {
                  return ce.set("side-pane-width", t4.newWidth), { ...e4, sidePaneWidth: t4.newWidth };
                }(e3, t3);
              case "SET_ACTIVE_INSPECTOR_TAB":
                return function(e4, t4) {
                  return ce.set("active-tab-name", t4.tabName), { ...e4, activeTab: t4.tabName };
                }(e3, t3);
              default:
                return e3;
            }
          }(n2.ui, t2), n2.model = ue(n2, n2.model, t2), n2.view = ye(n2, n2.view, t2), n2.commands = function(e3, t3, n3) {
            if ("Commands" !== e3.ui.activeTab) return t3;
            if (!t3) return xe(e3, t3);
            switch (n3.type) {
              case "SET_COMMANDS_CURRENT_COMMAND_NAME":
                return { ...t3, currentCommandDefinition: _e(e3, n3.currentCommandName), currentCommandName: n3.currentCommandName };
              case "SET_ACTIVE_INSPECTOR_TAB":
              case "UPDATE_COMMANDS_STATE":
                return { ...t3, currentCommandDefinition: _e(e3, t3.currentCommandName), treeDefinition: Ee(e3) };
              case "SET_EDITORS":
              case "SET_CURRENT_EDITOR_NAME":
                return xe(e3, t3);
              default:
                return t3;
            }
          }(n2, n2.commands, t2), n2.schema = function(e3, t3, n3) {
            if ("Schema" !== e3.ui.activeTab) return t3;
            if (!t3) return Pe(e3, t3);
            switch (n3.type) {
              case "SET_SCHEMA_CURRENT_DEFINITION_NAME":
                return { ...t3, currentSchemaDefinition: Oe(e3, n3.currentSchemaDefinitionName), currentSchemaDefinitionName: n3.currentSchemaDefinitionName };
              case "SET_ACTIVE_INSPECTOR_TAB":
                return { ...t3, currentSchemaDefinition: Oe(e3, t3.currentSchemaDefinitionName), treeDefinition: Ne(e3) };
              case "SET_EDITORS":
              case "SET_CURRENT_EDITOR_NAME":
                return Pe(e3, t3);
              default:
                return t3;
            }
          }(n2, n2.schema, t2), { ...e2, ...n2 };
        }
        function Me(e2, t2) {
          const n2 = le(e2);
          return { ...t2, isReadOnly: !!n2 && n2.isReadOnly };
        }
        var je = n(46), Ae = n.n(je), ze = /* @__PURE__ */ function() {
          var e2 = function(t2, n2) {
            return (e2 = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(e3, t3) {
              e3.__proto__ = t3;
            } || function(e3, t3) {
              for (var n3 in t3) t3.hasOwnProperty(n3) && (e3[n3] = t3[n3]);
            })(t2, n2);
          };
          return function(t2, n2) {
            function r2() {
              this.constructor = t2;
            }
            e2(t2, n2), t2.prototype = null === n2 ? Object.create(n2) : (r2.prototype = n2.prototype, new r2());
          };
        }(), Le = function() {
          return (Le = Object.assign || function(e2) {
            for (var t2, n2 = 1, r2 = arguments.length; n2 < r2; n2++) for (var o2 in t2 = arguments[n2]) Object.prototype.hasOwnProperty.call(t2, o2) && (e2[o2] = t2[o2]);
            return e2;
          }).apply(this, arguments);
        }, Ie = { top: { width: "100%", height: "10px", top: "-5px", left: "0px", cursor: "row-resize" }, right: { width: "10px", height: "100%", top: "0px", right: "-5px", cursor: "col-resize" }, bottom: { width: "100%", height: "10px", bottom: "-5px", left: "0px", cursor: "row-resize" }, left: { width: "10px", height: "100%", top: "0px", left: "-5px", cursor: "col-resize" }, topRight: { width: "20px", height: "20px", position: "absolute", right: "-10px", top: "-10px", cursor: "ne-resize" }, bottomRight: { width: "20px", height: "20px", position: "absolute", right: "-10px", bottom: "-10px", cursor: "se-resize" }, bottomLeft: { width: "20px", height: "20px", position: "absolute", left: "-10px", bottom: "-10px", cursor: "sw-resize" }, topLeft: { width: "20px", height: "20px", position: "absolute", left: "-10px", top: "-10px", cursor: "nw-resize" } }, Ue = function(e2) {
          function t2() {
            var t3 = null !== e2 && e2.apply(this, arguments) || this;
            return t3.onMouseDown = function(e3) {
              t3.props.onResizeStart(e3, t3.props.direction);
            }, t3.onTouchStart = function(e3) {
              t3.props.onResizeStart(e3, t3.props.direction);
            }, t3;
          }
          return ze(t2, e2), t2.prototype.render = function() {
            return r.createElement("div", { className: this.props.className || "", style: Le(Le({ position: "absolute", userSelect: "none" }, Ie[this.props.direction]), this.props.replaceStyles || {}), onMouseDown: this.onMouseDown, onTouchStart: this.onTouchStart }, this.props.children);
          }, t2;
        }(r.PureComponent), Fe = n(14), Be = n.n(Fe), We = /* @__PURE__ */ function() {
          var e2 = function(t2, n2) {
            return (e2 = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(e3, t3) {
              e3.__proto__ = t3;
            } || function(e3, t3) {
              for (var n3 in t3) t3.hasOwnProperty(n3) && (e3[n3] = t3[n3]);
            })(t2, n2);
          };
          return function(t2, n2) {
            function r2() {
              this.constructor = t2;
            }
            e2(t2, n2), t2.prototype = null === n2 ? Object.create(n2) : (r2.prototype = n2.prototype, new r2());
          };
        }(), He = function() {
          return (He = Object.assign || function(e2) {
            for (var t2, n2 = 1, r2 = arguments.length; n2 < r2; n2++) for (var o2 in t2 = arguments[n2]) Object.prototype.hasOwnProperty.call(t2, o2) && (e2[o2] = t2[o2]);
            return e2;
          }).apply(this, arguments);
        }, Ve = { width: "auto", height: "auto" }, $e = Be()(function(e2, t2, n2) {
          return Math.max(Math.min(e2, n2), t2);
        }), qe = Be()(function(e2, t2) {
          return Math.round(e2 / t2) * t2;
        }), Ye = Be()(function(e2, t2) {
          return new RegExp(e2, "i").test(t2);
        }), Ke = function(e2) {
          return Boolean(e2.touches && e2.touches.length);
        }, Qe = Be()(function(e2, t2, n2) {
          void 0 === n2 && (n2 = 0);
          var r2 = t2.reduce(function(n3, r3, o3) {
            return Math.abs(r3 - e2) < Math.abs(t2[n3] - e2) ? o3 : n3;
          }, 0), o2 = Math.abs(t2[r2] - e2);
          return 0 === n2 || o2 < n2 ? t2[r2] : e2;
        }), Ge = Be()(function(e2, t2) {
          return e2.substr(e2.length - t2.length, t2.length) === t2;
        }), Xe = Be()(function(e2) {
          return "auto" === (e2 = e2.toString()) || Ge(e2, "px") || Ge(e2, "%") || Ge(e2, "vh") || Ge(e2, "vw") || Ge(e2, "vmax") || Ge(e2, "vmin") ? e2 : e2 + "px";
        }), Je = function(e2, t2, n2, r2) {
          if (e2 && "string" == typeof e2) {
            if (Ge(e2, "px")) return Number(e2.replace("px", ""));
            if (Ge(e2, "%")) return t2 * (Number(e2.replace("%", "")) / 100);
            if (Ge(e2, "vw")) return n2 * (Number(e2.replace("vw", "")) / 100);
            if (Ge(e2, "vh")) return r2 * (Number(e2.replace("vh", "")) / 100);
          }
          return e2;
        }, Ze = Be()(function(e2, t2, n2, r2, o2, i2, a2) {
          return r2 = Je(r2, e2.width, t2, n2), o2 = Je(o2, e2.height, t2, n2), i2 = Je(i2, e2.width, t2, n2), a2 = Je(a2, e2.height, t2, n2), { maxWidth: void 0 === r2 ? void 0 : Number(r2), maxHeight: void 0 === o2 ? void 0 : Number(o2), minWidth: void 0 === i2 ? void 0 : Number(i2), minHeight: void 0 === a2 ? void 0 : Number(a2) };
        }), et = ["as", "style", "className", "grid", "snap", "bounds", "boundsByDirection", "size", "defaultSize", "minWidth", "minHeight", "maxWidth", "maxHeight", "lockAspectRatio", "lockAspectRatioExtraWidth", "lockAspectRatioExtraHeight", "enable", "handleStyles", "handleClasses", "handleWrapperStyle", "handleWrapperClass", "children", "onResizeStart", "onResize", "onResizeStop", "handleComponent", "scale", "resizeRatio", "snapGap"], tt = function(e2) {
          function t2(t3) {
            var n2 = e2.call(this, t3) || this;
            return n2.ratio = 1, n2.resizable = null, n2.parentLeft = 0, n2.parentTop = 0, n2.resizableLeft = 0, n2.resizableRight = 0, n2.resizableTop = 0, n2.resizableBottom = 0, n2.targetLeft = 0, n2.targetTop = 0, n2.appendBase = function() {
              if (!n2.resizable || !n2.window) return null;
              var e3 = n2.parentNode;
              if (!e3) return null;
              var t4 = n2.window.document.createElement("div");
              return t4.style.width = "100%", t4.style.height = "100%", t4.style.position = "absolute", t4.style.transform = "scale(0, 0)", t4.style.left = "0", t4.style.flex = "0", t4.classList ? t4.classList.add("__resizable_base__") : t4.className += "__resizable_base__", e3.appendChild(t4), t4;
            }, n2.removeBase = function(e3) {
              var t4 = n2.parentNode;
              t4 && t4.removeChild(e3);
            }, n2.ref = function(e3) {
              e3 && (n2.resizable = e3);
            }, n2.state = { isResizing: false, width: void 0 === (n2.propsSize && n2.propsSize.width) ? "auto" : n2.propsSize && n2.propsSize.width, height: void 0 === (n2.propsSize && n2.propsSize.height) ? "auto" : n2.propsSize && n2.propsSize.height, direction: "right", original: { x: 0, y: 0, width: 0, height: 0 }, backgroundStyle: { height: "100%", width: "100%", backgroundColor: "rgba(0,0,0,0)", cursor: "auto", opacity: 0, position: "fixed", zIndex: 9999, top: "0", left: "0", bottom: "0", right: "0" }, flexBasis: void 0 }, n2.onResizeStart = n2.onResizeStart.bind(n2), n2.onMouseMove = n2.onMouseMove.bind(n2), n2.onMouseUp = n2.onMouseUp.bind(n2), n2;
          }
          return We(t2, e2), Object.defineProperty(t2.prototype, "parentNode", { get: function() {
            return this.resizable ? this.resizable.parentNode : null;
          }, enumerable: false, configurable: true }), Object.defineProperty(t2.prototype, "window", { get: function() {
            return this.resizable && this.resizable.ownerDocument ? this.resizable.ownerDocument.defaultView : null;
          }, enumerable: false, configurable: true }), Object.defineProperty(t2.prototype, "propsSize", { get: function() {
            return this.props.size || this.props.defaultSize || Ve;
          }, enumerable: false, configurable: true }), Object.defineProperty(t2.prototype, "size", { get: function() {
            var e3 = 0, t3 = 0;
            if (this.resizable && this.window) {
              var n2 = this.resizable.offsetWidth, r2 = this.resizable.offsetHeight, o2 = this.resizable.style.position;
              "relative" !== o2 && (this.resizable.style.position = "relative"), e3 = "auto" !== this.resizable.style.width ? this.resizable.offsetWidth : n2, t3 = "auto" !== this.resizable.style.height ? this.resizable.offsetHeight : r2, this.resizable.style.position = o2;
            }
            return { width: e3, height: t3 };
          }, enumerable: false, configurable: true }), Object.defineProperty(t2.prototype, "sizeStyle", { get: function() {
            var e3 = this, t3 = this.props.size, n2 = function(t4) {
              if (void 0 === e3.state[t4] || "auto" === e3.state[t4]) return "auto";
              if (e3.propsSize && e3.propsSize[t4] && Ge(e3.propsSize[t4].toString(), "%")) {
                if (Ge(e3.state[t4].toString(), "%")) return e3.state[t4].toString();
                var n3 = e3.getParentSize();
                return Number(e3.state[t4].toString().replace("px", "")) / n3[t4] * 100 + "%";
              }
              return Xe(e3.state[t4]);
            };
            return { width: t3 && void 0 !== t3.width && !this.state.isResizing ? Xe(t3.width) : n2("width"), height: t3 && void 0 !== t3.height && !this.state.isResizing ? Xe(t3.height) : n2("height") };
          }, enumerable: false, configurable: true }), t2.prototype.getParentSize = function() {
            if (!this.parentNode) return this.window ? { width: this.window.innerWidth, height: this.window.innerHeight } : { width: 0, height: 0 };
            var e3 = this.appendBase();
            if (!e3) return { width: 0, height: 0 };
            var t3 = false, n2 = this.parentNode.style.flexWrap;
            "wrap" !== n2 && (t3 = true, this.parentNode.style.flexWrap = "wrap"), e3.style.position = "relative", e3.style.minWidth = "100%";
            var r2 = { width: e3.offsetWidth, height: e3.offsetHeight };
            return t3 && (this.parentNode.style.flexWrap = n2), this.removeBase(e3), r2;
          }, t2.prototype.bindEvents = function() {
            this.window && (this.window.addEventListener("mouseup", this.onMouseUp), this.window.addEventListener("mousemove", this.onMouseMove), this.window.addEventListener("mouseleave", this.onMouseUp), this.window.addEventListener("touchmove", this.onMouseMove, { capture: true, passive: false }), this.window.addEventListener("touchend", this.onMouseUp));
          }, t2.prototype.unbindEvents = function() {
            this.window && (this.window.removeEventListener("mouseup", this.onMouseUp), this.window.removeEventListener("mousemove", this.onMouseMove), this.window.removeEventListener("mouseleave", this.onMouseUp), this.window.removeEventListener("touchmove", this.onMouseMove, true), this.window.removeEventListener("touchend", this.onMouseUp));
          }, t2.prototype.componentDidMount = function() {
            if (this.resizable && this.window) {
              var e3 = this.window.getComputedStyle(this.resizable);
              this.setState({ width: this.state.width || this.size.width, height: this.state.height || this.size.height, flexBasis: "auto" !== e3.flexBasis ? e3.flexBasis : void 0 });
            }
          }, t2.prototype.componentWillUnmount = function() {
            this.window && this.unbindEvents();
          }, t2.prototype.createSizeForCssProperty = function(e3, t3) {
            var n2 = this.propsSize && this.propsSize[t3];
            return "auto" !== this.state[t3] || this.state.original[t3] !== e3 || void 0 !== n2 && "auto" !== n2 ? e3 : "auto";
          }, t2.prototype.calculateNewMaxFromBoundary = function(e3, t3) {
            var n2, r2, o2 = this.props.boundsByDirection, i2 = this.state.direction, a2 = o2 && Ye("left", i2), s2 = o2 && Ye("top", i2);
            if ("parent" === this.props.bounds) {
              var l2 = this.parentNode;
              l2 && (n2 = a2 ? this.resizableRight - this.parentLeft : l2.offsetWidth + (this.parentLeft - this.resizableLeft), r2 = s2 ? this.resizableBottom - this.parentTop : l2.offsetHeight + (this.parentTop - this.resizableTop));
            } else "window" === this.props.bounds ? this.window && (n2 = a2 ? this.resizableRight : this.window.innerWidth - this.resizableLeft, r2 = s2 ? this.resizableBottom : this.window.innerHeight - this.resizableTop) : this.props.bounds && (n2 = a2 ? this.resizableRight - this.targetLeft : this.props.bounds.offsetWidth + (this.targetLeft - this.resizableLeft), r2 = s2 ? this.resizableBottom - this.targetTop : this.props.bounds.offsetHeight + (this.targetTop - this.resizableTop));
            return n2 && Number.isFinite(n2) && (e3 = e3 && e3 < n2 ? e3 : n2), r2 && Number.isFinite(r2) && (t3 = t3 && t3 < r2 ? t3 : r2), { maxWidth: e3, maxHeight: t3 };
          }, t2.prototype.calculateNewSizeFromDirection = function(e3, t3) {
            var n2 = this.props.scale || 1, r2 = this.props.resizeRatio || 1, o2 = this.state, i2 = o2.direction, a2 = o2.original, s2 = this.props, l2 = s2.lockAspectRatio, c2 = s2.lockAspectRatioExtraHeight, u2 = s2.lockAspectRatioExtraWidth, p2 = a2.width, f2 = a2.height, d2 = c2 || 0, h2 = u2 || 0;
            return Ye("right", i2) && (p2 = a2.width + (e3 - a2.x) * r2 / n2, l2 && (f2 = (p2 - h2) / this.ratio + d2)), Ye("left", i2) && (p2 = a2.width - (e3 - a2.x) * r2 / n2, l2 && (f2 = (p2 - h2) / this.ratio + d2)), Ye("bottom", i2) && (f2 = a2.height + (t3 - a2.y) * r2 / n2, l2 && (p2 = (f2 - d2) * this.ratio + h2)), Ye("top", i2) && (f2 = a2.height - (t3 - a2.y) * r2 / n2, l2 && (p2 = (f2 - d2) * this.ratio + h2)), { newWidth: p2, newHeight: f2 };
          }, t2.prototype.calculateNewSizeFromAspectRatio = function(e3, t3, n2, r2) {
            var o2 = this.props, i2 = o2.lockAspectRatio, a2 = o2.lockAspectRatioExtraHeight, s2 = o2.lockAspectRatioExtraWidth, l2 = void 0 === r2.width ? 10 : r2.width, c2 = void 0 === n2.width || n2.width < 0 ? e3 : n2.width, u2 = void 0 === r2.height ? 10 : r2.height, p2 = void 0 === n2.height || n2.height < 0 ? t3 : n2.height, f2 = a2 || 0, d2 = s2 || 0;
            if (i2) {
              var h2 = (u2 - f2) * this.ratio + d2, m2 = (p2 - f2) * this.ratio + d2, g2 = (l2 - d2) / this.ratio + f2, y2 = (c2 - d2) / this.ratio + f2, b2 = Math.max(l2, h2), v2 = Math.min(c2, m2), k2 = Math.max(u2, g2), w2 = Math.min(p2, y2);
              e3 = $e(e3, b2, v2), t3 = $e(t3, k2, w2);
            } else e3 = $e(e3, l2, c2), t3 = $e(t3, u2, p2);
            return { newWidth: e3, newHeight: t3 };
          }, t2.prototype.setBoundingClientRect = function() {
            if ("parent" === this.props.bounds) {
              var e3 = this.parentNode;
              if (e3) {
                var t3 = e3.getBoundingClientRect();
                this.parentLeft = t3.left, this.parentTop = t3.top;
              }
            }
            if (this.props.bounds && "string" != typeof this.props.bounds) {
              var n2 = this.props.bounds.getBoundingClientRect();
              this.targetLeft = n2.left, this.targetTop = n2.top;
            }
            if (this.resizable) {
              var r2 = this.resizable.getBoundingClientRect(), o2 = r2.left, i2 = r2.top, a2 = r2.right, s2 = r2.bottom;
              this.resizableLeft = o2, this.resizableRight = a2, this.resizableTop = i2, this.resizableBottom = s2;
            }
          }, t2.prototype.onResizeStart = function(e3, t3) {
            if (this.resizable && this.window) {
              var n2, r2 = 0, o2 = 0;
              if (e3.nativeEvent && function(e4) {
                return Boolean((e4.clientX || 0 === e4.clientX) && (e4.clientY || 0 === e4.clientY));
              }(e3.nativeEvent)) {
                if (r2 = e3.nativeEvent.clientX, o2 = e3.nativeEvent.clientY, 3 === e3.nativeEvent.which) return;
              } else e3.nativeEvent && Ke(e3.nativeEvent) && (r2 = e3.nativeEvent.touches[0].clientX, o2 = e3.nativeEvent.touches[0].clientY);
              if (this.props.onResizeStart) {
                if (this.resizable) {
                  if (false === this.props.onResizeStart(e3, t3, this.resizable)) return;
                }
              }
              this.props.size && (void 0 !== this.props.size.height && this.props.size.height !== this.state.height && this.setState({ height: this.props.size.height }), void 0 !== this.props.size.width && this.props.size.width !== this.state.width && this.setState({ width: this.props.size.width })), this.ratio = "number" == typeof this.props.lockAspectRatio ? this.props.lockAspectRatio : this.size.width / this.size.height;
              var i2 = this.window.getComputedStyle(this.resizable);
              if ("auto" !== i2.flexBasis) {
                var a2 = this.parentNode;
                if (a2) {
                  var s2 = this.window.getComputedStyle(a2).flexDirection;
                  this.flexDir = s2.startsWith("row") ? "row" : "column", n2 = i2.flexBasis;
                }
              }
              this.setBoundingClientRect(), this.bindEvents();
              var l2 = { original: { x: r2, y: o2, width: this.size.width, height: this.size.height }, isResizing: true, backgroundStyle: He(He({}, this.state.backgroundStyle), { cursor: this.window.getComputedStyle(e3.target).cursor || "auto" }), direction: t3, flexBasis: n2 };
              this.setState(l2);
            }
          }, t2.prototype.onMouseMove = function(e3) {
            if (this.state.isResizing && this.resizable && this.window) {
              if (this.window.TouchEvent && Ke(e3)) try {
                e3.preventDefault(), e3.stopPropagation();
              } catch (e4) {
              }
              var t3 = this.props, n2 = t3.maxWidth, r2 = t3.maxHeight, o2 = t3.minWidth, i2 = t3.minHeight, a2 = Ke(e3) ? e3.touches[0].clientX : e3.clientX, s2 = Ke(e3) ? e3.touches[0].clientY : e3.clientY, l2 = this.state, c2 = l2.direction, u2 = l2.original, p2 = l2.width, f2 = l2.height, d2 = this.getParentSize(), h2 = Ze(d2, this.window.innerWidth, this.window.innerHeight, n2, r2, o2, i2);
              n2 = h2.maxWidth, r2 = h2.maxHeight, o2 = h2.minWidth, i2 = h2.minHeight;
              var m2 = this.calculateNewSizeFromDirection(a2, s2), g2 = m2.newHeight, y2 = m2.newWidth, b2 = this.calculateNewMaxFromBoundary(n2, r2), v2 = this.calculateNewSizeFromAspectRatio(y2, g2, { width: b2.maxWidth, height: b2.maxHeight }, { width: o2, height: i2 });
              if (y2 = v2.newWidth, g2 = v2.newHeight, this.props.grid) {
                var k2 = qe(y2, this.props.grid[0]), w2 = qe(g2, this.props.grid[1]), _2 = this.props.snapGap || 0;
                y2 = 0 === _2 || Math.abs(k2 - y2) <= _2 ? k2 : y2, g2 = 0 === _2 || Math.abs(w2 - g2) <= _2 ? w2 : g2;
              }
              this.props.snap && this.props.snap.x && (y2 = Qe(y2, this.props.snap.x, this.props.snapGap)), this.props.snap && this.props.snap.y && (g2 = Qe(g2, this.props.snap.y, this.props.snapGap));
              var E2 = { width: y2 - u2.width, height: g2 - u2.height };
              if (p2 && "string" == typeof p2) {
                if (Ge(p2, "%")) y2 = y2 / d2.width * 100 + "%";
                else if (Ge(p2, "vw")) {
                  y2 = y2 / this.window.innerWidth * 100 + "vw";
                } else if (Ge(p2, "vh")) {
                  y2 = y2 / this.window.innerHeight * 100 + "vh";
                }
              }
              if (f2 && "string" == typeof f2) {
                if (Ge(f2, "%")) g2 = g2 / d2.height * 100 + "%";
                else if (Ge(f2, "vw")) {
                  g2 = g2 / this.window.innerWidth * 100 + "vw";
                } else if (Ge(f2, "vh")) {
                  g2 = g2 / this.window.innerHeight * 100 + "vh";
                }
              }
              var x2 = { width: this.createSizeForCssProperty(y2, "width"), height: this.createSizeForCssProperty(g2, "height") };
              "row" === this.flexDir ? x2.flexBasis = x2.width : "column" === this.flexDir && (x2.flexBasis = x2.height), this.setState(x2), this.props.onResize && this.props.onResize(e3, c2, this.resizable, E2);
            }
          }, t2.prototype.onMouseUp = function(e3) {
            var t3 = this.state, n2 = t3.isResizing, r2 = t3.direction, o2 = t3.original;
            if (n2 && this.resizable) {
              var i2 = { width: this.size.width - o2.width, height: this.size.height - o2.height };
              this.props.onResizeStop && this.props.onResizeStop(e3, r2, this.resizable, i2), this.props.size && this.setState(this.props.size), this.unbindEvents(), this.setState({ isResizing: false, backgroundStyle: He(He({}, this.state.backgroundStyle), { cursor: "auto" }) });
            }
          }, t2.prototype.updateSize = function(e3) {
            this.setState({ width: e3.width, height: e3.height });
          }, t2.prototype.renderResizer = function() {
            var e3 = this, t3 = this.props, n2 = t3.enable, o2 = t3.handleStyles, i2 = t3.handleClasses, a2 = t3.handleWrapperStyle, s2 = t3.handleWrapperClass, l2 = t3.handleComponent;
            if (!n2) return null;
            var c2 = Object.keys(n2).map(function(t4) {
              return false !== n2[t4] ? r.createElement(Ue, { key: t4, direction: t4, onResizeStart: e3.onResizeStart, replaceStyles: o2 && o2[t4], className: i2 && i2[t4] }, l2 && l2[t4] ? l2[t4] : null) : null;
            });
            return r.createElement("div", { className: s2, style: a2 }, c2);
          }, t2.prototype.render = function() {
            var e3 = this, t3 = Object.keys(this.props).reduce(function(t4, n3) {
              return -1 !== et.indexOf(n3) || (t4[n3] = e3.props[n3]), t4;
            }, {}), n2 = He(He(He({ position: "relative", userSelect: this.state.isResizing ? "none" : "auto" }, this.props.style), this.sizeStyle), { maxWidth: this.props.maxWidth, maxHeight: this.props.maxHeight, minWidth: this.props.minWidth, minHeight: this.props.minHeight, boxSizing: "border-box", flexShrink: 0 });
            this.state.flexBasis && (n2.flexBasis = this.state.flexBasis);
            var o2 = this.props.as || "div";
            return r.createElement(o2, He({ ref: this.ref, style: n2, className: this.props.className }, t3), this.state.isResizing && r.createElement("div", { style: this.state.backgroundStyle }), this.props.children, this.renderResizer());
          }, t2.defaultProps = { as: "div", onResizeStart: function() {
          }, onResize: function() {
          }, onResizeStop: function() {
          }, enable: { top: true, right: true, bottom: true, left: true, topRight: true, bottomRight: true, bottomLeft: true, topLeft: true }, style: {}, grid: [1, 1], lockAspectRatio: false, lockAspectRatioExtraWidth: 0, lockAspectRatioExtraHeight: 0, scale: 1, resizeRatio: 1, snapGap: 0 }, t2;
        }(r.PureComponent), nt = function(e2, t2) {
          return (nt = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(e3, t3) {
            e3.__proto__ = t3;
          } || function(e3, t3) {
            for (var n2 in t3) t3.hasOwnProperty(n2) && (e3[n2] = t3[n2]);
          })(e2, t2);
        };
        var rt = function() {
          return (rt = Object.assign || function(e2) {
            for (var t2, n2 = 1, r2 = arguments.length; n2 < r2; n2++) for (var o2 in t2 = arguments[n2]) Object.prototype.hasOwnProperty.call(t2, o2) && (e2[o2] = t2[o2]);
            return e2;
          }).apply(this, arguments);
        };
        var ot = Ae.a, it = { width: "auto", height: "auto", display: "inline-block", position: "absolute", top: 0, left: 0 }, at = function(e2) {
          function t2(t3) {
            var n2 = e2.call(this, t3) || this;
            return n2.resizing = false, n2.resizingPosition = { x: 0, y: 0 }, n2.offsetFromParent = { left: 0, top: 0 }, n2.resizableElement = { current: null }, n2.refDraggable = function(e3) {
              e3 && (n2.draggable = e3);
            }, n2.refResizable = function(e3) {
              e3 && (n2.resizable = e3, n2.resizableElement.current = e3.resizable);
            }, n2.state = { original: { x: 0, y: 0 }, bounds: { top: 0, right: 0, bottom: 0, left: 0 }, maxWidth: t3.maxWidth, maxHeight: t3.maxHeight }, n2.onResizeStart = n2.onResizeStart.bind(n2), n2.onResize = n2.onResize.bind(n2), n2.onResizeStop = n2.onResizeStop.bind(n2), n2.onDragStart = n2.onDragStart.bind(n2), n2.onDrag = n2.onDrag.bind(n2), n2.onDragStop = n2.onDragStop.bind(n2), n2.getMaxSizesFromProps = n2.getMaxSizesFromProps.bind(n2), n2;
          }
          return function(e3, t3) {
            function n2() {
              this.constructor = e3;
            }
            nt(e3, t3), e3.prototype = null === t3 ? Object.create(t3) : (n2.prototype = t3.prototype, new n2());
          }(t2, e2), t2.prototype.componentDidMount = function() {
            this.updateOffsetFromParent();
            var e3 = this.offsetFromParent, t3 = e3.left, n2 = e3.top, r2 = this.getDraggablePosition(), o2 = r2.x, i2 = r2.y;
            this.draggable.setState({ x: o2 - t3, y: i2 - n2 }), this.forceUpdate();
          }, t2.prototype.getDraggablePosition = function() {
            var e3 = this.draggable.state;
            return { x: e3.x, y: e3.y };
          }, t2.prototype.getParent = function() {
            return this.resizable && this.resizable.parentNode;
          }, t2.prototype.getParentSize = function() {
            return this.resizable.getParentSize();
          }, t2.prototype.getMaxSizesFromProps = function() {
            return { maxWidth: void 0 === this.props.maxWidth ? Number.MAX_SAFE_INTEGER : this.props.maxWidth, maxHeight: void 0 === this.props.maxHeight ? Number.MAX_SAFE_INTEGER : this.props.maxHeight };
          }, t2.prototype.getSelfElement = function() {
            return this.resizable && this.resizable.resizable;
          }, t2.prototype.getOffsetHeight = function(e3) {
            var t3 = this.props.scale;
            switch (this.props.bounds) {
              case "window":
                return window.innerHeight / t3;
              case "body":
                return document.body.offsetHeight / t3;
              default:
                return e3.offsetHeight;
            }
          }, t2.prototype.getOffsetWidth = function(e3) {
            var t3 = this.props.scale;
            switch (this.props.bounds) {
              case "window":
                return window.innerWidth / t3;
              case "body":
                return document.body.offsetWidth / t3;
              default:
                return e3.offsetWidth;
            }
          }, t2.prototype.onDragStart = function(e3, t3) {
            if (this.props.onDragStart && this.props.onDragStart(e3, t3), this.props.bounds) {
              var n2, r2 = this.getParent(), o2 = this.props.scale;
              if ("parent" === this.props.bounds) n2 = r2;
              else {
                if ("body" === this.props.bounds) {
                  var i2 = r2.getBoundingClientRect(), a2 = i2.left, s2 = i2.top, l2 = document.body.getBoundingClientRect(), c2 = -(a2 - r2.offsetLeft * o2 - l2.left) / o2, u2 = -(s2 - r2.offsetTop * o2 - l2.top) / o2, p2 = (document.body.offsetWidth - this.resizable.size.width * o2) / o2 + c2, f2 = (document.body.offsetHeight - this.resizable.size.height * o2) / o2 + u2;
                  return this.setState({ bounds: { top: u2, right: p2, bottom: f2, left: c2 } });
                }
                if ("window" === this.props.bounds) {
                  if (!this.resizable) return;
                  var d2 = r2.getBoundingClientRect(), h2 = d2.left, m2 = d2.top, g2 = -(h2 - r2.offsetLeft * o2) / o2, y2 = -(m2 - r2.offsetTop * o2) / o2;
                  p2 = (window.innerWidth - this.resizable.size.width * o2) / o2 + g2, f2 = (window.innerHeight - this.resizable.size.height * o2) / o2 + y2;
                  return this.setState({ bounds: { top: y2, right: p2, bottom: f2, left: g2 } });
                }
                n2 = document.querySelector(this.props.bounds);
              }
              if (n2 instanceof HTMLElement && r2 instanceof HTMLElement) {
                var b2 = n2.getBoundingClientRect(), v2 = b2.left, k2 = b2.top, w2 = r2.getBoundingClientRect(), _2 = (v2 - w2.left) / o2, E2 = k2 - w2.top;
                if (this.resizable) {
                  this.updateOffsetFromParent();
                  var x2 = this.offsetFromParent;
                  this.setState({ bounds: { top: E2 - x2.top, right: _2 + (n2.offsetWidth - this.resizable.size.width) - x2.left / o2, bottom: E2 + (n2.offsetHeight - this.resizable.size.height) - x2.top, left: _2 - x2.left / o2 } });
                }
              }
            }
          }, t2.prototype.onDrag = function(e3, t3) {
            if (this.props.onDrag) {
              var n2 = this.offsetFromParent;
              return this.props.onDrag(e3, rt(rt({}, t3), { x: t3.x - n2.left, y: t3.y - n2.top }));
            }
          }, t2.prototype.onDragStop = function(e3, t3) {
            if (this.props.onDragStop) {
              var n2 = this.offsetFromParent, r2 = n2.left, o2 = n2.top;
              return this.props.onDragStop(e3, rt(rt({}, t3), { x: t3.x + r2, y: t3.y + o2 }));
            }
          }, t2.prototype.onResizeStart = function(e3, t3, n2) {
            e3.stopPropagation(), this.resizing = true;
            var r2 = this.props.scale, o2 = this.offsetFromParent, i2 = this.getDraggablePosition();
            if (this.resizingPosition = { x: i2.x + o2.left, y: i2.y + o2.top }, this.setState({ original: i2 }), this.props.bounds) {
              var a2 = this.getParent(), s2 = void 0;
              s2 = "parent" === this.props.bounds ? a2 : "body" === this.props.bounds ? document.body : "window" === this.props.bounds ? window : document.querySelector(this.props.bounds);
              var l2 = this.getSelfElement();
              if (l2 instanceof Element && (s2 instanceof HTMLElement || s2 === window) && a2 instanceof HTMLElement) {
                var c2 = this.getMaxSizesFromProps(), u2 = c2.maxWidth, p2 = c2.maxHeight, f2 = this.getParentSize();
                if (u2 && "string" == typeof u2) if (u2.endsWith("%")) {
                  var d2 = Number(u2.replace("%", "")) / 100;
                  u2 = f2.width * d2;
                } else u2.endsWith("px") && (u2 = Number(u2.replace("px", "")));
                if (p2 && "string" == typeof p2) if (p2.endsWith("%")) {
                  d2 = Number(p2.replace("%", "")) / 100;
                  p2 = f2.width * d2;
                } else p2.endsWith("px") && (p2 = Number(p2.replace("px", "")));
                var h2 = l2.getBoundingClientRect(), m2 = h2.left, g2 = h2.top, y2 = "window" === this.props.bounds ? { left: 0, top: 0 } : s2.getBoundingClientRect(), b2 = y2.left, v2 = y2.top, k2 = this.getOffsetWidth(s2), w2 = this.getOffsetHeight(s2), _2 = t3.toLowerCase().endsWith("left"), E2 = t3.toLowerCase().endsWith("right"), x2 = t3.startsWith("top"), S2 = t3.startsWith("bottom");
                if (_2 && this.resizable) {
                  var C2 = (m2 - b2) / r2 + this.resizable.size.width;
                  this.setState({ maxWidth: C2 > Number(u2) ? u2 : C2 });
                }
                if (E2 || this.props.lockAspectRatio && !_2) {
                  C2 = k2 + (b2 - m2) / r2;
                  this.setState({ maxWidth: C2 > Number(u2) ? u2 : C2 });
                }
                if (x2 && this.resizable) {
                  C2 = (g2 - v2) / r2 + this.resizable.size.height;
                  this.setState({ maxHeight: C2 > Number(p2) ? p2 : C2 });
                }
                if (S2 || this.props.lockAspectRatio && !x2) {
                  C2 = w2 + (v2 - g2) / r2;
                  this.setState({ maxHeight: C2 > Number(p2) ? p2 : C2 });
                }
              }
            } else this.setState({ maxWidth: this.props.maxWidth, maxHeight: this.props.maxHeight });
            this.props.onResizeStart && this.props.onResizeStart(e3, t3, n2);
          }, t2.prototype.onResize = function(e3, t3, n2, r2) {
            var o2 = { x: this.state.original.x, y: this.state.original.y }, i2 = -r2.width, a2 = -r2.height;
            -1 !== ["top", "left", "topLeft", "bottomLeft", "topRight"].indexOf(t3) && ("bottomLeft" === t3 ? o2.x += i2 : ("topRight" === t3 || (o2.x += i2), o2.y += a2)), o2.x === this.draggable.state.x && o2.y === this.draggable.state.y || this.draggable.setState(o2), this.updateOffsetFromParent();
            var s2 = this.offsetFromParent, l2 = this.getDraggablePosition().x + s2.left, c2 = this.getDraggablePosition().y + s2.top;
            this.resizingPosition = { x: l2, y: c2 }, this.props.onResize && this.props.onResize(e3, t3, n2, r2, { x: l2, y: c2 });
          }, t2.prototype.onResizeStop = function(e3, t3, n2, r2) {
            this.resizing = false;
            var o2 = this.getMaxSizesFromProps(), i2 = o2.maxWidth, a2 = o2.maxHeight;
            this.setState({ maxWidth: i2, maxHeight: a2 }), this.props.onResizeStop && this.props.onResizeStop(e3, t3, n2, r2, this.resizingPosition);
          }, t2.prototype.updateSize = function(e3) {
            this.resizable && this.resizable.updateSize({ width: e3.width, height: e3.height });
          }, t2.prototype.updatePosition = function(e3) {
            this.draggable.setState(e3);
          }, t2.prototype.updateOffsetFromParent = function() {
            var e3 = this.props.scale, t3 = this.getParent(), n2 = this.getSelfElement();
            if (!t3 || null === n2) return { top: 0, left: 0 };
            var r2 = t3.getBoundingClientRect(), o2 = r2.left, i2 = r2.top, a2 = n2.getBoundingClientRect(), s2 = this.getDraggablePosition();
            this.offsetFromParent = { left: a2.left - o2 - s2.x * e3, top: a2.top - i2 - s2.y * e3 };
          }, t2.prototype.render = function() {
            var e3 = this.props, t3 = e3.disableDragging, n2 = e3.style, o2 = e3.dragHandleClassName, i2 = e3.position, a2 = e3.onMouseDown, s2 = e3.onMouseUp, l2 = e3.dragAxis, c2 = e3.dragGrid, u2 = e3.bounds, p2 = e3.enableUserSelectHack, f2 = e3.cancel, d2 = e3.children, h2 = (e3.onResizeStart, e3.onResize, e3.onResizeStop, e3.onDragStart, e3.onDrag, e3.onDragStop, e3.resizeHandleStyles), m2 = e3.resizeHandleClasses, g2 = e3.resizeHandleComponent, y2 = e3.enableResizing, b2 = e3.resizeGrid, v2 = e3.resizeHandleWrapperClass, k2 = e3.resizeHandleWrapperStyle, w2 = e3.scale, _2 = e3.allowAnyClick, E2 = function(e4, t4) {
              var n3 = {};
              for (var r2 in e4) Object.prototype.hasOwnProperty.call(e4, r2) && t4.indexOf(r2) < 0 && (n3[r2] = e4[r2]);
              if (null != e4 && "function" == typeof Object.getOwnPropertySymbols) {
                var o3 = 0;
                for (r2 = Object.getOwnPropertySymbols(e4); o3 < r2.length; o3++) t4.indexOf(r2[o3]) < 0 && Object.prototype.propertyIsEnumerable.call(e4, r2[o3]) && (n3[r2[o3]] = e4[r2[o3]]);
              }
              return n3;
            }(e3, ["disableDragging", "style", "dragHandleClassName", "position", "onMouseDown", "onMouseUp", "dragAxis", "dragGrid", "bounds", "enableUserSelectHack", "cancel", "children", "onResizeStart", "onResize", "onResizeStop", "onDragStart", "onDrag", "onDragStop", "resizeHandleStyles", "resizeHandleClasses", "resizeHandleComponent", "enableResizing", "resizeGrid", "resizeHandleWrapperClass", "resizeHandleWrapperStyle", "scale", "allowAnyClick"]), x2 = this.props.default ? rt({}, this.props.default) : void 0;
            delete E2.default;
            var S2, C2 = t3 || o2 ? { cursor: "auto" } : { cursor: "move" }, T2 = rt(rt(rt({}, it), C2), n2), O2 = this.offsetFromParent, N2 = O2.left, P2 = O2.top;
            i2 && (S2 = { x: i2.x - N2, y: i2.y - P2 });
            var D2, R2 = this.resizing ? void 0 : S2, M2 = this.resizing ? "both" : l2;
            return Object(r.createElement)(ot, { ref: this.refDraggable, handle: o2 ? "." + o2 : void 0, defaultPosition: x2, onMouseDown: a2, onMouseUp: s2, onStart: this.onDragStart, onDrag: this.onDrag, onStop: this.onDragStop, axis: M2, disabled: t3, grid: c2, bounds: u2 ? this.state.bounds : void 0, position: R2, enableUserSelectHack: p2, cancel: f2, scale: w2, allowAnyClick: _2, nodeRef: this.resizableElement }, Object(r.createElement)(tt, rt({}, E2, { ref: this.refResizable, defaultSize: x2, size: this.props.size, enable: "boolean" == typeof y2 ? (D2 = y2, { bottom: D2, bottomLeft: D2, bottomRight: D2, left: D2, right: D2, top: D2, topLeft: D2, topRight: D2 }) : y2, onResizeStart: this.onResizeStart, onResize: this.onResize, onResizeStop: this.onResizeStop, style: T2, minWidth: this.props.minWidth, minHeight: this.props.minHeight, maxWidth: this.resizing ? this.state.maxWidth : this.props.maxWidth, maxHeight: this.resizing ? this.state.maxHeight : this.props.maxHeight, grid: b2, handleWrapperClass: v2, handleWrapperStyle: k2, lockAspectRatio: this.props.lockAspectRatio, lockAspectRatioExtraWidth: this.props.lockAspectRatioExtraWidth, lockAspectRatioExtraHeight: this.props.lockAspectRatioExtraHeight, handleStyles: h2, handleClasses: m2, handleComponent: g2, scale: this.props.scale }), d2));
          }, t2.defaultProps = { maxWidth: Number.MAX_SAFE_INTEGER, maxHeight: Number.MAX_SAFE_INTEGER, scale: 1, onResizeStart: function() {
          }, onResize: function() {
          }, onResizeStop: function() {
          }, onDragStart: function() {
          }, onDrag: function() {
          }, onDragStop: function() {
          } }, t2;
        }(r.PureComponent);
        n(58);
        class st extends r.Component {
          constructor(e2) {
            super(e2), this.handleTabClick = this.handleTabClick.bind(this);
          }
          handleTabClick(e2) {
            this.setState({ activeTab: e2 }, () => {
              this.props.onClick(e2);
            });
          }
          render() {
            return o.a.createElement("div", { className: "ck-inspector-horizontal-nav" }, this.props.definitions.map((e2) => o.a.createElement(lt, { key: e2, label: e2, isActive: this.props.activeTab === e2, onClick: () => this.handleTabClick(e2) })));
          }
        }
        class lt extends r.Component {
          render() {
            return o.a.createElement("button", { className: ["ck-inspector-horizontal-nav__item", this.props.isActive ? " ck-inspector-horizontal-nav__item_active" : ""].join(" "), key: this.props.label, onClick: this.props.onClick, type: "button" }, this.props.label);
          }
        }
        n(60);
        class ct extends r.Component {
          render() {
            const e2 = Array.isArray(this.props.children) ? this.props.children : [this.props.children];
            return o.a.createElement("div", { className: "ck-inspector-navbox" }, e2.length > 1 ? o.a.createElement("div", { className: "ck-inspector-navbox__navigation" }, e2[0]) : "", o.a.createElement("div", { className: "ck-inspector-navbox__content" }, e2[e2.length - 1]));
          }
        }
        class ut extends r.Component {
          constructor(e2) {
            super(e2), this.handleTabClick = this.handleTabClick.bind(this);
          }
          handleTabClick(e2) {
            this.props.onTabChange(e2);
          }
          render() {
            const e2 = Array.isArray(this.props.children) ? this.props.children : [this.props.children];
            return o.a.createElement(ct, null, [this.props.contentBefore, o.a.createElement(st, { key: "navigation", definitions: e2.map((e3) => e3.props.label), activeTab: this.props.activeTab, onClick: this.handleTabClick }), this.props.contentAfter], e2.filter((e3) => e3.props.label === this.props.activeTab));
          }
        }
        var pt = n(5), ft = n.n(pt);
        class dt extends r.Component {
          render() {
            return [o.a.createElement("label", { htmlFor: this.props.id, key: "label" }, this.props.label, ":"), o.a.createElement("select", { id: this.props.id, value: this.props.value, onChange: this.props.onChange, key: "select" }, this.props.options.map((e2) => o.a.createElement("option", { value: e2, key: e2 }, e2)))];
          }
          shouldComponentUpdate(e2) {
            return !ft()(this.props, e2);
          }
        }
        n(62);
        class ht extends r.PureComponent {
          render() {
            const e2 = ["ck-inspector-button", this.props.className || "", this.props.isOn ? "ck-inspector-button_on" : "", false === this.props.isEnabled ? "ck-inspector-button_disabled" : ""].filter((e3) => e3).join(" ");
            return o.a.createElement("button", { className: e2, type: "button", onClick: false === this.props.isEnabled ? () => {
            } : this.props.onClick, title: this.props.title || this.props.text }, o.a.createElement("span", null, this.props.text), this.props.icon);
          }
        }
        n(64);
        class mt extends r.Component {
          render() {
            return o.a.createElement("div", { className: ["ck-inspector-pane", this.props.splitVertically ? "ck-inspector-pane_vsplit" : "", this.props.isEmpty ? "ck-inspector-pane_empty" : ""].join(" ") }, this.props.children);
          }
        }
        n(66);
        const gt = { position: "relative" };
        class yt extends r.Component {
          get maxSidePaneWidth() {
            return Math.min(window.innerWidth - 400, 0.8 * window.innerWidth);
          }
          render() {
            return o.a.createElement("div", { className: "ck-inspector-side-pane" }, o.a.createElement(at, { enableResizing: { left: true }, disableDragging: true, minWidth: 200, maxWidth: this.maxSidePaneWidth, style: gt, position: { x: "100%", y: "100%" }, size: { width: this.props.sidePaneWidth, height: "100%" }, onResizeStop: (e2, t2, n2) => this.props.setSidePaneWidth(n2.style.width) }, this.props.children));
          }
        }
        var bt = J(({ ui: { sidePaneWidth: e2 } }) => ({ sidePaneWidth: e2 }), { setSidePaneWidth: function(e2) {
          return { type: "SET_SIDE_PANE_WIDTH", newWidth: e2 };
        } })(yt), vt = n(11);
        n(68);
        class kt extends r.PureComponent {
          render() {
            return [o.a.createElement("input", { type: "checkbox", className: "ck-inspector-checkbox", id: this.props.id, key: "input", checked: this.props.isChecked, onChange: this.props.onChange }), o.a.createElement("label", { htmlFor: this.props.id, key: "label" }, this.props.label)];
          }
        }
        class wt extends r.Component {
          constructor(e2) {
            super(e2), this.handleTreeClick = this.handleTreeClick.bind(this), this.handleRootChange = this.handleRootChange.bind(this);
          }
          handleTreeClick(e2, t2) {
            e2.persist(), e2.stopPropagation(), this.props.setModelCurrentNode(t2), 2 === e2.detail && this.props.setModelActiveTab("Inspect");
          }
          handleRootChange(e2) {
            this.props.setModelCurrentRootName(e2.target.value);
          }
          render() {
            const e2 = this.props.editors.get(this.props.currentEditorName);
            return o.a.createElement(ct, null, [o.a.createElement("div", { className: "ck-inspector-tree__config", key: "root-cfg" }, o.a.createElement(dt, { id: "view-root-select", label: "Root", value: this.props.currentRootName, options: Object(ie.d)(e2).map((e3) => e3.rootName), onChange: this.handleRootChange })), o.a.createElement("span", { className: "ck-inspector-separator", key: "separator" }), o.a.createElement("div", { className: "ck-inspector-tree__config", key: "text-cfg" }, o.a.createElement(kt, { label: "Compact text", id: "model-compact-text", isChecked: this.props.showCompactText, onChange: this.props.toggleModelShowCompactText }), o.a.createElement(kt, { label: "Show markers", id: "model-show-markers", isChecked: this.props.showMarkers, onChange: this.props.toggleModelShowMarkers }))], o.a.createElement(vt.a, { className: [this.props.showMarkers ? "" : "ck-inspector-model-tree__hide-markers"], definition: this.props.treeDefinition, textDirection: e2.locale.contentLanguageDirection, onClick: this.handleTreeClick, showCompactText: this.props.showCompactText, activeNode: this.props.currentNode }));
          }
        }
        var _t = J(({ editors: e2, currentEditorName: t2, model: { treeDefinition: n2, currentRootName: r2, currentNode: o2, ui: { showMarkers: i2, showCompactText: a2 } } }) => ({ treeDefinition: n2, editors: e2, currentEditorName: t2, currentRootName: r2, currentNode: o2, showMarkers: i2, showCompactText: a2 }), { toggleModelShowCompactText: function() {
          return { type: "TOGGLE_MODEL_SHOW_COMPACT_TEXT" };
        }, setModelCurrentRootName: function(e2) {
          return { type: "SET_MODEL_CURRENT_ROOT_NAME", currentRootName: e2 };
        }, toggleModelShowMarkers: function() {
          return { type: "TOGGLE_MODEL_SHOW_MARKERS" };
        }, setModelCurrentNode: function(e2) {
          return { type: "SET_MODEL_CURRENT_NODE", currentNode: e2 };
        }, setModelActiveTab: ee })(wt);
        n(70);
        class Et extends r.Component {
          render() {
            const e2 = this.props.presentation && this.props.presentation.expandCollapsibles, t2 = [];
            for (const n2 in this.props.itemDefinitions) {
              const r2 = this.props.itemDefinitions[n2], { subProperties: i2, presentation: a2 = {} } = r2, s2 = i2 && Object.keys(i2).length, l2 = Object(we.c)(String(r2.value), 2e3), c2 = [o.a.createElement(xt, { key: `${this.props.name}-${n2}-name`, name: n2, listUid: this.props.name, canCollapse: s2, colorBox: a2.colorBox, expandCollapsibles: e2, onClick: this.props.onPropertyTitleClick, title: r2.title }), o.a.createElement("dd", { key: `${this.props.name}-${n2}-value` }, o.a.createElement("input", { id: `${this.props.name}-${n2}-value-input`, type: "text", value: l2, readOnly: true }))];
              s2 && c2.push(o.a.createElement(Et, { name: `${this.props.name}-${n2}`, key: `${this.props.name}-${n2}`, itemDefinitions: i2, presentation: this.props.presentation })), t2.push(c2);
            }
            return o.a.createElement("dl", { className: "ck-inspector-property-list ck-inspector-code" }, t2);
          }
          shouldComponentUpdate(e2) {
            return !ft()(this.props, e2);
          }
        }
        class xt extends r.PureComponent {
          constructor(e2) {
            super(e2), this.state = { isCollapsed: !this.props.expandCollapsibles }, this.handleCollapsedChange = this.handleCollapsedChange.bind(this);
          }
          handleCollapsedChange() {
            this.setState({ isCollapsed: !this.state.isCollapsed });
          }
          render() {
            const e2 = ["ck-inspector-property-list__title"];
            let t2, n2;
            return this.props.canCollapse && (e2.push("ck-inspector-property-list__title_collapsible"), e2.push("ck-inspector-property-list__title_" + (this.state.isCollapsed ? "collapsed" : "expanded")), t2 = o.a.createElement("button", { type: "button", onClick: this.handleCollapsedChange }, "Toggle")), this.props.colorBox && (n2 = o.a.createElement("span", { className: "ck-inspector-property-list__title__color-box", style: { background: this.props.colorBox } })), this.props.onClick && e2.push("ck-inspector-property-list__title_clickable"), o.a.createElement("dt", { className: e2.join(" ").trim() }, t2, n2, o.a.createElement("label", { htmlFor: `${this.props.listUid}-${this.props.name}-value-input`, onClick: this.props.onClick ? () => this.props.onClick(this.props.name) : null, title: this.props.title }, this.props.name), ":");
          }
        }
        n(72);
        function St() {
          return (St = Object.assign ? Object.assign.bind() : function(e2) {
            for (var t2 = 1; t2 < arguments.length; t2++) {
              var n2 = arguments[t2];
              for (var r2 in n2) Object.prototype.hasOwnProperty.call(n2, r2) && (e2[r2] = n2[r2]);
            }
            return e2;
          }).apply(this, arguments);
        }
        class Ct extends r.PureComponent {
          render() {
            const e2 = [];
            for (const t2 of this.props.lists) Object.keys(t2.itemDefinitions).length && e2.push(o.a.createElement("hr", { key: t2.name + "-separator" }), o.a.createElement("h3", { key: t2.name + "-header" }, o.a.createElement("a", { href: t2.url, target: "_blank", rel: "noopener noreferrer" }, t2.name), t2.buttons && t2.buttons.map((e3, t3) => o.a.createElement(ht, St({ key: "button" + t3 }, e3)))), o.a.createElement(Et, { key: t2.name + "-list", name: t2.name, itemDefinitions: t2.itemDefinitions, presentation: t2.presentation, onPropertyTitleClick: t2.onPropertyTitleClick }));
            return o.a.createElement("div", { className: "ck-inspector__object-inspector" }, o.a.createElement("h2", { className: "ck-inspector-code" }, this.props.header), e2);
          }
        }
        var Tt = n(3);
        function Ot() {
          return (Ot = Object.assign ? Object.assign.bind() : function(e2) {
            for (var t2 = 1; t2 < arguments.length; t2++) {
              var n2 = arguments[t2];
              for (var r2 in n2) Object.prototype.hasOwnProperty.call(n2, r2) && (e2[r2] = n2[r2]);
            }
            return e2;
          }).apply(this, arguments);
        }
        var Nt = ({ styles: e2 = {}, ...t2 }) => o.a.createElement("svg", Ot({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, t2), o.a.createElement("path", { d: "M17 15.75a.75.75 0 01.102 1.493L17 17.25H9a.75.75 0 01-.102-1.493L9 15.75h8zM2.156 2.947l.095.058 7.58 5.401a.75.75 0 01.084 1.152l-.083.069-7.58 5.425a.75.75 0 01-.958-1.148l.086-.071 6.724-4.815-6.723-4.792a.75.75 0 01-.233-.95l.057-.096a.75.75 0 01.951-.233z" }));
        function Pt() {
          return (Pt = Object.assign ? Object.assign.bind() : function(e2) {
            for (var t2 = 1; t2 < arguments.length; t2++) {
              var n2 = arguments[t2];
              for (var r2 in n2) Object.prototype.hasOwnProperty.call(n2, r2) && (e2[r2] = n2[r2]);
            }
            return e2;
          }).apply(this, arguments);
        }
        var Dt = ({ styles: e2 = {}, ...t2 }) => o.a.createElement("svg", Pt({ fill: "none", xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 19 19" }, t2), o.a.createElement("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M6 1a1 1 0 011-1h5a1 1 0 011 1v5a1 1 0 01-1 1h-2v2h5a1 1 0 011 1v3h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3a1 1 0 011-1h1v-2.5a.5.5 0 00-.5-.5H10v3h1a1 1 0 011 1v3a1 1 0 01-1 1H8a1 1 0 01-1-1v-3a1 1 0 011-1h1v-3H4.5a.5.5 0 00-.5.5V13h1a1 1 0 011 1v3a1 1 0 01-1 1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1v-3a1 1 0 011-1h5V7H7a1 1 0 01-1-1V1zm1.5 4.5v-4h4v4h-4zm-5 11v-2h2v2h-2zm6-2v2h2v-2h-2zm6 2v-2h2v2h-2z", fill: "#000" }));
        class Rt extends r.Component {
          constructor(e2) {
            super(e2), this.handleNodeLogButtonClick = this.handleNodeLogButtonClick.bind(this), this.handleNodeSchemaButtonClick = this.handleNodeSchemaButtonClick.bind(this);
          }
          handleNodeLogButtonClick() {
            Tt.a.log(this.props.currentNodeDefinition.editorNode);
          }
          handleNodeSchemaButtonClick() {
            const e2 = this.props.editors.get(this.props.currentEditorName).model.schema.getDefinition(this.props.currentNodeDefinition.editorNode);
            this.props.setActiveTab("Schema"), this.props.setSchemaCurrentDefinitionName(e2.name);
          }
          render() {
            const e2 = this.props.currentNodeDefinition;
            return e2 ? o.a.createElement(Ct, { header: [o.a.createElement("span", { key: "link" }, o.a.createElement("a", { href: e2.url, target: "_blank", rel: "noopener noreferrer" }, o.a.createElement("b", null, e2.type)), ":", "Text" === e2.type ? o.a.createElement("em", null, e2.name) : e2.name), o.a.createElement(ht, { key: "log", icon: o.a.createElement(Nt, null), text: "Log in console", onClick: this.handleNodeLogButtonClick }), o.a.createElement(ht, { key: "schema", icon: o.a.createElement(Dt, null), text: "Show in schema", onClick: this.handleNodeSchemaButtonClick })], lists: [{ name: "Attributes", url: e2.url, itemDefinitions: e2.attributes }, { name: "Properties", url: e2.url, itemDefinitions: e2.properties }] }) : o.a.createElement(mt, { isEmpty: "true" }, o.a.createElement("p", null, "Select a node in the tree to inspect"));
          }
        }
        var Mt = J(({ editors: e2, currentEditorName: t2, model: { currentNodeDefinition: n2 } }) => ({ editors: e2, currentEditorName: t2, currentNodeDefinition: n2 }), { setActiveTab: oe, setSchemaCurrentDefinitionName: Se })(Rt);
        function jt() {
          return (jt = Object.assign ? Object.assign.bind() : function(e2) {
            for (var t2 = 1; t2 < arguments.length; t2++) {
              var n2 = arguments[t2];
              for (var r2 in n2) Object.prototype.hasOwnProperty.call(n2, r2) && (e2[r2] = n2[r2]);
            }
            return e2;
          }).apply(this, arguments);
        }
        var At = ({ styles: e2 = {}, ...t2 }) => o.a.createElement("svg", jt({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, t2), o.a.createElement("path", { d: "M9.5 4.5c1.85 0 3.667.561 5.199 1.519C16.363 7.059 17.5 8.4 17.5 9.5s-1.137 2.441-2.801 3.481c-1.532.958-3.35 1.519-5.199 1.519-1.85 0-3.667-.561-5.199-1.519C2.637 11.941 1.5 10.6 1.5 9.5s1.137-2.441 2.801-3.481C5.833 5.06 7.651 4.5 9.5 4.5zm0 1a4 4 0 11-.2.005l.2-.005c-1.655 0-3.29.505-4.669 1.367C3.431 7.742 2.5 8.84 2.5 9.5c0 .66.931 1.758 2.331 2.633C6.21 12.995 7.845 13.5 9.5 13.5c1.655 0 3.29-.505 4.669-1.367 1.4-.875 2.331-1.974 2.331-2.633 0-.66-.931-1.758-2.331-2.633C12.79 6.005 11.155 5.5 9.5 5.5zM8 6.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" }));
        const zt = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_selection-Selection.html";
        class Lt extends r.Component {
          constructor(e2) {
            super(e2), this.handleSelectionLogButtonClick = this.handleSelectionLogButtonClick.bind(this), this.handleScrollToSelectionButtonClick = this.handleScrollToSelectionButtonClick.bind(this);
          }
          handleSelectionLogButtonClick() {
            const e2 = this.props.editor;
            Tt.a.log(e2.model.document.selection);
          }
          handleScrollToSelectionButtonClick() {
            const e2 = document.querySelector(".ck-inspector-tree__position.ck-inspector-tree__position_selection");
            e2 && e2.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          render() {
            const e2 = this.props.editor, t2 = this.props.info;
            return o.a.createElement(Ct, { header: [o.a.createElement("span", { key: "link" }, o.a.createElement("a", { href: zt, target: "_blank", rel: "noopener noreferrer" }, o.a.createElement("b", null, "Selection"))), o.a.createElement(ht, { key: "log", icon: o.a.createElement(Nt, null), text: "Log in console", onClick: this.handleSelectionLogButtonClick }), o.a.createElement(ht, { key: "scroll", icon: o.a.createElement(At, null), text: "Scroll to selection", onClick: this.handleScrollToSelectionButtonClick })], lists: [{ name: "Attributes", url: zt + "#function-getAttributes", itemDefinitions: t2.attributes }, { name: "Properties", url: "" + zt, itemDefinitions: t2.properties }, { name: "Anchor", url: zt + "#member-anchor", buttons: [{ icon: o.a.createElement(Nt, null), text: "Log in console", onClick: () => Tt.a.log(e2.model.document.selection.anchor) }], itemDefinitions: t2.anchor }, { name: "Focus", url: zt + "#member-focus", buttons: [{ icon: o.a.createElement(Nt, null), text: "Log in console", onClick: () => Tt.a.log(e2.model.document.selection.focus) }], itemDefinitions: t2.focus }, { name: "Ranges", url: zt + "#function-getRanges", buttons: [{ icon: o.a.createElement(Nt, null), text: "Log in console", onClick: () => Tt.a.log(...e2.model.document.selection.getRanges()) }], itemDefinitions: t2.ranges, presentation: { expandCollapsibles: true } }] });
          }
        }
        var It = J(({ editors: e2, currentEditorName: t2, model: { ranges: n2 } }) => {
          const r2 = e2.get(t2);
          return { editor: r2, currentEditorName: t2, info: function(e3, t3) {
            const n3 = e3.model.document.selection, r3 = n3.anchor, o2 = n3.focus, i2 = { properties: { isCollapsed: { value: n3.isCollapsed }, isBackward: { value: n3.isBackward }, isGravityOverridden: { value: n3.isGravityOverridden }, rangeCount: { value: n3.rangeCount } }, attributes: {}, anchor: Ut(Object(ae.a)(r3)), focus: Ut(Object(ae.a)(o2)), ranges: {} };
            for (const [e4, t4] of n3.getAttributes()) i2.attributes[e4] = { value: t4 };
            t3.forEach((e4, t4) => {
              i2.ranges[t4] = { value: "", subProperties: { start: { value: "", subProperties: Object(we.b)(Ut(e4.start)) }, end: { value: "", subProperties: Object(we.b)(Ut(e4.end)) } } };
            });
            for (const e4 in i2) "ranges" !== e4 && (i2[e4] = Object(we.b)(i2[e4]));
            return i2;
          }(r2, n2) };
        }, {})(Lt);
        function Ut({ path: e2, stickiness: t2, index: n2, isAtEnd: r2, isAtStart: o2, offset: i2, textNode: a2 }) {
          return { path: { value: e2 }, stickiness: { value: t2 }, index: { value: n2 }, isAtEnd: { value: r2 }, isAtStart: { value: o2 }, offset: { value: i2 }, textNode: { value: a2 } };
        }
        class Ft extends r.Component {
          render() {
            const e2 = function(e3) {
              const t3 = {};
              for (const n3 of e3) {
                const e4 = n3.name.split(":");
                let r2 = t3;
                for (const t4 of e4) {
                  const o2 = t4 === e4[e4.length - 1];
                  r2 = r2[t4] ? r2[t4] : r2[t4] = o2 ? n3 : {};
                }
              }
              return t3;
            }(this.props.markers), t2 = function e3(t3) {
              const n3 = {};
              for (const r2 in t3) {
                const o2 = t3[r2];
                if (!!o2.name) {
                  const e4 = Object(we.b)(Wt(o2));
                  n3[r2] = { value: "", presentation: { colorBox: o2.presentation.color }, subProperties: e4 };
                } else {
                  const t4 = Object.keys(o2).length;
                  n3[r2] = { value: t4 + " marker" + (t4 > 1 ? "s" : ""), subProperties: e3(o2) };
                }
              }
              return n3;
            }(e2), n2 = this.props.editors.get(this.props.currentEditorName);
            return Object.keys(e2).length ? o.a.createElement(Ct, { header: [o.a.createElement("span", { key: "link" }, o.a.createElement("a", { href: "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_markercollection-Marker.html", target: "_blank", rel: "noopener noreferrer" }, o.a.createElement("b", null, "Markers"))), o.a.createElement(ht, { key: "log", icon: o.a.createElement(Nt, null), text: "Log in console", onClick: () => Tt.a.log([...n2.model.markers]) })], lists: [{ name: "Markers tree", itemDefinitions: t2, presentation: { expandCollapsibles: true } }] }) : o.a.createElement(mt, { isEmpty: "true" }, o.a.createElement("p", null, "No markers in the document."));
          }
        }
        var Bt = J(({ editors: e2, currentEditorName: t2, model: { markers: n2 } }) => ({ editors: e2, currentEditorName: t2, markers: n2 }), {})(Ft);
        function Wt({ name: e2, start: t2, end: n2, affectsData: r2, managedUsingOperations: o2 }) {
          return { name: { value: e2 }, start: { value: t2.path }, end: { value: n2.path }, affectsData: { value: r2 }, managedUsingOperations: { value: o2 } };
        }
        n(74);
        class Ht extends r.Component {
          render() {
            return this.props.currentEditorName ? o.a.createElement(mt, { splitVertically: "true" }, o.a.createElement(_t, null), o.a.createElement(bt, null, o.a.createElement(ut, { onTabChange: this.props.setModelActiveTab, activeTab: this.props.activeTab }, o.a.createElement(Mt, { label: "Inspect" }), o.a.createElement(It, { label: "Selection" }), o.a.createElement(Bt, { label: "Markers" })))) : o.a.createElement(mt, { isEmpty: "true" }, o.a.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
          }
        }
        var Vt = J(({ currentEditorName: e2, model: { ui: { activeTab: t2 } } }) => ({ currentEditorName: e2, activeTab: t2 }), { setModelActiveTab: ee })(Ht);
        class $t extends r.Component {
          constructor(e2) {
            super(e2), this.handleTreeClick = this.handleTreeClick.bind(this), this.handleRootChange = this.handleRootChange.bind(this);
          }
          handleTreeClick(e2, t2) {
            e2.persist(), e2.stopPropagation(), this.props.setViewCurrentNode(t2), 2 === e2.detail && this.props.setViewActiveTab("Inspect");
          }
          handleRootChange(e2) {
            this.props.setViewCurrentRootName(e2.target.value);
          }
          render() {
            const e2 = this.props.editors.get(this.props.currentEditorName);
            return o.a.createElement(ct, null, [o.a.createElement("div", { className: "ck-inspector-tree__config", key: "root-cfg" }, o.a.createElement(dt, { id: "view-root-select", label: "Root", value: this.props.currentRootName, options: Object(me.d)(e2).map((e3) => e3.rootName), onChange: this.handleRootChange })), o.a.createElement("span", { className: "ck-inspector-separator", key: "separator" }), o.a.createElement("div", { className: "ck-inspector-tree__config", key: "types-cfg" }, o.a.createElement(kt, { label: "Show element types", id: "view-show-types", isChecked: this.props.showElementTypes, onChange: this.props.toggleViewShowElementTypes }))], o.a.createElement(vt.a, { definition: this.props.treeDefinition, textDirection: e2.locale.contentLanguageDirection, onClick: this.handleTreeClick, showCompactText: "true", showElementTypes: this.props.showElementTypes, activeNode: this.props.currentNode }));
          }
        }
        var qt = J(({ editors: e2, currentEditorName: t2, view: { treeDefinition: n2, currentRootName: r2, currentNode: o2, ui: { showElementTypes: i2 } } }) => ({ treeDefinition: n2, editors: e2, currentEditorName: t2, currentRootName: r2, currentNode: o2, showElementTypes: i2 }), { setViewCurrentRootName: function(e2) {
          return { type: "SET_VIEW_CURRENT_ROOT_NAME", currentRootName: e2 };
        }, toggleViewShowElementTypes: function() {
          return { type: "TOGGLE_VIEW_SHOW_ELEMENT_TYPES" };
        }, setViewCurrentNode: function(e2) {
          return { type: "SET_VIEW_CURRENT_NODE", currentNode: e2 };
        }, setViewActiveTab: de })($t);
        class Yt extends r.Component {
          constructor(e2) {
            super(e2), this.handleNodeLogButtonClick = this.handleNodeLogButtonClick.bind(this);
          }
          handleNodeLogButtonClick() {
            Tt.a.log(this.props.currentNodeDefinition.editorNode);
          }
          render() {
            const e2 = this.props.currentNodeDefinition;
            return e2 ? o.a.createElement(Ct, { header: [o.a.createElement("span", { key: "link" }, o.a.createElement("a", { href: e2.url, target: "_blank", rel: "noopener noreferrer" }, o.a.createElement("b", null, e2.type), ":"), "Text" === e2.type ? o.a.createElement("em", null, e2.name) : e2.name), o.a.createElement(ht, { key: "log", icon: o.a.createElement(Nt, null), text: "Log in console", onClick: this.handleNodeLogButtonClick })], lists: [{ name: "Attributes", url: e2.url, itemDefinitions: e2.attributes }, { name: "Properties", url: e2.url, itemDefinitions: e2.properties }, { name: "Custom Properties", url: me.a + "_element-Element.html#function-getCustomProperty", itemDefinitions: e2.customProperties }] }) : o.a.createElement(mt, { isEmpty: "true" }, o.a.createElement("p", null, "Select a node in the tree to inspect"));
          }
        }
        var Kt = J(({ view: { currentNodeDefinition: e2 } }) => ({ currentNodeDefinition: e2 }), {})(Yt);
        const Qt = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_view_selection-Selection.html";
        class Gt extends r.Component {
          constructor(e2) {
            super(e2), this.handleSelectionLogButtonClick = this.handleSelectionLogButtonClick.bind(this), this.handleScrollToSelectionButtonClick = this.handleScrollToSelectionButtonClick.bind(this);
          }
          handleSelectionLogButtonClick() {
            const e2 = this.props.editor;
            Tt.a.log(e2.editing.view.document.selection);
          }
          handleScrollToSelectionButtonClick() {
            const e2 = document.querySelector(".ck-inspector-tree__position.ck-inspector-tree__position_selection");
            e2 && e2.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          render() {
            const e2 = this.props.editor, t2 = this.props.info;
            return o.a.createElement(Ct, { header: [o.a.createElement("span", { key: "link" }, o.a.createElement("a", { href: Qt, target: "_blank", rel: "noopener noreferrer" }, o.a.createElement("b", null, "Selection"))), o.a.createElement(ht, { key: "log", icon: o.a.createElement(Nt, null), text: "Log in console", onClick: this.handleSelectionLogButtonClick }), o.a.createElement(ht, { key: "scroll", icon: o.a.createElement(At, null), text: "Scroll to selection", onClick: this.handleScrollToSelectionButtonClick })], lists: [{ name: "Properties", url: "" + Qt, itemDefinitions: t2.properties }, { name: "Anchor", url: Qt + "#member-anchor", buttons: [{ type: "log", text: "Log in console", onClick: () => Tt.a.log(e2.editing.view.document.selection.anchor) }], itemDefinitions: t2.anchor }, { name: "Focus", url: Qt + "#member-focus", buttons: [{ type: "log", text: "Log in console", onClick: () => Tt.a.log(e2.editing.view.document.selection.focus) }], itemDefinitions: t2.focus }, { name: "Ranges", url: Qt + "#function-getRanges", buttons: [{ type: "log", text: "Log in console", onClick: () => Tt.a.log(...e2.editing.view.document.selection.getRanges()) }], itemDefinitions: t2.ranges, presentation: { expandCollapsibles: true } }] });
          }
        }
        var Xt = J(({ editors: e2, currentEditorName: t2, view: { ranges: n2 } }) => {
          const r2 = e2.get(t2);
          return { editor: r2, currentEditorName: t2, info: function(e3, t3) {
            const n3 = e3.editing.view.document.selection, r3 = { properties: { isCollapsed: { value: n3.isCollapsed }, isBackward: { value: n3.isBackward }, isFake: { value: n3.isFake }, rangeCount: { value: n3.rangeCount } }, anchor: Jt(Object(ge.a)(n3.anchor)), focus: Jt(Object(ge.a)(n3.focus)), ranges: {} };
            t3.forEach((e4, t4) => {
              r3.ranges[t4] = { value: "", subProperties: { start: { value: "", subProperties: Object(we.b)(Jt(e4.start)) }, end: { value: "", subProperties: Object(we.b)(Jt(e4.end)) } } };
            });
            for (const e4 in r3) "ranges" !== e4 && (r3[e4] = Object(we.b)(r3[e4]));
            return r3;
          }(r2, n2) };
        }, {})(Gt);
        function Jt({ offset: e2, isAtEnd: t2, isAtStart: n2, parent: r2 }) {
          return { offset: { value: e2 }, isAtEnd: { value: t2 }, isAtStart: { value: n2 }, parent: { value: r2 } };
        }
        class Zt extends r.Component {
          render() {
            return this.props.currentEditorName ? o.a.createElement(mt, { splitVertically: "true" }, o.a.createElement(qt, null), o.a.createElement(bt, null, o.a.createElement(ut, { onTabChange: this.props.setViewActiveTab, activeTab: this.props.activeTab }, o.a.createElement(Kt, { label: "Inspect" }), o.a.createElement(Xt, { label: "Selection" })))) : o.a.createElement(mt, { isEmpty: "true" }, o.a.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
          }
        }
        var en = J(({ currentEditorName: e2, view: { ui: { activeTab: t2 } } }) => ({ currentEditorName: e2, activeTab: t2 }), { setViewActiveTab: de, updateViewState: he })(Zt);
        class tn extends r.Component {
          constructor(e2) {
            super(e2), this.handleTreeClick = this.handleTreeClick.bind(this);
          }
          handleTreeClick(e2, t2) {
            e2.persist(), e2.stopPropagation(), this.props.setCommandsCurrentCommandName(t2);
          }
          render() {
            return o.a.createElement(ct, null, o.a.createElement(vt.a, { definition: this.props.treeDefinition, onClick: this.handleTreeClick, activeNode: this.props.currentCommandName }));
          }
        }
        var nn = J(({ commands: { treeDefinition: e2, currentCommandName: t2 } }) => ({ treeDefinition: e2, currentCommandName: t2 }), { setCommandsCurrentCommandName: function(e2) {
          return { type: "SET_COMMANDS_CURRENT_COMMAND_NAME", currentCommandName: e2 };
        } })(tn);
        function rn() {
          return (rn = Object.assign ? Object.assign.bind() : function(e2) {
            for (var t2 = 1; t2 < arguments.length; t2++) {
              var n2 = arguments[t2];
              for (var r2 in n2) Object.prototype.hasOwnProperty.call(n2, r2) && (e2[r2] = n2[r2]);
            }
            return e2;
          }).apply(this, arguments);
        }
        var on = ({ styles: e2 = {}, ...t2 }) => o.a.createElement("svg", rn({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, t2), o.a.createElement("path", { d: "M9.25 1.25a8 8 0 110 16 8 8 0 010-16zm0 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM7.344 6.485l4.98 2.765-4.98 3.018V6.485z" }));
        class an extends r.Component {
          constructor(e2) {
            super(e2), this.handleCommandLogButtonClick = this.handleCommandLogButtonClick.bind(this), this.handleCommandExecuteButtonClick = this.handleCommandExecuteButtonClick.bind(this);
          }
          handleCommandLogButtonClick() {
            Tt.a.log(this.props.currentCommandDefinition.command);
          }
          handleCommandExecuteButtonClick() {
            this.props.editors.get(this.props.currentEditorName).execute(this.props.currentCommandName);
          }
          render() {
            const e2 = this.props.currentCommandDefinition;
            return e2 ? o.a.createElement(Ct, { header: [o.a.createElement("span", { key: "link" }, o.a.createElement("a", { href: e2.url, target: "_blank", rel: "noopener noreferrer" }, o.a.createElement("b", null, e2.type)), ":", this.props.currentCommandName), o.a.createElement(ht, { key: "exec", icon: o.a.createElement(on, null), text: "Execute command", onClick: this.handleCommandExecuteButtonClick }), o.a.createElement(ht, { key: "log", icon: o.a.createElement(Nt, null), text: "Log in console", onClick: this.handleCommandLogButtonClick })], lists: [{ name: "Properties", url: e2.url, itemDefinitions: e2.properties }] }) : o.a.createElement(mt, { isEmpty: "true" }, o.a.createElement("p", null, "Select a command to inspect"));
          }
        }
        var sn = J(({ editors: e2, currentEditorName: t2, commands: { currentCommandName: n2, currentCommandDefinition: r2 } }) => ({ editors: e2, currentEditorName: t2, currentCommandName: n2, currentCommandDefinition: r2 }), {})(an);
        class ln extends r.Component {
          render() {
            return this.props.currentEditorName ? o.a.createElement(mt, { splitVertically: "true" }, o.a.createElement(nn, null), o.a.createElement(bt, null, o.a.createElement(ut, { activeTab: "Inspect" }, o.a.createElement(sn, { label: "Inspect" })))) : o.a.createElement(mt, { isEmpty: "true" }, o.a.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
          }
        }
        var cn = J(({ currentEditorName: e2 }) => ({ currentEditorName: e2 }), { updateCommandsState: ke })(ln);
        class un extends r.Component {
          constructor(e2) {
            super(e2), this.handleTreeClick = this.handleTreeClick.bind(this);
          }
          handleTreeClick(e2, t2) {
            e2.persist(), e2.stopPropagation(), this.props.setSchemaCurrentDefinitionName(t2);
          }
          render() {
            return o.a.createElement(ct, null, o.a.createElement(vt.a, { definition: this.props.treeDefinition, onClick: this.handleTreeClick, activeNode: this.props.currentSchemaDefinitionName }));
          }
        }
        var pn = J(({ schema: { treeDefinition: e2, currentSchemaDefinitionName: t2 } }) => ({ treeDefinition: e2, currentSchemaDefinitionName: t2 }), { setSchemaCurrentDefinitionName: Se })(un);
        class fn extends r.Component {
          render() {
            const e2 = this.props.currentSchemaDefinition;
            return e2 ? o.a.createElement(Ct, { header: [o.a.createElement("span", { key: "link" }, o.a.createElement("a", { href: e2.urls.general, target: "_blank", rel: "noopener noreferrer" }, o.a.createElement("b", null, e2.type)), ":", this.props.currentSchemaDefinitionName)], lists: [{ name: "Properties", url: e2.urls.general, itemDefinitions: e2.properties }, { name: "Allowed attributes", url: e2.urls.allowAttributes, itemDefinitions: e2.allowAttributes }, { name: "Allowed children", url: e2.urls.allowChildren, itemDefinitions: e2.allowChildren, onPropertyTitleClick: (e3) => {
              this.props.setSchemaCurrentDefinitionName(e3);
            } }, { name: "Allowed in", url: e2.urls.allowIn, itemDefinitions: e2.allowIn, onPropertyTitleClick: (e3) => {
              this.props.setSchemaCurrentDefinitionName(e3);
            } }] }) : o.a.createElement(mt, { isEmpty: "true" }, o.a.createElement("p", null, "Select a schema definition to inspect"));
          }
        }
        var dn = J(({ editors: e2, currentEditorName: t2, schema: { currentSchemaDefinitionName: n2, currentSchemaDefinition: r2 } }) => ({ editors: e2, currentEditorName: t2, currentSchemaDefinitionName: n2, currentSchemaDefinition: r2 }), { setSchemaCurrentDefinitionName: Se })(fn);
        class hn extends r.Component {
          render() {
            return this.props.currentEditorName ? o.a.createElement(mt, { splitVertically: "true" }, o.a.createElement(pn, null), o.a.createElement(bt, null, o.a.createElement(ut, { activeTab: "Inspect" }, o.a.createElement(dn, { label: "Inspect" })))) : o.a.createElement(mt, { isEmpty: "true" }, o.a.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
          }
        }
        var mn = J(({ currentEditorName: e2 }) => ({ currentEditorName: e2 }))(hn), gn = n(47), yn = n.n(gn), bn = n(48), vn = n.n(bn);
        function kn() {
          return (kn = Object.assign ? Object.assign.bind() : function(e2) {
            for (var t2 = 1; t2 < arguments.length; t2++) {
              var n2 = arguments[t2];
              for (var r2 in n2) Object.prototype.hasOwnProperty.call(n2, r2) && (e2[r2] = n2[r2]);
            }
            return e2;
          }).apply(this, arguments);
        }
        var wn = ({ styles: e2 = {}, ...t2 }) => o.a.createElement("svg", kn({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, t2), o.a.createElement("path", { d: "M12.936 0l5 4.5v12.502l-1.504-.001v.003h1.504v1.499h-5v-1.501l3.496-.001V5.208L12.21 1.516 3.436 1.5v15.504l3.5-.001v1.5h-5V0h11z" }), o.a.createElement("path", { d: "M10.374 9.463l.085.072.477.464L11 10v.06l3.545 3.453-1.047 1.075L11 12.155V19H9v-6.9l-2.424 2.476-1.072-1.05L9.4 9.547a.75.75 0 01.974-.084zM12.799 1.5l-.001 2.774h3.645v1.5h-5.144V1.5z" }));
        n(86);
        class _n extends r.Component {
          constructor(e2) {
            super(e2), this.state = { isModalOpen: false, editorDataValue: "" }, this.textarea = o.a.createRef();
          }
          render() {
            return [o.a.createElement(ht, { text: "Set editor data", icon: o.a.createElement(wn, null), isEnabled: !!this.props.editor, onClick: () => this.setState({ isModalOpen: true }), key: "button" }), o.a.createElement(vn.a, { isOpen: this.state.isModalOpen, appElement: document.querySelector(".ck-inspector-wrapper"), onAfterOpen: this._handleModalAfterOpen.bind(this), overlayClassName: "ck-inspector-modal ck-inspector-quick-actions__set-data-modal", className: "ck-inspector-quick-actions__set-data-modal__content", onRequestClose: this._closeModal.bind(this), portalClassName: "ck-inspector-portal", shouldCloseOnEsc: true, shouldCloseOnOverlayClick: true, key: "modal" }, o.a.createElement("h2", null, "Set editor data"), o.a.createElement("textarea", { autoFocus: true, ref: this.textarea, value: this.state.editorDataValue, placeholder: "Paste HTML here...", onChange: this._handlDataChange.bind(this), onKeyPress: (e2) => {
              "Enter" == e2.key && e2.shiftKey && this._setEditorDataAndCloseModal();
            } }), o.a.createElement("div", { className: "ck-inspector-quick-actions__set-data-modal__buttons" }, o.a.createElement("button", { type: "button", onClick: () => {
              this.setState({ editorDataValue: this.props.editor.getData() }), this.textarea.current.focus();
            } }, "Load data"), o.a.createElement("button", { type: "button", title: "Cancel (Esc)", onClick: this._closeModal.bind(this) }, "Cancel"), o.a.createElement("button", { type: "button", title: "Set editor data (⇧+Enter)", onClick: this._setEditorDataAndCloseModal.bind(this) }, "Set data")))];
          }
          _setEditorDataAndCloseModal() {
            this.props.editor.setData(this.state.editorDataValue), this._closeModal();
          }
          _closeModal() {
            this.setState({ isModalOpen: false });
          }
          _handlDataChange(e2) {
            this.setState({ editorDataValue: e2.target.value });
          }
          _handleModalAfterOpen() {
            this.setState({ editorDataValue: this.props.editor.getData() }), this.textarea.current.select();
          }
        }
        function En() {
          return (En = Object.assign ? Object.assign.bind() : function(e2) {
            for (var t2 = 1; t2 < arguments.length; t2++) {
              var n2 = arguments[t2];
              for (var r2 in n2) Object.prototype.hasOwnProperty.call(n2, r2) && (e2[r2] = n2[r2]);
            }
            return e2;
          }).apply(this, arguments);
        }
        var xn = ({ styles: e2 = {}, ...t2 }) => o.a.createElement("svg", En({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, t2), o.a.createElement("path", { d: "M12.936 0l5 4.5v14.003h-4.503L14.936 17h-10l1.503 1.503H1.936V0h11zm-9.5 1.5v15.504h12.996V5.208L12.21 1.516 3.436 1.5z" }), o.a.createElement("path", { d: "M12.799 1.5l-.001 2.774h3.645v1.5h-5.144V1.5zM9.675 18.859l-.085-.072-4.086-3.978 1.047-1.075L9 16.119V9h2v7.273l2.473-2.526 1.072 1.049-3.896 3.979a.75.75 0 01-.974.084z" }));
        function Sn() {
          return (Sn = Object.assign ? Object.assign.bind() : function(e2) {
            for (var t2 = 1; t2 < arguments.length; t2++) {
              var n2 = arguments[t2];
              for (var r2 in n2) Object.prototype.hasOwnProperty.call(n2, r2) && (e2[r2] = n2[r2]);
            }
            return e2;
          }).apply(this, arguments);
        }
        var Cn = ({ styles: e2 = {}, ...t2 }) => o.a.createElement("svg", Sn({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, t2), o.a.createElement("path", { d: "M3.144 15.748l2.002 1.402-1.976.516-.026-1.918zM2.438 3.391l15.346 11.023-.875 1.218-5.202-3.736-2.877 4.286.006.005-3.055.797-2.646-1.852-.04-2.95-.006-.005.006-.008v-.025l.01.008L6.02 7.81l-4.457-3.2.876-1.22zM7.25 8.695l-2.13 3.198 3.277 2.294 2.104-3.158-3.25-2.334zM14.002 0l2.16 1.512-.856 1.222c.828.967 1.144 2.141.432 3.158l-2.416 3.599-1.214-.873 2.396-3.593.005.003c.317-.452-.16-1.332-1.064-1.966-.891-.624-1.865-.776-2.197-.349l-.006-.004-2.384 3.575-1.224-.879 2.376-3.539c.674-.932 1.706-1.155 3.096-.668l.046.018.85-1.216z" }));
        function Tn() {
          return (Tn = Object.assign ? Object.assign.bind() : function(e2) {
            for (var t2 = 1; t2 < arguments.length; t2++) {
              var n2 = arguments[t2];
              for (var r2 in n2) Object.prototype.hasOwnProperty.call(n2, r2) && (e2[r2] = n2[r2]);
            }
            return e2;
          }).apply(this, arguments);
        }
        var On = ({ styles: e2 = {}, ...t2 }) => o.a.createElement("svg", Tn({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, t2), o.a.createElement("path", { d: "M11.28 1a1 1 0 01.948.684l.333 1 .018.066H16a.75.75 0 01.102 1.493L16 4.25h-.5V16a2 2 0 01-2 2h-8a2 2 0 01-2-2V4.25H3a.75.75 0 01-.102-1.493L3 2.75h3.42a1 1 0 01.019-.066l.333-1A1 1 0 017.721 1h3.558zM14 4.5H5V16a.5.5 0 00.41.492l.09.008h8a.5.5 0 00.492-.41L14 16V4.5zM7.527 6.06v8.951h-1V6.06h1zm5 0v8.951h-1V6.06h1zM10 6.06v8.951H9V6.06h1z" }));
        function Nn() {
          return (Nn = Object.assign ? Object.assign.bind() : function(e2) {
            for (var t2 = 1; t2 < arguments.length; t2++) {
              var n2 = arguments[t2];
              for (var r2 in n2) Object.prototype.hasOwnProperty.call(n2, r2) && (e2[r2] = n2[r2]);
            }
            return e2;
          }).apply(this, arguments);
        }
        var Pn = ({ styles: e2 = {}, ...t2 }) => o.a.createElement("svg", Nn({ viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg" }, t2), o.a.createElement("path", { d: "M2.284 2.498c-.239.266-.184.617-.184 1.002V4H2a.5.5 0 00-.492.41L1.5 4.5V17a1 1 0 00.883.993L2.5 18h10a1 1 0 00.97-.752l-.081-.062c.438.368.976.54 1.507.526a2.5 2.5 0 01-2.232 1.783l-.164.005h-10a2.5 2.5 0 01-2.495-2.336L0 17V4.5a2 2 0 011.85-1.995L2 2.5l.284-.002zm10.532 0L13 2.5a2 2 0 011.995 1.85L15 4.5v2.28a2.243 2.243 0 00-1.5.404V4.5a.5.5 0 00-.41-.492L13 4v-.5l-.007-.144c-.031-.329.032-.626-.177-.858z" }), o.a.createElement("path", { d: "M6 .49l-.144.006a1.75 1.75 0 00-1.41.94l-.029.058.083-.004c-.69 0-1.25.56-1.25 1.25v1c0 .69.56 1.25 1.25 1.25h6c.69 0 1.25-.56 1.25-1.25v-1l-.006-.128a1.25 1.25 0 00-1.116-1.116l-.046-.002-.027-.058A1.75 1.75 0 009 .49H6zm0 1.5h3a.25.25 0 01.25.25l.007.102A.75.75 0 0010 2.99h.25v.5h-5.5v-.5H5a.75.75 0 00.743-.648l.007-.102A.25.25 0 016 1.99zm9.374 6.55a.75.75 0 01-.093 1.056l-2.33 1.954h6.127a.75.75 0 010 1.501h-5.949l2.19 1.837a.75.75 0 11-.966 1.15l-3.788-3.18a.747.747 0 01-.21-.285.75.75 0 01.17-.945l3.792-3.182a.75.75 0 011.057.093z" }));
        function Dn() {
          return (Dn = Object.assign ? Object.assign.bind() : function(e2) {
            for (var t2 = 1; t2 < arguments.length; t2++) {
              var n2 = arguments[t2];
              for (var r2 in n2) Object.prototype.hasOwnProperty.call(n2, r2) && (e2[r2] = n2[r2]);
            }
            return e2;
          }).apply(this, arguments);
        }
        var Rn = ({ styles: e2 = {}, ...t2 }) => o.a.createElement("svg", Dn({ viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg" }, t2), o.a.createElement("path", { fill: "#4fa800", d: "M6.972 16.615a.997.997 0 01-.744-.292l-4.596-4.596a1 1 0 111.414-1.414l3.926 3.926 9.937-9.937a1 1 0 011.414 1.415L7.717 16.323a.997.997 0 01-.745.292z" }));
        n(88);
        class Mn extends r.Component {
          constructor(e2) {
            super(e2), this.state = { isShiftKeyPressed: false, wasEditorDataJustCopied: false }, this._keyDownHandler = this._handleKeyDown.bind(this), this._keyUpHandler = this._handleKeyUp.bind(this), this._readOnlyHandler = this._handleReadOnly.bind(this), this._editorDataJustCopiedTimeout = null;
          }
          render() {
            return o.a.createElement("div", { className: "ck-inspector-editor-quick-actions" }, o.a.createElement(ht, { text: "Log editor", icon: o.a.createElement(Nt, null), isEnabled: !!this.props.editor, onClick: () => console.log(this.props.editor) }), this._getLogButton(), o.a.createElement(_n, { editor: this.props.editor }), o.a.createElement(ht, { text: "Toggle read only", icon: o.a.createElement(Cn, null), isOn: this.props.isReadOnly, isEnabled: !!this.props.editor, onClick: this._readOnlyHandler }), o.a.createElement(ht, { text: "Destroy editor", icon: o.a.createElement(On, null), isEnabled: !!this.props.editor, onClick: () => {
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
            let e2, t2;
            return this.state.wasEditorDataJustCopied ? (e2 = o.a.createElement(Rn, null), t2 = "Data copied to clipboard.") : (e2 = this.state.isShiftKeyPressed ? o.a.createElement(Pn, null) : o.a.createElement(xn, null), t2 = "Log editor data (press with Shift to copy)"), o.a.createElement(ht, { text: t2, icon: e2, className: this.state.wasEditorDataJustCopied ? "ck-inspector-button_data-copied" : "", isEnabled: !!this.props.editor, onClick: this._handleLogEditorDataClick.bind(this) });
          }
          _handleLogEditorDataClick({ shiftKey: e2 }) {
            e2 ? (yn()(this.props.editor.getData()), this.setState({ wasEditorDataJustCopied: true }), clearTimeout(this._editorDataJustCopiedTimeout), this._editorDataJustCopiedTimeout = setTimeout(() => {
              this.setState({ wasEditorDataJustCopied: false });
            }, 3e3)) : console.log(this.props.editor.getData());
          }
          _handleKeyDown({ key: e2 }) {
            this.setState({ isShiftKeyPressed: "Shift" === e2 });
          }
          _handleKeyUp() {
            this.setState({ isShiftKeyPressed: false });
          }
          _handleReadOnly() {
            this.props.editor.isReadOnly ? this.props.editor.disableReadOnlyMode("Lock from Inspector (@ckeditor/ckeditor5-inspector)") : this.props.editor.enableReadOnlyMode("Lock from Inspector (@ckeditor/ckeditor5-inspector)");
          }
        }
        var jn = J(({ editors: e2, currentEditorName: t2, currentEditorGlobals: { isReadOnly: n2 } }) => ({ editor: e2.get(t2), isReadOnly: n2 }), {})(Mn);
        function An() {
          return (An = Object.assign ? Object.assign.bind() : function(e2) {
            for (var t2 = 1; t2 < arguments.length; t2++) {
              var n2 = arguments[t2];
              for (var r2 in n2) Object.prototype.hasOwnProperty.call(n2, r2) && (e2[r2] = n2[r2]);
            }
            return e2;
          }).apply(this, arguments);
        }
        var zn = ({ styles: e2 = {}, ...t2 }) => o.a.createElement("svg", An({ viewBox: "0 0 19 19", xmlns: "http://www.w3.org/2000/svg" }, t2), o.a.createElement("path", { d: "M17.03 6.47a.75.75 0 01.073.976l-.072.084-6.984 7a.75.75 0 01-.977.073l-.084-.072-7.016-7a.75.75 0 01.976-1.134l.084.072 6.485 6.47 6.454-6.469a.75.75 0 01.977-.073l.084.072z" }));
        n(37);
        const Ln = { position: "fixed", bottom: "0", left: "0", right: "0", top: "auto" };
        class In extends r.Component {
          constructor(e2) {
            super(e2), $n(this.props.height), document.body.style.setProperty("--ck-inspector-collapsed-height", "30px"), this.handleInspectorResize = this.handleInspectorResize.bind(this);
          }
          handleInspectorResize(e2, t2, n2) {
            const r2 = n2.style.height;
            this.props.setHeight(r2), $n(r2);
          }
          render() {
            return this.props.isCollapsed ? (document.body.classList.remove("ck-inspector-body-expanded"), document.body.classList.add("ck-inspector-body-collapsed")) : (document.body.classList.remove("ck-inspector-body-collapsed"), document.body.classList.add("ck-inspector-body-expanded")), o.a.createElement(at, { bounds: "window", enableResizing: { top: !this.props.isCollapsed }, disableDragging: true, minHeight: "100", maxHeight: "100%", style: Ln, className: ["ck-inspector", this.props.isCollapsed ? "ck-inspector_collapsed" : ""].join(" "), position: { x: 0, y: "100%" }, size: { width: "100%", height: this.props.isCollapsed ? 30 : this.props.height }, onResizeStop: this.handleInspectorResize }, o.a.createElement(ut, { onTabChange: this.props.setActiveTab, contentBefore: o.a.createElement(Fn, { key: "docs" }), activeTab: this.props.activeTab, contentAfter: [o.a.createElement(Vn, { key: "selector" }), o.a.createElement("span", { className: "ck-inspector-separator", key: "separator-a" }), o.a.createElement(jn, { key: "quick-actions" }), o.a.createElement("span", { className: "ck-inspector-separator", key: "separator-b" }), o.a.createElement(Wn, { key: "inspector-toggle" })] }, o.a.createElement(Vt, { label: "Model" }), o.a.createElement(en, { label: "View" }), o.a.createElement(cn, { label: "Commands" }), o.a.createElement(mn, { label: "Schema" })));
          }
          componentWillUnmount() {
            document.body.classList.remove("ck-inspector-body-expanded"), document.body.classList.remove("ck-inspector-body-collapsed");
          }
        }
        var Un = J(({ editors: e2, currentEditorName: t2, ui: { isCollapsed: n2, height: r2, activeTab: o2 } }) => ({ isCollapsed: n2, height: r2, editors: e2, currentEditorName: t2, activeTab: o2 }), { toggleIsCollapsed: te, setHeight: function(e2) {
          return { type: "SET_HEIGHT", newHeight: e2 };
        }, setEditors: ne, setCurrentEditorName: re, setActiveTab: oe })(In);
        class Fn extends r.Component {
          render() {
            return o.a.createElement("a", { className: "ck-inspector-navbox__navigation__logo", title: "Go to the documentation", href: "https://ckeditor.com/docs/ckeditor5/latest/", target: "_blank", rel: "noopener noreferrer" }, "CKEditor documentation");
          }
        }
        class Bn extends r.Component {
          constructor(e2) {
            super(e2), this.handleShortcut = this.handleShortcut.bind(this);
          }
          render() {
            return o.a.createElement(ht, { text: "Toggle inspector", icon: o.a.createElement(zn, null), onClick: this.props.toggleIsCollapsed, title: "Toggle inspector (Alt+F12)", className: ["ck-inspector-navbox__navigation__toggle", this.props.isCollapsed ? " ck-inspector-navbox__navigation__toggle_up" : ""].join(" ") });
          }
          componentDidMount() {
            window.addEventListener("keydown", this.handleShortcut);
          }
          componentWillUnmount() {
            window.removeEventListener("keydown", this.handleShortcut);
          }
          handleShortcut(e2) {
            (function(e3) {
              return e3.altKey && !e3.shiftKey && !e3.ctrlKey && "F12" === e3.key;
            })(e2) && this.props.toggleIsCollapsed();
          }
        }
        const Wn = J(({ ui: { isCollapsed: e2 } }) => ({ isCollapsed: e2 }), { toggleIsCollapsed: te })(Bn);
        class Hn extends r.Component {
          render() {
            return o.a.createElement("div", { className: "ck-inspector-editor-selector", key: "editor-selector" }, this.props.currentEditorName ? o.a.createElement(dt, { id: "inspector-editor-selector", label: "Instance", value: this.props.currentEditorName, options: [...this.props.editors].map(([e2]) => e2), onChange: (e2) => this.props.setCurrentEditorName(e2.target.value) }) : "");
          }
        }
        const Vn = J(({ currentEditorName: e2, editors: t2 }) => ({ currentEditorName: e2, editors: t2 }), { setCurrentEditorName: re })(Hn);
        function $n(e2) {
          document.body.style.setProperty("--ck-inspector-height", e2);
        }
        n(90);
        window.CKEDITOR_INSPECTOR_VERSION = "4.1.0";
        class qn {
          constructor() {
            Tt.a.warn("[CKEditorInspector] Whoops! Looks like you tried to create an instance of the CKEditorInspector class. To attach the inspector, use the static CKEditorInspector.attach( editor ) method instead. For the latest API, please refer to https://github.com/ckeditor/ckeditor5-inspector/blob/master/README.md. ");
          }
          static attach(...e2) {
            const { CKEDITOR_VERSION: t2 } = window;
            if (t2) {
              const [e3] = t2.split(".").map(Number);
              e3 < 34 && Tt.a.warn("[CKEditorInspector] The inspector requires using CKEditor 5 in version 34 or higher. If you cannot update CKEditor 5, consider downgrading the major version of the inspector to version 3.");
            } else Tt.a.warn("[CKEditorInspector] Could not determine a version of CKEditor 5. Some of the functionalities may not work as expected.");
            const { editors: n2, options: r2 } = Object(De.c)(e2);
            for (const e3 in n2) {
              const t3 = n2[e3];
              Tt.a.group("%cAttached the inspector to a CKEditor 5 instance. To learn more, visit https://ckeditor.com/docs/ckeditor5.", "font-weight: bold;"), Tt.a.log(`Editor instance "${e3}"`, t3), Tt.a.groupEnd(), qn._editors.set(e3, t3), t3.on("destroy", () => {
                qn.detach(e3);
              }), qn._mount(r2), qn._updateEditorsState();
            }
            return Object.keys(n2);
          }
          static attachToAll(e2) {
            const t2 = document.querySelectorAll(".ck.ck-content.ck-editor__editable"), n2 = [];
            for (const r2 of t2) {
              const t3 = r2.ckeditorInstance;
              t3 && !qn._isAttachedTo(t3) && n2.push(...qn.attach(t3, e2));
            }
            return n2;
          }
          static detach(e2) {
            qn._wrapper && (qn._editors.delete(e2), qn._updateEditorsState());
          }
          static destroy() {
            if (!qn._wrapper) return;
            a.a.unmountComponentAtNode(qn._wrapper), qn._editors.clear(), qn._wrapper.remove();
            const e2 = qn._store.getState(), t2 = e2.editors.get(e2.currentEditorName);
            t2 && qn._editorListener.stopListening(t2), qn._editorListener = null, qn._wrapper = null, qn._store = null;
          }
          static _updateEditorsState() {
            qn._store.dispatch(ne(qn._editors));
          }
          static _mount(e2) {
            if (qn._wrapper) return;
            const t2 = qn._wrapper = document.createElement("div");
            let n2, r2;
            t2.className = "ck-inspector-wrapper", document.body.appendChild(t2), qn._editorListener = new se({ onModelChange() {
              const e3 = qn._store;
              e3.getState().ui.isCollapsed || (e3.dispatch({ type: "UPDATE_MODEL_STATE" }), e3.dispatch({ type: "UPDATE_COMMANDS_STATE" }));
            }, onViewRender() {
              const e3 = qn._store;
              e3.getState().ui.isCollapsed || e3.dispatch({ type: "UPDATE_VIEW_STATE" });
            }, onReadOnlyChange() {
              qn._store.dispatch({ type: "UPDATE_CURRENT_EDITOR_IS_READ_ONLY" });
            } }), qn._store = f(Re, { editors: qn._editors, currentEditorName: Object(De.b)(qn._editors), currentEditorGlobals: {}, ui: { isCollapsed: e2.isCollapsed } }), qn._store.subscribe(() => {
              const e3 = qn._store.getState(), t3 = e3.editors.get(e3.currentEditorName);
              n2 !== t3 && (n2 && qn._editorListener.stopListening(n2), t3 && qn._editorListener.startListening(t3), n2 = t3);
            }), qn._store.subscribe(() => {
              const e3 = qn._store, t3 = e3.getState().ui.isCollapsed, n3 = r2 && !t3;
              r2 = t3, n3 && (e3.dispatch({ type: "UPDATE_MODEL_STATE" }), e3.dispatch({ type: "UPDATE_COMMANDS_STATE" }), e3.dispatch({ type: "UPDATE_VIEW_STATE" }));
            }), a.a.render(o.a.createElement(v, { store: qn._store }, o.a.createElement(Un, null)), t2);
          }
          static _isAttachedTo(e2) {
            return [...qn._editors.values()].includes(e2);
          }
        }
        qn._editors = /* @__PURE__ */ new Map(), qn._wrapper = null;
      }]).default;
    });
  })(inspector);
  return inspector.exports;
}
var inspectorExports = requireInspector();
const CKEditorInspector = /* @__PURE__ */ getDefaultExportFromCjs(inspectorExports);
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */
const trackChangesInSourceMode = function(editor) {
  const sourceEditing = editor.plugins.get(SourceEditing);
  const $editorElement = $(editor.ui.view.element);
  const $sourceElement = $(editor.sourceElement);
  const ns = `ckeditor${Math.floor(Math.random() * 1e9)}`;
  const events = [
    "keypress",
    "keyup",
    "change",
    "focus",
    "blur",
    "click",
    "mousedown",
    "mouseup"
  ].map((type) => `${type}.${ns}`).join(" ");
  sourceEditing.on("change:isSourceEditingMode", () => {
    const $sourceEditingContainer = $editorElement.find(
      ".ck-source-editing-area"
    );
    if (sourceEditing.isSourceEditingMode) {
      let content = $sourceEditingContainer.attr("data-value");
      $sourceEditingContainer.on(events, () => {
        if (content !== (content = $sourceEditingContainer.attr("data-value"))) {
          $sourceElement.val(content);
        }
      });
    } else {
      $sourceEditingContainer.off(`.${ns}`);
    }
  });
};
const headingShortcuts = function(editor, config) {
  if (config.heading !== void 0) {
    var headingOptions = config.heading.options;
    if (headingOptions.find((x) => x.view === "h1") !== void 0) {
      editor.keystrokes.set(
        "Ctrl+Alt+1",
        () => editor.execute("heading", { value: "heading1" })
      );
    }
    if (headingOptions.find((x) => x.view === "h2") !== void 0) {
      editor.keystrokes.set(
        "Ctrl+Alt+2",
        () => editor.execute("heading", { value: "heading2" })
      );
    }
    if (headingOptions.find((x) => x.view === "h3") !== void 0) {
      editor.keystrokes.set(
        "Ctrl+Alt+3",
        () => editor.execute("heading", { value: "heading3" })
      );
    }
    if (headingOptions.find((x) => x.view === "h4") !== void 0) {
      editor.keystrokes.set(
        "Ctrl+Alt+4",
        () => editor.execute("heading", { value: "heading4" })
      );
    }
    if (headingOptions.find((x) => x.view === "h5") !== void 0) {
      editor.keystrokes.set(
        "Ctrl+Alt+5",
        () => editor.execute("heading", { value: "heading5" })
      );
    }
    if (headingOptions.find((x) => x.view === "h6") !== void 0) {
      editor.keystrokes.set(
        "Ctrl+Alt+6",
        () => editor.execute("heading", { value: "heading6" })
      );
    }
    if (headingOptions.find((x) => x.model === "paragraph") !== void 0) {
      editor.keystrokes.set("Ctrl+Alt+p", "paragraph");
    }
  }
};
const handleClipboard = function(editor, plugins) {
  let copyFromEditorId = null;
  const documentView = editor.editing.view.document;
  const clipboardPipelinePlugin = editor.plugins.get("ClipboardPipeline");
  documentView.on("clipboardOutput", (event, data) => {
    copyFromEditorId = editor.id;
  });
  documentView.on("clipboardInput", async (event, data) => {
    let pasteContent = data.dataTransfer.getData("text/html");
    if (!pasteContent) {
      return;
    }
    if (pasteContent.includes("<craft-entry")) {
      if (data.method == "drop" && copyFromEditorId === editor.id) ;
      else if (data.method == "paste" || data.method == "drop" && copyFromEditorId !== editor.id) {
        let duplicatedContent = pasteContent;
        let errors = false;
        const siteId = Craft.siteId;
        let ownerId = null;
        let layoutElementUid = null;
        const editorData = editor.getData();
        const matches = [...pasteContent.matchAll(/data-entry-id="([0-9]+)/g)];
        event.stop();
        const $editorElement = $(editor.ui.view.element);
        const $parentForm = $editorElement.parents("form");
        let elementEditor = $parentForm.data("elementEditor");
        await elementEditor.ensureIsDraftOrRevision();
        ownerId = elementEditor.settings.elementId;
        layoutElementUid = $editorElement.parents(".field").data("layoutElement");
        for (let i = 0; i < matches.length; i++) {
          let entryId = null;
          if (matches[i][1]) {
            entryId = matches[i][1];
          }
          if (entryId !== null) {
            const regex = new RegExp('data-entry-id="' + entryId + '"');
            if (copyFromEditorId === editor.id && !regex.test(editorData)) ;
            else {
              let targetEntryTypeIds = null;
              if (copyFromEditorId !== editor.id) {
                if (!plugins.includes(CraftEntries)) {
                  Craft.cp.displayError(
                    Craft.t(
                      "ckeditor",
                      "This field doesn’t allow nested entries."
                    )
                  );
                  errors = true;
                } else {
                  targetEntryTypeIds = editor.config.get("entryTypeOptions").map((option) => option["value"]);
                }
              }
              await Craft.sendActionRequest(
                "POST",
                "ckeditor/ckeditor/duplicate-nested-entry",
                {
                  data: {
                    entryId,
                    siteId,
                    targetEntryTypeIds,
                    targetOwnerId: ownerId,
                    targetLayoutElementUid: layoutElementUid
                  }
                }
              ).then((response) => {
                if (response.data.newEntryId) {
                  duplicatedContent = duplicatedContent.replace(
                    entryId,
                    response.data.newEntryId
                  );
                }
              }).catch((e) => {
                var _a, _b, _c, _d;
                errors = true;
                Craft.cp.displayError((_b = (_a = e == null ? void 0 : e.response) == null ? void 0 : _a.data) == null ? void 0 : _b.message);
                console.error((_d = (_c = e == null ? void 0 : e.response) == null ? void 0 : _c.data) == null ? void 0 : _d.additionalMessage);
              });
            }
          }
        }
        if (!errors) {
          data.content = editor.data.htmlProcessor.toView(duplicatedContent);
          clipboardPipelinePlugin.fire("inputTransformation", data);
        }
      }
    }
  });
};
const create = async function(element, config) {
  if (typeof element === "string") {
    element = document.querySelector(`#${element}`);
  }
  config.licenseKey = "GPL";
  const editor = await ClassicEditor.create(element, config);
  if (Craft.showCkeditorInspector && Craft.userIsAdmin) {
    CKEditorInspector.attach(editor);
  }
  editor.editing.view.change((writer) => {
    const viewEditableRoot = editor.editing.view.document.getRoot();
    if (typeof config.accessibleFieldName != "undefined" && config.accessibleFieldName.length) {
      let ariaLabel = viewEditableRoot.getAttribute("aria-label");
      writer.setAttribute(
        "aria-label",
        config.accessibleFieldName + ", " + ariaLabel,
        viewEditableRoot
      );
    }
    if (typeof config.describedBy != "undefined" && config.describedBy.length) {
      writer.setAttribute(
        "aria-describedby",
        config.describedBy,
        viewEditableRoot
      );
    }
  });
  editor.updateSourceElement();
  editor.model.document.on("change:data", () => {
    editor.updateSourceElement();
  });
  if (config.plugins.includes(SourceEditing)) {
    trackChangesInSourceMode(editor);
  }
  if (config.plugins.includes(Heading)) {
    headingShortcuts(editor, config);
  }
  handleClipboard(editor, config.plugins);
  return editor;
};
export {
  CraftEntries,
  CraftImageInsertUI,
  CraftLinkUI,
  ImageEditor,
  ImageTransform,
  create
};
