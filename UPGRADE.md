# Upgrading to CKEditor 6.0 (Craft 6)

This guide lists what changed in 6.0 and what you need to update in your project, templates and custom code.

> Work in progress: this file is updated as the Craft 6 upgrade proceeds.

## Requirements

- Craft CMS 6.0 or later
- PHP 8.5 or later
- `craftcms/yii2-adapter` (required for now; the control panel input and field settings still render through it)

## Upgrade steps

1. Update CKEditor to 5.9.0 or later on Craft 5, and run its migrations.
2. Upgrade your project to Craft 6.
3. Update the plugin: `composer require craftcms/ckeditor:^6.0`.
4. Run the migrations (`php artisan craft:migrate:all`). CKEditor’s migration renames the stored field type and moves its reference tracking into Craft’s field references table.
5. Review the breaking changes below and update your code.

## Breaking changes

### Classes and namespaces

The plugin’s namespace changed from `craft\ckeditor` to `CraftCms\Ckeditor`, and classes moved into Laravel-style folders. The old names of the classes below still work as aliases, but update your code to the new names.

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
| `craft\ckeditor\controllers\FieldSettingsController` | `CraftCms\Ckeditor\Http\Controllers\FieldSettingsController` |

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
- Packages can still be registered with `Plugin::registerCkeditorPackage()`, from a plugin’s or module’s `boot()` method.

### Routes and action URLs

The `ckeditor/ckeditor/*` and `ckeditor/field-settings/*` action URLs are unchanged. They now require a logged-in control panel user, and the field settings actions require an admin.

### Templates

The plugin’s templates moved from `src/templates/` to `resources/views/`. Template paths (`ckeditor/_field-settings.twig`, etc.) are unchanged.

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

CKEditor config files (custom JS/JSON config and CSS files referenced by field settings) are read from `config/craft/ckeditor/` instead of `config/ckeditor/`.
