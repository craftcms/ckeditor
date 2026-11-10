<?php

declare(strict_types=1);

use CraftCms\Ckeditor\Data\Markup;

it('exposes its type and HTML', function () {
    $markup = new Markup('<p>Hello <strong>world</strong></p>', 1);

    expect($markup->getType())->toBe('markup')
        ->and($markup->type)->toBe('markup')
        ->and($markup->getHtml())->toBe('<p>Hello <strong>world</strong></p>')
        ->and($markup->html)->toBe('<p>Hello <strong>world</strong></p>')
        ->and((string) $markup)->toBe('<p>Hello <strong>world</strong></p>')
        ->and(isset($markup->type, $markup->html))->toBeTrue()
        ->and(isset($markup->foo))->toBeFalse();
});

it('throws when getting an unknown property', function () {
    new Markup('<p>Hello</p>', 1)->foo;
})->throws(LogicException::class);

it('converts to Markdown', function () {
    $markup = new Markup('<h2>Title</h2><p>Hello <strong>world</strong></p>', 1);

    expect($markup->getMarkdown())->toBe("## Title\n\nHello **world**");
});

it('converts to plain text', function () {
    $markup = new Markup('<p>Hello <a href="https://craftcms.com">world</a></p>', 1);

    expect($markup->getPlainText())->toBe('Hello world');
});
