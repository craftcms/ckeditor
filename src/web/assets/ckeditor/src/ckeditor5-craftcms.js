/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

import './ckeditor5-craftcms.css';
import {Alignment} from '@ckeditor/ckeditor5-alignment';
import {
  AutoImage,
  Image,
  ImageCaption,
  ImageStyle,
  ImageToolbar,
} from '@ckeditor/ckeditor5-image';
import {Autoformat} from '@ckeditor/ckeditor5-autoformat';
import {BlockQuote} from '@ckeditor/ckeditor5-block-quote';
import {
  Bold,
  Code,
  Italic,
  Strikethrough,
  Subscript,
  Superscript,
  Underline,
} from '@ckeditor/ckeditor5-basic-styles';
import {ClassicEditor} from '@ckeditor/ckeditor5-editor-classic';
import {CodeBlock} from '@ckeditor/ckeditor5-code-block';
import {Essentials} from '@ckeditor/ckeditor5-essentials';
import {FindAndReplace} from '@ckeditor/ckeditor5-find-and-replace';
import {Font} from '@ckeditor/ckeditor5-font';
import {
  GeneralHtmlSupport,
  HtmlComment,
} from '@ckeditor/ckeditor5-html-support';
import {Heading} from '@ckeditor/ckeditor5-heading';
import {HorizontalLine} from '@ckeditor/ckeditor5-horizontal-line';
import {HtmlEmbed} from '@ckeditor/ckeditor5-html-embed';
import {Indent, IndentBlock} from '@ckeditor/ckeditor5-indent';
import {LinkEditing, AutoLink, LinkImage} from '@ckeditor/ckeditor5-link';
import {List, ListProperties, TodoList} from '@ckeditor/ckeditor5-list';
import {MediaEmbed, MediaEmbedToolbar} from '@ckeditor/ckeditor5-media-embed';
import {PageBreak} from '@ckeditor/ckeditor5-page-break';
import {PasteFromOffice} from '@ckeditor/ckeditor5-paste-from-office';
import {RemoveFormat} from '@ckeditor/ckeditor5-remove-format';
import {SourceEditing} from '@ckeditor/ckeditor5-source-editing';
import {Style} from '@ckeditor/ckeditor5-style';
import {
  Table,
  TableCaption,
  TableCellProperties,
  TableProperties,
  TableToolbar,
  TableUI,
} from '@ckeditor/ckeditor5-table';
import {WordCount} from '@ckeditor/ckeditor5-word-count';
import {default as CraftImageInsertUI} from './image/imageinsert/imageinsertui';
import {default as CraftLinkUI} from './link/linkui';
import ImageTransform from './image/imagetransform';
import {TextPartLanguage} from '@ckeditor/ckeditor5-language';
import CraftEntries from './entries/entries';
import CKEditorInspector from '@ckeditor/ckeditor5-inspector';
import {Anchor} from '@northernco/ckeditor5-anchor-drupal';

const allPlugins = [
  CKEditor5.paragraph.Paragraph,
  CKEditor5.selectAll.SelectAll,
  CKEditor5.clipboard.Clipboard,
  Alignment,
  Anchor,
  AutoImage,
  AutoLink,
  Autoformat,
  BlockQuote,
  Bold,
  Code,
  CodeBlock,
  List,
  ListProperties,
  Essentials,
  FindAndReplace,
  Font,
  GeneralHtmlSupport,
  Heading,
  HorizontalLine,
  HtmlComment,
  HtmlEmbed,
  Image,
  ImageCaption,
  ImageStyle,
  ImageToolbar,
  Indent,
  IndentBlock,
  Italic,
  LinkEditing,
  LinkImage,
  MediaEmbed,
  MediaEmbedToolbar,
  PageBreak,
  PasteFromOffice,
  RemoveFormat,
  SourceEditing,
  Strikethrough,
  Style,
  Subscript,
  Superscript,
  Table,
  TableCaption,
  TableCellProperties,
  TableProperties,
  TableToolbar,
  TableUI,
  TextPartLanguage,
  TodoList,
  Underline,
  WordCount,
  CraftImageInsertUI,
  ImageTransform,
  CraftLinkUI,
  CraftEntries,
];

