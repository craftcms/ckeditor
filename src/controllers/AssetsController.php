<?php

namespace craft\ckeditor\controllers;

use Craft;
use craft\ckeditor\Field;
use craft\elements\Asset;
use craft\helpers\Db;
use craft\web\Controller;
use craft\web\View;
use yii\base\ExitException;
use yii\base\InvalidConfigException;
use yii\web\BadRequestHttpException;
use yii\web\Response;

/**
 * Assets controller
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 * @since 1.2.0
 */
class AssetsController extends Controller
{
    public function beforeAction($action): bool
    {
        if (!parent::beforeAction($action)) {
            return false;
        }

        $this->requireCpRequest();
        return true;
    }

    /**
     * @throws ExitException
     * @throws InvalidConfigException
     * @throws BadRequestHttpException
     */
    public function actionBrowse(?string $kind = null): Response
    {
        $funcNum = $this->request->getRequiredQueryParam('CKEditorFuncNum');
        $field = $this->_field();
        $title = Craft::t('ckeditor', 'Select asset');

        $criteria = [
            'kind' => $kind,
        ];

        if ($field->showUnpermittedFiles) {
            $criteria['uploaderId'] = null;
        }

        if ($field->defaultTransform) {
            $transform = Craft::$app->getImageTransforms()->getTransformByUid($field->defaultTransform);
        }

        $this->view->registerJsWithVars(function($funcNum, $elementType, $defaultTransform, $settings) {
            return <<<JS
const resolve = (assetId, assetUrl, transform) => {
    const url = `\${assetUrl}#asset:\${assetId}:\${transform ? 'transform:' + transform : 'url'}`;
    window.opener.CKEDITOR.tools.callFunction($funcNum, url);
    window.close();
};

const reject = error => {
    window.opener.CKEDITOR.tools.callFunction($funcNum, null, error);
    window.close();
};

const settings = Object.assign($settings, {
    onSelect: function(assets, selectedTransform) {
        if (!assets.length) {
            return;
        }

        const asset = assets.pop();
        const isImage = asset.\$element.data('kind') === 'image';
        const isTransform = isImage && /(.*)(_[a-z0-9+].*\/)(.*)/.test(asset.url);

        // If transform was selected or we don't have a default, no _real_ processing.
        if (!isImage || isTransform || !$defaultTransform) {
            const transform = isImage ? (isTransform ? selectedTransform : $defaultTransform) : null;
            resolve(asset.id, asset.url, transform);
        } else {
            Craft.sendActionRequest('POST', 'assets/generate-transform', {
                data: {
                    assetId: asset.id,
                    handle: $defaultTransform,
                },
            }).then(response => {
                resolve(asset.id, response.data.url, $defaultTransform);
            }).catch(reject);
        }
    },
    
    onHide: () => {
        window.close();
    },
});

Craft.createElementSelectorModal($elementType, settings)
JS;
        }, [
            $funcNum,
            Asset::class,
            $transform->handle ?? null,
            [
                'storageKey' => "CKEditor:$field->id:" . ($kind ?? '*'),
                'sources' => $this->_sources($field),
                'criteria' => $criteria,
                'transforms' => $this->_transforms($field),
                'multiSelect' => false,
                'showSiteMenu' => false,
                'modalTitle' => $title,
                'fullscreen' => true,
                'hideOnShadeClick' => false,
                'hideOnSelect' => false,
                'resizable' => false,
            ],
        ]);

        return $this->renderTemplate('_layouts/base', [
            'title' => $title,
        ], View::TEMPLATE_MODE_CP);
    }

    /**
     * @return Field
     * @throws BadRequestHttpException
     */
    private function _field(): Field
    {
        $fieldId = $this->request->getRequiredQueryParam('fieldId');
        $field = Craft::$app->getFields()->getFieldById($fieldId);
        if (!$field instanceof Field) {
            throw new BadRequestHttpException("Invalid CKEditor field ID: $fieldId");
        }
        return $field;
    }

    private function _sources(Field $field): array
    {
        if (!$field->availableVolumes) {
            throw new BadRequestHttpException('The CKEditor field does not have access to any volumes.');
        }

        $criteria = ['parentId' => ':empty:'];

        $allVolumes = Craft::$app->getVolumes()->getAllVolumes();
        $allowedVolumes = [];
        $userService = Craft::$app->getUser();

        foreach ($allVolumes as $volume) {
            $allowedBySettings = $field->availableVolumes === '*' || (is_array($field->availableVolumes) && in_array($volume->uid, $field->availableVolumes));
            if ($allowedBySettings && ($field->showUnpermittedVolumes || $userService->checkPermission("viewVolume:$volume->uid"))) {
                $allowedVolumes[] = $volume->uid;
            }
        }

        $criteria['volumeId'] = Db::idsByUids('{{%volumes}}', $allowedVolumes);

        $folders = Craft::$app->getAssets()->findFolders($criteria);

        // Sort volumes in the same order as they are sorted in the CP
        $sortedVolumeIds = Craft::$app->getVolumes()->getAllVolumeIds();
        $sortedVolumeIds = array_flip($sortedVolumeIds);

        $sources = [];

        usort($folders, function($a, $b) use ($sortedVolumeIds) {
            // In case Temporary volumes ever make an appearance in RTF modals, sort them to the end of the list.
            $aOrder = $sortedVolumeIds[$a->volumeId] ?? PHP_INT_MAX;
            $bOrder = $sortedVolumeIds[$b->volumeId] ?? PHP_INT_MAX;

            return $aOrder - $bOrder;
        });

        foreach ($folders as $folder) {
            $sources[] = "folder:$folder->uid";
        }

        return $sources;
    }

    private function _transforms(Field $field): array
    {
        if (!$field->availableTransforms) {
            return [];
        }

        $transforms = [];

        foreach (Craft::$app->getImageTransforms()->getAllTransforms() as $transform) {
            if (!is_array($field->availableTransforms) || in_array($transform->uid, $field->availableTransforms, false)) {
                $transforms[] = [
                    'handle' => $transform->handle,
                    'name' => $transform->name,
                ];
            }
        }

        return $transforms;
    }
}
