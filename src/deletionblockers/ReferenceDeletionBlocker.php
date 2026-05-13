<?php

/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license MIT
 */

namespace craft\ckeditor\deletionblockers;

use Craft;
use craft\base\ElementInterface;
use craft\ckeditor\Plugin;
use craft\db\Query;
use craft\elements\deletionblockers\BaseDeletionBlocker;
use craft\helpers\Html;

/**
 * @since 5.6.0
 */
class ReferenceDeletionBlocker extends BaseDeletionBlocker
{
    private int $referenceCount;

    public function init()
    {
        $this->referenceCount = (new Query())
            ->from(Plugin::TABLE_REFERENCES)
            ->where([
                'targetId' => $this->elements->ids()->all(),
            ])
            ->count();

        parent::init();
    }

    public function isActive(): bool
    {
        return $this->referenceCount !== 0;
    }

    public function getSummary(): string
    {
        /** @var class-string<ElementInterface> $targetElementType */
        $targetElementType = $this->elements->first()::class;

        return Craft::t('ckeditor', 'The {numTargets, plural, =1{{targetTypeSingular} is} other{{targetTypePlural} are}} referenced by CKEditor fields in {numReferences, number} other {numReferences, plural, =1{element} other{elements}}.', [
            'targetTypeSingular' => $targetElementType::lowerDisplayName(),
            'targetTypePlural' => $targetElementType::pluralLowerDisplayName(),
            'numReferences' => $this->referenceCount,
            'numTargets' => $this->elements->count(),
        ]);
    }

    public function getActions(): array
    {
        /** @var class-string<ElementInterface> $targetElementType */
        $targetElementType = $this->elements->first()::class;

        return [
            [
                'icon' => 'swap',
                'label' => Craft::t('ckeditor', 'Replace {numReferences, plural, =1{reference} other{references}}', [
                    'numReferences' => $this->referenceCount,
                ]),
                'callback' => Html::jsWithVars(fn(
                    $targetElementType,
                    $targetIds,
                    $hardDelete,
                ) => <<<JS
new Craft.CpModal('ckeditor/replace-references/modal', {
  params: {
    elementType: $targetElementType,
    elementIds: $targetIds,
    hardDelete: $hardDelete,
  },
  onSubmit: (ev) => {
    resolve(ev.response.data.message);
  },
  onCancel: () => {
    reject();
  },
});
JS, [
                    $targetElementType,
                    $this->elements->ids()->all(),
                    $this->hardDelete,
                ]),
            ],
            [
                'icon' => 'xmark',
                'label' => Craft::t('ckeditor', 'Ignore {numReferences, plural, =1{reference} other{references}}', [
                    'numReferences' => $this->referenceCount,
                ]),
                'callback' => 'resolve();',
            ],
        ];
    }
}
