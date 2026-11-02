<?php

/**
 * @link https://craftcms.com/
 *
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace CraftCms\Ckeditor\Events;

use CraftCms\Ckeditor\Field;
use Symfony\Component\HtmlSanitizer\HtmlSanitizerConfig;

/**
 * Dispatched when a CKEditor field builds its HTML sanitizer config, when the field uses the default sanitizer.
 *
 * `HtmlSanitizerConfig` is immutable, so listeners must assign the modified config back:
 *
 * ```php
 * Event::listen(function(HtmlSanitizerConfigResolving $event): void {
 *     $event->config = $event->config->allowElement('mark');
 * });
 * ```
 *
 * @since 6.0.0
 */
class HtmlSanitizerConfigResolving
{
    /**
     * @param  Field  $field  The CKEditor field
     * @param  HtmlSanitizerConfig  $config  The sanitizer config
     */
    public function __construct(
        public readonly Field $field,
        public HtmlSanitizerConfig $config,
    ) {}
}
