import {View} from 'ckeditor5';
import {
  actionClient,
  addActionsToChip,
  appendBodyHtml,
  appendHeadHtml,
  cpConfig,
  t as craftT,
  showError,
} from '@craftcms/cp';

export default class CraftLinkElementView extends View {
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
    this.button = null;

    if (elementRefHandle) {
      const itemModel =
        this.linkUi.linkTypeDropdownItemModels[elementRefHandle];
      if (
        this.linkUi.linkTypeDropdownView.buttonView.label == itemModel.label
      ) {
        this.button = craftT('Loading');
      }
    }

    if (this.button == null) {
      this.button = this._createChooseButton();
    }

    this.setTemplate({
      tag: 'div',
      attributes: {
        // ck-reset_all-excluded class is needed so that CKE doesn't mess with the styles we already have
        class: ['elementselect', 'ck-reset_all-excluded'],
        tabindex: 0,
      },
      children: [this.button],
    });
  }

  /**
   * Creates the “Choose” button, which opens the element selector modal.
   */
  _createChooseButton() {
    const button = new View(this.locale);
    button.setTemplate({
      tag: 'craft-button',
      attributes: {
        type: 'button',
        variant: 'dashed',
        icon: 'plus',
        'data-choose': true,
      },
      children: [craftT('Choose')],
    });
    return button;
  }

  // this is needed so that the '.elementselect' is focusable
  focus() {
    this.element.focus();
  }

  render() {
    super.render();

    const linkUi = this.linkUi;
    const _linkUI = linkUi._linkUI;
    const linkOption = this.linkOption;

    this.element.addEventListener('click', function (ev) {
      // trigger element selector modal but only if the element contains the "Choose" button
      if (this.children[0]?.matches('craft-button[data-choose]')) {
        // capture the displayed text before hiding the UI, which resets the form fields
        const displayText =
          _linkUI.formView.displayedTextInputView.fieldView.element.value;
        _linkUI._hideUI(false);
        linkUi._showElementSelectorModal(linkOption, displayText);
      }
    });

    // if element doesn't have children, it means it doesn't have the "Choose" button in it,
    // so we should insert the element chip
    if (this.element.children.length == 0) {
      actionClient
        .post('ckeditor/ckeditor/render-element-with-supported-sites', {
          elements: [
            {
              type: linkOption.elementType,
              id: this.elementId,
              siteId: this.siteId,
              instances: [
                {
                  context: 'field',
                  ui: 'chip',
                  sortable: false,
                  showActionMenu: false,
                },
              ],
            },
          ],
        })
        .then(async (response) => {
          if (Object.keys(response.data.elements).length > 0) {
            // if it's a multisite, disable sites that are not in the response
            if (
              cpConfig().get('isMultiSite') &&
              this.linkUi.sitesView != null
            ) {
              for (const [siteId, model] of Object.entries(
                this.linkUi.sitesView.siteDropdownItemModels,
              )) {
                if (
                  response.data.siteIds.includes(parseInt(siteId)) ||
                  siteId == 'current'
                ) {
                  model.set('isEnabled', true);
                } else {
                  model.set('isEnabled', false);
                }
              }
            }

            this.element.innerHTML = response.data.elements[this.elementId][0];
            await appendHeadHtml(response.data.headHtml);
            await appendBodyHtml(response.data.bodyHtml);

            let $element = this.element.firstChild;

            const actions = [
              {
                icon: 'arrows-rotate',
                label: craftT('Replace'),
                callback: () => {
                  this.linkUi._showElementSelectorModal(this.linkOption);
                },
              },
              {
                icon: 'remove',
                label: craftT('Remove'),
                callback: () => {
                  const unlinkCommand = this.editor.commands.get('unlink');
                  unlinkCommand.execute();
                },
              },
            ];

            addActionsToChip($element, actions);

            // only show the sites dropdown, if an element has been selected
            if (this.linkUi.sitesView?.siteDropdownView?.buttonView) {
              this.linkUi.sitesView?.siteDropdownView.buttonView.set(
                'isVisible',
                true,
              );
            }

            // reshuffle focus
            linkUi._alignFocus();
          } else {
            if (this.linkUi.previousLinkValue?.length > 0) {
              // if we still have the previous element - use it
              const {formView} = this.linkUi._linkUI;
              formView.urlInputView.fieldView.set(
                'value',
                this.linkUi.previousLinkValue,
              );
            } else {
              // otherwise set it to the "Choose" button
              this.button = this._createChooseButton();
              this.button.render();
              this.element.innerHTML = this.button.element.outerHTML;
            }
          }
        })
        .catch((e) => {
          showError(e?.response?.data?.message);
          throw e?.response?.data?.message ?? e;
        });
    }
  }
}
