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
     * @var string|null Handle of the Entry Type selected as the source of the converted field's content.
     */
    public ?string $chosenEntryTypeHandle = null;

    /**
     * @var string|null Handle of the new Entry Type created from the Entry Type selected as the source of the converted field's content,
     * minus the selected field.
     */
    public ?string $newEntryTypeHandle = null;

    /**
     * @var string|null Handle of the field selected as the source of the converted field's content.
     */
    public ?string $chosenFieldHandle = null;

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

    /**
     * @inheritdoc
     */
    public function options($actionID): array
    {
        $options = parent::options($actionID);
        switch ($actionID) {
            case 'matrix':
                $options[] = 'chosenEntryTypeHandle';
                $options[] = 'newEntryTypeHandle';
                $options[] = 'chosenFieldHandle';
                break;
        }
        return $options;
    }
}
