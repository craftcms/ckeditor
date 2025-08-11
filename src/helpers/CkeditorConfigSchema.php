<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace craft\ckeditor\helpers;

use craft\ckeditor\Field;
use craft\helpers\ArrayHelper;
use Illuminate\Support\Collection;

/**
 * CkeditorConfigOptions helper
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 * @since 3.0.0
 */
final class CkeditorConfigSchema
{
    private static function interfaces(): array
    {
        return [
            'AlignmentConfig' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_alignment_alignmentconfig-AlignmentConfig.html',
                'properties' => [
                    'options' => [
                        'type' => 'array',
                        'items' => [
                            'anyOf' => [
                                ['interface' => 'SupportedOption'],
                                [
                                    'type' => 'object',
                                    'properties' => [
                                        'className' => ['type' => 'string'],
                                        'name' => ['interface' => 'SupportedOption'],
                                    ],
                                    'required' => ['className', 'name'],
                                ],
                            ],
                        ],
                    ],
                ],
                'default' => [
                    'options' => ['left', 'right'],
                ],
            ],
            'BookmarkConfig' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_bookmark_bookmarkconfig-BookmarkConfig.html',
                'properties' => [
                    'enableNonEmptyAnchorConversion' => ['type' => 'boolean'],
                    'toolbar' => [
                        'type' => 'array',
                        'items' => ['type' => 'string'],
                    ],
                ],
            ],
            'ClassList' => [
                'title' => 'Class name or list of class names',
                'anyOf' => [
                    ['type' => 'string'],
                    [
                        'type' => 'array',
                        'items' => ['type' => 'string'],
                    ],
                ],
            ],
            'CodeBlockConfig' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_code-block_codeblockconfig-CodeBlockConfig.html',
                'properties' => [
                    'indentSequence' => ['type' => 'string'],
                    'languages' => [
                        'type' => 'array',
                        'items' => [
                            'interface' => 'CodeBlockLanguageDefinition',
                        ],
                    ],
                ],
                'default' => [
                    'indentSequence' => '  ',
                    'languages' => [
                        ['label' => 'CSS', 'language' => 'css'],
                        ['label' => 'HTML', 'language' => 'html'],
                        ['label' => 'JavaScript', 'language' => 'javascript'],
                        ['label' => 'Twig', 'language' => 'twig'],
                    ],
                ],
            ],
            'CodeBlockLanguageDefinition' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_code-block_codeblockconfig-CodeBlockLanguageDefinition.html',
                'properties' => [
                    'class' => ['type' => 'string'],
                    'label' => ['type' => 'string'],
                    'language' => ['type' => 'string'],
                ],
                'required' => ['label', 'language'],
            ],
            'ColorOption' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_ui_colorgrid_utils-ColorOption.html',
                'properties' => [
                    'color' => ['type' => 'string'],
                    'hasBorder' => ['type' => 'boolean'],
                    'label' => ['type' => 'string'],
                ],
                'required' => ['color'],
            ],
            'EditorConfig' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_core_editor_editorconfig-EditorConfig.html',
                'properties' => [
                    'alignment' => ['interface' => 'AlignmentConfig'],
                    'bookmark' => ['interface' => 'BookmarkConfig'],
                    'codeBlock' => ['interface' => 'CodeBlockConfig'],
                    'fontBackgroundColor' => ['interface' => 'FontColorConfig'],
                    'fontColor' => ['interface' => 'FontColorConfig'],
                    'fontFamily' => ['interface' => 'FontFamilyConfig'],
                    'fontSize' => ['interface' => 'FontSizeConfig'],
                    'heading' => ['interface' => 'HeadingConfig'],
                    'htmlEmbed' => ['interface' => 'HtmlEmbedConfig'],
                    'htmlSupport' => ['interface' => 'GeneralHtmlSupportConfig'],
                    'image' => ['interface' => 'ImageConfig'],
                    'language' => [
                        'anyOf' => [
                            ['type' => 'string'],
                            ['interface' => 'LanguageConfig'],
                        ],
                        'default' => [
                            'textPartLanguage' => Field::textPartLanguage(),
                        ],
                    ],
                    'licenseKey' => ['type' => 'string'],
                    'link' => ['interface' => 'LinkConfig'],
                    'list' => ['interface' => 'ListConfig'],
                    'placeholder' => [
                        'type' => 'string',
                        'default' => 'Type some text…',
                    ],
                    'removePlugins' => ['interface' => 'PluginList'],
                    'style' => ['interface' => 'StyleConfig'],
                    'table' => ['interface' => 'TableConfig'],
                    'toolbar' => ['interface' => 'ToolbarConfig'],
                    'wordCount' => ['interface' => 'WordCountConfig'],
                ],
            ],
            'ElementDefinition' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_view_elementdefinition-ElementDefinition.html',
                'anyOf' => [
                    ['type' => 'string'],
                    ['interface' => 'ElementObjectDefinition'],
                ],
            ],
            'ElementObjectDefinition' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_view_elementdefinition-ElementObjectDefinition.html',
                'properties' => [
                    'attributes' => ['type' => 'object'],
                    'classes' => ['interface' => 'ClassList'],
                    'name' => ['type' => 'string'],
                    'priority' => ['type' => 'number'],
                    'styles' => ['type' => 'object'],
                ],
                'required' => ['name'],
            ],
            'FontColorConfig' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_font_fontconfig-FontColorConfig.html#member-columns',
                'properties' => [
                    'colors' => [
                        'type' => 'array',
                        'items' => ['interface' => 'ColorOption'],
                    ],
                    'columns' => ['type' => 'integer'],
                    'documentColors' => ['type' => 'integer'],
                ],
            ],
            'FontFamilyConfig' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_font_fontconfig-FontFamilyConfig.html',
                'properties' => [
                    'options' => [
                        'type' => 'array',
                        'items' => [
                            'anyOf' => [
                                ['type' => 'string'],
                                ['interface' => 'FontFamilyOption'],
                            ],
                        ],
                    ],
                    'supportAllValues' => ['type' => 'boolean'],
                ],
            ],
            'FontFamilyOption' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_font_fontconfig-FontFamilyOption.html',
                'properties' => [
                    'model' => ['type' => 'string'],
                    'title' => ['type' => 'string'],
                    'upcastAlso' => [
                        'type' => 'array',
                        'items' => ['interface' => 'MatcherPattern'],
                    ],
                    'view' => ['interface' => 'ElementDefinition'],
                ],
                'required' => ['title'],
            ],
            'FontSizeConfig' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_font_fontconfig-FontSizeConfig.html',
                'properties' => [
                    'options' => [
                        'type' => 'array',
                        'items' => [
                            'anyOf' => [
                                ['type' => 'string'],
                                ['type' => 'integer'],
                                ['interface' => 'FontSizeOption'],
                            ],
                        ],
                    ],
                    'supportAllValues' => ['type' => 'boolean'],
                ],
                'default' => [
                    'options' => [
                        'tiny',
                        'small',
                        'big',
                        'huge',
                    ],
                ],
            ],
            'FontSizeOption' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_font_fontconfig-FontSizeOption.html',
                'properties' => [
                    'model' => ['type' => 'string'],
                    'title' => ['type' => 'string'],
                    'upcastAlso' => [
                        'type' => 'array',
                        'items' => ['interface' => 'MatcherPattern'],
                    ],
                    'view' => ['interface' => 'ElementDefinition'],
                ],
                'required' => ['title'],
            ],
            'GeneralHtmlSupportConfig' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_html-support_generalhtmlsupportconfig-GeneralHtmlSupportConfig.html',
                'properties' => [
                    'allow' => [
                        'type' => 'array',
                        'items' => ['interface' => 'MatcherPattern'],
                    ],
                    'disallow' => [
                        'type' => 'array',
                        'items' => ['interface' => 'MatcherPattern'],
                    ],
                ],
            ],
            'HeadingConfig' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_heading_headingconfig-HeadingConfig.html',
                'properties' => [
                    'options' => [
                        'type' => 'array',
                        'items' => [
                            'anyOf' => [
                                ['interface' => 'HeadingElementOption'],
                                ['interface' => 'HeadingParagraphOption'],
                            ],
                        ],
                    ],
                ],
            ],
            'HeadingElementOption' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_heading_headingconfig-HeadingElementOption.html',
                'properties' => [
                    'class' => ['type' => 'string'],
                    'icon' => ['type' => 'string'],
                    'model' => ['enum' => ['heading1', 'heading2', 'heading3', 'heading4', 'heading5', 'heading6']],
                    'title' => ['type' => 'string'],
                    'view' => ['interface' => 'ElementDefinition'],
                ],
                'required' => ['class', 'model', 'title'],
            ],
            'HeadingParagraphOption' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_heading_headingconfig-HeadingParagraphOption.html',
                'properties' => [
                    'class' => ['type' => 'string'],
                    'icon' => ['type' => 'string'],
                    'model' => ['enum' => ['paragraph']],
                    'title' => ['type' => 'string'],
                ],
                'required' => ['class', 'model', 'title'],
            ],
            'HtmlEmbedConfig' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_html-embed_htmlembedconfig-HtmlEmbedConfig.html',
                'properties' => [
                    'showPreviews' => ['type' => 'boolean'],
                ],
                'default' => [
                    'showPreviews' => false,
                ],
            ],
            'ImageConfig' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_image_imageconfig-ImageConfig.html',
                'properties' => [
                    'insert' => ['interface' => 'ImageInsertConfig'],
                    'styles' => ['interface' => 'ImageStyleConfig'],
                ],
            ],
            'ImageInsertConfig' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_image_imageconfig-ImageInsertConfig.html',
                'properties' => [
                    'type' => ['enum' => ['block', 'inline']],
                    'integrations' => [
                        'type' => 'array',
                        'items' => ['type' => 'string'],
                    ],
                ],
            ],
            'ImageStyleConfig' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_image_imageconfig-ImageStyleConfig.html',
                'properties' => [
                    'options' => [
                        'type' => 'array',
                        'items' => [
                            'anyOf' => [
                                ['type' => 'string'],
                                ['interface' => 'ImageStyleOptionDefinition'],
                            ],
                        ],
                    ],
                ],
            ],
            'ImageStyleOptionDefinition' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_image_imageconfig-ImageStyleOptionDefinition.html',
                'properties' => [
                    'className' => ['type' => 'string'],
                    'icon' => ['type' => 'string'],
                    'isDefault' => ['type' => 'boolean'],
                    'modelElements' => [
                        'type' => 'array',
                        'items' => ['type' => 'string'],
                    ],
                    'name' => ['type' => 'string'],
                    'title' => ['type' => 'string'],
                ],
                'required' => ['icon', 'modelElements', 'name', 'title'],
            ],
            'LanguageConfig' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_core_editor_editorconfig-LanguageConfig.html',
                'properties' => [
                    'content' => ['type' => 'string'],
                    'textPartLanguage' => [
                        'type' => 'array',
                        'items' => ['interface' => 'TextPartLanguageOption'],
                    ],
                    'ui' => ['type' => 'string'],
                ],
            ],
            'LanguageDirection' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_utils_language-LanguageDirection.html',
                'enum' => ['ltr', 'rtl'],
            ],
            'LinkConfig' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_link_linkconfig-LinkConfig.html',
                'properties' => [
                    'addTargetToExternalLinks' => ['type' => 'boolean'],
                    'decorators' => [
                        'type' => 'object',
                        'patternProperties' => [
                            '.*' => [
                                'anyOf' => [
                                    ['type' => 'string'],
                                    ['interface' => 'LinkDecoratorManualDefinition'],
                                ],
                            ],
                        ],
                    ],
                ],
                'default' => [
                    'addTargetToExternalLinks' => true,
                ],
            ],
            'LinkDecoratorManualDefinition' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_link_linkconfig-LinkDecoratorManualDefinition.html',
                'properties' => [
                    'attributes' => ['type' => 'object'],
                    'classes' => ['interface' => 'ClassList'],
                    'defaultValue' => ['type' => 'boolean'],
                    'label' => ['type' => 'string'],
                    'mode' => ['enum' => ['manual']],
                    'styles' => ['type' => 'object'],
                ],
                'required' => ['label', 'mode'],
            ],
            'ListConfig' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_list_listconfig-ListConfig.html',
                'properties' => [
                    'properties' => ['interface' => 'ListPropertiesConfig'],
                ],
                'default' => [
                    'properties' => [
                        'styles' => true,
                        'startIndex' => true,
                        'reversed' => true,
                    ],
                ],
            ],
            'ListPropertiesConfig' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_list_listconfig-ListPropertiesConfig.html',
                'properties' => [
                    'reversed' => ['type' => 'boolean'],
                    'startIndex' => ['type' => 'boolean'],
                    'styles' => [
                        'anyOf' => [
                            ['type' => 'boolean'],
                            ['interface' => 'ListPropertiesStyleConfig'],
                        ],
                    ],
                ],
            ],
            'ListPropertiesStyleConfig' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_list_listconfig-ListPropertiesStyleConfig.html',
                'properties' => [
                    'useAttribute' => ['type' => 'boolean'],
                ],
            ],
            'MatcherObjectPattern' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_view_matcher-MatcherObjectPattern.html',
                'properties' => [
                    'attributes' => ['interface' => 'PropertyPatterns'],
                    'classes' => ['interface' => 'PropertyPatterns'],
                    'key' => ['type' => 'string'],
                    'styles' => ['interface' => 'PropertyPatterns'],
                ],
            ],
            'MatcherPattern' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_view_matcher-MatcherPattern.html',
                'anyOf' => [
                    ['type' => 'string'],
                    ['interface' => 'MatcherObjectPattern'],
                ],
            ],
            'PluginList' => [
                'title' => 'List of plugin names',
                'type' => 'array',
                'items' => ['enum' => '__PLUGIN_LIST__'],
            ],
            'PropertyPatterns' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_view_matcher-PropertyPatterns.html',
                'type' => ['boolean', 'string', 'object', 'array'],
            ],
            'StyleConfig' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_style_styleconfig-StyleConfig.html',
                'properties' => [
                    'definitions' => [
                        'type' => 'array',
                        'items' => ['interface' => 'StyleDefinition'],
                    ],
                ],
                'default' => [
                    'definitions' => [
                        ['name' => 'Red heading', 'element' => 'h2', 'classes' => ['red-heading']],
                        ['name' => 'Vibrant code', 'element' => 'pre', 'classes' => ['vibrant-code']],
                        ['name' => 'Marker', 'element' => 'span', 'classes' => ['marker']],
                    ],
                ],
            ],
            'StyleDefinition' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_style_styleconfig-StyleDefinition.html',
                'properties' => [
                    'classes' => [
                        'type' => 'array',
                        'items' => ['type' => 'string'],
                    ],
                    'element' => ['type' => 'string'],
                    'name' => ['type' => 'string'],
                ],
                'required' => ['classes', 'element', 'name'],
            ],
            'SupportedOption' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_alignment_alignmentconfig-SupportedOption.html',
                'enum' => ['left', 'right', 'center', 'justify'],
            ],
            'TableCellPropertiesConfig' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_table_tableconfig-TableCellPropertiesConfig.html',
                'properties' => [
                    'backgroundColors' => ['interface' => 'TableColorConfig'],
                    'borderColors' => ['interface' => 'TableColorConfig'],
                    'defaultProperties' => ['interface' => 'TableCellPropertiesOptions'],
                ],
            ],
            'TableCellPropertiesOptions' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_table_tableconfig-TableCellPropertiesOptions.html',
                'properties' => [
                    'backgroundColor' => ['type' => 'string'],
                    'borderColor' => ['type' => 'string'],
                    'borderStyle' => ['type' => 'string'],
                    'borderWidth' => ['type' => 'string'],
                    'height' => ['type' => 'string'],
                    'horizontalAlignment' => ['type' => 'string'],
                    'padding' => ['type' => 'string'],
                    'verticalAlignment' => ['type' => 'string'],
                    'width' => ['type' => 'string'],
                ],
            ],
            'TableColorConfig' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_table_tableconfig-TableColorConfig.html',
                'type' => 'array',
                'items' => ['interface' => 'ColorOption'],
            ],
            'TableConfig' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_table_tableconfig-TableConfig.html',
                'properties' => [
                    'contentToolbar' => [
                        'type' => 'array',
                        'items' => ['interface' => 'ToolbarConfigItem'],
                    ],
                    'defaultHeadings' => ['type' => 'object'],
                    'tableCellProperties' => ['interface' => 'TableCellPropertiesConfig'],
                    'tableProperties' => ['interface' => 'TablePropertiesConfig'],
                    'tableToolbar' => [
                        'type' => 'array',
                        'items' => ['interface' => 'ToolbarConfigItem'],
                    ],
                ],
            ],
            'TablePropertiesConfig' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_table_tableconfig-TablePropertiesConfig.html',
                'properties' => [
                    'backgroundColors' => 'TableColorConfig',
                    'borderColors' => 'TableColorConfig',
                    'defaultProperties' => 'TablePropertiesOptions',
                ],
            ],
            'TablePropertiesOptions' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_table_tableconfig-TablePropertiesOptions.html',
                'properties' => [
                    'alignment' => ['type' => 'string'],
                    'backgroundColor' => ['type' => 'string'],
                    'borderColor' => ['type' => 'string'],
                    'borderStyle' => ['type' => 'string'],
                    'borderWidth' => ['type' => 'string'],
                    'height' => ['type' => 'string'],
                    'width' => ['type' => 'string'],
                ],
            ],
            'TextPartLanguageOption' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_language_textpartlanguageconfig-TextPartLanguageOption.html',
                'properties' => [
                    'languageCode' => ['type' => 'string'],
                    'textDirection' => ['interface' => 'LanguageDirection'],
                    'title' => ['type' => 'string'],
                ],
            ],
            'ToolbarConfig' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_core_editor_editorconfig-ToolbarConfig.html',
                'properties' => [
                    'shouldNotGroupWhenFull' => ['type' => 'boolean'],
                ],
                'default' => [
                    'shouldNotGroupWhenFull' => true,
                ],
            ],
            'ToolbarConfigItem' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_core_editor_editorconfig-ToolbarConfigItem.html',
                'properties' => [
                    'icon' => [
                        'anyOf' => [
                            ['type' => 'string'],
                            ['enum' => [false]],
                        ],
                    ],
                    'items' => [
                        'type' => 'array',
                        'items' => ['interface' => 'ToolbarConfigItem'],
                    ],
                    'label' => ['type' => 'string'],
                    'tooltip' => ['type' => ['boolean', 'string']],
                    'withText' => ['type' => 'boolean'],
                ],
                'required' => ['label'],
            ],
            'WordCountConfig' => [
                'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_word-count_wordcountconfig-WordCountConfig.html',
                'properties' => [
                    'displayCharacters' => ['type' => 'boolean'],
                    'displayWords' => ['type' => 'boolean'],
                ],
                'default' => [
                    'displayWords' => true,
                    'displayCharacters' => false,
                ],
            ],
        ];
    }

    public static function create(): array
    {
        // create defs based on the interfaces
        $defs = Collection::make(self::interfaces())
            ->mapWithKeys(function($def, $name) {
                $def += ['title' => $name];
                if ((
                    $def['allOf'] ??
                    $def['anyOf'] ??
                    $def['oneOf'] ??
                    $def['not'] ??
                    $def['enum'] ??
                    false
                ) === false) {
                    $def += ['type' => 'object'];
                }
                return [$name => $def];
            })
            ->all();

        return self::interface2ref([
            'interface' => 'EditorConfig',
            '$defs' => $defs,
        ]);
    }

    private static function interface2ref(array $item): array|false
    {
        $interface = ArrayHelper::remove($item, 'interface');
        if ($interface) {
            $item = ['$ref' => sprintf('#/$defs/%s', $interface)] + $item;
        }

        foreach ($item as &$value) {
            if (is_array($value)) {
                $value = self::interface2ref($value);
            }
        }

        return $item;
    }
}
