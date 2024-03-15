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
use craft\elements\NestedElementManager;
use craft\events\AssetBundleEvent;
use craft\events\ModelEvent;
use craft\events\RegisterComponentTypesEvent;
use craft\events\RegisterUrlRulesEvent;
use craft\services\Fields;
use craft\web\UrlManager;
use craft\web\View;
use yii\base\Event;

/**
 * CKEditor plugin.
 *
 * @method static Plugin getInstance()
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 * @property-read CkeConfigs $ckeConfigs
 */
class Plugin extends \craft\base\Plugin
{
    public static function config(): array
    {
        return [
            'components' => [
                'ckeConfigs' => CkeConfigs::class,
            ],
        ];
    }

    /**
     * Registers an asset bundle for a CKEditor package.
     *
     * @param string $name The asset bundle class name. The asset bundle should extend
     * [[\craft\ckeditor\web\assets\BaseCkeditorPackageAsset]].
     * @since 3.5.0
     */
    public static function registerCkeditorPackage(string $name): void
    {
        self::$ckeditorPackages[$name] = true;
    }

    private static array $ckeditorPackages = [];

    public string $schemaVersion = '3.0.0.0';
    public bool $hasCpSettings = true;

    public function init()
    {
        parent::init();

        Event::on(Fields::class, Fields::EVENT_REGISTER_FIELD_TYPES, function(RegisterComponentTypesEvent $event) {
            $event->types[] = Field::class;
        });

        Event::on(Fields::class, Fields::EVENT_REGISTER_NESTED_ENTRY_FIELD_TYPES, function(RegisterComponentTypesEvent $event) {
            $event->types[] = Field::class;
        });

        Event::on(UrlManager::class, UrlManager::EVENT_REGISTER_CP_URL_RULES, function(RegisterUrlRulesEvent $event) {
            $event->rules += [
                'settings/ckeditor' => 'ckeditor/cke-configs/index',
                'settings/ckeditor/new' => 'ckeditor/cke-configs/edit',
                'settings/ckeditor/<uid:{uid}>' => 'ckeditor/cke-configs/edit',
            ];
        });

        Event::on(View::class, View::EVENT_AFTER_REGISTER_ASSET_BUNDLE, function(AssetBundleEvent $event) {
            if ($event->bundle instanceof CkeditorAsset) {
                /** @var View $view */
                $view = $event->sender;
                foreach (array_keys(self::$ckeditorPackages) as $name) {
                    $bundle = $view->registerAssetBundle($name);
                    if ($bundle instanceof BaseCkeditorPackageAsset) {
                        $bundle->registerPackage($view);
                    }
                }
            }
        });

        Event::on(Element::class, Element::EVENT_AFTER_PROPAGATE, function(ModelEvent $event) {
            /** @var Element $element */
            $element = $event->sender;
            if (!$element->resaving) {
                foreach ($this->entryManagers($element) as $entryManager) {
                    $entryManager->maintainNestedElements($element, $event->isNew);
                }
            } else {
                // if we are resaving, and it's an owner element,
                // and all other "standard" conditions are met (see Entry::_shouldSaveRevision())
                // create the revision
                if (
                    $element->getPrimaryOwnerId() === null &&
                    $element->id &&
                    !$element->propagating &&
                    !$element->getIsDraft() &&
                    !$element->getIsRevision() &&
                    $element->getSection()?->enableVersioning
                ) {
                    Craft::$app->getRevisions()->createRevision($element);
                }
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

    public function getCkeConfigs(): CkeConfigs
    {
        return $this->get('ckeConfigs');
    }

    public function getSettingsResponse(): mixed
    {
        return Craft::$app->controller->redirect('settings/ckeditor');
    }
}
