<?php

declare(strict_types=1);

use CraftCms\Ckeditor\Support\CkeditorConfigSchema;

it('creates a JSON schema rooted at EditorConfig', function () {
    $schema = CkeditorConfigSchema::create();

    expect($schema['$ref'])->toBe('#/$defs/EditorConfig')
        ->and($schema['$defs'])->toHaveKey('EditorConfig')
        ->and($schema['$defs']['AlignmentConfig']['title'])->toBe('AlignmentConfig')
        ->and($schema['$defs']['AlignmentConfig']['type'])->toBe('object');
});

it('replaces every interface with a resolvable $ref', function () {
    $schema = CkeditorConfigSchema::create();
    $refs = [];

    array_walk_recursive($schema, function ($value, $key) use (&$refs) {
        expect($key)->not->toBe('interface');

        if ($key === '$ref') {
            $refs[] = $value;
        }
    });

    expect($refs)->not->toBeEmpty();

    foreach (array_unique($refs) as $ref) {
        expect($schema['$defs'])->toHaveKey(str_replace('#/$defs/', '', $ref));
    }
});