const normalizeToolbarItem = (group) => {
  if (!$.isArray(group)) {
    group = [group];
  }
  return group.map((item) => {
    if (typeof item === 'string') {
      item = {button: item};
    }
    return item;
  });
};

const normalizeToolbarItems = (items) =>
  items.map((group) => normalizeToolbarItem(group));

export const toolbarItems = normalizeToolbarItems([
  {button: 'heading', configOption: 'heading'},
  {button: 'style', configOption: 'style'},
  {button: 'alignment', configOption: 'alignment'},
  'bold',
  'italic',
  'underline',
  'strikethrough',
  'subscript',
  'superscript',
  'code',
  'link',
  'anchor',
  'textPartLanguage',
  {button: 'fontSize', configOption: 'fontSize'},
  'fontFamily',
  'fontColor',
  'fontBackgroundColor',
  'insertImage',
  'mediaEmbed',
  'htmlEmbed',
  'blockQuote',
  'insertTable',
  'codeBlock',
  'bulletedList',
  'numberedList',
  'todoList',
  ['outdent', 'indent'],
  'horizontalLine',
  'pageBreak',
  'removeFormat',
  'selectAll',
  'findAndReplace',
  ['undo', 'redo'],
  'sourceEditing',
  'createEntry',
]);

const pluginButtonMap = [
  {plugins: ['Alignment'], buttons: ['alignment']},
  {plugins: ['Anchor'], buttons: ['anchor']},
  {
    plugins: [
      'AutoImage',
      'CraftImageInsertUI',
      'Image',
      'ImageCaption',
      'ImageStyle',
      'ImageToolbar',
      'ImageTransform',
      'LinkImage',
    ],
    buttons: ['insertImage'],
  },
  {
    plugins: ['AutoLink', 'CraftLinkUI', 'LinkEditing', 'LinkImage'],
    buttons: ['link'],
  },
  {plugins: ['BlockQuote'], buttons: ['blockQuote']},
  {plugins: ['Bold'], buttons: ['bold']},
  {plugins: ['Code'], buttons: ['code']},
  {plugins: ['CodeBlock'], buttons: ['codeBlock']},
  {
    plugins: ['List', 'ListProperties'],
    buttons: ['bulletedList', 'numberedList'],
  },
  {
    plugins: ['Font'],
    buttons: ['fontSize', 'fontFamily', 'fontColor', 'fontBackgroundColor'],
  },
  {plugins: ['FindAndReplace'], buttons: ['findAndReplace']},
  {plugins: ['Heading'], buttons: ['heading']},
  {plugins: ['HorizontalLine'], buttons: ['horizontalLine']},
  {plugins: ['HtmlEmbed'], buttons: ['htmlEmbed']},
  {
    plugins: ['Indent', 'IndentBlock'],
    buttons: ['outdent', 'indent'],
  },
  {plugins: ['Italic'], buttons: ['italic']},
  {
    plugins: ['MediaEmbed', 'MediaEmbedToolbar'],
    buttons: ['mediaEmbed'],
  },
  {plugins: ['PageBreak'], buttons: ['pageBreak']},
  {plugins: ['RemoveFormat'], buttons: ['removeFormat']},
  {plugins: ['SourceEditing'], buttons: ['sourceEditing']},
  {plugins: ['Strikethrough'], buttons: ['strikethrough']},
  {plugins: ['Style'], buttons: ['style']},
  {plugins: ['Subscript'], buttons: ['subscript']},
  {plugins: ['Superscript'], buttons: ['superscript']},
  {
    plugins: [
      'Table',
      'TableCaption',
      'TableCellProperties',
      'TableProperties',
      'TableToolbar',
      'TableUI',
    ],
    buttons: ['insertTable'],
  },
  {plugins: ['TextPartLanguage'], buttons: ['textPartLanguage']},
  {plugins: ['TodoList'], buttons: ['todoList']},
  {plugins: ['Underline'], buttons: ['underline']},
  {plugins: ['CraftEntries'], buttons: ['createEntry']},
];

