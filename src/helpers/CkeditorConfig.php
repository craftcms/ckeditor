<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace craft\ckeditor\helpers;

use Craft;
use craft\ckeditor\Plugin;
use craft\helpers\Json;
use Illuminate\Support\Collection;

/**
 * CKEditor Config Helper.
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 * @since 5.0.0
 */
final class CkeditorConfig
{
    /**
     * @see self::registerPackage()
     * @see self::registerFirstPartyPackage()
     * @var array|array[] plugins registered keyed by the package namespace
     */
    private static array $pluginsByPackage = [
        'ckeditor5' => [
            'Bookmark',
            'Paragraph',
            'SelectAll',
            'Clipboard',
            'Alignment',
            'AutoImage',
            'AutoLink',
            'Autoformat',
            'BlockQuote',
            'Bold',
            'Code',
            'CodeBlock',
            'List',
            'ListProperties',
            'Essentials',
            'FindAndReplace',
            'Font',
            'Fullscreen',
            'GeneralHtmlSupport',
            'Heading',
            'HorizontalLine',
            'HtmlComment',
            'HtmlEmbed',
            'Image',
            'ImageCaption',
            'ImageStyle',
            'ImageToolbar',
            'Indent',
            'IndentBlock',
            'Italic',
            'LinkEditing',
            'LinkImage',
            'MediaEmbed',
            'MediaEmbedToolbar',
            'PageBreak',
            'PasteFromOffice',
            'RemoveFormat',
            'SourceEditing',
            'Strikethrough',
            'Style',
            'Subscript',
            'Superscript',
            'Table',
            'TableCaption',
            'TableCellProperties',
            'TableProperties',
            'TableToolbar',
            'TableUI',
            'TextPartLanguage',
            'TodoList',
            'Underline',
            'WordCount',
        ],
        '@craftcms/ckeditor' => [
            'CraftImageTextAlternativeUI',
            'CraftImageInsertUI',
            'ImageTransform',
            'ImageEditor',
            'CraftLink',
            'CraftEntries',
        ],
    ];

    /**
     * Maps toolbar items to plugins so can only load applicable plugins when we render a field.
     *
     * Items registered via [[registerPackage()]] also have a `package` key, limiting them to plugins from that package.
     *
     * @var array
     */
    public static array $pluginButtonMap = [
        ['plugins' => ['Alignment'], 'buttons' => ['alignment']],
        [
            'plugins' => [
                'AutoImage',
                'CraftEntries',
                'CraftImageInsertUI',
                'CraftImageTextAlternativeUI',
                'Image',
                'ImageCaption',
                'ImageStyle',
                'ImageToolbar',
                'ImageTransform',
                'ImageEditor',
                'LinkImage',
            ],
            'buttons' => ['createEntry', 'insertImage'],
        ],
        [
            'plugins' => ['AutoLink', 'CraftLink', 'LinkEditing', 'LinkImage'],
            'buttons' => ['link'],
        ],
        ['plugins' => ['BlockQuote'], 'buttons' => ['blockQuote']],
        ['plugins' => ['Bold'], 'buttons' => ['bold']],
        ['plugins' => ['Bookmark'], 'buttons' => ['bookmark']],
        ['plugins' => ['Code'], 'buttons' => ['code']],
        ['plugins' => ['CodeBlock'], 'buttons' => ['codeBlock']],
        [
            'plugins' => ['List', 'ListProperties'],
            'buttons' => ['bulletedList', 'numberedList'],
        ],
        [
            'plugins' => ['Font'],
            'buttons' => ['fontSize', 'fontFamily', 'fontColor', 'fontBackgroundColor'],
        ],
        ['plugins' => ['FindAndReplace'], 'buttons' => ['findAndReplace']],
        ['plugins' => ['Fullscreen'], 'buttons' => ['fullscreen']],
        ['plugins' => ['Heading'], 'buttons' => ['heading']],
        ['plugins' => ['HorizontalLine'], 'buttons' => ['horizontalLine']],
        ['plugins' => ['HtmlEmbed'], 'buttons' => ['htmlEmbed']],
        [
            'plugins' => ['Indent', 'IndentBlock'],
            'buttons' => ['outdent', 'indent'],
        ],
        ['plugins' => ['Italic'], 'buttons' => ['italic']],
        [
            'plugins' => ['MediaEmbed', 'MediaEmbedToolbar'],
            'buttons' => ['mediaEmbed'],
        ],
        ['plugins' => ['PageBreak'], 'buttons' => ['pageBreak']],
        ['plugins' => ['RemoveFormat'], 'buttons' => ['removeFormat']],
        ['plugins' => ['SourceEditing'], 'buttons' => ['sourceEditing']],
        ['plugins' => ['Strikethrough'], 'buttons' => ['strikethrough']],
        ['plugins' => ['Style'], 'buttons' => ['style']],
        ['plugins' => ['Subscript'], 'buttons' => ['subscript']],
        ['plugins' => ['Superscript'], 'buttons' => ['superscript']],
        [
            'plugins' => [
                'Table',
                'TableCaption',
                'TableCellProperties',
                'TableProperties',
                'TableToolbar',
                'TableUI',
            ],
            'buttons' => ['insertTable'],
        ],
        ['plugins' => ['TextPartLanguage'], 'buttons' => ['textPartLanguage']],
        ['plugins' => ['TodoList'], 'buttons' => ['todoList']],
        ['plugins' => ['Underline'], 'buttons' => ['underline']],
    ];

