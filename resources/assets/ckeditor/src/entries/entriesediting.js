import {
  Plugin,
  toWidget,
  viewToModelPositionOutsideModelElement,
  Widget,
} from 'ckeditor5';
import CraftEntriesCommand from './entriescommand';
import * as Craft from '@craftcms/cp';

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
        const entryId = viewElement.getAttribute('data-entry-id');
        // the control passes the card HTML separately, so the value doesn’Craft.t change whenever the cards are re-rendered
        const cardHtml =
          viewElement.getAttribute('data-card-html') ??
          this.editor.config.get('craftCardHtml')?.(entryId) ??
          null;
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

        // an empty element, so the data processor doesn’Craft.t add an `&nbsp;` filler that the saved value won’Craft.t have
        return viewWriter.createEmptyElement('craft-entry', {
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
            // CKEditor fills raw elements synchronously, so the card's scripts
            // are appended behind it, head before body.
            void Craft.appendHeadHtml(data.headHtml).then(() =>
              Craft.appendBodyHtml(data.bodyHtml),
            );
          },
        );

        viewWriter.insert(viewWriter.createPositionAt(cardContainer, 0), card);

        const editor = this.editor;
        editor.editing.view.focus();

        setTimeout(() => {
          Craft.loadElementThumbs(editor.ui.element);
        }, 100);

        // refresh ui after drag&drop or sourceMode exit
        editor.model.change((writer) => {
          editor.ui.update();
          // also trigger auto-save
          editor.sourceElement.dispatchEvent(
            new KeyboardEvent('keyup', {bubbles: true}),
          );
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

    if (cardHtml) {
      return {cardHtml};
    }

    // if there's no cardHtml attribute for any reason - get the markup from Craft
    // this can happen e.g. if you make changes in the source mode and then come back to the editing mode
    const layoutElementUid =
      this.editor.config.get('layoutElementUid') ??
      this.editor.sourceElement.closest('craft-field')?.dataset.layoutElement;
    const entryId = modelItem.getAttribute('entryId') ?? null;
    const siteId = modelItem.getAttribute('siteId') ?? null;

    try {
      const {data} = await Craft.actionClient.post(
        'ckeditor/ckeditor/entry-card-html',
        {
          entryId: entryId,
          siteId: siteId,
          layoutElementUid: layoutElementUid,
        },
      );
      return data;
    } catch (e) {
      console.error(e?.response?.data);

      const cardHtml =
        '<craft-card>' +
        '<craft-callout variant="danger" role="alert">' +
        Craft.escapeHtml(
          e?.response?.data?.message ||
            Craft.t('An unknown error occurred.', {}, 'ckeditor'),
        ) +
        '</craft-callout>' +
        '</craft-card>';

      return {cardHtml};
    }
  }
}
