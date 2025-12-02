<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace craft\ckeditor\gql;

use Craft;
use craft\ckeditor\data\BaseChunk;
use craft\ckeditor\data\Entry;
use craft\ckeditor\data\FieldData;
use craft\ckeditor\data\Markup;
use craft\ckeditor\Field;
use craft\elements\Entry as EntryElement;
use craft\gql\arguments\elements\Entry as EntryArguments;
use craft\gql\base\GeneratorInterface;
use craft\gql\base\ObjectType;
use craft\gql\base\SingleGeneratorInterface;
use craft\gql\GqlEntityRegistry;
use craft\gql\types\generators\EntryType as EntryTypeGenerator;
use craft\helpers\Gql;
use craft\htmlfield\HtmlFieldData;
use GraphQL\Type\Definition\ResolveInfo;
use GraphQL\Type\Definition\Type;

/**
 * GraphQL data type generator
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 * @since 4.8.0
 */
class Generator implements GeneratorInterface, SingleGeneratorInterface
{
    public static function generateTypes(mixed $context = null): array
    {
        return [static::generateType($context)];
    }

    public static function generateType(mixed $context): ObjectType
    {
        /** @var Field $context */
        $handle = $context->layoutElement?->getOriginalHandle() ?? $context->handle;
        $typeName = "{$handle}_CkeditorField";
        return GqlEntityRegistry::getOrCreate($typeName, fn() => new CkeditorData([
            'name' => $typeName,
            'fields' => function() use ($context, $typeName) {
                $entryTypes = EntryTypeGenerator::generateTypes($context);
                $entryArgs = EntryArguments::getArguments();
                $gqlService = Craft::$app->getGql();

                foreach ($context->getEntryTypes() as $entryType) {
                    $entryArgs += $gqlService->getFieldLayoutArguments($entryType->getFieldLayout());
                }

                $markdownArgs = [
                    'header_style' => [
                        'type' => Type::string(),
                        'description' => 'Set to `"setext"` to output H1 and H2 headers using the `===` syntax.',
                    ],
                    'suppress_errors' => [
                        'type' => Type::boolean(),
                        'description' => 'Set to `false` to show warnings when loading malformed HTML.',
                    ],
                    'strip_tags' => [
                        'type' => Type::boolean(),
                        'description' => 'Set to `true` to strip tags that don’t have Markdown equivalents.',
                    ],
                    'strip_placeholder_links' => [
                        'type' => Type::boolean(),
                        'description' => 'Set to `true` to remove `<a>` tags that don’t have `href` attributes.',
                    ],
                    'remove_nodes' => [
                        'type' => Type::string(),
                        'description' => sprintf('Space-separated list of tag names that should be removed (`"%s"` by default).', HtmlFieldData::BASE_MARKDOWN_CONFIG['remove_nodes']),
                    ],
                    'hard_break' => [
                        'type' => Type::boolean(),
                        'description' => 'Set to `true` to turn `<br>` into `\n` instead of `  \n`.',
                    ],
                    'list_item_style' => [
                        'type' => Type::string(),
                        'description' => 'Set the default character for each `<li>` in a `<ul>`. Can be `"-"`, `"*"`, or `"+"`.',
                    ],
                    'preserve_comments' => [
                        'type' => Type::boolean(),
                        'description' => 'Set to `true` to preserve comments.',
                    ],
                    'use_autolinks' => [
                        'type' => Type::boolean(),
                        'description' => 'Set to `false` to always use the `[]()` link syntax.',
                    ],
                    'table_pipe_escape' => [
                        'type' => Type::string(),
                        'description' => 'String for pipe characters inside Markdown table cells (`"\\\|"` by default).',
                    ],
                    'table_caption_side' => [
                        'type' => Type::string(),
                        'description' => 'Set to `"bottom"` to show `<caption>` content after tables.',
                    ],
                ];

                $fields = [
                    'html' => [
                        'type' => Type::string(),
                        'description' => 'The parsed content as HTML.',
                    ],
                    'rawHtml' => [
                        'type' => Type::string(),
                        'description' => 'The raw HTML value, with reference tags and `<craft-entry>` nodes in-tact.',
                    ],
                    'markdown' => [
                        'type' => Type::string(),
                        'description' => 'The parsed content as Markdown.',
                        'args' => $markdownArgs,
                    ],
                    'plainText' => [
                        'type' => Type::string(),
                        'description' => 'The parsed content as plain text.',
                    ],
                    'chunks' => [
                        'type' => Type::nonNull(Type::listOf(Gql::getUnionType("{$typeName}_chunks", [
                            ...$entryTypes,
                            'CkeditorMarkup' => GqlEntityRegistry::getOrCreate('CkeditorMarkup', fn() => new CkeditorMarkup([
                                'name' => 'CkeditorMarkup',
                                'fields' => fn() => [
                                    'html' => [
                                        'type' => Type::string(),
                                        'description' => 'The parsed chunk value as HTML.',
                                    ],
                                    'rawHtml' => [
                                        'type' => Type::string(),
                                        'description' => 'The raw chunk HTML value, with reference tags in-tact.',
                                    ],
                                    'markdown' => [
                                        'type' => Type::string(),
                                        'description' => 'The parsed chunk value as Markdown.',
                                        'args' => $markdownArgs,
                                    ],
                                    'plainText' => [
                                        'type' => Type::string(),
                                        'description' => 'The parsed chunk value as plain text..',
                                    ],
                                ],
                            ])),
                        ], function(Markup|EntryElement $value) {
                            return $value instanceof EntryElement ? $value->getGqlTypeName() : 'CkeditorMarkup';
                        }))),
                        'description' => 'The content split into chunks of markup and nested entries.',
                        'resolve' => function(mixed $source, array $arguments, mixed $context, ResolveInfo $resolveInfo) {
                            /** @var FieldData $source */
                            return array_map(function(BaseChunk $chunk) {
                                if ($chunk instanceof Entry) {
                                    return $chunk->getEntry();
                                }
                                /** @var Markup $chunk */
                                return $chunk;
                            }, $source->getChunks()->all());
                        },
                    ],
                ];

                if ($entryTypes) {
                    $fields['entries'] = [
                        'type' => Type::nonNull(Type::listOf(Gql::getUnionType("{$typeName}_entries", $entryTypes))),
                        'description' => 'The nested entries within the content.',
                        'args' => $entryArgs,
                    ];
                }

                return Craft::$app->getGql()->prepareFieldDefinitions($fields, $typeName);
            },
        ]));
    }
}
