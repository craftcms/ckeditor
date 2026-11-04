<?php

declare(strict_types=1);

use CraftCms\Ckeditor\Data\Entry as EntryChunk;
use CraftCms\Ckeditor\Data\Markup;
use CraftCms\Cms\Entry\Elements\Entry;
use CraftCms\Cms\Support\Facades\Elements;

beforeEach(function () {
    [
        'field' => $this->field,
        'section' => $section,
        'entryType' => $entryType,
        'nestedEntryType' => $this->nestedEntryType,
    ] = createCkeditorSetup(withNestedEntries: true);

    $this->owner = createEntry($section, $entryType, '<p>Intro</p>');
});

/**
 * Saves the owner with the given nested entries placed between two paragraphs, and returns its field value.
 */
function bodyWithNestedEntries(Entry $owner, Entry ...$entries): mixed
{
    $owner->setFieldValue('body', '<p>Before</p>'.implode('', array_map(
        fn (Entry $entry) => sprintf('<craft-entry data-entry-id="%s"></craft-entry>', $entry->id),
        $entries,
    )).'<p>After</p>');

    expect(Elements::saveElement($owner))->toBeTrue();

    return Entry::find()->id($owner->id)->one()->getFieldValue('body');
}

it('splits content into markup and entry chunks', function () {
    $nested = createNestedEntry($this->owner, $this->field, $this->nestedEntryType, 'A quote');

    $chunks = bodyWithNestedEntries($this->owner, $nested)->getChunks();

    expect($chunks)->toHaveCount(3)
        ->and($chunks[0])->toBeInstanceOf(Markup::class)
        ->and($chunks[0]->getHtml())->toBe('<p>Before</p>')
        ->and($chunks[1])->toBeInstanceOf(EntryChunk::class)
        ->and($chunks[1]->getEntry()->id)->toBe($nested->id)
        ->and($chunks[2]->getHtml())->toBe('<p>After</p>');
});

it('leaves out disabled nested entries by default', function () {
    $enabled = createNestedEntry($this->owner, $this->field, $this->nestedEntryType, 'Enabled');
    $disabled = createNestedEntry($this->owner, $this->field, $this->nestedEntryType, 'Disabled');
    $disabled->enabled = false;
    Elements::saveElement($disabled);

    $value = bodyWithNestedEntries($this->owner, $enabled, $disabled);

    $entryIds = fn (bool $enabledOnly) => $value->getChunks($enabledOnly)
        ->filter(fn ($chunk) => $chunk instanceof EntryChunk)
        ->map(fn (EntryChunk $chunk) => $chunk->entryId)
        ->values()
        ->all();

    expect($entryIds(true))->toBe([$enabled->id])
        ->and($entryIds(false))->toBe([$enabled->id, $disabled->id]);
});

it('queries its nested entries', function () {
    $first = createNestedEntry($this->owner, $this->field, $this->nestedEntryType, 'First');
    $second = createNestedEntry($this->owner, $this->field, $this->nestedEntryType, 'Second');

    $value = bodyWithNestedEntries($this->owner, $first, $second);

    expect($value->getEntries()->ids())->toEqualCanonicalizing([$first->id, $second->id])
        ->and($value->entries->ids())->toEqualCanonicalizing([$first->id, $second->id]);
});

it('returns an empty entry query when there are no nested entries', function () {
    $value = bodyWithNestedEntries($this->owner);

    expect($value->getEntries()->ids())->toBe([]);
});

it('counts and iterates over its chunks', function () {
    $nested = createNestedEntry($this->owner, $this->field, $this->nestedEntryType, 'A quote');

    $value = bodyWithNestedEntries($this->owner, $nested);

    expect($value)->toHaveCount(3)
        ->and(iterator_to_array($value))->toHaveCount(3)
        ->and($value->chunks)->toHaveCount(3);
});

it('renders nested entries within the content', function () {
    $nested = createNestedEntry($this->owner, $this->field, $this->nestedEntryType, 'A quote');

    $html = (string) bodyWithNestedEntries($this->owner, $nested);

    expect($html)->toStartWith('<p>Before</p>')
        ->toEndWith('<p>After</p>')
        ->not->toContain('<craft-entry');
});

it('serializes to JSON as its rendered HTML', function () {
    $value = bodyWithNestedEntries($this->owner);

    expect(json_encode($value))->toBe(json_encode('<p>Before</p><p>After</p>'));
});
