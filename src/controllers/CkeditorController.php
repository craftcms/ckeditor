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
use craft\elements\Entry;
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

        // it's okay to limit to provided siteId, as we're "just" after the card html;
        // all the hard work has already been done
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
        $targetEntryTypeIds = $this->request->getBodyParam('targetEntryTypeIds');
        $targetOwnerId = $this->request->getBodyParam('targetOwnerId');
        $targetLayoutElementUid = $this->request->getBodyParam('targetLayoutElementUid');
        $targetFieldId = null;

        $entry = Craft::$app->getEntries()->getEntryById($entryId, null, [
            'status' => null,
            'revisions' => null,
            'preferSites' => [$siteId],
        ]);

        if (!$entry) {
            throw new BadRequestHttpException("Invalid entry ID: $entryId");
        }

        // check if the target field accepts the entry type we're trying to duplicate
        if ($targetEntryTypeIds !== null) {
            if (!in_array($entry->typeId, $targetEntryTypeIds)) {
                return $this->asFailure(
                    Craft::t('ckeditor', 'This field doesn’t allow nested {type} entries.', [
                        'type' => $entry->getType()->getUiLabel(),
                    ])
                );
            }
        }

        // get ID of the field we're duplicating (e.g. pasting) into
        if ($targetLayoutElementUid !== null) {
            if ($targetOwnerId !== null && $entry->primaryOwnerId !== $targetOwnerId) {
                $owner = Craft::$app->getElements()->getElementById($targetOwnerId);
            } else {
                $owner = $entry->getOwner();
            }
            /** @var CustomField $layoutElement */
            $layoutElement = $owner->getFieldLayout()->getElementByUid($targetLayoutElementUid);
            /** @var Field $field */
            $field = $layoutElement->getField();
            $targetFieldId = $field->id;
        }

        $newAttrs = [];
        if ($siteId !== null && $entry->siteId !== $siteId) {
            $newAttrs['siteId'] = $siteId;
        }
        if ($targetOwnerId !== null && $entry->primaryOwnerId !== $targetOwnerId) {
            $newAttrs['primaryOwnerId'] = $targetOwnerId;
        }
        if ($targetFieldId !== null && $entry->fieldId !== $targetFieldId) {
            $newAttrs['fieldId'] = $targetFieldId;
        }

        try {
            $newEntry = Craft::$app->getElements()->duplicateElement($entry, $newAttrs);
        } catch (Throwable $e) {
            return $this->asFailure(Craft::t('app', 'Couldn’t duplicate {type}.', [
                'type' => $entry::lowerDisplayName(),
            ]), ['additionalMessage' => $e->getMessage()]);
        }

        return $this->asJson([
            'newEntryId' => $newEntry->id,
        ]);
    }

    /**
     * Returns image permissions.
     *
     * @return Response
     * @throws NotFoundHttpException
     * @throws \yii\base\InvalidConfigException
     * @throws \yii\web\BadRequestHttpException
     */
    public function actionImagePermissions(): Response
    {
        $assetId = $this->request->getRequiredBodyParam('assetId');

        $asset = Asset::find()
            ->id($assetId)
            ->kind('image')
            ->one();

        if (!$asset) {
            throw new NotFoundHttpException('Image not found');
        }

        $userSession = Craft::$app->getUser();
        $volume = $asset->getVolume();

        $previewable = Craft::$app->getAssets()->getAssetPreviewHandler($asset) !== null;
        $editable = (
            $asset->getSupportsImageEditor() &&
            $userSession->checkPermission("editImages:$volume->uid") &&
            ($userSession->getId() == $asset->uploaderId || $userSession->checkPermission("editPeerImages:$volume->uid"))
        );

        return $this->asJson([
            'previewable' => $previewable,
            'editable' => $editable,
        ]);
    }
}
