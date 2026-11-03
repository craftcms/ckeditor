<?php

declare(strict_types=1);

use CraftCms\Ckeditor\Support\CkeditorConfig;

// CkeditorConfig keeps its registry in static properties, so restore them after each test.
beforeEach(function () {
    $this->ckeditorConfigState = collect(['pluginsByPackage', 'pluginButtonMap', 'toolbarItems'])
        ->mapWithKeys(fn (string $property) => [$property => new ReflectionProperty(CkeditorConfig::class, $property)->getValue()])
        ->all();
});

afterEach(function () {
    foreach ($this->ckeditorConfigState as $property => $value) {
        new ReflectionProperty(CkeditorConfig::class, $property)->setValue(null, $value);
    }
});

it('provides the core packages by default', function () {
    expect(CkeditorConfig::getPluginPackages())->toBe(['ckeditor5', '@craftcms/ckeditor'])
        ->and(CkeditorConfig::getPluginsByPackage('ckeditor5'))->toContain('Bold', 'Paragraph')
        ->and(CkeditorConfig::getPluginsByPackage('@craftcms/ckeditor'))->toContain('CraftLink', 'CraftEntries')
        ->and(CkeditorConfig::getPluginsByPackage('unknown'))->toBe([])
        ->and(CkeditorConfig::getAllPlugins())->toContain('Bold', 'CraftLink');
});

it('registers a third-party package', function () {
    CkeditorConfig::registerPackage('@acme/tokens', [
        'plugins' => ['Tokens'],
        'toolbarItems' => ['tokens'],
    ]);

    expect(CkeditorConfig::getPluginPackages())->toContain('@acme/tokens')
        ->and(CkeditorConfig::getPluginsByPackage('@acme/tokens'))->toBe(['Tokens'])
        ->and(CkeditorConfig::getAllPlugins())->toContain('Tokens')
        ->and(CkeditorConfig::getToolbarItems())->toContain('tokens')
        ->and(CkeditorConfig::$pluginButtonMap)->toContain([
            'package' => '@acme/tokens',
            'plugins' => ['Tokens'],
            'buttons' => ['tokens'],
        ]);
});

it('merges plugins when a package is registered more than once', function () {
    CkeditorConfig::registerPackage('@acme/tokens', ['plugins' => ['Tokens'], 'toolbarItems' => ['tokens']]);
    CkeditorConfig::registerPackage('@acme/tokens', ['plugins' => ['Tokens', 'TokenPicker'], 'toolbarItems' => ['tokens']]);

    $toolbarItems = array_filter(CkeditorConfig::getToolbarItems(), fn ($item) => $item === 'tokens');

    expect(CkeditorConfig::getPluginsByPackage('@acme/tokens'))->toBe(['Tokens', 'TokenPicker'])
        ->and($toolbarItems)->toHaveCount(1);
});

it('registers first-party plugins under the ckeditor5 package', function () {
    CkeditorConfig::registerFirstPartyPackage(['Highlight'], ['highlight']);

    expect(CkeditorConfig::getPluginsByPackage('ckeditor5'))->toContain('Highlight')
        ->and(CkeditorConfig::getToolbarItems())->toContain('highlight');
});

it('normalizes toolbar items', function () {
    expect(CkeditorConfig::normalizeToolbarItems([
        'bold',
        ['outdent', 'indent'],
        ['button' => 'heading', 'configOption' => 'heading'],
    ]))->toBe([
        [['button' => 'bold']],
        [['button' => 'outdent'], ['button' => 'indent']],
        [['button' => 'heading', 'configOption' => 'heading']],
    ]);
});

it('builds import statements for every package', function () {
    CkeditorConfig::registerPackage('@acme/tokens', ['plugins' => ['Tokens']]);

    expect(CkeditorConfig::getImportStatements('@acme/tokens'))->toBe('import { Tokens } from "@acme/tokens";')
        ->and(CkeditorConfig::getImportStatements())->toContain(
            'from "ckeditor5";',
            'from "@craftcms/ckeditor";',
            'import { Tokens } from "@acme/tokens";',
        );
});

