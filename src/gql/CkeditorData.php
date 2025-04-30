<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace craft\ckeditor\gql;

use craft\ckeditor\data\FieldData;
use craft\gql\base\ObjectType;
use craft\gql\resolvers\elements\Entry as EntryResolver;
use GraphQL\Type\Definition\ResolveInfo;

/**
 * GraphQL data type
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 * @since 4.8.0
 */
class CkeditorData extends ObjectType
{
    protected function resolve(mixed $source, array $arguments, mixed $context, ResolveInfo $resolveInfo): mixed
    {
        /** @var FieldData $source */
        $fieldName = $resolveInfo->fieldName;
        /** @phpstan-ignore-next-line */
        return match ($fieldName) {
            'html' => $source->getParsedContent(),
            'rawHtml' => $source->getRawContent(),
            'markdown' => $source->getMarkdown($arguments),
            'plainText' => $source->getPlainText(),
            'entries' => EntryResolver::resolve($source, $arguments, $context, $resolveInfo),
        };
    }
}
