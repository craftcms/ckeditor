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
use craft\ckeditor\Field;
use craft\controllers\GraphqlController;
use craft\elements\db\EntryQuery;
use craft\elements\Entry as EntryElement;
use craft\helpers\Html;
use craft\htmlfield\HtmlFieldData;
use Embed\Embed;
use Embed\Extractor;
use Embed\Http\Crawler;
use Illuminate\Support\Collection;
use IteratorAggregate;
use Throwable;
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
    public function __construct(string $content, ?int $siteId = null, private readonly ?Field $field = null)
    {
        $this->rawContent = $content;
        $this->siteId = $siteId;
    }

    public function __toString()
    {
        $this->render();
        return parent::__toString();
    }

    public function __get(string $name)
    {
        return match ($name) {
            'chunks' => $this->getChunks(),
            'entries' => $this->getEntries(),
            default => parent::__get($name),
        };
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

        $content = $this->rawContent;

        if (
            $this->field?->parseEmbeds &&
            (!Craft::$app->getRequest()->getIsCpRequest() || Craft::$app->controller instanceof GraphqlController)
        ) {
            $content = $this->parseEmbeds($content);
        }

        $this->chunks = Collection::make();
        $offset = 0;

        while (($pos = stripos($content, '<craft-entry', $offset)) !== false) {
            $gtPos = strpos($content, '>', $pos + 12);
            if ($gtPos === false) {
                break;
            }

            $this->addContentChunk(substr($content, $offset, $pos - $offset));

            $attributes = Html::parseTagAttributes($content, $pos);
            if (!empty($attributes['data']['entry-id'])) {
                $this->chunks->push(new Entry($attributes['data']['entry-id'], $this));
            }

            $offset = $gtPos + 1;

            $closePos = stripos($content, '</craft-entry>', $offset);
            if ($closePos !== false) {
                $offset = $closePos + 14;
            }
        }

        $this->addContentChunk($offset ? substr($content, $offset) : $content);
    }

    private function parseEmbeds(string $content): string
    {
        $offset = 0;
        $urls = [];

        while (($pos = stripos($content, '<oembed', $offset)) !== false) {
            $gtPos = strpos($content, '>', $pos + 7);
            if ($gtPos === false) {
                break;
            }

            $endPos = $gtPos + 1;
            $closePos = stripos($content, '</oembed>', $endPos);
            if ($closePos !== false) {
                $endPos = $closePos + 9;
            }

            $tag = substr($content, $pos, $endPos - $pos);
            if (!isset($urls[$tag])) {
                $attributes = Html::parseTagAttributes($content, $pos);
                if (!empty($attributes['url'])) {
                    $urls[$tag] = $attributes['url'];
                }
            }

            $offset = $endPos;
        }

        if (empty($urls)) {
            return $content;
        }

        $crawler = new Crawler(Craft::createGuzzleClient());
        $embed = new Embed($crawler);

        try {
            $infos = $embed->getMulti(...$urls);
            $html = array_map(fn(Extractor $info) => $info->code->html, $infos);
            return str_replace(array_keys($urls), $html, $content);
        } catch (Throwable $e) {
            Craft::$app->getErrorHandler()->logException($e);
            return $content;
        }
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

    /**
     * Returns an entry query prepped to fetch the nested entries.
     *
     * @return EntryQuery
     * @since 4.8.0
     */
    public function getEntries(): EntryQuery
    {
        $this->parse();
        $entryChunks = $this->chunks->filter(fn(BaseChunk $chunk) => $chunk instanceof Entry);
        $entryIds = $entryChunks->map(fn(Entry $chunk) => $chunk->entryId)->all();
        $query = EntryElement::find();

        if (!empty($entryIds)) {
            $query
                ->id($entryIds)
                ->siteId($this->siteId)
                ->status(null)
                ->drafts(null)
                ->revisions(null)
                ->trashed(null);

            if (Craft::$app->getRequest()->getIsPreview()) {
                $query->withProvisionalDrafts();
            }
        } else {
            $query->id(false);
        }

        return $query;
    }

    public function loadEntries(): void
    {
        if ($this->loadedEntries) {
            return;
        }

        $entryChunks = $this->chunks->filter(fn(BaseChunk $chunk) => $chunk instanceof Entry);
        if ($entryChunks->isNotEmpty()) {
            $entries = $this->getEntries()->indexBy('id')->all();
            $entryChunks->each(function(Entry $chunk) use ($entries) {
                $chunk->setEntry($entries[$chunk->entryId] ?? null);
            });
        }

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