    public static array $toolbarItems = [
        ['button' => 'heading', 'configOption' => 'heading'],
        ['button' => 'style', 'configOption' => 'style'],
        ['button' => 'alignment', 'configOption' => 'alignment'],
        'bold',
        'italic',
        'underline',
        'strikethrough',
        'subscript',
        'superscript',
        'code',
        'link',
        'bookmark',
        'textPartLanguage',
        ['button' => 'fontSize', 'configOption' => 'fontSize'],
        'fontFamily',
        'fontColor',
        'fontBackgroundColor',
        'insertImage',
        'mediaEmbed',
        'htmlEmbed',
        'blockQuote',
        'insertTable',
        'codeBlock',
        'bulletedList',
        'numberedList',
        'todoList',
        ['outdent', 'indent'],
        'horizontalLine',
        'pageBreak',
        'removeFormat',
        'selectAll',
        'findAndReplace',
        ['undo', 'redo'],
        'sourceEditing',
        'createEntry',
        ['button' => 'fullscreen', 'configOption' => 'fullscreen'],
    ];


    /**
     * Package namespaces provided by CKEditor and Craft.
     *
     * Their plugins are imported by name, so custom config JS can reference them directly.
     */
    private const CORE_PACKAGES = ['ckeditor5', '@craftcms/ckeditor'];

    /**
     * Register a custom CKEditor plugin
     *
     * @param string $name the namespace of the plugin
     * @param array $config plugins and toolbar items created by the plugin
     * @return void
     */
    public static function registerPackage(string $name, array $config): void
    {
        $plugins = $config['plugins'] ?? [];
        $toolbarItems = $config['toolbarItems'] ?? [];

        if (!isset(self::$pluginsByPackage[$name])) {
            self::$pluginsByPackage[$name] = $plugins;
        } else {
            self::$pluginsByPackage[$name] = array_values(array_unique(array_merge(self::$pluginsByPackage[$name], $plugins)));
        }

        foreach ($toolbarItems as $toolbarItem) {
            if (!in_array($toolbarItem, self::$toolbarItems, true)) {
                self::$toolbarItems[] = $toolbarItem;
            }
        }

        $mapItem = [
            'package' => $name,
            'plugins' => $plugins,
            'buttons' => self::buttonNames($toolbarItems),
        ];
        if (!in_array($mapItem, self::$pluginButtonMap, true)) {
            self::$pluginButtonMap[] = $mapItem;
        }
    }

    /**
     * Register a first party plugin
     *
     * @param array $pluginNames plugins to register
     * @param array $toolbarItems toolbar items to add
     * @return void
     */
    public static function registerFirstPartyPackage(array $pluginNames, array $toolbarItems = []): void
    {
        self::registerPackage('ckeditor5', ['plugins' => $pluginNames, 'toolbarItems' => $toolbarItems]);
    }

