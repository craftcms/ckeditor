<?php

declare(strict_types=1);

use CraftCms\Cms\Gql\Data\GqlSchema;
use CraftCms\Cms\Gql\Gql;
use CraftCms\Cms\Gql\GqlHelper;
use CraftCms\Cms\Support\Facades\Elements;

beforeEach(function () {
    [
        'field' => $field,
        'section' => $section,
        'entryType' => $entryType,
        'nestedEntryType' => $nestedEntryType,
    ] = createCkeditorSetup(withNestedEntries: true);

    $this->owner = createEntry($section, $entryType, '<p>Intro</p>');
    $nested = createNestedEntry($this->owner, $field, $nestedEntryType, 'A quote');
    $this->owner->setFieldValue('body', sprintf('<h2>Hello</h2><p>Some <strong>bold</strong> text</p><craft-entry data-entry-id="%s"></craft-entry>', $nested->id));
    Elements::saveElement($this->owner);

    $this->schema = new GqlSchema(['name' => 'Full access', 'scope' => GqlHelper::createFullAccessSchema()->scope]);
    app(Gql::class)->flushCaches();
});

function queryBody(GqlSchema $schema, int $id, string $selection): array
{
    $result = app(Gql::class)->executeQuery($schema, sprintf('{ entry(id: %s) { ... on page_Entry { body { %s } } } }', $id, $selection));

    expect($result)->not->toHaveKey('errors');

    return $result['data']['entry']['body'];
}

it('returns the field’s HTML, Markdown and plain text', function () {
    $body = queryBody($this->schema, $this->owner->id, 'html markdown plainText');

    expect($body['html'])->toStartWith('<h2>Hello</h2><p>Some <strong>bold</strong> text</p>')
        ->and($body['markdown'])->toStartWith("## Hello\n\nSome **bold** text")
        ->and($body['plainText'])->toContain('Hello', 'Some bold text');
});

it('returns the field’s chunks', function () {
    $body = queryBody($this->schema, $this->owner->id, 'chunks { __typename ... on CkeditorMarkup { html } ... on quote_Entry { title } }');

    expect($body['chunks'])->toHaveCount(2)
        ->and($body['chunks'][0]['html'])->toBe('<h2>Hello</h2><p>Some <strong>bold</strong> text</p>')
        ->and($body['chunks'][1]['title'])->toBe('A quote');
});
