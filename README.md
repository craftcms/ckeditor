# CKEditor for Craft CMS

This plugin adds a “CKEditor” field type to Craft CMS, which provides a wrapper for [CKEditor](https://ckeditor.com/).

## Requirements

This plugin requires Craft CMS 3.7.63 or later.

## Installation

You can install this plugin from the Plugin Store or with Composer.

#### From the Plugin Store

Go to the Plugin Store in your project’s Control Panel and search for “CKEditor”. Then click on the “Install” button in its modal window.

#### With Composer

Open your terminal and run the following commands:

```bash
# go to the project directory
cd /path/to/my-project.test

# tell Composer to load the plugin
composer require craftcms/ckeditor

# tell Craft to install the plugin
./craft plugin/install ckeditor
```

## Providing a CKEditor Build

CKEditor 5 (27.0.0, “classic” build) is used by default. To customize the CKEditor build, go to **Settings** → **CKEditor**, and edit the **CKEditor Build URL** setting.

You can set this to a build provided by the [CKEditor CDN](https://cdn.ckeditor.com/), or you can supply your own customized CKEditor build, published somewhere within your web root.

- [CKEditor 4 builder](https://ckeditor.com/cke4/builder)
- [CKEditor 5 builder](https://ckeditor.com/ckeditor-5/online-builder/)

## Configuration

### Editor Configuration

If you want to customize a field’s configuration options, you can do that by providing custom initialization code for the field, from its **Initialization Code** setting.

Reference the source `<textarea>` element’s ID using “`__EDITOR__`”, and be sure that the code returns the editor instance.

```js
// CKEditor 4
return CKEDITOR.replace('__EDITOR__', {
    language,
    filebrowserBrowseUrl, // CKE4 only
    filebrowserImageBrowseUrl, // CKE4 only
    // ...
});

// CKEditor 5
return await ClassicEditor
    .create(document.querySelector('#__EDITOR__'), {
        language,
        // ...
    });
```

- [CKEditor 4 config options](https://ckeditor.com/docs/ckeditor4/latest/api/CKEDITOR_config.html)
- [CKEditor 5 config options](https://ckeditor.com/docs/ckeditor5/latest/api/module_core_editor_editorconfig-EditorConfig.html)

### HTML Purifier Configs

CKEditor fields use [HTML Purifier](http://htmlpurifier.org) to ensure that no malicious code makes it into its field values, to prevent XSS attacks
and other vulnerabilities.

You can create custom HTML Purifier configs that will be available to your CKEditor fields. They should be created as JSON files in
your `config/htmlpurifier/` folder.

Use this as a starting point, which is the default config that CKEditor fields use if no custom HTML Purifier config is selected:

```json
{
  "Attr.AllowedFrameTargets": [
    "_blank"
  ],
  "Attr.EnableID": true
}
```

See the [HTML Purifier documentation](http://htmlpurifier.org/live/configdoc/plain.html) for a list of available config options.
