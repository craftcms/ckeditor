/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

export {default as CraftImageInsertUI} from './image/imageinsert/imageinsertui';
export {default as ImageTransform} from './image/imagetransform';
export {default as ImageEditor} from './image/imageeditor';

import 'ckeditor5/ckeditor5.css';
import './ckeditor5-craftcms.css';
import CraftEntries from './entries/entries';
import CraftLink from './link/link';
import CKEditorInspector from '@ckeditor/ckeditor5-inspector';
import {ClassicEditor, Heading, SourceEditing} from 'ckeditor5';

export {CraftEntries};
export {CraftLink};

const trackChangesInSourceMode = function (editor) {
  const sourceEditing = editor.plugins.get(SourceEditing);
  const $editorElement = $(editor.ui.view.element);
  const $sourceElement = $(editor.sourceElement);
  const ns = `ckeditor${Math.floor(Math.random() * 1000000000)}`;
  const events = [
    'keypress',
    'keyup',
    'change',
    'focus',
    'blur',
    'click',
    'mousedown',
    'mouseup',
  ]
    .map((type) => `${type}.${ns}`)
    .join(' ');

  sourceEditing.on('change:isSourceEditingMode', () => {
    const $sourceEditingContainer = $editorElement.find(
      '.ck-source-editing-area',
    );

    if (sourceEditing.isSourceEditingMode) {
      let content = $sourceEditingContainer.attr('data-value');
      $sourceEditingContainer.on(events, () => {
        if (
          content !== (content = $sourceEditingContainer.attr('data-value'))
        ) {
          $sourceElement.val(content);
        }
      });
    } else {
      $sourceEditingContainer.off(`.${ns}`);
    }
  });
};

const headingShortcuts = function (editor, config) {
  if (config.heading !== undefined) {
    var headingOptions = config.heading.options;

    if (headingOptions.find((x) => x.view === 'h1') !== undefined) {
      editor.keystrokes.set('Ctrl+Alt+1', () =>
        editor.execute('heading', {value: 'heading1'}),
      );
    }

    if (headingOptions.find((x) => x.view === 'h2') !== undefined) {
      editor.keystrokes.set('Ctrl+Alt+2', () =>
        editor.execute('heading', {value: 'heading2'}),
      );
    }

    if (headingOptions.find((x) => x.view === 'h3') !== undefined) {
      editor.keystrokes.set('Ctrl+Alt+3', () =>
        editor.execute('heading', {value: 'heading3'}),
      );
    }

    if (headingOptions.find((x) => x.view === 'h4') !== undefined) {
      editor.keystrokes.set('Ctrl+Alt+4', () =>
        editor.execute('heading', {value: 'heading4'}),
      );
    }

    if (headingOptions.find((x) => x.view === 'h5') !== undefined) {
      editor.keystrokes.set('Ctrl+Alt+5', () =>
        editor.execute('heading', {value: 'heading5'}),
      );
    }

    if (headingOptions.find((x) => x.view === 'h6') !== undefined) {
      editor.keystrokes.set('Ctrl+Alt+6', () =>
        editor.execute('heading', {value: 'heading6'}),
      );
    }

    if (headingOptions.find((x) => x.model === 'paragraph') !== undefined) {
      editor.keystrokes.set('Ctrl+Alt+p', 'paragraph');
    }
  }
};

/**
 * Handle cut, copy, paste, drag
 * Prevents pasting/dragging nested entries to another editor instance.
 * Duplicates nested entries on copy+paste
 *
 * @param editor
 */
