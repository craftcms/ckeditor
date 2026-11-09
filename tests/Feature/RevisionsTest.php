<?php

declare(strict_types=1);

use CraftCms\Cms\Entry\Elements\Entry;
use CraftCms\Cms\Support\Facades\Elements;
use CraftCms\Cms\Support\Facades\Revisions;
use CraftCms\Cms\User\Models\User;

beforeEach(function () {
    $this->actingAs(User::first(), 'craft');

    [
        'field' => $this->field,
        'section' => $section,
        'entryType' => $entryType,
        'nestedEntryType' => $nestedEntryType,
    ] = createCkeditorSetup(withNestedEntries: true);

    $owner = createEntry($section, $entryType, '<p>Intro</p>');
    $this->nested = createNestedEntry($owner, $this->field, $nestedEntryType, 'Original');
    $owner->setFieldValue('body', sprintf('<p>Intro</p><craft-entry data-entry-id="%s"></craft-entry>', $this->nested->id));
    Elements::saveElement($owner);

    $this->owner = Entry::find()->id($owner->id)->one();
    $this->revisionId = Revisions::createRevision($this->owner, force: true);
    $this->revision = Entry::find()->id($this->revisionId)->revisions()->status(null)->one();
});

/**
 * Returns the revisions of nested entries owned by the given revision.
 *
 * @return Entry[]
 */
function revisionNestedEntries(int $revisionId): array
{
    return Entry::find()->ownerId($revisionId)->revisions()->status(null)->trashed(null)->all();
}

it('copies the nested entries for a new revision', function () {
    $copies = revisionNestedEntries($this->revisionId);

    expect($copies)->toHaveCount(1)
        ->and($copies[0]->id)->not->toBe($this->nested->id)
        ->and($copies[0]->getCanonicalId())->toBe($this->nested->id)
        ->and($copies[0]->title)->toBe('Original');
});

it('leaves the owner’s content pointing at the live nested entries', function () {
    expect(Entry::find()->id($this->owner->id)->one()->getFieldValue('body')->getRawContent())
        ->toContain(sprintf('data-entry-id="%s"', $this->nested->id));
});

it('points the revision’s content at its copies of the nested entries', function () {
    $copy = revisionNestedEntries($this->revisionId)[0];

    expect($this->revision->getFieldValue('body')->getRawContent())
        ->toContain(sprintf('data-entry-id="%s"', $copy->id))
        ->not->toContain(sprintf('data-entry-id="%s"', $this->nested->id));
});

it('gives the owner its own copies of the nested entries when the revision’s content is copied to it', function () {
    $revisionCopy = revisionNestedEntries($this->revisionId)[0];

    // The Compare screen copies the value as is, and the field duplicates the nested entries on save
    $this->owner->setFieldValue('body', $this->revision->getFieldValue('body')->getRawContent());
    expect(Elements::saveElement($this->owner))->toBeTrue();

    preg_match_all('/data-entry-id="(\d+)"/', (string) Entry::find()->id($this->owner->id)->one()->getFieldValue('body')->getRawContent(), $matches);
    $entryIds = array_map('intval', $matches[1]);
    $copy = Entry::find()->id($entryIds[0] ?? 0)->status(null)->one();

    expect($entryIds)->toHaveCount(1)
        ->and($entryIds[0])->not->toBe($revisionCopy->id)
        ->and($copy?->getIsRevision())->toBeFalse()
        ->and($copy?->primaryOwnerId)->toBe($this->owner->id)
        ->and($copy?->title)->toBe('Original')
        // The revision keeps its own copy
        ->and(array_map(fn (Entry $entry) => $entry->id, revisionNestedEntries($this->revisionId)))->toBe([$revisionCopy->id]);
});
