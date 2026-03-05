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
    public function beforeAction($action): bool
    {
        if (!parent::beforeAction($action)) {
            return false;
        }

        $this->requireAdmin(false);
        return true;
    }

    /**
     * Applies an entry type indicators depending on config.
     *
     * @return Response
     * @throws BadRequestHttpException
     */
    public function actionApplyEntryTypeIndicators(): Response
    {
        $config = Component::cleanseConfig($this->request->getRequiredBodyParam('config'));

        // get entry type by id
        $entryType = Field::entryType($config);

        if (!$entryType) {
            throw new BadRequestHttpException('Invalid entry type.');
        }

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

    /**
     * Renders the “Image Field” setting based on the updated entry type selections.
     */
    public function actionRenderImageField(): Response
    {
        $namespace = $this->request->getRequiredBodyParam('namespace');
        $entryTypes = $this->request->getRequiredBodyParam('entryTypes');
        $currentValue = $this->request->getBodyParam('value');

        $field = new Field();

        if ($currentValue) {
            [$field->imageEntryTypeUid, $field->imageFieldUid] = explode('.', $currentValue, 2);
        }

        $field->setEntryTypes($entryTypes ?: []);

        $html = $this->getView()->namespaceInputs(fn() => $this->getView()->renderTemplate('ckeditor/_image-field-select.twig', [
            'field' => $field,
        ]), $namespace);

        return $this->asJson([
            'html' => $html,
        ]);
    }
}
