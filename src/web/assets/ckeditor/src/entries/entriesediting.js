import {Plugin} from 'ckeditor5/src/core';
import {
  Widget,
  toWidget,
  viewToModelPositionOutsideModelElement,
} from 'ckeditor5/src/widget';
import CraftEntriesCommand from './entriescommand';

export default class CraftEntriesEditing extends Plugin {
  static get requires() {
    return [Widget];
  }

  static get pluginName() {
    return 'CraftEntriesEditing';
  }

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

  _defineSchema() {
    const schema = this.editor.model.schema;

    schema.register('craftEntries', {
      inheritAllFrom: '$blockObject',
      allowAttributes: ['cardHtml', 'entryId', 'siteId'],
      allowChildren: false,
    });
  }

  _defineConverters() {
    const conversion = this.editor.conversion;

    // converts view to model
    conversion.for('upcast').elementToElement({
      view: {
        name: 'div',
        classes: ['cke-entry-card'],
      },
      model: (viewElement, {writer: modelWriter}) => {
        const cardHtml = viewElement.getAttribute('data-cardhtml');
        const entryId = viewElement.getAttribute('data-entryid');
        const siteId = viewElement.getAttribute('data-siteid');

        return modelWriter.createElement('craftEntries', {
          cardHtml: cardHtml,
          entryId: entryId,
          siteId: siteId,
        });
      },
    });

    // for converting model into editing view (html) that we see in editor UI
    conversion.for('editingDowncast').elementToElement({
      model: 'craftEntries',
      view: (modelItem, {writer: viewWriter}) => {
        const cardContainer = createCardContainerView(modelItem, viewWriter);
        addCardHtmlToContainer(modelItem, viewWriter, cardContainer);

        // Enable widget handling on an entry element inside the editing view.
        return toWidget(cardContainer, viewWriter);
      },
    });

    // for converting model data into HTML data that gets saved in the DB,
    conversion.for('dataDowncast').elementToElement({
      model: 'craftEntries',
      view: (modelItem, {writer: viewWriter}) => {
        return createCardContainerView(modelItem, viewWriter);
      },
    });

    // Create the card container view for both types of downcasting
    const createCardContainerView = (modelItem, viewWriter) => {
      const entryId = modelItem.getAttribute('entryId') ?? null;
      const siteId =
        modelItem.getAttribute('siteId') ??
        this.editor.config.get('elementSiteId') ??
        null;

      return viewWriter.createContainerElement('div', {
        class: 'cke-entry-card',
        'data-entryId': entryId,
        'data-siteId': siteId,
      });
    };

    // Populate card container with card HTML
    const addCardHtmlToContainer = (modelItem, viewWriter, cardContainer) => {
      // TODO: if there's no cardHtml attribute for any reason - get the markup from Craft
      // this can happen e.g. if you make changes in the source mode and then come back to the editing mode
      let cardHtml = modelItem.getAttribute('cardHtml');

      const card = viewWriter.createRawElement(
        'div',
        null,
        function (domElement) {
          domElement.innerHTML = cardHtml;
        },
      );

      viewWriter.insert(viewWriter.createPositionAt(cardContainer, 0), card);
    };
  }

  _getCardHtml(modelItem) {
    const entryId = modelItem.getAttribute('entryId') ?? null;
    const siteId =
      modelItem.getAttribute('siteId') ??
      this.editor.config.get('elementSiteId') ??
      null;

    return new Promise((resolve) => {
      Craft.sendActionRequest('POST', 'ckeditor/ckeditor/entry-card-html', {
        data: {
          entryId: entryId,
          siteId: siteId,
        },
      })
        .then(({data}) => {
          resolve(data);
        })
        .catch(() => {
          // TODO: add a placeholder markup?
          resolve('<b>what now?</b>');
        });
    });
  }
}
