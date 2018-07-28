# CKEditor (Beta) for Craft CMS

This plugin adds a “CKEditor” field type to Craft CMS, which provides a rich text editor powered by [CKEditor 5] (Developer Preview v0.11.0).

## Requirements

This plugin requires Craft CMS 3.0.0-RC15 or later.

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
./craft install/plugin ckeditor
```

## Configuration

### HTML Purifier Configs

You can create custom HTML Purifier configs that will be available to your CKEditor fields. They should be created as JSON files in your `config/htmlpurifier/` folder.

See the [HTML Purifier documentation] for a list of available config options. 

## Roadmap

You can track our progress toward the 1.0 GA release from the [1.0 project](https://github.com/craftcms/ckeditor/projects/1).

[CKEditor 5]: https://ckeditor5.github.io/
[HTML Purifier documentation]: http://htmlpurifier.org/live/configdoc/plain.html
