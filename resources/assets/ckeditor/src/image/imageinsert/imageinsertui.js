/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

import {ButtonView, IconImage, ImageInsertUI} from 'ckeditor5';
import {
  actionClient,
  t as craftT,
  createElementSelectorModal,
  showError,
  Uploader,
} from '@craftcms/cp';

export default class CraftImageInsertUI extends ImageInsertUI {
  static get pluginName() {
    return 'CraftImageInsertUI';
  }

  constructor() {
    super(...arguments);
    this.container = null;
    this.fileInput = null;
    this.uploader = null;
    this.placeholders = [];
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

    void createElementSelectorModal('CraftCms\\Cms\\Asset\\Elements\\Asset', {
      ...this._imageModalSettings,
      storageKey: `ckeditor:${this.pluginName}:'CraftCms\\Cms\\Asset\\Elements\\Asset'`,
      sources,
      criteria,
      defaultSiteId: config.get('elementSiteId'),
      transforms: config.get('transforms'),
      multiSelect: true,
      onSelect: (assets, {transform}) => {
        return this._processSelectedAssets(assets, transform).then(() => {
          editor.editing.view.focus();
        });
      },
      onClose: () => {
        editor.editing.view.focus();
      },
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
      const alt = `${asset.alt ?? ''}#asset:${asset.id}${siteId ? `@${siteId}` : ''}:alt`;

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
      response = await actionClient.post(
        'ckeditor/ckeditor/create-image-entry',
        {
          ...params,
          assetIds: [assetId],
        },
      );
    } catch (e) {
      showError();
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
      response = await actionClient.post('ckeditor/ckeditor/image-url', {
        assetId: assetId,
        transform: handle,
      });
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

    this.container = editor.sourceElement.closest('.ckeditor-container');

    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.className = 'hidden';
    this.fileInput.multiple = true;
    editor.sourceElement.after(this.fileInput);

    this.uploader = new Uploader(this.container, {
      dropZone: this.container,
      fileInput: this.fileInput,
      allowedKinds: ['image'],
      on: {
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

        await this._addPlaceholders(data.dataTransfer?.files ?? []);
      },
      {priority: 'high'},
    );
  }

  /**
   * Inserts a placeholder for each dropped image, so the content doesn’t jump when the upload lands.
   *
   * The placeholders go in at the drop position, in the order they were dropped, and are matched back up
   * with their uploads by file. Upload progress itself is reported by the upload notification.
   */
  async _addPlaceholders(files) {
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        continue;
      }

      const {width, height} = await this._imageSize(file);
      const element = this._insertPlaceholder(width, height);

      if (element) {
        this.placeholders.push({
          key: this._fileKey(file),
          element,
          width,
          height,
        });
      }
    }
  }

  /**
   * Inserts one placeholder image at the current selection and returns its model element.
   */
  _insertPlaceholder(width, height) {
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
      `viewBox="0 0 ${width} ${height}">` +
      `<rect width="${width}" height="${height}" fill="#808080" fill-opacity="0.18"/>` +
      '</svg>';

    this.editor.execute('insertImage', {
      source: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
      breakBlock: true,
    });

    return this.editor.model.document.selection.getSelectedElement();
  }

  /**
   * Puts placeholders back for uploads that are still in flight.
   *
   * Replacing the editor’s value — which happens once the owner’s draft is created — drops them, since
   * they were never part of the saved content. They go back in at the end, the position being lost with them.
   */
  restorePlaceholders() {
    const model = this.editor.model;

    for (const placeholder of this.placeholders) {
      if (placeholder.element.root.rootName !== '$graveyard') {
        continue;
      }

      model.change((writer) =>
        writer.setSelection(
          writer.createPositionAt(model.document.getRoot(), 'end'),
        ),
      );
      placeholder.element =
        this._insertPlaceholder(placeholder.width, placeholder.height) ??
        placeholder.element;
    }
  }

  /**
   * Returns a dropped image’s pixel dimensions, falling back to 3:2 if it can’t be read.
   */
  async _imageSize(file) {
    try {
      const bitmap = await createImageBitmap(file);
      const {width, height} = bitmap;
      bitmap.close();
      if (width && height) {
        return {width, height};
      }
    } catch {
      // not decodable here; the server still gets its chance
    }

    return {width: 600, height: 400};
  }

  _fileKey(file) {
    return `${file.name}:${file.size}:${file.lastModified}`;
  }

  /**
   * Hands back the placeholder for an uploaded file, preferring an exact match over the oldest pending one —
   * the uploader may rebuild the `File` on its way through the drop target, so identity can’t be relied on.
   */
  _takePlaceholder(file) {
    const key = file ? this._fileKey(file) : null;
    let index = key
      ? this.placeholders.findIndex((placeholder) => placeholder.key === key)
      : -1;
    if (index === -1) {
      index = 0;
    }

    const [placeholder] = this.placeholders.splice(index, 1);

    // it may have been undone or deleted while the upload was in flight
    return placeholder?.element.root.rootName === '$graveyard'
      ? null
      : (placeholder?.element ?? null);
  }

  _removePlaceholder(element) {
    if (!element) {
      return;
    }

    this.editor.model.change((writer) => writer.remove(element));
  }

  /**
   * On a file being uploaded.
   */
  async _onUploadComplete({result: asset, file}) {
    const placeholder = this._takePlaceholder(file);

    if (this._imageMode === 'entries') {
      this._removePlaceholder(placeholder);
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

    if (placeholder) {
      this.editor.model.change((writer) =>
        writer.setAttribute('src', url, placeholder),
      );
      return;
    }

    this.editor.execute('insertImage', {source: url, breakBlock: true});
  }

  /**
   * On Upload Failure.
   */
  _onUploadFailure({error, canceled, file}) {
    this._removePlaceholder(this._takePlaceholder(file));

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

    showError(message);
  }

  /**
   * Once all uploads have finished.
   */
  _onUploadStop() {
    // whatever is left was never uploaded — a file the uploader rejected, most likely
    const orphans = this.placeholders.splice(0);
    for (const {element} of orphans) {
      if (element.root.rootName !== '$graveyard') {
        this._removePlaceholder(element);
      }
    }
  }
}
