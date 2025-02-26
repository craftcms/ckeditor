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
  createLinkElement,
  findAttributeRange,
  InputTextView,
  LabeledFieldView,
  LinkUI,
  Plugin,
  Range,
  ViewModel,
  ViewElement,
} from 'ckeditor5';

/**
 * These imports aren't ideal but are necessary for now because the main
 * ckeditor5 package doesn't expose them.
 *
 * @link https://github.com/ckeditor/ckeditor5/issues/17304#issuecomment-2522746556
 */
const LINK_KEYSTROKE = 'Ctrl+K';

export default class CraftLinkUI extends Plugin {
  static get requires() {
    return [LinkUI];
  }

  static get pluginName() {
    return 'CraftLinkUI';
  }

  constructor() {
    super(...arguments);
    this.siteDropdownView = null;
    this.siteDropdownItemModels = null;
    this.localizedRefHandleRE = null;

    this.linkTypeDropdownView = null;
    this.linkTypeDropdownItemModels = [];
    this.elementTypeRefHandleRE = null;

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

    this._defineSchema();
    this._defineConverters();
    this._adjustLinkCommand();
    this._adjustUnlinkCommand();

    this._modifyFormViewTemplate(linkOptions, advancedLinkFields);

    const refHandlesPattern = CKE_LOCALIZED_REF_HANDLES.join('|');

    if (Craft.isMultiSite) {
      this.localizedRefHandleRE = new RegExp(
        `(#(?:${refHandlesPattern}):\\d+)(?:@(\\d+))?`,
      );
    }
    this.elementTypeRefHandleRE = new RegExp(
      `(#((?:${refHandlesPattern})):\\d+)`,
    );
  }

  _defineSchema() {
    const schema = this.editor.model.schema;

    let modelAttributes = this.conversionData.map((field) => field.model);

    // Extend the node's schema to accept the advancedLinkFields attributes
    schema.extend('$text', {
      allowAttributes: modelAttributes,
    });
  }

  _defineConverters() {
    const conversion = this.editor.conversion;

    for (let i = 0; i < this.conversionData.length; i++) {
      // model to view (html)
      conversion.for('downcast').attributeToElement({
        model: this.conversionData[i].model,
        view: (value, {writer}) => {
          const linkViewElement = writer.createAttributeElement(
            'a',
            {
              [this.conversionData[i].view]: value,
            },
            {priority: 5},
          );

          writer.setCustomProperty('link', true, linkViewElement);

          return linkViewElement;
        },
      });

      // View (html) to Model
      conversion.for('upcast').elementToAttribute({
        view: {
          name: 'a',
          attributes: {
            [this.conversionData[i].view]: true,
          },
        },
        model: {
          key: this.conversionData[i].model,
          value: (viewElement) => {
            return viewElement.getAttribute(this.conversionData[i].view);
          },
        },
      });
    }
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
          if (!isCollapsed && range) {
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
      this._linkOptionsDropdown(linkOptions, formView, urlInputView, fieldView);
    }

    if (Craft.isMultiSite) {
      this._sitesDropdown(formView, urlInputView, fieldView);
    }

    if (advancedLinkFields && advancedLinkFields.length) {
      this._advancedLinkFields(
        advancedLinkFields,
        formView,
        urlInputView,
        fieldView,
      );
    }
  }

  _advancedLinkFields(advancedLinkFields, formView, urlInputView, fieldView) {
    if (advancedLinkFields.length == 0) {
      return;
    }

    const linkCommand = this.editor.commands.get('link');

    // let labeledInputViews = [];
    for (const advancedField of advancedLinkFields) {
      // create an input text field with the name of advancedField and matching label
      let labeledInputView = new LabeledFieldView(
        formView.locale,
        createLabeledInputText,
      ); // Create a labeled input view
      labeledInputView.label = advancedField.label;
      if (advancedField.info) {
        labeledInputView.infoText = advancedField.info;
      }

      const {children} = formView;
      const urlInputIdx = children.getIndex(urlInputView);
      children.add(labeledInputView, urlInputIdx + 3);

      let modelAttribute = advancedField.conversion?.model;

      if (typeof modelAttribute !== 'undefined') {
        formView[modelAttribute] = labeledInputView;
        formView[modelAttribute].fieldView
          .bind('value')
          .to(linkCommand, modelAttribute);
        formView[modelAttribute].fieldView.element.value =
          linkCommand[modelAttribute] || '';
      }
    }

    const modelAttributes = this.conversionData.map((field) => field.model);

    formView.on(
      'submit',
      () => {
        const values = modelAttributes.reduce((state, modelAttribute) => {
          state[modelAttribute] =
            formView[modelAttribute].fieldView.element.value;
          return state;
        }, {});

        linkCommand.once(
          'execute',
          (evt, args) => {
            if (args.length === 3) {
              Object.assign(args[2], values);
            }
          },
          {priority: 'highest'},
        );
      },
      {priority: 'high'},
    );
  }

