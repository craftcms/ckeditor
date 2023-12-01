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
use craft\helpers\ArrayHelper;
use craft\web\Controller;
use yii\web\NotFoundHttpException;
use yii\web\Response;

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

        if ($entry) {
            $owner = $entry->getOwner();
            $layoutElement = $owner->getFieldLayout()->getElementByUid($layoutElementUid);
            $field = $layoutElement->getField();

            $simpleEntryTypes = $field->getEntryTypeSimpleArray();
            $currentEntryType = ArrayHelper::firstWhere($simpleEntryTypes, 'entryType', $entry->typeId);
            if (isset($currentEntryType) && $currentEntryType['useTemplateInCp'] == '1') {
                $innerHtml = $field->getTemplateHtml($entry, $siteId);
            } else {
                $innerHtml = $field->getCardHtml($entry, $siteId);
            }
        }

        if (!isset($innerHtml)) {
            $innerHtml = (new Field())->getCardHtml($entry, $siteId);
        }

        return $this->asJson($innerHtml);
    }
}
