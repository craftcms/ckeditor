import {Collection} from 'ckeditor5/src/utils';
import {
  Model,
  SplitButtonView,
  createDropdown,
  addListToDropdown,
} from 'ckeditor5/src/ui';
import linkIcon from '../node_modules/@ckeditor/ckeditor5-link/theme/icons/link.svg';
import {LinkUI} from '@ckeditor/ckeditor5-link';
import {LINK_KEYSTROKE} from '@ckeditor/ckeditor5-link/src/utils';

export default class CraftLinkUI extends LinkUI {
  static get pluginName() {
    return 'CraftLinkUI';
  }

  constructor() {
    super(...arguments);
    this.editor.config.define('linkOptions', []);
  }

  _createToolbarLinkButton() {
    const editor = this.editor;
    const linkOptions = editor.config.get('linkOptions');
    if (!linkOptions || !linkOptions.length) {
      return super._createToolbarLinkButton();
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
      this.listenTo(splitButtonView, 'execute', () => this._showUI(true));
      dropdownView.on('execute', (evt) => {
        const linkOption = evt.source.linkOption;
        this._showElementSelectorModal(linkOption);
      });
      dropdownView.class = 'ck-code-block-dropdown';
      dropdownView.bind('isEnabled').to(linkCommand, 'isEnabled');
      splitButtonView.bind('isOn').to(linkCommand, 'value', (value) => !!value);
      addListToDropdown(dropdownView, () =>
        this._getLinkListItemDefinitions(linkOptions)
      );
      return dropdownView;
    });
  }

  _getLinkListItemDefinitions(linkOptions) {
    const itemDefinitions = new Collection();

    for (const option of linkOptions) {
      const definition = {
        type: 'button',
        model: new Model({
          label: option.label,
          linkOption: option,
          withText: true,
        }),
      };
      itemDefinitions.add(definition);
    }

    return itemDefinitions;

    const editor = this.editor;
    const t = editor.t;
    const languageDefs = editor.config.get('codeBlock.languages');
    for (const def of languageDefs) {
      if (def.label === 'Plain text') {
        def.label = t('Plain text');
      }
      if (def.class === undefined) {
        def.class = `language-${def.language}`;
      }
    }
    return languageDefs;
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
      this._hideFakeVisualSelection();
    };

    // When there's no link under the selection, go straight to the editing UI.
    if (!this._getSelectedLinkElement()) {
      // Show visual selection on a text without a link when the contextual balloon is displayed.
      // See https://github.com/ckeditor/ckeditor5/issues/4721.
      this._showFakeVisualSelection();
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
                selection.getFirstPosition()
              );
            });
          }

          this._hideFakeVisualSelection();
          setTimeout(() => {
            editor.editing.view.focus();
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
}
