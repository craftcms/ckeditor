<?php

/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license MIT
 */

namespace craft\ckeditor\data;

use craft\web\twig\SafeHtml;
use yii\base\BaseObject;

/**
 * Represents a chunk of CKEditor content.
 *
 * @property-read string $type
 * @property-read string $html
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 * @since 4.1.0
 */
abstract class BaseChunk extends BaseObject implements SafeHtml
{
    abstract public function getType(): string;
    abstract public function getHtml(): string;

    public function __toString(): string
    {
        return $this->getHtml();
    }
}
