<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace craft\ckeditor\controllers;

use Craft;
use craft\base\Element;
use craft\base\ElementInterface;
use craft\ckeditor\Field;
use craft\elements\Asset;
use craft\elements\Entry;
use craft\fieldlayoutelements\CustomField;
use craft\helpers\ElementHelper;
use craft\web\Controller;
use Throwable;
use yii\base\Exception;
use yii\base\InvalidConfigException;
use yii\web\BadRequestHttpException;
use yii\web\ForbiddenHttpException;
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
     * @throws BadRequestHttpException
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
        $entryId = $this->request->getRequiredBodyParam('entryId'); // id of the entry we're going to duplicate
        $sourceSiteId = $this->request->getBodyParam('sourceSiteId');
        $targetSiteId = $this->request->getBodyParam('targetSiteId');
        $targetEntryTypeIds = $this->request->getBodyParam('targetEntryTypeIds');
        $targetOwnerId = $this->request->getBodyParam('targetOwnerId');
        $targetLayoutElementUid = $this->request->getBodyParam('targetLayoutElementUid');
        $targetFieldId = null;

        $entry = Craft::$app->getEntries()->getEntryById($entryId, $sourceSiteId, [
            'status' => null,
            'revisions' => null,
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
                $owner = Craft::$app->getElements()->getElementById($targetOwnerId, null, $targetSiteId);
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
        if ($targetSiteId !== null && $entry->siteId !== $targetSiteId) {
            $newAttrs['siteId'] = $targetSiteId;
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
            'newSiteId' => $newEntry->siteId,
        ]);
    }

    /**
     * Returns image permissions.
     *
     * @return Response
     * @throws NotFoundHttpException
     * @throws InvalidConfigException
     * @throws BadRequestHttpException
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

    /**
     * Return element rendered for the control panel and the IDs of the sites it supports.
     *
     * @return Response
     * @throws BadRequestHttpException
     * @throws Exception
     * @since 5.0.0
     */
    public function actionRenderElementWithSupportedSites(): Response
    {
        $renderResponse = $this->run('/app/render-elements');
        $siteIds = [];

        $elementParam = $this->request->getRequiredBodyParam('elements')[0];

        /** @var ElementInterface|null $element */
        $element = $elementParam['type']::find()
            ->id($elementParam['id'])
            ->drafts(null)
            ->revisions(null)
            ->siteId($elementParam['siteId'])
            ->status(null)
            ->one();

        if ($element) {
            $sites = ElementHelper::supportedSitesForElement($element);
            $siteIds = array_map(fn($site) => $site['siteId'], $sites);
        }

        return $this->asJson([
            'elements' => $renderResponse->data['elements'],
            'headHtml' => $renderResponse->data['headHtml'],
            'bodyHtml' => $renderResponse->data['bodyHtml'],
            'siteIds' => $siteIds,
        ]);
    }

    public function actionCreateImageEntry(): Response
    {
        $fieldId = $this->request->getRequiredBodyParam('fieldId');
        $ownerId = $this->request->getRequiredBodyParam('ownerId');
        $siteId = $this->request->getRequiredBodyParam('siteId');
        $assetIds = $this->request->getRequiredBodyParam('assetIds');

        $owner = Craft::$app->getElements()->getElementById($ownerId, siteId: $siteId);
        if (!$owner) {
            throw new BadRequestHttpException("Invalid owner ID: $ownerId");
        }

        $elementsService = Craft::$app->getElements();
        if (!$elementsService->canSave($owner)) {
            throw new ForbiddenHttpException('User not authorized to create this element.');
        }

        $field = Craft::$app->getFields()->getFieldById($fieldId);
        if (!$field instanceof Field) {
            throw new BadRequestHttpException("Invalid CKEditor field: $fieldId");
        }

        $imageEntryType = $field->getImageEntryType();
        $imageField = $field->getImageField();

        if (
            $field->imageMode !== Field::IMAGE_MODE_ENTRIES ||
            !$imageEntryType ||
            !$imageField
        ) {
            throw new BadRequestHttpException("Invalid CKEditor field: $fieldId");
        }

        $entry = Craft::$app->getElements()->createElement([
            'type' => Entry::class,
            'typeId' => $imageEntryType->id,
            'siteId' => $siteId,
            'fieldId' => $field->id,
            'ownerId' => $ownerId,
            'slug' => ElementHelper::tempSlug(),
        ]);
        $entry->setFieldValue($imageField->handle, $assetIds);

        $entry->setScenario(Element::SCENARIO_ESSENTIALS);
        if (!$elementsService->saveElement($entry)) {
            throw new ServerErrorHttpException(
                sprintf('Could not save the nested entry: %s', implode(', ', $entry->getFirstErrors()))
            );
        }

        return $this->asJson([
            'entryId' => $entry->id,
            'siteId' => $siteId,
        ]);
    }
}
