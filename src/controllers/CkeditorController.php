<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace craft\ckeditor\controllers;

use Craft;
use craft\ckeditor\Field;
use craft\elements\Asset;
use craft\fieldlayoutelements\CustomField;
use craft\web\Controller;
use Throwable;
use yii\web\BadRequestHttpException;
use yii\web\NotFoundHttpException;
use yii\web\Response;
use yii\web\ServerErrorHttpException;

/**
 * CKEditor controller
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 * @since 3.4.0
 */
class CkeditorController extends Controller
{
    public function beforeAction($action): bool
    {
        if (!parent::beforeAction($action)) {
            return false;
        }

        $this->requireCpRequest();
        return true;
    }

    public function actionImageUrl(): Response
    {
        $assetId = $this->request->getRequiredBodyParam('assetId');
        $transform = $this->request->getBodyParam('transform');

        $asset = Asset::find()
            ->id($assetId)
            ->kind('image')
            ->one();

        if (!$asset) {
            throw new NotFoundHttpException('Image not found');
        }

        return $this->asJson([
            'url' => $asset->getUrl($transform, false),
            'width' => $asset->getWidth($transform),
            'height' => $asset->getHeight($transform),
        ]);
    }

    /**
     * Return card html for entry based on entryId and siteId params.
     *
     * @return Response
     * @throws \yii\web\BadRequestHttpException
     */
    public function actionEntryCardHtml(): Response
    {
        $entryId = $this->request->getRequiredBodyParam('entryId');
        $siteId = $this->request->getBodyParam('siteId');
        $layoutElementUid = $this->request->getBodyParam('layoutElementUid');

        $entry = Craft::$app->getEntries()->getEntryById($entryId, $siteId, [
            'status' => null,
            'revisions' => null,
        ]);

        if (!$entry) {
            throw new BadRequestHttpException("Invalid entry ID: $entryId");
        }

        $owner = $entry->getOwner();
        /** @var CustomField $layoutElement */
        $layoutElement = $owner->getFieldLayout()->getElementByUid($layoutElementUid);
        /** @var Field $field */
        $field = $layoutElement->getField();
        $cardHtml = $field->getCardHtml($entry);
        $view = Craft::$app->getView();

        return $this->asJson([
            'cardHtml' => $cardHtml,
            'headHtml' => $view->getHeadHtml(),
            'bodyHtml' => $view->getBodyHtml(),
        ]);
    }

    /**
     * Duplicates a nested entry and returns the duplicate’s ID.
     *
     * @return Response
     * @throws BadRequestHttpException
     * @throws ServerErrorHttpException
     * @since 4.0.0
     */
    public function actionDuplicateNestedEntry(): Response
    {
        $entryId = $this->request->getRequiredBodyParam('entryId');
        $siteId = $this->request->getBodyParam('siteId');
        $entry = Craft::$app->getEntries()->getEntryById($entryId, $siteId, [
            'status' => null,
            'revisions' => null,
        ]);

        if (!$entry) {
            throw new BadRequestHttpException("Invalid entry ID: $entryId");
        }

        try {
            $newEntry = Craft::$app->getElements()->duplicateElement($entry);
        } catch (Throwable $e) {
            return $this->asFailure(Craft::t('app', 'Couldn’t duplicate {type}.', [
                'type' => $entry::lowerDisplayName(),
            ]), ['additionalMessage' => $e->getMessage()]);
        }

        return $this->asJson([
            'newEntryId' => $newEntry->id,
        ]);
    }
}
