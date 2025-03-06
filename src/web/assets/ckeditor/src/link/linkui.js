/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

/* global CKE_LOCALIZED_REF_HANDLES */
import {
  addListToDropdown,
  Collection,
  ContextualBalloon,
  createDropdown,
  createLabeledInputText,
  LabeledFieldView,
  LinkUI,
  Plugin,
  Range,
  View,
  ViewModel,
} from 'ckeditor5';
import CraftLinkElementView from './linkelementview.js';
import CraftLinkAdvancedView from './linkadvancedview.js';

export default class CraftLinkUI extends Plugin {
  static get requires() {
    return [LinkUI];
  }

  static get pluginName() {
    return 'CraftLinkUI';
  }

  constructor() {
    super(...arguments);
    // this.siteDropdownView = null;
    // this.siteDropdownItemModels = null;
    // this.localizedRefHandleRE = null;

    this.linkTypeWrapperView = null;

    this.linkTypeDropdownView = null;
    this.linkTypeDropdownItemModels = [];
    this.elementTypeRefHandleRE = null;

    this.urlWithRefHandleRE = null;

    this.conversionData = [];

    this.editor.config.define('linkOptions', []);
    this.editor.config.define('advancedLinkFields', []);
  }

  init() {
    const editor = this.editor;
    this._linkUI = editor.plugins.get(LinkUI);
    this._balloon = editor.plugins.get(ContextualBalloon);
    const linkOptions = editor.config.get('linkOptions');
    const advancedLinkFields = editor.config.get('advancedLinkFields');

    this.conversionData = advancedLinkFields
      .map((field) => field.conversion ?? null)
      .filter((field) => field);

    const refHandlesPattern = CKE_LOCALIZED_REF_HANDLES.join('|');

    // if (Craft.isMultiSite) {
    //   this.localizedRefHandleRE = new RegExp(
    //     `(#(?:${refHandlesPattern}):\\d+)(?:@(\\d+))?`,
    //   );
    // }

    this.elementTypeRefHandleRE = new RegExp(
      `(#((?:${refHandlesPattern})):\\d+)`,
    );

    this.urlWithRefHandleRE = new RegExp(
      `(.+)(#((?:${refHandlesPattern})):(\\d+))(?:@(\\d+))?`,
    );

    this._modifyFormViewTemplate(linkOptions, advancedLinkFields);
  }

  _modifyFormViewTemplate(linkOptions, advancedLinkFields) {
    // ensure the form view template has been defined
    if (!this._linkUI.formView) {
      this._linkUI._createViews();
    }

    const {formView} = this._linkUI;
    const {urlInputView} = formView;
    const {fieldView} = urlInputView;

    // ensure the form view is vertical
    formView.template.attributes.class.push(
      'ck-link-form_layout-vertical',
      'ck-vertical-form',
    );

    if (linkOptions && linkOptions.length) {
      this._linkOptionsDropdown(linkOptions, formView);
    }

    // if (Craft.isMultiSite) {
    //   this._sitesDropdown(formView, fieldView);
    // }

    if (advancedLinkFields && advancedLinkFields.length) {
      this._advancedLinkFields(advancedLinkFields, formView);
    }
  }

  _urlInputValue() {
    return this._linkUI.formView.urlInputView.fieldView.element.value;
  }

  _urlInputRefMatch(regEx) {
    return this._urlInputValue().match(regEx);
  }

  ////////////////////// Sites Dropdown //////////////////////
  /*  _sitesDropdown(formView, fieldView) {
    this.siteDropdownView = createDropdown(formView.locale);
    this.siteDropdownView.buttonView.set({
      label: '',
      withText: true,
      isVisible: false,
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
      const match = this._urlInputRefMatch(this.localizedRefHandleRE);
      if (!match) {
        console.warn(
          `No reference tag hash present in URL: ${this._urlInputValue()}`,
        );
        return;
      }
      const {siteId} = evt.source;
      let ref = match[1];
      if (siteId) {
        ref += `@${siteId}`;
      }
      const newUrl = this._urlInputValue().replace(match[0], ref);
      fieldView.set('value', newUrl);
    });

    const {children} = formView;
    children.add(this.siteDropdownView, children.length - 2);

    // would be better if the dropdown could be added after the URL input
    // but not currently possible since the rest of the inputs get added via LinkFormView::render()
    formView._focusables.add(this.siteDropdownView);
    formView.focusTracker.add(this.siteDropdownView.element);

    this.listenTo(fieldView, 'change:value', () => {
      this._toggleSiteDropdownView();
    });
    this.listenTo(fieldView, 'input', () => {
      this._toggleSiteDropdownView();
    });
  }

  _toggleSiteDropdownView() {
    const match = this._urlInputRefMatch(this.localizedRefHandleRE);
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
      model.set('isOn', model === itemModel);
    });
  }*/

