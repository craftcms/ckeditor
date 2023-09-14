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
      new CraftEntriesCommand(this.editor)
    );

    // fix position mapping (model-nodelist-offset-out-of-bounds)
    this.editor.editing.mapper.on(
      'viewToModelPosition',
      viewToModelPositionOutsideModelElement(this.editor.model, (viewElement) =>
        viewElement.hasClass('entry-card')
      )
    );
  }

  _defineSchema() {
    const schema = this.editor.model.schema;

    schema.register('craftEntries', {
      inheritAllFrom: '$blockObject',
      // todo: we can probably remove the label attr; all we need is entryId and siteId to get all the info about the element
      allowAttributes: ['label', 'entryId', 'siteId'],
    });
  }

  _defineConverters() {
    const conversion = this.editor.conversion;

    conversion.for('upcast').elementToElement({
      view: {
        name: 'div',
        classes: ['entry-card'],
      },
      model: (viewElement, {writer: modelWriter}) => {
        console.log('upcast');
        const label = viewElement.getChild(0).data;
        //const label = '<b>Get the chip html from Craft</b>';
        const entryId = viewElement.getAttribute('data-entryid');
        const siteId = viewElement.getAttribute('data-siteid');

        return modelWriter.createElement('craftEntries', {
          label: label,
          entryId: entryId,
          siteId: siteId,
        });
      },
    });

    // for converting model into editing view we see in editor UI
    conversion.for('editingDowncast').elementToElement({
      model: 'craftEntries',
      view: (modelItem, {writer: viewWriter}) => {
        console.log('editingDowncast');
        // console.log(modelItem);
        const widgetElement = createEntriesView(modelItem, viewWriter);
        // console.log(widgetElement);

        // Enable widget handling on an entry element inside the editing view.
        return toWidget(widgetElement, viewWriter);
      },
    });

    // for converting model data into output HTML data,
    conversion.for('dataDowncast').elementToElement({
      model: 'craftEntries',
      view: (modelItem, {writer: viewWriter}) => {
        console.log('dataDowncast');
        // console.log(modelItem);
        return createEntriesView(modelItem, viewWriter);
      },
    });

    // Helper method for both downcast converters.
    const createEntriesView = (modelItem, viewWriter) => {
      // console.log(modelItem.getAttribute('label'));
      const label = modelItem.getAttribute('label') ?? '<b>Placeholder card</b>';
      const entryId = modelItem.getAttribute('entryId') ?? null;
      const siteId =
        modelItem.getAttribute('siteId') ??
        this.editor.config.get('elementSiteId') ??
        null;

      // if label is empty - get entry from DB via actionEntryCardHtml

      //const cardLink = viewWriter.createContainerElement('a');
      const cardContainer = viewWriter.createContainerElement(
        'div',
        {
          class: 'entry-card',
          'data-entryId': entryId,
          'data-siteId': siteId,
        }
        //[cardLink],
      );

      // Insert the entry label (as a text).
      // const innerText = viewWriter.createText('my labeel');
      // viewWriter.insert(viewWriter.createPositionAt(/*cardLink*/cardContainer, 0), innerText);

      // writer.createUIElement( 'span', null, function( domDocument ) {
      //   const domElement = this.toDomElement( domDocument );
      //   domElement.innerHTML = '<b>this is ui element</b>';
      //
      //   return domElement;
      // } );

      const card = viewWriter.createRawElement(
        'div',
        null,
        function (domElement) {
          console.log(domElement);
          domElement.innerHTML = label; //.innerHTML;
        }
      );
      viewWriter.insert(
        viewWriter.createPositionAt(/*cardLink*/ cardContainer, 0),
        card
      );

      return cardContainer;
    };
  }
}
