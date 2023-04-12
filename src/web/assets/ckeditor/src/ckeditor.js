import './ckeditor.css';
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
import {
  GeneralHtmlSupport,
  HtmlComment,
} from '@ckeditor/ckeditor5-html-support';
import {Heading} from '@ckeditor/ckeditor5-heading';
import {HorizontalLine} from '@ckeditor/ckeditor5-horizontal-line';
import {HtmlEmbed} from '@ckeditor/ckeditor5-html-embed';
import {Indent} from '@ckeditor/ckeditor5-indent';
import {LinkEditing, AutoLink, LinkImage} from '@ckeditor/ckeditor5-link';
import {List, TodoList} from '@ckeditor/ckeditor5-list';
import {MediaEmbed, MediaEmbedToolbar} from '@ckeditor/ckeditor5-media-embed';
import {PageBreak} from '@ckeditor/ckeditor5-page-break';
import {Paragraph} from '@ckeditor/ckeditor5-paragraph';
import {PasteFromOffice} from '@ckeditor/ckeditor5-paste-from-office';
import {Plugin} from '@ckeditor/ckeditor5-core';
import {SelectAll} from '@ckeditor/ckeditor5-select-all';
import {SourceEditing} from '@ckeditor/ckeditor5-source-editing';
import {Style} from '@ckeditor/ckeditor5-style';
import {Table, TableCaption, TableToolbar} from '@ckeditor/ckeditor5-table';
import {WordCount} from '@ckeditor/ckeditor5-word-count';
import CraftLinkUI from './plugins/linkui';
import CraftImageInsertUI from './plugins/imageinsertui';

ClassicEditor.builtinPlugins = [];

export default {
  Plugin,
  ClassicEditor,
  create: async function (element, config) {
    if (typeof element === 'string') {
      element = document.querySelector(`#${element}`);
    }
    const editor = await this.ClassicEditor.create(
      element,
      Object.assign(
        {
          plugins: [
            Alignment,
            AutoImage,
            AutoLink,
            Autoformat,
            BlockQuote,
            Bold,
            Code,
            CodeBlock,
            Essentials,
            FindAndReplace,
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
            Italic,
            LinkEditing,
            LinkImage,
            List,
            MediaEmbed,
            MediaEmbedToolbar,
            PageBreak,
            Paragraph,
            PasteFromOffice,
            SelectAll,
            SourceEditing,
            Strikethrough,
            Style,
            Subscript,
            Superscript,
            Table,
            TableCaption,
            TableToolbar,
            TodoList,
            Underline,
            WordCount,
            CraftImageInsertUI,
            CraftLinkUI,
          ],
        },
        config
      )
    );

    // Keep the source element updated with changes
    editor.model.document.on('change', () => {
      editor.updateSourceElement();
    });

    return editor;
  },
};
