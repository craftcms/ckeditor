<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace craft\ckeditor\jobs;

use Craft;
use craft\base\Batchable;
use craft\base\Element;
use craft\base\ElementInterface;
use craft\base\FieldLayoutElement;
use craft\ckeditor\Field;
use craft\db\QueryBatcher;
use craft\fieldlayoutelements\CustomField;
use craft\i18n\Translation;
use craft\queue\BaseBatchedElementJob;
use craft\services\Elements;
use Illuminate\Support\Collection;
use Throwable;

/**
 * Replace References controller
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 * @since 5.6.0
 */
class ReplaceReferences extends BaseBatchedElementJob
{
    /**
     * @var class-string<ElementInterface> The element type that contains the relations
     */
    public string $sourceElementType;

    /**
     * @var int The source elements’ site ID
     */
    public int $sourceSiteId;

    /**
     * @var class-string<ElementInterface> The element type that is being related
     */
    public string $targetElementType;

    /**
     * @var array References
     */
    public array $refs;

    /**
     * @var int[] The element IDs to replace
     */
    public array $oldTargetIds;

    /**
     * @var int The element ID to use as a replacement
     */
    public int $newTargetId;

    /**
     * @inheritdoc
     */
    protected function loadData(): Batchable
    {
        $query = $this->sourceElementType::find()
            ->id(array_map(fn(array $ref) => $ref['sourceId'], $this->refs))
            ->siteId($this->sourceSiteId)
            ->orderBy([
                'elements.id' => SORT_ASC,
            ]);

        return new QueryBatcher($query);
    }

    /**
     * @inheritdoc
     */
    protected function processItem(mixed $item): void
    {
        /** @var ElementInterface $item */
        $refs = Collection::make($this->refs)
            ->filter(fn(array $ref) => $ref['sourceId'] === $item->id)
            ->groupBy(fn(array $ref) => $ref['fieldInstanceUid']);

        $fieldLayout = $item->getFieldLayout();
        /** @var CustomField[] $layoutElements */
        $layoutElements = $refs
            ->map(fn($fieldRefs, string $fieldInstanceUid) => $fieldLayout?->getElementByUid($fieldInstanceUid))
            ->filter(fn(FieldLayoutElement $layoutElement) => (
                $layoutElement instanceof CustomField &&
                $layoutElement->getField() instanceof Field
            ));

        if (empty($layoutElements)) {
            return;
        }

        $behavior = $item->getBehavior('customFields');
        $saveElement = false;

        foreach ($layoutElements as $layoutElement) {
            /** @var Field $field */
            $field = $layoutElement->getField();
            $value = $behavior->{$field->handle};

            if (!$value) {
                continue;
            }

            $newValue = preg_replace_callback(Elements::REF_TAG_PATTERN, function(array $matches) {
                $fullMatch = $matches[0];
                $elementType = $matches['elementType'];
                $ref = $matches['ref'];
                $siteId = $matches['site'] ?? null;
                $attribute = $matches['attr'] ?? null;
                $fallback = $matches['fallback'] ?? $fullMatch;

                if (!is_numeric($ref) || !in_array((int)$ref, $this->oldTargetIds)) {
                    return $fullMatch;
                }

                return sprintf(
                    '{%s:%s%s%s%s}',
                    $elementType,
                    $this->newTargetId,
                    $siteId ? "@$siteId" : '',
                    $attribute ? ":$attribute" : '',
                    $fallback ? "||$fallback" : '',
                );
            }, $value);

            if ($value !== $newValue) {
                $item->setFieldValue($field->handle, $newValue);
                $saveElement = true;
            }
        }

        if ($saveElement) {
            $item->setScenario(Element::SCENARIO_ESSENTIALS);
            $item->resaving = true;

            try {
                Craft::$app->getElements()->saveElement($item, false, false);
            } catch (Throwable $e) {
                Craft::$app->getErrorHandler()->logException($e);
            }
        }
    }

    /**
     * @inheritdoc
     */
    protected function defaultDescription(): ?string
    {
        return Translation::prep('app', 'Replacing {type} references', [
            'type' => $this->targetElementType::lowerDisplayName(),
        ]);
    }
}
