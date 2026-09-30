<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace craft\ckeditor;

use Craft;
use craft\base\Element;
use craft\ckeditor\deletionblockers\ReferenceDeletionBlocker;
use craft\ckeditor\helpers\CkeditorConfig;
use craft\ckeditor\web\assets\BaseCkeditorPackageAsset;
use craft\ckeditor\web\assets\ckeditor\CkeditorAsset;
use craft\ckeditor\web\assets\fieldsettings\FieldSettingsAsset;
use craft\elements\NestedElementManager;
use craft\events\DefineElementDeletionBlockersEvent;
use craft\events\ModelEvent;
use craft\events\RegisterComponentTypesEvent;
use craft\helpers\UrlHelper;
use craft\services\Fields;
use craft\web\View;
use yii\base\Event;

/**
 * CKEditor plugin.
 *
 * @method static Plugin getInstance()
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 */
class Plugin extends \craft\base\Plugin
{
    public const TABLE_REFERENCES = '{{%ckeditor_references}}';

    /**
     * Registers an asset bundle for a CKEditor package.
     *
     * Packages aren’t loaded until they’re needed, so this can be called from a plugin or module’s `init()`
     * method or a `Craft::$app->onInit()` callback, regardless of load order.
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
            Craft::warning("$name isn’t a CKEditor package asset bundle.", __METHOD__);
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

    public string $schemaVersion = '5.6.0.0';

    public function init(): void
    {
        parent::init();

        if (Craft::$app->getRequest()->getIsCpRequest()) {
            $view = Craft::$app->getView();
            $assetManager = $view->getAssetManager();

            $ckBundle = $assetManager->getBundle(CkeditorAsset::class);
            $view->registerJsImport('ckeditor5', $assetManager->getAssetUrl($ckBundle, 'lib/ckeditor5.js', false));
            $view->registerJsImport('ckeditor5/', UrlHelper::stripQueryString($assetManager->getAssetUrl($ckBundle, 'lib/', false)));
            $view->registerJsImport('ckeditor5/translations/', UrlHelper::stripQueryString($assetManager->getAssetUrl($ckBundle, 'lib/translations/', false)));
            $view->registerJsImport('@craftcms/ckeditor', $assetManager->getAssetUrl($ckBundle, 'ckeditor5-craftcms.js', false));

            $configBundle = $assetManager->getBundle(FieldSettingsAsset::class);
            $view->registerJsImport('@craftcms/ckeditor-config', $assetManager->getAssetUrl($configBundle, 'fieldsettings.js'));

            // Wait until the page is being finalized, so packages registered from other plugins’ init() methods
            // or onInit() callbacks are included regardless of load order
            $view->on(View::EVENT_END_PAGE, function() use ($view, $assetManager) {
                foreach (self::getCkeditorPackages() as $name => $package) {
                    $bundle = $assetManager->getBundle($name);
                    $view->registerJsImport($package['namespace'], $assetManager->getAssetUrl($bundle, $package['entry'], false));
                }
            });
        }

        Event::on(Fields::class, Fields::EVENT_REGISTER_FIELD_TYPES, function(RegisterComponentTypesEvent $event) {
            $event->types[] = Field::class;
        });

        Event::on(Fields::class, Fields::EVENT_REGISTER_NESTED_ENTRY_FIELD_TYPES, function(RegisterComponentTypesEvent $event) {
            $event->types[] = Field::class;
        });

        Event::on(Element::class, Element::EVENT_AFTER_PROPAGATE, function(ModelEvent $event) {
            /** @var Element $element */
            $element = $event->sender;
            foreach ($this->entryManagers($element) as $entryManager) {
                $entryManager->maintainNestedElements($element, $event->isNew);
            }
        });

        Event::on(Element::class, Element::EVENT_DEFINE_DELETION_BLOCKERS, function(DefineElementDeletionBlockersEvent $event) {
            $event->blockers[] = new ReferenceDeletionBlocker($event->elements, $event->hardDelete);
        });

        Event::on(Element::class, Element::EVENT_BEFORE_DELETE, function(ModelEvent $event) {
            /** @var Element $element */
            $element = $event->sender;
            foreach ($this->entryManagers($element) as $entryManager) {
                // Delete any entries that primarily belong to this element
                $entryManager->deleteNestedElements($element, $element->hardDelete);
            }
        });

        Event::on(Element::class, Element::EVENT_AFTER_RESTORE, function(Event $event) {
            /** @var Element $element */
            $element = $event->sender;
            foreach ($this->entryManagers($element) as $entryManager) {
                $entryManager->restoreNestedElements($element);
            }
        });
    }

    /**
     * @param Element $element
     * @return NestedElementManager[]
     */
    private function entryManagers(Element $element): array
    {
        $entryManagers = [];
        $customFields = $element->getFieldLayout()?->getCustomFields() ?? [];
        foreach ($customFields as $field) {
            if ($field instanceof Field && !isset($entryManagers[$field->id])) {
                $entryManagers[$field->id] = Field::entryManager($field);
            }
        }
        return array_values($entryManagers);
    }
}
