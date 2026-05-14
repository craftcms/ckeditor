/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

import {ImageTextAlternativeUI} from 'ckeditor5';

const assetAltRefPattern = /#asset:\d+(?:@\d+)?:alt$/;

export default class CraftImageTextAlternativeUI extends ImageTextAlternativeUI {
  static get pluginName() {
    return 'CraftImageTextAlternativeUI';
  }

  _createForm() {
    super._createForm();

    this.listenTo(
      this._form,
      'submit',
      () => {
        const fieldView = this._form.labeledInput.fieldView;
        const commandValue =
          this.editor.commands.get('imageTextAlternative').value || '';

        if (
          assetAltRefPattern.test(commandValue) &&
          fieldView.element.value === this._visibleAltText(commandValue)
        ) {
          fieldView.value = fieldView.element.value = commandValue;
        }
      },
      {priority: 'high'},
    );
  }

  _showForm() {
    super._showForm();

    const fieldView = this._form.labeledInput.fieldView;
    const value = this._visibleAltText(fieldView.element.value);

    fieldView.value = fieldView.element.value = value;
    fieldView.select();
  }

  _visibleAltText(value) {
    return value.replace(assetAltRefPattern, '');
  }
}
