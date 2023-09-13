/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

import {Plugin} from 'ckeditor5/src/core';
import ImageTransformEditing from './imagetransform/imagetransformediting';
import ImageTransformUI from './imagetransform/imagetransformui';

export default class ImageTransform extends Plugin {
  static get requires() {
    return [ImageTransformEditing, ImageTransformUI];
  }

  static get pluginName() {
    return 'ImageTransform';
  }
}
