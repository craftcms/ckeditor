<?php

namespace craft\ckeditor\assets\ckeditor;

use craft\web\AssetBundle;

/**
 * CKEditor asset bundle
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 * @since  1.0
 */
class CkeditorAsset extends AssetBundle
{
    public function init()
    {
        $this->sourcePath = dirname(__DIR__, 3).'/lib/ckeditor/dist';
        $this->js = [
            'ckeditor.js',
        ];

        parent::init();
    }
}
