<p align="center"><img src="./src/icon.svg" width="100" height="100" alt="CKEditor icon"></p>

<h1 align="center">CKEditor</h1>

This plugin adds a “CKEditor” field type to Craft CMS, which provides a deeply-integrated rich text editor, powered by [CKEditor 5](https://ckeditor.com/).

![A CKEditor field.](field.png)

## Requirements

This plugin requires Craft CMS 4.4.7 or later.

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

## Configuration

CKEditor configurations are managed globally from **Settings** → **CKEditor**.

Configurations define the available toolbar buttons, as well as any custom [config options](https://ckeditor.com/docs/ckeditor5/latest/api/module_core_editor_editorconfig-EditorConfig.html) and CSS styles that should be regisered with the field.

New configurations can also be created inline from CKEditor field settings.

![A “Create a new field” page within the Craft CMS control panel, with “CKEditor” as the chosen field type. A slideout is open with CKEditor configuration settings.](field-settings.png)

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

## Embedding Videos/Media in CKEditor 5

CKEditor 5 uses `oembed` to add media. Craft CMS' HTML purifier has been adjusted to support `oembed`.
If you want to change the allowed domains, please use the HTML Purifier `URI.SafeIframeRegexp` option.

Please note that to display the embedded media on your website, you'll have to follow the 
[CKEditor 5 documentation](https://ckeditor.com/docs/ckeditor5/latest/features/media-embed.html#displaying-embedded-media-on-your-website).
