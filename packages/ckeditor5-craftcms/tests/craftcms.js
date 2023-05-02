import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import Heading from '@ckeditor/ckeditor5-heading/src/heading';
import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
import Craftcms from '../src/craftcms';

/* global document */

describe('Craftcms', () => {
	it('should be named', () => {
		expect(Craftcms.pluginName).to.equal('Craftcms');
	});

	describe('init()', () => {
		let domElement, editor;

		beforeEach(async () => {
			domElement = document.createElement('div');
			document.body.appendChild(domElement);

			editor = await ClassicEditor.create(domElement, {
				plugins: [Paragraph, Heading, Essentials, Craftcms],
				toolbar: ['craftcmsButton'],
			});
		});

		afterEach(() => {
			domElement.remove();
			return editor.destroy();
		});

		it('should load Craftcms', () => {
			const myPlugin = editor.plugins.get('Craftcms');

			expect(myPlugin).to.be.an.instanceof(Craftcms);
		});

		it('should add an icon to the toolbar', () => {
			expect(editor.ui.componentFactory.has('craftcmsButton')).to.equal(
				true
			);
		});

		it('should add a text into the editor after clicking the icon', () => {
			const icon = editor.ui.componentFactory.create('craftcmsButton');

			expect(editor.getData()).to.equal('');

			icon.fire('execute');

			expect(editor.getData()).to.equal('<p>Hello CKEditor 5!</p>');
		});
	});
});
