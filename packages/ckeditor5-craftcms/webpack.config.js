const getConfig = require('@ckeditor/ckeditor5-package-tools/lib/utils/get-webpack-config-dll.js');
const { CKEditorTranslationsPlugin } = require( '@ckeditor/ckeditor5-dev-translations' );

const config = getConfig({
	cwd: __dirname,
});
config.plugins.push(
	new CKEditorTranslationsPlugin( {
		language: 'en',
		additionalLanguages: 'all',
		skipPluralFormFunction: true
	} )
);

module.exports = config;
