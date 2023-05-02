import CKEditorInspector from '@ckeditor/ckeditor5-inspector';

import {ClassicEditor} from '@ckeditor/ckeditor5-editor-classic';

import {Autoformat} from '@ckeditor/ckeditor5-autoformat';
import {Bold, Code, Italic} from '@ckeditor/ckeditor5-basic-styles';
import {BlockQuote} from '@ckeditor/ckeditor5-block-quote';
import {CodeBlock} from '@ckeditor/ckeditor5-code-block';
import {Essentials} from '@ckeditor/ckeditor5-essentials';
import {Heading} from '@ckeditor/ckeditor5-heading';
import {
	Image,
	ImageCaption,
	ImageStyle,
	ImageToolbar,
	ImageUpload,
} from '@ckeditor/ckeditor5-image';
import {Indent} from '@ckeditor/ckeditor5-indent';
import {Link} from '@ckeditor/ckeditor5-link';
import {List} from '@ckeditor/ckeditor5-list';
import {MediaEmbed} from '@ckeditor/ckeditor5-media-embed';
import {Paragraph} from '@ckeditor/ckeditor5-paragraph';
import {Table, TableToolbar} from '@ckeditor/ckeditor5-table';
import {Base64UploadAdapter} from '@ckeditor/ckeditor5-upload';

import Craftcms from '../src/craftcms';

/* global document, window */

ClassicEditor.create(document.querySelector('#editor'), {
	plugins: [
		Craftcms,
		Essentials,
		Autoformat,
		BlockQuote,
		Bold,
		Heading,
		Image,
		ImageCaption,
		ImageStyle,
		ImageToolbar,
		ImageUpload,
		Indent,
		Italic,
		Link,
		List,
		MediaEmbed,
		Paragraph,
		Table,
		TableToolbar,
		CodeBlock,
		Code,
		Base64UploadAdapter,
	],
	toolbar: [
		'craftcmsButton',
		'|',
		'heading',
		'|',
		'bold',
		'italic',
		'link',
		'code',
		'bulletedList',
		'numberedList',
		'|',
		'outdent',
		'indent',
		'|',
		'uploadImage',
		'blockQuote',
		'insertTable',
		'mediaEmbed',
		'codeBlock',
		'|',
		'undo',
		'redo',
	],
	image: {
		toolbar: [
			'imageStyle:inline',
			'imageStyle:block',
			'imageStyle:side',
			'|',
			'imageTextAlternative',
		],
	},
	table: {
		contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells'],
	},
})
	.then((editor) => {
		window.editor = editor;
		CKEditorInspector.attach(editor);
		window.console.log('CKEditor 5 is ready.', editor);
	})
	.catch((err) => {
		window.console.error(err.stack);
	});
