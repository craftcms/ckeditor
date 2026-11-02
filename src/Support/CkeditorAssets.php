<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace CraftCms\Ckeditor\Support;

use CraftCms\Ckeditor\Data\CkeditorPackage;
use CraftCms\Ckeditor\Plugin;
use CraftCms\Cms\Cms;
use CraftCms\Cms\Element\ElementTypes;
use CraftCms\Cms\Support\Env;
use CraftCms\Cms\Support\Facades\HtmlStack;
use CraftCms\Cms\View\Enums\Position;
use Illuminate\Container\Attributes\Singleton;

/**
 * Registers CKEditor’s control panel assets, and the CKEditor packages provided by other plugins.
 *
 * @since 6.0.0
 */
#[Singleton]
class CkeditorAssets
{
    /** A list of languages supported by CKEditor */
    private const array SUPPORTED_LANGUAGES = [
        'af', 'ar', 'ast', 'az', 'be', 'bg', 'bn', 'bs', 'ca', 'cs', 'da', 'de', 'de-ch', 'el', 'en', 'en-au',
        'en-gb', 'eo', 'es', 'es-co', 'et', 'eu', 'fa', 'fi', 'fr', 'gl', 'gu', 'he', 'hi', 'hr', 'hu', 'hy', 'id',
        'it', 'ja', 'jv', 'kk', 'km', 'kn', 'ko', 'ku', 'lt', 'lv', 'ms', 'nb', 'ne', 'nl', 'no', 'oc', 'pl', 'pt',
        'pt-br', 'ro', 'ru', 'si', 'sk', 'sl', 'sq', 'sr', 'sr-latn', 'sv', 'th', 'ti', 'tk', 'tr', 'tt', 'ug',
        'uk', 'ur', 'uz', 'vi', 'zh', 'zh-cn',
    ];

    /**
     * Returns the language code CKEditor’s UI should use, based on the app language.
     *
     * @return string
     */
    public static function uiLanguage(): string
    {
        $language = app()->getLocale();

        return match ($language) {
            'nb', 'nn' => 'no', // https://github.com/craftcms/ckeditor/issues/113
            'en-US' => 'en',
            default => strtolower($language),
        };
    }

    /**
     * Returns a language code that CKEditor has translations for, falling back to the language without its
     * territory, and then to English.
     *
     * @param string $language
     * @return string
     */
    public static function getImportCompliantLanguage(string $language): string
    {
        if (in_array($language, self::SUPPORTED_LANGUAGES, true)) {
            return $language;
        }

        if (str_contains($language, '-')) {
            $language = substr($language, 0, strpos($language, '-'));
            if (in_array($language, self::SUPPORTED_LANGUAGES, true)) {
                return $language;
            }
        }

        return 'en';
    }

    /**
     * @var array<string,CkeditorPackage> Registered packages, indexed by namespace
     */
    private array $packages = [];

    public function __construct(
        private readonly Plugin $plugin,
        private readonly ElementTypes $elementTypes,
    ) {
    }

    /**
     * Registers a CKEditor package.
     *
     * Each CKEditor field only imports a package (and registers its assets) if one of its toolbar items is in the
     * field’s toolbar. A package without toolbar items has its plugins loaded for every field, and a package without
     * plugins or toolbar items has its assets registered for every field, for their side effects.
     *
     * @param CkeditorPackage $package
     */
    public function registerPackage(CkeditorPackage $package): void
    {
        $this->packages[$package->namespace] = $package;

        if (!empty($package->pluginNames) || !empty($package->toolbarItems)) {
            CkeditorConfig::registerPackage($package->namespace, [
                'plugins' => $package->pluginNames,
                'toolbarItems' => $package->toolbarItems,
            ]);
        }
    }

    /**
     * Returns the registered packages, indexed by namespace.
     *
     * @return array<string,CkeditorPackage>
     */
    public function getPackages(): array
    {
        return $this->packages;
    }

    /**
     * Registers the import map entries for CKEditor, the plugin’s own modules, and all registered packages.
     *
     * Import maps can’t be changed once a module has been loaded, so this is done for every control panel page.
     */
    public function registerImportMap(): void
    {
        HtmlStack::jsImport('ckeditor5', $this->url('ckeditor/lib/ckeditor5.js', false));
        HtmlStack::jsImport('ckeditor5/', $this->url('ckeditor/lib/', false));
        HtmlStack::jsImport('ckeditor5/translations/', $this->url('ckeditor/lib/translations/', false));
        HtmlStack::jsImport('@craftcms/ckeditor', $this->url('ckeditor/ckeditor5-craftcms.js', false));
        HtmlStack::jsImport('@craftcms/ckeditor-config', $this->url('fieldsettings/fieldsettings.js'));

        foreach ($this->packages as $package) {
            HtmlStack::jsImport($package->namespace, $package->url);
        }
    }

