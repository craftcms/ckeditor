import {ButtonView, View} from 'ckeditor5';

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
        this.button = Craft.t('app', 'Loading');
      }
    }

    if (this.button == null) {
      this.button = new ButtonView();

      this.button.set({
        label: Craft.t('app', 'Choose'),
        withText: true,
        class: 'btn add icon dashed',
      });
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
      // trigger element selector modal but only if we clicked on the "Choose" button,
      // which will always have the ck-button__label class
      if (ev.target.classList.contains('ck-button__label')) {
        _linkUI._hideUI();
        linkUi._showElementSelectorModal(linkOption);
      }
    });

    // if element doesn't have children, it means it doesn't have the "Choose" button in it,
    // so we should insert the element chip
    if (this.element.children.length == 0) {
      Craft.sendActionRequest('POST', 'app/render-elements', {
        data: {
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
        },
      })
        .then((response) => {
          if (Object.keys(response.data.elements).length > 0) {
            this.element.innerHTML = response.data.elements[this.elementId][0];
            Craft.appendHeadHtml(response.data.headHtml);
            Craft.appendBodyHtml(response.data.bodyHtml);

            let $element = this.element.firstChild;

            const actions = [
              {
                icon: 'arrows-rotate',
                label: Craft.t('app', 'Replace'),
                callback: () => {
                  this.linkUi._showElementSelectorModal(this.linkOption);
                },
              },
              {
                icon: 'remove',
                label: Craft.t('app', 'Remove'),
                callback: () => {
                  const unlinkCommand = this.editor.commands.get('unlink');
                  unlinkCommand.execute();
                },
              },
            ];

            Craft.addActionsToChip($element, actions);
            //Craft.cp.elementThumbLoader.load($element);

            // reshuffle focus?
            const formView = _linkUI.formView;
            linkUi._alignFocus(formView);
          }
        })
        .catch((e) => {
          Craft.cp.displayError(e?.response?.data?.message);
          throw e?.response?.data?.message ?? e;
        });
    }
  }
}
