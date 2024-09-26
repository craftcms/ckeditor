/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

import {Command} from 'ckeditor5/src/core';

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

      Craft.sendActionRequest('POST', 'ckeditor/ckeditor/image-permissions', {
        data,
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
    const imageUtils = editor.plugins.get('ImageUtils');
    return imageUtils.getClosestSelectedImageElement(
      editor.model.document.selection,
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
      baseSrc: match[1],
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
      let settings = {
        allowSavingAsNew: false, // todo: we might want to change that, but currently we're doing the same functionality as in Redactor
        onSave: (data) => {
          this._reloadImage(srcInfo.assetId, data);
        },
        allowDegreeFractions: Craft.isImagick,
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

    // get all images that are Craft Assets
    let images = this._getAllImageAssets();

    // go through them all and get the ones with matching asset id
    images.forEach((image) => {
      // if it's the image we just edited
      if (image.srcInfo.assetId == assetId) {
        // if it doesn't have a transform
        if (!image.srcInfo.transform) {
          // get new src
          let newSrc =
            image.srcInfo.baseSrc +
            '?' +
            new Date().getTime() +
            '#asset:' +
            image.srcInfo.assetId;

          // and replace
          model.change((writer) => {
            writer.setAttribute('src', newSrc, image.element);
          });
        } else {
          let data = {
            assetId: image.srcInfo.assetId,
            handle: image.srcInfo.transform,
          };

          // get the new url
          Craft.sendActionRequest('POST', 'assets/generate-transform', {
            data,
          }).then((response) => {
            // get new src
            let newSrc =
              response.data.url +
              '?' +
              new Date().getTime() +
              '#asset:' +
              image.srcInfo.assetId +
              ':transform:' +
              image.srcInfo.transform;

            // and replace
            model.change((writer) => {
              writer.setAttribute('src', newSrc, image.element);
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
