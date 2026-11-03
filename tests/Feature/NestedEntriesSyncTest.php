<?php

declare(strict_types=1);

use CraftCms\Cms\Entry\Elements\Entry;
use CraftCms\Cms\Support\Facades\Drafts;
use CraftCms\Cms\Support\Facades\Elements;
use CraftCms\Cms\User\Models\User;

beforeEach(function () {
    $this->actingAs(User::first(), 'craft');

    [
        'field' => $this->field,
        'section' => $section,
        'entryType' => $this->entryType,
        'nestedEntryType' => $this->nestedEntryType,
    ] = createCkeditorSetup(withNestedEntries: true);

    $this->owner = createEntry($section, $this->entryType, '<p>Intro</p>');
    $this->nested = createNestedEntry($this->owner, $this->field, $this->nestedEntryType, 'Original');
    saveBody($this->owner, $this->nested->id);
});

/**
 * Saves the element with the given nested entry IDs placed after an intro paragraph.
 */
function saveBody(Entry $element, int ...$entryIds): void
{
    $element->setFieldValue('body', '<p>Intro</p>'.implode('', array_map(
        fn (int $id) => sprintf('<craft-entry data-entry-id="%s"></craft-entry>', $id),
        $entryIds,
    )));

    expect(Elements::saveElement($element))->toBeTrue();
}

/**
 * Returns the nested entry IDs referenced by the element’s saved content, in order.
 *
 * @return int[]
 */
function bodyEntryIds(Entry $element): array
{
    $element = Entry::find()->id($element->id)->drafts(null)->status(null)->one();
    preg_match_all('/data-entry-id="(\d+)"/', $element->getFieldValue('body')->getRawContent(), $matches);

    return array_map('intval', $matches[1]);
}

function findNestedEntry(int $id, bool $trashed = false): ?Entry
{
    return Entry::find()->id($id)->status(null)->drafts(null)->trashed($trashed)->one();
}

describe('drafts', function () {
    beforeEach(function () {
        $this->draft = Drafts::createDraft($this->owner, User::first()->id);
    });

    it('shares the owner’s nested entries with a new draft', function () {
        expect(bodyEntryIds($this->draft))->toBe([$this->nested->id])
            ->and(Entry::find()->id($this->nested->id)->ownerId($this->draft->id)->status(null)->exists())->toBeTrue();
    });

    it('doesn’t change the owner until the draft is applied', function () {
        $added = createNestedEntry($this->draft, $this->field, $this->nestedEntryType, 'Added');
        saveBody($this->draft, $this->nested->id, $added->id);

        expect(bodyEntryIds($this->owner))->toBe([$this->nested->id])
            ->and(bodyEntryIds($this->draft))->toBe([$this->nested->id, $added->id]);
    });

    it('points the owner’s content at the new entries once the draft is applied', function () {
        // An existing entry edited in the draft gets copied for it, as the editor does via `duplicate-nested-entry`
        $copy = Elements::duplicateElement($this->nested, [
            'primaryOwnerId' => $this->draft->id,
            'ownerId' => $this->draft->id,
        ]);
        $copy->title = 'Edited';
        Elements::saveElement($copy);

        $added = createNestedEntry($this->draft, $this->field, $this->nestedEntryType, 'Added');
        saveBody($this->draft, $copy->id, $added->id);

        Drafts::applyDraft($this->draft);

        $entryIds = bodyEntryIds($this->owner);
        $entries = array_map(fn (int $id) => findNestedEntry($id), $entryIds);

        expect($entryIds)->toHaveCount(2)
            ->not->toContain($this->nested->id, $copy->id, $added->id)
            ->and(array_map(fn (?Entry $entry) => $entry?->title, $entries))->toBe(['Edited', 'Added'])
            ->and(array_map(fn (Entry $entry) => $entry->primaryOwnerId, $entries))->toBe([$this->owner->id, $this->owner->id])
            ->and(array_map(fn (Entry $entry) => $entry->fieldId, $entries))->toBe([$this->field->id, $this->field->id]);
    });

    it('keeps unchanged entries and moves entries added in the draft to the owner', function () {
        $added = createNestedEntry($this->draft, $this->field, $this->nestedEntryType, 'Added');
        saveBody($this->draft, $this->nested->id, $added->id);

        Drafts::applyDraft($this->draft);

        $entryIds = bodyEntryIds($this->owner);
        $newEntry = findNestedEntry($entryIds[1]);

        expect($entryIds)->toHaveCount(2)
            ->and($entryIds[0])->toBe($this->nested->id)
            ->and($entryIds[1])->not->toBe($added->id)
            ->and($newEntry?->title)->toBe('Added')
            ->and($newEntry?->primaryOwnerId)->toBe($this->owner->id);
    });

    it('removes the draft’s own copies once the draft is applied', function () {
        $added = createNestedEntry($this->draft, $this->field, $this->nestedEntryType, 'Added');
        saveBody($this->draft, $this->nested->id, $added->id);

        Drafts::applyDraft($this->draft);

        expect(findNestedEntry($added->id))->toBeNull()
            ->and(findNestedEntry($added->id, trashed: true))->toBeNull();
    });

    it('trashes entries replaced by the draft once it’s applied', function () {
        $copy = Elements::duplicateElement($this->nested, [
            'primaryOwnerId' => $this->draft->id,
            'ownerId' => $this->draft->id,
        ]);
        saveBody($this->draft, $copy->id);

        Drafts::applyDraft($this->draft);

        expect(findNestedEntry($this->nested->id))->toBeNull()
            ->and(findNestedEntry($this->nested->id, trashed: true))->not->toBeNull();
    });

    it('trashes entries removed in the draft once it’s applied', function () {
        saveBody($this->draft);

        expect(findNestedEntry($this->nested->id))->not->toBeNull();

        Drafts::applyDraft($this->draft);

        expect(bodyEntryIds($this->owner))->toBe([])
            ->and(findNestedEntry($this->nested->id))->toBeNull()
            ->and(findNestedEntry($this->nested->id, trashed: true))->not->toBeNull();
    });

    it('gives the editor the new entry IDs once the draft is applied', function () {
        $added = createNestedEntry($this->draft, $this->field, $this->nestedEntryType, 'Added');
        saveBody($this->draft, $this->nested->id, $added->id);

        Drafts::applyDraft($this->draft);

        $response = $this->postJson(cpAction('field-value'), [
            'ownerId' => $this->owner->id,
            'layoutElementUid' => $this->entryType->getFieldLayout()->getCustomFieldElements()[0]->uid,
        ])->assertOk();

        foreach (bodyEntryIds($this->owner) as $id) {
            expect($response->json('value'))->toContain(sprintf('data-entry-id="%s"', $id));
        }

        expect($response->json('value'))->not->toContain(sprintf('data-entry-id="%s"', $added->id));
    });
});