  ////////////////////// Link Options Dropdown (link types) //////////////////////

  _linkOptionsDropdown(linkOptions, formView) {
    const {urlInputView} = formView;
    const {fieldView} = urlInputView;

    // dropdown for link type (asset, category, entry, link & anything else that was registered, like commerce products)
    this.linkTypeDropdownView = createDropdown(formView.locale);

    this.linkTypeDropdownView.buttonView.set({
      label: '',
      withText: true,
      isVisible: true,
    });

    this.linkTypeDropdownItemModels = Object.fromEntries(
      this._getLinkListItemDefinitions(linkOptions).map((item) => [
        item.handle,
        item,
      ]),
    );

    addListToDropdown(
      this.linkTypeDropdownView,
      new Collection([
        ...this._getLinkListItemDefinitions(linkOptions).map((item) => ({
          type: 'button',
          model: this.linkTypeDropdownItemModels[item.handle],
        })),
      ]),
    );

    // once something from the list is selected:
    this.linkTypeDropdownView.on('execute', (evt) => {
      // if an element type was selected - we show the modal
      if (evt.source.linkOption) {
        const linkOption = evt.source.linkOption;
        this._selectLinkTypeDropdownItem(linkOption.refHandle);
        this._showLinkTypeForm(linkOption, formView);
      } else {
        // if the default link (URL) was selected,
        // we want to clear our the input field value, hide sites dropdown and ensure "URL" is selected
        this._selectLinkTypeDropdownItem('default');
        this._showLinkTypeForm('default', formView);
        //fieldView.set('value', '');
        //this.siteDropdownView?.buttonView.set('isVisible', false);
      }
    });

    formView._focusables.add(this.linkTypeDropdownView);
    formView.focusTracker.add(this.linkTypeDropdownView.element);

    this.listenTo(fieldView, 'change:value', () => {
      this._toggleLinkTypeDropdownView();
      const elementType = this._getLinkElementType();
      if (elementType) {
        this._showLinkTypeForm(
          this.linkTypeDropdownItemModels[elementType].linkOption,
          formView,
        );
      } else {
        this._showLinkTypeForm('default', formView);
      }
    });
    this.listenTo(fieldView, 'input', () => {
      this._toggleLinkTypeDropdownView();
    });
  }

  _getLinkElementType() {
    let elementType = null;

    const match = this._urlInputValue().match(this.elementTypeRefHandleRE);

    if (match) {
      elementType = match[2];
      if (
        elementType &&
        typeof this.linkTypeDropdownItemModels[elementType] === 'undefined'
      ) {
        elementType = null;
      }
    }

    return elementType;
  }

  _getLinkElementId() {
    let elementId = null;

    const match = this._urlInputRefMatch(this.urlWithRefHandleRE);
    if (match) {
      elementId = match[4] ? parseInt(match[4], 10) : null;
    }

    return elementId;
  }

  _getLinkSiteId() {
    let siteId = null;

    const match = this._urlInputRefMatch(this.urlWithRefHandleRE);
    if (match) {
      siteId = match[5] ? parseInt(match[5], 10) : null;
    }

    return siteId;
  }

  _toggleLinkTypeDropdownView() {
    let elementType = this._getLinkElementType();

    if (elementType) {
      this.linkTypeDropdownView.buttonView.set('isVisible', true);
      this._selectLinkTypeDropdownItem(elementType);
    } else {
      // if we're adding a new link - pre-select the default link type - URL
      this._selectLinkTypeDropdownItem('default');
    }
  }

  _selectLinkTypeDropdownItem(elementType) {
    const itemModel = this.linkTypeDropdownItemModels[elementType];

    // update the button label
    const label = elementType
      ? Craft.t('app', '{name}', {name: itemModel.label})
      : itemModel.label;
    this.linkTypeDropdownView.buttonView.set('label', label);

    // update the item states
    Object.values(this.linkTypeDropdownItemModels).forEach((model) => {
      model.set('isOn', model.handle === itemModel.handle);
    });
  }

  _getLinkListItemDefinitions(linkOptions) {
    const itemDefinitions = [];

    for (const option of linkOptions) {
      itemDefinitions.push(
        new ViewModel({
          label: option.label,
          handle: option.refHandle,
          linkOption: option,
          withText: true,
        }),
      );
    }

    itemDefinitions.push(
      new ViewModel({
        label: Craft.t('app', 'URL'),
        handle: 'default',
        withText: true,
      }),
    );

    return itemDefinitions;
  }

