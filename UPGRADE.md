# Upgrading to CKEditor 6.0 (Craft 6)

This guide lists what changed in 6.0 and what you need to update in your project, templates and custom code.

> Work in progress: this file is updated as the Craft 6 upgrade proceeds.

## Requirements

- Craft CMS 6.0 or later
- PHP 8.5 or later
- `craftcms/yii2-adapter` (required for now; the control panel input and field settings still render through it)

## Upgrade steps

1. Upgrade your project to Craft 6 first.
2. Update the plugin: `composer require craftcms/ckeditor:^6.0`.
3. Review the breaking changes below and update your code.

## Breaking changes

### HTML sanitizing

CKEditor field values are now sanitized with Craft’s HTML sanitizers (`CraftCms\Cms\Support\Facades\HtmlSanitizers`, built on `symfony/html-sanitizer`) instead of HTML Purifier, via `craftcms/html-field` 4.

- The **Purify HTML** and **HTML Purifier Config** field settings are replaced by **Sanitize HTML** and **HTML Sanitizer**. Existing field settings are mapped automatically: `purifyHtml` becomes `sanitizeHtml`, and `purifierConfig: 'Simple.json'` becomes `htmlSanitizer: 'Simple'`.
- When the default sanitizer is selected, CKEditor extends it with the markup the field’s toolbar needs (list styles and `data-list-item-id`, to-do list checkboxes, link `target`/`rel`/`aria-label`, `<craft-entry>` tags, and `class` attributes). A named sanitizer is used as-is, so it must allow that markup itself.

| Before | After |
| --- | --- |
| `craft\ckeditor\Field::EVENT_MODIFY_PURIFIER_CONFIG` | Removed. Register a custom sanitizer with `HtmlSanitizers::extend()` and select it in the field settings, or adjust the default config with `HtmlSanitizers::defaults()`. |
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
use CraftCms\Cms\Support\Facades\HtmlSanitizers;
use Symfony\Component\HtmlSanitizer\HtmlSanitizerConfig;

HtmlSanitizers::defaults(fn(HtmlSanitizerConfig $config) => $config->allowElement('mark'));
```

### Config files

CKEditor config files (custom JS/JSON config and CSS files referenced by field settings) are read from `config/craft/ckeditor/` instead of `config/ckeditor/`.
