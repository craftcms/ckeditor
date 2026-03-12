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
    // a list of languages supported by CKEditor
    private static array $ckeSupportedLanguages = [
        'af',
        'ar',
        'ast',
        'az',
        'be',
        'bg',
        'bn',
        'bs',
        'ca',
        'cs',
        'da',
        'de',
        'de-ch',
        'el',
        'en',
        'en-au',
        'en-gb',
        'eo',
        'es',
        'es-co',
        'et',
        'eu',
        'fa',
        'fi',
        'fr',
        'gl',
        'gu',
        'he',
        'hi',
        'hr',
        'hu',
        'hy',
        'id',
        'it',
        'ja',
        'jv',
        'kk',
        'km',
        'kn',
        'ko',
        'ku',
        'lt',
        'lv',
        'ms',
        'nb',
        'ne',
        'nl',
        'no',
        'oc',
        'pl',
        'pt',
        'pt-br',
        'ro',
        'ru',
        'si',
        'sk',
        'sl',
        'sq',
        'sr',
        'sr-latn',
        'sv',
        'th',
        'ti',
        'tk',
        'tr',
        'tt',
        'ug',
        'uk',
        'ur',
        'uz',
        'vi',
        'zh',
        'zh-cn',
    ];

    /**
     * Returns import compliant language code.
     *
     * CKEditor doesn't support all the languages that Craft does.
     * It also often only support the major version, not localized ones (e.g. they support fr but not fr-FR, fr-CA, fr-BE etc).
     * Since we're now using imports to get the correct translation files, we need to know if the file exists before we import it,
     * or the field won't render.
     *
     * @param string $language
     * @return string
     * @since 5.2.0
     */
    public static function getImportCompliantLanguage(string $language): string
    {
        // first check if we have an exact match
        if (in_array($language, self::$ckeSupportedLanguages, true)) {
            return $language;
        }

        // if not - check if there's a major version that we can use
        if (str_contains($language, '-')) {
            $language = substr($language, 0, strpos($language, '-'));
            if (in_array($language, self::$ckeSupportedLanguages, true)) {
                return $language;
            }
        }

        // if not, default to plain English
        return 'en';
    }

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