  _showLinkTypeForm(linkOption, formView) {
    let inputView = null;

    if (linkOption === 'default') {
      inputView = formView.urlInputView;
      inputView.template.attributes.class.push('link-input', 'flex-grow');
    } else {
      let siteId = this._getLinkSiteId();
      let elementId = this._getLinkElementId();
      inputView = new CraftLinkElementView(formView.locale, {
        editor: this.editor,
        linkUi: this,
        linkOption: linkOption,
        value: this._urlInputValue(),
      });
    }

    const {children} = formView;
    const {urlInputView} = formView;
    if (this.linkTypeWrapperView !== null) {
      children.remove(this.linkTypeWrapperView);
    } else {
      children.remove(urlInputView);
    }
    this.linkTypeWrapperView = new View();
    this.linkTypeWrapperView.setTemplate({
      tag: 'div',
      children: [this.linkTypeDropdownView, inputView],
      attributes: {
        class: ['ck', 'link-type-group', 'flex', 'flex-nowrap'],
      },
    });
    children.add(this.linkTypeWrapperView, 0);
  }

  _showElementSelectorModal(linkOption) {
    const editor = this.editor;
    const model = editor.model;
    const selection = model.document.selection;
    const isCollapsed = selection.isCollapsed;
    const range = selection.getFirstRange();

    const onCancel = () => {
      editor.editing.view.focus();
      if (!isCollapsed && range) {
        // Restore the previous range
        model.change((writer) => {
          writer.setSelection(range);
        });
      }
      this._linkUI._hideFakeVisualSelection();
    };

    // When there's no link under the selection, go straight to the editing UI.
    if (!this._linkUI._getSelectedLinkElement()) {
      // Show visual selection on a text without a link when the contextual balloon is displayed.
      // See https://github.com/ckeditor/ckeditor5/issues/4721.
      this._linkUI._showFakeVisualSelection();
    }

    Craft.createElementSelectorModal(linkOption.elementType, {
      storageKey: `ckeditor:${this.pluginName}:${linkOption.elementType}`,
      sources: linkOption.sources,
      criteria: linkOption.criteria,
      defaultSiteId: editor.config.get('elementSiteId'),
      autoFocusSearchBox: false,
      onSelect: (elements) => {
        if (elements.length) {
          const element = elements[0];
          const url = `${element.url}#${linkOption.refHandle}:${element.id}@${element.siteId}`;
          editor.editing.view.focus();

          if (!selection.isCollapsed && range) {
            // Restore the previous range
            model.change((writer) => {
              writer.setSelection(range);
            });
            const linkCommand = editor.commands.get('link');
            linkCommand.execute(url);
          } else {
            model.change((writer) => {
              writer.insertText(
                element.label,
                {
                  linkHref: url,
                },
                selection.getFirstPosition(),
              );
              if (range instanceof Range) {
                try {
                  const newRange = range.clone();
                  newRange.end.path[1] += element.label.length;
                  writer.setSelection(newRange);
                } catch (e) {}
              }
            });
          }

          this._linkUI._hideFakeVisualSelection();
          setTimeout(() => {
            editor.editing.view.focus();
            this._linkUI._showUI(true);
          }, 100);
        } else {
          onCancel();
        }
      },
      onCancel: () => {
        onCancel();
      },
      closeOtherModals: false,
    });
  }

  ////////////////////// Advanced Link Fields //////////////////////

  _advancedLinkFields(advancedLinkFields, formView) {
    this._addAdvancedLinkFieldInputs(advancedLinkFields, formView);
    this._handleAdvancedLinkFieldsFormSubmit(formView);
    this._trackAdvancedLinkFieldsValueChange();
  }

