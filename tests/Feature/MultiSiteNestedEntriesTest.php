<?php

declare(strict_types=1);

use CraftCms\Cms\Entry\Elements\Entry;
use CraftCms\Cms\Support\Facades\Drafts;
use CraftCms\Cms\Support\Facades\Elements;
use CraftCms\Cms\Support\Facades\Sites;
use CraftCms\Cms\User\Models\User;

beforeEach(function () {
    $this->actingAs(User::first(), 'craft');

    $this->primarySiteId = Sites::getPrimarySite()->id;
    $this->secondSiteId = createSecondSite()->id;
});

/**
 * Creates the CKEditor setup with the given translation method, plus an owner whose primary site content has a nested entry.
 */
function createMultiSiteOwner(string $translationMethod): array
{
    $setup = createCkeditorSetup(['translationMethod' => $translationMethod], withNestedEntries: true);
    $owner = createEntry($setup['section'], $setup['entryType'], '<p>Intro</p>');
    $nested = createNestedEntry($owner, $setup['field'], $setup['nestedEntryType'], 'Original');
    $owner->setFieldValue('body', siteBody('Intro', $nested->id));
    expect(Elements::saveElement($owner))->toBeTrue();

    return [...$setup, 'owner' => $owner, 'nested' => $nested];
}

function siteBody(string $intro, int ...$entryIds): string
{
    return "<p>$intro</p>".implode('', array_map(
        fn (int $id) => sprintf('<craft-entry data-entry-id="%s"></craft-entry>', $id),
        $entryIds,
    ));
}

function ownerForSite(Entry $owner, int $siteId, bool $drafts = false): ?Entry
{
    return Entry::find()->id($owner->id)->siteId($siteId)->drafts($drafts ? null : false)->status(null)->one();
}

/**
 * Returns the nested entry IDs referenced by the owner’s content on the given site, in order.
 *
 * @return int[]
 */
function siteEntryIds(Entry $owner, int $siteId): array
{
    preg_match_all('/data-entry-id="(\d+)"/', (string) ownerForSite($owner, $siteId)->getFieldValue('body')?->getRawContent(), $matches);

    return array_map('intval', $matches[1]);
}

function siteNestedEntry(int $id, int $siteId): ?Entry
{
    return Entry::find()->id($id)->siteId($siteId)->status(null)->one();
}

describe('fields that aren’t translatable', function () {
    it('shares nested entries across sites', function () {
        ['owner' => $owner, 'nested' => $nested] = createMultiSiteOwner('none');

        expect(siteEntryIds($owner, $this->secondSiteId))->toBe([$nested->id])
            ->and(siteNestedEntry($nested->id, $this->secondSiteId)?->title)->toBe('Original');
    });

    it('applies content changes on one site to every site', function () {
        ['owner' => $owner, 'nested' => $nested] = createMultiSiteOwner('none');

        $secondSiteOwner = ownerForSite($owner, $this->secondSiteId);
        $secondSiteOwner->setFieldValue('body', siteBody('Changed', $nested->id));
        Elements::saveElement($secondSiteOwner);

        expect((string) ownerForSite($owner, $this->primarySiteId)->getFieldValue('body')->getRawContent())
            ->toContain('<p>Changed</p>');
    });
});

describe('fields translated per site', function () {
    it('keeps each site’s content and nested entries separate', function () {
        ['owner' => $owner, 'nested' => $nested] = createMultiSiteOwner('site');

        expect(siteEntryIds($owner, $this->primarySiteId))->toBe([$nested->id])
            ->and(siteEntryIds($owner, $this->secondSiteId))->toBe([])
            ->and(siteNestedEntry($nested->id, $this->secondSiteId))->toBeNull();
    });

    it('doesn’t apply content changes on one site to the others', function () {
        ['owner' => $owner, 'nested' => $nested] = createMultiSiteOwner('site');

        $secondSiteOwner = ownerForSite($owner, $this->secondSiteId);
        $secondSiteOwner->setFieldValue('body', siteBody('Zweite'));
        Elements::saveElement($secondSiteOwner);

        expect((string) ownerForSite($owner, $this->primarySiteId)->getFieldValue('body')->getRawContent())
            ->toBe(siteBody('Intro', $nested->id));
    });

    it('copies content to another site with its own copies of the nested entries', function () {
        ['owner' => $owner, 'nested' => $nested] = createMultiSiteOwner('site');

        // The Compare screen copies the value as is, and the field duplicates the nested entries on save
        $to = ownerForSite($owner, $this->secondSiteId);
        $to->setFieldValue('body', ownerForSite($owner, $this->primarySiteId)->getFieldValue('body')->getRawContent());
        Elements::saveElement($to);

        $entryIds = siteEntryIds($owner, $this->secondSiteId);
        $copy = siteNestedEntry($entryIds[0], $this->secondSiteId);

        expect($entryIds)->toHaveCount(1)
            ->and($entryIds[0])->not->toBe($nested->id)
            ->and($copy?->title)->toBe('Original')
            ->and($copy?->primaryOwnerId)->toBe($owner->id)
            // The source site is left alone
            ->and(siteEntryIds($owner, $this->primarySiteId))->toBe([$nested->id]);
    });

    it('copies content without nested entries as is', function () {
        $setup = createCkeditorSetup(['translationMethod' => 'site']);
        $owner = createEntry($setup['section'], $setup['entryType'], '<p>Hello <strong>world</strong></p>');

        $to = ownerForSite($owner, $this->secondSiteId);
        $to->setFieldValue('body', ownerForSite($owner, $this->primarySiteId)->getFieldValue('body')->getRawContent());
        Elements::saveElement($to);

        expect((string) ownerForSite($owner, $this->secondSiteId)->getFieldValue('body')->getRawContent())
            ->toBe('<p>Hello <strong>world</strong></p>');
    });
});

