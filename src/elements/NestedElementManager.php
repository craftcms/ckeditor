<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license https://craftcms.github.io/license/
 */

namespace craft\ckeditor\elements;

use Closure;
use Craft;
use craft\base\ElementInterface;
use craft\base\NestedElementInterface;
use craft\elements\db\ElementQueryInterface;
use craft\elements\ElementCollection;
use craft\elements\NestedElementManager as BaseNestedElementManager;

/**
 * CKEditor's adaptation of the Nested Element Manager
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 * @since 5.0.0
 */
class NestedElementManager extends BaseNestedElementManager
{
    /**
     * Constructor
     *
     * @param class-string<NestedElementInterface> $elementType The nested element type.
     * @param Closure(ElementInterface $owner): ElementQueryInterface $queryFactory A factory method which returns a
     * query for fetching nested elements
     * @param array $config name-value pairs that will be used to initialize the object properties.
     */
    public function __construct(
        private readonly string $elementType,
        private readonly Closure $queryFactory,
        array $config = [],
    ) {
        parent::__construct($elementType, $this->queryFactory, $config);
    }

//    /**
//     * @var PropagationMethod The propagation method that the nested elements should use.
//     *
//     *  This can be set to one of the following:
//     *
//     *  - [[PropagationMethod::None]] – Only save elements in the site they were created in
//     *  - [[PropagationMethod::SiteGroup]] – Save elements to other sites in the same site group
//     *  - [[PropagationMethod::Language]] – Save elements to other sites with the same language
//     *  - [[PropagationMethod::Custom]] – Save elements to other sites based on a custom [[$propagationKeyFormat|propagation key format]]
//     *  - [[PropagationMethod::All]] – Save elements to all sites supported by the owner element
//     */
//    public PropagationMethod $propagationMethod = PropagationMethod::All;
//
//    /**
//     * @var string|null The propagation key format that the nested elements should use,
//     * if [[$propagationMethod]] is set to [[PropagationMethod::Custom]].
//     */
//    public ?string $propagationKeyFormat = null;


//    /**
//     * Returns whether the field or attribute should be shown as translatable in the UI, for the given owner element.
//     *
//     * @param ElementInterface|null $owner
//     * @return bool
//     */
//    public function getIsTranslatable(?ElementInterface $owner = null): bool
//    {
//        if ($this->propagationMethod === PropagationMethod::Custom) {
//            return (
//                $owner === null ||
//                Craft::$app->getView()->renderObjectTemplate($this->propagationKeyFormat, $owner) !== ''
//            );
//        }
//
//        return $this->propagationMethod !== PropagationMethod::All;
//    }

    protected function getValue(ElementInterface $owner, bool $fetchAll = false): ElementQueryInterface|ElementCollection
    {
        if (isset($this->attribute)) {
            return $owner->{$this->attribute};
        }

        // we can't just get $owner->getFieldValue($this->fieldHandle)
        // because for CKE field, it'll return the HtmlFieldData and not a query
        $query = $this->nestedElementQuery($owner);

        if ($fetchAll && !$query->getCachedResult()) {
            $query
                ->drafts(null)
                ->status(null)
                ->site('*')
                ->preferSites([$owner->siteId])
                ->limit(null)
                ->unique();
        }

        return $query;
    }

    protected function setValue(ElementInterface $owner, ElementQueryInterface|ElementCollection $value): void
    {
        // as $value we have the IDs of the nested entries that are referenced in the owner's cke field
        // if the owner was duplicated, we need to update the references in the field's html value
        if ($owner->duplicateOf !== null) {
            // if we're creating a draft
            if ($owner->getIsDraft()) {
                $value = $owner->getFieldValue($this->fieldHandle);
            } else {
                // get elementIds for the $owner->duplicateOf
                $oldElementIds = array_map(fn($element) => $element->id, $this->nestedElementQuery($owner->duplicateOf)->all());
                // get elementIds for $owner
                $newElementIds = array_map(fn($element) => $element->id, $value->all());

                // if old and new nested element IDs are the same - just copy the value as is
                if ($oldElementIds == $newElementIds) {
                    $value = $owner->getFieldValue($this->fieldHandle);
                } else {
                    // otherwise, we have to get the field value and replace old element ids with new ones
                    // get field value
                    $fieldValue = $owner->getFieldValue($this->fieldHandle);

                    // and in the field value replace elementIds from original (duplicateOf) with elementIds from the new owner
                    $i = 0;
                    $value = preg_replace_callback(
                        '/(<craftentry\sdata-entryid=")(\d+)("[^>]*>)/is',
                        function(array $match) use ($oldElementIds, $newElementIds, &$i) {
                            $str = $match[1] . $newElementIds[$i] . $match[3];
                            $i++;
                            return $str;

                        },
                        $fieldValue,
                        -1,
                        $i
                    );
                }
            }
        } else {
            //otherwise, we can just save the same value as we have in the owner
            $value = $owner->getFieldValue($this->fieldHandle);
        }

        if (isset($this->attribute)) {
            $owner->{$this->attribute} = $value;
        } else {
            $owner->setFieldValue($this->fieldHandle, $value);
            Craft::$app->getElements()->saveElement($owner, false, false, false, false, false);
        }
    }
}
