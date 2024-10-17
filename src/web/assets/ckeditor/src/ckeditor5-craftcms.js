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
import ImageEditor from './image/imageeditor';
import {TextPartLanguage} from '@ckeditor/ckeditor5-language';
import {Anchor} from '@northernco/ckeditor5-anchor-drupal';

const allPlugins = [
  CKEditor5.paragraph.Paragraph,
  CKEditor5.selectAll.SelectAll,
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
  ImageEditor,
  CraftLinkUI,
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
      'ImageEditor',
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

  return editor;
};
