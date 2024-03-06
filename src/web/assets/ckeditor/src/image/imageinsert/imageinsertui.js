/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

import {icons} from 'ckeditor5/src/core';
import {ButtonView} from 'ckeditor5/src/ui';
import {ImageInsertUI} from '@ckeditor/ckeditor5-image';

export default class CraftImageInsertUI extends ImageInsertUI {
  static get pluginName() {
    return 'CraftImageInsertUI';
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
    button.icon = icons.image;
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
}
