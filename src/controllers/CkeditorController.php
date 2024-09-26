<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace craft\ckeditor\controllers;

use Craft;
use craft\elements\Asset;
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
            'width' => $asset->getWidth($transform),
            'height' => $asset->getHeight($transform),
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
