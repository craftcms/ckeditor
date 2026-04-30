<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace craft\ckeditor\controllers;

use Craft;
use craft\ckeditor\Plugin;
use craft\ckeditor\jobs\ReplaceReferences;
use craft\controllers\DeleteElementsController;
use craft\db\Query;
use craft\db\Table;
use craft\helpers\Cp;
use craft\helpers\Db;
use craft\helpers\Html;
use craft\helpers\Queue;
use yii\web\Response;

/**
 * Replace References controller
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 * @since 5.6.0
 */
class ReplaceReferencesController extends DeleteElementsController
{
    public function actionModal(): Response
    {
        $this->requireAcceptsJson();

        $targetElementIds = $this->elements->ids();

        return $this->asCpModal()
            ->action('ckeditor/replace-references/replace')
            ->contentHtml(fn() =>
                Cp::elementSelectFieldHtml([
                    'label' => Craft::t('app', 'Choose a new {type}', [
                        'type' => $this->elementType::lowerDisplayName(),
                    ]),
                    'name' => 'newTargetId',
                    'elementType' => $this->elementType,
                    'criteria' => [
                        'id' => $targetElementIds->map(fn(int $id) => "not $id")->all(),
                    ],
                    'single' => true,
                ]) .
                Html::hiddenInput('elementType', $this->elementType) .
                $targetElementIds->map(fn(int $id) => Html::hiddenInput('elementIds[]', (string)$id))->join('') .
                Html::hiddenInput('hardDelete', $this->hardDelete ? '1' : '0')
            )
            ->submitButtonLabel(Craft::t('app', 'Replace'));
    }

    public function actionReplace(): Response
    {
        $this->requirePostRequest();
        $this->requireAcceptsJson();

        $newTargetId = $this->request->getBodyParam('newTargetId');

        if (!$newTargetId) {
            return $this->asFailure(Craft::t('app', 'No new {type} selected.', [
                'type' => $this->elementType::lowerDisplayName(),
            ]));
        }

        $oldTargetIds = $this->elements->ids()->all();

        $refsQuery = (new Query())
            ->select(['r.fieldInstanceUid', 'r.sourceId', 'r.sourceSiteId', 'e.type'])
            ->from(['r' => Plugin::TABLE_REFERENCES])
            ->innerJoin(['e' => Table::ELEMENTS], '[[e.id]] = [[r.sourceId]]')
            ->where(['r.targetId' => $oldTargetIds]);

        $groupedRefs = [];
        $refCount = 0;

        foreach (Db::each($refsQuery) as $ref) {
            $groupedRefs[$ref['type']][$ref['sourceSiteId']][] = [
                'fieldInstanceUid' => $ref['fieldInstanceUid'],
                'sourceId' => (int)$ref['sourceId'],
            ];
            $refCount++;
        }

        foreach ($groupedRefs as $sourceElementType => $typeRefs) {
            foreach ($typeRefs as $sourceSiteId => $siteRefs) {
                Queue::push(new ReplaceReferences([
                    'sourceElementType' => $sourceElementType,
                    'sourceSiteId' => $sourceSiteId,
                    'targetElementType' => $this->elementType,
                    'refs' => $siteRefs,
                    'oldTargetIds' => $oldTargetIds,
                    'newTargetId' => $newTargetId,
                ]));
            }
        }

        return $this->asSuccess(Craft::t('ckeditor', '{numReferences, plural, =1{Reference} other{References}} queued to be replaced.', [
            'numReferences' => $refCount,
        ]));
    }
}
