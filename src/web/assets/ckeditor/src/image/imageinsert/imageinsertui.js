/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

import {ButtonView, IconImage, ImageInsertUI} from 'ckeditor5';

export default class CraftImageInsertUI extends ImageInsertUI {
  static get pluginName() {
    return 'CraftImageInsertUI';
  }

  constructor() {
    super(...arguments);
    this.$container = null;
    this.progressBar = null;
    this.$fileInput = null;
    this.uploader = null;
  }

  init() {
    // Make sure there are linked volumes
    if (!this._imageSources) {
      console.warn(
        'Omitting the "image" CKEditor toolbar button, because there aren’t any permitted volumes.',
      );
      return;
    }

    if (this._imageMode === 'entries') {
      if (!this._imageFieldHandle) {
        console.warn(
          'Omitting the "image" CKEditor toolbar button, because no image field was selected.',
        );
        return;
      }
    }

    // Register `insertImage` dropdown and add `imageInsert` dropdown as an alias for consistency with ImageInsertUI
    const componentFactory = this.editor.ui.componentFactory;
    const componentCreator = (locale) => {
      return this._createToolbarImageButton(locale);
    };
    componentFactory.add('insertImage', componentCreator);
    componentFactory.add('imageInsert', componentCreator);

    this._attachUploader();
  }

  get _imageMode() {
    return this.editor.config.get('imageMode');
  }

  get _imageSources() {
    return this.editor.config.get('imageSources');
  }

  get _imageModalSettings() {
    return this.editor.config.get('imageModalSettings') ?? {};
  }

  get _imageFieldHandle() {
    return this.editor.config.get('imageFieldHandle');
  }

  /**
   * Returns Craft.ElementEditor instance that the CKEditor field belongs to.
   *
   * @returns {*}
   */
  get _elementEditor() {
    const $editorContainer = $(this.editor.ui.view.element).closest(
      'form,.lp-editor-container',
    );
    return $editorContainer.data('elementEditor');
  }

  _createToolbarImageButton(locale) {
    const editor = this.editor;
    const t = editor.t;
    const button = new ButtonView(locale);
    button.isEnabled = true;
    button.label = t('Insert image');
    button.icon = IconImage;
    button.tooltip = true;
    const insertImageCommand = editor.commands.get('insertImage');
    button.bind('isEnabled').to(insertImageCommand);
    this.listenTo(button, 'execute', () => this._showImageSelectModal());
    return button;
  }

  _showImageSelectModal() {
    const sources = this._imageSources;
    const editor = this.editor;
    const config = editor.config;
    const criteria = Object.assign({}, config.get('assetSelectionCriteria'), {
      kind: 'image',
    });

    Craft.createElementSelectorModal('craft\\elements\\Asset', {
      ...this._imageModalSettings,
      storageKey: `ckeditor:${this.pluginName}:'craft\\elements\\Asset'`,
      sources,
      criteria,
      defaultSiteId: config.get('elementSiteId'),
      transforms: config.get('transforms'),
      autoFocusSearchBox: false,
      multiSelect: true,
      onSelect: (assets, transform) => {
        this._processSelectedAssets(assets, transform).then(() => {
          editor.editing.view.focus();
        });
      },
      onHide: () => {
        editor.editing.view.focus();
      },
      closeOtherModals: false,
    });
  }

  async _processSelectedAssets(assets, transform) {
    if (!assets.length) {
      return;
    }

    if (this._imageMode === 'entries') {
      for (const asset of assets) {
        await this._createImageEntry(asset.id);
      }
      return;
    }

    const editor = this.editor;
    const defaultTransform = editor.config.get('defaultTransform');
    const urls = [];

    for (const asset of assets) {
      const hasTransform = this._isTransformUrl(asset.url);

      // Do we need to apply the default transform?
      if (!hasTransform && defaultTransform) {
        const url = await this._getTransformUrl(asset.id, defaultTransform);
        urls.push(url);
      } else {
        const url = this._buildAssetUrl(
          asset.id,
          asset.url,
          hasTransform ? transform : defaultTransform,
        );
        urls.push(url);
      }
    }

    editor.execute('insertImage', {source: urls});
  }

  async _createImageEntry(assetId) {
    const editor = this.editor;
    const elementEditor = this._elementEditor;
    const baseInputName = $(editor.sourceElement).attr('name');

    // mark as dirty
    if (elementEditor && baseInputName) {
      await elementEditor.setFormValue(baseInputName, '*');
    }

    const nestedElementAttributes = editor.config.get(
      'nestedElementAttributes',
    );
    const params = {
      ...nestedElementAttributes,
    };

    if (elementEditor) {
      await elementEditor.markDeltaNameAsModified(editor.sourceElement.name);
      // replace the owner ID with the new one, maybe?
      params.ownerId = elementEditor.getDraftElementId(
        nestedElementAttributes.ownerId,
      );
    }

    let response;
    try {
      response = await Craft.sendActionRequest(
        'POST',
        'ckeditor/ckeditor/create-image-entry',
        {
          data: {
            ...params,
            assetIds: [assetId],
          },
        },
      );
    } catch (e) {
      Craft.cp.displayError();
      throw e;
    }

    editor.commands.execute('insertEntry', {
      entryId: response.data.entryId,
      siteId: response.data.siteId,
    });
  }

