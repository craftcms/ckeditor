import {View} from 'ckeditor5';

export default class CraftLinkAdvancedView extends View {
  constructor(locale, options = {}) {
    super(locale);

    const bind = this.bindTemplate;

    this.set('label', Craft.t('app', 'Advanced'));

    this.linkUi = options.linkUi;
    this.editor = this.linkUi.editor;
    this.children = this.createCollection();
    this.advancedChildren = this.createCollection();

    // https://ckeditor.com/docs/ckeditor5/latest/api/module_ui_collapsible_collapsibleview-CollapsibleView.html
    // using details & summary tags as per: https://github.com/ckeditor/ckeditor5/issues/8457
    this.setTemplate({
      tag: 'details',
      attributes: {
        class: ['ck', 'ck-form__details', 'link-type-advanced'],
      },
      children: this.children,
    });

    // summary is needed so that the toggleable name (label) can be set to 'Advanced',
    // and not the default 'Details'
    this.summary = new View(locale);
    this.summary.setTemplate({
      tag: 'summary',
      attributes: {
        class: ['ck', 'ck-form__details__summary'],
      },
      children: [{text: bind.to('label')}],
    });
    this.children.add(this.summary);

    // and this is the container for the advanced link fields
    this.advancedFieldsContainer = new View(locale);
    this.advancedFieldsContainer.setTemplate({
      tag: 'div',
      attributes: {
        class: ['meta', 'pane', 'hairline'],
      },
      children: this.advancedChildren,
    });
    this.children.add(this.advancedFieldsContainer);
  }

  // this is needed so that the "Advanced" summary is focused when you tab into the details container
  focus() {
    this.summary.element.focus();
  }

  render() {
    super.render();

    // this is needed to control the focus order
    this.element.addEventListener('toggle', this.onToggle.bind(this));
  }

  // this is needed to control the focus order
  onToggle(evt) {
    const {formView} = this.linkUi._linkUI;
    if (evt.target.open) {
      // get tab index position of the details.link-type-advanced container
      const advancedIndex = formView._focusables.getIndex(this);
      // and now inject the fields that we just revealed into the focus order
      this.advancedChildren._items.forEach((advancedChild, i) => {
        formView._focusables.add(advancedChild, advancedIndex + i + 1);
        formView.focusTracker.add(advancedChild.element, advancedIndex + i + 1);
      });
    } else {
      // and now that the fields are hidden, remove them from the focus order
      this.advancedChildren._items.forEach((advancedChild, i) => {
        formView._focusables.remove(advancedChild);
        formView.focusTracker.remove(advancedChild.element);
      });
    }
  }
}
