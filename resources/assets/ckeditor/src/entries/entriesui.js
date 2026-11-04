import {
  ButtonView,
  Collection,
  isWidget,
  Plugin,
  ViewModel,
  WidgetToolbarRepository,
} from 'ckeditor5';
import {DoubleClickObserver} from '../observers/domevent';
import CraftEntryTypeButtonView from './entrytypebuttonview.js';
import CraftEntryTypeDropdownView from './entrytypedropdownview.js';
import CraftFakeEntryTypeButtonView from './fakeentrytypebuttonview.js';
import * as Craft from '@craftcms/cp';

export default class CraftEntriesUI extends Plugin {
  /**
   * @inheritDoc
   */
  static get requires() {
    return [WidgetToolbarRepository];
  }

  /**
   * @inheritDoc
   */
  static get pluginName() {
    return 'CraftEntriesUI';
  }

  /**
   * @inheritDoc
   */
  init() {
    this._createToolbarEntriesButtons();

    this.editor.ui.componentFactory.add('editEntryBtn', (locale) => {
      return this._createEditEntryBtn(locale);
    });

    this._listenToEvents();
  }

  /**
   * @inheritDoc
   */
  afterInit() {
    // this is needed for the contextual balloon to show for each added entry widget
    const widgetToolbarRepository = this.editor.plugins.get(
      WidgetToolbarRepository,
    );
    widgetToolbarRepository.register('entriesBalloon', {
      ariaLabel: Craft.t('Entry toolbar', {}, 'ckeditor'),
      // Toolbar Buttons
      items: ['editEntryBtn'],
      // If a related element is returned the toolbar is attached
      getRelatedElement: (selection) => {
        const viewElement = selection.getSelectedElement();

        // If the viewElement is a widget and
        // the viewElement has a class `cke-entry-card`
        // return it.
        //
        if (
          viewElement &&
          isWidget(viewElement) &&
          viewElement.hasClass('cke-entry-card')
        ) {
          return viewElement;
        }

        return null;
      },
    });
  }

  /**
   * Hook up event listeners
   *
   * @private
   */
  _listenToEvents() {
    const view = this.editor.editing.view;
    const viewDocument = view.document;

    view.addObserver(DoubleClickObserver);

    this.editor.listenTo(viewDocument, 'dblclick', (evt, data) => {
      if (!this.editor.isReadOnly) {
        const modelElement = this.editor.editing.mapper.toModelElement(
          data.target.parent,
        );

        if (modelElement.name === 'craftEntryModel') {
          this._initEditEntrySlideout(data, modelElement);
        }
      }
    });
  }

  _initEditEntrySlideout(data = null, modelElement = null) {
    if (this.editor.isReadOnly) {
      return;
    }

    if (modelElement === null) {
      const selection = this.editor.model.document.selection;
      modelElement = selection.getSelectedElement();
    }

    const entryId = modelElement.getAttribute('entryId');
    const siteId = modelElement.getAttribute('siteId') ?? null;

    this._showEditEntrySlideout(entryId, siteId, modelElement);
  }

  /**
   * Creates toolbar buttons that allow for an entry of given type to be inserted into the editor
   *
   * @private
   */
  _createToolbarEntriesButtons() {
    const editor = this.editor;
    const entryTypeOptions = editor.config.get('entryTypeOptions');

    if (!entryTypeOptions || !entryTypeOptions.length) {
      return;
    }

    // if this is for the toolbar builder (when editing cke config)
    if (entryTypeOptions.length == 1 && entryTypeOptions[0].value == 'fake') {
      // we need to add our fake button
      this.editor.ui.componentFactory.add(
        'createEntry',
        (locale) =>
          new CraftFakeEntryTypeButtonView(this.editor.locale, {
            entriesUi: this,
          }),
      );
    } else {
      // otherwise - add an individual button for all expanded entry types and a dropdown for the rest
      let entryTypeButtons = this._getEntryTypeButtonsCollection(
        entryTypeOptions ?? [],
      );
      let expandedButtons = entryTypeButtons.filter((item) => {
        return item.model.expanded;
      });
      let collapsedButtons = entryTypeButtons.filter((item) => {
        return !item.model.expanded;
      });

      expandedButtons.forEach((entryType, index) => {
        this.editor.ui.componentFactory.add(
          `createEntry-${entryType.model.uid}`,
          (locale) =>
            new CraftEntryTypeButtonView(this.editor.locale, {
              entriesUi: this,
              entryType: entryType,
            }),
        );
      });

      if (collapsedButtons.length) {
        this.editor.ui.componentFactory.add(
          `createEntry`,
          (locale) =>
            new CraftEntryTypeDropdownView(this.editor.locale, {
              entriesUi: this,
              entryTypes: collapsedButtons,
            }),
        );
      }
    }
  }

