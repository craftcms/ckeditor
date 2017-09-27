<?php

namespace craft\ckeditor;

use Craft;
use craft\web\AssetBundle;

/**
 * CKEditor asset bundle
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 * @since  1.0
 */
class Asset extends AssetBundle
{
    public function init()
    {
        $this->sourcePath = dirname(__DIR__).'/lib/ckeditor/build';
        $this->js = [
            'ckeditor.js',
        ];

        parent::init();
    }
}
