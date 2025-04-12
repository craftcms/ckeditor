/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

import {ImageUtils, Plugin} from 'ckeditor5';
import TransformImageCommand from './transformimagecommand';

export default class ImageTransformEditing extends Plugin {
  static get requires() {
    return [ImageUtils];
  }

  static get pluginName() {
    return 'ImageTransformEditing';
  }

  constructor(editor) {
    super(editor);
    editor.config.define('transforms', []);
  }

  init() {
    const editor = this.editor;
    const transformImageCommand = new TransformImageCommand(editor);
    editor.commands.add('transformImage', transformImageCommand);
  }
}
