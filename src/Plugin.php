<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace CraftCms\Ckeditor;

use CraftCms\Ckeditor\Console\Commands\ConvertMatrixCommand;
use CraftCms\Ckeditor\Console\Commands\ConvertRedactorCommand;
use CraftCms\Ckeditor\Support\CkeditorAssets;
use CraftCms\Ckeditor\Ui\Controls\CkeditorControl;
use CraftCms\Ckeditor\Ui\Controls\EditorConfigControl;
use CraftCms\Cms\Cp\SelectOptions;
use CraftCms\Cms\Field\NestedEntryFieldTypes;
use CraftCms\Cms\Plugin\Plugin as BasePlugin;
use CraftCms\Cms\Plugin\PluginSettings;
use CraftCms\Cms\Ui\Controls\Text;
use CraftCms\Cms\Ui\Nodes\Field as UiField;
use CraftCms\Cms\Ui\Ui;
use CraftCms\Cms\Ui\UiContext;
use CraftCms\Cms\Ui\UiControlTypes;
use Override;

use function CraftCms\Cms\t;

/**
 * CKEditor plugin.
 *
 * @method static Plugin getInstance()
 * @method Settings getSettings()
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 */
class Plugin extends BasePlugin
{
    public string $schemaVersion = '6.0.0.0';
    public string $minVersionRequired = '5.9.0';
    public bool $hasCpSettings = true;
    protected array $fieldTypes = [Field::class];
    protected array $commands = [
        ConvertMatrixCommand::class,
        ConvertRedactorCommand::class,
    ];
    protected array $publishables = [
        __DIR__ . '/../resources/assets/ckeditor/dist' => 'ckeditor',
        __DIR__ . '/../resources/assets/fieldsettings/dist' => 'fieldsettings',
    ];
    protected array $vite = [
        'resources/js/cp.ts',
    ];

    /**
     * Boots the plugin.
     */
    public function boot(NestedEntryFieldTypes $nestedEntryFieldTypes, UiControlTypes $controlTypes): void
    {
        $nestedEntryFieldTypes->register(Field::class);
        $controlTypes->register(CkeditorControl::class, EditorConfigControl::class);
        $this->app->bind(Settings::class, fn() => $this->getSettings());

        if (request()->isCpRequest() && !app()->runningInConsole()) {
            // Wait until all plugins have booted, so packages registered from their boot() methods are included
            $this->app->booted(fn() => $this->app->make(CkeditorAssets::class)->registerImportMap());
        }
    }

    #[Override]
    protected static function createSettings(): ?PluginSettings
    {
        return new Settings();
    }

    #[Override]
    public function settingsUi(UiContext $context = new UiContext()): ?Ui
    {
        return Ui::make([
            UiField::make(t('License Key', category: 'ckeditor'), Text::make('licenseKey')
                ->placeholder('GPL')
                ->monospace()
                ->textExpanderTriggers(SelectOptions::getEnvTextExpanderTriggers()))
                ->instructions(t('A commercial CKEditor license key. If left blank, CKEditor will be used under the GPL license.', category: 'ckeditor'))
                ->tip(t('This can be set to an environment variable.', category: 'ckeditor')),
        ]);
    }
}
