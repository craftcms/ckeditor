<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace craft\ckeditor\events;

use yii\base\Event;

/**
 * RegisterPackagesEvent class.
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 * @since 5.8.0
 */
class RegisterPackagesEvent extends Event
{
    /**
     * @var array<string,string> CKEditor package asset bundles, mapping each bundle class name to its
     * JavaScript entry file (relative to the bundle’s source path).
     *
     * Asset bundles should extend [[\craft\ckeditor\web\assets\BaseCkeditorPackageAsset]].
     *
     * ```php
     * $event->packages[TokensAsset::class] = 'tokens.js';
     * ```
     */
    public array $packages = [];
}
