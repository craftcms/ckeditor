<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace craft\ckeditor\events;

use yii\base\Event;

/**
 * DefineLinkOptionsEvent class.
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 * @since 3.0.0
 */
class DefineLinkOptionsEvent extends Event
{
    /**
     * @var array The registered link options
     */
    public array $linkOptions = [];
}
