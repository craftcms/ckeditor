<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace craft\ckeditor\console;

use ArrayIterator;
use Traversable;

/**
 * Toolbar builder
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 * @since 5.0.0
 */
class ToolbarBuilder
{
    /**
     * @param string[] $buttons The toolbar configuration
     */
    public function __construct(
        public array $buttons = [],
    ) {
    }

    public function hasButton(string $button): bool
    {
        return in_array($button, $this->buttons, true);
    }

    public function getButtonPos(string $button): int|false
    {
        return array_search($button, $this->buttons);
    }

    public function addButton(string $button): void
    {
        if ($button === '|' || !$this->hasButton($button)) {
            $this->buttons[] = $button;
        }
    }

    public function addButtonAt(string $button, int $pos): void
    {
        if ($button === '|' || !$this->hasButton($button)) {
            array_splice($this->buttons, $pos, 0, [$button]);
        }
    }

    public function addButtonBefore(string $button, string $after): void
    {
        $afterPos = $this->getButtonPos($after);
        if ($afterPos !== false) {
            $this->addButtonAt($button, $afterPos);
        } else {
            $this->addButton($button);
        }
    }

    public function addButtonAfter(string $button, string $after): void
    {
        $afterPos = $this->getButtonPos($after);
        if ($afterPos !== false) {
            $this->addButtonAt($button, $afterPos + 1);
        } else {
            $this->addButton($button);
        }
    }

    public function removeButton(string $button): void
    {
        $pos = $this->getButtonPos($button);
        if ($pos !== false) {
            $this->removeButtonAt($pos);
        }
    }

    public function removeButtonAt(int $pos): void
    {
        array_splice($this->buttons, $pos, 1);
        $this->buttons = array_values($this->buttons);
    }

    public function replaceButtonAt(int $pos, string $button)
    {
        array_splice($this->buttons, $pos, 1, [$button]);
    }

    public function getIterator(): Traversable
    {
        return new ArrayIterator($this->buttons);
    }
}
