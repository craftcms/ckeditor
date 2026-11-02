<?php

/**
 * @link https://craftcms.com/
 *
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace CraftCms\Ckeditor\Data;

use CraftCms\Ckeditor\Support\CkeditorAssets;

/**
 * A CKEditor package (a JavaScript module that provides CKEditor plugins), registered with
 * {@see CkeditorAssets::registerPackage()}.
 *
 * @since 6.0.0
 */
final readonly class CkeditorPackage
{
    /**
     * @param  string  $namespace  The module specifier the package is imported by (e.g. `@craftcms/ckeditor5-tokens`)
     * @param  string  $url  The URL of the package’s JavaScript entry file
     * @param  string[]  $pluginNames  The CKEditor plugin names the package provides
     * @param  string[]  $toolbarItems  The toolbar items the package provides
     * @param  string[]  $styles  URLs of CSS files that should be registered along with the package
     * @param  string|null  $translationsPath  The filesystem path to the package’s `translations/` folder, if it has one
     * @param  string|null  $translationsUrl  The URL of the package’s `translations/` folder, if it has one
     */
    public function __construct(
        public string $namespace,
        public string $url,
        public array $pluginNames = [],
        public array $toolbarItems = [],
        public array $styles = [],
        public ?string $translationsPath = null,
        public ?string $translationsUrl = null,
    ) {}
}
