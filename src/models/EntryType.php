<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license https://craftcms.github.io/license/
 */

namespace craft\ckeditor\models;

use Craft;
use craft\behaviors\FieldLayoutBehavior;
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
            'label' => $this->expanded ? Craft::t('ckeditor', 'Show as a separate button') : Craft::t('ckeditor', 'Show in a dropdown'),
            'icon' => $this->expanded ? 'eye' : 'eye-slash',
            'iconColor' => 'teal',
        ];

        if ($this->withColor) {
            $indicators[] = [
                'label' => Craft::t('ckeditor', 'Show with color'),
                'icon' => 'brush',
                'iconColor' => 'teal',
            ];
        }

        if ($this->withIcon) {
            $indicators[] = [
                'label' => Craft::t('ckeditor', 'Show with icon'),
                'icon' => 'image',
                'iconColor' => 'teal',
            ];
        }

        if ($this->withText) {
            $indicators[] = [
                'label' => Craft::t('ckeditor', 'Show with text'),
                'icon' => 't',
                'iconColor' => 'teal',
            ];
        }

        return $indicators;
    }

    /**
     * @inheritdoc
     */
    public function getUsageConfig(): array
    {
        $config = parent::getUsageConfig();

        if (isset($this->expanded)) {
            $config['expanded'] = $this->expanded;
        }

        if (isset($this->withColor)) {
            $config['withColor'] = $this->withColor;
        }

        if (isset($this->withIcon)) {
            $config['withIcon'] = $this->withIcon;
        }

        if (isset($this->withText)) {
            $config['withText'] = $this->withText;
        }

        return $config;
    }
}
