import {Plugin} from 'ckeditor5/src/core';
import {
  Widget,
  toWidget,
  viewToModelPositionOutsideModelElement,
} from 'ckeditor5/src/widget';
import CraftEntriesCommand from './entriescommand';

export default class CraftEntriesEditing extends Plugin {
  /**
   * @inheritDoc
   */
  static get requires() {
    return [Widget];
  }

  /**
   * @inheritDoc
   */
  static get pluginName() {
    return 'CraftEntriesEditing';
  }

  /**
   * @inheritDoc
   */
  init() {
    // define the model
    this._defineSchema();
    // define model/view converters
    this._defineConverters();

    const editor = this.editor;

    // add the command
    editor.commands.add('insertEntry', new CraftEntriesCommand(editor));

    // fix position mapping (model-nodelist-offset-out-of-bounds)
    editor.editing.mapper.on(
      'viewToModelPosition',
      viewToModelPositionOutsideModelElement(editor.model, (viewElement) => {
        viewElement.hasClass('cke-entry-card');
      }),
    );
  }

  /**
   * Defines model schema for our widget.
   * @private
   */
  _defineSchema() {
    const schema = this.editor.model.schema;

    schema.register('craftEntryModel', {
      inheritAllFrom: '$blockObject',
      allowAttributes: ['cardHtml', 'entryId', 'siteId'],
      allowChildren: false,
    });
  }

  /**
   * Defines conversion methods for model and both editing and data views.
   * @private
   */
  _defineConverters() {
    const conversion = this.editor.conversion;

    // converts data view to a model
    conversion.for('upcast').elementToElement({
      view: {
        name: 'craft-entry', // has to be lower case
      },
      model: (viewElement, {writer: modelWriter}) => {
        const cardHtml = viewElement.getAttribute('data-card-html');
        const entryId = viewElement.getAttribute('data-entry-id');
        const siteId = viewElement.getAttribute('data-site-id') ?? null;

        return modelWriter.createElement('craftEntryModel', {
          cardHtml: cardHtml,
          entryId: entryId,
          siteId: siteId,
        });
      },
    });

    // for converting model into editing view (html) that we see in editor UI
    conversion.for('editingDowncast').elementToElement({
      model: 'craftEntryModel',
      view: (modelItem, {writer: viewWriter}) => {
        const entryId = modelItem.getAttribute('entryId') ?? null;
        const siteId = modelItem.getAttribute('siteId') ?? null;
        const cardContainer = viewWriter.createContainerElement('div', {
          class: 'cke-entry-card',
          'data-entry-id': entryId,
          'data-site-id': siteId,
        });
        addCardHtmlToContainer(modelItem, viewWriter, cardContainer);

        // Enable widget handling on an entry element inside the editing view.
        return toWidget(cardContainer, viewWriter);
      },
    });

    // for converting model into data view (html) that gets saved in the DB,
    conversion.for('dataDowncast').elementToElement({
      model: 'craftEntryModel',
      view: (modelItem, {writer: viewWriter}) => {
        const entryId = modelItem.getAttribute('entryId') ?? null;
        const siteId = modelItem.getAttribute('siteId') ?? null;

        return viewWriter.createContainerElement('craft-entry', {
          'data-entry-id': entryId,
          'data-site-id': siteId,
        });
      },
    });

    // Populate card container with card HTML
    const addCardHtmlToContainer = (modelItem, viewWriter, cardContainer) => {
      this._getCardHtml(modelItem).then((data) => {
        const card = viewWriter.createRawElement(
          'div',
          null,
          function (domElement) {
            domElement.innerHTML = data.cardHtml;
            Craft.appendHeadHtml(data.headHtml);
            Craft.appendBodyHtml(data.bodyHtml);
          },
        );

        viewWriter.insert(viewWriter.createPositionAt(cardContainer, 0), card);

        const editor = this.editor;
        editor.editing.view.focus();

        setTimeout(() => {
          Craft.cp.elementThumbLoader.load($(editor.ui.element));
        }, 100);

        // refresh ui after drag&drop or sourceMode exit
        editor.model.change((writer) => {
          editor.ui.update();
          $(editor.sourceElement).trigger('keyup'); // also trigger auto-save
        });
      });
    };
  }

  /**
   * Get card html either from the attribute or via ajax request. In both cases, return via a promise.
   *
   * @param modelItem
   * @returns {Promise<unknown>|Promise<T | string>}
   * @private
   */
  async _getCardHtml(modelItem) {
    let cardHtml = modelItem.getAttribute('cardHtml') ?? null;

    let parents = $(this.editor.sourceElement).parents('.field');
    const layoutElementUid = $(parents[0]).data('layout-element');

    // if there's no cardHtml attribute for any reason - get the markup from Craft
    // this can happen e.g. if you make changes in the source mode and then come back to the editing mode
    if (cardHtml) {
      return {cardHtml};
    }

    const entryId = modelItem.getAttribute('entryId') ?? null;
    const siteId = modelItem.getAttribute('siteId') ?? null;

    try {
      // Let the element editor handle the autosave first, in case the nested entry
      // is soft-deleted and needs to be restored.
      const editor = this.editor;
      const $editorContainer = $(editor.ui.view.element).closest(
        'form,.lp-editor-container',
      );
      const elementEditor = $editorContainer.data('elementEditor');
      if (elementEditor) {
        await elementEditor.checkForm();
      }

      const {data} = await Craft.sendActionRequest(
        'POST',
        'ckeditor/ckeditor/entry-card-html',
        {
          data: {
            entryId: entryId,
            siteId: siteId,
            layoutElementUid: layoutElementUid,
          },
        },
      );
      return data;
    } catch (e) {
      console.error(e?.response?.data);

      const cardHtml =
        '<div class="element card">' +
        '<div class="card-content">' +
        '<div class="card-heading">' +
        '<div class="label error">' +
        '<span>' +
        (e?.response?.data?.message || 'An unknown error occurred.') +
        '</span>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>';

      return {cardHtml};
    }
  }
}
