import {Plugin} from 'ckeditor5/src/core';
import ImageUtils from '@ckeditor/ckeditor5-image/src/imageutils';
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
