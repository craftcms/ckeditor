<?php

namespace craft\ckeditor\helpers;

use craft\helpers\ArrayHelper;

/**
 * CkeditorConfigOptions helper
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 * @since 3.0.0
 */
final class CkeditorConfigSchema
{
    private static array $interfaces = [
        'EditorConfig' => [
            'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_core_editor_editorconfig-EditorConfig.html',
            'properties' => [
                'alignment' => ['interface' => 'AlignmentConfig'],
                'codeBlock' => ['interface' => 'CodeBlockConfig'],
                'heading' => ['interface' => 'HeadingConfig'],
                'htmlEmbed' => ['interface' => 'HtmlEmbedConfig'],
                'htmlSupport' => ['interface' => 'GeneralHtmlSupportConfig'],
                'image' => ['interface' => 'ImageConfig'],
                'language' => ['type' => 'string | LanguageConfig'],
                'licenseKey' => ['type' => 'string'],
                'link' => ['interface' => 'LinkConfig'],
                'list' => ['interface' => 'ListConfig'],
                'placeholder' => ['type' => 'string | Record<string, string>'],
                'plugins' => [
                    'interface' => 'PluginList',
                    'default' => '__PLUGIN_LIST__',
                ],
                'removePlugins' => ['interface' => 'PluginList'],
                'style' => ['interface' => 'StyleConfig'],
                'table' => ['interface' => 'TableConfig'],
                'toolbar' => ['interface' => 'ToolbarConfig'],
                'wordCount' => ['interface' => 'WordCountConfig'],
            ],
            'nested' => [
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
                                            'classNaame' => ['type' => 'string'],
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
                    'nested' => [
                        'SupportedOption' => [
                            'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_alignment_alignmentconfig-SupportedOption.html',
                            'enum' => ['left', 'right', 'center', 'justify'],
                        ],
                    ],
                ],
                'ClassList' => [
                    'title' => 'Class name or list of class names',
                    'oneOf' => [
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
                    'nested' => [
                        'CodeBlockLanguageDefinition' => [
                            'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_code-block_codeblockconfig-CodeBlockLanguageDefinition.html',
                            'properties' => [
                                'class' => ['type' => 'string'],
                                'label' => ['type' => 'string'],
                                'language' => ['type' => 'string'],
                            ],
                            'required' => ['label', 'language'],
                        ],
                    ],
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
                'ElementDefinition' => [
                    'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_view_elementdefinition-ElementDefinition.html',
                    'oneOf' => [
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
                    'default' => [
                        'options' => [
                            ['model' => 'paragraph', 'title' => 'Paragraph', 'class' => 'ck-heading_paragraph'],
                            ['model' => 'heading1', 'view' => 'h1', 'title' => 'Heading 1', 'class' => 'ck-heading_heading1'],
                            ['model' => 'heading2', 'view' => 'h2', 'title' => 'Heading 2', 'class' => 'ck-heading_heading2'],
                        ],
                    ],
                    'nested' => [
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
                    ],
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
                        'resizeOptions' => [
                            'type' => 'array',
                            'items' => ['interface' => 'ImageResizeOption'],
                        ],
                        'resizeUnit' => ['enum' => ['px', '%']],
                        'styles' => ['interface' => 'ImageStyleConfig'],
                        'toolbar' => [
                            'type' => 'array',
                            'items' => [
                                'anyOf' => [
                                    ['type' => 'string'],
                                    ['interface' => 'ImageStyleDropdownDefinition'],
                                ],
                            ],
                        ],
                    ],
                    'nested' => [
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
                        'ImageResizeOption' => [
                            'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_image_imageconfig-ImageResizeOption.html',
                            'properties' => [
                                'icon' => ['type' => 'string'],
                                'label' => ['type' => 'string'],
                                'name' => ['type' => 'string'],
                                'value' => ['type' => ['string', 'null']],
                            ],
                            'required' => ['name'],
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
                            'nested' => [
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
                            ],
                        ],
                        'ImageStyleDropdownDefinition' => [
                            'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_image_imageconfig-ImageStyleDropdownDefinition.html',
                            'properties' => [
                                'defaultItem' => ['type' => 'string'],
                                'items' => [
                                    'type' => 'array',
                                    'items' => ['type' => 'string'],
                                ],
                                'name' => ['type' => 'string'],
                                'title' => ['type' => 'string'],
                            ],
                            'required' => ['defaultItem', 'items', 'name'],
                        ],
                    ],
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
                    'nested' => [
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
                    ],
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
                    'nested' => [
                        'ListPropertiesConfig' => [
                            'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_list_listconfig-ListPropertiesConfig.html',
                            'properties' => [
                                'reversed' => ['type' => 'boolean'],
                                'startIndex' => ['type' => 'boolean'],
                                'styles' => [
                                    'oneOf' => [
                                        ['type' => 'boolean'],
                                        ['interface' => 'ListPropertiesStyleConfig'],
                                    ],
                                ],
                            ],
                            'nested' => [
                                'ListPropertiesStyleConfig' => [
                                    'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_list_listconfig-ListPropertiesStyleConfig.html',
                                    'properties' => [
                                        'useAttribute' => ['type' => 'boolean'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                'MatcherPattern' => [
                    'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_view_matcher-MatcherPattern.html',
                    'oneOf' => [
                        ['type' => 'string'],
                        ['interface' => 'MatcherObjectPattern'],
                    ],
                    'nested' => [
                        'MatcherObjectPattern' => [
                            'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_view_matcher-MatcherObjectPattern.html',
                            'properties' => [
                                'attributes' => ['interface' => 'PropertyPatterns'],
                                'classes' => ['interface' => 'PropertyPatterns'],
                                'key' => ['type' => 'string'],
                                'styles' => ['interface' => 'PropertyPatterns'],
                            ],
                        ],
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
                    'nested' => [
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
                    ],
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
                    'nested' => [
                        'ToolbarConfigItem' => [
                            'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_core_editor_editorconfig-ToolbarConfigItem.html',
                            'properties' => [
                                'icon' => [
                                    'oneOf' => [
                                        ['type' => 'string'],
                                        ['enum' => [false]],
                                    ],
                                ],
                                'items' => ['type' => 'array'],
                                'label' => ['type' => 'string'],
                                'tooltip' => ['type' => ['boolean', 'string']],
                                'withText' => ['type' => 'boolean'],
                            ],
                            'required' => ['label'],
                        ],
                        'TableCellPropertiesConfig' => [
                            'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_table_tableconfig-TableCellPropertiesConfig.html',
                            'properties' => [
                                'backgroundColors' => ['interface' => 'TableColorConfig'],
                                'borderColors' => ['interface' => 'TableColorConfig'],
                                'defaultProperties' => ['interface' => 'TableCellPropertiesOptions'],
                            ],
                            'nested' => [
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
                            ],
                        ],
                        'TableColorConfig' => [
                            'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_table_tableconfig-TableColorConfig.html',
                            'type' => 'array',
                            'items' => ['interface' => 'ColorOption'],
                        ],
                        'TablePropertiesConfig' => [
                            'description' => 'https://ckeditor.com/docs/ckeditor5/latest/api/module_table_tableconfig-TablePropertiesConfig.html',
                            'properties' => [
                                'backgroundColors' => 'TableColorConfig',
                                'borderColors' => 'TableColorConfig',
                                'defaultProperties' => 'TablePropertiesOptions',
                            ],
                            'nested' => [
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
                            ],
                        ],
                    ],
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
            ],
        ],
    ];

    public static function create(): array
    {
        return self::applyInterfaces(
            ['interface' => 'EditorConfig'],
            self::$interfaces,
        );
    }

    private static function applyInterfaces(array $item, array $interfaces): array|false
    {
        // using an interface?
        $interface = ArrayHelper::remove($item, 'interface');
        if ($interface) {
            $interfaceDef = array_merge($interfaces[$interface] ?? []);
            $interfaceDef += ['title' => $interface];
            if (
                (
                    $interfaceDef['allOf'] ??
                    $interfaceDef['anyOf'] ??
                    $interfaceDef['oneOf'] ??
                    $interfaceDef['not'] ??
                    $interfaceDef['enum'] ??
                    false
                ) === false
            ) {
                $interfaceDef += ['type' => 'object'];
            }

            // any nested interfaces?
            $nested = ArrayHelper::remove($interfaceDef, 'nested');
            if ($nested) {
                $interfaces = array_merge($interfaces, $nested);
            }

            $item += $interfaceDef;
        }

        foreach ($item as $key => &$value) {
            if (is_array($value)) {
                $value = self::applyInterfaces($value, $interfaces);
                if ($value === false) {
                    unset($item[$key]);
                }
            }
        }

        return $item;
    }
}
