<?php

namespace craft\ckeditor;

use Craft;
use craft\base\Model;
use craft\events\RegisterComponentTypesEvent;
use craft\helpers\App;
use craft\services\Fields;
use yii\base\Event;

/**
 * CKEditor plugin.
 *
 * @method static Plugin getInstance()
 * @property-read Settings $settings
 * @method Settings getSettings()
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 */
class Plugin extends \craft\base\Plugin
{
    /**
     * @inheritdoc
     */
    public bool $hasCpSettings = true;

    /**
     * @inheritdoc
     */
    public function init()
    {
        parent::init();

        Event::on(Fields::class, Fields::EVENT_REGISTER_FIELD_TYPES, function(RegisterComponentTypesEvent $e) {
            $e->types[] = Field::class;
        });
    }

    /**
     * @inheritdoc
     */
    protected function createSettingsModel(): ?Model
    {
        return new Settings();
    }

    /**
     * @inheritdoc
     */
    protected function settingsHtml(): ?string
    {
        return Craft::$app->getView()->renderTemplate('ckeditor/_plugin-settings', [
            'settings' => $this->getSettings(),
        ]);
    }

    /**
     * Returns the CKEditor build URL.
     *
     * @return string
     */
    public function getBuildUrl(): string
    {
        return App::parseEnv($this->getSettings()->buildUrl);
    }
}
