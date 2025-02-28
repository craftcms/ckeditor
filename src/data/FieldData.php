<?php

/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license MIT
 */

namespace craft\ckeditor\data;

use ArrayIterator;
use Countable;
use Craft;
use craft\elements\Entry as EntryElement;
use craft\helpers\Html;
use craft\htmlfield\HtmlFieldData;
use Illuminate\Support\Collection;
use IteratorAggregate;
use Traversable;
use Twig\Markup as TwigMarkup;

/**
 * Stores the data for CKEditor fields.
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 * @since 4.1.0
 */
class FieldData extends HtmlFieldData implements IteratorAggregate, Countable
{
    /**
     * @var Collection<BaseChunk>
     */
    private Collection $chunks;
    private bool $loadedEntries = false;
    private bool $rendered = false;

    /**
     * @inheritdoc
     * @noinspection PhpMissingParentConstructorInspection
     */
    public function __construct(string $content, ?int $siteId = null)
    {
        $this->rawContent = $content;
        $this->siteId = $siteId;
    }

    public function __toString()
    {
        $this->render();
        return parent::__toString();
    }

    public function getIterator(): Traversable
    {
        return new ArrayIterator($this->getChunks()->all());
    }

    public function count(): int
    {
        return $this->getChunks()->count();
    }

    public function jsonSerialize()
    {
        $this->render();
        return parent::jsonSerialize();
    }

    /**
     * Returns a collection of the content chunks.
     *
     * @param bool $enabledEntriesOnly
     * @return Collection<BaseChunk>
     */
    public function getChunks(bool $enabledEntriesOnly = true): Collection
    {
        $this->parse();

        if ($enabledEntriesOnly) {
            $this->loadEntries();
            return $this->chunks->filter(fn(BaseChunk $chunk) => (
                !$chunk instanceof Entry ||
                $chunk->getEntry()?->getStatus() === EntryElement::STATUS_LIVE
            ));
        }

        return $this->chunks;
    }

    private function parse(): void
    {
        if (isset($this->chunks)) {
            return;
        }

        $this->chunks = Collection::make();
        $offset = 0;

        while (($pos = stripos($this->rawContent, '<craft-entry', $offset)) !== false) {
            $gtPos = strpos($this->rawContent, '>', $pos + 12);
            if ($gtPos === false) {
                break;
            }

            $this->addContentChunk(substr($this->rawContent, $offset, $pos - $offset));

            $attributes = Html::parseTagAttributes($this->rawContent, $pos);
            if (!empty($attributes['data']['entry-id'])) {
                $this->chunks->push(new Entry($attributes['data']['entry-id'], $this));
            }

            $offset = $gtPos + 1;

            $closePos = stripos($this->rawContent, '</craft-entry>', $offset);
            if ($closePos !== false) {
                $offset = $closePos + 14;
            }
        }

        $this->addContentChunk($offset ? substr($this->rawContent, $offset) : $this->rawContent);
    }

    private function addContentChunk(string $content): void
    {
        if ($content === '') {
            return;
        }

        $lastChunk = $this->chunks->last();

        if ($lastChunk instanceof Markup) {
            $lastChunk->rawHtml .= $content;
        } else {
            $this->chunks->push(new Markup($content, $this->siteId));
        }
    }

    public function loadEntries(): void
    {
        if ($this->loadedEntries) {
            return;
        }

        $this->parse();
        $entryChunks = $this->chunks->filter(fn(BaseChunk $chunk) => $chunk instanceof Entry);
        $entryIds = $entryChunks->map(fn(Entry $chunk) => $chunk->entryId)->all();

        if (!empty($entryIds)) {
            $query = EntryElement::find()
                ->id($entryIds)
                ->siteId($this->siteId)
                ->status(null)
                ->drafts(null)
                ->revisions(null)
                ->trashed(null)
                ->indexBy('id');

            if (Craft::$app->getRequest()->getIsPreview()) {
                $query->withProvisionalDrafts();
            }

            $entries = $query->all();
        } else {
            $entries = [];
        }

        $entryChunks->each(function(Entry $chunk) use ($entries) {
            $chunk->setEntry($entries[$chunk->entryId] ?? null);
        });

        $this->loadedEntries = true;
    }

    private function render(): void
    {
        if ($this->rendered) {
            return;
        }

        $content = $this->getChunks()->map(fn(BaseChunk $chunk) => $chunk->getHtml())->join('');
        TwigMarkup::__construct($content, Craft::$app->charset);

        $this->rendered = true;
    }
}
