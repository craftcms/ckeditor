/* global CKE_LOCALIZED_REF_HANDLES */
import {
  addListToDropdown,
  ButtonView,
  Collection,
  createDropdown,
  View,
  ViewModel,
} from 'ckeditor5';

export default class CraftLinkSitesView extends View {
  constructor(locale, options = {}) {
    super(locale);

    const bind = this.bindTemplate;

    this.set('isFocused', false);

    this.linkUi = options.linkUi;
    this.editor = this.linkUi.editor;
    this.elementId = this.linkUi._getLinkElementId();
    this.siteId = this.linkUi._getLinkSiteId();
    this.linkOption = options.linkOption;
    const elementRefHandle = this.linkUi._getLinkElementRefHandle();

    this.siteDropdownView = createDropdown(this.linkUi._linkUI.formView.locale);
    this.siteDropdownItemModels = null;
    this.localizedRefHandleRE = null;

    const refHandlesPattern = CKE_LOCALIZED_REF_HANDLES.join('|');
    this.localizedRefHandleRE = new RegExp(
      `(#(?:${refHandlesPattern}):\\d+)(?:@(\\d+))?`,
    );

    this.setTemplate({
      tag: 'div',
      attributes: {
        // ck-reset_all-excluded class is needed so that CKE doesn't mess with the styles we already have
        class: ['sites-dropdown', 'ck-reset_all-excluded'],
        tabindex: 0,
      },
      children: [this.siteDropdownView],
    });
  }

  // this is needed so that the '.elementselect' is focusable
  focus() {
    this.element.focus();
  }

  render() {
    super.render();

    this._sitesDropdown();
  }

  _sitesDropdown() {
    const {formView} = this.linkUi._linkUI;
    const {urlInputView} = formView;
    const {fieldView} = urlInputView;

    this.siteDropdownView.buttonView.set({
      label: '',
      withText: true,
      isVisible: true,
    });

    this.siteDropdownItemModels = Object.fromEntries(
      Craft.sites.map((site) => [
        site.id,
        new ViewModel({
          label: site.name,
          siteId: site.id,
          withText: true,
        }),
      ]),
    );

    this.siteDropdownItemModels.current = new ViewModel({
      label: Craft.t('ckeditor', 'Link to the current site'),
      siteId: null,
      withText: true,
    });

    addListToDropdown(
      this.siteDropdownView,
      new Collection([
        ...Craft.sites.map((site) => ({
          type: 'button',
          model: this.siteDropdownItemModels[site.id],
        })),
        {
          type: 'button',
          model: this.siteDropdownItemModels.current,
        },
      ]),
    );

    this.siteDropdownView.on('execute', (evt) => {
      const match = this.linkUi._urlInputRefMatch(this.localizedRefHandleRE);
      if (!match) {
        console.warn(
          `No reference tag hash present in URL: ${this.linkUi._urlInputValue()}`,
        );
        return;
      }
      const {siteId} = evt.source;
      let ref = match[1];
      if (siteId) {
        ref += `@${siteId}`;
      }
      this.linkUi.previousLinkValue = this.linkUi._urlInputValue();
      const newUrl = this.linkUi._urlInputValue().replace(match[0], ref);
      formView.urlInputView.fieldView.set('value', newUrl);
      this._toggleSiteDropdownView();
    });

    this.listenTo(fieldView, 'change:value', () => {
      // e.g. when the view loads
      this._toggleSiteDropdownView();
    });
    this.listenTo(fieldView, 'input', () => {
      // e.g. when you switch to URL and edit the value manually
      this._toggleSiteDropdownView();
    });
  }

  _toggleSiteDropdownView() {
    const match = this.linkUi._urlInputRefMatch(this.localizedRefHandleRE);
    if (match) {
      this.siteDropdownView.buttonView.set('isVisible', true);
      let siteId = match[2] ? parseInt(match[2], 10) : null;
      if (
        siteId &&
        typeof this.siteDropdownItemModels[siteId] === 'undefined'
      ) {
        siteId = null;
      }
      this._selectSiteDropdownItem(siteId);
      this.siteDropdownView.buttonView.set('isVisible', true);
    } else {
      this.siteDropdownView.buttonView.set('isVisible', false);
    }
  }

  _selectSiteDropdownItem(siteId) {
    const itemModel = this.siteDropdownItemModels[siteId ?? 'current'];

    // update the button label
    const label = siteId
      ? Craft.t('ckeditor', 'Site: {name}', {name: itemModel.label})
      : itemModel.label;

    this.siteDropdownView.buttonView.set('label', label);

    // update the item states
    Object.values(this.siteDropdownItemModels).forEach((model) => {
      model.set('isOn', model.siteId === itemModel.siteId);
    });
  }
}
