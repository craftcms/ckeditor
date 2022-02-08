<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license MIT
 */

namespace craft\ckeditor\events;

use HTMLPurifier_Config;
use yii\base\Event;

/**
 * ModifyPurifierConfig class.
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 */
class ModifyPurifierConfigEvent extends Event
{
    // Properties
    // =========================================================================

    /**
     * @var HTMLPurifier_Config $config the HTML Purifier config
     */
    public $config;
}