  _linkOptionsDropdown(linkOptions, formView, urlInputView, fieldView) {
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
        this._linkUI._hideUI();
        const linkOption = evt.source.linkOption;
        this._showElementSelectorModal(linkOption);
      } else {
        // if the default link (URL) was selected,
        // we want to clear our the input field value, hide sites dropdown and ensure "URL" is selected
        this._selectLinkTypeDropdownItem('default');
        fieldView.set('value', '');
        this.siteDropdownView?.buttonView.set('isVisible', false);
      }
    });

    const {children} = formView;
    const urlInputIdx = children.getIndex(urlInputView);
    children.add(this.linkTypeDropdownView, urlInputIdx + 1);

    formView._focusables.add(this.linkTypeDropdownView);
    formView.focusTracker.add(this.linkTypeDropdownView.element);

    this.listenTo(fieldView, 'change:value', () => {
      this._toggleLinkTypeDropdownView();
    });
    this.listenTo(fieldView, 'input', () => {
      this._toggleLinkTypeDropdownView();
    });
  }

  _toggleLinkTypeDropdownView() {
    const match = this._urlInputValue().match(this.elementTypeRefHandleRE);
    if (match) {
      this.linkTypeDropdownView.buttonView.set('isVisible', true);
      let elementType = match[2];
      if (
        elementType &&
        typeof this.linkTypeDropdownItemModels[elementType] === 'undefined'
      ) {
        elementType = null;
      }

      this._selectLinkTypeDropdownItem(elementType);
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

  _sitesDropdown(formView, urlInputView, fieldView) {
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
    const urlInputIdx = children.getIndex(urlInputView);
    children.add(this.siteDropdownView, urlInputIdx + 2);

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

  _urlInputValue() {
    return this._linkUI.formView.urlInputView.fieldView.element.value;
  }

  _urlInputRefMatch(regEx) {
    return this._urlInputValue().match(regEx);
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
  }

  _adjustLinkCommand() {
    const editor = this.editor;
    const linkCommand = editor.commands.get('link');
    let linking = false;

    linkCommand.on(
      'execute',
      (evt, args) => {
        //console.log('link command 1');
        if (linking) {
          linking = false;
          return;
        }

        evt.stop();
        linking = true;

        //console.log('link command2');

        const extraAttributeValues = args[args.length - 1];
        const {model} = editor;
        const {selection} = model.document;

        model.change((writer) => {
          this.editor.execute('link', ...args);

          const firstPosition = selection.getFirstPosition();

          this.conversionData.forEach((item) => {
            if (selection.isCollapsed) {
              const node = firstPosition.textNode || firstPosition.nodeBefore;

              if (extraAttributeValues[item.model]) {
                writer.setAttribute(
                  item.model,
                  extraAttributeValues[item.model],
                  writer.createRangeOn(node),
                );
              } else {
                writer.removeAttribute(item.model, writer.createRangeOn(node));
              }

              writer.removeSelectionAttribute(item.model);
            } else {
              const ranges = model.schema.getValidRanges(
                selection.getRanges(),
                item.model,
              );

              for (const range of ranges) {
                if (extraAttributeValues[item.model]) {
                  writer.setAttribute(
                    item.model,
                    extraAttributeValues[item.model],
                    range,
                  );
                } else {
                  writer.removeAttribute(item.model, range);
                }
              }
            }
          });
        });
      },
      {priority: 'high'},
    );
  }

  _adjustUnlinkCommand() {
    const editor = this.editor;
    const unlinkCommand = editor.commands.get('unlink');
    const {model} = editor;
    const {selection} = model.document;
    let unlinking = false;

    unlinkCommand.on(
      'execute',
      (evt) => {
        //console.log('unlink exec');
        if (unlinking) {
          return;
        }

        evt.stop();

        model.change(() => {
          unlinking = true;
          editor.execute('unlink');
          unlinking = false;

          // remove extra attributes
          model.change((writer) => {
            let ranges;

            this.conversionData.forEach((item) => {
              if (selection.isCollapsed) {
                ranges = [
                  findAttributeRange(
                    selection.getFirstPosition(),
                    item.model,
                    selection.getAttribute(item.model),
                    model,
                  ),
                ];
              } else {
                ranges = model.schema.getValidRanges(
                  selection.getRanges(),
                  item.model,
                );
              }

              for (const range of ranges) {
                writer.removeAttribute(item.model, range);
              }
            });
          });
        });
      },
      {priority: 'high'},
    );
  }
}
