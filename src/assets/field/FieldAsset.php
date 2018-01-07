<?php
/**
 * @link      https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license   MIT
 */

namespace craft\ckeditor\assets\field;

use craft\ckeditor\assets\ckeditor\CkeditorAsset;
use craft\web\AssetBundle;
use craft\web\assets\cp\CpAsset;

/**
 * CKEditor field asset bundle
 */
class FieldAsset extends AssetBundle
{
    /**
     * @inheritdoc
     */
    public function init()
    {
        $this->sourcePath = __DIR__.'/dist';

        $this->depends = [
            CpAsset::class,
            CkeditorAsset::class,
        ];

        $this->css = [
            'css/ckeditor-field.min.css',
        ];

        parent::init();
    }
}