  _buildAssetUrl(assetId, assetUrl, transform) {
    return `${assetUrl}#asset:${assetId}:${
      transform ? 'transform:' + transform : 'url'
    }`;
  }

  _removeTransformFromUrl(url) {
    return url.replace(/(^|\/)(_[^\/]+\/)([^\/]+)$/, '$1$3');
  }

  _isTransformUrl(url) {
    return /(^|\/)_[^\/]+\/[^\/]+$/.test(url);
  }

  async _getTransformUrl(assetId, handle) {
    let response;
    try {
      response = await Craft.sendActionRequest(
        'POST',
        'ckeditor/ckeditor/image-url',
        {
          data: {
            assetId: assetId,
            transform: handle,
          },
        },
      );
    } catch {
      alert('There was an error generating the transform URL.');
    }

    return this._buildAssetUrl(assetId, response.data.url, handle);
  }

  _getAssetUrlComponents(url) {
    const matches = url.match(
      /(.*)#asset:(\d+):(url|transform):?([a-zA-Z][a-zA-Z0-9_]*)?/,
    );
    return matches
      ? {
          url: matches[1],
          assetId: matches[2],
          transform: matches[3] !== 'url' ? matches[4] : null,
        }
      : null;
  }

  /**
   * Attach the uploader with drag event handler
   */
  _attachUploader() {
    const editor = this.editor;
    const folderId = editor.config.get('defaultUploadFolderId');

    if (!folderId) {
      return;
    }

    this.$container = $(editor.sourceElement).closest('.input');
    this.progressBar = new Craft.ProgressBar(
      $('<div class="progress-shade"></div>').appendTo(this.$container),
    );

    this.$fileInput = $('<input/>', {
      type: 'file',
      class: 'hidden',
      multiple: true,
    }).insertAfter(editor.sourceElement);

    this.uploader = Craft.createUploader(null, this.$container, {
      dropZone: this.$container,
      fileInput: this.$fileInput,
      allowedKinds: ['image'],
      canAddMoreFiles: true,
      events: {
        fileuploadstart: this._onUploadStart.bind(this),
        fileuploadprogressall: this._onUploadProgress.bind(this),
        fileuploaddone: this._onUploadComplete.bind(this),
        fileuploadfail: this._onUploadFailure.bind(this),
      },
    });

    this.uploader.setParams({
      folderId,
      siteId: editor.config.get('elementSiteId'),
    });

    // this ensures the image is inserted where the drop-target suggests it will and not always at the start/end of the content
    editor.editing.view.document.on(
      'drop',
      async (event, data) => {
        const view = editor.editing.view;
        const model = editor.model;
        const mapper = editor.editing.mapper;

        const dropRange = data.dropRange;

        if (dropRange) {
          // Convert the view position to a model position
          const viewPosition = dropRange.start;
          const modelPosition = mapper.toModelPosition(viewPosition);

          editor.model.change((writer) => {
            writer.setSelection(modelPosition, 0);
          });
        }
      },
      {priority: 'high'},
    );
  }

  /**
   * On upload start.
   */
  _onUploadStart() {
    this.progressBar.$progressBar.css({
      top: Math.round(this.$container.outerHeight() / 2) - 6,
    });

    this.$container.addClass('uploading');
    this.progressBar.resetProgressBar();
    this.progressBar.showProgressBar();
  }

  /**
   * On upload progress.
   */
  _onUploadProgress(event, data = null) {
    data = event instanceof CustomEvent ? event.detail : data;

    var progress = parseInt(Math.min(data.loaded / data.total, 1) * 100, 10);
    this.progressBar.setProgressPercentage(progress);
  }

  /**
   * On a file being uploaded.
   */
  async _onUploadComplete(event, data = null) {
    const asset = event instanceof CustomEvent ? event.detail : data.result;
    this.progressBar.hideProgressBar();
    this.$container.removeClass('uploading');

    if (this._imageMode === 'entries') {
      await this._createImageEntry(asset.assetId);
      return;
    }

    const defaultTransform = this.editor.config.get('defaultTransform');
    const hasTransform = this._isTransformUrl(asset.url);
    let url;

    // Do we need to apply the default transform?
    if (!hasTransform && defaultTransform) {
      url = await this._getTransformUrl(asset.assetId, defaultTransform);
    } else {
      url = this._buildAssetUrl(
        asset.assetId,
        asset.url,
        hasTransform ? transform : defaultTransform,
      );
    }

    this.editor.execute('insertImage', {source: url, breakBlock: true});
  }

  /**
   * On Upload Failure.
   */
  _onUploadFailure(event, data = null) {
    const response =
      event instanceof CustomEvent ? event.detail : data?.jqXHR?.responseJSON;

    let {message, filename, errors} = response || {};

    filename = filename || data?.files?.[0].name;

    let errorMessages = errors ? Object.values(errors).flat() : [];

    if (!message) {
      if (errorMessages.length) {
        message = errorMessages.join('\n');
      } else if (filename) {
        message = Craft.t('app', 'Upload failed for “{filename}”.', {filename});
      } else {
        message = Craft.t('app', 'Upload failed.');
      }
    }

    Craft.cp.displayError(message);
    this.progressBar.hideProgressBar();
    this.$container.removeClass('uploading');
  }
}
