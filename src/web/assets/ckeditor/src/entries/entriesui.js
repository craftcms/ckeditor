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
        items.forEach((entry) => {
          if (entry.length !== 0) {
            editor.commands.execute('insertEntry', {
              entryId: entry.id,
              siteId: entry.siteId,
              cardHtml: entry.$element[0].outerHTML,
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
}