it('imports every plugin when no toolbar is given', function () {
    [$statements, $references, $namespaces] = CkeditorConfig::getImports();

    expect($namespaces)->toBe(['ckeditor5', '@craftcms/ckeditor'])
        ->and($statements)->toContain('from "ckeditor5";', 'from "@craftcms/ckeditor";')
        ->and($references)->toContain('Bold', 'Table', 'CraftLink');
});

it('only references the plugins the toolbar needs', function () {
    [$statements, $references] = CkeditorConfig::getImports(['bold', 'link']);

    expect($references)->toContain('Bold', 'CraftLink', 'LinkEditing', 'Paragraph')
        ->not->toContain('Italic', 'Table', 'CraftEntries')
        // Core packages are imported in full, so custom config JS can still use any of their plugins
        ->and($statements)->toContain('Italic');
});

it('leaves out removed plugins', function () {
    [, $references] = CkeditorConfig::getImports(['bold'], ['Bold']);

    expect($references)->not->toContain('Bold');
});

it('references third-party plugins through a namespace import', function () {
    CkeditorConfig::registerPackage('@acme/tokens', ['plugins' => ['Tokens'], 'toolbarItems' => ['tokens']]);

    [$statements, $references, $namespaces] = CkeditorConfig::getImports(['tokens']);

    expect($statements)->toContain('import * as __ckePackage0 from "@acme/tokens";')
        ->and($references)->toContain('__ckePackage0.Tokens')
        ->and($namespaces)->toContain('@acme/tokens');
});

it('skips third-party packages the toolbar does not use', function () {
    CkeditorConfig::registerPackage('@acme/tokens', ['plugins' => ['Tokens'], 'toolbarItems' => ['tokens']]);

    [$statements, $references, $namespaces] = CkeditorConfig::getImports(['bold']);

    expect($statements)->not->toContain('@acme/tokens')
        ->and($references)->not->toContain('__ckePackage0.Tokens')
        ->and($namespaces)->not->toContain('@acme/tokens');
});

it('imports third-party plugins that the config JS refers to by name', function () {
    CkeditorConfig::registerPackage('@acme/tokens', ['plugins' => ['Tokens'], 'toolbarItems' => ['tokens']]);

    [$statements, , $namespaces] = CkeditorConfig::getImports(['bold'], [], 'return { extraPlugins: [Tokens] };');

    expect($statements)->toContain('import {Tokens} from "@acme/tokens";')
        ->and($namespaces)->toContain('@acme/tokens');
});

it('ignores plugin names in strings and property names within config JS', function (string $configJs) {
    CkeditorConfig::registerPackage('@acme/tokens', ['plugins' => ['Tokens'], 'toolbarItems' => ['tokens']]);

    [$statements] = CkeditorConfig::getImports(['bold'], [], $configJs);

    expect($statements)->not->toContain('@acme/tokens');
})->with([
    'string' => "return { removePlugins: ['Tokens'] };",
    'property' => 'return { foo: config.Tokens };',
]);

it('does not import plugin names that more than one package provides', function () {
    CkeditorConfig::registerPackage('@acme/tokens', ['plugins' => ['Tokens'], 'toolbarItems' => ['tokens']]);
    CkeditorConfig::registerPackage('@other/tokens', ['plugins' => ['Tokens'], 'toolbarItems' => ['otherTokens']]);

    [$statements] = CkeditorConfig::getImports(['bold'], [], 'return { extraPlugins: [Tokens] };');

    expect($statements)->not->toContain('import {Tokens}');
});

it('returns the advanced link options', function () {
    $options = CkeditorConfig::advanceLinkOptions();

    expect(array_column($options, 'value'))->toBe([
        'urlSuffix',
        'target',
        'title',
        'class',
        'id',
        'rel',
        'ariaLabel',
        'download',
    ])->and($options)->each->toHaveKeys(['label', 'value', 'conversion']);
});
