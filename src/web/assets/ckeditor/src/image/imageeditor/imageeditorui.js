/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

import {Plugin, icons} from 'ckeditor5/src/core';
import {ButtonView} from 'ckeditor5/src/ui';
import ImageEditorEditing from './imageeditorediting';

export default class ImageEditorUI extends Plugin {
  static get requires() {
    return [ImageEditorEditing];
  }

  static get pluginName() {
    return 'ImageEditorUI';
  }

  init() {
    const editor = this.editor;
    const command = editor.commands.get('imageEditor');
    this.bind('isEnabled').to(command);
    this._registerImageEditorButton();
  }

  /**
   * A helper function that creates a button component for the plugin that triggers launch of the Image Editor.
   */
  _registerImageEditorButton() {
    const editor = this.editor;
    const t = editor.t;
    const command = editor.commands.get('imageEditor');

    const componentCreator = () => {
      const buttonView = new ButtonView();

      buttonView.set({
        label: t('Edit Image'),
        withText: true,
      });

      buttonView.bind('isEnabled').to(command);

      // Execute command when a button is clicked.
      this.listenTo(buttonView, 'execute', (evt) => {
        editor.execute('imageEditor');
        editor.editing.view.focus();
      });

      return buttonView;
    };

    editor.ui.componentFactory.add('imageEditor', componentCreator);
  }
}
