<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

// Keeps the Craft 5 class names loadable for code, project config and database rows that still reference them.
// Registered ahead of Composer’s autoloader, so the PSR-4 root for the old namespace never loads a renamed class’ file.
spl_autoload_register(static function(string $class): void {
    $aliases = [
        'craft\ckeditor\Plugin' => CraftCms\Ckeditor\Plugin::class,
        'craft\ckeditor\Field' => CraftCms\Ckeditor\Field::class,
        'craft\ckeditor\models\Settings' => CraftCms\Ckeditor\Settings::class,
        'craft\ckeditor\models\EntryType' => CraftCms\Ckeditor\Data\EntryType::class,
        'craft\ckeditor\data\BaseChunk' => CraftCms\Ckeditor\Data\BaseChunk::class,
        'craft\ckeditor\data\Entry' => CraftCms\Ckeditor\Data\Entry::class,
        'craft\ckeditor\data\FieldData' => CraftCms\Ckeditor\Data\FieldData::class,
        'craft\ckeditor\data\Markup' => CraftCms\Ckeditor\Data\Markup::class,
        'craft\ckeditor\helpers\CkeditorConfig' => CraftCms\Ckeditor\Support\CkeditorConfig::class,
        'craft\ckeditor\helpers\CkeditorConfigSchema' => CraftCms\Ckeditor\Support\CkeditorConfigSchema::class,
    ];

    if (isset($aliases[$class])) {
        class_alias($aliases[$class], $class);
    }
}, prepend: true);
