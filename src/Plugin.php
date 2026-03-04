<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace craft\ckeditor;

use Craft;
use craft\base\Element;
use craft\ckeditor\web\assets\BaseCkeditorPackageAsset;
use craft\ckeditor\web\assets\ckeditor\CkeditorAsset;
use craft\ckeditor\web\assets\fieldsettings\FieldSettingsAsset;
use craft\elements\NestedElementManager;
use craft\events\AssetBundleEvent;
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
    /**
     * Registers an asset bundle for a CKEditor package.
     *
     * @param string $name The asset bundle class name. The asset bundle should extend
     * [[\craft\ckeditor\web\assets\BaseCkeditorPackageAsset]].
     * @since 3.5.0
     */
    public static function registerCkeditorPackage(string $name, string $entry = 'index.js'): void
    {
        self::$ckeditorPackages[$name] = true;
        self::$ckeditorImports[$name] = $entry;
    }

    private static array $ckeditorPackages = [];
    private static array $ckeditorImports = [];

    public string $schemaVersion = '5.0.0.1';

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

            foreach (self::$ckeditorImports as $bundleName => $entry) {
                $bundle = $assetManager->getBundle($bundleName);
                if ($bundle instanceof BaseCkeditorPackageAsset) {
                    $view->registerJsImport($bundle->namespace, $assetManager->getAssetUrl($bundle, $entry, false));
                }
            }
        }

        Event::on(Fields::class, Fields::EVENT_REGISTER_FIELD_TYPES, function(RegisterComponentTypesEvent $event) {
            $event->types[] = Field::class;
        });

        Event::on(Fields::class, Fields::EVENT_REGISTER_NESTED_ENTRY_FIELD_TYPES, function(RegisterComponentTypesEvent $event) {
            $event->types[] = Field::class;
        });

        Event::on(View::class, View::EVENT_AFTER_REGISTER_ASSET_BUNDLE, function(AssetBundleEvent $event) {
            if ($event->bundle instanceof CkeditorAsset) {
                /** @var View $view */
                $view = $event->sender;
                foreach (array_keys(self::$ckeditorPackages) as $name) {
                    $bundle = $view->registerAssetBundle($name);
                    if ($bundle instanceof BaseCkeditorPackageAsset) {
                        $bundle->registerPackage();
                    }
                }
            }
        });

        Event::on(Element::class, Element::EVENT_AFTER_PROPAGATE, function(ModelEvent $event) {
            /** @var Element $element */
            $element = $event->sender;
            foreach ($this->entryManagers($element) as $entryManager) {
                $entryManager->maintainNestedElements($element, $event->isNew);
            }
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
