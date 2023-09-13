<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace craft\ckeditor\web\assets\ckeconfig;

use craft\ckeditor\web\assets\ckeditor\CkeditorAsset;
use craft\web\AssetBundle;

/**
 * CKEditor custom build asset bundle
 *
 * @since 3.0.0
 */
class CkeConfigAsset extends AssetBundle
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
        'ckeconfig.js',
    ];

    /**
     * @inheritdoc
     */
    public $css = [
        'css/ckeconfig.css',
    ];
}
