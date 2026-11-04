/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

import {Command} from 'ckeditor5';
import * as Craft from '@craftcms/cp';

/**
 * The transform image command.
 */
export default class ImageEditorCommand extends Command {
  refresh() {
    const element = this._element();
    const srcInfo = this._srcInfo(element);
    this.isEnabled = !!srcInfo;

    // if the command is still enabled - check permissions too
    if (this.isEnabled) {
      let data = {
        assetId: srcInfo.assetId,
      };

      Craft.actionClient
        .post('ckeditor/ckeditor/image-permissions', data)
        .then((response) => {
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
    const imageUtils = editor.plugins.get('ImageUtils');
    return imageUtils.getClosestSelectedImageElement(
      editor.model.document.selection,
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
  _srcInfo(element) {
    if (!element || !element.hasAttribute('src')) {
      return null;
    }

    const src = element.getAttribute('src');
    const match = src.match(
      /(.*)#asset:(\d+)(?::transform:([a-zA-Z][a-zA-Z0-9_]*))?/,
    );
    if (!match) {
      return null;
    }

    return {
      src,
      assetId: match[2],
      transform: match[3],
    };
  }

  /**
   * Executes the command.
   *
   * @fires execute
   */
  execute() {
    const editor = this.editor;
    const model = editor.model;
    const element = this._element();
    const srcInfo = this._srcInfo(element);

    if (srcInfo) {
      // the asset ID must be a number, otherwise Craft treats it as the editor settings
      void Craft.openAssetImageEditor(parseInt(srcInfo.assetId, 10), (data) => {
        this._reloadImage(srcInfo.assetId, data);
      }).catch((e) => {
        Craft.showError(e?.response?.data?.message);
      });
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

    // get all images that are Craft Assets
    let images = this._getAllImageAssets();

    // go through them all and get the ones with matching asset id
    images.forEach((image) => {
      // if it's the image we just edited
      if (image.srcInfo.assetId == assetId) {
        // if it doesn'Craft.t have a transform
        if (!image.srcInfo.transform) {
          let data = {
            assetId: image.srcInfo.assetId,
          };

          Craft.actionClient
            .post('ckeditor/ckeditor/image-url', data)
            .then((response) => {
              let newSrc = this._getNewSrc(response.data, image);

              model.change((writer) => {
                writer.setAttribute('src', newSrc, image.element);
              });
            });
        } else {
          let data = {
            assetId: image.srcInfo.assetId,
            handle: image.srcInfo.transform,
          };

          // get the new url
          Craft.actionClient
            .post('assets/generate-transform', data)
            .then((response) => {
              // get new src
              let newSrc = this._getNewSrc(response.data, image);

              // and replace
              model.change((writer) => {
                writer.setAttribute('src', newSrc, image.element);
              });
            });
        }
      }
    });
  }

  _getNewSrc(data, image) {
    let newSrc = data.url;

    // this is negated on purpose;
    // we want to include some sort of browser cache-busting query param,
    // so that the image is reloaded after it was edited, because the URL might still be the same
    // (e.g. if using native stuff and you "just" rotated the image)
    // if revAssetUrls is on, then the asset's URL should already have a "v=" param
    if (!window.CKE_REV_ASSET_URLS) {
      newSrc += (newSrc.includes('?') ? '&' : '?') + new Date().getTime();
    }

    newSrc += '#asset:' + image.srcInfo.assetId;

    if (image.srcInfo.transform) {
      newSrc += ':transform:' + image.srcInfo.transform;
    }

    return newSrc;
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
    for (const value of range.getWalker({ignoreElementEnd: true})) {
      if (value.item.is('element') && value.item.name === 'imageBlock') {
        let srcInfo = this._srcInfo(value.item);
        if (srcInfo) {
          images.push({
            element: value.item,
            srcInfo: srcInfo,
          });
        }
      }
    }

    return images;
  }
}
