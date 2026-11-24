<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace craft\ckeditor\events;

use HTMLPurifier_Config;
use HTMLPurifier_HTMLDefinition;
use yii\base\Event;

/**
 * ModifyPurifierDefinitionEvent class.
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 * @since 5.10.0
 */
class ModifyPurifierDefinitionEvent extends Event
{
    /**
     * @var HTMLPurifier_HTMLDefinition The HTML Purifier HTML definition, which can be modified.
     */
    public HTMLPurifier_HTMLDefinition $definition;

    /**
     * @var HTMLPurifier_Config The HTML Purifier config.
     *
     * Changes to its settings won’t apply when the definition is cached, so they should be made via
     * [[\craft\ckeditor\Field::EVENT_MODIFY_PURIFIER_CONFIG]] instead.
     */
    public HTMLPurifier_Config $config;
}
