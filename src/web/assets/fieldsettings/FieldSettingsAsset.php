<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace craft\ckeditor\web\assets\fieldsettings;

use craft\ckeditor\web\assets\ckeditor\CkeditorAsset;
use craft\web\AssetBundle;
use craft\web\View;
use nystudio107\codeeditor\assetbundles\codeeditor\CodeEditorAsset;

/**
 * CKEditor custom build asset bundle
 *
 * @since 3.0.0
 */
class FieldSettingsAsset extends AssetBundle
{
    /**
     * @inheritdoc
     */
    public $sourcePath = __DIR__ . '/dist';

    /**
     * @inheritdoc
     */
    public $depends = [
        CodeEditorAsset::class,
        CkeditorAsset::class,
    ];

    /**
     * @inheritdoc
     */
    public $js = [
        ['fieldsettings.js', 'type' => 'module'],
    ];

    /**
     * @inheritdoc
     */
    public $css = [
        'ckeditor.css',
    ];

    /**
     * @inheritdoc
     */
    public function registerAssetFiles($view): void
    {
        parent::registerAssetFiles($view);

        if ($view instanceof View) {
            $view->registerTranslations('ckeditor', [
                'Collapse to a dropdown',
                'Expand to a separate button',
            ]);
        }
    }
}
