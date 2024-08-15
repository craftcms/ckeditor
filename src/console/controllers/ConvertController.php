<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace craft\ckeditor\console\controllers;

use craft\ckeditor\console\actions\ConvertMatrix;
use craft\ckeditor\console\actions\ConvertRedactor;
use craft\console\Controller;

/**
 * Converts existing fields to CKEditor
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 * @since 3.1.0
 */
class ConvertController extends Controller
{
    public $defaultAction = 'redactor';

    /**
     * @inheritdoc
     */
    public function actions(): array
    {
        return array_merge(parent::actions(), [
            'matrix' => ConvertMatrix::class,
            'redactor' => ConvertRedactor::class,
        ]);
    }
}
