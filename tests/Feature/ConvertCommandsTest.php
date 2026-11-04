<?php

declare(strict_types=1);

use CraftCms\Cms\Field\PlainText;
use CraftCms\Cms\Support\Facades\Fields;

it('requires an interactive terminal', function (string $command, array $arguments) {
    $this->artisan($command, [...$arguments, '--no-interaction' => true])
        ->expectsOutputToContain('This command must be run interactively.')
        ->assertFailed();
})->with([
    'matrix' => ['ckeditor:convert:matrix', ['fieldHandle' => 'body']],
    'redactor' => ['ckeditor:convert:redactor', []],
]);

it('reports when there are no Redactor fields to convert', function () {
    $this->artisan('ckeditor:convert:redactor')
        ->expectsOutputToContain('No Redactor fields found.')
        ->assertSuccessful();
});

it('rejects an unknown field handle', function () {
    $this->artisan('ckeditor:convert:matrix', ['fieldHandle' => 'missing'])
        ->expectsOutputToContain('Invalid field handle: missing')
        ->assertFailed();
});

it('rejects fields that aren’t Matrix fields', function () {
    Fields::saveField(Fields::createField([
        'type' => PlainText::class,
        'name' => 'Summary',
        'handle' => 'summary',
    ]));

    $this->artisan('ckeditor:convert:matrix', ['fieldHandle' => 'summary'])
        ->expectsOutputToContain('“Summary” is not a Matrix field.')
        ->assertFailed();
});
