import {Craftcms as CraftcmsDll, icons} from '../src';
import Craftcms from '../src/craftcms';

import ckeditor from './../theme/icons/ckeditor.svg';

describe('CKEditor5 Craftcms DLL', () => {
	it('exports Craftcms', () => {
		expect(CraftcmsDll).to.equal(Craftcms);
	});

	describe('icons', () => {
		it('exports the "ckeditor" icon', () => {
			expect(icons.ckeditor).to.equal(ckeditor);
		});
	});
});
