<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace craft\ckeditor\web\assets\ckeditor;

use Craft;
use craft\base\ElementInterface;
use craft\base\Event;
use craft\ckeditor\web\assets\BaseCkeditorPackageAsset;
use craft\helpers\App;
use craft\web\assets\cp\CpAsset;
use craft\web\View;

/**
 * CKEditor custom build asset bundle
 *
 * @since 3.0.0
 */
class CkeditorAsset extends BaseCkeditorPackageAsset
{
    /**
     * @event Event The event that is triggered when asset bundle is published.
     * @see registerCkeditorAsset()
     * @since 3.4.0
     * @deprecated in 3.5.0. [[\craft\ckeditor\Plugin::registerCkeditorPackage()]] should be used instead.
     */
    public const EVENT_PUBLISH = 'publish';

    /**
     * @inheritdoc
     */
    public $sourcePath = __DIR__ . '/dist';

    /**
     * @inheritdoc
     */
    public $depends = [
        CpAsset::class,
    ];

    /**
     * @inheritdoc
     */
    public $js = [
        'ckeditor5-dll.js',
        'ckeditor5-craftcms.js',
    ];

    /**
     * @inheritdoc
     */
    public $css = [
        'css/ckeditor5-craftcms.css',
    ];

    public function registerAssetFiles($view): void
    {
        parent::registerAssetFiles($view);

        if ($view instanceof View) {
            $this->registerRefHandles($view);
            $view->registerTranslations('app', [
                'Edit {type}',
            ]);
            $view->registerTranslations('ckeditor', [
                'Add nested content',
                'Entries cannot be copied between CKEditor fields.',
                'Entry toolbar',
                'Entry types list',
                'Insert link',
                'Link to the current site',
                'New {type}',
                'Site: {name}',
                'This field doesn’t allow nested entries.',
                '{num, number} {num, plural, =1{character} other{characters}}',
                '{num, number} {num, plural, =1{word} other{words}}',
            ]);
            $view->registerJsWithVars(fn($attach) => <<<JS
Craft.showCkeditorInspector = $attach;
JS, [
                (bool)App::env('CRAFT_SHOW_CKEDITOR_INSPECTOR'),
], View::POS_END);
        }
    }

    private function registerRefHandles(View $view): void
    {
        $refHandles = [];

        foreach (Craft::$app->getElements()->getAllElementTypes() as $elementType) {
            /** @var string|ElementInterface $elementType */
            if ($elementType::isLocalized() && ($refHandle = $elementType::refHandle()) !== null) {
                $refHandles[] = $refHandle;
            }
        }

        $view->registerJsWithVars(
            fn($refHandles) => <<<JS
window.CKEditor5.craftcms.localizedRefHandles = $refHandles;
JS,
            [$refHandles],
            View::POS_END,
        );
    }
}
