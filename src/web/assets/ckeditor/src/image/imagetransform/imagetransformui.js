/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

import {Plugin, icons} from 'ckeditor5/src/core';
import {
  DropdownButtonView,
  ViewModel,
  createDropdown,
  addListToDropdown,
} from 'ckeditor5/src/ui';
import {Collection} from 'ckeditor5/src/utils';
import ImageTransformEditing from './imagetransformediting';

const RESIZE_ICON = icons.objectSizeMedium;

export default class ImageTransformUI extends Plugin {
  static get requires() {
    return [ImageTransformEditing];
  }

  static get pluginName() {
    return 'ImageTransformUI';
  }

  init() {
    const editor = this.editor;
    const transforms = editor.config.get('transforms');
    const command = editor.commands.get('transformImage');
    this.bind('isEnabled').to(command);
    this._registerImageTransformDropdown(transforms);
  }

  /**
   * A helper function that creates a dropdown component for the plugin containing all the transform options defined in
   * the editor configuration.
   *
   * @param transforms An array of the available image transforms.
   */
  _registerImageTransformDropdown(transforms) {
    const editor = this.editor;
    const t = editor.t;
    const originalSizeOption = {
      name: 'transformImage:original',
      value: null,
    };
    const options = [
      originalSizeOption,
      ...transforms.map((transform) => ({
        label: transform.name,
        name: `transformImage:${transform.handle}`,
        value: transform.handle,
      })),
    ];
    const componentCreator = (locale) => {
      const command = editor.commands.get('transformImage');
      const dropdownView = createDropdown(locale, DropdownButtonView);
      const dropdownButton = dropdownView.buttonView;
      dropdownButton.set({
        tooltip: t('Resize image'),
        commandValue: null,
        icon: RESIZE_ICON,
        isToggleable: true,
        label: this._getOptionLabelValue(originalSizeOption),
        withText: true,
        class: 'ck-resize-image-button',
      });
      dropdownButton.bind('label').to(command, 'value', (commandValue) => {
        if (!commandValue || !commandValue.transform) {
          return this._getOptionLabelValue(originalSizeOption);
        }
        const transform = transforms.find(
          (t) => t.handle === commandValue.transform,
        );
        if (transform) {
          return transform.name;
        }
        return commandValue.transform;
      });
      dropdownView.bind('isEnabled').to(this);
      addListToDropdown(
        dropdownView,
        () => this._getTransformDropdownListItemDefinitions(options, command),
        {
          ariaLabel: t('Image resize list'),
        },
      );
      // Execute command when an item from the dropdown is selected.
      this.listenTo(dropdownView, 'execute', (evt) => {
        editor.execute(evt.source.commandName, {
          transform: evt.source.commandValue,
        });
        editor.editing.view.focus();
      });
      return dropdownView;
    };
    editor.ui.componentFactory.add('transformImage', componentCreator);
  }

  /**
   * A helper function for creating an option label value string.
   *
   * @param option A transform option object.
   * @returns The option label.
   */
  _getOptionLabelValue(option) {
    return option.label || option.value || this.editor.t('Original');
  }

  /**
   * A helper function that parses the transform options and returns list item definitions ready for use in the dropdown.
   *
   * @param options The transform options.
   * @param command The transform image command.
   * @returns Dropdown item definitions.
   */
  _getTransformDropdownListItemDefinitions(options, command) {
    const itemDefinitions = new Collection();
    options.map((option) => {
      const definition = {
        type: 'button',
        model: new ViewModel({
          commandName: 'transformImage',
          commandValue: option.value,
          label: this._getOptionLabelValue(option),
          withText: true,
          icon: null,
        }),
      };
      definition.model
        .bind('isOn')
        .to(command, 'value', getIsOnButtonCallback(option.value));
      itemDefinitions.add(definition);
    });
    return itemDefinitions;
  }
}

/**
 * A helper function for setting the `isOn` state of buttons in value bindings.
 */
function getIsOnButtonCallback(value) {
  return (commandValue) => {
    const objectCommandValue = commandValue;
    if (value === null && objectCommandValue === value) {
      return true;
    }
    return (
      objectCommandValue !== null && objectCommandValue.transform === value
    );
  };
}
