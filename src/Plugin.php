<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace CraftCms\Ckeditor;

use Craft;
use craft\ckeditor\web\assets\BaseCkeditorPackageAsset;
use craft\ckeditor\web\assets\ckeditor\CkeditorAsset;
use craft\ckeditor\web\assets\fieldsettings\FieldSettingsAsset;
use craft\web\View;
use CraftCms\Ckeditor\Support\CkeditorConfig;
use CraftCms\Cms\Cp\SelectOptions;
use CraftCms\Cms\Field\NestedEntryFieldTypes;
use CraftCms\Cms\Plugin\Plugin as BasePlugin;
use CraftCms\Cms\Plugin\PluginSettings;
use CraftCms\Cms\Support\Url;
use CraftCms\Cms\Ui\Controls\Text;
use CraftCms\Cms\Ui\Nodes\Field as UiField;
use CraftCms\Cms\Ui\Ui;
use CraftCms\Cms\Ui\UiContext;
use Illuminate\Support\Facades\Log;
use Override;

use function CraftCms\Cms\t;

/**
 * CKEditor plugin.
 *
 * @method static Plugin getInstance()
 * @method Settings getSettings()
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 */
class Plugin extends BasePlugin
{
    /**
     * Registers an asset bundle for a CKEditor package.
     *
     * Packages aren’t loaded until they’re needed, so this can be called from a plugin’s or module’s `boot()`
     * method, regardless of load order.
     *
     * @param string $name The asset bundle class name. The asset bundle should extend
     * [[\craft\ckeditor\web\assets\BaseCkeditorPackageAsset]].
     * @param string $entry The package’s JavaScript entry file, relative to the asset bundle’s source path.
     * @since 3.5.0
     */
    public static function registerCkeditorPackage(string $name, string $entry = 'index.js'): void
    {
        self::$ckeditorPackages[$name] = $entry;

        // If packages have already been loaded, load this one right away
        if (self::$packagesLoaded) {
            self::loadCkeditorPackage($name, $entry);
        }
    }

    /**
     * Returns the registered CKEditor packages.
     *
     * Packages registered via [[registerCkeditorPackage()]] are loaded the first time this is called. Any registered
     * after that are loaded immediately.
     *
     * @return array<string,array{namespace:string,entry:string}> Package info, indexed by asset bundle class name
     * @internal
     */
    public static function getCkeditorPackages(): array
    {
        if (!self::$packagesLoaded) {
            self::$packagesLoaded = true;
            foreach (self::$ckeditorPackages as $name => $entry) {
                self::loadCkeditorPackage($name, $entry);
            }
        }

        return self::$loadedPackages;
    }

    /**
     * Registers the asset bundles for CKEditor packages.
     *
     * Packages that don’t provide any CKEditor plugins (e.g. global functionality) are always registered.
     *
     * @param View $view
     * @param string[]|null $namespaces The package namespaces whose bundles should be registered, or `null` for all packages
     * @since 5.8.0
     */
    public static function registerCkeditorPackageBundles(View $view, ?array $namespaces = null): void
    {
        foreach (self::getCkeditorPackages() as $name => $package) {
            if (
                $namespaces === null ||
                in_array($package['namespace'], $namespaces, true) ||
                empty(CkeditorConfig::getPluginsByPackage($package['namespace']))
            ) {
                $view->registerAssetBundle($name);
            }
        }
    }

    private static function loadCkeditorPackage(string $name, string $entry): void
    {
        if (isset(self::$loadedPackages[$name])) {
            self::$loadedPackages[$name]['entry'] = $entry;
            return;
        }

        $bundle = Craft::createObject($name);
        if (!$bundle instanceof BaseCkeditorPackageAsset) {
            Log::warning("$name isn’t a CKEditor package asset bundle.", [__METHOD__]);
            return;
        }

        self::$loadedPackages[$name] = [
            'namespace' => $bundle->namespace,
            'entry' => $entry,
        ];
        $bundle->registerPackage();
    }

    /**
     * @var array<string,string> Package entry files, indexed by asset bundle class name
     */
    private static array $ckeditorPackages = [];

    /**
     * @var array<string,array{namespace:string,entry:string}>
     * @see getCkeditorPackages()
     */
    private static array $loadedPackages = [];

    /**
     * @see getCkeditorPackages()
     */
    private static bool $packagesLoaded = false;

    public string $schemaVersion = '6.0.0.0';
    public string $minVersionRequired = '5.9.0';
    public bool $hasCpSettings = true;
    protected array $fieldTypes = [Field::class];

    /**
     * Boots the plugin.
     */
    public function boot(NestedEntryFieldTypes $nestedEntryFieldTypes): void
    {
        $nestedEntryFieldTypes->register(Field::class);
        $this->app->bind(Settings::class, fn() => $this->getSettings());

        if (request()->isCpRequest() && !app()->runningInConsole()) {
            $this->registerJsImports();
        }
    }

    /**
     * Registers the import map entries for CKEditor and its packages (legacy asset bundles, via the Yii 2 adapter).
     */
    private function registerJsImports(): void
    {
        $view = Craft::$app->getView();
        $assetManager = $view->getAssetManager();

        $ckBundle = $assetManager->getBundle(CkeditorAsset::class);
        $view->registerJsImport('ckeditor5', $assetManager->getAssetUrl($ckBundle, 'lib/ckeditor5.js', false));
        $view->registerJsImport('ckeditor5/', Url::stripQueryString($assetManager->getAssetUrl($ckBundle, 'lib/', false)));
        $view->registerJsImport('ckeditor5/translations/', Url::stripQueryString($assetManager->getAssetUrl($ckBundle, 'lib/translations/', false)));
        $view->registerJsImport('@craftcms/ckeditor', $assetManager->getAssetUrl($ckBundle, 'ckeditor5-craftcms.js', false));

        $configBundle = $assetManager->getBundle(FieldSettingsAsset::class);
        $view->registerJsImport('@craftcms/ckeditor-config', $assetManager->getAssetUrl($configBundle, 'fieldsettings.js'));

        // Wait until the page is being finalized, so packages registered from other plugins’ boot() methods
        // are included regardless of load order
        $view->on(View::EVENT_END_PAGE, function() use ($view, $assetManager) {
            foreach (self::getCkeditorPackages() as $name => $package) {
                $bundle = $assetManager->getBundle($name);
                $view->registerJsImport($package['namespace'], $assetManager->getAssetUrl($bundle, $package['entry'], false));
            }
        });
    }

    #[Override]
    protected static function createSettings(): ?PluginSettings
    {
        return new Settings();
    }

    #[Override]
    public function settingsUi(UiContext $context = new UiContext()): ?Ui
    {
        return Ui::make([
            UiField::make(t('License Key', category: 'ckeditor'), Text::make('licenseKey')
                ->placeholder('GPL')
                ->monospace()
                ->textExpanderTriggers(SelectOptions::getEnvTextExpanderTriggers()))
                ->instructions(t('A commercial CKEditor license key. If left blank, CKEditor will be used under the GPL license.', category: 'ckeditor'))
                ->tip(t('This can be set to an environment variable.', category: 'ckeditor')),
        ]);
    }
}
