<?php

declare(strict_types=1);

use CraftCms\Cms\Edition;
use CraftCms\Cms\Entry\Elements\Entry;
use CraftCms\Cms\Support\Facades\Elements;
use CraftCms\Cms\User\Elements\User as UserElement;
use CraftCms\Cms\User\Models\User;

const ACTIONS = [
    'image-url',
    'entry-card-html',
    'field-value',
    'duplicate-nested-entry',
    'image-permissions',
    'image-alt',
    'render-element-with-supported-sites',
    'create-image-entry',
];

beforeEach(function () {
    [
        'field' => $this->field,
        'section' => $section,
        'entryType' => $this->entryType,
        'nestedEntryType' => $this->nestedEntryType,
    ] = createCkeditorSetup(withNestedEntries: true);

    $this->owner = createEntry($section, $this->entryType, '<p>Intro</p>');
    $this->nested = createNestedEntry($this->owner, $this->field, $this->nestedEntryType, 'A quote');
    $this->owner->setFieldValue('body', sprintf('<p>Intro</p><craft-entry data-entry-id="%s"></craft-entry>', $this->nested->id));
    Elements::saveElement($this->owner);

    $this->layoutElementUid = $this->entryType->getFieldLayout()->getCustomFieldElements()[0]->uid;
});

it('rejects guests', function (string $action) {
    $this->postJson(cpAction($action))->assertUnauthorized();
})->with(ACTIONS);

it('rejects users without control panel access', function (string $action) {
    // Solo edition only allows a single user
    Edition::set(Edition::Pro);

    $user = new UserElement(['username' => 'frontend', 'email' => 'frontend@example.com']);
    expect(Elements::saveElement($user))->toBeTrue();

    $this->actingAs(User::find($user->id), 'craft')
        ->postJson(cpAction($action))
        ->assertForbidden();
})->with(ACTIONS);

it('rejects site action requests', function () {
    $this->actingAs(User::first(), 'craft')
        ->postJson('/actions/ckeditor/ckeditor/field-value')
        ->assertUnauthorized()
        ->assertJson(['message' => 'Request must be a control panel request']);
});

describe('as an admin', function () {
    beforeEach(function () {
        $this->actingAs(User::first(), 'craft');
    });

    it('validates required params', function (string $action, array $fields) {
        $this->postJson(cpAction($action))->assertUnprocessable()->assertJsonValidationErrors($fields);
    })->with([
        'field-value' => ['field-value', ['ownerId', 'layoutElementUid']],
        'entry-card-html' => ['entry-card-html', ['entryId']],
        'duplicate-nested-entry' => ['duplicate-nested-entry', ['entryId']],
        'image-url' => ['image-url', ['assetId']],
    ]);

    it('returns the field value with nested entry cards', function () {
        $response = $this->postJson(cpAction('field-value'), [
            'ownerId' => $this->owner->id,
            'layoutElementUid' => $this->layoutElementUid,
        ])->assertOk();

        expect($response->json('value'))->toContain('<p>Intro</p>', sprintf('data-entry-id="%s"', $this->nested->id))
            ->and($response->json('cards'))->not->toBeEmpty();
    });

    it('rejects an invalid owner', function () {
        $this->postJson(cpAction('field-value'), [
            'ownerId' => 999999,
            'layoutElementUid' => $this->layoutElementUid,
        ])->assertBadRequest();
    });

    it('rejects an invalid layout element', function () {
        $this->postJson(cpAction('field-value'), [
            'ownerId' => $this->owner->id,
            'layoutElementUid' => 'invalid',
        ])->assertBadRequest();
    });

    it('returns a nested entry’s card HTML', function () {
        $response = $this->postJson(cpAction('entry-card-html'), [
            'entryId' => $this->nested->id,
            'layoutElementUid' => $this->layoutElementUid,
        ])->assertOk();

        expect($response->json('cardHtml'))->toContain('A quote')
            ->and($response->json())->toHaveKeys(['headHtml', 'bodyHtml']);
    });

    it('rejects card HTML for an invalid entry', function () {
        $this->postJson(cpAction('entry-card-html'), ['entryId' => 999999])->assertBadRequest();
    });

    it('duplicates a nested entry', function () {
        $response = $this->postJson(cpAction('duplicate-nested-entry'), [
            'entryId' => $this->nested->id,
            'targetLayoutElementUid' => $this->layoutElementUid,
        ])->assertOk();

        $duplicate = Entry::find()->id($response->json('newEntryId'))->status(null)->one();

        expect($duplicate)->not->toBeNull()
            ->and($duplicate->id)->not->toBe($this->nested->id)
            ->and($duplicate->title)->toBe('A quote')
            ->and($duplicate->fieldId)->toBe($this->field->id)
            ->and($duplicate->primaryOwnerId)->toBe($this->owner->id)
            ->and($response->json('cardHtml'))->toContain('A quote');
    });

    it('refuses to duplicate into a field that doesn’t allow the entry type', function () {
        $this->postJson(cpAction('duplicate-nested-entry'), [
            'entryId' => $this->nested->id,
            'targetEntryTypeIds' => [999999],
        ])->assertBadRequest();
    });

    it('rejects duplicating an entry that isn’t nested', function () {
        $this->postJson(cpAction('duplicate-nested-entry'), ['entryId' => $this->owner->id])
            ->assertBadRequest()
            ->assertJson(['message' => "Entry {$this->owner->id} isn’t a nested entry."]);
    });

    it('rejects duplicating into an invalid owner', function () {
        $this->postJson(cpAction('duplicate-nested-entry'), [
            'entryId' => $this->nested->id,
            'targetOwnerId' => 999999,
        ])->assertBadRequest()->assertJson(['message' => 'Invalid owner.']);
    });

    it('rejects an invalid entry ID', function () {
        $this->postJson(cpAction('duplicate-nested-entry'), ['entryId' => 999999])
            ->assertBadRequest()
            ->assertJson(['message' => 'Invalid entry ID: 999999']);
    });
});
