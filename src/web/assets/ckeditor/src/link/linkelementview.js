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
      // trigger element selector modal but only if the element contains the "Choose" button,
      // which will always have the ck-button__label class
      if (
        this.children[0].classList.contains('add') ||
        ev.target.classList.contains('ck-button__label')
      ) {
        _linkUI._hideUI();
        linkUi._showElementSelectorModal(linkOption);
      }
    });

    // if element doesn't have children, it means it doesn't have the "Choose" button in it,
    // so we should insert the element chip
    if (this.element.children.length == 0) {
      Craft.sendActionRequest(
        'POST',
        'ckeditor/ckeditor/render-element-with-supported-sites',
        {
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
        },
      )
        .then((response) => {
          if (Object.keys(response.data.elements).length > 0) {
            // if it's a multisite, disable sites that are not in the response
            if (Craft.isMultiSite && this.linkUi.sitesView != null) {
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

            // only show the sites dropdown, if an element has been selected
            this.linkUi.sitesView.siteDropdownView.buttonView.set(
              'isVisible',
              true,
            );

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
              this.button = new ButtonView();
              this.button.set({
                label: Craft.t('app', 'Choose'),
                withText: true,
                class: 'btn add icon dashed',
              });
              this.button.render();
              this.element.innerHTML = this.button.element.outerHTML;
            }
          }
        })
        .catch((e) => {
          Craft.cp.displayError(e?.response?.data?.message);
          throw e?.response?.data?.message ?? e;
        });
    }
  }
}
