<?php

/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license MIT
 */

namespace CraftCms\Ckeditor\Data;

use CraftCms\Cms\Support\Facades\Elements;
use CraftCms\HtmlField\HtmlFieldData;

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
            $this->html = Elements::parseRefs($this->rawHtml, $this->siteId);
        }
        return $this->html;
    }

    /**
     * Returns the markup as Markdown.
     *
     * @param array $config HtmlConverter configuration
     * @return string
     * @since 4.8.0
     */
    public function getMarkdown(array $config = []): string
    {
        return HtmlFieldData::toMarkdown($this->getHtml(), $config);
    }

    /**
     * Returns the markup as Markdown.
     *
     * @return string
     * @since 4.8.0
     */
    public function getPlainText(): string
    {
        // link href's and images get removed, so no need to run the HTML through parseRefs()
        return HtmlFieldData::toPlainText($this->rawHtml);
    }
}
