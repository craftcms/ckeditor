<?php

namespace craft\ckeditor;

use Craft;
use craft\events\RegisterComponentTypesEvent;
use craft\events\RegisterUrlRulesEvent;
use craft\services\Fields;
use craft\web\UrlManager;
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

    public string $schemaVersion = '3.0.0.0';
    public bool $hasCpSettings = true;

    public function init()
    {
        parent::init();

        Event::on(Fields::class, Fields::EVENT_REGISTER_FIELD_TYPES, function(RegisterComponentTypesEvent $event) {
            $event->types[] = Field::class;
        });

        Event::on(UrlManager::class, UrlManager::EVENT_REGISTER_CP_URL_RULES, function(RegisterUrlRulesEvent $event) {
            $event->rules += [
                'settings/ckeditor' => 'ckeditor/cke-configs/index',
                'settings/ckeditor/new' => 'ckeditor/cke-configs/edit',
                'settings/ckeditor/<uid:{uid}>' => 'ckeditor/cke-configs/edit',
            ];
        });
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