  _addAdvancedLinkFieldInputs(advancedLinkFields, formView) {
    const linkCommand = this.editor.commands.get('link');
    const {children} = formView;

    const advancedView = new CraftLinkAdvancedView(formView.locale, {
      editor: this.editor,
      linkUi: this,
      advancedLinkFields: advancedLinkFields,
    });

    for (const advancedField of advancedLinkFields) {
      let attributeModel = advancedField.conversion?.model;
      if (attributeModel && typeof formView[attributeModel] === 'undefined') {
        let labeledInputView = this._createLabeledField(
          advancedView,
          formView,
          advancedField.label,
          advancedField.info,
        );

        formView[attributeModel] = labeledInputView;
        formView[attributeModel].fieldView
          .bind('value')
          .to(linkCommand, attributeModel);

        formView[attributeModel].fieldView.element.value =
          linkCommand[attributeModel] || '';
      } else if (advancedField.value === 'urlSuffix') {
        let labeledInputView = this._createLabeledField(
          advancedView,
          formView,
          advancedField.label,
          advancedField.info,
        );

        // when you focus out of the urlSuffix field, update the main URL input field value with urlSuffix
        this.listenTo(
          labeledInputView.fieldView,
          'change:isFocused',
          (evt, name, value, oldValue) => {
            if (value !== oldValue && !value) {
              let urlSuffix = evt.source.element.value;

              const match = this._urlInputRefMatch(this.urlWithRefHandleRE);
              if (match) {
                // match[1] is the whole URL that shows before the {refTag}
                let url = new URL(match[1]);
                let search = url.search;
                let hash = url.hash;
                let baseUrl = match[1].replace(hash, '').replace(search, '');

                const newUrl = this._urlInputValue().replace(
                  match[1],
                  baseUrl + urlSuffix,
                );
                formView.urlInputView.fieldView.set('value', newUrl);
              }
            }
          },
        );

        // update the URL Suffix form field when main URL field is loaded
        this.listenTo(formView.urlInputView.fieldView, 'change:value', () => {
          this._toggleUrlSuffixInputView(labeledInputView);
        });

        // update the URL Suffix form field when main URL field value changes (on type)
        this.listenTo(formView.urlInputView.fieldView, 'input', () => {
          this._toggleUrlSuffixInputView(labeledInputView);
        });
      } else if (advancedField.value === 'target') {
        let linkOpenInNewTabDecorator =
          formView._manualDecoratorSwitches._items.filter(
            (item) => item.name === 'linkOpenInNewTab',
          );

        if (linkOpenInNewTabDecorator.length) {
          const {children} = formView;
          linkOpenInNewTabDecorator = linkOpenInNewTabDecorator[0];

          // copied from https://github.com/ckeditor/ckeditor5/blob/v44.2.1/packages/ckeditor5-link/src/ui/linkformview.ts#L339-L363
          const targetDecoratorView = new View();
          targetDecoratorView.setTemplate({
            tag: 'ul',
            children: [
              {
                tag: 'li',
                children: [linkOpenInNewTabDecorator],
                attributes: {
                  class: ['ck', 'ck-list__item'],
                },
              },
            ],
            attributes: {
              class: ['ck', 'ck-reset', 'ck-list'],
            },
          });

          advancedView.advancedChildren.add(targetDecoratorView);
          // advancedView._focusables.add(targetDecoratorView.fieldView);
          // advancedView.focusTracker.add(targetDecoratorView.fieldView.element);
        }
      }
    }

    children.add(advancedView, 1);
    formView._focusables.add(advancedView);
    formView.focusTracker.add(advancedView.element);
  }

  _createLabeledField(advancedView, formView, label, info) {
    // create an input text field with the name of advancedField and matching label
    let labeledInputView = new LabeledFieldView(
      formView.locale,
      createLabeledInputText,
    );
    labeledInputView.label = label;
    if (info) {
      labeledInputView.infoText = info;
    }

    advancedView.advancedChildren.add(labeledInputView);
    formView._focusables.add(labeledInputView.fieldView);
    formView.focusTracker.add(labeledInputView.fieldView.element);
    // advancedView._focusables.add(labeledInputView.fieldView);
    // advancedView.focusTracker.add(labeledInputView.fieldView.element);

    return labeledInputView;
  }

  _toggleUrlSuffixInputView(labeledInputView) {
    const match = this._urlInputRefMatch(this.urlWithRefHandleRE);
    if (match) {
      // match[1] is the whole URL that shows before the {refTag}
      let url = new URL(match[1]);
      let search = url.search;
      let hash = url.hash;

      labeledInputView.fieldView.set('value', search + hash);
    }
  }

  _handleAdvancedLinkFieldsFormSubmit(formView) {
    const editor = this.editor;
    const linkCommand = editor.commands.get('link');
    const attributeModels = this.conversionData.map((field) => field.model);

    formView.on(
      'submit',
      () => {
        let values = {};

        attributeModels.forEach((attributeModel) => {
          let value = [];
          value[attributeModel] =
            formView[attributeModel].fieldView.element.value;
          Object.assign(values, value);
        });

        linkCommand.once(
          'execute',
          (evt, args) => {
            // if there's no extra attrs on the link - add them to the list of args
            if (args.length < 3) {
              args.push(values);
            } else if (args.length === 3) {
              // if we already have extra args on the link - update the list of args
              Object.assign(args[2], values);
            }
          },
          {priority: 'highest'},
        );
      },
      {priority: 'high'},
    );
  }

  _trackAdvancedLinkFieldsValueChange() {
    const editor = this.editor;
    const linkCommand = editor.commands.get('link');
    const selection = editor.model.document.selection;

    this.conversionData.forEach((item) => {
      linkCommand.set(item.model, null);

      editor.model.document.on('change', () => {
        linkCommand[item.model] = selection.getAttribute(item.model);
      });
    });
  }
}
