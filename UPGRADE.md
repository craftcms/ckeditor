# Upgrading to CKEditor 6.0 (Craft 6)

This guide lists what changed in 6.0 and what you need to update in your project, templates and custom code.

## Requirements

- Craft CMS 6.0 or later
- PHP 8.5 or later
- `craftcms/yii2-adapter` is no longer needed. If your project still has it installed (e.g. for other plugins), CKEditor fields also offer category links.

## Upgrade steps

1. Update CKEditor to 5.9.0 or later on Craft 5, and run its migrations.
2. Upgrade your project to Craft 6.
3. Update the plugin: `composer require craftcms/ckeditor:^6.0`.
4. Run the migrations (`php artisan craft:migrate:all`). CKEditor’s migration renames the stored field type and moves its reference tracking into Craft’s field references table.
5. Review the breaking changes below and update your code.

## Breaking changes

### Classes and namespaces

The plugin’s namespace changed from `craft\ckeditor` to `CraftCms\Ckeditor`, and classes moved into Laravel-style folders. The old class names are no longer available, so update any code that references them.

| Before | After |
| --- | --- |
| `craft\ckeditor\Plugin` | `CraftCms\Ckeditor\Plugin` |
| `craft\ckeditor\Field` | `CraftCms\Ckeditor\Field` |
| `craft\ckeditor\models\Settings` | `CraftCms\Ckeditor\Settings` |
| `craft\ckeditor\models\EntryType` | `CraftCms\Ckeditor\Data\EntryType` |
| `craft\ckeditor\data\BaseChunk` | `CraftCms\Ckeditor\Data\BaseChunk` |
| `craft\ckeditor\data\Entry` | `CraftCms\Ckeditor\Data\Entry` |
| `craft\ckeditor\data\FieldData` | `CraftCms\Ckeditor\Data\FieldData` |
| `craft\ckeditor\data\Markup` | `CraftCms\Ckeditor\Data\Markup` |
| `craft\ckeditor\helpers\CkeditorConfig` | `CraftCms\Ckeditor\Support\CkeditorConfig` |
| `craft\ckeditor\helpers\CkeditorConfigSchema` | `CraftCms\Ckeditor\Support\CkeditorConfigSchema` |
| `craft\ckeditor\controllers\CkeditorController` | `CraftCms\Ckeditor\Http\Controllers\CkeditorController` |

`CraftCms\Ckeditor\Data\BaseChunk` no longer extends `yii\base\BaseObject`. Getting an unknown property throws a `LogicException`.

### Reference tracking

CKEditor no longer tracks references itself. Craft 6 tracks the elements referenced by any HTML field (including CKEditor fields) in its `fieldreferences` table, and warns about them when a referenced element is deleted, with an option to replace the references.

- Removed the `ckeditor_references` table. The upgrade migration copies its rows into `fieldreferences`.
- Removed `craft\ckeditor\Plugin::TABLE_REFERENCES`.
- Removed `craft\ckeditor\deletionblockers\ReferenceDeletionBlocker`. Use `CraftCms\Cms\Element\DeletionBlockers\FieldReferencesDeletionBlocker`.
- Removed `craft\ckeditor\controllers\ReplaceReferencesController` and the `ckeditor/replace-references/modal` and `ckeditor/replace-references/replace` actions. Craft’s own `delete-elements/replace-references-modal` action replaces them.
- Removed `craft\ckeditor\jobs\ReplaceReferences`. Use `CraftCms\Cms\Element\Jobs\ReplaceReferences`.

### Plugin class and settings

