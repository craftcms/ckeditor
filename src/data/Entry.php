<?php

/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license MIT
 */

namespace craft\ckeditor\data;

use craft\elements\Entry as EntryElement;

/**
 * Represents an entry within a CKEditor field’s content.
 *
 * @property EntryElement|null $entry
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 * @since 4.1.0
 */
class Entry extends BaseChunk
{
    private ?EntryElement $entry;

    public function __construct(
        public readonly int $entryId,
        private readonly FieldData $fieldData,
    ) {
    }

    public function getType(): string
    {
        return 'entry';
    }

    public function getHtml(): string
    {
        return $this->getEntry()?->render() ?? '';
    }

    public function getEntry(): ?EntryElement
    {
        $this->fieldData->loadEntries();
        return $this->entry;
    }

    public function setEntry(?EntryElement $entry): void
    {
        $this->entry = $entry;
    }
}
