import {ButtonView, View} from 'ckeditor5';

export default class CraftLinkElementView extends View {
  constructor(locale, options = {}) {
    super(locale);

    this.editor = null;
    (this._linkUI = null), (this.linkUi = null);
    this.elementId = null;
    this.siteId = null;
    this.linkOption = null;
    this.button = null;

    const bind = this.bindTemplate;

    this.set('isFocused', false);

    this.editor = options.editor;
    this.linkUi = options.linkUi;
    const {formView} = this.linkUi._linkUI;
    this.elementId = this.linkUi._getLinkElementId();
    this.siteId = this.linkUi._getLinkSiteId();
    this.linkOption = options.linkOption;
    const elementType = this.linkUi._getLinkElementType();
    this.button = null;

    if (elementType) {
      const itemModel = this.linkUi.linkTypeDropdownItemModels[elementType];
      if (
        this.linkUi.linkTypeDropdownView.buttonView.label == itemModel.label
      ) {
        this.button = 'loading...';
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
        class: ['elementselect'],
      },
      children: [this.button],
    });
  }

  render() {
    super.render();

    const _linkUI = this.linkUi._linkUI;
    const linkUi = this.linkUi;
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
              type: 'craft\\elements\\Entry',
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
          this.element.innerHTML = response.data.elements[this.elementId][0];
          Craft.appendHeadHtml(response.data.headHtml);
          Craft.appendBodyHtml(response.data.bodyHtml);

          let $element = this.element.firstChild;
          // this class is needed so that CKE doesn't mess with the styles we already have
          $element.classList.add('ck-reset_all-excluded');

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
        })
        .catch((e) => {
          Craft.cp.displayError(e?.response?.data?.message);
          throw e?.response?.data?.message ?? e;
        });
    }
  }
}
