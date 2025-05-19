import {
  addListToDropdown,
  ButtonView,
  Collection,
  createDropdown,
  IconPlus,
  ViewModel,
  View,
} from 'ckeditor5';

export default class CraftEntryTypesButtonView extends View {
  constructor(locale, options = {}) {
    super(locale);

    const bind = this.bindTemplate;

    this.set('isFocused', false);

    this.entriesUi = options.entriesUi;
    this.editor = this.entriesUi.editor;
    const insertEntryCommand = this.editor.commands.get('insertEntry');

    let buttons = new Collection();
    let textButtons = new Collection();

    this.entriesUi
      ._getEntryTypeButtonsCollection(options.entryTypeOptions ?? [])
      .forEach((item, index) => {
        let button = new ButtonView();

        if (item.model.expanded) {
          let btnConfig = {
            commandValue: item.model.commandValue, //entry type id
            label: item.model.label,
            withText: item.model.withText,
            tooltip: Craft.t('app', 'New {type}', {
              type: item.model.label,
            }),
          };

          let classes = ['btn', 'ck-reset_all-excluded'];

          if (item.model.icon) {
            classes.push(['icon']);
          }

          if (item.model.icon && item.model.withIcon && !item.model.withText) {
            classes.push(['cp-icon']);
          }

          if (item.model.color) {
            classes.push([item.model.color]);
          }

          btnConfig.class = classes.join(' ');

          if (item.model.withIcon) {
            btnConfig.icon = item.model.icon;
          }

          button.set(btnConfig);
          buttons.add(button);
        } else {
          if (item.model.color && item.model.withColor) {
            if (!item.model.class) {
              item.model.class = '';
            }
            item.model.class += 'icon ' + item.model.color;
          }
          textButtons.add(item);
        }

        // Execute command when a button is clicked
        this.listenTo(button, 'execute', (evt) => {
          this.entriesUi._showCreateEntrySlideout(evt.source.commandValue);
        });

        // the button should be enabled if we have the command
        button.bind('isEnabled').to(insertEntryCommand);
      });

    if (textButtons.length > 0) {
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

      buttons.add(dropdownView);
    }

    this.setTemplate({
      tag: 'div',
      attributes: {
        // ck-reset_all-excluded class is needed so that CKE doesn't mess with the styles we already have
        class: ['entry-type-buttons'],
        tabindex: -1,
      },
      children: buttons,
    });
  }
}
