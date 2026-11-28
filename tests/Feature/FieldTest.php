<?php

declare(strict_types=1);

use CraftCms\Ckeditor\Data\FieldData;
use CraftCms\Ckeditor\Events\HtmlSanitizerConfigResolving;
use CraftCms\Cms\Entry\Elements\Entry;
use CraftCms\Cms\Support\Facades\Elements;
use CraftCms\Cms\Support\Facades\HtmlSanitizers;
use Illuminate\Support\Facades\Event;

it('normalizes values to field data', function () {
    $field = createCkeditorField();

    $value = $field->normalizeValue('<p>Hello</p>');

    expect($value)->toBeInstanceOf(FieldData::class)
        ->and($value->getRawContent())->toBe('<p>Hello</p>')
        ->and((string) $value)->toBe('<p>Hello</p>');
});

it('serializes empty values as null', function (mixed $value) {
    expect(createCkeditorField()->serializeValue($value, null))->toBeNull();
})->with([
    'null' => null,
    'empty string' => '',
]);

it('round-trips content through an entry', function () {
    ['section' => $section, 'entryType' => $entryType] = createCkeditorSetup();

    $entry = createEntry($section, $entryType, '<h2>Title</h2><p>Hello <strong>world</strong></p>');

    expect((string) $entry->getFieldValue('body'))->toBe('<h2>Title</h2><p>Hello <strong>world</strong></p>');
});

it('sanitizes unsafe HTML', function () {
    $field = createCkeditorField();

    $serialized = $field->serializeValue('<p onclick="alert(1)">Hello</p><script>alert(1)</script>', null);

    expect($serialized)->toBe('<p>Hello</p>');
});

it('keeps the attributes CKEditor needs', function () {
    $field = createCkeditorField(['toolbar' => ['bulletedList', 'numberedList', 'link']]);

    $html = '<ol start="3" reversed><li data-list-item-id="a1">One</li></ol><p><a href="https://craftcms.com" target="_blank" rel="noopener" class="btn">Link</a></p>';

    expect($field->serializeValue($html, null))->toContain(
        'start="3"',
        'reversed',
        'data-list-item-id="a1"',
        'target="_blank"',
        'rel="noopener"',
        'class="btn"',
    );
});

it('keeps inline styles', function (array $toolbar) {
    $field = createCkeditorField(['toolbar' => $toolbar]);

    $html = '<h2 style="text-align:right;">Title</h2>'.
        '<p style="text-align:center;">Hello <span style="color:#ff0000;">world</span></p>'.
        '<ol style="list-style-type:upper-roman;"><li style="text-align:center;">One</li></ol>'.
        '<ul style="list-style-type:square;"><li>Two</li></ul>';

    expect($field->serializeValue($html, null))->toContain(
        '<h2 style="text-align:right;">',
        '<p style="text-align:center;">',
        '<span style="color:#ff0000;">',
        '<li style="text-align:center;">',
    );
})->with([
    'without list buttons' => [['alignment', 'fontColor']],
    'with list buttons' => [['alignment', 'fontColor', 'bulletedList', 'numberedList']],
]);

it('keeps list styles when both list buttons are enabled', function () {
    $field = createCkeditorField(['toolbar' => ['bulletedList', 'numberedList']]);

    $html = '<ol style="list-style-type:upper-roman;"><li>One</li></ol><ul style="list-style-type:square;"><li>Two</li></ul>';

    expect($field->serializeValue($html, null))->toBe($html);
});

it('only allows nested entry tags when the field can create entries', function (array $toolbar, bool $allowed) {
    $field = createCkeditorField(['toolbar' => $toolbar]);

    $serialized = $field->serializeValue('<p>Hello</p><craft-entry data-entry-id="1"></craft-entry>', null);

    expect(str_contains($serialized, '<craft-entry data-entry-id="1">'))->toBe($allowed);
})->with([
    'with createEntry' => [['bold', 'createEntry'], true],
    'without createEntry' => [['bold'], false],
]);

it('lets plugins modify the HTML sanitizer config', function () {
    Event::listen(function (HtmlSanitizerConfigResolving $event) {
        $event->config = $event->config->allowElement('mark');
    });

    $field = createCkeditorField();

    expect($field->serializeValue('<p><mark>Hello</mark></p>', null))->toBe('<p><mark>Hello</mark></p>');
});

it('extends named sanitizers with the markup CKEditor needs', function () {
    HtmlSanitizers::extend('strict', ['allow_elements' => ['p' => [], 'ul' => [], 'li' => []]]);

    $dispatched = false;
    Event::listen(function (HtmlSanitizerConfigResolving $event) use (&$dispatched) {
        $dispatched = true;
    });

    $field = createCkeditorField([
        'toolbar' => ['bulletedList', 'createEntry'],
        'htmlSanitizer' => 'strict',
    ]);

    $html = '<p>Hello</p><ul><li data-list-item-id="a1">One</li></ul><craft-entry data-entry-id="1"></craft-entry>';

    expect($field->serializeValue($html, null))->toBe($html)
        ->and($dispatched)->toBeTrue();
});

it('preserves page breaks', function () {
    $field = createCkeditorField(['toolbar' => ['pageBreak']]);

    $html = '<p>One</p><div class="page-break" style="page-break-after:always;"><span style="display:none;">&nbsp;</span></div><p>Two</p>';

    expect($field->serializeValue($html, null))->toBe($html);
});

it('saves nested entries with their owner', function () {
    [
        'field' => $field,
        'section' => $section,
        'entryType' => $entryType,
        'nestedEntryType' => $nestedEntryType,
    ] = createCkeditorSetup(withNestedEntries: true);

    $owner = createEntry($section, $entryType, '<p>Intro</p>');
    $nested = createNestedEntry($owner, $field, $nestedEntryType, 'A quote');

    $owner->setFieldValue('body', sprintf('<p>Intro</p><craft-entry data-entry-id="%s"></craft-entry>', $nested->id));
    expect(Elements::saveElement($owner))->toBeTrue();

    $nested = Entry::find()->id($nested->id)->status(null)->one();

    expect($nested->fieldId)->toBe($field->id)
        ->and($nested->primaryOwnerId)->toBe($owner->id)
        ->and($nested->getOwner()->id)->toBe($owner->id);
});

it('deletes nested entries along with their owner', function () {
    [
        'field' => $field,
        'section' => $section,
        'entryType' => $entryType,
        'nestedEntryType' => $nestedEntryType,
    ] = createCkeditorSetup(withNestedEntries: true);

    $owner = createEntry($section, $entryType, '<p>Intro</p>');
    $nested = createNestedEntry($owner, $field, $nestedEntryType, 'A quote');
    $owner->setFieldValue('body', sprintf('<craft-entry data-entry-id="%s"></craft-entry>', $nested->id));
    Elements::saveElement($owner);

    expect(Elements::deleteElement($owner))->toBeTrue()
        ->and(Entry::find()->id($nested->id)->status(null)->exists())->toBeFalse();
});
