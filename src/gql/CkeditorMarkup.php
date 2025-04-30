<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace craft\ckeditor\gql;

use craft\ckeditor\data\Markup;
use craft\gql\base\ObjectType;
use GraphQL\Type\Definition\ResolveInfo;

/**
 * Markup GraphQL data type
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 * @since 4.8.0
 */
class CkeditorMarkup extends ObjectType
{
    protected function resolve(mixed $source, array $arguments, mixed $context, ResolveInfo $resolveInfo): mixed
    {
        /** @var Markup $source */
        /** @phpstan-ignore-next-line */
        return match ($resolveInfo->fieldName) {
            'html' => $source->getHtml(),
            'rawHtml' => $source->rawHtml,
            'markdown' => $source->getMarkdown($arguments),
            'plainText' => $source->getPlainText(),
        };
    }
}
