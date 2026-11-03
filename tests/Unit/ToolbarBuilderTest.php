<?php

declare(strict_types=1);

use CraftCms\Ckeditor\Console\ToolbarBuilder;

it('adds buttons once, but allows repeated separators', function () {
    $toolbar = new ToolbarBuilder(['bold']);

    $toolbar->addButton('bold');
    $toolbar->addButton('|');
    $toolbar->addButton('italic');
    $toolbar->addButton('|');

    expect($toolbar->buttons)->toBe(['bold', '|', 'italic', '|']);
});

it('reports whether and where a button exists', function () {
    $toolbar = new ToolbarBuilder(['heading', 'bold']);

    expect($toolbar->hasButton('bold'))->toBeTrue()
        ->and($toolbar->hasButton('italic'))->toBeFalse()
        ->and($toolbar->getButtonPos('bold'))->toBe(1)
        ->and($toolbar->getButtonPos('italic'))->toBeFalse();
});

it('adds a button at a position', function () {
    $toolbar = new ToolbarBuilder(['heading', 'italic']);

    $toolbar->addButtonAt('bold', 1);
    $toolbar->addButtonAt('bold', 0);

    expect($toolbar->buttons)->toBe(['heading', 'bold', 'italic']);
});

it('adds a button before another one', function (array $buttons, array $expected) {
    $toolbar = new ToolbarBuilder($buttons);

    $toolbar->addButtonBefore('bold', 'italic');

    expect($toolbar->buttons)->toBe($expected);
})->with([
    'anchor exists' => [['heading', 'italic'], ['heading', 'bold', 'italic']],
    'anchor missing' => [['heading'], ['heading', 'bold']],
]);

it('adds a button after another one', function (array $buttons, array $expected) {
    $toolbar = new ToolbarBuilder($buttons);

    $toolbar->addButtonAfter('italic', 'bold');

    expect($toolbar->buttons)->toBe($expected);
})->with([
    'anchor exists' => [['bold', 'link'], ['bold', 'italic', 'link']],
    'anchor missing' => [['link'], ['link', 'italic']],
]);

it('removes buttons', function () {
    $toolbar = new ToolbarBuilder(['heading', 'bold', 'italic', 'link']);

    $toolbar->removeButton('bold');
    $toolbar->removeButton('missing');
    $toolbar->removeButtonAt(0);

    expect($toolbar->buttons)->toBe(['italic', 'link']);
});

it('replaces a button at a position', function () {
    $toolbar = new ToolbarBuilder(['bold', 'italic']);

    $toolbar->replaceButtonAt(1, 'underline');

    expect($toolbar->buttons)->toBe(['bold', 'underline']);
});

it('iterates over the buttons', function () {
    $toolbar = new ToolbarBuilder(['bold', 'italic']);

    expect(iterator_to_array($toolbar->getIterator()))->toBe(['bold', 'italic']);
});