describe('unpublished drafts', function () {
    it('gives each site exactly one copy of a nested entry added before the first save', function () {
        [
            'field' => $field,
            'section' => $section,
            'entryType' => $entryType,
            'nestedEntryType' => $nestedEntryType,
        ] = createCkeditorSetup(['translationMethod' => 'site'], withNestedEntries: true);

        // A fresh entry starts as an unpublished draft, which the editor autosaves to every site
        $entry = new Entry(['sectionId' => $section->id, 'typeId' => $entryType->id, 'title' => 'Fresh']);
        expect(Drafts::saveElementAsDraft($entry, User::first()->id, markAsSaved: false))->toBeTrue();

        $nested = createNestedEntry($entry, $field, $nestedEntryType, 'Added');
        $draft = ownerForSite($entry, $this->primarySiteId, drafts: true);
        $draft->setFieldValue('body', siteBody('Intro', $nested->id));
        $draft->propagateAll = true;
        expect(Elements::saveElement($draft))->toBeTrue();

        // Then it’s fully saved
        $draft = ownerForSite($entry, $this->primarySiteId, drafts: true);
        $draft->propagateAll = true;
        $owner = Drafts::applyDraft($draft);

        foreach ([$this->primarySiteId, $this->secondSiteId] as $siteId) {
            $entryIds = siteEntryIds($owner, $siteId);
            $ownedIds = Entry::find()->ownerId($owner->id)->fieldId($field->id)->siteId($siteId)->status(null)->ids();

            expect($entryIds)->toHaveCount(1)
                ->and($ownedIds)->toBe($entryIds)
                ->and(siteNestedEntry($entryIds[0], $siteId)?->title)->toBe('Added');
        }

        expect(siteEntryIds($owner, $this->primarySiteId))->not->toBe(siteEntryIds($owner, $this->secondSiteId));
    });

    it('keeps each site’s copy of a nested entry when later saves don’t post the field', function () {
        [
            'field' => $field,
            'section' => $section,
            'entryType' => $entryType,
            'nestedEntryType' => $nestedEntryType,
        ] = createCkeditorSetup(['translationMethod' => 'site'], withNestedEntries: true);

        $entry = new Entry(['sectionId' => $section->id, 'typeId' => $entryType->id, 'title' => 'Fresh']);
        expect(Drafts::saveElementAsDraft($entry, User::first()->id, markAsSaved: false))->toBeTrue();

        $nested = createNestedEntry($entry, $field, $nestedEntryType, 'Added');
        $draft = ownerForSite($entry, $this->primarySiteId, drafts: true);
        $draft->setFieldValue('body', siteBody('Intro', $nested->id));
        $draft->propagateAll = true;
        expect(Elements::saveElement($draft))->toBeTrue();

        // The editor only posts changed values, so the next autosave doesn’t include the field
        $draft = ownerForSite($entry, $this->primarySiteId, drafts: true);
        $draft->title = 'Fresh (edited)';
        $draft->propagateAll = true;
        expect(Elements::saveElement($draft))->toBeTrue();

        // Neither does the full save
        $draft = ownerForSite($entry, $this->primarySiteId, drafts: true);
        $draft->propagateAll = true;
        $owner = Drafts::applyDraft($draft);

        foreach ([$this->primarySiteId, $this->secondSiteId] as $siteId) {
            $entryIds = siteEntryIds($owner, $siteId);
            $ownedIds = Entry::find()->ownerId($owner->id)->fieldId($field->id)->siteId($siteId)->status(null)->ids();

            expect($entryIds)->toHaveCount(1)
                ->and($ownedIds)->toBe($entryIds)
                ->and(siteNestedEntry($entryIds[0], $siteId)?->title)->toBe('Added');
        }

        expect(siteEntryIds($owner, $this->secondSiteId))->not->toBe([$nested->id]);
    });
});
