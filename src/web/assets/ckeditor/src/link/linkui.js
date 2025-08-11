/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

import {Plugin} from 'ckeditor5/src/core';
import {Collection} from 'ckeditor5/src/utils';
import {
  ViewModel,
  ContextualBalloon,
  SplitButtonView,
  createDropdown,
  addListToDropdown,
} from 'ckeditor5/src/ui';
import linkIcon from '@ckeditor/ckeditor5-icons/theme/icons/link.svg';
import {LinkUI} from '@ckeditor/ckeditor5-link';
import {LINK_KEYSTROKE} from '@ckeditor/ckeditor5-link/src/utils';
import {Range} from 'ckeditor5/src/engine';
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
    this.editor.config.define('linkOptions', []);
  }

  init() {
    const editor = this.editor;
    this._linkUI = editor.plugins.get(LinkUI);
    this._balloon = editor.plugins.get(ContextualBalloon);
    this._createToolbarLinkButton();

    if (Craft.isMultiSite) {
      this._modifyFormViewTemplate();
      const refHandlesPattern =
        CKEditor5.craftcms.localizedRefHandles.join('|');
      this.localizedRefHandleRE = new RegExp(
        `(#(?:${refHandlesPattern}):\\d+)(?:@(\\d+))?`,
      );
    }
  }

  _createToolbarLinkButton() {
    const editor = this.editor;
    const linkOptions = editor.config.get('linkOptions');
    // if we have no link options, bail and go with the default link button
    if (!linkOptions || !linkOptions.length) {
      return;
    }
    const linkCommand = editor.commands.get('link');
    const t = editor.t;
    editor.ui.componentFactory.add('link', (locale) => {
      const dropdownView = createDropdown(locale, SplitButtonView);
      const splitButtonView = dropdownView.buttonView;
      splitButtonView.isEnabled = true;
      splitButtonView.label = t('Link');
      splitButtonView.icon = linkIcon;
      splitButtonView.keystroke = LINK_KEYSTROKE;
      splitButtonView.tooltip = true;
      splitButtonView.isToggleable = true;
      this.listenTo(splitButtonView, 'execute', () =>
        this._linkUI._showUI(true),
      );
      dropdownView.on('execute', (evt) => {
        if (evt.source.linkOption) {
          const linkOption = evt.source.linkOption;
          this._showElementSelectorModal(linkOption);
        } else {
          this._linkUI._showUI(true);
        }
      });
      dropdownView.class = 'ck-code-block-dropdown';
      dropdownView.bind('isEnabled').to(linkCommand, 'isEnabled');
      splitButtonView.bind('isOn').to(linkCommand, 'value', (value) => !!value);
      addListToDropdown(dropdownView, () =>
        this._getLinkListItemDefinitions(linkOptions),
      );
      return dropdownView;
    });
  }

  _getLinkListItemDefinitions(linkOptions) {
    const itemDefinitions = new Collection();

    for (const option of linkOptions) {
      itemDefinitions.add({
        type: 'button',
        model: new ViewModel({
          label: option.label,
          linkOption: option,
          withText: true,
        }),
      });
    }

    itemDefinitions.add({
      type: 'button',
      model: new ViewModel({
        label: Craft.t('ckeditor', 'Insert link'),
        withText: true,
      }),
    });

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

  _modifyFormViewTemplate() {
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
      const match = this._urlInputRefMatch();
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
    children.add(this.siteDropdownView, urlInputIdx + 1);

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

  _urlInputRefMatch() {
    return this._urlInputValue().match(this.localizedRefHandleRE);
  }

  _toggleSiteDropdownView() {
    const match = this._urlInputRefMatch();
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
      model.set('isOn', model === itemModel);
    });
  }
}
