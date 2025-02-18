<?php

namespace craft\ckeditor\helpers;

use Illuminate\Support\Collection;

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
            'CraftImageInsertUI',
            'ImageTransform',
            'ImageEditor',
            'CraftLinkUI',
            'CraftEntries',
        ],
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
    ];


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

        if (!isset(self::$pluginsByPackage[$name])) {
            self::$pluginsByPackage[$name] = $plugins;
        } else {
            self::$pluginsByPackage[$name] = array_merge(self::$pluginsByPackage[$name], $plugins);
        }

        self::$toolbarItems[] = $config['toolbarItems'] ?? [];
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
        return array_keys(self::$pluginsByPackage);
    }

    /**
     * Get the plugins associated with a specific namespace
     *
     * @param string|null $name namespace of the package
     * @return array|array[]|string[] plugins registered from the package
     */
    public static function getPluginsByPackage(string $name = null): array
    {
        if (!$name) {
            return self::$pluginsByPackage;
        }

        if (!in_array($name, self::getPluginPackages())) {
            return [];
        }

        return self::$pluginsByPackage[$name];
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
     * Get the JavaScript import statements for all plugins
     *
     * @param string|null $name namespace of the package
     * @return string
     */
    public static function getImportStatements(string $name = null): string
    {
        return collect(self::getPluginsByPackage($name))
            ->reduce(function(Collection $carry, array $plugins, string $import) {
                $carry->push('import { ' . implode(', ', $plugins) . ' } from "' . $import . '";');

                return $carry;
            }, Collection::empty())->join("\n");
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
}
