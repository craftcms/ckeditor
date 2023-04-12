<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license MIT
 */

namespace craft\ckeditor\web\assets\configs;

use craft\ckeditor\web\assets\ckeditor\CkeditorAsset;
use craft\web\AssetBundle;

/**
 * CKEditor custom build asset bundle
 *
 * @since 3.0.0
 */
class EditConfigAsset extends AssetBundle
{
    /**
     * @inheritdoc
     */
    public $sourcePath = __DIR__ . '/dist';

    /**
     * @inheritdoc
     */
    public $depends = [
        CkeditorAsset::class,
    ];

    /**
     * @inheritdoc
     */
    public $js = [
        'editconfig.js',
    ];

    /**
     * @inheritdoc
     */
    public $css = [
        'editconfig.css',
    ];
}
