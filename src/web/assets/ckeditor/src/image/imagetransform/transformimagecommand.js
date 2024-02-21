/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

import {Command} from 'ckeditor5/src/core';

/**
 * The transform image command.
 */
export default class TransformImageCommand extends Command {
  refresh() {
    const element = this._element();
    const srcInfo = this._srcInfo(element);
    this.isEnabled = !!srcInfo;
    if (!srcInfo) {
      this.value = null;
    } else {
      this.value = {
        transform: srcInfo.transform,
      };
    }
  }

  _element() {
    const editor = this.editor;
    const imageUtils = editor.plugins.get('ImageUtils');
    return imageUtils.getClosestSelectedImageElement(
      editor.model.document.selection,
    );
  }

  _srcInfo(element) {
    if (!element || !element.hasAttribute('src')) {
      return null;
    }

    const src = element.getAttribute('src');
    const match = src.match(
      /#asset:(\d+)(?::transform:([a-zA-Z][a-zA-Z0-9_]*))?/,
    );
    if (!match) {
      return null;
    }

    return {
      src,
      assetId: match[1],
      transform: match[2],
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
      transform: options.transform,
    };

    if (srcInfo) {
      const hash =
        `#asset:${srcInfo.assetId}` +
        (options.transform ? `:transform:${options.transform}` : '');

      // update the src hash immediately, so the transform is applied even if the real URL doesn’t load successfully
      model.change((writer) => {
        const src = srcInfo.src.replace(/#.*/, '') + hash;
        writer.setAttribute('src', src, element);
      });

      // load the real URL and then update the src again
      Craft.sendActionRequest('post', 'ckeditor/ckeditor/image-url', {
        data: {
          assetId: srcInfo.assetId,
          transform: options.transform,
        },
      }).then(({data}) => {
        model.change((writer) => {
          const src = data.url + hash;
          writer.setAttribute('src', src, element);

          // update image width and height to match the transformed size;
          // ckeditor insists on keeping those around:
          // https://ckeditor.com/docs/ckeditor5/latest/features/images/images-overview.html#image-width-and-height-attributes
          if (data.width) {
            writer.setAttribute('width', data.width, element);
          }
          if (data.height) {
            writer.setAttribute('height', data.height, element);
          }
        });
      });
    }
  }
}