const findPlugin = (pluginName) => {
  for (const [k, v] of Object.entries(CKEditor5)) {
    if (typeof v === 'object') {
      for (const [k2, v2] of Object.entries(v)) {
        if (typeof v2 === 'function' && v2.pluginName === pluginName) {
          return v2;
        }
      }
    }
  }
};

export const registerPackage = (pkg) => {
  if (pkg.pluginNames) {
    pkg.pluginNames.forEach((pluginName) => {
      const plugin = findPlugin(pluginName);
      if (!plugin) {
        console.warn(
          `No plugin named ${pluginName} found in window.CKEditor5.`,
        );
        return;
      }
      allPlugins.push(plugin);
    });
  }

  if (pkg.toolbarItems) {
    pkg.toolbarItems = normalizeToolbarItems(pkg.toolbarItems);
    toolbarItems.push(...pkg.toolbarItems);
  }

  if (
    pkg.pluginNames &&
    pkg.pluginNames.length &&
    pkg.toolbarItems &&
    pkg.toolbarItems.length
  ) {
    pluginButtonMap.push({
      plugins: pkg.pluginNames,
      buttons: pkg.toolbarItems
        .flat()
        .map((item) => item.button)
        .flat(),
    });
  }
};

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
        const siteId = Craft.siteId;
        let ownerId = null;
        let layoutElementUid = null;
        const editorData = editor.getData();
        const matches = [...pasteContent.matchAll(/data-entry-id="([0-9]+)/g)];

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
        ownerId = elementEditor.settings.elementId;

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
                    siteId: siteId,
                    targetEntryTypeIds: targetEntryTypeIds,
                    targetOwnerId: ownerId,
                    targetLayoutElementUid: layoutElementUid,
                  },
                },
              )
                .then((response) => {
                  if (response.data.newEntryId) {
                    duplicatedContent = duplicatedContent.replace(
                      entryId,
                      response.data.newEntryId,
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

export const pluginNames = () => allPlugins.map((p) => p.pluginName);

export const create = async function (element, config) {
  let plugins = allPlugins;
  const removePlugins = [];

  if (config.toolbar) {
    // Remove any plugins that aren't included in the toolbar
    removePlugins.push(
      ...pluginButtonMap
        .filter(
          ({buttons}) =>
            !config.toolbar.items.some((button) => buttons.includes(button)),
        )
        .map(({plugins}) => plugins)
        .flat(),
    );
  }

  // remove ImageTransform if there aren't any image transforms
  if (!config.transforms || !config.transforms.length) {
    removePlugins.push('ImageTransform');
  }

  // remove MediaEmbedToolbar for now
  // see: https://github.com/ckeditor/ckeditor5-react/issues/267
  // and: https://github.com/ckeditor/ckeditor5/issues/9824
  // for more info
  removePlugins.push('MediaEmbedToolbar');

  if (removePlugins.length) {
    plugins = plugins.filter((p) => !removePlugins.includes(p.pluginName));
  }

  if (typeof element === 'string') {
    element = document.querySelector(`#${element}`);
  }

  const editor = await ClassicEditor.create(
    element,
    Object.assign({plugins}, config),
  );

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

  // Update the source element before the initial form value has been recorded,
  // in case the value needs to be normalized
  editor.updateSourceElement();

  // Keep the source element updated with changes
  editor.model.document.on('change:data', () => {
    editor.updateSourceElement();
  });

  // Track changes in the source mode
  if (plugins.includes(SourceEditing)) {
    trackChangesInSourceMode(editor, SourceEditing);
  }

  // shortcuts for headings & paragraph
  if (plugins.includes(Heading)) {
    headingShortcuts(editor, config);
  }

  handleClipboard(editor, plugins);

  return editor;
};
