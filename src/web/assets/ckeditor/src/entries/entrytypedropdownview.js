import {
  addListToDropdown,
  Collection,
  createDropdown,
  IconPlus,
  View,
} from 'ckeditor5';

export default class CraftEntryTypesButtonView extends View {
  constructor(locale, options = {}) {
    super(locale);

    const bind = this.bindTemplate;

    this.set('isFocused', false);

    this.entriesUi = options.entriesUi;
    this.editor = this.entriesUi.editor;
    const entryTypes = options.entryTypes;
    const insertEntryCommand = this.editor.commands.get('insertEntry');

    let textButtons = new Collection();
    entryTypes.forEach((item) => {
      if (item.model.color) {
        if (!item.model.class) {
          item.model.class = '';
        }
        item.model.class += 'icon ' + item.model.color; // the icon class is needed for the color to work
      }
      textButtons.add(item);
    });

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

    addListToDropdown(dropdownView, () => textButtons, {
      ariaLabel: Craft.t('ckeditor', 'Entry types list'),
    });

    // Execute command when an item from the dropdown is selected.
    this.listenTo(dropdownView, 'execute', (evt) => {
      this.entriesUi._showCreateEntrySlideout(evt.source.commandValue);
    });

    this.setTemplate({
      tag: 'div',
      attributes: {
        // ck-reset_all-excluded class is needed so that CKE doesn't mess with the styles we already have
        class: ['entry-type-button'],
      },
      children: [dropdownView],
    });
  }

  // this is needed so that the dropdown button is focusable
  focus() {
    // first child is the .ck-dropdown and the second is the actual button (.ck-dropdown__button) that we want the focus on
    this.element.children[0].children[0].focus();
  }
}