- `CraftCms\Ckeditor\Plugin` extends `CraftCms\Cms\Plugin\Plugin`. Initialization moved from `init()` to `boot()`.
- `CraftCms\Ckeditor\Settings` extends `CraftCms\Cms\Plugin\PluginSettings`.
- The plugin settings page is built with Craft’s UI builder (`settingsUi()`), and the `ckeditor/_settings.twig` template was removed.
- Packages are registered with `CkeditorAssets::registerPackage()`, from a plugin’s or module’s `boot()` method (see [CKEditor packages and assets](#ckeditor-packages-and-assets)).

### Routes and action URLs

The `ckeditor/ckeditor/*` action URLs are unchanged. They now require a logged-in control panel user.

The `ckeditor/field-settings/apply-entry-type-indicators` and `ckeditor/field-settings/render-image-field` actions, and `craft\ckeditor\controllers\FieldSettingsController`, were removed along with the legacy field settings.

### Control panel input and field settings

CKEditor fields render natively in Craft 6’s control panel.

- The field input is a UI control (`CraftCms\Ckeditor\Ui\Controls\CkeditorControl`, Vue component `ckeditor:editor`), returned from `Field::uiControl()`. `Field::inputHtml()` and `getStaticHtml()` no longer render the editor.
- The field settings are built with Craft’s UI builder (`Field::settingsUi()`). The toolbar builder, config options and custom styles are a single control (`CraftCms\Ckeditor\Ui\Controls\EditorConfigControl`, Vue component `ckeditor:editor-config`), which posts its values as an `editorConfig` setting.
- The **Expand to a separate button** / **Collapse to a dropdown** chip action and the “Show as a separate button” indicator are unchanged, as is the stored `entryTypes[].expanded` config. It needs a Craft version that supports `EntryTypeSelect::extraValueKeys()`.
- The config options (JSON/JavaScript) and custom styles (CSS) settings are plain text areas for now, without syntax highlighting, validation or autocomplete, since `nystudio107/craft-code-editor` isn’t required until it supports Craft 6.
- Nested entries and image entries are created for the owner element’s draft, as in Craft 5.
- The field type’s icon is Craft’s `paragraph` system icon, since the control panel only supports system icons.
- Removed the `ckeditor/_settings.twig`, `ckeditor/_field-settings.twig`, `ckeditor/_entry-type-select.twig` and `ckeditor/_image-field-select.twig` templates.
- Removed `Field::getEnableSourceEditingForNonAdmins()` and `setEnableSourceEditingForNonAdmins()` (deprecated since 4.5.0). Use `Field::$sourceEditingGroups`. Field configs with the old `enableSourceEditingForNonAdmins` setting are still converted to `sourceEditingGroups`.

### Category links

Craft 6 only provides categories through `craftcms/yii2-adapter`. CKEditor offers category link options when the adapter’s `Category` element type is installed, and leaves them out otherwise. Existing `{category:…}` reference tags in field values are left intact.

### Events

CKEditor’s Yii-style events were replaced by Laravel event classes. There is no `sender`; each event carries the field (and the element, where there is one).

| Before | After |
| --- | --- |
| `craft\ckeditor\Field::EVENT_MODIFY_CONFIG` (`craft\ckeditor\events\ModifyConfigEvent`) | `CraftCms\Ckeditor\Events\EditorConfigResolving` |
| `craft\ckeditor\Field::EVENT_DEFINE_LINK_OPTIONS` (`craft\ckeditor\events\DefineLinkOptionsEvent`) | `CraftCms\Ckeditor\Events\LinkOptionsResolving` |
| `craft\ckeditor\Field::EVENT_MODIFY_PURIFIER_CONFIG` (`craft\htmlfield\events\ModifyPurifierConfigEvent`) | `CraftCms\Ckeditor\Events\HtmlSanitizerConfigResolving` (see [HTML sanitizing](#html-sanitizing)) |

Before:

```php
use craft\ckeditor\events\DefineLinkOptionsEvent;
use craft\ckeditor\events\ModifyConfigEvent;
use craft\ckeditor\Field;
use yii\base\Event;

Event::on(Field::class, Field::EVENT_MODIFY_CONFIG, function(ModifyConfigEvent $event) {
    $event->toolbar[] = 'underline';
});

Event::on(Field::class, Field::EVENT_DEFINE_LINK_OPTIONS, function(DefineLinkOptionsEvent $event) {
    $event->linkOptions[] = [
        'label' => 'Products',
        'elementType' => Product::class,
    ];
});
```

After:

```php
use CraftCms\Ckeditor\Events\EditorConfigResolving;
use CraftCms\Ckeditor\Events\LinkOptionsResolving;
use Illuminate\Support\Facades\Event;

Event::listen(function(EditorConfigResolving $event): void {
    // $event->field, $event->element, $event->baseConfig and $event->toolbar
    $event->toolbar[] = 'underline';
});

Event::listen(function(LinkOptionsResolving $event): void {
    // $event->field, $event->element and $event->linkOptions
    $event->linkOptions[] = [
        'label' => 'Products',
        'elementType' => Product::class,
    ];
});
```

### GraphQL

The GraphQL classes moved from `craft\ckeditor\gql` to `CraftCms\Ckeditor\Gql` (`Generator`, `CkeditorData` and `CkeditorMarkup`). The schema is unchanged.

### Console commands

The console commands are now Artisan commands. The old command names still work as aliases.

| Before | After |
| --- | --- |
| `php craft ckeditor/convert` / `ckeditor/convert/redactor` | `php artisan ckeditor:convert:redactor` |
| `php craft ckeditor/convert/matrix <handle>` | `php artisan ckeditor:convert:matrix <handle>` |

- `ckeditor:convert:matrix` now generates a Laravel content migration in `database/migrations/`, which extends `CraftCms\Ckeditor\Database\Migrations\BaseConvertMatrixContentMigration`. Run it on other environments with `php artisan craft:migrate:all`.
- Removed `craft\ckeditor\migrations\BaseConvertMatrixContentMigration`. Content migrations it generated under Craft 5 should have run before upgrading.
- Removed `craft\ckeditor\console\controllers\ConvertController`, `craft\ckeditor\console\actions\ConvertMatrix` and `craft\ckeditor\console\actions\ConvertRedactor`. `craft\ckeditor\console\ToolbarBuilder` is now `CraftCms\Ckeditor\Console\ToolbarBuilder`.

### CKEditor packages and assets

Yii asset bundles are gone. CKEditor’s own files are published to `public/vendor/craftcms/ckeditor/`, and packages that provide CKEditor plugins are registered as `CkeditorPackage` objects.

| Before | After |
| --- | --- |
| `craft\ckeditor\web\assets\BaseCkeditorPackageAsset` | `CraftCms\Ckeditor\Data\CkeditorPackage` |
| `craft\ckeditor\Plugin::registerCkeditorPackage()` | `CraftCms\Ckeditor\Support\CkeditorAssets::registerPackage()` |
| `craft\ckeditor\Plugin::registerCkeditorPackageBundles()` | `CraftCms\Ckeditor\Support\CkeditorAssets::registerPackageAssets()` |
| `craft\ckeditor\Plugin::getCkeditorPackages()` | `CraftCms\Ckeditor\Support\CkeditorAssets::getPackages()` |
| `BaseCkeditorPackageAsset::uiLanguage()` / `getImportCompliantLanguage()` | `CkeditorAssets::uiLanguage()` / `getImportCompliantLanguage()` |
| `craft\ckeditor\web\assets\ckeditor\CkeditorAsset` | Removed. Use `CkeditorAssets::registerEditorAssets()`. |
| `craft\ckeditor\web\assets\fieldsettings\FieldSettingsAsset` | Removed. Use `CkeditorAssets::registerFieldSettingsAssets()`. |
| `CkeditorAsset::EVENT_PUBLISH` | Removed (deprecated since 3.5.0). |
| `craft\ckeditor\helpers\CkeditorConfig::getImportStatements()` | Removed (deprecated since 5.8.0). |

Before:

```php
use craft\ckeditor\web\assets\BaseCkeditorPackageAsset;

class TokensAsset extends BaseCkeditorPackageAsset
{
    public $sourcePath = __DIR__ . '/build';
    public string $namespace = '@craftcms/ckeditor5-tokens';
    public $js = [['tokens.js', 'type' => 'module']];
    public array $pluginNames = ['Tokens'];
    public array $toolbarItems = ['tokens'];
}

\craft\ckeditor\Plugin::registerCkeditorPackage(TokensAsset::class, 'tokens.js');
```

After (from your plugin’s `boot()` method, with the package’s files published via `$publishables`):

```php
use CraftCms\Ckeditor\Data\CkeditorPackage;
use CraftCms\Ckeditor\Support\CkeditorAssets;

public function boot(CkeditorAssets $ckeditorAssets): void
{
    $ckeditorAssets->registerPackage(new CkeditorPackage(
        namespace: '@craftcms/ckeditor5-tokens',
        url: $this->asset('tokens/tokens.js'),
        pluginNames: ['Tokens'],
        toolbarItems: ['tokens'],
    ));
}
```

### HTML sanitizing

CKEditor field values are now sanitized with Craft’s HTML sanitizers (`CraftCms\Cms\Support\Facades\HtmlSanitizers`, built on `symfony/html-sanitizer`) instead of HTML Purifier, via `craftcms/html-field` 4.

- The **Purify HTML** and **HTML Purifier Config** field settings are replaced by **Sanitize HTML** and **HTML Sanitizer**. Existing field settings are mapped automatically: `purifyHtml` becomes `sanitizeHtml`, and `purifierConfig: 'Simple.json'` becomes `htmlSanitizer: 'Simple'`.
- When the default sanitizer is selected, CKEditor extends it with the markup the field’s toolbar needs (list styles and `data-list-item-id`, to-do list checkboxes, link `target`/`rel`/`aria-label`, `<craft-entry>` tags, and `class` attributes). A named sanitizer is used as-is, so it must allow that markup itself.

| Before | After |
| --- | --- |
| `craft\ckeditor\Field::EVENT_MODIFY_PURIFIER_CONFIG` | `CraftCms\Ckeditor\Events\HtmlSanitizerConfigResolving`, dispatched when a field uses the default sanitizer. To change every HTML field, use `HtmlSanitizers::defaults()`; to use a different sanitizer, register one with `HtmlSanitizers::extend()` and select it in the field settings. |
| `craft\htmlfield\events\ModifyPurifierConfigEvent` | Removed (by `craftcms/html-field` 4). |

Before:

```php
use craft\ckeditor\Field;
use craft\htmlfield\events\ModifyPurifierConfigEvent;
use yii\base\Event;

Event::on(Field::class, Field::EVENT_MODIFY_PURIFIER_CONFIG, function(ModifyPurifierConfigEvent $event) {
    $event->config->set('HTML.AllowedComments', ['pagebreak']);
});
```

After:

```php
use CraftCms\Ckeditor\Events\HtmlSanitizerConfigResolving;
use Illuminate\Support\Facades\Event;

Event::listen(function(HtmlSanitizerConfigResolving $event): void {
    // HtmlSanitizerConfig is immutable, so assign the modified config back
    $event->config = $event->config->allowElement('mark');
});
```

### Config files

- CKEditor config files (custom JS/JSON config and CSS files referenced by field settings) are read from `config/craft/ckeditor/` instead of `config/ckeditor/`.
- The plugin settings config file moved from `config/ckeditor.php` to `config/craft/ckeditor.php`. Use Laravel’s `env()` instead of `craft\helpers\App::env()`.
