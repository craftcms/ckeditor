# CKEditor (Beta) plugin for Craft

This plugin adds a “CKEditor” field type to Craft CMS, which provides a rich text editor powered by [CKEditor 5] (Developer Preview v0.11.0).

## Requirements

This plugin requires Craft CMS 3.0.0-RC1 or later.

## Installation

To install the plugin, follow these instructions.

1. Open your terminal and go to your Craft project:

        cd /path/to/project

2. Then tell Composer to load the plugin:

        composer require craftcms/ckeditor

3. In the Control Panel, go to Settings → Plugins and click the “Install” button for CKEditor.

## Configuration

### HTML Purifier Configs

You can create custom HTML Purifier configs that will be available to your Redactor fields. They should be created as JSON files in your `config/htmlpurifier/` folder.

See the [HTML Purifier documentation] for a list of available config options. 

## Roadmap

You can track our progress toward the 1.0 GA release from the [1.0 project](https://github.com/craftcms/ckeditor/projects/1).

[CKEditor 5]: https://ckeditor5.github.io/
[HTML Purifier documentation]: http://htmlpurifier.org/live/configdoc/plain.html