  /**
   * Creates a list of entry type options that go into the insert entry button
   *
   * @param options
   * @returns {Collection<Record<string, any>>}
   * @private
   */
  _getEntryTypeButtonsCollection(options) {
    const itemDefinitions = new Collection();
    options.map((option) => {
      const definition = {
        type: 'button',
        model: new ViewModel({
          commandValue: option.value, //entry type id
          color: !option.expanded ? option.color : null,
          expanded: option.expanded,
          icon: option.icon,
          label: option.label || option.value,
          uid: option.uid,
          withIcon: option.icon,
          withText: option.expanded ? !option.icon : true, // items in a dropdown should always have text
        }),
      };
      itemDefinitions.add(definition);
    });

    return itemDefinitions;
  }

  /**
   * Creates an edit entry button that shows in the contextual balloon for each craft entry widget
   * @param locale
   * @returns {ButtonView}
   * @private
   */
  _createEditEntryBtn(locale) {
    if (this.editor.isReadOnly) {
      return;
    }

    // const command = this.editor.commands.get('insertEntry');
    const button = new ButtonView(locale);
    button.set({
      isEnabled: true,
      label: Craft.t('Edit {type}', {
        type: (Craft.cpConfig().get('elementTypeNames')[
          'CraftCms\\Cms\\Entry\\Elements\\Entry'
        ] ??
          Craft.cpConfig().get('elementTypeNames')[
            'craft\\elements\\Entry'
          ])[2],
      }),
      tooltip: true,
      withText: true,
    });

    this.listenTo(button, 'execute', (evt) => {
      this._initEditEntrySlideout();
    });

    return button;
  }

  /**
   * Returns HTML of the card by the entry ID.
   *
   * @param entryId
   * @returns {*}
   * @private
   */
  _getCardElement(entryId) {
    return this.editor.ui.element.querySelector(
      `.element.card[data-id="${entryId}"]`,
    );
  }

  /**
   * Opens an element editor for existing entry
   *
   * @param entryId
   * @private
   */
  _showEditEntrySlideout(entryId, siteId, modelElement) {
    this._openNativeEditEntrySlideout(
      entryId,
      siteId,
      modelElement,
      this.editor.config.get('craftOwner'),
    );
  }

  /**
   * Opens a native (Craft 6) slideout for an existing entry.
   *
   * Changes are saved into the owner’s draft, via the owner bridge’s `prepare()`.
   *
   * @private
   */
  _openNativeEditEntrySlideout(entryId, siteId, modelElement, owner) {
    const editor = this.editor;
    const model = editor.model;
    const card = this._getCardElement(entryId);
    // Identify the entry by its owner and field too, like Matrix does (see `NestedElementManager::elementEditUrl()`),
    // since an entry saved for the owner’s draft has a different owner than its canonical entry
    const params = {
      elementId: entryId,
      siteId: siteId,
    };
    // The card’s owner ID is only right as of when the card was rendered, and the owner changes when its draft is
    // created, applied or discarded, so prefer the control’s current owner
    const ownerId = owner.ownerId() ?? card?.dataset.ownerId;
    const fieldId = card?.dataset.fieldId;
    if (ownerId) {
      params.ownerId = ownerId;
    }
    if (fieldId) {
      params.fieldId = fieldId;
    }

    if (card?.closest('craft-field')?.hasAttribute('has-errors')) {
      params.prevalidate = 1;
    }

    let draftRefreshTimeout = null;

    Craft.openSlideout(Craft.getActionUrl('elements/edit', params), {
      opener: card,
      // Only move the entry into the owner’s draft if it isn’t already there, like Matrix does
      // (see `useNestedElementOperations.ts` `prepareEdit()`)
      prepareNestedOwner: async () =>
        card?.hasAttribute('data-owner-is-canonical') &&
        !card.hasAttribute('data-is-unpublished-draft')
          ? owner.prepare()
          : null,
      onSaved: (result) => {
        const savedId = result?.draft
          ? null
          : parseInt(
              result?.data?.element?.id ?? result?.data?.id ?? entryId,
              10,
            );

        if (savedId && savedId != entryId) {
          // the entry was saved for the owner’s draft, so it has a new ID
          editor.editing.model.change((writer) => {
            writer.setAttribute('entryId', savedId, modelElement);
          });
        }

        // Refresh the card so it reflects the changes (e.g. the “Edited” label); wait for
        // autosaves to settle first, like Matrix does (see `useNestedElementOperations.ts` `onChildSaved()`)
        clearTimeout(draftRefreshTimeout);
        if (result?.draft) {
          draftRefreshTimeout = setTimeout(
            () => this._refreshCard(modelElement),
            1000,
          );
        } else {
          this._refreshCard(modelElement);
          owner.refresh();
        }
      },
      onClosed: () => {
        model.change((writer) => {
          writer.setSelection(writer.createPositionAfter(modelElement));
        });
        editor.editing.view.focus();
      },
    });
  }

