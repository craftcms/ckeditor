import {Command} from 'ckeditor5';

export default class CraftEntriesCommand extends Command {
  execute(options) {
    const editor = this.editor;
    const selection = editor.model.document.selection;
    const hasSelection = !selection.isCollapsed && selection.getFirstRange();
    if (hasSelection) {
      const selectedElement = selection.getSelectedElement();
      editor.execute('insertParagraph', {
        position: editor.model.createPositionAfter(selectedElement),
      });
    }

    editor.model.change((writer) => {
      // Create a <craft-entry> element with the `data-entry-id` attribute
      const craftEntries = writer.createElement('craftEntryModel', {
        ...Object.fromEntries(selection.getAttributes()),
        cardHtml: options.cardHtml,
        entryId: options.entryId,
        siteId: options.siteId,
      });

      // ... and insert it into the document. Put the selection on the inserted element.
      editor.model.insertObject(craftEntries, null, null, {
        setSelection: 'on',
      });
    });
  }

  refresh() {
    this.isEnabled = true;
  }
}
