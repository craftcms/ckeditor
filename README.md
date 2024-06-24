<p align="center"><img src="./src/icon.svg" width="100" height="100" alt="CKEditor icon"></p>

<h1 align="center">CKEditor</h1>

This plugin adds a “CKEditor” field type to Craft CMS, which provides a deeply-integrated rich text editor, powered by [CKEditor 5](https://ckeditor.com/).

![A CKEditor field with example content filled in.](field.png)

## Requirements

This plugin requires Craft CMS 4.5.0 or later.

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

CKEditor configs are managed globally from **Settings** → **CKEditor**.

Configurations define the available toolbar buttons, as well as any custom [config options](https://ckeditor.com/docs/ckeditor5/latest/api/module_core_editor_editorconfig-EditorConfig.html) and CSS styles that should be registered with the field.

New configs can also be created inline from CKEditor field settings.

![A “Create a new field” page within the Craft CMS control panel, with “CKEditor” as the chosen field type. A slideout is open with CKEditor config settings.](field-settings.png)

Once you have selected which toolbar buttons should be available in fields using a given configuration, additional settings may be applied via **Config options**. Options can be defined as static JSON, or a dynamically-evaluated JavaScript snippet; the latter is used as the body of an [immediately-invoked function expression](https://developer.mozilla.org/en-US/docs/Glossary/IIFE), and does not receive any arguments.

> [!NOTE]  
> Available options can be found in the [CKEditor's documentation](https://ckeditor.com/docs/ckeditor5/latest/api/module_core_editor_editorconfig-EditorConfig.html). Craft will auto-complete config properties for most bundled CKEditor extensions.

### Examples

#### Table Features

Suppose we wanted to give editors more control over the layout and appearance of in-line tables. Whenever you add the “Insert table” button to an editor, inline controls are exposed for _Table Row_, _Table Column_, and _Merge_. These can be supplemented with _Table Properties_, _Table Cell Properties_, and _Table Caption_ buttons by adding them in the field’s **Config options** section:

```json
{
  "table": {
    "contentToolbar": [
      "tableRow",
      "tableColumn",
      "mergeTableCells",
      "toggleTableCaption",
      "tableProperties",
      "tableCellProperties"
    ]
  }
}
```

Some of these additional buttons can be customized further. For example, to modify the colors available for a cell’s background (within the “[Table Cell Properties](https://ckeditor.com/docs/ckeditor5/latest/api/module_table_tableconfig-TableConfig.html#member-tableCellProperties)” balloon), you would provide an array compatible with the [`TableColorConfig` schema](https://ckeditor.com/docs/ckeditor5/latest/api/module_table_tableconfig-TableColorConfig.html) under `table.tableCellProperties.backgroundColors`.

#### External Links

Multiple configuration concerns can coexist in one **Config options** object! You might have a `table` key at the top level to customize table controls (as we've done above), as well as a `link` key that introduces “external” link support:

```json
{
  "table": { /* ... */ },
  "link": {
    "decorators": {
      "openInNewTab": {
        "mode": "manual",
        "label": "Open in new tab?",
        "attributes": {
          "target": "_blank",
          "rel": "noopener noreferrer"
        }
      }
    }
  }
}
```

> [!TIP]  
> An automatic version of this feature is available natively, via the [`link.addTargetToExternalLinks`](https://ckeditor.com/docs/ckeditor5/latest/api/module_link_linkconfig-LinkConfig.html#member-addTargetToExternalLinks) option.

### Registering Custom Styles

CKEditor’s [Styles](https://ckeditor.com/docs/ckeditor5/latest/features/style.html) plugin makes it easy to apply custom styles to your content via CSS classes.

You can define custom styles within CKEditor configs using the [`style`](https://ckeditor.com/docs/ckeditor5/latest/api/module_core_editor_editorconfig-EditorConfig.html#member-style) config option:

```js
return {
  style: {
    definitions: [
      {
        name: 'Tip',
        element: 'p',
        classes: ['note']
      },
      {
        name: 'Warning',
        element: 'p',
        classes: ['note', 'note--warning']
      },
    ]
  }
}
```

You can then register custom CSS styles that should be applied within the editor when those styles are selected:

```css
.ck.ck-content p.note {
    border-left: 4px solid #4a7cf6;
    padding-left: 1rem;
    color: #4a7cf6;
}

.ck.ck-content p.note--warning {
    border-left-color: #e5422b;
    color: #e5422b;
}
```

### HTML Purifier Configs

CKEditor fields use [HTML Purifier](http://htmlpurifier.org) to ensure that no malicious code makes it into its field values, to prevent XSS attacks and other vulnerabilities.

You can create custom HTML Purifier configs that will be available to your CKEditor fields. They should be created as JSON files in your `config/htmlpurifier/` folder.

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

For advanced customization, you can modify the `HTMLPurifier_Config` object directly via the `craft\ckeditor\Field::EVENT_MODIFY_PURIFIER_CONFIG` event.

```php
use craft\htmlfield\events\ModifyPurifierConfigEvent;
use craft\ckeditor\Field;
use HTMLPurifier_Config;
use yii\base\Event;

Event::on(
    Field::class,
    Field::EVENT_MODIFY_PURIFIER_CONFIG,
    function(ModifyPurifierConfigEvent $event) {
        /** @var HTMLPurifier_Config $config */
        $config = $event->config;
        // ...
    }
);
```

### Embedding Media

CKEditor 5 stores references to embedded media embeds using `oembed` tags. Craft CMS configures HTML Purifier to support these tags, however you will need to ensure that the `URI.SafeIframeRegexp` HTML Purifier setting is set to allow any domains you wish to embed content from. 

See CKEditor’s [media embed documentation](https://ckeditor.com/docs/ckeditor5/latest/features/media-embed.html#displaying-embedded-media-on-your-website) for examples of how to show the embedded media on your front end.

## Converting Redactor Fields

You can use the `ckeditor/convert` command to convert any existing Redactor fields over to CKEditor. For each unique Redactor config, a new CKEditor config will be created and associated with the appropriate field(s).

```sh
php craft ckeditor/convert
```

## Adding CKEditor Plugins

Craft CMS plugins can register additional CKEditor plugins to extend its functionality.

The first step is to create a [DLL-compatible](https://ckeditor.com/docs/ckeditor5/latest/installation/advanced/alternative-setups/dll-builds.html) package which provides the CKEditor plugin(s) you wish to add.

- If you’re including one of CKEditor’s [first-party packages](https://github.com/ckeditor/ckeditor5/tree/master/packages), it will already include a `build` directory with a DLL-compatible package inside it.
- If you’re creating a custom CKEditor plugin, use [CKEditor’s package generator](https://ckeditor.com/docs/ckeditor5/latest/framework/plugins/package-generator/using-package-generator.html) to scaffold it, and run its [`dll:build` command](https://ckeditor.com/docs/ckeditor5/latest/framework/plugins/package-generator/javascript-package.html#dllbuild) to create a DLL-compatible package.

> [!TIP]  
> Check out CKEditor’s [Implementing an inline widget](https://ckeditor.com/docs/ckeditor5/latest/framework/tutorials/implementing-an-inline-widget.html) tutorial for an in-depth look at how to create a custom CKEditor plugin.

Once the CKEditor package is in place in your Craft plugin, create an [asset bundle](https://craftcms.com/docs/4.x/extend/asset-bundles.html) which extends [`BaseCkeditorPackageAsset`](src/web/assets/BaseCkeditorPackageAsset.php). The asset bundle defines the package’s build directory, filename, a list of CKEditor plugin names provided by the package, and any toolbar items that should be made available via the plugin.

For example, here’s an asset bundle which defines a “Tokens” plugin:

```php
<?php

namespace mynamespace\web\assets\tokens;

use craft\ckeditor\web\assets\BaseCkeditorPackageAsset;

class TokensAsset extends BaseCkeditorPackageAsset
{
    public $sourcePath = __DIR__ . '/build';

    public $js = [
        'tokens.js',
    ];

    public array $pluginNames = [
        'Tokens',
    ];

    public array $toolbarItems = [
        'tokens',
    ];
}
```

Finally, ensure your asset bundle is registered whenever the core CKEditor asset bundle is. Add the following code to your plugin’s `init()` method:

```php
\craft\ckeditor\Plugin::registerCkeditorPackage(TokensAsset::class);
```
