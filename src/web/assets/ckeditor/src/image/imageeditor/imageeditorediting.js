/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

import {Plugin} from 'ckeditor5/src/core';
import ImageUtils from '@ckeditor/ckeditor5-image/src/imageutils';
import ImageEditorCommand from './imageeditorcommand';

export default class ImageEditorEditing extends Plugin {
  static get requires() {
    return [ImageUtils];
  }

  static get pluginName() {
    return 'ImageEditorEditing';
  }

  init() {
    const editor = this.editor;
    const imageEditorCommand = new ImageEditorCommand(editor);
    editor.commands.add('imageEditor', imageEditorCommand);
  }
}
