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
    if (!this._assetSources) {
      console.warn(
        'Omitting the "image" CKEditor toolbar button, because there aren’t any permitted volumes.',
      );
      return;
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

  get _assetSources() {
    return this.editor.config.get('assetSources');
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
    const sources = this._assetSources;
    const editor = this.editor;
    const config = editor.config;
    const criteria = Object.assign({}, config.get('assetSelectionCriteria'), {
      kind: 'image',
    });

    Craft.createElementSelectorModal('craft\\elements\\Asset', {
      storageKey: `ckeditor:${this.pluginName}:'craft\\elements\\Asset'`,
      sources,
      criteria,
      defaultSiteId: config.get('elementSiteId'),
      transforms: config.get('transforms'),
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
      closeOtherModals: false,
    });
  }

  _processAssetUrls(assets, transform) {
    return new Promise((resolve) => {
      if (!assets.length) {
        resolve();
        return;
      }

      const editor = this.editor;
      const defaultTransform = editor.config.get('defaultTransform');
      const queue = new Craft.Queue();
      const urls = [];

      queue.on('afterRun', () => {
        editor.execute('insertImage', {source: urls});
        resolve();
      });

      for (const asset of assets) {
        queue.push(
          () =>
            new Promise((resolve) => {
              const hasTransform = this._isTransformUrl(asset.url);
              // Do we need to apply the default transform?
              if (!hasTransform && defaultTransform) {
                this._getTransformUrl(asset.id, defaultTransform, (url) => {
                  urls.push(url);
                  // editor.execute('insertImage', {source: url});
                  resolve();
                });
              } else {
                const url = this._buildAssetUrl(
                  asset.id,
                  asset.url,
                  hasTransform ? transform : defaultTransform,
                );
                urls.push(url);
                // editor.execute('insertImage', {source: url});
                resolve();
              }
            }),
        );
      }
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

  _getTransformUrl(assetId, handle, callback) {
    Craft.sendActionRequest('POST', 'ckeditor/ckeditor/image-url', {
      data: {
        assetId: assetId,
        transform: handle,
      },
    })
      .then(({data}) => {
        callback(this._buildAssetUrl(assetId, data.url, handle));
      })
      .catch(() => {
        alert('There was an error generating the transform URL.');
      });
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
    let params = this.editor.config.get('assetUploadParams') ?? null;

    if (!params || !params['folderId']) {
      return;
    }

    this.$container = $(this.editor.sourceElement).parents('.input');
    this.progressBar = new Craft.ProgressBar(
      $('<div class="progress-shade"></div>').appendTo(this.$container),
    );

    this.$fileInput = $('<input/>', {
      type: 'file',
      class: 'hidden',
      multiple: false,
    }).insertAfter(this.editor.sourceElement);

    var options = {
      dropZone: this.$container,
      fileInput: this.$fileInput,
    };

    if (params.kind) {
      options.allowedKinds = params.kind;
    }

    options.canAddMoreFiles = true;

    options.events = {};
    options.events.fileuploadstart = this._onUploadStart.bind(this);
    options.events.fileuploadprogressall = this._onUploadProgress.bind(this);
    options.events.fileuploaddone = this._onUploadComplete.bind(this);
    options.events.fileuploadfail = this._onUploadFailure.bind(this);

    this.uploader = Craft.createUploader(
      params['volumeType'],
      this.$container,
      options,
    );

    delete params['volumeId'];
    delete params['volumeType'];

    this.uploader.setParams(params);
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
  _onUploadComplete(event, data = null) {
    const asset = event instanceof CustomEvent ? event.detail : data.result;
    this.progressBar.hideProgressBar();
    this.$container.removeClass('uploading');
    const defaultTransform = this.editor.config.get('defaultTransform');
    const queue = new Craft.Queue();
    const urls = [];

    queue.on('afterRun', () => {
      this.editor.execute('insertImage', {source: urls, breakBlock: true});
    });

    queue.push(
      () =>
        new Promise((resolve) => {
          const hasTransform = this._isTransformUrl(asset.url);
          // Do we need to apply the default transform?
          if (!hasTransform && defaultTransform) {
            this._getTransformUrl(asset.assetId, defaultTransform, (url) => {
              urls.push(url);
              resolve();
            });
          } else {
            const url = this._buildAssetUrl(
              asset.assetId,
              asset.url,
              hasTransform ? transform : defaultTransform,
            );
            urls.push(url);
            resolve();
          }
        }),
    );
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
