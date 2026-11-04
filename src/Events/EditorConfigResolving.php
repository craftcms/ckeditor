<?php

/**
 * @link https://craftcms.com/
 *
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

declare(strict_types=1);

namespace CraftCms\Ckeditor\Events;

use CraftCms\Ckeditor\Field;
use CraftCms\Cms\Element\Contracts\ElementInterface;

/**
 * Dispatched when a CKEditor field’s editor config is being prepared for the control panel.
 *
 * Listeners can modify the base config (which the field’s config options are merged into) and the toolbar.
 *
 * @since 6.0.0
 */
class EditorConfigResolving
{
    /**
     * @param  Field  $field  The CKEditor field
     * @param  ElementInterface|null  $element  The element being edited, if there is one
     * @param  array  $baseConfig  The base editor config that the field’s config options will be merged into
     * @param  string[]  $toolbar  The toolbar items
     */
    public function __construct(
        public readonly Field $field,
        public readonly ?ElementInterface $element,
        public array $baseConfig,
        public array $toolbar,
    ) {}
}
