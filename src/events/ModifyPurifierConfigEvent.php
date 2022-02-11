<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license MIT
 */

namespace craft\ckeditor\events;

/** @phpstan-ignore-next-line */
if (false) {
    /**
     * @deprecated in 1.3.0. Use `craft\htmlfield\events\ModifyPurifierConfigEvent` instead.
     */
    class ModifyPurifierConfigEvent
    {
    }
}

class_exists(\craft\htmlfield\events\ModifyPurifierConfigEvent::class);
