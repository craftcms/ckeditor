<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace craft\ckeditor\helpers;

use Craft;
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
     * @var array
     */
    public static array $pluginButtonMap = [
        ['plugins' => ['Alignment'], 'buttons' => ['alignment']],
        [
            'plugins' => [
                'AutoImage',
                'CraftEntries',
                'CraftImageInsertUI',
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
            self::$pluginsByPackage[$name] = array_unique(array_merge(self::$pluginsByPackage[$name], $plugins));
        }

        self::$toolbarItems[] = $toolbarItems;
        self::$pluginButtonMap[] = [
            'plugins' => $plugins,
            'buttons' => $toolbarItems,
        ];
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
