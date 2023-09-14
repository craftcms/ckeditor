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
        ]);
    }

//    public function actionEntryCards(): Response
//    {
//        $pairs = $this->request->getRequiredBodyParam('pairs');
//        $entries = [];
//
//        foreach ($pairs as $pair) {
//            $entry = Craft::$app->getEntries()->getEntryById($pair['entryId'], $pair['siteId'], [
//                // TODO: include drafts, soft-deleted, and in general any status
//                'status' => null,
//                'revisions' => false,
//            ]);
//
//            if (!$entry) {
//                // if for any reason we can't get this entry - fail silently
//                $entries[] = [];
//                Craft::warning("Couldn’t get entry (id: {$pair['entryId']}, siteId: {$pair['siteId']}) for CKEditor");
//            } else {
//                $entries[] = [
//                    'id' => $entry->id,
//                    'siteId' => $entry->siteId,
//                    'title' => $entry->title,
//                    'status' => $entry->getStatus(),
//                    'cpEditUrl' => $entry->getCpEditUrl(),
//                ];
//            }
//        }
//
//        return $this->asJson($entries);
//    }

    public function actionEntryCardHtml(): Response
    {
        $entryId = $this->request->getRequiredBodyParam('entryId');
        $siteId = $this->request->getBodyParam('siteId');

        $entryCard = [];

        $entry = Craft::$app->getEntries()->getEntryById($entryId, $siteId, [
            // TODO: include drafts, soft-deleted, and in general any status
            'status' => null,
            'revisions' => false,
        ]);

        if (!$entry) {
            // if for any reason we can't get this entry - fail silently
            Craft::warning("Couldn’t get entry (id: $entryId, siteId: $siteId) for CKEditor");
        } else {
            $entryCard = [
                'id' => $entry->id,
                'siteId' => $entry->siteId,
                'title' => $entry->title,
                'status' => $entry->getStatus(),
                'cpEditUrl' => $entry->getCpEditUrl(),
                'cardHtml' => $entry->getCardBodyHtml(),
            ];
        }


        return $this->asJson($entryCard);
    }
}
