<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license https://craftcms.github.io/license/
 */

namespace craft\ckeditor\models;

use Craft;
use craft\base\Actionable;
use craft\base\Chippable;
use craft\base\Colorable;
use craft\base\CpEditable;
use craft\base\FieldLayoutProviderInterface;
use craft\base\GqlInlineFragmentInterface;
use craft\base\Iconic;
use craft\base\Indicative;
use craft\behaviors\FieldLayoutBehavior;
use craft\helpers\Inflector;
use craft\models\EntryType as CraftEntryType;

/**
 * EntryType model class.
 *
 * @mixin FieldLayoutBehavior
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 * @since 5.0.0
 */
class EntryType extends CraftEntryType
{
    public bool $withColor = true;
    public bool $withIcon = true;
    public bool $withText = true;
    public bool $expanded = false;


    /**
     * @inheritdoc
     */
    public function getIndicators(): array
    {
        $indicators = parent::getIndicators();

        $indicators[] = [
            'label' => $this->expanded ? Craft::t('ckeditor', 'As a separate button') : Craft::t('ckeditor', 'In a dropdown'),
            'icon' => $this->expanded ? 'eye' : 'eye-slash',
            'iconColor' => 'teal',
        ];

        if ($this->withColor) {
            $indicators[] = [
                'label' => Craft::t('ckeditor', 'With color'),
                'icon' => 'brush',
                'iconColor' => 'teal',
            ];
        }

        if ($this->withIcon) {
            $indicators[] = [
                'label' => Craft::t('ckeditor', 'With icon'),
                'icon' => 'image',
                'iconColor' => 'teal',
            ];
        }

        if ($this->withText) {
            $indicators[] = [
                'label' => Craft::t('ckeditor', 'With text'),
                'icon' => 't',
                'iconColor' => 'teal',
            ];
        }

        return $indicators;
    }
}