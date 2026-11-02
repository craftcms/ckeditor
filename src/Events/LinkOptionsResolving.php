<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace CraftCms\Ckeditor\Events;

use CraftCms\Ckeditor\Field;
use CraftCms\Cms\Element\Contracts\ElementInterface;

/**
 * Dispatched when the link options for a CKEditor field are being resolved.
 *
 * Each link option is an array with these keys:
 * - `label` (required) – the user-facing option label that appears in the Link dropdown menu
 * - `elementType` (required) – the element type class that the option should link to
 * - `refHandle` (optional) – the element type’s reference handle
 * - `sources` (optional) – the sources that the user should be able to select elements from
 * - `criteria` (optional) – element criteria parameters that should limit which elements the user can select
 *
 * @since 6.0.0
 */
class LinkOptionsResolving
{
    /**
     * @param Field $field The CKEditor field
     * @param ElementInterface|null $element The element being edited, if there is one
     * @param array[] $linkOptions The link options
     */
    public function __construct(
        public readonly Field $field,
        public readonly ?ElementInterface $element,
        public array $linkOptions,
    ) {
    }
}
