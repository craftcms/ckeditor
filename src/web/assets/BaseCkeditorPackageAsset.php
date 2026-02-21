<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace craft\ckeditor\web\assets;

use Craft;
use craft\ckeditor\helpers\CkeditorConfig;
use craft\web\AssetBundle;

/**
 * Base asset bundle class for DLL-compatible CKEditor packages.
 *
 * Child classes can define a list of CKEditor plugin names and toolbar buttons provided by the package.
 *
 * If translation files are located in `translations/` relative to the source path, the appropriate translation file
 * will automatically be published alongside the JavaScript files defined by [[js]].
 *
 * @since 3.4.0
 */
abstract class BaseCkeditorPackageAsset extends AssetBundle
{
    /**
     * Returns the CKEditor UI language that should be used based on the app language.
     *
     * @return string
     * @since 3.5.0
     */
    public static function uiLanguage(): string
    {
        return match (Craft::$app->language) {
            'nb', 'nn' => 'no', // https://github.com/craftcms/ckeditor/issues/113
            'en-US' => 'en',
            default => strtolower(Craft::$app->language),
        };
    }

    /**
     * @var string[] List of CKEditor plugins’ names that should be loaded by default.
     *
     * Plugins should be defined in the global `window.CKEditor5` object.
     *
     * ```js
     * window.CKEditor5.placeholder = {
     *   Placeholder: MyPlaceholderPlugin,
     * };
     * ```
     *
     * The plugin names listed here should match the plugins’ `pluginName` getter values.
     */
    public array $pluginNames = [];

    /**
     * @var array<string|string[]> List of toolbar items that should be available to CKEditor toolbars.
     *
     * Each item can be represented in one of these ways:
     *
     * - The button name, as registered via `editor.ui.componentFactory.add()` (e.g. `'bold'`).
     * - An array of button names, if they should always be included together as a group
     *       (e.g. `['outdent', 'indent']`).
     *
     * If this list isn’t empty, the plugins referenced by [[pluginNames]] will only be included for editors where at
     * least one of the associated toolbar items is selected.
     */
    public array $toolbarItems = [];

    /**
     * @var string namespace to be used for the JavaScript import map.
     *
     * It's recommended to use a format of `@{author}/ckeditor5-{handle}`
     */
    public string $namespace;

    /**
     * @inheritdoc
     */
    public function init(): void
    {
        parent::init();
        $this->includeTranslation();
    }

    /**
     * Registers the plugins and toolbar items provided by this package with `CKEditor5.craftcms.registerPackage()`.
     *
     * @since 3.5.0
     */
    public function registerPackage(): void
    {
        if (!empty($this->pluginNames || !empty($this->toolbarItems))) {
            CkeditorConfig::registerPackage($this->namespace, [
                'plugins' => $this->pluginNames,
                'toolbarItems' => $this->toolbarItems,
            ]);
        }
    }

    private function includeTranslation(): void
    {
        if (in_array(Craft::$app->language, ['en', 'en-US'])) {
            // that's what the source files use
            return;
        }

        $language = static::uiLanguage();

        if ($this->includeTranslationForLanguage($language)) {
            return;
        }

        // maybe without the territory?
        $dashPos = strpos($language, '-');
        if ($dashPos !== false) {
            $this->includeTranslationForLanguage(substr($language, 0, $dashPos));
        }
    }

    private function includeTranslationForLanguage($language): bool
    {
        $subpath = "translations/$language.js";
        $path = "$this->sourcePath/$subpath";
        if (!file_exists($path)) {
            return false;
        }
        $this->js[] = $subpath;
        return true;
    }
}
