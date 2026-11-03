<?php

declare(strict_types=1);

use CraftCms\Ckeditor\Field;
use CraftCms\Ckeditor\Plugin;
use CraftCms\Ckeditor\Settings;
use CraftCms\Ckeditor\Ui\Controls\CkeditorControl;
use CraftCms\Ckeditor\Ui\Controls\EditorConfigControl;
use CraftCms\Cms\Field\NestedEntryFieldTypes;
use CraftCms\Cms\Plugin\Plugins;
use CraftCms\Cms\Support\Facades\Fields;
use CraftCms\Cms\Ui\Ui;
use CraftCms\Cms\Ui\UiControlTypes;

it('installs and enables the plugin', function () {
    $plugins = app(Plugins::class);

    expect($plugins->getPlugin('ckeditor'))->toBeInstanceOf(Plugin::class)
        ->and($plugins->isPluginInstalled('ckeditor'))->toBeTrue()
        ->and($plugins->isPluginEnabled('ckeditor'))->toBeTrue();
});

it('registers the CKEditor field type', function () {
    expect(Fields::getAllFieldTypes())->toContain(Field::class)
        ->and(app(NestedEntryFieldTypes::class)->types())->toContain(Field::class);
});

it('registers its UI controls', function () {
    expect(app(UiControlTypes::class)->types())->toContain(CkeditorControl::class, EditorConfigControl::class);
});

it('binds its settings', function () {
    expect(app(Settings::class))->toBe(Plugin::getInstance()->getSettings());
});

it('provides a settings UI', function () {
    expect(Plugin::getInstance()->settingsUi())->toBeInstanceOf(Ui::class);
});

it('registers its console commands', function () {
    $this->artisan('list')
        ->expectsOutputToContain('ckeditor:convert:matrix')
        ->expectsOutputToContain('ckeditor:convert:redactor')
        ->assertSuccessful();
});
