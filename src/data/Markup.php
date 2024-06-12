<?php

/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license MIT
 */

namespace craft\ckeditor\data;

use Craft;

/**
 * Represents HTML markup within a CKEditor field’s content.
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 * @since 4.1.0
 */
class Markup extends BaseChunk
{
    private string $html;

    public function __construct(
        public string $rawHtml,
        private readonly int $siteId,
    ) {
    }

    public function getType(): string
    {
        return 'markup';
    }

    public function getHtml(): string
    {
        if (!isset($this->html)) {
            $this->html = Craft::$app->getElements()->parseRefs($this->rawHtml, $this->siteId);
        }
        return $this->html;
    }
}