  /**
   * Re-renders every entry card, so their attributes (e.g. their owner info) reflect the owner’s current state.
   */
  refreshCards(cardHtml = null) {
    const editor = this.editor;
    [...editor.model.createRangeIn(editor.model.document.getRoot()).getItems()]
      .filter((item) => item.is('element', 'craftEntryModel'))
      .forEach((modelElement) => {
        // use the already rendered card HTML when there is one, rather than requesting it
        const html = cardHtml?.(modelElement.getAttribute('entryId')) ?? null;
        this._refreshCard(modelElement, html ? {cardHtml: html} : null);
      });
  }

  /**
   * Replaces an entry card’s HTML with a freshly rendered one, in place, so the editor’s height doesn’t jump.
   *
   * @private
   */
  async _refreshCard(modelElement, data = null) {
    const editor = this.editor;
    const enqueue = (callback) =>
      editor.model.enqueueChange({isUndoable: false}, callback);

    if (!data) {
      // without the cached card HTML, `_getCardHtml()` fetches it from the server
      enqueue((writer) => writer.removeAttribute('cardHtml', modelElement));
      data = await editor.plugins
        .get('CraftEntriesEditing')
        ._getCardHtml(modelElement);
    }

    if (modelElement.root.rootName === '$graveyard') {
      return;
    }

    enqueue((writer) =>
      writer.setAttribute('cardHtml', data.cardHtml, modelElement),
    );

    const container = editor.editing.mapper.toViewElement(modelElement);
    const card = container
      ? [...container.getChildren()].find((child) => child.is('rawElement'))
      : null;
    const domElement = card
      ? editor.editing.view.domConverter.mapViewToDom(card)
      : null;

    if (!domElement) {
      editor.editing.reconvertItem(modelElement);
      return;
    }

    domElement.innerHTML = data.cardHtml;
    await Craft.appendHeadHtml(data.headHtml);
    await Craft.appendBodyHtml(data.bodyHtml);
    Craft.loadElementThumbs(domElement);
  }

  /**
   * Creates new entry and opens the element editor for it
   *
   * @param entryTypeId
   * @private
   */
  async _showCreateEntrySlideout(entryTypeId) {
    const editor = this.editor;
    const model = editor.model;
    const selection = model.document.selection;
    const range = selection.getFirstRange();
    const nestedElementAttributes = editor.config.get(
      'nestedElementAttributes',
    );

    const params = Object.assign({}, nestedElementAttributes, {
      typeId: entryTypeId,
    });

    const owner = editor.config.get('craftOwner');

    if (owner?.ownerId()) {
      // make sure the owner is a draft, and create the entry for it
      params.ownerId = await owner.prepare();
    }

    let data;

    try {
      const response = await Craft.actionClient.post('elements/create', params);
      data = response.data;
    } catch (e) {
      Craft.showError(e?.response?.data?.error);
      throw e;
    }

    const slideout = Craft.createElementEditor(this.elementType, {
      elementId: data.element.id,
      draftId: data.element.draftId,
      params: {
        fresh: 1,
        siteId: data.element.siteId,
      },
      onSubmit: (ev) => {
        editor.commands.execute('insertEntry', {
          entryId: ev.data.id,
          siteId: ev.data.siteId,
        });
      },
    });

    // set position on before the card we just created and set focus
    slideout.on('beforeClose', () => {
      // nullify the trigger element, so the focus is not returned to the "New entry" button in the toolbar
      slideout.$triggerElement = null;
      // set position
      model.change((writer) => {
        writer.setSelection(
          writer.createPositionAt(
            editor.model.document.getRoot(),
            range.end.path[0],
          ),
        );
      });
      // set focus
      editor.editing.view.focus();
    });
  }
}
