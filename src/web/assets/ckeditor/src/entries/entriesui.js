import {icons, Plugin} from 'ckeditor5/src/core';
import {ButtonView} from 'ckeditor5/src/ui';
import {Range} from 'ckeditor5/src/engine';

export default class CraftEntriesUI extends Plugin {
  static get pluginName() {
    return 'CraftEntriesUI';
  }

  init() {
    const editor = this.editor;
    const t = editor.t;

    const componentFactory = this.editor.ui.componentFactory;
    const componentCreator = (locale) => {
      return this._createToolbarEntriesButton(locale);
    };
    componentFactory.add('insertEntryBtn', componentCreator);
  }

  _createToolbarEntriesButton(locale) {
    const editor = this.editor;
    const entryOptions = editor.config.get('entryOptions');

    if (!entryOptions || !entryOptions.length) {
      return;
    }

    const t = editor.t;
    const button = new ButtonView(locale);
    button.isEnabled = true;
    button.label = t('Insert entry');
    //button.icon = ; // TODO: do we have an icon we'd like to use?
    button.tooltip = true;
    button.withText = true;

    const insertEntryCommand = editor.commands.get('insertEntry');
    button.bind('isEnabled').to(insertEntryCommand);

    this.listenTo(button, 'execute', () => this._showEntrySelectorModal());

    return button;
  }

  _showEntrySelectorModal() {
    const editor = this.editor;
    const model = editor.model;
    const selection = model.document.selection;
    const isCollapsed = selection.isCollapsed;
    const range = selection.getFirstRange();
    const entryOptions = this.editor.config.get('entryOptions')[0];

    const onCancel = () => {
      console.log('called ui onCancel');
      editor.editing.view.focus();
      if (!isCollapsed && range) {
        // Restore the previous range
        model.change((writer) => {
          writer.setSelection(range);
        });
      }
    };

    Craft.createElementSelectorModal(entryOptions.elementType, {
      storageKey: `ckeditor:${this.pluginName}:${entryOptions.elementType}`,
      sources: entryOptions.sources,
      criteria: Object.assign({}, entryOptions.criteria),
      defaultSiteId: editor.config.get('elementSiteId'),
      multiSelect: true,
      autoFocusSearchBox: false,
      onSelect: (items) => {
        console.log(items);
        // TODO: do we really need to re-grab all that data from the DB? maybe that's just needed on downcasting but not here?
        // this._processEntriesForCards(items).then(() => {
        //   editor.editing.view.focus();
        // });

        items.forEach((entry) => {
          if (entry.length !== 0) {
            editor.commands.execute('insertEntry', {
              entryId: entry.id,
              siteId: entry.siteId,
              label: entry.$element[0].innerHTML,
            });
          }
        });
      },
      onCancel: () => {
        onCancel();
      },
      onHide: () => {
        editor.editing.view.focus();
      },
      closeOtherModals: false,
    });
  }

  // _processEntriesForCards(items) {
  //   return new Promise((resolve) => {
  //     if (!items.length) {
  //       resolve();
  //       return [];
  //     }
  //
  //     const editor = this.editor;
  //     let pairs = [];
  //
  //     items.forEach((item) => {
  //       pairs.push({
  //         'entryId': item.id,
  //         'siteId': item.siteId,
  //       });
  //     });
  //
  //     Craft.sendActionRequest('POST', 'ckeditor/ckeditor/entry-cards', {
  //       data: {
  //         pairs: pairs,
  //       },
  //     })
  //     .then(({data}) => {
  //       data.forEach((entry) => {
  //         if (entry.length !== 0) {
  //           editor.commands.execute('insertEntry', {
  //             entryId: entry.id,
  //             siteId: entry.siteId,
  //             label: entry.title,
  //             // cpEditUrl: '',
  //           });
  //         }
  //       });
  //     })
  //     .catch((e) => {
  //       // TODO: how do we want to handle this?
  //       console.log(e);
  //       alert('There was an error getting entries for the cards.');
  //     });
  //   });
  // }
}
