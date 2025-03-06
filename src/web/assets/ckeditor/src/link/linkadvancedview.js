import {View} from 'ckeditor5';

export default class CraftLinkAdvancedView extends View {
  constructor(locale, options = {}) {
    super(locale);

    const bind = this.bindTemplate;

    this.set('label', Craft.t('app', 'Advanced'));

    this.editor = options.editor;
    this.linkUi = options.linkUi;
    this.advancedLinkFields = options.advancedLinkFields;
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
}