    /**
     * Registers the assets a CKEditor input needs.
     */
    public function registerEditorAssets(): void
    {
        HtmlStack::cssFile($this->url('ckeditor/lib/ckeditor5.css'));
        HtmlStack::cssFile($this->url('ckeditor/ckeditor.css'));

        // Import map shim
        HtmlStack::jsFile('https://ga.jspm.io/npm:es-module-shims@2.0.10/dist/es-module-shims.js', ['async' => true]);
        HtmlStack::jsFile($this->url('ckeditor/ckeditor5-craftcms.js'), ['type' => 'module']);
        $this->registerTranslation(
            dirname($this->plugin->getBasePath()) . '/resources/assets/ckeditor/dist/translations',
            $this->url('ckeditor/translations', false),
        );

        $refHandles = [];
        foreach ($this->elementTypes->types() as $elementType) {
            if ($elementType::isLocalized() && ($refHandle = $elementType::refHandle()) !== null) {
                $refHandles[] = $refHandle;
            }
        }

        HtmlStack::scriptWithVars(fn($refHandles) => <<<JS
window.CKE_LOCALIZED_REF_HANDLES = $refHandles;
JS, [$refHandles], Position::Head, ['type' => 'module']);

        HtmlStack::jsWithVars(fn($attach, $revAssetUrls) => <<<JS
Craft.showCkeditorInspector = $attach;
Craft.revAssetUrls = $revAssetUrls;
JS, [
            (bool)Env::get('CRAFT_SHOW_CKEDITOR_INSPECTOR'),
            Cms::config()->revAssetUrls,
        ], Position::BodyEnd);
    }

    /**
     * Registers the assets the CKEditor field settings need.
     */
    public function registerFieldSettingsAssets(): void
    {
        $this->registerEditorAssets();
        HtmlStack::cssFile($this->url('fieldsettings/ckeditor.css'));
        HtmlStack::jsFile($this->url('fieldsettings/fieldsettings.js'), ['type' => 'module']);
    }

    /**
     * Registers the assets for the registered packages.
     *
     * Packages that don’t provide any CKEditor plugins (e.g. global functionality) are always registered.
     *
     * @param string[]|null $namespaces The package namespaces whose assets should be registered, or `null` for all packages
     */
    public function registerPackageAssets(?array $namespaces = null): void
    {
        foreach ($this->packages as $package) {
            if (
                $namespaces !== null &&
                !in_array($package->namespace, $namespaces, true) &&
                !empty(CkeditorConfig::getPluginsByPackage($package->namespace))
            ) {
                continue;
            }

            HtmlStack::jsFile($package->url, ['type' => 'module']);

            foreach ($package->styles as $url) {
                HtmlStack::cssFile($url);
            }

            if ($package->translationsPath && $package->translationsUrl) {
                $this->registerTranslation($package->translationsPath, $package->translationsUrl);
            }
        }
    }

    /**
     * Returns the URL to a published CKEditor asset.
     *
     * @param string $path The path within the published asset folder
     * @param bool $versioned Whether a cache-busting query string should be added
     * @return string
     */
    public function url(string $path, bool $versioned = true): string
    {
        $url = $this->plugin->asset($path);

        // asset() trims trailing slashes, which import map prefixes need
        if (str_ends_with($path, '/')) {
            $url .= '/';
        }

        return $versioned ? sprintf('%s?v=%s', $url, $this->plugin->version) : $url;
    }

    private function registerTranslation(string $path, string $url): void
    {
        $language = app()->getLocale();

        if (in_array($language, ['en', 'en-US'])) {
            // that's what the source files use
            return;
        }

        $language = static::uiLanguage();
        $languages = [$language];
        if (($dashPos = strpos($language, '-')) !== false) {
            // maybe without the territory?
            $languages[] = substr($language, 0, $dashPos);
        }

        foreach ($languages as $language) {
            if (file_exists("$path/$language.js")) {
                HtmlStack::jsFile("$url/$language.js");
                return;
            }
        }
    }
}
