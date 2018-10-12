<?php

namespace craft\ckeditor;

use craft\events\RegisterComponentTypesEvent;
use craft\services\Fields;
use yii\base\Event;

/**
 * CKEditor plugin.
 *
 * @method static Plugin getInstance()
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 * @since  1.0
 */
class Plugin extends \craft\base\Plugin
{
    // Public Methods
    // =========================================================================

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
}