    /**
     * Get all the package namespaces registered
     *
     * @return array
     */
    public static function getPluginPackages(): array
    {
        return array_keys(self::getPluginsByPackage());
    }

    /**
     * Get the plugins associated with a specific namespace
     *
     * @param string|null $name namespace of the package
     * @return array|array[]|string[] plugins registered from the package
     */
    public static function getPluginsByPackage(string $name = null): array
    {
        Plugin::getCkeditorPackages();

        if (!$name) {
            return self::$pluginsByPackage;
        }

        return self::$pluginsByPackage[$name] ?? [];
    }

    /**
     * Return all plugins, regardless of namespace
     *
     * @return array
     */
    public static function getAllPlugins(): array
    {
        return collect(self::getPluginsByPackage())
            ->flatten()
            ->toArray();
    }

    /**
     * Returns all available toolbar items.
     *
     * @return array
     * @internal
     */
    public static function getToolbarItems(): array
    {
        Plugin::getCkeditorPackages();
        return self::$toolbarItems;
    }

    /**
     * Get the JavaScript import statements for all plugins
     *
     * @param string|null $name namespace of the package
     * @return string
     * @deprecated in 5.8.0.
     */
    public static function getImportStatements(string $name = null): string
    {
        $plugins = $name ? [$name => self::getPluginsByPackage($name)] : self::getPluginsByPackage();

        return collect($plugins)
            ->reduce(function(Collection $carry, array $plugins, string $import) {
                $carry->push('import { ' . implode(', ', $plugins) . ' } from "' . $import . '";');

                return $carry;
            }, Collection::empty())->join("\n");
    }

