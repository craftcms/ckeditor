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

    // add the command
    this.editor.commands.add(
      'insertEntry',
      new CraftEntriesCommand(this.editor),
    );

    // fix position mapping (model-nodelist-offset-out-of-bounds)
    this.editor.editing.mapper.on(
      'viewToModelPosition',
      viewToModelPositionOutsideModelElement(this.editor.model, (viewElement) =>
        viewElement.hasClass('cke-entry-card'),
      ),
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
      allowAttributes: ['cardHtml', 'entryId'],
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
        name: 'craftentry', // has to be lower case
      },
      model: (viewElement, {writer: modelWriter}) => {
        const cardHtml = viewElement.getAttribute('data-cardhtml');
        const entryId = viewElement.getAttribute('data-entryid');

        return modelWriter.createElement('craftEntryModel', {
          cardHtml: cardHtml,
          entryId: entryId,
        });
      },
    });

    // for converting model into editing view (html) that we see in editor UI
    conversion.for('editingDowncast').elementToElement({
      model: 'craftEntryModel',
      view: (modelItem, {writer: viewWriter}) => {
        const entryId = modelItem.getAttribute('entryId') ?? null;
        const cardContainer = viewWriter.createContainerElement('div', {
          class: 'cke-entry-card',
          'data-entryId': entryId,
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

        return viewWriter.createContainerElement('craftentry', {
          'data-entryId': entryId,
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
            domElement.innerHTML = data;
          },
        );

        viewWriter.insert(viewWriter.createPositionAt(cardContainer, 0), card);

        const editor = this.editor;
        editor.editing.view.focus();
        Craft.cp.elementThumbLoader.load($(editor.ui.element));
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
  _getCardHtml(modelItem) {
    let cardHtml = modelItem.getAttribute('cardHtml') ?? null;

    // if there's no cardHtml attribute for any reason - get the markup from Craft
    // this can happen e.g. if you make changes in the source mode and then come back to the editing mode
    if (cardHtml == undefined || cardHtml == null) {
      const entryId = modelItem.getAttribute('entryId') ?? null;

      return Craft.sendActionRequest(
        'POST',
        'ckeditor/ckeditor/entry-card-html',
        {
          data: {
            entryId: entryId,
          },
        },
      )
        .then(({data}) => {
          return data;
        })
        .catch(() => {
          // TODO: add a placeholder markup?
          return '<b>what now?</b>';
        });
    } else {
      return new Promise((resolve, reject) => {
        resolve(cardHtml);
      });
    }
  }
}
