<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace craft\ckeditor\events;

use craft\ckeditor\CkeConfig;
use yii\base\Event;

/**
 * ModifyConfigEvent class.
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 * @since 3.1.0
 */
class ModifyConfigEvent extends Event
{
    /**
     * @var array The base field config array that the CKEditor config options will be merged into
     */
    public array $baseConfig;

    /**
     * @var CkeConfig $ckeConfig The CKEditor config
     */
    public CkeConfig $ckeConfig;

    /**
     * @var string[] $toolbar The toolbar config
     * @since 4.1.0
     */
    public array $toolbar;
}
