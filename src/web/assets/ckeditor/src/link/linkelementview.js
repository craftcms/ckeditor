import {ButtonView, View} from 'ckeditor5';

export default class CraftLinkElementView extends View {
  constructor(locale, options = {}) {
    super(locale);

    const bind = this.bindTemplate;

    this.set('isFocused', false);

    const linkUi = options.linkUi;
    const {formView} = linkUi._linkUI;
    const match = linkUi._urlInputValue().match(linkUi.elementTypeRefHandleRE);
    let button = null;

    if (match) {
      const itemModel = linkUi.linkTypeDropdownItemModels[match[2]];
      if (linkUi.linkTypeDropdownView.buttonView.label == itemModel.label) {
        button = 'show element chip';
      }
    }

    if (button == null) {
      button = new ButtonView();

      button.set({
        label: Craft.t('app', 'Choose'),
        withText: true,
        class: 'btn add icon dashed',
      });
    }

    this.setTemplate({
      tag: 'div',
      attributes: {
        class: ['elementselect'],
      },
      children: [button],
    });
  }
}
