import {ButtonView, View} from 'ckeditor5';

export default class CraftEntryTypeButtonView extends View {
  constructor(locale, options = {}) {
    super(locale);

    this.set('isFocused', false);

    this.entriesUi = options.entriesUi;
    this.editor = this.entriesUi.editor;
    this.entryType = options.entryType;
    const insertEntryCommand = this.editor.commands.get('insertEntry');

    let button = new ButtonView();

    let btnConfig = {
      commandValue: this.entryType.model.commandValue, //entry type id
      label: this.entryType.model.label,
      withText: !this.entryType.model.icon,
      tooltip: Craft.t('app', 'New {type}', {
        type: this.entryType.model.label,
      }),
    };

    let classes = ['btn', 'ck-reset_all-excluded'];

    if (this.entryType.model.icon) {
      classes.push(['icon', 'cp-icon']);
    }

    btnConfig.class = classes.join(' ');

    if (this.entryType.model.withIcon) {
      btnConfig.icon = this.entryType.model.icon;
    }

    button.set(btnConfig);

    // Execute command when a button is clicked
    this.listenTo(button, 'execute', (evt) => {
      this.entriesUi._showCreateEntrySlideout(evt.source.commandValue);
    });

    // the button should be enabled if we have the command
    button.bind('isEnabled').to(insertEntryCommand);

    this.setTemplate({
      tag: 'div',
      attributes: {
        // ck-reset_all-excluded class is needed so that CKE doesn't mess with the styles we already have
        class: ['entry-type-button'],
      },
      children: [button],
    });
  }

  // this is needed so that the button is focusable
  focus() {
    this.element.children[0].focus();
  }
}
