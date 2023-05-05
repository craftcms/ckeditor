<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license MIT
 */

namespace craft\ckeditor\web\assets\ckeditor;

use Craft;
use craft\base\ElementInterface;
use craft\web\AssetBundle;
use craft\web\assets\cp\CpAsset;
use craft\web\View;

/**
 * CKEditor custom build asset bundle
 *
 * @since 3.0.0
 */
class CkeditorAsset extends AssetBundle
{
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
        $this->includeTranslation();
        parent::registerAssetFiles($view);

        if ($view instanceof View) {
            $this->registerRefHandles($view);
            $view->registerTranslations('ckeditor', [
                'Insert link',
                'Link to the current site',
                'Site: {name}',
            ]);
        }
    }

    private function includeTranslation(): void
    {
        $language = match (Craft::$app->language) {
            'en', 'en-US' => false,
            'nn' => 'no',
            default => strtolower(Craft::$app->language),
        };

        if ($language === false) {
            return;
        }

        if ($this->includeTranslationForLanguage($language)) {
            return;
        }

        // maybe without the territory?
        $dashPos = strpos($language, '-');
        if ($dashPos !== false) {
            $this->includeTranslationForLanguage(substr($language, 0, $dashPos));
        }
    }

    private function includeTranslationForLanguage($language): bool
    {
        $subpath = "translations/$language.js";
        $path = __DIR__ . "/dist/$subpath";
        if (!file_exists($path)) {
            return false;
        }
        $this->js[] = $subpath;
        return true;
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
window.Ckeditor.localizedRefHandles = $refHandles;
JS,
            [$refHandles],
            View::POS_END,
        );
    }
}
