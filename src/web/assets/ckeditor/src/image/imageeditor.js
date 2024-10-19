/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

import {Plugin} from 'ckeditor5/src/core';
import ImageEditorEditing from './imageeditor/imageeditorediting';
import ImageEditorUI from './imageeditor/imageeditorui';

export default class ImageEditor extends Plugin {
  static get requires() {
    return [ImageEditorEditing, ImageEditorUI];
  }

  static get pluginName() {
    return 'ImageEditor';
  }
}
