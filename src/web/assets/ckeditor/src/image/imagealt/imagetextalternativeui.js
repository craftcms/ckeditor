/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

import {ButtonView, FormRowView, ImageTextAlternativeUI} from 'ckeditor5';

const assetAltRefPattern = /#asset:\d+(?:@\d+)?:alt$/;
const assetSrcRefPattern = /#asset:(\d+)(?:@(\d+))?/;

export default class CraftImageTextAlternativeUI extends ImageTextAlternativeUI {
  static get pluginName() {
    return 'CraftImageTextAlternativeUI';
  }

  constructor() {
    super(...arguments);
    this._syncButton = null;
    this._syncButtonRow = null;
  }

  _createForm() {
    super._createForm();
    this._createSyncButton();

    this.listenTo(
      this._form,
      'submit',
      () => {
        const fieldView = this._form.labeledInput.fieldView;
        const commandValue =
          this.editor.commands.get('imageTextAlternative').value || '';

        // if the asset's alt refTag pattern is present, only show the alt text (without the refTag) in the UI
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
    const hasSyncedAlt = assetAltRefPattern.test(fieldView.element.value);

    fieldView.value = fieldView.element.value = value;
    this._syncButton.isEnabled =
      !hasSyncedAlt && !!this._srcInfo(this._selectedImage());
    this._toggleSyncRowVisibility();
    fieldView.select();
  }

  _visibleAltText(value) {
    return value.replace(assetAltRefPattern, '');
  }

  _toggleSyncRowVisibility() {
    let classes = [...this._syncButtonRow.class];
    const hiddenClassIndex = classes.indexOf('hidden');

    if (!this._syncButton.isEnabled) {
      if (hiddenClassIndex == -1) {
        classes.push('hidden');
      }
    } else {
      if (hiddenClassIndex >= 0) {
        classes.splice(hiddenClassIndex, 1);
      }
    }

    this._syncButtonRow.set('class', classes);
  }

  _selectedImage() {
    const imageUtils = this.editor.plugins.get('ImageUtils');
    return imageUtils.getClosestSelectedImageElement(
      this.editor.model.document.selection,
    );
  }

  _srcInfo(image) {
    if (!image || !image.hasAttribute('src')) {
      return null;
    }

    const match = image.getAttribute('src').match(assetSrcRefPattern);
    if (!match) {
      return null;
    }

    return {
      assetId: match[1],
      siteId: match[2] ?? null,
    };
  }

  _createSyncButton() {
    const editor = this.editor;
    const t = editor.t;
    const syncButton = new ButtonView(editor.locale);

    syncButton.set({
      label: t('Sync from asset'),
      withText: true,
      class: 'btn',
    });
    syncButton.render();

    this.listenTo(syncButton, 'execute', () => this._syncFromAsset());

    const syncButtonRow = new FormRowView(editor.locale, {
      children: [syncButton],
    });

    this._form.children.add(syncButtonRow);
    this._form.focusTracker.add(syncButton.element);
    this._form._focusables.add(syncButton);
    this._syncButton = syncButton;
    this._syncButtonRow = syncButtonRow;
  }

  async _syncFromAsset() {
    const image = this._selectedImage();
    const srcInfo = this._srcInfo(image);

    if (!srcInfo) {
      return;
    }

    let response;
    try {
      response = await Craft.sendActionRequest(
        'POST',
        'ckeditor/ckeditor/image-alt',
        {
          data: {
            assetId: srcInfo.assetId,
            siteId: srcInfo.siteId ?? this.editor.config.get('elementSiteId'),
          },
        },
      );
    } catch (e) {
      Craft.cp.displayError(e?.response?.data?.message);
      throw e;
    }

    const siteId = response.data.siteId ?? srcInfo.siteId;
    const alt = response.data.alt ?? '';
    const value = `${alt}#asset:${srcInfo.assetId}${siteId ? `@${siteId}` : ''}:alt`;
    const fieldView = this._form.labeledInput.fieldView;

    fieldView.value = fieldView.element.value = alt;

    this.editor.execute('imageTextAlternative', {
      newValue: value,
    });

    this._syncButton.isEnabled = false;
    this._toggleSyncRowVisibility();
  }

  destroy() {
    if (this._syncButton) {
      this._syncButton.destroy();
    }

    super.destroy();
  }
}
