<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license MIT
 */

namespace craft\ckeditor\web\assets\ckeditor;

use Craft;
use craft\web\AssetBundle;
use craft\web\assets\cp\CpAsset;

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
        'ckeditor.js',
    ];

    /**
     * @inheritdoc
     */
    public $css = [
        'css/ckeditor.css',
    ];

    public function registerAssetFiles($view): void
    {
        $this->includeTranslation();
        parent::registerAssetFiles($view);
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
}