    /**
     * Returns the JavaScript import statements for an editor, along with the JavaScript expressions that
     * reference each of its plugins.
     *
     * Plugins provided by CKEditor and Craft are imported by name. Plugins provided by other packages are
     * referenced through a namespace import, so plugin names can’t collide across packages, and those packages
     * aren’t imported at all if none of their plugins are needed.
     *
     * @param string[]|null $toolbar The editor’s toolbar items, or `null` to import every registered plugin
     * @param string[] $removePlugins Plugin names that should be left out
     * @return array{0:string,1:string[],2:string[]} The import statements, the plugin references, and the
     * namespaces of the packages that have plugins in use
     * @internal
     */
    public static function getImports(?array $toolbar = null, array $removePlugins = []): array
    {
        $allPluginsByPackage = self::getPluginsByPackage();
        $pluginsByPackage = $toolbar !== null
            ? self::pluginsForToolbar($toolbar, $removePlugins)
            : $allPluginsByPackage;
        $namespaces = array_keys($pluginsByPackage);

        $statements = [];
        $references = [];
        $i = 0;

        // Core packages are always imported
        foreach (self::CORE_PACKAGES as $namespace) {
            $pluginsByPackage[$namespace] ??= [];
        }

        foreach ($pluginsByPackage as $namespace => $plugins) {
            $isCorePackage = in_array($namespace, self::CORE_PACKAGES, true);

            if (empty($plugins) && !$isCorePackage) {
                continue;
            }

            $namespaceJs = Json::encode($namespace, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

            if ($isCorePackage) {
                // These are loaded regardless, so import everything to keep it available to custom config JS
                $allPlugins = $allPluginsByPackage[$namespace] ?? $plugins;
                if (empty($allPlugins)) {
                    continue;
                }
                $statements[] = sprintf('import {%s} from %s;', implode(', ', $allPlugins), $namespaceJs);
                array_push($references, ...array_values($plugins));
            } else {
                $alias = '__ckePackage' . $i++;
                $statements[] = "import * as $alias from $namespaceJs;";
                foreach ($plugins as $plugin) {
                    $references[] = "$alias.$plugin";
                }
            }
        }

        return [implode("\n", $statements), $references, $namespaces];
    }

    /**
     * Returns the plugins that should be loaded for the given toolbar, indexed by package namespace.
     *
     * Plugins tied to toolbar buttons are left out if none of their buttons are in the toolbar. Packages
     * without any remaining plugins are left out entirely.
     *
     * @param string[] $toolbar The toolbar items
     * @param string[] $removePlugins Additional plugin names that should be left out
     * @return array<string,string[]>
     */
    private static function pluginsForToolbar(array $toolbar, array $removePlugins): array
    {
        Plugin::getCkeditorPackages();

        $unused = collect(self::$pluginButtonMap)
            ->filter(fn(array $item) =>
                // If there are no buttons defined, always load it
                !empty($item['buttons']) && empty(array_intersect($toolbar, $item['buttons'])))
            ->values();

        return collect(self::getPluginsByPackage())
            ->map(function(array $plugins, string $namespace) use ($unused, $removePlugins) {
                // Only remove unused plugins that belong to this package (or aren’t tied to one)
                $remove = $unused
                    ->filter(fn(array $item) => !isset($item['package']) || $item['package'] === $namespace)
                    ->flatMap(fn(array $item) => $item['plugins'] ?? [])
                    ->merge($removePlugins)
                    ->all();
                return array_values(array_diff($plugins, $remove));
            })
            ->filter()
            ->all();
    }

    /**
     * Returns the button names for the given toolbar items.
     *
     * @param array $toolbarItems
     * @return string[]
     */
    private static function buttonNames(array $toolbarItems): array
    {
        return collect($toolbarItems)
            ->flatMap(fn($item) => array_column(self::normalizeToolbarItem($item), 'button'))
            ->all();
    }

    private static function normalizeToolbarItem($item): array
    {
        if (is_string($item)) {
            return [
                ['button' => $item],
            ];
        }

        if (array_is_list($item)) {
            return collect($item)->map(fn($item) => ['button' => $item])->toArray();
        }

        return [$item];
    }

    /**
     * Normalizes toolbar items
     *
     * @param array $items toolbar items
     * @return array normalized toolbar items
     */
    public static function normalizeToolbarItems(array $items): array
    {
        return collect($items)
            ->map(fn($item) => self::normalizeToolbarItem($item))
            ->toArray();
    }

    /**
     * Returns the available advanced link
     *
     * @return array[]
     */
    public static function advanceLinkOptions(): array
    {
        return [
            [
                'label' => Craft::t('app', 'URL Suffix'),
                'value' => 'urlSuffix',
                'tooltip' => Craft::t('app', 'Query params (e.g. {ex1}) or a URI fragment (e.g. {ex2}) that should be appended to the URL.', [
                    'ex1' => '`?p1=foo&p2=bar`',
                    'ex2' => '`#anchor`',
                ]),
                'conversion' => null,
            ],
            [
                'label' => Craft::t('app', 'Open in new tab?'),
                'value' => 'target',
                'conversion' => [
                    'type' => 'bool',
                    'value' => '_blank',
                    'model' => 'craftTarget',
                    'view' => 'target',
                ],
            ],
            [
                'label' => Craft::t('app', 'Title Text'),
                'value' => 'title',
                'conversion' => [
                    'type' => 'string',
                    'model' => 'craftTitle',
                    'view' => 'title',
                ],
            ],
            [
                'label' => Craft::t('app', 'Class Name'),
                'value' => 'class',
                'tooltip' => 'Separate multiple values with spaces.',
                'conversion' => [
                    'type' => 'string',
                    'model' => 'craftClass',
                    'view' => 'class',
                ],
            ],
            [
                'label' => Craft::t('app', 'ID'),
                'value' => 'id',
                'conversion' => [
                    'type' => 'string',
                    'model' => 'craftId',
                    'view' => 'id',
                ],
            ],
            [
                'label' => Craft::t('app', 'Relation (rel)'),
                'value' => 'rel',
                'tooltip' => 'Separate multiple values with spaces.',
                'conversion' => [
                    'type' => 'string',
                    'model' => 'craftRel',
                    'view' => 'rel',
                ],
            ],
            [
                'label' => Craft::t('app', 'ARIA Label'),
                'value' => 'ariaLabel',
                'conversion' => [
                    'type' => 'string',
                    'model' => 'craftAriaLabel',
                    'view' => 'aria-label',
                ],
            ],
            [
                'label' => Craft::t('app', 'Download'),
                'value' => 'download',
                'conversion' => [
                    'type' => 'bool',
                    'value' => true,
                    'model' => 'craftDownload',
                    'view' => 'download',
                ],
            ],
        ];
    }
}
