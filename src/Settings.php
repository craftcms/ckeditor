<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license https://craftcms.github.io/license/
 */

namespace craft\ckeditor;

use craft\base\Model;
use craft\behaviors\EnvAttributeParserBehavior;
use craft\validators\UrlValidator;

/**
 * Plugin Settings
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 */
class Settings extends Model
{
    /**
     * @var string The URL to the CKEditor build.
     */
    public string $buildUrl = 'https://cdn.ckeditor.com/ckeditor5/32.0.0/classic/ckeditor.js';

    /**
     * @inheritdoc
     */
    public function behaviors(): array
    {
        $behaviors = parent::behaviors();
        $behaviors['parser'] = [
            'class' => EnvAttributeParserBehavior::class,
            'attributes' => [
                'buildUrl',
            ],
        ];
        return $behaviors;
    }

    /**
     * @inheritdoc
     */
    protected function defineRules(): array
    {
        return [
            ['buildUrl', UrlValidator::class, 'skipOnEmpty' => false],
        ];
    }
}