describe('duplicating the owner', function () {
    it('copies the nested entries and points the copy’s content at them', function () {
        $second = createNestedEntry($this->owner, $this->field, $this->nestedEntryType, 'Second');
        saveBody($this->owner, $this->nested->id, $second->id);

        $duplicate = Elements::duplicateElement($this->owner);

        $entryIds = bodyEntryIds($duplicate);
        $entries = array_map(fn (int $id) => findNestedEntry($id), $entryIds);

        expect($entryIds)->toHaveCount(2)
            ->not->toContain($this->nested->id, $second->id)
            ->and(array_map(fn (?Entry $entry) => $entry?->title, $entries))->toBe(['Original', 'Second'])
            ->and(array_map(fn (Entry $entry) => $entry->primaryOwnerId, $entries))->toBe([$duplicate->id, $duplicate->id]);
    });

    it('leaves the original owner and its nested entries alone', function () {
        Elements::duplicateElement($this->owner);

        expect(bodyEntryIds($this->owner))->toBe([$this->nested->id])
            ->and(findNestedEntry($this->nested->id)->primaryOwnerId)->toBe($this->owner->id);
    });
});

describe('removing nested entries from the content', function () {
    it('trashes an entry removed from the content', function () {
        saveBody($this->owner);

        expect(findNestedEntry($this->nested->id))->toBeNull()
            ->and(findNestedEntry($this->nested->id, trashed: true))->not->toBeNull();
    });

    it('only trashes the entries that were removed', function () {
        $second = createNestedEntry($this->owner, $this->field, $this->nestedEntryType, 'Second');
        saveBody($this->owner, $this->nested->id, $second->id);

        saveBody($this->owner, $second->id);

        expect(findNestedEntry($this->nested->id))->toBeNull()
            ->and(findNestedEntry($second->id))->not->toBeNull();
    });

    it('restores an entry that’s put back into the content', function () {
        saveBody($this->owner);
        saveBody($this->owner, $this->nested->id);

        $restored = findNestedEntry($this->nested->id);

        expect($restored)->not->toBeNull()
            ->and($restored->primaryOwnerId)->toBe($this->owner->id)
            ->and(bodyEntryIds($this->owner))->toBe([$this->nested->id]);
    });
});
