import {icons, Plugin} from 'ckeditor5/src/core';
import {
  addListToDropdown,
  ButtonView,
  createDropdown,
  DropdownButtonView,
  Model,
} from 'ckeditor5/src/ui';
import {Range} from 'ckeditor5/src/engine';
import {Collection} from 'ckeditor5/src/utils';

export default class CraftEntriesUI extends Plugin {
  static get pluginName() {
    return 'CraftEntriesUI';
  }

  init() {
    this.editor.ui.componentFactory.add('insertEntryBtn', (locale) => {
      return this._createToolbarEntriesButton(locale);
    });
  }

  _createToolbarEntriesButton(locale) {
    const editor = this.editor;
    const entryTypeOptions = editor.config.get('entryTypeOptions');
    const insertEntryCommand = editor.commands.get('insertEntry');

    if (!entryTypeOptions || !entryTypeOptions.length) {
      return;
    }

    const dropdownView = createDropdown(locale, DropdownButtonView);
    const dropdownButton = dropdownView.buttonView;
    dropdownButton.set({
      isEnabled: true,
      label: Craft.t('ckeditor', 'Insert entry'),
      //icon: , // TODO: do we have an icon we'd like to use?
      tooltip: true,
      withText: true,
      //commandValue: null,
    });

    dropdownView.bind('isEnabled').to(insertEntryCommand);
    addListToDropdown(
      dropdownView,
      () => this._getDropdownListItems(entryTypeOptions, insertEntryCommand),
      {
        ariaLabel: Craft.t('ckeditor', 'Entry types list'),
      },
    );
    // Execute command when an item from the dropdown is selected.
    this.listenTo(dropdownView, 'execute', (evt) => {
      this._showCreateEntrySlideout(evt.source.commandValue);
    });

    return dropdownView;
  }

  _getDropdownListItems(options, command) {
    const itemDefinitions = new Collection();
    options.map((option) => {
      const definition = {
        type: 'button',
        model: new Model({
          commandName: 'insertEntry',
          commandValue: option.value,
          label: option.label || option.value,
          withText: true,
          icon: null,
        }),
      };
      itemDefinitions.add(definition);
    });
    return itemDefinitions;
  }

  _showCreateEntrySlideout(entryTypeId) {
    const editor = this.editor;
    // const model = editor.model;
    // const selection = model.document.selection;
    // const isCollapsed = selection.isCollapsed;
    // const range = selection.getFirstRange();
    const entryTypeOptions = editor.config.get('entryTypeOptions')[0];
    const nestedElementAttributes = editor.config.get(
      'nestedElementAttributes',
    );

    Craft.sendActionRequest('POST', 'elements/create', {
      data: Object.assign(nestedElementAttributes, {
        typeId: entryTypeId,
      }),
    })
      .then(({data}) => {
        const slideout = Craft.createElementEditor(this.elementType, {
          siteId: data.element.siteId,
          elementId: data.element.id,
          draftId: data.element.draftId,
          params: {
            fresh: 1,
          },
        });
        slideout.on('submit', (ev) => {
          editor.commands.execute('insertEntry', {
            entryId: ev.data.id,
            siteId: ev.data.siteId,
          });
        });
      })
      .catch(({response}) => {
        Craft.cp.displayError((response.data && response.data.error) || null);
      });
  }
}
