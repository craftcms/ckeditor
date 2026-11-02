<?php

/**
 * @link https://craftcms.com/
 *
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license MIT
 */

namespace CraftCms\Ckeditor\Data;

use CraftCms\Cms\Twig\Contracts\SafeHtml;
use LogicException;

/**
 * Represents a chunk of CKEditor content.
 *
 * @property-read string $type
 * @property-read string $html
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 *
 * @since 4.1.0
 */
abstract class BaseChunk implements SafeHtml
{
    /**
     * Returns the chunk type.
     */
    abstract public function getType(): string;

    /**
     * Returns the chunk’s HTML.
     */
    abstract public function getHtml(): string;

    public function __get(string $name)
    {
        return match ($name) {
            'type' => $this->getType(),
            'html' => $this->getHtml(),
            default => throw new LogicException(sprintf('Getting unknown property: %s::%s', static::class, $name)),
        };
    }

    public function __isset(string $name): bool
    {
        return in_array($name, ['type', 'html'], true);
    }

    public function __toString(): string
    {
        return $this->getHtml();
    }
}
