import {createDropdown, IconPlus, View} from 'ckeditor5';

export default class CraftFakeEntryTypeButtonView extends View {
  constructor(locale, options = {}) {
    super(locale);

    const bind = this.bindTemplate;

    this.set('isFocused', false);

    this.entriesUi = options.entriesUi;
    this.editor = this.entriesUi.editor;
    const insertEntryCommand = this.editor.commands.get('insertEntry');

    const dropdownView = createDropdown(locale);
    dropdownView.buttonView.set({
      label: Craft.t('ckeditor', 'Add nested content'),
      icon: IconPlus,
      tooltip: true,
      withText: false,
    });

    // the dropdown should be enabled if we have the command
    dropdownView.bind('isEnabled').to(insertEntryCommand);
    dropdownView.id = Craft.uuid();

    // Execute command when an item from the dropdown is selected.
    this.listenTo(dropdownView, 'execute', (evt) => {
      this.entriesUi._showCreateEntrySlideout(evt.source.commandValue);
    });

    this.setTemplate({
      tag: 'div',
      attributes: {
        // ck-reset_all-excluded class is needed so that CKE doesn't mess with the styles we already have
        class: ['entry-type-button'],
        tabindex: -1,
      },
      children: [dropdownView],
    });
  }

  // this is needed so that the button is focusable
  focus() {
    this.element.focus();
  }
}
