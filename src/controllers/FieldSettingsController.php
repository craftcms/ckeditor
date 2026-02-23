<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace craft\ckeditor\controllers;

use craft\ckeditor\Field;
use craft\helpers\Component;
use craft\helpers\Cp;
use craft\helpers\Json;
use craft\web\Controller;
use yii\web\BadRequestHttpException;
use yii\web\Response;

/**
 * Field settings controller
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 * @since 5.0.0
 */
class FieldSettingsController extends Controller
{
    /**
     * Applies an entry type indicators depending on config.
     *
     * @return Response
     * @throws BadRequestHttpException
     * @since 5.0.0
     */
    public function actionApplyEntryTypeIndicators(): Response
    {
        $this->requireAdmin(false);

        $config = Component::cleanseConfig($this->request->getRequiredBodyParam('config'));

        // get entry type by id
        $entryType = Field::entryType($config);

        $chip = Cp::chipHtml($entryType, [
            'inputName' => 'entryTypes[]',
            'inputValue' => Json::encode($entryType->toArray(['id', 'name', 'handle', 'expanded'])),
            'checkbox' => false,
            'showActionMenu' => true,
            'showHandle' => true,
            'showIndicators' => true,
            'hyperlink' => true,
            'sortable' => true,
        ]);

        return $this->asJson([
            'chip' => $chip,
        ]);
    }
}
