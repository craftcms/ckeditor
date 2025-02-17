<?php

namespace craft\ckeditor\helpers;

use Illuminate\Support\Collection;

final class CkeditorConfig
{
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


    public static function registerPackage(string $name, array $config): void
    {
        self::$pluginsByPackage[$name] = $config['plugins'] ?? [];
        self::$toolbarItems[] = $config['toolbarItems'] ?? [];
    }

    public static function getPluginPackages(): array
    {
        return array_keys(self::$pluginsByPackage);
    }

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

    public static function getAllPlugins(): array
    {
        return collect(self::getPluginsByPackage())
            ->flatten()
            ->toArray();
    }

    public static function getImportStatements(): string
    {
        return collect(self::getPluginsByPackage())
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

    public static function normalizeToolbarItems($items): array
    {
        return collect($items)
            ->map(fn($item) => self::normalizeToolbarItem($item))
            ->toArray();
    }
}