const handleClipboard = function (editor, plugins) {
  let copyFromEditorId = null;
  const documentView = editor.editing.view.document;
  const clipboardPipelinePlugin = editor.plugins.get('ClipboardPipeline');

  // on cut/copy/drag start - get editor id
  // https://ckeditor.com/docs/ckeditor5/latest/framework/deep-dive/clipboard.html
  documentView.on('clipboardOutput', (event, data) => {
    // get the editor ID so that we can compare it on paste/drag stop
    copyFromEditorId = editor.id;
  });

  // https://ckeditor.com/docs/ckeditor5/latest/api/module_clipboard_clipboardpipeline-ClipboardPipeline.html
  // handle pasting/dragging nested elements
  documentView.on('clipboardInput', async (event, data) => {
    let pasteContent = data.dataTransfer.getData('text/html');

    // if it's not html content, abort and let the clipboard feature handle the input
    if (!pasteContent) {
      return;
    }

    // if what we're pasting contains nested element(s)
    if (pasteContent.includes('<craft-entry')) {
      if (data.method == 'drop' && copyFromEditorId === editor.id) {
        // if we're dragging AND it's the same editor instance - carry on
      }
      // if we're pasting or dragging to a different editor instance - maybe duplicate
      else if (
        data.method == 'paste' ||
        (data.method == 'drop' && copyFromEditorId !== editor.id)
      ) {
        let duplicatedContent = pasteContent;
        let errors = false;
        const targetSiteId = Craft.siteId;
        let ownerId = null;
        let layoutElementUid = null;
        const editorData = editor.getData();
        const matches = [
          ...pasteContent.matchAll(
            /data-entry-id="([0-9]+)[^>]*data-site-id="([0-9]+)/g,
          ),
        ];

        // Stop the event emitter from calling further callbacks for this event interaction
        // we need to get duplicates and update the content snippet that's being pasted in
        // before we can call further events
        event.stop();

        const $editorElement = $(editor.ui.view.element);
        const $parentForm = $editorElement.parents('form');
        let elementEditor = $parentForm.data('elementEditor');

        // ensure we're working with a draft
        await elementEditor.ensureIsDraftOrRevision();

        // get the target owner id, in case we're pasting to a different element all together

        // first try to get that ID by wrapper div
        // this way if the CKE field we're pasting into is nested in a matrixblock (or similar), we'll get the correct owner ID
        let inputContainer = $editorElement.parents('.input');
        if (inputContainer.length > 0) {
          let divWrapper = $(inputContainer[0]).find('div.ckeditor-container');
          if (divWrapper.length > 0) {
            ownerId = $(divWrapper[0]).data('element-id');
          }
        }

        // if we still didn't get the ownerId this way, get it form the element editor
        if (ownerId == null) {
          ownerId = elementEditor.settings.elementId;
        }

        // get the target field id, in case we're pasting to a different field all together (not different instance, different field)
        layoutElementUid = $editorElement
          .parents('.field')
          .data('layoutElement');

        // for each nested entry ID we found
        for (let i = 0; i < matches.length; i++) {
          let entryId = null;
          if (matches[i][1]) {
            entryId = matches[i][1];
          }
          let sourceSiteId = null;
          if (matches[i][2]) {
            sourceSiteId = matches[i][2];
          }

          if (entryId !== null) {
            // check if we're copying to a different field and if this entry ID is in the field already
            const regex = new RegExp('data-entry-id="' + entryId + '"');
            // if we're pasting to the same editor instance and that entryId isn't in use there (cut & paste) - carry on
            if (copyFromEditorId === editor.id && !regex.test(editorData)) {
              // if it's not - carry on
            } else {
              // if it's a different editor instance or the entryId is already is use (copy & paste)
              // duplicate it and replace the string's ID with the new one

              let targetEntryTypeIds = null;
              if (copyFromEditorId !== editor.id) {
                if (!plugins.includes(CraftEntries)) {
                  // if we're pasting to a different editor instance and that instance doesn't have CraftEntries plugins - bail straight away
                  Craft.cp.displayError(
                    Craft.t(
                      'ckeditor',
                      'This field doesn’t allow nested entries.',
                    ),
                  );
                  errors = true;
                } else {
                  targetEntryTypeIds = editor.config
                    .get('entryTypeOptions')
                    .map((option) => option['value']);
                }
              }

              await Craft.sendActionRequest(
                'POST',
                'ckeditor/ckeditor/duplicate-nested-entry',
                {
                  data: {
                    entryId: entryId,
                    targetSiteId: targetSiteId,
                    sourceSiteId: sourceSiteId,
                    targetEntryTypeIds: targetEntryTypeIds,
                    targetOwnerId: ownerId,
                    targetLayoutElementUid: layoutElementUid,
                  },
                },
              )
                .then((response) => {
                  if (response.data.newEntryId) {
                    duplicatedContent = duplicatedContent.replace(
                      'data-entry-id="' + entryId + '"',
                      'data-entry-id="' + response.data.newEntryId + '"',
                    );
                  }
                  if (response.data.newSiteId) {
                    duplicatedContent = duplicatedContent.replace(
                      'data-site-id="' + sourceSiteId + '"',
                      'data-site-id="' + response.data.newSiteId + '"',
                    );
                  }
                })
                .catch((e) => {
                  errors = true;
                  Craft.cp.displayError(e?.response?.data?.message);
                  console.error(e?.response?.data?.additionalMessage);
                });
            }
          }
        }

        // only update the data.content and fire further callbacks if we didn't encounter errors;
        if (!errors) {
          // data.content is what's passed down the chain to be pasted in
          data.content = editor.data.htmlProcessor.toView(duplicatedContent);
          // and now we can fire further callbacks for this event interaction
          clipboardPipelinePlugin.fire('inputTransformation', data);
        }
      }
    }
  });
};

export const create = async function (element, config) {
  if (typeof element === 'string') {
    element = document.querySelector(`#${element}`);
  }

  config.licenseKey = 'GPL';

  const editor = await ClassicEditor.create(element, config);

  if (Craft.showCkeditorInspector && Craft.userIsAdmin) {
    CKEditorInspector.attach(editor);
  }

  // accessibility: https://github.com/craftcms/ckeditor/issues/74
  editor.editing.view.change((writer) => {
    const viewEditableRoot = editor.editing.view.document.getRoot();

    // adjust aria-label
    if (
      typeof config.accessibleFieldName != 'undefined' &&
      config.accessibleFieldName.length
    ) {
      let ariaLabel = viewEditableRoot.getAttribute('aria-label');
      writer.setAttribute(
        'aria-label',
        config.accessibleFieldName + ', ' + ariaLabel,
        viewEditableRoot,
      );
    }

    // adjust aria-describedby
    if (typeof config.describedBy != 'undefined' && config.describedBy.length) {
      writer.setAttribute(
        'aria-describedby',
        config.describedBy,
        viewEditableRoot,
      );
    }
  });

  const $editorElement = $(editor.ui.view.element);
  const $parentForm = $editorElement.parents('form');
  let elementEditor = $parentForm.data('elementEditor');

  // Update the source element before the initial form value has been recorded,
  // in case the value needs to be normalized
  if (!elementEditor) {
    editor.updateSourceElement();
  } else {
    elementEditor.pause();
    editor.updateSourceElement();
    elementEditor.$container.data(
      'initialSerializedValue',
      elementEditor.serializeForm(true),
    );
    elementEditor.resume();
  }

  // Keep the source element updated with changes
  editor.model.document.on('change:data', () => {
    editor.updateSourceElement();
  });

  // Track changes in the source mode
  if (config.plugins.includes(SourceEditing)) {
    trackChangesInSourceMode(editor, SourceEditing);
  }

  // shortcuts for headings & paragraph
  if (config.plugins.includes(Heading)) {
    headingShortcuts(editor, config);
  }

  handleClipboard(editor, config.plugins);

  return editor;
};
