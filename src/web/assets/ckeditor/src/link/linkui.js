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
  SwitchButtonView,
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
    this.advancedView = null;

    this.linkTypeDropdownView = null;
    this.linkTypeDropdownItemModels = [];
    this.elementTypeRefHandleRE = null;

    this.urlWithRefHandleRE = null;

    this.conversionData = [];
    this.linkOptions = [];
    this.advancedLinkFields = [];

    this.editor.config.define('linkOptions', []);
    this.editor.config.define('advancedLinkFields', []);
  }

  init() {
    const editor = this.editor;
    this._linkUI = editor.plugins.get(LinkUI);
    this._balloon = editor.plugins.get(ContextualBalloon);
    this.linkOptions = editor.config.get('linkOptions');
    this.advancedLinkFields = editor.config.get('advancedLinkFields');

    this.conversionData = this.advancedLinkFields
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

    this._modifyFormViewTemplate();

    this._balloon.on(
      'set:visibleView',
      (evt, propertyName, newValue, oldValue) => {
        const formView = this._linkUI.formView;
        if (newValue === oldValue || newValue !== formView) {
          return;
        }

        this._alignFocus(formView);
      },
    );
  }

  _alignFocus(formView) {
    // get all the form view items in the right focus order
    let i = 0;
    if (this.linkTypeWrapperView) {
      // this takes care of the linkTypeDropdownView and the urlInputView or element selector/card
      this.linkTypeWrapperView._unboundChildren._items.forEach((item) => {
        if (formView._focusables.has(item)) {
          formView._focusables.remove(item);
        }
        formView.focusTracker.remove(item.element);

        formView._focusables.add(item, i);
        formView.focusTracker.add(item.element, i);
        i++;
      });

      if (this.advancedView !== null) {
        // this takes care of the advanced link field toggle ("Advanced")
        // the items inside the toggle are controlled from linkadvancedview.onToggle()
        if (formView._focusables.has(this.advancedView)) {
          formView._focusables.remove(this.advancedView);
        }
        formView.focusTracker.remove(this.advancedView);

        formView._focusables.add(this.advancedView, i);
        formView.focusTracker.add(this.advancedView.element, i);
      }
    }
  }

  _modifyFormViewTemplate() {
    // ensure the form view template has been defined
    if (!this._linkUI.formView) {
      this._linkUI._createViews();
    }

    const {formView} = this._linkUI;

    // ensure the form view is vertical
    formView.template.attributes.class.push(
      'ck-link-form_layout-vertical',
      'ck-vertical-form',
    );

    if (this.linkOptions && this.linkOptions.length) {
      this._linkOptionsDropdown();
    }

    // if (Craft.isMultiSite) {
    //   this._sitesDropdown(formView, fieldView);
    // }

    if (this.advancedLinkFields && this.advancedLinkFields.length) {
      this._advancedLinkFields();
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

  _linkOptionsDropdown() {
    const {formView} = this._linkUI;
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
      this._getLinkListItemDefinitions().map((item) => [item.handle, item]),
    );

    addListToDropdown(
      this.linkTypeDropdownView,
      new Collection([
        ...this._getLinkListItemDefinitions().map((item) => ({
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
        this._showLinkTypeForm('default');
      }
    });

    // if the default URL field is empty, initialise showing link type form,
    // so that the linkTypeWrapperView gets initialised and we can control the focus order from the beginning
    if (fieldView.isEmpty) {
      this._showLinkTypeForm('default');
    }

    this.listenTo(fieldView, 'change:value', () => {
      this._toggleLinkTypeDropdownView();
      const elementRefHandle = this._getLinkElementRefHandle();
      if (elementRefHandle) {
        this._showLinkTypeForm(
          this.linkTypeDropdownItemModels[elementRefHandle].linkOption,
        );
      } else {
        this._showLinkTypeForm('default');
      }
    });
    this.listenTo(fieldView, 'input', () => {
      this._toggleLinkTypeDropdownView();
    });
  }

  _getLinkElementRefHandle() {
    let elementRefHandle = null;

    const match = this._urlInputValue().match(this.elementTypeRefHandleRE);

    if (match) {
      elementRefHandle = match[2];
      if (
        elementRefHandle &&
        typeof this.linkTypeDropdownItemModels[elementRefHandle] === 'undefined'
      ) {
        elementRefHandle = null;
      }
    }

    return elementRefHandle;
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
    let elementRefHandle = this._getLinkElementRefHandle();

    if (elementRefHandle) {
      this.linkTypeDropdownView.buttonView.set('isVisible', true);
      this._selectLinkTypeDropdownItem(elementRefHandle);
    } else {
      // if we're adding a new link - pre-select the default link type - URL
      this._selectLinkTypeDropdownItem('default');
    }
  }

  _selectLinkTypeDropdownItem(elementRefHandle) {
    const itemModel = this.linkTypeDropdownItemModels[elementRefHandle];

    // update the button label
    const label = elementRefHandle
      ? Craft.t('app', '{name}', {name: itemModel.label})
      : itemModel.label;
    this.linkTypeDropdownView.buttonView.set('label', label);

    // update the item states
    Object.values(this.linkTypeDropdownItemModels).forEach((model) => {
      model.set('isOn', model.handle === itemModel.handle);
    });
  }

  _getLinkListItemDefinitions() {
    const itemDefinitions = [];

    for (const option of this.linkOptions) {
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

  _showLinkTypeForm(linkOption) {
    let inputView = null;
    const {formView} = this._linkUI;
    const {children} = formView;
    const {urlInputView} = formView;
    const {displayedTextInputView} = formView;

    // set focus on the "displayed text" input
    displayedTextInputView.focus();

    // a selection was made in the link type dropdown
    if (this.linkTypeWrapperView !== null) {
      // so we have to remove the previous link type form
      children.remove(this.linkTypeWrapperView);
    }

    // if default URL was selected, we need to give it extra classes
    if (linkOption === 'default') {
      inputView = urlInputView;
    } else {
      // otherwise we need to create the Element view,
      // which will be either the button to choose an element or an element card
      let siteId = this._getLinkSiteId();
      let elementId = this._getLinkElementId();
      inputView = new CraftLinkElementView(formView.locale, {
        linkUi: this,
        linkOption: linkOption,
        value: this._urlInputValue(),
      });
    }

    // and now we can construct the container that has the link type dropdown and the corresponding input field
    this.linkTypeWrapperView = new View();
    this.linkTypeWrapperView.setTemplate({
      tag: 'div',
      children: [this.linkTypeDropdownView, inputView],
      attributes: {
        class: [
          'ck',
          'ck-form__row',
          'ck-form__row_large-top-padding',
          'link-type-group',
          'flex',
        ],
      },
    });

    children.add(this.linkTypeWrapperView, 2);
  }

  _showElementSelectorModal(linkOption) {
    const editor = this.editor;
    const model = editor.model;
    const selection = model.document.selection;
    const isCollapsed = selection.isCollapsed;
    const range = selection.getFirstRange();
    const currentLinkElement = this._linkUI._getSelectedLinkElement();

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
    if (!currentLinkElement) {
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

          if ((!isCollapsed || currentLinkElement) && range) {
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
            if (!currentLinkElement) {
              this._linkUI._showUI(true);
            }
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

  _advancedLinkFields() {
    this._addAdvancedLinkFieldInputs();
    this._handleAdvancedLinkFieldsFormSubmit();
    this._trackAdvancedLinkFieldsValueChange();
  }

  _addAdvancedLinkFieldInputs() {
    const linkCommand = this.editor.commands.get('link');
    const {formView} = this._linkUI;
    const {children} = formView;

    this.advancedView = new CraftLinkAdvancedView(formView.locale, {
      linkUi: this,
    });

    children.add(this.advancedView, 3);

    for (const advancedField of this.advancedLinkFields) {
      let attributeModel = advancedField.conversion?.model;
      if (attributeModel && typeof formView[attributeModel] === 'undefined') {
        if (advancedField.conversion.type === 'bool') {
          const switchButtonView = new SwitchButtonView();

          switchButtonView.set({
            withText: true,
            label: advancedField.label,
            isToggleable: true,
          });

          if (advancedField.tooltip) {
            switchButtonView.tooltip = advancedField.tooltip;
          }

          this.advancedView.advancedChildren.add(switchButtonView);

          formView[attributeModel] = switchButtonView;

          formView[attributeModel]
            .bind('isOn')
            .to(linkCommand, attributeModel, (commandValue) => {
              if (commandValue === undefined) {
                // set the initial toggle value to off after the page reload
                formView[attributeModel].element.value = '';
                return false;
              } else {
                // set the initial toggle value to on after the page reload
                formView[attributeModel].element.value =
                  advancedField.conversion.value;
                return true;
              }
            });

          // this makes the switch toggle
          switchButtonView.on('execute', () => {
            if (!switchButtonView.isOn) {
              switchButtonView.isOn = true;
              formView[attributeModel].element.value =
                advancedField.conversion.value;
            } else {
              switchButtonView.isOn = false;
              formView[attributeModel].element.value = '';
            }
          });
        } else {
          let labeledInputView = this._addLabeledField(advancedField);

          formView[attributeModel] = labeledInputView;

          formView[attributeModel].fieldView
            .bind('value')
            .to(linkCommand, attributeModel);

          formView[attributeModel].fieldView.element.value =
            linkCommand[attributeModel] || '';
        }
      } else if (advancedField.value === 'urlSuffix') {
        let labeledInputView = this._addLabeledField(advancedField);

        // when you focus out of the urlSuffix field, update the main URL input field value with urlSuffix
        this.listenTo(
          labeledInputView.fieldView,
          'change:isFocused',
          (evt, name, value, oldValue) => {
            if (value !== oldValue && !value) {
              let urlSuffix = evt.source.element.value;
              let inputValue = null;

              const match = this._urlInputRefMatch(this.urlWithRefHandleRE);
              if (match) {
                // match[1] is the whole URL that shows before the {refTag}
                inputValue = match[1];
              } else {
                // if no match found then it's a "regular" link, e.g. https://craftcms.com or a relative one e.g. /my-page
                inputValue = this._urlInputValue();
              }

              // check if it's a "valid" absolute URL, if yes - proceed as with the matches,
              // if not still extract query params and anchor
              try {
                let url = new URL(inputValue);
                let search = url.search;
                let hash = url.hash;
                let baseUrl = inputValue.replace(hash, '').replace(search, '');

                const newUrl = this._urlInputValue().replace(
                  inputValue,
                  baseUrl + urlSuffix,
                );
                formView.urlInputView.fieldView.set('value', newUrl);
              } catch (e) {
                // it might be a relative URL, and we still need to proceed
                // get the path, query params and anchor
                let [base, hash] = inputValue.split('#');
                let [path, search] = base.split('?');

                const newUrl = this._urlInputValue().replace(
                  inputValue,
                  path + urlSuffix,
                );
                formView.urlInputView.fieldView.set('value', newUrl);
              }
            }
          },
        );

        // update the URL Suffix form field when main URL field is loaded
        this.listenTo(formView.urlInputView.fieldView, 'change:value', (ev) => {
          this._toggleUrlSuffixInputView(labeledInputView, ev.source.isEmpty);
        });

        // update the URL Suffix form field when main URL field is focused into and out of
        this.listenTo(
          formView.urlInputView.fieldView,
          'change:isFocused',
          (ev) => {
            this._toggleUrlSuffixInputView(labeledInputView, ev.source.isEmpty);
          },
        );
      }
    }
  }

  _addLabeledField(advancedField) {
    const {formView} = this._linkUI;

    // create an input text field with the name of advancedField and matching label
    let labeledInputView = new LabeledFieldView(
      formView.locale,
      createLabeledInputText,
    );
    labeledInputView.label = advancedField.label;
    if (advancedField.tooltip) {
      labeledInputView.infoText = advancedField.tooltip;
    }

    this.advancedView.advancedChildren.add(labeledInputView);

    return labeledInputView;
  }

  _toggleUrlSuffixInputView(labeledInputView, isEmpty) {
    if (isEmpty) {
      labeledInputView.fieldView.set('value', '');
    } else {
      const match = this._urlInputRefMatch(this.urlWithRefHandleRE);
      let inputValue = null;

      if (match) {
        // match[1] is the whole URL that shows before the {refTag}
        inputValue = match[1];
      } else {
        // if no match found then it's a "regular" link, e.g. https://craftcms.com or a relative one e.g. /my-page
        inputValue = this._urlInputValue();
      }

      // check if it's a "valid" absolute URL, if yes - proceed as with the matches,
      // if not still extract query params and anchor
      try {
        let url = new URL(inputValue);
        let search = url.search;
        let hash = url.hash;

        labeledInputView.fieldView.set('value', search + hash);
      } catch (e) {
        // it might be a relative URL, and we still need to proceed
        // get the path, query params and anchor
        let [base, hash] = inputValue.split('#');
        let [path, search] = base.split('?');

        hash = hash ? '#' + hash : '';
        search = search ? '?' + search : '';

        labeledInputView.fieldView.set('value', search + hash);
      }
    }
  }

  _handleAdvancedLinkFieldsFormSubmit() {
    const editor = this.editor;
    const linkCommand = editor.commands.get('link');
    const {formView} = this._linkUI;

    formView.on(
      'submit',
      () => {
        let values = {};

        this.conversionData.forEach((field) => {
          let value = [];
          if (field.type === 'bool') {
            value[field.model] = formView[field.model].element.value;
          } else {
            value[field.model] = formView[field.model].fieldView.element.value;
          }
          Object.assign(values, value);
        });

        linkCommand.once(
          'execute',
          (evt, args) => {
            // if there's no extra attrs on the link - add them to the list of args
            if (args.length === 4) {
              // if we already have extra args on the link - update the list of args
              Object.assign(args[3], values);
            } else {
              args.push(values);
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
