/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

import {ButtonView, IconImage, ImageInsertUI} from 'ckeditor5';
import {t as craftT} from '@craftcms/cp';

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

    Craft.createElementSelectorModal('CraftCms\\Cms\\Asset\\Elements\\Asset', {
      ...this._imageModalSettings,
      storageKey: `ckeditor:${this.pluginName}:'CraftCms\\Cms\\Asset\\Elements\\Asset'`,
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
      const siteId = asset.siteId ?? editor.config.get('elementSiteId');
      const alt = `${asset.$element.data('alt') ?? ''}#asset:${asset.id}${siteId ? `@${siteId}` : ''}:alt`;

      const hasTransform = this._isTransformUrl(asset.url);

      // Do we need to apply the default transform?
      if (!hasTransform && defaultTransform) {
        const url = await this._getTransformUrl(asset.id, defaultTransform);
        urls.push({src: url, alt: alt});
      } else {
        const url = this._buildAssetUrl(
          asset.id,
          asset.url,
          hasTransform ? transform : defaultTransform,
        );
        urls.push({src: url, alt: alt});
      }
    }

    editor.execute('insertImage', {source: urls});
  }

  async _createImageEntry(assetId) {
    const editor = this.editor;
    const nestedElementAttributes = editor.config.get(
      'nestedElementAttributes',
    );
    const params = {
      ...nestedElementAttributes,
    };
    const owner = editor.config.get('craftOwner');

    if (owner?.ownerId()) {
      // make sure the owner is a draft, and create the entry for it
      params.ownerId = await owner.prepare();
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
    return url.replace(/(^|\/)_[^\/]+(\/\d+)?\/([^\/]+)$/, '$1$3');
  }

  _isTransformUrl(url) {
    return /(^|\/)_[^\/]+(\/\d+)?(\/[^\/]+)$/.test(url);
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

    this.$container = $(editor.sourceElement).closest('.ckeditor-container');
    this.progressBar = $(
      '<craft-progress-bar class="hidden mt-sm" smooth></craft-progress-bar>',
    ).appendTo(this.$container)[0];

    this.$fileInput = $('<input/>', {
      type: 'file',
      class: 'hidden',
      multiple: true,
    }).insertAfter(editor.sourceElement);

    this.uploader = new Craft.Uploaders.Uploader(this.$container[0], {
      dropZone: this.$container[0],
      fileInput: this.$fileInput[0],
      allowedKinds: ['image'],
      on: {
        start: this._onUploadStart.bind(this),
        progress: this._onUploadProgress.bind(this),
        done: this._onUploadComplete.bind(this),
        fail: this._onUploadFailure.bind(this),
        stop: this._onUploadStop.bind(this),
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
    this.progressBar.progress = 0;
    this.progressBar.classList.remove('hidden');
  }

  /**
   * On upload progress.
   */
  _onUploadProgress({loaded, total}) {
    const progress = parseInt(Math.min(loaded / total, 1) * 100, 10);
    this.progressBar.progress = progress;
  }

  /**
   * On a file being uploaded.
   */
  async _onUploadComplete({result: asset}) {
    if (this._imageMode === 'entries') {
      await this._createImageEntry(asset.assetId);
      return;
    }

    const defaultTransform = this.editor.config.get('defaultTransform');
    const hasTransform = this._isTransformUrl(asset.url);
    let url;

    // Do we need to apply the default transform, or is there no URL yet (e.g. it's a temp upload)?
    if (!asset.url || (!hasTransform && defaultTransform)) {
      url = await this._getTransformUrl(asset.assetId, defaultTransform);
    } else {
      // either the URL is already transformed (with an unknown handle) or there's no default transform
      url = this._buildAssetUrl(asset.assetId, asset.url);
    }

    this.editor.execute('insertImage', {source: url, breakBlock: true});
  }

  /**
   * On Upload Failure.
   */
  _onUploadFailure({error, canceled, file}) {
    if (canceled) {
      return;
    }

    const response = error?.data || {};
    let message = error instanceof Error ? error.message : undefined;
    const filename = response.filename || file?.name;
    const {errors} = response;

    let errorMessages = errors ? Object.values(errors).flat() : [];

    if (!message) {
      if (errorMessages.length) {
        message = errorMessages.join('\n');
      } else if (filename) {
        message = craftT('Upload failed for “{filename}”.', {filename});
      } else {
        message = craftT('Upload failed.');
      }
    }

    Craft.cp.displayError(message);
  }

  /**
   * Once all uploads have finished.
   */
  _onUploadStop() {
    this.progressBar.classList.add('hidden');
  }
}
